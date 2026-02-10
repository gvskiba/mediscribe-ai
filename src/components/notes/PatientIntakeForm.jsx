import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Loader2, FileText, AlertCircle } from "lucide-react";

export default function PatientIntakeForm({ onIntakeComplete, defaultPatientId = null, defaultPatientName = null }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    patient_age: "",
    gender: "",
    patient_id: defaultPatientId || "",
    chief_complaint: "",
    symptom_onset: "",
    symptom_duration: "",
    symptom_severity: "",
    associated_symptoms: "",
    medical_history: "",
    current_medications: "",
    allergies: "",
    recent_treatments: "",
    lifestyle_factors: ""
  });

  const steps = [
    {
      title: "Patient Information",
      description: "Basic patient details",
      fields: ["patient_age", "gender", "patient_id"]
    },
    {
      title: "Chief Complaint & Symptoms",
      description: "Present illness details",
      fields: ["chief_complaint", "symptom_onset", "symptom_duration", "symptom_severity", "associated_symptoms"]
    },
    {
      title: "Medical History",
      description: "Past medical background",
      fields: ["medical_history", "current_medications", "allergies"]
    },
    {
      title: "Recent Health Activity",
      description: "Recent treatments and lifestyle",
      fields: ["recent_treatments", "lifestyle_factors"]
    }
  ];

  const fieldLabels = {
    patient_age: "Age",
    gender: "Gender",
    patient_id: "Patient ID / MRN",
    chief_complaint: "What brings you in today?",
    symptom_onset: "When did the symptoms start?",
    symptom_duration: "How long have you had these symptoms?",
    symptom_severity: "Rate symptom severity (1-10)",
    associated_symptoms: "Any other symptoms?",
    medical_history: "Past medical conditions or surgeries?",
    current_medications: "Current medications (with doses if known)",
    allergies: "Drug or environmental allergies?",
    recent_treatments: "Recent treatments or hospitalizations?",
    lifestyle_factors: "Smoking, alcohol, exercise habits"
  };

  const fieldPlaceholders = {
    patient_age: "45",
    gender: "Select gender",
    patient_id: "12345",
    chief_complaint: "Persistent cough for 2 weeks",
    symptom_onset: "Started 2 weeks ago",
    symptom_duration: "2 weeks, ongoing",
    symptom_severity: "6/10",
    associated_symptoms: "Mild chest pain with deep breathing",
    medical_history: "High blood pressure, diabetes",
    current_medications: "Lisinopril 10mg daily, Metformin 1000mg twice daily",
    allergies: "Penicillin (rash), Codeine (severe nausea)",
    recent_treatments: "Visited urgent care 3 days ago",
    lifestyle_factors: "Former smoker (quit 5 years ago), exercises 3x/week"
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    const currentFields = steps[currentStep].fields;
    const allFilled = currentFields.every(field => {
      const value = formData[field];
      if (field === "symptom_severity") {
        return value && parseInt(value) >= 1 && parseInt(value) <= 10;
      }
      // patient_id is optional
      if (field === "patient_id") {
        return true;
      }
      return value?.trim();
    });
    
    if (!allFilled) {
      toast.error("Please fill in all required fields before proceeding");
      return;
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleProcessIntake = async () => {
    setIsProcessing(true);
    try {
      // Construct a narrative from intake form data
      const intakeNarrative = `Patient Presentation:
Age: ${formData.patient_age}
Gender: ${formData.gender}
Chief Complaint: ${formData.chief_complaint}

History of Present Illness:
Symptom onset: ${formData.symptom_onset}
Duration: ${formData.symptom_duration}
Severity: ${formData.symptom_severity}/10
Associated symptoms: ${formData.associated_symptoms}

Medical History: ${formData.medical_history}
Current Medications: ${formData.current_medications}
Allergies: ${formData.allergies}
Recent Treatments: ${formData.recent_treatments}
Lifestyle Factors: ${formData.lifestyle_factors}`;

      // Pass data to parent with the narrative - let parent handleSubmit do AI extraction
      const intakeOutput = {
        patient_age: formData.patient_age,
        gender: formData.gender,
        patient_id: formData.patient_id,
        patient_name: `Patient (Age ${formData.patient_age})`,
        raw_note: intakeNarrative,
        note_type: "progress_note"
      };

      toast.success("Intake form processed successfully");
      onIntakeComplete(intakeOutput);
    } catch (error) {
      console.error("Failed to process intake form:", error);
      toast.error("Failed to process intake form");
    } finally {
      setIsProcessing(false);
    }
  };

  const currentFields = steps[currentStep].fields;
  const progressPercent = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-6 border-b border-slate-200">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{steps[currentStep].title}</h2>
            <p className="text-sm text-slate-600">{steps[currentStep].description}</p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-600">
            <span>Step {currentStep + 1} of {steps.length}</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <div className="p-6 space-y-5">
        {currentFields.map(field => (
          <div key={field} className="space-y-2">
            <label className="text-sm font-semibold text-slate-900">
              {fieldLabels[field]}
            </label>
            
            {field === "patient_age" ? (
              <Input
                type="number"
                min="0"
                max="120"
                value={formData[field]}
                onChange={(e) => handleInputChange(field, e.target.value)}
                placeholder={fieldPlaceholders[field]}
                className="border-slate-300"
              />
            ) : field === "gender" ? (
              <select
                value={formData[field]}
                onChange={(e) => handleInputChange(field, e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            ) : field === "symptom_severity" ? (
              <div className="space-y-2">
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={formData[field]}
                  onChange={(e) => handleInputChange(field, e.target.value)}
                  placeholder={fieldPlaceholders[field]}
                  className="border-slate-300"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Mild</span>
                  <span>Moderate</span>
                  <span>Severe</span>
                </div>
              </div>
            ) : ["medical_history", "associated_symptoms", "recent_treatments", "lifestyle_factors", "current_medications", "allergies"].includes(field) ? (
              <Textarea
                value={formData[field]}
                onChange={(e) => handleInputChange(field, e.target.value)}
                placeholder={fieldPlaceholders[field]}
                className="min-h-[100px] border-slate-300 focus:border-blue-400"
              />
            ) : (
              <Input
                value={formData[field]}
                onChange={(e) => handleInputChange(field, e.target.value)}
                placeholder={fieldPlaceholders[field]}
                className="border-slate-300 focus:border-blue-400"
              />
            )}
          </div>
        ))}

        {/* Optional helpful tips */}
        {currentStep === 1 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 flex gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p><strong>Tip:</strong> Be specific about when symptoms started and what makes them better or worse.</p>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between gap-3">
        <Button
          onClick={handleBack}
          disabled={currentStep === 0 || isProcessing}
          variant="outline"
          className="text-slate-700 border-slate-300"
        >
          Back
        </Button>

        {currentStep < steps.length - 1 ? (
          <Button
            onClick={handleNext}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleProcessIntake}
            disabled={isProcessing}
            className="bg-green-600 hover:bg-green-700 gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Complete & Pre-fill Note"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}