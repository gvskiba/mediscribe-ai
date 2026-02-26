import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, ChevronDown, ChevronUp, Eye, EyeOff, Sparkles, FileText, Tag } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const NOTE_TYPES = [
  { value: "progress_note", label: "Progress Note" },
  { value: "h_and_p", label: "History & Physical" },
  { value: "discharge_summary", label: "Discharge Summary" },
  { value: "consult", label: "Consultation" },
  { value: "procedure_note", label: "Procedure Note" },
];

const ENCOUNTER_TYPES = [
  { value: "new_patient", label: "New Patient" },
  { value: "follow_up", label: "Follow-Up Visit" },
  { value: "annual_wellness", label: "Annual Wellness" },
  { value: "acute_visit", label: "Acute / Sick Visit" },
  { value: "er_visit", label: "ER Visit" },
  { value: "consult", label: "Consultation" },
  { value: "post_op", label: "Post-Op Follow-Up" },
  { value: "chronic_disease", label: "Chronic Disease Management" },
  { value: "preventive", label: "Preventive Care" },
  { value: "other", label: "Other" },
];

const CATEGORIES = [
  "general", "cardiology", "pulmonology", "endocrinology", "neurology",
  "oncology", "pediatrics", "emergency", "surgery", "psychiatry", "custom"
];

// All possible note sections with metadata
const ALL_SECTIONS = [
  {
    id: "chief_complaint",
    name: "Chief Complaint",
    field: "chief_complaint",
    description: "Primary reason for the clinical encounter",
    ai_instructions: "Extract the primary reason for the clinical encounter in 1-2 concise sentences",
    order: 0,
  },
  {
    id: "history_of_present_illness",
    name: "History of Present Illness",
    field: "history_of_present_illness",
    description: "Detailed narrative using OLDCARTS framework",
    ai_instructions: "Extract detailed HPI with onset, location, duration, character, alleviating/aggravating factors, radiation, temporal patterns, and severity (OLDCARTS)",
    order: 1,
  },
  {
    id: "medical_history",
    name: "Medical History",
    field: "medical_history",
    description: "Relevant past medical and surgical history",
    ai_instructions: "Extract past medical history, surgical history, hospitalizations, and relevant family/social history",
    order: 2,
  },
  {
    id: "review_of_systems",
    name: "Review of Systems",
    field: "review_of_systems",
    description: "Systematic review by body system",
    ai_instructions: "Organize ROS by body system: constitutional, HEENT, cardiovascular, respiratory, GI, GU, musculoskeletal, neurologic, psychiatric, skin",
    order: 3,
  },
  {
    id: "physical_exam",
    name: "Physical Examination",
    field: "physical_exam",
    description: "Objective exam findings and vital signs",
    ai_instructions: "Extract vital signs and structured physical exam findings organized by body system",
    order: 4,
  },
  {
    id: "vital_signs",
    name: "Vital Signs",
    field: "vital_signs",
    description: "Structured vital signs data",
    ai_instructions: "Extract all vital signs including temperature, heart rate, blood pressure, respiratory rate, oxygen saturation, height, and weight",
    order: 5,
  },
  {
    id: "assessment",
    name: "Assessment",
    field: "assessment",
    description: "Clinical interpretation and diagnoses",
    ai_instructions: "Provide clinical assessment including primary diagnosis, differential diagnoses, and interpretation of findings",
    order: 6,
  },
  {
    id: "plan",
    name: "Plan",
    field: "plan",
    description: "Treatment and management plan",
    ai_instructions: "Extract comprehensive plan: medications, diagnostic workup, referrals, follow-up, and patient education",
    order: 7,
  },
  {
    id: "lab_findings",
    name: "Lab Findings",
    field: "lab_findings",
    description: "Laboratory results and interpretation",
    ai_instructions: "Organize lab results by panel with values, reference ranges, and clinical significance",
    order: 8,
  },
  {
    id: "imaging_findings",
    name: "Imaging Findings",
    field: "imaging_findings",
    description: "Radiology and imaging results",
    ai_instructions: "Extract imaging study type, findings, and radiologist impressions",
    order: 9,
  },
  {
    id: "mdm",
    name: "Medical Decision Making",
    field: "mdm",
    description: "Clinical reasoning and decision complexity",
    ai_instructions: "Document MDM complexity, data reviewed, risk analysis, and clinical reasoning supporting the management plan",
    order: 10,
  },
  {
    id: "medications",
    name: "Medications",
    field: "medications",
    description: "Current and prescribed medications",
    ai_instructions: "Extract all medications with dosing, frequency, route, and indication",
    order: 11,
  },
  {
    id: "diagnoses",
    name: "Diagnoses / ICD Codes",
    field: "diagnoses",
    description: "Diagnosis list with ICD codes",
    ai_instructions: "Extract all diagnoses with ICD-10 codes where applicable, noting primary vs secondary diagnoses",
    order: 12,
  },
  {
    id: "discharge_summary",
    name: "Discharge Summary",
    field: "discharge_summary",
    description: "Discharge instructions and follow-up plan",
    ai_instructions: "Extract hospital course summary, discharge condition, medications at discharge, activity restrictions, diet, and follow-up appointments",
    order: 13,
  },
  {
    id: "disposition_plan",
    name: "Disposition Plan",
    field: "disposition_plan",
    description: "Patient disposition and care transition",
    ai_instructions: "Document patient disposition, care setting, transition plan, and responsible provider",
    order: 14,
  },
];

function hasContent(note, field) {
  if (!note) return false;
  const val = note[field];
  if (!val) return false;
  if (Array.isArray(val)) return val.length > 0;
  if (typeof val === "object") return Object.keys(val).length > 0;
  return String(val).trim().length > 0;
}

function SectionCard({ section, selected, onToggle, onEdit, noteHasContent }) {
  const [showContent, setShowContent] = useState(false);
  const [editing, setEditing] = useState(false);
  const [localName, setLocalName] = useState(section.name);
  const [localInstructions, setLocalInstructions] = useState(section.ai_instructions);

  const handleSaveEdit = () => {
    onEdit({ ...section, name: localName, ai_instructions: localInstructions });
    setEditing(false);
  };

  return (
    <div className={`rounded-xl border-2 transition-all ${selected ? "border-blue-400 bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
      <div className="flex items-start gap-3 p-3">
        {/* Checkbox */}
        <button
          onClick={onToggle}
          className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${selected ? "bg-blue-500 border-blue-500" : "border-slate-300 hover:border-blue-400"}`}
        >
          {selected && <Check className="w-3 h-3 text-white" />}
        </button>

        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-2">
              <Input
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                className="text-sm font-medium"
                placeholder="Section name"
              />
              <Textarea
                value={localInstructions}
                onChange={(e) => setLocalInstructions(e.target.value)}
                className="text-xs min-h-[60px]"
                placeholder="AI extraction instructions..."
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit} className="text-xs bg-blue-600 hover:bg-blue-700 h-7 px-3">Save</Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(false)} className="text-xs h-7 px-3">Cancel</Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm text-slate-900">{localName}</span>
                {noteHasContent && (
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">Has data</Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{section.description}</p>
            </>
          )}
        </div>

        {!editing && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-blue-500 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50"
              title="Customize"
            >
              Edit
            </button>
            <button
              onClick={() => setShowContent(v => !v)}
              className="text-slate-400 hover:text-slate-600 p-1"
              title="View AI instructions"
            >
              {showContent ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showContent && !editing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1 ml-8 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">AI Instructions</p>
              <p className="text-xs text-slate-600">{localInstructions}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CreateTemplateFromNote({ open, onClose, note, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = metadata, 2 = sections
  const [selectedSections, setSelectedSections] = useState(new Set(
    ALL_SECTIONS.filter(s => ["chief_complaint", "history_of_present_illness", "review_of_systems", "physical_exam", "assessment", "plan"].map(f => f).includes(s.field)).map(s => s.id)
  ));
  const [customizedSections, setCustomizedSections] = useState({});
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    note_type: note?.note_type || "progress_note",
    encounter_type: "",
    specialty: note?.specialty || "",
    category: "general",
    tags: [],
    ai_instructions: "",
  });
  const [tagInput, setTagInput] = useState("");

  const sectionsWithContent = useMemo(() =>
    ALL_SECTIONS.map(s => ({ ...s, noteHasContent: hasContent(note, s.field) })),
    [note]
  );

  const sectionsWithData = sectionsWithContent.filter(s => s.noteHasContent);
  const sectionsWithoutData = sectionsWithContent.filter(s => !s.noteHasContent);

  const toggleSection = (id) => {
    const next = new Set(selectedSections);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedSections(next);
  };

  const handleEditSection = (updated) => {
    setCustomizedSections(prev => ({ ...prev, [updated.id]: updated }));
  };

  const addTag = (e) => {
    if (e.key === "Enter" && tagInput.trim()) {
      setFormData(prev => ({ ...prev, tags: [...(prev.tags || []), tagInput.trim()] }));
      setTagInput("");
    }
  };

  const removeTag = (tag) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const selectAllWithData = () => {
    const next = new Set(selectedSections);
    sectionsWithData.forEach(s => next.add(s.id));
    setSelectedSections(next);
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) { toast.error("Please enter a template name"); return; }
    if (selectedSections.size === 0) { toast.error("Select at least one section"); return; }

    setLoading(true);
    try {
      const sections = ALL_SECTIONS
        .filter(s => selectedSections.has(s.id))
        .map((s, idx) => {
          const customized = customizedSections[s.id] || s;
          return {
            id: s.id,
            name: customized.name,
            description: s.description,
            ai_instructions: customized.ai_instructions,
            enabled: true,
            order: s.order,
            conditional_logic: { enabled: false, operator: "AND", conditions: [] },
          };
        });

      const encounterLabel = ENCOUNTER_TYPES.find(e => e.value === formData.encounter_type)?.label;
      const aiInstructions = formData.ai_instructions ||
        `Template for ${encounterLabel || "clinical"} encounters${formData.specialty ? ` in ${formData.specialty}` : ""}. Based on note from ${note?.patient_name || "patient"}.`;

      await base44.entities.NoteTemplate.create({
        name: formData.name,
        description: formData.description,
        note_type: formData.note_type,
        specialty: formData.specialty,
        category: formData.category,
        tags: [
          ...(formData.tags || []),
          ...(formData.encounter_type ? [formData.encounter_type.replace(/_/g, " ")] : []),
        ],
        sections,
        ai_instructions: aiInstructions,
        is_default: false,
        version: 1,
        usage_count: 0,
      });

      toast.success(`Template "${formData.name}" created with ${sections.length} sections`);
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error("Failed to create template");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Create Template from Note
          </DialogTitle>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mt-2">
          {[{ n: 1, label: "Template Info" }, { n: 2, label: "Select Sections" }].map(({ n, label }) => (
            <React.Fragment key={n}>
              <div
                className={`flex items-center gap-2 cursor-pointer ${step === n ? "text-blue-600" : step > n ? "text-emerald-600" : "text-slate-400"}`}
                onClick={() => n < step && setStep(n)}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === n ? "bg-blue-600 text-white" : step > n ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"}`}>
                  {step > n ? <Check className="w-3 h-3" /> : n}
                </div>
                <span className="text-sm font-medium">{label}</span>
              </div>
              {n < 2 && <div className="flex-1 h-px bg-slate-200" />}
            </React.Fragment>
          ))}
        </div>

        {/* Source Note Info */}
        {note && (
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <p className="text-xs text-slate-500 mb-1">Source note</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm text-slate-900">{note.patient_name}</span>
              {note.date_of_visit && <span className="text-xs text-slate-500">{note.date_of_visit}</span>}
              <Badge variant="outline" className="text-xs">{NOTE_TYPES.find(t => t.value === note.note_type)?.label || "Note"}</Badge>
              <Badge className="bg-emerald-100 text-emerald-700 text-xs">{sectionsWithData.length} sections with data</Badge>
            </div>
          </div>
        )}

        {/* Step 1: Template Metadata */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Template Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Cardiology Follow-Up, New Patient H&P"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="When to use this template..."
                className="min-h-[70px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Note Type</label>
                <Select value={formData.note_type} onValueChange={(v) => setFormData({ ...formData, note_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {NOTE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Encounter Type</label>
                <Select value={formData.encounter_type} onValueChange={(v) => setFormData({ ...formData, encounter_type: v })}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {ENCOUNTER_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Specialty</label>
                <Input
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  placeholder="e.g., Cardiology"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Category</label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
                <Tag className="w-4 h-4" /> Tags
              </div>
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={addTag}
                placeholder="Type a tag and press Enter..."
              />
              {formData.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {formData.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="gap-1 cursor-pointer" onClick={() => removeTag(tag)}>
                      {tag} <span className="text-slate-400">×</span>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
                <Sparkles className="w-4 h-4 text-blue-500" /> Global AI Instructions (optional)
              </div>
              <Textarea
                value={formData.ai_instructions}
                onChange={(e) => setFormData({ ...formData, ai_instructions: e.target.value })}
                placeholder="e.g., Be concise, use bullet points, focus on actionable items..."
                className="min-h-[70px]"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={() => setStep(2)}
                disabled={!formData.name.trim()}
                className="bg-blue-600 hover:bg-blue-700 gap-2"
              >
                Next: Select Sections →
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Section Selection */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">{selectedSections.size} sections selected</p>
                <p className="text-xs text-slate-500">Click sections to include/exclude. Use "Edit" to customize names and AI instructions.</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={selectAllWithData} className="text-xs gap-1">
                  <Check className="w-3 h-3" /> Select With Data
                </Button>
                <Button size="sm" variant="outline" onClick={() => setSelectedSections(new Set(ALL_SECTIONS.map(s => s.id)))} className="text-xs">
                  All
                </Button>
                <Button size="sm" variant="outline" onClick={() => setSelectedSections(new Set())} className="text-xs">
                  None
                </Button>
              </div>
            </div>

            {sectionsWithData.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  Sections with data from this note ({sectionsWithData.length})
                </p>
                <div className="space-y-2">
                  {sectionsWithData.map(section => (
                    <SectionCard
                      key={section.id}
                      section={{ ...section, ...(customizedSections[section.id] || {}) }}
                      selected={selectedSections.has(section.id)}
                      onToggle={() => toggleSection(section.id)}
                      onEdit={handleEditSection}
                      noteHasContent={true}
                    />
                  ))}
                </div>
              </div>
            )}

            {sectionsWithoutData.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-300 inline-block" />
                  Additional sections ({sectionsWithoutData.length})
                </p>
                <div className="space-y-2">
                  {sectionsWithoutData.map(section => (
                    <SectionCard
                      key={section.id}
                      section={{ ...section, ...(customizedSections[section.id] || {}) }}
                      selected={selectedSections.has(section.id)}
                      onToggle={() => toggleSection(section.id)}
                      onEdit={handleEditSection}
                      noteHasContent={false}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setStep(1)}>
                ← Back
              </Button>
              <Button
                onClick={handleCreate}
                disabled={loading || selectedSections.size === 0}
                className="bg-blue-600 hover:bg-blue-700 gap-2"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><Check className="w-4 h-4" /> Create Template ({selectedSections.size} sections)</>}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}