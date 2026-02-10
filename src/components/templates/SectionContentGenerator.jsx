import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Sparkles, Copy, Check } from "lucide-react";
import { toast } from "sonner";

export default function SectionContentGenerator({ 
  section, 
  patientContext = null,
  onContentGenerated,
  trigger 
}) {
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [contextInput, setContextInput] = useState("");

  const generateContent = async () => {
    setGenerating(true);

    try {
      const contextInfo = patientContext || contextInput || "No specific patient context provided";
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a clinical documentation assistant. Generate draft content for the following clinical note section.

Section Name: ${section.name}
Section Description: ${section.description || "No description provided"}
AI Instructions: ${section.ai_instructions || "Follow standard clinical documentation practices"}

${patientContext ? `Patient Context:\n${JSON.stringify(patientContext, null, 2)}` : `Context Information:\n${contextInfo}`}

Generate realistic, clinically appropriate draft content for this section. The content should be:
- Professional and medically accurate
- Structured and organized
- Ready to be reviewed and edited by a clinician
- Following the AI instructions provided

If no specific patient context is provided, generate a template-style example that shows what should be documented in this section.`,
        response_json_schema: {
          type: "object",
          properties: {
            content: { type: "string", description: "The generated section content" },
            explanation: { type: "string", description: "Brief explanation of what was generated and why" }
          }
        }
      });

      setGeneratedContent(result.content);
      toast.success("Draft content generated");
    } catch (error) {
      console.error("Failed to generate content:", error);
      toast.error("Failed to generate content");
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent);
    toast.success("Copied to clipboard");
  };

  const handleApply = () => {
    if (onContentGenerated) {
      onContentGenerated(generatedContent);
    }
    setOpen(false);
  };

  return (
    <>
      {trigger && trigger({ onClick: () => setOpen(true) })}
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-600" />
              Generate Draft Content: {section.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {section.description && (
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <p className="text-xs font-semibold text-slate-700 mb-1">Section Description:</p>
                <p className="text-sm text-slate-600">{section.description}</p>
              </div>
            )}

            {section.ai_instructions && (
              <div className="bg-cyan-50 rounded-lg p-3 border border-cyan-200">
                <p className="text-xs font-semibold text-cyan-800 mb-1">AI Instructions:</p>
                <p className="text-sm text-cyan-700">{section.ai_instructions}</p>
              </div>
            )}

            {!patientContext && (
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Patient Context (Optional)
                </label>
                <Textarea
                  value={contextInput}
                  onChange={(e) => setContextInput(e.target.value)}
                  placeholder="Enter patient information, chief complaint, or clinical context to generate more specific content..."
                  className="min-h-[100px] rounded-lg"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Leave empty to generate a template-style example
                </p>
              </div>
            )}

            <Button
              onClick={generateContent}
              disabled={generating}
              className="w-full gap-2 bg-cyan-600 hover:bg-cyan-700"
            >
              {generating ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Generate Draft Content</>
              )}
            </Button>

            {generatedContent && (
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">Generated Content</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyToClipboard}
                    className="gap-1.5"
                  >
                    <Copy className="w-3 h-3" /> Copy
                  </Button>
                </div>
                
                <div className="bg-white border border-slate-200 rounded-lg p-4 max-h-[400px] overflow-y-auto">
                  <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans">
                    {generatedContent}
                  </pre>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setGeneratedContent("")}
                    className="flex-1 rounded-lg"
                  >
                    Clear
                  </Button>
                  {onContentGenerated && (
                    <Button
                      onClick={handleApply}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 rounded-lg gap-2"
                    >
                      <Check className="w-4 h-4" /> Use This Content
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}