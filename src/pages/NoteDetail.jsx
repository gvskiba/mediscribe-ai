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
        FileCode,
        Clock,
        AlertCircle,
        ImageIcon,
        Beaker,
        Activity,
        Pill
      } from "lucide-react";
      import MedicationRecommendations from "../components/notes/MedicationRecommendations";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { toast } from "sonner";
import StructuredNotePreview from "../components/notes/StructuredNotePreview";
import PatientSummary from "../components/notes/PatientSummary";
import EditableSummaryGenerator from "../components/notes/EditableSummaryGenerator";
import SmartGuidelinePanel from "../components/guidelines/SmartGuidelinePanel";
import CreateTemplateFromNote from "../components/templates/CreateTemplateFromNote";
import ICD10Suggestions from "../components/notes/ICD10Suggestions";
import ICD10CodeSearch from "../components/notes/ICD10CodeSearch";
import GuidelineReviewPrompt from "../components/notes/GuidelineReviewPrompt";
import NoteRevisionHistory from "../components/notes/NoteRevisionHistory";
import ImagingAnalysis from "../components/notes/ImagingAnalysis";
import LabsAnalysis from "../components/notes/LabsAnalysis";
import DiagnosisICD10Matcher from "../components/notes/DiagnosisICD10Matcher";
import DiagnosisRecommendations from "../components/notes/DiagnosisRecommendations";
import { useAutoSave } from "../components/utils/useAutoSave";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const TAB_ROWS = [
  [
    { id: 'summary', label: 'Summary', icon: Sparkles },
    { id: 'clinical', label: 'Clinical Note', icon: FileText },
    { id: 'assessment_plan', label: 'Assessment & Plan', icon: Activity },
    { id: 'treatments', label: 'Treatments', icon: Pill },
  ],
  [
    { id: 'diagnoses', label: 'Diagnoses', icon: Beaker },
    { id: 'guidelines', label: 'Guidelines & Codes', icon: Code },
    { id: 'imaging', label: 'Result Analysis', icon: ImageIcon },
    { id: 'finalize', label: 'Finalize Note', icon: Check },
  ]
];

const TAB_CONFIGS = TAB_ROWS.flat();

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
  const [drugInteractions, setDrugInteractions] = useState([]);
  const [loadingInteractions, setLoadingInteractions] = useState(false);
  const [followUpTests, setFollowUpTests] = useState([]);
  const [loadingFollowUp, setLoadingFollowUp] = useState(false);
  const [differentialDiagnosis, setDifferentialDiagnosis] = useState([]);
  const [loadingDifferential, setLoadingDifferential] = useState(false);
  const [exportingFormat, setExportingFormat] = useState(null);
  const [extractingData, setExtractingData] = useState(false);
  const [linkingGuidelines, setLinkingGuidelines] = useState(false);
  const [showGuidelinePrompt, setShowGuidelinePrompt] = useState(false);
  const [noteData, setNoteData] = useState(null);
  const [tabOrder, setTabOrder] = useState(() => {
    const saved = localStorage.getItem('noteDetailTabOrder');
    return saved ? JSON.parse(saved) : TAB_CONFIGS.map(t => t.id);
  });

  const handleDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination || source.index === destination.index) return;

    const newOrder = Array.from(tabOrder);
    const [removed] = newOrder.splice(source.index, 1);
    newOrder.splice(destination.index, 0, removed);

    setTabOrder(newOrder);
    localStorage.setItem('noteDetailTabOrder', JSON.stringify(newOrder));
  };

  const { data: note, isLoading } = useQuery({
    queryKey: ["note", noteId],
    queryFn: () => base44.entities.ClinicalNote.list().then(
      (notes) => notes.find((n) => n.id === noteId)
    ),
    enabled: !!noteId,
  });

  // Auto-save functionality
  const { isSaving } = useAutoSave({
    data: noteData || note,
    entityName: "ClinicalNote",
    entityId: noteId,
    onSave: async (data) => {
      if (noteId) {
        await base44.entities.ClinicalNote.update(noteId, data);
        // Create revision on auto-save
        const revisions = await base44.entities.NoteRevision.list();
        const noteRevisions = revisions.filter(r => r.note_id === noteId);
        const nextRevision = (noteRevisions.length || 0) + 1;
        await base44.entities.NoteRevision.create({
          note_id: noteId,
          revision_number: nextRevision,
          chief_complaint: data.chief_complaint,
          history_of_present_illness: data.history_of_present_illness,
          assessment: data.assessment,
          plan: data.plan,
          diagnoses: data.diagnoses,
          medications: data.medications,
          change_summary: "Auto-save",
          revision_date: new Date().toISOString(),
        });
      }
    },
    interval: 30000,
    enabled: note?.status === "draft",
  });

  const finalizeMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.ClinicalNote.update(noteId, { status: "finalized" });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["note", noteId] });
      // Wait for query to refetch updated note
      await new Promise(resolve => setTimeout(resolve, 500));
    },
    onError: (error) => {
      console.error("Finalization failed:", error);
      toast.error("Failed to finalize note");
    }
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
      if (!drugInteractions.length && !loadingInteractions && note.medications?.length > 0) {
        analyzeDrugInteractions();
      }
      if (!followUpTests.length && !loadingFollowUp && note.diagnoses?.length > 0) {
        suggestFollowUpTests();
      }
      if (!differentialDiagnosis.length && !loadingDifferential && note.chief_complaint) {
        generateDifferentialDiagnosis();
      }
    }
  }, [note?.id, note?.status, patientSummary, generatingSummary, icd10Suggestions.length, loadingIcd10, guidelineRecommendations.length, loadingGuidelines, drugInteractions.length, loadingInteractions, followUpTests.length, loadingFollowUp, differentialDiagnosis.length, loadingDifferential]);

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
        const validDiagnoses = note.diagnoses.filter(d => d && typeof d === 'string' && d.trim().length > 1);
        conditions.push(...validDiagnoses.slice(0, 3));
      }

      if (conditions.length === 0) {
        console.warn("No diagnoses available for guidelines");
        setLoadingGuidelines(false);
        return;
      }

      const recommendations = await Promise.all(
        conditions.slice(0, 2).map(async (condition) => {
          const cleanCondition = condition.replace(/\(.*?\)/g, "").trim();
          try {
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
          } catch (err) {
            console.error(`Failed to fetch guideline for ${cleanCondition}:`, err);
            return null;
          }
        })
      );

      const validRecommendations = recommendations.filter(r => r !== null);
      setGuidelineRecommendations(validRecommendations);
      
      if (validRecommendations.length === 0) {
        console.warn("No valid guideline recommendations returned");
      }
    } catch (error) {
      console.error("Failed to fetch guidelines:", error);
      toast.error("Failed to fetch guidelines");
    } finally {
      setLoadingGuidelines(false);
    }
  };

  const analyzeDrugInteractions = async () => {
    if (!note?.medications || note.medications.length === 0) return;
    setLoadingInteractions(true);

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze potential drug-drug interactions in this medication list. For each significant interaction, provide severity, mechanism, and clinical recommendation.

  MEDICATIONS:
  ${note.medications.join('\n')}

  Provide results as a JSON array with objects containing: drug_pair, severity (mild/moderate/severe), mechanism, recommendation.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            interactions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  drug_pair: { type: "string" },
                  severity: { type: "string", enum: ["mild", "moderate", "severe"] },
                  mechanism: { type: "string" },
                  recommendation: { type: "string" }
                }
              }
            }
          }
        }
      });

      setDrugInteractions(result.interactions || []);
    } catch (error) {
      console.error("Failed to analyze drug interactions:", error);
    } finally {
      setLoadingInteractions(false);
    }
  };

  const suggestFollowUpTests = async () => {
    if (!note?.diagnoses || note.diagnoses.length === 0) return;
    setLoadingFollowUp(true);

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on these diagnoses, suggest relevant follow-up tests, labs, imaging, or specialist consultations needed for comprehensive evaluation and management.

  DIAGNOSES:
  ${note.diagnoses.join('\n')}

  CURRENT ASSESSMENT:
  ${note.assessment || "N/A"}

  Provide results with: test_name, type (lab/imaging/consult), timing, clinical_rationale.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            follow_ups: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  test_name: { type: "string" },
                  type: { type: "string", enum: ["lab", "imaging", "consult", "other"] },
                  timing: { type: "string" },
                  clinical_rationale: { type: "string" }
                }
              }
            }
          }
        }
      });

      setFollowUpTests(result.follow_ups || []);
    } catch (error) {
      console.error("Failed to suggest follow-up tests:", error);
    } finally {
      setLoadingFollowUp(false);
    }
  };

  const generateDifferentialDiagnosis = async () => {
    if (!note?.chief_complaint) return;
    setLoadingDifferential(true);

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a comprehensive differential diagnosis list based on this clinical presentation. Rank by likelihood and provide reasoning for each.

  CHIEF COMPLAINT:
  ${note.chief_complaint}

  HISTORY OF PRESENT ILLNESS:
  ${note.history_of_present_illness || "N/A"}

  PHYSICAL EXAM:
  ${note.physical_exam || "N/A"}

  VITAL SIGNS & ASSESSMENT:
  ${note.assessment || "N/A"}

  Provide results with: diagnosis, likelihood_rank (1-5, 5 being most likely), clinical_reasoning, red_flags_to_monitor.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            differentials: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  diagnosis: { type: "string" },
                  likelihood_rank: { type: "number", minimum: 1, maximum: 5 },
                  clinical_reasoning: { type: "string" },
                  red_flags_to_monitor: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      });

      const sorted = (result.differentials || []).sort((a, b) => b.likelihood_rank - a.likelihood_rank);
      setDifferentialDiagnosis(sorted);
    } catch (error) {
      console.error("Failed to generate differential diagnosis:", error);
    } finally {
      setLoadingDifferential(false);
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
        prompt: `Extract key medical information from this clinical note. Be thorough and accurate.

CLINICAL NOTE:
${note.raw_note}

Extract and return the following fields:
1. chief_complaint: The primary reason for visit (string)
2. diagnoses: ALL diagnoses, suspected conditions, and clinical impressions from the note (array of strings). If chief complaint or assessment suggests a condition, include it.
3. medications: All medications mentioned with dosages and frequency (array of strings)
4. allergies: All drug and environmental allergies (array of strings)
5. medical_history: Significant past medical history items (string)
6. review_of_systems: Key ROS findings (string)
7. physical_exam: Important physical exam findings (string)

CRITICAL: The diagnoses field MUST always contain at least one entry. If no diagnosis is explicitly stated, infer from the chief complaint and clinical presentation.`,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            chief_complaint: { type: "string" },
            diagnoses: { 
              type: "array", 
              items: { type: "string" },
              description: "ALL diagnoses, suspected conditions, and impressions" 
            },
            medications: { type: "array", items: { type: "string" } },
            allergies: { type: "array", items: { type: "string" } },
            medical_history: { type: "string" },
            review_of_systems: { type: "string" },
            physical_exam: { type: "string" }
          },
          required: ["chief_complaint", "diagnoses"]
        }
      });

      console.log("Extracted data:", result);
      console.log("Diagnoses from LLM:", result.diagnoses, "Type:", Array.isArray(result.diagnoses));

      // Update note with extracted data
      const updateData = {};

      // Filter diagnoses to only include ICD-10 coded ones (format: CODE - Description)
            if (result.diagnoses) {
        const diagnosisArray = Array.isArray(result.diagnoses) ? result.diagnoses : [result.diagnoses];
        const filteredDiagnoses = diagnosisArray.filter(d => 
          d && typeof d === 'string' && /^[A-Z0-9]{1,}.*-/.test(d.trim())
        );
        if (filteredDiagnoses.length > 0) {
          updateData.diagnoses = filteredDiagnoses;
        }
      }
      if (result.chief_complaint) updateData.chief_complaint = result.chief_complaint;
      if (result.medications?.length > 0) updateData.medications = result.medications;
      if (result.allergies?.length > 0) updateData.allergies = result.allergies;
      if (result.medical_history) updateData.medical_history = result.medical_history;
      if (result.review_of_systems) updateData.review_of_systems = result.review_of_systems;
      if (result.physical_exam) updateData.physical_exam = result.physical_exam;

      if (Object.keys(updateData).length > 0) {
        console.log("Updating note with:", updateData);
        await base44.entities.ClinicalNote.update(noteId, updateData);
        queryClient.invalidateQueries({ queryKey: ["note", noteId] });
        toast.success("Data extracted and note updated");
      }
    } catch (error) {
      console.error("Failed to extract data:", error);
      toast.error("Failed to extract data from note");
    } finally {
      setExtractingData(false);
    }
  };

  const downloadResultsAnalysis = (format) => {
    // This would ideally pull imaging and labs data, but since they're in separate components,
    // we'll provide a template for the user to add their specific data
    const content = `RESULT ANALYSIS REPORT
  Patient: ${note.patient_name}
  Date: ${note.date_of_visit ? format(new Date(note.date_of_visit), "MMMM d, yyyy") : "N/A"}
  ${note.patient_id ? `MRN: ${note.patient_id}` : ""}

  IMAGING ANALYSIS
  [Imaging results will be populated here based on uploaded files]

  LABORATORY ANALYSIS
  [Lab results will be populated here based on uploaded data]

  Generated: ${new Date().toLocaleString()}
    `.trim();

    if (format === 'pdf') {
      // For PDF, we'd need jsPDF - using text export for now
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${note.patient_name}_ResultsAnalysis_${new Date().toISOString().split("T")[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } else {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${note.patient_name}_ResultsAnalysis_${new Date().toISOString().split("T")[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
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
        className="bg-white rounded-2xl border border-slate-200 p-6"
      >
        {/* Patient Info */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-3xl font-bold text-slate-900">{note.patient_name}</h1>
            <Badge variant="outline" className={statusColors[note.status] || statusColors.draft}>
              {note.status || "draft"}
            </Badge>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 text-sm text-slate-600">
            {note.patient_id && (
              <span className="flex items-center gap-2"><Hash className="w-4 h-4 text-slate-400" /> {note.patient_id}</span>
            )}
            {note.date_of_visit && (
              <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-400" /> {format(new Date(note.date_of_visit), "MMM d, yyyy")}</span>
            )}
            {note.note_type && (
              <span className="flex items-center gap-2"><FileText className="w-4 h-4 text-slate-400" /> {typeLabels[note.note_type]}</span>
            )}
            {note.specialty && (
              <span className="text-slate-600">{note.specialty}</span>
            )}
          </div>
        </div>

        {/* Auto-save Status */}
        {note?.status === "draft" && (
          <div className="mb-6 flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-xs font-medium text-blue-700 w-fit">
            <Clock className="w-3 h-3 animate-pulse" />
            {isSaving ? "Saving..." : "Auto-saving..."}
          </div>
        )}

        {/* Quick Actions */}
        <div className="border-t border-slate-200 pt-6 flex gap-3">
          <Link to={createPageUrl("NewNote")} className="flex-1">
            <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl gap-2 shadow-lg shadow-blue-500/30 font-semibold transition-all">
              <Plus className="w-4 h-4" /> New Note
            </Button>
          </Link>
          <Link to={createPageUrl("NotesLibrary")} className="flex-1">
            <Button variant="outline" className="w-full rounded-xl gap-2 border-slate-300 hover:bg-slate-50">
              <FileText className="w-4 h-4" /> All Notes
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Tabbed Interface */}
       <motion.div
         initial={{ opacity: 0, y: 12 }}
         animate={{ opacity: 1, y: 0 }}
         className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
       >
         <Tabs defaultValue="summary" className="w-full">
           <div className="bg-white border-b-2 border-slate-200">
             <style>{`
               .flag-tab {
                 position: relative;
                 clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%);
               }
               .flag-tab-active {
                 clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%);
               }
             `}</style>
             <DragDropContext onDragEnd={handleDragEnd}>
               {TAB_ROWS.map((rowTabs, rowIndex) => (
                 <Droppable key={`row-${rowIndex}`} droppableId={`tabs-row-${rowIndex}`} direction="horizontal">
                   {(provided) => (
                     <div className={`${rowIndex > 0 ? 'border-t border-slate-100' : ''}`}>
                       <TabsList 
                         className="w-full h-auto justify-between bg-transparent rounded-none px-6 py-3 gap-1 overflow-x-auto scrollbar-hide border-0"
                         ref={provided.innerRef}
                         {...provided.droppableProps}
                       >
                         {rowTabs.map((tab, index) => {
                           const Icon = tab.icon;
                           return (
                             <Draggable key={tab.id} draggableId={tab.id} index={index}>
                               {(provided, snapshot) => (
                                 <div
                                   ref={provided.innerRef}
                                   {...provided.draggableProps}
                                   {...provided.dragHandleProps}
                                   className={snapshot.isDragging ? 'opacity-50 z-50' : ''}
                                 >
                                   <TabsTrigger 
                                     value={tab.id} 
                                     className="flag-tab whitespace-nowrap px-6 py-3 gap-2.5 font-semibold text-sm data-[state=active]:flag-tab-active data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=inactive]:bg-slate-100 data-[state=inactive]:text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition-all duration-200 cursor-grab active:cursor-grabbing border-0 rounded-none flex-shrink-0 mr-2"
                                   >
                                     {Icon && <Icon className="w-4 h-4" />}
                                     <span>{tab.label}</span>
                                   </TabsTrigger>
                                 </div>
                               )}
                             </Draggable>
                           );
                         })}
                         {provided.placeholder}
                       </TabsList>
                     </div>
                   )}
                 </Droppable>
               ))}
             </DragDropContext>
           </div>

           {/* Summary Tab */}
           <TabsContent value="summary" className="p-6 space-y-4">
             {note.status === "draft" && (
               <div className="flex gap-3 mb-4">
                 <Button
                   onClick={() => finalizeMutation.mutate()}
                   className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-xl gap-2 shadow-lg shadow-emerald-500/30 font-semibold"
                 >
                   <Check className="w-4 h-4" /> Finalize Note
                 </Button>
                 <Button
                   onClick={extractStructuredData}
                   disabled={extractingData}
                   variant="outline"
                   className="flex-1 rounded-xl gap-2 border-emerald-300 hover:bg-emerald-50 disabled:opacity-50"
                 >
                   {extractingData ? (
                     <><Loader2 className="w-4 h-4 animate-spin" /> Extracting...</>
                   ) : (
                     <><Sparkles className="w-4 h-4" /> Extract Data</>
                   )}
                 </Button>
               </div>
             )}
             {note.status === "draft" ? (
               <EditableSummaryGenerator
                 note={note}
                 onSave={async (finalSummary) => {
                   await base44.entities.ClinicalNote.update(noteId, { summary: finalSummary });
                   queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                 }}
                 onCancel={() => {}}
               />
             ) : (
               <>
                 {note.status === "finalized" && (
                   <div className="flex gap-3 mb-4">
                     <NoteRevisionHistory
                       noteId={noteId}
                       onRestore={(revision) => {
                         const restoredData = {
                           chief_complaint: revision.chief_complaint,
                           history_of_present_illness: revision.history_of_present_illness,
                           assessment: revision.assessment,
                           plan: revision.plan,
                           diagnoses: revision.diagnoses,
                           medications: revision.medications,
                         };
                         setNoteData(restoredData);
                         queryClient.setQueryData(["note", noteId], (old) => ({
                           ...old,
                           ...restoredData,
                         }));
                       }}
                     />
                     {patientSummary && (
                       <Button
                         variant="outline"
                         onClick={generateSummary}
                         disabled={generatingSummary}
                         className="flex-1 rounded-xl gap-2 border-cyan-300 hover:bg-cyan-50 disabled:opacity-50"
                       >
                         {generatingSummary ? (
                           <><Loader2 className="w-4 h-4 animate-spin" /> Regenerating...</>
                         ) : (
                           <><Sparkles className="w-4 h-4" /> Regenerate</>
                         )}
                       </Button>
                     )}
                   </div>
                 )}
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
               </>
             )}
             </TabsContent>

           {/* Clinical Note Tab */}
           <TabsContent value="clinical" className="p-6">
             {/* Action Buttons */}
             {note.status === "draft" && (
               <div className="flex gap-3 mb-6">
                 <Button
                   onClick={() => finalizeMutation.mutate()}
                   className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-xl gap-2 shadow-lg shadow-emerald-500/30 font-semibold"
                 >
                   <Check className="w-4 h-4" /> Finalize Note
                 </Button>
                 <Button
                   onClick={extractStructuredData}
                   disabled={extractingData}
                   variant="outline"
                   className="flex-1 rounded-xl gap-2 border-emerald-300 hover:bg-emerald-50 disabled:opacity-50"
                 >
                   {extractingData ? (
                     <><Loader2 className="w-4 h-4 animate-spin" /> Extracting...</>
                   ) : (
                     <><Sparkles className="w-4 h-4" /> Extract Data</>
                   )}
                 </Button>
               </div>
             )}
             {note.status === "finalized" && (
               <div className="flex gap-3 mb-6">
                 <Button
                   variant="outline"
                   onClick={() => exportNote('pdf')}
                   disabled={exportingFormat === 'pdf'}
                   className="flex-1 rounded-xl gap-2 border-blue-300 hover:bg-blue-50 disabled:opacity-50"
                 >
                   {exportingFormat === 'pdf' ? (
                     <Loader2 className="w-4 h-4 animate-spin" />
                   ) : (
                     <Download className="w-4 h-4" />
                   )}
                   Export PDF
                 </Button>
                 <Button
                   variant="outline"
                   onClick={() => exportNote('text')}
                   disabled={exportingFormat === 'text'}
                   className="flex-1 rounded-xl gap-2 border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                 >
                   {exportingFormat === 'text' ? (
                     <Loader2 className="w-4 h-4 animate-spin" />
                   ) : (
                     <Download className="w-4 h-4" />
                   )}
                   Export Text
                 </Button>
                 <Button
                   variant="outline"
                   onClick={() => setTemplateDialogOpen(true)}
                   className="flex-1 rounded-xl gap-2 border-purple-300 text-purple-700 hover:bg-purple-50"
                 >
                   <Sparkles className="w-4 h-4" /> Save as Template
                 </Button>
               </div>
             )}
             <StructuredNotePreview 
               note={note} 
               onUpdate={(field, value) => {
                 queryClient.setQueryData(["note", noteId], (old) => ({
                   ...old,
                   [field]: value
                 }));
               }}
               onReanalyze={async (field) => {
                 if (!note?.raw_note) return null;

                 const fieldPrompts = {
                   chief_complaint: `Extract the chief complaint from this clinical note: ${note.raw_note}`,
                   history_of_present_illness: `Extract the history of present illness with OLDCARTS elements from this clinical note: ${note.raw_note}`,
                   medical_history: `Extract the relevant medical history from this clinical note: ${note.raw_note}`,
                   review_of_systems: `Extract the review of systems from this clinical note: ${note.raw_note}`,
                   physical_exam: `Extract the physical examination findings from this clinical note: ${note.raw_note}`,
                   assessment: `Extract the assessment from this clinical note: ${note.raw_note}`,
                   plan: `Extract the treatment plan from this clinical note: ${note.raw_note}`,
                   clinical_impression: `Extract the clinical impression from this clinical note: ${note.raw_note}`,
                 };

                 try {
                   const result = await base44.integrations.Core.InvokeLLM({
                     prompt: fieldPrompts[field] || `Reanalyze this field in the clinical note: ${note.raw_note}`,
                     add_context_from_internet: false
                   });

                   queryClient.setQueryData(["note", noteId], (old) => ({
                     ...old,
                     [field]: result
                   }));

                   return result;
                 } catch (error) {
                   console.error(`Failed to reanalyze ${field}:`, error);
                   return null;
                 }
               }}
               guidelineRecommendations={guidelineRecommendations}
               loadingGuidelines={loadingGuidelines}
               medicationRecommendations={[]}
               loadingMedications={false}
             />
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
                 {/* ICD-10 Code Matcher - Direct Search & Selection */}
                 <div className="border-2 border-blue-300 bg-blue-50 rounded-xl p-5">
                   <h3 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                     <Sparkles className="w-4 h-4" />
                     Smart ICD-10 Code Mapper
                   </h3>
                   <p className="text-xs text-blue-800 mb-4">Select diagnoses to generate ranked ICD-10 codes with clinical reasoning</p>
                   <DiagnosisICD10Matcher
                     diagnoses={note.diagnoses || []}
                     onCodesGenerated={async (codes) => {
                       // Codes generated in the component
                     }}
                   />
                 </div>
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
                       readOnly={false}
                       onApplyToNote={async (codes) => {
                         try {
                           const newDiagnoses = codes.map(c => `${c.code} - ${c.description}`);
                           const updatedDiagnoses = [...(note.diagnoses || []), ...newDiagnoses];
                           await base44.entities.ClinicalNote.update(noteId, { diagnoses: updatedDiagnoses });
                           queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                           toast.success(`Added ${newDiagnoses.length} diagnosis code(s)`);
                         } catch (error) {
                           console.error("Failed to add diagnoses:", error);
                           toast.error("Failed to add diagnoses. Please try again.");
                         }
                       }}
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

                 {/* Drug-Drug Interactions */}
                 <div>
                   <div className="flex items-center justify-between mb-4">
                     <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                       <AlertCircle className="w-4 h-4 text-red-600" />
                       Drug-Drug Interactions
                     </h3>
                   </div>

                   {loadingInteractions ? (
                     <div className="flex items-center gap-3 text-slate-500 py-8">
                       <Loader2 className="w-5 h-5 animate-spin" />
                       <span className="text-sm">Analyzing medications...</span>
                     </div>
                   ) : drugInteractions.length > 0 ? (
                     <div className="space-y-3">
                       {drugInteractions.map((interaction, idx) => (
                         <div key={idx} className={`rounded-lg border p-4 ${
                           interaction.severity === 'severe' ? 'bg-red-50 border-red-200' :
                           interaction.severity === 'moderate' ? 'bg-yellow-50 border-yellow-200' :
                           'bg-blue-50 border-blue-200'
                         }`}>
                           <p className="font-semibold text-sm text-slate-900">{interaction.drug_pair}</p>
                           <p className={`text-xs font-medium mt-1 ${
                             interaction.severity === 'severe' ? 'text-red-700' :
                             interaction.severity === 'moderate' ? 'text-yellow-700' :
                             'text-blue-700'
                           }`}>Severity: {interaction.severity.toUpperCase()}</p>
                           <p className="text-xs text-slate-600 mt-2"><strong>Mechanism:</strong> {interaction.mechanism}</p>
                           <p className="text-xs text-slate-600 mt-1"><strong>Recommendation:</strong> {interaction.recommendation}</p>
                         </div>
                       ))}
                     </div>
                   ) : (
                     <p className="text-sm text-slate-500 text-center py-8">No significant drug-drug interactions detected</p>
                   )}
                 </div>

                 {/* Differential Diagnosis */}
                 <div>
                   <div className="flex items-center justify-between mb-4">
                     <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                       <Sparkles className="w-4 h-4 text-indigo-600" />
                       Differential Diagnosis
                     </h3>
                   </div>

                   {loadingDifferential ? (
                     <div className="flex items-center gap-3 text-slate-500 py-8">
                       <Loader2 className="w-5 h-5 animate-spin" />
                       <span className="text-sm">Generating differential...</span>
                     </div>
                   ) : differentialDiagnosis.length > 0 ? (
                     <div className="space-y-3">
                       {differentialDiagnosis.map((diff, idx) => (
                         <div key={idx} className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                           <div className="flex items-start justify-between">
                             <div className="flex-1">
                               <p className="font-semibold text-sm text-slate-900">{diff.diagnosis}</p>
                               <div className="mt-2 flex items-center gap-2">
                                 <span className="text-xs font-medium text-indigo-700">Likelihood:</span>
                                 <div className="w-24 h-2 bg-indigo-200 rounded-full overflow-hidden">
                                   <div className="h-full bg-indigo-600" style={{ width: `${(diff.likelihood_rank / 5) * 100}%` }} />
                                 </div>
                                 <span className="text-xs text-indigo-700 font-bold">{diff.likelihood_rank}/5</span>
                               </div>
                             </div>
                           </div>
                           <p className="text-xs text-slate-600 mt-3"><strong>Reasoning:</strong> {diff.clinical_reasoning}</p>
                           {diff.red_flags_to_monitor?.length > 0 && (
                             <div className="mt-2">
                               <p className="text-xs font-semibold text-red-700 mb-1">Red Flags to Monitor:</p>
                               <ul className="space-y-1">
                                 {diff.red_flags_to_monitor.map((flag, i) => (
                                   <li key={i} className="text-xs text-slate-600 flex gap-2">
                                     <span>•</span>
                                     <span>{flag}</span>
                                   </li>
                                 ))}
                               </ul>
                             </div>
                           )}
                         </div>
                       ))}
                     </div>
                   ) : (
                     <p className="text-sm text-slate-500 text-center py-8">No differential diagnosis generated</p>
                   )}
                 </div>

                 {/* Follow-up Tests */}
                 <div>
                   <div className="flex items-center justify-between mb-4">
                     <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                       <Beaker className="w-4 h-4 text-emerald-600" />
                       Suggested Follow-up Tests & Consultations
                     </h3>
                   </div>

                   {loadingFollowUp ? (
                     <div className="flex items-center gap-3 text-slate-500 py-8">
                       <Loader2 className="w-5 h-5 animate-spin" />
                       <span className="text-sm">Generating suggestions...</span>
                     </div>
                   ) : followUpTests.length > 0 ? (
                     <div className="space-y-3">
                       {followUpTests.map((test, idx) => (
                         <div key={idx} className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                           <p className="font-semibold text-sm text-slate-900">{test.test_name}</p>
                           <div className="mt-2 flex gap-4 flex-wrap">
                             <span className={`text-xs px-2 py-1 rounded font-medium ${
                               test.type === 'lab' ? 'bg-blue-100 text-blue-700' :
                               test.type === 'imaging' ? 'bg-purple-100 text-purple-700' :
                               test.type === 'consult' ? 'bg-orange-100 text-orange-700' :
                               'bg-slate-100 text-slate-700'
                             }`}>{test.type.charAt(0).toUpperCase() + test.type.slice(1)}</span>
                             <span className="text-xs text-slate-600"><strong>Timing:</strong> {test.timing}</span>
                           </div>
                           <p className="text-xs text-slate-600 mt-3">{test.clinical_rationale}</p>
                         </div>
                       ))}
                     </div>
                   ) : (
                     <p className="text-sm text-slate-500 text-center py-8">No follow-up tests suggested</p>
                   )}
                 </div>

                 {/* Clinical Guidelines */}
                 <div>
                   <div className="flex items-center justify-between mb-4">
                     <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                       <Sparkles className="w-4 h-4 text-purple-600" />
                       Evidence-Based Guidelines
                     </h3>
                     {!loadingGuidelines && guidelineRecommendations.length > 0 && (
                       <Button
                         size="sm"
                         variant="ghost"
                         onClick={fetchGuidelineRecommendations}
                         className="text-xs text-purple-600 hover:bg-purple-50 h-6"
                       >
                         Refresh
                       </Button>
                     )}
                   </div>

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
                                 try {
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
                                   await queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                                   toast.success("Guideline added to plan");
                                   } catch (error) {
                                   console.error("Failed to add to plan:", error);
                                   toast.error("Failed to add to plan. Please try again.");
                                   }
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
                 ) : (
                 <p className="text-sm text-slate-500 text-center py-8">Finalize the note to view guidelines and ICD-10 codes.</p>
                 )}
                 </TabsContent>

                 {/* Result Analysis Tab */}
                 <TabsContent value="imaging" className="p-6 space-y-6">
                   <div className="flex gap-3">
                     <Button
                       variant="outline"
                       onClick={() => downloadResultsAnalysis('pdf')}
                       className="flex-1 rounded-xl gap-2 border-blue-300 hover:bg-blue-50"
                     >
                       <Download className="w-4 h-4" />
                       Download PDF
                     </Button>
                     <Button
                       variant="outline"
                       onClick={() => downloadResultsAnalysis('text')}
                       className="flex-1 rounded-xl gap-2 border-slate-300 hover:bg-slate-50"
                     >
                       <Download className="w-4 h-4" />
                       Download Text
                     </Button>
                   </div>
                   <div className="space-y-6">
                     {/* Left Column - Imaging Analysis */}
                     <div>
                       <ImagingAnalysis
                         noteId={noteId}
                         onAddToNote={async (imagingText, linkedFindings) => {
                           try {
                             const updates = {};
                             updates.assessment = (note.assessment || "") + imagingText;

                             if (linkedFindings && Object.keys(linkedFindings).length > 0) {
                               Object.entries(linkedFindings).forEach(([findingKey, sections]) => {
                                 sections.forEach((sectionId) => {
                                   const fieldMap = {
                                     assessment: "assessment",
                                     plan: "plan",
                                     history_of_present_illness: "history_of_present_illness",
                                   };

                                   if (fieldMap[sectionId]) {
                                     const sectionText = `\n\n[Imaging Finding] ${imagingText.split("\n")[0]}`;
                                     updates[fieldMap[sectionId]] =
                                       (updates[fieldMap[sectionId]] || note[fieldMap[sectionId]] || "") +
                                       sectionText;
                                   }
                                 });
                               });
                             }

                             await base44.entities.ClinicalNote.update(noteId, updates);
                               queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                               toast.success("Imaging summary added to clinical note");
                           } catch (error) {
                             console.error("Failed to add imaging to note:", error);
                             alert("Failed to add imaging. Please try again.");
                           }
                         }}
                       />
                     </div>

                     {/* Right Column - Laboratory Analysis */}
                     <div>
                       <LabsAnalysis
                         noteId={noteId}
                         onAddToNote={async (labsText) => {
                           try {
                             const updatedAssessment = (note.assessment || "") + labsText;
                             await base44.entities.ClinicalNote.update(noteId, { 
                               assessment: updatedAssessment
                             });
                             queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                             toast.success("Lab summary added to clinical note");
                           } catch (error) {
                             console.error("Failed to add labs to note:", error);
                             alert("Failed to add labs. Please try again.");
                           }
                         }}
                       />
                     </div>
                   </div>
                 </TabsContent>



                 {/* Assessment & Plan Tab */}
                 <TabsContent value="assessment_plan" className="p-6 space-y-6">
                   <div className="bg-white rounded-xl border-2 border-purple-300 shadow-sm overflow-hidden">
                     <div className="bg-purple-50 px-4 py-3 border-b border-purple-200 flex items-center gap-2">
                       <Activity className="w-5 h-5 text-purple-600" />
                       <h3 className="font-semibold text-slate-900">Assessment</h3>
                     </div>
                     <div className="p-4">
                       {note.assessment ? (
                         <div className="prose prose-sm max-w-none text-slate-700">
                           {note.assessment.split('\n').map((para, i) => (
                             <p key={i} className="mb-3 leading-relaxed">{para}</p>
                           ))}
                         </div>
                       ) : (
                         <p className="text-sm text-slate-500 italic">No assessment documented</p>
                       )}
                     </div>
                   </div>

                   <div className="bg-white rounded-xl border-2 border-green-300 shadow-sm overflow-hidden">
                     <div className="bg-green-50 px-4 py-3 border-b border-green-200 flex items-center gap-2">
                       <FileText className="w-5 h-5 text-green-600" />
                       <h3 className="font-semibold text-slate-900">Plan</h3>
                     </div>
                     <div className="p-4">
                       {note.plan ? (
                         <div className="prose prose-sm max-w-none text-slate-700">
                           {note.plan.split('\n').map((para, i) => (
                             <p key={i} className="mb-3 leading-relaxed">{para}</p>
                           ))}
                         </div>
                       ) : (
                         <p className="text-sm text-slate-500 italic">No plan documented</p>
                       )}
                     </div>
                   </div>
                 </TabsContent>

                 {/* Treatments Tab */}
                 <TabsContent value="treatments" className="p-6 space-y-6">
                   <div className="space-y-6">
                     {/* Medications Box */}
                     <div className="bg-white rounded-xl border-2 border-rose-300 shadow-sm overflow-hidden">
                       <div className="bg-rose-50 px-4 py-3 border-b border-rose-200 flex items-center gap-2">
                         <Pill className="w-5 h-5 text-rose-600" />
                         <h3 className="font-semibold text-slate-900">Medications</h3>
                       </div>
                       <div className="p-4 space-y-4">
                         <MedicationRecommendations
                           note={note}
                           onAddMedications={async (meds) => {
                             const updatedMeds = [...(note.medications || []), ...meds];
                             await base44.entities.ClinicalNote.update(noteId, { medications: updatedMeds });
                             queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                           }}
                         />
                         <div className="border-t border-slate-200 pt-4">
                           {note.medications && note.medications.length > 0 ? (
                             <div className="space-y-2">
                               {note.medications.map((med, idx) => (
                                 <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                                   <p className="text-sm text-slate-900">{med}</p>
                                 </div>
                               ))}
                             </div>
                           ) : (
                             <div className="bg-slate-50 border border-dashed border-slate-300 rounded-lg p-6 text-center">
                               <Pill className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                               <p className="text-sm text-slate-500">No medications documented</p>
                             </div>
                           )}
                         </div>
                       </div>
                     </div>

                     {note.status === "finalized" && note.medications && note.medications.length > 0 && (
                       <>
                         {/* Drug Interactions */}
                         <div>
                           <div className="flex items-center justify-between mb-4">
                             <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                               <AlertCircle className="w-4 h-4 text-red-600" />
                               Drug-Drug Interactions
                             </h3>
                           </div>

                           {loadingInteractions ? (
                             <div className="flex items-center gap-3 text-slate-500 py-8">
                               <Loader2 className="w-5 h-5 animate-spin" />
                               <span className="text-sm">Analyzing medications...</span>
                             </div>
                           ) : drugInteractions.length > 0 ? (
                             <div className="space-y-3">
                               {drugInteractions.map((interaction, idx) => (
                                 <div key={idx} className={`rounded-lg border p-4 ${
                                   interaction.severity === 'severe' ? 'bg-red-50 border-red-200' :
                                   interaction.severity === 'moderate' ? 'bg-yellow-50 border-yellow-200' :
                                   'bg-blue-50 border-blue-200'
                                 }`}>
                                   <p className="font-semibold text-sm text-slate-900">{interaction.drug_pair}</p>
                                   <p className={`text-xs font-medium mt-1 ${
                                     interaction.severity === 'severe' ? 'text-red-700' :
                                     interaction.severity === 'moderate' ? 'text-yellow-700' :
                                     'text-blue-700'
                                   }`}>Severity: {interaction.severity.toUpperCase()}</p>
                                   <p className="text-xs text-slate-600 mt-2"><strong>Mechanism:</strong> {interaction.mechanism}</p>
                                   <p className="text-xs text-slate-600 mt-1"><strong>Recommendation:</strong> {interaction.recommendation}</p>
                                 </div>
                               ))}
                             </div>
                           ) : (
                             <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 text-center">
                               <Check className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                               <p className="text-sm text-emerald-700 font-medium">No significant drug interactions detected</p>
                             </div>
                           )}
                         </div>

                         {/* Treatment Plan from Plan Section */}
                         {note.plan && (
                           <div>
                             <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                               <Activity className="w-4 h-4 text-green-600" />
                               Treatment Plan
                             </h3>
                             <div className="bg-white border-2 border-green-200 rounded-xl p-5">
                               <div className="prose prose-sm max-w-none text-slate-700">
                                 {note.plan.split('\n').map((para, i) => (
                                   <p key={i} className="mb-3 leading-relaxed">{para}</p>
                                 ))}
                               </div>
                             </div>
                           </div>
                         )}
                       </>
                     )}
                   </div>
                 </TabsContent>

                 {/* Finalize Note Tab */}
                 <TabsContent value="finalize" className="p-6 space-y-6">
                   <div className="max-w-2xl mx-auto">
                     <div className="text-center mb-8">
                       <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                         <Check className="w-8 h-8 text-emerald-600" />
                       </div>
                       <h2 className="text-2xl font-bold text-slate-900 mb-2">Finalize Clinical Note</h2>
                       <p className="text-slate-600">Review and finalize your clinical documentation</p>
                     </div>

                     {note.status === "draft" ? (
                       <div className="space-y-6">
                         <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                           <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                             <AlertCircle className="w-5 h-5 text-blue-600" />
                             Before Finalizing
                           </h3>
                           <ul className="space-y-3 text-sm text-slate-700">
                             <li className="flex items-start gap-2">
                               <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                               <span>Review all clinical sections for accuracy and completeness</span>
                             </li>
                             <li className="flex items-start gap-2">
                               <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                               <span>Verify patient demographics and visit information</span>
                             </li>
                             <li className="flex items-start gap-2">
                               <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                               <span>Confirm diagnoses and ICD-10 codes are accurate</span>
                             </li>
                             <li className="flex items-start gap-2">
                               <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                               <span>Review assessment and treatment plan</span>
                             </li>
                             <li className="flex items-start gap-2">
                               <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                               <span>Ensure all required fields are complete</span>
                             </li>
                           </ul>
                         </div>

                         <div className="bg-white border-2 border-slate-200 rounded-xl p-6">
                           <h3 className="font-semibold text-slate-900 mb-4">Note Status</h3>
                           <div className="grid grid-cols-2 gap-4 mb-6">
                             <div>
                               <p className="text-xs text-slate-500 mb-1">Current Status</p>
                               <Badge className="bg-amber-100 text-amber-700 border-amber-300">Draft</Badge>
                             </div>
                             <div>
                               <p className="text-xs text-slate-500 mb-1">Last Modified</p>
                               <p className="text-sm text-slate-900">{note.updated_date ? format(new Date(note.updated_date), "MMM d, h:mm a") : "N/A"}</p>
                             </div>
                           </div>

                           <Button
                             onClick={() => finalizeMutation.mutate()}
                             disabled={finalizeMutation.isPending}
                             className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-xl gap-2 shadow-lg shadow-emerald-500/30 font-semibold py-6 text-base"
                           >
                             {finalizeMutation.isPending ? (
                               <><Loader2 className="w-5 h-5 animate-spin" /> Finalizing Note...</>
                             ) : (
                               <><Check className="w-5 h-5" /> Finalize Note</>
                             )}
                           </Button>
                           <p className="text-xs text-slate-500 text-center mt-3">
                             Once finalized, this note will be locked and timestamped
                           </p>
                         </div>
                       </div>
                     ) : (
                       <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-8 text-center">
                         <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                           <Check className="w-10 h-10 text-emerald-600" />
                         </div>
                         <h3 className="text-xl font-bold text-slate-900 mb-2">Note Finalized</h3>
                         <p className="text-slate-700 mb-4">
                           This note was finalized on {note.updated_date ? format(new Date(note.updated_date), "MMMM d, yyyy 'at' h:mm a") : "N/A"}
                         </p>
                         <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 text-sm px-4 py-1">
                           {note.status}
                         </Badge>
                       </div>
                     )}
                   </div>
                 </TabsContent>

                 {/* Diagnoses Tab */}
                 <TabsContent value="diagnoses" className="p-6">
             <div className="flex gap-3 mb-6">
               <Button
                 variant="outline"
                 onClick={() => setTemplateDialogOpen(true)}
                 className="flex-1 rounded-xl gap-2 border-purple-300 text-purple-700 hover:bg-purple-50"
               >
                 <Sparkles className="w-4 h-4" /> Save as Template
               </Button>
               <Button
                 variant="outline"
                 onClick={() => exportNote('pdf')}
                 disabled={exportingFormat === 'pdf'}
                 className="flex-1 rounded-xl gap-2 border-blue-300 hover:bg-blue-50 disabled:opacity-50"
               >
                 {exportingFormat === 'pdf' ? (
                   <Loader2 className="w-4 h-4 animate-spin" />
                 ) : (
                   <Download className="w-4 h-4" />
                 )}
                 Export PDF
               </Button>
               <Button
                 variant="outline"
                 onClick={() => exportNote('text')}
                 disabled={exportingFormat === 'text'}
                 className="flex-1 rounded-xl gap-2 border-slate-300 hover:bg-slate-50 disabled:opacity-50"
               >
                 {exportingFormat === 'text' ? (
                   <Loader2 className="w-4 h-4 animate-spin" />
                 ) : (
                   <Download className="w-4 h-4" />
                 )}
                 Export Text
               </Button>
             </div>
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

               {note.status === "finalized" && (
                 <div className="pt-6 border-t border-slate-200">
                   <DiagnosisRecommendations
                     note={note}
                     onAddDiagnoses={async (newDiagnoses) => {
                       const updatedDiagnoses = [...(note.diagnoses || []), ...newDiagnoses];
                       await base44.entities.ClinicalNote.update(noteId, { diagnoses: updatedDiagnoses });
                       queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                     }}
                   />
                 </div>
               )}

               <div className="pt-6 border-t border-slate-200">
                 <div className="flex items-center justify-between mb-5">
                   <div>
                     <h3 className="text-sm font-bold text-slate-900">Clinical Diagnoses</h3>
                     <p className="text-xs text-slate-500 mt-1">Primary and secondary diagnoses identified</p>
                   </div>
                 </div>

                 {note.diagnoses && Array.isArray(note.diagnoses) && note.diagnoses.length > 0 ? (
                   <div className="space-y-4">
                     {/* ICD-10 Coded Diagnoses */}
                     {note.diagnoses.filter(d => d && /^[A-Z0-9]{1,}.*-/.test(d.trim())).length > 0 && (
                       <div className="space-y-3">
                         <div className="flex items-center gap-2 mb-3">
                           <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                             {note.diagnoses.filter(d => d && /^[A-Z0-9]{1,}.*-/.test(d.trim())).length} ICD-10 Codes (User Added)
                           </span>
                         </div>
                         <div className="grid gap-2">
                           {note.diagnoses
                             .filter(d => d && /^[A-Z0-9]{1,}.*-/.test(d.trim()))
                             .map((diag, i) => (
                             <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-white hover:border-blue-300 hover:shadow-sm transition-all">
                               <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs font-bold flex-shrink-0">
                                 {i + 1}
                               </div>
                               <div className="flex-1 min-w-0">
                                 <p className="text-sm font-medium text-slate-900 break-words">{diag}</p>
                               </div>
                             </div>
                           ))}
                         </div>
                       </div>
                     )}

                     {note.status === "finalized" && (
                       <div className="mt-4 pt-4 border-t border-slate-200">
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
                     )}
                   </div>
                 ) : (
                   <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                     <Code className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                     <p className="text-sm font-medium text-slate-600">No diagnoses added yet</p>
                     <p className="text-xs text-slate-500 mt-1">Diagnoses will appear here after extraction or manual entry</p>
                   </div>
                 )}

                 {note.status === "finalized" && (!note.diagnoses || note.diagnoses.length === 0) && (
                   <div className="mt-4">
                     <ICD10CodeSearch
                       suggestions={icd10Suggestions}
                       diagnoses={note.diagnoses || []}
                       onAddDiagnoses={async (newDiagnoses) => {
                         await base44.entities.ClinicalNote.update(noteId, { diagnoses: newDiagnoses });
                         queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                       }}
                     />
                   </div>
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