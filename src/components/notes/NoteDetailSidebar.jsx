import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const T = {
  surface: "#0e1320",
  border: "#1a2236",
  border_2: "#243048",
  text: "#dde2ef",
  muted: "#4e5a78",
  dim: "#2d3a56",
  teal: "#00cca3",
  teal_dim: "#003328",
  bg: "#080b10",
};

export default function NoteDetailSidebar({ note, onNoteUpdate }) {
  const [expandedSections, setExpandedSections] = useState({ patient: true, vitals: true, sections: false });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleInputChange = (field, value) => {
    onNoteUpdate({ [field]: value });
  };

  const Section = ({ id, label, collapsible = false, children }) => (
    <div>
      {collapsible ? (
        <button
          onClick={() => toggleSection(id)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px",
            background: "transparent",
            border: "none",
            color: T.muted,
            fontFamily: "Geist Mono",
            fontSize: "9px",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            cursor: "pointer",
            marginBottom: "10px",
          }}
        >
          {label}
          {expandedSections[id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      ) : (
        <div
          style={{
            fontFamily: "Geist Mono",
            fontSize: "9px",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: T.dim,
            marginBottom: "10px",
          }}
        >
          {label}
        </div>
      )}
      {(!collapsible || expandedSections[id]) && children}
    </div>
  );

  const TextInput = ({ label, value, placeholder, onChange }) => (
    <div style={{ marginBottom: "12px" }}>
      <label style={{ fontFamily: "Geist Mono", fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: T.muted, display: "block", marginBottom: "5px" }}>
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
          padding: "7px 11px",
          boxSizing: "border-box",
          outline: "none",
        }}
        onFocus={(e) => (e.target.style.borderColor = T.teal)}
        onBlur={(e) => (e.target.style.borderColor = T.border_2)}
      />
    </div>
  );

  return (
    <div
      style={{
        width: "260px",
        background: T.surface,
        borderRight: `1px solid ${T.border}`,
        overflowY: "auto",
        padding: "14px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        flexShrink: 0,
      }}
    >
      {/* Patient Panel */}
      <Section id="patient" label="Patient" collapsible={false}>
        <TextInput
          label="Patient Name / MRN"
          value={note.patient_name}
          placeholder="Name or MRN"
          onChange={(value) => handleInputChange("patient_name", value)}
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
          <TextInput
            label="Age & Sex"
            value={note.patient_age}
            placeholder="e.g. 54yo F"
            onChange={(value) => handleInputChange("patient_age", value)}
          />
          <TextInput
            label="DOB"
            value={note.date_of_birth}
            placeholder="YYYY-MM-DD"
            onChange={(value) => handleInputChange("date_of_birth", value)}
          />
        </div>
        <TextInput label="Note Type" value={note.note_type} placeholder="Progress Note" onChange={(value) => handleInputChange("note_type", value)} />
        <TextInput label="Department" value={note.specialty} placeholder="Select…" onChange={(value) => handleInputChange("specialty", value)} />
        <TextInput label="Attending Provider" value={note.created_by} placeholder="Auto-filled" onChange={() => {}} />
      </Section>

      <div style={{ height: "1px", background: T.border, margin: "8px 0" }} />

      {/* Vitals Panel */}
      <Section id="vitals" label="Vitals" collapsible={true}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
          <TextInput label="BP" value={note.vital_signs?.blood_pressure?.systolic} placeholder="mmHg" onChange={() => {}} />
          <TextInput label="HR" value={note.vital_signs?.heart_rate?.value} placeholder="bpm" onChange={() => {}} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
          <TextInput label="RR" value={note.vital_signs?.respiratory_rate?.value} placeholder="/min" onChange={() => {}} />
          <TextInput label="Temp" value={note.vital_signs?.temperature?.value} placeholder="°F" onChange={() => {}} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <TextInput label="SpO₂" value={note.vital_signs?.oxygen_saturation?.value} placeholder="%" onChange={() => {}} />
          <TextInput label="Weight" value={note.vital_signs?.weight?.value} placeholder="kg/lb" onChange={() => {}} />
        </div>
      </Section>

      <div style={{ height: "1px", background: T.border, margin: "8px 0" }} />

      {/* Section Navigation */}
      <Section id="sections" label="Sections" collapsible={false}>
        {[
          { anchor: "subjective", label: "Subjective", icon: "💬" },
          { anchor: "objective", label: "Objective", icon: "🔍" },
          { anchor: "impression", label: "Impression", icon: "💡" },
          { anchor: "mdm", label: "MDM", icon: "🧠" },
          { anchor: "plan", label: "Plan", icon: "📋" },
          { anchor: "labs", label: "Labs", icon: "🧪" },
          { anchor: "imaging", label: "Imaging", icon: "🩻" },
          { anchor: "medications", label: "Medications", icon: "💊" },
          { anchor: "disposition", label: "Disposition", icon: "🚪" },
        ].map((item) => (
          <a
            key={item.anchor}
            href={`#${item.anchor}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 10px",
              borderRadius: "5px",
              background: "transparent",
              border: "none",
              fontFamily: "Geist Mono",
              fontSize: "10px",
              letterSpacing: "0.06em",
              color: T.muted,
              cursor: "pointer",
              textDecoration: "none",
              marginBottom: "2px",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = T.border;
              e.currentTarget.style.color = T.text;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = T.muted;
            }}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </a>
        ))}
      </Section>
    </div>
  );
}