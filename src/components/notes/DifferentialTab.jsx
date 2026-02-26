import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Plus, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import TabPageLayout from "./TabPageLayout";

export default function DifferentialTab({
  note, noteId, queryClient,
  templates, selectedTemplate, setSelectedTemplate,
  loadingDifferential, differentialDiagnosis,
  isFirstTab, isLastTab, handleBack, handleNext,
}) {
  const [loading, setLoading] = useState(false);
  const [userSettings, setUserSettings] = useState(null);

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await base44.auth.me();
      if (settings) {
        setUserSettings(settings);
      }
    };
    loadSettings();
  }, []);

  const generateDifferentialDiagnosis = async () => {
    if (!note?.chief_complaint) return;
    setLoading(true);
    try {
      const response = await base44.functions.invoke('generateSpecialtyAwareDifferential', {
        chiefComplaint: note.chief_complaint,
        hpi: note.history_of_present_illness || "",
        physicalExam: note.physical_exam || "",
        assessment: note.assessment || "",
        specialty: userSettings?.clinical_settings?.medical_specialty || "internal_medicine"
      });
      
      if (response.data.differentials) {
        queryClient.setQueryData(["note", noteId], old => ({ 
          ...old, 
          differentials: response.data.differentials 
        }));
        toast.success("Differentials generated for " + (userSettings?.clinical_settings?.medical_specialty || "Internal Medicine"));
      }
    } catch (error) {
      console.error("Failed to generate differential diagnosis:", error);
      toast.error("Failed to generate differential diagnoses");
    } finally {
      setLoading(false);
    }
  };
  return (
    <TabPageLayout
      title="Differential Diagnosis"
      subtitle="AI-ranked differential diagnoses"
      tabId="differential"
      note={note}
      templates={templates}
      selectedTemplate={selectedTemplate}
      setSelectedTemplate={setSelectedTemplate}
      onUpdate={async (field, value) => { await base44.entities.ClinicalNote.update(noteId, { [field]: value }); queryClient.invalidateQueries({ queryKey: ["note", noteId] }); }}
      isFirstTab={isFirstTab} isLastTab={isLastTab} handleBack={handleBack} handleNext={handleNext}
    >
      {/* Context strip */}
      {note.chief_complaint && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-blue-700 mr-2">CC</span>
            <span className="text-xs text-slate-700">{note.chief_complaint}</span>
          </div>
          {note.vital_signs?.blood_pressure?.systolic && (
            <span className="text-xs text-slate-500 flex-shrink-0">BP {note.vital_signs.blood_pressure.systolic}/{note.vital_signs.blood_pressure.diastolic}</span>
          )}
        </div>
      )}

      {/* Generate Card */}
      <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-rose-500 shadow-sm overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-rose-500" />
          <span className="text-sm font-semibold text-slate-800">AI Generator</span>
          <span className="text-xs text-slate-400">· ranked by likelihood</span>
        </div>
        <div className="p-4">
          {!note.chief_complaint ? (
            <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
              <AlertCircle className="w-4 h-4 text-slate-400" />
              Add a chief complaint above to generate differential diagnoses.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Button
                onClick={generateDifferentialDiagnosis}
                disabled={loading}
                size="sm"
                className="bg-rose-600 hover:bg-rose-700 text-white gap-1.5 text-xs h-7 px-3"
              >
                {loading ? <><Loader2 className="w-3 h-3 animate-spin" />Generating...</> : <><Sparkles className="w-3 h-3" />Generate for {userSettings?.medical_specialty?.replace(/_/g, ' ') || 'Internal Medicine'}</>}
              </Button>
              {userSettings?.medical_specialty && (
                <span className="text-xs text-slate-500">Specialty: {userSettings.medical_specialty.replace(/_/g, ' ').toUpperCase()}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {differentialDiagnosis.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-rose-400" />
              <span className="text-sm font-semibold text-slate-800">Results</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-rose-100 text-rose-700 border border-rose-200 text-xs">{differentialDiagnosis.length}</Badge>
              <Button
                size="sm" variant="outline"
                onClick={async () => {
                  const diffText = differentialDiagnosis.map((d, i) => `${i + 1}. ${d.diagnosis} (${d.likelihood_rank}/5)\n   ${d.clinical_reasoning}`).join('\n\n');
                  await base44.entities.ClinicalNote.update(noteId, { assessment: (note.assessment || "") + "\n\nDIFFERENTIAL DIAGNOSIS\n\n" + diffText });
                  queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                  toast.success("Added to Assessment");
                }}
                className="text-xs h-6 px-2 border-slate-200 text-slate-600"
              >
                <Plus className="w-3 h-3 mr-1" />Add All
              </Button>
            </div>
          </div>
          <div className="p-4 space-y-3">
            {differentialDiagnosis.map((diff, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="border border-slate-200 rounded-lg p-3 hover:border-rose-200 transition-colors">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{idx + 1}</div>
                    <span className="text-sm font-semibold text-slate-900 truncate">{diff.diagnosis}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map(n => <div key={n} className={`w-1.5 h-3 rounded-sm ${n <= diff.likelihood_rank ? 'bg-rose-500' : 'bg-slate-200'}`} />)}
                    </div>
                    <Button size="sm" onClick={async () => { queryClient.setQueryData(["note", noteId], (old) => ({ ...old, diagnoses: [...(old.diagnoses || []), diff.diagnosis] })); await base44.entities.ClinicalNote.update(noteId, { diagnoses: [...(note.diagnoses || []), diff.diagnosis] }); queryClient.invalidateQueries({ queryKey: ["note", noteId] }); toast.success("Added"); }} className="h-5 text-xs bg-rose-600 hover:bg-rose-700 text-white px-2 rounded">Add</Button>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{diff.clinical_reasoning}</p>
                {diff.red_flags_to_monitor?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {diff.red_flags_to_monitor.map((f, i) => <span key={i} className="text-xs bg-red-50 text-red-700 border border-red-200 rounded px-1.5 py-0.5">⚠ {f}</span>)}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </TabPageLayout>
  );
}