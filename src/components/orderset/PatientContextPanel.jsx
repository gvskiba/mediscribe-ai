import React, { useState, useEffect } from "react";
import { ChevronDown, Save, User } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const G = {
  navy: "#050f1e", slate: "#0b1d35", panel: "#0d2240", edge: "#162d4f",
  border: "#1e3a5f", muted: "#2a4d72", dim: "#4a7299", text: "#c8ddf0",
  bright: "#e8f4ff", teal: "#00d4bc", amber: "#f5a623", red: "#ff5c6c",
  green: "#2ecc71", purple: "#9b6dff", blue: "#4a90d9", rose: "#f472b6",
};

export default function PatientContextPanel({ onPatientDataChange = () => {}, selectedPatientId = null }) {
  const [expanded, setExpanded] = useState(true);
  const [patientData, setPatientData] = useState({
    patient_name: "",
    patient_id: "",
    age: null,
    weight_kg: null,
    diagnosis: "",
    mobility: "ambulatory",
    vitals: { hr: null, sbp: null, dbp: null, rr: null, temp: 98.6, spo2: null },
    medical_history: {
      diabetes: false,
      ckd: false,
      anticoagulation: false,
      sepsis: false,
      gi_bleed: false,
      stroke_risk: false,
    },
    additional_notes: "",
  });

  const queryClient = useQueryClient();

  // Load existing patients
  const { data: patients = [] } = useQuery({
    queryKey: ["orderSetPatients"],
    queryFn: () => base44.entities.OrderSetPatient.list(),
  });

  // Save patient mutation
  const savePatientMutation = useMutation({
    mutationFn: (data) => {
      if (data.id) {
        return base44.entities.OrderSetPatient.update(data.id, data);
      }
      return base44.entities.OrderSetPatient.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orderSetPatients"] });
    },
  });

  // Load selected patient data
  useEffect(() => {
    if (selectedPatientId && patients.length > 0) {
      const patient = patients.find(p => p.id === selectedPatientId);
      if (patient) {
        setPatientData(patient);
        onPatientDataChange(patient);
      }
    }
  }, [selectedPatientId, patients]);

  function handleChange(key, value) {
    const updated = { ...patientData, [key]: value };
    setPatientData(updated);
    onPatientDataChange(updated);
  }

  function handleVitalChange(vitalKey, value) {
    const updated = { 
      ...patientData, 
      vitals: { ...patientData.vitals, [vitalKey]: value ? parseFloat(value) : null }
    };
    setPatientData(updated);
    onPatientDataChange(updated);
  }

  function handleHistoryChange(historyKey, value) {
    const updated = { 
      ...patientData, 
      medical_history: { ...patientData.medical_history, [historyKey]: value }
    };
    setPatientData(updated);
    onPatientDataChange(updated);
  }

  function handleSave() {
    if (!patientData.patient_name) {
      alert("Patient name is required");
      return;
    }
    savePatientMutation.mutate(patientData);
  }

  const fields = [
    { key: "patient_name", label: "Patient Name", type: "text", placeholder: "Full name", required: true },
    { key: "patient_id", label: "MRN / Patient ID", type: "text", placeholder: "Medical record number" },
    { key: "age", label: "Age (years)", type: "number", min: 0, max: 120 },
    { key: "weight_kg", label: "Weight (kg)", type: "number", min: 0, max: 300, step: 0.1 },
    { key: "diagnosis", label: "Primary Diagnosis", type: "text", placeholder: "e.g., CHF, Sepsis, PE" },
    { key: "mobility", label: "Mobility Status", type: "select", options: ["ambulatory", "limited", "bedbound"], help: "Affects DVT prophylaxis decisions" },
  ];

  const vitals = [
    { key: "hr", label: "HR (bpm)", min: 0, max: 300 },
    { key: "sbp", label: "SBP (mmHg)", min: 0, max: 300 },
    { key: "dbp", label: "DBP (mmHg)", min: 0, max: 200 },
    { key: "rr", label: "RR (breaths/min)", min: 0, max: 60 },
    { key: "temp", label: "Temp (°F)", min: 95, max: 106, step: 0.1 },
    { key: "spo2", label: "SpO₂ (%)", min: 0, max: 100 },
  ];

  const checkboxes = [
    { key: "diabetes", label: "Diabetes", help: "Insulin management" },
    { key: "ckd", label: "Chronic Kidney Disease", help: "Medication dose adjustments" },
    { key: "anticoagulation", label: "On Anticoagulation", help: "Bleeding risk" },
    { key: "sepsis", label: "Sepsis/SIRS", help: "Sepsis workup triggered" },
    { key: "gi_bleed", label: "GI Bleed History", help: "PPI prophylaxis" },
    { key: "stroke_risk", label: "Stroke Risk", help: "DVT/PE prevention" },
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
          {/* Patient selector */}
          {patients.length > 0 && (
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: G.bright, display: "block", marginBottom: 4 }}>
                Load Existing Patient
              </label>
              <select
                value={patientData.id || ""}
                onChange={e => {
                  const patient = patients.find(p => p.id === e.target.value);
                  if (patient) {
                    setPatientData(patient);
                    onPatientDataChange(patient);
                  }
                }}
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
                <option value="">-- New Patient --</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.patient_name} {p.patient_id ? `(${p.patient_id})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Demographics */}
          {fields.map(field => (
            <div key={field.key}>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: G.bright, display: "block", marginBottom: 4 }}>
                {field.label} {field.required && <span style={{ color: G.red }}>*</span>}
                {field.help && (
                  <div style={{ fontSize: 10, color: G.dim, fontWeight: 400, marginTop: 2 }}>
                    ℹ {field.help}
                  </div>
                )}
              </label>
              {field.type === "select" ? (
                <select
                  value={patientData[field.key] || ""}
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
                  value={patientData[field.key] || ""}
                  onChange={e => handleChange(field.key, field.type === "number" ? (e.target.value ? parseFloat(e.target.value) : null) : e.target.value)}
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

          {/* Vitals */}
          <div style={{ borderTop: `1px solid rgba(30,58,95,.3)`, paddingTop: 10 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: G.bright, marginBottom: 8 }}>
              Vital Signs
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {vitals.map(v => (
                <div key={v.key}>
                  <label style={{ fontSize: 10.5, fontWeight: 600, color: G.text, display: "block", marginBottom: 3 }}>
                    {v.label}
                  </label>
                  <input
                    type="number"
                    value={patientData.vitals?.[v.key] || ""}
                    onChange={e => handleVitalChange(v.key, e.target.value)}
                    min={v.min}
                    max={v.max}
                    step={v.step || 1}
                    style={{
                      width: "100%",
                      padding: "5px 7px",
                      background: "rgba(22,45,79,.7)",
                      border: `1px solid ${G.border}`,
                      borderRadius: 6,
                      color: G.bright,
                      fontFamily: "inherit",
                      fontSize: 11,
                      outline: "none",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Medical History */}
          <div style={{ borderTop: `1px solid rgba(30,58,95,.3)`, paddingTop: 10 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: G.bright, marginBottom: 8 }}>
              Medical History
            </div>
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
                  checked={patientData.medical_history?.[cb.key] || false}
                  onChange={e => handleHistoryChange(cb.key, e.target.checked)}
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

          {/* Additional Notes */}
          <div>
            <label style={{ fontSize: 11.5, fontWeight: 600, color: G.bright, display: "block", marginBottom: 4 }}>
              Additional Notes
            </label>
            <textarea
              value={patientData.additional_notes || ""}
              onChange={e => handleChange("additional_notes", e.target.value)}
              rows={3}
              placeholder="Clinical notes, allergies, special considerations..."
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
                resize: "vertical",
              }}
            />
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={savePatientMutation.isPending}
            style={{
              padding: "8px 14px",
              background: G.teal,
              border: "none",
              borderRadius: 6,
              color: G.navy,
              fontWeight: 700,
              fontSize: 12,
              cursor: savePatientMutation.isPending ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              justifyContent: "center",
              opacity: savePatientMutation.isPending ? 0.6 : 1,
            }}
          >
            <Save size={14} />
            {savePatientMutation.isPending ? "Saving..." : patientData.id ? "Update Patient" : "Save Patient"}
          </button>
        </div>
      )}
    </div>
  );
}