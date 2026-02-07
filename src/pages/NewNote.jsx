import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import NoteTranscriptionInput from "../components/notes/NoteTranscriptionInput";
import StructuredNotePreview from "../components/notes/StructuredNotePreview";
import SmartGuidelinePanel from "../components/guidelines/SmartGuidelinePanel";
import PatientHistoryPanel from "../components/notes/PatientHistoryPanel";
import HistoryFocusSelector from "../components/notes/HistoryFocusSelector";
import ICD10Suggestions from "../components/notes/ICD10Suggestions";
import PatientEducationMaterials from "../components/notes/PatientEducationMaterials";
import NewPatientDialog from "../components/notes/NewPatientDialog";

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
  const navigate = useNavigate();

  const { data: templates = [] } = useQuery({
    queryKey: ["noteTemplates"],
    queryFn: () => base44.entities.NoteTemplate.list(),
  });

  const loadPatientHistory = async (patientId, patientName, focusArea = "comprehensive") => {
    if (!patientId && !patientName) return;

    setLoadingHistory(true);
    try {
      const allNotes = await base44.entities.ClinicalNote.list();
      const patientNotes = allNotes.filter(note => 
        (patientId && note.patient_id === patientId) || 
        (patientName && note.patient_name?.toLowerCase() === patientName.toLowerCase())
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
  ${patientNotes.slice(0, 5).map(note => `
  Date: ${note.date_of_visit}
  Diagnoses: ${note.diagnoses?.join(", ") || "N/A"}
  Medications: ${note.medications?.join(", ") || "N/A"}
  Assessment: ${note.assessment || "N/A"}
  Plan: ${note.plan || "N/A"}
  `).join("\n---\n")}

  Extract and consolidate:
  1. chronic_conditions - Ongoing/chronic conditions (prioritize ${focusArea} conditions)
  2. allergies - Drug or other allergies mentioned
  3. current_medications - Active medications (prioritize ${focusArea}-related)
  4. past_procedures - Surgical procedures or major interventions (prioritize ${focusArea}-related)
  5. trends - Analyze changes over time: Are conditions worsening/improving? Medication changes? New developments? (2-3 sentences highlighting key trends)`;

      const history = await base44.integrations.Core.InvokeLLM({
        prompt: historyPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            chronic_conditions: { type: "array", items: { type: "string" } },
            allergies: { type: "array", items: { type: "string" } },
            current_medications: { type: "array", items: { type: "string" } },
            past_procedures: { type: "array", items: { type: "string" } },
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
      // Check if patient exists
      if (noteData.patient_id) {
        const existingPatients = await base44.entities.Patient.filter({ patient_id: noteData.patient_id });
        
        if (existingPatients.length === 0) {
          // Patient doesn't exist, prompt to create
          setPendingPatientData(noteData);
          setNewPatientDialogOpen(true);
          setIsProcessing(false);
          return;
        }
      }

      // Load patient history proactively
      if (noteData.patient_id || noteData.patient_name) {
        loadPatientHistory(noteData.patient_id, noteData.patient_name, historyFocus);
      }

      const template = templates.find(t => t.id === templateId);
      
      let prompt = `You are a medical scribe AI. Given the following clinical note, extract and structure the information accurately.

      Patient: ${noteData.patient_name}
      Note Type: ${noteData.note_type}
      Specialty: ${noteData.specialty || "General"}
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
          medications: { type: "array", items: { type: "string" } },
        },
      };

      if (template && template.sections) {
        // Filter only enabled sections and sort by order
        const activeSections = template.sections
          .filter(section => section.enabled !== false)
          .sort((a, b) => (a.order || 0) - (b.order || 0));

        // Apply conditional logic filtering
        const applicableSections = activeSections.filter(section => {
          if (!section.conditional_logic?.enabled) return true;

          const { condition_type, condition_value } = section.conditional_logic;

          if (condition_type === "note_type") {
            return noteData.note_type === condition_value;
          } else if (condition_type === "specialty") {
            return noteData.specialty?.toLowerCase().includes(condition_value?.toLowerCase());
          } else if (condition_type === "diagnosis_contains") {
            return noteData.diagnoses?.some(d => d.toLowerCase().includes(condition_value?.toLowerCase()));
          } else if (condition_type === "chronic_condition_contains") {
            return patientHistory?.chronic_conditions?.some(c => c.toLowerCase().includes(condition_value?.toLowerCase()));
          } else if (condition_type === "medication_contains") {
            return patientHistory?.current_medications?.some(m => m.toLowerCase().includes(condition_value?.toLowerCase()));
          } else if (condition_type === "allergy_contains") {
            return patientHistory?.allergies?.some(a => a.toLowerCase().includes(condition_value?.toLowerCase()));
          }
          return true;
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
            section.ai_instructions_detailed.field_instructions.forEach(field => {
              prompt += `     • ${field.field_name}: ${field.instructions}\n`;
            });
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
        
        // Build schema from applicable sections
        const properties = {};
        applicableSections.forEach(section => {
          const sectionKey = section.name.toLowerCase().replace(/\s+/g, '_');
          properties[sectionKey] = { type: "string" };
        });
        
        schema = {
          type: "object",
          properties,
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
        response_json_schema: schema,
      });

      console.log("AI Extraction Result:", result);
      
      if (!result || Object.keys(result).length === 0) {
        throw new Error("LLM returned empty result - check browser console for prompt and schema");
      }
      
      // Merge patient history automatically when available
      const mergedNote = { ...noteData, ...result };
      
      // If patient history was loaded and medical_history is empty, auto-apply it
      if (patientHistory && (!result.medical_history || result.medical_history === "Not extracted")) {
        mergedNote.medical_history = `CHRONIC CONDITIONS: ${patientHistory.chronic_conditions?.join(", ") || "None"}
ALLERGIES: ${patientHistory.allergies?.join(", ") || "None"}  
CURRENT MEDICATIONS: ${patientHistory.current_medications?.join(", ") || "None"}
PAST PROCEDURES: ${patientHistory.past_procedures?.join(", ") || "None"}
TRENDS: ${patientHistory.trends || "N/A"}`;
      }
      
      setStructuredNote(mergedNote);

      // Update template usage count and last_used
      if (templateId) {
        await base44.entities.NoteTemplate.update(templateId, {
          usage_count: (template?.usage_count || 0) + 1,
          last_used: new Date().toISOString()
        });
      }

      // Automatically fetch guideline recommendations and ICD-10 codes in parallel
      try {
        fetchGuidelineRecommendations(result);
        generateICD10Suggestions(result);
      } catch (error) {
        console.error("Failed to fetch additional data:", error);
      }
    } catch (error) {
      console.error("Error processing note:", error);
      alert("Failed to process note. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const fetchGuidelineRecommendations = async (noteData) => {
    setLoadingGuidelines(true);
    try {
      // Extract conditions from diagnoses
      const conditions = [];
      if (noteData.diagnoses && noteData.diagnoses.length > 0) {
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

Keep it actionable and concise (4-6 bullet points).`,
            add_context_from_internet: true,
            response_json_schema: {
              type: "object",
              properties: {
                summary: { type: "string" },
                key_points: { type: "array", items: { type: "string" } },
                sources: { type: "array", items: { type: "string" } },
              },
            },
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
      const diagnosesList = noteData.diagnoses?.join(", ") || "";
      const assessment = noteData.assessment || "";

      if (!diagnosesList && !assessment) {
        setLoadingIcd10(false);
        return;
      }

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Suggest appropriate ICD-10 codes for the following clinical information:

Diagnoses: ${diagnosesList}
Assessment: ${assessment}

For each diagnosis, provide the most specific ICD-10 code with its description. Return 3-6 relevant codes.`,
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
                  diagnosis: { type: "string" }
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

  const handleApplyHistory = (history) => {
    const historyText = `CHRONIC CONDITIONS: ${history.chronic_conditions?.join(", ") || "None"}
ALLERGIES: ${history.allergies?.join(", ") || "None"}  
CURRENT MEDICATIONS: ${history.current_medications?.join(", ") || "None"}
PAST PROCEDURES: ${history.past_procedures?.join(", ") || "None"}`;

    setStructuredNote(prev => ({
      ...prev,
      medical_history: historyText
    }));
  };

  const handleFinalize = async () => {
    const created = await base44.entities.ClinicalNote.create({
      ...rawData,
      ...structuredNote,
      status: "finalized",
    });
    navigate(createPageUrl(`NoteDetail?id=${created.id}`));
  };

  const handleUpdate = (field, value) => {
    setStructuredNote(prev => ({ ...prev, [field]: value }));
  };

  const handleCreatePatient = async (patientData) => {
    try {
      await base44.entities.Patient.create({
        patient_name: patientData.patient_name,
        patient_id: patientData.patient_id,
        date_of_birth: patientData.date_of_birth || null,
        gender: patientData.gender || null,
        contact_number: patientData.contact_number || null,
        email: patientData.email || null,
      });

      // Continue with note processing
      setRawData(pendingPatientData);
      loadPatientHistory(
        pendingPatientData.patient_id, 
        pendingPatientData.patient_name, 
        historyFocus
      );
      
      // Continue processing the note
      setIsProcessing(true);
      processNoteData(pendingPatientData);
    } catch (error) {
      console.error("Failed to create patient:", error);
      alert("Failed to create patient. Please try again.");
    }
  };

  const processNoteData = async (noteData) => {
    try {
      const template = templates.find(t => t.id === noteData.templateId);
      
      let prompt = `You are a medical scribe AI. Given the following clinical note, extract and structure the information accurately.

Patient: ${noteData.patient_name}
Note Type: ${noteData.note_type}
Specialty: ${noteData.specialty || "General"}
Raw Note:
${noteData.raw_note}`;

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
          medications: { type: "array", items: { type: "string" } },
        },
      };

      if (template && template.sections) {
        const activeSections = template.sections
          .filter(section => section.enabled !== false)
          .sort((a, b) => (a.order || 0) - (b.order || 0));

        const applicableSections = activeSections.filter(section => {
          if (!section.conditional_logic?.enabled) return true;
          const { condition_type, condition_value } = section.conditional_logic;
          
          if (condition_type === "note_type") {
            return noteData.note_type === condition_value;
          } else if (condition_type === "specialty") {
            return noteData.specialty?.toLowerCase().includes(condition_value?.toLowerCase());
          } else if (condition_type === "diagnosis_contains") {
            return noteData.diagnoses?.some(d => d.toLowerCase().includes(condition_value?.toLowerCase()));
          } else if (condition_type === "chronic_condition_contains") {
            return patientHistory?.chronic_conditions?.some(c => c.toLowerCase().includes(condition_value?.toLowerCase()));
          } else if (condition_type === "medication_contains") {
            return patientHistory?.current_medications?.some(m => m.toLowerCase().includes(condition_value?.toLowerCase()));
          } else if (condition_type === "allergy_contains") {
            return patientHistory?.allergies?.some(a => a.toLowerCase().includes(condition_value?.toLowerCase()));
          }
          return true;
        });

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
            section.ai_instructions_detailed.field_instructions.forEach(field => {
              prompt += `     • ${field.field_name}: ${field.instructions}\n`;
            });
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

        const properties = {};
        applicableSections.forEach(section => {
          const sectionKey = section.name.toLowerCase().replace(/\s+/g, '_');
          properties[sectionKey] = { type: "string" };
        });
        schema = { type: "object", properties };
      }

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: schema,
      });

      if (!result || Object.keys(result).length === 0) {
        throw new Error("LLM returned empty result");
      }

      const mergedNote = { ...noteData, ...result };
      if (patientHistory && (!result.medical_history || result.medical_history === "Not extracted")) {
        mergedNote.medical_history = `CHRONIC CONDITIONS: ${patientHistory.chronic_conditions?.join(", ") || "None"}
ALLERGIES: ${patientHistory.allergies?.join(", ") || "None"}  
CURRENT MEDICATIONS: ${patientHistory.current_medications?.join(", ") || "None"}
PAST PROCEDURES: ${patientHistory.past_procedures?.join(", ") || "None"}
TRENDS: ${patientHistory.trends || "N/A"}`;
      }

      setStructuredNote(mergedNote);

      if (noteData.templateId) {
        await base44.entities.NoteTemplate.update(noteData.templateId, {
          usage_count: (template?.usage_count || 0) + 1,
          last_used: new Date().toISOString()
        });
      }

      try {
        fetchGuidelineRecommendations(result);
        generateICD10Suggestions(result);
      } catch (error) {
        console.error("Failed to fetch additional data:", error);
      }
    } catch (error) {
      console.error("Error processing note:", error);
      alert("Failed to process note. Please try again.");
    } finally {
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
      medications: "List all medications mentioned with dosages",
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
      medications: { type: "object", properties: { result: { type: "array", items: { type: "string" } } } },
    };

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Based on the following clinical note, ${fieldPrompts[field]}:

Raw Note:
${rawData.raw_note}

Current structured data:
${JSON.stringify(structuredNote, null, 2)}`,
      response_json_schema: responseSchemas[field],
    });

    return result.result;
  };

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-6">
        {!structuredNote ? (
          <NoteTranscriptionInput 
            onSubmit={(noteData, templateId) => {
              handleSubmit(noteData, templateId);
            }}
            isProcessing={isProcessing}
            templates={templates}
          />
        ) : (
          <>
            {/* History Focus Selector */}
            {rawData && (rawData.patient_id || rawData.patient_name) && (
              <HistoryFocusSelector
                value={historyFocus}
                onChange={(value) => {
                  setHistoryFocus(value);
                  loadPatientHistory(rawData.patient_id, rawData.patient_name, value);
                }}
                onRefresh={() => loadPatientHistory(rawData.patient_id, rawData.patient_name, historyFocus)}
                disabled={loadingHistory}
              />
            )}

            {/* Patient History Panel */}
            <PatientHistoryPanel 
              history={patientHistory}
              loading={loadingHistory}
              onApplyToNote={handleApplyHistory}
            />

            {/* ICD-10 Code Suggestions */}
            <ICD10Suggestions
              suggestions={icd10Suggestions}
              loading={loadingIcd10}
              onAccept={(code) => {
                const newDiagnosis = `${code.diagnosis} (${code.code})`;
                setStructuredNote(prev => ({
                  ...prev,
                  diagnoses: [...(prev.diagnoses || []), newDiagnosis]
                }));
              }}
            />

            {/* Structured Note Preview */}
            <StructuredNotePreview
              note={structuredNote}
              onFinalize={handleFinalize}
              onUpdate={handleUpdate}
              onReanalyze={handleReanalyze}
              guidelineRecommendations={guidelineRecommendations}
              loadingGuidelines={loadingGuidelines}
              onGenerateEducationMaterials={() => setEducationMaterialsOpen(true)}
            />
          </>
        )}
      </div>

      {/* Smart Guideline Panel */}
      {structuredNote && (
        <SmartGuidelinePanel
          noteContent={rawData?.raw_note || ""}
          diagnoses={structuredNote.diagnoses || []}
          medications={structuredNote.medications || []}
        />
      )}

      {/* Patient Education Materials */}
      <PatientEducationMaterials
        diagnoses={structuredNote?.diagnoses || []}
        plan={structuredNote?.plan || ""}
        medications={structuredNote?.medications || []}
        open={educationMaterialsOpen}
        onClose={() => setEducationMaterialsOpen(false)}
      />

      {/* New Patient Creation Dialog */}
      <NewPatientDialog
        open={newPatientDialogOpen}
        onClose={() => {
          setNewPatientDialogOpen(false);
          setPendingPatientData(null);
        }}
        patientData={pendingPatientData}
        onCreatePatient={handleCreatePatient}
      />
    </>
  );
}