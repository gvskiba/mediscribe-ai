import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CheckCircle2, X, Lightbulb, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function TemplateSuggestion({ 
  rawNote, 
  noteType, 
  specialty, 
  chiefComplaint,
  templates, 
  currentTemplateId,
  onSelectTemplate,
  onDismiss 
}) {
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Only analyze if we have enough context and haven't dismissed
    if (!dismissed && (rawNote || chiefComplaint) && templates.length > 0 && !loading) {
      const timeoutId = setTimeout(() => {
        analyzeSuggestTemplates();
      }, 1000); // Debounce to avoid excessive API calls
      
      return () => clearTimeout(timeoutId);
    }
  }, [rawNote, noteType, specialty, chiefComplaint, dismissed]);

  const analyzeSuggestTemplates = async () => {
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze the following clinical note context and suggest the most appropriate note template(s):

Raw Note Preview: ${rawNote?.substring(0, 500) || "N/A"}
Chief Complaint: ${chiefComplaint || "N/A"}
Note Type: ${noteType || "N/A"}
Specialty: ${specialty || "N/A"}

Available Templates:
${templates.map(t => `
- ID: ${t.id}
  Name: ${t.name || "Untitled"}
  Type: ${t.note_type || "N/A"}
  Specialty: ${t.specialty || "General"}
  Category: ${t.category || "general"}
  Description: ${t.description || "N/A"}
  Sections: ${Array.isArray(t.sections) ? t.sections.map(s => s.name || "Unnamed").join(", ") : "N/A"}
`).join("\n")}

Based on the clinical context, recommend:
1. The best matching template (by ID) and why it's the best fit
2. Alternative template options (up to 2)
3. Specific sections from the recommended template that will be most useful
4. Any pre-filled content suggestions based on the specialty/note type patterns

If no template is a perfect match, identify which combination of templates would work best.`,
        response_json_schema: {
          type: "object",
          properties: {
            recommended_template_id: { type: "string" },
            recommendation_reason: { type: "string" },
            confidence: { type: "string", enum: ["high", "medium", "low"] },
            alternative_templates: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  template_id: { type: "string" },
                  reason: { type: "string" }
                }
              }
            },
            useful_sections: { type: "array", items: { type: "string" } },
            prefill_suggestions: {
              type: "object",
              properties: {
                history_tips: { type: "string" },
                exam_focus: { type: "string" },
                assessment_guidance: { type: "string" }
              }
            }
          }
        }
      });

      setSuggestions(result);
    } catch (error) {
      console.error("Failed to suggest templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) onDismiss();
  };

  const handleSelectTemplate = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      toast.success(`Template "${template.name}" applied`);
      onSelectTemplate(templateId);
      setDismissed(true);
    }
  };

  if (dismissed || !suggestions || loading) {
    return null;
  }

  const recommendedTemplate = templates.find(t => t.id === suggestions.recommended_template_id);
  
  // Don't show if no valid recommendation or already selected
  if (!recommendedTemplate || currentTemplateId === suggestions.recommended_template_id) {
    return null;
  }

  const confidenceColors = {
    high: "bg-green-100 text-green-800 border-green-300",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
    low: "bg-orange-100 text-orange-800 border-orange-300"
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border-2 border-purple-300 shadow-lg overflow-hidden mb-6"
      >
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  AI Template Suggestion
                  <Badge className={`${confidenceColors[suggestions.confidence]} border`}>
                    {suggestions.confidence} confidence
                  </Badge>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Based on your note context</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="h-8 w-8 rounded-lg hover:bg-slate-100"
            >
              <X className="w-4 h-4 text-slate-400" />
            </Button>
          </div>

          {/* Recommended Template */}
          <div className="bg-white rounded-lg border-2 border-purple-300 p-4 mb-3">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-purple-600" />
                  <h4 className="text-base font-semibold text-slate-900">{recommendedTemplate.name}</h4>
                </div>
                <p className="text-sm text-slate-600 mb-2">{suggestions.recommendation_reason}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">
                    {recommendedTemplate.note_type?.replace(/_/g, " ")}
                  </Badge>
                  {recommendedTemplate.specialty && (
                    <Badge variant="outline" className="text-xs">
                      {recommendedTemplate.specialty}
                    </Badge>
                  )}
                  {recommendedTemplate.category && (
                    <Badge variant="outline" className="text-xs">
                      {recommendedTemplate.category}
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                onClick={() => handleSelectTemplate(suggestions.recommended_template_id)}
                className="bg-purple-600 hover:bg-purple-700 gap-2 flex-shrink-0 ml-3"
              >
                Use Template <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Useful Sections */}
            {suggestions.useful_sections && suggestions.useful_sections.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-200">
                <p className="text-xs font-semibold text-slate-700 mb-2">Key Sections in This Template:</p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.useful_sections.map((section, idx) => (
                    <Badge key={idx} className="bg-purple-100 text-purple-800 text-xs">
                      {section}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Pre-fill Suggestions */}
          {suggestions.prefill_suggestions && (
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-blue-600" />
                <h4 className="text-sm font-semibold text-slate-900">Documentation Tips for {specialty || noteType}</h4>
              </div>
              <div className="space-y-2 text-xs text-slate-700">
                {suggestions.prefill_suggestions.history_tips && (
                  <p><strong>History Focus:</strong> {suggestions.prefill_suggestions.history_tips}</p>
                )}
                {suggestions.prefill_suggestions.exam_focus && (
                  <p><strong>Exam Focus:</strong> {suggestions.prefill_suggestions.exam_focus}</p>
                )}
                {suggestions.prefill_suggestions.assessment_guidance && (
                  <p><strong>Assessment Guidance:</strong> {suggestions.prefill_suggestions.assessment_guidance}</p>
                )}
              </div>
            </div>
          )}

          {/* Alternative Templates */}
          {suggestions.alternative_templates && suggestions.alternative_templates.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-700">Alternative Options:</p>
              {suggestions.alternative_templates.map((alt, idx) => {
                const altTemplate = templates.find(t => t.id === alt.template_id);
                if (!altTemplate) return null;
                return (
                  <div key={idx} className="bg-white rounded-lg border border-slate-200 p-3 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{altTemplate.name}</p>
                      <p className="text-xs text-slate-600">{alt.reason}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectTemplate(alt.template_id)}
                      className="flex-shrink-0 ml-3"
                    >
                      Use
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}