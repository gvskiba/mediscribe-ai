import React from "react";
import { TrendingUp } from "lucide-react";

const T = {
  navy: "#050f1e",
  slate: "#0b1d35",
  panel: "#0e2340",
  edge: "#162d4f",
  border: "#1e3a5f",
  muted: "#2a4d72",
  dim: "#4a7299",
  text: "#c8ddf0",
  bright: "#e8f4ff",
  teal: "#00d4bc",
};

const VITAL_ICONS = {
  systolic_bp: "❤️",
  diastolic_bp: "❤️",
  heart_rate: "🫀",
  respiratory_rate: "🫁",
  temperature: "🌡️",
  oxygen_saturation: "💨",
  pain_score: "😣",
  gcs: "🧠",
};

export default function VitalSignsDisplayPanel({ vitals = {}, title = "VITAL SIGNS" }) {
  const vitalsList = [
    { key: "blood_pressure_systolic", label: "Systolic BP", icon: VITAL_ICONS.systolic_bp, format: () => vitals?.blood_pressure?.systolic ? `${vitals.blood_pressure.systolic}` : "Awaiting data" },
    { key: "blood_pressure_diastolic", label: "Diastolic BP", icon: VITAL_ICONS.diastolic_bp, format: () => vitals?.blood_pressure?.diastolic ? `${vitals.blood_pressure.diastolic}` : "Awaiting data" },
    { key: "heart_rate", label: "Heart Rate", icon: VITAL_ICONS.heart_rate, format: () => vitals?.heart_rate?.value ? `${vitals.heart_rate.value}` : "Awaiting data" },
    { key: "respiratory_rate", label: "Resp Rate", icon: VITAL_ICONS.respiratory_rate, format: () => vitals?.respiratory_rate?.value ? `${vitals.respiratory_rate.value}` : "Awaiting data" },
    { key: "temperature", label: "Temperature", icon: VITAL_ICONS.temperature, format: () => vitals?.temperature?.value ? `${vitals.temperature.value}` : "Awaiting data" },
    { key: "oxygen_saturation", label: "SpO₂", icon: VITAL_ICONS.oxygen_saturation, format: () => vitals?.oxygen_saturation?.value ? `${vitals.oxygen_saturation.value}` : "Awaiting data" },
    { key: "pain_score", label: "Pain Score", icon: VITAL_ICONS.pain_score, format: () => vitals?.pain_score?.value ? `${vitals.pain_score.value}` : "Awaiting data" },
    { key: "gcs", label: "GCS", icon: VITAL_ICONS.gcs, format: () => vitals?.gcs?.value ? `${vitals.gcs.value}` : "Awaiting data" },
  ];

  return (
    <div style={{
      background: T.panel,
      border: `1px solid ${T.border}`,
      borderLeft: `3px solid ${T.teal}`,
      borderRadius: "8px",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "12px 16px",
        borderBottom: `1px solid ${T.border}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "16px" }}>📊</span>
          <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: T.text }}>
            {title}
          </span>
        </div>
        <span style={{ fontSize: "10px", color: T.dim }}>📈 Trends 0 readings</span>
      </div>

      {/* Vital Rows */}
      <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: "8px" }}>
        {vitalsList.map((vital, idx) => (
          <div
            key={vital.key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px",
              background: T.edge,
              border: `1px solid ${T.border}`,
              borderRadius: "8px",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = T.teal;
              e.currentTarget.style.background = "rgba(0,212,188,0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = T.border;
              e.currentTarget.style.background = T.edge;
            }}
          >
            <span style={{ fontSize: "18px" }}>{vital.icon}</span>
            <span style={{ flex: 1, fontSize: "11px", fontWeight: 500, color: T.text }}>{vital.label}</span>
            <span style={{ fontSize: "11px", color: T.dim, textAlign: "right" }}>{vital.format()}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        padding: "10px 16px",
        borderTop: `1px solid ${T.border}`,
        fontSize: "10px",
        color: T.dim,
        fontStyle: "italic",
      }}>
        No vitals recorded — pull from Objective page
      </div>
    </div>
  );
}