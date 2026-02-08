import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, FileText } from "lucide-react";
import { toast } from "sonner";

const noteTypes = [
  { value: "progress_note", label: "Progress Note" },
  { value: "h_and_p", label: "History & Physical" },
  { value: "discharge_summary", label: "Discharge Summary" },
  { value: "consult", label: "Consultation" },
  { value: "procedure_note", label: "Procedure Note" },
];

export default function ClinicalSectionInput({
  onSubmit,
  isProcessing,
  templates,
  clinicalData,
  onClinicalDataChange
}) {
  const [formData, setFormData] = useState({
    patient_name: "",
    patient_id: "",
    chief_complaint: "",
    note_type: "h_and_p",
    specialty: "",
    templateId: ""
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleClinicalDataChange = (section, value) => {
    onClinicalDataChange({
      ...clinicalData,
      [section]: value
    });
  };

  const handleSubmit = () => {
    if (!formData.patient_name || !formData.chief_complaint) {
      toast.error("Please provide patient name and chief complaint");
      return;
    }

    if (!clinicalData.history_and_physical && !clinicalData.review_of_systems && !clinicalData.physical_exam) {
      toast.error("Please fill in at least one clinical section");
      return;
    }

    onSubmit({
      ...formData,
      templateId: formData.templateId || undefined
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="w-5 h-5 text-blue-600" />
          <h2 className="text-2xl font-bold text-slate-900">Clinical Section Input</h2>
        </div>
        <p className="text-slate-600">Organize your clinical note by detailed sections</p>
      </div>

      {/* Patient & Note Information */}
      <Card className="p-6 space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Patient & Note Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Patient Name</label>
            <Input
              value={formData.patient_name}
              onChange={(e) => handleInputChange("patient_name", e.target.value)}
              placeholder="John Doe"
              className="rounded-lg"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Patient ID / MRN</label>
            <Input
              value={formData.patient_id}
              onChange={(e) => handleInputChange("patient_id", e.target.value)}
              placeholder="MRN123456"
              className="rounded-lg"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Chief Complaint</label>
            <Input
              value={formData.chief_complaint}
              onChange={(e) => handleInputChange("chief_complaint", e.target.value)}
              placeholder="e.g., Chest pain, persistent cough"
              className="rounded-lg"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Note Type</label>
            <Select value={formData.note_type} onValueChange={(v) => handleInputChange("note_type", v)}>
              <SelectTrigger className="rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {noteTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Specialty (Optional)</label>
            <Input
              value={formData.specialty}
              onChange={(e) => handleInputChange("specialty", e.target.value)}
              placeholder="e.g., Cardiology"
              className="rounded-lg"
            />
          </div>
          {templates.length > 0 && (
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Template (Optional)</label>
              <Select value={formData.templateId} onValueChange={(v) => handleInputChange("templateId", v)}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </Card>

      {/* Clinical Sections */}
      <div className="space-y-4">
        {/* History and Physical */}
        <Card className="p-6 border-blue-200">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">1</span>
              History and Physical
            </h3>
            <p className="text-sm text-slate-500 mt-1">Include medical history, past medical history, surgical history, medications, allergies, and any relevant clinical context.</p>
          </div>
          <Textarea
            value={clinicalData.history_and_physical}
            onChange={(e) => handleClinicalDataChange("history_and_physical", e.target.value)}
            placeholder="Patient's relevant medical history, current medications, allergies, past surgeries, family history, social history, etc."
            className="min-h-[150px] rounded-lg border-blue-200 focus:border-blue-400"
          />
        </Card>

        {/* Review of Systems */}
        <Card className="p-6 border-purple-200">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-bold">2</span>
              Review of Systems
            </h3>
            <p className="text-sm text-slate-500 mt-1">Document symptoms by system. Include positive and negative findings relevant to the chief complaint.</p>
          </div>
          <Textarea
            value={clinicalData.review_of_systems}
            onChange={(e) => handleClinicalDataChange("review_of_systems", e.target.value)}
            placeholder="Constitutional: fever, chills, weight changes
Cardiovascular: chest pain, palpitations, edema
Respiratory: cough, shortness of breath, wheezing
GI: nausea, vomiting, abdominal pain
Other systems as relevant..."
            className="min-h-[150px] rounded-lg border-purple-200 focus:border-purple-400"
          />
        </Card>

        {/* Physical Examination */}
        <Card className="p-6 border-emerald-200">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm font-bold">3</span>
              Physical Examination
            </h3>
            <p className="text-sm text-slate-500 mt-1">Document objective findings including vital signs, general appearance, and system-specific exams.</p>
          </div>
          <Textarea
            value={clinicalData.physical_exam}
            onChange={(e) => handleClinicalDataChange("physical_exam", e.target.value)}
            placeholder="Vital Signs: BP, HR, RR, Temp, O2 sat
General: alert and oriented, in mild/moderate/severe distress
HEENT: normal, no lymphadenopathy
Cardiovascular: regular rate and rhythm
Respiratory: clear to auscultation bilaterally
Abdomen: soft, non-tender
Extremities: no edema
Neuro: motor and sensory intact
Other exam findings..."
            className="min-h-[150px] rounded-lg border-emerald-200 focus:border-emerald-400"
          />
        </Card>
      </div>

      {/* Submit Button */}
      <div className="flex gap-3 pt-4">
        <Button
          onClick={handleSubmit}
          disabled={isProcessing}
          className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl gap-2 h-11"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Process Clinical Note"
          )}
        </Button>
      </div>
    </div>
  );
}