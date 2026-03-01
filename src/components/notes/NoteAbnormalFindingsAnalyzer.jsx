import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, AlertCircle, Lightbulb, Check, TrendingUp } from "lucide-react";

export default function NoteAbnormalFindingsAnalyzer({ note, noteId, queryClient }) {
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateAIAnalysis = async () => {
    if (!note) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const prompt = `Analyze this complete clinical note and extract ALL abnormal findings, critical values, and red flags from every section. Look across ALL sections - not just labs/imaging.

PATIENT: ${note.patient_name || "Unknown"} | AGE: ${note.patient_age || "—"}

CHIEF COMPLAINT:
${note.chief_complaint || "Not documented"}

HISTORY OF PRESENT ILLNESS:
${note.history_of_present_illness || "Not documented"}

REVIEW OF SYSTEMS:
${note.review_of_systems || "Not documented"}

PHYSICAL EXAM:
${note.physical_exam || "Not documented"}

VITAL SIGNS:
${note.vital_signs ? JSON.stringify(note.vital_signs, null, 2) : "Not documented"}

LAB FINDINGS:
${note.lab_findings && note.lab_findings.length > 0 ? note.lab_findings.map(l => \`\${l.test_name}: \${l.result} \${l.unit || ''} (Normal: \${l.reference_range || 'N/A'}) - Status: \${l.status}\`).join('\\n') : "No labs"}

IMAGING FINDINGS:
${note.imaging_findings && note.imaging_findings.length > 0 ? note.imaging_findings.map(i => \`\${i.study_type}: \${i.findings} - Impression: \${i.impression}\`).join('\\n') : "No imaging"}

ASSESSMENT:
${note.assessment || "Not documented"}

PLAN:
${note.plan || "Not documented"}

MEDICATIONS:
${note.medications ? note.medications.join(', ') : "None"}

Please analyze and return a JSON response with these fields:
1. critical_findings: Array of STAT/immediately dangerous findings (e.g., critical lab values, severe symptoms, emergency signs)
2. abnormal_findings: Array of abnormal but non-critical findings from all sections (vitals, exams, labs, imaging, HPI)
3. findings_summary: 3-4 sentence summary of most significant findings
4. clinical_implications: Brief explanation of what these findings mean clinically
5. recommended_follow_ups: Array of specific recommended next steps or interventions
6. sections_analyzed: Array of which sections had abnormal findings (e.g., "physical_exam", "lab_findings", "vital_signs")
7. urgency_level: "CRITICAL", "HIGH", "MODERATE", or "LOW" based on severity

Be thorough and catch subtle abnormalities like out-of-range vitals, concerning physical exam findings, abnormal ROS items, etc.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            critical_findings: {
              type: "array",
              items: { type: "string" },
              description: "Immediately dangerous or STAT findings"
            },
            abnormal_findings: {
              type: "array",
              items: { type: "string" },
              description: "All abnormal findings from every note section"
            },
            findings_summary: { type: "string" },
            clinical_implications: { type: "string" },
            recommended_follow_ups: {
              type: "array",
              items: { type: "string" }
            },
            sections_analyzed: {
              type: "array",
              items: { type: "string" }
            },
            urgency_level: {
              type: "string",
              enum: ["CRITICAL", "HIGH", "MODERATE", "LOW"]
            }
          }
        }
      });

      setAnalysis(result);
    } catch (err) {
      setError(err.message || "Failed to analyze note");
      console.error("Analysis error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getUrgencyColor = (level) => {
    const colorMap = {
      "CRITICAL": { bg: "rgba(255,92,108,0.1)", border: "#ff5c6c", text: "#ff5c6c" },
      "HIGH": { bg: "rgba(245,166,35,0.1)", border: "#f5a623", text: "#f5a623" },
      "MODERATE": { bg: "rgba(155,109,255,0.1)", border: "#9b6dff", text: "#9b6dff" },
      "LOW": { bg: "rgba(46,204,113,0.1)", border: "#2ecc71", text: "#2ecc71" }
    };
    return colorMap[level] || colorMap["MODERATE"];
  };

  const getUrgencyIcon = (level) => {
    switch(level) {
      case "CRITICAL": return "🚨";
      case "HIGH": return "⚠️";
      case "MODERATE": return "⚡";
      case "LOW": return "ℹ️";
      default: return "📋";
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <button
        onClick={generateAIAnalysis}
        disabled={isLoading || !note}
        style={{
          background: "rgba(155,109,255,0.2)",
          border: "1px solid #9b6dff",
          color: "#9b6dff",
          padding: "10px 14px",
          borderRadius: "6px",
          fontSize: "11px",
          fontWeight: 600,
          cursor: isLoading || !note ? "not-allowed" : "pointer",
          opacity: isLoading || !note ? 0.5 : 1,
          display: "flex",
          alignItems: "center",
          gap: "6px",
          justifyContent: "center",
          transition: "all 0.2s"
        }}
        onMouseEnter={(e) => {
          if (!isLoading && note) {
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
            Analyzing All Sections...
          </>
        ) : (
          <>
            ⚡ AI Analyze Abnormal Findings
          </>
        )}
      </button>

      {error && (
        <div style={{
          background: "rgba(255,92,108,0.1)",
          border: "1px solid #ff5c6c",
          borderRadius: "6px",
          padding: "10px 12px",
          color: "#ff5c6c",
          fontSize: "10px"
        }}>
          <AlertCircle size={12} style={{ display: "inline", marginRight: "6px" }} />
          {error}
        </div>
      )}

      {analysis && (
        <div style={{
          background: "#0e2340",
          border: `1px solid ${getUrgencyColor(analysis.urgency_level).border}`,
          borderLeft: `4px solid ${getUrgencyColor(analysis.urgency_level).border}`,
          borderRadius: "8px",
          padding: "14px",
          display: "flex",
          flexDirection: "column",
          gap: "14px"
        }}>
          {/* Urgency Badge */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: getUrgencyColor(analysis.urgency_level).bg,
            padding: "8px 10px",
            borderRadius: "4px",
            width: "fit-content"
          }}>
            <span style={{ fontSize: "14px" }}>{getUrgencyIcon(analysis.urgency_level)}</span>
            <span style={{ 
              color: getUrgencyColor(analysis.urgency_level).text, 
              fontSize: "9px", 
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.5px"
            }}>
              {analysis.urgency_level} PRIORITY
            </span>
          </div>

          {/* Critical Findings */}
          {analysis.critical_findings?.length > 0 && (
            <div>
              <p style={{ 
                fontSize: "10px", 
                color: "#ff8a95", 
                fontWeight: 600, 
                margin: "0 0 8px 0", 
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                🚨 CRITICAL FINDINGS
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {analysis.critical_findings.map((finding, idx) => (
                  <div key={idx} style={{
                    background: "rgba(255,92,108,0.1)",
                    border: "1px solid #ff5c6c",
                    borderRadius: "4px",
                    padding: "8px 10px",
                    fontSize: "9px",
                    color: "#c8ddf0",
                    lineHeight: "1.4"
                  }}>
                    <span style={{ color: "#ff8a95", fontWeight: 600, marginRight: "4px" }}>→</span>
                    {finding}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Abnormal Findings */}
          {analysis.abnormal_findings?.length > 0 && (
            <div>
              <p style={{ 
                fontSize: "10px", 
                color: "#f5a623", 
                fontWeight: 600, 
                margin: "0 0 8px 0",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                ⚠️ ABNORMAL FINDINGS
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {analysis.abnormal_findings.slice(0, 8).map((finding, idx) => (
                  <div key={idx} style={{
                    fontSize: "9px",
                    color: "#c8ddf0",
                    display: "flex",
                    gap: "6px",
                    alignItems: "flex-start",
                    padding: "4px 0"
                  }}>
                    <span style={{ color: "#f5a623", marginTop: "1px" }}>•</span>
                    <span>{finding}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Findings Summary */}
          <div>
            <p style={{ 
              fontSize: "10px", 
              color: "#00d4bc", 
              fontWeight: 600, 
              margin: "0 0 6px 0",
              textTransform: "uppercase",
              letterSpacing: "0.5px"
            }}>
              📊 SUMMARY
            </p>
            <p style={{ 
              fontSize: "9px", 
              color: "#c8ddf0", 
              margin: 0, 
              lineHeight: "1.5" 
            }}>
              {analysis.findings_summary}
            </p>
          </div>

          {/* Clinical Implications */}
          <div>
            <p style={{ 
              fontSize: "10px", 
              color: "#9b6dff", 
              fontWeight: 600, 
              margin: "0 0 6px 0",
              textTransform: "uppercase",
              letterSpacing: "0.5px"
            }}>
              🔬 CLINICAL IMPLICATIONS
            </p>
            <p style={{ 
              fontSize: "9px", 
              color: "#4a7299", 
              margin: 0, 
              lineHeight: "1.5" 
            }}>
              {analysis.clinical_implications}
            </p>
          </div>

          {/* Recommended Follow-ups */}
          {analysis.recommended_follow_ups?.length > 0 && (
            <div>
              <p style={{ 
                fontSize: "10px", 
                color: "#2ecc71", 
                fontWeight: 600, 
                margin: "0 0 8px 0",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                ✓ RECOMMENDED ACTIONS
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {analysis.recommended_follow_ups.map((action, idx) => (
                  <div key={idx} style={{
                    fontSize: "9px",
                    color: "#c8ddf0",
                    display: "flex",
                    gap: "6px",
                    alignItems: "flex-start"
                  }}>
                    <Check size={10} style={{ color: "#2ecc71", marginTop: "1px", flexShrink: 0 }} />
                    <span>{action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sections Analyzed */}
          {analysis.sections_analyzed?.length > 0 && (
            <div style={{
              paddingTop: "8px",
              borderTop: "1px solid #1e3a5f",
              fontSize: "8px",
              color: "#4a7299"
            }}>
              Sections analyzed: {analysis.sections_analyzed.join(", ")}
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