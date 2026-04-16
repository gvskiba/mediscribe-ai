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
    @keyframes nh-ring{0%,100%{box-shadow:0 0 0 0 rgba(255,61,61,0.7)}65%{box-shadow:0 0 0 7px rgba(255,61,61,0)}}
    @keyframes nh-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
    @keyframes nh-shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
    .nh-card{transition:background .14s,border-color .14s,box-shadow .14s}
    .nh-card:hover{box-shadow:0 4px 20px rgba(0,0,0,0.25)!important;transform:translateY(-1px)}
    .nh-star{opacity:0;transition:opacity .12s}.nh-card:hover .nh-star,.nh-star-on{opacity:1!important}
    .nh-row{transition:background .12s}.nh-row:hover{background:rgba(59,158,255,0.05)!important}
    .nh-qa{transition:all .13s}.nh-qa:hover{transform:translateY(-1px)}
    .nh-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:8px}
    .nh-srch::placeholder{color:#3a5f80}.nh-srch:focus{outline:none}
    .nh-scroll{overflow-x:auto;scrollbar-width:none}.nh-scroll::-webkit-scrollbar{display:none}
    .nh-layout{display:grid;grid-template-columns:296px 1fr;gap:16px;align-items:start}
    .nh-left{position:sticky;top:20px;max-height:calc(100vh - 40px);overflow-y:auto}
    .nh-inp{background:rgba(5,20,40,0.9);border:1px solid rgba(26,53,85,0.5);border-radius:8px;padding:8px 11px;color:#f2f7ff;font-size:12px;width:100%;transition:border-color .15s}
    .nh-inp:focus{border-color:rgba(59,158,255,0.5)}
    .nh-sel{background:rgba(5,20,40,0.9);border:1px solid rgba(26,53,85,0.5);border-radius:8px;padding:7px 11px;color:#f2f7ff;font-size:11px;width:100%;appearance:none;cursor:pointer}
    .nh-badge-update{display:inline-flex;align-items:center;gap:3px;font-family:'JetBrains Mono',monospace;font-size:7px;font-weight:700;padding:1px 6px;border-radius:20px;letter-spacing:.3px;white-space:nowrap}
    .nh-handoff{animation:nh-pulse 3s ease-in-out infinite}
    @media(max-width:900px){.nh-layout{grid-template-columns:1fr!important}.nh-left{position:static;max-height:none}}
  `;
  document.head.appendChild(s);
})();

const T = {
  bg:"#050f1e", panel:"#081628",
  txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0", red:"#ff3d3d",
  cyan:"#00d4ff", rose:"#f472b6",
};

// ── Session state (module-scope) ────────────────────────────────────────────
const _s = {
  favorites:    new Set(["chestpain","sepsis","airway"]),
  recent:       [],           // [{id, ts}]
  shiftStart:   Date.now(),
  providerName: "",
  setupDone:    false,
  scratchpad:   "",
  handoffNotes: "",           // appended by scratchpad "Add to handoff"
  activePatId:  null,
};
const _subs = new Set();
const _notify = () => _subs.forEach(fn => fn());
function toggleFav(id) {
  _s.favorites.has(id) ? _s.favorites.delete(id) : _s.favorites.add(id);
  _notify();
}
function addRecent(id) {
  _s.recent = [{ id, ts: Date.now() },
    ..._s.recent.filter(r => r.id !== id)].slice(0, 6);
  _notify();
}
function useSession() {
  const [t, setT] = useState(0);
  useEffect(() => {
    const fn = () => setT(x => x + 1);
    _subs.add(fn);
    return () => _subs.delete(fn);
  }, []);
  return t;
}
function relTime(ts) {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

// ── Hub catalog ─────────────────────────────────────────────────────────────
const GROUPS = [
  { label:"Critical Care", color:T.coral, hubs:[
    { id:"sepsis",    route:"/SepsisHub",         icon:"🦠", title:"Sepsis Hub",          badge:"SSC 2021",    color:T.coral,  tags:["sepsis","qsofa","hour-1","bundle","antibiotics","sirs"],                    features:["qSOFA / SIRS","Hour-1 Bundle","Source ABX","AI Resistance"],      desc:"Sepsis-3 criteria, qSOFA, Hour-1 Bundle, source-based antibiotic tiers, AI resistance lookup." },
    { id:"airway",    route:"/AirwayHub",          icon:"🌬️", title:"Airway Hub",           badge:"DAS 2022",    color:T.blue,   tags:["airway","rsi","intubation","ardsnet","hfnc","cpap","bipap","cric"],         features:["RSI Calculator","ARDSNet TV","ROX / RSBI","CICO A–D"],              desc:"RSI weight-based dosing, DAS 2022 difficult airway algorithm, ARDSNet, HFNC/CPAP/BiPAP." },
    { id:"shock",     route:"/ShockHub",           icon:"⚡", title:"Shock Hub",            badge:"ACEP 2023",   color:T.coral,  tags:["shock","vasopressor","rush","hemodynamic"],                                 features:["4 Shock States","Vasopressor Ladder","RUSH Protocol","Endpoints"],   desc:"4 shock state profiles, vasopressor ladder with weight-based dosing, RUSH exam protocol." },
    { id:"resus",     route:"/ResusHub",           icon:"❤️", title:"Resus Hub",            badge:"ACLS·PALS",   color:"#ff4444",tags:["cardiac arrest","cpr","acls","pals","vfib","pea","rosc"],                    features:["VF / PEA / Asystole","CPR Timer","Epi Tracker","PALS Weight"],      desc:"Real-time ACLS — CPR timer, epinephrine tracker, H's & T's, post-ROSC checklist." },
    { id:"stroke",    route:"/StrokeHub",          icon:"🧠", title:"Stroke Hub",           badge:"AHA 2019",    color:T.purple, tags:["stroke","tpa","alteplase","nihss","lvo","thrombectomy","tnk"],               features:["Door-to-Needle","tPA Eligibility","Alteplase Dose","NIHSS"],         desc:"Door-to-needle timer, tPA checklist, alteplase 0.9 mg/kg, LVO simultaneous thrombectomy.", updates:["TNK ACEP 2024","Simultaneous tPA+EVT"] },
    { id:"trauma",    route:"/TraumaHub",          isNew:true, icon:"🚑", title:"Trauma Hub",  badge:"ATLS 10e",    color:T.orange, tags:["trauma","atls","mtp","txa","gcs","shock","nexus","hemorrhage"],              features:["ABCDE Survey","Shock Class","MTP 1:1:1","TXA CRASH-2"],             desc:"ATLS primary survey, 4-class hemorrhagic shock, MTP 1:1:1 (PROPPR), TXA CRASH-2 dosing." },
  ]},
  { label:"Chief Complaint", color:T.blue, hubs:[
    { id:"chestpain", route:"/ChestPainHub",       isNew:true, icon:"💓", title:"Chest Pain Hub",  badge:"HEART·EDACS", color:T.coral,  tags:["chest pain","heart score","acs","stemi","nstemi","troponin","edacs"],         features:["HEART Score","Serial Troponin","EDACS","ACS Protocol"],             desc:"HEART score, 0/1/3h hs-cTnI protocol, EDACS, ACS protocol, disposition matrix." },
    { id:"dyspnea",   route:"/DyspneaHub",         isNew:true, icon:"💨", title:"Dyspnea Hub",     badge:"BLUE·PE",     color:T.blue,   tags:["dyspnea","sob","chf","copd","asthma","pe","blue","bnp","perc","wells"],     features:["BLUE Protocol","PE Pathway","CHF / ADHF","COPD / Pneumonia"],       desc:"BLUE protocol, PERC + Wells PE pathway, CHF BNP + diuresis, COPD/asthma, CURB-65." },
    { id:"headache",  route:"/HeadacheHub",        isNew:true, icon:"🤕", title:"Headache Hub",    badge:"OTTAWA·SAH",  color:T.purple, tags:["headache","sah","migraine","ottawa","lp","xanthochromia","cluster"],          features:["SNOOP4 Red Flags","Ottawa SAH Rule","LP Interpretation","Treatment"],desc:"SNOOP4 red flags, Ottawa SAH Rule (100% sens), LP/xanthochromia, migraine cocktail." },
    { id:"abdpain",   route:"/AbdominalPainHub",   isNew:true, icon:"🔴", title:"Abdominal Pain Hub", badge:"ALVARADO", color:T.orange, tags:["abdominal","appendicitis","alvarado","bisap","pancreatitis","gi bleed","cholecystitis"],features:["Alvarado Score","BISAP","Glasgow-Blatchford","Tokyo 2018"],  desc:"Alvarado appendicitis, BISAP pancreatitis, Glasgow-Blatchford GI bleed, Tokyo cholangitis." },
    { id:"ams",       route:"/AMSHub",             isNew:true, icon:"😵‍💫",title:"AMS Hub",   badge:"AEIOU-TIPS",  color:T.purple, tags:["ams","altered mental status","delirium","cam-icu","rass","wernicke","encephalitis"],features:["AEIOU-TIPS","CAM-ICU","RASS Scale","Specific Syndromes"],       desc:"AEIOU-TIPS differential, CAM-ICU delirium, RASS, Wernicke, NCSE, PRES, hepatic encephalopathy." },
    { id:"syncope",   route:"/SyncopeHub",         icon:"💫",  title:"Syncope Hub",          badge:"SFSR·CSRS",   color:T.gold,   tags:["syncope","faint","sfsr","canadian","csrs"],                                 features:["SFSR + CSRS","High-Risk Features","Ottawa ECG","Disposition"],      desc:"SFSR (external validation caveat), Canadian Syncope Risk Score, high-risk features, disposition.", updates:["SFSR Caveat 2023"] },
    { id:"triage",    route:"/TriageHub",          icon:"🏷️",  title:"Triage Hub",           badge:"ESI v4",      color:T.gold,   tags:["triage","esi","ctas","priority"],                                           features:["ESI Algorithm","Peds Adjustments","CTAS Crosswalk","Flags"],        desc:"ESI v4 algorithm, pediatric triage adjustments, CTAS crosswalk, priority flags." },
  ]},
  { label:"Diagnostics", color:T.cyan, hubs:[
    { id:"ecg",       route:"/ECGHub",             icon:"📈",  title:"ECG Hub",              badge:"ACC/AHA",     color:T.cyan,   tags:["ecg","ekg","stemi","qtc","sgarbossa","arrhythmia","lbbb"],                  features:["Waveform Library","STEMI Equivalents","QTc Calc","Sgarbossa"],      desc:"SVG waveform library, STEMI equivalents, QTc calculator, Sgarbossa criteria, 8-step read." },
    { id:"labs",      route:"/LabInterpreter",     icon:"🧪",  title:"Lab Interpreter",      badge:"AI·PASTE",    color:T.green,  tags:["labs","cbc","bmp","lft","anion gap","ai interpretation"],                  features:["BMP / CBC / LFTs","Anion Gap / P/F","AI Interpretation","Critical Values"],desc:"Manual entry or paste-parse. AI interpretation with differential and action items." },
    { id:"scores",    route:"/ScoreHub",           icon:"🎯",  title:"Score Hub",            badge:"12+ TOOLS",   color:T.blue,   tags:["scores","heart","wells","perc","curb-65","ottawa","nexus","gcs"],             features:["HEART / Wells","Ottawa / NEXUS","CURB-65 / GCS","ABCD2"],           desc:"12+ validated scores auto-populated from encounter: HEART, Wells, Ottawa, GCS, ABCD2." },
    { id:"pocus",     route:"/POCUSHub",           icon:"🔊",  title:"POCUS Hub",            badge:"BEDSIDE",     color:T.cyan,   tags:["pocus","ultrasound","fast","efast","cardiac","lung","dvt","aaa"],           features:["Cardiac / Lung","FAST / eFAST","DVT Protocol","Soft Tissue"],       desc:"Cardiac, lung, FAST/eFAST, DVT, AAA protocols with standard views and image gallery." },
    { id:"radiology", route:"/ImagingInterpreter", icon:"🩻",  title:"Radiology Hub",        badge:"IMAGING",     color:T.txt3,   tags:["radiology","imaging","xray","ct","mri","plain film"],                       features:["Plain Film","CT / MRI Reads","Critical Findings","ED Patterns"],    desc:"Plain film, CT, and MRI rapid reads for common ED presentations." },
  ]},
  { label:"Pharmacology", color:T.teal, hubs:[
    { id:"erx",       route:"/ERx",               icon:"💊",  title:"ERx Hub",              badge:"ACEP 2023",   color:T.teal,   tags:["medications","prescribing","renal dosing","drug interactions","beers"],       features:["Renal Dosing","IV→PO Converter","Drug Interactions","Beers"],       desc:"Emergency prescribing, renal dosing, IV-to-PO, DDI checking, Beers criteria." },
    { id:"weightdose",route:"/WeightDoseHub",      icon:"⚖️",  title:"Weight Dose Hub",      badge:"30 DRUGS",    color:T.teal,   tags:["weight","dosing","rsi","vasopressors","infusion","reversal","pals"],         features:["RSI / Vasopressors","Live Infusion Calc","Reversal Agents","PALS"],  desc:"30 critical drugs, vasopressor weight-based dosing, live infusion calculator, PALS mode." },
    { id:"tox",       route:"/ToxHub",            icon:"☠️",  title:"Tox Hub",              badge:"ANTIDOTES",   color:T.coral,  tags:["tox","overdose","antidotes","rumack","toxidrome","co","opioid"],             features:["16 Antidotes","Rumack-Matthew","10 Protocols","CO Protocol"],        desc:"16 antidotes with dosing, Rumack-Matthew nomogram, toxidrome table, CO protocol.", updates:["CO Protocol ACEP 2025"] },
    { id:"pain",      route:"/PainHub",           icon:"🩺",  title:"Pain Hub",             badge:"MULTIMODAL",  color:T.orange, tags:["pain","analgesia","opioid","nerve block","ketamine","nsaid"],               features:["Acute Pain Ladder","Opioid Dosing","Nerve Blocks","Adjuncts"],       desc:"Acute pain ladder, opioid dosing, nerve block guide, ketamine protocols." },
  ]},
  { label:"Subspecialty", color:T.rose, hubs:[
    { id:"dvt",       route:"/DVTHub",            isNew:true, icon:"🩸",  title:"DVT / VTE Hub",    badge:"DOAC·WELLS",  color:T.blue,   tags:["dvt","vte","wells","doac","anticoagulation","rivaroxaban","apixaban"],        features:["Wells DVT Score","DOAC Selection","Renal Dosing","IVC Filter"],      desc:"Wells DVT score, all 4 DOACs with renal dosing, IVC filter criteria, special populations." },
    { id:"psych",     route:"/PsychHub",          icon:"💭",  title:"Psych Hub",            badge:"DROPERIDOL",  color:T.rose,   tags:["psych","agitation","si","hi","ciwa","intoxication","droperidol"],           features:["Agitation Protocol","SI/HI Risk","CIWA-Ar","9 Intox Syndromes"],   desc:"Droperidol + midazolam first-line agitation (ACEP 2023), SI/HI risk, CIWA, 9 intox syndromes.", updates:["Droperidol Level B ACEP 2023"] },
    { id:"peds",      route:"/PediatricHub",      isNew:true, icon:"🧒",  title:"Pediatric Hub",    badge:"PECARN",      color:T.green,  tags:["pediatric","peds","broselow","pecarn","fever","rochester","westley","croup"],features:["Broselow / Vitals","PECARN Head CT","Fever Workup","PALS Dosing"],  desc:"Broselow, age-based vitals, PECARN, Rochester fever criteria, PALS weight-based dosing." },
    { id:"obgyn",     route:"/OBGYNHub",          isNew:true, icon:"🤰",  title:"OB/GYN Hub",       badge:"ACOG 2020",   color:T.rose,   tags:["ectopic","pregnancy","preeclampsia","hellp","magnesium","torsion"],          features:["Ectopic / beta-hCG","Vaginal Bleeding","Preeclampsia","Torsion"],    desc:"Ectopic beta-hCG algorithm, vaginal bleeding by trimester, preeclampsia/HELLP, magnesium." },
    { id:"sepAbx",    route:"/SepsisAbxHub",      icon:"💉",  title:"Sepsis ABX Hub",       badge:"SOURCE-BASED", color:T.green,  tags:["sepsis","antibiotics","empiric","source","pid","pneumonia"],                features:["7 Source Sets","Empiric Tiers","Resistance","De-escalation"],        desc:"7 source-based empiric antibiotic sets, resistance lookup, de-escalation guidance." },
  ]},
  { label:"Procedures", color:T.orange, hubs:[
    { id:"ortho",     route:"/OrthoHub",          icon:"🦴",  title:"Ortho Hub",            badge:"AI-SPLINTS",  color:T.gold,   tags:["ortho","fracture","splint","cast","reduction","ottawa"],                     features:["Fracture ID","AI Splint Schematics","Reduction Guide","Ottawa Rules"],desc:"Fracture ID, AI-generated splint schematics, reduction technique guide, Ottawa rules." },
    { id:"wound",     route:"/WoundCareHub",      icon:"🩹",  title:"Wound Hub",            badge:"CLOSURE",     color:T.orange, tags:["wound","laceration","closure","suture","irrigation"],                        features:["Closure Selection","Suture Sizing","Wound Care","Irrigation"],       desc:"Laceration management, closure type selection, suture sizing, wound care instructions." },
    { id:"procedure", route:"/EDProcedureNotes",  icon:"🔧",  title:"Procedure Hub",        badge:"CPT CODES",   color:T.orange, tags:["procedure","cpt","consent","technique","lp","central line"],                 features:["Procedure Notes","CPT Codes","Consent Templates","Step-by-Step"],    desc:"Procedure note templates with CPT coding, consent guidance, and step-by-step technique." },
    { id:"surgical",  route:"/surgical-airway-hub", icon:"✂️", title:"Surgical Airway",    badge:"CRIC",        color:T.red,    tags:["cric","cricothyrotomy","surgical airway","cico"],                           features:["Rapid Cric","Surgical Technique","Landmark Guide","Equipment"],      desc:"Cricothyrotomy — rapid and surgical technique, landmark identification, equipment checklist." },
  ]},
  { label:"Workflow", color:T.teal, hubs:[
    { id:"huddle",    route:"/huddle-board",     icon:"🏥",  title:"Huddle Board",         badge:"REAL-TIME",   color:T.teal,   tags:["huddle","board","department","acuity","census","tasks","reassessment"], features:["Acuity Overview","Reassessment Timers","Task Tracking","Disposition Status"], desc:"Real-time department-level view of active patients, acuity, reassessment clocks, and task management." },
  ]},
  { label:"Documentation & Tools", color:T.purple, hubs:[
    { id:"autocoder", route:"/AutocoderHub",      icon:"📋",  title:"Autocoder Hub",        badge:"AI-POWERED",  color:T.purple, tags:["coding","icd-10","cpt","e&m","billing","ai"],                               features:["ICD-10 / CPT","E&M Calculator","Code Cart","AI Autocoder"],         desc:"AI-powered ICD-10/CPT coding, E&M level calculator, code cart, transmit-ready summaries." },
    { id:"discharge", route:"/SmartDischargeHub", icon:"🚪",  title:"Discharge Hub",        badge:"AI-POWERED",  color:T.gold,   tags:["discharge","instructions","ai","patient education","return precautions"],   features:["AI Instructions","Diagnosis-Specific","Med Reconciliation","Print"], desc:"AI-generated discharge instructions tailored to diagnosis, medications, and follow-up plan." },
    { id:"knowledge", route:"/KnowledgeBaseV2",   icon:"📖",  title:"Knowledge Base",       badge:"GUIDELINES",  color:T.purple, tags:["guidelines","evidence","trials","nnt","drug monograph"],                    features:["17 Guidelines","20 Trials","AI Summaries","NNT / NNH"],             desc:"17 guidelines, 20 landmark trials, AI evidence summaries, NNT/NNH data." },
    { id:"cardiac",   route:"/cardiac-hub",       icon:"🫀",  title:"Cardiac Hub",          badge:"ACS·CHF",     color:"#ff4444",tags:["cardiac","acs","stemi","chf","pacing","arrest"],                             features:["ACS / STEMI","CHF Management","Cardiac Arrest","Pacing"],           desc:"ACS workup, STEMI pathways, CHF management, cardiac arrest algorithms, pacing indications." },
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

// ── Track board helpers ─────────────────────────────────────────────────────
const PHASES = ["triage","demo","vitals","ros","pe","chart"];
function getAction(s) {
  const d = PHASES.filter(p => s?.[p]).length;
  return d === 0 ? { label:"Open",   color:T.blue  }
    : d === PHASES.length ? { label:"Sign",   color:T.gold  }
    : { label:"Resume", color:T.teal  };
}
function esiColor(l) { return l <= 2 ? T.red : l === 3 ? T.orange : T.teal; }
function parseDoorMin(s) {
  if (!s) return 0;
  const h = s.match(/(\d+)h/), m = s.match(/(\d+)m/), c = s.match(/^(\d+):(\d+)$/);
  if (c) return parseInt(c[1]) * 60 + parseInt(c[2]);
  return (h ? parseInt(h[1]) * 60 : 0) + (m ? parseInt(m[1]) : parseInt(s) || 0);
}
function useShiftTime() {
  const [e, setE] = useState(0);
  useEffect(() => {
    const tick = () => setE(Math.floor((Date.now() - _s.shiftStart) / 60000));
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);
  const h = Math.floor(e / 60), m = e % 60;
  return { display: h > 0 ? `${h}h ${m.toString().padStart(2,"0")}m` : `${m}m`, totalMin: e };
}

// ── Background ──────────────────────────────────────────────────────────────
function BgMesh() {
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
      {[
        { sz:500, s:{ top:"-100px", left:"-60px"  }, c:"rgba(0,229,192,0.04)",   a:"nh-f1 18s ease-in-out infinite" },
        { sz:420, s:{ top:"45%", right:"-100px"   }, c:"rgba(59,158,255,0.03)",  a:"nh-f2 22s ease-in-out infinite" },
        { sz:360, s:{ bottom:"-60px", left:"40%"  }, c:"rgba(155,109,255,0.03)", a:"nh-f3 26s ease-in-out infinite" },
      ].map((b, i) => (
        <div key={i} style={{ position:"absolute", width:b.sz, height:b.sz,
          borderRadius:"50%", ...b.s,
          background:`radial-gradient(circle,${b.c} 0%,transparent 70%)`,
          animation:b.a }} />
      ))}
    </div>
  );
}

// ── Setup card ──────────────────────────────────────────────────────────────
function SetupCard({ onDone }) {
  const [name,     setName]     = useState("");
  const [ago,      setAgo]      = useState("0");
  const [practice, setPractice] = useState("general");

  const PRACTICE_DEFAULTS = {
    general: ["chestpain","sepsis","airway"],
    peds:    ["peds","weightdose","airway"],
    trauma:  ["trauma","shock","airway"],
    rural:   ["airway","resus","erx"],
  };

  const submit = () => {
    _s.providerName = name.trim() || "Provider";
    _s.shiftStart   = Date.now() - parseInt(ago) * 60000;
    _s.setupDone    = true;
    // Set practice-appropriate default pins
    _s.favorites = new Set(PRACTICE_DEFAULTS[practice] || PRACTICE_DEFAULTS.general);
    _notify();
    onDone();
  };
  return (
    <div style={{ padding:"13px", borderRadius:12, marginBottom:12,
      background:"rgba(5,15,30,0.95)",
      border:"1px solid rgba(59,158,255,0.3)",
      boxShadow:"0 4px 24px rgba(0,0,0,0.4)", animation:"nh-in .2s ease" }}>
      <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
        fontSize:13, color:T.txt, marginBottom:10 }}>Configure your shift</div>

      <div style={{ marginBottom:8 }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7.5,
          color:T.txt4, letterSpacing:1, textTransform:"uppercase",
          marginBottom:4 }}>Your name</div>
        <input className="nh-inp" value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") submit(); }}
          placeholder="Dr. Garcia" autoFocus />
      </div>

      <div style={{ marginBottom:12 }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7.5,
          color:T.txt4, letterSpacing:1, textTransform:"uppercase",
          marginBottom:4 }}>Shift started</div>
        <select className="nh-sel" value={ago} onChange={e => setAgo(e.target.value)}
          style={{ background:"rgba(5,20,40,0.9)",
            border:"1px solid rgba(26,53,85,0.5)",
            borderRadius:8, padding:"7px 11px",
            color:T.txt, fontSize:11, width:"100%" }}>
          {[["0","Just now"],["60","1 hour ago"],["120","2 hours ago"],
            ["240","4 hours ago"],["480","8 hours ago"],["720","12 hours ago"]
          ].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      <div style={{ marginBottom:12 }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7.5,
          color:T.txt4, letterSpacing:1, textTransform:"uppercase",
          marginBottom:4 }}>Practice type</div>
        <select className="nh-sel" value={practice}
          onChange={e => setPractice(e.target.value)}
          style={{ background:"rgba(5,20,40,0.9)",
            border:"1px solid rgba(26,53,85,0.5)",
            borderRadius:8, padding:"7px 11px",
            color:T.txt, fontSize:11, width:"100%" }}>
          {[
            ["general","General Emergency Medicine"],
            ["peds",   "Pediatric Emergency"],
            ["trauma", "Trauma / Level I Center"],
            ["rural",  "Rural / Critical Access"],
          ].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
          color:T.txt4, marginTop:3 }}>
          Sets your default pinned hubs for this shift
        </div>
      </div>

      <button onClick={submit}
        style={{ width:"100%", padding:"9px", borderRadius:9, border:"none",
          background:"linear-gradient(135deg,#3b9eff,#00e5c0)",
          color:"#050f1e", fontWeight:700, fontSize:12,
          boxShadow:"0 2px 12px rgba(59,158,255,0.3)" }}>
        Start Shift
      </button>
    </div>
  );
}

// ── Compact patient row ─────────────────────────────────────────────────────
function CompactRow({ p }) {
  const act    = getAction(p.chartStatus);
  const ec     = esiColor(p.esiLevel);
  const dtMin  = parseDoorMin(p.doorTime);
  const dtCol  = dtMin >= 120 ? T.red : dtMin >= 60 ? T.orange : T.txt4;
  return (
    <div className="nh-row"
      style={{ display:"grid", gridTemplateColumns:"26px 1fr auto auto",
        gap:8, padding:"8px 12px", alignItems:"center",
        borderBottom:"1px solid rgba(26,53,85,0.28)", cursor:"pointer" }}
      onClick={() => { addRecent("npi"); window.location.href = "/NewPatientInput"; }}>
      <div style={{ width:26, height:26, borderRadius:7,
        display:"flex", alignItems:"center", justifyContent:"center",
        background:ec + "20", border:`1px solid ${ec}45`,
        animation:p.esiLevel <= 2 ? "nh-ring 1.6s ease-out infinite" : "none",
        fontFamily:"'JetBrains Mono',monospace",
        fontSize:11, fontWeight:700, color:ec }}>{p.esiLevel}</div>
      <div style={{ minWidth:0 }}>
        <div style={{ fontSize:11.5, fontWeight:600, color:T.txt,
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {p.name}
        </div>
        <div style={{ fontSize:9, color:T.txt4,
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {p.cc}
        </div>
      </div>
      <div style={{ textAlign:"right" }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace",
          fontSize:9, color:dtCol, fontWeight:dtMin >= 60 ? 700 : 400 }}>
          {p.doorTime}
        </div>
        <div style={{ display:"flex", gap:2, marginTop:2, justifyContent:"flex-end" }}>
          {PHASES.map((ph, i) => (
            <div key={i} style={{ width:5, height:5, borderRadius:"50%",
              background:p.chartStatus?.[ph] ? T.teal : "rgba(42,79,122,0.4)" }} />
          ))}
        </div>
      </div>
      <button onClick={e => { e.stopPropagation(); window.location.href = "/NewPatientInput"; }}
        style={{ fontSize:9, fontWeight:700, padding:"4px 8px", borderRadius:6,
          fontFamily:"'JetBrains Mono',monospace",
          border:`1px solid ${act.color}40`,
          background:act.color + "14", color:act.color,
          transition:"background .12s", whiteSpace:"nowrap" }}
        onMouseEnter={e => { e.currentTarget.style.background = act.color + "28"; }}
        onMouseLeave={e => { e.currentTarget.style.background = act.color + "14"; }}>
        {act.label} →
      </button>
    </div>
  );
}

// ── Dashboard panel ─────────────────────────────────────────────────────────
function DashboardPanel({ patients }) {
  useSession();
  const [showSetup, setShowSetup] = useState(!_s.setupDone);
  const [showScratch, setShowScratch] = useState(false);
  const [scratch, setScratch] = useState(_s.scratchpad);
  const { display:elapsed, totalMin } = useShiftTime();
  const now = new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });

  const has        = patients.length > 0;
  const incomplete = patients.filter(p => {
    const d = PHASES.filter(ph => p.chartStatus?.[ph]).length;
    return d > 0 && d < PHASES.length;
  }).length;

  // Active encounter: most recent patient with in-progress chart
  const activeEnc = patients.find(p => {
    const d = PHASES.filter(ph => p.chartStatus?.[ph]).length;
    return d > 0 && d < PHASES.length;
  });

  // Department breakdown
  const esi12 = patients.filter(p => p.esiLevel <= 2).length;
  const esi3  = patients.filter(p => p.esiLevel === 3).length;
  const esi45 = patients.filter(p => p.esiLevel >= 4).length;

  // Favorites
  const favHubs = [..._s.favorites].map(id => HUB_MAP[id]).filter(Boolean);

  const QUICK = [
    { icon:"⚖️", label:"RSI / Dose",  route:"/weight-dose",    color:T.teal   },
    { icon:"🚨", label:"TXA / MTP",   route:"/TraumaHub",      color:T.orange },
    { icon:"💓", label:"HEART Score", route:"/ChestPainHub",   color:T.coral  },
    { icon:"🦠", label:"Sepsis ABX",  route:"/SepsisAbxHub",   color:T.green  },
  ];

  return (
    <div className="nh-left" style={{ animation:"nh-in .2s ease" }}>

      {/* Brand + gear */}
      <div style={{ display:"flex", alignItems:"center",
        justifyContent:"space-between", marginBottom:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:28, height:28, borderRadius:8,
            background:"linear-gradient(135deg,#3b9eff,#00e5c0)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:13, fontWeight:700, color:"#050f1e" }}>N</div>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:T.txt,
              fontFamily:"'Playfair Display',serif", lineHeight:1.1 }}>
              {_s.providerName ? `Dr. ${_s.providerName.replace(/^dr\.?\s*/i,"").trim()}` : "Notrya"}
            </div>
            <div style={{ fontSize:8, color:T.txt4,
              fontFamily:"'JetBrains Mono',monospace" }}>Emergency Medicine</div>
          </div>
        </div>
        <button onClick={() => setShowSetup(p => !p)}
          title="Shift settings"
          style={{ background:"transparent", border:"none",
            fontSize:14, color:T.txt4, padding:"4px",
            transition:"color .12s" }}
          onMouseEnter={e => { e.currentTarget.style.color = T.txt2; }}
          onMouseLeave={e => { e.currentTarget.style.color = T.txt4; }}>
          ⚙️
        </button>
      </div>

      {/* Setup card */}
      {showSetup && <SetupCard onDone={() => setShowSetup(false)} />}

      {/* Shift stats */}
      {!showSetup && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr",
          gap:5, marginBottom:10 }}>
          {[
            { label:"TIME",       val:now,             color:T.txt3 },
            { label:"ELAPSED",    val:elapsed,         color:T.txt4 },
            { label:"PATIENTS",   val:patients.length, color:T.teal },
            { label:"INCOMPLETE", val:incomplete,      color:incomplete > 0 ? T.orange : T.txt4 },
          ].map(s => (
            <div key={s.label} style={{ padding:"6px 9px", borderRadius:8,
              background:"rgba(8,22,44,0.8)",
              border:"1px solid rgba(26,53,85,0.45)" }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:7, color:T.txt4, letterSpacing:1, marginBottom:2 }}>
                {s.label}
              </div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:13, fontWeight:700, color:s.color }}>{s.val}</div>
            </div>
          ))}
        </div>
      )}

      {/* Department summary */}
      {has && !showSetup && (
        <div style={{ display:"flex", alignItems:"center", gap:5,
          padding:"5px 9px", borderRadius:8, marginBottom:8, flexWrap:"wrap",
          background:"rgba(8,22,44,0.6)",
          border:"1px solid rgba(26,53,85,0.4)" }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace",
            fontSize:9, fontWeight:700, color:T.txt3 }}>
            {patients.length} pts
          </span>
          {esi12 > 0 && (
            <>
              <span style={{ color:T.txt4, fontSize:9 }}>·</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:9, fontWeight:700, color:T.red }}>
                ESI 1–2: {esi12}
              </span>
            </>
          )}
          {esi3 > 0 && (
            <>
              <span style={{ color:T.txt4, fontSize:9 }}>·</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:9, color:T.orange }}>ESI 3: {esi3}</span>
            </>
          )}
          {esi45 > 0 && (
            <>
              <span style={{ color:T.txt4, fontSize:9 }}>·</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:9, color:T.txt4 }}>ESI 4–5: {esi45}</span>
            </>
          )}
          {incomplete > 0 && (
            <>
              <span style={{ color:T.txt4, fontSize:9 }}>·</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:9, color:T.orange }}>{incomplete} incomplete</span>
            </>
          )}
        </div>
      )}

      {/* Critical alert */}
      {!showSetup && esi12 > 0 && (
        <div style={{ padding:"7px 10px", borderRadius:9, marginBottom:8,
          background:"rgba(255,61,61,0.07)",
          border:"1px solid rgba(255,61,61,0.35)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:5 }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:T.red,
              animation:"nh-ring 1.4s ease-out infinite", flexShrink:0 }} />
            <span style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:8, fontWeight:700, color:T.red, letterSpacing:1.5 }}>
              {esi12} CRITICAL PATIENT{esi12 !== 1 ? "S" : ""}
            </span>
          </div>
          {patients.filter(p => p.esiLevel <= 2).map(p => {
            const dtMin = parseDoorMin(p.doorTime);
            return (
              <button key={p.id}
                onClick={() => { window.location.href = "/NewPatientInput"; }}
                style={{ display:"flex", alignItems:"center", gap:5,
                  width:"100%", padding:"4px 0", background:"transparent",
                  border:"none", textAlign:"left", cursor:"pointer" }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:9, fontWeight:700, color:T.red,
                  flexShrink:0 }}>ESI {p.esiLevel}</span>
                <span style={{ fontSize:10, color:T.txt2, fontWeight:600 }}>
                  {p.name}
                </span>
                {p.room && (
                  <span style={{ fontSize:9, color:T.txt4 }}>Rm {p.room}</span>
                )}
                <span style={{ fontSize:9, color:T.txt4,
                  overflow:"hidden", textOverflow:"ellipsis",
                  whiteSpace:"nowrap", flex:1 }}>— {p.cc}</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:9, fontWeight:700, flexShrink:0,
                  color:dtMin >= 60 ? T.red : T.coral }}>
                  {p.doorTime}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Active encounter chip */}
      {activeEnc && !showSetup && (
        <button
          onClick={() => { window.location.href = "/NewPatientInput"; }}
          style={{ display:"flex", alignItems:"center", gap:8, width:"100%",
            padding:"8px 10px", borderRadius:9, marginBottom:8,
            background:"rgba(59,158,255,0.09)",
            border:"1px solid rgba(59,158,255,0.35)",
            cursor:"pointer", textAlign:"left", transition:"background .12s" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(59,158,255,0.16)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(59,158,255,0.09)"; }}>
          <div style={{ width:26, height:26, borderRadius:7, flexShrink:0,
            display:"flex", alignItems:"center", justifyContent:"center",
            background:esiColor(activeEnc.esiLevel) + "20",
            border:`1px solid ${esiColor(activeEnc.esiLevel)}45`,
            fontFamily:"'JetBrains Mono',monospace",
            fontSize:10, fontWeight:700,
            color:esiColor(activeEnc.esiLevel) }}>
            {activeEnc.esiLevel}
          </div>
          <div style={{ minWidth:0, flex:1 }}>
            <div style={{ fontSize:11, fontWeight:700, color:T.blue,
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {activeEnc.name}
            </div>
            <div style={{ fontSize:9, color:T.txt4,
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {activeEnc.cc} · {activeEnc.doorTime}
            </div>
          </div>
          <span style={{ fontFamily:"'JetBrains Mono',monospace",
            fontSize:9, color:T.blue, flexShrink:0 }}>Resume →</span>
        </button>
      )}

      {/* Track board */}
      {!showSetup && (
        <div style={{ background:"rgba(8,22,44,0.75)",
          border:"1px solid rgba(26,53,85,0.55)",
          borderTop:`2px solid ${T.blue}55`,
          borderRadius:12, overflow:"hidden", marginBottom:10 }}>
          <div style={{ display:"flex", alignItems:"center",
            justifyContent:"space-between", padding:"9px 12px",
            borderBottom:"1px solid rgba(26,53,85,0.4)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:7 }}>
              <div style={{ width:6, height:6, borderRadius:"50%",
                background:has ? T.teal : T.txt4,
                animation:has ? "nh-pulse 2.5s infinite" : "none" }} />
              <span style={{ fontSize:11, fontWeight:700, color:T.txt,
                fontFamily:"'Playfair Display',serif" }}>Active Patients</span>
              {has && (
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:8, padding:"1px 6px", borderRadius:20,
                  background:T.teal + "14", border:`1px solid ${T.teal}30`,
                  color:T.teal }}>{patients.length}</span>
              )}
            </div>
            <button onClick={() => { window.location.href = "/NewPatientInput"; }}
              style={{ fontSize:9, fontWeight:700, color:"#050f1e",
                background:"linear-gradient(135deg,#00e5c0,#3b9eff)",
                border:"none", borderRadius:6, padding:"4px 10px" }}>
              + New
            </button>
          </div>
          {has
            ? patients.map(p => <CompactRow key={p.id} p={p} />)
            : (
              <div style={{ padding:"22px 12px", textAlign:"center" }}>
                <div style={{ fontSize:22, opacity:.25, marginBottom:6 }}>🏥</div>
                <div style={{ fontSize:11, color:T.txt4,
                  fontFamily:"'Playfair Display',serif" }}>Department clear</div>
                <button onClick={() => { window.location.href = "/NewPatientInput"; }}
                  style={{ marginTop:10, padding:"7px 16px", borderRadius:8,
                    border:"none", background:"linear-gradient(135deg,#00e5c0,#3b9eff)",
                    color:"#050f1e", fontWeight:700, fontSize:11 }}>
                  Start New Patient
                </button>
              </div>
            )}
          <button onClick={() => { window.location.href = "/EDTrackingBoard"; }}
            style={{ display:"block", width:"100%", padding:"6px",
              fontSize:9, color:T.txt4, background:"transparent",
              border:"none", borderTop:"1px solid rgba(26,53,85,0.3)",
              fontFamily:"'JetBrains Mono',monospace", letterSpacing:.5,
              transition:"color .12s" }}
            onMouseEnter={e => { e.currentTarget.style.color = T.txt2; }}
            onMouseLeave={e => { e.currentTarget.style.color = T.txt4; }}>
            Full Track Board →
          </button>
        </div>
      )}

      {/* Handoff prompt — appears at 8h */}
      {totalMin >= 480 && !showSetup && (
        <button
          className="nh-handoff"
          onClick={() => { window.location.href = "/NewPatientInput"; }}
          style={{ display:"flex", alignItems:"center", gap:8,
            width:"100%", padding:"8px 11px", borderRadius:9,
            marginBottom:10, cursor:"pointer",
            background:"rgba(245,200,66,0.08)",
            border:"1px solid rgba(245,200,66,0.35)" }}>
          <span style={{ fontSize:16, flexShrink:0 }}>🔔</span>
          <div style={{ textAlign:"left" }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700,
              fontSize:11, color:T.gold }}>
              Shift at {elapsed} — Generate Handoff
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",
              fontSize:9, color:T.txt4 }}>
              I-PASS auto-populated from your encounters
            </div>
          </div>
          <span style={{ fontFamily:"'JetBrains Mono',monospace",
            fontSize:9, color:T.gold, marginLeft:"auto", flexShrink:0 }}>→</span>
        </button>
      )}

      {/* On Shift — pinned + quick */}
      {!showSetup && (
        <div style={{ marginBottom:10 }}>
          <div style={{ display:"flex", alignItems:"center",
            justifyContent:"space-between", marginBottom:7 }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:7.5, fontWeight:700, color:T.gold,
              textTransform:"uppercase", letterSpacing:1.3 }}>★ On Shift</span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:7, color:T.txt4 }}>★ pin any hub</span>
          </div>
          {favHubs.map(h => (
            <button key={h.id}
              onClick={() => { addRecent(h.id); window.location.href = h.route; }}
              style={{ display:"flex", alignItems:"center", gap:8, width:"100%",
                padding:"7px 10px", borderRadius:8, border:"none", marginBottom:4,
                background:h.color + "10", borderLeft:`3px solid ${h.color}50`,
                cursor:"pointer", textAlign:"left", transition:"background .12s" }}
              onMouseEnter={e => { e.currentTarget.style.background = h.color + "1e"; }}
              onMouseLeave={e => { e.currentTarget.style.background = h.color + "10"; }}>
              <span style={{ fontSize:15, flexShrink:0 }}>{h.icon}</span>
              <div style={{ minWidth:0, flex:1 }}>
                <div style={{ fontSize:11, fontWeight:700, color:T.txt,
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {h.title}
                </div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:7, color:h.color }}>{h.badge}</div>
              </div>
              <button onClick={e => { e.stopPropagation(); toggleFav(h.id); }}
                style={{ marginLeft:"auto", background:"transparent",
                  border:"none", color:T.gold, fontSize:12,
                  padding:"2px", flexShrink:0 }}>★</button>
            </button>
          ))}
          <div style={{ height:1, background:"rgba(26,53,85,0.35)",
            margin:"8px 0 7px" }} />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:5 }}>
            {QUICK.map(q => (
              <button key={q.label} className="nh-qa"
                onClick={() => { window.location.href = q.route; }}
                style={{ display:"flex", alignItems:"center", gap:6,
                  padding:"6px 9px", borderRadius:7,
                  background:q.color + "0e",
                  border:`1px solid ${q.color}28`,
                  color:q.color }}>
                <span style={{ fontSize:13 }}>{q.icon}</span>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
                  fontSize:10, overflow:"hidden", textOverflow:"ellipsis",
                  whiteSpace:"nowrap" }}>{q.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent with timestamps */}
      {_s.recent.length > 0 && !showSetup && (
        <div style={{ marginBottom:10 }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7.5,
            fontWeight:700, color:T.txt4, textTransform:"uppercase",
            letterSpacing:1.3, marginBottom:6 }}>↺ Recent</div>
          <div className="nh-scroll" style={{ display:"flex", gap:5 }}>
            {_s.recent.map(({ id, ts }) => {
              const h = HUB_MAP[id];
              if (!h) return null;
              return (
                <button key={id}
                  onClick={() => { addRecent(id); window.location.href = h.route; }}
                  style={{ display:"flex", flexDirection:"column",
                    alignItems:"center", gap:2,
                    padding:"5px 9px", borderRadius:8, flexShrink:0,
                    background:"rgba(8,22,44,0.7)",
                    border:"1px solid rgba(26,53,85,0.45)",
                    cursor:"pointer", transition:"all .12s", minWidth:56 }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = h.color + "14";
                    e.currentTarget.style.borderColor = h.color + "44";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = "rgba(8,22,44,0.7)";
                    e.currentTarget.style.borderColor = "rgba(26,53,85,0.45)";
                  }}>
                  <span style={{ fontSize:14 }}>{h.icon}</span>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace",
                    fontSize:7, color:T.txt4, whiteSpace:"nowrap" }}>
                    {relTime(ts)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Scratchpad */}
      {!showSetup && (
        <div>
          <button onClick={() => setShowScratch(p => !p)}
            style={{ display:"flex", alignItems:"center", gap:6, width:"100%",
              padding:"5px 0", background:"transparent", border:"none",
              marginBottom:showScratch ? 6 : 0 }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7.5,
              fontWeight:700, color:T.txt4, textTransform:"uppercase",
              letterSpacing:1.3 }}>✏ Scratchpad</span>
            {scratch && !showScratch && (
              <span style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:7, color:T.txt4, marginLeft:"auto" }}>
                {scratch.split("\n").filter(Boolean).length} note{scratch.split("\n").filter(Boolean).length !== 1 ? "s" : ""}
              </span>
            )}
            <span style={{ fontSize:10, color:T.txt4, marginLeft:scratch ? 0 : "auto" }}>
              {showScratch ? "▲" : "▼"}
            </span>
          </button>
          {showScratch && (
            <div>
              <textarea value={scratch}
                onChange={e => { setScratch(e.target.value); _s.scratchpad = e.target.value; }}
                placeholder={"Recheck K+ Rm3 at 1800\nCall cardiology re: Rm7 before 3pm\n..."}
                style={{ width:"100%", height:88, padding:"8px 10px",
                  background:"rgba(5,20,40,0.9)",
                  border:"1px solid rgba(26,53,85,0.5)",
                  borderRadius:9, resize:"vertical",
                  fontFamily:"'DM Sans',sans-serif", fontSize:11,
                  color:T.txt2, lineHeight:1.6,
                  transition:"border-color .15s" }}
                onFocus={e => { e.target.style.borderColor = "rgba(59,158,255,0.5)"; }}
                onBlur={e  => { e.target.style.borderColor = "rgba(26,53,85,0.5)"; }} />
              {scratch.trim() && (
                <button
                  onClick={() => {
                    // Append scratchpad to session handoff notes for ShiftHandoffGenerator
                    _s.handoffNotes = (_s.handoffNotes || "") +
                      ((_s.handoffNotes || "").trim() ? "\n\n" : "") +
                      "--- Shift notes ---\n" + scratch.trim();
                    _notify();
                    window.location.href = "/NewPatientInput";
                  }}
                  style={{ display:"flex", alignItems:"center", gap:6,
                    marginTop:5, padding:"5px 11px", borderRadius:7,
                    background:"rgba(245,200,66,0.08)",
                    border:"1px solid rgba(245,200,66,0.3)",
                    color:T.gold, cursor:"pointer", fontSize:10,
                    fontFamily:"'DM Sans',sans-serif", fontWeight:600,
                    transition:"background .12s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(245,200,66,0.15)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(245,200,66,0.08)"; }}>
                  <span style={{ fontSize:12 }}>📋</span>
                  → Add to handoff
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Shortcut chip ────────────────────────────────────────────────────────────
function ShortcutChip() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = e => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  return (
    <div ref={ref} style={{ position:"relative" }}>
      <button onClick={() => setOpen(p => !p)}
        style={{ display:"flex", alignItems:"center", gap:5,
          padding:"5px 10px", borderRadius:7,
          background:"rgba(8,22,44,0.8)",
          border:`1px solid ${open ? "rgba(59,158,255,0.4)" : "rgba(26,53,85,0.5)"}`,
          color:open ? T.blue : T.txt4,
          fontFamily:"'JetBrains Mono',monospace", fontSize:9 }}>
        <span>⌨</span> Shortcuts
      </button>
      {open && (
        <div style={{ position:"absolute", right:0, top:"calc(100% + 6px)",
          zIndex:50, padding:"10px 13px", borderRadius:9, minWidth:172,
          background:"rgba(6,14,28,0.98)",
          border:"1px solid rgba(59,158,255,0.28)",
          boxShadow:"0 8px 28px rgba(0,0,0,0.6)",
          backdropFilter:"blur(20px)" }}>
          {[["/","Focus search"],["Esc","Clear search"],["⌘ K","Command palette"],["⌘ B","Track board overlay"],["Enter","Open focused hub"]].map(([k,d],i,a)=>(
            <div key={k} style={{ display:"flex", alignItems:"center",
              justifyContent:"space-between", gap:14, padding:"5px 0",
              borderBottom:i<a.length-1?"1px solid rgba(26,53,85,0.3)":"none" }}>
              <kbd style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                fontWeight:700, padding:"2px 7px", borderRadius:4,
                background:"rgba(59,158,255,0.1)",
                border:"1px solid rgba(59,158,255,0.28)", color:T.blue }}>{k}</kbd>
              <span style={{ fontFamily:"'DM Sans',sans-serif",
                fontSize:10, color:T.txt3 }}>{d}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Hub card ─────────────────────────────────────────────────────────────────
function HubCard({ hub }) {
  const [hov, setHov] = useState(false);
  useSession();
  const fav = _s.favorites.has(hub.id);
  return (
    <div className="nh-card"
      tabIndex={0}
      onClick={() => { addRecent(hub.id); window.location.href = hub.route; }}
      onKeyDown={e => { if (e.key === "Enter") { addRecent(hub.id); window.location.href = hub.route; } }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ padding:"11px 13px", borderRadius:11, cursor:"pointer",
        background:hov ? hub.color + "13" : hub.color + "09",
        border:`1px solid ${hov ? hub.color + "45" : hub.color + "22"}`,
        boxShadow:"none", display:"flex", flexDirection:"column", gap:6,
        position:"relative" }}>

      {/* Icon + title + badge + star */}
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <div style={{ width:30, height:30, borderRadius:9, flexShrink:0,
          background:hub.color + "16", border:`1px solid ${hub.color}28`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:15 }}>{hub.icon}</div>
        <div style={{ minWidth:0, flex:1 }}>
          <div style={{ fontSize:12.5, fontWeight:700, color:T.txt,
            fontFamily:"'Playfair Display',serif",
            lineHeight:1.2, marginBottom:3,
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {hub.title}
          </div>
          <span style={{ fontSize:7.5, fontFamily:"'JetBrains Mono',monospace",
            fontWeight:700, padding:"1px 6px", borderRadius:20,
            background:hub.color + "16", border:`1px solid ${hub.color}28`,
            color:hub.color, letterSpacing:".03em" }}>{hub.badge}</span>
        </div>
        <button className={`nh-star${fav ? " nh-star-on" : ""}`}
          onClick={e => { e.stopPropagation(); toggleFav(hub.id); }}
          title={fav ? "Unpin" : "Pin to On Shift"}
          style={{ background:"transparent", border:"none", flexShrink:0,
            fontSize:13, lineHeight:1, padding:"3px",
            color:fav ? T.gold : T.txt4, transition:"color .15s" }}>
          {fav ? "★" : "☆"}
        </button>
      </div>

      {/* Feature dots */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:"3px 10px" }}>
        {hub.features.map((f, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center",
            gap:4, fontSize:9, color:T.txt4, lineHeight:1.3 }}>
            <div style={{ width:3, height:3, borderRadius:"50%",
              background:hub.color, opacity:.65, flexShrink:0 }} />
            {f}
          </div>
        ))}
      </div>

      {/* Description — fixed 2-line height */}
      <div style={{ fontSize:10, color:hov ? T.txt3 : T.txt4,
        lineHeight:1.55, overflow:"hidden",
        display:"-webkit-box", WebkitLineClamp:2,
        WebkitBoxOrient:"vertical",
        transition:"color .15s",
        minHeight:"calc(10px * 1.55 * 2)" }}>
        {hub.desc}
      </div>

      {/* Update badges + NEW chip */}
      {(hub.isNew || (hub.updates && hub.updates.length > 0)) && (
        <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
          {hub.isNew && (
            <span className="nh-badge-update"
              style={{ color:T.green, background:T.green + "12",
                border:`1px solid ${T.green}30` }}>
              • NEW
            </span>
          )}
          {hub.updates && hub.updates.map((u, i) => (
            <span key={i} className="nh-badge-update"
              style={{ color:T.orange, background:T.orange + "12",
                border:`1px solid ${T.orange}30` }}>
              ↑ {u}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Group section ─────────────────────────────────────────────────────────────
function GroupSection({ group, query }) {
  const filtered = group.hubs.filter(h => hubMatches(h, query));
  if (!filtered.length) return null;
  return (
    <div style={{ marginBottom:22 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:9 }}>
        <div style={{ width:3, height:12, borderRadius:2,
          background:group.color, flexShrink:0 }} />
        <span style={{ fontSize:8.5, fontWeight:700, color:group.color,
          textTransform:"uppercase", letterSpacing:".1em",
          fontFamily:"'JetBrains Mono',monospace" }}>{group.label}</span>
        <div style={{ height:1, flex:1, background:group.color + "18" }} />
        <span style={{ fontSize:8, color:T.txt4,
          fontFamily:"'JetBrains Mono',monospace" }}>
          {filtered.length}{query && filtered.length < group.hubs.length
            ? ` of ${group.hubs.length}` : ""} hub{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="nh-grid">
        {filtered.map(h => <HubCard key={h.id} hub={h} />)}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function NotryaHome({ patients = [] }) {
  const [query, setQuery] = useState("");
  const searchRef = useRef(null);

  useEffect(() => {
    const h = e => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT"
        && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault(); searchRef.current?.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault(); searchRef.current?.focus();
      }
      if (e.key === "Escape") setQuery("");
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  const totalHubs    = GROUPS.reduce((n, g) => n + g.hubs.length, 0);
  const totalMatches = GROUPS.reduce((n, g) =>
    n + g.hubs.filter(h => hubMatches(h, query)).length, 0);

  return (
    <div style={{ minHeight:"100vh", background:T.bg, color:T.txt,
      fontFamily:"'DM Sans',sans-serif", position:"relative" }}>
      <BgMesh />
      <div style={{ position:"relative", zIndex:1,
        padding:"20px 20px 48px", maxWidth:1440, margin:"0 auto" }}>
        <div className="nh-layout">

          {/* Left dashboard */}
          <DashboardPanel patients={patients} />

          {/* Right hub directory */}
          <div>
            {/* Search */}
            <div style={{ display:"flex", alignItems:"center",
              gap:8, marginBottom:16 }}>
              <div style={{ flex:1, display:"flex", alignItems:"center",
                gap:8, padding:"0 13px", height:42, borderRadius:10,
                background:"rgba(8,22,44,0.9)",
                border:`1px solid ${query
                  ? "rgba(59,158,255,0.45)"
                  : "rgba(26,53,85,0.5)"}`,
                transition:"border-color .15s" }}>
                <svg width="13" height="13" viewBox="0 0 20 20" fill="none" style={{ flexShrink:0 }}>
                  <circle cx="8.5" cy="8.5" r="5.5"
                    stroke={query ? T.blue : T.txt4} strokeWidth="1.8"/>
                  <path d="M13 13l3.5 3.5"
                    stroke={query ? T.blue : T.txt4} strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
                <input ref={searchRef} className="nh-srch" value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={`Search ${totalHubs} hubs — scores, drugs, procedures…`}
                  style={{ flex:1, background:"transparent", border:"none",
                    fontFamily:"'DM Sans',sans-serif", fontSize:13,
                    color:T.txt, caretColor:T.blue }} />
                {query && (
                  <span style={{ fontFamily:"'JetBrains Mono',monospace",
                    fontSize:8, color:T.txt4, flexShrink:0 }}>
                    {totalMatches} match{totalMatches !== 1 ? "es" : ""}
                  </span>
                )}
                {query
                  ? <button onClick={() => setQuery("")}
                      style={{ background:"transparent", border:"none",
                        color:T.txt4, fontSize:17, lineHeight:1,
                        padding:"0 4px", flexShrink:0 }}
                      onMouseEnter={e => { e.currentTarget.style.color = T.coral; }}
                      onMouseLeave={e => { e.currentTarget.style.color = T.txt4; }}>×</button>
                  : <kbd style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                      color:T.txt4, background:"rgba(42,79,122,0.15)",
                      border:"1px solid rgba(42,79,122,0.3)",
                      borderRadius:4, padding:"2px 5px", flexShrink:0 }}>/</kbd>
                }
              </div>
              <ShortcutChip />
            </div>

            {query && totalMatches === 0 && (
              <div style={{ textAlign:"center", padding:"60px 0", color:T.txt4 }}>
                <div style={{ fontSize:32, marginBottom:12, opacity:.3 }}>🔍</div>
                <div style={{ fontSize:14, color:T.txt3 }}>
                  No hubs match <strong style={{ color:T.txt2 }}>"{query}"</strong>
                </div>
                <button onClick={() => setQuery("")}
                  style={{ marginTop:12, fontSize:11, color:T.blue,
                    background:"transparent", border:"none" }}>
                  Clear search
                </button>
              </div>
            )}

            {GROUPS.map(g => (
              <GroupSection key={g.label} group={g} query={query} />
            ))}

            <div style={{ borderTop:"1px solid rgba(26,53,85,0.4)", paddingTop:14,
              display:"flex", alignItems:"center",
              justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
              <span style={{ fontSize:10, fontWeight:700, color:T.txt4,
                fontFamily:"'Playfair Display',serif" }}>Notrya</span>
              <span style={{ fontSize:9, color:T.txt4 }}>
                Clinical decision support only — not a substitute for clinical judgment.
                Powered by Claude (Anthropic).
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}