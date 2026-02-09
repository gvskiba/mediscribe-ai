import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Sparkles, Plus } from "lucide-react";

export default function AISectionGenerator({ templateId, onSectionGenerated, trigger }) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedSections, setGeneratedSections] = useState([]);

  const generateSections = async () => {
    if (!description.trim()) return;
    setGenerating(true);

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate 3-5 clinical note sections based on this description: "${description}"

For each section, provide:
- Section name (brief, clear)
- Description of what the section should capture
- Suggested AI instructions for extracting/generating content

Return as a structured list with clear formatting.`,
        response_json_schema: {
          type: "object",
          properties: {
            sections: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  ai_instructions: { type: "string" }
                }
              }
            }
          }
        }
      });

      setGeneratedSections(result.sections || []);
    } catch (error) {
      console.error("Failed to generate sections:", error);
    } finally {
      setGenerating(false);
    }
  };

  const addSection = (section) => {
    const newSection = {
      id: `section_${Date.now()}`,
      name: section.name,
      description: section.description,
      ai_instructions: section.ai_instructions,
      enabled: true,
      order: 0
    };
    onSectionGenerated(newSection);
    setGeneratedSections(generatedSections.filter(s => s !== section));
  };

  return (
    <>
      {trigger && trigger({ onClick: () => setOpen(true) })}
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI Section Generator
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-900 block mb-2">
                Describe what sections you need
              </label>
              <Textarea
                placeholder="e.g., 'Sections for a cardiology consultation with focus on patient symptoms, cardiac exam findings, and treatment options'"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-24"
              />
            </div>

            <Button
              onClick={generateSections}
              disabled={!description.trim() || generating}
              className="w-full gap-2 bg-purple-600 hover:bg-purple-700"
            >
              {generating ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Generate Sections</>
              )}
            </Button>

            {generatedSections.length > 0 && (
              <div className="space-y-3 mt-6">
                <p className="text-sm font-semibold text-slate-900">Generated Sections:</p>
                {generatedSections.map((section, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{section.name}</p>
                        <p className="text-xs text-slate-600 mt-1">{section.description}</p>
                        <p className="text-xs text-slate-700 mt-2 bg-white p-2 rounded border border-slate-200">
                          <strong>AI Instructions:</strong> {section.ai_instructions}
                        </p>
                      </div>
                      <Button
                        onClick={() => addSection(section)}
                        size="sm"
                        className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white flex-shrink-0 ml-2"
                      >
                        <Plus className="w-3 h-3" /> Add
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}