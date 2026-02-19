import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, X, ClipboardList, Code, Pill, Brain, BookOpen, AlertCircle,
  Loader2, Check, ChevronRight, Activity, FileText, Stethoscope, ScanSearch,
  TrendingUp, CheckCircle2, Lightbulb, TriangleAlert
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import AIMDMAnalyzer from "../notes/AIMDMAnalyzer";
import AIGuidelineSuggestions from "../notes/AIGuidelineSuggestions";
import ClinicalDecisionSupport from "../notes/ClinicalDecisionSupport";
import AIComprehensiveSummary from "../notes/AIComprehensiveSummary";
import MedicalLiteratureSearch from "../research/MedicalLiteratureSearch";
import NoteQuestionAnswering from "./NoteQuestionAnswering";

// ── Tab definitions ───────────────────────────────────────────────────────────
const TABS = [
  { id: "analyze",    label: "Analyze",    icon: ScanSearch,    color: "violet" },
  { id: "summarize",  label: "Summarize",  icon: ClipboardList, color: "blue" },
  { id: "qa",         label: "Q&A",        icon: Brain,         color: "indigo" },
  { id: "icd10",      label: "ICD-10",     icon: Code,          color: "emerald" },
  { id: "treatment",  label: "Treatment",  icon: Pill,          color: "orange" },
  { id: "diagnosis",  label: "Diagnosis",  icon: Brain,         color: "purple" },
  { id: "guidelines", label: "Guidelines", icon: BookOpen,      color: "amber" },
  { id: "mdm",        label: "MDM",        icon: FileText,      color: "rose" },
  { id: "ros",        label: "ROS",        icon: Activity,      color: "teal" },
  { id: "research",   label: "Research",   icon: BookOpen,      color: "indigo" },
];

const COLOR = {
  blue:    { btn: "bg-blue-600 hover:bg-blue-700",    badge: "bg-blue-100 text-blue-700",    border: "border-blue-200",    text: "text-blue-700",    dot: "bg-blue-500" },
  emerald: { btn: "bg-emerald-600 hover:bg-emerald-700", badge: "bg-emerald-100 text-emerald-700", border: "border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
  orange:  { btn: "bg-orange-600 hover:bg-orange-700",  badge: "bg-orange-100 text-orange-700",  border: "border-orange-200",  text: "text-orange-700",  dot: "bg-orange-500" },
  purple:  { btn: "bg-purple-600 hover:bg-purple-700",  badge: "bg-purple-100 text-purple-700",  border: "border-purple-200",  text: "text-purple-700",  dot: "bg-purple-500" },
  amber:   { btn: "bg-amber-600 hover:bg-amber-700",    badge: "bg-amber-100 text-amber-700",    border: "border-amber-200",   text: "text-amber-700",   dot: "bg-amber-500" },
  rose:    { btn: "bg-rose-600 hover:bg-rose-700",      badge: "bg-rose-100 text-rose-700",      border: "border-rose-200",    text: "text-rose-700",    dot: "bg-rose-500" },
  teal:    { btn: "bg-teal-600 hover:bg-teal-700",      badge: "bg-teal-100 text-teal-700",      border: "border-teal-200",    text: "text-teal-700",    dot: "bg-teal-500" },
  violet:  { btn: "bg-violet-600 hover:bg-violet-700",  badge: "bg-violet-100 text-violet-700",  border: "border-violet-200",  text: "text-violet-700",  dot: "bg-violet-500" },
  indigo:  { btn: "bg-indigo-600 hover:bg-indigo-700",  badge: "bg-indigo-100 text-indigo-700",  border: "border-indigo-200",  text: "text-indigo-700",  dot: "bg-indigo-500" },
};

// ── Panel: Analyze ────────────────────────────────────────────────────────────
const PRIORITY_CONFIG = {
  critical: { label: "Critical", color: "bg-red-100 text-red-700 border-red-200", dot: "bg-red-500", icon: TriangleAlert },
  high:     { label: "High",     color: "bg-orange-100 text-orange-700 border-orange-200", dot: "bg-orange-500", icon: AlertCircle },
  medium:   { label: "Medium",   color: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-400", icon: Lightbulb },
  low:      { label: "Low",      color: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400", icon: CheckCircle2 },
};

function AnalyzePanel({ note, onUpdateNote }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [applied, setApplied] = useState(new Set());

  const run = async () => {
    const context = [
      note.patient_name && `Patient: ${note.patient_name}`,
      note.chief_complaint && `Chief Complaint: ${note.chief_complaint}`,
      note.history_of_present_illness && `HPI: ${note.history_of_present_illness}`,
      note.assessment && `Assessment: ${note.assessment}`,
      note.plan && `Plan: ${note.plan}`,
      note.diagnoses?.length && `Diagnoses: ${note.diagnoses.join(", ")}`,
      note.medications?.length && `Medications: ${note.medications.join(", ")}`,
      note.allergies?.length && `Allergies: ${note.allergies.join(", ")}`,
      note.review_of_systems && `ROS: ${note.review_of_systems}`,
      note.physical_exam && `Physical Exam: ${note.physical_exam}`,
      note.vital_signs && Object.keys(note.vital_signs).length > 0 &&
        `Vitals: ${JSON.stringify(note.vital_signs)}`,
    ].filter(Boolean).join("\n");

    if (!context.trim()) {
      toast.error("Add some clinical data to the note first");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert clinical AI. Perform a comprehensive analysis of this clinical note and identify gaps, recommendations, safety alerts, and quality improvement opportunities.

CLINICAL NOTE DATA:
${context}

Analyze across the following dimensions:
1. Documentation completeness — missing required elements
2. Clinical safety — drug interactions, allergy conflicts, contraindications, abnormal vitals
3. Diagnostic gaps — missing workup, incomplete differential
4. Treatment optimization — guideline adherence, underutilized therapies
5. Billing & coding — documentation supporting the visit complexity
6. Follow-up & care coordination — missing follow-up instructions, referrals

For each finding, classify priority as: critical, high, medium, or low.
Provide an overall_score (0-100) reflecting documentation and clinical quality.`,
        response_json_schema: {
          type: "object",
          properties: {
            overall_score: { type: "number", minimum: 0, maximum: 100 },
            score_label: { type: "string" },
            score_rationale: { type: "string" },
            findings: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  priority: { type: "string", enum: ["critical", "high", "medium", "low"] },
                  title: { type: "string" },
                  detail: { type: "string" },
                  action: { type: "string" },
                  apply_field: { type: "string" },
                  apply_value: { type: "string" }
                }
              }
            },
            strengths: { type: "array", items: { type: "string" } }
          }
        }
      });
      setResult(res);
    } catch {
      toast.error("Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const applyFinding = async (finding, idx) => {
    if (!finding.apply_field || !finding.apply_value) return;
    const current = note[finding.apply_field] || "";
    const updated = current ? `${current}\n\n${finding.apply_value}` : finding.apply_value;
    await onUpdateNote({ [finding.apply_field]: updated });
    setApplied(prev => new Set([...prev, idx]));
    toast.success("Applied to note");
  };

  const scoreColor = (s) => s >= 80 ? "text-emerald-600" : s >= 60 ? "text-amber-600" : "text-rose-600";
  const scoreBg   = (s) => s >= 80 ? "bg-emerald-50 border-emerald-200" : s >= 60 ? "bg-amber-50 border-amber-200" : "bg-rose-50 border-rose-200";

  const grouped = result?.findings
    ? ["critical","high","medium","low"].reduce((acc, p) => {
        const items = result.findings.filter(f => f.priority === p);
        if (items.length) acc[p] = items;
        return acc;
      }, {})
    : {};

  return (
    <div className="space-y-4">
      <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 text-xs text-violet-800">
        AI scans the entire note for documentation gaps, safety alerts, clinical quality, and actionable improvements.
      </div>

      <Button onClick={run} disabled={loading} className="w-full bg-violet-600 hover:bg-violet-700 text-white gap-2">
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing note...</>
          : <><ScanSearch className="w-4 h-4" /> Run Full Analysis</>}
      </Button>

      {result && (
        <div className="space-y-4">
          {/* Score */}
          <div className={`rounded-xl border p-4 ${scoreBg(result.overall_score)}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-600">Note Quality Score</span>
              <span className={`text-2xl font-black ${scoreColor(result.overall_score)}`}>{result.overall_score}<span className="text-sm font-semibold text-slate-400">/100</span></span>
            </div>
            <div className="w-full h-2 bg-white rounded-full border border-slate-200 overflow-hidden mb-2">
              <div className={`h-full rounded-full transition-all duration-700 ${result.overall_score >= 80 ? "bg-emerald-500" : result.overall_score >= 60 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${result.overall_score}%` }} />
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{result.score_rationale}</p>
          </div>

          {/* Findings by priority */}
          {Object.entries(grouped).map(([priority, items]) => {
            const cfg = PRIORITY_CONFIG[priority];
            const Icon = cfg.icon;
            return (
              <div key={priority}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{cfg.label} Priority ({items.length})</span>
                </div>
                <div className="space-y-2">
                  {items.map((f, i) => {
                    const globalIdx = result.findings.indexOf(f);
                    const isApplied = applied.has(globalIdx);
                    return (
                      <div key={i} className={`rounded-xl border p-3 ${cfg.color}`}>
                        <div className="flex items-start gap-2">
                          <Icon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold leading-snug">{f.title}</p>
                            <p className="text-xs mt-0.5 opacity-80 leading-relaxed">{f.detail}</p>
                            {f.action && (
                              <p className="text-xs mt-1 font-semibold">→ {f.action}</p>
                            )}
                            {f.apply_field && f.apply_value && (
                              <button
                                onClick={() => applyFinding(f, globalIdx)}
                                disabled={isApplied}
                                className={`mt-2 flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md border transition-all ${
                                  isApplied
                                    ? "bg-white/60 text-slate-500 border-slate-200 cursor-default"
                                    : "bg-white/70 hover:bg-white border-current cursor-pointer"
                                }`}
                              >
                                {isApplied ? <><CheckCircle2 className="w-3 h-3" /> Applied</> : <><Check className="w-3 h-3" /> Apply to note</>}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Strengths */}
          {result.strengths?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Strengths</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-1">
                {result.strengths.map((s, i) => (
                  <p key={i} className="text-xs text-emerald-800 flex gap-2"><CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />{s}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Panel: Summarize ──────────────────────────────────────────────────────────
const SUMMARY_PRESETS = [
  { id: "brief_patient",    label: "Brief — Patient",       desc: "Simple language, 2–3 sentences",                color: "blue",   instruction: "Write a brief 2-3 sentence summary in simple, plain language suitable for the patient themselves. Avoid medical jargon." },
  { id: "specialist",       label: "Specialist Referral",   desc: "Detailed clinical summary",                     color: "indigo", instruction: "Write a detailed, formal clinical summary suitable for a specialist referral letter. Include all clinically relevant details, pertinent positives and negatives, current medications with doses, and clear reason for referral." },
  { id: "handoff",          label: "Handoff / Sign-out",    desc: "Key facts for covering provider",               color: "emerald",instruction: "Write a concise handoff summary for a covering provider. Focus on active issues, pending tasks, anticipated events, and any 'if-then' contingency plans." },
  { id: "recent_changes",   label: "Recent Changes",        desc: "What changed since last visit",                 color: "amber",  instruction: "Summarize only the changes and new developments since the last encounter. Highlight new diagnoses, medication changes, new findings, and updated plan." },
  { id: "discharge",        label: "Discharge Summary",     desc: "Hospital course & discharge plan",              color: "rose",   instruction: "Write a discharge summary covering the reason for admission, hospital course, procedures performed, discharge diagnoses, discharge medications, and follow-up instructions." },
  { id: "insurance",        label: "Insurance / Billing",   desc: "Medically necessary documentation",            color: "purple", instruction: "Write a concise clinical summary that documents medical necessity for the encounter and any procedures. Use specific clinical language and ICD-10-relevant terminology." },
];

const PRESET_COLORS = {
  blue:   { pill: "bg-blue-100 text-blue-700 border-blue-200",   active: "bg-blue-600 text-white border-blue-600",   btn: "bg-blue-600 hover:bg-blue-700" },
  indigo: { pill: "bg-indigo-100 text-indigo-700 border-indigo-200", active: "bg-indigo-600 text-white border-indigo-600", btn: "bg-indigo-600 hover:bg-indigo-700" },
  emerald:{ pill: "bg-emerald-100 text-emerald-700 border-emerald-200", active: "bg-emerald-600 text-white border-emerald-600", btn: "bg-emerald-600 hover:bg-emerald-700" },
  amber:  { pill: "bg-amber-100 text-amber-700 border-amber-200",  active: "bg-amber-600 text-white border-amber-600",  btn: "bg-amber-600 hover:bg-amber-700" },
  rose:   { pill: "bg-rose-100 text-rose-700 border-rose-200",    active: "bg-rose-600 text-white border-rose-600",    btn: "bg-rose-600 hover:bg-rose-700" },
  purple: { pill: "bg-purple-100 text-purple-700 border-purple-200", active: "bg-purple-600 text-white border-purple-600", btn: "bg-purple-600 hover:bg-purple-700" },
};

function SummarizePanel({ note, onUpdateNote }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState("brief_patient");
  const [customFocus, setCustomFocus] = useState("");

  const activePreset = SUMMARY_PRESETS.find(p => p.id === selectedPreset);
  const pc = PRESET_COLORS[activePreset?.color || "blue"];

  const run = async () => {
    setLoading(true);
    const instruction = customFocus.trim()
      ? `Write a clinical summary with this specific focus: "${customFocus}".`
      : activePreset.instruction;

    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `${instruction}

PATIENT: ${note.patient_name}
CHIEF COMPLAINT: ${note.chief_complaint || "N/A"}
HPI: ${note.history_of_present_illness || "N/A"}
DIAGNOSES: ${(note.diagnoses || []).join(", ") || "None"}
MEDICATIONS: ${(note.medications || []).join(", ") || "None"}
ALLERGIES: ${(note.allergies || []).join(", ") || "None"}
MEDICAL HISTORY: ${note.medical_history || "None"}
ASSESSMENT: ${note.assessment || "N/A"}
PLAN: ${note.plan || "N/A"}`,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            key_conditions: { type: "array", items: { type: "string" } },
            risk_factors: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } }
          }
        }
      });
      setResult(res);
    } catch { toast.error("Failed to summarize"); }
    finally { setLoading(false); }
  };

  const addToNote = async () => {
    if (!result) return;
    await onUpdateNote({ summary: result.summary });
    toast.success("Summary added to note");
  };

  return (
    <div className="space-y-4">
      {/* Preset selector */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Summary Type</p>
        <div className="grid grid-cols-2 gap-1.5">
          {SUMMARY_PRESETS.map((p) => {
            const isActive = selectedPreset === p.id && !customFocus.trim();
            const col = PRESET_COLORS[p.color];
            return (
              <button
                key={p.id}
                onClick={() => { setSelectedPreset(p.id); setCustomFocus(""); setResult(null); }}
                className={`text-left px-3 py-2 rounded-lg border text-xs transition-all ${isActive ? col.active : col.pill} hover:opacity-90`}
              >
                <p className="font-semibold leading-tight">{p.label}</p>
                <p className={`mt-0.5 leading-tight ${isActive ? "text-white/80" : "opacity-70"}`}>{p.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom focus */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Custom Focus <span className="normal-case font-normal">(optional — overrides preset)</span></p>
        <input
          type="text"
          value={customFocus}
          onChange={(e) => { setCustomFocus(e.target.value); setResult(null); }}
          placeholder="e.g. focus on cardiac risk factors..."
          className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 placeholder:text-slate-400"
        />
      </div>

      <Button onClick={run} disabled={loading} className={`w-full text-white gap-2 ${pc.btn}`}>
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate Summary</>}
      </Button>

      {result && (
        <div className="space-y-3">
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 text-sm space-y-3">
            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{result.summary}</p>
            {[["Key Conditions", result.key_conditions], ["Risk Factors", result.risk_factors], ["Recommendations", result.recommendations]].map(([label, items]) =>
              items?.length > 0 && (
                <div key={label}>
                  <p className="text-xs font-bold text-blue-900 uppercase tracking-wide mb-1">{label}</p>
                  <ul className="space-y-1">{items.map((item, i) => <li key={i} className="text-slate-600 flex gap-2 text-xs"><span className="text-blue-400 mt-0.5">•</span><span>{item}</span></li>)}</ul>
                </div>
              )
            )}
          </div>
          <Button onClick={addToNote} className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <Check className="w-4 h-4" /> Add to Note
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Panel: ICD-10 ─────────────────────────────────────────────────────────────
function ICD10Panel({ note, onUpdateNote }) {
  const [loading, setLoading] = useState(false);
  const [codes, setCodes] = useState(null);

  const run = async () => {
    if (!note.assessment && !note.diagnoses?.length && !note.chief_complaint) {
      toast.error("Add a chief complaint or assessment first"); return;
    }
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Suggest specific ICD-10 codes.\n\nCHIEF COMPLAINT: ${note.chief_complaint || "N/A"}\nASSESSMENT: ${note.assessment || "N/A"}\nDIAGNOSES: ${(note.diagnoses || []).join(", ") || "N/A"}`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            codes: { type: "array", items: { type: "object", properties: {
              code: { type: "string" }, description: { type: "string" },
              confidence: { type: "string", enum: ["high", "moderate", "low"] }, rationale: { type: "string" }
            }}}
          }
        }
      });
      setCodes(res.codes || []);
    } catch { toast.error("Failed to suggest codes"); }
    finally { setLoading(false); }
  };

  const addToNote = async () => {
    if (!codes?.length) return;
    const icd10Diagnoses = codes.map(c => `${c.code} - ${c.description}`);
    await onUpdateNote({ diagnoses: [...(note.diagnoses || []), ...icd10Diagnoses] });
    toast.success("Codes added to note");
    setCodes(null);
  };

  const confColor = (c) => c === 'high' ? 'bg-green-100 text-green-700' : c === 'moderate' ? 'bg-yellow-100 text-yellow-700' : 'bg-orange-100 text-orange-700';

  return (
    <div className="space-y-4">
      <Button onClick={run} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : <><Code className="w-4 h-4" /> Suggest ICD-10 Codes</>}
      </Button>
      {codes && (
        <div className="space-y-3">
          {codes.map((code, i) => (
            <div key={i} className="bg-emerald-50 rounded-xl border border-emerald-200 p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-emerald-900 font-mono">{code.code}</span>
                <Badge className={confColor(code.confidence)}>{code.confidence}</Badge>
              </div>
              <p className="text-sm font-medium text-slate-800">{code.description}</p>
              <p className="text-xs text-slate-500 mt-1">{code.rationale}</p>
            </div>
          ))}
          <Button onClick={addToNote} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
            <Check className="w-4 h-4" /> Add Codes to Note
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Panel: Treatment ──────────────────────────────────────────────────────────
function TreatmentPanel({ note, onUpdateNote }) {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);

  const run = async () => {
    if (!note.assessment && !note.diagnoses?.length) { toast.error("Add diagnoses or assessment first"); return; }
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Evidence-based treatment plan.\n\nPATIENT: ${note.patient_name}\nDIAGNOSES: ${(note.diagnoses || []).join(", ") || "N/A"}\nASSESSMENT: ${note.assessment || "N/A"}\nALLERGIES: ${(note.allergies || []).join(", ") || "None"}\nCURRENT MEDS: ${(note.medications || []).join(", ") || "None"}`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            medications: { type: "array", items: { type: "object", properties: { name: { type: "string" }, dosing: { type: "string" }, indication: { type: "string" }, duration: { type: "string" } } } },
            diagnostic_tests: { type: "array", items: { type: "string" } },
            referrals: { type: "array", items: { type: "string" } },
            follow_up: { type: "string" },
            red_flags: { type: "array", items: { type: "string" } }
          }
        }
      });
      setPlan(res);
    } catch { toast.error("Failed to generate plan"); }
    finally { setLoading(false); }
  };

  const addToNote = async () => {
    if (!plan) return;
    let text = "\n\nTREATMENT PLAN\n";
    if (plan.medications?.length) text += "\nMedications:\n" + plan.medications.map(m => `• ${m.name} — ${m.dosing} (${m.indication})`).join('\n');
    if (plan.diagnostic_tests?.length) text += "\n\nDiagnostic Tests:\n" + plan.diagnostic_tests.map(t => `• ${t}`).join('\n');
    if (plan.referrals?.length) text += "\n\nReferrals:\n" + plan.referrals.map(r => `• ${r}`).join('\n');
    if (plan.follow_up) text += `\n\nFollow-up: ${plan.follow_up}`;
    const newMeds = (plan.medications || []).map(m => `${m.name} ${m.dosing}`);
    await onUpdateNote({ plan: (note.plan || "") + text, medications: [...(note.medications || []), ...newMeds] });
    toast.success("Treatment plan added to note");
    setPlan(null);
  };

  return (
    <div className="space-y-4">
      <Button onClick={run} disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700 text-white gap-2">
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Pill className="w-4 h-4" /> Generate Treatment Plan</>}
      </Button>
      {plan && (
        <div className="space-y-3">
          {plan.medications?.length > 0 && (
            <div className="bg-orange-50 rounded-xl border border-orange-200 p-3">
              <p className="text-xs font-bold text-orange-900 uppercase tracking-wide mb-2">Medications</p>
              {plan.medications.map((m, i) => (
                <div key={i} className="mb-2 last:mb-0">
                  <p className="text-sm font-semibold text-slate-900">{m.name}</p>
                  <p className="text-xs text-slate-500">{m.dosing} · {m.duration}</p>
                </div>
              ))}
            </div>
          )}
          {plan.diagnostic_tests?.length > 0 && (
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-3">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Tests</p>
              {plan.diagnostic_tests.map((t, i) => <p key={i} className="text-xs text-slate-600 flex gap-1"><span>•</span>{t}</p>)}
            </div>
          )}
          {plan.red_flags?.length > 0 && (
            <div className="bg-red-50 rounded-xl border border-red-200 p-3">
              <p className="text-xs font-bold text-red-800 uppercase tracking-wide mb-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Red Flags</p>
              {plan.red_flags.map((f, i) => <p key={i} className="text-xs text-red-700 flex gap-1"><span>⚠</span>{f}</p>)}
            </div>
          )}
          {plan.follow_up && <p className="text-xs text-slate-600 bg-slate-50 rounded-lg p-2 border border-slate-200"><strong>Follow-up:</strong> {plan.follow_up}</p>}
          <Button onClick={addToNote} className="w-full bg-orange-600 hover:bg-orange-700 text-white gap-2">
            <Check className="w-4 h-4" /> Add to Note
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Panel: Diagnosis ──────────────────────────────────────────────────────────
function DiagnosisPanel({ note, onUpdateNote }) {
  return (
    <div className="space-y-4">
      <div className="bg-purple-50 rounded-xl border border-purple-200 p-3">
        <p className="text-xs font-bold text-purple-900 uppercase tracking-wide mb-2">AI Suggestions</p>
        <ClinicalDecisionSupport
          type="diagnostic"
          note={note}
          onAddToNote={async (diagnosis) => {
            await onUpdateNote({ diagnoses: [...(note.diagnoses || []), diagnosis] });
            toast.success("Diagnosis added to note");
          }}
        />
      </div>
      <div className="bg-red-50 rounded-xl border border-red-200 p-3">
        <p className="text-xs font-bold text-red-900 uppercase tracking-wide mb-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Safety Alerts</p>
        <ClinicalDecisionSupport
          type="contraindications"
          note={note}
          onAddToNote={async (warning) => {
            await onUpdateNote({ plan: (note.plan || "") + "\n\n⚠️ ALERT: " + warning });
            toast.success("Alert added to note");
          }}
        />
      </div>
    </div>
  );
}

// ── Panel: Guidelines ─────────────────────────────────────────────────────────
function GuidelinesPanel({ note, onUpdateNote }) {
  return (
    <AIGuidelineSuggestions
      note={note}
      onAddToPlan={async (text) => {
        await onUpdateNote({ plan: (note.plan || "") + text });
        toast.success("Guideline added to note");
      }}
    />
  );
}

// ── Panel: ROS ────────────────────────────────────────────────────────────────
const ROS_SYSTEMS = [
  "Constitutional", "Eyes", "ENT", "Cardiovascular", "Respiratory",
  "Gastrointestinal", "Genitourinary", "Musculoskeletal", "Neurological",
  "Psychiatric", "Endocrine", "Hematologic", "Integumentary"
];

function ROSPanel({ note, onUpdateNote }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const run = async () => {
    const context = [
      note.chief_complaint && `Chief Complaint: ${note.chief_complaint}`,
      note.history_of_present_illness && `HPI: ${note.history_of_present_illness}`,
      note.assessment && `Assessment: ${note.assessment}`,
      note.diagnoses?.length && `Diagnoses: ${note.diagnoses.join(", ")}`,
      note.raw_note && `Raw Notes: ${note.raw_note}`,
    ].filter(Boolean).join("\n");

    if (!context) {
      toast.error("Add a chief complaint or some clinical context first");
      return;
    }

    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert clinician. Based on the following clinical context, generate a complete, clinically accurate Review of Systems (ROS). For each system, determine if findings are normal or abnormal based on the clinical context. Use standard clinical language.

CLINICAL CONTEXT:
${context}

Generate a ROS for all 13 standard systems. For each system:
- If related to the chief complaint or diagnosis, reflect appropriate abnormal findings
- For unrelated systems, document negative/normal findings consistent with the presentation
- Use formal clinical documentation language`,
        response_json_schema: {
          type: "object",
          properties: {
            constitutional:   { type: "object", properties: { status: { type: "string", enum: ["normal", "abnormal"] }, findings: { type: "string" } } },
            eyes:             { type: "object", properties: { status: { type: "string", enum: ["normal", "abnormal"] }, findings: { type: "string" } } },
            ent:              { type: "object", properties: { status: { type: "string", enum: ["normal", "abnormal"] }, findings: { type: "string" } } },
            cardiovascular:   { type: "object", properties: { status: { type: "string", enum: ["normal", "abnormal"] }, findings: { type: "string" } } },
            respiratory:      { type: "object", properties: { status: { type: "string", enum: ["normal", "abnormal"] }, findings: { type: "string" } } },
            gastrointestinal: { type: "object", properties: { status: { type: "string", enum: ["normal", "abnormal"] }, findings: { type: "string" } } },
            genitourinary:    { type: "object", properties: { status: { type: "string", enum: ["normal", "abnormal"] }, findings: { type: "string" } } },
            musculoskeletal:  { type: "object", properties: { status: { type: "string", enum: ["normal", "abnormal"] }, findings: { type: "string" } } },
            neurological:     { type: "object", properties: { status: { type: "string", enum: ["normal", "abnormal"] }, findings: { type: "string" } } },
            psychiatric:      { type: "object", properties: { status: { type: "string", enum: ["normal", "abnormal"] }, findings: { type: "string" } } },
            endocrine:        { type: "object", properties: { status: { type: "string", enum: ["normal", "abnormal"] }, findings: { type: "string" } } },
            hematologic:      { type: "object", properties: { status: { type: "string", enum: ["normal", "abnormal"] }, findings: { type: "string" } } },
            integumentary:    { type: "object", properties: { status: { type: "string", enum: ["normal", "abnormal"] }, findings: { type: "string" } } },
          }
        }
      });
      setResult(res);
    } catch {
      toast.error("Failed to generate ROS");
    } finally {
      setLoading(false);
    }
  };

  const addToNote = async () => {
    if (!result) return;
    // Build the rosData object expected by ReviewOfSystemsEditor
    const rosObj = {};
    Object.entries(result).forEach(([key, val]) => {
      if (val?.findings) rosObj[key] = val.findings;
    });
    await onUpdateNote({ review_of_systems: JSON.stringify(rosObj) });
    toast.success("ROS added to note");
  };

  const statusColors = { normal: "bg-green-100 text-green-700", abnormal: "bg-rose-100 text-rose-700" };

  return (
    <div className="space-y-4">
      <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-xs text-teal-800">
        AI will analyze your clinical context (chief complaint, HPI, diagnoses) and generate a complete ROS consistent with the presentation.
      </div>
      <Button onClick={run} disabled={loading} className="w-full bg-teal-600 hover:bg-teal-700 text-white gap-2">
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating ROS...</> : <><Stethoscope className="w-4 h-4" /> Generate AI ROS</>}
      </Button>
      {result && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            {Object.entries(result).map(([key, val]) => (
              <div key={key} className="flex items-start gap-2 bg-white rounded-lg border border-slate-100 px-3 py-2">
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5 ${statusColors[val.status] || "bg-slate-100 text-slate-600"}`}>
                  {val.status === "normal" ? "N" : "ABN"}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-700 capitalize">{key.replace(/_/g, " ")}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{val.findings}</p>
                </div>
              </div>
            ))}
          </div>
          <Button onClick={addToNote} className="w-full bg-teal-600 hover:bg-teal-700 text-white gap-2">
            <Check className="w-4 h-4" /> Apply to ROS Tab
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Panel: MDM ────────────────────────────────────────────────────────────────
function MDMPanel({ note, onUpdateNote }) {
  return (
    <AIMDMAnalyzer
      note={note}
      onAddToNote={async (mdmText) => {
        await onUpdateNote({ mdm: (note.mdm || "") + mdmText });
        toast.success("MDM added to note");
      }}
    />
  );
}

// ── Panel: Research ────────────────────────────────────────────────────────────
function ResearchPanel({ note, onUpdateNote }) {
  return (
    <MedicalLiteratureSearch note={note} />
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
const PANEL_MAP = {
  analyze: AnalyzePanel,
  summarize: SummarizePanel,
  icd10: ICD10Panel,
  treatment: TreatmentPanel,
  diagnosis: DiagnosisPanel,
  guidelines: GuidelinesPanel,
  mdm: MDMPanel,
  ros: ROSPanel,
  research: ResearchPanel,
};

export default function AISidebar({ isOpen, onClose, note, noteId, onUpdateNote }) {
  const [activeTab, setActiveTab] = useState("analyze");
  const ActivePanel = PANEL_MAP[activeTab];
  const activeTabDef = TABS.find(t => t.id === activeTab);
  const c = COLOR[activeTabDef?.color || "blue"];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 w-full md:w-[480px] bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-4 flex items-center justify-between text-white flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold">AI Assistance Hub</h2>
                  <p className="text-white/70 text-xs">Intelligent clinical tools</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20 rounded-lg">
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Tab Grid — icon only, label on hover */}
            <div className="flex items-center justify-around px-4 py-3 bg-slate-50 border-b border-slate-200 flex-shrink-0">
              {TABS.map((t) => {
                const isActive = activeTab === t.id;
                const tc = COLOR[t.color];
                return (
                  <div key={t.id} className="relative group flex items-center justify-center">
                    <button
                      onClick={() => setActiveTab(t.id)}
                      className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center transition-all ${
                        isActive
                          ? `${tc.badge} ${tc.border} shadow-sm`
                          : "bg-white border-transparent hover:border-slate-200"
                      }`}
                    >
                      <t.icon className={`w-4 h-4 ${isActive ? tc.text : "text-slate-400 group-hover:text-slate-600"}`} />
                    </button>
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <div className={`${tc.badge} ${tc.border} border text-xs font-semibold px-2 py-1 rounded-lg whitespace-nowrap shadow-md ${tc.text}`}>
                        {t.label}
                      </div>
                      <div className={`w-2 h-2 ${tc.badge} border-r border-b ${tc.border} rotate-45 mx-auto -mt-1`} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Active panel label */}
            <div className={`flex items-center gap-2 px-4 py-2 border-b ${c.border} bg-white flex-shrink-0`}>
              {activeTabDef && <activeTabDef.icon className={`w-3.5 h-3.5 ${c.text}`} />}
              <span className={`text-xs font-bold uppercase tracking-wide ${c.text}`}>{activeTabDef?.label}</span>
            </div>

            {/* Active Panel */}
            <div className="flex-1 overflow-y-auto p-5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  {ActivePanel && <ActivePanel note={note} onUpdateNote={onUpdateNote} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}