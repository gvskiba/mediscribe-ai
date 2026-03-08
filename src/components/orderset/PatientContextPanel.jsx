import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

const G = {
  navy: "#050f1e", slate: "#0b1d35", panel: "#0d2240", edge: "#162d4f",
  border: "#1e3a5f", muted: "#2a4d72", dim: "#4a7299", text: "#c8ddf0",
  bright: "#e8f4ff", teal: "#00d4bc", amber: "#f5a623", red: "#ff5c6c",
  green: "#2ecc71", purple: "#9b6dff", blue: "#4a90d9", rose: "#f472b6",
};

export default function PatientContextPanel({ onPatientDataChange = () => {} }) {
  const [expanded, setExpanded] = useState(true);
  const [patientData, setPatientData] = useState({
    diagnosis: "",
    mobility: "ambulatory",
    los_days: 0,
    icu_status: false,
    mechanical_ventilation: false,
    temp_f: 98.6,
    wbc: 7,
    glucose_level: 100,
    suspected_infection: false,
    on_heparin: false,
  });

  function handleChange(key, value) {
    const updated = { ...patientData, [key]: value };
    setPatientData(updated);
    onPatientDataChange(updated);
  }

  const fields = [
    { key: "diagnosis", label: "Primary Diagnosis", type: "text", placeholder: "e.g., CHF, Sepsis, PE" },
    { key: "mobility", label: "Mobility Status", type: "select", options: ["ambulatory", "bedbound", "wheelchair"], help: "Affects DVT prophylaxis decisions" },
    { key: "los_days", label: "Length of Stay (days)", type: "number", min: 0, help: "Prolonged stay affects prophylaxis" },
    { key: "temp_f", label: "Temperature (°F)", type: "number", min: 95, max: 106, step: 0.1, help: "Fever triggers sepsis workup" },
    { key: "wbc", label: "WBC (K/μL)", type: "number", min: 0, max: 30, step: 0.1, help: "Elevated WBC with fever suggests infection" },
    { key: "glucose_level", label: "Glucose (mg/dL)", type: "number", min: 50, max: 500, help: "High glucose in diabetics needs insulin" },
  ];

  const checkboxes = [
    { key: "icu_status", label: "ICU Patient", help: "Triggers stress ulcer prophylaxis" },
    { key: "mechanical_ventilation", label: "On Mechanical Ventilation", help: "Indicates ICU-level care" },
    { key: "suspected_infection", label: "Suspected Infection", help: "Combined with fever/WBC for sepsis workup" },
    { key: "on_heparin", label: "On Heparin", help: "Requires anticoagulation monitoring" },
  ];

  return (
    <div style={{
      background: "rgba(11,29,53,.5)",
      border: `1px solid ${G.border}`,
      borderRadius: 10,
      overflow: "hidden",
      marginBottom: 14,
    }}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: "100%",
          padding: "12px 14px",
          background: "rgba(22,45,79,.6)",
          border: "none",
          borderBottom: expanded ? `1px solid ${G.border}` : "none",
          display: "flex",
          alignItems: "center",
          gap: 10,
          cursor: "pointer",
          color: G.bright,
          fontWeight: 700,
          fontSize: 13.5,
        }}
      >
        <span style={{ fontSize: 16 }}>👤</span>
        Patient Context
        <ChevronDown 
          size={14} 
          style={{ 
            marginLeft: "auto", 
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform .2s",
          }} 
        />
      </button>

      {/* Content */}
      {expanded && (
        <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Text/number inputs */}
          {fields.map(field => (
            <div key={field.key}>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: G.bright, display: "block", marginBottom: 4 }}>
                {field.label}
                {field.help && (
                  <div style={{ fontSize: 10, color: G.dim, fontWeight: 400, marginTop: 2 }}>
                    ℹ {field.help}
                  </div>
                )}
              </label>
              {field.type === "select" ? (
                <select
                  value={patientData[field.key]}
                  onChange={e => handleChange(field.key, e.target.value)}
                  style={{
                    width: "100%",
                    padding: "6px 8px",
                    background: "rgba(22,45,79,.7)",
                    border: `1px solid ${G.border}`,
                    borderRadius: 6,
                    color: G.bright,
                    fontFamily: "inherit",
                    fontSize: 12,
                    outline: "none",
                  }}
                >
                  {field.options.map(opt => (
                    <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type}
                  value={patientData[field.key]}
                  onChange={e => handleChange(field.key, field.type === "number" ? parseFloat(e.target.value) || 0 : e.target.value)}
                  placeholder={field.placeholder || ""}
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  style={{
                    width: "100%",
                    padding: "6px 8px",
                    background: "rgba(22,45,79,.7)",
                    border: `1px solid ${G.border}`,
                    borderRadius: 6,
                    color: G.bright,
                    fontFamily: "inherit",
                    fontSize: 12,
                    outline: "none",
                  }}
                />
              )}
            </div>
          ))}

          {/* Checkboxes */}
          <div style={{ borderTop: `1px solid rgba(30,58,95,.3)`, paddingTop: 10 }}>
            {checkboxes.map(cb => (
              <label 
                key={cb.key}
                style={{ 
                  display: "flex", 
                  alignItems: "flex-start", 
                  gap: 8, 
                  marginBottom: 8,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={patientData[cb.key]}
                  onChange={e => handleChange(cb.key, e.target.checked)}
                  style={{
                    width: 16,
                    height: 16,
                    marginTop: 2,
                    cursor: "pointer",
                  }}
                />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: G.bright }}>
                    {cb.label}
                  </div>
                  {cb.help && (
                    <div style={{ fontSize: 10, color: G.dim, marginTop: 1 }}>
                      {cb.help}
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}