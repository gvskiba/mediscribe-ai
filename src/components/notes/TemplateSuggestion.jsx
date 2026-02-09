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
      }, 1500); // Debounce to avoid excessive API calls
      
      return () => clearTimeout(timeoutId);
    }
  }, [rawNote, noteType, specialty, chiefComplaint, templates.length, dismissed, loading]);

  const analyzeSuggestTemplates = async () => {
    // Prevent multiple simultaneous calls
    if (loading) return;
    
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert clinical documentation AI. Analyze the note context and intelligently suggest the most appropriate template.

CLINICAL CONTEXT:
Raw Note Preview: ${rawNote?.substring(0, 600) || "N/A"}
Chief Complaint: ${chiefComplaint || "N/A"}
Note Type: ${noteType || "N/A"}
Specialty: ${specialty || "N/A"}

AVAILABLE TEMPLATES:
${templates.map(t => `
- ID: ${t.id}
  Name: ${t.name || "Untitled"}
  Type: ${t.note_type || "N/A"}
  Specialty: ${t.specialty || "General"}
  Category: ${t.category || "general"}
  Description: ${t.description || "N/A"}
  Sections: ${Array.isArray(t.sections) ? t.sections.map(s => s.name || "Unnamed").join(", ") : "N/A"}
  Usage Count: ${t.usage_count || 0}
  Last Used: ${t.last_used || "Never"}
`).join("\n")}

TASK: Analyze the note content for:
1. Clinical presentation patterns (acute vs chronic, simple vs complex)
2. Documentation requirements based on note type and specialty
3. Specific conditions or systems mentioned
4. Template usage history (prefer frequently used, successful templates)

THEN RECOMMEND:
1. The BEST matching template (by ID) with specific reasoning
2. Up to 2 alternative templates if the primary doesn't fully match
3. Key sections in the template that align with the clinical scenario
4. Specific documentation tips for this specialty/condition combination

MATCHING CRITERIA (in priority order):
- Note type and specialty alignment
- Relevant clinical sections for the condition
- Template complexity matching case complexity
- Usage frequency (proven effectiveness)

If no template is a perfect match, suggest the closest option and explain what sections to focus on or modify.`,
        response_json_schema: {
          type: "object",
          properties: {
            recommended_template_id: { type: "string" },
            recommendation_reason: { type: "string" },
            confidence: { type: "string", enum: ["high", "medium", "low"] },
            match_score: { type: "number", description: "0-100 score indicating how well template matches" },
            clinical_rationale: { type: "string", description: "Clinical reasoning for this template choice" },
            alternative_templates: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  template_id: { type: "string" },
                  reason: { type: "string" },
                  when_to_use: { type: "string", description: "Specific scenarios where this alternative is better" }
                }
              }
            },
            useful_sections: { 
              type: "array", 
              items: { type: "string" },
              description: "Key template sections relevant to this case"
            },
            sections_to_emphasize: {
              type: "array",
              items: { type: "string" },
              description: "Sections requiring extra detail for this presentation"
            },
            prefill_suggestions: {
              type: "object",
              properties: {
                history_tips: { type: "string" },
                exam_focus: { type: "string" },
                assessment_guidance: { type: "string" },
                documentation_alerts: { type: "string", description: "Important documentation requirements" }
              }
            }
          }
        }
      });

      setSuggestions(result);
    } catch (error) {
      console.error("Failed to suggest templates:", error);
      // Clear loading state on error
      setSuggestions(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) onDismiss();
  };

  const handleSelectTemplate = (templateId) => {
    if (!templateId) return;
    
    const template = templates.find(t => t.id === templateId);
    if (template) {
      toast.success(`Template "${template.name}" applied`);
      onSelectTemplate(templateId);
      setDismissed(true);
    }
  };

  // Don't show if dismissed or still loading
  if (dismissed || loading) {
    return null;
  }

  // Don't show if no suggestions yet
  if (!suggestions || !suggestions.recommended_template_id) {
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

            {/* Clinical Rationale */}
            {suggestions.clinical_rationale && (
              <div className="mt-3 pt-3 border-t border-slate-200">
                <p className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Lightbulb className="w-3.5 h-3.5 text-purple-600" />
                  Clinical Rationale:
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">{suggestions.clinical_rationale}</p>
              </div>
            )}

            {/* Useful Sections */}
            {suggestions.useful_sections && suggestions.useful_sections.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-200">
                <p className="text-xs font-semibold text-slate-700 mb-2">Key Sections for This Case:</p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.useful_sections.map((section, idx) => (
                    <Badge key={idx} className="bg-purple-100 text-purple-800 text-xs">
                      {section}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Sections to Emphasize */}
            {suggestions.sections_to_emphasize && suggestions.sections_to_emphasize.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-semibold text-slate-700 mb-2">⚠️ Requires Extra Detail:</p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.sections_to_emphasize.map((section, idx) => (
                    <Badge key={idx} className="bg-amber-100 text-amber-800 border border-amber-300 text-xs">
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
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-blue-600" />
                <h4 className="text-sm font-semibold text-slate-900">Documentation Guide for {specialty || noteType}</h4>
              </div>
              <div className="space-y-2.5 text-xs text-slate-700">
                {suggestions.prefill_suggestions.history_tips && (
                  <div className="bg-white rounded-lg p-2.5 border border-blue-200">
                    <p className="font-semibold text-blue-900 mb-1">📋 History Focus:</p>
                    <p className="leading-relaxed">{suggestions.prefill_suggestions.history_tips}</p>
                  </div>
                )}
                {suggestions.prefill_suggestions.exam_focus && (
                  <div className="bg-white rounded-lg p-2.5 border border-blue-200">
                    <p className="font-semibold text-blue-900 mb-1">🔍 Exam Focus:</p>
                    <p className="leading-relaxed">{suggestions.prefill_suggestions.exam_focus}</p>
                  </div>
                )}
                {suggestions.prefill_suggestions.assessment_guidance && (
                  <div className="bg-white rounded-lg p-2.5 border border-blue-200">
                    <p className="font-semibold text-blue-900 mb-1">💡 Assessment Guidance:</p>
                    <p className="leading-relaxed">{suggestions.prefill_suggestions.assessment_guidance}</p>
                  </div>
                )}
                {suggestions.prefill_suggestions.documentation_alerts && (
                  <div className="bg-amber-50 rounded-lg p-2.5 border border-amber-300">
                    <p className="font-semibold text-amber-900 mb-1">⚠️ Important:</p>
                    <p className="leading-relaxed text-amber-900">{suggestions.prefill_suggestions.documentation_alerts}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Alternative Templates */}
          {suggestions.alternative_templates && suggestions.alternative_templates.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-700">Alternative Templates:</p>
              {suggestions.alternative_templates.map((alt, idx) => {
                const altTemplate = templates.find(t => t.id === alt.template_id);
                if (!altTemplate) return null;
                return (
                  <div key={idx} className="bg-white rounded-lg border border-slate-200 p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">{altTemplate.name}</p>
                        <p className="text-xs text-slate-600 mt-1">{alt.reason}</p>
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
                    {alt.when_to_use && (
                      <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
                        <span className="font-semibold">Best for:</span> {alt.when_to_use}
                      </div>
                    )}
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