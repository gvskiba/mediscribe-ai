import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

/* ═══════════════════════════════════════════════
   DESIGN TOKENS
═══════════════════════════════════════════════ */
const T = {
  bg: "#050f1e", panel: "#081628", card: "#0b1e36", up: "#0e2544",
  border: "#1a3555", borderHi: "#2a4f7a",
  blue: "#3b9eff", teal: "#00e5c0", gold: "#f5c842",
  coral: "#ff6b6b", orange: "#ff9f43", purple: "#9b6dff",
  txt: "#ffffff", txt2: "#d0e8ff", txt3: "#a8c8e8", txt4: "#7aa0c0",
};

/* ═══════════════════════════════════════════════
   NAVIGATION CONFIG  (from Layout)
═══════════════════════════════════════════════ */
const APP_ICONS = [
  { icon: "🏠", label: "Home" },
  { icon: "📊", label: "Dashboard" },
  { icon: "👥", label: "Patients" },
  { icon: "🔄", label: "Shift" },
  { icon: "💊", label: "Drugs" },
  { icon: "🧮", label: "Calc" },
];

const CHART_GROUPS = [
  {
    label: "Intake",
    items: [
      { icon: "📊", label: "Patient Chart",     dot: "done",    page: "/NewPatientInput?tab=chart" },
      { icon: "👤", label: "Demographics",      dot: "done",    page: "/NewPatientInput?tab=demo" },
      { icon: "💬", label: "Chief Complaint",   dot: "done",    page: "/NewPatientInput?tab=cc" },
      { icon: "📈", label: "Vitals",            dot: "done",    page: "/NewPatientInput?tab=vit" },
    ],
  },
  {
    label: "Documentation",
    items: [
      { icon: "💊", label: "Meds & PMH",        dot: "done",    page: "/NewPatientInput?tab=meds" },
      { icon: "🔍", label: "Review of Systems", dot: "partial", page: "/NewPatientInput?tab=ros" },
      { icon: "🩺", label: "Physical Exam",     dot: "partial", page: "/NewPatientInput?tab=pe" },
      { icon: "⚖️", label: "MDM",              dot: "empty",   page: "/NewPatientInput?tab=mdm" },
    ],
  },
  {
    label: "Disposition",
    items: [
      { icon: "📋", label: "Orders",            dot: "empty",   page: "/NewPatientInput?tab=orders" },
      { icon: "🚪", label: "Discharge",         dot: "empty",   page: "/NewPatientInput?tab=discharge" },
      { icon: "🗺️", label: "ER Plan Builder",  dot: "empty",   page: "/NewPatientInput?tab=erplan" },
    ],
  },
  {
    label: "Tools",
    items: [
      { icon: "🤖", label: "AutoCoder",         dot: "empty",   page: "/NewPatientInput?tab=autocoder" },
      { icon: "💉", label: "eRx",               dot: "empty",   page: "/NewPatientInput?tab=erx" },
      { icon: "✂️", label: "Procedures",        dot: "empty",   page: "/NewPatientInput?tab=procedures" },
    ],
  },
];

const ALL_ITEMS = CHART_GROUPS.flatMap(g => g.items);

/* chart-section in-page nav (PatientChart) */
const CHART_NAV = [
  { id: "s-overview",  icon: "📊", label: "Overview",     dot: "done" },
  { id: "s-timeline",  icon: "🕐", label: "Timeline",     dot: "done" },
  { id: "s-problems",  icon: "🏷️", label: "Problem List", dot: "partial" },
  { id: "s-meds",      icon: "💊", label: "Medications",  dot: "done" },
  { id: "s-labs",      icon: "🧪", label: "Labs",         dot: "alert" },
  { id: "s-imaging",   icon: "🩻", label: "Imaging",      dot: "partial" },
  { id: "s-allergies", icon: "⚠️", label: "Allergies",    dot: "done" },
  { id: "s-note",      icon: "📝", label: "Current Note", dot: "done" },
];

/* ═══════════════════════════════════════════════
   DEMO DATA  (PatientChart)
═══════════════════════════════════════════════ */
const now = Date.now();
const mAgo = m => new Date(now - m * 60000);

const DEMO = {
  user:    { name: "Dr. Gabriel Skiba" },
  shift:   { active: 8, pending: 14, orders: 3, hours: "11.6" },
  patient: { firstName: "Hiroshi", lastName: "Nakamura", dob: "1957-03-14", sex: "Male", mrn: "4-471-8820", room: "4B", cc: "Chest Pain", status: "MONITORING", triage: "ESI-2" },
  vitals:  { bp: "158/94", hr: 108, rr: 18, spo2: 93, temp: "37.1°C", gcs: 15, recorded: mAgo(14) },
  timeline: [],
  problems: [
    { icd: "I21.4",  name: "Non-ST Elevation MI",        status: "active",    onset: new Date().toISOString() },
    { icd: "I10",    name: "Hypertension, Essential",     status: "active",    onset: "2019" },
    { icd: "E11.65", name: "Type 2 DM w/ hyperglycemia", status: "active",    onset: "2021" },
    { icd: "I25.10", name: "Coronary Artery Disease",     status: "active",    onset: "2022" },
    { icd: "Z87.39", name: "Hx of tobacco use",           status: "historical",onset: "2015" },
    { icd: "K21.0",  name: "GERD",                        status: "historical",onset: "2018" },
  ],
  allergies: [
    { allergen: "Penicillin",         severity: "severe",   reaction: "Anaphylaxis",   confirmed: "2018-06-01" },
    { allergen: "Iodinated Contrast", severity: "moderate", reaction: "Urticaria",      confirmed: "2020-03-15" },
    { allergen: "Codeine",            severity: "mild",     reaction: "Nausea/Vomiting",confirmed: null },
  ],
  meds: [
    { name: "Aspirin",      dose: "325 mg",              freq: "× 1 dose",    route: "PO", status: "ed",   time: mAgo(70), by: "Nurse T. Reyes" },
    { name: "Heparin",      dose: "4000U bolus→800U/hr", freq: "Drip active", route: "IV", status: "ed",   time: mAgo(23), by: "Dr. Skiba" },
    { name: "Ticagrelor",   dose: "180 mg loading",      freq: "× 1 dose",    route: "PO", status: "ed",   time: mAgo(9),  by: "Dr. Chen" },
    { name: "Metoprolol",   dose: "50 mg",               freq: "BID",         route: "PO", status: "home" },
    { name: "Atorvastatin", dose: "40 mg",               freq: "Nightly",     route: "PO", status: "home" },
    { name: "Metformin",    dose: "1000 mg",             freq: "BID",         route: "PO", status: "home" },
    { name: "Lisinopril",   dose: "10 mg",               freq: "Daily",       route: "PO", status: "held" },
  ],
  labs: [
    { panel: "Cardiac",   name: "Troponin-I", val: "0.84", unit: "ng/mL", ref: "<0.04",   flag: "hi", time: mAgo(25) },
    { panel: "Cardiac",   name: "BNP",        val: "812",  unit: "pg/mL", ref: "<100",    flag: "hi", time: mAgo(25) },
    { panel: "Cardiac",   name: "CK-MB",      val: "3.2",  unit: "ng/mL", ref: "0–6.3",  flag: "ok", time: mAgo(25) },
    { panel: "Metabolic", name: "Na⁺",        val: "138",  unit: "mEq/L", ref: "136–145",flag: "ok", time: mAgo(70) },
    { panel: "Metabolic", name: "K⁺",         val: "5.4",  unit: "mEq/L", ref: "3.5–5.0",flag: "hi", time: mAgo(70) },
    { panel: "Metabolic", name: "Creatinine", val: "1.1",  unit: "mg/dL", ref: "0.7–1.2",flag: "ok", time: mAgo(70) },
    { panel: "Metabolic", name: "Glucose",    val: "218",  unit: "mg/dL", ref: "70–100", flag: "hi", time: mAgo(70) },
  ],
  imaging: [
    { type: "Chest X-Ray (PA/Lat)", mod: "XR",   status: "resulted", ordered: mAgo(84), resulted: mAgo(62), rad: "Dr. Patel", finding: "Mild cardiomegaly. No pneumothorax. Mild pulmonary vascular congestion. No frank consolidation." },
    { type: "Echocardiogram (TTE)",  mod: "ECHO", status: "pending",  ordered: mAgo(9),  resulted: null,     rad: null,       finding: null },
  ],
  note: `CHIEF COMPLAINT: Acute chest pain, left arm radiation, diaphoresis.\n\nHPI: Mr. Nakamura is a 67-year-old male with known CAD, HTN, and T2DM who presented via EMS with acute onset chest pain 9/10, radiating to the left arm, associated with diaphoresis and mild dyspnea.\n\nASSESSMENT & PLAN:\n1. NSTEMI (I21.4) — Troponin-I 0.84 (>20× ULN).\n   • Aspirin 325mg ✓ | Ticagrelor 180mg ✓ | Heparin drip ✓\n   • Cardiology at bedside — urgent PCI being arranged\n2. HTN — holding lisinopril; BP monitored\n3. T2DM — glucose 218, insulin sliding scale\n\nDISPOSITION: Admit to Cardiac ICU. Cath lab on standby.`,
};

/* ═══════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════ */
const calcAge = dob => {
  const b = new Date(dob), n = new Date();
  let a = n.getFullYear() - b.getFullYear();
  if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--;
  return a;
};
const fmtDate = d => { try { return new Date(d).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }); } catch { return "—"; } };
const fmtTime = d => { try { return new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }); } catch { return "—"; } };
const timeAgo = d => { const m = Math.floor((Date.now() - new Date(d)) / 60000); return m < 1 ? "just now" : m < 60 ? `${m} min ago` : `${Math.floor(m / 60)} hr ago`; };
const isToday = d => { if (!d) return false; const dt = new Date(d), t = new Date(); return dt.getFullYear() === t.getFullYear() && dt.getMonth() === t.getMonth() && dt.getDate() === t.getDate(); };
const vitalCls  = (key, val) => { const n = parseFloat(val); if (key === "bp") return n > 140 ? "t-coral" : n < 90 ? "t-blue" : "t-teal"; if (key === "hr") return n > 100 ? "t-gold" : n < 50 ? "t-blue" : "t-teal"; return "t-teal"; };
const vitalFlag = (val, { hi, lo } = {}) => { const n = parseFloat(val); if (!isNaN(n) && hi !== undefined && n > hi) return "hi"; if (!isNaN(n) && lo !== undefined && n < lo) return "crit"; return "val"; };
const triageCls = l => ({ "ESI-1": "badge-coral", "ESI-2": "badge-orange", "ESI-3": "badge-gold", "ESI-4": "badge-teal", "ESI-5": "badge-muted" }[l] ?? "badge-muted");
const TL_COLORS = { arrival: T.txt3, critical: T.coral, order: T.blue, result: T.coral, consult: T.purple, med: T.teal, current: T.teal };

/* ═══════════════════════════════════════════════
   GLOBAL CSS  — Layout shell + PatientChart content
═══════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');

:root {
  --bg:#050f1e; --bg-p:#081628; --bg-c:#0b1e36; --bg-u:#0e2544;
  --bd:#1a3555; --bd-hi:#2a4f7a;
  --blue:#3b9eff; --teal:#00e5c0; --gold:#f5c842;
  --coral:#ff6b6b; --orange:#ff9f43; --purple:#9b6dff;
  --txt:#ffffff; --txt2:#d0e8ff; --txt3:#a8c8e8; --txt4:#7aa0c0;
  --r:8px; --rl:12px;
  --w-icon:56px; --w-csb:170px; --h-top:88px; --h-bot:50px;
}
.notrya *, .notrya *::before, .notrya *::after { box-sizing:border-box; margin:0; padding:0; }
.notrya { font-family:'DM Sans',sans-serif; font-size:14px; color:var(--txt); background:var(--bg); }

/* ── ICON SIDEBAR (Layout) ── */
.isb {
  position:fixed; top:0; left:0; bottom:0; width:var(--w-icon);
  background:#040d19; border-right:1px solid var(--bd);
  display:flex; flex-direction:column; align-items:center; z-index:300;
}
.isb-logo { width:100%; height:48px; display:flex; align-items:center; justify-content:center; border-bottom:1px solid var(--bd); flex-shrink:0; }
.isb-box {
  width:30px; height:30px; background:var(--blue); border-radius:7px;
  display:flex; align-items:center; justify-content:center;
  font-family:'Playfair Display',serif; font-size:12px; font-weight:700; color:#fff; cursor:pointer;
  transition:filter .2s;
}
.isb-box:hover { filter:brightness(1.2); }
.isb-scroll { flex:1; width:100%; display:flex; flex-direction:column; align-items:center; padding:8px 0; gap:2px; overflow-y:auto; }
.isb-btn {
  width:42px; height:42px;
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  gap:2px; border-radius:6px; cursor:pointer; transition:all .15s;
  color:var(--txt3); border:1px solid transparent; font-size:15px;
}
.isb-btn:hover { background:var(--bg-u); border-color:var(--bd); color:var(--txt2); }
.isb-btn.active { background:rgba(59,158,255,.1); border-color:rgba(59,158,255,.3); color:var(--blue); }
.isb-lbl { font-size:8px; line-height:1; white-space:nowrap; color:inherit; }
.isb-foot { padding:8px 0; border-top:1px solid var(--bd); display:flex; flex-direction:column; align-items:center; gap:2px; width:100%; }

/* ── TOP BAR (Layout) ── */
.topbar {
  position:fixed; top:0; left:var(--w-icon); right:0; height:var(--h-top);
  background:var(--bg-p); border-bottom:1px solid var(--bd);
  display:flex; flex-direction:column; z-index:200;
}
.row1 { height:44px; display:flex; align-items:center; padding:0 14px; gap:8px; border-bottom:1px solid rgba(26,53,85,.5); flex-shrink:0; }
.row2 { height:44px; display:flex; align-items:center; padding:0 14px; gap:7px; overflow:hidden; flex-shrink:0; }
.welcome { font-size:12px; color:var(--txt2); font-weight:500; white-space:nowrap; }
.welcome strong { color:var(--txt); }
.vsep { width:1px; height:20px; background:var(--bd); flex-shrink:0; }
.stat-pill {
  display:flex; align-items:center; gap:5px;
  background:var(--bg-u); border:1px solid var(--bd); border-radius:6px; padding:3px 10px;
  cursor:pointer; transition:border-color .15s;
}
.stat-pill:hover { border-color:var(--bd-hi); }
.stat-v { font-family:'JetBrains Mono',monospace; font-size:13px; font-weight:600; color:var(--txt); }
.stat-v.alert { color:var(--gold); }
.stat-l { font-size:9px; color:var(--txt3); text-transform:uppercase; letter-spacing:.04em; }
.r1-right { margin-left:auto; display:flex; align-items:center; gap:6px; }
.clock { background:var(--bg-u); border:1px solid var(--bd); border-radius:6px; padding:3px 10px; font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--txt2); }
.ai-on { display:flex; align-items:center; gap:4px; background:rgba(0,229,192,.08); border:1px solid rgba(0,229,192,.3); border-radius:6px; padding:3px 10px; font-size:11px; font-weight:600; color:var(--teal); }
.ai-dot { width:6px; height:6px; border-radius:50%; background:var(--teal); animation:aipulse 2s ease-in-out infinite; }
@keyframes aipulse { 0%,100%{box-shadow:0 0 0 0 rgba(0,229,192,.4)} 50%{box-shadow:0 0 0 5px rgba(0,229,192,0)} }
.btn-newpt { background:var(--teal); color:var(--bg); border:none; border-radius:6px; padding:4px 12px; font-size:11px; font-weight:700; cursor:pointer; white-space:nowrap; font-family:'DM Sans',sans-serif; }
.btn-newpt:hover { filter:brightness(1.15); }
/* row2 */
.chart-badge { font-family:'JetBrains Mono',monospace; font-size:10px; background:var(--bg-u); border:1px solid var(--bd); border-radius:20px; padding:1px 8px; color:var(--teal); white-space:nowrap; flex-shrink:0; }
.pt-name { font-family:'Playfair Display',serif; font-size:14px; font-weight:600; color:var(--txt); white-space:nowrap; flex-shrink:0; }
.pt-meta { font-size:11px; color:var(--txt3); white-space:nowrap; flex-shrink:0; }
.pt-cc { font-family:'JetBrains Mono',monospace; font-size:11px; font-weight:600; color:var(--orange); white-space:nowrap; flex-shrink:0; }
.vital { display:flex; align-items:center; gap:3px; font-family:'JetBrains Mono',monospace; font-size:10.5px; white-space:nowrap; flex-shrink:0; }
.vital .lbl { color:var(--txt4); font-size:9px; }
.vital .val  { color:var(--txt2); }
.vital .hi   { color:var(--gold); }
.vital .crit { color:var(--coral); animation:glowred 2s ease-in-out infinite; }
.vital .lo   { color:var(--blue); }
@keyframes glowred { 0%,100%{text-shadow:0 0 4px rgba(255,107,107,.4)} 50%{text-shadow:0 0 10px rgba(255,107,107,.9)} }
.status-badge { font-family:'JetBrains Mono',monospace; font-size:10px; font-weight:600; padding:2px 10px; border-radius:4px; background:rgba(255,107,107,.1); color:var(--coral); border:1px solid rgba(255,107,107,.3); white-space:nowrap; flex-shrink:0; }
.room-badge   { font-family:'JetBrains Mono',monospace; font-size:10px; font-weight:600; padding:2px 8px;  border-radius:4px; background:rgba(0,229,192,.1);   color:var(--teal);  border:1px solid rgba(0,229,192,.3);   white-space:nowrap; flex-shrink:0; }
.chart-actions { margin-left:auto; display:flex; align-items:center; gap:5px; flex-shrink:0; }

/* ── CHART SECTION SIDEBAR (Layout CHART_GROUPS) ── */
.csb {
  position:fixed; top:var(--h-top); left:var(--w-icon); bottom:var(--h-bot);
  width:var(--w-csb); background:var(--bg-p); border-right:1px solid var(--bd);
  overflow-y:auto; padding:10px 8px; display:flex; flex-direction:column; gap:1px; z-index:100;
}
.csb::-webkit-scrollbar { width:4px; }
.csb::-webkit-scrollbar-thumb { background:var(--bd); border-radius:2px; }
.csb-pt-card { background:var(--bg-c); border:1px solid var(--bd); border-radius:var(--rl); padding:12px; margin-bottom:6px; }
.pt-avatar { width:32px; height:32px; border-radius:50%; background:rgba(59,158,255,.15); border:1px solid rgba(59,158,255,.3); display:flex; align-items:center; justify-content:center; font-family:'Playfair Display',serif; font-size:13px; font-weight:700; color:var(--blue); flex-shrink:0; }
.csb-group { font-size:9px; color:var(--txt4); text-transform:uppercase; letter-spacing:.08em; padding:10px 8px 4px; font-weight:600; }
.csb-group:first-of-type { padding-top:4px; }
.csb-item { display:flex; align-items:center; gap:7px; padding:6px 8px; border-radius:6px; cursor:pointer; transition:all .15s; border:1px solid transparent; font-size:12px; color:var(--txt2); user-select:none; }
.csb-item:hover { background:var(--bg-u); border-color:var(--bd); color:var(--txt); }
.csb-item.active { background:rgba(59,158,255,.1); border-color:rgba(59,158,255,.3); color:var(--blue); }
.csb-icon { font-size:13px; width:18px; text-align:center; flex-shrink:0; }
.csb-dot { width:6px; height:6px; border-radius:50%; margin-left:auto; flex-shrink:0; background:var(--bd); }
.csb-dot.done    { background:var(--teal);   box-shadow:0 0 5px rgba(0,229,192,.5); }
.csb-dot.partial { background:var(--orange); box-shadow:0 0 5px rgba(255,159,67,.5); }
.csb-dot.alert   { background:var(--coral);  box-shadow:0 0 5px rgba(255,107,107,.5); }
.csb-div { height:1px; background:var(--bd); margin:6px 4px; }
.flag-card { background:var(--bg-c); border:1px solid var(--bd); border-radius:var(--rl); padding:10px 12px; margin-bottom:4px; }

/* ── FLOATING AI CHATBOT ── */
.ai-fab {
  position:fixed; bottom:calc(var(--h-bot) + 16px); right:22px;
  width:52px; height:52px; border-radius:50%;
  background:linear-gradient(135deg, var(--teal) 0%, #00b8a9 100%);
  border:none; cursor:pointer; z-index:400;
  display:flex; align-items:center; justify-content:center;
  box-shadow:0 4px 20px rgba(0,229,192,.35), 0 2px 8px rgba(0,0,0,.4);
  transition:transform .2s, box-shadow .2s;
  font-size:20px;
}
.ai-fab:hover { transform:scale(1.08); box-shadow:0 6px 28px rgba(0,229,192,.5), 0 4px 12px rgba(0,0,0,.4); }
.ai-fab.open  { transform:scale(0.94); }
.ai-fab-ring {
  position:fixed; bottom:calc(var(--h-bot) + 16px); right:22px;
  width:52px; height:52px; border-radius:50%; z-index:399; pointer-events:none;
  animation:fabring 2.4s ease-out infinite;
}
@keyframes fabring {
  0%   { box-shadow:0 0 0 0 rgba(0,229,192,.5); }
  70%  { box-shadow:0 0 0 14px rgba(0,229,192,0); }
  100% { box-shadow:0 0 0 0 rgba(0,229,192,0); }
}
.ai-fab-badge {
  position:absolute; top:-3px; right:-3px;
  width:18px; height:18px; border-radius:50%;
  background:var(--coral); border:2px solid var(--bg);
  font-size:9px; font-weight:700; color:#fff; font-family:'JetBrains Mono',monospace;
  display:flex; align-items:center; justify-content:center;
  animation:badgepop .3s cubic-bezier(.34,1.56,.64,1);
}
@keyframes badgepop { 0%{transform:scale(0)} 100%{transform:scale(1)} }
.ai-float {
  position:fixed; bottom:calc(var(--h-bot) + 80px); right:18px;
  width:340px; height:520px;
  background:var(--bg-p); border:1px solid var(--bd-hi);
  border-radius:16px; z-index:400;
  display:flex; flex-direction:column; overflow:hidden;
  box-shadow:0 12px 48px rgba(0,0,0,.6), 0 4px 16px rgba(0,229,192,.08);
  transform-origin:bottom right;
  animation:chatopen .22s cubic-bezier(.34,1.3,.64,1);
}
@keyframes chatopen {
  0%   { opacity:0; transform:scale(.85) translateY(20px); }
  100% { opacity:1; transform:scale(1) translateY(0); }
}
.ai-float-hdr {
  flex-shrink:0; padding:0 14px;
  background:linear-gradient(135deg, rgba(0,229,192,.12) 0%, rgba(59,158,255,.06) 100%);
  border-bottom:1px solid var(--bd); display:flex; flex-direction:column; gap:0;
}
.ai-float-hdr-top {
  height:44px; display:flex; align-items:center; gap:8px;
}
.ai-float-avatar {
  width:28px; height:28px; border-radius:50%;
  background:rgba(0,229,192,.15); border:1px solid rgba(0,229,192,.4);
  display:flex; align-items:center; justify-content:center; font-size:14px; flex-shrink:0;
}
.ai-float-name { font-size:13px; font-weight:600; color:var(--txt); }
.ai-float-status {
  font-size:10px; color:var(--teal); display:flex; align-items:center; gap:4px;
  font-family:'JetBrains Mono',monospace;
}
.ai-float-close {
  margin-left:auto; width:24px; height:24px; border-radius:50%;
  background:var(--bg-u); border:1px solid var(--bd);
  display:flex; align-items:center; justify-content:center;
  cursor:pointer; color:var(--txt3); font-size:13px; transition:all .15s;
}
.ai-float-close:hover { border-color:var(--bd-hi); color:var(--txt); }
.ai-float-chips {
  display:flex; gap:4px; flex-wrap:wrap; padding-bottom:10px;
}
.ai-chip {
  padding:3px 9px; border-radius:20px; font-size:10px; cursor:pointer;
  background:var(--bg-u); border:1px solid var(--bd); color:var(--txt2);
  transition:all .15s; font-family:'DM Sans',sans-serif; white-space:nowrap;
}
.ai-chip:hover { border-color:var(--teal); color:var(--teal); background:rgba(0,229,192,.06); }
.ai-ctx-pill {
  margin:0 14px 10px;
  background:rgba(59,158,255,.08); border:1px solid rgba(59,158,255,.2);
  border-radius:6px; padding:5px 10px;
  font-size:10px; color:var(--blue); font-family:'JetBrains Mono',monospace;
  display:flex; align-items:center; gap:6px; flex-shrink:0;
}
.ai-ctx-dot { width:5px; height:5px; border-radius:50%; background:var(--blue); flex-shrink:0; }
.ai-float-msgs {
  flex:1; overflow-y:auto; padding:10px 12px;
  display:flex; flex-direction:column; gap:8px;
}
.ai-float-msgs::-webkit-scrollbar { width:3px; }
.ai-float-msgs::-webkit-scrollbar-thumb { background:var(--bd); border-radius:2px; }
.ai-bubble {
  max-width:88%; padding:9px 11px;
  border-radius:12px; font-size:12px; line-height:1.55;
  animation:bubblein .18s ease-out;
}
@keyframes bubblein { 0%{opacity:0;transform:translateY(6px)} 100%{opacity:1;transform:translateY(0)} }
.ai-bubble.sys  { background:var(--bg-u); color:var(--txt3); font-style:italic; border:1px solid var(--bd); border-radius:8px; max-width:100%; font-size:11px; }
.ai-bubble.user { background:rgba(59,158,255,.15); border:1px solid rgba(59,158,255,.25); color:var(--txt); align-self:flex-end; border-bottom-right-radius:3px; }
.ai-bubble.bot  { background:var(--bg-c); border:1px solid var(--bd); color:var(--txt); align-self:flex-start; border-bottom-left-radius:3px; }
.ai-bubble.bot strong { color:var(--teal); font-weight:600; }
.ai-typing { display:flex; gap:4px; padding:9px 11px; background:var(--bg-c); border:1px solid var(--bd); border-radius:12px; border-bottom-left-radius:3px; align-self:flex-start; align-items:center; }
.ai-typing span { width:5px; height:5px; border-radius:50%; background:var(--teal); animation:typing 1.2s ease-in-out infinite; }
.ai-typing span:nth-child(2) { animation-delay:.2s; }
.ai-typing span:nth-child(3) { animation-delay:.4s; }
@keyframes typing { 0%,80%,100%{transform:translateY(0);opacity:.35} 40%{transform:translateY(-5px);opacity:1} }
.ai-float-input-row {
  flex-shrink:0; padding:10px 12px;
  border-top:1px solid var(--bd);
  display:flex; gap:6px; align-items:flex-end;
  background:var(--bg-p);
}
.ai-float-input {
  flex:1; background:var(--bg-u); border:1px solid var(--bd);
  border-radius:10px; padding:8px 10px;
  color:var(--txt); font-size:12px; outline:none; resize:none;
  font-family:'DM Sans',sans-serif; line-height:1.4; max-height:80px;
  transition:border-color .15s;
}
.ai-float-input:focus { border-color:rgba(0,229,192,.5); }
.ai-float-input::placeholder { color:var(--txt4); }
.ai-float-send {
  width:34px; height:34px; border-radius:50%; flex-shrink:0;
  background:var(--teal); border:none; cursor:pointer;
  display:flex; align-items:center; justify-content:center;
  font-size:15px; color:var(--bg); font-weight:700; transition:all .15s;
}
.ai-float-send:hover { filter:brightness(1.15); transform:scale(1.05); }
.ai-float-send:disabled { background:var(--bg-u); border:1px solid var(--bd); color:var(--txt4); cursor:not-allowed; transform:none; }
.ai-float-footer {
  padding:5px 14px; border-top:1px solid rgba(26,53,85,.4);
  display:flex; align-items:center; justify-content:center; gap:6px; flex-shrink:0;
}
.ai-model-badge {
  font-family:'JetBrains Mono',monospace; font-size:9px;
  background:var(--bg-u); border:1px solid var(--bd); border-radius:20px;
  padding:2px 8px; color:var(--txt4);
}

/* ── BOTTOM BAR (Layout stepper) ── */
.botbar {
  position:fixed; bottom:0; left:var(--w-icon); right:0; height:var(--h-bot);
  background:var(--bg-p); border-top:1px solid var(--bd);
  display:flex; align-items:center; padding:0 16px; gap:8px; z-index:200;
}
.step-dots { display:flex; align-items:center; gap:4px; margin:0 auto; }
.step-dot { width:8px; height:8px; border-radius:50%; cursor:pointer; flex-shrink:0; transition:all .2s; }
.step-dot.done    { background:var(--teal);   box-shadow:0 0 4px rgba(0,229,192,.4); }
.step-dot.current { background:var(--blue);   box-shadow:0 0 6px rgba(59,158,255,.5); width:10px; height:10px; }
.step-dot.partial { background:var(--orange); }
.step-dot.alert   { background:var(--coral); }
.step-dot.empty   { background:var(--txt4); }
.bot-lbl  { font-size:11px; color:var(--txt3); white-space:nowrap; }
.cur-lbl  { font-size:12px; color:var(--txt);  font-weight:500; white-space:nowrap; }

/* ── MAIN CONTENT AREA ── */
.main-wrap {
  margin-left: calc(var(--w-icon) + var(--w-csb));
  margin-right: 0;
  margin-top: var(--h-top);
  margin-bottom: var(--h-bot);
  overflow-y: auto;
  min-height: calc(100vh - var(--h-top) - var(--h-bot));
}
.main-wrap::-webkit-scrollbar { width:4px; }
.main-wrap::-webkit-scrollbar-thumb { background:var(--bd); border-radius:2px; }
.main-inner { padding:20px 22px 32px; display:flex; flex-direction:column; gap:16px; }

/* ── CHART CONTENT COMPONENTS ── */
.section-box { background:var(--bg-p); border:1px solid var(--bd); border-radius:var(--rl); padding:16px 18px; }
.sec-header { display:flex; align-items:center; gap:10px; margin-bottom:14px; }
.sec-icon { font-size:18px; }
.sec-title { font-family:'Playfair Display',serif; font-size:17px; font-weight:600; color:var(--txt); }
.sec-sub { font-size:12px; color:var(--txt3); margin-top:1px; }
.grid-4 { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; }
.grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
.stat-card { background:var(--bg-c); border:1px solid var(--bd); border-radius:var(--rl); padding:12px 14px; display:flex; flex-direction:column; gap:4px; }
.stat-val { font-family:'JetBrains Mono',monospace; font-size:22px; font-weight:600; line-height:1; }
.stat-lbl { font-size:10px; color:var(--txt3); text-transform:uppercase; letter-spacing:.05em; }
.stat-sub-s { font-size:11px; color:var(--txt4); margin-top:2px; }
.t-teal { color:var(--teal); } .t-blue { color:var(--blue); }
.t-coral { color:var(--coral); } .t-gold { color:var(--gold); }
.divider { height:1px; background:var(--bd); margin:7px 0; }
.badge { font-size:11px; font-family:'JetBrains Mono',monospace; padding:2px 9px; border-radius:20px; font-weight:600; white-space:nowrap; }
.badge-teal   { background:rgba(0,229,192,.12);  color:var(--teal);   border:1px solid rgba(0,229,192,.3); }
.badge-blue   { background:rgba(59,158,255,.12); color:var(--blue);   border:1px solid rgba(59,158,255,.3); }
.badge-gold   { background:rgba(245,200,66,.12); color:var(--gold);   border:1px solid rgba(245,200,66,.3); }
.badge-coral  { background:rgba(255,107,107,.15);color:var(--coral);  border:1px solid rgba(255,107,107,.3); }
.badge-orange { background:rgba(255,159,67,.12); color:var(--orange); border:1px solid rgba(255,159,67,.3); }
.badge-muted  { background:rgba(74,106,138,.2);  color:var(--txt3);   border:1px solid var(--bd); }
.tab-bar { display:flex; gap:2px; border-bottom:1px solid var(--bd); margin-bottom:14px; }
.tab { padding:6px 14px; font-size:12px; color:var(--txt3); cursor:pointer; border-bottom:2px solid transparent; transition:all .15s; margin-bottom:-1px; }
.tab:hover { color:var(--txt2); }
.tab.active { color:var(--blue); border-bottom-color:var(--blue); font-weight:600; }
.timeline { display:flex; flex-direction:column; }
.tl-item { display:flex; gap:12px; }
.tl-spine { display:flex; flex-direction:column; align-items:center; width:20px; flex-shrink:0; }
.tl-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; margin-top:4px; }
.tl-line { flex:1; width:1px; background:var(--bd); min-height:16px; }
.tl-body { padding-bottom:14px; flex:1; }
.tl-time { font-size:10px; color:var(--txt4); font-family:'JetBrains Mono',monospace; }
.tl-event { font-size:12px; color:var(--txt); font-weight:500; }
.tl-detail { font-size:11px; color:var(--txt3); margin-top:2px; line-height:1.45; }
.prob-row { display:flex; align-items:center; gap:10px; padding:8px 10px; border-radius:var(--r); border:1px solid transparent; transition:all .15s; }
.prob-row:hover { background:var(--bg-u); border-color:var(--bd); }
.prob-icd { font-family:'JetBrains Mono',monospace; font-size:10px; color:var(--txt4); min-width:64px; }
.prob-name { font-size:12px; color:var(--txt); flex:1; }
.prob-onset { font-size:11px; color:var(--txt3); }
.med-row { display:flex; align-items:center; gap:10px; padding:8px 10px; border-radius:var(--r); border:1px solid transparent; transition:all .15s; }
.med-row:hover { background:var(--bg-u); border-color:var(--bd); }
.med-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
.med-name { font-size:12px; color:var(--txt); font-weight:500; flex:1; }
.med-dose { font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--blue); }
.med-freq { font-size:11px; color:var(--txt3); }
.med-route { font-size:10px; background:var(--bg-u); border:1px solid var(--bd); border-radius:4px; padding:1px 6px; color:var(--txt3); font-family:'JetBrains Mono',monospace; }
.med-time { font-size:11px; color:var(--txt4); margin-left:auto; white-space:nowrap; }
.panel-title { font-size:11px; color:var(--txt3); text-transform:uppercase; letter-spacing:.05em; font-weight:600; margin-bottom:8px; }
.lab-table { width:100%; border-collapse:collapse; }
.lab-table th { font-size:10px; color:var(--txt3); text-transform:uppercase; letter-spacing:.05em; padding:6px 8px; text-align:left; border-bottom:1px solid var(--bd); }
.lab-table td { font-size:12px; padding:7px 8px; border-bottom:1px solid rgba(26,53,85,.5); vertical-align:middle; }
.lab-table tr:last-child td { border-bottom:none; }
.lab-table tr:hover td { background:rgba(14,37,68,.5); }
.lab-val { font-family:'JetBrains Mono',monospace; font-weight:600; }
.lab-val.hi { color:var(--coral); } .lab-val.lo { color:var(--blue); } .lab-val.ok { color:var(--teal); }
.lab-ref { font-size:10px; color:var(--txt4); font-family:'JetBrains Mono',monospace; }
.lab-flag { width:10px; height:10px; border-radius:50%; display:inline-block; }
.lab-flag.hi { background:var(--coral); box-shadow:0 0 5px rgba(255,107,107,.5); }
.lab-flag.lo { background:var(--blue);  box-shadow:0 0 5px rgba(59,158,255,.5); }
.lab-flag.ok { background:var(--teal);  box-shadow:0 0 5px rgba(0,229,192,.4); }
.img-card { background:var(--bg-c); border:1px solid var(--bd); border-radius:var(--rl); padding:12px 14px; display:flex; gap:12px; align-items:flex-start; cursor:pointer; transition:border-color .15s; }
.img-card:hover { border-color:var(--bd-hi); }
.img-icon { font-size:28px; flex-shrink:0; line-height:1; }
.img-title { font-size:13px; font-weight:600; color:var(--txt); }
.img-meta { font-size:11px; color:var(--txt3); margin-top:2px; }
.img-finding { font-size:12px; color:var(--txt2); margin-top:6px; line-height:1.5; background:var(--bg-u); border-left:2px solid var(--bd-hi); padding:6px 8px; }
.allergy-tag { display:inline-flex; align-items:center; gap:5px; background:rgba(255,107,107,.1); border:1px solid rgba(255,107,107,.3); border-radius:20px; padding:3px 10px; font-size:11px; color:var(--coral); font-weight:600; }
.allergy-tag .sev { font-size:9px; color:rgba(255,107,107,.6); text-transform:uppercase; letter-spacing:.05em; }
.allergy-tag.moderate { background:rgba(255,159,67,.08); border-color:rgba(255,159,67,.25); color:var(--orange); }
.allergy-tag.moderate .sev { color:rgba(255,159,67,.6); }
.allergy-tag.mild { background:rgba(74,106,138,.2); border-color:var(--bd); color:var(--txt3); }
.allergy-tag.mild .sev { color:var(--txt4); }
.note-preview { background:var(--bg-u); border:1px solid var(--bd); border-radius:var(--r); padding:10px 12px; font-size:12px; color:var(--txt2); line-height:1.75; white-space:pre-wrap; }
.btn-ghost {
  background:var(--bg-u); border:1px solid var(--bd); border-radius:6px;
  padding:4px 10px; font-size:11px; color:var(--txt2); cursor:pointer;
  display:inline-flex; align-items:center; gap:4px; white-space:nowrap; transition:all .15s;
  font-family:'DM Sans',sans-serif;
}
.btn-ghost:hover { border-color:var(--bd-hi); color:var(--txt); }
.btn-teal {
  background:var(--teal); color:var(--bg); border:none; border-radius:6px;
  padding:4px 12px; font-size:11px; font-weight:600; cursor:pointer;
  display:inline-flex; align-items:center; gap:4px; white-space:nowrap;
  font-family:'DM Sans',sans-serif;
}
.btn-teal:hover { filter:brightness(1.15); }
.btn-blue { background:var(--blue); color:#fff; border:none; border-radius:6px; padding:4px 12px; font-size:11px; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; gap:4px; font-family:'DM Sans',sans-serif; }
.btn-coral {
  background:rgba(255,107,107,.15); color:var(--coral); border:1px solid rgba(255,107,107,.3);
  border-radius:6px; padding:4px 12px; font-size:11px; font-weight:600; cursor:pointer;
  display:inline-flex; align-items:center; gap:4px; white-space:nowrap;
  font-family:'DM Sans',sans-serif;
}
.btn-coral:hover { background:rgba(255,107,107,.25); }
.demo-banner {
  position:fixed; top:0; left:50%; transform:translateX(-50%); z-index:999;
  background:rgba(245,200,66,.12); border:1px solid rgba(245,200,66,.4); border-top:none;
  border-radius:0 0 8px 8px; padding:3px 14px; font-size:10px; color:#f5c842;
  font-family:'JetBrains Mono',monospace; display:flex; align-items:center; gap:8px; cursor:pointer;
}
`;

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════ */
export default function NotryaApp({ embedded = false, patientName = null, demo = null, vitals = null, medications = null, allergies = null, pmhSelected = null }) {
  const navigate = useNavigate();
  
  // Merge passed data with DEMO fallback
  const mergedVitals = vitals && Object.keys(vitals).length > 0 ? {
    bp: vitals.bp || DEMO.vitals.bp,
    hr: vitals.hr || DEMO.vitals.hr,
    rr: vitals.rr || DEMO.vitals.rr,
    spo2: vitals.spo2 || DEMO.vitals.spo2,
    temp: vitals.temp || DEMO.vitals.temp,
    gcs: vitals.gcs || DEMO.vitals.gcs,
    recorded: new Date(),
  } : DEMO.vitals;
  
  const mergedMeds = medications && medications.length > 0 
    ? medications.map(m => ({ name: m, dose: "—", freq: "—", route: "—", status: "home" }))
    : DEMO.meds;
  
  const mergedAllergies = allergies && allergies.length > 0
    ? allergies.map(a => ({ allergen: a, severity: "unknown", reaction: "—", confirmed: null }))
    : DEMO.allergies;
  
  const mergedPatient = demo ? {
    firstName: demo.firstName || DEMO.patient.firstName,
    lastName: demo.lastName || DEMO.patient.lastName,
    dob: demo.dob || DEMO.patient.dob,
    sex: demo.sex || DEMO.patient.sex,
    mrn: demo.mrn || DEMO.patient.mrn,
    room: "—",
    cc: demo.cc?.text || DEMO.patient.cc,
    status: "MONITORING",
    triage: "ESI-2",
  } : DEMO.patient;
  
  const { patient: P, vitals: V, timeline: TL, problems: PR,
          allergies: AL, meds: ME, labs: LA, imaging: IM, note: NOTE } = {
    ...DEMO,
    patient: mergedPatient,
    vitals: mergedVitals,
    allergies: mergedAllergies,
    meds: mergedMeds,
    problems: pmhSelected && Object.keys(pmhSelected).length > 0 
      ? Object.keys(pmhSelected).filter(k => pmhSelected[k] > 0).map(k => ({ icd: "—", name: k, status: "active", onset: new Date() }))
      : DEMO.problems,
  };

  const [clock, setClock]             = useState("");
  const [banner, setBanner]           = useState(true);
  const [activeNav, setActiveNav]     = useState(0);
  const [activeSection, setActiveSection] = useState("s-overview");
  const [tabs, setTabs]               = useState({ problems: "active", meds: "ed" });
  const [aiOpen, setAiOpen]           = useState(false);
  const [aiMsgs, setAiMsgs]           = useState([{ role: "sys", text: "👋 Hi Dr. Skiba — I have full context on this patient. Ask me anything." }]);
  const [aiInput, setAiInput]         = useState("");
  const [aiLoading, setAiLoading]     = useState(false);
  const [unread, setUnread]           = useState(1);
  const msgsRef = useRef(null);

  useEffect(() => {
    const tick = () => { const d = new Date(); setClock(`${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`); };
    tick(); const t = setInterval(tick, 10000); return () => clearInterval(t);
  }, []);

  useEffect(() => { if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight; }, [aiMsgs]);

  const scrollTo = id => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const isNavActive = (gi, ii) => {
    const idx = CHART_GROUPS.slice(0, gi).reduce((a, g) => a + g.items.length, 0) + ii;
    return idx === activeNav;
  };

  const activeProbs  = PR.filter(p => p.status === "active");
  const histProbs    = PR.filter(p => p.status !== "active");
  const edMeds       = ME.filter(m => m.status === "ed");
  const homeMeds     = ME.filter(m => m.status === "home");
  const heldMeds     = ME.filter(m => m.status === "held");
  const critLabs     = LA.filter(l => l.flag === "hi" || l.flag === "lo");
  const todayDx      = PR.filter(p => isToday(p.onset));
  const labPanels    = LA.reduce((acc, l) => { if (!acc[l.panel]) acc[l.panel] = []; acc[l.panel].push(l); return acc; }, {});
  const curNavLabel  = ALL_ITEMS[activeNav]?.label || "Patient Chart";
  const prevNavLabel = activeNav > 0 ? ALL_ITEMS[activeNav - 1]?.label : "";

  const sendAI = async q => {
    const question = (q || aiInput).trim();
    if (!question || aiLoading) return;
    setAiInput("");
    setUnread(0);
    setAiMsgs(prev => [...prev, { role: "user", text: question }]);
    setAiLoading(true);
    try {
      const { base44 } = await import("@/api/base44Client");
      const text = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Notrya AI, a concise ED clinical assistant. Patient: ${P.firstName} ${P.lastName}, ${calcAge(P.dob)}y/o ${P.sex}, CC: ${P.cc}. Diagnoses: NSTEMI, HTN, T2DM, CAD. Critical labs: Troponin-I 0.84 (ref <0.04), BNP 812, K+ 5.4, Glucose 218. Meds given: Aspirin 325mg, Heparin drip, Ticagrelor 180mg. Allergies: Penicillin (anaphylaxis), Iodinated Contrast (urticaria), Codeine (nausea). Vitals: BP ${V.bp}, HR ${V.hr}, SpO2 ${V.spo2}%. Respond in 2-4 concise clinical sentences.\n\nQuestion: ${question}`,
      });
      setAiMsgs(prev => [...prev, { role: "bot", text: typeof text === "string" ? text : JSON.stringify(text) }]);
      if (!aiOpen) setUnread(n => n + 1);
    } catch {
      setAiMsgs(prev => [...prev, { role: "sys", text: "⚠ AI error — check connection." }]);
    }
    setAiLoading(false);
  };

  const openAI = () => { setAiOpen(true); setUnread(0); };

  return (
    <div className="notrya" style={{ minHeight: "100vh", position: "relative", '--w-icon': embedded ? '0px' : '56px' }}>
      <style>{CSS}</style>

      {banner && (
        <div className="demo-banner" onClick={() => setBanner(false)}>
          ⚡ DEMO MODE — <span style={{ opacity: .7 }}>click to dismiss</span> <span style={{ opacity: .5 }}>✕</span>
        </div>
      )}

      {/* ICON SIDEBAR — hidden when embedded in Layout */}
      {!embedded && (
      <aside className="isb">
        <div className="isb-logo"><div className="isb-box">Pc</div></div>
        <div className="isb-scroll">
          {APP_ICONS.map((item, i) => (
            <div key={i} className={`isb-btn${i === 0 ? " active" : ""}`} title={item.label}>
              <span>{item.icon}</span>
              <span className="isb-lbl">{item.label}</span>
            </div>
          ))}
        </div>
        <div className="isb-foot">
          <div className="isb-btn" title="Settings"><span>⚙️</span><span className="isb-lbl">Settings</span></div>
        </div>
      </aside>
      )}

      {/* TOP BAR — hidden when embedded */}
      {!embedded && (
      <header className="topbar">
        <div className="row1">
          <span className="welcome">Welcome, <strong>{DEMO.user.name}</strong></span>
          <div className="vsep" />
          {[
            [DEMO.shift.active,  "Active",  false],
            [DEMO.shift.pending, "Pending", true],
            [DEMO.shift.orders,  "Orders",  false],
            [DEMO.shift.hours,   "Hours",   false],
          ].map(([v, l, a]) => (
            <div key={l} className="stat-pill">
              <span className={`stat-v${a ? " alert" : ""}`}>{v}</span>
              <span className="stat-l">{l}</span>
            </div>
          ))}
          <div className="r1-right">
            <div className="clock">{clock}</div>
            <div className="ai-on"><div className="ai-dot" /> AI ON</div>
            <button className="btn-newpt">+ New Patient</button>
          </div>
        </div>
        <div className="row2">
          <span className="chart-badge">PT-{P.mrn}</span>
          <span className="pt-name">{P.lastName}, {P.firstName}</span>
          <span className="pt-meta">{calcAge(P.dob)} y/o · {P.sex} · {fmtDate(P.dob)}</span>
          <span className="pt-cc">CC: {P.cc}</span>
          <div className="vsep" />
          {[
            ["BP",   V.bp,           vitalFlag(V.bp,   { hi: 140 })],
            ["HR",   V.hr,           vitalFlag(V.hr,   { hi: 100, lo: 50 })],
            ["RR",   V.rr,           vitalFlag(V.rr,   { hi: 20,  lo: 10 })],
            ["SpO₂", V.spo2 + "%",   vitalFlag(V.spo2, { lo: 95 })],
            ["T",    V.temp,         "val"],
            ["GCS",  V.gcs,          "val"],
          ].map(([lbl, val, cls]) => (
            <div key={lbl} className="vital">
              <span className="lbl">{lbl}</span>
              <span className={cls}>{val}</span>
            </div>
          ))}
          <div className="vsep" />
          <span className="status-badge">{P.status}</span>
          <span className="room-badge">Room {P.room}</span>
          <div className="chart-actions">
            <button className="btn-ghost">📋 Orders</button>
            <button className="btn-ghost">📝 SOAP Note</button>
            <button className="btn-coral">🚪 Discharge</button>
            <button className="btn-teal">💾 Save Chart</button>
          </div>
        </div>
      </header>
      )}

      {/* CHART SECTION SIDEBAR — hidden when embedded */}
      {!embedded && (
      <aside className="csb">
        <div className="csb-pt-card">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div className="pt-avatar">{P.firstName[0]}{P.lastName[0]}</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.txt }}>{P.lastName}, {P.firstName}</div>
              <div style={{ fontSize: 11, color: T.txt3 }}>MRN {P.mrn}</div>
            </div>
          </div>
          <div className="divider" />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
            <span style={{ color: T.txt3 }}>Triage</span>
            <span className={`badge ${triageCls(P.triage)}`} style={{ fontSize: 9, padding: "1px 5px" }}>{P.triage}</span>
          </div>
        </div>
        {CHART_GROUPS.map((group, gi) => (
          <div key={gi}>
            {gi > 0 && <div className="csb-div" />}
            <div className="csb-group">{group.label}</div>
            {group.items.map((item, ii) => {
              const globalIdx = CHART_GROUPS.slice(0, gi).reduce((a, g) => a + g.items.length, 0) + ii;
              return (
                <div key={ii} className={`csb-item${isNavActive(gi, ii) ? " active" : ""}`} onClick={() => { setActiveNav(globalIdx); if (item.page) navigate(item.page); }}>
                  <span className="csb-icon">{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  <span className={`csb-dot ${item.dot}`} />
                </div>
              );
            })}
          </div>
        ))}
        <div className="csb-div" />
        <div className="csb-group">Flags</div>
        {critLabs.length > 0 && (
          <div className="flag-card" style={{ borderColor: "rgba(255,107,107,.25)" }}>
            <div style={{ fontSize: 11, color: T.coral, fontWeight: 600 }}>🚨 Critical Results</div>
            <div style={{ fontSize: 11, color: T.txt3, marginTop: 6 }}>
              {critLabs.slice(0, 3).map(l => l.name + (l.flag === "hi" ? " ▲" : " ▼")).join(" · ")}
            </div>
          </div>
        )}
        {todayDx.length > 0 && (
          <div className="flag-card" style={{ borderColor: "rgba(255,159,67,.25)", marginTop: 4 }}>
            <div style={{ fontSize: 11, color: T.orange, fontWeight: 600 }}>⚕️ New Dx Today</div>
            <div style={{ fontSize: 11, color: T.txt3, marginTop: 6 }}>{todayDx.map(p => p.name).join(", ")}</div>
          </div>
        )}
      </aside>
      )}

      {/* FLOATING AI CHATBOT */}
      {!aiOpen && <div className="ai-fab-ring" />}
      <button className={`ai-fab${aiOpen ? " open" : ""}`} onClick={() => aiOpen ? setAiOpen(false) : openAI()} title="Notrya AI">
        {aiOpen ? "✕" : "🤖"}
        {!aiOpen && unread > 0 && <span className="ai-fab-badge">{unread}</span>}
      </button>

      {aiOpen && (
        <div className="ai-float">
          <div className="ai-float-hdr">
            <div className="ai-float-hdr-top">
              <div className="ai-float-avatar">🤖</div>
              <div>
                <div className="ai-float-name">Notrya AI</div>
                <div className="ai-float-status"><div className="ai-dot" /> Live · Powered by AI</div>
              </div>
              <div className="ai-float-close" onClick={() => setAiOpen(false)}>✕</div>
            </div>
            <div className="ai-float-chips">
              {[
                ["📋 Summarize",  "Summarize this patient chart in 3 bullet points."],
                ["💊 Drug Check", "Check for drug interactions in the current med list."],
                ["🔍 Workup",     "What additional workup should be considered?"],
                ["🚪 Dispo",      "Suggest disposition and next steps."],
                ["📚 Guidelines", "What guidelines apply to this NSTEMI presentation?"],
              ].map(([lbl, q]) => (
                <button key={lbl} className="ai-chip" onClick={() => sendAI(q)}>{lbl}</button>
              ))}
            </div>
          </div>
          <div className="ai-ctx-pill">
            <div className="ai-ctx-dot" />
            <span>{P.lastName}, {P.firstName} · {calcAge(P.dob)}y · {P.cc} · Troponin 0.84 ▲</span>
          </div>
          <div className="ai-float-msgs" ref={msgsRef}>
            {aiMsgs.map((m, i) => (
              <div key={i} className={`ai-bubble ${m.role}`}>{m.text}</div>
            ))}
            {aiLoading && (
              <div className="ai-typing"><span /><span /><span /></div>
            )}
          </div>
          <div className="ai-float-input-row">
            <textarea
              className="ai-float-input"
              rows={1}
              placeholder="Ask about this patient…"
              value={aiInput}
              onChange={e => setAiInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAI(); } }}
            />
            <button className="ai-float-send" onClick={() => sendAI()} disabled={aiLoading || !aiInput.trim()}>↑</button>
          </div>
          <div className="ai-float-footer">
            <span className="ai-model-badge">Powered by Notrya AI</span>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="main-wrap" style={embedded ? { marginLeft: 0, marginTop: 0, marginBottom: 0, position: 'static', overflow: 'visible', minHeight: 'unset' } : {}}>
        <div className="main-inner">

          <div id="s-overview" className="grid-4">
            {[
              ["Blood Pressure", V.bp,        vitalCls("bp", V.bp), V.bp > 140 ? "↑ Hypertensive" : "Normal"],
              ["Heart Rate",     V.hr,        vitalCls("hr", V.hr), V.hr > 100 ? "Tachycardic" : "Normal"],
              ["SpO₂",          V.spo2 + "%", parseFloat(V.spo2) < 95 ? "t-blue" : "t-teal", "Last " + timeAgo(V.recorded)],
              ["Temperature",   V.temp,       "t-teal", "GCS " + V.gcs],
            ].map(([lbl, val, cls, sub]) => (
              <div key={lbl} className="stat-card">
                <div className={`stat-val ${cls}`}>{val}</div>
                <div className="stat-lbl">{lbl}</div>
                <div className="stat-sub-s">{sub}</div>
              </div>
            ))}
          </div>

          <div className="section-box" id="s-timeline">
            <div className="sec-header">
              <span className="sec-icon">🕐</span>
              <div><div className="sec-title">Visit Timeline</div><div className="sec-sub">{TL.length} events</div></div>
              <button className="btn-ghost" style={{ marginLeft: "auto" }}>+ Add Event</button>
            </div>
            <div className="timeline">
              {TL.map((e, i) => (
                <div key={i} className="tl-item">
                  <div className="tl-spine">
                    <div className="tl-dot" style={{ background: TL_COLORS[e.type] || T.txt4, ...(e.type === "critical" && { boxShadow: "0 0 8px rgba(255,107,107,.6)" }) }} />
                    {i < TL.length - 1 && <div className="tl-line" />}
                  </div>
                  <div className="tl-body">
                    <div className="tl-time">{fmtTime(e.time)}</div>
                    <div className="tl-event">{e.title}</div>
                    {e.detail && <div className="tl-detail">{e.detail}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid-2">
            <div className="section-box" id="s-problems">
              <div className="sec-header">
                <span className="sec-icon">🏷️</span>
                <div><div className="sec-title">Problem List</div><div className="sec-sub">Active & historical</div></div>
                <button className="btn-ghost" style={{ marginLeft: "auto" }}>+ Add</button>
              </div>
              <div className="tab-bar">
                <div className={`tab${tabs.problems === "active" ? " active" : ""}`} onClick={() => setTabs(t => ({ ...t, problems: "active" }))}>Active ({activeProbs.length})</div>
                <div className={`tab${tabs.problems === "hx" ? " active" : ""}`} onClick={() => setTabs(t => ({ ...t, problems: "hx" }))}>Historical ({histProbs.length})</div>
              </div>
              {(tabs.problems === "active" ? activeProbs : histProbs).map(p => (
                <div key={p.icd} className="prob-row">
                  <span className="prob-icd">{p.icd}</span>
                  <span className="prob-name">
                    {p.name}
                    {isToday(p.onset) && <span className="badge badge-coral" style={{ fontSize: 9, marginLeft: 4 }}>TODAY</span>}
                  </span>
                  <span className="prob-onset">{typeof p.onset === "string" && p.onset.length === 4 ? p.onset : fmtDate(p.onset)}</span>
                </div>
              ))}
            </div>

            <div className="section-box" id="s-allergies">
              <div className="sec-header">
                <span className="sec-icon">⚠️</span>
                <div><div className="sec-title">Allergies</div><div className="sec-sub">Documented reactions</div></div>
                <button className="btn-ghost" style={{ marginLeft: "auto" }}>+ Add</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {AL.map((a, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <div className={`allergy-tag${a.severity === "moderate" ? " moderate" : a.severity === "mild" ? " mild" : ""}`}>
                      ⚠ {a.allergen} <span className="sev">· {a.severity} · {a.reaction}</span>
                    </div>
                    <span style={{ fontSize: 11, color: T.txt4, whiteSpace: "nowrap" }}>
                      {a.confirmed ? "Confirmed " + fmtDate(a.confirmed) : "Patient-reported"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="section-box" id="s-meds">
            <div className="sec-header">
              <span className="sec-icon">💊</span>
              <div><div className="sec-title">Medications</div><div className="sec-sub">Home meds + ED administration record</div></div>
              <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                <button className="btn-ghost">📋 Reconcile</button>
                <button className="btn-ghost">+ Add</button>
              </div>
            </div>
            <div className="tab-bar">
              <div className={`tab${tabs.meds === "ed" ? " active" : ""}`} onClick={() => setTabs(t => ({ ...t, meds: "ed" }))}>ED Given ({edMeds.length})</div>
              <div className={`tab${tabs.meds === "home" ? " active" : ""}`} onClick={() => setTabs(t => ({ ...t, meds: "home" }))}>Home ({homeMeds.length})</div>
              <div className={`tab${tabs.meds === "held" ? " active" : ""}`} onClick={() => setTabs(t => ({ ...t, meds: "held" }))}>Held ({heldMeds.length})</div>
            </div>
            {(tabs.meds === "ed" ? edMeds : tabs.meds === "home" ? homeMeds : heldMeds).map((m, i) => (
              <div key={i} className="med-row">
                <div className="med-dot" style={{ background: tabs.meds === "ed" ? T.teal : tabs.meds === "held" ? T.coral : T.border }} />
                <span className="med-name">{m.name}</span>
                <span className="med-dose">{m.dose}</span>
                <span className="med-freq">{m.freq}</span>
                <span className="med-route">{m.route}</span>
                {m.time && <span className="med-time">{fmtTime(m.time)}{m.by ? " · " + m.by : ""}</span>}
              </div>
            ))}
          </div>

          <div className="section-box" id="s-labs">
            <div className="sec-header">
              <span className="sec-icon">🧪</span>
              <div><div className="sec-title">Laboratory Results</div><div className="sec-sub">Panel collected {fmtTime(LA[0]?.time)}</div></div>
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
                {critLabs.length > 0 && <span className="badge badge-coral">⚠ {critLabs.length} Critical</span>}
                <button className="btn-ghost">+ Order Labs</button>
              </div>
            </div>
            <div className="grid-2" style={{ gap: 16 }}>
              {Object.entries(labPanels).map(([panel, rows]) => (
                <div key={panel}>
                  <div className="panel-title">{panel}</div>
                  <table className="lab-table">
                    <thead><tr><th></th><th>Test</th><th>Value</th><th>Reference</th><th>Time</th></tr></thead>
                    <tbody>
                      {rows.map((r, i) => (
                        <tr key={i}>
                          <td><span className={`lab-flag ${r.flag}`} /></td>
                          <td style={{ color: T.txt3, fontSize: 12 }}>{r.name}</td>
                          <td><span className={`lab-val ${r.flag}`}>{r.val}</span> <span style={{ fontSize: 11, color: T.txt3 }}>{r.unit}</span></td>
                          <td className="lab-ref">{r.ref}</td>
                          <td style={{ fontSize: 11, color: T.txt4 }}>{fmtTime(r.time)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </div>

          <div className="section-box" id="s-imaging">
            <div className="sec-header">
              <span className="sec-icon">🩻</span>
              <div><div className="sec-title">Imaging</div><div className="sec-sub">Completed and pending studies</div></div>
              <button className="btn-ghost" style={{ marginLeft: "auto" }}>+ Order Study</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {IM.map((s, i) => {
                const statusBadge = { resulted: "badge-teal", pending: "badge-gold" }[s.status] || "badge-muted";
                const statusText  = { resulted: "RESULTED", pending: "IN PROGRESS" }[s.status] || "";
                const icon        = { XR: "🫁", CT: "🧠", MRI: "🧲", ECHO: "❤️", US: "🔊" }[s.mod] || "🩻";
                return (
                  <div key={i} className="img-card">
                    <div className="img-icon">{icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div className="img-title">{s.type}</div>
                        <span className={`badge ${statusBadge}`}>{statusText}</span>
                      </div>
                      <div className="img-meta">Ordered {fmtTime(s.ordered)}{s.resulted ? " · Resulted " + fmtTime(s.resulted) : ""}{s.rad ? " · " + s.rad : ""}</div>
                      <div className="img-finding" style={{ fontStyle: s.finding ? "normal" : "italic", color: s.finding ? T.txt2 : T.txt4 }}>
                        {s.finding || "Results pending."}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="section-box" id="s-note">
            <div className="sec-header">
              <span className="sec-icon">📝</span>
              <div><div className="sec-title">Current Note Draft</div><div className="sec-sub">Auto-assembled — review and sign</div></div>
              <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                <button className="btn-ghost">✨ Regenerate</button>
                <button className="btn-blue">✍ Sign Note</button>
              </div>
            </div>
            <div className="note-preview">{NOTE}</div>
          </div>

        </div>
      </div>

      {/* BOTTOM BAR — hidden when embedded */}
      {!embedded && (
      <footer className="botbar">
        <button className="btn-ghost" onClick={() => setActiveNav(n => Math.max(0, n - 1))}>← Back</button>
        {prevNavLabel && <span className="bot-lbl">{prevNavLabel}</span>}
        <div className="step-dots">
          {ALL_ITEMS.map((item, i) => {
            const isActive  = i === activeNav;
            const dotState  = isActive ? "current" : (CHART_GROUPS.flatMap(g => g.items)[i]?.dot || "empty");
            return (
              <div key={i} className={`step-dot ${dotState}`} title={item.label} onClick={() => setActiveNav(i)} />
            );
          })}
        </div>
        <span className="cur-lbl">{curNavLabel}</span>
        <button className="btn-teal" style={{ padding: "6px 16px", fontSize: 12, fontWeight: 700 }} onClick={() => setActiveNav(n => Math.min(ALL_ITEMS.length - 1, n + 1))}>Next →</button>
      </footer>
      )}

    </div>
  );
}