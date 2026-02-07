import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check } from "lucide-react";
import { toast } from "sonner";

const NOTE_TYPES = [
  { value: "progress_note", label: "Progress Note" },
  { value: "h_and_p", label: "History & Physical" },
  { value: "discharge_summary", label: "Discharge Summary" },
  { value: "consult", label: "Consultation" },
  { value: "procedure_note", label: "Procedure Note" },
];

const CATEGORIES = [
  "general", "cardiology", "pulmonology", "endocrinology", "neurology", 
  "oncology", "pediatrics", "emergency", "surgery", "psychiatry"
];

export default function CreateTemplateFromNote({ open, onClose, note, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    note_type: note?.note_type || "progress_note",
    specialty: note?.specialty || "",
    category: "general",
  });

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error("Please enter a template name");
      return;
    }

    setLoading(true);
    try {
      // Build sections from structured note fields
      const sections = [
        {
          id: "chief_complaint",
          name: "Chief Complaint",
          description: "Main reason for visit",
          ai_instructions: "Extract the primary reason for the clinical encounter in 1-2 sentences",
          enabled: true,
          order: 0,
        },
        {
          id: "hpi",
          name: "History of Present Illness",
          description: "Detailed clinical narrative using OLDCARTS",
          ai_instructions: "Extract detailed HPI with onset, location, duration, character, alleviating/aggravating factors, radiation, temporal patterns, and severity",
          enabled: true,
          order: 1,
        },
        {
          id: "ros",
          name: "Review of Systems",
          description: "Systematic review by body system",
          ai_instructions: "Organize symptoms by body system (constitutional, HEENT, cardiovascular, respiratory, GI, GU, musculoskeletal, neurologic, psychiatric, skin)",
          enabled: true,
          order: 2,
        },
        {
          id: "physical_exam",
          name: "Physical Examination",
          description: "Objective findings and vital signs",
          ai_instructions: "Extract vital signs and system-specific physical exam findings",
          enabled: true,
          order: 3,
        },
        {
          id: "assessment",
          name: "Assessment",
          description: "Clinical interpretation and differential diagnosis",
          ai_instructions: "Provide clinical assessment including interpretation of findings and relevant differential diagnoses",
          enabled: true,
          order: 4,
        },
        {
          id: "plan",
          name: "Plan",
          description: "Treatment and management plan",
          ai_instructions: "Extract comprehensive plan including medications, tests, procedures, follow-up, and patient education",
          enabled: true,
          order: 5,
        },
      ];

      const templateData = {
        name: formData.name,
        description: formData.description,
        note_type: formData.note_type,
        specialty: formData.specialty,
        category: formData.category,
        sections,
        ai_instructions: `Template created from ${note.patient_name}'s ${formData.note_type.replace(/_/g, " ")} on ${note.date_of_visit}`,
        is_default: false,
        version: 1,
        usage_count: 0,
      };

      await base44.entities.NoteTemplate.create(templateData);
      toast.success("Template created from note");
      onSuccess?.();
      setFormData({ name: "", description: "", note_type: "progress_note", specialty: "", category: "general" });
      onClose();
    } catch (error) {
      toast.error("Failed to create template");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Template from Note</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="bg-slate-50 p-3 rounded-lg">
            <p className="text-xs text-slate-600 mb-1">Based on this note:</p>
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-slate-900">{note?.patient_name}</span>
              <Badge variant="outline" className="text-xs">{NOTE_TYPES.find(t => t.value === note?.note_type)?.label}</Badge>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Template Name *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Cardiology Progress Note"
              className="rounded-lg"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of this template"
              className="min-h-[80px] rounded-lg"
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
                  {NOTE_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Category</label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="rounded-lg">
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={loading || !formData.name.trim()}
              className="bg-blue-600 hover:bg-blue-700 rounded-lg gap-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
              ) : (
                <><Check className="w-4 h-4" /> Create Template</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}