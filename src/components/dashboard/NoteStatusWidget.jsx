import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { FileText } from "lucide-react";

const T = {
  panel: "#0e2340",
  border: "#1e3a5f",
  text: "#c8ddf0",
  bright: "#e8f4ff",
  dim: "#4a7299",
  teal: "#00d4bc",
  amber: "#f5a623",
  green: "#2ecc71",
  red: "#ff5c6c",
};

export default function NoteStatusWidget() {
  const [stats, setStats] = useState({ draft: 0, finalized: 0, amended: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const notes = await base44.entities.ClinicalNote.list();
        const counts = { draft: 0, finalized: 0, amended: 0 };
        notes?.forEach(note => {
          if (note.status in counts) counts[note.status]++;
        });
        setStats(counts);
      } catch (error) {
        console.error("Failed to load note stats:", error);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  const statItems = [
    { label: "Draft", value: stats.draft, color: T.dim },
    { label: "Finalized", value: stats.finalized, color: T.green },
    { label: "Amended", value: stats.amended, color: T.amber },
  ];

  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: "14px", padding: "16px", display: "flex", flexDirection: "column", gap: "12px", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
        <FileText className="w-4 h-4" style={{ color: T.teal }} />
        <div style={{ fontSize: "13px", color: T.bright, fontWeight: 600 }}>Note Status</div>
      </div>

      {loading ? (
        <div style={{ fontSize: "12px", color: T.dim }}>Loading...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
          {statItems.map((item) => (
            <div
              key={item.label}
              style={{
                background: `rgba(${item.color === T.green ? "46,204,113" : item.color === T.amber ? "245,166,35" : "74,114,153"}, 0.15)`,
                border: `1px solid ${item.color}`,
                borderRadius: "8px",
                padding: "10px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "20px", fontWeight: 700, color: item.color }}>
                {item.value}
              </div>
              <div style={{ fontSize: "10px", color: T.dim, marginTop: "3px" }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}