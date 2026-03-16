import { useState, useMemo } from "react";
import { DRUG_DB as MEDICATIONS } from "../components/drugreference/drugData";
import SaveCaseModal from "../components/medicationreference/SaveCaseModal";
import SavedCasesPanel from "../components/medicationreference/SavedCasesPanel";
import WeightWidget from "../components/medicationreference/WeightWidget";
import AIDoseAnalyzer from "../components/medicationreference/AIDoseAnalyzer";
import DrugInteractionChecker from "../components/medicationreference/DrugInteractionChecker";

const CATEGORIES = [
  { id:"all", label:"All", icon:"💊", color:"#00c4a0" },
  { id:"anticoag", label:"Anticoagulants", icon:"🩸", color:"#ef4444" },
  { id:"cardiac", label:"Cardiac", icon:"🫀", color:"#f97316" },
  { id:"psych", label:"Psychiatric", icon:"🧠", color:"#8b5cf6" },
  { id:"analgesic", label:"Analgesics", icon:"🩹", color:"#fb7185" },
  { id:"abx", label:"Antibiotics", icon:"🦠", color:"#22c55e" },
  { id:"gi", label:"GI", icon:"💊", color:"#f59e0b" },
  { id:"other", label:"Other", icon:"⚗️", color:"#06b6d4" },
];
const CAT_COLOR = Object.fromEntries(CATEGORIES.map(c=>[c.id,c.color]));

const SEPSIS = {
  criteria:[
    { id:"sirs", label:"SIRS Criteria", badge:"≥2 Required", color:"#f59e0b", params:[{name:"Temperature",value:">38.3°C or <36°C"},{name:"Heart Rate",value:">90 bpm"},{name:"Respiratory Rate",value:">20/min or PaCO₂ <32"},{name:"WBC",value:">12k or <4k or >10% bands"}]},
    { id:"sepsis3", label:"Sepsis-3", badge:"SOFA ≥2", color:"#ef4444", desc:"Life-threatening organ dysfunction from dysregulated host response to infection", params:[{name:"SOFA Score",value:"≥2 from baseline"},{name:"qSOFA (screening)",value:"RR≥22 + AMS + SBP≤100"},{name:"Lactate",value:"Obtain for all suspected sepsis"}]},
    { id:"shock", label:"Septic Shock", badge:"MAP<65 + Lactate>2", color:"#b91c1c", desc:"Vasopressor requirement for MAP≥65 AND lactate >2 mmol/L despite fluid resuscitation", params:[{name:"MAP",value:"<65 mmHg despite resuscitation"},{name:"Lactate",value:">2 mmol/L (>4 = high risk)"},{name:"Vasopressor",value:"Required after adequate crystalloid"},{name:"Mortality",value:">40% in-hospital"}]},
    { id:"phoenix", label:"PHOENIX Peds 2024", badge:"Score≥2 + Infection", color:"#8b5cf6", desc:"PHOENIX Score ≥2 with suspected/confirmed infection (JAMA 2024, Schlapbach et al.)", params:[{name:"Respiratory",value:"SpO₂/FiO₂ <292=1pt; <220 on support=2pts"},{name:"Cardiovascular",value:"Vasoactive, lactate ≥5, pH <7.15"},{name:"Coagulation",value:"INR≥1.3, D-dimer≥2, Plt<100k"},{name:"Neurological",value:"GCS≤10 or AVPU P/U"}]},
  ],
  bundle:[
    {step:1,action:"Measure lactate level",detail:"Repeat at 2 hr if >2 mmol/L; target ≥10% clearance",priority:"high"},
    {step:2,action:"Blood cultures ×2 before antibiotics",detail:"Do NOT delay antibiotics >45 min waiting for cultures",priority:"high"},
    {step:3,action:"Broad-spectrum antibiotics",detail:"Within 1 hour of sepsis/septic shock recognition",priority:"critical"},
    {step:4,action:"30 mL/kg crystalloid (LR preferred)",detail:"For septic shock or lactate ≥4 mmol/L; reassess after each 500 mL bolus (PLR, PPV)",priority:"critical"},
    {step:5,action:"Vasopressors if MAP <65 mmHg",detail:"Norepinephrine 1st line; initiate during/after fluids if hypotension persists",priority:"critical"},
  ],
  fluids:{
    adult:{initial:"30 mL/kg LR or NS IV wide open",preferred:"Lactated Ringer's — SMART/SALT-ED: reduced AKI and 30-day mortality vs NS",vasopressor:"MAP <65 despite 30 mL/kg → initiate norepinephrine",caution:"Avoid fluid overload; reassess after each bolus; early vasopressors if poor response",list:[
      {name:"Lactated Ringer's (LR)",dose:"30 mL/kg",rate:"Wide open × 1 hr then reassess",note:"1st-line; SMART trial preferred"},
      {name:"Normal Saline (0.9% NS)",dose:"30 mL/kg",rate:"Wide open × 1 hr",note:"Risk hyperchloremic acidosis large volumes"},
      {name:"Albumin 5%",dose:"200–300 mL bolus",rate:"30–60 min",note:"Adjunct if crystalloid >4 L (ALBIOS trial)"},
    ]},
    pediatric:{initial:"10–20 mL/kg over 5–20 min; reassess after each",max:"40–60 mL/kg first hour (individualize)",caution:"FEAST trial: aggressive bolus ↑ mortality — reassess frequently",mapTargets:[
      {age:"0–1 month",sbp:60,map:40},{age:"1–12 months",sbp:70,map:50},{age:"1–5 years",sbp:80,map:55},
      {age:"6–12 years",sbp:90,map:60},{age:">12 years",sbp:100,map:65},
    ]},
  },
  antibiotics:{
    empiric:[
      {severity:"Moderate Sepsis — Community-Acquired",dot:"#f59e0b",primary:"Ceftriaxone 2 g IV q24h",addition:"+ Azithromycin 500 mg IV if pneumonia suspected",notes:"Add metronidazole for abdominal source; add vancomycin if MRSA risk"},
      {severity:"Severe Sepsis / Septic Shock",dot:"#ef4444",primary:"Piperacillin-Tazobactam 4.5 g IV q6–8h (extended infusion preferred)",addition:"+ Vancomycin 25–30 mg/kg IV load if MRSA risk",notes:"Add antifungal if immunocompromised; de-escalate at 48–72 hr with cultures"},
      {severity:"High ESBL Risk / HAP / Recent Antibiotics",dot:"#b91c1c",primary:"Meropenem 1–2 g IV q8h (extended infusion 3 hr preferred)",addition:"+ Vancomycin if MRSA risk",notes:"Reserve carbapenem for true ESBL/MDR; stewardship consultation; reassess 48–72 hr"},
      {severity:"Pseudomonas / Carbapenem-Resistant Risk",dot:"#7c3aed",primary:"Ceftazidime-Avibactam 2.5 g IV q8h (extended 3 hr infusion)",addition:"+ Colistin or Polymyxin B if pan-resistant; consult ID",notes:"For CRE or CRAB; Imipenem-Cilastatin-Relebactam as alternative; ID consult mandatory"},
      {severity:"Healthcare-Associated (HAP/VAP)",dot:"#0891b2",primary:"Cefepime 2 g IV q8h OR Pip-Tazo 4.5 g IV q6h",addition:"+ Vancomycin OR Linezolid 600 mg IV q12h (MRSA coverage)",notes:"Add antipseudomonal if ICU or structural lung disease; de-escalate at 48–72 hr"},
      {severity:"Immunocompromised / Febrile Neutropenia — High Risk",dot:"#059669",primary:"Meropenem 2 g IV q8h (extended infusion)",addition:"+ Micafungin 100 mg IV q24h if fungal risk; + Vancomycin if catheter suspected",notes:"ANC <500; MASCC risk score ≥21 = low risk; initiate within 60 min of triage"},
    ],
    sources:[
      {id:"pulm", source:"Pneumonia (CAP)",icon:"🫁",primary:"Ceftriaxone 1–2 g IV + Azithromycin 500 mg IV",alt:"Levofloxacin 750 mg IV (PCN allergy or atypical)",duration:"5–7 d (CAP); 7–14 d (HCAP)"},
      {id:"pulm", source:"Pneumonia (HAP/VAP)",icon:"🫁",primary:"Cefepime 2 g IV q8h + Vancomycin 15–20 mg/kg q8–12h",alt:"Meropenem + Vancomycin if MDR risk",duration:"7–14 d; de-escalate based on BAL/cultures"},
      {id:"gu", source:"Urosepsis / Pyelonephritis",icon:"🫘",primary:"Ceftriaxone 1–2 g IV q24h",alt:"Pip-Tazo if healthcare-associated or recent UTI",duration:"7–14 days"},
      {id:"gu", source:"Complicated UTI / CAUTI",icon:"🫘",primary:"Cefepime 2 g IV q8h OR Pip-Tazo 4.5 g IV q6h",alt:"Ertapenem 1 g IV q24h if ESBL risk",duration:"7–10 days; 14 d if bacteremia"},
      {id:"gi", source:"Intra-abdominal",icon:"🫃",primary:"Pip-Tazo 4.5 g IV q6h + urgent surgical/IR source control",alt:"Meropenem + Metronidazole (PCN allergy or HAI)",duration:"4–7 d if adequate source control"},
      {id:"gi", source:"Spontaneous Bacterial Peritonitis (SBP)",icon:"🫃",primary:"Cefotaxime 2 g IV q8h OR Ceftriaxone 1–2 g IV q24h",alt:"Pip-Tazo 4.5 g IV q6h if hospital-acquired",duration:"5–7 days; Albumin 1.5 g/kg day 1, 1 g/kg day 3"},
      {id:"ssti", source:"SSTI / Necrotizing Fasciitis",icon:"🩹",primary:"Vancomycin 25–30 mg/kg + Pip-Tazo 4.5 g IV q6h (NF)",alt:"Daptomycin 6–10 mg/kg IV (confirmed MRSA)",duration:"NF: URGENT debridement within hours; until clinically improved"},
      {id:"ssti", source:"Cellulitis / Non-purulent SSTI",icon:"🩹",primary:"Cefazolin 2 g IV q8h OR Ceftriaxone 1 g IV q24h",alt:"Vancomycin if MRSA risk or failure of β-lactam",duration:"5–14 days; oral step-down when improving"},
      {id:"neuro", source:"Bacterial Meningitis",icon:"🧠",primary:"Ceftriaxone 2 g IV q12h + Vancomycin 15 mg/kg q8–12h + Dex 0.15 mg/kg q6h × 4d",alt:"+ Ampicillin 2 g IV q4h if Listeria risk (>50 yr, immunocompromised, pregnancy)",duration:"7–21 days depending on organism"},
      {id:"neuro", source:"Brain Abscess / CNS Infection",icon:"🧠",primary:"Ceftriaxone 2 g IV q12h + Metronidazole 500 mg IV q8h",alt:"+ Vancomycin if post-neurosurgery or hematogenous spread",duration:"6–8 weeks; neurosurgery consultation"},
      {id:"cardio", source:"Infective Endocarditis — Empiric",icon:"❤️",primary:"Vancomycin 25–30 mg/kg IV load + Ceftriaxone 2 g IV q24h",alt:"Daptomycin 8–10 mg/kg IV q24h (right-sided or IVDU)",duration:"4–6 weeks; cardiology + ID consultation mandatory"},
      {id:"cardio", source:"Bacteremia / Line Sepsis",icon:"❤️",primary:"Vancomycin 25–30 mg/kg IV (MRSA coverage) + remove/replace source",alt:"Daptomycin 6–10 mg/kg IV if VRE or Vanc failure",duration:"14 d uncomplicated; 4–6 wk if endocarditis/metastatic"},
      {id:"hem", source:"Febrile Neutropenia",icon:"🩸",primary:"Pip-Tazo 4.5 g IV q6h OR Cefepime 2 g IV q8h",alt:"Meropenem if high-risk Pseudomonas; + Vancomycin if catheter-related",duration:"Until ANC >500 and afebrile ≥48 hr"},
      {id:"bone", source:"Septic Arthritis / Osteomyelitis",icon:"🦴",primary:"Vancomycin 25–30 mg/kg IV + Ceftriaxone 2 g IV q24h",alt:"Daptomycin 6–8 mg/kg IV (MRSA); oral step-down if susceptible",duration:"Joint: 2–4 wk; Bone: 4–6 wk minimum"},
    ],
    pediatric:[
      {age:"Neonate (<1 mo)",primary:"Ampicillin 50 mg/kg IV q8h + Gentamicin 4–5 mg/kg IV q24h",mod:"+ Cefotaxime if meningitis; avoid ceftriaxone in neonates",notes:"GBS, E. coli, Listeria; add Acyclovir 20 mg/kg q8h if HSV suspected"},
      {age:"1–3 months",primary:"Ampicillin 50 mg/kg IV q6h + Cefotaxime 50 mg/kg IV q6h",mod:"Ceftriaxone acceptable if >28 days without hyperbilirubinemia",notes:"Consider viral; Acyclovir if encephalitis suspected"},
      {age:"3 mo – 5 years",primary:"Ceftriaxone 50–100 mg/kg IV q24h",mod:"Meningitis: + Vancomycin 15 mg/kg q6h + Dex 0.15 mg/kg q6h × 4d",notes:"Dexamethasone reduces hearing loss; Vancomycin for PCN-resistant S. pneumoniae"},
      {age:">5 years",primary:"Ceftriaxone 50–100 mg/kg IV q24h (max 2 g)",mod:"Septic shock: + Pip-Tazo 100 mg/kg q8h + Vancomycin 15 mg/kg q6h",notes:"Cultures before antibiotics without delaying >1 hr"},
    ],
  },
};

function estimateWeight(mo){if(mo<3)return 3.5+mo*0.9;if(mo<12)return 6+(mo-3)*0.5;const y=mo/12;if(y<=2)return 10+(y-1)*2.5;return y*3+7;}
function getBroselow(w){if(w<5)return{zone:"Grey",hex:"#9ca3af"};if(w<7)return{zone:"Pink",hex:"#ec4899"};if(w<9)return{zone:"Red",hex:"#ef4444"};if(w<11)return{zone:"Purple",hex:"#8b5cf6"};if(w<14)return{zone:"Yellow",hex:"#eab308"};if(w<18)return{zone:"White",hex:"#e2e8f0"};if(w<23)return{zone:"Blue",hex:"#3b82f6"};if(w<29)return{zone:"Orange",hex:"#f97316"};if(w<36)return{zone:"Green",hex:"#22c55e"};return{zone:"Adult",hex:"#6b7280"};}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg:#080e1a;--nav:#060b15;--c1:#0d1628;--c2:#111e33;--c3:#162240;
  --br:rgba(0,196,160,0.12);--br2:rgba(0,196,160,0.22);
  --teal:#00c4a0;--teal2:#00e5bb;--tdim:rgba(0,196,160,0.08);
  --tx:#e2e8f0;--tx2:#94a3b8;--tx3:#4a6080;
  --red:#ef4444;--yel:#f59e0b;--grn:#22c55e;--pur:#8b5cf6;--blu:#3b82f6;
  --r:10px;--r2:14px;--f:'Inter',sans-serif;
}
body{font-family:var(--f);background:var(--bg);color:var(--tx);min-height:100vh;}
.lay{display:flex;min-height:100vh;}
.sb{width:56px;background:var(--nav);border-right:1px solid var(--br);display:flex;flex-direction:column;align-items:center;padding:12px 0;gap:4px;position:fixed;left:0;top:0;bottom:0;z-index:200;}
.sb-logo{width:36px;height:36px;border-radius:10px;background:var(--teal);display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:800;color:#080e1a;margin-bottom:12px;}
.sbi{width:40px;height:40px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;cursor:pointer;transition:background .15s;color:var(--tx3);position:relative;}
.sbi:hover{background:var(--tdim);color:var(--teal);}
.sbi.on{background:var(--tdim);color:var(--teal);}
.sbi.on::before{content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);width:3px;height:24px;background:var(--teal);border-radius:0 3px 3px 0;}
.sb-bot{margin-top:auto;display:flex;flex-direction:column;align-items:center;gap:4px;}
.topbar{position:fixed;top:0;left:56px;right:0;height:52px;z-index:100;background:rgba(8,14,26,0.92);backdrop-filter:blur(12px);border-bottom:1px solid var(--br);display:flex;align-items:center;justify-content:space-between;padding:0 20px;}
.tbl{display:flex;align-items:center;gap:8px;}
.tb-title{font-size:15px;font-weight:600;}
.tb-sep{color:var(--tx3);font-size:12px;}
.tb-bc{font-size:12px;color:var(--tx3);}
.tbr{display:flex;align-items:center;gap:8px;}
.tb-ai{display:flex;align-items:center;gap:6px;padding:5px 10px;border-radius:6px;font-size:11px;font-weight:600;letter-spacing:.04em;background:rgba(0,196,160,.12);border:1px solid rgba(0,196,160,.3);color:var(--teal);}
.tb-dot{width:7px;height:7px;border-radius:50%;background:var(--teal);animation:pulse 2s infinite;}
@keyframes pulse{0%,100%{opacity:1;}50%{opacity:.3;}}
.tb-btn{padding:6px 14px;border-radius:7px;font-size:12px;font-weight:500;cursor:pointer;border:1px solid var(--br2);background:transparent;color:var(--tx2);transition:all .15s;font-family:var(--f);}
.tb-btn:hover{background:var(--tdim);color:var(--teal);}
.tb-pri{padding:6px 16px;border-radius:7px;font-size:12px;font-weight:600;cursor:pointer;background:var(--teal);border:none;color:#080e1a;font-family:var(--f);transition:opacity .15s;}
.tb-pri:hover{opacity:.85;}
.main{margin-left:56px;margin-top:52px;padding:18px;}
.sh{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;}
.sh-l{display:flex;align-items:center;gap:10px;}
.sh-ico{width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;background:var(--tdim);}
.sh-ttl{font-size:11px;font-weight:600;letter-spacing:.1em;color:var(--tx2);text-transform:uppercase;}
.sh-m{font-size:11px;color:var(--tx3);}
.ntabs{display:flex;gap:2px;margin-bottom:16px;}
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
.l1{background:rgba(0,196,160,.1);color:var(--teal);border:1px solid rgba(0,196,160,.25);}
.l2{background:rgba(245,158,11,.1);color:var(--yel);border:1px solid rgba(245,158,11,.25);}
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
.wbar{display:flex;align-items:center;gap:18px;padding:11px 15px;background:rgba(0,196,160,.05);border:1px solid rgba(0,196,160,.15);border-radius:var(--r);margin-bottom:13px;}
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
.cc{background:var(--c1);border-radius:var(--r2);overflow:hidden;border:1px solid var(--br);}
.cct{padding:10px 13px;}
.ccb{font-size:9px;font-weight:700;letter-spacing:.08em;padding:2px 7px;border-radius:3px;display:inline-block;margin-bottom:5px;}
.ccl{font-size:12px;font-weight:700;}
.ccd{font-size:11px;color:var(--tx2);margin-top:3px;line-height:1.4;}
.ccp{border-top:1px solid var(--br);}
.cprow{display:flex;justify-content:space-between;gap:8px;padding:5px 13px;border-bottom:1px solid var(--br);font-size:11px;}
.cprow:last-child{border-bottom:none;}
.cpn{color:var(--tx2);flex-shrink:0;}
.cpv{color:var(--tx);text-align:right;font-family:monospace;font-size:10px;}
.blist{display:flex;flex-direction:column;gap:6px;}
.bstep{display:flex;gap:11px;align-items:flex-start;padding:9px 13px;background:var(--c1);border:1px solid var(--br);border-radius:var(--r);border-left:3px solid transparent;}
.bstep.critical{border-left-color:var(--red);}
.bstep.high{border-left-color:var(--yel);}
.snum{width:23px;height:23px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;font-family:monospace;}
.critical .snum{background:rgba(239,68,68,.12);color:var(--red);}
.high .snum{background:rgba(245,158,11,.12);color:var(--yel);}
.sact{font-size:13px;font-weight:600;}
.sdet{font-size:11px;color:var(--tx2);margin-top:2px;line-height:1.4;}
.fgrid{display:grid;grid-template-columns:1fr 1fr;gap:13px;margin-bottom:18px;}
.fn{font-size:12px;font-weight:600;color:var(--teal);font-family:monospace;}
.fd{font-size:11px;color:var(--tx2);margin-top:2px;}
.ft{width:100%;border-collapse:collapse;}
.ft th{font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--tx3);text-align:left;padding:0 8px 6px;}
.ft td{padding:6px 8px;border-top:1px solid var(--br);font-size:11px;vertical-align:top;}
.mtbl{width:100%;border-collapse:collapse;}
.mtbl th{font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--tx3);text-align:left;padding:0 10px 5px;}
.mtbl td{padding:5px 10px;border-top:1px solid var(--br);font-size:11px;}
.arow{background:var(--c1);border:1px solid var(--br);border-radius:var(--r);overflow:hidden;margin-bottom:6px;}
.asev{font-size:11px;font-weight:700;padding:8px 13px;background:var(--c2);border-bottom:1px solid var(--br);display:flex;align-items:center;gap:8px;}
.abdy{display:grid;grid-template-columns:1fr 1fr 1fr;gap:13px;padding:11px 13px;}
.al{font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--tx3);margin-bottom:4px;}
.ad{font-size:12px;font-family:monospace;color:var(--grn);font-weight:600;line-height:1.4;}
.aa{font-size:11px;color:var(--tx2);line-height:1.4;}
.an{font-size:11px;color:var(--tx3);line-height:1.4;}
.stabs{display:flex;gap:6px;margin-bottom:13px;}
.stab{padding:5px 13px;border-radius:6px;font-size:11px;font-weight:500;cursor:pointer;border:1px solid var(--br);background:var(--c1);color:var(--tx2);transition:all .15s;font-family:var(--f);}
.stab:hover{border-color:var(--br2);color:var(--tx);}
.stab.on{background:var(--tdim);border-color:var(--br2);color:var(--teal);}
.ibox{background:rgba(0,196,160,.05);border:1px solid rgba(0,196,160,.15);border-radius:var(--r);padding:9px 12px;font-size:11px;color:var(--tx2);line-height:1.6;margin-bottom:12px;}
.ibox strong{color:var(--teal);}
.empty{text-align:center;padding:44px;color:var(--tx3);}
.empty-i{font-size:34px;margin-bottom:9px;}
.empty-t{font-size:13px;}
@media(max-width:1100px){.cgrid{grid-template-columns:1fr 1fr;}.dgrid{grid-template-columns:1fr 1fr;}.abdy{grid-template-columns:1fr;}.cinps{grid-template-columns:1fr 1fr;}}
@media(max-width:768px){.main{padding:10px;}.cgrid,.fgrid,.cinps{grid-template-columns:1fr;}.dgrid{grid-template-columns:1fr;}}
`;

export default function MedicationReferencePage() {
  const [tab, setTab] = useState("medications");
  const [cat, setCat] = useState("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [pedAge, setPedAge] = useState("");
  const [pedUnit, setPedUnit] = useState("months");
  const [pedWt, setPedWt] = useState("");
  const [pedCat, setPedCat] = useState("all");
  const [sepTab, setSepTab] = useState("criteria");
  const [abxTab, setAbxTab] = useState("empiric");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [complaint, setComplaint] = useState("");
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSavedCases, setShowSavedCases] = useState(false);
  const [savedCasesKey, setSavedCasesKey] = useState(0);
  // Global weight widget for medications tab
  const [globalWeight, setGlobalWeight] = useState(null);
  const [globalWeightUnit, setGlobalWeightUnit] = useState("kg");
  // Drug interaction checker
  const [selectedMeds, setSelectedMeds] = useState([]);

  const weight = useMemo(()=>{
    if(pedWt) return parseFloat(pedWt)||null;
    if(!pedAge) return null;
    const mo = pedUnit==="years" ? parseFloat(pedAge)*12 : parseFloat(pedAge);
    if(isNaN(mo)||mo<0) return null;
    return Math.round(estimateWeight(mo)*10)/10;
  },[pedAge,pedUnit,pedWt]);
  const bz = weight ? getBroselow(weight) : null;

  const filtered = useMemo(()=> MEDICATIONS.filter(m=>{
    if(cat!=="all"&&m.category!==cat) return false;
    const q=search.toLowerCase();
    if(!q) return true;
    const indicStr = typeof m.indications === "string" ? m.indications : "";
    return m.name.toLowerCase().includes(q)||indicStr.toLowerCase().includes(q)||m.drugClass.toLowerCase().includes(q)||(m.brand && m.brand.toLowerCase().includes(q));
  }),[cat,search]);

  const pedResults = useMemo(()=>{
    if(!weight) return [];
    return MEDICATIONS.filter(m=>(pedCat==="all"||m.category===pedCat)&&m.ped?.mgkg).map(m=>{
      const raw=weight*m.ped.mgkg;
      const capped=m.ped.max!==null&&raw>m.ped.max;
      const dose=capped?m.ped.max:Math.round(raw*10)/10;
      return{...m,calcDose:`${dose} ${m.ped.unit}`,capped};
    });
  },[weight,pedCat]);

  const handleAI = async()=>{
    if(!complaint.trim()) return;
    setAiLoading(true); setAiText("");
    try{
      const { base44 } = await import("@/api/base44Client");
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an ER physician AI following ACEP guidelines. Given this presenting complaint, provide concise clinical medication recommendations.\n\nPresenting Complaint: ${complaint}\n\nProvide:\n1. Immediate medications (with ER doses)\n2. Key monitoring parameters\n3. Critical contraindications to assess\n4. Disposition considerations\n\nBe concise and clinical.`
      });
      setAiText(typeof result === "string" ? result : JSON.stringify(result));
    }catch(e){setAiText("⚠ Unable to reach AI service.");}
    finally{setAiLoading(false);}
  };

  return(
    <>
      <style>{CSS}</style>
      {showSaveModal && weight && (
        <SaveCaseModal
          weight={weight}
          pedAge={pedAge}
          pedUnit={pedUnit}
          pedWt={pedWt}
          pedCat={pedCat}
          bz={bz}
          onClose={()=>setShowSaveModal(false)}
          onSaved={()=>setSavedCasesKey(k=>k+1)}
        />
      )}
      <div className="lay">
        <div className="sb">
          <div className="sb-logo">Rx</div>
          {[["medications","💊"],["calculator","⚖️"],["sepsis","🔴"]].map(([id,ic])=>(
            <div key={id} className={`sbi ${tab===id?"on":""}`} onClick={()=>setTab(id)} title={id}>{ic}</div>
          ))}
          <div className={`sbi ${showSavedCases?"on":""}`} onClick={()=>setShowSavedCases(!showSavedCases)} title="Saved Cases">📋</div>
          <div className="sb-bot">
            <div className="sbi" title="Settings">⚙️</div>
            <div style={{width:32,height:32,borderRadius:"50%",background:"#162240",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"var(--teal)",cursor:"pointer"}}>ER</div>
          </div>
        </div>

        <div className="topbar">
          <div className="tbl">
            <span className="tb-title">Medication Reference</span>
            <span className="tb-sep">/</span>
            <span className="tb-bc">ClinAI · Emergency Department</span>
          </div>
          <div className="tbr">
            <div className="tb-ai"><span className="tb-dot"/><span>AI ACTIVE</span></div>
            <button className="tb-btn">Export Protocol</button>
            <button className="tb-pri">Order Set →</button>
          </div>
        </div>

        {/* Saved Cases Panel */}
        {showSavedCases && (
          <div style={{
            position:"fixed",top:0,left:56,width:280,bottom:0,zIndex:150,marginTop:52,
            background:"#060b15",borderRight:"1px solid rgba(0,196,160,0.18)",
            display:"flex",flexDirection:"column"
          }}>
            <div style={{padding:"14px 16px",borderBottom:"1px solid rgba(0,196,160,0.12)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div>
                <div style={{fontSize:11,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"#94a3b8"}}>SAVED CASES</div>
                <div style={{fontSize:10,color:"#4a6080",marginTop:2}}>Ped calculator scenarios</div>
              </div>
              <button onClick={()=>setShowSavedCases(false)} style={{background:"transparent",border:"none",color:"#4a6080",fontSize:16,cursor:"pointer",lineHeight:1}}>✕</button>
            </div>
            <SavedCasesPanel
              key={savedCasesKey}
              onLoadCase={(c) => {
                setTab("calculator");
                if (c.patient_age) {
                  const parts = c.patient_age.split(" ");
                  if (parts[0]) setPedAge(parts[0]);
                  if (parts[1]) setPedUnit(parts[1]);
                }
                if (c.weight_source === "measured") setPedWt(String(c.weight_kg));
                if (c.category_filter) setPedCat(c.category_filter);
                setShowSavedCases(false);
              }}
            />
          </div>
        )}

        <div className="main" style={showSavedCases ? {marginLeft: 336} : {}}>
          {/* AI Panel */}
          <div className="aip">
            <div className="aih">
              <span style={{fontSize:15}}>⚡</span>
              <span className="aitag">AI CLINICAL INSIGHT</span>
              <span className="aim">Evidence-based · Real-time</span>
            </div>
            <div className="air">
              <input className="aii" placeholder="Enter presenting complaint for AI medication recommendations (e.g. 'septic shock, HR 125, temp 39.2°C, BP 82/54, lactate 4.8')..." value={complaint} onChange={e=>setComplaint(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleAI()}/>
              <button className="aib" onClick={handleAI} disabled={aiLoading}>{aiLoading?"Consulting...":"Analyze →"}</button>
            </div>
            {aiText&&<div className="airesp">{aiText}</div>}
          </div>

          {/* Main Tabs */}
          <div className="ntabs">
            {[["medications","💊 MEDICATIONS"],["calculator","⚖️ PED CALCULATOR"],["sepsis","🔴 SEPSIS PROTOCOL"]].map(([id,label])=>(
              <button key={id} className={`ntab ${tab===id?"on":""}`} onClick={()=>setTab(id)}>{label}</button>
            ))}
          </div>

          {/* MEDICATIONS */}
          {tab==="medications"&&(<>
            <div className="sh">
              <div className="sh-l"><div className="sh-ico">💊</div><span className="sh-ttl">ER MEDICATION REFERENCE</span></div>
              <span className="sh-m">ACEP Guidelines · {filtered.length} medications {selectedMeds.length > 0 && `· ${selectedMeds.length} selected`}</span>
            </div>
            <div style={{display:"flex",gap:10,marginBottom:13,alignItems:"center",flexWrap:"wrap"}}>
              <div className="sw" style={{flex:1,minWidth:200}}>
                <span style={{color:"var(--tx3)",fontSize:14}}>🔍</span>
                <input placeholder="Search medications, indications, drug codes..." value={search} onChange={e=>setSearch(e.target.value)}/>
                {search&&<span onClick={()=>setSearch("")} style={{cursor:"pointer",color:"var(--tx3)",fontSize:14}}>✕</span>}
              </div>
              <WeightWidget
                weight={globalWeight}
                weightUnit={globalWeightUnit}
                onWeightChange={setGlobalWeight}
                onUnitChange={setGlobalWeightUnit}
                onClear={()=>{ setGlobalWeight(null); }}
              />
            </div>
            <div className="fps">
              {CATEGORIES.map(c=>(
                <div key={c.id} className={`fp ${cat===c.id?"on":""}`} style={cat===c.id?{background:c.color,color:"#080e1a"}:{}} onClick={()=>setCat(c.id)}>
                  {c.icon} {c.label}
                </div>
              ))}
            </div>
            <DrugInteractionChecker selectedMeds={selectedMeds} medications={MEDICATIONS} />
            {selectedMeds.length > 0 && (
              <div style={{marginBottom:14}}>
                <button onClick={()=>setSelectedMeds([])} style={{
                  fontSize:11,fontWeight:700,padding:"6px 14px",borderRadius:7,
                  background:"transparent",border:"1px solid rgba(0,196,160,0.3)",
                  color:"var(--teal)",cursor:"pointer",fontFamily:"inherit",transition:"all .15s"
                }}>
                  Clear Selection ({selectedMeds.length})
                </button>
              </div>
            )}
            <div className="card">
              <div className="chdr">
                <div className="sh-l"><span className="sh-ttl">CLINICAL RECOMMENDATIONS</span></div>
                <span className="sh-m">Evidence-based · Tap row for full details</span>
              </div>
              <div style={{padding:"10px 13px"}}>
                {filtered.length===0?(
                  <div className="empty"><div className="empty-i">🔍</div><div className="empty-t">No medications match your search</div></div>
                ):(
                  <div className="mlist">{filtered.map(med=><MedRow key={med.id} med={med} isExpanded={expanded===med.id} onToggle={()=>setExpanded(expanded===med.id?null:med.id)} weightKg={globalWeight ? (globalWeightUnit==="lbs" ? Math.round(globalWeight/2.205*10)/10 : globalWeight) : null} isSelected={selectedMeds.some(m=>m.id===med.id)} onSelect={(checked)=>{if(checked){setSelectedMeds([...selectedMeds,med]);}else{setSelectedMeds(selectedMeds.filter(m=>m.id!==med.id));}}}/>)}</div>
                )}
              </div>
            </div>
          </>)}

          {/* PEDIATRIC CALCULATOR */}
          {tab==="calculator"&&(<>
            <div className="sh">
              <div className="sh-l"><div className="sh-ico">⚖️</div><span className="sh-ttl">PEDIATRIC MEDICATION CALCULATOR</span></div>
              <span className="sh-m">Weight-based dosing · Broselow · Max dose capping</span>
            </div>
            <div className="card" style={{marginBottom:14}}>
              <div className="chdr"><span className="sh-ttl">PATIENT PARAMETERS</span><span className="sh-m">Enter age or override with actual weight</span></div>
              <div className="cbdy">
                <div className="cinps">
                  <div><label className="ilbl">Age</label><div style={{display:"flex",gap:6}}><input className="inp" type="number" min="0" placeholder="0" value={pedAge} onChange={e=>setPedAge(e.target.value)} style={{flex:1}}/><select className="sel" value={pedUnit} onChange={e=>setPedUnit(e.target.value)} style={{width:90}}><option value="months">months</option><option value="years">years</option></select></div></div>
                  <div><label className="ilbl">Weight (kg) — optional override</label><input className="inp" type="number" min="0" step="0.1" placeholder="Auto-estimated from age" value={pedWt} onChange={e=>setPedWt(e.target.value)}/></div>
                  <div><label className="ilbl">Filter Drug Category</label><select className="sel" value={pedCat} onChange={e=>setPedCat(e.target.value)}><option value="all">All Categories</option>{CATEGORIES.filter(c=>c.id!=="all").map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select></div>
                </div>
                {weight&&bz&&(<>
                  <div className="wbar">
                    <div><div style={{fontSize:10,color:"var(--tx3)",letterSpacing:".08em",marginBottom:2}}>ESTIMATED WEIGHT</div><div style={{display:"flex",alignItems:"baseline",gap:5}}><span className="wv">{weight}</span><span className="wu">kg</span>{!pedWt&&<span className="west">(age-estimated)</span>}</div></div>
                    <div style={{display:"flex",gap:8,marginLeft:16}}>
                      <div className="cstat"><div className="csv" style={{color:"var(--teal)"}}>{weight<3?"2.5":weight<5?"3.0":(Math.round((weight/4+4)*2)/2).toFixed(1)} mm</div><div className="csl">ET TUBE</div></div>
                      <div className="cstat"><div className="csv" style={{color:"var(--yel)"}}>{Math.min(weight*2,120)} J</div><div className="csl">DEFIB 2 J/kg</div></div>
                      <div className="cstat"><div className="csv" style={{color:"var(--pur)"}}>{(weight*0.01).toFixed(2)} mg</div><div className="csl">EPI ARREST</div></div>
                    </div>
                    <div className="bzb" style={{background:bz.hex+"20",color:bz.hex,border:`1px solid ${bz.hex}40`}}>● {bz.zone}</div>
                    <button onClick={()=>setShowSaveModal(true)} style={{
                      padding:"5px 12px",borderRadius:7,fontSize:11,fontWeight:700,cursor:"pointer",
                      background:"rgba(0,196,160,0.12)",border:"1px solid rgba(0,196,160,0.3)",
                      color:"#00c4a0",fontFamily:"inherit",whiteSpace:"nowrap"
                    }}>💾 Save Case</button>
                  </div>
                  <div className="card" style={{background:"var(--c2)"}}>
                    <div className="chdr"><span className="sh-ttl">CALCULATED DOSES — {weight} kg PATIENT</span><span className="sh-m">{pedResults.length} medications</span></div>
                    <div style={{padding:"0 0 8px"}}>
                      <table className="rtbl">
                        <thead><tr><th>MEDICATION</th><th>CATEGORY</th><th>CALCULATED DOSE</th><th>ROUTE</th><th>NOTES</th></tr></thead>
                        <tbody>{pedResults.map(m=>(
                          <tr key={m.id}>
                            <td><div style={{fontWeight:600,fontSize:12}}>{m.name}</div><div style={{fontSize:10,color:"var(--tx3)"}}>{m.code}</div></td>
                            <td><span style={{fontSize:10,padding:"2px 6px",borderRadius:4,background:`${CAT_COLOR[m.category]}15`,color:CAT_COLOR[m.category],border:`1px solid ${CAT_COLOR[m.category]}30`}}>{m.category}</span></td>
                            <td><span className={`rdose ${m.capped?"rcap":""}`}>{m.calcDose}</span>{m.capped&&<span className="rmax"> MAX</span>}</td>
                            <td><span style={{fontFamily:"monospace",fontSize:11,color:"var(--tx2)"}}>{m.ped.route}</span></td>
                            <td style={{fontSize:11,color:"var(--tx2)"}}>{m.ped.notes}</td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  </div>
                </>)}
                {!weight&&<div className="empty"><div className="empty-i">⚖️</div><div className="empty-t">Enter patient age or weight to calculate doses</div></div>}
              </div>
            </div>
          </>)}

          {/* SEPSIS PROTOCOL */}
          {tab==="sepsis"&&(<>
            <div className="sh">
              <div className="sh-l"><div className="sh-ico" style={{background:"rgba(239,68,68,.1)"}}>🔴</div><span className="sh-ttl">SEPSIS PROTOCOL</span></div>
              <span className="sh-m">SSC 2018 · PHOENIX 2024 · Sepsis-3</span>
            </div>
            <div className="ntabs">
              {[["criteria","📊 Criteria"],["bundle","⏱ Hour-1 Bundle"],["fluids","💧 Fluids"],["antibiotics","💉 Antibiotics"]].map(([id,label])=>(
                <button key={id} className={`ntab ${sepTab===id?"on":""}`} onClick={()=>setSepTab(id)}>{label}</button>
              ))}
            </div>

            {sepTab==="criteria"&&(
              <div className="cgrid">
                {SEPSIS.criteria.map(crit=>(
                  <div className="cc" key={crit.id} style={{borderTop:`3px solid ${crit.color}`}}>
                    <div className="cct">
                      <div className="ccb" style={{background:`${crit.color}15`,color:crit.color,border:`1px solid ${crit.color}30`}}>{crit.badge}</div>
                      <div className="ccl">{crit.label}</div>
                      {crit.desc&&<div className="ccd">{crit.desc}</div>}
                    </div>
                    <div className="ccp">{crit.params.map((p,i)=>(
                      <div className="cprow" key={i}><span className="cpn">{p.name}</span><span className="cpv">{p.value}</span></div>
                    ))}</div>
                  </div>
                ))}
              </div>
            )}

            {sepTab==="bundle"&&(
              <div className="card">
                <div className="chdr">
                  <div className="sh-l"><div className="sh-ico" style={{background:"rgba(245,158,11,.1)"}}>⏱</div><div><div className="sh-ttl">SURVIVING SEPSIS CAMPAIGN — HOUR-1 BUNDLE</div><div style={{fontSize:11,color:"var(--tx3)",marginTop:2}}>All elements initiated within 1 hour of recognition</div></div></div>
                </div>
                <div style={{padding:"13px 15px"}}>
                  <div className="blist">
                    {SEPSIS.bundle.map(s=>(
                      <div key={s.step} className={`bstep ${s.priority}`}>
                        <div className="snum">{s.step}</div>
                        <div style={{flex:1}}><div className="sact">{s.action}</div><div className="sdet">{s.detail}</div></div>
                        <span style={{fontSize:9,fontWeight:700,letterSpacing:".08em",padding:"2px 7px",borderRadius:3,flexShrink:0,background:s.priority==="critical"?"rgba(239,68,68,.12)":"rgba(245,158,11,.12)",color:s.priority==="critical"?"var(--red)":"var(--yel)"}}>{s.priority.toUpperCase()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="ibox" style={{marginTop:12,marginBottom:0}}>
                    <strong>Lactate Targets:</strong> &gt;2 mmol/L = Sepsis · &gt;4 mmol/L = Septic Shock (even if normotensive) · Target ≥10% clearance at 2 hr · Non-clearance → reassess volume, vasopressor dose, source control
                  </div>
                </div>
              </div>
            )}

            {sepTab==="fluids"&&(
              <div className="fgrid">
                <div className="card" style={{borderTop:"3px solid var(--teal)"}}>
                  <div className="chdr"><span className="sh-ttl" style={{color:"var(--teal)"}}>🧑 ADULT RESUSCITATION</span></div>
                  <div className="cbdy">
                    <div className="ibox"><strong>Initial:</strong> {SEPSIS.fluids.adult.initial}<br/><strong>Preferred:</strong> {SEPSIS.fluids.adult.preferred}<br/><strong>Vasopressor:</strong> {SEPSIS.fluids.adult.vasopressor}<br/><strong>⚠</strong> {SEPSIS.fluids.adult.caution}</div>
                    <table className="ft"><thead><tr><th>FLUID</th><th>DOSE</th><th>NOTES</th></tr></thead><tbody>{SEPSIS.fluids.adult.list.map((f,i)=><tr key={i}><td><div className="fn">{f.name}</div></td><td style={{fontFamily:"monospace",fontSize:11}}>{f.dose}</td><td className="fd">{f.note}</td></tr>)}</tbody></table>
                  </div>
                </div>
                <div className="card" style={{borderTop:"3px solid var(--pur)"}}>
                  <div className="chdr"><span className="sh-ttl" style={{color:"var(--pur)"}}>👶 PEDIATRIC RESUSCITATION</span></div>
                  <div className="cbdy">
                    <div className="ibox"><strong>Initial:</strong> {SEPSIS.fluids.pediatric.initial}<br/><strong>Max 1st hr:</strong> {SEPSIS.fluids.pediatric.max}<br/><strong>⚠ FEAST:</strong> {SEPSIS.fluids.pediatric.caution}</div>
                    <div style={{fontSize:10,letterSpacing:".1em",textTransform:"uppercase",color:"var(--tx3)",marginBottom:7}}>AGE-APPROPRIATE BP TARGETS</div>
                    <table className="mtbl"><thead><tr><th>AGE GROUP</th><th>MIN SBP</th><th>TARGET MAP</th></tr></thead><tbody>{SEPSIS.fluids.pediatric.mapTargets.map((t,i)=><tr key={i}><td>{t.age}</td><td style={{fontFamily:"monospace",color:"var(--yel)"}}>≥{t.sbp} mmHg</td><td style={{fontFamily:"monospace",color:"var(--teal)"}}>≥{t.map} mmHg</td></tr>)}</tbody></table>
                  </div>
                </div>
              </div>
            )}

            {sepTab==="antibiotics"&&(<>
              <div className="stabs">
                {[["empiric","Empiric by Severity"],["sources","Source-Directed"],["pediatric","Pediatric"]].map(([id,label])=>(
                  <button key={id} className={`stab ${abxTab===id?"on":""}`} onClick={()=>setAbxTab(id)}>{label}</button>
                ))}
              </div>
              {abxTab==="empiric"&&SEPSIS.antibiotics.empiric.map((r,i)=>(
                <div className="arow" key={i}>
                  <div className="asev"><span style={{width:8,height:8,borderRadius:"50%",background:r.dot,display:"inline-block",flexShrink:0}}/>{r.severity}</div>
                  <div className="abdy"><div><div className="al">PRIMARY REGIMEN</div><div className="ad">{r.primary}</div></div><div><div className="al">ADD-ON COVERAGE</div><div className="aa">{r.addition}</div></div><div><div className="al">NOTES</div><div className="an">{r.notes}</div></div></div>
                </div>
              ))}
              {abxTab==="sources"&&(<>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
                  {[
                    {id:"all",icon:"🔍",label:"All Systems"},
                    {id:"pulm",icon:"🫁",label:"Pulmonary"},
                    {id:"gu",icon:"🫘",label:"GU / Renal"},
                    {id:"gi",icon:"🫃",label:"GI / Abdominal"},
                    {id:"ssti",icon:"🩹",label:"SSTI / Skin"},
                    {id:"neuro",icon:"🧠",label:"Neuro / CNS"},
                    {id:"cardio",icon:"❤️",label:"Cardiac / Vascular"},
                    {id:"hem",icon:"🩸",label:"Hematologic"},
                    {id:"bone",icon:"🦴",label:"Bone & Joint"},
                  ].map(f=>(
                    <button key={f.id} onClick={()=>setSourceFilter(f.id)} style={{
                      padding:"5px 12px",borderRadius:20,fontSize:11,fontWeight:500,cursor:"pointer",
                      border:"1px solid",transition:"all .15s",fontFamily:"inherit",
                      borderColor:sourceFilter===f.id?"var(--teal)":"var(--br)",
                      background:sourceFilter===f.id?"rgba(0,196,160,0.12)":"var(--c1)",
                      color:sourceFilter===f.id?"var(--teal)":"var(--tx2)",
                    }}>{f.icon} {f.label}</button>
                  ))}
                </div>
                {SEPSIS.antibiotics.sources.filter(s=>sourceFilter==="all"||s.id===sourceFilter).map((s,i)=>(
                  <div className="arow" key={i}>
                    <div className="asev"><span style={{marginRight:4}}>{s.icon}</span>{s.source}</div>
                    <div className="abdy"><div><div className="al">PRIMARY</div><div className="ad">{s.primary}</div></div><div><div className="al">ALTERNATIVE / PCN ALLERGY</div><div className="aa">{s.alt}</div></div><div><div className="al">DURATION</div><div className="an">{s.duration}</div></div></div>
                  </div>
                ))}
              </>)}
              {abxTab==="pediatric"&&SEPSIS.antibiotics.pediatric.map((r,i)=>(
                <div className="arow" key={i}>
                  <div className="asev"><span style={{color:"var(--pur)"}}>👶</span>{r.age}</div>
                  <div className="abdy"><div><div className="al">PRIMARY REGIMEN</div><div className="ad">{r.primary}</div></div><div><div className="al">MODIFICATION</div><div className="aa">{r.mod}</div></div><div><div className="al">CLINICAL NOTES</div><div className="an">{r.notes}</div></div></div>
                </div>
              ))}
            </>)}
          </>)}
        </div>
      </div>
    </>
  );
}

function calcWeightDose(doseStr, weightKg) {
  // Parse mg/kg or mcg/kg patterns and compute for given weight
  const match = doseStr.match(/([\d.]+)\s*(?:–|-)\s*([\d.]+)\s*(mg|mcg|g|mEq|units?)\/kg/i);
  if (!match) return null;
  const low = parseFloat(match[1]);
  const high = parseFloat(match[2]);
  const unit = match[3];
  return {
    low: Math.round(low * weightKg * 10) / 10,
    high: Math.round(high * weightKg * 10) / 10,
    unit,
    perKg: `${low}–${high} ${unit}/kg`
  };
}

function MedRow({med, isExpanded, onToggle, weightKg, isSelected, onSelect}){
  const color = CAT_COLOR[med.category]||"#00c4a0";
  const dosing = med.dosing?.[0];
  const doseStr = dosing?.dose || "";
  const wDose = weightKg && med.ped?.mgkg ? {low: Math.round(weightKg * med.ped.mgkg * 10)/10, high: Math.round(weightKg * med.ped.mgkg * 10)/10, unit: med.ped.unit} : null;

  return(<>
    <div className={`mrow ${isExpanded?"ex":""}`} style={isSelected?{background:"rgba(0,196,160,0.12)",borderColor:"rgba(0,196,160,0.4)"}:{}} onClick={onToggle}>
      <div className="mdot" style={{background:color}}/>
      <div className="mrm">
        <div className="mrn">
          <span className="mcod">{med.id}</span>
          {med.name}
          {med.highAlert && <span className={`mlb l1`} style={{background:"rgba(239, 68, 68, 0.1)", color:"#ef4444", border:"1px solid rgba(239, 68, 68, 0.3)"}}>HIGH ALERT</span>}
          {wDose && (
            <span style={{fontSize:10,padding:"2px 8px",borderRadius:4,background:"rgba(0,196,160,0.12)",border:"1px solid rgba(0,196,160,0.3)",color:"#00c4a0",fontFamily:"monospace",fontWeight:700}}>
              ⚖ {wDose.low} {wDose.unit}
            </span>
          )}
        </div>
        <div className="mrs">{med.drugClass} · {typeof med.indications === "string" ? med.indications.split(",")[0].trim() : ""}</div>
      </div>
      <div className="mrr">
        <span className="dpill">{doseStr.slice(0,40)}{doseStr.length>40?"…":""}</span>
        <input type="checkbox" checked={isSelected} onChange={e=>{e.stopPropagation(); onSelect(!isSelected);}} style={{cursor:"pointer",width:16,height:16}} title="Select for interaction check"/>
        <button className="obtn" onClick={e=>{e.stopPropagation();}}>Order →</button>
        <span style={{color:"var(--tx3)",fontSize:11,transform:isExpanded?"rotate(180deg)":"none",transition:"transform .15s"}}>▼</span>
      </div>
    </div>
    {isExpanded&&(
      <div className="mdet">
        {med.mechanism && (
        <div style={{marginBottom:11,padding:"8px 12px",background:"rgba(0,196,160,0.05)",border:"1px solid rgba(0,196,160,0.18)",borderRadius:"var(--r)"}}>
          <div className="dlbl" style={{marginBottom:4}}>Mechanism of Action</div>
          <div style={{fontSize:12,color:"var(--tx2)",lineHeight:1.6}}>{med.mechanism}</div>
        </div>
      )}
    <div className="dgrid">
          <div>
            <div className="dlbl">Adult Dose</div>
            <div className="dval tl">{med.dosing?.[0]?.dose || "See dosing table"}</div>
          </div>
          <div><div className="dlbl">Onset / Duration</div><div className="dval"><span style={{color:"var(--teal)"}}>{med.halfLife}</span></div></div>
          <div><div className="dlbl">Pregnancy Category</div><div className="dval tl">{med.pregnancy}</div></div>
        </div>
        <div className="dgrid">
          <div><div className="dlbl">Contraindications</div>{med.contraindications?.slice(0,3).map((ci,i)=><div key={i} className="cir"><span style={{flexShrink:0}}>✕</span><span>{ci}</span></div>)}</div>
          <div><div className="dlbl">Warnings</div>{med.warnings?.slice(0,3).map((w,i)=><div key={i} className="wr"><span style={{color:"var(--yel)",flexShrink:0}}>⚠</span><span>{w}</span></div>)}</div>
          <div><div className="dlbl">Monitoring</div><div style={{fontSize:11,color:"var(--tx2)",lineHeight:1.5}}>{med.monitoring}</div></div>
        </div>
        <div className="rtags">
          <span style={{fontSize:10,color:"var(--tx3)",alignSelf:"center"}}>Key Info:</span>
          <span className="rtag">{med.drugClass}</span>
          <span className="rtag">Category: {med.pregnancy}</span>
          {med.highAlert&&<span className="rvtag">HIGH ALERT</span>}
        </div>
      </div>
    )}
  </>);
}