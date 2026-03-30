import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { ChevronDown, Filter, Save, RotateCcw, Trash2, AlertCircle } from "lucide-react";

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
  const [messageType, setMessageType] = useState(""); // "success" or "error"

  // Load templates
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

  // Filter templates
  const filtered = filterCC
    ? templates.filter(t => t.cc === filterCC)
    : templates;

  // Select/deselect all visible
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

  // Bulk reassign cc
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

  // Bulk delete
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
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: "Playfair Display", fontSize: 32, fontWeight: 700, color: T.txt, marginBottom: 6 }}>
            HPI Template Admin
          </h1>
          <p style={{ fontSize: 13, color: T.txt3 }}>Bulk edit, filter, and reassign chief complaint tags</p>
        </div>

        {/* Message */}
        {message && (
          <div style={{
            padding: "12px 16px",
            borderRadius: 10,
            marginBottom: 20,
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
        <div style={{ ...glass(), padding: "20px 24px", marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
            {/* Filter by CC */}
            <div style={{ flex: "1 1 auto", minWidth: 200 }}>
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
                <option value="">All Chief Complaints ({templates.length})</option>
                {CC_OPTIONS.map(cc => {
                  const count = templates.filter(t => t.cc === cc).length;
                  return <option key={cc} value={cc}>{cc} ({count})</option>;
                })}
              </select>
            </div>

            {/* New CC Selection */}
            <div style={{ flex: "1 1 auto", minWidth: 200 }}>
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
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleBulkReassign}
                disabled={saving || selected.size === 0}
                style={{
                  padding: "10px 16px",
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
                  gap: 6,
                  whiteSpace: "nowrap",
                }}>
                <Save size={14} />
                Reassign ({selected.size})
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={saving || selected.size === 0}
                style={{
                  padding: "10px 16px",
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
                  gap: 6,
                  whiteSpace: "nowrap",
                }}>
                <Trash2 size={14} />
                Delete
              </button>
              <button
                onClick={() => setSelected(new Set())}
                style={{
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
                  gap: 6,
                }}>
                <RotateCcw size={14} />
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ ...glass(), overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: "40px 24px", textAlign: "center", color: T.txt3 }}>
              Loading templates...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "40px 24px", textAlign: "center", color: T.txt4 }}>
              No templates found
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(26,53,85,0.6)", background: "rgba(14,37,68,0.5)" }}>
                    <th style={{
                      padding: "14px 16px",
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 700,
                      color: T.txt3,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                      width: 50,
                    }}>
                      <input
                        type="checkbox"
                        checked={selected.size > 0 && selected.size === filtered.length}
                        onChange={toggleAll}
                        style={{ cursor: "pointer", width: 18, height: 18 }}
                      />
                    </th>
                    <th style={{ padding: "14px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: T.txt3, textTransform: "uppercase", letterSpacing: 1 }}>Name</th>
                    <th style={{ padding: "14px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: T.txt3, textTransform: "uppercase", letterSpacing: 1 }}>Icon</th>
                    <th style={{ padding: "14px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: T.txt3, textTransform: "uppercase", letterSpacing: 1 }}>Current CC</th>
                    <th style={{ padding: "14px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: T.txt3, textTransform: "uppercase", letterSpacing: 1 }}>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t, i) => (
                    <tr
                      key={t.id}
                      style={{
                        borderBottom: "1px solid rgba(26,53,85,0.3)",
                        background: selected.has(t.id) ? "rgba(0,229,192,0.08)" : i % 2 === 0 ? "rgba(14,37,68,0.3)" : "transparent",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = selected.has(t.id) ? "rgba(0,229,192,0.1)" : "rgba(14,37,68,0.5)"}
                      onMouseLeave={e => e.currentTarget.style.background = selected.has(t.id) ? "rgba(0,229,192,0.08)" : (i % 2 === 0 ? "rgba(14,37,68,0.3)" : "transparent")}
                    >
                      <td style={{ padding: "14px 16px" }}>
                        <input
                          type="checkbox"
                          checked={selected.has(t.id)}
                          onChange={() => toggleOne(t.id)}
                          style={{ cursor: "pointer", width: 18, height: 18 }}
                        />
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 13, color: T.txt, fontWeight: 500 }}>{t.label}</td>
                      <td style={{ padding: "14px 16px", fontSize: 16 }}>{t.icon || "—"}</td>
                      <td style={{ padding: "14px 16px", fontSize: 12, color: T.teal, fontFamily: "JetBrains Mono", fontWeight: 600 }}>{t.cc}</td>
                      <td style={{ padding: "14px 16px", fontSize: 12, color: T.txt4 }}>
                        {new Date(t.created_date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary */}
        <div style={{ marginTop: 20, fontSize: 12, color: T.txt3 }}>
          Showing {filtered.length} of {templates.length} templates
          {selected.size > 0 && ` • ${selected.size} selected`}
        </div>
      </div>
    </div>
  );
}