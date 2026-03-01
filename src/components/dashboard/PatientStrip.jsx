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
        borderTop: "3px solid",
        borderImage: "linear-gradient(90deg, #00d4bc, #9b6dff, #f5a623) 1",
        background: "#0e2340",
        border: "1px solid #1e3a5f",
        borderTopWidth: "3px",
        borderRadius: "8px",
        padding: "12px",
        display: "flex",
        gap: "16px",
        alignItems: "flex-start",
      }}
    >
      {/* Avatar & Name */}
      <div style={{ display: "flex", gap: "10px", minWidth: "180px" }}>
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            background: "#162d4f",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#e8f4ff",
            fontWeight: 600,
            fontSize: "18px",
            flexShrink: 0,
          }}
        >
          {patient?.name?.charAt(0) || "P"}
        </div>
        <div>
          <p style={{ color: "#e8f4ff", fontSize: "13px", fontWeight: 600, margin: 0 }}>
            {patient?.name}
          </p>
          <p style={{ color: "#4a7299", fontSize: "11px", margin: "2px 0 0 0" }}>
            MRN: {patient?.mrn} | {age}y | {patient?.sex}
          </p>
        </div>
      </div>

      {/* Chief Complaint */}
      <div style={{ flex: 1 }}>
        <p style={{ color: "#4a7299", fontSize: "10px", margin: "0 0 2px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Chief Complaint
        </p>
        <p style={{ color: "#c8ddf0", fontSize: "12px", margin: 0 }}>
          {encounter?.chiefComplaint || "—"}
        </p>
      </div>

      {/* Code Status */}
      <div>
        <span
          style={{
            background: codeStatusColors[patient?.codeStatus] || "#4a7299",
            color: patient?.codeStatus === "Full Code" ? "#050f1e" : "#fff",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "10px",
            fontWeight: 600,
          }}
        >
          {patient?.codeStatus || "Unknown"}
        </span>
      </div>

      {/* Allergies */}
      {allergies.length > 0 && (
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
          {allergies.slice(0, 3).map((allergy, idx) => (
            <span
              key={idx}
              style={{
                background: "#ff5c6c",
                color: "#fff",
                padding: "3px 6px",
                borderRadius: "3px",
                fontSize: "9px",
                fontWeight: 600,
              }}
            >
              {allergy}
            </span>
          ))}
          {allergies.length > 3 && (
            <span style={{ color: "#4a7299", fontSize: "10px" }}>+{allergies.length - 3}</span>
          )}
        </div>
      )}

      {/* Key Vitals Badges */}
      {vitals && (
        <div style={{ display: "flex", gap: "8px" }}>
          {[
            { label: "BP", value: `${vitals.systolicBP}/${vitals.diastolicBP}` },
            { label: "HR", value: `${vitals.heartRate}` },
            { label: "T", value: `${vitals.temperature}°F` },
            { label: "O₂", value: `${vitals.spo2}%` },
          ].map((v, idx) => (
            <div
              key={idx}
              style={{
                background: "#162d4f",
                padding: "4px 6px",
                borderRadius: "4px",
                textAlign: "center",
              }}
            >
              <p style={{ color: "#4a7299", fontSize: "9px", margin: 0 }}>{v.label}</p>
              <p style={{ color: "#e8f4ff", fontSize: "11px", fontWeight: 600, margin: 0 }}>
                {v.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Arrival Time */}
      <div style={{ textAlign: "right", minWidth: "80px" }}>
        <p style={{ color: "#4a7299", fontSize: "10px", margin: "0 0 2px 0", textTransform: "uppercase" }}>
          Arrival
        </p>
        <p style={{ color: "#c8ddf0", fontSize: "11px", margin: 0 }}>
          {encounter?.arrivalDateTime
            ? format(new Date(encounter.arrivalDateTime), "HH:mm")
            : "—"}
        </p>
      </div>

      {/* Status Badge */}
      <div>
        <span
          style={{
            background: encounter?.encounterStatus === "active" ? "#00d4bc" : "#4a7299",
            color: encounter?.encounterStatus === "active" ? "#050f1e" : "#fff",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "10px",
            fontWeight: 600,
          }}
        >
          {encounter?.encounterStatus?.toUpperCase() || "—"}
        </span>
      </div>
    </div>
  );
}