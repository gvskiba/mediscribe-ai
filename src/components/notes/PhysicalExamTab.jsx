import React from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import PhysicalExamEditor from "./PhysicalExamEditor";
import TabPageLayout from "./TabPageLayout";

export default function PhysicalExamTab({
  note, noteId, queryClient,
  physicalExamNormal, setPhysicalExamNormal,
  isFirstTab, isLastTab, handleBack, handleNext,
}) {
  return (
    <div className="flex flex-col">
      <PhysicalExamEditor
        examData={note.physical_exam}
        note={note}
        onUpdate={async (d) => { await base44.entities.ClinicalNote.update(noteId, { physical_exam: typeof d === "string" ? d : JSON.stringify(d) }); queryClient.invalidateQueries({ queryKey: ["note", noteId] }); }}
        onAddToNote={async (t) => { await base44.entities.ClinicalNote.update(noteId, { physical_exam: t }); queryClient.invalidateQueries({ queryKey: ["note", noteId] }); toast.success("Saved to note"); }}
      />
      {/* Footer Nav */}
      <TabPageLayout
        tabId="physical_exam"
        note={note}
        isFirstTab={isFirstTab} isLastTab={isLastTab} handleBack={handleBack} handleNext={handleNext}
      >
        <div />
      </TabPageLayout>
    </div>
  );
}