import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, FileText, Wand2, Edit3, Plus } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import SnippetPicker from "../snippets/SnippetPicker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  templates = [],
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

  const [snippetPickerOpen, setSnippetPickerOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [aiGenerating, setAiGenerating] = useState(null);
  const [selectedText, setSelectedText] = useState("");
  const [selectionRange, setSelectionRange] = useState({ start: 0, end: 0 });
  const [showRefineMenu, setShowRefineMenu] = useState(false);
  const historyRef = useRef(null);
  const rosRef = useRef(null);
  const examRef = useRef(null);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleClinicalDataChange = (section, value) => {
    onClinicalDataChange({
      ...clinicalData,
      [section]: value
    });
  };

  const getTextareaRef = (section) => {
    switch(section) {
      case "history_and_physical":
        return historyRef;
      case "review_of_systems":
        return rosRef;
      case "physical_exam":
        return examRef;
      default:
        return null;
    }
  };

  const handleInsertSnippet = (snippetText) => {
    if (!activeSection) return;

    const currentText = clinicalData[activeSection] || "";
    const textarea = getTextareaRef(activeSection)?.current;

    if (textarea && document.activeElement === textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = currentText.substring(0, start) + snippetText + currentText.substring(end);
      handleClinicalDataChange(activeSection, newText);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + snippetText.length, start + snippetText.length);
      }, 0);
    } else {
      const newText = currentText ? currentText + "\n\n" + snippetText : snippetText;
      handleClinicalDataChange(activeSection, newText);
    }

    setSnippetPickerOpen(false);
  };

  const handleAIDraft = async (section) => {
    if (!formData.chief_complaint) {
      toast.error("Please enter chief complaint first");
      return;
    }

    setAiGenerating(section);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Draft a detailed ${section.replace(/_/g, " ")} section for a clinical note with the following:
- Chief Complaint: ${formData.chief_complaint}
- Patient Name: ${formData.patient_name}
- Specialty: ${formData.specialty || "General"}
- Note Type: ${formData.note_type}

Write a comprehensive and clinically appropriate ${section.replace(/_/g, " ")} section with proper medical terminology and formatting. Keep it detailed but concise.`,
        add_context_from_internet: false
      });
      
      handleClinicalDataChange(section, response);
      toast.success("Section drafted");
    } catch (error) {
      toast.error("Failed to generate section");
    } finally {
      setAiGenerating(null);
    }
  };

  const handleAIExpand = async (section) => {
    const currentText = clinicalData[section];
    if (!currentText || currentText.trim().length === 0) {
      toast.error("Please enter some text first");
      return;
    }

    setAiGenerating(section);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Expand the following clinical ${section.replace(/_/g, " ")} text into full, detailed paragraphs with proper medical formatting and terminology. Maintain clinical accuracy and professional tone:

${currentText}

Provide an expanded, clinically detailed version.`,
        add_context_from_internet: false
      });
      
      handleClinicalDataChange(section, response);
      toast.success("Section expanded");
    } catch (error) {
      toast.error("Failed to expand section");
    } finally {
      setAiGenerating(null);
    }
  };

  const handleTextSelection = (section) => {
    const textarea = getTextareaRef(section)?.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end);

    if (selected.trim().length > 0) {
      setSelectedText(selected);
      setSelectionRange({ start, end });
      setActiveSection(section);
      setShowRefineMenu(true);
    } else {
      setShowRefineMenu(false);
    }
  };

  const handleAddDetail = async () => {
    if (!selectedText || !activeSection) return;

    setAiGenerating(activeSection);
    setShowRefineMenu(false);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Add more clinical detail and elaboration to the following text while maintaining medical accuracy and professional tone:

"${selectedText}"

Provide an enhanced, more detailed version with additional relevant clinical information.`,
        add_context_from_internet: false
      });

      const currentText = clinicalData[activeSection];
      const newText = currentText.substring(0, selectionRange.start) + response + currentText.substring(selectionRange.end);
      handleClinicalDataChange(activeSection, newText);
      toast.success("Detail added");
    } catch (error) {
      toast.error("Failed to add detail");
    } finally {
      setAiGenerating(null);
    }
  };

  const handleRephrase = async () => {
    if (!selectedText || !activeSection) return;

    setAiGenerating(activeSection);
    setShowRefineMenu(false);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Rephrase the following clinical text for improved clarity and conciseness while maintaining all medical accuracy and essential information:

"${selectedText}"

Provide a clearer, more concise version.`,
        add_context_from_internet: false
      });

      const currentText = clinicalData[activeSection];
      const newText = currentText.substring(0, selectionRange.start) + response + currentText.substring(selectionRange.end);
      handleClinicalDataChange(activeSection, newText);
      toast.success("Text rephrased");
    } catch (error) {
      toast.error("Failed to rephrase");
    } finally {
      setAiGenerating(null);
    }
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

    const submissionData = {
      patient_name: formData.patient_name,
      patient_id: formData.patient_id,
      chief_complaint: formData.chief_complaint,
      note_type: formData.note_type,
      specialty: formData.specialty,
      raw_note: `Chief Complaint: ${formData.chief_complaint}\n\nHISTORY AND PHYSICAL:\n${clinicalData.history_and_physical || ""}\n\nREVIEW OF SYSTEMS:\n${clinicalData.review_of_systems || ""}\n\nPHYSICAL EXAMINATION:\n${clinicalData.physical_exam || ""}`
    };
    
    onSubmit(submissionData, formData.templateId || undefined);
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
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
              <Select value={formData.templateId || ""} onValueChange={(v) => handleInputChange("templateId", v)}>
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
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">1</span>
                History and Physical
              </h3>
              <div className="flex gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAIDraft("history_and_physical")}
                  disabled={aiGenerating === "history_and_physical"}
                  className="rounded-lg gap-1.5 text-xs text-slate-600 border-slate-300 hover:bg-slate-50"
                >
                  {aiGenerating === "history_and_physical" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                  Draft
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAIExpand("history_and_physical")}
                  disabled={aiGenerating === "history_and_physical"}
                  className="rounded-lg gap-1.5 text-xs text-slate-600 border-slate-300 hover:bg-slate-50"
                >
                  {aiGenerating === "history_and_physical" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                  Expand
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveSection("history_and_physical");
                    setSnippetPickerOpen(true);
                  }}
                  className="rounded-lg gap-1.5 text-xs text-slate-600 border-slate-300 hover:bg-slate-50"
                >
                  <FileText className="w-3 h-3" /> Snippet
                </Button>
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-1">Include medical history, past medical history, surgical history, medications, allergies, and any relevant clinical context.</p>
          </div>
          <div className="relative">
            <Textarea
              ref={historyRef}
              value={clinicalData.history_and_physical || ""}
              onChange={(e) => handleClinicalDataChange("history_and_physical", e.target.value)}
              onMouseUp={() => handleTextSelection("history_and_physical")}
              onKeyUp={() => handleTextSelection("history_and_physical")}
              placeholder="Patient's relevant medical history, current medications, allergies, past surgeries, family history, social history, etc."
              className="min-h-[150px] rounded-lg border-blue-200 focus:border-blue-400"
            />
            {showRefineMenu && activeSection === "history_and_physical" && (
              <div className="absolute top-2 right-2 flex gap-1 z-10">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={handleAddDetail}
                  disabled={aiGenerating === "history_and_physical"}
                  className="text-xs shadow-lg"
                >
                  {aiGenerating === "history_and_physical" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                  Add Detail
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={handleRephrase}
                  disabled={aiGenerating === "history_and_physical"}
                  className="text-xs shadow-lg"
                >
                  {aiGenerating === "history_and_physical" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Edit3 className="w-3 h-3" />}
                  Rephrase
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Review of Systems */}
        <Card className="p-6 border-purple-200">
          <div className="mb-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-bold">2</span>
                Review of Systems
              </h3>
              <div className="flex gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAIDraft("review_of_systems")}
                  disabled={aiGenerating === "review_of_systems"}
                  className="rounded-lg gap-1.5 text-xs text-slate-600 border-slate-300 hover:bg-slate-50"
                >
                  {aiGenerating === "review_of_systems" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                  Draft
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAIExpand("review_of_systems")}
                  disabled={aiGenerating === "review_of_systems"}
                  className="rounded-lg gap-1.5 text-xs text-slate-600 border-slate-300 hover:bg-slate-50"
                >
                  {aiGenerating === "review_of_systems" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                  Expand
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveSection("review_of_systems");
                    setSnippetPickerOpen(true);
                  }}
                  className="rounded-lg gap-1.5 text-xs text-slate-600 border-slate-300 hover:bg-slate-50"
                >
                  <FileText className="w-3 h-3" /> Snippet
                </Button>
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-1">Document symptoms by system. Include positive and negative findings relevant to the chief complaint.</p>
          </div>
          <div className="relative">
            <Textarea
              ref={rosRef}
              value={clinicalData.review_of_systems || ""}
              onChange={(e) => handleClinicalDataChange("review_of_systems", e.target.value)}
              onMouseUp={() => handleTextSelection("review_of_systems")}
              onKeyUp={() => handleTextSelection("review_of_systems")}
              placeholder="Constitutional: fever, chills, weight changes
Cardiovascular: chest pain, palpitations, edema
Respiratory: cough, shortness of breath, wheezing
GI: nausea, vomiting, abdominal pain
Other systems as relevant..."
              className="min-h-[150px] rounded-lg border-purple-200 focus:border-purple-400"
            />
            {showRefineMenu && activeSection === "review_of_systems" && (
              <div className="absolute top-2 right-2 flex gap-1 z-10">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={handleAddDetail}
                  disabled={aiGenerating === "review_of_systems"}
                  className="text-xs shadow-lg"
                >
                  {aiGenerating === "review_of_systems" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                  Add Detail
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={handleRephrase}
                  disabled={aiGenerating === "review_of_systems"}
                  className="text-xs shadow-lg"
                >
                  {aiGenerating === "review_of_systems" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Edit3 className="w-3 h-3" />}
                  Rephrase
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Physical Examination */}
        <Card className="p-6 border-emerald-200">
          <div className="mb-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm font-bold">3</span>
                Physical Examination
              </h3>
              <div className="flex gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAIDraft("physical_exam")}
                  disabled={aiGenerating === "physical_exam"}
                  className="rounded-lg gap-1.5 text-xs text-slate-600 border-slate-300 hover:bg-slate-50"
                >
                  {aiGenerating === "physical_exam" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                  Draft
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAIExpand("physical_exam")}
                  disabled={aiGenerating === "physical_exam"}
                  className="rounded-lg gap-1.5 text-xs text-slate-600 border-slate-300 hover:bg-slate-50"
                >
                  {aiGenerating === "physical_exam" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                  Expand
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveSection("physical_exam");
                    setSnippetPickerOpen(true);
                  }}
                  className="rounded-lg gap-1.5 text-xs text-slate-600 border-slate-300 hover:bg-slate-50"
                >
                  <FileText className="w-3 h-3" /> Snippet
                </Button>
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-1">Document objective findings including vital signs, general appearance, and system-specific exams.</p>
          </div>
          <div className="relative">
            <Textarea
              ref={examRef}
              value={clinicalData.physical_exam || ""}
              onChange={(e) => handleClinicalDataChange("physical_exam", e.target.value)}
              onMouseUp={() => handleTextSelection("physical_exam")}
              onKeyUp={() => handleTextSelection("physical_exam")}
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
            {showRefineMenu && activeSection === "physical_exam" && (
              <div className="absolute top-2 right-2 flex gap-1 z-10">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={handleAddDetail}
                  disabled={aiGenerating === "physical_exam"}
                  className="text-xs shadow-lg"
                >
                  {aiGenerating === "physical_exam" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                  Add Detail
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={handleRephrase}
                  disabled={aiGenerating === "physical_exam"}
                  className="text-xs shadow-lg"
                >
                  {aiGenerating === "physical_exam" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Edit3 className="w-3 h-3" />}
                  Rephrase
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Submit Button */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
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

      <SnippetPicker
        open={snippetPickerOpen}
        onClose={() => setSnippetPickerOpen(false)}
        onInsert={handleInsertSnippet}
      />
    </form>
  );
}