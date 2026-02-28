import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, User } from "lucide-react";

const T = {
  panel: "#0e2340",
  border: "#1e3a5f",
  text: "#c8ddf0",
  bright: "#e8f4ff",
  dim: "#4a7299",
  teal: "#00d4bc",
  teal2: "#00a896",
  edge: "#162d4f",
};

export default function QuickNoteCreatorWidget() {
  const [patientName, setPatientName] = useState("");
  const [noteType, setNoteType] = useState("progress_note");
  const [creating, setCreating] = useState(false);

  const noteTypes = [
    { id: "progress_note", label: "Progress Note" },
    { id: "h_and_p", label: "H&P" },
    { id: "discharge_summary", label: "Discharge Summary" },
    { id: "consult", label: "Consult" },
  ];

  const handleCreateNote = async () => {
    if (!patientName.trim()) return;
    try {
      setCreating(true);
      const newNote = await base44.entities.ClinicalNote.create({
        raw_note: "",
        patient_name: patientName,
        status: "draft",
        note_type: noteType,
      });
      window.location.href = `?page=NoteDetail&id=${newNote.id}`;
    } catch (error) {
      console.error("Failed to create note:", error);
      setCreating(false);
    }
  };

  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: "14px", padding: "16px", display: "flex", flexDirection: "column", gap: "12px", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
        <Plus className="w-4 h-4" style={{ color: T.teal }} />
        <div style={{ fontSize: "13px", color: T.bright, fontWeight: 600 }}>Quick Note</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
        <div>
          <label style={{ fontSize: "11px", color: T.dim, display: "block", marginBottom: "4px" }}>
            <User className="w-3 h-3 inline mr-1" />
            Patient Name
          </label>
          <input
            type="text"
            placeholder="Enter patient name"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleCreateNote()}
            style={{
              width: "100%",
              padding: "8px 10px",
              background: T.edge,
              border: `1px solid ${T.border}`,
              borderRadius: "8px",
              color: T.text,
              fontSize: "12px",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: "11px", color: T.dim, display: "block", marginBottom: "6px" }}>Note Type</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
            {noteTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setNoteType(type.id)}
                style={{
                  padding: "6px 8px",
                  background: noteType === type.id ? `rgba(0,212,188,0.2)` : T.edge,
                  border: noteType === type.id ? `1px solid ${T.teal}` : `1px solid ${T.border}`,
                  borderRadius: "6px",
                  color: noteType === type.id ? T.teal : T.dim,
                  fontSize: "10px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleCreateNote}
          disabled={!patientName.trim() || creating}
          style={{
            marginTop: "auto",
            padding: "10px",
            background: patientName.trim() ? `linear-gradient(135deg, ${T.teal}, ${T.teal2})` : T.dim,
            border: "none",
            borderRadius: "8px",
            color: patientName.trim() ? T.panel : T.dim,
            fontSize: "12px",
            fontWeight: 600,
            cursor: patientName.trim() ? "pointer" : "not-allowed",
            transition: "all 0.2s",
            opacity: creating ? 0.6 : 1,
          }}
        >
          {creating ? "Creating..." : "Create Note"}
        </button>
      </div>
    </div>
  );
}