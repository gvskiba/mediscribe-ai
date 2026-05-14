import { useState } from 'react';

// ─── Hub catalogue ────────────────────────────────────────────────────────────
export const HUBS = [
  { hubName: "ECG Hub",              category: "Cardiac" },
  { hubName: "Cardiac Risk",         category: "Cardiac" },
  { hubName: "Stroke Hub",           category: "Neurology" },
  { hubName: "Toxicology Hub",       category: "Tox" },
  { hubName: "Electrolyte Hub",      category: "Critical Care" },
  { hubName: "Quick Note",           category: "Documentation" },
  { hubName: "Clinical Note Studio", category: "Documentation" },
  { hubName: "Order Generator",      category: "Documentation" },
  { hubName: "MDM Builder",          category: "Documentation" },
  { hubName: "Imaging Interpreter",  category: "Imaging" },
  { hubName: "Lab Interpreter",      category: "Labs" },
  { hubName: "Dermatology Hub",      category: "Imaging" },
  { hubName: "POCUS Hub",            category: "Procedures" },
  { hubName: "Ortho Hub",            category: "Procedures" },
];

// ─── Category color map ──────────────────────────────────────────────────────
export const CAT_COLOR = {
  "Cardiac":       "#FF6B6B",
  "Neurology":     "#00BFA5",
  "Tox":           "#FF8C42",
  "Documentation": "#9B8BFF",
  "Critical Care": "#F4B942",
  "Imaging":       "#4FC3F7",
  "Labs":          "#81C784",
  "Procedures":    "#CE93D8",
};

// ─── NotryaHubHeader ─────────────────────────────────────────────────────────
/**
 * Standardized header for every Notrya hub page.
 *
 * Usage (minimal):
 *   <NotryaHubHeader hubName="ECG Hub" category="Cardiac" />
 *
 * Usage (with right-side actions):
 *   <NotryaHubHeader
 *     hubName="ECG Hub"
 *     category="Cardiac"
 *     homeUrl="/"
 *     actions={<YourPrintButton />}
 *   />
 *
 * Props:
 *   hubName   string   Hub display name
 *   category  string   Cardiac | Neurology | Tox | Documentation | Critical Care | Imaging | Labs | Procedures
 *   homeUrl   string   Optional. Home navigation target. Default: "/"
 *   actions   node     Optional. Right-side JSX slot (print btn, timer, etc.)
 */
export default function NotryaHubHeader({ 
  hubName = "Hub", 
  category = "Clinical", 
  homeUrl = "/", 
  actions = null 
}) {
  const [hov, setHov] = useState(false);
  const catColor = CAT_COLOR[category] || "#00BFA5";

  const goHome = () => { window.location.href = homeUrl; };

  return (
    <header style={{
      width: "100%",
      background: "rgba(10, 22, 40, 0.95)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      borderBottom: "1px solid rgba(0,191,165,0.18)",
      padding: "0 24px",
      height: "58px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      boxSizing: "border-box",
      fontFamily: '"DM Sans", "Inter", sans-serif',
      position: "sticky",
      top: 0,
      zIndex: 100,
    }}>

      {/* Left — breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>

        {/* Notrya wordmark */}
        <span
          onClick={goHome}
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}
          style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: "17px",
            fontWeight: "700",
            color: hov ? "#00BFA5" : "#E8EDF5",
            cursor: "pointer",
            userSelect: "none",
            transition: "color 0.15s",
            letterSpacing: "-0.3px",
          }}
        >Notrya</span>

        <span style={{ color: "rgba(232,237,245,0.22)", fontSize: "16px", lineHeight: 1, margin: "0 1px" }}>/</span>

        {/* Category */}
        <span style={{
          width: "6px", height: "6px", borderRadius: "50%",
          background: catColor, display: "inline-block", flexShrink: 0,
        }} />
        <span style={{ fontSize: "13px", color: "rgba(232,237,245,0.50)", fontWeight: "400" }}>
          {category}
        </span>

        <span style={{ color: "rgba(232,237,245,0.22)", fontSize: "16px", lineHeight: 1, margin: "0 1px" }}>/</span>

        {/* Hub name */}
        <span style={{
          fontFamily: '"Playfair Display", Georgia, serif',
          fontSize: "16px",
          fontWeight: "600",
          color: "#F4B942",
          letterSpacing: "-0.2px",
        }}>{hubName}</span>
      </div>

      {/* Right — optional slot + home */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {actions}
        <button
          onClick={goHome}
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "6px 14px", borderRadius: "8px",
            border: "1px solid rgba(0,191,165,0.25)",
            background: hov ? "rgba(0,191,165,0.12)" : "transparent",
            color: "#00BFA5", fontSize: "13px", cursor: "pointer",
            fontFamily: '"DM Sans", "Inter", sans-serif', fontWeight: "500",
            transition: "background 0.15s",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Home
        </button>
      </div>
    </header>
  );
}