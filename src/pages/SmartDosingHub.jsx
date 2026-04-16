import { useState, useCallback, useMemo } from "react";
import { base44 } from "@/api/base44Client";
const InvokeLLM = (params) => base44.integrations.Core.InvokeLLM(params);

const PREFIX = "sdh";

(() => {
  const fontId = `${PREFIX}-fonts`;
  if (document.getElementById(fontId)) return;
  const l = document.createElement("link");
  l.id = fontId; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = `${PREFIX}-css`;
  s.textContent = `
    * { box-sizing:border-box; margin:0; padding:0; }
    ::-webkit-scrollbar { width:3px; height:3px; }
    ::-webkit-scrollbar-track { background:transparent; }
    ::-webkit-scrollbar-thumb { background:rgba(42,79,122,.5); border-radius:2px; }
    @keyframes ${PREFIX}fade { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    @keyframes ${PREFIX}shim { 0%,100%{background-position:-200% center} 50%{background-position:200% center} }
    @keyframes ${PREFIX}orb0 { 0%,100%{transform:translate(-50%,-50%) scale(1)}    50%{transform:translate(-50%,-50%) scale(1.1)} }
    @keyframes ${PREFIX}orb1 { 0%,100%{transform:translate(-50%,-50%) scale(1.07)} 50%{transform:translate(-50%,-50%) scale(.92)} }
    @keyframes ${PREFIX}orb2 { 0%,100%{transform:translate(-50%,-50%) scale(.95)}  50%{transform:translate(-50%,-50%) scale(1.09)} }
    @keyframes ${PREFIX}pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
    .${PREFIX}-fade  { animation:${PREFIX}fade .22s ease both; }
    .${PREFIX}-pulse { animation:${PREFIX}pulse 1.8s ease-in-out infinite; }
    .${PREFIX}-shim  {
      background:linear-gradient(90deg,#f2f7ff 0%,#fff 25%,#00e5c0 50%,#3b9eff 75%,#f2f7ff 100%);
      background-size:250% auto; -webkit-background-clip:text;
      -webkit-text-fill-color:transparent; background-clip:text;
      animation:${PREFIX}shim 6s linear infinite;
    }
  `;
  document.head.appendChild(s);
})();

const T = {
  bg:"#050f1e", txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", red:"#ff4444", green:"#3dffa0",
  blue:"#3b9eff", purple:"#9b6dff", orange:"#ff9f43", coral:"#ff6b6b",
};

const glass = {
  backdropFilter:"blur(20px) saturate(180%)", WebkitBackdropFilter:"blur(20px) saturate(180%)",
  background:"rgba(8,22,40,0.78)", border:"1px solid rgba(42,79,122,0.35)", borderRadius:14,
};

// ── CATEGORY CONFIG ───────────────────────────────────────────────────
const CATS = {
  antibiotic:    { label:"Antibiotics",       color:T.teal   },
  anticoagulant: { label:"Anticoagulants",    color:T.red    },
  analgesic:     { label:"Analgesics",        color:T.purple },
  cardiovascular:{ label:"Cardiovascular",    color:T.coral  },
  antiepileptic: { label:"Antiepileptics",    color:T.blue   },
  metabolic:     { label:"Metabolic & Other", color:T.gold   },
};

// ── DRUG DATABASE ─────────────────────────────────────────────────────
// tier format: [gfr_label, dose_note, flag]  flag = "ok"|"caution"|"avoid"
// gfr_label used for display; matching logic uses numeric eGFR/CrCl
const DRUGS = [
  // ── ANTIBIOTICS ──────────────────────────────────────────────────
  { id:"vanc", name:"Vancomycin", cat:"antibiotic", weightBased:true, hepatic:false,
    normal:"15–20 mg/kg IV q8–12h", dialysis:"HD: 15–25 mg/kg after each session; CRRT: 10–15 mg/kg q24h",
    monitoring:"Target AUC/MIC 400–600; troughs if AUC unavailable: 15–20; SCr q48h",
    tiers:[ ["eGFR >60","15–20 mg/kg q8–12h","ok"], ["eGFR 30–60","15–20 mg/kg q24h","caution"], ["eGFR 15–30","15–20 mg/kg q48h","caution"], ["eGFR <15","Pharmacokinetic dosing required","caution"] ] },
  { id:"pip", name:"Pip-Tazo 4.5g", cat:"antibiotic", weightBased:false, hepatic:false,
    normal:"4.5g IV q6h (or q8h extended infusion)", dialysis:"HD: 2.25g q12h + 0.75g after HD",
    monitoring:"Seizure risk in renal failure; neurotoxicity if accumulation",
    tiers:[ ["eGFR >40","4.5g q6h","ok"], ["eGFR 20–40","3.375g q6h","caution"], ["eGFR <20","2.25g q6h","caution"] ] },
  { id:"cefepime", name:"Cefepime", cat:"antibiotic", weightBased:false, hepatic:false,
    normal:"2g IV q8h", dialysis:"HD: 1g after each session; CRRT: 1–2g q12h",
    monitoring:"⚠️ Neurotoxicity/encephalopathy risk increases with renal impairment — reduce dose aggressively",
    tiers:[ ["eGFR >60","2g q8h","ok"], ["eGFR 30–60","2g q12h","caution"], ["eGFR 11–29","1g q12h","caution"], ["eGFR <11","500mg q12h","caution"] ] },
  { id:"mero", name:"Meropenem", cat:"antibiotic", weightBased:false, hepatic:false,
    normal:"1–2g IV q8h", dialysis:"HD: 500mg q24h after session; CRRT: 1g q12h",
    monitoring:"Seizure risk if accumulation in renal failure",
    tiers:[ ["eGFR >50","1–2g q8h","ok"], ["eGFR 26–50","1–2g q12h","caution"], ["eGFR 10–25","500mg–1g q12h","caution"], ["eGFR <10","500mg q24h","caution"] ] },
  { id:"gent", name:"Gentamicin", cat:"antibiotic", weightBased:true, hepatic:false,
    normal:"5–7 mg/kg (ABW) q24h extended interval", dialysis:"HD: 1.5–2 mg/kg after each session",
    monitoring:"⚠️ Nephrotoxic + ototoxic. Troughs <1 mg/L. Avoid if eGFR <20 unless no alternative",
    tiers:[ ["eGFR >60","5–7 mg/kg q24h","ok"], ["eGFR 40–60","5–7 mg/kg q36h","caution"], ["eGFR 20–40","5–7 mg/kg q48h","caution"], ["eGFR <20","Avoid — pharmacist consult required","avoid"] ] },
  { id:"levo", name:"Levofloxacin", cat:"antibiotic", weightBased:false, hepatic:false,
    normal:"750mg IV/PO daily", dialysis:"HD/CRRT: 500mg once, then 250mg q24h",
    monitoring:"QTc prolongation; tendon risk with steroids",
    tiers:[ ["eGFR >50","750mg q24h","ok"], ["eGFR 20–49","750mg × 1, then 500mg q24h","caution"], ["eGFR <20","750mg × 1, then 500mg q48h","caution"] ] },
  { id:"metro", name:"Metronidazole", cat:"antibiotic", weightBased:false, hepatic:true,
    normal:"500mg IV/PO q8h", dialysis:"500mg q8h (HD does not remove significantly)",
    monitoring:"Hepatic impairment: reduce dose 50% in severe liver disease",
    tiers:[ ["eGFR >10","500mg q8h","ok"], ["eGFR <10","500mg q12h","caution"] ] },
  { id:"ampsulbactam", name:"Ampicillin-Sulbactam", cat:"antibiotic", weightBased:false, hepatic:false,
    normal:"3g IV q6h", dialysis:"HD: 3g after each session",
    monitoring:"Rash common in mono; watch for C diff",
    tiers:[ ["eGFR >30","3g q6h","ok"], ["eGFR 15–29","3g q12h","caution"], ["eGFR <15","3g q24h","caution"] ] },
  { id:"ceftriax", name:"Ceftriaxone", cat:"antibiotic", weightBased:false, hepatic:false,
    normal:"1–2g IV q12–24h", dialysis:"1–2g q12–24h (no significant removal)",
    monitoring:"Biliary sludging with prolonged use; avoid in neonates with hyperbilirubinemia",
    tiers:[ ["Any eGFR","1–2g q12–24h (no dose adjustment)","ok"] ] },
  { id:"azithro", name:"Azithromycin", cat:"antibiotic", weightBased:false, hepatic:true,
    normal:"500mg IV/PO daily", dialysis:"No adjustment",
    monitoring:"QTc prolongation; avoid in hepatic failure",
    tiers:[ ["Any eGFR","500mg daily (no renal adjustment)","ok"] ] },
  { id:"tmpsml", name:"TMP-SMX (DS)", cat:"antibiotic", weightBased:false, hepatic:false,
    normal:"1 DS tab PO q12h (UTI); higher for PCP/MRSA", dialysis:"HD: dose after sessions; avoid if possible",
    monitoring:"Hyperkalemia; ↑SCr (blocks tubular secretion, not true GFR effect); rash",
    tiers:[ ["eGFR >30","Full dose","ok"], ["eGFR 15–30","50% dose","caution"], ["eGFR <15","Avoid","avoid"] ] },
  { id:"doxy", name:"Doxycycline", cat:"antibiotic", weightBased:false, hepatic:true,
    normal:"100mg IV/PO q12h", dialysis:"No adjustment needed",
    monitoring:"No renal dose adjustment; avoid in severe hepatic disease",
    tiers:[ ["Any eGFR","100mg q12h (no renal adjustment)","ok"] ] },

  // ── ANTICOAGULANTS ────────────────────────────────────────────────
  { id:"enox", name:"Enoxaparin", cat:"anticoagulant", weightBased:true, hepatic:false,
    normal:"1 mg/kg SQ q12h (Tx); 40mg SQ daily (prophylaxis)", dialysis:"UFH preferred",
    monitoring:"Anti-Xa monitoring if eGFR <30. Peak 4h post-dose target 0.6–1.0 IU/mL",
    tiers:[ ["eGFR >30","1 mg/kg q12h (treatment)","ok"], ["eGFR <30","1 mg/kg q24h — Anti-Xa monitoring required","caution"] ] },
  { id:"hep", name:"Unfractionated Heparin", cat:"anticoagulant", weightBased:true, hepatic:false,
    normal:"80 u/kg bolus → 18 u/kg/hr (ACS/PE protocol)", dialysis:"Preferred over LMWH in ESRD",
    monitoring:"aPTT q6h; HIT risk with extended use; no renal adjustment",
    tiers:[ ["Any eGFR","Full dose (preferred in ESRD/dialysis)","ok"] ] },
  { id:"apix", name:"Apixaban", cat:"anticoagulant", weightBased:false, hepatic:false,
    normal:"10mg PO q12h × 7d → 5mg q12h (VTE); 5mg q12h (AF)", dialysis:"Avoid — minimal data",
    monitoring:"No reliable reversal agent dose-adjustment formula; use 2-of-3 rule (age ≥80, SCr ≥1.5, wt ≤60kg)",
    tiers:[ ["eGFR >25","Standard dosing","ok"], ["eGFR 15–25","Use caution; consider UFH","caution"], ["eGFR <15 / dialysis","Avoid","avoid"] ] },
  { id:"rivaro", name:"Rivaroxaban", cat:"anticoagulant", weightBased:false, hepatic:false,
    normal:"15mg PO BID × 21d → 20mg daily (VTE); 20mg daily (AF)", dialysis:"Avoid",
    monitoring:"Andexanet available for reversal; take with food (AF/VTE dose)",
    tiers:[ ["eGFR >50","Full dose","ok"], ["eGFR 30–49","Use with caution; UFH may be preferable","caution"], ["eGFR <30","Avoid","avoid"] ] },
  { id:"fondap", name:"Fondaparinux", cat:"anticoagulant", weightBased:true, hepatic:false,
    normal:"5–10mg SQ daily (weight-based) for VTE", dialysis:"Contraindicated",
    monitoring:"⚠️ Accumulates significantly in renal failure — avoid if CrCl <30",
    tiers:[ ["CrCl >50","Weight-based full dose","ok"], ["CrCl 30–50","Use with caution; monitor","caution"], ["CrCl <30","Avoid — contraindicated","avoid"] ] },

  // ── ANALGESICS & SEDATION ─────────────────────────────────────────
  { id:"morphine", name:"Morphine", cat:"analgesic", weightBased:true, hepatic:true,
    normal:"2–4mg IV q2–4h PRN; 0.1 mg/kg for weight-based", dialysis:"Avoid if possible",
    monitoring:"⚠️ Active metabolite M6G accumulates in renal failure → prolonged sedation/respiratory depression",
    tiers:[ ["eGFR >60","Standard dosing","ok"], ["eGFR 30–60","Reduce dose 25–50%; extend interval","caution"], ["eGFR <30","Avoid — use fentanyl instead","avoid"] ] },
  { id:"fent", name:"Fentanyl", cat:"analgesic", weightBased:true, hepatic:true,
    normal:"1–2 mcg/kg IV; 25–100 mcg q1–2h PRN", dialysis:"Preferred opioid in ESRD",
    monitoring:"Preferred opioid in renal failure — no active renal metabolites",
    tiers:[ ["Any eGFR","Preferred opioid — start 25–50 mcg IV; titrate","ok"] ] },
  { id:"hydromorph", name:"Hydromorphone", cat:"analgesic", weightBased:true, hepatic:true,
    normal:"0.2–0.4mg IV q3–4h PRN", dialysis:"Avoid or reduce significantly",
    monitoring:"Active metabolite H3G accumulates — less than morphine but still concerning",
    tiers:[ ["eGFR >60","0.2–0.4mg q3–4h","ok"], ["eGFR 30–60","Reduce 25–50%; monitor closely","caution"], ["eGFR <30","Avoid — prefer fentanyl","avoid"] ] },
  { id:"ketamine", name:"Ketamine", cat:"analgesic", weightBased:true, hepatic:true,
    normal:"Sub-dissociative: 0.3 mg/kg IV; Dissociative: 1–2 mg/kg IV", dialysis:"No significant adjustment",
    monitoring:"Minimal renal clearance; hepatic metabolism. Avoid in uncontrolled HTN",
    tiers:[ ["Any eGFR","Full dose (no renal adjustment)","ok"] ] },
  { id:"ketorolac", name:"Ketorolac", cat:"analgesic", weightBased:false, hepatic:false,
    normal:"15–30mg IV q6h; max 5 days; ≥65yo: 15mg IV q6h", dialysis:"Contraindicated",
    monitoring:"⚠️ Nephrotoxic NSAID — avoid in AKI, CKD, CHF, volume depletion, or age >75",
    tiers:[ ["eGFR >60","15–30mg q6h (max 5 days)","ok"], ["eGFR 30–60","Use 15mg q6h; short course; monitor SCr","caution"], ["eGFR <30","Avoid — nephrotoxic","avoid"] ] },
  { id:"apap", name:"Acetaminophen", cat:"analgesic", weightBased:false, hepatic:true,
    normal:"650–1000mg PO/IV q6–8h; max 4g/day (2g/day if hepatic)", dialysis:"Standard dosing",
    monitoring:"Hepatotoxic in overdose or chronic EtOH; reduce max dose if hepatic impairment",
    tiers:[ ["Any eGFR","650–1000mg q6h (no renal adjustment)","ok"] ] },
  { id:"midaz", name:"Midazolam", cat:"analgesic", weightBased:true, hepatic:true,
    normal:"1–2.5mg IV slow push; titrate for procedural sedation", dialysis:"Reduce dose; accumulation risk",
    monitoring:"Active metabolite accumulates in renal failure; hepatic impairment prolongs effect",
    tiers:[ ["eGFR >60","1–2.5mg IV","ok"], ["eGFR 30–60","Start 1mg IV; titrate carefully","caution"], ["eGFR <30","0.5–1mg IV; expect prolonged effect","caution"] ] },

  // ── CARDIOVASCULAR ────────────────────────────────────────────────
  { id:"digoxin", name:"Digoxin", cat:"cardiovascular", weightBased:true, hepatic:false,
    normal:"0.125–0.25mg PO daily; IV load 0.25mg q6h × 3", dialysis:"HD: supplement 25–50% of daily dose post-HD",
    monitoring:"⚠️ Renally cleared — major toxicity risk in renal failure. Target level 0.5–0.9 ng/mL",
    tiers:[ ["eGFR >60","0.125–0.25mg daily","ok"], ["eGFR 30–60","0.125mg daily; check levels","caution"], ["eGFR 10–30","0.0625–0.125mg daily; close monitoring","caution"], ["eGFR <10","0.0625mg every other day; avoid if possible","avoid"] ] },
  { id:"metop", name:"Metoprolol", cat:"cardiovascular", weightBased:false, hepatic:true,
    normal:"25–100mg PO q12h; 5mg IV q5min × 3 (rate control)", dialysis:"No significant adjustment",
    monitoring:"Hepatic metabolism; minimal renal effect. Titrate to heart rate",
    tiers:[ ["Any eGFR","Standard dosing (no renal adjustment)","ok"] ] },
  { id:"amio", name:"Amiodarone", cat:"cardiovascular", weightBased:true, hepatic:true,
    normal:"150mg IV over 10min → 1 mg/min × 6h → 0.5 mg/min × 18h", dialysis:"No significant adjustment",
    monitoring:"Pulmonary, thyroid, hepatic, ocular toxicity with long-term use; minimal renal clearance",
    tiers:[ ["Any eGFR","Standard dosing (no renal adjustment)","ok"] ] },
  { id:"procain", name:"Procainamide", cat:"cardiovascular", weightBased:true, hepatic:false,
    normal:"20–50 mg/min IV load (max 17 mg/kg); 2–6 mg/min maintenance", dialysis:"Significant accumulation — avoid",
    monitoring:"⚠️ Active metabolite NAPA accumulates in renal failure → QTc prolongation, toxicity",
    tiers:[ ["eGFR >60","Full dose","ok"], ["eGFR 30–60","Reduce 25–50%; monitor NAPA levels","caution"], ["eGFR <30","Avoid — use amiodarone instead","avoid"] ] },
  { id:"sotalol", name:"Sotalol", cat:"cardiovascular", weightBased:false, hepatic:false,
    normal:"80–160mg PO q12h (hospital initiation required)", dialysis:"HD: 80mg after each session",
    monitoring:"⚠️ QTc monitoring required. Must initiate in hospital with telemetry. Avoid if eGFR <40",
    tiers:[ ["eGFR >60","80–160mg q12h","ok"], ["eGFR 40–60","80mg q24h","caution"], ["eGFR <40","Avoid — accumulation risk","avoid"] ] },
  { id:"atenolol", name:"Atenolol", cat:"cardiovascular", weightBased:false, hepatic:false,
    normal:"25–50mg PO daily", dialysis:"HD: 50mg after session",
    monitoring:"Renally cleared unlike most beta-blockers — dose reduction required",
    tiers:[ ["eGFR >35","25–50mg daily","ok"], ["eGFR 15–35","25mg daily","caution"], ["eGFR <15","12.5–25mg daily","caution"] ] },

  // ── ANTIEPILEPTICS ────────────────────────────────────────────────
  { id:"keppra", name:"Levetiracetam", cat:"antiepileptic", weightBased:false, hepatic:false,
    normal:"500–1500mg IV/PO q12h; load 2000–4500mg for status", dialysis:"HD: supplement 250–500mg after session",
    monitoring:"Primary renal clearance — significant dose adjustment needed",
    tiers:[ ["eGFR >80","500–1500mg q12h","ok"], ["eGFR 50–80","500–1000mg q12h","ok"], ["eGFR 30–50","250–750mg q12h","caution"], ["eGFR <30","250–500mg q12h","caution"] ] },
  { id:"pheny", name:"Phenytoin / Fosphenytoin", cat:"antiepileptic", weightBased:true, hepatic:true,
    normal:"Phenytoin: 20 mg/kg IV (max 50 mg/min); Fosphenytoin: 20 mg PE/kg", dialysis:"Not removed by HD",
    monitoring:"⚠️ Renal failure alters protein binding — free phenytoin levels required. Target free 1–2 mcg/mL",
    tiers:[ ["Any eGFR","Same load; monitor FREE phenytoin level (not total)","caution"] ] },
  { id:"valpro", name:"Valproate", cat:"antiepileptic", weightBased:true, hepatic:true,
    normal:"15–45 mg/kg/day (load 25–40 mg/kg IV for status)", dialysis:"Supplement after HD",
    monitoring:"⚠️ Hepatotoxic — avoid in liver disease. Protein binding altered in uremia",
    tiers:[ ["Any eGFR","Standard dose; renal failure alters free fraction — monitor levels","caution"] ] },
  { id:"lacosam", name:"Lacosamide", cat:"antiepileptic", weightBased:false, hepatic:false,
    normal:"200–400mg IV/PO q12h; load 200–400mg", dialysis:"Supplement 50% after HD",
    monitoring:"15% renal excretion; max dose in severe renal impairment is 300mg/day",
    tiers:[ ["eGFR >30","200–400mg q12h","ok"], ["eGFR <30","Max 300mg/day","caution"] ] },

  // ── METABOLIC & OTHER ─────────────────────────────────────────────
  { id:"metform", name:"Metformin", cat:"metabolic", weightBased:false, hepatic:true,
    normal:"500–1000mg PO BID/TID with meals", dialysis:"Contraindicated",
    monitoring:"⚠️ Risk of lactic acidosis in renal failure — hold for contrast, surgery, illness",
    tiers:[ ["eGFR >45","Full dose","ok"], ["eGFR 30–45","Use with caution; max 1000mg/day","caution"], ["eGFR <30","Contraindicated","avoid"] ] },
  { id:"gabapent", name:"Gabapentin", cat:"metabolic", weightBased:false, hepatic:false,
    normal:"300–1200mg PO q8h (pain/seizure)", dialysis:"HD: 200–300mg after each session",
    monitoring:"⚠️ Entirely renally cleared — major dose reductions required",
    tiers:[ ["eGFR >60","300–1200mg q8h","ok"], ["eGFR 30–60","200–700mg q12h","caution"], ["eGFR 15–30","200–700mg daily","caution"], ["eGFR <15","100–300mg daily","caution"] ] },
  { id:"pregabalin", name:"Pregabalin", cat:"metabolic", weightBased:false, hepatic:false,
    normal:"150–300mg PO q8–12h", dialysis:"HD: supplement 25–75mg after session",
    monitoring:"Renally cleared — reduce dose proportionally to CrCl",
    tiers:[ ["CrCl >60","150–300mg q8–12h","ok"], ["CrCl 30–60","75–150mg q12h","caution"], ["CrCl 15–30","25–75mg q12h","caution"], ["CrCl <15","25–75mg daily","caution"] ] },
  { id:"colch", name:"Colchicine", cat:"metabolic", weightBased:false, hepatic:true,
    normal:"1.2mg PO × 1, then 0.6mg 1h later (acute gout)", dialysis:"Use with extreme caution; dialysis removes minimally",
    monitoring:"⚠️ Life-threatening toxicity in severe renal failure — myopathy, bone marrow suppression",
    tiers:[ ["eGFR >60","Full dose","ok"], ["eGFR 30–60","No dose reduction for short course; avoid repeat dosing","caution"], ["eGFR <30","0.3mg single dose; avoid repeat","avoid"] ] },
  { id:"allopurinol", name:"Allopurinol", cat:"metabolic", weightBased:false, hepatic:false,
    normal:"100–300mg PO daily", dialysis:"HD: 100mg after session",
    monitoring:"Active metabolite oxypurinol accumulates — start low, titrate slowly",
    tiers:[ ["eGFR >60","100–300mg daily","ok"], ["eGFR 30–60","100–200mg daily","caution"], ["eGFR 10–30","100mg daily","caution"], ["eGFR <10","50–100mg daily","caution"] ] },
  { id:"lithium", name:"Lithium", cat:"metabolic", weightBased:false, hepatic:false,
    normal:"300–900mg PO q8–12h (outpatient titration)", dialysis:"HD: rebound after — dose after session",
    monitoring:"⚠️ Entirely renally cleared — narrow therapeutic index. Toxic >1.5 mEq/L. Avoid NSAIDs",
    tiers:[ ["eGFR >60","Standard dosing; levels q5–7d","ok"], ["eGFR 30–60","25–50% dose reduction; levels q3d","caution"], ["eGFR <30","Avoid unless no alternative; consult nephrology","avoid"] ] },
  { id:"nac", name:"N-Acetylcysteine (NAC)", cat:"metabolic", weightBased:true, hepatic:true,
    normal:"150 mg/kg IV over 1h → 50 mg/kg over 4h → 100 mg/kg over 16h", dialysis:"No adjustment",
    monitoring:"Anaphylactoid reaction risk with first infusion; slow if reaction occurs",
    tiers:[ ["Any eGFR","Full weight-based dose (no renal adjustment)","ok"] ] },
];

// ── CALCULATORS ───────────────────────────────────────────────────────
function calcCrCl({ age, weight, scr, sex, ibw }) {
  if (!age || !weight || !scr || scr <= 0) return null;
  const useWt = ibw && weight > ibw ? ibw : weight;
  const base = ((140 - age) * useWt) / (72 * scr);
  return sex === "F" ? base * 0.85 : base;
}

function calcIBW(heightCm, sex) {
  if (!heightCm) return null;
  const inchesOver60 = (heightCm / 2.54) - 60;
  if (inchesOver60 < 0) return sex === "M" ? 50 : 45.5;
  return (sex === "M" ? 50 : 45.5) + 2.3 * inchesOver60;
}

function calcABW(tbw, ibw) {
  if (!tbw || !ibw) return null;
  return ibw + 0.4 * (tbw - ibw);
}

function calcChildPugh(bili, alb, pt, ascites, enceph) {
  let score = 0;
  score += bili < 2 ? 1 : bili <= 3 ? 2 : 3;
  score += alb > 3.5 ? 1 : alb >= 2.8 ? 2 : 3;
  score += pt < 4 ? 1 : pt <= 6 ? 2 : 3;
  score += ascites === "none" ? 1 : ascites === "mild" ? 2 : 3;
  score += enceph === "none" ? 1 : enceph === "grade12" ? 2 : 3;
  return { score, cls: score <= 6 ? "A" : score <= 9 ? "B" : "C" };
}

function renalFlag(drug, crcl) {
  if (!crcl || drug.tiers.length === 0) return "ok";
  // Find the lowest tier with "avoid" or "caution" for this patient
  const t = getActiveTier(drug, crcl);
  return t ? t[2] : "ok";
}

function getActiveTier(drug, crcl) {
  if (!crcl) return drug.tiers[0] || null;
  for (const tier of drug.tiers) {
    const label = tier[0];
    if (label === "Any eGFR" || label === "Any CrCl") return tier;
    const nums = label.match(/[\d.]+/g)?.map(Number) || [];
    if (nums.length === 0) return tier;
    if (label.includes(">") && nums[0] && crcl > nums[0]) return tier;
    if (label.includes("<") && nums[0] && crcl < nums[0]) return tier;
    if (nums.length === 2) {
      const lo = Math.min(...nums); const hi = Math.max(...nums);
      if (crcl >= lo && crcl <= hi) return tier;
    }
  }
  return drug.tiers[drug.tiers.length - 1];
}

const FLAG_CFG = {
  ok:      { color:T.green,  label:"Normal Dose" },
  caution: { color:T.gold,   label:"Adjust Dose" },
  avoid:   { color:T.red,    label:"AVOID"       },
};

// ══════════════════════════════════════════════════════════════════════
//  MODULE-SCOPE PRIMITIVES
// ══════════════════════════════════════════════════════════════════════

function AmbientBg() {
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }}>
      {[
        { l:"10%", t:"15%", r:300, c:"rgba(0,229,192,0.05)"   },
        { l:"88%", t:"10%", r:260, c:"rgba(59,158,255,0.05)"  },
        { l:"75%", t:"78%", r:340, c:"rgba(155,109,255,0.04)" },
        { l:"20%", t:"78%", r:220, c:"rgba(245,200,66,0.04)"  },
      ].map((o,i) => (
        <div key={i} style={{
          position:"absolute", left:o.l, top:o.t,
          width:o.r*2, height:o.r*2, borderRadius:"50%",
          background:`radial-gradient(circle,${o.c} 0%,transparent 68%)`,
          transform:"translate(-50%,-50%)",
          animation:`${PREFIX}orb${i%3} ${8+i*1.3}s ease-in-out infinite`,
        }}/>
      ))}
    </div>
  );
}

function HubBadge({ onBack }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:9 }}>
      <div style={{
        backdropFilter:"blur(40px)", WebkitBackdropFilter:"blur(40px)",
        background:"rgba(5,15,30,0.9)", border:"1px solid rgba(42,79,122,0.6)",
        borderRadius:10, padding:"5px 12px", display:"flex", alignItems:"center", gap:8,
      }}>
        <span style={{ fontFamily:"JetBrains Mono", fontSize:10, color:T.gold, letterSpacing:3 }}>NOTRYA</span>
        <span style={{ color:T.txt4, fontFamily:"JetBrains Mono", fontSize:10 }}>/</span>
        <span style={{ fontFamily:"JetBrains Mono", fontSize:10, color:T.txt3, letterSpacing:2 }}>SMART DOSING</span>
      </div>
      <div style={{ height:1, flex:1, background:"linear-gradient(90deg,rgba(0,229,192,0.5),transparent)" }}/>
      {onBack && (
        <button onClick={onBack} style={{
          fontFamily:"DM Sans", fontSize:11, fontWeight:600, padding:"5px 14px",
          borderRadius:8, cursor:"pointer", border:"1px solid rgba(42,79,122,0.5)",
          background:"rgba(14,37,68,0.6)", color:T.txt3,
        }}>← Hub</button>
      )}
    </div>
  );
}

function Toast({ msg }) {
  return (
    <div style={{
      position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)",
      background:"rgba(8,22,40,0.96)", border:"1px solid rgba(0,229,192,0.4)",
      borderRadius:10, padding:"10px 20px", fontFamily:"DM Sans",
      fontWeight:600, fontSize:13, color:T.teal, zIndex:99999,
      pointerEvents:"none", animation:`${PREFIX}fade .2s ease both`,
    }}>{msg}</div>
  );
}

function IField({ label, value, onChange, placeholder, type, unit, small }) {
  return (
    <div>
      <div style={{
        fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700, color:T.txt4,
        letterSpacing:1.5, textTransform:"uppercase", marginBottom:4,
      }}>{label}</div>
      <div style={{ position:"relative", display:"flex", alignItems:"center" }}>
        <input type={type||"number"} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder||""}
          style={{
            background:"rgba(14,37,68,0.8)",
            border:`1px solid ${value ? "rgba(0,229,192,0.35)" : "rgba(42,79,122,0.4)"}`,
            borderRadius:8, padding: unit ? "7px 36px 7px 11px" : "7px 11px",
            fontFamily:"DM Sans", fontSize: small ? 11 : 13, color:T.txt,
            outline:"none", width:"100%", transition:"border-color .12s",
          }}
        />
        {unit && (
          <span style={{ position:"absolute", right:10, fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4 }}>
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

function DrugCard({ drug, crcl, expanded, onToggle }) {
  const cat     = CATS[drug.cat] || { color:T.teal, label:"Other" };
  const active  = getActiveTier(drug, crcl);
  const flag    = active ? active[2] : "ok";
  const fcfg    = FLAG_CFG[flag];

  return (
    <div className={`${PREFIX}-fade`} style={{
      ...glass, overflow:"hidden",
      border:`1px solid rgba(42,79,122,0.35)`,
      borderLeft:`3px solid ${fcfg.color}`,
      background: flag === "avoid"
        ? `linear-gradient(135deg,${T.red}09,rgba(8,22,40,0.82))`
        : flag === "caution"
        ? `linear-gradient(135deg,${T.gold}07,rgba(8,22,40,0.82))`
        : "rgba(8,22,40,0.78)",
    }}>
      {/* Card header — always visible */}
      <div
        onClick={onToggle}
        style={{
          padding:"10px 12px", cursor:"pointer",
          display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8,
        }}
      >
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:7, flexWrap:"wrap", marginBottom:4 }}>
            <span style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:13, color:T.txt }}>
              {drug.name}
            </span>
            <span style={{
              fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700,
              padding:"1px 6px", borderRadius:20,
              background:`${cat.color}14`, border:`1px solid ${cat.color}30`,
              color:cat.color, letterSpacing:.5,
            }}>{cat.label.toUpperCase()}</span>
            {drug.weightBased && (
              <span style={{
                fontFamily:"JetBrains Mono", fontSize:7, color:T.purple,
                background:`${T.purple}12`, border:`1px solid ${T.purple}25`,
                padding:"1px 6px", borderRadius:20,
              }}>WT-BASED</span>
            )}
            {drug.hepatic && (
              <span style={{
                fontFamily:"JetBrains Mono", fontSize:7, color:T.orange,
                background:`${T.orange}12`, border:`1px solid ${T.orange}25`,
                padding:"1px 6px", borderRadius:20,
              }}>HEPATIC</span>
            )}
          </div>
          {/* Active dose for this patient */}
          {active && (
            <div style={{
              fontFamily:"DM Sans", fontWeight:700,
              fontSize:crcl ? 13 : 11,
              color: crcl ? fcfg.color : T.txt2,
              lineHeight:1.3,
            }}>
              {crcl ? (
                <>
                  <span style={{ fontSize:9, color:fcfg.color, fontFamily:"JetBrains Mono", marginRight:5 }}>
                    {active[0]}
                  </span>
                  {active[1]}
                </>
              ) : drug.normal}
            </div>
          )}
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4, flexShrink:0 }}>
          <span style={{
            fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700,
            padding:"2px 7px", borderRadius:20,
            background:`${fcfg.color}18`, border:`1px solid ${fcfg.color}40`,
            color:fcfg.color,
          }}>{crcl ? fcfg.label : "ENTER PT"}</span>
          <span style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4 }}>
            {expanded ? "▲" : "▼"}
          </span>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className={`${PREFIX}-fade`} style={{ borderTop:"1px solid rgba(42,79,122,0.25)", padding:"10px 12px" }}>
          {/* Renal tiers */}
          <div style={{ marginBottom:8 }}>
            <div style={{
              fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700, color:T.txt4,
              letterSpacing:1.5, textTransform:"uppercase", marginBottom:5,
            }}>Renal Dosing Tiers</div>
            <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
              {drug.tiers.map((tier, i) => {
                const isActive = active && tier[0] === active[0];
                const fc = FLAG_CFG[tier[2]] || FLAG_CFG.ok;
                return (
                  <div key={i} style={{
                    display:"flex", alignItems:"baseline", gap:8, padding:"5px 9px",
                    borderRadius:7, transition:"all .1s",
                    background: isActive ? `${fc.color}16` : "rgba(14,37,68,0.3)",
                    border:`1px solid ${isActive ? fc.color+"40" : "transparent"}`,
                  }}>
                    <span style={{
                      fontFamily:"JetBrains Mono", fontSize:9, fontWeight:700,
                      color: isActive ? fc.color : T.txt4, minWidth:80, flexShrink:0,
                    }}>{tier[0]}</span>
                    <span style={{
                      fontFamily:"DM Sans", fontSize:12, fontWeight: isActive ? 600 : 400,
                      color: isActive ? T.txt : T.txt3, flex:1,
                    }}>{tier[1]}</span>
                    {isActive && crcl && (
                      <span style={{
                        fontFamily:"JetBrains Mono", fontSize:7, color:fc.color,
                        background:`${fc.color}14`, border:`1px solid ${fc.color}30`,
                        padding:"1px 6px", borderRadius:10, flexShrink:0,
                      }}>CURRENT PT</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dialysis row */}
          <div style={{ marginBottom:6 }}>
            <div style={{
              fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700, color:T.blue,
              letterSpacing:1.5, textTransform:"uppercase", marginBottom:3,
            }}>Dialysis / CRRT</div>
            <div style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt2 }}>{drug.dialysis}</div>
          </div>

          {/* Monitoring */}
          <div style={{
            ...glass, padding:"8px 10px", borderRadius:9,
            background:`${T.gold}07`, border:`1px solid ${T.gold}1e`,
            borderLeft:`3px solid ${T.gold}`,
          }}>
            <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt2, lineHeight:1.5 }}>
              {drug.monitoring}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Calculators Tab ───────────────────────────────────────────────────
function CalcTab({ pt }) {
  const [cpBili,    setCpBili]    = useState("");
  const [cpAlb,     setCpAlb]     = useState("");
  const [cpPt,      setCpPt]      = useState("");
  const [cpAscites, setCpAscites] = useState("none");
  const [cpEnceph,  setCpEnceph]  = useState("none");

  const crcl = useMemo(() => calcCrCl(pt), [pt]);
  const ibw  = useMemo(() => calcIBW(pt.height, pt.sex), [pt.height, pt.sex]);
  const abw  = useMemo(() => {
    if (!ibw || !pt.weight) return null;
    return pt.weight > ibw ? calcABW(parseFloat(pt.weight), ibw) : null;
  }, [ibw, pt.weight]);

  const cp = useMemo(() => {
    if (!cpBili || !cpAlb || !cpPt) return null;
    return calcChildPugh(parseFloat(cpBili), parseFloat(cpAlb), parseFloat(cpPt), cpAscites, cpEnceph);
  }, [cpBili, cpAlb, cpPt, cpAscites, cpEnceph]);

  const cpCls = cp ? { A:T.green, B:T.gold, C:T.red }[cp.cls] : T.teal;

  function MetricRow({ label, value, unit, color, note }) {
    return (
      <div style={{
        ...glass, padding:"10px 14px", borderRadius:10,
        borderLeft:`3px solid ${color}`,
        background:`${color}08`,
        display:"flex", alignItems:"center", justifyContent:"space-between",
      }}>
        <div>
          <div style={{ fontFamily:"JetBrains Mono", fontSize:8, color:T.txt4, letterSpacing:1.5, textTransform:"uppercase" }}>{label}</div>
          {note && <div style={{ fontFamily:"DM Sans", fontSize:10, color:T.txt4, marginTop:1 }}>{note}</div>}
        </div>
        <div style={{ textAlign:"right" }}>
          <span style={{ fontFamily:"JetBrains Mono", fontWeight:700, fontSize:20, color }}>
            {value !== null && value !== undefined ? Math.round(value * 10)/10 : "—"}
          </span>
          {unit && <span style={{ fontFamily:"DM Sans", fontSize:10, color:T.txt4, marginLeft:4 }}>{unit}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className={`${PREFIX}-fade`} style={{ display:"flex", flexDirection:"column", gap:14 }}>

      {/* Renal metrics */}
      <div>
        <div style={{
          fontFamily:"JetBrains Mono", fontSize:9, fontWeight:700, color:T.teal,
          letterSpacing:2, textTransform:"uppercase", marginBottom:8,
        }}>Renal Function</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
          <MetricRow label="Cockcroft-Gault CrCl" value={crcl} unit="mL/min" color={!crcl ? T.txt4 : crcl > 60 ? T.green : crcl > 30 ? T.gold : T.red} note="Used for drug dosing"/>
          <MetricRow label="IBW" value={ibw} unit="kg" color={T.blue} note="Male: 50+2.3×in>60"/>
          {abw && <MetricRow label="Adjusted Body Wt" value={abw} unit="kg" color={T.purple} note="IBW + 0.4×(TBW−IBW)"/>}
          {pt.weight && ibw && (
            <MetricRow
              label="BMI" unit="kg/m²" color={T.teal}
              value={pt.height ? (parseFloat(pt.weight) / Math.pow(pt.height/100, 2)) : null}
              note="Weight / height²"
            />
          )}
        </div>
        {!pt.age || !pt.weight || !pt.scr ? (
          <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt4, marginTop:8, textAlign:"center" }}>
            Enter patient parameters above to calculate renal function
          </div>
        ) : null}
      </div>

      {/* CrCl interpretation */}
      {crcl && (
        <div style={{
          ...glass, padding:"10px 14px",
          borderLeft:`3px solid ${crcl >= 60 ? T.green : crcl >= 30 ? T.gold : T.red}`,
        }}>
          <div style={{
            fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700, letterSpacing:1.5,
            color: crcl >= 60 ? T.green : crcl >= 30 ? T.gold : T.red,
            textTransform:"uppercase", marginBottom:4,
          }}>
            {crcl >= 60 ? "Normal Renal Function" : crcl >= 30 ? "Moderate CKD — Dose Adjustments Required" : "Severe CKD — Major Adjustments / Avoid Many Drugs"}
          </div>
          <div style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt2 }}>
            {crcl >= 60
              ? "Standard dosing applies for most agents."
              : crcl >= 30
              ? "Review renal dosing for antibiotics, anticoagulants, and renally cleared drugs."
              : "Avoid NSAIDs, metformin, LMWH, colchicine, sotalol, and procainamide. Prefer UFH, fentanyl, and hepatically cleared agents."}
          </div>
        </div>
      )}

      {/* Child-Pugh */}
      <div>
        <div style={{
          fontFamily:"JetBrains Mono", fontSize:9, fontWeight:700, color:T.orange,
          letterSpacing:2, textTransform:"uppercase", marginBottom:8,
        }}>Child-Pugh Hepatic Score (optional)</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6, marginBottom:8 }}>
          <IField label="Bilirubin" value={cpBili} onChange={setCpBili} unit="mg/dL" small/>
          <IField label="Albumin"   value={cpAlb}  onChange={setCpAlb}  unit="g/dL" small/>
          <IField label="PT Excess" value={cpPt}   onChange={setCpPt}   unit="sec"  small/>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:8 }}>
          {[
            { label:"Ascites", val:cpAscites, set:setCpAscites, opts:[["none","None"],["mild","Mild"],["severe","Tense"]] },
            { label:"Encephalopathy", val:cpEnceph, set:setCpEnceph, opts:[["none","None"],["grade12","Grade 1–2"],["grade34","Grade 3–4"]] },
          ].map(({ label, val, set, opts }) => (
            <div key={label}>
              <div style={{
                fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700, color:T.txt4,
                letterSpacing:1.5, textTransform:"uppercase", marginBottom:4,
              }}>{label}</div>
              <div style={{ display:"flex", gap:4 }}>
                {opts.map(([k, l]) => (
                  <button key={k} onClick={() => set(k)} style={{
                    flex:1, fontFamily:"DM Sans", fontSize:10, fontWeight:600,
                    padding:"5px 4px", borderRadius:7, cursor:"pointer",
                    border:`1px solid ${val===k ? T.orange+"55" : "rgba(42,79,122,0.35)"}`,
                    background: val===k ? `${T.orange}14` : "transparent",
                    color: val===k ? T.orange : T.txt3,
                  }}>{l}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
        {cp && (
          <div style={{
            ...glass, padding:"12px 14px", borderLeft:`3px solid ${cpCls}`,
            background:`${cpCls}09`,
            display:"flex", alignItems:"center", justifyContent:"space-between",
          }}>
            <div>
              <div style={{ fontFamily:"JetBrains Mono", fontSize:8, color:T.txt4, letterSpacing:1.5, textTransform:"uppercase" }}>Child-Pugh Class</div>
              <div style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt2, marginTop:2 }}>
                { cp.cls === "A" ? "Mild — standard hepatic dosing" : cp.cls === "B" ? "Moderate — reduce dose for hepatically metabolized drugs" : "Severe — avoid valproate, azithromycin, metronidazole; major reductions" }
              </div>
            </div>
            <div style={{ fontFamily:"JetBrains Mono", fontWeight:700, fontSize:36, color:cpCls, letterSpacing:-1 }}>
              {cp.cls}<span style={{ fontSize:16, color:T.txt4 }}> ({cp.score})</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── AI Consult Tab ────────────────────────────────────────────────────
function AIConsultTab({ pt, crcl, ibw }) {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [busy,     setBusy]     = useState(false);

  async function handleAsk() {
    if (!question.trim()) return;
    setBusy(true);
    setResponse("");
    try {
      const context = [
        pt.age     ? `Age: ${pt.age}y` : "",
        pt.sex     ? `Sex: ${pt.sex}` : "",
        pt.weight  ? `Weight: ${pt.weight}kg` : "",
        pt.height  ? `Height: ${pt.height}cm` : "",
        pt.scr     ? `SCr: ${pt.scr} mg/dL` : "",
        crcl       ? `CrCl (CG): ${Math.round(crcl)} mL/min` : "",
        ibw        ? `IBW: ${Math.round(ibw)}kg` : "",
        pt.dialysis ? "On dialysis (HD/CRRT)" : "",
        pt.hepatic  ? `Hepatic impairment: ${pt.hepatic}` : "",
      ].filter(Boolean).join(", ");

      const prompt = `You are a clinical pharmacist expert in emergency medicine. Answer concisely and clinically.

Patient context: ${context || "No patient parameters entered"}

Question: ${question}

Respond with: 1) Direct answer/recommendation, 2) Key dosing numbers if relevant, 3) Primary safety concern. Use plain clinical language. Limit to 150 words.`;

      const res = await InvokeLLM({ prompt, add_context_from_previous_calls: false });
      setResponse(typeof res === "string" ? res : res?.content || "No response");
    } catch {
      setResponse("AI consult unavailable. Please consult clinical pharmacist.");
    } finally {
      setBusy(false);
    }
  }

  const QUICK = [
    "What's the safest opioid for this patient?",
    "Which antibiotics should I avoid?",
    "Can I use enoxaparin for VTE treatment?",
    "What's the vancomycin dosing strategy?",
    "Anticoagulation for new AF in this patient?",
    "Any contrast nephropathy concern?",
  ];

  return (
    <div className={`${PREFIX}-fade`} style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <div style={{
        ...glass, padding:"10px 14px",
        borderLeft:`3px solid ${T.purple}`,
        background:`${T.purple}07`,
      }}>
        <div style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt2 }}>
          AI Pharmacist consult — patient context is automatically included. Ask about specific drugs, interactions, or dosing strategies.
        </div>
      </div>

      {/* Quick prompts */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
        {QUICK.map(q => (
          <button key={q} onClick={() => setQuestion(q)} style={{
            fontFamily:"DM Sans", fontWeight:500, fontSize:10,
            padding:"4px 10px", borderRadius:20, cursor:"pointer",
            border:`1px solid ${T.purple}28`, background:`${T.purple}08`, color:T.txt3,
            transition:"all .1s",
          }}>{q}</button>
        ))}
      </div>

      <textarea
        value={question} onChange={e => setQuestion(e.target.value)}
        placeholder="Ask about dosing, interactions, renal/hepatic adjustments, drug selection..."
        rows={3}
        style={{
          background:"rgba(14,37,68,0.8)",
          border:`1px solid ${question ? T.purple+"45" : "rgba(42,79,122,0.4)"}`,
          borderRadius:10, padding:"10px 12px",
          fontFamily:"DM Sans", fontSize:13, color:T.txt,
          outline:"none", width:"100%", resize:"vertical", lineHeight:1.5,
          transition:"border-color .12s",
        }}
      />
      <button
        onClick={handleAsk}
        disabled={!question.trim() || busy}
        style={{
          fontFamily:"DM Sans", fontWeight:700, fontSize:13,
          padding:"11px", borderRadius:9,
          cursor: question.trim() && !busy ? "pointer" : "not-allowed",
          border:`1px solid ${T.purple}40`, background:`${T.purple}12`, color:T.purple,
          opacity: !question.trim() || busy ? 0.55 : 1, transition:"opacity .12s",
        }}>
        {busy ? "Consulting..." : "Ask AI Pharmacist"}
      </button>

      {busy && (
        <div className={`${PREFIX}-pulse`} style={{
          ...glass, padding:"20px", textAlign:"center",
          display:"flex", flexDirection:"column", alignItems:"center", gap:8,
        }}>
          <span style={{ fontFamily:"DM Sans", fontSize:12, color:T.purple }}>Calculating...</span>
        </div>
      )}

      {response && !busy && (
        <div className={`${PREFIX}-fade`} style={{
          ...glass, padding:"14px",
          borderLeft:`3px solid ${T.teal}`,
          background:`${T.teal}06`,
        }}>
          <div style={{
            fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700, color:T.teal,
            letterSpacing:1.5, textTransform:"uppercase", marginBottom:8,
          }}>AI Pharmacist Response</div>
          <div style={{ fontFamily:"DM Sans", fontSize:13, color:T.txt2, lineHeight:1.7 }}>
            {response}
          </div>
          <div style={{ fontFamily:"DM Sans", fontSize:10, color:T.txt4, marginTop:8 }}>
            ⚠️ AI-generated — verify against clinical resources. Not a substitute for pharmacist consult.
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  MAIN EXPORT
// ══════════════════════════════════════════════════════════════════════

export default function SmartDosingHub({ onBack }) {
  const [pt, setPt] = useState({ age:"", weight:"", height:"", sex:"M", scr:"", dialysis:false, hepatic:"" });
  const [tab,      setTab]      = useState("drugs");
  const [catFilter,setCatFilter]= useState("all");
  const [search,   setSearch]   = useState("");
  const [expanded, setExpanded] = useState({});
  const [toast,    setToast]    = useState("");

  const showToast = useCallback((msg) => { setToast(msg); setTimeout(() => setToast(""), 2000); }, []);

  function setPtField(k, v) { setPt(prev => ({ ...prev, [k]:v })); }
  function toggleExpand(id) { setExpanded(prev => ({ ...prev, [id]:!prev[id] })); }

  const crcl = useMemo(() => {
    const ibw = calcIBW(parseFloat(pt.height)||0, pt.sex);
    return calcCrCl({ age:parseFloat(pt.age), weight:parseFloat(pt.weight), scr:parseFloat(pt.scr), sex:pt.sex, ibw });
  }, [pt]);

  const ibw = useMemo(() => calcIBW(parseFloat(pt.height)||0, pt.sex), [pt.height, pt.sex]);

  const filtered = useMemo(() => {
    let list = DRUGS;
    if (catFilter !== "all") list = list.filter(d => d.cat === catFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(d => d.name.toLowerCase().includes(q) || d.cat.includes(q));
    }
    // Sort: avoid first, then caution, then ok
    const rank = { avoid:0, caution:1, ok:2 };
    return [...list].sort((a, b) => (rank[renalFlag(a, crcl)] ?? 2) - (rank[renalFlag(b, crcl)] ?? 2));
  }, [catFilter, search, crcl]);

  const avoidCount   = useMemo(() => DRUGS.filter(d => renalFlag(d, crcl) === "avoid").length, [crcl]);
  const cautionCount = useMemo(() => DRUGS.filter(d => renalFlag(d, crcl) === "caution").length, [crcl]);

  const TABS = [
    { id:"drugs",   label:"Drug Library",  icon:"💊" },
    { id:"calcs",   label:"Calculators",   icon:"📐" },
    { id:"ai",      label:"AI Pharmacist", icon:"🤖" },
  ];

  const sField = {
    background:"rgba(14,37,68,0.8)", borderRadius:8, padding:"7px 11px",
    fontFamily:"DM Sans", fontSize:12, color:T.txt, outline:"none",
    transition:"border-color .12s",
  };

  return (
    <div style={{
      fontFamily:"DM Sans, sans-serif", background:T.bg, minHeight:"100vh",
      position:"relative", overflowX:"hidden", color:T.txt,
    }}>
      <AmbientBg/>
      {toast && <Toast msg={toast}/>}

      <div style={{ position:"relative", zIndex:1, maxWidth:1400, margin:"0 auto", padding:"0 16px" }}>

        {/* Header */}
        <div style={{ padding:"18px 0 14px" }}>
          <HubBadge onBack={onBack}/>
          <h1 className={`${PREFIX}-shim`} style={{
            fontFamily:"Playfair Display", fontSize:"clamp(22px,3.5vw,36px)",
            fontWeight:900, letterSpacing:-1, lineHeight:1.1, marginBottom:4,
          }}>Smart Dosing Hub</h1>
          <p style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt3 }}>
            Patient-specific renal · hepatic · weight-based dosing · {DRUGS.length} ED drugs · No alert noise
          </p>
        </div>

        {/* ── Patient Parameter Banner ─────────────────────────── */}
        <div style={{ ...glass, padding:"12px 14px", marginBottom:14 }}>
          <div style={{
            fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700, color:T.teal,
            letterSpacing:2, textTransform:"uppercase", marginBottom:10,
          }}>Patient Parameters</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(100px,1fr))", gap:8, marginBottom:10 }}>
            <IField label="Age" value={pt.age} onChange={v => setPtField("age",v)} unit="yr"/>
            <IField label="Weight (TBW)" value={pt.weight} onChange={v => setPtField("weight",v)} unit="kg"/>
            <IField label="Height" value={pt.height} onChange={v => setPtField("height",v)} unit="cm"/>
            <IField label="Creatinine" value={pt.scr} onChange={v => setPtField("scr",v)} unit="mg/dL"/>
            <div>
              <div style={{
                fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700, color:T.txt4,
                letterSpacing:1.5, textTransform:"uppercase", marginBottom:4,
              }}>Sex</div>
              <div style={{ display:"flex", gap:4 }}>
                {["M","F"].map(s => (
                  <button key={s} onClick={() => setPtField("sex",s)} style={{
                    flex:1, fontFamily:"JetBrains Mono", fontSize:11, fontWeight:700,
                    padding:"7px", borderRadius:8, cursor:"pointer",
                    border:`1px solid ${pt.sex===s ? T.blue+"55" : "rgba(42,79,122,0.35)"}`,
                    background: pt.sex===s ? `${T.blue}14` : "transparent",
                    color: pt.sex===s ? T.blue : T.txt3,
                  }}>{s}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Computed metrics + flags row */}
          <div style={{ display:"flex", alignItems:"center", flexWrap:"wrap", gap:8 }}>
            {crcl !== null && (
              <div style={{
                display:"flex", alignItems:"center", gap:6,
                padding:"5px 12px", borderRadius:20,
                border:`1px solid ${crcl >= 60 ? T.green : crcl >= 30 ? T.gold : T.red}30`,
                background:`${crcl >= 60 ? T.green : crcl >= 30 ? T.gold : T.red}0d`,
              }}>
                <span style={{
                  fontFamily:"JetBrains Mono", fontWeight:700, fontSize:13,
                  color: crcl >= 60 ? T.green : crcl >= 30 ? T.gold : T.red,
                }}>{Math.round(crcl)}</span>
                <span style={{ fontFamily:"DM Sans", fontSize:10, color:T.txt4 }}>mL/min CrCl</span>
              </div>
            )}
            {ibw !== null && (
              <div style={{ padding:"5px 12px", borderRadius:20, border:`1px solid ${T.blue}20`, background:`${T.blue}08` }}>
                <span style={{ fontFamily:"JetBrains Mono", fontSize:12, fontWeight:700, color:T.blue }}>{Math.round(ibw)}</span>
                <span style={{ fontFamily:"DM Sans", fontSize:10, color:T.txt4, marginLeft:4 }}>kg IBW</span>
              </div>
            )}
            {crcl !== null && avoidCount > 0 && (
              <div style={{ padding:"5px 12px", borderRadius:20, border:`1px solid ${T.red}30`, background:`${T.red}0d` }}>
                <span style={{ fontFamily:"JetBrains Mono", fontSize:11, fontWeight:700, color:T.red }}>{avoidCount} AVOID</span>
              </div>
            )}
            {crcl !== null && cautionCount > 0 && (
              <div style={{ padding:"5px 12px", borderRadius:20, border:`1px solid ${T.gold}30`, background:`${T.gold}0d` }}>
                <span style={{ fontFamily:"JetBrains Mono", fontSize:11, fontWeight:700, color:T.gold }}>{cautionCount} ADJUST</span>
              </div>
            )}
            {/* Dialysis toggle */}
            <button onClick={() => setPtField("dialysis", !pt.dialysis)} style={{
              padding:"5px 12px", borderRadius:20, cursor:"pointer",
              border:`1px solid ${pt.dialysis ? T.purple+"55" : "rgba(42,79,122,0.35)"}`,
              background: pt.dialysis ? `${T.purple}14` : "transparent",
              fontFamily:"JetBrains Mono", fontSize:9, fontWeight:700,
              color: pt.dialysis ? T.purple : T.txt4,
            }}>{pt.dialysis ? "✓ DIALYSIS" : "+ Dialysis"}</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ ...glass, padding:"5px", display:"flex", gap:4, marginBottom:14 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex:"1 1 auto", fontFamily:"DM Sans", fontWeight:600, fontSize:12,
              padding:"9px 8px", borderRadius:9, cursor:"pointer", textAlign:"center", transition:"all .15s",
              border:`1px solid ${tab===t.id ? T.teal+"50" : "transparent"}`,
              background: tab===t.id ? `linear-gradient(135deg,${T.teal}16,${T.teal}06)` : "transparent",
              color: tab===t.id ? T.teal : T.txt3,
            }}>{t.icon} {t.label}</button>
          ))}
        </div>

        {/* ── DRUG LIBRARY TAB ─────────────────────────────────── */}
        {tab === "drugs" && (
          <div className={`${PREFIX}-fade`}>
            {/* Filter + search */}
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center", marginBottom:12 }}>
              <div style={{ display:"flex", gap:4, flexWrap:"wrap", flex:1 }}>
                <button onClick={() => setCatFilter("all")} style={{
                  fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700, padding:"4px 10px",
                  borderRadius:20, cursor:"pointer", textTransform:"uppercase", letterSpacing:1,
                  border:`1px solid ${catFilter==="all" ? T.teal+"66" : T.teal+"22"}`,
                  background: catFilter==="all" ? `${T.teal}14` : `${T.teal}04`, color: catFilter==="all" ? T.teal : T.txt3,
                }}>All ({DRUGS.length})</button>
                {Object.entries(CATS).map(([k, v]) => {
                  const ct = DRUGS.filter(d => d.cat === k).length;
                  return (
                    <button key={k} onClick={() => setCatFilter(k)} style={{
                      fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700, padding:"4px 10px",
                      borderRadius:20, cursor:"pointer", textTransform:"uppercase", letterSpacing:1,
                      border:`1px solid ${catFilter===k ? v.color+"66" : v.color+"22"}`,
                      background: catFilter===k ? `${v.color}14` : `${v.color}05`,
                      color: catFilter===k ? v.color : T.txt3,
                    }}>{v.label} ({ct})</button>
                  );
                })}
              </div>
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search drugs..."
                style={{
                  ...sField,
                  border:`1px solid ${search ? T.teal+"44" : "rgba(42,79,122,0.35)"}`,
                  width:160,
                }}
              />
            </div>

            {/* Drug grid */}
            <div style={{
              display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",
              gap:10, marginBottom:24,
            }}>
              {filtered.map(drug => (
                <DrugCard
                  key={drug.id} drug={drug} crcl={crcl}
                  expanded={!!expanded[drug.id]}
                  onToggle={() => toggleExpand(drug.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── CALCULATORS TAB ──────────────────────────────────── */}
        {tab === "calcs" && (
          <div className={`${PREFIX}-fade`} style={{ maxWidth:600, marginBottom:24 }}>
            <CalcTab pt={pt}/>
          </div>
        )}

        {/* ── AI CONSULT TAB ───────────────────────────────────── */}
        {tab === "ai" && (
          <div className={`${PREFIX}-fade`} style={{ maxWidth:600, marginBottom:24 }}>
            <AIConsultTab pt={pt} crcl={crcl} ibw={ibw}/>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign:"center", paddingBottom:24 }}>
          <span style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4, letterSpacing:1.5 }}>
            NOTRYA · SMART DOSING HUB · CLINICAL DECISION SUPPORT ONLY · VERIFY WITH PHARMACIST
          </span>
        </div>

      </div>
    </div>
  );
}