import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

const T = {
  bg: "#050f1e", panel: "#081628", card: "#0b1e36", up: "#0e2544",
  bd: "#1a3555", bhi: "#2a4f7a",
  teal: "#00e5c0", gold: "#f5c842", red: "#ff4444", coral: "#ff6b6b",
  green: "#3dffa0", blue: "#3b9eff", purple: "#9b6dff", orange: "#ff9f43",
  t: "#f2f7ff", t2: "#b8d4f0", t3: "#82aece", t4: "#5a82a8",
};

const DISPOSITION_OPTIONS = [
  { id: "home", label: "Discharge Home", icon: "🏠", color: T.teal, desc: "Patient stable for home discharge with instructions" },
  { id: "admit", label: "Admit to Floor", icon: "🛏️", color: T.blue, desc: "Requires inpatient admission to general floor" },
  { id: "icu", label: "Admit to ICU", icon: "🚨", color: T.coral, desc: "Requires intensive care unit level care" },
  { id: "obs", label: "Observation", icon: "🔍", color: T.gold, desc: "23-hour observation status" },
  { id: "transfer", label: "Transfer", icon: "🚑", color: T.orange, desc: "Transfer to another facility" },
  { id: "ama", label: "AMA Discharge", icon: "⚠️", color: T.red, desc: "Against medical advice discharge" },
  { id: "expired", label: "Expired", icon: "🕊️", color: T.t4, desc: "Patient expired in ED" },
  { id: "lwbs", label: "LWBS", icon: "🚪", color: T.purple, desc: "Left without being seen" },
];

const RETURN_PRECAUTIONS = [
  "Fever > 101.5°F (38.6°C)",
  "Worsening chest pain or pressure",
  "Shortness of breath at rest",
  "Severe headache or vision changes",
  "Uncontrolled vomiting",
  "Signs of infection (redness, warmth, swelling)",
  "New neurological symptoms",
  "Inability to take oral medications",
];

const FOLLOW_UP_OPTIONS = [
  "Primary Care Physician (PCP) — 1–3 days",
  "Cardiology — 1 week",
  "Pulmonology — 1–2 weeks",
  "Neurology — 1 week",
  "Orthopedics — 1 week",
  "Surgery — 48–72 hours",
  "Hematology/Oncology — within 1 week",
  "ED follow-up — 24–48 hours",
];

export default function DischargeDisposition() {
  const navigate = useNavigate();

  const [selectedDispo, setSelectedDispo] = useState("");
  const [dischargeInstructions, setDischargeInstructions] = useState("");
  const [selectedPrecautions, setSelectedPrecautions] = useState([]);
  const [selectedFollowUp, setSelectedFollowUp] = useState([]);
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [admitService, setAdmitService] = useState("");
  const [admitDiagnosis, setAdmitDiagnosis] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggleItem = (list, setList, item) => {
    setList(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  const generateInstructions = async () => {
    if (!selectedDispo) return;
    setGenerating(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate clear, patient-friendly discharge instructions for an Emergency Department patient being discharged home. Include: what happened, medications to take, activity restrictions, diet if relevant, wound care if relevant, and signs to watch for. Return as plain text, structured paragraphs. Keep it concise and readable at a 6th grade level.`
      });
      setDischargeInstructions(typeof res === "string" ? res : JSON.stringify(res));
    } catch (e) {
      setDischargeInstructions("Unable to generate instructions. Please type manually.");
    }
    setGenerating(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const isAdmit = ["admit", "icu", "obs"].includes(selectedDispo);

  return (
    <div style={{
      minHeight: "100vh", background: T.bg, color: T.t,
      fontFamily: "'DM Sans', sans-serif", padding: "24px",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: T.up, border: `1px solid ${T.bd}`, borderRadius: 8,
            color: T.t3, padding: "6px 14px", cursor: "pointer", fontSize: 13,
          }}
        >
          ← Back
        </button>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: T.t, margin: 0 }}>
            Discharge & Disposition
          </h1>
          <p style={{ fontSize: 12, color: T.t4, margin: 0 }}>Plan patient disposition and generate discharge documentation</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, maxWidth: 1100, margin: "0 auto" }}>
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Disposition Selection */}
          <div style={{ background: T.card, border: `1px solid ${T.bd}`, borderRadius: 12, padding: 16 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: T.t4, marginBottom: 12 }}>
              Select Disposition
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {DISPOSITION_OPTIONS.map(d => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDispo(d.id)}
                  style={{
                    textAlign: "left", padding: "10px 12px", borderRadius: 9, cursor: "pointer",
                    border: `1px solid ${selectedDispo === d.id ? d.color + "60" : T.bd}`,
                    borderLeft: `3px solid ${d.color}`,
                    background: selectedDispo === d.id ? `${d.color}18` : T.up,
                    transition: "all .15s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
                    <span style={{ fontSize: 14 }}>{d.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: selectedDispo === d.id ? d.color : T.t }}>{d.label}</span>
                  </div>
                  <div style={{ fontSize: 10, color: T.t4, lineHeight: 1.4 }}>{d.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Admit Details (conditional) */}
          {isAdmit && (
            <div style={{ background: T.card, border: `1px solid ${T.bd}`, borderRadius: 12, padding: 16 }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: T.t4, marginBottom: 12 }}>
                Admission Details
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: T.t3, display: "block", marginBottom: 4 }}>Admitting Service</label>
                  <input
                    value={admitService}
                    onChange={e => setAdmitService(e.target.value)}
                    placeholder="e.g. Internal Medicine, Cardiology..."
                    style={{
                      width: "100%", background: T.up, border: `1px solid ${T.bd}`, borderRadius: 7,
                      padding: "8px 11px", color: T.t, fontSize: 12, outline: "none", boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: T.t3, display: "block", marginBottom: 4 }}>Admitting Diagnosis</label>
                  <input
                    value={admitDiagnosis}
                    onChange={e => setAdmitDiagnosis(e.target.value)}
                    placeholder="Primary diagnosis for admission..."
                    style={{
                      width: "100%", background: T.up, border: `1px solid ${T.bd}`, borderRadius: 7,
                      padding: "8px 11px", color: T.t, fontSize: 12, outline: "none", boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Follow-up */}
          {selectedDispo === "home" && (
            <div style={{ background: T.card, border: `1px solid ${T.bd}`, borderRadius: 12, padding: 16 }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: T.t4, marginBottom: 12 }}>
                Follow-Up Instructions
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {FOLLOW_UP_OPTIONS.map(f => (
                  <label key={f} style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer", padding: "5px 0" }}>
                    <div
                      onClick={() => toggleItem(selectedFollowUp, setSelectedFollowUp, f)}
                      style={{
                        width: 16, height: 16, borderRadius: 4, flexShrink: 0, cursor: "pointer",
                        border: `1px solid ${selectedFollowUp.includes(f) ? T.teal : T.bd}`,
                        background: selectedFollowUp.includes(f) ? T.teal : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      {selectedFollowUp.includes(f) && <span style={{ fontSize: 10, color: T.bg, fontWeight: 700 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 12, color: selectedFollowUp.includes(f) ? T.t : T.t3 }}>{f}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Return Precautions */}
          {selectedDispo === "home" && (
            <div style={{ background: T.card, border: `1px solid ${T.bd}`, borderRadius: 12, padding: 16 }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: T.t4, marginBottom: 12 }}>
                Return Precautions
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {RETURN_PRECAUTIONS.map(r => (
                  <label key={r} style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer", padding: "5px 0" }}>
                    <div
                      onClick={() => toggleItem(selectedPrecautions, setSelectedPrecautions, r)}
                      style={{
                        width: 16, height: 16, borderRadius: 4, flexShrink: 0, cursor: "pointer",
                        border: `1px solid ${selectedPrecautions.includes(r) ? T.coral : T.bd}`,
                        background: selectedPrecautions.includes(r) ? T.coral : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      {selectedPrecautions.includes(r) && <span style={{ fontSize: 10, color: "#fff", fontWeight: 700 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 12, color: selectedPrecautions.includes(r) ? T.t : T.t3 }}>{r}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Discharge Instructions */}
          <div style={{ background: T.card, border: `1px solid ${T.bd}`, borderRadius: 12, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: T.t4 }}>
                Discharge Instructions
              </div>
              <button
                onClick={generateInstructions}
                disabled={generating || !selectedDispo}
                style={{
                  background: "rgba(155,109,255,.12)", color: T.purple,
                  border: `1px solid rgba(155,109,255,.3)`, borderRadius: 6,
                  padding: "4px 11px", fontSize: 11, fontWeight: 600, cursor: "pointer",
                  opacity: (!selectedDispo || generating) ? 0.4 : 1,
                }}
              >
                {generating ? "⟳ Generating…" : "✦ AI Generate"}
              </button>
            </div>
            <textarea
              value={dischargeInstructions}
              onChange={e => setDischargeInstructions(e.target.value)}
              placeholder="Type or AI-generate discharge instructions…"
              style={{
                width: "100%", background: T.up, border: `1px solid ${T.bd}`, borderRadius: 8,
                padding: "10px 12px", color: T.t, fontSize: 12, outline: "none", resize: "none",
                minHeight: 140, lineHeight: 1.7, fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box",
              }}
            />
          </div>

          {/* Additional Notes */}
          <div style={{ background: T.card, border: `1px solid ${T.bd}`, borderRadius: 12, padding: 16 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: T.t4, marginBottom: 12 }}>
              Provider Notes
            </div>
            <textarea
              value={additionalNotes}
              onChange={e => setAdditionalNotes(e.target.value)}
              placeholder="Additional provider notes, special instructions…"
              style={{
                width: "100%", background: T.up, border: `1px solid ${T.bd}`, borderRadius: 8,
                padding: "10px 12px", color: T.t, fontSize: 12, outline: "none", resize: "none",
                minHeight: 90, lineHeight: 1.7, fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box",
              }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handleSave}
              disabled={!selectedDispo}
              style={{
                flex: 1, padding: "11px 0", borderRadius: 9, fontWeight: 700, fontSize: 13,
                cursor: selectedDispo ? "pointer" : "not-allowed",
                background: saved ? T.green : T.teal, color: T.bg,
                border: "none", transition: "all .2s",
                opacity: !selectedDispo ? 0.4 : 1,
              }}
            >
              {saved ? "✓ Saved!" : "💾 Save Disposition"}
            </button>
            <button
              onClick={() => navigate("/patient-workspace")}
              style={{
                padding: "11px 20px", borderRadius: 9, fontWeight: 600, fontSize: 13,
                cursor: "pointer", background: T.up, color: T.t2,
                border: `1px solid ${T.bd}`,
              }}
            >
              ← Workspace
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}