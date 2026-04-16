// HuddleBoard.jsx — ED Department Huddle Board
// Scannable department-level view of all active patients.
// Reassessment clocks, ESI acuity, pending tasks, disposition status.
//
// Props:
//   patients        — PatientSummary[] (see shape below). Falls back to
//                     MOCK_PATIENTS when empty for demo/design mode.
//   onSelectPatient — (id: string) => void — open patient encounter
//   providerFilter  — string | null — filter to one provider's patients
//
// PatientSummary shape:
//   { id, room, esiLevel(1-5), demo:{age,sex}, cc:{text},
//     vitals:{hr,bp,spo2}, disposition, lastAssessedAt(ms timestamp),
//     doorTime(ms timestamp), pendingTasks:[{id,label,type}],
//     provider, flagged }
//
// Constraints: no form, no localStorage, no router, no sonner, no alert,
//   straight quotes only, border before borderTop/etc.

import { useState, useEffect, useCallback, useMemo } from "react";

// ── Font injection ────────────────────────────────────────────────────────────
(() => {
  if (document.getElementById("huddle-fonts")) return;
  const l = document.createElement("link");
  l.id = "huddle-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
})();

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36", up:"#0e2544",
  bd:"rgba(26,53,85,0.8)", txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0", red:"#ff3d3d",
};

// ── ESI config ────────────────────────────────────────────────────────────────
const ESI = {
  1: { color:"#ff3d3d", bg:"rgba(255,61,61,.18)",  label:"Immediate",    windowMin:15  },
  2: { color:"#ff9f43", bg:"rgba(255,159,67,.14)",  label:"Emergent",     windowMin:30  },
  3: { color:"#f5c842", bg:"rgba(245,200,66,.12)",  label:"Urgent",       windowMin:60  },
  4: { color:"#3b9eff", bg:"rgba(59,158,255,.11)",  label:"Less Urgent",  windowMin:120 },
  5: { color:"#82aece", bg:"rgba(130,174,206,.10)", label:"Non-Urgent",   windowMin:120 },
};

// ── Disposition config ────────────────────────────────────────────────────────
const DISP = {
  pending:     { label:"Pending",     color:T.txt4,   bg:"rgba(42,77,114,.25)"       },
  admit:       { label:"Admit",       color:T.orange, bg:"rgba(255,159,67,.12)"      },
  obs:         { label:"Obs",         color:T.purple, bg:"rgba(155,109,255,.12)"     },
  discharge:   { label:"DC",          color:T.teal,   bg:"rgba(0,229,192,.12)"       },
  transfer:    { label:"Transfer",    color:T.blue,   bg:"rgba(59,158,255,.12)"      },
  ama:         { label:"AMA",         color:T.coral,  bg:"rgba(255,107,107,.12)"     },
  lwbs:        { label:"LWBS",        color:T.coral,  bg:"rgba(255,107,107,.08)"     },
};

// ── Pending task type colors ───────────────────────────────────────────────────
const TASK_COLORS = {
  result:"#3b9eff", consult:"#9b6dff", imaging:"#f5c842",
  procedure:"#ff9f43", medication:"#00e5c0", other:"#82aece",
};

// ── Mock patients (demo / design mode) ────────────────────────────────────────
const NOW = Date.now();
const mins = (n) => NOW - n * 60000;

const MOCK_PATIENTS = [
  {
    id:"pt1", room:"T1", esiLevel:1,
    demo:{ age:67, sex:"M" }, cc:{ text:"Chest pain, diaphoresis" },
    vitals:{ hr:"118", bp:"88/54", spo2:"94" },
    disposition:"admit", lastAssessedAt:mins(8), doorTime:mins(42),
    pendingTasks:[
      { id:"t1", label:"Troponin 3h", type:"result" },
      { id:"t2", label:"Cardiology consult", type:"consult" },
      { id:"t3", label:"Heparin drip", type:"medication" },
    ],
    provider:"Dr. Reyes", flagged:true,
  },
  {
    id:"pt2", room:"T3", esiLevel:2,
    demo:{ age:44, sex:"F" }, cc:{ text:"Acute onset severe headache" },
    vitals:{ hr:"96", bp:"178/102", spo2:"99" },
    disposition:"pending", lastAssessedAt:mins(38), doorTime:mins(55),
    pendingTasks:[
      { id:"t4", label:"CT Head read", type:"imaging" },
      { id:"t5", label:"Neurology callback", type:"consult" },
    ],
    provider:"Dr. Reyes", flagged:false,
  },
  {
    id:"pt3", room:"5A", esiLevel:2,
    demo:{ age:29, sex:"M" }, cc:{ text:"Shortness of breath, O2 sat 88%" },
    vitals:{ hr:"124", bp:"132/84", spo2:"93" },
    disposition:"obs", lastAssessedAt:mins(22), doorTime:mins(78),
    pendingTasks:[
      { id:"t6", label:"BiPAP response reassess", type:"result" },
    ],
    provider:"Dr. Chen", flagged:false,
  },
  {
    id:"pt4", room:"8", esiLevel:3,
    demo:{ age:58, sex:"F" }, cc:{ text:"Right flank pain, hematuria" },
    vitals:{ hr:"88", bp:"148/92", spo2:"98" },
    disposition:"pending", lastAssessedAt:mins(72), doorTime:mins(110),
    pendingTasks:[
      { id:"t7", label:"CT urogram", type:"imaging" },
      { id:"t8", label:"Urology consult", type:"consult" },
    ],
    provider:"Dr. Patel", flagged:false,
  },
  {
    id:"pt5", room:"12", esiLevel:3,
    demo:{ age:71, sex:"M" }, cc:{ text:"Altered mental status, fever" },
    vitals:{ hr:"108", bp:"104/68", spo2:"96" },
    disposition:"admit", lastAssessedAt:mins(44), doorTime:mins(92),
    pendingTasks:[
      { id:"t9",  label:"Blood cultures", type:"result" },
      { id:"t10", label:"LP result", type:"result" },
      { id:"t11", label:"Neurology", type:"consult" },
    ],
    provider:"Dr. Chen", flagged:true,
  },
  {
    id:"pt6", room:"3B", esiLevel:3,
    demo:{ age:35, sex:"F" }, cc:{ text:"Abdominal pain, nausea" },
    vitals:{ hr:"92", bp:"118/76", spo2:"99" },
    disposition:"pending", lastAssessedAt:mins(55), doorTime:mins(88),
    pendingTasks:[
      { id:"t12", label:"Beta-hCG result", type:"result" },
      { id:"t13", label:"Pelvic US", type:"imaging" },
    ],
    provider:"Dr. Reyes", flagged:false,
  },
  {
    id:"pt7", room:"15", esiLevel:4,
    demo:{ age:22, sex:"M" }, cc:{ text:"Ankle sprain, R/O fracture" },
    vitals:{ hr:"74", bp:"122/78", spo2:"100" },
    disposition:"discharge", lastAssessedAt:mins(95), doorTime:mins(115),
    pendingTasks:[
      { id:"t14", label:"X-ray read", type:"imaging" },
    ],
    provider:"Dr. Patel", flagged:false,
  },
  {
    id:"pt8", room:"2", esiLevel:4,
    demo:{ age:54, sex:"F" }, cc:{ text:"UTI symptoms, dysuria" },
    vitals:{ hr:"82", bp:"128/82", spo2:"98" },
    disposition:"discharge", lastAssessedAt:mins(88), doorTime:mins(98),
    pendingTasks:[], provider:"Dr. Chen", flagged:false,
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function elapsedMin(ts) {
  if (!ts) return null;
  return Math.floor((Date.now() - ts) / 60000);
}

function fmtMin(min) {
  if (min === null) return "\u2014";
  if (min < 60)  return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function clockColor(elapsed, windowMin) {
  if (elapsed === null || windowMin === null) return T.txt4;
  const pct = elapsed / windowMin;
  if (pct >= 1)    return T.coral;
  if (pct >= 0.75) return T.gold;
  return T.teal;
}

function shockIndex(vitals) {
  const hr  = parseFloat(vitals?.hr  || "0");
  const sbp = parseFloat((vitals?.bp || "").split("/")[0] || "0");
  if (!hr || !sbp) return null;
  return hr / sbp;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ESIBadge({ level }) {
  const cfg = ESI[level] || ESI[5];
  return (
    <div style={{ width:32, height:32, borderRadius:7, flexShrink:0,
      background:cfg.bg, border:`1.5px solid ${cfg.color}77`,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:900, color:cfg.color }}>
      {level}
    </div>
  );
}

function ReassessmentClock({ lastAssessedAt, windowMin }) {
  const elapsed = elapsedMin(lastAssessedAt);
  const col     = clockColor(elapsed, windowMin);
  const overdue = elapsed !== null && elapsed >= windowMin;
  return (
    <div style={{ textAlign:"center", minWidth:52 }}>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700, color:col, lineHeight:1 }}>
        {fmtMin(elapsed)}
      </div>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:col,
        letterSpacing:"0.5px", textTransform:"uppercase", marginTop:2,
        opacity: overdue ? 1 : 0.7 }}>
        {overdue ? "OVERDUE" : `/${windowMin}m`}
      </div>
    </div>
  );
}

function DispositionChip({ disposition }) {
  const cfg = DISP[disposition] || DISP.pending;
  return (
    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700,
      color:cfg.color, background:cfg.bg,
      border:`1px solid ${cfg.color}44`, borderRadius:5,
      padding:"2px 8px", letterSpacing:"0.5px", whiteSpace:"nowrap" }}>
      {cfg.label}
    </span>
  );
}

function TasksChip({ tasks, expanded, onToggle }) {
  if (!tasks || tasks.length === 0) {
    return (
      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4 }}>\u2014</span>
    );
  }
  const colors = tasks.slice(0, 3).map(t => TASK_COLORS[t.type] || T.txt4);
  return (
    <div style={{ position:"relative" }}>
      <button onClick={e => { e.stopPropagation(); onToggle(); }}
        style={{ display:"flex", alignItems:"center", gap:5, padding:"3px 8px", borderRadius:6,
          border:`1px solid rgba(42,77,114,.5)`, background: expanded ? T.up : "transparent",
          cursor:"pointer", transition:"all .12s" }}>
        <div style={{ display:"flex", gap:2 }}>
          {colors.map((c, i) => (
            <div key={i} style={{ width:6, height:6, borderRadius:3, background:c }} />
          ))}
          {tasks.length > 3 && (
            <div style={{ width:6, height:6, borderRadius:3, background:T.txt4 }} />
          )}
        </div>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700,
          color:T.txt3 }}>{tasks.length}</span>
      </button>

      {expanded && (
        <div style={{ position:"absolute", top:"calc(100% + 5px)", left:0, zIndex:200,
          background:T.panel, border:`1px solid ${T.bd}`, borderRadius:9,
          boxShadow:"0 12px 40px rgba(0,0,0,.55)", padding:"8px 10px",
          minWidth:200, maxWidth:280 }}>
          {tasks.map(t => (
            <div key={t.id} style={{ display:"flex", alignItems:"center", gap:7,
              padding:"4px 0", borderBottom:`1px solid rgba(26,53,85,.3)` }}>
              <div style={{ width:6, height:6, borderRadius:3, flexShrink:0,
                background:TASK_COLORS[t.type] || T.txt4 }} />
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt2 }}>
                {t.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color, sub }) {
  return (
    <div style={{ padding:"11px 16px", borderRadius:10, background:T.card,
      border:`1px solid ${color}28`, borderTop:`2px solid ${color}66`,
      display:"flex", flexDirection:"column", gap:2, minWidth:100 }}>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:900, color, lineHeight:1 }}>
        {value}
      </div>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4,
        letterSpacing:"1.2px", textTransform:"uppercase" }}>
        {label}
      </div>
      {sub && (
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.txt4, marginTop:1 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function HuddleBoard({
  patients: patientsProp,
  onSelectPatient,
  providerFilter = null,
}) {
  // Fall back to mock data when no patients provided
  const source = (patientsProp && patientsProp.length > 0) ? patientsProp : MOCK_PATIENTS;

  // ── State ──────────────────────────────────────────────────────────────────
  const [flagged,       setFlagged]       = useState(() => new Set(source.filter(p => p.flagged).map(p => p.id)));
  const [expandedTasks, setExpandedTasks] = useState(new Set());
  const [search,        setSearch]        = useState("");
  const [sortBy,        setSortBy]        = useState("acuity");   // "acuity" | "time" | "room" | "reassess"
  const [filterESI,     setFilterESI]     = useState(null);       // null | 1-5
  const [filterDisp,    setFilterDisp]    = useState(null);       // null | disposition key
  const [filterProv,    setFilterProv]    = useState(providerFilter || null);
  const [tick,          setTick]          = useState(0);          // forces reassessment clock re-render

  // Tick every 30 seconds to refresh clocks
  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(iv);
  }, []);

  // ── Toggle helpers ─────────────────────────────────────────────────────────
  const toggleFlag  = useCallback((id, e) => {
    e.stopPropagation();
    setFlagged(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleTasks = useCallback((id) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  // ── Providers list ─────────────────────────────────────────────────────────
  const providers = useMemo(() =>
    [...new Set(source.map(p => p.provider).filter(Boolean))].sort(),
    [source]
  );

  // ── Filter + sort ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...source];

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.room?.toLowerCase().includes(q) ||
        p.cc?.text?.toLowerCase().includes(q) ||
        p.provider?.toLowerCase().includes(q) ||
        `${p.demo?.age}`.includes(q)
      );
    }
    if (filterESI)  list = list.filter(p => p.esiLevel === filterESI);
    if (filterDisp) list = list.filter(p => p.disposition === filterDisp);
    if (filterProv) list = list.filter(p => p.provider === filterProv);

    list.sort((a, b) => {
      const aFlag = flagged.has(a.id) ? 0 : 1;
      const bFlag = flagged.has(b.id) ? 0 : 1;

      if (sortBy === "acuity") {
        if (a.esiLevel !== b.esiLevel) return a.esiLevel - b.esiLevel;
        if (aFlag !== bFlag) return aFlag - bFlag;
        return (elapsedMin(a.doorTime) || 0) - (elapsedMin(b.doorTime) || 0);
      }
      if (sortBy === "time") {
        return (elapsedMin(b.doorTime) || 0) - (elapsedMin(a.doorTime) || 0);
      }
      if (sortBy === "room") {
        return (a.room || "").localeCompare(b.room || "", undefined, { numeric:true });
      }
      if (sortBy === "reassess") {
        const aPct = (elapsedMin(a.lastAssessedAt) || 0) / (ESI[a.esiLevel]?.windowMin || 60);
        const bPct = (elapsedMin(b.lastAssessedAt) || 0) / (ESI[b.esiLevel]?.windowMin || 60);
        return bPct - aPct;
      }
      return 0;
    });
    return list;
  }, [source, search, filterESI, filterDisp, filterProv, flagged, sortBy, tick]);

  // ── Department stats ───────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const all    = source;
    const crit   = all.filter(p => p.esiLevel <= 2).length;
    const overdue = all.filter(p => {
      const el = elapsedMin(p.lastAssessedAt);
      return el !== null && el >= (ESI[p.esiLevel]?.windowMin || 60);
    }).length;
    const avgDoor = all.length > 0
      ? Math.round(all.reduce((s, p) => s + (elapsedMin(p.doorTime) || 0), 0) / all.length)
      : 0;
    const pendingTasks = all.reduce((s, p) => s + (p.pendingTasks?.length || 0), 0);
    return { total:all.length, crit, overdue, avgDoor, pendingTasks };
  }, [source, tick]);

  // ── Sort column header button ──────────────────────────────────────────────
  const SortBtn = ({ id, label }) => (
    <button onClick={() => setSortBy(id)}
      style={{ background:"none", border:"none", cursor:"pointer", padding:"2px 4px",
        fontFamily:"'JetBrains Mono',monospace", fontSize:9, letterSpacing:"1px",
        textTransform:"uppercase", color: sortBy === id ? T.teal : T.txt4,
        borderBottom: sortBy === id ? `1px solid ${T.teal}` : "1px solid transparent",
        transition:"all .12s" }}>
      {label}{sortBy === id ? " \u25be" : ""}
    </button>
  );

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ background:T.bg, minHeight:"100vh", color:T.txt, fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ padding:"20px 24px 60px" }}>

        {/* ── Header ── */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:16, marginBottom:20, flexWrap:"wrap" }}>
          <div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:900, color:T.txt, marginBottom:3 }}>
              Huddle Board
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt4 }}>
              {new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}
              {" \u00b7 "}
              <span style={{ fontFamily:"'JetBrains Mono',monospace" }}>
                {new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",hour12:false})}
              </span>
              {(!patientsProp || patientsProp.length === 0) && (
                <span style={{ marginLeft:10, fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                  color:T.gold, background:"rgba(245,200,66,.08)", border:"1px solid rgba(245,200,66,.3)",
                  borderRadius:4, padding:"1px 7px", letterSpacing:"0.5px" }}>
                  DEMO DATA
                </span>
              )}
            </div>
          </div>

          {/* Department stats */}
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <StatCard label="Patients"      value={stats.total}        color={T.blue}   />
            <StatCard label="ESI 1-2"       value={stats.crit}         color={T.coral}
              sub={stats.crit > 0 ? "critical / emergent" : "none critical"} />
            <StatCard label="Overdue"       value={stats.overdue}      color={stats.overdue > 0 ? T.coral : T.teal}
              sub="reassessment window" />
            <StatCard label="Avg Door-In"   value={`${stats.avgDoor}m`} color={T.purple} />
            <StatCard label="Pending Tasks" value={stats.pendingTasks}  color={T.gold}   />
          </div>
        </div>

        {/* ── Filter bar ── */}
        <div style={{ display:"flex", gap:10, marginBottom:14, flexWrap:"wrap", alignItems:"center" }}>
          {/* Search */}
          <input
            placeholder="Room, complaint, provider\u2026"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ background:T.up, border:`1px solid ${T.bd}`, borderRadius:7,
              padding:"6px 12px", color:T.txt, fontFamily:"'DM Sans',sans-serif",
              fontSize:12, outline:"none", width:220 }}
          />

          {/* ESI filter */}
          <div style={{ display:"flex", gap:4 }}>
            {[null,1,2,3,4,5].map(level => {
              const cfg  = level ? ESI[level] : null;
              const on   = filterESI === level;
              return (
                <button key={String(level)} onClick={() => setFilterESI(on ? null : level)}
                  style={{ padding:"4px 10px", borderRadius:7, border:`1px solid ${on && cfg ? cfg.color+"66" : T.bd}`,
                    background: on && cfg ? cfg.bg : "transparent",
                    color: on && cfg ? cfg.color : T.txt4,
                    fontFamily:"'JetBrains Mono',monospace", fontSize:10,
                    fontWeight: on ? 700 : 400, cursor:"pointer", transition:"all .12s" }}>
                  {level === null ? "All" : `ESI ${level}`}
                </button>
              );
            })}
          </div>

          {/* Disposition filter */}
          <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
            {[null,"pending","admit","discharge"].map(disp => {
              const cfg = disp ? DISP[disp] : null;
              const on  = filterDisp === disp;
              return (
                <button key={String(disp)} onClick={() => setFilterDisp(on ? null : disp)}
                  style={{ padding:"4px 10px", borderRadius:7, border:`1px solid ${on && cfg ? cfg.color+"55" : T.bd}`,
                    background: on && cfg ? cfg.bg : "transparent",
                    color: on && cfg ? cfg.color : T.txt4,
                    fontFamily:"'DM Sans',sans-serif", fontSize:10,
                    fontWeight: on ? 600 : 400, cursor:"pointer", transition:"all .12s" }}>
                  {disp === null ? "All disp." : (DISP[disp]?.label || disp)}
                </button>
              );
            })}
          </div>

          {/* Provider filter */}
          {providers.length > 1 && (
            <div style={{ position:"relative" }}>
              <select value={filterProv || ""} onChange={e => setFilterProv(e.target.value || null)}
                style={{ background:T.up, border:`1px solid ${T.bd}`, borderRadius:7,
                  padding:"6px 24px 6px 10px", color: filterProv ? T.blue : T.txt4,
                  fontFamily:"'DM Sans',sans-serif", fontSize:11, outline:"none",
                  appearance:"none", WebkitAppearance:"none", cursor:"pointer" }}>
                <option value="">All providers</option>
                {providers.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <span style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)",
                color:T.txt4, fontSize:9, pointerEvents:"none" }}>\u25be</span>
            </div>
          )}

          {/* Sort */}
          <div style={{ marginLeft:"auto", display:"flex", gap:4, alignItems:"center" }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4,
              letterSpacing:"1px", textTransform:"uppercase", marginRight:4 }}>Sort:</span>
            <SortBtn id="acuity"   label="Acuity"   />
            <SortBtn id="time"     label="Time"      />
            <SortBtn id="room"     label="Room"      />
            <SortBtn id="reassess" label="Reassess"  />
          </div>
        </div>

        {/* ── Column headers ── */}
        <div style={{ display:"grid", gridTemplateColumns:"28px 36px 50px 32px 1fr 90px 70px 80px 64px 52px", gap:0,
          padding:"5px 12px", marginBottom:4,
          fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4,
          letterSpacing:"1px", textTransform:"uppercase", borderBottom:`1px solid ${T.bd}` }}>
          <div />
          <div>ESI</div>
          <div>Room</div>
          <div />
          <div>Chief Complaint</div>
          <div>Provider</div>
          <div style={{ textAlign:"center" }}>Reassess</div>
          <div style={{ textAlign:"center" }}>Tasks</div>
          <div style={{ textAlign:"center" }}>Disp.</div>
          <div style={{ textAlign:"center" }}>Time</div>
        </div>

        {/* ── Patient rows ── */}
        {filtered.length === 0 && (
          <div style={{ padding:"40px 20px", textAlign:"center", color:T.txt4,
            fontFamily:"'DM Sans',sans-serif", fontSize:13 }}>
            No patients match the current filters
          </div>
        )}

        <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
          {filtered.map(pt => {
            const esiCfg    = ESI[pt.esiLevel] || ESI[5];
            const isFlagged = flagged.has(pt.id);
            const isTaskOpen = expandedTasks.has(pt.id);
            const elapsed   = elapsedMin(pt.lastAssessedAt);
            const window    = esiCfg.windowMin;
            const overdue   = elapsed !== null && elapsed >= window;
            const si        = shockIndex(pt.vitals);
            const siAlert   = si !== null && si >= 0.9;
            const doorMin   = elapsedMin(pt.doorTime);

            return (
              <div
                key={pt.id}
                onClick={() => onSelectPatient?.(pt.id)}
                style={{
                  display:"grid",
                  gridTemplateColumns:"28px 36px 50px 32px 1fr 90px 70px 80px 64px 52px",
                  gap:0, alignItems:"center",
                  padding:"9px 12px", borderRadius:9,
                  background: isFlagged ? "rgba(245,200,66,.06)" : overdue ? "rgba(255,107,107,.05)" : T.card,
                  border:`1px solid ${isFlagged ? "rgba(245,200,66,.25)" : overdue ? "rgba(255,107,107,.2)" : T.bd}`,
                  borderLeft:`3px solid ${esiCfg.color}`,
                  cursor: onSelectPatient ? "pointer" : "default",
                  transition:"background .15s, border-color .15s",
                }}
                onMouseEnter={e => { if (onSelectPatient) e.currentTarget.style.background = isFlagged ? "rgba(245,200,66,.1)" : "rgba(14,37,68,.9)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = isFlagged ? "rgba(245,200,66,.06)" : overdue ? "rgba(255,107,107,.05)" : T.card; }}
              >
                {/* Flag column */}
                <button
                  onClick={e => toggleFlag(pt.id, e)}
                  title={isFlagged ? "Remove huddle flag" : "Flag for huddle discussion"}
                  style={{ background:"none", border:"none", cursor:"pointer", fontSize:14,
                    color: isFlagged ? T.gold : T.txt4, padding:"1px 2px",
                    opacity: isFlagged ? 1 : 0.35, transition:"all .12s" }}>
                  \u2691
                </button>

                {/* ESI badge */}
                <div>
                  <ESIBadge level={pt.esiLevel} />
                </div>

                {/* Room */}
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700,
                  color:T.txt, paddingLeft:6 }}>
                  {pt.room}
                </div>

                {/* Age/sex compact */}
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4,
                  lineHeight:1.4, paddingLeft:4 }}>
                  <div>{pt.demo?.age}y</div>
                  <div>{pt.demo?.sex}</div>
                </div>

                {/* CC + alert chips */}
                <div style={{ paddingLeft:8, paddingRight:10, overflow:"hidden" }}>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt,
                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginBottom:3 }}>
                    {pt.cc?.text || "\u2014"}
                  </div>
                  <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                    {siAlert && (
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                        color:T.coral, background:"rgba(255,107,107,.12)", border:"1px solid rgba(255,107,107,.3)",
                        borderRadius:3, padding:"1px 5px", letterSpacing:"0.5px" }}>
                        SI {si?.toFixed(2)}
                      </span>
                    )}
                    {pt.vitals?.spo2 && parseFloat(pt.vitals.spo2) < 94 && (
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                        color:T.coral, background:"rgba(255,107,107,.12)", border:"1px solid rgba(255,107,107,.3)",
                        borderRadius:3, padding:"1px 5px", letterSpacing:"0.5px" }}>
                        SpO2 {pt.vitals.spo2}%
                      </span>
                    )}
                    {overdue && (
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                        color:T.coral, background:"rgba(255,107,107,.12)", border:"1px solid rgba(255,107,107,.3)",
                        borderRadius:3, padding:"1px 5px", letterSpacing:"0.5px" }}>
                        REASSESS
                      </span>
                    )}
                  </div>
                </div>

                {/* Provider */}
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt3,
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                  paddingRight:8 }}>
                  {pt.provider || "\u2014"}
                </div>

                {/* Reassessment clock */}
                <div style={{ display:"flex", justifyContent:"center" }}>
                  <ReassessmentClock lastAssessedAt={pt.lastAssessedAt} windowMin={window} />
                </div>

                {/* Pending tasks */}
                <div style={{ display:"flex", justifyContent:"center" }}>
                  <TasksChip
                    tasks={pt.pendingTasks}
                    expanded={isTaskOpen}
                    onToggle={() => toggleTasks(pt.id)}
                  />
                </div>

                {/* Disposition */}
                <div style={{ display:"flex", justifyContent:"center" }}>
                  <DispositionChip disposition={pt.disposition} />
                </div>

                {/* Time in dept */}
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:13, fontWeight:700,
                    color: doorMin && doorMin > 240 ? T.coral : doorMin && doorMin > 120 ? T.gold : T.txt3,
                    lineHeight:1 }}>
                    {fmtMin(doorMin)}
                  </div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7, color:T.txt4,
                    textTransform:"uppercase", letterSpacing:"0.5px", marginTop:2 }}>
                    in dept
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Legend ── */}
        <div style={{ marginTop:20, padding:"10px 14px", borderRadius:9, background:T.panel,
          border:`1px solid ${T.bd}`, display:"flex", gap:20, flexWrap:"wrap",
          fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4, letterSpacing:"0.5px" }}>
          <span style={{ color:T.teal }}>\u25ae</span> Within window
          <span style={{ color:T.gold }}>\u25ae</span> \u226575% of window
          <span style={{ color:T.coral }}>\u25ae</span> Overdue
          <span style={{ color:T.gold, marginLeft:8 }}>\u2691</span> Flagged for huddle
          <span style={{ marginLeft:8 }}>SI = shock index (HR/SBP)</span>
          <span style={{ marginLeft:8 }}>Clocks refresh every 30s</span>
        </div>
      </div>
    </div>
  );
}