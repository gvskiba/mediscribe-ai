// HuddleBoard.jsx — ED Department Huddle Board v2
// Evidence-based improvements from EDIS / human-factors literature:
//   1. Role-based views (physician vs nurse) — Clark et al. 2017, Hegde et al. 2019
//   2. Workload score per patient/provider — Benda et al. 2018
//   3. Boarded patients distinguished — ACEP 2023 boarding crisis guidance
//   4. Waiting room visibility — Aronsky et al. 2008 three-view requirement
//   5. EDWIN crowding score — Badr et al. 2022 systematic review
//   6. Timestamp bias correction — amber at 60% not 75% (Gordon et al. 2008, 30m lag)
//   7. 6-column collapsed + depth-on-demand — PMC6284143 "division of attention" finding
//   8. Privacy / de-identified mode — HIPAA shared-display guidance
//   9. Joint Commission ED-1 / ED-2 metrics in stat header — JC ED measures
//
// PatientSummary shape (updated):
//   { id, room, status("waiting"|"roomed"|"boarded"), esiLevel(1-5),
//     demo:{age,sex}, cc:{text}, vitals:{hr,bp,spo2,rr,temp},
//     disposition, lastAssessedAt(ms), admitDecisionAt(ms), doorTime(ms),
//     pendingTasks:[{id,label,type}], pendingOrders:{labs,meds,imaging},
//     provider, assignedNurse, flagged }
//
// Props:
//   patients, onSelectPatient, providerFilter,
//   attendingCount(default 3), totalBays(default 20)
//
// Constraints: no form, no localStorage, no router, straight quotes only,
//   border before borderTop/etc.

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

// ── ESI config — amber threshold 60% (corrects for ~15-30m timestamp bias) ────
const ESI = {
  1: { color:"#ff3d3d", bg:"rgba(255,61,61,.18)",  label:"Immediate",   windowMin:15  },
  2: { color:"#ff9f43", bg:"rgba(255,159,67,.14)", label:"Emergent",    windowMin:30  },
  3: { color:"#f5c842", bg:"rgba(245,200,66,.12)", label:"Urgent",      windowMin:60  },
  4: { color:"#3b9eff", bg:"rgba(59,158,255,.11)", label:"Less Urgent", windowMin:120 },
  5: { color:"#82aece", bg:"rgba(130,174,206,.1)", label:"Non-Urgent",  windowMin:120 },
};

// ── Disposition config ────────────────────────────────────────────────────────
const DISP = {
  pending:  { label:"Pending",  color:T.txt4,   bg:"rgba(42,77,114,.25)"   },
  admit:    { label:"Admit",    color:T.orange, bg:"rgba(255,159,67,.12)"  },
  boarded:  { label:"Boarded",  color:T.gold,   bg:"rgba(245,200,66,.14)"  },
  obs:      { label:"Obs",      color:T.purple, bg:"rgba(155,109,255,.12)" },
  discharge:{ label:"DC",       color:T.teal,   bg:"rgba(0,229,192,.12)"   },
  transfer: { label:"Transfer", color:T.blue,   bg:"rgba(59,158,255,.12)"  },
  ama:      { label:"AMA",      color:T.coral,  bg:"rgba(255,107,107,.12)" },
  lwbs:     { label:"LWBS",     color:T.coral,  bg:"rgba(255,107,107,.08)" },
};

const TASK_COLORS = {
  result:"#3b9eff", consult:"#9b6dff", imaging:"#f5c842",
  procedure:"#ff9f43", medication:"#00e5c0", other:"#82aece",
};

// ── Mock patients (updated) ───────────────────────────────────────────────────
const NOW = Date.now();
const mins = n => NOW - n * 60000;

const MOCK_PATIENTS = [
  // ── Waiting room patients ──────────────────────────────────────────────────
  { id:"wt1", status:"waiting", room:null, esiLevel:2,
    demo:{ age:61, sex:"M" }, cc:{ text:"Chest tightness, diaphoresis" },
    vitals:{ hr:"102", bp:"158/96", spo2:"97" },
    disposition:"pending", lastAssessedAt:null, admitDecisionAt:null, doorTime:mins(18),
    pendingTasks:[], pendingOrders:{ labs:0, meds:0, imaging:0 },
    provider:null, assignedNurse:"RN Tomas", flagged:false },
  { id:"wt2", status:"waiting", room:null, esiLevel:3,
    demo:{ age:34, sex:"F" }, cc:{ text:"Lower abdominal pain" },
    vitals:{ hr:"88", bp:"122/78", spo2:"99" },
    disposition:"pending", lastAssessedAt:null, admitDecisionAt:null, doorTime:mins(47),
    pendingTasks:[], pendingOrders:{ labs:0, meds:0, imaging:0 },
    provider:null, assignedNurse:"RN Tomas", flagged:false },

  // ── Active roomed patients ─────────────────────────────────────────────────
  { id:"pt1", status:"roomed", room:"T1", esiLevel:1,
    demo:{ age:67, sex:"M" }, cc:{ text:"STEMI — chest pain, diaphoresis" },
    vitals:{ hr:"118", bp:"88/54", spo2:"94" },
    disposition:"admit", lastAssessedAt:mins(8), admitDecisionAt:null, doorTime:mins(42),
    pendingTasks:[
      { id:"t1", label:"Troponin 3h", type:"result" },
      { id:"t2", label:"Cardiology consult", type:"consult" },
      { id:"t3", label:"Heparin drip", type:"medication" },
    ],
    pendingOrders:{ labs:2, meds:3, imaging:1 },
    provider:"Dr. Reyes", assignedNurse:"RN Okafor", flagged:true },
  { id:"pt2", status:"roomed", room:"T3", esiLevel:2,
    demo:{ age:44, sex:"F" }, cc:{ text:"Thunderclap headache" },
    vitals:{ hr:"96", bp:"178/102", spo2:"99" },
    disposition:"pending", lastAssessedAt:mins(38), admitDecisionAt:null, doorTime:mins(55),
    pendingTasks:[
      { id:"t4", label:"CT Head read", type:"imaging" },
      { id:"t5", label:"Neurology callback", type:"consult" },
    ],
    pendingOrders:{ labs:1, meds:1, imaging:1 },
    provider:"Dr. Reyes", assignedNurse:"RN Park", flagged:false },
  { id:"pt3", status:"roomed", room:"5A", esiLevel:2,
    demo:{ age:29, sex:"M" }, cc:{ text:"Respiratory failure, SpO2 88%" },
    vitals:{ hr:"124", bp:"132/84", spo2:"93" },
    disposition:"obs", lastAssessedAt:mins(22), admitDecisionAt:null, doorTime:mins(78),
    pendingTasks:[{ id:"t6", label:"BiPAP reassess", type:"result" }],
    pendingOrders:{ labs:2, meds:2, imaging:0 },
    provider:"Dr. Chen", assignedNurse:"RN Okafor", flagged:false },
  { id:"pt4", status:"roomed", room:"8", esiLevel:3,
    demo:{ age:58, sex:"F" }, cc:{ text:"R flank pain, hematuria" },
    vitals:{ hr:"88", bp:"148/92", spo2:"98" },
    disposition:"pending", lastAssessedAt:mins(72), admitDecisionAt:null, doorTime:mins(110),
    pendingTasks:[
      { id:"t7", label:"CT urogram", type:"imaging" },
      { id:"t8", label:"Urology consult", type:"consult" },
    ],
    pendingOrders:{ labs:2, meds:1, imaging:1 },
    provider:"Dr. Patel", assignedNurse:"RN Tomas", flagged:false },
  { id:"pt5", status:"roomed", room:"12", esiLevel:3,
    demo:{ age:71, sex:"M" }, cc:{ text:"AMS, fever — suspected meningitis" },
    vitals:{ hr:"108", bp:"104/68", spo2:"96" },
    disposition:"admit", lastAssessedAt:mins(44), admitDecisionAt:null, doorTime:mins(92),
    pendingTasks:[
      { id:"t9",  label:"Blood cultures", type:"result" },
      { id:"t10", label:"LP result", type:"result" },
      { id:"t11", label:"Neurology", type:"consult" },
    ],
    pendingOrders:{ labs:3, meds:4, imaging:1 },
    provider:"Dr. Chen", assignedNurse:"RN Park", flagged:true },
  { id:"pt6", status:"roomed", room:"3B", esiLevel:3,
    demo:{ age:35, sex:"F" }, cc:{ text:"Abdominal pain, nausea — r/o ectopic" },
    vitals:{ hr:"92", bp:"118/76", spo2:"99" },
    disposition:"pending", lastAssessedAt:mins(55), admitDecisionAt:null, doorTime:mins(88),
    pendingTasks:[
      { id:"t12", label:"Beta-hCG", type:"result" },
      { id:"t13", label:"Pelvic US", type:"imaging" },
    ],
    pendingOrders:{ labs:2, meds:1, imaging:1 },
    provider:"Dr. Reyes", assignedNurse:"RN Martinez", flagged:false },
  { id:"pt7", status:"roomed", room:"15", esiLevel:4,
    demo:{ age:22, sex:"M" }, cc:{ text:"Ankle sprain, r/o fracture" },
    vitals:{ hr:"74", bp:"122/78", spo2:"100" },
    disposition:"discharge", lastAssessedAt:mins(95), admitDecisionAt:null, doorTime:mins(115),
    pendingTasks:[{ id:"t14", label:"X-ray read", type:"imaging" }],
    pendingOrders:{ labs:0, meds:1, imaging:1 },
    provider:"Dr. Patel", assignedNurse:"RN Martinez", flagged:false },

  // ── Boarded patients (admit decision made, awaiting inpatient bed) ─────────
  { id:"bd1", status:"boarded", room:"7", esiLevel:2,
    demo:{ age:78, sex:"F" }, cc:{ text:"NSTEMI — admitted cardiology" },
    vitals:{ hr:"84", bp:"126/78", spo2:"97" },
    disposition:"boarded", lastAssessedAt:mins(35), admitDecisionAt:mins(195), doorTime:mins(240),
    pendingTasks:[{ id:"b1", label:"Bed request active", type:"other" }],
    pendingOrders:{ labs:1, meds:2, imaging:0 },
    provider:"Dr. Reyes", assignedNurse:"RN Okafor", flagged:true },
  { id:"bd2", status:"boarded", room:"9", esiLevel:3,
    demo:{ age:55, sex:"M" }, cc:{ text:"GI bleed — admitted medicine" },
    vitals:{ hr:"96", bp:"112/70", spo2:"98" },
    disposition:"boarded", lastAssessedAt:mins(60), admitDecisionAt:mins(310), doorTime:mins(355),
    pendingTasks:[{ id:"b2", label:"Bed request active", type:"other" }],
    pendingOrders:{ labs:1, meds:2, imaging:0 },
    provider:"Dr. Chen", assignedNurse:"RN Park", flagged:false },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const elapsedMin  = ts => ts ? Math.floor((Date.now() - ts) / 60000) : null;
const fmtMin      = min => min === null ? "\u2014" : min < 60 ? `${min}m` : `${Math.floor(min/60)}h ${min%60>0?min%60+"m":""}`.trim();

// Threshold at 60% — corrects for documented 15-30m timestamp entry lag (Gordon 2008)
const clockColor  = (elapsed, windowMin) => {
  if (elapsed === null) return T.txt4;
  const pct = elapsed / windowMin;
  if (pct >= 1)    return T.coral;
  if (pct >= 0.60) return T.gold;
  return T.teal;
};

const shockIndex  = v => {
  const hr = parseFloat(v?.hr||"0"); const sbp = parseFloat((v?.bp||"").split("/")[0]||"0");
  return hr && sbp ? hr/sbp : null;
};

// Workload score: ESI + pending labs + meds + imaging (Benda et al. 2018)
const workloadScore = pt =>
  (pt.esiLevel||3) + (pt.pendingOrders?.labs||0) + (pt.pendingOrders?.meds||0) + (pt.pendingOrders?.imaging||0);

// EDWIN crowding index (Emergency Department Work Index)
// EDWIN = Σ(n_i × ESI_i) / (Na × (BT - BA))
// n_i = patients at ESI level i, Na = attendings, BT = treatment bays, BA = boarders
function computeEDWIN(patients, attendingCount, totalBays) {
  const roomed  = patients.filter(p => p.status === "roomed");
  const boarders = patients.filter(p => p.status === "boarded").length;
  const avail   = totalBays - boarders;
  if (!attendingCount || avail <= 0) return null;
  const numerator = roomed.reduce((s, p) => s + (p.esiLevel||3), 0);
  const denominator = attendingCount * avail;
  return Math.round((numerator / denominator) * 10) / 10;
}

function edwinColor(score) {
  if (score === null) return T.txt4;
  if (score >= 6)   return T.coral;
  if (score >= 4)   return T.orange;
  if (score >= 2)   return T.gold;
  return T.teal;
}

function edwinLabel(score) {
  if (score === null) return "N/A";
  if (score >= 6)   return "Severe";
  if (score >= 4)   return "Overcrowded";
  if (score >= 2)   return "Busy";
  return "Not Busy";
}

// ── Sub-components ────────────────────────────────────────────────────────────
function ESIBadge({ level }) {
  const c = ESI[level] || ESI[5];
  return (
    <div style={{ width:30, height:30, borderRadius:7, flexShrink:0,
      background:c.bg, border:`1.5px solid ${c.color}77`,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:900, color:c.color }}>
      {level}
    </div>
  );
}

function StatCard({ label, value, color, sub, small }) {
  return (
    <div style={{ padding: small ? "8px 12px" : "11px 16px", borderRadius:10, background:T.card,
      border:`1px solid ${color}28`, borderTop:`2px solid ${color}66`, minWidth: small ? 80 : 95 }}>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize: small ? 18 : 22,
        fontWeight:900, color, lineHeight:1 }}>
        {value}
      </div>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4,
        letterSpacing:"1.2px", textTransform:"uppercase", marginTop:2 }}>
        {label}
      </div>
      {sub && <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.txt4, marginTop:1 }}>{sub}</div>}
    </div>
  );
}

function BoardingClock({ admitDecisionAt }) {
  const elapsed = elapsedMin(admitDecisionAt);
  const col = elapsed === null ? T.txt4 : elapsed > 240 ? T.coral : elapsed > 120 ? T.gold : T.teal;
  return (
    <div style={{ textAlign:"center", minWidth:50 }}>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:14, fontWeight:700, color:col, lineHeight:1 }}>
        {fmtMin(elapsed)}
      </div>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7, color:col,
        letterSpacing:"0.5px", textTransform:"uppercase", marginTop:2 }}>
        BOARDING
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function HuddleBoard({
  patients: patientsProp,
  onSelectPatient,
  providerFilter = null,
  attendingCount: attendingProp = 3,
  totalBays: baysProp = 20,
}) {
  const source = (patientsProp && patientsProp.length > 0) ? patientsProp : MOCK_PATIENTS;

  // ── State ──────────────────────────────────────────────────────────────────
  const [flagged,       setFlagged]    = useState(() => new Set(source.filter(p => p.flagged).map(p => p.id)));
  const [expanded,      setExpanded]   = useState(new Set());
  const [viewMode,      setViewMode]   = useState("physician"); // "physician" | "nurse"
  const [privacyMode,   setPrivacyMode]= useState(false);
  const [search,        setSearch]     = useState("");
  const [sortBy,        setSortBy]     = useState("acuity");
  // Acuity range: null | "critical" (1-2) | "urgent" (3) | "lower" (4-5)
  const [acuityRange,   setAcuityRange]= useState(null);
  const [filterFlagged, setFilterFlagged] = useState(false);
  const [longStayAlert, setLongStayAlert] = useState(false);
  const [filterDisp,    setFilterDisp] = useState(null);
  const [filterProv,    setFilterProv] = useState(providerFilter || null);
  const [showConfig,    setShowConfig] = useState(false);
  const [attendings,    setAttendings] = useState(attendingProp);
  const [bays,          setBays]       = useState(baysProp);
  const [tick,          setTick]       = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setTick(t => t+1), 30000);
    return () => clearInterval(iv);
  }, []);

  // ── Toggle helpers ─────────────────────────────────────────────────────────
  const toggleFlag    = useCallback((id, e) => { e.stopPropagation(); setFlagged(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; }); }, []);
  const toggleExpand  = useCallback((id, e) => { e.stopPropagation(); setExpanded(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; }); }, []);

  // ── Derived data ───────────────────────────────────────────────────────────
  const providers = useMemo(() => [...new Set(source.map(p => p.provider).filter(Boolean))].sort(), [source]);

  const waiting  = useMemo(() => source.filter(p => p.status === "waiting").sort((a,b) => a.esiLevel - b.esiLevel), [source]);
  const roomed   = useMemo(() => source.filter(p => p.status === "roomed"),  [source]);
  const boarded  = useMemo(() => source.filter(p => p.status === "boarded"), [source]);

  const providerWorkloads = useMemo(() => {
    const map = {};
    source.filter(p => p.provider).forEach(p => {
      if (!map[p.provider]) map[p.provider] = { total:0, count:0 };
      map[p.provider].total += workloadScore(p);
      map[p.provider].count += 1;
    });
    return map;
  }, [source]);

  const edwinScore = useMemo(() => computeEDWIN(source, attendings, bays), [source, attendings, bays, tick]);

  // JC ED-2: median boarding time (admit decision → now) for boarded patients
  const ed2Median = useMemo(() => {
    const times = boarded.map(p => elapsedMin(p.admitDecisionAt)).filter(t => t !== null);
    if (!times.length) return null;
    const sorted = [...times].sort((a,b) => a-b);
    return sorted[Math.floor(sorted.length/2)];
  }, [boarded, tick]);

  // JC ED-1: median total ED time for boarded/admitted patients
  const ed1Median = useMemo(() => {
    const admitted = source.filter(p => p.disposition === "admit" || p.status === "boarded");
    const times = admitted.map(p => elapsedMin(p.doorTime)).filter(t => t !== null);
    if (!times.length) return null;
    const sorted = [...times].sort((a,b) => a-b);
    return sorted[Math.floor(sorted.length/2)];
  }, [source, tick]);

  const overdueCount = useMemo(() =>
    roomed.filter(p => { const e = elapsedMin(p.lastAssessedAt); return e !== null && e >= (ESI[p.esiLevel]?.windowMin||60); }).length,
    [roomed, tick]);

  // Long-stay count — all patients (waiting, roomed, boarded) with door time ≥ 4 hours
  const longStayCount = useMemo(() =>
    source.filter(p => (elapsedMin(p.doorTime)||0) >= 240).length,
    [source, tick]);

  // ── Sort + filter roomed patients ──────────────────────────────────────────
  const filteredRoomed = useMemo(() => {
    let list = [...roomed];
    if (search) { const q = search.toLowerCase(); list = list.filter(p => p.room?.toLowerCase().includes(q) || p.cc?.text?.toLowerCase().includes(q) || p.provider?.toLowerCase().includes(q)); }
    // Acuity range filter — clinical groupings rather than individual ESI levels
    if (acuityRange === "critical") list = list.filter(p => p.esiLevel <= 2);
    if (acuityRange === "urgent")   list = list.filter(p => p.esiLevel === 3);
    if (acuityRange === "lower")    list = list.filter(p => p.esiLevel >= 4);
    // Flagged-for-huddle filter
    if (filterFlagged) list = list.filter(p => flagged.has(p.id));
    // Long-stay filter — door time ≥ 4 hours (240 minutes)
    if (longStayAlert) list = list.filter(p => (elapsedMin(p.doorTime)||0) >= 240);
    if (filterDisp) list = list.filter(p => p.disposition === filterDisp);
    if (filterProv) list = list.filter(p => p.provider === filterProv);
    list.sort((a, b) => {
      const aF = flagged.has(a.id) ? 0 : 1; const bF = flagged.has(b.id) ? 0 : 1;
      if (sortBy === "acuity") {
        if (a.esiLevel !== b.esiLevel) return a.esiLevel - b.esiLevel;
        if (aF !== bF) return aF - bF;
        return (elapsedMin(a.doorTime)||0) - (elapsedMin(b.doorTime)||0);
      }
      if (sortBy === "workload") return workloadScore(b) - workloadScore(a);
      if (sortBy === "reassess") {
        const aPct = (elapsedMin(a.lastAssessedAt)||0) / (ESI[a.esiLevel]?.windowMin||60);
        const bPct = (elapsedMin(b.lastAssessedAt)||0) / (ESI[b.esiLevel]?.windowMin||60);
        return bPct - aPct;
      }
      if (sortBy === "room") return (a.room||"").localeCompare(b.room||"", undefined, { numeric:true });
      return (elapsedMin(b.doorTime)||0) - (elapsedMin(a.doorTime)||0);
    });
    return list;
  }, [roomed, search, acuityRange, filterFlagged, longStayAlert, filterDisp, filterProv, flagged, sortBy, tick]);

  // ── Shared row renderer (collapsed + expandable) ────────────────────────────
  const SortBtn = ({ id, lbl }) => (
    <button onClick={() => setSortBy(id)} style={{ background:"none", border:"none", cursor:"pointer",
      padding:"2px 6px", fontFamily:"'JetBrains Mono',monospace", fontSize:8,
      letterSpacing:"1px", textTransform:"uppercase",
      color: sortBy===id ? T.teal : T.txt4,
      borderBottom: sortBy===id ? `1px solid ${T.teal}` : "1px solid transparent" }}>
      {lbl}{sortBy===id ? " ▾" : ""}
    </button>
  );

  const renderPatientRow = useCallback((pt) => {
    const esiCfg     = ESI[pt.esiLevel] || ESI[5];
    const isFlagged  = flagged.has(pt.id);
    const isExpanded = expanded.has(pt.id);
    const isBoarded  = pt.status === "boarded";
    const elapsed    = elapsedMin(pt.lastAssessedAt);
    const window     = esiCfg.windowMin;
    const overdue    = elapsed !== null && elapsed >= window;
    const si         = shockIndex(pt.vitals);
    const siAlert    = si !== null && si >= 0.9;
    const wScore     = workloadScore(pt);
    const doorMin    = elapsedMin(pt.doorTime);
    const displayName = privacyMode ? null : [pt.demo?.age && `${pt.demo.age}y`, pt.demo?.sex].filter(Boolean).join(" ");

    // Alert chips
    const alerts = [];
    if (siAlert)  alerts.push({ label:`SI ${si.toFixed(2)}`, col:T.coral });
    if (pt.vitals?.spo2 && parseFloat(pt.vitals.spo2) < 94) alerts.push({ label:`SpO2 ${pt.vitals.spo2}%`, col:T.coral });
    if (overdue && !isBoarded) alerts.push({ label:"REASSESS", col:T.coral });
    if (isBoarded) alerts.push({ label:"BOARDED", col:T.gold });
    // Long-stay badge — shown whenever door time ≥ 4h (regardless of toggle state)
    if (doorMin !== null && doorMin >= 240) alerts.push({ label:"4h+", col:longStayAlert ? T.coral : T.orange });

    // Status cell content depends on view mode
    const statusCell = viewMode === "physician" ? (
      isBoarded
        ? <BoardingClock admitDecisionAt={pt.admitDecisionAt} />
        : (
          <div style={{ textAlign:"center", minWidth:50 }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:14, fontWeight:700,
              color:clockColor(elapsed, window), lineHeight:1 }}>{fmtMin(elapsed)}</div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7, lineHeight:1,
              color:clockColor(elapsed, window), textTransform:"uppercase", letterSpacing:"0.5px", marginTop:2 }}>
              {overdue ? "OVERDUE" : `/${window}m`}
            </div>
          </div>
        )
    ) : (
      // Nurse view: task breakdown
      <div style={{ display:"flex", gap:5, alignItems:"center" }}>
        {[
          { lbl:"L", n:pt.pendingOrders?.labs||0,    col:T.blue   },
          { lbl:"Rx",n:pt.pendingOrders?.meds||0,    col:T.teal   },
          { lbl:"I", n:pt.pendingOrders?.imaging||0, col:T.gold   },
        ].map(o => (
          <div key={o.lbl} style={{ textAlign:"center", minWidth:20 }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:12, fontWeight:700,
              color: o.n > 0 ? o.col : T.txt4, lineHeight:1 }}>{o.n}</div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
              color:T.txt4, textTransform:"uppercase" }}>{o.lbl}</div>
          </div>
        ))}
      </div>
    );

    const rowBg = isFlagged ? "rgba(245,200,66,.06)"
                : isBoarded ? "rgba(245,200,66,.04)"
                : overdue   ? "rgba(255,107,107,.04)"
                : T.card;
    const rowBd = isFlagged ? "rgba(245,200,66,.3)"
                : isBoarded ? "rgba(245,200,66,.25)"
                : overdue   ? "rgba(255,107,107,.2)"
                : T.bd;

    return (
      <div key={pt.id}>
        {/* ── Collapsed row — 7-column grid ── */}
        <div onClick={() => onSelectPatient?.(pt.id)}
          style={{ display:"grid",
            gridTemplateColumns:"24px 34px 88px 1fr 70px 70px 28px",
            gap:0, alignItems:"center",
            padding:"8px 10px", borderRadius: isExpanded ? "9px 9px 0 0" : 9,
            background:rowBg, border:`1px solid ${rowBd}`,
            borderLeft:`3px solid ${esiCfg.color}`,
            cursor: onSelectPatient ? "pointer" : "default", transition:"background .15s" }}>

          {/* Flag */}
          <button onClick={e => toggleFlag(pt.id, e)}
            style={{ background:"none", border:"none", cursor:"pointer", fontSize:13,
              color: isFlagged ? T.gold : T.txt4,
              opacity: isFlagged ? 1 : 0.35, padding:"1px 0" }}>
            ⚑
          </button>

          {/* ESI */}
          <ESIBadge level={pt.esiLevel} />

          {/* Room + time */}
          <div style={{ paddingLeft:8 }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700,
              color:T.txt, lineHeight:1 }}>{pt.room || "\u2014"}</div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
              color: doorMin && doorMin > 240 ? T.coral : doorMin && doorMin > 120 ? T.gold : T.txt4,
              marginTop:2 }}>{fmtMin(doorMin)}</div>
          </div>

          {/* CC + identity + alerts */}
          <div style={{ paddingLeft:8, paddingRight:8, overflow:"hidden" }}>
            <div style={{ display:"flex", alignItems:"baseline", gap:7, marginBottom:2 }}>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt,
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {pt.cc?.text || "\u2014"}
              </span>
              {displayName && (
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                  color:T.txt4, whiteSpace:"nowrap", flexShrink:0 }}>
                  {displayName}
                </span>
              )}
            </div>
            <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
              {alerts.map(a => (
                <span key={a.label} style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7, fontWeight:700,
                  color:a.col, background:`${a.col}18`, border:`1px solid ${a.col}44`,
                  borderRadius:3, padding:"1px 5px", letterSpacing:"0.5px" }}>
                  {a.label}
                </span>
              ))}
            </div>
          </div>

          {/* Status cell (view-mode dependent) */}
          <div style={{ display:"flex", justifyContent:"center" }}>{statusCell}</div>

          {/* Disposition + task dots */}
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
            {(() => { const d = DISP[pt.disposition] || DISP.pending; return (
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
                color:d.color, background:d.bg, border:`1px solid ${d.color}44`,
                borderRadius:4, padding:"2px 6px", letterSpacing:"0.5px" }}>
                {d.label}
              </span>
            ); })()}
            {pt.pendingTasks?.length > 0 && (
              <div style={{ display:"flex", gap:2, alignItems:"center" }}>
                {pt.pendingTasks.slice(0,3).map((tk,i) => (
                  <div key={i} style={{ width:5, height:5, borderRadius:"50%",
                    background:TASK_COLORS[tk.type]||T.txt4 }} />
                ))}
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4, marginLeft:2 }}>
                  {pt.pendingTasks.length}
                </span>
              </div>
            )}
          </div>

          {/* Expand toggle */}
          <button onClick={e => toggleExpand(pt.id, e)}
            style={{ background:"none", border:"none", cursor:"pointer",
              color:T.txt4, fontSize:10, padding:"2px" }}>
            {isExpanded ? "▲" : "▼"}
          </button>
        </div>

        {/* ── Expanded detail panel ── */}
        {isExpanded && (
          <div style={{ padding:"10px 14px", borderRadius:"0 0 9px 9px",
            background:"rgba(8,22,40,.85)", border:`1px solid ${rowBd}`,
            borderTop:"none", marginBottom:2 }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:10 }}>

              {/* Vitals */}
              <div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4,
                  letterSpacing:"1.2px", textTransform:"uppercase", marginBottom:5 }}>Vitals</div>
                {[["HR", pt.vitals?.hr, "bpm"], ["BP", pt.vitals?.bp, ""], ["SpO2", pt.vitals?.spo2, "%"], ["RR", pt.vitals?.rr, "/min"]].map(([lbl, val]) => val ? (
                  <div key={lbl} style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
                    color:T.txt2, marginBottom:2 }}>
                    <span style={{ color:T.txt4 }}>{lbl}</span> {val}
                  </div>
                ) : null)}
              </div>

              {/* Provider / Nurse */}
              <div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4,
                  letterSpacing:"1.2px", textTransform:"uppercase", marginBottom:5 }}>Team</div>
                {pt.provider && <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt2, marginBottom:2 }}>MD: {pt.provider}</div>}
                {pt.assignedNurse && <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt2 }}>RN: {pt.assignedNurse}</div>}
              </div>

              {/* Workload (physician view) */}
              {viewMode === "physician" && (
                <div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4,
                    letterSpacing:"1.2px", textTransform:"uppercase", marginBottom:5 }}>Workload</div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700,
                    color: wScore >= 8 ? T.coral : wScore >= 5 ? T.gold : T.teal, lineHeight:1 }}>{wScore}</div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4, marginTop:2 }}>
                    ESI{pt.esiLevel} + {pt.pendingOrders?.labs||0}L + {pt.pendingOrders?.meds||0}Rx + {pt.pendingOrders?.imaging||0}I
                  </div>
                </div>
              )}

              {/* Pending orders (nurse view) */}
              {viewMode === "nurse" && (
                <div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4,
                    letterSpacing:"1.2px", textTransform:"uppercase", marginBottom:5 }}>Pending Orders</div>
                  {[["Labs",pt.pendingOrders?.labs,T.blue],["Meds",pt.pendingOrders?.meds,T.teal],["Imaging",pt.pendingOrders?.imaging,T.gold]].map(([l,n,c]) => (
                    <div key={l} style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color: n>0?c:T.txt4, marginBottom:2 }}>
                      {l}: {n||0}
                    </div>
                  ))}
                </div>
              )}

              {/* Tasks */}
              {pt.pendingTasks?.length > 0 && (
                <div style={{ gridColumn:"span 2" }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4,
                    letterSpacing:"1.2px", textTransform:"uppercase", marginBottom:5 }}>
                    Pending Tasks ({pt.pendingTasks.length})
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                    {pt.pendingTasks.map(tk => (
                      <div key={tk.id} style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <div style={{ width:6, height:6, borderRadius:3, flexShrink:0,
                          background:TASK_COLORS[tk.type]||T.txt4 }} />
                        <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt2 }}>
                          {tk.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }, [flagged, expanded, viewMode, privacyMode, onSelectPatient, toggleFlag, toggleExpand, longStayAlert, tick]);

  // ─── Render ────────────────────────────────────────────────────────────────
  const isDemo = !patientsProp || patientsProp.length === 0;

  return (
    <div style={{ background:T.bg, minHeight:"100vh", color:T.txt, fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ padding:"18px 22px 60px" }}>

        {/* ── Header ── */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between",
          gap:14, marginBottom:18, flexWrap:"wrap" }}>
          <div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:900,
              color:T.txt, marginBottom:3 }}>
              Huddle Board
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt4 }}>
              {new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}
              {" \u00b7 "}
              <span style={{ fontFamily:"'JetBrains Mono',monospace" }}>
                {new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",hour12:false})}
              </span>
              {isDemo && (
                <span style={{ marginLeft:10, fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                  color:T.gold, background:"rgba(245,200,66,.08)", border:"1px solid rgba(245,200,66,.3)",
                  borderRadius:4, padding:"1px 7px", letterSpacing:"0.5px" }}>DEMO DATA</span>
              )}
            </div>
          </div>

          {/* Controls strip */}
          <div style={{ display:"flex", gap:7, alignItems:"center", flexWrap:"wrap" }}>
            {/* View toggle */}
            <div style={{ display:"flex", borderRadius:7, overflow:"hidden", border:`1px solid ${T.bd}` }}>
              {[["physician","\uD83D\uDC68\u200D\u2695\uFE0F MD"],["nurse","\uD83E\uDE7A RN"]].map(([mode, lbl]) => (
                <button key={mode} onClick={() => setViewMode(mode)}
                  style={{ padding:"5px 12px", border:"none", cursor:"pointer",
                    fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight: viewMode===mode?700:400,
                    background: viewMode===mode ? "rgba(0,229,192,.12)" : "transparent",
                    color: viewMode===mode ? T.teal : T.txt4,
                    borderLeft: mode==="nurse" ? `1px solid ${T.bd}` : "none" }}>
                  {lbl}
                </button>
              ))}
            </div>

            {/* Privacy toggle */}
            <button onClick={() => setPrivacyMode(p => !p)}
              style={{ padding:"5px 11px", borderRadius:7, cursor:"pointer",
                border:`1px solid ${privacyMode ? "rgba(155,109,255,.45)" : T.bd}`,
                background: privacyMode ? "rgba(155,109,255,.1)" : "transparent",
                color: privacyMode ? T.purple : T.txt4,
                fontFamily:"'DM Sans',sans-serif", fontSize:11 }}>
              {privacyMode ? "\uD83D\uDD12 De-ID" : "\uD83D\uDD13 Names"}
            </button>

            {/* Config gear */}
            <button onClick={() => setShowConfig(s => !s)}
              style={{ width:30, height:30, borderRadius:7, border:`1px solid ${T.bd}`,
                background: showConfig ? T.up : "transparent", color:T.txt4,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:15, cursor:"pointer" }}>
              ⚙
            </button>
          </div>
        </div>

        {/* ── Config panel ── */}
        {showConfig && (
          <div style={{ padding:"12px 16px", borderRadius:10, background:T.panel,
            border:`1px solid ${T.bd}`, marginBottom:14, display:"flex", gap:20,
            flexWrap:"wrap", alignItems:"center" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4,
              letterSpacing:"1.2px", textTransform:"uppercase" }}>EDWIN Config</div>
            {[["Attending Physicians", attendings, setAttendings], ["Treatment Bays", bays, setBays]].map(([lbl, val, set]) => (
              <div key={lbl} style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt3 }}>{lbl}:</span>
                <input type="number" min="1" max="50" value={val} onChange={e => set(parseInt(e.target.value)||1)}
                  style={{ width:50, background:T.up, border:`1px solid ${T.bd}`, borderRadius:5,
                    padding:"3px 7px", color:T.txt, fontFamily:"'JetBrains Mono',monospace",
                    fontSize:12, fontWeight:700, outline:"none", textAlign:"center" }} />
              </div>
            ))}
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.txt4, lineHeight:1.5 }}>
              EDWIN = Σ(patients × ESI) / (attendings × (bays − boarders))
            </div>
          </div>
        )}

        {/* ── Department stats ── */}
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:18 }}>
          <StatCard label="Total"     value={source.length}         color={T.blue}  />
          <StatCard label="Waiting"   value={waiting.length}        color={waiting.some(p=>p.esiLevel<=2)?T.coral:T.gold} sub={waiting.length>0?`longest ${fmtMin(elapsedMin(waiting.sort((a,b)=>a.doorTime-b.doorTime)[0]?.doorTime))}`:null} />
          <StatCard label="ESI 1-2"   value={source.filter(p=>p.esiLevel<=2).length}   color={T.coral} sub="critical/emergent" />
          <StatCard label="Boarded"   value={boarded.length}        color={boarded.length>0?T.gold:T.teal} sub={ed2Median!==null?`med ${fmtMin(ed2Median)}`:null} />
          <StatCard label="Overdue"   value={overdueCount}          color={overdueCount>0?T.coral:T.teal} sub="reassessment" />
          <StatCard label="> 4 Hours" value={longStayCount}          color={longStayCount>0?T.coral:T.teal} sub="total door time" small />
          <StatCard label="JC ED-1"   value={ed1Median!==null?fmtMin(ed1Median):"—"}  color={T.purple} sub="med admit LOS" small />
          <StatCard label="JC ED-2"   value={ed2Median!==null?fmtMin(ed2Median):"—"}  color={T.orange} sub="med boarding" small />
          {edwinScore !== null && (
            <div style={{ padding:"11px 14px", borderRadius:10, background:T.card,
              border:`1px solid ${edwinColor(edwinScore)}28`, borderTop:`2px solid ${edwinColor(edwinScore)}66`,
              minWidth:90 }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:900,
                color:edwinColor(edwinScore), lineHeight:1 }}>{edwinScore}</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4,
                letterSpacing:"1.2px", textTransform:"uppercase", marginTop:2 }}>EDWIN</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                color:edwinColor(edwinScore), marginTop:1 }}>{edwinLabel(edwinScore)}</div>
            </div>
          )}
        </div>

        {/* ── Provider workload bar (physician view) ── */}
        {viewMode === "physician" && providers.length > 0 && (
          <div style={{ padding:"10px 14px", borderRadius:10, background:T.panel,
            border:`1px solid ${T.bd}`, marginBottom:14 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4,
              letterSpacing:"1.2px", textTransform:"uppercase", marginBottom:8 }}>
              Provider Workload
            </div>
            <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
              {providers.map(pv => {
                const pw = providerWorkloads[pv] || { total:0, count:0 };
                const maxScore = Math.max(...providers.map(p => (providerWorkloads[p]||{}).total||0), 1);
                const pct = (pw.total / maxScore) * 100;
                const col = pct > 75 ? T.coral : pct > 50 ? T.gold : T.teal;
                return (
                  <div key={pv} style={{ display:"flex", flexDirection:"column", gap:4, minWidth:130 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline" }}>
                      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt2 }}>
                        {pv.replace("Dr. ", "")}
                      </span>
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
                        color:col, fontWeight:700 }}>
                        {pw.total} <span style={{ color:T.txt4, fontWeight:400 }}>({pw.count}pts)</span>
                      </span>
                    </div>
                    <div style={{ height:5, borderRadius:3, background:T.up, overflow:"hidden" }}>
                      <div style={{ height:"100%", borderRadius:3, background:col,
                        width:`${pct}%`, transition:"width .4s" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Waiting room strip ── */}
        {waiting.length > 0 && (
          <div style={{ marginBottom:14 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.gold,
              letterSpacing:"1.5px", textTransform:"uppercase", marginBottom:7,
              display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:6, height:6, borderRadius:3, background:T.gold }} />
              Waiting Room ({waiting.length}) — not yet roomed
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
              {waiting.map(pt => {
                const esiCfg  = ESI[pt.esiLevel] || ESI[5];
                const doorMin = elapsedMin(pt.doorTime);
                const urgent  = pt.esiLevel <= 2;
                return (
                  <div key={pt.id}
                    style={{ display:"grid", gridTemplateColumns:"34px 1fr 80px 60px",
                      gap:0, alignItems:"center", padding:"7px 12px",
                      borderRadius:8, cursor: onSelectPatient ? "pointer" : "default",
                      background: urgent ? "rgba(255,159,67,.06)" : T.up,
                      border:`1px solid ${urgent ? "rgba(255,159,67,.3)" : T.bd}`,
                      borderLeft:`3px solid ${esiCfg.color}` }}
                    onClick={() => onSelectPatient?.(pt.id)}>
                    <ESIBadge level={pt.esiLevel} />
                    <div style={{ paddingLeft:10 }}>
                      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt }}>
                        {pt.cc?.text}
                      </div>
                      {pt.assignedNurse && viewMode === "nurse" && (
                        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.txt4, marginTop:1 }}>
                          {pt.assignedNurse}
                        </div>
                      )}
                    </div>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4,
                      textAlign:"center" }}>
                      {[pt.demo?.age && `${pt.demo.age}y`, pt.demo?.sex].filter(Boolean).join(" ")}
                    </div>
                    <div style={{ textAlign:"center" }}>
                      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:13, fontWeight:700,
                        color: urgent && doorMin > 20 ? T.coral : doorMin > 45 ? T.gold : T.txt3, lineHeight:1 }}>
                        {fmtMin(doorMin)}
                      </div>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7, color:T.txt4,
                        textTransform:"uppercase", marginTop:2 }}>waiting</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Filter + sort bar ── */}
        <div style={{ display:"flex", gap:9, marginBottom:10, flexWrap:"wrap", alignItems:"center" }}>
          <input placeholder="Room, CC, provider\u2026" value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ background:T.up, border:`1px solid ${T.bd}`, borderRadius:7, padding:"5px 11px",
              color:T.txt, fontFamily:"'DM Sans',sans-serif", fontSize:12, outline:"none", width:200 }} />

          {/* Acuity range — clinical groupings (replaces individual ESI chips) */}
          <div style={{ display:"flex", gap:4 }}>
            {[
              { key:null,       lbl:"All",          col:T.txt4,   bg:"transparent",            bd:T.bd                      },
              { key:"critical", lbl:"Critical 1–2", col:"#ff6b6b",bg:"rgba(255,107,107,.1)",   bd:"rgba(255,107,107,.45)"   },
              { key:"urgent",   lbl:"Urgent 3",     col:T.gold,   bg:"rgba(245,200,66,.1)",    bd:"rgba(245,200,66,.45)"    },
              { key:"lower",    lbl:"Lower 4–5",    col:T.blue,   bg:"rgba(59,158,255,.1)",    bd:"rgba(59,158,255,.4)"     },
            ].map(({ key, lbl, col, bg, bd }) => {
              const on = acuityRange === key;
              return (
                <button key={String(key)} onClick={() => setAcuityRange(on ? null : key)}
                  style={{ padding:"4px 10px", borderRadius:6, cursor:"pointer",
                    border:`1px solid ${on ? bd : T.bd}`,
                    background: on ? bg : "transparent",
                    color: on ? col : T.txt4,
                    fontFamily:"'DM Sans',sans-serif", fontSize:11,
                    fontWeight: on ? 700 : 400, whiteSpace:"nowrap",
                    transition:"all .12s" }}>
                  {lbl}
                </button>
              );
            })}
          </div>

          {/* Flagged-for-huddle toggle */}
          <button onClick={() => setFilterFlagged(f => !f)}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 11px",
              borderRadius:6, cursor:"pointer", transition:"all .12s",
              border:`1px solid ${filterFlagged ? "rgba(245,200,66,.5)" : T.bd}`,
              background: filterFlagged ? "rgba(245,200,66,.1)" : "transparent",
              color: filterFlagged ? T.gold : T.txt4,
              fontFamily:"'DM Sans',sans-serif", fontSize:11,
              fontWeight: filterFlagged ? 700 : 400 }}>
            <span style={{ fontSize:13, lineHeight:1 }}>{filterFlagged ? "⚑" : "⚐"}</span>
            Flagged only
            {filterFlagged && flagged.size > 0 && (
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                background:"rgba(245,200,66,.25)", borderRadius:3,
                padding:"0 5px", color:T.gold }}>{flagged.size}</span>
            )}
          </button>

          {/* Long-stay alert toggle (> 4 hours in department) */}
          <button onClick={() => setLongStayAlert(a => !a)}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 11px",
              borderRadius:6, cursor:"pointer", transition:"all .12s",
              border:`1px solid ${longStayAlert ? "rgba(255,107,107,.5)" : T.bd}`,
              background: longStayAlert ? "rgba(255,107,107,.1)" : "transparent",
              color: longStayAlert ? T.coral : T.txt4,
              fontFamily:"'DM Sans',sans-serif", fontSize:11,
              fontWeight: longStayAlert ? 700 : 400 }}>
            <span style={{ fontSize:12, lineHeight:1 }}>\uD83D\uDD50</span>
            &gt; 4h
            {longStayAlert && longStayCount > 0 && (
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                background:"rgba(255,107,107,.2)", borderRadius:3,
                padding:"0 5px", color:T.coral }}>{longStayCount}</span>
            )}
          </button>
          {providers.length > 1 && (
            <div style={{ position:"relative" }}>
              <select value={filterProv||""} onChange={e => setFilterProv(e.target.value||null)}
                style={{ background:T.up, border:`1px solid ${T.bd}`, borderRadius:7,
                  padding:"5px 22px 5px 10px", color:filterProv?T.blue:T.txt4,
                  fontFamily:"'DM Sans',sans-serif", fontSize:11, outline:"none",
                  appearance:"none", WebkitAppearance:"none", cursor:"pointer" }}>
                <option value="">All providers</option>
                {providers.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <span style={{ position:"absolute", right:7, top:"50%", transform:"translateY(-50%)",
                color:T.txt4, fontSize:9, pointerEvents:"none" }}>▾</span>
            </div>
          )}
          <div style={{ marginLeft:"auto", display:"flex", gap:3, alignItems:"center" }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.txt4, letterSpacing:"1px", textTransform:"uppercase" }}>Sort:</span>
            {[["acuity","Acuity"],["workload","Load"],["reassess","Reassess"],["room","Room"],["time","Time"]].map(([id,lbl]) => (
              <SortBtn key={id} id={id} lbl={lbl} />
            ))}
          </div>
        </div>

        {/* ── Column header ── */}
        <div style={{ display:"grid", gridTemplateColumns:"24px 34px 88px 1fr 70px 70px 28px",
          gap:0, padding:"4px 10px", marginBottom:5,
          fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4,
          letterSpacing:"1px", textTransform:"uppercase", borderBottom:`1px solid ${T.bd}` }}>
          <div />
          <div>ESI</div>
          <div style={{ paddingLeft:8 }}>Room</div>
          <div style={{ paddingLeft:8 }}>Patient</div>
          <div style={{ textAlign:"center" }}>{viewMode==="physician"?"Reassess":"Orders"}</div>
          <div style={{ textAlign:"center" }}>Disp.</div>
          <div />
        </div>

        {/* ── Active patients ── */}
        {filteredRoomed.length === 0 && (
          <div style={{ padding:"32px 20px", textAlign:"center", color:T.txt4,
            fontFamily:"'DM Sans',sans-serif", fontSize:13 }}>
            No patients match the current filters
          </div>
        )}
        <div style={{ display:"flex", flexDirection:"column", gap:3, marginBottom:14 }}>
          {filteredRoomed.map(pt => renderPatientRow(pt))}
        </div>

        {/* ── Boarding section ── */}
        {boarded.length > 0 && (
          <div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.gold,
              letterSpacing:"1.5px", textTransform:"uppercase", margin:"16px 0 8px",
              display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:6, height:6, borderRadius:3, background:T.gold }} />
              Boarding ({boarded.length}) — admitted, awaiting inpatient bed
              {ed2Median !== null && (
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                  color:T.txt4, fontWeight:400, letterSpacing:0, textTransform:"none" }}>
                  · JC ED-2 median {fmtMin(ed2Median)}
                </span>
              )}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
              {boarded.map(pt => renderPatientRow(pt))}
            </div>
          </div>
        )}

        {/* ── Legend ── */}
        <div style={{ marginTop:22, padding:"9px 14px", borderRadius:9,
          background:T.panel, border:`1px solid ${T.bd}`,
          display:"flex", gap:18, flexWrap:"wrap",
          fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4, letterSpacing:"0.5px" }}>
          <span><span style={{ color:T.teal }}>▮</span> Within window</span>
          <span><span style={{ color:T.gold }}>▮</span> ≥60% (threshold adjusted for documentation lag)</span>
          <span><span style={{ color:T.coral }}>▮</span> Overdue</span>
          <span><span style={{ color:T.gold }}>⚑</span> Huddle flag</span>
          <span>EDWIN: &lt;2 OK · 2-4 Busy · 4-6 Crowded · ≥6 Severe</span>
          <span>Workload = ESI + L + Rx + I</span>
          <span>Clocks refresh 30s</span>
        </div>
      </div>
    </div>
  );
}