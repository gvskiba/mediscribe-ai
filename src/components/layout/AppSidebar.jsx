import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";

const navGroups = [
  {
    label: "Core",
    items: [
      { emoji: "🏠", label: "Home", page: "Home" },
      { emoji: "🧠", label: "Dashboard", page: "Dashboard" },
      { emoji: "🏥", label: "Shift", page: "Shift" },
      { emoji: "👤", label: "Patients", page: "PatientDashboard" },
      { emoji: "🆕", label: "New Pt", page: "NewPatientInput" },
    ],
  },
  {
    label: "Documentation",
    items: [
      { emoji: "✨", label: "Note Hub", page: "NoteCreationHub" },
      { emoji: "🎙️", label: "Transcription", page: "LiveTranscription" },
      { emoji: "📋", label: "SOAP", page: "SoapCompiler" },
      { emoji: "🩺", label: "Note Studio", page: "ClinicalNoteStudio" },
      { emoji: "📝", label: "Notes", page: "NotesLibrary" },
      { emoji: "📑", label: "Orders", page: "OrderSetBuilder" },
      { emoji: "🚪", label: "Discharge", page: "DischargePlanning" },
    ],
  },
  {
    label: "Reference",
    items: [
      { emoji: "💊", label: "Drugs", page: "MedicationReference" },
      { emoji: "🦠", label: "Antibiotics", page: "AntibioticStewardship" },
      { emoji: "🧮", label: "Calculators", page: "Calculators" },
      { emoji: "🔬", label: "Knowledge", page: "KnowledgeBaseV2" },
    ],
  },
  {
    label: "Tools",
    items: [
      { emoji: "📄", label: "Templates", page: "NoteTemplates" },
      { emoji: "💬", label: "Snippets", page: "Snippets" },
      { emoji: "🚨", label: "Can't-Miss", page: "CantMissDiagnoses" },
      { emoji: "📅", label: "Calendar", page: "Calendar" },
      { emoji: "📰", label: "News", page: "MedicalNews" },
    ],
  },
];

export default function AppSidebar({ user }) {
  const location = useLocation();
  const initials = user?.full_name
    ? user.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const isActive = (page) => location.pathname.includes(page.toLowerCase());

  return (
    <div
      style={{
        width: 72,
        minHeight: "100vh",
        background: "#0a1628",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 12,
        paddingBottom: 16,
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 50,
        borderRight: "1px solid rgba(255,255,255,0.07)",
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      {/* Logo */}
      <Link
        to={createPageUrl("Home")}
        style={{
          width: 40,
          height: 34,
          borderRadius: 8,
          background: "#f5f5f5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 14,
          flexShrink: 0,
          textDecoration: "none",
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 800, color: "#1e1b4b", letterSpacing: "-0.5px" }}>
          N<span style={{ color: "#6d28d9" }}>.</span>
        </span>
      </Link>

      {/* Nav Groups */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0, flex: 1, width: "100%" }}>
        {navGroups.map((group, gi) => (
          <div key={group.label} style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
            {/* Group label */}
            {gi > 0 && (
              <div style={{ width: 48, height: 1, background: "rgba(255,255,255,0.08)", margin: "5px 0" }} />
            )}
            <span style={{
              fontSize: 8,
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: "rgba(255,255,255,0.25)",
              textTransform: "uppercase",
              marginBottom: 3,
              marginTop: gi === 0 ? 0 : 2,
            }}>
              {group.label}
            </span>
            {group.items.map((item) => {
              const active = isActive(item.page);
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  style={{
                    width: 58,
                    borderRadius: 9,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1,
                    padding: "5px 2px",
                    cursor: "pointer",
                    textDecoration: "none",
                    background: active ? "rgba(99,179,237,0.15)" : "transparent",
                    boxShadow: active ? "inset 0 0 0 1px rgba(99,179,237,0.25)" : "none",
                    margin: "1px auto",
                    transition: "all 0.12s",
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
                >
                  <span style={{ fontSize: 17, lineHeight: 1 }}>{item.emoji}</span>
                  <span style={{
                    fontSize: 9,
                    fontWeight: 500,
                    color: active ? "#93c5fd" : "rgba(255,255,255,0.45)",
                    letterSpacing: "0.01em",
                    lineHeight: 1.2,
                    textAlign: "center",
                  }}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* User Avatar */}
      <div style={{ marginTop: 8 }}>
        <Link
          to={createPageUrl("UserSettings")}
          title={user?.full_name || "Settings"}
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 700,
            color: "#fff",
            textDecoration: "none",
          }}
        >
          {initials}
        </Link>
      </div>
    </div>
  );
}