import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Wand2, Check } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function SmartTemplateApplicator({ noteId, note, templates, onTemplateApplied }) {
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [applying, setApplying] = useState(false);
  const [generationProgress, setGenerationProgress] = useState([]);

  const applySmartTemplate = async () => {
    const template = templates.find(t => t.id === selectedTemplate);
    if (!template) return;

    setApplying(true);
    setGenerationProgress([]);

    try {
      const updates = {};
      
      // Apply note type
      if (template.note_type) {
        updates.note_type = template.note_type;
      }

      // Process each enabled section with AI instructions
      const aiSections = template.sections
        ?.filter(s => s.enabled !== false && s.ai_instructions)
        .sort((a, b) => (a.order || 0) - (b.order || 0)) || [];

      for (const section of aiSections) {
        setGenerationProgress(prev => [...prev, { section: section.name, status: "generating" }]);

        try {
          // Build context from already filled fields and previous AI generations
          const contextData = {
            patient_name: note.patient_name,
            patient_age: note.patient_age,
            patient_gender: note.patient_gender,
            chief_complaint: note.chief_complaint || updates.chief_complaint || "",
            history_of_present_illness: updates.history_of_present_illness || note.history_of_present_illness || "",
            review_of_systems: updates.review_of_systems || note.review_of_systems || "",
            physical_exam: updates.physical_exam || note.physical_exam || "",
            assessment: updates.assessment || note.assessment || "",
            plan: updates.plan || note.plan || ""
          };

          const result = await base44.integrations.Core.InvokeLLM({
            prompt: `${section.ai_instructions}

PATIENT CONTEXT:
- Name: ${contextData.patient_name}
- Age: ${contextData.patient_age || "Not specified"}
- Gender: ${contextData.patient_gender || "Not specified"}

CLINICAL INFORMATION:
- Chief Complaint: ${contextData.chief_complaint || "Not provided"}
- History: ${contextData.history_of_present_illness || "Not yet documented"}
- ROS: ${contextData.review_of_systems || "Not yet documented"}
- Physical Exam: ${contextData.physical_exam || "Not yet documented"}
- Assessment: ${contextData.assessment || "Not yet documented"}

Generate detailed, clinically appropriate content for the "${section.name}" section.`,
            add_context_from_internet: section.id === "assessment" || section.id === "plan"
          });

          updates[section.id] = result;
          setGenerationProgress(prev => 
            prev.map(p => p.section === section.name ? { ...p, status: "completed" } : p)
          );
        } catch (error) {
          console.error(`Failed to generate ${section.name}:`, error);
          setGenerationProgress(prev => 
            prev.map(p => p.section === section.name ? { ...p, status: "failed" } : p)
          );
        }
      }

      // Update the note with all generated content
      await base44.entities.ClinicalNote.update(noteId, updates);
      onTemplateApplied?.();
      toast.success("Smart template applied with AI-generated content");
    } catch (error) {
      console.error("Failed to apply template:", error);
      toast.error("Failed to apply template");
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50 rounded-xl border-2 border-purple-300 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Wand2 className="w-6 h-6 text-purple-600" />
            Apply Smart Template
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            Automatically generate content for all sections using AI
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Select Template</label>
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border-2 border-purple-200 bg-white text-slate-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
            disabled={applying}
          >
            <option value="">Choose a smart template...</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>
                {t.name} {t.specialty ? `(${t.specialty})` : ""}
              </option>
            ))}
          </select>
        </div>

        {selectedTemplate && templates.find(t => t.id === selectedTemplate) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg border border-purple-200 p-4"
          >
            <p className="text-xs font-semibold text-slate-700 mb-2">Template Preview:</p>
            <div className="space-y-2">
              {templates.find(t => t.id === selectedTemplate).sections
                ?.filter(s => s.enabled !== false)
                .map((section, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <span className="text-slate-600">{section.name}</span>
                    {section.ai_instructions && (
                      <Badge className="bg-purple-100 text-purple-700 text-xs">
                        <Sparkles className="w-2 h-2 mr-1" /> AI
                      </Badge>
                    )}
                  </div>
                ))}
            </div>
          </motion.div>
        )}

        <Button
          onClick={applySmartTemplate}
          disabled={!selectedTemplate || applying}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white gap-2 shadow-lg py-6"
        >
          {applying ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Generating Content...
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5" /> Apply Template & Generate Content
            </>
          )}
        </Button>

        {/* Generation Progress */}
        {generationProgress.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-lg border border-slate-200 p-4 space-y-2"
          >
            <p className="text-xs font-semibold text-slate-700 mb-2">Generation Progress:</p>
            {generationProgress.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                {item.status === "generating" && <Loader2 className="w-3 h-3 animate-spin text-purple-600" />}
                {item.status === "completed" && <Check className="w-3 h-3 text-green-600" />}
                {item.status === "failed" && <span className="text-red-600">✗</span>}
                <span className={
                  item.status === "completed" ? "text-green-700" :
                  item.status === "failed" ? "text-red-700" :
                  "text-slate-600"
                }>
                  {item.section}
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};