import React from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import PhysicalExamEditor from "./PhysicalExamEditor";
import TabDataPreview from "./TabDataPreview";
import ClinicalNotePreviewButton from "./ClinicalNotePreviewButton";
import { ArrowLeft } from "lucide-react";

export default function PhysicalExamTab({
  note, noteId, queryClient,
  physicalExamNormal, setPhysicalExamNormal,
  isFirstTab, isLastTab, handleBack, handleNext,
}) {
  const T = {
    navy: "#050f1e", slate: "#0b1d35", panel: "#0d2240", edge: "#162d4f",
    border: "#1e3a5f", muted: "#2a4d72", dim: "#4a7299", text: "#c8ddf0",
    bright: "#e8f4ff", teal: "#00d4bc", amber: "#f5a623", red: "#ff5c6c",
    green: "#2ecc71", purple: "#9b6dff", blue: "#4a90d9",
  };

  if (!note) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, minHeight: "100%", background: T.navy, padding: "0 0 20px 0" }}>
      <PhysicalExamEditor
        examData={note.physical_exam}
        note={note}
        onUpdate={async (d) => { await base44.entities.ClinicalNote.update(noteId, { physical_exam: typeof d === "string" ? d : JSON.stringify(d) }); queryClient.invalidateQueries({ queryKey: ["note", noteId] }); queryClient.invalidateQueries({ queryKey: ["studioNote", noteId] }); }}
        onAddToNote={async (t) => { await base44.entities.ClinicalNote.update(noteId, { physical_exam: t }); queryClient.invalidateQueries({ queryKey: ["note", noteId] }); queryClient.invalidateQueries({ queryKey: ["studioNote", noteId] }); toast.success("Saved to note"); }}
      />
      {/* Footer Nav */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: `1px solid ${T.border}`, marginTop: 12, paddingLeft: 24, paddingRight: 24 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <TabDataPreview tabId="physical_exam" note={note} />
          <ClinicalNotePreviewButton note={note} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {!isFirstTab?.() && (
            <button onClick={handleBack} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 14px", fontSize: 12, fontWeight: 600, color: T.dim, background: T.edge, border: `1px solid ${T.border}`, borderRadius: 8, cursor: "pointer", transition: "all 0.15s" }}>
              <ArrowLeft className="w-3.5 h-3.5" />Back
            </button>
          )}
          {!isLastTab?.() && (
            <button onClick={handleNext} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 14px", fontSize: 12, fontWeight: 600, color: T.navy, background: `linear-gradient(135deg, ${T.teal}, #00a896)`, border: "none", borderRadius: 8, cursor: "pointer", transition: "all 0.15s" }}>
              Next<ArrowLeft className="w-3.5 h-3.5 rotate-180" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}