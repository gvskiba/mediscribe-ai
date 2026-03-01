import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import SummaryPanel from "./SummaryPanel";
import ActionsPanel from "./ActionsPanel";

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
      icd10: note?.diagnoses?.[0]?.split(" - ")[0] || "",
      secondaryDx: note?.diagnoses?.slice(1).join("\n") || "",
      clinicalSummary: note?.summary || "",
      conditionAtDischarge: "Stable",
      mdmLevel: "99283",
    },
    workupPerformed: {
      labResults: "",
      imagingResults: "",
      procedures: "",
      consults: "",
    },
    treatmentProvided: {
      medicationsGivenInED: "",
      ivFluids: "",
      oxygenTherapy: "None — Room air throughout",
      responseToTreatment: "",
    },
    dischargeMedications: [],
    followUpPlan: [],
    patientAcknowledgment: {
      instructionsExplained: false,
      patientUnderstands: false,
      interpreterUsed: false,
      languageUsed: "English",
      nurseInitials: "",
    },
    attendingPhysician: "",
    npi: "",
    residentPhysician: "",
    attestation: "I have reviewed the history, physical examination, diagnostic workup, and clinical course for this patient. The discharge summary and instructions have been reviewed and accurately represent the clinical encounter.",
    signedAt: null,
    status: "draft",
  });

  const [patientInstructions, setPatientInstructions] = useState(null);
  const [generatingInstructions, setGeneratingInstructions] = useState(false);
  const [readingLevel, setReadingLevel] = useState("6th grade");
  const [language, setLanguage] = useState("English");
  const [saving, setSaving] = useState(false);
  const autosaveTimeoutRef = useRef(null);

  // Autosave function
  const autosaveField = async (updatedData) => {
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }
    
    setSaving(true);
    autosaveTimeoutRef.current = setTimeout(async () => {
      try {
        await base44.entities.ClinicalNote.update(noteId, {
          discharge_summary: JSON.stringify(updatedData),
        });
        setSaving(false);
      } catch (error) {
        console.error("Autosave failed:", error);
        setSaving(false);
      }
    }, 800);
  };

  // Handle nested field updates with autosave
  const handleUpdateField = (path, value) => {
    const keys = path.split(".");
    const newData = JSON.parse(JSON.stringify(dischargeData));
    let current = newData;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    
    setDischargeData(newData);
    autosaveField(newData);
  };

  // Handle array updates (medications, followups)
  const handleArrayUpdate = (arrayPath, index, field, value) => {
    const newData = JSON.parse(JSON.stringify(dischargeData));
    const arr = newData[arrayPath];
    if (arr && arr[index]) {
      arr[index][field] = value;
    }
    setDischargeData(newData);
    autosaveField(newData);
  };

  const handleAddRow = (arrayPath) => {
    const newData = JSON.parse(JSON.stringify(dischargeData));
    if (arrayPath === "dischargeMedications") {
      newData[arrayPath].push({
        name: "",
        brandName: "",
        dose: "",
        route: "By mouth (PO)",
        frequency: "",
        duration: "",
        purpose: "",
        isNew: false,
        importantNotes: "",
        controlled: false,
      });
    } else if (arrayPath === "followUpPlan") {
      newData[arrayPath].push({
        providerType: "",
        providerName: "",
        timeframe: "",
        reason: "",
        phone: "",
        scheduled: false,
        appointmentDateTime: "",
      });
    }
    setDischargeData(newData);
    autosaveField(newData);
  };

  const handleRemoveRow = (arrayPath, index) => {
    const newData = JSON.parse(JSON.stringify(dischargeData));
    newData[arrayPath].splice(index, 1);
    setDischargeData(newData);
    autosaveField(newData);
  };

  const generateInstructions = async () => {
    if (!dischargeData.finalImpression.primaryDx || !dischargeData.finalImpression.icd10) {
      toast.error("Primary diagnosis and ICD-10 code required");
      return;
    }

    setGeneratingInstructions(true);
    try {
      const medsText = dischargeData.dischargeMedications
        .map((m) => `${m.name} ${m.dose} ${m.frequency}`)
        .join("\n");

      const medsText2 = dischargeData.dischargeMedications
        .map((m) => `${m.name} - ${m.purpose || "see medication list for details"}`)
        .join("\n");

      const prompt = `Generate plain-language discharge instructions for a patient. Use ${readingLevel} reading level.

PRIMARY DIAGNOSIS: ${dischargeData.finalImpression.primaryDx}
ICD-10: ${dischargeData.finalImpression.icd10}
SECONDARY DIAGNOSES: ${dischargeData.finalImpression.secondaryDx || "None"}
CLINICAL SUMMARY: ${dischargeData.finalImpression.clinicalSummary}

WORKUP PERFORMED:
Labs: ${dischargeData.workupPerformed.labResults || "See clinical summary"}
Imaging: ${dischargeData.workupPerformed.imagingResults || "See clinical summary"}
Procedures: ${dischargeData.workupPerformed.procedures || "None"}

TREATMENT PROVIDED:
Medications: ${dischargeData.treatmentProvided.medicationsGivenInED || "See discharge medications"}
IV Fluids: ${dischargeData.treatmentProvided.ivFluids || "None"}
Response: ${dischargeData.treatmentProvided.responseToTreatment || "Improved"}

DISCHARGE MEDICATIONS:
${medsText}

Generate in this structure:
{
  "diagnosis": {
    "patientFriendlyName": "Simple name for patient",
    "patientExplanation": "2-3 sentences explaining in simple language"
  },
  "whatWeFound": "Plain language summary of test/exam findings",
  "treatmentReceived": "What was done in the ED",
  "activityInstructions": {
    "generalActivity": "Activity recommendations",
    "workStatus": "Work restrictions if any",
    "drivingStatus": "Driving restrictions if any",
    "exerciseGuidance": "Exercise recommendations"
  },
  "dietInstructions": {
    "generalDiet": "General diet guidance",
    "specificRestrictions": ["Restriction 1", "Restriction 2"],
    "fluidGuidance": "Fluid guidance"
  },
  "returnPrecautions": {
    "call911For": ["Symptom 1 requiring emergency", "Symptom 2"],
    "returnERFor": ["Concern requiring ER", "Another concern"],
    "callDoctorFor": ["Issue to call doctor about", "Another issue"]
  },
  "patientEducation": [
    {"icon": "💡", "topic": "Topic name", "content": "Brief explanation"},
    {"icon": "💊", "topic": "Medication tips", "content": "Guidance"}
  ]
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            diagnosis: {
              type: "object",
              properties: {
                patientFriendlyName: { type: "string" },
                patientExplanation: { type: "string" },
              },
            },
            whatWeFound: { type: "string" },
            treatmentReceived: { type: "string" },
            activityInstructions: {
              type: "object",
              properties: {
                generalActivity: { type: "string" },
                workStatus: { type: "string" },
                drivingStatus: { type: "string" },
                exerciseGuidance: { type: "string" },
              },
            },
            dietInstructions: {
              type: "object",
              properties: {
                generalDiet: { type: "string" },
                specificRestrictions: { type: "array", items: { type: "string" } },
                fluidGuidance: { type: "string" },
              },
            },
            returnPrecautions: {
              type: "object",
              properties: {
                call911For: { type: "array", items: { type: "string" } },
                returnERFor: { type: "array", items: { type: "string" } },
                callDoctorFor: { type: "array", items: { type: "string" } },
              },
            },
            patientEducation: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  icon: { type: "string" },
                  topic: { type: "string" },
                  content: { type: "string" },
                },
              },
            },
          },
        },
      });

      setPatientInstructions(result);
      toast.success("Patient instructions generated");
    } catch (error) {
      console.error("Failed to generate instructions:", error);
      toast.error("Failed to generate instructions");
    } finally {
      setGeneratingInstructions(false);
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