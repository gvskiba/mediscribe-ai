import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, X, ArrowLeft } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import ClinicalDecisionSupport from "./ClinicalDecisionSupport";
import DiagnosisRecommendations from "./DiagnosisRecommendations";
import MedicalCodingAssistant from "./MedicalCodingAssistant";
import ICD10CodeSearch from "./ICD10CodeSearch";
import TabDataPreview from "./TabDataPreview";
import ClinicalNotePreviewButton from "./ClinicalNotePreviewButton";

export default function DiagnosesTab({
  note, noteId, queryClient,
  icd10Suggestions, loadingInteractions, drugInteractions, analyzeDrugInteractions,
  isFirstTab, isLastTab, handleBack, handleNext
}) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-4 space-y-3">
      <div><h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Diagnoses & ICD-10</h2><p className="text-xs text-slate-400 mt-0.5">AI-powered diagnostic support and coding</p></div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-purple-500 shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-purple-500" /><span className="text-sm font-semibold text-slate-800">AI Suggestions</span></div>
          <div className="p-4"><ClinicalDecisionSupport type="diagnostic" note={note} onAddToNote={async (d) => { const u = [...(note.diagnoses || []), d]; await base44.entities.ClinicalNote.update(noteId, { diagnoses: u }); queryClient.invalidateQueries({ queryKey: ["note", noteId] }); }} /></div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-indigo-500 shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-indigo-500" /><span className="text-sm font-semibold text-slate-800">Evidence-Based</span></div>
          <div className="p-4"><DiagnosisRecommendations note={note} onAddDiagnoses={async (d) => { const u = [...(note.diagnoses || []), ...d]; await base44.entities.ClinicalNote.update(noteId, { diagnoses: u }); queryClient.invalidateQueries({ queryKey: ["note", noteId] }); }} /></div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-blue-500 shadow-sm overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-blue-500" /><span className="text-sm font-semibold text-slate-800">Current Diagnoses</span><span className="text-xs text-slate-400">({note.diagnoses?.length || 0})</span></div>
        </div>
        <div className="p-4">
          {note.diagnoses?.length > 0 ? (
            <div className="space-y-1.5">
              {note.diagnoses.map((diag, i) => {
                const m = diag.match(/^([A-Z0-9.]+)\s*-\s*(.+)$/);
                return (
                  <div key={i} className="group flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all">
                    {m ? <><Badge className="bg-blue-100 text-blue-700 text-xs font-mono px-1.5">{m[1]}</Badge><span className="text-xs text-slate-800 flex-1">{m[2]}</span></> : <span className="text-xs text-slate-800 flex-1">{diag}</span>}
                    <button onClick={async () => { const u = note.diagnoses.filter((_,j) => j !== i); await base44.entities.ClinicalNote.update(noteId, { diagnoses: u }); queryClient.invalidateQueries({ queryKey: ["note", noteId] }); toast.success("Removed"); }} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-0.5"><X className="w-3 h-3" /></button>
                  </div>
                );
              })}
            </div>
          ) : <p className="text-xs text-slate-400 text-center py-4">No diagnoses yet. Use AI suggestions above or search below.</p>}
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-cyan-500 shadow-sm overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-cyan-500" /><span className="text-sm font-semibold text-slate-800">AI Coding Assistant</span></div>
        <div className="p-4"><MedicalCodingAssistant note={note} onAddDiagnoses={async (d) => { const u = [...(note.diagnoses || []), ...d]; await base44.entities.ClinicalNote.update(noteId, { diagnoses: u }); queryClient.invalidateQueries({ queryKey: ["note", noteId] }); }} /></div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-slate-400 shadow-sm overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-slate-400" /><span className="text-sm font-semibold text-slate-800">ICD-10 Code Search</span></div>
        <div className="p-4"><ICD10CodeSearch suggestions={icd10Suggestions} diagnoses={note.diagnoses} onAddDiagnoses={async (d) => { const u = [...(note.diagnoses || []), ...d]; await base44.entities.ClinicalNote.update(noteId, { diagnoses: u }); queryClient.invalidateQueries({ queryKey: ["note", noteId] }); }} /></div>
      </div>
      <div className="flex justify-between items-center pt-1 border-t border-slate-100">
        <div className="flex gap-2"><TabDataPreview tabId="research" note={note} /><ClinicalNotePreviewButton note={note} /></div>
        <div className="flex items-center gap-1.5">{!isFirstTab() && <button onClick={handleBack} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"><ArrowLeft className="w-3.5 h-3.5" />Back</button>}{!isLastTab() && <button onClick={handleNext} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">Next<ArrowLeft className="w-3.5 h-3.5 rotate-180" /></button>}</div>
      </div>
    </div>
  );
}