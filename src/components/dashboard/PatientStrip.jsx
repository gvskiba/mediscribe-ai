import React from "react";
import { format } from "date-fns";

export default function PatientStrip({ patient, encounter, vitals }) {
  const codeStatusColors = {
    "Full Code": "#2ecc71",
    DNR: "#f5a623",
    "DNR/DNI": "#ff5c6c",
    Comfort: "#2a4d72",
  };

  const allergies = patient?.allergies || [];
  const age = patient?.age || "N/A";

  return (
    <div
      style={{
        background: "#0b1d35",
        borderBottom: "1px solid #1e3a5f",
        borderTop: "3px solid",
        borderImage: "linear-gradient(90deg, #00d4bc, #9b6dff, #f5a623) 1",
        padding: "12px 16px",
        display: "flex",
        gap: "16px",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      {/* Left: Avatar & Name */}
      <div style={{ display: "flex", gap: "10px", minWidth: "200px" }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            background: "#162d4f",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#e8f4ff",
            fontWeight: 600,
            fontSize: "16px",
            flexShrink: 0,
          }}
        >
          {patient?.name?.charAt(0) || "P"}
        </div>
        <div>
          <p style={{ color: "#e8f4ff", fontSize: "12px", fontWeight: 600, margin: "0 0 2px 0" }}>
            {patient?.name || "—"} — from Base44 Patient entity
          </p>
          <p style={{ color: "#4a7299", fontSize: "10px", margin: 0 }}>
            MRN: {patient?.mrn || "—"} | Age: {age} | DOB: {patient?.dob || "—"}
          </p>
        </div>
      </div>

      {/* Center: Vital Signs Pills */}
      {vitals && (
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          {[
            { label: "SYSTOLIC", value: vitals.systolicBP || "—" },
            { label: "DIASTOLIC", value: vitals.diastolicBP || "—" },
            { label: "HEART", value: vitals.heartRate || "—" },
            { label: "RESP", value: vitals.respiratoryRate || "—" },
            { label: "TEMPERATURE", value: vitals.temperature || "—" },
            { label: "SPO₂", value: vitals.spo2 || "—" },
          ].map((v, idx) => (
            <div
              key={idx}
              style={{
                background: "#162d4f",
                border: "1px solid #1e3a5f",
                padding: "6px 10px",
                borderRadius: "6px",
                textAlign: "center",
                minWidth: "70px",
              }}
            >
              <p style={{ color: "#4a7299", fontSize: "8px", margin: "0 0 2px 0", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
                {v.label}
              </p>
              <p style={{ color: "#c8ddf0", fontSize: "10px", fontWeight: 600, margin: 0 }}>
                {v.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Right: Allergies & Status */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        {allergies.length > 0 ? (
          <span style={{ background: "#ff5c6c", color: "#fff", padding: "4px 8px", borderRadius: "4px", fontSize: "9px", fontWeight: 600 }}>
            {allergies[0]}
          </span>
        ) : (
          <span style={{ color: "#4a7299", fontSize: "10px" }}>No Allergies</span>
        )}
        <span style={{ color: "#4a7299", fontSize: "10px" }}>Arrived: {encounter?.arrivalDateTime ? format(new Date(encounter.arrivalDateTime), "—") : "—"}</span>
        <span
          style={{
            background: encounter?.encounterStatus === "active" ? "rgba(0,212,188,0.2)" : "#162d4f",
            color: "#c8ddf0",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "9px",
            fontWeight: 600,
          }}
        >
          {encounter?.encounterStatus?.toUpperCase() || "—"}
        </span>
      </div>
    </div>
  );
}