import React, { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "../utils";
import { Loader2 } from "lucide-react";

export default function NewNote() {
  useEffect(() => {
    const createNote = async () => {
      try {
        const newNote = await base44.entities.ClinicalNote.create({
          raw_note: "",
          patient_name: "New Patient",
          status: "draft"
        });
        window.location.href = createPageUrl(`NoteDetail?id=${newNote.id}`);
      } catch (error) {
        console.error("Failed to create note:", error);
        window.location.href = createPageUrl("NotesLibrary");
      }
    };

    createNote();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-slate-600">Creating new note...</p>
      </div>
    </div>
  );
}