import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Bookmark, ArrowRight } from "lucide-react";
import { createPageUrl } from "../../utils";
import { Link } from "react-router-dom";

const T = {
  panel: "#0e2340",
  border: "#1e3a5f",
  text: "#c8ddf0",
  dim: "#4a7299",
  teal: "#00d4bc",
};

export default function SavedGuidelinesWidget() {
  const [guidelines, setGuidelines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGuidelines = async () => {
      try {
        const saved = await base44.entities.SavedGuideline.list("-saved_date", 5);
        setGuidelines(saved || []);
      } catch (error) {
        console.error("Failed to load saved guidelines:", error);
      } finally {
        setLoading(false);
      }
    };
    loadGuidelines();
  }, []);

  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: "14px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Bookmark className="w-4 h-4" style={{ color: T.teal }} />
          <span style={{ fontSize: "13px", color: T.text, fontWeight: 600 }}>Saved Guidelines</span>
        </div>
        <span style={{ fontSize: "11px", color: T.dim, background: T.border, padding: "2px 8px", borderRadius: "4px" }}>
          {guidelines.length}
        </span>
      </div>

      {/* Guidelines List */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading ? (
          <div style={{ padding: "16px", textAlign: "center", color: T.dim, fontSize: "12px" }}>Loading...</div>
        ) : guidelines.length === 0 ? (
          <div style={{ padding: "16px", textAlign: "center", color: T.dim, fontSize: "12px" }}>No saved guidelines yet</div>
        ) : (
          guidelines.map((guideline) => (
            <div
              key={guideline.id}
              style={{
                display: "flex",
                gap: "10px",
                padding: "10px 14px",
                borderBottom: `1px solid ${T.border}`,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = `rgba(22, 45, 79, 0.5)`; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: T.teal, marginTop: "3px", flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "12px", color: T.text, fontWeight: 500, marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {guideline.title}
                </div>
                <div style={{ fontSize: "10px", color: T.dim }}>
                  {guideline.source}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <Link
        to={createPageUrl("Guidelines")}
        style={{
          padding: "10px 14px",
          borderTop: `1px solid ${T.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          fontSize: "12px",
          fontWeight: 600,
          color: T.teal,
          background: T.border,
          textDecoration: "none",
          cursor: "pointer",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = `rgba(0, 212, 188, 0.15)`; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = T.border; }}
      >
        View All
        <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}