import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Sparkles, Filter } from "lucide-react";

export default function TemplatePreview({ template, noteType, specialty }) {
  if (!template || !template.sections) return null;

  const activeSections = template.sections
    .filter(section => section.enabled !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const getApplicableSections = () => {
    return activeSections.filter(section => {
      if (!section.conditional_logic?.enabled) return true;
      
      const { condition_type, condition_value } = section.conditional_logic;
      
      if (condition_type === "note_type") {
        return noteType === condition_value;
      } else if (condition_type === "specialty") {
        return specialty?.toLowerCase().includes(condition_value?.toLowerCase());
      }
      return true;
    });
  };

  const applicableSections = getApplicableSections();
  const conditionalSections = activeSections.filter(s => s.conditional_logic?.enabled);

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader>
        <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          Template Preview
        </CardTitle>
        <div className="sr-only">Preview of template {template.name} with {applicableSections.length} applicable sections</div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs text-slate-600 mb-2">
            {applicableSections.length} of {activeSections.length} sections will be used:
          </p>
          <div className="space-y-1">
            {activeSections.map((section, idx) => {
              const isApplicable = applicableSections.includes(section);
              const hasConditional = section.conditional_logic?.enabled;
              const hasAIInstructions = section.ai_instructions?.trim();

              return (
                <div
                  key={section.id}
                  className={`flex items-start gap-2 p-2 rounded-lg text-xs ${
                    isApplicable
                      ? "bg-white border border-green-200"
                      : "bg-slate-50 border border-slate-200 opacity-60"
                  }`}
                >
                  {isApplicable ? (
                    <CheckCircle className="w-3.5 h-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 flex items-center gap-1">
                      {idx + 1}. {section.name}
                      {hasAIInstructions && (
                        <Sparkles className="w-3 h-3 text-blue-500" />
                      )}
                      {hasConditional && (
                        <Filter className="w-3 h-3 text-purple-500" />
                      )}
                    </div>
                    {hasAIInstructions && (
                      <p className="text-slate-600 mt-0.5 text-xs truncate">
                        AI: {section.ai_instructions}
                      </p>
                    )}
                    {hasConditional && !isApplicable && (
                      <p className="text-slate-500 mt-0.5 italic">
                        Filtered by condition
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {conditionalSections.length > 0 && (
          <div className="pt-3 border-t border-blue-200">
            <p className="text-xs text-slate-600 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              {conditionalSections.length} section(s) use conditional logic
            </p>
          </div>
        )}

        {template.ai_instructions && (
          <div className="pt-3 border-t border-blue-200">
            <p className="text-xs text-slate-600 font-medium mb-1">Global AI Instructions:</p>
            <p className="text-xs text-slate-700 italic leading-relaxed">
              "{template.ai_instructions}"
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}