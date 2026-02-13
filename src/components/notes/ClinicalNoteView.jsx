import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Edit2, Save, X, FileText } from "lucide-react";
import { motion } from "framer-motion";

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
  const typeLabels = {
    progress_note: "Progress Note",
    h_and_p: "History & Physical",
    discharge_summary: "Discharge Summary",
    consult: "Consultation",
    procedure_note: "Procedure Note",
  };

  return (
    <div className="space-y-6">
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