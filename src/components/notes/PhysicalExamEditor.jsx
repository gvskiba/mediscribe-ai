import React, { useState, useEffect, useRef } from "react";
import {
  Activity, Eye, Heart, Wind, User, Brain,
  Plus, Check, ChevronRight, Settings, Loader2, RefreshCw,
  Sparkles, AlertTriangle, CheckCircle2, X, Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

/* ── Theme ─────────────────────────────────────────────── */
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

/* ── Exam Sections ─────────────────────────────────────── */
const SECTIONS = [
  { id: "general",        label: "General",        short: "GEN",   icon: User,       defaultText: "Well-developed, well-nourished, in no acute distress" },
  { id: "heent",          label: "HEENT",           short: "HEENT", icon: Eye,        defaultText: "Normocephalic, atraumatic. PERRLA. EOMI. TMs clear bilaterally. Oropharynx clear" },
  { id: "neck",           label: "Neck",            short: "NECK",  icon: User,       defaultText: "Supple, no JVD, no lymphadenopathy, no thyromegaly" },
  { id: "cardiovascular", label: "Cardiovascular",  short: "CV",    icon: Heart,      defaultText: "Regular rate and rhythm, normal S1/S2, no murmurs/rubs/gallops" },
  { id: "respiratory",    label: "Respiratory",     short: "RESP",  icon: Wind,       defaultText: "Clear to auscultation bilaterally, no wheezes/rales/rhonchi" },
  { id: "abdomen",        label: "Abdomen",         short: "ABD",   icon: Activity,   defaultText: "Soft, non-tender, non-distended, normoactive bowel sounds, no organomegaly" },
  { id: "musculoskeletal",label: "Musculoskeletal", short: "MSK",   icon: Activity,   defaultText: "Full range of motion, no deformities, no tenderness, normal gait" },
  { id: "neurological",   label: "Neurological",    short: "NEURO", icon: Brain,      defaultText: "Alert and oriented x3, cranial nerves II-XII intact, normal strength and sensation" },
  { id: "skin",           label: "Skin",            short: "SKIN",  icon: User,       defaultText: "Warm, dry, intact. No rashes, lesions, or wounds" },
  { id: "psychiatric",    label: "Psychiatric",     short: "PSYCH", icon: Brain,      defaultText: "Appropriate mood and affect, normal thought process" },
];

const SECTION_ACCENT = {
  general:        T.teal,
  heent:          "#38bdf8",
  neck:           T.teal2,
  cardiovascular: T.red,
  respiratory:    "#60a5fa",
  abdomen:        T.amber,
  musculoskeletal:"#a78bfa",
  neurological:   T.purple,
  skin:           "#f97316",
  psychiatric:    "#f472b6",
};

/* ── Sub-components ────────────────────────────────────── */
function NavItem({ section, active, status, onClick }) {
  const accent = SECTION_ACCENT[section.id] || T.teal;
  const Icon = section.icon;
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all"
      style={{
        background: active ? `${accent}18` : "transparent",
        border: `1px solid ${active ? accent + "44" : "transparent"}`,
      }}
    >
      <div className="w-5 h-5 flex items-center justify-center rounded flex-shrink-0"
        style={{ background: `${accent}20` }}>
        <Icon size={11} style={{ color: accent }} />
      </div>
      <span className="text-xs font-medium flex-1 truncate" style={{ color: active ? T.bright : T.text }}>{section.label}</span>
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{
        background: status === "normal" ? T.green : status === "abnormal" ? T.red : T.muted,
      }} />
    </button>
  );
}

function SectionEditor({ section, onChange }) {
  const accent = SECTION_ACCENT[section.id] || T.teal;
  const isNormal = section.content && section.content === section.defaultText;
  const isAbnormal = section.content && section.content !== section.defaultText;
  const status = !section.content ? "empty" : isNormal ? "normal" : "abnormal";

  const inputStyle = {
    width: "100%",
    background: T.edge,
    border: `1px solid ${isAbnormal ? T.red + "55" : T.border}`,
    color: T.bright,
    fontSize: 13,
    padding: "12px 14px",
    borderRadius: 10,
    outline: "none",
    fontFamily: "DM Sans, sans-serif",
    resize: "none",
    lineHeight: 1.6,
    transition: "border-color 0.2s",
  };

  return (
    <div className="flex-1 flex flex-col gap-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: `${accent}20`, border: `1px solid ${accent}33` }}>
            <section.icon size={15} style={{ color: accent }} />
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color: T.bright }}>{section.label}</div>
            <div className="text-xs" style={{ color: T.dim }}>
              {status === "normal" ? "Within normal limits" : status === "abnormal" ? "Abnormal finding documented" : "No findings recorded"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Status badge */}
          {status !== "empty" && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
              style={{
                background: status === "normal" ? "rgba(46,204,113,0.1)" : "rgba(255,92,108,0.1)",
                color: status === "normal" ? T.green : T.red,
                border: `1px solid ${status === "normal" ? "rgba(46,204,113,0.2)" : "rgba(255,92,108,0.2)"}`,
              }}>
              {status === "normal" ? <CheckCircle2 size={10} /> : <AlertTriangle size={10} />}
              {status === "normal" ? "Normal" : "Abnormal"}
            </div>
          )}
        </div>
      </div>

      {/* Quick action chips */}
      <div className="flex gap-2">
        <button
          onClick={() => onChange(section.id, section.defaultText || "")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{
            background: isNormal ? "rgba(46,204,113,0.12)" : "transparent",
            border: `1px solid ${isNormal ? "rgba(46,204,113,0.3)" : T.border}`,
            color: isNormal ? T.green : T.dim,
          }}
        >
          <Check size={11} /> Normal
        </button>
        <button
          onClick={() => onChange(section.id, "")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{
            background: "transparent",
            border: `1px solid ${T.border}`,
            color: T.dim,
          }}
        >
          <X size={11} /> Clear
        </button>
      </div>

      {/* Text area */}
      <textarea
        value={section.content || ""}
        onChange={(e) => onChange(section.id, e.target.value)}
        placeholder={`Document ${section.label.toLowerCase()} findings...`}
        rows={5}
        style={inputStyle}
        onFocus={e => e.target.style.borderColor = `${accent}88`}
        onBlur={e => e.target.style.borderColor = isAbnormal ? T.red + "55" : T.border}
      />

      {/* Abnormal warning */}
      {isAbnormal && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
          style={{ background: "rgba(255,92,108,0.06)", border: "1px solid rgba(255,92,108,0.15)", color: "#ff8a95" }}>
          <AlertTriangle size={11} />
          Abnormal finding — will be flagged in note preview
        </div>
      )}
    </div>
  );
}

/* ── Main Component ────────────────────────────────────── */
export default function PhysicalExamEditor({ examData, onUpdate, onAddToNote, note }) {
  const [sections, setSections] = useState(() => {
    if (examData && typeof examData === "object" && !Array.isArray(examData)) {
      const base = SECTIONS.map(s => ({ ...s, content: examData[s.id] ?? "", enabled: true }));
      const extras = Object.keys(examData)
        .filter(k => !SECTIONS.find(s => s.id === k))
        .map(k => ({ id: k, label: k, icon: User, defaultText: "", content: examData[k], enabled: true, isCustom: true }));
      return [...base, ...extras];
    }
    return SECTIONS.map(s => ({ ...s, content: "", enabled: true }));
  });

  const [activeId, setActiveId] = useState(SECTIONS[0].id);
  const [loadingAI, setLoadingAI] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);

  const active = sections.filter(s => s.enabled);
  const activeSection = active.find(s => s.id === activeId) || active[0];

  const handleChange = (id, content) => {
    const updated = sections.map(s => s.id === id ? { ...s, content } : s);
    setSections(updated);
    const obj = {};
    updated.filter(s => s.enabled).forEach(s => { obj[s.id] = s.content; });
    onUpdate(obj);
  };

  const markAllNormal = () => {
    const updated = sections.map(s => ({ ...s, content: s.defaultText || s.content }));
    setSections(updated);
    const obj = {};
    updated.filter(s => s.enabled).forEach(s => { obj[s.id] = s.content; });
    onUpdate(obj);
    toast.success("All sections set to normal");
  };

  const toggleEnabled = (id) => {
    const updated = sections.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s);
    setSections(updated);
    const obj = {};
    updated.filter(s => s.enabled).forEach(s => { obj[s.id] = s.content; });
    onUpdate(obj);
  };

  const addCustomSection = () => {
    const id = `custom_${Date.now()}`;
    setSections(prev => [...prev, { id, label: "Custom", icon: User, defaultText: "", content: "", enabled: true, isCustom: true }]);
  };

  const analyzeRelevantSections = async () => {
    if (!note?.chief_complaint && !note?.history_of_present_illness) return;
    setLoadingAI(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a clinical documentation expert. Based on the chief complaint and HPI below, determine which physical exam sections are RELEVANT.
Chief Complaint: ${note.chief_complaint || "N/A"}
HPI: ${note.history_of_present_illness || "N/A"}
From: general, heent, neck, cardiovascular, respiratory, abdomen, musculoskeletal, neurological, skin, psychiatric
Always include "general". Return 4-8 relevant sections.`,
        response_json_schema: {
          type: "object",
          properties: { relevant_sections: { type: "array", items: { type: "string" } } },
        },
      });
      const relevantIds = result.relevant_sections || [];
      const updated = sections.map(s => ({ ...s, enabled: relevantIds.includes(s.id) || s.id === "general" }));
      setSections(updated);
      const obj = {};
      updated.filter(s => s.enabled).forEach(s => { obj[s.id] = s.content; });
      onUpdate(obj);
      setAnalyzed(true);
      toast.success(`${updated.filter(s => s.enabled).length} relevant sections enabled`);
    } catch {
      toast.error("Could not analyze sections");
      setAnalyzed(true);
    } finally {
      setLoadingAI(false);
    }
  };

  useEffect(() => {
    if (!analyzed && (note?.chief_complaint || note?.history_of_present_illness)) {
      analyzeRelevantSections();
    }
  }, [note?.chief_complaint, note?.history_of_present_illness]);

  const formatForNote = () => {
    let text = "\nPHYSICAL EXAMINATION\n" + "─".repeat(40) + "\n\n";
    sections.filter(s => s.enabled && s.content).forEach(s => {
      text += `${s.label.toUpperCase()}: ${s.content}\n\n`;
    });
    return text;
  };

  const normalCount = active.filter(s => s.content && s.content === s.defaultText).length;
  const abnormalCount = active.filter(s => s.content && s.content !== s.defaultText).length;
  const emptyCount = active.filter(s => !s.content).length;
  const completionPct = active.length > 0 ? Math.round(((normalCount + abnormalCount) / active.length) * 100) : 0;

  const getStatus = (s) => !s.content ? "empty" : s.content === s.defaultText ? "normal" : "abnormal";

  return (
    <div style={{ background: T.navy, borderRadius: 16, overflow: "hidden", fontFamily: "DM Sans, sans-serif" }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&family=JetBrains+Mono:wght@300;400;500&display=swap" />

      {/* Topbar */}
      <div className="flex items-center justify-between px-5 py-3"
        style={{ background: "rgba(11,29,53,0.8)", borderBottom: `1px solid ${T.border}`, backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${T.teal}, ${T.teal2})` }}>
            <Activity size={14} style={{ color: T.navy }} />
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color: T.bright }}>Physical Examination</div>
            <div className="text-xs" style={{ color: T.dim }}>ER Documentation</div>
          </div>
          <div className="flex items-center gap-1.5 ml-2 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ background: "rgba(46,204,113,0.08)", color: T.green, border: "1px solid rgba(46,204,113,0.15)" }}>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: T.green }} />
            LIVE
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Stats */}
          {!loadingAI && (
            <div className="flex items-center gap-3 mr-2">
              {normalCount > 0 && (
                <div className="flex items-center gap-1 text-xs" style={{ color: T.green }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: T.green }} /> {normalCount} normal
                </div>
              )}
              {abnormalCount > 0 && (
                <div className="flex items-center gap-1 text-xs" style={{ color: T.red }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: T.red }} /> {abnormalCount} abnormal
                </div>
              )}
            </div>
          )}

          <button onClick={analyzeRelevantSections} disabled={loadingAI}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
            style={{ border: `1px solid ${T.border}`, color: T.dim, background: "transparent" }}>
            {loadingAI ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
            {loadingAI ? "Analyzing…" : "AI Analyze"}
          </button>

          <button onClick={markAllNormal}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
            style={{ border: `1px solid rgba(46,204,113,0.3)`, color: T.green, background: "rgba(46,204,113,0.06)" }}>
            <Check size={11} /> All Normal
          </button>

          <button onClick={() => { onAddToNote(formatForNote()); toast.success("Saved to note"); }}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
            style={{ background: `linear-gradient(135deg, ${T.teal}, ${T.teal2})`, color: T.navy, boxShadow: "0 4px 14px rgba(0,212,188,0.2)" }}>
            <Check size={11} /> Save to Note
          </button>
        </div>
      </div>

      {/* AI Loading Banner */}
      <AnimatePresence>
        {loadingAI && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3"
              style={{ background: "rgba(155,109,255,0.06)", borderBottom: `1px solid rgba(155,109,255,0.15)` }}>
              <Loader2 size={14} className="animate-spin flex-shrink-0" style={{ color: T.purple }} />
              <div>
                <div className="text-xs font-semibold" style={{ color: "#c4b5fd" }}>Analyzing chief complaint & HPI…</div>
                <div className="text-xs" style={{ color: T.dim }}>Selecting clinically relevant exam sections</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main body: nav + editor */}
      <div className="flex" style={{ minHeight: 420 }}>
        {/* Left nav */}
        <div className="flex flex-col gap-1 p-3 flex-shrink-0" style={{ width: 180, borderRight: `1px solid ${T.border}`, background: T.slate }}>
          <div className="text-xs font-semibold mb-2 px-1" style={{ color: T.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>Systems</div>
          {active.map(s => (
            <NavItem key={s.id} section={s} active={activeId === s.id} status={getStatus(s)} onClick={() => setActiveId(s.id)} />
          ))}
          <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${T.border}` }}>
            <button onClick={() => setShowCustomize(c => !c)}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all"
              style={{ color: T.dim, background: showCustomize ? T.edge : "transparent", border: `1px solid ${showCustomize ? T.border : "transparent"}` }}>
              <Settings size={11} /> Customize
            </button>
          </div>
        </div>

        {/* Right editor */}
        <div className="flex-1 p-5 overflow-auto" style={{ background: T.panel }}>
          {/* Completion bar */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs" style={{ color: T.dim }}>Completion</span>
              <span className="text-xs font-semibold" style={{ fontFamily: "JetBrains Mono, monospace", color: T.teal }}>{completionPct}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: T.edge }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionPct}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                style={{ height: "100%", background: `linear-gradient(90deg, ${T.teal2}, ${T.teal})`, borderRadius: 9999 }}
              />
            </div>
            <div className="flex gap-3 mt-2">
              <span className="text-xs" style={{ color: T.dim }}>{active.length} sections · {emptyCount} pending</span>
            </div>
          </div>

          {/* Active section editor */}
          {activeSection && !loadingAI && (
            <motion.div key={activeSection.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
              <SectionEditor section={activeSection} onChange={handleChange} />
            </motion.div>
          )}

          {loadingAI && (
            <div className="flex items-center justify-center py-16" style={{ color: T.dim }}>
              <Loader2 size={20} className="animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Customize drawer */}
      <AnimatePresence>
        {showCustomize && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="p-4" style={{ borderTop: `1px solid ${T.border}`, background: T.slate }}>
              <div className="text-xs font-semibold mb-3" style={{ color: T.dim, textTransform: "uppercase", letterSpacing: "0.1em" }}>Toggle Sections</div>
              <div className="flex flex-wrap gap-2">
                {sections.map(s => (
                  <button key={s.id} onClick={() => toggleEnabled(s.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      border: `1px solid ${s.enabled ? T.teal + "44" : T.border}`,
                      background: s.enabled ? `${T.teal}12` : "transparent",
                      color: s.enabled ? T.teal : T.dim,
                      textDecoration: s.enabled ? "none" : "line-through",
                    }}>
                    {s.label}
                  </button>
                ))}
                <button onClick={addCustomSection}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all"
                  style={{ border: `1px dashed ${T.border}`, color: T.dim, background: "transparent" }}>
                  <Plus size={11} /> Add Section
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}