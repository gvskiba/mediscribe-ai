import { useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const PREFIX = "gnv";

(() => {
  const id = `${PREFIX}-css`;
  if (document.getElementById(id)) return;
  const s = document.createElement("style"); s.id = id;
  s.textContent = `
    @keyframes ${PREFIX}fade { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
    @keyframes ${PREFIX}in   { from{opacity:0} to{opacity:1} }
    @keyframes ${PREFIX}card { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
    @keyframes ${PREFIX}pulse{ 0%,100%{opacity:1} 50%{opacity:.25} }
    .${PREFIX}-overlay { animation:${PREFIX}in   .18s ease both; }
    .${PREFIX}-card    { animation:${PREFIX}card .22s ease both; }
    .${PREFIX}-pulse   { animation:${PREFIX}pulse 2s ease-in-out infinite; }
  `;
  document.head.appendChild(s);
})();

const T = {
  bg:"#050f1e", txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", red:"#ff4444", green:"#3dffa0",
  blue:"#3b9eff", purple:"#9b6dff", orange:"#ff9f43",
};

// ── ALL PAGES ─────────────────────────────────────────────────────────
export const PAGES = [
  // Workflow
  { id:"command",     name:"Command Center",    icon:"⚡",  color:T.purple, cat:"Workflow",   desc:"Personalized shift cockpit",       route:"/command-center"    },
  { id:"tracking",    name:"Tracking Board",    icon:"📋",  color:T.teal,   cat:"Workflow",   desc:"Live ED census & orders",          route:"/EDTrackingBoard"    },
  { id:"disposition", name:"Disposition Board", icon:"🚪",  color:T.blue,   cat:"Workflow",   desc:"Boarding timers & bed status",     route:"/DispositionBoard"  },
  { id:"workspace",   name:"Patient Workspace", icon:"🔬",  color:T.teal,   cat:"Workflow",   desc:"Single-patient bedside cockpit",   route:"/patient-workspace" },
  { id:"narrative",   name:"Narrative Engine",  icon:"🧠",  color:T.purple, cat:"Workflow",   desc:"Living clinical stories",          route:"/narrative-engine"  },
  { id:"critical",    name:"Critical Inbox",    icon:"🚨",  color:T.red,    cat:"Workflow",   desc:"Cross-patient critical results",   route:"/critical-inbox"    },
  { id:"signout",     name:"Shift Sign-Out",    icon:"👋",  color:T.gold,   cat:"Workflow",   desc:"I-PASS handoff at shift change",   route:"/shift-signout"     },
  { id:"resustimer",  name:"Resus Timer",       icon:"⏱",   color:T.red,    cat:"Workflow",   desc:"Live code — CPR cycles & drugs",  route:"/resus-hub"         },
  // AI Tools
  { id:"ddx",         name:"DDx Engine",        icon:"🔍",  color:T.purple, cat:"AI Tools",   desc:"AI-weighted differential diagnosis", route:"/ddx-engine"     },
  { id:"dosing",      name:"Smart Dosing",      icon:"💊",  color:T.green,  cat:"AI Tools",   desc:"Renal/hepatic/weight dosing",      route:"/smart-dosing"      },
  // Clinical Reference
  { id:"resus",       name:"ResusHub",          icon:"🫀",  color:T.red,    cat:"Reference",  desc:"ACLS algorithms & vasopressors",   route:"/resus-hub"         },
  { id:"ecg",         name:"ECGHub",            icon:"🩺",  color:T.gold,   cat:"Reference",  desc:"Waveforms, STEMI, QTc",            route:"/ecg-hub"           },
  { id:"airway",      name:"AirwayHub",         icon:"🌬",  color:T.blue,   cat:"Reference",  desc:"RSI, LEMON, CICO pathway",         route:"/airway-hub"        },
  { id:"sepsis",      name:"SepsisHub",         icon:"🩸",  color:T.orange, cat:"Reference",  desc:"Sepsis-3, antibiotics, qSOFA",     route:"/sepsis-hub"        },
  { id:"shock",       name:"ShockHub",          icon:"💉",  color:T.red,    cat:"Reference",  desc:"Hemodynamic profiles, pressors",   route:"/shock-hub"         },
  { id:"psych",       name:"PsychHub",          icon:"💭",  color:T.purple, cat:"Reference",  desc:"Agitation, SI, intoxication",      route:"/psyche-hub"        },
  { id:"antidote",    name:"AntidoteHub",       icon:"🧪",  color:T.teal,   cat:"Reference",  desc:"20 antidotes with dosing",         route:"/antidote-hub"      },
  { id:"labs",        name:"LabsInterpreter",   icon:"📊",  color:T.blue,   cat:"Reference",  desc:"47 labs & imaging patterns",       route:"/LabsImaging"       },
  { id:"erx",         name:"ERxHub",            icon:"📝",  color:T.teal,   cat:"Reference",  desc:"ED prescriptions & PDMP",         route:"/erx"               },
  { id:"knowledge",   name:"Guidelines",        icon:"📚",  color:T.gold,   cat:"Reference",  desc:"17 clinical guidelines & studies", route:"/KnowledgeBaseV2"   },
  { id:"calendar",    name:"Shift Calendar",    icon:"📅",  color:T.txt4,   cat:"Platform",   desc:"Provider schedule & shifts",       route:"/Calendar"          },
  { id:"landing",     name:"Platform Overview", icon:"🏠",  color:T.txt4,   cat:"Platform",   desc:"About Notrya",                    route:"/landing"           },
];

const CATS = ["Workflow", "AI Tools", "Reference", "Platform"];

const CAT_COLOR = {
  "Workflow" : T.teal,
  "AI Tools" : T.purple,
  "Reference": T.blue,
  "Platform" : T.txt4,
};

// Route → page id map
const ROUTE_TO_ID = {};
PAGES.forEach(p => { if (!ROUTE_TO_ID[p.route]) ROUTE_TO_ID[p.route] = p.id; });

// ── Hub Card ──────────────────────────────────────────────────────────
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
        textAlign:"left", padding:"13px 14px",
        borderRadius:12, cursor:isActive ? "default" : "pointer",
        border:`1px solid ${isActive ? page.color+"60" : hov ? page.color+"35" : "rgba(42,79,122,0.28)"}`,
        borderLeft:`3px solid ${page.color}`,
        background: isActive
          ? `${page.color}18`
          : hov ? `${page.color}0e` : "rgba(8,22,40,0.72)",
        transform: hov && !isActive ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hov && !isActive ? `0 8px 24px rgba(0,0,0,.4),0 0 16px ${page.color}18` : "none",
        transition:"all .15s",
        animationDelay:`${delay}s`,
      }}
    >
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
        <span style={{ fontSize:16 }}>{page.icon}</span>
        <span style={{
          fontFamily:"DM Sans", fontWeight:700, fontSize:12,
          color: isActive ? page.color : T.txt, lineHeight:1.2,
        }}>{page.name}</span>
        {isActive && (
          <span style={{
            marginLeft:"auto", fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700,
            padding:"1px 6px", borderRadius:20, background:`${page.color}20`,
            color:page.color, border:`1px solid ${page.color}35`,
          }}>HERE</span>
        )}
      </div>
      <div style={{ fontFamily:"DM Sans", fontSize:10, color:T.txt4, lineHeight:1.45 }}>
        {page.desc}
      </div>
    </button>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  GLOBAL NAV
// ══════════════════════════════════════════════════════════════════════
// Pages with their own full navigation — GlobalNav should not render
const EXCLUDED_ROUTES = new Set(["/NewPatientInput", "/ClinicalNoteStudio", "/NotryaApp"]);

export default function GlobalNav({ alerts = 0 }) {
  const navigate  = useNavigate();
  const location  = useLocation();

  if (EXCLUDED_ROUTES.has(location.pathname)) return null;
  const [open,   setOpen]   = useState(false);
  const [search, setSearch] = useState("");
  const [recent, setRecent] = useState([]);

  const current     = ROUTE_TO_ID[location.pathname] || null;
  const currentPage = PAGES.find(p => p.id === current);

  const filtered = search.trim()
    ? PAGES.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.desc.toLowerCase().includes(search.toLowerCase()) ||
        p.cat.toLowerCase().includes(search.toLowerCase())
      )
    : null;

  const go = useCallback((id) => {
    const page = PAGES.find(p => p.id === id);
    if (!page) return;
    setRecent(prev => [id, ...prev.filter(r => r !== id)].slice(0, 4));
    setOpen(false);
    setSearch("");
    navigate(page.route);
  }, [navigate]);

  const recentPages = recent
    .map(id => PAGES.find(p => p.id === id))
    .filter(Boolean)
    .filter(p => p.id !== current);

  return (
    <>
      {/* ── NAVIGATION BAR ── */}
      <div style={{
        position:"sticky", top:0, zIndex:200,
        height:48,
        backdropFilter:"blur(24px) saturate(180%)",
        WebkitBackdropFilter:"blur(24px) saturate(180%)",
        background:"rgba(5,10,20,0.92)",
        borderBottom:"1px solid rgba(42,79,122,0.4)",
        display:"flex", alignItems:"center",
        padding:"0 14px", gap:10,
        flexShrink:0,
      }}>
        {/* Wordmark */}
        <div style={{
          fontFamily:"JetBrains Mono", fontWeight:700, fontSize:12,
          letterSpacing:3, color:T.gold, flexShrink:0,
        }}>NOTRYA</div>

        {/* Separator */}
        <div style={{ width:1, height:18, background:"rgba(42,79,122,0.5)", flexShrink:0 }}/>

        {/* Current page name */}
        {currentPage && (
          <div style={{ display:"flex", alignItems:"center", gap:7, minWidth:0 }}>
            <span style={{ fontSize:14, flexShrink:0 }}>{currentPage.icon}</span>
            <span style={{
              fontFamily:"DM Sans", fontWeight:600, fontSize:13,
              color:currentPage.color,
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
            }}>{currentPage.name}</span>
          </div>
        )}

        {/* Spacer */}
        <div style={{ flex:1 }}/>

        {/* Alert dot */}
        {alerts > 0 && (
          <button onClick={() => go("critical")} style={{
            fontFamily:"JetBrains Mono", fontWeight:700, fontSize:9,
            padding:"3px 9px", borderRadius:20, cursor:"pointer",
            border:`1px solid ${T.red}45`, background:`${T.red}14`, color:T.red,
            display:"flex", alignItems:"center", gap:5, flexShrink:0,
          }}>
            <span className={`${PREFIX}-pulse`} style={{ display:"inline-block", width:6, height:6, borderRadius:"50%", background:T.red }}/>
            {alerts}
          </button>
        )}

        {/* Hub picker toggle */}
        <button onClick={() => setOpen(p => !p)} style={{
          display:"flex", alignItems:"center", gap:6,
          fontFamily:"DM Sans", fontWeight:700, fontSize:11,
          padding:"6px 12px", borderRadius:8, cursor:"pointer",
          border:`1px solid ${open ? T.teal+"55" : "rgba(42,79,122,0.45)"}`,
          background: open ? `${T.teal}14` : "rgba(14,37,68,0.5)",
          color: open ? T.teal : T.txt3,
          transition:"all .15s", flexShrink:0,
        }}>
          <span style={{ fontSize:13, lineHeight:1 }}>⊞</span>
          <span>All Hubs</span>
        </button>
      </div>

      {/* ── HUB PICKER OVERLAY ── */}
      {open && (
        <div
          className={`${PREFIX}-overlay`}
          onClick={() => { setOpen(false); setSearch(""); }}
          style={{
            position:"fixed", inset:0, zIndex:199,
            background:"rgba(3,8,18,0.88)",
            backdropFilter:"blur(12px)",
            WebkitBackdropFilter:"blur(12px)",
            overflowY:"auto",
            paddingTop:48,
          }}
        >
          <div onClick={e => e.stopPropagation()} style={{ maxWidth:860, margin:"0 auto", padding:"16px 16px 40px" }}>

            {/* Search */}
            <div style={{ position:"relative", marginBottom:16 }}>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search hubs..."
                autoFocus
                style={{
                  width:"100%",
                  background:"rgba(14,37,68,0.9)",
                  border:`1px solid ${search ? T.teal+"50" : "rgba(42,79,122,0.45)"}`,
                  borderRadius:10, padding:"11px 16px 11px 42px",
                  fontFamily:"DM Sans", fontSize:14, color:T.txt,
                  outline:"none", transition:"border-color .12s",
                }}
              />
              <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:16, opacity:.5 }}>
                🔍
              </span>
            </div>

            {/* Search results */}
            {filtered && (
              <div>
                <div style={{ fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700, color:T.txt4, letterSpacing:2, textTransform:"uppercase", marginBottom:8 }}>
                  Results ({filtered.length})
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:8 }}>
                  {filtered.map(p => <HubCard key={p.id} page={p} current={current} navigate={go}/>)}
                </div>
              </div>
            )}

            {/* Recent */}
            {!filtered && recentPages.length > 0 && (
              <div style={{ marginBottom:20 }}>
                <div style={{ fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700, color:T.txt4, letterSpacing:2, textTransform:"uppercase", marginBottom:8 }}>
                  Recent
                </div>
                <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
                  {recentPages.map(p => (
                    <button key={p.id} onClick={() => go(p.id)} style={{
                      fontFamily:"DM Sans", fontWeight:600, fontSize:12,
                      padding:"6px 13px", borderRadius:20, cursor:"pointer",
                      border:`1px solid ${p.color}35`, background:`${p.color}0e`, color:p.color,
                      display:"flex", alignItems:"center", gap:6,
                      transition:"all .12s",
                    }}>
                      <span>{p.icon}</span>{p.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* All pages by category */}
            {!filtered && CATS.map(cat => {
              const catPages = PAGES.filter(p => p.cat === cat);
              const cc = CAT_COLOR[cat];
              return (
                <div key={cat} style={{ marginBottom:22 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                    <div style={{ fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700, color:cc, letterSpacing:2, textTransform:"uppercase" }}>
                      {cat}
                    </div>
                    <div style={{ flex:1, height:1, background:`linear-gradient(90deg,${cc}30,transparent)` }}/>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:8 }}>
                    {catPages.map((p, i) => (
                      <HubCard key={p.id} page={p} current={current} navigate={go} delay={i * 0.04}/>
                    ))}
                  </div>
                </div>
              );
            })}

          </div>
        </div>
      )}
    </>
  );
}