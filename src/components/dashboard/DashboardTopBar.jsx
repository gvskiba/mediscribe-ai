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
        {/* Left: Welcome Message */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
          <div style={{ fontSize: "28px" }}>👩‍⚕️</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "Playfair Display, serif", fontSize: "20px", color: T.bright, fontWeight: 500 }}>
              Good morning, <span style={{ color: T.teal }}>{lastName}</span>
            </div>
            <div style={{ fontSize: "11px", color: T.dim, display: "flex", alignItems: "center", gap: "4px" }}>
              {editMode && editing.specialty ? (
                <select
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  style={{ padding: "2px 6px", borderRadius: "4px", background: T.edge, border: `1px solid ${T.border}`, color: T.text, fontSize: "11px" }}
                >
                  <option value="">Select Specialty</option>
                  {Object.entries(specialties).map(([key, val]) => (
                    <option key={key} value={key}>{val}</option>
                  ))}
                </select>
              ) : (
                <span style={{ color: T.amber, cursor: "pointer" }} onClick={() => { setEditMode(true); setEditing({ ...editing, specialty: true }); }}>
                  {specialty || "Set Specialty"}
                </span>
              )}
              {" • "}
              {editMode && editing.bay ? (
                <input
                  type="text"
                  value={formData.bay_number}
                  onChange={(e) => setFormData({ ...formData, bay_number: e.target.value })}
                  placeholder="Bay #"
                  style={{ padding: "2px 6px", borderRadius: "4px", background: T.edge, border: `1px solid ${T.border}`, color: T.text, fontSize: "11px", width: "50px" }}
                />
              ) : (
                <span style={{ cursor: "pointer" }} onClick={() => { setEditMode(true); setEditing({ ...editing, bay: true }); }}>
                  {formData.bay_number ? `Bay ${formData.bay_number}` : "Set Bay"}
                </span>
              )}
              {" • "}
              {editMode && editing.shift ? (
                <select
                  value={formData.shift_type}
                  onChange={(e) => setFormData({ ...formData, shift_type: e.target.value })}
                  style={{ padding: "2px 6px", borderRadius: "4px", background: T.edge, border: `1px solid ${T.border}`, color: T.text, fontSize: "11px" }}
                >
                  <option value="day">Day Shift</option>
                  <option value="night">Night Shift</option>
                </select>
              ) : (
                <span style={{ cursor: "pointer" }} onClick={() => { setEditMode(true); setEditing({ ...editing, shift: true }); }}>
                  {formData.shift_type === "day" ? "Day Shift" : "Night Shift"}
                </span>
              )}
              {" • Emergency Department"}
            </div>
          </div>
          {editMode && (
            <button
              onClick={handleSave}
              style={{
                padding: "5px 10px",
                borderRadius: "6px",
                background: T.teal,
                border: "none",
                color: T.navy,
                fontSize: "10px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <Check style={{ width: "12px", height: "12px" }} />
              Save
            </button>
          )}
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