import React from "react";
import { Check } from "lucide-react";

const T = {
  navy: "#050f1e",
  panel: "#0b1d35",
  edge: "#0e2340",
  border: "#1e3a5f",
  dim: "#4a7299",
  text: "#c8ddf0",
  bright: "#e8f4ff",
  teal: "#00d4bc",
  green: "#2ecc71",
};

const SOAP_SECTIONS = [
  {
    id: "S",
    label: "Subjective",
    sub: "HPI · ROS · Vitals",
    tabs: ["patient_intake"],
    color: T.teal,
    bg: "rgba(0,212,188,0.08)",
    border: `1px solid rgba(0,212,188,0.25)`,
  },
  {
    id: "O",
    label: "Objective",
    sub: "Exam · Labs · Imaging",
    tabs: ["physical_exam", "labs_imaging"],
    color: "#7ed6df",
    bg: "transparent",
    border: `1px solid transparent`,
  },
  {
    id: "A",
    label: "Assessment",
    sub: "Diagnoses · DDx",
    tabs: ["differential", "diagnoses", "mdm"],
    color: "#dfe6e9",
    bg: "transparent",
    border: `1px solid transparent`,
    done: true,
  },
  {
    id: "P",
    label: "Plan",
    sub: "Orders · Medications",
    tabs: ["treatment_plan", "medications", "procedures"],
    color: "#b2bec3",
    bg: "transparent",
    border: `1px solid transparent`,
  },
];

export default function NoteSOAPNav({ activeTab, onTabChange }) {
  const getActiveSection = () =>
    SOAP_SECTIONS.find(s => s.tabs.includes(activeTab)) || SOAP_SECTIONS[0];

  const activeSection = getActiveSection();

  return (
    <div style={{
      display: "flex",
      alignItems: "stretch",
      background: T.edge,
      borderBottom: `1px solid ${T.border}`,
      padding: "0 12px",
      gap: 6,
    }}>
      {SOAP_SECTIONS.map((section, idx) => {
        const isActive = section.id === activeSection.id;
        const isPrev = SOAP_SECTIONS.indexOf(activeSection) > idx;

        return (
          <button
            key={section.id}
            onClick={() => section.tabs[0] && onTabChange(section.tabs[0])}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 16px",
              borderRadius: 8,
              margin: "6px 0",
              cursor: "pointer",
              border: isActive ? section.border : "1px solid transparent",
              background: isActive ? section.bg : "transparent",
              transition: "all 0.15s",
              minWidth: 0,
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
          >
            {/* Letter badge */}
            <div style={{
              width: 26, height: 26, borderRadius: 7, flexShrink: 0,
              background: isActive ? section.color : isPrev ? "rgba(46,204,113,0.15)" : "rgba(255,255,255,0.05)",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: isActive ? "none" : isPrev ? "1px solid rgba(46,204,113,0.3)" : `1px solid ${T.border}`,
            }}>
              {isPrev ? (
                <Check size={13} color={T.green} />
              ) : (
                <span style={{
                  fontSize: 12, fontWeight: 800,
                  color: isActive ? T.navy : T.dim,
                }}>{section.id}</span>
              )}
            </div>

            {/* Labels */}
            <div style={{ display: "flex", flexDirection: "column", gap: 1, textAlign: "left" }}>
              <span style={{
                fontSize: 12, fontWeight: 700,
                color: isActive ? section.color : isPrev ? T.text : T.dim,
                lineHeight: 1,
              }}>{section.label}</span>
              <span style={{ fontSize: 10, color: T.dim, lineHeight: 1 }}>{section.sub}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}