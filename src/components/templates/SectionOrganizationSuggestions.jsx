import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, GitBranch, ArrowUp, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SectionOrganizationSuggestions({ sections, noteType, specialty, onApplyOrdering, trigger }) {
  const [open, setOpen] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState(null);

  const analyzeSectionOrganization = async () => {
    setAnalyzing(true);

    try {
      const sectionList = sections.map(s => s.name).join(", ");
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze the clinical workflow and suggest optimal ordering and grouping for these note sections:

Sections: ${sectionList}
Note Type: ${noteType || "General"}
Specialty: ${specialty || "General"}

Provide:
1. Suggested ordering (primary flow) - list sections in recommended order
2. Logical groupings - group related sections together
3. Rationale for each group
4. Any sections that could be combined or separated

Format the response to be clear and actionable for clinical workflow.`,
        response_json_schema: {
          type: "object",
          properties: {
            ordered_sections: { 
              type: "array", 
              items: { type: "string" },
              description: "Sections in recommended order"
            },
            groupings: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  group_name: { type: "string" },
                  sections: { type: "array", items: { type: "string" } },
                  rationale: { type: "string" }
                }
              }
            },
            overall_rationale: { type: "string" },
            recommendations: { type: "array", items: { type: "string" } }
          }
        }
      });

      setSuggestions(result);
    } catch (error) {
      console.error("Failed to analyze organization:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  const applyOrdering = () => {
    if (suggestions?.ordered_sections) {
      const newOrder = suggestions.ordered_sections.map((name, idx) => ({
        name,
        order: idx
      }));
      onApplyOrdering(newOrder);
      setOpen(false);
    }
  };

  return (
    <>
      {trigger && trigger({ onClick: () => setOpen(true) })}
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-green-600" />
              Section Organization Suggestions
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Analyze your section structure to optimize clinical workflow for <strong>{noteType || "General"}</strong> notes{specialty && ` in ${specialty}`}.
            </p>

            <Button
              onClick={analyzeSectionOrganization}
              disabled={analyzing || sections.length === 0}
              className="w-full gap-2 bg-green-600 hover:bg-green-700"
            >
              {analyzing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
              ) : (
                <><GitBranch className="w-4 h-4" /> Analyze Organization</>
              )}
            </Button>

            {suggestions && (
              <div className="space-y-6 mt-6 pt-6 border-t border-slate-200">
                {/* Suggested Ordering */}
                <div>
                  <p className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <ArrowUp className="w-4 h-4 text-blue-600" />
                    Suggested Section Order
                  </p>
                  <div className="space-y-2">
                    {suggestions.ordered_sections?.map((section, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <Badge variant="default" className="bg-blue-600 min-w-fit">{idx + 1}</Badge>
                        <span className="text-sm font-medium text-slate-900">{section}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Groupings */}
                {suggestions.groupings && suggestions.groupings.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-slate-900 mb-3">Suggested Groupings</p>
                    <div className="space-y-3">
                      {suggestions.groupings.map((group, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                          <p className="font-semibold text-slate-900 text-sm mb-2">{group.group_name}</p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {group.sections?.map((section, i) => (
                              <Badge key={i} variant="outline" className="bg-white">
                                {section}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-xs text-slate-600">{group.rationale}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Overall Rationale */}
                {suggestions.overall_rationale && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-green-900 mb-2">Rationale</p>
                    <p className="text-sm text-green-800">{suggestions.overall_rationale}</p>
                  </div>
                )}

                {/* Recommendations */}
                {suggestions.recommendations && suggestions.recommendations.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-slate-900 mb-2">Recommendations</p>
                    <ul className="space-y-2">
                      {suggestions.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                          <span className="text-amber-600 mt-0.5">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Button
                  onClick={applyOrdering}
                  className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
                >
                  <Check className="w-4 h-4" /> Apply This Order
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}