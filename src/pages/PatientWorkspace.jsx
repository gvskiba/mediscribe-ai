import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import GlobalNav from "@/pages/GlobalNav";
import { base44 } from "@/api/base44Client";

const PREFIX  = "pw";
const PAGE_ID = "workspace";

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
.nv3*{box-sizing:border-box;}
.nv3 ::-webkit-scrollbar{width:3px;height:3px;}
.nv3 ::-webkit-scrollbar-thumb{background:rgba(42,79,122,.5);border-radius:2px;}
@keyframes ${PREFIX}fade {from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@keyframes ${PREFIX}orb0 {0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-50%) scale(1.10)}}
@keyframes ${PREFIX}orb1 {0%,100%{transform:translate(-50%,-50%) scale(1.07)}50%{transform:translate(-50%,-50%) scale(.92)}}
@keyframes ${PREFIX}orb2 {0%,100%{transform:translate(-50%,-50%) scale(.95)}50%{transform:translate(-50%,-50%) scale(1.09)}}
@keyframes ${PREFIX}pulse{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes ${PREFIX}bounce{0%,80%,100%{transform:translateY(0);opacity:.35}40%{transform:translateY(-6px);opacity:1}}
.${PREFIX}-fade{animation:${PREFIX}fade .2s ease both;}
.${PREFIX}-shim{
  background:linear-gradient(90deg,#f2f7ff 0%,#fff 20%,#3b9eff 50%,#9b6dff 75%,#f2f7ff 100%);
  background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
  animation:${PREFIX}shim 6s linear infinite;
}
@keyframes ${PREFIX}shim{0%,100%{background-position:-200% center}50%{background-position:200% center}}

/* ── SHELL ── */
.nv3{
  --bg:#050f1e;--panel:#081628;--card:#0b1e36;--up:#0e2544;
  --bd:#1a3555;--bhi:#2a4f7a;
  --teal:#00e5c0;--gold:#f5c842;--red:#ff4444;--coral:#ff6b6b;
  --green:#3dffa0;--blue:#3b9eff;--purple:#9b6dff;--orange:#ff9f43;
  --t:#f2f7ff;--t2:#b8d4f0;--t3:#82aece;--t4:#5a82a8;
  position:fixed;inset:0;display:flex;flex-direction:column;
  background:var(--bg);font-family:'DM Sans',sans-serif;color:var(--t);overflow:hidden;
}

/* ── PATIENT CONTEXT BAR ── */
.nv3-bar2{height:46px;flex-shrink:0;background:var(--panel);border-bottom:1px solid var(--bd);display:flex;align-items:center;padding:0 14px;gap:8px;overflow:hidden;z-index:30;}
.nv3-chart-id{font-family:'JetBrains Mono',monospace;font-size:10px;background:var(--up);border:1px solid var(--bd);border-radius:20px;padding:2px 9px;color:var(--teal);white-space:nowrap;flex-shrink:0;}
.nv3-pt-name{font-family:'Playfair Display',serif;font-size:15px;font-weight:700;color:var(--t);white-space:nowrap;flex-shrink:0;}
.nv3-pt-meta{font-size:11px;color:var(--t3);white-space:nowrap;flex-shrink:0;}
.nv3-pt-cc{font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600;color:var(--orange);white-space:nowrap;flex-shrink:0;}
.nv3-allergy{display:flex;align-items:center;gap:5px;background:rgba(255,107,107,.07);border:1px solid rgba(255,107,107,.3);border-radius:6px;padding:3px 9px;cursor:pointer;flex-shrink:0;}
.nv3-allergy-lbl{font-size:9px;color:var(--coral);text-transform:uppercase;letter-spacing:.06em;font-weight:600;}
.nv3-allergy-pill{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;background:rgba(255,107,107,.18);color:var(--coral);border-radius:4px;padding:1px 6px;}
.nv3-allergy-none{font-size:10px;color:var(--t3);}
.nv3-vdiv{width:1px;height:18px;background:var(--bd);flex-shrink:0;}
.nv3-vital{display:flex;align-items:center;gap:3px;font-family:'JetBrains Mono',monospace;font-size:10px;white-space:nowrap;flex-shrink:0;}
.nv3-vl{color:var(--t4);font-size:9px;}
.nv3-vv{color:var(--t2);}
.nv3-vv.abn{color:var(--coral);font-weight:700;}
.nv3-esi{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;padding:2px 8px;border-radius:4px;white-space:nowrap;flex-shrink:0;}
.nv3-bar2-acts{margin-left:auto;display:flex;gap:5px;align-items:center;flex-shrink:0;}
.nv3-btn{padding:4px 11px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:4px;font-family:'DM Sans',sans-serif;transition:all .15s;white-space:nowrap;border:none;}
.nv3-btn-ghost{background:var(--up);border:1px solid var(--bd)!important;color:var(--t2);}
.nv3-btn-ghost:hover{border-color:var(--bhi)!important;color:var(--t);}
.nv3-btn-teal{background:var(--teal);color:var(--bg);}
.nv3-btn-teal:hover{filter:brightness(1.1);}
.nv3-btn-coral{background:rgba(255,107,107,.12);color:var(--coral);border:1px solid rgba(255,107,107,.3)!important;}
.nv3-btn-coral:hover{background:rgba(255,107,107,.22);}
.nv3-btn-purple{background:rgba(155,109,255,.12);color:var(--purple);border:1px solid rgba(155,109,255,.3)!important;}
.nv3-btn-purple:hover{background:rgba(155,109,255,.22);}

/* ── WORKFLOW NAV ── */
.nv3-nav{flex-shrink:0;background:var(--panel);border-bottom:1px solid var(--bd);z-index:25;}
.nv3-group-row{height:42px;display:flex;align-items:stretch;padding:0 4px;border-bottom:1px solid rgba(26,53,85,.4);gap:2px;overflow-x:auto;overflow-y:hidden;scrollbar-width:none;}
.nv3-group-row::-webkit-scrollbar{display:none;}
.nv3-group-tab{position:relative;display:flex;align-items:center;gap:7px;padding:0 14px;cursor:pointer;border:none;background:none;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:500;color:var(--t3);border-radius:8px 8px 0 0;transition:all .18s;white-space:nowrap;flex-shrink:0;border:1px solid transparent;border-bottom:none;}
.nv3-group-tab:hover{color:var(--t2);background:rgba(255,255,255,.03);}
.nv3-group-tab.active{color:var(--t);background:rgba(14,37,68,.6);border-color:var(--bd);border-bottom-color:var(--panel);font-weight:600;}
.nv3-group-tab.active::before{content:'';position:absolute;top:-1px;left:12px;right:12px;height:2px;border-radius:0 0 3px 3px;background:var(--nv3-accent,var(--blue));}
.nv3-group-badge{width:7px;height:7px;border-radius:50%;flex-shrink:0;transition:all .2s;}
.nv3-group-badge.empty{background:var(--t4);opacity:.3;}
.nv3-group-badge.partial{background:var(--orange);box-shadow:0 0 4px rgba(255,159,67,.5);}
.nv3-group-badge.done{background:var(--teal);box-shadow:0 0 4px rgba(0,229,192,.5);}
.nv3-pill-row{height:48px;display:flex;align-items:center;padding:0 10px;gap:4px;overflow-x:auto;overflow-y:hidden;scrollbar-width:none;position:relative;}
.nv3-pill-row::-webkit-scrollbar{display:none;}
.nv3-pill-fade-l,.nv3-pill-fade-r{position:absolute;top:0;bottom:0;width:20px;pointer-events:none;z-index:2;}
.nv3-pill-fade-l{left:0;background:linear-gradient(90deg,var(--panel),transparent);}
.nv3-pill-fade-r{right:0;background:linear-gradient(-90deg,var(--panel),transparent);}
.nv3-pill{display:flex;align-items:center;gap:5px;padding:5px 13px;border-radius:20px;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:500;color:var(--t3);background:transparent;border:1px solid transparent;cursor:pointer;transition:all .18s;white-space:nowrap;flex-shrink:0;}
.nv3-pill:hover{color:var(--t2);background:var(--up);border-color:var(--bd);}
.nv3-pill.active{border-color:rgba(var(--nv3-accent-rgb,59,158,255),.38);background:rgba(var(--nv3-accent-rgb,59,158,255),.10);color:var(--nv3-accent,var(--blue));font-weight:600;}
.nv3-pill-ico{font-size:12px;}
.nv3-pill-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0;}
.nv3-pill-dot.done{background:var(--teal);}
.nv3-pill-dot.partial{background:var(--orange);}
.nv3-pill-dot.empty{background:var(--t4);}
.nv3-pill-sc{font-family:'JetBrains Mono',monospace;font-size:8px;color:var(--t4);background:var(--up);border:1px solid var(--bd);border-radius:3px;padding:1px 4px;opacity:0;transition:opacity .12s;}
.nv3-pill:hover .nv3-pill-sc{opacity:1;}

/* ── WORKSPACE LAYOUT ── */
.pw-body{flex:1;display:flex;min-height:0;overflow:hidden;}
.pw-rail{width:248px;flex-shrink:0;background:rgba(8,22,40,.6);border-right:1px solid var(--bd);display:flex;flex-direction:column;overflow-y:auto;}
.pw-rail-sec{padding:12px 12px 0;}
.pw-rail-lbl{font-family:'JetBrains Mono',monospace;font-size:8px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--t4);margin-bottom:8px;}
.pw-rail-div{height:1px;background:var(--bd);margin:10px 12px;}
.pw-center{flex:1;display:flex;flex-direction:column;min-width:0;overflow:hidden;}
.pw-tabs{height:44px;flex-shrink:0;display:flex;align-items:stretch;border-bottom:1px solid var(--bd);background:rgba(8,22,40,.5);padding:0 4px;gap:2px;}
.pw-tab{display:flex;align-items:center;gap:6px;padding:0 16px;cursor:pointer;border:none;background:none;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:500;color:var(--t3);border-bottom:2px solid transparent;transition:all .15s;white-space:nowrap;position:relative;top:1px;}
.pw-tab:hover{color:var(--t2);}
.pw-tab.active{color:var(--blue);border-bottom-color:var(--blue);font-weight:600;}
.pw-tab-content{flex:1;overflow-y:auto;padding:16px 18px 28px;}
.pw-ai{width:296px;flex-shrink:0;border-left:1px solid var(--bd);display:flex;flex-direction:column;background:rgba(5,10,20,.6);transition:width .25s ease,border-color .25s ease;}
.pw-ai.closed{width:0;overflow:hidden;border-left:none;}

/* ── RAIL COMPONENTS ── */
.pw-vital-row{display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid rgba(26,53,85,.3);}
.pw-vital-row:last-child{border-bottom:none;}
.pw-vname{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--t4);width:36px;flex-shrink:0;}
.pw-vval{font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;width:54px;flex-shrink:0;}
.pw-order-row{display:flex;align-items:flex-start;gap:8px;padding:5px 0;border-bottom:1px solid rgba(26,53,85,.25);}
.pw-order-row:last-child{border-bottom:none;}
.pw-order-name{font-family:'DM Sans',sans-serif;font-size:11px;color:var(--t2);flex:1;line-height:1.35;}
.pw-order-st{font-family:'JetBrains Mono',monospace;font-size:8px;font-weight:700;padding:1px 5px;border-radius:3px;white-space:nowrap;flex-shrink:0;margin-top:1px;}
.pw-med-chip{display:inline-flex;align-items:center;gap:4px;background:rgba(59,158,255,.08);border:1px solid rgba(59,158,255,.22);border-radius:5px;padding:3px 7px;font-family:'DM Sans',sans-serif;font-size:10px;color:var(--t2);margin:2px;}
.pw-problem{display:flex;align-items:center;gap:6px;padding:4px 0;font-family:'DM Sans',sans-serif;font-size:11px;color:var(--t2);}
.pw-problem::before{content:'▸';color:var(--t4);font-size:9px;}

/* ── CENTER TAB CONTENT ── */
.pw-sec{margin-bottom:18px;}
.pw-sec-hdr{font-family:'JetBrains Mono',monospace;font-size:8px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--t4);margin-bottom:8px;padding-bottom:5px;border-bottom:1px solid rgba(26,53,85,.4);}
.pw-card{background:rgba(8,22,40,.75);border:1px solid rgba(26,53,85,.45);border-radius:10px;padding:13px 14px;}
.pw-ta{width:100%;background:rgba(14,37,68,.4);border:1px solid var(--bd);border-radius:8px;padding:10px 12px;font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--t);outline:none;resize:none;min-height:90px;line-height:1.7;transition:border-color .15s;}
.pw-ta:focus{border-color:var(--bhi);}
.pw-ta::placeholder{color:var(--t4);font-style:italic;}
.pw-gen-btn{display:inline-flex;align-items:center;gap:5px;padding:4px 11px;border-radius:6px;font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;cursor:pointer;transition:all .15s;background:rgba(155,109,255,.12);color:var(--purple);border:1px solid rgba(155,109,255,.3);}
.pw-gen-btn:hover{background:rgba(155,109,255,.22);}
.pw-gen-btn:disabled{opacity:.4;cursor:not-allowed;}
.pw-result-row{display:grid;grid-template-columns:1fr 80px 100px 60px;gap:8px;align-items:center;padding:6px 0;border-bottom:1px solid rgba(26,53,85,.25);}
.pw-result-row:last-child{border-bottom:none;}
.pw-result-name{font-family:'DM Sans',sans-serif;font-size:12px;color:var(--t2);}
.pw-result-val{font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;color:var(--t);}
.pw-result-val.high{color:var(--coral);}
.pw-result-val.low{color:var(--blue);}
.pw-result-ref{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--t4);}
.pw-result-time{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--t4);text-align:right;}
.pw-flag{font-family:'JetBrains Mono',monospace;font-size:7px;font-weight:700;padding:1px 5px;border-radius:3px;}

/* ── AI PANEL ── */
.pw-ai-hdr{padding:12px 12px 8px;border-bottom:1px solid var(--bd);flex-shrink:0;display:flex;align-items:center;gap:8px;}
.pw-ai-title{font-family:'Playfair Display',serif;font-size:13px;font-weight:700;color:var(--t);flex:1;}
.pw-ai-close{width:24px;height:24px;border-radius:6px;border:1px solid var(--bd);background:var(--up);color:var(--t4);font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;}
.pw-ai-close:hover{border-color:var(--bhi);color:var(--t2);}
.pw-ai-msgs{flex:1;overflow-y:auto;padding:10px;display:flex;flex-direction:column;gap:6px;}
.pw-ai-msg{padding:8px 10px;border-radius:9px;font-size:11px;line-height:1.6;max-width:90%;font-family:'DM Sans',sans-serif;}
.pw-ai-msg.sys{background:rgba(14,37,68,.6);color:var(--t3);border:1px solid rgba(26,53,85,.5);align-self:center;max-width:100%;text-align:center;font-size:10px;font-style:italic;border-radius:6px;}
.pw-ai-msg.user{background:rgba(59,158,255,.12);border:1px solid rgba(59,158,255,.22);color:var(--t);align-self:flex-end;border-radius:9px 9px 3px 9px;}
.pw-ai-msg.bot{background:rgba(155,109,255,.08);border:1px solid rgba(155,109,255,.18);color:var(--t);align-self:flex-start;border-radius:9px 9px 9px 3px;}
.pw-ai-dots{display:flex;gap:4px;padding:8px 10px;align-self:flex-start;align-items:center;}
.pw-ai-dots span{width:5px;height:5px;border-radius:50%;background:var(--purple);animation:${PREFIX}bounce 1.2s ease-in-out infinite;}
.pw-ai-dots span:nth-child(2){animation-delay:.15s;}
.pw-ai-dots span:nth-child(3){animation-delay:.3s;}
.pw-ai-quick{padding:8px 10px;border-top:1px solid var(--bd);display:flex;flex-wrap:wrap;gap:4px;flex-shrink:0;}
.pw-ai-qbtn{padding:3px 9px;border-radius:20px;font-size:10px;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all .15s;background:var(--up);border:1px solid var(--bd);color:var(--t2);}
.pw-ai-qbtn:hover{border-color:rgba(155,109,255,.4);color:var(--purple);background:rgba(155,109,255,.06);}
.pw-ai-qbtn:disabled{opacity:.4;cursor:not-allowed;}
.pw-ai-input{padding:8px 10px 10px;border-top:1px solid var(--bd);display:flex;gap:6px;align-items:flex-end;flex-shrink:0;}
.pw-ai-ta{flex:1;background:var(--up);border:1px solid var(--bd);border-radius:8px;padding:7px 10px;color:var(--t);font-family:'DM Sans',sans-serif;font-size:11px;outline:none;resize:none;min-height:32px;max-height:80px;line-height:1.5;transition:border-color .15s;}
.pw-ai-ta:focus{border-color:var(--purple);}
.pw-ai-ta::placeholder{color:var(--t4);}
.pw-ai-send{width:32px;height:32px;flex-shrink:0;background:linear-gradient(135deg,var(--purple),#7b4dff);border:none;border-radius:8px;color:#fff;font-size:15px;font-weight:700;cursor:pointer;transition:transform .15s;display:flex;align-items:center;justify-content:center;}
.pw-ai-send:hover{transform:scale(1.08);}
.pw-ai-send:disabled{opacity:.4;cursor:not-allowed;transform:none;}

/* ── ACTION BAR ── */
.pw-action-bar{height:52px;flex-shrink:0;background:var(--panel);border-top:1px solid var(--bd);display:flex;align-items:center;padding:0 16px;gap:8px;z-index:20;}
`;
  document.head.appendChild(s);
})();

// ── Tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:"#050f1e", panel:"rgba(8,22,40,0.78)", up:"rgba(14,37,68,0.50)",
  t:"#f2f7ff", t2:"#b8d4f0", t3:"#82aece", t4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", red:"#ff4444", coral:"#ff6b6b",
  green:"#3dffa0", blue:"#3b9eff", purple:"#9b6dff", orange:"#ff9f43",
};

// ── Workflow nav ────────────────────────────────────────────────────────
const NAV_GROUPS = [
  { key:"intake",        label:"Intake",        icon:"📋", accent:T.teal,   accentRgb:"0,229,192",
    sections:[
      { id:"chart",  icon:"📊", label:"Patient Chart",   dot:"done"    },
      { id:"demo",   icon:"👤", label:"Demographics",    dot:"partial" },
      { id:"cc",     icon:"💬", label:"Chief Complaint", dot:"done"    },
      { id:"vit",    icon:"📈", label:"Vitals",          dot:"partial" },
      { id:"meds",   icon:"💊", label:"Meds & PMH",      dot:"partial" },
    ]},
  { key:"documentation", label:"Documentation", icon:"🩺", accent:T.blue,   accentRgb:"59,158,255",
    sections:[
      { id:"hpi",     icon:"📝", label:"HPI",              dot:"partial", sc:"5" },
      { id:"ros",     icon:"🔍", label:"Review of Systems", dot:"empty",   sc:"6" },
      { id:"pe",      icon:"🩺", label:"Physical Exam",     dot:"empty",   sc:"7" },
      { id:"mdm",     icon:"⚖️", label:"MDM",               dot:"empty",   sc:"8" },
      { id:"erplan",  icon:"🗺️", label:"ER Plan Builder",   dot:"empty"          },
      { id:"orders",  icon:"📋", label:"Orders",            dot:"partial", sc:"9" },
      { id:"results", icon:"🧪", label:"Results",           dot:"done"           },
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
      { id:"medref",     icon:"🧬", label:"ED Med Ref",  dot:"empty"         },
    ]},
];

// ── Patient database ────────────────────────────────────────────────────
const now = Date.now();
const minsAgo = m => new Date(now - m * 60000);

const PATIENT_DB = {
  "PT-4821": {
    mrn:"PT-4821", room:"Bay 1", esi:2,
    first:"James", last:"Harrington", age:58, sex:"M", dob:"Mar 15, 1966",
    cc:"Chest pain", arrival:minsAgo(87), provider:"Dr. Skiba",
    allergies:["Penicillin"],
    pmh:["HTN","HLD","T2DM","Former smoker (30pk-yr)"],
    meds:["Metoprolol 50mg daily","Atorvastatin 40mg nightly","Metformin 1000mg BID","ASA 81mg daily"],
    vitals:[
      { time:"08:12", hr:106, bp:"162/96",  spo2:95, temp:98.6, rr:18 },
      { time:"08:32", hr:102, bp:"158/94",  spo2:96, temp:98.6, rr:16 },
      { time:"08:52", hr:98,  bp:"154/90",  spo2:97, temp:98.4, rr:16 },
    ],
    vitalTrend:{ hr:[110,108,106,104,102,98], bp:[168,165,162,160,158,154], spo2:[93,94,95,95,96,97] },
    orders:[
      { name:"Troponin I (high sensitivity)", status:"resulted", time:"08:20" },
      { name:"BMP / CBC / BNP", status:"resulted", time:"08:20" },
      { name:"12-lead ECG", status:"resulted", time:"08:15" },
      { name:"Chest X-ray PA/Lateral", status:"resulted", time:"08:45" },
      { name:"Aspirin 325mg PO", status:"given", time:"08:18" },
      { name:"Nitroglycerin 0.4mg SL", status:"given", time:"08:22" },
      { name:"Cardiology consult", status:"pending", time:"09:10" },
    ],
    results:[
      { name:"Troponin I (hsTnI)", val:"0.038", ref:"<0.026 ng/mL", flag:"high", time:"09:05" },
      { name:"Troponin I repeat (3h)", val:"pending", ref:"<0.026 ng/mL", flag:"", time:"—" },
      { name:"BNP", val:"412", ref:"<100 pg/mL", flag:"high", time:"09:05" },
      { name:"Creatinine", val:"1.3", ref:"0.7–1.2 mg/dL", flag:"high", time:"09:05" },
      { name:"Potassium", val:"4.1", ref:"3.5–5.0 mEq/L", flag:"", time:"09:05" },
      { name:"Sodium", val:"138", ref:"135–145 mEq/L", flag:"", time:"09:05" },
      { name:"Glucose", val:"186", ref:"70–100 mg/dL", flag:"high", time:"09:05" },
      { name:"WBC", val:"11.2", ref:"4.5–11.0 k/μL", flag:"high", time:"09:05" },
      { name:"Hgb", val:"13.8", ref:"13.5–17.5 g/dL", flag:"", time:"09:05" },
    ],
    hpi:"58M with PMH of HTN, HLD, T2DM presenting with substernal chest pressure rated 7/10, onset at rest approximately 2 hours prior to arrival. Pain radiates to the left jaw and left arm. Associated with mild diaphoresis and dyspnea. Denies nausea, vomiting, syncope, or palpitations. Last episode of similar pain was 3 months ago, resolved spontaneously. Patient took his metoprolol this morning. Took one ASA 325mg at home prior to arrival.",
    ros:"(+) Chest pressure, diaphoresis, dyspnea, left arm radiation\n(−) Nausea, vomiting, syncope, palpitations, cough, hemoptysis, fever, abdominal pain, leg swelling",
    pe:"Gen: Alert, oriented x3, mild distress — diaphoretic\nVS: HR 102 BP 158/94 SpO₂ 96% on 2L NC\nCV: RRR, S1/S2 normal, no murmurs/rubs/gallops, JVP not elevated\nLungs: CTA bilaterally, no crackles or wheeze\nAbd: Soft, non-tender, non-distended\nExt: No edema, pulses 2+ bilaterally",
    mdm:"",
  },
  "PT-4803": {
    mrn:"PT-4803", room:"Bay 3", esi:2,
    first:"Robert", last:"Chen", age:71, sex:"M", dob:"Aug 4, 1953",
    cc:"Shortness of breath / pulmonary edema", arrival:minsAgo(145), provider:"Dr. Park",
    allergies:["Contrast dye"],
    pmh:["CHF (EF 30%)","AFib on anticoagulation","CKD Stage 3","HTN"],
    meds:["Furosemide 40mg daily","Carvedilol 12.5mg BID","Lisinopril 10mg daily","Apixaban 5mg BID","Spironolactone 25mg daily"],
    vitals:[
      { time:"07:25", hr:128, bp:"188/110", spo2:86, temp:98.2, rr:28 },
      { time:"07:45", hr:120, bp:"182/104", spo2:88, temp:98.2, rr:24 },
      { time:"08:05", hr:116, bp:"178/100", spo2:90, temp:98.2, rr:22 },
    ],
    vitalTrend:{ hr:[132,130,128,122,120,116], bp:[192,188,186,184,182,178], spo2:[84,85,86,87,88,90] },
    orders:[
      { name:"BNP / Troponin / BMP", status:"resulted", time:"07:35" },
      { name:"CXR portable", status:"resulted", time:"07:40" },
      { name:"Furosemide 80mg IV", status:"given", time:"07:30" },
      { name:"O₂ via BiPAP 10/5 cmH₂O, FiO₂ 40%", status:"given", time:"07:28" },
      { name:"Cardiology consult — STAT", status:"pending", time:"08:30" },
      { name:"Echo — urgent", status:"pending", time:"08:35" },
    ],
    results:[
      { name:"BNP", val:"3,840", ref:"<100 pg/mL", flag:"high", time:"08:15" },
      { name:"Troponin I", val:"0.012", ref:"<0.026 ng/mL", flag:"", time:"08:15" },
      { name:"Creatinine", val:"2.1", ref:"0.7–1.2 mg/dL", flag:"high", time:"08:15" },
      { name:"Potassium", val:"5.4", ref:"3.5–5.0 mEq/L", flag:"high", time:"08:15" },
      { name:"Sodium", val:"132", ref:"135–145 mEq/L", flag:"low",  time:"08:15" },
      { name:"WBC", val:"9.8", ref:"4.5–11.0 k/μL", flag:"", time:"08:15" },
    ],
    hpi:"71M with PMH of CHF (EF 30%), AFib, CKD Stage 3 presenting with acute worsening SOB over 24 hours. Reports 3-pillow orthopnea and inability to lie flat. 4kg weight gain over 3 days. Denies chest pain, fever, productive cough. Missed furosemide dose yesterday. On BiPAP in triage with improved O₂ sats from 84% to 90%.",
    ros:"(+) Dyspnea, orthopnea, PND, leg swelling, weight gain\n(−) Chest pain, fever, productive cough, palpitations",
    pe:"Gen: Elderly male in moderate respiratory distress, tachypneic on BiPAP\nVS: HR 116 (Afib) BP 178/100 SpO₂ 90% on BiPAP\nCV: Irregularly irregular, S3 gallop present, JVP elevated to jaw\nLungs: Diffuse bilateral crackles to mid-zones, dullness at bases\nAbd: Ascites present, mild\nExt: 3+ pitting edema bilateral LE to knees",
    mdm:"",
  },
};

const DEFAULT_MRN = "PT-4821";

// ── ESI config ──────────────────────────────────────────────────────────
const ESI_CFG = {
  1:{ bg:"rgba(255,68,68,.15)",    color:"#ff4444"  },
  2:{ bg:"rgba(255,107,107,.12)",  color:"#ff6b6b"  },
  3:{ bg:"rgba(245,200,66,.10)",   color:"#f5c842"  },
  4:{ bg:"rgba(61,255,160,.08)",   color:"#3dffa0"  },
  5:{ bg:"rgba(90,130,168,.10)",   color:"#82aece"  },
};

const ORDER_STATUS = {
  resulted:{ label:"✓ Resulted",  bg:"rgba(0,229,192,.1)",  color:"#00e5c0" },
  pending: { label:"⏳ Pending",  bg:"rgba(245,200,66,.1)", color:"#f5c842" },
  given:   { label:"✓ Given",     bg:"rgba(61,255,160,.1)", color:"#3dffa0" },
};

// ── LOS helper ──────────────────────────────────────────────────────────
function losStr(arrival) {
  const mins = Math.floor((Date.now() - arrival.getTime()) / 60000);
  const h = Math.floor(mins / 60), m = mins % 60;
  return { str: h > 0 ? `${h}h ${m}m` : `${m}m`, warn: mins > 180, over: mins > 360 };
}

// ── Module-scope primitives ─────────────────────────────────────────────

function AmbientBg() {
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }}>
      {[
        { l:"12%",t:"18%",r:300,c:"rgba(59,158,255,0.045)"   },
        { l:"86%",t:"8%", r:260,c:"rgba(155,109,255,0.045)"  },
        { l:"80%",t:"76%",r:320,c:"rgba(0,229,192,0.035)"    },
        { l:"14%",t:"78%",r:200,c:"rgba(245,200,66,0.030)"   },
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

function Sparkline({ data, color, w=80, h=26 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 6) - 3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const last = pts.split(" ").pop().split(",");
  return (
    <svg width={w} height={h} style={{ overflow:"visible", flexShrink:0 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.8}/>
      <circle cx={last[0]} cy={last[1]} r={2.5} fill={color}/>
    </svg>
  );
}

function Toast({ msg }) {
  return (
    <div style={{
      position:"fixed", bottom:68, left:"50%", transform:"translateX(-50%)",
      background:"rgba(8,22,40,.96)", border:"1px solid rgba(0,229,192,.4)",
      borderRadius:10, padding:"9px 18px",
      fontFamily:"DM Sans", fontWeight:600, fontSize:12, color:T.teal,
      zIndex:99999, pointerEvents:"none",
      animation:`${PREFIX}fade .2s ease both`,
    }}>{msg}</div>
  );
}

// ── Chart tab ───────────────────────────────────────────────────────────
function ChartTab({ pt }) {
  return (
    <div className={`${PREFIX}-fade`}>
      {/* Vitals trend */}
      <div className="pw-sec">
        <div className="pw-sec-hdr">Vitals Trend</div>
        <div className="pw-card">
          {[
            { name:"HR", data:pt.vitalTrend.hr, unit:"bpm", color:T.coral, abnHigh:100, abnLow:50 },
            { name:"BP", data:pt.vitalTrend.bp, unit:"mmHg",color:T.gold,  abnHigh:160, abnLow:90 },
            { name:"SpO₂",data:pt.vitalTrend.spo2,unit:"%",color:T.teal,  abnHigh:999, abnLow:94 },
          ].map((v, vi, arr) => {
            const cur = v.data[v.data.length - 1];
            const abn = cur > v.abnHigh || cur < v.abnLow;
            const isLast = vi === arr.length - 1; // FIX 1: index check instead of invalid CSS pseudo-selector
            return (
              <div key={v.name} style={{ display:"flex", alignItems:"center", gap:10, padding:"6px 0", borderBottom: isLast ? "none" : `1px solid rgba(26,53,85,.3)` }}>
                <span style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.t4, width:32, flexShrink:0 }}>{v.name}</span>
                <span style={{ fontFamily:"JetBrains Mono", fontSize:14, fontWeight:700, color: abn ? T.coral : T.t, width:52, flexShrink:0 }}>
                  {cur}<span style={{ fontSize:8, color:T.t4, marginLeft:2 }}>{v.unit}</span>
                </span>
                <Sparkline data={v.data} color={abn ? T.coral : v.color}/>
                {abn && <span style={{ fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700, padding:"1px 5px", borderRadius:3, background:"rgba(255,107,107,.15)", color:T.coral }}>ABN</span>}
              </div>
            );
          })}
          {/* Vitals history */}
          <div style={{ marginTop:10, overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontFamily:"JetBrains Mono", fontSize:10 }}>
              <thead>
                <tr>
                  {["Time","HR","BP","SpO₂","Temp","RR"].map(h => (
                    <th key={h} style={{ textAlign:"left", color:T.t4, fontWeight:700, padding:"2px 6px", letterSpacing:".05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...pt.vitals].reverse().map((v, i) => (
                  <tr key={i} style={{ borderTop:`1px solid rgba(26,53,85,.3)` }}>
                    <td style={{ padding:"3px 6px", color:T.t4 }}>{v.time}</td>
                    <td style={{ padding:"3px 6px", color: (v.hr>100||v.hr<50) ? T.coral : T.t2 }}>{v.hr}</td>
                    <td style={{ padding:"3px 6px", color: parseInt(v.bp)>160||parseInt(v.bp)<90 ? T.coral : T.t2 }}>{v.bp}</td>
                    <td style={{ padding:"3px 6px", color: v.spo2<94 ? T.coral : T.t2 }}>{v.spo2}%</td>
                    <td style={{ padding:"3px 6px", color:T.t2 }}>{v.temp}°F</td>
                    <td style={{ padding:"3px 6px", color: v.rr>20||v.rr<12 ? T.coral : T.t2 }}>{v.rr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Active orders summary */}
      <div className="pw-sec">
        <div className="pw-sec-hdr">Active Orders ({pt.orders.length})</div>
        <div className="pw-card">
          {pt.orders.map((o, i) => {
            const st = ORDER_STATUS[o.status] || ORDER_STATUS.pending;
            return (
              <div key={i} className="pw-order-row">
                <span className="pw-order-name">{o.name}</span>
                <span className="pw-order-st" style={{ background:st.bg, color:st.color }}>{st.label}</span>
                <span style={{ fontFamily:"JetBrains Mono", fontSize:8, color:T.t4, flexShrink:0, marginLeft:4 }}>{o.time}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* PMH + Meds */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <div className="pw-sec" style={{ marginBottom:0 }}>
          <div className="pw-sec-hdr">Problem List</div>
          <div className="pw-card">
            {pt.pmh.map((p, i) => <div key={i} className="pw-problem">{p}</div>)}
          </div>
        </div>
        <div className="pw-sec" style={{ marginBottom:0 }}>
          <div className="pw-sec-hdr">Home Medications</div>
          <div className="pw-card" style={{ display:"flex", flexWrap:"wrap" }}>
            {pt.meds.map((m, i) => <span key={i} className="pw-med-chip">{m}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Note tab ────────────────────────────────────────────────────────────
function NoteTab({ pt, notes, setNotes, generating, onGenerate }) {
  const sections = [
    { id:"hpi",  label:"History of Present Illness", icon:"📝", placeholder:"Document the HPI narrative…",          init: pt.hpi  },
    { id:"ros",  label:"Review of Systems",           icon:"🔍", placeholder:"Pertinent positives and negatives…",   init: pt.ros  },
    { id:"pe",   label:"Physical Examination",        icon:"🩺", placeholder:"Document physical exam findings…",     init: pt.pe   },
    { id:"mdm",  label:"Assessment & Plan",           icon:"⚖️", placeholder:"Differential diagnosis and plan…",     init: pt.mdm  },
  ];
  return (
    <div className={`${PREFIX}-fade`}>
      {sections.map(sec => (
        <div key={sec.id} className="pw-sec">
          <div className="pw-sec-hdr" style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span>{sec.icon} {sec.label}</span>
            <button className="pw-gen-btn" style={{ marginLeft:"auto" }}
              disabled={!!generating}
              onClick={() => onGenerate(sec.id, sec.label)}>
              {generating === sec.id ? "⟳ Generating…" : "✦ AI Generate"}
            </button>
          </div>
          <textarea
            className="pw-ta"
            style={{ height: sec.id === "hpi" || sec.id === "mdm" ? 120 : 90 }}
            placeholder={sec.placeholder}
            value={notes[sec.id] ?? sec.init}
            onChange={e => setNotes(prev => ({ ...prev, [sec.id]: e.target.value }))}
          />
        </div>
      ))}
    </div>
  );
}

// ── Results tab ─────────────────────────────────────────────────────────
function ResultsTab({ pt }) {
  return (
    <div className={`${PREFIX}-fade`}>
      <div className="pw-sec">
        <div className="pw-sec-hdr">Laboratory Results</div>
        <div className="pw-card">
          <div className="pw-result-row" style={{ borderBottom:`1px solid rgba(26,53,85,.4)`, marginBottom:4 }}>
            {["Test","Result","Reference","Time"].map(h => (
              <div key={h} style={{ fontFamily:"JetBrains Mono", fontSize:8, color:T.t4, fontWeight:700, letterSpacing:1, textTransform:"uppercase" }}>{h}</div>
            ))}
          </div>
          {pt.results.map((r, i) => (
            <div key={i} className="pw-result-row">
              <div className="pw-result-name">{r.name}</div>
              <div className={`pw-result-val ${r.flag}`} style={{ color: r.flag==="high" ? T.coral : r.flag==="low" ? T.blue : r.val==="pending" ? T.t4 : T.t }}>
                {r.val}
                {r.flag && <span className="pw-flag" style={{ marginLeft:4, background: r.flag==="high" ? "rgba(255,107,107,.15)" : "rgba(59,158,255,.15)", color: r.flag==="high" ? T.coral : T.blue }}>{r.flag.toUpperCase()}</span>}
              </div>
              <div className="pw-result-ref">{r.ref}</div>
              <div className="pw-result-time">{r.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Module-scope constants ───────────────────────────────────────────────
const TABS = [
  { id:"chart",   label:"📊 Chart"   },
  { id:"note",    label:"📝 Note"    },
  { id:"results", label:"🧪 Results" },
];

const QUICK_PROMPTS = [
  { label:"Summarize",      prompt:"Summarize this patient's current clinical picture in 3 sentences." },
  { label:"DDx",            prompt:"What are the top 3 differential diagnoses? List brief evidence for each." },
  { label:"What's missing?",prompt:"What critical information is missing from this workup?" },
  { label:"Risk stratify",  prompt:"Risk stratify this patient. What's the safest disposition?" },
];

// ── Main export ──────────────────────────────────────────────────────────
export default function PatientWorkspace({ onBack }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mrn = searchParams.get("mrn") || DEFAULT_MRN;
  const pt  = PATIENT_DB[mrn] || PATIENT_DB[DEFAULT_MRN];

  // Workflow nav
  const [activeGroup,   setActiveGroup]   = useState("documentation");
  const [activeSection, setActiveSection] = useState("hpi");
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

  // Workspace state
  const [tab,       setTab]       = useState("chart");
  const [aiOpen,    setAiOpen]    = useState(true);
  const [aiMsgs,    setAiMsgs]    = useState([{ role:"sys", text:`Workspace loaded — ${pt.first} ${pt.last}, ${pt.age}${pt.sex}, ${pt.cc}. Ask me anything about this patient.` }]);
  const [aiInput,   setAiInput]   = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [notes,     setNotes]     = useState({});
  const [generating,setGenerating]= useState("");
  const [toast,     setToast]     = useState("");

  const msgsRef  = useRef(null);
  const notesRef = useRef(notes); // FIX 3: stable ref so generateSection doesn't re-create on every keystroke
  useEffect(() => { notesRef.current = notes; }, [notes]);

  // FIX 2: minute-tick so LOS display stays current
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  const showToast = useCallback((msg) => {
    setToast(msg); setTimeout(() => setToast(""), 2200);
  }, []);

  useEffect(() => {
    msgsRef.current?.scrollTo({ top:msgsRef.current.scrollHeight, behavior:"smooth" });
  }, [aiMsgs, aiLoading]);

  // FIX 2: compute fresh on every render (tick drives re-renders each minute)
  const los = losStr(pt.arrival); // eslint-disable-line react-hooks/exhaustive-deps
  const esiCfg = ESI_CFG[pt.esi] || ESI_CFG[5];

  // AI send
  const sendAI = useCallback(async (text) => {
    if (!text.trim() || aiLoading) return;
    setAiMsgs(m => [...m, { role:"user", text:text.trim() }]);
    setAiInput(""); setAiLoading(true);
    try {
      const ctx = `Patient: ${pt.first} ${pt.last}, ${pt.age}${pt.sex}. CC: ${pt.cc}. Allergies: ${pt.allergies.join(", ")||"NKDA"}. PMH: ${pt.pmh.join(", ")}.`;
      const res = await base44.integrations.Core.InvokeLLM({
        prompt:`You are Notrya AI, an ED clinical assistant. Be concise and clinically precise.\n\n${ctx}\n\n${text.trim()}`
      });
      const reply = typeof res === "string" ? res : JSON.stringify(res);
      setAiMsgs(m => [...m, { role:"bot", text:reply }]);
    } catch { setAiMsgs(m => [...m, { role:"sys", text:"⚠ AI unavailable — check connection." }]); }
    finally  { setAiLoading(false); }
  }, [aiLoading, pt]);

  // AI generate note section
  const generateSection = useCallback(async (secId, secLabel) => {
    setGenerating(secId);
    const cur = notesRef.current[secId] || pt[secId] || ""; // FIX 3: read from ref, not state
    try {
      const ctx = `Patient: ${pt.first} ${pt.last}, ${pt.age}${pt.sex}. CC: ${pt.cc}. PMH: ${pt.pmh.join(", ")}. Vitals: HR ${pt.vitals[pt.vitals.length-1].hr} BP ${pt.vitals[pt.vitals.length-1].bp} SpO₂ ${pt.vitals[pt.vitals.length-1].spo2}%.`;
      const res = await base44.integrations.Core.InvokeLLM({
        prompt:`Generate ONLY the "${secLabel}" section of an emergency medicine note. Standard EP documentation style. Concise. No preamble.\n\n${ctx}\n\nCurrent content: ${cur||"(empty)"}`
      });
      const text = typeof res === "string" ? res : JSON.stringify(res);
      setNotes(prev => ({ ...prev, [secId]: text }));
      showToast(`${secLabel} generated.`);
    } catch { showToast("AI generation failed."); }
    finally  { setGenerating(""); }
  }, [pt, showToast]); // FIX 3: notes removed — read via notesRef.current

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
      narrative:"/ClinicalNoteStudio", resus:"/ResusHub", ecg:"/ECGHub",
      airway:"/AirwayHub", sepsis:"/SepsisHub", shock:"/ShockHub",
      psych:"/PsychHub", antidote:"/AntidoteHub", labs:"/LabsInterpreter",
      erx:"/ERx", knowledge:"/MedGuidelines", calendar:"/Shift", landing:"/",
    };
    const route = ROUTES[pageId];
    if (route) navigate(route);
  }, [navigate]);

  return (
    <div className="nv3">
      <AmbientBg/>
      {toast && <Toast msg={toast}/>}

      {/* Global nav */}
      <GlobalNav current={PAGE_ID} onNavigate={handleNavigate} onBack={onBack || (() => navigate("/TrackingBoard"))} hasBack alerts={0}/>

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
        {[["HR", pt.vitals[pt.vitals.length-1].hr + "", pt.vitals[pt.vitals.length-1].hr > 100 || pt.vitals[pt.vitals.length-1].hr < 50],
          ["BP", pt.vitals[pt.vitals.length-1].bp, parseInt(pt.vitals[pt.vitals.length-1].bp) > 160],
          ["SpO₂", pt.vitals[pt.vitals.length-1].spo2 + "%", pt.vitals[pt.vitals.length-1].spo2 < 94]
        ].map(([k, v, abn]) => (
          <div key={k} className="nv3-vital">
            <span className="nv3-vl">{k}</span>
            <span className={`nv3-vv${abn ? " abn" : ""}`}>{v}</span>
          </div>
        ))}
        <div className="nv3-vdiv"/>
        <span className="nv3-esi" style={{ background:esiCfg.bg, color:esiCfg.color, border:`1px solid ${esiCfg.color}44` }}>ESI {pt.esi}</span>
        <span style={{ fontFamily:"JetBrains Mono", fontSize:10, color: los.over ? T.coral : los.warn ? T.gold : T.t3, marginLeft:2, flexShrink:0 }}>
          ⏱ {los.str}
        </span>
        <div className="nv3-bar2-acts">
          <button className="nv3-btn nv3-btn-ghost" onClick={() => navigate("/TrackingBoard")}>← Board</button>
          <button className="nv3-btn nv3-btn-ghost" onClick={() => navigate(`/ClinicalNoteStudio?mrn=${pt.mrn}`)}>📄 Note Studio</button>
          <button className="nv3-btn nv3-btn-ghost">📋 New Order</button>
          <button className="nv3-btn nv3-btn-coral">🚪 Discharge</button>
          <button className="nv3-btn nv3-btn-teal">💾 Save Chart</button>
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

      {/* 3-column body */}
      <div className="pw-body">

        {/* Left summary rail */}
        <div className="pw-rail">
          {/* Latest vitals + sparkline */}
          <div className="pw-rail-sec">
            <div className="pw-rail-lbl">Vitals</div>
            {[
              { name:"HR",   val:pt.vitals[pt.vitals.length-1].hr,  unit:"bpm",  data:pt.vitalTrend.hr,   color:T.coral, abn: pt.vitals[pt.vitals.length-1].hr>100||pt.vitals[pt.vitals.length-1].hr<50 },
              { name:"BP",   val:pt.vitals[pt.vitals.length-1].bp,  unit:"",     data:pt.vitalTrend.bp,   color:T.gold,  abn: parseInt(pt.vitals[pt.vitals.length-1].bp)>160 },
              { name:"SpO₂", val:pt.vitals[pt.vitals.length-1].spo2+"%",unit:"",data:pt.vitalTrend.spo2, color:T.teal,  abn: pt.vitals[pt.vitals.length-1].spo2<94 },
            ].map(v => (
              <div key={v.name} className="pw-vital-row">
                <span className="pw-vname">{v.name}</span>
                <span className="pw-vval" style={{ color: v.abn ? T.coral : T.t }}>{v.val}</span>
                <Sparkline data={v.data} color={v.abn ? T.coral : v.color} w={62} h={22}/>
              </div>
            ))}
          </div>
          <div className="pw-rail-div"/>

          {/* Orders */}
          <div className="pw-rail-sec">
            <div className="pw-rail-lbl">Orders ({pt.orders.length})</div>
            {pt.orders.map((o, i) => {
              const st = ORDER_STATUS[o.status] || ORDER_STATUS.pending;
              return (
                <div key={i} className="pw-order-row">
                  <span className="pw-order-name">{o.name}</span>
                  <span className="pw-order-st" style={{ background:st.bg, color:st.color }}>{o.status==="resulted"?"✓":o.status==="given"?"✓":"⏳"}</span>
                </div>
              );
            })}
          </div>
          <div className="pw-rail-div"/>

          {/* Meds */}
          <div className="pw-rail-sec" style={{ paddingBottom:12 }}>
            <div className="pw-rail-lbl">Home Meds</div>
            <div style={{ display:"flex", flexWrap:"wrap" }}>
              {pt.meds.map((m, i) => <span key={i} className="pw-med-chip">{m}</span>)}
            </div>
          </div>
          <div className="pw-rail-div"/>

          {/* Problem list */}
          <div className="pw-rail-sec" style={{ paddingBottom:14 }}>
            <div className="pw-rail-lbl">Problem List</div>
            {pt.pmh.map((p, i) => <div key={i} className="pw-problem">{p}</div>)}
          </div>
        </div>

        {/* Center working area */}
        <div className="pw-center">
          <div className="pw-tabs">
            {TABS.map(t => (
              <button key={t.id} className={`pw-tab${tab===t.id?" active":""}`} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
            <div style={{ flex:1 }}/>
            <button
              className="nv3-btn nv3-btn-purple"
              style={{ margin:"7px 6px", fontSize:10, padding:"3px 10px" }}
              onClick={() => setAiOpen(o => !o)}>
              {aiOpen ? "✕ AI" : "✦ AI"}
            </button>
          </div>
          <div className="pw-tab-content">
            {tab === "chart"   && <ChartTab pt={pt}/>}
            {tab === "note"    && <NoteTab pt={pt} notes={notes} setNotes={setNotes} generating={generating} onGenerate={generateSection}/>}
            {tab === "results" && <ResultsTab pt={pt}/>}
          </div>
        </div>

        {/* Right AI panel */}
        <div className={`pw-ai${aiOpen ? "" : " closed"}`}>
          <div className="pw-ai-hdr">
            <div style={{ width:28, height:28, borderRadius:8, background:`linear-gradient(135deg,${T.purple},#7b4dff)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>✦</div>
            <div className="pw-ai-title">Notrya AI</div>
            <button className="pw-ai-close" onClick={() => setAiOpen(false)}>✕</button>
          </div>
          <div className="pw-ai-msgs" ref={msgsRef}>
            {aiMsgs.map((m, i) => (
              <div key={i} className={`pw-ai-msg ${m.role}`}
                dangerouslySetInnerHTML={{ __html: m.text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/\n/g,"<br>").replace(/\*\*(.*?)\*\*/g,'<strong style="color:#9b6dff">$1</strong>') }}/>
            ))}
            {aiLoading && <div className="pw-ai-dots"><span/><span/><span/></div>}
          </div>
          <div className="pw-ai-quick">
            {QUICK_PROMPTS.map(q => (
              <button key={q.label} className="pw-ai-qbtn" disabled={aiLoading} onClick={() => sendAI(q.prompt)}>
                {q.label}
              </button>
            ))}
          </div>
          <div className="pw-ai-input">
            <textarea className="pw-ai-ta" rows={1}
              placeholder="Ask anything about this patient…"
              value={aiInput}
              onChange={e => setAiInput(e.target.value)}
              onKeyDown={e => { if (e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendAI(aiInput);} }}
              onInput={e => { const t=e.target as HTMLTextAreaElement; t.style.height="auto"; t.style.height=Math.min(t.scrollHeight,80)+"px"; }}
              disabled={aiLoading}
            />
            <button className="pw-ai-send" onClick={() => sendAI(aiInput)} disabled={aiLoading||!aiInput.trim()}>↑</button>
          </div>
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="pw-action-bar">
        <span style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.t4, letterSpacing:1.5 }}>
          {pt.room} · {pt.provider}
        </span>
        <div style={{ flex:1 }}/>
        <button className="nv3-btn nv3-btn-ghost" onClick={() => navigate(`/ClinicalNoteStudio?mrn=${pt.mrn}`)}>
          📄 Full Note Studio
        </button>
        <button className="nv3-btn nv3-btn-ghost">📋 New Order</button>
        <button className="nv3-btn nv3-btn-ghost">📞 Consult</button>
        <button className="nv3-btn nv3-btn-ghost">🔬 Procedures</button>
        <button className="nv3-btn nv3-btn-coral">🚪 Discharge</button>
        <button className="nv3-btn nv3-btn-teal">💾 Save Chart</button>
      </div>
    </div>
  );
}