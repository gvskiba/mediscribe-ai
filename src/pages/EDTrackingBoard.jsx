import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import GlobalNav from "@/pages/GlobalNav";

const PREFIX  = "tb";
const PAGE_ID = "tracking";

(() => {
  const fid = `${PREFIX}-v3-fonts`;
  if (document.getElementById(fid)) return;
  const l = document.createElement("link");
  l.id = fid; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style");
  s.id = `${PREFIX}-v3-css`;
  s.textContent = `
.nv3 * { box-sizing:border-box; }
.nv3 ::-webkit-scrollbar { width:3px; height:3px; }
.nv3 ::-webkit-scrollbar-thumb { background:rgba(42,79,122,.5); border-radius:2px; }

@keyframes ${PREFIX}fade  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
@keyframes ${PREFIX}orb0  { 0%,100%{transform:translate(-50%,-50%) scale(1)}    50%{transform:translate(-50%,-50%) scale(1.10)} }
@keyframes ${PREFIX}orb1  { 0%,100%{transform:translate(-50%,-50%) scale(1.07)} 50%{transform:translate(-50%,-50%) scale(.92)}  }
@keyframes ${PREFIX}orb2  { 0%,100%{transform:translate(-50%,-50%) scale(.95)}  50%{transform:translate(-50%,-50%) scale(1.09)} }
@keyframes ${PREFIX}pulse { 0%,100%{box-shadow:0 0 0 0 rgba(255,68,68,.5)} 50%{box-shadow:0 0 0 6px rgba(255,68,68,0)} }
@keyframes ${PREFIX}tick  { 0%,100%{opacity:1} 50%{opacity:.4} }
.${PREFIX}-fade { animation:${PREFIX}fade .2s ease both; }
.${PREFIX}-shim {
  background:linear-gradient(90deg,#f2f7ff 0%,#fff 20%,#3b9eff 50%,#00e5c0 75%,#f2f7ff 100%);
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

/* ── ED STATUS BAR (replaces patient context bar) ── */
.tb-status-bar {
  height:46px; flex-shrink:0;
  background:var(--panel); border-bottom:1px solid var(--bd);
  display:flex; align-items:center; padding:0 14px; gap:6px; overflow:hidden; z-index:30;
}
.tb-census-tile {
  display:flex; align-items:center; gap:6px;
  padding:4px 11px; border-radius:7px; flex-shrink:0;
  background:var(--up); border:1px solid var(--bd);
}
.tb-census-val { font-family:'JetBrains Mono',monospace; font-size:14px; font-weight:700; line-height:1; }
.tb-census-lbl { font-size:9px; text-transform:uppercase; letter-spacing:.05em; color:var(--t4); }
.tb-bed-strip { display:flex; align-items:center; gap:3px; flex:1; padding:0 8px; overflow:hidden; }
.tb-bed { width:22px; height:22px; border-radius:5px; display:flex; align-items:center; justify-content:center; font-size:8px; font-family:'JetBrains Mono',monospace; font-weight:700; cursor:pointer; transition:all .15s; flex-shrink:0; }
.tb-bed.occupied  { background:rgba(59,158,255,.18); color:var(--blue);   border:1px solid rgba(59,158,255,.35); }
.tb-bed.available { background:rgba(61,255,160,.08); color:var(--green);  border:1px solid rgba(61,255,160,.2); }
.tb-bed.boarding  { background:rgba(255,107,107,.18);color:var(--coral);  border:1px solid rgba(255,107,107,.35); animation:${PREFIX}pulse 2s ease-in-out infinite; }
.tb-bed.dirty     { background:rgba(245,200,66,.08); color:var(--gold);   border:1px solid rgba(245,200,66,.2); }
.tb-vdiv { width:1px; height:22px; background:var(--bd); flex-shrink:0; margin:0 4px; }
.tb-clock { font-family:'JetBrains Mono',monospace; font-size:13px; font-weight:700; color:var(--t2); flex-shrink:0; margin-left:auto; }
.tb-ai-badge { display:flex; align-items:center; gap:4px; background:rgba(0,229,192,.06); border:1px solid rgba(0,229,192,.25); border-radius:6px; padding:3px 9px; font-family:'JetBrains Mono',monospace; font-size:10px; font-weight:600; color:var(--teal); flex-shrink:0; }
.tb-ai-dot { width:6px; height:6px; border-radius:50%; background:var(--teal); animation:${PREFIX}tick 2s ease-in-out infinite; }

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
.nv3-pill-fade-l { left:0; background:linear-gradient(90deg,var(--panel),transparent); }
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

/* ── TRACKING BOARD SPECIFIC ── */
.tb-wrap { max-width:1400px; margin:0 auto; padding:14px 16px 32px; display:flex; flex-direction:column; gap:12px; position:relative; z-index:1; }

/* Toolbar */
.tb-toolbar { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.tb-filter-pill { font-family:'JetBrains Mono',monospace; font-size:9px; font-weight:700; padding:4px 11px; border-radius:20px; cursor:pointer; text-transform:uppercase; letter-spacing:1px; transition:all .12s; }
.tb-sort-btn { font-family:'JetBrains Mono',monospace; font-size:9px; font-weight:700; padding:4px 11px; border-radius:6px; cursor:pointer; text-transform:uppercase; letter-spacing:1px; transition:all .12s; background:var(--up); border:1px solid var(--bd); color:var(--t3); }
.tb-sort-btn.active { color:var(--blue); border-color:rgba(59,158,255,.4); background:rgba(59,158,255,.08); }
.tb-search { background:rgba(14,37,68,.8); border:1px solid rgba(42,79,122,.35); border-radius:20px; padding:5px 13px; outline:none; font-family:'DM Sans',sans-serif; font-size:11px; color:var(--t); width:180px; transition:border-color .12s; }
.tb-search:focus { border-color:rgba(59,158,255,.5); }

/* Patient row */
.tb-row {
  display:grid;
  grid-template-columns: 70px 1fr 1fr 90px 90px 100px 1fr auto;
  align-items:center; gap:10px;
  padding:10px 14px;
  border-radius:10px; cursor:pointer;
  border-left:3px solid transparent;
  transition:all .15s;
  background:rgba(8,22,40,.75);
  border:1px solid rgba(26,53,85,.45);
}
.tb-row:hover { background:rgba(14,37,68,.85); border-color:rgba(59,158,255,.3); }
.tb-row.esi1,.tb-row.esi2 { border-left-color:var(--coral); }
.tb-row.esi3 { border-left-color:var(--gold); }
.tb-row.esi4,.tb-row.esi5 { border-left-color:var(--green); }
.tb-row.critical { animation:${PREFIX}pulse 2s ease-in-out infinite; }

/* Column headers */
.tb-col-hdr { display:grid; grid-template-columns:70px 1fr 1fr 90px 90px 100px 1fr auto; gap:10px; padding:0 14px 6px; }
.tb-hdr-cell { font-family:'JetBrains Mono',monospace; font-size:8px; font-weight:700; color:var(--t4); letter-spacing:1.5px; text-transform:uppercase; cursor:pointer; display:flex; align-items:center; gap:3px; }
.tb-hdr-cell:hover { color:var(--t3); }

/* Cell styles */
.tb-room { font-family:'JetBrains Mono',monospace; font-size:12px; font-weight:700; color:var(--t); }
.tb-name-block { min-width:0; }
.tb-name { font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; color:var(--t); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.tb-meta { font-size:10px; color:var(--t4); white-space:nowrap; }
.tb-cc-block { min-width:0; }
.tb-cc { font-family:'DM Sans',sans-serif; font-size:12px; color:var(--t2); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.tb-cc-sub { font-size:10px; color:var(--t4); }
.tb-esi-badge { width:28px; height:28px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-family:'JetBrains Mono',monospace; font-size:13px; font-weight:700; flex-shrink:0; }
.tb-los { font-family:'JetBrains Mono',monospace; font-size:12px; font-weight:600; }
.tb-los.warn { color:var(--gold); }
.tb-los.over { color:var(--coral); }
.tb-provider { font-size:11px; color:var(--t3); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

/* Status + flags */
.tb-status-col { display:flex; flex-direction:column; gap:4px; }
.tb-status-badge { font-family:'JetBrains Mono',monospace; font-size:8px; font-weight:700; padding:2px 7px; border-radius:4px; white-space:nowrap; display:inline-block; }
.tb-flags { display:flex; gap:3px; flex-wrap:wrap; }
.tb-flag { font-family:'JetBrains Mono',monospace; font-size:7px; font-weight:700; padding:1px 5px; border-radius:3px; white-space:nowrap; letter-spacing:.5px; }

/* Row actions */
.tb-row-acts { display:flex; gap:4px; opacity:0; transition:opacity .15s; }
.tb-row:hover .tb-row-acts { opacity:1; }
.tb-act-btn { width:28px; height:28px; border-radius:6px; border:1px solid var(--bd); background:var(--up); color:var(--t3); font-size:12px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .15s; flex-shrink:0; }
.tb-act-btn:hover { border-color:var(--bhi); color:var(--t2); }
.tb-act-btn.primary { background:var(--teal); color:var(--bg); border-color:var(--teal); font-size:10px; font-family:'DM Sans',sans-serif; font-weight:700; width:auto; padding:0 10px; }

/* Empty state */
.tb-empty { text-align:center; padding:48px 24px; }
.tb-empty-ico { font-size:32px; margin-bottom:12px; opacity:.4; }

/* Btn */
.nv3-btn { padding:4px 11px; border-radius:6px; font-size:11px; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; gap:4px; font-family:'DM Sans',sans-serif; transition:all .15s; white-space:nowrap; border:none; }
.nv3-btn-ghost { background:var(--up); border:1px solid var(--bd)!important; color:var(--t2); }
.nv3-btn-ghost:hover { border-color:var(--bhi)!important; color:var(--t); }
.nv3-btn-teal  { background:var(--teal); color:var(--bg); }
.nv3-btn-teal:hover  { filter:brightness(1.1); }
.nv3-btn-coral { background:rgba(255,107,107,.12); color:var(--coral); border:1px solid rgba(255,107,107,.3)!important; }
.nv3-btn-coral:hover { background:rgba(255,107,107,.22); }
`;
  document.head.appendChild(s);
})();

// ── Tokens ────────────────────────────────────────────────────────────
const T = {
  bg:"#050f1e", panel:"rgba(8,22,40,0.78)", up:"rgba(14,37,68,0.50)",
  t:"#f2f7ff", t2:"#b8d4f0", t3:"#82aece", t4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", red:"#ff4444", coral:"#ff6b6b",
  green:"#3dffa0", blue:"#3b9eff", purple:"#9b6dff", orange:"#ff9f43",
};

const glass = {
  backdropFilter:"blur(20px) saturate(180%)", WebkitBackdropFilter:"blur(20px) saturate(180%)",
  background:"rgba(8,22,40,0.78)", border:"1px solid rgba(42,79,122,0.35)", borderRadius:14,
};

// ── Workflow nav ──────────────────────────────────────────────────────
const NAV_GROUPS = [
  { key:"intake",        label:"Intake",        icon:"📋", accent:T.teal,   accentRgb:"0,229,192",
    sections:[
      { id:"chart",  icon:"📊", label:"Patient Chart",   dot:"empty" },
      { id:"demo",   icon:"👤", label:"Demographics",    dot:"empty" },
      { id:"cc",     icon:"💬", label:"Chief Complaint", dot:"empty" },
      { id:"vit",    icon:"📈", label:"Vitals",          dot:"empty" },
      { id:"meds",   icon:"💊", label:"Meds & PMH",      dot:"empty" },
    ]},
  { key:"documentation", label:"Documentation", icon:"🩺", accent:T.blue,   accentRgb:"59,158,255",
    sections:[
      { id:"hpi",    icon:"📝", label:"HPI",              dot:"empty", sc:"5" },
      { id:"ros",    icon:"🔍", label:"Review of Systems", dot:"empty", sc:"6" },
      { id:"pe",     icon:"🩺", label:"Physical Exam",    dot:"empty", sc:"7" },
      { id:"mdm",    icon:"⚖️", label:"MDM",              dot:"empty", sc:"8" },
      { id:"erplan", icon:"🗺️", label:"ER Plan Builder",  dot:"empty"         },
      { id:"orders", icon:"📋", label:"Orders",           dot:"empty", sc:"9" },
      { id:"results",icon:"🧪", label:"Results",          dot:"empty"         },
    ]},
  { key:"disposition",   label:"Disposition",   icon:"🚪", accent:T.coral,  accentRgb:"255,107,107",
    sections:[
      { id:"discharge", icon:"🚪", label:"Discharge", dot:"empty" },
      { id:"erx",       icon:"💉", label:"eRx",       dot:"empty" },
    ]},
  { key:"tools",         label:"Tools",         icon:"🔧", accent:T.purple, accentRgb:"155,109,255",
    sections:[
      { id:"autocoder",  icon:"🤖", label:"AutoCoder",  dot:"empty", sc:"0" },
      { id:"procedures", icon:"✂️", label:"Procedures", dot:"empty"         },
      { id:"medref",     icon:"🧬", label:"ED Med Ref", dot:"empty"         },
    ]},
];

// ── Sample patient data ───────────────────────────────────────────────
const now = Date.now();
const minsAgo = m => new Date(now - m * 60000);

const PATIENTS = [
  { id:"p01", room:"Bay 1",    mrn:"PT-4821", first:"James",   last:"Harrington", age:58, sex:"M", cc:"Chest pain",                  esi:2, arrival:minsAgo(87),  provider:"Dr. Skiba",    status:"workup",   flags:{ labs:true,  imaging:true,  critical:false, consult:false, dispo:false }, vitals:{ hr:"102", bp:"158/94", spo2:"96%" }, allergies:["PCN"] },
  { id:"p02", room:"Trauma 1", mrn:"PT-4822", first:"Maria",   last:"Delgado",    age:34, sex:"F", cc:"MVC — neck pain",             esi:2, arrival:minsAgo(22),  provider:"Dr. Skiba",    status:"triage",   flags:{ labs:true,  imaging:true,  critical:false, consult:false, dispo:false }, vitals:{ hr:"88",  bp:"112/70", spo2:"98%" }, allergies:[] },
  { id:"p03", room:"Bay 3",    mrn:"PT-4803", first:"Robert",  last:"Chen",       age:71, sex:"M", cc:"SOB / pulmonary edema",       esi:2, arrival:minsAgo(145), provider:"Dr. Park",     status:"awaiting", flags:{ labs:false, imaging:false, critical:true,  consult:true,  dispo:false }, vitals:{ hr:"116", bp:"182/104",spo2:"88%" }, allergies:["Contrast"] },
  { id:"p04", room:"Bay 4",    mrn:"PT-4814", first:"Diane",   last:"Moreau",     age:45, sex:"F", cc:"Abdominal pain — RLQ",        esi:3, arrival:minsAgo(198), provider:"Dr. Skiba",    status:"awaiting", flags:{ labs:false, imaging:true,  critical:false, consult:false, dispo:false }, vitals:{ hr:"94",  bp:"128/82", spo2:"99%" }, allergies:[] },
  { id:"p05", room:"Bay 5",    mrn:"PT-4795", first:"Leon",    last:"Okafor",     age:29, sex:"M", cc:"Laceration — hand",           esi:3, arrival:minsAgo(42),  provider:"Dr. Nguyen",   status:"workup",   flags:{ labs:false, imaging:false, critical:false, consult:false, dispo:false }, vitals:{ hr:"78",  bp:"122/74", spo2:"100%"}, allergies:["Iodine"] },
  { id:"p06", room:"Bay 6",    mrn:"PT-4831", first:"Priya",   last:"Nair",       age:52, sex:"F", cc:"Syncope",                     esi:3, arrival:minsAgo(76),  provider:"Dr. Park",     status:"workup",   flags:{ labs:true,  imaging:false, critical:false, consult:false, dispo:false }, vitals:{ hr:"62",  bp:"98/60",  spo2:"97%" }, allergies:[] },
  { id:"p07", room:"Bay 7",    mrn:"PT-4799", first:"Thomas",  last:"Webb",       age:67, sex:"M", cc:"AMS — rule out stroke",       esi:2, arrival:minsAgo(55),  provider:"Dr. Skiba",    status:"workup",   flags:{ labs:true,  imaging:true,  critical:false, consult:true,  dispo:false }, vitals:{ hr:"84",  bp:"196/110",spo2:"94%" }, allergies:["ASA"] },
  { id:"p08", room:"Bay 8",    mrn:"PT-4808", first:"Aaliyah", last:"Johnson",    age:23, sex:"F", cc:"Pelvic pain / r/o ectopic",   esi:2, arrival:minsAgo(31),  provider:"Dr. Nguyen",   status:"triage",   flags:{ labs:true,  imaging:true,  critical:false, consult:false, dispo:false }, vitals:{ hr:"106", bp:"104/68", spo2:"100%"}, allergies:[] },
  { id:"p09", room:"Bay 9",    mrn:"PT-4777", first:"Frank",   last:"Russo",      age:80, sex:"M", cc:"Hip pain — fall",             esi:3, arrival:minsAgo(267), provider:"Dr. Park",     status:"ready",    flags:{ labs:false, imaging:false, critical:false, consult:false, dispo:true  }, vitals:{ hr:"72",  bp:"138/86", spo2:"98%" }, allergies:[] },
  { id:"p10", room:"Bay 10",   mrn:"PT-4834", first:"Sophie",  last:"Klein",      age:6,  sex:"F", cc:"Fever — 39.8°C",              esi:3, arrival:minsAgo(58),  provider:"Dr. Nguyen",   status:"workup",   flags:{ labs:true,  imaging:false, critical:false, consult:false, dispo:false }, vitals:{ hr:"128", bp:"90/60",  spo2:"99%" }, allergies:["Amox"] },
  { id:"p11", room:"Board 1",  mrn:"PT-4762", first:"Gerald",  last:"Murphy",     age:74, sex:"M", cc:"NSTEMI — admitted",           esi:2, arrival:minsAgo(412), provider:"Dr. Skiba",    status:"boarding", flags:{ labs:false, imaging:false, critical:false, consult:false, dispo:true  }, vitals:{ hr:"88",  bp:"148/92", spo2:"95%" }, allergies:["PCN","Heparin"] },
  { id:"p12", room:"Board 2",  mrn:"PT-4771", first:"Connie",  last:"Park",       age:61, sex:"F", cc:"Sepsis — UTI source",         esi:2, arrival:minsAgo(348), provider:"Dr. Park",     status:"boarding", flags:{ labs:false, imaging:false, critical:false, consult:false, dispo:true  }, vitals:{ hr:"104", bp:"88/52",  spo2:"95%" }, allergies:[] },
  { id:"p13", room:"Bay 11",   mrn:"PT-4838", first:"Mia",     last:"Torres",     age:31, sex:"F", cc:"Migraine — 3 days",           esi:4, arrival:minsAgo(94),  provider:"Dr. Nguyen",   status:"ready",    flags:{ labs:false, imaging:false, critical:false, consult:false, dispo:true  }, vitals:{ hr:"68",  bp:"118/74", spo2:"100%"}, allergies:[] },
  { id:"p14", room:"Bay 12",   mrn:"PT-4840", first:"Bernard", last:"Fontaine",   age:49, sex:"M", cc:"Alcohol intoxication",        esi:4, arrival:minsAgo(122), provider:"Dr. Park",     status:"awaiting", flags:{ labs:true,  imaging:false, critical:false, consult:false, dispo:false }, vitals:{ hr:"92",  bp:"134/80", spo2:"98%" }, allergies:[] },
];

const BEDS = [
  ...["Bay 1","Bay 2","Bay 3","Bay 4","Bay 5","Bay 6","Bay 7","Bay 8","Bay 9","Bay 10","Bay 11","Bay 12","Trauma 1","Trauma 2"].map(r => ({ room:r, status: PATIENTS.find(p => p.room===r) ? "occupied" : r.includes("Trauma") ? "available" : Math.random()<.25 ? "dirty" : "available" })),
  ...["Board 1","Board 2","Board 3"].map(r => ({ room:r, status: PATIENTS.find(p => p.room===r) ? "boarding" : "available" })),
];

// ── Helpers ───────────────────────────────────────────────────────────
function losDisplay(arrival) {
  const mins = Math.floor((Date.now() - arrival.getTime()) / 60000);
  const h = Math.floor(mins / 60), m = mins % 60;
  const str = h > 0 ? `${h}h ${m}m` : `${m}m`;
  const cls = mins > 360 ? "over" : mins > 180 ? "warn" : "";
  return { str, cls };
}

const ESI_CFG = {
  1:{ bg:"rgba(255,68,68,.2)",    color:"#ff4444",  bd:"rgba(255,68,68,.5)"    },
  2:{ bg:"rgba(255,107,107,.15)", color:"#ff6b6b",  bd:"rgba(255,107,107,.4)"  },
  3:{ bg:"rgba(245,200,66,.12)",  color:"#f5c842",  bd:"rgba(245,200,66,.35)"  },
  4:{ bg:"rgba(61,255,160,.1)",   color:"#3dffa0",  bd:"rgba(61,255,160,.3)"   },
  5:{ bg:"rgba(90,130,168,.12)",  color:"#82aece",  bd:"rgba(90,130,168,.3)"   },
};

const STATUS_CFG = {
  triage:   { label:"TRIAGE",   bg:"rgba(155,109,255,.12)", color:"#9b6dff", bd:"rgba(155,109,255,.3)" },
  workup:   { label:"WORKUP",   bg:"rgba(59,158,255,.1)",   color:"#3b9eff",  bd:"rgba(59,158,255,.3)"  },
  awaiting: { label:"AWAITING", bg:"rgba(245,200,66,.1)",   color:"#f5c842",  bd:"rgba(245,200,66,.3)"  },
  ready:    { label:"READY ✓",  bg:"rgba(61,255,160,.1)",   color:"#3dffa0",  bd:"rgba(61,255,160,.3)"  },
  boarding: { label:"BOARDING", bg:"rgba(255,107,107,.12)", color:"#ff6b6b",  bd:"rgba(255,107,107,.3)" },
};

const FLAG_CFG = {
  labs:     { label:"LABS",    bg:"rgba(59,158,255,.12)",  color:"#3b9eff"  },
  imaging:  { label:"IMG",     bg:"rgba(155,109,255,.12)", color:"#9b6dff"  },
  critical: { label:"CRIT!",   bg:"rgba(255,68,68,.2)",    color:"#ff4444"  },
  consult:  { label:"CONSULT", bg:"rgba(245,200,66,.12)",  color:"#f5c842"  },
  dispo:    { label:"DISPO ✓", bg:"rgba(61,255,160,.12)",  color:"#3dffa0"  },
};

// ── Module-scope components ───────────────────────────────────────────
function AmbientBg() {
  const orbs = [
    { l:"10%",t:"20%",r:300,c:"rgba(59,158,255,0.04)"   },
    { l:"88%",t:"10%",r:260,c:"rgba(0,229,192,0.04)"    },
    { l:"75%",t:"75%",r:320,c:"rgba(155,109,255,0.03)"  },
    { l:"15%",t:"80%",r:200,c:"rgba(245,200,66,0.03)"   },
  ];
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }}>
      {orbs.map((o,i) => (
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

function PatientRow({ pt, onOpen, onOrders, onNote }) {
  const los = losDisplay(pt.arrival);
  const esiCfg = ESI_CFG[pt.esi] || ESI_CFG[5];
  const stCfg  = STATUS_CFG[pt.status] || STATUS_CFG.workup;
  const activeFlags = Object.entries(pt.flags).filter(([,v]) => v);

  return (
    <div
      className={`tb-row esi${pt.esi}${pt.flags.critical?" critical":""}`}
      style={{ borderLeftColor: esiCfg.color }}
      onClick={() => onOpen(pt)}
    >
      {/* Room */}
      <div>
        <div className="tb-room">{pt.room}</div>
        <div style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.t4, marginTop:1 }}>{pt.mrn}</div>
      </div>

      {/* Name */}
      <div className="tb-name-block">
        <div className="tb-name">{pt.last}, {pt.first}</div>
        <div className="tb-meta">
          {pt.age}{pt.sex} · {pt.allergies.length > 0
            ? <span style={{ color:T.coral }}>⚠ {pt.allergies.join(", ")}</span>
            : "NKDA"}
        </div>
      </div>

      {/* Chief complaint */}
      <div className="tb-cc-block">
        <div className="tb-cc">{pt.cc}</div>
        <div className="tb-cc-sub">{pt.provider}</div>
      </div>

      {/* ESI */}
      <div style={{ display:"flex", justifyContent:"center" }}>
        <div className="tb-esi-badge" style={{ background:esiCfg.bg, color:esiCfg.color, border:`1px solid ${esiCfg.bd}` }}>
          {pt.esi}
        </div>
      </div>

      {/* LOS */}
      <div className={`tb-los ${los.cls}`}>{los.str}</div>

      {/* Vitals snapshot */}
      <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
        {[["HR",pt.vitals.hr,parseInt(pt.vitals.hr)>100||parseInt(pt.vitals.hr)<50],
          ["BP",pt.vitals.bp, parseInt(pt.vitals.bp)>160||parseInt(pt.vitals.bp)<90]].map(([k,v,abn]) => (
          <div key={k} style={{ display:"flex", gap:4, alignItems:"center" }}>
            <span style={{ fontFamily:"JetBrains Mono", fontSize:8, color:T.t4, width:14 }}>{k}</span>
            <span style={{ fontFamily:"JetBrains Mono", fontSize:10, color: abn ? T.coral : T.t2, fontWeight: abn ? 700 : 400 }}>{v}</span>
          </div>
        ))}
      </div>

      {/* Status + flags */}
      <div className="tb-status-col">
        <span className="tb-status-badge" style={{ background:stCfg.bg, color:stCfg.color, border:`1px solid ${stCfg.bd}` }}>
          {stCfg.label}
        </span>
        {activeFlags.length > 0 && (
          <div className="tb-flags">
            {activeFlags.map(([k]) => (
              <span key={k} className="tb-flag" style={{ background:FLAG_CFG[k].bg, color:FLAG_CFG[k].color }}>
                {FLAG_CFG[k].label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="tb-row-acts" onClick={e => e.stopPropagation()}>
        <button className="tb-act-btn" title="Orders" onClick={() => onOrders(pt)}>📋</button>
        <button className="tb-act-btn" title="Note"   onClick={() => onNote(pt)}>📝</button>
        <button className="tb-act-btn primary" onClick={() => onOpen(pt)}>Open →</button>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────
export default function TrackingBoard({ onBack }) {
  const navigate = useNavigate();

  // Workflow nav state
  const [activeGroup,   setActiveGroup]   = useState("intake");
  const [activeSection, setActiveSection] = useState("demo");
  const [navDots]       = useState(() => {
    const m = {};
    NAV_GROUPS.forEach(g => g.sections.forEach(s => { m[s.id] = s.dot; }));
    return m;
  });
  const pillsRef = useRef(null);

  useEffect(() => {
    const row = pillsRef.current;
    if (!row) return;
    const active = row.querySelector(".nv3-pill.active");
    active?.scrollIntoView({ behavior:"smooth", inline:"center", block:"nearest" });
  }, [activeSection, activeGroup]);

  // Clock
  const [clock, setClock] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  });
  useEffect(() => {
    const id = setInterval(() => {
      const d = new Date();
      setClock(`${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`);
    }, 10000);
    return () => clearInterval(id);
  }, []);

  // Board state
  const [statusFilter, setStatusFilter] = useState("All");
  const [provFilter,   setProvFilter]   = useState("All");
  const [esiFilter,    setEsiFilter]    = useState("All");
  const [sortBy,       setSortBy]       = useState("los");
  const [sortDir,      setSortDir]      = useState("desc");
  const [search,       setSearch]       = useState("");

  const providers = useMemo(() => ["All", ...new Set(PATIENTS.map(p => p.provider))], []);

  const filtered = useMemo(() => {
    let pts = [...PATIENTS];
    if (statusFilter !== "All") pts = pts.filter(p => p.status === statusFilter);
    if (esiFilter    !== "All") pts = pts.filter(p => String(p.esi) === esiFilter);
    if (provFilter   !== "All") pts = pts.filter(p => p.provider === provFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      pts = pts.filter(p =>
        p.first.toLowerCase().includes(q) || p.last.toLowerCase().includes(q) ||
        p.room.toLowerCase().includes(q)  || p.cc.toLowerCase().includes(q) ||
        p.mrn.toLowerCase().includes(q)
      );
    }
    pts.sort((a, b) => {
      let av, bv;
      if (sortBy === "los")     { av = a.arrival.getTime(); bv = b.arrival.getTime(); }
      else if (sortBy === "esi"){ av = a.esi; bv = b.esi; }
      else if (sortBy === "room"){ av = a.room; bv = b.room; }
      else if (sortBy === "name"){ av = a.last; bv = b.last; }
      else { return 0; }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ?  1 : -1;
      return 0;
    });
    return pts;
  }, [statusFilter, esiFilter, provFilter, search, sortBy, sortDir]);

  const toggleSort = useCallback((col) => {
    setSortBy(prev => { if (prev === col) { setSortDir(d => d === "asc" ? "desc" : "asc"); return col; } setSortDir("asc"); return col; });
  }, []);

  const census = useMemo(() => ({
    total:     PATIENTS.length,
    triage:    PATIENTS.filter(p => p.status === "triage").length,
    workup:    PATIENTS.filter(p => p.status === "workup").length,
    awaiting:  PATIENTS.filter(p => p.status === "awaiting").length,
    ready:     PATIENTS.filter(p => p.status === "ready").length,
    boarding:  PATIENTS.filter(p => p.status === "boarding").length,
    critical:  PATIENTS.filter(p => p.flags.critical).length,
    available: BEDS.filter(b => b.status === "available").length,
  }), []);

  const handleNavigate = useCallback((pageId) => {
    const ROUTES = {
      command:"/" ,tracking:"/TrackingBoard", workspace:"/NewPatientInput",
      narrative:"/ClinicalNoteStudio", resus:"/ResusHub", ecg:"/ECGHub",
      airway:"/AirwayHub", sepsis:"/SepsisHub", shock:"/ShockHub",
      psych:"/PsychHub", antidote:"/AntidoteHub", labs:"/LabsInterpreter",
      erx:"/ERx", knowledge:"/MedGuidelines", calendar:"/Shift", landing:"/",
    };
    const route = ROUTES[pageId];
    if (route) navigate(route);
  }, [navigate]);

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

  const currentGroup    = useMemo(() => NAV_GROUPS.find(g => g.key === activeGroup), [activeGroup]);
  const currentSections = currentGroup?.sections || [];

  const openPatient  = useCallback((pt) => navigate(`/NewPatientInput?mrn=${pt.mrn}`), [navigate]);
  const openOrders   = useCallback((pt) => navigate(`/NewPatientInput?tab=orders&mrn=${pt.mrn}`), [navigate]);
  const openNote     = useCallback((pt) => navigate(`/ClinicalNoteStudio?mrn=${pt.mrn}`), [navigate]);

  return (
    <div className="nv3">
      <AmbientBg/>

      {/* Global nav */}
      <GlobalNav current={PAGE_ID} onNavigate={handleNavigate} onBack={onBack} hasBack={!!onBack} alerts={census.critical}/>

      {/* ED census status bar */}
      <div className="tb-status-bar">
        {[
          { val:census.total,    lbl:"Total",    color:T.t2     },
          { val:census.triage,   lbl:"Triage",   color:T.purple },
          { val:census.workup,   lbl:"Workup",   color:T.blue   },
          { val:census.awaiting, lbl:"Awaiting",  color:T.gold   },
          { val:census.ready,    lbl:"Ready",     color:T.green  },
          { val:census.boarding, lbl:"Boarding",  color:T.coral  },
        ].map(({ val, lbl, color }) => (
          <div key={lbl} className="tb-census-tile">
            <span className="tb-census-val" style={{ color }}>{val}</span>
            <span className="tb-census-lbl">{lbl}</span>
          </div>
        ))}
        {census.critical > 0 && (
          <div className="tb-census-tile" style={{ borderColor:"rgba(255,68,68,.4)", background:"rgba(255,68,68,.1)" }}>
            <span className="tb-census-val" style={{ color:T.red }}>{census.critical}</span>
            <span className="tb-census-lbl" style={{ color:T.red }}>Critical</span>
          </div>
        )}
        <div className="tb-vdiv"/>
        <div className="tb-bed-strip">
          {BEDS.map(b => (
            <div key={b.room} className={`tb-bed ${b.status}`} title={`${b.room}: ${b.status}`}>
              {b.room.replace("Bay ","").replace("Board ","B").replace("Trauma ","T")}
            </div>
          ))}
        </div>
        <div className="tb-vdiv"/>
        <div className="tb-ai-badge"><div className="tb-ai-dot"/> AI ON</div>
        <div className="tb-clock">{clock}</div>
      </div>

      {/* Workflow nav */}
      <div className="nv3-nav">
        <div className="nv3-group-row">
          {NAV_GROUPS.map(g => (
            <button key={g.key}
              className={`nv3-group-tab${activeGroup===g.key?" active":""}`}
              style={{ "--nv3-accent":g.accent } as React.CSSProperties}
              onClick={() => selectGroup(g.key)}
            >
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
              onClick={() => selectSection(s.id)}
            >
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
        <div className="tb-wrap">

          {/* Toolbar */}
          <div className="tb-toolbar">
            {/* Status filters */}
            {["All","triage","workup","awaiting","ready","boarding"].map(s => {
              const cfg = s === "All" ? null : STATUS_CFG[s];
              return (
                <button key={s} className="tb-filter-pill"
                  onClick={() => setStatusFilter(s)}
                  style={{
                    border:`1px solid ${statusFilter===s ? (cfg?.bd ?? T.teal+"77") : (cfg?.bd ?? T.teal+"28")}`,
                    background: statusFilter===s ? (cfg?.bg ?? `${T.teal}18`) : `rgba(14,37,68,.4)`,
                    color: statusFilter===s ? (cfg?.color ?? T.teal) : T.t4,
                  }}>
                  {s === "All" ? "All Patients" : STATUS_CFG[s].label}
                </button>
              );
            })}
            <div style={{ width:1, height:20, background:"rgba(42,79,122,.4)" }}/>
            {/* ESI filter */}
            {["All","1","2","3","4","5"].map(e => {
              const cfg = e === "All" ? null : ESI_CFG[parseInt(e)];
              return (
                <button key={e} className="tb-filter-pill"
                  onClick={() => setEsiFilter(e)}
                  style={{
                    border:`1px solid ${esiFilter===e ? (cfg?.bd ?? T.t4+"66") : "rgba(42,79,122,.3)"}`,
                    background: esiFilter===e ? (cfg?.bg ?? "rgba(90,130,168,.12)") : "rgba(14,37,68,.4)",
                    color: esiFilter===e ? (cfg?.color ?? T.t3) : T.t4,
                  }}>
                  {e === "All" ? "ESI: All" : `ESI ${e}`}
                </button>
              );
            })}
            <div style={{ width:1, height:20, background:"rgba(42,79,122,.4)" }}/>
            {/* Provider filter */}
            <select value={provFilter} onChange={e => setProvFilter(e.target.value)}
              style={{ background:"rgba(14,37,68,.8)", border:"1px solid rgba(42,79,122,.35)", borderRadius:20, padding:"4px 12px", outline:"none", fontFamily:"JetBrains Mono", fontSize:9, color:T.t3, cursor:"pointer" }}>
              {providers.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            {/* Search */}
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search name, room, CC…" className="tb-search" style={{ marginLeft:"auto" }}/>
            <div style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.t4 }}>
              {filtered.length}/{PATIENTS.length} patients
            </div>
          </div>

          {/* Column headers */}
          <div className="tb-col-hdr">
            {[["room","Room"],["name","Patient"],["cc","Chief Complaint"],["esi","ESI"],["los","LOS ▾"],["","Vitals"],["","Status"],["",""]].map(([col, label]) => (
              <div key={label} className="tb-hdr-cell" onClick={() => col && toggleSort(col)}>
                {label}
                {col && sortBy === col && <span style={{ color:T.blue }}>{sortDir === "asc" ? "↑" : "↓"}</span>}
              </div>
            ))}
          </div>

          {/* Patient rows */}
          {filtered.length === 0 ? (
            <div className="tb-empty">
              <div className="tb-empty-ico">📋</div>
              <div style={{ fontFamily:"DM Sans", fontSize:13, color:T.t4 }}>No patients match the current filters</div>
            </div>
          ) : (
            filtered.map((pt, i) => (
              <div key={pt.id} className={`${PREFIX}-fade`} style={{ animationDelay:`${i * 0.03}s` }}>
                <PatientRow pt={pt} onOpen={openPatient} onOrders={openOrders} onNote={openNote}/>
              </div>
            ))
          )}

          {/* Board footer */}
          <div style={{ textAlign:"center", paddingTop:8 }}>
            <span style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.t4, letterSpacing:1.5 }}>
              NOTRYA · TRACKING BOARD · LIVE ED CENSUS · CLINICAL DECISION SUPPORT ONLY
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}