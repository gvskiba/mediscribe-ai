import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Brain, Sparkles, Loader2, Plus, Trash2, Pencil, Check, X,
  ChevronDown, ChevronUp, GitCompare, FileText, Wand2, Bot,
  Clock, Activity, AlertTriangle, Zap, FlaskConical, Eye, RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";

// ─── Shared Markdown ───────────────────────────────────────────────────────────
const mdComponents = {
  p: ({ children }) => <p className="mb-2 leading-relaxed text-slate-300 text-sm">{children}</p>,
  h1: ({ children }) => <h1 className="text-base font-bold mt-3 mb-1 text-white">{children}</h1>,
  h2: ({ children }) => <h2 className="text-sm font-bold mt-2 mb-1 text-slate-100">{children}</h2>,
  h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1 text-slate-200">{children}</h3>,
  ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
  li: ({ children }) => <li className="text-slate-300 text-sm">{children}</li>,
  strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
};

function DarkMarkdown({ content }) {
  return (
    <div className="prose prose-invert prose-sm max-w-none">
      <ReactMarkdown components={mdComponents}>{content}</ReactMarkdown>
    </div>
  );
}

// ─── Risk Score Gauge ──────────────────────────────────────────────────────────
function RiskGauge({ score }) {
  const clamp = Math.max(0, Math.min(100, score || 0));
  const radius = 40;
  const circumference = Math.PI * radius;
  const offset = circumference - (clamp / 100) * circumference;
  const color = clamp >= 70 ? "#ef4444" : clamp >= 40 ? "#f59e0b" : "#10b981";
  const label = clamp >= 70 ? "High Risk" : clamp >= 40 ? "Moderate–High Risk" : "Low–Moderate Risk";

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="100" height="60" viewBox="0 0 100 60">
        <path d="M 10 55 A 40 40 0 0 1 90 55" fill="none" stroke="#334155" strokeWidth="8" strokeLinecap="round" />
        <path d="M 10 55 A 40 40 0 0 1 90 55" fill="none" stroke={color} strokeWidth="8"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div className="text-3xl font-bold text-white -mt-4">{clamp}</div>
      <div className="text-xs text-slate-400 text-center">{label}</div>
    </div>
  );
}

// ─── AI Clinical Insight Panel ─────────────────────────────────────────────────
function ClinicalInsightPanel({ note }) {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a senior clinician. Provide a concise, high-value clinical insight for this patient in 3-5 sentences. Focus on the most clinically important reasoning, nuances, and decision points. Reference specific findings and evidence.

Patient data:
- Chief Complaint: ${note.chief_complaint || "Not documented"}
- HPI: ${note.history_of_present_illness || "Not documented"}
- Assessment: ${note.assessment || "Not documented"}
- Diagnoses: ${(note.diagnoses || []).join(", ") || "Not documented"}
- Medications: ${(note.medications || []).join(", ") || "Not documented"}
- Plan: ${note.plan || "Not documented"}

Write as a quoted clinical note in plain text (no markdown headers). Also list 2-3 relevant guideline references.`,
        response_json_schema: {
          type: "object",
          properties: {
            insight: { type: "string" },
            references: { type: "array", items: { type: "string" } },
          },
        },
      });
      setInsight(res);
    } catch { toast.error("Failed to generate insight"); }
    setLoading(false);
  };

  return (
    <div className="bg-gradient-to-br from-emerald-900/60 to-teal-900/40 border border-emerald-700/50 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-xs font-bold text-emerald-300 tracking-widest uppercase">AI Clinical Insight</span>
        </div>
        <Button size="sm" onClick={generate} disabled={loading}
          className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs h-7 px-3 gap-1">
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          {loading ? "Analyzing…" : insight ? "Refresh" : "Generate"}
        </Button>
      </div>

      {!insight && !loading && (
        <p className="text-slate-400 text-xs">Generate an AI clinical insight based on the note data.</p>
      )}
      {loading && (
        <div className="flex items-center gap-2 text-emerald-300 text-sm py-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Analyzing clinical data…
        </div>
      )}
      {insight && !loading && (
        <div className="space-y-3">
          <p className="text-slate-200 text-sm leading-relaxed italic">"{insight.insight}"</p>
          {insight.references?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {insight.references.map((ref, i) => (
                <span key={i} className="bg-slate-700/80 text-slate-300 text-xs px-2 py-0.5 rounded-full border border-slate-600">{ref}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Differential Diagnoses Panel ─────────────────────────────────────────────
function DifferentialPanel({ note }) {
  const [differentials, setDifferentials] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a ranked differential diagnosis list for this patient. For each diagnosis provide a confidence percentage (0-100), ICD-10 code, whether it's primary, and a brief evidence-based rationale (1-2 sentences).

Patient:
- CC: ${note.chief_complaint || "Not documented"}
- HPI: ${note.history_of_present_illness || "Not documented"}
- Assessment: ${note.assessment || "Not documented"}
- Physical Exam: ${note.physical_exam || "Not documented"}
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
    } catch { toast.error("Failed to generate differentials"); }
    setLoading(false);
  };

  // Pre-populate from existing diagnoses if not generated yet
  const displayItems = differentials || (note.diagnoses || []).map((d, i) => ({
    name: d, icd_code: "", confidence: Math.max(40, 90 - i * 15), is_primary: i === 0, rationale: "",
  }));

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-orange-400" />
          <span className="text-xs font-bold text-slate-300 tracking-widest uppercase">Differential Diagnosis</span>
        </div>
        <Button size="sm" onClick={generate} disabled={loading}
          className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs h-7 px-3 gap-1 border border-slate-600">
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          {loading ? "Analyzing…" : "Refine"}
        </Button>
      </div>
      <div className="divide-y divide-slate-700/50">
        {loading ? (
          <div className="p-6 flex items-center justify-center gap-2 text-slate-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Generating differential diagnoses…
          </div>
        ) : displayItems.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-sm">
            <Brain className="w-8 h-8 mx-auto mb-2 opacity-40" />
            No diagnoses documented. Click "Refine" to generate AI differentials.
          </div>
        ) : (
          displayItems.map((dx, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }} className="px-4 py-3 space-y-1.5 hover:bg-slate-700/30 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  {dx.icd_code && (
                    <span className="text-xs text-slate-400 font-mono bg-slate-700/60 px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5">{dx.icd_code}</span>
                  )}
                  <span className="text-sm font-semibold text-white leading-snug">{dx.name}</span>
                </div>
                {dx.is_primary && (
                  <Badge className="bg-blue-600/80 text-blue-100 border-0 text-xs flex-shrink-0">PRIMARY</Badge>
                )}
              </div>
              {dx.rationale && <p className="text-xs text-slate-400 leading-relaxed pl-0">{dx.rationale}</p>}
              <div className="flex items-center gap-2 pt-0.5">
                <div className="flex-1 bg-slate-700 rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${dx.confidence}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                    className={`h-full rounded-full ${dx.confidence >= 80 ? "bg-emerald-500" : dx.confidence >= 60 ? "bg-amber-400" : "bg-slate-500"}`}
                  />
                </div>
                <span className="text-xs text-slate-400 font-mono w-8 text-right">{dx.confidence}%</span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Clinical Recommendations Panel ───────────────────────────────────────────
function RecommendationsPanel({ note }) {
  const [recs, setRecs] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate evidence-based clinical recommendations for this patient. Each recommendation should be an actionable order or decision with a specific detail and urgency level.

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
    } catch { toast.error("Failed to generate recommendations"); }
    setLoading(false);
  };

  const urgencyConfig = {
    urgent: { dot: "bg-red-500", text: "text-red-400", label: "Urgent" },
    high: { dot: "bg-orange-400", text: "text-orange-400", label: "High" },
    moderate: { dot: "bg-amber-400", text: "text-amber-400", label: "Moderate" },
    routine: { dot: "bg-slate-400", text: "text-slate-400", label: "Routine" },
  };

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          <span className="text-xs font-bold text-slate-300 tracking-widest uppercase">Clinical Recommendations</span>
          <span className="text-xs text-slate-500">Evidence-based · Personalized</span>
        </div>
        <Button size="sm" onClick={generate} disabled={loading}
          className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs h-7 px-3 gap-1 border border-slate-600">
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          {loading ? "Generating…" : recs ? "Refresh" : "Generate"}
        </Button>
      </div>
      <div className="divide-y divide-slate-700/50">
        {loading ? (
          <div className="p-6 flex items-center justify-center gap-2 text-slate-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Generating recommendations…
          </div>
        ) : !recs ? (
          <div className="p-6 text-center text-slate-500 text-sm">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-40" />
            Click "Generate" for evidence-based clinical recommendations.
          </div>
        ) : (
          recs.map((rec, i) => {
            const uc = urgencyConfig[rec.urgency] || urgencyConfig.routine;
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="px-4 py-3 flex items-start justify-between gap-3 hover:bg-slate-700/30 transition-colors group">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`w-2.5 h-2.5 rounded-full ${uc.dot} mt-1.5 flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{rec.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{rec.detail}</p>
                  </div>
                </div>
                <button className="text-xs text-slate-400 hover:text-blue-400 border border-slate-600 hover:border-blue-500 px-2.5 py-1 rounded-lg transition-colors flex-shrink-0 whitespace-nowrap">
                  {rec.action_label || "Order"} →
                </button>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Composite Risk Panel ──────────────────────────────────────────────────────
function CompositeRiskPanel({ note }) {
  const [risk, setRisk] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Calculate a composite clinical risk score (0-100) for this patient and list the top 3 contributing risk factors with their individual point contributions.

Patient:
- Diagnoses: ${(note.diagnoses || []).join(", ") || "N/A"}
- Medications: ${(note.medications || []).join(", ") || "N/A"}
- Medical History: ${note.medical_history || "N/A"}
- Assessment: ${note.assessment || "N/A"}
- Age: ${note.patient_age || "Unknown"}

Return a risk score 0-100, top 3 risk factors with point values (+5 to +20), and a brief label like "Moderate-High Risk".`,
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
    } catch { toast.error("Failed to calculate risk"); }
    setLoading(false);
  };

  const dotColor = { red: "bg-red-500", amber: "bg-amber-400", orange: "bg-orange-400" };

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span className="text-xs font-bold text-slate-300 tracking-widest uppercase">Composite Risk</span>
        </div>
        <Button size="sm" onClick={generate} disabled={loading}
          className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs h-7 px-3 gap-1 border border-slate-600">
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Activity className="w-3 h-3" />}
          {loading ? "…" : risk ? "Recalc" : "Calculate"}
        </Button>
      </div>
      <div className="p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-slate-400 text-sm py-4">
            <Loader2 className="w-4 h-4 animate-spin" /> Calculating…
          </div>
        ) : risk ? (
          <>
            <div className="flex flex-col items-center py-2">
              <RiskGauge score={risk.score} />
            </div>
            <div className="space-y-2">
              {(risk.factors || []).map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor[f.color] || "bg-slate-400"}`} />
                  <span className="text-xs text-slate-300 flex-1">{f.name}</span>
                  <span className="text-xs font-bold text-slate-400">+{f.points}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="text-4xl font-bold text-slate-600 mb-1">—</div>
            <p className="text-xs text-slate-500">Click Calculate to assess risk</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Active Medications Panel ──────────────────────────────────────────────────
function ActiveMedicationsPanel({ note }) {
  const meds = note.medications || [];
  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-bold text-slate-300 tracking-widest uppercase">Active Medications</span>
        </div>
        <span className="text-xs text-slate-500 border border-slate-600 px-2 py-0.5 rounded">MAR</span>
      </div>
      <div className="divide-y divide-slate-700/50">
        {meds.length === 0 ? (
          <div className="p-4 text-center text-slate-500 text-xs">No medications documented</div>
        ) : (
          meds.map((med, i) => (
            <div key={i} className="px-4 py-2.5 flex items-center gap-3 hover:bg-slate-700/30 transition-colors">
              <div className="w-2 h-2 rounded-full bg-purple-400 flex-shrink-0" />
              <span className="text-sm text-slate-200 flex-1">{med}</span>
              <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── MDM Notes / Manual Entries Panel ─────────────────────────────────────────
function MDMNotesPanel({ note, mdm, onAdd, onDelete, onEdit }) {
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [phase, setPhase] = useState("initial");

  const allEntries = [
    ...(mdm.initial || []).map(e => ({ ...e, phase: "initial" })),
    ...(mdm.final || []).map(e => ({ ...e, phase: "final" })),
  ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  const submit = () => {
    if (!title.trim() || !content.trim()) { toast.error("Title and content required"); return; }
    onAdd(phase, { title: title.trim(), content: content.trim() });
    setTitle(""); setContent(""); setShowAdd(false);
  };

  const [autoLoading, setAutoLoading] = useState(false);
  const autoPopulate = async (targetPhase) => {
    setAutoLoading(true);
    const phaseLabel = targetPhase === "initial" ? "Initial (on arrival)" : "Final (pre-discharge)";
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate structured MDM sections for the ${phaseLabel} phase.
Note:
- CC: ${note.chief_complaint || "N/A"}
- HPI: ${note.history_of_present_illness || "N/A"}
- Assessment: ${note.assessment || "N/A"}
- Plan: ${note.plan || "N/A"}
- Diagnoses: ${(note.diagnoses || []).join(", ") || "N/A"}
- Medications: ${(note.medications || []).join(", ") || "N/A"}
Generate 4 MDM sections: 1. Diagnostic Reasoning (with ICD-10 codes), 2. Risk Stratification, 3. Treatment Decisions, 4. ${targetPhase === "initial" ? "Initial Workup Plan" : "Discharge Plan"}.`,
        response_json_schema: {
          type: "object",
          properties: { sections: { type: "array", items: { type: "object", properties: { title: { type: "string" }, content: { type: "string" } } } } },
        },
      });
      (res.sections || []).forEach(s => onAdd(targetPhase, { ...s, ai_generated: true }));
      toast.success(`${(res.sections || []).length} sections added to ${phaseLabel}`);
    } catch { toast.error("Auto-populate failed"); }
    setAutoLoading(false);
  };

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold text-slate-300 tracking-widest uppercase">MDM Documentation</span>
          <Badge className="bg-slate-700 text-slate-300 border-slate-600 text-xs">{allEntries.length}</Badge>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" onClick={() => autoPopulate("initial")} disabled={autoLoading}
            className="bg-blue-700/80 hover:bg-blue-600 text-white text-xs h-7 px-2.5 gap-1">
            {autoLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />} Auto-fill Initial
          </Button>
          <Button size="sm" onClick={() => autoPopulate("final")} disabled={autoLoading}
            className="bg-emerald-700/80 hover:bg-emerald-600 text-white text-xs h-7 px-2.5 gap-1">
            {autoLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />} Auto-fill Final
          </Button>
          <Button size="sm" onClick={() => setShowAdd(!showAdd)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-7 px-2.5 gap-1">
            <Plus className="w-3 h-3" /> Add Entry
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="border-b border-slate-700 overflow-hidden">
            <div className="p-4 space-y-3 bg-slate-900/40">
              <div className="flex gap-2">
                <button onClick={() => setPhase("initial")}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${phase === "initial" ? "bg-blue-600 border-blue-500 text-white" : "border-slate-600 text-slate-400 hover:border-slate-500"}`}>
                  Initial MDM
                </button>
                <button onClick={() => setPhase("final")}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${phase === "final" ? "bg-emerald-600 border-emerald-500 text-white" : "border-slate-600 text-slate-400 hover:border-slate-500"}`}>
                  Final MDM
                </button>
              </div>
              <input placeholder="Section title (e.g. Diagnostic Reasoning)" value={title} onChange={e => setTitle(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 text-white text-sm px-3 py-2 rounded-lg placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none" />
              <textarea placeholder="Document your clinical reasoning…" value={content} onChange={e => setContent(e.target.value)} rows={4}
                className="w-full bg-slate-800 border border-slate-600 text-white text-sm px-3 py-2 rounded-lg placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none resize-none" />
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-white text-xs">Cancel</Button>
                <Button size="sm" onClick={submit} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs gap-1">
                  <Plus className="w-3 h-3" /> Add
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="divide-y divide-slate-700/50">
        {allEntries.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-sm">
            <Brain className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>No MDM entries yet.</p>
            <p className="text-xs mt-1">Use Auto-fill or Add Entry to get started.</p>
          </div>
        ) : (
          allEntries.map((entry, idx) => (
            <div key={entry.id}>
              <button onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-700/30 transition-colors text-left">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${entry.phase === "initial" ? "bg-blue-400" : "bg-emerald-400"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white truncate">{entry.title}</span>
                    {entry.ai_generated && <Badge className="bg-indigo-900/60 text-indigo-300 border border-indigo-700/50 text-xs gap-0.5"><Bot className="w-2.5 h-2.5" />AI</Badge>}
                    <Badge className={`text-xs border-0 ${entry.phase === "initial" ? "bg-blue-900/60 text-blue-300" : "bg-emerald-900/60 text-emerald-300"}`}>
                      {entry.phase === "initial" ? "Initial" : "Final"}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{format(new Date(entry.timestamp), "MMM d, h:mm a")}</p>
                </div>
                {expanded === entry.id ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </button>
              <AnimatePresence>
                {expanded === entry.id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden">
                    <div className="px-4 pb-4 space-y-3 bg-slate-900/30">
                      {editing === entry.id ? (
                        <>
                          <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-600 text-white text-sm px-3 py-2 rounded-lg focus:border-indigo-500 focus:outline-none" />
                          <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={5}
                            className="w-full bg-slate-800 border border-slate-600 text-white text-sm px-3 py-2 rounded-lg focus:border-indigo-500 focus:outline-none resize-none" />
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="ghost" onClick={() => setEditing(null)} className="text-slate-400 text-xs">Cancel</Button>
                            <Button size="sm" onClick={() => { onEdit(entry.phase, entry.id, { title: editTitle, content: editContent }); setEditing(null); }}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs gap-1">
                              <Check className="w-3 h-3" /> Save
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{entry.content}</p>
                          <div className="flex gap-2 justify-end pt-1">
                            <Button size="sm" variant="ghost" onClick={() => { setEditing(entry.id); setEditTitle(entry.title); setEditContent(entry.content); }}
                              className="text-slate-400 hover:text-white text-xs gap-1">
                              <Pencil className="w-3 h-3" /> Edit
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => onDelete(entry.phase, entry.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-900/30 text-xs gap-1">
                              <Trash2 className="w-3 h-3" /> Delete
                            </Button>
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
    </div>
  );
}

// ─── Discharge Summary ─────────────────────────────────────────────────────────
function DischargeSummaryPanel({ note, mdm, noteId }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const generate = async () => {
    setLoading(true); setSummary(null); setOpen(true);
    const finalCtx = (mdm.final || []).map(e => `**${e.title}**\n${e.content}`).join("\n\n") || "(No final MDM entries)";
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a comprehensive discharge summary for:\nPatient: ${note.patient_name || "Unknown"} | Age: ${note.patient_age || "?"}\nCC: ${note.chief_complaint || "N/A"}\nDiagnoses: ${(note.diagnoses || []).join(", ")}\nMedications: ${(note.medications || []).join(", ")}\nFinal MDM:\n${finalCtx}\n\nSections: Admission Diagnosis, Hospital Course, Discharge Diagnoses, Procedures, Condition, Discharge Medications, Instructions, Follow-Up, Return Precautions.`,
      });
      setSummary(res);
    } catch { toast.error("Failed to generate"); }
    setLoading(false);
  };

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-teal-400" />
          <span className="text-xs font-bold text-slate-300 tracking-widest uppercase">Discharge Summary</span>
        </div>
        <div className="flex gap-2">
          {summary && (
            <Button size="sm" variant="ghost" onClick={() => setOpen(!open)} className="text-slate-400 text-xs gap-1">
              {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {open ? "Collapse" : "Expand"}
            </Button>
          )}
          <Button size="sm" onClick={generate} disabled={loading}
            className="bg-teal-700 hover:bg-teal-600 text-white text-xs h-7 px-3 gap-1">
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
            {loading ? "Generating…" : summary ? "Regenerate" : "Generate"}
          </Button>
        </div>
      </div>
      <AnimatePresence>
        {open && (loading || summary) && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <div className="p-4">
              {loading ? (
                <div className="flex items-center gap-2 text-slate-400 text-sm py-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Generating discharge summary…
                </div>
              ) : (
                <div className="space-y-3">
                  <DarkMarkdown content={summary} />
                  <div className="flex justify-end">
                    <Button size="sm" onClick={async () => {
                      await base44.entities.ClinicalNote.update(noteId, { discharge_summary: summary });
                      toast.success("Saved to note");
                    }} className="bg-teal-600 hover:bg-teal-500 text-white text-xs gap-1">
                      <Check className="w-3 h-3" /> Save to Note
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
    } catch { return { initial: [], final: [] }; }
  };

  const [mdm, setMdm] = useState(parseMDM);

  const persist = async (updated) => {
    setMdm(updated);
    await base44.entities.ClinicalNote.update(noteId, { mdm: JSON.stringify(updated) });
  };

  const addEntry = async (phase, data) => {
    const entry = { id: `mdm_${Date.now()}_${Math.random()}`, title: data.title, content: data.content, timestamp: new Date().toISOString(), ai_generated: !!data.ai_generated };
    const updated = { ...mdm, [phase]: [...(mdm[phase] || []), entry] };
    await persist(updated);
    toast.success("Entry added");
  };

  const deleteEntry = async (phase, id) => {
    const updated = { ...mdm, [phase]: (mdm[phase] || []).filter(e => e.id !== id) };
    await persist(updated);
  };

  const editEntry = async (phase, id, changes) => {
    const updated = { ...mdm, [phase]: (mdm[phase] || []).map(e => e.id === id ? { ...e, ...changes } : e) };
    await persist(updated);
    toast.success("Entry updated");
  };

  return (
    <div className="bg-slate-900 rounded-2xl p-4 md:p-6 space-y-4 min-h-screen">
      {/* Dark theme header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
          <Brain className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">Medical Decision Making</h3>
          <p className="text-xs text-slate-400">AI-powered clinical reasoning dashboard</p>
        </div>
      </div>

      {/* Top row: AI Insight (full width) */}
      <ClinicalInsightPanel note={note} />

      {/* Middle row: Differential + Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DifferentialPanel note={note} />
        <RecommendationsPanel note={note} />
      </div>

      {/* Bottom row: Risk + Meds + MDM Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <CompositeRiskPanel note={note} />
        <ActiveMedicationsPanel note={note} />
        <div className="lg:col-span-1">
          <DischargeSummaryPanel note={note} mdm={mdm} noteId={noteId} />
        </div>
      </div>

      {/* MDM Documentation */}
      <MDMNotesPanel note={note} mdm={mdm} onAdd={addEntry} onDelete={deleteEntry} onEdit={editEntry} />
    </div>
  );
}