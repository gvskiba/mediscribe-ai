import React, { useState, useEffect } from "react";
import { Zap, Edit2, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "../../utils";

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

  const handleStatClick = (label) => {
    const today = new Date().toISOString().split("T")[0];
    switch (label) {
      case "Active Patients":
        window.location.href = createPageUrl(`NotesLibrary?date=${today}`);
        break;
      case "Notes Pending":
        window.location.href = createPageUrl("NotesLibrary?status=pending");
        break;
      case "Orders Queue":
        window.location.href = createPageUrl("OrdersQueue");
        break;
      case "Shift Hours":
        window.location.href = createPageUrl("ShiftHours");
        break;
      default:
        break;
    }
  };

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
    <div style={{ position: "fixed", top: 0, left: 64, right: 0, zIndex: 40, background: T.navy }}>
      {/* Single Compact Top Bar */}
      <div
        style={{
          height: "auto",
          background: `linear-gradient(135deg, ${T.panel}, rgba(0,212,188,0.04))`,
          borderBottom: `1px solid ${T.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 20px",
          gap: "12px",
          flexWrap: "nowrap",
        }}
      >
        {/* Left: Welcome */}
        <div style={{ fontSize: "11px", color: T.text, fontWeight: 500, whiteSpace: "nowrap", flexShrink: 0 }}>
          Welcome, {lastName}
        </div>

        {/* Stats Buttons - Centered */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1, justifyContent: "center" }}>
          {stats.map((stat) => (
            <button
              key={stat.label}
              onClick={() => handleStatClick(stat.label)}
              style={{
                padding: "4px 8px",
                borderRadius: "6px",
                background: T.edge,
                border: `1px solid ${T.border}`,
                fontSize: "8px",
                color: T.dim,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
                textAlign: "center",
                minWidth: "60px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = stat.color;
                e.currentTarget.style.color = stat.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = T.border;
                e.currentTarget.style.color = T.dim;
              }}
            >
              <div>{stat.label}</div>
              <div style={{ fontSize: "11px", fontWeight: 700 }}>{stat.value}</div>
            </button>
          ))}
        </div>

        {/* Right: Status & Actions - Compact */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "auto", flexShrink: 0 }}>
          <div
            style={{
              padding: "4px 8px",
              borderRadius: "6px",
              background: "rgba(255,92,108,0.1)",
              border: "1px solid rgba(255,92,108,0.2)",
              fontSize: "8px",
              color: "#ff8a95",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            Emergency Medicine
          </div>

          <div
            style={{
              padding: "4px 8px",
              borderRadius: "6px",
              background: T.edge,
              border: `1px solid ${T.border}`,
              fontSize: "8px",
              color: T.teal,
              fontFamily: "JetBrains Mono, monospace",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            {hours}:{minutes}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "3px",
              padding: "4px 8px",
              borderRadius: "6px",
              background: "rgba(46,204,113,0.1)",
              border: "1px solid rgba(46,204,113,0.2)",
              fontSize: "8px",
              color: T.green,
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            ● AI ON
          </div>

          <button
            onClick={async () => {
              const newNote = await base44.entities.ClinicalNote.create({
                raw_note: "",
                patient_name: "New Patient",
                status: "draft"
              });
              window.location.href = createPageUrl(`NoteDetail?id=${newNote.id}`);
            }}
            style={{
              padding: "4px 10px",
              borderRadius: "6px",
              background: `linear-gradient(135deg, ${T.teal}, ${T.teal2})`,
              border: "none",
              color: T.navy,
              fontSize: "9px",
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