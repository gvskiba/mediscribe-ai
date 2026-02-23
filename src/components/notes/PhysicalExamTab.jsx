import React from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { toast } from "sonner";
import InlineSectionAI from "../ai/InlineSectionAI";
import PhysicalExamEditor from "./PhysicalExamEditor";
import TabPageLayout from "./TabPageLayout";

export default function PhysicalExamTab({
  note, noteId, queryClient,
  physicalExamNormal, setPhysicalExamNormal,
  isFirstTab, isLastTab, handleBack, handleNext,
}) {
  return (
    <TabPageLayout
      title="Physical Examination"
      subtitle="Structured examination findings"
      tabId="physical_exam"
      note={note}
      isFirstTab={isFirstTab} isLastTab={isLastTab} handleBack={handleBack} handleNext={handleNext}
    >
      <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-emerald-500 shadow-sm overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-sm font-semibold text-slate-800">Physical Exam Editor</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="ghost"
              onClick={async () => {
                await base44.entities.ClinicalNote.update(noteId, { physical_exam: "No abnormalities noted. All systems within normal limits on examination." });
                queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                setPhysicalExamNormal(true);
                toast.success("Set to normal");
              }}
              className={`gap-1 text-xs h-6 px-2 ${physicalExamNormal ? "text-emerald-600 bg-emerald-50 hover:bg-emerald-100" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}
            >
              <Check className="w-3 h-3" />Normal
            </Button>
            <InlineSectionAI type="physical_exam" note={note} onApply={async (val) => { await base44.entities.ClinicalNote.update(noteId, { physical_exam: val }); queryClient.invalidateQueries({ queryKey: ["note", noteId] }); }} />
          </div>
        </div>
        <div className="p-4">
          <PhysicalExamEditor
            examData={note.physical_exam}
            onUpdate={async (d) => { await base44.entities.ClinicalNote.update(noteId, { physical_exam: typeof d === 'string' ? d : JSON.stringify(d) }); queryClient.invalidateQueries({ queryKey: ["note", noteId] }); toast.success("Updated"); }}
            onAddToNote={async (t) => { await base44.entities.ClinicalNote.update(noteId, { physical_exam: (note.physical_exam || "") + t }); queryClient.invalidateQueries({ queryKey: ["note", noteId] }); toast.success("Added"); }}
          />
        </div>
      </div>
    </TabPageLayout>
  );
}