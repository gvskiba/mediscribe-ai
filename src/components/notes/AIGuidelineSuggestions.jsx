import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Sparkles, Loader2, Plus, ChevronDown, ChevronUp,
  CheckCircle2, AlertCircle, ExternalLink, RefreshCw, FileText
} from "lucide-react";
import { toast } from "sonner";

export default function AIGuidelineSuggestions({ note, onAddToPlan }) {
  const [loading, setLoading] = useState(false);
  const [guidelines, setGuidelines] = useState([]);
  const [expandedIdx, setExpandedIdx] = useState(null);
  const [addedIds, setAddedIds] = useState(new Set());

  const hasClinicalContext = note?.diagnoses?.length > 0 || note?.chief_complaint || note?.assessment;

  const fetchGuidelines = async () => {
    if (!hasClinicalContext) {
      toast.error("Add a chief complaint or diagnosis first");
      return;
    }
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a clinical guideline expert. Based on the patient's diagnoses and clinical context, provide the most relevant, actionable evidence-based clinical guidelines.

PATIENT CONTEXT:
Chief Complaint: ${note.chief_complaint || "N/A"}
Diagnoses: ${note.diagnoses?.join(", ") || "N/A"}
Assessment: ${note.assessment || "N/A"}
Medications: ${note.medications?.join(", ") || "N/A"}

For each relevant guideline, provide:
1. condition: The specific condition this guideline addresses
2. organization: The issuing body (e.g., AHA, ACC, IDSA, ADA, AAFP)
3. year: Year of publication or last update
4. summary: 2-3 sentence overview of the guideline
5. key_recommendations: Array of 3-5 specific, actionable recommendations (no citations or reference numbers, just clean text)
6. plan_snippet: A ready-to-paste text block for the Plan section (clean, formatted, professional)
7. urgency: "high", "moderate", or "routine"
8. url: URL to the guideline if known

Return 3-5 of the most clinically relevant guidelines.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            guidelines: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  condition: { type: "string" },
                  organization: { type: "string" },
                  year: { type: "string" },
                  summary: { type: "string" },
                  key_recommendations: { type: "array", items: { type: "string" } },
                  plan_snippet: { type: "string" },
                  urgency: { type: "string", enum: ["high", "moderate", "routine"] },
                  url: { type: "string" }
                }
              }
            }
          }
        }
      });
      setGuidelines(result.guidelines || []);
      if ((result.guidelines || []).length === 0) {
        toast.info("No specific guidelines found for this presentation");
      } else {
        toast.success(`Found ${result.guidelines.length} relevant guidelines`);
      }
    } catch (err) {
      toast.error("Failed to fetch guidelines");
    } finally {
      setLoading(false);
    }
  };

  const addToPlan = async (guideline, idx) => {
    const text = `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nGUIDELINE: ${guideline.organization} (${guideline.year}) — ${guideline.condition}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${guideline.plan_snippet || guideline.summary}\n`;
    await onAddToPlan(text);
    setAddedIds(prev => new Set([...prev, idx]));
    toast.success("Guideline added to Plan");
  };

  const urgencyStyles = {
    high: { badge: "bg-red-100 text-red-700 border-red-200", bar: "bg-red-500" },
    moderate: { badge: "bg-amber-100 text-amber-700 border-amber-200", bar: "bg-amber-500" },
    routine: { badge: "bg-slate-100 text-slate-600 border-slate-200", bar: "bg-slate-400" },
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-emerald-200 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              AI Clinical Guidelines
            </h3>
            <p className="text-emerald-100 text-sm mt-1">Evidence-based recommendations matched to this patient's diagnoses</p>
          </div>
          <Button
            onClick={fetchGuidelines}
            disabled={loading || !hasClinicalContext}
            size="sm"
            className="bg-white/20 hover:bg-white/30 text-white border border-white/30 gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {guidelines.length ? "Refresh" : "Get Guidelines"}
          </Button>
        </div>
      </div>

      {/* Empty / loading states */}
      {!loading && guidelines.length === 0 && (
        <div className="p-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-emerald-400" />
          </div>
          <p className="font-medium text-slate-700 mb-1">No guidelines loaded yet</p>
          <p className="text-sm text-slate-500 max-w-xs mx-auto">
            {hasClinicalContext
              ? 'Click "Get Guidelines" to fetch AI-matched evidence-based guidelines for this patient.'
              : "Add a chief complaint or diagnosis first to get guideline suggestions."}
          </p>
        </div>
      )}

      {loading && (
        <div className="p-10 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mx-auto mb-3" />
          <p className="text-sm text-slate-600">Searching evidence-based guidelines...</p>
        </div>
      )}

      {/* Guidelines List */}
      {!loading && guidelines.length > 0 && (
        <div className="divide-y divide-slate-100">
          {guidelines.map((g, idx) => {
            const isOpen = expandedIdx === idx;
            const isAdded = addedIds.has(idx);
            const styles = urgencyStyles[g.urgency] || urgencyStyles.routine;

            return (
              <div key={idx} className="group">
                {/* Row header */}
                <button
                  onClick={() => setExpandedIdx(isOpen ? null : idx)}
                  className="w-full flex items-start gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className={`w-1 rounded-full flex-shrink-0 self-stretch ${styles.bar} opacity-70`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-slate-900 text-sm">{g.condition}</span>
                      <Badge className={`text-xs border ${styles.badge}`}>{g.urgency}</Badge>
                      <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs">
                        {g.organization} {g.year}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2">{g.summary}</p>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-2 pt-0.5">
                    {isAdded && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>

                {/* Expanded content */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 space-y-4">
                        {/* Key Recommendations */}
                        {g.key_recommendations?.length > 0 && (
                          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                              <Sparkles className="w-3 h-3" /> Key Recommendations
                            </p>
                            <ul className="space-y-1.5">
                              {g.key_recommendations.map((rec, i) => (
                                <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                                  <span className="text-emerald-500 font-bold mt-0.5 flex-shrink-0">•</span>
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Plan Snippet Preview */}
                        {g.plan_snippet && (
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                            <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                              <FileText className="w-3 h-3" /> Plan Snippet Preview
                            </p>
                            <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                              {g.plan_snippet}
                            </pre>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            size="sm"
                            onClick={() => addToPlan(g, idx)}
                            disabled={isAdded}
                            className={`gap-1.5 ${isAdded ? "bg-emerald-100 text-emerald-700" : "bg-emerald-600 hover:bg-emerald-700 text-white"}`}
                          >
                            {isAdded ? (
                              <><CheckCircle2 className="w-3.5 h-3.5" /> Added to Plan</>
                            ) : (
                              <><Plus className="w-3.5 h-3.5" /> Add to Plan</>
                            )}
                          </Button>
                          {g.url && (
                            <a
                              href={g.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-all"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> View Guideline
                            </a>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* Bulk add footer */}
      {guidelines.length > 1 && (
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50">
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              let combined = "";
              guidelines.forEach(g => {
                combined += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nGUIDELINE: ${g.organization} (${g.year}) — ${g.condition}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${g.plan_snippet || g.summary}\n`;
              });
              await onAddToPlan(combined);
              setAddedIds(new Set(guidelines.map((_, i) => i)));
              toast.success("All guidelines added to Plan");
            }}
            className="gap-1.5 text-emerald-700 border-emerald-300 hover:bg-emerald-50 w-full"
          >
            <Plus className="w-4 h-4" /> Add All Guidelines to Plan
          </Button>
        </div>
      )}
    </div>
  );
}