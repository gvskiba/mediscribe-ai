import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import UniversalSearchBar from "./UniversalSearchBar";
import FavoritesBar from "./FavoritesBar";
import BreadcrumbBar from "./BreadcrumbBar";
import { PAGES, CATS, CAT_COLOR } from "@/lib/navPages";

// Load Playfair Display font
if (typeof document !== 'undefined') {
  const link = document.createElement('link');
  link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap';
  link.rel = 'stylesheet';
  document.head.appendChild(link);
}

const PREFIX = "gnv";

(() => {
  const id = `${PREFIX}-css`;
  if (document.getElementById(id)) return;
  const s = document.createElement("style"); s.id = id;
  s.textContent = `
@keyframes ${PREFIX}fade  { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
@keyframes ${PREFIX}in    { from{opacity:0} to{opacity:1} }
@keyframes ${PREFIX}card  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
@keyframes ${PREFIX}pulse { 0%,100%{opacity:1} 50%{opacity:.25} }
@keyframes ${PREFIX}kpop  { from{opacity:0;transform:translateY(-8px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }

.${PREFIX}-overlay { animation:${PREFIX}in   .15s ease both; }
.${PREFIX}-card    { animation:${PREFIX}card .2s  ease both; }
.${PREFIX}-pulse   { animation:${PREFIX}pulse 2s ease-in-out infinite; }
.${PREFIX}-kpop    { animation:${PREFIX}kpop  .18s cubic-bezier(.34,1.56,.64,1) both; }

/* ── RECENT CHIPS ── */
.${PREFIX}-chip {
  display:inline-flex; align-items:center; gap:5px;
  padding:3px 9px; border-radius:20px; cursor:pointer;
  font-family:'DM Sans',sans-serif; font-size:11px; font-weight:600;
  white-space:nowrap; flex-shrink:0;
  border:1px solid rgba(42,79,122,0.35);
  background:rgba(14,37,68,0.5);
  color:#82aece;
  transition:all .13s;
  text-decoration:none;
}
.${PREFIX}-chip:hover {
  border-color:rgba(59,158,255,.45);
  background:rgba(59,158,255,.1);
  color:#f2f7ff;
}
.${PREFIX}-chip-dot {
  width:5px; height:5px; border-radius:50%; flex-shrink:0;
}
.${PREFIX}-chip-icon { font-size:12px; line-height:1; }

/* ── ⌘K TRIGGER BADGE ── */
.${PREFIX}-kbd-badge {
  display:inline-flex; align-items:center; gap:5px;
  padding:3px 9px; border-radius:7px; cursor:pointer;
  font-family:'JetBrains Mono',monospace; font-size:10px; font-weight:600;
  border:1px solid rgba(42,79,122,.4);
  background:rgba(14,37,68,.5);
  color:#5a82a8;
  transition:all .13s; flex-shrink:0;
}
.${PREFIX}-kbd-badge:hover {
  border-color:rgba(59,158,255,.45);
  color:#b8d4f0;
  background:rgba(59,158,255,.08);
}
.${PREFIX}-kbd-key {
  display:inline-flex; align-items:center; justify-content:center;
  background:rgba(42,79,122,.5); border:1px solid rgba(42,79,122,.7);
  border-radius:3px; padding:0 4px; font-size:9px; line-height:16px;
  color:#82aece;
}

/* ── COMMAND PALETTE ── */
.${PREFIX}-palette-scrim {
  position:fixed; inset:0; z-index:9998;
  background:rgba(3,8,18,.82);
  backdrop-filter:blur(8px);
  -webkit-backdrop-filter:blur(8px);
  display:flex; align-items:flex-start; justify-content:center;
  padding-top:14vh;
}
.${PREFIX}-palette {
  width:580px; max-width:94vw;
  background:#081628;
  border:1px solid rgba(42,79,122,.5);
  border-radius:14px;
  box-shadow:0 32px 80px rgba(0,0,0,.65), 0 0 0 1px rgba(59,158,255,.07);
  overflow:hidden;
}
.${PREFIX}-p-search-wrap {
  position:relative;
  border-bottom:1px solid rgba(42,79,122,.4);
}
.${PREFIX}-p-search-icon {
  position:absolute; left:16px; top:50%; transform:translateY(-50%);
  font-size:15px; opacity:.45; pointer-events:none;
}
.${PREFIX}-p-input {
  width:100%; padding:16px 16px 16px 46px;
  background:transparent; border:none; outline:none;
  font-family:'DM Sans',sans-serif; font-size:15px;
  color:#f2f7ff; caret-color:#00e5c0;
}
.${PREFIX}-p-input::placeholder { color:#5a82a8; }
.${PREFIX}-p-esc {
  position:absolute; right:14px; top:50%; transform:translateY(-50%);
  font-family:'JetBrains Mono',monospace; font-size:9px; color:#5a82a8;
  background:rgba(42,79,122,.4); border:1px solid rgba(42,79,122,.6);
  border-radius:4px; padding:1px 6px; pointer-events:none;
}
.${PREFIX}-p-list {
  max-height:400px; overflow-y:auto;
  padding:6px;
  scrollbar-width:thin; scrollbar-color:rgba(42,79,122,.5) transparent;
}
.${PREFIX}-p-list::-webkit-scrollbar { width:3px; }
.${PREFIX}-p-list::-webkit-scrollbar-thumb { background:rgba(42,79,122,.5); border-radius:2px; }
.${PREFIX}-p-section {
  padding:8px 8px 3px;
  font-family:'JetBrains Mono',monospace; font-size:8px; font-weight:700;
  letter-spacing:2px; text-transform:uppercase; color:#5a82a8;
}
.${PREFIX}-p-item {
  display:flex; align-items:center; gap:11px;
  padding:9px 11px; border-radius:9px; cursor:pointer;
  border:1px solid transparent;
  transition:all .1s; width:100%; text-align:left;
  background:none;
}
.${PREFIX}-p-item:hover,
.${PREFIX}-p-item.sel {
  background:rgba(59,158,255,.08);
  border-color:rgba(59,158,255,.25);
}
.${PREFIX}-p-item.sel { background:rgba(59,158,255,.12); }
.${PREFIX}-p-ico {
  width:32px; height:32px; border-radius:8px; flex-shrink:0;
  display:flex; align-items:center; justify-content:center; font-size:16px;
  background:rgba(14,37,68,.8); border:1px solid rgba(42,79,122,.35);
}
.${PREFIX}-p-info { flex:1; min-width:0; text-align:left; }
.${PREFIX}-p-name {
  font-family:'DM Sans',sans-serif; font-weight:600; font-size:13px;
  color:#f2f7ff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}
.${PREFIX}-p-desc {
  font-size:11px; color:#5a82a8; margin-top:1px;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}
.${PREFIX}-p-here {
  font-family:'JetBrains Mono',monospace; font-size:7px; font-weight:700;
  padding:1px 7px; border-radius:20px; flex-shrink:0;
}
.${PREFIX}-p-enter {
  display:flex; align-items:center; justify-content:center;
  width:24px; height:24px; border-radius:5px; flex-shrink:0;
  background:rgba(59,158,255,.12); border:1px solid rgba(59,158,255,.3);
  font-family:'JetBrains Mono',monospace; font-size:11px; color:#3b9eff;
  opacity:0; transition:opacity .1s;
}
.${PREFIX}-p-item:hover .${PREFIX}-p-enter,
.${PREFIX}-p-item.sel  .${PREFIX}-p-enter { opacity:1; }
.${PREFIX}-p-footer {
  display:flex; align-items:center; gap:14px;
  padding:9px 16px;
  border-top:1px solid rgba(42,79,122,.3);
  font-family:'JetBrains Mono',monospace; font-size:9px; color:#5a82a8;
}
.${PREFIX}-p-footer-key {
  display:inline-flex; align-items:center; justify-content:center;
  background:rgba(42,79,122,.4); border:1px solid rgba(42,79,122,.6);
  border-radius:3px; padding:1px 5px; font-size:9px; color:#82aece;
  margin-right:4px;
}
.${PREFIX}-p-empty {
  padding:36px 16px; text-align:center;
  font-family:'DM Sans',sans-serif; font-size:13px; color:#5a82a8;
}
`;
  document.head.appendChild(s);
})();

const T = {
  bg:"#050f1e", txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", red:"#ff4444", green:"#3dffa0",
  blue:"#3b9eff", purple:"#9b6dff", orange:"#ff9f43",
};

const MAX_RECENTS = 3;

// Route → page id map
const ROUTE_TO_ID = {};
PAGES.forEach(p => { if (p.route && !ROUTE_TO_ID[p.route]) ROUTE_TO_ID[p.route] = p.id; });

// Pages with their own full navigation — GlobalNav should not render
const EXCLUDED_ROUTES = new Set(["/NewPatientInput", "/ClinicalNoteStudio", "/LakonyxApp"]);

// ── Sub-components ───────────────────────────────────────────────────

function HubCard({ page, current, navigate, delay = 0 }) {
  const [hov, setHov] = useState(false);
  const isActive = page.id === current;
  return (
    <button
      className={`${PREFIX}-card`}
      onClick={() => navigate(page.id)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        textAlign:"left", padding:"12px 13px",
        borderRadius:11, cursor: isActive ? "default" : "pointer",
        border:`1px solid ${isActive ? page.color+"60" : hov ? page.color+"35" : "rgba(42,79,122,.28)"}`,
        borderLeft:`3px solid ${page.color}`,
        background: isActive ? `${page.color}18` : hov ? `${page.color}0e` : "rgba(8,22,40,.72)",
        transform: hov && !isActive ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hov && !isActive ? `0 8px 24px rgba(0,0,0,.4),0 0 16px ${page.color}18` : "none",
        transition:"all .15s",
        animationDelay:`${delay}s`,
      }}
    >
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
        <span style={{ fontSize:15 }}>{page.icon}</span>
        <span style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:12, color: isActive ? page.color : T.txt, lineHeight:1.2 }}>
          {page.name}
        </span>
        {isActive && (
          <span style={{ marginLeft:"auto", fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700, padding:"1px 6px", borderRadius:20, background:`${page.color}20`, color:page.color, border:`1px solid ${page.color}35` }}>
            HERE
          </span>
        )}
      </div>
      <div style={{ fontFamily:"DM Sans", fontSize:10, color:T.txt4, lineHeight:1.45 }}>{page.desc}</div>
    </button>
  );
}

function PaletteItem({ page, current, idx, sel, navigate }) {
  const isActive = page.id === current;
  return (
    <button
      data-idx={idx}
      className={`${PREFIX}-p-item${sel === idx ? ` sel` : ""}`}
      onClick={() => navigate(page.id)}
    >
      <div className={`${PREFIX}-p-ico`} style={{ borderColor:`${page.color}30`, background:`${page.color}10` }}>
        <span>{page.icon}</span>
      </div>
      <div className={`${PREFIX}-p-info`}>
        <div className={`${PREFIX}-p-name`} style={{ color: isActive ? page.color : undefined }}>{page.name}</div>
        <div className={`${PREFIX}-p-desc`}>{page.desc}</div>
      </div>
      {isActive && (
        <span className={`${PREFIX}-p-here`} style={{ background:`${page.color}15`, color:page.color, border:`1px solid ${page.color}35` }}>
          HERE
        </span>
      )}
      <span className={`${PREFIX}-p-enter`}>↵</span>
    </button>
  );
}

// ════════════════════════════════════════════════════════════════════
//  GLOBAL NAV
// ════════════════════════════════════════════════════════════════════
export default function GlobalNav({ alerts = 0 }) {
  const routerNavigate = useNavigate();
  const location = useLocation();

  // Pages with their own full navigation — GlobalNav should not render
  if (EXCLUDED_ROUTES.has(location.pathname)) return null;

  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 200,
      height: 52, flexShrink: 0,
      backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
      background: "rgba(5, 15, 30, 0.97)",
      borderBottom: "1px solid rgba(26, 53, 85, 0.7)",
      display: "flex", alignItems: "center",
      padding: "0 14px", gap: 10,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Lakonyx brand */}
      <span
        onClick={() => routerNavigate("/")}
        style={{
          fontFamily: "'Playfair Display', serif", fontSize: 14, fontWeight: 900,
          letterSpacing: ".12em", color: "#C9A84C", cursor: "pointer",
          flexShrink: 0, userSelect: "none", transition: "opacity .15s",
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
        onMouseLeave={e => e.currentTarget.style.opacity = "1"}
      >
        LAKONYX
      </span>

      {/* Search bar — now lives in the top nav row */}
      <div style={{ flex: 1, display: "flex", justifyContent: "center", minWidth: 0 }}>
        <UniversalSearchBar />
      </div>
    </div>
  );
}