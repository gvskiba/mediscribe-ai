import React from "react";
import { G, SPECIALTIES, PRI_CFG } from "./orderSetData";

export default function ConditionSidebar({ conditions, customTemplates, activeId, onSelect }) {
  return (
    <div style={{
      width: 252, flexShrink: 0, background: `linear-gradient(170deg,${G.slate},${G.navy})`,
      borderRight: `1px solid ${G.border}`, display: "flex", flexDirection: "column",
      overflowY: "auto", height: "100%",
    }}>
      {/* Header */}
      <div style={{ padding: "14px 16px 10px", borderBottom: `1px solid ${G.border}` }}>
        <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".1em", color: G.dim, marginBottom: 2 }}>
          Condition Library
        </div>
        <div style={{ fontSize: 11, color: G.muted }}>4 evidence-based templates</div>
      </div>

      {/* Specialties */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 8px 0" }}>
        {Object.entries(SPECIALTIES).map(([spec, scfg]) => {
          const specConditions = scfg.conditions.map(id => conditions[id]).filter(Boolean);
          return (
            <div key={spec} style={{ marginBottom: 12 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 7, padding: "5px 8px 6px",
                fontSize: 9.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".09em",
                color: scfg.color,
              }}>
                <span style={{ fontSize: 13 }}>{scfg.icon}</span>
                {spec}
              </div>
              {specConditions.map(cond => {
                const isActive = cond.id === activeId;
                const acuityClr = PRI_CFG[cond.acuity]?.color || G.teal;
                return (
                  <button
                    key={cond.id}
                    onClick={() => onSelect(cond.id)}
                    style={{
                      width: "100%", textAlign: "left", padding: "10px 10px",
                      background: isActive ? `rgba(${hexToRgb(scfg.color)},.08)` : "transparent",
                      border: `1px solid ${isActive ? scfg.color + "44" : "transparent"}`,
                      borderRadius: 9, cursor: "pointer", fontFamily: "inherit",
                      marginBottom: 4, transition: "all .12s",
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,.04)"; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ fontSize: 17, flexShrink: 0 }}>{cond.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: isActive ? G.bright : G.text, lineHeight: 1.3 }}>
                          {cond.name}
                        </div>
                        <div style={{ fontSize: 10, color: G.dim, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {cond.subtitle}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 5, marginTop: 6, flexWrap: "wrap" }}>
                      <span style={{
                        fontSize: 9, fontWeight: 800, padding: "1px 7px", borderRadius: 20,
                        color: acuityClr, background: `${acuityClr}18`, border: `1px solid ${acuityClr}44`,
                      }}>{cond.acuity.toUpperCase()}</span>
                      <span style={{ fontSize: 9, color: G.muted }}>{cond.orders.length} orders</span>
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })}

        {/* Custom institution templates */}
        {customTemplates.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ padding: "5px 8px 6px", fontSize: 9.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".09em", color: G.gold }}>
              🏥 Institution Templates
            </div>
            {customTemplates.map(t => (
              <button
                key={t.id}
                onClick={() => onSelect("custom:" + t.id)}
                style={{
                  width: "100%", textAlign: "left", padding: "9px 10px",
                  background: activeId === "custom:" + t.id ? "rgba(240,192,64,.08)" : "transparent",
                  border: `1px solid ${activeId === "custom:" + t.id ? G.gold + "44" : "transparent"}`,
                  borderRadius: 9, cursor: "pointer", fontFamily: "inherit", marginBottom: 4,
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.03)"}
                onMouseLeave={e => e.currentTarget.style.background = activeId === "custom:" + t.id ? "rgba(240,192,64,.08)" : "transparent"}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: G.text }}>{t.icon || "📋"} {t.name}</div>
                {t.subtitle && <div style={{ fontSize: 10, color: G.dim, marginTop: 1 }}>{t.subtitle}</div>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: "10px 12px", borderTop: `1px solid ${G.border}`, flexShrink: 0 }}>
        <div style={{ fontSize: 9, color: G.muted, lineHeight: 1.6 }}>
          Guidelines: AHA/ACC/HFSA · SSC 2021 · AHA/ASA 2019 · ADA 2024
        </div>
      </div>
    </div>
  );
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `${r},${g},${b}`;
}