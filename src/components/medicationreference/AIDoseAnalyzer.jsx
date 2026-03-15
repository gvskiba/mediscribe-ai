import { useState } from "react";
import { base44 } from "@/api/base44Client";

// Detects if a dose string contains a range (span) like "5–10 mg" or "0.1-0.3 mg/kg"
export function hasDoseRange(doseStr) {
  return /[\d.]+\s*[–\-]\s*[\d.]+/.test(doseStr);
}

export default function AIDoseAnalyzer({ med, weightKg, patientContext }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState(patientContext || "");

  const analyze = async () => {
    setLoading(true);
    setResult(null);
    try {
      const dosingInfo = med.dosing
        ? med.dosing.map(d => `• ${d.indication}: ${d.dose} (${d.route})`).join("\n")
        : med.adult_dose;

      const prompt = `You are a clinical pharmacist AI. Given the following drug information and patient details, recommend a SPECIFIC dose (not a range) with clear clinical reasoning.

Drug: ${med.name} (${med.brand})
Drug Class: ${med.drugClass || med.subtitle}
Dose Range: ${dosingInfo}
Contraindications: ${(med.contraindications || []).join(", ")}
Warnings: ${(med.warnings || []).join("; ")}
${weightKg ? `Patient Weight: ${weightKg} kg` : ""}
${context ? `Clinical Context: ${context}` : ""}

Based on the dose range provided, recommend ONE specific dose. Consider weight if provided.
Format your response as:
RECOMMENDED DOSE: [specific dose]
ROUTE & FREQUENCY: [how to give it]
REASONING: [2–3 sentences of clinical rationale, mentioning weight-based calculation if applicable]
MONITORING: [key parameters to watch]`;

      const res = await base44.integrations.Core.InvokeLLM({ prompt });
      setResult(typeof res === "string" ? res : JSON.stringify(res));
    } catch (e) {
      setResult("⚠ AI unavailable. Please check clinical references.");
    }
    setLoading(false);
  };

  if (!hasDoseRange(med.adult_dose) && !(med.dosing?.some(d => hasDoseRange(d.dose)))) return null;

  return (
    <div style={{ marginTop: 10, borderTop: "1px solid rgba(0,196,160,0.1)", paddingTop: 10 }}>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 5,
            border: "1px solid rgba(0,196,160,0.3)", background: "rgba(0,196,160,0.08)",
            color: "#00c4a0", cursor: "pointer", fontFamily: "inherit", letterSpacing: ".04em"
          }}
        >
          ⚡ AI DOSE RECOMMENDATION {weightKg ? `· ${weightKg} kg` : "· Set patient weight for best results"}
        </button>
      ) : (
        <div style={{ background: "rgba(0,196,160,0.04)", border: "1px solid rgba(0,196,160,0.15)", borderRadius: 8, padding: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#00c4a0", letterSpacing: ".08em" }}>⚡ AI DOSE ANALYSIS</span>
            {weightKg && <span style={{ fontSize: 10, color: "#4a6080" }}>Patient: {weightKg} kg</span>}
            <button onClick={() => { setOpen(false); setResult(null); }} style={{ marginLeft: "auto", background: "transparent", border: "none", color: "#4a6080", cursor: "pointer", fontSize: 12 }}>✕</button>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              value={context}
              onChange={e => setContext(e.target.value)}
              placeholder="Add clinical context: renal function, diagnosis, allergies, comorbidities..."
              style={{
                flex: 1, background: "#0d1628", border: "1px solid rgba(0,196,160,0.15)",
                borderRadius: 6, padding: "6px 10px", color: "#e2e8f0", fontSize: 11,
                outline: "none", fontFamily: "inherit"
              }}
            />
            <button
              onClick={analyze}
              disabled={loading}
              style={{
                padding: "6px 14px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                background: "#00c4a0", border: "none", color: "#080e1a",
                cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.5 : 1,
                fontFamily: "inherit", whiteSpace: "nowrap"
              }}
            >
              {loading ? "Analyzing..." : "Get Dose →"}
            </button>
          </div>

          {result && (
            <div style={{
              background: "#0d1628", borderRadius: 6, padding: "10px 12px",
              fontSize: 11, color: "#94a3b8", lineHeight: 1.7, whiteSpace: "pre-wrap",
              border: "1px solid rgba(0,196,160,0.1)"
            }}>
              {result.split("\n").map((line, i) => {
                const isHeader = line.startsWith("RECOMMENDED DOSE:") || line.startsWith("ROUTE") || line.startsWith("REASONING:") || line.startsWith("MONITORING:");
                return (
                  <div key={i} style={{ color: isHeader ? "#00c4a0" : "#94a3b8", fontWeight: isHeader ? 700 : 400 }}>
                    {line}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}