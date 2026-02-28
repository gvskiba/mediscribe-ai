import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, AlertCircle } from "lucide-react";

const T = {
  panel: "#0e2340",
  border: "#1e3a5f",
  text: "#c8ddf0",
  bright: "#e8f4ff",
  dim: "#4a7299",
  teal: "#00d4bc",
  amber: "#f5a623",
  red: "#ff5c6c",
};

export default function PendingSignaturesWidget() {
  const [pendingNotes, setPendingNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPending = async () => {
      try {
        const notes = await base44.entities.ClinicalNote.list('-updated_date', 10);
        const pending = notes?.filter(n => n.status === "finalized")?.slice(0, 5) || [];
        setPendingNotes(pending);
      } catch (error) {
        console.error("Failed to load pending notes:", error);
      } finally {
        setLoading(false);
      }
    };
    loadPending();
  }, []);

  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: "14px", padding: "16px", display: "flex", flexDirection: "column", gap: "10px", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
        <CheckCircle2 className="w-4 h-4" style={{ color: T.amber }} />
        <div style={{ fontSize: "13px", color: T.bright, fontWeight: 600 }}>Awaiting Signature</div>
        <div style={{ marginLeft: "auto", fontSize: "12px", color: T.amber, fontWeight: 600 }}>
          {pendingNotes.length}
        </div>
      </div>

      {loading ? (
        <div style={{ fontSize: "12px", color: T.dim }}>Loading...</div>
      ) : pendingNotes.length === 0 ? (
        <div style={{ fontSize: "12px", color: T.dim, padding: "12px", textAlign: "center" }}>
          All notes signed ✓
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
          {pendingNotes.map((note) => (
            <div
              key={note.id}
              onClick={() => window.location.href = `?page=NoteDetail&id=${note.id}`}
              style={{
                padding: "8px 10px",
                borderRadius: "8px",
                background: T.border,
                border: `1px solid ${T.amber}`,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = `rgba(245,166,35,0.15)`; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = T.border; }}
            >
              <div style={{ fontSize: "12px", color: T.text, fontWeight: 500 }}>{note.patient_name}</div>
              <div style={{ fontSize: "10px", color: T.dim }}>
                {new Date(note.updated_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}