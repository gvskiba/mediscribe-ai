import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

/**
 * Lightweight wrapper for Discharge Planning to work as a tab within NewPatientInput
 * Converts patient data from parent props into a temporary clinical note
 */
export default function DischargePlanningWrapper({
  patientName = "Patient",
  patientDob = "",
  patientId = "",
  patientAge = "",
  patientGender = "",
  chiefComplaint = "",
  diagnoses = [],
  medications = [],
  allergies = [],
}) {
  const G = {
    navy: "#050f1e",
    slate: "#0b1d35",
    panel: "#0d2240",
    edge: "#162d4f",
    border: "#1e3a5f",
    muted: "#2a4d72",
    dim: "#4a7299",
    text: "#c8ddf0",
    bright: "#e8f4ff",
    teal: "#00d4bc",
    amber: "#f5a623",
    red: "#ff5c6c",
    green: "#2ecc71",
    purple: "#9b6dff",
    blue: "#4a90d9",
    rose: "#f472b6",
  };

  const [localMeds, setLocalMeds] = useState([]);
  const [summaryText, setSummaryText] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [toast, setToast] = useState(null);

  // Initialize medications from parent
  useEffect(() => {
    if (medications && medications.length > 0) {
      const meds = medications.map((m, i) => ({
        id: `med-${i}`,
        name: typeof m === "string" ? m : m.name || m,
        dose: "",
        frequency: "",
        route: "PO",
        status: "continued",
        instructions: "",
      }));
      setLocalMeds(meds);
    }
  }, [medications]);

  const generateSummary = async () => {
    setAiGenerating(true);
    const medList = localMeds
      .filter((m) => (m.status ?? "continued") !== "discontinued")
      .map((m) => `${m.name} ${m.dose} ${m.frequency}`)
      .join(", ");

    const allergyList = allergies.length
      ? allergies.map((a) => (typeof a === "string" ? a : a.allergen || a)).join(", ")
      : "NKDA";

    const prompt = `You are Notrya AI. Generate a concise hospital discharge summary narrative.

Patient: ${patientName}, ${patientAge ? patientAge + "yo" : ""} ${patientGender}
MRN: ${patientId}
Chief Complaint: ${chiefComplaint}
Diagnoses: ${diagnoses.length ? diagnoses.join(", ") : "Not specified"}
Medications: ${medList || "None documented"}
Allergies: ${allergyList}

Write a professional discharge summary (2–3 paragraphs) covering:
1. Reason for visit and clinical course
2. Key findings and treatments
3. Medications and discharge plan

Be concise and professional.`;

    try {
      const result = await base44.integrations.Core.InvokeLLM({ prompt });
      setSummaryText(result || "");
      showToast("Discharge summary generated ✓", G.teal);
    } catch {
      showToast("AI generation unavailable", G.amber);
    }
    setAiGenerating(false);
  };

  const showToast = (msg, color) => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif", background: G.navy, minHeight: "100%", color: G.text, display: "flex", flexDirection: "column", overflow: "auto" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#2a4d72;border-radius:2px}
        textarea:focus{border-color:#00d4bc!important}
      `}</style>

      {/* HEADER */}
      <div style={{ padding: "20px 24px", borderBottom: `1px solid ${G.border}`, background: "rgba(11,29,53,.4)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <div style={{ fontSize: 22 }}>🏥</div>
          <div>
            <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 18, fontWeight: 700, color: G.bright }}>
              Discharge Planning
            </div>
            <div style={{ fontSize: 12, color: G.dim }}>
              <span style={{ color: G.bright, fontWeight: 600 }}>{patientName}</span> · {patientId} · {chiefComplaint || "New patient"}
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, padding: "24px", maxWidth: "900px", margin: "0 auto", width: "100%" }}>
        {/* PATIENT INFO */}
        <div style={{ background: G.panel, border: `1px solid ${G.border}`, borderRadius: 12, padding: "16px", marginBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {[
              ["Patient", patientName],
              ["Age / Sex", patientAge && patientGender ? `${patientAge}yo ${patientGender}` : "—"],
              ["MRN", patientId || "—"],
              ["DOB", patientDob || "—"],
              ["Chief Complaint", chiefComplaint || "—"],
              ["Diagnoses", diagnoses.length ? diagnoses.slice(0, 2).join(", ") : "—"],
            ].map(([label, value]) => (
              <div key={label}>
                <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".1em", color: G.dim, marginBottom: 4 }}>
                  {label}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: G.bright }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* DISCHARGE SUMMARY */}
        <div style={{ background: G.panel, border: `1px solid ${G.border}`, borderRadius: 12, marginBottom: 20, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${G.border}`, background: "rgba(0,212,188,.08)" }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: G.bright }}>📋 Discharge Summary</span>
          </div>
          <div style={{ padding: "16px" }}>
            <textarea
              value={summaryText}
              onChange={(e) => setSummaryText(e.target.value)}
              placeholder="Click 'Generate with AI' or type discharge summary here..."
              style={{
                width: "100%",
                minHeight: 240,
                background: "rgba(11,29,53,.5)",
                border: `1px solid rgba(30,58,95,.5)`,
                borderRadius: 9,
                padding: "13px 15px",
                fontFamily: "'DM Sans',system-ui,sans-serif",
                fontSize: 13,
                color: G.bright,
                lineHeight: 1.8,
                resize: "vertical",
                outline: "none",
              }}
            />
            <div style={{ display: "flex", gap: 10, marginTop: 12, justifyContent: "flex-end" }}>
              <button
                onClick={generateSummary}
                disabled={aiGenerating}
                style={{
                  padding: "9px 18px",
                  borderRadius: 8,
                  fontFamily: "inherit",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: aiGenerating ? "wait" : "pointer",
                  background: `linear-gradient(135deg,${G.purple},#7c5cd6)`,
                  color: "#fff",
                  border: "none",
                  transition: "all .15s",
                }}
              >
                {aiGenerating ? "✦ Generating…" : "✦ Generate with AI"}
              </button>
            </div>
          </div>
        </div>

        {/* MEDICATIONS */}
        {localMeds.length > 0 && (
          <div style={{ background: G.panel, border: `1px solid ${G.border}`, borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${G.border}`, background: "rgba(245,166,35,.08)" }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: G.bright }}>💊 Discharge Medications ({localMeds.length})</span>
            </div>
            <div style={{ padding: "16px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${G.border}` }}>
                    <th style={{ textAlign: "left", padding: "8px 0", fontWeight: 700, color: G.dim, textTransform: "uppercase", fontSize: 10 }}>
                      Medication
                    </th>
                    <th style={{ textAlign: "left", padding: "8px 0", fontWeight: 700, color: G.dim, textTransform: "uppercase", fontSize: 10 }}>
                      Route
                    </th>
                    <th style={{ textAlign: "left", padding: "8px 0", fontWeight: 700, color: G.dim, textTransform: "uppercase", fontSize: 10 }}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {localMeds.map((m) => (
                    <tr key={m.id} style={{ borderBottom: `1px solid rgba(30,58,95,.3)` }}>
                      <td style={{ padding: "8px 0", color: G.bright }}>{m.name}</td>
                      <td style={{ padding: "8px 0", color: G.text }}>{m.route}</td>
                      <td style={{ padding: "8px 0" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "rgba(0,212,188,.1)", color: G.teal }}>
                          {(m.status || "continued").toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ALLERGIES */}
        {allergies.length > 0 && (
          <div style={{ background: "rgba(255,92,108,.08)", border: `1px solid rgba(255,92,108,.25)`, borderRadius: 12, padding: "14px 16px", marginTop: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".07em", color: G.red, marginBottom: 8 }}>
              ⚠️ Documented Allergies
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {allergies.map((a, i) => (
                <span key={i} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, background: "rgba(255,92,108,.15)", color: G.rose }}>
                  {typeof a === "string" ? a : a.allergen || a}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* INFO TEXT */}
        <div style={{ fontSize: 11, color: G.dim, marginTop: 20, textAlign: "center", fontStyle: "italic" }}>
          Complete discharge planning by saving the clinical note. You can return to this tab anytime to edit the summary.
        </div>
      </div>

      {/* TOAST */}
      {toast && (
        <div style={{ position: "fixed", bottom: 20, right: 24, zIndex: 999 }}>
          <div
            style={{
              background: G.panel,
              border: `1px solid ${G.border}`,
              borderLeft: `3px solid ${toast.color}`,
              borderRadius: 10,
              padding: "11px 16px",
              fontSize: 12.5,
              fontWeight: 600,
              color: G.bright,
              boxShadow: "0 8px 24px rgba(0,0,0,.35)",
            }}
          >
            {toast.msg}
          </div>
        </div>
      )}
    </div>
  );
}