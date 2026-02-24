import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Edit2, Save, X, FileText, Sparkles, Loader2, Copy, Check, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format } from "date-fns";
import AITextCompletion from "../ai/AITextCompletion";

const AggregateSectionText = ({ title, field, value, borderColor, titleColor, onSave, isROS, isPhysExam, note }) => {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || "");

  if (!value && !editing) return null;

  // Parse JSON object fields (ROS, physical exam) into readable lines
  const formatStructured = (val) => {
    if (!val) return val;
    if ((isROS || isPhysExam) && typeof val === 'string' && val.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(val);
        return Object.entries(parsed)
          .map(([key, text]) => `${key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}: ${text}`)
          .join('\n');
      } catch {
        return val;
      }
    }
    return val;
  };

  const displayValue = formatStructured(value);

  return (
    <div>
      <div className={`flex items-center justify-between pb-2 border-b-2 ${borderColor} mb-2`}>
        <h4 className={`text-sm font-bold ${titleColor}`}>{title}</h4>
        <div className="flex items-center gap-1">
          {!editing ? (
            <>
              <Button size="sm" variant="ghost" onClick={() => { setEditValue(value || ""); setEditing(true); }} className="h-6 px-2 text-xs gap-1">
                <Edit2 className="w-3 h-3" /> Edit
              </Button>
              {value && (
                <Button size="sm" variant="ghost" onClick={async () => { await onSave(field, ""); }} className="h-6 px-2 text-xs gap-1 text-red-600 hover:text-red-700 hover:bg-red-50">
                  <Trash2 className="w-3 h-3" /> Clear
                </Button>
              )}
            </>
          ) : (
            <>
              <Button size="sm" onClick={async () => { await onSave(field, editValue); setEditing(false); toast.success("Saved"); }} className="h-6 px-2 text-xs gap-1 bg-green-600 hover:bg-green-700 text-white">
                <Save className="w-3 h-3" /> Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setEditValue(value || ""); setEditing(false); }} className="h-6 px-2 text-xs">
                <X className="w-3 h-3" />
              </Button>
            </>
          )}
        </div>
      </div>
      {editing ? (
        AI_COMPLETION_FIELDS.includes(field) ? (
          <AITextCompletion
            field={field}
            value={editValue}
            onChange={setEditValue}
            note={typeof onSave === 'function' ? undefined : undefined}
            placeholder={`Enter ${title?.toLowerCase() || field}...`}
            className="w-full min-h-[100px] text-sm resize-none rounded-md border border-input px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring bg-white"
            minRows={4}
          />
        ) : (
          <Textarea value={editValue} onChange={(e) => setEditValue(e.target.value)} className="w-full min-h-[100px] bg-white text-sm" />
        )
      ) : (
        <div className="text-sm text-slate-700 leading-relaxed">
          {(isROS || isPhysExam) && displayValue?.includes('\n') ? (
            <ul className="space-y-1.5">
              {displayValue.split('\n').filter(Boolean).map((line, i) => {
                const colonIdx = line.indexOf(':');
                const label = colonIdx > -1 ? line.slice(0, colonIdx) : null;
                const text = colonIdx > -1 ? line.slice(colonIdx + 1).trim() : line;
                return (
                  <li key={i} className="flex gap-2 items-baseline">
                    {label && (
                      <span className={`font-semibold flex-shrink-0 text-xs uppercase tracking-wide ${isPhysExam ? "text-green-700" : "text-amber-700"}`}>
                        {label}:
                      </span>
                    )}
                    <span>{text}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="whitespace-pre-wrap">{displayValue}</p>
          )}
        </div>
      )}
    </div>
  );
};

const AggregateSectionArray = ({ title, field, items, borderColor, titleColor, itemBg, itemNumColor, onSave, isAllergy }) => {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(items?.join("\n") || "");

  if ((!items || items.length === 0) && !editing) return null;

  return (
    <div>
      <div className={`flex items-center justify-between pb-2 border-b-2 ${borderColor} mb-2`}>
        <h4 className={`text-sm font-bold ${titleColor}`}>{title}</h4>
        <div className="flex items-center gap-1">
          {!editing ? (
            <>
              <Button size="sm" variant="ghost" onClick={() => { setEditValue(items?.join("\n") || ""); setEditing(true); }} className="h-6 px-2 text-xs gap-1">
                <Edit2 className="w-3 h-3" /> Edit
              </Button>
              {items && items.length > 0 && (
                <Button size="sm" variant="ghost" onClick={async () => { await onSave(field, []); setEditValue(""); }} className="h-6 px-2 text-xs gap-1 text-red-600 hover:text-red-700 hover:bg-red-50">
                  <Trash2 className="w-3 h-3" /> Clear
                </Button>
              )}
            </>
          ) : (
            <>
              <Button size="sm" onClick={async () => { const arr = editValue.split("\n").filter(i => i.trim()); await onSave(field, arr); setEditing(false); toast.success("Saved"); }} className="h-6 px-2 text-xs gap-1 bg-green-600 hover:bg-green-700 text-white">
                <Save className="w-3 h-3" /> Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setEditValue(items?.join("\n") || ""); setEditing(false); }} className="h-6 px-2 text-xs">
                <X className="w-3 h-3" />
              </Button>
            </>
          )}
        </div>
      </div>
      {editing ? (
        <Textarea value={editValue} onChange={(e) => setEditValue(e.target.value)} className="w-full min-h-[80px] bg-white text-sm" placeholder="Enter one item per line..." />
      ) : (
        <ul className="space-y-2">
          {items.map((item, idx) => (
            <li key={idx} className={`text-sm text-slate-700 flex items-start gap-2 p-3 rounded-lg border ${itemBg}`}>
              <span className={`font-bold ${itemNumColor}`}>{isAllergy ? "⚠️" : `${idx + 1}.`}</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const AI_COMPLETION_FIELDS = ["history_of_present_illness", "assessment", "plan"];

const NoteSection = ({ title, value, field, onSave, color = "blue", note }) => {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || "");

  const handleSave = async () => {
    await onSave(field, editValue);
    setEditing(false);
    toast.success("Saved at " + format(new Date(), "h:mm:ss a"));
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
        <div className="flex items-center gap-2">
          {!editing ? (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditing(true)}
                className="h-7 gap-1"
              >
                <Edit2 className="w-3 h-3" /> Edit
              </Button>
              {value && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    await onSave(field, "");
                    setEditValue("");
                  }}
                  className="h-7 gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-3 h-3" /> Clear
                </Button>
              )}
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
      <div className="p-4">
        {editing ? (
          AI_COMPLETION_FIELDS.includes(field) && note ? (
            <AITextCompletion
              field={field}
              value={editValue}
              onChange={setEditValue}
              note={note}
              placeholder={`Enter ${title.toLowerCase()}...`}
              className="w-full min-h-[120px] text-sm resize-none rounded-md border border-input px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring"
              minRows={6}
            />
          ) : (
            <Textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full min-h-[120px] bg-white"
              placeholder={`Enter ${title.toLowerCase()}...`}
            />
          )
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
    toast.success("Saved at " + format(new Date(), "h:mm:ss a"));
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
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEditing(true)}
              className="h-7 gap-1"
            >
              <Edit2 className="w-3 h-3" /> Edit
            </Button>
            {items && items.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  await onSave(field, []);
                  setEditValue("");
                }}
                className="h-7 gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-3 h-3" /> Clear
              </Button>
            )}
          </div>
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

export default function ClinicalNoteView({ note, onUpdate, noteTypes, differentialDiagnosis = [] }) {
  const [generatingConsolidated, setGeneratingConsolidated] = useState(false);
  const [consolidatedNote, setConsolidatedNote] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isConsolidatedOpen, setIsConsolidatedOpen] = useState(true);
  const [showAggregated, setShowAggregated] = useState(true);

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

  const copyStructuredNote = () => {
    // Build a plain-text version of all populated note sections
    const sections = [];

    if (note.chief_complaint) sections.push(`CHIEF COMPLAINT:\n${note.chief_complaint}`);
    if (note.history_of_present_illness) sections.push(`HISTORY OF PRESENT ILLNESS:\n${note.history_of_present_illness}`);

    // Format ROS - handle JSON or string
    if (note.review_of_systems) {
      let rosText = note.review_of_systems;
      if (typeof rosText === 'string' && rosText.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(rosText);
          rosText = Object.entries(parsed)
            .map(([k, v]) => `  ${k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g, ' ')}: ${v}`)
            .join('\n');
        } catch { /* keep as-is */ }
      }
      sections.push(`REVIEW OF SYSTEMS:\n${rosText}`);
    }

    // Format physical exam - handle JSON or string
    if (note.physical_exam) {
      let peText = note.physical_exam;
      if (typeof peText === 'string' && peText.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(peText);
          peText = Object.entries(parsed)
            .map(([k, v]) => `  ${k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g, ' ')}: ${v}`)
            .join('\n');
        } catch { /* keep as-is */ }
      }
      sections.push(`PHYSICAL EXAMINATION:\n${peText}`);
    }

    if (note.assessment) sections.push(`ASSESSMENT:\n${note.assessment}`);
    if (note.diagnoses?.length > 0) sections.push(`DIAGNOSES:\n${note.diagnoses.map((d, i) => `  ${i + 1}. ${d}`).join('\n')}`);
    if (note.plan) sections.push(`PLAN:\n${note.plan}`);
    if (note.medications?.length > 0) sections.push(`MEDICATIONS:\n${note.medications.map((m, i) => `  ${i + 1}. ${m}`).join('\n')}`);
    if (note.medical_history) sections.push(`MEDICAL HISTORY:\n${note.medical_history}`);
    if (note.allergies?.length > 0) sections.push(`ALLERGIES:\n${note.allergies.map(a => `  ⚠ ${a}`).join('\n')}`);
    if (note.clinical_impression) sections.push(`CLINICAL IMPRESSION:\n${note.clinical_impression}`);

    const fullText = sections.join('\n\n');
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    toast.success("Note copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">

      {/* Aggregated Clinical Note View */}
      {showAggregated && (
        <div className="bg-white rounded-xl border-2 border-slate-200 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <FileText className="w-6 h-6" />
                  Complete Clinical Note
                </h3>
                <p className="text-slate-200 text-sm mt-1">All clinical data integrated from all tabs</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={copyStructuredNote}
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied!" : "Copy Note"}
              </Button>
            </div>
          </div>
          <div className="p-6 space-y-4 max-h-[800px] overflow-y-auto">
            <AggregateSectionText title="CHIEF COMPLAINT" field="chief_complaint" value={note.chief_complaint} borderColor="border-blue-200" titleColor="text-blue-900" onSave={onUpdate} />
            <AggregateSectionText title="HISTORY OF PRESENT ILLNESS" field="history_of_present_illness" value={note.history_of_present_illness} borderColor="border-purple-200" titleColor="text-purple-900" onSave={onUpdate} note={note} />
            <AggregateSectionText title="REVIEW OF SYSTEMS" field="review_of_systems" value={note.review_of_systems} borderColor="border-amber-200" titleColor="text-amber-900" onSave={onUpdate} isROS={true} />
            <AggregateSectionText title="PHYSICAL EXAMINATION" field="physical_exam" value={note.physical_exam} borderColor="border-green-200" titleColor="text-green-900" onSave={onUpdate} isPhysExam={true} />

            {/* Vital Signs (read-only display) */}
            {note.vital_signs && Object.keys(note.vital_signs).length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-emerald-900 mb-2 pb-2 border-b-2 border-emerald-200">VITAL SIGNS</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {note.vital_signs.temperature?.value && (
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                      <p className="text-xs text-slate-500">Temperature</p>
                      <p className="text-sm font-semibold text-slate-900">{note.vital_signs.temperature.value}° {note.vital_signs.temperature.unit}</p>
                    </div>
                  )}
                  {note.vital_signs.heart_rate?.value && (
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                      <p className="text-xs text-slate-500">Heart Rate</p>
                      <p className="text-sm font-semibold text-slate-900">{note.vital_signs.heart_rate.value} bpm</p>
                    </div>
                  )}
                  {note.vital_signs.blood_pressure?.systolic && (
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                      <p className="text-xs text-slate-500">Blood Pressure</p>
                      <p className="text-sm font-semibold text-slate-900">{note.vital_signs.blood_pressure.systolic}/{note.vital_signs.blood_pressure.diastolic} mmHg</p>
                    </div>
                  )}
                  {note.vital_signs.respiratory_rate?.value && (
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                      <p className="text-xs text-slate-500">Respiratory Rate</p>
                      <p className="text-sm font-semibold text-slate-900">{note.vital_signs.respiratory_rate.value} /min</p>
                    </div>
                  )}
                  {note.vital_signs.oxygen_saturation?.value && (
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                      <p className="text-xs text-slate-500">O2 Saturation</p>
                      <p className="text-sm font-semibold text-slate-900">{note.vital_signs.oxygen_saturation.value}%</p>
                    </div>
                  )}
                  {note.vital_signs.weight?.value && (
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                      <p className="text-xs text-slate-500">Weight</p>
                      <p className="text-sm font-semibold text-slate-900">{note.vital_signs.weight.value} {note.vital_signs.weight.unit}</p>
                    </div>
                  )}
                  {note.vital_signs.height?.value && (
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                      <p className="text-xs text-slate-500">Height</p>
                      <p className="text-sm font-semibold text-slate-900">{note.vital_signs.height.value} {note.vital_signs.height.unit}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Differential Diagnoses (read-only display) */}
            {differentialDiagnosis && differentialDiagnosis.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-rose-900 mb-2 pb-2 border-b-2 border-rose-200">DIFFERENTIAL DIAGNOSES</h4>
                <ul className="space-y-2">
                  {differentialDiagnosis.map((diff, idx) => (
                    <li key={idx} className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-lg p-3 text-sm">
                      <span className="font-bold text-rose-600 flex-shrink-0">{idx + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-slate-900">{diff.diagnosis}</span>
                        <span className="ml-2 text-xs text-rose-700 font-medium">({diff.likelihood_rank}/5)</span>
                        {diff.clinical_reasoning && (
                          <p className="text-xs text-slate-600 mt-0.5">{diff.clinical_reasoning}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <AggregateSectionText title="ASSESSMENT" field="assessment" value={note.assessment} borderColor="border-indigo-200" titleColor="text-indigo-900" onSave={onUpdate} />
            <AggregateSectionArray title="DIAGNOSES" field="diagnoses" items={note.diagnoses} borderColor="border-blue-200" titleColor="text-blue-900" itemBg="bg-blue-50 border-blue-200" itemNumColor="text-blue-600" onSave={onUpdate} />
            <AggregateSectionText title="PLAN" field="plan" value={note.plan} borderColor="border-rose-200" titleColor="text-rose-900" onSave={onUpdate} />
            <AggregateSectionArray title="MEDICATIONS" field="medications" items={note.medications} borderColor="border-green-200" titleColor="text-green-900" itemBg="bg-green-50 border-green-200" itemNumColor="text-green-600" onSave={onUpdate} />
            <AggregateSectionText title="MEDICAL HISTORY" field="medical_history" value={note.medical_history} borderColor="border-slate-200" titleColor="text-slate-900" onSave={onUpdate} />
            <AggregateSectionArray title="ALLERGIES" field="allergies" items={note.allergies} borderColor="border-red-200" titleColor="text-red-900" itemBg="bg-red-50 border-red-200" itemNumColor="text-red-600" onSave={onUpdate} isAllergy />
            <AggregateSectionText title="FINAL CLINICAL IMPRESSION" field="clinical_impression" value={note.clinical_impression} borderColor="border-slate-200" titleColor="text-slate-900" onSave={onUpdate} />
          </div>
        </div>
      )}

      {/* Individual Editable Sections (when not showing aggregated) */}
      {!showAggregated && (
        <>
      {/* Note Type Selector */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-300 p-5">
        <div className="flex items-center gap-3 mb-3">
          <FileText className="w-6 h-6 text-indigo-600" />
          <h2 className="text-xl font-bold text-slate-900">Edit Clinical Sections</h2>
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
        note={note}
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
        note={note}
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
        note={note}
      />

      {/* Final Impression */}
      <NoteSection
        title="Clinical Impression"
        value={note.clinical_impression}
        field="clinical_impression"
        onSave={onUpdate}
        color="slate"
      />
        </>
      )}


    </div>
  );
}