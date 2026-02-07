import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, FileText } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function AITemplateCreator({ open, onClose, onTemplateCreated }) {
  const [step, setStep] = useState(1); // 1: description, 2: review, 3: done
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedTemplate, setGeneratedTemplate] = useState(null);

  const handleGenerateTemplate = async () => {
    if (!description.trim()) {
      toast.error("Please describe the template you want to create");
      return;
    }

    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a clinical documentation expert. Based on the following description, create a complete note template structure with sections, descriptions, and AI instructions.

User Description: ${description}

Generate a professional, comprehensive template that includes:
1. An appropriate name and description for the template
2. Suitable note type and specialty
3. 5-8 relevant sections with clear purposes and AI extraction instructions
4. Global AI instructions for the entire template

Ensure the template follows clinical documentation best practices like SOAP, HPI structure, and proper medical organization.`,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            note_type: {
              type: "string",
              enum: ["progress_note", "h_and_p", "discharge_summary", "consult", "procedure_note"]
            },
            specialty: { type: "string" },
            category: { type: "string" },
            tags: {
              type: "array",
              items: { type: "string" }
            },
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
            },
            ai_instructions: { type: "string" }
          }
        }
      });

      setGeneratedTemplate(result);
      setStep(2);
    } catch (error) {
      console.error("Failed to generate template:", error);
      toast.error("Failed to generate template. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!generatedTemplate) return;

    setLoading(true);
    try {
      const processedTemplate = {
        ...generatedTemplate,
        version: 1,
        usage_count: 0,
        sections: generatedTemplate.sections.map((section, idx) => ({
          id: `section_${Date.now()}_${idx}`,
          name: section.name,
          description: section.description,
          ai_instructions: section.ai_instructions,
          enabled: true,
          order: idx,
          conditional_logic: {
            enabled: false,
            condition_type: "note_type",
            condition_value: ""
          }
        }))
      };

      const created = await base44.entities.NoteTemplate.create(processedTemplate);
      toast.success("Template created successfully!");
      
      if (onTemplateCreated) {
        onTemplateCreated(created);
      }

      setStep(3);
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (error) {
      console.error("Failed to create template:", error);
      toast.error("Failed to create template. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setDescription("");
    setGeneratedTemplate(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI-Powered Template Creator
          </DialogTitle>
          <DialogDescription>
            Describe your ideal template and let AI build it for you
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Describe your template
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="E.g., 'A comprehensive cardiology progress note for heart failure patients that includes vital signs monitoring, medication review, and exercise tolerance assessment'"
                  className="min-h-[120px] rounded-lg"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Be specific about specialty, note type, and key sections you need
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerateTemplate}
                  disabled={loading || !description.trim()}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Generate Template
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && generatedTemplate && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 max-h-[400px] overflow-y-auto"
            >
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-semibold text-slate-700">Name</label>
                  <p className="text-sm text-slate-600">{generatedTemplate.name}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700">Description</label>
                  <p className="text-sm text-slate-600">{generatedTemplate.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Note Type</label>
                    <Badge variant="outline">{generatedTemplate.note_type}</Badge>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Specialty</label>
                    <Badge className="bg-purple-100 text-purple-700">{generatedTemplate.specialty}</Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700">Tags</label>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {generatedTemplate.tags?.map((tag, idx) => (
                      <Badge key={idx} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">Sections ({generatedTemplate.sections.length})</label>
                  <div className="space-y-2">
                    {generatedTemplate.sections.map((section, idx) => (
                      <div key={idx} className="p-2 bg-slate-50 rounded border border-slate-200">
                        <p className="text-sm font-medium text-slate-900">{idx + 1}. {section.name}</p>
                        <p className="text-xs text-slate-600 mt-1">{section.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={handleCreateTemplate}
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Creating...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" /> Create Template
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6"
            >
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">Template Created!</h3>
              <p className="text-sm text-slate-600">Your AI-generated template is ready to use</p>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}