import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Loader2, CheckCircle2, Plus, ChevronDown, ChevronUp,
  Beaker, ImageIcon, ClipboardList, Zap, RefreshCw, ArrowRight, X
} from "lucide-react";
import { toast } from "sonner";

// ── Standard Lab Panels ──────────────────────────────────────────────────────
const LAB_PANELS = [
  {
    id: "bmp", label: "Basic Metabolic Panel (BMP)",
    tests: ["Sodium", "Potassium", "Chloride", "CO2", "BUN", "Creatinine", "Glucose"],
    color: "blue"
  },
  {
    id: "cmp", label: "Comprehensive Metabolic Panel (CMP)",
    tests: ["BMP components", "AST", "ALT", "Alkaline Phosphatase", "Total Bilirubin", "Total Protein", "Albumin"],
    color: "indigo"
  },
  {
    id: "cbc", label: "Complete Blood Count (CBC)",
    tests: ["WBC", "RBC", "Hemoglobin", "Hematocrit", "MCV", "Platelets", "Differential"],
    color: "emerald"
  },
  {
    id: "lipid", label: "Lipid Panel",
    tests: ["Total Cholesterol", "LDL", "HDL", "Triglycerides", "Non-HDL Cholesterol"],
    color: "amber"
  },
  {
    id: "thyroid", label: "Thyroid Panel",
    tests: ["TSH", "Free T4", "Free T3"],
    color: "purple"
  },
  {
    id: "coag", label: "Coagulation Panel",
    tests: ["PT", "INR", "PTT", "Fibrinogen"],
    color: "rose"
  },
  {
    id: "cardiac", label: "Cardiac Panel",
    tests: ["Troponin I", "BNP or NT-proBNP", "CK-MB", "Myoglobin"],
    color: "red"
  },
  {
    id: "hba1c", label: "Diabetes Panel",
    tests: ["HbA1c", "Fasting Glucose", "Fasting Insulin", "C-Peptide"],
    color: "orange"
  },
];

// ── Standard Imaging Orders ──────────────────────────────────────────────────
const IMAGING_ORDERS = [
  { id: "cxr", label: "Chest X-Ray (PA & Lateral)", modality: "X-ray", body_part: "Chest" },
  { id: "ct_head", label: "CT Head without Contrast", modality: "CT", body_part: "Head" },
  { id: "ct_chest", label: "CT Chest with/without Contrast", modality: "CT", body_part: "Chest" },
  { id: "ct_abd", label: "CT Abdomen/Pelvis with Contrast", modality: "CT", body_part: "Abdomen/Pelvis" },
  { id: "echo", label: "Echocardiogram (TTE)", modality: "Ultrasound", body_part: "Heart" },
  { id: "us_abd", label: "Ultrasound Abdomen", modality: "Ultrasound", body_part: "Abdomen" },
  { id: "mri_brain", label: "MRI Brain without Contrast", modality: "MRI", body_part: "Brain" },
  { id: "xray_lumbosacral", label: "X-Ray Lumbar Spine", modality: "X-ray", body_part: "Lumbar Spine" },
];

const colorMap = {
  blue: "bg-blue-50 border-blue-200 text-blue-800",
  indigo: "bg-indigo-50 border-indigo-200 text-indigo-800",
  emerald: "bg-emerald-50 border-emerald-200 text-emerald-800",
  amber: "bg-amber-50 border-amber-200 text-amber-800",
  purple: "bg-purple-50 border-purple-200 text-purple-800",
  rose: "bg-rose-50 border-rose-200 text-rose-800",
  red: "bg-red-50 border-red-200 text-red-800",
  orange: "bg-orange-50 border-orange-200 text-orange-800",
};

export default function ClinicalWorkflowAutomation({ note, noteId, onUpdateNote }) {
  const [loadingActions, setLoadingActions] = useState(false);
  const [suggestedActions, setSuggestedActions] = useState(null);
  const [expandedSection, setExpandedSection] = useState("actions");
  const [addedItems, setAddedItems] = useState(new Set());
  const [autoFilling, setAutoFilling] = useState(false);

  const toggle = (section) => setExpandedSection(prev => prev === section ? null : section);

  const generateFollowUpActions = async () => {
    if (!note.chief_complaint && !note.diagnoses?.length && !note.assessment) {
      toast.error("Add a chief complaint, diagnosis, or assessment first");
      return;
    }
    setLoadingActions(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a clinical decision support system. Based on the following patient note, suggest specific, actionable follow-up workflow actions.

CHIEF COMPLAINT: ${note.chief_complaint || "N/A"}
ASSESSMENT: ${note.assessment || "N/A"}
DIAGNOSES: ${note.diagnoses?.join(", ") || "N/A"}
PLAN: ${note.plan || "N/A"}
MEDICATIONS: ${note.medications?.join(", ") || "N/A"}
HPI: ${note.history_of_present_illness || "N/A"}

Provide:
1. follow_up_actions: 5-8 specific next steps (e.g., "Schedule follow-up in 2 weeks", "Refer to cardiology", "Patient education on medication adherence")
2. recommended_lab_panels: Which of these standard panels to order (use IDs): bmp, cmp, cbc, lipid, thyroid, coag, cardiac, hba1c
3. recommended_imaging: Which of these standard studies to order (use IDs): cxr, ct_head, ct_chest, ct_abd, echo, us_abd, mri_brain, xray_lumbosacral
4. pre_fill_suggestions: Key fields to auto-populate based on context (e.g., {field: "plan", value: "suggested plan text"})
5. priority_alerts: Any urgent items requiring immediate attention (max 3)`,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            follow_up_actions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  action: { type: "string" },
                  category: { type: "string", enum: ["follow_up", "referral", "education", "monitoring", "medication", "procedure"] },
                  urgency: { type: "string", enum: ["routine", "urgent", "stat"] },
                  rationale: { type: "string" }
                }
              }
            },
            recommended_lab_panels: { type: "array", items: { type: "string" } },
            recommended_imaging: { type: "array", items: { type: "string" } },
            pre_fill_suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: { type: "string" },
                  label: { type: "string" },
                  value: { type: "string" }
                }
              }
            },
            priority_alerts: { type: "array", items: { type: "string" } }
          }
        }
      });
      setSuggestedActions(result);
      setExpandedSection("actions");
    } catch (err) {
      toast.error("Failed to generate workflow suggestions");
    } finally {
      setLoadingActions(false);
    }
  };

  const applyPreFill = async (suggestion) => {
    const key = `prefill_${suggestion.field}`;
    if (addedItems.has(key)) return;
    await onUpdateNote({ [suggestion.field]: (note[suggestion.field] ? note[suggestion.field] + "\n\n" : "") + suggestion.value });
    setAddedItems(prev => new Set([...prev, key]));
    toast.success(`${suggestion.label} updated`);
  };

  const addPanelToNote = async (panel) => {
    if (addedItems.has(panel.id)) return;
    const text = `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nLAB ORDER: ${panel.label}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${panel.tests.map(t => `• ${t}`).join("\n")}\n`;
    await onUpdateNote({ plan: (note.plan || "") + text });
    setAddedItems(prev => new Set([...prev, panel.id]));
    toast.success(`${panel.label} added to plan`);
  };

  const addImagingToNote = async (study) => {
    if (addedItems.has(study.id)) return;
    const text = `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nIMAGING ORDER: ${study.label}\nModality: ${study.modality} | Body Part: ${study.body_part}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    await onUpdateNote({ plan: (note.plan || "") + text });
    setAddedItems(prev => new Set([...prev, study.id]));
    toast.success(`${study.label} added to plan`);
  };

  const addActionToNote = async (action) => {
    const key = `action_${action.action}`;
    if (addedItems.has(key)) return;
    await onUpdateNote({ plan: (note.plan || "") + `\n• ${action.action}` });
    setAddedItems(prev => new Set([...prev, key]));
    toast.success("Action added to plan");
  };

  const urgencyColor = {
    stat: "bg-red-100 text-red-700 border-red-300",
    urgent: "bg-amber-100 text-amber-700 border-amber-300",
    routine: "bg-slate-100 text-slate-600 border-slate-300",
  };

  const categoryIcon = {
    follow_up: "🔄", referral: "👨‍⚕️", education: "📖",
    monitoring: "📊", medication: "💊", procedure: "🔬"
  };

  const recommendedPanels = suggestedActions?.recommended_lab_panels
    ? LAB_PANELS.filter(p => suggestedActions.recommended_lab_panels.includes(p.id))
    : [];
  const recommendedImaging = suggestedActions?.recommended_imaging
    ? IMAGING_ORDERS.filter(i => suggestedActions.recommended_imaging.includes(i.id))
    : [];

  return (
    <div className="bg-white rounded-2xl border-2 border-violet-200 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Clinical Workflow Automation
            </h3>
            <p className="text-violet-100 text-sm mt-1">AI-powered follow-up actions, panel ordering & form pre-fill</p>
          </div>
          <Button
            onClick={generateFollowUpActions}
            disabled={loadingActions}
            className="bg-white/20 hover:bg-white/30 text-white border border-white/30 gap-2"
            size="sm"
          >
            {loadingActions ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {suggestedActions ? "Refresh" : "Analyze"}
          </Button>
        </div>
      </div>

      {/* Priority Alerts */}
      <AnimatePresence>
        {suggestedActions?.priority_alerts?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-50 border-b-2 border-red-200 px-6 py-3"
          >
            <p className="text-xs font-bold text-red-700 uppercase tracking-wide mb-2 flex items-center gap-1">
              ⚠️ Priority Alerts
            </p>
            <div className="space-y-1">
              {suggestedActions.priority_alerts.map((alert, i) => (
                <p key={i} className="text-sm text-red-800 flex items-start gap-2">
                  <span className="text-red-500 mt-0.5 flex-shrink-0">•</span>{alert}
                </p>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!suggestedActions && !loadingActions && (
        <div className="p-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-violet-500" />
          </div>
          <p className="text-slate-600 font-medium mb-1">Automate Your Clinical Workflow</p>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">Click "Analyze" to get AI-suggested follow-up actions, recommended lab panels, imaging orders, and form pre-population based on this note.</p>
        </div>
      )}

      {loadingActions && (
        <div className="p-10 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-violet-500 mx-auto mb-3" />
          <p className="text-slate-600 text-sm">Analyzing clinical context...</p>
        </div>
      )}

      {suggestedActions && !loadingActions && (
        <div className="divide-y divide-slate-100">

          {/* ── Follow-up Actions ── */}
          <div>
            <button
              onClick={() => toggle("actions")}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-violet-600" />
                <span className="font-semibold text-slate-900">Follow-up Actions</span>
                <Badge className="bg-violet-100 text-violet-700">{suggestedActions.follow_up_actions?.length || 0}</Badge>
              </div>
              {expandedSection === "actions" ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            <AnimatePresence>
              {expandedSection === "actions" && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="px-6 pb-4 space-y-2">
                    {suggestedActions.follow_up_actions?.map((action, i) => {
                      const key = `action_${action.action}`;
                      const done = addedItems.has(key);
                      return (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50 group">
                          <span className="text-lg flex-shrink-0">{categoryIcon[action.category] || "📋"}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900">{action.action}</p>
                            {action.rationale && <p className="text-xs text-slate-500 mt-0.5">{action.rationale}</p>}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge className={`text-xs border ${urgencyColor[action.urgency]}`}>{action.urgency}</Badge>
                            <button
                              onClick={() => addActionToNote(action)}
                              disabled={done}
                              className={`p-1.5 rounded-lg transition-all text-sm ${done ? "bg-emerald-100 text-emerald-600" : "bg-violet-100 text-violet-600 hover:bg-violet-200"}`}
                              title="Add to plan"
                            >
                              {done ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {suggestedActions.follow_up_actions?.length > 0 && (
                      <Button
                        size="sm"
                        onClick={async () => {
                          const actions = suggestedActions.follow_up_actions || [];
                          const text = "\n\nFOLLOW-UP ACTIONS:\n" + actions.map(a => `• [${a.urgency.toUpperCase()}] ${a.action}`).join("\n");
                          await onUpdateNote({ plan: (note.plan || "") + text });
                          setAddedItems(prev => {
                            const next = new Set(prev);
                            actions.forEach(a => next.add(`action_${a.action}`));
                            return next;
                          });
                          toast.success("All actions added to plan");
                        }}
                        className="w-full gap-2 bg-violet-600 hover:bg-violet-700 text-white mt-1"
                      >
                        <ArrowRight className="w-4 h-4" /> Add All to Plan
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Lab Panels ── */}
          <div>
            <button
              onClick={() => toggle("labs")}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Beaker className="w-5 h-5 text-teal-600" />
                <span className="font-semibold text-slate-900">Lab Panels</span>
                {recommendedPanels.length > 0 && (
                  <Badge className="bg-teal-100 text-teal-700">{recommendedPanels.length} recommended</Badge>
                )}
              </div>
              {expandedSection === "labs" ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            <AnimatePresence>
              {expandedSection === "labs" && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="px-6 pb-4">
                    {recommendedPanels.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-bold text-teal-700 uppercase tracking-wide mb-2 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> AI Recommended
                        </p>
                        <div className="grid sm:grid-cols-2 gap-2">
                          {recommendedPanels.map(panel => (
                            <PanelCard key={panel.id} panel={panel} added={addedItems.has(panel.id)} onAdd={() => addPanelToNote(panel)} />
                          ))}
                        </div>
                      </div>
                    )}
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">All Standard Panels</p>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {LAB_PANELS.filter(p => !recommendedPanels.find(r => r.id === p.id)).map(panel => (
                        <PanelCard key={panel.id} panel={panel} added={addedItems.has(panel.id)} onAdd={() => addPanelToNote(panel)} />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Imaging ── */}
          <div>
            <button
              onClick={() => toggle("imaging")}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-purple-600" />
                <span className="font-semibold text-slate-900">Imaging Orders</span>
                {recommendedImaging.length > 0 && (
                  <Badge className="bg-purple-100 text-purple-700">{recommendedImaging.length} recommended</Badge>
                )}
              </div>
              {expandedSection === "imaging" ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            <AnimatePresence>
              {expandedSection === "imaging" && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="px-6 pb-4">
                    {recommendedImaging.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-bold text-purple-700 uppercase tracking-wide mb-2 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> AI Recommended
                        </p>
                        <div className="grid sm:grid-cols-2 gap-2">
                          {recommendedImaging.map(study => (
                            <ImagingCard key={study.id} study={study} added={addedItems.has(study.id)} onAdd={() => addImagingToNote(study)} />
                          ))}
                        </div>
                      </div>
                    )}
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">All Standard Studies</p>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {IMAGING_ORDERS.filter(i => !recommendedImaging.find(r => r.id === i.id)).map(study => (
                        <ImagingCard key={study.id} study={study} added={addedItems.has(study.id)} onAdd={() => addImagingToNote(study)} />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Form Pre-fill ── */}
          {suggestedActions?.pre_fill_suggestions?.length > 0 && (
            <div>
              <button
                onClick={() => toggle("prefill")}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-slate-900">Auto-Fill Suggestions</span>
                  <Badge className="bg-blue-100 text-blue-700">{suggestedActions.pre_fill_suggestions.length}</Badge>
                </div>
                {expandedSection === "prefill" ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              <AnimatePresence>
                {expandedSection === "prefill" && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="px-6 pb-4 space-y-3">
                      {suggestedActions.pre_fill_suggestions.map((s, i) => {
                        const key = `prefill_${s.field}`;
                        const done = addedItems.has(key);
                        return (
                          <div key={i} className={`rounded-xl border-2 p-4 transition-all ${done ? "border-emerald-200 bg-emerald-50" : "border-blue-200 bg-blue-50"}`}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">{s.label || s.field}</p>
                                <p className="text-sm text-slate-700 leading-relaxed line-clamp-3">{s.value}</p>
                              </div>
                              <button
                                onClick={() => applyPreFill(s)}
                                disabled={done}
                                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${done ? "bg-emerald-200 text-emerald-700" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
                              >
                                {done ? <><CheckCircle2 className="w-3.5 h-3.5" /> Applied</> : <><Plus className="w-3.5 h-3.5" /> Apply</>}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PanelCard({ panel, added, onAdd }) {
  const colors = {
    blue: "border-blue-200 hover:border-blue-400",
    indigo: "border-indigo-200 hover:border-indigo-400",
    emerald: "border-emerald-200 hover:border-emerald-400",
    amber: "border-amber-200 hover:border-amber-400",
    purple: "border-purple-200 hover:border-purple-400",
    rose: "border-rose-200 hover:border-rose-400",
    red: "border-red-200 hover:border-red-400",
    orange: "border-orange-200 hover:border-orange-400",
  };
  return (
    <div className={`flex items-start justify-between gap-2 p-3 rounded-lg border-2 bg-white transition-all ${colors[panel.color] || "border-slate-200"}`}>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-800 leading-tight">{panel.label}</p>
        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{panel.tests.slice(0, 3).join(", ")}...</p>
      </div>
      <button
        onClick={onAdd}
        disabled={added}
        className={`flex-shrink-0 p-1.5 rounded-lg transition-all ${added ? "bg-emerald-100 text-emerald-600" : "bg-teal-100 text-teal-700 hover:bg-teal-200"}`}
      >
        {added ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
      </button>
    </div>
  );
}

function ImagingCard({ study, added, onAdd }) {
  const modalityColor = {
    "X-ray": "text-blue-600", "CT": "text-orange-600", "MRI": "text-purple-600", "Ultrasound": "text-teal-600"
  };
  return (
    <div className="flex items-start justify-between gap-2 p-3 rounded-lg border-2 border-slate-200 hover:border-purple-300 bg-white transition-all">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-800 leading-tight">{study.label}</p>
        <p className={`text-xs font-medium mt-0.5 ${modalityColor[study.modality] || "text-slate-500"}`}>{study.modality}</p>
      </div>
      <button
        onClick={onAdd}
        disabled={added}
        className={`flex-shrink-0 p-1.5 rounded-lg transition-all ${added ? "bg-emerald-100 text-emerald-600" : "bg-purple-100 text-purple-700 hover:bg-purple-200"}`}
      >
        {added ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
      </button>
    </div>
  );
}