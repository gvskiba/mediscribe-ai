import React, { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function AutoPopulateButton({ patient, note, noteId, onDataPopulated }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAutoPopulate = async () => {
    if (!patient) {
      toast.error("Please select a patient first");
      return;
    }

    setIsLoading(true);
    try {
      // Auto-populate note fields from patient data
      const updatedData = {
        patient_name: patient.patient_name,
        patient_id: patient.patient_id,
        patient_gender: patient.gender,
        date_of_birth: patient.date_of_birth,
        allergies: patient.allergies || [],
      };

      // Add chronic conditions to medical history
      if (patient.chronic_conditions && patient.chronic_conditions.length > 0) {
        updatedData.medical_history = patient.chronic_conditions.join("; ");
      }

      // Update note
      await base44.entities.ClinicalNote.update(noteId, updatedData);
      
      toast.success("Patient data populated into note");
      onDataPopulated?.();
    } catch (error) {
      console.error("Failed to populate patient data:", error);
      toast.error("Failed to populate patient data");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleAutoPopulate}
      disabled={!patient || isLoading}
      className="w-full px-3 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5"
      style={{
        background: patient && !isLoading ? "#00d4bc" : "#4a7299",
        color: patient && !isLoading ? "#050f1e" : "#2a4d72",
        cursor: patient && !isLoading ? "pointer" : "not-allowed",
        opacity: patient && !isLoading ? 1 : 0.6,
      }}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Sparkles className="w-3.5 h-3.5" />
      )}
      {isLoading ? "Populating…" : "Auto-Populate"}
    </button>
  );
}