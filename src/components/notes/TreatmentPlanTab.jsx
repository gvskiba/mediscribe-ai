import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Plus, X, Check, ArrowLeft, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";
import InlineSectionAI from "../ai/InlineSectionAI";
import ClinicalWorkflowAutomation from "./ClinicalWorkflowAutomation";
import TabDataPreview from "./TabDataPreview";
import ClinicalNotePreviewButton from "./ClinicalNotePreviewButton";

export default function TreatmentPlanTab({ note, noteId, queryClient, isFirstTab, isLastTab, handleBack, handleNext }) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 space-y-3">
      <div><h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Treatment Plan</h2><p className="text-xs text-slate-400 mt-0.5">Review and edit the treatment approach</p></div>
      <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-amber-500 shadow-sm overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-amber-500" /><span className="text-sm font-semibold text-slate-800">Treatment Plan</span></div>
          <Button onClick={() => setEditOpen(true)} size="sm" variant="outline" className="text-xs h-6 px-2 gap-1 border-slate-200"><Settings className="w-3 h-3" />Edit</Button>
        </div>
        <div className="p-4">
          {note.plan ? (
            <div className="prose prose-xs prose-slate max-w-none text-slate-700 text-xs">
              <ReactMarkdown components={{ p: ({children})=><p className="mb-1.5 leading-relaxed">{children}</p>, ul: ({children})=><ul className="list-disc list-inside mb-1.5">{children}</ul>, li: ({children})=><li className="block">{children}</li> }}>{note.plan}</ReactMarkdown>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-xs text-slate-400">No treatment plan yet.</p>
              <Button onClick={() => setEditOpen(true)} size="sm" className="mt-2 bg-amber-600 hover:bg-amber-700 text-white gap-1 text-xs h-6"><Plus className="w-3 h-3" />Add Plan</Button>
            </div>
          )}
        </div>
      </div>
      <div className="flex justify-between items-center pt-1 border-t border-slate-100">
        <div className="flex gap-2"><TabDataPreview tabId="treatment_plan" note={note} /><ClinicalNotePreviewButton note={note} /></div>
        <div className="flex items-center gap-1.5">
          {!isFirstTab() && <button onClick={handleBack} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"><ArrowLeft className="w-3.5 h-3.5" />Back</button>}
          {!isLastTab() && <button onClick={handleNext} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">Next<ArrowLeft className="w-3.5 h-3.5 rotate-180" /></button>}
        </div>
      </div>

      {editOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 flex-shrink-0">
              <span className="text-sm font-bold text-slate-800">Edit Treatment Plan</span>
              <div className="flex items-center gap-2">
                <InlineSectionAI type="plan" note={note} onApply={async (val) => { queryClient.setQueryData(["note", noteId], (old) => ({ ...old, plan: val })); await base44.entities.ClinicalNote.update(noteId, { plan: val }); queryClient.invalidateQueries({ queryKey: ["note", noteId] }); }} />
                <button onClick={() => setEditOpen(false)} className="p-1 rounded hover:bg-slate-100 text-slate-500"><X className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <Textarea value={note.plan || ""} onChange={(e) => { queryClient.setQueryData(["note", noteId], (old) => ({ ...old, plan: e.target.value })); }} placeholder="Document treatment plan..." className="min-h-[300px] text-sm resize-none" autoFocus />
              <ClinicalWorkflowAutomation note={note} noteId={noteId} onUpdateNote={async (updates) => { await base44.entities.ClinicalNote.update(noteId, updates); queryClient.invalidateQueries({ queryKey: ["note", noteId] }); }} />
            </div>
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-slate-200 flex-shrink-0 bg-slate-50">
              <Button variant="ghost" onClick={() => { queryClient.setQueryData(["note", noteId], (old) => ({ ...old, plan: "" })); }} className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 gap-1 h-7"><X className="w-3 h-3" />Clear</Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditOpen(false)} className="text-xs h-7">Cancel</Button>
                <Button onClick={async () => { await base44.entities.ClinicalNote.update(noteId, { plan: note.plan }); queryClient.invalidateQueries({ queryKey: ["note", noteId] }); setEditOpen(false); toast.success("Saved"); }} className="bg-amber-600 hover:bg-amber-700 text-white gap-1 text-xs h-7"><Check className="w-3 h-3" />Save</Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}