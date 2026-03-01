import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Lightbulb, Loader2 } from "lucide-react";

const T = {
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
  purple: "#9b6dff",
  rose: "#f472b6",
};

export default function SpecialtyInsightsWidget() {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [specialty, setSpecialty] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const user = await base44.auth.me();
        setSpecialty(user?.clinical_settings?.medical_specialty || "emergency_medicine");
      } catch (error) {
        console.error("Failed to load user:", error);
      }
    };
    load();
  }, []);

  const fetchInsights = async () => {
    setLoading(true);
    try {
        const user = await base44.auth.me();
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `Find 3-4 recent clinical insights relevant to ${user?.clinical_settings?.medical_specialty || "emergency medicine"}. For each insight:
1. Provide the key clinical point or recent development
2. Cite a specific guideline, organization, or research (e.g., "ACC/AHA 2023", "NEJM 2024", "Cochrane 2023")
3. Include a practical recommendation

Format as JSON array with objects containing: {insight: "...", guideline: "...", source_url: "...", recommendation: "..."}.
Make sure to cite real, verifiable sources with URLs.`,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              insights: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    insight: { type: "string" },
                    guideline: { type: "string" },
                    source_url: { type: "string" },
                    recommendation: { type: "string" }
                  }
                }
              }
            }
          }
        });

        setInsights(result?.insights || []);
      } catch (error) {
        console.error("Failed to load insights:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: "14px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <Lightbulb className="w-4 h-4" style={{ color: T.purple }} />
          <div style={{ fontSize: "13px", color: T.bright, fontWeight: 600 }}>
            Specialty Insights
          </div>
        </div>
        <p style={{ fontSize: "11px", color: T.dim, margin: 0 }}>Trending topics & updates</p>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "14px" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", color: T.dim, fontSize: "12px", padding: "24px 0" }}>
            <Loader2 className="w-3 h-3 animate-spin" />
            Loading insights…
          </div>
        ) : insights.length === 0 ? (
          <div style={{ color: T.dim, fontSize: "12px", textAlign: "center", padding: "24px 0" }}>
            No insights available
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {insights.map((insight, idx) => (
              <div
                key={idx}
                style={{
                  padding: "12px 14px",
                  background: T.edge,
                  border: `1px solid ${T.border}`,
                  borderRadius: "8px",
                  fontSize: "11px",
                  color: T.text,
                  lineHeight: 1.5,
                }}
              >
                {/* Main Insight */}
                <div style={{ marginBottom: "8px", fontSize: "12px", fontWeight: 600, color: T.bright }}>
                  {insight.insight}
                </div>

                {/* Guideline Citation */}
                <div style={{ marginBottom: "8px", fontSize: "10px" }}>
                  <span style={{ color: T.muted }}>Source: </span>
                  {insight.source_url ? (
                    <a
                      href={insight.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: T.teal,
                        textDecoration: "none",
                        fontWeight: 500,
                        cursor: "pointer"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"}
                      onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}
                    >
                      {insight.guideline}
                    </a>
                  ) : (
                    <span style={{ color: T.teal, fontWeight: 500 }}>{insight.guideline}</span>
                  )}
                </div>

                {/* Recommendation */}
                {insight.recommendation && (
                  <div style={{
                    paddingTop: "8px",
                    borderTop: `1px solid ${T.muted}`,
                    fontSize: "11px",
                    color: T.dim
                  }}>
                    <span style={{ color: T.rose, fontWeight: 600 }}>💡 </span>
                    {insight.recommendation}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}