import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, ArrowLeft } from "lucide-react";
import { createPageUrl } from "../../utils";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function NotificationButtons() {
  const [currentNoteId, setCurrentNoteId] = useState(null);

  useEffect(() => {
    // Get the current open note ID from localStorage
    const savedNoteId = localStorage.getItem("currentOpenNote");
    setCurrentNoteId(savedNoteId);
  }, []);

  const handleCreateNote = async () => {
    try {
      const newNote = await base44.entities.ClinicalNote.create({
        raw_note: "",
        patient_name: "New Patient",
        status: "draft"
      });
      window.location.href = createPageUrl(`NoteDetail?id=${newNote.id}`);
    } catch (error) {
      toast.error("Failed to create new note");
    }
  };

  const handleReturnToNote = () => {
    if (currentNoteId) {
      window.location.href = createPageUrl(`NoteDetail?id=${currentNoteId}`);
    } else {
      toast.error("No open note found");
    }
  };

  return (
    <div className="fixed right-5 bottom-20 z-40 flex flex-col gap-4">
      {/* Return to Note Button */}
      {currentNoteId && (
        <motion.button
          onClick={handleReturnToNote}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className="w-14 h-14 rounded-full bg-white shadow-xl border-2 border-transparent flex items-center justify-center transition-all"
          style={{
            background: "white",
            boxShadow: "0 4px 24px 0 rgba(59,130,246,0.25), 0 1.5px 6px 0 rgba(99,102,241,0.15)",
          }}
          title="Return to open note"
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #93c5fd 0%, #60a5fa 50%, #3b82f6 100%)",
              boxShadow: "inset 0 1px 3px rgba(255,255,255,0.5), 0 0 0 2px rgba(59,130,246,0.4)",
            }}
          >
            <ArrowLeft className="w-6 h-6 text-white drop-shadow" />
          </div>
        </motion.button>
      )}

      {/* Create New Note Button */}
      <motion.button
        onClick={handleCreateNote}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 rounded-full bg-white shadow-xl border-2 border-transparent flex items-center justify-center transition-all"
        style={{
          background: "white",
          boxShadow: "0 4px 24px 0 rgba(34,197,94,0.25), 0 1.5px 6px 0 rgba(99,102,241,0.15)",
        }}
        title="Create new note"
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, #86efac 0%, #4ade80 50%, #22c55e 100%)",
            boxShadow: "inset 0 1px 3px rgba(255,255,255,0.5), 0 0 0 2px rgba(34,197,94,0.4)",
          }}
        >
          <Plus className="w-6 h-6 text-white drop-shadow" />
        </div>
      </motion.button>
    </div>
  );
}