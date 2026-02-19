import React from "react";
import { Button } from "@/components/ui/button";
import {
  Sparkles, X, FileText, Activity, Code, Pill, BookOpen, AlertCircle, Brain, Beaker, Stethoscope, ClipboardList
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AIDocumentationAssistant from "./AIDocumentationAssistant";
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
    panels: ["documentation", "extract"],
  },
  hpi: {
    title: "HPI AI Assistant",
    subtitle: "Generate & refine history of present illness",
    gradient: "from-purple-600 to-indigo-600",
    icon: FileText,
    panels: ["documentation", "analysis"],
  },
  review_of_systems: {
    title: "Review of Systems AI",
    subtitle: "AI-generated system-based symptom review",
    gradient: "from-purple-600 to-indigo-600",
    icon: ClipboardList,
    panels: ["documentation"],
  },
  physical_exam: {
    title: "Physical Exam AI",
    subtitle: "AI-assisted exam documentation",
    gradient: "from-emerald-600 to-teal-600",
    icon: Stethoscope,
    panels: ["documentation"],
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
  title: "AI Assistant Hub",
  subtitle: "Intelligent clinical tools",
  gradient: "from-purple-600 to-indigo-600",
  icon: Sparkles,
  panels: ["documentation", "analysis", "diagnosis", "treatment", "guidelines", "mdm"],
};

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