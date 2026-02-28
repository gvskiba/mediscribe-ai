import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ChevronRight } from "lucide-react";

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
  const [expanded, setExpanded] = useState(false);

  const initials = user?.full_name
    ? user.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const width = expanded ? 192 : 64;

  return (
    <div
      style={{
        width,
        minHeight: "100vh",
        background: "linear-gradient(180deg, #0b1628 0%, #0d1f3c 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: expanded ? "flex-start" : "center",
        paddingTop: 16,
        paddingBottom: 20,
        gap: 6,
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 50,
        borderRight: "1px solid rgba(255,255,255,0.06)",
        transition: "width 0.2s ease",
        overflow: "hidden",
      }}
    >
      {/* Logo + toggle row */}
      <div style={{
        display: "flex",
        alignItems: "center",
        width: "100%",
        paddingLeft: expanded ? 12 : 0,
        paddingRight: expanded ? 8 : 0,
        justifyContent: expanded ? "space-between" : "center",
        marginBottom: 20,
        flexShrink: 0,
      }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: "linear-gradient(135deg, #00c9b1, #0891b2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            fontWeight: 700,
            color: "#fff",
            flexShrink: 0,
            boxShadow: "0 4px 14px rgba(0,201,177,0.35)",
          }}
        >
          C
        </div>
        {expanded && (
          <span style={{ fontSize: 13, fontWeight: 700, color: "#c8ddf0", whiteSpace: "nowrap", marginLeft: 10, flex: 1 }}>
            ClinAI
          </span>
        )}
        <button
          onClick={() => setExpanded(e => !e)}
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            background: "rgba(255,255,255,0.07)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginLeft: expanded ? 0 : -4,
          }}
          title={expanded ? "Collapse" : "Expand"}
        >
          <ChevronRight
            size={14}
            color="#4a7299"
            style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
          />
        </button>
      </div>

      {/* Nav Items */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: expanded ? "flex-start" : "center",
        gap: 4,
        flex: 1,
        width: "100%",
        paddingLeft: expanded ? 8 : 0,
        paddingRight: expanded ? 8 : 0,
      }}>
        {navItems.map((item) => (
          <Link
            key={item.page}
            to={createPageUrl(item.page)}
            title={!expanded ? item.label : undefined}
            style={{
              width: expanded ? "100%" : 44,
              height: 44,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: expanded ? "flex-start" : "center",
              gap: 10,
              paddingLeft: expanded ? 10 : 0,
              fontSize: 22,
              cursor: "pointer",
              textDecoration: "none",
              transition: "background 0.15s",
              background: "transparent",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
          >
            <span style={{ flexShrink: 0 }}>{item.emoji}</span>
            {expanded && (
              <span style={{ fontSize: 13, fontWeight: 600, color: "#c8ddf0" }}>{item.label}</span>
            )}
          </Link>
        ))}
      </div>

      {/* User Avatar */}
      {user && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          paddingLeft: expanded ? 12 : 0,
          width: "100%",
          justifyContent: expanded ? "flex-start" : "center",
        }}>
          <div
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
              cursor: "default",
            }}
            title={user.full_name || user.email}
          >
            {initials}
          </div>
          {expanded && (
            <span style={{ fontSize: 12, color: "#4a7299", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 110 }}>
              {user.full_name || user.email}
            </span>
          )}
        </div>
      )}
    </div>
  );
}