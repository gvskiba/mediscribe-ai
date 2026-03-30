import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PDMPQueryPanel from "@/components/erx/PDMPQueryPanel";

// ── Font + CSS Injection ───────────────────────────────────────────
(() => {
  if (document.getElementById("erx-fonts")) return;
  const l = document.createElement("link"); l.id = "erx-fonts";
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "erx-css";
  s.textContent = `
    @keyframes erx-in    { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    @keyframes erx-chip  { from{opacity:0;transform:scale(.9)} to{opacity:1;transform:scale(1)} }
    @keyframes erx-pulse { 0%,100%{opacity:.6} 50%{opacity:1} }
    @keyframes erx-spin  { to{transform:rotate(360deg)} }
    @keyframes erx-shimmer{ 0%{background-position:-200% center}100%{background-position:200% center} }
    @keyframes erx-slide { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
    .erx-in    { animation: erx-in .3s ease forwards; }
    .erx-chip  { animation: erx-chip .18s cubic-bezier(.34,1.56,.64,1) forwards; }
    .erx-slide { animation: erx-slide .25s ease forwards; }
    .erx-hover { transition: all .16s ease; }
    .erx-hover:hover { transform: translateY(-1px); }
    .erx-shimmer {
      background: linear-gradient(90deg,#e8f0fe 0%,#fff 30%,#3b9eff 55%,#00e5c0 75%,#e8f0fe 100%);
      background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;
      background-clip:text;animation:erx-shimmer 5s linear infinite;
    }
    ::-webkit-scrollbar{width:3px;height:3px;}
    ::-webkit-scrollbar-track{background:transparent;}
    ::-webkit-scrollbar-thumb{background:rgba(42,77,114,0.5);border-radius:2px;}
    select option{background:#0e2340;color:#c8ddf0;}
    .drug-row{transition:background .13s,border-color .13s;cursor:pointer;}
    .drug-row:hover{background:rgba(22,45,79,0.55)!important;}
    .rx-pill{transition:all .15s ease;}
    .rx-pill:hover{opacity:.85;}
    input::-webkit-outer-spin-button,input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0;}
  `;
  document.head.appendChild(s);
})();

// ── Tokens ─────────────────────────────────────────────────────────
const T = {
  bg:"#050f1e",panel:"#081628",card:"#0b1e36",up:"#0e2544",
  b:"rgba(26,53,85,0.8)",bhi:"rgba(42,79,122,0.9)",
  txt:"#e8f0fe",txt2:"#8aaccc",txt3:"#4a6a8a",txt4:"#2e4a6a",
  coral:"#ff6b6b",gold:"#f5c842",teal:"#00e5c0",blue:"#3b9eff",
  orange:"#ff9f43",purple:"#9b6dff",green:"#3dffa0",cyan:"#00d4ff",
  rose:"#f472b6",
};

const glass  = (x={}) => ({backdropFilter:"blur(24px) saturate(200%)",WebkitBackdropFilter:"blur(24px) saturate(200%)",background:"rgba(8,22,40,0.78)",border:"1px solid rgba(26,53,85,0.5)",borderRadius:14,...x});
const deep   = (x={}) => ({backdropFilter:"blur(40px) saturate(220%)",WebkitBackdropFilter:"blur(40px) saturate(220%)",background:"rgba(5,15,30,0.9)",border:"1px solid rgba(26,53,85,0.7)",...x});
const inp    = (focus) => ({width:"100%",background:"rgba(14,37,68,0.8)",border:`1px solid ${focus?"rgba(59,158,255,0.6)":"rgba(26,53,85,0.55)"}`,borderRadius:9,padding:"9px 13px",color:T.txt,fontFamily:"DM Sans",fontSize:13,outline:"none",boxSizing:"border-box",transition:"border-color .15s"});

// ── Drug Database ──────────────────────────────────────────────────
// DRUGS array kept as fallback if DB is empty
const DRUGS_FALLBACK = [];

// ── Pediatric Dosing Configurations ────────────────────────────────
// Structured per-drug peds data: indications, mg/kg dosing, available
// solutions with concentration (mgPerMl) and typical bottle sizes.
// dosesPerDay is used for per-dose calc and course volume.
// dosePerKgLow/High = mg/kg/DOSE (already divided by dosesPerDay).
const PEDS_CONFIGS = {

  amox: {
    ageMin:0, weightMin:0, weightMax:40, contraindicated:false,
    indications:[
      {id:"std_bid",     label:"Standard infection — BID",         dosePerKgLow:12.5, dosePerKgHigh:22.5, freq:"BID",  dosesPerDay:2, maxDosePerDose:500,  maxDailyDose:3000, duration:"7–10", route:"PO",        note:"25–45 mg/kg/day ÷ BID; standard pharyngitis/sinusitis/skin"},
      {id:"std_tid",     label:"Standard infection — TID",         dosePerKgLow:8.3,  dosePerKgHigh:15,   freq:"TID",  dosesPerDay:3, maxDosePerDose:500,  maxDailyDose:3000, duration:"7–10", route:"PO",        note:"25–45 mg/kg/day ÷ TID"},
      {id:"aom_std",     label:"AOM — Standard (AAP)",             dosePerKgLow:20,   dosePerKgHigh:22.5, freq:"BID",  dosesPerDay:2, maxDosePerDose:1000, maxDailyDose:3000, duration:"10",   route:"PO",        note:"40–45 mg/kg/day ÷ BID; 10d (<2yr), 5–7d (≥2yr)"},
      {id:"aom_high",    label:"AOM — High dose (PCN-resistant)",  dosePerKgLow:40,   dosePerKgHigh:45,   freq:"BID",  dosesPerDay:2, maxDosePerDose:1000, maxDailyDose:3000, duration:"10",   route:"PO",        note:"80–90 mg/kg/day ÷ BID; for PCN-non-susceptible S. pneumoniae, daycare, recent ABX"},
    ],
    solutions:[
      {label:"125mg/5mL (25mg/mL)",  mgPerMl:25,  bottleMl:80,  note:"Small children; precise small doses"},
      {label:"200mg/5mL (40mg/mL)",  mgPerMl:40,  bottleMl:75,  note:"Intermediate strength"},
      {label:"250mg/5mL (50mg/mL)",  mgPerMl:50,  bottleMl:100, note:"Standard — most dispensed"},
      {label:"400mg/5mL (80mg/mL)",  mgPerMl:80,  bottleMl:75,  note:"High-dose AOM; fewer mL per dose"},
    ],
    note:"Shake vigorously before each dose. Refrigerate (stable 14 days) or room temp (stable 10 days).",
  },

  augmentin: {
    ageMin:0, weightMin:3, weightMax:40, contraindicated:false,
    indications:[
      {id:"std",      label:"Standard (sinusitis, UTI, skin, bite)",  dosePerKgLow:12.5, dosePerKgHigh:22.5, freq:"BID", dosesPerDay:2, maxDosePerDose:875,  maxDailyDose:2000, duration:"5–10", route:"PO", note:"25–45 mg/kg/day amox component ÷ BID; use 400/57 formulation to limit clavulanate GI effects"},
      {id:"aom",      label:"AOM — Standard (AAP first-line)",        dosePerKgLow:22.5, dosePerKgHigh:22.5, freq:"BID", dosesPerDay:2, maxDosePerDose:875,  maxDailyDose:2000, duration:"10",   route:"PO", note:"45 mg/kg/day amox ÷ BID; 10d (<2yr), 5–7d (≥2yr)"},
      {id:"aom_high", label:"AOM — High dose ES-600 (persistent)",    dosePerKgLow:45,   dosePerKgHigh:45,   freq:"BID", dosesPerDay:2, maxDosePerDose:1000, maxDailyDose:2000, duration:"10",   route:"PO", note:"90 mg/kg/day amox (ES-600: 600/42.9mg/5mL); for treatment failure or resistant AOM"},
    ],
    solutions:[
      {label:"125/31.25mg/5mL (25mg amox/mL)",  mgPerMl:25,  bottleMl:75,  note:"Standard for small children"},
      {label:"200/28.5mg/5mL (40mg amox/mL)",   mgPerMl:40,  bottleMl:75,  note:"Less clavulanate per mL"},
      {label:"250/62.5mg/5mL (50mg amox/mL)",   mgPerMl:50,  bottleMl:75,  note:"Standard"},
      {label:"400/57mg/5mL (80mg amox/mL)",      mgPerMl:80,  bottleMl:75,  note:"Preferred — reduced diarrhea vs 125/250 formulations"},
      {label:"ES-600 (600/42.9mg/5mL) (120mg/mL)",mgPerMl:120,bottleMl:75,  note:"High-dose AOM ONLY — 90 mg/kg/day amox component"},
    ],
    note:"Refrigerate suspension. Use 400/57 or ES-600 formulation to minimize clavulanate-associated diarrhea.",
  },

  azithro: {
    ageMin:2, weightMin:5, weightMax:45, contraindicated:false,
    indications:[
      {id:"5day",        label:"5-day course (pharyngitis/skin/CAP)",  dosePerKgLow:10,   dosePerKgHigh:10,   freq:"Daily × 5 days",  dosesPerDay:1, maxDosePerDose:500, maxDailyDose:500, duration:"5",  route:"PO", note:"Day 1: 10mg/kg (max 500mg). Days 2–5: 5mg/kg/day (max 250mg/day). Day 1 dose auto-calculated; days 2–5 = half the Day 1 dose.", special:"azithro_5day"},
      {id:"3day",        label:"3-day course (CAP, sinusitis)",        dosePerKgLow:10,   dosePerKgHigh:10,   freq:"Daily × 3 days",  dosesPerDay:1, maxDosePerDose:500, maxDailyDose:500, duration:"3",  route:"PO", note:"10mg/kg/day (max 500mg/day) × 3 days"},
      {id:"pharyngitis", label:"Strep pharyngitis (PCN allergy)",      dosePerKgLow:12,   dosePerKgHigh:12,   freq:"Daily × 5 days",  dosesPerDay:1, maxDosePerDose:500, maxDailyDose:500, duration:"5",  route:"PO", note:"12mg/kg/day × 5 days (max 500mg/day); resistance up to 15% — use only for PCN allergy"},
    ],
    solutions:[
      {label:"100mg/5mL (20mg/mL)",  mgPerMl:20, bottleMl:15, note:"Infants and children < 15 kg"},
      {label:"200mg/5mL (40mg/mL)",  mgPerMl:40, bottleMl:15, note:"Standard — children ≥ 15 kg"},
    ],
    note:"Can take with food for tolerability. Refrigerate reconstituted suspension (10 days).",
  },

  doxy: {
    contraindicated:true,
    contraindicatedNote:"AVOID in children < 8 years — causes permanent tooth discoloration and enamel hypoplasia. Exception: short course for rickettsial disease (≤21 days, per AAP) where benefit outweighs risk.",
    ageMin:8*12, weightMin:25, weightMax:null,
    indications:[
      {id:"std", label:"Standard infections (≥ 8 yr)", dosePerKgLow:1.1, dosePerKgHigh:2.2, freq:"BID", dosesPerDay:2, maxDosePerDose:100, maxDailyDose:200, duration:"7–14", route:"PO", note:"2.2–4.4 mg/kg/day ÷ BID (max 100mg/dose)"},
    ],
    solutions:[], note:"No liquid formulation available. Tablets only — can be crushed and mixed with food for older children.",
  },

  tmpsmx: {
    ageMin:2, weightMin:3, weightMax:40, contraindicated:false,
    indications:[
      {id:"uti",       label:"UTI — uncomplicated",               dosePerKgLow:4,   dosePerKgHigh:6,   freq:"BID",    dosesPerDay:2, maxDosePerDose:160, maxDailyDose:320, duration:"3–7",  route:"PO", note:"TMP component 4–6mg/kg/dose BID"},
      {id:"mrsa_skin", label:"CA-MRSA skin/soft tissue",          dosePerKgLow:4,   dosePerKgHigh:6,   freq:"BID",    dosesPerDay:2, maxDosePerDose:160, maxDailyDose:320, duration:"5–7",  route:"PO", note:"TMP 4–6mg/kg/dose BID; verify local susceptibility"},
      {id:"pcp_ppx",   label:"PCP prophylaxis",                   dosePerKgLow:2.5, dosePerKgHigh:5,   freq:"Daily",  dosesPerDay:1, maxDosePerDose:160, maxDailyDose:320, duration:"Ongoing", route:"PO", note:"TMP 5mg/kg/day (max 160mg TMP) × 3 days/week OR daily"},
    ],
    solutions:[
      {label:"40/8mg per 5mL (8mg TMP/mL)", mgPerMl:8, bottleMl:200, note:"TMP component concentration used for all dosing calculations"},
    ],
    note:"TMP component drives dosing. AVOID < 2 months (kernicterus risk). Refrigerate suspension.",
  },

  cipro: {
    contraindicated:true,
    contraindicatedNote:"GENERALLY AVOID < 18 yr — arthropathy/cartilage toxicity risk. Accepted exceptions: complicated UTI (≥ 1 yr, off-label), anthrax (≥ 1 mo), certain CF pulmonary exacerbations. Use only when no safer alternative exists.",
    ageMin:12, weightMin:8, weightMax:null,
    indications:[
      {id:"uti_cx", label:"Complicated UTI (≥1 yr, exception only)", dosePerKgLow:10, dosePerKgHigh:20, freq:"BID", dosesPerDay:2, maxDosePerDose:500, maxDailyDose:1500, duration:"7–14", route:"PO", note:"10–20mg/kg/day ÷ BID; off-label; use only when safer alternatives unavailable"},
    ],
    solutions:[
      {label:"250mg/5mL (50mg/mL)", mgPerMl:50, bottleMl:100, note:"Microcapsule suspension — do NOT crush; shake well"},
    ],
    note:"Oral suspension has microcapsules — do NOT crush. Refrigerate (14 days) or room temp (5 days).",
  },

  ketorolac: {
    ageMin:2, weightMin:10, weightMax:50, contraindicated:false,
    indications:[
      {id:"iv_dose",  label:"IV — acute pain (hospital)", dosePerKgLow:0.25, dosePerKgHigh:0.5, freq:"Q6h", dosesPerDay:4, maxDosePerDose:30, maxDailyDose:120, duration:"1–5",  route:"IV",  note:"0.5mg/kg IV q6h (max 30mg/dose); max 5 days combined IV + PO"},
      {id:"im_single",label:"IM — single dose",           dosePerKgLow:0.5,  dosePerKgHigh:1.0, freq:"Single dose", dosesPerDay:1, maxDosePerDose:30, maxDailyDose:30, duration:"Single dose", route:"IM", note:"0.5–1mg/kg IM (max 30mg); not for outpatient Rx"},
    ],
    solutions:[
      {label:"15mg/mL (IV/IM)", mgPerMl:15, bottleMl:1, note:"IV/IM only"},
      {label:"30mg/mL (IV/IM)", mgPerMl:30, bottleMl:1, note:"Most common concentration"},
    ],
    note:"AVOID < 2 yr. Max 5-day combined course. Not typically prescribed for outpatient oral use in pediatrics.",
  },

  albuterol: {
    ageMin:0, weightMin:0, weightMax:null, contraindicated:false,
    indications:[
      {id:"acute_neb",  label:"Acute bronchospasm — neb (weight-based)", dosePerKgLow:0.15, dosePerKgHigh:0.3, freq:"Q20 min × 3, then Q1–4h PRN", dosesPerDay:4, maxDosePerDose:5, maxDailyDose:null, duration:"PRN", route:"Nebulized", note:"Min 2.5mg/dose; max 5mg; dilute to 3mL with NS; continuous neb possible in severe asthma"},
      {id:"maint_neb",  label:"Maintenance nebulization (< 4 yr)",        dosePerKgLow:0.1,  dosePerKgHigh:0.15,freq:"Q4–6h PRN",                   dosesPerDay:4, maxDosePerDose:2.5,maxDailyDose:null, duration:"PRN", route:"Nebulized", note:"0.1–0.15 mg/kg q4–6h PRN; dilute to 3mL NS"},
    ],
    solutions:[
      {label:"0.5% (5mg/mL) — dilute before use", mgPerMl:5,     bottleMl:20, note:"Must dilute: add dose to 3mL NS for nebulization"},
      {label:"0.083% unit dose (2.5mg/3mL)",       mgPerMl:0.833, bottleMl:3,  note:"Pre-diluted unit dose — use as-is for 2.5mg dose; for smaller doses, use 0.5% solution"},
    ],
    note:"For weight-based dosing < 15kg: use 0.5% solution and dilute calculated dose to 3mL NS. Unit doses (2.5mg) used for children ≥ 15kg.",
  },

  pred_resp: {
    ageMin:0, weightMin:0, weightMax:null, contraindicated:false,
    indications:[
      {id:"asthma",    label:"Asthma exacerbation",    dosePerKgLow:1, dosePerKgHigh:2, freq:"Daily (or BID severe)", dosesPerDay:1, maxDosePerDose:60, maxDailyDose:60, duration:"3–5",   route:"PO", note:"1–2 mg/kg/day (max 60mg); no taper if ≤ 7 days; dexamethasone 0.6mg/kg × 2 days non-inferior"},
      {id:"croup",     label:"Croup — single dose",    dosePerKgLow:0.6,dosePerKgHigh:0.6,freq:"Single dose",        dosesPerDay:1, maxDosePerDose:16, maxDailyDose:16, duration:"Single dose",route:"PO",note:"0.6mg/kg PO × 1 (max 16mg); dexamethasone preferred — same dose, faster onset"},
      {id:"reactive",  label:"Reactive airway disease",dosePerKgLow:1, dosePerKgHigh:2, freq:"BID",                  dosesPerDay:2, maxDosePerDose:40, maxDailyDose:80, duration:"5",     route:"PO", note:"1–2 mg/kg/day ÷ BID (max 40mg/dose); use prednisolone in significant hepatic disease"},
    ],
    solutions:[
      {label:"1mg/mL oral solution",           mgPerMl:1,  bottleMl:240, note:"Standard peds solution"},
      {label:"5mg/5mL (1mg/mL) — same",        mgPerMl:1,  bottleMl:120, note:"Same concentration, different labeling"},
      {label:"15mg/5mL (3mg/mL)",              mgPerMl:3,  bottleMl:240, note:"More concentrated — less volume"},
      {label:"5mg/mL Intensol (concentrated)", mgPerMl:5,  bottleMl:30,  note:"Use calibrated dropper ONLY — highly concentrated"},
    ],
    note:"Bitter taste — mix with juice. No taper for ≤ 7-day course. Prednisolone (1mg/mL) = 1-to-1 equiv. for swallowing difficulties.",
  },

  ondansetron: {
    ageMin:4*12, weightMin:8, weightMax:null, contraindicated:false,
    indications:[
      {id:"nv_oral",  label:"Nausea/vomiting (≥ 4 yr, PO/ODT)", dosePerKgLow:0.15, dosePerKgHigh:0.15, freq:"Q8h PRN",   dosesPerDay:3, maxDosePerDose:4,  maxDailyDose:12, duration:"PRN (max 2 days)", route:"PO/ODT", note:"0.15mg/kg q8h PRN (max 4mg/dose); ODT preferred for vomiting children"},
      {id:"nv_iv",    label:"Nausea/PONV (IV — hospital)",        dosePerKgLow:0.1,  dosePerKgHigh:0.15, freq:"Q6–8h PRN",dosesPerDay:4, maxDosePerDose:4,  maxDailyDose:16, duration:"Hospital use",      route:"IV",     note:"0.1–0.15mg/kg IV (max 4mg/dose); over 15min to reduce QTc risk"},
      {id:"cinv",     label:"Chemotherapy (CINV) — oncology",     dosePerKgLow:0.15, dosePerKgHigh:0.15, freq:"Q4h × 3",  dosesPerDay:3, maxDosePerDose:8,  maxDailyDose:24, duration:"Day of chemo",      route:"IV/PO",  note:"0.15mg/kg/dose (max 8mg); oncology-guided dosing"},
    ],
    solutions:[
      {label:"4mg/5mL oral solution (0.8mg/mL)", mgPerMl:0.8, bottleMl:50,  note:"Standard peds oral solution"},
      {label:"2mg/mL injection (IV/IM)",          mgPerMl:2,   bottleMl:20,  note:"IV/IM injectable; dilute for IV infusion"},
    ],
    note:"ODT formulation dissolves on tongue — no water needed, ideal for vomiting children. Monitor QTc with concurrent QT-prolonging agents.",
  },

  sertraline: {
    ageMin:6*12, weightMin:20, weightMax:null, contraindicated:false,
    indications:[
      {id:"ocd_peds",  label:"OCD (≥ 6 yr — FDA approved)",     dosePerKgLow:null, dosePerKgHigh:null, freq:"Daily", dosesPerDay:1, maxDosePerDose:200, maxDailyDose:200, duration:"Ongoing", route:"PO", note:"Fixed dose: start 25mg daily × 1 wk, then titrate by 25–50mg q1–2 wk; max 200mg/day"},
      {id:"mdd_peds",  label:"MDD off-label (≥ 6 yr)",          dosePerKgLow:null, dosePerKgHigh:null, freq:"Daily", dosesPerDay:1, maxDosePerDose:200, maxDailyDose:200, duration:"Ongoing", route:"PO", note:"Start 12.5–25mg daily; titrate slowly; off-label for MDD in <18 yr"},
    ],
    solutions:[
      {label:"20mg/mL oral concentrate",  mgPerMl:20, bottleMl:60, note:"Dilute in 4oz water, OJ, or ginger ale immediately before use (slight haze is OK)"},
    ],
    note:"Must use calibrated dropper. Dilute concentrate immediately before each dose — do not pre-mix. 4–6 weeks for full therapeutic effect.",
  },

  lorazepam: {
    ageMin:12, weightMin:5, weightMax:null, contraindicated:false,
    indications:[
      {id:"status_epi",  label:"Status epilepticus (in-hospital IV/IM)",  dosePerKgLow:0.05, dosePerKgHigh:0.1,  freq:"Q5–10 min × 2 PRN", dosesPerDay:2, maxDosePerDose:4, maxDailyDose:8,  duration:"Hospital use", route:"IV/IM",  note:"0.05–0.1mg/kg IV (max 4mg/dose); may repeat × 1 in 5–10 min under monitoring"},
      {id:"anxiety_proc",label:"Procedural anxiety (specialist-guided PO)",dosePerKgLow:0.025,dosePerKgHigh:0.05, freq:"PRN",                dosesPerDay:1, maxDosePerDose:2, maxDailyDose:4,  duration:"Single dose",  route:"PO/SL", note:"0.025–0.05mg/kg PO/SL (max 2mg); specialist guidance required; respiratory monitoring"},
    ],
    solutions:[
      {label:"2mg/mL oral/SL solution",  mgPerMl:2, bottleMl:30,  note:"For PO or sublingual administration"},
      {label:"2mg/mL injection (IV/IM)", mgPerMl:2, bottleMl:10,  note:"IV/IM hospital use"},
      {label:"4mg/mL injection (IV/IM)", mgPerMl:4, bottleMl:10,  note:"Concentrated — calculate carefully"},
    ],
    note:"Respiratory monitoring and reversal agent (flumazenil) required. Not for routine outpatient prescribing in children.",
  },

  metformin: {
    ageMin:10*12, weightMin:30, weightMax:null, contraindicated:false,
    indications:[
      {id:"dm2_peds",  label:"Type 2 DM (≥ 10 yr — FDA approved)", dosePerKgLow:null, dosePerKgHigh:null, freq:"BID with meals", dosesPerDay:2, maxDosePerDose:1000, maxDailyDose:2000, duration:"Ongoing", route:"PO", note:"Fixed dose: start 500mg BID with meals; titrate by 500mg/week; max 2000mg/day"},
    ],
    solutions:[
      {label:"500mg/5mL oral solution (100mg/mL) — Riomet", mgPerMl:100, bottleMl:180, note:"Refrigerate; take with meals; GI effects less vs tablets"},
    ],
    note:"Fixed dosing (not weight-based) in pediatrics. Oral solution (Riomet) available — refrigerate, shake well. Take with meals.",
  },

  pantoprazole: {
    ageMin:5*12, weightMin:15, weightMax:null, contraindicated:false,
    indications:[
      {id:"gerd_low",  label:"GERD (15–39 kg, ≥ 5 yr) — fixed dose", dosePerKgLow:null, dosePerKgHigh:null, freq:"Daily before breakfast", dosesPerDay:1, maxDosePerDose:20, maxDailyDose:20, duration:"8", route:"PO", note:"Fixed 20mg daily for 15–39 kg (not weight-based)"},
      {id:"gerd_high", label:"GERD (≥ 40 kg, ≥ 5 yr) — fixed dose",  dosePerKgLow:null, dosePerKgHigh:null, freq:"Daily before breakfast", dosesPerDay:1, maxDosePerDose:40, maxDailyDose:40, duration:"8", route:"PO", note:"Fixed 40mg daily for ≥ 40 kg (not weight-based)"},
    ],
    solutions:[
      {label:"Granules 40mg (enteric-coated, for NG/sprinkle)", mgPerMl:null, bottleMl:null, note:"Sprinkle on applesauce or stir in apple juice — do NOT crush; swallow immediately"},
    ],
    note:"Enteric-coated granules — never crush or chew. Sprinkle on applesauce or mix in apple juice; take immediately after mixing.",
  },

  sumatriptan: {
    ageMin:12*12, weightMin:35, weightMax:null, contraindicated:false,
    indications:[
      {id:"migraine_nasal", label:"Adolescent migraine ≥12 yr (nasal)", dosePerKgLow:null, dosePerKgHigh:null, freq:"At onset; repeat × 1 in 2h", dosesPerDay:2, maxDosePerDose:20, maxDailyDose:40, duration:"PRN", route:"Intranasal", note:"10–20mg intranasal at onset; limited oral data in adolescents"},
      {id:"migraine_oral",  label:"Adolescent migraine ≥12 yr (oral)",  dosePerKgLow:null, dosePerKgHigh:null, freq:"At onset; repeat × 1 in 2h", dosesPerDay:2, maxDosePerDose:100,maxDailyDose:200,duration:"PRN", route:"PO",         note:"25–100mg PO; start low (25–50mg) in adolescents; limited peds data"},
    ],
    solutions:[],
    note:"No oral liquid. Verify no CV risk before prescribing. < 12 yr — insufficient safety data; not recommended.",
  },

  lisinopril: {
    ageMin:6*12, weightMin:20, weightMax:null, contraindicated:false,
    indications:[
      {id:"htn_peds",  label:"Pediatric HTN (≥ 6 yr)",  dosePerKgLow:0.07, dosePerKgHigh:0.6, freq:"Daily", dosesPerDay:1, maxDosePerDose:5, maxDailyDose:40, duration:"Ongoing", route:"PO", note:"Start 0.07mg/kg/day (max 5mg); titrate up; max 0.6mg/kg/day (40mg/day)"},
    ],
    solutions:[
      {label:"1mg/mL oral solution (compounded)", mgPerMl:1, bottleMl:150, note:"May require compounding — pharmacy preparation"},
    ],
    note:"CONTRAINDICATED in pregnancy. Monitor K+ and Cr. Oral solution may require compounding at specialty pharmacy.",
  },

  atorva: {
    ageMin:10*12, weightMin:30, weightMax:null, contraindicated:false,
    indications:[
      {id:"fh",  label:"Familial hypercholesterolemia (≥10 yr — specialist)", dosePerKgLow:null, dosePerKgHigh:null, freq:"Daily", dosesPerDay:1, maxDosePerDose:20, maxDailyDose:20, duration:"Ongoing", route:"PO", note:"Fixed 10mg daily; can titrate to 20mg; specialist (cardiology/endocrine) required"},
    ],
    solutions:[],
    note:"No oral liquid available. Tablet may be crushed and mixed with applesauce (off-label). Specialist guidance required.",
  },

  metop_succ: {
    ageMin:6*12, weightMin:20, weightMax:null, contraindicated:false,
    indications:[
      {id:"htn_peds",  label:"Pediatric HTN — specialist", dosePerKgLow:1, dosePerKgHigh:2, freq:"Daily", dosesPerDay:1, maxDosePerDose:200, maxDailyDose:200, duration:"Ongoing", route:"PO", note:"1mg/kg/day (max 200mg/day); ER formulation — do not crush"},
    ],
    solutions:[],
    note:"ER tablet — do not crush or chew. Specialist (cardiology) guidance required for pediatric dosing.",
  },

  tramadol: {
    contraindicated:true,
    contraindicatedNote:"CONTRAINDICATED < 12 yr. FDA mandates no use in children < 12 yr and following adenotonsillectomy/tonsillectomy (ultra-rapid CYP2D6 metabolizers — fatal respiratory depression reported).",
  },

  oxycodone: {
    ageMin:11*12, weightMin:30, weightMax:null, contraindicated:false,
    indications:[
      {id:"acute_pain", label:"Acute severe pain — specialist required", dosePerKgLow:0.05, dosePerKgHigh:0.1, freq:"Q4–6h PRN", dosesPerDay:4, maxDosePerDose:5, maxDailyDose:20, duration:"1–3", route:"PO", note:"0.05–0.1mg/kg q4–6h PRN; max 5mg/dose; specialist guidance required; short course only"},
    ],
    solutions:[
      {label:"5mg/5mL (1mg/mL) oral solution",  mgPerMl:1, bottleMl:500, note:"Use calibrated oral syringe ONLY — Schedule II"},
    ],
    note:"Schedule II — PDMP mandatory. Specialist guidance required. Co-prescribe naloxone. Use calibrated syringe.",
  },
};

// ── Pediatric Dose Calculator Component ────────────────────────────
function PedsDoseCalculator({ drug, defaultWeight, defaultAgeMonths, onUseDose }) {
  const cfg = PEDS_CONFIGS[drug.id];

  // Local overrideable weight / age
  const [wt,    setWt]    = useState(defaultWeight?.toString() || "");
  const [ageM,  setAgeM]  = useState(defaultAgeMonths?.toString() || "");
  const [indId, setIndId] = useState(cfg?.indications?.[0]?.id || "");
  const [solLbl,setSolLbl]= useState(cfg?.solutions?.[0]?.label || "");
  const [roundTo, setRound]= useState("0.5");
  const [copied, setCopied]= useState(false);

  const weight     = parseFloat(wt)  || 0;
  const ageMonths  = parseFloat(ageM) || 0;
  const ind        = cfg?.indications?.find(i=>i.id===indId);
  const sol        = cfg?.solutions?.find(s=>s.label===solLbl);

  // Age/weight eligibility
  const tooYoung  = cfg && !cfg.contraindicated && cfg.ageMin   && ageMonths > 0 && ageMonths < cfg.ageMin;
  const tooLight  = cfg && !cfg.contraindicated && cfg.weightMin && weight > 0 && weight < cfg.weightMin;
  const tooHeavy  = cfg && !cfg.contraindicated && cfg.weightMax && weight > cfg.weightMax;
  const ageYears  = ageMonths ? `${Math.floor(ageMonths/12)} yr ${ageMonths%12} mo` : null;

  // Dose math
  const calc = useMemo(() => {
    if (!cfg || cfg.contraindicated || !ind) return null;
    const isFixed = ind.dosePerKgLow === null;

    if (isFixed) {
      const fixedMg = ind.maxDosePerDose;
      let fixedMl = (sol && sol.mgPerMl) ? fixedMg / sol.mgPerMl : null;
      if (fixedMl !== null) {
        const r = parseFloat(roundTo) || 0.5;
        fixedMl = Math.ceil(fixedMl / r) * r;
      }
      return { isFixed, fixedMg, fixedMl, dosesPerDay: ind.dosesPerDay,
        totalMl: fixedMl ? fixedMl * ind.dosesPerDay * (parseInt(ind.duration) || 7) : null,
        bottlesNeeded: null };
    }

    if (!weight) return null;

    // per-dose mg range
    const mgLow  = ind.dosePerKgLow  * weight;
    const mgHigh = ind.dosePerKgHigh * weight;
    const mgCapLow  = Math.min(mgLow,  ind.maxDosePerDose || 99999);
    const mgCapHigh = Math.min(mgHigh, ind.maxDosePerDose || 99999);
    const cappedLow  = mgLow  > (ind.maxDosePerDose || 99999);
    const cappedHigh = mgHigh > (ind.maxDosePerDose || 99999);

    // daily totals
    const dailyLow  = mgCapLow  * ind.dosesPerDay;
    const dailyHigh = mgCapHigh * ind.dosesPerDay;
    const dailyCap  = ind.maxDailyDose && dailyLow > ind.maxDailyDose;

    // mL
    let mlLow = null, mlHigh = null, mlRoundedLow = null, mlRoundedHigh = null;
    if (sol && sol.mgPerMl) {
      mlLow  = mgCapLow  / sol.mgPerMl;
      mlHigh = mgCapHigh / sol.mgPerMl;
      const r = parseFloat(roundTo) || 0.5;
      mlRoundedLow  = Math.ceil(mlLow  / r) * r;
      mlRoundedHigh = Math.ceil(mlHigh / r) * r;
    }

    // Course volume (use low/conservative mL)
    const durDays = parseInt(ind.duration) || 7;
    const totalMl = mlRoundedLow ? mlRoundedLow * ind.dosesPerDay * durDays : null;
    // For azithro 5-day: Day1 dose + Days2-5 (half dose × 4)
    const isAzithro5day = ind.special === "azithro_5day";
    let azithroTotalMl = null;
    let day1Ml = null, day25Ml = null;
    if (isAzithro5day && sol && sol.mgPerMl) {
      const day1Mg   = Math.min(ind.dosePerKgLow * weight, ind.maxDosePerDose || 500);
      const day25Mg  = Math.min((ind.dosePerKgLow * weight) / 2, 250);
      const r = parseFloat(roundTo) || 0.5;
      day1Ml  = Math.ceil((day1Mg  / sol.mgPerMl) / r) * r;
      day25Ml = Math.ceil((day25Mg / sol.mgPerMl) / r) * r;
      azithroTotalMl = day1Ml + (day25Ml * 4);
    }

    const bottlesNeeded = sol?.bottleMl && (azithroTotalMl||totalMl)
      ? Math.ceil((azithroTotalMl||totalMl) / sol.bottleMl)
      : null;
    const actualMgLow = mlRoundedLow && sol ? mlRoundedLow * sol.mgPerMl : null;

    return {
      isFixed:false, mgCapLow, mgCapHigh, cappedLow, cappedHigh,
      dailyLow, dailyHigh, dailyCap,
      mlLow, mlHigh, mlRoundedLow, mlRoundedHigh,
      totalMl: azithroTotalMl || totalMl,
      bottlesNeeded, actualMgLow, durDays,
      isAzithro5day, day1Ml, day25Ml, azithroTotalMl,
    };
  }, [cfg, ind, sol, weight, roundTo]);

  // SIG text
  const sigText = useMemo(() => {
    if (!calc || !ind) return "";
    if (calc.isFixed) {
      const mlPart = calc.fixedMl ? ` (${calc.fixedMl} mL)` : "";
      return `${ind.maxDosePerDose}mg${mlPart} ${ind.route} ${ind.freq}${ind.duration && !ind.duration.includes("Ongoing") ? ` × ${ind.duration} days` : ""} — ${ind.note}`;
    }
    if (!weight) return "";
    if (calc.isAzithro5day && calc.day1Ml !== null) {
      return `Day 1: ${calc.day1Ml} mL (${Math.min(ind.dosePerKgLow*weight,500).toFixed(0)}mg) PO once. Days 2–5: ${calc.day25Ml} mL (${Math.min((ind.dosePerKgLow*weight)/2,250).toFixed(0)}mg) PO once daily.`;
    }
    const mgStr  = calc.mgCapLow === calc.mgCapHigh
      ? `${calc.mgCapLow.toFixed(0)}mg`
      : `${calc.mgCapLow.toFixed(0)}–${calc.mgCapHigh.toFixed(0)}mg`;
    const mlStr  = calc.mlRoundedLow !== null
      ? (calc.mlRoundedLow === calc.mlRoundedHigh
          ? ` (${calc.mlRoundedLow} mL)`
          : ` (${calc.mlRoundedLow}–${calc.mlRoundedHigh} mL)`)
      : "";
    return `${mgStr}${mlStr} ${ind.route} ${ind.freq}${ind.duration && !ind.duration.includes("Ongoing") ? ` × ${ind.duration} days` : ""}`;
  }, [calc, ind, weight]);

  const copy = () => { if (sigText) { navigator.clipboard.writeText(sigText); setCopied(true); setTimeout(()=>setCopied(false),1500); } };
  const useDose = () => { if (onUseDose && sigText) onUseDose(sigText); };

  // ── Render ────────────────────────────────────────────────────────
  if (!cfg) return (
    <div style={{ padding:"24px",textAlign:"center",color:T.txt3,fontFamily:"DM Sans",fontSize:13 }}>
      No pediatric configuration available for <strong>{drug.name}</strong>
    </div>
  );

  const ageMinYrs = cfg.ageMin ? `${Math.floor(cfg.ageMin/12)} yr${cfg.ageMin%12?` ${cfg.ageMin%12} mo`:""}` : null;

  return (
    <div className="erx-in" style={{ display:"flex",flexDirection:"column",gap:14 }}>

      {/* Header strip */}
      <div style={{ padding:"12px 16px",background:"rgba(61,255,160,0.07)",border:"1px solid rgba(61,255,160,0.25)",borderRadius:12 }}>
        <div style={{ fontFamily:"JetBrains Mono",fontSize:9,color:T.green,textTransform:"uppercase",letterSpacing:2,marginBottom:4 }}>👶 PEDIATRIC DOSING — {drug.name}</div>
        {cfg.contraindicated ? null : (
          <div style={{ fontFamily:"DM Sans",fontSize:12,color:T.txt2 }}>
            {ageMinYrs && `Age: ≥ ${ageMinYrs}`}{cfg.weightMin ? ` · Weight: ≥ ${cfg.weightMin} kg` : ""}{cfg.weightMax ? ` · Max weight: ${cfg.weightMax} kg` : ""}
          </div>
        )}
      </div>

      {/* Contraindicated warning */}
      {cfg.contraindicated && (
        <div style={{ padding:"16px 18px",background:"rgba(255,107,107,0.12)",border:"2px solid rgba(255,107,107,0.5)",borderRadius:12 }}>
          <div style={{ fontFamily:"JetBrains Mono",fontSize:10,color:T.coral,textTransform:"uppercase",letterSpacing:2,marginBottom:8 }}>🚫 GENERALLY CONTRAINDICATED — PEDIATRICS</div>
          <div style={{ fontFamily:"DM Sans",fontSize:13,color:T.coral,lineHeight:1.7,fontWeight:600 }}>{cfg.contraindicatedNote}</div>
          {cfg.ageMin && (
            <div style={{ marginTop:8,fontFamily:"DM Sans",fontSize:12,color:T.txt2 }}>
              Minimum age for limited exceptions: <strong style={{color:T.orange}}>{ageMinYrs}</strong>
            </div>
          )}
        </div>
      )}

      {!cfg.contraindicated && (
        <>

        {/* Eligibility warnings */}
        {(tooYoung || tooLight || tooHeavy) && (
          <div style={{ padding:"10px 14px",background:"rgba(255,159,67,0.1)",border:"1px solid rgba(255,159,67,0.35)",borderRadius:10 }}>
            <div style={{ fontFamily:"JetBrains Mono",fontSize:9,color:T.orange,textTransform:"uppercase",letterSpacing:2,marginBottom:4 }}>⚠ ELIGIBILITY CHECK</div>
            {tooYoung  && <div style={{ fontFamily:"DM Sans",fontSize:12,color:T.orange }}>Age {ageYears} is below minimum ({ageMinYrs}) — verify indication before prescribing</div>}
            {tooLight  && <div style={{ fontFamily:"DM Sans",fontSize:12,color:T.orange }}>Weight {weight}kg is below minimum ({cfg.weightMin}kg) — use with caution</div>}
            {tooHeavy  && <div style={{ fontFamily:"DM Sans",fontSize:12,color:T.txt2  }}>Weight {weight}kg exceeds pediatric range — consider adult dosing (see Dosing tab)</div>}
          </div>
        )}

        {/* Patient weight + age inputs */}
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
          <div>
            <label style={{ display:"block",fontFamily:"DM Sans",fontSize:10,fontWeight:600,color:T.txt3,textTransform:"uppercase",letterSpacing:".06em",marginBottom:5 }}>Patient Weight (kg) <span style={{color:T.green}}>*</span></label>
            <div style={{ display:"flex",alignItems:"center",gap:6,background:"rgba(14,37,68,0.8)",border:`1.5px solid ${weight?"rgba(61,255,160,0.5)":"rgba(26,53,85,0.55)"}`,borderRadius:9,padding:"8px 13px",transition:"border-color .15s"  }}>
              <input type="number" min="1" max="200" value={wt} onChange={e=>setWt(e.target.value)}
                placeholder="e.g. 18"
                style={{ background:"transparent",border:"none",outline:"none",color:T.txt,fontFamily:"JetBrains Mono",fontSize:16,fontWeight:700,width:"100%",minWidth:0 }}/>
              <span style={{ fontFamily:"JetBrains Mono",fontSize:11,color:weight?T.green:T.txt4,fontWeight:700,flexShrink:0 }}>kg</span>
            </div>
          </div>
          <div>
            <label style={{ display:"block",fontFamily:"DM Sans",fontSize:10,fontWeight:600,color:T.txt3,textTransform:"uppercase",letterSpacing:".06em",marginBottom:5 }}>Age (months)</label>
            <div style={{ display:"flex",alignItems:"center",gap:6,background:"rgba(14,37,68,0.8)",border:"1px solid rgba(26,53,85,0.5)",borderRadius:9,padding:"8px 13px" }}>
              <input type="number" min="0" max="216" value={ageM} onChange={e=>setAgeM(e.target.value)}
                placeholder="e.g. 36"
                style={{ background:"transparent",border:"none",outline:"none",color:T.txt,fontFamily:"JetBrains Mono",fontSize:16,fontWeight:700,width:"100%",minWidth:0 }}/>
              <span style={{ fontFamily:"JetBrains Mono",fontSize:11,color:T.txt4,flexShrink:0 }}>mo</span>
            </div>
            {ageMonths > 0 && <div style={{ fontFamily:"DM Sans",fontSize:10,color:T.txt3,marginTop:3 }}>{ageYears}</div>}
          </div>
        </div>

        {/* Indication selector */}
        <div>
          <label style={{ display:"block",fontFamily:"DM Sans",fontSize:10,fontWeight:600,color:T.txt3,textTransform:"uppercase",letterSpacing:".06em",marginBottom:6 }}>Indication / Dosing Protocol</label>
          <div style={{ display:"flex",flexDirection:"column",gap:5 }}>
            {cfg.indications.map(i=>(
              <button key={i.id} onClick={()=>setIndId(i.id)}
                style={{ padding:"9px 14px",borderRadius:9,textAlign:"left",background:indId===i.id?"rgba(61,255,160,0.12)":"rgba(14,37,68,0.7)",border:`1px solid ${indId===i.id?"rgba(61,255,160,0.5)":"rgba(42,77,114,0.35)"}`,color:indId===i.id?T.green:T.txt2,fontFamily:"DM Sans",fontSize:12.5,cursor:"pointer",transition:"all .15s" }}>
                {indId===i.id && <span style={{marginRight:6,fontSize:11}}>✓</span>}
                <strong>{i.label}</strong>
                <span style={{ display:"block",fontFamily:"DM Sans",fontSize:11,color:indId===i.id?"rgba(61,255,160,0.7)":T.txt4,marginTop:2,paddingLeft:indId===i.id?14:0,lineHeight:1.4 }}>{i.note}</span>
              </button>
            ))}
          </div>
        </div>

      </>
      )}

    </div>
  );
}

// ── Main ERx Component ────────────────────────────────────────────
export default function ERx() {
  const [selectedDrugId, setSelectedDrugId] = useState(null);
  const [searchQ, setSearchQ] = useState("");

  const { data: drugsFromDb, isLoading } = useQuery({
    queryKey: ["medications"],
    queryFn: async () => {
      try {
        const rows = await base44.entities.Medication.list("-created_date", 100);
        return rows.map(r => ({ id: r.med_id || r.id, name: r.name, brand: r.brand || "", category: r.category }));
      } catch (e) {
        console.error("[ERx] Error loading drugs:", e);
        return DRUGS_FALLBACK;
      }
    },
  });

  const drugs = drugsFromDb || DRUGS_FALLBACK;
  const filtered = drugs.filter(d => d.name.toLowerCase().includes(searchQ.toLowerCase()) || d.category?.toLowerCase().includes(searchQ.toLowerCase()));
  const selectedDrug = drugs.find(d => d.id === selectedDrugId);

  return (
    <div style={{ background: T.bg, minHeight: "100vh", display: "flex", color: T.txt, fontFamily: "DM Sans" }}>
      {/* Sidebar */}
      <div style={{ flex: "0 0 320px", background: T.panel, borderRight: `1px solid ${T.b}`, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "18px", borderBottom: `1px solid ${T.b}` }}>
          <div style={{ fontFamily: "Playfair Display", fontSize: 20, fontWeight: 700, marginBottom: 10 }}>eRx</div>
          <input placeholder="Search drugs..." value={searchQ} onChange={e => setSearchQ(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", borderRadius: 8, background: T.card, border: "none", color: T.txt, fontSize: 13, outline: "none" }} />
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "10px" }}>
          {isLoading ? (
            <div style={{ padding: "20px", textAlign: "center", color: T.txt3 }}>Loading...</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {filtered.map(d => (
                <button key={d.id} onClick={() => setSelectedDrugId(d.id)}
                  style={{ padding: "10px 14px", borderRadius: 8, textAlign: "left", background: selectedDrugId === d.id ? T.up : "transparent", border: `1px solid ${selectedDrugId === d.id ? T.blue : "transparent"}`, color: T.txt, fontSize: 12.5, cursor: "pointer", transition: "all .15s" }}>
                  <strong>{d.name}</strong>
                  <div style={{ fontSize: 10, color: T.txt3, marginTop: 2 }}>{d.category}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {!selectedDrug ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
            <div>
              <div style={{ fontSize: 48, marginBottom: 16 }}>💊</div>
              <div style={{ fontSize: 16, color: T.txt2, marginBottom: 8 }}>Select a medication to begin</div>
              <div style={{ fontSize: 12, color: T.txt3 }}>Search by drug name or category above</div>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
            <div style={{ maxWidth: 900 }}>
              <button onClick={() => setSelectedDrugId(null)} style={{ marginBottom: 16, padding: "6px 12px", borderRadius: 6, background: "transparent", border: `1px solid ${T.b}`, color: T.txt2, fontSize: 12, cursor: "pointer" }}>
                ← Back to list
              </button>
              <PedsDoseCalculator drug={selectedDrug} />
              <div style={{ marginTop: 40, padding: "20px", background: T.card, borderRadius: 14, border: `1px solid ${T.b}` }}>
                <PDMPQueryPanel />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}