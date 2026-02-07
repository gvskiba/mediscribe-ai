import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import NoteTranscriptionInput from "../components/notes/NoteTranscriptionInput";
import StructuredNotePreview from "../components/notes/StructuredNotePreview";

export default function NewNote() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [structuredNote, setStructuredNote] = useState(null);
  const [rawData, setRawData] = useState(null);
  const [guidelineRecommendations, setGuidelineRecommendations] = useState([]);
  const [loadingGuidelines, setLoadingGuidelines] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (noteData) => {
    setIsProcessing(true);
    setRawData(noteData);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a medical scribe AI. Given the following clinical note, extract and structure the following fields. Be thorough and accurate.

Patient: ${noteData.patient_name}
Note Type: ${noteData.note_type}
Specialty: ${noteData.specialty || "General"}
Raw Note:
${noteData.raw_note}

Extract:
1. Chief Complaint - the main reason for the visit (brief, 1-2 sentences)
2. Assessment - clinical assessment including relevant findings, differential diagnoses
3. Plan - treatment plan, follow-ups, orders
4. Diagnoses - list of diagnoses/conditions mentioned (include ICD-10 codes if inferable)
5. Medications - list of all medications mentioned (include dosages if present)`,
      response_json_schema: {
        type: "object",
        properties: {
          chief_complaint: { type: "string" },
          assessment: { type: "string" },
          plan: { type: "string" },
          diagnoses: { type: "array", items: { type: "string" } },
          medications: { type: "array", items: { type: "string" } },
        },
      },
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
      assessment: "Provide a detailed clinical assessment including relevant findings and differential diagnoses",
      plan: "Provide a comprehensive treatment plan including medications, follow-ups, and orders",
      diagnoses: "List all diagnoses with ICD-10 codes if possible",
      medications: "List all medications mentioned with dosages",
    };

    const responseSchemas = {
      chief_complaint: { type: "object", properties: { result: { type: "string" } } },
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
    <div className="max-w-4xl mx-auto space-y-6">
      {!structuredNote ? (
        <NoteTranscriptionInput onSubmit={handleSubmit} isProcessing={isProcessing} />
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
  );
}