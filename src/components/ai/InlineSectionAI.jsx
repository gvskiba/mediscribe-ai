import React, { useState } from "react";
import { Sparkles, XCircle, Check, Loader2, RefreshCw, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// ── Section configs with multiple quick actions ───────────────────────────────
const SECTION_CONFIGS = {
  chief_complaint: {
    label: "Chief Complaint AI",
    color: "from-blue-600 to-indigo-600",
    actions: [
      {
        id: "extract",
        label: "Extract from Notes",
        prompt: (note) => `Extract a concise chief complaint (1 sentence, symptom + duration) from:\nRaw Notes: ${note.raw_note || "N/A"}\nHPI: ${note.history_of_present_illness || "N/A"}`,
      },
      {
        id: "refine",
        label: "Refine",
        prompt: (note) => `Rewrite this chief complaint in standard clinical format (symptom + duration + context):\n"${note.chief_complaint || note.raw_note || "N/A"}"`,
      }
    ]
  },
  hpi: {
    label: "HPI AI",
    color: "from-blue-600 to-indigo-600",
    actions: [
      {
        id: "generate",
        label: "Generate OLDCARTS HPI",
        prompt: (note) => `Write a comprehensive HPI using OLDCARTS (Onset, Location, Duration, Character, Alleviating/Aggravating, Radiation, Timing, Severity) from:\nCC: ${note.chief_complaint || "N/A"}\nRaw Notes: ${note.raw_note || "N/A"}\nExisting HPI: ${note.history_of_present_illness || "N/A"}`,
      },
      {
        id: "expand",
        label: "Expand Existing",
        prompt: (note) => `Expand and improve this HPI with more clinical detail and OLDCARTS elements:\n${note.history_of_present_illness || note.raw_note || "N/A"}`,
      },
      {
        id: "summarize",
        label: "Clinical Summary",
        prompt: (note) => `Write a concise, well-structured clinical HPI summary in 3-5 sentences for this patient:\nCC: ${note.chief_complaint || "N/A"}\nHPI: ${note.history_of_present_illness || note.raw_note || "N/A"}\nInclude onset, key symptoms, severity, and relevant context.`,
      }
    ]
  },
  history_of_present_illness: {
    label: "HPI AI",
    color: "from-blue-600 to-indigo-600",
    actions: [
      {
        id: "generate",
        label: "Generate OLDCARTS HPI",
        prompt: (note) => `Write a comprehensive HPI using OLDCARTS (Onset, Location, Duration, Character, Alleviating/Aggravating, Radiation, Timing, Severity) from:\nCC: ${note.chief_complaint || "N/A"}\nRaw Notes: ${note.raw_note || "N/A"}\nExisting HPI: ${note.history_of_present_illness || "N/A"}`,
      },
      {
        id: "expand",
        label: "Expand Existing",
        prompt: (note) => `Expand and improve this HPI with more clinical detail and OLDCARTS elements:\n${note.history_of_present_illness || note.raw_note || "N/A"}`,
      },
      {
        id: "summarize",
        label: "Clinical Summary",
        prompt: (note) => `Write a concise, well-structured clinical HPI summary in 3-5 sentences for this patient:\nCC: ${note.chief_complaint || "N/A"}\nHPI: ${note.history_of_present_illness || note.raw_note || "N/A"}\nInclude onset, key symptoms, severity, and relevant context.`,
      }
    ]
  },
  medical_history: {
    label: "Medical History AI",
    color: "from-slate-600 to-slate-700",
    actions: [
      {
        id: "extract",
        label: "Extract from Notes",
        prompt: (note) => `Extract and organize past medical history, surgical history, and chronic conditions from:\nRaw Notes: ${note.raw_note || "N/A"}\nHPI: ${note.history_of_present_illness || "N/A"}`,
      }
    ]
  },
  review_of_systems: {
    label: "ROS AI",
    color: "from-purple-600 to-indigo-600",
    actions: [
      {
        id: "generate_full",
        label: "Generate Full ROS",
        prompt: (note) => `Generate a comprehensive, system-based Review of Systems for this presentation:\nCC: ${note.chief_complaint || "N/A"}\nHPI: ${note.history_of_present_illness || "N/A"}\nDiagnoses: ${(note.diagnoses || []).join(", ") || "N/A"}\nCover: Constitutional, HEENT, CV, Respiratory, GI, GU, MSK, Neuro, Psych, Skin.`,
      },
      {
        id: "pertinent",
        label: "Pertinent Findings Only",
        prompt: (note) => `List only the clinically pertinent positives and negatives for this presentation:\nCC: ${note.chief_complaint || "N/A"}\nDiagnoses: ${(note.diagnoses || []).join(", ") || "N/A"}`,
      }
    ]
  },
  physical_exam: {
    label: "Physical Exam AI",
    color: "from-emerald-600 to-teal-600",
    actions: [
      {
        id: "generate",
        label: "Generate Exam Findings",
        prompt: (note) => `Write structured physical exam documentation consistent with this presentation:\nCC: ${note.chief_complaint || "N/A"}\nDiagnoses: ${(note.diagnoses || []).join(", ") || "N/A"}\nVitals: ${JSON.stringify(note.vital_signs || {})}`,
      },
      {
        id: "focused",
        label: "Focused Exam",
        prompt: (note) => `Write a focused physical examination for the primary complaint:\nCC: ${note.chief_complaint || "N/A"}\nAssessment: ${note.assessment || "N/A"}`,
      }
    ]
  },
  assessment: {
    label: "Assessment AI",
    color: "from-rose-600 to-pink-600",
    actions: [
      {
        id: "generate",
        label: "Generate Assessment",
        prompt: (note) => `Write a concise clinical assessment with primary impression and supporting reasoning:\nCC: ${note.chief_complaint || "N/A"}\nHPI: ${note.history_of_present_illness || "N/A"}\nPhysical Exam: ${note.physical_exam || "N/A"}\nDiagnoses: ${(note.diagnoses || []).join(", ") || "N/A"}`,
      },
      {
        id: "refine",
        label: "Refine Assessment",
        prompt: (note) => `Refine and improve this clinical assessment with better clinical reasoning:\n${note.assessment || "N/A"}\n\nContext: CC: ${note.chief_complaint || "N/A"}, Diagnoses: ${(note.diagnoses || []).join(", ") || "N/A"}`,
      },
      {
        id: "differentials",
        label: "Add Differentials",
        prompt: (note) => `Append a ranked differential diagnosis list to this assessment:\nCurrent Assessment: ${note.assessment || "N/A"}\nCC: ${note.chief_complaint || "N/A"}\nHPI: ${note.history_of_present_illness || "N/A"}`,
      }
    ]
  },
  plan: {
    label: "Plan AI",
    color: "from-amber-600 to-orange-600",
    actions: [
      {
        id: "generate",
        label: "Generate Full Plan",
        prompt: (note) => `Generate a comprehensive, evidence-based treatment plan:\nCC: ${note.chief_complaint || "N/A"}\nDiagnoses: ${(note.diagnoses || []).join(", ") || "N/A"}\nMeds: ${(note.medications || []).join(", ") || "None"}\nAllergies: ${(note.allergies || []).join(", ") || "None"}\nAssessment: ${note.assessment || "N/A"}\n\nInclude: medications with dosing, tests ordered, referrals, follow-up, patient instructions.`,
      },
      {
        id: "followup",
        label: "Follow-up Plan",
        prompt: (note) => `Generate a follow-up and monitoring plan including return precautions:\nDiagnoses: ${(note.diagnoses || []).join(", ") || "N/A"}\nMeds: ${(note.medications || []).join(", ") || "None"}`,
      }
    ]
  },
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function InlineSectionAI({ type, note, onApply }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activeAction, setActiveAction] = useState(null);

  const config = SECTION_CONFIGS[type];
  if (!config) return null;

  const generateWithAction = async (action) => {
    setActiveAction(action);
    setLoading(true);
    setResult(null);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: action.prompt(note),
        response_json_schema: {
          type: "object",
          properties: { result: { type: "string" } },
        },
      });
      setResult(response.result);
    } catch (error) {
      toast.error("AI generation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (!result && config.actions.length > 0) {
      generateWithAction(config.actions[0]);
    }
  };

  const handleApply = () => {
    if (result && onApply) {
      onApply(result);
      setIsOpen(false);
      setResult(null);
      setActiveAction(null);
      toast.success("Applied to section");
    }
  };

  const handleAppend = () => {
    if (result && onApply) {
      const current = note[type] || note.plan || "";
      onApply((current ? current + "\n\n" : "") + result);
      setIsOpen(false);
      setResult(null);
      setActiveAction(null);
      toast.success("Appended to section");
    }
  };

  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={handleOpen}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/20 hover:bg-white/35 text-white transition-all border border-white/30 text-xs font-medium"
        title={config.label}
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>AI</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-11 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden"
            >
              {/* Header */}
              <div className={`bg-gradient-to-r ${config.color} px-4 py-3 flex items-center justify-between`}>
                <div className="flex items-center gap-2 text-white">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm font-semibold">{config.label}</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white">
                   <XCircle className="w-4 h-4" />
                </button>
              </div>

              {/* Action Tabs */}
              {config.actions.length > 1 && (
                <div className="flex gap-1 p-2 bg-slate-50 border-b border-slate-200">
                  {config.actions.map(action => (
                    <button
                      key={action.id}
                      onClick={() => generateWithAction(action)}
                      disabled={loading}
                      className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        activeAction?.id === action.id
                          ? "bg-white shadow-sm text-slate-900 border border-slate-200"
                          : "text-slate-500 hover:text-slate-700 hover:bg-white/70"
                      }`}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Content */}
              <div className="p-4">
                {loading && (
                  <div className="flex items-center gap-3 py-8 justify-center text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                    <span className="text-sm">Generating with AI...</span>
                  </div>
                )}

                {result && !loading && (
                  <>
                    <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-700 max-h-56 overflow-y-auto leading-relaxed border border-slate-200 mb-3 whitespace-pre-wrap">
                      {result}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleApply}
                        className={`flex-1 bg-gradient-to-r ${config.color} text-white gap-1.5`}
                      >
                        <Check className="w-3.5 h-3.5" /> Replace
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleAppend}
                        className="gap-1.5 border-slate-300"
                      >
                        + Append
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => generateWithAction(activeAction || config.actions[0])}
                        className="px-2"
                        title="Regenerate"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}