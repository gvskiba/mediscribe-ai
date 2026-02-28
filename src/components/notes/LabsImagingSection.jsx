import React, { useState } from "react";
import { X, Plus } from "lucide-react";
import NoteSection from "./NoteSection";

const T = {
  bg: "#080b10",
  border_2: "#243048",
  text: "#dde2ef",
  muted: "#4e5a78",
  teal: "#00cca3",
  normal: "#34d399",
  abnormal: "#f59e0b",
  critical: "#f87171",
};

export default function LabsImagingSection({ note, onUpdate }) {
  const [labForm, setLabForm] = useState({ test_name: "", result: "", reference_range: "", status: "normal", unit: "" });
  const [imagingForm, setImagingForm] = useState({ study_type: "", location: "", findings: "", impression: "" });

  const updateField = (field, value) => {
    onUpdate({ [field]: value });
  };

  const addLab = () => {
    if (!labForm.test_name.trim()) return;
    const newLab = { test_name: labForm.test_name, result: labForm.result, reference_range: labForm.reference_range, status: labForm.status, unit: labForm.unit };
    const updated = [...(note.lab_findings || []), newLab];
    updateField("lab_findings", updated);
    setLabForm({ test_name: "", result: "", reference_range: "", status: "normal", unit: "" });
  };

  const removeLab = (index) => {
    const updated = (note.lab_findings || []).filter((_, i) => i !== index);
    updateField("lab_findings", updated);
  };

  const addImaging = () => {
    if (!imagingForm.study_type.trim()) return;
    const newImaging = { study_type: imagingForm.study_type, location: imagingForm.location, findings: imagingForm.findings, impression: imagingForm.impression };
    const updated = [...(note.imaging_findings || []), newImaging];
    updateField("imaging_findings", updated);
    setImagingForm({ study_type: "", location: "", findings: "", impression: "" });
  };

  const removeImaging = (index) => {
    const updated = (note.imaging_findings || []).filter((_, i) => i !== index);
    updateField("imaging_findings", updated);
  };

  const Input = ({ label, value, placeholder, onChange }) => (
    <div style={{ marginBottom: "10px" }}>
      <label style={{ fontFamily: "Geist Mono", fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: T.muted, display: "block", marginBottom: "4px" }}>
        {label}
      </label>
      <input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          background: T.bg,
          border: `1px solid ${T.border_2}`,
          borderRadius: "6px",
          color: T.text,
          fontFamily: "Geist",
          fontSize: "13px",
          padding: "6px 9px",
          boxSizing: "border-box",
          outline: "none",
        }}
        onFocus={(e) => (e.target.style.borderColor = T.teal)}
        onBlur={(e) => (e.target.style.borderColor = T.border_2)}
      />
    </div>
  );

  const Select = ({ label, value, options, onChange }) => (
    <div style={{ marginBottom: "10px" }}>
      <label style={{ fontFamily: "Geist Mono", fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: T.muted, display: "block", marginBottom: "4px" }}>
        {label}
      </label>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          background: T.bg,
          border: `1px solid ${T.border_2}`,
          borderRadius: "6px",
          color: T.text,
          fontFamily: "Geist",
          fontSize: "13px",
          padding: "6px 9px",
          boxSizing: "border-box",
          outline: "none",
        }}
        onFocus={(e) => (e.target.style.borderColor = T.teal)}
        onBlur={(e) => (e.target.style.borderColor = T.border_2)}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt.charAt(0).toUpperCase() + opt.slice(1)}
          </option>
        ))}
      </select>
    </div>
  );

  const Textarea = ({ label, value, placeholder, onChange, minHeight = "60px" }) => (
    <div style={{ marginBottom: "10px" }}>
      <label style={{ fontFamily: "Geist Mono", fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: T.muted, display: "block", marginBottom: "4px" }}>
        {label}
      </label>
      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          background: T.bg,
          border: `1px solid ${T.border_2}`,
          borderRadius: "6px",
          color: T.text,
          fontFamily: "Geist",
          fontSize: "13px",
          padding: "6px 9px",
          boxSizing: "border-box",
          outline: "none",
          minHeight,
          resize: "vertical",
        }}
        onFocus={(e) => (e.target.style.borderColor = T.teal)}
        onBlur={(e) => (e.target.style.borderColor = T.border_2)}
      />
    </div>
  );

  const statusColors = { normal: T.normal, abnormal: T.abnormal, critical: T.critical };
  const statusBgs = { normal: "rgba(52,211,153,0.1)", abnormal: "rgba(245,158,11,0.1)", critical: "rgba(248,113,113,0.1)" };

  return (
    <NoteSection id="section-labs-imaging" label="Labs & Imaging" icon="🧪" accentColor="emerald" defaultOpen={true}>
      {/* Labs Section */}
      <div style={{ borderBottom: `1px solid ${T.border_2}`, paddingBottom: "16px" }}>
        <h3 style={{ fontFamily: "Geist Mono", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: T.text, marginBottom: "12px" }}>
          Laboratory Results
        </h3>

        {/* Lab Input Form */}
        <div style={{ background: "rgba(0,204,163,0.05)", border: `1px solid ${T.border_2}`, borderRadius: "8px", padding: "12px", marginBottom: "12px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "10px", marginBottom: "10px" }}>
            <Input label="Test Name" value={labForm.test_name} placeholder="e.g., WBC, Glucose" onChange={(v) => setLabForm({ ...labForm, test_name: v })} />
            <Input label="Result" value={labForm.result} placeholder="e.g., 7.2" onChange={(v) => setLabForm({ ...labForm, result: v })} />
            <Input label="Unit" value={labForm.unit} placeholder="e.g., K/uL" onChange={(v) => setLabForm({ ...labForm, unit: v })} />
            <Select label="Status" value={labForm.status} options={["normal", "abnormal", "critical"]} onChange={(v) => setLabForm({ ...labForm, status: v })} />
          </div>
          <div style={{ marginBottom: "10px" }}>
            <Input label="Reference Range" value={labForm.reference_range} placeholder="e.g., 4.5-11.0" onChange={(v) => setLabForm({ ...labForm, reference_range: v })} />
          </div>
          <button
            onClick={addLab}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 12px",
              borderRadius: "6px",
              border: `1px solid ${T.teal}`,
              background: "transparent",
              color: T.teal,
              fontFamily: "Geist Mono",
              fontSize: "9px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(0,204,163,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <Plus size={13} /> Add Lab Result
          </button>
        </div>

        {/* Lab Results List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {(note.lab_findings || []).map((lab, idx) => (
            <div
              key={idx}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr auto",
                gap: "10px",
                alignItems: "center",
                padding: "10px 12px",
                background: statusBgs[lab.status],
                border: `1px solid ${statusColors[lab.status]}`,
                borderRadius: "6px",
              }}
            >
              <div>
                <div style={{ fontSize: "13px", fontWeight: 500, color: T.text }}>{lab.test_name}</div>
                <div style={{ fontSize: "11px", color: T.muted, marginTop: "2px" }}>Ref: {lab.reference_range}</div>
              </div>
              <div style={{ fontSize: "13px", color: T.text, fontWeight: 500 }}>
                {lab.result} {lab.unit}
              </div>
              <div style={{ fontFamily: "Geist Mono", fontSize: "10px", color: statusColors[lab.status] }}>
                {lab.status.toUpperCase()}
              </div>
              <div></div>
              <button
                onClick={() => removeLab(idx)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: T.muted,
                  cursor: "pointer",
                  padding: 0,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#f87171")}
                onMouseLeave={(e) => (e.currentTarget.style.color = T.muted)}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Imaging Section */}
      <div style={{ paddingTop: "16px" }}>
        <h3 style={{ fontFamily: "Geist Mono", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: T.text, marginBottom: "12px" }}>
          Imaging Studies
        </h3>

        {/* Imaging Input Form */}
        <div style={{ background: "rgba(52,211,153,0.05)", border: `1px solid ${T.border_2}`, borderRadius: "8px", padding: "12px", marginBottom: "12px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
            <Input label="Study Type" value={imagingForm.study_type} placeholder="e.g., Chest X-Ray, CT Abdomen" onChange={(v) => setImagingForm({ ...imagingForm, study_type: v })} />
            <Input label="Location/Body Part" value={imagingForm.location} placeholder="e.g., Chest, Abdomen" onChange={(v) => setImagingForm({ ...imagingForm, location: v })} />
          </div>
          <Textarea label="Findings" value={imagingForm.findings} placeholder="Detailed imaging findings…" onChange={(v) => setImagingForm({ ...imagingForm, findings: v })} minHeight="50px" />
          <Textarea label="Impression" value={imagingForm.impression} placeholder="Radiologist's impression or conclusion…" onChange={(v) => setImagingForm({ ...imagingForm, impression: v })} minHeight="50px" />
          <button
            onClick={addImaging}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 12px",
              borderRadius: "6px",
              border: `1px solid ${T.teal}`,
              background: "transparent",
              color: T.teal,
              fontFamily: "Geist Mono",
              fontSize: "9px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
              marginTop: "10px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(0,204,163,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <Plus size={13} /> Add Imaging Study
          </button>
        </div>

        {/* Imaging Studies List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {(note.imaging_findings || []).map((imaging, idx) => (
            <div
              key={idx}
              style={{
                padding: "12px",
                background: "rgba(34,211,153,0.05)",
                border: `1px solid ${T.border_2}`,
                borderRadius: "8px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 500, color: T.text }}>{imaging.study_type}</div>
                  <div style={{ fontSize: "11px", color: T.muted, marginTop: "2px" }}>{imaging.location}</div>
                </div>
                <button
                  onClick={() => removeImaging(idx)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: T.muted,
                    cursor: "pointer",
                    padding: 0,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#f87171")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = T.muted)}
                >
                  <X size={16} />
                </button>
              </div>
              {imaging.findings && (
                <div style={{ marginBottom: "8px", paddingBottom: "8px", borderBottom: `1px solid ${T.border_2}` }}>
                  <div style={{ fontFamily: "Geist Mono", fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", color: T.muted, marginBottom: "4px" }}>
                    Findings
                  </div>
                  <div style={{ fontSize: "12px", color: T.text, whiteSpace: "pre-wrap" }}>{imaging.findings}</div>
                </div>
              )}
              {imaging.impression && (
                <div>
                  <div style={{ fontFamily: "Geist Mono", fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", color: T.muted, marginBottom: "4px" }}>
                    Impression
                  </div>
                  <div style={{ fontSize: "12px", color: T.text, whiteSpace: "pre-wrap" }}>{imaging.impression}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </NoteSection>
  );
}