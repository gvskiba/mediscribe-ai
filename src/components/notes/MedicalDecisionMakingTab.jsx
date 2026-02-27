import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Clock, Plus, Trash2, ChevronDown, ChevronUp, Brain, Sparkles,
  LogIn, LogOut, Loader2, Pencil, Check, X, GitCompare, FileText, Wand2, Bot,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";

// ─── Markdown renderer shared config ──────────────────────────────────────────
const mdComponents = {
  p: ({ children }) => <p className="mb-2 leading-relaxed text-slate-700">{children}</p>,
  h1: ({ children }) => <h1 className="text-base font-bold mt-3 mb-1 text-slate-900">{children}</h1>,
  h2: ({ children }) => <h2 className="text-sm font-bold mt-2 mb-1 text-slate-900">{children}</h2>,
  h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1 text-slate-800">{children}</h3>,
  ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
  li: ({ children }) => <li className="text-slate-700">{children}</li>,
  strong: ({ children }) => <strong className="font-bold text-slate-900">{children}</strong>,
};

function MarkdownBox({ content, className = "" }) {
  return (
    <div className={`prose prose-sm prose-slate max-w-none bg-white rounded-lg p-4 border border-slate-200 ${className}`}>
      <ReactMarkdown components={mdComponents}>{content}</ReactMarkdown>
    </div>
  );
}

// ─── 1. Auto-Populate MDM Sections ────────────────────────────────────────────
function AutoPopulatePanel({ note, phase, onAddEntries, onClose }) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);

  const generate = async () => {
    setLoading(true);
    setSuggestions(null);
    const phaseLabel = phase === "initial" ? "Initial (on arrival)" : "Final (pre-discharge)";
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert clinician. Generate structured MDM sections for the ${phaseLabel} phase based on the note below. 
For the "Diagnostic Reasoning" section, list each diagnosis with its ICD-10 code.

Note data:
- Chief Complaint: ${note.chief_complaint || "Not documented"}
- HPI: ${note.history_of_present_illness || "Not documented"}
- Assessment: ${note.assessment || "Not documented"}
- Plan: ${note.plan || "Not documented"}
- Diagnoses: ${(note.diagnoses || []).join(", ") || "Not documented"}
- Medications: ${(note.medications || []).join(", ") || "Not documented"}
- Physical Exam: ${note.physical_exam || "Not documented"}

Generate exactly 4 MDM sections appropriate for ${phaseLabel}:
1. Diagnostic Reasoning – list each diagnosis with ICD-10 code, evidence from the note, and differential considerations
2. Risk Stratification – patient risk factors, comorbidities, and complexity level (straightforward / low / moderate / high)
3. Treatment Decisions – current management plan, rationale, alternatives considered
4. ${phase === "initial" ? "Initial Workup Plan – labs, imaging, consults ordered and why" : "Discharge Plan – disposition rationale, follow-up, patient education, safety netting"}

Return JSON only.`,
        response_json_schema: {
          type: "object",
          properties: {
            sections: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  content: { type: "string" },
                },
              },
            },
          },
        },
      });
      setSuggestions(res.sections || []);
    } catch {
      toast.error("Auto-populate failed");
    }
    setLoading(false);
  };

  const addAll = () => {
    onAddEntries(suggestions);
    setSuggestions(null);
    toast.success(`${suggestions.length} sections added`);
  };

  return (
    <div className="border-2 border-indigo-300 rounded-xl bg-indigo-50 overflow-hidden">
      {/* Panel header */}
      <div className="px-4 py-3 bg-indigo-100 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-indigo-700" />
          <span className="text-sm font-bold text-indigo-800">Auto-Populate MDM Sections</span>
          <Badge className="bg-indigo-200 text-indigo-800 border-0 text-xs">AI</Badge>
        </div>
        <div className="flex gap-2 items-center">
          <Button onClick={generate} disabled={loading} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
            {loading ? "Generating…" : suggestions ? "Re-generate" : "Generate Sections"}
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose} className="text-indigo-600 hover:bg-indigo-100 px-2">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <p className="text-xs text-indigo-700">
          AI will generate structured MDM sections (with ICD-10 codes) based on the current note content. Review each section before adding.
        </p>

        {loading && (
          <div className="flex items-center gap-2 text-indigo-600 text-sm py-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Analyzing note and generating MDM sections…
          </div>
        )}

        {suggestions && suggestions.length > 0 && (
          <div className="space-y-2">
            {suggestions.map((s, i) => (
              <div key={i} className="bg-white rounded-lg border border-indigo-200 p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <Bot className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                  <p className="text-xs font-bold text-indigo-700">{s.title}</p>
                  <Badge className="bg-indigo-50 text-indigo-500 border border-indigo-200 text-xs ml-auto">AI-generated</Badge>
                </div>
                <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed line-clamp-5 pl-5">{s.content}</p>
              </div>
            ))}
            <div className="flex gap-2 justify-between items-center pt-1">
              <span className="text-xs text-slate-500">{suggestions.length} sections ready to add — you can edit them after adding.</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setSuggestions(null)} className="gap-1 border-slate-300">
                  <X className="w-3.5 h-3.5" /> Dismiss
                </Button>
                <Button size="sm" onClick={addAll} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1">
                  <Plus className="w-3.5 h-3.5" /> Add All to MDM
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 2. Per-Phase AI Analysis Panel ───────────────────────────────────────────
function AIAnalysisPanel({ note, phase, entries }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    setAnalysis(null);
    const context = entries.map((e) => `**${e.title}**\n${e.content}`).join("\n\n");
    const phaseLabel = phase === "initial" ? "Initial (on arrival)" : "Final (pre-discharge)";
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert clinician reviewing the ${phaseLabel} Medical Decision Making documentation for a patient encounter.

Patient context:
- Chief Complaint: ${note.chief_complaint || "Not documented"}
- Diagnoses: ${(note.diagnoses || []).join(", ") || "Not documented"}
- Assessment: ${note.assessment || "Not documented"}

${phaseLabel} MDM Entries:
${context || "(No entries yet — analyze based on note context only)"}

Provide a structured analysis:
1. **Complexity Level** – Straightforward / Low / Moderate / High with justification
2. **Diagnostic Reasoning Quality** – Strengths and gaps in workup
3. **Treatment Decision Assessment** – Appropriateness and evidence basis
4. **Risk Stratification** – Key risk factors accounted for
5. **Recommendations** – Specific improvements to strengthen this MDM phase`,
      });
      setAnalysis(res);
    } catch {
      toast.error("AI analysis failed");
    }
    setLoading(false);
  };

  return (
    <div className="border border-purple-200 rounded-xl bg-purple-50/50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-semibold text-purple-800">AI Analysis — This Phase</span>
        </div>
        <Button onClick={run} disabled={loading} size="sm" className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
          {loading ? "Analyzing…" : analysis ? "Re-analyze" : "Analyze"}
        </Button>
      </div>
      {loading && (
        <div className="flex items-center gap-2 text-purple-600 text-sm py-1">
          <Loader2 className="w-4 h-4 animate-spin" /> Analyzing MDM documentation…
        </div>
      )}
      {analysis && !loading && <MarkdownBox content={analysis} className="border-purple-100" />}
    </div>
  );
}

// ─── 3. Comparative Analysis Panel ────────────────────────────────────────────
function ComparativeAnalysisPanel({ note, mdm }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const run = async () => {
    setLoading(true);
    setResult(null);
    setOpen(true);
    const initialCtx = mdm.initial.map((e) => `**${e.title}**\n${e.content}`).join("\n\n") || "(No initial MDM entries)";
    const finalCtx = mdm.final.map((e) => `**${e.title}**\n${e.content}`).join("\n\n") || "(No final MDM entries)";
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert clinician. Compare the Initial MDM and Final MDM for this patient encounter and provide a detailed comparative summary.

Patient: ${note.patient_name || "Unknown"} | CC: ${note.chief_complaint || "Not documented"}
Diagnoses: ${(note.diagnoses || []).join(", ") || "Not documented"}

--- INITIAL MDM (on arrival) ---
${initialCtx}

--- FINAL MDM (pre-discharge) ---
${finalCtx}

Provide a comparative summary covering:
1. **Complexity Change** – How did MDM complexity evolve from initial to final? Did it increase, decrease, or stay the same? Why?
2. **Diagnostic Workup Evolution** – What new diagnoses were added or ruled out? How did the diagnostic picture change?
3. **Treatment Plan Changes** – What changed in management between initial and final MDM? Were initial plans modified?
4. **Risk Profile Shift** – Did patient risk increase or decrease over the encounter?
5. **Overall Clinical Trajectory** – Concise narrative of the patient's clinical course from arrival to disposition
6. **Documentation Quality** – Gaps or areas for improvement across both phases

Be specific and reference the actual content from both MDM phases.`,
      });
      setResult(res);
    } catch {
      toast.error("Comparative analysis failed");
    }
    setLoading(false);
  };

  return (
    <div className="rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 overflow-hidden">
      <div className="px-5 py-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm">
            <GitCompare className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h4 className="font-bold text-base text-amber-900">Comparative MDM Analysis</h4>
            <p className="text-xs text-slate-500">AI highlights changes between Initial and Final MDM phases</p>
          </div>
        </div>
        <div className="flex gap-2">
          {result && (
            <Button size="sm" variant="outline" onClick={() => setOpen(!open)} className="border-amber-300 text-amber-700 gap-1">
              {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {open ? "Collapse" : "Expand"}
            </Button>
          )}
          <Button onClick={run} disabled={loading} size="sm" className="bg-amber-600 hover:bg-amber-700 text-white gap-2">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <GitCompare className="w-3.5 h-3.5" />}
            {loading ? "Comparing…" : result ? "Re-compare" : "Compare Phases"}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {open && (loading || result) && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <div className="px-5 pb-5">
              {loading && (
                <div className="flex items-center gap-2 text-amber-700 text-sm py-4">
                  <Loader2 className="w-4 h-4 animate-spin" /> Comparing Initial and Final MDM phases…
                </div>
              )}
              {result && !loading && <MarkdownBox content={result} className="border-amber-100" />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── 4. Discharge Summary Generator ───────────────────────────────────────────
function DischargeSummaryPanel({ note, mdm, noteId }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const generate = async () => {
    setLoading(true);
    setSummary(null);
    setOpen(true);
    const finalCtx = mdm.final.map((e) => `**${e.title}**\n${e.content}`).join("\n\n") || "(No final MDM entries)";
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert clinician generating a comprehensive discharge summary.

Patient Information:
- Name: ${note.patient_name || "Unknown"}
- Age: ${note.patient_age || "Unknown"}
- Gender: ${note.patient_gender || "Unknown"}
- MRN: ${note.patient_id || "Unknown"}
- Date of Visit: ${note.date_of_visit || "Unknown"}
- Chief Complaint: ${note.chief_complaint || "Not documented"}

Clinical Data:
- HPI: ${note.history_of_present_illness || "Not documented"}
- Assessment: ${note.assessment || "Not documented"}
- Diagnoses: ${(note.diagnoses || []).join(", ") || "Not documented"}
- Medications: ${(note.medications || []).join(", ") || "Not documented"}
- Plan: ${note.plan || "Not documented"}

Final MDM:
${finalCtx}

Generate a formal, professional discharge summary with these sections:
1. **Admission Diagnosis** – Primary and secondary diagnoses with ICD-10 codes
2. **Hospital Course** – Narrative summary of the encounter, key events, workup results
3. **Discharge Diagnoses** – Final diagnoses with ICD-10 codes
4. **Procedures Performed** – Any procedures during the encounter
5. **Discharge Condition** – Patient's condition at discharge
6. **Discharge Medications** – Current medications with dosing (from note data)
7. **Discharge Instructions** – Activity restrictions, diet, wound care if applicable
8. **Follow-Up** – Specific follow-up appointments, timeline, and who to call with concerns
9. **Return Precautions** – Symptoms warranting immediate return to ED or urgent care`,
      });
      setSummary(res);
    } catch {
      toast.error("Discharge summary generation failed");
    }
    setLoading(false);
  };

  const saveToNote = async () => {
    setSaving(true);
    try {
      await base44.entities.ClinicalNote.update(noteId, { discharge_summary: summary });
      toast.success("Discharge summary saved to note");
    } catch {
      toast.error("Failed to save discharge summary");
    }
    setSaving(false);
  };

  return (
    <div className="rounded-2xl border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50 overflow-hidden">
      <div className="px-5 py-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm">
            <FileText className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h4 className="font-bold text-base text-teal-900">Discharge Summary Generator</h4>
            <p className="text-xs text-slate-500">AI generates a complete discharge summary from Final MDM and note details</p>
          </div>
        </div>
        <div className="flex gap-2">
          {summary && (
            <Button size="sm" variant="outline" onClick={() => setOpen(!open)} className="border-teal-300 text-teal-700 gap-1">
              {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {open ? "Collapse" : "Expand"}
            </Button>
          )}
          <Button onClick={generate} disabled={loading} size="sm" className="bg-teal-600 hover:bg-teal-700 text-white gap-2">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
            {loading ? "Generating…" : summary ? "Regenerate" : "Generate Summary"}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {open && (loading || summary) && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <div className="px-5 pb-5 space-y-3">
              {loading && (
                <div className="flex items-center gap-2 text-teal-700 text-sm py-4">
                  <Loader2 className="w-4 h-4 animate-spin" /> Generating discharge summary from Final MDM and note data…
                </div>
              )}
              {summary && !loading && (
                <>
                  <MarkdownBox content={summary} className="border-teal-100" />
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" onClick={saveToNote} disabled={saving} className="bg-teal-600 hover:bg-teal-700 text-white gap-1">
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Save to Note
                    </Button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Entry Card ────────────────────────────────────────────────────────────────
function EntryCard({ entry, idx, onDelete, onEdit, isAI }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(entry.title);
  const [editContent, setEditContent] = useState(entry.content);

  const saveEdit = () => {
    if (!editTitle.trim() || !editContent.trim()) return;
    onEdit(entry.id, { title: editTitle, content: editContent });
    setEditing(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <button onClick={() => !editing && setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors text-left">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
            {idx + 1}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 text-sm truncate">{entry.title}</p>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3" />{format(new Date(entry.timestamp), "MMM d, yyyy h:mm a")}
            </p>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="border-t border-slate-100">
            <div className="px-4 py-4 space-y-3">
              {editing ? (
                <>
                  <input className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                    value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                  <Textarea className="min-h-[140px] text-sm" value={editContent} onChange={(e) => setEditContent(e.target.value)} />
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="outline" onClick={() => setEditing(false)} className="gap-1"><X className="w-3.5 h-3.5" /> Cancel</Button>
                    <Button size="sm" onClick={saveEdit} className="bg-purple-600 hover:bg-purple-700 text-white gap-1"><Check className="w-3.5 h-3.5" /> Save</Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{entry.content}</p>
                  <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                    <Button size="sm" variant="ghost" onClick={() => setEditing(true)} className="gap-1 text-slate-600 hover:text-slate-900"><Pencil className="w-3.5 h-3.5" /> Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => onDelete(entry.id)} className="gap-1 text-red-600 hover:bg-red-50 hover:text-red-700"><Trash2 className="w-3.5 h-3.5" /> Delete</Button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Add Entry Form ────────────────────────────────────────────────────────────
function AddEntryForm({ onAdd, onCancel }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const submit = () => {
    if (!title.trim() || !content.trim()) { toast.error("Title and content required"); return; }
    onAdd({ title: title.trim(), content: content.trim() });
  };
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      className="bg-white rounded-xl border-2 border-purple-200 p-4 space-y-3 shadow-sm">
      <input type="text" placeholder="Title (e.g., Diagnostic Reasoning, Risk Assessment)"
        value={title} onChange={(e) => setTitle(e.target.value)}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100" />
      <Textarea placeholder="Document your clinical reasoning…" value={content}
        onChange={(e) => setContent(e.target.value)} className="min-h-[140px] text-sm" />
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="outline" onClick={onCancel} className="gap-1"><X className="w-3.5 h-3.5" /> Cancel</Button>
        <Button size="sm" onClick={submit} className="bg-purple-600 hover:bg-purple-700 text-white gap-1"><Plus className="w-3.5 h-3.5" /> Add Entry</Button>
      </div>
    </motion.div>
  );
}

// ─── Phase Section ─────────────────────────────────────────────────────────────
function MDMPhaseSection({ phase, label, icon: Icon, color, entries, note, onAdd, onDelete, onEdit }) {
  const [showAdd, setShowAdd] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showAutoPopulate, setShowAutoPopulate] = useState(false);

  const colorMap = {
    blue: {
      wrap: "from-blue-50 to-indigo-50 border-blue-200",
      icon: "text-blue-600", title: "text-blue-900",
      badge: "bg-blue-100 text-blue-700",
      addBtn: "border-blue-300 text-blue-700 hover:bg-blue-50",
    },
    emerald: {
      wrap: "from-emerald-50 to-teal-50 border-emerald-200",
      icon: "text-emerald-600", title: "text-emerald-900",
      badge: "bg-emerald-100 text-emerald-700",
      addBtn: "border-emerald-300 text-emerald-700 hover:bg-emerald-50",
    },
  };
  const c = colorMap[color];

  const handleAddEntries = (entriesData) => {
    entriesData.forEach((e) => onAdd(e));
    setShowAutoPopulate(false);
  };

  return (
    <div className={`rounded-2xl border-2 bg-gradient-to-br ${c.wrap} overflow-hidden`}>
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm">
            <Icon className={`w-5 h-5 ${c.icon}`} />
          </div>
          <div>
            <h4 className={`font-bold text-base ${c.title}`}>{label}</h4>
            <p className="text-xs text-slate-500">
              {phase === "initial" ? "Document reasoning at time of presentation" : "Document reasoning prior to discharge / disposition"}
            </p>
          </div>
          <Badge className={`${c.badge} border-0 ml-1`}>{entries.length} {entries.length === 1 ? "entry" : "entries"}</Badge>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={() => { setShowAutoPopulate(!showAutoPopulate); setShowAI(false); }}
            className="border-indigo-300 text-indigo-700 hover:bg-indigo-50 gap-1.5">
            <Wand2 className="w-3.5 h-3.5" /> Auto-Populate
          </Button>
          <Button size="sm" variant="outline" onClick={() => { setShowAI(!showAI); setShowAutoPopulate(false); }}
            className="border-purple-300 text-purple-700 hover:bg-purple-50 gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> {showAI ? "Hide AI" : "AI Analysis"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowAdd(!showAdd)} className={`gap-1.5 ${c.addBtn}`}>
            <Plus className="w-3.5 h-3.5" /> Add Entry
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 pb-5 space-y-3">
        <AnimatePresence>
          {showAutoPopulate && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
              <AutoPopulatePanel note={note} phase={phase} onAddEntries={handleAddEntries} />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showAI && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
              <AIAnalysisPanel note={note} phase={phase} entries={entries} />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showAdd && (
            <AddEntryForm
              onAdd={(data) => { onAdd(data); setShowAdd(false); }}
              onCancel={() => setShowAdd(false)}
            />
          )}
        </AnimatePresence>

        {entries.length === 0 && !showAdd ? (
          <div className="text-center py-8 bg-white/60 rounded-xl border border-dashed border-slate-300">
            <Brain className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm font-medium">No entries yet</p>
            <p className="text-xs text-slate-400 mt-1">Use "Auto-Populate" to generate AI sections or "Add Entry" to write manually</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, idx) => (
              <EntryCard key={entry.id} entry={entry} idx={idx} onDelete={onDelete} onEdit={onEdit} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function MedicalDecisionMakingTab({ note, onUpdateNote, noteId }) {
  const parseMDM = () => {
    if (!note.mdm) return { initial: [], final: [] };
    try {
      const parsed = typeof note.mdm === "string" ? JSON.parse(note.mdm) : note.mdm;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && (parsed.initial || parsed.final)) {
        return { initial: parsed.initial || [], final: parsed.final || [] };
      }
      if (Array.isArray(parsed)) return { initial: parsed, final: [] };
      return { initial: [], final: [] };
    } catch {
      return { initial: [], final: [] };
    }
  };

  const [mdm, setMdm] = useState(parseMDM);

  const persist = async (updated) => {
    setMdm(updated);
    await base44.entities.ClinicalNote.update(noteId, { mdm: JSON.stringify(updated) });
  };

  const addEntry = async (phase, data) => {
    const entry = { id: `mdm_${Date.now()}_${Math.random()}`, title: data.title, content: data.content, timestamp: new Date().toISOString() };
    const updated = { ...mdm, [phase]: [...mdm[phase], entry] };
    await persist(updated);
    toast.success("Entry added");
  };

  const deleteEntry = async (phase, id) => {
    const updated = { ...mdm, [phase]: mdm[phase].filter((e) => e.id !== id) };
    await persist(updated);
    toast.success("Entry removed");
  };

  const editEntry = async (phase, id, changes) => {
    const updated = { ...mdm, [phase]: mdm[phase].map((e) => e.id === id ? { ...e, ...changes } : e) };
    await persist(updated);
    toast.success("Entry updated");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-200 p-5">
        <div className="flex items-center gap-3 mb-1">
          <Brain className="w-6 h-6 text-purple-600" />
          <h3 className="text-xl font-bold text-slate-900">Medical Decision Making</h3>
        </div>
        <p className="text-sm text-slate-600">
          Document clinical reasoning across two phases with AI-powered auto-population (with ICD-10 codes), per-phase analysis, comparative summary, and discharge summary generation.
        </p>
      </div>

      {/* Initial MDM */}
      <MDMPhaseSection
        phase="initial" label="Initial MDM — On Arrival" icon={LogIn} color="blue"
        entries={mdm.initial} note={note}
        onAdd={(data) => addEntry("initial", data)}
        onDelete={(id) => deleteEntry("initial", id)}
        onEdit={(id, changes) => editEntry("initial", id, changes)}
      />

      {/* Final MDM */}
      <MDMPhaseSection
        phase="final" label="Final MDM — Pre-Discharge" icon={LogOut} color="emerald"
        entries={mdm.final} note={note}
        onAdd={(data) => addEntry("final", data)}
        onDelete={(id) => deleteEntry("final", id)}
        onEdit={(id, changes) => editEntry("final", id, changes)}
      />

      {/* Comparative Analysis */}
      <ComparativeAnalysisPanel note={note} mdm={mdm} />

      {/* Discharge Summary */}
      <DischargeSummaryPanel note={note} mdm={mdm} noteId={noteId} />

      {/* Save Full MDM */}
      {(mdm.initial.length > 0 || mdm.final.length > 0) && (
        <Button
          onClick={async () => {
            const parts = [];
            if (mdm.initial.length > 0) parts.push("# Initial MDM — On Arrival\n" + mdm.initial.map((e) => `## ${e.title}\n${e.content}`).join("\n\n"));
            if (mdm.final.length > 0) parts.push("# Final MDM — Pre-Discharge\n" + mdm.final.map((e) => `## ${e.title}\n${e.content}`).join("\n\n"));
            await base44.entities.ClinicalNote.update(noteId, { mdm: parts.join("\n\n---\n\n") });
            toast.success("MDM saved to clinical note");
          }}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white gap-2"
        >
          <Check className="w-4 h-4" /> Save Full MDM to Clinical Note
        </Button>
      )}
    </div>
  );
}