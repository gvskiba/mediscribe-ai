import { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import SaveCaseModal from "../components/medicationreference/SaveCaseModal";
import SavedCasesPanel from "../components/medicationreference/SavedCasesPanel";
import WeightWidget from "../components/medicationreference/WeightWidget";
import DrugInteractionChecker from "../components/medicationreference/DrugInteractionChecker";
import ERConditions from "../components/medicationreference/ERConditions";
import SepsisProtocol from "../components/medicationreference/SepsisProtocol";
import MedRow from "../components/medicationreference/MedRow";

/* ═══════════════════════════════════════════════════════════════
   CATEGORIES & HELPERS (original)
═══════════════════════════════════════════════════════════════ */
const CATEGORIES = [
  { id: "all",      label: "All",            icon: "💊", color: "#00c4a0" },
  { id: "anticoag", label: "Anticoagulants", icon: "🩸", color: "#ef4444" },
  { id: "cardiac",  label: "Cardiac",        icon: "🫀", color: "#f97316" },
  { id: "psych",    label: "Psychiatric",    icon: "🧠", color: "#8b5cf6" },
  { id: "analgesic",label: "Analgesics",     icon: "🩹", color: "#fb7185" },
  { id: "abx",      label: "Antibiotics",    icon: "🦠", color: "#22c55e" },
  { id: "gi",       label: "GI",             icon: "💊", color: "#f59e0b" },
  { id: "other",    label: "Other",          icon: "⚗️", color: "#06b6d4" },
];
const CAT_COLOR = Object.fromEntries(CATEGORIES.map(c => [c.id, c.color]));

function estimateWeight(mo) {
  if (mo < 3) return 3.5 + mo * 0.9;
  if (mo < 12) return 6 + (mo - 3) * 0.5;
  const y = mo / 12;
  if (y <= 2) return 10 + (y - 1) * 2.5;
  return y * 3 + 7;
}
function getBroselow(w) {
  if (w < 5)  return { zone: "Grey",   hex: "#9ca3af" };
  if (w < 7)  return { zone: "Pink",   hex: "#ec4899" };
  if (w < 9)  return { zone: "Red",    hex: "#ef4444" };
  if (w < 11) return { zone: "Purple", hex: "#8b5cf6" };
  if (w < 14) return { zone: "Yellow", hex: "#eab308" };
  if (w < 18) return { zone: "White",  hex: "#e2e8f0" };
  if (w < 23) return { zone: "Blue",   hex: "#3b82f6" };
  if (w < 29) return { zone: "Orange", hex: "#f97316" };
  if (w < 36) return { zone: "Green",  hex: "#22c55e" };
  return { zone: "Adult", hex: "#6b7280" };
}

/* ═══════════════════════════════════════════════════════════════
   ED QUICK REFERENCE — Hardcoded Drugs_DB (10 categories, 64 drugs)
═══════════════════════════════════════════════════════════════ */
const ED_DRUGS = {
  chestPain:{label:"Chest Pain / ACS",icon:"🫀",drugs:[
    {name:"Aspirin",dose:"325 mg",route:"PO",notes:"Chew immediately. Non-enteric coated preferred.",class:"Antiplatelet",onset:"15-30 min"},
    {name:"Nitroglycerin",dose:"0.4 mg SL",route:"SL",notes:"Repeat q5min x3. Hold if SBP <90. Avoid with PDE5 inhibitors within 24-48h.",class:"Vasodilator",onset:"1-3 min"},
    {name:"Heparin",dose:"60 U/kg bolus (max 4000U), 12 U/kg/hr drip",route:"IV",notes:"Check aPTT at 6h. Target 1.5-2.5x control.",class:"Anticoagulant",onset:"Immediate"},
    {name:"Morphine",dose:"2-4 mg IV",route:"IV",notes:"Titrate for pain. Monitor respirations. Use with caution—may increase mortality in NSTEMI.",class:"Opioid Analgesic",onset:"5-10 min"},
    {name:"Ticagrelor",dose:"180 mg loading",route:"PO",notes:"Preferred over clopidogrel per AHA guidelines. Avoid with strong CYP3A4 inhibitors.",class:"P2Y12 Inhibitor",onset:"30 min"},
    {name:"Clopidogrel",dose:"600 mg loading",route:"PO",notes:"Alternative if ticagrelor contraindicated.",class:"P2Y12 Inhibitor",onset:"2-6 hrs"},
    {name:"Metoprolol",dose:"5 mg IV q5min x3, then 25-50 mg PO",route:"IV/PO",notes:"Hold if HR <60, SBP <100, or signs of CHF. Avoid in cocaine-related chest pain.",class:"Beta-Blocker",onset:"5 min IV"},
  ]},
  anaphylaxis:{label:"Anaphylaxis",icon:"⚠️",drugs:[
    {name:"Epinephrine 1:1000",dose:"0.3-0.5 mg IM",route:"IM",notes:"FIRST-LINE. Repeat q5-15min. Do NOT delay. Auto-injector or vial.",class:"Sympathomimetic",onset:"3-5 min"},
    {name:"Diphenhydramine",dose:"25-50 mg IV/IM",route:"IV/IM",notes:"H1-blocker adjunct. NOT a replacement for epinephrine.",class:"Antihistamine",onset:"15-30 min"},
    {name:"Famotidine",dose:"20 mg IV",route:"IV",notes:"H2-blocker adjunct. Synergistic with diphenhydramine.",class:"H2 Blocker",onset:"15-30 min"},
    {name:"Methylprednisolone",dose:"125 mg IV",route:"IV",notes:"Prevents biphasic reaction. Not immediate benefit.",class:"Corticosteroid",onset:"4-6 hrs"},
    {name:"Albuterol",dose:"2.5 mg nebulized",route:"Neb",notes:"For bronchospasm refractory to epinephrine.",class:"Beta-2 Agonist",onset:"5-15 min"},
    {name:"Normal Saline",dose:"1-2 L bolus",route:"IV",notes:"For hypotension refractory to epinephrine. Wide open.",class:"Crystalloid",onset:"Immediate"},
  ]},
  respiratory:{label:"Respiratory / Asthma / COPD",icon:"🫁",drugs:[
    {name:"Albuterol",dose:"2.5 mg neb q20min x3, then q1-4h",route:"Neb",notes:"Continuous neb for severe: 10-15 mg/hr.",class:"Beta-2 Agonist",onset:"5-15 min"},
    {name:"Ipratropium",dose:"0.5 mg neb q20min x3",route:"Neb",notes:"Add to albuterol in moderate-severe exacerbation.",class:"Anticholinergic",onset:"15-30 min"},
    {name:"Prednisone",dose:"40-60 mg PO",route:"PO",notes:"Give within 1 hour of presentation. 5-day course typical.",class:"Corticosteroid",onset:"4-6 hrs"},
    {name:"Methylprednisolone",dose:"125 mg IV",route:"IV",notes:"If unable to take PO.",class:"Corticosteroid",onset:"4-6 hrs"},
    {name:"Magnesium Sulfate",dose:"2 g IV over 20 min",route:"IV",notes:"Severe exacerbation. Monitor for hypotension, flushing.",class:"Bronchodilator",onset:"15-20 min"},
    {name:"BiPAP",dose:"IPAP 10-15, EPAP 5",route:"NIV",notes:"For COPD exacerbation with respiratory acidosis.",class:"Ventilatory Support",onset:"Immediate"},
    {name:"Epinephrine 1:1000",dose:"0.3-0.5 mg IM/SQ",route:"IM",notes:"Refractory, severe bronchospasm. Last resort before intubation.",class:"Sympathomimetic",onset:"3-5 min"},
  ]},
  seizures:{label:"Seizures / Status Epilepticus",icon:"🧠",drugs:[
    {name:"Lorazepam",dose:"4 mg IV",route:"IV",notes:"First-line for status. May repeat x1 in 5-10 min. Max 8 mg.",class:"Benzodiazepine",onset:"1-3 min"},
    {name:"Midazolam",dose:"10 mg IM",route:"IM",notes:"If no IV access. RAMPART trial preferred IM midazolam over IV lorazepam.",class:"Benzodiazepine",onset:"3-5 min IM"},
    {name:"Diazepam",dose:"10 mg PR",route:"PR",notes:"Rectal gel if no IV/IM access.",class:"Benzodiazepine",onset:"5-10 min"},
    {name:"Levetiracetam",dose:"60 mg/kg IV (max 4500 mg)",route:"IV",notes:"Second-line. Infuse over 15 min. Fewer drug interactions.",class:"Anticonvulsant",onset:"15-30 min"},
    {name:"Fosphenytoin",dose:"20 mg PE/kg IV",route:"IV",notes:"Second-line alternative. Max rate 150 mg PE/min. Monitor for hypotension.",class:"Anticonvulsant",onset:"10-20 min"},
    {name:"Phenobarbital",dose:"20 mg/kg IV",route:"IV",notes:"Third-line. Max rate 60 mg/min. Respiratory depression risk.",class:"Barbiturate",onset:"15-30 min"},
  ]},
  pain:{label:"Pain Management",icon:"💊",drugs:[
    {name:"Acetaminophen",dose:"1000 mg IV/PO",route:"IV/PO",notes:"First-line. Max 4 g/day (2 g if hepatic impairment). IV over 15 min.",class:"Analgesic",onset:"15-30 min"},
    {name:"Ibuprofen",dose:"400-800 mg PO",route:"PO",notes:"Avoid in renal impairment, GI bleed risk, ACS.",class:"NSAID",onset:"30-60 min"},
    {name:"Ketorolac",dose:"15-30 mg IV",route:"IV",notes:"Max 5 days. 15 mg if >65yo or renal impairment.",class:"NSAID",onset:"10-15 min"},
    {name:"Morphine",dose:"0.1 mg/kg IV (typical 4-6 mg)",route:"IV",notes:"Titrate q10-15min. Active metabolite accumulates in renal failure.",class:"Opioid",onset:"5-10 min"},
    {name:"Fentanyl",dose:"1-1.5 mcg/kg IV",route:"IV",notes:"Preferred in hemodynamic instability. No histamine release.",class:"Opioid",onset:"2-3 min"},
    {name:"Ketamine",dose:"0.3 mg/kg IV (subdissociative)",route:"IV",notes:"Opioid-sparing. Push slowly over 15 min to reduce dysphoria.",class:"NMDA Antagonist",onset:"1-2 min"},
    {name:"Lidocaine 1%",dose:"Max 4.5 mg/kg (7 mg/kg with epi)",route:"Local",notes:"Buffer with bicarb 1:10. Duration 30-60 min.",class:"Local Anesthetic",onset:"2-5 min"},
  ]},
  cardiac:{label:"Cardiac Arrest / ACLS",icon:"⚡",drugs:[
    {name:"Epinephrine 1:10,000",dose:"1 mg IV/IO q3-5min",route:"IV/IO",notes:"Push dose. Give early in non-shockable rhythms. Flush with 20 mL NS.",class:"Sympathomimetic",onset:"Immediate"},
    {name:"Amiodarone",dose:"300 mg IV bolus, then 150 mg",route:"IV",notes:"For refractory VF/pVT after 3rd shock. Follow with drip 1 mg/min x6h.",class:"Antiarrhythmic",onset:"Immediate"},
    {name:"Lidocaine",dose:"1-1.5 mg/kg IV, then 0.5-0.75 mg/kg",route:"IV",notes:"Alternative to amiodarone. Max 3 mg/kg.",class:"Antiarrhythmic",onset:"1-2 min"},
    {name:"Atropine",dose:"1 mg IV q3-5min (max 3 mg)",route:"IV",notes:"For symptomatic bradycardia only. NOT recommended in cardiac arrest.",class:"Anticholinergic",onset:"1-2 min"},
    {name:"Calcium Chloride 10%",dose:"1 g (10 mL) IV slow push",route:"IV",notes:"For hyperkalemia, calcium channel blocker OD, hypermagnesemia.",class:"Electrolyte",onset:"1-3 min"},
    {name:"Sodium Bicarbonate",dose:"1 mEq/kg IV",route:"IV",notes:"For known hyperkalemia, TCA OD, or prolonged arrest with acidosis.",class:"Buffer",onset:"Immediate"},
  ]},
  stroke:{label:"Stroke / CVA",icon:"🧠",drugs:[
    {name:"Alteplase (tPA)",dose:"0.9 mg/kg IV (max 90 mg)",route:"IV",notes:"10% bolus over 1 min, remainder over 60 min. Within 4.5h of onset.",class:"Thrombolytic",onset:"Immediate"},
    {name:"Tenecteplase",dose:"0.25 mg/kg IV (max 25 mg)",route:"IV",notes:"Single bolus. Emerging evidence for LVO stroke.",class:"Thrombolytic",onset:"Immediate"},
    {name:"Labetalol",dose:"10-20 mg IV q10-20min",route:"IV",notes:"Target BP <185/110 pre-tPA. Max 300 mg.",class:"Beta-Blocker",onset:"5-10 min"},
    {name:"Nicardipine",dose:"5 mg/hr IV drip, titrate by 2.5 mg/hr q5-15min",route:"IV",notes:"Max 15 mg/hr. Better for sustained BP control.",class:"CCB",onset:"5-15 min"},
    {name:"Aspirin",dose:"325 mg PO/PR",route:"PO/PR",notes:"Give within 24-48h if tPA NOT given. Hold 24h post-tPA.",class:"Antiplatelet",onset:"15-30 min"},
  ]},
  edSepsis:{label:"Sepsis / Septic Shock",icon:"🦠",drugs:[
    {name:"Normal Saline",dose:"30 mL/kg IV bolus",route:"IV",notes:"Within first 3 hours. Reassess after each bolus.",class:"Crystalloid",onset:"Immediate"},
    {name:"Lactated Ringer's",dose:"30 mL/kg IV bolus",route:"IV",notes:"Preferred over NS per Surviving Sepsis 2021.",class:"Balanced Crystalloid",onset:"Immediate"},
    {name:"Norepinephrine",dose:"0.1-0.5 mcg/kg/min",route:"IV",notes:"First-line vasopressor. Central line preferred.",class:"Vasopressor",onset:"Immediate"},
    {name:"Vasopressin",dose:"0.03-0.04 units/min",route:"IV",notes:"Add to norepinephrine if MAP target not met.",class:"Vasopressor",onset:"Immediate"},
    {name:"Vancomycin",dose:"25-30 mg/kg IV",route:"IV",notes:"Loading dose. Cover MRSA. Infuse over 1-2h.",class:"Antibiotic",onset:"1-2 hrs"},
    {name:"Piperacillin-Tazobactam",dose:"4.5 g IV q6h",route:"IV",notes:"Broad-spectrum. Infuse over 4h (extended infusion).",class:"Antibiotic",onset:"30-60 min"},
    {name:"Meropenem",dose:"1 g IV q8h",route:"IV",notes:"For ESBL or resistant organisms.",class:"Antibiotic",onset:"30-60 min"},
    {name:"Hydrocortisone",dose:"100 mg IV q8h",route:"IV",notes:"For refractory septic shock despite adequate fluid + vasopressors.",class:"Corticosteroid",onset:"1-2 hrs"},
  ]},
  overdose:{label:"Overdose / Toxicology",icon:"☠️",drugs:[
    {name:"Naloxone",dose:"0.4-2 mg IV/IN",route:"IV/IN/IM",notes:"Titrate to respiratory effort. Watch for renarcotization.",class:"Opioid Antagonist",onset:"1-2 min IV"},
    {name:"Activated Charcoal",dose:"1 g/kg PO (max 50 g)",route:"PO",notes:"Within 1-2h of ingestion. Avoid with caustics, hydrocarbons.",class:"Adsorbent",onset:"15-30 min"},
    {name:"N-Acetylcysteine",dose:"150 mg/kg IV over 1h, then 50 mg/kg/4h, then 100 mg/kg/16h",route:"IV",notes:"APAP OD. Give within 8h. Check Rumack-Matthew nomogram.",class:"Antidote",onset:"30-60 min"},
    {name:"Flumazenil",dose:"0.2 mg IV q1min (max 3 mg)",route:"IV",notes:"AVOID in chronic benzo use, seizure hx, or TCA co-ingestion.",class:"Benzo Antagonist",onset:"1-2 min"},
    {name:"Sodium Bicarbonate",dose:"1-2 mEq/kg IV bolus",route:"IV",notes:"TCA OD: target pH 7.50-7.55. For QRS >100 ms.",class:"Buffer",onset:"1-5 min"},
    {name:"Intralipid 20%",dose:"1.5 mL/kg IV bolus, then 0.25 mL/kg/min",route:"IV",notes:"For LAST or lipophilic drug OD.",class:"Lipid Emulsion",onset:"Immediate"},
  ]},
  psych:{label:"Psychiatric / Agitation",icon:"🧘",drugs:[
    {name:"Haloperidol",dose:"5-10 mg IM",route:"IM",notes:"Check QTc. Avoid in elderly with dementia.",class:"Antipsychotic",onset:"15-30 min"},
    {name:"Olanzapine",dose:"10 mg IM",route:"IM",notes:"Do NOT combine with IM benzodiazepines.",class:"Atypical Antipsychotic",onset:"15-30 min"},
    {name:"Midazolam",dose:"5 mg IM",route:"IM",notes:"For severe agitation. Rapid onset IM.",class:"Benzodiazepine",onset:"5-10 min IM"},
    {name:"Lorazepam",dose:"2 mg IV/IM",route:"IV/IM",notes:"B52: Benadryl 50 + Haldol 5 + Ativan 2.",class:"Benzodiazepine",onset:"5-15 min"},
    {name:"Droperidol",dose:"2.5-5 mg IM",route:"IM",notes:"Very effective. Check QTc. Black box warning (may be overstated).",class:"Butyrophenone",onset:"5-10 min"},
    {name:"Ketamine",dose:"4-5 mg/kg IM",route:"IM",notes:"For excited delirium. Prepare for airway management.",class:"NMDA Antagonist",onset:"3-5 min IM"},
  ]},
};

/* ═══════════════════════════════════════════════════════════════
   PEDS SOLUTION SELECTOR DATA (12 drugs with formulations)
═══════════════════════════════════════════════════════════════ */
const PEDS_SOLUTIONS = [
  {name:"Acetaminophen",mpk:15,max:1000,route:"PO/PR",freq:"q4-6h",sols:[
    {l:"Infant Drops 80mg/0.8mL",c:100,u:"mg/mL"},{l:"Children's Liquid 160mg/5mL",c:32,u:"mg/mL"},{l:"Jr Strength Tab 160mg",c:160,u:"mg/tab"}],notes:"Avoid in hepatic impairment. Rectal absorption variable."},
  {name:"Ibuprofen",mpk:10,max:400,route:"PO",freq:"q6-8h",sols:[
    {l:"Infant Drops 50mg/1.25mL",c:40,u:"mg/mL"},{l:"Children's Liquid 100mg/5mL",c:20,u:"mg/mL"},{l:"Jr Strength Tab 100mg",c:100,u:"mg/tab"}],notes:"Avoid <6 months. Contraindicated in dehydration."},
  {name:"Amoxicillin",mpk:45,max:1000,route:"PO",freq:"q12h",sols:[
    {l:"125mg/5mL",c:25,u:"mg/mL"},{l:"250mg/5mL",c:50,u:"mg/mL"},{l:"400mg/5mL",c:80,u:"mg/mL"}],notes:"High dose (90 mg/kg/day) for AOM in high-risk areas."},
  {name:"Ondansetron (Zofran)",mpk:0.15,max:4,route:"IV/PO/ODT",freq:"q6-8h",sols:[
    {l:"ODT 4mg",c:4,u:"mg/tab"},{l:"Oral Solution 4mg/5mL",c:0.8,u:"mg/mL"},{l:"IV 2mg/mL",c:2,u:"mg/mL"}],notes:"Safe >6 months. Check QTc in at-risk patients."},
  {name:"Dexamethasone",mpk:0.6,max:16,route:"PO/IV/IM",freq:"Daily x1-2d",sols:[
    {l:"Oral Solution 1mg/mL",c:1,u:"mg/mL"},{l:"Elixir 0.5mg/5mL",c:0.1,u:"mg/mL"},{l:"IV 4mg/mL",c:4,u:"mg/mL"}],notes:"Croup 0.6 mg/kg x1. Asthma 0.6 mg/kg/day x2 days."},
  {name:"Prednisolone",mpk:1,max:60,route:"PO",freq:"Daily x3-5d",sols:[
    {l:"Prelone 15mg/5mL",c:3,u:"mg/mL"},{l:"Orapred 15mg/5mL",c:3,u:"mg/mL"},{l:"Pediapred 5mg/5mL",c:1,u:"mg/mL"}],notes:"Asthma exacerbation. Better tolerated than prednisone."},
  {name:"Epinephrine (IM)",mpk:0.01,max:0.3,route:"IM",freq:"q5-15min",sols:[
    {l:"1:1000 (1mg/mL)",c:1,u:"mg/mL"},{l:"EpiPen Jr 0.15mg",c:0.15,u:"mg/dose"},{l:"EpiPen 0.3mg",c:0.3,u:"mg/dose"}],notes:"ALWAYS IM anterolateral thigh. Do not delay."},
  {name:"Albuterol (Neb)",mpk:0.15,max:5,route:"Neb",freq:"q20min x3",sols:[
    {l:"0.5% (5mg/mL)",c:5,u:"mg/mL"},{l:"Unit dose 2.5mg/3mL",c:0.83,u:"mg/mL"},{l:"Unit dose 1.25mg/3mL",c:0.42,u:"mg/mL"}],notes:"Continuous neb for severe: 0.5 mg/kg/hr (max 15 mg/hr)."},
  {name:"Ceftriaxone",mpk:50,max:2000,route:"IV/IM",freq:"q24h",sols:[
    {l:"IV 100mg/mL",c:100,u:"mg/mL"},{l:"IM 250mg/mL",c:250,u:"mg/mL"}],notes:"Avoid in neonates with hyperbilirubinemia."},
  {name:"Midazolam (Seizure)",mpk:0.2,max:10,route:"IN/IM/IV",freq:"Repeat x1",sols:[
    {l:"5mg/mL (IM/IN)",c:5,u:"mg/mL"},{l:"1mg/mL (IV)",c:1,u:"mg/mL"},{l:"Nasal 5mg/0.1mL",c:50,u:"mg/mL"}],notes:"IN: 5 mg/mL concentration. Split between nares."},
  {name:"Lorazepam (Seizure)",mpk:0.1,max:4,route:"IV",freq:"Repeat x1",sols:[
    {l:"2mg/mL",c:2,u:"mg/mL"},{l:"4mg/mL",c:4,u:"mg/mL"}],notes:"Push slowly. Requires refrigeration."},
  {name:"Diphenhydramine",mpk:1.25,max:50,route:"PO/IV/IM",freq:"q6h",sols:[
    {l:"Elixir 12.5mg/5mL",c:2.5,u:"mg/mL"},{l:"Chewable 12.5mg",c:12.5,u:"mg/tab"},{l:"IV/IM 50mg/mL",c:50,u:"mg/mL"}],notes:"Avoid in neonates. Paradoxical excitability in young children."},
];

/* ═══════════════════════════════════════════════════════════════
   SEPSIS HOUR-1 BUNDLE & REASSESSMENT
═══════════════════════════════════════════════════════════════ */
const HOUR1_BUNDLE = [
  {action:"Measure lactate level",crit:true},
  {action:"Obtain blood cultures before antibiotics",crit:true},
  {action:"Administer broad-spectrum antibiotics",crit:true},
  {action:"Begin 30 mL/kg crystalloid for hypotension or lactate ≥4",crit:true},
  {action:"Apply vasopressors if hypotensive to maintain MAP ≥65",crit:false},
];
const REASSESS_ITEMS = [
  {action:"Reassess volume status and tissue perfusion",crit:true},
  {action:"Re-measure lactate if initial elevated",crit:false},
  {action:"Assess for organ dysfunction (SOFA score)",crit:false},
];

/* ═══════════════════════════════════════════════════════════════
   CSS
═══════════════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
:root{
  --bg:#080e1a;--c1:#0d1628;--c2:#111e33;--c3:#162240;
  --br:rgba(0,196,160,0.12);--br2:rgba(0,196,160,0.22);
  --teal:#00c4a0;--teal2:#00e5bb;--tdim:rgba(0,196,160,0.08);
  --tx:#e2e8f0;--tx2:#94a3b8;--tx3:#4a6080;
  --red:#ef4444;--yel:#f59e0b;--grn:#22c55e;--pur:#8b5cf6;--blu:#3b82f6;
  --r:10px;--r2:14px;--f:'Inter',sans-serif;
}
.medref-root{background:var(--bg);color:var(--tx);min-height:100vh;padding:16px 20px;font-family:var(--f);margin-left:72px;}
.sh{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;}
.sh-l{display:flex;align-items:center;gap:10px;}
.sh-ico{width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;background:var(--tdim);}
.sh-ttl{font-size:11px;font-weight:600;letter-spacing:.1em;color:var(--tx2);text-transform:uppercase;}
.sh-m{font-size:11px;color:var(--tx3);}
.ntabs{display:flex;gap:2px;margin-bottom:16px;flex-wrap:wrap;}
.ntab{padding:7px 16px;border-radius:8px;font-size:12px;font-weight:500;cursor:pointer;border:1px solid transparent;color:var(--tx2);background:transparent;font-family:var(--f);transition:all .15s;}
.ntab:hover{background:var(--tdim);color:var(--tx);}
.ntab.on{background:var(--tdim);border-color:var(--br2);color:var(--teal);}
.sw{flex:1;display:flex;align-items:center;gap:8px;background:var(--c1);border:1px solid var(--br);border-radius:var(--r);padding:0 12px;transition:border-color .15s;}
.sw:focus-within{border-color:var(--br2);}
.sw input{flex:1;background:transparent;border:none;outline:none;color:var(--tx);font-size:13px;padding:9px 0;font-family:var(--f);}
.sw input::placeholder{color:var(--tx3);}
.fps{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;}
.fp{padding:4px 12px;border-radius:20px;font-size:11px;font-weight:500;cursor:pointer;border:1px solid var(--br);background:var(--c1);color:var(--tx2);transition:all .15s;}
.fp:hover{border-color:var(--br2);color:var(--tx);}
.fp.on{color:#080e1a;border-color:transparent;font-weight:600;}
.card{background:var(--c1);border:1px solid var(--br);border-radius:var(--r2);overflow:hidden;}
.chdr{display:flex;align-items:center;justify-content:space-between;padding:11px 16px;border-bottom:1px solid var(--br);background:var(--c2);}
.cbdy{padding:14px 16px;}
.mlist{display:flex;flex-direction:column;gap:3px;}
.mrow{display:flex;align-items:flex-start;gap:12px;padding:10px 14px;background:var(--c1);border:1px solid var(--br);border-radius:var(--r);cursor:pointer;transition:all .15s;}
.mrow:hover{background:var(--c2);border-color:var(--br2);}
.mrow.ex{background:var(--c2);border-color:var(--br2);border-radius:var(--r) var(--r) 0 0;border-bottom-color:transparent;}
.mdot{width:10px;height:10px;border-radius:50%;flex-shrink:0;margin-top:4px;}
.mrm{flex:1;min-width:0;}
.mrn{font-size:13px;font-weight:600;display:flex;align-items:center;gap:7px;flex-wrap:wrap;}
.mrs{font-size:11px;color:var(--tx2);margin-top:2px;}
.mcod{font-size:10px;font-family:monospace;padding:2px 6px;border-radius:4px;background:var(--c3);border:1px solid var(--br2);color:var(--tx2);font-weight:600;letter-spacing:.05em;}
.mlb{font-size:9px;padding:2px 6px;border-radius:3px;font-weight:700;letter-spacing:.06em;}
.mrr{display:flex;align-items:center;gap:8px;flex-shrink:0;}
.obtn{font-size:11px;color:var(--teal);background:transparent;border:none;cursor:pointer;font-family:var(--f);font-weight:500;white-space:nowrap;padding:4px 0;}
.obtn:hover{text-decoration:underline;}
.dpill{font-size:10px;background:var(--c3);border:1px solid var(--br);border-radius:4px;padding:2px 8px;color:var(--tx2);font-family:monospace;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.mdet{background:var(--c2);border:1px solid var(--br2);border-top:none;border-radius:0 0 var(--r) var(--r);padding:13px 13px 13px 36px;margin-bottom:3px;}
.dgrid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:13px;margin-bottom:11px;}
.dlbl{font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--tx3);margin-bottom:4px;}
.dval{font-size:12px;color:var(--tx);line-height:1.5;}
.dval.tl{color:var(--teal);font-weight:600;font-family:monospace;font-size:13px;}
.cir{display:flex;gap:6px;align-items:flex-start;font-size:11px;color:var(--red);padding:2px 0;}
.wr{display:flex;gap:6px;align-items:flex-start;font-size:11px;color:var(--tx2);padding:2px 0;}
.rtags{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px;padding-top:9px;border-top:1px solid var(--br);}
.rtag{font-size:10px;padding:2px 8px;border-radius:4px;letter-spacing:.04em;background:rgba(0,196,160,.06);border:1px solid rgba(0,196,160,.2);color:var(--teal);}
.rvtag{font-size:10px;padding:2px 8px;border-radius:4px;background:rgba(139,92,246,.1);border:1px solid rgba(139,92,246,.25);color:var(--pur);}
.aip{background:var(--c2);border:1px solid rgba(0,196,160,.2);border-radius:var(--r2);padding:13px 15px;margin-bottom:16px;}
.aih{display:flex;align-items:center;gap:8px;margin-bottom:9px;}
.aitag{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--teal);background:rgba(0,196,160,.1);border:1px solid rgba(0,196,160,.25);padding:3px 8px;border-radius:4px;}
.aim{font-size:11px;color:var(--tx3);margin-left:auto;}
.air{display:flex;gap:8px;}
.aii{flex:1;background:var(--c3);border:1px solid rgba(0,196,160,.15);border-radius:var(--r);padding:8px 12px;color:var(--tx);font-size:13px;font-family:var(--f);outline:none;transition:border-color .15s;}
.aii:focus{border-color:var(--br2);}
.aib{padding:8px 15px;background:var(--teal);border:none;border-radius:var(--r);color:#080e1a;font-size:12px;font-weight:700;cursor:pointer;font-family:var(--f);transition:opacity .15s;white-space:nowrap;}
.aib:hover{opacity:.85;}
.aib:disabled{opacity:.4;cursor:not-allowed;}
.airesp{margin-top:11px;padding:11px 13px;background:var(--c3);border-radius:var(--r);border:1px solid var(--br);font-size:12px;line-height:1.7;color:var(--tx2);white-space:pre-wrap;}
.cinps{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:14px;}
.ilbl{display:block;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--tx3);margin-bottom:5px;}
.inp,.sel{width:100%;background:var(--c3);border:1px solid var(--br);border-radius:var(--r);padding:8px 11px;color:var(--tx);font-size:13px;font-family:var(--f);outline:none;transition:border-color .15s;}
.inp:focus,.sel:focus{border-color:var(--br2);}
.sel option{background:var(--c3);}
.wbar{display:flex;align-items:center;gap:18px;padding:11px 15px;background:rgba(0,196,160,.05);border:1px solid rgba(0,196,160,.15);border-radius:var(--r);margin-bottom:13px;flex-wrap:wrap;}
.wv{font-size:30px;font-weight:700;color:var(--teal);font-family:monospace;}
.wu{font-size:13px;color:var(--tx2);}
.west{font-size:10px;color:var(--tx3);letter-spacing:.05em;}
.bzb{padding:4px 11px;border-radius:5px;font-size:11px;font-weight:700;font-family:monospace;margin-left:auto;}
.cstat{background:var(--c3);border-radius:var(--r);padding:7px 12px;text-align:center;}
.csv{font-size:15px;font-weight:700;font-family:monospace;}
.csl{font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:var(--tx3);margin-top:2px;}
.rtbl{width:100%;border-collapse:collapse;}
.rtbl th{font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--tx3);text-align:left;padding:0 10px 7px;}
.rtbl td{padding:7px 10px;border-top:1px solid var(--br);font-size:12px;vertical-align:top;}
.rtbl tr:hover td{background:rgba(255,255,255,.015);}
.rdose{font-family:monospace;color:var(--teal);font-weight:700;font-size:13px;}
.rmax{font-size:9px;padding:2px 6px;border-radius:3px;background:rgba(245,158,11,.1);color:var(--yel);font-weight:700;}
.rcap{color:var(--yel)!important;}
.cgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:11px;margin-bottom:18px;}
.empty{text-align:center;padding:44px;color:var(--tx3);}
.empty-i{font-size:34px;margin-bottom:9px;}
.empty-t{font-size:13px;}
.saved-panel{position:fixed;top:72px;left:72px;width:280px;bottom:0;z-index:150;background:#060b15;border-right:1px solid rgba(0,196,160,0.18);display:flex;flex-direction:column;}

/* ED Quick Ref */
.eq-cats{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;}
.eq-cat{padding:5px 13px;border-radius:7px;font-size:11px;font-weight:500;cursor:pointer;border:1px solid var(--br);background:var(--c1);color:var(--tx2);transition:all .15s;font-family:var(--f);}
.eq-cat:hover{border-color:var(--br2);color:var(--tx);}
.eq-cat.on{background:var(--tdim);border-color:var(--br2);color:var(--teal);}
.eq-row{padding:10px 14px;background:var(--c1);border:1px solid var(--br);border-radius:var(--r);cursor:pointer;transition:all .15s;margin-bottom:4px;}
.eq-row:hover{background:var(--c2);border-color:var(--br2);}
.eq-row.ex{background:var(--c2);border-color:var(--br2);}
.eq-badge{display:inline-block;padding:2px 7px;border-radius:4px;font-size:9px;font-weight:700;letter-spacing:.06em;font-family:monospace;}
.eq-b-teal{background:rgba(0,196,160,.1);border:1px solid rgba(0,196,160,.25);color:var(--teal);}
.eq-b-yel{background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.25);color:var(--yel);}
.eq-b-blu{background:rgba(59,130,246,.1);border:1px solid rgba(59,130,246,.25);color:var(--blu);}
.eq-notes{font-size:11px;color:var(--tx2);line-height:1.6;background:var(--bg);padding:9px 12px;border-radius:6px;border-left:3px solid var(--br2);margin-top:8px;}

/* Peds Solution Selector */
.sol-card{background:var(--c1);border:1px solid var(--br);border-radius:var(--r2);padding:16px;margin-bottom:10px;}
.sol-dose{padding:10px 14px;border-radius:8px;margin-top:10px;}
.sol-val{font-family:monospace;font-weight:800;}
.sol-vol{padding:9px 12px;border-radius:8px;margin-top:8px;background:rgba(59,130,246,.06);border:1px solid rgba(59,130,246,.2);display:flex;align-items:baseline;gap:10px;}

/* Sepsis */
.sep-fluid{padding:14px 18px;border-radius:var(--r);margin-top:10px;}
.sep-chk{display:flex;align-items:center;gap:10px;padding:8px 13px;border-radius:6px;margin-bottom:4px;font-size:12px;cursor:pointer;transition:all .15s;user-select:none;}
.sep-chk:hover{filter:brightness(1.1);}
.sep-chk.crit{background:rgba(239,68,68,.04);border:1px solid rgba(239,68,68,.12);}
.sep-chk.norm{background:var(--c3);border:1px solid rgba(0,196,160,.08);}
.sep-chk.done .sep-txt{text-decoration:line-through;color:var(--tx3);}
.sep-ico{font-size:14px;font-weight:700;width:20px;text-align:center;flex-shrink:0;}
.stabs{display:flex;gap:4px;}
.stab{padding:6px 16px;border-radius:8px;font-size:12px;font-weight:500;cursor:pointer;border:1px solid var(--br);background:transparent;color:var(--tx2);font-family:var(--f);transition:all .15s;}
.stab:hover{background:var(--tdim);color:var(--tx);}
.stab.on{background:var(--tdim);border-color:var(--br2);color:var(--teal);}

/* AI disclaimer */
.ai-disc{padding:9px 12px;border-radius:6px;font-size:10px;line-height:1.5;background:rgba(239,68,68,.05);border-left:3px solid var(--red);color:rgba(239,68,68,.7);margin-top:12px;}

@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
@media(max-width:1100px){.cgrid{grid-template-columns:1fr 1fr;}.dgrid{grid-template-columns:1fr 1fr;}.cinps{grid-template-columns:1fr 1fr;}}
@media(max-width:768px){.medref-root{padding:10px;margin-left:0;}.cgrid,.cinps{grid-template-columns:1fr;}.dgrid{grid-template-columns:1fr;}}
`;

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function MedicationReferencePage() {
  const [medications, setMedications]     = useState([]);
  const [loadingMeds, setLoadingMeds]     = useState(true);
  const [tab, setTab]                     = useState("medications");
  const [cat, setCat]                     = useState("all");
  const [search, setSearch]               = useState("");
  const [expanded, setExpanded]           = useState(null);
  const [pedAge, setPedAge]               = useState("");
  const [pedUnit, setPedUnit]             = useState("months");
  const [pedWt, setPedWt]                 = useState("");
  const [pedCat, setPedCat]               = useState("all");
  const [complaint, setComplaint]         = useState("");
  const [aiText, setAiText]               = useState("");
  const [aiLoading, setAiLoading]         = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSavedCases, setShowSavedCases] = useState(false);
  const [savedCasesKey, setSavedCasesKey] = useState(0);
  const [globalWeight, setGlobalWeight]   = useState(null);
  const [globalWeightUnit, setGlobalWeightUnit] = useState("kg");
  const [selectedMeds, setSelectedMeds]   = useState([]);

  const [edCat, setEdCat]                 = useState("chestPain");
  const [edSearch, setEdSearch]           = useState("");
  const [edExpanded, setEdExpanded]       = useState(null);

  const [pedsSols, setPedsSols]           = useState({});

  const [sepsisWt, setSepsisWt]           = useState("");
  const [sepsisQuery, setSepsisQuery]     = useState("");
  const [sepsisAiText, setSepsisAiText]   = useState("");
  const [sepsisAiLoading, setSepsisAiLoading] = useState(false);
  const [sepsisChecked, setSepsisChecked] = useState({});
  const [sepsisSubTab, setSepsisSubTab]   = useState("protocol");

  useEffect(() => {
    base44.entities.Medication.list('-name', 200).then(data => {
      setMedications(data);
      setLoadingMeds(false);
    });
  }, []);

  const weight = useMemo(() => {
    if (pedWt) return parseFloat(pedWt) || null;
    if (!pedAge) return null;
    const mo = pedUnit === "years" ? parseFloat(pedAge) * 12 : parseFloat(pedAge);
    if (isNaN(mo) || mo < 0) return null;
    return Math.round(estimateWeight(mo) * 10) / 10;
  }, [pedAge, pedUnit, pedWt]);

  const bz = weight ? getBroselow(weight) : null;

  const filtered = useMemo(() => medications.filter(m => {
    if (cat !== "all" && m.category !== cat) return false;
    const q = search.toLowerCase();
    if (!q) return true;
    const indicStr = typeof m.indications === "string" ? m.indications : "";
    return m.name.toLowerCase().includes(q) || indicStr.toLowerCase().includes(q) || m.drugClass.toLowerCase().includes(q) || (m.brand && m.brand.toLowerCase().includes(q));
  }), [medications, cat, search]);

  const pedResults = useMemo(() => {
    if (!weight) return [];
    return medications.filter(m => (pedCat === "all" || m.category === pedCat) && m.ped?.mgkg).map(m => {
      const raw = weight * m.ped.mgkg;
      const capped = m.ped.max !== null && raw > m.ped.max;
      const dose = capped ? m.ped.max : Math.round(raw * 10) / 10;
      return { ...m, calcDose: `${dose} ${m.ped.unit}`, capped };
    });
  }, [medications, weight, pedCat]);

  const weightKg = globalWeight ? (globalWeightUnit === "lbs" ? Math.round(globalWeight / 2.205 * 10) / 10 : globalWeight) : null;

  const edFiltered = useMemo(() => {
    if (!edSearch.trim()) return null;
    const q = edSearch.toLowerCase();
    const results = [];
    Object.entries(ED_DRUGS).forEach(([key, cat]) => {
      const matched = cat.drugs.filter(d =>
        d.name.toLowerCase().includes(q) || d.class.toLowerCase().includes(q) ||
        d.notes.toLowerCase().includes(q) || cat.label.toLowerCase().includes(q)
      );
      if (matched.length) results.push({ key, label: cat.label, icon: cat.icon, drugs: matched });
    });
    return results;
  }, [edSearch]);

  const pedsSolResults = useMemo(() => {
    if (!weight) return [];
    return PEDS_SOLUTIONS.map(d => {
      const raw = weight * d.mpk;
      const final = Math.min(raw, d.max);
      const capped = raw > d.max;
      const selIdx = pedsSols[d.name];
      let vol = null;
      if (selIdx !== undefined && d.sols[selIdx]) {
        const s = d.sols[selIdx];
        const isTab = s.u === "mg/tab" || s.u === "mg/dose";
        vol = { value: (final / s.c).toFixed(2), unit: isTab ? (s.u === "mg/tab" ? "tab(s)" : "dose(s)") : "mL" };
      }
      return { ...d, raw, final, capped, vol, selIdx };
    });
  }, [weight, pedsSols]);

  const handleAI = async () => {
    if (!complaint.trim()) return;
    setAiLoading(true); setAiText("");
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an ER physician AI integrated into the Notrya V3 system. Follow ACEP, AHA, and SSC guidelines. Given this presenting complaint, provide concise clinical medication recommendations.\n\nPresenting Complaint: ${complaint}\n\nProvide:\n1. First-line medications (with ER doses, routes, onset)\n2. Second-line alternatives\n3. Key monitoring parameters\n4. Critical contraindications to assess\n5. Disposition considerations\n\nBe concise, clinical, and evidence-based. Include drug names in bold.`
      });
      setAiText(typeof result === "string" ? result : JSON.stringify(result));
    } catch (e) {
      setAiText("⚠ Unable to reach AI service. Refer to ED Quick Ref tab for medication guidance.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSepsisAI = async () => {
    const wt = parseFloat(sepsisWt);
    if (!wt) return;
    setSepsisAiLoading(true); setSepsisAiText("");
    const bolus = (wt * 30).toFixed(0);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a Sepsis Protocol AI following Surviving Sepsis Campaign 2021 guidelines.\n\nPatient Weight: ${wt} kg\nCalculated Fluid Bolus: ${bolus} mL (30 mL/kg)\n${sepsisQuery ? `Suspected Source: ${sepsisQuery}` : "Source not yet identified."}\n\nProvide:\n1. Fluid resuscitation plan\n2. Targeted antibiotic recommendations based on suspected source\n3. Vasopressor guidance\n4. Lactate monitoring plan\n5. When to consider stress-dose steroids\n6. Key critical safety warnings\n\nBe concise and clinical.`
      });
      setSepsisAiText(typeof result === "string" ? result : JSON.stringify(result));
    } catch (e) {
      setSepsisAiText(`⚠ AI offline. Manual Protocol:\n\n• Fluid Bolus: ${bolus} mL (30 mL/kg × ${wt} kg)\n• Vancomycin: ${(wt*25).toFixed(0)}-${(wt*30).toFixed(0)} mg IV\n• Pip-Tazo: 4.5 g IV q6h\n• Vasopressor: Norepinephrine if MAP <65\n• Remeasure lactate in 2-4 hours`);
    } finally {
      setSepsisAiLoading(false);
    }
  };

  return (
    <>
      <style>{CSS}</style>

      {showSaveModal && weight && (
        <SaveCaseModal
          weight={weight} pedAge={pedAge} pedUnit={pedUnit} pedWt={pedWt} pedCat={pedCat} bz={bz}
          onClose={() => setShowSaveModal(false)}
          onSaved={() => setSavedCasesKey(k => k + 1)}
        />
      )}

      {showSavedCases && (
        <div className="saved-panel">
          <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(0,196,160,0.12)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#94a3b8" }}>SAVED CASES</div>
              <div style={{ fontSize: 10, color: "#4a6080", marginTop: 2 }}>Ped calculator scenarios</div>
            </div>
            <button onClick={() => setShowSavedCases(false)} style={{ background: "transparent", border: "none", color: "#4a6080", fontSize: 16, cursor: "pointer", lineHeight: 1 }}>✕</button>
          </div>
          <SavedCasesPanel
            key={savedCasesKey}
            onLoadCase={(c) => {
              setTab("calculator");
              if (c.patient_age) { const p = c.patient_age.split(" "); if (p[0]) setPedAge(p[0]); if (p[1]) setPedUnit(p[1]); }
              if (c.weight_source === "measured") setPedWt(String(c.weight_kg));
              if (c.category_filter) setPedCat(c.category_filter);
              setShowSavedCases(false);
            }}
          />
        </div>
      )}

      <div className="medref-root" style={showSavedCases ? { marginLeft: 280 } : {}}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--tx)", margin: 0 }}>Medication Reference</h1>
            <div style={{ fontSize: 12, color: "var(--tx3)", marginTop: 3 }}>Emergency Department · ACEP Guidelines · Drugs_DB · {medications.length} medications</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, letterSpacing: ".04em", background: "rgba(0,196,160,.12)", border: "1px solid rgba(0,196,160,.3)", color: "var(--teal)" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--teal)", display: "inline-block", animation: "pulse 2s ease-in-out infinite" }} />
              AI ACTIVE
            </div>
            <button onClick={() => setShowSavedCases(!showSavedCases)} style={{ padding: "6px 12px", borderRadius: 7, fontSize: 12, cursor: "pointer", border: "1px solid rgba(0,196,160,0.3)", background: showSavedCases ? "rgba(0,196,160,0.12)" : "transparent", color: "var(--teal)", fontFamily: "inherit" }}>
              📋 Saved Cases
            </button>
          </div>
        </div>

        {/* AI Panel */}
        <div className="aip">
          <div className="aih">
            <span style={{ fontSize: 15 }}>⚡</span>
            <span className="aitag">AI CLINICAL INSIGHT</span>
            <span className="aim">Evidence-based · Real-time · Notrya V3</span>
          </div>
          <div className="air">
            <input className="aii" placeholder="Enter presenting complaint (e.g. 'septic shock, HR 125, temp 39.2°C, BP 82/54, lactate 4.8')..." value={complaint} onChange={e => setComplaint(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAI()} />
            <button className="aib" onClick={handleAI} disabled={aiLoading}>{aiLoading ? "Consulting..." : "Analyze →"}</button>
          </div>
          {aiText && (
            <>
              <div className="airesp">{aiText}</div>
              <div className="ai-disc">⚠ AI-generated recommendations. Clinical judgment should always prevail. Verify all doses and contraindications.</div>
            </>
          )}
        </div>

        {/* Main Tabs */}
        <div className="ntabs">
          {[
            ["medications", "💊 MEDICATIONS"],
            ["edref", "⚡ ED QUICK REF"],
            ["calculator", "⚖️ PED CALCULATOR"],
            ["sepsis", "🔴 SEPSIS PROTOCOL"],
            ["conditions", "🏥 ER CONDITIONS"],
          ].map(([id, label]) => (
            <button key={id} className={`ntab ${tab === id ? "on" : ""}`} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>

        {/* ── MEDICATIONS TAB ── */}
        {tab === "medications" && (
          <>
            <div className="sh">
              <div className="sh-l"><div className="sh-ico">💊</div><span className="sh-ttl">ER MEDICATION REFERENCE</span></div>
              <span className="sh-m">Drugs_DB · {filtered.length} medications{selectedMeds.length > 0 ? ` · ${selectedMeds.length} selected` : ""}</span>
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 13, alignItems: "center", flexWrap: "wrap" }}>
              <div className="sw" style={{ flex: 1, minWidth: 200 }}>
                <span style={{ color: "var(--tx3)", fontSize: 14 }}>🔍</span>
                <input placeholder="Search medications, indications, drug codes..." value={search} onChange={e => setSearch(e.target.value)} />
                {search && <span onClick={() => setSearch("")} style={{ cursor: "pointer", color: "var(--tx3)", fontSize: 14 }}>✕</span>}
              </div>
              <WeightWidget weight={globalWeight} weightUnit={globalWeightUnit} onWeightChange={setGlobalWeight} onUnitChange={setGlobalWeightUnit} onClear={() => setGlobalWeight(null)} />
            </div>
            <div className="fps">
              {CATEGORIES.map(c => (
                <div key={c.id} className={`fp ${cat === c.id ? "on" : ""}`} style={cat === c.id ? { background: c.color, color: "#080e1a" } : {}} onClick={() => setCat(c.id)}>
                  {c.icon} {c.label}
                </div>
              ))}
            </div>
            <DrugInteractionChecker selectedMeds={selectedMeds} medications={medications} />
            {selectedMeds.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <button onClick={() => setSelectedMeds([])} style={{ fontSize: 11, fontWeight: 700, padding: "6px 14px", borderRadius: 7, background: "transparent", border: "1px solid rgba(0,196,160,0.3)", color: "var(--teal)", cursor: "pointer", fontFamily: "inherit" }}>
                  Clear Selection ({selectedMeds.length})
                </button>
              </div>
            )}
            <div className="card">
              <div className="chdr">
                <div className="sh-l"><span className="sh-ttl">CLINICAL RECOMMENDATIONS</span></div>
                <span className="sh-m">Tap row for full details</span>
              </div>
              <div style={{ padding: "10px 13px" }}>
                {loadingMeds ? (
                  <div className="empty"><div className="empty-i" style={{ fontSize: 24 }}>⏳</div><div className="empty-t">Loading medications...</div></div>
                ) : filtered.length === 0 ? (
                  <div className="empty"><div className="empty-i">🔍</div><div className="empty-t">No medications match your search</div></div>
                ) : (
                  <div className="mlist">
                    {filtered.map(med => (
                      <MedRow key={med.id} med={med} weightKg={weightKg}
                        isSelected={selectedMeds.some(m => m.id === med.id)}
                        onSelect={(checked) => { if (checked) setSelectedMeds([...selectedMeds, med]); else setSelectedMeds(selectedMeds.filter(m => m.id !== med.id)); }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ── ED QUICK REF TAB ── */}
        {tab === "edref" && (
          <>
            <div className="sh">
              <div className="sh-l"><div className="sh-ico">⚡</div><span className="sh-ttl">ED QUICK REFERENCE</span></div>
              <span className="sh-m">10 complaint categories · 64 drugs · Offline-ready</span>
            </div>
            <div className="card" style={{ marginBottom: 14 }}>
              <div className="cbdy">
                <div className="dlbl" style={{ marginBottom: 8 }}>⌘ SEARCH ALL DRUGS</div>
                <div className="sw">
                  <span style={{ color: "var(--tx3)", fontSize: 14 }}>🔍</span>
                  <input placeholder="Search drugs, classes, or complaints..." value={edSearch} onChange={e => setEdSearch(e.target.value)} />
                  {edSearch && <span onClick={() => setEdSearch("")} style={{ cursor: "pointer", color: "var(--tx3)", fontSize: 14 }}>✕</span>}
                </div>
              </div>
            </div>

            {!edSearch && (
              <div className="eq-cats">
                {Object.entries(ED_DRUGS).map(([key, c]) => (
                  <button key={key} className={`eq-cat${edCat === key ? ' on' : ''}`} onClick={() => { setEdCat(key); setEdExpanded(null); }}>
                    {c.icon} {c.label}
                  </button>
                ))}
              </div>
            )}

            {(edFiltered || [{ key: edCat, ...ED_DRUGS[edCat] }]).map(catData => {
              const drugs = catData.drugs || ED_DRUGS[catData.key]?.drugs || [];
              return (
                <div key={catData.key || catData.label} style={{ marginBottom: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 18 }}>{catData.icon}</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "var(--tx)" }}>{catData.label}</span>
                    <span className="eq-badge eq-b-blu">{drugs.length} drugs</span>
                  </div>
                  {drugs.map((d, i) => {
                    const dk = `${catData.key || catData.label}-${i}`;
                    const isExp = edExpanded === dk;
                    return (
                      <div key={i} className={`eq-row${isExp ? ' ex' : ''}`} onClick={() => setEdExpanded(isExp ? null : dk)}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span className="mdot" style={{ background: isExp ? "var(--teal)" : "var(--tx3)", boxShadow: isExp ? "0 0 8px var(--teal)" : "none", width: 7, height: 7 }} />
                            <span style={{ fontWeight: 600, color: "var(--tx)", fontSize: 13 }}>{d.name}</span>
                          </div>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            <span className="eq-badge eq-b-teal">{d.route}</span>
                            <span className="eq-badge eq-b-yel">{d.onset}</span>
                          </div>
                        </div>
                        <div style={{ marginTop: 4, fontFamily: "monospace", fontSize: 13, color: "var(--teal)", fontWeight: 600 }}>{d.dose}</div>
                        {isExp && (
                          <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--br)" }}>
                            <span className="eq-badge eq-b-blu" style={{ marginBottom: 8, display: "inline-block" }}>{d.class}</span>
                            <div className="eq-notes">{d.notes}</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </>
        )}

        {/* ── PED CALCULATOR TAB ── */}
        {tab === "calculator" && (
          <>
            <div className="sh">
              <div className="sh-l"><div className="sh-ico">⚖️</div><span className="sh-ttl">PEDIATRIC MEDICATION CALCULATOR</span></div>
              <span className="sh-m">Weight-based · Broselow · Solution selector</span>
            </div>
            <div className="card" style={{ marginBottom: 14 }}>
              <div className="chdr"><span className="sh-ttl">PATIENT PARAMETERS</span><span className="sh-m">Enter age or override with actual weight</span></div>
              <div className="cbdy">
                <div className="cinps">
                  <div>
                    <label className="ilbl">Age</label>
                    <div style={{ display: "flex", gap: 6 }}>
                      <input className="inp" type="number" min="0" placeholder="0" value={pedAge} onChange={e => setPedAge(e.target.value)} style={{ flex: 1 }} />
                      <select className="sel" value={pedUnit} onChange={e => setPedUnit(e.target.value)} style={{ width: 90 }}>
                        <option value="months">months</option><option value="years">years</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="ilbl">Weight (kg) — optional override</label>
                    <input className="inp" type="number" min="0" step="0.1" placeholder="Auto-estimated from age" value={pedWt} onChange={e => setPedWt(e.target.value)} />
                  </div>
                  <div>
                    <label className="ilbl">Filter Drug Category</label>
                    <select className="sel" value={pedCat} onChange={e => setPedCat(e.target.value)}>
                      <option value="all">All Categories</option>
                      {CATEGORIES.filter(c => c.id !== "all").map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                </div>

                {weight && bz && (
                  <>
                    <div className="wbar">
                      <div>
                        <div style={{ fontSize: 10, color: "var(--tx3)", letterSpacing: ".08em", marginBottom: 2 }}>ESTIMATED WEIGHT</div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                          <span className="wv">{weight}</span><span className="wu">kg</span>
                          {!pedWt && <span className="west">(age-estimated)</span>}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, marginLeft: 16, flexWrap: "wrap" }}>
                        <div className="cstat"><div className="csv" style={{ color: "var(--teal)" }}>{weight < 3 ? "2.5" : weight < 5 ? "3.0" : (Math.round((weight / 4 + 4) * 2) / 2).toFixed(1)} mm</div><div className="csl">ET TUBE</div></div>
                        <div className="cstat"><div className="csv" style={{ color: "var(--yel)" }}>{Math.min(weight * 2, 120)} J</div><div className="csl">DEFIB 2 J/kg</div></div>
                        <div className="cstat"><div className="csv" style={{ color: "var(--pur)" }}>{(weight * 0.01).toFixed(2)} mg</div><div className="csl">EPI ARREST</div></div>
                      </div>
                      <div className="bzb" style={{ background: bz.hex + "20", color: bz.hex, border: `1px solid ${bz.hex}40` }}>● {bz.zone}</div>
                      <button onClick={() => setShowSaveModal(true)} style={{ padding: "5px 12px", borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: "pointer", background: "rgba(0,196,160,0.12)", border: "1px solid rgba(0,196,160,0.3)", color: "#00c4a0", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                        💾 Save Case
                      </button>
                    </div>

                    {pedResults.length > 0 && (
                      <div className="card" style={{ background: "var(--c2)", marginBottom: 16 }}>
                        <div className="chdr"><span className="sh-ttl">DB DOSES — {weight} kg PATIENT</span><span className="sh-m">{pedResults.length} from Drugs_DB</span></div>
                        <div style={{ padding: "0 0 8px" }}>
                          <table className="rtbl">
                            <thead><tr><th>MEDICATION</th><th>CATEGORY</th><th>CALCULATED DOSE</th><th>ROUTE</th><th>NOTES</th></tr></thead>
                            <tbody>
                              {pedResults.map(m => (
                                <tr key={m.id}>
                                  <td><div style={{ fontWeight: 600, fontSize: 12 }}>{m.name}</div><div style={{ fontSize: 10, color: "var(--tx3)" }}>{m.code}</div></td>
                                  <td><span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: `${CAT_COLOR[m.category]}15`, color: CAT_COLOR[m.category], border: `1px solid ${CAT_COLOR[m.category]}30` }}>{m.category}</span></td>
                                  <td><span className={`rdose ${m.capped ? "rcap" : ""}`}>{m.calcDose}</span>{m.capped && <span className="rmax"> MAX</span>}</td>
                                  <td style={{ fontFamily: "monospace", fontSize: 11, color: "var(--tx2)" }}>{m.ped.route}</td>
                                  <td style={{ fontSize: 11, color: "var(--tx2)" }}>{m.ped.notes}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    <div style={{ marginBottom: 8 }}>
                      <div className="sh-l" style={{ marginBottom: 10 }}>
                        <div className="sh-ico">💉</div>
                        <span className="sh-ttl">FORMULATION & VOLUME CALCULATOR</span>
                      </div>
                    </div>
                    {pedsSolResults.map((d, idx) => (
                      <div key={idx} className="sol-card">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--tx)" }}>{d.name}</div>
                            <div style={{ fontFamily: "monospace", fontSize: 11, color: "var(--tx3)", marginTop: 3 }}>{d.mpk} mg/kg · {d.route} · {d.freq}</div>
                          </div>
                          <div style={{ display: "flex", gap: 6 }}>
                            <span className="eq-badge eq-b-teal">{d.route}</span>
                            <span className="eq-badge" style={{ background: "rgba(255,159,67,.1)", border: "1px solid rgba(255,159,67,.25)", color: "var(--yel)" }}>Max {d.max} mg</span>
                          </div>
                        </div>
                        <div className="sol-dose" style={{ background: d.capped ? "rgba(245,158,11,.06)" : "rgba(0,196,160,.06)", border: `1px solid ${d.capped ? "rgba(245,158,11,.2)" : "rgba(0,196,160,.2)"}` }}>
                          <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                            <span className="dlbl" style={{ margin: 0 }}>Calculated Dose</span>
                            <span className="sol-val" style={{ fontSize: 22, color: d.capped ? "var(--yel)" : "var(--teal)" }}>{d.final.toFixed(1)} mg</span>
                            {d.capped && <span className="rmax">MAX CAPPED</span>}
                          </div>
                          <div style={{ fontFamily: "monospace", fontSize: 10, color: "var(--tx3)", marginTop: 4 }}>
                            {d.mpk} mg/kg × {weight} kg = {d.raw.toFixed(1)} mg{d.capped ? ` → capped at ${d.max} mg` : ""}
                          </div>
                        </div>
                        <div style={{ marginTop: 12 }}>
                          <div className="dlbl">Select Formulation</div>
                          <select className="sel" value={d.selIdx ?? ""} onChange={e => setPedsSols(prev => ({ ...prev, [d.name]: e.target.value === "" ? undefined : parseInt(e.target.value) }))}>
                            <option value="">— Select Strength —</option>
                            {d.sols.map((s, si) => <option key={si} value={si}>{s.l}</option>)}
                          </select>
                          {d.vol && (
                            <div className="sol-vol">
                              <span className="dlbl" style={{ margin: 0, color: "var(--blu)" }}>Volume to Give</span>
                              <span className="sol-val" style={{ fontSize: 20, color: "var(--blu)" }}>{d.vol.value} {d.vol.unit}</span>
                            </div>
                          )}
                        </div>
                        <div style={{ marginTop: 10, fontSize: 11, color: "var(--tx3)", lineHeight: 1.6, fontStyle: "italic", background: "var(--bg)", padding: "8px 10px", borderRadius: 6 }}>
                          {d.notes}
                        </div>
                      </div>
                    ))}
                  </>
                )}
                {!weight && <div className="empty"><div className="empty-i">⚖️</div><div className="empty-t">Enter patient age or weight to calculate doses</div></div>}
              </div>
            </div>
          </>
        )}

        {/* ── SEPSIS TAB ── */}
        {tab === "sepsis" && (
          <>
            <div className="stabs" style={{ marginBottom: 14 }}>
              <button className={`stab${sepsisSubTab === "protocol" ? " on" : ""}`} onClick={() => setSepsisSubTab("protocol")}>🔴 Full Protocol</button>
              <button className={`stab${sepsisSubTab === "fluids" ? " on" : ""}`} onClick={() => setSepsisSubTab("fluids")}>💧 Fluid & Med Calculator</button>
            </div>

            {sepsisSubTab === "protocol" && <SepsisProtocol />}

            {sepsisSubTab === "fluids" && (
              <>
                <div className="card" style={{ borderColor: "rgba(239,68,68,.25)", background: "rgba(239,68,68,.03)", marginBottom: 14 }}>
                  <div className="cbdy" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 24 }}>🦠</span>
                    <div>
                      <div style={{ fontSize: 17, fontWeight: 700, color: "var(--red)" }}>Sepsis Fluid & Medication Calculator</div>
                      <div style={{ fontFamily: "monospace", fontSize: 9, color: "rgba(239,68,68,.5)", letterSpacing: 2, marginTop: 2 }}>SURVIVING SEPSIS CAMPAIGN 2021 · HOUR-1 BUNDLE</div>
                    </div>
                  </div>
                </div>

                <div className="card" style={{ marginBottom: 14 }}>
                  <div className="chdr"><span className="sh-ttl">WEIGHT & FLUID CALCULATION</span></div>
                  <div className="cbdy">
                    <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
                      <input className="inp" type="number" placeholder="Enter weight in kg..." value={sepsisWt} onChange={e => setSepsisWt(e.target.value)} min="0" step="0.1" style={{ flex: 1 }} />
                      <span style={{ color: "var(--tx3)", fontFamily: "monospace", fontWeight: 600 }}>kg</span>
                    </div>
                    {parseFloat(sepsisWt) > 0 && (
                      <div className="sep-fluid" style={{ background: "rgba(239,68,68,.05)", border: "1px solid rgba(239,68,68,.2)" }}>
                        <div style={{ fontFamily: "monospace", fontSize: 9, color: "rgba(239,68,68,.6)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>30 mL/kg Crystalloid Bolus</div>
                        <div style={{ fontFamily: "monospace", fontSize: 28, fontWeight: 800, color: "var(--red)" }}>{(parseFloat(sepsisWt) * 30).toFixed(0)} mL</div>
                        <div style={{ fontFamily: "monospace", fontSize: 10, color: "var(--tx3)", marginTop: 4 }}>30 mL/kg × {sepsisWt} kg · Within first 3 hours · Reassess after each bolus</div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="card" style={{ marginBottom: 14 }}>
                  <div className="chdr"><span className="sh-ttl">⏱ HOUR-1 BUNDLE</span><span className="sh-m">Tap to check off</span></div>
                  <div className="cbdy">
                    {HOUR1_BUNDLE.map((s, i) => {
                      const k = `h1-${i}`, done = sepsisChecked[k];
                      return (
                        <div key={i} className={`sep-chk ${s.crit ? 'crit' : 'norm'}${done ? ' done' : ''}`} onClick={() => setSepsisChecked(p => ({ ...p, [k]: !p[k] }))}>
                          <span className="sep-ico" style={{ color: done ? "var(--teal)" : s.crit ? "var(--red)" : "var(--tx3)" }}>{done ? "✓" : s.crit ? "!" : "○"}</span>
                          <span className="sep-txt" style={{ color: done ? "var(--tx3)" : s.crit ? "var(--tx)" : "var(--tx2)" }}>{s.action}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {parseFloat(sepsisWt) > 0 && (() => {
                  const wt = parseFloat(sepsisWt);
                  const meds = [
                    { name: "Vancomycin", val: `${(wt*25).toFixed(0)}–${(wt*30).toFixed(0)} mg`, route: "IV", note: "Infuse over 1-2h" },
                    { name: "Norepinephrine", val: "0.1–0.5 mcg/kg/min", route: "IV drip", note: "First-line vasopressor" },
                    { name: "Hydrocortisone", val: "100 mg", route: "IV q8h", note: "If refractory shock" },
                    { name: "Pip-Tazo", val: "4.5 g", route: "IV q6h", note: "Extended infusion 4h" },
                  ];
                  return (
                    <div className="card" style={{ marginBottom: 14 }}>
                      <div className="chdr"><span className="sh-ttl">💉 WEIGHT-BASED SEPSIS MEDS</span></div>
                      <div className="cbdy">
                        {meds.map((m, i) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 13px", background: "var(--c3)", border: "1px solid var(--br)", borderRadius: "var(--r)", marginBottom: 4, flexWrap: "wrap", gap: 8 }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--tx)" }}>{m.name}</div>
                              <div style={{ fontFamily: "monospace", fontSize: 10, color: "var(--tx3)" }}>{m.route} · {m.note}</div>
                            </div>
                            <div style={{ fontFamily: "monospace", fontSize: 16, fontWeight: 800, color: "var(--teal)" }}>{m.val}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                <div className="card" style={{ marginBottom: 14 }}>
                  <div className="chdr">
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--red)", display: "inline-block" }} />
                      <span className="sh-ttl">AI SEPSIS PROTOCOL ADVISOR</span>
                    </div>
                  </div>
                  <div className="cbdy">
                    <div style={{ fontSize: 11, color: "var(--tx3)", marginBottom: 10 }}>Enter suspected source for targeted antibiotic recommendations.</div>
                    <input className="inp" placeholder="e.g., 'Urinary source, elderly male'..." value={sepsisQuery} onChange={e => setSepsisQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSepsisAI()} style={{ marginBottom: 10 }} />
                    <button className="aib" style={{ background: "var(--red)" }} onClick={handleSepsisAI} disabled={sepsisAiLoading || !sepsisWt}>
                      {sepsisAiLoading ? "Generating..." : "⌘ Generate Protocol"}
                    </button>
                    {!sepsisWt && <div style={{ fontSize: 10, color: "rgba(239,68,68,.5)", marginTop: 6 }}>⚠ Enter patient weight above first</div>}
                    {sepsisAiText && (
                      <>
                        <div className="airesp" style={{ marginTop: 12 }}>{sepsisAiText}</div>
                        <div className="ai-disc">⚠ AI-generated protocol. Clinical judgment should always prevail. Follow institutional sepsis protocols.</div>
                      </>
                    )}
                  </div>
                </div>

                <div className="card">
                  <div className="chdr"><span className="sh-ttl">🔄 REASSESSMENT CHECKLIST</span></div>
                  <div className="cbdy">
                    {REASSESS_ITEMS.map((s, i) => {
                      const k = `re-${i}`, done = sepsisChecked[k];
                      return (
                        <div key={i} className={`sep-chk ${s.crit ? 'crit' : 'norm'}${done ? ' done' : ''}`} onClick={() => setSepsisChecked(p => ({ ...p, [k]: !p[k] }))}>
                          <span className="sep-ico" style={{ color: done ? "var(--teal)" : s.crit ? "var(--red)" : "var(--tx3)" }}>{done ? "✓" : s.crit ? "!" : "○"}</span>
                          <span className="sep-txt" style={{ color: done ? "var(--tx3)" : s.crit ? "var(--tx)" : "var(--tx2)" }}>{s.action}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* ── ER CONDITIONS TAB ── */}
        {tab === "conditions" && <ERConditions />}

      </div>
    </>
  );
}