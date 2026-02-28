import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search, ChevronRight } from "lucide-react";

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
  amber: "#f5a623",
};

export default function RecentQueriesWidget() {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadQueries = async () => {
      try {
        const guides = await base44.entities.GuidelineQuery.list("-updated_date", 5);
        setQueries(guides || []);
      } catch (error) {
        console.error("Failed to load queries:", error);
      } finally {
        setLoading(false);
      }
    };
    loadQueries();
  }, []);

  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: "14px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <Search className="w-4 h-4" style={{ color: T.teal }} />
          <div style={{ fontSize: "13px", color: T.bright, fontWeight: 600 }}>
            Recent Queries
          </div>
        </div>
        <p style={{ fontSize: "11px", color: T.dim, margin: 0 }}>Your guideline searches</p>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading ? (
          <div style={{ padding: "12px 16px", textAlign: "center", color: T.dim, fontSize: "12px" }}>Loading…</div>
        ) : queries.length === 0 ? (
          <div style={{ padding: "12px 16px", textAlign: "center", color: T.dim, fontSize: "12px" }}>
            No recent queries
          </div>
        ) : (
          queries.map((query, idx) => (
            <div
              key={query.id}
              style={{
                padding: "10px 14px",
                borderBottom: idx < queries.length - 1 ? `1px solid ${T.border}` : "none",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = T.edge; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <div style={{ fontSize: "12px", color: T.bright, fontWeight: 500, marginBottom: "4px", lineHeight: 1.3 }}>
                {query.question}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "10px", color: T.dim }}>
                {query.confidence_level && (
                  <span style={{ background: "rgba(0,212,188,0.15)", padding: "2px 6px", borderRadius: "3px", color: T.teal }}>
                    {query.confidence_level}
                  </span>
                )}
                {query.rating && (
                  <span style={{ color: T.amber }}>★ {query.rating}/5</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}