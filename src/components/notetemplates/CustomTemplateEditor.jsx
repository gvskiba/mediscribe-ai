import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { X, Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Sparkles, Info } from "lucide-react";
import { SPECIALTY_CONFIG } from "./templateData";
import { toast } from "sonner";

const T = {
  navy: "#050f1e", slate: "#0b1d35", panel: "#0d2240", edge: "#162d4f", border: "#1e3a5f",
  dim: "#4a7299", text: "#c8ddf0", bright: "#e8f4ff", teal: "#00d4bc", amber: "#f5a623", red: "#ff5c6c",
};

const FIELD_TYPES = [
  { value: "text",           label: "Text (single line)" },
  { value: "textarea",       label: "Textarea (multi-line)" },
  { value: "number",         label: "Number" },
  { value: "select",         label: "Dropdown (select one)" },
  { value: "multiselect",    label: "Multi-select (choose many)" },
  { value: "boolean",        label: "Yes / No toggle" },
  { value: "date",           label: "Date picker" },
  { value: "vitals_block",   label: "Vitals block (HR, BP, RR, Temp…)" },
  { value: "labs_block",     label: "Labs block (CBC, BMP…)" },
  { value: "exam_checklist", label: "Exam checklist" },
];

const NOTE_TYPES = ["Progress Note", "H&P", "Discharge Summary", "Consult Note", "Procedure Note", "ED Note", "Outpatient SOAP", "Psychiatry Eval", "Custom"];
const SPECIALTIES = Object.keys(SPECIALTY_CONFIG);
const ICONS = ["📋","❤️","🫁","🧠","🏥","🛏️","🩺","🔬","🦠","💊","💉","🩸","🦴","🧩","🚨","🌸","🔪","💧","📝","🚪"];

const inputStyle = (extra = {}) => ({
  width: "100%", padding: "8px 10px", background: "rgba(255,255,255,0.06)",
  border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12.5, color: T.bright,
  outline: "none", boxSizing: "border-box", fontFamily: "DM Sans, sans-serif", ...extra,
});

const labelStyle = { fontSize: 11, fontWeight: 700, color: T.dim, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 4 };

function newField() {
  return {
    id: `field_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    label: "", type: "text", required: false, placeholder: "", group: "General", width: "full",
    options: [], unit: "",
  };
}

function FieldRow({ field, index, onChange, onDelete }) {
  const [open, setOpen] = useState(index === 0);
  const needsOptions = ["select", "multiselect", "exam_checklist"].includes(field.type);

  return (
    <div style={{ background: T.slate, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 8 }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", cursor: "pointer" }}
      >
        <GripVertical size={14} color={T.dim} />
        <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: field.label ? T.bright : T.dim }}>
          {field.label || `Field ${index + 1}`}
        </div>
        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "rgba(255,255,255,0.07)", color: T.dim, border: `1px solid ${T.border}` }}>
          {FIELD_TYPES.find(f => f.value === field.type)?.label || field.type}
        </span>
        {field.required && <span style={{ fontSize: 10, color: T.amber, fontWeight: 700 }}>Required</span>}
        <button type="button" onClick={e => { e.stopPropagation(); onDelete(); }}
          style={{ background: "none", border: "none", cursor: "pointer", color: T.red, padding: 2, lineHeight: 0 }}>
          <Trash2 size={13} />
        </button>
        {open ? <ChevronUp size={13} color={T.dim} /> : <ChevronDown size={13} color={T.dim} />}
      </div>

      {open && (
        <div style={{ padding: "4px 14px 14px", borderTop: `1px solid ${T.border}` }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
            <div>
              <label style={labelStyle}>Field Label *</label>
              <input
                value={field.label}
                onChange={e => onChange({ ...field, label: e.target.value })}
                placeholder="e.g. Chief Complaint"
                style={inputStyle()}
              />
            </div>
            <div>
              <label style={labelStyle}>Input Type *</label>
              <select value={field.type} onChange={e => onChange({ ...field, type: e.target.value })} style={inputStyle({ cursor: "pointer" })}>
                {FIELD_TYPES.map(ft => <option key={ft.value} value={ft.value}>{ft.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Section Group</label>
              <input
                value={field.group || ""}
                onChange={e => onChange({ ...field, group: e.target.value })}
                list="group-suggestions"
                placeholder="e.g. History, Exam, Plan…"
                style={inputStyle()}
              />
              <datalist id="group-suggestions">
                {["History", "Background", "Exam", "Data", "Assessment", "Plan", "Overview", "Risk", "Consent"].map(g => (
                  <option key={g} value={g} />
                ))}
              </datalist>
            </div>
            <div>
              <label style={labelStyle}>Width</label>
              <select value={field.width || "full"} onChange={e => onChange({ ...field, width: e.target.value })} style={inputStyle({ cursor: "pointer" })}>
                <option value="full">Full width</option>
                <option value="half">Half width</option>
                <option value="third">One-third width</option>
              </select>
            </div>
            {!["vitals_block", "labs_block", "boolean"].includes(field.type) && (
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Placeholder / Help Text</label>
                <input
                  value={field.placeholder || ""}
                  onChange={e => onChange({ ...field, placeholder: e.target.value })}
                  placeholder="e.g. Enter patient's chief complaint in their own words…"
                  style={inputStyle()}
                />
              </div>
            )}
            {field.type === "number" && (
              <div>
                <label style={labelStyle}>Unit</label>
                <input
                  value={field.unit || ""}
                  onChange={e => onChange({ ...field, unit: e.target.value })}
                  placeholder="e.g. mg/dL, bpm, /10"
                  style={inputStyle()}
                />
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Required Field</label>
              <button
                type="button"
                onClick={() => onChange({ ...field, required: !field.required })}
                style={{
                  width: 40, height: 22, borderRadius: 11, position: "relative", cursor: "pointer",
                  background: field.required ? T.teal : T.border, border: "none", transition: "all 0.2s",
                }}
              >
                <div style={{
                  width: 16, height: 16, borderRadius: "50%", background: "white",
                  position: "absolute", top: 3, left: field.required ? 21 : 3, transition: "all 0.2s",
                }} />
              </button>
            </div>
          </div>

          {needsOptions && (
            <div style={{ marginTop: 12 }}>
              <label style={labelStyle}>Options (one per line)</label>
              <textarea
                value={(field.options || []).join("\n")}
                onChange={e => onChange({ ...field, options: e.target.value.split("\n").map(s => s.trim()).filter(Boolean) })}
                placeholder={"Option 1\nOption 2\nOption 3"}
                rows={4}
                style={inputStyle({ resize: "vertical", lineHeight: 1.6 })}
              />
            </div>
          )}

          <div style={{ marginTop: 10, padding: "7px 10px", background: `${T.teal}10`, border: `1px solid ${T.teal}25`, borderRadius: 6 }}>
            <span style={{ fontSize: 10, color: T.teal }}>
              <Info size={10} style={{ verticalAlign: "middle", marginRight: 4 }} />
              Use <code style={{ background: "rgba(0,212,188,0.1)", padding: "1px 4px", borderRadius: 3 }}>{"{{" + (field.id || "field_id") + "}}"}</code> in your AI prompt to insert this field's value.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomTemplateEditor({ template, onClose, onSave }) {
  const isEdit = !!template?.id;
  const [activeTab, setActiveTab] = useState("basics");

  const [form, setForm] = useState({
    name: template?.name || "",
    description: template?.description || "",
    icon: template?.icon || "📋",
    specialty: template?.specialty || "",
    note_type: template?.note_type || "Progress Note",
    category: template?.category || "general",
    tags: template?.tags || [],
    ai_instructions: template?.ai_instructions || "",
    dynamic_fields: template?.dynamic_fields || [],
    is_default: template?.is_default || false,
  });

  const [tagInput, setTagInput] = useState("");
  const [generatingPrompt, setGeneratingPrompt] = useState(false);

  const saveMutation = useMutation({
    mutationFn: (data) =>
      isEdit
        ? base44.entities.NoteTemplate.update(template.id, data)
        : base44.entities.NoteTemplate.create(data),
    onSuccess: () => {
      toast.success(isEdit ? "Template updated!" : "Template created!");
      onSave();
    },
    onError: () => toast.error("Failed to save template"),
  });

  const setField = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const addField = () => setField("dynamic_fields", [...form.dynamic_fields, newField()]);
  const updateField = (i, updated) => {
    const next = [...form.dynamic_fields];
    next[i] = updated;
    setField("dynamic_fields", next);
  };
  const deleteField = (i) => setField("dynamic_fields", form.dynamic_fields.filter((_, idx) => idx !== i));

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) {
      setField("tags", [...form.tags, t]);
      setTagInput("");
    }
  };

  const buildPromptFromFields = () => {
    const fieldList = form.dynamic_fields
      .filter(f => f.id && f.label)
      .map(f => `${f.label}: {{${f.id}}}`)
      .join(", ");
    return `You are Notrya AI generating a professional ${form.note_type || "clinical"} note${form.specialty ? " for " + form.specialty : ""}.\n\nPhysician-Provided Data:\n${fieldList || "[No fields defined yet]"}\n\nGenerate a complete, professional medical note based on the data above. Use appropriate clinical section headers (Chief Complaint, HPI, Assessment & Plan, etc.). Write in professional medical language. Do not fabricate any clinical data not explicitly provided.`;
  };

  const handleAutoPrompt = async () => {
    setGeneratingPrompt(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are helping a physician create an AI note-generation prompt. 
        
Template Name: "${form.name}"
Specialty: "${form.specialty}"
Note Type: "${form.note_type}"
Fields: ${form.dynamic_fields.map(f => `${f.label} ({{${f.id}}})`).join(", ")}

Write a detailed, high-quality system prompt for an AI that will generate a professional ${form.note_type} note using these fields. 
The prompt should:
1. Instruct the AI to use professional medical language
2. List all the field placeholders like {{field_id}} that should be substituted
3. Specify what sections the note should have
4. Tell the AI not to fabricate data not provided

Return ONLY the prompt text, nothing else.`,
      });
      setField("ai_instructions", typeof result === "string" ? result : buildPromptFromFields());
      toast.success("AI prompt generated!");
    } catch (e) {
      setField("ai_instructions", buildPromptFromFields());
      toast.success("Prompt built from fields!");
    } finally {
      setGeneratingPrompt(false);
    }
  };

  const handleSave = () => {
    if (!form.name.trim()) { toast.error("Template name is required"); return; }
    if (form.dynamic_fields.length === 0) { toast.error("Add at least one field"); return; }
    const badFields = form.dynamic_fields.filter(f => !f.label.trim());
    if (badFields.length > 0) { toast.error("All fields need a label"); return; }
    saveMutation.mutate(form);
  };

  const TABS = [
    { id: "basics", label: "Basics" },
    { id: "fields", label: `Fields (${form.dynamic_fields.length})` },
    { id: "prompt", label: "AI Prompt" },
  ];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000, background: "rgba(5,15,30,0.85)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
    }}>
      <div style={{
        width: "100%", maxWidth: 860, background: T.navy, border: `1px solid ${T.border}`,
        borderRadius: 16, display: "flex", flexDirection: "column", maxHeight: "95vh", overflow: "hidden",
        boxShadow: "0 25px 80px rgba(0,0,0,0.7)",
      }}>
        {/* Modal Header */}
        <div style={{ padding: "18px 24px 14px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <span style={{ fontSize: 26 }}>{form.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: T.bright, fontFamily: "Playfair Display, serif" }}>
              {isEdit ? "Edit Template" : "Create New Template"}
            </div>
            <div style={{ fontSize: 12, color: T.dim }}>{form.name || "Untitled Template"}</div>
          </div>
          <button type="button" onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: T.dim, lineHeight: 0 }}>
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: `1px solid ${T.border}`, flexShrink: 0, padding: "0 24px" }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "12px 16px", background: "none", border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 600,
                color: activeTab === tab.id ? T.teal : T.dim,
                borderBottom: `2px solid ${activeTab === tab.id ? T.teal : "transparent"}`,
                transition: "all 0.15s", marginBottom: -1,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>

          {/* BASICS TAB */}
          {activeTab === "basics" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={labelStyle}>Template Icon</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {ICONS.map(ic => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setField("icon", ic)}
                      style={{
                        width: 38, height: 38, borderRadius: 8, fontSize: 20, cursor: "pointer",
                        background: form.icon === ic ? `${T.teal}22` : "rgba(255,255,255,0.05)",
                        border: `2px solid ${form.icon === ic ? T.teal : T.border}`,
                      }}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Template Name *</label>
                  <input
                    value={form.name}
                    onChange={e => setField("name", e.target.value)}
                    placeholder="e.g. ED — Chest Pain Evaluation"
                    style={inputStyle()}
                  />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => setField("description", e.target.value)}
                    placeholder="Brief description of when to use this template…"
                    rows={2}
                    style={inputStyle({ resize: "vertical" })}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Specialty</label>
                  <select value={form.specialty} onChange={e => setField("specialty", e.target.value)} style={inputStyle({ cursor: "pointer" })}>
                    <option value="">— select specialty —</option>
                    {SPECIALTIES.map(s => <option key={s} value={s}>{SPECIALTY_CONFIG[s].icon} {s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Note Type</label>
                  <select value={form.note_type} onChange={e => setField("note_type", e.target.value)} style={inputStyle({ cursor: "pointer" })}>
                    {NOTE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Tags (for search/filter)</label>
                <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                  {form.tags.map(tag => (
                    <span key={tag} style={{
                      padding: "3px 10px", borderRadius: 20, fontSize: 11,
                      background: `${T.teal}18`, border: `1px solid ${T.teal}40`, color: T.teal,
                      display: "flex", alignItems: "center", gap: 5,
                    }}>
                      {tag}
                      <button type="button" onClick={() => setField("tags", form.tags.filter(t => t !== tag))}
                        style={{ background: "none", border: "none", cursor: "pointer", color: T.teal, padding: 0, lineHeight: 0, fontSize: 12 }}>×</button>
                    </span>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                    placeholder="Add a tag and press Enter…"
                    style={inputStyle({ flex: 1 })}
                  />
                  <button type="button" onClick={addTag}
                    style={{ padding: "8px 14px", borderRadius: 8, background: `${T.teal}20`, border: `1px solid ${T.teal}50`, color: T.teal, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* FIELDS TAB */}
          {activeTab === "fields" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.bright }}>Form Fields</div>
                  <div style={{ fontSize: 12, color: T.dim, marginTop: 2 }}>Define the structured inputs clinicians will fill in when using this template.</div>
                </div>
                <button
                  type="button"
                  onClick={addField}
                  style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8,
                    background: `${T.teal}20`, border: `1px solid ${T.teal}50`, color: T.teal,
                    fontSize: 12, fontWeight: 700, cursor: "pointer",
                  }}
                >
                  <Plus size={14} /> Add Field
                </button>
              </div>

              {form.dynamic_fields.length === 0 ? (
                <div style={{
                  textAlign: "center", padding: "40px 20px", border: `2px dashed ${T.border}`,
                  borderRadius: 12, color: T.dim,
                }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>🔡</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>No fields yet</div>
                  <div style={{ fontSize: 12, marginBottom: 16 }}>Add fields that clinicians will fill in when using this template.</div>
                  <button type="button" onClick={addField}
                    style={{ padding: "8px 18px", borderRadius: 8, background: `${T.teal}20`, border: `1px solid ${T.teal}50`, color: T.teal, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    <Plus size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />Add First Field
                  </button>
                </div>
              ) : (
                <div>
                  {form.dynamic_fields.map((field, i) => (
                    <FieldRow
                      key={field.id}
                      field={field}
                      index={i}
                      onChange={updated => updateField(i, updated)}
                      onDelete={() => deleteField(i)}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={addField}
                    style={{
                      width: "100%", padding: "10px", borderRadius: 8, marginTop: 4,
                      background: "rgba(255,255,255,0.03)", border: `1px dashed ${T.border}`,
                      color: T.dim, fontSize: 12, fontWeight: 600, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}
                  >
                    <Plus size={13} /> Add Another Field
                  </button>
                </div>
              )}
            </div>
          )}

          {/* PROMPT TAB */}
          {activeTab === "prompt" && (
            <div>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.bright }}>AI Generation Prompt</div>
                  <div style={{ fontSize: 12, color: T.dim, marginTop: 2 }}>
                    This prompt is sent to the AI when generating a note. Use <code style={{ background: "rgba(0,212,188,0.1)", padding: "1px 5px", borderRadius: 3, color: T.teal }}>{"{{field_id}}"}</code> placeholders.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAutoPrompt}
                  disabled={generatingPrompt}
                  style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8,
                    background: `${T.teal}20`, border: `1px solid ${T.teal}50`, color: T.teal,
                    fontSize: 12, fontWeight: 700, cursor: generatingPrompt ? "not-allowed" : "pointer",
                    opacity: generatingPrompt ? 0.6 : 1,
                  }}
                >
                  <Sparkles size={13} /> {generatingPrompt ? "Generating…" : "Auto-Generate Prompt"}
                </button>
              </div>

              {form.dynamic_fields.length > 0 && (
                <div style={{ marginBottom: 12, padding: "10px 12px", background: `${T.teal}08`, border: `1px solid ${T.teal}20`, borderRadius: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.teal, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Available Placeholders
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {form.dynamic_fields.filter(f => f.id && f.label).map(f => (
                      <code
                        key={f.id}
                        style={{
                          fontSize: 10, padding: "2px 6px", borderRadius: 4,
                          background: "rgba(0,212,188,0.12)", color: T.teal, border: `1px solid ${T.teal}30`,
                          cursor: "pointer",
                        }}
                        title={`Click to copy: {{${f.id}}}`}
                        onClick={() => navigator.clipboard.writeText(`{{${f.id}}}`).then(() => toast.success("Copied!"))}
                      >
                        {"{{"}{f.id}{"}}"}
                      </code>
                    ))}
                  </div>
                </div>
              )}

              <textarea
                value={form.ai_instructions}
                onChange={e => setField("ai_instructions", e.target.value)}
                placeholder={`Example:\nYou are Notrya AI generating a professional ${form.note_type || "clinical"} note.\n\nData:\n- Chief Complaint: {{cc}}\n- History: {{hpi}}\n\nGenerate a complete note with CC, HPI, Assessment & Plan...`}
                rows={16}
                style={inputStyle({ resize: "vertical", lineHeight: 1.7, fontFamily: "monospace", fontSize: 12 })}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.border}`, display: "flex", gap: 10, justifyContent: "flex-end", flexShrink: 0 }}>
          <button type="button" onClick={onClose}
            style={{ padding: "9px 20px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: `1px solid ${T.border}`, color: T.text, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saveMutation.isPending}
            style={{
              padding: "9px 24px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer",
              background: saveMutation.isPending ? "rgba(255,255,255,0.05)" : `linear-gradient(135deg, ${T.teal}, #00a896)`,
              border: `1px solid ${saveMutation.isPending ? T.border : T.teal}`,
              color: saveMutation.isPending ? T.dim : "#050f1e",
            }}
          >
            {saveMutation.isPending ? "Saving…" : (isEdit ? "Save Changes" : "Create Template")}
          </button>
        </div>
      </div>
    </div>
  );
}