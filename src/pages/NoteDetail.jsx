import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  FileText,
  Calendar,
  Hash,
  Sparkles,
  Loader2,
  Check,
  Plus,
  Code,
  Download
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import StructuredNotePreview from "../components/notes/StructuredNotePreview";
import PatientSummary from "../components/notes/PatientSummary";
import SmartGuidelinePanel from "../components/guidelines/SmartGuidelinePanel";
import CreateTemplateFromNote from "../components/templates/CreateTemplateFromNote";
import ICD10Suggestions from "../components/notes/ICD10Suggestions";

const statusColors = {
  draft: "bg-amber-50 text-amber-700 border-amber-200",
  finalized: "bg-emerald-50 text-emerald-700 border-emerald-200",
  amended: "bg-blue-50 text-blue-700 border-blue-200",
};

const typeLabels = {
  progress_note: "Progress Note",
  h_and_p: "History & Physical",
  discharge_summary: "Discharge Summary",
  consult: "Consultation",
  procedure_note: "Procedure Note",
};

export default function NoteDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const noteId = urlParams.get("id");
  const queryClient = useQueryClient();
  const [patientSummary, setPatientSummary] = useState(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [icd10Suggestions, setIcd10Suggestions] = useState([]);
  const [loadingIcd10, setLoadingIcd10] = useState(false);
  const [guidelineRecommendations, setGuidelineRecommendations] = useState([]);
  const [loadingGuidelines, setLoadingGuidelines] = useState(false);
  const [exportingFormat, setExportingFormat] = useState(null);

  const { data: note, isLoading } = useQuery({
    queryKey: ["note", noteId],
    queryFn: () => base44.entities.ClinicalNote.list().then(
      (notes) => notes.find((n) => n.id === noteId)
    ),
    enabled: !!noteId,
  });

  const finalizeMutation = useMutation({
    mutationFn: () => base44.entities.ClinicalNote.update(noteId, { status: "finalized" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["note", noteId] }),
  });

  // Auto-generate summary, guidelines, and ICD-10 suggestions for finalized notes
  useEffect(() => {
    if (note && note.status === "finalized") {
      if (!patientSummary && !generatingSummary) {
        generateSummary();
      }
      if (!icd10Suggestions.length && !loadingIcd10) {
        generateICD10Suggestions();
      }
      if (!guidelineRecommendations.length && !loadingGuidelines) {
        fetchGuidelineRecommendations();
      }
    }
  }, [note?.id, note?.status, patientSummary, generatingSummary, icd10Suggestions.length, loadingIcd10, guidelineRecommendations.length, loadingGuidelines]);

  const generateSummary = async () => {
    if (!note) return;
    setGeneratingSummary(true);
    
    try {
      const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate a concise patient summary from this clinical note. Focus on actionable information for continuity of care.

Patient: ${note.patient_name}
Date: ${note.date_of_visit}

Chief Complaint: ${note.chief_complaint || "N/A"}
Assessment: ${note.assessment || "N/A"}
Plan: ${note.plan || "N/A"}
Diagnoses: ${note.diagnoses?.join(", ") || "N/A"}
Medications: ${note.medications?.join(", ") || "N/A"}

Provide:
1. Overview - 2-3 sentence summary of visit
2. Key Diagnoses - List of primary diagnoses
3. Current Medications - All medications with dosages
4. Follow-up Plans - Next steps, appointments, tests ordered
5. Critical Alerts - Any urgent items requiring attention (empty array if none)`,
      response_json_schema: {
        type: "object",
        properties: {
          overview: { type: "string" },
          key_diagnoses: { type: "array", items: { type: "string" } },
          current_medications: { type: "array", items: { type: "string" } },
          follow_up_plans: { type: "array", items: { type: "string" } },
          critical_alerts: { type: "array", items: { type: "string" } },
        },
      },
      });

      setPatientSummary(result);
    } catch (error) {
      console.error("Failed to generate summary:", error);
    } finally {
      setGeneratingSummary(false);
    }
  };

  const fetchGuidelineRecommendations = async () => {
    if (!note) return;
    setLoadingGuidelines(true);
    try {
      const conditions = [];
      if (Array.isArray(note.diagnoses) && note.diagnoses.length > 0) {
        conditions.push(...note.diagnoses.slice(0, 3));
      }

      if (conditions.length === 0) {
        setLoadingGuidelines(false);
        return;
      }

      const recommendations = await Promise.all(
        conditions.slice(0, 2).map(async (condition) => {
          const cleanCondition = condition.replace(/\(.*?\)/g, "").trim();
          const result = await base44.integrations.Core.InvokeLLM({
            prompt: `Provide comprehensive evidence-based guideline treatment plan for: ${cleanCondition}

Include detailed, actionable recommendations with:

1. DIAGNOSTIC WORKUP
   - Initial laboratory tests (with normal ranges and clinical significance)
   - Imaging studies (with indications)
   - Specialist referrals if needed

2. MEDICATIONS
   - First-line medications with specific dosing (dose, frequency, route)
   - Alternative medications with dosing
   - Duration of therapy
   - Monitoring requirements for each medication

3. KEY RECOMMENDATIONS
   - Provide 4-6 concise, actionable recommendations
   - Include lifestyle modifications, patient education, and follow-up guidance
   - Write as clear bullet points WITHOUT any inline citations, reference numbers, or bracketed numbers
   - Make each recommendation specific and immediately actionable

4. MONITORING & FOLLOW-UP
   - Follow-up timing
   - What to monitor and when
   - Red flags requiring urgent evaluation

Keep recommendations specific, actionable, and evidence-based.`,
            add_context_from_internet: true,
            response_json_schema: {
              type: "object",
              properties: {
                summary: { type: "string" },
                diagnostic_workup: { 
                  type: "array", 
                  items: { 
                    type: "object",
                    properties: {
                      test: { type: "string" },
                      indication: { type: "string" },
                      timing: { type: "string" }
                    }
                  }
                },
                medications: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      dosing: { type: "string" },
                      indication: { type: "string" },
                      duration: { type: "string" },
                      monitoring: { type: "string" }
                    }
                  }
                },
                key_recommendations: { 
                  type: "array", 
                  items: { type: "string" },
                  description: "Concise, actionable recommendations as bullet points without any inline citations or reference numbers"
                },
                followup: {
                  type: "object",
                  properties: {
                    timing: { type: "string" },
                    parameters: { type: "array", items: { type: "string" } },
                    red_flags: { type: "array", items: { type: "string" } }
                  }
                },
                sources: { type: "array", items: { type: "string" } }
              }
            }
          });

          return { 
            condition: cleanCondition, 
            guideline_id: `guideline_${Date.now()}_${Math.random()}`,
            ...result 
          };
        })
      );

      setGuidelineRecommendations(recommendations);
    } catch (error) {
      console.error("Failed to fetch guidelines:", error);
    } finally {
      setLoadingGuidelines(false);
    }
  };

  const generateICD10Suggestions = async () => {
    if (!note) return;
    setLoadingIcd10(true);
    
    try {
      const diagnosesList = note.diagnoses?.join(", ") || "";
      const assessment = note.assessment || "";

      if (!diagnosesList && !assessment) {
        setLoadingIcd10(false);
        return;
      }

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert medical coder. Analyze the following clinical information and suggest the most appropriate ICD-10 codes. Rank codes by specificity and clinical relevance.

PATIENT CONTEXT:
Chief Complaint: ${note.chief_complaint || "N/A"}
Assessment: ${assessment}
History of Present Illness: ${note.history_of_present_illness || "N/A"}

DIAGNOSES TO CODE:
${diagnosesList}

CODING STANDARDS:
- Use the most specific 5-7 character ICD-10 codes available
- Include laterality (left/right) when relevant
- Include severity or stage when documented
- Consider combination codes that capture the complete clinical picture
- Return 5-8 ranked codes with highest confidence first

For each code, provide:
1. The specific ICD-10 code (e.g., I10, E11.9231)
2. The complete description
3. Which diagnosis this code addresses
4. Your confidence level (high, moderate, low) based on documentation completeness`,
        response_json_schema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  code: { type: "string" },
                  description: { type: "string" },
                  diagnosis: { type: "string" },
                  confidence: { type: "string", enum: ["high", "moderate", "low"] }
                }
              }
            }
          }
        }
      });

      setIcd10Suggestions(result.suggestions || []);
    } catch (error) {
      console.error("Failed to generate ICD-10 suggestions:", error);
    } finally {
      setLoadingIcd10(false);
    }
  };

  const downloadSummary = () => {
    if (!patientSummary) return;

    const content = `
PATIENT SUMMARY
Patient: ${note.patient_name}
Date: ${note.date_of_visit ? format(new Date(note.date_of_visit), "MMMM d, yyyy") : "N/A"}
${note.patient_id ? `MRN: ${note.patient_id}` : ""}

OVERVIEW
${patientSummary.overview}

KEY DIAGNOSES
${patientSummary.key_diagnoses?.map(d => `• ${d}`).join("\n") || "None"}

CURRENT MEDICATIONS
${patientSummary.current_medications?.map(m => `• ${m}`).join("\n") || "None"}

FOLLOW-UP PLANS
${patientSummary.follow_up_plans?.map(p => `• ${p}`).join("\n") || "None"}

${patientSummary.critical_alerts && patientSummary.critical_alerts.length > 0 ? `CRITICAL ALERTS\n${patientSummary.critical_alerts.map(a => `⚠️ ${a}`).join("\n")}` : ""}

Generated: ${new Date().toLocaleString()}
    `.trim();

    const blob = new Blob([content], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${note.patient_name}_Summary_${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  const exportNote = async (exportFormat) => {
    setExportingFormat(exportFormat);
    try {
      const response = await base44.functions.invoke('exportClinicalNote', {
        noteId: note.id,
        format: exportFormat
      });

      const blob = new Blob([response.data], { 
        type: exportFormat === 'pdf' ? 'application/pdf' : 'text/plain'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${note.patient_name}_${note.date_of_visit || 'Note'}.${exportFormat === 'pdf' ? 'pdf' : 'txt'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error(`Failed to export as ${exportFormat}:`, error);
      alert(`Failed to export note as ${exportFormat}`);
    } finally {
      setExportingFormat(null);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-900">Note not found</h2>
        <Link to={createPageUrl("NotesLibrary")} className="text-blue-600 hover:underline text-sm mt-2 inline-block">
          Back to Notes Library
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Nav */}
        <Link
        to={createPageUrl("NotesLibrary")}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Notes
      </Link>

      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-slate-100 p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-slate-900">{note.patient_name}</h1>
              <Badge variant="outline" className={statusColors[note.status] || statusColors.draft}>
                {note.status || "draft"}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
              {note.patient_id && (
                <span className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5" /> {note.patient_id}</span>
              )}
              <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> {typeLabels[note.note_type] || "Note"}</span>
              {note.date_of_visit && (
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {format(new Date(note.date_of_visit), "MMMM d, yyyy")}</span>
              )}
              {note.specialty && (
                <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> {note.specialty}</span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Link to={createPageUrl("NewNote")}>
              <Button
                className="rounded-xl gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" /> New Note
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => setTemplateDialogOpen(true)}
              className="rounded-xl gap-2"
            >
              <Sparkles className="w-4 h-4" /> Save as Template
            </Button>
            {note.status === "finalized" && patientSummary && (
              <Button
                variant="outline"
                onClick={generateSummary}
                disabled={generatingSummary}
                className="rounded-xl gap-2"
              >
                {generatingSummary ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Regenerating...</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Regenerate Summary</>
                )}
              </Button>
            )}
            {note.status === "draft" && (
              <Button
                onClick={() => finalizeMutation.mutate()}
                className="bg-emerald-600 hover:bg-emerald-700 rounded-xl gap-2"
              >
                <Check className="w-4 h-4" /> Finalize
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Patient Summary */}
      {generatingSummary && !patientSummary && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-100 p-6"
        >
          <div className="flex items-center gap-3 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Generating AI summary...</span>
          </div>
        </motion.div>
      )}
      {patientSummary && (
        <PatientSummary 
          summary={patientSummary} 
          patientName={note.patient_name}
          onDownload={downloadSummary}
        />
      )}

      {/* Clinical Guidelines */}
      {note.diagnoses && note.diagnoses.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Clinical Guidelines
              </h2>
              <p className="text-sm text-slate-500 mt-1">Evidence-based recommendations for identified diagnoses</p>
            </div>
          </div>

          {loadingGuidelines ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-3" />
              <p className="text-sm font-medium text-slate-900">Fetching guidelines</p>
              <p className="text-xs text-slate-500 mt-1">Analyzing your diagnoses for relevant recommendations...</p>
            </div>
          ) : guidelineRecommendations.length > 0 ? (
            <div className="space-y-4">
              {guidelineRecommendations.map((rec, idx) => (
                <div key={idx} className="bg-gradient-to-br from-slate-50 to-white rounded-xl border-2 border-slate-200 p-5 hover:border-purple-300 transition-all shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 text-base mb-2">{rec.condition}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{rec.summary}</p>
                    </div>
                  </div>
                  
                  {/* Diagnostic Workup */}
                  {rec.diagnostic_workup && rec.diagnostic_workup.length > 0 && (
                    <div className="mt-4 bg-blue-50 rounded-lg border border-blue-200 p-4">
                      <h4 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                        <Code className="w-4 h-4" />
                        Diagnostic Workup
                      </h4>
                      <div className="space-y-2">
                        {rec.diagnostic_workup.map((test, i) => (
                          <div key={i} className="bg-white rounded-lg p-3 border border-blue-100">
                            <p className="text-sm font-semibold text-slate-900">{test.test}</p>
                            <p className="text-xs text-slate-600 mt-1"><strong>Indication:</strong> {test.indication}</p>
                            <p className="text-xs text-slate-600"><strong>Timing:</strong> {test.timing}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Medications */}
                  {rec.medications && rec.medications.length > 0 && (
                    <div className="mt-4 bg-green-50 rounded-lg border border-green-200 p-4">
                      <h4 className="text-sm font-bold text-green-900 mb-3 flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Medications
                      </h4>
                      <div className="space-y-3">
                        {rec.medications.map((med, i) => (
                          <div key={i} className="bg-white rounded-lg p-3 border border-green-100">
                            <p className="text-sm font-semibold text-slate-900">{med.name}</p>
                            <div className="mt-2 space-y-1">
                              <p className="text-xs text-slate-700"><strong className="text-green-700">Dosing:</strong> {med.dosing}</p>
                              <p className="text-xs text-slate-700"><strong className="text-green-700">Indication:</strong> {med.indication}</p>
                              <p className="text-xs text-slate-700"><strong className="text-green-700">Duration:</strong> {med.duration}</p>
                              {med.monitoring && (
                                <p className="text-xs text-slate-700"><strong className="text-green-700">Monitoring:</strong> {med.monitoring}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Key Recommendations */}
                  {rec.key_recommendations && rec.key_recommendations.length > 0 && (
                    <div className="mt-4 bg-amber-50 rounded-lg border border-amber-200 p-4">
                      <h4 className="text-sm font-bold text-amber-900 mb-2">Key Recommendations</h4>
                      <ul className="space-y-1">
                        {rec.key_recommendations.map((item, i) => (
                          <li key={i} className="text-xs text-slate-700 flex items-start gap-2">
                            <span className="text-amber-600 mt-0.5">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Follow-up */}
                  {rec.followup && (
                    <div className="mt-4 bg-purple-50 rounded-lg border border-purple-200 p-4">
                      <h4 className="text-sm font-bold text-purple-900 mb-2">Monitoring & Follow-up</h4>
                      <div className="space-y-2">
                        <p className="text-xs text-slate-700"><strong>Timing:</strong> {rec.followup.timing}</p>
                        {rec.followup.parameters && rec.followup.parameters.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-purple-900 mb-1">Monitor:</p>
                            <ul className="space-y-1">
                              {rec.followup.parameters.map((param, i) => (
                                <li key={i} className="text-xs text-slate-700 flex items-start gap-2">
                                  <span className="text-purple-600">•</span>
                                  <span>{param}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {rec.followup.red_flags && rec.followup.red_flags.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-red-900 mb-1">Red Flags:</p>
                            <ul className="space-y-1">
                              {rec.followup.red_flags.map((flag, i) => (
                                <li key={i} className="text-xs text-red-700 flex items-start gap-2">
                                  <span className="text-red-600">⚠️</span>
                                  <span>{flag}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {rec.sources && rec.sources.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <p className="text-xs font-semibold text-slate-700 mb-2">References:</p>
                      <div className="space-y-1">
                        {rec.sources.map((source, i) => (
                          <p key={i} className="text-xs text-slate-600">{i + 1}. {source}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-slate-200 flex gap-2">
                    <Button
                      size="sm"
                      onClick={async () => {
                        let planText = `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
                        planText += `GUIDELINE-BASED TREATMENT PLAN: ${rec.condition}\n`;
                        planText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
                        
                        if (rec.diagnostic_workup && rec.diagnostic_workup.length > 0) {
                          planText += `DIAGNOSTIC WORKUP:\n`;
                          rec.diagnostic_workup.forEach((test, i) => {
                            planText += `  ${i + 1}. ${test.test}\n`;
                            planText += `     • Indication: ${test.indication}\n`;
                            planText += `     • Timing: ${test.timing}\n`;
                          });
                          planText += `\n`;
                        }
                        
                        if (rec.medications && rec.medications.length > 0) {
                          planText += `MEDICATIONS:\n`;
                          rec.medications.forEach((med, i) => {
                            planText += `  ${i + 1}. ${med.name}\n`;
                            planText += `     • Dosing: ${med.dosing}\n`;
                            planText += `     • Indication: ${med.indication}\n`;
                            planText += `     • Duration: ${med.duration}\n`;
                            if (med.monitoring) planText += `     • Monitoring: ${med.monitoring}\n`;
                          });
                          planText += `\n`;
                        }
                        
                        if (rec.key_recommendations && rec.key_recommendations.length > 0) {
                          planText += `KEY RECOMMENDATIONS:\n`;
                          rec.key_recommendations.forEach((item, i) => {
                            const cleanedItem = item.replace(/[*_~`]/g, '').trim();
                            planText += `  • ${cleanedItem}\n`;
                          });
                          planText += `\n`;
                        }
                        
                        if (rec.followup) {
                          planText += `MONITORING & FOLLOW-UP:\n`;
                          planText += `  • Follow-up: ${rec.followup.timing}\n`;
                          if (rec.followup.parameters && rec.followup.parameters.length > 0) {
                            planText += `  • Monitor: ${rec.followup.parameters.join(', ')}\n`;
                          }
                          if (rec.followup.red_flags && rec.followup.red_flags.length > 0) {
                            planText += `  • Red Flags: ${rec.followup.red_flags.join('; ')}\n`;
                          }
                        }
                        
                        const updatedPlan = (note.plan || "") + planText;
                        await base44.entities.ClinicalNote.update(noteId, { plan: updatedPlan });
                        queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                      }}
                      className="flex-1 gap-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-white"
                    >
                      <Check className="w-3.5 h-3.5" /> Add Complete Treatment Plan
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-8">No guideline recommendations available</p>
          )}
        </motion.div>
      )}

      {/* ICD-10 Code Suggestions */}
      {note.diagnoses && note.diagnoses.length > 0 && (
        <ICD10Suggestions
          suggestions={icd10Suggestions}
          loading={loadingIcd10}
          readOnly={true}
        />
      )}

      {/* Structured Note */}
      <StructuredNotePreview 
        note={note} 
        onUpdate={(field, value) => {
          queryClient.setQueryData(["note", noteId], (old) => ({
            ...old,
            [field]: value
          }));
        }}
        onReanalyze={() => {}}
        guidelineRecommendations={guidelineRecommendations}
        loadingGuidelines={loadingGuidelines}
        medicationRecommendations={[]}
        loadingMedications={false}
      />

      {/* Raw Note */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-slate-100 p-6"
      >
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Original Note</h3>
        <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
          {note.raw_note}
        </div>
      </motion.div>
      </div>

      {/* Smart Guideline Panel */}
      <SmartGuidelinePanel
        noteContent={note.raw_note}
        diagnoses={note.diagnoses || []}
        medications={note.medications || []}
      />

      {/* Create Template Dialog */}
      <CreateTemplateFromNote
        open={templateDialogOpen}
        onClose={() => setTemplateDialogOpen(false)}
        note={note}
        onSuccess={() => setTemplateDialogOpen(false)}
      />
    </>
  );
}