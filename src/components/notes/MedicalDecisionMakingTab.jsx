import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Brain, Sparkles, Loader2, Plus, Trash2, Pencil, Check, X,
  ChevronDown, ChevronUp, FileText, Wand2, Bot,
  Activity, AlertTriangle, Zap, FlaskConical, RefreshCw,
  Settings, GripVertical, EyeOff, Eye, RotateCcw,
  Heart, Thermometer, Wind, Droplets, Shield, TrendingUp,
} from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";

/* ── Theme ──────────────────────────────────────────────────────────────────── */
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

/* ── Shared Markdown ─────────────────────────────────────────────────────────── */
const mdComponents = {
  p:      ({ children }) => <p className="mb-2 leading-relaxed text-sm" style={{ color: T.text }}>{children}</p>,
  h1:     ({ children }) => <h1 className="text-base font-bold mt-3 mb-1" style={{ color: T.bright }}>{children}</h1>,
  h2:     ({ children }) => <h2 className="text-sm font-bold mt-2 mb-1" style={{ color: T.bright }}>{children}</h2>,
  h3:     ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1" style={{ color: T.text }}>{children}</h3>,
  ul:     ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
  ol:     ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
  li:     ({ children }) => <li className="text-sm" style={{ color: T.text }}>{children}</li>,
  strong: ({ children }) => <strong style={{ color: T.bright }}>{children}</strong>,
};

/* ── Sub-components ──────────────────────────────────────────────────────────── */

// Panel wrapper
function Panel({ children, className = "", style = {} }) {
  return (
    <div
      className={`overflow-hidden ${className}`}
      style={{
        background: T.panel,
        border: `1px solid ${T.border}`,
        borderRadius: 14,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// Panel header
function PanelHeader({ icon: Icon, iconColor = T.teal, iconBg, title, action }) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3"
      style={{ borderBottom: `1px solid ${T.border}` }}
    >
      <div className="flex items-center gap-2">
        <div
          className="flex items-center justify-center"
          style={{ width: 22, height: 22, borderRadius: 5, background: iconBg || `${iconColor}22` }}
        >
          <Icon size={12} style={{ color: iconColor }} />
        </div>
        <span
          className="text-xs font-semibold tracking-widest uppercase"
          style={{ color: T.dim, letterSpacing: "0.1em" }}
        >
          {title}
        </span>
      </div>
      {action}
    </div>
  );
}

// Ghost button
function GhostBtn({ onClick, disabled, children, teal }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 text-xs font-medium transition-all disabled:opacity-50"
      style={{
        padding: "5px 12px",
        borderRadius: 8,
        border: `1px solid ${T.border}`,
        background: teal
          ? `linear-gradient(135deg, ${T.teal}, ${T.teal2})`
          : "transparent",
        color: teal ? T.navy : T.dim,
        fontWeight: teal ? 600 : 500,
        boxShadow: teal ? "0 4px 14px rgba(0,212,188,0.2)" : "none",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

// Tag pill
function Tag({ children, color = "teal" }) {
  const map = {
    teal:   { bg: "rgba(0,212,188,0.08)",    color: T.teal,   border: "rgba(0,212,188,0.15)" },
    amber:  { bg: "rgba(245,166,35,0.1)",    color: "#f8c56d", border: "rgba(245,166,35,0.2)" },
    red:    { bg: "rgba(255,92,108,0.1)",    color: "#ff8a95", border: "rgba(255,92,108,0.2)" },
    purple: { bg: "rgba(155,109,255,0.1)",   color: "#b894ff", border: "rgba(155,109,255,0.2)" },
  };
  const s = map[color] || map.teal;
  return (
    <span
      className="text-xs font-medium"
      style={{ padding: "3px 9px", borderRadius: 6, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      {children}
    </span>
  );
}

/* ── Risk Ring ────────────────────────────────────────────────────────────────── */
function RiskRing({ score = 0 }) {
  const r = 46;
  const circ = 2 * Math.PI * r;
  const clamp = Math.max(0, Math.min(100, score));
  const offset = circ - (clamp / 100) * circ;
  const ringColor = clamp >= 70 ? T.red : clamp >= 40 ? T.amber : T.teal;
  const label = clamp >= 70 ? "High Risk" : clamp >= 40 ? "Moderate Risk" : "Low Risk";
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke={T.edge} strokeWidth="8" />
        <circle
          cx="60" cy="60" r={r} fill="none"
          stroke={ringColor} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          style={{ transition: "stroke-dashoffset 1.8s cubic-bezier(0.4,0,0.2,1)" }}
        />
        <text x="60" y="56" textAnchor="middle" dominantBaseline="middle"
          style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 22, fontWeight: 700, fill: T.bright }}>
          {clamp}
        </text>
        <text x="60" y="74" textAnchor="middle" dominantBaseline="middle"
          style={{ fontSize: 9, fill: T.dim, textTransform: "uppercase", letterSpacing: 1 }}>
          /100
        </text>
      </svg>
      <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: ringColor }}>{label}</span>
    </div>
  );
}

/* ── Patient Snapshot Panel ───────────────────────────────────────────────────── */
function PatientSnapshotPanel({ note }) {
  const vitals = note.vital_signs || {};

  const bp = vitals.blood_pressure?.systolic
    ? { value: `${vitals.blood_pressure.systolic}/${vitals.blood_pressure.diastolic}`, label: "BP", sub: "MMHG", status: vitals.blood_pressure.systolic > 140 ? "critical" : "normal" }
    : { value: "—", label: "BP", sub: "MMHG", status: "normal" };

  const hr = vitals.heart_rate?.value
    ? { value: `${vitals.heart_rate.value}`, label: "HR", sub: "BPM", status: vitals.heart_rate.value > 100 ? "warning" : "normal" }
    : { value: "—", label: "HR", sub: "BPM", status: "normal" };

  const temp = vitals.temperature?.value
    ? { value: `${vitals.temperature.value}°`, label: "TEMP", sub: `°${vitals.temperature.unit || "F"}`, status: vitals.temperature.value > 100.4 ? "warning" : "normal" }
    : { value: "—", label: "TEMP", sub: "°F", status: "normal" };

  const spo2 = vitals.oxygen_saturation?.value
    ? { value: `${vitals.oxygen_saturation.value}%`, label: "SPO₂", sub: "%", status: vitals.oxygen_saturation.value < 95 ? "critical" : "normal" }
    : { value: "—", label: "SPO₂", sub: "%", status: "normal" };

  const vitalItems = [bp, hr, temp, spo2];
  const statusColor = { normal: T.bright, warning: T.amber, critical: T.red };

  const genderEmoji = note.patient_gender === "female" ? "👩‍⚕️" : "👨‍⚕️";

  return (
    <div style={{
      background: "linear-gradient(145deg, #0d1b2e 0%, #0a1628 100%)",
      border: `1px solid ${T.border}`,
      borderRadius: 18,
      padding: "20px",
      fontFamily: "DM Sans, sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Gradient accent bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${T.teal}, ${T.purple})` }} />

      {/* Patient header */}
      <div className="flex items-center gap-4 mb-4">
        <div style={{
          width: 60, height: 60, borderRadius: 14,
          background: T.edge, border: `1px solid ${T.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28, flexShrink: 0,
        }}>
          {genderEmoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xl font-bold leading-tight" style={{ color: T.bright }}>
            {note.patient_age ? `${note.patient_age} yrs` : "Age Unknown"}
            {note.patient_gender && (
              <span className="ml-2 text-base font-normal capitalize" style={{ color: T.dim }}>· {note.patient_gender}</span>
            )}
          </div>
          {note.date_of_birth && (
            <div className="text-sm mt-0.5" style={{ color: T.dim }}>
              DOB: <span style={{ color: T.text }}>{note.date_of_birth}</span>
            </div>
          )}
          {note.patient_id && (
            <div className="text-sm" style={{ color: T.dim }}>
              MRN: <span style={{ fontFamily: "JetBrains Mono,monospace", color: T.text }}>{note.patient_id}</span>
              {note.specialty && <span style={{ color: T.dim }}> | Specialty: <span style={{ color: T.text }}>{note.specialty}</span></span>}
            </div>
          )}
          {note.chief_complaint && (
            <div className="text-xs mt-0.5" style={{ color: T.dim }}>
              CC: <span style={{ color: T.text }}>{note.chief_complaint}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tags row: allergies + conditions */}
      {((note.allergies || []).length > 0 || (note.diagnoses || []).length > 0) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {(note.allergies || []).map((a, i) => (
            <span key={i} className="flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full"
              style={{ background: "rgba(255,92,108,0.1)", color: "#ff8a95", border: "1px solid rgba(255,92,108,0.3)" }}>
              ⚠ {a}
            </span>
          ))}
          {(note.diagnoses || []).slice(0, 3).map((d, i) => {
            const colors = [
              { bg: "rgba(245,166,35,0.1)", color: "#f8c56d", border: "rgba(245,166,35,0.25)" },
              { bg: "rgba(0,212,188,0.08)", color: T.teal, border: "rgba(0,212,188,0.2)" },
              { bg: "rgba(155,109,255,0.1)", color: "#b894ff", border: "rgba(155,109,255,0.25)" },
            ];
            const c = colors[i % colors.length];
            const label = d.replace(/^[A-Z0-9.]+ ?[-–]? ?/, "").slice(0, 18) || d.slice(0, 18);
            return (
              <span key={i} className="text-xs font-semibold px-3 py-1 rounded-full"
                style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
                {label}
              </span>
            );
          })}
        </div>
      )}

      {/* Vitals grid */}
      <div className="grid grid-cols-4 gap-2">
        {vitalItems.map((v) => (
          <div key={v.label} style={{ background: T.edge, borderRadius: 12, padding: "12px 8px", textAlign: "center", border: `1px solid ${T.border}` }}>
            <div className="font-bold" style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 18, lineHeight: 1, color: statusColor[v.status] }}>
              {v.value}
            </div>
            <div className="mt-1 text-xs font-medium tracking-widest uppercase" style={{ color: T.dim, fontSize: 10 }}>{v.label}</div>
            <div className="text-xs tracking-widest uppercase" style={{ color: T.muted, fontSize: 9 }}>{v.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── AI Insight Panel ────────────────────────────────────────────────────────── */
function ClinicalInsightPanel({ note }) {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a senior clinician. Provide a concise, high-value clinical insight for this patient in 3-5 sentences. Focus on the most clinically important reasoning, nuances, and decision points.

Patient:
- Chief Complaint: ${note.chief_complaint || "Not documented"}
- HPI: ${note.history_of_present_illness || "Not documented"}
- Assessment: ${note.assessment || "Not documented"}
- Diagnoses: ${(note.diagnoses || []).join(", ") || "Not documented"}
- Medications: ${(note.medications || []).join(", ") || "Not documented"}
- Plan: ${note.plan || "Not documented"}

Write as a quoted clinical note. Also list 2-3 relevant guideline references.`,
        response_json_schema: {
          type: "object",
          properties: {
            insight: { type: "string" },
            references: { type: "array", items: { type: "string" } },
            key_points: { type: "array", items: { type: "string" } },
          },
        },
      });
      setInsight(res);
    } catch { toast.error("Failed to generate insight"); }
    setLoading(false);
  };

  return (
    <Panel>
      <PanelHeader
        icon={Sparkles} iconColor={T.teal}
        title="AI Clinical Insight"
        action={
          <GhostBtn onClick={generate} disabled={loading} teal={!insight}>
            {loading ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
            {loading ? "Analyzing…" : insight ? "Refresh" : "Generate"}
          </GhostBtn>
        }
      />
      <div className="p-4">
        {!insight && !loading && (
          <p className="text-xs text-center py-6" style={{ color: T.dim }}>Generate an AI clinical insight based on note data.</p>
        )}
        {loading && (
          <div className="flex items-center gap-2 py-6 justify-center" style={{ color: T.teal }}>
            <Loader2 size={14} className="animate-spin" /> <span className="text-sm">Analyzing clinical data…</span>
          </div>
        )}
        {insight && !loading && (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed italic" style={{ color: T.text }}>"{insight.insight}"</p>
            {insight.key_points?.length > 0 && (
              <div className="space-y-1.5">
                {insight.key_points.map((pt, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs" style={{ color: T.text }}>
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: T.teal }} />
                    {pt}
                  </div>
                ))}
              </div>
            )}
            {insight.references?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {insight.references.map((ref, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{ background: T.edge, color: T.dim, border: `1px solid ${T.border}` }}>{ref}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Panel>
  );
}

/* ── Differential Panel ───────────────────────────────────────────────────────── */
function DifferentialPanel({ note }) {
  const [differentials, setDifferentials] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a ranked differential diagnosis list. For each provide confidence (0-100), ICD-10 code, whether primary, and a brief rationale.

Patient:
- CC: ${note.chief_complaint || "N/A"}
- HPI: ${note.history_of_present_illness || "N/A"}
- Assessment: ${note.assessment || "N/A"}
- Labs: ${JSON.stringify(note.lab_findings || [])}
- Existing Diagnoses: ${(note.diagnoses || []).join(", ") || "None"}

Return 4-5 diagnoses ranked by confidence.`,
        response_json_schema: {
          type: "object",
          properties: {
            diagnoses: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  icd_code: { type: "string" },
                  name: { type: "string" },
                  confidence: { type: "number" },
                  is_primary: { type: "boolean" },
                  rationale: { type: "string" },
                },
              },
            },
          },
        },
      });
      setDifferentials(res.diagnoses || []);
    } catch { toast.error("Failed"); }
    setLoading(false);
  };

  const displayItems = differentials || (note.diagnoses || []).map((d, i) => ({
    name: d, icd_code: d.match(/^([A-Z0-9.]+)/)?.[1] || "", confidence: Math.max(40, 90 - i * 15), is_primary: i === 0, rationale: "",
  }));

  const barGradient = (conf) => conf >= 70
    ? `linear-gradient(90deg, ${T.teal2}, ${T.teal})`
    : conf >= 45
    ? `linear-gradient(90deg, #e8a020, ${T.amber})`
    : `linear-gradient(90deg, #cc3344, ${T.red})`;

  return (
    <Panel>
      <PanelHeader
        icon={FlaskConical} iconColor={T.amber}
        title="Differential Diagnosis"
        action={
          <GhostBtn onClick={generate} disabled={loading}>
            {loading ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
            {loading ? "…" : "Refine"}
          </GhostBtn>
        }
      />
      <div style={{ divideColor: T.border }}>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm" style={{ color: T.dim }}>
            <Loader2 size={14} className="animate-spin" /> Generating…
          </div>
        ) : displayItems.length === 0 ? (
          <div className="py-8 text-center text-xs" style={{ color: T.dim }}>No diagnoses. Click Refine to generate.</div>
        ) : (
          displayItems.map((dx, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="px-4 py-3 space-y-2 transition-colors cursor-pointer"
              style={{ borderBottom: i < displayItems.length - 1 ? `1px solid ${T.border}` : "none" }}
              onMouseEnter={e => e.currentTarget.style.background = T.edge}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  {dx.icd_code && (
                    <span className="text-xs flex-shrink-0 mt-0.5 px-1.5 py-0.5 rounded"
                      style={{ fontFamily: "JetBrains Mono,monospace", background: T.muted, color: T.dim }}>
                      {dx.icd_code}
                    </span>
                  )}
                  <span className="text-sm font-semibold" style={{ color: T.bright }}>{dx.name}</span>
                </div>
                {dx.is_primary && (
                  <span className="text-xs font-semibold flex-shrink-0 px-2 py-0.5 rounded"
                    style={{ background: "rgba(0,212,188,0.1)", color: T.teal, fontSize: 9 }}>
                    PRIMARY
                  </span>
                )}
              </div>
              {dx.rationale && <p className="text-xs leading-relaxed" style={{ color: T.dim }}>{dx.rationale}</p>}
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-full overflow-hidden" style={{ background: T.edge, height: 4 }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${dx.confidence}%` }}
                    transition={{ duration: 1.2, delay: i * 0.1 }}
                    style={{ height: "100%", borderRadius: 9999, background: barGradient(dx.confidence) }}
                  />
                </div>
                <span className="text-xs w-8 text-right" style={{ fontFamily: "JetBrains Mono,monospace", color: T.dim }}>{dx.confidence}%</span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </Panel>
  );
}

/* ── Recommendations Panel ────────────────────────────────────────────────────── */
function RecommendationsPanel({ note }) {
  const [recs, setRecs] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate evidence-based clinical recommendations for this patient. Each should be actionable with urgency level.

Patient:
- CC: ${note.chief_complaint || "N/A"}
- Diagnoses: ${(note.diagnoses || []).join(", ") || "N/A"}
- Assessment: ${note.assessment || "N/A"}
- Plan: ${note.plan || "N/A"}
- Medications: ${(note.medications || []).join(", ") || "N/A"}

Return 4-6 recommendations.`,
        response_json_schema: {
          type: "object",
          properties: {
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  detail: { type: "string" },
                  urgency: { type: "string", enum: ["urgent", "high", "moderate", "routine"] },
                  action_label: { type: "string" },
                },
              },
            },
          },
        },
      });
      setRecs(res.recommendations || []);
    } catch { toast.error("Failed"); }
    setLoading(false);
  };

  const urgencyMap = {
    urgent:   { color: T.red,    dot: T.red },
    high:     { color: "#f97316", dot: "#f97316" },
    moderate: { color: T.amber,  dot: T.amber },
    routine:  { color: T.dim,    dot: T.muted },
  };

  return (
    <Panel>
      <PanelHeader
        icon={Zap} iconColor={T.amber}
        title="Clinical Recommendations"
        action={
          <GhostBtn onClick={generate} disabled={loading} teal={!recs}>
            {loading ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
            {loading ? "Generating…" : recs ? "Refresh" : "Generate"}
          </GhostBtn>
        }
      />
      <div>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm" style={{ color: T.dim }}>
            <Loader2 size={14} className="animate-spin" /> Generating recommendations…
          </div>
        ) : !recs ? (
          <div className="py-8 text-center text-xs" style={{ color: T.dim }}>Click Generate for evidence-based recommendations.</div>
        ) : (
          recs.map((rec, i) => {
            const u = urgencyMap[rec.urgency] || urgencyMap.routine;
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="px-4 py-3 flex items-start justify-between gap-3 transition-colors"
                style={{ borderBottom: i < recs.length - 1 ? `1px solid ${T.border}` : "none" }}
                onMouseEnter={e => e.currentTarget.style.background = T.edge}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: u.dot }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: T.bright }}>{rec.title}</p>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: T.dim }}>{rec.detail}</p>
                  </div>
                </div>
                <button className="text-xs flex-shrink-0 whitespace-nowrap px-2.5 py-1 rounded-lg transition-colors"
                  style={{ border: `1px solid ${T.border}`, color: T.dim, background: "transparent" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = T.teal; e.currentTarget.style.color = T.teal; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.dim; }}
                >
                  {rec.action_label || "Order"} →
                </button>
              </motion.div>
            );
          })
        )}
      </div>
    </Panel>
  );
}

/* ── Composite Risk Panel ─────────────────────────────────────────────────────── */
function CompositeRiskPanel({ note }) {
  const [risk, setRisk] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Calculate a composite clinical risk score (0-100) and list top 3 contributing risk factors with point contributions.

Patient:
- Diagnoses: ${(note.diagnoses || []).join(", ") || "N/A"}
- Medications: ${(note.medications || []).join(", ") || "N/A"}
- Medical History: ${note.medical_history || "N/A"}
- Assessment: ${note.assessment || "N/A"}
- Age: ${note.patient_age || "Unknown"}`,
        response_json_schema: {
          type: "object",
          properties: {
            score: { type: "number" },
            label: { type: "string" },
            factors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  points: { type: "number" },
                  color: { type: "string", enum: ["red", "amber", "orange"] },
                },
              },
            },
          },
        },
      });
      setRisk(res);
    } catch { toast.error("Failed"); }
    setLoading(false);
  };

  const dotMap = { red: T.red, amber: T.amber, orange: "#f97316" };

  return (
    <Panel>
      <PanelHeader
        icon={AlertTriangle} iconColor={T.red}
        title="Composite Risk"
        action={
          <GhostBtn onClick={generate} disabled={loading}>
            {loading ? <Loader2 size={11} className="animate-spin" /> : <Activity size={11} />}
            {loading ? "…" : risk ? "Recalc" : "Calculate"}
          </GhostBtn>
        }
      />
      <div className="p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-4 text-sm" style={{ color: T.dim }}>
            <Loader2 size={14} className="animate-spin" /> Calculating…
          </div>
        ) : risk ? (
          <>
            <div className="flex justify-center py-2">
              <RiskRing score={risk.score} />
            </div>
            <div className="space-y-2">
              {(risk.factors || []).map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dotMap[f.color] || T.dim }} />
                  <span className="text-xs flex-1" style={{ color: T.text }}>{f.name}</span>
                  <span className="text-xs font-bold" style={{ fontFamily: "JetBrains Mono,monospace", color: T.dim }}>+{f.points}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <div className="text-4xl font-bold mb-1" style={{ color: T.muted }}>—</div>
            <p className="text-xs" style={{ color: T.dim }}>Click Calculate to assess risk</p>
          </div>
        )}
      </div>
    </Panel>
  );
}

/* ── Active Medications Panel ─────────────────────────────────────────────────── */
function ActiveMedicationsPanel({ note }) {
  const meds = note.medications || [];
  return (
    <Panel>
      <PanelHeader icon={FlaskConical} iconColor={T.purple} title="Active Medications"
        action={<span className="text-xs px-2 py-0.5 rounded" style={{ border: `1px solid ${T.border}`, color: T.dim }}>MAR</span>}
      />
      <div>
        {meds.length === 0 ? (
          <div className="p-4 text-center text-xs" style={{ color: T.dim }}>No medications documented</div>
        ) : (
          meds.map((med, i) => (
            <div key={i} className="px-4 py-2.5 flex items-center gap-3 transition-colors"
              style={{ borderBottom: i < meds.length - 1 ? `1px solid ${T.border}` : "none" }}
              onMouseEnter={e => e.currentTarget.style.background = T.edge}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: T.purple }} />
              <span className="text-sm flex-1" style={{ color: T.text }}>{med}</span>
              <Check size={12} style={{ color: T.green }} className="flex-shrink-0" />
            </div>
          ))
        )}
      </div>
    </Panel>
  );
}

/* ── MDM Notes Panel ──────────────────────────────────────────────────────────── */
function MDMNotesPanel({ note, mdm, onAdd, onDelete, onEdit }) {
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [phase, setPhase] = useState("initial");
  const [autoLoading, setAutoLoading] = useState(false);

  const allEntries = [
    ...(mdm.initial || []).map(e => ({ ...e, phase: "initial" })),
    ...(mdm.final || []).map(e => ({ ...e, phase: "final" })),
  ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  const submit = () => {
    if (!title.trim() || !content.trim()) { toast.error("Title and content required"); return; }
    onAdd(phase, { title: title.trim(), content: content.trim() });
    setTitle(""); setContent(""); setShowAdd(false);
  };

  const autoPopulate = async (targetPhase) => {
    setAutoLoading(true);
    const phaseLabel = targetPhase === "initial" ? "Initial" : "Final";
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate structured MDM sections for the ${phaseLabel} phase.
Note: CC: ${note.chief_complaint || "N/A"}, HPI: ${note.history_of_present_illness || "N/A"}, Assessment: ${note.assessment || "N/A"}, Plan: ${note.plan || "N/A"}, Diagnoses: ${(note.diagnoses || []).join(", ") || "N/A"}
Generate 4 MDM sections: 1. Diagnostic Reasoning, 2. Risk Stratification, 3. Treatment Decisions, 4. ${targetPhase === "initial" ? "Initial Workup Plan" : "Discharge Plan"}.`,
        response_json_schema: {
          type: "object",
          properties: { sections: { type: "array", items: { type: "object", properties: { title: { type: "string" }, content: { type: "string" } } } } },
        },
      });
      (res.sections || []).forEach(s => onAdd(targetPhase, { ...s, ai_generated: true }));
      toast.success(`${(res.sections || []).length} sections added`);
    } catch { toast.error("Auto-populate failed"); }
    setAutoLoading(false);
  };

  const inputStyle = {
    width: "100%", background: T.edge, border: `1px solid ${T.border}`,
    color: T.bright, fontSize: 13, padding: "8px 12px", borderRadius: 8,
    outline: "none", fontFamily: "DM Sans, sans-serif",
  };

  return (
    <Panel>
      <PanelHeader
        icon={Brain} iconColor={T.purple}
        title={`MDM Documentation`}
        action={
          <div className="flex gap-2">
            <GhostBtn onClick={() => autoPopulate("initial")} disabled={autoLoading}>
              {autoLoading ? <Loader2 size={10} className="animate-spin" /> : <Wand2 size={10} />} Auto-fill
            </GhostBtn>
            <GhostBtn onClick={() => autoPopulate("final")} disabled={autoLoading}>
              <Wand2 size={10} /> Final
            </GhostBtn>
            <GhostBtn onClick={() => setShowAdd(!showAdd)} teal>
              <Plus size={11} /> Add
            </GhostBtn>
          </div>
        }
      />

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden" style={{ borderBottom: `1px solid ${T.border}` }}>
            <div className="p-4 space-y-3" style={{ background: `${T.navy}80` }}>
              <div className="flex gap-2">
                {["initial", "final"].map(p => (
                  <button key={p} onClick={() => setPhase(p)}
                    className="flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors capitalize"
                    style={{
                      border: `1px solid ${phase === p ? (p === "initial" ? T.teal : T.green) : T.border}`,
                      background: phase === p ? (p === "initial" ? `${T.teal}22` : `${T.green}22`) : "transparent",
                      color: phase === p ? (p === "initial" ? T.teal : T.green) : T.dim,
                    }}>
                    {p} MDM
                  </button>
                ))}
              </div>
              <input placeholder="Section title…" value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
              <textarea placeholder="Document your clinical reasoning…" value={content} onChange={e => setContent(e.target.value)} rows={4} style={{ ...inputStyle, resize: "none" }} />
              <div className="flex gap-2 justify-end">
                <GhostBtn onClick={() => setShowAdd(false)}>Cancel</GhostBtn>
                <GhostBtn onClick={submit} teal><Plus size={11} /> Add</GhostBtn>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        {allEntries.length === 0 ? (
          <div className="p-8 text-center">
            <Brain size={32} style={{ color: T.muted, margin: "0 auto 8px" }} />
            <p className="text-xs" style={{ color: T.dim }}>No MDM entries yet. Use Auto-fill or Add.</p>
          </div>
        ) : (
          allEntries.map((entry, idx) => (
            <div key={entry.id} style={{ borderBottom: idx < allEntries.length - 1 ? `1px solid ${T.border}` : "none" }}>
              <button onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
                className="w-full px-4 py-3 flex items-center gap-3 text-left transition-colors"
                onMouseEnter={e => e.currentTarget.style.background = T.edge}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: entry.phase === "initial" ? T.teal : T.green }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate" style={{ color: T.bright }}>{entry.title}</span>
                    {entry.ai_generated && <span className="text-xs px-1.5 py-0.5 rounded flex items-center gap-1" style={{ background: "rgba(155,109,255,0.1)", color: T.purple, fontSize: 9 }}><Bot size={9} />AI</span>}
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: entry.phase === "initial" ? "rgba(0,212,188,0.08)" : "rgba(46,204,113,0.08)", color: entry.phase === "initial" ? T.teal : T.green, fontSize: 9 }}>
                      {entry.phase}
                    </span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: T.dim }}>{format(new Date(entry.timestamp), "MMM d, h:mm a")}</p>
                </div>
                {expanded === entry.id ? <ChevronUp size={14} style={{ color: T.dim }} /> : <ChevronDown size={14} style={{ color: T.dim }} />}
              </button>
              <AnimatePresence>
                {expanded === entry.id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="px-4 pb-4 space-y-3" style={{ background: `${T.navy}60` }}>
                      {editing === entry.id ? (
                        <>
                          <input value={editTitle} onChange={e => setEditTitle(e.target.value)} style={inputStyle} />
                          <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={5} style={{ ...inputStyle, resize: "none" }} />
                          <div className="flex gap-2 justify-end">
                            <GhostBtn onClick={() => setEditing(null)}>Cancel</GhostBtn>
                            <GhostBtn onClick={() => { onEdit(entry.phase, entry.id, { title: editTitle, content: editContent }); setEditing(null); }} teal>
                              <Check size={11} /> Save
                            </GhostBtn>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: T.text }}>{entry.content}</p>
                          <div className="flex gap-2 justify-end pt-1">
                            <GhostBtn onClick={() => { setEditing(entry.id); setEditTitle(entry.title); setEditContent(entry.content); }}>
                              <Pencil size={10} /> Edit
                            </GhostBtn>
                            <button onClick={() => onDelete(entry.phase, entry.id)}
                              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-colors"
                              style={{ border: `1px solid rgba(255,92,108,0.2)`, color: T.red, background: "transparent" }}>
                              <Trash2 size={10} /> Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        )}
      </div>
    </Panel>
  );
}

/* ── Discharge Summary Panel ──────────────────────────────────────────────────── */
function DischargeSummaryPanel({ note, mdm, noteId }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const generate = async () => {
    setLoading(true); setSummary(null); setOpen(true);
    const finalCtx = (mdm.final || []).map(e => `**${e.title}**\n${e.content}`).join("\n\n") || "(No final MDM)";
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a comprehensive discharge summary.\nPatient: ${note.patient_name || "Unknown"} | Age: ${note.patient_age || "?"}\nCC: ${note.chief_complaint || "N/A"}\nDiagnoses: ${(note.diagnoses || []).join(", ")}\nMedications: ${(note.medications || []).join(", ")}\nFinal MDM:\n${finalCtx}\n\nSections: Admission Diagnosis, Hospital Course, Discharge Diagnoses, Procedures, Condition, Discharge Medications, Instructions, Follow-Up, Return Precautions.`,
      });
      setSummary(res);
    } catch { toast.error("Failed"); }
    setLoading(false);
  };

  return (
    <Panel>
      <PanelHeader
        icon={FileText} iconColor={T.teal}
        title="Discharge Summary"
        action={
          <div className="flex gap-2">
            {summary && (
              <GhostBtn onClick={() => setOpen(!open)}>
                {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                {open ? "Collapse" : "Expand"}
              </GhostBtn>
            )}
            <GhostBtn onClick={generate} disabled={loading} teal={!summary}>
              {loading ? <Loader2 size={11} className="animate-spin" /> : <FileText size={11} />}
              {loading ? "Generating…" : summary ? "Regen" : "Generate"}
            </GhostBtn>
          </div>
        }
      />
      <AnimatePresence>
        {open && (loading || summary) && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <div className="p-4">
              {loading ? (
                <div className="flex items-center gap-2 text-sm py-2" style={{ color: T.dim }}>
                  <Loader2 size={14} className="animate-spin" /> Generating…
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="prose max-w-none text-sm leading-relaxed" style={{ color: T.text }}>
                    <ReactMarkdown components={mdComponents}>{summary}</ReactMarkdown>
                  </div>
                  <div className="flex justify-end">
                    <GhostBtn onClick={async () => { await base44.entities.ClinicalNote.update(noteId, { discharge_summary: summary }); toast.success("Saved to note"); }} teal>
                      <Check size={11} /> Save to Note
                    </GhostBtn>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Panel>
  );
}

/* ── Layout Config ────────────────────────────────────────────────────────────── */
const DEFAULT_PANELS = [
  { id: "insight",         label: "AI Clinical Insight",       span: "full" },
  { id: "differential",   label: "Differential Diagnosis",     span: "half" },
  { id: "recommendations",label: "Clinical Recommendations",   span: "half" },
  { id: "patient",        label: "Patient Snapshot",           span: "third" },
  { id: "risk",           label: "Composite Risk",             span: "third" },
  { id: "medications",    label: "Active Medications",         span: "third" },
  { id: "discharge",      label: "Discharge Summary",          span: "full" },
  { id: "mdm_notes",      label: "MDM Documentation",          span: "full" },
];

const STORAGE_KEY = "mdm_layout_v2";
function loadLayout() { try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : null; } catch { return null; } }
function saveLayout(p) { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); }

/* ── Main Export ──────────────────────────────────────────────────────────────── */
export default function MedicalDecisionMakingTab({ note, onUpdateNote, noteId }) {
  const parseMDM = () => {
    if (!note.mdm) return { initial: [], final: [] };
    try {
      const p = typeof note.mdm === "string" ? JSON.parse(note.mdm) : note.mdm;
      if (p && typeof p === "object" && !Array.isArray(p)) return { initial: p.initial || [], final: p.final || [] };
      if (Array.isArray(p)) return { initial: p, final: [] };
    } catch {}
    return { initial: [], final: [] };
  };

  const [mdm, setMdm] = useState(parseMDM);
  const [customizing, setCustomizing] = useState(false);
  const [panels, setPanels] = useState(() => loadLayout() || DEFAULT_PANELS);

  const persist = async (updated) => { setMdm(updated); await base44.entities.ClinicalNote.update(noteId, { mdm: JSON.stringify(updated) }); };
  const addEntry = async (phase, data) => {
    const entry = { id: `mdm_${Date.now()}_${Math.random()}`, title: data.title, content: data.content, timestamp: new Date().toISOString(), ai_generated: !!data.ai_generated };
    await persist({ ...mdm, [phase]: [...(mdm[phase] || []), entry] });
    toast.success("Entry added");
  };
  const deleteEntry = async (phase, id) => persist({ ...mdm, [phase]: (mdm[phase] || []).filter(e => e.id !== id) });
  const editEntry = async (phase, id, changes) => { await persist({ ...mdm, [phase]: (mdm[phase] || []).map(e => e.id === id ? { ...e, ...changes } : e) }); toast.success("Updated"); };

  const toggleVisible = (id) => { const n = panels.map(p => p.id === id ? { ...p, hidden: !p.hidden } : p); setPanels(n); saveLayout(n); };
  const changeSpan = (id, span) => { const n = panels.map(p => p.id === id ? { ...p, span } : p); setPanels(n); saveLayout(n); };
  const onDragEnd = (result) => {
    if (!result.destination) return;
    const r = Array.from(panels);
    const [rem] = r.splice(result.source.index, 1);
    r.splice(result.destination.index, 0, rem);
    setPanels(r); saveLayout(r);
  };
  const resetLayout = () => { setPanels(DEFAULT_PANELS); localStorage.removeItem(STORAGE_KEY); toast.success("Reset"); };

  const renderPanel = (panel) => {
    if (panel.hidden) return null;
    const props = { note, mdm, noteId };
    switch (panel.id) {
      case "patient":         return <PatientSnapshotPanel {...props} />;
      case "insight":         return <ClinicalInsightPanel {...props} />;
      case "differential":    return <DifferentialPanel {...props} />;
      case "recommendations": return <RecommendationsPanel {...props} />;
      case "risk":            return <CompositeRiskPanel {...props} />;
      case "medications":     return <ActiveMedicationsPanel {...props} />;
      case "discharge":       return <DischargeSummaryPanel {...props} />;
      case "mdm_notes":       return <MDMNotesPanel {...props} onAdd={addEntry} onDelete={deleteEntry} onEdit={editEntry} />;
      default: return null;
    }
  };

  const visible = panels.filter(p => !p.hidden);

  // Map span names to CSS col-span classes (12-column grid)
  const spanClass = { full: "col-span-12", half: "col-span-12 lg:col-span-6", third: "col-span-12 lg:col-span-4" };

  return (
    <div className="min-h-screen p-5" style={{ background: T.navy, fontFamily: "DM Sans, sans-serif" }}>
      {/* Google Fonts */}
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&family=JetBrains+Mono:wght@300;400;500&display=swap" />

      {/* Header / Topbar */}
      <div className="flex items-center justify-between px-2 py-3 rounded-xl"
        style={{ background: "rgba(11,29,53,0.7)", border: `1px solid ${T.border}`, backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${T.teal}, ${T.teal2})` }}>
            <Brain size={16} style={{ color: T.navy }} />
          </div>
          <div>
            <div className="font-semibold text-sm" style={{ color: T.bright }}>Medical Decision Making</div>
            <div className="text-xs" style={{ color: T.dim }}>AI-powered clinical reasoning dashboard</div>
          </div>
          {/* Live badge */}
          <div className="flex items-center gap-1.5 ml-2 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ background: "rgba(46,204,113,0.1)", color: T.green, border: "1px solid rgba(46,204,113,0.2)" }}>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: T.green }} />
            LIVE
          </div>
        </div>
        <div className="flex items-center gap-2">
          {customizing && (
            <button onClick={resetLayout}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-colors"
              style={{ border: `1px solid ${T.border}`, color: T.dim, background: "transparent" }}>
              <RotateCcw size={11} /> Reset
            </button>
          )}
          <button onClick={() => setCustomizing(c => !c)}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
            style={{
              border: `1px solid ${customizing ? T.teal : T.border}`,
              background: customizing ? `${T.teal}22` : "transparent",
              color: customizing ? T.teal : T.dim,
            }}>
            <Settings size={12} />
            {customizing ? "Done" : "Customize"}
          </button>
        </div>
      </div>

      {/* Customize Drawer */}
      <AnimatePresence>
        {customizing && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden">
            <div className="rounded-xl p-4 space-y-2" style={{ background: T.panel, border: `1px solid ${T.border}` }}>
              <p className="text-xs mb-3" style={{ color: T.dim }}>Drag to reorder · Toggle visibility · Set width</p>
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="mdm-panels">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                      {panels.map((panel, idx) => (
                        <Draggable key={panel.id} draggableId={panel.id} index={idx}>
                          {(prov) => (
                            <div ref={prov.innerRef} {...prov.draggableProps}
                              className="flex items-center gap-3 px-3 py-2 rounded-lg"
                              style={{ background: T.edge, border: `1px solid ${T.border}` }}>
                              <div {...prov.dragHandleProps} style={{ color: T.muted, cursor: "grab" }}>
                                <GripVertical size={14} />
                              </div>
                              <span className={`flex-1 text-sm ${panel.hidden ? "line-through" : ""}`} style={{ color: panel.hidden ? T.dim : T.text }}>{panel.label}</span>
                              <div className="flex gap-1">
                                {[{ span: "third", label: "1/3" }, { span: "half", label: "½" }, { span: "full", label: "Full" }].map(opt => (
                                  <button key={opt.span} onClick={() => changeSpan(panel.id, opt.span)}
                                    className="px-2 py-0.5 text-xs rounded transition-colors"
                                    style={{
                                      border: `1px solid ${panel.span === opt.span ? T.teal : T.border}`,
                                      background: panel.span === opt.span ? `${T.teal}22` : "transparent",
                                      color: panel.span === opt.span ? T.teal : T.dim,
                                    }}>
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                              <button onClick={() => toggleVisible(panel.id)} style={{ color: panel.hidden ? T.muted : T.text }}>
                                {panel.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                              </button>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panel rows */}
      {rows.map((row, ri) => {
        if (row.type === "full") return <div key={ri}>{renderPanel(row.panels[0])}</div>;
        if (row.type === "halves") return (
          <div key={ri} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {row.panels.map(p => <div key={p.id}>{renderPanel(p)}</div>)}
          </div>
        );
        if (row.type === "thirds") return (
          <div key={ri} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {row.panels.map(p => <div key={p.id}>{renderPanel(p)}</div>)}
          </div>
        );
        return null;
      })}
    </div>
  );
}