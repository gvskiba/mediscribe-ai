import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import NoteTranscriptionInput from "../components/notes/NoteTranscriptionInput";
import ClinicalSectionInput from "../components/notes/ClinicalSectionInput";
import StructuredNotePreview from "../components/notes/StructuredNotePreview";
import SmartGuidelinePanel from "../components/guidelines/SmartGuidelinePanel";
import PatientHistoryPanel from "../components/notes/PatientHistoryPanel";
import HistoryFocusSelector from "../components/notes/HistoryFocusSelector";
import ICD10Suggestions from "../components/notes/ICD10Suggestions";
import PatientEducationMaterials from "../components/notes/PatientEducationMaterials";
import PatientIntakeForm from "../components/notes/PatientIntakeForm";
import PatientDocumentUpload from "../components/notes/PatientDocumentUpload";
import { Clock, Upload } from "lucide-react";
import NewPatientDialog from "../components/notes/NewPatientDialog";
import ManualHistoryInput from "../components/notes/ManualHistoryInput";
import PreviousEncountersSummary from "../components/notes/PreviousEncountersSummary";
import SectionInserter from "../components/notes/SectionInserter";
import { useAutoSave } from "../components/utils/useAutoSave";

export default function NewNote() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [structuredNote, setStructuredNote] = useState(null);
  const [rawData, setRawData] = useState(null);
  const [guidelineRecommendations, setGuidelineRecommendations] = useState([]);
  const [loadingGuidelines, setLoadingGuidelines] = useState(false);
  const [patientHistory, setPatientHistory] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyFocus, setHistoryFocus] = useState("comprehensive");
  const [icd10Suggestions, setIcd10Suggestions] = useState([]);
  const [loadingIcd10, setLoadingIcd10] = useState(false);
  const [educationMaterialsOpen, setEducationMaterialsOpen] = useState(false);
  const [newPatientDialogOpen, setNewPatientDialogOpen] = useState(false);
  const [pendingPatientData, setPendingPatientData] = useState(null);
  const [medicationRecommendations, setMedicationRecommendations] = useState([]);
  const [loadingMedications, setLoadingMedications] = useState(false);
  const [encountersSummaryOpen, setEncountersSummaryOpen] = useState(false);
  const [useDetailedInput, setUseDetailedInput] = useState(null);
  const [specialty, setSpecialty] = useState("");
  const [useIntakeForm, setUseIntakeForm] = useState(false);
  const [documentUploadOpen, setDocumentUploadOpen] = useState(false);
  const [clinicalData, setClinicalData] = useState({
    history_and_physical: "",
    medical_history: "",
    review_of_systems: "",
    physical_exam: ""
  });
  const navigate = useNavigate();

  // Auto-save draft notes (only when creating, not when structuredNote exists)
  useAutoSave({
    data: structuredNote,
    entityName: "ClinicalNote",
    entityId: null,
    onSave: async (data) => {
      // Draft auto-save happens at note detail level, not here
    },
    interval: 30000,
    enabled: false, // Disabled at creation - notes are saved as drafts when finalized
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["noteTemplates"],
    queryFn: () => base44.entities.NoteTemplate.list()
  });

  const loadPatientHistory = async (patientId, patientName, focusArea = "comprehensive") => {
    if (!patientId && !patientName) return;

    setLoadingHistory(true);
    try {
      const allNotes = await base44.entities.ClinicalNote.list();
      const patientNotes = allNotes.filter((note) =>
      patientId && note.patient_id === patientId ||
      patientName && note.patient_name?.toLowerCase() === patientName.toLowerCase()
      ).sort((a, b) => new Date(b.date_of_visit) - new Date(a.date_of_visit));

      if (patientNotes.length === 0) {
        setLoadingHistory(false);
        return;
      }

      const focusInstructions = {
        comprehensive: "Extract all relevant medical history comprehensively.",
        cardiac: "Focus on cardiac/cardiovascular history: heart conditions, cardiac medications, cardiac procedures, and risk factors (HTN, diabetes, cholesterol).",
        respiratory: "Focus on respiratory history: lung conditions, breathing issues, inhalers, oxygen use, smoking history.",
        endocrine: "Focus on endocrine history: diabetes, thyroid disorders, metabolic conditions, and related medications.",
        neurological: "Focus on neurological history: seizures, stroke, neurodegenerative conditions, headaches, and neurological medications.",
        gastrointestinal: "Focus on GI history: digestive issues, liver disease, GI procedures, and related medications.",
        renal: "Focus on renal history: kidney disease, dialysis, urinary issues, and nephrotoxic medications.",
        oncology: "Focus on oncology history: cancer diagnoses, treatments, surgeries, and ongoing surveillance."
      };

      const historyPrompt = `Analyze these previous clinical notes for patient ${patientName} and extract medical history.

      FOCUS: ${focusInstructions[focusArea] || focusInstructions.comprehensive}

      Previous Notes (${patientNotes.length} total, showing 5 most recent):
      ${patientNotes.slice(0, 5).map((note) => `
      Date: ${note.date_of_visit}
      Raw Note: ${note.raw_note || "N/A"}
      Diagnoses: ${note.diagnoses?.join(", ") || "N/A"}
      Medications: ${note.medications?.join(", ") || "N/A"}
      Medical History: ${note.medical_history || "N/A"}
      Assessment: ${note.assessment || "N/A"}
      Plan: ${note.plan || "N/A"}
      `).join("\n---\n")}

      Extract and consolidate:
      1. chronic_conditions - Ongoing/chronic conditions (prioritize ${focusArea} conditions)
      2. allergies - Drug or other allergies mentioned
      3. current_medications - Active medications with dosages when available (prioritize ${focusArea}-related)
      4. past_procedures - Surgical procedures or major interventions (prioritize ${focusArea}-related)
      5. family_history - Family medical history mentioned (cancers, cardiac disease, diabetes, etc.)
      6. trends - Analyze changes over time: Are conditions worsening/improving? Medication changes? New developments? (2-3 sentences highlighting key trends)`;

      const history = await base44.integrations.Core.InvokeLLM({
        prompt: historyPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            chronic_conditions: { type: "array", items: { type: "string" } },
            allergies: { type: "array", items: { type: "string" } },
            current_medications: { type: "array", items: { type: "string" } },
            past_procedures: { type: "array", items: { type: "string" } },
            family_history: { type: "array", items: { type: "string" } },
            trends: { type: "string" }
          }
        }
      });

      setPatientHistory({ ...history, notes_reviewed: patientNotes.length });
    } catch (error) {
      console.error("Failed to load patient history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSubmit = async (noteData, templateId) => {
    setIsProcessing(true);
    setRawData(noteData);

    try {
      // Skip patient checks for detailed clinical input (no patient name/ID provided)
      const hasPatientInfo = noteData.patient_id || noteData.patient_name;

      // Check if patient exists (only for transcription input with patient info)
      if (hasPatientInfo && noteData.patient_id) {
        const existingPatients = await base44.entities.Patient.filter({ patient_id: noteData.patient_id });

        if (existingPatients.length === 0) {
          // Patient doesn't exist, prompt to create
          setPendingPatientData({ ...noteData, templateId: templateId || null });
          setNewPatientDialogOpen(true);
          setIsProcessing(false);
          return;
        }
      }

      // Load patient history proactively (only if patient info available)
      if (hasPatientInfo) {
        loadPatientHistory(noteData.patient_id, noteData.patient_name, historyFocus);
      }

      const template = templateId ? templates.find((t) => t.id === templateId) : null;

      let prompt = `You are a medical scribe AI. Given the following clinical note, extract and structure the information accurately.

      ${noteData.patient_name ? `Patient: ${noteData.patient_name}` : ''}
      Note Type: ${noteData.note_type}
      Specialty: ${noteData.specialty || "General"}
      ${noteData.chief_complaint ? `Chief Complaint: ${noteData.chief_complaint}` : ''}
      Raw Note:
      ${noteData.raw_note}`;

      // Enhance prompt with patient context when available
      if (patientHistory) {
        prompt += `\n\n=== PATIENT HISTORY CONTEXT ===
      Known Chronic Conditions: ${patientHistory.chronic_conditions?.join(", ") || "None"}
      Current Medications: ${patientHistory.current_medications?.join(", ") || "None"}
      Known Allergies: ${patientHistory.allergies?.join(", ") || "None"}
      Past Procedures: ${patientHistory.past_procedures?.join(", ") || "None"}
      Recent Trends: ${patientHistory.trends || "N/A"}

      Use this history to inform your extraction and identify relevant continuities or changes from previous encounters.`;
      }

      let schema = {
        type: "object",
        properties: {
          chief_complaint: { type: "string" },
          history_of_present_illness: { type: "string" },
          medical_history: { type: "string" },
          review_of_systems: { type: "string" },
          physical_exam: { type: "string" },
          assessment: { type: "string" },
          plan: { type: "string" },
          clinical_impression: { type: "string" },
          diagnoses: { type: "array", items: { type: "string" } },
          medications: { type: "array", items: { type: "string" } }
        }
      };

      if (template && template.sections) {
        // Filter only enabled sections and sort by order
        const activeSections = template.sections.
        filter((section) => section.enabled !== false).
        sort((a, b) => (a.order || 0) - (b.order || 0));

        // Helper function to evaluate a single condition
        const evaluateCondition = (condition) => {
          const { type, value, match_type = "partial", secondary_value } = condition;

          const matchValue = (haystack, pattern, matchType) => {
            if (!haystack || !pattern) return false;
            const hay = String(haystack).toLowerCase();
            const pat = String(pattern).toLowerCase();

            if (matchType === "exact") {
              return hay === pat;
            } else if (matchType === "regex") {
              try {
                const regex = new RegExp(pattern, "i");
                return regex.test(haystack);
              } catch {
                return false;
              }
            } else {// partial
              return hay.includes(pat);
            }
          };

          try {
            if (type === "note_type") {
              return matchValue(noteData.note_type, value, match_type);
            } else if (type === "specialty") {
              return matchValue(noteData.specialty, value, match_type);
            } else if (type === "diagnosis_contains") {
              return Array.isArray(noteData.diagnoses) && noteData.diagnoses.some((d) => matchValue(d, value, match_type));
            } else if (type === "chronic_condition_contains") {
              return Array.isArray(patientHistory?.chronic_conditions) && patientHistory.chronic_conditions.some((c) => matchValue(c, value, match_type));
            } else if (type === "medication_contains") {
              return Array.isArray(patientHistory?.current_medications) && patientHistory.current_medications.some((m) => matchValue(m, value, match_type));
            } else if (type === "allergy_contains") {
              return Array.isArray(patientHistory?.allergies) && patientHistory.allergies.some((a) => matchValue(a, value, match_type));
            } else if (type === "patient_age") {
              // Age range matching (e.g., "18-65")
              const [min, max] = value.split("-").map((v) => parseInt(v));
              return !isNaN(min) && !isNaN(max);
            } else if (type === "symptom_contains") {
              const hpi = noteData.history_of_present_illness || "";
              return matchValue(hpi, value, match_type);
            }
            return false;
          } catch (error) {
            console.warn("Error evaluating condition:", error);
            return false;
          }
        };

        // Apply conditional logic filtering
        const applicableSections = activeSections.filter((section) => {
          if (!section.conditional_logic?.enabled) return true;

          const { operator = "AND", conditions = [] } = section.conditional_logic;

          if (conditions.length === 0) return true;

          const results = conditions.map(evaluateCondition);

          // AND: all conditions must be true
          if (operator === "AND") {
            return results.every((r) => r === true);
          } else {// OR: at least one condition must be true
            return results.some((r) => r === true);
          }
        });

        console.log(`Template: ${template.name} - Using ${applicableSections.length}/${activeSections.length} sections based on conditions`);

        prompt += `\n\n=== FOLLOW THIS TEMPLATE STRUCTURE ===`;
        prompt += `\nTemplate: ${template.name}`;
        if (template.ai_instructions) {
          prompt += `\n\nGlobal Instructions: ${template.ai_instructions}`;
        }

        prompt += `\n\n=== REQUIRED SECTIONS ===`;
        prompt += `\nExtract information from the raw note above and populate each section below.`;
        prompt += `\nFOLLOW THE SPECIFIC INSTRUCTIONS FOR EACH SECTION CAREFULLY:\n`;

        applicableSections.forEach((section, idx) => {
          prompt += `\n\n${idx + 1}. ${section.name}`;
          if (section.description) {
            prompt += `\n   Purpose: ${section.description}`;
          }

          // Include detailed AI instructions if available
          if (section.ai_instructions_detailed?.global_instructions) {
            prompt += `\n   ⚡ SECTION GUIDELINES: ${section.ai_instructions_detailed.global_instructions}`;
          } else if (section.ai_instructions) {
            prompt += `\n   ⚡ SPECIFIC INSTRUCTIONS: ${section.ai_instructions}`;
          }

          // Include field-specific instructions
          if (section.ai_instructions_detailed?.field_instructions && section.ai_instructions_detailed.field_instructions.length > 0) {
            prompt += `\n   FIELD-SPECIFIC EXTRACTION:\n`;
            section.ai_instructions_detailed.field_instructions.forEach((field) => {
              prompt += `     • ${field.field_name}: ${field.instructions}\n`;
            });
          }

          if (section.fallback_from_hpi) {
            prompt += `\n   ℹ️  FALLBACK: If this section cannot be populated from the raw note, infer reasonable content from the History of Present Illness (HPI).`;
          }

          if (section.ai_instructions || section.ai_instructions_detailed?.global_instructions) {
            prompt += `\n   → CRITICAL: Follow these instructions precisely when extracting data for this section.`;
          } else {
            prompt += `\n   → Extract all relevant content from the raw note for this section.`;
          }
        });

        prompt += `\n\n=== IMPORTANT ===`;
        prompt += `\nUse ONLY the information from the raw note provided above. Do not add external information.`;
        prompt += `\nIf a section cannot be populated from the raw note, provide a brief note like "Not documented in this encounter."`;
        prompt += `\n\n=== RESPONSE FORMAT (CRITICAL) ===`;
        prompt += `\nYou MUST return a JSON object with EXACTLY these property names (use these exact names, not the section names above):`;
        prompt += `\n- chief_complaint (string)`;
        prompt += `\n- history_of_present_illness (string)`;
        prompt += `\n- medical_history (string)`;
        prompt += `\n- review_of_systems (string)`;
        prompt += `\n- physical_exam (string)`;
        prompt += `\n- assessment (string)`;
        prompt += `\n- plan (string)`;
        prompt += `\n- clinical_impression (string)`;
        prompt += `\n- diagnoses (array of strings)`;
        prompt += `\n- medications (array of strings)`;
        prompt += `\nMap the template sections to these standard fields based on content and purpose.`;

        // Build schema from applicable sections but always include standard fields
        const properties = {
          chief_complaint: { type: "string" },
          history_of_present_illness: { type: "string" },
          medical_history: { type: "string" },
          review_of_systems: { type: "string" },
          physical_exam: { type: "string" },
          assessment: { type: "string" },
          plan: { type: "string" },
          clinical_impression: { type: "string" },
          diagnoses: { type: "array", items: { type: "string" } },
          medications: { type: "array", items: { type: "string" } }
        };

        schema = {
          type: "object",
          properties
        };
      } else {
        prompt += `\n\n=== EXTRACTION INSTRUCTIONS ===

Extract ALL information from the raw note and populate the following sections. Be thorough and comprehensive:

1. chief_complaint - Extract the main reason for visit in 1-2 sentences. Look in HPI, chief complaint, or opening statements.

2. history_of_present_illness - Detailed narrative of the present illness using OLDCARTS framework:
   - Onset: When did symptoms start?
   - Location: Where is the problem?
   - Duration: How long has it lasted?
   - Character: What does it feel like? (sharp, dull, burning, etc.)
   - Alleviating factors: What makes it better?
   - Aggravating factors: What makes it worse?
   - Radiation: Does it spread anywhere?
   - Temporal patterns: Constant vs intermittent, time of day patterns
   - Severity: How bad is it? (1-10 scale if mentioned, or descriptive)
   Synthesize this into a coherent narrative that tells the story of the patient's illness.

3. medical_history - Extract past medical history, chronic conditions, surgical history, family history, social history. Consolidate all relevant historical information.

4. review_of_systems - Extract all symptoms mentioned by body system:
   - Constitutional (fever, fatigue, weight changes)
   - HEENT (headache, vision, hearing, sore throat)
   - Cardiovascular (chest pain, palpitations, edema)
   - Respiratory (cough, SOB, wheezing)
   - GI (nausea, vomiting, diarrhea, abdominal pain)
   - GU (urinary symptoms, sexual health)
   - Musculoskeletal (pain, swelling, weakness)
   - Neurologic (dizziness, numbness, seizures)
   - Psychiatric (mood, anxiety, sleep)
   - Skin (rashes, lesions)
   If symptoms are implied or related to the chief complaint, include them. If truly no ROS documented, write "No systematic review documented."

5. physical_exam - Extract ALL objective findings:
   - Vitals (BP, HR, RR, Temp, O2 sat)
   - General appearance
   - System-specific exams (CV, Resp, Abd, Extremities, Neuro, etc.)
   If exam findings are implied by the assessment or treatment, infer reasonable findings. If truly no exam documented, write "Physical examination not documented."

6. assessment - Extract or infer clinical assessment. This includes:
   - Interpretation of symptoms and findings
   - Differential diagnoses considered
   - Clinical impression
   Use information from throughout the note to build a comprehensive assessment.

7. plan - Extract comprehensive treatment plan:
   - Medications prescribed (with dosing)
   - Diagnostic tests ordered
   - Procedures planned
   - Follow-up appointments
   - Patient education/instructions
   - Referrals
   Consolidate all treatment-related information.

8. clinical_impression - SYNTHESIZE a coherent clinical summary (2-4 sentences) that:
   - Identifies the PRIMARY issue(s) driving this encounter
   - Highlights KEY findings from HPI, exam, and assessment
   - Provides clinical context (e.g., "65yo with CAD presenting with...")
   - Notes any concerning findings or important follow-up needs
   This should read like an attending physician's synthesis, not a list. Make it clinically relevant and actionable.

9. diagnoses - Extract ALL diagnoses, conditions, or problems mentioned. Include ICD-10 codes if stated. Return as an array of strings.

10. medications - Extract ALL medications mentioned (current, prescribed, discontinued). Include dosages if provided. Return as an array of strings.

=== CRITICAL RULES ===
- Extract information from ANYWHERE in the note (HPI, exam, plan, prescriptions, etc.)
- Make reasonable clinical inferences when information is implied
- Synthesize information scattered throughout the note into coherent narratives
- For HPI: Tell the patient's story with clinical detail (OLDCARTS elements)
- For Clinical Impression: Synthesize across all sections to identify the PRIMARY clinical issues
- ALWAYS populate ALL 10 fields - never return null or undefined
- Only use "Not documented" if there's absolutely no relevant information anywhere in the note`;
      }

      console.log("Sending prompt to LLM with schema:", schema);

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: schema
      });

      console.log("AI Extraction Result:", result);

      if (!result || Object.keys(result).length === 0) {
        throw new Error("LLM returned empty result - check browser console for prompt and schema");
      }

      // When using templates, ensure we always have standard fields
      let mergedNote = { ...noteData, ...result };

      // If chief complaint was provided upfront, use it (unless AI extracted a better one)
      if (noteData.chief_complaint && !result.chief_complaint) {
        mergedNote.chief_complaint = noteData.chief_complaint;
      }

      // Ensure standard fields exist even if using template
      if (!mergedNote.chief_complaint && template) {
        mergedNote.chief_complaint = result.chief_complaint || result[Object.keys(result)[0]] || "";
      }
      if (!mergedNote.diagnoses) {
        mergedNote.diagnoses = Array.isArray(result.diagnoses) ? result.diagnoses : [];
      }
      if (!mergedNote.medications) {
        mergedNote.medications = Array.isArray(result.medications) ? result.medications : [];
      }

      // If patient history was loaded and medical_history is empty, auto-apply it
      if (patientHistory && (!result.medical_history || result.medical_history === "Not extracted" || result.medical_history === "Not documented in this encounter.")) {
        mergedNote.medical_history = `CHRONIC CONDITIONS: ${patientHistory.chronic_conditions?.join(", ") || "None"}
      ALLERGIES: ${patientHistory.allergies?.join(", ") || "None"}  
      CURRENT MEDICATIONS: ${patientHistory.current_medications?.join(", ") || "None"}
      PAST PROCEDURES: ${patientHistory.past_procedures?.join(", ") || "None"}
      FAMILY HISTORY: ${patientHistory.family_history?.join(", ") || "None"}
      TRENDS: ${patientHistory.trends || "N/A"}`;
      }

      // Update template usage count and last_used
      if (templateId) {
        await base44.entities.NoteTemplate.update(templateId, {
          usage_count: (template?.usage_count || 0) + 1,
          last_used: new Date().toISOString()
        });
      }

      // Fetch guidelines and construct evidence-based plan
      const enhancedNote = await enhancePlanWithGuidelines(mergedNote);
      setStructuredNote(enhancedNote);

      // Automatically fetch guideline recommendations, ICD-10 codes, and medication recommendations in parallel
      Promise.all([
      fetchGuidelineRecommendations(enhancedNote),
      generateICD10Suggestions(enhancedNote),
      fetchMedicationRecommendations(enhancedNote)]
      ).catch((error) => {
        console.error("Failed to fetch additional data:", error);
      });
    } catch (error) {
      console.error("Error processing note:", error);
      alert("Failed to process note. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const cleanPlanText = (text) => {
    if (!text) return text;

    // Replace special characters with spaces, then clean up
    let cleaned = text.
    replace(/[•\-\*→▸►✓✗]/g, '') // Remove bullet points and arrows
    .replace(/[\u2022\u2023]/g, '') // Remove other bullet variants
    .replace(/^[\s]*[-•*]\s+/gm, '') // Remove bullets at line start
    .replace(/(\r\n|\n)+/g, '\n') // Normalize line breaks
    .split('\n').
    map((line) => line.trim()).
    filter((line) => line.length > 0).
    join('\n');

    return cleaned;
  };

  const enhancePlanWithGuidelines = async (noteData) => {
    try {
      // Extract conditions from diagnoses
      const conditions = [];
      if (Array.isArray(noteData.diagnoses) && noteData.diagnoses.length > 0) {
        conditions.push(...noteData.diagnoses.slice(0, 3));
      }

      if (conditions.length === 0) return noteData;

      // Build context including patient history
      const historyContext = patientHistory ? `
Patient History Context:
- Chronic Conditions: ${patientHistory.chronic_conditions?.join(", ") || "None"}
- Current Medications: ${patientHistory.current_medications?.join(", ") || "None"}
- Allergies: ${patientHistory.allergies?.join(", ") || "None"}
- Recent Trends: ${patientHistory.trends || "N/A"}
` : "";

      // Fetch guidelines for the conditions
      const guidelines = await Promise.all(
        conditions.slice(0, 2).map(async (condition) => {
          const cleanCondition = condition.replace(/\(.*?\)/g, "").trim();
          const result = await base44.integrations.Core.InvokeLLM({
            prompt: `Provide evidence-based clinical guideline recommendations for: ${cleanCondition}
${historyContext}
Focus on:
1. First-line treatment recommendations
2. Key monitoring parameters
3. Patient-specific considerations
4. Red flags or contraindications
5. Follow-up recommendations

Keep it actionable and concise (4-6 bullet points).`,
            add_context_from_internet: true,
            response_json_schema: {
              type: "object",
              properties: {
                summary: { type: "string" },
                key_points: { type: "array", items: { type: "string" } },
                sources: { type: "array", items: { type: "string" } }
              }
            }
          });
          return { condition: cleanCondition, ...result };
        })
      );

      // Generate enhanced plan based on guidelines
      const guidelinesSummary = guidelines.map((g) =>
      `${g.condition}: ${g.key_points.join(" ")}`
      ).join(" ");

      const enhancedPlan = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a medical AI assistant${noteData.specialty ? ` specializing in ${noteData.specialty}` : ''}. Review the following clinical note and evidence-based guidelines, then construct a comprehensive, guideline-informed treatment plan organized by category.

      Current Clinical Note:
      Chief Complaint: ${noteData.chief_complaint || "N/A"}
      HPI: ${noteData.history_of_present_illness || "N/A"}
      Assessment: ${noteData.assessment || "N/A"}
      Current Plan: ${noteData.plan || "N/A"}
      Diagnoses: ${noteData.diagnoses?.join(", ") || "N/A"}
      Specialty: ${noteData.specialty || "General Medicine"}
      ${historyContext}

      Evidence-Based Guidelines:
      ${guidelinesSummary}

      TASK: Create a professional treatment plan organized into separate treatment categories:

      1. Plan Headline: A clear, concise headline summarizing the primary treatment approach (1 sentence, 15-25 words)

      2. Plan Summary: Brief 2-3 sentence overview of the entire treatment strategy

      3. LABS: List all laboratory tests and diagnostic studies needed with timing and clinical rationale

      4. MEDICATIONS: List all medications with specific dosages, frequency, duration, and clinical rationale for each

      5. INTERVENTIONS: Describe any procedures, therapies, monitoring protocols, patient education, and follow-up appointments

      6. References: List all evidence-based guideline sources

      FORMATTING RULES (CRITICAL):
      - Write each section (Labs, Medications, Interventions) as flowing paragraphs with complete sentences
      - NO bullet points, dashes, asterisks, arrows, or special symbols in the plan text
      - Use clear, professional medical language
      - Be specific with dosages, frequencies, and timing
      - Be comprehensive, evidence-based, and clinically appropriate for ${noteData.specialty || "general medicine"} practice.`,
        response_json_schema: {
          type: "object",
          properties: {
            headline: { type: "string", description: "Brief treatment plan headline" },
            summary: { type: "string", description: "2-3 sentence overview of treatment strategy" },
            labs: { type: "string", description: "Laboratory tests and diagnostic studies" },
            medications: { type: "string", description: "Medication recommendations with dosages and rationale" },
            interventions: { type: "string", description: "Procedures, therapies, monitoring, education, and follow-up" },
            references: { type: "array", items: { type: "string" }, description: "Evidence-based guideline sources" }
          }
        }
      });

      // Format the complete plan with organized sections and references at bottom
      let planContent = `${enhancedPlan.headline}

      ${enhancedPlan.summary}`;

      // Add each section if it exists
      if (enhancedPlan.labs) {
        planContent += `\n\nLABS\n${cleanPlanText(enhancedPlan.labs)}`;
      }

      if (enhancedPlan.medications) {
        planContent += `\n\nMEDICATIONS\n${cleanPlanText(enhancedPlan.medications)}`;
      }

      if (enhancedPlan.interventions) {
        planContent += `\n\nINTERVENTIONS\n${cleanPlanText(enhancedPlan.interventions)}`;
      }

      // Append references at the very end if they exist
      if (enhancedPlan.references && enhancedPlan.references.length > 0) {
        planContent += `\n\nREFERENCES\n${enhancedPlan.references.map((ref, i) => `${i + 1}. ${ref}`).join('\n')}`;
      }

      const formattedPlan = planContent;

      return {
        ...noteData,
        plan: formattedPlan
      };
    } catch (error) {
      console.error("Failed to enhance plan with guidelines:", error);
      return noteData;
    }
  };

  const fetchGuidelineRecommendations = async (noteData) => {
    setLoadingGuidelines(true);
    try {
      // Extract conditions from diagnoses
      const conditions = [];
      if (Array.isArray(noteData.diagnoses) && noteData.diagnoses.length > 0) {
        conditions.push(...noteData.diagnoses.slice(0, 3));
      }

      if (conditions.length === 0) return;

      // Build context including patient history for more relevant guidelines
      const historyContext = patientHistory ? `
Patient History Context:
- Chronic Conditions: ${patientHistory.chronic_conditions?.join(", ") || "None"}
- Current Medications: ${patientHistory.current_medications?.join(", ") || "None"}
- Allergies: ${patientHistory.allergies?.join(", ") || "None"}
- Recent Trends: ${patientHistory.trends || "N/A"}
` : "";

      // Query guidelines for each condition with patient context
      const recommendations = await Promise.all(
        conditions.slice(0, 2).map(async (condition) => {
          const cleanCondition = condition.replace(/\(.*?\)/g, "").trim();
          const result = await base44.integrations.Core.InvokeLLM({
            prompt: `Provide evidence-based clinical guideline recommendations for: ${cleanCondition}
${historyContext}
Focus on:
1. First-line treatment recommendations
2. Key monitoring parameters
3. Patient-specific considerations (given the history above)
4. Red flags or contraindications
5. Follow-up recommendations

Return 4-6 concise, actionable key recommendations.

CRITICAL: Write each recommendation as a clean, complete sentence WITHOUT any inline citations, reference numbers, or bracketed numbers. Do not include [1], (1), or any citation markers in the key_points. Keep recommendations clear and citation-free.`,
            add_context_from_internet: true,
            response_json_schema: {
              type: "object",
              properties: {
                summary: { type: "string" },
                key_points: {
                  type: "array",
                  items: { type: "string" },
                  description: "Clean, actionable recommendations without inline citations or reference numbers"
                },
                sources: { type: "array", items: { type: "string" } }
              }
            }
          });

          // Save to GuidelineQuery entity for tracking
          const savedGuideline = await base44.entities.GuidelineQuery.create({
            question: `Guidelines for ${cleanCondition}`,
            answer: result.summary,
            sources: result.sources || [],
            category: "general",
            confidence_level: "high"
          });

          return {
            condition: cleanCondition,
            guideline_id: savedGuideline.id,
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

  const generateICD10Suggestions = async (noteData) => {
    setLoadingIcd10(true);
    try {
      const diagnosesList = Array.isArray(noteData.diagnoses) ? noteData.diagnoses.join(", ") : "";
      const assessment = noteData.assessment || "";

      if (!diagnosesList && !assessment) {
        setLoadingIcd10(false);
        return;
      }

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert medical coder. Analyze the following clinical information and suggest the most appropriate ICD-10 codes. Rank codes by specificity and clinical relevance.

      PATIENT CONTEXT:
      Chief Complaint: ${noteData.chief_complaint || "N/A"}
      Assessment: ${assessment}
      History of Present Illness: ${noteData.history_of_present_illness || "N/A"}

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

  const fetchMedicationRecommendations = async (noteData) => {
    setLoadingMedications(true);
    try {
      const conditions = [];
      if (Array.isArray(noteData.diagnoses) && noteData.diagnoses.length > 0) {
        conditions.push(...noteData.diagnoses.slice(0, 3));
      }

      if (conditions.length === 0) {
        setLoadingMedications(false);
        return;
      }

      const historyContext = patientHistory ? `
Patient History Context:
- Chronic Conditions: ${patientHistory.chronic_conditions?.join(", ") || "None"}
- Current Medications: ${patientHistory.current_medications?.join(", ") || "None"}
- Allergies: ${patientHistory.allergies?.join(", ") || "None"}
- Recent Trends: ${patientHistory.trends || "N/A"}
` : "";

      const recommendations = await Promise.all(
        conditions.slice(0, 2).map(async (condition) => {
          const cleanCondition = condition.replace(/\(.*?\)/g, "").trim();
          const result = await base44.integrations.Core.InvokeLLM({
            prompt: `Provide evidence-based medication recommendations for: ${cleanCondition}
${historyContext}
Specialty Context: ${noteData.specialty || "General Medicine"}

Focus on:
1. First-line medications with specific dosing (tailored to ${noteData.specialty || "general medicine"} practice)
2. Alternative options if first-line is contraindicated
3. Monitoring requirements for each medication
4. Drug interactions with current medications
5. Contraindications based on patient allergies and conditions
6. Specialty-specific considerations for ${noteData.specialty || "general medicine"}

Return specific, actionable medication recommendations based on current clinical guidelines appropriate for ${noteData.specialty || "general medicine"}.`,
            add_context_from_internet: true,
            response_json_schema: {
              type: "object",
              properties: {
                first_line: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      medication: { type: "string" },
                      dosing: { type: "string" },
                      rationale: { type: "string" }
                    }
                  }
                },
                alternatives: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      medication: { type: "string" },
                      dosing: { type: "string" },
                      when_to_use: { type: "string" }
                    }
                  }
                },
                monitoring: { type: "string" },
                contraindications: { type: "string" }
              }
            }
          });

          return { condition: cleanCondition, ...result };
        })
      );

      setMedicationRecommendations(recommendations);
    } catch (error) {
      console.error("Failed to fetch medication recommendations:", error);
    } finally {
      setLoadingMedications(false);
    }
  };

  const handleApplyHistory = (history) => {
    const historyText = `CHRONIC CONDITIONS: ${history.chronic_conditions?.join(", ") || "None"}
  ALLERGIES: ${history.allergies?.join(", ") || "None"}  
  CURRENT MEDICATIONS: ${history.current_medications?.join(", ") || "None"}
  PAST PROCEDURES: ${history.past_procedures?.join(", ") || "None"}
  FAMILY HISTORY: ${history.family_history?.join(", ") || "None"}`;

    setStructuredNote((prev) => ({
      ...prev,
      medical_history: historyText
    }));
  };

  const handleManualHistoryExtracted = (extractedHistory) => {
    // Merge extracted history with existing patient history
    const mergedHistory = {
      chronic_conditions: [
      ...(patientHistory?.chronic_conditions || []),
      ...(extractedHistory.chronic_conditions || [])],

      allergies: [
      ...(patientHistory?.allergies || []),
      ...(extractedHistory.allergies || [])],

      current_medications: [
      ...(patientHistory?.current_medications || []),
      ...(extractedHistory.current_medications || [])],

      past_procedures: [
      ...(patientHistory?.past_procedures || []),
      ...(extractedHistory.past_procedures || [])],

      family_history: [
      ...(patientHistory?.family_history || []),
      ...(extractedHistory.family_history || [])],

      trends: patientHistory?.trends || "",
      notes_reviewed: patientHistory?.notes_reviewed || 0
    };

    setPatientHistory(mergedHistory);
  };

  const handleFinalize = async () => {
    const created = await base44.entities.ClinicalNote.create({
      ...rawData,
      ...structuredNote,
      status: "finalized"
    });

    // Automatically link guidelines to the finalized note
    try {
      await base44.functions.invoke('autoLinkGuidelines', { noteId: created.id });
    } catch (error) {
      console.error("Failed to auto-link guidelines:", error);
      // Continue anyway - linking failure shouldn't block note finalization
    }

    navigate(createPageUrl(`NoteDetail?id=${created.id}`));
  };

  const handleUpdate = (field, value) => {
    setStructuredNote((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreatePatient = async (patientData) => {
    try {
      await base44.entities.Patient.create({
        patient_name: patientData.patient_name,
        patient_id: patientData.patient_id,
        date_of_birth: patientData.date_of_birth || null,
        gender: patientData.gender || null,
        contact_number: patientData.contact_number || null,
        email: patientData.email || null
      });

      setNewPatientDialogOpen(false);

      // Continue with note processing
      const noteDataWithoutTemplate = { ...pendingPatientData };
      const templateIdToUse = noteDataWithoutTemplate.templateId;
      delete noteDataWithoutTemplate.templateId;

      // Now process with existing handleSubmit logic
      handleSubmit(noteDataWithoutTemplate, templateIdToUse);
    } catch (error) {
      console.error("Failed to create patient:", error);
      alert("Failed to create patient. Please try again.");
      setIsProcessing(false);
    }
  };



  const handleReanalyze = async (field) => {
    const fieldPrompts = {
      chief_complaint: "Extract the chief complaint (main reason for visit) in 1-2 sentences",
      history_of_present_illness: "Extract a detailed HPI using OLDCARTS: Onset, Location, Duration, Character, Alleviating/Aggravating factors, Radiation, Temporal patterns, Severity. Create a coherent narrative.",
      medical_history: "Extract relevant past medical history, chronic conditions, and surgical history in 2-3 sentences",
      review_of_systems: "Extract the systematic review of symptoms organized by body system",
      physical_exam: "Extract objective physical examination findings",
      assessment: "Provide a detailed clinical assessment including relevant findings and differential diagnoses",
      plan: "Provide a comprehensive treatment plan including medications, follow-ups, and orders",
      clinical_impression: "Synthesize a 2-4 sentence clinical impression identifying the PRIMARY issues, key findings, and clinical context from the entire note",
      diagnoses: "List all diagnoses with ICD-10 codes if possible",
      medications: "List all medications mentioned with dosages"
    };

    const responseSchemas = {
      chief_complaint: { type: "object", properties: { result: { type: "string" } } },
      history_of_present_illness: { type: "object", properties: { result: { type: "string" } } },
      medical_history: { type: "object", properties: { result: { type: "string" } } },
      review_of_systems: { type: "object", properties: { result: { type: "string" } } },
      physical_exam: { type: "object", properties: { result: { type: "string" } } },
      assessment: { type: "object", properties: { result: { type: "string" } } },
      plan: { type: "object", properties: { result: { type: "string" } } },
      clinical_impression: { type: "object", properties: { result: { type: "string" } } },
      diagnoses: { type: "object", properties: { result: { type: "array", items: { type: "string" } } } },
      medications: { type: "object", properties: { result: { type: "array", items: { type: "string" } } } }
    };

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Based on the following clinical note, ${fieldPrompts[field]}:

Raw Note:
${rawData.raw_note}

Current structured data:
${JSON.stringify(structuredNote, null, 2)}`,
      response_json_schema: responseSchemas[field]
    });

    return result.result;
  };

  const handleDetailedInputSubmit = async (data, templateId) => {
    handleSubmit(data, templateId);
  };

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-6">
        {!structuredNote ?
        <>
            {useIntakeForm ? (
          <div className="space-y-4">
            <button
              onClick={() => setUseIntakeForm(false)}
              className="text-sm text-emerald-300 hover:text-emerald-200 underline"
            >
              ← Back to input selection
            </button>
            <PatientIntakeForm
              onIntakeComplete={(intakeData) => {
                // Convert intake data to raw note and submit
                handleSubmit({ 
                  ...intakeData, 
                  specialty: specialty || intakeData.specialty,
                  note_type: "progress_note"
                }, null);
                // Reset to form selection after processing
                setUseIntakeForm(false);
              }}
            />
          </div>
        ) : useDetailedInput === null ?
          <div className="min-h-[60vh] flex items-center justify-center">
                <div className="max-w-3xl w-full space-y-8">
                  <div className="text-center space-y-3">
                    <h1 className="text-gray-950 text-4xl font-bold">Create New Clinical Note</h1>
                    <p className="text-lg text-slate-800">Choose your preferred input method</p>
                  </div>

                  <div className="bg-blue-600 p-6 rounded-xl border border-slate-600">
                    <label className="text-sm font-semibold text-white mb-3 block">Medical Specialty</label>
                    <select
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)} className="bg-slate-50 text-slate-950 px-4 py-2.5 rounded-lg w-full border border-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">


                      <option value="">Select a specialty...</option>
                      <option value="General Medicine">General Medicine</option>
                      <option value="Cardiology">Cardiology</option>
                      <option value="Pulmonology">Pulmonology</option>
                      <option value="Gastroenterology">Gastroenterology</option>
                      <option value="Neurology">Neurology</option>
                      <option value="Endocrinology">Endocrinology</option>
                      <option value="Rheumatology">Rheumatology</option>
                      <option value="Orthopedics">Orthopedics</option>
                      <option value="Surgery">Surgery</option>
                      <option value="Emergency Medicine">Emergency Medicine</option>
                      <option value="Psychiatry">Psychiatry</option>
                      <option value="Pediatrics">Pediatrics</option>
                      <option value="Oncology">Oncology</option>
                    </select>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    <button
                  onClick={() => setUseIntakeForm(true)}
                  className="group relative overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-2xl p-8 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl shadow-xl">

                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative space-y-4">
                        <div className="w-16 h-16 mx-auto bg-white/20 rounded-2xl flex items-center justify-center">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="space-y-2">
                          <h2 className="text-2xl font-bold text-white">Patient Intake Form</h2>
                          <p className="text-emerald-100">Guided form for patient self-entry with AI pre-fill</p>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-sm text-emerald-200">
                          <span>AI-Assisted</span>
                          <span>•</span>
                          <span>Structured</span>
                        </div>
                      </div>
                    </button>

                    <button
                  onClick={() => setUseDetailedInput(false)}
                  className="group relative overflow-hidden bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-2xl p-8 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl shadow-xl">

                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative space-y-4">
                        <div className="w-16 h-16 mx-auto bg-white/20 rounded-2xl flex items-center justify-center">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          </svg>
                        </div>
                        <div className="space-y-2">
                          <h2 className="text-2xl font-bold text-white">Dictation Transcription</h2>
                          <p className="text-purple-100">Speak or type your clinical note naturally, and let AI structure it for you</p>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-sm text-purple-200">
                          <span>Quick & Natural</span>
                          <span>•</span>
                          <span>Voice Supported</span>
                        </div>
                      </div>
                    </button>

                    <button
                  onClick={() => setUseDetailedInput(true)}
                  className="group relative overflow-hidden bg-gradient-to-br from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-2xl p-8 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl shadow-xl">

                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative space-y-4">
                        <div className="w-16 h-16 mx-auto bg-white/20 rounded-2xl flex items-center justify-center">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="space-y-2">
                          <h2 className="text-2xl font-bold text-white">Detailed Clinical Input</h2>
                          <p className="text-blue-100">Enter information in structured sections: Subjective, Medical History, ROS, Physical Exam</p>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-sm text-blue-200">
                          <span>Organized</span>
                          <span>•</span>
                          <span>Section-by-Section</span>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div> :
          !useDetailedInput ?
          <div className="space-y-4">
                <button
              onClick={() => setUseDetailedInput(null)}
              className="text-sm text-purple-300 hover:text-purple-200 underline">

                  ← Back to input selection
                </button>
                <NoteTranscriptionInput
              onSubmit={(noteData, templateId) => {
                handleSubmit({ ...noteData, specialty: specialty || noteData.specialty }, templateId);
              }}
              isProcessing={isProcessing}
              templates={templates}
              defaultSpecialty={specialty} />

              </div> :

          <div className="space-y-4">
                <button
              onClick={() => setUseDetailedInput(null)}
              className="text-sm text-purple-300 hover:text-purple-200 underline">

                  ← Back to input selection
                </button>
                <ClinicalSectionInput
              onSubmit={(data, templateId) => handleDetailedInputSubmit({ ...data, specialty: specialty || data.specialty }, templateId)}
              isProcessing={isProcessing}
              templates={templates}
              clinicalData={clinicalData}
              onClinicalDataChange={setClinicalData}
              defaultSpecialty={specialty} />

              </div>
          }
          </> :

        <>
            {/* History Focus Selector */}
            {rawData && (rawData.patient_id || rawData.patient_name) &&
          <HistoryFocusSelector
            value={historyFocus}
            onChange={(value) => {
              setHistoryFocus(value);
              loadPatientHistory(rawData.patient_id, rawData.patient_name, value);
            }}
            onRefresh={() => loadPatientHistory(rawData.patient_id, rawData.patient_name, historyFocus)}
            disabled={loadingHistory} />

          }

            {/* Manual History Input */}
             <ManualHistoryInput
             onHistoryExtracted={handleManualHistoryExtracted} />

            {/* Section Inserter */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <SectionInserter
                onInsertSection={(section) => {
                  setStructuredNote((prev) => ({
                    ...prev,
                    history_of_present_illness: (prev.history_of_present_illness || "") + "\n\n" + section.content
                  }));
                }}
                specialty={rawData?.specialty}
              />
            </div>

            {/* Patient Document Upload */}
            {structuredNote &&
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4">
                <Button
                  onClick={() => setDocumentUploadOpen(!documentUploadOpen)}
                  variant="outline"
                  className="w-full gap-2 text-slate-700 border-slate-300 hover:bg-slate-50"
                >
                  <Upload className="w-4 h-4" />
                  Import Patient Documents
                </Button>
              </div>
              {documentUploadOpen &&
              <div className="border-t border-slate-200">
                <PatientDocumentUpload
                  onClose={() => setDocumentUploadOpen(false)}
                  onDataExtracted={(extractedData, fileName) => {
                    // Apply extracted data to note
                    if (extractedData.lab_results?.length > 0) {
                      const labSummary = extractedData.lab_results
                        .map(r => `${r.test_name}: ${r.value} ${r.unit || ''}`)
                        .join(", ");
                      setStructuredNote(prev => ({
                        ...prev,
                        physical_exam: (prev.physical_exam || '') + (prev.physical_exam ? '\n' : '') + `LAB RESULTS (${fileName}): ${labSummary}`
                      }));
                    }
                    if (extractedData.diagnoses?.length > 0) {
                      setStructuredNote(prev => ({
                        ...prev,
                        diagnoses: [...(prev.diagnoses || []), ...extractedData.diagnoses]
                      }));
                    }
                    if (extractedData.medications?.length > 0) {
                      setStructuredNote(prev => ({
                        ...prev,
                        medications: [...(prev.medications || []), ...extractedData.medications]
                      }));
                    }
                    if (extractedData.imaging_findings) {
                      setStructuredNote(prev => ({
                        ...prev,
                        physical_exam: (prev.physical_exam || '') + (prev.physical_exam ? '\n' : '') + `IMAGING (${fileName}): ${extractedData.imaging_findings}`
                      }));
                    }
                    if (extractedData.medical_history?.length > 0) {
                      const historyText = extractedData.medical_history.join(", ");
                      setPatientHistory(prev => ({
                        ...prev,
                        chronic_conditions: [...(prev?.chronic_conditions || []), ...extractedData.medical_history]
                      }));
                    }
                  }}
                />
              </div>
            }
            </div>
            }


            {/* Previous Encounters Summary */}
            {rawData && (rawData.patient_id || rawData.patient_name) &&
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4">
                  <Button
                onClick={() => setEncountersSummaryOpen(true)}
                variant="outline"
                className="w-full gap-2 text-slate-700 border-slate-300 hover:bg-slate-50">

                    <Clock className="w-4 h-4" />
                    View Previous Encounters Summary
                  </Button>
                </div>
              </div>
          }

            {/* Patient History Panel */}
            <PatientHistoryPanel
            history={patientHistory}
            loading={loadingHistory}
            onApplyToNote={handleApplyHistory} />


            {/* ICD-10 Code Suggestions */}
            <ICD10Suggestions
            suggestions={icd10Suggestions}
            loading={loadingIcd10}
            onAccept={(code) => {
              const newDiagnosis = `${code.diagnosis} (${code.code})`;
              setStructuredNote((prev) => ({
                ...prev,
                diagnoses: [...(prev.diagnoses || []), newDiagnosis]
              }));
            }}
            onApplyToNote={(codes) => {
              const newDiagnoses = codes.map((code) => `${code.diagnosis} (${code.code})`);
              setStructuredNote((prev) => ({
                ...prev,
                diagnoses: [...(prev.diagnoses || []), ...newDiagnoses]
              }));
            }} />


            {/* Structured Note Preview */}
            <StructuredNotePreview
            note={structuredNote}
            onFinalize={handleFinalize}
            onUpdate={handleUpdate}
            onReanalyze={handleReanalyze}
            guidelineRecommendations={guidelineRecommendations}
            loadingGuidelines={loadingGuidelines}
            medicationRecommendations={medicationRecommendations}
            loadingMedications={loadingMedications}
            onGenerateEducationMaterials={() => setEducationMaterialsOpen(true)} />

          </>
        }
      </div>

      {/* Smart Guideline Panel */}
      {structuredNote &&
      <SmartGuidelinePanel
        noteContent={rawData?.raw_note || ""}
        diagnoses={structuredNote.diagnoses || []}
        medications={structuredNote.medications || []}
        patientHistory={patientHistory} />

      }

      {/* Patient Education Materials */}
      <PatientEducationMaterials
        diagnoses={structuredNote?.diagnoses || []}
        plan={structuredNote?.plan || ""}
        medications={structuredNote?.medications || []}
        open={educationMaterialsOpen}
        onClose={() => setEducationMaterialsOpen(false)} />


      {/* New Patient Creation Dialog */}
      <NewPatientDialog
        open={newPatientDialogOpen}
        onClose={() => {
          setNewPatientDialogOpen(false);
          setPendingPatientData(null);
        }}
        patientData={pendingPatientData}
        onCreatePatient={handleCreatePatient} />


      {/* Previous Encounters Summary Dialog */}
      <PreviousEncountersSummary
        patientId={rawData?.patient_id}
        patientName={rawData?.patient_name}
        open={encountersSummaryOpen}
        onClose={() => setEncountersSummaryOpen(false)}
        onApplyToNote={(summaryText) => {
          setStructuredNote((prev) => ({
            ...prev,
            medical_history: summaryText
          }));
        }} />

    </>);

}