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
  };

  const handleFinalize = async () => {
    const created = await base44.entities.ClinicalNote.create({
      ...rawData,
      ...structuredNote,
      status: "finalized",
    });
    navigate(createPageUrl(`NoteDetail?id=${created.id}`));
  };

  const handleEdit = () => {
    setStructuredNote(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {!structuredNote ? (
        <NoteTranscriptionInput onSubmit={handleSubmit} isProcessing={isProcessing} />
      ) : (
        <StructuredNotePreview
          note={structuredNote}
          onFinalize={handleFinalize}
          onEdit={handleEdit}
        />
      )}
    </div>
  );
}