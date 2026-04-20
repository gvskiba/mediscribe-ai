// WeightDoseHub.jsx — ED weight-based drug dosing calculator
// @/pages/WeightDoseHub.jsx
// 38 drugs · 8 clinical categories · RSI Kit Builder · Drip Rate Calculator · AI verification
// embedded={true} renders inside NPI encounter. Props pass live encounter context.
//
// Props: embedded(bool), onBack(fn), demo({age,sex,weight}), vitals({bp,hr,spo2,rr}),
//        medications([]), allergies([]), cc({text}), showToast(fn), onAdvance(fn)
//
// Constraints: no form, no localStorage, no router, no alert, no direct sonner import.
//   straight quotes only. <1600 lines.

import { useState, useCallback, useMemo } from "react";
import { base44 } from "@/api/base44Client";

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
@keyframes wdh-pulse{0%,100%{opacity:.3;transform:scale(.8);}50%{opacity:1;transform:scale(1.1);}}
@keyframes wdh-rot{to{transform:rotate(360deg);}}
@keyframes wdh-pop{from{opacity:0;transform:translateY(4px);}to{opacity:1;transform:translateY(0);}}
.wdh{display:flex;flex-direction:column;height:100%;overflow:hidden;background:transparent;font-family:'DM Sans',sans-serif;color:#e8f0fe;}
.wdh-ptbar{display:flex;align-items:center;gap:10px;padding:9px 14px;background:rgba(8,22,40,0.88);border-bottom:1px solid rgba(26,53,85,0.6);flex-wrap:wrap;flex-shrink:0;}
.wdh-pt-field{display:flex;flex-direction:column;gap:2px;}
.wdh-pt-lbl{font-family:'JetBrains Mono',monospace;font-size:8px;color:#4a6a8a;text-transform:uppercase;letter-spacing:.8px;}
.wdh-pt-val{font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;color:#e8f0fe;}
.wdh-pt-in{width:58px;background:rgba(5,15,30,.7);border:1px solid rgba(42,79,122,.5);border-radius:5px;color:#e8f0fe;font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;padding:3px 7px;outline:none;text-align:center;}
.wdh-pt-in:focus{border-color:rgba(59,158,255,.5);}
.wdh-allergy-tag{font-size:10px;padding:2px 7px;border-radius:10px;background:rgba(255,107,107,.12);border:1px solid rgba(255,107,107,.3);color:#ff8a8a;font-weight:600;white-space:nowrap;}
.wdh-renal-badge{font-size:10px;padding:2px 7px;border-radius:10px;background:rgba(245,200,66,.1);border:1px solid rgba(245,200,66,.3);color:#f5c842;font-weight:600;}
.wdh-cats{display:flex;gap:5px;padding:10px 14px 0;overflow-x:auto;flex-shrink:0;}
.wdh-cats::-webkit-scrollbar{height:0;}
.wdh-cat-btn{display:flex;align-items:center;gap:5px;padding:5px 13px;border-radius:20px;cursor:pointer;white-space:nowrap;font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;transition:all .13s;border:1px solid transparent;flex-shrink:0;}
.wdh-body{display:grid;grid-template-columns:196px 1fr;flex:1;overflow:hidden;margin-top:10px;border-top:1px solid rgba(26,53,85,.4);}
.wdh-drug-list{overflow-y:auto;padding:8px 6px;border-right:1px solid rgba(26,53,85,.5);}
.wdh-drug-list::-webkit-scrollbar{width:3px;}
.wdh-drug-list::-webkit-scrollbar-thumb{background:#1a3555;border-radius:2px;}
.wdh-search{width:100%;background:rgba(5,15,30,.6);border:1px solid rgba(26,53,85,.5);border-radius:7px;color:#c8dff8;font-family:'DM Sans',sans-serif;font-size:11px;padding:6px 10px;outline:none;margin-bottom:7px;box-sizing:border-box;}
.wdh-search:focus{border-color:rgba(59,158,255,.4);}
.wdh-drug-btn{display:flex;align-items:center;gap:7px;padding:7px 9px;border-radius:7px;cursor:pointer;width:100%;text-align:left;transition:all .12s;margin-bottom:2px;background:none;border:1px solid transparent;}
.wdh-drug-btn:hover{background:rgba(14,37,68,.5);}
.wdh-drug-btn.active{background:rgba(14,37,68,.8);border-color:rgba(42,79,122,.5);}
.wdh-drug-name{font-size:12px;font-weight:500;color:#b8d0f0;flex:1;line-height:1.2;}
.wdh-drug-drip-tag{font-family:'JetBrains Mono',monospace;font-size:8px;padding:1px 5px;border-radius:3px;background:rgba(255,159,67,.1);border:1px solid rgba(255,159,67,.25);color:#ff9f43;}
.wdh-renal-dot{width:5px;height:5px;border-radius:50%;background:#f5c842;flex-shrink:0;}
.wdh-panel{overflow-y:auto;padding:14px 16px;animation:wdh-pop .18s ease;}
.wdh-panel::-webkit-scrollbar{width:4px;}
.wdh-panel::-webkit-scrollbar-thumb{background:#1a3555;border-radius:2px;}
.wdh-drug-hdr{display:flex;align-items:flex-start;gap:10px;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid rgba(26,53,85,.4);}
.wdh-drug-title{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:#e8f0fe;line-height:1.15;}
.wdh-drug-sub{font-size:11px;color:#8aaccc;margin-top:3px;}
.wdh-ind-row{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:10px;}
.wdh-ind-btn{padding:4px 11px;border-radius:20px;cursor:pointer;font-size:10px;font-family:'DM Sans',sans-serif;font-weight:600;transition:all .12s;border:1px solid rgba(26,53,85,.5);background:rgba(8,22,40,.6);color:#8aaccc;}
.wdh-ind-btn.active{color:#e8f0fe;}
.wdh-route-row{display:flex;gap:5px;margin-bottom:14px;}
.wdh-route-btn{padding:4px 12px;border-radius:5px;cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;transition:all .12s;border:1px solid rgba(26,53,85,.5);background:rgba(8,22,40,.6);color:#4a6a8a;}
.wdh-route-btn.active{color:#e8f0fe;background:rgba(14,37,68,.8);border-color:rgba(59,158,255,.3);}
.wdh-result-box{background:rgba(5,15,30,.85);border-radius:10px;padding:16px 18px;margin-bottom:14px;}
.wdh-result-main{display:flex;align-items:baseline;gap:8px;margin-bottom:6px;flex-wrap:wrap;}
.wdh-result-dose{font-family:'JetBrains Mono',monospace;font-size:32px;font-weight:700;line-height:1;}
.wdh-result-unit{font-family:'JetBrains Mono',monospace;font-size:15px;color:#8aaccc;}
.wdh-result-arrow{font-family:'JetBrains Mono',monospace;font-size:13px;color:#2e4a6a;}
.wdh-result-vol{font-family:'JetBrains Mono',monospace;font-size:18px;font-weight:700;color:#00e5c0;}
.wdh-result-vol-unit{font-family:'JetBrains Mono',monospace;font-size:13px;color:#00e5c060;}
.wdh-result-detail{font-family:'JetBrains Mono',monospace;font-size:9px;color:#2e4a6a;margin-top:4px;letter-spacing:.3px;}
.wdh-slider-wrap{margin-bottom:14px;}
.wdh-slider-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:5px;}
.wdh-slider-lbl{font-family:'JetBrains Mono',monospace;font-size:8px;color:#4a6a8a;text-transform:uppercase;letter-spacing:.6px;}
.wdh-slider-val{font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600;color:#3b9eff;}
.wdh-slider{-webkit-appearance:none;appearance:none;width:100%;height:4px;background:rgba(42,79,122,.5);border-radius:2px;outline:none;cursor:pointer;}
.wdh-slider::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:#3b9eff;cursor:pointer;}
.wdh-meta-row{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:10px;}
.wdh-meta-chip{font-size:10px;padding:3px 8px;border-radius:5px;background:rgba(11,30,54,.7);border:1px solid rgba(26,53,85,.5);color:#8aaccc;font-family:'DM Sans',sans-serif;}
.wdh-note{font-size:11px;color:#8aaccc;line-height:1.6;padding:8px 11px;background:rgba(11,30,54,.5);border-radius:7px;border-left:3px solid rgba(59,158,255,.3);margin-bottom:10px;}
.wdh-ci{font-size:11px;color:#ffc07a;padding:3px 0;display:flex;gap:6px;}
.wdh-ci-hdr{font-family:'JetBrains Mono',monospace;font-size:8px;color:#4a6a8a;text-transform:uppercase;letter-spacing:.6px;margin-bottom:4px;}
.wdh-ai-row{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px;}
.wdh-ai-btn{display:inline-flex;align-items:center;gap:5px;background:rgba(0,229,192,.08);border:1px solid rgba(0,229,192,.2);border-radius:5px;color:#00e5c0;font-family:'DM Sans',sans-serif;font-size:10px;font-weight:600;padding:5px 11px;cursor:pointer;transition:background .12s;white-space:nowrap;}
.wdh-ai-btn:hover:not(:disabled){background:rgba(0,229,192,.16);border-color:rgba(0,229,192,.35);}
.wdh-ai-btn:disabled{opacity:.4;cursor:not-allowed;}
.wdh-ai-btn.busy{color:#8aaccc;border-color:rgba(138,172,204,.2);background:rgba(138,172,204,.06);}
.wdh-dot{width:6px;height:6px;border-radius:50%;background:#00e5c0;animation:wdh-pulse 1.2s infinite;}
.wdh-spin{width:10px;height:10px;border:2px solid rgba(0,229,192,.2);border-top-color:#00e5c0;border-radius:50%;animation:wdh-rot .7s linear infinite;flex-shrink:0;}
.wdh-ai-out{background:rgba(0,229,192,.05);border:1px solid rgba(0,229,192,.15);border-radius:8px;padding:11px 13px;font-size:11px;color:#b8e8d8;line-height:1.7;margin-top:10px;}
.wdh-warn{background:rgba(255,159,67,.08);border:1px solid rgba(255,159,67,.2);border-radius:7px;padding:9px 11px;font-size:11px;color:#ffc07a;line-height:1.55;margin-top:8px;display:flex;gap:7px;}
.wdh-drip-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;}
.wdh-drip-field{display:flex;flex-direction:column;gap:3px;}
.wdh-drip-lbl{font-family:'JetBrains Mono',monospace;font-size:8px;color:#4a6a8a;text-transform:uppercase;letter-spacing:.6px;}
.wdh-drip-in{background:rgba(5,15,30,.6);border:1px solid rgba(42,79,122,.5);border-radius:6px;color:#e8f0fe;font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:600;padding:7px 10px;outline:none;width:100%;transition:border-color .15s;}
.wdh-drip-in:focus{border-color:rgba(59,158,255,.4);}
.wdh-drip-sel{background:rgba(5,15,30,.6);border:1px solid rgba(42,79,122,.5);border-radius:6px;color:#e8f0fe;font-family:'JetBrains Mono',monospace;font-size:11px;padding:7px 10px;outline:none;width:100%;cursor:pointer;}
.wdh-drip-result{background:rgba(5,15,30,.85);border:2px solid rgba(255,159,67,.3);border-radius:10px;padding:16px 18px;text-align:center;margin-bottom:14px;}
.wdh-drip-rate{font-family:'JetBrains Mono',monospace;font-size:36px;font-weight:700;color:#ff9f43;line-height:1;}
.wdh-drip-unit{font-family:'JetBrains Mono',monospace;font-size:13px;color:#8aaccc;margin-top:2px;}
.wdh-drip-detail{font-family:'JetBrains Mono',monospace;font-size:9px;color:#2e4a6a;margin-top:6px;}
.wdh-rsi-kit{padding:2px 0;}
.wdh-rsi-hdr{font-family:'Playfair Display',serif;font-size:17px;font-weight:700;color:#ff6b6b;margin-bottom:14px;display:flex;align-items:center;gap:8px;}
.wdh-rsi-agent-row{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:6px;}
.wdh-rsi-label{font-family:'JetBrains Mono',monospace;font-size:8px;color:#4a6a8a;text-transform:uppercase;letter-spacing:.7px;margin-bottom:5px;}
.wdh-rsi-sel-btn{padding:5px 13px;border-radius:6px;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;transition:all .12s;border:1px solid rgba(26,53,85,.5);background:rgba(8,22,40,.6);color:#8aaccc;}
.wdh-rsi-sel-btn.on{background:rgba(255,107,107,.12);border-color:rgba(255,107,107,.35);color:#ff8a8a;}
.wdh-rsi-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-bottom:12px;}
.wdh-rsi-card{background:rgba(11,30,54,.65);border:1px solid rgba(26,53,85,.5);border-radius:9px;padding:12px;position:relative;overflow:hidden;}
.wdh-rsi-card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;}
.wdh-rsi-card.induction::before{background:#ff6b6b;}
.wdh-rsi-card.paralytic::before{background:#9b6dff;}
.wdh-rsi-card.premed::before{background:#3b9eff;}
.wdh-rsi-card-cat{font-family:'JetBrains Mono',monospace;font-size:8px;color:#4a6a8a;text-transform:uppercase;letter-spacing:.7px;margin-bottom:5px;}
.wdh-rsi-card-name{font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;color:#c8dff8;margin-bottom:6px;}
.wdh-rsi-card-dose{font-family:'JetBrains Mono',monospace;font-size:24px;font-weight:700;color:#ff6b6b;line-height:1;}
.wdh-rsi-card-vol{font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;color:#00e5c0;margin-top:2px;}
.wdh-rsi-card-detail{font-family:'JetBrains Mono',monospace;font-size:9px;color:#4a6a8a;margin-top:4px;}
.wdh-empty{display:flex;align-items:center;justify-content:center;height:200px;color:#2e4a6a;font-size:12px;font-style:italic;}
.wdh-divider{height:1px;background:rgba(26,53,85,.4);margin:10px 0;}
.wdh-ghost-btn{background:rgba(11,30,54,.6);border:1px solid rgba(42,79,122,.5);border-radius:6px;color:#8aaccc;font-family:'DM Sans',sans-serif;font-size:11px;font-weight:500;padding:5px 12px;cursor:pointer;transition:all .12s;}
.wdh-ghost-btn:hover{color:#c8dff8;border-color:#2a4f7a;}
.wdh-rsi-kit-btn{display:flex;align-items:center;gap:6px;padding:6px 14px;border-radius:7px;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:11px;font-weight:700;transition:all .13s;border:1px solid rgba(255,107,107,.3);background:rgba(255,107,107,.08);color:#ff8a8a;margin-bottom:10px;width:100%;}
.wdh-rsi-kit-btn:hover{background:rgba(255,107,107,.16);}
`;

// ─── DRUG CATEGORIES ─────────────────────────────────────────────────────────
const CATS = [
  { id:"rsi",     label:"RSI / Airway",    icon:"🫁", color:"#ff6b6b" },
  { id:"sedation",label:"Sedation",         icon:"💉", color:"#9b6dff" },
  { id:"pressor", label:"Pressors",         icon:"💊", color:"#ff9f43" },
  { id:"pain",    label:"Pain",             icon:"⚡", color:"#3b9eff" },
  { id:"cardiac", label:"Cardiac",          icon:"🫀", color:"#ff4444" },
  { id:"seizure", label:"Seizure",          icon:"🧠", color:"#00e5c0" },
  { id:"abx",     label:"Antibiotics",      icon:"🦠", color:"#3dffa0" },
  { id:"antidote",label:"Antidotes",        icon:"🚨", color:"#f5c842" },
];

// ─── DRUG DATA ────────────────────────────────────────────────────────────────
// dose: { ind, route, dpkg(mg/kg or null=fixed), lo, hi, absMax, conc(mg/mL),
//         unit("mg"|"mcg"), onset, dur, note, fixedDose(bool) }
// drip: { start, lo, hi, unit, concs:[{l,c}], note }
const DRUGS = [
  // ── RSI / AIRWAY ──────────────────────────────────────────────────────────
  { id:"etomidate", name:"Etomidate", cat:"rsi", renal:false,
    ci:["Adrenal insufficiency (relative)"],
    doses:[{ ind:"RSI Induction", route:"IV", dpkg:0.3, lo:0.2, hi:0.4, absMax:60, conc:2, unit:"mg", onset:"30-60s", dur:"3-5 min", note:"Hemodynamically neutral. Single dose acceptable. Inhibits cortisol synthesis." }] },

  { id:"ketamine", name:"Ketamine", cat:"rsi", renal:false,
    ci:["Elevated ICP (relative)", "Active psychosis (relative)"],
    doses:[
      { ind:"RSI Induction", route:"IV", dpkg:1.5, lo:1.0, hi:2.0, absMax:200, conc:10, unit:"mg", onset:"30-60s", dur:"10-20 min", note:"Preferred in hemodynamic instability, bronchospasm, or analgesia-required RSI." },
      { ind:"RSI Induction", route:"IM", dpkg:4.0, lo:3.0, hi:5.0, absMax:500, conc:50, unit:"mg", onset:"2-4 min", dur:"15-30 min", note:"IM route when IV access unavailable." },
    ] },

  { id:"succinylcholine", name:"Succinylcholine", cat:"rsi", renal:false,
    ci:["Hyperkalemia", "Crush/burn/denervation injuries", "Myopathies", "Personal/family hx malignant hyperthermia"],
    doses:[
      { ind:"RSI Paralysis", route:"IV", dpkg:1.5, lo:1.0, hi:2.0, absMax:200, conc:20, unit:"mg", onset:"45-60s", dur:"8-12 min", note:"Gold standard for RSI. Use 2 mg/kg in children < 25 kg. Check for contraindications." },
    ] },

  { id:"rocuronium", name:"Rocuronium", cat:"rsi", renal:false,
    ci:[],
    doses:[
      { ind:"RSI Paralysis", route:"IV", dpkg:1.2, lo:0.9, hi:1.6, absMax:200, conc:10, unit:"mg", onset:"60-90s", dur:"40-70 min", note:"Preferred when succinylcholine contraindicated. Reversible with sugammadex 16 mg/kg." },
      { ind:"Facilitated Intubation", route:"IV", dpkg:0.6, lo:0.45, hi:0.9, absMax:100, conc:10, unit:"mg", onset:"90-120s", dur:"25-40 min", note:"Lower dose for non-RSI intubation." },
    ] },

  { id:"vecuronium", name:"Vecuronium", cat:"rsi", renal:false,
    ci:[],
    doses:[
      { ind:"RSI Paralysis", route:"IV", dpkg:0.1, lo:0.1, hi:0.15, absMax:20, conc:1, unit:"mg", onset:"2-4 min", dur:"25-40 min", note:"Slower onset than rocuronium. Avoid as first-line RSI agent if rocuronium available." },
    ] },

  // ── SEDATION ──────────────────────────────────────────────────────────────
  { id:"propofol", name:"Propofol", cat:"sedation", renal:false,
    ci:["Egg/soy/peanut allergy (relative)", "Propofol infusion syndrome risk"],
    doses:[
      { ind:"Procedural Sedation", route:"IV", dpkg:1.0, lo:0.5, hi:1.5, absMax:150, conc:10, unit:"mg", onset:"30-60s", dur:"5-10 min", note:"Titrate in 0.5 mg/kg increments. Monitor BP closely — significant hypotension possible." },
      { ind:"RSI Induction", route:"IV", dpkg:1.5, lo:1.0, hi:2.5, absMax:200, conc:10, unit:"mg", onset:"30-60s", dur:"3-10 min", note:"Not preferred in hemodynamic instability. Causes vasodilation and myocardial depression." },
    ] },

  { id:"midazolam", name:"Midazolam", cat:"sedation", renal:false,
    ci:["Acute narrow-angle glaucoma"],
    doses:[
      { ind:"Procedural Sedation", route:"IV", dpkg:0.1, lo:0.05, hi:0.15, absMax:5, conc:1, unit:"mg", onset:"2-5 min", dur:"15-30 min", note:"Titrate slowly. Lower doses in elderly and opioid-naive patients. Reversal: flumazenil." },
      { ind:"Procedural Sedation", route:"IM", dpkg:0.07, lo:0.05, hi:0.1, absMax:10, conc:5, unit:"mg", onset:"5-15 min", dur:"20-40 min", note:"IM alternative when IV unavailable." },
      { ind:"Anxiolysis", route:"IN", dpkg:0.2, lo:0.1, hi:0.3, absMax:10, conc:5, unit:"mg", onset:"5-10 min", dur:"20-30 min", note:"Intranasal via MAD device. 0.2 mg/kg is standard anxiolysis dose." },
    ] },

  { id:"ketamine_sed", name:"Ketamine (Sedation)", cat:"sedation", renal:false,
    ci:["Age < 3 months", "Procedures involving posterior pharynx"],
    doses:[
      { ind:"Procedural Sedation", route:"IV", dpkg:0.5, lo:0.25, hi:1.0, absMax:100, conc:10, unit:"mg", onset:"1-2 min", dur:"10-20 min", note:"Dissociative at higher doses. Analgesic at lower doses. Maintain airway reflexes." },
      { ind:"Procedural Sedation", route:"IM", dpkg:4.0, lo:3.0, hi:5.0, absMax:400, conc:50, unit:"mg", onset:"3-5 min", dur:"20-30 min", note:"IM preferred in combative or uncooperative patients." },
      { ind:"Sub-dissociative Analgesia", route:"IV", dpkg:0.3, lo:0.1, hi:0.5, absMax:50, conc:10, unit:"mg", onset:"1-2 min", dur:"15-30 min", note:"Low-dose ketamine analgesia: 0.1-0.5 mg/kg IV over 15 min to reduce opioid requirements." },
    ] },

  // ── PRESSORS / DRIPS ──────────────────────────────────────────────────────
  { id:"norepinephrine", name:"Norepinephrine", cat:"pressor", renal:false, isDrip:true, ci:[],
    drip:{ start:0.1, lo:0.01, hi:3.0, unit:"mcg/kg/min",
      concs:[{ l:"4mg/250mL (16 mcg/mL)", c:16 },{ l:"8mg/250mL (32 mcg/mL)", c:32 }],
      note:"First-line vasopressor for septic shock. Titrate to MAP ≥65 mmHg." } },

  { id:"epinephrine_drip", name:"Epinephrine (Drip)", cat:"pressor", renal:false, isDrip:true, ci:[],
    drip:{ start:0.05, lo:0.01, hi:1.0, unit:"mcg/kg/min",
      concs:[{ l:"1mg/250mL (4 mcg/mL)", c:4 },{ l:"2mg/250mL (8 mcg/mL)", c:8 }],
      note:"Anaphylaxis, refractory septic shock, cardiogenic shock. Arrhythmogenic at high doses." } },

  { id:"dopamine", name:"Dopamine", cat:"pressor", renal:false, isDrip:true, ci:[],
    drip:{ start:5, lo:2, hi:20, unit:"mcg/kg/min",
      concs:[{ l:"400mg/250mL (1600 mcg/mL)", c:1600 },{ l:"800mg/250mL (3200 mcg/mL)", c:3200 }],
      note:"2-4: renal/splanchnic dilation (limited evidence). 5-10: inotropic. >10: vasopressor. Higher arrhythmia risk than norepinephrine." } },

  { id:"vasopressin", name:"Vasopressin", cat:"pressor", renal:false, isDrip:true, ci:[],
    drip:{ start:0.03, lo:0.01, hi:0.04, unit:"units/min", fixedRate:true,
      concs:[{ l:"20u/100mL (0.2 u/mL)", c:0.2 },{ l:"40u/100mL (0.4 u/mL)", c:0.4 }],
      note:"Fixed dose 0.03 units/min. Add-on vasopressor in septic shock. Not titrated." } },

  { id:"phenylephrine", name:"Phenylephrine", cat:"pressor", renal:false, isDrip:true, ci:[],
    drip:{ start:100, lo:50, hi:400, unit:"mcg/min", weightBased:false,
      concs:[{ l:"100mg/250mL (400 mcg/mL)", c:400 },{ l:"50mg/250mL (200 mcg/mL)", c:200 }],
      note:"Pure alpha-1 agonist. Use in neurogenic shock. May cause reflex bradycardia." } },

  { id:"dobutamine", name:"Dobutamine", cat:"pressor", renal:false, isDrip:true, ci:[],
    drip:{ start:5, lo:2, hi:20, unit:"mcg/kg/min",
      concs:[{ l:"250mg/250mL (1000 mcg/mL)", c:1000 }],
      note:"Inotrope for cardiogenic shock. Does not reliably increase BP. Tachyarrhythmia risk." } },

  // ── PAIN / ANALGESIA ──────────────────────────────────────────────────────
  { id:"morphine", name:"Morphine", cat:"pain", renal:true,
    ci:["Severe renal impairment (active metabolite accumulates)"],
    doses:[
      { ind:"Acute Pain", route:"IV", dpkg:0.1, lo:0.05, hi:0.2, absMax:10, conc:1, unit:"mg", onset:"5-10 min", dur:"3-4 hr", note:"Titrate in 2-4mg increments q5-10 min. Reduce dose in elderly and renal impairment." },
    ] },

  { id:"hydromorphone", name:"Hydromorphone", cat:"pain", renal:true,
    ci:[],
    doses:[
      { ind:"Acute Pain", route:"IV", dpkg:0.015, lo:0.01, hi:0.02, absMax:2, conc:0.5, unit:"mg", onset:"5-10 min", dur:"3-4 hr", note:"5x more potent than morphine. Use 0.5-1mg increments for titration. Preferred in renal impairment over morphine." },
    ] },

  { id:"fentanyl", name:"Fentanyl", cat:"pain", renal:false,
    ci:[],
    doses:[
      { ind:"Acute Pain / RSI Premed", route:"IV", dpkg:1, lo:0.5, hi:2, absMax:200, conc:0.05, unit:"mcg", onset:"1-3 min", dur:"30-60 min", note:"Rapid onset. Chest wall rigidity at high bolus doses. Safe in renal/hepatic failure." },
      { ind:"Acute Pain", route:"IN", dpkg:1.5, lo:1, hi:2, absMax:200, conc:0.05, unit:"mcg", onset:"5-10 min", dur:"30-60 min", note:"Intranasal via MAD. Useful when IV access unavailable. Divide between nares." },
    ] },

  { id:"ketorolac", name:"Ketorolac", cat:"pain", renal:true,
    ci:["Active GI bleed", "Renal impairment (CrCl < 30)", "Aspirin/NSAID allergy", "Third trimester pregnancy"],
    doses:[
      { ind:"Acute Pain", route:"IV", dpkg:0.5, lo:0.3, hi:0.5, absMax:30, conc:15, unit:"mg", onset:"30-60 min", dur:"4-6 hr", note:"Max 30mg IV. Limit to 5 days total. Excellent for renal colic, musculoskeletal pain." },
      { ind:"Acute Pain", route:"IM", dpkg:0.5, lo:0.3, hi:0.5, absMax:60, conc:30, unit:"mg", onset:"30-60 min", dur:"4-6 hr", note:"Max 60mg IM single dose. Lower doses in elderly (≤30mg IM)." },
    ] },

  { id:"apap_iv", name:"Acetaminophen IV", cat:"pain", renal:false,
    ci:["Hepatic impairment", "Hepatotoxicity risk (EtOH, malnourished)"],
    doses:[
      { ind:"Pain / Fever", route:"IV", dpkg:15, lo:10, hi:15, absMax:1000, conc:10, unit:"mg", onset:"5-10 min", dur:"4-6 hr", note:"Max 1g/dose, 4g/day in adults. Use weight-based dosing for patients < 50 kg (max 1g). Space at least 4 hours." },
    ] },

  { id:"lidocaine_iv", name:"Lidocaine IV", cat:"pain", renal:false,
    ci:["Second/third-degree AV block", "Severe hepatic impairment"],
    doses:[
      { ind:"Systemic Analgesia", route:"IV", dpkg:1.5, lo:1.0, hi:2.0, absMax:200, conc:10, unit:"mg", onset:"5-15 min", dur:"30-60 min", note:"Infuse over 10-15 min. Analgesic for visceral pain, procedural pain. Watch for CNS/cardiac toxicity." },
    ] },

  // ── CARDIAC ───────────────────────────────────────────────────────────────
  { id:"amiodarone", name:"Amiodarone", cat:"cardiac", renal:false, isDrip:true,
    ci:["Sinus node dysfunction", "Second/third-degree AV block without pacemaker", "Iodine allergy (relative)"],
    doses:[
      { ind:"V-Fib / Pulseless V-Tach", route:"IV", dpkg:null, lo:300, hi:300, absMax:300, conc:50, unit:"mg", fixedDose:true, onset:"rapid", dur:"Variable", note:"300mg IV rapid push in cardiac arrest. Second dose 150mg if needed." },
      { ind:"Stable V-Tach / AFib Rate Control", route:"IV", dpkg:null, lo:150, hi:150, absMax:150, conc:50, unit:"mg", fixedDose:true, onset:"10 min", dur:"Variable", note:"150mg over 10 min. Then 1 mg/min x6hr, 0.5 mg/min x18hr as drip." },
    ],
    drip:{ start:1, lo:0.5, hi:1, unit:"mg/min", weightBased:false,
      concs:[{ l:"900mg/500mL (1.8 mg/mL)", c:1.8 }],
      note:"Maintenance: 1 mg/min x6hr, then 0.5 mg/min x18hr. Switch to oral amiodarone for long-term." } },

  { id:"adenosine", name:"Adenosine", cat:"cardiac", renal:false,
    ci:["Second/third-degree AV block", "Sick sinus syndrome", "Decompensated asthma"],
    doses:[
      { ind:"SVT Termination", route:"IV", dpkg:null, lo:6, hi:6, absMax:6, conc:3, unit:"mg", fixedDose:true, onset:"Seconds", dur:"10-30 sec", note:"6mg rapid IV push + 20mL flush. Repeat 12mg x2 if needed. Half-life 10 seconds." },
      { ind:"SVT Termination (2nd dose)", route:"IV", dpkg:null, lo:12, hi:12, absMax:12, conc:3, unit:"mg", fixedDose:true, onset:"Seconds", dur:"10-30 sec", note:"12mg rapid IV push + 20mL flush. Use central line if available (drug degrades rapidly)." },
    ] },

  { id:"diltiazem", name:"Diltiazem", cat:"cardiac", renal:false,
    ci:["Severe hypotension", "Second/third-degree AV block", "WPW with afib", "Decompensated HF"],
    doses:[
      { ind:"AFib / Flutter Rate Control", route:"IV", dpkg:0.25, lo:0.2, hi:0.35, absMax:25, conc:5, unit:"mg", onset:"2-7 min", dur:"1-3 hr", note:"0.25 mg/kg over 2 min. May repeat 0.35 mg/kg after 15 min if inadequate response." },
    ] },

  { id:"metoprolol", name:"Metoprolol", cat:"cardiac", renal:false,
    ci:["Severe bradycardia", "Second/third-degree AV block", "Decompensated HF", "Severe bronchospasm"],
    doses:[
      { ind:"AFib / SVT Rate Control", route:"IV", dpkg:null, lo:5, hi:5, absMax:15, conc:1, unit:"mg", fixedDose:true, onset:"1-5 min", dur:"3-6 hr", note:"5mg IV over 2 min. Repeat q5min x3 doses (max 15mg). Check HR and BP after each dose." },
    ] },

  { id:"atropine", name:"Atropine", cat:"cardiac", renal:false,
    ci:["Glaucoma (relative)", "Myasthenia gravis (relative)"],
    doses:[
      { ind:"Symptomatic Bradycardia", route:"IV", dpkg:null, lo:0.5, hi:1.0, absMax:3, conc:0.1, unit:"mg", fixedDose:true, onset:"1-3 min", dur:"2-6 hr", note:"0.5-1mg IV. Repeat q3-5min to max 3mg. Minimum 0.5mg — paradoxical bradycardia with lower doses." },
    ] },

  // ── SEIZURE ───────────────────────────────────────────────────────────────
  { id:"lorazepam", name:"Lorazepam", cat:"seizure", renal:false,
    ci:["Acute narrow-angle glaucoma"],
    doses:[
      { ind:"Active Seizure / SE", route:"IV", dpkg:0.1, lo:0.05, hi:0.15, absMax:4, conc:2, unit:"mg", onset:"1-5 min", dur:"12-24 hr", note:"4mg max per dose. Repeat in 5-10 min if seizure persists. First-line for SE if IV access available." },
      { ind:"Active Seizure / SE", route:"IM", dpkg:0.1, lo:0.05, hi:0.1, absMax:4, conc:4, unit:"mg", onset:"5-10 min", dur:"12-24 hr", note:"IM is reliable when IV unavailable. 4mg IM preferred over rectal diazepam in prehospital setting." },
    ] },

  { id:"diazepam", name:"Diazepam", cat:"seizure", renal:false,
    ci:[],
    doses:[
      { ind:"Active Seizure / SE", route:"IV", dpkg:0.15, lo:0.1, hi:0.2, absMax:10, conc:5, unit:"mg", onset:"1-3 min", dur:"15-30 min (anticonvulsant)", note:"5-10mg IV over 2 min. Repeat in 5-10 min. Longer half-life than lorazepam but shorter anticonvulsant effect." },
      { ind:"Active Seizure (no IV)", route:"Rectal", dpkg:0.2, lo:0.2, hi:0.5, absMax:20, conc:5, unit:"mg", onset:"5-15 min", dur:"15-30 min", note:"Rectal gel when no IV access. 0.2-0.5 mg/kg per rectum." },
    ] },

  { id:"levetiracetam", name:"Levetiracetam", cat:"seizure", renal:true,
    ci:[],
    doses:[
      { ind:"SE / Seizure Prophylaxis", route:"IV", dpkg:60, lo:40, hi:60, absMax:4500, conc:100, unit:"mg", onset:"15 min", dur:"12-24 hr", note:"Load 60 mg/kg IV over 15 min, max 4500mg. Renally cleared — reduce dose in CrCl < 50. Well-tolerated." },
    ] },

  { id:"valproate", name:"Valproate IV", cat:"seizure", renal:false,
    ci:["Hepatic disease", "Pregnancy (teratogenic)", "Urea cycle disorders"],
    doses:[
      { ind:"SE / Seizure Prophylaxis", route:"IV", dpkg:40, lo:25, hi:45, absMax:3000, conc:5, unit:"mg", onset:"20 min", dur:"12-24 hr", note:"Load 40 mg/kg over 10 min (20-40 mg/kg acceptable). Max 3g. Check LFTs. Avoid in pregnancy." },
    ] },

  { id:"fosphenytoin", name:"Fosphenytoin", cat:"seizure", renal:false,
    ci:["Second/third-degree AV block", "Adams-Stokes syndrome"],
    doses:[
      { ind:"SE / Seizure Prophylaxis", route:"IV", dpkg:20, lo:15, hi:20, absMax:1500, conc:50, unit:"mg PE", onset:"10-20 min", dur:"12-24 hr", note:"Dosed in PE (phenytoin equivalents). Max infusion rate 150 PE/min. Monitor ECG. Less irritating than phenytoin." },
    ] },

  // ── ANTIBIOTICS ───────────────────────────────────────────────────────────
  { id:"ceftriaxone", name:"Ceftriaxone", cat:"abx", renal:false,
    ci:["Penicillin hypersensitivity (cross-react ~1-2%)"],
    doses:[
      { ind:"General Infection", route:"IV", dpkg:null, lo:1000, hi:1000, absMax:1000, conc:40, unit:"mg", fixedDose:true, onset:"30-60 min", dur:"24 hr", note:"1g IV q24h for most infections. 2g for meningitis, endocarditis. Peds: 50-100 mg/kg, max 2g." },
      { ind:"Meningitis / Severe Infection", route:"IV", dpkg:null, lo:2000, hi:2000, absMax:2000, conc:40, unit:"mg", fixedDose:true, onset:"30-60 min", dur:"12-24 hr", note:"2g IV q12-24h for CNS infections. Penetrates blood-brain barrier well." },
    ] },

  { id:"piptazo", name:"Piperacillin-Tazobactam", cat:"abx", renal:true,
    ci:["Penicillin allergy"],
    doses:[
      { ind:"Broad-Spectrum Coverage", route:"IV", dpkg:null, lo:3375, hi:3375, absMax:3375, conc:40, unit:"mg", fixedDose:true, onset:"30-60 min", dur:"6-8 hr", note:"3.375g q6h (or 4.5g q6h for Pseudomonas risk). Renally dosed. Extended infusion over 4hr preferred." },
    ] },

  { id:"vancomycin", name:"Vancomycin", cat:"abx", renal:true,
    ci:["Vancomycin allergy"],
    doses:[
      { ind:"MRSA / Gram-Positive Coverage", route:"IV", dpkg:25, lo:15, hi:25, absMax:3000, conc:5, unit:"mg", onset:"1-2 hr (therapeutic)", dur:"6-12 hr", note:"Load 25 mg/kg (AUC-guided dosing). Max 3g load. Infuse over 1-2 hr minimum (Red man syndrome prevention). AKI risk — renally dosed." },
    ] },

  { id:"azithromycin", name:"Azithromycin", cat:"abx", renal:false,
    ci:["QTc prolongation risk", "Known QT-prolonging drug combinations"],
    doses:[
      { ind:"Community-Acquired PNA / Atypical", route:"IV", dpkg:null, lo:500, hi:500, absMax:500, conc:2, unit:"mg", fixedDose:true, onset:"1-4 hr", dur:"24 hr", note:"500mg IV q24h. Monitor QTc. Oral equivalent efficacy when tolerating PO." },
    ] },

  { id:"metronidazole", name:"Metronidazole", cat:"abx", renal:false,
    ci:["First trimester pregnancy"],
    doses:[
      { ind:"Anaerobic / C. diff / Intra-Abdominal", route:"IV", dpkg:null, lo:500, hi:500, absMax:500, conc:5, unit:"mg", fixedDose:true, onset:"1-2 hr", dur:"8 hr", note:"500mg IV q8h. Avoid alcohol (disulfiram reaction). 15 mg/kg loading dose for serious infections." },
    ] },

  // ── ANTIDOTES ─────────────────────────────────────────────────────────────
  { id:"naloxone", name:"Naloxone", cat:"antidote", renal:false,
    ci:["Opioid-dependent patients (precipitates withdrawal)"],
    doses:[
      { ind:"Opioid Reversal — Respiratory Depression", route:"IV", dpkg:null, lo:0.4, hi:2.0, absMax:2, conc:0.4, unit:"mg", fixedDose:true, onset:"1-2 min", dur:"30-90 min", note:"Titrate 0.04-0.1mg IV q2-3min to preserve analgesia while reversing respiratory depression. Full reversal 0.4-2mg." },
      { ind:"Opioid Reversal (no IV)", route:"IN", dpkg:null, lo:2.0, hi:4.0, absMax:4, conc:2, unit:"mg", fixedDose:true, onset:"5-10 min", dur:"30-90 min", note:"2-4mg intranasal. 4mg IN now standard for community use (Narcan). May repeat. DURATION SHORTER THAN MANY OPIOIDS — monitor." },
      { ind:"Opioid Reversal (no IV)", route:"IM", dpkg:null, lo:0.4, hi:2.0, absMax:2, conc:0.4, unit:"mg", fixedDose:true, onset:"3-5 min", dur:"30-90 min", note:"0.4-2mg IM. Repeat q2-3 min as needed. IV preferred for fastest onset." },
    ] },

  { id:"nac", name:"N-Acetylcysteine", cat:"antidote", renal:false,
    ci:[],
    doses:[
      { ind:"Acetaminophen Overdose — Load", route:"IV", dpkg:150, lo:150, hi:150, absMax:null, conc:200, unit:"mg", onset:"60 min infusion", dur:"Infusion", note:"150 mg/kg in 200mL D5W over 60 min. Then 50 mg/kg over 4hr, then 100 mg/kg over 16hr. Use Rumack-Matthew nomogram." },
    ] },

  { id:"flumazenil", name:"Flumazenil", cat:"antidote", renal:false,
    ci:["Benzodiazepine dependence (precipitates withdrawal/seizures)", "Mixed overdose with TCA"],
    doses:[
      { ind:"Benzodiazepine Reversal", route:"IV", dpkg:null, lo:0.2, hi:0.2, absMax:1, conc:0.1, unit:"mg", fixedDose:true, onset:"1-2 min", dur:"20-60 min (re-sedation likely)", note:"0.2mg IV over 30s. Repeat 0.2mg q1min to max 1mg. Re-sedation common — duration shorter than most benzodiazepines. Use with extreme caution." },
    ] },

  { id:"fourpcc", name:"4-Factor PCC (Kcentra)", cat:"antidote", renal:false,
    ci:["HIT (heparin-induced thrombocytopenia)", "DIC"],
    doses:[
      { ind:"Warfarin Reversal (INR 2-3.9)", route:"IV", dpkg:25, lo:25, hi:25, absMax:2500, conc:null, unit:"units", onset:"10-30 min", dur:"12-24 hr", note:"25 units/kg IV (max 2500 units). For INR 4-6: 35 u/kg (max 3500). For INR > 6: 50 u/kg (max 5000). Administer over 10-15 min." },
    ] },
];

// ─── SCHEMAS ─────────────────────────────────────────────────────────────────
const S_INTERACT = {
  type:"object",
  properties:{
    interactions:{ type:"array", items:{ type:"object",
      properties:{ drug:{ type:"string" }, severity:{ type:"string", enum:["major","moderate","minor"] }, mechanism:{ type:"string" } },
      required:["drug","severity","mechanism"] } },
    safe:{ type:"boolean" },
  },
  required:["interactions","safe"],
};
const S_VERIFY = {
  type:"object",
  properties:{
    appropriate:{ type:"boolean" },
    reasoning:{ type:"string" },
    adjustedDose:{ type:"string" },
    warnings:{ type:"array", items:{ type:"string" } },
  },
  required:["appropriate","reasoning"],
};
const S_LOOKUP = {
  type:"object",
  properties:{
    name:{ type:"string" }, category:{ type:"string" },
    doses:{ type:"array", items:{ type:"object", properties:{
      indication:{ type:"string" }, route:{ type:"string" },
      dose:{ type:"string" }, maxDose:{ type:"string" },
      onset:{ type:"string" }, notes:{ type:"string" }
    }, required:["indication","route","dose"] } },
    contraindications:{ type:"array", items:{ type:"string" } },
    renalAdjust:{ type:"boolean" },
  },
  required:["name","doses"],
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmt1 = (n) => isNaN(n) ? "—" : (Math.round(n * 10) / 10).toString();
const fmt2 = (n) => isNaN(n) ? "—" : (Math.round(n * 100) / 100).toString();

function calcBolus(dose, weight, sliderVal) {
  const w = parseFloat(weight);
  if (!w || w <= 0) return null;
  if (dose.fixedDose) {
    const mg = sliderVal;
    const vol = dose.conc ? mg / dose.conc : null;
    return { mg, vol, label:`${fmt1(mg)} ${dose.unit}`, volLabel: vol ? `${fmt1(vol)} mL` : null,
      detail:`Fixed dose · ${dose.conc ? `Conc: ${dose.conc} mg/mL` : ""}` };
  }
  const perKg = sliderVal;
  const raw = perKg * w;
  const mg = dose.absMax ? Math.min(raw, dose.absMax) : raw;
  const vol = dose.conc ? mg / dose.conc : null;
  const capped = dose.absMax && raw > dose.absMax;
  return { mg, vol, label:`${fmt1(mg)} ${dose.unit}`, volLabel: vol ? `${fmt1(vol)} mL` : null,
    detail:`${fmt2(perKg)} ${dose.unit}/kg × ${w} kg${capped ? " · CAPPED AT MAX" : ""}${dose.conc ? ` · Conc: ${dose.conc} mg/mL` : ""}` };
}

function calcDripRate(drip, weight, desiredDose, concIdx) {
  const c = drip.concs[concIdx]?.c;
  if (!c || !desiredDose) return null;
  const d = parseFloat(desiredDose);
  const w = parseFloat(weight) || 70;
  if (!d || d <= 0) return null;
  let rate;
  if (drip.unit === "mcg/kg/min")  rate = (d * w * 60) / c;
  else if (drip.unit === "mg/min") rate = (d * 60) / c;
  else if (drip.unit === "mcg/min") rate = (d * 60) / c;
  else if (drip.unit === "units/min") rate = (d * 60) / (c * 1000); // conc in units/mL
  return rate ? { rateMlHr: fmt1(rate), dose: d, unit: drip.unit, concLabel: drip.concs[concIdx].l } : null;
}

function getRenalFlag(demo) {
  const age = parseInt(demo?.age);
  if (!age) return null;
  if (age >= 85) return "severe";
  if (age >= 75) return "mild";
  return null;
}

function checkAllergyConflict(drug, allergies) {
  if (!allergies?.length) return [];
  const flags = [];
  const allergyStr = allergies.join(" ").toLowerCase();
  const drugName = drug.name.toLowerCase();
  if (allergyStr.includes("penicillin") && (drugName.includes("penicillin") || drugName.includes("pip") || drugName.includes("amoxicillin"))) flags.push("Penicillin allergy");
  if (allergyStr.includes("cephalosporin") && drugName.includes("ceftriaxone")) flags.push("Cephalosporin allergy");
  if (allergyStr.includes("sulfa") && drugName.includes("trimethoprim")) flags.push("Sulfa allergy");
  if (allergyStr.includes("nsaid") && (drugName.includes("ketorolac") || drugName.includes("ibuprofen"))) flags.push("NSAID allergy");
  if (allergyStr.includes("aspirin") && drugName.includes("ketorolac")) flags.push("Aspirin/NSAID allergy");
  return flags;
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────
function PatientBar({ demo, setWeight, allergies }) {
  const renal = getRenalFlag(demo);
  return (
    <div className="wdh-ptbar">
      <div className="wdh-pt-field">
        <div className="wdh-pt-lbl">Weight</div>
        <input className="wdh-pt-in" placeholder="kg"
          value={demo?.weight || ""} onChange={e => setWeight(e.target.value)} />
      </div>
      <div className="wdh-pt-field">
        <div className="wdh-pt-lbl">Age</div>
        <div className="wdh-pt-val">{demo?.age || "—"}</div>
      </div>
      <div className="wdh-pt-field">
        <div className="wdh-pt-lbl">Sex</div>
        <div className="wdh-pt-val">{demo?.sex || "—"}</div>
      </div>
      {renal && (
        <div className="wdh-renal-badge">⚠ {renal === "severe" ? "Severe" : "Mild"} Renal Risk — Check Doses</div>
      )}
      {(allergies || []).slice(0, 3).map(a => (
        <div key={a} className="wdh-allergy-tag">⚠ {a}</div>
      ))}
      {(allergies || []).length > 3 && (
        <div className="wdh-allergy-tag">+{allergies.length - 3} more</div>
      )}
      <div style={{ marginLeft:"auto", fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"#2e4a6a" }}>
        {demo?.weight ? `IBW est: ${Math.round(parseInt(demo.sex==="F"?45.5:50)+(2.3*(parseInt(demo.height||170)*0.394-60)))} kg` : "Enter weight →"}
      </div>
    </div>
  );
}

function RSIKit({ weight, drugs }) {
  const [induction, setInduction] = useState("etomidate");
  const [paralytic, setParalytic] = useState("succinylcholine");
  const [premed, setPremed] = useState("fentanyl");
  const w = parseFloat(weight) || 70;

  const RSI_INDUCTIONS = [
    { id:"etomidate", label:"Etomidate", dpkg:0.3, conc:2, absMax:60, unit:"mg" },
    { id:"ketamine", label:"Ketamine", dpkg:1.5, conc:10, absMax:200, unit:"mg" },
    { id:"propofol", label:"Propofol", dpkg:1.5, conc:10, absMax:200, unit:"mg" },
  ];
  const RSI_PARALYTICS = [
    { id:"succinylcholine", label:"Succinylcholine", dpkg:1.5, conc:20, absMax:200, unit:"mg", note:"CI: hyperkalemia, burns, crush", reverse:"None" },
    { id:"rocuronium", label:"Rocuronium", dpkg:1.2, conc:10, absMax:200, unit:"mg", note:"Reverse with sugammadex 16 mg/kg", reverse:"Sugammadex" },
  ];
  const RSI_PREMEDS = [
    { id:"fentanyl", label:"Fentanyl (blunting)", dpkg:3, conc:0.05, absMax:300, unit:"mcg", note:"3 mcg/kg IV 3 min prior" },
    { id:"lidocaine", label:"Lidocaine", dpkg:1.5, conc:10, absMax:200, unit:"mg", note:"1.5 mg/kg IV — blunts ICP response" },
    { id:"none", label:"None", dpkg:0, conc:1, absMax:0, unit:"mg", note:"No premedication" },
  ];

  const calcCard = (drug) => {
    if (!drug.dpkg || !w) return { dose:"—", vol:"—" };
    const d = Math.min(drug.dpkg * w, drug.absMax);
    const v = d / drug.conc;
    return {
      dose: `${fmt1(d)} ${drug.unit}`,
      vol: `${fmt1(v)} mL`,
      detail: `${fmt2(drug.dpkg)} ${drug.unit}/kg × ${w} kg`,
    };
  };

  const ind = RSI_INDUCTIONS.find(d => d.id === induction);
  const par = RSI_PARALYTICS.find(d => d.id === paralytic);
  const pre = RSI_PREMEDS.find(d => d.id === premed);
  const indCalc = calcCard(ind);
  const parCalc = calcCard(par);
  const preCalc = pre?.dpkg ? calcCard(pre) : null;

  return (
    <div className="wdh-rsi-kit">
      <div className="wdh-rsi-hdr">🚨 RSI Kit — {w} kg</div>

      <div style={{ marginBottom:14 }}>
        <div className="wdh-rsi-label">Induction Agent</div>
        <div className="wdh-rsi-agent-row">
          {RSI_INDUCTIONS.map(d => (
            <button key={d.id} className={"wdh-rsi-sel-btn" + (induction === d.id ? " on" : "")} onClick={() => setInduction(d.id)}>{d.label}</button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom:14 }}>
        <div className="wdh-rsi-label">Paralytic</div>
        <div className="wdh-rsi-agent-row">
          {RSI_PARALYTICS.map(d => (
            <button key={d.id} className={"wdh-rsi-sel-btn" + (paralytic === d.id ? " on" : "")} onClick={() => setParalytic(d.id)}>{d.label}</button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom:14 }}>
        <div className="wdh-rsi-label">Premedication</div>
        <div className="wdh-rsi-agent-row">
          {RSI_PREMEDS.map(d => (
            <button key={d.id} className={"wdh-rsi-sel-btn" + (premed === d.id ? " on" : "")} onClick={() => setPremed(d.id)}>{d.label}</button>
          ))}
        </div>
      </div>

      <div className="wdh-rsi-grid">
        {pre?.dpkg > 0 && (
          <div className="wdh-rsi-card premed">
            <div className="wdh-rsi-card-cat">Premedication · Give 3 min prior</div>
            <div className="wdh-rsi-card-name">{pre.label}</div>
            <div className="wdh-rsi-card-dose">{preCalc?.dose}</div>
            <div className="wdh-rsi-card-vol">{preCalc?.vol}</div>
            <div className="wdh-rsi-card-detail">{preCalc?.detail}</div>
          </div>
        )}
        <div className="wdh-rsi-card induction">
          <div className="wdh-rsi-card-cat">Induction Agent · T-0</div>
          <div className="wdh-rsi-card-name">{ind.label}</div>
          <div className="wdh-rsi-card-dose">{indCalc.dose}</div>
          <div className="wdh-rsi-card-vol">{indCalc.vol}</div>
          <div className="wdh-rsi-card-detail">{indCalc.detail}</div>
        </div>
        <div className="wdh-rsi-card paralytic" style={{ "--card-color":"#9b6dff" }}>
          <div className="wdh-rsi-card-cat">Paralytic · T-0 (simultaneous)</div>
          <div className="wdh-rsi-card-name" style={{ color:"#c8aeff" }}>{par.label}</div>
          <div className="wdh-rsi-card-dose" style={{ color:"#9b6dff" }}>{parCalc.dose}</div>
          <div className="wdh-rsi-card-vol">{parCalc.vol}</div>
          <div className="wdh-rsi-card-detail">{parCalc.detail} · {par.note}</div>
        </div>
      </div>

      <div className="wdh-note">
        Confirm ETT size, suction ready, BVM available, pre-oxygenate 3-8 min to SpO2 100%. Laryngoscope blade checked. Difficult airway backup prepared.
      </div>
    </div>
  );
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────
export default function WeightDoseHub({
  embedded = false,
  onBack,
  demo: demoProp,
  vitals,
  medications,
  allergies,
  cc,
  showToast,
  onAdvance,
}) {
  const [weight, setWeight] = useState(demoProp?.weight || "");
  const demo = useMemo(() => ({ ...demoProp, weight }), [demoProp, weight]);

  const [activeCat, setActiveCat] = useState("rsi");
  const [activeDrugId, setActiveDrugId] = useState("etomidate");
  const [search, setSearch] = useState("");
  const [activeIndIdx, setActiveIndIdx] = useState(0);
  const [activeRouteIdx, setActiveRouteIdx] = useState(0);
  const [sliderVal, setSliderVal] = useState(null);
  const [showRSIKit, setShowRSIKit] = useState(false);
  const [dripDose, setDripDose] = useState("");
  const [dripConcIdx, setDripConcIdx] = useState(0);
  const [aiOut, setAiOut] = useState(null);
  const [aiVerify, setAiVerify] = useState(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [searchBusy, setSearchBusy] = useState(false);

  const filteredDrugs = useMemo(() => {
    let list = DRUGS.filter(d => activeCat === "all" || d.cat === activeCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = DRUGS.filter(d => d.name.toLowerCase().includes(q) || d.cat.includes(q));
    }
    return list;
  }, [activeCat, search]);

  const activeDrug = useMemo(() => DRUGS.find(d => d.id === activeDrugId) || null, [activeDrugId]);

  const activeDose = useMemo(() => {
    if (!activeDrug || activeDrug.isDrip) return null;
    return activeDrug.doses?.[activeIndIdx] || activeDrug.doses?.[0] || null;
  }, [activeDrug, activeIndIdx]);

  const routes = useMemo(() => {
    if (!activeDrug || activeDrug.isDrip) return [];
    const ind = activeDrug.doses?.[activeIndIdx];
    if (!ind) return [];
    const seen = new Set();
    const r = [];
    activeDrug.doses.filter(d => d.ind === ind.ind).forEach(d => {
      if (!seen.has(d.route)) { seen.add(d.route); r.push(d.route); }
    });
    return r;
  }, [activeDrug, activeIndIdx]);

  const resolvedDose = useMemo(() => {
    if (!activeDrug || activeDrug.isDrip) return null;
    const ind = activeDrug.doses?.[activeIndIdx];
    if (!ind) return null;
    if (routes.length > 1) {
      const route = routes[activeRouteIdx] || routes[0];
      return activeDrug.doses.find(d => d.ind === ind.ind && d.route === route) || ind;
    }
    return ind;
  }, [activeDrug, activeIndIdx, routes, activeRouteIdx]);

  const defaultSlider = useMemo(() => {
    if (!resolvedDose) return 0;
    if (resolvedDose.fixedDose) return resolvedDose.lo;
    return resolvedDose.dpkg || (resolvedDose.lo + resolvedDose.hi) / 2;
  }, [resolvedDose]);

  const sv = sliderVal !== null ? sliderVal : defaultSlider;
  const doseCalc = useMemo(() => resolvedDose && weight ? calcBolus(resolvedDose, weight, sv) : null, [resolvedDose, weight, sv]);

  const allergyConflicts = useMemo(() => activeDrug ? checkAllergyConflict(activeDrug, allergies) : [], [activeDrug, allergies]);
  const renalFlag = useMemo(() => getRenalFlag(demo), [demo]);
  const catColor = useMemo(() => CATS.find(c => c.id === activeDrug?.cat)?.color || "#3b9eff", [activeDrug]);

  const selectDrug = useCallback((id) => {
    setActiveDrugId(id);
    setActiveIndIdx(0);
    setActiveRouteIdx(0);
    setSliderVal(null);
    setAiOut(null);
    setAiVerify(null);
  }, []);

  const selectCat = useCallback((id) => {
    setActiveCat(id);
    setShowRSIKit(false);
    const first = DRUGS.find(d => d.cat === id);
    if (first) selectDrug(first.id);
  }, [selectDrug]);

  // AI: interaction check
  const runInteractionCheck = useCallback(async () => {
    if (!activeDrug || aiBusy) return;
    const meds = (medications || []).join(", ");
    if (!meds) { showToast?.("No current medications on file to check.", "info"); return; }
    setAiBusy(true);
    setAiOut(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an ED pharmacist. Check for clinically significant interactions between ${activeDrug.name} and the following current medications: ${meds}. Patient: ${demo?.age || "?"}yo ${demo?.sex || ""}. List any interactions with severity (major/moderate/minor) and mechanism. Return only clinically relevant interactions.`,
        response_json_schema: S_INTERACT,
      });
      const p = typeof res === "object" ? res : JSON.parse(String(res).replace(/```json|```/g, "").trim());
      setAiOut(p);
    } catch (_) {
      showToast?.("Interaction check failed.", "error");
    } finally {
      setAiBusy(false);
    }
  }, [activeDrug, aiBusy, medications, demo, showToast]);

  // AI: dose verification
  const runVerify = useCallback(async () => {
    if (!activeDrug || verifyBusy || !doseCalc) return;
    setVerifyBusy(true);
    setAiVerify(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an ED physician double-checking a drug dose. Patient: ${demo?.age || "?"}yo ${demo?.sex || ""}, weight ${demo?.weight || "?"}kg. PMH: ${([]||[]).join(", ") || "none on file"}. Allergies: ${(allergies||[]).join(", ") || "NKDA"}. Drug: ${activeDrug.name}, indication: ${resolvedDose?.ind || "general"}, route: ${resolvedDose?.route || "IV"}, calculated dose: ${doseCalc.label}${doseCalc.volLabel ? ` (${doseCalc.volLabel})` : ""}. Is this dose appropriate? Are there any clinical warnings or adjustments needed? Be concise.`,
        response_json_schema: S_VERIFY,
      });
      const p = typeof res === "object" ? res : JSON.parse(String(res).replace(/```json|```/g, "").trim());
      setAiVerify(p);
    } catch (_) {
      showToast?.("Verification failed.", "error");
    } finally {
      setVerifyBusy(false);
    }
  }, [activeDrug, verifyBusy, doseCalc, demo, allergies, resolvedDose, showToast]);

  // AI: drug search (unlisted drugs)
  const runDrugSearch = useCallback(async () => {
    if (!searchQuery.trim() || searchBusy) return;
    setSearchBusy(true);
    setSearchResult(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an ED physician and pharmacist. Provide ED dosing information for: ${searchQuery}. Patient context: ${demo?.age || "?"}yo ${demo?.sex || ""}, weight ${demo?.weight || "?"}kg. Include: indication-specific doses, routes, max doses, onset/duration, contraindications, and whether renal adjustment is needed. ED-relevant doses only.`,
        response_json_schema: S_LOOKUP,
      });
      const p = typeof res === "object" ? res : JSON.parse(String(res).replace(/```json|```/g, "").trim());
      setSearchResult(p);
    } catch (_) {
      showToast?.("Drug lookup failed.", "error");
    } finally {
      setSearchBusy(false);
    }
  }, [searchQuery, searchBusy, demo, showToast]);

  const dripResult = useMemo(() => {
    if (!activeDrug?.isDrip || !activeDrug.drip || !dripDose) return null;
    return calcDripRate(activeDrug.drip, weight, dripDose, dripConcIdx);
  }, [activeDrug, weight, dripDose, dripConcIdx]);

  const indications = useMemo(() => {
    if (!activeDrug || activeDrug.isDrip) return [];
    const seen = new Set();
    return activeDrug.doses.filter(d => { if (seen.has(d.ind)) return false; seen.add(d.ind); return true; });
  }, [activeDrug]);

  return (
    <div className="wdh">
      <style>{CSS}</style>

      <PatientBar demo={demo} setWeight={setWeight} allergies={allergies} />

      {/* Category tabs */}
      <div className="wdh-cats">
        {CATS.map(c => (
          <button key={c.id} className="wdh-cat-btn"
            onClick={() => selectCat(c.id)}
            style={{
              background: activeCat === c.id ? `${c.color}18` : "rgba(8,22,40,0.5)",
              border: `1px solid ${activeCat === c.id ? c.color + "55" : "rgba(26,53,85,0.4)"}`,
              color: activeCat === c.id ? c.color : "#5a82a8",
            }}>
            <span>{c.icon}</span>{c.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="wdh-body">

        {/* Left: drug list */}
        <div className="wdh-drug-list">
          <input className="wdh-search" placeholder="Search drugs..." value={search}
            onChange={e => { setSearch(e.target.value); if (!e.target.value) setSearch(""); }} />

          {activeCat === "rsi" && (
            <button className="wdh-rsi-kit-btn" onClick={() => setShowRSIKit(!showRSIKit)}>
              🚨 {showRSIKit ? "Hide" : "Build"} RSI Kit
            </button>
          )}

          {filteredDrugs.length === 0 && (
            <div className="wdh-empty">No drugs found</div>
          )}

          {filteredDrugs.map(drug => (
            <button key={drug.id} className={"wdh-drug-btn" + (activeDrugId === drug.id && !showRSIKit ? " active" : "")}
              onClick={() => { selectDrug(drug.id); setShowRSIKit(false); }}
              style={{ borderColor: activeDrugId === drug.id && !showRSIKit ? `${catColor}55` : "transparent" }}>
              <div className="wdh-drug-name">{drug.name}</div>
              {drug.isDrip && <span className="wdh-drug-drip-tag">DRIP</span>}
              {drug.renal && renalFlag && <div className="wdh-renal-dot" title="Renal dose adjustment" />}
            </button>
          ))}

          {/* AI Drug Lookup */}
          <div style={{ marginTop:10, padding:"8px 4px", borderTop:"1px solid rgba(26,53,85,.4)" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"#2e4a6a", textTransform:"uppercase", letterSpacing:".7px", marginBottom:6 }}>AI Drug Lookup</div>
            <input className="wdh-search" style={{ marginBottom:5 }} placeholder="Search any drug..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && runDrugSearch()} />
            <button className={"wdh-ai-btn" + (searchBusy ? " busy" : "")} style={{ width:"100%", justifyContent:"center" }}
              onClick={runDrugSearch} disabled={searchBusy || !searchQuery.trim()}>
              {searchBusy ? <><div className="wdh-spin" />Searching...</> : <><div className="wdh-dot" />Look Up</>}
            </button>
          </div>
        </div>

        {/* Right: calculator panel */}
        <div className="wdh-panel">

          {/* RSI Kit */}
          {showRSIKit && activeCat === "rsi" && (
            <RSIKit weight={weight} drugs={DRUGS} />
          )}

          {/* AI Drug Lookup Result */}
          {searchResult && !showRSIKit && (
            <div style={{ marginBottom:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, color:"#f5c842" }}>{searchResult.name}</div>
                <button className="wdh-ghost-btn" onClick={() => setSearchResult(null)}>✕ Clear</button>
              </div>
              {(searchResult.doses || []).map((d, i) => (
                <div key={i} style={{ background:"rgba(11,30,54,.6)", border:"1px solid rgba(245,200,66,.2)", borderRadius:8, padding:"10px 12px", marginBottom:8 }}>
                  <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:5 }}>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, background:"rgba(245,200,66,.1)", border:"1px solid rgba(245,200,66,.25)", color:"#f5c842", padding:"2px 6px", borderRadius:4 }}>{d.route}</span>
                    <span style={{ fontSize:11, fontWeight:600, color:"#c8dff8" }}>{d.indication}</span>
                  </div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:18, fontWeight:700, color:"#f5c842", marginBottom:3 }}>{d.dose}</div>
                  {d.maxDose && <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"#4a6a8a" }}>Max: {d.maxDose}</div>}
                  {d.onset && <div className="wdh-meta-chip" style={{ display:"inline-block", marginTop:4 }}>Onset: {d.onset}</div>}
                  {d.notes && <div className="wdh-note" style={{ marginTop:6 }}>{d.notes}</div>}
                </div>
              ))}
              {searchResult.renalAdjust && (
                <div className="wdh-warn"><span>⚠</span><span>Renal dose adjustment required — check CrCl before dosing.</span></div>
              )}
              {(searchResult.contraindications || []).length > 0 && (
                <div style={{ marginTop:4 }}>
                  <div className="wdh-ci-hdr">Contraindications</div>
                  {searchResult.contraindications.map((c, i) => (
                    <div key={i} className="wdh-ci"><span>⚠</span><span>{c}</span></div>
                  ))}
                </div>
              )}
              <div className="wdh-divider" />
            </div>
          )}

          {/* Normal drug panel */}
          {activeDrug && !showRSIKit && (
            <>
              {/* Drug header */}
              <div className="wdh-drug-hdr">
                <div style={{ width:36, height:36, borderRadius:9, background:`${catColor}18`, border:`1px solid ${catColor}35`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>
                  {CATS.find(c => c.id === activeDrug.cat)?.icon}
                </div>
                <div className="wdh-drug-hdr-info">
                  <div className="wdh-drug-title" style={{ color: catColor }}>{activeDrug.name}</div>
                  <div className="wdh-drug-sub">
                    {activeDrug.isDrip ? "Continuous Infusion" : `${activeDrug.doses?.length || 0} dosing indication${activeDrug.doses?.length !== 1 ? "s" : ""}`}
                    {activeDrug.renal && <span style={{ color:"#f5c842", marginLeft:8 }}>· Renal adjust</span>}
                  </div>
                </div>
              </div>

              {/* Allergy conflicts */}
              {allergyConflicts.length > 0 && (
                <div className="wdh-warn" style={{ marginBottom:12 }}>
                  <span>🚫</span>
                  <span><strong>Allergy Alert:</strong> {allergyConflicts.join(", ")} on file. Verify before administering.</span>
                </div>
              )}

              {/* Drip calculator */}
              {activeDrug.isDrip && activeDrug.drip && (() => {
                const drip = activeDrug.drip;
                return (
                  <>
                    <div className="wdh-note">{drip.note}</div>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"#4a6a8a", textTransform:"uppercase", letterSpacing:".6px", marginBottom:10 }}>Drip Rate Calculator</div>
                    <div className="wdh-drip-grid">
                      <div className="wdh-drip-field">
                        <div className="wdh-drip-lbl">Desired Dose ({drip.unit})</div>
                        <input className="wdh-drip-in" type="number" step="0.01"
                          placeholder={`e.g. ${drip.start}`}
                          value={dripDose} onChange={e => setDripDose(e.target.value)} />
                        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"#2e4a6a", marginTop:2 }}>Range: {drip.lo}–{drip.hi} {drip.unit}</div>
                      </div>
                      <div className="wdh-drip-field">
                        <div className="wdh-drip-lbl">Standard Concentration</div>
                        <select className="wdh-drip-sel" value={dripConcIdx} onChange={e => setDripConcIdx(parseInt(e.target.value))}>
                          {drip.concs.map((c, i) => <option key={i} value={i}>{c.l}</option>)}
                        </select>
                      </div>
                    </div>
                    {dripResult ? (
                      <div className="wdh-drip-result">
                        <div className="wdh-drip-rate">{dripResult.rateMlHr}</div>
                        <div className="wdh-drip-unit">mL/hr</div>
                        <div className="wdh-drip-detail">{dripDose} {drip.unit}{drip.unit?.includes("kg") ? ` × ${parseFloat(weight)||70} kg × 60` : " × 60"} ÷ {dripResult.concLabel}</div>
                      </div>
                    ) : (
                      <div style={{ padding:"20px 0", textAlign:"center", fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:"#2e4a6a" }}>
                        Enter desired dose above to calculate rate
                      </div>
                    )}
                    {activeDrug.doses?.length > 0 && (
                      <>
                        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"#4a6a8a", textTransform:"uppercase", letterSpacing:".6px", marginBottom:8, marginTop:4 }}>Bolus Doses</div>
                        {activeDrug.doses.map((d, i) => (
                          <div key={i} style={{ background:"rgba(11,30,54,.5)", border:"1px solid rgba(26,53,85,.4)", borderRadius:7, padding:"9px 11px", marginBottom:7 }}>
                            <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:4 }}>
                              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, background:"rgba(59,158,255,.1)", color:"#3b9eff", border:"1px solid rgba(59,158,255,.2)", padding:"1px 5px", borderRadius:3 }}>{d.route}</span>
                              <span style={{ fontSize:11, fontWeight:600, color:"#c8dff8" }}>{d.ind}</span>
                            </div>
                            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:16, fontWeight:700, color:catColor }}>
                              {d.fixedDose ? `${d.lo} mg` : `${d.dpkg} mg/kg`}
                              {d.absMax && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"#4a6a8a", marginLeft:8 }}>max {d.absMax}{d.unit}</span>}
                            </div>
                            {weight && !d.fixedDose && (
                              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:"#00e5c0", marginTop:2 }}>
                                = {fmt1(Math.min(d.dpkg * parseFloat(weight), d.absMax || 9999))} {d.unit}
                                {d.conc && <span style={{ color:"#4a6a8a" }}> · {fmt1(Math.min(d.dpkg * parseFloat(weight), d.absMax || 9999) / d.conc)} mL</span>}
                              </div>
                            )}
                            {d.note && <div style={{ fontSize:10, color:"#8aaccc", marginTop:4 }}>{d.note}</div>}
                          </div>
                        ))}
                      </>
                    )}
                  </>
                );
              })()}

              {/* Bolus calculator */}
              {!activeDrug.isDrip && indications.length > 0 && (
                <>
                  {/* Indication selector */}
                  {indications.length > 1 && (
                    <div style={{ marginBottom:10 }}>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"#4a6a8a", textTransform:"uppercase", letterSpacing:".6px", marginBottom:5 }}>Indication</div>
                      <div className="wdh-ind-row">
                        {indications.map((d, i) => (
                          <button key={i} className={"wdh-ind-btn" + (activeIndIdx === i ? " active" : "")}
                            onClick={() => { setActiveIndIdx(i); setActiveRouteIdx(0); setSliderVal(null); setAiVerify(null); }}
                            style={ activeIndIdx === i ? { borderColor:`${catColor}50`, background:`${catColor}14`, color: catColor } : {} }>
                            {d.ind}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Route selector */}
                  {routes.length > 1 && (
                    <div style={{ marginBottom:12 }}>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"#4a6a8a", textTransform:"uppercase", letterSpacing:".6px", marginBottom:5 }}>Route</div>
                      <div className="wdh-route-row">
                        {routes.map((r, i) => (
                          <button key={r} className={"wdh-route-btn" + (activeRouteIdx === i ? " active" : "")} onClick={() => { setActiveRouteIdx(i); setSliderVal(null); setAiVerify(null); }}>{r}</button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dose result */}
                  {resolvedDose && (
                    <>
                      <div className="wdh-result-box" style={{ border:`1px solid ${catColor}30` }}>
                        {doseCalc ? (
                          <>
                            <div className="wdh-result-main">
                              <span className="wdh-result-dose" style={{ color: catColor }}>{doseCalc.label}</span>
                              {doseCalc.volLabel && (
                                <>
                                  <span className="wdh-result-arrow">→</span>
                                  <span className="wdh-result-vol">{doseCalc.volLabel}</span>
                                  <span className="wdh-result-vol-unit">from {resolvedDose.conc} mg/mL</span>
                                </>
                              )}
                            </div>
                            <div className="wdh-result-detail">{doseCalc.detail}</div>
                          </>
                        ) : (
                          <div style={{ color:"#2e4a6a", fontSize:12, fontFamily:"'JetBrains Mono',monospace" }}>
                            Enter patient weight in bar above →
                          </div>
                        )}
                      </div>

                      {/* Slider */}
                      {resolvedDose && (
                        <div className="wdh-slider-wrap">
                          <div className="wdh-slider-hdr">
                            <span className="wdh-slider-lbl">
                              {resolvedDose.fixedDose ? "Dose (mg)" : `Dose (mg/kg)  range ${resolvedDose.lo}–${resolvedDose.hi}`}
                            </span>
                            <span className="wdh-slider-val">{fmt2(sv)} {resolvedDose.fixedDose ? "mg" : "mg/kg"}</span>
                          </div>
                          <input type="range" className="wdh-slider"
                            min={resolvedDose.lo} max={resolvedDose.hi}
                            step={(resolvedDose.hi - resolvedDose.lo) / 100}
                            value={sv}
                            onChange={e => setSliderVal(parseFloat(e.target.value))} />
                          <div style={{ display:"flex", justifyContent:"space-between", fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"#2e4a6a", marginTop:2 }}>
                            <span>{resolvedDose.lo}</span>
                            <span>MAX: {resolvedDose.absMax}{resolvedDose.unit}</span>
                            <span>{resolvedDose.hi}</span>
                          </div>
                        </div>
                      )}

                      {/* Onset/Duration */}
                      {(resolvedDose.onset || resolvedDose.dur) && (
                        <div className="wdh-meta-row">
                          {resolvedDose.onset && <div className="wdh-meta-chip">⚡ Onset: {resolvedDose.onset}</div>}
                          {resolvedDose.dur && <div className="wdh-meta-chip">⏱ Duration: {resolvedDose.dur}</div>}
                          {resolvedDose.route && <div className="wdh-meta-chip">Route: {resolvedDose.route}</div>}
                        </div>
                      )}

                      {/* Note */}
                      {resolvedDose.note && <div className="wdh-note">{resolvedDose.note}</div>}
                    </>
                  )}

                  {/* Contraindications */}
                  {activeDrug.ci?.length > 0 && (
                    <div style={{ marginBottom:10 }}>
                      <div className="wdh-ci-hdr">Contraindications / Cautions</div>
                      {activeDrug.ci.map((c, i) => (
                        <div key={i} className="wdh-ci"><span>⚠</span><span>{c}</span></div>
                      ))}
                    </div>
                  )}

                  {/* Renal warning */}
                  {activeDrug.renal && renalFlag && (
                    <div className="wdh-warn" style={{ marginBottom:10 }}>
                      <span>⚠</span>
                      <span><strong>Renal Adjustment Required:</strong> Patient age suggests {renalFlag === "severe" ? "severely" : "mildly"} reduced renal function. Verify CrCl and adjust dose per formulary.</span>
                    </div>
                  )}

                  {/* AI buttons */}
                  <div className="wdh-ai-row">
                    {(medications || []).length > 0 && (
                      <button className={"wdh-ai-btn" + (aiBusy ? " busy" : "")} onClick={runInteractionCheck} disabled={aiBusy}>
                        {aiBusy ? <><div className="wdh-spin" />Checking...</> : <><div className="wdh-dot" />Check Interactions</>}
                      </button>
                    )}
                    {doseCalc && (
                      <button className={"wdh-ai-btn" + (verifyBusy ? " busy" : "")} onClick={runVerify} disabled={verifyBusy}>
                        {verifyBusy ? <><div className="wdh-spin" />Verifying...</> : <><div className="wdh-dot" />Verify Dose</>}
                      </button>
                    )}
                  </div>

                  {/* Interaction check output */}
                  {aiOut && (
                    <div className="wdh-ai-out" style={{ marginTop:10 }}>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"#00e5c0", letterSpacing:"1px", marginBottom:6, textTransform:"uppercase" }}>Interaction Check</div>
                      {aiOut.safe && aiOut.interactions?.length === 0 ? (
                        <div style={{ color:"#3dffa0" }}>✓ No significant interactions identified with current medications.</div>
                      ) : (
                        (aiOut.interactions || []).map((ix, i) => (
                          <div key={i} style={{ marginBottom:8, paddingBottom:8, borderBottom: i < aiOut.interactions.length-1 ? "1px solid rgba(0,229,192,.1)" : "none" }}>
                            <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:3 }}>
                              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700,
                                color: ix.severity === "major" ? "#ff6b6b" : ix.severity === "moderate" ? "#f5c842" : "#8aaccc",
                                background: ix.severity === "major" ? "rgba(255,107,107,.12)" : ix.severity === "moderate" ? "rgba(245,200,66,.1)" : "rgba(138,172,204,.08)",
                                border: `1px solid ${ix.severity === "major" ? "rgba(255,107,107,.25)" : ix.severity === "moderate" ? "rgba(245,200,66,.2)" : "rgba(138,172,204,.15)"}`,
                                padding:"1px 6px", borderRadius:3, textTransform:"uppercase" }}>{ix.severity}</span>
                              <span style={{ fontWeight:600, fontSize:11 }}>{ix.drug}</span>
                            </div>
                            <div style={{ fontSize:11, color:"#8aaccc" }}>{ix.mechanism}</div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Dose verification output */}
                  {aiVerify && (
                    <div className="wdh-ai-out" style={{ marginTop:8 }}>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"#00e5c0", letterSpacing:"1px", marginBottom:6, textTransform:"uppercase" }}>Dose Verification</div>
                      <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:6 }}>
                        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700,
                          color: aiVerify.appropriate ? "#3dffa0" : "#ff6b6b",
                          background: aiVerify.appropriate ? "rgba(61,255,160,.1)" : "rgba(255,107,107,.1)",
                          border: `1px solid ${aiVerify.appropriate ? "rgba(61,255,160,.25)" : "rgba(255,107,107,.25)"}`,
                          padding:"2px 8px", borderRadius:3 }}>
                          {aiVerify.appropriate ? "✓ APPROPRIATE" : "⚠ REVIEW NEEDED"}
                        </span>
                        {aiVerify.adjustedDose && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"#f5c842" }}>Adjusted: {aiVerify.adjustedDose}</span>}
                      </div>
                      <div style={{ fontSize:11, color:"#b8e8d8", lineHeight:1.65 }}>{aiVerify.reasoning}</div>
                      {(aiVerify.warnings || []).length > 0 && (
                        <div style={{ marginTop:6 }}>
                          {aiVerify.warnings.map((w, i) => (
                            <div key={i} className="wdh-ci"><span>⚠</span><span>{w}</span></div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {!activeDrug.isDrip && indications.length === 0 && (
                <div className="wdh-empty">No dosing data for this drug.</div>
              )}
            </>
          )}

          {!activeDrug && !searchResult && !showRSIKit && (
            <div className="wdh-empty">Select a drug from the list</div>
          )}

          {/* Advance footer */}
          {onAdvance && (
            <div style={{ display:"flex", justifyContent:"flex-end", marginTop:16 }}>
              <button className="wdh-ghost-btn" onClick={onAdvance} style={{ color:"#3b9eff", borderColor:"rgba(59,158,255,.3)" }}>
                Continue →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}