import React, { useState } from "react";
import { Sparkles, X, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";

const SECTION_CONFIGS = {
  chief_complaint: {
    label: "Suggest Chief Complaint",
    prompt: (note) => `Based on the following raw patient data, extract and write a concise chief complaint in 1-2 sentences:
RAW DATA: ${note.raw_note || "No raw data available"}
Chief complaint only, no extra formatting.`,
  },
  hpi: {
    label: "Generate HPI",
    prompt: (note) => `Write a comprehensive History of Present Illness (HPI) using the OLDCARTS framework based on:
Chief Complaint: ${note.chief_complaint || "N/A"}
Raw Notes: ${note.raw_note || "N/A"}
Write a detailed, professional HPI narrative only.`,
  },
  medical_history: {
    label: "Extract Medical History",
    prompt: (note) => `Extract and organize past medical history from this clinical data:
Raw Notes: ${note.raw_note || "N/A"}
Chief Complaint: ${note.chief_complaint || "N/A"}
List relevant past medical history, surgeries, and chronic conditions as a clean text summary.`,
  },
  review_of_systems: {
    label: "Generate ROS",
    prompt: (note) => `Generate a systematic Review of Systems based on:
Chief Complaint: ${note.chief_complaint || "N/A"}
HPI: ${note.history_of_present_illness || "N/A"}
Raw Notes: ${note.raw_note || "N/A"}
Write a comprehensive system-based ROS in narrative format.`,
  },
  physical_exam: {
    label: "Suggest Exam Findings",
    prompt: (note) => `Based on this clinical presentation, write expected physical examination findings to document:
Chief Complaint: ${note.chief_complaint || "N/A"}
HPI: ${note.history_of_present_illness || "N/A"}
Diagnoses: ${note.diagnoses?.join(", ") || "N/A"}
Write structured physical exam findings in clinical narrative format.`,
  },
  plan: {
    label: "Generate Treatment Plan",
    prompt: (note) => `Generate a comprehensive, evidence-based treatment plan based on:
Chief Complaint: ${note.chief_complaint || "N/A"}
Diagnoses: ${note.diagnoses?.join(", ") || "N/A"}
Medications: ${note.medications?.join(", ") || "N/A"}
Assessment: ${note.assessment || "N/A"}
Write a detailed, structured treatment plan.`,
  },
  assessment: {
    label: "Generate Assessment",
    prompt: (note) => `Write a concise clinical assessment based on:
Chief Complaint: ${note.chief_complaint || "N/A"}
HPI: ${note.history_of_present_illness || "N/A"}
Physical Exam: ${note.physical_exam || "N/A"}
Diagnoses: ${note.diagnoses?.join(", ") || "N/A"}
Write a professional clinical assessment narrative.`,
  },
};

export default function InlineSectionAI({ type, note, onApply }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const config = SECTION_CONFIGS[type];
  if (!config) return null;

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: config.prompt(note),
        response_json_schema: {
          type: "object",
          properties: { result: { type: "string" } },
        },
      });
      setResult(response.result);
    } catch (error) {
      console.error("AI generation failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (!result) handleGenerate();
  };

  const handleApply = () => {
    if (result && onApply) {
      onApply(result);
      setIsOpen(false);
      setResult(null);
    }
  };

  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={handleOpen}
        className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/20 hover:bg-white/35 text-white transition-all shadow-inner border border-white/30"
        title={config.label}
      >
        <Sparkles className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-white">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm font-semibold">{config.label}</span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4">
                {loading && (
                  <div className="flex items-center gap-3 py-6 justify-center text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                    <span className="text-sm">Generating suggestion...</span>
                  </div>
                )}

                {result && !loading && (
                  <>
                    <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-700 max-h-52 overflow-y-auto leading-relaxed border border-slate-200 mb-3 whitespace-pre-wrap">
                      {result}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleApply}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" /> Apply
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleGenerate}
                        className="gap-1.5 border-slate-300"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Retry
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