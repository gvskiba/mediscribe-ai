import React, { useState } from "react";
import { CheckCircle, AlertCircle, Sparkles, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { SPECIALTY_CONFIG } from "./templateData";

const T = {
  navy: "#050f1e", panel: "#0d2240", edge: "#162d4f", border: "#1e3a5f",
  muted: "#2a4d72", dim: "#4a7299", text: "#c8ddf0", bright: "#e8f4ff", teal: "#00d4bc", amber: "#f5a623", red: "#ff5c6c",
};

const inputStyle = {
  width: "100%", padding: "7px 10px", background: "rgba(255,255,255,0.06)",
  border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12.5, color: T.bright,
  outline: "none", boxSizing: "border-box", fontFamily: "DM Sans, sans-serif",
};

const labelStyle = {
  fontSize: 11, fontWeight: 700, color: T.dim, textTransform: "uppercase", letterSpacing: "0.05em",
  display: "block", marginBottom: 4,
};

function TextInput({ field, value, onChange }) {
  return (
    <input
      type="text"
      value={value || ""}
      onChange={e => onChange(e.target.value)}
      placeholder={field.placeholder}
      style={inputStyle}
    />
  );
}

function NumberInput({ field, value, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <input
        type="number"
        value={value || ""}
        onChange={e => onChange(e.target.value)}
        placeholder={field.placeholder || "0"}
        style={{ ...inputStyle, width: "100%" }}
      />
      {field.unit && <span style={{ fontSize: 11, color: T.dim, whiteSpace: "nowrap" }}>{field.unit}</span>}
    </div>
  );
}

function TextareaInput({ field, value, onChange }) {
  return (
    <textarea
      value={value || ""}
      onChange={e => onChange(e.target.value)}
      placeholder={field.placeholder}
      rows={3}
      style={{ ...inputStyle, resize: "vertical", minHeight: 64, lineHeight: 1.5 }}
    />
  );
}

function SelectInput({ field, value, onChange }) {
  return (
    <select
      value={value || ""}
      onChange={e => onChange(e.target.value)}
      style={{ ...inputStyle, cursor: "pointer" }}
    >
      <option value="">— select —</option>
      {(field.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  );
}

function MultiSelectInput({ field, value, onChange }) {
  const selected = Array.isArray(value) ? value : (value ? value.split(", ").filter(Boolean) : []);
  const toggle = (opt) => {
    const next = selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt];
    onChange(next);
  };
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {(field.options || []).map(opt => {
        const sel = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            style={{
              padding: "4px 10px", borderRadius: 20, fontSize: 11, cursor: "pointer",
              background: sel ? `${T.teal}22` : "rgba(255,255,255,0.05)",
              border: `1px solid ${sel ? T.teal : T.border}`,
              color: sel ? T.teal : T.dim, transition: "all 0.12s",
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function BooleanInput({ field, value, onChange }) {
  const v = value === undefined ? (field.default ?? false) : value;
  return (
    <button
      onClick={() => onChange(!v)}
      style={{
        display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", borderRadius: 8,
        background: v ? `${T.teal}18` : "rgba(255,255,255,0.05)",
        border: `1px solid ${v ? T.teal : T.border}`, cursor: "pointer", transition: "all 0.15s",
      }}
    >
      <div style={{
        width: 32, height: 18, borderRadius: 9, background: v ? T.teal : T.border, position: "relative", transition: "all 0.2s",
      }}>
        <div style={{
          width: 14, height: 14, borderRadius: "50%", background: "white",
          position: "absolute", top: 2, left: v ? 16 : 2, transition: "all 0.2s",
        }} />
      </div>
      <span style={{ fontSize: 12, color: v ? T.teal : T.dim, fontWeight: 600 }}>{v ? "Yes" : "No"}</span>
    </button>
  );
}

function VitalsBlock({ value, onChange }) {
  const v = value || {};
  const vitals = [
    { key: "hr",   label: "HR",      unit: "bpm",   placeholder: "72" },
    { key: "sbp",  label: "SBP",     unit: "mmHg",  placeholder: "120" },
    { key: "dbp",  label: "DBP",     unit: "mmHg",  placeholder: "80" },
    { key: "rr",   label: "RR",      unit: "/min",  placeholder: "16" },
    { key: "temp", label: "Temp",    unit: "°F",    placeholder: "98.6" },
    { key: "spo2", label: "SpO₂",    unit: "%",     placeholder: "98" },
    { key: "wt",   label: "Weight",  unit: "kg",    placeholder: "70" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
      {vitals.map(vit => (
        <div key={vit.key}>
          <div style={{ ...labelStyle, fontSize: 10, marginBottom: 3 }}>{vit.label} <span style={{ color: T.border }}>{vit.unit}</span></div>
          <input
            type="number"
            value={v[vit.key] || ""}
            onChange={e => onChange({ ...v, [vit.key]: e.target.value })}
            placeholder={vit.placeholder}
            style={{ ...inputStyle, fontSize: 12 }}
          />
        </div>
      ))}
    </div>
  );
}

function ExamChecklist({ field, value, onChange }) {
  const selected = Array.isArray(value) ? value : (field.options || []);
  const toggle = (opt) => {
    const next = selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt];
    onChange(next);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {(field.options || []).map(opt => {
        const checked = selected.includes(opt);
        return (
          <div key={opt} onClick={() => toggle(opt)} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <div style={{
              width: 16, height: 16, borderRadius: 4, border: `2px solid ${checked ? T.teal : T.border}`,
              background: checked ? T.teal : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.12s",
            }}>
              {checked && <CheckCircle size={10} color="#050f1e" />}
            </div>
            <span style={{ fontSize: 11.5, color: checked ? T.text : T.dim }}>{opt}</span>
          </div>
        );
      })}
    </div>
  );
}

function LabsBlock({ value, onChange }) {
  const v = value || {};
  const labs = [
    { key: "wbc",   label: "WBC",     unit: "K/µL"  },
    { key: "hgb",   label: "Hgb",     unit: "g/dL"  },
    { key: "plt",   label: "Plt",     unit: "K/µL"  },
    { key: "na",    label: "Na",      unit: "mEq/L" },
    { key: "k",     label: "K",       unit: "mEq/L" },
    { key: "cl",    label: "Cl",      unit: "mEq/L" },
    { key: "co2",   label: "CO₂",     unit: "mEq/L" },
    { key: "bun",   label: "BUN",     unit: "mg/dL" },
    { key: "cr",    label: "Cr",      unit: "mg/dL" },
    { key: "glu",   label: "Glu",     unit: "mg/dL" },
    { key: "trop",  label: "Trop",    unit: "ng/mL" },
    { key: "bnp",   label: "BNP",     unit: "pg/mL" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
      {labs.map(lab => (
        <div key={lab.key}>
          <div style={{ ...labelStyle, fontSize: 10, marginBottom: 3 }}>{lab.label} <span style={{ color: T.border }}>{lab.unit}</span></div>
          <input
            type="number"
            value={v[lab.key] || ""}
            onChange={e => onChange({ ...v, [lab.key]: e.target.value })}
            placeholder="—"
            style={{ ...inputStyle, fontSize: 12 }}
          />
        </div>
      ))}
    </div>
  );
}

function DateInput({ field, value, onChange }) {
  return (
    <input
      type="date"
      value={value || ""}
      onChange={e => onChange(e.target.value)}
      style={inputStyle}
    />
  );
}

function FieldRenderer({ field, value, onChange }) {
  switch (field.type) {
    case "text":           return <TextInput field={field} value={value} onChange={onChange} />;
    case "number":         return <NumberInput field={field} value={value} onChange={onChange} />;
    case "textarea":       return <TextareaInput field={field} value={value} onChange={onChange} />;
    case "select":         return <SelectInput field={field} value={value} onChange={onChange} />;
    case "multiselect":    return <MultiSelectInput field={field} value={value} onChange={onChange} />;
    case "boolean":        return <BooleanInput field={field} value={value} onChange={onChange} />;
    case "vitals_block":   return <VitalsBlock value={value} onChange={onChange} />;
    case "exam_checklist": return <ExamChecklist field={field} value={value} onChange={onChange} />;
    case "labs_block":     return <LabsBlock value={value} onChange={onChange} />;
    case "date":           return <DateInput field={field} value={value} onChange={onChange} />;
    // med_list, allergy_list, ros_checklist — fallback to textarea
    default:               return <TextareaInput field={field} value={value} onChange={onChange} />;
  }
}

export default function TemplateForm({ template, fieldValues, onChange, onGenerate, isGenerating, requiredFilled, totalRequired }) {
  const [openGroups, setOpenGroups] = useState({});
  const cfg = SPECIALTY_CONFIG[template.specialty] || { icon: "📄", color: T.teal };

  // Group fields
  const groups = {};
  (template.fields || []).forEach(f => {
    const g = f.group || "General";
    if (!groups[g]) groups[g] = [];
    groups[g].push(f);
  });

  const toggleGroup = (g) => setOpenGroups(prev => ({ ...prev, [g]: !prev[g] }));

  const filledRequired = (template.fields || []).filter(f => f.required && fieldValues[f.id] !== undefined && fieldValues[f.id] !== "" && fieldValues[f.id] !== null).length;
  const allRequired = (template.fields || []).filter(f => f.required).length;
  const progress = allRequired > 0 ? Math.round((filledRequired / allRequired) * 100) : 100;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Template Header */}
      <div style={{ padding: "16px 20px 12px", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 28, lineHeight: 1 }}>{template.icon}</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.bright, lineHeight: 1.2 }}>{template.name}</div>
            <div style={{ fontSize: 12, color: T.dim, marginTop: 3 }}>{template.description}</div>
            <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: `${cfg.color}20`, color: cfg.color, border: `1px solid ${cfg.color}40` }}>
                {cfg.icon} {template.specialty}
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "rgba(255,255,255,0.07)", color: T.dim, border: `1px solid ${T.border}` }}>
                {template.note_type}
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "rgba(255,255,255,0.07)", color: T.dim, border: `1px solid ${T.border}` }}>
                {template.setting}
              </span>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, height: 4, background: T.edge, borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: progress === 100 ? T.teal : T.amber, borderRadius: 2, transition: "width 0.3s" }} />
          </div>
          <span style={{ fontSize: 11, color: progress === 100 ? T.teal : T.amber, fontWeight: 700, whiteSpace: "nowrap" }}>
            {filledRequired}/{allRequired} required
          </span>
        </div>
      </div>

      {/* Fields */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px" }}>
        {Object.entries(groups).map(([groupName, fields]) => {
          const isOpen = openGroups[groupName] !== false;
          const hasRequired = fields.some(f => f.required && (!fieldValues[f.id] || fieldValues[f.id] === ""));
          return (
            <div key={groupName} style={{ marginBottom: 12 }}>
              <button
                onClick={() => toggleGroup(groupName)}
                style={{
                  display: "flex", alignItems: "center", gap: 6, width: "100%",
                  background: "none", border: "none", cursor: "pointer", padding: "4px 0 6px",
                  borderBottom: `1px solid ${T.border}`, marginBottom: 10,
                }}
              >
                {hasRequired && !isOpen && <AlertCircle size={12} color={T.amber} />}
                <span style={{ fontSize: 11, fontWeight: 700, color: T.dim, textTransform: "uppercase", letterSpacing: "0.06em", flex: 1, textAlign: "left" }}>
                  {groupName}
                </span>
                {isOpen ? <ChevronUp size={12} color={T.dim} /> : <ChevronDown size={12} color={T.dim} />}
              </button>
              {isOpen && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {fields.map(field => {
                    const isFullWidth = field.width === "full" || field.type === "vitals_block" || field.type === "labs_block" || field.type === "exam_checklist" || field.type === "textarea" || field.type === "multiselect";
                    const val = fieldValues[field.id];
                    const missing = field.required && (!val || val === "" || (Array.isArray(val) && val.length === 0));
                    return (
                      <div key={field.id} style={{ gridColumn: isFullWidth ? "1 / -1" : "auto" }}>
                        <label style={labelStyle}>
                          {field.label}
                          {field.required && <span style={{ color: missing ? T.red : T.teal, marginLeft: 3 }}>*</span>}
                        </label>
                        <FieldRenderer
                          field={field}
                          value={fieldValues[field.id]}
                          onChange={v => onChange(field.id, v)}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Generate Button */}
      <div style={{ padding: "12px 20px", borderTop: `1px solid ${T.border}`, flexShrink: 0 }}>
        <button
          onClick={onGenerate}
          disabled={isGenerating || progress < 100}
          style={{
            width: "100%", padding: "11px 0", borderRadius: 10, fontSize: 13, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: progress === 100 && !isGenerating ? "pointer" : "not-allowed",
            background: progress === 100 && !isGenerating ? `linear-gradient(135deg, ${T.teal}, #00a896)` : "rgba(255,255,255,0.05)",
            border: `1px solid ${progress === 100 ? T.teal : T.border}`,
            color: progress === 100 && !isGenerating ? "#050f1e" : T.dim,
            transition: "all 0.15s",
          }}
        >
          {isGenerating ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Generating Note…</> : <><Sparkles size={16} /> Generate Note with AI</>}
        </button>
        {progress < 100 && (
          <p style={{ textAlign: "center", fontSize: 11, color: T.dim, marginTop: 6 }}>
            Fill all required fields (*) to generate
          </p>
        )}
      </div>
    </div>
  );
}