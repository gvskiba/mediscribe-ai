import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import {
  Clock, Plus, Trash2, ChevronDown, ChevronUp, Brain, Sparkles,
  LogIn, LogOut, Loader2, Pencil, Check, X, GitCompare, FileText, Wand2, Bot,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";

// ─── Dark theme tokens ─────────────────────────────────────────────────────────
const T = {
  navy:   "#050f1e",
  slate:  "#0b1d35",
  panel:  "#0e2340",
  edge:   "#162d4f",
  border: "#1e3a5f",
  muted:  "#2a4d72",
  dim:    "#4a7299",
  text:   "#c8ddf0",
  bright: "#e8f4ff",
  teal:   "#00d4bc",
  teal2:  "#00a896",
  amber:  "#f5a623",
  red:    "#ff5c6c",
  green:  "#2ecc71",
  purple: "#9b6dff",
};

// ─── Shared inline styles ──────────────────────────────────────────────────────
const panelStyle = {
  background: T.panel,
  border: `1px solid ${T.border}`,
  borderRadius: 14,
  overflow: "hidden",
};

const panelHeaderStyle = {
  padding: "14px 20px",
  borderBottom: `1px solid ${T.border}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const panelTitleStyle = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: T.dim,
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const edgeBox = {
  background: T.edge,
  border: `1px solid ${T.border}`,
  borderRadius: 10,
  padding: "12px 14px",
};

// ─── Tiny helpers ──────────────────────────────────────────────────────────────
function TitleIcon({ bg, children }) {
  return (
    <span style={{ width: 22, height: 22, borderRadius: 5, background: bg, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
      {children}
    </span>
  );
}

function DarkBtn({ onClick, disabled, children, variant = "primary", size = "sm" }) {
  const base = {
    padding: size === "xs" ? "4px 10px" : "7px 14px",
    borderRadius: 8,
    fontSize: size === "xs" ? 11 : 12,
    fontWeight: 600,
    cursor: "pointer",
    border: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    transition: "all 0.2s",
    fontFamily: "inherit",
    whiteSpace: "nowrap",
    opacity: disabled ? 0.5 : 1,
    pointerEvents: disabled ? "none" : "auto",
  };
  if (variant === "primary") return (
    <button style={{ ...base, background: `linear-gradient(135deg, ${T.teal}, ${T.teal2})`, color: T.navy }} onClick={onClick} disabled={disabled}>{children}</button>
  );
  if (variant === "indigo") return (
    <button style={{ ...base, background: "rgba(99,102,241,0.15)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.3)" }} onClick={onClick} disabled={disabled}>{children}</button>
  );
  if (variant === "purple") return (
    <button style={{ ...base, background: "rgba(155,109,255,0.15)", color: T.purple, border: `1px solid rgba(155,109,255,0.3)` }} onClick={onClick} disabled={disabled}>{children}</button>
  );
  if (variant === "amber") return (
    <button style={{ ...base, background: "rgba(245,166,35,0.15)", color: T.amber, border: `1px solid rgba(245,166,35,0.3)` }} onClick={onClick} disabled={disabled}>{children}</button>
  );
  if (variant === "teal") return (
    <button style={{ ...base, background: "rgba(0,212,188,0.12)", color: T.teal, border: `1px solid rgba(0,212,188,0.25)` }} onClick={onClick} disabled={disabled}>{children}</button>
  );
  // ghost
  return (
    <button style={{ ...base, background: "transparent", color: T.dim, border: `1px solid ${T.border}` }} onClick={onClick} disabled={disabled}>{children}</button>
  );
}

function DarkTextarea({ value, onChange, placeholder, rows = 6 }) {
  return (
    <textarea
      value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      style={{
        width: "100%", background: T.edge, border: `1px solid ${T.border}`, borderRadius: 8,
        color: T.bright, fontSize: 13, padding: "10px 12px", fontFamily: "inherit",
        resize: "vertical", outline: "none", lineHeight: 1.6,
      }}
      onFocus={e => e.target.style.borderColor = T.teal}
      onBlur={e => e.target.style.borderColor = T.border}
    />
  );
}

function DarkInput({ value, onChange, placeholder }) {
  return (
    <input
      value={value} onChange={onChange} placeholder={placeholder}
      style={{
        width: "100%", background: T.edge, border: `1px solid ${T.border}`, borderRadius: 8,
        color: T.bright, fontSize: 13, padding: "8px 12px", fontFamily: "inherit", outline: "none",
      }}
      onFocus={e => e.target.style.borderColor = T.teal}
      onBlur={e => e.target.style.borderColor = T.border}
    />
  );
}

const mdComponents = {
  p: ({ children }) => <p style={{ color: T.text, fontSize: 13, lineHeight: 1.65, marginBottom: 8 }}>{children}</p>,
  h1: ({ children }) => <h1 style={{ color: T.bright, fontSize: 14, fontWeight: 700, margin: "12px 0 4px" }}>{children}</h1>,
  h2: ({ children }) => <h2 style={{ color: T.bright, fontSize: 13, fontWeight: 700, margin: "10px 0 4px" }}>{children}</h2>,
  h3: ({ children }) => <h3 style={{ color: T.bright, fontSize: 13, fontWeight: 600, margin: "8px 0 4px" }}>{children}</h3>,
  ul: ({ children }) => <ul style={{ paddingLeft: 18, marginBottom: 8, color: T.text }}>{children}</ul>,
  ol: ({ children }) => <ol style={{ paddingLeft: 18, marginBottom: 8, color: T.text }}>{children}</ol>,
  li: ({ children }) => <li style={{ marginBottom: 3, fontSize: 13, lineHeight: 1.5 }}>{children}</li>,
  strong: ({ children }) => <strong style={{ color: T.bright, fontWeight: 600 }}>{children}</strong>,
};

function DarkMarkdownBox({ content }) {
  return (
    <div style={{ background: T.edge, border: `1px solid ${T.border}`, borderRadius: 10, padding: "14px 16px" }}>
      <ReactMarkdown components={mdComponents}>{content}</ReactMarkdown>
    </div>
  );
}

// ─── 1. Auto-Populate Panel ────────────────────────────────────────────────────
function AutoPopulatePanel({ note, phase, onAddEntries, onClose }) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);

  const generate = async () => {
    setLoading(true);
    setSuggestions(null);
    const phaseLabel = phase === "initial" ? "Initial (on arrival)" : "Final (pre-discharge)";
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

Generate exactly 4 MDM sections:
1. Diagnostic Reasoning – each diagnosis with ICD-10 code and evidence
2. Risk Stratification – risk factors, comorbidities, complexity level
3. Treatment Decisions – current plan, rationale, alternatives
4. ${phase === "initial" ? "Initial Workup Plan – labs, imaging, consults" : "Discharge Plan – disposition, follow-up, patient education"}

Return JSON only.`,
      response_json_schema: {
        type: "object",
        properties: {
          sections: {
            type: "array",
            items: { type: "object", properties: { title: { type: "string" }, content: { type: "string" } } },
          },
        },
      },
    });
    setSuggestions(res.sections || []);
    setLoading(false);
  };

  const addAll = () => {
    onAddEntries(suggestions.map(s => ({ ...s, ai_generated: true })));
    setSuggestions(null);
    toast.success(`${suggestions.length} sections added`);
  };

  return (
    <div style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, background: "rgba(99,102,241,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Bot size={14} color="#a5b4fc" />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#a5b4fc", textTransform: "uppercase", letterSpacing: "0.08em" }}>AI Auto-Populate</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <DarkBtn onClick={generate} disabled={loading} variant="indigo">
            {loading ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
            {loading ? "Generating…" : suggestions ? "Re-generate" : "Generate Sections"}
          </DarkBtn>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: T.dim, padding: 4 }}>
            <X size={14} />
          </button>
        </div>
      </div>

      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        <p style={{ fontSize: 11, color: T.dim }}>
          AI generates structured MDM sections with ICD-10 codes from note content. Review before adding — all sections are editable after.
        </p>

        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#a5b4fc", fontSize: 13, padding: "8px 0" }}>
            <Loader2 size={14} className="animate-spin" /> Analyzing note and generating MDM sections…
          </div>
        )}

        {suggestions && suggestions.length > 0 && (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {suggestions.map((s, i) => (
                <div key={i} style={{ background: T.edge, border: `1px solid rgba(99,102,241,0.25)`, borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <Bot size={12} color="#a5b4fc" />
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#a5b4fc" }}>{s.title}</span>
                    <span style={{ marginLeft: "auto", fontSize: 10, background: "rgba(99,102,241,0.15)", color: "#a5b4fc", borderRadius: 4, padding: "1px 6px", border: "1px solid rgba(99,102,241,0.25)" }}>AI-generated</span>
                  </div>
                  <p style={{ fontSize: 12, color: T.text, lineHeight: 1.55, display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{s.content}</p>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, paddingTop: 4 }}>
              <span style={{ fontSize: 11, color: T.dim }}>{suggestions.length} sections ready — editable after adding</span>
              <div style={{ display: "flex", gap: 8 }}>
                <DarkBtn onClick={() => setSuggestions(null)} variant="ghost"><X size={12} /> Dismiss</DarkBtn>
                <DarkBtn onClick={addAll} variant="indigo"><Plus size={12} /> Add All to MDM</DarkBtn>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── 2. Per-Phase AI Analysis ──────────────────────────────────────────────────
function AIAnalysisPanel({ note, phase, entries }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    setAnalysis(null);
    const context = entries.map(e => `**${e.title}**\n${e.content}`).join("\n\n");
    const phaseLabel = phase === "initial" ? "Initial (on arrival)" : "Final (pre-discharge)";
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert clinician reviewing the ${phaseLabel} MDM documentation.
Patient: CC: ${note.chief_complaint || "Not documented"}, Diagnoses: ${(note.diagnoses || []).join(", ") || "Not documented"}

${phaseLabel} MDM Entries:
${context || "(No entries yet)"}

Provide structured analysis:
1. **Complexity Level** – Straightforward / Low / Moderate / High with justification
2. **Diagnostic Reasoning Quality** – Strengths and gaps
3. **Treatment Decision Assessment** – Appropriateness and evidence
4. **Risk Stratification** – Key risk factors accounted for
5. **Recommendations** – Specific improvements`,
    });
    setAnalysis(res);
    setLoading(false);
  };

  return (
    <div style={{ background: "rgba(155,109,255,0.06)", border: `1px solid rgba(155,109,255,0.2)`, borderRadius: 12, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Sparkles size={14} color={T.purple} />
          <span style={{ fontSize: 12, fontWeight: 700, color: T.purple, textTransform: "uppercase", letterSpacing: "0.08em" }}>AI Analysis — This Phase</span>
        </div>
        <DarkBtn onClick={run} disabled={loading} variant="purple">
          {loading ? <Loader2 size={12} className="animate-spin" /> : <Brain size={12} />}
          {loading ? "Analyzing…" : analysis ? "Re-analyze" : "Analyze"}
        </DarkBtn>
      </div>
      {loading && <div style={{ display: "flex", alignItems: "center", gap: 8, color: T.purple, fontSize: 13 }}><Loader2 size={13} className="animate-spin" /> Analyzing MDM documentation…</div>}
      {analysis && !loading && <DarkMarkdownBox content={analysis} />}
    </div>
  );
}

// ─── 3. Comparative Analysis Panel ────────────────────────────────────────────
function ComparativeAnalysisPanel({ note, mdm }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const run = async () => {
    setLoading(true); setResult(null); setOpen(true);
    const initialCtx = mdm.initial.map(e => `**${e.title}**\n${e.content}`).join("\n\n") || "(No initial MDM entries)";
    const finalCtx = mdm.final.map(e => `**${e.title}**\n${e.content}`).join("\n\n") || "(No final MDM entries)";
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Compare Initial MDM and Final MDM for this patient encounter.
Patient: ${note.patient_name || "Unknown"} | CC: ${note.chief_complaint || "Not documented"}
--- INITIAL MDM ---\n${initialCtx}\n--- FINAL MDM ---\n${finalCtx}
Cover: 1. Complexity Change 2. Diagnostic Evolution 3. Treatment Changes 4. Risk Profile Shift 5. Clinical Trajectory 6. Documentation Quality`,
    });
    setResult(res);
    setLoading(false);
  };

  return (
    <div style={{ background: "rgba(245,166,35,0.05)", border: `1px solid rgba(245,166,35,0.25)`, borderRadius: 14, overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", borderBottom: open && (loading || result) ? `1px solid rgba(245,166,35,0.2)` : "none", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(245,166,35,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <GitCompare size={16} color={T.amber} />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: T.bright }}>Comparative MDM Analysis</p>
            <p style={{ fontSize: 11, color: T.dim }}>AI highlights changes between Initial and Final MDM phases</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {result && (
            <DarkBtn onClick={() => setOpen(!open)} variant="ghost" size="xs">
              {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />} {open ? "Collapse" : "Expand"}
            </DarkBtn>
          )}
          <DarkBtn onClick={run} disabled={loading} variant="amber">
            {loading ? <Loader2 size={12} className="animate-spin" /> : <GitCompare size={12} />}
            {loading ? "Comparing…" : result ? "Re-compare" : "Compare Phases"}
          </DarkBtn>
        </div>
      </div>
      <AnimatePresence>
        {open && (loading || result) && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <div style={{ padding: "16px 20px" }}>
              {loading && <div style={{ display: "flex", alignItems: "center", gap: 8, color: T.amber, fontSize: 13 }}><Loader2 size={14} className="animate-spin" /> Comparing MDM phases…</div>}
              {result && !loading && <DarkMarkdownBox content={result} />}
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
    setLoading(true); setSummary(null); setOpen(true);
    const finalCtx = mdm.final.map(e => `**${e.title}**\n${e.content}`).join("\n\n") || "(No final MDM entries)";
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate a formal discharge summary.
Patient: ${note.patient_name || "Unknown"}, Age ${note.patient_age || "?"}, MRN ${note.patient_id || "?"}
CC: ${note.chief_complaint || "Not documented"}
Assessment: ${note.assessment || "Not documented"}
Diagnoses: ${(note.diagnoses || []).join(", ") || "Not documented"}
Medications: ${(note.medications || []).join(", ") || "Not documented"}
Plan: ${note.plan || "Not documented"}
Final MDM:\n${finalCtx}

Sections: 1. Admission Diagnosis (with ICD-10) 2. Hospital Course 3. Discharge Diagnoses 4. Procedures Performed 5. Discharge Condition 6. Discharge Medications 7. Discharge Instructions 8. Follow-Up 9. Return Precautions`,
    });
    setSummary(res);
    setLoading(false);
  };

  const saveToNote = async () => {
    setSaving(true);
    await base44.entities.ClinicalNote.update(noteId, { discharge_summary: summary });
    toast.success("Discharge summary saved to note");
    setSaving(false);
  };

  return (
    <div style={{ background: `rgba(0,212,188,0.04)`, border: `1px solid rgba(0,212,188,0.2)`, borderRadius: 14, overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", borderBottom: open && (loading || summary) ? `1px solid rgba(0,212,188,0.15)` : "none", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: `rgba(0,212,188,0.12)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FileText size={16} color={T.teal} />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: T.bright }}>Discharge Summary Generator</p>
            <p style={{ fontSize: 11, color: T.dim }}>AI generates a complete discharge summary from Final MDM and note data</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {summary && (
            <DarkBtn onClick={() => setOpen(!open)} variant="ghost" size="xs">
              {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />} {open ? "Collapse" : "Expand"}
            </DarkBtn>
          )}
          <DarkBtn onClick={generate} disabled={loading} variant="teal">
            {loading ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
            {loading ? "Generating…" : summary ? "Regenerate" : "Generate Summary"}
          </DarkBtn>
        </div>
      </div>
      <AnimatePresence>
        {open && (loading || summary) && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
              {loading && <div style={{ display: "flex", alignItems: "center", gap: 8, color: T.teal, fontSize: 13 }}><Loader2 size={14} className="animate-spin" /> Generating discharge summary…</div>}
              {summary && !loading && (
                <>
                  <DarkMarkdownBox content={summary} />
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <DarkBtn onClick={saveToNote} disabled={saving} variant="primary">
                      {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Save to Note
                    </DarkBtn>
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
      style={{
        background: T.edge,
        border: `1px solid ${isAI ? "rgba(99,102,241,0.3)" : T.border}`,
        borderRadius: 10,
        overflow: "hidden",
        transition: "border-color 0.2s",
      }}>
      <button
        onClick={() => !editing && setExpanded(!expanded)}
        style={{ width: "100%", background: "transparent", border: "none", cursor: "pointer", padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", textAlign: "left", transition: "background 0.15s" }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: `linear-gradient(135deg, ${T.purple}, #6366f1)`, color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {idx + 1}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <p style={{ fontWeight: 600, fontSize: 13, color: T.bright, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.title}</p>
              {isAI && (
                <span style={{ fontSize: 10, background: "rgba(99,102,241,0.15)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 4, padding: "1px 6px", display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
                  <Bot size={10} /> AI
                </span>
              )}
            </div>
            <p style={{ fontSize: 11, color: T.dim, display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
              <Clock size={10} /> {format(new Date(entry.timestamp), "MMM d, yyyy h:mm a")}
            </p>
          </div>
        </div>
        {expanded ? <ChevronUp size={14} color={T.dim} /> : <ChevronDown size={14} color={T.dim} />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            style={{ borderTop: `1px solid ${T.border}` }}>
            <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
              {editing ? (
                <>
                  <DarkInput value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Title" />
                  <DarkTextarea value={editContent} onChange={e => setEditContent(e.target.value)} placeholder="Content" rows={6} />
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <DarkBtn onClick={() => setEditing(false)} variant="ghost"><X size={12} /> Cancel</DarkBtn>
                    <DarkBtn onClick={saveEdit} variant="primary"><Check size={12} /> Save</DarkBtn>
                  </div>
                </>
              ) : (
                <>
                  <p style={{ fontSize: 13, color: T.text, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{entry.content}</p>
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 8, borderTop: `1px solid ${T.border}` }}>
                    <DarkBtn onClick={() => setEditing(true)} variant="ghost"><Pencil size={12} /> Edit</DarkBtn>
                    <button onClick={() => onDelete(entry.id)} style={{ background: "transparent", border: "none", cursor: "pointer", color: T.dim, display: "flex", alignItems: "center", gap: 4, fontSize: 12, padding: "4px 8px", borderRadius: 6, transition: "all 0.15s" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,92,108,0.1)"; e.currentTarget.style.color = T.red; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.dim; }}>
                      <Trash2 size={12} /> Delete
                    </button>
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
      style={{ background: T.edge, border: `1px solid rgba(155,109,255,0.3)`, borderRadius: 12, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
      <DarkInput value={title} onChange={e => setTitle(e.target.value)} placeholder="Title (e.g., Diagnostic Reasoning, Risk Assessment)" />
      <DarkTextarea value={content} onChange={e => setContent(e.target.value)} placeholder="Document your clinical reasoning…" />
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <DarkBtn onClick={onCancel} variant="ghost"><X size={12} /> Cancel</DarkBtn>
        <DarkBtn onClick={submit} variant="purple"><Plus size={12} /> Add Entry</DarkBtn>
      </div>
    </motion.div>
  );
}

// ─── Phase Section ─────────────────────────────────────────────────────────────
function MDMPhaseSection({ phase, label, icon: Icon, color, entries, note, onAdd, onDelete, onEdit }) {
  const [showAdd, setShowAdd] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showAutoPopulate, setShowAutoPopulate] = useState(false);

  const isInitial = phase === "initial";
  const accentColor = isInitial ? T.teal : "#34d399";
  const accentBg = isInitial ? "rgba(0,212,188,0.08)" : "rgba(52,211,153,0.08)";
  const accentBorder = isInitial ? "rgba(0,212,188,0.25)" : "rgba(52,211,153,0.25)";
  const headerBg = isInitial ? "rgba(0,212,188,0.06)" : "rgba(52,211,153,0.06)";

  const handleAddEntries = (entriesData) => {
    entriesData.forEach(e => onAdd(e));
    setShowAutoPopulate(false);
  };

  return (
    <div style={{ background: T.panel, border: `1px solid ${accentBorder}`, borderRadius: 14, overflow: "hidden" }}>
      {/* Top accent line */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${accentColor}, ${isInitial ? T.purple : T.teal})` }} />

      {/* Header */}
      <div style={{ background: headerBg, padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: accentBg, border: `1px solid ${accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon size={18} color={accentColor} />
            </div>
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: T.bright }}>{label}</h4>
              <p style={{ fontSize: 11, color: T.dim, marginTop: 2 }}>
                {isInitial ? "Document reasoning at time of presentation" : "Document reasoning prior to discharge / disposition"}
              </p>
            </div>
            <span style={{ fontSize: 10, fontWeight: 600, background: accentBg, color: accentColor, border: `1px solid ${accentBorder}`, borderRadius: 20, padding: "3px 9px", letterSpacing: "0.05em" }}>
              {entries.length} {entries.length === 1 ? "entry" : "entries"}
            </span>
          </div>
          <DarkBtn onClick={() => { setShowAdd(!showAdd); setShowAutoPopulate(false); setShowAI(false); }} variant={isInitial ? "primary" : "teal"}>
            <Plus size={13} /> Add Entry
          </DarkBtn>
        </div>

        {/* Secondary actions */}
        <div style={{ display: "flex", gap: 8, marginTop: 12, paddingTop: 12, borderTop: `1px solid rgba(255,255,255,0.06)`, flexWrap: "wrap" }}>
          <button
            onClick={() => { setShowAutoPopulate(!showAutoPopulate); setShowAI(false); setShowAdd(false); }}
            style={{
              padding: "5px 12px", borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 5, transition: "all 0.2s",
              background: showAutoPopulate ? "rgba(99,102,241,0.2)" : "transparent",
              border: `1px solid ${showAutoPopulate ? "rgba(99,102,241,0.5)" : "rgba(99,102,241,0.25)"}`,
              color: "#a5b4fc",
            }}>
            <Wand2 size={12} />
            {showAutoPopulate ? "Hide Auto-Populate" : "AI Auto-Populate"}
            <span style={{ fontSize: 9, background: "rgba(99,102,241,0.2)", color: "#a5b4fc", borderRadius: 3, padding: "1px 5px" }}>AI</span>
          </button>
          <button
            onClick={() => { setShowAI(!showAI); setShowAutoPopulate(false); setShowAdd(false); }}
            style={{
              padding: "5px 12px", borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 5, transition: "all 0.2s",
              background: showAI ? "rgba(155,109,255,0.2)" : "transparent",
              border: `1px solid ${showAI ? "rgba(155,109,255,0.5)" : "rgba(155,109,255,0.2)"}`,
              color: T.purple,
            }}>
            <Sparkles size={12} />
            {showAI ? "Hide AI Analysis" : "AI Analysis"}
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        <AnimatePresence>
          {showAutoPopulate && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden" }}>
              <AutoPopulatePanel note={note} phase={phase} onAddEntries={handleAddEntries} onClose={() => setShowAutoPopulate(false)} />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showAI && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden" }}>
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

        {entries.length === 0 && !showAdd && !showAutoPopulate ? (
          <div style={{ textAlign: "center", padding: "32px 16px", background: "rgba(255,255,255,0.02)", border: `1px dashed ${T.muted}`, borderRadius: 10 }}>
            <Brain size={36} color={T.muted} style={{ margin: "0 auto 10px" }} />
            <p style={{ color: T.dim, fontSize: 13, fontWeight: 500 }}>No entries yet</p>
            <p style={{ color: T.muted, fontSize: 11, marginTop: 4 }}>Use <strong style={{ color: T.dim }}>AI Auto-Populate</strong> to generate sections or <strong style={{ color: T.dim }}>Add Entry</strong> to write manually</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {entries.map((entry, idx) => (
              <EntryCard key={entry.id} entry={entry} idx={idx} onDelete={onDelete} onEdit={onEdit} isAI={entry.ai_generated} />
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
    const entry = { id: `mdm_${Date.now()}_${Math.random()}`, title: data.title, content: data.content, timestamp: new Date().toISOString(), ai_generated: !!data.ai_generated };
    await persist({ ...mdm, [phase]: [...mdm[phase], entry] });
    toast.success("Entry added");
  };

  const deleteEntry = async (phase, id) => {
    await persist({ ...mdm, [phase]: mdm[phase].filter(e => e.id !== id) });
    toast.success("Entry removed");
  };

  const editEntry = async (phase, id, changes) => {
    await persist({ ...mdm, [phase]: mdm[phase].map(e => e.id === id ? { ...e, ...changes } : e) });
    toast.success("Entry updated");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, rgba(0,212,188,0.06), rgba(155,109,255,0.06))`,
        border: `1px solid rgba(0,212,188,0.2)`,
        borderRadius: 14, padding: "18px 20px", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -30, right: -30, width: 100, height: 100, background: "radial-gradient(circle, rgba(0,212,188,0.1), transparent 70%)", pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(135deg, ${T.teal}, ${T.teal2})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Brain size={15} color={T.navy} />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: T.bright }}>Medical Decision Making</h3>
          <span style={{ fontSize: 10, background: "rgba(0,212,188,0.1)", color: T.teal, border: `1px solid rgba(0,212,188,0.2)`, borderRadius: 20, padding: "2px 8px", fontWeight: 600, letterSpacing: "0.05em" }}>MDM</span>
        </div>
        <p style={{ fontSize: 13, color: T.text, lineHeight: 1.6 }}>
          Two-phase documentation: <strong style={{ color: T.bright }}>Initial MDM</strong> captures reasoning on arrival.{" "}
          <strong style={{ color: T.bright }}>Final MDM</strong> documents pre-discharge reasoning. AI Auto-Populate generates sections with ICD-10 codes from note content.
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
        <button
          onClick={async () => {
            const parts = [];
            if (mdm.initial.length > 0) parts.push("# Initial MDM — On Arrival\n" + mdm.initial.map(e => `## ${e.title}\n${e.content}`).join("\n\n"));
            if (mdm.final.length > 0) parts.push("# Final MDM — Pre-Discharge\n" + mdm.final.map(e => `## ${e.title}\n${e.content}`).join("\n\n"));
            await base44.entities.ClinicalNote.update(noteId, { mdm: parts.join("\n\n---\n\n") });
            toast.success("MDM saved to clinical note");
          }}
          style={{
            width: "100%", padding: "12px 20px", borderRadius: 10, border: "none", cursor: "pointer",
            background: `linear-gradient(135deg, ${T.teal}, ${T.teal2})`, color: T.navy,
            fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: "0 4px 14px rgba(0,212,188,0.2)", transition: "all 0.2s", fontFamily: "inherit",
          }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,212,188,0.35)"}
          onMouseLeave={e => e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,212,188,0.2)"}
        >
          <Check size={15} /> Save Full MDM to Clinical Note
        </button>
      )}
    </div>
  );
}