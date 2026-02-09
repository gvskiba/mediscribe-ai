import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Wand2, Copy, Check } from "lucide-react";

export default function AIInstructionRefinement({ currentInstructions, sectionName, onApply, trigger }) {
  const [open, setOpen] = useState(false);
  const [refining, setRefining] = useState(false);
  const [refinedInstructions, setRefinedInstructions] = useState("");
  const [copied, setCopied] = useState(false);

  const refineInstructions = async () => {
    setRefining(true);

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Improve these AI instructions for a clinical note section to be clearer, more comprehensive, and more effective for extracting structured medical data:

Section: "${sectionName}"
Current Instructions: "${currentInstructions || 'None provided'}"

Provide improved instructions that:
1. Are clear and unambiguous
2. Include specific examples or formats
3. Define expected output structure
4. Include edge cases or special handling
5. Are optimized for LLM comprehension

Return ONLY the improved instructions as a continuous paragraph or bullet list, no preamble.`,
        response_json_schema: {
          type: "object",
          properties: {
            refined_instructions: { type: "string" }
          }
        }
      });

      setRefinedInstructions(result.refined_instructions || "");
    } catch (error) {
      console.error("Failed to refine instructions:", error);
    } finally {
      setRefining(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(refinedInstructions);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {trigger && trigger({ onClick: () => setOpen(true) })}
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-blue-600" />
              Refine AI Instructions
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-600 mb-3">Section: <strong>{sectionName}</strong></p>
              
              {currentInstructions && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4">
                  <p className="text-xs font-semibold text-slate-600 uppercase mb-2">Current Instructions</p>
                  <p className="text-sm text-slate-700">{currentInstructions}</p>
                </div>
              )}

              <Button
                onClick={refineInstructions}
                disabled={refining}
                className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
              >
                {refining ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Refining...</>
                ) : (
                  <><Wand2 className="w-4 h-4" /> Refine Instructions</>
                )}
              </Button>
            </div>

            {refinedInstructions && (
              <div className="space-y-3 mt-6 pt-6 border-t border-slate-200">
                <p className="text-sm font-semibold text-slate-900">Refined Instructions:</p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{refinedInstructions}</p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={copyToClipboard}
                    variant="outline"
                    className="gap-2"
                  >
                    {copied ? (
                      <><Check className="w-4 h-4" /> Copied</>
                    ) : (
                      <><Copy className="w-4 h-4" /> Copy</>
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      onApply(refinedInstructions);
                      setOpen(false);
                    }}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    Apply to Section
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}