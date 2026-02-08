import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, MicOff, Loader2, Sparkles, ChevronDown, ChevronUp, FileText, Star } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import TemplatePreview from "../templates/TemplatePreview";
import SnippetPicker from "../snippets/SnippetPicker";

const NOTE_TYPES = [
  { value: "progress_note", label: "Progress Note" },
  { value: "h_and_p", label: "History & Physical" },
  { value: "discharge_summary", label: "Discharge Summary" },
  { value: "consult", label: "Consultation" },
  { value: "procedure_note", label: "Procedure Note" },
];

const SPECIALTIES = [
  { value: "general", label: "General Medicine" },
  { value: "cardiology", label: "Cardiology" },
  { value: "pulmonology", label: "Pulmonology" },
  { value: "endocrinology", label: "Endocrinology" },
  { value: "neurology", label: "Neurology" },
  { value: "oncology", label: "Oncology" },
  { value: "gastroenterology", label: "Gastroenterology" },
  { value: "nephrology", label: "Nephrology" },
  { value: "rheumatology", label: "Rheumatology" },
  { value: "infectious_disease", label: "Infectious Disease" },
  { value: "psychiatry", label: "Psychiatry" },
  { value: "pediatrics", label: "Pediatrics" },
  { value: "emergency_medicine", label: "Emergency Medicine" },
  { value: "family_medicine", label: "Family Medicine" },
  { value: "internal_medicine", label: "Internal Medicine" },
];

export default function NoteTranscriptionInput({ onSubmit, isProcessing, templates = [] }) {
  const [noteType, setNoteType] = useState("progress_note");
  const [specialty, setSpecialty] = useState("general");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [rawNote, setRawNote] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(templates.find(t => t.is_default)?.id || "");
  const [extracting, setExtracting] = useState(false);
  const [templatePreviewExpanded, setTemplatePreviewExpanded] = useState(true);
  const [snippetPickerOpen, setSnippetPickerOpen] = useState(false);
  const recognitionRef = useRef(null);
  const textareaRef = useRef(null);

  // Load default preferences on mount
  useEffect(() => {
    const savedDefaults = localStorage.getItem("noteDefaults");
    if (savedDefaults) {
      try {
        const defaults = JSON.parse(savedDefaults);
        if (defaults.noteType) setNoteType(defaults.noteType);
        if (defaults.specialty) setSpecialty(defaults.specialty);
        if (defaults.templateId) setSelectedTemplate(defaults.templateId);
      } catch (error) {
        console.error("Failed to load defaults:", error);
      }
    }
  }, []);

  const saveAsDefaults = () => {
    const defaults = {
      noteType,
      specialty,
      templateId: selectedTemplate
    };
    localStorage.setItem("noteDefaults", JSON.stringify(defaults));
    toast.success("Saved as default selections");
  };

  // Auto-select matching template when note type or specialty changes
  useEffect(() => {
    if (!templates.length) return;
    
    const matchingTemplate = templates.find(t => 
      t.note_type === noteType && 
      (!specialty || !t.specialty || t.specialty.toLowerCase() === specialty.toLowerCase())
    );
    
    if (matchingTemplate) {
      setSelectedTemplate(matchingTemplate.id);
    }
  }, [noteType, specialty, templates]);

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setRawNote(transcript);
    };

    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };



  const handleSubmit = () => {
    if (!rawNote.trim()) return;
    onSubmit({
      note_type: noteType,
      specialty,
      chief_complaint: chiefComplaint,
      raw_note: rawNote,
    }, selectedTemplate);
  };

  const handleInsertSnippet = (snippetText) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setRawNote(rawNote + "\n\n" + snippetText);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = rawNote.substring(0, start) + snippetText + rawNote.substring(end);
    setRawNote(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + snippetText.length, start + snippetText.length);
    }, 0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm"
    >
      <div className="p-6 border-b border-slate-100">
        <h2 className="text-xl font-semibold text-slate-900">New Clinical Note</h2>
        <p className="text-sm text-slate-500 mt-1">
          Enter or dictate your note — AI will structure it automatically.
        </p>
      </div>

      <div className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Note Settings</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={saveAsDefaults}
              className="gap-1.5 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50"
            >
              <Star className="w-3.5 h-3.5" /> Save as Defaults
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-700 font-medium">Note Type</Label>
              <Select value={noteType} onValueChange={setNoteType}>
                <SelectTrigger className="rounded-xl border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NOTE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700 font-medium">Specialty</Label>
              <Select value={specialty} onValueChange={setSpecialty}>
                <SelectTrigger className="rounded-xl border-slate-200">
                  <SelectValue placeholder="Select specialty" />
                </SelectTrigger>
                <SelectContent>
                  {SPECIALTIES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Template Selection */}
        {templates.length > 0 && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-slate-700 font-medium">Template (Optional)</Label>
              <Select value={selectedTemplate || ""} onValueChange={(value) => setSelectedTemplate(value || "")}>
                <SelectTrigger className="rounded-xl border-slate-200">
                  <SelectValue placeholder="Use default structure" />
                </SelectTrigger>
                <SelectContent>
                   <SelectItem value={null}>Default Structure</SelectItem>
                   {templates.map(template => (
                     <SelectItem key={template.id} value={template.id}>
                       {template.name} {template.is_default && "⭐"}
                     </SelectItem>
                   ))}
                 </SelectContent>
              </Select>
            </div>
            
            {selectedTemplate && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                  <button
                    onClick={() => setTemplatePreviewExpanded(!templatePreviewExpanded)}
                    className="w-full flex items-center justify-between mb-3 hover:opacity-70 transition-opacity"
                  >
                    <h3 className="text-sm font-semibold text-slate-700">Template Preview</h3>
                    {templatePreviewExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </button>
                  {templatePreviewExpanded && (
                    <TemplatePreview
                      template={templates.find(t => t.id === selectedTemplate)}
                      noteType={noteType}
                      specialty={specialty}
                    />
                  )}
                  </div>
                  </motion.div>
                  )}
                  </div>
                  )}

                  <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Chief Complaint</Label>
                  <Input
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  placeholder="e.g., Chest pain, Shortness of breath"
                  className="rounded-xl border-slate-200 focus:border-blue-400 focus:ring-blue-400/20"
                  />
                  </div>

                  {/* Note Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-slate-700 font-medium">Clinical Note *</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSnippetPickerOpen(true)}
                className="rounded-xl gap-2"
              >
                <FileText className="w-3.5 h-3.5" /> Insert Snippet
              </Button>
              <Button
                type="button"
                variant={isRecording ? "destructive" : "outline"}
                size="sm"
                onClick={toggleRecording}
                className={`rounded-xl gap-2 ${isRecording ? "animate-pulse" : ""}`}
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-3.5 h-3.5" /> Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5" /> Dictate
                  </>
                )}
              </Button>
            </div>
          </div>
          <Textarea
            ref={textareaRef}
            value={rawNote}
            onChange={(e) => setRawNote(e.target.value)}
            placeholder="Type or dictate your clinical note here... Include patient history, exam findings, assessment and plan."
            className="min-h-[240px] rounded-xl border-slate-200 focus:border-blue-400 focus:ring-blue-400/20 resize-none text-sm leading-relaxed"
          />
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={isProcessing || !rawNote.trim()}
            className="bg-blue-600 hover:bg-blue-700 rounded-xl gap-2 px-6 shadow-lg shadow-blue-600/20"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Processing with AI...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Create Note
              </>
            )}
          </Button>
        </div>
        </div>

        <SnippetPicker
        open={snippetPickerOpen}
        onClose={() => setSnippetPickerOpen(false)}
        onInsert={handleInsertSnippet}
        />
        </motion.div>
        );
        }