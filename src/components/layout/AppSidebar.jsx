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
  { emoji: "📅", label: "Calendar", page: "Calendar" },
];

export default function AppSidebar({ user }) {
  const initials = user?.full_name
    ? user.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <div
      style={{
        width: 80,
        minHeight: "calc(100vh - 52px)",
        background: "linear-gradient(180deg, #0b1628 0%, #0d1f3c 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 16,
        paddingBottom: 20,
        gap: 6,
        position: "fixed",
        left: 0,
        top: 52,
        bottom: 0,
        zIndex: 50,
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Logo */}
      <div
        style={{
          width: 48,
          height: 40,
          borderRadius: 10,
          background: "#f5f5f5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
          flexShrink: 0,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
        title="MedNu. AI"
      >
        <span style={{ fontSize: 14, fontWeight: 800, color: "#1e1b4b", letterSpacing: "-0.5px" }}>
          medn<span style={{ color: "#6d28d9" }}>u.</span>
        </span>
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