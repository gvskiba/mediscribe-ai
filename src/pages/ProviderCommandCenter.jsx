import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

const PREFIX = "pcc";

(() => {
  const id = `${PREFIX}-fonts`;
  if (document.getElementById(id)) return;
  const l = document.createElement("link");
  l.id = id; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = `${PREFIX}-css`;
  s.textContent = `
    * { box-sizing:border-box; margin:0; padding:0; }
    ::-webkit-scrollbar { width:3px; height:3px; }
    ::-webkit-scrollbar-track { background:transparent; }
    ::-webkit-scrollbar-thumb { background:rgba(42,79,122,.5); border-radius:2px; }
    @keyframes ${PREFIX}fade  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
    @keyframes ${PREFIX}shim  { 0%,100%{background-position:-200% center} 50%{background-position:200% center} }
    @keyframes ${PREFIX}orb0  { 0%,100%{transform:translate(-50%,-50%) scale(1)}    50%{transform:translate(-50%,-50%) scale(1.1)}  }
    @keyframes ${PREFIX}orb1  { 0%,100%{transform:translate(-50%,-50%) scale(1.07)} 50%{transform:translate(-50%,-50%) scale(.92)}   }
    @keyframes ${PREFIX}orb2  { 0%,100%{transform:translate(-50%,-50%) scale(.95)}  50%{transform:translate(-50%,-50%) scale(1.09)}  }
    @keyframes ${PREFIX}pulse { 0%,100%{opacity:1} 50%{opacity:0.25} }
    @keyframes ${PREFIX}spin  { to{transform:rotate(360deg)} }
    @keyframes ${PREFIX}tick  { from{transform:translateX(0)} to{transform:translateX(-50%)} }
    .${PREFIX}-fade  { animation:${PREFIX}fade  .22s ease both; }
    .${PREFIX}-pulse { animation:${PREFIX}pulse 2s ease-in-out infinite; }
    .${PREFIX}-spin  { animation:${PREFIX}spin  .9s linear infinite; }
    .${PREFIX}-shim  {
      background:linear-gradient(90deg,#f2f7ff 0%,#00e5c0 35%,#3b9eff 65%,#9b6dff 85%,#f2f7ff 100%);
      background-size:250% auto; -webkit-background-clip:text;
      -webkit-text-fill-color:transparent; background-clip:text;
      animation:${PREFIX}shim 5s linear infinite;
    }
    .${PREFIX}-nav-btn:hover { background:rgba(14,37,68,0.7) !important; border-color:rgba(42,79,122,0.7) !important; }
    .${PREFIX}-quick-btn:hover { filter:brightness(1.15); transform:translateY(-1px); }
    .${PREFIX}-card:hover { border-color:rgba(42,79,122,0.6) !important; }
  `;
  document.head.appendChild(s);
})();

const T = {
  bg:"#050f1e", txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", red:"#ff4444", green:"#3dffa0",
  blue:"#3b9eff", purple:"#9b6dff", orange:"#ff9f43", coral:"#ff6b6b",
};

const glass = {
  backdropFilter:"blur(20px) saturate(180%)", WebkitBackdropFilter:"blur(20px) saturate(180%)",
  background:"rgba(8,22,40,0.78)", border:"1px solid rgba(42,79,122,0.35)", borderRadius:14,
};

// ── QUICK LAUNCH TILES ────────────────────────────────────────────────
const QUICK_LINKS = [
  { icon:"🏥", label:"Tracking Board",   route:"/EDTrackingBoard",    color:T.teal   },
  { icon:"🚪", label:"Dispo Board",      route:"/DispositionBoard",   color:T.blue   },
  { icon:"🔴", label:"Critical Inbox",   route:"/critical-inbox",     color:T.red    },
  { icon:"🧠", label:"Narrative Engine", route:"/narrative-engine",   color:T.purple },
  { icon:"📐", label:"DDx Engine",       route:"/ddx-engine",         color:T.blue   },
  { icon:"💊", label:"Smart Dosing",     route:"/smart-dosing",       color:T.green  },
  { icon:"🏥", label:"Hub Selector",     route:"/hub",                color:T.gold   },
  { icon:"📝", label:"New Patient",      route:"/NewPatientInput",    color:T.teal   },
  { icon:"🖊️", label:"Note Studio",      route:"/ClinicalNoteStudio", color:T.purple },
  { icon:"🫀", label:"Cardiac Hub",      route:"/cardiac-hub",        color:T.coral  },
  { icon:"💓", label:"Resus Hub",        route:"/resus-hub",          color:T.red    },
  { icon:"🌬️", label:"Airway Hub",       route:"/airway-hub",         color:T.blue   },
];

// ── STATUS CONFIGS ────────────────────────────────────────────────────
const CONV_COLORS = {
  complete:   T.teal,
  converging: T.green,
  developing: T.gold,
  fragmented: T.red,
};

// ── HELPERS ───────────────────────────────────────────────────────────
function fmtTime(date) {
  return date.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
}
function fmtDate(date) {
  return date.toLocaleDateString([], { weekday:"long", month:"long", day:"numeric" });
}
function minsAgo(iso) {
  if (!iso) return null;
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
}
function fmtMins(m) {
  if (m === null || m === undefined) return "—";
  return m < 60 ? `${m}m` : `${Math.floor(m/60)}h ${m%60 > 0 ? `${m%60}m` : ""}`;
}

// ── AMBIENT BG ────────────────────────────────────────────────────────
function AmbientBg() {
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }}>
      {[
        { l:"8%",  t:"15%", r:380, c:"rgba(0,229,192,0.04)"   },
        { l:"90%", t:"8%",  r:320, c:"rgba(59,158,255,0.04)"  },
        { l:"75%", t:"78%", r:360, c:"rgba(155,109,255,0.035)"},
        { l:"18%", t:"82%", r:280, c:"rgba(245,200,66,0.035)" },
      ].map((o,i) => (
        <div key={i} style={{
          position:"absolute", left:o.l, top:o.t,
          width:o.r*2, height:o.r*2, borderRadius:"50%",
          background:`radial-gradient(circle,${o.c} 0%,transparent 68%)`,
          transform:"translate(-50%,-50%)",
          animation:`${PREFIX}orb${i%3} ${9+i*1.4}s ease-in-out infinite`,
        }}/>
      ))}
    </div>
  );
}

// ── TOP CLOCK ─────────────────────────────────────────────────────────
function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ textAlign:"right" }}>
      <div style={{ fontFamily:"JetBrains Mono", fontWeight:700, fontSize:28, color:T.teal, lineHeight:1 }}>
        {fmtTime(now)}
      </div>
      <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt4, marginTop:3 }}>
        {fmtDate(now)}
      </div>
    </div>
  );
}

// ── STAT TILE ─────────────────────────────────────────────────────────
function StatTile({ icon, value, label, sub, color, pulse }) {
  return (
    <div style={{
      ...glass, padding:"12px 14px", borderRadius:12,
      borderLeft:`3px solid ${color}`,
      background:`linear-gradient(135deg,${color}0f,rgba(8,22,40,0.82))`,
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:5 }}>
        <span style={{ fontSize:16 }}>{icon}</span>
        <span style={{
          fontFamily:"JetBrains Mono", fontWeight:700,
          fontSize:24, color,
          ...(pulse ? { animation:`${PREFIX}pulse 1.8s ease-in-out infinite` } : {}),
        }}>{value}</span>
      </div>
      <div style={{ fontFamily:"DM Sans", fontWeight:600, fontSize:11, color:T.txt }}>{label}</div>
      {sub && <div style={{ fontFamily:"DM Sans", fontSize:9, color:T.txt4, marginTop:2 }}>{sub}</div>}
    </div>
  );
}

// ── QUICK LAUNCH BUTTON ───────────────────────────────────────────────
function QuickBtn({ item, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`${PREFIX}-quick-btn`}
      style={{
        display:"flex", flexDirection:"column", alignItems:"center", gap:5,
        padding:"12px 8px", borderRadius:12, cursor:"pointer",
        border:`1px solid ${item.color}22`,
        background:`${item.color}08`,
        transition:"all .15s",
      }}
    >
      <span style={{ fontSize:20 }}>{item.icon}</span>
      <span style={{ fontFamily:"DM Sans", fontWeight:600, fontSize:10, color:item.color, textAlign:"center", lineHeight:1.2 }}>
        {item.label}
      </span>
    </button>
  );
}

// ── PATIENT ROW ───────────────────────────────────────────────────────
function PatientRow({ patient, onOpen }) {
  const mins = minsAgo(patient.created_date);
  const convColor = CONV_COLORS[patient._conv] || T.txt4;

  return (
    <div
      onClick={onOpen}
      className={`${PREFIX}-card`}
      style={{
        display:"grid",
        gridTemplateColumns:"40px 1fr 80px 90px 60px",
        alignItems:"center", gap:12,
        padding:"10px 14px", borderRadius:10, cursor:"pointer",
        background:"rgba(8,22,40,0.6)",
        border:"1px solid rgba(42,79,122,0.25)",
        transition:"all .15s",
      }}
    >
      {/* Room */}
      <div style={{ fontFamily:"JetBrains Mono", fontWeight:700, fontSize:16, color:convColor }}>{patient.patient_id || "—"}</div>
      {/* Name + CC */}
      <div>
        <div style={{ fontFamily:"DM Sans", fontWeight:600, fontSize:12, color:T.txt }}>{patient.patient_name}</div>
        <div style={{ fontFamily:"DM Sans", fontSize:10, color:T.txt4 }}>
          {patient.chronic_conditions?.[0] || "CC unknown"}
        </div>
      </div>
      {/* Time */}
      <div style={{ fontFamily:"JetBrains Mono", fontSize:10, color:T.txt4 }}>{fmtMins(mins)}</div>
      {/* Provider */}
      <div style={{ fontFamily:"DM Sans", fontSize:10, color:T.txt3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
        {patient.created_by?.split("@")[0] || "—"}
      </div>
      {/* Conv badge */}
      <span style={{
        fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700,
        padding:"2px 6px", borderRadius:20,
        background:`${convColor}18`, border:`1px solid ${convColor}35`,
        color:convColor, letterSpacing:.5, textAlign:"center",
      }}>{(patient._conv || "developing").toUpperCase()}</span>
    </div>
  );
}

// ── HUB SHORTCUT ─────────────────────────────────────────────────────
const HUB_SHORTCUTS = [
  { icon:"🫀", label:"Cardiac",   route:"/cardiac-hub",  color:T.coral  },
  { icon:"💓", label:"Resus",     route:"/resus-hub",    color:T.red    },
  { icon:"🌬️", label:"Airway",    route:"/airway-hub",   color:T.blue   },
  { icon:"🦠", label:"Sepsis",    route:"/sepsis-hub",   color:T.gold   },
  { icon:"🧠", label:"Stroke",    route:"/StrokeAssessment", color:T.purple },
  { icon:"☠️", label:"Tox",       route:"/tox-hub",      color:T.green  },
  { icon:"🩻", label:"Radiology", route:"/radiology-hub",color:"#00d4ff"},
  { icon:"📡", label:"Consult",   route:"/consult-hub",  color:T.purple },
];

// ── NOTE ACTIVITY ITEM ────────────────────────────────────────────────
function ActivityItem({ note }) {
  const mins = minsAgo(note.updated_date || note.created_date);
  const statusColor = note.status === "finalized" ? T.teal : note.status === "amended" ? T.blue : T.orange;
  return (
    <div style={{
      display:"flex", alignItems:"flex-start", gap:10, padding:"9px 12px",
      background:"rgba(8,22,40,0.5)", borderRadius:9,
      borderLeft:`2px solid ${statusColor}`,
    }}>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontFamily:"DM Sans", fontWeight:600, fontSize:12, color:T.txt, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {note.patient_name || "Unknown patient"}
        </div>
        <div style={{ fontFamily:"DM Sans", fontSize:10, color:T.txt4 }}>
          {note.chief_complaint || note.note_type || "Note"}
        </div>
      </div>
      <div style={{ textAlign:"right", flexShrink:0 }}>
        <div style={{
          fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700,
          color:statusColor, letterSpacing:.5,
        }}>{(note.status || "draft").toUpperCase()}</div>
        <div style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4, marginTop:2 }}>
          {fmtMins(mins)} ago
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  MAIN EXPORT
// ══════════════════════════════════════════════════════════════════════
export default function ProviderCommandCenter() {
  const navigate = useNavigate();
  const [user,      setUser]      = useState(null);
  const [patients,  setPatients]  = useState([]);
  const [notes,     setNotes]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState("patients");

  // ── Fetch ─────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      const [me, pts, nts] = await Promise.all([
        base44.auth.me(),
        base44.entities.Patient.list("-created_date", 30),
        base44.entities.ClinicalNote.list("-updated_date", 20),
      ]);
      setUser(me);
      // Assign synthetic convergence state
      const enriched = pts.map((p, i) => ({
        ...p,
        _conv: ["developing","converging","fragmented","complete","developing"][i % 5],
      }));
      setPatients(enriched);
      setNotes(nts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const t = setInterval(fetchAll, 60000);
    return () => clearInterval(t);
  }, [fetchAll]);

  // ── Derived stats ─────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:     patients.length,
    fragmented:patients.filter(p => p._conv === "fragmented").length,
    complete:  patients.filter(p => p._conv === "complete").length,
    unsigned:  notes.filter(n => n.status !== "finalized").length,
  }), [patients, notes]);

  const myNotes = useMemo(() =>
    notes.filter(n => n.created_by === user?.email),
  [notes, user]);

  const TABS = [
    { id:"patients", label:"Patients",        icon:"🏥" },
    { id:"notes",    label:"Recent Notes",    icon:"📝" },
    { id:"hubs",     label:"Clinical Hubs",   icon:"⚕️" },
  ];

  return (
    <div style={{
      fontFamily:"DM Sans, sans-serif", background:T.bg, minHeight:"100vh",
      position:"relative", overflowX:"hidden", color:T.txt,
    }}>
      <AmbientBg/>

      <div style={{ position:"relative", zIndex:1, maxWidth:1440, margin:"0 auto", padding:"0 20px" }}>

        {/* ── TOP BAR ── */}
        <div style={{
          ...glass, margin:"18px 0 16px", padding:"14px 20px",
          borderRadius:16, display:"flex", alignItems:"center", justifyContent:"space-between",
          gap:16, flexWrap:"wrap",
        }}>
          {/* Identity */}
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{
              width:46, height:46, borderRadius:14, flexShrink:0,
              background:"linear-gradient(135deg,rgba(0,229,192,0.2),rgba(155,109,255,0.15))",
              border:"1px solid rgba(0,229,192,0.3)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:20,
            }}>⚕️</div>
            <div>
              <div className={`${PREFIX}-shim`} style={{
                fontFamily:"Playfair Display", fontWeight:900,
                fontSize:"clamp(18px,2.5vw,26px)", letterSpacing:-.5, lineHeight:1,
              }}>
                Provider Command Center
              </div>
              <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt4, marginTop:3 }}>
                {user?.full_name ? `Dr. ${user.full_name}` : "Loading..."} · ED Physician Dashboard
              </div>
            </div>
          </div>

          {/* Clock */}
          <LiveClock/>

          {/* Nav actions */}
          <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
            {[
              { label:"+ New Patient",  route:"/NewPatientInput",   color:T.teal   },
              { label:"🖊️ Note Studio", route:"/ClinicalNoteStudio",color:T.purple },
              { label:"🏥 Hub",         route:"/hub",               color:T.gold   },
            ].map(btn => (
              <button key={btn.route} onClick={() => navigate(btn.route)}
                className={`${PREFIX}-nav-btn`}
                style={{
                  fontFamily:"DM Sans", fontWeight:700, fontSize:12,
                  padding:"7px 16px", borderRadius:9, cursor:"pointer",
                  border:`1px solid ${btn.color}35`,
                  background:`${btn.color}0e`,
                  color:btn.color, transition:"all .15s",
                }}
              >{btn.label}</button>
            ))}
          </div>
        </div>

        {/* ── STATS ROW ── */}
        <div style={{
          display:"grid",
          gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",
          gap:10, marginBottom:16,
        }}>
          <StatTile icon="🏥" value={loading?"—":stats.total}      label="Active Patients"   sub="ED census"         color={T.teal}  />
          <StatTile icon="⚡" value={loading?"—":stats.fragmented}  label="Need Attention"   sub="Fragmented stories" color={T.red}   pulse={stats.fragmented > 0}/>
          <StatTile icon="✅" value={loading?"—":stats.complete}    label="Complete"          sub="Ready for dispo"   color={T.green} />
          <StatTile icon="📝" value={loading?"—":stats.unsigned}   label="Unsigned Notes"    sub="Requires signature" color={T.orange}/>
          <StatTile icon="🩺" value={loading?"—":(myNotes.length)}  label="My Notes"          sub="This session"       color={T.blue}  />
        </div>

        {/* ── QUICK LAUNCH ── */}
        <div style={{ ...glass, padding:"14px 16px", marginBottom:16, borderRadius:14 }}>
          <div style={{ fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700, color:T.txt4, letterSpacing:2, textTransform:"uppercase", marginBottom:10 }}>
            Quick Launch
          </div>
          <div style={{
            display:"grid",
            gridTemplateColumns:"repeat(auto-fill,minmax(80px,1fr))",
            gap:8,
          }}>
            {QUICK_LINKS.map(item => (
              <QuickBtn key={item.route} item={item} onClick={() => navigate(item.route)}/>
            ))}
          </div>
        </div>

        {/* ── MAIN CONTENT GRID ── */}
        <div style={{
          display:"grid",
          gridTemplateColumns:"1fr 340px",
          gap:14, marginBottom:24,
          alignItems:"start",
        }}>

          {/* LEFT: Tabs panel */}
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {/* Tab bar */}
            <div style={{ ...glass, padding:"5px", display:"flex", gap:4 }}>
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  flex:1, fontFamily:"DM Sans", fontWeight:600, fontSize:12,
                  padding:"9px 8px", borderRadius:9, cursor:"pointer",
                  textAlign:"center", transition:"all .15s",
                  border:`1px solid ${activeTab===tab.id ? T.teal+"55" : "transparent"}`,
                  background: activeTab===tab.id ? `${T.teal}14` : "transparent",
                  color: activeTab===tab.id ? T.teal : T.txt3,
                }}>{tab.icon} {tab.label}</button>
              ))}
            </div>

            {/* Patients tab */}
            {activeTab === "patients" && (
              <div className={`${PREFIX}-fade`} style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {/* Column headers */}
                <div style={{
                  display:"grid", gridTemplateColumns:"40px 1fr 80px 90px 60px",
                  gap:12, padding:"6px 14px",
                  fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700,
                  color:T.txt4, letterSpacing:1.5, textTransform:"uppercase",
                }}>
                  <span>Rm</span><span>Patient / CC</span><span>Time</span><span>Provider</span><span>Status</span>
                </div>
                {loading && [...Array(6)].map((_, i) => (
                  <div key={i} style={{
                    height:52, borderRadius:10, border:"1px solid rgba(42,79,122,0.2)",
                    background:"rgba(14,37,68,0.4)",
                    animation:`${PREFIX}pulse 1.6s ease-in-out ${i*.1}s infinite`,
                  }}/>
                ))}
                {!loading && patients.length === 0 && (
                  <div style={{ ...glass, padding:"36px", textAlign:"center" }}>
                    <div style={{ fontSize:32, marginBottom:10 }}>🏥</div>
                    <div style={{ fontFamily:"DM Sans", fontSize:13, color:T.txt3 }}>No patients in the system</div>
                    <button onClick={() => navigate("/NewPatientInput")} style={{
                      marginTop:14, fontFamily:"DM Sans", fontWeight:700, fontSize:12,
                      padding:"9px 20px", borderRadius:9, cursor:"pointer",
                      border:`1px solid ${T.teal}40`, background:`${T.teal}0e`, color:T.teal,
                    }}>+ Add First Patient</button>
                  </div>
                )}
                {!loading && patients.map(p => (
                  <PatientRow
                    key={p.id}
                    patient={p}
                    onOpen={() => navigate(`/NewPatientInput?patient=${p.id}`)}
                  />
                ))}
              </div>
            )}

            {/* Notes tab */}
            {activeTab === "notes" && (
              <div className={`${PREFIX}-fade`} style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {loading && [...Array(5)].map((_, i) => (
                  <div key={i} style={{
                    height:52, borderRadius:9, background:"rgba(14,37,68,0.4)",
                    animation:`${PREFIX}pulse 1.6s ease-in-out ${i*.1}s infinite`,
                  }}/>
                ))}
                {!loading && notes.length === 0 && (
                  <div style={{ ...glass, padding:"36px", textAlign:"center" }}>
                    <div style={{ fontSize:32, marginBottom:10 }}>📝</div>
                    <div style={{ fontFamily:"DM Sans", fontSize:13, color:T.txt3 }}>No notes yet</div>
                  </div>
                )}
                {!loading && notes.map(n => <ActivityItem key={n.id} note={n}/>)}
              </div>
            )}

            {/* Hubs tab */}
            {activeTab === "hubs" && (
              <div className={`${PREFIX}-fade`} style={{
                display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:10,
              }}>
                {HUB_SHORTCUTS.map(h => (
                  <button key={h.route} onClick={() => navigate(h.route)} style={{
                    padding:"16px", borderRadius:12, cursor:"pointer",
                    background:"rgba(8,22,40,0.7)",
                    border:`1px solid ${h.color}25`,
                    borderLeft:`3px solid ${h.color}`,
                    display:"flex", alignItems:"center", gap:10, transition:"all .15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = `${h.color}0c`}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(8,22,40,0.7)"}
                  >
                    <span style={{ fontSize:20 }}>{h.icon}</span>
                    <span style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:13, color:T.txt }}>{h.label}</span>
                  </button>
                ))}
                {/* All hubs */}
                <button onClick={() => navigate("/hub")} style={{
                  padding:"16px", borderRadius:12, cursor:"pointer",
                  background:"rgba(8,22,40,0.7)",
                  border:`1px solid ${T.teal}25`,
                  borderLeft:`3px solid ${T.teal}`,
                  display:"flex", alignItems:"center", gap:10, transition:"all .15s",
                  gridColumn:"1 / -1",
                }}
                onMouseEnter={e => e.currentTarget.style.background = `${T.teal}0a`}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(8,22,40,0.7)"}
                >
                  <span style={{ fontSize:20 }}>⚕️</span>
                  <div>
                    <div style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:13, color:T.teal }}>View All 35+ Clinical Hubs</div>
                    <div style={{ fontFamily:"DM Sans", fontSize:10, color:T.txt4 }}>Cardiac, Trauma, Sepsis, Peds, OB, Tox, POCUS, and more</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* RIGHT: Sidebar */}
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

            {/* AI Tools panel */}
            <div style={{ ...glass, padding:"14px 16px" }}>
              <div style={{ fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700, color:T.purple, letterSpacing:2, textTransform:"uppercase", marginBottom:10 }}>
                AI Tools
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                {[
                  { icon:"🧠", label:"Clinical Narrative Engine",  sub:"Living patient stories",           route:"/narrative-engine", color:T.purple },
                  { icon:"📐", label:"DDx Engine",                 sub:"AI differential diagnosis",        route:"/ddx-engine",       color:T.blue   },
                  { icon:"💊", label:"Smart Dosing Hub",           sub:"Patient-specific pharmacology",    route:"/smart-dosing",     color:T.green  },
                  { icon:"🔴", label:"Critical Results Inbox",     sub:"Panic values + escalation",        route:"/critical-inbox",   color:T.red    },
                ].map(item => (
                  <button key={item.route} onClick={() => navigate(item.route)} style={{
                    display:"flex", alignItems:"center", gap:10, padding:"9px 12px",
                    borderRadius:9, cursor:"pointer", textAlign:"left",
                    border:`1px solid ${item.color}22`,
                    background:`${item.color}07`,
                    transition:"all .15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${item.color}12`; e.currentTarget.style.borderColor = `${item.color}40`; }}
                  onMouseLeave={e => { e.currentTarget.style.background = `${item.color}07`; e.currentTarget.style.borderColor = `${item.color}22`; }}
                  >
                    <span style={{ fontSize:16, flexShrink:0 }}>{item.icon}</span>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontFamily:"DM Sans", fontWeight:600, fontSize:12, color:T.txt }}>{item.label}</div>
                      <div style={{ fontFamily:"DM Sans", fontSize:10, color:T.txt4 }}>{item.sub}</div>
                    </div>
                    <span style={{ marginLeft:"auto", color:item.color, fontSize:12, flexShrink:0 }}>→</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Workflow panel */}
            <div style={{ ...glass, padding:"14px 16px" }}>
              <div style={{ fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700, color:T.teal, letterSpacing:2, textTransform:"uppercase", marginBottom:10 }}>
                Workflow
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                {[
                  { icon:"🏥", label:"ED Tracking Board",   sub:"Live patient census",        route:"/EDTrackingBoard",    color:T.teal   },
                  { icon:"🚪", label:"Disposition Board",   sub:"Admit · Transfer · D/C",     route:"/DispositionBoard",   color:T.blue   },
                  { icon:"🔄", label:"Shift Hub",           sub:"Handoffs · signout",         route:"/Shift",              color:T.orange },
                  { icon:"💰", label:"Billing",             sub:"E/M coding · submissions",   route:"/billing-submissions",color:T.gold   },
                ].map(item => (
                  <button key={item.route} onClick={() => navigate(item.route)} style={{
                    display:"flex", alignItems:"center", gap:10, padding:"9px 12px",
                    borderRadius:9, cursor:"pointer", textAlign:"left",
                    border:`1px solid rgba(42,79,122,0.25)`,
                    background:"rgba(8,22,40,0.5)",
                    transition:"all .15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(14,37,68,0.7)"; e.currentTarget.style.borderColor = "rgba(42,79,122,0.5)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(8,22,40,0.5)"; e.currentTarget.style.borderColor = "rgba(42,79,122,0.25)"; }}
                  >
                    <span style={{ fontSize:16, flexShrink:0 }}>{item.icon}</span>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontFamily:"DM Sans", fontWeight:600, fontSize:12, color:T.txt }}>{item.label}</div>
                      <div style={{ fontFamily:"DM Sans", fontSize:10, color:T.txt4 }}>{item.sub}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent activity */}
            <div style={{ ...glass, padding:"14px 16px" }}>
              <div style={{ fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700, color:T.txt4, letterSpacing:2, textTransform:"uppercase", marginBottom:10 }}>
                My Recent Notes
              </div>
              {loading ? (
                <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt4 }}>Loading...</div>
              ) : myNotes.length === 0 ? (
                <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt4, padding:"12px 0" }}>No notes found for your account.</div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {myNotes.slice(0, 5).map(n => <ActivityItem key={n.id} note={n}/>)}
                </div>
              )}
              <button onClick={() => navigate("/ClinicalNoteStudio")} style={{
                width:"100%", marginTop:10,
                fontFamily:"DM Sans", fontWeight:600, fontSize:11,
                padding:"8px", borderRadius:8, cursor:"pointer",
                border:`1px solid ${T.purple}30`, background:`${T.purple}08`, color:T.purple,
              }}>🖊️ Open Note Studio</button>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign:"center", paddingBottom:24 }}>
          <span style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4, letterSpacing:1.5 }}>
            NOTRYA · PROVIDER COMMAND CENTER · CLINICAL DECISION SUPPORT ONLY
          </span>
        </div>

      </div>
    </div>
  );
}