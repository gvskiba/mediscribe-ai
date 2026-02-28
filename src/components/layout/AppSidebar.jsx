import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";

const navItems = [
  { emoji: "🧠", label: "Dashboard", page: "Dashboard" },
  { emoji: "📋", label: "My Notes", page: "NotesLibrary" },
  { emoji: "🏥", label: "Patient Dashboard", page: "PatientDashboard" },
  { emoji: "🔬", label: "Guidelines", page: "Guidelines" },
  { emoji: "🫀", label: "Calculators", page: "Calculators" },
  { emoji: "💊", label: "Snippets", page: "Snippets" },
  { emoji: "⚙️", label: "Settings", page: "UserSettings" },
];

export default function AppSidebar({ user }) {
  const initials = user?.full_name
    ? user.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <div
      style={{
        width: 64,
        minHeight: "100vh",
        background: "linear-gradient(180deg, #0b1628 0%, #0d1f3c 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 16,
        paddingBottom: 20,
        gap: 6,
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 50,
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Logo */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
          fontWeight: 700,
          color: "#fff",
          marginBottom: 20,
          flexShrink: 0,
          boxShadow: "0 4px 14px rgba(37,99,235,0.35)",
        }}
        title="MedNu. AI"
      >
        M.
      </div>

      {/* Nav Items */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
        {navItems.map((item) => (
          <Link
            key={item.page}
            to={createPageUrl(item.page)}
            title={item.label}
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              cursor: "pointer",
              textDecoration: "none",
              transition: "background 0.15s",
              background: "transparent",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
          >
            {item.emoji}
          </Link>
        ))}
      </div>

      {/* User Avatar */}
      {user && (
        <Link
          to={createPageUrl("UserSettings")}
          title={user.full_name || user.email}
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 700,
            color: "#fff",
            flexShrink: 0,
            textDecoration: "none",
          }}
        >
          {initials}
        </Link>
      )}
    </div>
  );
}