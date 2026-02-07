import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TrendingUp, AlertCircle, CheckCircle, Lightbulb, Loader2, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

export default function TemplateAnalytics({ template, open, onClose }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);

  useEffect(() => {
    if (open && template) {
      analyzeTemplate();
    }
  }, [open, template]);

  const analyzeTemplate = async () => {
    setLoading(true);
    try {
      // Fetch all notes
      const allNotes = await base44.entities.ClinicalNote.list();
      
      // Filter notes that might use this template based on note_type
      const relevantNotes = allNotes.filter(note => note.note_type === template.note_type);
      
      // Analyze section usage
      const sectionAnalysis = template.sections.map(section => {
        const sectionKey = section.name.toLowerCase().replace(/\s+/g, '_');
        let filledCount = 0;
        let emptyCount = 0;
        
        relevantNotes.forEach(note => {
          const value = note[sectionKey];
          if (value && value.trim() && value !== "Not documented in this encounter.") {
            filledCount++;
          } else {
            emptyCount++;
          }
        });

        const totalNotes = relevantNotes.length;
        const fillRate = totalNotes > 0 ? (filledCount / totalNotes) * 100 : 0;

        return {
          name: section.name,
          filled: filledCount,
          empty: emptyCount,
          fillRate: fillRate.toFixed(1),
          status: fillRate > 70 ? "high" : fillRate > 40 ? "medium" : "low"
        };
      });

      // Generate AI suggestions
      const aiSuggestions = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a clinical documentation optimization expert. Analyze this template usage data and provide actionable recommendations.

Template: ${template.name} (${template.note_type})
Total relevant notes: ${relevantNotes.length}

Section Usage Analysis:
${sectionAnalysis.map(s => `- ${s.name}: ${s.fillRate}% fill rate (${s.filled} filled, ${s.empty} empty)`).join('\n')}

Template Sections:
${template.sections.map(s => `- ${s.name}: ${s.description || "No description"}`).join('\n')}

Provide:
1. overall_assessment - Brief assessment of template effectiveness (2-3 sentences)
2. optimization_suggestions - Array of specific, actionable improvements (3-5 items)
3. sections_to_remove - Array of section names that are underutilized and could be removed
4. sections_to_add - Array of {name, description} for potentially missing sections
5. ai_instruction_improvements - Suggestions for better AI instructions`,
        response_json_schema: {
          type: "object",
          properties: {
            overall_assessment: { type: "string" },
            optimization_suggestions: {
              type: "array",
              items: { type: "string" }
            },
            sections_to_remove: {
              type: "array",
              items: { type: "string" }
            },
            sections_to_add: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" }
                }
              }
            },
            ai_instruction_improvements: { type: "string" }
          }
        }
      });

      setAnalytics({
        totalNotes: relevantNotes.length,
        sectionAnalysis,
      });
      setSuggestions(aiSuggestions);
    } catch (error) {
      console.error("Failed to analyze template:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Template Analytics: {template.name}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-slate-600">Analyzing template usage...</span>
          </div>
        ) : analytics ? (
          <div className="space-y-6 mt-4">
            {/* Usage Stats */}
            <Card className="p-4 bg-blue-50 border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-slate-900">Usage Statistics</h3>
              </div>
              <p className="text-sm text-slate-600">
                This template structure has been used in <strong>{analytics.totalNotes}</strong> clinical notes.
              </p>
            </Card>

            {/* AI Assessment */}
            {suggestions?.overall_assessment && (
              <Card className="p-4 bg-purple-50 border-purple-100">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-purple-600" />
                  <h3 className="font-semibold text-slate-900">AI Assessment</h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {suggestions.overall_assessment}
                </p>
              </Card>
            )}

            {/* Section Analysis */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Section Fill Rates</h3>
              <div className="space-y-2">
                {analytics.sectionAnalysis.map((section, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white rounded-lg border border-slate-200 p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-slate-900">{section.name}</span>
                      <Badge variant="outline" className={
                        section.status === "high" ? "bg-green-50 text-green-700 border-green-200" :
                        section.status === "medium" ? "bg-amber-50 text-amber-700 border-amber-200" :
                        "bg-red-50 text-red-700 border-red-200"
                      }>
                        {section.fillRate}% filled
                      </Badge>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          section.status === "high" ? "bg-green-500" :
                          section.status === "medium" ? "bg-amber-500" :
                          "bg-red-500"
                        }`}
                        style={{ width: `${section.fillRate}%` }}
                      />
                    </div>
                    <div className="flex gap-4 mt-2 text-xs text-slate-500">
                      <span>✓ {section.filled} filled</span>
                      <span>∅ {section.empty} empty</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Optimization Suggestions */}
            {suggestions?.optimization_suggestions?.length > 0 && (
              <Card className="p-4 border-emerald-100 bg-emerald-50">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-semibold text-slate-900">Optimization Suggestions</h3>
                </div>
                <ul className="space-y-2">
                  {suggestions.optimization_suggestions.map((suggestion, idx) => (
                    <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                      <span className="text-emerald-600 mt-0.5">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Sections to Remove */}
            {suggestions?.sections_to_remove?.length > 0 && (
              <Card className="p-4 border-red-100 bg-red-50">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <h3 className="font-semibold text-slate-900">Underutilized Sections</h3>
                </div>
                <p className="text-sm text-slate-600 mb-2">Consider removing these rarely-used sections:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.sections_to_remove.map((section, idx) => (
                    <Badge key={idx} variant="outline" className="bg-white text-red-700 border-red-200">
                      {section}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}

            {/* Sections to Add */}
            {suggestions?.sections_to_add?.length > 0 && (
              <Card className="p-4 border-blue-100 bg-blue-50">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-blue-600" />
                  <h3 className="font-semibold text-slate-900">Recommended Sections to Add</h3>
                </div>
                <div className="space-y-2">
                  {suggestions.sections_to_add.map((section, idx) => (
                    <div key={idx} className="bg-white rounded-lg p-3 border border-blue-100">
                      <div className="font-medium text-slate-900 text-sm">{section.name}</div>
                      <div className="text-xs text-slate-600 mt-1">{section.description}</div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* AI Instructions Improvement */}
            {suggestions?.ai_instruction_improvements && (
              <Card className="p-4 border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-slate-600" />
                  <h3 className="font-semibold text-slate-900">AI Instructions Recommendations</h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {suggestions.ai_instruction_improvements}
                </p>
              </Card>
            )}

            <div className="flex justify-end pt-4">
              <Button onClick={onClose} className="rounded-lg">
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}