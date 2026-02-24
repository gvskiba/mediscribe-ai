import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { createPageUrl } from "@/utils";
import {
  ArrowLeft, Save, Sparkles, Plus, Loader2, GitBranch,
  Wand2, Check, X, Tag, Info, ChevronDown, ChevronUp
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import SectionEditor from "../components/templates/SectionEditor";
import AISectionGenerator from "../components/templates/AISectionGenerator";
import AIInstructionRefinement from "../components/templates/AIInstructionRefinement";
import DynamicFieldManager from "../components/templates/DynamicFieldManager";

const NOTE_TYPES = [
  { value: "progress_note", label: "Progress Note" },
  { value: "h_and_p", label: "History & Physical" },
  { value: "discharge_summary", label: "Discharge Summary" },
  { value: "consult", label: "Consultation" },
  { value: "procedure_note", label: "Procedure Note" },
];

const CATEGORIES = [
  { value: "general", label: "General", color: "bg-slate-100 text-slate-700" },
  { value: "cardiology", label: "Cardiology", color: "bg-rose-100 text-rose-700" },
  { value: "pulmonology", label: "Pulmonology", color: "bg-blue-100 text-blue-700" },
  { value: "endocrinology", label: "Endocrinology", color: "bg-amber-100 text-amber-700" },
  { value: "neurology", label: "Neurology", color: "bg-purple-100 text-purple-700" },
  { value: "oncology", label: "Oncology", color: "bg-orange-100 text-orange-700" },
  { value: "pediatrics", label: "Pediatrics", color: "bg-green-100 text-green-700" },
  { value: "emergency", label: "Emergency", color: "bg-red-100 text-red-700" },
  { value: "surgery", label: "Surgery", color: "bg-teal-100 text-teal-700" },
  { value: "psychiatry", label: "Psychiatry", color: "bg-indigo-100 text-indigo-700" },
  { value: "custom", label: "Custom", color: "bg-pink-100 text-pink-700" },
];

const EMPTY_FORM = {
  name: "",
  description: "",
  note_type: "progress_note",
  specialty: "",
  category: "general",
  tags: [],
  sections: [],
  dynamic_fields: [],
  ai_instructions: "",
  version_notes: "",
};

function SidebarPanel({ title, icon: Icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          {Icon && <Icon className="w-4 h-4 text-slate-500" />}
          {title}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {open && <div className="px-5 pb-4 space-y-3">{children}</div>}
    </div>
  );
}

export default function TemplateEditor() {
  const queryClient = useQueryClient();
  const params = new URLSearchParams(window.location.search);
  const templateId = params.get("id");
  const isNew = !templateId;

  const [form, setForm] = useState(EMPTY_FORM);
  const [tagInput, setTagInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [savingVersion, setSavingVersion] = useState(false);
  const [versionNotes, setVersionNotes] = useState("");
  const [showVersionModal, setShowVersionModal] = useState(false);

  const { data: template, isLoading } = useQuery({
    queryKey: ["template", templateId],
    queryFn: () => base44.entities.NoteTemplate.filter({ id: templateId }),
    enabled: !!templateId,
    select: (data) => data?.[0],
  });

  useEffect(() => {
    if (template) {
      setForm({
        name: template.name || "",
        description: template.description || "",
        note_type: template.note_type || "progress_note",
        specialty: template.specialty || "",
        category: template.category || "general",
        tags: template.tags || [],
        sections: (template.sections || []).map((s, idx) => ({
          id: s.id || `s_${idx}`,
          name: s.name || "",
          description: s.description || "",
          ai_instructions: s.ai_instructions || "",
          enabled: s.enabled ?? true,
          order: s.order ?? idx,
          conditional_logic: s.conditional_logic || { enabled: false, operator: "AND", conditions: [] },
        })),
        dynamic_fields: template.dynamic_fields || [],
        ai_instructions: template.ai_instructions || "",
        version_notes: "",
      });
    }
  }, [template]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const processed = {
        ...data,
        sections: data.sections.map((s, idx) => ({
          ...s,
          id: s.id || `s_${Date.now()}_${idx}`,
          order: s.order ?? idx,
          enabled: s.enabled ?? true,
          conditional_logic: s.conditional_logic || { enabled: false, operator: "AND", conditions: [] },
        })),
      };
      if (isNew) {
        return base44.entities.NoteTemplate.create({ ...processed, version: 1, usage_count: 0 });
      } else {
        return base44.entities.NoteTemplate.update(templateId, processed);
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["noteTemplates"] });
      toast.success(isNew ? "Template created!" : "Template saved!");
      if (isNew) {
        window.location.href = createPageUrl(`TemplateEditor?id=${result.id}`);
      }
    },
  });

  const newVersionMutation = useMutation({
    mutationFn: async () => {
      const newVer = {
        ...form,
        version: (template?.version || 1) + 1,
        parent_template_id: template?.parent_template_id || templateId,
        version_notes: versionNotes,
        usage_count: 0,
        sections: form.sections.map((s, idx) => ({
          ...s,
          id: s.id || `s_${Date.now()}_${idx}`,
          order: s.order ?? idx,
          enabled: s.enabled ?? true,
          conditional_logic: s.conditional_logic || { enabled: false, operator: "AND", conditions: [] },
        })),
      };
      return base44.entities.NoteTemplate.create(newVer);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["noteTemplates"] });
      toast.success("New version created!");
      setShowVersionModal(false);
      setVersionNotes("");
      window.location.href = createPageUrl(`TemplateEditor?id=${result.id}`);
    },
  });

  const handleGenerateFull = async () => {
    if (!form.note_type) return;
    setGenerating(true);
    try {
      const nt = NOTE_TYPES.find(t => t.value === form.note_type)?.label || "Clinical Note";
      const spec = form.specialty ? ` for ${form.specialty}` : "";
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a comprehensive template structure for a ${nt}${spec}. 
Provide 5-8 clinical sections with names, descriptions, and specific AI extraction instructions. Also provide global AI instructions for the template.`,
        response_json_schema: {
          type: "object",
          properties: {
            sections: {
              type: "array",
              items: { type: "object", properties: { name: { type: "string" }, description: { type: "string" }, ai_instructions: { type: "string" } } }
            },
            overall_ai_instructions: { type: "string" }
          }
        }
      });
      const sects = (result.sections || []).map((s, idx) => ({
        ...s, id: `s_${Date.now()}_${idx}`, enabled: true, order: idx,
        conditional_logic: { enabled: false, operator: "AND", conditions: [] }
      }));
      setForm(f => ({ ...f, sections: sects, ai_instructions: result.overall_ai_instructions || f.ai_instructions }));
      toast.success("AI sections generated");
    } catch {
      toast.error("Failed to generate sections");
    } finally {
      setGenerating(false);
    }
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) {
      setForm(f => ({ ...f, tags: [...f.tags, t] }));
    }
    setTagInput("");
  };

  const removeTag = (tag) => {
    setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }));
  };

  const selectedCategory = CATEGORIES.find(c => c.value === form.category);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <a href={createPageUrl("NoteTemplates")} className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 transition-all text-slate-500 hover:text-slate-700 flex-shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </a>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-900 truncate">{isNew ? "New Template" : (form.name || "Edit Template")}</h1>
            {!isNew && template?.version && (
              <p className="text-xs text-slate-500">Version {template.version} · {template.category}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {!isNew && (
            <Button
              variant="outline"
              onClick={() => setShowVersionModal(true)}
              className="gap-2 text-sm"
            >
              <GitBranch className="w-4 h-4" /> Save as New Version
            </Button>
          )}
          <Button
            onClick={() => saveMutation.mutate(form)}
            disabled={!form.name || saveMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isNew ? "Create Template" : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* LEFT: Sections editor (main content) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-800">Note Sections</h2>
              <div className="flex items-center gap-2">
                <AISectionGenerator
                  onSectionGenerated={(section) => setForm(f => ({ ...f, sections: [...f.sections, section] }))}
                  trigger={({ onClick }) => (
                    <Button type="button" variant="outline" size="sm" onClick={onClick} className="gap-1.5 text-xs">
                      <Sparkles className="w-3 h-3" /> AI Section
                    </Button>
                  )}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateFull}
                  disabled={generating}
                  className="gap-1.5 text-xs"
                >
                  {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                  Full Template
                </Button>
              </div>
            </div>

            <SectionEditor
              sections={form.sections}
              onChange={(sections) => setForm(f => ({ ...f, sections }))}
              noteType={form.note_type}
              specialty={form.specialty}
              renderSectionActions={(section, index) => (
                <AIInstructionRefinement
                  currentInstructions={section.ai_instructions}
                  sectionName={section.name}
                  onApply={(refined) => {
                    const sects = [...form.sections];
                    sects[index].ai_instructions = refined;
                    setForm(f => ({ ...f, sections: sects }));
                  }}
                  trigger={({ onClick }) => (
                    <Button type="button" variant="ghost" size="sm" onClick={onClick} className="gap-1 text-blue-600 hover:bg-blue-50 text-xs">
                      <Wand2 className="w-3 h-3" /> Refine
                    </Button>
                  )}
                />
              )}
            />

            {form.sections.length === 0 && (
              <div className="text-center py-10 text-slate-400">
                <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No sections yet. Use AI to generate or add manually.</p>
              </div>
            )}
          </div>

          {/* Global AI Instructions */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <label className="text-sm font-semibold text-slate-800 mb-2 block">
              Global AI Instructions
            </label>
            <Textarea
              value={form.ai_instructions}
              onChange={(e) => setForm(f => ({ ...f, ai_instructions: e.target.value }))}
              placeholder="e.g., Be concise and use bullet points. Focus on clinical relevance. Highlight red flag symptoms."
              className="min-h-[100px] text-sm resize-none"
            />
            <p className="text-xs text-slate-400 mt-1.5">Applies to AI extraction across all sections in this template</p>
          </div>

          {/* Dynamic Fields */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-slate-800 mb-3">Dynamic Fields</h2>
            <DynamicFieldManager
              fields={form.dynamic_fields}
              onChange={(fields) => setForm(f => ({ ...f, dynamic_fields: fields }))}
            />
          </div>
        </div>

        {/* RIGHT: Metadata sidebar */}
        <div className="space-y-4">
          <SidebarPanel title="Basic Info" defaultOpen={true}>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Template Name *</label>
              <Input
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g., Cardiology Progress Note"
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Description</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Describe when and how to use this template"
                className="text-sm resize-none min-h-[70px]"
              />
            </div>
          </SidebarPanel>

          <SidebarPanel title="Classification" defaultOpen={true}>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Note Type</label>
              <Select value={form.note_type} onValueChange={(v) => setForm(f => ({ ...f, note_type: v }))}>
                <SelectTrigger className="text-sm">
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
              <label className="text-xs font-medium text-slate-600 mb-2 block">Category</label>
              <div className="grid grid-cols-2 gap-1.5">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all text-left ${
                      form.category === cat.value
                        ? `${cat.color} border-current shadow-sm`
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Specialty</label>
              <Input
                value={form.specialty}
                onChange={(e) => setForm(f => ({ ...f, specialty: e.target.value }))}
                placeholder="e.g., Cardiology, Neurology"
                className="text-sm"
              />
            </div>
          </SidebarPanel>

          <SidebarPanel title="Tags" icon={Tag} defaultOpen={false}>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                placeholder="Add tag..."
                className="text-sm"
              />
              <Button type="button" size="sm" onClick={addTag} variant="outline" className="flex-shrink-0">
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {form.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1 pl-2 pr-1 text-xs">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-red-500 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </SidebarPanel>

          {/* Summary */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Summary</p>
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Sections</span>
                <span className="font-semibold text-slate-900">{form.sections.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Active</span>
                <span className="font-semibold text-slate-900">{form.sections.filter(s => s.enabled).length}</span>
              </div>
              <div className="flex justify-between">
                <span>Dynamic fields</span>
                <span className="font-semibold text-slate-900">{form.dynamic_fields.length}</span>
              </div>
              {!isNew && template?.version && (
                <div className="flex justify-between">
                  <span>Version</span>
                  <span className="font-semibold text-slate-900">v{template.version}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Save as New Version Modal */}
      {showVersionModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <GitBranch className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Save as New Version</h3>
                <p className="text-xs text-slate-500">Current: v{template?.version || 1} → New: v{(template?.version || 1) + 1}</p>
              </div>
            </div>
            <div className="mb-4">
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">What changed?</label>
              <Textarea
                value={versionNotes}
                onChange={(e) => setVersionNotes(e.target.value)}
                placeholder="Describe the changes in this version..."
                className="resize-none min-h-[80px] text-sm"
                autoFocus
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowVersionModal(false)}>Cancel</Button>
              <Button
                onClick={() => newVersionMutation.mutate()}
                disabled={newVersionMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
              >
                {newVersionMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitBranch className="w-4 h-4" />}
                Create Version
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}