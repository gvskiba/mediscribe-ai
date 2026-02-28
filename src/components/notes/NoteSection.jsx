import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const T = {
  card: "#0f1624",
  card_hover: "#141f32",
  border: "#1a2236",
  text: "#dde2ef",
  muted: "#4e5a78",
  dim: "#2d3a56",
  teal: "#00cca3",
  teal_dim: "#003328",
  bg: "#080b10",
};

export default function NoteSection({ id, label, icon, accentColor = "teal", collapsible = true, defaultOpen = true, children }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const accentColorMap = {
    teal: T.teal,
    blue: "#3b82f6",
    amber: "#f59e0b",
    purple: "#a78bfa",
    green: "#34d399",
    sky: "#38bdf8",
    red: "#f87171",
  };

  return (
    <div
      id={id}
      style={{
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: "10px",
        padding: "18px 20px",
        marginBottom: "10px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "14px",
          paddingBottom: "12px",
          borderBottom: `1px solid ${T.border}`,
          cursor: collapsible ? "pointer" : "default",
        }}
        onClick={() => collapsible && setIsOpen(!isOpen)}
      >
        <div
          style={{
            width: "3px",
            height: "14px",
            borderRadius: "2px",
            background: accentColorMap[accentColor],
            marginRight: "4px",
          }}
        />
        <span style={{ fontSize: "16px", marginRight: "2px" }}>{icon}</span>
        <span
          style={{
            fontFamily: "Geist Mono",
            fontSize: "10px",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: T.text,
            fontWeight: 500,
            flex: 1,
          }}
        >
          {label}
        </span>
        {collapsible && (isOpen ? <ChevronUp size={16} style={{ color: T.muted }} /> : <ChevronDown size={16} style={{ color: T.muted }} />)}
      </div>

      {/* Content */}
      {(!collapsible || isOpen) && <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>{children}</div>}
    </div>
  );
}