import React from "react";

export default function VitalsPanel({ vitals }) {
  const latest = vitals?.[0];
  const prior = vitals?.[1];

  const getSeverity = (value, field) => {
    const ranges = {
      systolicBP: { normal: [90, 140], critical: { high: 180, low: 80 } },
      diastolicBP: { normal: [60, 90], critical: { high: 120, low: 50 } },
      heartRate: { normal: [60, 100], critical: { high: 150, low: 40 } },
      respiratoryRate: { normal: [12, 20], critical: { high: 30, low: 8 } },
      temperature: { normal: [97, 99.5], critical: { high: 103, low: 95 } },
      spo2: { normal: [95, 100], critical: { high: 100, low: 90 } },
      painScore: { normal: [0, 3], critical: { high: 8, low: 0 } },
    };

    const r = ranges[field];
    if (!r) return "normal";
    if (value >= r.critical.high || value <= r.critical.low) return "critical";
    if (value > r.normal[1] || value < r.normal[0]) return "warning";
    return "normal";
  };

  const getTrend = (field) => {
    if (!latest || !prior) return "→";
    const curr = latest[field];
    const prev = prior[field];
    if (curr > prev + 5) return "↑";
    if (curr < prev - 5) return "↓";
    return "→";
  };

  const severityColors = { critical: "#ff5c6c", warning: "#f5a623", normal: "#2ecc71" };

  const vitalsList = [
    { id: "systolicBP", label: "Systolic BP", unit: "mmHg", icon: "💓" },
    { id: "heartRate", label: "Heart Rate", unit: "bpm", icon: "🫀" },
    { id: "temperature", label: "Temperature", unit: "°F", icon: "🌡️" },
    { id: "spo2", label: "SpO₂", unit: "%", icon: "💨" },
    { id: "respiratoryRate", label: "RR", unit: "/min", icon: "🫁" },
    { id: "painScore", label: "Pain", unit: "/10", icon: "😣" },
  ];

  return (
    <div
      style={{
        background: "#0e2340",
        border: "1px solid #1e3a5f",
        borderLeft: "3px solid #00d4bc",
        borderRadius: "8px",
        padding: "10px",
        overflow: "auto",
      }}
    >
      <h3 style={{ color: "#e8f4ff", fontSize: "12px", fontWeight: 600, margin: "0 0 10px 0", display: "flex", gap: "4px" }}>
        📊 Vital Signs
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {vitalsList.map((vital) => {
          const value = latest?.[vital.id];
          if (value === undefined) return null;
          const severity = getSeverity(value, vital.id);
          const trend = getTrend(vital.id);
          return (
            <div key={vital.id} style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <span style={{ fontSize: "13px", minWidth: "14px" }}>{vital.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ color: "#4a7299", fontSize: "10px", margin: 0 }}>{vital.label}</p>
                <p
                  style={{
                    color: severityColors[severity],
                    fontSize: "12px",
                    fontWeight: 600,
                    margin: 0,
                  }}
                >
                  {value} {vital.unit}
                </p>
              </div>
              <span style={{ color: severity === "critical" ? "#ff5c6c" : "#4a7299", fontSize: "13px", fontWeight: 600 }}>
                {trend}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}