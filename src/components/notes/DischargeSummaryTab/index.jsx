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
      const medicationsDetail = dischargeData.dischargeMedications
        .map((m) => `• ${m.name} ${m.dose} ${m.route}, ${m.frequency} (${m.purpose || "take as directed"})${m.importantNotes ? ` - ${m.importantNotes}` : ""}`)
        .join("\n");

      const followUpDetail = dischargeData.followUpPlan
        .map((f) => `• ${f.providerType}${f.providerName ? ` (${f.providerName})` : ""} - ${f.timeframe} - ${f.reason}${f.phone ? ` - ${f.phone}` : ""}`)
        .join("\n");

      const prompt = `You are generating detailed, patient-friendly discharge instructions. Use a ${readingLevel} reading level and simple, everyday language.

PATIENT DIAGNOSIS & CLINICAL CONTEXT:
Primary Diagnosis: ${dischargeData.finalImpression.primaryDx}
ICD-10: ${dischargeData.finalImpression.icd10}
Secondary Diagnoses: ${dischargeData.finalImpression.secondaryDx || "None"}
Clinical Summary: ${dischargeData.finalImpression.clinicalSummary}
Condition at Discharge: ${dischargeData.finalImpression.conditionAtDischarge}

CLINICAL WORKUP:
Labs: ${dischargeData.workupPerformed.labResults || "Per clinical evaluation"}
Imaging: ${dischargeData.workupPerformed.imagingResults || "None or per clinical evaluation"}
Procedures: ${dischargeData.workupPerformed.procedures || "None"}

TREATMENT IN FACILITY:
Medications Given: ${dischargeData.treatmentProvided.medicationsGivenInED || "See discharge medications"}
IV Fluids: ${dischargeData.treatmentProvided.ivFluids || "None"}
Response to Treatment: ${dischargeData.treatmentProvided.responseToTreatment || "Improved"}

DISCHARGE MEDICATIONS (with purposes):
${medicationsDetail || "None"}

PLANNED FOLLOW-UP:
${followUpDetail || "As needed"}

Generate comprehensive discharge instructions in this JSON structure:
{
  "diagnosis": {
    "patientFriendlyName": "Simple, everyday name for the condition (e.g., 'heart strain' instead of 'acute heart failure')",
    "patientExplanation": "2-3 sentences explaining WHAT this condition is in simple terms a non-medical person would understand"
  },
  "whatWeFound": "Plain language summary of tests/exams performed and key findings - explain WHY tests were done and what they showed",
  "treatmentReceived": "What was done to help the patient in plain language - medications given, treatments, procedures",
  
  "medicationInstructions": {
    "takeAtHome": [
      {
        "medicationName": "Drug name",
        "dosing": "How much and how often (e.g., 'One tablet twice daily')",
        "whyTaking": "Patient-friendly reason (e.g., 'to help your heart pump better')",
        "howToTake": "Special instructions (with food, on empty stomach, at bedtime, etc.)",
        "possibleSideEffects": ["Side effect 1", "Side effect 2"],
        "importantNotes": "Any critical tips (e.g., 'do not stop taking without calling doctor')"
      }
    ],
    "continueMedicationsFromHome": "List of medications to continue (if any)",
    "doNotTake": "Medications to avoid or stop (if any)"
  },
  
  "activityGuidelines": {
    "generalActivity": "What patient can and cannot do in plain language",
    "workStatus": "Can they work? Any restrictions? Timeline?",
    "drivingStatus": "Can they drive? When can they resume?",
    "exerciseGuidance": "What exercise is safe? Timeline for resuming normal activity?",
    "sexualActivity": "Guidance on when safe to resume (if relevant)"
  },
  
  "dietInstructions": {
    "generalDiet": "Overall diet approach in simple language",
    "specificFoodsToAvoid": ["Food 1", "Food 2"],
    "specificFoodsToEat": ["Beneficial food 1", "Beneficial food 2"],
    "fluidGuidance": "Any fluid restrictions or recommendations",
    "alcoholGuidance": "Alcohol use guidance"
  },
  
  "conditionSpecificEducation": [
    {
      "icon": "💡",
      "topic": "Important tip or fact",
      "content": "Patient-friendly explanation of why this matters"
    }
  ],
  
  "returnPrecautions": {
    "call911For": ["Severe symptom requiring immediate ER visit (e.g., 'chest pain or pressure')", "Another emergency symptom"],
    "returnERFor": ["Moderate concern that needs ER (e.g., 'pain that doesn\\'t go away with medication')", "Another concern"],
    "callDoctorFor": ["Mild concern to report at next visit (e.g., 'mild swelling that slowly gets worse')", "Another issue"]
  },
  
  "followUpPlans": {
    "appointments": ["Follow-up appointment details (provider, timeframe, reason)"],
    "labsOrImagingNeeded": ["Any tests that need to be done", "Timeline for tests"],
    "medications": "Any new prescriptions or changes to medications"
  }
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
            medicationInstructions: {
              type: "object",
              properties: {
                takeAtHome: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      medicationName: { type: "string" },
                      dosing: { type: "string" },
                      whyTaking: { type: "string" },
                      howToTake: { type: "string" },
                      possibleSideEffects: { type: "array", items: { type: "string" } },
                      importantNotes: { type: "string" },
                    },
                  },
                },
                continueMedicationsFromHome: { type: "string" },
                doNotTake: { type: "string" },
              },
            },
            activityGuidelines: {
              type: "object",
              properties: {
                generalActivity: { type: "string" },
                workStatus: { type: "string" },
                drivingStatus: { type: "string" },
                exerciseGuidance: { type: "string" },
                sexualActivity: { type: "string" },
              },
            },
            dietInstructions: {
              type: "object",
              properties: {
                generalDiet: { type: "string" },
                specificFoodsToAvoid: { type: "array", items: { type: "string" } },
                specificFoodsToEat: { type: "array", items: { type: "string" } },
                fluidGuidance: { type: "string" },
                alcoholGuidance: { type: "string" },
              },
            },
            conditionSpecificEducation: {
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
            returnPrecautions: {
              type: "object",
              properties: {
                call911For: { type: "array", items: { type: "string" } },
                returnERFor: { type: "array", items: { type: "string" } },
                callDoctorFor: { type: "array", items: { type: "string" } },
              },
            },
            followUpPlans: {
              type: "object",
              properties: {
                appointments: { type: "array", items: { type: "string" } },
                labsOrImagingNeeded: { type: "array", items: { type: "string" } },
                medications: { type: "string" },
              },
            },
          },
        },
      });

      setPatientInstructions(result);
      toast.success("Comprehensive patient instructions generated");
    } catch (error) {
      console.error("Failed to generate instructions:", error);
      toast.error("Failed to generate instructions");
    } finally {
      setGeneratingInstructions(false);
    }
  };

  return (
    <div style={{ color: '#e8f0fe', fontFamily: "'DM Sans', sans-serif", fontSize: 13, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <SummaryPanel
        data={dischargeData}
        onUpdateField={handleUpdateField}
        onArrayUpdate={handleArrayUpdate}
        onAddRow={handleAddRow}
        onRemoveRow={handleRemoveRow}
        onGenerateInstructions={generateInstructions}
        generating={generatingInstructions}
        saving={saving}
      />
      <ActionsPanel
        patientInstructions={patientInstructions}
        readingLevel={readingLevel}
        setReadingLevel={setReadingLevel}
        language={language}
        setLanguage={setLanguage}
        onGenerateInstructions={generateInstructions}
        generating={generatingInstructions}
        note={note}
        dischargeData={dischargeData}
      />
    </div>
  );
}