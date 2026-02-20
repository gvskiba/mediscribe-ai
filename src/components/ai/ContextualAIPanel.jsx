import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Check, ChevronDown, ChevronUp, AlertCircle, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// ── Context definitions per tab ───────────────────────────────────────────────
const TAB_CONTEXTS = {
  patient_intake: {
    label: "Subjective",
    color: "blue",
    actions: [
      {
        id: "extract_hpi",
        label: "Extract HPI",
        desc: "Structure raw notes into OLDCARTS HPI",
        run: async (note) => {
          if (!note.raw_note && !note.chief_complaint) throw new Error("Add raw notes or chief complaint first");
          const res = await base44.integrations.Core.InvokeLLM({
            prompt: `Extract a detailed, structured History of Present Illness (HPI) using the OLDCARTS framework from the following clinical data. Be thorough and use formal clinical language.\n\nChief Complaint: ${note.chief_complaint || "N/A"}\nRaw Notes: ${note.raw_note || "N/A"}`,
            response_json_schema: { type: "object", properties: { hpi: { type: "string" } } }
          });
          return { field: "history_of_present_illness", value: res.hpi, label: "HPI generated" };
        }
      },
      {
        id: "refine_cc",
        label: "Refine Chief Complaint",
        desc: "Rewrite CC in standard clinical format",
        run: async (note) => {
          if (!note.chief_complaint && !note.raw_note) throw new Error("Add a chief complaint first");
          const res = await base44.integrations.Core.InvokeLLM({
            prompt: `Rewrite this chief complaint in concise, standard clinical format (1 sentence, symptom + duration):\n\n"${note.chief_complaint || note.raw_note}"`,
            response_json_schema: { type: "object", properties: { chief_complaint: { type: "string" } } }
          });
          return { field: "chief_complaint", value: res.chief_complaint, label: "Chief complaint refined" };
        }
      },
      {
        id: "suggest_pmh",
        label: "Suggest Medical History",
        desc: "Infer likely PMH from presentation",
        run: async (note) => {
          const res = await base44.integrations.Core.InvokeLLM({
            prompt: `Based on this clinical presentation, suggest relevant past medical history items to inquire about:\n\nChief Complaint: ${note.chief_complaint || "N/A"}\nHPI: ${note.history_of_present_illness || "N/A"}`,
            response_json_schema: { type: "object", properties: { medical_history: { type: "string" } } }
          });
          return { field: "medical_history", value: res.medical_history, label: "Medical history suggested" };
        }
      }
    ]
  },
  review_of_systems: {
    label: "ROS",
    color: "teal",
    actions: [
      {
        id: "gen_ros",
        label: "Generate Full ROS",
        desc: "AI generates all 13 systems from context",
        aiTab: "ros"
      },
      {
        id: "pertinent_ros",
        label: "Pertinent Positives/Negatives",
        desc: "Highlight key findings relevant to diagnosis",
        run: async (note) => {
          if (!note.chief_complaint) throw new Error("Add chief complaint first");
          const res = await base44.integrations.Core.InvokeLLM({
            prompt: `Based on this presentation, list the most clinically relevant pertinent positives and pertinent negatives for the ROS:\n\nChief Complaint: ${note.chief_complaint}\nHPI: ${note.history_of_present_illness || "N/A"}\nDiagnoses: ${(note.diagnoses || []).join(", ") || "N/A"}`,
            response_json_schema: { type: "object", properties: { pertinent_ros: { type: "string" } } }
          });
          return { field: "review_of_systems", value: res.pertinent_ros, label: "Pertinent ROS added", append: true };
        }
      }
    ]
  },
  physical_exam: {
    label: "Physical Exam",
    color: "emerald",
    actions: [
      {
        id: "gen_pe",
        label: "Generate Physical Exam",
        desc: "AI drafts exam findings from clinical context",
        run: async (note) => {
          const res = await base44.integrations.Core.InvokeLLM({
            prompt: `Generate a structured physical exam documentation based on this clinical presentation. Include expected findings consistent with the diagnosis.\n\nChief Complaint: ${note.chief_complaint || "N/A"}\nDiagnoses: ${(note.diagnoses || []).join(", ") || "N/A"}\nVitals: ${JSON.stringify(note.vital_signs || {})}`,
            response_json_schema: { type: "object", properties: { physical_exam: { type: "string" } } }
          });
          return { field: "physical_exam", value: res.physical_exam, label: "Physical exam generated" };
        }
      },
      {
        id: "abnormal_findings",
        label: "Highlight Abnormal Findings",
        desc: "Summarize all abnormal exam findings",
        run: async (note) => {
          if (!note.physical_exam) throw new Error("Add physical exam data first");
          const res = await base44.integrations.Core.InvokeLLM({
            prompt: `Review this physical exam and produce a concise summary of ALL abnormal findings, organized by system:\n\n${note.physical_exam}`,
            response_json_schema: { type: "object", properties: { abnormal_summary: { type: "string" } } }
          });
          return { field: "clinical_impression", value: res.abnormal_summary, label: "Abnormal findings summarized" };
        }
      }
    ]
  },
  differential: {
    label: "Differential Dx",
    color: "rose",
    actions: [
      {
        id: "gen_differential",
        label: "Generate Differentials",
        desc: "Rank diagnoses by likelihood from presentation",
        aiTab: "diagnosis"
      },
      {
        id: "refine_assessment",
        label: "Refine Assessment",
        desc: "AI rewrites assessment with clinical reasoning",
        run: async (note) => {
          if (!note.chief_complaint && !note.assessment) throw new Error("Add chief complaint or assessment first");
          const res = await base44.integrations.Core.InvokeLLM({
            prompt: `Rewrite and refine the clinical assessment with structured reasoning. Include primary impression, key supporting findings, and relevant differentials.\n\nChief Complaint: ${note.chief_complaint || "N/A"}\nHPI: ${note.history_of_present_illness || "N/A"}\nCurrent Assessment: ${note.assessment || "None"}\nPhysical Exam: ${note.physical_exam || "N/A"}\nVitals: ${JSON.stringify(note.vital_signs || {})}`,
            response_json_schema: { type: "object", properties: { assessment: { type: "string" } } }
          });
          return { field: "assessment", value: res.assessment, label: "Assessment refined" };
        }
      },
      {
        id: "red_flags",
        label: "Check Red Flags",
        desc: "Identify critical findings requiring urgent action",
        run: async (note) => {
          const res = await base44.integrations.Core.InvokeLLM({
            prompt: `Identify any clinical red flags, critical findings, or safety concerns in this note that require urgent attention:\n\nChief Complaint: ${note.chief_complaint || "N/A"}\nVitals: ${JSON.stringify(note.vital_signs || {})}\nAssessment: ${note.assessment || "N/A"}\nDiagnoses: ${(note.diagnoses || []).join(", ") || "N/A"}`,
            response_json_schema: { type: "object", properties: { red_flags: { type: "array", items: { type: "string" } }, summary: { type: "string" } } }
          });
          const text = res.red_flags?.length
            ? `\n\n⚠️ RED FLAGS:\n${res.red_flags.map(f => `• ${f}`).join("\n")}`
            : "\n\n✅ No critical red flags identified";
          return { field: "assessment", value: (note.assessment || "") + text, label: "Red flags checked", raw: true };
        }
      }
    ]
  },
  labs_imaging: {
    label: "Labs & Imaging",
    color: "cyan",
    actions: [
      {
        id: "suggest_labs",
        label: "Suggest Labs",
        desc: "Evidence-based lab workup for current diagnoses",
        run: async (note) => {
          if (!note.diagnoses?.length && !note.chief_complaint) throw new Error("Add diagnoses or chief complaint first");
          const res = await base44.integrations.Core.InvokeLLM({
            prompt: `Suggest evidence-based laboratory workup for:\nChief Complaint: ${note.chief_complaint || "N/A"}\nDiagnoses: ${(note.diagnoses || []).join(", ") || "N/A"}\nAssessment: ${note.assessment || "N/A"}`,
            add_context_from_internet: true,
            response_json_schema: { type: "object", properties: { labs: { type: "array", items: { type: "object", properties: { test: { type: "string" }, indication: { type: "string" }, urgency: { type: "string" } } } } } }
          });
          const text = `\n\nSUGGESTED LABS:\n${(res.labs || []).map(l => `• ${l.test} — ${l.indication} (${l.urgency})`).join("\n")}`;
          return { field: "plan", value: (note.plan || "") + text, label: "Lab suggestions added" };
        }
      },
      {
        id: "interpret_labs",
        label: "Interpret Lab Findings",
        desc: "Clinical interpretation of documented lab results",
        run: async (note) => {
          if (!note.lab_findings?.length) throw new Error("No lab findings to interpret");
          const res = await base44.integrations.Core.InvokeLLM({
            prompt: `Provide a clinical interpretation of these lab findings in the context of the patient's presentation:\n\nLab Findings: ${JSON.stringify(note.lab_findings)}\nDiagnoses: ${(note.diagnoses || []).join(", ") || "N/A"}`,
            response_json_schema: { type: "object", properties: { interpretation: { type: "string" } } }
          });
          return { field: "assessment", value: (note.assessment || "") + `\n\nLAB INTERPRETATION:\n${res.interpretation}`, label: "Lab interpretation added" };
        }
      }
    ]
  },
  mdm: {
    label: "MDM",
    color: "rose",
    actions: [
      {
        id: "gen_mdm",
        label: "Generate MDM",
        desc: "Document medical decision-making complexity",
        aiTab: "mdm"
      },
      {
        id: "complexity_score",
        label: "Score Complexity",
        desc: "Assess E&M visit complexity level",
        run: async (note) => {
          const res = await base44.integrations.Core.InvokeLLM({
            prompt: `Evaluate the E&M MDM complexity level (Straightforward, Low, Moderate, High) for this visit:\n\nDiagnoses: ${(note.diagnoses || []).join(", ") || "N/A"}\nData Reviewed: ${note.lab_findings?.length > 0 ? "Labs" : "None"}, ${note.imaging_findings?.length > 0 ? "Imaging" : ""}\nPlan: ${note.plan || "N/A"}\n\nProvide: complexity level, rationale, and supporting documentation tips.`,
            response_json_schema: { type: "object", properties: { level: { type: "string" }, rationale: { type: "string" }, tips: { type: "array", items: { type: "string" } } } }
          });
          const text = `MDM COMPLEXITY: ${res.level}\n\n${res.rationale}\n\nDocumentation Tips:\n${(res.tips || []).map(t => `• ${t}`).join("\n")}`;
          return { field: "mdm", value: (note.mdm || "") + `\n\n${text}`, label: "Complexity scored" };
        }
      }
    ]
  },
  treatment_plan: {
    label: "Treatment Plan",
    color: "amber",
    actions: [
      {
        id: "gen_plan",
        label: "Generate Treatment Plan",
        desc: "Evidence-based plan from diagnoses",
        aiTab: "treatment"
      },
      {
        id: "followup_plan",
        label: "Follow-up & Monitoring",
        desc: "Suggest follow-up intervals and monitoring parameters",
        run: async (note) => {
          const res = await base44.integrations.Core.InvokeLLM({
            prompt: `Generate a follow-up and monitoring plan:\n\nDiagnoses: ${(note.diagnoses || []).join(", ") || "N/A"}\nMedications: ${(note.medications || []).join(", ") || "None"}\nPlan: ${note.plan || "N/A"}`,
            add_context_from_internet: true,
            response_json_schema: { type: "object", properties: { follow_up: { type: "string" }, monitoring: { type: "array", items: { type: "string" } }, red_flags: { type: "array", items: { type: "string" } } } }
          });
          const text = `\n\nFOLLOW-UP: ${res.follow_up}\n\nMONITORING:\n${(res.monitoring || []).map(m => `• ${m}`).join("\n")}\n\nRETURN PRECAUTIONS:\n${(res.red_flags || []).map(r => `• ${r}`).join("\n")}`;
          return { field: "plan", value: (note.plan || "") + text, label: "Follow-up plan added" };
        }
      },
      {
        id: "patient_instructions",
        label: "Patient Instructions",
        desc: "Write plain-language patient instructions",
        run: async (note) => {
          const res = await base44.integrations.Core.InvokeLLM({
            prompt: `Write clear, simple patient discharge instructions in plain language (6th grade reading level):\n\nDiagnoses: ${(note.diagnoses || []).join(", ") || "N/A"}\nMedications: ${(note.medications || []).join(", ") || "None"}\nPlan: ${note.plan || "N/A"}`,
            response_json_schema: { type: "object", properties: { instructions: { type: "string" } } }
          });
          return { field: "discharge_summary", value: res.instructions, label: "Patient instructions generated" };
        }
      }
    ]
  },
  medications: {
    label: "Medications",
    color: "blue",
    actions: [
      {
        id: "drug_interactions",
        label: "Check Drug Interactions",
        desc: "Screen current medications for interactions",
        run: async (note) => {
          if (!note.medications?.length || note.medications.length < 2) throw new Error("Need at least 2 medications to check interactions");
          const res = await base44.integrations.Core.InvokeLLM({
            prompt: `Perform a thorough drug interaction analysis for:\n${note.medications.join("\n")}\n\nList all clinically significant interactions with severity and management recommendations.`,
            add_context_from_internet: true,
            response_json_schema: { type: "object", properties: { interactions: { type: "array", items: { type: "object", properties: { drug_pair: { type: "string" }, severity: { type: "string" }, mechanism: { type: "string" }, recommendation: { type: "string" } } } }, summary: { type: "string" } } }
          });
          const text = res.interactions?.length
            ? `\n\n💊 DRUG INTERACTIONS:\n${res.interactions.map(i => `• ${i.drug_pair} [${i.severity.toUpperCase()}] — ${i.recommendation}`).join("\n")}`
            : "\n\n✅ No significant drug interactions identified";
          return { field: "plan", value: (note.plan || "") + text, label: "Interactions checked", raw: true };
        }
      },
      {
        id: "alternatives",
        label: "Suggest Alternatives",
        desc: "Find alternative medications for allergy/intolerance",
        run: async (note) => {
          if (!note.medications?.length) throw new Error("No medications to find alternatives for");
          const res = await base44.integrations.Core.InvokeLLM({
            prompt: `Suggest evidence-based alternative medications for the current medications, considering patient allergies:\n\nCurrent Medications: ${note.medications.join(", ")}\nAllergies: ${(note.allergies || []).join(", ") || "None"}\nDiagnoses: ${(note.diagnoses || []).join(", ") || "N/A"}`,
            add_context_from_internet: true,
            response_json_schema: { type: "object", properties: { alternatives: { type: "array", items: { type: "object", properties: { original: { type: "string" }, alternative: { type: "string" }, rationale: { type: "string" } } } } } }
          });
          const text = (res.alternatives || []).map(a => `• ${a.original} → ${a.alternative}: ${a.rationale}`).join("\n");
          return { field: "plan", value: (note.plan || "") + `\n\nMEDICATION ALTERNATIVES:\n${text}`, label: "Alternatives suggested" };
        }
      },
      {
        id: "allergy_check",
        label: "Allergy Safety Check",
        desc: "Verify medications against known allergies",
        run: async (note) => {
          if (!note.allergies?.length) throw new Error("No allergies documented to check against");
          const res = await base44.integrations.Core.InvokeLLM({
            prompt: `Check if any current medications are contraindicated given these allergies:\n\nMedications: ${(note.medications || []).join(", ") || "None"}\nAllergies: ${note.allergies.join(", ")}`,
            response_json_schema: { type: "object", properties: { conflicts: { type: "array", items: { type: "string" } }, safe: { type: "boolean" }, recommendation: { type: "string" } } }
          });
          const text = res.safe
            ? "\n\n✅ ALLERGY CHECK: No conflicts detected"
            : `\n\n⚠️ ALLERGY CONFLICTS:\n${(res.conflicts || []).map(c => `• ${c}`).join("\n")}\n${res.recommendation}`;
          return { field: "plan", value: (note.plan || "") + text, label: "Allergy check complete", raw: true };
        }
      }
    ]
  },
  diagnoses: {
    label: "Diagnoses",
    color: "purple",
    actions: [
      {
        id: "suggest_icd10",
        label: "Suggest ICD-10 Codes",
        desc: "Map current diagnoses to ICD-10",
        aiTab: "icd10"
      },
      {
        id: "refine_diagnoses",
        label: "Refine Diagnoses",
        desc: "Improve specificity and coding accuracy",
        run: async (note) => {
          if (!note.diagnoses?.length) throw new Error("No diagnoses to refine");
          const res = await base44.integrations.Core.InvokeLLM({
            prompt: `Review these diagnoses and suggest more specific, properly coded ICD-10 versions:\n\n${note.diagnoses.join("\n")}\n\nAssessment context: ${note.assessment || "N/A"}`,
            add_context_from_internet: true,
            response_json_schema: { type: "object", properties: { refined: { type: "array", items: { type: "string" } } } }
          });
          return { field: "diagnoses", value: res.refined, label: "Diagnoses refined", replaceArray: true };
        }
      }
    ]
  },
  disposition_plan: {
    label: "Disposition",
    color: "purple",
    actions: [
      {
        id: "disposition_rec",
        label: "Recommend Disposition",
        desc: "AI recommends appropriate care setting",
        run: async (note) => {
          const res = await base44.integrations.Core.InvokeLLM({
            prompt: `Based on this clinical presentation, recommend the most appropriate patient disposition (discharge, admission, observation, transfer) with rationale:\n\nDiagnoses: ${(note.diagnoses || []).join(", ") || "N/A"}\nVitals: ${JSON.stringify(note.vital_signs || {})}\nAssessment: ${note.assessment || "N/A"}\nPlan: ${note.plan || "N/A"}`,
            add_context_from_internet: true,
            response_json_schema: { type: "object", properties: { disposition: { type: "string" }, rationale: { type: "string" }, criteria_met: { type: "array", items: { type: "string" } } } }
          });
          const text = `DISPOSITION RECOMMENDATION: ${res.disposition}\n\nRationale: ${res.rationale}\n\nCriteria Met:\n${(res.criteria_met || []).map(c => `• ${c}`).join("\n")}`;
          return { field: "disposition_plan", value: text, label: "Disposition recommended" };
        }
      }
    ]
  },
  finalize: {
    label: "Review & Export",
    color: "indigo",
    actions: [
      {
        id: "full_analysis",
        label: "Run Full Analysis",
        desc: "Comprehensive note quality check",
        aiTab: "analyze"
      },
      {
        id: "gen_summary",
        label: "Generate Summary",
        desc: "Create a concise clinical summary",
        aiTab: "summarize"
      }
    ]
  }
};

// ── Single Action Button ──────────────────────────────────────────────────────
function ActionButton({ action, note, onUpdateNote, onSwitchTab, color }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const colorMap = {
    blue: "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200",
    teal: "bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-200",
    emerald: "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200",
    rose: "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200",
    purple: "bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200",
    amber: "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200",
    cyan: "bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border-cyan-200",
    indigo: "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200",
  };

  const handleClick = async () => {
    if (action.aiTab) { onSwitchTab(action.aiTab); return; }
    setLoading(true);
    try {
      const result = await action.run(note);
      if (result.replaceArray) {
        await onUpdateNote({ [result.field]: result.value });
      } else if (result.raw) {
        await onUpdateNote({ [result.field]: result.value });
      } else if (result.append) {
        await onUpdateNote({ [result.field]: (note[result.field] || "") + "\n\n" + result.value });
      } else {
        await onUpdateNote({ [result.field]: result.value });
      }
      setDone(true);
      toast.success(result.label);
      setTimeout(() => setDone(false), 3000);
    } catch (err) {
      toast.error(err.message || "Action failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all text-xs ${colorMap[color] || colorMap.blue} ${loading || done ? "opacity-80" : ""}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold leading-tight truncate">{action.label}</p>
          <p className="opacity-70 mt-0.5 leading-tight text-[10px]">{action.desc}</p>
        </div>
        <div className="flex-shrink-0">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
           done ? <Check className="w-3.5 h-3.5 text-emerald-500" /> :
           action.aiTab ? <Zap className="w-3.5 h-3.5 opacity-50" /> :
           <Sparkles className="w-3.5 h-3.5 opacity-50" />}
        </div>
      </div>
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ContextualAIPanel({ activeNoteTab, note, onUpdateNote, onSwitchAITab }) {
  const [expanded, setExpanded] = useState(true);
  const ctx = TAB_CONTEXTS[activeNoteTab];
  if (!ctx) return null;

  const colorHeader = {
    blue: "from-blue-600 to-blue-700",
    teal: "from-teal-600 to-teal-700",
    emerald: "from-emerald-600 to-emerald-700",
    rose: "from-rose-600 to-rose-700",
    purple: "from-purple-600 to-purple-700",
    amber: "from-amber-600 to-amber-700",
    cyan: "from-cyan-600 to-cyan-700",
    indigo: "from-indigo-600 to-indigo-700",
  };

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm mb-4">
      <button
        onClick={() => setExpanded(v => !v)}
        className={`w-full flex items-center justify-between px-4 py-2.5 bg-gradient-to-r ${colorHeader[ctx.color] || colorHeader.blue} text-white`}
      >
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5" />
          <span className="text-xs font-bold uppercase tracking-wide">Context Actions — {ctx.label}</span>
          <Badge className="bg-white/20 text-white border-0 text-xs px-1.5 py-0">{ctx.actions.length}</Badge>
        </div>
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 grid gap-1.5 bg-white">
              {ctx.actions.map(action => (
                <ActionButton
                  key={action.id}
                  action={action}
                  note={note}
                  onUpdateNote={onUpdateNote}
                  onSwitchTab={onSwitchAITab}
                  color={ctx.color}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}