import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { base44 } from "@/api/base44Client";

const Patient = base44.entities.Patient;
const ClinicalResult = base44.entities.ClinicalResult;
const Order = base44.entities.Order;
const ClinicalNote = base44.entities.ClinicalNote;
const DispositionRecord = base44.entities.DispositionRecord;
const InvokeLLM = (params) => base44.integrations.Core.InvokeLLM(params);

const PREFIX = "cmd";

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
    ::-webkit-scrollbar { width:3px; } ::-webkit-scrollbar-track { background:transparent; }
    ::-webkit-scrollbar-thumb { background:rgba(42,79,122,.5); border-radius:2px; }
    @keyframes ${PREFIX}fade  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    @keyframes ${PREFIX}shim  { 0%,100%{background-position:-200% center} 50%{background-position:200% center} }
    @keyframes ${PREFIX}pulse { 0%,100%{opacity:1} 50%{opacity:.25} }
    @keyframes ${PREFIX}ring  { 0%,100%{box-shadow:0 0 0 0 rgba(255,68,68,.5)} 70%{box-shadow:0 0 0 10px rgba(255,68,68,0)} }
    @keyframes ${PREFIX}orb0  { 0%,100%{transform:translate(-50%,-50%) scale(1)}    50%{transform:translate(-50%,-50%) scale(1.1)} }
    @keyframes ${PREFIX}orb1  { 0%,100%{transform:translate(-50%,-50%) scale(1.07)} 50%{transform:translate(-50%,-50%) scale(.92)} }
    @keyframes ${PREFIX}orb2  { 0%,100%{transform:translate(-50%,-50%) scale(.95)}  50%{transform:translate(-50%,-50%) scale(1.09)} }
    @keyframes ${PREFIX}think { 0%{opacity:.3;transform:scale(.9)} 50%{opacity:1;transform:scale(1)} 100%{opacity:.3;transform:scale(.9)} }
    .${PREFIX}-fade  { animation:${PREFIX}fade  .22s ease both; }
    .${PREFIX}-pulse { animation:${PREFIX}pulse 1.8s ease-in-out infinite; }
    .${PREFIX}-ring  { animation:${PREFIX}ring  2s ease-out infinite; }
    .${PREFIX}-think { animation:${PREFIX}think 1.2s ease-in-out infinite; }
    .${PREFIX}-shim  {
      background:linear-gradient(90deg,#f2f7ff 0%,#fff 20%,#00e5c0 45%,#3b9eff 70%,#f2f7ff 100%);
      background-size:250% auto; -webkit-background-clip:text;
      -webkit-text-fill-color:transparent; background-clip:text;
      animation:${PREFIX}shim 5s linear infinite;
    }
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

// ── HUB REGISTRY ─────────────────────────────────────────────────────
const HUB_DEFS = [
  { id:"narrative",    name:"Narrative Engine",    icon:"🧠", color:T.purple, base:1, triggers:[]              },
  { id:"ecg",          name:"ECGHub",               icon:"🩺", color:T.gold,   base:0, triggers:["chest pain","palpitation","syncope","stemi","arrhythmia","tachycardia","bradycardia"] },
  { id:"resus",        name:"ResusHub",             icon:"🫀", color:T.red,    base:0, triggers:["cardiac arrest","code","vf","pea","resus","shock"]                                     },
  { id:"airway",       name:"AirwayHub",            icon:"🌬", color:T.blue,   base:0, triggers:["intubation","airway","rsi","respiratory","shortness of breath","hypoxia","stridor"]   },
  { id:"sepsis",       name:"SepsisHub",            icon:"🩸", color:T.orange, base:0, triggers:["sepsis","infection","fever","pneumonia","uti","bacteremia","cellulitis"]              },
  { id:"dosing",       name:"Smart Dosing",         icon:"💊", color:T.green,  base:0, triggers:["renal failure","dialysis","aki","ckd","overdose","dosing"]                            },
  { id:"ddx",          name:"DDx Engine",           icon:"🔍", color:T.purple, base:0, triggers:["altered mental","weakness","headache","abdominal pain","back pain","dizziness","fall"] },
  { id:"psych",        name:"PsychHub",             icon:"💭", color:T.purple, base:0, triggers:["agitation","psychiatric","suicidal","intoxication","alcohol","etoh","anxiet"]        },
  { id:"antidote",     name:"AntidoteHub",          icon:"🧪", color:T.teal,   base:0, triggers:["overdose","toxin","poisoning","ingestion","toxic","antidote"]                        },
  { id:"critical",     name:"Critical Inbox",       icon:"🚨", color:T.red,    base:1, triggers:[]              },
  { id:"tracking",     name:"Tracking Board",       icon:"📋", color:T.teal,   base:1, triggers:[]              },
  { id:"disposition",  name:"Disposition Board",    icon:"🚪", color:T.blue,   base:1, triggers:[]              },
  { id:"resustimer",   name:"Resus Timer",          icon:"⏱",  color:T.red,    base:0, triggers:["cardiac arrest","code","resus"] },
];

// ── CONVERGENCE CONFIG ────────────────────────────────────────────────
const CONV = {
  complete:   { label:"DONE",       color:T.teal,   icon:"✓" },
  converging: { label:"ON TRACK",   color:T.green,  icon:"→" },
  developing: { label:"DEVELOPING", color:T.gold,   icon:"◎" },
  fragmented: { label:"FRAGMENTED", color:T.red,    icon:"⚡" },
};

// ── ATTENTION TYPES ───────────────────────────────────────────────────
const ATTN = {
  critical: { color:T.red,    urgency:0 },
  break:    { color:T.orange, urgency:1 },
  stat:     { color:T.gold,   urgency:2 },
  note:     { color:T.purple, urgency:2 },
  boarding: { color:T.orange, urgency:3 },
  elos:     { color:T.txt4,   urgency:4 },
};

// ── HELPERS ───────────────────────────────────────────────────────────
function minsAgo(iso, now = Date.now()) {
  if (!iso) return null;
  return Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
}

function fmtElapsed(mins) {
  if (mins === null || mins === undefined) return "—";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60); const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function fmtTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
}

function computeConvergence(patient, orders, results, notes, dispos) {
  const note   = notes.find(n => n.patient === patient.id);
  const dispo  = dispos.find(d => d.patient === patient.id);
  const ptOrds = orders.filter(o => o.patient === patient.id);
  const ptRes  = results.filter(r => r.patient === patient.id);
  const mins   = minsAgo(patient.arrived_at);
  if (dispo?.dispo_status === "complete" || dispo?.dispo_status === "ready") return "complete";
  if (ptRes.some(r => r.flag === "critical" && !r.acknowledged)) return "fragmented";
  if (!note?.assessment && mins > 120) return "fragmented";
  if (ptOrds.some(o => o.status === "pending" && o.urgency === "stat")) return "developing";
  if (!note?.assessment) return "developing";
  if (note?.signed) return "converging";
  return "developing";
}

function computeAttentionItems(patients, orders, results, notes, dispos, now) {
  const items = [];

  patients.forEach(patient => {
    const ptOrds = orders.filter(o => o.patient === patient.id);
    const ptRes  = results.filter(r => r.patient === patient.id);
    const note   = notes.find(n => n.patient === patient.id);
    const dispo  = dispos.find(d => d.patient === patient.id);
    const ptMins = minsAgo(patient.arrived_at, now);

    // Unacknowledged criticals
    ptRes.filter(r => r.flag === "critical" && !r.acknowledged).forEach(r => {
      const elapsed = minsAgo(r.resulted_at, now);
      items.push({
        id:`crit-${r.id}`, type:"critical",
        urgency: elapsed > 60 ? 0 : 1,
        icon:"🚨", ring: elapsed > 60,
        patient,
        label:`${r.name}: ${r.value}${r.unit ? " "+r.unit : ""}`,
        detail:`Rm ${patient.room} · ${patient.cc} · unacked ${fmtElapsed(elapsed)}`,
        elapsed, hub:"critical",
      });
    });

    // STAT orders pending > 30 min
    ptOrds.filter(o => o.status === "pending" && o.urgency === "stat").forEach(o => {
      const elapsed = minsAgo(o.created_at || patient.arrived_at, now);
      if (elapsed > 30) {
        items.push({
          id:`stat-${o.id}`, type:"stat",
          urgency: elapsed > 60 ? 1 : 2,
          icon:"⚡", ring:false,
          patient,
          label:`${o.name} — STAT pending`,
          detail:`Rm ${patient.room} · ordered ${fmtElapsed(elapsed)} ago`,
          elapsed, hub:"tracking",
        });
      }
    });

    // Unsigned note with dispo decided
    if (dispo && (!note || !note.signed)) {
      items.push({
        id:`note-${patient.id}`, type:"note",
        urgency:2, icon:"📝", ring:false,
        patient,
        label:`Unsigned note — dispo ${(dispo.dispo_type || "set").toUpperCase()}`,
        detail:`Rm ${patient.room} · ${patient.cc} · sign before discharge`,
        elapsed:null, hub:"narrative",
      });
    }

    // Boarding > 3h
    if (dispo?.boarding_start) {
      const bMins = minsAgo(dispo.boarding_start, now);
      if (bMins > 180) {
        items.push({
          id:`board-${patient.id}`, type:"boarding",
          urgency: bMins > 360 ? 0 : 3,
          icon:"🏥", ring: bMins > 360,
          patient,
          label:`Boarding ${fmtElapsed(bMins)}`,
          detail:`Rm ${patient.room} · ${dispo.destination || "awaiting bed"}`,
          elapsed:bMins, hub:"disposition",
        });
      }
    }

    // Long ED stay, no dispo
    if (ptMins > 360 && !dispo) {
      items.push({
        id:`elos-${patient.id}`, type:"elos",
        urgency:4, icon:"⏰", ring:false,
        patient,
        label:`${fmtElapsed(ptMins)} in ED — no disposition`,
        detail:`Rm ${patient.room} · ${patient.cc}`,
        elapsed:ptMins, hub:"disposition",
      });
    }
  });

  return items.sort((a, b) =>
    a.urgency !== b.urgency ? a.urgency - b.urgency : (b.elapsed || 0) - (a.elapsed || 0)
  );
}

function scoreHubs(patients, attnItems) {
  const scores = {};
  HUB_DEFS.forEach(h => { scores[h.id] = h.base; });

  patients.forEach(p => {
    const ccLow = (p.cc || "").toLowerCase();
    HUB_DEFS.forEach(h => {
      h.triggers.forEach(t => { if (ccLow.includes(t)) scores[h.id] = (scores[h.id]||0) + 2; });
    });
  });

  // Boost hubs that have attention items pointing to them
  attnItems.forEach(a => { if (a.hub) scores[a.hub] = (scores[a.hub]||0) + 1.5; });

  return HUB_DEFS
    .map(h => ({ ...h, score: scores[h.id] || 0 }))
    .sort((a, b) => b.score - a.score);
}

function buildBriefingContext(myPts, allPts, attnItems, results, orders) {
  const unackedCrits = results.filter(r => r.flag === "critical" && !r.acknowledged).length;
  const statPending  = orders.filter(o => o.status === "pending" && o.urgency === "stat").length;
  const boarding     = allPts.filter(p => p._boardingMins > 180).length;
  const ptSummaries  = myPts.slice(0, 5).map(p => `Rm ${p.room} ${p.cc} (${p._conv})`).join(", ");

  return [
    `MY PATIENTS (${myPts.length}): ${ptSummaries || "none"}`,
    `DEPT CENSUS: ${allPts.length} patients`,
    `UNACKNOWLEDGED CRITICALS: ${unackedCrits}`,
    `STAT ORDERS PENDING: ${statPending}`,
    `BOARDING >3h: ${boarding}`,
    `TOP ATTENTION ITEMS: ${attnItems.slice(0,3).map(a => a.label).join("; ") || "none"}`,
  ].join("\n");
}

// ══════════════════════════════════════════════════════════════════════
//  MODULE-SCOPE PRIMITIVES
// ══════════════════════════════════════════════════════════════════════

function AmbientBg() {
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }}>
      {[
        { l:"8%",  t:"18%", r:320, c:"rgba(0,229,192,0.045)",   a:0 },
        { l:"90%", t:"12%", r:280, c:"rgba(59,158,255,0.04)",   a:1 },
        { l:"70%", t:"78%", r:300, c:"rgba(155,109,255,0.038)", a:2 },
        { l:"20%", t:"80%", r:240, c:"rgba(245,200,66,0.035)",  a:0 },
      ].map((o,i) => (
        <div key={i} style={{
          position:"absolute", left:o.l, top:o.t, width:o.r*2, height:o.r*2, borderRadius:"50%",
          background:`radial-gradient(circle,${o.c} 0%,transparent 68%)`,
          transform:"translate(-50%,-50%)",
          animation:`${PREFIX}orb${o.a} ${8+i*1.3}s ease-in-out infinite`,
        }}/>
      ))}
    </div>
  );
}

function Toast({ msg, err }) {
  return (
    <div style={{
      position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)",
      background:"rgba(8,22,40,0.96)", borderRadius:10, padding:"10px 20px",
      border:`1px solid ${err ? T.red+"55" : T.teal+"45"}`,
      fontFamily:"DM Sans", fontWeight:600, fontSize:13,
      color:err ? T.coral : T.teal, zIndex:99999, pointerEvents:"none",
      animation:`${PREFIX}fade .2s ease both`,
    }}>{msg}</div>
  );
}

function SkeletonCard({ h = 90 }) {
  return (
    <div style={{
      ...glass, height:h, borderRadius:14,
      background:"linear-gradient(135deg,rgba(14,37,68,0.5),rgba(8,22,40,0.3))",
      animation:`${PREFIX}pulse 1.8s ease-in-out infinite`,
    }}/>
  );
}

function SectionLabel({ children, color }) {
  return (
    <div style={{
      fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700,
      color: color || T.txt4, letterSpacing:2, textTransform:"uppercase", marginBottom:8,
    }}>{children}</div>
  );
}

function ThinkDots() {
  return (
    <div style={{ display:"flex", gap:4, alignItems:"center" }}>
      {[0,1,2].map(i => (
        <div key={i} className={`${PREFIX}-think`} style={{ width:5, height:5, borderRadius:"50%", background:T.purple, animationDelay:`${i*0.2}s` }}/>
      ))}
    </div>
  );
}

// ── Convergence Chip ──────────────────────────────────────────────────
function ConvChip({ state }) {
  const c = CONV[state] || CONV.developing;
  return (
    <span style={{
      fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700,
      padding:"1px 7px", borderRadius:20,
      background:`${c.color}16`, border:`1px solid ${c.color}38`, color:c.color,
    }}>{c.icon} {c.label}</span>
  );
}

// ── Patient Mini Card ─────────────────────────────────────────────────
function PatientMiniCard({ patient, onOpen }) {
  const conv    = patient._conv || "developing";
  const cc      = CONV[conv] || CONV.developing;
  const mins    = patient._mins;
  const pendCt  = (patient._orders || []).filter(o => o.status === "pending").length;
  const critCt  = (patient._results || []).filter(r => r.flag === "critical" && !r.acknowledged).length;

  return (
    <div onClick={onOpen} className={`${PREFIX}-fade`} style={{
      ...glass, padding:"10px 12px", cursor:"pointer",
      border:"1px solid rgba(42,79,122,0.3)",
      borderLeft:`3px solid ${cc.color}`,
      background: conv === "fragmented"
        ? `linear-gradient(135deg,${T.red}0b,rgba(8,22,40,0.82))`
        : "rgba(8,22,40,0.78)",
      transition:"transform .15s, box-shadow .15s",
    }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8, marginBottom:5 }}>
        <div style={{ display:"flex", alignItems:"baseline", gap:7 }}>
          <span style={{ fontFamily:"JetBrains Mono", fontWeight:700, fontSize:20, color:cc.color, lineHeight:1 }}>
            {patient.room}
          </span>
          <div>
            <div style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:12, color:T.txt, lineHeight:1.2 }}>
              {patient.cc}
            </div>
            <div style={{ fontFamily:"DM Sans", fontSize:9, color:T.txt4, marginTop:1 }}>
              {patient.age}{patient.sex} · {fmtElapsed(mins)} ago
            </div>
          </div>
        </div>
        <ConvChip state={conv}/>
      </div>

      {/* One-liner story if present */}
      {patient._story && (
        <div style={{ fontFamily:"DM Sans", fontSize:10, color:T.txt3, lineHeight:1.45, marginBottom:5, fontStyle:"italic" }}>
          {patient._story}
        </div>
      )}

      {/* Alert chips */}
      {(critCt > 0 || pendCt > 0) && (
        <div style={{ display:"flex", gap:4 }}>
          {critCt > 0 && (
            <span className={`${PREFIX}-pulse`} style={{
              fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700,
              padding:"2px 7px", borderRadius:20,
              background:`${T.red}12`, border:`1px solid ${T.red}30`, color:T.red,
            }}>🚨 {critCt} CRIT</span>
          )}
          {pendCt > 0 && (
            <span style={{
              fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700,
              padding:"2px 7px", borderRadius:20,
              background:`${T.gold}0f`, border:`1px solid ${T.gold}28`, color:T.gold,
            }}>⚡ {pendCt} PENDING</span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Attention Row ─────────────────────────────────────────────────────
function AttentionRow({ item, onNavigate }) {
  const at = ATTN[item.type] || ATTN.elos;
  return (
    <div
      onClick={() => onNavigate && onNavigate(item.hub, item.patient)}
      className={`${PREFIX}-fade`}
      style={{
        display:"flex", alignItems:"flex-start", gap:10, padding:"9px 11px",
        borderRadius:10, cursor:"pointer",
        border:`1px solid ${item.ring ? at.color+"40" : "rgba(42,79,122,0.2)"}`,
        borderLeft:`3px solid ${at.color}`,
        background:`${at.color}07`,
        transition:"background .12s",
      }}
    >
      <span style={{ fontSize:13, flexShrink:0, marginTop:1 }}>{item.icon}</span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:12, color:T.txt, marginBottom:2 }}>
          {item.label}
        </div>
        <div style={{ fontFamily:"DM Sans", fontSize:10, color:T.txt4 }}>
          {item.detail}
        </div>
      </div>
      {item.elapsed !== null && item.elapsed !== undefined && (
        <div style={{
          fontFamily:"JetBrains Mono", fontWeight:700, fontSize:11,
          color:at.color, flexShrink:0, alignSelf:"center",
        }}>{fmtElapsed(item.elapsed)}</div>
      )}
      <span style={{ color:T.txt4, fontSize:10, alignSelf:"center" }}>→</span>
    </div>
  );
}

// ── Hub Pill ──────────────────────────────────────────────────────────
function HubPill({ hub, onNavigate, size }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={() => onNavigate && onNavigate(hub.id)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        fontFamily:"DM Sans", fontWeight:600,
        fontSize: size === "sm" ? 11 : 12,
        padding: size === "sm" ? "6px 11px" : "9px 14px",
        borderRadius:9, cursor:"pointer",
        border:`1px solid ${hov ? hub.color+"55" : hub.color+"25"}`,
        background: hov ? `${hub.color}14` : `${hub.color}07`,
        color: hov ? hub.color : T.txt3,
        display:"flex", alignItems:"center", gap:6,
        transition:"all .12s", width:"100%", textAlign:"left",
      }}
    >
      <span style={{ fontSize: size === "sm" ? 12 : 14 }}>{hub.icon}</span>
      <span>{hub.name}</span>
    </button>
  );
}

// ── Dept Stat Tile ────────────────────────────────────────────────────
function DeptTile({ value, label, color, pulse }) {
  return (
    <div style={{
      flex:1, padding:"10px 14px", textAlign:"center",
      borderRight:"1px solid rgba(42,79,122,0.25)",
    }}>
      <div className={pulse ? `${PREFIX}-pulse` : ""}
        style={{ fontFamily:"JetBrains Mono", fontWeight:700, fontSize:20, color, lineHeight:1 }}>{value}</div>
      <div style={{ fontFamily:"DM Sans", fontSize:9, color:T.txt4, marginTop:3, fontWeight:500 }}>{label}</div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  MAIN EXPORT
// ══════════════════════════════════════════════════════════════════════

export default function ProviderCommandCenter({ onBack, onNavigate }) {
  const [patients,  setPatients]  = useState([]);
  const [orders,    setOrders]    = useState([]);
  const [results,   setResults]   = useState([]);
  const [notes,     setNotes]     = useState([]);
  const [dispos,    setDispos]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [now,       setNow]       = useState(Date.now());
  const [lastFetch, setLastFetch] = useState(null);
  const [provider,  setProvider]  = useState("");
  const [briefing,  setBriefing]  = useState({ status:"idle", text:"" });
  const [toast,     setToast]     = useState({ msg:"", err:false });
  const [hubsOpen,  setHubsOpen]  = useState(false);
  const briefingDone = useRef(false);

  function showToast(msg, err = false) {
    setToast({ msg, err });
    setTimeout(() => setToast({ msg:"", err:false }), 2400);
  }

  // ── Live clock ────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);

  // ── Data fetch ────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      const [pts, ords, res, nts, dps] = await Promise.all([
        Patient.list(), Order.list(), ClinicalResult.list(),
        ClinicalNote.list(), DispositionRecord.list(),
      ]);
      setPatients(pts || []);
      setOrders(ords || []);
      setResults(res || []);
      setNotes(nts || []);
      setDispos(dps || []);
      setLastFetch(new Date());
    } catch {
      showToast("Error loading data", true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const t = setInterval(fetchAll, 30000);
    return () => clearInterval(t);
  }, [fetchAll]);

  // ── Default provider ──────────────────────────────────────────────
  useEffect(() => {
    if (!provider && patients.length > 0 && patients[0].provider) {
      setProvider(patients[0].provider);
    }
  }, [patients, provider]);

  // ── Enriched patients ─────────────────────────────────────────────
  const enriched = useMemo(() =>
    patients.map(p => ({
      ...p,
      _mins:    minsAgo(p.arrived_at, now),
      _conv:    computeConvergence(p, orders, results, notes, dispos),
      _orders:  orders.filter(o => o.patient === p.id),
      _results: results.filter(r => r.patient === p.id),
      _note:    notes.find(n => n.patient === p.id),
      _dispo:   dispos.find(d => d.patient === p.id),
      _boardingMins: (() => {
        const d = dispos.find(dd => dd.patient === p.id);
        return d?.boarding_start ? minsAgo(d.boarding_start, now) : 0;
      })(),
    })),
  [patients, orders, results, notes, dispos, now]);

  const myPatients = useMemo(() => {
    const rank = { fragmented:0, developing:1, converging:2, complete:3 };
    return enriched
      .filter(p => p.provider === provider)
      .sort((a, b) => (rank[a._conv] ?? 2) - (rank[b._conv] ?? 2));
  }, [enriched, provider]);

  const attnItems = useMemo(() =>
    computeAttentionItems(myPatients, orders, results, notes, dispos, now),
  [myPatients, orders, results, notes, dispos, now]);

  const topHubs = useMemo(() => scoreHubs(myPatients, attnItems), [myPatients, attnItems]);

  // ── AI Shift Briefing (once per session after data loads) ─────────
  useEffect(() => {
    if (loading || briefingDone.current || myPatients.length === 0) return;
    briefingDone.current = true;

    const ctx = buildBriefingContext(myPatients, enriched, attnItems, results, orders);

    setBriefing({ status:"loading", text:"" });

    InvokeLLM({
      prompt: `You are a senior charge nurse giving a 20-second verbal shift briefing to an ED attending.

DATA:
${ctx}

Respond in exactly 2-3 sentences. Be direct and clinical. Start with the most urgent issue. Mention specific room numbers and values where relevant. Do not introduce yourself. Do not use bullet points.`,
      add_context_from_previous_calls: false,
    }).then(raw => {
      const text = typeof raw === "string" ? raw : raw?.content || "";
      setBriefing({ status:"done", text: text.trim() });
    }).catch(() => {
      setBriefing({ status:"error", text:"" });
    });
  }, [loading, myPatients.length]);

  // ── Dept stats ────────────────────────────────────────────────────
  const deptStats = useMemo(() => ({
    total:      enriched.length,
    criticals:  results.filter(r => r.flag === "critical" && !r.acknowledged).length,
    boarding:   enriched.filter(p => p._boardingMins > 180).length,
    fragmented: enriched.filter(p => p._conv === "fragmented").length,
  }), [enriched, results]);

  const PROVIDERS = useMemo(() =>
    [...new Set(patients.map(p => p.provider).filter(Boolean))].sort(),
  [patients]);

  const clockStr = new Date(now).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
  const dateStr  = new Date(now).toLocaleDateString([], { weekday:"short", month:"short", day:"numeric" });

  return (
    <div style={{
      background:T.bg, minHeight:"100vh", color:T.txt,
      fontFamily:"DM Sans, sans-serif", overflowX:"hidden", position:"relative",
    }}>
      <AmbientBg/>
      {toast.msg && <Toast msg={toast.msg} err={toast.err}/>}

      <div style={{ position:"relative", zIndex:1, maxWidth:1440, margin:"0 auto", padding:"0 16px" }}>

        {/* ── TOP HEADER STRIP ─────────────────────────────────── */}
        <div style={{
          ...glass, padding:"10px 16px", margin:"14px 0 12px",
          borderRadius:12, display:"flex", alignItems:"center",
          justifyContent:"space-between", flexWrap:"wrap", gap:10,
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            {/* Notrya wordmark */}
            <div style={{
              fontFamily:"JetBrains Mono", fontSize:11, fontWeight:700,
              letterSpacing:3, color:T.gold,
            }}>NOTRYA</div>
            <div style={{ width:1, height:20, background:"rgba(42,79,122,0.5)" }}/>
            {/* Provider name */}
            <div style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:14, color:T.txt }}>
              {provider || "Select Provider"}
            </div>
            {/* Provider switcher */}
            <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
              {PROVIDERS.map(pv => (
                <button key={pv} onClick={() => { setProvider(pv); briefingDone.current = false; }} style={{
                  fontFamily:"DM Sans", fontWeight:600, fontSize:10,
                  padding:"3px 9px", borderRadius:20, cursor:"pointer",
                  border:`1px solid ${provider===pv ? T.blue+"55" : "rgba(42,79,122,0.35)"}`,
                  background: provider===pv ? `${T.blue}12` : "transparent",
                  color: provider===pv ? T.blue : T.txt4, transition:"all .1s",
                }}>{pv}</button>
              ))}
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontFamily:"JetBrains Mono", fontWeight:700, fontSize:16, color:T.txt, lineHeight:1 }}>
                {clockStr}
              </div>
              <div style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4, marginTop:1 }}>{dateStr}</div>
            </div>
            {lastFetch && (
              <div style={{ fontFamily:"JetBrains Mono", fontSize:8, color:T.txt4, letterSpacing:.5 }}>
                ● {lastFetch.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit", second:"2-digit" })}
              </div>
            )}
            {onBack && (
              <button onClick={onBack} style={{
                fontFamily:"DM Sans", fontSize:11, fontWeight:600,
                padding:"5px 12px", borderRadius:8, cursor:"pointer",
                border:"1px solid rgba(42,79,122,0.5)",
                background:"rgba(14,37,68,0.6)", color:T.txt3,
              }}>← Home</button>
            )}
          </div>
        </div>

        {/* ── AI SHIFT BRIEFING BANNER ─────────────────────────── */}
        {briefing.status !== "idle" && (
          <div className={`${PREFIX}-fade`} style={{
            ...glass, padding:"11px 16px", marginBottom:12,
            border:"1px solid rgba(155,109,255,0.28)",
            borderLeft:`3px solid ${T.purple}`,
            background:`${T.purple}07`,
            display:"flex", alignItems:"flex-start", gap:10,
          }}>
            <div style={{
              fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700,
              color:T.purple, letterSpacing:1.5, textTransform:"uppercase",
              marginTop:1, flexShrink:0,
            }}>AI BRIEFING</div>
            {briefing.status === "loading" ? (
              <div style={{ display:"flex", alignItems:"center", gap:8, paddingTop:2 }}>
                <ThinkDots/>
                <span style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt4 }}>Synthesizing your shift...</span>
              </div>
            ) : briefing.status === "done" ? (
              <p style={{ fontFamily:"DM Sans", fontSize:13, color:T.txt, lineHeight:1.65 }}>
                {briefing.text}
              </p>
            ) : null}
          </div>
        )}

        {/* ── THREE-COLUMN MAIN LAYOUT ─────────────────────────── */}
        <div style={{
          display:"grid",
          gridTemplateColumns:"1fr 1.35fr .85fr",
          gap:12, alignItems:"start",
        }}>

          {/* ── LEFT: MY PATIENTS ───────────────────────────────── */}
          <div>
            <div style={{ ...glass, padding:"12px 14px 8px", marginBottom:10 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                <SectionLabel color={T.teal}>My Patients ({loading ? "…" : myPatients.length})</SectionLabel>
                <span style={{
                  fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700,
                  padding:"2px 8px", borderRadius:20,
                  background:`${T.teal}0e`, border:`1px solid ${T.teal}28`, color:T.teal,
                }}>{provider || "—"}</span>
              </div>

              {/* Convergence legend */}
              <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:8 }}>
                {Object.entries(CONV).map(([k, v]) => {
                  const ct = myPatients.filter(p => p._conv === k).length;
                  if (!ct) return null;
                  return (
                    <span key={k} style={{
                      fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700,
                      padding:"1px 7px", borderRadius:20,
                      background:`${v.color}12`, border:`1px solid ${v.color}30`, color:v.color,
                    }}>{v.icon} {ct}</span>
                  );
                })}
              </div>
            </div>

            {/* Patient cards */}
            <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
              {loading && [...Array(4)].map((_, i) => <SkeletonCard key={i} h={90}/>)}
              {!loading && myPatients.length === 0 && (
                <div style={{
                  ...glass, padding:"28px", textAlign:"center",
                  display:"flex", flexDirection:"column", alignItems:"center", gap:8,
                }}>
                  <span style={{ fontSize:24 }}>🏥</span>
                  <span style={{ fontFamily:"DM Sans", fontSize:13, color:T.txt3 }}>
                    No patients assigned to {provider || "this provider"}
                  </span>
                </div>
              )}
              {!loading && myPatients.map(p => (
                <PatientMiniCard
                  key={p.id}
                  patient={p}
                  onOpen={() => onNavigate && onNavigate("narrative", p)}
                />
              ))}
            </div>

            {/* Dept all-patients summary (collapsed) */}
            {!loading && enriched.length > 0 && (
              <div style={{ ...glass, padding:"10px 12px", marginTop:10, background:"rgba(8,22,40,0.5)" }}>
                <div style={{
                  fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700,
                  color:T.txt4, letterSpacing:1.5, textTransform:"uppercase", marginBottom:6,
                }}>All Patients ({enriched.length})</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                  {enriched.map(p => {
                    const c = CONV[p._conv] || CONV.developing;
                    return (
                      <span
                        key={p.id}
                        onClick={() => onNavigate && onNavigate("tracking", p)}
                        style={{
                          fontFamily:"JetBrains Mono", fontWeight:700, fontSize:10,
                          padding:"2px 8px", borderRadius:6, cursor:"pointer",
                          border:`1px solid ${c.color}30`,
                          background:`${c.color}0d`,
                          color:c.color,
                        }}>{p.room}</span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── CENTER: ATTENTION QUEUE ──────────────────────────── */}
          <div>
            <div style={{ ...glass, padding:"12px 14px 8px", marginBottom:10 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <SectionLabel color={attnItems.length > 0 ? T.red : T.teal}>
                  Attention Queue
                  {attnItems.length > 0 && (
                    <span style={{
                      marginLeft:8, fontFamily:"JetBrains Mono", fontWeight:700,
                      fontSize:9, padding:"1px 7px", borderRadius:20,
                      background:`${T.red}14`, color:T.red, border:`1px solid ${T.red}30`,
                    }}>{attnItems.length}</span>
                  )}
                </SectionLabel>
                {attnItems.some(a => a.ring) && (
                  <span className={`${PREFIX}-pulse`} style={{ fontSize:12 }}>🚨</span>
                )}
              </div>
              {attnItems.length === 0 && !loading && (
                <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt4, fontStyle:"italic", marginBottom:4 }}>
                  All clear — no pending actions
                </div>
              )}
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {loading && [...Array(5)].map((_, i) => <SkeletonCard key={i} h={62}/>)}

              {!loading && attnItems.length === 0 && (
                <div style={{
                  ...glass, padding:"32px", textAlign:"center",
                  display:"flex", flexDirection:"column", alignItems:"center", gap:10,
                }}>
                  <span style={{ fontSize:30 }}>✅</span>
                  <div style={{ fontFamily:"DM Sans", fontSize:14, fontWeight:700, color:T.green }}>
                    All clear
                  </div>
                  <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt4 }}>
                    No pending criticals, no overdue orders, no unsigned notes
                  </div>
                </div>
              )}

              {!loading && attnItems.map(item => (
                <AttentionRow
                  key={item.id}
                  item={item}
                  onNavigate={onNavigate}
                />
              ))}
            </div>

            {/* Quick action row */}
            {!loading && (
              <div style={{
                ...glass, padding:"10px 12px", marginTop:10,
                display:"flex", gap:7, flexWrap:"wrap",
              }}>
                <SectionLabel color={T.txt4}>Quick Actions</SectionLabel>
                {[
                  { icon:"🚨", label:"Critical Inbox",    hub:"critical"     },
                  { icon:"🚪", label:"Disposition Board", hub:"disposition"  },
                  { icon:"📋", label:"Tracking Board",    hub:"tracking"     },
                  { icon:"⏱",  label:"Resus Timer",       hub:"resustimer"  },
                ].map(a => (
                  <button key={a.hub} onClick={() => onNavigate && onNavigate(a.hub)} style={{
                    fontFamily:"DM Sans", fontWeight:600, fontSize:10,
                    padding:"5px 10px", borderRadius:8, cursor:"pointer",
                    border:"1px solid rgba(42,79,122,0.38)", background:"rgba(14,37,68,0.5)",
                    color:T.txt3, display:"flex", alignItems:"center", gap:5,
                    transition:"all .1s",
                  }}>{a.icon} {a.label}</button>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: HUB LAUNCHER ──────────────────────────────── */}
          <div>
            <div style={{ ...glass, padding:"12px 14px 8px", marginBottom:10 }}>
              <SectionLabel color={T.purple}>
                Smart Hub Launcher
              </SectionLabel>
              <div style={{ fontFamily:"DM Sans", fontSize:9, color:T.txt4, marginBottom:4 }}>
                Ranked for your current patient mix
              </div>
            </div>

            {/* Top 5 hubs */}
            <div style={{ display:"flex", flexDirection:"column", gap:5, marginBottom:10 }}>
              {loading
                ? [...Array(5)].map((_, i) => <SkeletonCard key={i} h={38}/>)
                : topHubs.slice(0, 5).map(h => (
                  <HubPill key={h.id} hub={h} onNavigate={onNavigate}/>
                ))
              }
            </div>

            {/* Show all toggle */}
            <button onClick={() => setHubsOpen(p => !p)} style={{
              width:"100%", fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700,
              padding:"8px", borderRadius:8, cursor:"pointer", letterSpacing:1.5,
              border:"1px solid rgba(42,79,122,0.35)", background:"transparent",
              color:T.txt4, textTransform:"uppercase", marginBottom: hubsOpen ? 8 : 0,
            }}>{hubsOpen ? "▲ Fewer" : "▼ All Hubs"}</button>

            {hubsOpen && (
              <div className={`${PREFIX}-fade`} style={{ display:"flex", flexDirection:"column", gap:4 }}>
                {topHubs.slice(5).map(h => (
                  <HubPill key={h.id} hub={h} onNavigate={onNavigate} size="sm"/>
                ))}
              </div>
            )}

            {/* Narrative Engine CTA */}
            <div style={{
              ...glass, padding:"12px 13px", marginTop:12,
              border:"1px solid rgba(155,109,255,0.25)",
              borderLeft:`3px solid ${T.purple}`,
              background:`${T.purple}07`,
            }}>
              <div style={{
                fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700,
                color:T.purple, letterSpacing:1.5, textTransform:"uppercase", marginBottom:6,
              }}>Narrative Engine</div>
              <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt3, marginBottom:10, lineHeight:1.55 }}>
                {myPatients.length > 0
                  ? `${myPatients.filter(p => p._conv === "fragmented").length} fragmented stories need attention`
                  : "Living clinical stories for every patient"}
              </div>
              <button onClick={() => onNavigate && onNavigate("narrative")} style={{
                width:"100%", fontFamily:"DM Sans", fontWeight:700, fontSize:11,
                padding:"8px", borderRadius:8, cursor:"pointer",
                border:`1px solid ${T.purple}40`, background:`${T.purple}10`, color:T.purple,
              }}>🧠 Open Narrative Engine →</button>
            </div>
          </div>

        </div>

        {/* ── DEPARTMENT PULSE STRIP ───────────────────────────── */}
        <div style={{
          ...glass, marginTop:12, marginBottom:20,
          borderRadius:12, overflow:"hidden",
          display:"flex", alignItems:"stretch",
        }}>
          <div style={{
            padding:"10px 16px", display:"flex", alignItems:"center", gap:6,
            borderRight:"1px solid rgba(42,79,122,0.25)", flexShrink:0,
          }}>
            <span className={`${PREFIX}-pulse`} style={{ display:"inline-block", width:6, height:6, borderRadius:"50%", background:T.teal }}/>
            <span style={{ fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700, color:T.txt4, letterSpacing:2, textTransform:"uppercase" }}>
              Dept Pulse
            </span>
          </div>
          <div style={{ display:"flex", flex:1 }}>
            <DeptTile value={loading ? "—" : deptStats.total}      label="Total Census"     color={T.teal}                                               />
            <DeptTile value={loading ? "—" : deptStats.criticals}  label="Unacked Criticals" color={deptStats.criticals > 0 ? T.red : T.teal}   pulse={deptStats.criticals > 0} />
            <DeptTile value={loading ? "—" : deptStats.boarding}   label="Boarding >3h"     color={deptStats.boarding > 0 ? T.orange : T.teal}          />
            <DeptTile value={loading ? "—" : deptStats.fragmented} label="Fragmented Stories" color={deptStats.fragmented > 0 ? T.red : T.teal} pulse={deptStats.fragmented > 0} />
            <div style={{ padding:"10px 14px", textAlign:"center", flex:1 }}>
              <div style={{ fontFamily:"JetBrains Mono", fontWeight:700, fontSize:13, color:T.txt3, lineHeight:1 }}>
                {myPatients.length}/{enriched.length}
              </div>
              <div style={{ fontFamily:"DM Sans", fontSize:9, color:T.txt4, marginTop:3 }}>My / Total</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}