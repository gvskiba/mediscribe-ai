import { useState } from "react";
import { base44 } from "@/api/base44Client";

const T = {
  bg: "#050f1e", panel: "#081628", card: "#0b1e36", up: "#0e2544",
  b: "rgba(26,53,85,0.8)", bhi: "rgba(42,79,122,0.9)",
  txt: "#e8f0fe", txt2: "#8aaccc", txt3: "#4a6a8a", txt4: "#2e4a6a",
  teal: "#00e5c0", blue: "#3b9eff", coral: "#ff6b6b", gold: "#f5c842",
};

const CC_OPTIONS = [
  { id: "chest_pain", label: "Chest Pain" },
  { id: "dyspnea", label: "Shortness of Breath" },
  { id: "abd_pain", label: "Abdominal Pain" },
  { id: "headache", label: "Headache" },
  { id: "back_pain", label: "Back Pain" },
  { id: "syncope", label: "Syncope / Near-Syncope" },
  { id: "ams", label: "Altered Mental Status" },
  { id: "extremity", label: "Extremity / Joint Pain" },
  { id: "fever", label: "Fever / Infection" },
  { id: "nv", label: "Nausea / Vomiting" },
  { id: "palpitations", label: "Palpitations" },
  { id: "dizziness", label: "Dizziness / Vertigo" },
  { id: "trauma", label: "Trauma / Injury" },
  { id: "urinary", label: "Urinary Symptoms" },
  { id: "allergic", label: "Allergic Reaction / Anaphylaxis" },
  { id: "eye", label: "Eye Complaint" },
  { id: "stroke_sx", label: "Stroke Symptoms" },
  { id: "seizure", label: "Seizure" },
  { id: "gi_bleed", label: "GI Bleeding" },
  { id: "sore_throat", label: "Sore Throat / Pharyngitis" },
  { id: "ear_pain", label: "Ear Pain / Hearing Loss" },
  { id: "epistaxis", label: "Epistaxis (Nosebleed)" },
  { id: "rash", label: "Rash / Skin Complaint" },
  { id: "dvt_leg", label: "Leg Swelling / DVT" },
  { id: "dental", label: "Dental / Jaw Pain" },
  { id: "psychiatric", label: "Psychiatric / Behavioral" },
  { id: "wound", label: "Wound / Laceration" },
];

const ICONS = ["📋","❤️","🫁","🧠","🦴","🤢","💓","💫","🌡️","🚽","👁️","⚡","🩸","🦺","🤧","💭","🩹","💊","🔥","⭐","📝","🎯","💡","🏥"];

export default function CreateTemplateModal({ onClose, onSaved, currentCC, currentFields }) {
  const [label, setLabel] = useState("");
  const [icon, setIcon] = useState("📋");
  const [cc, setCC] = useState(currentCC || "chest_pain");
  const [useCurrentFields, setUseCurrentFields] = useState(!!currentCC);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!label.trim()) { setError("Please enter a template name."); return; }
    setSaving(true);
    setError("");
    try {
      await base44.entities.HPITemplate.create({
        label: label.trim(),
        icon,
        cc,
        is_system: false,
        order: 999,
        hpi_fields: useCurrentFields && currentFields ? currentFields : {},
      });
      onSaved();
      onClose();
    } catch (e) {
      setError("Failed to save template. Please try again.");
    }
    setSaving(false);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(5,15,30,0.85)",
      backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        style={{
          background: "#081628", border: "1px solid rgba(42,79,122,0.6)",
          borderRadius: 16, padding: 28, width: "100%", maxWidth: 480,
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
        }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
          <span style={{ fontSize: 20 }}>💾</span>
          <div>
            <div style={{ fontFamily: "DM Sans", fontWeight: 700, fontSize: 16, color: T.txt }}>Save Custom Template</div>
            <div style={{ fontFamily: "DM Sans", fontSize: 12, color: T.txt3 }}>Reuse this HPI for future patients</div>
          </div>
          <button onClick={onClose} style={{ marginLeft: "auto", background: "transparent", border: "none", color: T.txt3, fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>

        {/* Template Name */}
        <label style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: T.txt3, textTransform: "uppercase", letterSpacing: 2 }}>Template Name *</label>
        <input
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="e.g. Typical STEMI, Migraine w/ Aura…"
          style={{
            display: "block", width: "100%", marginTop: 6, marginBottom: 16,
            background: "rgba(14,37,68,0.8)", border: "1px solid rgba(42,79,122,0.5)",
            borderRadius: 10, padding: "10px 14px", color: T.txt,
            fontFamily: "DM Sans", fontSize: 13, outline: "none", boxSizing: "border-box",
          }}
          onFocus={e => e.target.style.borderColor = T.teal}
          onBlur={e => e.target.style.borderColor = "rgba(42,79,122,0.5)"}
          autoFocus
        />

        {/* Icon Picker */}
        <label style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: T.txt3, textTransform: "uppercase", letterSpacing: 2 }}>Icon</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6, marginBottom: 16 }}>
          {ICONS.map(ic => (
            <button key={ic} onClick={() => setIcon(ic)}
              style={{
                width: 36, height: 36, borderRadius: 8, fontSize: 18,
                background: icon === ic ? "rgba(0,229,192,0.15)" : "rgba(14,37,68,0.7)",
                border: `1.5px solid ${icon === ic ? T.teal : "rgba(42,79,122,0.3)"}`,
                cursor: "pointer",
              }}>
              {ic}
            </button>
          ))}
        </div>

        {/* Chief Complaint */}
        <label style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: T.txt3, textTransform: "uppercase", letterSpacing: 2 }}>Chief Complaint</label>
        <select
          value={cc}
          onChange={e => setCC(e.target.value)}
          style={{
            display: "block", width: "100%", marginTop: 6, marginBottom: 16,
            background: "rgba(14,37,68,0.8)", border: "1px solid rgba(42,79,122,0.5)",
            borderRadius: 10, padding: "10px 14px", color: T.txt,
            fontFamily: "DM Sans", fontSize: 13, outline: "none", boxSizing: "border-box",
          }}>
          {CC_OPTIONS.sort((a, b) => a.label.localeCompare(b.label)).map(opt => (
            <option key={opt.id} value={opt.id}>{opt.label}</option>
          ))}
        </select>

        {/* Use current fields */}
        {currentCC && currentFields && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10, marginBottom: 20,
            padding: "10px 14px", borderRadius: 10,
            background: useCurrentFields ? "rgba(0,229,192,0.08)" : "rgba(14,37,68,0.5)",
            border: `1px solid ${useCurrentFields ? "rgba(0,229,192,0.3)" : "rgba(42,79,122,0.3)"}`,
            cursor: "pointer",
          }} onClick={() => setUseCurrentFields(!useCurrentFields)}>
            <div style={{
              width: 18, height: 18, borderRadius: 5,
              background: useCurrentFields ? T.teal : "transparent",
              border: `2px solid ${useCurrentFields ? T.teal : T.txt4}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              {useCurrentFields && <span style={{ color: "#050f1e", fontSize: 11, fontWeight: 900 }}>✓</span>}
            </div>
            <div>
              <div style={{ fontFamily: "DM Sans", fontSize: 13, fontWeight: 600, color: useCurrentFields ? T.teal : T.txt2 }}>
                Pre-fill with current HPI selections
              </div>
              <div style={{ fontFamily: "DM Sans", fontSize: 11, color: T.txt3 }}>
                Saves your current chip selections as default values
              </div>
            </div>
          </div>
        )}

        {error && (
          <div style={{ marginBottom: 14, padding: "8px 12px", borderRadius: 8, background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.3)", color: "#ff6b6b", fontFamily: "DM Sans", fontSize: 12 }}>
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: "11px", borderRadius: 10, background: "transparent", border: "1px solid rgba(42,79,122,0.4)", color: T.txt2, fontFamily: "DM Sans", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            style={{ flex: 2, padding: "11px", borderRadius: 10, background: saving ? "rgba(0,229,192,0.2)" : `linear-gradient(135deg,${T.teal},${T.teal}bb)`, border: "none", color: saving ? T.teal : "#050f1e", fontFamily: "DM Sans", fontWeight: 700, fontSize: 13, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            {saving ? (
              <><div style={{ width: 14, height: 14, border: `2px solid ${T.teal}`, borderTopColor: "transparent", borderRadius: "50%", animation: "hpi-spin 1s linear infinite" }} /> Saving…</>
            ) : "💾 Save Template"}
          </button>
        </div>
      </div>
    </div>
  );
}