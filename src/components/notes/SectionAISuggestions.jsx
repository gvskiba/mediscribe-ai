import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, X, Check, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function SectionAISuggestions({ 
  field, 
  currentValue, 
  context = {}, 
  onApplySuggestion 
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  const generateSuggestions = useCallback(async () => {
    if (!currentValue || currentValue === "Not extracted") return;
    
    setLoading(true);
    try {
      const { base44 } = await import("@/api/base44Client");
      let prompt = "";
      let responseSchema = {};

      if (field === "history_of_present_illness") {
        prompt = `Based on this History of Present Illness, suggest 3-5 most likely differential diagnoses with brief clinical reasoning:

HPI: ${currentValue}
Patient Context: ${JSON.stringify(context)}

For each diagnosis, provide:
- Name of condition
- Probability (Very High, High, Moderate, Low)
- Key clinical features supporting this diagnosis`;
        responseSchema = {
          type: "object",
          properties: {
            differentials: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  probability: { type: "string" },
                  reasoning: { type: "string" }
                }
              }
            }
          }
        };
      } else if (field === "assessment") {
        prompt = `Based on this assessment, recommend the most relevant ICD-10 diagnostic codes:

Assessment: ${currentValue}
Current Diagnoses: ${context.diagnoses?.join(", ") || "None yet"}

For each code, provide:
- ICD-10 code
- Diagnosis name
- Confidence level (high, moderate, low)
- Brief rationale`;
        responseSchema = {
          type: "object",
          properties: {
            codes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  code: { type: "string" },
                  diagnosis: { type: "string" },
                  confidence: { type: "string" },
                  rationale: { type: "string" }
                }
              }
            }
          }
        };
      } else if (field === "plan") {
        prompt = `Based on this treatment plan draft, suggest standard plan elements that might be missing or could improve the plan:

Current Plan: ${currentValue}
Assessment: ${context.assessment || ""}
Diagnoses: ${context.diagnoses?.join(", ") || ""}

Suggest 2-4 standard plan elements including:
- Imaging or labs needed
- Follow-up timing and triggers
- Patient education points
- Monitoring parameters`;
        responseSchema = {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  suggestion: { type: "string" },
                  rationale: { type: "string" }
                }
              }
            }
          }
        };
      }

      if (!prompt) return;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: responseSchema,
        add_context_from_internet: field === "history_of_present_illness"
      });

      const suggestionData = result.differentials || result.codes || result.suggestions || [];
      setSuggestions(suggestionData);
      setDismissed(false);
    } catch (error) {
      console.error("Failed to generate suggestions:", error);
      toast.error("Failed to generate suggestions");
    } finally {
      setLoading(false);
    }
  }, [field, currentValue, context]);

  const handleApply = (suggestion) => {
    onApplySuggestion(field, suggestion);
    setSuggestions(prev => prev.filter(s => s !== suggestion));
    toast.success("Suggestion applied");
  };

  const handleDismiss = (suggestion) => {
    setSuggestions(prev => prev.filter(s => s !== suggestion));
  };

  if (dismissed || !suggestions.length) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="pt-3 border-t border-slate-200"
      >
        <Button
          size="sm"
          variant="outline"
          onClick={generateSuggestions}
          disabled={loading}
          className="gap-2 text-blue-600 border-blue-300 hover:bg-blue-50"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          Get AI Suggestions
        </Button>
      </motion.div>
    );
  }

  const getSuggestionDisplay = () => {
    if (field === "history_of_present_illness") {
      return {
        title: "Suggested Differentials",
        icon: "🔍"
      };
    } else if (field === "assessment") {
      return {
        title: "Suggested ICD-10 Codes",
        icon: "📋"
      };
    } else if (field === "plan") {
      return {
        title: "Suggested Plan Elements",
        icon: "📝"
      };
    }
    return { title: "AI Suggestions", icon: "✨" };
  };

  const display = getSuggestionDisplay();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="pt-3 border-t border-slate-200"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 mb-3 hover:opacity-70 transition-opacity"
      >
        <span className="text-lg">{display.icon}</span>
        <span className="text-sm font-semibold text-slate-700">{display.title}</span>
        <Badge variant="outline" className="text-xs">{suggestions.length}</Badge>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ml-auto ${expanded ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-2"
          >
            {suggestions.map((suggestion, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {suggestion.name ? (
                      <>
                        <p className="text-sm font-semibold text-slate-900">{suggestion.name}</p>
                        <p className="text-xs text-slate-600 mt-1">{suggestion.reasoning || suggestion.rationale}</p>
                        {suggestion.probability && (
                          <Badge className="mt-2 bg-blue-100 text-blue-800 border-blue-300">
                            {suggestion.probability}
                          </Badge>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-slate-900">
                          {suggestion.code || suggestion.category}
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          {suggestion.diagnosis || suggestion.suggestion}
                        </p>
                        {suggestion.rationale && (
                          <p className="text-xs text-slate-500 mt-2 italic">{suggestion.rationale}</p>
                        )}
                        {suggestion.confidence && (
                          <Badge className="mt-2 bg-blue-100 text-blue-800 border-blue-300">
                            {suggestion.confidence}
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    onClick={() => handleApply(suggestion)}
                    className="flex-1 h-7 text-xs gap-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <Check className="w-3 h-3" /> Apply
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDismiss(suggestion)}
                    className="h-7 w-7 p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        size="sm"
        variant="ghost"
        onClick={() => setDismissed(true)}
        className="w-full mt-2 text-xs text-slate-500 hover:text-slate-700"
      >
        Dismiss all
      </Button>
    </motion.div>
  );
}