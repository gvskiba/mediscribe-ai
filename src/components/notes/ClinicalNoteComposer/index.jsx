import React, { useState } from "react";
import NoteTypePanel from "./NoteTypePanel";
import TemplatePanel from "./TemplatePanel";
import ClinicalNotePreview from "./ClinicalNotePreview";

export default function ClinicalNoteComposer({ note, noteId, queryClient }) {
  const [selectedNoteType, setSelectedNoteType] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  return (
    <div className="h-full bg-[#050f1e] p-4 flex gap-3 overflow-hidden" style={{ display: "flex", height: "100%" }}>
      {/* Left Column: Note Type + Templates */}
      <div className="w-72 flex flex-col gap-3 overflow-hidden" style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
        <NoteTypePanel selectedType={selectedNoteType} onSelect={setSelectedNoteType} />
        <TemplatePanel selectedNoteType={selectedNoteType} onSelect={setSelectedTemplate} />
      </div>

      {/* Right Column: Clinical Note Preview */}
      <div className="flex-1 overflow-hidden">
        <ClinicalNotePreview
          note={note}
          selectedNoteType={selectedNoteType}
          selectedTemplate={selectedTemplate}
        />
      </div>
    </div>
  );
}