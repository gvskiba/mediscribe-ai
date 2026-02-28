import React, { useState, useEffect } from "react";
import { Zap } from "lucide-react";

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
  teal2: "#00a896",
  amber: "#f5a623",
  red: "#ff5c6c",
  green: "#2ecc71",
  purple: "#9b6dff",
};

export default function DashboardTopBar({ user }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const hours = String(time.getHours()).padStart(2, "0");
  const minutes = String(time.getMinutes()).padStart(2, "0");
  const lastName = user?.full_name?.split(" ").pop() || "Reyes";

  const specialties = {
    emergency_medicine: "Emergency Medicine",
    internal_medicine: "Internal Medicine",
    family_medicine: "Family Medicine",
    pediatrics: "Pediatrics",
    cardiology: "Cardiology",
  };

  const specialty =
    user?.clinical_settings?.medical_specialty &&
    specialties[user.clinical_settings.medical_specialty];

  const stats = [
    { label: "Active Patients", value: "7", color: T.teal },
    { label: "Notes Pending", value: "3", color: T.amber },
    { label: "Orders Queue", value: "12", color: T.purple },
    { label: "Shift Hours", value: "4.2", color: T.green },
  ];

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 40, background: T.navy }}>
      {/* Top Info Bar */}
      <div
        style={{
          height: "22px",
          background: `linear-gradient(90deg, ${T.navy}, ${T.slate})`,
          borderBottom: `1px solid ${T.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          fontSize: "11px",
        }}
      >
        <div style={{ color: T.dim }}>
          <span style={{ color: T.bright }}>ClinAI</span> — Provider Dashboard
        </div>
        <div style={{ color: T.dim }}>
          Emergency Medicine • Emergency Department — Bay 7
        </div>
      </div>

      {/* Welcome Bar with Stats */}
      <div
        style={{
          height: "72px",
          background: `linear-gradient(135deg, ${T.panel}, rgba(0,212,188,0.04))`,
          borderBottom: `1px solid ${T.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          gap: "16px",
        }}
      >
        {/* Left: Welcome Message */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
          <div style={{ fontSize: "28px" }}>👩‍⚕️</div>
          <div>
            <div style={{ fontFamily: "Playfair Display, serif", fontSize: "20px", color: T.bright, fontWeight: 500 }}>
              Good morning, <span style={{ color: T.teal }}>Reyes</span>
            </div>
            <div style={{ fontSize: "11px", color: T.dim }}>
              <span style={{ color: T.amber }}>Emergency Medicine</span> • undefined • Day Shift • Emergency Department — Bay 7
            </div>
          </div>
        </div>

        {/* Center: Stats Pills */}
        <div style={{ display: "flex", gap: "12px", flex: 1, justifyContent: "center", minWidth: "fit-content" }}>
          {stats.map((stat, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "8px 16px",
                background: T.edge,
                borderRadius: "8px",
                border: `1px solid ${T.border}`,
              }}
            >
              <div style={{ fontSize: "16px", color: stat.color, fontWeight: 700 }}>
                {stat.value}
              </div>
              <div style={{ fontSize: "9px", color: T.dim, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "2px" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Right: Status & Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: "fit-content" }}>
          <div
            style={{
              padding: "5px 11px",
              borderRadius: "6px",
              background: "rgba(255,92,108,0.1)",
              border: "1px solid rgba(255,92,108,0.2)",
              fontSize: "10px",
              color: "#ff8a95",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            🏥 Emergency Medicine
          </div>

          <div
            style={{
              padding: "5px 11px",
              borderRadius: "6px",
              background: T.edge,
              border: `1px solid ${T.border}`,
              fontSize: "10px",
              color: T.teal,
              fontFamily: "JetBrains Mono, monospace",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            🕐 {hours}:{minutes} — 18:00
          </div>

          <div
            style={{
              padding: "5px 11px",
              borderRadius: "6px",
              background: T.edge,
              border: `1px solid ${T.border}`,
              fontSize: "9px",
              color: T.dim,
              fontFamily: "JetBrains Mono, monospace",
              whiteSpace: "nowrap",
            }}
          >
            Day Shift — 23hrs
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "5px 11px",
              borderRadius: "6px",
              background: "rgba(46,204,113,0.1)",
              border: "1px solid rgba(46,204,113,0.2)",
              fontSize: "10px",
              color: T.green,
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            ● AI ACTIVE
          </div>

          <button
            style={{
              padding: "5px 11px",
              borderRadius: "6px",
              background: "transparent",
              border: `1px solid ${T.border}`,
              color: T.text,
              fontSize: "10px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = T.teal;
              e.currentTarget.style.color = T.teal;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = T.border;
              e.currentTarget.style.color = T.text;
            }}
          >
            Preferences
          </button>

          <button
            style={{
              padding: "5px 12px",
              borderRadius: "6px",
              background: `linear-gradient(135deg, ${T.teal}, ${T.teal2})`,
              border: "none",
              color: T.navy,
              fontSize: "10px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.9";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
          >
            + New Note
          </button>
        </div>
      </div>
    </div>
  );
}