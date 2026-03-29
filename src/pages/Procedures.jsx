import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ProcedureTemplateManager from "../components/procedures/ProcedureTemplateManager";
import BillingModule from "../components/billing/BillingModule";
import EMCalculator from "../components/procedures/EMCalculator";

(() => {
  if (document.getElementById("proc-fonts")) return;
  const l = document.createElement("link"); l.id = "proc-fonts";
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "proc-css";
  s.textContent = `
    @keyframes proc-fadeSlide { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
    @keyframes proc-shimmer   { 0%{background-position:-200% center} 100%{background-position:200% center} }
    .proc-fade { animation: proc-fadeSlide .3s ease forwards; }
    .proc-nav-item { transition: all .18s ease; cursor: pointer; }
    .proc-nav-item:hover { transform: translateX(3px); }
    .proc-shimmer-txt {
      background: linear-gradient(90deg,#e8f4ff 0%,#ffffff 35%,#00d4bc 60%,#e8f4ff 100%);
      background-size: 250% auto; -webkit-background-clip: text;
      -webkit-text-fill-color: transparent; background-clip: text;
      animation: proc-shimmer 5s linear infinite;
    }
    select option { background:#0e2340; color:#c8ddf0; }
    ::-webkit-scrollbar { width:3px; height:3px; }
    ::-webkit-scrollbar-track { background:transparent; }
    ::-webkit-scrollbar-thumb { background:rgba(42,77,114,0.5); border-radius:2px; }
    input,select,textarea { font-family:'DM Sans',sans-serif; }
  `;
  document.head.appendChild(s);
})();

const T = {
  navy:"#050f1e", slate:"#0b1d35", panel:"#0e2340", edge:"#162d4f",
  border:"#1e3a5f", muted:"#2a4d72", dim:"#4a7299", text:"#c8ddf0",
  bright:"#e8f4ff",
  teal:"#00d4bc", teal2:"#00a896", amber:"#f5a623", red:"#ff5c6c",
  green:"#2ecc71", purple:"#9b6dff", rose:"#f472b6", blue:"#3b9eff",
};

const SECTIONS = [
  { id:"proc-notes",  icon:"📋", label:"Procedure Notes",  sub:"AI-drafted templates",  color:T.amber,  gl:"rgba(245,166,35,0.12)",  br:"rgba(245,166,35,0.4)"  },
  { id:"ed-notes",    icon:"📝", label:"ED Notes",         sub:"Critical care, AMA…",   color:T.rose,   gl:"rgba(244,114,182,0.12)", br:"rgba(244,114,182,0.4)" },
  { id:"cpt-search",  icon:"🔍", label:"CPT Code Search",  sub:"Find & copy CPT codes", color:T.teal,   gl:"rgba(0,212,188,0.12)",   br:"rgba(0,212,188,0.4)"   },
  { id:"proc-log",    icon:"📊", label:"Procedure Log",    sub:"Credentialing tracker",  color:T.green,  gl:"rgba(46,204,113,0.12)",  br:"rgba(46,204,113,0.4)"  },
  { id:"billing",     icon:"💳", label:"Billing",          sub:"E&M coding",             color:T.purple, gl:"rgba(155,109,255,0.12)", br:"rgba(155,109,255,0.4)" },
  { id:"templates",   icon:"🛠️", label:"Template Manager", sub:"Custom note templates",  color:T.blue,   gl:"rgba(59,158,255,0.12)",  br:"rgba(59,158,255,0.4)"  },
];

const glass = (extra = {}) => ({
  backdropFilter:"blur(24px) saturate(200%)",
  WebkitBackdropFilter:"blur(24px) saturate(200%)",
  background:"rgba(8,22,40,0.75)",
  border:"1px solid rgba(30,58,95,0.55)",
  borderRadius:16,
  ...extra,
});

const deepGlass = (extra = {}) => ({
  backdropFilter:"blur(40px) saturate(220%)",
  WebkitBackdropFilter:"blur(40px) saturate(220%)",
  background:"rgba(5,15,30,0.88)",
  border:"1px solid rgba(26,53,85,0.7)",
  ...extra,
});

const CPT_DATA = [
  { cptCode:"12001", procedureName:"Simple repair, scalp/neck/axillae ≤2.5cm",    category:"wound-repair",  rvu:1.83 },
  { cptCode:"12002", procedureName:"Simple repair, scalp/neck/axillae 2.6–7.5cm", category:"wound-repair",  rvu:2.08 },
  { cptCode:"12004", procedureName:"Simple repair 7.6–12.5cm",                    category:"wound-repair",  rvu:2.51 },
  { cptCode:"12011", procedureName:"Simple repair, face/ears/eyelids ≤2.5cm",     category:"wound-repair",  rvu:2.40 },
  { cptCode:"12032", procedureName:"Intermediate repair, scalp/trunk 2.6–7.5cm",  category:"wound-repair",  rvu:3.44 },
  { cptCode:"12051", procedureName:"Intermediate repair, face/ears ≤2.5cm",       category:"wound-repair",  rvu:4.25 },
  { cptCode:"13100", procedureName:"Complex repair, trunk 1.1–2.5cm",             category:"wound-repair",  rvu:5.12 },
  { cptCode:"13131", procedureName:"Complex repair, forehead/cheeks 1.1–2.5cm",   category:"wound-repair",  rvu:5.67 },
  { cptCode:"31500", procedureName:"Emergency endotracheal intubation",            category:"airway",        rvu:3.14 },
  { cptCode:"31575", procedureName:"Flexible fiberoptic laryngoscopy",             category:"airway",        rvu:2.61 },
  { cptCode:"31603", procedureName:"Cricothyrotomy",                               category:"airway",        rvu:6.42 },
  { cptCode:"94002", procedureName:"Ventilation management, hospital inpatient",   category:"airway",        rvu:3.86 },
  { cptCode:"36556", procedureName:"Central venous catheter, non-tunneled ≥5yrs",  category:"vascular",      rvu:3.58 },
  { cptCode:"36569", procedureName:"PICC line insertion",                          category:"vascular",      rvu:2.41 },
  { cptCode:"36625", procedureName:"Arterial line, percutaneous",                  category:"vascular",      rvu:1.95 },
  { cptCode:"36680", procedureName:"Intraosseous catheter placement",              category:"vascular",      rvu:1.66 },
  { cptCode:"23650", procedureName:"Shoulder dislocation, closed reduction",       category:"ortho",         rvu:4.84 },
  { cptCode:"29125", procedureName:"Short arm splint, static",                     category:"ortho",         rvu:1.04 },
  { cptCode:"29515", procedureName:"Short leg splint",                             category:"ortho",         rvu:1.23 },
  { cptCode:"20610", procedureName:"Joint aspiration/injection, major joint",      category:"ortho",         rvu:1.40 },
  { cptCode:"20600", procedureName:"Joint aspiration/injection, small joint",      category:"ortho",         rvu:0.91 },
  { cptCode:"92960", procedureName:"External electrical cardioversion",            category:"cardio",        rvu:3.20 },
  { cptCode:"32551", procedureName:"Tube thoracostomy",                            category:"cardio",        rvu:4.53 },
  { cptCode:"32422", procedureName:"Thoracentesis, therapeutic",                   category:"cardio",        rvu:3.84 },
  { cptCode:"93000", procedureName:"ECG with interpretation",                      category:"cardio",        rvu:0.56 },
  { cptCode:"99291", procedureName:"Critical care, first 30–74 minutes",           category:"critical-care", rvu:9.14 },
  { cptCode:"99292", procedureName:"Critical care, each additional 30 min",        category:"critical-care", rvu:4.57 },
  { cptCode:"99152", procedureName:"Procedural sedation, first 15 min",            category:"critical-care", rvu:1.34 },
  { cptCode:"96374", procedureName:"IV push, single drug",                         category:"critical-care", rvu:0.58 },
  { cptCode:"10060", procedureName:"I&D abscess, simple",                          category:"drainage",      rvu:1.55 },
  { cptCode:"10061", procedureName:"I&D abscess, complicated",                     category:"drainage",      rvu:2.97 },
  { cptCode:"10140", procedureName:"I&D hematoma/seroma",                          category:"drainage",      rvu:2.32 },
  { cptCode:"49083", procedureName:"Paracentesis, diagnostic/therapeutic",         category:"drainage",      rvu:2.18 },
  { cptCode:"51702", procedureName:"Bladder catheterization, simple",              category:"drainage",      rvu:0.56 },
  { cptCode:"69200", procedureName:"Foreign body removal, ear canal",              category:"drainage",      rvu:1.02 },
  { cptCode:"30300", procedureName:"Foreign body removal, nasal",                  category:"drainage",      rvu:1.28 },
  { cptCode:"62270", procedureName:"Lumbar puncture, diagnostic",                  category:"neuro",         rvu:2.78 },
  { cptCode:"64400", procedureName:"Nerve block, trigeminal",                      category:"neuro",         rvu:1.82 },
  { cptCode:"64420", procedureName:"Intercostal nerve block, single",              category:"neuro",         rvu:1.45 },
];

const CATEGORY_LABELS = {
  "wound-repair":"Wound Repair","airway":"Airway","vascular":"Vascular Access",
  "ortho":"Ortho / MSK","cardio":"Cardiac","critical-care":"Critical Care",
  "drainage":"Drainage / I&D","neuro":"Neuro / Spine",
};

const CATEGORY_COLORS = {
  "wound-repair": { bg:"rgba(0,212,188,0.1)",  fg:"#00d4bc" },
  "airway":       { bg:"rgba(255,92,108,0.1)",  fg:"#ff5c6c" },
  "vascular":     { bg:"rgba(155,109,255,0.1)", fg:"#9b6dff" },
  "ortho":        { bg:"rgba(245,166,35,0.1)",  fg:"#f5a623" },
  "cardio":       { bg:"rgba(255,92,108,0.1)",  fg:"#ff5c6c" },
  "critical-care":{ bg:"rgba(74,114,153,0.15)", fg:"#4a90d9" },
  "drainage":     { bg:"rgba(46,204,113,0.1)",  fg:"#2ecc71" },
  "neuro":        { bg:"rgba(244,114,182,0.1)", fg:"#f472b6" },
};

const PROC_CATEGORIES = [
  { id:"all", label:"All" },
  { id:"wound", label:"🩹 Wound" },
  { id:"vascular", label:"🩸 Vascular" },
  { id:"airway", label:"🫁 Airway" },
  { id:"thoracic", label:"💧 Thoracic" },
  { id:"cardiac", label:"❤️ Cardiac" },
  { id:"abdominal", label:"🫀 Abdominal" },
  { id:"neuro", label:"🧠 Neuro" },
  { id:"ortho", label:"🦴 Ortho" },
  { id:"uro", label:"🚿 Urology" },
  { id:"gi", label:"🔩 GI" },
  { id:"gyn", label:"🌸 OB/GYN" },
  { id:"ent", label:"👁️ ENT/Ophth" },
  { id:"anesthesia", label:"💉 Anesthesia" },
];

const PROC_TEMPLATES = [
  { id:"laceration-repair", label:"Laceration Repair", category:"wound", icon:"🩹", color:T.teal,
    fields:[
      { id:"location",        label:"Wound Location",       type:"text",    required:true,  placeholder:"e.g., right volar forearm" },
      { id:"mechanism",       label:"Mechanism",            type:"text",    required:true,  placeholder:"e.g., fall on glass" },
      { id:"length_cm",       label:"Length (cm)",          type:"number",  required:true },
      { id:"depth",           label:"Depth",                type:"select",  required:true,  options:["Superficial","Subcutaneous fat","Fascia","Muscle","Tendon/bone visible"] },
      { id:"contamination",   label:"Contamination",        type:"select",  required:true,  options:["Clean","Clean-contaminated","Contaminated","Dirty/infected"] },
      { id:"neurovasc",       label:"Neurovascular Status", type:"select",  required:true,  options:["Intact distal","Sensation diminished","Motor deficit","Vascular compromise"] },
      { id:"anesthesia",      label:"Anesthesia",           type:"text",    required:true,  placeholder:"e.g., 1% lidocaine w/ epi, 5 mL" },
      { id:"irrigation",      label:"Irrigation",           type:"text",    required:false, placeholder:"e.g., 500 mL NS under pressure" },
      { id:"closure",         label:"Closure Method",       type:"select",  required:true,  options:["Primary closure with sutures","Staples","Steri-strips","Dermabond","Wound packed open"] },
      { id:"suture_material", label:"Suture Material",      type:"text",    required:false, placeholder:"e.g., 4-0 nylon interrupted" },
      { id:"tetanus",         label:"Tetanus Status",       type:"select",  required:true,  options:["Up to date — no intervention","Tdap given","TIG given","TIG + Tdap given"] },
      { id:"antibiotics",     label:"Antibiotics",          type:"text",    required:false, placeholder:"e.g., none required" },
    ]
  },
  { id:"abscess-id", label:"Abscess I&D", category:"wound", icon:"🔪", color:T.amber,
    fields:[
      { id:"location",    label:"Location",         type:"text",   required:true,  placeholder:"e.g., left lateral buttock" },
      { id:"size",        label:"Size (cm)",        type:"text",   required:true,  placeholder:"e.g., 3 × 2 cm" },
      { id:"fluctuance",  label:"Fluctuance",       type:"select", required:true,  options:["Present","Absent","Partial"] },
      { id:"anesthesia",  label:"Anesthesia",       type:"text",   required:true,  placeholder:"e.g., 1% lidocaine, 8 mL field block" },
      { id:"drainage",    label:"Drainage",         type:"text",   required:true,  placeholder:"e.g., ~10 mL purulent material, cultures sent" },
      { id:"packing",     label:"Packing",          type:"text",   required:false, placeholder:"e.g., 0.25 in plain gauze, 4 cm" },
      { id:"antibiotics", label:"Antibiotics",      type:"text",   required:false, placeholder:"e.g., TMP-SMX DS BID × 7 days" },
    ]
  },
  { id:"central-line", label:"Central Line Placement", category:"vascular", icon:"🩸", color:T.purple,
    fields:[
      { id:"indication",    label:"Indication",           type:"textarea",required:true,  placeholder:"e.g., septic shock requiring vasopressors" },
      { id:"site",          label:"Access Site",          type:"select",  required:true,  options:["Right internal jugular","Left internal jugular","Right subclavian","Left subclavian","Right femoral","Left femoral"] },
      { id:"us_guidance",   label:"Ultrasound Guidance",  type:"select",  required:true,  options:["Real-time ultrasound","Static marking","Landmark technique"] },
      { id:"catheter_type", label:"Catheter Type",        type:"text",    required:true,  placeholder:"e.g., 7 Fr triple-lumen, 15 cm" },
      { id:"attempts",      label:"Attempts",             type:"number",  required:true,  placeholder:"1" },
      { id:"blood_return",  label:"Blood Return",         type:"select",  required:true,  options:["Confirmed × all lumens","Confirmed × primary lumen","No blood return"] },
      { id:"cxr",           label:"Post-procedure CXR",   type:"select",  required:true,  options:["Tip at cavoatrial junction, no PTX","Obtained — see report","Pending","Femoral — not indicated"] },
      { id:"complications", label:"Complications",        type:"text",    required:false, placeholder:"None" },
    ]
  },
  { id:"arterial-line", label:"Arterial Line Placement", category:"vascular", icon:"❤️‍🩹", color:T.red,
    fields:[
      { id:"indication",    label:"Indication",           type:"textarea",required:true },
      { id:"site",          label:"Access Site",          type:"select",  required:true,  options:["Right radial","Left radial","Right femoral","Left femoral","Right brachial","Left brachial"] },
      { id:"allen_test",    label:"Allen Test (radial)",  type:"select",  required:false, options:["Normal — collateral flow confirmed","Abnormal — alternative site selected","Not performed"] },
      { id:"us_guidance",   label:"Ultrasound Guidance",  type:"select",  required:true,  options:["Real-time ultrasound","Palpation/landmark technique"] },
      { id:"catheter",      label:"Catheter",             type:"text",    required:true,  placeholder:"e.g., 20G radial arterial catheter" },
      { id:"attempts",      label:"Attempts",             type:"number",  required:true,  placeholder:"1" },
      { id:"waveform",      label:"Waveform Confirmation",type:"select",  required:true,  options:["Arterial waveform confirmed on monitor","Pulsatile bright red blood — waveform confirmed"] },
      { id:"complications", label:"Complications",        type:"text",    required:false, placeholder:"None" },
    ]
  },
  { id:"io-access", label:"Intraosseous Access", category:"vascular", icon:"🦴", color:T.amber,
    fields:[
      { id:"indication",    label:"Indication",            type:"textarea",required:true,  placeholder:"e.g., cardiac arrest, failed peripheral IV × 2 attempts" },
      { id:"io_site",       label:"IO Site",               type:"select",  required:true,  options:["Proximal tibia","Distal tibia","Proximal humerus","Sternal","Distal femur"] },
      { id:"device",        label:"Device Used",           type:"select",  required:true,  options:["EZ-IO — 15mm needle","EZ-IO — 25mm needle","EZ-IO — 45mm needle","FAST1 — sternal","Manual IO needle"] },
      { id:"attempts",      label:"Attempts",              type:"number",  required:true,  placeholder:"1" },
      { id:"confirmation",  label:"Confirmation Method",   type:"text",    required:true,  placeholder:"e.g., IO seated, aspirated marrow, flushed 10 mL NS" },
      { id:"initial_flush", label:"Initial Flush",         type:"text",    required:true,  placeholder:"e.g., 10 mL NS + lidocaine 40 mg IO" },
      { id:"complications", label:"Complications",         type:"text",    required:false, placeholder:"None" },
    ]
  },
  { id:"rsi-intubation", label:"RSI / ETT Intubation", category:"airway", icon:"🫁", color:T.red,
    fields:[
      { id:"indication",      label:"Indication",           type:"textarea",required:true },
      { id:"gcs_pre",         label:"Pre-intubation GCS",   type:"number",  required:true,  placeholder:"e.g., 8" },
      { id:"spo2_pre",        label:"Pre-intubation SpO2",  type:"text",    required:true,  placeholder:"e.g., 88% on 15L NRB" },
      { id:"preoxygenation",  label:"Preoxygenation",       type:"text",    required:true,  placeholder:"e.g., 15L NRB × 3 min, BVM × 30 sec" },
      { id:"induction_agent", label:"Induction Agent",      type:"text",    required:true,  placeholder:"e.g., ketamine 1.5 mg/kg IV" },
      { id:"paralytic",       label:"Paralytic",            type:"text",    required:true,  placeholder:"e.g., succinylcholine 1.5 mg/kg" },
      { id:"blade",           label:"Blade",                type:"select",  required:true,  options:["Mac 3","Mac 4","Miller 2","Video (GlideScope)","Video (C-MAC)","Video (AWS)"] },
      { id:"ett_size",        label:"ETT Size",             type:"text",    required:true,  placeholder:"e.g., 7.5 cuffed" },
      { id:"depth",           label:"Depth at Lips",        type:"text",    required:true,  placeholder:"e.g., 22 cm" },
      { id:"attempts",        label:"Attempts",             type:"number",  required:true },
      { id:"confirmation",    label:"Confirmation",         type:"text",    required:true,  placeholder:"e.g., waveform capnography, bilateral breath sounds" },
      { id:"vent_settings",   label:"Initial Vent Settings",type:"text",    required:false, placeholder:"e.g., AC/VC, TV 420 mL, RR 14, PEEP 5, FiO2 0.6" },
      { id:"complications",   label:"Complications",        type:"text",    required:false, placeholder:"None" },
    ]
  },
  { id:"cricothyrotomy", label:"Cricothyrotomy", category:"airway", icon:"⚡", color:T.red,
    fields:[
      { id:"indication",    label:"Indication",              type:"textarea",required:true,  placeholder:"e.g., cannot intubate cannot oxygenate (CICO)" },
      { id:"technique",     label:"Technique",               type:"select",  required:true,  options:["Surgical cricothyrotomy — scalpel-finger-bougie","Needle cricothyrotomy — 14G angiocath","Commercial kit"] },
      { id:"landmark",      label:"Landmark Identified",     type:"select",  required:true,  options:["Cricothyroid membrane identified by palpation","Ultrasound-assisted","Neck landmarks obscured — surgical approach"] },
      { id:"tube_placed",   label:"Tube Placed",             type:"text",    required:true,  placeholder:"e.g., 6.0 cuffed ETT via surgical cric" },
      { id:"confirmation",  label:"Confirmation",            type:"text",    required:true,  placeholder:"e.g., EtCO2 detected, bilateral breath sounds" },
      { id:"complications", label:"Complications",           type:"text",    required:false, placeholder:"None" },
    ]
  },
  { id:"tube-thoracostomy", label:"Chest Tube (Tube Thoracostomy)", category:"thoracic", icon:"🫁", color:T.purple,
    fields:[
      { id:"indication",    label:"Indication",           type:"textarea",required:true },
      { id:"side",          label:"Side",                 type:"select",  required:true,  options:["Right","Left"] },
      { id:"ct_site",       label:"Insertion Site",       type:"select",  required:true,  options:["4th or 5th ICS — anterior axillary line","2nd ICS — mid-clavicular line (emergency)","6th ICS — posterior axillary line"] },
      { id:"anesthesia",    label:"Anesthesia",           type:"text",    required:true,  placeholder:"e.g., 1% lidocaine 15 mL subcutaneous + intercostal" },
      { id:"tube_size",     label:"Tube Size",            type:"text",    required:true,  placeholder:"e.g., 28 Fr chest tube" },
      { id:"output",        label:"Immediate Output",     type:"text",    required:true,  placeholder:"e.g., ~400 mL serosanguinous fluid, air rush" },
      { id:"drainage",      label:"Drainage System",      type:"select",  required:true,  options:["Water seal with suction — 20 cmH2O","Water seal — no suction","Heimlich valve"] },
      { id:"cxr",           label:"Post-procedure CXR",   type:"select",  required:true,  options:["Good position — lung re-expanded","Malpositioned — adjusted","Pending"] },
      { id:"complications", label:"Complications",        type:"text",    required:false, placeholder:"None" },
    ]
  },
  { id:"thoracentesis", label:"Thoracentesis", category:"thoracic", icon:"💧", color:"#4a90d9",
    fields:[
      { id:"indication",      label:"Indication",           type:"textarea",required:true },
      { id:"side",            label:"Side",                 type:"select",  required:true,  options:["Right","Left"] },
      { id:"us_guidance",     label:"Ultrasound Guidance",  type:"select",  required:true,  options:["Real-time ultrasound guidance","Ultrasound-marked landmark","Percussion — no US available"] },
      { id:"insertion_site",  label:"Insertion Site",       type:"text",    required:true,  placeholder:"e.g., posterior 8th ICS below tip of scapula" },
      { id:"anesthesia",      label:"Anesthesia",           type:"text",    required:true,  placeholder:"e.g., 1% lidocaine 10 mL infiltrated to pleura" },
      { id:"volume",          label:"Volume Removed",       type:"text",    required:true,  placeholder:"e.g., 900 mL straw-colored fluid" },
      { id:"fluid_sent",      label:"Labs Sent",            type:"text",    required:false, placeholder:"e.g., LDH, protein, glucose, culture, cytology" },
      { id:"cxr",             label:"Post-procedure CXR",   type:"select",  required:true,  options:["No PTX — stable","PTX identified — managed","Pending"] },
      { id:"complications",   label:"Complications",        type:"text",    required:false, placeholder:"None" },
    ]
  },
  { id:"cardioversion", label:"Electrical Cardioversion", category:"cardiac", icon:"⚡", color:T.red,
    fields:[
      { id:"indication",    label:"Indication",                   type:"textarea",required:true },
      { id:"rhythm",        label:"Pre-cardioversion Rhythm",     type:"select",  required:true,  options:["SVT (AVNRT/AVRT)","Atrial flutter","Atrial fibrillation","Ventricular tachycardia (stable)","VF — unsynchronized"] },
      { id:"type",          label:"Cardioversion Type",           type:"select",  required:true,  options:["Synchronized cardioversion","Unsynchronized defibrillation — VF/pulseless VT"] },
      { id:"sedation",      label:"Sedation/Analgesia",           type:"text",    required:false, placeholder:"e.g., etomidate 0.3 mg/kg IV" },
      { id:"energy_j",      label:"Energy (Joules)",              type:"text",    required:true,  placeholder:"e.g., 50J → 100J → 200J" },
      { id:"attempts",      label:"Shocks Delivered",             type:"number",  required:true,  placeholder:"1" },
      { id:"post_rhythm",   label:"Post-cardioversion Rhythm",    type:"text",    required:true,  placeholder:"e.g., NSR at 72 bpm" },
      { id:"complications", label:"Complications",                type:"text",    required:false, placeholder:"None" },
    ]
  },
  { id:"paracentesis", label:"Paracentesis", category:"abdominal", icon:"🫀", color:T.green,
    fields:[
      { id:"indication",       label:"Indication",           type:"textarea",required:true },
      { id:"us_guidance",      label:"Ultrasound Guidance",  type:"select",  required:true,  options:["Real-time ultrasound guidance","Ultrasound-marked site","Percussion — no US available"] },
      { id:"site",             label:"Insertion Site",       type:"select",  required:true,  options:["Left lower quadrant — lateral to rectus","Right lower quadrant — lateral to rectus","Midline infraumbilical"] },
      { id:"anesthesia",       label:"Anesthesia",           type:"text",    required:true,  placeholder:"e.g., 1% lidocaine 10 mL infiltrated to peritoneum" },
      { id:"volume_removed",   label:"Volume Removed",       type:"text",    required:true,  placeholder:"e.g., 5.5 L clear amber fluid" },
      { id:"fluid_appearance", label:"Fluid Appearance",     type:"select",  required:true,  options:["Clear amber","Straw-colored","Bloody — traumatic","Cloudy/turbid — SBP suspected","Milky — chylous"] },
      { id:"labs_sent",        label:"Labs Sent",            type:"text",    required:false, placeholder:"e.g., cell count, albumin, culture, total protein" },
      { id:"complications",    label:"Complications",        type:"text",    required:false, placeholder:"None" },
    ]
  },
  { id:"lumbar-puncture", label:"Lumbar Puncture", category:"neuro", icon:"🧠", color:T.rose,
    fields:[
      { id:"indication",        label:"Indication",              type:"textarea",required:true },
      { id:"position",          label:"Patient Position",        type:"select",  required:true,  options:["Lateral decubitus — fetal position","Seated leaning forward"] },
      { id:"level",             label:"Intervertebral Level",    type:"select",  required:true,  options:["L3-L4","L4-L5","L2-L3"] },
      { id:"needle",            label:"Needle Used",             type:"text",    required:true,  placeholder:"e.g., 22G, 3.5 inch Quincke needle" },
      { id:"attempts",          label:"Attempts",                type:"number",  required:true },
      { id:"opening_pressure",  label:"Opening Pressure (cmH2O)",type:"number", required:false },
      { id:"csf_appearance",    label:"CSF Appearance",          type:"select",  required:true,  options:["Clear and colorless","Xanthochromic","Bloody — clears with sequential tubes","Bloody — does not clear","Turbid/cloudy"] },
      { id:"tubes",             label:"Tubes Collected",         type:"text",    required:true,  placeholder:"e.g., 4 tubes: cell count, glucose/protein, culture, cell count" },
      { id:"complications",     label:"Complications",           type:"text",    required:false, placeholder:"None" },
    ]
  },
  { id:"joint-aspiration-injection", label:"Joint Aspiration / Injection", category:"ortho", icon:"💉", color:T.teal,
    fields:[
      { id:"joint",            label:"Joint",                  type:"select",  required:true,  options:["Knee (right)","Knee (left)","Shoulder (right)","Shoulder (left)","Elbow (right)","Elbow (left)","Ankle (right)","Ankle (left)","Wrist (right)","Wrist (left)","First MTP (gout)"] },
      { id:"indication",       label:"Indication",             type:"select",  required:true,  options:["Diagnostic aspiration — r/o septic arthritis","Diagnostic aspiration — r/o crystal arthropathy","Therapeutic drainage","Corticosteroid injection"] },
      { id:"us_guidance",      label:"Guidance",               type:"select",  required:true,  options:["Landmark technique","Real-time ultrasound guidance"] },
      { id:"approach",         label:"Approach",               type:"text",    required:true,  placeholder:"e.g., lateral parapatellar approach" },
      { id:"fluid_aspirated",  label:"Fluid Aspirated",        type:"text",    required:false, placeholder:"e.g., 20 mL cloudy synovial fluid" },
      { id:"injection_given",  label:"Injection Given",        type:"text",    required:false, placeholder:"e.g., triamcinolone 40 mg + bupivacaine 3 mL" },
      { id:"complications",    label:"Complications",          type:"text",    required:false, placeholder:"None" },
    ]
  },
  { id:"shoulder-reduction", label:"Shoulder Dislocation Reduction", category:"ortho", icon:"💪", color:T.amber,
    fields:[
      { id:"direction",        label:"Dislocation Direction",     type:"select",  required:true,  options:["Anterior (most common)","Posterior","Inferior (luxatio erecta)"] },
      { id:"pre_imaging",      label:"Pre-reduction Imaging",     type:"select",  required:true,  options:["X-ray confirmed — AP, scapular Y, axillary views","Clinical diagnosis — emergent","CT obtained"] },
      { id:"neurovasc_pre",    label:"Neurovascular Status Pre",  type:"text",    required:true,  placeholder:"e.g., axillary nerve sensation intact, radial pulse 2+" },
      { id:"sedation",         label:"Analgesia/Sedation",        type:"text",    required:true,  placeholder:"e.g., ketamine 0.5 mg/kg + midazolam 2 mg IV" },
      { id:"technique",        label:"Reduction Technique",       type:"select",  required:true,  options:["Cunningham technique","Stimson (gravity) technique","Mitch technique","FARES technique","Traction-countertraction","External rotation method","Milch technique"] },
      { id:"attempts",         label:"Attempts",                  type:"number",  required:true,  placeholder:"1" },
      { id:"post_imaging",     label:"Post-reduction Imaging",    type:"select",  required:true,  options:["Confirmed reduction — no fracture","Confirmed reduction — Hill-Sachs noted","Associated fracture — see imaging","Pending"] },
      { id:"neurovasc_post",   label:"Neurovascular Status Post", type:"text",    required:true,  placeholder:"e.g., intact" },
      { id:"immobilization",   label:"Immobilization",            type:"text",    required:true,  placeholder:"e.g., sling and swath × 3 weeks" },
    ]
  },
  { id:"bladder-cath", label:"Bladder Catheterization", category:"uro", icon:"🚿", color:"#4a90d9",
    fields:[
      { id:"indication",    label:"Indication",           type:"textarea",required:true },
      { id:"catheter_type", label:"Catheter Type",        type:"select",  required:true,  options:["14 Fr Foley — standard","16 Fr Foley — standard","18 Fr Foley — standard","Coudé tip catheter","Straight catheter — in/out"] },
      { id:"urine_return",  label:"Urine Return",         type:"text",    required:true,  placeholder:"e.g., ~400 mL clear yellow urine immediately drained" },
      { id:"complications", label:"Complications",        type:"text",    required:false, placeholder:"None" },
    ]
  },
  { id:"ng-tube", label:"Nasogastric Tube Placement", category:"gi", icon:"🔩", color:"#4a90d9",
    fields:[
      { id:"indication",    label:"Indication",              type:"select",  required:true,  options:["GI decompression — obstruction/ileus","Gastric lavage — overdose/ingestion","Enteral nutrition/medication administration","Diagnostic — bloody aspirate","Variceal bleeding"] },
      { id:"nare",          label:"Nare",                    type:"select",  required:true,  options:["Right nare","Left nare"] },
      { id:"tube_type",     label:"Tube Type",               type:"text",    required:true,  placeholder:"e.g., 18 Fr Salem sump" },
      { id:"tube_depth",    label:"Insertion Depth (cm)",    type:"number",  required:true,  placeholder:"e.g., 55 cm at nare" },
      { id:"confirmation",  label:"Confirmation",            type:"select",  required:true,  options:["Auscultation + aspiration of gastric contents","X-ray confirmed — tip in stomach","Aspirate pH <4 + auscultation"] },
      { id:"complications", label:"Complications",           type:"text",    required:false, placeholder:"None" },
    ]
  },
  { id:"nasal-packing", label:"Anterior Nasal Packing", category:"ent", icon:"👃", color:T.amber,
    fields:[
      { id:"indication",    label:"Indication",              type:"select",  required:true,  options:["Epistaxis — anterior, failed direct pressure","Epistaxis — anterior, site identified"] },
      { id:"nare",          label:"Nare",                    type:"select",  required:true,  options:["Right","Left","Bilateral"] },
      { id:"technique",     label:"Technique",               type:"select",  required:true,  options:["Rapid Rhino balloon (anterior)","Merocel sponge packing","Vaseline gauze packing","Silver nitrate cauterization","Surgicel/oxidized cellulose","Tranexamic acid packing"] },
      { id:"hemostasis",    label:"Hemostasis Achieved",     type:"select",  required:true,  options:["Complete hemostasis achieved","Near-complete — packing left in place","Persistent bleeding — ENT consulted"] },
      { id:"antibiotics",   label:"Prophylactic Antibiotics",type:"text",    required:false, placeholder:"e.g., amoxicillin-clavulanate 875 mg BID × 5 days" },
    ]
  },
  { id:"digital-block", label:"Digital Block", category:"anesthesia", icon:"💉", color:"#4a90d9",
    fields:[
      { id:"indication",    label:"Indication",              type:"text",    required:true,  placeholder:"e.g., finger laceration repair" },
      { id:"finger",        label:"Finger/Location",         type:"text",    required:true,  placeholder:"e.g., left index finger" },
      { id:"agent",         label:"Local Anesthetic",        type:"text",    required:true,  placeholder:"e.g., 1% lidocaine without epinephrine, 3-5 mL" },
      { id:"technique",     label:"Technique",               type:"select",  required:true,  options:["Subcutaneous 'ring' technique","Subcutaneous 'v' technique","Intravascular wrist technique"] },
      { id:"onset",         label:"Anesthesia Onset",        type:"select",  required:true,  options:["Within 5-10 min","Within 10-15 min","Delayed — required supplemental"] },
      { id:"complications", label:"Complications",           type:"text",    required:false, placeholder:"None" },
    ]
  },
];

const ED_NOTES = [
  { id:"critical-care-note", label:"Critical Care", icon:"🚨", color:T.red, description:"99291/99292 — time-based critical care (30+ min)",
    fields:[
      { id:"cc_time_minutes",       label:"Total Critical Care Time (minutes) *", type:"number",  required:true, placeholder:"Min 30 min for billing" },
      { id:"cc_time_exclusions",    label:"Exclusion Statement *", type:"text", required:true, placeholder:"e.g., Transport time, procedures not included in CCT" },
      { id:"presenting_problem",    label:"Critical Presenting Problem *",    type:"textarea", required:true, placeholder:"Patient's acute, life-threatening condition requiring high-intensity intervention" },
      { id:"interventions_provided",label:"Critical Care Interventions Provided *", type:"textarea", required:true, placeholder:"e.g., emergency intubation, central venous catheter, vasoactive drugs, emergency transvenous pacing" },
      { id:"iv_vasoactive_meds",    label:"IV Vasoactive Medications",       type:"text",     required:false, placeholder:"e.g., dopamine, norepinephrine, epinephrine, phenylephrine — dosages & routes" },
      { id:"monitoring_details",    label:"Monitoring & Reassessment",      type:"textarea", required:false, placeholder:"Continuous hemodynamic monitoring, reassessment intervals" },
      { id:"medical_necessity",     label:"Medical Necessity Note",         type:"textarea", required:false, placeholder:"Specific reason why critical care level was medically necessary" },
      { id:"disposition",           label:"Disposition *",                  type:"select",   required:true, options:["ICU admission","ICU transfer to another facility","Hospital floor admission","ROSC — admitted to ICU","Deceased","Transferred out"] },
    ]
  },
  { id:"ama-note", label:"Against Medical Advice", icon:"⚠️", color:T.amber, description:"Capacity assessment, informed refusal, medicolegal protection",
    fields:[
      { id:"presenting_chief_complaint", label:"Presenting Complaint *",              type:"text",     required:true, placeholder:"Primary reason for ED visit" },
      { id:"recommended_treatment_plan", label:"Recommended Treatment / Admission *", type:"textarea", required:true, placeholder:"Complete recommended plan (admission, imaging, consultants, medications, etc.)" },
      { id:"specific_risks",            label:"Specific Risks of Refusal *",        type:"textarea", required:true, placeholder:"Cardiac arrest, death, permanent disability, undiagnosed serious illness — be specific to patient's condition" },
      { id:"capacity_assessment_tool",  label:"Decisional Capacity Assessment Tool *", type:"select", required:true, options:["Formal tool: patient shows understanding, appreciation, reasoning, ability to express choice","Assessment: patient alert, oriented ×4, understands diagnosis & consequences","Borderline capacity — psychiatric evaluation obtained","Capacity impaired — surrogate/POA involved in decision"] },
      { id:"patient_understanding",     label:"Patient's Understanding of Risks *", type:"textarea", required:true, placeholder:"Document what patient stated about understanding and acknowledging risks" },
      { id:"patient_stated_reason",    label:"Patient's Stated Reason for Refusal *", type:"textarea", required:true, placeholder:"Record patient's own words about why they are refusing" },
      { id:"offered_alternatives",     label:"Alternative Options Offered",      type:"textarea", required:false, placeholder:"e.g., outpatient follow-up, urgent care, home health services" },
      { id:"ama_form_signed",          label:"Informed Refusal Documentation *",  type:"select",   required:true, options:["Signed by patient — witnessed","Patient refused to sign — documented & witnessed","Surrogate/POA signed","Document patient unable to sign due to condition"] },
      { id:"witness_name",             label:"Witness (staff) Name",              type:"text",     required:false, placeholder:"RN, MD, security — whoever witnessed" },
    ]
  },
  { id:"code-note", label:"Code / Resuscitation", icon:"❤️", color:T.red, description:"Comprehensive arrest timeline, interventions, ROSC outcome",
    fields:[
      { id:"time_code_called",       label:"Time Code Called/Witnessed *", type:"text",     required:true, placeholder:"HH:MM" },
      { id:"initial_rhythm",        label:"Initial Rhythm on Monitor *",       type:"select",   required:true, options:["VF (ventricular fibrillation)","pVT (pulseless ventricular tachycardia)","PEA (pulseless electrical activity)","Asystole","Unknown — monitor placed after arrest"] },
      { id:"cpr_quality",           label:"CPR Quality Assessment",         type:"select",   required:false, options:["High-quality CPR: depth ≥5cm, RR 100-120, appropriate decompress","Adequate CPR achieved","Quality variable — reposition/coaching provided","Initial delay — meds given after adequate CPR started"] },
      { id:"first_shock_time",      label:"Time of First Defibrillation",   type:"text",     required:false, placeholder:"HH:MM — if applicable" },
      { id:"defibrillation_count",  label:"Number of Shocks Delivered",    type:"number",   required:false, placeholder:"VF/pVT shocks" },
      { id:"medications_administered", label:"Medications Given *", type:"textarea", required:true, placeholder:"Epinephrine 1mg IV/IO q3-5min (×N doses), Amiodarone/Lidocaine, Calcium, Glucose, Sodium Bicarbonate — list each with time & route" },
      { id:"compressions_intervals", label:"Compression-to-Ventilation Ratio", type:"text", required:false, placeholder:"e.g., 30:2 single rescuer, 15:2 two-rescuer" },
      { id:"airway_interventions",  label:"Airway Interventions *", type:"textarea", required:true, placeholder:"BVM × mins, intubation time & tube size, waveform capnography, alternative airways" },
      { id:"no_flow_pauses",        label:"Minimized No-Flow Time",         type:"text",     required:false, placeholder:"Total hands-off time, reasons for pauses (shock, rhythm check, intubation)" },
      { id:"total_downtime_minutes", label:"Total Downtime (minutes) *", type:"number",   required:true, placeholder:"From collapse to ROSC or death pronouncement" },
      { id:"reversible_h_and_t",    label:"Reversible H's and T's Identified", type:"textarea", required:false, placeholder:"Hypoxia, hypovolemia, hypothermia, hyperkalemia, h-ion (acidosis), tension PTX, tamponade, toxins, thrombosis, etc." },
      { id:"rosc_achieved",         label:"ROSC Achieved *",                type:"select",   required:true, options:["Yes — at MM:SS, return of pulses/BP","Yes — transient (lost again during resuscitation)","No — death pronounced at HH:MM"] },
      { id:"rosc_time_if_yes",      label:"ROSC Time (if achieved)",        type:"text",     required:false, placeholder:"HH:MM" },
      { id:"neurological_status_post_rosc", label:"Neurological Status Post-ROSC", type:"select", required:false, options:["Alert & oriented — tracking","Confused/disoriented — sedation initiated","Unresponsive — therapeutic hypothermia considered","Comatose — neurology consultation"] },
      { id:"outcome",               label:"Outcome *",              type:"select",   required:true, options:["ROSC sustained — admitted to ICU","ROSC sustained — cath lab activated for post-arrest MI","ROSC sustained — neuro ICU/therapeutic hypothermia","Resuscitation unsuccessful — death pronounced","Family present during resuscitation"] },
      { id:"family_present_code",   label:"Family Presence During Code",    type:"select",   required:false, options:["Yes — support person present","Yes — waiting area provided with chaplain/social work","No — offered, declined","No — not offered due to circumstances"] },
    ]
  },
  { id:"trauma-note", label:"Trauma Activation", icon:"🏥", color:T.red, description:"ATLS primary/secondary survey, resuscitation bundle, disposition",
    fields:[
      { id:"trauma_activation_level", label:"Trauma Activation Level *", type:"select", required:true, options:["Level I — highest acuity","Level II — moderate","Level III — lower acuity","Downgraded during ED stay"] },
      { id:"mechanism_of_injury",     label:"Mechanism of Injury *",             type:"textarea", required:true, placeholder:"Blunt vs. penetrating, height of fall, vehicle speed, weapon type, etc." },
      { id:"ems_report_details",      label:"EMS Report *",           type:"textarea", required:true, placeholder:"Scene vitals, extrication time, transport time, interventions en route, Glasgow Coma Scale" },
      { id:"time_of_injury",          label:"Time of Injury / Scene Time", type:"text", required:false, placeholder:"HH:MM" },
      { id:"primary_survey_abcde",    label:"Primary Survey — ABCDE *",          type:"textarea", required:true, placeholder:"A: airway patency/c-spine precautions. B: breathing/chest rise. C: circulation/hemorrhage control. D: disability/GCS. E: exposure/environment" },
      { id:"resuscitation_interventions", label:"Resuscitation Interventions *", type:"textarea", required:true, placeholder:"Two large-bore IVs, LR bolus mL, type & cross, labs drawn, 2-liter rule if abd trauma" },
      { id:"vitals_arrival",          label:"Vital Signs on Arrival *",           type:"text",     required:true,  placeholder:"BP, HR, RR, SpO2, Temp" },
      { id:"gcs_score_arrival",       label:"Glasgow Coma Scale on Arrival *", type:"number", required:true, placeholder:"3-15" },
      { id:"secondary_survey_htoe",   label:"Secondary Survey — Head to Toe *",  type:"textarea", required:true, placeholder:"HEENT, neck (c-spine clearance), chest, abdomen, pelvis, extremities, back/logroll, neuro exam" },
      { id:"imaging_performed",       label:"Imaging Performed/Ordered *",       type:"textarea",  required:true,  placeholder:"FAST exam (+ findings), X-rays (c-spine, pelvis, chest), CT (head, c-spine, chest, abd/pelvis), angio if indicated" },
      { id:"fast_exam_findings",      label:"FAST Exam Findings",                 type:"text",      required:false, placeholder:"Free fluid in RUQ, LUQ, peritoneal, pericardium" },
      { id:"procedures_performed",    label:"Procedures Performed",              type:"textarea", required:false, placeholder:"Chest tube (which side, indication), emergency resuscitative laparotomy, pelvic binder, etc." },
      { id:"blood_products_transfused", label:"Blood Products Transfused",       type:"textarea", required:false, placeholder:"PRBCs (# units), FFP, platelets, cryo — timing relative to arrival" },
      { id:"massive_transfusion_protocol", label:"Massive Transfusion Protocol", type:"select", required:false, options:["Activated","Considered but not triggered","Not applicable"] },
      { id:"consults_obtained",       label:"Consultants Notified/Present",      type:"text",     required:false, placeholder:"Surgery, ortho, neuro, interventional radiology — times" },
      { id:"disposition_trauma",      label:"Disposition *",                     type:"select",   required:true,  options:["Operating Room — emergent/urgent","ICU admission","Trauma floor/step-down","Observation","Died — time pronounced"] },
      { id:"family_communication",    label:"Family Communication",            type:"text",     required:false, placeholder:"Informed of injuries, plan, visiting policy" },
    ]
  },
  { id:"psychiatric-hold", label:"Psychiatric Hold / 5150", icon:"🧠", color:T.rose, description:"Involuntary hold documentation with danger criteria",
    fields:[
      { id:"danger_to_self",      label:"Danger to Self",               type:"select",   required:true,  options:["Yes — specific plan/intent","Yes — passive ideation","No"] },
      { id:"danger_to_others",    label:"Danger to Others",             type:"select",   required:true,  options:["Yes — specific threat","Yes — history","No"] },
      { id:"grave_disability",    label:"Grave Disability",             type:"select",   required:true,  options:["Yes — cannot care for self","Yes — high risk","No"] },
      { id:"psychiatric_history", label:"Relevant Psychiatric History", type:"textarea", required:true },
      { id:"current_medications", label:"Current Psych Medications",    type:"text",     required:false },
      { id:"substance_use",       label:"Substance Use Today",          type:"text",     required:false },
      { id:"mental_status",       label:"Mental Status Exam",           type:"textarea", required:true,  placeholder:"Appearance, behavior, affect, mood, speech, thought process, SI/HI" },
      { id:"rights_informed",     label:"Patient Rights Informed",      type:"select",   required:true,  options:["Yes — patient understood","Yes — patient refused to acknowledge","No — patient unable to understand"] },
      { id:"hold_type",           label:"Hold Type",                    type:"select",   required:true,  options:["5150 (72-hour involuntary hold)","5250 (14-day extension)","Voluntary hold"] },
      { id:"facility_placement",  label:"Placement Facility",           type:"text",     required:true,  placeholder:"Psychiatric hospital name" },
    ]
  },
  { id:"restraint-note", label:"Physical/Chemical Restraint", icon:"🔐", color:T.purple, description:"Restraint indication, de-escalation, continuous monitoring, compliance",
    fields:[
      { id:"restraint_indication_primary", label:"Clinical Indication *", type:"select", required:true, options:["Imminent danger to self (SI with plan/intent)","Imminent danger to others (active threats/violence)","Acute agitation preventing necessary medical evaluation","Delirium/altered mental status — safety risk","Behavioral crisis — unable to manage with less restrictive measures"] },
      { id:"de_escalation_attempted", label:"De-escalation Measures Attempted *", type:"textarea", required:true, placeholder:"Verbal redirection, 1:1 staff, family at bedside, moved to quiet room, anxiolytic offered prior to restraint" },
      { id:"why_alternatives_failed", label:"Why Less Restrictive Measures Failed *", type:"textarea", required:true, placeholder:"Describe why de-escalation was ineffective and restraint was the least restrictive option" },
      { id:"restraint_type_applied", label:"Type of Restraint Applied *", type:"select", required:true, options:["Physical restraint — 4-point (both wrists and ankles)","Physical restraint — 2-point (wrists only)","Chemical restraint (medication only)","Physical + Chemical combined","Seclusion only"] },
      { id:"chemical_agents_given", label:"Chemical Agent(s) Given", type:"textarea", required:false, placeholder:"Drug, dose, route, time. E.g., haloperidol 5mg IM 14:32, lorazepam 2mg IV 14:35" },
      { id:"time_restraint_applied", label:"Time Restraint Applied *", type:"text", required:true, placeholder:"HH:MM" },
      { id:"restraint_placed_by_staff", label:"Restraint Placed By *", type:"text", required:true, placeholder:"Number of staff, credentials (e.g., 4 nurses + security officer)" },
      { id:"physician_order_status", label:"Physician Order Status *", type:"select", required:true, options:["MD/DO present and supervised restraint — written order concurrent","MD/DO notified immediately and verbal order given","Emergency restraint initiated — MD/DO to write order within 1 hour"] },
      { id:"vitals_at_restraint", label:"Vitals When Restraint Applied *", type:"text", required:true, placeholder:"BP, HR, RR, SpO2" },
      { id:"continuous_monitoring_details", label:"Continuous Monitoring *", type:"textarea", required:true, placeholder:"1:1 eyes-on observation, vitals q15min, skin integrity checks at restraint edges, circulation/sensation checks distal to restraint q15min" },
      { id:"release_attempts_and_reassessment", label:"Release Attempts & Reassessment *", type:"textarea", required:true, placeholder:"q15-30min reassessment. E.g., 'Assessment at 14:50 — still agitated, restraint continued. 15:10 — calm, oriented x3, restraint d/c'd'" },
      { id:"complications_during_restraint", label:"Complications", type:"text", required:false, placeholder:"Skin breakdown, escalation, injury, cardiac event, respiratory compromise" },
      { id:"time_restraint_removed", label:"Time Restraint Removed *", type:"text", required:true, placeholder:"HH:MM" },
      { id:"total_duration_restraint", label:"Total Duration (minutes) *", type:"number", required:true },
      { id:"policy_compliance_status", label:"Facility Policy Compliance *", type:"select", required:true, options:["Fully compliant with facility restraint policy","Minor deviation — documented and reported","Significant deviation — incident report filed"] },
    ]
  },
  { id:"pronouncement-note", label:"Death Pronouncement", icon:"🕯️", color:T.dim, description:"Pronouncement documentation, family communication, coroner notification",
    fields:[
      { id:"time_of_death_pronounced", label:"Time of Death Pronounced *", type:"text", required:true, placeholder:"HH:MM — when provider declares death" },
      { id:"final_cardiac_rhythm",     label:"Final Cardiac Rhythm *",        type:"select",   required:true,  options:["Asystole (flatline)","Agonal/ineffective rhythm","No pulse with organized rhythm","No palpable pulse/BP after assessment"] },
      { id:"resuscitation_duration_mins", label:"Duration of Resuscitation (minutes) *", type:"number", required:true, placeholder:"Total downtime" },
      { id:"final_interventions_given", label:"Final Interventions Provided", type:"textarea", required:false, placeholder:"Last medications, defibrillations, airway maneuvers — last 5 min of resuscitation" },
      { id:"final_vitals_attempted",   label:"Final Vital Signs / Exam",      type:"text",     required:true,  placeholder:"BP, HR, RR, SpO2 attempts (likely none/asystole)" },
      { id:"physical_exam_declaration", label:"Physical Exam Findings Confirming Death *", type:"textarea", required:true, placeholder:"No breath sounds bilaterally, no heart sounds x 1 min, no carotid/femoral pulse x 1 min, pupils fixed & dilated" },
      { id:"presumed_cause_of_death",  label:"Presumed Cause of Death", type:"text", required:false, placeholder:"Cardiac arrest, massive PE, exsanguination, etc." },
      { id:"family_present_at_pronouncement", label:"Family Present at Pronouncement *", type:"select", required:true, options:["Yes — witnessed pronouncement","No — informed afterward","Family in waiting area — informed by staff"] },
      { id:"family_notification_provider", label:"Family Notified By *", type:"select", required:true, options:["MD/DO in person (at bedside)","MD/DO by phone","Nursing staff with MD/DO present"] },
      { id:"family_support_offered",   label:"Support Resources Offered to Family", type:"text", required:false, placeholder:"Chaplain, social work, grief counselor, time with body, viewing" },
      { id:"organ_tissue_donation_discussed", label:"Organ/Tissue Donation Discussion *", type:"select", required:true, options:["Yes — family interested in donation","Yes — family declined donation","No — medical contraindication to donation","No — not approached (specific reason)"] },
      { id:"organ_procurement_org_notified", label:"Organ Procurement Organization", type:"select", required:false, options:["OPO notified — accepted for evaluation","OPO notified — declined","Not applicable"] },
      { id:"coroner_me_notification_needed", label:"Coroner/Medical Examiner Notification Needed *", type:"select", required:true, options:["No — physician can certify death","Yes — suspicious circumstances","Yes — unattended death","Yes — death < 24h after admission","Yes — violent death/trauma"] },
      { id:"coroner_notified_how",     label:"Coroner Notification Method", type:"text", required:false, placeholder:"Phone call, web form, officer visit — name of coroner office" },
      { id:"coroner_case_number",      label:"Coroner Case Number", type:"text", required:false, placeholder:"If investigation opened" },
      { id:"autopsy_requested",        label:"Autopsy Status *", type:"select", required:true, options:["Autopsy ordered by coroner","Requested by family — consent obtained","Declined","Not applicable"] },
      { id:"disposition_of_body",      label:"Disposition of Body *", type:"select", required:true, options:["Released to funeral home (specified)","Released to family member","Coroner/ME custody for investigation","Pending family decision"] },
      { id:"death_certificate_status", label:"Death Certificate", type:"select", required:false, options:["Completed by MD","Pending coroner/ME","Not yet issued"] },
    ]
  },
  { id:"transfer-note", label:"Transfer / EMTALA", icon:"🚑", color:T.blue, description:"EMTALA-compliant inter-facility transfer documentation",
    fields:[
      { id:"emtala_mse_status", label:"EMTALA Medical Screening Exam *", type:"select", required:true, options:["Completed by qualified medical personnel before transfer decision","In progress at time of transfer — documented","Not completed — emergent transfer medically necessary (documented rationale)"] },
      { id:"transfer_indication", label:"Indication Category *", type:"select", required:true, options:["Higher level of care needed beyond this ED's capability","Specialty service unavailable (cardiac cath, trauma surgery, NICU, etc.)","Bed unavailability at this facility","Patient or family request — risks explained","Clinical instability requiring specialized team"] },
      { id:"transfer_reason_detail", label:"Specific Transfer Rationale *", type:"textarea", required:true, placeholder:"Which services can receiving facility provide that this facility cannot? Why transfer is medically indicated over continued care here." },
      { id:"stabilizing_treatment_given", label:"Stabilizing Treatment Provided *", type:"textarea", required:true, placeholder:"Meds, fluids, IV access, monitoring, labs, imaging completed prior to transfer" },
      { id:"clinical_status_transfer", label:"Clinical Status at Transfer *", type:"textarea", required:true, placeholder:"Current vitals, mental status, airway status — e.g., 'Hemodynamically stable on 2L NC, SpO2 96%, alert, cooperative'" },
      { id:"risks_of_transfer_explained", label:"Risks of Transfer Discussed *", type:"textarea", required:true, placeholder:"Transport time, risk of deterioration en route, pain during transport, no beds guaranteed, weather/logistics" },
      { id:"receiving_facility", label:"Receiving Facility *", type:"text", required:true, placeholder:"Hospital name, address, phone" },
      { id:"receiving_provider", label:"Accepting Provider/Service *", type:"text", required:true, placeholder:"Name, credentials, specialty — e.g., 'Dr. J. Smith, Interventional Cardiology, 555-1234'" },
      { id:"receiving_acceptance_status", label:"Receiving Facility Acceptance *", type:"select", required:true, options:["Bed confirmed available — patient accepted","Receiving provider verbally accepted — bed assignment pending","Conditional acceptance — specific requirements met"] },
      { id:"consent_for_transfer", label:"Informed Consent *", type:"select", required:true, options:["Yes — patient verbally consented","Yes — patient signed written transfer consent","Yes — surrogate/POA provided consent","Transfer medically necessary — patient unable to consent","Patient initially refused — risks explained, accepted after discussion"] },
      { id:"transport_mode", label:"Transport Method *", type:"select", required:true, options:["ALS ambulance (paramedics)","BLS ambulance (EMTs)","Critical care transport (specialized crew)","Air — helicopter","Air — fixed wing","Private vehicle — risks documented"] },
      { id:"transport_crew", label:"Transport Crew *", type:"text", required:true, placeholder:"Crew names and credentials" },
      { id:"accompanying_ed_staff", label:"ED Staff Accompanying", type:"text", required:false, placeholder:"Name, role (if applicable)" },
      { id:"records_transmitted", label:"Medical Records Transmitted *", type:"select", required:true, options:["Originals sent with patient","Copies sent with patient + originals retained","Faxed to receiving facility","Electronic/EHR transmission","Multiple methods used"] },
      { id:"physician_to_physician_communication", label:"Physician-to-Physician Communication *", type:"select", required:true, options:["Direct physician-to-physician phone call documented","Communication via nursing staff","Fax summary accepted","Multiple communications — all documented"] },
      { id:"time_transfer_requested", label:"Time Transfer Requested *", type:"text", required:true, placeholder:"HH:MM" },
      { id:"time_accepted_by_receiving", label:"Time Accepted by Receiving *", type:"text", required:true, placeholder:"HH:MM" },
      { id:"time_patient_departed_ed", label:"Time Patient Left ED *", type:"text", required:true, placeholder:"HH:MM" },
      { id:"transfer_documented_by", label:"Transfer Documented By *", type:"text", required:true, placeholder:"Provider name & credentials who approved transfer" },
    ]
  },
  { id:"discharge-instructions", label:"Discharge Instructions", icon:"🏠", color:T.green, description:"Safe discharge: meds, activity, wound care, follow-up, warning signs",
    fields:[
      { id:"discharge_dx_primary", label:"Primary Discharge Diagnosis *", type:"text", required:true, placeholder:"Main condition treated" },
      { id:"discharge_dx_secondary", label:"Secondary / Comorbid Diagnoses", type:"textarea", required:false, placeholder:"Additional diagnoses managed" },
      { id:"treatment_summary_ed", label:"Treatment Provided in ED *", type:"textarea", required:true, placeholder:"Medications given, procedures performed, IV fluids, imaging ordered, labs drawn" },
      { id:"continue_home_meds", label:"Home Medications to Continue", type:"textarea", required:false, placeholder:"Continue all home medications unless specified otherwise" },
      { id:"new_medications_rx", label:"New Medications Prescribed *", type:"textarea", required:true, placeholder:"Drug, dose, route, frequency, duration — e.g., Amoxicillin 500mg PO TID x10d" },
      { id:"medication_side_effects_counseled", label:"Side Effects Counseled *", type:"select", required:true, options:["Yes — common side effects reviewed","Not applicable — no new meds"] },
      { id:"drug_interactions_reviewed", label:"Drug Interactions *", type:"select", required:true, options:["Reviewed — no significant interactions","Reviewed — counseled on interactions","Not applicable — no new meds"] },
      { id:"allergies_confirmed", label:"Allergies Confirmed with Patient *", type:"select", required:true, options:["Yes — confirmed documented allergies","Yes — confirmed no known allergies","Unable to confirm — altered mental status"] },
      { id:"activity_instructions", label:"Activity Restrictions *", type:"textarea", required:true, placeholder:"No strenuous activity, bed rest, light walking only, etc. Or 'No restrictions' if applicable." },
      { id:"driving_restrictions", label:"Driving Restrictions *", type:"select", required:true, options:["No restrictions — safe to drive","No driving for 24h (sedation/anesthesia)","No driving while taking opioids or sedatives","Requires clearance before driving (seizure, syncope)"] },
      { id:"diet_instructions", label:"Diet Instructions *", type:"textarea", required:true, placeholder:"Regular diet, clear liquids, soft foods, NPO, increased fluid intake. Or 'No dietary restrictions'." },
      { id:"wound_care_instructions", label:"Wound / Dressing Care *", type:"textarea", required:true, placeholder:"Keep dry 24h, wash gently with soap/water daily, apply antibiotic ointment, change dressing q24h. Or 'No wound care needed'." },
      { id:"ice_heat_elevation", label:"Ice/Heat/Elevation", type:"text", required:false, placeholder:"Ice 20min q4h x48h, elevate above heart level, compression wrap" },
      { id:"return_to_work_school", label:"Return to Work/School *", type:"text", required:true, placeholder:"Can return today, 2 days rest recommended, work note provided" },
      { id:"primary_care_provider_name", label:"Follow-up Provider *", type:"text", required:true, placeholder:"PCP name, practice, phone number" },
      { id:"follow_up_timeframe", label:"Follow-up Timeframe *", type:"select", required:true, options:["24-48 hours","Within 1 week","Within 2 weeks","As needed","No follow-up required"] },
      { id:"follow_up_appointment_status", label:"Appointment Status *", type:"select", required:true, options:["Appointment arranged by ED (date/time given)","Patient to call PCP to schedule","Patient has standing appointment scheduled"] },
      { id:"specialist_referral_needed", label:"Specialist Referral *", type:"select", required:true, options:["Yes — referral given (specify specialty)","No specialist referral needed","To be arranged by PCP"] },
      { id:"when_to_call_doctor", label:"When to Call Doctor (NOT ER) *", type:"textarea", required:true, placeholder:"Minor worsening, questions about meds, mild pain not improving, non-urgent questions" },
      { id:"return_precautions_er", label:"Return to ER / Call 911 — Warning Signs *", type:"textarea", required:true, placeholder:"Fever > 38.5°C, severe pain, difficulty breathing, chest pain, fainting, uncontrolled bleeding, redness/warmth/drainage from wound, confusion" },
      { id:"understanding_confirmed", label:"Patient Understanding Confirmed *", type:"select", required:true, options:["Yes — patient verbalized understanding","Yes — written instructions in preferred language given","Partial — interpreter used (language specified)","No — altered mental status — family/surrogate instructed"] },
      { id:"interpreter_language", label:"Interpreter Language Used", type:"text", required:false, placeholder:"Spanish, Mandarin, ASL, etc. Leave blank if English" },
      { id:"written_copy_given", label:"Written Discharge Instructions *", type:"select", required:true, options:["Printed copy given to patient","Electronic copy sent (portal/email)","Patient declined written copy — verbal instructions given & documented"] },
      { id:"discharge_paperwork_signed", label:"Discharge Paperwork Signed *", type:"select", required:true, options:["Signed by patient","Signed by surrogate/POA","Patient refused to sign — documented"] },
    ]
  },
];

// ── Shared Field Renderer ─────────────────────────────────────────
function FieldRenderer({ fields, values, onChange, accentColor }) {
  const inputStyle = {
    width:"100%", background:"rgba(14,37,68,0.8)",
    border:"1px solid rgba(30,58,95,0.6)", borderRadius:8,
    padding:"9px 12px", color:T.bright, fontSize:13,
    outline:"none", boxSizing:"border-box", transition:"border-color .15s",
  };
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
      {fields.map(field => (
        <div key={field.id} style={{ gridColumn: field.type === "textarea" ? "1/-1" : "auto" }}>
          <label style={{ display:"block", fontSize:11, fontWeight:600, color:T.dim, marginBottom:5, textTransform:"uppercase", letterSpacing:".05em" }}>
            {field.label}{field.required && <span style={{color:accentColor}}> *</span>}
          </label>
          {field.type === "select" ? (
            <select value={values[field.id]||""} onChange={e=>onChange({...values,[field.id]:e.target.value})}
              style={{...inputStyle, cursor:"pointer"}}>
              <option value="">Select…</option>
              {field.options.map(o=><option key={o} value={o}>{o}</option>)}
            </select>
          ) : field.type === "textarea" ? (
            <textarea value={values[field.id]||""} onChange={e=>onChange({...values,[field.id]:e.target.value})}
              placeholder={field.placeholder} rows={3}
              style={{...inputStyle, resize:"vertical"}} />
          ) : (
            <input type={field.type==="number"?"number":"text"}
              value={values[field.id]||""} placeholder={field.placeholder}
              onChange={e=>onChange({...values,[field.id]:e.target.value})}
              style={inputStyle}
              onFocus={e=>e.target.style.borderColor=accentColor}
              onBlur={e=>e.target.style.borderColor="rgba(30,58,95,0.6)"}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Procedure Notes Panel ─────────────────────────────────────────
function ProcNotesPanel({ color }) {
  const [openCats, setOpenCats] = useState({});
  const [selTmpl, setSelTmpl] = useState(null);
  const [fields, setFields] = useState({});
  const [note, setNote] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genType, setGenType] = useState(null);
  const [extras, setExtras] = useState({ findings:"", impression:"", summary:"" });

  const byCategory = useMemo(() => {
    const g = {};
    PROC_CATEGORIES.filter(c=>c.id!=="all").forEach(c=>{
      g[c.id] = PROC_TEMPLATES.filter(t=>t.category===c.id);
    });
    return g;
  },[]);

  const cleanMarkdown = (t) => t.replace(/^#+\s+/gm,"").replace(/\*\*/g,"").replace(/\*/g,"").replace(/^-\s+/gm,"• ").replace(/\n{3,}/g,"\n\n");

  const generate = async (type) => {
    if(!selTmpl) return;
    setGenType(type); setGenerating(true);
    try {
      const fs = selTmpl.fields.map(f=>`${f.label}: ${fields[f.id]||"(not provided)"}`).join("\n");
      const prompts = {
        note:`You are Notrya AI. Draft a complete, medicolegally sound ${selTmpl.label} procedure note.\n\nCOMPLETED FIELDS:\n${fs}\n\nGenerate a complete structured note including: indication, preprocedure assessment, procedure description, postprocedure status, attestation. Format professionally.`,
        findings:`Based on the following ${selTmpl.label} procedure, generate 3-5 key findings:\n\n${fs}\n\nBullet list format.`,
        impression:`Generate a 2-3 sentence clinical impression for this ${selTmpl.label}:\n\n${fs}`,
        summary:`Provide a 1-paragraph summary (under 100 words) of this ${selTmpl.label}:\n\n${fs}`,
      };
      const result = await base44.integrations.Core.InvokeLLM({ prompt: prompts[type] });
      if(type==="note") setNote(result);
      else setExtras(p=>({...p,[type]:result}));
    } catch(e){console.error(e);} finally{setGenerating(false);setGenType(null);}
  };

  const handlePrint = () => {
    const win = window.open("","_blank");
    win.document.write(`<!DOCTYPE html><html><head><title>Procedure Note</title><style>body{font-family:'Segoe UI',Arial,sans-serif;max-width:800px;margin:40px auto;line-height:1.6;color:#333;}h1{border-bottom:2px solid #1f2937;padding-bottom:12px;}.content{white-space:pre-wrap;font-size:11pt;}</style></head><body><h1>PROCEDURE NOTE — ${selTmpl?.label||""}</h1><p>${new Date().toLocaleString()}</p><div class="content">${cleanMarkdown(note)}</div></body></html>`);
    win.document.close(); setTimeout(()=>win.print(),250);
  };

  return (
    <div style={{display:"flex",gap:14,height:"100%",minHeight:0}}>
      <div style={{...glass({borderRadius:12}),width:220,flexShrink:0,overflowY:"auto",padding:8}}>
        <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.dim,textTransform:"uppercase",letterSpacing:2,padding:"8px 8px 10px"}}>TEMPLATES</div>
        {PROC_CATEGORIES.filter(c=>c.id!=="all").map(cat=>(
          <div key={cat.id}>
            <button onClick={()=>setOpenCats(p=>({...p,[cat.id]:!p[cat.id]}))}
              style={{width:"100%",padding:"8px 10px",background:openCats[cat.id]?"rgba(22,45,79,0.8)":"transparent",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:6,borderRadius:8,borderBottom:"1px solid rgba(30,58,95,0.3)",marginBottom:2}}>
              <span style={{fontSize:12}}>{cat.label.split(" ")[0]}</span>
              <span style={{flex:1,textAlign:"left",fontSize:11,fontWeight:600,color:T.text}}>{cat.label.split(" ").slice(1).join(" ")}</span>
              <span style={{fontSize:10,color:T.dim,fontFamily:"JetBrains Mono"}}>{byCategory[cat.id]?.length||0}</span>
            </button>
            {openCats[cat.id] && byCategory[cat.id]?.map(t=>(
              <button key={t.id} onClick={()=>{setSelTmpl(t);setFields({});setNote("");setExtras({findings:"",impression:"",summary:""});}}
                style={{width:"100%",padding:"7px 8px 7px 20px",textAlign:"left",background:selTmpl?.id===t.id?`${color}20`:"transparent",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:6,fontSize:11.5,color:selTmpl?.id===t.id?T.bright:T.text,fontWeight:selTmpl?.id===t.id?700:400,borderRadius:6}}>
                <span>{t.icon}</span>{t.label}
              </button>
            ))}
          </div>
        ))}
      </div>
      <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",gap:10}}>
        {!selTmpl ? (
          <div style={{...glass({borderRadius:12}),flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:10}}>
            <span style={{fontSize:48}}>📋</span>
            <div style={{fontFamily:"DM Sans",fontSize:14,color:T.dim}}>Select a procedure template from the left to begin</div>
          </div>
        ) : (
          <>
            <div style={{...glass({borderRadius:12,background:`linear-gradient(135deg,${color}18,rgba(8,22,40,0.85))`}),padding:"14px 18px",display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:20}}>{selTmpl.icon}</span>
              <div>
                <div style={{fontFamily:"Playfair Display",fontSize:16,fontWeight:700,color:T.bright}}>{selTmpl.label}</div>
                <div style={{fontFamily:"DM Sans",fontSize:11,color:T.dim}}>Fill fields below then generate note</div>
              </div>
              {note && <button onClick={()=>navigator.clipboard.writeText(note)} style={{marginLeft:"auto",padding:"5px 12px",borderRadius:8,background:`${color}22`,border:`1px solid ${color}55`,color,fontSize:11,fontWeight:700,cursor:"pointer"}}>📋 Copy</button>}
            </div>
            <div style={{...glass({borderRadius:12}),padding:"16px 18px",overflowY:"auto",flex:1,display:"flex",flexDirection:"column",gap:14}}>
              <FieldRenderer fields={selTmpl.fields} values={fields} onChange={setFields} accentColor={color}/>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",paddingTop:4}}>
                <button onClick={()=>generate("note")} disabled={generating}
                  style={{flex:"1 1 auto",background:generating&&genType==="note"?`${color}30`:`linear-gradient(135deg,${color},${color}bb)`,color:generating&&genType==="note"?color:"#fff",fontWeight:700,fontSize:13,padding:"10px 16px",borderRadius:9,border:"none",cursor:generating?"not-allowed":"pointer",fontFamily:"DM Sans"}}>
                  {generating&&genType==="note"?"✨ Generating…":"✨ Generate Note"}
                </button>
                {[{k:"findings",label:"🔍 Findings"},{k:"impression",label:"💭 Impression"},{k:"summary",label:"📋 Summary"}].map(btn=>(
                  <button key={btn.k} onClick={()=>generate(btn.k)} disabled={generating}
                    style={{padding:"10px 14px",borderRadius:9,background:generating&&genType===btn.k?`${color}25`:"rgba(14,37,68,0.8)",border:`1px solid ${color}44`,color:generating&&genType===btn.k?color:T.dim,fontSize:12,fontWeight:600,cursor:generating?"not-allowed":"pointer",fontFamily:"DM Sans"}}>
                    {generating&&genType===btn.k?"✨…":btn.label}
                  </button>
                ))}
              </div>
              {(extras.summary||extras.findings||extras.impression||note) && (
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {extras.summary && (
                    <div style={{padding:"12px 14px",background:"rgba(155,109,255,0.08)",border:"1px solid rgba(155,109,255,0.25)",borderRadius:10,borderLeft:`3px solid ${T.purple}`}}>
                      <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.purple,marginBottom:6,textTransform:"uppercase",letterSpacing:2}}>Summary</div>
                      <div style={{fontFamily:"DM Sans",fontSize:13,color:T.text,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{cleanMarkdown(extras.summary)}</div>
                    </div>
                  )}
                  {extras.findings && (
                    <div style={{padding:"12px 14px",background:`${color}08`,border:`1px solid ${color}25`,borderRadius:10,borderLeft:`3px solid ${color}`}}>
                      <div style={{fontFamily:"JetBrains Mono",fontSize:9,color,marginBottom:6,textTransform:"uppercase",letterSpacing:2}}>Key Findings</div>
                      <div style={{fontFamily:"DM Sans",fontSize:13,color:T.text,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{cleanMarkdown(extras.findings)}</div>
                    </div>
                  )}
                  {extras.impression && (
                    <div style={{padding:"12px 14px",background:"rgba(244,114,182,0.08)",border:"1px solid rgba(244,114,182,0.25)",borderRadius:10,borderLeft:`3px solid ${T.rose}`}}>
                      <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.rose,marginBottom:6,textTransform:"uppercase",letterSpacing:2}}>Clinical Impression</div>
                      <div style={{fontFamily:"DM Sans",fontSize:13,color:T.text,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{cleanMarkdown(extras.impression)}</div>
                    </div>
                  )}
                  {note && (
                    <div style={{padding:"14px 16px",background:"rgba(5,15,30,0.6)",border:"1px solid rgba(30,58,95,0.5)",borderRadius:10}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                        <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.amber,textTransform:"uppercase",letterSpacing:2,flex:1}}>Full Procedure Note</div>
                        <button onClick={handlePrint} style={{padding:"4px 10px",borderRadius:6,background:`${color}15`,border:`1px solid ${color}40`,color,fontSize:10,fontWeight:700,cursor:"pointer"}}>🖨️ Print</button>
                      </div>
                      <div style={{fontFamily:"DM Sans",fontSize:13,color:T.text,lineHeight:1.8,whiteSpace:"pre-wrap"}}>{cleanMarkdown(note)}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── ED Notes Panel ────────────────────────────────────────────────
function EDNotesPanel({ color }) {
  const [sel, setSel] = useState(null);
  const [fields, setFields] = useState({});
  const [note, setNote] = useState("");
  const [generating, setGenerating] = useState(false);

  const generate = async () => {
    if(!sel) return; setGenerating(true);
    try {
      const fs = (sel.fields||[]).map(f=>`${f.label}: ${fields[f.id]||"(not provided)"}`).join("\n");
      const result = await base44.integrations.Core.InvokeLLM({ prompt:`You are Notrya AI. Draft a complete, medicolegally sound ${sel.label} note for an emergency medicine provider.\n\n${fs?`COMPLETED FIELDS:\n${fs}\n`:""}Generate a professional, complete note suitable for the medical record.` });
      setNote(result);
    } catch(e){console.error(e);} finally{setGenerating(false);}
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:12,height:"100%"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:8}}>
        {ED_NOTES.map(n=>(
          <button key={n.id} onClick={()=>{setSel(n);setFields({});setNote("");}} type="button"
            style={{...glass({borderRadius:12}),padding:"14px 16px",cursor:"pointer",transition:"all .18s",textAlign:"left",width:"100%",background:sel?.id===n.id?`linear-gradient(135deg,${n.color}22,rgba(8,22,40,0.85))`:`rgba(8,22,40,0.75)`,border:`1px solid ${sel?.id===n.id?n.color+"66":"rgba(30,58,95,0.55)"}`}}
            onMouseEnter={e=>{ if(sel?.id!==n.id) e.currentTarget.style.borderColor=n.color+"44"; }}
            onMouseLeave={e=>{ if(sel?.id!==n.id) e.currentTarget.style.borderColor="rgba(30,58,95,0.55)"; }}>
            <div style={{fontSize:24,marginBottom:6}}>{n.icon}</div>
            <div style={{fontFamily:"DM Sans",fontWeight:700,fontSize:13,color:T.bright,marginBottom:3}}>{n.label}</div>
            <div style={{fontFamily:"DM Sans",fontSize:11,color:T.dim,lineHeight:1.4}}>{n.description}</div>
          </button>
        ))}
      </div>
      {sel && (
        <div className="proc-fade" style={{...glass({borderRadius:12}),padding:"16px 18px",flex:1,display:"flex",flexDirection:"column",gap:12,minHeight:0,overflowY:"auto"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:18}}>{sel.icon}</span>
            <span style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:15,color:T.bright}}>{sel.label}</span>
            {note && <button onClick={()=>navigator.clipboard.writeText(note)} style={{marginLeft:"auto",padding:"4px 10px",borderRadius:7,background:`${sel.color}20`,border:`1px solid ${sel.color}55`,color:sel.color,fontSize:11,fontWeight:700,cursor:"pointer"}}>📋 Copy</button>}
          </div>
          {sel.fields?.length > 0 && <FieldRenderer fields={sel.fields} values={fields} onChange={setFields} accentColor={sel.color}/>}
          <button onClick={generate} disabled={generating}
            style={{width:"100%",background:generating?`${sel.color}30`:`linear-gradient(135deg,${sel.color},${sel.color}bb)`,color:generating?sel.color:"#fff",fontWeight:700,fontSize:13,padding:"11px",borderRadius:9,border:"none",cursor:generating?"not-allowed":"pointer",fontFamily:"DM Sans"}}>
            {generating?"✨ Drafting note…":"✨ AI Draft Note"}
          </button>
          {note && (
            <div style={{padding:"14px 16px",background:"rgba(5,15,30,0.6)",border:"1px solid rgba(30,58,95,0.5)",borderRadius:10,fontFamily:"DM Sans",fontSize:13,color:T.text,lineHeight:1.8,whiteSpace:"pre-wrap"}}>
              {note.replace(/^#+\s+/gm,"").replace(/\*\*/g,"").replace(/\*/g,"")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── CPT Search Panel ──────────────────────────────────────────────
function CPTSearchPanel({ color }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [copied, setCopied] = useState(null);

  const filtered = useMemo(()=>CPT_DATA.filter(row=>{
    const matchCat = category==="all" || row.category===category;
    const q = query.toLowerCase();
    return matchCat && (!q || row.cptCode.includes(q) || row.procedureName.toLowerCase().includes(q));
  }),[query,category]);

  const copyCode = (code) => { navigator.clipboard.writeText(code); setCopied(code); setTimeout(()=>setCopied(null),1500); };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:12,height:"100%"}}>
      <input value={query} onChange={e=>setQuery(e.target.value)}
        placeholder="Search procedures or CPT codes… e.g. 'laceration', '12002', 'intubation'"
        style={{width:"100%",background:"rgba(14,37,68,0.8)",border:"1px solid rgba(30,58,95,0.6)",borderRadius:10,padding:"12px 16px",color:T.bright,fontSize:13,fontFamily:"DM Sans",outline:"none",boxSizing:"border-box",transition:"border-color .15s"}}
        onFocus={e=>e.target.style.borderColor=color}
        onBlur={e=>e.target.style.borderColor="rgba(30,58,95,0.6)"}
      />
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {["all",...Object.keys(CATEGORY_LABELS)].map(cat=>(
          <button key={cat} onClick={()=>setCategory(cat)}
            style={{padding:"5px 12px",borderRadius:20,fontSize:11,fontWeight:600,cursor:"pointer",border:`1px solid ${category===cat?color+"55":"rgba(30,58,95,0.5)"}`,background:category===cat?`${color}18`:"transparent",color:category===cat?color:T.dim,transition:"all .15s",fontFamily:"DM Sans"}}>
            {cat==="all"?"All":CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>
      <div style={{...glass({borderRadius:12}),overflow:"hidden",flex:1,overflowY:"auto"}}>
        <div style={{display:"grid",gridTemplateColumns:"100px 1fr 120px 60px",borderBottom:"1px solid rgba(30,58,95,0.5)"}}>
          {["CPT Code","Procedure","Category","RVU"].map(h=>(
            <div key={h} style={{padding:"10px 14px",fontSize:10,fontWeight:700,color:T.dim,textTransform:"uppercase",letterSpacing:".06em"}}>{h}</div>
          ))}
        </div>
        {filtered.slice(0,60).map(row=>{
          const cc = CATEGORY_COLORS[row.category]||{bg:"rgba(74,114,153,0.12)",fg:T.dim};
          return (
            <React.Fragment key={row.cptCode}>
              <div style={{padding:"10px 14px",borderBottom:"1px solid rgba(30,58,95,0.25)",display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontFamily:"JetBrains Mono",fontSize:13,fontWeight:700,color}}>{row.cptCode}</span>
                <button onClick={()=>copyCode(row.cptCode)} style={{background:"transparent",border:"none",cursor:"pointer",color:copied===row.cptCode?T.green:T.muted,fontSize:11}}>
                  {copied===row.cptCode?"✓":"⎘"}
                </button>
              </div>
              <div style={{padding:"10px 14px",fontSize:13,color:T.bright,borderBottom:"1px solid rgba(30,58,95,0.25)"}}>{row.procedureName}</div>
              <div style={{padding:"10px 14px",borderBottom:"1px solid rgba(30,58,95,0.25)",display:"flex",alignItems:"center"}}>
                <span style={{padding:"2px 8px",borderRadius:6,fontSize:10,fontWeight:600,background:cc.bg,color:cc.fg}}>{CATEGORY_LABELS[row.category]||row.category}</span>
              </div>
              <div style={{padding:"10px 14px",fontFamily:"JetBrains Mono",fontSize:12,color:T.dim,borderBottom:"1px solid rgba(30,58,95,0.25)"}}>{row.rvu}</div>
            </React.Fragment>
          );
        })}
        {filtered.length===0 && <div style={{padding:"40px",textAlign:"center",color:T.dim,fontSize:13,gridColumn:"1/-1"}}>🔍 No results found</div>}
      </div>
    </div>
  );
}

// ── Procedure Log Panel ───────────────────────────────────────────
function ProcLogPanel({ color }) {
  const queryClient = useQueryClient();
  const emptyForm = { procedure_name:"",cpt_code:"",date_performed:new Date().toISOString().split("T")[0],location:"",supervision:"Attending (primary operator)",attempts:1,success:true,ultrasound_used:false,complications:"None",indication:"",attending_name:"",notes:"" };
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(true);

  const { data:logs=[], isLoading } = useQuery({ queryKey:["procedureLogs"], queryFn:()=>base44.entities.ProcedureLog.list("-date_performed",50) });
  const createMutation = useMutation({ mutationFn:d=>base44.entities.ProcedureLog.create(d), onSuccess:()=>{ queryClient.invalidateQueries({queryKey:["procedureLogs"]}); setForm(emptyForm); } });
  const deleteMutation = useMutation({ mutationFn:id=>base44.entities.ProcedureLog.delete(id), onSuccess:()=>queryClient.invalidateQueries({queryKey:["procedureLogs"]}) });

  const exportCSV = () => {
    const cols=["procedure_name","cpt_code","date_performed","location","supervision","attempts","success","ultrasound_used","complications","attending_name","indication"];
    const rows = logs.map(r=>cols.map(c=>JSON.stringify(r[c]??"")||" ").join(","));
    const blob=new Blob([[cols.join(","),...rows].join("\n")],{type:"text/csv"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="procedure_log.csv";a.click();
  };

  const inputStyle = { width:"100%",background:"rgba(14,37,68,0.8)",border:"1px solid rgba(30,58,95,0.6)",borderRadius:8,padding:"9px 12px",color:T.bright,fontSize:13,outline:"none",boxSizing:"border-box" };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:12,height:"100%"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
        {[
          {label:"Total Logged",val:logs.length,c:color},
          {label:"Successful",val:logs.filter(r=>r.success!==false).length,c:T.green},
          {label:"As Primary",val:logs.filter(r=>r.supervision==="Attending (primary operator)").length,c:T.teal},
          {label:"Unique Types",val:[...new Set(logs.map(r=>r.procedure_name).filter(Boolean))].length,c:T.purple},
        ].map((s,i)=>(
          <div key={i} style={{...glass({borderRadius:10,background:`linear-gradient(135deg,${s.c}12,rgba(8,22,40,0.8))`}),padding:"12px 14px"}}>
            <div style={{fontFamily:"JetBrains Mono",fontSize:22,fontWeight:700,color:s.c}}>{s.val}</div>
            <div style={{fontFamily:"DM Sans",fontSize:11,color:T.dim}}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{...glass({borderRadius:12}),overflow:"hidden"}}>
        <button onClick={()=>setShowForm(!showForm)}
          style={{width:"100%",padding:"12px 16px",background:showForm?"rgba(14,37,68,0.9)":"transparent",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:8,borderBottom:showForm?"1px solid rgba(30,58,95,0.5)":"none"}}>
          <span style={{fontFamily:"DM Sans",fontWeight:700,fontSize:13,color:T.bright}}>➕ Log New Procedure</span>
          <span style={{marginLeft:"auto",fontFamily:"JetBrains Mono",fontSize:11,color:T.dim}}>{showForm?"▼":"▶"}</span>
        </button>
        {showForm && (
          <div style={{padding:"16px"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
              {[
                {k:"date_performed",label:"Date",type:"date",col:1},{k:"procedure_name",label:"Procedure Name *",type:"text",col:2,placeholder:"e.g., Laceration Repair"},
                {k:"cpt_code",label:"CPT Code",type:"text",col:1,placeholder:"e.g., 12002"},{k:"location",label:"Site / Location",type:"text",col:2,placeholder:"e.g., right IJ"},
              ].map(f=>(
                <div key={f.k} style={{gridColumn:`span ${f.col}`}}>
                  <label style={{display:"block",fontSize:10,fontWeight:600,color:T.dim,marginBottom:5,textTransform:"uppercase",letterSpacing:".05em"}}>{f.label}</label>
                  <input type={f.type} value={form[f.k]} onChange={e=>setForm({...form,[f.k]:e.target.value})} placeholder={f.placeholder} style={inputStyle}/>
                </div>
              ))}
              <div style={{gridColumn:"span 2"}}>
                <label style={{display:"block",fontSize:10,fontWeight:600,color:T.dim,marginBottom:5,textTransform:"uppercase",letterSpacing:".05em"}}>Role *</label>
                <select value={form.supervision} onChange={e=>setForm({...form,supervision:e.target.value})} style={inputStyle}>
                  {["Attending (primary operator)","Supervising (resident/APP primary)","Assisted","Observed"].map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label style={{display:"block",fontSize:10,fontWeight:600,color:T.dim,marginBottom:5,textTransform:"uppercase",letterSpacing:".05em"}}>Attempts</label>
                <input type="number" min={1} max={20} value={form.attempts} onChange={e=>setForm({...form,attempts:+e.target.value})} style={inputStyle}/>
              </div>
              <div style={{gridColumn:"span 3",display:"flex",gap:20,alignItems:"center"}}>
                {[{k:"success",label:"Successful"},{k:"ultrasound_used",label:"US Guidance"}].map(tg=>(
                  <label key={tg.k} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>
                    <div onClick={()=>setForm({...form,[tg.k]:!form[tg.k]})}
                      style={{width:40,height:22,borderRadius:11,background:form[tg.k]?`${color}50`:"rgba(30,58,95,0.8)",border:`1px solid ${form[tg.k]?color:T.border}`,position:"relative",transition:"all .2s",cursor:"pointer"}}>
                      <div style={{position:"absolute",top:2,left:form[tg.k]?20:2,width:16,height:16,borderRadius:"50%",background:form[tg.k]?color:T.dim,transition:"left .2s"}}/>
                    </div>
                    <span style={{fontSize:12,fontWeight:600,color:T.text}}>{tg.label}</span>
                  </label>
                ))}
              </div>
              <div style={{gridColumn:"span 3"}}>
                <label style={{display:"block",fontSize:10,fontWeight:600,color:T.dim,marginBottom:5,textTransform:"uppercase",letterSpacing:".05em"}}>Complications</label>
                <input value={form.complications} onChange={e=>setForm({...form,complications:e.target.value})} placeholder="None" style={inputStyle}/>
              </div>
              <div style={{gridColumn:"span 2"}}>
                <label style={{display:"block",fontSize:10,fontWeight:600,color:T.dim,marginBottom:5,textTransform:"uppercase",letterSpacing:".05em"}}>Attending</label>
                <input value={form.attending_name} onChange={e=>setForm({...form,attending_name:e.target.value})} style={inputStyle}/>
              </div>
              <div>
                <label style={{display:"block",fontSize:10,fontWeight:600,color:T.dim,marginBottom:5,textTransform:"uppercase",letterSpacing:".05em"}}>Notes</label>
                <input value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Optional pearl…" style={inputStyle}/>
              </div>
            </div>
            <div style={{display:"flex",gap:8,marginTop:14}}>
              <button onClick={()=>{ if(form.procedure_name.trim()) createMutation.mutate(form); }}
                style={{background:`linear-gradient(135deg,${color},${color}aa)`,color:"#fff",fontWeight:700,fontSize:13,padding:"10px 22px",borderRadius:9,border:"none",cursor:"pointer",fontFamily:"DM Sans"}}>
                {createMutation.isPending?"Logging…":"➕ Log Procedure"}
              </button>
              <button onClick={()=>setForm(emptyForm)} style={{background:"transparent",color:T.dim,border:"1px solid rgba(30,58,95,0.5)",borderRadius:9,padding:"10px 16px",cursor:"pointer",fontSize:12,fontFamily:"DM Sans"}}>Clear</button>
              <button onClick={exportCSV} style={{marginLeft:"auto",padding:"10px 14px",borderRadius:9,background:`${T.green}15`,border:`1px solid ${T.green}44`,color:T.green,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"DM Sans"}}>⬇ CSV</button>
            </div>
          </div>
        )}
      </div>
      <div style={{...glass({borderRadius:12}),flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"10px 16px",borderBottom:"1px solid rgba(30,58,95,0.4)",fontFamily:"DM Sans",fontWeight:700,fontSize:12,color:T.text}}>
          Procedure History ({logs.length})
        </div>
        {isLoading ? (
          <div style={{padding:32,textAlign:"center",color:T.dim,fontFamily:"DM Sans"}}>Loading…</div>
        ) : logs.length===0 ? (
          <div style={{padding:40,textAlign:"center",color:T.dim,fontFamily:"DM Sans",fontSize:13}}>No procedures logged yet. Use the form above.</div>
        ) : (
          <div style={{overflowY:"auto",flex:1}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead>
                <tr style={{borderBottom:"1px solid rgba(30,58,95,0.5)"}}>
                  {["Date","Procedure","CPT","Role","Att.","✓","Complications",""].map(h=>(
                    <th key={h} style={{padding:"8px 12px",textAlign:"left",fontSize:10,fontWeight:700,color:T.dim,textTransform:"uppercase",letterSpacing:".06em"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map(row=>(
                  <tr key={row.id} style={{borderBottom:"1px solid rgba(30,58,95,0.25)"}}
                    onMouseEnter={e=>e.currentTarget.style.background="rgba(22,45,79,0.3)"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <td style={{padding:"9px 12px",color:T.dim,whiteSpace:"nowrap"}}>{row.date_performed?.split("T")[0]||"—"}</td>
                    <td style={{padding:"9px 12px",fontWeight:600,color:T.bright,maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{row.procedure_name}</td>
                    <td style={{padding:"9px 12px",fontFamily:"JetBrains Mono",color:color,fontSize:11}}>{row.cpt_code||"—"}</td>
                    <td style={{padding:"9px 12px",color:T.text,fontSize:11}}>{row.supervision?.split(" ")[0]||"—"}</td>
                    <td style={{padding:"9px 12px",color:T.text,fontSize:11}}>{row.attempts||1}</td>
                    <td style={{padding:"9px 12px",textAlign:"center"}}><span style={{color:row.success!==false?T.green:T.red,fontWeight:700}}>{row.success!==false?"✓":"✗"}</span></td>
                    <td style={{padding:"9px 12px",color:T.text,maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{row.complications||"—"}</td>
                    <td style={{padding:"9px 12px"}}><button onClick={()=>deleteMutation.mutate(row.id)} style={{background:"transparent",border:"none",color:T.dim,cursor:"pointer",fontSize:12}}>🗑️</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────
export default function Procedures() {
  const [activeId, setActiveId] = useState("proc-notes");
  const active = SECTIONS.find(s=>s.id===activeId);

  const renderPanel = () => {
    switch(activeId) {
      case "proc-notes": return <ProcNotesPanel color={active.color}/>;
      case "ed-notes":   return <EDNotesPanel color={active.color}/>;

      case "cpt-search": return <CPTSearchPanel color={active.color}/>;
      case "proc-log":   return <ProcLogPanel color={active.color}/>;
      case "billing":    return <div style={{height:"100%",overflowY:"auto",display:"flex",flexDirection:"column",gap:20}}><EMCalculator/><BillingModule/></div>;
      case "templates":  return <div style={{height:"100%",overflowY:"auto"}}><ProcedureTemplateManager/></div>;
      default:           return null;
    }
  };

  return (
    <div style={{ background:T.navy, minHeight:"100vh", fontFamily:"DM Sans,sans-serif", display:"flex", flexDirection:"column", position:"relative", overflow:"hidden" }}>
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}>
        <div style={{position:"absolute",top:"-20%",left:"-5%",width:"50%",height:"50%",background:`radial-gradient(circle,${active.color}18 0%,transparent 70%)`,transition:"background 1s ease"}}/>
        <div style={{position:"absolute",bottom:"-15%",right:"0",width:"40%",height:"40%",background:"radial-gradient(circle,rgba(0,212,188,0.08) 0%,transparent 70%)"}}/>
      </div>

      <div style={{...deepGlass({borderRadius:0}),padding:"16px 24px",flexShrink:0,zIndex:10,position:"relative",borderBottom:"1px solid rgba(30,58,95,0.6)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{...deepGlass({borderRadius:10}),padding:"6px 12px",display:"flex",gap:8,alignItems:"center"}}>
            <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.teal,letterSpacing:3}}>NOTRYA</span>
            <span style={{color:T.dim,fontFamily:"JetBrains Mono",fontSize:10}}>/</span>
            <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.dim,letterSpacing:2}}>PROCEDURES</span>
          </div>
          <div style={{height:1,flex:1,background:"linear-gradient(90deg,rgba(42,77,114,0.5),transparent)"}}/>
          <h1 className="proc-shimmer-txt" style={{fontFamily:"Playfair Display",fontSize:"clamp(20px,3vw,30px)",fontWeight:900,letterSpacing:-0.5}}>Procedure Suite</h1>
        </div>
      </div>

      <div style={{display:"flex",flex:1,minHeight:0,position:"relative",zIndex:1,overflow:"hidden"}}>
        <div style={{...deepGlass({borderRadius:0,borderRight:"1px solid rgba(30,58,95,0.6)"}),width:220,flexShrink:0,padding:"16px 10px",display:"flex",flexDirection:"column",gap:4,overflowY:"auto"}}>
          <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.dim,textTransform:"uppercase",letterSpacing:3,padding:"4px 8px 10px"}}>SECTIONS</div>
          {SECTIONS.map(sec=>{
            const isActive = sec.id===activeId;
            return (
              <div key={sec.id} className="proc-nav-item" onClick={()=>setActiveId(sec.id)}
                style={{padding:"10px 12px",borderRadius:10,background:isActive?`linear-gradient(135deg,${sec.color}22,rgba(14,37,68,0.6))`:"transparent",border:`1px solid ${isActive?sec.color+"55":"transparent"}`,position:"relative",transition:"background .18s,border .18s"}}>
                {isActive && <div style={{position:"absolute",left:0,top:"15%",height:"70%",width:2.5,background:sec.color,borderRadius:2,boxShadow:`0 0 8px ${sec.color}`}}/>}
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:16}}>{sec.icon}</span>
                  <div>
                    <div style={{fontFamily:"DM Sans",fontWeight:700,fontSize:13,color:isActive?T.bright:T.text}}>{sec.label}</div>
                    <div style={{fontFamily:"DM Sans",fontSize:10,color:T.dim,marginTop:1}}>{sec.sub}</div>
                  </div>
                </div>
              </div>
            );
          })}
          <div style={{flex:1}}/>
          <div style={{padding:"10px 8px",fontFamily:"JetBrains Mono",fontSize:9,color:T.dim,lineHeight:1.6,borderTop:"1px solid rgba(30,58,95,0.4)",marginTop:8}}>
            {CPT_DATA.length} CPT codes<br/>
            {PROC_TEMPLATES.length} procedure templates<br/>
            {ED_NOTES.length} ED note types
          </div>
        </div>

        <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{...glass({borderRadius:0,background:`linear-gradient(135deg,${active.gl},rgba(8,22,40,0.88))`,borderColor:active.br,borderLeft:"none",borderRight:"none",borderTop:"none"}),padding:"14px 24px",flexShrink:0,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:-30,right:-20,fontSize:100,opacity:.05}}>{active.icon}</div>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <span style={{fontSize:28}}>{active.icon}</span>
              <div>
                <h2 style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:"clamp(16px,2vw,22px)",color:T.bright,margin:0}}>{active.label}</h2>
                <div style={{fontFamily:"DM Sans",fontSize:12,color:T.dim,marginTop:2}}>{active.sub}</div>
              </div>
              <span style={{marginLeft:"auto",fontFamily:"JetBrains Mono",fontSize:9,color:active.color,background:`${active.color}18`,border:`1px solid ${active.color}44`,padding:"3px 10px",borderRadius:20,fontWeight:700,letterSpacing:1}}>ACTIVE</span>
            </div>
          </div>
          <div className="proc-fade" key={activeId} style={{flex:1,minHeight:0,overflowY:"auto",padding:"18px 24px"}}>
            {renderPanel()}
          </div>
        </div>
      </div>

      <div style={{textAlign:"center",padding:"8px",borderTop:"1px solid rgba(30,58,95,0.3)",position:"relative",zIndex:2}}>
        <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.dim,letterSpacing:2}}>NOTRYA PROCEDURE SUITE · {PROC_TEMPLATES.length} TEMPLATES · {CPT_DATA.length} CPT CODES</span>
      </div>
    </div>
  );
}