import React from "react";
import { createPageUrl } from "@/utils";

const T = {
  navy: "#050f1e",
  slate: "#0b1d35",
  border: "#1e3a5f",
  text: "#c8ddf0",
  bright: "#e8f4ff",
  teal: "#00d4bc",
  green: "#2ecc71",
};

export default function ShiftNavBar({ shift, elapsed, onEndShift }) {
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        height: 54,
        background: `rgba(11,29,53,0.96)`,
        backdropFilter: "blur(16px)",
        borderBottom: `1px solid ${T.border}`,
        display: "flex",
        alignItems: "center",
        paddingLeft: 20,
        paddingRight: 20,
        gap: 32,
        zIndex: 90,
      }}>
      <a href={createPageUrl("Dashboard")} style={{ textDecoration: "none", display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ fontFamily: "Playfair Display, serif", fontSize: 16, fontWeight: 700, color: T.bright }}>Notrya</span>
        <span style={{ color: T.teal, fontWeight: 700 }}>AI</span>
      </a>

      <div style={{ display: "flex", gap: 24, flex: 1 }}>
        {[
          { label: "Dashboard", href: "Dashboard", active: false },
          { label: "Shift", href: "Shift", active: true },
          { label: "Procedures", href: "Procedures", active: false },
          { label: "Guidelines", href: "ClinicalGuidelines", active: false },
        ].map((link) => (
          <a
            key={link.href}
            href={createPageUrl(link.href)}
            style={{
              textDecoration: "none",
              color: link.active ? T.teal : T.text,
              fontSize: 13,
              fontWeight: link.active ? 600 : 500,
              borderBottom: link.active ? `2px solid ${T.teal}` : "none",
              paddingBottom: 2,
              transition: "all 0.2s",
            }}>
            {link.label}
          </a>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16, marginLeft: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: T.green,
              boxShadow: `0 0 8px ${T.green}`,
            }}
          />
          <span style={{ fontSize: 12, color: T.dim }}>Live</span>
        </div>

        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: T.bright }}>
          {formatTime(elapsed)} elapsed
        </div>

        <button
          onClick={onEndShift}
          style={{
            padding: "6px 14px",
            borderRadius: 6,
            background: "rgba(255,92,108,0.1)",
            border: `1px solid rgba(255,92,108,0.3)`,
            color: "#ff5c6c",
            fontWeight: 600,
            fontSize: 12,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,92,108,0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,92,108,0.1)";
          }}>
          🔴 End Shift
        </button>
      </div>
    </nav>
  );
}