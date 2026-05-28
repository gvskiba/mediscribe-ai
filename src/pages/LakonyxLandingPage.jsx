import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// ── Font + CSS injection ──────────────────────────────────────────────────────
(() => {
  if (document.getElementById("lxl-fonts")) return;
  const l = document.createElement("link");
  l.id = "lxl-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "lxl-css";
  s.textContent = `
    @keyframes lxl-fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
    @keyframes lxl-blink{0%,100%{opacity:1}50%{opacity:0.3}}
    @keyframes lxl-ring{0%,100%{box-shadow:0 0 0 0 rgba(10,191,191,0.28)}65%{box-shadow:0 0 0 26px rgba(10,191,191,0)}}
    @keyframes lxl-glow{0%,100%{box-shadow:0 4px 22px rgba(0,229,192,0.28),inset 0 1px 0 rgba(255,255,255,0.08)}50%{box-shadow:0 4px 48px rgba(0,229,192,0.52),inset 0 1px 0 rgba(255,255,255,0.12)}}
    @keyframes lxl-pulse-dot{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.4);opacity:.7}}
    @keyframes lxl-f1{0%,100%{transform:translate(0,0)}50%{transform:translate(55px,38px)}}
    @keyframes lxl-f2{0%,100%{transform:translate(0,0)}50%{transform:translate(-48px,55px)}}
    @keyframes lxl-f3{0%,100%{transform:translate(0,0)}50%{transform:translate(38px,-48px)}}
    @keyframes lxl-scan{0%{background-position:0 -100%}100%{background-position:0 200%}}
    @keyframes lxl-resume-in{from{opacity:0;transform:translateY(-8px) scale(.97)}to{opacity:1;transform:none}}
    @keyframes lxl-amber-pulse{0%,100%{box-shadow:0 0 0 0 rgba(255,159,67,0.35)}60%{box-shadow:0 0 0 10px rgba(255,159,67,0)}}
    @keyframes lxl-editor-in{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
    @keyframes lxl-drop-in{from{opacity:0;transform:translateY(-8px) scale(.98)}to{opacity:1;transform:none}}
    @keyframes lxl-inv-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
    @keyframes lxl-banner-in{from{opacity:0;transform:translateY(-10px) scale(.99)}to{opacity:1;transform:none}}
    @keyframes lxl-banner-out{from{opacity:1;transform:none;max-height:300px;margin-bottom:22px}to{opacity:0;transform:translateY(-8px) scale(.99);max-height:0;margin-bottom:0}}

    .lxl-s1{animation:lxl-fadeUp .55s .04s ease both}
    .lxl-s2{animation:lxl-fadeUp .55s .16s ease both}
    .lxl-s3{animation:lxl-fadeUp .55s .28s ease both}
    .lxl-s4{animation:lxl-fadeUp .55s .40s ease both}
    .lxl-s5{animation:lxl-fadeUp .55s .52s ease both}
    .lxl-s6{animation:lxl-fadeUp .55s .64s ease both}
    .lxl-s7{animation:lxl-fadeUp .55s .76s ease both}
    .lxl-s8{animation:lxl-fadeUp .55s .88s ease both}
    .lxl-s9{animation:lxl-fadeUp .55s 1.00s ease both}
    .lxl-s10{animation:lxl-fadeUp .55s 1.12s ease both}

    .lxl-blink{animation:lxl-blink 2.2s ease-in-out infinite}
    .lxl-dot{animation:lxl-pulse-dot 2.2s ease-in-out infinite}
    .lxl-begin{animation:lxl-glow 2.8s ease-in-out infinite;transition:all .2s;cursor:pointer;user-select:none}
    .lxl-begin:hover{transform:translateY(-2px);filter:brightness(1.08)}
    .lxl-begin:active{transform:translateY(0);filter:brightness(.94)}
    .lxl-resume{animation:lxl-resume-in .32s ease both,lxl-amber-pulse 2.6s 1s ease-in-out infinite;cursor:pointer;transition:filter .18s,transform .18s}
    .lxl-resume:hover{filter:brightness(1.1);transform:translateY(-1px)}
    .lxl-resume:active{transform:scale(.98)}
    .lxl-pill{transition:all .17s;cursor:pointer;user-select:none}
    .lxl-pill:hover{filter:brightness(1.08)}
    .lxl-pill:active{transform:scale(.96)}
    .lxl-inv{animation:lxl-inv-in .28s ease both}
    .lxl-inv-row{transition:background .15s,border-color .15s;cursor:pointer}
    .lxl-inv-row:hover{background:rgba(11,30,54,0.95)!important}
    .lxl-link{transition:color .15s,opacity .15s;cursor:pointer;user-select:none}
    .lxl-link:hover{opacity:1!important}
    .lxl-input:focus{border-color:rgba(0,229,192,0.5)!important;box-shadow:0 0 0 3px rgba(0,229,192,0.07)!important}
    .lxl-editor{animation:lxl-editor-in .22s ease both}
    .lxl-pencil{opacity:.38;transition:opacity .15s,transform .15s;cursor:pointer;user-select:none;line-height:1}
    .lxl-pencil:hover{opacity:.85;transform:scale(1.15)}
    .lxl-fac-input{transition:border-color .15s,box-shadow .15s}
    .lxl-fac-input:focus{border-color:rgba(201,168,76,0.55)!important;box-shadow:0 0 0 3px rgba(201,168,76,0.07)!important;outline:none}
    .lxl-rm{opacity:.35;transition:opacity .15s,transform .15s;cursor:pointer;flex-shrink:0;line-height:1}
    .lxl-rm:hover{opacity:.9;transform:scale(1.2)}
    .lxl-save-btn{transition:all .17s;cursor:pointer;user-select:none}
    .lxl-save-btn:hover{filter:brightness(1.1);transform:translateY(-1px)}
    .lxl-save-btn:active{transform:scale(.97)}

    /* ── Search ── */
    .lxl-search-wrap{position:relative;width:100%}
    .lxl-search-input{width:100%;padding:13px 16px 13px 44px;border-radius:12px;
      background:rgba(11,30,54,0.9);border:1.5px solid rgba(0,229,192,0.22);
      color:#f2f7ff;font-family:'DM Sans',sans-serif;font-size:14px;
      outline:none;box-sizing:border-box;caret-color:#00e5c0;
      transition:border-color .18s,box-shadow .18s;backdrop-filter:blur(8px)}
    .lxl-search-input::placeholder{color:rgba(90,130,168,0.6)}
    .lxl-search-input:focus{border-color:rgba(0,229,192,0.55)!important;box-shadow:0 0 0 3px rgba(0,229,192,0.09),0 4px 24px rgba(0,229,192,0.1)!important}
    .lxl-search-icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);
      font-size:15px;pointer-events:none;opacity:.5}
    .lxl-search-kbd{position:absolute;right:12px;top:50%;transform:translateY(-50%);
      font-family:'JetBrains Mono',monospace;font-size:9px;color:rgba(90,130,168,0.55);
      background:rgba(26,53,85,0.5);border:1px solid rgba(42,79,122,0.4);
      padding:2px 7px;border-radius:4px;pointer-events:none;
      transition:opacity .18s}
    .lxl-dropdown{position:absolute;top:calc(100% + 6px);left:0;right:0;
      background:rgba(7,13,26,0.98);border:1px solid rgba(0,229,192,0.18);
      border-radius:12px;z-index:100;overflow:hidden;
      box-shadow:0 16px 48px rgba(0,0,0,0.65);
      animation:lxl-drop-in .18s ease both;backdrop-filter:blur(16px)}
    .lxl-dr{display:flex;align-items:center;gap:11px;padding:11px 14px;
      cursor:pointer;transition:background .12s;border-bottom:1px solid rgba(26,53,85,0.35)}
    .lxl-dr:last-child{border-bottom:none}
    .lxl-dr:hover,.lxl-dr.active{background:rgba(0,229,192,0.07)}
    .lxl-dr.active{background:rgba(0,229,192,0.09)!important}
    .lxl-dr-icon{width:32px;height:32px;border-radius:8px;display:flex;
      align-items:center;justify-content:center;font-size:15px;flex-shrink:0}
    .lxl-dr-name{font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;
      color:#f2f7ff;line-height:1.2;margin-bottom:2px}
    .lxl-dr-sub{font-family:'JetBrains Mono',monospace;font-size:8px;color:rgba(130,174,206,0.7)}
    .lxl-dr-badge{font-family:'JetBrains Mono',monospace;font-size:7px;font-weight:700;
      padding:2px 7px;border-radius:10px;flex-shrink:0;margin-left:auto;letter-spacing:.04em}
    .lxl-dr-cat{font-family:'JetBrains Mono',monospace;font-size:7.5px;
      color:rgba(90,130,168,0.55);letter-spacing:.08em;text-transform:uppercase}
    .lxl-search-empty{padding:18px 16px;text-align:center;
      font-family:'JetBrains Mono',monospace;font-size:10px;
      color:rgba(90,130,168,0.5);letter-spacing:.08em}

    /* ── Quick-launch strip ── */
    .lxl-ql-scroll{overflow-x:auto;scrollbar-width:none;padding-bottom:2px}
    .lxl-ql-scroll::-webkit-scrollbar{display:none}
    .lxl-ql-chip{flex-shrink:0;display:flex;align-items:center;gap:8px;
      padding:9px 14px;border-radius:10px;cursor:pointer;
      transition:all .17s;user-select:none;white-space:nowrap}
    .lxl-ql-chip:hover{transform:translateY(-1px);filter:brightness(1.1)}
    .lxl-ql-chip:active{transform:scale(.96)}

    @media(max-width:580px){
      .lxl-pills{flex-wrap:wrap!important}
      .lxl-clock-num{font-size:28px!important}
      .lxl-search-input{font-size:13px}
    }
    @media(prefers-reduced-motion:reduce){
      *,*::before,*::after{animation:none!important;transition:none!important}
    }
  `;
  document.head.appendChild(s);
})();

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:"#050f1e", panel:"#070d1a", card:"#0b1e36",
  txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", blue:"#3b9eff", purple:"#9b6dff",
  orange:"#ff9f43", coral:"#ff6b6b", green:"#3dffa0", cyan:"#00d4ff",
};
const BRAND = { gold:"#C9A84C", teal:"#0ABFBF" };

// ── Constants ─────────────────────────────────────────────────────────────────
const DEFAULT_FACILITIES  = ["Spencer","Avera","HCA","Other"];
const FACILITY_STORAGE_KEY = "lxl_facilities";
const RECENT_HUBS_KEY      = "lxl_recent_hubs";

const DEPTS   = ["ED","ICU","Urgent Care","Peds ED","Trauma","Other"];
const LENGTHS = ["8h","10h","12h"];
const ENCOUNTER_KEYS = ["activeEncounter","currentEncounter","npi_encounter","lastEncounter"];

// ── Hub search index — 65+ hubs + embedded calculators ───────────────────────
const HUB_INDEX = [
  // ── Cardiac ──────────────────────────────────────────────────────────────
  { icon:"💓", name:"Chest Pain Hub",         cat:"Cardiac",      badge:"HEART·EDACS",  color:T.coral,  route:"CardiacRiskPage",    keys:["chest pain","acs","heart score","troponin","edacs","nstemi","stemi","mi"] },
  { icon:"📈", name:"ECG Hub",                cat:"Cardiac",      badge:"ACC/AHA",      color:T.cyan,   route:"ECGHub",             keys:["ecg","ekg","stemi","afib","atrial fibrillation","wide complex","av block","qtc","sgarbossa","wellens","brugada","lbbb"] },
  { icon:"💊", name:"Cardiac Risk Page",       cat:"Cardiac",      badge:"HEART·GRACE",  color:T.coral,  route:"CardiacRiskPage",    keys:["grace","timi","heart score","cardiac risk","troponin delta","disposition"] },
  { icon:"⚡", name:"Resuscitation Hub",       cat:"Cardiac",      badge:"AHA 2020",     color:T.coral,  route:"ResuscitationHub",   keys:["cpr","acls","cardiac arrest","vfib","pulseless","rosc","post-arrest","epinephrine","amiodarone"] },
  // ── Airway & Pulmonary ────────────────────────────────────────────────────
  { icon:"🌬️", name:"Airway Hub",             cat:"Airway",       badge:"DAS 2022",     color:T.blue,   route:"AirwayHub",          keys:["airway","rsi","intubation","crash","cric","bvm","sgga","hfnc","bipap","cpap","ards","difficult airway","das","cico"] },
  { icon:"🫁", name:"Ventilator Hub",          cat:"Pulmonary",    badge:"ARDSNet",      color:T.blue,   route:"AirwayHub",          keys:["vent","ventilator","tidal volume","peep","ardsnet","plateau pressure","fio2","driving pressure"] },
  // ── Critical Care & Sepsis ────────────────────────────────────────────────
  { icon:"🦠", name:"Sepsis Hub",             cat:"Critical Care", badge:"SSC 2021",    color:T.orange, route:"SepsisHub",          keys:["sepsis","septic shock","hour-1","bundle","antibiotics","norepinephrine","vasopressor","sofa","qsofa","lactate","cultures","sep-1"] },
  { icon:"💉", name:"Shock Hub",              cat:"Critical Care", badge:"UNIFIED",     color:T.orange, route:"ShockHub",           keys:["shock","hypotension","vasopressor","fluid resuscitation","distributive","obstructive","cardiogenic","hypovolemic","map","levophed"] },
  // ── Neurology ─────────────────────────────────────────────────────────────
  { icon:"🧠", name:"Stroke Hub",             cat:"Neurology",    badge:"AHA 2019",     color:T.purple, route:"StrokeHub",          keys:["stroke","tpa","alteplase","tnk","nihss","lvo","thrombectomy","door-to-needle","wake-up stroke","tia","dti"] },
  { icon:"⚡", name:"Seizure Hub",            cat:"Neurology",    badge:"AES 2022",     color:T.purple, route:"SeizureHub",         keys:["seizure","status epilepticus","lorazepam","levetiracetam","phenytoin","keppra","benzodiazepine","eclampsia"] },
  // ── Trauma ────────────────────────────────────────────────────────────────
  { icon:"🚑", name:"Trauma Hub",             cat:"Trauma",       badge:"ATLS 10e",     color:T.orange, route:"TraumaHub",          keys:["trauma","atls","massive transfusion","mtp","txa","tranexamic acid","abcde","primary survey","hemorrhage","penetrating"] },
  { icon:"🦴", name:"Ortho Hub",              cat:"Trauma",       badge:"ORTHO",        color:T.gold,   route:"OrthoHub",           keys:["fracture","splint","dislocation","reduction","nerve block","hematoma block","ortho","compartment","ottawa","nexus"] },
  // ── Toxicology ────────────────────────────────────────────────────────────
  { icon:"☠️", name:"Toxicology Hub",         cat:"Toxicology",   badge:"ACMT 2024",    color:T.green,  route:"ToxicologyHub",      keys:["tox","overdose","antidote","nac","acetaminophen","tylenol","fomepizole","naloxone","narcan","digoxin","buprenorphine","xylazine","tranq","co","carbon monoxide"] },
  { icon:"💊", name:"Dose Calculator",         cat:"Toxicology",   badge:"WEIGHT",       color:T.green,  route:"ToxicologyHub",      keys:["dose calc","weight based","pediatric dose","mg/kg","drip rate","infusion"] },
  // ── Documentation & Orders ────────────────────────────────────────────────
  { icon:"📋", name:"New Patient Input",       cat:"Documentation", badge:"NPI",         color:T.teal,   route:"NewPatientInput",    keys:["npi","new patient","hpi","encounter","chief complaint","vitals","smartfill","mdm","documentation"] },
  { icon:"🤖", name:"AI MDM Builder",          cat:"Documentation", badge:"CMS 2024",    color:T.purple, route:"NewPatientInput",    keys:["mdm","medical decision making","cms","e&m","billing","cpt","complexity","data reviewed","risk","attestation","split shared"] },
  { icon:"📝", name:"Order Generator Hub",     cat:"Documentation", badge:"CPOE",        color:T.blue,   route:"OrderGeneratorHub",  keys:["orders","cpoe","order set","bundle","medications","labs","imaging","admit orders","discharge"] },
  { icon:"🏥", name:"Clinical Note Studio",    cat:"Documentation", badge:"APSO",        color:T.teal,   route:"NewPatientInput",    keys:["note","soap","apso","discharge","instructions","sbar","handoff","pdqi","quality score"] },
  // ── Imaging & Diagnostics ─────────────────────────────────────────────────
  { icon:"🖼️", name:"Imaging Interpreter",    cat:"Diagnostics",  badge:"AI·VISION",    color:T.cyan,   route:"ImagingInterpreter", keys:["imaging","radiology","ct","xray","mri","ultrasound","pe","pulmonary embolism","wells","pesi","pioped","critical findings"] },
  { icon:"🫀", name:"POCUS Hub",              cat:"Diagnostics",  badge:"ACEP",         color:T.cyan,   route:"POCUSHub",           keys:["pocus","point of care","ultrasound","fast","efast","rush","cardiac","lung","effusion","pneumothorax","aorta","ivc"] },
  { icon:"🔬", name:"Lab Interpreter",         cat:"Diagnostics",  badge:"AI·PASTE",     color:T.green,  route:"LabInterpreter",     keys:["labs","bmp","cmp","cbc","lft","lactic","anion gap","critical values","abnormal","troponin","bnp","d-dimer"] },
  // ── Electrolytes & Metabolic ──────────────────────────────────────────────
  { icon:"⚗️", name:"Electrolyte Hub",         cat:"Metabolic",    badge:"ACID-BASE",    color:T.teal,   route:"ElectrolyteHub",     keys:["electrolytes","sodium","potassium","calcium","magnesium","hyponatremia","hyperkalemia","acidosis","alkalosis","anion gap","bicarb","ph","vbg"] },
  // ── Specialty ─────────────────────────────────────────────────────────────
  { icon:"🧪", name:"Triage Hub",             cat:"Nursing",      badge:"ESI",          color:T.gold,   route:"TriageHub",          keys:["triage","esi","acuity","chief complaint","arrival","ems","priority"] },
  { icon:"🧬", name:"Derm Hub",               cat:"Dermatology",  badge:"LRINEC",       color:T.orange, route:"DermatologyHub",     keys:["derm","skin","rash","necrotizing fasciitis","cellulitis","lrinec","sts","sjs","ten","bsa","erythema","abscess"] },
  { icon:"🩺", name:"Rapid Assessment Hub",   cat:"Workflow",     badge:"RAPID",        color:T.teal,   route:"RapidAssessmentHub", keys:["rapid","quick look","assessment","vitals","chief complaint","sick","not sick"] },
  { icon:"🧠", name:"Psych Hub",              cat:"Psychiatry",   badge:"UNIFIED",      color:T.purple, route:"PsychHub",           keys:["psych","psychiatric","suicidal","agitation","phq","columbia","haldol","ketamine","restraint","hold","baker act"] },
  { icon:"💊", name:"ERx Hub",               cat:"Pharmacology", badge:"UNIFIED",      color:T.green,  route:"ERxHub",             keys:["prescription","medications","discharge rx","opioid","controlled","drug interactions","pharmacy","dispense"] },
  { icon:"📊", name:"Autocoder Hub",          cat:"Billing",      badge:"ICD-10",       color:T.gold,   route:"AutocoderHub",       keys:["icd","billing","coding","diagnosis code","cpt","autocoder","revenue","charge capture"] },
  { icon:"🌐", name:"Lakonyx Anamnesis",       cat:"FHIR",         badge:"TEFCA",        color:T.cyan,   route:"AnamnesisPage",      keys:["fhir","carequality","commonwell","tefca","patient history","records","outside records","hie","interoperability"] },
  // ── Calculators (standalone) ──────────────────────────────────────────────
  { icon:"🧮", name:"HEART Score",            cat:"Calculator",   badge:"CARDIAC",      color:T.coral,  route:"CardiacRiskPage",    keys:["heart score","chest pain","low risk","acs","ecg changes","troponin","risk stratification"] },
  { icon:"🧮", name:"NIHSS Calculator",        cat:"Calculator",   badge:"STROKE",       color:T.purple, route:"StrokeHub",          keys:["nihss","stroke scale","neuro exam","consciousness","gaze","facial palsy","motor","sensory","language","neglect"] },
  { icon:"🧮", name:"qSOFA / SOFA Score",      cat:"Calculator",   badge:"SEPSIS",       color:T.orange, route:"SepsisHub",          keys:["qsofa","sofa","sepsis","organ dysfunction","altered","tachypnea","hypotension"] },
  { icon:"🧮", name:"Wells PE Score",          cat:"Calculator",   badge:"PE",           color:T.cyan,   route:"ImagingInterpreter", keys:["wells","pe","pulmonary embolism","dvt","pretest","ctpa","probability"] },
  { icon:"🧮", name:"Ottawa Rules",            cat:"Calculator",   badge:"TRAUMA",       color:T.gold,   route:"OrthoHub",           keys:["ottawa","ankle","knee","foot","xray","fracture","rules","clinical decision"] },
  { icon:"🧮", name:"CHA₂DS₂-VASc",           cat:"Calculator",   badge:"AFib",         color:T.cyan,   route:"ECGHub",             keys:["cha2ds2","chads","afib","anticoagulation","stroke risk","atrial fibrillation","warfarin","apixaban","score"] },
  { icon:"🧮", name:"GCS Score",              cat:"Calculator",   badge:"NEURO",        color:T.purple, route:"TraumaHub",           keys:["gcs","glasgow coma","altered","trauma","neuro","eye opening","verbal","motor"] },
  // ── Workflow shortcuts ────────────────────────────────────────────────────
  { icon:"🏥", name:"New Patient Input",       cat:"Workflow",     badge:"NPI",          color:T.teal,   route:"NewPatientInput",     keys:["new patient","encounter","npi","start","admit","chief complaint","hpi","vitals"] },
  { icon:"📝", name:"Quick Note",              cat:"Workflow",     badge:"APSO",         color:T.purple, route:"ClinicalNoteStudio",  keys:["quick note","note","soap","apso","documentation","sign","chart","clinical note studio"] },
  { icon:"📦", name:"Orders",                  cat:"Workflow",     badge:"CPOE",         color:T.blue,   route:"OrderGeneratorHub",   keys:["orders","order set","cpoe","medications","labs","imaging","admit orders","bundle"] },
  { icon:"⊞",  name:"Hub Page",               cat:"Workflow",     badge:"HOME",         color:T.gold,   route:"LakonyxHome",         keys:["hub","home","menu","hubs","all hubs","command","navigate","dashboard"] },
  { icon:"⚡", name:"Command Center",          cat:"Workflow",     badge:"SHIFT",        color:T.teal,   route:"CommandCenter",       keys:["command center","shift","active","dashboard","patients","tracking","trackboard"] },
];

// Default quick-launch — workflow-first, shown before any recents exist
const DEFAULT_QL = ["NewPatientInput","ClinicalNoteStudio","OrderGeneratorHub","LakonyxHome","CommandCenter"];

// Investor documents
const INV_DOCS = [
  { icon:"📊", label:"Platform Overview",      sub:"Full investor pitch · in-app",  color:T.teal,   route:"LakonyxInvestorPitch", live:true  },
  { icon:"📈", label:"Investor Pitch Deck",     sub:"10-slide PPTX · download",      color:T.gold,   route:null,                   live:false },
  { icon:"📄", label:"Executive One-Pager",     sub:"Problem · Solution · Team",     color:T.purple, route:null,                   live:false },
  { icon:"💰", label:"Financial Model",         sub:"5-yr P&L + valuation · XLSX",   color:T.orange, route:null,                   live:false },
  { icon:"🔒", label:"HIPAA Risk Analysis",     sub:"Risk matrix + remediation",     color:T.coral,  route:null,                   live:false },
  { icon:"⚖️", label:"BAA Vendor Checklist",    sub:"Base44 · Anthropic · FHIR",    color:T.blue,   route:null,                   live:false },
  { icon:"🗺️", label:"Vercel Migration Guide",  sub:"Next.js roadmap · PDF",         color:T.green,  route:null,                   live:false },
];

// ── Search helpers ────────────────────────────────────────────────────────────
function searchHubs(query) {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return HUB_INDEX.filter(h =>
    h.name.toLowerCase().includes(q) ||
    h.cat.toLowerCase().includes(q) ||
    h.badge.toLowerCase().includes(q) ||
    h.keys.some(k => k.includes(q))
  ).slice(0, 7);
}

// ── Ambient background ────────────────────────────────────────────────────────
function BgMesh() {
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden"}}>
      {[
        {sz:680,s:{top:"-120px",left:"-80px"},  c:"rgba(0,229,192,0.032)", a:"lxl-f1 22s ease-in-out infinite"},
        {sz:520,s:{top:"38%",right:"-120px"},   c:"rgba(59,158,255,0.024)",a:"lxl-f2 27s ease-in-out infinite"},
        {sz:420,s:{bottom:"-60px",left:"38%"},  c:"rgba(155,109,255,0.022)",a:"lxl-f3 31s ease-in-out infinite"},
      ].map((b,i) => (
        <div key={i} style={{position:"absolute",width:b.sz,height:b.sz,borderRadius:"50%",...b.s,
          background:`radial-gradient(circle,${b.c} 0%,transparent 70%)`,animation:b.a}}/>
      ))}
      <div style={{position:"absolute",inset:0,opacity:.012,
        backgroundImage:"linear-gradient(rgba(0,229,192,1) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,192,1) 1px,transparent 1px)",
        backgroundSize:"52px 52px"}}/>
    </div>
  );
}

// ── LX Monogram ───────────────────────────────────────────────────────────────
function LXMark({size=96}) {
  return (
    <div style={{width:size,height:size,borderRadius:Math.round(size*.2),background:"#0A1628",
      border:"1px solid rgba(201,168,76,0.4)",display:"flex",alignItems:"center",
      justifyContent:"center",position:"relative",animation:"lxl-ring 3.4s ease-out infinite",
      flexShrink:0,boxShadow:"0 0 0 1px rgba(11,191,191,0.1),0 14px 52px rgba(0,0,0,0.7)"}}>
      <div style={{position:"absolute",inset:0,borderRadius:"inherit",
        background:"radial-gradient(circle at 38% 40%,rgba(201,168,76,0.09) 0%,transparent 65%)",pointerEvents:"none"}}/>
      <div style={{position:"absolute",inset:0,borderRadius:"inherit",overflow:"hidden",pointerEvents:"none"}}>
        <div style={{position:"absolute",left:0,right:0,height:"30%",
          background:"linear-gradient(180deg,transparent 0%,rgba(0,229,192,0.04) 50%,transparent 100%)",
          animation:"lxl-scan 4s linear infinite"}}/>
      </div>
      <svg viewBox="0 0 500 500" width={Math.round(size*.74)} height={Math.round(size*.74)}
        xmlns="http://www.w3.org/2000/svg" style={{position:"relative",zIndex:1}}>
        <text x="106" y="305" fontFamily="'Playfair Display',Georgia,serif" fontSize="280" fontWeight="700" fill={BRAND.gold}>L</text>
        <text x="193" y="305" fontFamily="'Playfair Display',Georgia,serif" fontSize="280" fontWeight="700" fill={BRAND.teal}>X</text>
      </svg>
      <div className="lxl-dot" style={{position:"absolute",top:9,right:9,width:7,height:7,
        borderRadius:"50%",background:BRAND.teal,boxShadow:`0 0 7px ${BRAND.teal}`}}/>
    </div>
  );
}

// ── Live Clock ────────────────────────────────────────────────────────────────
function LiveClock() {
  const [t, setT] = useState({ h:"--", m:"--", s:"--", date:"" });
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      const pad = v => String(v).padStart(2,"0");
      setT({ h:pad(n.getHours()), m:pad(n.getMinutes()), s:pad(n.getSeconds()),
        date:n.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"}) });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  },[]);
  return (
    <div style={{padding:"14px 24px",borderRadius:12,
      background:"rgba(7,13,26,0.75)",border:"1px solid rgba(26,53,85,0.6)",
      backdropFilter:"blur(10px)",textAlign:"center"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:3,marginBottom:4}}>
        {[t.h, t.m].map((seg,i) => (
          <span key={i} style={{display:"flex",alignItems:"center",gap:3}}>
            <span className="lxl-clock-num" style={{fontFamily:"'JetBrains Mono',monospace",
              fontSize:34,fontWeight:700,color:T.txt,letterSpacing:".04em",lineHeight:1}}>{seg}</span>
            {i===0 && <span className="lxl-blink" style={{fontFamily:"'JetBrains Mono',monospace",
              fontSize:28,fontWeight:700,color:T.teal,lineHeight:1,margin:"0 1px"}}>:</span>}
          </span>
        ))}
        <span className="lxl-blink" style={{fontFamily:"'JetBrains Mono',monospace",
          fontSize:28,fontWeight:700,color:T.teal,lineHeight:1,margin:"0 1px"}}>:</span>
        <span className="lxl-clock-num" style={{fontFamily:"'JetBrains Mono',monospace",
          fontSize:34,fontWeight:700,color:T.txt4,letterSpacing:".04em",lineHeight:1}}>{t.s}</span>
      </div>
      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8.5,color:T.txt4,letterSpacing:".13em"}}>{t.date}</div>
    </div>
  );
}

// ── Global Search Bar ─────────────────────────────────────────────────────────
function GlobalSearch({ inputRef, onNavigate }) {
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState([]);
  const [cursor,  setCursor]  = useState(-1);
  const [focused, setFocused] = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    const r = searchHubs(query);
    setResults(r);
    setCursor(-1);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const h = e => {
      if (dropRef.current && !dropRef.current.contains(e.target) &&
          inputRef.current && !inputRef.current.contains(e.target)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const open = focused && (results.length > 0 || query.length > 0);

  const handleKey = e => {
    if (!open) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor(c => Math.min(c+1, results.length-1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setCursor(c => Math.max(c-1, -1)); }
    if (e.key === "Enter" && cursor >= 0 && results[cursor]) {
      e.stopPropagation();
      onNavigate(results[cursor].route, results[cursor]);
    }
    if (e.key === "Escape") { setFocused(false); setQuery(""); }
  };

  const pick = (hub) => {
    onNavigate(hub.route, hub);
    setQuery("");
    setFocused(false);
  };

  return (
    <div className="lxl-search-wrap" ref={dropRef}>
      <span className="lxl-search-icon">🔍</span>
      <input
        ref={inputRef}
        className="lxl-search-input"
        type="text"
        autoComplete="off"
        spellCheck={false}
        placeholder="Search hubs, calculators, protocols..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onKeyDown={handleKey}
      />
      {!focused && !query && (
        <span className="lxl-search-kbd">/ to search</span>
      )}

      {/* ── Dropdown ── */}
      {open && (
        <div className="lxl-dropdown">
          {results.length === 0 && (
            <div className="lxl-search-empty">No hubs matched "{query}"</div>
          )}
          {results.map((h, i) => (
            <div key={h.route + h.name} className={`lxl-dr${cursor===i?" active":""}`}
              onMouseEnter={() => setCursor(i)}
              onMouseDown={e => { e.preventDefault(); pick(h); }}>
              <div className="lxl-dr-icon"
                style={{background:h.color+"18", border:`1px solid ${h.color}28`}}>
                {h.icon}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div className="lxl-dr-name">{h.name}</div>
                <div className="lxl-dr-cat">{h.cat}</div>
              </div>
              <span className="lxl-dr-badge"
                style={{background:h.color+"18",border:`1px solid ${h.color}28`,color:h.color}}>
                {h.badge}
              </span>
            </div>
          ))}
          {results.length > 0 && (
            <div style={{padding:"6px 14px",display:"flex",gap:12,
              borderTop:"1px solid rgba(26,53,85,0.4)"}}>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7.5,color:T.txt4}}>↑↓ navigate</span>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7.5,color:T.txt4}}>↵ open hub</span>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7.5,color:T.txt4}}>Esc close</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Quick-Launch Strip ────────────────────────────────────────────────────────
function QuickLaunch({ recentRoutes, onNavigate }) {
  const routes = recentRoutes.length > 0 ? recentRoutes : DEFAULT_QL;
  const hubs   = routes.map(r => HUB_INDEX.find(h => h.route === r)).filter(Boolean).slice(0,5);
  if (hubs.length === 0) return null;
  return (
    <div style={{width:"100%"}}>
      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7.5,color:T.txt4,
        letterSpacing:".14em",textTransform:"uppercase",marginBottom:9,textAlign:"left"}}>
        {recentRoutes.length > 0 ? "Recent" : "Quick access"}
      </div>
      <div className="lxl-ql-scroll" style={{display:"flex",gap:7}}>
        {hubs.map(h => (
          <div key={h.route} className="lxl-ql-chip"
            onClick={() => onNavigate(h.route, h)}
            style={{background:`${h.color}10`,border:`1px solid ${h.color}28`}}>
            <span style={{fontSize:16}}>{h.icon}</span>
            <div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:700,
                color:T.txt2,lineHeight:1.2}}>{h.name.replace(" Hub","").replace(" Page","")}</div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,color:h.color,marginTop:1}}>{h.badge}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Pill Row ──────────────────────────────────────────────────────────────────
function PillRow({options, value, onChange, activeColor, activeTextColor="#050f1e", small=false}) {
  return (
    <div className="lxl-pills" style={{display:"flex",gap:6,justifyContent:"center",flexWrap:"wrap"}}>
      {options.map(opt => {
        const on = opt === value;
        return (
          <div key={opt} className="lxl-pill" onClick={() => onChange(opt)}
            style={{padding:small?"10px 16px":"10px 18px",borderRadius:8,minHeight:48,
              display:"flex",alignItems:"center",
              fontFamily:"'DM Sans',sans-serif",fontSize:small?11:12,fontWeight:on?700:500,
              color:on?activeTextColor:T.txt3,
              background:on?`linear-gradient(135deg,${activeColor},${activeColor}cc)`:"rgba(11,30,54,0.7)",
              border:`1px solid ${on?"transparent":"rgba(42,79,122,0.45)"}`,
              boxShadow:on?`0 2px 14px ${activeColor}40`:"none"}}>
            {opt}
          </div>
        );
      })}
    </div>
  );
}

// ── Resume Encounter Chip ─────────────────────────────────────────────────────
function ResumeChip({encounter, onResume}) {
  const age   = encounter.age || "—";
  const sex   = encounter.sex || "";
  const cc    = encounter.chiefComplaint || encounter.cc || "Active encounter";
  const dept  = encounter.dept || "";
  const label = [age && sex ? `${age}${sex}` : age, cc, dept].filter(Boolean).join(" · ");
  return (
    <div className="lxl-resume" onClick={onResume}
      style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"12px 16px",
        borderRadius:12,background:"rgba(255,159,67,0.07)",border:"1px solid rgba(255,159,67,0.32)"}}>
      <div style={{width:36,height:36,borderRadius:9,flexShrink:0,
        background:"rgba(255,159,67,0.14)",border:"1px solid rgba(255,159,67,0.3)",
        display:"flex",alignItems:"center",justifyContent:"center",fontSize:17}}>⚡</div>
      <div style={{flex:1,textAlign:"left",minWidth:0}}>
        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:700,
          color:T.orange,marginBottom:2}}>Resume Active Encounter</div>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.txt3,
          whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{label}</div>
      </div>
      <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:T.orange,flexShrink:0}}>→</span>
    </div>
  );
}

// ── Facility Inline Editor ────────────────────────────────────────────────────
function FacilityEditor({ drafts, onChange, onAdd, onRemove, onSave, onCancel }) {
  return (
    <div className="lxl-editor" style={{marginTop:10,display:"flex",flexDirection:"column",gap:8}}>
      {drafts.map((name, i) => (
        <div key={i} style={{display:"flex",alignItems:"center",gap:8}}>
          <input className="lxl-fac-input" value={name} maxLength={20}
            onChange={e => onChange(i, e.target.value)}
            style={{flex:1,padding:"8px 11px",borderRadius:8,
              background:"rgba(11,30,54,0.8)",border:"1px solid rgba(201,168,76,0.28)",
              color:T.txt,fontFamily:"'DM Sans',sans-serif",fontSize:12,
              boxSizing:"border-box",caretColor:BRAND.gold}}/>
          <span className="lxl-rm" onClick={() => onRemove(i)} style={{fontSize:14,color:T.coral}}>✕</span>
        </div>
      ))}
      {drafts.length < 6 && (
        <div onClick={onAdd}
          style={{display:"flex",alignItems:"center",gap:6,padding:"7px 10px",borderRadius:8,
            border:"1px dashed rgba(201,168,76,0.22)",cursor:"pointer",transition:"border-color .15s"}}
          onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(201,168,76,0.5)"}
          onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(201,168,76,0.22)"}>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:BRAND.gold,opacity:.6}}>+</span>
          <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.txt4}}>Add facility</span>
        </div>
      )}
      <div style={{display:"flex",gap:8,marginTop:2}}>
        <div className="lxl-save-btn" onClick={onSave}
          style={{flex:1,padding:"9px",borderRadius:8,textAlign:"center",
            fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:700,
            color:"#050f1e",background:`linear-gradient(135deg,${BRAND.gold},#e8b84b)`}}>Save</div>
        <div className="lxl-save-btn" onClick={onCancel}
          style={{flex:1,padding:"9px",borderRadius:8,textAlign:"center",
            fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,
            color:T.txt3,background:"rgba(11,30,54,0.7)",border:"1px solid rgba(42,79,122,0.45)"}}>Cancel</div>
      </div>
    </div>
  );
}

// ── Investor Panel ────────────────────────────────────────────────────────────
function InvPanel({onNavigate}) {
  return (
    <div className="lxl-inv" style={{width:"100%",marginTop:10,display:"flex",flexDirection:"column",gap:6}}>
      {INV_DOCS.map((doc,i) => (
        <div key={i} className="lxl-inv-row"
          onClick={() => doc.live && onNavigate(doc.route)}
          style={{display:"flex",alignItems:"center",gap:12,padding:"11px 14px",
            borderRadius:10,background:"rgba(11,30,54,0.55)",
            border:`1px solid ${doc.color}20`,cursor:doc.live?"pointer":"default"}}>
          <div style={{width:32,height:32,borderRadius:8,background:doc.color+"14",
            border:`1px solid ${doc.color}26`,display:"flex",alignItems:"center",
            justifyContent:"center",fontSize:15,flexShrink:0}}>{doc.icon}</div>
          <div style={{flex:1,textAlign:"left",minWidth:0}}>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:700,color:T.txt2,marginBottom:2}}>{doc.label}</div>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:doc.color}}>{doc.sub}</div>
          </div>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,
            color:doc.live?doc.color:"rgba(90,130,168,0.25)",flexShrink:0}}>
            {doc.live?"→":"↓"}
          </span>
        </div>
      ))}
      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7.5,
        color:"rgba(90,130,168,0.3)",letterSpacing:".07em",textAlign:"center",paddingTop:4}}>
        For institutional &amp; investor use · Not for clinical distribution
      </div>
    </div>
  );
}

// ── System Status Indicator ───────────────────────────────────────────────────
const STATUS_SERVICES = [
  { key:"ai",      label:"AI",      check: async () => { try { const r = await fetch("https://api.anthropic.com",{method:"HEAD",signal:AbortSignal.timeout(3000)}); return r.status < 500; } catch(_){ return false; } } },
  { key:"storage", label:"Storage", check: async () => typeof window !== "undefined" && !!window.storage },
  { key:"fhir",    label:"FHIR",    check: async () => true }, // static until Anamnesis endpoint is live
];

function SystemStatus() {
  const [svcs,   setSvcs]   = useState([]);
  const [overall,setOverall] = useState("checking");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const results = await Promise.all(
        STATUS_SERVICES.map(async s => ({ ...s, ok: await s.check() }))
      );
      if (cancelled) return;
      setSvcs(results);
      setOverall(results.every(r => r.ok) ? "ok" : results.some(r => r.ok) ? "degraded" : "down");
    })();
    return () => { cancelled = true; };
  }, []);

  const dot  = overall === "ok" ? "#3dffa0" : overall === "degraded" ? "#f5c842" : overall === "down" ? "#ff6b6b" : "#5a82a8";
  const label = overall === "ok" ? "All systems operational" : overall === "degraded" ? "Partial degradation" : overall === "down" ? "Service disruption" : "Checking...";

  return (
    <div style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",
      padding:"8px 14px",borderRadius:9,
      background:"rgba(7,13,26,0.6)",border:"1px solid rgba(26,53,85,0.45)"}}>
      <div style={{display:"flex",alignItems:"center",gap:7}}>
        <div style={{width:7,height:7,borderRadius:"50%",background:dot,
          boxShadow:`0 0 6px ${dot}`,flexShrink:0,
          animation:overall==="ok"?"lxl-pulse-dot 3s ease-in-out infinite":"none"}}/>
        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8.5,
          color:dot,letterSpacing:".05em"}}>{label}</span>
      </div>
      <div style={{display:"flex",gap:10}}>
        {svcs.map(s => (
          <div key={s.key} style={{display:"flex",alignItems:"center",gap:4}}>
            <div style={{width:5,height:5,borderRadius:"50%",
              background:s.ok?"#3dffa0":"#ff6b6b",flexShrink:0}}/>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,
              color:"rgba(90,130,168,0.7)",letterSpacing:".06em"}}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function LakonyxLanding() {
  const navigate   = useNavigate();
  const searchRef  = useRef(null);

  // Shift context
  const [facility,  setFacility]  = useState("Spencer");
  const [dept,      setDept]      = useState("ED");
  const [shiftLen,  setShiftLen]  = useState("12h");
  const [attending, setAttending] = useState("");
  const [showInv,   setShowInv]   = useState(false);

  // Facility editor
  const [facilities,      setFacilities]      = useState(DEFAULT_FACILITIES);
  const [editingFac,      setEditingFac]      = useState(false);
  const [draftFacilities, setDraftFacilities] = useState(DEFAULT_FACILITIES);

  // Resume encounter + recent hubs
  const [resumeEnc,     setResumeEnc]     = useState(null);
  const [recentHubs,    setRecentHubs]    = useState([]);

  // Load persisted data on mount
  useEffect(() => {
    (async () => {
      if (!window.storage) return;
      // Facilities
      try {
        const res = await window.storage.get(FACILITY_STORAGE_KEY);
        if (res?.value) {
          const saved = JSON.parse(res.value);
          if (Array.isArray(saved) && saved.length) { setFacilities(saved); setFacility(saved[0]); }
        }
      } catch(_) {}
      // Recent hubs
      try {
        const res = await window.storage.get(RECENT_HUBS_KEY);
        if (res?.value) {
          const saved = JSON.parse(res.value);
          if (Array.isArray(saved)) setRecentHubs(saved);
        }
      } catch(_) {}
      // Active encounter
      for (const key of ENCOUNTER_KEYS) {
        try {
          const res = await window.storage.get(key);
          if (res?.value) {
            const parsed = JSON.parse(res.value);
            if (parsed && (parsed.chiefComplaint || parsed.cc || parsed.age)) {
              setResumeEnc(parsed); break;
            }
          }
        } catch(_) {}
      }
    })();
  }, []);

  // Navigation — records recent hubs
  const goHub = useCallback(async (route, hub) => {
    if (hub) {
      const updated = [route, ...recentHubs.filter(r => r !== route)].slice(0, 5);
      setRecentHubs(updated);
      try { if (window.storage) await window.storage.set(RECENT_HUBS_KEY, JSON.stringify(updated)); } catch(_) {}
    }
    navigate(`/${route}`);
  }, [recentHubs, navigate]);

  // Begin shift — saves context, then navigates
  const beginShift = useCallback(async () => {
    const ctx = { facility, dept, shiftLen, attending, startedAt: new Date().toISOString() };
    try { if (window.storage) await window.storage.set("shiftContext", JSON.stringify(ctx)); } catch(_) {}
    navigate("/CommandCenter");
  }, [facility, dept, shiftLen, attending, navigate]);

  // Keyboard shortcuts
  useEffect(() => {
    const h = e => {
      // '/' focuses search
      if (e.key === "/" && document.activeElement !== searchRef.current) {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }
      // Enter → Begin Shift when not in search/input/editor
      if (e.key === "Enter" && !showInv && !editingFac &&
          document.activeElement !== searchRef.current &&
          document.activeElement?.tagName !== "INPUT") {
        beginShift();
      }
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [showInv, editingFac, beginShift]);

  // Facility editor handlers
  const openEditor    = () => { setDraftFacilities([...facilities]); setEditingFac(true); };
  const cancelEditor  = () => setEditingFac(false);
  const changeDraft   = (i, val) => setDraftFacilities(d => d.map((v,idx) => idx===i ? val : v));
  const addDraft      = () => setDraftFacilities(d => [...d, ""]);
  const removeDraft   = (i) => setDraftFacilities(d => d.filter((_,idx) => idx!==i));
  const saveFacilities = async () => {
    const cleaned = draftFacilities.map(f => f.trim()).filter(Boolean);
    if (!cleaned.length) return;
    setFacilities(cleaned);
    if (!cleaned.includes(facility)) setFacility(cleaned[0]);
    setEditingFac(false);
    try { if (window.storage) await window.storage.set(FACILITY_STORAGE_KEY, JSON.stringify(cleaned)); } catch(_) {}
  };

  const goExplore = () => navigate("/LakonyxHome");
  const goRoute   = r  => navigate(`/${r}`);

  return (
    <div style={{minHeight:"100vh",background:T.bg,color:T.txt,
      fontFamily:"'DM Sans',sans-serif",overflowX:"hidden",
      display:"flex",flexDirection:"column",alignItems:"center",
      justifyContent:"center",padding:"48px 24px 80px",position:"relative"}}>

      <BgMesh/>

      <div style={{position:"relative",zIndex:1,width:"100%",maxWidth:500,
        display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center"}}>

        {/* ── Version badge ─────────────────────────────────────────────── */}
        <div className="lxl-s1" style={{marginBottom:22}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,padding:"5px 16px",
            borderRadius:20,background:"rgba(245,200,66,0.07)",border:"1px solid rgba(245,200,66,0.24)"}}>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:700,color:T.gold}}>✦ v2.0</span>
            <div style={{width:1,height:10,background:"rgba(245,200,66,0.28)"}}/>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.txt4}}>
              20 new hubs · AI MDM · CMS 2024
            </span>
          </div>
        </div>

        {/* ── LX Mark + Wordmark ────────────────────────────────────────── */}
        <div className="lxl-s2" style={{marginBottom:16}}><LXMark size={96}/></div>
        <div className="lxl-s3" style={{fontFamily:"'Playfair Display',serif",
          fontSize:40,fontWeight:900,color:T.txt,letterSpacing:".10em",lineHeight:1,marginBottom:8}}>
          LAKONYX
        </div>
        <div className="lxl-s3" style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
          <div style={{width:26,height:1,background:`${BRAND.teal}38`}}/>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:BRAND.teal,letterSpacing:".22em",textTransform:"uppercase"}}>
            Clinical Decision Intelligence
          </span>
          <div style={{width:26,height:1,background:`${BRAND.teal}38`}}/>
        </div>

        {/* ── PRIORITY 1 · Global Search ────────────────────────────────── */}
        <div className="lxl-s4" style={{width:"100%",marginBottom:10}}>
          <GlobalSearch inputRef={searchRef} onNavigate={goHub}/>
        </div>

        {/* ── PRIORITY 2 · Quick-launch strip ──────────────────────────── */}
        <div className="lxl-s4" style={{width:"100%",marginBottom:22}}>
          <QuickLaunch recentRoutes={recentHubs} onNavigate={goHub}/>
        </div>

        {/* ── Clock ─────────────────────────────────────────────────────── */}
        <div className="lxl-s5" style={{width:"100%",marginBottom:20}}>
          <LiveClock/>
        </div>

        {/* ── Shift configuration card ──────────────────────────────────── */}
        <div className="lxl-s6" style={{width:"100%",marginBottom:20,
          padding:"20px 18px",borderRadius:14,
          background:"rgba(7,13,26,0.7)",border:"1px solid rgba(26,53,85,0.55)",
          backdropFilter:"blur(8px)",display:"flex",flexDirection:"column",gap:14}}>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.txt4,letterSpacing:".16em",textTransform:"uppercase"}}>
            Configure shift
          </div>

          {/* Facility */}
          <div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7.5,color:T.txt4,letterSpacing:".12em",textTransform:"uppercase"}}>Facility</div>
              <span className="lxl-pencil" onClick={editingFac ? cancelEditor : openEditor} title="Edit facility names">
                {editingFac ? "✕" : "✎"}
              </span>
            </div>
            {!editingFac && <PillRow options={facilities} value={facility} onChange={setFacility} activeColor={BRAND.gold} activeTextColor="#050f1e"/>}
            {editingFac && <FacilityEditor drafts={draftFacilities} onChange={changeDraft} onAdd={addDraft} onRemove={removeDraft} onSave={saveFacilities} onCancel={cancelEditor}/>}
          </div>

          <div style={{height:1,background:"rgba(26,53,85,0.5)"}}/>

          {/* Department */}
          <div>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7.5,color:T.txt4,letterSpacing:".12em",textTransform:"uppercase",marginBottom:8,textAlign:"left"}}>Department</div>
            <PillRow options={DEPTS} value={dept} onChange={setDept} activeColor={T.teal} activeTextColor="#050f1e"/>
          </div>

          <div style={{height:1,background:"rgba(26,53,85,0.5)"}}/>

          {/* Length + Attending */}
          <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:16,alignItems:"end"}}>
            <div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7.5,color:T.txt4,letterSpacing:".12em",textTransform:"uppercase",marginBottom:8,textAlign:"left"}}>Shift length</div>
              <PillRow options={LENGTHS} value={shiftLen} onChange={setShiftLen} activeColor={T.purple} activeTextColor={T.txt} small={true}/>
            </div>
            <div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7.5,color:T.txt4,letterSpacing:".12em",textTransform:"uppercase",marginBottom:8,textAlign:"left"}}>Attending (optional)</div>
              <input className="lxl-input" type="text" placeholder="Dr. ..." value={attending}
                onChange={e => setAttending(e.target.value)}
                style={{width:"100%",padding:"11px 12px",borderRadius:8,minHeight:48,
                  background:"rgba(11,30,54,0.65)",border:"1px solid rgba(42,79,122,0.48)",
                  color:T.txt,fontFamily:"'DM Sans',sans-serif",fontSize:12,
                  outline:"none",boxSizing:"border-box",caretColor:T.teal,transition:"border-color .15s,box-shadow .15s"}}/>
            </div>
          </div>
        </div>

        {/* ── Resume encounter ──────────────────────────────────────────── */}
        {resumeEnc && (
          <div className="lxl-s7" style={{width:"100%",marginBottom:14}}>
            <ResumeChip encounter={resumeEnc} onResume={() => navigate("/NewPatientInput")}/>
          </div>
        )}

        {/* ── Begin Shift ───────────────────────────────────────────────── */}
        <div className={resumeEnc?"lxl-s8":"lxl-s7"} style={{width:"100%",marginBottom:8}}>
          <div className="lxl-begin" onClick={beginShift}
            style={{width:"100%",padding:"16px",borderRadius:12,minHeight:52,
              fontFamily:"'DM Sans',sans-serif",fontSize:16,fontWeight:700,
              color:"#050f1e",letterSpacing:".04em",textAlign:"center",
              background:`linear-gradient(135deg,${T.teal} 0%,#00b4d8 100%)`,
              border:"none",userSelect:"none"}}>
            Begin Shift →
          </div>
        </div>

        {/* ── PRIORITY 3 · Skip setup ───────────────────────────────────── */}
        <div className={resumeEnc?"lxl-s8":"lxl-s7"} style={{marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:18}}>
            <span className="lxl-link" onClick={() => navigate("/CommandCenter")}
              style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.txt4,
                letterSpacing:".09em",opacity:.6}}>
              Skip setup →
            </span>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:"rgba(42,79,122,0.4)"}}>|</span>
            <span className="lxl-link" onClick={goExplore}
              style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.txt4,
                letterSpacing:".09em",opacity:.6}}>
              Explore Platform →
            </span>
          </div>
        </div>

        {/* Keyboard hint */}
        <div className={resumeEnc?"lxl-s9":"lxl-s8"} style={{width:"100%",marginBottom:10}}>
          <SystemStatus/>
        </div>

        <div className={resumeEnc?"lxl-s9":"lxl-s8"} style={{marginBottom:42}}>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7.5,
            color:"rgba(90,130,168,0.38)",letterSpacing:".10em"}}>
            {facility} · {dept} · {shiftLen} &nbsp;|&nbsp; <span style={{color:"rgba(0,229,192,0.4)"}}>Enter</span> begin &nbsp;·&nbsp; <span style={{color:"rgba(0,229,192,0.4)"}}>/</span> search &nbsp;·&nbsp; <span style={{color:"rgba(0,229,192,0.4)"}}>↑↓</span> results
          </div>
        </div>

        {/* ── Investor resources ────────────────────────────────────────── */}
        <div className={resumeEnc?"lxl-s10":"lxl-s9"} style={{width:"100%"}}>
          <div onClick={() => setShowInv(v => !v)}
            style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",opacity:.44,transition:"opacity .18s",userSelect:"none"}}
            onMouseEnter={e=>e.currentTarget.style.opacity=".72"}
            onMouseLeave={e=>e.currentTarget.style.opacity=".44"}>
            <div style={{flex:1,height:1,background:"rgba(26,53,85,0.55)"}}/>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7.5,color:T.txt4,letterSpacing:".14em",whiteSpace:"nowrap"}}>
              {showInv?"▲  INVESTOR RESOURCES":"▼  INVESTOR RESOURCES"}
            </span>
            <div style={{flex:1,height:1,background:"rgba(26,53,85,0.55)"}}/>
          </div>
          {showInv && <InvPanel onNavigate={goRoute}/>}
        </div>
      </div>

      {/* Fixed footer */}
      <div style={{position:"fixed",bottom:14,left:0,right:0,textAlign:"center",zIndex:1,pointerEvents:"none"}}>
        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,
          color:"rgba(90,130,168,0.28)",letterSpacing:".07em"}}>
          Clinical decision support only · Not a substitute for clinical judgment · Lakonyx v2.0
        </span>
      </div>
    </div>
  );
}