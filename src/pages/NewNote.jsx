import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import NoteTranscriptionInput from "../components/notes/NoteTranscriptionInput";
import StructuredNotePreview from "../components/notes/StructuredNotePreview";
import SmartGuidelinePanel from "../components/guidelines/SmartGuidelinePanel";

export default function NewNote() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [structuredNote, setStructuredNote] = useState(null);
  const [rawData, setRawData] = useState(null);
  const [guidelineRecommendations, setGuidelineRecommendations] = useState([]);
  const [loadingGuidelines, setLoadingGuidelines] = useState(false);
  const navigate = useNavigate();

  const { data: templates = [] } = useQuery({
    queryKey: ["noteTemplates"],
    queryFn: () => base44.entities.NoteTemplate.list(),
  });

  const handleSubmit = async (noteData, templateId) => {
    setIsProcessing(true);
    setRawData(noteData);

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
      prompt += `\n\nExtract:
1. Chief Complaint - main reason for visit (1-2 sentences)
2. Medical History - relevant past medical history, chronic conditions, surgical history (2-3 sentences)
3. Review of Systems - systematic review of symptoms by body system
4. Physical Exam - objective physical examination findings
5. Assessment - clinical assessment including findings, differentials
6. Plan - treatment plan, follow-ups, orders
7. Diagnoses - list of diagnoses/conditions (include ICD-10 if inferable)
8. Medications - list of medications (include dosages if present)`;
    }

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: schema,
    });

    setStructuredNote({ ...noteData, ...result });
    setIsProcessing(false);

    // Automatically fetch guideline recommendations
    fetchGuidelineRecommendations(result);
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
          <StructuredNotePreview
            note={structuredNote}
            onFinalize={handleFinalize}
            onUpdate={handleUpdate}
            onReanalyze={handleReanalyze}
            guidelineRecommendations={guidelineRecommendations}
            loadingGuidelines={loadingGuidelines}
          />
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
    </>
  );
}