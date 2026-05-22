import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";

(() => {
  if (document.getElementById("cc-fonts")) return;
  const l = document.createElement("link");
  l.id = "cc-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "cc-css";
  s.textContent = `
    @keyframes cc-fade{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
    .cc-fade{animation:cc-fade .16s ease forwards}
    @keyframes modal-in{from{opacity:0;transform:scale(0.95) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}
    .modal-in{animation:modal-in .2s cubic-bezier(.22,.68,0,1.15) forwards}
    @keyframes cc-spin{to{transform:rotate(360deg)}}
    @keyframes pulse-red{0%,100%{opacity:1}50%{opacity:0.45}}
    .pulse-red{animation:pulse-red 1.6s ease-in-out infinite}
    @keyframes drawer-in{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
    .drawer-in{animation:drawer-in .22s cubic-bezier(.22,.68,0,1.15) forwards}
  `;
  document.head.appendChild(s);
})();

// ─── TOKENS ───────────────────────────────────────────────────────────────────
const T = {
  bg:"#050f1e",panel:"#081628",card:"#0b1e36",
  txt:"#f2f7ff",txt2:"#b8d4f0",txt3:"#82aece",txt4:"#5a82a8",
  teal:"#00e5c0",gold:"#f5c842",coral:"#ff6b6b",blue:"#3b9eff",
  orange:"#ff9f43",purple:"#9b6dff",green:"#3dffa0",red:"#ff4444",cyan:"#00d4ff",
};

// ─── NAVIGATION ───────────────────────────────────────────────────────────────
const nav = (page, params = {}) => {
  const query = Object.keys(params).length
    ? "?" + new URLSearchParams(params).toString()
    : "";
  window.location.href = `/${page}${query}`;
};

const CURRENT_USER = "Skiba";

// ─── COMMAND PALETTE DATA ─────────────────────────────────────────────────────
const HUBS = [
  { key:"ECGHub",                 label:"ECG Interpreter",           icon:"💓", cat:"Clinical" },
  { key:"AirwayHub",              label:"Airway Management",          icon:"🫁", cat:"Clinical" },
  { key:"ShockHub",               label:"Shock Hub",                  icon:"⚡", cat:"Clinical" },
  { key:"SepsisHub",              label:"Sepsis Protocol",            icon:"🦠", cat:"Clinical" },
  { key:"StrokeHub",              label:"Stroke Assessment",          icon:"🧠", cat:"Clinical" },
  { key:"ToxicologyHub",          label:"Toxicology",                 icon:"☣️", cat:"Clinical" },
  { key:"PsychHub",               label:"Psych Evaluation",           icon:"🧩", cat:"Clinical" },
  { key:"OrthoHub",               label:"Ortho Reference",            icon:"🦴", cat:"Clinical" },
  { key:"CardiacRiskPage",        label:"Cardiac Risk Calc",          icon:"❤️", cat:"Clinical" },
  { key:"POCUSHub",               label:"POCUS Guide",                icon:"🔊", cat:"Clinical" },
  { key:"DermatologyHub",         label:"Dermatology",                icon:"🔬", cat:"Clinical" },
  { key:"ElectrolyteAcidBaseHub", label:"Electrolytes & Acid-Base",   icon:"⚗️", cat:"Clinical" },
  { key:"TriageHub",              label:"Triage Tools",               icon:"🏥", cat:"Workflow" },
  { key:"RapidAssessmentHub",     label:"Rapid Assessment",           icon:"🚀", cat:"Workflow" },
  { key:"ERxHub",                 label:"ED Prescribing",             icon:"💊", cat:"Workflow" },
  { key:"OrderGeneratorHub",      label:"Order Generator",            icon:"📋", cat:"Workflow" },
  { key:"AutocoderHub",           label:"Auto-Coder / ICD-10",        icon:"🏷️", cat:"Workflow" },
  { key:"ImagingInterpreter",     label:"Imaging Interpreter",        icon:"🩻", cat:"Workflow" },
  { key:"NewPatientInput",        label:"Full Intake (NPI)",          icon:"📝", cat:"Documentation" },
  { key:"QuickNote",              label:"Quick Note",                 icon:"✏️", cat:"Documentation" },
];

const paletteFilter = (query, patients) => {
  const q = query.toLowerCase().trim();
  const match = (strs) => !q || strs.some(s => (s||"").toLowerCase().includes(q));
  const actions = [
    { key:"act-qn",  label:"Quick Note",     sub:"Fast bedside documentation",  icon:"✏️", badge:"Action", badgeColor:T.teal,   execute:() => nav("QuickNote")      },
    { key:"act-np",  label:"New Patient",    sub:"Open patient mode selector",  icon:"➕", badge:"Action", badgeColor:T.gold,   execute:"__newPatient__"             },
    { key:"act-cc",  label:"Command Center", sub:"Return to census board",      icon:"⚡", badge:"Action", badgeColor:T.purple, execute:() => nav("CommandCenter")  },
  ].filter(a => match([a.label, a.sub]));
  const pts = patients
    .filter(p => match([p.name, p.cc, p.room, `esi ${p.esi}`, `${p.age}${p.sex}`]))
    .sort((a, b) => a.esi - b.esi)
    .slice(0, q ? 6 : 4);
  const hubs = HUBS
    .filter(h => match([h.label, h.key, h.cat]))
    .slice(0, q ? 10 : 5);
  return { actions, pts, hubs };
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const esiColor = (n) => ({1:T.red,2:T.orange,3:T.gold,4:T.green,5:T.txt4}[n]||T.txt4);
const fmtTime  = (m) => m < 60 ? `${m}m` : `${Math.floor(m/60)}h ${m%60}m`;
const gc       = (x={}) => ({ background:T.card, border:"1px solid rgba(26,53,85,0.5)", borderRadius:10, ...x });

// ─── RESULT CHIPS ─────────────────────────────────────────────────────────────
const CHIP_STYLE = {
  pending:  { color:T.gold,   marker:"⏳", bg:"rgba(245,200,66,0.08)",   border:"rgba(245,200,66,0.38)"   },
  resulted: { color:T.teal,   marker:"✓",  bg:"rgba(0,229,192,0.07)",   border:"rgba(0,229,192,0.38)"    },
  critical: { color:T.red,    marker:"!",  bg:"rgba(255,68,68,0.12)",   border:"rgba(255,68,68,0.55)"    },
  running:  { color:T.cyan,   marker:"↻",  bg:"rgba(0,212,255,0.07)",   border:"rgba(0,212,255,0.38)"    },
  consult:  { color:T.purple, marker:"→",  bg:"rgba(155,109,255,0.08)", border:"rgba(155,109,255,0.38)"  },
};

const idHash = (id = "") =>
  id.split("").reduce((a, c) => (a * 31 + c.charCodeAt(0)) & 0xffff, 0);

const WORKUP_PROFILES = [
  [{ label:"3 Labs", status:"pending"  }, { label:"Troponin", status:"critical" }, { label:"CT",  status:"pending"  }, { label:"Cards",  status:"consult"  }],
  [{ label:"2 Labs", status:"pending"  }, { label:"CXR",      status:"resulted" }, { label:"EKG", status:"resulted" }],
  [{ label:"Lactate",status:"critical" }, { label:"BC x2",    status:"pending"  }, { label:"CT",  status:"running"  }, { label:"ID",     status:"consult"  }],
  [{ label:"Labs",   status:"pending"  }, { label:"CT",       status:"critical" }, { label:"Neuro",status:"consult" }],
  [{ label:"2 Labs", status:"pending"  }, { label:"XR",       status:"pending"  }],
  [{ label:"Labs",   status:"resulted" }, { label:"CT",       status:"resulted" }, { label:"Neuro",status:"consult" }],
  [{ label:"2 Labs", status:"pending"  }, { label:"US",       status:"running"  }],
  [{ label:"Labs",   status:"resulted" }, { label:"XR",       status:"resulted" }],
  [{ label:"UA",     status:"pending"  }],
  [{ label:"UA",     status:"resulted" }, { label:"XR",       status:"resulted" }],
];

function deriveResultChips(patient) {
  const patientOrders = Array.isArray(patient.orders) ? patient.orders : [];
  if (patientOrders.length > 0) {
    const chips   = [];
    const labs    = patientOrders.filter(o => o.type === "lab");
    const imaging = patientOrders.filter(o => o.type === "imaging");
    const consults= patientOrders.filter(o => o.type === "consult");
    labs.filter(o => o.status === "critical").forEach(o =>
      chips.push({ label:(o.name||"Lab").split(" ")[0], status:"critical" }));
    const pend = labs.filter(o => o.status === "pending");
    const done = labs.filter(o => o.status === "resulted" || o.status === "given");
    if (pend.length) chips.push({ label:`${pend.length} Lab${pend.length>1?"s":""}`, status:"pending" });
    else if (done.length) chips.push({ label:"Labs", status:"resulted" });
    imaging.forEach(o => {
      const lbl = (o.name||"Img").split(" ")[0];
      const st  = o.status==="critical" ? "critical"
                : o.status==="resulted" ? "resulted"
                : o.status==="running"  ? "running"
                : "pending";
      chips.push({ label:lbl, status:st });
    });
    consults.forEach(o =>
      chips.push({ label:(o.name||"Consult").split(" ")[0], status:"consult" }));
    return chips;
  }
  const h   = idHash(String(patient.id || "") + String(patient.mins || ""));
  const esi = patient.esi || 3;
  if (esi <= 2) return WORKUP_PROFILES[h % 4];
  if (esi === 3) return WORKUP_PROFILES[4 + (h % 4)];
  return WORKUP_PROFILES[8 + (h % 2)];
}

function ResultChipsRow({ chips }) {
  if (!chips || chips.length === 0) return null;
  const visible  = chips.slice(0, 4);
  const overflow = chips.length - 4;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:4, flexWrap:"nowrap", marginTop:3 }}>
      {visible.map((chip, i) => {
        const s      = CHIP_STYLE[chip.status] || CHIP_STYLE.pending;
        const isCrit = chip.status === "critical";
        return (
          <span
            key={i}
            className={isCrit ? "pulse-red" : undefined}
            style={{ display:"inline-flex", alignItems:"center", gap:3, fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:isCrit?700:500, color:s.color, background:s.bg, border:`1px solid ${s.border}`, borderRadius:5, padding:"2px 6px", whiteSpace:"nowrap", flexShrink:0, letterSpacing:"0.02em" }}
          >
            {chip.label} {s.marker}
          </span>
        );
      })}
      {overflow > 0 && (
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4, flexShrink:0 }}>
          +{overflow}
        </span>
      )}
    </div>
  );
}

// ─── DISPOSITION STATUS ───────────────────────────────────────────────────────
const DISPO_MAP = {
  dc_ready:         { label:"D/C Ready",       color:T.green  },
  admitted:         { label:"Bed Pending",      color:T.cyan   },
  obs:              { label:"Obs Pending",      color:T.gold   },
  awaiting_consult: { label:"Consult Pending",  color:T.purple },
  transfer:         { label:"Transfer Pending", color:T.orange },
  boarding:         { label:"Boarding",         color:T.blue   },
};

const dispoHash = (id = "", mins = 0) =>
  (id.split("").reduce((a, c) => (a * 17 + c.charCodeAt(0)) & 0xffff, 0) + mins * 7) & 0xffff;

const DISPO_BY_ESI = {
  1: ["admitted","boarding","awaiting_consult","admitted"],
  2: ["admitted","awaiting_consult","obs","boarding"],
  3: ["dc_ready","obs","awaiting_consult","workup"],
  4: ["dc_ready","workup","dc_ready","workup"],
  5: ["dc_ready","workup"],
};

function deriveDispoStatus(patient) {
  if (patient.dispo_status) return patient.dispo_status;
  const esi  = patient.esi || 3;
  const pool = DISPO_BY_ESI[esi] || DISPO_BY_ESI[3];
  const h    = dispoHash(String(patient.id || ""), patient.mins || 0);
  return pool[h % pool.length];
}

function DispoBadge({ status }) {
  const d = DISPO_MAP[status];
  if (!d) return null;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:600, color:d.color, background:`${d.color}14`, border:`1px solid ${d.color}44`, borderRadius:5, padding:"2px 7px", whiteSpace:"nowrap", flexShrink:0 }}>
      <span style={{ width:4, height:4, borderRadius:"50%", background:d.color, display:"inline-block", flexShrink:0 }} />
      {d.label}
    </span>
  );
}

// ─── PROVIDER ASSIGNMENT ──────────────────────────────────────────────────────
const ROLE_STYLE = {
  MD: { color:T.teal,   abbr:"MD" },
  RN: { color:T.gold,   abbr:"RN" },
  R:  { color:T.purple, abbr:"R"  },
  NP: { color:T.blue,   abbr:"NP" },
  PA: { color:T.cyan,   abbr:"PA" },
};

const ATTENDING_POOL = ["Skiba","Chen","Patel","Williams","Martinez","Johnson","Park","Thompson"];
const NURSE_POOL     = ["Torres","Kim","Johnson","Davis","Lee","Nguyen","Brown","Wilson"];
const RESIDENT_POOL  = ["Smith (R1)","Brown (R2)","Garcia (R3)","Wilson (R1)","Patel (R2)"];

const providerHash = (id = "", mins = 0) =>
  (id.split("").reduce((a, c) => (a * 23 + c.charCodeAt(0)) & 0xffff, 0) + mins * 11) & 0xffff;

function deriveProviders(patient) {
  if (patient.providers && patient.providers.length > 0) return patient.providers;
  const h   = providerHash(String(patient.id || ""), patient.mins || 0);
  const esi = patient.esi || 3;
  const list = [
    { role:"MD", name:ATTENDING_POOL[h % ATTENDING_POOL.length]    },
    { role:"RN", name:NURSE_POOL[(h * 3 + 7) % NURSE_POOL.length] },
  ];
  if (esi <= 2 || (esi === 3 && h % 3 === 0)) {
    list.push({ role:"R", name:RESIDENT_POOL[(h * 5) % RESIDENT_POOL.length] });
  }
  return list;
}

function ProviderRow({ providers, compact }) {
  if (!providers || providers.length === 0) return null;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:compact ? 6 : 10, flexWrap:"nowrap", overflow:"hidden" }}>
      {providers.map((prov, i) => {
        const rs = ROLE_STYLE[prov.role] || ROLE_STYLE.MD;
        return (
          <div key={i} style={{ display:"inline-flex", alignItems:"center", gap:3, flexShrink:0 }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:compact ? 7 : 8, fontWeight:700, color:rs.color, background:`${rs.color}18`, border:`1px solid ${rs.color}44`, borderRadius:3, padding:"1px 4px", lineHeight:1.5 }}>
              {rs.abbr}
            </span>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:compact ? 9 : 11, color:T.txt3, whiteSpace:"nowrap" }}>
              {prov.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── PRIMITIVES ───────────────────────────────────────────────────────────────
function Btn({ children, accent, onClick, sm }) {
  return (
    <button
      onClick={onClick}
      style={{ display:"inline-flex", alignItems:"center", gap:6, fontFamily:"'DM Sans',sans-serif", fontSize:sm?11:12, fontWeight:600, color:accent, background:`linear-gradient(135deg,${accent}22,${accent}0a)`, border:`1px solid ${accent}55`, borderRadius:8, padding:sm?"4px 10px":"7px 15px", cursor:"pointer", transition:"all .15s", whiteSpace:"nowrap" }}
    >
      {children}
    </button>
  );
}

function EsiBadge({ esi }) {
  const c = esiColor(esi);
  return (
    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, color:c, background:`${c}18`, border:`1px solid ${c}45`, borderRadius:5, padding:"2px 7px", whiteSpace:"nowrap" }}>
      ESI {esi}
    </span>
  );
}

function TimeBadge({ mins }) {
  const c = mins>120?T.red:mins>60?T.gold:T.txt4;
  return (
    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:c, minWidth:40, textAlign:"right" }}>
      {fmtTime(mins)}
    </span>
  );
}

// ─── ENCOUNTER TIMELINE ───────────────────────────────────────────────────────
function deriveTimelineStages(patient) {
  const h = idHash(String(patient.id || ""));
  const ordersArr  = Array.isArray(patient.orders) ? patient.orders : null;
  const hasOrders  = ordersArr != null
    ? ordersArr.length > 0
    : (patient.mins || 0) > 10 && h % 7 !== 0;
  const hasResults = ordersArr != null
    ? ordersArr.some(o => o.status === "resulted" || o.status === "given")
    : (patient.mins || 0) > 40 && h % 4 !== 0;
  const disp     = deriveDispoStatus(patient);
  const hasDispo = !!DISPO_MAP[disp];
  const isOut    = ["dc_ready","admitted","transfer"].includes(disp);
  const now          = new Date();
  const arrival      = new Date(now.getTime() - (patient.mins || 0) * 60000);
  const dtd          = mockDtd(patient);
  const ordersDelay  = dtd + 5 + (h % 10);
  const resultsDelay = ordersDelay + 25 + (h % 20);
  const fmtT = (d) => d.toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit", hour12:false });
  const t = (addMins) => fmtT(new Date(arrival.getTime() + addMins * 60000));
  const completions = [true, true, hasOrders, hasResults, hasDispo, isOut];
  const activeIdx   = completions.findIndex(c => !c);
  return [
    { key:"triage",   label:"Triage",   time: t(2)                                },
    { key:"assessed", label:"Assessed", time: t(dtd)                              },
    { key:"orders",   label:"Orders",   time: hasOrders  ? t(ordersDelay)  : null },
    { key:"results",  label:"Results",  time: hasResults ? t(resultsDelay) : null },
    { key:"dispo",    label:"Dispo",    time: hasDispo   ? "Set"           : null },
    { key:"out",      label:"Out",      time: isOut      ? "Ready"         : null },
  ].map((s, i) => ({ ...s, done:completions[i], active:i === activeIdx }));
}

const DASHED_CONN = `repeating-linear-gradient(90deg,rgba(90,130,168,0.28) 0,rgba(90,130,168,0.28) 5px,transparent 5px,transparent 10px)`;

function EncounterTimeline({ patient }) {
  const stages = deriveTimelineStages(patient);
  const n      = stages.length;
  const leftBar = (i) => {
    if (i === 0) return "transparent";
    const s = stages[i];
    if (s.done)   return T.teal;
    if (s.active) return `linear-gradient(90deg,${T.teal},${T.gold})`;
    return DASHED_CONN;
  };
  const rightBar = (i) => {
    if (i === n - 1) return "transparent";
    const next = stages[i + 1];
    if (next.done)   return T.teal;
    if (next.active) return `linear-gradient(90deg,${T.teal},${T.gold})`;
    return DASHED_CONN;
  };
  return (
    <div style={{ padding:"10px 24px 12px", borderBottom:"1px solid rgba(26,53,85,0.35)", background:"linear-gradient(180deg,rgba(5,15,30,0.45) 0%,transparent 100%)", flexShrink:0 }}>
      <div style={{ display:"flex", alignItems:"center", marginBottom:6 }}>
        {stages.map((s, i) => {
          const nSz  = s.active ? 12 : 8;
          const nBg  = s.done ? T.teal : s.active ? T.gold : "transparent";
          const nBrd = s.done ? T.teal : s.active ? T.gold : "rgba(90,130,168,0.4)";
          const glow = s.active ? `0 0 10px ${T.gold}88` : s.done ? `0 0 6px ${T.teal}55` : "none";
          return (
            <div key={s.key} style={{ flex:1, display:"flex", alignItems:"center" }}>
              <div style={{ flex:1, height:1.5, background:leftBar(i) }} />
              <div
                className={s.active ? "pulse-red" : undefined}
                style={{ width:nSz, height:nSz, borderRadius:"50%", background:nBg, border:`${s.done||s.active?2:1.5}px solid ${nBrd}`, flexShrink:0, transition:"all .25s", boxShadow:glow, animation:s.active?"none":undefined }}
              />
              <div style={{ flex:1, height:1.5, background:rightBar(i) }} />
            </div>
          );
        })}
      </div>
      <div style={{ display:"flex" }}>
        {stages.map((s) => (
          <div key={s.key} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:1 }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7, fontWeight:700, color:s.done ? T.txt3 : s.active ? T.gold : T.txt4, textTransform:"uppercase", letterSpacing:"0.07em", lineHeight:1.3 }}>
              {s.label}
            </span>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:8, color:s.done ? T.txt4 : s.active ? T.gold : T.txt4, opacity:s.done||s.active ? 1 : 0.3 }}>
              {s.time || "·"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PATIENT SUMMARY PANEL ────────────────────────────────────────────────────
function PatientSummaryPanel({ patient, summary, onRapidOrder }) {
  const rawVitals = patient.vitals && typeof patient.vitals === "object" && !Array.isArray(patient.vitals)
    ? patient.vitals
    : null;
  const vitals = rawVitals ? [
    rawVitals.hr   != null && { type:"HR",   value:rawVitals.hr,   unit:"bpm",  low:60,  high:100, ts:"" },
    rawVitals.bp   != null && { type:"BP",   value:rawVitals.bp,   unit:"mmHg", low:null,high:null, ts:"" },
    rawVitals.spo2 != null && { type:"SpO2", value:rawVitals.spo2, unit:"%",    low:95,  high:100, ts:"" },
    rawVitals.rr   != null && { type:"RR",   value:rawVitals.rr,   unit:"/min", low:12,  high:20,  ts:"" },
    rawVitals.temp != null && { type:"Temp", value:rawVitals.temp, unit:"°F",   low:97,  high:99,  ts:"" },
  ].filter(Boolean) : [
    { type:"HR",   value:88,       unit:"bpm",  low:60,  high:100, ts:"14:32" },
    { type:"BP",   value:"142/88", unit:"mmHg", low:null,high:null, ts:"14:32" },
    { type:"SpO2", value:97,       unit:"%",    low:95,  high:100, ts:"14:32" },
    { type:"RR",   value:18,       unit:"/min", low:12,  high:20,  ts:"14:32" },
    { type:"Temp", value:98.6,     unit:"°F",   low:97,  high:99,  ts:"14:32" },
    { type:"GCS",  value:15,       unit:"",     low:14,  high:15,  ts:"14:32" },
  ];
  const orders = Array.isArray(patient.orders) ? patient.orders : [
    { type:"lab",     name:"BMP / CBC / Troponin x1",      status:"pending",  ts:"14:20" },
    { type:"imaging", name:"CT Head w/o contrast",          status:"pending",  ts:"14:25" },
    { type:"med",     name:"Aspirin 325mg PO x1",           status:"given",    ts:"14:10" },
    { type:"lab",     name:"Urinalysis w/ reflex culture",  status:"pending",  ts:"14:22" },
    { type:"med",     name:"NS 1L IV bolus",                status:"running",  ts:"14:15" },
  ];
  const docStatus = (patient.doc_status && typeof patient.doc_status === "object" && !Array.isArray(patient.doc_status))
    ? patient.doc_status
    : { hpi:false, ros:false, pe:false, mdm:false, signed:false };
  const critAlerts    = (Array.isArray(patient.alerts) ? patient.alerts : []).filter(a => a.t === "critical");
  const pendingOrders = orders.filter(o => o.status === "pending");
  const vitalColor = (v) => {
    if (v.type === "GCS") return v.value === 15 ? T.green : v.value >= 13 ? T.gold : T.red;
    if (v.low === null) return T.txt;
    const num = typeof v.value === "number" ? v.value : parseFloat(v.value);
    if (isNaN(num)) return T.txt;
    if (num < v.low || num > v.high) return T.red;
    const band = (v.high - v.low) * 0.12;
    if (num <= v.low + band || num >= v.high - band) return T.gold;
    return T.green;
  };
  const bpColor = (val) => {
    const sys = parseInt(val);
    if (sys >= 180 || sys < 90) return T.red;
    if (sys >= 160 || sys < 100) return T.gold;
    return T.green;
  };
  const orderTypeColor   = { lab:T.cyan, imaging:T.purple, med:T.gold };
  const orderStatusColor = { pending:T.gold, given:T.green, running:T.teal, cancelled:T.txt4 };
  const orderStatusLabel = { pending:"pending", given:"given", running:"running", cancelled:"cancelled" };
  const docSections = [
    { key:"hpi", label:"History of Present Illness", icon:"📝" },
    { key:"ros", label:"Review of Systems",          icon:"📋" },
    { key:"pe",  label:"Physical Exam",              icon:"🩺" },
    { key:"mdm", label:"Medical Decision Making",    icon:"🧠" },
  ];
  const completedCount = docSections.filter(s => docStatus[s.key]).length;
  return (
    <div className="cc-fade" style={{ flex:1, display:"flex", flexDirection:"column", background:T.bg, overflowY:"auto", minWidth:0 }}>
      {/* ── PATIENT HEADER ── */}
      <div style={{ padding:"16px 24px 14px", borderBottom:"1px solid rgba(26,53,85,0.5)", background:T.panel, flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:16 }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4, background:"rgba(26,53,85,0.6)", border:"1px solid rgba(26,53,85,0.8)", borderRadius:5, padding:"2px 7px" }}>{patient.room}</span>
              <EsiBadge esi={patient.esi} />
              <TimeBadge mins={patient.mins} />
            </div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:900, color:T.txt, lineHeight:1.15, marginBottom:4 }}>
              {patient.name}
            </div>
            {(summary?.text || summary?.loading) && (
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color: summary?.loading ? T.txt4 : T.txt2, fontStyle:"italic", lineHeight:1.55, marginBottom:6, paddingLeft:1 }}>
                {summary?.loading
                  ? <span style={{ display:"inline-flex", alignItems:"center", gap:6 }}>
                      <span style={{ width:8, height:8, borderRadius:"50%", border:`2px solid rgba(0,229,192,0.3)`, borderTop:`2px solid ${T.teal}`, display:"inline-block", animation:"cc-spin 1s linear infinite" }} />
                      Generating clinical summary...
                    </span>
                  : summary.text
                }
              </div>
            )}
            <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.txt4 }}>{patient.age}{patient.sex}</span>
              <span style={{ color:T.txt4, fontSize:10 }}>·</span>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.teal, fontWeight:500 }}>{patient.cc}</span>
              <DispoBadge status={deriveDispoStatus(patient)} />
            </div>
            <div style={{ marginTop:6 }}>
              <ProviderRow providers={deriveProviders(patient)} />
            </div>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"flex-start", flexShrink:0 }}>
            <Btn accent={T.teal} onClick={() => nav("PatientEncounter", { patientId:patient.id })}>
              Open Full Encounter →
            </Btn>
          </div>
        </div>
      </div>

      {/* ── ENCOUNTER TIMELINE ── */}
      <EncounterTimeline patient={patient} />

      {/* ── CRITICAL ALERT BANNER ── */}
      {critAlerts.length > 0 && (
        <div style={{ margin:"14px 20px 0", flexShrink:0 }}>
          {critAlerts.map((a, i) => (
            <div key={i} className="pulse-red" style={{ display:"flex", alignItems:"center", gap:10, background:"rgba(255,68,68,0.08)", border:"1px solid rgba(255,68,68,0.4)", borderLeft:`4px solid ${T.red}`, borderRadius:10, padding:"10px 16px", marginBottom:6 }}>
              <span style={{ fontSize:15 }}>🚨</span>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600, color:T.red, flex:1 }}>{a.m}</span>
              <Btn accent={T.red} sm onClick={() => nav("PatientEncounter", { patientId:patient.id, tab:"alerts" })}>Act →</Btn>
            </div>
          ))}
        </div>
      )}

      {/* ── VITALS STRIP ── */}
      <div style={{ margin:"14px 20px 0", flexShrink:0 }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, color:T.txt4, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:8 }}>
          Last Vitals
        </div>
        <div style={{ display:"grid", gridTemplateColumns:`repeat(${vitals.length || 6},1fr)`, gap:8 }}>
          {vitals.map((v, i) => {
            const c = v.type === "BP" ? bpColor(v.value) : vitalColor(v);
            const isCrit = c === T.red;
            return (
              <div key={i} style={{ ...gc({ borderRadius:10, borderTop:`2px solid ${c}`, background: isCrit ? "rgba(255,68,68,0.05)" : T.card }), padding:"10px 8px 8px", textAlign:"center" }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7, color:T.txt4, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:5 }}>{v.type}</div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:v.type==="BP"?12:18, fontWeight:700, color:c, lineHeight:1 }}>{v.value}</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, color:T.txt4, marginTop:3 }}>{v.unit}</div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7, color:T.txt4, marginTop:5, borderTop:"1px solid rgba(26,53,85,0.5)", paddingTop:4 }}>{v.ts}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── ORDERS + DOCUMENTATION ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, margin:"14px 20px", flex:1, minHeight:240 }}>
        {/* ── Pending Orders ── */}
        <div style={{ ...gc({ borderRadius:12 }), display:"flex", flexDirection:"column", overflow:"hidden" }}>
          <div style={{ padding:"11px 14px 9px", borderBottom:"1px solid rgba(26,53,85,0.5)", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, color:T.txt4, textTransform:"uppercase", letterSpacing:"0.12em" }}>Orders</span>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.gold, background:"rgba(245,200,66,0.1)", border:"1px solid rgba(245,200,66,0.3)", borderRadius:10, padding:"1px 8px" }}>{pendingOrders.length} pending</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.teal, background:"rgba(0,229,192,0.1)", border:"1px solid rgba(0,229,192,0.3)", borderRadius:10, padding:"1px 8px" }}>{orders.length} total</span>
            </div>
          </div>
          <div style={{ flex:1, overflowY:"auto", padding:"6px 8px" }}>
            {orders.length === 0 ? (
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt4, textAlign:"center", padding:"24px 0" }}>No orders placed</div>
            ) : orders.map((o, i) => {
              const tc = orderTypeColor[o.type] || T.txt3;
              const sc = orderStatusColor[o.status] || T.txt4;
              return (
                <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:0, padding:"8px 8px 8px 12px", borderBottom:"1px solid rgba(26,53,85,0.25)", borderLeft:`2px solid ${tc}`, marginBottom:2, background:"rgba(26,53,85,0.15)", borderRadius:"0 6px 6px 0" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600, color:T.txt, marginBottom:4 }}>{o.name}</div>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:tc, background:`${tc}18`, border:`1px solid ${tc}33`, borderRadius:4, padding:"1px 5px", textTransform:"uppercase", letterSpacing:"0.06em" }}>{o.type}</span>
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:sc }}>{orderStatusLabel[o.status] || o.status}</span>
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4 }}>{o.ts}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ padding:"8px 12px", borderTop:"1px solid rgba(26,53,85,0.5)", display:"flex", gap:6, flexShrink:0 }}>
            <Btn accent={T.teal} sm onClick={() => nav("PatientEncounter", { patientId:patient.id, tab:"orders" })}>+ New Order</Btn>
            <Btn accent={T.cyan} sm onClick={() => nav("PatientEncounter", { patientId:patient.id, tab:"orders" })}>All Orders →</Btn>
          </div>
        </div>

        {/* ── Documentation Status ── */}
        <div style={{ ...gc({ borderRadius:12 }), display:"flex", flexDirection:"column", overflow:"hidden" }}>
          <div style={{ padding:"11px 14px 9px", borderBottom:"1px solid rgba(26,53,85,0.5)", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, color:T.txt4, textTransform:"uppercase", letterSpacing:"0.12em" }}>Documentation</span>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4 }}>{completedCount}/{docSections.length}</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, color:docStatus.signed ? T.green : T.gold, background:docStatus.signed ? "rgba(61,255,160,0.1)" : "rgba(245,200,66,0.1)", border:`1px solid ${docStatus.signed ? T.green : T.gold}44`, borderRadius:6, padding:"2px 9px" }}>
                {docStatus.signed ? "✓ SIGNED" : "UNSIGNED"}
              </span>
            </div>
          </div>
          <div style={{ height:3, background:"rgba(26,53,85,0.5)", flexShrink:0 }}>
            <div style={{ height:"100%", width:`${(completedCount/docSections.length)*100}%`, background:`linear-gradient(90deg,${T.teal},${T.green})`, transition:"width .4s ease" }} />
          </div>
          <div style={{ flex:1, padding:"10px 12px", display:"flex", flexDirection:"column", gap:6 }}>
            {docSections.map(({ key, label, icon }) => {
              const done = docStatus[key];
              return (
                <div key={key} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:8, background:done ? "rgba(61,255,160,0.05)" : "rgba(26,53,85,0.2)", border:`1px solid ${done ? T.green+"30" : "rgba(26,53,85,0.4)"}`, transition:"all .2s" }}>
                  <span style={{ fontSize:13 }}>{icon}</span>
                  <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:done ? T.txt : T.txt3, flex:1 }}>{label}</span>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, color:done ? T.green : T.txt4 }}>{done ? "✓" : "—"}</span>
                </div>
              );
            })}
          </div>
          <div style={{ padding:"8px 12px", borderTop:"1px solid rgba(26,53,85,0.5)", display:"flex", gap:6, flexShrink:0 }}>
            <Btn accent={T.gold} sm onClick={() => nav("PatientEncounter", { patientId:patient.id, tab:"note" })}>📝 Open Note</Btn>
            {!docStatus.signed && completedCount === docSections.length && (
              <Btn accent={T.green} sm onClick={() => nav("PatientEncounter", { patientId:patient.id, tab:"sign" })}>✓ Sign Chart</Btn>
            )}
          </div>
        </div>
      </div>

      {/* ── QUICK ACTIONS FOOTER ── */}
      <div style={{ padding:"10px 20px 14px", borderTop:"1px solid rgba(26,53,85,0.5)", display:"flex", alignItems:"center", gap:8, flexShrink:0, background:T.panel }}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7, color:T.txt4, textTransform:"uppercase", letterSpacing:"0.14em", marginRight:6 }}>Quick Actions</span>
        <Btn accent={T.coral} sm onClick={() => onRapidOrder && onRapidOrder()}>⚡ Rapid Order</Btn>
        <Btn accent={T.gold}   sm onClick={() => nav("PatientEncounter", { patientId:patient.id, tab:"note"    })}>📝 Note</Btn>
        <Btn accent={T.purple} sm onClick={() => nav("PatientEncounter", { patientId:patient.id, tab:"dispo"   })}>🚪 Dispo</Btn>
        <Btn accent={T.red}    sm onClick={() => nav("PatientEncounter", { patientId:patient.id, tab:"alerts"  })}>🚨 Alert</Btn>
        <div style={{ flex:1 }} />
        <Btn accent={T.blue}   sm onClick={() => nav("PatientEncounter", { patientId:patient.id })}>Full Encounter →</Btn>
      </div>
    </div>
  );
}

// ─── COMMAND PALETTE ──────────────────────────────────────────────────────────
function CommandPalette({ open, onClose, patients, onNewPatient }) {
  const [query,     setQuery]     = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef(null);
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIdx(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);
  const { actions, pts, hubs } = paletteFilter(query, patients);
  const resolvedActions = actions.map(a =>
    a.execute === "__newPatient__" ? { ...a, execute:onNewPatient } : a
  );
  const flat = [
    ...resolvedActions.map(a => ({ ...a, type:"action" })),
    ...pts.map(p => ({ key:`pt-${p.id}`, type:"patient", label:p.name, sub:`${p.room} · ${p.cc} · ESI ${p.esi} · ${fmtTime(p.mins)}`, icon:"👤", badge:`ESI ${p.esi}`, badgeColor:esiColor(p.esi), execute:() => nav("PatientEncounter", { patientId:p.id }) })),
    ...hubs.map(h => ({ key:`hub-${h.key}`, type:"hub", label:h.label, sub:h.cat, icon:h.icon, badge:"Hub", badgeColor:T.purple, execute:() => nav(h.key) })),
  ];
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape")    { onClose(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => Math.min(i+1, flat.length-1)); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setActiveIdx(i => Math.max(i-1, 0)); }
      if (e.key === "Enter" && flat[activeIdx]) { flat[activeIdx].execute?.(); onClose(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, activeIdx, flat, onClose]);
  useEffect(() => { setActiveIdx(0); }, [query]);
  if (!open) return null;
  const LABELS = { action:"Actions", patient:"Patients", hub:"Clinical Hubs" };
  const rows = [];
  let lastType = null;
  flat.forEach((item, idx) => {
    if (item.type !== lastType) {
      rows.push(
        <div key={`hdr-${item.type}`} style={{ padding:"7px 16px 3px", fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, color:T.txt4, textTransform:"uppercase", letterSpacing:"0.12em", borderTop:lastType ? "1px solid rgba(26,53,85,0.4)" : "none", marginTop:lastType ? 4 : 0 }}>
          {LABELS[item.type]}
        </div>
      );
      lastType = item.type;
    }
    const active = activeIdx === idx;
    rows.push(
      <div key={item.key} onClick={() => { item.execute?.(); onClose(); }} onMouseEnter={() => setActiveIdx(idx)} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 16px", background:active ? `${T.teal}14` : "transparent", borderLeft:`2px solid ${active ? T.teal : "transparent"}`, cursor:"pointer", transition:"background .08s, border-color .08s" }}>
        <span style={{ fontSize:15, flexShrink:0, lineHeight:1 }}>{item.icon}</span>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, color:active ? T.txt : T.txt2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.label}</div>
          {item.sub && <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.txt4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginTop:1 }}>{item.sub}</div>}
        </div>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:600, color:item.badgeColor||T.txt4, background:`${item.badgeColor||T.txt4}18`, border:`1px solid ${item.badgeColor||T.txt4}33`, borderRadius:4, padding:"2px 6px", flexShrink:0, whiteSpace:"nowrap" }}>{item.badge}</span>
      </div>
    );
  });
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:9999, background:"rgba(5,15,30,0.82)", backdropFilter:"blur(14px)", display:"flex", alignItems:"flex-start", justifyContent:"center", paddingTop:100 }}>
      <div onClick={e => e.stopPropagation()} className="modal-in" style={{ width:"100%", maxWidth:600, borderRadius:14, overflow:"hidden", background:T.panel, border:`1px solid ${T.teal}44`, boxShadow:`0 32px 100px rgba(0,0,0,0.9), 0 0 0 1px ${T.teal}18 inset` }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"0 18px", borderBottom:"1px solid rgba(26,53,85,0.6)" }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:16, color:T.txt4, flexShrink:0 }}>⌘</span>
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} placeholder="Search patients, hubs, or actions..." style={{ flex:1, background:"transparent", border:"none", outline:"none", fontFamily:"'DM Sans',sans-serif", fontSize:15, color:T.txt, padding:"16px 0" }} />
          {query
            ? <button onClick={() => setQuery("")} style={{ background:"none", border:"none", color:T.txt4, cursor:"pointer", fontSize:13, padding:"2px 4px", flexShrink:0 }}>✕</button>
            : <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4, background:"rgba(26,53,85,0.5)", border:"1px solid rgba(26,53,85,0.7)", borderRadius:4, padding:"2px 7px", flexShrink:0 }}>ESC</span>
          }
        </div>
        <div style={{ maxHeight:420, overflowY:"auto" }}>
          {flat.length === 0 ? (
            <div style={{ padding:"32px 20px", textAlign:"center" }}>
              <div style={{ fontSize:28, marginBottom:8 }}>🔍</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.txt4 }}>No results for <span style={{ color:T.txt3, fontStyle:"italic" }}>"{query}"</span></div>
            </div>
          ) : rows}
        </div>
        <div style={{ padding:"7px 16px", borderTop:"1px solid rgba(26,53,85,0.5)", display:"flex", alignItems:"center", gap:14 }}>
          {[["↑↓","navigate"],["↵","open"],["esc","close"]].map(([key,label]) => (
            <div key={key} style={{ display:"flex", alignItems:"center", gap:4 }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt3, background:"rgba(26,53,85,0.5)", border:"1px solid rgba(26,53,85,0.8)", borderRadius:4, padding:"1px 5px" }}>{key}</span>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.txt4 }}>{label}</span>
            </div>
          ))}
          <div style={{ flex:1 }} />
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4, letterSpacing:"0.06em" }}>NOTRYA · ⌘K</span>
        </div>
      </div>
    </div>
  );
}

// ─── NEW PATIENT CHOICE MODAL ─────────────────────────────────────────────────
function NewPatientModal({ onClose }) {
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:9000, background:"rgba(5,15,30,0.88)", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div onClick={e => e.stopPropagation()} className="modal-in" style={{ width:"100%", maxWidth:480, borderRadius:16, overflow:"hidden", border:"1px solid rgba(26,53,85,0.6)", background:T.panel, boxShadow:"0 24px 80px rgba(0,0,0,0.8)" }}>
        <div style={{ padding:"20px 24px 16px", borderBottom:"1px solid rgba(26,53,85,0.5)" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:T.txt, marginBottom:4 }}>Add New Patient</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt4 }}>Choose your documentation mode</div>
            </div>
            <button onClick={onClose} style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:8, color:T.txt4, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:12, padding:"6px 12px" }}>✕</button>
          </div>
        </div>
        <div style={{ padding:"20px 24px 24px", display:"flex", flexDirection:"column", gap:12 }}>
          <div onClick={() => { nav("QuickNote"); onClose(); }} style={{ ...gc({ borderRadius:12, borderLeft:`3px solid ${T.teal}`, background:`linear-gradient(135deg,${T.teal}0a,${T.card})` }), padding:"16px 18px", cursor:"pointer" }} onMouseEnter={e => { e.currentTarget.style.boxShadow=`0 0 24px ${T.teal}1a`; }} onMouseLeave={e => { e.currentTarget.style.boxShadow="none"; }}>
            <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
              <span style={{ fontSize:28, lineHeight:1 }}>✏️</span>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                  <span style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700, color:T.teal }}>Quick Note</span>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.teal, background:"rgba(0,229,192,0.12)", border:"1px solid rgba(0,229,192,0.3)", borderRadius:4, padding:"1px 6px", textTransform:"uppercase", letterSpacing:"0.08em" }}>Recommended</span>
                </div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt3, lineHeight:1.6 }}>Fast bedside documentation. AI-assisted HPI, SmartFill, and ICD-10 search. Designed for speed — document in under 2 minutes.</div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.teal, marginTop:8 }}>For attendings and mid-levels at the bedside →</div>
              </div>
            </div>
          </div>
          <div onClick={() => { nav("NewPatientInput"); onClose(); }} style={{ ...gc({ borderRadius:12, borderLeft:`3px solid ${T.gold}`, background:`linear-gradient(135deg,${T.gold}0a,${T.card})` }), padding:"16px 18px", cursor:"pointer" }} onMouseEnter={e => { e.currentTarget.style.boxShadow=`0 0 24px ${T.gold}1a`; }} onMouseLeave={e => { e.currentTarget.style.boxShadow="none"; }}>
            <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
              <span style={{ fontSize:28, lineHeight:1 }}>📋</span>
              <div style={{ flex:1 }}>
                <div style={{ marginBottom:5 }}>
                  <span style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700, color:T.gold }}>Full Intake (NPI)</span>
                </div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt3, lineHeight:1.6 }}>Structured intake with ROS, PE, vitals, PMHx, medications, and social history. Full encounter build for complex patients.</div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.gold, marginTop:8 }}>For nurses, residents, and detailed documentation →</div>
              </div>
            </div>
          </div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt4, textAlign:"center", marginTop:4 }}>You can switch modes at any time from the Patient Encounter page</div>
        </div>
      </div>
    </div>
  );
}

// ─── CENSUS PANEL ─────────────────────────────────────────────────────────────
function CensusPanel({ patients, search, onSearch, selectedId, onSelect, summaries }) {
  const [filterMode, setFilterMode] = useState("all");
  const filtered = patients.filter(p =>
    [p.name, p.cc, p.room].some(s => (s || "").toLowerCase().includes(search.toLowerCase()))
  );
  const sorted     = [...filtered].sort((a, b) => a.esi !== b.esi ? a.esi - b.esi : b.mins - a.mins);
  const myPatients = sorted.filter(p => deriveProviders(p).some(pr => pr.role === "MD" && pr.name === CURRENT_USER));
  const displayed  = filterMode === "mine" ? myPatients : sorted;
  const isMine     = filterMode === "mine";
  return (
    <div style={{ width:292, minWidth:292, display:"flex", flexDirection:"column", borderRight:"1px solid rgba(26,53,85,0.5)", height:"100%", background:T.panel }}>
      <div style={{ padding:"14px 16px 10px", borderBottom:`1px solid ${isMine ? T.teal+"44" : "rgba(26,53,85,0.5)"}`, transition:"border-color .25s" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:9 }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, color:isMine ? T.teal : T.txt4, textTransform:"uppercase", letterSpacing:"0.12em", transition:"color .2s" }}>
            {isMine ? "My Patients" : "Patient Census"}
          </span>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.teal, background:"rgba(0,229,192,0.1)", border:"1px solid rgba(0,229,192,0.3)", borderRadius:10, padding:"1px 8px" }}>
            {isMine ? `${displayed.length} / ${patients.length}` : patients.length}
          </span>
        </div>
        <div style={{ display:"flex", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(26,53,85,0.5)", borderRadius:8, overflow:"hidden", marginBottom:9 }}>
          {[
            { mode:"mine", label:"My Patients", count:myPatients.length },
            { mode:"all",  label:"All",          count:sorted.length     },
          ].map(({ mode, label, count }, i) => {
            const active = filterMode === mode;
            return (
              <button key={mode} onClick={() => setFilterMode(mode)} style={{ flex: mode === "mine" ? 1 : "none", display:"flex", alignItems:"center", justifyContent: mode === "mine" ? "flex-start" : "center", gap:5, padding:"5px 10px", background: active ? `${T.teal}1a` : "transparent", border:"none", borderRight: i === 0 ? "1px solid rgba(26,53,85,0.5)" : "none", color: active ? T.teal : T.txt4, fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight: active ? 700 : 400, cursor:"pointer", transition:"all .15s", whiteSpace:"nowrap" }}>
                {label}
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color: active ? T.teal : T.txt4, background: active ? "rgba(0,229,192,0.15)" : "rgba(26,53,85,0.4)", borderRadius:8, padding:"0 5px", lineHeight:1.7 }}>{count}</span>
              </button>
            );
          })}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(26,53,85,0.5)", borderRadius:8, padding:"7px 10px" }}>
          <span style={{ fontSize:12, color:T.txt4 }}>🔍</span>
          <input value={search} onChange={e => onSearch(e.target.value)} placeholder="Room, name, CC..." style={{ flex:1, background:"transparent", border:"none", outline:"none", fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt }} />
          {search && <button onClick={() => onSearch("")} style={{ background:"none", border:"none", color:T.txt4, cursor:"pointer", fontSize:11, padding:0 }}>x</button>}
        </div>
      </div>
      <div style={{ flex:1, overflowY:"auto", paddingBottom:8 }}>
        {displayed.length === 0 && (
          <div style={{ padding:"32px 16px", textAlign:"center" }}>
            <div style={{ fontSize:28, marginBottom:10 }}>👤</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt4, lineHeight:1.6 }}>
              {isMine ? `No patients assigned to Dr. ${CURRENT_USER}` : "No patients match your search"}
            </div>
            {isMine && <button onClick={() => setFilterMode("all")} style={{ marginTop:10, fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.teal, background:"rgba(0,229,192,0.08)", border:"1px solid rgba(0,229,192,0.3)", borderRadius:6, padding:"4px 12px", cursor:"pointer" }}>View All Patients →</button>}
          </div>
        )}
        {displayed.map(p => {
          const isSelected = p.id === selectedId;
          const hasCrit    = Array.isArray(p.alerts) && p.alerts.some(a => a.t === "critical");
          return (
            <div key={p.id} onClick={() => onSelect(p)} style={{ padding:"10px 16px", background:isSelected ? `linear-gradient(135deg,${T.teal}12,${T.teal}06)` : "transparent", borderLeft:`3px solid ${isSelected ? T.teal : "transparent"}`, borderBottom:"1px solid rgba(26,53,85,0.3)", cursor:"pointer", transition:"all .12s", display:"flex", flexDirection:"column", gap:4 }} onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.background=`linear-gradient(135deg,${T.teal}07,transparent)`; e.currentTarget.style.borderLeftColor=T.teal+"44"; } }} onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.background="transparent"; e.currentTarget.style.borderLeftColor="transparent"; } }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:isSelected ? T.teal : T.txt4 }}>{p.room}</span>
                  {hasCrit && <span style={{ width:5, height:5, borderRadius:"50%", background:T.red, display:"inline-block" }} />}
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <EsiBadge esi={p.esi} />
                  <TimeBadge mins={p.mins} />
                </div>
              </div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:13, fontWeight:700, color:T.txt, lineHeight:1.2 }}>{p.name}</div>
              {(summaries[p.id]?.text || summaries[p.id]?.loading) && (
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color: summaries[p.id]?.loading ? T.txt4 : T.txt3, fontStyle:"italic", lineHeight:1.3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {summaries[p.id]?.loading ? "···" : summaries[p.id].text}
                </div>
              )}
              <ProviderRow providers={deriveProviders(p)} compact />
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:4 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, minWidth:0, overflow:"hidden" }}>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4, flexShrink:0 }}>{p.age}{p.sex}</span>
                  <span style={{ color:T.txt4, fontSize:9, flexShrink:0 }}>·</span>
                  <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.cc}</span>
                </div>
                <DispoBadge status={deriveDispoStatus(p)} />
              </div>
              <ResultChipsRow chips={deriveResultChips(p)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── CENTER — SELECT PATIENT PROMPT ───────────────────────────────────────────
function SelectPatientPrompt({ patients }) {
  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16, background:T.bg }}>
      <div style={{ fontSize:52 }}>🏥</div>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:T.txt3 }}>Select a patient</div>
      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.txt4, textAlign:"center", maxWidth:280, lineHeight:1.6 }}>Choose a patient from the census to open their encounter workspace</div>
      <div style={{ marginTop:8, display:"flex", gap:8, flexWrap:"wrap", justifyContent:"center" }}>
        {patients.filter(p => Array.isArray(p.alerts) && p.alerts.some(a => a.t==="critical")).slice(0,3).map(p => (
          <div key={p.id} onClick={() => nav("PatientEncounter", { patientId:p.id })} style={{ padding:"6px 14px", borderRadius:20, background:"rgba(255,68,68,0.08)", border:"1px solid rgba(255,68,68,0.25)", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.red }}>
            🚨 {p.room} — {p.cc}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TIME-TO-EVENT HELPERS ────────────────────────────────────────────────────
const DTD_TARGET   = 30;
const EKG_TARGET   = 10;
const STALE_THRESH = 30;
const dtdColor   = (m) => m > 60 ? T.red : m > DTD_TARGET   ? T.gold : T.green;
const ekgColor   = (m) => m > 20 ? T.red : m > EKG_TARGET   ? T.gold : T.green;
const staleColor = (m) => m > 60 ? T.red : m > STALE_THRESH ? T.gold : T.txt4;
const mockDtd = (p) => {
  if (p.door_to_doc != null) return p.door_to_doc;
  const h = idHash(String(p.id || ""));
  return Math.max(5, Math.min(90, Math.floor((p.mins || 30) * 0.3) + (h % 25)));
};
const isCardiac = (p) => {
  const cc = (p.cc || "").toLowerCase();
  return ["chest","stemi","cardiac","ekg","palpitat","syncope"].some(kw => cc.includes(kw));
};
const mockDoorToEkg   = (p) => p.door_to_ekg   != null ? p.door_to_ekg   : Math.max(3, 5 + (idHash(String(p.id || "")) % 20));
const mockLastOrderMins = (p) => p.last_order_mins != null ? p.last_order_mins : (idHash(String(p.id || "")) * 11 + 17) % 75;

// ─── RIGHT RAIL — SHIFT OVERVIEW ──────────────────────────────────────────────
function ShiftRail({ patients }) {
  const critPts = patients.filter(p => Array.isArray(p.alerts) && p.alerts.some(a => a.t === "critical"));
  const avgTime = patients.length ? Math.round(patients.reduce((s, p) => s + (p.mins || 0), 0) / patients.length) : 0;
  const dtdValues  = patients.map(p => mockDtd(p));
  const avgDtd     = dtdValues.length ? Math.round(dtdValues.reduce((a, b) => a + b, 0) / dtdValues.length) : 0;
  const worstDtd   = dtdValues.length ? Math.max(...dtdValues) : 0;
  const worstDtdPt = patients.find(p => mockDtd(p) === worstDtd);
  const cardiacPts    = patients.filter(p => isCardiac(p));
  const ekgOnTime     = cardiacPts.filter(p => mockDoorToEkg(p) <= EKG_TARGET);
  const ekgLabel      = cardiacPts.length ? `${ekgOnTime.length} / ${cardiacPts.length}` : "—";
  const ekgAllGood    = cardiacPts.length > 0 && ekgOnTime.length === cardiacPts.length;
  const ekgSomemissed = cardiacPts.length > 0 && ekgOnTime.length < cardiacPts.length;
  const stalePts = patients.filter(p => (p.mins || 0) > 45 && mockLastOrderMins(p) > STALE_THRESH);
  const sectionLabel = (txt, color = T.txt4) => (
    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, color, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:8 }}>{txt}</div>
  );
  const metricRow = (label, value, valueColor, sub = null) => (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:7 }}>
      <div style={{ minWidth:0 }}>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.txt3, lineHeight:1.3 }}>{label}</div>
        {sub && <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4, marginTop:1 }}>{sub}</div>}
      </div>
      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:14, fontWeight:700, color:valueColor, flexShrink:0, marginLeft:8 }}>{value}</span>
    </div>
  );
  return (
    <div style={{ width:258, minWidth:258, height:"100%", borderLeft:"1px solid rgba(26,53,85,0.5)", background:T.panel, display:"flex", flexDirection:"column", overflowY:"auto" }}>
      <div style={{ padding:"14px 14px 10px", borderBottom:"1px solid rgba(26,53,85,0.5)", flexShrink:0 }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, color:T.txt4, textTransform:"uppercase", letterSpacing:"0.12em" }}>Shift Overview</div>
      </div>
      <div style={{ padding:"12px 12px 0", flex:1 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7, marginBottom:14 }}>
          {[
            { label:"Total Pts",   value:patients.length,                                                                        color:T.teal  },
            { label:"ESI 1-2",     value:patients.filter(p => p.esi <= 2).length,                                                color:T.coral },
            { label:"Crit Alerts", value:patients.filter(p => Array.isArray(p.alerts) && p.alerts.some(a => a.t === "critical")).length, color:T.red   },
            { label:"Avg LOS",     value:`${avgTime}m`,                                                                          color:T.gold  },
          ].map((s, i) => (
            <div key={i} style={{ ...gc({ borderRadius:9 }), padding:"10px 11px", textAlign:"center" }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:20, fontWeight:700, color:s.color, lineHeight:1 }}>{s.value}</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.txt4, marginTop:4 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ ...gc({ borderRadius:10 }), padding:"11px 12px", marginBottom:14 }}>
          {sectionLabel("Time-to-Event")}
          {patients.length === 0 ? (
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt4, textAlign:"center", padding:"8px 0" }}>No patients</div>
          ) : (
            <>
              {metricRow("Avg Door-to-Doc",      `${avgDtd}m`,   dtdColor(avgDtd),   `Target ≤${DTD_TARGET}m`)}
              {metricRow("Longest Door-to-Doc",  `${worstDtd}m`, dtdColor(worstDtd), worstDtdPt ? `${worstDtdPt.room} · ${(worstDtdPt.name||"").split(",")[0]}` : null)}
              <div style={{ height:1, background:"rgba(26,53,85,0.5)", margin:"8px 0" }} />
              {metricRow("EKG ≤10m (Cardiac)", cardiacPts.length === 0 ? "—" : ekgLabel, ekgAllGood ? T.green : ekgSomemissed ? T.red : T.txt4)}
              {metricRow("Stale Workups >30m",  stalePts.length === 0 ? "0" : String(stalePts.length), stalePts.length === 0 ? T.green : stalePts.length > 2 ? T.red : T.gold, "LOS >45m, no new orders")}
            </>
          )}
        </div>
        {stalePts.length > 0 && (
          <div style={{ marginBottom:14 }}>
            {sectionLabel("Stale Workups", T.gold)}
            {stalePts.map(p => (
              <div key={p.id} onClick={() => nav("PatientEncounter", { patientId:p.id })} style={{ ...gc({ borderRadius:9, borderLeft:`3px solid ${staleColor(mockLastOrderMins(p))}`, background:"rgba(245,200,66,0.04)" }), padding:"8px 10px", marginBottom:6, cursor:"pointer" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:2 }}>
                  <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600, color:T.txt }}>{(p.name||"").split(",")[0]}</span>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, color:staleColor(mockLastOrderMins(p)) }}>{mockLastOrderMins(p)}m</span>
                </div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4 }}>{p.room} · No new orders</div>
              </div>
            ))}
          </div>
        )}
        {critPts.length > 0 && (
          <div style={{ marginBottom:14 }}>
            {sectionLabel("Critical — Needs Attention", T.red)}
            {critPts.map(p => (
              <div key={p.id} onClick={() => nav("PatientEncounter", { patientId:p.id })} style={{ ...gc({ borderRadius:9, borderLeft:`3px solid ${T.red}`, background:"rgba(255,68,68,0.05)" }), padding:"9px 11px", marginBottom:6, cursor:"pointer" }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600, color:T.txt, marginBottom:2 }}>{p.name}</div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4, marginBottom:4 }}>{p.room} · {p.cc}</div>
                {(Array.isArray(p.alerts) ? p.alerts : []).filter(a => a.t === "critical").map((a, i) => (
                  <div key={i} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.red, lineHeight:1.4 }}>🚨 {a.m}</div>
                ))}
              </div>
            ))}
          </div>
        )}
        <div style={{ marginBottom:14 }}>
          {sectionLabel("ESI Breakdown")}
          {[1, 2, 3, 4, 5].map(esi => {
            const count = patients.filter(p => p.esi === esi).length;
            const c     = esiColor(esi);
            const pct   = patients.length ? (count / patients.length) * 100 : 0;
            return (
              <div key={esi} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:c, minWidth:36 }}>ESI {esi}</span>
                <div style={{ flex:1, height:5, background:"rgba(26,53,85,0.5)", borderRadius:3, overflow:"hidden" }}>
                  <div style={{ width:`${pct}%`, height:"100%", background:c, borderRadius:3, transition:"width .4s" }} />
                </div>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4, minWidth:12, textAlign:"right" }}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── TOP BAR ──────────────────────────────────────────────────────────────────
function TopBar({ onQuickNote, onNewPatient, onOpenPalette, onRapidOrder }) {
  const now  = new Date();
  const time = now.toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit" });
  const date = now.toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric" });
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 24px", height:58, minHeight:58, borderBottom:"1px solid rgba(26,53,85,0.5)", background:T.panel, flexShrink:0 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:32, height:32, borderRadius:8, background:`linear-gradient(135deg,${T.teal},${T.purple})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>⚡</div>
        <div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:900, color:T.txt, letterSpacing:"0.03em" }}>LAKONYX</div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4, letterSpacing:"0.16em", marginTop:-1 }}>COMMAND CENTER</div>
        </div>
        <div onClick={onOpenPalette} style={{ display:"flex", alignItems:"center", gap:7, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(26,53,85,0.5)", borderRadius:8, padding:"5px 12px", cursor:"pointer", marginLeft:12 }} onMouseEnter={e => { e.currentTarget.style.borderColor="rgba(0,229,192,0.3)"; }} onMouseLeave={e => { e.currentTarget.style.borderColor="rgba(26,53,85,0.5)"; }}>
          <span style={{ fontSize:12, color:T.txt4 }}>🔍</span>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt4 }}>Search</span>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4, background:"rgba(26,53,85,0.6)", border:"1px solid rgba(26,53,85,0.8)", borderRadius:4, padding:"1px 6px", marginLeft:2 }}>⌘K</span>
        </div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:14 }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:20, fontWeight:700, color:T.txt, letterSpacing:"0.04em" }}>{time}</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.txt4, marginTop:-2 }}>{date}</div>
        </div>
        <div style={{ background:"rgba(0,229,192,0.08)", border:"1px solid rgba(0,229,192,0.3)", borderRadius:8, padding:"4px 12px", display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ width:6, height:6, borderRadius:"50%", background:T.teal, display:"inline-block" }} />
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.teal, fontWeight:700 }}>On Shift</span>
        </div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <Btn accent={T.teal}   onClick={onQuickNote}>✏️ Quick Note</Btn>
        <Btn accent={T.coral}  onClick={onRapidOrder}>⚡ Rapid Order</Btn>
        <Btn accent={T.gold}   onClick={onNewPatient}>+ New Patient</Btn>
        <div style={{ width:32, height:32, borderRadius:"50%", background:`linear-gradient(135deg,${T.coral},${T.purple})`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:13, fontWeight:700, color:"white", fontFamily:"'DM Sans',sans-serif", flexShrink:0 }}>G</div>
      </div>
    </div>
  );
}

// ─── RAPID ORDER CATALOG ──────────────────────────────────────────────────────
const ROC = {
  labs: [
    { id:"bmp",      name:"BMP",                              common:true  },
    { id:"cbc",      name:"CBC w/ Differential",              common:true  },
    { id:"bmp-cbc",  name:"BMP + CBC",                        common:true  },
    { id:"trop",     name:"Troponin I (High-Sensitivity)",    common:true  },
    { id:"lactate",  name:"Lactate",                          common:true  },
    { id:"ua",       name:"Urinalysis w/ Reflex Culture",     common:true  },
    { id:"bc",       name:"Blood Cultures x2",                common:false },
    { id:"lfts",     name:"Hepatic Function Panel",           common:false },
    { id:"coags",    name:"PT / INR / PTT",                   common:false },
    { id:"ddimer",   name:"D-Dimer",                          common:false },
    { id:"tsh",      name:"TSH",                              common:false },
    { id:"lipase",   name:"Lipase",                           common:false },
    { id:"bhcg",     name:"β-hCG (Serum)",                    common:false },
    { id:"apap",     name:"Acetaminophen Level",              common:false },
    { id:"etoh",     name:"Ethanol Level",                    common:false },
    { id:"vbg",      name:"Venous Blood Gas",                 common:false },
    { id:"abg",      name:"Arterial Blood Gas",               common:false },
  ],
  imaging: [
    { id:"cxr",      name:"CXR PA & Lateral",                 common:true  },
    { id:"ct-head",  name:"CT Head w/o Contrast",             common:true  },
    { id:"ct-pe",    name:"CT Chest CTA (PE Protocol)",       common:true  },
    { id:"ct-ap",    name:"CT Abd/Pelvis w/ Contrast",        common:true  },
    { id:"us-ruq",   name:"US Abdomen RUQ",                   common:true  },
    { id:"cxr-p",    name:"CXR Portable AP",                  common:false },
    { id:"ct-headc", name:"CT Head w/ Contrast",              common:false },
    { id:"ct-csp",   name:"CT C-Spine w/o",                   common:false },
    { id:"ct-chest", name:"CT Chest w/o (Routine)",           common:false },
    { id:"ct-apo",   name:"CT Abd/Pelvis w/o",                common:false },
    { id:"us-pelv",  name:"US Pelvis (Transvaginal)",         common:false },
    { id:"us-dvt",   name:"US Lower Extremity DVT",           common:false },
    { id:"us-renal", name:"US Renal",                         common:false },
    { id:"xr-ankle", name:"XR Ankle",                         common:false },
    { id:"xr-wrist", name:"XR Wrist",                         common:false },
    { id:"xr-hand",  name:"XR Hand",                          common:false },
  ],
  meds: [
    { id:"keto",     name:"Ketorolac 30mg IV",                common:true  },
    { id:"zofran",   name:"Ondansetron 4mg IV",               common:true  },
    { id:"morph",    name:"Morphine 4mg IV",                  common:true  },
    { id:"dilaud",   name:"HYDROmorphone 0.5mg IV",           common:true  },
    { id:"ns1l",     name:"Normal Saline 1L IV Bolus",        common:true  },
    { id:"asa",      name:"Aspirin 324mg PO",                 common:true  },
    { id:"alb",      name:"Albuterol 2.5mg Neb",              common:true  },
    { id:"ativan",   name:"LORazepam 2mg IV",                 common:false },
    { id:"plavix",   name:"Clopidogrel 600mg PO",             common:false },
    { id:"hep",      name:"Heparin IV (ACS Weight-Based)",    common:false },
    { id:"solumed",  name:"Methylprednisolone 125mg IV",      common:false },
    { id:"benadryl", name:"DiphenhydrAMINE 50mg IV",          common:false },
    { id:"metro",    name:"Metoprolol 5mg IV",                common:false },
    { id:"adeno",    name:"Adenosine 6mg IV (Rapid Push)",    common:false },
    { id:"mag",      name:"Magnesium Sulfate 2g IV",          common:false },
    { id:"d5w",      name:"D5W 250mL IV",                     common:false },
  ],
  consults: [
    { id:"cards",    name:"Cardiology",                       common:true  },
    { id:"neuro",    name:"Neurology",                        common:true  },
    { id:"surg",     name:"General Surgery",                  common:true  },
    { id:"ortho",    name:"Orthopedics",                      common:false },
    { id:"psych",    name:"Psychiatry",                       common:false },
    { id:"obgyn",    name:"OB / GYN",                         common:false },
    { id:"uro",      name:"Urology",                          common:false },
    { id:"neph",     name:"Nephrology",                       common:false },
    { id:"gi",       name:"Gastroenterology",                 common:false },
    { id:"pulm",     name:"Pulmonology",                      common:false },
    { id:"id-cons",  name:"Infectious Disease",               common:false },
    { id:"heme",     name:"Hematology / Oncology",            common:false },
  ],
  sets: [
    { id:"s-acs",    name:"ACS Protocol",       sub:"ASA · Troponin · CXR · Heparin",                items:["asa","trop","cxr","hep"]               },
    { id:"s-sepsis", name:"Sepsis Bundle",       sub:"Blood Cx x2 · Lactate · BMP · CBC · NS 1L",    items:["bc","lactate","bmp","cbc","ns1l"]       },
    { id:"s-stroke", name:"Stroke Protocol",     sub:"CT Head · BMP · CBC · Coags",                  items:["ct-head","bmp","cbc","coags"]           },
    { id:"s-chest",  name:"Chest Pain W/U",      sub:"Troponin · CXR · BMP · Ketorolac",             items:["trop","cxr","bmp","keto"]               },
    { id:"s-pe",     name:"PE Protocol",         sub:"D-Dimer · CTA Chest · BMP",                    items:["ddimer","ct-pe","bmp"]                  },
    { id:"s-sync",   name:"Syncope W/U",         sub:"BMP · CBC · Troponin · CXR",                   items:["bmp","cbc","trop","cxr"]                },
    { id:"s-abd",    name:"Abdominal Pain W/U",  sub:"BMP · CBC · Lipase · LFTs · CT Abd/Pelvis",    items:["bmp","cbc","lipase","lfts","ct-ap"]     },
    { id:"s-uti",    name:"UTI / Urosepsis",     sub:"UA w/ Reflex · Blood Cx x2 · BMP · CBC",       items:["ua","bc","bmp","cbc"]                   },
  ],
};

// Flat lookup by id (non-set items only)
const ROC_FLAT = Object.entries(ROC).reduce((acc, [key, arr]) => {
  if (key === "sets") return acc;
  arr.forEach(o => { acc[o.id] = o; });
  return acc;
}, {});

const TAB_META = [
  { key:"labs",     label:"Labs",     icon:"🧪", color:T.cyan   },
  { key:"imaging",  label:"Imaging",  icon:"🩻", color:T.purple },
  { key:"meds",     label:"Meds",     icon:"💊", color:T.gold   },
  { key:"consults", label:"Consults", icon:"📞", color:T.blue   },
  { key:"sets",     label:"Sets",     icon:"⚡", color:T.teal   },
];

// ─── ORDER ROW ────────────────────────────────────────────────────────────────
function OrderRow({ order, selected, tabColor, onToggle }) {
  return (
    <div
      onClick={onToggle}
      style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 8px 8px 10px", borderRadius:8, background:selected ? `${tabColor}0d` : "transparent", border:`1px solid ${selected ? tabColor+"33" : "transparent"}`, cursor:"pointer", transition:"all .1s", marginBottom:2 }}
      onMouseEnter={e => { if (!selected) { e.currentTarget.style.background="rgba(26,53,85,0.28)"; e.currentTarget.style.borderColor="rgba(26,53,85,0.5)"; } }}
      onMouseLeave={e => { if (!selected) { e.currentTarget.style.background="transparent"; e.currentTarget.style.borderColor="transparent"; } }}
    >
      <div style={{ width:14, height:14, borderRadius:4, background:selected ? tabColor : "transparent", border:`1.5px solid ${selected ? tabColor : "rgba(90,130,168,0.45)"}`, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", transition:"all .1s" }}>
        {selected && <span style={{ color:"#000", fontSize:9, fontWeight:700, lineHeight:1 }}>✓</span>}
      </div>
      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:selected ? T.txt : T.txt2, flex:1, lineHeight:1.3 }}>
        {order.name}
      </span>
    </div>
  );
}

// ─── RAPID ORDER DRAWER ───────────────────────────────────────────────────────
function RapidOrderDrawer({ open, onClose, patients, selectedPatient }) {
  const [tab,        setTab]        = useState("labs");
  const [query,      setQuery]      = useState("");
  const [selected,   setSelected]   = useState({});    // { id: { name } }
  const [stat,       setStat]       = useState(false);
  const [ptId,       setPtId]       = useState(null);
  const [placing,    setPlacing]    = useState(false);
  const [placed,     setPlaced]     = useState(false);
  const [showPtPick, setShowPtPick] = useState(false);
  const [showMore,   setShowMore]   = useState(false);

  // Sync patient when prop changes
  useEffect(() => {
    if (selectedPatient?.id) setPtId(selectedPatient.id);
  }, [selectedPatient?.id]);

  // Reset drawer state when closed
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setQuery(""); setPlaced(false); setPlacing(false);
        setSelected({}); setTab("labs"); setStat(false); setShowMore(false);
      }, 250);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Reset showMore + query on tab change
  useEffect(() => { setShowMore(false); setQuery(""); }, [tab]);

  const activePt = patients.find(p => p.id === ptId) || selectedPatient || null;

  const toggle = (id, name) => {
    setSelected(prev => {
      const next = { ...prev };
      if (next[id]) delete next[id]; else next[id] = { name };
      return next;
    });
  };

  const applySet = (set) => {
    setSelected(prev => {
      const next = { ...prev };
      set.items.forEach(id => {
        const o = ROC_FLAT[id];
        if (o) next[id] = { name: o.name };
      });
      return next;
    });
  };

  const placeOrders = async () => {
    if (!activePt || placing || placed || selectedCount === 0) return;
    setPlacing(true);
    await new Promise(r => setTimeout(r, 1300));
    setPlacing(false);
    setPlaced(true);
    setTimeout(onClose, 1500);
  };

  const selectedCount = Object.keys(selected).length;
  const tabMeta       = TAB_META.find(t => t.key === tab) || TAB_META[0];
  const currentList   = tab === "sets" ? ROC.sets : (ROC[tab] || []);
  const filtered      = query
    ? currentList.filter(o => (o.name||"").toLowerCase().includes(query.toLowerCase()))
    : currentList;
  const commonOrders  = filtered.filter(o => o.common);
  const moreOrders    = filtered.filter(o => !o.common);

  // Place button styles
  const canPlace   = selectedCount > 0 && !!activePt && !placing && !placed;
  const btnAccent  = placed ? T.green : stat ? T.red : T.teal;
  const btnBg      = canPlace || placed
    ? `linear-gradient(135deg,${btnAccent}2a,${btnAccent}14)`
    : "rgba(26,53,85,0.18)";

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:8000, background:"rgba(5,15,30,0.52)", backdropFilter:"blur(5px)" }} />

      {/* Drawer */}
      <div className="drawer-in" style={{ position:"fixed", top:0, right:0, bottom:0, width:460, zIndex:8001, display:"flex", flexDirection:"column", background:T.panel, borderLeft:`1px solid ${T.teal}44`, boxShadow:"-28px 0 80px rgba(0,0,0,0.72), inset 1px 0 0 rgba(0,229,192,0.07)" }}>

        {/* ── Header ── */}
        <div style={{ padding:"16px 20px 12px", borderBottom:"1px solid rgba(26,53,85,0.55)", flexShrink:0, background:`linear-gradient(180deg,${T.bg} 0%,${T.panel} 100%)` }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
            <div style={{ display:"flex", alignItems:"center", gap:9 }}>
              <div style={{ width:28, height:28, borderRadius:7, background:`linear-gradient(135deg,${T.coral}44,${T.coral}22)`, border:`1px solid ${T.coral}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>⚡</div>
              <div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700, color:T.txt, lineHeight:1.1 }}>Rapid Order</div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7, color:T.txt4, letterSpacing:"0.1em", textTransform:"uppercase" }}>Place without leaving the board</div>
              </div>
              {stat && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, color:T.red, background:"rgba(255,68,68,0.12)", border:`1px solid ${T.red}44`, borderRadius:4, padding:"2px 7px", letterSpacing:"0.1em" }}>STAT</span>}
            </div>
            <button onClick={onClose} style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, color:T.txt4, cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:10, padding:"5px 11px", transition:"all .12s" }}>✕ ESC</button>
          </div>

          {/* ── Patient context bar ── */}
          <div style={{ background:"rgba(11,30,54,0.7)", border:"1px solid rgba(26,53,85,0.6)", borderRadius:9, padding:"9px 13px", position:"relative" }}>
            {activePt ? (
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4, background:"rgba(26,53,85,0.6)", border:"1px solid rgba(26,53,85,0.8)", borderRadius:4, padding:"1px 6px" }}>{activePt.room}</span>
                    <EsiBadge esi={activePt.esi} />
                    <TimeBadge mins={activePt.mins} />
                  </div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:13, fontWeight:700, color:T.txt, lineHeight:1.2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{activePt.name}</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.txt3, marginTop:2 }}>
                    {activePt.age}{activePt.sex} · <span style={{ color:T.teal }}>{activePt.cc}</span>
                  </div>
                </div>
                <div style={{ position:"relative", flexShrink:0 }}>
                  <button onClick={() => setShowPtPick(p => !p)} style={{ background:"rgba(0,229,192,0.07)", border:`1px solid ${T.teal}30`, borderRadius:6, color:T.teal, cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:8, padding:"4px 9px", display:"flex", alignItems:"center", gap:4 }}>
                    Change <span style={{ fontSize:9 }}>▾</span>
                  </button>
                  {showPtPick && (
                    <div style={{ position:"absolute", right:0, top:"calc(100% + 5px)", width:240, background:T.card, border:`1px solid rgba(26,53,85,0.7)`, borderRadius:9, zIndex:200, overflow:"hidden", maxHeight:220, overflowY:"auto", boxShadow:"0 12px 40px rgba(0,0,0,0.6)" }}>
                      {[...patients].sort((a,b) => a.esi - b.esi).map(p => (
                        <div key={p.id} onClick={() => { setPtId(p.id); setShowPtPick(false); }} style={{ padding:"8px 13px", cursor:"pointer", borderBottom:"1px solid rgba(26,53,85,0.3)", background:p.id === ptId ? `${T.teal}12` : "transparent", display:"flex", alignItems:"center", gap:8 }}>
                          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4, flexShrink:0 }}>{p.room}</span>
                          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.name}</span>
                          <EsiBadge esi={p.esi} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt4, textAlign:"center", padding:"4px 0" }}>
                No patient selected — choose from the list above
              </div>
            )}
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div style={{ display:"flex", borderBottom:"1px solid rgba(26,53,85,0.5)", background:T.bg, flexShrink:0 }}>
          {TAB_META.map(t => {
            const active = tab === t.key;
            return (
              <button key={t.key} onClick={() => setTab(t.key)} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3, padding:"10px 4px 8px", background:active ? `${t.color}12` : "transparent", border:"none", borderBottom:`2px solid ${active ? t.color : "transparent"}`, color:active ? t.color : T.txt4, cursor:"pointer", transition:"all .12s" }}>
                <span style={{ fontSize:14, lineHeight:1 }}>{t.icon}</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:active ? 700 : 400, letterSpacing:"0.06em" }}>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Search ── */}
        <div style={{ padding:"9px 16px 4px", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(26,53,85,0.5)", borderRadius:8, padding:"6px 10px" }}>
            <span style={{ fontSize:11, color:T.txt4, flexShrink:0 }}>🔍</span>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder={`Search ${tab}...`} style={{ flex:1, background:"transparent", border:"none", outline:"none", fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt }} />
            {query && <button onClick={() => setQuery("")} style={{ background:"none", border:"none", color:T.txt4, cursor:"pointer", fontSize:11, flexShrink:0 }}>✕</button>}
          </div>
        </div>

        {/* ── Order list ── */}
        <div style={{ flex:1, overflowY:"auto", padding:"4px 16px 8px" }}>
          {tab === "sets" ? (
            <div style={{ display:"flex", flexDirection:"column", gap:8, paddingTop:4 }}>
              {filtered.map(set => {
                const allApplied = set.items.every(id => !!selected[id]);
                return (
                  <div key={set.id} onClick={() => applySet(set)} style={{ ...gc({ borderRadius:10, borderLeft:`3px solid ${allApplied ? T.teal : T.teal+"55"}`, background:allApplied ? `${T.teal}0d` : `linear-gradient(135deg,${T.teal}07,${T.card})` }), padding:"12px 14px", cursor:"pointer", transition:"all .15s" }} onMouseEnter={e => { e.currentTarget.style.boxShadow=`0 0 22px ${T.teal}14`; }} onMouseLeave={e => { e.currentTarget.style.boxShadow="none"; }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:5 }}>
                      <span style={{ fontFamily:"'Playfair Display',serif", fontSize:13, fontWeight:700, color:allApplied ? T.teal : T.txt }}>{set.name}</span>
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:allApplied ? T.teal : T.txt4, background:allApplied ? `${T.teal}18` : "rgba(26,53,85,0.4)", border:`1px solid ${allApplied ? T.teal+"44" : "rgba(26,53,85,0.5)"}`, borderRadius:4, padding:"2px 7px" }}>
                        {allApplied ? "✓ Applied" : "+ Apply All"}
                      </span>
                    </div>
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt3, lineHeight:1.5, marginBottom:8 }}>{set.sub}</div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                      {set.items.map(id => {
                        const o = ROC_FLAT[id];
                        if (!o) return null;
                        const isSel = !!selected[id];
                        return (
                          <span key={id} onClick={e => { e.stopPropagation(); toggle(id, o.name); }} style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:isSel ? T.teal : T.txt4, background:isSel ? `${T.teal}18` : "rgba(26,53,85,0.35)", border:`1px solid ${isSel ? T.teal+"44" : "rgba(26,53,85,0.4)"}`, borderRadius:4, padding:"2px 7px", cursor:"pointer", transition:"all .1s" }}>
                            {isSel ? "✓ " : ""}{o.name}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ paddingTop:4 }}>
              {/* Common orders */}
              {!query && commonOrders.length > 0 && (
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7, fontWeight:700, color:T.txt4, textTransform:"uppercase", letterSpacing:"0.12em", padding:"4px 2px 5px" }}>Common</div>
              )}
              {(query ? filtered : commonOrders).map(o => (
                <OrderRow key={o.id} order={o} selected={!!selected[o.id]} tabColor={tabMeta.color} onToggle={() => toggle(o.id, o.name)} />
              ))}

              {/* More orders toggle */}
              {!query && moreOrders.length > 0 && (
                <>
                  <button onClick={() => setShowMore(p => !p)} style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"6px 2px 5px", background:"none", border:"none", borderTop:"1px solid rgba(26,53,85,0.3)", cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:7, fontWeight:700, color:T.txt4, textTransform:"uppercase", letterSpacing:"0.12em", marginTop:4 }}>
                    <span>More ({moreOrders.length})</span>
                    <span style={{ fontSize:9 }}>{showMore ? "▲" : "▾"}</span>
                  </button>
                  {showMore && moreOrders.map(o => (
                    <OrderRow key={o.id} order={o} selected={!!selected[o.id]} tabColor={tabMeta.color} onToggle={() => toggle(o.id, o.name)} />
                  ))}
                </>
              )}

              {/* Empty search */}
              {query && filtered.length === 0 && (
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt4, textAlign:"center", padding:"28px 0" }}>No results for "{query}"</div>
              )}
            </div>
          )}
        </div>

        {/* ── Cart footer ── */}
        <div style={{ flexShrink:0, borderTop:"1px solid rgba(26,53,85,0.55)", background:T.bg, padding:"11px 16px 14px" }}>

          {/* Selected order pills */}
          {selectedCount > 0 && (
            <div style={{ maxHeight:70, overflowY:"auto", marginBottom:10 }}>
              <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                {Object.entries(selected).map(([id, { name }]) => (
                  <span key={id} onClick={() => toggle(id, name)} style={{ display:"inline-flex", alignItems:"center", gap:4, fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.teal, background:"rgba(0,229,192,0.08)", border:"1px solid rgba(0,229,192,0.25)", borderRadius:20, padding:"3px 9px", cursor:"pointer", lineHeight:1.4, transition:"all .1s" }}>
                    {name} <span style={{ color:T.txt4, fontSize:9, lineHeight:1 }}>✕</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            {/* STAT toggle */}
            <button onClick={() => setStat(p => !p)} style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 12px", background:stat ? "rgba(255,68,68,0.1)" : "rgba(26,53,85,0.28)", border:`1px solid ${stat ? T.red+"55" : "rgba(26,53,85,0.5)"}`, borderRadius:8, color:stat ? T.red : T.txt4, cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, transition:"all .15s", flexShrink:0 }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:stat ? T.red : T.txt4, display:"inline-block", flexShrink:0, transition:"background .15s" }} />
              {stat ? "STAT" : "Routine"}
            </button>

            {/* Clear */}
            {selectedCount > 0 && (
              <button onClick={() => setSelected({})} style={{ padding:"7px 10px", background:"transparent", border:"1px solid rgba(26,53,85,0.5)", borderRadius:8, color:T.txt4, cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:9, flexShrink:0 }}>Clear</button>
            )}

            <div style={{ flex:1 }} />

            {/* Place Orders */}
            <button
              onClick={placeOrders}
              disabled={!canPlace && !placed}
              style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 18px", background:btnBg, border:`1.5px solid ${canPlace||placed ? btnAccent+"55" : "rgba(26,53,85,0.35)"}`, borderRadius:9, color:canPlace||placed ? btnAccent : T.txt4, cursor:canPlace ? "pointer" : "not-allowed", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:700, transition:"all .18s", flexShrink:0 }}
            >
              {placing ? (
                <>
                  <span style={{ width:10, height:10, borderRadius:"50%", border:`2px solid ${T.teal}30`, borderTop:`2px solid ${T.teal}`, display:"inline-block", animation:"cc-spin 1s linear infinite" }} />
                  Placing...
                </>
              ) : placed ? (
                <>✓ Orders Placed</>
              ) : (
                <>
                  {stat ? "⚡ STAT" : "Place Orders"}
                  {selectedCount > 0 && (
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, background:"rgba(0,0,0,0.2)", borderRadius:10, padding:"1px 7px", lineHeight:1.5 }}>{selectedCount}</span>
                  )}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── COMMAND CENTER — MAIN EXPORT ─────────────────────────────────────────────
export default function CommandCenter() {
  const [search,          setSearch]          = useState("");
  const [showNewPatient,  setShowNewPatient]  = useState(false);
  const [showPalette,     setShowPalette]     = useState(false);
  const [showRapidOrder,  setShowRapidOrder]  = useState(false);
  const [patients,        setPatients]        = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [summaries,       setSummaries]       = useState({});

  useEffect(() => {
    base44.entities.Patient.list().then(data => {
      setPatients(data);
      setLoading(false);
    });
  }, []);

  // Global ⌘K
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setShowPalette(p => !p); }
      if (e.key === "Escape") { setShowRapidOrder(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const generateSummary = async (patient) => {
    if (!patient?.id || summaries[patient.id]) return;
    setSummaries(prev => ({ ...prev, [patient.id]: { text: null, loading: true } }));
    const ordersText = (Array.isArray(patient.orders) ? patient.orders : []).slice(0, 4).map(o => `${o.name} (${o.status})`).join(", ") || "none placed yet";
    const alertsText = (Array.isArray(patient.alerts) ? patient.alerts : []).map(a => a.m).join("; ") || "none";
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are writing a one-line ED census summary for a physician scanning a trackboard.\n\nPatient: ${patient.age || ""}${patient.sex || ""}, ESI ${patient.esi || "?"}, LOS ${patient.mins || 0}min\nCC: ${patient.cc || "unknown"}\nOrders: ${ordersText}\nCritical alerts: ${alertsText}\n\nWrite exactly ONE sentence under 25 words. Lead with the key clinical finding or working diagnosis, then the most urgent pending action or current status. Be specific and clinical. No filler phrases like "patient presents with."`,
        response_json_schema: { type:"object", properties:{ summary:{ type:"string" } }, required:["summary"] }
      });
      setSummaries(prev => ({ ...prev, [patient.id]: { text: result.summary, loading: false } }));
    } catch {
      setSummaries(prev => ({ ...prev, [patient.id]: { text: null, loading: false } }));
    }
  };

  const handleSelectPatient = (p) => {
    setSelectedPatient(p);
    generateSummary(p);
  };

  if (loading) {
    return (
      <div style={{ display:"flex", height:"100vh", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:14, background:T.bg }}>
        <div style={{ width:32, height:32, borderRadius:"50%", border:`3px solid rgba(0,229,192,0.2)`, borderTop:`3px solid ${T.teal}`, animation:"cc-spin 1s linear infinite" }} />
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.txt3 }}>Loading census...</div>
      </div>
    );
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", overflow:"hidden", background:T.bg, color:T.txt, fontFamily:"'DM Sans',sans-serif" }}>
      <TopBar
        onQuickNote={() => nav("QuickNote")}
        onNewPatient={() => setShowNewPatient(true)}
        onOpenPalette={() => setShowPalette(true)}
        onRapidOrder={() => setShowRapidOrder(true)}
      />

      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>
        <CensusPanel
          patients={patients}
          search={search}
          onSearch={setSearch}
          selectedId={selectedPatient?.id}
          onSelect={handleSelectPatient}
          summaries={summaries}
        />

        {selectedPatient
          ? <PatientSummaryPanel
              key={selectedPatient.id}
              patient={selectedPatient}
              summary={summaries[selectedPatient.id]}
              onRapidOrder={() => setShowRapidOrder(true)}
            />
          : <SelectPatientPrompt patients={patients} />
        }

        <ShiftRail patients={patients} />
      </div>

      {showNewPatient && <NewPatientModal onClose={() => setShowNewPatient(false)} />}

      <CommandPalette
        open={showPalette}
        onClose={() => setShowPalette(false)}
        patients={patients}
        onNewPatient={() => { setShowPalette(false); setShowNewPatient(true); }}
      />

      <RapidOrderDrawer
        open={showRapidOrder}
        onClose={() => setShowRapidOrder(false)}
        patients={patients}
        selectedPatient={selectedPatient}
      />
    </div>
  );
}