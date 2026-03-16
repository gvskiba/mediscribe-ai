import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const C = {
  navy: "#050f1e", panel: "#0d2240", edge: "#162d4f", border: "#1e3a5f",
  muted: "#2a4d72", dim: "#4a7299", text: "#c8ddf0", bright: "#e8f4ff",
  teal: "#00d4bc", amber: "#f5a623", red: "#ff5c6c", green: "#2ecc71", purple: "#9b6dff",
};

export default function AINoteSummaryPanel({ noteId, pt, cc, onApply }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const hasContent = pt?.cc || pt?.hpi || cc?.text || noteId;

  const generate = async () => {
    if (!noteId && !hasContent) {
      toast.error("Enter patient info or save the note first.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // If we have a noteId, use the backend function for full analysis
      if (noteId) {
        const res = await base44.functions.invoke("analyzeAndStructureNote", { noteId });
        const data = res.data?.structured || {};
        setResult({
          summary: data.summary || "",
          assessment: data.assessment || "",
          plan: data.plan || "",
          diagnoses: data.diagnoses || [],
          chief_complaint: data.chief_complaint || "",
        });
        toast.success("Clinical summary generated!");
      } else {
        // Inline LLM call using current form state
        const contextParts = [
          pt?.name && `Patient: ${pt.name}, ${pt.age || "?"} ${pt.sex || ""}`,
          pt?.cc && `Chief Complaint: ${pt.cc}`,
          pt?.hpi && `HPI: ${pt.hpi}`,
          pt?.pmh?.length && `PMH: ${pt.pmh.join(", ")}`,
          pt?.allergies?.length && `Allergies: ${pt.allergies.join(", ")}`,
          pt?.meds?.length && `Medications: ${pt.meds.map(m => `${m.n} ${m.d}`).join("; ")}`,
          (pt?.vitals?.hr || pt?.vitals?.sbp) && `Vitals: HR ${pt.vitals.hr || "—"}, BP ${pt.vitals.sbp || "—"}/${pt.vitals.dbp || "—"}, Temp ${pt.vitals.temp || "—"}, SpO2 ${pt.vitals.spo2 || "—"}%`,
        ].filter(Boolean).join("\n");

        const res = await base44.integrations.Core.InvokeLLM({
          prompt: `You are a senior clinician. Based on the following patient data, generate a structured clinical summary with Assessment and Plan.

${contextParts}

Return JSON with:
- summary: 2–3 sentence clinical overview
- assessment: concise differential/clinical impression
- plan: numbered management plan based on the symptoms and history
- diagnoses: array of likely diagnoses (strings)`,
          response_json_schema: {
            type: "object",
            properties: {
              summary: { type: "string" },
              assessment: { type: "string" },
              plan: { type: "string" },
              diagnoses: { type: "array", items: { type: "string" } },
            },
          },
        });

        setResult(res);
        toast.success("Clinical summary generated!");
      }
    } catch (e) {
      toast.error("Failed to generate summary: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const applyToNote = () => {
    if (!result || !onApply) return;
    onApply(result);
    toast.success("Assessment & Plan applied to note.");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.teal, flexShrink: 0 }} />
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fontWeight: 700, color: C.teal, letterSpacing: ".12em" }}>AI CLINICAL SUMMARY</div>
      </div>

      <div style={{ fontSize: 11, color: C.dim, lineHeight: 1.6, marginBottom: 4 }}>
        Automatically generate a concise clinical summary, Assessment, and Plan from the current note data using AI.
      </div>

      {/* Generate Button */}
      <button
        onClick={generate}
        disabled={loading}
        style={{
          padding: "9px 14px",
          borderRadius: 10,
          background: loading ? C.edge : `linear-gradient(135deg, ${C.teal}, #00b8a5)`,
          border: loading ? `1px solid ${C.border}` : "none",
          color: loading ? C.dim : C.navy,
          fontSize: 12,
          fontWeight: 700,
          cursor: loading ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 7,
          transition: "all .2s",
          fontFamily: "'DM Sans',sans-serif",
        }}
      >
        {loading ? (
          <>
            <div style={{ width: 12, height: 12, border: `2px solid ${C.muted}`, borderTopColor: C.teal, borderRadius: "50%", animation: "spin .7s linear infinite" }} />
            Generating...
          </>
        ) : (
          <> ✦ Generate Clinical Summary</>
        )}
      </button>

      {/* Result */}
      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, animation: "fadeUp .25s ease" }}>
          {result.summary && (
            <div style={{ background: "linear-gradient(135deg,rgba(0,212,188,.06),rgba(155,109,255,.03))", border: "1px solid rgba(0,212,188,.22)", borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fontWeight: 700, color: C.teal, letterSpacing: ".1em", marginBottom: 5 }}>CLINICAL SUMMARY</div>
              <div style={{ fontSize: 12, color: C.text, lineHeight: 1.7 }}>{result.summary}</div>
            </div>
          )}

          {result.diagnoses?.length > 0 && (
            <div style={{ background: C.edge, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fontWeight: 700, color: C.amber, letterSpacing: ".1em", marginBottom: 6 }}>LIKELY DIAGNOSES</div>
              {result.diagnoses.map((dx, i) => (
                <div key={i} style={{ display: "flex", gap: 6, padding: "3px 0", fontSize: 11, color: C.text }}>
                  <span style={{ color: C.amber, fontWeight: 700 }}>{i + 1}.</span> {dx}
                </div>
              ))}
            </div>
          )}

          {result.assessment && (
            <div style={{ background: C.edge, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fontWeight: 700, color: C.purple, letterSpacing: ".1em", marginBottom: 5 }}>ASSESSMENT</div>
              <div style={{ fontSize: 11, color: C.text, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{result.assessment}</div>
            </div>
          )}

          {result.plan && (
            <div style={{ background: C.edge, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fontWeight: 700, color: C.green, letterSpacing: ".1em", marginBottom: 5 }}>PLAN</div>
              <div style={{ fontSize: 11, color: C.text, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{result.plan}</div>
            </div>
          )}

          {/* Apply Button */}
          <button
            onClick={applyToNote}
            style={{
              padding: "8px 14px",
              borderRadius: 9,
              background: "rgba(155,109,255,.12)",
              border: "1px solid rgba(155,109,255,.35)",
              color: C.purple,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "'DM Sans',sans-serif",
              transition: "all .2s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(155,109,255,.22)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(155,109,255,.12)"}
          >
            ↓ Apply Assessment & Plan to Note
          </button>
        </div>
      )}
    </div>
  );
}