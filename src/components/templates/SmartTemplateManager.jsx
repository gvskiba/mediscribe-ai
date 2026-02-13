import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Plus, Edit2, Trash2, Wand2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function SmartTemplateManager() {
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: templates = [] } = useQuery({
    queryKey: ["smartTemplates"],
    queryFn: () => base44.entities.NoteTemplate.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.NoteTemplate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["smartTemplates"] });
      setShowCreateForm(false);
      toast.success("Smart template created");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.NoteTemplate.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["smartTemplates"] });
      setEditingTemplate(null);
      toast.success("Template updated");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.NoteTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["smartTemplates"] });
      toast.success("Template deleted");
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Wand2 className="w-7 h-7 text-purple-600" />
            Smart Templates
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            AI-powered templates that auto-generate content based on initial inputs
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white gap-2"
        >
          <Plus className="w-4 h-4" /> Create Smart Template
        </Button>
      </div>

      {/* Create/Edit Form */}
      <AnimatePresence>
        {(showCreateForm || editingTemplate) && (
          <SmartTemplateForm
            template={editingTemplate}
            onSave={(data) => {
              if (editingTemplate) {
                updateMutation.mutate({ id: editingTemplate.id, data });
              } else {
                createMutation.mutate(data);
              }
            }}
            onCancel={() => {
              setShowCreateForm(false);
              setEditingTemplate(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Templates Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl border-2 border-slate-200 hover:border-purple-300 hover:shadow-lg transition-all overflow-hidden"
          >
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-4 py-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900">{template.name}</h3>
              <p className="text-xs text-slate-600 mt-1">{template.description}</p>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                {template.note_type && (
                  <Badge variant="outline" className="text-xs">
                    {template.note_type.replace("_", " ")}
                  </Badge>
                )}
                {template.specialty && (
                  <Badge className="text-xs bg-purple-100 text-purple-700">
                    {template.specialty}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Sparkles className="w-3 h-3 text-purple-600" />
                <span>{template.sections?.filter(s => s.ai_instructions).length || 0} AI-powered sections</span>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingTemplate(template)}
                  className="flex-1 gap-1"
                >
                  <Edit2 className="w-3 h-3" /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (confirm("Delete this template?")) {
                      deleteMutation.mutate(template.id);
                    }
                  }}
                  className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

const SmartTemplateForm = ({ template, onSave, onCancel }) => {
  const [formData, setFormData] = useState(template || {
    name: "",
    description: "",
    note_type: "progress_note",
    specialty: "",
    sections: [
      { id: "chief_complaint", name: "Chief Complaint", order: 1, enabled: true, ai_instructions: "" },
      { id: "history_of_present_illness", name: "History of Present Illness", order: 2, enabled: true, ai_instructions: "Extract detailed HPI with OLDCARTS framework based on the chief complaint" },
      { id: "review_of_systems", name: "Review of Systems", order: 3, enabled: true, ai_instructions: "Generate relevant ROS based on chief complaint and HPI" },
      { id: "physical_exam", name: "Physical Examination", order: 4, enabled: true, ai_instructions: "Suggest expected physical exam findings based on chief complaint" },
      { id: "assessment", name: "Assessment", order: 5, enabled: true, ai_instructions: "Generate clinical assessment based on presentation" },
      { id: "plan", name: "Treatment Plan", order: 6, enabled: true, ai_instructions: "Create evidence-based treatment plan" }
    ]
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border-2 border-purple-300 p-6 shadow-xl"
    >
      <h3 className="text-lg font-bold text-slate-900 mb-4">
        {template ? "Edit" : "Create"} Smart Template
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Template Name</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Smart Cardiology Consult"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe when to use this template..."
            rows={2}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Note Type</label>
            <select
              value={formData.note_type}
              onChange={(e) => setFormData({ ...formData, note_type: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
            >
              <option value="progress_note">Progress Note</option>
              <option value="h_and_p">History & Physical</option>
              <option value="discharge_summary">Discharge Summary</option>
              <option value="consult">Consultation</option>
              <option value="procedure_note">Procedure Note</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Specialty</label>
            <Input
              value={formData.specialty}
              onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
              placeholder="e.g., Cardiology"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            AI-Powered Sections
          </label>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {formData.sections?.map((section, idx) => (
              <div key={idx} className="bg-slate-50 rounded-lg border border-slate-200 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm text-slate-900">{section.name}</span>
                  <input
                    type="checkbox"
                    checked={section.enabled !== false}
                    onChange={(e) => {
                      const newSections = [...formData.sections];
                      newSections[idx].enabled = e.target.checked;
                      setFormData({ ...formData, sections: newSections });
                    }}
                    className="w-4 h-4"
                  />
                </div>
                {section.enabled !== false && (
                  <Textarea
                    value={section.ai_instructions || ""}
                    onChange={(e) => {
                      const newSections = [...formData.sections];
                      newSections[idx].ai_instructions = e.target.value;
                      setFormData({ ...formData, sections: newSections });
                    }}
                    placeholder="AI instructions for this section..."
                    rows={2}
                    className="text-xs"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            <X className="w-4 h-4 mr-2" /> Cancel
          </Button>
          <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white">
            <Save className="w-4 h-4 mr-2" /> Save Template
          </Button>
        </div>
      </form>
    </motion.div>
  );
};