import { useState, useRef, useEffect } from "react";

(() => {
  if (document.getElementById("nh-fonts")) return;
  const l = document.createElement("link");
  l.id = "nh-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "nh-css";
  s.textContent = `
    *{box-sizing:border-box;margin:0;padding:0}
    ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.06);border-radius:2px}
    button{font-family:'DM Sans',sans-serif;outline:none;cursor:pointer}
    input,select,textarea{font-family:'DM Sans',sans-serif;outline:none}
    @keyframes nh-f1{0%,100%{transform:translate(0,0)}50%{transform:translate(55px,38px)}}
    @keyframes nh-f2{0%,100%{transform:translate(0,0)}50%{transform:translate(-48px,55px)}}
    @keyframes nh-f3{0%,100%{transform:translate(0,0)}50%{transform:translate(38px,-48px)}}
    @keyframes nh-pulse{0%,100%{opacity:1}50%{opacity:.3}}
    @keyframes nh-glow{0%,100%{opacity:.55}50%{opacity:1}}
    @keyframes nh-ring{0%,100%{box-shadow:0 0 0 0 rgba(255,61,61,0.7)}65%{box-shadow:0 0 0 7px rgba(255,61,61,0)}}
    @keyframes nh-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
    .nh-card{transition:background .14s,border-color .14s,box-shadow .14s;will-change:transform}
    .nh-card:hover{box-shadow:0 4px 20px rgba(0,0,0,0.25)!important}
    .nh-star{opacity:0;transition:opacity .12s}.nh-card:hover .nh-star,.nh-star-on{opacity:1!important}
    .nh-row{transition:background .12s}.nh-row:hover{background:rgba(59,158,255,0.05)!important}
    .nh-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:8px}
    .nh-launcher{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}
    .nh-tile{transition:background .14s,border-color .14s,box-shadow .14s!important;will-change:transform}
    .nh-tile:hover{box-shadow:0 4px 18px rgba(0,0,0,0.22)!important}
    .nh-srch::placeholder{color:#3a5f80}.nh-srch:focus{outline:none}
    .nh-scroll{overflow-x:auto;scrollbar-width:none}.nh-scroll::-webkit-scrollbar{display:none}
    .nh-layout{display:grid;grid-template-columns:256px 1fr;gap:16px;align-items:start}
    .nh-left{position:sticky;top:20px;max-height:calc(100vh - 40px);overflow-y:auto}
    .nh-inp{background:rgba(5,20,40,0.9);border:1px solid rgba(26,53,85,0.5);border-radius:8px;padding:8px 11px;color:#f2f7ff;font-size:12px;width:100%;transition:border-color .15s}
    .nh-inp:focus{border-color:rgba(59,158,255,0.5)}
    .nh-sel{background:rgba(5,20,40,0.9);border:1px solid rgba(26,53,85,0.5);border-radius:8px;padding:7px 11px;color:#f2f7ff;font-size:11px;width:100%;appearance:none;cursor:pointer}
    .nh-badge-update{display:inline-flex;align-items:center;gap:3px;font-family:'JetBrains Mono',monospace;font-size:7px;font-weight:700;padding:1px 6px;border-radius:20px;letter-spacing:.3px;white-space:nowrap}
    .nh-handoff{animation:nh-pulse 3s ease-in-out infinite}
    .nh-list-row{transition:all .12s}.nh-list-row:hover{transform:translateX(2px)}
    .nh-tab{transition:all .12s!important}
    .nh-act{transition:all .14s!important}
    .nh-pin{transition:all .13s!important}
    @media(max-width:900px){.nh-layout{grid-template-columns:1fr!important}.nh-left{position:static;max-height:none}.nh-launcher{grid-template-columns:repeat(3,1fr)!important}}
  `;
  document.head.appendChild(s);
})();

const T = {
  bg:"#050f1e",txt:"#f2f7ff",txt2:"#b8d4f0",txt3:"#82aece",txt4:"#5a82a8",
  teal:"#00e5c0",gold:"#f5c842",coral:"#ff6b6b",blue:"#3b9eff",
  orange:"#ff9f43",purple:"#9b6dff",green:"#3dffa0",red:"#ff3d3d",
  cyan:"#00d4ff",rose:"#f472b6",
};

// ── Session ───────────────────────────────────────────────────────────────────
const _s = {
  favorites:new Set(["chestpain","sepsis","airway"]),recent:[],
  shiftStart:Date.now(),providerName:"",setupDone:false,
  scratchpad:"",handoffNotes:"",activePatId:null,
};
const _subs = new Set();
const _notify = () => _subs.forEach(fn => fn());
function toggleFav(id){ _s.favorites.has(id)?_s.favorites.delete(id):_s.favorites.add(id); _notify(); }
function addRecent(id){ _s.recent=[{id,ts:Date.now()},..._s.recent.filter(r=>r.id!==id)].slice(0,6); _notify(); }
function useSession(){
  const [t,setT]=useState(0);
  useEffect(()=>{ const fn=()=>setT(x=>x+1); _subs.add(fn); return()=>_subs.delete(fn); },[]);
  return t;
}
function relTime(ts){ const m=Math.floor((Date.now()-ts)/60000); if(m<1)return"just now"; if(m<60)return`${m}m ago`; return`${Math.floor(m/60)}h ago`; }

// ── Top hubs — curated + dynamically sorted ───────────────────────────────────
const TOP_HUB_IDS = ["chestpain","sepsis","airway","ecg","labs","shock","stroke","tox","weightdose","resus","scores","pocus","dyspnea","ams","trauma"];

// Hubs that receive acuity-priority visual treatment
const HIGH_ACUITY = new Set(["airway","resus","shock","sepsis","stroke"]);

// Reorder so recently-visited Top Hubs float to front; rest keep curated order
function getDynamicTopHubs() {
  const recentIds = _s.recent.map(r => r.id).filter(id => TOP_HUB_IDS.includes(id));
  const rest = TOP_HUB_IDS.filter(id => !recentIds.includes(id));
  return [...recentIds, ...rest].map(id => HUB_MAP[id]).filter(Boolean);
}

// ── Hub catalog ───────────────────────────────────────────────────────────────
const GROUPS = [
  { label:"Critical Care", color:T.coral, hubs:[
    { id:"sepsis",    route:"/SepsisHub",         icon:"🦠", title:"Sepsis Hub",          badge:"SSC 2021",   color:T.coral,  tags:["sepsis","qsofa","hour-1","bundle","antibiotics","sirs"],                    features:["qSOFA / SIRS","Hour-1 Bundle","Source ABX","AI Resistance"],      desc:"Sepsis-3 criteria, qSOFA, Hour-1 Bundle, source-based antibiotic tiers, AI resistance lookup." },
    { id:"airway",    route:"/AirwayHub",          icon:"🌬️", title:"Airway Hub",          badge:"DAS 2022",   color:T.blue,   tags:["airway","rsi","intubation","ardsnet","hfnc","cpap","bipap","cric"],         features:["RSI Calculator","ARDSNet TV","ROX / RSBI","CICO A–D"],              desc:"RSI weight-based dosing, DAS 2022 difficult airway algorithm, ARDSNet, HFNC/CPAP/BiPAP." },
    { id:"shock",     route:"/ShockHub",           icon:"⚡",  title:"Shock Hub",           badge:"ACEP 2023",  color:T.coral,  tags:["shock","vasopressor","rush","hemodynamic"],                                 features:["4 Shock States","Vasopressor Ladder","RUSH Protocol","Endpoints"],   desc:"4 shock state profiles, vasopressor ladder with weight-based dosing, RUSH exam protocol." },
    { id:"resus",     route:"/ResusHub",           icon:"❤️", title:"Resus Hub",           badge:"ACLS·PALS",  color:"#ff4444",tags:["cardiac arrest","cpr","acls","pals","vfib","pea","rosc"],                    features:["VF / PEA / Asystole","CPR Timer","Epi Tracker","PALS Weight"],      desc:"Real-time ACLS — CPR timer, epinephrine tracker, H's & T's, post-ROSC checklist." },
    { id:"stroke",    route:"/StrokeHub",          icon:"🧠", title:"Stroke Hub",          badge:"AHA 2019",   color:T.purple, tags:["stroke","tpa","alteplase","nihss","lvo","thrombectomy","tnk"],               features:["Door-to-Needle","tPA Eligibility","Alteplase Dose","NIHSS"],         desc:"Door-to-needle timer, tPA checklist, alteplase 0.9 mg/kg, LVO simultaneous thrombectomy.", updates:["TNK ACEP 2024"] },
    { id:"trauma",    route:"/TraumaHub",          isNew:true,icon:"🚑",title:"Trauma Hub", badge:"ATLS 10e",   color:T.orange, tags:["trauma","atls","mtp","txa","gcs","shock","nexus","hemorrhage"],              features:["ABCDE Survey","Shock Class","MTP 1:1:1","TXA CRASH-2"],             desc:"ATLS primary survey, 4-class hemorrhagic shock, MTP 1:1:1 (PROPPR), TXA CRASH-2 dosing." },
  ]},
  { label:"Chief Complaint", color:T.blue, hubs:[
    { id:"chestpain", route:"/ChestPainHub",       isNew:true,icon:"💓",title:"Chest Pain Hub",  badge:"HEART·EDACS",color:T.coral,  tags:["chest pain","heart score","acs","stemi","nstemi","troponin","edacs"],         features:["HEART Score","Serial Troponin","EDACS","ACS Protocol"],             desc:"HEART score, 0/1/3h hs-cTnI protocol, EDACS, ACS protocol, disposition matrix." },
    { id:"dyspnea",   route:"/DyspneaHub",         isNew:true,icon:"💨",title:"Dyspnea Hub",     badge:"BLUE·PE",    color:T.blue,   tags:["dyspnea","sob","chf","copd","asthma","pe","blue","bnp","perc","wells"],     features:["BLUE Protocol","PE Pathway","CHF / ADHF","COPD / Pneumonia"],       desc:"BLUE protocol, PERC + Wells PE pathway, CHF BNP + diuresis, COPD/asthma, CURB-65." },
    { id:"headache",  route:"/HeadacheHub",        isNew:true,icon:"🤕",title:"Headache Hub",    badge:"OTTAWA·SAH", color:T.purple, tags:["headache","sah","migraine","ottawa","lp","xanthochromia","cluster"],          features:["SNOOP4 Red Flags","Ottawa SAH Rule","LP Interpretation","Treatment"],desc:"SNOOP4 red flags, Ottawa SAH Rule (100% sens), LP/xanthochromia, migraine cocktail." },
    { id:"abdpain",   route:"/AbdominalPainHub",   isNew:true,icon:"🔴",title:"Abdominal Pain Hub",badge:"ALVARADO", color:T.orange, tags:["abdominal","appendicitis","alvarado","bisap","pancreatitis","gi bleed"],      features:["Alvarado Score","BISAP","Glasgow-Blatchford","Tokyo 2018"],          desc:"Alvarado appendicitis, BISAP pancreatitis, Glasgow-Blatchford GI bleed, Tokyo cholangitis." },
    { id:"ams",       route:"/AMSHub",             isNew:true,icon:"😵‍💫",title:"AMS Hub",       badge:"AEIOU-TIPS", color:T.purple, tags:["ams","altered mental status","delirium","cam-icu","rass","wernicke","encephalitis"],features:["AEIOU-TIPS","CAM-ICU","RASS Scale","Specific Syndromes"],       desc:"AEIOU-TIPS differential, CAM-ICU delirium, RASS, Wernicke, NCSE, PRES, hepatic encephalopathy." },
    { id:"syncope",   route:"/SyncopeHub",         icon:"💫",  title:"Syncope Hub",         badge:"SFSR·CSRS",  color:T.gold,   tags:["syncope","faint","sfsr","canadian","csrs"],                                 features:["SFSR + CSRS","High-Risk Features","Ottawa ECG","Disposition"],      desc:"SFSR, Canadian Syncope Risk Score, high-risk features, disposition.", updates:["SFSR Caveat 2023"] },
    { id:"triage",    route:"/TriageHub",          icon:"🏷️",  title:"Triage Hub",          badge:"ESI v4",     color:T.gold,   tags:["triage","esi","ctas","priority"],                                           features:["ESI Algorithm","Peds Adjustments","CTAS Crosswalk","Flags"],        desc:"ESI v4 algorithm, pediatric triage adjustments, CTAS crosswalk, priority flags." },
  ]},
  { label:"Diagnostics", color:T.cyan, hubs:[
    { id:"ecg",       route:"/ECGHub",             icon:"📈",  title:"ECG Hub",             badge:"ACC/AHA",    color:T.cyan,   tags:["ecg","ekg","stemi","qtc","sgarbossa","arrhythmia","lbbb"],                  features:["Waveform Library","STEMI Equivalents","QTc Calc","Sgarbossa"],      desc:"SVG waveform library, STEMI equivalents, QTc calculator, Sgarbossa criteria, 8-step read." },
    { id:"labs",      route:"/LabInterpreter",     icon:"🧪",  title:"Lab Interpreter",     badge:"AI·PASTE",   color:T.green,  tags:["labs","cbc","bmp","lft","anion gap","ai interpretation"],                  features:["BMP / CBC / LFTs","Anion Gap / P/F","AI Interpretation","Critical Values"],desc:"Manual entry or paste-parse. AI interpretation with differential and action items." },
    { id:"scores",    route:"/ScoreHub",           icon:"🎯",  title:"Score Hub",           badge:"12+ TOOLS",  color:T.blue,   tags:["scores","heart","wells","perc","curb-65","ottawa","nexus","gcs"],             features:["HEART / Wells","Ottawa / NEXUS","CURB-65 / GCS","ABCD2"],           desc:"12+ validated scores auto-populated from encounter: HEART, Wells, Ottawa, GCS, ABCD2." },
    { id:"pocus",     route:"/POCUSHub",           icon:"🔊",  title:"POCUS Hub",           badge:"BEDSIDE",    color:T.cyan,   tags:["pocus","ultrasound","fast","efast","cardiac","lung","dvt","aaa"],           features:["Cardiac / Lung","FAST / eFAST","DVT Protocol","Soft Tissue"],       desc:"Cardiac, lung, FAST/eFAST, DVT, AAA protocols with standard views and image gallery." },
    { id:"radiology", route:"/radiology-hub",      icon:"🩻",  title:"Radiology Hub",       badge:"IMAGING",    color:T.txt3,   tags:["radiology","imaging","xray","ct","mri","plain film"],                       features:["Plain Film","CT / MRI Reads","Critical Findings","ED Patterns"],    desc:"Plain film, CT, and MRI rapid reads for common ED presentations." },
  ]},
  { label:"Pharmacology", color:T.teal, hubs:[
    { id:"erx",        route:"/unified-pharma",             icon:"💊",  title:"Pharmacology Hub",       badge:"UNIFIED",        color:T.teal,   tags:["medications","prescribing","renal dosing","drug interactions","weight dosing","rsi","vasopressors","rx builder","ai pharmacist"], features:["Rx Lookup · AI Summary","Weight & Drip Dosing","Interactions Checker","AI Pharmacist"],desc:"Unified pharmacology — FDA Rx lookup, renal dosing, weight-based dosing, drip calculator, drug interactions, Rx builder, AI pharmacist." },
    { id:"weightdose", route:"/unified-pharma",             icon:"⚖️",  title:"Weight / Drip Dosing",   badge:"UNIFIED",        color:T.teal,   tags:["weight","dosing","rsi","vasopressors","infusion","reversal","drip"],         features:["RSI Kit","Live Drip Calc","Weight-Based","Vasopressors"],          desc:"Weight-based dosing, drip calculator, RSI kit — all part of the Unified Pharmacology Hub." },
    { id:"tox",        route:"/ToxHub",                     icon:"☠️",  title:"Tox Hub",                badge:"ANTIDOTES",      color:T.coral,  tags:["tox","overdose","antidotes","rumack","toxidrome","co","opioid"],             features:["16 Antidotes","Rumack-Matthew","10 Protocols","CO Protocol"],        desc:"16 antidotes with dosing, Rumack-Matthew nomogram, toxidrome table, CO protocol.", updates:["CO Protocol ACEP 2025"] },
    { id:"pain",       route:"/PainHub",                    icon:"🩺",  title:"Pain Hub",               badge:"MULTIMODAL",     color:T.orange, tags:["pain","analgesia","opioid","nerve block","ketamine","nsaid"],               features:["Acute Pain Ladder","Opioid Dosing","Nerve Blocks","Adjuncts"],       desc:"Acute pain ladder, opioid dosing, nerve block guide, ketamine protocols." },
    { id:"fluids",     route:"/FluidElectrolyteCalculator", isNew:true,icon:"🧪",title:"Fluid & Electrolyte Calc",badge:"Na·K·HCO3",color:T.green,tags:["fluids","electrolytes","sodium","potassium","bicarb","anion gap","osmolality"],features:["Na Deficit","K Replacement","Bicarb Dosing","Anion Gap"],desc:"Sodium deficit, free water, potassium replacement, bicarbonate, anion gap, osmolality." },
    { id:"abxsteward", route:"/AntibioticStewardshipHub",   isNew:true,icon:"💉",title:"Antibiotic Stewardship",badge:"DE-ESCALATE",color:T.green,tags:["antibiotics","stewardship","culture","de-escalation","pcn allergy","empiric"],features:["Empiric Regimens","PCN Allergy Alts","Culture-Guided AI","De-escalation"],desc:"Empiric antibiotic regimens, PCN allergy alternatives, culture-guided AI de-escalation." },
    { id:"dripshub",   route:"/CriticalCareDripHub",        isNew:true,icon:"💧",title:"Critical Care Drip Hub",badge:"VASOPRESSORS",color:T.coral,tags:["drip","vasopressor","norepinephrine","epinephrine","dopamine","infusion","titration"],features:["Vasopressor Titration","Shock Classification","Drip Rates","Titration Sheets"],desc:"Vasopressor titration, shock classification, critical care drip rates and titration sheets." },
    { id:"medrec",     route:"/MedRecHub",                  isNew:true,icon:"📋",title:"Med Reconciliation",badge:"AI·INTERACTIONS",color:T.purple,tags:["medication reconciliation","drug interaction","renal flag","hold list","allergy","home meds"],features:["Drug-Drug Interactions","Renal Flags","Hold List","Allergy Conflicts"],desc:"AI-powered medication reconciliation — flags DDIs, renal dosing issues, hold list, allergy conflicts." },
    { id:"dischargerx",route:"/DischargeRxCard",            isNew:true,icon:"💊",title:"Discharge Rx Card",badge:"DOSE·DURATION",color:T.gold,tags:["discharge","prescription","dose","duration","contraindications","patient instructions"],features:["Indication-Specific Duration","Absolute Contraindications","Return Precautions","Patient Instructions"],desc:"Discharge prescription cards with dose, duration, contraindications, and return instructions." },
  ]},
  { label:"Subspecialty", color:T.rose, hubs:[
    { id:"dvt",     route:"/DVTHub",        isNew:true,icon:"🩸",title:"DVT / VTE Hub",   badge:"DOAC·WELLS",  color:T.blue,   tags:["dvt","vte","wells","doac","anticoagulation","rivaroxaban","apixaban"],        features:["Wells DVT Score","DOAC Selection","Renal Dosing","IVC Filter"],      desc:"Wells DVT score, all 4 DOACs with renal dosing, IVC filter criteria, special populations." },
    { id:"psych",   route:"/PsychHub",     icon:"💭",  title:"Psych Hub",           badge:"DROPERIDOL",  color:T.rose,   tags:["psych","agitation","si","hi","ciwa","intoxication","droperidol"],           features:["Agitation Protocol","SI/HI Risk","CIWA-Ar","9 Intox Syndromes"],   desc:"Droperidol + midazolam first-line agitation (ACEP 2023), SI/HI risk, CIWA, 9 intox syndromes.", updates:["Droperidol Level B ACEP 2023"] },
    { id:"peds",    route:"/PediatricHub", isNew:true,icon:"🧒",title:"Pediatric Hub",   badge:"PECARN",      color:T.green,  tags:["pediatric","peds","broselow","pecarn","fever","rochester","westley","croup"],features:["Broselow / Vitals","PECARN Head CT","Fever Workup","PALS Dosing"],  desc:"Broselow, age-based vitals, PECARN, Rochester fever criteria, PALS weight-based dosing." },
    { id:"obgyn",   route:"/OBGYNHub",    isNew:true,icon:"🤰",title:"OB/GYN Hub",      badge:"ACOG 2020",   color:T.rose,   tags:["ectopic","pregnancy","preeclampsia","hellp","magnesium","torsion"],          features:["Ectopic / beta-hCG","Vaginal Bleeding","Preeclampsia","Torsion"],    desc:"Ectopic beta-hCG algorithm, vaginal bleeding by trimester, preeclampsia/HELLP, magnesium." },
    { id:"sepAbx",  route:"/SepsisAbxHub",icon:"💉",  title:"Sepsis ABX Hub",      badge:"SOURCE-BASED", color:T.green,  tags:["sepsis","antibiotics","empiric","source","pid","pneumonia"],                features:["7 Source Sets","Empiric Tiers","Resistance","De-escalation"],        desc:"7 source-based empiric antibiotic sets, resistance lookup, de-escalation guidance." },
    { id:"dental",  route:"/DentalHub",   isNew:true,icon:"🦷",title:"Dental Hub",      badge:"DENTAL EM",   color:"#00b4d8",tags:["dental","tooth","abscess","fracture","pericoronitis","nerve block","toothache"],features:["Dental Emergencies","Nerve Blocks","Abscess Management","Fracture Guide"],desc:"Dental emergencies — tooth fractures, pericoronitis, abscess drainage, inferior alveolar nerve blocks." },
    { id:"seizure", route:"/SeizureHub",  isNew:true,icon:"⚡",title:"Seizure Hub",     badge:"STATUS EPI",  color:T.purple, tags:["seizure","epilepsy","status epilepticus","benzodiazepine","keppra","phenytoin"],features:["Status Epilepticus","BZD Protocol","NCSE","Post-ictal Management"],desc:"Status epilepticus protocol, benzodiazepine dosing, NCSE, post-ictal management." },
  ]},
  { label:"Procedures", color:T.orange, hubs:[
    { id:"ortho",     route:"/OrthoHub",            icon:"🦴",  title:"Ortho Hub",       badge:"AI-SPLINTS", color:T.gold,   tags:["ortho","fracture","splint","cast","reduction","ottawa"],                     features:["Fracture ID","AI Splint Schematics","Reduction Guide","Ottawa Rules"],desc:"Fracture ID, AI-generated splint schematics, reduction technique guide, Ottawa rules." },
    { id:"wound",     route:"/WoundCareHub",        icon:"🩹",  title:"Wound Hub",       badge:"CLOSURE",    color:T.orange, tags:["wound","laceration","closure","suture","irrigation"],                        features:["Closure Selection","Suture Sizing","Wound Care","Irrigation"],       desc:"Laceration management, closure type selection, suture sizing, wound care instructions." },
    { id:"procedure", route:"/EDProcedureNotes",    icon:"🔧",  title:"Procedure Hub",   badge:"CPT CODES",  color:T.orange, tags:["procedure","cpt","consent","technique","lp","central line"],                 features:["Procedure Notes","CPT Codes","Consent Templates","Step-by-Step"],    desc:"Procedure note templates with CPT coding, consent guidance, and step-by-step technique." },
    { id:"surgical",  route:"/surgical-airway-hub", icon:"✂️",  title:"Surgical Airway", badge:"CRIC",       color:T.red,    tags:["cric","cricothyrotomy","surgical airway","cico"],                           features:["Rapid Cric","Surgical Technique","Landmark Guide","Equipment"],      desc:"Cricothyrotomy — rapid and surgical technique, landmark identification, equipment checklist." },
  ]},
  { label:"Workflow", color:T.teal, hubs:[
    { id:"derm",            route:"/derm-hub",        icon:"🩺",  title:"Derm Hub",            badge:"ABCDE·DDx",   color:"#00e5c0",tags:["dermatology","rash","skin","lesion","abcde","melanoma","dermnet","VisualDx"],features:["8 Characteristic Categories","ABCDE Melanoma Check","Life-Threatening Alert","DermNet · AAD · VisualDx"],desc:"Skin characteristic selector → AI searches DermNet, AAD, VisualDx → differential with images." },
    { id:"huddle",          route:"/huddle-board",    icon:"🏥",  title:"Huddle Board",        badge:"REAL-TIME",   color:T.teal,   tags:["huddle","board","department","acuity","census","tasks","reassessment"],features:["Acuity Overview","Reassessment Timers","Task Tracking","Disposition Status"],desc:"Real-time department-level view of active patients, acuity, reassessment clocks, and task management." },
    { id:"shift-dashboard", route:"/ShiftDashboard",  icon:"📊",  title:"Shift Dashboard",     badge:"AUTO-REFRESH",color:T.teal,   tags:["shift","dashboard","encounters","handoff","status","discharge"],features:["Auto-refresh","Handoff AI","Status tracking","Today's encounters"],desc:"Today's ED encounters — patient status, active/discharged flags, verbal shift handoff generation." },
    { id:"user-preferences",route:"/UserPreferences", icon:"⚙️",  title:"Provider Preferences",badge:"SETTINGS",    color:T.txt3,   tags:["preferences","settings","provider","name","credentials","facility","signature"],features:["Auto-populates notes","Sig block","Format toggle","Default encounter"],desc:"Set your name, credentials, facility, default encounter type and format — auto-populates all note outputs." },
  ]},
  { label:"Critical Protocols", color:"#f43f5e", hubs:[
    { id:"cp-sepsis",      route:"/SepsisHub",                icon:"🦠",title:"Sepsis / Septic Shock",           badge:"SSC 2021",    color:"#f43f5e",tags:["sepsis","septic shock","hour-1","bundle","qsofa"],      features:["Hour-1 Bundle","Source ABX","Vasopressor Ladder","qSOFA"],          desc:"SEP-1 Hour-1 bundle, source-based empiric antibiotics, norepinephrine ladder, POCUS." },
    { id:"cp-anaphylaxis", route:"/AnaphylaxisHub",           icon:"💉",title:"Anaphylaxis",                     badge:"ACEP 2023",   color:"#f43f5e",tags:["anaphylaxis","epinephrine","allergic","epipen","biphasic"],features:["Epinephrine Dosing","Biphasic Risk","Disposition","2nd-Line Agents"],desc:"Epinephrine IM dosing, biphasic reaction observation, discharge criteria, adjuncts." },
    { id:"cp-rsi",         route:"/AirwayRSIHub",             icon:"🌬️",title:"Airway / RSI",                    badge:"DAS 2022",    color:"#f43f5e",tags:["airway","rsi","intubation","lemon","moans","cric","failed airway"],features:["LEMON · MOANS","7 Ps Drug Selector","Failed Airway A–D","Cric Kit"],desc:"LEMON/MOANS assessment, RSI 7-step drug selector, DAS 2022 failed airway algorithm, cric." },
    { id:"cp-status-epi",  route:"/StatusEpilepticusHub",     icon:"⚡",title:"Status Epilepticus",              badge:"AES 2022",    color:"#a78bfa",tags:["status epilepticus","seizure","benzodiazepine","keppra","phenobarbital"],features:["5-Phase Ladder","Benzo Dosing","AED Selection","Refractory SE"],    desc:"5-phase treatment ladder: BZD → LEV/VPA → phenobarbital → anesthetic infusion." },
    { id:"cp-htn-em",      route:"/HypertensiveEmergencyHub", icon:"🧠",title:"Hypertensive Emergency",          badge:"ACEP 2023",   color:"#a78bfa",tags:["hypertension","MAP","nicardipine","labetalol","end-organ"],features:["9 Scenarios","Agent Selection","MAP Targets","End-Organ Assessment"],desc:"9 end-organ scenarios with targeted agent selection and MAP reduction targets." },
    { id:"cp-meningitis",  route:"/MeningitisHub",            icon:"🧠",title:"Meningitis",                      badge:"IDSA 2020",   color:"#a78bfa",tags:["meningitis","lumbar puncture","ceftriaxone","dexamethasone","csf"],features:["Dex Before ABX","LP Interpretation","CSF Profiles","Empiric Coverage"],desc:"Dexamethasone before antibiotics, LP calculator, empiric coverage by age, CSF profiles." },
    { id:"cp-dka",         route:"/DKAHub",                   icon:"⚗️",title:"DKA / HHS",                       badge:"ADA 2022",    color:"#14b8a6",tags:["dka","diabetic ketoacidosis","hhs","insulin","anion gap","potassium"],features:["AG Calculator","6 I's Causes","Fluid Protocol","Insulin + K⁺"],     desc:"Anion gap calculator, 6 I's causes, fluid resuscitation protocol, insulin + potassium replacement." },
    { id:"cp-hyperkalemia",route:"/HyperkalemiaHub",          icon:"⚗️",title:"Hyperkalemia",                    badge:"ACEP 2021",   color:"#14b8a6",tags:["hyperkalemia","potassium","calcium","insulin","albuterol","ecg"],features:["C-DIGFAST","ECG Changes","Stabilize→Shift→Eliminate","Dialysis"],  desc:"C-DIGFAST mnemonic, ECG changes by K+ level, calcium stabilization, shift, eliminate protocol." },
    { id:"cp-rhabdo",      route:"/RhabdomyolysisHub",        icon:"⚗️",title:"Rhabdomyolysis",                  badge:"ACEP 2022",   color:"#14b8a6",tags:["rhabdomyolysis","ck","myoglobin","aki","compartment syndrome","ivf"],features:["CK Severity Classifier","MUSCLE Causes","IVF Calculator","AKI"],   desc:"CK severity grading, MUSCLE causes mnemonic, IVF calculator, AKI monitoring, compartment syndrome." },
    { id:"cp-pe",          route:"/MassivePEHub",             icon:"❤️",title:"Massive / Submassive PE",         badge:"ESC 2022",    color:"#3b82f6",tags:["pulmonary embolism","pe","tpa","thrombolysis","spesi"],features:["sPESI Score","Thrombolytic Decision","Anticoagulation Dosing","PERC+Wells"],desc:"sPESI calculator, thrombolytic decision tree for massive vs submassive PE, anticoagulation." },
    { id:"cp-adhf",        route:"/ADHFHub",                  icon:"❤️",title:"Acute Decompensated Heart Failure",badge:"ACC/AHA",    color:"#3b82f6",tags:["heart failure","adhf","chf","diuresis","nppv","furosemide","stevenson"],features:["Stevenson Phenotypes","Diuretic Calculator","NPPV","Inotropes"],   desc:"Stevenson clinical profiles, diuretic dosing calculator, NPPV indications, inotrope selection." },
    { id:"cp-stemi",       route:"/STEMIHub",                 icon:"❤️",title:"STEMI",                           badge:"AHA 2022",    color:"#3b82f6",tags:["stemi","mi","pci","cath lab","door-to-balloon","lytics","reperfusion"],features:["Door-to-Balloon","Cath Lab Activation","Lytics Decision","Reperfusion"],desc:"Door-to-balloon timer, cath lab activation criteria, fibrinolysis decision tree, reperfusion." },
    { id:"cp-opioid",      route:"/OpioidOverdoseHub",        icon:"☠️",title:"Opioid Overdose",                badge:"SAMHSA 2023", color:"#fb923c",tags:["opioid","overdose","naloxone","narcan","fentanyl","methadone","buprenorphine","cows"],features:["Multi-Route Naloxone","Infusion Protocol","COWS Calculator","Buprenorphine Initiation"],desc:"Naloxone dosing by route, infusion protocol for long-acting opioids, COWS score, ED buprenorphine." },
    { id:"cp-alcohol",     route:"/AlcoholWithdrawalHub",     icon:"☠️",title:"Alcohol Withdrawal / DTs",       badge:"ASAM 2020",   color:"#fb923c",tags:["alcohol withdrawal","ciwa","delirium tremens","benzodiazepine","phenobarbital","seizure"],features:["CIWA Protocol","Benzo Ladder","Phenobarbital","DT Management"],   desc:"CIWA-Ar scoring, benzodiazepine symptom-triggered protocol, phenobarbital bridge, DT management." },
    { id:"cp-reversal",    route:"/AnticoagulantReversalHub", icon:"🩸",title:"Anticoagulant Reversal",         badge:"ACEP 2023",   color:"#22c55e",tags:["anticoagulant","reversal","warfarin","doac","pcc","andexanet","idarucizumab","vitamin k"],features:["4-Factor PCC","Andexanet Alfa","Idarucizumab","Vitamin K"],         desc:"Warfarin vs DOAC reversal, 4-factor PCC dosing, andexanet alfa, idarucizumab (dabigatran)." },
    { id:"cp-pph",         route:"/PostPartumHemorrhageHub",  icon:"🤰",title:"Postpartum Hemorrhage",          badge:"ACOG 2022",   color:"#f472b6",tags:["postpartum hemorrhage","pph","uterotonic","oxytocin","bakri","mtp","obstetric"],features:["Uterotonic Ladder","Massive Transfusion","Bakri Balloon","Surgical Escalation"],desc:"Uterotonic ladder: oxytocin → methylergonovine → misoprostol → carboprost, Bakri balloon, MTP." },
    { id:"cp-hellp",       route:"/HELLPHub",                 icon:"🤰",title:"HELLP Syndrome",                 badge:"ACOG 2021",   color:"#f472b6",tags:["hellp","hemolysis","elevated liver enzymes","low platelets","magnesium","steroids"],features:["Diagnosis Criteria","Delivery Timing","Magnesium","Steroid Protocol"],desc:"HELLP diagnosis triad, delivery timing, magnesium sulfate protocol, steroid thresholds." },
  ]},
  { label:"Documentation & Tools", color:T.purple, hubs:[
    { id:"autocoder",route:"/AutocoderHub",            icon:"📋",  title:"Autocoder Hub",              badge:"AI-POWERED",   color:T.purple,tags:["coding","icd-10","cpt","e&m","billing","ai"],                               features:["ICD-10 / CPT","E&M Calculator","Code Cart","AI Autocoder"],         desc:"AI-powered ICD-10/CPT coding, E&M level calculator, code cart, transmit-ready summaries." },
    { id:"discharge",route:"/SmartDischargeHub",       icon:"🚪",  title:"Discharge Hub",              badge:"AI-POWERED",   color:T.gold,  tags:["discharge","instructions","ai","patient education","return precautions"],   features:["AI Instructions","Diagnosis-Specific","Med Reconciliation","Print"], desc:"AI-generated discharge instructions tailored to diagnosis, medications, and follow-up plan." },
    { id:"ednote",   route:"/EdNoteGenerator",         isNew:true,icon:"📝",title:"ED Note Generator",   badge:"HPI·ROS·MDM", color:T.teal,  tags:["note","ed note","hpi","ros","pe","mdm","documentation","chart","ehr"],    features:["AI HPI Prose","Per-System ROS","PE by System","AI MDM"],            desc:"Section-by-section ED note builder — AI-generated HPI and MDM, per-system ROS checkboxes, PE." },
    { id:"clinpres", route:"/ClinicalPresentationHub", isNew:true,icon:"🏥",title:"Clinical Presentation Hub",badge:"EVIDENCE-BASED",color:T.blue,tags:["clinical","presentation","management","emergency","diagnosis","evidence","protocol"],features:["Common ED Presentations","Evidence-Based Management","AI-Generated Guidance","Clinical Pearls"],desc:"Structured evidence-based management guidance for common ED presentations." },
    { id:"knowledge",route:"/KnowledgeBaseV2",         icon:"📖",  title:"Knowledge Base",             badge:"GUIDELINES",   color:T.purple,tags:["guidelines","evidence","trials","nnt","drug monograph"],                    features:["17 Guidelines","20 Trials","AI Summaries","NNT / NNH"],             desc:"17 guidelines, 20 landmark trials, AI evidence summaries, NNT/NNH data." },
    { id:"cardiac",  route:"/cardiac-hub",             icon:"🫀",  title:"Cardiac Hub",                badge:"ACS·CHF",      color:"#ff4444",tags:["cardiac","acs","stemi","chf","pacing","arrest"],                            features:["ACS / STEMI","CHF Management","Cardiac Arrest","Pacing"],           desc:"ACS workup, STEMI pathways, CHF management, cardiac arrest algorithms, pacing indications." },
  ]},
];

const HUB_MAP = {};
GROUPS.forEach(g => g.hubs.forEach(h => { HUB_MAP[h.id] = { ...h }; }));

function hubMatches(h, q) {
  if (!q) return true;
  const lo = q.toLowerCase();
  return h.title.toLowerCase().includes(lo)
    || h.badge.toLowerCase().includes(lo)
    || h.desc?.toLowerCase().includes(lo)
    || h.tags?.some(t => t.includes(lo))
    || h.features?.some(f => f.toLowerCase().includes(lo));
}

// ── Board helpers ─────────────────────────────────────────────────────────────
const PHASES = ["triage","demo","vitals","ros","pe","chart"];
function getAction(s){ const d=PHASES.filter(p=>s?.[p]).length; return d===0?{label:"Open",color:T.blue}:d===PHASES.length?{label:"Sign",color:T.gold}:{label:"Resume",color:T.teal}; }
function esiColor(l){ return l<=2?T.red:l===3?T.orange:T.teal; }
function parseDoorMin(s){ if(!s)return 0; const h=s.match(/(\d+)h/),m=s.match(/(\d+)m/),c=s.match(/^(\d+):(\d+)$/); if(c)return parseInt(c[1])*60+parseInt(c[2]); return(h?parseInt(h[1])*60:0)+(m?parseInt(m[1]):parseInt(s)||0); }
function useShiftTime(){
  const [e,setE]=useState(0);
  useEffect(()=>{ const tick=()=>setE(Math.floor((Date.now()-_s.shiftStart)/60000)); tick(); const id=setInterval(tick,30000); return()=>clearInterval(id); },[]);
  const h=Math.floor(e/60),m=e%60;
  return{display:h>0?`${h}h ${m.toString().padStart(2,"0")}m`:`${m}m`,totalMin:e};
}

// ── Background ────────────────────────────────────────────────────────────────
function BgMesh(){
  return(
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden"}}>
      {[{sz:500,s:{top:"-100px",left:"-60px"},c:"rgba(0,229,192,0.04)",a:"nh-f1 18s ease-in-out infinite"},{sz:420,s:{top:"45%",right:"-100px"},c:"rgba(59,158,255,0.03)",a:"nh-f2 22s ease-in-out infinite"},{sz:360,s:{bottom:"-60px",left:"40%"},c:"rgba(155,109,255,0.03)",a:"nh-f3 26s ease-in-out infinite"}].map((b,i)=>(
        <div key={i} style={{position:"absolute",width:b.sz,height:b.sz,borderRadius:"50%",...b.s,background:`radial-gradient(circle,${b.c} 0%,transparent 70%)`,animation:b.a}}/>
      ))}
    </div>
  );
}

// ── Setup card ────────────────────────────────────────────────────────────────
function SetupCard({onDone}){
  const [name,setName]=useState(""); const [ago,setAgo]=useState("0"); const [practice,setPractice]=useState("general");
  const DEFS={general:["chestpain","sepsis","airway"],peds:["peds","weightdose","airway"],trauma:["trauma","shock","airway"],rural:["airway","resus","erx"]};
  const submit=()=>{ _s.providerName=name.trim()||"Provider"; _s.shiftStart=Date.now()-parseInt(ago)*60000; _s.setupDone=true; _s.favorites=new Set(DEFS[practice]||DEFS.general); _notify(); onDone(); };
  return(
    <div style={{padding:"13px",borderRadius:12,marginBottom:12,background:"rgba(5,15,30,0.95)",border:"1px solid rgba(59,158,255,0.3)",boxShadow:"0 4px 24px rgba(0,0,0,0.4)",animation:"nh-in .2s ease"}}>
      <div style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:13,color:T.txt,marginBottom:10}}>Configure your shift</div>
      <div style={{marginBottom:8}}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7.5,color:T.txt4,letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>Your name</div>
        <input className="nh-inp" value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")submit();}} placeholder="Dr. Garcia" autoFocus/>
      </div>
      <div style={{marginBottom:10}}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7.5,color:T.txt4,letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>Shift started</div>
        <select className="nh-sel" value={ago} onChange={e=>setAgo(e.target.value)} style={{background:"rgba(5,20,40,0.9)",border:"1px solid rgba(26,53,85,0.5)",borderRadius:8,padding:"7px 11px",color:T.txt,fontSize:11,width:"100%"}}>
          {[["0","Just now"],["60","1 hour ago"],["120","2 hours ago"],["240","4 hours ago"],["480","8 hours ago"],["720","12 hours ago"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      <div style={{marginBottom:12}}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7.5,color:T.txt4,letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>Practice type</div>
        <select className="nh-sel" value={practice} onChange={e=>setPractice(e.target.value)} style={{background:"rgba(5,20,40,0.9)",border:"1px solid rgba(26,53,85,0.5)",borderRadius:8,padding:"7px 11px",color:T.txt,fontSize:11,width:"100%"}}>
          {[["general","General Emergency Medicine"],["peds","Pediatric Emergency"],["trauma","Trauma / Level I Center"],["rural","Rural / Critical Access"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
        </select>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,color:T.txt4,marginTop:3}}>Sets default pinned hubs for this shift</div>
      </div>
      <button onClick={submit} style={{width:"100%",padding:"9px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#3b9eff,#00e5c0)",color:"#050f1e",fontWeight:700,fontSize:12,boxShadow:"0 2px 12px rgba(59,158,255,0.3)"}}>Start Shift</button>
    </div>
  );
}

// ── Compact patient row ───────────────────────────────────────────────────────
function CompactRow({p}){
  const act=getAction(p.chartStatus),ec=esiColor(p.esiLevel),dtMin=parseDoorMin(p.doorTime),dtCol=dtMin>=120?T.red:dtMin>=60?T.orange:T.txt4;
  return(
    <div className="nh-row" style={{display:"grid",gridTemplateColumns:"26px 1fr auto auto",gap:8,padding:"8px 12px",alignItems:"center",borderBottom:"1px solid rgba(26,53,85,0.28)",cursor:"pointer"}} onClick={()=>{addRecent("npi");window.location.href="/NewPatientInput";}}>
      <div style={{width:26,height:26,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",background:ec+"20",border:`1px solid ${ec}45`,animation:p.esiLevel<=2?"nh-ring 1.6s ease-out infinite":"none",fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:700,color:ec}}>{p.esiLevel}</div>
      <div style={{minWidth:0}}>
        <div style={{fontSize:11.5,fontWeight:600,color:T.txt,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
        <div style={{fontSize:9,color:T.txt4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.cc}</div>
      </div>
      <div style={{textAlign:"right"}}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:dtCol,fontWeight:dtMin>=60?700:400}}>{p.doorTime}</div>
        <div style={{display:"flex",gap:2,marginTop:2,justifyContent:"flex-end"}}>{PHASES.map((ph,i)=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:p.chartStatus?.[ph]?T.teal:"rgba(42,79,122,0.4)"}}/>)}</div>
      </div>
      <button onClick={e=>{e.stopPropagation();window.location.href="/NewPatientInput";}} style={{fontSize:9,fontWeight:700,padding:"4px 8px",borderRadius:6,fontFamily:"'JetBrains Mono',monospace",border:`1px solid ${act.color}40`,background:act.color+"14",color:act.color,whiteSpace:"nowrap"}} onMouseEnter={e=>{e.currentTarget.style.background=act.color+"28";}} onMouseLeave={e=>{e.currentTarget.style.background=act.color+"14";}}>{act.label} →</button>
    </div>
  );
}

// ── Dashboard panel — slimmed operational sidebar ─────────────────────────────
function DashboardPanel({patients}){
  useSession();
  const [showSetup,setShowSetup]=useState(!_s.setupDone);
  const [showScratch,setShowScratch]=useState(false);
  const [scratch,setScratch]=useState(_s.scratchpad);
  const {display:elapsed,totalMin}=useShiftTime();
  const now=new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
  const has=patients.length>0;
  const incomplete=patients.filter(p=>{const d=PHASES.filter(ph=>p.chartStatus?.[ph]).length;return d>0&&d<PHASES.length;}).length;
  const activeEnc=patients.find(p=>{const d=PHASES.filter(ph=>p.chartStatus?.[ph]).length;return d>0&&d<PHASES.length;});
  const esi12=patients.filter(p=>p.esiLevel<=2).length;
  const esi3=patients.filter(p=>p.esiLevel===3).length;
  const esi45=patients.filter(p=>p.esiLevel>=4).length;
  return(
    <div className="nh-left" style={{animation:"nh-in .2s ease"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:28,height:28,borderRadius:8,background:"linear-gradient(135deg,#3b9eff,#00e5c0)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#050f1e"}}>N</div>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:T.txt,fontFamily:"'Playfair Display',serif",lineHeight:1.1}}>{_s.providerName?`Dr. ${_s.providerName.replace(/^dr\.?\s*/i,"").trim()}`:"Notrya"}</div>
            <div style={{fontSize:8,color:T.txt4,fontFamily:"'JetBrains Mono',monospace"}}>Emergency Medicine</div>
          </div>
        </div>
        <button onClick={()=>setShowSetup(p=>!p)} title="Shift settings" style={{background:"transparent",border:"none",fontSize:14,color:T.txt4,padding:"4px"}} onMouseEnter={e=>{e.currentTarget.style.color=T.txt2;}} onMouseLeave={e=>{e.currentTarget.style.color=T.txt4;}}>⚙️</button>
      </div>
      {showSetup&&<SetupCard onDone={()=>setShowSetup(false)}/>}
      {!showSetup&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,marginBottom:10}}>
          {[{label:"TIME",val:now,color:T.txt3},{label:"ELAPSED",val:elapsed,color:T.txt4},{label:"PATIENTS",val:patients.length,color:T.teal},{label:"INCOMPLETE",val:incomplete,color:incomplete>0?T.orange:T.txt4}].map(s=>(
            <div key={s.label} style={{padding:"6px 9px",borderRadius:8,background:"rgba(8,22,44,0.8)",border:"1px solid rgba(26,53,85,0.45)"}}>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,color:T.txt4,letterSpacing:1,marginBottom:2}}>{s.label}</div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:700,color:s.color}}>{s.val}</div>
            </div>
          ))}
        </div>
      )}
      {has&&!showSetup&&(
        <div style={{display:"flex",alignItems:"center",gap:5,padding:"5px 9px",borderRadius:8,marginBottom:8,flexWrap:"wrap",background:"rgba(8,22,44,0.6)",border:"1px solid rgba(26,53,85,0.4)"}}>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700,color:T.txt3}}>{patients.length} pts</span>
          {esi12>0&&<><span style={{color:T.txt4,fontSize:9}}>·</span><span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700,color:T.red}}>ESI 1–2: {esi12}</span></>}
          {esi3>0&&<><span style={{color:T.txt4,fontSize:9}}>·</span><span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.orange}}>ESI 3: {esi3}</span></>}
          {esi45>0&&<><span style={{color:T.txt4,fontSize:9}}>·</span><span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.txt4}}>ESI 4–5: {esi45}</span></>}
          {incomplete>0&&<><span style={{color:T.txt4,fontSize:9}}>·</span><span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.orange}}>{incomplete} incomplete</span></>}
        </div>
      )}
      {!showSetup&&esi12>0&&(
        <div style={{padding:"7px 10px",borderRadius:9,marginBottom:8,background:"rgba(255,61,61,0.07)",border:"1px solid rgba(255,61,61,0.35)"}}>
          <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:5}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:T.red,animation:"nh-ring 1.4s ease-out infinite",flexShrink:0}}/>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:700,color:T.red,letterSpacing:1.5}}>{esi12} CRITICAL PATIENT{esi12!==1?"S":""}</span>
          </div>
          {patients.filter(p=>p.esiLevel<=2).map(p=>{
            const dtMin=parseDoorMin(p.doorTime);
            return(<button key={p.id} onClick={()=>{window.location.href="/NewPatientInput";}} style={{display:"flex",alignItems:"center",gap:5,width:"100%",padding:"4px 0",background:"transparent",border:"none",textAlign:"left",cursor:"pointer"}}>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700,color:T.red,flexShrink:0}}>ESI {p.esiLevel}</span>
              <span style={{fontSize:10,color:T.txt2,fontWeight:600}}>{p.name}</span>
              {p.room&&<span style={{fontSize:9,color:T.txt4}}>Rm {p.room}</span>}
              <span style={{fontSize:9,color:T.txt4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>— {p.cc}</span>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700,flexShrink:0,color:dtMin>=60?T.red:T.coral}}>{p.doorTime}</span>
            </button>);
          })}
        </div>
      )}
      {activeEnc&&!showSetup&&(
        <button onClick={()=>{window.location.href="/NewPatientInput";}} style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"8px 10px",borderRadius:9,marginBottom:8,background:"rgba(59,158,255,0.09)",border:"1px solid rgba(59,158,255,0.35)",cursor:"pointer",textAlign:"left"}} onMouseEnter={e=>{e.currentTarget.style.background="rgba(59,158,255,0.16)";}} onMouseLeave={e=>{e.currentTarget.style.background="rgba(59,158,255,0.09)";}}>
          <div style={{width:26,height:26,borderRadius:7,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",background:esiColor(activeEnc.esiLevel)+"20",border:`1px solid ${esiColor(activeEnc.esiLevel)}45`,fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:700,color:esiColor(activeEnc.esiLevel)}}>{activeEnc.esiLevel}</div>
          <div style={{minWidth:0,flex:1}}>
            <div style={{fontSize:11,fontWeight:700,color:T.blue,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{activeEnc.name}</div>
            <div style={{fontSize:9,color:T.txt4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{activeEnc.cc} · {activeEnc.doorTime}</div>
          </div>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.blue,flexShrink:0}}>Resume →</span>
        </button>
      )}
      {!showSetup&&(
        <div style={{background:"rgba(8,22,44,0.75)",border:"1px solid rgba(26,53,85,0.55)",borderTop:`2px solid ${T.blue}55`,borderRadius:12,overflow:"hidden",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 12px",borderBottom:"1px solid rgba(26,53,85,0.4)"}}>
            <div style={{display:"flex",alignItems:"center",gap:7}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:has?T.teal:T.txt4,animation:has?"nh-pulse 2.5s infinite":"none"}}/>
              <span style={{fontSize:11,fontWeight:700,color:T.txt,fontFamily:"'Playfair Display',serif"}}>Active Patients</span>
              {has&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,padding:"1px 6px",borderRadius:20,background:T.teal+"14",border:`1px solid ${T.teal}30`,color:T.teal}}>{patients.length}</span>}
            </div>
            <button onClick={()=>{window.location.href="/NewPatientInput";}} style={{fontSize:9,fontWeight:700,color:"#050f1e",background:"linear-gradient(135deg,#00e5c0,#3b9eff)",border:"none",borderRadius:6,padding:"4px 10px"}}>+ New</button>
          </div>
          {has?patients.map(p=><CompactRow key={p.id} p={p}/>):(
            <div style={{padding:"22px 12px",textAlign:"center"}}>
              <div style={{fontSize:22,opacity:.25,marginBottom:6}}>🏥</div>
              <div style={{fontSize:11,color:T.txt4,fontFamily:"'Playfair Display',serif"}}>Department clear</div>
              <button onClick={()=>{window.location.href="/NewPatientInput";}} style={{marginTop:10,padding:"7px 16px",borderRadius:8,border:"none",background:"linear-gradient(135deg,#00e5c0,#3b9eff)",color:"#050f1e",fontWeight:700,fontSize:11}}>Start New Patient</button>
            </div>
          )}
          <button onClick={()=>{window.location.href="/EDTrackingBoard";}} style={{display:"block",width:"100%",padding:"6px",fontSize:9,color:T.txt4,background:"transparent",border:"none",borderTop:"1px solid rgba(26,53,85,0.3)",fontFamily:"'JetBrains Mono',monospace",letterSpacing:.5}} onMouseEnter={e=>{e.currentTarget.style.color=T.txt2;}} onMouseLeave={e=>{e.currentTarget.style.color=T.txt4;}}>Full Track Board →</button>
        </div>
      )}
      {totalMin>=480&&!showSetup&&(
        <button className="nh-handoff" onClick={()=>{window.location.href="/NewPatientInput";}} style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"8px 11px",borderRadius:9,marginBottom:10,cursor:"pointer",background:"rgba(245,200,66,0.08)",border:"1px solid rgba(245,200,66,0.35)"}}>
          <span style={{fontSize:16,flexShrink:0}}>🔔</span>
          <div style={{textAlign:"left"}}>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:11,color:T.gold}}>Shift at {elapsed} — Generate Handoff</div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,color:T.txt4}}>I-PASS auto-populated from your encounters</div>
          </div>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.gold,marginLeft:"auto",flexShrink:0}}>→</span>
        </button>
      )}
      {_s.recent.length>0&&!showSetup&&(
        <div style={{marginBottom:10}}>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7.5,fontWeight:700,color:T.txt4,textTransform:"uppercase",letterSpacing:1.3,marginBottom:6}}>↺ Recent</div>
          <div className="nh-scroll" style={{display:"flex",gap:5}}>
            {_s.recent.map(({id,ts})=>{ const h=HUB_MAP[id]; if(!h)return null;
              return(<button key={id} onClick={()=>{addRecent(id);window.location.href=h.route;}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"5px 9px",borderRadius:8,flexShrink:0,background:"rgba(8,22,44,0.7)",border:"1px solid rgba(26,53,85,0.45)",cursor:"pointer",minWidth:56}} onMouseEnter={e=>{e.currentTarget.style.background=h.color+"14";e.currentTarget.style.borderColor=h.color+"44";}} onMouseLeave={e=>{e.currentTarget.style.background="rgba(8,22,44,0.7)";e.currentTarget.style.borderColor="rgba(26,53,85,0.45)";}}>
                <span style={{fontSize:14}}>{h.icon}</span>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,color:T.txt4,whiteSpace:"nowrap"}}>{relTime(ts)}</span>
              </button>);
            })}
          </div>
        </div>
      )}
      {!showSetup&&(
        <div>
          <button onClick={()=>setShowScratch(p=>!p)} style={{display:"flex",alignItems:"center",gap:6,width:"100%",padding:"5px 0",background:"transparent",border:"none",marginBottom:showScratch?6:0}}>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7.5,fontWeight:700,color:T.txt4,textTransform:"uppercase",letterSpacing:1.3}}>✏ Scratchpad</span>
            {scratch&&!showScratch&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,color:T.txt4,marginLeft:"auto"}}>{scratch.split("\n").filter(Boolean).length} note{scratch.split("\n").filter(Boolean).length!==1?"s":""}</span>}
            <span style={{fontSize:10,color:T.txt4,marginLeft:scratch?0:"auto"}}>{showScratch?"▲":"▼"}</span>
          </button>
          {showScratch&&(
            <div>
              <textarea value={scratch} onChange={e=>{setScratch(e.target.value);_s.scratchpad=e.target.value;}} placeholder={"Recheck K+ Rm3 at 1800\nCall cardiology re: Rm7 before 3pm\n..."} style={{width:"100%",height:88,padding:"8px 10px",background:"rgba(5,20,40,0.9)",border:"1px solid rgba(26,53,85,0.5)",borderRadius:9,resize:"vertical",fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.txt2,lineHeight:1.6}} onFocus={e=>{e.target.style.borderColor="rgba(59,158,255,0.5)";}} onBlur={e=>{e.target.style.borderColor="rgba(26,53,85,0.5)";}}/>
              {scratch.trim()&&(<button onClick={()=>{_s.handoffNotes=(_s.handoffNotes||"")+((_s.handoffNotes||"").trim()?"\n\n":"")+"--- Shift notes ---\n"+scratch.trim();_notify();window.location.href="/NewPatientInput";}} style={{display:"flex",alignItems:"center",gap:6,marginTop:5,padding:"5px 11px",borderRadius:7,background:"rgba(245,200,66,0.08)",border:"1px solid rgba(245,200,66,0.3)",color:T.gold,cursor:"pointer",fontSize:10,fontFamily:"'DM Sans',sans-serif",fontWeight:600}} onMouseEnter={e=>{e.currentTarget.style.background="rgba(245,200,66,0.15)";}} onMouseLeave={e=>{e.currentTarget.style.background="rgba(245,200,66,0.08)";}}>
                <span style={{fontSize:12}}>📋</span> → Add to handoff
              </button>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Clinical Strip — actions + pinned hubs ────────────────────────────────────
function ClinicalStrip({patients=[]}){
  useSession();
  const activeEnc=patients.find(p=>{const d=PHASES.filter(ph=>p.chartStatus?.[ph]).length;return d>0&&d<PHASES.length;});
  const favHubs=[..._s.favorites].map(id=>HUB_MAP[id]).filter(Boolean);
  const ACTIONS=[
    {icon:"🏥",label:"New Patient",sub:"Start encounter",route:"/NewPatientInput",color:T.teal,primary:true},
    {icon:"📝",label:"Quick Note",sub:"Direct to chart",route:"/QuickNote",color:T.blue},
    {icon:"↺",label:activeEnc?`Resume: ${activeEnc.name.split(" ")[0]}`:"Resume Chart",sub:activeEnc?activeEnc.cc:"Last encounter",route:"/NewPatientInput",color:activeEnc?T.gold:T.purple},
  ];
  return(
    <div style={{display:"flex",alignItems:"stretch",marginBottom:11,padding:"10px 12px",borderRadius:13,background:"rgba(8,22,44,0.92)",border:"1px solid rgba(0,229,192,0.18)",boxShadow:"0 4px 24px rgba(0,0,0,0.35)",animation:"nh-in .18s ease",overflow:"hidden"}}>
      <div style={{display:"flex",gap:6,flexShrink:0}}>
        {ACTIONS.map(a=>(
          <button key={a.label} className="nh-act" onClick={()=>{window.location.href=a.route;}}
            style={{display:"flex",alignItems:"center",gap:9,padding:"9px 13px",borderRadius:9,background:a.primary?`linear-gradient(135deg,${a.color}22,${a.color}0c)`:a.color+"0c",border:`1px solid ${a.primary?a.color+"55":a.color+"28"}`,cursor:"pointer",whiteSpace:"nowrap"}}
            onMouseEnter={e=>{e.currentTarget.style.background=a.color+"26";e.currentTarget.style.borderColor=a.color+"70";e.currentTarget.style.boxShadow=`0 4px 14px ${a.color}18`;}}
            onMouseLeave={e=>{e.currentTarget.style.background=a.primary?a.color+"22":a.color+"0c";e.currentTarget.style.borderColor=a.primary?a.color+"55":a.color+"28";e.currentTarget.style.boxShadow="";}}>
            <span style={{fontSize:18,flexShrink:0}}>{a.icon}</span>
            <div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:11.5,color:a.primary?a.color:T.txt}}>{a.label}</div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,color:T.txt4,marginTop:1,maxWidth:95,overflow:"hidden",textOverflow:"ellipsis"}}>{a.sub}</div>
            </div>
          </button>
        ))}
      </div>
      <div style={{width:1,background:"rgba(26,53,85,0.7)",margin:"4px 10px",flexShrink:0}}/>
      <div className="nh-scroll" style={{display:"flex",gap:6,flex:1,alignItems:"center",minWidth:0}}>
        {favHubs.length===0
          ?<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.txt4,whiteSpace:"nowrap",padding:"0 4px"}}>★ Pin hubs from the grid to add them here</span>
          :favHubs.map(h=>(
            <button key={h.id} className="nh-pin" onClick={()=>{addRecent(h.id);window.location.href=h.route;}}
              style={{display:"flex",alignItems:"center",gap:7,flexShrink:0,padding:"7px 11px",borderRadius:8,background:h.color+"0e",border:`1px solid ${h.color}28`,cursor:"pointer"}}
              onMouseEnter={e=>{e.currentTarget.style.background=h.color+"1e";e.currentTarget.style.borderColor=h.color+"55";}}
              onMouseLeave={e=>{e.currentTarget.style.background=h.color+"0e";e.currentTarget.style.borderColor=h.color+"28";}}>
              <span style={{fontSize:15}}>{h.icon}</span>
              <div>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:10.5,color:T.txt,whiteSpace:"nowrap"}}>{h.title}</div>
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:6.5,color:h.color,marginTop:1}}>{h.badge}</div>
              </div>
            </button>
          ))
        }
      </div>
    </div>
  );
}

// ── Shortcut chip ─────────────────────────────────────────────────────────────
function ShortcutChip(){
  const [open,setOpen]=useState(false); const ref=useRef(null);
  useEffect(()=>{ if(!open)return; const h=e=>{if(!ref.current?.contains(e.target))setOpen(false);}; document.addEventListener("mousedown",h); return()=>document.removeEventListener("mousedown",h); },[open]);
  return(
    <div ref={ref} style={{position:"relative"}}>
      <button onClick={()=>setOpen(p=>!p)} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:7,background:"rgba(8,22,44,0.8)",border:`1px solid ${open?"rgba(59,158,255,0.4)":"rgba(26,53,85,0.5)"}`,color:open?T.blue:T.txt4,fontFamily:"'JetBrains Mono',monospace",fontSize:9}}>
        <span>⌨</span> Shortcuts
      </button>
      {open&&(
        <div style={{position:"absolute",right:0,top:"calc(100% + 6px)",zIndex:50,padding:"10px 13px",borderRadius:9,minWidth:172,background:"rgba(6,14,28,0.98)",border:"1px solid rgba(59,158,255,0.28)",boxShadow:"0 8px 28px rgba(0,0,0,0.6)",backdropFilter:"blur(20px)"}}>
          {[["/","Focus search"],["Esc","Clear search"],["⌘ K","Command palette"],["Enter","Open focused hub"]].map(([k,d],i,a)=>(
            <div key={k} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:14,padding:"5px 0",borderBottom:i<a.length-1?"1px solid rgba(26,53,85,0.3)":"none"}}>
              <kbd style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:4,background:"rgba(59,158,255,0.1)",border:"1px solid rgba(59,158,255,0.28)",color:T.blue}}>{k}</kbd>
              <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.txt3}}>{d}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Launcher tile — compact icon+title for Top Hubs quick-launch ──────────────
function LauncherTile({hub}){
  useSession();
  const [hov,setHov]=useState(false);
  const fav=_s.favorites.has(hub.id);
  const hot=HIGH_ACUITY.has(hub.id);
  const shortTitle=hub.title.replace(/ Hub$/,"").replace(/ Hub\b/,"");
  return(
    <button className="nh-tile" tabIndex={0}
      onClick={()=>{window.location.href=hub.route; addRecent(hub.id);}}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{position:"relative",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,padding:"11px 6px 9px",borderRadius:10,
        background:hov?hub.color+"1e":hot?hub.color+"13":hub.color+"0a",
        border:`1px solid ${hov?hub.color+"65":hot?hub.color+"48":hub.color+"22"}`,
        cursor:"pointer",overflow:"hidden",
        boxShadow:hov?`0 4px 18px ${hub.color}1c`:"none"}}>
      {/* Acuity top stripe — pulsing glow for high-acuity hubs */}
      {hot&&<div style={{position:"absolute",top:0,left:0,right:0,height:2,borderRadius:"10px 10px 0 0",background:hub.color,animation:"nh-glow 2.2s ease-in-out infinite"}}/>}
      {/* Pin indicator */}
      {fav&&<span style={{position:"absolute",top:4,right:6,fontSize:8,color:T.gold,lineHeight:1,opacity:.9}}>★</span>}
      <span style={{fontSize:22,lineHeight:1,marginTop:hot?2:0}}>{hub.icon}</span>
      <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:9.5,color:hov?T.txt:T.txt2,textAlign:"center",lineHeight:1.25,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",maxWidth:"100%",padding:"0 2px"}}>{shortTitle}</div>
      {hot&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:6,fontWeight:700,color:hub.color,letterSpacing:.4,textTransform:"uppercase",opacity:.85}}>⚡ priority</span>}
    </button>
  );
}

// ── Hub card ──────────────────────────────────────────────────────────────────
function HubCard({hub}){
  const [hov,setHov]=useState(false); useSession(); const fav=_s.favorites.has(hub.id); const hot=HIGH_ACUITY.has(hub.id);
  return(
    <div className="nh-card" tabIndex={0}
      onClick={()=>{window.location.href=hub.route; addRecent(hub.id);}}
      onKeyDown={e=>{if(e.key==="Enter"){window.location.href=hub.route; addRecent(hub.id);}}}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{position:"relative",padding:"11px 13px",borderRadius:11,cursor:"pointer",background:hov?hub.color+"13":hot?hub.color+"0f":hub.color+"09",border:`1px solid ${hov?hub.color+"45":hot?hub.color+"38":hub.color+"22"}`,display:"flex",flexDirection:"column",gap:6,overflow:"hidden"}}>
      {hot&&<div style={{position:"absolute",top:0,left:0,right:0,height:2,background:hub.color,animation:"nh-glow 2.2s ease-in-out infinite"}}/>}
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <div style={{width:30,height:30,borderRadius:9,flexShrink:0,background:hub.color+"16",border:`1px solid ${hub.color}28`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>{hub.icon}</div>
        <div style={{minWidth:0,flex:1}}>
          <div style={{fontSize:12.5,fontWeight:700,color:T.txt,fontFamily:"'Playfair Display',serif",lineHeight:1.2,marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{hub.title}</div>
          <span style={{fontSize:7.5,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,padding:"1px 6px",borderRadius:20,background:hub.color+"16",border:`1px solid ${hub.color}28`,color:hub.color}}>{hub.badge}</span>
        </div>
        <button className={`nh-star${fav?" nh-star-on":""}`} onClick={e=>{e.stopPropagation();toggleFav(hub.id);}} title={fav?"Unpin":"Pin to strip"} style={{background:"transparent",border:"none",flexShrink:0,fontSize:13,lineHeight:1,padding:"3px",color:fav?T.gold:T.txt4}}>{fav?"★":"☆"}</button>
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:"3px 10px"}}>
        {hub.features.map((f,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:4,fontSize:9,color:T.txt4}}><div style={{width:3,height:3,borderRadius:"50%",background:hub.color,opacity:.65,flexShrink:0}}/>{f}</div>)}
      </div>
      <div style={{fontSize:10,color:hov?T.txt3:T.txt4,lineHeight:1.55,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",minHeight:"calc(10px * 1.55 * 2)"}}>{hub.desc}</div>
      {(hub.isNew||hub.updates?.length>0)&&(
        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
          {hub.isNew&&<span className="nh-badge-update" style={{color:T.green,background:T.green+"12",border:`1px solid ${T.green}30`}}>• NEW</span>}
          {hub.updates?.map((u,i)=><span key={i} className="nh-badge-update" style={{color:T.orange,background:T.orange+"12",border:`1px solid ${T.orange}30`}}>↑ {u}</span>)}
        </div>
      )}
    </div>
  );
}

// ── Hub list row ──────────────────────────────────────────────────────────────
function HubListRow({hub}){
  useSession(); const [hov,setHov]=useState(false); const fav=_s.favorites.has(hub.id);
  return(
    <div className="nh-list-row"
      onClick={()=>{addRecent(hub.id);window.location.href=hub.route;}}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{display:"grid",gridTemplateColumns:"30px 1fr auto auto auto",alignItems:"center",gap:10,padding:"7px 10px",borderRadius:8,background:hov?hub.color+"0e":"transparent",border:`1px solid ${hov?hub.color+"30":"transparent"}`,cursor:"pointer"}}>
      <div style={{width:30,height:30,borderRadius:8,background:hub.color+"16",border:`1px solid ${hub.color}28`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>{hub.icon}</div>
      <div style={{minWidth:0}}>
        <div style={{fontSize:12,fontWeight:700,color:T.txt,fontFamily:"'Playfair Display',serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{hub.title}</div>
        <div style={{fontSize:9,color:T.txt4,marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{hub.features.slice(0,3).join(" · ")}</div>
      </div>
      <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7.5,fontWeight:700,padding:"2px 7px",borderRadius:20,background:hub.color+"16",border:`1px solid ${hub.color}28`,color:hub.color,whiteSpace:"nowrap"}}>{hub.badge}</span>
      {hub.isNew?<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,fontWeight:700,padding:"1px 5px",borderRadius:20,color:T.green,background:T.green+"12",border:`1px solid ${T.green}30`}}>NEW</span>:<span style={{width:28}}/>}
      <button onClick={e=>{e.stopPropagation();toggleFav(hub.id);}} className={`nh-star${fav?" nh-star-on":""}`} style={{background:"transparent",border:"none",fontSize:12,color:fav?T.gold:T.txt4,padding:"3px"}}>{fav?"★":"☆"}</button>
    </div>
  );
}

// ── Group section ─────────────────────────────────────────────────────────────
function GroupSection({group,query,viewMode="launcher",defaultCollapsed=false}){
  const [collapsed,setCollapsed]=useState(defaultCollapsed);
  const filtered=group.hubs.filter(h=>hubMatches(h,query));
  if(!filtered.length)return null;
  const LIMIT=6,canCollapse=defaultCollapsed&&filtered.length>LIMIT&&!query;
  const shown=canCollapse&&collapsed?filtered.slice(0,LIMIT):filtered;
  const isTop=group.label==="Top Hubs";
  return(
    <div style={{marginBottom:22}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:group.tagline?4:9}}>
        <div style={{width:3,height:12,borderRadius:2,background:group.color,flexShrink:0}}/>
        <span style={{fontSize:8.5,fontWeight:700,color:group.color,textTransform:"uppercase",letterSpacing:".1em",fontFamily:"'JetBrains Mono',monospace"}}>{group.label}</span>
        <div style={{height:1,flex:1,background:group.color+"18"}}/>
        {canCollapse&&<button onClick={()=>setCollapsed(p=>!p)} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.txt4,background:"transparent",border:"none",cursor:"pointer",padding:"2px 6px"}} onMouseEnter={e=>{e.currentTarget.style.color=T.txt2;}} onMouseLeave={e=>{e.currentTarget.style.color=T.txt4;}}>{collapsed?`Show all ${filtered.length} →`:"Collapse ↑"}</button>}
        <span style={{fontSize:8,color:T.txt4,fontFamily:"'JetBrains Mono',monospace"}}>{filtered.length}{query&&filtered.length<group.hubs.length?` of ${group.hubs.length}`:""} hub{filtered.length!==1?"s":""}</span>
      </div>
      {group.tagline&&<div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7.5,color:T.txt4,marginBottom:9,paddingLeft:11}}>{group.tagline}</div>}
      {isTop&&viewMode==="launcher"
        ?<div className="nh-launcher">{shown.map(h=><LauncherTile key={h.id} hub={h}/>)}</div>
        :viewMode==="list"
          ?<div style={{display:"flex",flexDirection:"column",gap:2}}>{shown.map(h=><HubListRow key={h.id} hub={h}/>)}</div>
          :<div className="nh-grid">{shown.map(h=><HubCard key={h.id} hub={h}/>)}</div>
      }
      {canCollapse&&collapsed&&(
        <button onClick={()=>setCollapsed(false)} style={{marginTop:8,width:"100%",padding:"7px",borderRadius:8,border:"none",background:"rgba(244,63,94,0.07)",color:T.txt4,fontFamily:"'JetBrains Mono',monospace",fontSize:9,cursor:"pointer"}} onMouseEnter={e=>{e.currentTarget.style.background="rgba(244,63,94,0.14)";e.currentTarget.style.color="#f43f5e";}} onMouseLeave={e=>{e.currentTarget.style.background="rgba(244,63,94,0.07)";e.currentTarget.style.color=T.txt4;}}>+ {filtered.length-LIMIT} more protocols — click to expand</button>
      )}
    </div>
  );
}

const TAB_LABELS={"Top Hubs":"★ Top Hubs","Critical Care":"Critical Care","Chief Complaint":"Chief CC","Diagnostics":"Diagnostics","Pharmacology":"Pharma","Subspecialty":"Subspecialty","Procedures":"Procedures","Workflow":"Workflow","Critical Protocols":"Protocols","Documentation & Tools":"Docs"};

// ── Main ──────────────────────────────────────────────────────────────────────
export default function NotryaHome({patients=[]}){
  useSession(); // reactive updates for dynamic Top Hubs reordering
  const [query,setQuery]=useState("");
  const [activeTab,setActiveTab]=useState("Top Hubs");
  const [topView,setTopView]=useState("launcher"); // launcher | cards  (Top Hubs tab only)
  const [viewMode,setViewMode]=useState("cards");   // cards | list  (all other tabs)
  const searchRef=useRef(null);

  // Autofocus search on mount
  useEffect(()=>{ const t=setTimeout(()=>searchRef.current?.focus(),120); return()=>clearTimeout(t); },[]);

  useEffect(()=>{
    const h=e=>{
      if(e.key==="Escape"){ setQuery(""); searchRef.current?.blur(); return; }
      if((e.metaKey||e.ctrlKey)&&e.key==="k"){ e.preventDefault(); searchRef.current?.focus(); return; }
      if(e.key==="/"&&document.activeElement?.tagName!=="INPUT"&&document.activeElement?.tagName!=="TEXTAREA"){ e.preventDefault(); searchRef.current?.focus(); }
    };
    document.addEventListener("keydown",h); return()=>document.removeEventListener("keydown",h);
  },[]);

  const totalHubs=GROUPS.reduce((n,g)=>n+g.hubs.length,0);

  // Dynamic Top Hubs: recently-visited float to front, rest keep curated order
  const TOP_GROUP={
    label:"Top Hubs",color:T.gold,
    tagline:"Sorted by shift usage · ⚡ priority hubs for active resuscitation · ★ to pin",
    hubs:getDynamicTopHubs(),
  };

  const displayGroups=activeTab==="Top Hubs"?[TOP_GROUP]:activeTab==="All"?GROUPS:GROUPS.filter(g=>g.label===activeTab);
  const totalMatches=displayGroups.reduce((n,g)=>n+g.hubs.filter(h=>hubMatches(h,query)).length,0);
  const TABS=["Top Hubs","All",...GROUPS.map(g=>g.label)];

  // Effective view mode: Top Hubs uses topView, others use viewMode
  const effectiveView=activeTab==="Top Hubs"?topView:viewMode;

  return(
    <div style={{minHeight:"100vh",background:T.bg,color:T.txt,fontFamily:"'DM Sans',sans-serif",position:"relative"}}>
      <BgMesh/>
      <div style={{position:"relative",zIndex:1,padding:"20px 20px 48px",maxWidth:1440,margin:"0 auto"}}>
        <div className="nh-layout">

          <DashboardPanel patients={patients}/>

          <div>
            {/* ① Clinical Strip */}
            <ClinicalStrip patients={patients}/>

            {/* ② Tab strip */}
            <div className="nh-scroll" style={{display:"flex",gap:5,marginBottom:11,paddingBottom:4}}>
              {TABS.map(tab=>{
                const active=activeTab===tab,isTop=tab==="Top Hubs";
                const group=GROUPS.find(g=>g.label===tab);
                const color=isTop?T.gold:group?group.color:T.teal;
                return(
                  <button key={tab} className="nh-tab"
                    onClick={()=>{ setActiveTab(tab); if(tab!=="All")setQuery(""); }}
                    style={{flexShrink:0,padding:"5px 13px",borderRadius:20,fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700,letterSpacing:".04em",background:active?color+"22":"rgba(8,22,44,0.8)",border:`1px solid ${active?color+"55":"rgba(26,53,85,0.5)"}`,color:active?color:T.txt4,cursor:"pointer"}}>
                    {TAB_LABELS[tab]||tab}
                  </button>
                );
              })}
            </div>

            {/* ③ Search + view toggle */}
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
              <div style={{flex:1,display:"flex",alignItems:"center",gap:8,padding:"0 13px",height:42,borderRadius:10,background:"rgba(8,22,44,0.9)",border:`1px solid ${query?"rgba(59,158,255,0.45)":"rgba(26,53,85,0.5)"}`}}>
                <svg width="13" height="13" viewBox="0 0 20 20" fill="none" style={{flexShrink:0}}>
                  <circle cx="8.5" cy="8.5" r="5.5" stroke={query?T.blue:T.txt4} strokeWidth="1.8"/>
                  <path d="M13 13l3.5 3.5" stroke={query?T.blue:T.txt4} strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
                <input ref={searchRef} className="nh-srch" value={query}
                  onChange={e=>{ setQuery(e.target.value); if(e.target.value)setActiveTab("All"); }}
                  placeholder={activeTab==="Top Hubs"?"Search top hubs or type to search all…":`Search all ${totalHubs} hubs — scores, drugs, procedures…`}
                  style={{flex:1,background:"transparent",border:"none",fontFamily:"'DM Sans',sans-serif",fontSize:13,color:T.txt,caretColor:T.blue}}/>
                {query&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.txt4,flexShrink:0}}>{totalMatches} match{totalMatches!==1?"es":""}</span>}
                {query
                  ?<button onClick={()=>setQuery("")} style={{background:"transparent",border:"none",color:T.txt4,fontSize:17,lineHeight:1,padding:"0 4px"}} onMouseEnter={e=>{e.currentTarget.style.color=T.coral;}} onMouseLeave={e=>{e.currentTarget.style.color=T.txt4;}}>×</button>
                  :<kbd style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.txt4,background:"rgba(42,79,122,0.15)",border:"1px solid rgba(42,79,122,0.3)",borderRadius:4,padding:"2px 5px",flexShrink:0}}>/</kbd>
                }
              </div>

              {/* View toggle — context-aware */}
              {activeTab==="Top Hubs"?(
                <button onClick={()=>setTopView(v=>v==="launcher"?"cards":"launcher")}
                  style={{display:"flex",alignItems:"center",gap:5,padding:"5px 11px",height:42,borderRadius:7,background:topView==="launcher"?"rgba(245,200,66,0.12)":"rgba(8,22,44,0.8)",border:`1px solid ${topView==="launcher"?"rgba(245,200,66,0.45)":"rgba(26,53,85,0.5)"}`,color:topView==="launcher"?T.gold:T.txt4,fontFamily:"'JetBrains Mono',monospace",fontSize:9,cursor:"pointer",whiteSpace:"nowrap"}}
                  onMouseEnter={e=>{ if(topView!=="launcher"){e.currentTarget.style.color=T.txt2;e.currentTarget.style.borderColor="rgba(245,200,66,0.3)";} }}
                  onMouseLeave={e=>{ if(topView!=="launcher"){e.currentTarget.style.color=T.txt4;e.currentTarget.style.borderColor="rgba(26,53,85,0.5)";} }}>
                  {topView==="launcher"?"⊞ Cards":"⚡ Launcher"}
                </button>
              ):(
                <button onClick={()=>setViewMode(v=>v==="cards"?"list":"cards")}
                  style={{display:"flex",alignItems:"center",gap:5,padding:"5px 11px",height:42,borderRadius:7,background:viewMode==="list"?"rgba(59,158,255,0.12)":"rgba(8,22,44,0.8)",border:`1px solid ${viewMode==="list"?"rgba(59,158,255,0.45)":"rgba(26,53,85,0.5)"}`,color:viewMode==="list"?T.blue:T.txt4,fontFamily:"'JetBrains Mono',monospace",fontSize:9,cursor:"pointer",whiteSpace:"nowrap"}}
                  onMouseEnter={e=>{ if(viewMode!=="list"){e.currentTarget.style.color=T.txt2;e.currentTarget.style.borderColor="rgba(59,158,255,0.35)";} }}
                  onMouseLeave={e=>{ if(viewMode!=="list"){e.currentTarget.style.color=T.txt4;e.currentTarget.style.borderColor="rgba(26,53,85,0.5)";} }}>
                  {viewMode==="cards"?"⊟ List":"⊞ Cards"}
                </button>
              )}
              <ShortcutChip/>
            </div>

            {query&&totalMatches===0&&(
              <div style={{textAlign:"center",padding:"60px 0"}}>
                <div style={{fontSize:32,marginBottom:12,opacity:.3}}>🔍</div>
                <div style={{fontSize:14,color:T.txt3}}>No hubs match <strong style={{color:T.txt2}}>"{query}"</strong></div>
                <button onClick={()=>setQuery("")} style={{marginTop:12,fontSize:11,color:T.blue,background:"transparent",border:"none"}}>Clear search</button>
              </div>
            )}

            {displayGroups.map(g=>(
              <GroupSection key={g.label} group={g} query={query} viewMode={effectiveView}
                defaultCollapsed={g.label==="Critical Protocols"&&activeTab==="All"&&!query}/>
            ))}

            <div style={{borderTop:"1px solid rgba(26,53,85,0.4)",paddingTop:14,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
              <span style={{fontSize:10,fontWeight:700,color:T.txt4,fontFamily:"'Playfair Display',serif"}}>Notrya</span>
              <span style={{fontSize:9,color:T.txt4}}>Clinical decision support only — not a substitute for clinical judgment. Powered by Claude (Anthropic).</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}