import { useLocation, useNavigate } from "react-router-dom";
import { PAGES } from "./GlobalNav";

// Build a route → page lookup
const ROUTE_MAP = {};
PAGES.forEach(p => { if (p.route && !ROUTE_MAP[p.route]) ROUTE_MAP[p.route] = p; });

// Category label for "root" breadcrumb
const CAT_LABELS = {
  "Workflow":  { label: "Workflow",   icon: "⚡" },
  "AI Tools":  { label: "AI Tools",  icon: "🤖" },
  "Hubs":      { label: "Hubs",      icon: "🏥" },
  "Reference": { label: "Reference", icon: "📚" },
  "Platform":  { label: "Platform",  icon: "⚙️" },
};

const HOME = { label: "Home", icon: "🏠", route: "/" };

export default function BreadcrumbBar({ history = [] }) {
  const location = useLocation();
  const navigate = useNavigate();

  const currentPage = ROUTE_MAP[location.pathname];
  if (!currentPage) return null; // unknown route — hide breadcrumb

  // Build crumbs: Home → Category → Current
  const catInfo = CAT_LABELS[currentPage.cat] || { label: currentPage.cat, icon: "📄" };

  // History crumbs: last 2 unique recent pages (not current)
  const historyCrumbs = history
    .filter(p => p.route !== location.pathname)
    .slice(0, 2);

  // Full crumb trail
  const crumbs = [
    HOME,
    ...historyCrumbs.map(p => ({ label: p.name, icon: p.icon, route: p.route, color: p.color })),
    { label: currentPage.name, icon: currentPage.icon, color: currentPage.color, current: true },
  ];

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 4,
      padding: "5px 16px",
      background: "rgba(5,10,20,0.7)",
      borderBottom: "1px solid rgba(42,79,122,0.2)",
      flexWrap: "wrap",
      minHeight: 30,
    }}>
      {crumbs.map((crumb, i) => (
        <span key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {i > 0 && (
            <span style={{ color: "rgba(90,130,168,0.5)", fontSize: 10, userSelect: "none" }}>›</span>
          )}
          {crumb.current ? (
            <span style={{
              display: "flex", alignItems: "center", gap: 4,
              fontFamily: "DM Sans, sans-serif", fontSize: 11, fontWeight: 700,
              color: crumb.color || "#f2f7ff",
              padding: "2px 8px", borderRadius: 5,
              background: crumb.color ? `${crumb.color}18` : "rgba(255,255,255,0.06)",
              border: `1px solid ${crumb.color ? crumb.color + "35" : "rgba(42,79,122,0.3)"}`,
            }}>
              <span style={{ fontSize: 11 }}>{crumb.icon}</span>
              {crumb.label}
            </span>
          ) : (
            <button
              onClick={() => crumb.route && navigate(crumb.route)}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                fontFamily: "DM Sans, sans-serif", fontSize: 11, fontWeight: 500,
                color: crumb.color || "rgba(130,174,206,0.85)",
                background: "none", border: "none", cursor: "pointer",
                padding: "2px 5px", borderRadius: 4,
                transition: "all 0.12s",
                opacity: 0.75,
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.background = "rgba(59,158,255,0.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "0.75"; e.currentTarget.style.background = "none"; }}
            >
              <span style={{ fontSize: 11 }}>{crumb.icon}</span>
              {crumb.label}
            </button>
          )}
        </span>
      ))}
    </div>
  );
}