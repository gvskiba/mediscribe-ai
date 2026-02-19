import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, Trash2, Edit2, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ProcedureTemplateManager() {
  const [open, setOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    procedure_name: "",
    procedure_code: "",
    technique: "",
    findings: "",
    post_procedure_plan: "",
    common_complications: "",
    icd10_codes: [],
    location: "clinic",
    anesthesia_type: "local",
    estimated_duration: "",
    category: "therapeutic",
    is_favorite: false,
    tags: "",
    specialty: ""
  });

  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["procedureTemplates"],
    queryFn: () => base44.entities.ProcedureTemplate.list(),
    enabled: open
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ProcedureTemplate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procedureTemplates"] });
      resetForm();
      toast.success("Template created");
    },
    onError: () => toast.error("Failed to create template")
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.ProcedureTemplate.update(editingTemplate.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procedureTemplates"] });
      resetForm();
      toast.success("Template updated");
    },
    onError: () => toast.error("Failed to update template")
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProcedureTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procedureTemplates"] });
      toast.success("Template deleted");
    },
    onError: () => toast.error("Failed to delete template")
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: (template) =>
      base44.entities.ProcedureTemplate.update(template.id, {
        ...template,
        is_favorite: !template.is_favorite
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procedureTemplates"] });
    }
  });

  const resetForm = () => {
    setEditingTemplate(null);
    setFormData({
      name: "",
      description: "",
      procedure_name: "",
      procedure_code: "",
      technique: "",
      findings: "",
      post_procedure_plan: "",
      common_complications: "",
      icd10_codes: [],
      location: "clinic",
      anesthesia_type: "local",
      estimated_duration: "",
      category: "therapeutic",
      is_favorite: false,
      tags: "",
      specialty: ""
    });
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.procedure_name) {
      toast.error("Name and procedure name are required");
      return;
    }

    const submitData = {
      ...formData,
      icd10_codes: formData.icd10_codes.filter((c) => c.trim()),
      tags: formData.tags.split(",").map((t) => t.trim()).filter((t) => t),
      estimated_duration: formData.estimated_duration ? parseInt(formData.estimated_duration) : null
    };

    if (editingTemplate) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      ...template,
      icd10_codes: template.icd10_codes || [],
      tags: (template.tags || []).join(", "),
      estimated_duration: template.estimated_duration || ""
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Plus className="w-4 h-4" />
          Manage Templates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Procedure Templates</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Template List */}
          <div className="border-r pr-4">
            <h3 className="font-semibold mb-3">Saved Templates</h3>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : templates.length > 0 ? (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {templates.map((template) => (
                  <Card key={template.id} className="p-3 hover:bg-slate-50">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm text-slate-900">{template.name}</p>
                          {template.is_favorite && <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />}
                        </div>
                        <p className="text-xs text-slate-600">{template.procedure_name}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => toggleFavoriteMutation.mutate(template)}
                        >
                          <Star className={`w-3 h-3 ${template.is_favorite ? "fill-yellow-400 text-yellow-400" : ""}`} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => handleEdit(template)}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-red-600 hover:text-red-700"
                          onClick={() => deleteMutation.mutate(template.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No templates yet. Create one to get started.</p>
            )}
          </div>

          {/* Form */}
          <div className="pl-4">
            <h3 className="font-semibold mb-3">{editingTemplate ? "Edit Template" : "New Template"}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Template Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Central Line - Standard"
                  className="text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Description</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="When to use this template..."
                  className="text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Procedure Name *</label>
                <Input
                  value={formData.procedure_name}
                  onChange={(e) => setFormData({ ...formData, procedure_name: e.target.value })}
                  placeholder="e.g., Central Line Placement"
                  className="text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Procedure Code (CPT)</label>
                <Input
                  value={formData.procedure_code}
                  onChange={(e) => setFormData({ ...formData, procedure_code: e.target.value })}
                  placeholder="e.g., 36558"
                  className="text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Technique</label>
                <Textarea
                  value={formData.technique}
                  onChange={(e) => setFormData({ ...formData, technique: e.target.value })}
                  placeholder="Standard technique..."
                  className="text-sm h-16"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Common Findings</label>
                <Textarea
                  value={formData.findings}
                  onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
                  placeholder="Typical findings..."
                  className="text-sm h-16"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Post-Procedure Plan</label>
                <Textarea
                  value={formData.post_procedure_plan}
                  onChange={(e) => setFormData({ ...formData, post_procedure_plan: e.target.value })}
                  placeholder="Standard post-procedure care..."
                  className="text-sm h-16"
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="text-sm flex-1 border border-slate-300 rounded-md px-2 py-1"
                >
                  <option value="clinic">Clinic</option>
                  <option value="bedside">Bedside</option>
                  <option value="procedure_room">Procedure Room</option>
                  <option value="or">OR</option>
                  <option value="er">ER</option>
                  <option value="icu">ICU</option>
                </select>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="text-sm flex-1 border border-slate-300 rounded-md px-2 py-1"
                >
                  <option value="diagnostic">Diagnostic</option>
                  <option value="therapeutic">Therapeutic</option>
                  <option value="interventional">Interventional</option>
                  <option value="surgical">Surgical</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Tags (comma-separated)</label>
                <Input
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="e.g., common, central, vascular"
                  className="text-sm"
                />
              </div>

              <div className="flex gap-2 pt-2">
                {editingTemplate && (
                  <Button variant="outline" onClick={resetForm} className="flex-1">
                    Cancel
                  </Button>
                )}
                <Button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1"
                >
                  {editingTemplate ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}