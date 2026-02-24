import React from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, X, Check, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import InlineSectionAI from "../ai/InlineSectionAI";
import VitalSignsPasteAnalyzer from "./VitalSignsPasteAnalyzer";
import VitalSignsInput from "./VitalSignsInput";
import ReviewOfSystemsEditor from "./ReviewOfSystemsEditor";
import TabDataPreview from "./TabDataPreview";
import ClinicalNotePreviewButton from "./ClinicalNotePreviewButton";

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
      <SectionCard
        label="Vital Signs"
        sublabel="· enter manually or paste for AI extraction"
        accentColor="emerald"
      >
        <div className="p-4 space-y-4">
          <VitalSignsPasteAnalyzer
            vitalSigns={note.vital_signs}
            patientAge={note.patient_age}
            onApplyVitals={async (vitals) => {
              const vitalSigns = { temperature: vitals.temperature, heart_rate: vitals.heart_rate, blood_pressure: vitals.blood_pressure, respiratory_rate: vitals.respiratory_rate, oxygen_saturation: vitals.oxygen_saturation, height: vitals.height, weight: vitals.weight };
              await base44.entities.ClinicalNote.update(noteId, { vital_signs: vitalSigns });
              queryClient.invalidateQueries({ queryKey: ["note", noteId] });
            }}
          />
          <div className="border-t border-slate-100" />
          <VitalSignsInput
            vitalSigns={note.vital_signs || {}}
            onChange={async (newVitalSigns) => {
              const sanitized = Object.fromEntries(
                Object.entries(newVitalSigns).filter(([_, v]) => {
                  if (!v || typeof v !== 'object') return false;
                  if ('systolic' in v) return v.systolic !== undefined && v.systolic !== '';
                  return v.value !== undefined && v.value !== '';
                })
              );
              await base44.entities.ClinicalNote.update(noteId, { vital_signs: sanitized });
              queryClient.invalidateQueries({ queryKey: ["note", noteId] });
            }}
            onSave={async (newVitalSigns) => {
              const filteredVitals = Object.fromEntries(Object.entries(newVitalSigns).filter(([_, v]) => v && (v.value !== undefined && v.value !== "" || v.systolic !== undefined)));
              if (Object.keys(filteredVitals).length === 0) { toast.error("Please enter at least one vital sign"); return; }
              setVitalSignsHistory(prev => [{ vitals: filteredVitals, timestamp: new Date().toISOString() }, ...prev]);
              await base44.entities.ClinicalNote.update(noteId, { vital_signs: filteredVitals });
              queryClient.invalidateQueries({ queryKey: ["note", noteId] });
              toast.success("Vital signs saved");
            }}
          />
          <div className="border-t border-slate-100 pt-3 flex items-center gap-2">
            <Button
              onClick={async () => {
                const vitals = note.vital_signs;
                if (!vitals || Object.keys(vitals).length === 0) { toast.error("No vital signs recorded yet."); return; }
                setLoadingVitalAnalysis(true);
                try {
                  const vitalsSummary = Object.entries(vitals).filter(([_, v]) => v && typeof v === 'object' && (v.value !== undefined && v.value !== "" || v.systolic !== undefined)).map(([key, v]) => { const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); if (key === 'blood_pressure') return `- ${displayKey}: ${v.systolic}/${v.diastolic} ${v.unit || 'mmHg'}`; return `- ${displayKey}: ${v.value} ${v.unit || ''}`.trim(); }).join('\n');
                  if (!vitalsSummary) { toast.error("No vital sign values to analyze"); setLoadingVitalAnalysis(false); return; }
                  const result = await base44.integrations.Core.InvokeLLM({ prompt: `Analyze these vital signs for abnormalities:\n\n${vitalsSummary}`, response_json_schema: { type: "object", properties: { analysis: { type: "array", items: { type: "object", properties: { vital_sign: { type: "string" }, status: { type: "string", enum: ["normal", "abnormal"] }, value: { type: "string" }, reference_range: { type: "string" }, clinical_significance: { type: "string" } } } }, summary: { type: "string" } } } });
                  setVitalSignsAnalysis(result);
                } catch { toast.error("Failed to analyze vital signs"); } finally { setLoadingVitalAnalysis(false); }
              }}
              disabled={loadingVitalAnalysis}
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs h-7 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            >
              {loadingVitalAnalysis ? <><Loader2 className="w-3 h-3 animate-spin" />Analyzing...</> : <><Sparkles className="w-3 h-3" />Analyze Vitals</>}
            </Button>
          </div>
          {vitalSignsAnalysis && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5">
              {vitalSignsAnalysis.analysis?.map((item, idx) => (
                <div key={idx} className={`rounded-lg border px-3 py-2 flex items-center justify-between ${item.status === "abnormal" ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"}`}>
                  <div>
                    <span className="font-medium text-xs text-slate-800 capitalize">{item.vital_sign}</span>
                    <span className="text-xs text-slate-500 ml-2">{item.value} · {item.reference_range}</span>
                    {item.clinical_significance && <p className="text-xs text-slate-500 mt-0.5">{item.clinical_significance}</p>}
                  </div>
                  <Badge className={`text-xs ml-2 flex-shrink-0 ${item.status === "abnormal" ? "bg-red-100 text-red-700 border border-red-200" : "bg-emerald-100 text-emerald-700 border border-emerald-200"}`}>{item.status}</Badge>
                </div>
              ))}
              {vitalSignsAnalysis.summary && <p className="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">{vitalSignsAnalysis.summary}</p>}
            </motion.div>
          )}
        </div>
      </SectionCard>

      {/* 2 - Raw Note Input */}
      <SectionCard
        label="Raw Note Input"
        accentColor="slate"
        actions={
          <>
            <Button size="sm" variant="ghost" disabled={checkingGrammar || !note.raw_note}
              onClick={async () => {
                if (!note.raw_note) return;
                setCheckingGrammar(true); setGrammarSuggestions(null);
                try {
                  const result = await base44.integrations.Core.InvokeLLM({
                    prompt: `Check the following clinical note text for grammar and spelling errors. Return a list of corrections with the original text, the corrected text, and the type of issue (grammar or spelling). Also provide the full corrected version of the text.\n\nTEXT:\n${note.raw_note}`,
                    response_json_schema: { type: "object", properties: { issues: { type: "array", items: { type: "object", properties: { original: { type: "string" }, corrected: { type: "string" }, type: { type: "string", enum: ["grammar", "spelling"] }, explanation: { type: "string" } } } }, corrected_text: { type: "string" } } }
                  });
                  setGrammarSuggestions(result);
                } catch { toast.error("Failed to check grammar"); } finally { setCheckingGrammar(false); }
              }}
              className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 gap-1 text-xs h-6 px-2"
            >
              {checkingGrammar ? <><Loader2 className="w-3 h-3 animate-spin" />Checking</> : <><Sparkles className="w-3 h-3" />Grammar</>}
            </Button>
            {note.raw_note && (
              <Button size="sm" variant="ghost" onClick={async () => { queryClient.setQueryData(["note", noteId], (old) => ({ ...old, raw_note: "" })); await base44.entities.ClinicalNote.update(noteId, { raw_note: "" }); setGrammarSuggestions(null); toast.success("Cleared"); }} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 h-6 w-6 p-0">
                <X className="w-3 h-3" />
              </Button>
            )}
          </>
        }
      >
        <div className="p-4 space-y-3">
          <Textarea
            value={note.raw_note || ""}
            onChange={(e) => queryClient.setQueryData(["note", noteId], (old) => ({ ...old, raw_note: e.target.value }))}
            onBlur={async (e) => { await base44.entities.ClinicalNote.update(noteId, { raw_note: e.target.value }); }}
            placeholder="Paste raw clinical data, voice transcripts, or unstructured notes here..."
            className="min-h-[140px] text-sm resize-none border-slate-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
          />
          {grammarSuggestions && (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-50 px-3 py-2 flex items-center justify-between border-b border-slate-100">
                <p className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-blue-500" />
                  {grammarSuggestions.issues?.length > 0 ? `${grammarSuggestions.issues.length} issue(s)` : "No issues ✓"}
                </p>
                <div className="flex gap-2 items-center">
                  {grammarSuggestions.corrected_text && grammarSuggestions.issues?.length > 0 && (
                    <Button size="sm" onClick={async () => { queryClient.setQueryData(["note", noteId], (old) => ({ ...old, raw_note: grammarSuggestions.corrected_text })); await base44.entities.ClinicalNote.update(noteId, { raw_note: grammarSuggestions.corrected_text }); setGrammarSuggestions(null); toast.success("Applied"); }} className="h-5 text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 rounded">Apply All</Button>
                  )}
                  <button onClick={() => setGrammarSuggestions(null)} className="text-slate-400 hover:text-slate-600"><X className="w-3 h-3" /></button>
                </div>
              </div>
              {grammarSuggestions.issues?.length > 0 && (
                <div className="p-3 space-y-1.5 max-h-36 overflow-y-auto">
                  {grammarSuggestions.issues.map((issue, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-xs font-medium ${issue.type === 'spelling' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>{issue.type}</span>
                      <span className="text-slate-400 line-through">{issue.original}</span>
                      <span className="text-slate-300">→</span>
                      <span className="text-slate-700 font-medium">{issue.corrected}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </SectionCard>

      {/* 3 - Review of Systems */}
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
            onUpdate={async (rosData) => { const rosString = typeof rosData === 'string' ? rosData : JSON.stringify(rosData); await base44.entities.ClinicalNote.update(noteId, { review_of_systems: rosString }); queryClient.invalidateQueries({ queryKey: ["note", noteId] }); toast.success("ROS updated"); }}
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