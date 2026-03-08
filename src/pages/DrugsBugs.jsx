import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowRight } from "lucide-react";

const COLORS = {
  navy: "#050f1e",
  slate: "#0b1d35",
  panel: "#0d2240",
  edge: "#162d4f",
  border: "#1e3a5f",
  muted: "#2a4d72",
  dim: "#4a7299",
  text: "#c8ddf0",
  bright: "#e8f4ff",
  teal: "#00d4bc",
  amber: "#f5a623",
  red: "#ff5c6c",
  green: "#2ecc71",
  purple: "#9b6dff",
  blue: "#4a90d9",
  orange: "#ff8c42",
};

const MODULES = [
  {
    id: "drugs",
    title: "Drug Reference",
    subtitle: "Comprehensive Pharmacology",
    icon: "💊",
    description: "Drug monographs, interactions, contraindications, dosing, renal/hepatic adjustments",
    page: "DrugReference",
    color: COLORS.blue,
    tags: ["Interactions", "Dosing", "Contraindications"],
  },
  {
    id: "bugs",
    title: "Antibiotic Stewardship",
    subtitle: "Infection Management",
    icon: "🦠",
    description: "Evidence-based antibiotic selection, MRSA coverage, ESKAPE pathogens, de-escalation protocols",
    page: "AntibioticStewardship",
    color: COLORS.green,
    tags: ["IDSA Guidelines", "De-escalation", "MRSA"],
  },
  {
    id: "peds",
    title: "Pediatric Dosing",
    subtitle: "Child-Specific Medications",
    icon: "👶",
    description: "Weight-based dosing calculations, age-specific reference ranges, emergency resuscitation dosing",
    page: "PediatricDosing",
    color: COLORS.orange,
    tags: ["Weight-based", "Age-specific", "Resuscitation"],
  },
];

function ModuleCard({ module, navigate }) {
  return (
    <button
      onClick={() => navigate(createPageUrl(module.page))}
      style={{
        position: "relative",
        overflow: "hidden",
        padding: 24,
        borderRadius: 16,
        background: COLORS.panel,
        border: `1px solid ${COLORS.border}`,
        textDecoration: "none",
        color: "inherit",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        transition: "all 0.22s",
        cursor: "pointer",
        animation: "fadeUp 0.5s ease both",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.borderColor = module.color;
        e.currentTarget.style.boxShadow = `0 16px 48px rgba(0,0,0,0.5), 0 0 1px ${module.color}40`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderColor = COLORS.border;
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 40,
          background: `${module.color}18`,
          border: `1px solid ${module.color}40`,
        }}
      >
        {module.icon}
      </div>

      {/* Title + Subtitle */}
      <div style={{ textAlign: "left" }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.bright, letterSpacing: "-0.01em", marginBottom: 4 }}>
          {module.title}
        </div>
        <div style={{ fontSize: 13, color: module.color, fontWeight: 600 }}>
          {module.subtitle}
        </div>
      </div>

      {/* Description */}
      <p style={{ fontSize: 13.5, color: COLORS.dim, lineHeight: 1.6, margin: 0 }}>
        {module.description}
      </p>

      {/* Tags */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {module.tags.map((tag) => (
          <span
            key={tag}
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: "4px 10px",
              borderRadius: 6,
              background: `${module.color}20`,
              color: module.color,
              border: `1px solid ${module.color}40`,
            }}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Arrow button */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: "auto",
          padding: "10px 14px",
          borderRadius: 8,
          background: `${module.color}12`,
          border: `1px solid ${module.color}35`,
          width: "fit-content",
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 700, color: module.color }}>
          Open
        </span>
        <ArrowRight size={14} style={{ color: module.color }} />
      </div>
    </button>
  );
}

export default function DrugsBugs() {
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: COLORS.navy, minHeight: "100vh", color: COLORS.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;600;700&display=swap');
        * { box-sizing: border-box; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Hero Section */}
      <div style={{ position: "relative", padding: "60px 40px", textAlign: "center", background: `linear-gradient(135deg, rgba(0,212,188,.08), rgba(74,144,217,.06))` }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 24,
              padding: "8px 16px",
              borderRadius: 20,
              background: `rgba(0,212,188,.1)`,
              border: `1px solid rgba(0,212,188,.3)`,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.teal, letterSpacing: "0.08em" }}>
              ⚕ CLINICAL PHARMACOLOGY
            </span>
          </div>

          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(40px, 5vw, 56px)",
              fontWeight: 900,
              color: COLORS.bright,
              letterSpacing: "-0.02em",
              marginBottom: 16,
              lineHeight: 1.1,
            }}
          >
            Drugs & <span style={{ color: COLORS.teal }}>Bugs</span>
          </h1>

          <p style={{ fontSize: 16, color: COLORS.dim, lineHeight: 1.7, marginBottom: 0 }}>
            Your complete pharmacology reference suite. Find drug interactions, antibiotic protocols, and pediatric dosing all in one place.
          </p>
        </div>
      </div>

      {/* Module Cards Grid */}
      <div style={{ padding: "60px 40px", maxWidth: 1200, margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 24,
          }}
        >
          {MODULES.map((module) => (
            <ModuleCard key={module.id} module={module} navigate={navigate} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "40px",
          textAlign: "center",
          borderTop: `1px solid ${COLORS.border}`,
          color: COLORS.muted,
          fontSize: 12,
        }}
      >
        <div>Evidence-based clinical decision support · Powered by Notrya AI</div>
      </div>
    </div>
  );
}