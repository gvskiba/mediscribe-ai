import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";

/* ─── DESIGN TOKENS ─── */
const T = {
  bg:'#050f1e', panel:'#081628', card:'#0b1e36', up:'#0e2544',
  border:'#1a3555', borderHi:'#2a4f7a',
  blue:'#3b9eff', teal:'#00e5c0', gold:'#f5c842', coral:'#ff6b6b',
  orange:'#ff9f43', purple:'#9b6dff', green:'#3dffa0',
  txt:'#e8f0fe', txt2:'#8aaccc', txt3:'#4a6a8a', txt4:'#2e4a6a',
};

/* ─── CSS ─── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=JetBrains+Mono:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap');
.mrp{position:fixed;inset:0;background:${T.bg};color:${T.txt};font-family:'DM Sans',sans-serif;font-size:14px;display:flex;flex-direction:column;overflow:hidden;z-index:50}
.mrp *,.mrp *::before,.mrp *::after{box-sizing:border-box}

/* HEADER */
.mrp-hdr{height:52px;background:${T.panel};border-bottom:1px solid ${T.border};display:flex;align-items:center;gap:10px;padding:0 16px;flex-shrink:0}
.mrp-back{display:flex;align-items:center;gap:6px;background:${T.up};border:1px solid ${T.border};border-radius:6px;padding:5px 12px;font-size:11px;color:${T.txt2};cursor:pointer;transition:all .15s;text-decoration:none;white-space:nowrap}
.mrp-back:hover{border-color:${T.borderHi};color:${T.txt}}
.mrp-title-wrap{display:flex;align-items:center;gap:8px}
.mrp-logo{width:28px;height:28px;background:${T.teal};border-radius:7px;display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:11px;font-weight:700;color:${T.bg};flex-shrink:0}
.mrp-title{font-family:'Playfair Display',serif;font-size:16px;font-weight:700;color:${T.txt};white-space:nowrap}
.mrp-sub{font-family:'JetBrains Mono',monospace;font-size:9px;color:${T.txt4};letter-spacing:2px;text-transform:uppercase;display:none}
.mrp-search{flex:1;max-width:320px;display:flex;align-items:center;gap:8px;background:${T.up};border:1px solid ${T.border};border-radius:7px;padding:0 12px;transition:border-color .15s}
.mrp-search:focus-within{border-color:${T.borderHi}}
.mrp-search input{flex:1;background:transparent;border:none;outline:none;color:${T.txt};font-size:13px;padding:7px 0;font-family:'DM Sans',sans-serif}
.mrp-search input::placeholder{color:${T.txt3}}
.mrp-tabs{display:flex;gap:2px;margin-left:auto;flex-shrink:0}
.mrp-tab{padding:6px 14px;border-radius:6px;font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;color:${T.txt3};letter-spacing:.8px;text-transform:uppercase;cursor:pointer;border:1px solid transparent;transition:all .15s;white-space:nowrap}
.mrp-tab:hover{color:${T.txt2};background:${T.up}}
.mrp-tab.on{background:rgba(0,229,192,.08);border-color:rgba(0,229,192,.25);color:${T.teal}}

/* BODY */
.mrp-body{flex:1;display:flex;overflow:hidden}

/* CATEGORY RAIL */
.cat-rail{width:152px;flex-shrink:0;border-right:1px solid ${T.border};overflow-y:auto;padding:6px;display:flex;flex-direction:column;gap:3px;background:${T.panel}}
.cat-btn{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:10px 6px;border-radius:10px;cursor:pointer;border:1px solid transparent;transition:all .18s;text-align:center;position:relative;min-height:60px}
.cat-btn:hover{background:${T.up};border-color:${T.border}}
.cat-btn.on{background:rgba(0,229,192,.05);border-color:rgba(0,229,192,.3)}
.cat-btn.on::after{content:'';position:absolute;right:-1px;top:14px;bottom:14px;width:3px;background:${T.teal};border-radius:3px 0 0 3px}
.cat-ico{font-size:20px;line-height:1}
.cat-nm{font-size:10px;font-weight:600;color:${T.txt2};line-height:1.2}
.cat-btn.on .cat-nm{color:${T.teal}}
.cat-ct{font-family:'JetBrains Mono',monospace;font-size:9px;color:${T.txt4}}

/* DRUG LIST */
.drug-list{flex:1;overflow-y:auto;padding:12px 16px}
.dlh{display:flex;align-items:center;gap:10px;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid rgba(26,53,85,.4)}
.dlh-ico{font-size:18px}
.dlh-nm{font-family:'Playfair Display',serif;font-size:15px;font-weight:700;color:${T.txt}}
.dlh-ct{font-family:'JetBrains Mono',monospace;font-size:10px;color:${T.txt3}}
.dr{padding:10px 14px;border-radius:8px;margin-bottom:5px;background:${T.up};border:1px solid rgba(26,53,85,.4);cursor:pointer;transition:all .12s}
.dr:hover{border-color:${T.border};background:${T.card}}
.dr.ex{border-color:${T.borderHi};background:${T.card}}
.dr-top{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}
.dr-left{display:flex;align-items:center;gap:8px;flex:1;min-width:0}
.dr-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;margin-top:4px}
.dr-info{flex:1;min-width:0}
.dr-nm{font-weight:600;color:${T.txt};font-size:13px}
.dr-ds{margin-top:2px;font-family:'JetBrains Mono',monospace;font-size:11px;color:${T.teal};font-weight:600}
.dr-badges{display:flex;gap:4px;flex-wrap:wrap;flex-shrink:0}
.dr-det{margin-top:10px;padding-top:10px;border-top:1px solid rgba(26,53,85,.4);display:flex;flex-direction:column;gap:8px}
.dr-notes{font-size:12px;color:${T.txt2};line-height:1.65;background:${T.bg};padding:9px 12px;border-radius:6px;border-left:3px solid ${T.borderHi}}
.dr-sect-lbl{font-family:'JetBrains Mono',monospace;font-size:8px;color:${T.txt4};letter-spacing:2.5px;text-transform:uppercase;margin-bottom:3px}

/* BADGES */
.b{display:inline-block;padding:2px 7px;border-radius:4px;font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:600;letter-spacing:.4px}
.b-t{background:rgba(0,229,192,.1);border:1px solid rgba(0,229,192,.2);color:${T.teal}}
.b-g{background:rgba(245,200,66,.1);border:1px solid rgba(245,200,66,.2);color:${T.gold}}
.b-b{background:rgba(59,158,255,.1);border:1px solid rgba(59,158,255,.2);color:${T.blue}}
.b-o{background:rgba(255,159,67,.1);border:1px solid rgba(255,159,67,.2);color:${T.orange}}
.b-hi{background:rgba(255,107,107,.12);border:1px solid rgba(255,107,107,.25);color:${T.coral}}
.b-p{background:rgba(155,109,255,.12);border:1px solid rgba(155,109,255,.25);color:${T.purple}}

/* FULL PANE */
.full-pane{flex:1;overflow-y:auto;padding:16px 20px}
.section-box{background:${T.panel};border:1px solid ${T.border};border-radius:12px;padding:14px 16px;margin-bottom:12px}
.mr-lbl{font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:600;color:${T.txt4};letter-spacing:3px;text-transform:uppercase;margin-bottom:8px}
.field-input{background:${T.up};border:1px solid ${T.border};border-radius:6px;padding:8px 12px;color:${T.txt};font-size:13px;font-family:'DM Sans',sans-serif;outline:none;width:100%;transition:border-color .15s}
.field-input:focus{border-color:${T.blue}}
.field-input::placeholder{color:${T.txt4}}
.field-select{background:${T.up};border:1px solid ${T.border};border-radius:6px;padding:8px 12px;color:${T.txt};font-size:12px;font-family:'DM Sans',sans-serif;outline:none;cursor:pointer;width:100%}

/* PEDS */
.wbar{display:flex;align-items:center;gap:14px;padding:10px 14px;background:rgba(0,229,192,.04);border:1px solid rgba(0,229,192,.12);border-radius:12px;margin-bottom:12px;flex-wrap:wrap}
.wv{font-size:26px;font-weight:700;color:${T.teal};font-family:'JetBrains Mono',monospace}
.cstat{background:${T.up};border-radius:6px;padding:5px 10px;text-align:center;border:1px solid ${T.border}}
.csv{font-size:13px;font-weight:700;font-family:'JetBrains Mono',monospace}
.csl{font-size:7px;letter-spacing:.08em;text-transform:uppercase;color:${T.txt3};margin-top:1px}
.bzb{padding:3px 10px;border-radius:5px;font-size:11px;font-weight:700;font-family:'JetBrains Mono',monospace;margin-left:auto}
.rmax{font-size:8px;padding:1px 6px;border-radius:3px;background:rgba(245,200,66,.1);color:${T.gold};font-weight:700;margin-left:4px}
.sol-card{background:${T.panel};border:1px solid ${T.border};border-radius:12px;padding:14px 16px;margin-bottom:8px}
.sol-vol{padding:8px 12px;border-radius:8px;margin-top:6px;background:rgba(59,158,255,.06);border:1px solid rgba(59,158,255,.2);display:flex;align-items:baseline;gap:8px}

/* SEPSIS */
.sep-chk{display:flex;align-items:center;gap:10px;padding:7px 12px;border-radius:6px;margin-bottom:3px;font-size:12px;cursor:pointer;transition:all .12s;user-select:none}
.sep-chk.crit{background:rgba(255,107,107,.04);border:1px solid rgba(255,107,107,.1)}
.sep-chk.norm{background:${T.up};border:1px solid rgba(26,53,85,.4)}
.sep-chk.done-chk .stxt{text-decoration:line-through;color:${T.txt3} !important}

/* AI RESPONSE */
.ai-resp{padding:14px 16px;background:${T.card};border-radius:12px;border:1px solid ${T.border};font-size:12px;line-height:1.75;color:${T.txt2}}
.ai-resp h2{font-family:'Playfair Display',serif;font-size:14px;font-weight:700;color:${T.txt};margin:14px 0 6px;padding-bottom:4px;border-bottom:1px solid ${T.border}}
.ai-resp h3{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;color:${T.teal};letter-spacing:1.5px;text-transform:uppercase;margin:12px 0 4px}
.ai-resp li{margin-left:16px;margin-bottom:3px;color:${T.txt2}}
.ai-resp strong{color:${T.txt}}
.ai-resp-warn{padding:8px 12px;border-radius:6px;font-size:10px;line-height:1.5;background:rgba(255,107,107,.04);border-left:3px solid ${T.coral};color:rgba(255,107,107,.65);margin-top:8px}

/* BUTTONS */
.btn-ghost{background:${T.up};border:1px solid ${T.border};border-radius:6px;padding:4px 10px;font-size:11px;color:${T.txt2};cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;gap:4px;white-space:nowrap;font-family:'DM Sans',sans-serif}
.btn-ghost:hover{border-color:${T.borderHi};color:${T.txt}}
.btn-primary{background:${T.teal};color:${T.bg};border:none;border-radius:6px;padding:7px 18px;font-size:12px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:filter .15s}
.btn-primary:hover{filter:brightness(1.1)}
.btn-primary:disabled{opacity:.4;cursor:default}
.btn-coral{background:rgba(255,107,107,.15);color:${T.coral};border:1px solid rgba(255,107,107,.3);border-radius:6px;padding:7px 18px;font-size:12px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif}
.btn-coral:hover{background:rgba(255,107,107,.25)}
.btn-coral:disabled{opacity:.4;cursor:default}

/* LOADER */
.ai-loader{display:flex;gap:5px;padding:12px 0;align-items:center}
.ai-loader span{width:7px;height:7px;border-radius:50%;background:${T.teal};animation:mrpbounce 1.2s ease-in-out infinite}
.ai-loader span:nth-child(2){animation-delay:.2s}
.ai-loader span:nth-child(3){animation-delay:.4s}
@keyframes mrpbounce{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-6px);opacity:1}}
.ai-loader-txt{font-family:'JetBrains Mono',monospace;font-size:9px;color:${T.txt3};letter-spacing:2px;text-transform:uppercase;margin-left:10px}

.no-data{text-align:center;padding:40px;color:${T.txt3}}
.no-data-i{font-size:32px;margin-bottom:8px}
.no-data-t{font-size:13px}
.mrp ::-webkit-scrollbar{width:4px}
.mrp ::-webkit-scrollbar-thumb{background:${T.border};border-radius:2px}
@media(max-width:900px){.cat-rail{width:56px}.cat-nm,.cat-ct{display:none}.cat-btn{min-height:48px;padding:8px 4px}.mrp-sub{display:none}}
`;

/* ─── ED DRUG DATA ─── */
const ED_CATS = {
  chestPain:{ label:"Chest Pain / ACS", icon:"🫀", drugs:[
    {name:"Aspirin",dose:"325 mg",route:"PO",cls:"Antiplatelet",onset:"15-30 min",notes:"Chew immediately. Non-enteric coated preferred."},
    {name:"Nitroglycerin",dose:"0.4 mg SL",route:"SL",cls:"Vasodilator",onset:"1-3 min",notes:"Repeat q5min x3. Hold if SBP <90. Avoid with PDE5 inhibitors within 24-48h."},
    {name:"Heparin",dose:"60 U/kg bolus (max 4000U)",route:"IV",cls:"Anticoagulant",onset:"Immediate",notes:"Check aPTT at 6h. Target 1.5-2.5x control."},
    {name:"Morphine",dose:"2-4 mg IV",route:"IV",cls:"Opioid Analgesic",onset:"5-10 min",notes:"Use with caution — may increase mortality in NSTEMI."},
    {name:"Ticagrelor",dose:"180 mg loading",route:"PO",cls:"P2Y12 Inhibitor",onset:"30 min",notes:"Preferred per AHA guidelines. Avoid with strong CYP3A4 inhibitors."},
    {name:"Clopidogrel",dose:"600 mg loading",route:"PO",cls:"P2Y12 Inhibitor",onset:"2-6 hrs",notes:"Alternative if ticagrelor contraindicated."},
    {name:"Metoprolol",dose:"5 mg IV q5min ×3",route:"IV/PO",cls:"Beta-Blocker",onset:"5 min IV",notes:"Hold if HR <60, SBP <100. Avoid in cocaine-related chest pain."},
  ]},
  anaphylaxis:{ label:"Anaphylaxis", icon:"⚠️", drugs:[
    {name:"Epinephrine 1:1000",dose:"0.3-0.5 mg IM",route:"IM",cls:"Sympathomimetic",onset:"3-5 min",notes:"FIRST-LINE. Repeat q5-15min. Do NOT delay. Auto-injector or vial."},
    {name:"Diphenhydramine",dose:"25-50 mg IV/IM",route:"IV/IM",cls:"Antihistamine",onset:"15-30 min",notes:"H1-blocker adjunct. NOT a replacement for epinephrine."},
    {name:"Famotidine",dose:"20 mg IV",route:"IV",cls:"H2 Blocker",onset:"15-30 min",notes:"H2-blocker adjunct. Synergistic with diphenhydramine."},
    {name:"Methylprednisolone",dose:"125 mg IV",route:"IV",cls:"Corticosteroid",onset:"4-6 hrs",notes:"Prevents biphasic reaction. Not immediate benefit."},
    {name:"Albuterol",dose:"2.5 mg nebulized",route:"Neb",cls:"Beta-2 Agonist",onset:"5-15 min",notes:"For bronchospasm refractory to epinephrine."},
    {name:"Normal Saline",dose:"1-2 L bolus",route:"IV",cls:"Crystalloid",onset:"Immediate",notes:"For hypotension refractory to epinephrine. Wide open."},
  ]},
  respiratory:{ label:"Respiratory / Asthma / COPD", icon:"🫁", drugs:[
    {name:"Albuterol",dose:"2.5 mg neb q20min ×3",route:"Neb",cls:"Beta-2 Agonist",onset:"5-15 min",notes:"Continuous neb for severe: 10-15 mg/hr."},
    {name:"Ipratropium",dose:"0.5 mg neb q20min ×3",route:"Neb",cls:"Anticholinergic",onset:"15-30 min",notes:"Add to albuterol in moderate-severe exacerbation."},
    {name:"Prednisone",dose:"40-60 mg PO",route:"PO",cls:"Corticosteroid",onset:"4-6 hrs",notes:"Give within 1 hour. 5-day course typical."},
    {name:"Magnesium Sulfate",dose:"2 g IV over 20 min",route:"IV",cls:"Bronchodilator",onset:"15-20 min",notes:"Severe exacerbation only. Monitor for hypotension."},
    {name:"BiPAP",dose:"IPAP 10-15, EPAP 5",route:"NIV",cls:"Ventilatory Support",onset:"Immediate",notes:"For COPD with respiratory acidosis. Avoid in pneumothorax."},
    {name:"Epinephrine 1:1000",dose:"0.3-0.5 mg IM/SQ",route:"IM",cls:"Sympathomimetic",onset:"3-5 min",notes:"Refractory bronchospasm. Last resort before intubation."},
  ]},
  seizures:{ label:"Seizures / Status Epilepticus", icon:"🧠", drugs:[
    {name:"Lorazepam",dose:"4 mg IV",route:"IV",cls:"Benzodiazepine",onset:"1-3 min",notes:"First-line for status. May repeat ×1 in 5-10 min. Max 8 mg."},
    {name:"Midazolam",dose:"10 mg IM",route:"IM",cls:"Benzodiazepine",onset:"3-5 min",notes:"No IV? RAMPART trial: IM midazolam ≥ IV lorazepam."},
    {name:"Levetiracetam",dose:"60 mg/kg IV (max 4500 mg)",route:"IV",cls:"Anticonvulsant",onset:"15-30 min",notes:"Second-line. Infuse over 15 min. Fewer drug interactions."},
    {name:"Fosphenytoin",dose:"20 mg PE/kg IV",route:"IV",cls:"Anticonvulsant",onset:"10-20 min",notes:"Max rate 150 mg PE/min. Monitor hypotension, arrhythmia."},
    {name:"Phenobarbital",dose:"20 mg/kg IV",route:"IV",cls:"Barbiturate",onset:"15-30 min",notes:"Third-line. Max rate 60 mg/min. Respiratory depression risk."},
  ]},
  pain:{ label:"Pain Management", icon:"💊", drugs:[
    {name:"Acetaminophen",dose:"1000 mg IV/PO",route:"IV/PO",cls:"Analgesic",onset:"15-30 min",notes:"First-line. Max 4 g/day (2 g if hepatic impairment)."},
    {name:"Ketorolac",dose:"15-30 mg IV",route:"IV",cls:"NSAID",onset:"10-15 min",notes:"Max 5 days. 15 mg if >65yo or renal impairment."},
    {name:"Morphine",dose:"0.1 mg/kg IV",route:"IV",cls:"Opioid",onset:"5-10 min",notes:"Titrate q10-15min. Accumulates in renal failure."},
    {name:"Fentanyl",dose:"1-1.5 mcg/kg IV",route:"IV",cls:"Opioid",onset:"2-3 min",notes:"Preferred in hemodynamic instability. No histamine release."},
    {name:"Ketamine",dose:"0.3 mg/kg IV (subdissociative)",route:"IV",cls:"NMDA Antagonist",onset:"1-2 min",notes:"Push over 15 min to reduce dysphoria. Opioid-sparing."},
    {name:"Lidocaine 1%",dose:"Max 4.5 mg/kg",route:"Local",cls:"Local Anesthetic",onset:"2-5 min",notes:"Duration 30-60 min. Buffer with bicarb 1:10 to reduce sting."},
  ]},
  cardiac:{ label:"Cardiac Arrest / ACLS", icon:"⚡", drugs:[
    {name:"Epinephrine 1:10,000",dose:"1 mg IV/IO q3-5min",route:"IV/IO",cls:"Sympathomimetic",onset:"Immediate",notes:"Give early in non-shockable rhythms. Flush with 20 mL NS."},
    {name:"Amiodarone",dose:"300 mg IV, then 150 mg",route:"IV",cls:"Antiarrhythmic",onset:"Immediate",notes:"Refractory VF/pVT after 3rd shock. Drip 1 mg/min ×6h."},
    {name:"Lidocaine",dose:"1-1.5 mg/kg IV",route:"IV",cls:"Antiarrhythmic",onset:"1-2 min",notes:"Alternative to amiodarone. Max 3 mg/kg."},
    {name:"Atropine",dose:"1 mg IV q3-5min (max 3 mg)",route:"IV",cls:"Anticholinergic",onset:"1-2 min",notes:"Symptomatic bradycardia ONLY. NOT recommended in arrest."},
    {name:"Calcium Chloride 10%",dose:"1 g IV slow push",route:"IV",cls:"Electrolyte",onset:"1-3 min",notes:"For hyperkalemia, CCB OD, hypermagnesemia."},
    {name:"Sodium Bicarbonate",dose:"1 mEq/kg IV",route:"IV",cls:"Buffer",onset:"Immediate",notes:"For TCA OD, known hyperkalemia, or prolonged arrest."},
  ]},
  stroke:{ label:"Stroke / CVA", icon:"🩸", drugs:[
    {name:"Alteplase (tPA)",dose:"0.9 mg/kg IV (max 90 mg)",route:"IV",cls:"Thrombolytic",onset:"Immediate",notes:"10% bolus then remainder over 60 min. Within 4.5h. Strict BP control."},
    {name:"Tenecteplase",dose:"0.25 mg/kg IV (max 25 mg)",route:"IV",cls:"Thrombolytic",onset:"Immediate",notes:"Single bolus. Emerging evidence for LVO."},
    {name:"Labetalol",dose:"10-20 mg IV q10-20min",route:"IV",cls:"Beta-Blocker",onset:"5-10 min",notes:"Target BP <185/110 pre-tPA. Max 300 mg."},
    {name:"Nicardipine",dose:"5 mg/hr IV drip",route:"IV",cls:"CCB",onset:"5-15 min",notes:"Max 15 mg/hr. Better sustained BP control."},
    {name:"Aspirin",dose:"325 mg PO/PR",route:"PO/PR",cls:"Antiplatelet",onset:"15-30 min",notes:"Within 24-48h if tPA NOT given. Hold 24h post-tPA."},
  ]},
  sepsis:{ label:"Sepsis / Septic Shock", icon:"🦠", drugs:[
    {name:"Lactated Ringer's",dose:"30 mL/kg IV bolus",route:"IV",cls:"Crystalloid",onset:"Immediate",notes:"Preferred per SSC 2021. Less hyperchloremic acidosis."},
    {name:"Norepinephrine",dose:"0.1-0.5 mcg/kg/min",route:"IV drip",cls:"Vasopressor",onset:"Immediate",notes:"First-line vasopressor. Peripheral ok short-term."},
    {name:"Vancomycin",dose:"25-30 mg/kg IV",route:"IV",cls:"Antibiotic",onset:"1-2 hrs",notes:"Loading dose. Cover MRSA. Infuse over 1-2h."},
    {name:"Piperacillin-Tazobactam",dose:"4.5 g IV q6h",route:"IV",cls:"Antibiotic",onset:"30-60 min",notes:"Infuse over 4h (extended infusion) for better PK/PD."},
    {name:"Meropenem",dose:"1 g IV q8h",route:"IV",cls:"Antibiotic",onset:"30-60 min",notes:"For ESBL/resistant organisms. Infuse over 3h extended."},
    {name:"Hydrocortisone",dose:"100 mg IV q8h",route:"IV",cls:"Corticosteroid",onset:"1-2 hrs",notes:"Refractory septic shock despite fluid + vasopressors."},
  ]},
  overdose:{ label:"Overdose / Toxicology", icon:"☠️", drugs:[
    {name:"Naloxone",dose:"0.4-2 mg IV/IN",route:"IV/IN/IM",cls:"Opioid Antagonist",onset:"1-2 min IV",notes:"Titrate to respiratory effort. Short half-life — observe for renarcotization."},
    {name:"Activated Charcoal",dose:"1 g/kg PO (max 50 g)",route:"PO",cls:"Adsorbent",onset:"15-30 min",notes:"Within 1-2h. Protected airway. Avoid with caustics/hydrocarbons."},
    {name:"N-Acetylcysteine",dose:"150 mg/kg IV over 1h → 50 mg/kg over 4h → 100 mg/kg over 16h",route:"IV",cls:"Antidote",onset:"30-60 min",notes:"Acetaminophen OD. Give within 8h. Check Rumack-Matthew nomogram."},
    {name:"Flumazenil",dose:"0.2 mg IV q1min (max 3 mg)",route:"IV",cls:"Benzo Antagonist",onset:"1-2 min",notes:"AVOID in chronic benzo use, seizure hx, or TCA co-ingestion."},
    {name:"Sodium Bicarbonate",dose:"1-2 mEq/kg IV bolus",route:"IV",cls:"Buffer",onset:"1-5 min",notes:"TCA OD: target pH 7.50-7.55. For QRS widening >100 ms."},
    {name:"Intralipid 20%",dose:"1.5 mL/kg IV bolus",route:"IV",cls:"Lipid Emulsion",onset:"Immediate",notes:"Local anesthetic systemic toxicity (LAST). Last resort."},
  ]},
  psych:{ label:"Agitation / Psychiatric", icon:"🧘", drugs:[
    {name:"Haloperidol",dose:"5-10 mg IM",route:"IM",cls:"Antipsychotic",onset:"15-30 min",notes:"Check QTc. Avoid in elderly with dementia."},
    {name:"Olanzapine",dose:"10 mg IM",route:"IM",cls:"Atypical Antipsychotic",onset:"15-30 min",notes:"Do NOT combine with IM benzodiazepines — respiratory depression."},
    {name:"Midazolam",dose:"5 mg IM",route:"IM",cls:"Benzodiazepine",onset:"5-10 min",notes:"Severe agitation. Monitor for respiratory depression."},
    {name:"Droperidol",dose:"2.5-5 mg IM",route:"IM",cls:"Butyrophenone",onset:"5-10 min",notes:"Rapid onset, very effective. Check QTc."},
    {name:"Ketamine",dose:"4-5 mg/kg IM",route:"IM",cls:"NMDA Antagonist",onset:"3-5 min",notes:"Excited delirium / extreme agitation. Prepare for airway management."},
  ]},
};

/* ─── PEDS DATA ─── */
const PEDS = [
  {name:"Acetaminophen",mpk:15,mx:1000,route:"PO/PR",freq:"q4-6h",notes:"Avoid hepatic impairment.",sols:[{l:"Infant 100mg/mL",c:100,u:"mg/mL"},{l:"Children's 32mg/mL",c:32,u:"mg/mL"},{l:"Jr Tab 160mg",c:160,u:"mg/tab"}]},
  {name:"Ibuprofen",mpk:10,mx:400,route:"PO",freq:"q6-8h",notes:"Avoid <6 months.",sols:[{l:"Infant 40mg/mL",c:40,u:"mg/mL"},{l:"Children's 20mg/mL",c:20,u:"mg/mL"},{l:"Jr Tab 100mg",c:100,u:"mg/tab"}]},
  {name:"Amoxicillin",mpk:45,mx:1000,route:"PO",freq:"q12h",notes:"90 mg/kg/day for high-dose AOM.",sols:[{l:"125mg/5mL",c:25,u:"mg/mL"},{l:"250mg/5mL",c:50,u:"mg/mL"},{l:"400mg/5mL",c:80,u:"mg/mL"}]},
  {name:"Ondansetron",mpk:0.15,mx:4,route:"IV/PO",freq:"q6-8h",notes:"Safe >6 months. Check QTc.",sols:[{l:"ODT 4mg",c:4,u:"mg/tab"},{l:"Oral 0.8mg/mL",c:0.8,u:"mg/mL"},{l:"IV 2mg/mL",c:2,u:"mg/mL"}]},
  {name:"Dexamethasone",mpk:0.6,mx:16,route:"PO/IV",freq:"Daily ×1-2d",notes:"Croup 0.6 mg/kg ×1.",sols:[{l:"Oral 1mg/mL",c:1,u:"mg/mL"},{l:"IV 4mg/mL",c:4,u:"mg/mL"}]},
  {name:"Prednisolone",mpk:1,mx:60,route:"PO",freq:"Daily ×3-5d",notes:"Asthma exacerbation.",sols:[{l:"Prelone 3mg/mL",c:3,u:"mg/mL"},{l:"Pediapred 1mg/mL",c:1,u:"mg/mL"}]},
  {name:"Epinephrine (IM)",mpk:0.01,mx:0.3,route:"IM",freq:"q5-15min PRN",notes:"Always anterolateral thigh. Do not delay.",sols:[{l:"1:1000 1mg/mL",c:1,u:"mg/mL"},{l:"EpiPen Jr 0.15mg",c:0.15,u:"mg/dose"},{l:"EpiPen 0.3mg",c:0.3,u:"mg/dose"}]},
  {name:"Albuterol Neb",mpk:0.15,mx:5,route:"Neb",freq:"q20min ×3",notes:"Continuous 0.5 mg/kg/hr severe.",sols:[{l:"5mg/mL",c:5,u:"mg/mL"},{l:"Unit dose 2.5mg/3mL",c:0.83,u:"mg/mL"}]},
  {name:"Ceftriaxone",mpk:50,mx:2000,route:"IV/IM",freq:"q24h",notes:"Avoid neonates + hyperbilirubinemia.",sols:[{l:"IV 100mg/mL",c:100,u:"mg/mL"},{l:"IM 250mg/mL",c:250,u:"mg/mL"}]},
  {name:"Midazolam (Seizure)",mpk:0.2,mx:10,route:"IN/IM/IV",freq:"×1, may repeat",notes:"IN: split between nares.",sols:[{l:"5mg/mL IM/IN",c:5,u:"mg/mL"},{l:"1mg/mL IV",c:1,u:"mg/mL"}]},
  {name:"Diphenhydramine",mpk:1.25,mx:50,route:"PO/IV",freq:"q6h",notes:"Paradoxical excitability in young children.",sols:[{l:"Elixir 2.5mg/mL",c:2.5,u:"mg/mL"},{l:"Chew 12.5mg",c:12.5,u:"mg/tab"},{l:"IV 50mg/mL",c:50,u:"mg/mL"}]},
];

/* ─── SEPSIS DATA ─── */
const H1 = [
  {a:"Measure lactate level",crit:true},
  {a:"Obtain blood cultures before antibiotics",crit:true},
  {a:"Administer broad-spectrum antibiotics",crit:true},
  {a:"Begin 30 mL/kg crystalloid (hypotension or lactate ≥4)",crit:true},
  {a:"Apply vasopressors if hypotensive during/after resuscitation (MAP ≥65)",crit:false},
];
const REASSES = [
  {a:"Reassess volume status and tissue perfusion",crit:true},
  {a:"Re-measure lactate if initial lactate elevated",crit:false},
  {a:"Assess for organ dysfunction (SOFA score)",crit:false},
];

/* ─── HELPERS ─── */
function estWt(mo) {
  if (mo < 3) return 3.5 + mo * 0.9;
  if (mo < 12) return 6 + (mo - 3) * 0.5;
  const y = mo / 12;
  return y <= 2 ? 10 + (y - 1) * 2.5 : y * 3 + 7;
}
function getBroselow(w) {
  const zones=[{mx:5,z:'Grey',h:'#9ca3af'},{mx:7,z:'Pink',h:'#ec4899'},{mx:9,z:'Red',h:'#ef4444'},{mx:11,z:'Purple',h:'#8b5cf6'},{mx:14,z:'Yellow',h:'#eab308'},{mx:18,z:'White',h:'#e2e8f0'},{mx:23,z:'Blue',h:'#3b82f6'},{mx:29,z:'Orange',h:'#f97316'},{mx:36,z:'Green',h:'#22c55e'},{mx:999,z:'Adult',h:'#6b7280'}];
  return zones.find(z=>w<z.mx) || zones[zones.length-1];
}
function etTube(w) {
  if(w<3) return '2.5'; if(w<5) return '3.0';
  return (Math.round((w/4+4)*2)/2).toFixed(1);
}

function renderAiText(text) {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    if (line.startsWith('## ') || line.startsWith('# ')) {
      return <h2 key={i}>{line.replace(/^#+\s/,'')}</h2>;
    }
    if (line.startsWith('### ')) {
      return <h3 key={i}>{line.replace(/^###\s/,'')}</h3>;
    }
    if (line.match(/^[-*•]\s/)) {
      const content = line.replace(/^[-*•]\s/,'').replace(/\*\*(.*?)\*\*/g, '**$1**');
      return <li key={i} dangerouslySetInnerHTML={{__html: line.replace(/^[-*•]\s/,'').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')}} />;
    }
    if (line.trim() === '') return <div key={i} style={{height:6}} />;
    return <div key={i} dangerouslySetInnerHTML={{__html: line.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')}} />;
  });
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════ */
export default function MedicationReference({ embedded = false }) {
  const [tab, setTab] = useState('edref');
  const [dbMeds, setDbMeds] = useState([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [dbSearch, setDbSearch] = useState('');
  const [dbCat, setDbCat] = useState('all');
  const [dbExpanded, setDbExpanded] = useState(null);

  // ED Drug Ref
  const [edCat, setEdCat] = useState('chestPain');
  const [edSearch, setEdSearch] = useState('');
  const [edExpanded, setEdExpanded] = useState(null);

  // Peds
  const [pedAge, setPedAge] = useState('');
  const [pedUnit, setPedUnit] = useState('months');
  const [pedWt, setPedWt] = useState('');
  const [pedSols, setPedSols] = useState({});

  // AI
  const [aiQuery, setAiQuery] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Sepsis
  const [sepWt, setSepWt] = useState('');
  const [sepQuery, setSepQuery] = useState('');
  const [sepResult, setSepResult] = useState('');
  const [sepLoading, setSepLoading] = useState(false);
  const [sepChecked, setSepChecked] = useState({});

  useEffect(() => {
    base44.entities.Medication.list('-name', 300).then(data => {
      setDbMeds(data || []);
    }).catch(() => {}).finally(() => setDbLoading(false));
  }, []);

  // DB categories
  const dbCategories = useMemo(() => {
    const map = {};
    dbMeds.forEach(m => {
      const c = m.category || 'Other';
      if (!map[c]) map[c] = [];
      map[c].push(m);
    });
    return map;
  }, [dbMeds]);

  const dbCatList = useMemo(() => ['all', ...Object.keys(dbCategories).sort()], [dbCategories]);

  const dbFiltered = useMemo(() => {
    let meds = dbCat === 'all' ? dbMeds : (dbCategories[dbCat] || []);
    if (dbSearch.trim()) {
      const q = dbSearch.toLowerCase();
      meds = dbMeds.filter(m =>
        m.name?.toLowerCase().includes(q) ||
        m.drugClass?.toLowerCase().includes(q) ||
        m.brand?.toLowerCase().includes(q) ||
        (typeof m.indications === 'string' && m.indications.toLowerCase().includes(q))
      );
    }
    return meds;
  }, [dbMeds, dbCategories, dbCat, dbSearch]);

  // ED Drug search
  const edFiltered = useMemo(() => {
    if (!edSearch.trim()) return null;
    const q = edSearch.toLowerCase();
    const results = [];
    Object.entries(ED_CATS).forEach(([k, cat]) => {
      cat.drugs.forEach((d, i) => {
        if (d.name.toLowerCase().includes(q) || d.cls.toLowerCase().includes(q) || d.notes.toLowerCase().includes(q) || cat.label.toLowerCase().includes(q)) {
          results.push({...d, catKey: k, catLabel: cat.label, catIcon: cat.icon, idx: i});
        }
      });
    });
    return results;
  }, [edSearch]);

  const weight = useMemo(() => {
    if (pedWt) return parseFloat(pedWt) || null;
    if (!pedAge) return null;
    const mo = pedUnit === 'years' ? parseFloat(pedAge) * 12 : parseFloat(pedAge);
    if (isNaN(mo) || mo < 0) return null;
    return Math.round(estWt(mo) * 10) / 10;
  }, [pedAge, pedUnit, pedWt]);

  const bz = weight ? getBroselow(weight) : null;

  const handleAI = async () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true); setAiResult('');
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an emergency medicine clinical decision support AI. Follow ACEP/AHA/SSC guidelines.\n\nED Complaint: ${aiQuery}\n\nProvide evidence-based medication recommendations with:\n## First-Line\n- Drug name, dose, route\n## Second-Line\n- Alternatives\n## Key Monitoring\n- Critical parameters\n## ⚠ Critical Safety\n- Contraindications\n\n**Clinical judgment should always prevail.**`
      });
      setAiResult(typeof res === 'string' ? res : JSON.stringify(res));
    } catch {
      setAiResult('⚠ AI Engine offline. Refer to the ED Drug Reference tab for medication guidance.');
    }
    setAiLoading(false);
  };

  const handleSepsis = async () => {
    const w = parseFloat(sepWt);
    if (!w) return;
    setSepLoading(true); setSepResult('');
    const bolus = (w * 30).toFixed(0);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Sepsis Protocol AI. Surviving Sepsis Campaign 2021.\n\nPatient Weight: ${w} kg\nFluid Bolus: ${bolus} mL (30 mL/kg)${sepQuery ? `\nSuspected Source: ${sepQuery}` : ''}\n\nProvide complete sepsis management:\n## Fluid Resuscitation\n## Antibiotic Recommendations\n## Vasopressors\n## Monitoring\n## ⚠ Critical Warnings\n\n**Clinical judgment should always prevail.**`
      });
      setSepResult(typeof res === 'string' ? res : JSON.stringify(res));
    } catch {
      const vLo = (w*25).toFixed(0), vHi = (w*30).toFixed(0);
      setSepResult(`⚠ AI Engine offline.\n\n## Manual Protocol\n- **Fluid Bolus:** ${bolus} mL (30 mL/kg × ${w} kg)\n- **Vancomycin:** ${vLo}–${vHi} mg IV over 1-2h\n- **Pip-Tazo:** 4.5 g IV q6h (extended infusion 4h)\n- **Norepinephrine:** 0.1–0.5 mcg/kg/min if MAP <65\n- **Remeasure lactate** in 2-4 hours`);
    }
    setSepLoading(false);
  };

  const toggleSep = (k) => setSepChecked(p => ({...p,[k]:!p[k]}));

  const TABS = [['edref','ED Drug Ref'],['peds','Peds Dosing'],['ai','AI Search'],['sepsis','Sepsis Protocol']];

  return (
    <>
      <style>{CSS}</style>
      <div className="mrp">

        {/* HEADER */}
        <div className="mrp-hdr">
          {!embedded && (
            <Link to="/" className="mrp-back">← Back</Link>
          )}
          <div className="mrp-title-wrap">
            <div className="mrp-logo">Mr</div>
            <div>
              <div className="mrp-title">💊 ED Medication Reference</div>
              <div className="mrp-sub">Drugs_DB · ACEP Guidelines · Notrya V3</div>
            </div>
          </div>

          {/* Search only for ED Drug Ref tab */}
          {tab === 'edref' && (
            <div className="mrp-search" style={{marginLeft:16}}>
              <span style={{color:T.txt3,fontSize:14}}>🔍</span>
              <input
                placeholder="Search all drugs, classes..."
                value={edSearch}
                onChange={e => { setEdSearch(e.target.value); setEdExpanded(null); }}
              />
              {edSearch && <span style={{cursor:'pointer',color:T.txt3,fontSize:13}} onClick={() => setEdSearch('')}>✕</span>}
            </div>
          )}

          <div className="mrp-tabs">
            {TABS.map(([id, lbl]) => (
              <div key={id} className={`mrp-tab${tab===id?' on':''}`} onClick={() => setTab(id)}>{lbl}</div>
            ))}
          </div>
        </div>

        {/* BODY */}
        <div className="mrp-body">

          {/* ══ TAB: ED DRUG REF ══ */}
          {tab === 'edref' && (
            <>
              {/* Category Rail (hidden when searching) */}
              {!edSearch && (
                <div className="cat-rail">
                  {Object.entries(ED_CATS).map(([k, cat]) => (
                    <div key={k} className={`cat-btn${edCat===k?' on':''}`} onClick={() => { setEdCat(k); setEdExpanded(null); }}>
                      <div className="cat-ico">{cat.icon}</div>
                      <div className="cat-nm">{cat.label}</div>
                      <div className="cat-ct">{cat.drugs.length}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Drug List */}
              <div className="drug-list">
                {edSearch ? (
                  <>
                    <div className="dlh">
                      <span className="dlh-ico">🔍</span>
                      <span className="dlh-nm">Search Results</span>
                      <span className="dlh-ct">{edFiltered?.length || 0} drugs</span>
                    </div>
                    {(edFiltered || []).length === 0 && <div className="no-data"><div className="no-data-i">🔍</div><div className="no-data-t">No drugs found</div></div>}
                    {(edFiltered || []).map((d, idx) => {
                      const key = `${d.catKey}-${d.idx}`;
                      const isX = edExpanded === key;
                      return (
                        <DrugRow key={key} d={d} isX={isX} onToggle={() => setEdExpanded(isX ? null : key)}
                          extra={<span className="b b-p" style={{marginLeft:4,fontSize:8}}>{d.catLabel}</span>} />
                      );
                    })}
                  </>
                ) : (
                  <>
                    <div className="dlh">
                      <span className="dlh-ico">{ED_CATS[edCat].icon}</span>
                      <span className="dlh-nm">{ED_CATS[edCat].label}</span>
                      <span className="dlh-ct">{ED_CATS[edCat].drugs.length} drugs</span>
                    </div>
                    {ED_CATS[edCat].drugs.map((d, i) => {
                      const key = `${edCat}-${i}`;
                      const isX = edExpanded === key;
                      return <DrugRow key={key} d={d} isX={isX} onToggle={() => setEdExpanded(isX ? null : key)} />;
                    })}
                  </>
                )}
              </div>
            </>
          )}

          {/* ══ TAB: PEDS ══ */}
          {tab === 'peds' && (
            <div className="full-pane">
              <div className="section-box">
                <div className="mr-lbl">Patient Parameters</div>
                <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
                  <input className="field-input" type="number" min="0" placeholder="Age..." value={pedAge} onChange={e=>setPedAge(e.target.value)} style={{width:90}} />
                  <select className="field-select" value={pedUnit} onChange={e=>setPedUnit(e.target.value)} style={{width:100}}>
                    <option value="months">months</option>
                    <option value="years">years</option>
                  </select>
                  <input className="field-input" type="number" min="0" step="0.1" placeholder="Override weight (kg)" value={pedWt} onChange={e=>setPedWt(e.target.value)} style={{flex:1,minWidth:170}} />
                </div>
              </div>

              {weight && bz ? (
                <>
                  <div className="wbar">
                    <div>
                      <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:8,color:T.txt4,letterSpacing:'2px',marginBottom:2}}>WEIGHT</div>
                      <div style={{display:'flex',alignItems:'baseline',gap:5}}>
                        <span className="wv">{weight}</span>
                        <span style={{fontSize:12,color:T.txt2}}>kg</span>
                        {!pedWt && <span style={{fontSize:9,color:T.txt3}}>(est.)</span>}
                      </div>
                    </div>
                    <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                      <div className="cstat"><div className="csv" style={{color:T.teal}}>{etTube(weight)} mm</div><div className="csl">ET Tube</div></div>
                      <div className="cstat"><div className="csv" style={{color:T.gold}}>{Math.min(weight*2,120)} J</div><div className="csl">Defib 2J/kg</div></div>
                      <div className="cstat"><div className="csv" style={{color:T.purple}}>{(weight*0.01).toFixed(2)} mg</div><div className="csl">Epi Arrest</div></div>
                      <div className="cstat"><div className="csv" style={{color:T.blue}}>{(weight*0.1).toFixed(1)} mg</div><div className="csl">Atropine</div></div>
                    </div>
                    <div className="bzb" style={{background:bz.h+'22',color:bz.h,border:`1px solid ${bz.h}44`}}>● {bz.z}</div>
                  </div>

                  {PEDS.map((d, idx) => {
                    const raw = weight * d.mpk;
                    const fin = Math.min(raw, d.mx);
                    const cap = raw > d.mx;
                    const si = pedSols[d.name];
                    let vol = null;
                    if (si !== undefined && d.sols[si]) {
                      const s = d.sols[si];
                      const isTab = s.u === 'mg/tab' || s.u === 'mg/dose';
                      vol = {v:(fin/s.c).toFixed(2), u: isTab ? (s.u==='mg/tab'?'tab(s)':'dose(s)') : 'mL'};
                    }
                    return (
                      <div key={idx} className="sol-card">
                        <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:6}}>
                          <div>
                            <div style={{fontFamily:'Playfair Display,serif',fontSize:13,fontWeight:700,color:T.txt}}>{d.name}</div>
                            <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:10,color:T.txt3,marginTop:2}}>{d.mpk} mg/kg · {d.route} · {d.freq}</div>
                          </div>
                          <div style={{display:'flex',gap:4}}><span className="b b-t">{d.route}</span><span className="b b-o">Max {d.mx}mg</span></div>
                        </div>
                        {/* Dose bar */}
                        <div style={{padding:'8px 12px',borderRadius:8,marginTop:8,background:cap?'rgba(245,200,66,.06)':'rgba(0,229,192,.06)',border:`1px solid ${cap?'rgba(245,200,66,.18)':'rgba(0,229,192,.18)'}`}}>
                          <div style={{display:'flex',alignItems:'baseline',gap:8,flexWrap:'wrap'}}>
                            <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:8,color:T.txt4,letterSpacing:'2px'}}>DOSE</span>
                            <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:20,fontWeight:800,color:cap?T.gold:T.teal}}>{fin.toFixed(1)} mg</span>
                            {cap && <span className="rmax">MAX DOSE</span>}
                          </div>
                          <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:9,color:T.txt3,marginTop:3}}>{d.mpk} mg/kg × {weight} kg{cap?' — dose capped':''}</div>
                        </div>
                        {/* Formulation */}
                        <div style={{marginTop:10}}>
                          <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:8,color:T.txt4,letterSpacing:'2px',marginBottom:4}}>FORMULATION</div>
                          <select className="field-select" value={si !== undefined ? si : ''} onChange={e => setPedSols(p=>({...p,[d.name]:e.target.value===''?undefined:parseInt(e.target.value)}))}>
                            <option value="">— Select Strength —</option>
                            {d.sols.map((s,si) => <option key={si} value={si}>{s.l}</option>)}
                          </select>
                          {vol && (
                            <div className="sol-vol">
                              <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:8,color:T.txt4,letterSpacing:'2px'}}>VOLUME</span>
                              <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:18,fontWeight:800,color:T.blue}}>{vol.v} {vol.u}</span>
                            </div>
                          )}
                        </div>
                        <div style={{marginTop:8,fontSize:10,color:T.txt3,fontStyle:'italic',background:T.bg,padding:'6px 8px',borderRadius:4}}>{d.notes}</div>
                      </div>
                    );
                  })}
                </>
              ) : (
                <div className="no-data"><div className="no-data-i">⚖️</div><div className="no-data-t">Enter patient age or weight above</div></div>
              )}
            </div>
          )}

          {/* ══ TAB: AI SEARCH ══ */}
          {tab === 'ai' && (
            <div className="full-pane">
              <div className="section-box">
                <div className="mr-lbl">AI Clinical Decision Support</div>
                <div style={{fontSize:12,color:T.txt2,marginBottom:12,lineHeight:1.6}}>Enter a chief complaint or clinical scenario for evidence-based medication recommendations following ACEP/AHA guidelines.</div>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  <input
                    className="field-input"
                    placeholder="e.g. SVT, DKA, Croup, AFib with RVR, Hyperkalemia..."
                    value={aiQuery}
                    onChange={e => setAiQuery(e.target.value)}
                    onKeyDown={e => e.key==='Enter' && handleAI()}
                    style={{flex:1,minWidth:200}}
                  />
                  <button className="btn-primary" onClick={handleAI} disabled={aiLoading || !aiQuery.trim()}>
                    {aiLoading ? '...' : '⌘ Analyze'}
                  </button>
                </div>
                <div style={{marginTop:10,display:'flex',gap:5,flexWrap:'wrap'}}>
                  {['SVT','Migraine','DKA','Hyperkalemia','PE','Croup','RSI Intubation','NSTEMI','GI Bleed'].map(q => (
                    <button key={q} className="btn-ghost" style={{fontSize:9,padding:'2px 10px'}} onClick={() => setAiQuery(q)}>{q}</button>
                  ))}
                </div>
              </div>

              {aiLoading && (
                <div className="section-box">
                  <div className="ai-loader">
                    <span /><span /><span />
                    <span className="ai-loader-txt">PROCESSING · DRUGS_DB × GUIDELINES ENGINE</span>
                  </div>
                </div>
              )}

              {aiResult && !aiLoading && (
                <div className="section-box">
                  <div className="mr-lbl" style={{marginBottom:10}}>Clinical Recommendations — {aiQuery}</div>
                  <div className="ai-resp">{renderAiText(aiResult)}</div>
                  <div className="ai-resp-warn">⚠ AI-generated recommendations. Clinical judgment should always prevail. Verify all doses and contraindications. Not a substitute for clinical decision-making.</div>
                </div>
              )}
            </div>
          )}

          {/* ══ TAB: SEPSIS ══ */}
          {tab === 'sepsis' && (
            <div className="full-pane">
              {/* Banner */}
              <div className="section-box" style={{borderColor:'rgba(255,107,107,.2)',background:'rgba(255,107,107,.02)'}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <span style={{fontSize:24}}>🦠</span>
                  <div>
                    <div style={{fontFamily:'Playfair Display,serif',fontSize:17,fontWeight:700,color:T.coral}}>Sepsis Protocol</div>
                    <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:9,color:'rgba(255,107,107,.4)',letterSpacing:'2px',marginTop:2}}>SURVIVING SEPSIS CAMPAIGN 2021</div>
                  </div>
                </div>
              </div>

              {/* Weight & Fluid */}
              <div className="section-box">
                <div className="mr-lbl">Weight & Fluid Calculation</div>
                <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:10}}>
                  <input className="field-input" type="number" placeholder="Patient weight (kg)..." value={sepWt} onChange={e=>setSepWt(e.target.value)} style={{flex:1}} />
                  <span style={{color:T.txt3,fontFamily:'JetBrains Mono,monospace',fontWeight:600,whiteSpace:'nowrap'}}>kg</span>
                </div>
                {parseFloat(sepWt) > 0 && (
                  <div style={{padding:'12px 16px',borderRadius:10,background:'rgba(255,107,107,.04)',border:'1px solid rgba(255,107,107,.15)'}}>
                    <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:8,color:'rgba(255,107,107,.5)',letterSpacing:'2px',marginBottom:4}}>30 ML/KG BOLUS TARGET</div>
                    <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:30,fontWeight:800,color:T.coral}}>{(parseFloat(sepWt)*30).toFixed(0)} mL</div>
                    <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:9,color:T.txt4,marginTop:4}}>30 mL/kg × {sepWt} kg · Give within 3 hours</div>
                  </div>
                )}
              </div>

              {/* Hour-1 Bundle */}
              <div className="section-box">
                <div className="mr-lbl">Hour-1 Bundle</div>
                {H1.map((s, i) => {
                  const k = `h1-${i}`, done = sepChecked[k];
                  return (
                    <div key={i} className={`sep-chk ${s.crit?'crit':'norm'}${done?' done-chk':''}`} onClick={() => toggleSep(k)}>
                      <span style={{fontSize:14,fontWeight:700,width:20,textAlign:'center',color:done?T.teal:s.crit?T.coral:T.txt3,flexShrink:0}}>{done?'✓':s.crit?'!':'○'}</span>
                      <span className="stxt" style={{color:done?T.txt3:s.crit?T.txt:T.txt2}}>{s.a}</span>
                    </div>
                  );
                })}
              </div>

              {/* Weight-based meds */}
              {parseFloat(sepWt) > 0 && (() => {
                const w = parseFloat(sepWt);
                return (
                  <div className="section-box">
                    <div className="mr-lbl">Weight-Based Medications</div>
                    {[
                      {n:'Vancomycin',v:`${(w*25).toFixed(0)}–${(w*30).toFixed(0)} mg`,r:'IV',t:'Infuse over 1-2h'},
                      {n:'Norepinephrine',v:'0.1–0.5 mcg/kg/min',r:'IV drip',t:'First-line vasopressor'},
                      {n:'Hydrocortisone',v:'100 mg',r:'IV q8h',t:'Refractory shock only'},
                      {n:'Piperacillin-Tazobactam',v:'4.5 g',r:'IV q6h',t:'Extended infusion 4h'},
                    ].map((m, i) => (
                      <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 12px',background:T.up,border:`1px solid ${T.border}`,borderRadius:6,marginBottom:4,flexWrap:'wrap',gap:6}}>
                        <div>
                          <div style={{fontSize:13,fontWeight:700,color:T.txt}}>{m.n}</div>
                          <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:9,color:T.txt3}}>{m.r} · {m.t}</div>
                        </div>
                        <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:16,fontWeight:800,color:T.teal}}>{m.v}</div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* AI Advisor */}
              <div className="section-box">
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                  <span style={{width:7,height:7,borderRadius:'50%',background:T.coral,display:'inline-block',flexShrink:0}} />
                  <div className="mr-lbl" style={{margin:0}}>AI Sepsis Advisor</div>
                </div>
                <input className="field-input" placeholder="Suspected infection source (e.g. pneumonia, urinary, abdominal)..." value={sepQuery} onChange={e=>setSepQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSepsis()} style={{marginBottom:8}} />
                <button className="btn-coral" onClick={handleSepsis} disabled={sepLoading || !sepWt}>
                  {sepLoading ? '...' : '⌘ Generate Protocol'}
                </button>
                {!sepWt && <div style={{fontSize:10,color:'rgba(255,107,107,.5)',marginTop:6}}>⚠ Enter patient weight above first</div>}
                {sepLoading && (
                  <div className="ai-loader" style={{marginTop:10}}>
                    <span /><span /><span />
                    <span className="ai-loader-txt">SEPSIS ENGINE · SSC 2021 × DRUGS_DB</span>
                  </div>
                )}
                {sepResult && !sepLoading && (
                  <>
                    <div className="ai-resp" style={{marginTop:12}}>{renderAiText(sepResult)}</div>
                    <div className="ai-resp-warn">⚠ AI-generated protocol. Clinical judgment should always prevail. Follow institutional sepsis protocols.</div>
                  </>
                )}
              </div>

              {/* Reassessment */}
              <div className="section-box">
                <div className="mr-lbl">Reassessment Checklist</div>
                {REASSES.map((s, i) => {
                  const k = `re-${i}`, done = sepChecked[k];
                  return (
                    <div key={i} className={`sep-chk ${s.crit?'crit':'norm'}${done?' done-chk':''}`} onClick={() => toggleSep(k)}>
                      <span style={{fontSize:14,fontWeight:700,width:20,textAlign:'center',color:done?T.teal:s.crit?T.coral:T.txt3,flexShrink:0}}>{done?'✓':s.crit?'!':'○'}</span>
                      <span className="stxt" style={{color:done?T.txt3:s.crit?T.txt:T.txt2}}>{s.a}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ─── DRUG ROW COMPONENT ─── */
function DrugRow({ d, isX, onToggle, extra }) {
  return (
    <div className={`dr${isX?' ex':''}`} onClick={onToggle}>
      <div className="dr-top">
        <div className="dr-left">
          <span className="dr-dot" style={{background:isX?'#00e5c0':'#2e4a6a',boxShadow:isX?'0 0 6px #00e5c0':'none'}} />
          <div className="dr-info">
            <div style={{display:'flex',alignItems:'center',gap:4,flexWrap:'wrap'}}>
              <span className="dr-nm">{d.name}</span>
              {extra}
            </div>
            <div className="dr-ds">{d.dose}</div>
          </div>
        </div>
        <div className="dr-badges">
          <span className="b b-t">{d.route}</span>
          <span className="b b-g">{d.onset}</span>
        </div>
      </div>
      {isX && (
        <div className="dr-det">
          <span className="b b-b">{d.cls}</span>
          <div>
            <div className="dr-sect-lbl">Clinical Notes</div>
            <div className="dr-notes">{d.notes}</div>
          </div>
        </div>
      )}
    </div>
  );
}