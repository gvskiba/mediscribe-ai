import React, { useState } from "react";
import { Sparkles, Loader2, Plus, Check, Calendar, FlaskConical, Scan, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const typeConfig = {
  appointment: { icon: Calendar, color: "bg-blue-100 text-blue-700 border-blue-200", dot: "bg-blue-500" },
  lab: { icon: FlaskConical, color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  imaging: { icon: Scan, color: "bg-purple-100 text-purple-700 border-purple-200", dot: "bg-purple-500" },
  referral: { icon: User, color: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-500" },
};

export default function FollowUpSuggestions({ note, onAddToNote }) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [added, setAdded] = useState(new Set());

  const generate = async () => {
    if (!note?.diagnoses?.length && !note?.plan) {
      toast.error("Add diagnoses or a plan first");
      return;
    }
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on the following clinical information, suggest specific, actionable follow-up items.

DIAGNOSES: ${note.diagnoses?.join(", ") || "N/A"}
PLAN: ${note.plan || "N/A"}
MEDICATIONS: ${note.medications?.join(", ") || "None"}
ASSESSMENT: ${note.assessment || "N/A"}

Generate 4-8 specific follow-up suggestions. For each, specify:
- type: "appointment", "lab", "imaging", or "referral"
- title: brief name (e.g., "Follow-up with PCP in 2 weeks", "HbA1c in 3 months", "Chest X-ray", "Cardiology referral")
- rationale: one sentence explaining why
- timing: when it should happen (e.g., "2 weeks", "3 months", "ASAP")`,
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
                  timing: { type: "string" }
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

  const handleAdd = async (suggestion, idx) => {
    if (added.has(idx)) return;
    const text = `${suggestion.title} (${suggestion.timing})`;
    if (onAddToNote) {
      await onAddToNote(text);
    }
    setAdded(prev => new Set([...prev, idx]));
    toast.success("Added to note");
  };

  const handleAddAll = async () => {
    if (!suggestions?.length) return;
    const items = suggestions
      .filter((_, i) => !added.has(i))
      .map(s => `${s.title} (${s.timing})`);
    if (onAddToNote && items.length > 0) {
      await onAddToNote(items.join("\n"));
      setAdded(new Set(suggestions.map((_, i) => i)));
      toast.success(`Added ${items.length} follow-up items`);
    }
  };

  return (
    <div className="space-y-3">
      {!suggestions ? (
        <div>
          <p className="text-xs text-slate-500 mb-2">AI will analyze diagnoses and plan to suggest specific appointments, labs, imaging, and referrals.</p>
          <Button
            size="sm"
            onClick={generate}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 text-xs h-7 px-3"
          >
            {loading ? <><Loader2 className="w-3 h-3 animate-spin" />Generating...</> : <><Sparkles className="w-3 h-3" />Suggest Follow-ups</>}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-600">{suggestions.length} follow-up suggestions</p>
            {suggestions.some((_, i) => !added.has(i)) && (
              <Button size="sm" variant="outline" onClick={handleAddAll} className="h-6 px-2 text-xs gap-1">
                <Plus className="w-3 h-3" /> Add All to Note
              </Button>
            )}
          </div>

          {suggestions.map((s, i) => {
            const config = typeConfig[s.type] || typeConfig.appointment;
            const Icon = config.icon;
            const isAdded = added.has(i);
            return (
              <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-100 bg-white hover:border-slate-200 transition-all">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${config.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-slate-800">{s.title}</span>
                    <Badge className={`text-xs px-1.5 py-0 h-4 border ${config.color}`}>
                      <Icon className="w-2.5 h-2.5 mr-1" />{s.type}
                    </Badge>
                    <span className="text-xs text-slate-400">{s.timing}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{s.rationale}</p>
                </div>
                <button
                  onClick={() => handleAdd(s, i)}
                  disabled={isAdded}
                  className={`flex-shrink-0 p-1 rounded-md transition-all ${isAdded ? "text-emerald-600 bg-emerald-50" : "text-slate-400 hover:text-blue-600 hover:bg-blue-50"}`}
                  title={isAdded ? "Added" : "Add to note"}
                >
                  {isAdded ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                </button>
              </div>
            );
          })}

          <Button size="sm" variant="ghost" onClick={() => { setSuggestions(null); setAdded(new Set()); }} className="h-6 px-2 text-xs text-slate-400 hover:text-slate-600">
            Regenerate
          </Button>
        </div>
      )}
    </div>
  );
}