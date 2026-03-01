import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, AlertCircle, Lightbulb, Check } from "lucide-react";

export default function LabsImagingAIReview({ labs = [], imaging = [], assessment, patient, onLoadingChange }) {
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateAIReview = async () => {
    if ((labs.length === 0 && imaging.length === 0) || !patient) return;
    
    setIsLoading(true);
    setError(null);
    onLoadingChange?.(true);

    try {
      const labText = labs.length > 0 
        ? labs.map(l => `${l.panelName}: ${l.resultStatus || 'pending'} ${l.criticalFlag ? '🚨 CRITICAL' : ''}`).join('\n')
        : "No labs ordered";

      const imagingText = imaging.length > 0
        ? imaging.map(i => `${i.studyName}: ${i.readStatus || 'pending'} ${i.impression || ''}`).join('\n')
        : "No imaging ordered";

      const prompt = `You are a clinical decision support AI. Analyze these lab and imaging results for a patient and provide a structured review.

PATIENT: ${patient.name || "Patient"} | AGE: ${patient.age || "—"} | GENDER: ${patient.gender || "—"}

LABS ORDERED:
${labText}

IMAGING ORDERED:
${imagingText}

CURRENT ASSESSMENT: ${assessment?.initialDiagnosis || "Not yet documented"}

Please provide a JSON response with:
1. critical_flags: Array of critical/abnormal findings requiring immediate action
2. key_findings: 2-3 sentence summary of most significant findings
3. clinical_significance: Brief explanation of what these findings suggest clinically
4. recommended_consults: Array of specialist consults to consider
5. follow_up_actions: Array of specific next steps (repeat labs, advanced imaging, etc.)
6. urgency_level: "STAT", "URGENT", "ROUTINE", or "MONITORING"

Format the response as valid JSON only.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            critical_flags: {
              type: "array",
              items: { type: "string" }
            },
            key_findings: { type: "string" },
            clinical_significance: { type: "string" },
            recommended_consults: {
              type: "array",
              items: { type: "string" }
            },
            follow_up_actions: {
              type: "array",
              items: { type: "string" }
            },
            urgency_level: {
              type: "string",
              enum: ["STAT", "URGENT", "ROUTINE", "MONITORING"]
            }
          }
        }
      });

      setAnalysis(result);
    } catch (err) {
      setError(err.message || "Failed to generate AI review");
    } finally {
      setIsLoading(false);
      onLoadingChange?.(false);
    }
  };

  const colors = {
    navy: "#050f1e",
    slate: "#0b1d35",
    panel: "#0e2340",
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
  };

  const getUrgencyColor = (level) => {
    const urgencyMap = {
      "STAT": colors.red,
      "URGENT": colors.amber,
      "ROUTINE": colors.teal,
      "MONITORING": colors.green
    };
    return urgencyMap[level] || colors.dim;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <button
        onClick={generateAIReview}
        disabled={isLoading || (labs.length === 0 && imaging.length === 0)}
        style={{
          background: "rgba(155,109,255,0.2)",
          border: `1px solid ${colors.purple}`,
          color: colors.purple,
          padding: "8px 12px",
          borderRadius: "6px",
          fontSize: "10px",
          fontWeight: 600,
          cursor: isLoading || (labs.length === 0 && imaging.length === 0) ? "not-allowed" : "pointer",
          opacity: isLoading || (labs.length === 0 && imaging.length === 0) ? 0.5 : 1,
          display: "flex",
          alignItems: "center",
          gap: "6px",
          justifyContent: "center",
          transition: "all 0.2s"
        }}
        onMouseEnter={(e) => {
          if (!isLoading && (labs.length > 0 || imaging.length > 0)) {
            e.currentTarget.style.background = "rgba(155,109,255,0.3)";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(155,109,255,0.2)";
        }}
      >
        {isLoading ? (
          <>
            <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
            Analyzing...
          </>
        ) : (
          <>
            ⚡ AI Review Labs & Imaging
          </>
        )}
      </button>

      {error && (
        <div style={{
          background: "rgba(255,92,108,0.1)",
          border: `1px solid ${colors.red}`,
          borderRadius: "6px",
          padding: "10px",
          color: colors.red,
          fontSize: "10px"
        }}>
          {error}
        </div>
      )}

      {analysis && (
        <div style={{
          background: colors.panel,
          border: `1px solid ${colors.border}`,
          borderLeft: `3px solid ${getUrgencyColor(analysis.urgency_level)}`,
          borderRadius: "8px",
          padding: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "12px"
        }}>
          {/* Urgency Badge */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: `${getUrgencyColor(analysis.urgency_level)}20`,
            padding: "6px 8px",
            borderRadius: "4px",
            width: "fit-content"
          }}>
            <AlertCircle size={12} style={{ color: getUrgencyColor(analysis.urgency_level) }} />
            <span style={{ color: getUrgencyColor(analysis.urgency_level), fontSize: "9px", fontWeight: 700 }}>
              {analysis.urgency_level} REVIEW
            </span>
          </div>

          {/* Critical Flags */}
          {analysis.critical_flags?.length > 0 && (
            <div>
              <p style={{ fontSize: "10px", color: colors.amber, fontWeight: 600, margin: "0 0 6px 0", textTransform: "uppercase" }}>
                🚨 Critical Findings
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {analysis.critical_flags.map((flag, idx) => (
                  <div key={idx} style={{
                    background: "rgba(255,92,108,0.1)",
                    border: `1px solid ${colors.red}`,
                    borderRadius: "4px",
                    padding: "6px 8px",
                    fontSize: "9px",
                    color: colors.text
                  }}>
                    {flag}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Findings */}
          <div>
            <p style={{ fontSize: "10px", color: colors.teal, fontWeight: 600, margin: "0 0 6px 0", textTransform: "uppercase" }}>
              📊 Key Findings
            </p>
            <p style={{ fontSize: "10px", color: colors.text, margin: 0, lineHeight: "1.4" }}>
              {analysis.key_findings}
            </p>
          </div>

          {/* Clinical Significance */}
          <div>
            <p style={{ fontSize: "10px", color: colors.purple, fontWeight: 600, margin: "0 0 6px 0", textTransform: "uppercase" }}>
              🔬 Clinical Significance
            </p>
            <p style={{ fontSize: "10px", color: colors.dim, margin: 0, lineHeight: "1.4" }}>
              {analysis.clinical_significance}
            </p>
          </div>

          {/* Recommended Consults */}
          {analysis.recommended_consults?.length > 0 && (
            <div>
              <p style={{ fontSize: "10px", color: colors.green, fontWeight: 600, margin: "0 0 6px 0", textTransform: "uppercase" }}>
                👥 Recommended Consults
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                {analysis.recommended_consults.map((consult, idx) => (
                  <div key={idx} style={{ fontSize: "9px", color: colors.text, display: "flex", gap: "6px", alignItems: "center" }}>
                    <Check size={10} style={{ color: colors.green, flexShrink: 0 }} />
                    {consult}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Follow-up Actions */}
          {analysis.follow_up_actions?.length > 0 && (
            <div>
              <p style={{ fontSize: "10px", color: colors.amber, fontWeight: 600, margin: "0 0 6px 0", textTransform: "uppercase" }}>
                <Lightbulb size={10} style={{ display: "inline", marginRight: "4px" }} />
                Follow-up Actions
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                {analysis.follow_up_actions.map((action, idx) => (
                  <div key={idx} style={{ fontSize: "9px", color: colors.text, display: "flex", gap: "6px", alignItems: "flex-start" }}>
                    <span style={{ color: colors.amber, marginTop: "1px" }}>→</span>
                    <span>{action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}