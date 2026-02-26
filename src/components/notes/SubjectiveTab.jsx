import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, X, Check, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

import { motion } from "framer-motion";
import InlineSectionAI from "../ai/InlineSectionAI";
import VitalSignsCard from "./VitalSignsCard";
import ReviewOfSystemsEditor from "./ReviewOfSystemsEditor";
import TabDataPreview from "./TabDataPreview";
import ClinicalNotePreviewButton from "./ClinicalNotePreviewButton";
import AITextCompletion from "../ai/AITextCompletion";

function SectionCard({ label, sublabel, badge, actions, children, accentColor = "blue", defaultOpen = true }) {
  const [open, setOpen] = React.useState(defaultOpen);
  const accent = {
    blue: "border-l-blue-500",
    emerald: "border-l-emerald-500",
    slate: "border-l-slate-400",
    purple: "border-l-purple-500",
  }[accentColor];
  const dot = {
    blue: "bg-blue-500",
    emerald: "bg-emerald-500",
    slate: "bg-slate-400",
    purple: "bg-purple-500",
  }[accentColor];

  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm border-l-4 ${accent} overflow-hidden`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
          <span className="text-sm font-semibold text-slate-800">{label}</span>
          {sublabel && <span className="text-xs text-slate-400 hidden sm:inline">{sublabel}</span>}
          {badge && <span className="ml-1">{badge}</span>}
        </div>
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          {actions}
          <div className="text-slate-400 pointer-events-none ml-1">
            {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </div>
      </button>
      {open && <div className="border-t border-slate-100">{children}</div>}
    </div>
  );
}

export default function SubjectiveTab({
  note,
  noteId,
  queryClient,
  templates,
  selectedTemplate,
  setSelectedTemplate,
  analyzingRawData,
  setAnalyzingRawData,
  checkingGrammar,
  setCheckingGrammar,
  grammarSuggestions,
  setGrammarSuggestions,
  loadingVitalAnalysis,
  setLoadingVitalAnalysis,
  vitalSignsAnalysis,
  setVitalSignsAnalysis,
  vitalSignsHistory,
  setVitalSignsHistory,
  rosNormal,
  setRosNormal,
  structuredPreview,
  setStructuredPreview,
  showStructuredPreview,
  setShowStructuredPreview,
  isFirstTab,
  isLastTab,
  handleBack,
  handleNext,
}) {
  const [localRawNote, setLocalRawNote] = useState(note?.raw_note || "");
  const [localHPI, setLocalHPI] = useState(note?.history_of_present_illness || "");

  useEffect(() => {
    setLocalRawNote(note?.raw_note || "");
    setLocalHPI(note?.history_of_present_illness || "");
  }, [note?.id]); // only sync when note changes, not on every keystroke

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 space-y-3">

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Subjective</h2>
          <p className="text-xs text-slate-400 mt-0.5">Vital signs, raw input, and review of systems</p>
        </div>
        <div className="flex gap-1.5">
          <Button
            onClick={async () => {
              if (!note.raw_note && !note.chief_complaint) { toast.error("Please enter some patient data first"); return; }
              setAnalyzingRawData(true);
              try {
                const response = await base44.functions.invoke('analyzeAndStructureNote', { noteId });
                setStructuredPreview(response.data.structured);
                setShowStructuredPreview(true);
                queryClient.invalidateQueries({ queryKey: ["note", noteId] });
              } catch { toast.error("Failed to analyze note"); } finally { setAnalyzingRawData(false); }
            }}
            disabled={analyzingRawData}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 text-xs h-7 px-3"
          >
            {analyzingRawData ? <><Loader2 className="w-3 h-3 animate-spin" />Analyzing...</> : <><Sparkles className="w-3 h-3" />AI Structure</>}
          </Button>

        </div>
      </div>

      {/* 1 - Vital Signs */}
      <VitalSignsCard
        note={note}
        noteId={noteId}
        queryClient={queryClient}
        vitalSignsHistory={vitalSignsHistory}
        setVitalSignsHistory={setVitalSignsHistory}
      />

      {/* 3 - History of Present Illness */}
      <SectionCard
        label="History of Present Illness"
        sublabel="· HPI narrative"
        accentColor="blue"
        actions={
          <InlineSectionAI type="history_of_present_illness" note={note} onApply={async (val) => { 
            setLocalHPI(val); 
            queryClient.setQueryData(["note", noteId], (old) => ({ ...old, history_of_present_illness: val }));
            await base44.entities.ClinicalNote.update(noteId, { history_of_present_illness: val }); 
          }} />
        }
      >
        <div className="p-4">
          <AITextCompletion
            field="history_of_present_illness"
            value={localHPI}
            onChange={setLocalHPI}
            note={note}
            placeholder="Document the history of present illness..."
            className="w-full min-h-[120px] text-sm resize-none rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-100 focus:border-blue-400 bg-white"
            onBlur={async () => {
              queryClient.setQueryData(["note", noteId], (old) => ({ ...old, history_of_present_illness: localHPI }));
              await base44.entities.ClinicalNote.update(noteId, { history_of_present_illness: localHPI });
            }}
          />
        </div>
      </SectionCard>

      {/* 4 - Review of Systems */}
      <SectionCard
        label="Review of Systems"
        sublabel="· systematic symptom review"
        accentColor="purple"
        actions={
          <>
            <Button size="sm" variant="ghost"
              onClick={async () => {
                await base44.entities.ClinicalNote.update(noteId, { review_of_systems: "REVIEW OF SYSTEMS:\nGeneral: Denies fever, chills, weight loss.\nHeadache: Denies headache or dizziness.\nEyes, Ears, Nose, Throat: Denies vision changes, hearing loss, rhinorrhea, or sore throat.\nCardiovascular: Denies chest pain, palpitations, orthopnea, PND.\nRespiratory: Denies dyspnea, cough, or wheezing.\nGastrointestinal: Denies nausea, vomiting, diarrhea, constipation, or abdominal pain.\nGenitourinary: Denies dysuria, frequency, or urgency.\nMusculoskeletal: Denies joint pain, swelling, or stiffness.\nNeurological: Denies numbness, tingling, weakness, or tremor.\nPsychiatric: Denies depression, anxiety, or sleep disturbance.\nSkin: No rashes or lesions noted." });
                queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                setRosNormal(true);
                toast.success("ROS set to normal");
              }}
              className={`gap-1 text-xs h-6 px-2 ${rosNormal ? "text-emerald-600 bg-emerald-50 hover:bg-emerald-100" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}
            >
              <Check className="w-3 h-3" />Normal
            </Button>
            <InlineSectionAI type="review_of_systems" note={note} onApply={async (val) => { await base44.entities.ClinicalNote.update(noteId, { review_of_systems: val }); queryClient.invalidateQueries({ queryKey: ["note", noteId] }); }} />
          </>
        }
      >
        <div className="p-4">
          <ReviewOfSystemsEditor
            rosData={note.review_of_systems}
            note={note}
            onUpdate={async (rosData) => { const val = typeof rosData === 'object' ? JSON.stringify(rosData) : rosData; await base44.entities.ClinicalNote.update(noteId, { review_of_systems: val }); queryClient.invalidateQueries({ queryKey: ["note", noteId] }); }}
            onAddToNote={async (rosText) => { await base44.entities.ClinicalNote.update(noteId, { review_of_systems: rosText }); queryClient.invalidateQueries({ queryKey: ["note", noteId] }); toast.success("ROS saved"); }}
          />
        </div>
      </SectionCard>

      {/* Footer */}
      <div className="flex justify-between items-center pt-1 border-t border-slate-100">
        <div className="flex gap-2">
          <TabDataPreview tabId="patient_intake" note={note} />
          <ClinicalNotePreviewButton note={note} templates={templates} selectedTemplate={selectedTemplate} onTemplateChange={setSelectedTemplate} onUpdate={async (field, value) => { await base44.entities.ClinicalNote.update(noteId, { [field]: value }); queryClient.invalidateQueries({ queryKey: ["note", noteId] }); }} />
        </div>
        <div className="flex items-center gap-1.5">
          {!isFirstTab() && (
            <button onClick={handleBack} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />Back
            </button>
          )}
          {!isLastTab() && (
            <button onClick={handleNext} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
              Next<ArrowLeft className="w-3.5 h-3.5 rotate-180" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}