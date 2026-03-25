import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";

/* ─── DESIGN TOKENS CSS (scoped to .mr-page) ─── */
const CSS = `
.mr-page { --bg:#050f1e; --bg-panel:#081628; --bg-card:#0b1e36; --bg-up:#0e2544; --border:#1a3555; --border-hi:#2a4f7a; --blue:#3b9eff; --teal:#00e5c0; --gold:#f5c842; --purple:#9b6dff; --coral:#ff6b6b; --orange:#ff9f43; --txt:#e8f0fe; --txt2:#8aaccc; --txt3:#4a6a8a; --txt4:#2e4a6a; --r:8px; --rl:12px; }
.mr-page *, .mr-page *::before, .mr-page *::after { box-sizing: border-box; margin: 0; padding: 0; }
.mr-page { display: flex; flex-direction: column; height: calc(100vh - 138px); background: var(--bg); color: var(--txt); font-family: 'DM Sans', sans-serif; font-size: 14px; overflow: hidden; }
.mr-topbar { display: flex; align-items: center; gap: 10px; padding: 10px 18px; background: var(--bg-panel); border-bottom: 1px solid var(--border); flex-shrink: 0; flex-wrap: wrap; }
.mr-title { font-family: 'Playfair Display', serif; font-size: 17px; font-weight: 700; color: var(--txt); white-space: nowrap; }
.mr-search { flex: 1; display: flex; align-items: center; gap: 8px; background: var(--bg-up); border: 1px solid var(--border); border-radius: var(--r); padding: 0 12px; max-width: 340px; }
.mr-search:focus-within { border-color: var(--border-hi); }
.mr-search input { flex: 1; background: transparent; border: none; outline: none; color: var(--txt); font-size: 13px; padding: 7px 0; font-family: 'DM Sans', sans-serif; }
.mr-search input::placeholder { color: var(--txt3); }
.mr-tabs { display: flex; gap: 2px; margin-left: auto; flex-shrink: 0; }
.mr-tab { padding: 6px 14px; border-radius: 6px; font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 600; color: var(--txt3); letter-spacing: .8px; text-transform: uppercase; cursor: pointer; border: 1px solid transparent; transition: all .15s; white-space: nowrap; }
.mr-tab:hover { color: var(--txt2); background: var(--bg-up); }
.mr-tab.on { background: rgba(0,229,192,.08); border-color: rgba(0,229,192,.25); color: var(--teal); }
.mr-body { flex: 1; display: flex; overflow: hidden; }
.cat-rail { width: 150px; flex-shrink: 0; border-right: 1px solid var(--border); overflow-y: auto; padding: 6px; display: flex; flex-direction: column; gap: 3px; background: var(--bg-panel); }
.cat-btn { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; padding: 12px 6px; border-radius: 10px; cursor: pointer; border: 1px solid transparent; transition: all .18s; text-align: center; position: relative; min-height: 64px; }
.cat-btn:hover { background: var(--bg-up); border-color: var(--border); }
.cat-btn.on { background: rgba(0,229,192,.05); border-color: rgba(0,229,192,.3); }
.cat-btn.on::after { content: ''; position: absolute; right: -1px; top: 14px; bottom: 14px; width: 3px; background: var(--teal); border-radius: 3px 0 0 3px; }
.cat-ico { font-size: 20px; line-height: 1; }
.cat-nm { font-size: 10px; font-weight: 600; color: var(--txt2); line-height: 1.2; }
.cat-btn.on .cat-nm { color: var(--teal); }
.cat-ct { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: var(--txt4); }
.drug-list { flex: 1; overflow-y: auto; padding: 10px 14px; }
.dlh { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid rgba(26,53,85,.4); }
.dlh-ico { font-size: 18px; }
.dlh-nm { font-family: 'Playfair Display', serif; font-size: 15px; font-weight: 700; color: var(--txt); }
.dlh-ct { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--txt3); }
.dr { padding: 10px 14px; border-radius: var(--r); margin-bottom: 4px; background: var(--bg-up); border: 1px solid rgba(26,53,85,.4); cursor: pointer; transition: all .12s; }
.dr:hover { border-color: var(--border); }
.dr.ex { border-color: var(--border-hi); background: var(--bg-card); }
.dr-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.dr-left { display: flex; align-items: center; gap: 8px; }
.dr-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.dr-nm { font-weight: 600; color: var(--txt); font-size: 13px; }
.dr-ds { margin-top: 3px; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--teal); font-weight: 600; }
.dr-det { margin-top: 9px; padding-top: 9px; border-top: 1px solid rgba(26,53,85,.4); }
.dr-notes { font-size: 12px; color: var(--txt2); line-height: 1.6; background: var(--bg); padding: 8px 12px; border-radius: 6px; border-left: 3px solid var(--border-hi); margin-top: 6px; }
.b { display: inline-block; padding: 2px 7px; border-radius: 4px; font-family: 'JetBrains Mono', monospace; font-size: 9px; font-weight: 600; letter-spacing: .4px; }
.b-t { background: rgba(0,229,192,.1); border: 1px solid rgba(0,229,192,.2); color: var(--teal); }
.b-g { background: rgba(245,200,66,.1); border: 1px solid rgba(245,200,66,.2); color: var(--gold); }
.b-b { background: rgba(59,158,255,.1); border: 1px solid rgba(59,158,255,.2); color: var(--blue); }
.b-o { background: rgba(255,159,67,.1); border: 1px solid rgba(255,159,67,.2); color: var(--orange); }
.b-hi { background: rgba(255,107,107,.12); border: 1px solid rgba(255,107,107,.25); color: var(--coral); }
.full-pane { flex: 1; overflow-y: auto; padding: 16px 20px; }
.section-box { background: var(--bg-panel); border: 1px solid var(--border); border-radius: var(--rl); padding: 14px 16px; margin-bottom: 12px; }
.mr-lbl { font-family: 'JetBrains Mono', monospace; font-size: 9px; font-weight: 600; color: var(--txt4); letter-spacing: 3px; text-transform: uppercase; margin-bottom: 8px; }
.mr-field { background: var(--bg-up); border: 1px solid var(--border); border-radius: 6px; padding: 8px 12px; color: var(--txt); font-size: 13px; font-family: 'DM Sans', sans-serif; outline: none; width: 100%; transition: border-color .15s; }
.mr-field:focus { border-color: var(--blue); }
.mr-field::placeholder { color: var(--txt4); }
.mr-select { background: var(--bg-up); border: 1px solid var(--border); border-radius: 6px; padding: 8px 12px; color: var(--txt); font-size: 12px; font-family: 'DM Sans', sans-serif; outline: none; cursor: pointer; width: 100%; }
.mr-select option { background: var(--bg-card); }
.sol-card { background: var(--bg-panel); border: 1px solid var(--border); border-radius: var(--rl); padding: 14px 16px; margin-bottom: 8px; }
.sol-vol { padding: 8px 12px; border-radius: 8px; margin-top: 6px; background: rgba(59,158,255,.06); border: 1px solid rgba(59,158,255,.2); display: flex; align-items: baseline; gap: 8px; }
.wbar { display: flex; align-items: center; gap: 14px; padding: 10px 14px; background: rgba(0,229,192,.04); border: 1px solid rgba(0,229,192,.12); border-radius: var(--rl); margin-bottom: 12px; flex-wrap: wrap; }
.wv { font-size: 26px; font-weight: 700; color: var(--teal); font-family: 'JetBrains Mono', monospace; }
.bzb { padding: 3px 10px; border-radius: 5px; font-size: 11px; font-weight: 700; font-family: 'JetBrains Mono', monospace; margin-left: auto; }
.cstat { background: var(--bg-up); border-radius: 6px; padding: 5px 10px; text-align: center; border: 1px solid var(--border); }
.csv { font-size: 13px; font-weight: 700; font-family: 'JetBrains Mono', monospace; }
.csl { font-size: 7px; letter-spacing: .08em; text-transform: uppercase; color: var(--txt3); margin-top: 1px; }
.rmax { font-size: 8px; padding: 1px 6px; border-radius: 3px; background: rgba(245,200,66,.1); color: var(--gold); font-weight: 700; margin-left: 4px; }
.sep-chk { display: flex; align-items: center; gap: 10px; padding: 7px 12px; border-radius: 6px; margin-bottom: 3px; font-size: 12px; cursor: pointer; transition: all .12s; user-select: none; }
.sep-chk.crit { background: rgba(255,107,107,.04); border: 1px solid rgba(255,107,107,.1); }
.sep-chk.norm { background: var(--bg-up); border: 1px solid rgba(26,53,85,.4); }
.sep-chk.done .stxt { text-decoration: line-through; color: var(--txt3) !important; }
.ai-disc { padding: 8px 10px; border-radius: 6px; font-size: 10px; line-height: 1.5; background: rgba(255,107,107,.04); border-left: 3px solid var(--coral); color: rgba(255,107,107,.55); margin-top: 8px; }
.no-data { text-align: center; padding: 40px; color: var(--txt3); }
.no-data-i { font-size: 32px; margin-bottom: 8px; }
.no-data-t { font-size: 13px; }
.mr-btn-ghost { background: var(--bg-up); border: 1px solid var(--border); border-radius: 6px; padding: 4px 10px; font-size: 11px; color: var(--txt2); cursor: pointer; transition: all .15s; display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; font-family: 'DM Sans', sans-serif; }
.mr-btn-ghost:hover { border-color: var(--border-hi); color: var(--txt); }
.mr-btn-primary { background: var(--teal); color: var(--bg); border: none; border-radius: 6px; padding: 6px 16px; font-size: 11px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; font-family: 'DM Sans', sans-serif; }
.mr-btn-primary:hover { filter: brightness(1.1); }
.mr-btn-primary:disabled { opacity: .4; cursor: default; }
.mr-btn-coral { background: rgba(255,107,107,.15); color: var(--coral); border: 1px solid rgba(255,107,107,.3); border-radius: 6px; padding: 6px 16px; font-size: 11px; font-weight: 600; cursor: pointer; white-space: nowrap; font-family: 'DM Sans', sans-serif; }
.mr-btn-coral:hover { background: rgba(255,107,107,.25); }
.mr-btn-coral:disabled { opacity: .4; cursor: default; }
.mr-page ::-webkit-scrollbar { width: 4px; }
.mr-page ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
@media (max-width: 900px) { .cat-rail { width: 56px; } .cat-nm, .cat-ct { display: none; } .cat-btn { min-height: 48px; padding: 8px 4px; } }
`;

/* ─── ED CLINICAL DATA (hardcoded, as in HTML) ─── */
const ED = {
  chestPain:{l:"Chest Pain / ACS",i:"🫀",d:[{n:"Aspirin",ds:"325 mg",r:"PO",nt:"Chew immediately. Non-enteric coated.",c:"Antiplatelet",o:"15-30 min"},{n:"Nitroglycerin",ds:"0.4 mg SL",r:"SL",nt:"Repeat q5min x3. Hold SBP<90.",c:"Vasodilator",o:"1-3 min"},{n:"Heparin",ds:"60 U/kg (max 4000U)",r:"IV",nt:"aPTT at 6h. Target 1.5-2.5x.",c:"Anticoagulant",o:"Immediate"},{n:"Morphine",ds:"2-4 mg IV",r:"IV",nt:"Caution in NSTEMI.",c:"Opioid",o:"5-10 min"},{n:"Ticagrelor",ds:"180 mg loading",r:"PO",nt:"Preferred per AHA.",c:"P2Y12",o:"30 min"},{n:"Clopidogrel",ds:"600 mg loading",r:"PO",nt:"Alt if ticagrelor CI.",c:"P2Y12",o:"2-6 hrs"},{n:"Metoprolol",ds:"5 mg IV q5min x3",r:"IV/PO",nt:"Hold HR<60, SBP<100.",c:"Beta-Blocker",o:"5 min"}]},
  anaphylaxis:{l:"Anaphylaxis",i:"⚠️",d:[{n:"Epinephrine",ds:"0.3-0.5 mg IM",r:"IM",nt:"FIRST-LINE. Do NOT delay.",c:"Sympathomimetic",o:"3-5 min"},{n:"Diphenhydramine",ds:"25-50 mg IV/IM",r:"IV/IM",nt:"H1 adjunct only.",c:"Antihistamine",o:"15-30 min"},{n:"Famotidine",ds:"20 mg IV",r:"IV",nt:"H2 adjunct.",c:"H2 Blocker",o:"15-30 min"},{n:"Methylprednisolone",ds:"125 mg IV",r:"IV",nt:"Prevents biphasic.",c:"Steroid",o:"4-6 hrs"},{n:"Albuterol",ds:"2.5 mg neb",r:"Neb",nt:"Refractory bronchospasm.",c:"Beta-2",o:"5-15 min"},{n:"NS Bolus",ds:"1-2 L",r:"IV",nt:"Refractory hypotension.",c:"Fluid",o:"Immediate"}]},
  respiratory:{l:"Respiratory",i:"🫁",d:[{n:"Albuterol",ds:"2.5 mg neb q20min",r:"Neb",nt:"Continuous 10-15 mg/hr severe.",c:"Beta-2",o:"5-15 min"},{n:"Ipratropium",ds:"0.5 mg neb q20min",r:"Neb",nt:"Add to albuterol.",c:"Anticholinergic",o:"15-30 min"},{n:"Prednisone",ds:"40-60 mg PO",r:"PO",nt:"Within 1 hour. 5-day.",c:"Steroid",o:"4-6 hrs"},{n:"MgSO4",ds:"2 g IV / 20 min",r:"IV",nt:"Severe only.",c:"Bronchodilator",o:"15-20 min"},{n:"BiPAP",ds:"IPAP 10-15 / EPAP 5",r:"NIV",nt:"COPD resp acidosis.",c:"Ventilation",o:"Immediate"}]},
  seizures:{l:"Seizures",i:"🧠",d:[{n:"Lorazepam",ds:"4 mg IV",r:"IV",nt:"First-line. Repeat x1.",c:"Benzo",o:"1-3 min"},{n:"Midazolam",ds:"10 mg IM",r:"IM",nt:"No IV? RAMPART trial.",c:"Benzo",o:"3-5 min"},{n:"Levetiracetam",ds:"60 mg/kg (max 4500)",r:"IV",nt:"Second-line.",c:"AED",o:"15-30 min"},{n:"Fosphenytoin",ds:"20 mg PE/kg",r:"IV",nt:"Watch hypotension.",c:"AED",o:"10-20 min"},{n:"Phenobarbital",ds:"20 mg/kg",r:"IV",nt:"Third-line.",c:"Barbiturate",o:"15-30 min"}]},
  pain:{l:"Pain",i:"💊",d:[{n:"Acetaminophen",ds:"1000 mg IV/PO",r:"IV/PO",nt:"First-line. Max 4g/day.",c:"Analgesic",o:"15-30 min"},{n:"Ketorolac",ds:"15-30 mg IV",r:"IV",nt:"Max 5 days.",c:"NSAID",o:"10-15 min"},{n:"Morphine",ds:"0.1 mg/kg IV",r:"IV",nt:"Titrate q10-15min.",c:"Opioid",o:"5-10 min"},{n:"Fentanyl",ds:"1-1.5 mcg/kg",r:"IV",nt:"Hemodynamic instability.",c:"Opioid",o:"2-3 min"},{n:"Ketamine",ds:"0.3 mg/kg IV",r:"IV",nt:"Subdissociative.",c:"NMDA",o:"1-2 min"}]},
  cardiac:{l:"ACLS",i:"⚡",d:[{n:"Epinephrine",ds:"1 mg IV/IO q3-5min",r:"IV/IO",nt:"Flush 20 mL NS.",c:"Sympathomimetic",o:"Immediate"},{n:"Amiodarone",ds:"300 mg IV then 150",r:"IV",nt:"Refractory VF/pVT.",c:"Antiarrhythmic",o:"Immediate"},{n:"Atropine",ds:"1 mg IV (max 3)",r:"IV",nt:"Bradycardia only.",c:"Anticholinergic",o:"1-2 min"},{n:"CaCl2",ds:"1 g IV slow push",r:"IV",nt:"HyperK, CCB OD.",c:"Electrolyte",o:"1-3 min"},{n:"NaHCO3",ds:"1 mEq/kg",r:"IV",nt:"TCA OD, HyperK.",c:"Buffer",o:"Immediate"}]},
  stroke:{l:"Stroke",i:"🧠",d:[{n:"Alteplase",ds:"0.9 mg/kg (max 90)",r:"IV",nt:"10% bolus, rest 60min. <4.5h.",c:"Thrombolytic",o:"Immediate"},{n:"Tenecteplase",ds:"0.25 mg/kg (max 25)",r:"IV",nt:"Single bolus.",c:"Thrombolytic",o:"Immediate"},{n:"Labetalol",ds:"10-20 mg IV q10-20min",r:"IV",nt:"BP <185/110 pre-tPA.",c:"Beta-Blocker",o:"5-10 min"},{n:"Nicardipine",ds:"5 mg/hr drip",r:"IV",nt:"Max 15 mg/hr.",c:"CCB",o:"5-15 min"}]},
  sepsis:{l:"Sepsis",i:"🦠",d:[{n:"LR / NS",ds:"30 mL/kg bolus",r:"IV",nt:"Within 3 hours.",c:"Crystalloid",o:"Immediate"},{n:"Norepinephrine",ds:"0.1-0.5 mcg/kg/min",r:"IV",nt:"1st vasopressor.",c:"Vasopressor",o:"Immediate"},{n:"Vancomycin",ds:"25-30 mg/kg",r:"IV",nt:"MRSA coverage.",c:"Antibiotic",o:"1-2 hrs"},{n:"Pip-Tazo",ds:"4.5 g q6h",r:"IV",nt:"Extended infusion.",c:"Antibiotic",o:"30-60 min"},{n:"Hydrocortisone",ds:"100 mg q8h",r:"IV",nt:"Refractory shock.",c:"Steroid",o:"1-2 hrs"}]},
  overdose:{l:"Overdose",i:"☠️",d:[{n:"Naloxone",ds:"0.4-2 mg IV/IN",r:"IV/IN",nt:"Titrate to resp effort.",c:"Antagonist",o:"1-2 min"},{n:"Charcoal",ds:"1 g/kg (max 50g)",r:"PO",nt:"Within 1-2h.",c:"Adsorbent",o:"15-30 min"},{n:"NAC",ds:"150/50/100 mg/kg",r:"IV",nt:"APAP OD. <8h.",c:"Antidote",o:"30-60 min"},{n:"Flumazenil",ds:"0.2 mg q1min (max 3)",r:"IV",nt:"AVOID chronic benzo.",c:"Antagonist",o:"1-2 min"},{n:"Intralipid",ds:"1.5 mL/kg bolus",r:"IV",nt:"LAST.",c:"Lipid",o:"Immediate"}]},
  psych:{l:"Agitation",i:"🧘",d:[{n:"Haloperidol",ds:"5-10 mg IM",r:"IM",nt:"Check QTc.",c:"Antipsychotic",o:"15-30 min"},{n:"Olanzapine",ds:"10 mg IM",r:"IM",nt:"No IM benzo combo.",c:"Antipsychotic",o:"15-30 min"},{n:"Midazolam",ds:"5 mg IM",r:"IM",nt:"Severe agitation.",c:"Benzo",o:"5-10 min"},{n:"Ketamine",ds:"4-5 mg/kg IM",r:"IM",nt:"Excited delirium.",c:"NMDA",o:"3-5 min"}]},
};

/* ─── PEDS DATA ─── */
const PEDS = [
  {n:"Acetaminophen",mpk:15,mx:1000,r:"PO/PR",f:"q4-6h",s:[{l:"Infant 100mg/mL",c:100,u:"mg/mL"},{l:"Children's 32mg/mL",c:32,u:"mg/mL"},{l:"Jr Tab 160mg",c:160,u:"mg/tab"}],nt:"Avoid hepatic impairment."},
  {n:"Ibuprofen",mpk:10,mx:400,r:"PO",f:"q6-8h",s:[{l:"Infant 40mg/mL",c:40,u:"mg/mL"},{l:"Children's 20mg/mL",c:20,u:"mg/mL"},{l:"Jr Tab 100mg",c:100,u:"mg/tab"}],nt:"Avoid <6mo."},
  {n:"Amoxicillin",mpk:45,mx:1000,r:"PO",f:"q12h",s:[{l:"125mg/5mL",c:25,u:"mg/mL"},{l:"250mg/5mL",c:50,u:"mg/mL"},{l:"400mg/5mL",c:80,u:"mg/mL"}],nt:"90 mg/kg/day for AOM."},
  {n:"Ondansetron",mpk:.15,mx:4,r:"IV/PO",f:"q6-8h",s:[{l:"ODT 4mg",c:4,u:"mg/tab"},{l:"Oral 0.8mg/mL",c:.8,u:"mg/mL"},{l:"IV 2mg/mL",c:2,u:"mg/mL"}],nt:"Safe >6mo."},
  {n:"Dexamethasone",mpk:.6,mx:16,r:"PO/IV",f:"Daily x1-2d",s:[{l:"Oral 1mg/mL",c:1,u:"mg/mL"},{l:"IV 4mg/mL",c:4,u:"mg/mL"}],nt:"Croup 0.6 mg/kg x1."},
  {n:"Prednisolone",mpk:1,mx:60,r:"PO",f:"Daily x3-5d",s:[{l:"Prelone 3mg/mL",c:3,u:"mg/mL"},{l:"Pediapred 1mg/mL",c:1,u:"mg/mL"}],nt:"Asthma exacerbation."},
  {n:"Epinephrine IM",mpk:.01,mx:.3,r:"IM",f:"q5-15min",s:[{l:"1:1000 1mg/mL",c:1,u:"mg/mL"},{l:"EpiPen Jr 0.15mg",c:.15,u:"mg/dose"},{l:"EpiPen 0.3mg",c:.3,u:"mg/dose"}],nt:"IM anterolateral thigh."},
  {n:"Albuterol Neb",mpk:.15,mx:5,r:"Neb",f:"q20min x3",s:[{l:"5mg/mL",c:5,u:"mg/mL"},{l:"2.5mg/3mL",c:.83,u:"mg/mL"}],nt:"Continuous 0.5 mg/kg/hr."},
  {n:"Ceftriaxone",mpk:50,mx:2000,r:"IV/IM",f:"q24h",s:[{l:"IV 100mg/mL",c:100,u:"mg/mL"},{l:"IM 250mg/mL",c:250,u:"mg/mL"}],nt:"Avoid neonates + Ca."},
  {n:"Midazolam",mpk:.2,mx:10,r:"IN/IM/IV",f:"x1",s:[{l:"5mg/mL IM/IN",c:5,u:"mg/mL"},{l:"1mg/mL IV",c:1,u:"mg/mL"}],nt:"Split IN between nares."},
  {n:"Diphenhydramine",mpk:1.25,mx:50,r:"PO/IV",f:"q6h",s:[{l:"Elixir 2.5mg/mL",c:2.5,u:"mg/mL"},{l:"Chew 12.5mg",c:12.5,u:"mg/tab"},{l:"IV 50mg/mL",c:50,u:"mg/mL"}],nt:"Paradoxical excitability."},
];

const H1 = [{a:"Measure lactate",c:true},{a:"Blood cultures before abx",c:true},{a:"Broad-spectrum antibiotics",c:true},{a:"30 mL/kg crystalloid",c:true},{a:"Vasopressors for MAP >= 65",c:false}];
const RE = [{a:"Reassess volume status",c:true},{a:"Re-measure lactate",c:false},{a:"SOFA score",c:false}];

/* ─── HELPERS ─── */
function estWt(mo) {
  if (mo < 3) return 3.5 + mo * .9;
  if (mo < 12) return 6 + (mo - 3) * .5;
  const y = mo / 12;
  return y <= 2 ? 10 + (y - 1) * 2.5 : y * 3 + 7;
}
function getBroselow(w) {
  if (w < 5)  return {z:'Grey',   h:'#9ca3af'};
  if (w < 7)  return {z:'Pink',   h:'#ec4899'};
  if (w < 9)  return {z:'Red',    h:'#ef4444'};
  if (w < 11) return {z:'Purple', h:'#8b5cf6'};
  if (w < 14) return {z:'Yellow', h:'#eab308'};
  if (w < 18) return {z:'White',  h:'#e2e8f0'};
  if (w < 23) return {z:'Blue',   h:'#3b82f6'};
  if (w < 29) return {z:'Orange', h:'#f97316'};
  if (w < 36) return {z:'Green',  h:'#22c55e'};
  return {z:'Adult', h:'#6b7280'};
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════ */
export default function MedicationReference() {
  const [tab, setTab] = useState('edref');
  const [edCat, setEdCat] = useState('chestPain');
  const [edSearch, setEdSearch] = useState('');
  const [expanded, setExpanded] = useState(null);

  // DB Meds (used in edref to supplement)
  const [dbMeds, setDbMeds] = useState([]);
  useEffect(() => {
    base44.entities.Medication.list('-name', 300).then(d => setDbMeds(d || [])).catch(() => {});
  }, []);

  // Peds
  const [pedAge, setPedAge] = useState('');
  const [pedUnit, setPedUnit] = useState('months');
  const [pedWt, setPedWt] = useState('');
  const [pedSols, setPedSols] = useState({});

  // AI Search
  const [aiQuery, setAiQuery] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Sepsis
  const [sepWt, setSepWt] = useState('');
  const [sepQuery, setSepQuery] = useState('');
  const [sepResult, setSepResult] = useState('');
  const [sepLoading, setSepLoading] = useState(false);
  const [sepChecked, setSepChecked] = useState({});

  /* ── peds weight calc ── */
  const weight = useMemo(() => {
    if (pedWt) return parseFloat(pedWt) || null;
    if (!pedAge) return null;
    const mo = pedUnit === 'years' ? parseFloat(pedAge) * 12 : parseFloat(pedAge);
    if (isNaN(mo) || mo < 0) return null;
    return Math.round(estWt(mo) * 10) / 10;
  }, [pedAge, pedUnit, pedWt]);
  const bz = weight ? getBroselow(weight) : null;

  /* ── ED drug filter ── */
  const edCats = useMemo(() => {
    if (!edSearch.trim()) return [{k: edCat, ...ED[edCat]}];
    const q = edSearch.toLowerCase();
    return Object.entries(ED)
      .map(([k, c]) => ({
        k, ...c,
        d: c.d.filter(d => d.n.toLowerCase().includes(q) || d.c.toLowerCase().includes(q) || d.nt.toLowerCase().includes(q) || c.l.toLowerCase().includes(q))
      }))
      .filter(c => c.d.length > 0);
  }, [edCat, edSearch]);

  /* ── ET tube size ── */
  const etTube = (w) => w < 3 ? '2.5' : w < 5 ? '3.0' : (Math.round((w / 4 + 4) * 2) / 2).toFixed(1);

  /* ── AI handlers ── */
  const handleAI = async () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true); setAiResult('');
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `ER physician AI. ACEP/AHA/SSC. Concise.\nComplaint: ${aiQuery}\nFirst-line meds, second-line, monitoring, contraindications.`
      });
      setAiResult(typeof res === 'string' ? res : JSON.stringify(res));
    } catch { setAiResult('AI offline.'); }
    setAiLoading(false);
  };

  const handleSepsis = async () => {
    const w = parseFloat(sepWt); if (!w) return;
    setSepLoading(true); setSepResult('');
    const b = (w * 30).toFixed(0);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Sepsis Protocol AI. SSC 2021.\nWt:${w}kg Bolus:${b}mL${sepQuery ? ' Source:' + sepQuery : ''}\nAbx, vasopressors, steroids. Concise.`
      });
      setSepResult(typeof res === 'string' ? res : JSON.stringify(res));
    } catch { setSepResult(`AI offline. Bolus: ${b} mL.`); }
    setSepLoading(false);
  };

  const toggleCheck = (k) => setSepChecked(p => ({...p, [k]: !p[k]}));

  const TABS = [['edref','ED Drug Ref'],['peds','Peds Dosing'],['ai','AI Search'],['sepsis','Sepsis Protocol']];

  return (
    <>
      <style>{CSS}</style>
      <div className="mr-page">

        {/* ── TOP BAR ── */}
        <div className="mr-topbar">
          <span className="mr-title">💊 ED Med Reference</span>
          {tab === 'edref' && (
            <div className="mr-search">
              <span style={{color:'var(--txt3)'}}>🔍</span>
              <input
                placeholder="Search drugs, classes..."
                value={edSearch}
                onChange={e => { setEdSearch(e.target.value); setExpanded(null); }}
              />
              {edSearch && <span onClick={() => setEdSearch('')} style={{cursor:'pointer',color:'var(--txt3)'}}>✕</span>}
            </div>
          )}
          <div className="mr-tabs">
            {TABS.map(([id, lbl]) => (
              <div key={id} className={`mr-tab${tab===id?' on':''}`} onClick={() => setTab(id)}>{lbl}</div>
            ))}
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="mr-body">

          {/* ══ ED DRUG REF TAB ══ */}
          {tab === 'edref' && (
            <>
              {/* Category Rail */}
              {!edSearch && (
                <div className="cat-rail">
                  {Object.entries(ED).map(([k, c]) => (
                    <div key={k} className={`cat-btn${edCat===k?' on':''}`} onClick={() => { setEdCat(k); setExpanded(null); }}>
                      <div className="cat-ico">{c.i}</div>
                      <div className="cat-nm">{c.l}</div>
                      <div className="cat-ct">{c.d.length}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Drug List */}
              <div className="drug-list">
                {edCats.map(ct => (
                  <div key={ct.k}>
                    <div className="dlh">
                      <span className="dlh-ico">{ct.i}</span>
                      <span className="dlh-nm">{ct.l}</span>
                      <span className="dlh-ct">{ct.d.length} drugs</span>
                    </div>
                    {ct.d.map((d, i) => {
                      const dk = `${ct.k}-${i}`, isX = expanded === dk;
                      return (
                        <div key={dk} className={`dr${isX?' ex':''}`} onClick={() => setExpanded(isX ? null : dk)}>
                          <div className="dr-top">
                            <div className="dr-left">
                              <span className="dr-dot" style={{background: isX?'var(--teal)':'var(--txt4)', boxShadow: isX?'0 0 6px var(--teal)':'none'}} />
                              <span className="dr-nm">{d.n}</span>
                            </div>
                            <div style={{display:'flex',gap:5}}>
                              <span className="b b-t">{d.r}</span>
                              <span className="b b-g">{d.o}</span>
                            </div>
                          </div>
                          <div className="dr-ds">{d.ds}</div>
                          {isX && (
                            <div className="dr-det">
                              <span className="b b-b" style={{display:'inline-block',marginBottom:6}}>{d.c}</span>
                              <div className="dr-notes">{d.nt}</div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}

                {/* DB Medications section */}
                {!edSearch && dbMeds.length > 0 && (
                  <div style={{marginTop:16}}>
                    <div className="dlh">
                      <span className="dlh-ico">🗄️</span>
                      <span className="dlh-nm">Drugs DB</span>
                      <span className="dlh-ct">{dbMeds.length} records</span>
                    </div>
                    {dbMeds.map(m => {
                      const dk = `db-${m.id}`, isX = expanded === dk;
                      return (
                        <div key={dk} className={`dr${isX?' ex':''}`} onClick={() => setExpanded(isX ? null : dk)}>
                          <div className="dr-top">
                            <div className="dr-left">
                              <span className="dr-dot" style={{background: isX?'var(--teal)':'var(--txt4)', boxShadow: isX?'0 0 6px var(--teal)':'none'}} />
                              <span className="dr-nm">{m.name}</span>
                              {m.brand && <span style={{fontSize:11,color:'var(--txt3)',marginLeft:4}}>({m.brand})</span>}
                            </div>
                            <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                              {m.route && <span className="b b-t">{m.route}</span>}
                              {m.drugClass && <span className="b b-b">{m.drugClass}</span>}
                            </div>
                          </div>
                          {m.adultDose && <div className="dr-ds">{m.adultDose}</div>}
                          {isX && (
                            <div className="dr-det">
                              {m.mechanism && <><span className="b b-b" style={{display:'inline-block',marginBottom:6}}>Mechanism</span><div className="dr-notes">{m.mechanism}</div></>}
                              {m.warnings && <div className="dr-notes" style={{marginTop:6,borderLeftColor:'var(--coral)',color:'var(--coral)'}}><strong>⚠ </strong>{m.warnings}</div>}
                              {m.contraindications && <div className="dr-notes" style={{marginTop:6}}><strong>CI: </strong>{m.contraindications}</div>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ══ PEDS TAB ══ */}
          {tab === 'peds' && (
            <div className="full-pane">
              <div className="section-box">
                <div className="mr-lbl">Patient Weight</div>
                <div style={{display:'flex',gap:10,alignItems:'center'}}>
                  <input className="mr-field" type="number" min="0" placeholder="Age..." value={pedAge} onChange={e => setPedAge(e.target.value)} style={{width:90}} />
                  <select className="mr-select" value={pedUnit} onChange={e => setPedUnit(e.target.value)} style={{width:90}}>
                    <option value="months">months</option>
                    <option value="years">years</option>
                  </select>
                  <input className="mr-field" type="number" min="0" step="0.1" placeholder="Weight kg override" value={pedWt} onChange={e => setPedWt(e.target.value)} style={{width:150}} />
                  <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:12,color:'var(--txt3)'}}>kg</span>
                </div>
              </div>

              {weight && bz ? (
                <>
                  <div className="wbar">
                    <div>
                      <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:8,color:'var(--txt4)',letterSpacing:'2px'}}>WEIGHT</div>
                      <div style={{display:'flex',alignItems:'baseline',gap:5}}>
                        <span className="wv">{weight}</span>
                        <span style={{fontSize:12,color:'var(--txt2)'}}>kg</span>
                        {!pedWt && <span style={{fontSize:9,color:'var(--txt3)'}}>(est)</span>}
                      </div>
                    </div>
                    <div style={{display:'flex',gap:6}}>
                      <div className="cstat"><div className="csv" style={{color:'var(--teal)'}}>{etTube(weight)}mm</div><div className="csl">ET Tube</div></div>
                      <div className="cstat"><div className="csv" style={{color:'var(--gold)'}}>{Math.min(weight*2,120)}J</div><div className="csl">Defib</div></div>
                      <div className="cstat"><div className="csv" style={{color:'var(--purple)'}}>{(weight*.01).toFixed(2)}mg</div><div className="csl">Epi</div></div>
                    </div>
                    <div className="bzb" style={{background:bz.h+'20',color:bz.h,border:`1px solid ${bz.h}40`}}>{bz.z}</div>
                  </div>

                  {PEDS.map((d, idx) => {
                    const raw = weight * d.mpk, fin = Math.min(raw, d.mx), cap = raw > d.mx;
                    const si = pedSols[d.n];
                    let vol = null;
                    if (si !== undefined && d.s[si]) {
                      const s = d.s[si];
                      const isT = s.u === 'mg/tab' || s.u === 'mg/dose';
                      vol = {value: (fin/s.c).toFixed(2), unit: isT ? (s.u==='mg/tab'?'tab(s)':'dose(s)') : 'mL'};
                    }
                    return (
                      <div key={idx} className="sol-card">
                        <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:6}}>
                          <div>
                            <div style={{fontFamily:'Playfair Display,serif',fontSize:13,fontWeight:700,color:'var(--txt)'}}>{d.n}</div>
                            <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:10,color:'var(--txt3)',marginTop:2}}>{d.mpk} mg/kg · {d.r} · {d.f}</div>
                          </div>
                          <div style={{display:'flex',gap:4}}><span className="b b-t">{d.r}</span><span className="b b-o">Max {d.mx}mg</span></div>
                        </div>
                        <div style={{padding:'8px 12px',borderRadius:8,marginTop:8,background:cap?'rgba(245,200,66,.06)':'rgba(0,229,192,.06)',border:`1px solid ${cap?'rgba(245,200,66,.18)':'rgba(0,229,192,.18)'}`}}>
                          <div style={{display:'flex',alignItems:'baseline',gap:8,flexWrap:'wrap'}}>
                            <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:8,color:'var(--txt4)',letterSpacing:'2px'}}>DOSE</span>
                            <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:20,fontWeight:800,color:cap?'var(--gold)':'var(--teal)'}}>{fin.toFixed(1)} mg</span>
                            {cap && <span className="rmax">MAX</span>}
                          </div>
                          <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:9,color:'var(--txt3)',marginTop:3}}>{d.mpk} mg/kg x {weight} kg{cap?' capped':''}</div>
                        </div>
                        <div style={{marginTop:10}}>
                          <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:8,color:'var(--txt4)',letterSpacing:'2px',marginBottom:4}}>FORMULATION</div>
                          <select className="mr-select" value={si !== undefined ? si : ''} onChange={e => setPedSols(p => ({...p, [d.n]: e.target.value===''?undefined:parseInt(e.target.value)}))}>
                            <option value="">Select</option>
                            {d.s.map((s, si) => <option key={si} value={si}>{s.l}</option>)}
                          </select>
                          {vol && (
                            <div className="sol-vol">
                              <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:8,color:'var(--txt4)',letterSpacing:'2px'}}>VOLUME</span>
                              <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:18,fontWeight:800,color:'var(--blue)'}}>{vol.value} {vol.unit}</span>
                            </div>
                          )}
                        </div>
                        <div style={{marginTop:8,fontSize:10,color:'var(--txt3)',fontStyle:'italic',background:'var(--bg)',padding:'6px 8px',borderRadius:4}}>{d.nt}</div>
                      </div>
                    );
                  })}
                </>
              ) : (
                <div className="no-data"><div className="no-data-i">⚖️</div><div className="no-data-t">Enter age or weight</div></div>
              )}
            </div>
          )}

          {/* ══ AI SEARCH TAB ══ */}
          {tab === 'ai' && (
            <div className="full-pane">
              <div className="section-box">
                <div className="mr-lbl">AI Clinical Decision Support</div>
                <div style={{fontSize:12,color:'var(--txt3)',marginBottom:12}}>Enter a complaint for evidence-based medication recommendations.</div>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  <input className="mr-field" placeholder="e.g. DKA, AFib with RVR..." value={aiQuery} onChange={e => setAiQuery(e.target.value)} onKeyDown={e => e.key==='Enter' && handleAI()} style={{flex:1,minWidth:180}} />
                  <button className="mr-btn-primary" onClick={handleAI} disabled={aiLoading} style={{padding:'8px 18px',fontFamily:'JetBrains Mono,monospace'}}>{aiLoading ? '...' : 'Analyze'}</button>
                </div>
                <div style={{marginTop:8,display:'flex',gap:4,flexWrap:'wrap'}}>
                  {['SVT','Migraine','DKA','Hyperkalemia','PE','Croup','RSI'].map(q => (
                    <button key={q} className="mr-btn-ghost" style={{fontSize:9,padding:'2px 8px'}} onClick={() => setAiQuery(q)}>{q}</button>
                  ))}
                </div>
                {aiResult && (
                  <>
                    <div style={{marginTop:12,padding:'12px 14px',background:'var(--bg-card)',borderRadius:'var(--rl)',border:'1px solid var(--border)',fontSize:12,lineHeight:1.7,color:'var(--txt2)',whiteSpace:'pre-wrap'}}>{aiResult}</div>
                    <div className="ai-disc">Clinical judgment should always prevail.</div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ══ SEPSIS TAB ══ */}
          {tab === 'sepsis' && (
            <div className="full-pane">
              <div className="section-box" style={{borderColor:'rgba(255,107,107,.2)',background:'rgba(255,107,107,.02)'}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontSize:22}}>🦠</span>
                  <div>
                    <div style={{fontFamily:'Playfair Display,serif',fontSize:16,fontWeight:700,color:'var(--coral)'}}>Sepsis Protocol</div>
                    <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:8,color:'rgba(255,107,107,.4)',letterSpacing:'2px',marginTop:2}}>SSC 2021</div>
                  </div>
                </div>
              </div>

              <div className="section-box">
                <div className="mr-lbl">Weight & Fluid</div>
                <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:10}}>
                  <input className="mr-field" type="number" placeholder="Weight kg" value={sepWt} onChange={e => setSepWt(e.target.value)} style={{flex:1}} />
                  <span style={{color:'var(--txt3)',fontFamily:'JetBrains Mono,monospace',fontWeight:600,fontSize:12}}>kg</span>
                </div>
                {parseFloat(sepWt) > 0 && (
                  <div style={{padding:'12px 16px',borderRadius:'var(--rl)',background:'rgba(255,107,107,.04)',border:'1px solid rgba(255,107,107,.15)'}}>
                    <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:8,color:'rgba(255,107,107,.5)',letterSpacing:'2px',marginBottom:3}}>30 ML/KG BOLUS</div>
                    <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:26,fontWeight:800,color:'var(--coral)'}}>{(parseFloat(sepWt)*30).toFixed(0)} mL</div>
                    <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:9,color:'var(--txt4)',marginTop:3}}>30 x {sepWt} kg</div>
                  </div>
                )}
              </div>

              <div className="section-box">
                <div className="mr-lbl">Hour-1 Bundle</div>
                {H1.map((s, i) => {
                  const k = `h1-${i}`, done = sepChecked[k];
                  return (
                    <div key={i} className={`sep-chk ${s.c?'crit':'norm'}${done?' done':''}`} onClick={() => toggleCheck(k)}>
                      <span style={{fontSize:13,fontWeight:700,width:18,textAlign:'center',color:done?'var(--teal)':s.c?'var(--coral)':'var(--txt3)'}}>{done?'✓':s.c?'!':'○'}</span>
                      <span className="stxt" style={{color:done?'var(--txt3)':s.c?'var(--txt)':'var(--txt2)'}}>{s.a}</span>
                    </div>
                  );
                })}
              </div>

              {parseFloat(sepWt) > 0 && (() => {
                const sw = parseFloat(sepWt);
                const ms = [
                  {n:"Vancomycin", v:`${(sw*25).toFixed(0)}–${(sw*30).toFixed(0)} mg`, r:"IV", t:"1-2h"},
                  {n:"Norepinephrine", v:"0.1–0.5 mcg/kg/min", r:"IV drip", t:"1st vasopressor"},
                  {n:"Hydrocortisone", v:"100 mg", r:"IV q8h", t:"Refractory"},
                  {n:"Pip-Tazo", v:"4.5 g", r:"IV q6h", t:"Extended"},
                ];
                return (
                  <div className="section-box">
                    <div className="mr-lbl">Weight-Based Meds</div>
                    {ms.map((m, i) => (
                      <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 12px',background:'var(--bg-up)',border:'1px solid var(--border)',borderRadius:6,marginBottom:3,flexWrap:'wrap',gap:6}}>
                        <div>
                          <div style={{fontSize:12,fontWeight:700,color:'var(--txt)'}}>{m.n}</div>
                          <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:9,color:'var(--txt3)'}}>{m.r} · {m.t}</div>
                        </div>
                        <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:15,fontWeight:800,color:'var(--teal)'}}>{m.v}</div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              <div className="section-box">
                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8}}>
                  <span style={{width:6,height:6,borderRadius:'50%',background:'var(--coral)',display:'inline-block'}} />
                  <span className="mr-lbl" style={{margin:0}}>AI Sepsis Advisor</span>
                </div>
                <input className="mr-field" placeholder="Suspected source..." value={sepQuery} onChange={e => setSepQuery(e.target.value)} onKeyDown={e => e.key==='Enter' && handleSepsis()} style={{marginBottom:8}} />
                <button className="mr-btn-coral" onClick={handleSepsis} disabled={sepLoading || !sepWt}>{sepLoading ? '...' : 'Protocol'}</button>
                {sepResult && (
                  <>
                    <div style={{marginTop:10,padding:'10px 12px',background:'var(--bg-card)',borderRadius:'var(--rl)',border:'1px solid var(--border)',fontSize:12,lineHeight:1.7,color:'var(--txt2)',whiteSpace:'pre-wrap'}}>{sepResult}</div>
                    <div className="ai-disc">AI-generated. Follow institutional protocols.</div>
                  </>
                )}
              </div>

              <div className="section-box">
                <div className="mr-lbl">Reassessment</div>
                {RE.map((s, i) => {
                  const k = `re-${i}`, done = sepChecked[k];
                  return (
                    <div key={i} className={`sep-chk ${s.c?'crit':'norm'}${done?' done':''}`} onClick={() => toggleCheck(k)}>
                      <span style={{fontSize:13,fontWeight:700,width:18,textAlign:'center',color:done?'var(--teal)':s.c?'var(--coral)':'var(--txt3)'}}>{done?'✓':s.c?'!':'○'}</span>
                      <span className="stxt" style={{color:done?'var(--txt3)':s.c?'var(--txt)':'var(--txt2)'}}>{s.a}</span>
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