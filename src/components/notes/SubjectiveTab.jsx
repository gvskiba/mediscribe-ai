import React from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, X, Check, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import InlineSectionAI from "../ai/InlineSectionAI";
import VitalSignsPasteAnalyzer from "./VitalSignsPasteAnalyzer";
import VitalSignsInput from "./VitalSignsInput";
import ReviewOfSystemsEditor from "./ReviewOfSystemsEditor";
import TabDataPreview from "./TabDataPreview";
import ClinicalNotePreviewButton from "./ClinicalNotePreviewButton";

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
    <div className="max-w-4xl mx-auto px-6 py-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Subjective</h2>
          <p className="text-xs text-slate-500">Chief complaint, history, vital signs, and review of systems</p>
        </div>
        <div className="flex gap-2">
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
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white gap-2"
          >
            {analyzingRawData ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing...</> : <><Sparkles className="w-3.5 h-3.5" /> AI Structure Note</>}
          </Button>
          <Button
            onClick={async () => {
              if (!note.raw_note && !note.chief_complaint) { toast.error("Please enter some patient data first"); return; }
              setAnalyzingRawData(true);
              try {
                const result = await base44.integrations.Core.InvokeLLM({
                  prompt: `Analyze this raw patient encounter data and extract structured clinical information:\n\nRAW PATIENT DATA:\n${note.raw_note || note.chief_complaint}\n\nExtract: chief_complaint, history_of_present_illness (OLDCARTS), review_of_systems, initial_assessment, suggested_diagnoses, recommended_tests.`,
                  add_context_from_internet: false,
                  response_json_schema: { type: "object", properties: { chief_complaint: { type: "string" }, history_of_present_illness: { type: "string" }, review_of_systems: { type: "string" }, initial_assessment: { type: "string" }, suggested_diagnoses: { type: "array", items: { type: "string" } }, recommended_tests: { type: "array", items: { type: "string" } } } }
                });
                await base44.entities.ClinicalNote.update(noteId, { chief_complaint: result.chief_complaint, history_of_present_illness: result.history_of_present_illness, review_of_systems: result.review_of_systems, assessment: result.initial_assessment });
                queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                toast.success("AI analysis complete — fields populated");
              } catch { toast.error("Failed to analyze patient data"); } finally { setAnalyzingRawData(false); }
            }}
            disabled={analyzingRawData}
            size="sm"
            variant="outline"
            className="gap-2"
          >
            {analyzingRawData ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing...</> : <><Sparkles className="w-3.5 h-3.5" /> Quick Fill</>}
          </Button>
        </div>
      </div>

      {/* 1 - Vital Signs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-white/20 flex items-center justify-center text-xs font-bold">1</div>
            <span className="text-sm font-semibold">Vital Signs</span>
            <span className="text-emerald-200 text-xs">· enter manually or paste for AI extraction</span>
          </div>
        </div>
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
            onChange={async (newVitalSigns) => { await base44.entities.ClinicalNote.update(noteId, { vital_signs: newVitalSigns }); queryClient.invalidateQueries({ queryKey: ["note", noteId] }); }}
            onSave={async (newVitalSigns) => {
              const filteredVitals = Object.fromEntries(Object.entries(newVitalSigns).filter(([_, v]) => v && (v.value !== undefined && v.value !== "" || v.systolic !== undefined)));
              if (Object.keys(filteredVitals).length === 0) { toast.error("Please enter at least one vital sign"); return; }
              setVitalSignsHistory(prev => [{ vitals: filteredVitals, timestamp: new Date().toISOString() }, ...prev]);
              await base44.entities.ClinicalNote.update(noteId, { vital_signs: filteredVitals });
              queryClient.invalidateQueries({ queryKey: ["note", noteId] });
              toast.success("Vital signs saved");
            }}
          />
          <div className="border-t border-slate-100 pt-3">
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
              className="gap-2 border-teal-300 text-teal-700 hover:bg-teal-50"
            >
              {loadingVitalAnalysis ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing...</> : <><Sparkles className="w-3.5 h-3.5" /> Analyze Vitals</>}
            </Button>
          </div>
          {vitalSignsAnalysis && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
              {vitalSignsAnalysis.analysis?.map((item, idx) => (
                <div key={idx} className={`rounded-lg border p-3 ${item.status === "abnormal" ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-sm text-slate-900 capitalize">{item.vital_sign}</p>
                    <Badge className={item.status === "abnormal" ? "bg-red-600 text-white" : "bg-green-600 text-white"}>{item.status.toUpperCase()}</Badge>
                  </div>
                  <p className="text-xs text-slate-700"><strong>Value:</strong> {item.value} &nbsp;|&nbsp; <strong>Range:</strong> {item.reference_range}</p>
                  {item.clinical_significance && <p className="text-xs text-slate-600 mt-0.5">{item.clinical_significance}</p>}
                </div>
              ))}
              {vitalSignsAnalysis.summary && <div className="bg-slate-50 border border-slate-200 rounded-lg p-3"><p className="text-xs text-slate-600">{vitalSignsAnalysis.summary}</p></div>}
            </motion.div>
          )}
        </div>
      </div>

      {/* 2 - Raw Note Input */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-slate-500 to-slate-600 text-white">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-white/20 flex items-center justify-center text-xs font-bold">2</div>
            <span className="text-sm font-semibold">Raw Note Input</span>
          </div>
          <div className="flex items-center gap-2">
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
              className="text-white hover:bg-white/20 gap-1.5 text-xs"
            >
              {checkingGrammar ? <><Loader2 className="w-3 h-3 animate-spin" /> Checking...</> : <><Sparkles className="w-3 h-3" /> Grammar Check</>}
            </Button>
            {note.raw_note && (
              <Button size="sm" variant="ghost" onClick={async () => { queryClient.setQueryData(["note", noteId], (old) => ({ ...old, raw_note: "" })); await base44.entities.ClinicalNote.update(noteId, { raw_note: "" }); setGrammarSuggestions(null); toast.success("Raw note cleared"); }} className="text-white hover:bg-white/20 gap-1.5 text-xs">
                <X className="w-3 h-3" /> Clear
              </Button>
            )}
          </div>
        </div>
        <div className="p-4 space-y-3">
          <Textarea value={note.raw_note || ""} onChange={(e) => queryClient.setQueryData(["note", noteId], (old) => ({ ...old, raw_note: e.target.value }))} onBlur={async (e) => { await base44.entities.ClinicalNote.update(noteId, { raw_note: e.target.value }); toast.success("Raw note saved"); }} placeholder="Paste raw clinical data, voice transcripts, or unstructured notes here..." className="min-h-[160px] text-base" />
          {grammarSuggestions && (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-50 px-3 py-2 flex items-center justify-between border-b border-slate-200">
                <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-blue-500" />{grammarSuggestions.issues?.length > 0 ? `${grammarSuggestions.issues.length} issue(s) found` : "No issues found ✓"}</p>
                <div className="flex gap-2">
                  {grammarSuggestions.corrected_text && grammarSuggestions.issues?.length > 0 && <Button size="sm" onClick={async () => { queryClient.setQueryData(["note", noteId], (old) => ({ ...old, raw_note: grammarSuggestions.corrected_text })); await base44.entities.ClinicalNote.update(noteId, { raw_note: grammarSuggestions.corrected_text }); setGrammarSuggestions(null); toast.success("Corrections applied"); }} className="h-6 text-xs bg-blue-600 hover:bg-blue-700 text-white px-2">Apply All</Button>}
                  <button onClick={() => setGrammarSuggestions(null)} className="text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              {grammarSuggestions.issues?.length > 0 && <div className="p-3 space-y-2 max-h-40 overflow-y-auto">{grammarSuggestions.issues.map((issue, i) => (<div key={i} className="flex items-start gap-2 text-xs"><span className={`flex-shrink-0 px-1.5 py-0.5 rounded font-medium ${issue.type === 'spelling' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{issue.type}</span><span className="text-slate-500 line-through">{issue.original}</span><span className="text-slate-400">→</span><span className="text-slate-800 font-medium">{issue.corrected}</span>{issue.explanation && <span className="text-slate-400 italic">({issue.explanation})</span>}</div>))}</div>}
            </div>
          )}
        </div>
      </div>

      {/* 4 - Review of Systems */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-white/20 flex items-center justify-center text-xs font-bold">4</div>
            <span className="text-sm font-semibold">Review of Systems</span>
            <span className="text-purple-200 text-xs">· systematic symptom review</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost"
              onClick={async () => {
                await base44.entities.ClinicalNote.update(noteId, { review_of_systems: "REVIEW OF SYSTEMS:\nGeneral: Denies fever, chills, weight loss.\nHeadache: Denies headache or dizziness.\nEyes, Ears, Nose, Throat: Denies vision changes, hearing loss, rhinorrhea, or sore throat.\nCardiovascular: Denies chest pain, palpitations, orthopnea, PND.\nRespiratory: Denies dyspnea, cough, or wheezing.\nGastrointestinal: Denies nausea, vomiting, diarrhea, constipation, or abdominal pain.\nGenitourinary: Denies dysuria, frequency, or urgency.\nMusculoskeletal: Denies joint pain, swelling, or stiffness.\nNeurological: Denies numbness, tingling, weakness, or tremor.\nPsychiatric: Denies depression, anxiety, or sleep disturbance.\nSkin: No rashes or lesions noted." });
                queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                setRosNormal(true);
                toast.success("ROS set to normal");
              }}
              className={`gap-1.5 text-xs border ${rosNormal ? "bg-white text-purple-600 border-white" : "bg-white/20 hover:bg-white/30 border-white/30 text-white"}`}
            >
              <Check className="w-3 h-3" /> Set Normal
            </Button>
            <InlineSectionAI type="review_of_systems" note={note} onApply={async (val) => { await base44.entities.ClinicalNote.update(noteId, { review_of_systems: val }); queryClient.invalidateQueries({ queryKey: ["note", noteId] }); }} />
          </div>
        </div>
        <div className="p-4">
          <ReviewOfSystemsEditor
            rosData={note.review_of_systems}
            note={note}
            onUpdate={async (rosData) => { const rosString = typeof rosData === 'string' ? rosData : JSON.stringify(rosData); await base44.entities.ClinicalNote.update(noteId, { review_of_systems: rosString }); queryClient.invalidateQueries({ queryKey: ["note", noteId] }); toast.success("Review of systems updated"); }}
            onAddToNote={async (rosText) => { await base44.entities.ClinicalNote.update(noteId, { review_of_systems: rosText }); queryClient.invalidateQueries({ queryKey: ["note", noteId] }); toast.success("Review of systems saved"); }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center pt-2 border-t border-slate-200">
        <div className="flex gap-2">
          <TabDataPreview tabId="patient_intake" note={note} />
          <ClinicalNotePreviewButton note={note} templates={templates} selectedTemplate={selectedTemplate} onTemplateChange={setSelectedTemplate} onUpdate={async (field, value) => { await base44.entities.ClinicalNote.update(noteId, { [field]: value }); queryClient.invalidateQueries({ queryKey: ["note", noteId] }); }} />
        </div>
        <div className="flex items-center gap-2">
          {!isFirstTab() && (
            <button onClick={handleBack} className="group flex items-center gap-0 hover:gap-2 transition-all duration-200 w-9 hover:w-auto overflow-hidden bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg px-2.5 py-2 font-medium text-sm" title="Back">
              <ArrowLeft className="w-4 h-4 flex-shrink-0" />
              <span className="max-w-0 group-hover:max-w-xs overflow-hidden whitespace-nowrap transition-all duration-200">Back</span>
            </button>
          )}
          {!isLastTab() && (
            <button onClick={handleNext} className="group flex items-center gap-0 hover:gap-2 transition-all duration-200 w-9 hover:w-auto overflow-hidden bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-2.5 py-2 font-medium text-sm" title="Next">
              <ArrowLeft className="w-4 h-4 rotate-180 flex-shrink-0" />
              <span className="max-w-0 group-hover:max-w-xs overflow-hidden whitespace-nowrap transition-all duration-200">Next</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}