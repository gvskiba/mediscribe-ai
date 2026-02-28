import React, { useState, useEffect } from "react";
import { Clock, Zap } from "lucide-react";

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
    { label: "Active Patients", value: "7" },
    { label: "Active Orders", value: "3" },
    { label: "Orders Queue", value: "12" },
    { label: "Shift Hours", value: "4.2" },
  ];

  return (
    <div
      style={{
        background: `linear-gradient(90deg, ${T.navy}, ${T.slate})`,
        borderBottom: `1px solid ${T.border}`,
        padding: "12px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "fixed",
        top: 64,
        left: 0,
        right: 0,
        zIndex: 30,
      }}
    >
      {/* Left Section: Branding & Greeting */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px", flex: 1 }}>
        <div>
          <div
            style={{
              fontFamily: "Playfair Display, serif",
              fontSize: "16px",
              color: T.bright,
              fontWeight: 600,
            }}
          >
            Good morning, <span style={{ color: T.teal }}>{lastName}</span>
          </div>
          <div style={{ fontSize: "12px", color: T.dim }}>
            {specialty && <span>{specialty}</span>}
            {specialty && " • "}
            <span>Emergency Department — Bay 7</span>
          </div>
        </div>
      </div>

      {/* Center Section: Stats */}
      <div style={{ display: "flex", gap: "12px", flex: 1 }}>
        {stats.map((stat, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "8px 16px",
              background: T.edge,
              borderRadius: "10px",
              border: `1px solid ${T.border}`,
            }}
          >
            <div style={{ fontSize: "11px", color: T.dim, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {stat.label}
            </div>
            <div style={{ fontSize: "18px", color: T.teal, fontWeight: 600, marginTop: "2px" }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Right Section: Controls & Time */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            padding: "6px 12px",
            borderRadius: "8px",
            background: "rgba(239,68,68,0.15)",
            border: "1px solid rgba(239,68,68,0.3)",
            fontSize: "11px",
            color: "#ef4444",
            fontWeight: 600,
          }}
        >
          Emergency Medicine
        </div>

        <div
          style={{
            padding: "6px 12px",
            borderRadius: "8px",
            background: T.edge,
            border: `1px solid ${T.border}`,
            fontSize: "11px",
            color: T.text,
            fontFamily: "JetBrains Mono, monospace",
          }}
        >
          {hours}:{minutes} — 18:00
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "6px 12px",
            borderRadius: "8px",
            background: `rgba(46,204,113,0.15)`,
            border: "1px solid rgba(46,204,113,0.3)",
            fontSize: "11px",
            color: T.green,
            fontWeight: 600,
          }}
        >
          <Zap style={{ width: "12px", height: "12px" }} />
          AI ACTIVE
        </div>

        <button
          style={{
            padding: "6px 12px",
            borderRadius: "8px",
            background: T.edge,
            border: `1px solid ${T.border}`,
            color: T.text,
            fontSize: "11px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s",
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
            padding: "6px 14px",
            borderRadius: "8px",
            background: `linear-gradient(135deg, ${T.teal}, ${T.teal2})`,
            border: "none",
            color: T.navy,
            fontSize: "11px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s",
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
  );
}