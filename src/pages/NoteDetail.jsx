import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Download,
  BookOpen,
  FileCode
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import StructuredNotePreview from "../components/notes/StructuredNotePreview";
import PatientSummary from "../components/notes/PatientSummary";
import SmartGuidelinePanel from "../components/guidelines/SmartGuidelinePanel";
import CreateTemplateFromNote from "../components/templates/CreateTemplateFromNote";
import ICD10Suggestions from "../components/notes/ICD10Suggestions";
import ICD10CodeSearch from "../components/notes/ICD10CodeSearch";
import GuidelineReviewPrompt from "../components/notes/GuidelineReviewPrompt";

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
  const [extractingData, setExtractingData] = useState(false);
  const [linkingGuidelines, setLinkingGuidelines] = useState(false);
  const [showGuidelinePrompt, setShowGuidelinePrompt] = useState(false);

  const { data: note, isLoading } = useQuery({
    queryKey: ["note", noteId],
    queryFn: () => base44.entities.ClinicalNote.list().then(
      (notes) => notes.find((n) => n.id === noteId)
    ),
    enabled: !!noteId,
  });

  const finalizeMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.ClinicalNote.update(noteId, { status: "finalized" });
      // Auto-link guidelines after finalization
      setTimeout(() => linkGuidelinesToNote(), 500);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["note", noteId] }),
  });

  const linkGuidelinesToNote = async () => {
    if (!note?.diagnoses || note.diagnoses.length === 0) return;
    setLinkingGuidelines(true);
    
    try {
      const response = await base44.functions.invoke('autoLinkGuidelines', {
        noteId: noteId
      });

      if (response.data.linked_guidelines?.length > 0) {
        setShowGuidelinePrompt(true);
        queryClient.invalidateQueries({ queryKey: ["note", noteId] });
      }
    } catch (error) {
      console.error("Failed to link guidelines:", error);
    } finally {
      setLinkingGuidelines(false);
    }
  };

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
        console.warn("No diagnoses or assessment found for ICD-10 suggestions");
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

  const extractStructuredData = async () => {
    if (!note?.raw_note) return;
    setExtractingData(true);
    
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Extract key medical information from this clinical note. Be thorough and accurate. Return ALL diagnoses found in the note, even if partial or inferred.

CLINICAL NOTE:
${note.raw_note}

Extract and provide:
1. Diagnoses - List ALL diagnoses mentioned or implied in the note (with ICD codes if available). Include suspected conditions.
2. Medications - All medications mentioned with dosages and frequency
3. Allergies - All drug and environmental allergies
4. Chief Complaint - The primary reason for visit
5. Medical History - Significant past medical history items
6. Review of Systems - Key ROS findings
7. Physical Exam - Important physical exam findings

IMPORTANT: Always return diagnoses as an array with at least one entry describing the main condition(s) being addressed in the note.`,
        response_json_schema: {
          type: "object",
          properties: {
            diagnoses: { 
              type: "array", 
              items: { type: "string" },
              description: "List of all diagnoses found in the note" 
            },
            medications: { type: "array", items: { type: "string" } },
            allergies: { type: "array", items: { type: "string" } },
            chief_complaint: { type: "string" },
            medical_history: { type: "string" },
            review_of_systems: { type: "string" },
            physical_exam: { type: "string" }
          },
          required: ["diagnoses"]
        }
      });

      console.log("Extracted data:", result);

      // Update note with extracted data
      const updateData = {};
      if (result.diagnoses?.length > 0) {
        updateData.diagnoses = result.diagnoses;
        console.log("Setting diagnoses:", result.diagnoses);
      }
      if (result.medications?.length > 0) updateData.medications = result.medications;
      if (result.allergies?.length > 0) updateData.allergies = result.allergies;
      if (result.chief_complaint) updateData.chief_complaint = result.chief_complaint;
      if (result.medical_history) updateData.medical_history = result.medical_history;
      if (result.review_of_systems) updateData.review_of_systems = result.review_of_systems;
      if (result.physical_exam) updateData.physical_exam = result.physical_exam;

      if (Object.keys(updateData).length > 0) {
        console.log("Updating note with:", updateData);
        await base44.entities.ClinicalNote.update(noteId, updateData);
        queryClient.invalidateQueries({ queryKey: ["note", noteId] });
      }
    } catch (error) {
      console.error("Failed to extract data:", error);
    } finally {
      setExtractingData(false);
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
      {/* Guideline Review Prompt */}
      {showGuidelinePrompt && note?.linked_guidelines && (
        <GuidelineReviewPrompt
          linkedGuidelines={note.linked_guidelines}
          onIncorporate={async (guideline) => {
            // Update guideline as incorporated
            const updatedGuidelines = note.linked_guidelines.map(g =>
              g.guideline_query_id === guideline.guideline_query_id
                ? { ...g, incorporated: true, adherence_notes: "Incorporated into plan" }
                : g
            );
            await base44.entities.ClinicalNote.update(noteId, {
              linked_guidelines: updatedGuidelines
            });
            queryClient.invalidateQueries({ queryKey: ["note", noteId] });
          }}
          onDismiss={() => setShowGuidelinePrompt(false)}
        />
      )}

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
          <div className="flex gap-2 flex-wrap">
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
            <div className="flex gap-1 border-l border-slate-200 pl-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportNote('text')}
                disabled={exportingFormat === 'text'}
                className="rounded-lg gap-1.5"
                title="Export as plain text"
              >
                {exportingFormat === 'text' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                Text
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportNote('pdf')}
                disabled={exportingFormat === 'pdf'}
                className="rounded-lg gap-1.5"
                title="Export as PDF"
              >
                {exportingFormat === 'pdf' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                PDF
              </Button>
            </div>
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
              <>
                <Button
                  onClick={() => finalizeMutation.mutate()}
                  className="bg-emerald-600 hover:bg-emerald-700 rounded-xl gap-2"
                >
                  <Check className="w-4 h-4" /> Finalize
                </Button>
                <Button
                  onClick={extractStructuredData}
                  disabled={extractingData}
                  variant="outline"
                  className="rounded-xl gap-2"
                  title="Extract diagnoses, medications, allergies and other key information from the note"
                >
                  {extractingData ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Extracting...</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> Extract Data</>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Tabbed Interface */}
       <motion.div
         initial={{ opacity: 0, y: 12 }}
         animate={{ opacity: 1, y: 0 }}
         className="bg-white rounded-2xl border border-slate-100 shadow-sm"
       >
         <Tabs defaultValue="summary" className="w-full">
           <TabsList className="w-full justify-start border-b border-slate-200 rounded-none bg-transparent px-6 h-14">
             <TabsTrigger value="summary" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 px-3">
               Summary
             </TabsTrigger>
             <TabsTrigger value="clinical" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 px-3">
               Clinical Note
             </TabsTrigger>
             <TabsTrigger value="guidelines" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 px-3">
               Guidelines & Codes
             </TabsTrigger>
             <TabsTrigger value="metadata" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 px-3">
               Metadata
             </TabsTrigger>
           </TabsList>

           {/* Summary Tab */}
           <TabsContent value="summary" className="p-6 space-y-4">
             {generatingSummary && !patientSummary && (
               <div className="flex items-center gap-3 text-slate-500 py-8">
                 <Loader2 className="w-5 h-5 animate-spin" />
                 <span className="text-sm">Generating AI summary...</span>
               </div>
             )}
             {patientSummary ? (
               <PatientSummary 
                 summary={patientSummary} 
                 patientName={note.patient_name}
                 onDownload={downloadSummary}
               />
             ) : !generatingSummary && (
               <p className="text-sm text-slate-500 text-center py-8">Summary will appear here after finalization</p>
             )}
           </TabsContent>

           {/* Clinical Note Tab */}
           <TabsContent value="clinical" className="p-6 space-y-6">
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

             <div className="pt-6 border-t border-slate-200">
               <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                 <FileCode className="w-4 h-4" />
                 Original Note
               </h3>
               <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap font-mono">
                 {note.raw_note}
               </div>
             </div>
           </TabsContent>

           {/* Guidelines & Codes Tab */}
           <TabsContent value="guidelines" className="p-6 space-y-6">
             {/* Generate Diagnoses Section */}
             {note.status === "draft" && (
               <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
                 <div>
                   <p className="text-sm font-semibold text-blue-900">Generate Diagnoses</p>
                   <p className="text-xs text-blue-700 mt-1">Extract diagnoses from your clinical note using AI</p>
                 </div>
                 <Button
                   onClick={extractStructuredData}
                   disabled={extractingData || !note.raw_note}
                   className="gap-2 bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0"
                 >
                   {extractingData ? (
                     <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                   ) : (
                     <><Sparkles className="w-4 h-4" /> Generate</>
                   )}
                 </Button>
               </div>
             )}

             {note.status === "finalized" ? (
               <>
                 {/* ICD-10 Codes Section */}
                 <div>
                   <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                     <Code className="w-4 h-4 text-blue-600" />
                     ICD-10 Code Suggestions
                   </h3>
                   {icd10Suggestions && icd10Suggestions.length > 0 ? (
                     <>
                       <ICD10Suggestions
                         suggestions={icd10Suggestions}
                         loading={loadingIcd10}
                         readOnly={true}
                       />
                       <div className="mt-4">
                         <ICD10CodeSearch
                           suggestions={icd10Suggestions}
                           diagnoses={note.diagnoses}
                           onAddDiagnoses={async (newDiagnoses) => {
                             const updatedDiagnoses = [...(note.diagnoses || []), ...newDiagnoses];
                             await base44.entities.ClinicalNote.update(noteId, { diagnoses: updatedDiagnoses });
                             queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                           }}
                         />
                       </div>
                     </>
                   ) : loadingIcd10 ? (
                     <div className="flex items-center gap-3 text-slate-500 py-8">
                       <Loader2 className="w-5 h-5 animate-spin" />
                       <span className="text-sm">Generating ICD-10 suggestions...</span>
                     </div>
                   ) : (
                     <p className="text-sm text-slate-500 text-center py-8">No ICD-10 suggestions available</p>
                   )}
                 </div>

                 {/* Linked Guidelines Section */}
                 {note.diagnoses && note.diagnoses.length > 0 && (
                   <>
                     {note.linked_guidelines && note.linked_guidelines.length > 0 && (
                       <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                         <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                           <Check className="w-4 h-4" />
                           Automatically Linked Guidelines
                         </h4>
                         <div className="space-y-2">
                           {note.linked_guidelines.map((link, idx) => (
                             <div key={idx} className="flex items-start gap-2 text-sm">
                               <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                               <div>
                                 <p className="text-blue-900 font-medium">{link.condition}</p>
                                 <p className="text-xs text-blue-700">{link.adherence_notes}</p>
                               </div>
                             </div>
                           ))}
                         </div>
                       </div>
                     )}

                 {/* Clinical Guidelines */}
                 <div>
                   <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                     <Sparkles className="w-4 h-4 text-purple-600" />
                     Evidence-Based Guidelines
                   </h3>

                   {loadingGuidelines ? (
                     <div className="flex flex-col items-center justify-center py-8 text-center">
                       <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-3" />
                       <p className="text-sm font-medium text-slate-900">Fetching guidelines</p>
                       <p className="text-xs text-slate-500 mt-1">Analyzing diagnoses for relevant recommendations...</p>
                     </div>
                   ) : guidelineRecommendations.length > 0 ? (
                     <div className="space-y-4">
                       {guidelineRecommendations.map((rec, idx) => (
                         <div key={idx} className="bg-gradient-to-br from-slate-50 to-white rounded-xl border-2 border-slate-200 p-5 hover:border-purple-300 transition-all">
                           <div className="flex items-start justify-between mb-3">
                             <div className="flex-1">
                               <h4 className="font-bold text-slate-900 text-base mb-2">{rec.condition}</h4>
                               <p className="text-sm text-slate-600 leading-relaxed">{rec.summary}</p>
                             </div>
                           </div>

                           {/* Diagnostic Workup */}
                           {rec.diagnostic_workup && rec.diagnostic_workup.length > 0 && (
                             <div className="mt-4 bg-blue-50 rounded-lg border border-blue-200 p-4">
                               <h5 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                                 <Code className="w-4 h-4" />
                                 Diagnostic Workup
                               </h5>
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
                               <h5 className="text-sm font-bold text-green-900 mb-3 flex items-center gap-2">
                                 <Plus className="w-4 h-4" />
                                 Medications
                               </h5>
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
                               <h5 className="text-sm font-bold text-amber-900 mb-2">Key Recommendations</h5>
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
                               <h5 className="text-sm font-bold text-purple-900 mb-2">Monitoring & Follow-up</h5>
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

                           <div className="mt-4 pt-4 border-t border-slate-200">
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
                               className="gap-1.5 bg-purple-600 hover:bg-purple-700 text-white"
                             >
                               <Check className="w-3.5 h-3.5" /> Add to Plan
                             </Button>
                           </div>
                         </div>
                       ))}
                     </div>
                   ) : (
                     <p className="text-sm text-slate-500 text-center py-8">No guideline recommendations available</p>
                   )}
                 </div>

                 </>
                 ) : !note.diagnoses || note.diagnoses.length === 0 ? (
                 <p className="text-sm text-slate-500 text-center py-8">No diagnoses available. Add diagnoses to view guidelines and codes.</p>
                 ) : (
                 <p className="text-sm text-slate-500 text-center py-8">Finalize the note to generate guidelines and codes.</p>
                 )}
                 </TabsContent>

           {/* Metadata Tab */}
           <TabsContent value="metadata" className="p-6">
             <div className="space-y-6">
               <div className="grid md:grid-cols-2 gap-6">
                 <div className="space-y-3">
                   <div>
                     <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Patient Name</p>
                     <p className="text-base font-semibold text-slate-900">{note.patient_name}</p>
                   </div>
                   {note.patient_id && (
                     <div>
                       <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Patient ID / MRN</p>
                       <p className="text-base font-semibold text-slate-900">{note.patient_id}</p>
                     </div>
                   )}
                   {note.date_of_birth && (
                     <div>
                       <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Date of Birth</p>
                       <p className="text-base font-semibold text-slate-900">{format(new Date(note.date_of_birth), "MMMM d, yyyy")}</p>
                     </div>
                   )}
                 </div>

                 <div className="space-y-3">
                   {note.date_of_visit && (
                     <div>
                       <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Visit Date</p>
                       <p className="text-base font-semibold text-slate-900">{format(new Date(note.date_of_visit), "MMMM d, yyyy")}</p>
                     </div>
                   )}
                   {note.time_of_visit && (
                     <div>
                       <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Visit Time</p>
                       <p className="text-base font-semibold text-slate-900">{note.time_of_visit}</p>
                     </div>
                   )}
                   <div>
                     <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Note Status</p>
                     <Badge variant="outline" className={statusColors[note.status] || statusColors.draft}>
                       {note.status || "draft"}
                     </Badge>
                   </div>
                 </div>
               </div>

               <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-slate-200">
                 <div>
                   <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Note Type</p>
                   <p className="text-base font-semibold text-slate-900">{typeLabels[note.note_type] || "Note"}</p>
                 </div>
                 {note.specialty && (
                   <div>
                     <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Specialty</p>
                     <p className="text-base font-semibold text-slate-900">{note.specialty}</p>
                   </div>
                 )}
               </div>

               {note.chief_complaint && (
                 <div className="pt-6 border-t border-slate-200">
                   <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Chief Complaint</p>
                   <p className="text-sm text-slate-700 leading-relaxed">{note.chief_complaint}</p>
                 </div>
               )}

               <div className="pt-6 border-t border-slate-200">
                 <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Diagnoses</p>

                 {note.diagnoses && note.diagnoses.length > 0 ? (
                   <div className="space-y-3">
                     <div className="flex flex-wrap gap-2">
                       {note.diagnoses.map((diag, i) => (
                         <Badge key={i} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                           {diag}
                         </Badge>
                       ))}
                     </div>
                     {note.status === "finalized" && (
                       <ICD10CodeSearch
                         suggestions={icd10Suggestions}
                         diagnoses={note.diagnoses}
                         onAddDiagnoses={async (newDiagnoses) => {
                           const updatedDiagnoses = [...(note.diagnoses || []), ...newDiagnoses];
                           await base44.entities.ClinicalNote.update(noteId, { diagnoses: updatedDiagnoses });
                           queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                         }}
                       />
                     )}
                   </div>
                 ) : (
                   <div className="text-sm text-slate-500">No diagnoses added yet</div>
                 )}

                 {note.status === "finalized" && (!note.diagnoses || note.diagnoses.length === 0) && (
                   <ICD10CodeSearch
                     suggestions={icd10Suggestions}
                     diagnoses={note.diagnoses || []}
                     onAddDiagnoses={async (newDiagnoses) => {
                       await base44.entities.ClinicalNote.update(noteId, { diagnoses: newDiagnoses });
                       queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                     }}
                   />
                 )}
               </div>

               {note.created_date && (
                 <div className="pt-6 border-t border-slate-200 text-xs text-slate-500">
                   <p>Created: {format(new Date(note.created_date), "MMMM d, yyyy 'at' h:mm aaa")}</p>
                   {note.updated_date && (
                     <p>Last Updated: {format(new Date(note.updated_date), "MMMM d, yyyy 'at' h:mm aaa")}</p>
                   )}
                 </div>
               )}
             </div>
           </TabsContent>
         </Tabs>
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