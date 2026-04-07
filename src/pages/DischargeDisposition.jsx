import { useState, useCallback, useMemo, useEffect, useRef, useReducer } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import GlobalNav from "@/pages/GlobalNav";
import { base44 } from "@/api/base44Client";

const PREFIX  = "dc";
const PAGE_ID = "discharge";

(() => {
  const fid = `${PREFIX}-fonts`;
  if (document.getElementById(fid)) return;
  const l = document.createElement("link");
  l.id = fid; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style");
  s.id = `${PREFIX}-css`;
  s.textContent = `
.nv3 * { box-sizing:border-box; }
.nv3 ::-webkit-scrollbar { width:3px; height:3px; }
.nv3 ::-webkit-scrollbar-thumb { background:rgba(42,79,122,.5); border-radius:2px; }

@keyframes ${PREFIX}fade  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
@keyframes ${PREFIX}orb0  { 0%,100%{transform:translate(-50%,-50%) scale(1)}    50%{transform:translate(-50%,-50%) scale(1.10)} }
@keyframes ${PREFIX}orb1  { 0%,100%{transform:translate(-50%,-50%) scale(1.07)} 50%{transform:translate(-50%,-50%) scale(.92)}  }
@keyframes ${PREFIX}orb2  { 0%,100%{transform:translate(-50%,-50%) scale(.95)}  50%{transform:translate(-50%,-50%) scale(1.09)} }
.${PREFIX}-fade { animation:${PREFIX}fade .22s ease both; }
.${PREFIX}-shim {
  background:linear-gradient(90deg,#f2f7ff 0%,#fff 20%,#ff6b6b 50%,#ff9f43 75%,#f2f7ff 100%);
  background-size:250% auto; -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
  animation:${PREFIX}shim 6s linear infinite;
}
@keyframes ${PREFIX}shim { 0%,100%{background-position:-200% center} 50%{background-position:200% center} }

/* ── SHELL ── */
.nv3 {
  --bg:#050f1e; --panel:#081628; --card:#0b1e36; --up:#0e2544;
  --bd:#1a3555; --bhi:#2a4f7a;
  --teal:#00e5c0; --gold:#f5c842; --red:#ff4444; --coral:#ff6b6b;
  --green:#3dffa0; --blue:#3b9eff; --purple:#9b6dff; --orange:#ff9f43;
  --t:#f2f7ff; --t2:#b8d4f0; --t3:#82aece; --t4:#5a82a8;
  position:fixed; inset:0; display:flex; flex-direction:column;
  background:var(--bg); font-family:'DM Sans',sans-serif; color:var(--t); overflow:hidden;
}

/* ── PATIENT CONTEXT BAR ── */
.nv3-bar2 { height:46px; flex-shrink:0; background:var(--panel); border-bottom:1px solid var(--bd); display:flex; align-items:center; padding:0 14px; gap:8px; overflow:hidden; z-index:30; }
.nv3-chart-id { font-family:'JetBrains Mono',monospace; font-size:10px; background:var(--up); border:1px solid var(--bd); border-radius:20px; padding:2px 9px; color:var(--teal); white-space:nowrap; flex-shrink:0; }
.nv3-pt-name { font-family:'Playfair Display',serif; font-size:15px; font-weight:700; color:var(--t); white-space:nowrap; flex-shrink:0; }
.nv3-pt-meta { font-size:11px; color:var(--t3); white-space:nowrap; flex-shrink:0; }
.nv3-pt-cc   { font-family:'JetBrains Mono',monospace; font-size:11px; font-weight:600; color:var(--orange); white-space:nowrap; flex-shrink:0; }
.nv3-allergy { display:flex; align-items:center; gap:5px; background:rgba(255,107,107,.07); border:1px solid rgba(255,107,107,.3); border-radius:6px; padding:3px 9px; flex-shrink:0; }
.nv3-allergy-lbl  { font-size:9px; color:var(--coral); text-transform:uppercase; letter-spacing:.06em; font-weight:600; }
.nv3-allergy-pill { font-family:'JetBrains Mono',monospace; font-size:10px; font-weight:600; background:rgba(255,107,107,.18); color:var(--coral); border-radius:4px; padding:1px 6px; }
.nv3-vdiv  { width:1px; height:18px; background:var(--bd); flex-shrink:0; }
.nv3-vital { display:flex; align-items:center; gap:3px; font-family:'JetBrains Mono',monospace; font-size:10px; white-space:nowrap; flex-shrink:0; }
.nv3-vl    { color:var(--t4); font-size:9px; }
.nv3-vv    { color:var(--t2); }
.nv3-vv.abn{ color:var(--coral); font-weight:700; }
.nv3-esi   { font-family:'JetBrains Mono',monospace; font-size:10px; font-weight:700; padding:2px 8px; border-radius:4px; white-space:nowrap; flex-shrink:0; }
.nv3-bar2-acts { margin-left:auto; display:flex; gap:5px; align-items:center; flex-shrink:0; }
.nv3-btn { padding:4px 11px; border-radius:6px; font-size:11px; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; gap:4px; font-family:'DM Sans',sans-serif; transition:all .15s; white-space:nowrap; border:none; }
.nv3-btn-ghost { background:var(--up); border:1px solid var(--bd)!important; color:var(--t2); }
.nv3-btn-ghost:hover { border-color:var(--bhi)!important; color:var(--t); }
.nv3-btn-teal  { background:var(--teal); color:var(--bg); }
.nv3-btn-teal:hover  { filter:brightness(1.1); }
.nv3-btn-coral { background:rgba(255,107,107,.12); color:var(--coral); border:1px solid rgba(255,107,107,.3)!important; }
.nv3-btn-coral:hover { background:rgba(255,107,107,.22); }
.nv3-btn-gold  { background:rgba(245,200,66,.12); color:var(--gold); border:1px solid rgba(245,200,66,.3)!important; }
.nv3-btn-gold:hover  { background:rgba(245,200,66,.22); }

/* ── WORKFLOW NAV ── */
.nv3-nav { flex-shrink:0; background:var(--panel); border-bottom:1px solid var(--bd); z-index:25; }
.nv3-group-row { height:42px; display:flex; align-items:stretch; padding:0 4px; border-bottom:1px solid rgba(26,53,85,.4); gap:2px; overflow-x:auto; overflow-y:hidden; scrollbar-width:none; }
.nv3-group-row::-webkit-scrollbar { display:none; }
.nv3-group-tab { position:relative; display:flex; align-items:center; gap:7px; padding:0 14px; cursor:pointer; border:none; background:none; font-family:'DM Sans',sans-serif; font-size:12px; font-weight:500; color:var(--t3); border-radius:8px 8px 0 0; transition:all .18s; white-space:nowrap; flex-shrink:0; border:1px solid transparent; border-bottom:none; }
.nv3-group-tab:hover { color:var(--t2); background:rgba(255,255,255,.03); }
.nv3-group-tab.active { color:var(--t); background:rgba(14,37,68,.6); border-color:var(--bd); border-bottom-color:var(--panel); font-weight:600; }
.nv3-group-tab.active::before { content:''; position:absolute; top:-1px; left:12px; right:12px; height:2px; border-radius:0 0 3px 3px; background:var(--nv3-accent,var(--blue)); }
.nv3-group-badge { width:7px; height:7px; border-radius:50%; flex-shrink:0; transition:all .2s; }
.nv3-group-badge.empty   { background:var(--t4); opacity:.3; }
.nv3-group-badge.partial { background:var(--orange); box-shadow:0 0 4px rgba(255,159,67,.5); }
.nv3-group-badge.done    { background:var(--teal);   box-shadow:0 0 4px rgba(0,229,192,.5); }
.nv3-pill-row { height:48px; display:flex; align-items:center; padding:0 10px; gap:4px; overflow-x:auto; overflow-y:hidden; scrollbar-width:none; position:relative; }
.nv3-pill-row::-webkit-scrollbar { display:none; }
.nv3-pill-fade-l,.nv3-pill-fade-r { position:absolute; top:0; bottom:0; width:20px; pointer-events:none; z-index:2; }
.nv3-pill-fade-l { left:0;  background:linear-gradient(90deg,var(--panel),transparent); }
.nv3-pill-fade-r { right:0; background:linear-gradient(-90deg,var(--panel),transparent); }
.nv3-pill { display:flex; align-items:center; gap:5px; padding:5px 13px; border-radius:20px; font-family:'DM Sans',sans-serif; font-size:12px; font-weight:500; color:var(--t3); background:transparent; border:1px solid transparent; cursor:pointer; transition:all .18s; white-space:nowrap; flex-shrink:0; }
.nv3-pill:hover { color:var(--t2); background:var(--up); border-color:var(--bd); }
.nv3-pill.active { border-color:rgba(var(--nv3-accent-rgb,59,158,255),.38); background:rgba(var(--nv3-accent-rgb,59,158,255),.10); color:var(--nv3-accent,var(--blue)); font-weight:600; }
.nv3-pill-ico { font-size:12px; }
.nv3-pill-dot { width:5px; height:5px; border-radius:50%; flex-shrink:0; }
.nv3-pill-dot.done    { background:var(--teal); }
.nv3-pill-dot.partial { background:var(--orange); }
.nv3-pill-dot.empty   { background:var(--t4); }
.nv3-pill-sc { font-family:'JetBrains Mono',monospace; font-size:8px; color:var(--t4); background:var(--up); border:1px solid var(--bd); border-radius:3px; padding:1px 4px; opacity:0; transition:opacity .12s; }
.nv3-pill:hover .nv3-pill-sc { opacity:1; }

/* ── CONTENT ── */
.nv3-content-wrap { flex:1; overflow-y:auto; overflow-x:hidden; background:var(--bg); position:relative; z-index:0; }

/* ── LAYOUT ── */
.dc-layout { display:flex; gap:16px; max-width:1300px; margin:0 auto; padding:16px 18px 40px; position:relative; z-index:1; }
.dc-main   { flex:1; min-width:0; display:flex; flex-direction:column; gap:16px; }
.dc-sidebar{ width:280px; flex-shrink:0; display:flex; flex-direction:column; gap:12px; }

/* ── SHARED CARD/SECTION ── */
.dc-card { background:rgba(8,22,40,.8); border:1px solid rgba(26,53,85,.5); border-radius:12px; padding:16px 18px; }
.dc-sec-lbl { font-family:'JetBrains Mono',monospace; font-size:8px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:var(--t4); margin-bottom:12px; display:flex; align-items:center; gap:8px; }
.dc-sec-lbl-line { flex:1; height:1px; background:rgba(26,53,85,.6); }
.dc-field   { display:flex; flex-direction:column; gap:4px; margin-bottom:12px; }
.dc-field:last-child { margin-bottom:0; }
.dc-lbl  { font-family:'JetBrains Mono',monospace; font-size:8px; color:var(--t4); letter-spacing:1.5px; text-transform:uppercase; }
.dc-inp  { background:rgba(14,37,68,.6); border:1px solid var(--bd); border-radius:8px; padding:8px 12px; font-family:'DM Sans',sans-serif; font-size:12px; color:var(--t); outline:none; width:100%; transition:border-color .15s; }
.dc-inp:focus  { border-color:var(--bhi); }
.dc-inp::placeholder { color:var(--t4); font-style:italic; }
.dc-select { background:rgba(14,37,68,.6); border:1px solid var(--bd); border-radius:8px; padding:8px 12px; font-family:'DM Sans',sans-serif; font-size:12px; color:var(--t); outline:none; width:100%; cursor:pointer; }
.dc-ta { background:rgba(14,37,68,.6); border:1px solid var(--bd); border-radius:8px; padding:10px 12px; font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--t); outline:none; resize:none; min-height:80px; line-height:1.7; width:100%; transition:border-color .15s; }
.dc-ta:focus { border-color:var(--bhi); }
.dc-ta::placeholder { color:var(--t4); font-style:italic; }
.dc-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; }

/* ── DISPOSITION SELECTOR ── */
.dc-dispo-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:4px; }
.dc-dispo-btn {
  padding:18px 14px; border-radius:12px; cursor:pointer; text-align:center;
  font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600;
  transition:all .18s; border:2px solid transparent; display:flex; flex-direction:column; align-items:center; gap:6px;
}
.dc-dispo-btn .dc-dispo-icon { font-size:22px; }
.dc-dispo-btn .dc-dispo-sub  { font-size:10px; font-weight:400; opacity:.7; }
.dc-dispo-btn.discharge { background:rgba(0,229,192,.06); color:var(--teal);   border-color:rgba(0,229,192,.2); }
.dc-dispo-btn.admit     { background:rgba(255,107,107,.06); color:var(--coral);  border-color:rgba(255,107,107,.2); }
.dc-dispo-btn.obs       { background:rgba(245,200,66,.06); color:var(--gold);   border-color:rgba(245,200,66,.2); }
.dc-dispo-btn.transfer  { background:rgba(155,109,255,.06);color:var(--purple); border-color:rgba(155,109,255,.2); }
.dc-dispo-btn.sel.discharge { background:rgba(0,229,192,.16); border-color:var(--teal);   box-shadow:0 0 18px rgba(0,229,192,.18); }
.dc-dispo-btn.sel.admit     { background:rgba(255,107,107,.16); border-color:var(--coral);  box-shadow:0 0 18px rgba(255,107,107,.18); }
.dc-dispo-btn.sel.obs       { background:rgba(245,200,66,.16); border-color:var(--gold);   box-shadow:0 0 18px rgba(245,200,66,.18); }
.dc-dispo-btn.sel.transfer  { background:rgba(155,109,255,.16);border-color:var(--purple); box-shadow:0 0 18px rgba(155,109,255,.18); }

/* ── PRECAUTIONS / INSTRUCTION CHIPS ── */
.dc-chip-grid { display:flex; gap:6px; flex-wrap:wrap; margin-top:4px; }
.dc-chip {
  font-size:11px; font-family:'DM Sans',sans-serif; padding:4px 11px; border-radius:6px;
  cursor:pointer; user-select:none; transition:all .12s;
  background:rgba(14,37,68,.5); border:1px solid var(--bd); color:var(--t3);
}
.dc-chip.sel { background:rgba(0,229,192,.12); border-color:rgba(0,229,192,.45); color:var(--teal); }
.dc-chip:hover { border-color:var(--bhi); color:var(--t2); }

/* ── CHECKLIST ── */
.dc-check-item { display:flex; align-items:flex-start; gap:10px; padding:9px 0; border-bottom:1px solid rgba(26,53,85,.3); }
.dc-check-item:last-child { border-bottom:none; }
.dc-check-box { width:18px; height:18px; border-radius:4px; border:1px solid var(--bd); background:var(--up); flex-shrink:0; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all .15s; margin-top:1px; }
.dc-check-box.done { background:var(--teal); border-color:var(--teal); }
.dc-check-box.warn { border-color:var(--coral); background:rgba(255,107,107,.1); }
.dc-check-lbl { font-family:'DM Sans',sans-serif; font-size:12px; color:var(--t2); line-height:1.4; flex:1; }
.dc-check-badge { font-family:'JetBrains Mono',monospace; font-size:8px; font-weight:700; padding:2px 6px; border-radius:3px; flex-shrink:0; }
.dc-check-note  { font-size:10px; color:var(--t4); margin-top:2px; }

/* ── ERX ROW ── */
.dc-rx-row { display:flex; align-items:center; gap:8px; padding:8px 0; border-bottom:1px solid rgba(26,53,85,.25); }
.dc-rx-row:last-child { border-bottom:none; }
.dc-rx-drug { font-family:'DM Sans',sans-serif; font-size:12px; color:var(--t); flex:1; }
.dc-rx-sig   { font-family:'JetBrains Mono',monospace; font-size:10px; color:var(--t3); }
.dc-rx-del   { width:22px; height:22px; border-radius:4px; border:1px solid var(--bd); background:none; color:var(--t4); font-size:11px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .15s; flex-shrink:0; }
.dc-rx-del:hover { border-color:rgba(255,107,107,.5); color:var(--coral); }

/* ── ADMIT/TRANSFER FIELDS ── */
.dc-service-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }

/* ── SIDEBAR CARDS ── */
.dc-ready-badge { font-family:'JetBrains Mono',monospace; font-size:11px; font-weight:700; padding:8px 14px; border-radius:8px; text-align:center; margin-bottom:10px; }
.dc-progress { height:6px; background:rgba(26,53,85,.6); border-radius:3px; overflow:hidden; margin-bottom:8px; }
.dc-progress-fill { height:100%; border-radius:3px; transition:width .4s ease; }
.dc-sidebar-row { display:flex; align-items:center; gap:8px; padding:5px 0; font-size:11px; }
.dc-sidebar-row .icon { font-size:13px; flex-shrink:0; }
.dc-sidebar-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }

/* ── AI GEN BUTTON ── */
.dc-ai-btn { display:inline-flex; align-items:center; gap:5px; padding:4px 11px; border-radius:6px; font-family:'DM Sans',sans-serif; font-size:11px; font-weight:600; cursor:pointer; transition:all .15s; background:rgba(155,109,255,.1); color:var(--purple); border:1px solid rgba(155,109,255,.3); }
.dc-ai-btn:hover { background:rgba(155,109,255,.2); }
.dc-ai-btn:disabled { opacity:.4; cursor:not-allowed; }

/* ── SIGN BLOCK ── */
.dc-sign-block { background:rgba(0,229,192,.04); border:1px solid rgba(0,229,192,.2); border-radius:12px; padding:18px; }
.dc-sign-attest { font-family:'DM Sans',sans-serif; font-size:12px; color:var(--t3); line-height:1.65; margin-bottom:14px; }
.dc-sign-row { display:flex; align-items:center; gap:12px; flex-wrap:wrap; }

/* ── TOAST ── */
.dc-toast { position:fixed; bottom:24px; left:50%; transform:translateX(-50%); background:rgba(8,22,40,.96); border:1px solid rgba(0,229,192,.4); border-radius:10px; padding:10px 20px; font-family:'DM Sans',sans-serif; font-weight:600; font-size:13px; color:var(--teal); z-index:99999; pointer-events:none; animation:${PREFIX}fade .2s ease both; }
.dc-toast.err { border-color:rgba(255,107,107,.4); color:var(--coral); }
`;
  document.head.appendChild(s);
})();

// ── Tokens ──────────────────────────────────────────────────────────────
const T = {
  bg:"#050f1e", panel:"rgba(8,22,40,0.78)", up:"rgba(14,37,68,0.50)",
  t:"#f2f7ff", t2:"#b8d4f0", t3:"#82aece", t4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", red:"#ff4444", coral:"#ff6b6b",
  green:"#3dffa0", blue:"#3b9eff", purple:"#9b6dff", orange:"#ff9f43",
};

// ── Workflow nav ─────────────────────────────────────────────────────────
const NAV_GROUPS = [
  { key:"intake",        label:"Intake",        icon:"📋", accent:T.teal,   accentRgb:"0,229,192",
    sections:[
      { id:"chart",  icon:"📊", label:"Patient Chart",   dot:"done"    },
      { id:"demo",   icon:"👤", label:"Demographics",    dot:"done"    },
      { id:"cc",     icon:"💬", label:"Chief Complaint", dot:"done"    },
      { id:"vit",    icon:"📈", label:"Vitals",          dot:"done"    },
      { id:"meds",   icon:"💊", label:"Meds & PMH",      dot:"done"    },
    ]},
  { key:"documentation", label:"Documentation", icon:"🩺", accent:T.blue,   accentRgb:"59,158,255",
    sections:[
      { id:"hpi",     icon:"📝", label:"HPI",              dot:"done",    sc:"5" },
      { id:"ros",     icon:"🔍", label:"Review of Systems", dot:"done",    sc:"6" },
      { id:"pe",      icon:"🩺", label:"Physical Exam",     dot:"done",    sc:"7" },
      { id:"mdm",     icon:"⚖️", label:"MDM",               dot:"done",    sc:"8" },
      { id:"erplan",  icon:"🗺️", label:"ER Plan Builder",   dot:"partial"        },
      { id:"orders",  icon:"📋", label:"Orders",            dot:"done",    sc:"9" },
      { id:"results", icon:"🧪", label:"Results",           dot:"done"           },
    ]},
  { key:"disposition",   label:"Disposition",   icon:"🚪", accent:T.coral,  accentRgb:"255,107,107",
    sections:[
      { id:"discharge", icon:"🚪", label:"Discharge", dot:"partial" },
      { id:"erx",       icon:"💉", label:"eRx",       dot:"empty"   },
    ]},
  { key:"tools",         label:"Tools",         icon:"🔧", accent:T.purple, accentRgb:"155,109,255",
    sections:[
      { id:"autocoder",  icon:"🤖", label:"AutoCoder",  dot:"empty", sc:"0" },
      { id:"procedures", icon:"✂️", label:"Procedures", dot:"empty"         },
      { id:"medref",     icon:"🧬", label:"ED Med Ref",  dot:"empty"         },
    ]},
];

// ── Patient data ─────────────────────────────────────────────────────────
const minsAgo = m => new Date(Date.now() - m * 60000);

const PATIENT_DB = {
  "PT-4821": {
    mrn:"PT-4821", room:"Bay 1", esi:2,
    first:"James", last:"Harrington", age:58, sex:"M", dob:"Mar 15, 1966",
    cc:"Chest pain", arrival:minsAgo(87), provider:"Dr. Skiba",
    allergies:["Penicillin"],
    pmh:["HTN","HLD","T2DM","Former smoker (30pk-yr)"],
    meds:["Metoprolol 50mg daily","Atorvastatin 40mg nightly","Metformin 1000mg BID","ASA 81mg daily"],
    vitals:{ hr:98, bp:"154/90", spo2:97 },
    dx:"NSTEMI — Elevated troponin, ACS pattern",
    pendingOrders:["Cardiology consult — pending response","Troponin repeat (3h) — pending"],
    chartStatus:{ hpi:true, ros:true, pe:true, mdm:false, orders:true },
  },
  "PT-4803": {
    mrn:"PT-4803", room:"Bay 3", esi:2,
    first:"Robert", last:"Chen", age:71, sex:"M", dob:"Aug 4, 1953",
    cc:"SOB / pulmonary edema", arrival:minsAgo(145), provider:"Dr. Park",
    allergies:["Contrast dye"],
    pmh:["CHF (EF 30%)","AFib","CKD Stage 3","HTN"],
    meds:["Furosemide 40mg daily","Carvedilol 12.5mg BID","Lisinopril 10mg daily","Apixaban 5mg BID"],
    vitals:{ hr:116, bp:"178/100", spo2:90 },
    dx:"Acute decompensated heart failure",
    pendingOrders:["Cardiology consult — STAT","Echo — urgent"],
    chartStatus:{ hpi:true, ros:true, pe:true, mdm:true, orders:true },
  },
};

const DEFAULT_MRN = "PT-4821";

const ESI_CFG = {
  1:{ bg:"rgba(255,68,68,.15)",    color:"#ff4444" },
  2:{ bg:"rgba(255,107,107,.12)",  color:"#ff6b6b" },
  3:{ bg:"rgba(245,200,66,.10)",   color:"#f5c842" },
  4:{ bg:"rgba(61,255,160,.08)",   color:"#3dffa0" },
  5:{ bg:"rgba(90,130,168,.10)",   color:"#82aece" },
};

// ── Static data constants ────────────────────────────────────────────────
const RETURN_PRECAUTIONS = [
  "Worsening or new chest pain","Fever >101°F","Shortness of breath",
  "Difficulty breathing","Severe or worsening headache","Dizziness or fainting",
  "Numbness or weakness","New swelling or redness","Inability to tolerate PO",
  "Worsening pain","Falls or confusion","Vomiting blood",
];

const FOLLOW_UP_OPTIONS = [
  "Primary Care Physician (PCP)","Cardiology","Pulmonology","Neurology",
  "Orthopedics","Gastroenterology","Urology","Hematology/Oncology",
  "Urgent Care","ED return PRN","No follow-up needed",
];

const TIMEFRAME_OPTIONS = [
  "24–48 hours","2–3 days","3–5 days","5–7 days",
  "1–2 weeks","2–4 weeks","1–3 months","As scheduled",
];

const ADMIT_SERVICES = [
  "Internal Medicine","Cardiology","Pulmonology","Neurology","Surgery",
  "Orthopedics","Gastroenterology","Urology","Oncology","Psychiatry","ICU","Step-Down",
];

const CARE_LEVELS = ["Floor","Step-Down","ICU","Cardiac ICU","Burn Unit","Neuro ICU"];

const TRANSFER_REASONS = [
  "Higher level of care","Specialist not available","Cath lab capability",
  "Neurosurgery capability","Burn center","Pediatric specialty care","Patient/family preference",
];

// ── Module-scope primitives ──────────────────────────────────────────────
function AmbientBg() {
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }}>
      {[
        { l:"8%",  t:"20%", r:280, c:"rgba(255,107,107,0.04)" },
        { l:"88%", t:"12%", r:240, c:"rgba(245,200,66,0.04)"  },
        { l:"76%", t:"78%", r:300, c:"rgba(0,229,192,0.03)"   },
        { l:"18%", t:"80%", r:200, c:"rgba(59,158,255,0.03)"  },
      ].map((o,i) => (
        <div key={i} style={{
          position:"absolute", left:o.l, top:o.t, width:o.r*2, height:o.r*2, borderRadius:"50%",
          background:`radial-gradient(circle,${o.c} 0%,transparent 68%)`,
          transform:"translate(-50%,-50%)",
          animation:`${PREFIX}orb${i%3} ${8+i*1.3}s ease-in-out infinite`,
        }}/>
      ))}
    </div>
  );
}

function Toast({ msg, type="" }) {
  return (
    <div className={`dc-toast${type ? " "+type : ""}`}>{msg}</div>
  );
}

// ── Checklist item ───────────────────────────────────────────────────────
function CheckItem({ label, done, warn, badge, badgeColor, note, onClick }) {
  return (
    <div className="dc-check-item">
      <div
        className={`dc-check-box${done ? " done" : warn ? " warn" : ""}`}
        onClick={onClick}
        style={{ cursor: onClick ? "pointer" : "default" }}
      >
        {done && <span style={{ color:T.bg, fontSize:11, fontWeight:700 }}>✓</span>}
        {warn && !done && <span style={{ color:T.coral, fontSize:11 }}>!</span>}
      </div>
      <div style={{ flex:1 }}>
        <div className="dc-check-lbl" style={{ color: done ? T.t3 : warn ? T.coral : T.t2,
          textDecoration: done ? "line-through" : "none" }}>
          {label}
        </div>
        {note && <div className="dc-check-note">{note}</div>}
      </div>
      {badge && (
        <span className="dc-check-badge" style={{ background:`${badgeColor}18`, color:badgeColor, border:`1px solid ${badgeColor}35` }}>
          {badge}
        </span>
      )}
    </div>
  );
}

// ── Discharge form ────────────────────────────────────────────────────────
function DischargeForm({ pt, state, dispatch, aiGenerating, onAIGenerate }) {
  return (
    <div className={`${PREFIX}-fade`}>
      {/* Discharge diagnosis */}
      <div className="dc-card">
        <div className="dc-sec-lbl">Discharge Diagnosis<div className="dc-sec-lbl-line"/></div>
        <div className="dc-field">
          <div className="dc-lbl">Primary Diagnosis</div>
          <input className="dc-inp" placeholder="e.g. Chest pain, rule out ACS — low-risk" value={state.dxPrimary}
            onChange={e => dispatch({ type:"SET", key:"dxPrimary", val:e.target.value })}/>
        </div>
        <div className="dc-field">
          <div className="dc-lbl">Secondary Diagnoses (optional)</div>
          <input className="dc-inp" placeholder="e.g. HTN, T2DM" value={state.dxSecondary}
            onChange={e => dispatch({ type:"SET", key:"dxSecondary", val:e.target.value })}/>
        </div>
      </div>

      {/* Discharge instructions */}
      <div className="dc-card">
        <div className="dc-sec-lbl">
          <span>Discharge Instructions</span>
          <div className="dc-sec-lbl-line"/>
          <button className="dc-ai-btn" disabled={!!aiGenerating} onClick={() => onAIGenerate("instructions")}>
            {aiGenerating === "instructions" ? "⟳ Generating…" : "✦ AI Generate"}
          </button>
        </div>
        <textarea className="dc-ta" rows={6} style={{ minHeight:120 }}
          placeholder="Document discharge instructions for the patient…"
          value={state.instructions}
          onChange={e => dispatch({ type:"SET", key:"instructions", val:e.target.value })}/>
      </div>

      {/* Return precautions */}
      <div className="dc-card">
        <div className="dc-sec-lbl">Return Precautions<div className="dc-sec-lbl-line"/></div>
        <div className="dc-chip-grid">
          {RETURN_PRECAUTIONS.map(p => (
            <div key={p} className={`dc-chip${state.precautions.includes(p) ? " sel" : ""}`}
              onClick={() => dispatch({ type:"TOGGLE_PREC", val:p })}>
              {p}
            </div>
          ))}
        </div>
        <div className="dc-field" style={{ marginTop:12 }}>
          <div className="dc-lbl">Additional Return Instructions</div>
          <textarea className="dc-ta" rows={2} style={{ minHeight:60 }}
            placeholder="Any additional return precautions…"
            value={state.precautionsExtra}
            onChange={e => dispatch({ type:"SET", key:"precautionsExtra", val:e.target.value })}/>
        </div>
      </div>

      {/* Follow-up */}
      <div className="dc-card">
        <div className="dc-sec-lbl">Follow-Up<div className="dc-sec-lbl-line"/></div>
        <div className="dc-row">
          <div className="dc-field" style={{ marginBottom:0 }}>
            <div className="dc-lbl">Follow Up With</div>
            <select className="dc-select" value={state.followupWith}
              onChange={e => dispatch({ type:"SET", key:"followupWith", val:e.target.value })}>
              <option value="">— select —</option>
              {FOLLOW_UP_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div className="dc-field" style={{ marginBottom:0 }}>
            <div className="dc-lbl">Timeframe</div>
            <select className="dc-select" value={state.followupTime}
              onChange={e => dispatch({ type:"SET", key:"followupTime", val:e.target.value })}>
              <option value="">— select —</option>
              {TIMEFRAME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="dc-field" style={{ marginTop:12 }}>
          <div className="dc-lbl">Appointment Details (optional)</div>
          <input className="dc-inp" placeholder="e.g. Referral faxed to Dr. Patel, cardiology clinic"
            value={state.followupDetails}
            onChange={e => dispatch({ type:"SET", key:"followupDetails", val:e.target.value })}/>
        </div>
      </div>

      {/* Condition on discharge */}
      <div className="dc-card">
        <div className="dc-sec-lbl">Condition &amp; Disposition Notes<div className="dc-sec-lbl-line"/></div>
        <div className="dc-row">
          <div className="dc-field" style={{ marginBottom:0 }}>
            <div className="dc-lbl">Condition on Discharge</div>
            <select className="dc-select" value={state.condition}
              onChange={e => dispatch({ type:"SET", key:"condition", val:e.target.value })}>
              {["","Stable","Improved","Good","Fair","Guarded"].map(c => <option key={c} value={c}>{c||"— select —"}</option>)}
            </select>
          </div>
          <div className="dc-field" style={{ marginBottom:0 }}>
            <div className="dc-lbl">Mode of Departure</div>
            <select className="dc-select" value={state.departure}
              onChange={e => dispatch({ type:"SET", key:"departure", val:e.target.value })}>
              {["","Ambulatory","Wheelchair","AMA","Eloped","Transferred"].map(d => <option key={d} value={d}>{d||"— select —"}</option>)}
            </select>
          </div>
        </div>
        <div className="dc-field" style={{ marginTop:12 }}>
          <div className="dc-lbl">Additional Notes</div>
          <textarea className="dc-ta" rows={2} style={{ minHeight:60 }}
            placeholder="Attending notes, special circumstances…"
            value={state.dispoNotes}
            onChange={e => dispatch({ type:"SET", key:"dispoNotes", val:e.target.value })}/>
        </div>
      </div>
    </div>
  );
}

// ── Admit form ───────────────────────────────────────────────────────────
function AdmitForm({ state, dispatch, aiGenerating, onAIGenerate }) {
  return (
    <div className={`${PREFIX}-fade`}>
      <div className="dc-card">
        <div className="dc-sec-lbl">Admission Details<div className="dc-sec-lbl-line"/></div>
        <div className="dc-row">
          <div className="dc-field">
            <div className="dc-lbl">Admitting Service</div>
            <select className="dc-select" value={state.admitService}
              onChange={e => dispatch({ type:"SET", key:"admitService", val:e.target.value })}>
              <option value="">— select —</option>
              {ADMIT_SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="dc-field">
            <div className="dc-lbl">Level of Care</div>
            <select className="dc-select" value={state.careLevel}
              onChange={e => dispatch({ type:"SET", key:"careLevel", val:e.target.value })}>
              <option value="">— select —</option>
              {CARE_LEVELS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="dc-row">
          <div className="dc-field">
            <div className="dc-lbl">Admitting Physician</div>
            <input className="dc-inp" placeholder="e.g. Dr. Patel" value={state.admitPhysician}
              onChange={e => dispatch({ type:"SET", key:"admitPhysician", val:e.target.value })}/>
          </div>
          <div className="dc-field">
            <div className="dc-lbl">Bed Assignment (if known)</div>
            <input className="dc-inp" placeholder="e.g. 4W-12" value={state.admitBed}
              onChange={e => dispatch({ type:"SET", key:"admitBed", val:e.target.value })}/>
          </div>
        </div>
        <div className="dc-field">
          <div className="dc-lbl">Admitting Diagnosis</div>
          <input className="dc-inp" placeholder="e.g. NSTEMI — for urgent catheterization" value={state.admitDx}
            onChange={e => dispatch({ type:"SET", key:"admitDx", val:e.target.value })}/>
        </div>
      </div>

      <div className="dc-card">
        <div className="dc-sec-lbl">
          <span>Handoff Note</span>
          <div className="dc-sec-lbl-line"/>
          <button className="dc-ai-btn" disabled={!!aiGenerating} onClick={() => onAIGenerate("handoff")}>
            {aiGenerating === "handoff" ? "⟳ Generating…" : "✦ AI Generate"}
          </button>
        </div>
        <textarea className="dc-ta" rows={6} style={{ minHeight:120 }}
          placeholder="I-PASS handoff to admitting team: illness severity, patient summary, action list, situation awareness, synthesis by receiver…"
          value={state.handoffNote}
          onChange={e => dispatch({ type:"SET", key:"handoffNote", val:e.target.value })}/>
      </div>

      <div className="dc-card">
        <div className="dc-sec-lbl">Communication<div className="dc-sec-lbl-line"/></div>
        <div className="dc-field">
          <div className="dc-lbl">Accepting Physician Spoken With</div>
          <input className="dc-inp" placeholder="Name and time of verbal communication" value={state.acceptingConvo}
            onChange={e => dispatch({ type:"SET", key:"acceptingConvo", val:e.target.value })}/>
        </div>
        <div className="dc-field" style={{ marginBottom:0 }}>
          <div className="dc-lbl">Pending Items for Admitting Team</div>
          <textarea className="dc-ta" rows={3} style={{ minHeight:70 }}
            placeholder="e.g. Troponin repeat pending, cardiology consult placed, echo ordered…"
            value={state.pendingForAdmit}
            onChange={e => dispatch({ type:"SET", key:"pendingForAdmit", val:e.target.value })}/>
        </div>
      </div>
    </div>
  );
}

// ── Observation form ─────────────────────────────────────────────────────
function ObsForm({ state, dispatch }) {
  return (
    <div className={`${PREFIX}-fade`}>
      <div className="dc-card">
        <div className="dc-sec-lbl">Observation Status<div className="dc-sec-lbl-line"/></div>
        <div className="dc-field">
          <div className="dc-lbl">Reason for Observation</div>
          <textarea className="dc-ta" rows={3} style={{ minHeight:70 }}
            placeholder="Clinical rationale for observation vs. inpatient admission…"
            value={state.obsReason}
            onChange={e => dispatch({ type:"SET", key:"obsReason", val:e.target.value })}/>
        </div>
        <div className="dc-row">
          <div className="dc-field" style={{ marginBottom:0 }}>
            <div className="dc-lbl">Expected Duration</div>
            <select className="dc-select" value={state.obsDuration}
              onChange={e => dispatch({ type:"SET", key:"obsDuration", val:e.target.value })}>
              {["","<12 hours","12–24 hours","24–48 hours",">48 hours"].map(d => <option key={d} value={d}>{d||"— select —"}</option>)}
            </select>
          </div>
          <div className="dc-field" style={{ marginBottom:0 }}>
            <div className="dc-lbl">Supervising Service</div>
            <select className="dc-select" value={state.obsService}
              onChange={e => dispatch({ type:"SET", key:"obsService", val:e.target.value })}>
              <option value="">— select —</option>
              {ADMIT_SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>
      <div className="dc-card">
        <div className="dc-sec-lbl">Observation Goals<div className="dc-sec-lbl-line"/></div>
        <div className="dc-field" style={{ marginBottom:0 }}>
          <div className="dc-lbl">What needs to happen for disposition decision?</div>
          <textarea className="dc-ta" rows={4} style={{ minHeight:90 }}
            placeholder="e.g. Repeat troponin at 3h and 6h, cardiology sign-off, ambulation assessment…"
            value={state.obsGoals}
            onChange={e => dispatch({ type:"SET", key:"obsGoals", val:e.target.value })}/>
        </div>
      </div>
    </div>
  );
}

// ── Transfer form ────────────────────────────────────────────────────────
function TransferForm({ state, dispatch, aiGenerating, onAIGenerate }) {
  return (
    <div className={`${PREFIX}-fade`}>
      <div className="dc-card">
        <div className="dc-sec-lbl">Transfer Details<div className="dc-sec-lbl-line"/></div>
        <div className="dc-row">
          <div className="dc-field">
            <div className="dc-lbl">Receiving Facility</div>
            <input className="dc-inp" placeholder="e.g. Regional Medical Center" value={state.transferFacility}
              onChange={e => dispatch({ type:"SET", key:"transferFacility", val:e.target.value })}/>
          </div>
          <div className="dc-field">
            <div className="dc-lbl">Accepting Physician</div>
            <input className="dc-inp" placeholder="Name + time spoken" value={state.transferPhysician}
              onChange={e => dispatch({ type:"SET", key:"transferPhysician", val:e.target.value })}/>
          </div>
        </div>
        <div className="dc-row">
          <div className="dc-field">
            <div className="dc-lbl">Transfer Reason</div>
            <select className="dc-select" value={state.transferReason}
              onChange={e => dispatch({ type:"SET", key:"transferReason", val:e.target.value })}>
              <option value="">— select —</option>
              {TRANSFER_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="dc-field">
            <div className="dc-lbl">Transport Mode</div>
            <select className="dc-select" value={state.transportMode}
              onChange={e => dispatch({ type:"SET", key:"transportMode", val:e.target.value })}>
              {["","ALS Ambulance","BLS Ambulance","Critical Care Transport","Air Transport","Private Vehicle"].map(m => <option key={m} value={m}>{m||"— select —"}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="dc-card">
        <div className="dc-sec-lbl">
          <span>Transfer Summary</span>
          <div className="dc-sec-lbl-line"/>
          <button className="dc-ai-btn" disabled={!!aiGenerating} onClick={() => onAIGenerate("transfer")}>
            {aiGenerating === "transfer" ? "⟳ Generating…" : "✦ AI Generate"}
          </button>
        </div>
        <textarea className="dc-ta" rows={6} style={{ minHeight:120 }}
          placeholder="Transfer summary including reason for transfer, clinical course, interventions, labs, imaging, and pending items…"
          value={state.transferSummary}
          onChange={e => dispatch({ type:"SET", key:"transferSummary", val:e.target.value })}/>
      </div>

      <div className="dc-card">
        <div className="dc-sec-lbl">Transfer Checklist<div className="dc-sec-lbl-line"/></div>
        {["Copy of chart / records sent","Labs and imaging results sent","Medications reconciled","IV access confirmed for transport","Family/guardian notified","Patient consent obtained"].map((item, i) => (
          <CheckItem key={i} label={item}
            done={state.transferChecks?.includes(item)}
            onClick={() => dispatch({ type:"TOGGLE_TRANSFER_CHECK", val:item })}/>
        ))}
      </div>
    </div>
  );
}

// ── eRx form ──────────────────────────────────────────────────────────────
function ErxForm({ state, dispatch }) {
  const [newDrug, setNewDrug] = useState("");
  const [newSig,  setNewSig]  = useState("");
  const [newQty,  setNewQty]  = useState("");

  const addRx = useCallback(() => {
    if (!newDrug.trim()) return;
    dispatch({ type:"ADD_RX", rx:{ drug:newDrug.trim(), sig:newSig.trim(), qty:newQty.trim(), id:Date.now() }});
    setNewDrug(""); setNewSig(""); setNewQty("");
  }, [newDrug, newSig, newQty, dispatch]);

  return (
    <div className={`${PREFIX}-fade`}>
      <div className="dc-card">
        <div className="dc-sec-lbl">Prescriptions<div className="dc-sec-lbl-line"/></div>
        {state.rxList.length > 0 ? (
          <div style={{ marginBottom:12 }}>
            {state.rxList.map(rx => (
              <div key={rx.id} className="dc-rx-row">
                <div>
                  <div className="dc-rx-drug">{rx.drug}</div>
                  {rx.sig && <div className="dc-rx-sig">{rx.sig}{rx.qty ? ` · Qty: ${rx.qty}` : ""}</div>}
                </div>
                <button className="dc-rx-del" onClick={() => dispatch({ type:"REMOVE_RX", id:rx.id })}>✕</button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontFamily:"DM Sans", fontSize:12, color:T.t4, padding:"8px 0 12px", fontStyle:"italic" }}>
            No prescriptions added yet
          </div>
        )}
        <div style={{ borderTop:`1px solid rgba(26,53,85,.4)`, paddingTop:12 }}>
          <div className="dc-sec-lbl" style={{ marginBottom:10, fontSize:7 }}>Add Prescription<div className="dc-sec-lbl-line"/></div>
          <div className="dc-field">
            <div className="dc-lbl">Drug Name &amp; Strength</div>
            <input className="dc-inp" placeholder="e.g. Metoprolol succinate 50mg" value={newDrug}
              onChange={e => setNewDrug(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") addRx(); }}/>
          </div>
          <div className="dc-row">
            <div className="dc-field" style={{ marginBottom:0 }}>
              <div className="dc-lbl">Sig / Instructions</div>
              <input className="dc-inp" placeholder="e.g. Take 1 tablet by mouth daily" value={newSig}
                onChange={e => setNewSig(e.target.value)}/>
            </div>
            <div className="dc-field" style={{ marginBottom:0 }}>
              <div className="dc-lbl">Quantity</div>
              <input className="dc-inp" placeholder="e.g. #30 / 90-day supply" value={newQty}
                onChange={e => setNewQty(e.target.value)}/>
            </div>
          </div>
          <div style={{ marginTop:10 }}>
            <button className="nv3-btn nv3-btn-teal" onClick={addRx} disabled={!newDrug.trim()}>+ Add Prescription</button>
          </div>
        </div>
      </div>

      <div className="dc-card">
        <div className="dc-sec-lbl">Medication Reconciliation<div className="dc-sec-lbl-line"/></div>
        <div className="dc-field" style={{ marginBottom:0 }}>
          <div className="dc-lbl">Changes to Home Medications</div>
          <textarea className="dc-ta" rows={3} style={{ minHeight:70 }}
            placeholder="Document any changes to home medications, new starts, or stops…"
            value={state.medReconciliation}
            onChange={e => dispatch({ type:"SET", key:"medReconciliation", val:e.target.value })}/>
        </div>
      </div>

      <div className="dc-card">
        <div className="dc-sec-lbl">PDMP Attestation<div className="dc-sec-lbl-line"/></div>
        <div style={{ fontFamily:"DM Sans", fontSize:12, color:T.t3, lineHeight:1.6, marginBottom:12 }}>
          Controlled substance prescriptions require PDMP review attestation prior to prescribing.
        </div>
        <div className="dc-field" style={{ marginBottom:0 }}>
          {["No controlled substances prescribed","PDMP reviewed — no concerning history","PDMP reviewed — discussed with patient","DEA number verified"].map((item,i) => (
            <CheckItem key={i} label={item}
              done={state.pdmpChecks?.includes(item)}
              onClick={() => dispatch({ type:"TOGGLE_PDMP", val:item })}/>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── State reducer ────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    case "SET":             return { ...state, [action.key]: action.val };
    case "SET_DISPO":       return { ...state, dispo: action.val };
    case "TOGGLE_PREC":     return { ...state, precautions: state.precautions.includes(action.val) ? state.precautions.filter(x => x !== action.val) : [...state.precautions, action.val] };
    case "TOGGLE_TRANSFER_CHECK": return { ...state, transferChecks: (state.transferChecks||[]).includes(action.val) ? (state.transferChecks||[]).filter(x => x !== action.val) : [...(state.transferChecks||[]), action.val] };
    case "TOGGLE_PDMP":     return { ...state, pdmpChecks: (state.pdmpChecks||[]).includes(action.val) ? (state.pdmpChecks||[]).filter(x => x !== action.val) : [...(state.pdmpChecks||[]), action.val] };
    case "ADD_RX":          return { ...state, rxList: [...state.rxList, action.rx] };
    case "REMOVE_RX":       return { ...state, rxList: state.rxList.filter(r => r.id !== action.id) };
    default:                return state;
  }
}

function initState() {
  return {
    dispo:"", tab:"disposition",
    dxPrimary:"", dxSecondary:"", instructions:"",
    precautions:[], precautionsExtra:"",
    followupWith:"", followupTime:"", followupDetails:"",
    condition:"", departure:"", dispoNotes:"",
    admitService:"", careLevel:"", admitPhysician:"", admitBed:"", admitDx:"", handoffNote:"", acceptingConvo:"", pendingForAdmit:"",
    obsReason:"", obsDuration:"", obsService:"", obsGoals:"",
    transferFacility:"", transferPhysician:"", transferReason:"", transportMode:"", transferSummary:"", transferChecks:[],
    rxList:[], medReconciliation:"", pdmpChecks:[],
    signed:false,
  };
}

// ── Module-scope constants ────────────────────────────────────────────────
const DISPO_OPTS = [
  { key:"discharge", label:"Discharge Home", sub:"Patient returns home",         icon:"🏠", cls:"discharge" },
  { key:"admit",     label:"Admit",           sub:"Inpatient admission",          icon:"🏥", cls:"admit"     },
  { key:"obs",       label:"Observation",     sub:"Short-stay monitoring",        icon:"⏱",  cls:"obs"       },
  { key:"transfer",  label:"Transfer",        sub:"Sending to another facility",  icon:"🚑", cls:"transfer"  },
];

// ── Main export ───────────────────────────────────────────────────────────
export default function DischargeDisposition({ onBack }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mrn = searchParams.get("mrn") || DEFAULT_MRN;
  const pt  = PATIENT_DB[mrn] || PATIENT_DB[DEFAULT_MRN];

  const [form, dispatch] = useReducer(reducer, null, initState);

  // Workflow nav
  const [activeGroup,   setActiveGroup]   = useState("disposition");
  const [activeSection, setActiveSection] = useState("discharge");
  const [navDots]       = useState(() => {
    const m = {};
    NAV_GROUPS.forEach(g => g.sections.forEach(s => { m[s.id] = s.dot; }));
    return m;
  });
  const pillsRef = useRef(null);

  useEffect(() => {
    const row = pillsRef.current;
    if (!row) return;
    const el = row.querySelector(".nv3-pill.active");
    el?.scrollIntoView({ behavior:"smooth", inline:"center", block:"nearest" });
  }, [activeSection, activeGroup]);

  // AI
  const [aiGenerating, setAiGenerating] = useState("");
  const [toast,        setToast]        = useState({ msg:"", type:"" });

  const showToast = useCallback((msg, type="") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg:"", type:"" }), 2400);
  }, []);

  // Ref so handleAIGenerate stays stable across form edits
  const dxPrimaryRef = useRef(form.dxPrimary);
  useEffect(() => { dxPrimaryRef.current = form.dxPrimary; }, [form.dxPrimary]);

  const handleAIGenerate = useCallback(async (kind) => {
    setAiGenerating(kind);
    try {
      const ctx = `Patient: ${pt.first} ${pt.last}, ${pt.age}${pt.sex}. CC: ${pt.cc}. PMH: ${pt.pmh.join(", ")}. Dx: ${dxPrimaryRef.current || pt.dx}. Allergies: ${pt.allergies.join(", ") || "NKDA"}.`;
      const prompts = {
        instructions: `Generate clear, patient-friendly discharge instructions for this patient. Include activity restrictions, diet, wound care if relevant, medication instructions, and when to seek emergency care. 3–5 short paragraphs, plain language.\n\n${ctx}`,
        handoff: `Generate an I-PASS handoff note for admitting team. Include: Illness Severity, Patient Summary (diagnosis, course, key findings, labs, imaging, interventions), Action List (pending items), Situation Awareness (what could go wrong), Synthesis.\n\n${ctx}`,
        transfer: `Generate a concise transfer summary including reason for transfer, clinical course, vital signs, key labs and imaging, interventions performed, medications given, and pending items for receiving facility.\n\n${ctx}`,
      };
      const res = await base44.integrations.Core.InvokeLLM({ prompt: prompts[kind] || "" });
      const text = typeof res === "string" ? res : JSON.stringify(res);
      const keyMap = { instructions:"instructions", handoff:"handoffNote", transfer:"transferSummary" };
      dispatch({ type:"SET", key: keyMap[kind], val: text });
      showToast(`${kind.charAt(0).toUpperCase() + kind.slice(1)} generated.`);
    } catch { showToast("AI generation failed.", "err"); }
    finally { setAiGenerating(""); }
  }, [pt, showToast]); // dxPrimary read via dxPrimaryRef — stable callback

  // Checklist
  const checklist = useMemo(() => [
    { id:"mdm",      label:"MDM documented",               done:pt.chartStatus.mdm,        warn:!pt.chartStatus.mdm,     badge: pt.chartStatus.mdm ? null : "REQUIRED", badgeColor:T.coral },
    { id:"hpi",      label:"HPI documented",               done:pt.chartStatus.hpi,        warn:false },
    { id:"pe",       label:"Physical exam documented",     done:pt.chartStatus.pe,         warn:false },
    { id:"dx",       label:"Discharge diagnosis entered",  done:!!form.dxPrimary,          warn:!form.dxPrimary, badge:!form.dxPrimary?"REQUIRED":null, badgeColor:T.coral },
    { id:"pending",  label:"Pending orders resolved",      done:pt.pendingOrders.length===0,warn:pt.pendingOrders.length>0, badge:pt.pendingOrders.length>0?`${pt.pendingOrders.length} PENDING`:null, badgeColor:T.gold, note:pt.pendingOrders[0] },
    { id:"allergy",  label:"Allergy reconciliation",       done:true,                      warn:false },
    { id:"followup", label:"Follow-up arranged",           done:!!form.followupWith,       warn:false },
    { id:"instruct", label:"Discharge instructions written",done:form.instructions.length>20,warn:false },
    { id:"prec",     label:"Return precautions documented",done:form.precautions.length>0||form.precautionsExtra.length>5, warn:false },
    { id:"med",      label:"Medications reconciled",       done:true,                      warn:false },
  ], [pt, form.dxPrimary, form.followupWith, form.instructions, form.precautions, form.precautionsExtra, form.dispo]);

  const readyCount  = checklist.filter(c => c.done).length;
  const blockers    = checklist.filter(c => c.warn);
  const canSign     = blockers.length === 0 && !!form.dispo;
  const pct         = Math.round((readyCount / checklist.length) * 100);

  // Workflow nav helpers
  const currentGroup    = useMemo(() => NAV_GROUPS.find(g => g.key === activeGroup), [activeGroup]);
  const currentSections = currentGroup?.sections || [];

  const selectGroup = useCallback((gKey) => {
    const grp = NAV_GROUPS.find(g => g.key === gKey);
    if (!grp) return;
    setActiveGroup(gKey);
    if (!grp.sections.find(s => s.id === activeSection)) setActiveSection(grp.sections[0].id);
  }, [activeSection]);

  const selectSection = useCallback((id) => {
    setActiveSection(id);
    const grp = NAV_GROUPS.find(g => g.sections.some(s => s.id === id));
    if (grp) setActiveGroup(grp.key);
  }, []);

  const getGroupBadge = useCallback((gKey) => {
    const grp = NAV_GROUPS.find(g => g.key === gKey);
    if (!grp) return "empty";
    const all = grp.sections.every(s => navDots[s.id] === "done");
    const any = grp.sections.some(s  => ["done","partial"].includes(navDots[s.id]));
    return all ? "done" : any ? "partial" : "empty";
  }, [navDots]);

  const handleNavigate = useCallback((pageId) => {
    const ROUTES = {
      command:"/", tracking:"/TrackingBoard", workspace:"/PatientWorkspace",
      discharge:"/DischargeDisposition", narrative:"/ClinicalNoteStudio",
      resus:"/ResusHub", ecg:"/ECGHub", airway:"/AirwayHub",
      sepsis:"/SepsisHub", shock:"/ShockHub", psych:"/PsychHub",
      antidote:"/AntidoteHub", labs:"/LabsInterpreter",
      erx:"/ERx", knowledge:"/MedGuidelines", calendar:"/Shift", landing:"/",
    };
    const route = ROUTES[pageId];
    if (route) navigate(route);
  }, [navigate]);

  const esiCfg = ESI_CFG[pt.esi] || ESI_CFG[5];

  const handleSign = useCallback(() => {
    if (!canSign) {
      showToast("Resolve all required items before signing.", "err");
      return;
    }
    dispatch({ type:"SET", key:"signed", val:true });
    showToast("Chart signed. Disposition complete.");
  }, [canSign, showToast]);

  return (
    <div className="nv3">
      <AmbientBg/>
      {toast.msg && <Toast msg={toast.msg} type={toast.type}/>}

      {/* Global nav */}
      <GlobalNav
        current={PAGE_ID}
        onNavigate={handleNavigate}
        onBack={onBack || (() => navigate(`/PatientWorkspace?mrn=${pt.mrn}`))}
        hasBack
        alerts={0}
      />

      {/* Patient context bar */}
      <div className="nv3-bar2">
        <span className="nv3-chart-id">{pt.mrn}</span>
        <span className="nv3-pt-name">{pt.last}, {pt.first}</span>
        <span className="nv3-pt-meta">{pt.age}{pt.sex} · {pt.dob}</span>
        <span className="nv3-pt-cc">CC: {pt.cc}</span>
        {pt.allergies.length > 0 && (
          <div className="nv3-allergy">
            <span>⚠️</span>
            <span className="nv3-allergy-lbl">Allergy</span>
            {pt.allergies.map(a => <span key={a} className="nv3-allergy-pill">{a}</span>)}
          </div>
        )}
        <div className="nv3-vdiv"/>
        {[["HR", pt.vitals.hr + "", pt.vitals.hr > 100 || pt.vitals.hr < 50],
          ["BP", pt.vitals.bp, parseInt(pt.vitals.bp) > 160],
          ["SpO₂", pt.vitals.spo2 + "%", pt.vitals.spo2 < 94]
        ].map(([k, v, abn], idx) => (
          <div key={idx} className="nv3-vital">
            <span className="nv3-vl">{k}</span>
            <span className={`nv3-vv${abn ? " abn" : ""}`}>{v}</span>
          </div>
        ))}
        <div className="nv3-vdiv"/>
        <span className="nv3-esi" style={{ background:esiCfg.bg, color:esiCfg.color, border:`1px solid ${esiCfg.color}44` }}>
          ESI {pt.esi}
        </span>
        <div className="nv3-bar2-acts">
          <button className="nv3-btn nv3-btn-ghost" onClick={() => navigate(`/PatientWorkspace?mrn=${pt.mrn}`)}>
            ← Workspace
          </button>
          <button className="nv3-btn nv3-btn-ghost" onClick={() => navigate(`/ClinicalNoteStudio?mrn=${pt.mrn}`)}>
            📄 Note Studio
          </button>
          <button
            className={`nv3-btn${canSign ? " nv3-btn-teal" : " nv3-btn-gold"}`}
            onClick={handleSign}
            disabled={form.signed}
          >
            {form.signed ? "✓ Signed" : canSign ? "✍ Sign & Complete" : `⚠ ${blockers.length} Required`}
          </button>
        </div>
      </div>

      {/* Workflow nav */}
      <div className="nv3-nav">
        <div className="nv3-group-row">
          {NAV_GROUPS.map(g => (
            <button key={g.key}
              className={`nv3-group-tab${activeGroup===g.key?" active":""}`}
              style={{ "--nv3-accent":g.accent } as React.CSSProperties}
              onClick={() => selectGroup(g.key)}>
              <span>{g.icon}</span><span>{g.label}</span>
              <div className={`nv3-group-badge ${getGroupBadge(g.key)}`}/>
            </button>
          ))}
        </div>
        <div className="nv3-pill-row" ref={pillsRef}>
          <div className="nv3-pill-fade-l"/>
          {currentSections.map(s => (
            <button key={s.id}
              className={`nv3-pill${activeSection===s.id?" active":""}`}
              style={activeSection===s.id ? { "--nv3-accent":currentGroup?.accent, "--nv3-accent-rgb":currentGroup?.accentRgb } as React.CSSProperties : {}}
              onClick={() => selectSection(s.id)}>
              <span className="nv3-pill-ico">{s.icon}</span>{s.label}
              <div className={`nv3-pill-dot ${navDots[s.id]||"empty"}`}/>
              {s.sc && <span className="nv3-pill-sc">⌘{s.sc}</span>}
            </button>
          ))}
          <div className="nv3-pill-fade-r"/>
        </div>
      </div>

      {/* Content */}
      <div className="nv3-content-wrap">
        <div className="dc-layout">

          {/* Main column */}
          <div className="dc-main">

            {/* Disposition selector */}
            <div className="dc-card">
              <div className="dc-sec-lbl">Select Disposition<div className="dc-sec-lbl-line"/></div>
              <div className="dc-dispo-grid">
                {DISPO_OPTS.map(d => (
                  <div key={d.key}
                    className={`dc-dispo-btn ${d.cls}${form.dispo===d.key?" sel":""}`}
                    onClick={() => { if (!form.signed) dispatch({ type:"SET_DISPO", val:d.key }); }}>
                    <div className="dc-dispo-icon">{d.icon}</div>
                    <div>{d.label}</div>
                    <div className="dc-dispo-sub">{d.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Context-sensitive forms */}
            {!form.dispo && (
              <div className="dc-card" style={{ textAlign:"center", padding:"32px 24px" }}>
                <div style={{ fontSize:28, marginBottom:10, opacity:.4 }}>🚪</div>
                <div style={{ fontFamily:"DM Sans", fontSize:13, color:T.t4 }}>
                  Select a disposition above to continue
                </div>
              </div>
            )}
            {form.dispo === "discharge" && (
              <DischargeForm pt={pt} state={form} dispatch={dispatch} aiGenerating={aiGenerating} onAIGenerate={handleAIGenerate}/>
            )}
            {form.dispo === "admit" && (
              <AdmitForm state={form} dispatch={dispatch} aiGenerating={aiGenerating} onAIGenerate={handleAIGenerate}/>
            )}
            {form.dispo === "obs" && (
              <ObsForm state={form} dispatch={dispatch}/>
            )}
            {form.dispo === "transfer" && (
              <TransferForm state={form} dispatch={dispatch} aiGenerating={aiGenerating} onAIGenerate={handleAIGenerate}/>
            )}

            {/* eRx — shown for discharge + obs */}
            {(form.dispo === "discharge" || form.dispo === "obs") && (
              <div className="dc-card">
                <div className="dc-sec-lbl">Prescriptions &amp; Medications<div className="dc-sec-lbl-line"/></div>
                <ErxForm state={form} dispatch={dispatch}/>
              </div>
            )}

            {/* Attestation + sign */}
            {form.dispo && (
              <div className="dc-sign-block">
                <div className="dc-sec-lbl" style={{ color:T.teal }}>Physician Attestation<div className="dc-sec-lbl-line"/></div>
                <div className="dc-sign-attest">
                  I personally evaluated this patient, reviewed all available data, and made an independent medical decision regarding diagnosis and treatment.
                  All documentation reflects my own assessment. Notrya is a clinical decision support tool — all clinical decisions remain my responsibility.
                </div>
                <div className="dc-sign-row">
                  <div style={{ flex:1 }}>
                    <div className="dc-lbl" style={{ fontFamily:"JetBrains Mono", fontSize:8, color:T.t4, letterSpacing:1.5, textTransform:"uppercase", marginBottom:4 }}>Attending Physician</div>
                    <div style={{ fontFamily:"Playfair Display", fontSize:16, color:T.t, fontStyle:"italic" }}>
                      {pt.provider}
                    </div>
                  </div>
                  <div>
                    <div className="dc-lbl" style={{ fontFamily:"JetBrains Mono", fontSize:8, color:T.t4, letterSpacing:1.5, textTransform:"uppercase", marginBottom:4 }}>Date / Time</div>
                    <div style={{ fontFamily:"JetBrains Mono", fontSize:12, color:T.t2 }}>
                      {new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})} · {new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}
                    </div>
                  </div>
                  <button
                    className={`nv3-btn${canSign && !form.signed ? " nv3-btn-teal" : form.signed ? " nv3-btn-ghost" : " nv3-btn-coral"}`}
                    style={{ padding:"8px 20px", fontSize:13 }}
                    onClick={handleSign}
                    disabled={form.signed}
                  >
                    {form.signed ? "✓ Chart Signed" : canSign ? "✍ Sign & Complete Encounter" : `⚠ ${blockers.length} item${blockers.length!==1?"s":""} required`}
                  </button>
                </div>
              </div>
            )}

            <div style={{ textAlign:"center", paddingTop:8 }}>
              <span style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.t4, letterSpacing:1.5 }}>
                NOTRYA · DISCHARGE &amp; DISPOSITION · CLINICAL DECISION SUPPORT ONLY
              </span>
            </div>
          </div>

          {/* Sidebar */}
          <div className="dc-sidebar">

            {/* Readiness */}
            <div className="dc-card">
              <div className="dc-sec-lbl">Chart Readiness<div className="dc-sec-lbl-line"/></div>
              <div className={`dc-ready-badge`} style={{
                background: canSign ? "rgba(0,229,192,.12)" : pct > 60 ? "rgba(245,200,66,.1)" : "rgba(255,107,107,.1)",
                color: canSign ? T.teal : pct > 60 ? T.gold : T.coral,
                border: `1px solid ${canSign ? T.teal+"44" : pct > 60 ? T.gold+"44" : T.coral+"44"}`,
              }}>
                {canSign ? "✓ Ready to Sign" : `${pct}% Complete`}
              </div>
              <div className="dc-progress">
                <div className="dc-progress-fill" style={{
                  width:`${pct}%`,
                  background: canSign
                    ? `linear-gradient(90deg,${T.teal},${T.green})`
                    : pct > 60
                    ? `linear-gradient(90deg,${T.gold},${T.orange})`
                    : `linear-gradient(90deg,${T.coral},${T.red})`,
                }}/>
              </div>
              <div style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.t4, marginBottom:10 }}>
                {readyCount} of {checklist.length} items complete
              </div>
              {checklist.map(c => (
                <CheckItem key={c.id} label={c.label} done={c.done} warn={c.warn}
                  badge={c.badge} badgeColor={c.badgeColor} note={c.note}/>
              ))}
            </div>

            {/* Patient summary */}
            <div className="dc-card">
              <div className="dc-sec-lbl">Patient Summary<div className="dc-sec-lbl-line"/></div>
              <div className="dc-sidebar-row">
                <span className="icon">🏥</span>
                <span style={{ fontFamily:"DM Sans", fontSize:11, color:T.t2 }}>{pt.room} · {pt.provider}</span>
              </div>
              <div className="dc-sidebar-row">
                <span className="icon">🩺</span>
                <span style={{ fontFamily:"DM Sans", fontSize:11, color:T.t2 }}>{pt.dx}</span>
              </div>
              {pt.pendingOrders.length > 0 && (
                <div style={{ marginTop:8, background:"rgba(245,200,66,.06)", border:"1px solid rgba(245,200,66,.2)", borderRadius:8, padding:"8px 10px" }}>
                  <div style={{ fontFamily:"JetBrains Mono", fontSize:8, color:T.gold, letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>
                    Pending Items
                  </div>
                  {pt.pendingOrders.map((o,i) => (
                    <div key={i} style={{ fontFamily:"DM Sans", fontSize:11, color:T.t3, marginBottom:3, display:"flex", gap:6, alignItems:"flex-start" }}>
                      <span style={{ color:T.gold, fontSize:9, marginTop:2 }}>▸</span>{o}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Allergies */}
            {pt.allergies.length > 0 && (
              <div className="dc-card" style={{ background:"rgba(255,107,107,.04)", border:"1px solid rgba(255,107,107,.2)" }}>
                <div className="dc-sec-lbl" style={{ color:T.coral }}>⚠ Allergies<div className="dc-sec-lbl-line"/></div>
                {pt.allergies.map(a => (
                  <div key={a} className="dc-sidebar-row">
                    <div className="dc-sidebar-dot" style={{ background:T.coral }}/>
                    <span style={{ fontFamily:"JetBrains Mono", fontSize:11, color:T.coral, fontWeight:600 }}>{a}</span>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}