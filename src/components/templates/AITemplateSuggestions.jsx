import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Lightbulb, TrendingUp, Plus, Check, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function AITemplateSuggestions({ template, usageData, open, onClose, onApplySuggestion }) {
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [appliedSuggestions, setAppliedSuggestions] = useState([]);

  useEffect(() => {
    if (open && template) {
      generateSuggestions();
    }
  }, [open, template]);

  const generateSuggestions = async () => {
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this clinical note template and usage data to suggest improvements.

Template: ${template.name}
Category: ${template.category}
Specialty: ${template.specialty || "General"}
Note Type: ${template.note_type}
Current Sections: ${template.sections?.map(s => s.name).join(", ")}
Usage Count: ${template.usage_count || 0}
Usage Data: ${JSON.stringify(usageData || {})}

Based on best practices in clinical documentation and the template's specialty, suggest:
1. Missing sections that would improve documentation quality
2. Optimizations to existing section instructions for better AI extraction
3. Conditional logic opportunities to make the template more dynamic
4. Sections that could be merged or split for better organization

Provide 3-5 actionable suggestions with clear rationale.`,
        response_json_schema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    enum: ["add_section", "optimize_instructions", "add_conditional", "reorganize"]
                  },
                  title: { type: "string" },
                  description: { type: "string" },
                  rationale: { type: "string" },
                  impact: {
                    type: "string",
                    enum: ["high", "medium", "low"]
                  },
                  implementation: {
                    type: "object",
                    properties: {
                      section_name: { type: "string" },
                      section_description: { type: "string" },
                      ai_instructions: { type: "string" }
                    }
                  }
                }
              }
            }
          }
        }
      });

      setSuggestions(result.suggestions);
    } catch (error) {
      console.error("Failed to generate suggestions:", error);
      toast.error("Failed to generate AI suggestions");
    } finally {
      setLoading(false);
    }
  };

  const handleApplySuggestion = async (suggestion, index) => {
    try {
      await onApplySuggestion(suggestion);
      setAppliedSuggestions([...appliedSuggestions, index]);
      toast.success("Suggestion applied successfully");
    } catch (error) {
      toast.error("Failed to apply suggestion");
    }
  };

  const impactColors = {
    high: "bg-red-100 text-red-700",
    medium: "bg-amber-100 text-amber-700",
    low: "bg-blue-100 text-blue-700"
  };

  const typeIcons = {
    add_section: Plus,
    optimize_instructions: TrendingUp,
    add_conditional: Lightbulb,
    reorganize: Sparkles
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI-Powered Template Suggestions
          </DialogTitle>
          <DialogDescription>
            Intelligent recommendations to improve "{template?.name}" based on usage and best practices
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto pr-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin mb-3" />
              <p className="text-sm text-slate-600">Analyzing template and generating suggestions...</p>
            </div>
          ) : suggestions?.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No suggestions available at this time</p>
            </div>
          ) : (
            suggestions?.map((suggestion, index) => {
              const Icon = typeIcons[suggestion.type] || Lightbulb;
              const isApplied = appliedSuggestions.includes(index);

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 border border-slate-200 rounded-lg hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-slate-900">{suggestion.title}</h4>
                          <Badge className={impactColors[suggestion.impact]}>
                            {suggestion.impact} impact
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 mb-2">{suggestion.description}</p>
                        
                        {/* Rationale */}
                        <div className="p-3 bg-slate-50 rounded border border-slate-200 mb-3">
                          <p className="text-xs text-slate-600">
                            <strong>Why:</strong> {suggestion.rationale}
                          </p>
                        </div>

                        {/* Implementation Details */}
                        {suggestion.implementation && (
                          <div className="p-3 bg-purple-50 rounded border border-purple-200">
                            <p className="text-xs font-semibold text-purple-900 mb-1">Implementation:</p>
                            {suggestion.implementation.section_name && (
                              <p className="text-xs text-purple-700">
                                <strong>Section:</strong> {suggestion.implementation.section_name}
                              </p>
                            )}
                            {suggestion.implementation.section_description && (
                              <p className="text-xs text-purple-700 mt-1">
                                <strong>Description:</strong> {suggestion.implementation.section_description}
                              </p>
                            )}
                            {suggestion.implementation.ai_instructions && (
                              <p className="text-xs text-purple-700 mt-1">
                                <strong>AI Instructions:</strong> {suggestion.implementation.ai_instructions}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleApplySuggestion(suggestion, index)}
                      disabled={isApplied}
                      className={isApplied ? "bg-green-600" : "bg-purple-600 hover:bg-purple-700"}
                    >
                      {isApplied ? (
                        <>
                          <Check className="w-3 h-3 mr-1" /> Applied
                        </>
                      ) : (
                        <>
                          <Plus className="w-3 h-3 mr-1" /> Apply
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {suggestions?.length > 0 && (
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
            <Button onClick={generateSuggestions} variant="outline" className="gap-2">
              <Sparkles className="w-4 h-4" /> Regenerate
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}