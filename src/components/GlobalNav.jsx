import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

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

// ── ALL PAGES ────────────────────────────────────────────────────────
export const PAGES = [
  // Workflow
  { id:"command",     name:"Command Center",    icon:"⚡",  color:T.purple, cat:"Workflow",   desc:"Personalized shift cockpit",          route:"/command-center"    },
  { id:"tracking",    name:"Tracking Board",    icon:"📋",  color:T.teal,   cat:"Workflow",   desc:"Live ED census & orders",             route:"/EDTrackingBoard"   },
  { id:"disposition", name:"Disposition Board", icon:"🚪",  color:T.blue,   cat:"Workflow",   desc:"Boarding timers & bed status",        route:"/DispositionBoard"  },
  { id:"workspace",   name:"Patient Workspace", icon:"🔬",  color:T.teal,   cat:"Workflow",   desc:"Single-patient bedside cockpit",      route:"/patient-workspace" },
  { id:"narrative",   name:"Narrative Engine",  icon:"🧠",  color:T.purple, cat:"Workflow",   desc:"Living clinical stories",             route:"/narrative-engine"  },
  { id:"critical",    name:"Critical Inbox",    icon:"🚨",  color:T.red,    cat:"Workflow",   desc:"Cross-patient critical results",      route:"/critical-inbox"    },
  { id:"signout",     name:"Shift Sign-Out",    icon:"👋",  color:T.gold,   cat:"Workflow",   desc:"I-PASS handoff at shift change",      route:"/shift-signout"     },
  { id:"huddle",      name:"Huddle Board",       icon:"🏥",  color:T.teal,   cat:"Workflow",   desc:"Department acuity, clocks & tasks",   route:"/huddle-board"      },
  { id:"resustimer",  name:"Resus Timer",       icon:"⏱",   color:T.red,    cat:"Workflow",   desc:"Live code — CPR cycles & drugs",     route:"/resus-hub"         },
  // AI Tools
  { id:"ddx",         name:"DDx Engine",        icon:"🔍",  color:T.purple, cat:"AI Tools",   desc:"AI-weighted differential diagnosis",  route:"/ddx-engine"        },
  { id:"dosing",      name:"Smart Dosing",       icon:"💊",  color:T.green,  cat:"AI Tools",   desc:"Renal/hepatic/weight dosing",         route:"/smart-dosing"      },
  // Clinical Reference
  { id:"resus",       name:"ResusHub",           icon:"🫀",  color:T.red,    cat:"Reference",  desc:"ACLS algorithms & vasopressors",      route:"/resus-hub"         },
  { id:"ecg",         name:"ECGHub",             icon:"🩺",  color:T.gold,   cat:"Reference",  desc:"Waveforms, STEMI, QTc",               route:"/ecg-hub"           },
  { id:"airway",      name:"AirwayHub",          icon:"🌬",  color:T.blue,   cat:"Reference",  desc:"RSI, LEMON, CICO pathway",            route:"/airway-hub"        },
  { id:"sepsis",      name:"SepsisHub",          icon:"🩸",  color:T.orange, cat:"Reference",  desc:"Sepsis-3, antibiotics, qSOFA",        route:"/sepsis-hub"        },
  { id:"shock",       name:"ShockHub",           icon:"💉",  color:T.red,    cat:"Reference",  desc:"Hemodynamic profiles, pressors",      route:"/shock-hub"         },
  { id:"psych",       name:"PsychHub",           icon:"💭",  color:T.purple, cat:"Reference",  desc:"Agitation, SI, intoxication",         route:"/psyche-hub"        },
  { id:"antidote",    name:"AntidoteHub",        icon:"🧪",  color:T.teal,   cat:"Reference",  desc:"20 antidotes with dosing",            route:"/antidote-hub"      },
  { id:"labs",        name:"LabsInterpreter",    icon:"📊",  color:T.blue,   cat:"Reference",  desc:"47 labs & imaging patterns",          route:"/LabsImaging"       },
  { id:"erx",         name:"ERxHub",             icon:"📝",  color:T.teal,   cat:"Reference",  desc:"ED prescriptions & PDMP",            route:"/erx"               },
  { id:"knowledge",   name:"Guidelines",         icon:"📚",  color:T.gold,   cat:"Reference",  desc:"17 clinical guidelines & studies",    route:"/KnowledgeBaseV2"   },
  // Platform
  { id:"calendar",    name:"Shift Calendar",     icon:"📅",  color:T.txt4,   cat:"Platform",   desc:"Provider schedule & shifts",          route:"/Calendar"          },
  { id:"landing",     name:"Platform Overview",  icon:"🏠",  color:T.txt4,   cat:"Platform",   desc:"About Notrya",                       route:"/landing"           },
];

const CATS = ["Workflow", "AI Tools", "Reference", "Platform"];
const CAT_COLOR = { "Workflow":T.teal, "AI Tools":T.purple, "Reference":T.blue, "Platform":T.txt4 };
const MAX_RECENTS = 3;

// Route → page id map
const ROUTE_TO_ID = {};
PAGES.forEach(p => { if (p.route && !ROUTE_TO_ID[p.route]) ROUTE_TO_ID[p.route] = p.id; });

// Pages with their own full navigation — GlobalNav should not render
const EXCLUDED_ROUTES = new Set(["/NewPatientInput", "/ClinicalNoteStudio", "/NotryaApp"]);

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
  const location       = useLocation();

  const [hubOpen, setHubOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [search,  setSearch]  = useState("");
  const [cmdQ,    setCmdQ]    = useState("");
  const [sel,     setSel]     = useState(0);
  const [recent,  setRecent]  = useState([]);

  const cmdRef  = useRef(null);
  const listRef = useRef(null);

  const currentId   = ROUTE_TO_ID[location.pathname] || null;
  const currentPage = PAGES.find(p => p.id === currentId);

  // ── Navigation ──────────────────────────────────────────────────
  const navigate = useCallback((id) => {
    const page = PAGES.find(p => p.id === id);
    if (!page) return;
    setRecent(prev => [id, ...prev.filter(r => r !== id)].slice(0, MAX_RECENTS + 1));
    setHubOpen(false); setCmdOpen(false);
    setSearch(""); setCmdQ(""); setSel(0);
    routerNavigate(page.route);
  }, [routerNavigate]);

  const recentChips = recent
    .map(id => PAGES.find(p => p.id === id))
    .filter(Boolean)
    .filter(p => p.id !== currentId)
    .slice(0, MAX_RECENTS);

  // ── Hub search filter ───────────────────────────────────────────
  const hubFiltered = search.trim()
    ? PAGES.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.desc.toLowerCase().includes(search.toLowerCase()) ||
        p.cat.toLowerCase().includes(search.toLowerCase())
      )
    : null;

  // ── ⌘K palette ─────────────────────────────────────────────────
  const cmdFiltered = cmdQ.trim()
    ? PAGES.filter(p =>
        p.name.toLowerCase().includes(cmdQ.toLowerCase()) ||
        p.desc.toLowerCase().includes(cmdQ.toLowerCase()) ||
        p.cat.toLowerCase().includes(cmdQ.toLowerCase())
      )
    : PAGES;

  const openPalette = useCallback(() => {
    setCmdOpen(true); setCmdQ(""); setSel(0);
    setTimeout(() => cmdRef.current?.focus(), 30);
  }, []);

  const closePalette = useCallback(() => {
    setCmdOpen(false); setCmdQ(""); setSel(0);
  }, []);

  // ── Keyboard shortcuts ──────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === "k") { e.preventDefault(); cmdOpen ? closePalette() : openPalette(); return; }
      if (!cmdOpen) return;
      if (e.key === "Escape")    { closePalette(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setSel(s => Math.min(s + 1, cmdFiltered.length - 1)); return; }
      if (e.key === "ArrowUp")   { e.preventDefault(); setSel(s => Math.max(s - 1, 0)); return; }
      if (e.key === "Enter")     { e.preventDefault(); if (cmdFiltered[sel]) navigate(cmdFiltered[sel].id); return; }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cmdOpen, cmdFiltered, sel, navigate, openPalette, closePalette]);

  useEffect(() => { setSel(0); }, [cmdQ]);

  useEffect(() => {
    if (!cmdOpen || !listRef.current) return;
    const item = listRef.current.querySelector(`[data-idx="${sel}"]`);
    item?.scrollIntoView({ block:"nearest" });
  }, [sel, cmdOpen]);

  useEffect(() => {
    if (!hubOpen) return;
    const h = (e) => {
      if (!e.target.closest(`.${PREFIX}-hub-overlay`) && !e.target.closest(`.${PREFIX}-hub-trigger`))
        setHubOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [hubOpen]);

  // ── Palette grouping ────────────────────────────────────────────
  if (EXCLUDED_ROUTES.has(location.pathname)) return null;

  const paletteGroups = cmdQ.trim()
    ? null
    : CATS.map(cat => ({ cat, pages: cmdFiltered.filter(p => p.cat === cat) })).filter(g => g.pages.length > 0);

  const flatList = cmdQ.trim()
    ? cmdFiltered
    : CATS.flatMap(cat => cmdFiltered.filter(p => p.cat === cat));

  return (
    <>
      {/* ══════════════ NAVIGATION BAR ══════════════ */}
      <div style={{
        position:"sticky", top:0, zIndex:200,
        height:48, flexShrink:0,
        backdropFilter:"blur(24px) saturate(180%)",
        WebkitBackdropFilter:"blur(24px) saturate(180%)",
        background:"rgba(5,10,20,0.92)",
        borderBottom:"1px solid rgba(42,79,122,0.4)",
        display:"flex", alignItems:"center",
        padding:"0 12px", gap:6,
      }}>
        {/* Wordmark */}
        <div style={{ fontFamily:"JetBrains Mono", fontWeight:700, fontSize:11, letterSpacing:3, color:T.gold, flexShrink:0 }}>
          NOTRYA
        </div>

        {/* Separator */}
        <div style={{ width:1, height:18, background:"rgba(42,79,122,0.45)", flexShrink:0 }}/>

        {/* Current page */}
        {currentPage && (
          <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0, minWidth:0 }}>
            <span style={{ fontSize:14 }}>{currentPage.icon}</span>
            <span style={{ fontFamily:"DM Sans", fontWeight:600, fontSize:13, color:currentPage.color, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {currentPage.name}
            </span>
          </div>
        )}

        {/* Recent chips */}
        {recentChips.length > 0 && (
          <>
            <div style={{ width:1, height:14, background:"rgba(42,79,122,0.4)", flexShrink:0, marginLeft:2 }}/>
            {recentChips.map(p => (
              <button key={p.id} className={`${PREFIX}-chip`} onClick={() => navigate(p.id)} title={p.desc}>
                <span className={`${PREFIX}-chip-dot`} style={{ background:p.color }}/>
                <span className={`${PREFIX}-chip-icon`}>{p.icon}</span>
                <span>{p.name}</span>
              </button>
            ))}
          </>
        )}

        {/* Spacer */}
        <div style={{ flex:1 }}/>

        {/* Alert dot */}
        {alerts > 0 && (
          <button onClick={() => navigate("critical")} style={{
            fontFamily:"JetBrains Mono", fontWeight:700, fontSize:9,
            padding:"3px 9px", borderRadius:20, cursor:"pointer",
            border:`1px solid ${T.red}45`, background:`${T.red}14`, color:T.red,
            display:"flex", alignItems:"center", gap:5, flexShrink:0,
          }}>
            <span className={`${PREFIX}-pulse`} style={{ display:"inline-block", width:6, height:6, borderRadius:"50%", background:T.red }}/>
            {alerts}
          </button>
        )}

        {/* ⌘K badge */}
        <button className={`${PREFIX}-kbd-badge`} onClick={openPalette} title="Command palette (⌘K)">
          <span>Jump to</span>
          <span className={`${PREFIX}-kbd-key`}>⌘K</span>
        </button>

        {/* Hub picker toggle */}
        <button
          className={`${PREFIX}-hub-trigger`}
          onClick={() => { setHubOpen(o => !o); setSearch(""); }}
          style={{
            display:"flex", alignItems:"center", gap:5,
            fontFamily:"DM Sans", fontWeight:700, fontSize:11,
            padding:"5px 11px", borderRadius:8, cursor:"pointer",
            border:`1px solid ${hubOpen ? T.teal+"55" : "rgba(42,79,122,.4)"}`,
            background: hubOpen ? `${T.teal}14` : "rgba(14,37,68,.5)",
            color: hubOpen ? T.teal : T.txt3,
            transition:"all .15s", flexShrink:0,
          }}>
          <span style={{ fontSize:13 }}>⊞</span>
          <span>All Hubs</span>
        </button>
      </div>

      {/* ══════════════ HUB PICKER OVERLAY ══════════════ */}
      {hubOpen && (
        <div
          className={`${PREFIX}-hub-overlay ${PREFIX}-overlay`}
          style={{
            position:"fixed", inset:0, zIndex:199,
            background:"rgba(3,8,18,.88)",
            backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)",
            overflowY:"auto", paddingTop:48,
          }}
          onClick={() => { setHubOpen(false); setSearch(""); }}
        >
          <div onClick={e => e.stopPropagation()} style={{ maxWidth:860, margin:"0 auto", padding:"16px 16px 40px" }}>

            {/* Search */}
            <div style={{ position:"relative", marginBottom:16 }}>
              <input
                type="text" value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search hubs…"
                autoFocus
                style={{
                  width:"100%", background:"rgba(14,37,68,.9)",
                  border:`1px solid ${search ? T.teal+"50" : "rgba(42,79,122,.45)"}`,
                  borderRadius:10, padding:"11px 16px 11px 42px",
                  fontFamily:"DM Sans", fontSize:14, color:T.txt,
                  outline:"none", transition:"border-color .12s",
                }}
              />
              <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:16, opacity:.5 }}>🔍</span>
            </div>

            {hubFiltered && (
              <div>
                <div style={{ fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700, color:T.txt4, letterSpacing:2, textTransform:"uppercase", marginBottom:8 }}>
                  Results ({hubFiltered.length})
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:8 }}>
                  {hubFiltered.map(p => <HubCard key={p.id} page={p} current={currentId} navigate={navigate}/>)}
                </div>
              </div>
            )}

            {!hubFiltered && recentChips.length > 0 && (
              <div style={{ marginBottom:20 }}>
                <div style={{ fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700, color:T.txt4, letterSpacing:2, textTransform:"uppercase", marginBottom:8 }}>
                  Recent
                </div>
                <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
                  {recentChips.map(p => (
                    <button key={p.id} onClick={() => navigate(p.id)} style={{
                      fontFamily:"DM Sans", fontWeight:600, fontSize:12,
                      padding:"6px 13px", borderRadius:20, cursor:"pointer",
                      border:`1px solid ${p.color}35`, background:`${p.color}0e`, color:p.color,
                      display:"flex", alignItems:"center", gap:6, transition:"all .12s",
                    }}>
                      <span>{p.icon}</span>{p.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!hubFiltered && CATS.map(cat => {
              const catPages = PAGES.filter(p => p.cat === cat);
              const cc = CAT_COLOR[cat];
              return (
                <div key={cat} style={{ marginBottom:22 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                    <div style={{ fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700, color:cc, letterSpacing:2, textTransform:"uppercase" }}>{cat}</div>
                    <div style={{ flex:1, height:1, background:`linear-gradient(90deg,${cc}30,transparent)` }}/>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:8 }}>
                    {catPages.map((p, i) => <HubCard key={p.id} page={p} current={currentId} navigate={navigate} delay={i * 0.04}/>)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════ ⌘K COMMAND PALETTE ══════════════ */}
      {cmdOpen && (
        <div
          className={`${PREFIX}-palette-scrim`}
          onMouseDown={e => { if (e.target === e.currentTarget) closePalette(); }}
        >
          <div className={`${PREFIX}-palette ${PREFIX}-kpop`}>
            <div className={`${PREFIX}-p-search-wrap`}>
              <span className={`${PREFIX}-p-search-icon`}>🔍</span>
              <input
                ref={cmdRef}
                className={`${PREFIX}-p-input`}
                placeholder="Jump to any hub or page…"
                value={cmdQ}
                onChange={e => setCmdQ(e.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
              <span className={`${PREFIX}-p-esc`}>ESC</span>
            </div>

            <div className={`${PREFIX}-p-list`} ref={listRef}>
              {flatList.length === 0 ? (
                <div className={`${PREFIX}-p-empty`}>No pages match "{cmdQ}"</div>
              ) : cmdQ.trim() ? (
                flatList.map((p, i) => (
                  <PaletteItem key={p.id} page={p} current={currentId} idx={i} sel={sel} navigate={navigate}/>
                ))
              ) : (
                paletteGroups?.map(({ cat, pages }) => (
                  <div key={cat}>
                    <div className={`${PREFIX}-p-section`} style={{ color:CAT_COLOR[cat] }}>{cat}</div>
                    {pages.map(p => {
                      const globalIdx = flatList.findIndex(x => x.id === p.id);
                      return <PaletteItem key={p.id} page={p} current={currentId} idx={globalIdx} sel={sel} navigate={navigate}/>;
                    })}
                  </div>
                ))
              )}
            </div>

            <div className={`${PREFIX}-p-footer`}>
              <span><span className={`${PREFIX}-p-footer-key`}>↑↓</span> navigate</span>
              <span><span className={`${PREFIX}-p-footer-key`}>↵</span> open</span>
              <span><span className={`${PREFIX}-p-footer-key`}>ESC</span> close</span>
              <span style={{ marginLeft:"auto", opacity:.5 }}>{flatList.length} pages</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}