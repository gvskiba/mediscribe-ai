import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";

// ─── STYLE INJECTION ──────────────────────────────────────────────────────────
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
    @keyframes ew-spin{to{transform:rotate(360deg)}}
    @keyframes pulse-red{0%,100%{opacity:1}50%{opacity:0.45}}
    .pulse-red{animation:pulse-red 1.6s ease-in-out infinite}
    @keyframes ew-pulse{0%,100%{opacity:1}50%{opacity:.42}}
    .ew-pulse{animation:ew-pulse 1.6s ease-in-out infinite}
    @keyframes drawer-in{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
    .drawer-in{animation:drawer-in .22s cubic-bezier(.22,.68,0,1.15) forwards}
    @media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
  `;
  document.head.appendChild(s);
})();

// ─── TOKENS ───────────────────────────────────────────────────────────────────
const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36",
  txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0", red:"#ff4444", cyan:"#00d4ff",
};

// ─── NAVIGATION ───────────────────────────────────────────────────────────────
const nav = (page, params = {}) => {
  const query = Object.keys(params).length ? "?" + new URLSearchParams(params).toString() : "";
  window.location.href = `/${page}${query}`;
};

const CURRENT_USER = "Skiba";

// ─── COMMAND PALETTE DATA ─────────────────────────────────────────────────────
const HUBS = [
  { key:"ECGHub",                 label:"ECG Interpreter",          icon:"💓", cat:"Clinical"      },
  { key:"AirwayHub",              label:"Airway Management",         icon:"🫁", cat:"Clinical"      },
  { key:"ShockHub",               label:"Shock Hub",                 icon:"⚡", cat:"Clinical"      },
  { key:"SepsisHub",              label:"Sepsis Protocol",           icon:"🦠", cat:"Clinical"      },
  { key:"StrokeHub",              label:"Stroke Assessment",         icon:"🧠", cat:"Clinical"      },
  { key:"ToxicologyHub",          label:"Toxicology",                icon:"☣️", cat:"Clinical"      },
  { key:"PsychHub",               label:"Psych Evaluation",          icon:"🧩", cat:"Clinical"      },
  { key:"OrthoHub",               label:"Ortho Reference",           icon:"🦴", cat:"Clinical"      },
  { key:"CardiacRiskPage",        label:"Cardiac Risk Calc",         icon:"❤️", cat:"Clinical"      },
  { key:"POCUSHub",               label:"POCUS Guide",               icon:"🔊", cat:"Clinical"      },
  { key:"DermatologyHub",         label:"Dermatology",               icon:"🔬", cat:"Clinical"      },
  { key:"ElectrolyteAcidBaseHub", label:"Electrolytes & Acid-Base",  icon:"⚗️", cat:"Clinical"      },
  { key:"TriageHub",              label:"Triage Tools",              icon:"🏥", cat:"Workflow"      },
  { key:"RapidAssessmentHub",     label:"Rapid Assessment",          icon:"🚀", cat:"Workflow"      },
  { key:"ERxHub",                 label:"ED Prescribing",            icon:"💊", cat:"Workflow"      },
  { key:"OrderGeneratorHub",      label:"Order Generator",           icon:"📋", cat:"Workflow"      },
  { key:"AutocoderHub",           label:"Auto-Coder / ICD-10",       icon:"🏷️", cat:"Workflow"      },
  { key:"ImagingInterpreter",     label:"Imaging Interpreter",       icon:"🩻", cat:"Workflow"      },
  { key:"NewPatientInput",        label:"Full Intake (NPI)",         icon:"📝", cat:"Documentation" },
  { key:"QuickNote",              label:"Quick Note",                icon:"✏️", cat:"Documentation" },
];

const paletteFilter = (query, patients) => {
  const q = query.toLowerCase().trim();
  const match = (strs) => !q || strs.some(s => (s||"").toLowerCase().includes(q));
  const actions = [
    { key:"act-qn", label:"Quick Note",     sub:"Fast bedside documentation", icon:"✏️", badge:"Action", badgeColor:T.teal,   execute:() => nav("QuickNote")     },
    { key:"act-np", label:"New Patient",    sub:"Open patient mode selector", icon:"➕", badge:"Action", badgeColor:T.gold,   execute:"__newPatient__"            },
    { key:"act-cc", label:"Command Center", sub:"Return to census board",     icon:"⚡", badge:"Action", badgeColor:T.purple, execute:() => nav("CommandCenter") },
  ].filter(a => match([a.label, a.sub]));
  const pts  = patients.filter(p => match([p.name, p.cc, p.room, `esi ${p.esi}`, `${p.age}${p.sex}`])).sort((a,b)=>a.esi-b.esi).slice(0, q ? 6 : 4);
  const hubs = HUBS.filter(h => match([h.label, h.key, h.cat])).slice(0, q ? 10 : 5);
  return { actions, pts, hubs };
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const esiColor  = (n) => ({1:T.red,2:T.orange,3:T.gold,4:T.green,5:T.txt4}[n]||T.txt4);
const fmtTime   = (m) => m < 60 ? `${m}m` : `${Math.floor(m/60)}h ${m%60}m`;
const gc        = (x={}) => ({ background:T.card, border:"1px solid rgba(26,53,85,0.5)", borderRadius:10, ...x });
const idHash    = (id="") => id.split("").reduce((a,c)=>(a*31+c.charCodeAt(0))&0xffff, 0);
const TAB_ACCENT = { labs:T.cyan, imaging:T.purple, meds:T.gold, consults:T.blue, sets:T.teal };

// ─── SITUATIONAL AWARENESS HELPERS ───────────────────────────────────────────
// Protocol timer: time-critical countdowns for STEMI / Stroke / Sepsis flags
function getProtocolTimer(patient) {
  const flags = Array.isArray(patient.flags) ? patient.flags : [];
  const mins  = patient.mins || 0;
  if (flags.includes("STEMI")) {
    // Door-to-balloon target: 90 min
    const c = mins>=90?T.red:mins>=60?T.gold:T.green;
    return { label:`D2B ${mins}m`, sublabel:"/ 90m", color:c, urgent:mins>=90, protocol:"STEMI" };
  }
  if (flags.includes("Stroke")) {
    // tPA window: 4.5h (270 min) from last known well
    const lkw = patient.lkw_mins||mins;
    const rem  = Math.max(0, 270-lkw);
    if (rem===0) return { label:"tPA CLOSED", sublabel:"window gone", color:T.red, urgent:true, protocol:"Stroke" };
    const c = rem<=60?T.red:rem<=120?T.gold:T.teal;
    return { label:`tPA ${rem}m`, sublabel:"remaining", color:c, urgent:rem<=60, protocol:"Stroke" };
  }
  if (flags.includes("Sepsis")) {
    // Antibiotic target: 60 min
    const c = mins>=60?T.red:mins>=45?T.gold:T.green;
    return { label:`ABX ${mins}m`, sublabel:"/ 60m", color:c, urgent:mins>=60, protocol:"Sepsis" };
  }
  return null;
}

// Clinical trajectory: ↑ ↓ → from last 2 vital sets — shows direction, not just value
function deriveTrajectory(patient) {
  const sets = deriveVitalsTrend(patient);
  if (sets.length < 2) return null;
  const first=sets[0], last=sets[sets.length-1];
  let score=0;
  const hrDiff=last.HR-first.HR;           // lower HR = better
  const spDiff=last.SpO2-first.SpO2;       // higher SpO2 = better
  const rrDiff=last.RR-first.RR;           // lower RR = better
  const bpF=parseInt(first.BP||"120"), bpL=parseInt(last.BP||"120");
  if (hrDiff < -5) score++; else if (hrDiff > 5) score--;
  if (spDiff >  1) score++; else if (spDiff < -1) score--;
  if (rrDiff < -2) score++; else if (rrDiff >  2) score--;
  if (!isNaN(bpF)&&!isNaN(bpL)) {
    if (bpF<90&&bpL>bpF+5)    score++;   // BP recovering from hypotension
    else if (bpF>=90&&bpL<bpF-10) score--; // BP falling from normal
  }
  if (score >= 2)  return { icon:"↑", color:T.green, label:"Improving"    };
  if (score <= -2) return { icon:"↓", color:T.red,   label:"Deteriorating" };
  return                 { icon:"→", color:T.txt4,  label:"Stable"        };
}

// q-SOFA early warning score (0–3): uses derived vitals for demo
// Wire: when real-time vitals land in entity, swap deriveVitalsTrend for patient.vitals directly
function qSOFA(patient) {
  const sets = deriveVitalsTrend(patient);
  const v    = sets[sets.length-1];
  if (!v) return null;
  let score = 0;
  if ((v.RR||0) >= 22)                  score++; // tachypnea
  if (parseInt(v.BP||"120") <= 100)     score++; // hypotension
  if ((v.GCS||15) < 15)                 score++; // altered mentation
  const color = score>=2?T.red:score===1?T.gold:T.txt4;
  return { score, color };
}

// ─── STORAGE (window.storage + in-memory fallback) ────────────────────────────
const _ewMem = {};
async function ewGet(k, fb) {
  try { if (window?.storage?.get) { const r = await window.storage.get(k); if (r?.value !== undefined) return r.value; } } catch(e) {}
  return k in _ewMem ? _ewMem[k] : fb;
}
async function ewSet(k, v) {
  _ewMem[k] = v;
  try { if (window?.storage?.set) await window.storage.set(k, v); } catch(e) {}
}

// ─── RESULT CHIPS ─────────────────────────────────────────────────────────────
const CHIP_STYLE = {
  pending:  { color:T.gold,   marker:"⏳", bg:"rgba(245,200,66,0.08)",   border:"rgba(245,200,66,0.38)"   },
  resulted: { color:T.teal,   marker:"✓",  bg:"rgba(0,229,192,0.07)",   border:"rgba(0,229,192,0.38)"    },
  critical: { color:T.red,    marker:"!",  bg:"rgba(255,68,68,0.12)",   border:"rgba(255,68,68,0.55)"    },
  running:  { color:T.cyan,   marker:"↻",  bg:"rgba(0,212,255,0.07)",   border:"rgba(0,212,255,0.38)"    },
  consult:  { color:T.purple, marker:"→",  bg:"rgba(155,109,255,0.08)", border:"rgba(155,109,255,0.38)"  },
};
const WORKUP_PROFILES = [
  [{ label:"3 Labs",  status:"pending"  },{ label:"Troponin",status:"critical"},{ label:"CT",   status:"pending" },{ label:"Cards", status:"consult" }],
  [{ label:"2 Labs",  status:"pending"  },{ label:"CXR",     status:"resulted"},{ label:"EKG",  status:"resulted"}],
  [{ label:"Lactate", status:"critical" },{ label:"BC x2",   status:"pending" },{ label:"CT",   status:"running" },{ label:"ID",    status:"consult" }],
  [{ label:"Labs",    status:"pending"  },{ label:"CT",      status:"critical"},{ label:"Neuro",status:"consult" }],
  [{ label:"2 Labs",  status:"pending"  },{ label:"XR",      status:"pending" }],
  [{ label:"Labs",    status:"resulted" },{ label:"CT",      status:"resulted"},{ label:"Neuro",status:"consult" }],
  [{ label:"2 Labs",  status:"pending"  },{ label:"US",      status:"running" }],
  [{ label:"Labs",    status:"resulted" },{ label:"XR",      status:"resulted"}],
  [{ label:"UA",      status:"pending"  }],
  [{ label:"UA",      status:"resulted" },{ label:"XR",      status:"resulted"}],
];
function deriveResultChips(patient) {
  const orders = Array.isArray(patient.orders) ? patient.orders : [];
  if (orders.length > 0) {
    const chips=[], labs=orders.filter(o=>o.type==="lab"), imaging=orders.filter(o=>o.type==="imaging"), consults=orders.filter(o=>o.type==="consult");
    labs.filter(o=>o.status==="critical").forEach(o=>chips.push({ label:(o.name||"Lab").split(" ")[0], status:"critical" }));
    const pend=labs.filter(o=>o.status==="pending"), done=labs.filter(o=>o.status==="resulted"||o.status==="given");
    if (pend.length) chips.push({ label:`${pend.length} Lab${pend.length>1?"s":""}`, status:"pending" });
    else if (done.length) chips.push({ label:"Labs", status:"resulted" });
    imaging.forEach(o=>chips.push({ label:(o.name||"Img").split(" ")[0], status:o.status==="critical"?"critical":o.status==="resulted"?"resulted":o.status==="running"?"running":"pending" }));
    consults.forEach(o=>chips.push({ label:(o.name||"Consult").split(" ")[0], status:"consult" }));
    return chips;
  }
  const h=idHash(String(patient.id||"")+String(patient.mins||"")), esi=patient.esi||3;
  return esi<=2 ? WORKUP_PROFILES[h%4] : esi===3 ? WORKUP_PROFILES[4+(h%4)] : WORKUP_PROFILES[8+(h%2)];
}
function ResultChipsRow({ chips }) {
  if (!chips||chips.length===0) return null;
  return (
    <div style={{ display:"flex",alignItems:"center",gap:4,flexWrap:"nowrap",marginTop:3 }}>
      {chips.slice(0,4).map((chip,i)=>{ const s=CHIP_STYLE[chip.status]||CHIP_STYLE.pending; const isCrit=chip.status==="critical"; return <span key={i} className={isCrit?"pulse-red":undefined} style={{ display:"inline-flex",alignItems:"center",gap:3,fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:isCrit?700:500,color:s.color,background:s.bg,border:`1px solid ${s.border}`,borderRadius:5,padding:"2px 6px",whiteSpace:"nowrap",flexShrink:0 }}>{chip.label} {s.marker}</span>; })}
      {chips.length>4&&<span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.txt4,flexShrink:0 }}>+{chips.length-4}</span>}
    </div>
  );
}

// ─── DISPOSITION ──────────────────────────────────────────────────────────────
const DISPO_MAP = {
  dc_ready:         { label:"D/C Ready",      color:T.green  },
  admitted:         { label:"Bed Pending",     color:T.cyan   },
  obs:              { label:"Obs Pending",     color:T.gold   },
  awaiting_consult: { label:"Consult Pending", color:T.purple },
  transfer:         { label:"Transfer Pending",color:T.orange },
  boarding:         { label:"Boarding",        color:T.blue   },
};
const DISPO_BY_ESI = {
  1:["admitted","boarding","awaiting_consult","admitted"],
  2:["admitted","awaiting_consult","obs","boarding"],
  3:["dc_ready","obs","awaiting_consult","workup"],
  4:["dc_ready","workup","dc_ready","workup"],
  5:["dc_ready","workup"],
};
const dispoHash = (id="",mins=0) => (id.split("").reduce((a,c)=>(a*17+c.charCodeAt(0))&0xffff,0)+mins*7)&0xffff;
function deriveDispoStatus(patient) {
  if (patient.dispo_status) return patient.dispo_status;
  const pool = DISPO_BY_ESI[patient.esi||3]||DISPO_BY_ESI[3];
  return pool[dispoHash(String(patient.id||""), patient.mins||0) % pool.length];
}
function DispoBadge({ status }) {
  const d = DISPO_MAP[status]; if (!d) return null;
  return <span style={{ display:"inline-flex",alignItems:"center",gap:4,fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:600,color:d.color,background:`${d.color}14`,border:`1px solid ${d.color}44`,borderRadius:5,padding:"2px 7px",whiteSpace:"nowrap",flexShrink:0 }}><span style={{ width:4,height:4,borderRadius:"50%",background:d.color,display:"inline-block",flexShrink:0 }}/>{d.label}</span>;
}

// ─── PROVIDERS ────────────────────────────────────────────────────────────────
const ROLE_STYLE     = { MD:{color:T.teal,abbr:"MD"}, RN:{color:T.gold,abbr:"RN"}, R:{color:T.purple,abbr:"R"}, NP:{color:T.blue,abbr:"NP"}, PA:{color:T.cyan,abbr:"PA"} };
const ATTENDING_POOL = ["Skiba","Chen","Patel","Williams","Martinez","Johnson","Park","Thompson"];
const NURSE_POOL     = ["Torres","Kim","Johnson","Davis","Lee","Nguyen","Brown","Wilson"];
const RESIDENT_POOL  = ["Smith (R1)","Brown (R2)","Garcia (R3)","Wilson (R1)","Patel (R2)"];
const providerHash   = (id="",mins=0) => (id.split("").reduce((a,c)=>(a*23+c.charCodeAt(0))&0xffff,0)+mins*11)&0xffff;
function deriveProviders(patient) {
  if (patient.providers?.length) return patient.providers;
  const h=providerHash(String(patient.id||""), patient.mins||0), esi=patient.esi||3;
  const list=[{ role:"MD",name:ATTENDING_POOL[h%ATTENDING_POOL.length] },{ role:"RN",name:NURSE_POOL[(h*3+7)%NURSE_POOL.length] }];
  if (esi<=2||(esi===3&&h%3===0)) list.push({ role:"R",name:RESIDENT_POOL[(h*5)%RESIDENT_POOL.length] });
  return list;
}
function ProviderRow({ providers, compact }) {
  if (!providers?.length) return null;
  return <div style={{ display:"flex",alignItems:"center",gap:compact?6:10,flexWrap:"nowrap",overflow:"hidden" }}>{providers.map((pv,i)=>{ const rs=ROLE_STYLE[pv.role]||ROLE_STYLE.MD; return <div key={i} style={{ display:"inline-flex",alignItems:"center",gap:3,flexShrink:0 }}><span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:compact?7:8,fontWeight:700,color:rs.color,background:`${rs.color}18`,border:`1px solid ${rs.color}44`,borderRadius:3,padding:"1px 4px",lineHeight:1.5 }}>{rs.abbr}</span><span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:compact?9:11,color:T.txt3,whiteSpace:"nowrap" }}>{pv.name}</span></div>; })}</div>;
}

// ─── PRIMITIVES ───────────────────────────────────────────────────────────────
function Btn({ children, accent=T.teal, onClick, sm, disabled }) {
  return <button onClick={onClick} disabled={disabled} style={{ display:"inline-flex",alignItems:"center",gap:6,fontFamily:"'DM Sans',sans-serif",fontSize:sm?10:12,fontWeight:600,color:disabled?T.txt4:accent,background:disabled?"rgba(26,53,85,0.2)":`linear-gradient(135deg,${accent}22,${accent}0a)`,border:`1px solid ${disabled?"rgba(26,53,85,0.3)":accent+"55"}`,borderRadius:8,padding:sm?"4px 10px":"7px 15px",cursor:disabled?"not-allowed":"pointer",transition:"all .15s",whiteSpace:"nowrap" }}>{children}</button>;
}
function EsiBadge({ esi }) {
  const c=esiColor(esi);
  return <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700,color:c,background:`${c}18`,border:`1px solid ${c}45`,borderRadius:5,padding:"2px 7px",whiteSpace:"nowrap" }}>ESI {esi}</span>;
}
function TimeBadge({ mins }) {
  const c=mins>120?T.red:mins>60?T.gold:T.txt4;
  return <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:c,minWidth:40,textAlign:"right" }}>{fmtTime(mins)}</span>;
}
function SectionTitle({ children }) {
  return <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:700,color:T.txt4,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:8 }}>{children}</div>;
}

// ─── LAB DERIVATION ───────────────────────────────────────────────────────────
// Wire: replace with patient.labs entity field when data model is ready
const CC_LAB_PROFILES = {
  cardiac:[
    { name:"WBC",    value:14.2, unit:"K/μL",   lo:4.5, hi:11.0, delta:"+2.1" },
    { name:"Hgb",    value:13.8, unit:"g/dL",   lo:12,  hi:17.5, delta:null   },
    { name:"Plt",    value:198,  unit:"K/μL",   lo:150, hi:400,  delta:null   },
    { name:"Na",     value:136,  unit:"mEq/L",  lo:136, hi:145,  delta:null   },
    { name:"K",      value:3.8,  unit:"mEq/L",  lo:3.5, hi:5.0,  delta:"−0.2"},
    { name:"Cr",     value:1.2,  unit:"mg/dL",  lo:0.6, hi:1.2,  delta:null   },
    { name:"Glc",    value:158,  unit:"mg/dL",  lo:70,  hi:100,  delta:null   },
    { name:"Lactate",value:1.8,  unit:"mmol/L", lo:0.5, hi:2.0,  delta:null   },
    { name:"Trop I", value:"CRITICAL  0.84", unit:"ng/mL", critical:true, lo:0, hi:0.04, delta:null },
  ],
  sepsis:[
    { name:"WBC",    value:18.4, unit:"K/μL",   lo:4.5, hi:11.0, delta:"+6.2"},
    { name:"Hgb",    value:11.2, unit:"g/dL",   lo:12,  hi:17.5, delta:null   },
    { name:"Plt",    value:142,  unit:"K/μL",   lo:150, hi:400,  delta:"−28" },
    { name:"Na",     value:134,  unit:"mEq/L",  lo:136, hi:145,  delta:null   },
    { name:"K",      value:4.2,  unit:"mEq/L",  lo:3.5, hi:5.0,  delta:null   },
    { name:"Cr",     value:2.1,  unit:"mg/dL",  lo:0.6, hi:1.2,  delta:null   },
    { name:"BUN",    value:32,   unit:"mg/dL",  lo:7,   hi:20,   delta:null   },
    { name:"Glc",    value:142,  unit:"mg/dL",  lo:70,  hi:100,  delta:null   },
    { name:"Lactate",value:"CRITICAL  4.2", unit:"mmol/L", critical:true, lo:0.5, hi:2.0, delta:null },
  ],
  default:[
    { name:"WBC",    value:9.2,  unit:"K/μL",   lo:4.5, hi:11.0, delta:null },
    { name:"Hgb",    value:13.4, unit:"g/dL",   lo:12,  hi:17.5, delta:null },
    { name:"Plt",    value:234,  unit:"K/μL",   lo:150, hi:400,  delta:null },
    { name:"Na",     value:140,  unit:"mEq/L",  lo:136, hi:145,  delta:null },
    { name:"K",      value:4.0,  unit:"mEq/L",  lo:3.5, hi:5.0,  delta:null },
    { name:"Cr",     value:0.9,  unit:"mg/dL",  lo:0.6, hi:1.2,  delta:null },
    { name:"Glc",    value:98,   unit:"mg/dL",  lo:70,  hi:100,  delta:null },
  ],
};
function deriveLabs(p) {
  if (Array.isArray(p.labs)&&p.labs.length) return p.labs;
  const cc=(p.cc||"").toLowerCase();
  const isCardiac=["chest","stemi","cardiac","arrest","troponin"].some(k=>cc.includes(k));
  const isSepsis=["sepsis","fever","hypotension","lactate","infection"].some(k=>cc.includes(k));
  return CC_LAB_PROFILES[isCardiac?"cardiac":isSepsis?"sepsis":"default"].map(r=>({...r,ts:"14:"+(38+idHash(String(p.id||"")+r.name)%12).toString().padStart(2,"0")}));
}

// ─── VITALS TREND DERIVATION ──────────────────────────────────────────────────
// Wire: replace with patient.vitals_trend entity field when data model is ready
function deriveVitalsTrend(p) {
  if (Array.isArray(p.vitals_trend)&&p.vitals_trend.length) return p.vitals_trend;
  const raw=p.vitals, cc=(p.cc||"").toLowerCase();
  const improving=["arrest","shock","hypotension","sepsis"].some(k=>cc.includes(k));
  const now=new Date(), sv=raw&&typeof raw==="object"&&!Array.isArray(raw);
  const t=(off)=>new Date(now.getTime()-(p.mins||60)*60000+off*60000).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",hour12:false});
  const hr0=sv&&raw.hr?raw.hr+12:improving?124:88, bp0=improving?[82,52]:[138,88];
  const sp0=improving?93:98, rr0=improving?24:16, gc0=improving?13:15;
  return [0,Math.round((p.mins||60)*0.33),Math.round((p.mins||60)*0.66),p.mins||60].map((off,i)=>{
    const f=improving?i/3:0, hr=Math.round(hr0-(hr0-(sv&&raw.hr||72))*f);
    const sys=Math.round(bp0[0]+(((sv&&raw.bp?parseInt(raw.bp):120)-bp0[0])*f));
    const dia=Math.round(bp0[1]+(((sv&&raw.bp?parseInt(raw.bp.split("/")[1]||70):70)-bp0[1])*f));
    return { ts:t(off), HR:hr, BP:`${sys}/${dia}`, SpO2:Math.round(sp0+((99-sp0)*f)), RR:Math.round(rr0+((16-rr0)*f)), Temp:((sv&&raw.temp)||98.4).toFixed(1), GCS:Math.min(15,Math.round(gc0+((15-gc0)*f))) };
  });
}

// ─── MED / ALLERGY DERIVATION ─────────────────────────────────────────────────
// Wire: replace with patient.meds entity field when data model is ready
const HOME_MED_POOLS = {
  cardiac:["Metoprolol succinate 50mg PO daily","Atorvastatin 40mg PO daily","Aspirin 81mg PO daily","Lisinopril 10mg PO daily"],
  sepsis: ["Lisinopril 10mg PO daily","Metformin 500mg PO BID","Amlodipine 5mg PO daily"],
  default:["No home medications on file"],
};
const ALLERGY_POOLS = [
  [{ allergen:"Penicillin",   reaction:"Rash",        sev:"moderate" }],
  [{ allergen:"Ibuprofen",    reaction:"GI bleeding", sev:"severe"   },{ allergen:"Codeine", reaction:"Nausea", sev:"mild" }],
  [{ allergen:"Contrast dye", reaction:"Urticaria",   sev:"moderate" }],
  [],
];
function deriveMeds(p) {
  if (p.meds) return p.meds;
  const orders=Array.isArray(p.orders)?p.orders:[{ name:"Aspirin 324mg PO",type:"med",status:"given",ts:"14:10" },{ name:"NS 1L IV bolus",type:"med",status:"running",ts:"14:15" }];
  const cc=(p.cc||"").toLowerCase();
  const isCardiac=["chest","stemi","cardiac","arrest"].some(k=>cc.includes(k));
  const isSepsis=["sepsis","fever","hypotension"].some(k=>cc.includes(k));
  const poolKey=isCardiac?"cardiac":isSepsis?"sepsis":"default";
  return { active:orders.filter(o=>o.type==="med"), home:HOME_MED_POOLS[poolKey].map(name=>({ name,status:"home" })), allergies:ALLERGY_POOLS[idHash(String(p.id||""))%ALLERGY_POOLS.length] };
}

// ─── WORKSPACE ORDER CATALOG ──────────────────────────────────────────────────
// Curated common subset for inline OrdersTab panel.
// Full ROC (used by RapidOrderDrawer) is defined later in this file.
const ROC_INLINE = {
  labs:[
    { id:"bmp-cbc",name:"BMP + CBC",                common:true  },
    { id:"trop",   name:"Troponin I (High-Sens.)",   common:true  },
    { id:"lactate",name:"Lactate",                   common:true  },
    { id:"ua",     name:"Urinalysis w/ Reflex Cx",   common:true  },
    { id:"bc",     name:"Blood Cultures ×2",         common:true  },
    { id:"coags",  name:"PT / INR / PTT",            common:false },
    { id:"ddimer", name:"D-Dimer",                   common:false },
    { id:"abg",    name:"ABG",                       common:false },
    { id:"lfts",   name:"Hepatic Function Panel",    common:false },
    { id:"lipase", name:"Lipase",                    common:false },
    { id:"bhcg",   name:"β-hCG Serum",               common:false },
    { id:"etoh",   name:"Ethanol Level",             common:false },
  ],
  imaging:[
    { id:"cxr",    name:"CXR PA & Lateral",          common:true  },
    { id:"ct-head",name:"CT Head w/o Contrast",      common:true  },
    { id:"ct-pe",  name:"CT Chest CTA — PE",         common:true  },
    { id:"ct-ap",  name:"CT Abd/Pelvis w/ Contrast", common:true  },
    { id:"us-ruq", name:"US Abdomen RUQ",             common:true  },
    { id:"us-dvt", name:"US Lower Extremity DVT",    common:false },
    { id:"ct-csp", name:"CT C-Spine w/o",            common:false },
    { id:"xr-cxr", name:"CXR Portable AP",           common:false },
  ],
  meds:[
    { id:"keto",   name:"Ketorolac 30mg IV",         common:true  },
    { id:"zofran", name:"Ondansetron 4mg IV",        common:true  },
    { id:"morph",  name:"Morphine 4mg IV",           common:true  },
    { id:"ns1l",   name:"Normal Saline 1L IV",       common:true  },
    { id:"asa",    name:"Aspirin 324mg PO",          common:true  },
    { id:"hep",    name:"Heparin IV (ACS protocol)", common:false },
    { id:"mag",    name:"Magnesium Sulf. 2g IV",     common:false },
    { id:"adeno",  name:"Adenosine 6mg IV",          common:false },
  ],
  consults:[
    { id:"cards",  name:"Cardiology",       common:true  },
    { id:"neuro",  name:"Neurology",        common:true  },
    { id:"surg",   name:"General Surgery",  common:true  },
    { id:"ortho",  name:"Orthopedics",      common:false },
    { id:"psych",  name:"Psychiatry",       common:false },
    { id:"id",     name:"Infectious Disease",common:false},
  ],
  sets:[
    { id:"s-acs",   name:"ACS Protocol",   sub:"ASA · Trop · CXR · Heparin",              items:["asa","trop","cxr","hep"]          },
    { id:"s-sepsis",name:"Sepsis Bundle",  sub:"BC×2 · Lactate · BMP+CBC · NS 1L",        items:["bc","lactate","bmp-cbc","ns1l"]   },
    { id:"s-stroke",name:"Stroke Protocol",sub:"CT Head · BMP+CBC · Coags",               items:["ct-head","bmp-cbc","coags"]       },
    { id:"s-pe",    name:"PE Protocol",    sub:"D-Dimer · CTA Chest · BMP+CBC",           items:["ddimer","ct-pe","bmp-cbc"]        },
    { id:"s-abd",   name:"Abdominal W/U",  sub:"BMP+CBC · Lipase · LFTs · CT Abd/Pelvis", items:["bmp-cbc","lipase","lfts","ct-ap"] },
  ],
};
// ROCF = flat lookup for workspace order sets (separate from RapidOrderDrawer's ROC_FLAT)
const ROCF = Object.entries(ROC_INLINE).reduce((acc,[k,arr])=>{ if(k!=="sets") arr.forEach(o=>{acc[o.id]=o;}); return acc; },{});

// ─── WORKSPACE HEADER ─────────────────────────────────────────────────────────
function WorkspaceHeader({ patient, summary }) {
  const vitals = useMemo(()=>{
    const rv=patient.vitals, sv=rv&&typeof rv==="object"&&!Array.isArray(rv);
    return [
      { label:"HR",   val:sv&&rv.hr   ?rv.hr   :88,       unit:"bpm",  lo:60, hi:100 },
      { label:"BP",   val:sv&&rv.bp   ?rv.bp   :"142/88", unit:"mmHg", lo:null,hi:null },
      { label:"SpO2", val:sv&&rv.spo2 ?rv.spo2 :97,       unit:"%",    lo:95, hi:100 },
      { label:"RR",   val:sv&&rv.rr   ?rv.rr   :18,       unit:"/min", lo:12, hi:20  },
      { label:"Temp", val:sv&&rv.temp ?rv.temp :98.4,     unit:"°F",   lo:97, hi:99  },
      { label:"GCS",  val:sv&&rv.gcs  ?rv.gcs  :15,       unit:"",     lo:14, hi:15  },
    ];
  },[patient]);
  const vColor=(v)=>{ if(v.lo===null){const s=parseInt(v.val);return s>=180||s<90?T.red:s>=160||s<100?T.gold:T.green;} const n=typeof v.val==="number"?v.val:parseFloat(v.val); if(isNaN(n))return T.txt; if(n<v.lo||n>v.hi)return T.red; const band=(v.hi-v.lo)*0.12; return(n<=v.lo+band||n>=v.hi-band)?T.gold:T.green; };
  return (
    <div style={{ padding:"14px 20px 12px",borderBottom:"1px solid rgba(26,53,85,0.5)",background:T.panel,flexShrink:0 }}>
      <div style={{ marginBottom:10 }}>
        <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:5 }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.txt4,background:"rgba(26,53,85,0.6)",border:"1px solid rgba(26,53,85,0.8)",borderRadius:5,padding:"2px 7px" }}>{patient.room}</span>
          <EsiBadge esi={patient.esi}/><TimeBadge mins={patient.mins}/><DispoBadge status={deriveDispoStatus(patient)}/>
        </div>
        <div style={{ fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:900,color:T.txt,lineHeight:1.15,marginBottom:3 }}>{patient.name}</div>
        <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.teal,marginBottom:4 }}>{patient.age}{patient.sex} · {patient.cc}</div>
        {(summary?.text||summary?.loading)&&<div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:summary.loading?T.txt4:T.txt2,fontStyle:"italic",lineHeight:1.5,maxWidth:460,marginBottom:4 }}>{summary.loading?<span style={{ display:"inline-flex",alignItems:"center",gap:6 }}><span style={{ width:8,height:8,borderRadius:"50%",border:"2px solid rgba(0,229,192,0.3)",borderTop:`2px solid ${T.teal}`,display:"inline-block",animation:"ew-spin 1s linear infinite" }}/>Generating summary...</span>:summary.text}</div>}
        <ProviderRow providers={deriveProviders(patient)}/>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:6 }}>
        {vitals.map((v,i)=>{ const c=vColor(v); return <div key={i} style={{ ...gc({borderRadius:8,borderTop:`2px solid ${c}`,background:c===T.red?"rgba(255,68,68,0.06)":T.card}),padding:"8px 6px 6px",textAlign:"center" }}><div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:7,color:T.txt4,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4 }}>{v.label}</div><div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:v.label==="BP"?11:16,fontWeight:700,color:c,lineHeight:1 }}>{v.val}</div><div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:9,color:T.txt4,marginTop:3 }}>{v.unit}</div></div>; })}
      </div>
    </div>
  );
}

// ─── WORKSPACE TIMELINE ───────────────────────────────────────────────────────
function WorkspaceTimeline({ patient }) {
  const stages = useMemo(()=>{
    const h=idHash(String(patient.id||"")), mins=patient.mins||0;
    const hasOrders=mins>10&&h%7!==0, hasResults=mins>40&&h%4!==0;
    const disp=deriveDispoStatus(patient), hasDispo=!!DISPO_MAP[disp], isOut=["dc_ready","admitted","transfer"].includes(disp);
    const done=[true,true,hasOrders,hasResults,hasDispo,isOut], activeIdx=done.findIndex(d=>!d);
    const arr=new Date(new Date().getTime()-mins*60000);
    const ft=(d)=>d.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",hour12:false});
    const t=(add)=>ft(new Date(arr.getTime()+add*60000));
    return ["Triage","Assessed","Orders","Results","Dispo","Out"].map((label,i)=>({ label, done:done[i], active:i===activeIdx, time:done[i]?t(i===0?2:i===1?10+h%10:i===2?18+h%8:i===3?38+h%15:null):null }));
  },[patient]);
  const DASH=`repeating-linear-gradient(90deg,rgba(90,130,168,0.28) 0,rgba(90,130,168,0.28) 5px,transparent 5px,transparent 10px)`;
  return (
    <div style={{ padding:"10px 20px",borderBottom:"1px solid rgba(26,53,85,0.35)",background:"linear-gradient(180deg,rgba(5,15,30,0.4),transparent)",flexShrink:0 }}>
      <div style={{ display:"flex",alignItems:"center" }}>
        {stages.map((s,i)=>{ const nSz=s.active?12:8, nBg=s.done?T.teal:s.active?T.gold:"transparent", nBd=s.done?T.teal:s.active?T.gold:"rgba(90,130,168,0.4)"; const prevDone=i===0?true:stages[i-1].done; const connBg=prevDone&&s.done?T.teal:s.active?`linear-gradient(90deg,${T.teal},${T.gold})`:DASH; return <div key={s.label} style={{ flex:1,display:"flex",alignItems:"center" }}>{i>0&&<div style={{ flex:1,height:1.5,background:connBg }}/>}<div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:2 }}><div className={s.active&&!s.done?"ew-pulse":undefined} style={{ width:nSz,height:nSz,borderRadius:"50%",background:nBg,border:`${s.done||s.active?2:1.5}px solid ${nBd}`,flexShrink:0,boxShadow:s.active?`0 0 8px ${T.gold}88`:s.done?`0 0 5px ${T.teal}44`:"none" }}/><span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:7,fontWeight:700,color:s.done?T.txt3:s.active?T.gold:T.txt4,textTransform:"uppercase",letterSpacing:"0.07em" }}>{s.label}</span><span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:8,color:s.active?T.gold:T.txt4,opacity:s.done||s.active?1:0.25 }}>{s.time||"·"}</span></div>{i<stages.length-1&&<div style={{ flex:1,height:1.5,background:s.done&&stages[i+1].done?T.teal:stages[i+1].active?`linear-gradient(90deg,${T.teal},${T.gold})`:DASH }}/>}</div>; })}
      </div>
    </div>
  );
}

// ─── WORKSPACE TAB BAR ────────────────────────────────────────────────────────
const WORKSPACE_TABS = [
  { key:"overview", label:"Overview", icon:"🗂️" },
  { key:"orders",   label:"Orders",   icon:"📋" },
  { key:"results",  label:"Results",  icon:"🧪" },
  { key:"vitals",   label:"Vitals",   icon:"📈" },
  { key:"meds",     label:"Meds & Rx",icon:"💊" },
];
function WorkspaceTabBar({ active, onChange }) {
  return (
    <div style={{ display:"flex",background:T.bg,borderBottom:"1px solid rgba(26,53,85,0.5)",flexShrink:0 }}>
      {WORKSPACE_TABS.map((tab,i)=>{ const isActive=tab.key===active; return <button key={tab.key} onClick={()=>onChange(tab.key)} title={`${i+1}. ${tab.label}`} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"9px 4px 7px",background:isActive?"rgba(0,229,192,0.07)":"transparent",border:"none",borderBottom:`2px solid ${isActive?T.teal:"transparent"}`,color:isActive?T.teal:T.txt4,cursor:"pointer",transition:"all .15s" }}><span style={{ fontSize:14,lineHeight:1 }}>{tab.icon}</span><span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:isActive?700:400,letterSpacing:"0.05em" }}>{tab.label}</span><span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:7,color:isActive?T.teal+"99":T.txt4+"66" }}>{i+1}</span></button>; })}
    </div>
  );
}

// ─── TAB 1: OVERVIEW ─────────────────────────────────────────────────────────
const DOC_SECTIONS=[{ key:"hpi",label:"History of Present Illness",icon:"📝" },{ key:"ros",label:"Review of Systems",icon:"📋" },{ key:"pe",label:"Physical Exam",icon:"🩺" },{ key:"mdm",label:"Medical Decision Making",icon:"🧠" }];
function OverviewTab({ patient, onGoToOrders }) {
  const docStatus=(patient.doc_status&&typeof patient.doc_status==="object"&&!Array.isArray(patient.doc_status))?patient.doc_status:{ hpi:false,ros:false,pe:false,mdm:false,signed:false };
  const critAlerts=(Array.isArray(patient.alerts)?patient.alerts:[]).filter(a=>a.t==="critical");
  const completed=DOC_SECTIONS.filter(s=>docStatus[s.key]).length, disp=deriveDispoStatus(patient);
  return (
    <div style={{ flex:1,overflowY:"auto",padding:"14px 18px",display:"flex",flexDirection:"column",gap:14 }}>
      {critAlerts.map((a,i)=><div key={i} className="ew-pulse" style={{ display:"flex",alignItems:"center",gap:10,background:"rgba(255,68,68,0.07)",border:"1px solid rgba(255,68,68,0.4)",borderLeft:`4px solid ${T.red}`,borderRadius:10,padding:"10px 14px" }}><span style={{ fontSize:14 }}>🚨</span><span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,color:T.red,flex:1 }}>{a.m}</span></div>)}
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
        <div style={{ ...gc({borderRadius:12}),overflow:"hidden" }}>
          <div style={{ padding:"10px 13px 8px",borderBottom:"1px solid rgba(26,53,85,0.5)",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
            <SectionTitle>Documentation</SectionTitle>
            <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700,color:docStatus.signed?T.green:T.gold,background:docStatus.signed?"rgba(61,255,160,0.1)":"rgba(245,200,66,0.1)",border:`1px solid ${docStatus.signed?T.green:T.gold}44`,borderRadius:6,padding:"2px 9px" }}>{docStatus.signed?"✓ SIGNED":"UNSIGNED"}</span>
          </div>
          <div style={{ height:3,background:"rgba(26,53,85,0.5)" }}><div style={{ height:"100%",width:`${(completed/DOC_SECTIONS.length)*100}%`,background:`linear-gradient(90deg,${T.teal},${T.green})`,transition:"width .4s ease" }}/></div>
          <div style={{ padding:"10px 12px",display:"flex",flexDirection:"column",gap:5 }}>
            {DOC_SECTIONS.map(({key,label,icon})=>{ const done=docStatus[key]; return <div key={key} style={{ display:"flex",alignItems:"center",gap:9,padding:"7px 10px",borderRadius:7,background:done?"rgba(61,255,160,0.05)":"rgba(26,53,85,0.2)",border:`1px solid ${done?T.green+"30":"rgba(26,53,85,0.4)"}` }}><span style={{ fontSize:12 }}>{icon}</span><span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:done?T.txt:T.txt3,flex:1 }}>{label}</span><span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:700,color:done?T.green:T.txt4 }}>{done?"✓":"—"}</span></div>; })}
          </div>
          <div style={{ padding:"8px 12px",borderTop:"1px solid rgba(26,53,85,0.5)",display:"flex",gap:6 }}>
            <Btn accent={T.gold} sm onClick={()=>nav("PatientEncounter",{patientId:patient.id,tab:"note"})}>📝 Open Note</Btn>
            {!docStatus.signed&&completed===DOC_SECTIONS.length&&<Btn accent={T.green} sm onClick={()=>nav("PatientEncounter",{patientId:patient.id,tab:"sign"})}>✓ Sign Chart</Btn>}
          </div>
        </div>
        <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
          <div style={{ ...gc({borderRadius:12}),padding:"13px" }}>
            <SectionTitle>Disposition</SectionTitle>
            <DispoBadge status={disp}/>
            <div style={{ display:"flex",flexDirection:"column",gap:7,marginTop:12 }}>
              <Btn accent={T.purple} onClick={()=>nav("PatientEncounter",{patientId:patient.id,tab:"dispo"})}>🚪 Dispo Planning →</Btn>
              <Btn accent={T.teal}   onClick={()=>onGoToOrders()}>📋 Go to Orders tab</Btn>
            </div>
          </div>
          <div style={{ ...gc({borderRadius:12}),padding:"13px",flex:1 }}>
            <SectionTitle>Full encounter</SectionTitle>
            <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.txt3,lineHeight:1.6,marginBottom:10 }}>Advanced documentation, procedure logs, and split/shared attestation.</div>
            <Btn accent={T.blue} onClick={()=>nav("PatientEncounter",{patientId:patient.id})}>Open Full Encounter →</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TAB 2: ORDERS ────────────────────────────────────────────────────────────
function OrdersTab({ patient }) {
  const [orderCat,setOrderCat]=useState("labs"), [selected,setSelected]=useState({}), [stat,setStat]=useState(false);
  const [showMore,setShowMore]=useState({}), [placing,setPlacing]=useState(false), [placed,setPlaced]=useState(false), [oQuery,setOQuery]=useState("");
  const activeOrders=useMemo(()=>Array.isArray(patient.orders)&&patient.orders.length?patient.orders:[
    { name:"BMP / CBC",         type:"lab",     status:"pending", ts:"14:20" },
    { name:"Troponin I (hsTn)", type:"lab",     status:"pending", ts:"14:21" },
    { name:"CT Head w/o",       type:"imaging", status:"pending", ts:"14:25" },
    { name:"NS 1L IV bolus",    type:"med",     status:"running", ts:"14:15" },
    { name:"Aspirin 324mg PO",  type:"med",     status:"given",   ts:"14:10" },
  ],[patient]);
  const accent=TAB_ACCENT[orderCat]||T.teal, catList=ROC_INLINE[orderCat]||[];
  const q=oQuery.toLowerCase().trim(), filtered=q?catList.filter(o=>o.name.toLowerCase().includes(q)):catList;
  const common=filtered.filter(o=>o.common), more=filtered.filter(o=>!o.common);
  const selCount=Object.keys(selected).length, canPlace=selCount>0&&!placing&&!placed;
  const stOC={ pending:T.gold,given:T.green,running:T.teal,cancelled:T.txt4 }, tyOC={ lab:T.cyan,imaging:T.purple,med:T.gold,consult:T.blue };
  const toggle=(id,name)=>setSelected(prev=>{ const n={...prev}; n[id]?delete n[id]:n[id]=name; return n; });
  const applySet=(set)=>{ const n={...selected}; set.items.forEach(id=>{ const o=ROCF[id]; if(o) n[id]=o.name; }); setSelected(n); };
  const placeOrders=async()=>{ if(!canPlace)return; setPlacing(true); await new Promise(r=>setTimeout(r,1200)); setPlacing(false); setPlaced(true); setTimeout(()=>{ setSelected({}); setPlaced(false); },2000); };
  const btnA=placed?T.green:stat?T.red:T.teal;
  return (
    <div style={{ flex:1,display:"flex",overflow:"hidden" }}>
      {/* LEFT — catalog */}
      <div style={{ flex:"0 0 55%",display:"flex",flexDirection:"column",borderRight:"1px solid rgba(26,53,85,0.5)",overflow:"hidden" }}>
        <div style={{ display:"flex",borderBottom:"1px solid rgba(26,53,85,0.5)",background:T.bg,flexShrink:0 }}>
          {Object.keys(TAB_ACCENT).map(cat=>{ const a=cat===orderCat, c=TAB_ACCENT[cat]; return <button key={cat} onClick={()=>{setOrderCat(cat);setOQuery("");setShowMore({});}} style={{ flex:1,padding:"8px 2px 6px",background:a?`${c}10`:"transparent",border:"none",borderBottom:`2px solid ${a?c:"transparent"}`,color:a?c:T.txt4,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:a?700:400,textTransform:"capitalize",letterSpacing:"0.04em",transition:"all .12s" }}>{cat}</button>; })}
        </div>
        <div style={{ padding:"7px 10px 4px",flexShrink:0 }}>
          <div style={{ display:"flex",alignItems:"center",gap:7,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(26,53,85,0.5)",borderRadius:7,padding:"5px 9px" }}>
            <span style={{ fontSize:11,color:T.txt4 }}>🔍</span>
            <input value={oQuery} onChange={e=>setOQuery(e.target.value)} placeholder={`Search ${orderCat}...`} style={{ flex:1,background:"transparent",border:"none",outline:"none",fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.txt }}/>
            {oQuery&&<button onClick={()=>setOQuery("")} style={{ background:"none",border:"none",color:T.txt4,cursor:"pointer",fontSize:11 }}>✕</button>}
          </div>
        </div>
        <div style={{ flex:1,overflowY:"auto",padding:"4px 10px 8px" }}>
          {orderCat==="sets"
            ? filtered.map(set=>{ const all=set.items.every(id=>!!selected[id]); return <div key={set.id} onClick={()=>applySet(set)} style={{ ...gc({borderRadius:10,borderLeft:`3px solid ${all?T.teal:T.teal+"55"}`,background:all?`${T.teal}0d`:`linear-gradient(135deg,${T.teal}07,${T.card})`}),padding:"10px 12px",marginBottom:7,cursor:"pointer" }}><div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4 }}><span style={{ fontFamily:"'Playfair Display',serif",fontSize:13,fontWeight:700,color:all?T.teal:T.txt }}>{set.name}</span><span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:all?T.teal:T.txt4,background:all?`${T.teal}18`:"rgba(26,53,85,0.4)",border:`1px solid ${all?T.teal+"44":"rgba(26,53,85,0.5)"}`,borderRadius:4,padding:"2px 6px" }}>{all?"✓ Applied":"+ Apply all"}</span></div><div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.txt3,marginBottom:7 }}>{set.sub}</div><div style={{ display:"flex",flexWrap:"wrap",gap:4 }}>{set.items.map(id=>{ const o=ROCF[id]; if(!o)return null; const sel=!!selected[id]; return <span key={id} onClick={e=>{e.stopPropagation();toggle(id,o.name);}} style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:sel?T.teal:T.txt4,background:sel?`${T.teal}18`:"rgba(26,53,85,0.35)",border:`1px solid ${sel?T.teal+"44":"rgba(26,53,85,0.4)"}`,borderRadius:4,padding:"2px 6px",cursor:"pointer" }}>{sel?"✓ ":""}{o.name}</span>; })}</div></div>; })
            : <>
                {!q&&common.length>0&&<div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:7,fontWeight:700,color:T.txt4,textTransform:"uppercase",letterSpacing:"0.12em",padding:"5px 2px 4px" }}>Common</div>}
                {(q?filtered:common).map(o=><div key={o.id} onClick={()=>toggle(o.id,o.name)} style={{ display:"flex",alignItems:"center",gap:9,padding:"7px 8px 7px 10px",borderRadius:8,background:selected[o.id]?`${accent}0d`:"transparent",border:`1px solid ${selected[o.id]?accent+"33":"transparent"}`,cursor:"pointer",marginBottom:2,transition:"all .1s" }}><div style={{ width:13,height:13,borderRadius:4,background:selected[o.id]?accent:"transparent",border:`1.5px solid ${selected[o.id]?accent:"rgba(90,130,168,0.45)"}`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center" }}>{selected[o.id]&&<span style={{ color:"#000",fontSize:9,fontWeight:700,lineHeight:1 }}>✓</span>}</div><span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:selected[o.id]?T.txt:T.txt2,flex:1 }}>{o.name}</span></div>)}
                {!q&&more.length>0&&<><button onClick={()=>setShowMore(p=>({...p,[orderCat]:!p[orderCat]}))} style={{ width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"5px 2px 4px",background:"none",border:"none",borderTop:"1px solid rgba(26,53,85,0.3)",cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontSize:7,fontWeight:700,color:T.txt4,textTransform:"uppercase",letterSpacing:"0.12em",marginTop:4 }}><span>More ({more.length})</span><span style={{ fontSize:9 }}>{showMore[orderCat]?"▲":"▾"}</span></button>{showMore[orderCat]&&more.map(o=><div key={o.id} onClick={()=>toggle(o.id,o.name)} style={{ display:"flex",alignItems:"center",gap:9,padding:"7px 8px 7px 10px",borderRadius:8,background:selected[o.id]?`${accent}0d`:"transparent",border:`1px solid ${selected[o.id]?accent+"33":"transparent"}`,cursor:"pointer",marginBottom:2 }}><div style={{ width:13,height:13,borderRadius:4,background:selected[o.id]?accent:"transparent",border:`1.5px solid ${selected[o.id]?accent:"rgba(90,130,168,0.45)"}`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center" }}>{selected[o.id]&&<span style={{ color:"#000",fontSize:9,fontWeight:700 }}>✓</span>}</div><span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:selected[o.id]?T.txt:T.txt2,flex:1 }}>{o.name}</span></div>)}</>}
                {q&&filtered.length===0&&<div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.txt4,textAlign:"center",padding:"24px 0" }}>No matches for "{oQuery}"</div>}
              </>}
        </div>
        <div style={{ padding:"9px 10px 10px",borderTop:"1px solid rgba(26,53,85,0.55)",background:T.bg,flexShrink:0 }}>
          {selCount>0&&<div style={{ display:"flex",flexWrap:"wrap",gap:4,marginBottom:8,maxHeight:54,overflowY:"auto" }}>{Object.entries(selected).map(([id,name])=><span key={id} onClick={()=>toggle(id,name)} style={{ display:"inline-flex",alignItems:"center",gap:4,fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.teal,background:"rgba(0,229,192,0.08)",border:"1px solid rgba(0,229,192,0.25)",borderRadius:20,padding:"3px 8px",cursor:"pointer" }}>{name} <span style={{ color:T.txt4,fontSize:9 }}>✕</span></span>)}</div>}
          <div style={{ display:"flex",alignItems:"center",gap:7 }}>
            <button onClick={()=>setStat(p=>!p)} style={{ display:"flex",alignItems:"center",gap:5,padding:"6px 10px",background:stat?"rgba(255,68,68,0.1)":"rgba(26,53,85,0.28)",border:`1px solid ${stat?T.red+"55":"rgba(26,53,85,0.5)"}`,borderRadius:7,color:stat?T.red:T.txt4,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700,flexShrink:0 }}><span style={{ width:6,height:6,borderRadius:"50%",background:stat?T.red:T.txt4,display:"inline-block" }}/>{stat?"STAT":"Routine"}</button>
            {selCount>0&&<button onClick={()=>setSelected({})} style={{ padding:"6px 9px",background:"transparent",border:"1px solid rgba(26,53,85,0.5)",borderRadius:7,color:T.txt4,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontSize:9 }}>Clear</button>}
            <div style={{ flex:1 }}/>
            <button onClick={placeOrders} disabled={!canPlace&&!placed} style={{ display:"flex",alignItems:"center",gap:7,padding:"7px 16px",background:canPlace||placed?`linear-gradient(135deg,${btnA}2a,${btnA}0a)`:"rgba(26,53,85,0.18)",border:`1.5px solid ${canPlace||placed?btnA+"55":"rgba(26,53,85,0.35)"}`,borderRadius:9,color:canPlace||placed?btnA:T.txt4,cursor:canPlace?"pointer":"not-allowed",fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:700,transition:"all .18s",flexShrink:0 }}>{placing?<><span style={{ width:9,height:9,borderRadius:"50%",border:`2px solid ${T.teal}30`,borderTop:`2px solid ${T.teal}`,display:"inline-block",animation:"ew-spin 1s linear infinite" }}/>Placing...</>:placed?"✓ Orders placed":<>{stat?"⚡ STAT ":"Place orders "}{selCount>0&&<span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,background:"rgba(0,0,0,0.2)",borderRadius:10,padding:"1px 6px",lineHeight:1.5 }}>{selCount}</span>}</>}</button>
          </div>
        </div>
      </div>
      {/* RIGHT — active orders */}
      <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden" }}>
        <div style={{ padding:"9px 12px 7px",borderBottom:"1px solid rgba(26,53,85,0.5)",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0 }}>
          <SectionTitle>Active orders</SectionTitle>
          <div style={{ display:"flex",gap:5 }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.gold,background:"rgba(245,200,66,0.1)",border:"1px solid rgba(245,200,66,0.3)",borderRadius:10,padding:"1px 8px" }}>{activeOrders.filter(o=>o.status==="pending").length} pending</span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.teal,background:"rgba(0,229,192,0.1)",border:"1px solid rgba(0,229,192,0.3)",borderRadius:10,padding:"1px 8px" }}>{activeOrders.length} total</span>
          </div>
        </div>
        <div style={{ flex:1,overflowY:"auto",padding:"6px 10px" }}>
          {activeOrders.map((o,i)=>{ const tc=tyOC[o.type]||T.txt3, sc=stOC[o.status]||T.txt4; return <div key={i} style={{ display:"flex",alignItems:"flex-start",padding:"8px 8px 8px 11px",borderBottom:"1px solid rgba(26,53,85,0.2)",borderLeft:`2px solid ${tc}`,marginBottom:3,background:"rgba(26,53,85,0.15)",borderRadius:"0 6px 6px 0" }}><div style={{ flex:1,minWidth:0 }}><div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,color:T.txt,marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{o.name}</div><div style={{ display:"flex",alignItems:"center",gap:6 }}><span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:tc,background:`${tc}18`,border:`1px solid ${tc}33`,borderRadius:4,padding:"1px 5px",textTransform:"uppercase",letterSpacing:"0.06em" }}>{o.type}</span><span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:sc }}>{o.status}</span><span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.txt4 }}>{o.ts}</span></div></div></div>; })}
        </div>
      </div>
    </div>
  );
}

// ─── TAB 3: RESULTS ───────────────────────────────────────────────────────────
function ResultsTab({ patient }) {
  const labs=useMemo(()=>deriveLabs(patient),[patient]);
  const [ackd,setAckd]=useState({});
  const pendingImaging=useMemo(()=>(Array.isArray(patient.orders)?patient.orders:[]).filter(o=>o.type==="imaging"),[patient]);
  const flagColor=(r)=>{ if(r.critical)return T.red; if(!r.lo&&!r.hi)return T.txt3; const n=typeof r.value==="number"?r.value:parseFloat(r.value); if(isNaN(n))return T.txt3; if(n<r.lo||n>r.hi)return(n<r.lo*0.85||n>r.hi*1.15)?T.red:T.gold; return T.green; };
  const flagLabel=(r)=>{ if(r.critical)return "CRITICAL"; const n=typeof r.value==="number"?r.value:parseFloat(r.value); if(isNaN(n))return null; if(n<r.lo)return "LOW"; if(n>r.hi)return "HIGH"; return null; };
  return (
    <div style={{ flex:1,overflowY:"auto",padding:"14px 18px" }}>
      <SectionTitle>Lab results</SectionTitle>
      <div style={{ ...gc({borderRadius:12}),overflow:"hidden",marginBottom:14 }}>
        <div style={{ display:"grid",gridTemplateColumns:"110px 1fr 110px 60px 64px 80px",padding:"7px 12px",borderBottom:"1px solid rgba(26,53,85,0.5)",background:"rgba(26,53,85,0.3)" }}>
          {["Test","Value","Ref. range","Δ","Time","Flag"].map(h=><span key={h} style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:7,fontWeight:700,color:T.txt4,textTransform:"uppercase",letterSpacing:"0.1em" }}>{h}</span>)}
        </div>
        {labs.map((r,i)=>{ const fc=flagColor(r), fl=flagLabel(r), isCrit=r.critical; return <div key={i} className={isCrit&&!ackd[i]?"ew-pulse":undefined} style={{ display:"grid",gridTemplateColumns:"110px 1fr 110px 60px 64px 80px",padding:"9px 12px",borderBottom:"1px solid rgba(26,53,85,0.18)",borderLeft:`3px solid ${fc===T.green?"transparent":fc}`,background:isCrit?"rgba(255,68,68,0.05)":"transparent",alignItems:"center" }}><span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:T.txt3 }}>{r.name}</span><span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:isCrit?11:14,fontWeight:700,color:fc }}>{r.value}</span><span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.txt4 }}>{r.lo!=null&&r.hi!=null?`${r.lo} – ${r.hi}`:""}</span><span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:r.delta?T.gold:T.txt4 }}>{r.delta||"—"}</span><span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.txt4 }}>{r.ts}</span><span>{fl&&(isCrit&&!ackd[i]?<button onClick={()=>setAckd(p=>({...p,[i]:true}))} style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:700,color:T.red,background:"rgba(255,68,68,0.12)",border:`1px solid ${T.red}55`,borderRadius:5,padding:"2px 8px",cursor:"pointer" }}>ACK CRIT</button>:<span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:700,color:isCrit&&ackd[i]?T.green:fc,background:`${isCrit&&ackd[i]?T.green:fc}18`,border:`1px solid ${isCrit&&ackd[i]?T.green:fc}44`,borderRadius:5,padding:"2px 7px" }}>{isCrit&&ackd[i]?"✓ ACKD":fl}</span>)}</span></div>; })}
      </div>
      <SectionTitle>Imaging</SectionTitle>
      <div style={{ display:"flex",flexDirection:"column",gap:7 }}>
        {pendingImaging.length===0
          ?<div style={{ ...gc({borderRadius:10}),padding:"14px",fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.txt4,textAlign:"center" }}>No imaging orders active for this encounter.</div>
          :pendingImaging.map((img,i)=><div key={i} style={{ ...gc({borderRadius:10,borderLeft:`3px solid ${T.purple}`}),padding:"12px 14px",display:"flex",alignItems:"center",justifyContent:"space-between" }}><div><div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,color:T.txt,marginBottom:3 }}>{img.name}</div><div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.txt4 }}>{img.ts} · {img.status}</div></div><span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:img.status==="resulted"?T.teal:T.gold,background:img.status==="resulted"?"rgba(0,229,192,0.1)":"rgba(245,200,66,0.1)",border:`1px solid ${img.status==="resulted"?T.teal:T.gold}44`,borderRadius:5,padding:"2px 8px" }}>{img.status}</span></div>)}
      </div>
    </div>
  );
}

// ─── TAB 4: VITALS TREND ─────────────────────────────────────────────────────
function VitalsTrendTab({ patient }) {
  const sets=useMemo(()=>deriveVitalsTrend(patient),[patient]);
  const VITAL_DEFS=[{ key:"HR",unit:"bpm",lo:60,hi:100 },{ key:"BP",unit:"mmHg",lo:null,hi:null },{ key:"SpO2",unit:"%",lo:95,hi:100 },{ key:"RR",unit:"/min",lo:12,hi:20 },{ key:"Temp",unit:"°F",lo:97,hi:99 },{ key:"GCS",unit:"",lo:14,hi:15 }];
  const vc=(def,val)=>{ if(def.lo===null){const s=parseInt(val);return s>=180||s<90?T.red:s>=160||s<100?T.gold:T.green;} const n=typeof val==="number"?val:parseFloat(val); if(isNaN(n))return T.txt3; if(n<def.lo||n>def.hi)return T.red; const band=(def.hi-def.lo)*0.12; return(n<=def.lo+band||n>=def.hi-band)?T.gold:T.green; };
  const trend=(def)=>{ const vals=sets.map(s=>s[def.key]); if(vals.length<2)return null; const first=typeof vals[0]==="number"?vals[0]:parseFloat(vals[0]), last=typeof vals[vals.length-1]==="number"?vals[vals.length-1]:parseFloat(vals[vals.length-1]); if(isNaN(first)||isNaN(last))return null; const diff=last-first; if(Math.abs(diff)<1)return{ icon:"→",color:T.txt4 }; const imp=(def.key==="HR"||def.key==="RR")?diff<0:diff>0; return{ icon:diff>0?"↑":"↓",color:imp?T.green:T.red }; };
  return (
    <div style={{ flex:1,overflowY:"auto",padding:"14px 18px" }}>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10 }}>
        <SectionTitle>Vital trend — last {sets.length} sets</SectionTitle>
        <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.txt4 }}>most recent column highlighted →</span>
      </div>
      <div style={{ ...gc({borderRadius:12}),overflow:"hidden" }}>
        <div style={{ display:"grid",gridTemplateColumns:`100px repeat(${sets.length},1fr) 40px`,padding:"8px 12px",borderBottom:"1px solid rgba(26,53,85,0.5)",background:"rgba(26,53,85,0.3)" }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.txt4,textTransform:"uppercase",letterSpacing:"0.1em" }}>Vital</span>
          {sets.map((s,i)=><span key={i} style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.txt4,textAlign:"center" }}>{s.ts}</span>)}
          <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.txt4,textAlign:"center" }}>Trend</span>
        </div>
        {VITAL_DEFS.map(def=>{ const tr=trend(def); return <div key={def.key} style={{ display:"grid",gridTemplateColumns:`100px repeat(${sets.length},1fr) 40px`,padding:"10px 12px",borderBottom:"1px solid rgba(26,53,85,0.12)",alignItems:"center" }}><div><div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:700,color:T.txt2 }}>{def.key}</div><div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:9,color:T.txt4 }}>{def.unit}</div></div>{sets.map((s,i)=>{ const val=s[def.key], c=vc(def,val), isLast=i===sets.length-1; return <div key={i} style={{ textAlign:"center",padding:"4px 3px",borderRadius:6,background:isLast&&c!==T.green?`${c}0f`:"transparent" }}><span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:def.key==="BP"?11:15,fontWeight:isLast?700:400,color:c }}>{val}</span></div>; })}<div style={{ textAlign:"center" }}>{tr&&<span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:14,color:tr.color,fontWeight:700 }}>{tr.icon}</span>}</div></div>; })}
      </div>
      <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.txt4,marginTop:10,lineHeight:1.6 }}>Red = outside normal · Gold = borderline · Green = within normal · Trend arrows account for expected direction per vital.</div>
    </div>
  );
}

// ─── TAB 5: MEDS & RX ────────────────────────────────────────────────────────
const SEV_COLOR={ severe:T.red,moderate:T.orange,mild:T.gold };
function MedsTab({ patient }) {
  const meds=useMemo(()=>deriveMeds(patient),[patient]);
  const stColor={ given:T.green,running:T.teal,pending:T.gold,home:T.txt4 };
  return (
    <div style={{ flex:1,overflowY:"auto",padding:"14px 18px",display:"flex",flexDirection:"column",gap:14 }}>
      <div>
        <SectionTitle>Allergies</SectionTitle>
        {meds.allergies.length===0
          ?<div style={{ ...gc({borderRadius:10,borderLeft:`3px solid ${T.green}`}),padding:"10px 14px",fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.green }}>✓ No known allergies on file</div>
          :<div style={{ display:"flex",flexDirection:"column",gap:6 }}>{meds.allergies.map((a,i)=><div key={i} style={{ ...gc({borderRadius:10,borderLeft:`3px solid ${SEV_COLOR[a.sev]||T.gold}`}),padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between" }}><div><div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,color:T.txt,marginBottom:3 }}>{a.allergen}</div><div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.txt3 }}>Reaction: {a.reaction}</div></div><span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700,color:SEV_COLOR[a.sev]||T.gold,background:`${SEV_COLOR[a.sev]||T.gold}18`,border:`1px solid ${SEV_COLOR[a.sev]||T.gold}44`,borderRadius:5,padding:"2px 8px",textTransform:"capitalize" }}>{a.sev}</span></div>)}</div>}
      </div>
      <div>
        <SectionTitle>ED medications — this encounter</SectionTitle>
        {meds.active.length===0
          ?<div style={{ ...gc({borderRadius:10}),padding:"12px 14px",fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.txt4,textAlign:"center" }}>No medications ordered this encounter.</div>
          :<div style={{ ...gc({borderRadius:12}),overflow:"hidden" }}>{meds.active.map((m,i)=>{ const sc=stColor[m.status]||T.txt4; return <div key={i} style={{ display:"flex",alignItems:"center",gap:12,padding:"10px 14px",borderBottom:"1px solid rgba(26,53,85,0.25)",borderLeft:`2px solid ${sc}` }}><div style={{ flex:1,minWidth:0 }}><div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,color:T.txt,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{m.name}</div><div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.txt4,marginTop:3 }}>{m.ts}</div></div><span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:sc,background:`${sc}14`,border:`1px solid ${sc}44`,borderRadius:5,padding:"2px 8px",flexShrink:0 }}>{m.status}</span></div>; })}</div>}
      </div>
      <div>
        <SectionTitle>Home medications</SectionTitle>
        <div style={{ ...gc({borderRadius:12}),overflow:"hidden" }}>{meds.home.map((m,i)=><div key={i} style={{ display:"flex",alignItems:"center",padding:"10px 14px",borderBottom:"1px solid rgba(26,53,85,0.2)",borderLeft:"2px solid rgba(90,130,168,0.35)" }}><span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.txt2,flex:1 }}>{m.name}</span><span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.txt4,background:"rgba(26,53,85,0.4)",borderRadius:5,padding:"2px 7px" }}>home</span></div>)}</div>
        <div style={{ marginTop:10,display:"flex",gap:8 }}>
          <Btn accent={T.teal} sm onClick={()=>nav("PatientEncounter",{patientId:patient.id,tab:"meds"})}>+ Add medication</Btn>
          <Btn accent={T.gold} sm onClick={()=>nav("PatientEncounter",{patientId:patient.id,tab:"reconcile"})}>Reconcile home meds</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── QUICK ACTIONS FOOTER ─────────────────────────────────────────────────────
function QuickActionsFooter({ patient, onRapidOrder, activeTab, onTabChange }) {
  return (
    <div style={{ padding:"9px 18px 11px",borderTop:"1px solid rgba(26,53,85,0.5)",display:"flex",alignItems:"center",gap:8,flexShrink:0,background:T.panel }}>
      <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:7,color:T.txt4,textTransform:"uppercase",letterSpacing:"0.14em",marginRight:4 }}>Quick</span>
      <Btn accent={T.coral} sm onClick={onRapidOrder}>⚡ Rapid order</Btn>
      <Btn accent={T.gold}  sm onClick={()=>nav("PatientEncounter",{patientId:patient.id,tab:"note"})}>📝 Note</Btn>
      <Btn accent={T.purple}sm onClick={()=>nav("PatientEncounter",{patientId:patient.id,tab:"dispo"})}>🚪 Dispo</Btn>
      {activeTab!=="orders"&&<Btn accent={T.teal} sm onClick={()=>onTabChange("orders")}>📋 Orders tab</Btn>}
      <div style={{ flex:1 }}/>
      <Btn accent={T.blue} sm onClick={()=>nav("PatientEncounter",{patientId:patient.id})}>Full encounter →</Btn>
    </div>
  );
}

// ─── ENCOUNTER WORKSPACE ──────────────────────────────────────────────────────
function EncounterWorkspace({ patient, summary, onRapidOrder, embedded=false }) {
  const [activeTab,setActiveTab]=useState("overview");
  const storageKey=`lakonyx.ew.tab.${patient?.id||"none"}`;
  useEffect(()=>{ if(!patient?.id)return; let live=true; ewGet(storageKey,"overview").then(v=>{ if(live&&WORKSPACE_TABS.find(t=>t.key===v))setActiveTab(v); }); return()=>{ live=false; }; },[patient?.id]);
  const changeTab=useCallback((tab)=>{ setActiveTab(tab); if(patient?.id)ewSet(storageKey,tab); },[patient?.id]);
  useEffect(()=>{ const onKey=(e)=>{ const tag=(e.target?.tagName||""); if(tag==="INPUT"||tag==="TEXTAREA")return; const n=parseInt(e.key); if(n>=1&&n<=5){e.preventDefault();changeTab(WORKSPACE_TABS[n-1].key);} }; window.addEventListener("keydown",onKey); return()=>window.removeEventListener("keydown",onKey); },[changeTab]);
  if(!patient)return null;
  return (
    <div style={{ display:"flex",flexDirection:"column",flex:1,minWidth:0,height:"100%",overflow:"hidden",background:embedded?"transparent":T.bg,color:T.txt,fontFamily:"'DM Sans',sans-serif" }}>
      <WorkspaceHeader patient={patient} summary={summary}/>
      <WorkspaceTimeline patient={patient}/>
      <WorkspaceTabBar active={activeTab} onChange={changeTab}/>
      <div style={{ flex:1,display:"flex",overflow:"hidden" }}>
        {activeTab==="overview"&&<OverviewTab    patient={patient} onGoToOrders={()=>changeTab("orders")}/>}
        {activeTab==="orders"  &&<OrdersTab      patient={patient}/>}
        {activeTab==="results" &&<ResultsTab     patient={patient}/>}
        {activeTab==="vitals"  &&<VitalsTrendTab patient={patient}/>}
        {activeTab==="meds"    &&<MedsTab        patient={patient}/>}
      </div>
      <QuickActionsFooter patient={patient} onRapidOrder={onRapidOrder} activeTab={activeTab} onTabChange={changeTab}/>
    </div>
  );
}

// ─── RESULTS BANNER ──────────────────────────────────────────────────────────
// Interrupt-driven notification strip for new results across all patients.
// Sits between TopBar and the main three-column area. Each notif is dismissible
// and navigates directly to that patient on click.
function ResultsBanner({ notifs, onDismiss, onPatientSelect, patients }) {
  if (!notifs?.length) return null;
  const TYPE_ICON   = { critical:"🚨", result:"🧪", imaging:"🩻", consult:"📞" };
  const TYPE_COLOR  = { critical:T.red, result:T.teal, imaging:T.purple, consult:T.blue };
  return (
    <div style={{ display:"flex",alignItems:"center",gap:0,background:"rgba(5,15,30,0.96)",borderBottom:`1px solid ${T.teal}33`,flexShrink:0,overflowX:"auto",minHeight:34 }}>
      <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:7,fontWeight:700,color:T.txt4,textTransform:"uppercase",letterSpacing:"0.14em",padding:"0 10px",flexShrink:0 }}>New</div>
      <div style={{ display:"flex",alignItems:"center",gap:0,flex:1,overflowX:"auto" }}>
        {notifs.map((n,i)=>{
          const color=TYPE_COLOR[n.type]||T.teal;
          const pt=patients.find(p=>p.id===n.patientId);
          const isCrit=n.type==="critical";
          return (
            <div key={i} className={isCrit?"ew-pulse":undefined} style={{ display:"inline-flex",alignItems:"center",gap:7,padding:"6px 12px",borderRight:"1px solid rgba(26,53,85,0.4)",flexShrink:0,cursor:"pointer",transition:"background .12s" }}
              onClick={()=>{ if(pt)onPatientSelect(pt); }}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.04)"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <span style={{ fontSize:12,flexShrink:0,lineHeight:1 }}>{TYPE_ICON[n.type]||"🔔"}</span>
              <div style={{ minWidth:0 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700,color }}>{n.room}</span>
                <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.txt2,marginLeft:6 }}>{n.text}</span>
              </div>
              <button onClick={e=>{ e.stopPropagation(); onDismiss(i); }} style={{ background:"none",border:"none",color:T.txt4,cursor:"pointer",fontSize:11,padding:"0 2px",flexShrink:0,lineHeight:1 }}>✕</button>
            </div>
          );
        })}
      </div>
      <button onClick={()=>notifs.forEach((_,i)=>onDismiss(0))} style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.txt4,background:"none",border:"none",cursor:"pointer",padding:"0 10px",flexShrink:0,whiteSpace:"nowrap" }}>Clear all</button>
    </div>
  );
}

// ─── COMMAND PALETTE ──────────────────────────────────────────────────────────
function CommandPalette({ open, onClose, patients, onNewPatient }) {
  const [query,setQuery]=useState(""), [activeIdx,setActiveIdx]=useState(0);
  const inputRef=useRef(null);
  useEffect(()=>{ if(open){setQuery("");setActiveIdx(0);requestAnimationFrame(()=>inputRef.current?.focus());} },[open]);
  const { actions,pts,hubs }=paletteFilter(query,patients);
  const resolvedActions=actions.map(a=>a.execute==="__newPatient__"?{ ...a,execute:onNewPatient }:a);
  const flat=[
    ...resolvedActions.map(a=>({ ...a,type:"action" })),
    ...pts.map(p=>({ key:`pt-${p.id}`,type:"patient",label:p.name,sub:`${p.room} · ${p.cc} · ESI ${p.esi} · ${fmtTime(p.mins)}`,icon:"👤",badge:`ESI ${p.esi}`,badgeColor:esiColor(p.esi),execute:()=>nav("PatientEncounter",{ patientId:p.id }) })),
    ...hubs.map(h=>({ key:`hub-${h.key}`,type:"hub",label:h.label,sub:h.cat,icon:h.icon,badge:"Hub",badgeColor:T.purple,execute:()=>nav(h.key) })),
  ];
  useEffect(()=>{ if(!open)return; const onKey=(e)=>{ if(e.key==="Escape"){onClose();return;} if(e.key==="ArrowDown"){e.preventDefault();setActiveIdx(i=>Math.min(i+1,flat.length-1));} if(e.key==="ArrowUp"){e.preventDefault();setActiveIdx(i=>Math.max(i-1,0));} if(e.key==="Enter"&&flat[activeIdx]){flat[activeIdx].execute?.();onClose();} }; window.addEventListener("keydown",onKey); return()=>window.removeEventListener("keydown",onKey); },[open,activeIdx,flat,onClose]);
  useEffect(()=>{ setActiveIdx(0); },[query]);
  if(!open)return null;
  const LABELS={ action:"Actions",patient:"Patients",hub:"Clinical Hubs" };
  const rows=[]; let lastType=null;
  flat.forEach((item,idx)=>{
    if(item.type!==lastType){
      rows.push(<div key={`hdr-${item.type}`} style={{ padding:"7px 16px 3px",fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:700,color:T.txt4,textTransform:"uppercase",letterSpacing:"0.12em",borderTop:lastType?"1px solid rgba(26,53,85,0.4)":"none",marginTop:lastType?4:0 }}>{LABELS[item.type]}</div>);
      lastType=item.type;
    }
    const active=activeIdx===idx;
    rows.push(<div key={item.key} onClick={()=>{ item.execute?.();onClose(); }} onMouseEnter={()=>setActiveIdx(idx)} style={{ display:"flex",alignItems:"center",gap:10,padding:"9px 16px",background:active?`${T.teal}14`:"transparent",borderLeft:`2px solid ${active?T.teal:"transparent"}`,cursor:"pointer",transition:"background .08s,border-color .08s" }}><span style={{ fontSize:15,flexShrink:0,lineHeight:1 }}>{item.icon}</span><div style={{ flex:1,minWidth:0 }}><div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600,color:active?T.txt:T.txt2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{item.label}</div>{item.sub&&<div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.txt4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginTop:1 }}>{item.sub}</div>}</div><span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:600,color:item.badgeColor||T.txt4,background:`${item.badgeColor||T.txt4}18`,border:`1px solid ${item.badgeColor||T.txt4}33`,borderRadius:4,padding:"2px 6px",flexShrink:0,whiteSpace:"nowrap" }}>{item.badge}</span></div>);
  });
  return (
    <div onClick={onClose} style={{ position:"fixed",inset:0,zIndex:9999,background:"rgba(5,15,30,0.82)",backdropFilter:"blur(14px)",display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:100 }}>
      <div onClick={e=>e.stopPropagation()} className="modal-in" style={{ width:"100%",maxWidth:600,borderRadius:14,overflow:"hidden",background:T.panel,border:`1px solid ${T.teal}44`,boxShadow:`0 32px 100px rgba(0,0,0,0.9),0 0 0 1px ${T.teal}18 inset` }}>
        <div style={{ display:"flex",alignItems:"center",gap:10,padding:"0 18px",borderBottom:"1px solid rgba(26,53,85,0.6)" }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:16,color:T.txt4,flexShrink:0 }}>⌘</span>
          <input ref={inputRef} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search patients, hubs, or actions..." style={{ flex:1,background:"transparent",border:"none",outline:"none",fontFamily:"'DM Sans',sans-serif",fontSize:15,color:T.txt,padding:"16px 0" }}/>
          {query?<button onClick={()=>setQuery("")} style={{ background:"none",border:"none",color:T.txt4,cursor:"pointer",fontSize:13,padding:"2px 4px",flexShrink:0 }}>✕</button>:<span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.txt4,background:"rgba(26,53,85,0.5)",border:"1px solid rgba(26,53,85,0.7)",borderRadius:4,padding:"2px 7px",flexShrink:0 }}>ESC</span>}
        </div>
        <div style={{ maxHeight:420,overflowY:"auto" }}>
          {flat.length===0?<div style={{ padding:"32px 20px",textAlign:"center" }}><div style={{ fontSize:28,marginBottom:8 }}>🔍</div><div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:T.txt4 }}>No results for <span style={{ color:T.txt3,fontStyle:"italic" }}>"{query}"</span></div></div>:rows}
        </div>
        <div style={{ padding:"7px 16px",borderTop:"1px solid rgba(26,53,85,0.5)",display:"flex",alignItems:"center",gap:14 }}>
          {[["↑↓","navigate"],["↵","open"],["esc","close"]].map(([key,label])=><div key={key} style={{ display:"flex",alignItems:"center",gap:4 }}><span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.txt3,background:"rgba(26,53,85,0.5)",border:"1px solid rgba(26,53,85,0.8)",borderRadius:4,padding:"1px 5px" }}>{key}</span><span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.txt4 }}>{label}</span></div>)}
          <div style={{ flex:1 }}/><span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.txt4,letterSpacing:"0.06em" }}>LAKONYX · ⌘K</span>
        </div>
      </div>
    </div>
  );
}

// ─── NEW PATIENT MODAL ────────────────────────────────────────────────────────
function NewPatientModal({ onClose }) {
  return (
    <div onClick={onClose} style={{ position:"fixed",inset:0,zIndex:9000,background:"rgba(5,15,30,0.88)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
      <div onClick={e=>e.stopPropagation()} className="modal-in" style={{ width:"100%",maxWidth:480,borderRadius:16,overflow:"hidden",border:"1px solid rgba(26,53,85,0.6)",background:T.panel,boxShadow:"0 24px 80px rgba(0,0,0,0.8)" }}>
        <div style={{ padding:"20px 24px 16px",borderBottom:"1px solid rgba(26,53,85,0.5)" }}>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
            <div><div style={{ fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:T.txt,marginBottom:4 }}>Add New Patient</div><div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.txt4 }}>Choose your documentation mode</div></div>
            <button onClick={onClose} style={{ background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,color:T.txt4,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:12,padding:"6px 12px" }}>✕</button>
          </div>
        </div>
        <div style={{ padding:"20px 24px 24px",display:"flex",flexDirection:"column",gap:12 }}>
          {[
            { key:"QuickNote",      accent:T.teal,   icon:"✏️", title:"Quick Note",      tag:"Recommended", desc:"Fast bedside documentation. AI-assisted HPI, SmartFill, and ICD-10 search. Designed for speed — document in under 2 minutes.", hint:"For attendings and mid-levels at the bedside →" },
            { key:"NewPatientInput",accent:T.gold,   icon:"📋", title:"Full Intake (NPI)",tag:null,          desc:"Structured intake with ROS, PE, vitals, PMHx, medications, and social history. Full encounter build for complex patients.", hint:"For nurses, residents, and detailed documentation →" },
          ].map(opt=>(
            <div key={opt.key} onClick={()=>{ nav(opt.key); onClose(); }} style={{ ...gc({ borderRadius:12,borderLeft:`3px solid ${opt.accent}`,background:`linear-gradient(135deg,${opt.accent}0a,${T.card})` }),padding:"16px 18px",cursor:"pointer" }}>
              <div style={{ display:"flex",alignItems:"flex-start",gap:12 }}>
                <span style={{ fontSize:28,lineHeight:1 }}>{opt.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:5 }}>
                    <span style={{ fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:opt.accent }}>{opt.title}</span>
                    {opt.tag&&<span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:opt.accent,background:`${opt.accent}12`,border:`1px solid ${opt.accent}30`,borderRadius:4,padding:"1px 6px",textTransform:"uppercase",letterSpacing:"0.08em" }}>{opt.tag}</span>}
                  </div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.txt3,lineHeight:1.6 }}>{opt.desc}</div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:opt.accent,marginTop:8 }}>{opt.hint}</div>
                </div>
              </div>
            </div>
          ))}
          <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.txt4,textAlign:"center",marginTop:4 }}>You can switch modes at any time from the Patient Encounter page</div>
        </div>
      </div>
    </div>
  );
}

// ─── CENSUS PANEL ─────────────────────────────────────────────────────────────
function CensusPanel({ patients, search, onSearch, selectedId, onSelect, summaries }) {
  const [filterMode,setFilterMode]=useState("all");
  const filtered=patients.filter(p=>[p.name,p.cc,p.room].some(s=>(s||"").toLowerCase().includes(search.toLowerCase())));
  const sorted=[...filtered].sort((a,b)=>a.esi!==b.esi?a.esi-b.esi:b.mins-a.mins);
  const myPatients=sorted.filter(p=>deriveProviders(p).some(pr=>pr.role==="MD"&&pr.name===CURRENT_USER));
  const displayed=filterMode==="mine"?myPatients:sorted, isMine=filterMode==="mine";
  return (
    <div style={{ width:292,minWidth:292,flexShrink:0,display:"flex",flexDirection:"column",borderRight:"1px solid rgba(26,53,85,0.5)",height:"100%",overflow:"hidden",background:T.panel }}>
      <div style={{ padding:"14px 16px 10px",borderBottom:`1px solid ${isMine?T.teal+"44":"rgba(26,53,85,0.5)"}`,transition:"border-color .25s" }}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:9 }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:700,color:isMine?T.teal:T.txt4,textTransform:"uppercase",letterSpacing:"0.12em",transition:"color .2s" }}>{isMine?"My Patients":"Patient Census"}</span>
          <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.teal,background:"rgba(0,229,192,0.1)",border:"1px solid rgba(0,229,192,0.3)",borderRadius:10,padding:"1px 8px" }}>{isMine?`${displayed.length} / ${patients.length}`:patients.length}</span>
        </div>
        <div style={{ display:"flex",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(26,53,85,0.5)",borderRadius:8,overflow:"hidden",marginBottom:9 }}>
          {[{ mode:"mine",label:"My Patients",count:myPatients.length },{ mode:"all",label:"All",count:sorted.length }].map(({ mode,label,count },i)=>{ const active=filterMode===mode; return <button key={mode} onClick={()=>setFilterMode(mode)} style={{ flex:mode==="mine"?1:"none",display:"flex",alignItems:"center",justifyContent:mode==="mine"?"flex-start":"center",gap:5,padding:"5px 10px",background:active?`${T.teal}1a`:"transparent",border:"none",borderRight:i===0?"1px solid rgba(26,53,85,0.5)":"none",color:active?T.teal:T.txt4,fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:active?700:400,cursor:"pointer",transition:"all .15s",whiteSpace:"nowrap" }}>{label}<span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:active?T.teal:T.txt4,background:active?"rgba(0,229,192,0.15)":"rgba(26,53,85,0.4)",borderRadius:8,padding:"0 5px",lineHeight:1.7 }}>{count}</span></button>; })}
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(26,53,85,0.5)",borderRadius:8,padding:"7px 10px" }}>
          <span style={{ fontSize:12,color:T.txt4 }}>🔍</span>
          <input value={search} onChange={e=>onSearch(e.target.value)} placeholder="Room, name, CC..." style={{ flex:1,background:"transparent",border:"none",outline:"none",fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.txt }}/>
          {search&&<button onClick={()=>onSearch("")} style={{ background:"none",border:"none",color:T.txt4,cursor:"pointer",fontSize:11,padding:0 }}>x</button>}
        </div>
      </div>
      <div style={{ flex:1,overflowY:"auto",paddingBottom:8 }}>
        {displayed.length===0&&<div style={{ padding:"32px 16px",textAlign:"center" }}><div style={{ fontSize:28,marginBottom:10 }}>👤</div><div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.txt4,lineHeight:1.6 }}>{isMine?`No patients assigned to Dr. ${CURRENT_USER}`:"No patients match your search"}</div>{isMine&&<button onClick={()=>setFilterMode("all")} style={{ marginTop:10,fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.teal,background:"rgba(0,229,192,0.08)",border:"1px solid rgba(0,229,192,0.3)",borderRadius:6,padding:"4px 12px",cursor:"pointer" }}>View All Patients →</button>}</div>}
        {displayed.map(p=>{
          const isSelected=p.id===selectedId;
          const hasCrit=Array.isArray(p.alerts)&&p.alerts.some(a=>a.t==="critical");
          const timer=getProtocolTimer(p);
          const traj=deriveTrajectory(p);
          const sofa=qSOFA(p);
          return (
          <div key={p.id} onClick={()=>onSelect(p)} style={{ padding:"10px 16px",background:isSelected?`linear-gradient(135deg,${T.teal}12,${T.teal}06)`:"transparent",borderLeft:`3px solid ${isSelected?T.teal:"transparent"}`,borderBottom:"1px solid rgba(26,53,85,0.3)",cursor:"pointer",transition:"all .12s",display:"flex",flexDirection:"column",gap:4 }} onMouseEnter={e=>{ if(!isSelected){e.currentTarget.style.background=`linear-gradient(135deg,${T.teal}07,transparent)`;e.currentTarget.style.borderLeftColor=T.teal+"44";} }} onMouseLeave={e=>{ if(!isSelected){e.currentTarget.style.background="transparent";e.currentTarget.style.borderLeftColor="transparent";} }}>
            {/* Row 1: room · badges row */}
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
              <div style={{ display:"flex",alignItems:"center",gap:5 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:isSelected?T.teal:T.txt4 }}>{p.room}</span>
                {hasCrit&&<span className="ew-pulse" style={{ width:5,height:5,borderRadius:"50%",background:T.red,display:"inline-block" }}/>}
              </div>
              <div style={{ display:"flex",alignItems:"center",gap:5,flexWrap:"nowrap" }}>
                {/* q-SOFA badge — only show score ≥ 1 */}
                {sofa&&sofa.score>=1&&<span title={`q-SOFA ${sofa.score}/3`} style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:700,color:sofa.color,background:`${sofa.color}18`,border:`1px solid ${sofa.color}44`,borderRadius:4,padding:"1px 5px",flexShrink:0 }}>qS{sofa.score}</span>}
                {/* Trajectory arrow */}
                {traj&&<span title={traj.label} style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:700,color:traj.color,lineHeight:1,flexShrink:0 }}>{traj.icon}</span>}
                <EsiBadge esi={p.esi}/><TimeBadge mins={p.mins}/>
              </div>
            </div>
            {/* Row 2: patient name */}
            <div style={{ fontFamily:"'Playfair Display',serif",fontSize:13,fontWeight:700,color:T.txt,lineHeight:1.2 }}>{p.name}</div>
            {/* Row 3: protocol timer — only rendered when time-critical flag is present */}
            {timer&&<div className={timer.urgent?"ew-pulse":undefined} style={{ display:"inline-flex",alignItems:"center",gap:5,background:`${timer.color}0f`,border:`1px solid ${timer.color}44`,borderRadius:6,padding:"3px 8px",alignSelf:"flex-start" }}>
              <span style={{ width:5,height:5,borderRadius:"50%",background:timer.color,display:"inline-block",flexShrink:0 }}/>
              <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700,color:timer.color }}>{timer.label}</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:`${timer.color}bb` }}>{timer.sublabel}</span>
            </div>}
            {/* Row 4: AI summary */}
            {(summaries[p.id]?.text||summaries[p.id]?.loading)&&<div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:10,color:summaries[p.id]?.loading?T.txt4:T.txt3,fontStyle:"italic",lineHeight:1.3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{summaries[p.id]?.loading?"···":summaries[p.id].text}</div>}
            {/* Row 5: providers */}
            <ProviderRow providers={deriveProviders(p)} compact/>
            {/* Row 6: age/sex · CC · dispo */}
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",gap:4 }}>
              <div style={{ display:"flex",alignItems:"center",gap:6,minWidth:0,overflow:"hidden" }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.txt4,flexShrink:0 }}>{p.age}{p.sex}</span>
                <span style={{ color:T.txt4,fontSize:9,flexShrink:0 }}>·</span>
                <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.txt3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{p.cc}</span>
              </div>
              <DispoBadge status={deriveDispoStatus(p)}/>
            </div>
            {/* Row 7: result chips */}
            <ResultChipsRow chips={deriveResultChips(p)}/>
          </div>
        ); })}
      </div>
    </div>
  );
}

// ─── SELECT PATIENT PROMPT ────────────────────────────────────────────────────
function SelectPatientPrompt({ patients }) {
  return (
    <div style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,background:T.bg }}>
      <div style={{ fontSize:52 }}>🏥</div>
      <div style={{ fontFamily:"'Playfair Display',serif",fontSize:22,color:T.txt3 }}>Select a patient</div>
      <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:T.txt4,textAlign:"center",maxWidth:280,lineHeight:1.6 }}>Choose a patient from the census to open their encounter workspace</div>
      <div style={{ marginTop:8,display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center" }}>
        {patients.filter(p=>Array.isArray(p.alerts)&&p.alerts.some(a=>a.t==="critical")).slice(0,3).map(p=><div key={p.id} onClick={()=>nav("PatientEncounter",{ patientId:p.id })} style={{ padding:"6px 14px",borderRadius:20,background:"rgba(255,68,68,0.08)",border:"1px solid rgba(255,68,68,0.25)",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.red }}>🚨 {p.room} — {p.cc}</div>)}
      </div>
    </div>
  );
}

// ─── TIME-TO-EVENT HELPERS ────────────────────────────────────────────────────
const DTD_TARGET=30, EKG_TARGET=10, STALE_THRESH=30;
const dtdColor   =(m)=>m>60?T.red:m>DTD_TARGET?T.gold:T.green;
const staleColor =(m)=>m>60?T.red:m>STALE_THRESH?T.gold:T.txt4;
const mockDtd    =(p)=>p.door_to_doc!=null?p.door_to_doc:Math.max(5,Math.min(90,Math.floor((p.mins||30)*0.3)+(idHash(String(p.id||""))%25)));
const isCardiac  =(p)=>["chest","stemi","cardiac","ekg","palpitat","syncope"].some(kw=>(p.cc||"").toLowerCase().includes(kw));
const mockDoorToEkg    =(p)=>p.door_to_ekg!=null?p.door_to_ekg:Math.max(3,5+(idHash(String(p.id||""))%20));
const mockLastOrderMins=(p)=>p.last_order_mins!=null?p.last_order_mins:(idHash(String(p.id||""))*11+17)%75;

// ─── SHIFT RAIL ───────────────────────────────────────────────────────────────
function ShiftRail({ patients }) {
  const critPts=patients.filter(p=>Array.isArray(p.alerts)&&p.alerts.some(a=>a.t==="critical"));
  const avgTime=patients.length?Math.round(patients.reduce((s,p)=>s+(p.mins||0),0)/patients.length):0;
  const dtdValues=patients.map(p=>mockDtd(p));
  const avgDtd=dtdValues.length?Math.round(dtdValues.reduce((a,b)=>a+b,0)/dtdValues.length):0;
  const worstDtd=dtdValues.length?Math.max(...dtdValues):0;
  const worstDtdPt=patients.find(p=>mockDtd(p)===worstDtd);
  const cardiacPts=patients.filter(p=>isCardiac(p));
  const ekgOnTime=cardiacPts.filter(p=>mockDoorToEkg(p)<=EKG_TARGET);
  const ekgLabel=cardiacPts.length?`${ekgOnTime.length} / ${cardiacPts.length}`:"—";
  const ekgAllGood=cardiacPts.length>0&&ekgOnTime.length===cardiacPts.length;
  const ekgSomemissed=cardiacPts.length>0&&ekgOnTime.length<cardiacPts.length;
  const stalePts=patients.filter(p=>(p.mins||0)>45&&mockLastOrderMins(p)>STALE_THRESH);
  // Projected on-board at shift end: patients with no near-term dispo and LOS still building
  const projectedOnBoard=patients.filter(p=>{
    const d=p.dispo_status||deriveDispoStatus(p);
    return !["dc_ready","admitted","transfer"].includes(d);
  }).length;
  const pob_color=projectedOnBoard>4?T.red:projectedOnBoard>2?T.orange:T.gold;
  const secLabel=(txt,color=T.txt4)=><div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:700,color,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:8 }}>{txt}</div>;
  const metricRow=(label,value,valueColor,sub=null)=><div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:7 }}><div style={{ minWidth:0 }}><div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.txt3,lineHeight:1.3 }}>{label}</div>{sub&&<div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.txt4,marginTop:1 }}>{sub}</div>}</div><span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:14,fontWeight:700,color:valueColor,flexShrink:0,marginLeft:8 }}>{value}</span></div>;
  return (
    <div style={{ width:258,minWidth:258,flexShrink:0,height:"100%",borderLeft:"1px solid rgba(26,53,85,0.5)",background:T.panel,display:"flex",flexDirection:"column",overflow:"hidden" }}>
      <div style={{ padding:"14px 14px 10px",borderBottom:"1px solid rgba(26,53,85,0.5)",flexShrink:0 }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:700,color:T.txt4,textTransform:"uppercase",letterSpacing:"0.12em" }}>Shift Overview</div>
      </div>
      <div style={{ padding:"12px 12px 12px",flex:1,overflowY:"auto" }}>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:14 }}>
          {[
            { label:"Total Pts",    value:patients.length,                                                                                              color:T.teal    },
            { label:"ESI 1–2",      value:patients.filter(p=>p.esi<=2).length,                                                                         color:T.coral   },
            { label:"Crit Alerts",  value:patients.filter(p=>Array.isArray(p.alerts)&&p.alerts.some(a=>a.t==="critical")).length,                      color:T.red     },
            { label:"Avg LOS",      value:`${avgTime}m`,                                                                                               color:T.gold    },
            { label:"No Dispo Yet", value:projectedOnBoard,                                                                                             color:pob_color },
            { label:"Stale W/U",    value:stalePts.length,                                                                                             color:stalePts.length>2?T.red:stalePts.length>0?T.gold:T.green },
          ].map((s,i)=><div key={i} style={{ ...gc({ borderRadius:9 }),padding:"10px 11px",textAlign:"center" }}><div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:20,fontWeight:700,color:s.color,lineHeight:1 }}>{s.value}</div><div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.txt4,marginTop:4 }}>{s.label}</div></div>)}
        </div>
        <div style={{ ...gc({ borderRadius:10 }),padding:"11px 12px",marginBottom:14 }}>
          {secLabel("Time-to-Event")}
          {patients.length===0
            ?<div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.txt4,textAlign:"center",padding:"8px 0" }}>No patients</div>
            :<>
              {metricRow("Avg Door-to-Doc",     `${avgDtd}m`,   dtdColor(avgDtd),   `Target ≤${DTD_TARGET}m`)}
              {metricRow("Longest Door-to-Doc", `${worstDtd}m`, dtdColor(worstDtd), worstDtdPt?`${worstDtdPt.room} · ${(worstDtdPt.name||"").split(",")[0]}`:null)}
              <div style={{ height:1,background:"rgba(26,53,85,0.5)",margin:"8px 0" }}/>
              {metricRow("EKG ≤10m (Cardiac)",  cardiacPts.length===0?"—":ekgLabel, ekgAllGood?T.green:ekgSomemissed?T.red:T.txt4)}
              {metricRow("Stale Workups >30m",  stalePts.length===0?"0":String(stalePts.length), stalePts.length===0?T.green:stalePts.length>2?T.red:T.gold, "LOS >45m, no new orders")}
            </>}
        </div>
        {stalePts.length>0&&<div style={{ marginBottom:14 }}>{secLabel("Stale Workups",T.gold)}{stalePts.map(p=><div key={p.id} onClick={()=>nav("PatientEncounter",{ patientId:p.id })} style={{ ...gc({ borderRadius:9,borderLeft:`3px solid ${staleColor(mockLastOrderMins(p))}`,background:"rgba(245,200,66,0.04)" }),padding:"8px 10px",marginBottom:6,cursor:"pointer" }}><div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:2 }}><span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,color:T.txt }}>{(p.name||"").split(",")[0]}</span><span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700,color:staleColor(mockLastOrderMins(p)) }}>{mockLastOrderMins(p)}m</span></div><div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.txt4 }}>{p.room} · No new orders</div></div>)}</div>}
        {critPts.length>0&&<div style={{ marginBottom:14 }}>{secLabel("Critical — Needs Attention",T.red)}{critPts.map(p=><div key={p.id} onClick={()=>nav("PatientEncounter",{ patientId:p.id })} style={{ ...gc({ borderRadius:9,borderLeft:`3px solid ${T.red}`,background:"rgba(255,68,68,0.05)" }),padding:"9px 11px",marginBottom:6,cursor:"pointer" }}><div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,color:T.txt,marginBottom:2 }}>{p.name}</div><div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.txt4,marginBottom:4 }}>{p.room} · {p.cc}</div>{(Array.isArray(p.alerts)?p.alerts:[]).filter(a=>a.t==="critical").map((a,i)=><div key={i} style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.red,lineHeight:1.4 }}>🚨 {a.m}</div>)}</div>)}</div>}
        <div style={{ marginBottom:14 }}>
          {secLabel("ESI Breakdown")}
          {[1,2,3,4,5].map(esi=>{ const count=patients.filter(p=>p.esi===esi).length, c=esiColor(esi), pct=patients.length?(count/patients.length)*100:0; return <div key={esi} style={{ display:"flex",alignItems:"center",gap:8,marginBottom:5 }}><span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:c,minWidth:36 }}>ESI {esi}</span><div style={{ flex:1,height:5,background:"rgba(26,53,85,0.5)",borderRadius:3,overflow:"hidden" }}><div style={{ width:`${pct}%`,height:"100%",background:c,borderRadius:3,transition:"width .4s" }}/></div><span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.txt4,minWidth:12,textAlign:"right" }}>{count}</span></div>; })}
        </div>
      </div>
    </div>
  );
}

// ─── TOP BAR ──────────────────────────────────────────────────────────────────
function TopBar({ onQuickNote, onNewPatient, onOpenPalette, onRapidOrder }) {
  const now=new Date();
  return (
    <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 24px",height:58,minHeight:58,borderBottom:"1px solid rgba(26,53,85,0.5)",background:T.panel,flexShrink:0 }}>
      <div style={{ display:"flex",alignItems:"center",gap:10 }}>
        <div style={{ width:32,height:32,borderRadius:8,background:`linear-gradient(135deg,${T.teal},${T.purple})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16 }}>⚡</div>
        <div>
          <div style={{ fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:900,color:T.txt,letterSpacing:"0.03em" }}>LAKONYX</div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.txt4,letterSpacing:"0.16em",marginTop:-1 }}>COMMAND CENTER</div>
        </div>
        <div onClick={onOpenPalette} style={{ display:"flex",alignItems:"center",gap:7,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(26,53,85,0.5)",borderRadius:8,padding:"5px 12px",cursor:"pointer",marginLeft:12 }} onMouseEnter={e=>{ e.currentTarget.style.borderColor="rgba(0,229,192,0.3)"; }} onMouseLeave={e=>{ e.currentTarget.style.borderColor="rgba(26,53,85,0.5)"; }}>
          <span style={{ fontSize:12,color:T.txt4 }}>🔍</span>
          <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.txt4 }}>Search</span>
          <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.txt4,background:"rgba(26,53,85,0.6)",border:"1px solid rgba(26,53,85,0.8)",borderRadius:4,padding:"1px 6px",marginLeft:2 }}>⌘K</span>
        </div>
      </div>
      <div style={{ display:"flex",alignItems:"center",gap:14 }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:20,fontWeight:700,color:T.txt,letterSpacing:"0.04em" }}>{now.toLocaleTimeString("en-US",{ hour:"2-digit",minute:"2-digit" })}</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.txt4,marginTop:-2 }}>{now.toLocaleDateString("en-US",{ weekday:"short",month:"short",day:"numeric" })}</div>
        </div>
        <div style={{ background:"rgba(0,229,192,0.08)",border:"1px solid rgba(0,229,192,0.3)",borderRadius:8,padding:"4px 12px",display:"flex",alignItems:"center",gap:6 }}>
          <span style={{ width:6,height:6,borderRadius:"50%",background:T.teal,display:"inline-block" }}/>
          <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.teal,fontWeight:700 }}>On Shift</span>
        </div>
      </div>
      <div style={{ display:"flex",alignItems:"center",gap:8 }}>
        <Btn accent={T.teal}  onClick={onQuickNote}>✏️ Quick Note</Btn>
        <Btn accent={T.coral} onClick={onRapidOrder}>⚡ Rapid Order</Btn>
        <Btn accent={T.gold}  onClick={onNewPatient}>+ New Patient</Btn>
        <div style={{ width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${T.coral},${T.purple})`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:13,fontWeight:700,color:"white",fontFamily:"'DM Sans',sans-serif",flexShrink:0 }}>G</div>
      </div>
    </div>
  );
}

// ─── RAPID ORDER CATALOG ──────────────────────────────────────────────────────
const ROC = {
  labs:[
    { id:"bmp",      name:"BMP",                             common:true  },
    { id:"cbc",      name:"CBC w/ Differential",             common:true  },
    { id:"bmp-cbc",  name:"BMP + CBC",                       common:true  },
    { id:"trop",     name:"Troponin I (High-Sensitivity)",   common:true  },
    { id:"lactate",  name:"Lactate",                         common:true  },
    { id:"ua",       name:"Urinalysis w/ Reflex Culture",    common:true  },
    { id:"bc",       name:"Blood Cultures x2",               common:false },
    { id:"lfts",     name:"Hepatic Function Panel",          common:false },
    { id:"coags",    name:"PT / INR / PTT",                  common:false },
    { id:"ddimer",   name:"D-Dimer",                         common:false },
    { id:"tsh",      name:"TSH",                             common:false },
    { id:"lipase",   name:"Lipase",                          common:false },
    { id:"bhcg",     name:"β-hCG (Serum)",                   common:false },
    { id:"apap",     name:"Acetaminophen Level",             common:false },
    { id:"etoh",     name:"Ethanol Level",                   common:false },
    { id:"vbg",      name:"Venous Blood Gas",                common:false },
    { id:"abg",      name:"Arterial Blood Gas",              common:false },
  ],
  imaging:[
    { id:"cxr",      name:"CXR PA & Lateral",                common:true  },
    { id:"ct-head",  name:"CT Head w/o Contrast",            common:true  },
    { id:"ct-pe",    name:"CT Chest CTA (PE Protocol)",      common:true  },
    { id:"ct-ap",    name:"CT Abd/Pelvis w/ Contrast",       common:true  },
    { id:"us-ruq",   name:"US Abdomen RUQ",                  common:true  },
    { id:"cxr-p",    name:"CXR Portable AP",                 common:false },
    { id:"ct-headc", name:"CT Head w/ Contrast",             common:false },
    { id:"ct-csp",   name:"CT C-Spine w/o",                  common:false },
    { id:"ct-chest", name:"CT Chest w/o (Routine)",          common:false },
    { id:"ct-apo",   name:"CT Abd/Pelvis w/o",               common:false },
    { id:"us-pelv",  name:"US Pelvis (Transvaginal)",        common:false },
    { id:"us-dvt",   name:"US Lower Extremity DVT",          common:false },
    { id:"us-renal", name:"US Renal",                        common:false },
    { id:"xr-ankle", name:"XR Ankle",                        common:false },
    { id:"xr-wrist", name:"XR Wrist",                        common:false },
    { id:"xr-hand",  name:"XR Hand",                         common:false },
  ],
  meds:[
    { id:"keto",     name:"Ketorolac 30mg IV",               common:true  },
    { id:"zofran",   name:"Ondansetron 4mg IV",              common:true  },
    { id:"morph",    name:"Morphine 4mg IV",                 common:true  },
    { id:"dilaud",   name:"HYDROmorphone 0.5mg IV",          common:true  },
    { id:"ns1l",     name:"Normal Saline 1L IV Bolus",       common:true  },
    { id:"asa",      name:"Aspirin 324mg PO",                common:true  },
    { id:"alb",      name:"Albuterol 2.5mg Neb",             common:true  },
    { id:"ativan",   name:"LORazepam 2mg IV",                common:false },
    { id:"plavix",   name:"Clopidogrel 600mg PO",            common:false },
    { id:"hep",      name:"Heparin IV (ACS Weight-Based)",   common:false },
    { id:"solumed",  name:"Methylprednisolone 125mg IV",     common:false },
    { id:"benadryl", name:"DiphenhydrAMINE 50mg IV",         common:false },
    { id:"metro",    name:"Metoprolol 5mg IV",               common:false },
    { id:"adeno",    name:"Adenosine 6mg IV (Rapid Push)",   common:false },
    { id:"mag",      name:"Magnesium Sulfate 2g IV",         common:false },
    { id:"d5w",      name:"D5W 250mL IV",                    common:false },
  ],
  consults:[
    { id:"cards",    name:"Cardiology",                      common:true  },
    { id:"neuro",    name:"Neurology",                       common:true  },
    { id:"surg",     name:"General Surgery",                 common:true  },
    { id:"ortho",    name:"Orthopedics",                     common:false },
    { id:"psych",    name:"Psychiatry",                      common:false },
    { id:"obgyn",    name:"OB / GYN",                        common:false },
    { id:"uro",      name:"Urology",                         common:false },
    { id:"neph",     name:"Nephrology",                      common:false },
    { id:"gi",       name:"Gastroenterology",                common:false },
    { id:"pulm",     name:"Pulmonology",                     common:false },
    { id:"id-cons",  name:"Infectious Disease",              common:false },
    { id:"heme",     name:"Hematology / Oncology",           common:false },
  ],
  sets:[
    { id:"s-acs",    name:"ACS Protocol",       sub:"ASA · Troponin · CXR · Heparin",              items:["asa","trop","cxr","hep"]           },
    { id:"s-sepsis", name:"Sepsis Bundle",       sub:"Blood Cx x2 · Lactate · BMP · CBC · NS 1L",  items:["bc","lactate","bmp","cbc","ns1l"]  },
    { id:"s-stroke", name:"Stroke Protocol",     sub:"CT Head · BMP · CBC · Coags",                items:["ct-head","bmp","cbc","coags"]      },
    { id:"s-chest",  name:"Chest Pain W/U",      sub:"Troponin · CXR · BMP · Ketorolac",           items:["trop","cxr","bmp","keto"]          },
    { id:"s-pe",     name:"PE Protocol",         sub:"D-Dimer · CTA Chest · BMP",                  items:["ddimer","ct-pe","bmp"]             },
    { id:"s-sync",   name:"Syncope W/U",         sub:"BMP · CBC · Troponin · CXR",                 items:["bmp","cbc","trop","cxr"]           },
    { id:"s-abd",    name:"Abdominal Pain W/U",  sub:"BMP · CBC · Lipase · LFTs · CT Abd/Pelvis",  items:["bmp","cbc","lipase","lfts","ct-ap"]},
    { id:"s-uti",    name:"UTI / Urosepsis",     sub:"UA w/ Reflex · Blood Cx x2 · BMP · CBC",     items:["ua","bc","bmp","cbc"]              },
  ],
};
const ROC_FLAT = Object.entries(ROC).reduce((acc,[key,arr])=>{ if(key!=="sets") arr.forEach(o=>{ acc[o.id]=o; }); return acc; },{});
const TAB_META = [
  { key:"labs",    label:"Labs",    icon:"🧪", color:T.cyan   },
  { key:"imaging", label:"Imaging", icon:"🩻", color:T.purple },
  { key:"meds",    label:"Meds",    icon:"💊", color:T.gold   },
  { key:"consults",label:"Consults",icon:"📞", color:T.blue   },
  { key:"sets",    label:"Sets",    icon:"⚡", color:T.teal   },
];

function OrderRow({ order, selected, tabColor, onToggle }) {
  return (
    <div onClick={onToggle} style={{ display:"flex",alignItems:"center",gap:10,padding:"8px 8px 8px 10px",borderRadius:8,background:selected?`${tabColor}0d`:"transparent",border:`1px solid ${selected?tabColor+"33":"transparent"}`,cursor:"pointer",transition:"all .1s",marginBottom:2 }} onMouseEnter={e=>{ if(!selected){e.currentTarget.style.background="rgba(26,53,85,0.28)";e.currentTarget.style.borderColor="rgba(26,53,85,0.5)";} }} onMouseLeave={e=>{ if(!selected){e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor="transparent";} }}>
      <div style={{ width:14,height:14,borderRadius:4,background:selected?tabColor:"transparent",border:`1.5px solid ${selected?tabColor:"rgba(90,130,168,0.45)"}`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center" }}>{selected&&<span style={{ color:"#000",fontSize:9,fontWeight:700,lineHeight:1 }}>✓</span>}</div>
      <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:selected?T.txt:T.txt2,flex:1,lineHeight:1.3 }}>{order.name}</span>
    </div>
  );
}

// ─── RAPID ORDER DRAWER ───────────────────────────────────────────────────────
function RapidOrderDrawer({ open, onClose, patients, selectedPatient }) {
  const [tab,setTab]=useState("labs"), [query,setQuery]=useState({}), [selected,setSelected]=useState({}), [stat,setStat]=useState(false);
  const [ptId,setPtId]=useState(null), [placing,setPlacing]=useState(false), [placed,setPlaced]=useState(false), [showPtPick,setShowPtPick]=useState(false), [showMore,setShowMore]=useState(false);
  useEffect(()=>{ if(selectedPatient?.id)setPtId(selectedPatient.id); },[selectedPatient?.id]);
  useEffect(()=>{ if(!open){const t=setTimeout(()=>{ setQuery({});setPlaced(false);setPlacing(false);setSelected({});setTab("labs");setStat(false);setShowMore(false); },250);return()=>clearTimeout(t);} },[open]);
  useEffect(()=>{ setShowMore(false);setQuery(p=>({...p,[tab]:""})); },[tab]);
  const activePt=patients.find(p=>p.id===ptId)||selectedPatient||null;
  const toggle=(id,name)=>setSelected(prev=>{ const n={...prev}; n[id]?delete n[id]:n[id]={ name }; return n; });
  const applySet=(set)=>setSelected(prev=>{ const n={...prev}; set.items.forEach(id=>{ const o=ROC_FLAT[id]; if(o)n[id]={ name:o.name }; }); return n; });
  const selectedCount=Object.keys(selected).length;
  const tabMeta=TAB_META.find(t=>t.key===tab)||TAB_META[0];
  const currentList=tab==="sets"?ROC.sets:(ROC[tab]||[]);
  const q=(query[tab]||"").toLowerCase();
  const filtered=q?currentList.filter(o=>(o.name||"").toLowerCase().includes(q)):currentList;
  const commonOrders=filtered.filter(o=>o.common), moreOrders=filtered.filter(o=>!o.common);
  const canPlace=selectedCount>0&&!!activePt&&!placing&&!placed;
  const btnA=placed?T.green:stat?T.red:T.teal;
  const placeOrders=async()=>{ if(!activePt||placing||placed||selectedCount===0)return; setPlacing(true); await new Promise(r=>setTimeout(r,1300)); setPlacing(false);setPlaced(true);setTimeout(onClose,1500); };
  if(!open)return null;
  return (
    <>
      <div onClick={onClose} style={{ position:"fixed",inset:0,zIndex:8000,background:"rgba(5,15,30,0.52)",backdropFilter:"blur(5px)" }}/>
      <div className="drawer-in" style={{ position:"fixed",top:0,right:0,bottom:0,width:460,zIndex:8001,display:"flex",flexDirection:"column",background:T.panel,borderLeft:`1px solid ${T.teal}44`,boxShadow:"-28px 0 80px rgba(0,0,0,0.72),inset 1px 0 0 rgba(0,229,192,0.07)" }}>
        <div style={{ padding:"16px 20px 12px",borderBottom:"1px solid rgba(26,53,85,0.55)",flexShrink:0,background:`linear-gradient(180deg,${T.bg} 0%,${T.panel} 100%)` }}>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12 }}>
            <div style={{ display:"flex",alignItems:"center",gap:9 }}>
              <div style={{ width:28,height:28,borderRadius:7,background:`linear-gradient(135deg,${T.coral}44,${T.coral}22)`,border:`1px solid ${T.coral}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15 }}>⚡</div>
              <div><div style={{ fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,color:T.txt,lineHeight:1.1 }}>Rapid Order</div><div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:7,color:T.txt4,letterSpacing:"0.1em",textTransform:"uppercase" }}>Place without leaving the board</div></div>
              {stat&&<span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:700,color:T.red,background:"rgba(255,68,68,0.12)",border:`1px solid ${T.red}44`,borderRadius:4,padding:"2px 7px",letterSpacing:"0.1em" }}>STAT</span>}
            </div>
            <button onClick={onClose} style={{ background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,color:T.txt4,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontSize:10,padding:"5px 11px" }}>✕ ESC</button>
          </div>
          <div style={{ background:"rgba(11,30,54,0.7)",border:"1px solid rgba(26,53,85,0.6)",borderRadius:9,padding:"9px 13px",position:"relative" }}>
            {activePt?(
              <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:3 }}><span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.txt4,background:"rgba(26,53,85,0.6)",border:"1px solid rgba(26,53,85,0.8)",borderRadius:4,padding:"1px 6px" }}>{activePt.room}</span><EsiBadge esi={activePt.esi}/><TimeBadge mins={activePt.mins}/></div>
                  <div style={{ fontFamily:"'Playfair Display',serif",fontSize:13,fontWeight:700,color:T.txt,lineHeight:1.2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{activePt.name}</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.txt3,marginTop:2 }}>{activePt.age}{activePt.sex} · <span style={{ color:T.teal }}>{activePt.cc}</span></div>
                </div>
                <div style={{ position:"relative",flexShrink:0 }}>
                  <button onClick={()=>setShowPtPick(p=>!p)} style={{ background:"rgba(0,229,192,0.07)",border:`1px solid ${T.teal}30`,borderRadius:6,color:T.teal,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontSize:8,padding:"4px 9px",display:"flex",alignItems:"center",gap:4 }}>Change <span style={{ fontSize:9 }}>▾</span></button>
                  {showPtPick&&<div style={{ position:"absolute",right:0,top:"calc(100% + 5px)",width:240,background:T.card,border:"1px solid rgba(26,53,85,0.7)",borderRadius:9,zIndex:200,overflow:"hidden",maxHeight:220,overflowY:"auto",boxShadow:"0 12px 40px rgba(0,0,0,0.6)" }}>{[...patients].sort((a,b)=>a.esi-b.esi).map(p=><div key={p.id} onClick={()=>{ setPtId(p.id);setShowPtPick(false); }} style={{ padding:"8px 13px",cursor:"pointer",borderBottom:"1px solid rgba(26,53,85,0.3)",background:p.id===ptId?`${T.teal}12`:"transparent",display:"flex",alignItems:"center",gap:8 }}><span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.txt4,flexShrink:0 }}>{p.room}</span><span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.txt,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{p.name}</span><EsiBadge esi={p.esi}/></div>)}</div>}
                </div>
              </div>
            ):<div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.txt4,textAlign:"center",padding:"4px 0" }}>No patient selected — choose from the list above</div>}
          </div>
        </div>
        <div style={{ display:"flex",borderBottom:"1px solid rgba(26,53,85,0.5)",background:T.bg,flexShrink:0 }}>
          {TAB_META.map(t=>{ const active=tab===t.key; return <button key={t.key} onClick={()=>setTab(t.key)} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"10px 4px 8px",background:active?`${t.color}12`:"transparent",border:"none",borderBottom:`2px solid ${active?t.color:"transparent"}`,color:active?t.color:T.txt4,cursor:"pointer",transition:"all .12s" }}><span style={{ fontSize:14,lineHeight:1 }}>{t.icon}</span><span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:active?700:400,letterSpacing:"0.06em" }}>{t.label}</span></button>; })}
        </div>
        <div style={{ padding:"9px 16px 4px",flexShrink:0 }}>
          <div style={{ display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(26,53,85,0.5)",borderRadius:8,padding:"6px 10px" }}>
            <span style={{ fontSize:11,color:T.txt4,flexShrink:0 }}>🔍</span>
            <input value={query[tab]||""} onChange={e=>setQuery(p=>({...p,[tab]:e.target.value}))} placeholder={`Search ${tab}...`} style={{ flex:1,background:"transparent",border:"none",outline:"none",fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.txt }}/>
            {(query[tab])&&<button onClick={()=>setQuery(p=>({...p,[tab]:""}))} style={{ background:"none",border:"none",color:T.txt4,cursor:"pointer",fontSize:11,flexShrink:0 }}>✕</button>}
          </div>
        </div>
        <div style={{ flex:1,overflowY:"auto",padding:"4px 16px 8px" }}>
          {tab==="sets"
            ?<div style={{ display:"flex",flexDirection:"column",gap:8,paddingTop:4 }}>{filtered.map(set=>{ const allApplied=set.items.every(id=>!!selected[id]); return <div key={set.id} onClick={()=>applySet(set)} style={{ ...gc({ borderRadius:10,borderLeft:`3px solid ${allApplied?T.teal:T.teal+"55"}`,background:allApplied?`${T.teal}0d`:`linear-gradient(135deg,${T.teal}07,${T.card})` }),padding:"12px 14px",cursor:"pointer" }}><div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:5 }}><span style={{ fontFamily:"'Playfair Display',serif",fontSize:13,fontWeight:700,color:allApplied?T.teal:T.txt }}>{set.name}</span><span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:allApplied?T.teal:T.txt4,background:allApplied?`${T.teal}18`:"rgba(26,53,85,0.4)",border:`1px solid ${allApplied?T.teal+"44":"rgba(26,53,85,0.5)"}`,borderRadius:4,padding:"2px 7px" }}>{allApplied?"✓ Applied":"+ Apply All"}</span></div><div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.txt3,lineHeight:1.5,marginBottom:8 }}>{set.sub}</div><div style={{ display:"flex",flexWrap:"wrap",gap:4 }}>{set.items.map(id=>{ const o=ROC_FLAT[id]; if(!o)return null; const isSel=!!selected[id]; return <span key={id} onClick={e=>{ e.stopPropagation();toggle(id,o.name); }} style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:isSel?T.teal:T.txt4,background:isSel?`${T.teal}18`:"rgba(26,53,85,0.35)",border:`1px solid ${isSel?T.teal+"44":"rgba(26,53,85,0.4)"}`,borderRadius:4,padding:"2px 7px",cursor:"pointer" }}>{isSel?"✓ ":""}{o.name}</span>; })}</div></div>; })}</div>
            :<div style={{ paddingTop:4 }}>
              {!q&&commonOrders.length>0&&<div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:7,fontWeight:700,color:T.txt4,textTransform:"uppercase",letterSpacing:"0.12em",padding:"4px 2px 5px" }}>Common</div>}
              {(q?filtered:commonOrders).map(o=><OrderRow key={o.id} order={o} selected={!!selected[o.id]} tabColor={tabMeta.color} onToggle={()=>toggle(o.id,o.name)}/>)}
              {!q&&moreOrders.length>0&&<><button onClick={()=>setShowMore(p=>!p)} style={{ width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 2px 5px",background:"none",border:"none",borderTop:"1px solid rgba(26,53,85,0.3)",cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontSize:7,fontWeight:700,color:T.txt4,textTransform:"uppercase",letterSpacing:"0.12em",marginTop:4 }}><span>More ({moreOrders.length})</span><span style={{ fontSize:9 }}>{showMore?"▲":"▾"}</span></button>{showMore&&moreOrders.map(o=><OrderRow key={o.id} order={o} selected={!!selected[o.id]} tabColor={tabMeta.color} onToggle={()=>toggle(o.id,o.name)}/>)}</>}
              {q&&filtered.length===0&&<div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.txt4,textAlign:"center",padding:"28px 0" }}>No results for "{query[tab]}"</div>}
            </div>}
        </div>
        <div style={{ flexShrink:0,borderTop:"1px solid rgba(26,53,85,0.55)",background:T.bg,padding:"11px 16px 14px" }}>
          {selectedCount>0&&<div style={{ maxHeight:70,overflowY:"auto",marginBottom:10 }}><div style={{ display:"flex",flexWrap:"wrap",gap:4 }}>{Object.entries(selected).map(([id,{ name }])=><span key={id} onClick={()=>toggle(id,name)} style={{ display:"inline-flex",alignItems:"center",gap:4,fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.teal,background:"rgba(0,229,192,0.08)",border:"1px solid rgba(0,229,192,0.25)",borderRadius:20,padding:"3px 9px",cursor:"pointer",lineHeight:1.4 }}>{name} <span style={{ color:T.txt4,fontSize:9,lineHeight:1 }}>✕</span></span>)}</div></div>}
          <div style={{ display:"flex",alignItems:"center",gap:8 }}>
            <button onClick={()=>setStat(p=>!p)} style={{ display:"flex",alignItems:"center",gap:6,padding:"7px 12px",background:stat?"rgba(255,68,68,0.1)":"rgba(26,53,85,0.28)",border:`1px solid ${stat?T.red+"55":"rgba(26,53,85,0.5)"}`,borderRadius:8,color:stat?T.red:T.txt4,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700,transition:"all .15s",flexShrink:0 }}><span style={{ width:6,height:6,borderRadius:"50%",background:stat?T.red:T.txt4,display:"inline-block",flexShrink:0,transition:"background .15s" }}/>{stat?"STAT":"Routine"}</button>
            {selectedCount>0&&<button onClick={()=>setSelected({})} style={{ padding:"7px 10px",background:"transparent",border:"1px solid rgba(26,53,85,0.5)",borderRadius:8,color:T.txt4,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontSize:9,flexShrink:0 }}>Clear</button>}
            <div style={{ flex:1 }}/>
            <button onClick={placeOrders} disabled={!canPlace&&!placed} style={{ display:"flex",alignItems:"center",gap:8,padding:"9px 18px",background:canPlace||placed?`linear-gradient(135deg,${btnA}2a,${btnA}14)`:"rgba(26,53,85,0.18)",border:`1.5px solid ${canPlace||placed?btnA+"55":"rgba(26,53,85,0.35)"}`,borderRadius:9,color:canPlace||placed?btnA:T.txt4,cursor:canPlace?"pointer":"not-allowed",fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:700,transition:"all .18s",flexShrink:0 }}>{placing?<><span style={{ width:10,height:10,borderRadius:"50%",border:`2px solid ${T.teal}30`,borderTop:`2px solid ${T.teal}`,display:"inline-block",animation:"cc-spin 1s linear infinite" }}/>Placing...</>:placed?"✓ Orders Placed":<>{stat?"⚡ STAT":"Place Orders"}{selectedCount>0&&<span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,background:"rgba(0,0,0,0.2)",borderRadius:10,padding:"1px 7px",lineHeight:1.5 }}>{selectedCount}</span>}</>}</button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── COMMAND CENTER — DEFAULT EXPORT ──────────────────────────────────────────
export default function CommandCenter() {
  const [search,         setSearch]         = useState("");
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [showPalette,    setShowPalette]    = useState(false);
  const [showRapidOrder, setShowRapidOrder] = useState(false);
  const [patients,       setPatients]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [selectedPatient,setSelectedPatient]= useState(null);
  const [summaries,      setSummaries]      = useState({});
  const [notifs,         setNotifs]         = useState([]);

  useEffect(()=>{
    base44.entities.Patient.list().then(data=>{ setPatients(data); setLoading(false); });
  },[]);

  // Seed demo notifications at staggered intervals to simulate live result returns.
  // Wire: replace with a real-time subscription (FHIR, Base44 entity subscription,
  // or polling base44.entities.Result) when live data is available.
  useEffect(()=>{
    const seeds=[
      { delay:6000,  notif:{ type:"critical",  room:"A7", text:"Lactate CRITICAL 4.2 — sepsis panel",    patientId:null }},
      { delay:12000, notif:{ type:"imaging",    room:"A4", text:"CT Head read: no acute intracranial process", patientId:null }},
      { delay:22000, notif:{ type:"result",     room:"A2", text:"Troponin I pending → 0.04 ng/mL (borderline)", patientId:null }},
    ];
    const timers=seeds.map(({delay,notif})=>setTimeout(()=>setNotifs(prev=>[...prev,notif]),delay));
    return()=>timers.forEach(clearTimeout);
  },[]);

  const dismissNotif=(idx)=>setNotifs(prev=>prev.filter((_,i)=>i!==idx));

  useEffect(()=>{
    const onKey=(e)=>{
      if((e.metaKey||e.ctrlKey)&&e.key==="k"){ e.preventDefault(); setShowPalette(p=>!p); }
      if(e.key==="Escape") setShowRapidOrder(false);
    };
    window.addEventListener("keydown",onKey);
    return()=>window.removeEventListener("keydown",onKey);
  },[]);

  const generateSummary=async(patient)=>{
    if(!patient?.id||summaries[patient.id])return;
    setSummaries(prev=>({ ...prev,[patient.id]:{ text:null,loading:true } }));
    const ordersText=(Array.isArray(patient.orders)?patient.orders:[]).slice(0,4).map(o=>`${o.name} (${o.status})`).join(", ")||"none placed yet";
    const alertsText=(Array.isArray(patient.alerts)?patient.alerts:[]).map(a=>a.m).join("; ")||"none";
    try {
      const result=await base44.integrations.Core.InvokeLLM({
        prompt:`You are writing a one-line ED census summary for a physician scanning a trackboard.\n\nPatient: ${patient.age||""}${patient.sex||""}, ESI ${patient.esi||"?"}, LOS ${patient.mins||0}min\nCC: ${patient.cc||"unknown"}\nOrders: ${ordersText}\nCritical alerts: ${alertsText}\n\nWrite exactly ONE sentence under 25 words. Lead with the key clinical finding or working diagnosis, then the most urgent pending action or current status. Be specific and clinical. No filler phrases like "patient presents with."`,
        response_json_schema:{ type:"object",properties:{ summary:{ type:"string" } },required:["summary"] }
      });
      setSummaries(prev=>({ ...prev,[patient.id]:{ text:result.summary,loading:false } }));
    } catch {
      setSummaries(prev=>({ ...prev,[patient.id]:{ text:null,loading:false } }));
    }
  };

  const handleSelectPatient=(p)=>{ setSelectedPatient(p); generateSummary(p); };

  if(loading) return (
    <div style={{ display:"flex",height:"100vh",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:14,background:T.bg }}>
      <div style={{ width:32,height:32,borderRadius:"50%",border:`3px solid rgba(0,229,192,0.2)`,borderTop:`3px solid ${T.teal}`,animation:"cc-spin 1s linear infinite" }}/>
      <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:T.txt3 }}>Loading census...</div>
    </div>
  );

  return (
    <div style={{ display:"flex",flexDirection:"column",height:"100%",minHeight:"100vh",overflow:"hidden",background:T.bg,color:T.txt,fontFamily:"'DM Sans',sans-serif" }}>
      <TopBar
        onQuickNote={()=>nav("QuickNote")}
        onNewPatient={()=>setShowNewPatient(true)}
        onOpenPalette={()=>setShowPalette(true)}
        onRapidOrder={()=>setShowRapidOrder(true)}
      />
      <ResultsBanner
        notifs={notifs}
        onDismiss={dismissNotif}
        onPatientSelect={handleSelectPatient}
        patients={patients}
      />
      <div style={{ display:"flex",flex:1,overflow:"hidden",minHeight:0 }}>
        <CensusPanel
          patients={patients}
          search={search}
          onSearch={setSearch}
          selectedId={selectedPatient?.id}
          onSelect={handleSelectPatient}
          summaries={summaries}
        />
        {selectedPatient
          ? <EncounterWorkspace
              key={selectedPatient.id}
              patient={selectedPatient}
              summary={summaries[selectedPatient.id]}
              onRapidOrder={()=>setShowRapidOrder(true)}
            />
          : <SelectPatientPrompt patients={patients}/>
        }
        <ShiftRail patients={patients}/>
      </div>

      {showNewPatient&&<NewPatientModal onClose={()=>setShowNewPatient(false)}/>}
      <CommandPalette open={showPalette} onClose={()=>setShowPalette(false)} patients={patients} onNewPatient={()=>{ setShowPalette(false);setShowNewPatient(true); }}/>
      <RapidOrderDrawer open={showRapidOrder} onClose={()=>setShowRapidOrder(false)} patients={patients} selectedPatient={selectedPatient}/>
    </div>
  );
}