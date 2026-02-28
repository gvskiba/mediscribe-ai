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
  const [loading, setLoading] = useState(true);
  const [specialty, setSpecialty] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const user = await base44.auth.me();
        setSpecialty(user?.clinical_settings?.medical_specialty || "emergency_medicine");

        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `Generate 4-5 brief clinical insights and trending topics relevant to ${user?.clinical_settings?.medical_specialty || "emergency medicine"} based on recent clinical literature and guidelines. Focus on recent developments, common pitfalls, and important updates clinicians should know about. Format as bullet points with practical, actionable information.`,
          add_context_from_internet: true,
        });

        const insightList = result?.split("\n").filter(line => line.trim().length > 0).slice(0, 5) || [];
        setInsights(insightList);
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

      <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", color: T.dim, fontSize: "12px", padding: "16px 0" }}>
            <Loader2 className="w-3 h-3 animate-spin" />
            Loading insights…
          </div>
        ) : insights.length === 0 ? (
          <div style={{ color: T.dim, fontSize: "12px", textAlign: "center", padding: "16px 0" }}>
            No insights available
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {insights.map((insight, idx) => (
              <div
                key={idx}
                style={{
                  padding: "10px 12px",
                  background: T.edge,
                  borderLeft: `3px solid ${T.purple}`,
                  borderRadius: "6px",
                  fontSize: "12px",
                  color: T.text,
                  lineHeight: 1.4,
                }}
              >
                {insight.replace(/^[-•*]\s*/, "")}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}