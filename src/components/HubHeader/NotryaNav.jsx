import React from "react";

// NotryaNav — collapsible sidebar navigation for all Notrya hubs
// No React Router · no localStorage · React.useState only · window.location.href navigation

const NAV_HUBS = [
  { category: "Documentation", hubs: [
    { name: "Quick Note",           key: "QuickNote",          url: "/QuickNote" },
    { name: "Clinical Note Studio", key: "ClinicalNoteStudio", url: "/ProviderStudio" },
    { name: "MDM Builder",          key: "MDMBuilder",         url: "/ClinicalDecisionHub" },
    { name: "Order Generator",      key: "OrderGenerator",     url: "/order-generator" },
  ]},
  { category: "Cardiac", hubs: [
    { name: "ECG Hub",      key: "ECGHub",      url: "/ECGHub" },
    { name: "Cardiac Risk", key: "CardiacRisk", url: "/cardiac-hub" },
  ]},
  { category: "Neurology", hubs: [
    { name: "Stroke Hub", key: "StrokeHub", url: "/StrokeHub" },
  ]},
  { category: "Critical Care", hubs: [
    { name: "Electrolyte Hub", key: "ElectrolyteHub", url: "/electrolyte-hub" },
    { name: "Sepsis Hub",      key: "SepsisHub",      url: "/SepsisHub" },
    { name: "DKA Hub",         key: "DKAHub",         url: "/DKAHub" },
    { name: "Shock Hub",       key: "ShockHub",       url: "/ShockHub" },
    { name: "Airway / RSI",    key: "AirwayRSI",      url: "/AirwayRSIHub" },
  ]},
  { category: "Tox", hubs: [
    { name: "Toxicology Hub", key: "ToxicologyHub", url: "/ToxHub" },
  ]},
  { category: "Imaging", hubs: [
    { name: "Imaging Interpreter", key: "ImagingInterpreter", url: "/imaging-interpreter" },
    { name: "Dermatology Hub",     key: "DermatologyHub",     url: "/derm-hub" },
  ]},
  { category: "Labs", hubs: [
    { name: "Lab Interpreter", key: "LabInterpreter", url: "/LabHub" },
  ]},
  { category: "Procedures", hubs: [
    { name: "POCUS Hub", key: "POCUSHub", url: "/POCUSHub" },
    { name: "Ortho Hub", key: "OrthoHub", url: "/OrthoHub" },
    { name: "Resus Hub", key: "ResusHub", url: "/ResusHub" },
  ]},
];

const NAV_CAT_COLORS = {
  "Documentation": "#9B8BFF", "Cardiac": "#FF6B6B",
  "Neurology": "#00BFA5",    "Critical Care": "#F4B942",
  "Tox": "#FF8C42",          "Imaging": "#4FC3F7",
  "Labs": "#81C784",         "Procedures": "#CE93D8",
};

export default function NotryaNav({ currentHub }) {
  currentHub = currentHub || "";
  const [collapsed, setCollapsed] = React.useState(false);
  const [hovHub,    setHovHub]    = React.useState(null);
  const W = collapsed ? 52 : 220;

  return (
    <nav
      aria-label="Notrya hub navigation"
      style={{
        width: W, minWidth: W,
        height: "100vh",
        background: "rgba(6,14,30,0.99)",
        borderRight: "1px solid rgba(0,191,165,0.09)",
        display: "flex", flexDirection: "column",
        fontFamily: '"DM Sans","Inter",sans-serif',
        transition: "width 0.2s ease, min-width 0.2s ease",
        overflow: "hidden",
        flexShrink: 0,
        position: "sticky",
        top: 0,
      }}
    >
      {/* Wordmark */}
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: collapsed ? "center" : "flex-start",
        padding: collapsed ? "0" : "0 16px",
        height: "54px",
        borderBottom: "1px solid rgba(0,191,165,0.07)",
        flexShrink: 0,
      }}>
        {collapsed
          ? <span style={{ fontFamily: '"Playfair Display",Georgia,serif', fontSize: "17px", fontWeight: "700", color: "#00BFA5" }}>N</span>
          : <span style={{ fontFamily: '"Playfair Display",Georgia,serif', fontSize: "17px", fontWeight: "700", color: "#E8EDF5", letterSpacing: "-0.3px" }}>Notrya</span>
        }
      </div>

      {/* Hub list */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        {NAV_HUBS.map(function(group) {
          const color = NAV_CAT_COLORS[group.category] || "#00BFA5";
          return (
            <div key={group.category} style={{ marginBottom: "2px" }}>
              <div style={{
                display: "flex", alignItems: "center",
                justifyContent: collapsed ? "center" : "flex-start",
                gap: "6px",
                padding: collapsed ? "10px 0 4px" : "10px 16px 4px",
              }}>
                {!collapsed && (
                  <span style={{
                    fontSize: "10px", fontWeight: "600",
                    color: "rgba(232,237,245,0.28)",
                    letterSpacing: "0.08em", textTransform: "uppercase",
                  }}>{group.category}</span>
                )}
              </div>
              {group.hubs.map(function(hub) {
                const isActive = hub.key === currentHub;
                const isHov    = hovHub === hub.key;
                return (
                  <div
                    key={hub.key}
                    title={collapsed ? hub.name : undefined}
                    onClick={function() { window.location.href = hub.url; }}
                    onMouseEnter={function() { setHovHub(hub.key); }}
                    onMouseLeave={function() { setHovHub(null); }}
                    style={{
                      display: "flex", alignItems: "center",
                      justifyContent: collapsed ? "center" : "flex-start",
                      gap: "8px",
                      padding: collapsed ? "7px 0" : "5px 16px",
                      cursor: "pointer",
                      borderLeft: isActive ? ("2px solid " + color) : "2px solid transparent",
                      background: isActive
                        ? (color + "14")
                        : isHov ? "rgba(232,237,245,0.035)" : "transparent",
                      transition: "background 0.1s",
                    }}
                  >
                    <span style={{
                      width:  collapsed ? "7px" : "5px",
                      height: collapsed ? "7px" : "5px",
                      borderRadius: "50%",
                      background: isActive ? color : isHov ? "rgba(232,237,245,0.30)" : "rgba(232,237,245,0.14)",
                      flexShrink: 0,
                      transition: "background 0.1s",
                    }} />
                    {!collapsed && (
                      <span style={{
                        fontSize: "13px",
                        color: isActive ? color : "rgba(232,237,245,0.52)",
                        fontWeight: isActive ? "500" : "400",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}>{hub.name}</span>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Collapse toggle */}
      <div
        onClick={function() { setCollapsed(function(c) { return !c; }); }}
        onMouseEnter={function(e) { e.currentTarget.style.color = "rgba(232,237,245,0.50)"; }}
        onMouseLeave={function(e) { e.currentTarget.style.color = "rgba(232,237,245,0.22)"; }}
        style={{
          display: "flex", alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-end",
          padding: collapsed ? "13px 0" : "13px 16px",
          borderTop: "1px solid rgba(0,191,165,0.07)",
          cursor: "pointer", flexShrink: 0,
          color: "rgba(232,237,245,0.22)",
        }}
      >
        {!collapsed && (
          <span style={{ fontSize: "11px", marginRight: "5px" }}>Collapse</span>
        )}
        <svg
          width="14" height="14" viewBox="0 0 24 24"
          fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: collapsed ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </div>
    </nav>
  );
}