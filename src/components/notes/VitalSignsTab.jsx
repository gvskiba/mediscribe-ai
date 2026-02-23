import React from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import VitalSignsPasteAnalyzer from "./VitalSignsPasteAnalyzer";
import VitalSignsInput from "./VitalSignsInput";
import VitalSignsHistory from "./VitalSignsHistory";
import TabPageLayout from "./TabPageLayout";

export default function VitalSignsTab({
  note, noteId, queryClient,
  templates, selectedTemplate, setSelectedTemplate,
  loadingVitalAnalysis, setLoadingVitalAnalysis,
  vitalSignsAnalysis, setVitalSignsAnalysis,
  vitalSignsHistory, setVitalSignsHistory,
  isFirstTab, isLastTab, handleBack, handleNext,
}) {
  return (
    <TabPageLayout
      title="Vital Signs"
      subtitle="Record and analyze patient measurements"
      tabId="vital_signs"
      note={note}
      templates={templates}
      selectedTemplate={selectedTemplate}
      setSelectedTemplate={setSelectedTemplate}
      onUpdate={async (field, value) => { await base44.entities.ClinicalNote.update(noteId, { [field]: value }); queryClient.invalidateQueries({ queryKey: ["note", noteId] }); }}
      isFirstTab={isFirstTab} isLastTab={isLastTab} handleBack={handleBack} handleNext={handleNext}
    >
      {/* Entry Card */}
      <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-emerald-500 shadow-sm overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-sm font-semibold text-slate-800">Entry</span>
          <span className="text-xs text-slate-400">· paste text or enter manually</span>
        </div>
        <div className="p-4 space-y-4">
          <VitalSignsPasteAnalyzer
            vitalSigns={note.vital_signs}
            patientAge={note.patient_age}
            onApplyVitals={async (vitals) => {
              await base44.entities.ClinicalNote.update(noteId, { vital_signs: { temperature: vitals.temperature, heart_rate: vitals.heart_rate, blood_pressure: vitals.blood_pressure, respiratory_rate: vitals.respiratory_rate, oxygen_saturation: vitals.oxygen_saturation, height: vitals.height, weight: vitals.weight } });
              queryClient.invalidateQueries({ queryKey: ["note", noteId] });
            }}
          />
          <div className="border-t border-slate-100" />
          <VitalSignsInput
            vitalSigns={note.vital_signs || {}}
            onChange={async (v) => { await base44.entities.ClinicalNote.update(noteId, { vital_signs: v }); queryClient.invalidateQueries({ queryKey: ["note", noteId] }); }}
            onSave={async (v) => {
              const f = Object.fromEntries(Object.entries(v).filter(([_, val]) => val && (val.value !== undefined && val.value !== "" || val.systolic !== undefined)));
              if (!Object.keys(f).length) { toast.error("Enter at least one vital sign"); return; }
              setVitalSignsHistory(prev => [{ vitals: f, timestamp: new Date().toISOString() }, ...prev]);
              await base44.entities.ClinicalNote.update(noteId, { vital_signs: f });
              queryClient.invalidateQueries({ queryKey: ["note", noteId] });
              toast.success("Saved");
            }}
          />
          <div className="border-t border-slate-100 pt-3 flex items-center gap-2">
            <Button
              onClick={async () => {
                const vitals = note.vital_signs;
                if (!vitals || !Object.keys(vitals).length) { toast.error("No vital signs recorded yet."); return; }
                setLoadingVitalAnalysis(true);
                try {
                  const summary = Object.entries(vitals).filter(([_, v]) => v && typeof v === 'object' && (v.value !== undefined && v.value !== "" || v.systolic !== undefined)).map(([k, v]) => { const d = k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); return k === 'blood_pressure' ? `- ${d}: ${v.systolic}/${v.diastolic} ${v.unit || 'mmHg'}` : `- ${d}: ${v.value} ${v.unit || ''}`.trim(); }).join('\n');
                  if (!summary) { toast.error("No values to analyze"); setLoadingVitalAnalysis(false); return; }
                  const result = await base44.integrations.Core.InvokeLLM({ prompt: `Analyze these vital signs for abnormalities:\n\n${summary}`, response_json_schema: { type: "object", properties: { analysis: { type: "array", items: { type: "object", properties: { vital_sign: { type: "string" }, status: { type: "string", enum: ["normal", "abnormal"] }, value: { type: "string" }, reference_range: { type: "string" }, clinical_significance: { type: "string" } } } }, summary: { type: "string" } } } });
                  setVitalSignsAnalysis(result);
                } catch { toast.error("Analysis failed"); } finally { setLoadingVitalAnalysis(false); }
              }}
              disabled={loadingVitalAnalysis}
              size="sm" variant="outline"
              className="gap-1.5 text-xs h-7 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            >
              {loadingVitalAnalysis ? <><Loader2 className="w-3 h-3 animate-spin" />Analyzing...</> : <><Sparkles className="w-3 h-3" />Analyze Vitals</>}
            </Button>
          </div>
          {vitalSignsAnalysis && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5">
              {vitalSignsAnalysis.analysis?.map((item, i) => (
                <div key={i} className={`rounded-lg border px-3 py-2 flex items-center justify-between ${item.status === "abnormal" ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"}`}>
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
      </div>

      {/* History Card */}
      <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-teal-500 shadow-sm overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-teal-500" />
          <span className="text-sm font-semibold text-slate-800">History</span>
          <span className="text-xs text-slate-400">· previously recorded vitals</span>
        </div>
        <div className="p-4">
          <VitalSignsHistory
            vitalHistory={vitalSignsHistory}
            onAddToNote={async (vitals) => {
              const vs = vitals; const lines = [];
              if (vs.temperature?.value) lines.push(`Temperature: ${vs.temperature.value}°${vs.temperature.unit || 'F'}`);
              if (vs.heart_rate?.value) lines.push(`Heart Rate: ${vs.heart_rate.value} bpm`);
              if (vs.blood_pressure?.systolic) lines.push(`Blood Pressure: ${vs.blood_pressure.systolic}/${vs.blood_pressure.diastolic} mmHg`);
              if (vs.respiratory_rate?.value) lines.push(`Respiratory Rate: ${vs.respiratory_rate.value} breaths/min`);
              if (vs.oxygen_saturation?.value) lines.push(`O2 Sat: ${vs.oxygen_saturation.value}%`);
              if (vs.weight?.value) lines.push(`Weight: ${vs.weight.value} ${vs.weight.unit || 'lbs'}`);
              if (vs.height?.value) lines.push(`Height: ${vs.height.value} ${vs.height.unit || 'in'}`);
              await base44.entities.ClinicalNote.update(noteId, { physical_exam: (note.physical_exam || "") + `\n\nVITAL SIGNS (${new Date().toLocaleDateString()}):\n${lines.join('\n')}` });
              queryClient.invalidateQueries({ queryKey: ["note", noteId] });
              toast.success("Added to Physical Exam");
            }}
          />
        </div>
      </div>
    </TabPageLayout>
  );
}