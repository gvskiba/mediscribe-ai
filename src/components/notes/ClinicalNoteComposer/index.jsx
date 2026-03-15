import React, { useState } from "react";
import NoteTypePanel from "./NoteTypePanel";
import TemplatePanel from "./TemplatePanel";
import ClinicalNotePreview from "./ClinicalNotePreview";
import PatientSearchPanel from "./PatientSearchPanel";
import PatientSummaryPanel from "./PatientSummaryPanel";
import AutoPopulateButton from "./AutoPopulateButton";
import CollapsiblePatientList from "./CollapsiblePatientList";

export default function ClinicalNoteComposer({ note, noteId, queryClient }) {
  const [selectedNoteType, setSelectedNoteType] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);

  return (
    <div className="h-full bg-[#050f1e] p-4 flex gap-3" style={{ display: "flex", height: "100%", minHeight: 0 }}>
      {/* Left Column: Note Type + Templates + Patient */}
      <div className="w-72 flex flex-col gap-3 overflow-hidden" style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: "0 0 auto" }}>
        <div style={{ flex: "0 0 auto", maxHeight: "fit-content" }}>
          <NoteTypePanel selectedType={selectedNoteType} onSelect={setSelectedNoteType} />
        </div>
        <div style={{ flex: "1", overflowY: "auto", minHeight: 0 }}>
          <TemplatePanel selectedNoteType={selectedNoteType} onSelect={setSelectedTemplate} />
        </div>
      </div>

      {/* Middle Column: Patient Search & Summary */}
      <div className="w-64 flex flex-col gap-3 overflow-hidden" style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: "0 0 auto" }}>
        <div style={{ flex: "0 0 auto" }}>
          <PatientSearchPanel selectedPatient={selectedPatient} onSelectPatient={setSelectedPatient} />
        </div>
        <div style={{ flex: "1", overflowY: "auto", minHeight: 0 }}>
          <PatientSummaryPanel patient={selectedPatient} />
        </div>
        <div style={{ flex: "0 0 auto" }}>
          <AutoPopulateButton 
            patient={selectedPatient} 
            note={note} 
            noteId={noteId}
            onDataPopulated={() => queryClient.invalidateQueries({ queryKey: ["note", noteId] })}
          />
        </div>
      </div>

      {/* Right Column: Clinical Note Preview */}
      <div className="flex-1 overflow-hidden flex flex-col gap-3">
        <CollapsiblePatientList
          onSelectPatient={setSelectedPatient}
          selectedPatient={selectedPatient}
        />
        <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
          <ClinicalNotePreview
            note={note}
            noteId={noteId}
            queryClient={queryClient}
            selectedNoteType={selectedNoteType}
            selectedTemplate={selectedTemplate}
          />
        </div>
      </div>
    </div>
  );
}