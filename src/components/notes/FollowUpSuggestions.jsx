import React, { useState, useEffect } from "react";
import { Sparkles, Loader2, Plus, Check, Calendar, FlaskConical, Scan, User, ClipboardList, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const typeConfig = {
  appointment: { icon: Calendar, color: "bg-blue-100 text-blue-700 border-blue-200", dot: "bg-blue-500", label: "Appointment" },
  lab: { icon: FlaskConical, color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", label: "Lab Order" },
  imaging: { icon: Scan, color: "bg-purple-100 text-purple-700 border-purple-200", dot: "bg-purple-500", label: "Imaging" },
  referral: { icon: User, color: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-500", label: "Referral" },
};

const urgencyConfig = {
  asap: "bg-red-100 text-red-700 border-red-200",
  soon: "bg-orange-100 text-orange-700 border-orange-200",
  routine: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function FollowUpSuggestions({ note, onAddToNote, autoGenerate = false }) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [addedToPlan, setAddedToPlan] = useState(new Set());
  const [addedToTask, setAddedToTask] = useState(new Set());

  // Auto-generate when note has diagnoses
  useEffect(() => {
    if (autoGenerate && note?.diagnoses?.length > 0 && !suggestions && !loading) {
      generate();
    }
  }, [note?.diagnoses?.length, autoGenerate]);

  const generate = async () => {
    if (!note?.diagnoses?.length && !note?.plan) {
      toast.error("Add diagnoses or a plan first");
      return;
    }
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a clinical decision support AI. Based on this patient's clinical data, generate specific, evidence-based follow-up recommendations.

DIAGNOSES: ${note.diagnoses?.join(", ") || "N/A"}
CURRENT PLAN: ${note.plan || "N/A"}
MEDICATIONS: ${note.medications?.join(", ") || "None"}
ASSESSMENT: ${note.assessment || "N/A"}
CHIEF COMPLAINT: ${note.chief_complaint || "N/A"}

Generate 5-8 highly specific follow-up items. Each must be immediately actionable. Include a mix of:
- Specific lab orders with exact test names (e.g., "HbA1c", "Basic Metabolic Panel", "Lipid Panel", "TSH")
- Specific imaging with modality and body part (e.g., "Chest X-ray PA/Lateral", "Echocardiogram", "Renal Ultrasound")  
- Follow-up appointments with specialty and timeframe (e.g., "PCP follow-up in 2 weeks", "Cardiology consultation")
- Specialist referrals with specific reason (e.g., "Nephrology referral for CKD management")

For each item, assign urgency: "asap" (within 48h), "soon" (within 2 weeks), or "routine" (1-3 months).`,
        response_json_schema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["appointment", "lab", "imaging", "referral"] },
                  title: { type: "string" },
                  rationale: { type: "string" },
                  timing: { type: "string" },
                  urgency: { type: "string", enum: ["asap", "soon", "routine"] },
                  order_text: { type: "string" }
                }
              }
            }
          }
        }
      });
      setSuggestions(result.suggestions || []);
    } catch {
      toast.error("Failed to generate follow-up suggestions");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToPlan = async (suggestion, idx) => {
    if (addedToPlan.has(idx)) return;
    const text = `\n• ${suggestion.title} (${suggestion.timing}) — ${suggestion.rationale}`;
    if (onAddToNote) {
      await onAddToNote(text);
    }
    setAddedToPlan(prev => new Set([...prev, idx]));
    toast.success("Added to plan");
  };

  const handleAddAllToPlan = async () => {
    if (!suggestions?.length) return;
    const pending = suggestions.filter((_, i) => !addedToPlan.has(i));
    if (!pending.length) return;
    const text = pending.map(s => `• ${s.title} (${s.timing}) — ${s.rationale}`).join("\n");
    if (onAddToNote) {
      await onAddToNote("\n" + text);
      setAddedToPlan(new Set(suggestions.map((_, i) => i)));
      toast.success(`Added ${pending.length} items to plan`);
    }
  };

  const handleCopyOrder = (suggestion, idx) => {
    const orderText = suggestion.order_text || suggestion.title;
    navigator.clipboard.writeText(orderText);
    setAddedToTask(prev => new Set([...prev, idx]));
    toast.success("Copied to clipboard");
    setTimeout(() => {
      setAddedToTask(prev => { const s = new Set(prev); s.delete(idx); return s; });
    }, 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-3 text-xs text-slate-500">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
        Generating follow-up recommendations...
      </div>
    );
  }

  if (!suggestions) {
    return (
      <div>
        <p className="text-xs text-slate-500 mb-2.5">AI analyzes diagnoses and plan to suggest specific appointments, labs, imaging, and referrals.</p>
        <Button
          size="sm"
          onClick={generate}
          className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 text-xs h-7 px-3"
        >
          <Sparkles className="w-3 h-3" /> Suggest Follow-ups
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-medium text-slate-600">{suggestions.length} recommendations</p>
        <div className="flex items-center gap-1.5">
          {suggestions.some((_, i) => !addedToPlan.has(i)) && (
            <Button size="sm" variant="outline" onClick={handleAddAllToPlan} className="h-6 px-2 text-xs gap-1 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
              <Plus className="w-3 h-3" /> Add All to Plan
            </Button>
          )}
          <button onClick={() => { setSuggestions(null); setAddedToPlan(new Set()); }} className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors" title="Regenerate">
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {suggestions.map((s, i) => {
        const config = typeConfig[s.type] || typeConfig.appointment;
        const Icon = config.icon;
        const isAddedToPlan = addedToPlan.has(i);
        const isCopied = addedToTask.has(i);
        const urgencyCls = urgencyConfig[s.urgency] || urgencyConfig.routine;

        return (
          <div key={i} className={`rounded-xl border bg-white transition-all ${isAddedToPlan ? "border-emerald-200 bg-emerald-50/30" : "border-slate-100 hover:border-slate-200"}`}>
            <div className="flex items-start gap-2.5 p-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${config.color.split(" ").slice(0,1).join(" ").replace("bg-", "bg-").replace("-100", "-100")}`} style={{ background: 'inherit' }}>
                <Icon className={`w-4 h-4 ${config.color.split(" ")[1]}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                  <span className={`text-xs font-bold ${isAddedToPlan ? "text-emerald-700" : "text-slate-800"}`}>{s.title}</span>
                  <Badge className={`text-xs px-1.5 py-0 h-4 border ${config.color}`}>{config.label}</Badge>
                  <Badge className={`text-xs px-1.5 py-0 h-4 border ${urgencyCls}`}>{s.urgency === "asap" ? "ASAP" : s.urgency === "soon" ? "Soon" : "Routine"}</Badge>
                  <span className="text-xs text-slate-400">{s.timing}</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{s.rationale}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 pb-2.5 pt-0">
              <button
                onClick={() => handleAddToPlan(s, i)}
                disabled={isAddedToPlan}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md border transition-all ${
                  isAddedToPlan
                    ? "bg-emerald-50 text-emerald-600 border-emerald-200 cursor-default"
                    : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50"
                }`}
              >
                {isAddedToPlan ? <><Check className="w-3 h-3" /> Added to Plan</> : <><ClipboardList className="w-3 h-3" /> Add to Plan</>}
              </button>
              <button
                onClick={() => handleCopyOrder(s, i)}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md border transition-all ${
                  isCopied
                    ? "bg-blue-50 text-blue-600 border-blue-200"
                    : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50"
                }`}
              >
                {isCopied ? <><Check className="w-3 h-3" /> Copied!</> : <><Plus className="w-3 h-3" /> Copy Order</>}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}