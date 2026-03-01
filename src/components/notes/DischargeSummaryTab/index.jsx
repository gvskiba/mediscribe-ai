import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Printer, Send, Download, CheckCircle2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import SummaryPanel from "./SummaryPanel";
import ActionsPanel from "./ActionsPanel";
import "./styles.css";

export default function DischargeSummaryTab({
  note,
  noteId,
  queryClient,
  isFirstTab,
  isLastTab,
  handleBack,
  handleNext,
}) {
  const [dischargeData, setDischargeData] = useState({
    finalImpression: {
      primaryDx: note?.assessment || "",
      icd10: note?.diagnoses?.[0] || "",
      secondaryDx: note?.diagnoses?.slice(1).join("\n") || "",
      clinicalSummary: note?.summary || "",
      conditionAtDx: "Stable",
    },
    workupSummary: {
      labResults: "",
      imagingResults: "",
      procedures: "",
      consults: "",
    },
    treatmentSummary: {
      medsGiven: "",
      ivFluids: "",
      oxygen: "None — Room air throughout",
      response: "",
    },
    dischargeMedications: note?.medications || [],
    followUpPlan: [],
    mdmAndCoding: {
      mdmLevel: "99283 — Moderate Complexity",
      losMinutes: 0,
    },
    attendingSignature: {
      attendingName: "",
      npi: "",
      residentName: "",
      attestation: "I have reviewed the history, physical examination, diagnostic workup, and clinical course for this patient.",
    },
  });

  const [patientInstructions, setPatientInstructions] = useState(null);
  const [generatingInstructions, setGeneratingInstructions] = useState(false);
  const [readingLevel, setReadingLevel] = useState("6th grade");
  const [language, setLanguage] = useState("English");
  const [showPreview, setShowPreview] = useState(true);

  const handleUpdateDischargeData = (section, field, value) => {
    setDischargeData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const generateInstructions = async () => {
    if (!dischargeData.finalImpression.primaryDx) {
      toast.error("Primary diagnosis required to generate instructions");
      return;
    }

    setGeneratingInstructions(true);
    try {
      const medsText = dischargeData.dischargeMedications
        .map((m) => `${m.name} ${m.dose} ${m.frequency}`)
        .join("\n");

      const prompt = `Generate plain-language discharge instructions for a patient with the following clinical information:

PRIMARY DIAGNOSIS: ${dischargeData.finalImpression.primaryDx}
ICD-10: ${dischargeData.finalImpression.icd10}
SECONDARY DIAGNOSES: ${dischargeData.finalImpression.secondaryDx || "None"}
CLINICAL SUMMARY: ${dischargeData.finalImpression.clinicalSummary}

WORKUP PERFORMED:
Labs: ${dischargeData.workupSummary.labResults}
Imaging: ${dischargeData.workupSummary.imagingResults}
Procedures: ${dischargeData.workupSummary.procedures}

TREATMENT PROVIDED:
Medications: ${dischargeData.treatmentSummary.medsGiven}
IV Fluids: ${dischargeData.treatmentSummary.ivFluids}

DISCHARGE MEDICATIONS:
${medsText}

Generate comprehensive patient discharge instructions including:
1. Patient-friendly diagnosis explanation (2-3 sentences)
2. What we found (plain language)
3. Activity instructions (specific to diagnosis)
4. Diet instructions
5. Medication purposes explained in lay language
6. Follow-up appointments needed
7. Return precautions (call 911, go to ER, call doctor)
8. 3-5 condition-specific education tips

Use ${readingLevel} reading level. Plain language, avoid medical jargon.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            diagnosisFriendly: { type: "string" },
            whatWeFound: { type: "string" },
            activityInstructions: { type: "string" },
            dietInstructions: { type: "string" },
            medicationPurposes: { type: "array", items: { type: "string" } },
            followUpNeeded: { type: "array", items: { type: "string" } },
            returnImmediately: { type: "array", items: { type: "string" } },
            callDoctor: { type: "array", items: { type: "string" } },
            educationTips: { type: "array", items: { type: "string" } },
          },
        },
      });

      setPatientInstructions(result);
      toast.success("Patient instructions generated successfully");
    } catch (error) {
      console.error("Failed to generate instructions:", error);
      toast.error("Failed to generate instructions");
    } finally {
      setGeneratingInstructions(false);
    }
  };

  const saveDischargeSummary = async () => {
    try {
      await base44.entities.ClinicalNote.update(noteId, {
        discharge_summary: JSON.stringify(dischargeData),
      });
      queryClient.invalidateQueries({ queryKey: ["note", noteId] });
      toast.success("Discharge summary saved");
    } catch (error) {
      console.error("Failed to save:", error);
      toast.error("Failed to save");
    }
  };

  return (
    <div className="discharge-summary-container">
      <div className="discharge-grid">
        {/* Left Panel - Summary */}
        <SummaryPanel
          data={dischargeData}
          onUpdate={handleUpdateDischargeData}
          onGenerateInstructions={generateInstructions}
          generating={generatingInstructions}
          onSave={saveDischargeSummary}
        />

        {/* Right Panel - Actions */}
        <ActionsPanel
          patientInstructions={patientInstructions}
          readingLevel={readingLevel}
          setReadingLevel={setReadingLevel}
          language={language}
          setLanguage={setLanguage}
          onGenerateInstructions={generateInstructions}
          generating={generatingInstructions}
          showPreview={showPreview}
          note={note}
          dischargeData={dischargeData}
        />
      </div>

      {/* Bottom Navigation */}
      <div className="discharge-nav-bar">
        <div className="flex items-center gap-2">
          {!isFirstTab() && (
            <button
              onClick={handleBack}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isLastTab() && (
            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Next
              <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}