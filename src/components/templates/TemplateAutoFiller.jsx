import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function TemplateAutoFiller({ 
  template, 
  patientData = null,
  rawNote = null,
  onContentGenerated 
}) {
  const [filling, setFilling] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const autoFillTemplate = async () => {
    if (!template?.sections || template.sections.length === 0) {
      toast.error("No sections to fill");
      return;
    }

    const enabledSections = template.sections.filter(s => s.enabled !== false);
    
    if (enabledSections.length === 0) {
      toast.error("No enabled sections in template");
      return;
    }

    setFilling(true);
    setProgress({ current: 0, total: enabledSections.length });

    const filledSections = {};

    try {
      for (let i = 0; i < enabledSections.length; i++) {
        const section = enabledSections[i];
        setProgress({ current: i + 1, total: enabledSections.length });

        try {
          const contextInfo = {
            patient: patientData,
            raw_note: rawNote,
            template_name: template.name,
            template_specialty: template.specialty,
            note_type: template.note_type
          };

          const result = await base44.integrations.Core.InvokeLLM({
            prompt: `You are a clinical documentation assistant. Extract and structure information for the following clinical note section.

Section Name: ${section.name}
Section Description: ${section.description || "No description provided"}
AI Instructions: ${section.ai_instructions || "Follow standard clinical documentation practices"}

Available Information:
${patientData ? `Patient Data:\n${JSON.stringify(patientData, null, 2)}\n` : ""}
${rawNote ? `Raw Clinical Note:\n${rawNote}\n` : ""}

Based on the available information, extract and format the relevant content for this section. If the information is not available in the provided context, return an empty string or a placeholder indicating what information is needed.

Return only the extracted and formatted content for this specific section.`,
            response_json_schema: {
              type: "object",
              properties: {
                content: { type: "string" },
                confidence: { 
                  type: "string", 
                  enum: ["high", "medium", "low"],
                  description: "Confidence level in the extracted information" 
                },
                missing_info: { 
                  type: "array", 
                  items: { type: "string" },
                  description: "List of information that could not be found" 
                }
              }
            }
          });

          filledSections[section.id || section.name] = {
            ...section,
            generated_content: result.content,
            confidence: result.confidence,
            missing_info: result.missing_info || []
          };
        } catch (error) {
          console.error(`Failed to fill section ${section.name}:`, error);
          filledSections[section.id || section.name] = {
            ...section,
            generated_content: "",
            confidence: "low",
            error: "Failed to generate content"
          };
        }
      }

      if (onContentGenerated) {
        onContentGenerated(filledSections);
      }

      toast.success(`Auto-filled ${enabledSections.length} sections`);
    } catch (error) {
      console.error("Failed to auto-fill template:", error);
      toast.error("Failed to auto-fill template");
    } finally {
      setFilling(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  if (!template) {
    return null;
  }

  const enabledSectionsCount = template.sections?.filter(s => s.enabled !== false).length || 0;

  return (
    <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-4 border border-cyan-200">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-cyan-600 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-900 mb-1">
            AI Auto-Fill Template
          </h3>
          <p className="text-xs text-slate-600 mb-3">
            Automatically populate {enabledSectionsCount} section{enabledSectionsCount !== 1 ? 's' : ''} using {patientData ? 'patient data' : ''}{patientData && rawNote ? ' and ' : ''}{rawNote ? 'clinical note' : ''} with AI
          </p>

          {!patientData && !rawNote && (
            <div className="flex items-start gap-2 bg-amber-50 rounded-lg p-3 mb-3 border border-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                No patient data or raw note provided. Auto-fill will generate template-style examples.
              </p>
            </div>
          )}

          <Button
            onClick={autoFillTemplate}
            disabled={filling || enabledSectionsCount === 0}
            className="w-full gap-2 bg-cyan-600 hover:bg-cyan-700"
          >
            {filling ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Filling {progress.current}/{progress.total}...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Auto-Fill All Sections
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}