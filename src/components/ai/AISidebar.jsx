import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, X, FileText, Activity, Code, Pill, BookOpen, AlertCircle, Brain, Beaker, Stethoscope, ClipboardList, Check, Loader2, Copy
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import AIComprehensiveSummary from "../notes/AIComprehensiveSummary";
import AIMDMAnalyzer from "../notes/AIMDMAnalyzer";
import AITreatmentPlanAnalyzer from "../notes/AITreatmentPlanAnalyzer";
import AIGuidelineSuggestions from "../notes/AIGuidelineSuggestions";
import ClinicalDecisionSupport from "../notes/ClinicalDecisionSupport";

// Map each note tab to an AI panel config
const TAB_AI_CONFIGS = {
  patient_intake: {
    title: "Patient Intake AI",
    subtitle: "AI assistance for intake & chief complaint",
    gradient: "from-blue-600 to-indigo-600",
    icon: Activity,
    panels: ["extract"],
  },
  hpi: {
    title: "HPI AI Assistant",
    subtitle: "Generate & refine history of present illness",
    gradient: "from-purple-600 to-indigo-600",
    icon: FileText,
    panels: ["analysis"],
  },
  review_of_systems: {
    title: "Review of Systems AI",
    subtitle: "AI-generated system-based symptom review",
    gradient: "from-purple-600 to-indigo-600",
    icon: ClipboardList,
    panels: ["analysis"],
  },
  physical_exam: {
    title: "Physical Exam AI",
    subtitle: "AI-assisted exam documentation",
    gradient: "from-emerald-600 to-teal-600",
    icon: Stethoscope,
    panels: ["analysis"],
  },
  vital_signs: {
    title: "Vital Signs AI",
    subtitle: "Interpret and contextualize vitals",
    gradient: "from-emerald-600 to-teal-600",
    icon: Activity,
    panels: ["analysis"],
  },
  differential: {
    title: "Differential Dx AI",
    subtitle: "AI diagnostic decision support",
    gradient: "from-rose-600 to-pink-600",
    icon: Brain,
    panels: ["diagnosis"],
  },
  labs_imaging: {
    title: "Labs & Imaging AI",
    subtitle: "Interpret results & suggest workup",
    gradient: "from-teal-600 to-cyan-600",
    icon: Beaker,
    panels: ["analysis", "guidelines"],
  },
  diagnoses: {
    title: "Diagnosis AI",
    subtitle: "AI coding & diagnostic recommendations",
    gradient: "from-indigo-600 to-purple-600",
    icon: Code,
    panels: ["diagnosis", "guidelines"],
  },
  treatment_plan: {
    title: "Treatment Plan AI",
    subtitle: "Evidence-based treatment recommendations",
    gradient: "from-amber-600 to-orange-600",
    icon: Pill,
    panels: ["treatment", "guidelines"],
  },
  medications: {
    title: "Medication AI",
    subtitle: "Drug interactions & dosing guidance",
    gradient: "from-blue-600 to-cyan-600",
    icon: Pill,
    panels: ["treatment", "diagnosis"],
  },
  procedures: {
    title: "Procedures AI",
    subtitle: "Procedure recommendations & documentation",
    gradient: "from-rose-600 to-pink-600",
    icon: Activity,
    panels: ["treatment"],
  },
  clinical_note: {
    title: "Clinical Note AI",
    subtitle: "Full note review & MDM support",
    gradient: "from-slate-600 to-slate-700",
    icon: FileText,
    panels: ["analysis", "mdm"],
  },
  finalize: {
    title: "Finalize AI",
    subtitle: "Comprehensive review & quality check",
    gradient: "from-indigo-600 to-purple-600",
    icon: Sparkles,
    panels: ["analysis", "mdm", "guidelines"],
  },
};

const DEFAULT_CONFIG = {
  title: "AI Assistance Hub",
  subtitle: "Intelligent clinical tools",
  gradient: "from-purple-600 to-indigo-600",
  icon: Sparkles,
  panels: ["summarize", "icd10", "treatmentAI", "analysis", "diagnosis", "treatment", "guidelines", "mdm"],
};

// ── Inline panels for Summarize, ICD-10, Treatment ──────────────────────────

function SummarizePanel({ note, onUpdateNote }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const run = async () => {
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a concise, actionable summary of this patient's medical history.\n\nPATIENT: ${note.patient_name}\nDIAGNOSES: ${(note.diagnoses || []).join(", ") || "None"}\nMEDICATIONS: ${(note.medications || []).join(", ") || "None"}\nALLERGIES: ${(note.allergies || []).join(", ") || "None"}\nMEDICAL HISTORY: ${note.medical_history || "None"}\n\nProvide: summary, key_conditions, active_medications, risk_factors, recommendations`,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            key_conditions: { type: "array", items: { type: "string" } },
            active_medications: { type: "array", items: { type: "string" } },
            risk_factors: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } }
          }
        }
      });
      setResult(res);
      toast.success("Summary generated");
    } catch { toast.error("Failed to summarize"); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-3">
      <Button onClick={run} disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white gap-2">
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Summarizing...</> : <><ClipboardList className="w-4 h-4" /> Generate Patient Summary</>}
      </Button>
      {result && (
        <div className="bg-white rounded-xl border border-blue-200 p-4 space-y-3 text-sm">
          <p className="text-slate-700 leading-relaxed">{result.summary}</p>
          {[["Key Conditions", result.key_conditions], ["Medications", result.active_medications], ["Risk Factors", result.risk_factors], ["Recommendations", result.recommendations]].map(([label, items]) =>
            items?.length > 0 && (
              <div key={label}>
                <p className="text-xs font-bold text-blue-900 uppercase mb-1">{label}</p>
                <ul className="space-y-0.5">{items.map((item, i) => <li key={i} className="text-slate-600 flex gap-2"><span>•</span><span>{item}</span></li>)}</ul>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

function ICD10Panel({ note, onUpdateNote }) {
  const [loading, setLoading] = useState(false);
  const [codes, setCodes] = useState(null);

  const run = async () => {
    if (!note.assessment && !note.diagnoses?.length) { toast.error("No diagnoses or assessment available"); return; }
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Suggest accurate ICD-10 codes.\n\nCHIEF COMPLAINT: ${note.chief_complaint || "N/A"}\nASSESSMENT: ${note.assessment || "N/A"}\nDIAGNOSES: ${(note.diagnoses || []).join(", ") || "N/A"}\n\nReturn most specific 5-7 character codes with confidence and rationale.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            codes: { type: "array", items: { type: "object", properties: { code: { type: "string" }, description: { type: "string" }, diagnosis: { type: "string" }, confidence: { type: "string", enum: ["high", "moderate", "low"] }, rationale: { type: "string" } } } }
          }
        }
      });
      setCodes(res.codes || []);
      toast.success("ICD-10 codes suggested");
    } catch { toast.error("Failed to suggest codes"); }
    finally { setLoading(false); }
  };

  const apply = async () => {
    if (!codes) return;
    const icd10Diagnoses = codes.map(c => `${c.code} - ${c.description}`);
    await onUpdateNote({ diagnoses: [...(note.diagnoses || []), ...icd10Diagnoses] });
    toast.success("ICD-10 codes added to note");
    setCodes(null);
  };

  return (
    <div className="space-y-3">
      <Button onClick={run} disabled={loading} className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white gap-2">
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : <><Code className="w-4 h-4" /> Suggest ICD-10 Codes</>}
      </Button>
      {codes && (
        <div className="space-y-2">
          {codes.map((code, i) => (
            <div key={i} className="bg-emerald-50 rounded-lg border border-emerald-200 p-3">
              <div className="flex items-start justify-between mb-1">
                <p className="font-bold text-emerald-900">{code.code}</p>
                <Badge className={code.confidence === 'high' ? 'bg-green-100 text-green-700' : code.confidence === 'moderate' ? 'bg-yellow-100 text-yellow-700' : 'bg-orange-100 text-orange-700'}>
                  {code.confidence}
                </Badge>
              </div>
              <p className="text-sm font-semibold text-slate-900">{code.description}</p>
              <p className="text-xs text-slate-600 mt-1">{code.rationale}</p>
            </div>
          ))}
          <Button onClick={apply} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
            <Check className="w-4 h-4" /> Add Codes to Note
          </Button>
        </div>
      )}
    </div>
  );
}

function TreatmentAIPanel({ note, onUpdateNote }) {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);

  const run = async () => {
    if (!note.assessment && !note.diagnoses?.length) { toast.error("No diagnoses or assessment available"); return; }
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate evidence-based treatment plan.\n\nPATIENT: ${note.patient_name}\nDIAGNOSES: ${(note.diagnoses || []).join(", ") || "N/A"}\nASSESSMENT: ${note.assessment || "N/A"}\nALLERGIES: ${(note.allergies || []).join(", ") || "None"}\nCURRENT MEDS: ${(note.medications || []).join(", ") || "None"}\n\nInclude medications with dosing, diagnostic tests, referrals, follow-up, red flags.`,
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
      toast.success("Treatment plan generated");
    } catch { toast.error("Failed to generate plan"); }
    finally { setLoading(false); }
  };

  const apply = async () => {
    if (!plan) return;
    let text = "\n\nAI-GENERATED TREATMENT PLAN\n";
    if (plan.medications?.length) {
      text += "\nMEDICATIONS:\n" + plan.medications.map(m => `  • ${m.name} — ${m.dosing} (${m.indication})`).join('\n');
    }
    if (plan.diagnostic_tests?.length) text += "\n\nDIAGNOSTIC TESTS:\n" + plan.diagnostic_tests.map(t => `  • ${t}`).join('\n');
    if (plan.referrals?.length) text += "\n\nREFERRALS:\n" + plan.referrals.map(r => `  • ${r}`).join('\n');
    if (plan.follow_up) text += `\n\nFOLLOW-UP: ${plan.follow_up}`;
    const newMeds = (plan.medications || []).map(m => `${m.name} ${m.dosing} - ${m.indication}`);
    await onUpdateNote({ plan: (note.plan || "") + text, medications: [...(note.medications || []), ...newMeds] });
    toast.success("Treatment plan applied to note");
    setPlan(null);
  };

  return (
    <div className="space-y-3">
      <Button onClick={run} disabled={loading} className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white gap-2">
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Pill className="w-4 h-4" /> Generate Treatment Plan</>}
      </Button>
      {plan && (
        <div className="bg-white rounded-xl border border-orange-200 p-4 space-y-3 text-sm">
          {plan.medications?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-orange-900 uppercase mb-2">Medications</p>
              {plan.medications.map((m, i) => (
                <div key={i} className="bg-orange-50 rounded-lg p-2 mb-1">
                  <p className="font-semibold text-slate-900">{m.name}</p>
                  <p className="text-xs text-slate-600">{m.dosing} · {m.indication} · {m.duration}</p>
                </div>
              ))}
            </div>
          )}
          {plan.diagnostic_tests?.length > 0 && <div><p className="text-xs font-bold text-orange-900 uppercase mb-1">Tests</p><ul>{plan.diagnostic_tests.map((t,i) => <li key={i} className="text-slate-600 text-xs flex gap-1"><span>•</span><span>{t}</span></li>)}</ul></div>}
          {plan.follow_up && <p className="text-xs text-slate-600"><strong>Follow-up:</strong> {plan.follow_up}</p>}
          <Button onClick={apply} className="w-full bg-orange-600 hover:bg-orange-700 text-white gap-2">
            <Check className="w-4 h-4" /> Apply to Note
          </Button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function PanelSection({ type, note, onUpdateNote }) {
  if (type === "documentation") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <FileText className="w-4 h-4 text-purple-600" />
          <h4 className="font-semibold text-slate-800 text-sm">Documentation Assistant</h4>
        </div>
        <AIDocumentationAssistant note={note} onUpdateNote={onUpdateNote} />
      </div>
    );
  }

  if (type === "analysis") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Brain className="w-4 h-4 text-indigo-600" />
          <h4 className="font-semibold text-slate-800 text-sm">Comprehensive Analysis</h4>
        </div>
        <AIComprehensiveSummary note={note} onApply={onUpdateNote} />
      </div>
    );
  }

  if (type === "diagnosis") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Activity className="w-4 h-4 text-blue-600" />
          <h4 className="font-semibold text-slate-800 text-sm">Diagnostic Support</h4>
        </div>
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
          <p className="text-xs font-bold text-blue-900 mb-3">AI Suggestions</p>
          <ClinicalDecisionSupport
            type="diagnostic"
            note={note}
            onAddToNote={async (diagnosis) => {
              const updatedDiagnoses = [...(note.diagnoses || []), diagnosis];
              await onUpdateNote({ diagnoses: updatedDiagnoses });
            }}
          />
        </div>
        <div className="bg-red-50 rounded-xl border border-red-200 p-4">
          <p className="text-xs font-bold text-red-900 mb-3 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> Safety Alerts
          </p>
          <ClinicalDecisionSupport
            type="contraindications"
            note={note}
            onAddToNote={async (warning) => {
              await onUpdateNote({ plan: (note.plan || "") + "\n\n⚠️ ALERT: " + warning });
            }}
          />
        </div>
      </div>
    );
  }

  if (type === "treatment") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Pill className="w-4 h-4 text-emerald-600" />
          <h4 className="font-semibold text-slate-800 text-sm">Treatment Planner</h4>
        </div>
        <AITreatmentPlanAnalyzer
          note={note}
          onAddToPlan={async (planText) => {
            await onUpdateNote({ plan: (note.plan || "") + planText });
          }}
        />
      </div>
    );
  }

  if (type === "guidelines") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="w-4 h-4 text-amber-600" />
          <h4 className="font-semibold text-slate-800 text-sm">Evidence-Based Guidelines</h4>
        </div>
        <AIGuidelineSuggestions
          note={note}
          onAddToPlan={async (text) => {
            await onUpdateNote({ plan: (note.plan || "") + text });
          }}
        />
      </div>
    );
  }

  if (type === "mdm") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Code className="w-4 h-4 text-rose-600" />
          <h4 className="font-semibold text-slate-800 text-sm">Medical Decision Making</h4>
        </div>
        <AIMDMAnalyzer
          note={note}
          onAddToNote={async (mdmText) => {
            await onUpdateNote({ mdm: (note.mdm || "") + mdmText });
          }}
        />
      </div>
    );
  }

  if (type === "summarize") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <ClipboardList className="w-4 h-4 text-blue-600" />
          <h4 className="font-semibold text-slate-800 text-sm">Summarize Patient History</h4>
        </div>
        <SummarizePanel note={note} onUpdateNote={onUpdateNote} />
      </div>
    );
  }

  if (type === "icd10") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Code className="w-4 h-4 text-emerald-600" />
          <h4 className="font-semibold text-slate-800 text-sm">ICD-10 Code Suggestions</h4>
        </div>
        <ICD10Panel note={note} onUpdateNote={onUpdateNote} />
      </div>
    );
  }

  if (type === "treatmentAI") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Pill className="w-4 h-4 text-orange-600" />
          <h4 className="font-semibold text-slate-800 text-sm">Treatment Plan Generator</h4>
        </div>
        <TreatmentAIPanel note={note} onUpdateNote={onUpdateNote} />
      </div>
    );
  }

  return null;
}

export default function AISidebar({ isOpen, onClose, note, noteId, onUpdateNote, activeTab }) {
  const config = TAB_AI_CONFIGS[activeTab] || DEFAULT_CONFIG;
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 w-full md:w-[560px] bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header — matches current tab color */}
            <div className={`bg-gradient-to-r ${config.gradient} px-6 py-5 flex items-center justify-between text-white flex-shrink-0`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">{config.title}</h2>
                  <p className="text-white/70 text-xs mt-0.5">{config.subtitle}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-white/20 rounded-lg"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content — stacked panels for the active tab */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {config.panels.map((panelType) => (
                <div
                  key={panelType}
                  className="bg-slate-50 rounded-2xl border border-slate-200 p-4"
                >
                  <PanelSection
                    type={panelType}
                    note={note}
                    onUpdateNote={onUpdateNote}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}