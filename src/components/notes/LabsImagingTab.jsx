import React from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import ImagingAnalysis from "./ImagingAnalysis";
import LabsAnalysis from "./LabsAnalysis";
import EKGAnalysis from "./EKGAnalysis";
import TabPageLayout from "./TabPageLayout";

export default function LabsImagingTab({
  note, noteId, queryClient,
  isFirstTab, isLastTab, handleBack, handleNext,
}) {
  const update = async (updates) => {
    await base44.entities.ClinicalNote.update(noteId, updates);
    queryClient.invalidateQueries({ queryKey: ["note", noteId] });
  };

  return (
    <TabPageLayout
      title="Labs & Imaging"
      subtitle="Upload and analyze results"
      tabId="labs_imaging"
      note={note}
      isFirstTab={isFirstTab} isLastTab={isLastTab} handleBack={handleBack} handleNext={handleNext}
    >
      <div className="space-y-3">
        {[
          { label: "Imaging", sublabel: "· radiology & imaging studies", color: "teal", component: (
            <ImagingAnalysis noteId={noteId} onAddToNote={async (t, linked) => {
              const upd = { assessment: (note.assessment || "") + t };
              if (linked) Object.entries(linked).forEach(([, secs]) => secs.forEach(s => { if (['assessment','plan','history_of_present_illness'].includes(s)) upd[s] = (upd[s] || note[s] || "") + `\n\n[Imaging] ${t.split("\n")[0]}`; }));
              await update(upd); toast.success("Added to note");
            }} />
          )},
          { label: "Labs", sublabel: "· laboratory results", color: "blue", component: (
            <LabsAnalysis noteId={noteId} onAddToNote={async (t) => { await update({ assessment: (note.assessment || "") + t }); toast.success("Added to note"); }} />
          )},
          { label: "EKG", sublabel: "· electrocardiogram analysis", color: "purple", component: (
            <EKGAnalysis noteId={noteId} onAddToNote={async (t) => { await update({ assessment: (note.assessment || "") + t }); toast.success("Added to note"); }} />
          )},
        ].map(({ label, sublabel, color, component }) => {
          const dot = { teal: "bg-teal-500", blue: "bg-blue-500", purple: "bg-purple-500" }[color];
          const accent = { teal: "border-l-teal-500", blue: "border-l-blue-500", purple: "border-l-purple-500" }[color];
          return (
            <div key={label} className={`bg-white rounded-xl border border-slate-200 border-l-4 ${accent} shadow-sm overflow-hidden`}>
              <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2.5">
                <div className={`w-2 h-2 rounded-full ${dot}`} />
                <span className="text-sm font-semibold text-slate-800">{label}</span>
                <span className="text-xs text-slate-400">{sublabel}</span>
              </div>
              <div className="p-4">{component}</div>
            </div>
          );
        })}
      </div>
    </TabPageLayout>
  );
}