import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import TabDataPreview from "./TabDataPreview";
import ClinicalNotePreviewButton from "./ClinicalNotePreviewButton";
import FollowUpSuggestions from "./FollowUpSuggestions";
import EducationMaterialGenerator from "../../components/education/EducationMaterialGenerator";
import EducationMaterialViewer from "../../components/education/EducationMaterialViewer";
import EducationLibrary from "../../components/education/EducationLibrary";

export default function PatientEducationTab({ note, onAddToNote, isFirstTab, isLastTab, handleBack, handleNext }) {
  const [view, setView] = useState("generate"); // generate | library
  const [lastGenerated, setLastGenerated] = useState(null);

  const diagnosesList = (note.diagnoses || []).join(", ");
  const planText = note.plan || "";

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 space-y-3">
      <div><h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Patient Education</h2><p className="text-xs text-slate-400 mt-0.5">AI-generated guides in 5 languages — printable & saveable</p></div>

      {/* Sub-nav */}
      <div className="flex gap-2">
        {["generate", "library"].map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${view === v ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            {v === "generate" ? "✨ Generate" : "📚 Library"}
          </button>
        ))}
      </div>

      {view === "generate" && (
        <>
          <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-teal-500 shadow-sm overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-teal-500" /><span className="text-sm font-semibold text-slate-800">Generate Education Material</span></div>
            <div className="p-4">
              <EducationMaterialGenerator
                initialDiagnosis={diagnosesList}
                initialPlan={planText}
                patientName={note.patient_name || ""}
                noteId={note.id || ""}
                onGenerated={(m) => { setLastGenerated(m); }}
              />
            </div>
          </div>

          {lastGenerated && (
            <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-blue-500 shadow-sm overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-blue-500" /><span className="text-sm font-semibold text-slate-800">Generated Material</span></div>
              <div className="p-4"><EducationMaterialViewer material={lastGenerated} onUpdate={setLastGenerated} /></div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-indigo-500 shadow-sm overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-indigo-500" /><span className="text-sm font-semibold text-slate-800">Follow-up Suggestions</span></div>
            <div className="p-4"><FollowUpSuggestions note={note} onAddToNote={onAddToNote} /></div>
          </div>
        </>
      )}

      {view === "library" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-slate-400" /><span className="text-sm font-semibold text-slate-800">Saved Materials</span></div>
          <div className="p-4"><EducationLibrary onCreateNew={() => setView("generate")} /></div>
        </div>
      )}
      <div className="flex justify-between items-center pt-1 border-t border-slate-100">
        <div className="flex gap-2"><TabDataPreview tabId="patient_education" note={note} /><ClinicalNotePreviewButton note={note} /></div>
        <div className="flex items-center gap-1.5">
          {!isFirstTab() && <button onClick={handleBack} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"><ArrowLeft className="w-3.5 h-3.5" />Back</button>}
          {!isLastTab() && <button onClick={handleNext} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">Next<ArrowLeft className="w-3.5 h-3.5 rotate-180" /></button>}
        </div>
      </div>
    </div>
  );
}