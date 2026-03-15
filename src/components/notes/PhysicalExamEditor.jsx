import React, { useState, useEffect, useRef } from "react";
import {
  Activity, Eye, Heart, Wind, User, Brain,
  Plus, Check, Settings, Loader2, Sparkles,
  Copy, ChevronDown, AlertTriangle, Zap, RefreshCw
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
  rose:   "#f472b6",
};

/* ── Default Exam Systems ──────────────────────────────── */
const DEFAULT_SYSTEMS = [
  {
    id: "general", label: "General", icon: "🧍", iconBg: "rgba(0,212,188,0.12)", iconColor: T.teal,
    subtitle: "Overall appearance & distress",
    defaultText: "Well-developed, well-nourished, in no acute distress. Alert and oriented × 4.",
    macros: ["NAD, A&O ×4", "Mild distress", "Mod distress", "Severe distress"],
  },
  {
    id: "heent", label: "HEENT", icon: "👁️", iconBg: "rgba(155,109,255,0.12)", iconColor: T.purple,
    subtitle: "Head, Eyes, Ears, Nose, Throat",
    defaultText: "Normocephalic, atraumatic. PERRL 3mm bilaterally, EOMI intact. TMs clear. Mucous membranes moist. Oropharynx clear.",
    macros: ["NC/AT, PERRL, EOMI", "MMM, OP clear", "Icterus present", "Pallor noted"],
  },
  {
    id: "neck", label: "Neck", icon: "🫙", iconBg: "rgba(0,212,188,0.12)", iconColor: T.teal,
    subtitle: "Cervical, JVD, Lymphadenopathy",
    defaultText: "Supple, full ROM. No JVD. No cervical lymphadenopathy. Thyroid non-tender without goiter.",
    macros: ["Supple, no JVD", "JVD present", "No lymphadenopathy"],
  },
  {
    id: "cardiovascular", label: "Cardiovascular", icon: "🫀", iconBg: "rgba(255,92,108,0.12)", iconColor: T.red,
    subtitle: "Heart sounds, rate, rhythm, perfusion",
    defaultText: "Regular rate and rhythm. S1, S2 present. No murmurs, rubs, or gallops. Peripheral pulses 2+ bilaterally. No edema.",
    macros: ["RRR, no M/R/G", "Irreg rhythm", "S3 present", "2+ pitting edema", "No edema"],
  },
  {
    id: "pulmonary", label: "Pulmonary", icon: "🫁", iconBg: "rgba(0,212,188,0.12)", iconColor: T.teal,
    subtitle: "Breath sounds, work of breathing",
    defaultText: "Clear to auscultation bilaterally. No wheezes, rales, or rhonchi. Normal work of breathing.",
    macros: ["CTAB, no WOB", "Crackles bilateral", "Dull to percussion", "Wheezing", "Accessory muscles"],
  },
  {
    id: "abdomen", label: "Abdomen", icon: "🫃", iconBg: "rgba(245,166,35,0.12)", iconColor: T.amber,
    subtitle: "Inspection, auscultation, palpation",
    defaultText: "Soft, non-tender, non-distended. Normoactive bowel sounds × 4 quadrants. No hepatosplenomegaly.",
    macros: ["Soft, NT/ND", "Normal BS", "Tenderness present", "No organomegaly"],
  },
  {
    id: "musculoskeletal", label: "MSK / Extremities", icon: "🦴", iconBg: "rgba(155,109,255,0.12)", iconColor: T.purple,
    subtitle: "Joints, range of motion, extremities",
    defaultText: "No deformity, full ROM bilaterally. No edema. No calf tenderness or asymmetry.",
    macros: ["No edema", "1+ edema", "2+ edema bilateral", "Full ROM"],
  },
  {
    id: "neurological", label: "Neurological", icon: "🧠", iconBg: "rgba(244,114,182,0.12)", iconColor: T.rose,
    subtitle: "Cognition, cranial nerves, motor, sensory",
    defaultText: "Alert, cooperative. CN II–XII grossly intact. Motor 5/5 bilateral. Sensation intact. Gait normal.",
    macros: ["Neuro intact", "Focal deficits", "A&O ×4", "Altered MS"],
  },
  {
    id: "skin", label: "Skin", icon: "🩹", iconBg: "rgba(245,166,35,0.12)", iconColor: T.amber,
    subtitle: "Inspection, turgor, lesions",
    defaultText: "Warm, dry, intact. No rashes, petechiae, or lesions. Normal turgor.",
    macros: ["Warm, dry", "Diaphoretic", "No lesions", "Cyanosis"],
  },
];

/* ── Helpers ──────────────────────────────────────────── */
function getStatus(content, defaultText) {
  if (!content) return "empty";
  if (content === defaultText) return "normal";
  return "abnormal";
}

const statusColor = { normal: T.green, abnormal: T.red, pending: T.amber, empty: T.border };
const statusLabel = { normal: "Normal", abnormal: "Abnormal", pending: "Pending", empty: "Empty" };
const statusBadgeStyle = {
  normal:   { background: "rgba(46,204,113,0.1)",  color: T.green, border: "1px solid rgba(46,204,113,0.2)" },
  abnormal: { background: "rgba(255,92,108,0.1)",  color: "#ff8a95", border: "1px solid rgba(255,92,108,0.2)" },
  pending:  { background: "rgba(245,166,35,0.1)",  color: T.amber, border: "1px solid rgba(245,166,35,0.2)" },
  empty:    { background: "rgba(74,114,153,0.1)",  color: T.dim, border: "1px solid rgba(74,114,153,0.2)" },
};

/* ── Panel wrapper ─────────────────────────────────────── */
function Panel({ children, style = {}, className = "" }) {
  return (
    <div className={className} style={{
      background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden", ...style
    }}>
      {children}
    </div>
  );
}

function PanelHeader({ icon: Icon, iconBg, iconColor, title, action }) {
  return (
    <div style={{ padding: "13px 18px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {Icon && (
          <div style={{ width: 20, height: 20, borderRadius: 5, background: iconBg || "rgba(0,212,188,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon size={11} style={{ color: iconColor || T.teal }} />
          </div>
        )}
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: T.dim }}>{title}</span>
      </div>
      {action}
    </div>
  );
}

/* ── Exam Nav Panel (left column) ─────────────────────── */
function ExamNavPanel({ systems, contents, activeId, onSelect, completionPct }) {
  return (
    <Panel style={{ display: "flex", flexDirection: "column" }}>
      <PanelHeader icon={Activity} title="Systems Navigator" />
      {/* Completion bar */}
      <div style={{ margin: "12px 16px 4px", height: 3, background: T.edge, borderRadius: 2, overflow: "hidden" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${completionPct}%` }}
          transition={{ duration: 1.4, ease: [0.4, 0, 0.2, 1] }}
          style={{ height: "100%", background: `linear-gradient(90deg, ${T.teal2}, ${T.teal})`, borderRadius: 2 }}
        />
      </div>
      <div style={{ padding: "8px 8px 12px", display: "flex", flexDirection: "column", gap: 1 }}>
        {systems.map(sys => {
          const status = getStatus(contents[sys.id], sys.defaultText);
          const isActive = activeId === sys.id;
          return (
            <button
              key={sys.id}
              onClick={() => onSelect(sys.id)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 10px 10px 8px",
                cursor: "pointer", border: "none", textAlign: "left", width: "100%",
                fontSize: 13, transition: "all 0.15s", borderRadius: 8,
                borderLeft: `3px solid ${isActive ? T.teal : "transparent"}`,
                background: isActive ? "rgba(0,212,188,0.06)" : "transparent",
                color: isActive ? T.teal : T.text,
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = T.edge; e.currentTarget.style.color = T.bright; } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.text; } }}
            >
              <div style={{ width: 26, height: 26, borderRadius: 7, background: sys.iconBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>
                {sys.icon}
              </div>
              <span style={{ flex: 1, fontSize: 12, fontWeight: isActive ? 600 : 400 }}>{sys.label}</span>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: statusColor[status], flexShrink: 0 }} />
            </button>
          );
        })}
      </div>
    </Panel>
  );
}

/* ── Note Preview Panel (right column top) ─────────────── */
function NotePreviewPanel({ systems, contents }) {
  const [copied, setCopied] = useState(false);

  const generatePreview = () => {
    return systems
      .filter(s => contents[s.id])
      .map(s => `${s.label.toUpperCase()}: ${contents[s.id]}`)
      .join("\n\n");
  };

  const copyText = () => {
    navigator.clipboard.writeText(generatePreview());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard");
  };

  const abnormalWords = systems.filter(s => getStatus(contents[s.id], s.defaultText) === "abnormal").map(s => s.label.toUpperCase());

  return (
    <Panel style={{ display: "flex", flexDirection: "column" }}>
      <PanelHeader icon={Zap} iconBg="rgba(0,212,188,0.15)" iconColor={T.teal} title="Live Note Preview"
        action={
          <button onClick={copyText} style={{
            padding: "4px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer", border: `1px solid ${T.border}`,
            background: "transparent", color: T.dim, display: "flex", alignItems: "center", gap: 4, transition: "all 0.15s"
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.teal; e.currentTarget.style.color = T.teal; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.dim; }}
          >
            <Copy size={10} /> {copied ? "Copied!" : "Copy"}
          </button>
        }
      />
      <div style={{ padding: "14px 16px", flex: 1, overflowY: "auto", maxHeight: 280 }}>
        {systems.filter(s => contents[s.id]).length === 0 ? (
          <p style={{ fontSize: 11, color: T.dim, fontStyle: "italic" }}>Document findings to see live preview…</p>
        ) : (
          systems.filter(s => contents[s.id]).map(s => {
            const isAbnormal = getStatus(contents[s.id], s.defaultText) === "abnormal";
            return (
              <div key={s.id} style={{ marginBottom: 12 }}>
                <span style={{ display: "block", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: T.teal, marginBottom: 2 }}>
                  {s.label}
                </span>
                <span style={{
                  fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: isAbnormal ? "#ff8a95" : T.text,
                  lineHeight: 1.8, whiteSpace: "pre-wrap", fontWeight: isAbnormal ? 500 : 400,
                }}>
                  {contents[s.id]}
                </span>
              </div>
            );
          })
        )}
      </div>
      <div style={{ padding: "10px 16px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: T.dim }}>
        <span>{systems.filter(s => contents[s.id]).length} systems documented</span>
        <span>{abnormalWords.length > 0 ? <span style={{ color: T.red }}>{abnormalWords.length} abnormal</span> : <span style={{ color: T.green }}>All normal</span>}</span>
      </div>
    </Panel>
  );
}

/* ── Completion Panel (right column bottom) ─────────────── */
function CompletionPanel({ systems, contents }) {
  const total = systems.length;
  const documented = systems.filter(s => contents[s.id]).length;
  const completionPct = total > 0 ? Math.round((documented / total) * 100) : 0;
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - (completionPct / 100) * circ;

  return (
    <Panel>
      <PanelHeader icon={Check} iconBg="rgba(46,204,113,0.15)" iconColor={T.green} title="Exam Completion" />
      <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 16, borderBottom: `1px solid ${T.border}` }}>
        <svg width={72} height={72} viewBox="0 0 72 72" style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
          <circle cx={36} cy={36} r={r} fill="none" stroke={T.edge} strokeWidth={6} />
          <circle cx={36} cy={36} r={r} fill="none"
            stroke="url(#ring-grad)" strokeWidth={6}
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)" }}
          />
          <defs>
            <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={T.teal2} />
              <stop offset="100%" stopColor={T.teal} />
            </linearGradient>
          </defs>
          <text x={36} y={36} textAnchor="middle" dominantBaseline="middle"
            transform="rotate(90 36 36)"
            style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 14, fontWeight: 700, fill: T.teal }}>
            {completionPct}%
          </text>
        </svg>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.bright }}>{documented}/{total}</div>
          <div style={{ fontSize: 11, color: T.dim }}>systems documented</div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "8px 12px 12px" }}>
        {systems.map(sys => {
          const status = getStatus(contents[sys.id], sys.defaultText);
          const checked = status !== "empty";
          const isAbnormal = status === "abnormal";
          return (
            <div key={sys.id} style={{
              display: "flex", alignItems: "center", gap: 9, padding: "7px 8px",
              borderRadius: 7, fontSize: 12, color: T.text, border: "1px solid transparent",
              cursor: "default", transition: "all 0.15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = T.edge; e.currentTarget.style.borderColor = T.border; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}
            >
              <div style={{
                width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 700,
                background: checked ? (isAbnormal ? "rgba(255,92,108,0.15)" : T.teal) : "transparent",
                border: `1.5px solid ${checked ? (isAbnormal ? T.red : T.teal) : T.border}`,
                color: checked ? (isAbnormal ? T.red : T.navy) : T.dim,
              }}>
                {checked ? (isAbnormal ? "!" : "✓") : ""}
              </div>
              <span style={{ flex: 1, fontSize: 11 }}>{sys.label}</span>
              <div style={{
                fontSize: 9, padding: "2px 7px", borderRadius: 4, fontWeight: 600,
                ...statusBadgeStyle[status],
              }}>{statusLabel[status]}</div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

/* ── Single Exam System Card (center column) ────────────── */
function ExamSystemCard({ sys, content, onChange }) {
  const status = getStatus(content, sys.defaultText);
  const [appliedMacros, setAppliedMacros] = useState({});
  const textareaRef = useRef(null);

  const applyMacro = (macro) => {
    const alreadyApplied = appliedMacros[macro];
    const newApplied = { ...appliedMacros, [macro]: !alreadyApplied };
    setAppliedMacros(newApplied);

    // Build content from applied macros or use the macro text directly
    if (!alreadyApplied) {
      const current = content || "";
      onChange(current ? `${current}; ${macro}` : macro);
    }
  };

  const findingVariant = (text) => {
    if (!text) return null;
    const s = getStatus(text, sys.defaultText);
    if (s === "abnormal") return "finding-abnormal";
    return "finding-normal";
  };

  const inputStyle = {
    width: "100%", background: T.edge, border: `1px solid ${status === "abnormal" ? "rgba(255,92,108,0.35)" : T.border}`,
    color: T.bright, fontSize: 13, padding: "12px 14px", borderRadius: 10, outline: "none",
    fontFamily: "DM Sans, sans-serif", resize: "vertical", lineHeight: 1.6, minHeight: 90,
    transition: "border-color 0.2s",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden", marginBottom: 14 }}
    >
      {/* Card header */}
      <div style={{
        padding: "13px 18px", borderBottom: `1px solid ${T.border}`,
        display: "flex", alignItems: "center", gap: 12,
        background: "rgba(22,45,79,0.4)",
      }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: sys.iconBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
          {sys.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 15, color: T.bright, fontWeight: 600 }}>{sys.label}</div>
          <div style={{ fontSize: 11, color: T.dim, letterSpacing: "0.04em" }}>{sys.subtitle}</div>
        </div>
        <div style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 500, ...statusBadgeStyle[status] }}>
          {statusLabel[status]}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "14px 18px" }}>
        {/* Text area */}
        <textarea
          ref={textareaRef}
          value={content || ""}
          onChange={e => onChange(e.target.value)}
          placeholder={`Document ${sys.label.toLowerCase()} findings…`}
          style={inputStyle}
          onFocus={e => e.target.style.borderColor = `${sys.iconColor}88`}
          onBlur={e => e.target.style.borderColor = status === "abnormal" ? "rgba(255,92,108,0.35)" : T.border}
        />

        {/* Abnormal finding highlight */}
        {status === "abnormal" && (
          <div style={{
            display: "flex", alignItems: "center", gap: 6, marginTop: 8,
            padding: "6px 10px", borderRadius: 7,
            background: "rgba(255,92,108,0.06)", border: "1px solid rgba(255,92,108,0.2)", color: "#ff8a95", fontSize: 11,
          }}>
            <AlertTriangle size={11} /> Abnormal finding — will be highlighted in note preview
          </div>
        )}

        {/* Macro bar */}
        {sys.macros?.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.border}` }}>
            {sys.macros.map(macro => {
              const applied = appliedMacros[macro];
              return (
                <button key={macro} onClick={() => applyMacro(macro)}
                  style={{
                    padding: "4px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer",
                    border: `1px solid ${applied ? T.teal : T.border}`,
                    background: applied ? "rgba(0,212,188,0.1)" : T.edge,
                    color: applied ? T.teal : T.dim, transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { if (!applied) { e.currentTarget.style.borderColor = T.teal; e.currentTarget.style.color = T.teal; e.currentTarget.style.background = "rgba(0,212,188,0.06)"; } }}
                  onMouseLeave={e => { if (!applied) { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.dim; e.currentTarget.style.background = T.edge; } }}
                >
                  {macro}
                </button>
              );
            })}
            <button onClick={() => onChange(sys.defaultText)}
              style={{
                padding: "4px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer",
                border: `1px solid ${T.border}`, background: T.edge, color: T.dim, transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.green; e.currentTarget.style.color = T.green; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.dim; }}
            >
              ✓ Set Normal
            </button>
            <button onClick={() => onChange("")}
              style={{
                padding: "4px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer",
                border: `1px solid ${T.border}`, background: T.edge, color: T.dim, transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.red; e.currentTarget.style.color = T.red; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.dim; }}
            >
              Clear
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ── Main Component ────────────────────────────────────── */
export default function PhysicalExamEditor({ examData, onUpdate, onAddToNote, note }) {
  const [contents, setContents] = useState(() => {
    if (examData && typeof examData === "object" && !Array.isArray(examData)) return examData;
    if (examData && typeof examData === "string") {
      try { const p = JSON.parse(examData); if (p && typeof p === "object") return p; } catch {}
    }
    return {};
  });

  const [systems, setSystems] = useState(DEFAULT_SYSTEMS);
  const [activeNavId, setActiveNavId] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const systemRefs = useRef({});

  const documented = systems.filter(s => contents[s.id]).length;
  const completionPct = systems.length > 0 ? Math.round((documented / systems.length) * 100) : 0;

  const handleChange = (id, value) => {
    const updated = { ...contents, [id]: value };
    setContents(updated);
    onUpdate(updated);
  };

  const markAllNormal = () => {
    const updated = {};
    systems.forEach(s => { updated[s.id] = s.defaultText; });
    setContents(updated);
    onUpdate(updated);
    toast.success("All sections set to normal");
  };

  const analyzeRelevantSections = async () => {
    if (!note?.chief_complaint && !note?.history_of_present_illness) {
      toast.error("Add chief complaint or HPI first");
      return;
    }
    setLoadingAI(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on the chief complaint and HPI, which physical exam sections are most relevant?
CC: ${note.chief_complaint || "N/A"}
HPI: ${note.history_of_present_illness || "N/A"}
From: general, heent, neck, cardiovascular, pulmonary, abdomen, musculoskeletal, neurological, skin
Always include "general". Return 4-8 relevant section IDs.`,
        response_json_schema: { type: "object", properties: { relevant_sections: { type: "array", items: { type: "string" } } } },
      });
      const relevantIds = new Set([...(result.relevant_sections || []), "general"]);
      // Reorder: relevant first, then the rest
      const reordered = [
        ...DEFAULT_SYSTEMS.filter(s => relevantIds.has(s.id)),
        ...DEFAULT_SYSTEMS.filter(s => !relevantIds.has(s.id)),
      ];
      setSystems(reordered);
      setAnalyzed(true);
      toast.success(`${relevantIds.size} relevant sections identified`);
    } catch (err) {
      console.error("AI analysis error:", err);
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

  const scrollToSystem = (id) => {
    setActiveNavId(id);
    systemRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const formatForNote = () => {
    let text = "\nPHYSICAL EXAMINATION\n" + "─".repeat(40) + "\n\n";
    systems.filter(s => contents[s.id]).forEach(s => { text += `${s.label.toUpperCase()}: ${contents[s.id]}\n\n`; });
    return text;
  };

  return (
    <div style={{ background: T.navy, fontFamily: "DM Sans, sans-serif", borderRadius: 0, minHeight: "100%" }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&family=JetBrains+Mono:wght@300;400;500&display=swap" />

      {/* Topbar */}
      <div style={{
        height: 58, display: "flex", alignItems: "center", padding: "0 28px", gap: 16,
        background: "rgba(11,29,53,0.7)", backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${T.border}`, flexShrink: 0, position: "relative",
      }}>
        {/* Scan line accent */}
        <style>{`
          @keyframes scanLine { 0%,100% { opacity:0; transform:scaleX(0) } 50% { opacity:0.4; transform:scaleX(1) } }
          @keyframes badgePulse { 0%,100% { opacity:1; transform:scale(1) } 50% { opacity:0.4; transform:scale(0.7) } }
          @keyframes abnormalPing { 0% { box-shadow:0 0 0 0 rgba(255,92,108,0.4) } 70% { box-shadow:0 0 0 6px rgba(255,92,108,0) } 100% { box-shadow:0 0 0 0 rgba(255,92,108,0) } }
        `}</style>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${T.teal}, transparent)`, animation: "scanLine 5s ease-in-out infinite" }} />

        {/* Title */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: T.bright }}>Physical Examination</span>
              <span style={{ fontSize: 11, color: T.dim }}>/ ER Documentation</span>
            </div>
            <span style={{ fontSize: 11, color: T.dim }}>Emergency Department — Physical Exam (PE)</span>
          </div>

          {/* Live badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 500, background: "rgba(46,204,113,0.1)", color: T.green, border: "1px solid rgba(46,204,113,0.2)", marginLeft: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.green, animation: "badgePulse 2s infinite" }} />
            AI ACTIVE
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Stats */}
          {!loadingAI && (
            <>
              {systems.filter(s => contents[s.id] && contents[s.id] === s.defaultText).length > 0 && (
                <span style={{ fontSize: 11, color: T.green }}>
                  ✓ {systems.filter(s => contents[s.id] === s.defaultText).length} normal
                </span>
              )}
              {systems.filter(s => getStatus(contents[s.id], s.defaultText) === "abnormal").length > 0 && (
                <span style={{ fontSize: 11, color: T.red }}>
                  ⚠ {systems.filter(s => getStatus(contents[s.id], s.defaultText) === "abnormal").length} abnormal
                </span>
              )}
            </>
          )}

          <button onClick={(e) => { e.stopPropagation(); analyzeRelevantSections(); }} disabled={loadingAI}
            style={{ padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: loadingAI ? "not-allowed" : "pointer", border: `1px solid ${T.border}`, background: "transparent", color: T.dim, display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s", opacity: loadingAI ? 0.6 : 1 }}
            onMouseEnter={e => { if (!loadingAI) { e.currentTarget.style.borderColor = T.muted; e.currentTarget.style.color = T.text; } }}
            onMouseLeave={e => { if (!loadingAI) { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.dim; } }}
          >
            {loadingAI ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            {loadingAI ? "Analyzing…" : "AI Analyze"}
          </button>

          <button onClick={markAllNormal}
            style={{ padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", border: `1px solid ${T.border}`, background: "transparent", color: T.dim, transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.green; e.currentTarget.style.color = T.green; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.dim; }}
          >
            All Normal
          </button>

          <button onClick={() => { onAddToNote(formatForNote()); toast.success("Saved to note"); }}
            style={{ padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none", background: `linear-gradient(135deg, ${T.teal}, ${T.teal2})`, color: T.navy, boxShadow: "0 4px 14px rgba(0,212,188,0.2)", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 22px rgba(0,212,188,0.38)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,212,188,0.2)"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            Finalize & Save
          </button>
        </div>
      </div>

      {/* AI Loading Banner */}
      <AnimatePresence>
        {loadingAI && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} style={{ overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 28px", background: "rgba(155,109,255,0.06)", borderBottom: `1px solid rgba(155,109,255,0.15)` }}>
              <Loader2 size={14} className="animate-spin" style={{ color: T.purple, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#c4b5fd" }}>Analyzing chief complaint & HPI…</div>
                <div style={{ fontSize: 11, color: T.dim }}>Prioritizing clinically relevant exam sections</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main 3-column grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "220px 1fr 300px",
        gridTemplateRows: "auto 1fr",
        gap: 16,
        padding: "22px 26px",
        alignContent: "start",
        overflowY: "auto",
      }}>
        {/* Left: Exam Nav */}
        <div style={{ gridColumn: 1, gridRow: "1 / 3" }}>
          <ExamNavPanel systems={systems} contents={contents} activeId={activeNavId} onSelect={scrollToSystem} completionPct={completionPct} />
        </div>

        {/* Center: Exam System Cards */}
        <div style={{ gridColumn: 2, gridRow: "1 / 3", overflowY: "auto" }}>
          {loadingAI ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 60, color: T.dim }}>
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : (
            systems.map(sys => (
              <div key={sys.id} ref={el => systemRefs.current[sys.id] = el}>
                <ExamSystemCard sys={sys} content={contents[sys.id] || ""} onChange={val => handleChange(sys.id, val)} />
              </div>
            ))
          )}
        </div>

        {/* Right: Note Preview */}
        <div style={{ gridColumn: 3, gridRow: 1 }}>
          <NotePreviewPanel systems={systems} contents={contents} />
        </div>

        {/* Right: Completion Panel */}
        <div style={{ gridColumn: 3, gridRow: 2 }}>
          <CompletionPanel systems={systems} contents={contents} />
        </div>
      </div>
    </div>
  );
}