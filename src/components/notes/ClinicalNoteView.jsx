import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Edit2, Save, X, FileText, Sparkles, Loader2, Copy, Check } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const NoteSection = ({ title, value, field, onSave, color = "blue" }) => {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || "");

  const handleSave = async () => {
    await onSave(field, editValue);
    setEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value || "");
    setEditing(false);
  };

  const colorClasses = {
    blue: "border-blue-200 bg-blue-50",
    green: "border-green-200 bg-green-50",
    purple: "border-purple-200 bg-purple-50",
    amber: "border-amber-200 bg-amber-50",
    rose: "border-rose-200 bg-rose-50",
    slate: "border-slate-200 bg-slate-50"
  };

  const headerColors = {
    blue: "bg-blue-100 text-blue-900",
    green: "bg-green-100 text-green-900",
    purple: "bg-purple-100 text-purple-900",
    amber: "bg-amber-100 text-amber-900",
    rose: "bg-rose-100 text-rose-900",
    slate: "bg-slate-100 text-slate-900"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border-2 ${colorClasses[color]} overflow-hidden`}
    >
      <div className={`px-4 py-3 flex items-center justify-between ${headerColors[color]}`}>
        <h3 className="font-bold text-sm">{title}</h3>
        {!editing ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setEditing(true)}
            className="h-7 gap-1"
          >
            <Edit2 className="w-3 h-3" /> Edit
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleSave}
              className="h-7 gap-1 bg-green-600 hover:bg-green-700 text-white"
            >
              <Save className="w-3 h-3" /> Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              className="h-7"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
      <div className="p-4">
        {editing ? (
          <Textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full min-h-[120px] bg-white"
            placeholder={`Enter ${title.toLowerCase()}...`}
          />
        ) : (
          <div className="bg-white rounded-lg p-3 border border-slate-200 min-h-[80px]">
            {value ? (
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{value}</p>
            ) : (
              <p className="text-sm text-slate-400 italic">No {title.toLowerCase()} documented</p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

const ArraySection = ({ title, items, field, onSave, color = "blue" }) => {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(items?.join("\n") || "");

  const handleSave = async () => {
    const itemsArray = editValue.split("\n").filter(item => item.trim());
    await onSave(field, itemsArray);
    setEditing(false);
  };

  const handleCancel = () => {
    setEditValue(items?.join("\n") || "");
    setEditing(false);
  };

  const colorClasses = {
    blue: "border-blue-200 bg-blue-50",
    rose: "border-rose-200 bg-rose-50"
  };

  const headerColors = {
    blue: "bg-blue-100 text-blue-900",
    rose: "bg-rose-100 text-rose-900"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border-2 ${colorClasses[color]} overflow-hidden`}
    >
      <div className={`px-4 py-3 flex items-center justify-between ${headerColors[color]}`}>
        <h3 className="font-bold text-sm">{title}</h3>
        {!editing ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setEditing(true)}
            className="h-7 gap-1"
          >
            <Edit2 className="w-3 h-3" /> Edit
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleSave}
              className="h-7 gap-1 bg-green-600 hover:bg-green-700 text-white"
            >
              <Save className="w-3 h-3" /> Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              className="h-7"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
      <div className="p-4">
        {editing ? (
          <Textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full min-h-[100px] bg-white"
            placeholder="Enter one item per line..."
          />
        ) : (
          <div className="bg-white rounded-lg p-3 border border-slate-200">
            {items && items.length > 0 ? (
              <ul className="space-y-2">
                {items.map((item, idx) => (
                  <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400 italic">No {title.toLowerCase()} documented</p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default function ClinicalNoteView({ note, onUpdate, noteTypes }) {
  const [generatingConsolidated, setGeneratingConsolidated] = useState(false);
  const [consolidatedNote, setConsolidatedNote] = useState(null);
  const [copied, setCopied] = useState(false);

  const typeLabels = {
    progress_note: "Progress Note",
    h_and_p: "History & Physical",
    discharge_summary: "Discharge Summary",
    consult: "Consultation",
    procedure_note: "Procedure Note",
  };

  const generateConsolidatedNote = async () => {
    setGeneratingConsolidated(true);
    try {
      const clinicalNoteData = JSON.stringify(note, null, 2);
      
      const prompt = `You are an expert medical documentalist. Your task is to compile a comprehensive clinical note from the provided structured patient data. Ensure clarity, accuracy, and adherence to standard medical documentation practices.

Here is the full clinical note data in JSON format:
${clinicalNoteData}

Please generate a single, well-structured clinical note using the following sections and order:

1. **PATIENT DEMOGRAPHICS:**
   - Patient Name: [patient_name]
   - Date of Birth: [date_of_birth]
   - Gender: [patient_gender]
   - Patient ID: [patient_id]
   - Date of Visit: [date_of_visit]
   - Note Type: [note_type]
   - Specialty: [specialty]

2. **CHIEF COMPLAINT (CC):**
   [chief_complaint]

3. **HISTORY OF PRESENT ILLNESS (HPI):**
   [history_of_present_illness]

4. **REVIEW OF SYSTEMS (ROS):**
   [review_of_systems - Format as bullet points if present]

5. **PHYSICAL EXAMINATION (PE):**
   [physical_exam - Format as bullet points if present]
   
   Vital Signs:
   • Temperature: [vital_signs.temperature.value] [vital_signs.temperature.unit]
   • Heart Rate: [vital_signs.heart_rate.value] [vital_signs.heart_rate.unit]
   • Blood Pressure: [vital_signs.blood_pressure.systolic]/[vital_signs.blood_pressure.diastolic] [vital_signs.blood_pressure.unit]
   • Respiratory Rate: [vital_signs.respiratory_rate.value] [vital_signs.respiratory_rate.unit]
   • Oxygen Saturation: [vital_signs.oxygen_saturation.value] [vital_signs.oxygen_saturation.unit]
   • Weight: [vital_signs.weight.value] [vital_signs.weight.unit]
   • Height: [vital_signs.height.value] [vital_signs.height.unit]

6. **MEDICAL DECISION MAKING:**
   [Include medical decision making content if available in the note data]

7. **ASSESSMENT:**
   [assessment]

8. **DIAGNOSES (with ICD-10 Codes):**
   [List all items from the diagnoses array, one per line with bullet points]

9. **PLAN:**
   [plan]

10. **CLINICAL IMPRESSION:**
    [clinical_impression]

11. **RESULT ANALYSIS:**
    [Include any imaging, laboratory, or EKG analysis results if available in the note data]

12. **FINAL IMPRESSION (with ICD-10 Codes):**
    [Provide a synthesized final impression with relevant ICD-10 codes]

13. **PATIENT EDUCATION:**
    [Include patient education materials if available in the note data]

FORMATTING INSTRUCTIONS:
- If a field is empty or not available in the JSON, state "Not documented" or "None"
- Format Review of Systems and Physical Exam findings as bullet points
- Maintain a professional medical tone throughout
- Ensure all sections are clearly delimited with bold headings
- Use bullet points where appropriate for readability

Generate the complete clinical note now.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: false
      });

      setConsolidatedNote(result);
      toast.success("Consolidated clinical note generated");
    } catch (error) {
      console.error("Failed to generate consolidated note:", error);
      toast.error("Failed to generate consolidated note");
    } finally {
      setGeneratingConsolidated(false);
    }
  };

  const copyToClipboard = () => {
    if (consolidatedNote) {
      navigator.clipboard.writeText(consolidatedNote);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Generate Consolidated Note Button */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-300 p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Consolidated Clinical Note
            </h3>
            <p className="text-sm text-slate-600 mt-1">Generate a comprehensive, formatted clinical note from all tabs</p>
          </div>
          <Button
            onClick={generateConsolidatedNote}
            disabled={generatingConsolidated}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white gap-2"
          >
            {generatingConsolidated ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Generate Note</>
            )}
          </Button>
        </div>

        {consolidatedNote && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 bg-white rounded-lg border-2 border-blue-200 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-slate-900">Generated Clinical Note</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="gap-2"
              >
                {copied ? (
                  <><Check className="w-4 h-4 text-green-600" /> Copied</>
                ) : (
                  <><Copy className="w-4 h-4" /> Copy</>
                )}
              </Button>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 max-h-[600px] overflow-y-auto">
              <pre className="text-sm text-slate-900 whitespace-pre-wrap font-sans leading-relaxed">
                {consolidatedNote}
              </pre>
            </div>
          </motion.div>
        )}
      </div>

      {/* Note Type Selector */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-300 p-5">
        <div className="flex items-center gap-3 mb-3">
          <FileText className="w-6 h-6 text-indigo-600" />
          <h2 className="text-xl font-bold text-slate-900">Clinical Note</h2>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Note Type</label>
          <select
            value={note.note_type || "progress_note"}
            onChange={(e) => onUpdate("note_type", e.target.value)}
            className="w-full px-4 py-2 rounded-lg border-2 border-indigo-200 bg-white text-slate-900 font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
          >
            <option value="progress_note">Progress Note</option>
            <option value="h_and_p">History & Physical</option>
            <option value="discharge_summary">Discharge Summary</option>
            <option value="consult">Consultation</option>
            <option value="procedure_note">Procedure Note</option>
          </select>
          <p className="text-xs text-indigo-700 mt-2">
            Current: <strong>{typeLabels[note.note_type] || "Progress Note"}</strong>
          </p>
        </div>
      </div>

      {/* Note Summary */}
      {note.summary && (
        <div className="bg-cyan-50 rounded-xl border-2 border-cyan-300 p-5">
          <h3 className="font-bold text-cyan-900 mb-3 flex items-center gap-2">
            📋 Clinical Summary
          </h3>
          <div className="bg-white rounded-lg p-4 border border-cyan-200">
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{note.summary}</p>
          </div>
        </div>
      )}

      {/* Chief Complaint */}
      <NoteSection
        title="Chief Complaint"
        value={note.chief_complaint}
        field="chief_complaint"
        onSave={onUpdate}
        color="blue"
      />

      {/* History of Present Illness */}
      <NoteSection
        title="History of Present Illness"
        value={note.history_of_present_illness}
        field="history_of_present_illness"
        onSave={onUpdate}
        color="purple"
      />

      {/* Review of Systems */}
      <NoteSection
        title="Review of Systems"
        value={note.review_of_systems}
        field="review_of_systems"
        onSave={onUpdate}
        color="amber"
      />

      {/* Physical Exam */}
      <NoteSection
        title="Physical Examination"
        value={note.physical_exam}
        field="physical_exam"
        onSave={onUpdate}
        color="green"
      />

      {/* Assessment */}
      <NoteSection
        title="Assessment"
        value={note.assessment}
        field="assessment"
        onSave={onUpdate}
        color="purple"
      />

      {/* Diagnoses */}
      <ArraySection
        title="Diagnoses"
        items={note.diagnoses}
        field="diagnoses"
        onSave={onUpdate}
        color="blue"
      />

      {/* Medications */}
      <ArraySection
        title="Medications"
        items={note.medications}
        field="medications"
        onSave={onUpdate}
        color="rose"
      />

      {/* Treatment Plan */}
      <NoteSection
        title="Treatment Plan"
        value={note.plan}
        field="plan"
        onSave={onUpdate}
        color="green"
      />

      {/* Final Impression */}
      <NoteSection
        title="Clinical Impression"
        value={note.clinical_impression}
        field="clinical_impression"
        onSave={onUpdate}
        color="slate"
      />
    </div>
  );
}