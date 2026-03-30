import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Filter, Save, RotateCcw, Trash2, AlertCircle } from "lucide-react";

const T = {
  bg: "#050f1e", panel: "#081628", card: "#0b1e36", up: "#0e2544",
  txt: "#e8f0fe", txt2: "#8aaccc", txt3: "#4a6a8a", txt4: "#2e4a6a",
  teal: "#00e5c0", blue: "#3b9eff", coral: "#ff6b6b", gold: "#f5c842",
};

const CC_OPTIONS = [
  "chest_pain", "dyspnea", "abd_pain", "headache", "back_pain", "syncope", "ams",
  "extremity", "fever", "nv", "palpitations", "dizziness", "trauma", "urinary",
  "allergic", "eye", "stroke_sx", "seizure", "gi_bleed", "sore_throat", "ear_pain",
  "epistaxis", "rash", "dvt_leg", "dental", "psychiatric", "wound",
];

const glass = (x = {}) => ({
  backdropFilter: "blur(24px) saturate(200%)",
  WebkitBackdropFilter: "blur(24px) saturate(200%)",
  background: "rgba(8,22,40,0.75)",
  border: "1px solid rgba(26,53,85,0.45)",
  borderRadius: 14,
  ...x,
});

export default function HPITemplateAdmin() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCC, setFilterCC] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [newCC, setNewCC] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [previewTemplate, setPreviewTemplate] = useState(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await base44.entities.HPITemplate.list("-created_date", 500);
      setTemplates(data || []);
    } catch (e) {
      console.error("Error loading templates:", e);
      setMessage("Failed to load templates");
      setMessageType("error");
    }
    setLoading(false);
  }, []);

  const filtered = filterCC
    ? templates.filter(t => t.cc === filterCC)
    : templates;

  const toggleAll = (e) => {
    if (e.target.checked) {
      setSelected(new Set(filtered.map(t => t.id)));
    } else {
      setSelected(new Set());
    }
  };

  const toggleOne = (id) => {
    const newSet = new Set(selected);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelected(newSet);
  };

  const buildPreviewNarrative = (t) => {
    if (!t.hpi_fields) return "No fields configured.";
    const f = t.hpi_fields;
    const parts = [];

    if (f.onset) parts.push(`Onset: ${f.onset}`);
    if (f.quality?.length) parts.push(`Quality: ${Array.isArray(f.quality) ? f.quality.join(", ") : f.quality}`);
    if (f.location) parts.push(`Location: ${f.location}`);
    if (f.severity !== null && f.severity !== undefined) parts.push(`Severity: ${f.severity}/10`);
    if (f.duration) parts.push(`Duration: ${f.duration}`);
    if (f.timing) parts.push(`Timing: ${f.timing}`);
    if (f.radiation && f.radiation !== "N/A" && f.radiation !== "non-radiating") parts.push(`Radiates to: ${f.radiation}`);
    if (f.worse?.length) parts.push(`Worse with: ${Array.isArray(f.worse) ? f.worse.join(", ") : f.worse}`);
    if (f.better?.length) parts.push(`Better with: ${Array.isArray(f.better) ? f.better.join(", ") : f.better}`);
    if (f.assoc?.length) parts.push(`Associated: ${Array.isArray(f.assoc) ? f.assoc.join(", ") : f.assoc}`);
    if (f.neg?.length) parts.push(`Denies: ${Array.isArray(f.neg) ? f.neg.join(", ") : f.neg}`);

    return parts.length ? parts.join(" • ") : "No fields configured.";
  };

  const handleBulkReassign = async () => {
    if (!newCC || selected.size === 0) {
      setMessage("Select templates and choose a new cc");
      setMessageType("error");
      return;
    }

    setSaving(true);
    try {
      const updates = Array.from(selected).map(id => 
        base44.entities.HPITemplate.update(id, { cc: newCC })
      );
      await Promise.all(updates);
      setMessage(`✓ Updated ${selected.size} template(s)`);
      setMessageType("success");
      setSelected(new Set());
      setNewCC("");
      loadTemplates();
    } catch (e) {
      console.error("Bulk update error:", e);
      setMessage("Failed to update templates");
      setMessageType("error");
    }
    setSaving(false);
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) {
      setMessage("Select templates to delete");
      setMessageType("error");
      return;
    }
    if (!confirm(`Delete ${selected.size} template(s)?`)) return;

    setSaving(true);
    try {
      const deletes = Array.from(selected).map(id =>
        base44.entities.HPITemplate.delete(id)
      );
      await Promise.all(deletes);
      setMessage(`✓ Deleted ${selected.size} template(s)`);
      setMessageType("success");
      setSelected(new Set());
      loadTemplates();
    } catch (e) {
      console.error("Delete error:", e);
      setMessage("Failed to delete templates");
      setMessageType("error");
    }
    setSaving(false);
  };

  return (
    <div style={{ background: T.bg, minHeight: "100vh", padding: "80px 24px", fontFamily: "DM Sans, sans-serif" }}>
      <div style={{ maxWidth: 1600, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: "Playfair Display", fontSize: 32, fontWeight: 700, color: T.txt, marginBottom: 6 }}>
            HPI Template Admin
          </h1>
          <p style={{ fontSize: 13, color: T.txt3 }}>Bulk edit • Filter & reassign tags • Click a template to preview</p>
        </div>

        {/* Split Pane Container */}
        <div style={{ display: "flex", gap: 20, minHeight: "calc(100vh - 200px)", marginBottom: 20 }}>
          {/* LEFT PANE — Templates & Controls */}
          <div style={{ flex: "0 0 45%", display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Message */}
            {message && (
              <div style={{
                padding: "12px 16px",
                borderRadius: 10,
                background: messageType === "success" ? "rgba(0,229,192,0.1)" : "rgba(255,107,107,0.1)",
                border: `1px solid ${messageType === "success" ? "rgba(0,229,192,0.3)" : "rgba(255,107,107,0.3)"}`,
                color: messageType === "success" ? T.teal : T.coral,
                fontSize: 12,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}>
                <AlertCircle size={16} />
                {message}
              </div>
            )}

            {/* Controls Panel */}
            <div style={{ ...glass(), padding: "20px 24px" }}>
              <div style={{ display: "flex", gap: 12, flexDirection: "column" }}>
                {/* Filter by CC */}
                <div>
                  <label style={{ display: "block", fontSize: 11, color: T.txt3, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>
                    <Filter size={14} style={{ display: "inline", marginRight: 4 }} />
                    Filter by Chief Complaint
                  </label>
                  <select
                    value={filterCC}
                    onChange={e => setFilterCC(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "rgba(14,37,68,0.8)",
                      border: "1px solid rgba(42,79,122,0.5)",
                      borderRadius: 10,
                      color: T.txt,
                      fontFamily: "DM Sans",
                      fontSize: 13,
                      outline: "none",
                      cursor: "pointer",
                    }}>
                    <option value="">All ({templates.length})</option>
                    {CC_OPTIONS.map(cc => {
                      const count = templates.filter(t => t.cc === cc).length;
                      return <option key={cc} value={cc}>{cc} ({count})</option>;
                    })}
                  </select>
                </div>

                {/* New CC Selection */}
                <div>
                  <label style={{ display: "block", fontSize: 11, color: T.txt3, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>
                    Reassign to CC
                  </label>
                  <select
                    value={newCC}
                    onChange={e => setNewCC(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "rgba(14,37,68,0.8)",
                      border: "1px solid rgba(42,79,122,0.5)",
                      borderRadius: 10,
                      color: T.txt,
                      fontFamily: "DM Sans",
                      fontSize: 13,
                      outline: "none",
                      cursor: "pointer",
                    }}>
                    <option value="">— Select new CC —</option>
                    {CC_OPTIONS.map(cc => (
                      <option key={cc} value={cc}>{cc}</option>
                    ))}
                  </select>
                </div>

                {/* Action Buttons */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    onClick={handleBulkReassign}
                    disabled={saving || selected.size === 0}
                    style={{
                      flex: 1,
                      padding: "10px 14px",
                      borderRadius: 10,
                      background: selected.size > 0 && !saving ? `linear-gradient(135deg,${T.blue},${T.blue}bb)` : "rgba(59,158,255,0.2)",
                      border: "none",
                      color: "#fff",
                      fontFamily: "DM Sans",
                      fontWeight: 600,
                      fontSize: 12,
                      cursor: selected.size > 0 && !saving ? "pointer" : "not-allowed",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}>
                    <Save size={14} />
                    Reassign
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    disabled={saving || selected.size === 0}
                    style={{
                      flex: 1,
                      padding: "10px 14px",
                      borderRadius: 10,
                      background: selected.size > 0 && !saving ? "rgba(255,107,107,0.2)" : "rgba(255,107,107,0.1)",
                      border: `1px solid ${selected.size > 0 && !saving ? "rgba(255,107,107,0.5)" : "rgba(255,107,107,0.2)"}`,
                      color: T.coral,
                      fontFamily: "DM Sans",
                      fontWeight: 600,
                      fontSize: 12,
                      cursor: selected.size > 0 && !saving ? "pointer" : "not-allowed",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}>
                    <Trash2 size={14} />
                    Delete
                  </button>
                  <button
                    onClick={() => setSelected(new Set())}
                    style={{
                      flex: 1,
                      padding: "10px 14px",
                      borderRadius: 10,
                      background: "transparent",
                      border: "1px solid rgba(42,79,122,0.4)",
                      color: T.txt3,
                      fontFamily: "DM Sans",
                      fontWeight: 600,
                      fontSize: 12,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}>
                    <RotateCcw size={14} />
                    Clear
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div style={{ ...glass(), overflow: "hidden", flex: 1, display: "flex", flexDirection: "column" }}>
              {loading ? (
                <div style={{ padding: "40px 24px", textAlign: "center", color: T.txt3 }}>
                  Loading templates...
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: "40px 24px", textAlign: "center", color: T.txt4 }}>
                  No templates found
                </div>
              ) : (
                <div style={{ overflowY: "auto", flex: 1 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead style={{ position: "sticky", top: 0 }}>
                      <tr style={{ borderBottom: "1px solid rgba(26,53,85,0.6)", background: "rgba(14,37,68,0.5)" }}>
                        <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: T.txt3, textTransform: "uppercase", letterSpacing: 1, width: 40 }}>
                          <input
                            type="checkbox"
                            checked={selected.size > 0 && selected.size === filtered.length}
                            onChange={toggleAll}
                            style={{ cursor: "pointer", width: 16, height: 16 }}
                          />
                        </th>
                        <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: T.txt3, textTransform: "uppercase", letterSpacing: 1 }}>Label</th>
                        <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: T.txt3, textTransform: "uppercase", letterSpacing: 1, width: 40 }}>CC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((t, i) => (
                        <tr
                          key={t.id}
                          onClick={() => setPreviewTemplate(t)}
                          style={{
                            borderBottom: "1px solid rgba(26,53,85,0.3)",
                            background: previewTemplate?.id === t.id ? "rgba(0,229,192,0.12)" : selected.has(t.id) ? "rgba(0,229,192,0.08)" : i % 2 === 0 ? "rgba(14,37,68,0.3)" : "transparent",
                            cursor: "pointer",
                            borderLeft: previewTemplate?.id === t.id ? `3px solid ${T.teal}` : "3px solid transparent",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = previewTemplate?.id === t.id ? "rgba(0,229,192,0.12)" : "rgba(14,37,68,0.5)"}
                          onMouseLeave={e => e.currentTarget.style.background = previewTemplate?.id === t.id ? "rgba(0,229,192,0.12)" : (i % 2 === 0 ? "rgba(14,37,68,0.3)" : "transparent")}
                        >
                          <td style={{ padding: "12px 14px" }}>
                            <input
                              type="checkbox"
                              checked={selected.has(t.id)}
                              onChange={e => { e.stopPropagation(); toggleOne(t.id); }}
                              style={{ cursor: "pointer", width: 16, height: 16 }}
                            />
                          </td>
                          <td style={{ padding: "12px 14px", fontSize: 12, color: T.txt, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {t.icon} {t.label}
                          </td>
                          <td style={{ padding: "12px 14px", fontSize: 10, color: T.teal, fontFamily: "JetBrains Mono", fontWeight: 600 }}>{t.cc?.slice(0, 5)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANE — Live Preview */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
            {previewTemplate ? (
              <div style={{ ...glass(), padding: "24px 28px", flex: 1, display: "flex", flexDirection: "column" }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid rgba(26,53,85,0.4)" }}>
                  <span style={{ fontSize: 28 }}>{previewTemplate.icon || "📋"}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "DM Sans", fontWeight: 700, fontSize: 15, color: T.txt }}>{previewTemplate.label}</div>
                    <div style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: T.txt3, letterSpacing: 1, marginTop: 4 }}>CC: {previewTemplate.cc}</div>
                  </div>
                  <button
                    onClick={() => setPreviewTemplate(null)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 8,
                      background: "transparent",
                      border: "1px solid rgba(42,79,122,0.4)",
                      color: T.txt4,
                      fontSize: 12,
                      cursor: "pointer",
                      fontFamily: "DM Sans",
                    }}>✕</button>
                </div>

                {/* Preview Content */}
                <div style={{ flex: 1, overflowY: "auto" }}>
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: T.txt3, textTransform: "uppercase", letterSpacing: 2, marginBottom: 12, fontWeight: 700 }}>📋 Template Fields</div>
                    <div style={{ background: "rgba(14,37,68,0.5)", borderRadius: 10, padding: "14px 16px", fontFamily: "DM Sans", fontSize: 12, lineHeight: 1.8, color: T.txt2 }}>
                      {buildPreviewNarrative(previewTemplate)}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: T.txt3, textTransform: "uppercase", letterSpacing: 2, marginBottom: 12, fontWeight: 700 }}>🔮 Live Note Preview</div>
                    <div style={{ ...glass({ borderColor: T.teal + "44", background: "linear-gradient(135deg,rgba(0,229,192,0.04),rgba(8,22,40,0.85))" }), padding: "16px 18px", fontFamily: "DM Sans", fontSize: 13.5, lineHeight: 1.9, color: T.txt }}>
                      <p style={{ margin: "0 0 14px", color: T.teal, fontWeight: 600 }}>
                        Patient: 65-year-old with {previewTemplate.label.toLowerCase()}
                      </p>
                      {buildPreviewNarrative(previewTemplate).split(" • ").map((part, i) => (
                        <p key={i} style={{ margin: "0 0 10px", display: "flex", gap: 10 }}>
                          <span style={{ color: T.gold, fontWeight: 700, flexShrink: 0 }}>•</span>
                          <span>{part}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ ...glass(), padding: "40px 28px", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontSize: 52, marginBottom: 16 }}>👈</div>
                <div style={{ fontFamily: "DM Sans", fontSize: 14, color: T.txt3, textAlign: "center" }}>
                  Select a template to preview how it renders in a patient note
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        <div style={{ fontSize: 12, color: T.txt3 }}>
          Showing {filtered.length} of {templates.length} templates
          {selected.size > 0 && ` • ${selected.size} selected`}
        </div>
      </div>
    </div>
  );
}