import React, { useState, useEffect, useRef } from "react";
import { Zap, Edit2, Check, ChevronDown, Clock } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { createPageUrl } from "../../utils";
import ActivePatientsDropdown from "./ActivePatientsDropdown";

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

const SPECIALTIES = [
  { value: "emergency_medicine", label: "Emergency Medicine" },
  { value: "internal_medicine", label: "Internal Medicine" },
  { value: "family_medicine", label: "Family Medicine" },
  { value: "pediatrics", label: "Pediatrics" },
  { value: "cardiology", label: "Cardiology" },
  { value: "pulmonology", label: "Pulmonology" },
  { value: "neurology", label: "Neurology" },
  { value: "psychiatry", label: "Psychiatry" },
  { value: "surgery", label: "Surgery" },
  { value: "orthopedics", label: "Orthopedics" },
];

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
  const [specialtyOpen, setSpecialtyOpen] = useState(false);
  const [shiftOpen, setShiftOpen] = useState(false);
  const [shiftStart, setShiftStart] = useState(user?.clinical_settings?.shift_start || "");
  const [shiftEnd, setShiftEnd] = useState(user?.clinical_settings?.shift_end || "");
  const specialtyRef = useRef(null);
  const shiftRef = useRef(null);

  // Fetch hospital settings
  const { data: hospitalSettings } = useQuery({
    queryKey: ["hospitalSettings"],
    queryFn: async () => {
      const results = await base44.entities.HospitalSettings.list();
      return results.length > 0 ? results[0] : null;
    },
  });

  const defaultAttending = hospitalSettings?.attendings?.find(
    (a) => a.id === hospitalSettings?.default_attending_id
  );

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
      setShiftStart(user.clinical_settings.shift_start || "");
      setShiftEnd(user.clinical_settings.shift_end || "");
    }
  }, [user]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (specialtyRef.current && !specialtyRef.current.contains(e.target)) setSpecialtyOpen(false);
      if (shiftRef.current && !shiftRef.current.contains(e.target)) setShiftOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const hours = String(time.getHours()).padStart(2, "0");
  const minutes = String(time.getMinutes()).padStart(2, "0");
  
  const formatDisplayName = (user) => {
    if (!user) return "Provider";
    
    // Try to get name from user preferences first
    if (user.first_name && user.last_name) {
      return `Dr. ${user.first_name} ${user.last_name}`;
    }
    
    // Fallback to full_name if preferences not set
    if (user.full_name) {
      const formatted = user.full_name.split('.')
                           .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                           .join(' ');
      return `Dr. ${formatted}`;
    }
    
    return "Provider";
  };
  
  const displayName = formatDisplayName(user);

  const specialty = formData.specialty && SPECIALTIES.find(s => s.value === formData.specialty)?.label;

  const saveSpecialty = async (value) => {
    setFormData(p => ({ ...p, specialty: value }));
    setSpecialtyOpen(false);
    try {
      await base44.auth.updateMe({
        clinical_settings: { ...user?.clinical_settings, medical_specialty: value },
      });
    } catch (e) { console.error(e); }
  };

  const saveShift = async () => {
    setShiftOpen(false);
    try {
      await base44.auth.updateMe({
        clinical_settings: { ...user?.clinical_settings, shift_start: shiftStart, shift_end: shiftEnd },
      });
    } catch (e) { console.error(e); }
  };

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

  const [stats, setStats] = useState([
    { label: "Active Patients", value: "—", color: T.teal },
    { label: "Notes Pending", value: "—", color: T.amber },
    { label: "Orders Queue", value: "—", color: T.purple },
    { label: "Shift Hours", value: "—", color: T.green },
  ]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const notes = await base44.entities.ClinicalNote.list();
        const active = notes?.filter(n => n.status === "draft")?.length || 0;
        const pending = notes?.filter(n => n.status !== "finalized")?.length || 0;

        // Compute shift hours from saved shift_start
        let shiftHours = "—";
        const start = user?.clinical_settings?.shift_start;
        if (start) {
          const [h, m] = start.split(":").map(Number);
          const now = new Date();
          const startMs = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m).getTime();
          const diffH = (Date.now() - startMs) / 3600000;
          if (diffH >= 0 && diffH < 24) shiftHours = diffH.toFixed(1);
        }

        setStats([
          { label: "Active Patients", value: String(active), color: T.teal },
          { label: "Notes Pending", value: String(pending), color: T.amber },
          { label: "Orders Queue", value: "—", color: T.purple },
          { label: "Shift Hours", value: shiftHours, color: T.green },
        ]);
      } catch (e) { console.error(e); }
    };
    loadStats();
  }, [user]);

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
    <div style={{ position: "fixed", top: 0, left: 72, right: 0, zIndex: 40, background: T.navy }}>
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
          Welcome, {displayName}{defaultAttending ? ` • Attending: ${defaultAttending.name}` : ""}
        </div>

        {/* Stats Buttons - Centered */}
         <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1, justifyContent: "center" }}>
           {stats.map((stat) => 
             stat.label === "Active Patients" ? (
               <ActivePatientsDropdown key={stat.label} />
             ) : (
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
             )
           )}
         </div>

        {/* Right: Status & Actions - Compact */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "auto", flexShrink: 0 }}>
          {/* Specialty Dropdown */}
          <div ref={specialtyRef} style={{ position: "relative" }}>
            <button
              onClick={() => setSpecialtyOpen(o => !o)}
              style={{
                padding: "4px 8px",
                borderRadius: "6px",
                background: "rgba(255,92,108,0.1)",
                border: `1px solid ${specialtyOpen ? "rgba(255,92,108,0.6)" : "rgba(255,92,108,0.2)"}`,
                fontSize: "8px",
                color: "#ff8a95",
                fontWeight: 600,
                whiteSpace: "nowrap",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              {specialty || "Select Specialty"}
              <ChevronDown size={10} style={{ transform: specialtyOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
            </button>
            {specialtyOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 200,
                background: T.panel, border: `1px solid ${T.border}`, borderRadius: "8px",
                minWidth: "180px", overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              }}>
                {SPECIALTIES.map(s => (
                  <button key={s.value} onClick={() => saveSpecialty(s.value)}
                    style={{
                      display: "block", width: "100%", textAlign: "left",
                      padding: "8px 12px", fontSize: "11px", cursor: "pointer",
                      background: formData.specialty === s.value ? "rgba(255,92,108,0.15)" : "transparent",
                      color: formData.specialty === s.value ? "#ff8a95" : T.text,
                      border: "none", transition: "background 0.1s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                    onMouseLeave={e => e.currentTarget.style.background = formData.specialty === s.value ? "rgba(255,92,108,0.15)" : "transparent"}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Time + Shift Dropdown */}
          <div ref={shiftRef} style={{ position: "relative" }}>
            <button
              onClick={() => setShiftOpen(o => !o)}
              style={{
                padding: "4px 8px",
                borderRadius: "6px",
                background: T.edge,
                border: `1px solid ${shiftOpen ? T.teal : T.border}`,
                fontSize: "8px",
                color: T.teal,
                fontFamily: "JetBrains Mono, monospace",
                fontWeight: 600,
                whiteSpace: "nowrap",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              {hours}:{minutes}
              <ChevronDown size={10} style={{ transform: shiftOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
            </button>
            {shiftOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 200,
                background: T.panel, border: `1px solid ${T.border}`, borderRadius: "8px",
                minWidth: "200px", padding: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              }}>
                <div style={{ fontSize: "9px", color: T.dim, fontFamily: "monospace", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "10px" }}>Shift Times</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div>
                    <label style={{ fontSize: "9px", color: T.dim, display: "block", marginBottom: "4px" }}>Shift Start</label>
                    <input type="time" value={shiftStart} onChange={e => setShiftStart(e.target.value)}
                      style={{ width: "100%", background: T.edge, border: `1px solid ${T.border}`, borderRadius: "5px", color: T.teal, fontSize: "12px", padding: "5px 8px", outline: "none", fontFamily: "monospace" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "9px", color: T.dim, display: "block", marginBottom: "4px" }}>Shift End</label>
                    <input type="time" value={shiftEnd} onChange={e => setShiftEnd(e.target.value)}
                      style={{ width: "100%", background: T.edge, border: `1px solid ${T.border}`, borderRadius: "5px", color: T.teal, fontSize: "12px", padding: "5px 8px", outline: "none", fontFamily: "monospace" }} />
                  </div>
                  <button onClick={saveShift}
                    style={{ marginTop: "4px", padding: "6px", borderRadius: "5px", background: T.teal, border: "none", color: T.navy, fontSize: "10px", fontWeight: 700, cursor: "pointer" }}>
                    Save Shift
                  </button>
                </div>
              </div>
            )}
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
              window.location.href = createPageUrl(`ClinicalNoteStudio?id=${newNote.id}`);
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