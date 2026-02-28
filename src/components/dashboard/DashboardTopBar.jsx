import React, { useState, useEffect } from "react";
import { Zap, Edit2, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";

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
  const [editMode, setEditMode] = useState(false);
  const [editing, setEditing] = useState({});
  const [formData, setFormData] = useState({
    specialty: "",
    bay_number: "",
    shift_type: "day",
    shift_duration: 12,
  });

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user?.clinical_settings) {
      setFormData({
        specialty: user.clinical_settings.medical_specialty || "",
        bay_number: user.clinical_settings.bay_number || "",
        shift_type: user.clinical_settings.shift_type || "day",
        shift_duration: user.clinical_settings.shift_duration || 12,
      });
    }
  }, [user]);

  const hours = String(time.getHours()).padStart(2, "0");
  const minutes = String(time.getMinutes()).padStart(2, "0");
  const lastName = user?.full_name?.split(" ").pop() || "Provider";

  const specialties = {
    emergency_medicine: "Emergency Medicine",
    internal_medicine: "Internal Medicine",
    family_medicine: "Family Medicine",
    pediatrics: "Pediatrics",
    cardiology: "Cardiology",
  };

  const specialty = formData.specialty && specialties[formData.specialty];

  const stats = [
    { label: "Active Patients", value: "7", color: T.teal },
    { label: "Notes Pending", value: "3", color: T.amber },
    { label: "Orders Queue", value: "12", color: T.purple },
    { label: "Shift Hours", value: "4.2", color: T.green },
  ];

  const handleSave = async () => {
    try {
      await base44.auth.updateMe({
        clinical_settings: {
          ...user?.clinical_settings,
          medical_specialty: formData.specialty,
          bay_number: formData.bay_number,
          shift_type: formData.shift_type,
          shift_duration: formData.shift_duration,
        },
      });
      setEditMode(false);
      setEditing({});
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 40, background: T.navy }}>
      {/* Gradient Top Bar */}
      <div
        style={{
          height: "4px",
          background: "linear-gradient(90deg, #ff006e, #ff5c00, #f5a623, #2ecc71, #00d4bc)",
          borderBottom: "none",
        }}
      />

      {/* Welcome Bar with Stats */}
      <div
        style={{
          height: "auto",
          background: `linear-gradient(135deg, ${T.panel}, rgba(0,212,188,0.04))`,
          borderBottom: `1px solid ${T.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 20px",
          gap: "16px",
        }}
      >
        {/* Left: Greeting & Role */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0, flex: 0 }}>
          <div style={{ fontSize: "18px" }}>👨‍⚕️</div>
          <div>
            <div style={{ fontSize: "13px", color: T.bright, fontWeight: 500 }}>
              Good morning, <span style={{ color: T.teal }}>{lastName}</span>
            </div>
            <div style={{ fontSize: "10px", color: T.dim }}>
              {specialty || "Set Specialty"} • Emergency Department
            </div>
          </div>
        </div>

      {/* Middle: Stats */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px", flex: 1, justifyContent: "center" }}>
        {stats.map((stat, idx) => (
          <div key={idx} style={{ textAlign: "center" }}>
            <div style={{ fontSize: "12px", fontWeight: 600, color: stat.color }}>
              {stat.value}
            </div>
            <div style={{ fontSize: "9px", color: T.dim, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Right: Shift Time */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: "fit-content", flex: 0 }}>
        <div
          style={{
            padding: "8px 14px",
            borderRadius: "8px",
            background: "transparent",
            border: `2px solid ${T.teal}`,
            fontSize: "12px",
            color: T.teal,
            fontFamily: "JetBrains Mono, monospace",
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          🕐 {hours}:{minutes} → 18:00
        </div>
        <div style={{ fontSize: "11px", color: T.text }}>
          Day Shift — {formData.shift_duration} hrs
        </div>
      </div>
      </div>
    </div>
  );
}