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
  return (
    <div className="flex flex-col gap-3" style={{ margin: "-22px -26px" }}>
      <PhysicalExamEditor
        examData={note.physical_exam}
        note={note}
        onUpdate={async (d) => { await base44.entities.ClinicalNote.update(noteId, { physical_exam: typeof d === "string" ? d : JSON.stringify(d) }); queryClient.invalidateQueries({ queryKey: ["note", noteId] }); }}
        onAddToNote={async (t) => { await base44.entities.ClinicalNote.update(noteId, { physical_exam: t }); queryClient.invalidateQueries({ queryKey: ["note", noteId] }); toast.success("Saved to note"); }}
      />
      {/* Footer Nav */}
      <div className="flex justify-between items-center pt-1 border-t border-slate-100 px-1">
        <div className="flex gap-2">
          <TabDataPreview tabId="physical_exam" note={note} />
          <ClinicalNotePreviewButton note={note} />
        </div>
        <div className="flex items-center gap-1.5">
          {!isFirstTab?.() && (
            <button onClick={handleBack} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />Back
            </button>
          )}
          {!isLastTab?.() && (
            <button onClick={handleNext} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
              Next<ArrowLeft className="w-3.5 h-3.5 rotate-180" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}