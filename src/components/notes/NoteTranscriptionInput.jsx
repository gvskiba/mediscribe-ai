import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, MicOff, Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const NOTE_TYPES = [
  { value: "progress_note", label: "Progress Note" },
  { value: "h_and_p", label: "History & Physical" },
  { value: "discharge_summary", label: "Discharge Summary" },
  { value: "consult", label: "Consultation" },
  { value: "procedure_note", label: "Procedure Note" },
];

export default function NoteTranscriptionInput({ onSubmit, isProcessing }) {
  const [patientName, setPatientName] = useState("");
  const [patientId, setPatientId] = useState("");
  const [noteType, setNoteType] = useState("progress_note");
  const [specialty, setSpecialty] = useState("");
  const [rawNote, setRawNote] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);

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
    if (!patientName.trim() || !rawNote.trim()) return;
    onSubmit({
      patient_name: patientName,
      patient_id: patientId,
      note_type: noteType,
      specialty,
      raw_note: rawNote,
      date_of_visit: new Date().toISOString().split("T")[0],
    });
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
        {/* Patient Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-slate-700 font-medium">Patient Name *</Label>
            <Input
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="John Doe"
              className="rounded-xl border-slate-200 focus:border-blue-400 focus:ring-blue-400/20"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-700 font-medium">MRN / Patient ID</Label>
            <Input
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              placeholder="Optional"
              className="rounded-xl border-slate-200 focus:border-blue-400 focus:ring-blue-400/20"
            />
          </div>
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
            <Input
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="e.g., Internal Medicine"
              className="rounded-xl border-slate-200 focus:border-blue-400 focus:ring-blue-400/20"
            />
          </div>
        </div>

        {/* Note Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-slate-700 font-medium">Clinical Note *</Label>
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
          <Textarea
            value={rawNote}
            onChange={(e) => setRawNote(e.target.value)}
            placeholder="Type or dictate your clinical note here... Include patient history, exam findings, assessment and plan."
            className="min-h-[240px] rounded-xl border-slate-200 focus:border-blue-400 focus:ring-blue-400/20 resize-none text-sm leading-relaxed"
          />
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={isProcessing || !patientName.trim() || !rawNote.trim()}
            className="bg-blue-600 hover:bg-blue-700 rounded-xl gap-2 px-6 shadow-lg shadow-blue-600/20"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Processing with AI...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Structure with AI
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}