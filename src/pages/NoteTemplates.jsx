import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Plus, Edit, Trash2, Star, Check, Sparkles, Loader2, BarChart3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SectionEditor from "../components/templates/SectionEditor";
import TemplateAnalytics from "../components/templates/TemplateAnalytics";

const noteTypes = [
  { value: "progress_note", label: "Progress Note" },
  { value: "h_and_p", label: "History & Physical" },
  { value: "discharge_summary", label: "Discharge Summary" },
  { value: "consult", label: "Consultation" },
  { value: "procedure_note", label: "Procedure Note" },
];

export default function NoteTemplates() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [generatingSuggestions, setGeneratingSuggestions] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [selectedTemplateForAnalytics, setSelectedTemplateForAnalytics] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    note_type: "progress_note",
    specialty: "",
    sections: [],
    ai_instructions: "",
  });

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["noteTemplates"],
    queryFn: async () => {
      const allTemplates = await base44.entities.NoteTemplate.list();
      const user = await base44.auth.me();
      
      // Filter templates: owned by user, shared with user, or public
      return allTemplates.filter(t => 
        t.created_by === user.email || 
        t.is_public || 
        t.shared_with?.includes(user.email)
      );
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      // Ensure sections have IDs and order
      const processedData = {
        ...data,
        sections: data.sections?.map((section, idx) => ({
          ...section,
          id: section.id || `section_${Date.now()}_${idx}`,
          order: section.order ?? idx,
          enabled: section.enabled ?? true,
          conditional_logic: section.conditional_logic || {
            enabled: false,
            condition_type: "note_type",
            condition_value: ""
          }
        })) || []
      };
      return base44.entities.NoteTemplate.create(processedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["noteTemplates"] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => {
      // Ensure sections have IDs and order
      const processedData = {
        ...data,
        sections: data.sections?.map((section, idx) => ({
          ...section,
          id: section.id || `section_${Date.now()}_${idx}`,
          order: section.order ?? idx,
          enabled: section.enabled ?? true,
          conditional_logic: section.conditional_logic || {
            enabled: false,
            condition_type: "note_type",
            condition_value: ""
          }
        })) || []
      };
      return base44.entities.NoteTemplate.update(id, processedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["noteTemplates"] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.NoteTemplate.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["noteTemplates"] }),
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id) => {
      await Promise.all(
        templates.map(t => base44.entities.NoteTemplate.update(t.id, { is_default: t.id === id }))
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["noteTemplates"] }),
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      note_type: "progress_note",
      specialty: "",
      sections: [],
      ai_instructions: "",
    });
    setEditingTemplate(null);
    setDialogOpen(false);
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    // Ensure sections have all required fields
    const processedSections = (template.sections || []).map((section, idx) => ({
      id: section.id || `section_${Date.now()}_${idx}`,
      name: section.name || "",
      description: section.description || "",
      ai_instructions: section.ai_instructions || "",
      enabled: section.enabled ?? true,
      order: section.order ?? idx,
      conditional_logic: section.conditional_logic || {
        enabled: false,
        condition_type: "note_type",
        condition_value: ""
      }
    }));
    setFormData({
      name: template.name,
      description: template.description || "",
      note_type: template.note_type || "progress_note",
      specialty: template.specialty || "",
      sections: processedSections,
      ai_instructions: template.ai_instructions || "",
    });
    setDialogOpen(true);
  };

  const handleGenerateSuggestions = async () => {
    setGeneratingSuggestions(true);
    
    try {
      const noteTypeLabel = noteTypes.find(t => t.value === formData.note_type)?.label || "Clinical Note";
      const specialtyContext = formData.specialty ? ` for ${formData.specialty}` : "";
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a clinical documentation expert. Generate a comprehensive template structure for a ${noteTypeLabel}${specialtyContext}.

Based on best practices and standard medical documentation, suggest:
1. Relevant sections with clear names
2. A brief description for each section explaining what should be documented
3. Specific AI extraction instructions for each section to guide automated note structuring

Consider common clinical documentation standards like SOAP, HPI structure, ROS, physical exam organization, and assessment/plan formatting.

Return a JSON structure with:
- sections: array of {name, description, ai_instructions}
- overall_ai_instructions: general guidance for the entire template`,
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
            },
            overall_ai_instructions: { type: "string" }
          }
        }
      });

      setFormData({
        ...formData,
        sections: result.sections || [],
        ai_instructions: result.overall_ai_instructions || formData.ai_instructions
      });
    } catch (error) {
      alert("Failed to generate suggestions. Please try again.");
    } finally {
      setGeneratingSuggestions(false);
    }
  };

  const handleSubmit = () => {
    if (!formData.name || formData.sections.length === 0) {
      alert("Please provide a template name and at least one section");
      return;
    }

    const data = { ...formData };

    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Note Templates</h1>
          <p className="text-slate-500 mt-1">Create custom templates with AI-driven sections. Define specific extraction instructions and set conditional logic based on note type or specialty.</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setDialogOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 rounded-xl gap-2"
        >
          <Plus className="w-4 h-4" /> New Template
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="h-48 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No templates yet</h3>
          <p className="text-slate-500 mb-4">Create your first note template to customize AI transcription</p>
          <Button onClick={() => setDialogOpen(true)} className="rounded-xl gap-2">
            <Plus className="w-4 h-4" /> Create Template
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {templates.map(template => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className="p-6 hover:shadow-lg transition-shadow relative">
                  {template.is_default && (
                    <Badge className="absolute top-4 right-4 bg-amber-100 text-amber-700">
                      <Star className="w-3 h-3 mr-1" /> Default
                    </Badge>
                  )}
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">{template.name}</h3>
                    <p className="text-sm text-slate-500">{template.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="outline">{noteTypes.find(t => t.value === template.note_type)?.label}</Badge>
                    {template.specialty && <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">{template.specialty}</Badge>}
                    {template.sections?.length > 0 && (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        {template.sections.filter(s => s.enabled !== false).length}/{template.sections.length} active
                      </Badge>
                    )}
                    {template.sections?.filter(s => s.conditional_logic?.enabled).length > 0 && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        {template.sections.filter(s => s.conditional_logic?.enabled).length} conditional
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTemplateForAnalytics(template);
                        setAnalyticsOpen(true);
                      }}
                      className="rounded-lg gap-1 text-blue-600 hover:text-blue-700"
                    >
                      <BarChart3 className="w-3 h-3" /> Analytics
                    </Button>
                    {!template.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDefaultMutation.mutate(template.id)}
                        className="rounded-lg gap-1"
                      >
                        <Star className="w-3 h-3" /> Set Default
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(template)}
                      className="rounded-lg gap-1"
                    >
                      <Edit className="w-3 h-3" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteMutation.mutate(template.id)}
                      className="rounded-lg gap-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Edit Template" : "Create Template"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Template Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Cardiology Progress Note"
                className="rounded-lg"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Description</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this template"
                className="rounded-lg"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Note Type</label>
                <Select value={formData.note_type} onValueChange={(v) => setFormData({ ...formData, note_type: v })}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {noteTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Specialty</label>
                <Input
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  placeholder="e.g., Cardiology"
                  className="rounded-lg"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-slate-700">Note Sections</label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateSuggestions}
                  disabled={generatingSuggestions}
                  className="rounded-lg gap-2 text-xs"
                >
                  {generatingSuggestions ? (
                    <><Loader2 className="w-3 h-3 animate-spin" /> Generating...</>
                  ) : (
                    <><Sparkles className="w-3 h-3" /> AI Suggest Sections</>
                  )}
                </Button>
              </div>
              <SectionEditor
                sections={formData.sections}
                onChange={(sections) => setFormData({ ...formData, sections })}
              />
              <p className="text-xs text-slate-500 mt-2">Define sections for AI to structure the note, or use AI suggestions based on note type</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Global AI Instructions (Optional)</label>
              <Textarea
                value={formData.ai_instructions}
                onChange={(e) => setFormData({ ...formData, ai_instructions: e.target.value })}
                placeholder="e.g., 'Be concise and use bullet points', 'Focus on patient safety concerns', 'Use medical terminology appropriate for specialist audience'"
                className="min-h-[100px] rounded-lg"
              />
              <p className="text-xs text-slate-500 mt-1.5">
                These instructions apply to the entire template. For section-specific instructions, configure them in the sections above.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={resetForm} className="rounded-lg">
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                className="bg-blue-600 hover:bg-blue-700 rounded-lg gap-2"
                disabled={!formData.name || formData.sections.length === 0}
              >
                <Check className="w-4 h-4" />
                {editingTemplate ? "Update" : "Create"} Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <TemplateAnalytics
        template={selectedTemplateForAnalytics}
        open={analyticsOpen}
        onClose={() => {
          setAnalyticsOpen(false);
          setSelectedTemplateForAnalytics(null);
        }}
      />
    </div>
  );
}