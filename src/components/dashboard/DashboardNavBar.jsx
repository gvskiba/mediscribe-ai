import React from "react";
import { createPageUrl } from "@/utils";

const T = {
  navy: "#050f1e",
  slate: "#0b1d35",
  border: "#1e3a5f",
  text: "#c8ddf0",
  bright: "#e8f4ff",
  teal: "#00d4bc",
};

export default function DashboardNavBar({ currentPage = "Dashboard" }) {
  const navItems = [
    { label: "Dashboard", page: "Dashboard" },
    { label: "Shift", page: "Shift" },
    { label: "Procedures", page: "Procedures" },
    { label: "Guidelines", page: "Guidelines" },
  ];

  return (
    <div
      style={{
        background: T.navy,
        borderBottom: `1px solid ${T.border}`,
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        gap: "32px",
        height: "64px",
        position: "relative",
      }}
    >
      {/* Branding */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
        <span style={{ fontSize: "22px", fontWeight: 700, color: T.bright }}>
          Notrya
        </span>
        <span style={{ fontSize: "22px", fontWeight: 700, color: T.teal }}>
          AI
        </span>
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", gap: "0", alignItems: "stretch" }}>
        {navItems.map((item) => {
          const isActive = currentPage === item.page;
          return (
            <a
              key={item.page}
              href={createPageUrl(item.page)}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "0 16px",
                color: isActive ? T.teal : T.text,
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: 500,
                position: "relative",
                transition: "all 0.2s ease",
                borderBottom: isActive ? `3px solid ${T.teal}` : "3px solid transparent",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = T.bright;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = T.text;
                }
              }}
            >
              {item.label}
            </a>
          );
        })}
      </div>
    </div>
  );
}