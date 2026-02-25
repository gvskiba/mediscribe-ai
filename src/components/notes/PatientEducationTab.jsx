import React from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Download, ArrowLeft } from "lucide-react";
import TabDataPreview from "./TabDataPreview";
import ClinicalNotePreviewButton from "./ClinicalNotePreviewButton";
import PatientEducationGenerator from "./PatientEducationGenerator";

export default function PatientEducationTab({ note, patientEducation, generatingEducation, generatePatientEducation, downloadPatientEducation, isFirstTab, isLastTab, handleBack, handleNext }) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-4 space-y-3">
      <div><h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Patient Education</h2><p className="text-xs text-slate-400 mt-0.5">Generate patient-friendly education materials for discharge</p></div>
      
      <div className="grid sm:grid-cols-2 gap-3">
        {/* AI Generated Materials */}
        <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-teal-500 shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-teal-500" /><span className="text-sm font-semibold text-slate-800">AI-Generated Materials</span></div>
          <div className="p-4"><PatientEducationGenerator note={note} onGenerationComplete={(materials) => { /* materials generated and ready for download */ }} /></div>
        </div>

        {/* Existing Materials */}
        <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-blue-500 shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-blue-500" /><span className="text-sm font-semibold text-slate-800">Alternative Generation</span></div>
          </div>
          <div className="p-4">
            <p className="text-xs text-slate-600 mb-3">Use this option to generate materials with different settings or format.</p>
            <Button onClick={generatePatientEducation} disabled={generatingEducation || !note.diagnoses?.length} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 text-xs h-7 px-3">
              {generatingEducation ? <><Loader2 className="w-3 h-3 animate-spin" />Generating...</> : <><Sparkles className="w-3 h-3" />Generate Legacy</>}
            </Button>
            {!note.diagnoses?.length && <p className="text-xs text-slate-400 mt-2">Add diagnoses first to generate education materials.</p>}
          </div>
        </div>
      </div>
      {patientEducation?.length > 0 && patientEducation.map((m, i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-cyan-500 shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-cyan-500" /><span className="text-sm font-semibold text-slate-800">{m.diagnosis}</span></div>
            <Button onClick={() => downloadPatientEducation('txt')} size="sm" variant="outline" className="text-xs h-6 px-2"><Download className="w-3 h-3" /></Button>
          </div>
          <div className="p-4 space-y-3 text-xs text-slate-700">
            {m.what_is_it && <div><p className="font-semibold text-slate-800 mb-1">What Is It?</p><p className="leading-relaxed">{m.what_is_it}</p></div>}
            {m.symptoms_to_watch?.length > 0 && <div><p className="font-semibold text-slate-800 mb-1">Symptoms to Watch</p><ul className="space-y-0.5">{m.symptoms_to_watch.map((s, j) => <li key={j} className="flex gap-1.5"><span className="text-slate-400 flex-shrink-0">•</span>{s}</li>)}</ul></div>}
            {m.when_to_seek_help?.length > 0 && <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2"><p className="font-semibold text-red-800 mb-1">⚠ When to Seek Help</p><ul className="space-y-0.5">{m.when_to_seek_help.map((h, j) => <li key={j} className="text-red-700">{h}</li>)}</ul></div>}
          </div>
        </div>
      ))}
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