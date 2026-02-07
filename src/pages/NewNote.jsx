import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import NoteTranscriptionInput from "../components/notes/NoteTranscriptionInput";
import StructuredNotePreview from "../components/notes/StructuredNotePreview";
import SmartGuidelinePanel from "../components/guidelines/SmartGuidelinePanel";
import PatientHistoryPanel from "../components/notes/PatientHistoryPanel";
import ICD10Suggestions from "../components/notes/ICD10Suggestions";
import PatientEducationMaterials from "../components/notes/PatientEducationMaterials";

export default function NewNote() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [structuredNote, setStructuredNote] = useState(null);
  const [rawData, setRawData] = useState(null);
  const [guidelineRecommendations, setGuidelineRecommendations] = useState([]);
  const [loadingGuidelines, setLoadingGuidelines] = useState(false);
  const [patientHistory, setPatientHistory] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [icd10Suggestions, setIcd10Suggestions] = useState([]);
  const [loadingIcd10, setLoadingIcd10] = useState(false);
  const [educationMaterialsOpen, setEducationMaterialsOpen] = useState(false);
  const navigate = useNavigate();

  const { data: templates = [] } = useQuery({
    queryKey: ["noteTemplates"],
    queryFn: () => base44.entities.NoteTemplate.list(),
  });

  const loadPatientHistory = async (patientId, patientName) => {
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

      const historyPrompt = `Analyze these previous clinical notes for patient ${patientName} and extract a comprehensive medical history summary.

Previous Notes:
${patientNotes.slice(0, 5).map(note => `
Date: ${note.date_of_visit}
Diagnoses: ${note.diagnoses?.join(", ") || "N/A"}
Medications: ${note.medications?.join(", ") || "N/A"}
Assessment: ${note.assessment || "N/A"}
Plan: ${note.plan || "N/A"}
`).join("\n---\n")}

Extract and consolidate:
1. chronic_conditions - Ongoing/chronic conditions (no acute/resolved conditions)
2. allergies - Drug or other allergies mentioned
3. current_medications - Active medications the patient is taking
4. past_procedures - Surgical procedures or major interventions`;

      const history = await base44.integrations.Core.InvokeLLM({
        prompt: historyPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            chronic_conditions: { type: "array", items: { type: "string" } },
            allergies: { type: "array", items: { type: "string" } },
            current_medications: { type: "array", items: { type: "string" } },
            past_procedures: { type: "array", items: { type: "string" } }
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
    
    // Load patient history in parallel
    if (noteData.patient_id || noteData.patient_name) {
      loadPatientHistory(noteData.patient_id, noteData.patient_name);
    }

    const template = templates.find(t => t.id === templateId);
    
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
        medical_history: { type: "string" },
        review_of_systems: { type: "string" },
        physical_exam: { type: "string" },
        assessment: { type: "string" },
        plan: { type: "string" },
        diagnoses: { type: "array", items: { type: "string" } },
        medications: { type: "array", items: { type: "string" } },
      },
    };

    if (template && template.sections) {
      prompt += `\n\n=== FOLLOW THIS TEMPLATE STRUCTURE ===`;
      prompt += `\nTemplate: ${template.name}`;
      if (template.ai_instructions) {
        prompt += `\n\nGlobal Instructions: ${template.ai_instructions}`;
      }
      
      prompt += `\n\n=== REQUIRED SECTIONS ===`;
      prompt += `\nExtract information from the raw note above and populate each section below:\n`;
      
      template.sections.forEach((section, idx) => {
        prompt += `\n\n${idx + 1}. ${section.name}`;
        if (section.description) {
          prompt += `\n   Purpose: ${section.description}`;
        }
        if (section.ai_instructions) {
          prompt += `\n   Instructions: ${section.ai_instructions}`;
        }
        prompt += `\n   → Extract relevant content from the raw note to populate this section.`;
      });
      
      prompt += `\n\n=== IMPORTANT ===`;
      prompt += `\nUse ONLY the information from the raw note provided above. Do not add external information.`;
      prompt += `\nIf a section cannot be populated from the raw note, provide a brief note like "Not documented in this encounter."`;
      
      // Build schema from sections
      const properties = {};
      template.sections.forEach(section => {
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

1. chief_complaint - Extract the main reason for visit. Look in HPI, chief complaint, or opening statements.

2. medical_history - Extract past medical history, chronic conditions, surgical history, family history, social history. Consolidate all relevant historical information.

3. review_of_systems - Extract all symptoms mentioned by body system:
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

4. physical_exam - Extract ALL objective findings:
   - Vitals (BP, HR, RR, Temp, O2 sat)
   - General appearance
   - System-specific exams (CV, Resp, Abd, Extremities, Neuro, etc.)
   If exam findings are implied by the assessment or treatment, infer reasonable findings. If truly no exam documented, write "Physical examination not documented."

5. assessment - Extract or infer clinical assessment. This includes:
   - Interpretation of symptoms and findings
   - Differential diagnoses considered
   - Clinical impression
   Use information from throughout the note to build a comprehensive assessment.

6. plan - Extract comprehensive treatment plan:
   - Medications prescribed (with dosing)
   - Diagnostic tests ordered
   - Procedures planned
   - Follow-up appointments
   - Patient education/instructions
   - Referrals
   Consolidate all treatment-related information.

7. diagnoses - Extract ALL diagnoses, conditions, or problems mentioned. Include ICD-10 codes if stated. Return as an array of strings.

8. medications - Extract ALL medications mentioned (current, prescribed, discontinued). Include dosages if provided. Return as an array of strings.

=== CRITICAL RULES ===
- Extract information from ANYWHERE in the note (HPI, exam, plan, prescriptions, etc.)
- Make reasonable clinical inferences when information is implied
- Synthesize information scattered throughout the note
- ALWAYS populate ALL 8 fields - never return null or undefined
- Only use "Not documented" if there's absolutely no relevant information anywhere in the note`;
    }

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: schema,
    });

    setStructuredNote({ ...noteData, ...result });
    setIsProcessing(false);

    // Automatically fetch guideline recommendations and ICD-10 codes in parallel
    fetchGuidelineRecommendations(result);
    generateICD10Suggestions(result);
  };

  const fetchGuidelineRecommendations = async (noteData) => {
    setLoadingGuidelines(true);
    try {
      // Extract top conditions from diagnoses and assessment
      const conditions = [];
      if (noteData.diagnoses && noteData.diagnoses.length > 0) {
        conditions.push(...noteData.diagnoses.slice(0, 3));
      }

      if (conditions.length === 0) return;

      // Query guidelines for each condition
      const recommendations = await Promise.all(
        conditions.slice(0, 2).map(async (condition) => {
          const cleanCondition = condition.replace(/\(.*?\)/g, "").trim();
          const result = await base44.integrations.Core.InvokeLLM({
            prompt: `Provide brief, actionable clinical guideline recommendations for: ${cleanCondition}. Include key management points, first-line treatments, and any critical monitoring. Keep it concise (3-5 bullet points).`,
            add_context_from_internet: true,
            response_json_schema: {
              type: "object",
              properties: {
                summary: { type: "string" },
                key_points: { type: "array", items: { type: "string" } },
              },
            },
          });
          return { condition: cleanCondition, ...result };
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

  const handleReanalyze = async (field) => {
    const fieldPrompts = {
      chief_complaint: "Extract the chief complaint (main reason for visit) in 1-2 sentences",
      medical_history: "Extract relevant past medical history, chronic conditions, and surgical history in 2-3 sentences",
      review_of_systems: "Extract the systematic review of symptoms organized by body system",
      physical_exam: "Extract objective physical examination findings",
      assessment: "Provide a detailed clinical assessment including relevant findings and differential diagnoses",
      plan: "Provide a comprehensive treatment plan including medications, follow-ups, and orders",
      diagnoses: "List all diagnoses with ICD-10 codes if possible",
      medications: "List all medications mentioned with dosages",
    };

    const responseSchemas = {
      chief_complaint: { type: "object", properties: { result: { type: "string" } } },
      medical_history: { type: "object", properties: { result: { type: "string" } } },
      review_of_systems: { type: "object", properties: { result: { type: "string" } } },
      physical_exam: { type: "object", properties: { result: { type: "string" } } },
      assessment: { type: "object", properties: { result: { type: "string" } } },
      plan: { type: "object", properties: { result: { type: "string" } } },
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
            onSubmit={handleSubmit} 
            isProcessing={isProcessing}
            templates={templates}
          />
        ) : (
          <>
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
    </>
  );
}