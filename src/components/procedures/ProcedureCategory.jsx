import React, { useState, useMemo } from "react";
import { ChevronDown } from "lucide-react";

export default function ProcedureCategory({ category, templates, isOpen, onToggle, onSelectTemplate, selectedTemplate, T, CATEGORY_COLORS }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return templates.filter(t => t.label.toLowerCase().includes(search.toLowerCase()));
  }, [search, templates]);

  const cc = CATEGORY_COLORS[category.id] || { bg: "rgba(74,114,153,0.12)", fg: "#4a7299" };

  return (
    <div style={{ borderBottom: `1px solid ${T.border}` }}>
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          padding: "14px 16px",
          background: isOpen ? `rgba(22,45,79,0.8)` : "transparent",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 12,
          transition: "all 0.2s",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(22,45,79,0.5)"}
        onMouseLeave={e => !isOpen && (e.currentTarget.style.background = "transparent")}
      >
        <span style={{ fontSize: 18 }}>{category.icon}</span>
        <div style={{ flex: 1, textAlign: "left" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.bright }}>{category.label}</div>
          <div style={{ fontSize: 11, color: T.dim }}>{templates.length} template{templates.length !== 1 ? "s" : ""}</div>
        </div>
        <ChevronDown
          size={18}
          color={T.dim}
          style={{
            transition: "transform 0.2s",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {isOpen && (
        <div style={{ background: "rgba(14,35,64,0.4)", padding: "12px 16px", borderTop: `1px solid ${T.border}` }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search templates…"
            style={{
              width: "100%",
              background: T.edge,
              border: `1px solid ${T.border}`,
              borderRadius: 7,
              padding: "8px 12px",
              color: T.bright,
              fontSize: 12,
              fontFamily: "DM Sans,sans-serif",
              outline: "none",
              boxSizing: "border-box",
              marginBottom: 8,
            }}
            onFocus={e => (e.target.style.borderColor = cc.fg)}
            onBlur={e => (e.target.style.borderColor = T.border)}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "16px 12px", textAlign: "center", color: T.dim, fontSize: 12 }}>
                No templates found
              </div>
            ) : (
              filtered.map(tmpl => (
                <button
                  key={tmpl.id}
                  onClick={() => onSelectTemplate(tmpl)}
                  style={{
                    padding: "10px 12px",
                    textAlign: "left",
                    background: selectedTemplate?.id === tmpl.id ? `rgba(${parseInt(cc.fg.slice(1, 3), 16)},${parseInt(cc.fg.slice(3, 5), 16)},${parseInt(cc.fg.slice(5, 7), 16)},0.15)` : "transparent",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = `rgba(${parseInt(cc.fg.slice(1, 3), 16)},${parseInt(cc.fg.slice(3, 5), 16)},${parseInt(cc.fg.slice(5, 7), 16)},0.1)`)}
                  onMouseLeave={e => (e.currentTarget.style.background = selectedTemplate?.id === tmpl.id ? `rgba(${parseInt(cc.fg.slice(1, 3), 16)},${parseInt(cc.fg.slice(3, 5), 16)},${parseInt(cc.fg.slice(5, 7), 16)},0.15)` : "transparent")}
                >
                  <span style={{ fontSize: 14 }}>{tmpl.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: selectedTemplate?.id === tmpl.id ? 700 : 500, color: selectedTemplate?.id === tmpl.id ? cc.fg : T.text }}>
                    {tmpl.label}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}