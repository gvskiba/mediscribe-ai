import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Brain,
  Sparkles,
  LogIn,
  LogOut,
  Loader2,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";

// ─── Inline AI Analysis Panel ─────────────────────────────────────────────────
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
${context || "(No entries yet)"}

Please provide a concise, structured analysis covering:
1. **Complexity Assessment** – Level of MDM complexity (straightforward, low, moderate, high)
2. **Diagnostic Reasoning** – Evaluate the diagnostic workup and reasoning quality
3. **Treatment Decisions** – Assess appropriateness of management decisions
4. **Risk Stratification** – Patient risk factors considered
5. **Gaps / Suggestions** – Missing elements or areas to strengthen the MDM

Be direct and clinically relevant.`,
      });
      setAnalysis(res);
    } catch (err) {
      toast.error("AI analysis failed");
    }
    setLoading(false);
  };

  return (
    <div className="border border-purple-200 rounded-xl bg-purple-50/50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-semibold text-purple-800">AI Analysis</span>
        </div>
        <Button
          onClick={run}
          disabled={loading}
          size="sm"
          className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
          {loading ? "Analyzing…" : analysis ? "Re-analyze" : "Analyze"}
        </Button>
      </div>
      {loading && (
        <div className="flex items-center gap-2 text-purple-600 text-sm py-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Analyzing MDM documentation…
        </div>
      )}
      {analysis && !loading && (
        <div className="prose prose-sm prose-slate max-w-none bg-white rounded-lg p-4 border border-purple-100">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-2 leading-relaxed text-slate-700">{children}</p>,
              h1: ({ children }) => <h1 className="text-base font-bold mt-3 mb-1 text-slate-900">{children}</h1>,
              h2: ({ children }) => <h2 className="text-sm font-bold mt-2 mb-1 text-slate-900">{children}</h2>,
              h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1 text-slate-800">{children}</h3>,
              ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
              li: ({ children }) => <li className="text-slate-700">{children}</li>,
              strong: ({ children }) => <strong className="font-bold text-slate-900">{children}</strong>,
            }}
          >
            {analysis}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}

// ─── Single Entry Card ─────────────────────────────────────────────────────────
function EntryCard({ entry, idx, onDelete, onEdit }) {
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
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm"
    >
      <button
        onClick={() => !editing && setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
            {idx + 1}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 text-sm truncate">{entry.title}</p>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3" />
              {format(new Date(entry.timestamp), "MMM d, yyyy h:mm a")}
            </p>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-slate-100"
          >
            <div className="px-4 py-4 space-y-3">
              {editing ? (
                <>
                  <input
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                  <Textarea
                    className="min-h-[140px] text-sm"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="outline" onClick={() => setEditing(false)} className="gap-1">
                      <X className="w-3.5 h-3.5" /> Cancel
                    </Button>
                    <Button size="sm" onClick={saveEdit} className="bg-purple-600 hover:bg-purple-700 text-white gap-1">
                      <Check className="w-3.5 h-3.5" /> Save
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{entry.content}</p>
                  <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                    <Button size="sm" variant="ghost" onClick={() => setEditing(true)} className="gap-1 text-slate-600 hover:text-slate-900">
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onDelete(entry.id)} className="gap-1 text-red-600 hover:bg-red-50 hover:text-red-700">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </Button>
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
    setTitle(""); setContent("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="bg-white rounded-xl border-2 border-purple-200 p-4 space-y-3 shadow-sm"
    >
      <input
        type="text"
        placeholder="Title (e.g., Clinical Reasoning, Risk Assessment)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
      />
      <Textarea
        placeholder="Document your clinical reasoning, decision factors, and justification…"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[140px] text-sm"
      />
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="outline" onClick={onCancel} className="gap-1">
          <X className="w-3.5 h-3.5" /> Cancel
        </Button>
        <Button size="sm" onClick={submit} className="bg-purple-600 hover:bg-purple-700 text-white gap-1">
          <Plus className="w-3.5 h-3.5" /> Add Entry
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Phase Section ─────────────────────────────────────────────────────────────
function MDMPhaseSection({ phase, label, icon: Icon, color, entries, note, onAdd, onDelete, onEdit }) {
  const [showAdd, setShowAdd] = useState(false);
  const [showAI, setShowAI] = useState(false);

  const colorMap = {
    blue: {
      header: "from-blue-50 to-indigo-50 border-blue-200",
      icon: "text-blue-600",
      title: "text-blue-900",
      badge: "bg-blue-100 text-blue-700",
      addBtn: "border-blue-300 text-blue-700 hover:bg-blue-50",
      aiBtn: "border-purple-300 text-purple-700 hover:bg-purple-50",
    },
    emerald: {
      header: "from-emerald-50 to-teal-50 border-emerald-200",
      icon: "text-emerald-600",
      title: "text-emerald-900",
      badge: "bg-emerald-100 text-emerald-700",
      addBtn: "border-emerald-300 text-emerald-700 hover:bg-emerald-50",
      aiBtn: "border-purple-300 text-purple-700 hover:bg-purple-50",
    },
  };
  const c = colorMap[color];

  return (
    <div className={`rounded-2xl border-2 bg-gradient-to-br ${c.header} overflow-hidden`}>
      {/* Phase Header */}
      <div className="px-5 py-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm border border-white/80`}>
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
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowAI(!showAI)} className={`gap-1.5 ${c.aiBtn}`}>
            <Sparkles className="w-3.5 h-3.5" />
            {showAI ? "Hide AI" : "AI Analysis"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowAdd(!showAdd)} className={`gap-1.5 ${c.addBtn}`}>
            <Plus className="w-3.5 h-3.5" /> Add Entry
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 pb-5 space-y-3">
        {/* AI Panel */}
        <AnimatePresence>
          {showAI && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
              <AIAnalysisPanel note={note} phase={phase} entries={entries} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Form */}
        <AnimatePresence>
          {showAdd && (
            <AddEntryForm
              onAdd={(data) => { onAdd(data); setShowAdd(false); }}
              onCancel={() => setShowAdd(false)}
            />
          )}
        </AnimatePresence>

        {/* Entries */}
        {entries.length === 0 && !showAdd ? (
          <div className="text-center py-8 bg-white/60 rounded-xl border border-dashed border-slate-300">
            <Brain className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm font-medium">No entries yet</p>
            <p className="text-xs text-slate-400 mt-1">Click "Add Entry" to document your reasoning</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, idx) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                idx={idx}
                onDelete={onDelete}
                onEdit={onEdit}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function MedicalDecisionMakingTab({ note, onUpdateNote, noteId }) {
  // MDM data shape: { initial: [], final: [] }
  const parseMDM = () => {
    if (!note.mdm) return { initial: [], final: [] };
    try {
      const parsed = typeof note.mdm === "string" ? JSON.parse(note.mdm) : note.mdm;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && (parsed.initial || parsed.final)) {
        return { initial: parsed.initial || [], final: parsed.final || [] };
      }
      // Legacy: flat array → put all in initial
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
    const entry = { id: `mdm_${Date.now()}`, title: data.title, content: data.content, timestamp: new Date().toISOString() };
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
    const updated = {
      ...mdm,
      [phase]: mdm[phase].map((e) => e.id === id ? { ...e, ...changes } : e),
    };
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
          Document clinical reasoning across two phases — initial presentation and final disposition — with independent AI analysis for each.
        </p>
      </div>

      {/* Initial MDM */}
      <MDMPhaseSection
        phase="initial"
        label="Initial MDM — On Arrival"
        icon={LogIn}
        color="blue"
        entries={mdm.initial}
        note={note}
        onAdd={(data) => addEntry("initial", data)}
        onDelete={(id) => deleteEntry("initial", id)}
        onEdit={(id, changes) => editEntry("initial", id, changes)}
      />

      {/* Final MDM */}
      <MDMPhaseSection
        phase="final"
        label="Final MDM — Pre-Discharge"
        icon={LogOut}
        color="emerald"
        entries={mdm.final}
        note={note}
        onAdd={(data) => addEntry("final", data)}
        onDelete={(id) => deleteEntry("final", id)}
        onEdit={(id, changes) => editEntry("final", id, changes)}
      />

      {/* Save Both to Note */}
      {(mdm.initial.length > 0 || mdm.final.length > 0) && (
        <Button
          onClick={async () => {
            const parts = [];
            if (mdm.initial.length > 0) {
              parts.push("# Initial MDM — On Arrival\n" + mdm.initial.map((e) => `## ${e.title}\n${e.content}`).join("\n\n"));
            }
            if (mdm.final.length > 0) {
              parts.push("# Final MDM — Pre-Discharge\n" + mdm.final.map((e) => `## ${e.title}\n${e.content}`).join("\n\n"));
            }
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