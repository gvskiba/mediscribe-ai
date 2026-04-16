// CommandPalette.jsx — v2
// Global ⌘+K command palette with:
//   1. Context-aware boosting — deterministic, reads encounter state, no API call
//   2. Debounced AI augmentation — fires when fuzzy results < 3, maps to command IDs
//   3. Quick action panel — > prefix triggers action mode
//      > differential  → route to diff section
//      > handoff       → route to handoff section
//      > discharge     → route to discharge section
//      > summarize     → AI encounter summary in output panel
//      > workup        → AI workup plan in output panel
//
// Open:  ⌘+K | Ctrl+K     Close: Esc | backdrop
// Navigate: ↑↓ then ↵     Action mode: > prefix
//
// Props:
//   onNavigate      fn(path)
//   onSelectSection fn(section)
//   isInEncounter   bool
//   demo, cc, vitals, pmhSelected, medications, disposition, activeSection
//
// Constraints: no form, no localStorage, no router import, straight quotes only,
//   single react import, border before borderTop/etc.,
//   finally { setBusy(false) } on all async functions

import { useState, useEffect, useCallback, useRef, useMemo } from "react";

// ── Tokens ────────────────────────────────────────────────────────────────────
const T = {
  bg:"#050f1e", panel:"#081628",
  txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0", red:"#ff4444",
};

// ── Command index ─────────────────────────────────────────────────────────────
const COMMANDS = [
  // Hubs
  { id:"ecg",        type:"hub",      icon:"💓", label:"ECGHub",                    path:"/ECGHub",            tags:["ecg","ekg","rhythm","qt","lbbb","stemi","afib","arrhythmia"] },
  { id:"airway",     type:"hub",      icon:"😮", label:"AirwayHub",                 path:"/AirwayHub",          tags:["rsi","intubation","airway","cric","video","bvm","preoxygenation"] },
  { id:"shock",      type:"hub",      icon:"⚡", label:"ShockHub",                  path:"/ShockHub",           tags:["shock","vasopressor","pressors","hypotension","map","septic"] },
  { id:"psych",      type:"hub",      icon:"🧠", label:"PsychHub",                  path:"/PsychHub",           tags:["psych","agitation","droperidol","haldol","psychiatric"] },
  { id:"sepsis",     type:"hub",      icon:"🦠", label:"SepsisHub",                 path:"/SepsisHub",          tags:["sepsis","bundle","lactate","qsofa","sofa","ssc","infection"] },
  { id:"sepsisabx",  type:"hub",      icon:"💊", label:"Sepsis Antibiotic Stewardship", path:"/SepsisAbxHub",   tags:["antibiotic","abx","sepsis","vancomycin","pip-tazo","cap","uti","carbapenem"] },
  { id:"erx",        type:"hub",      icon:"💊", label:"ERxHub",                    path:"/ERx",                tags:["erx","prescribing","medications","dosing","pharmacy"] },
  { id:"autocoder",  type:"hub",      icon:"🏷️", label:"AutocoderHub",              path:"/AutocoderHub",       tags:["coding","icd","cpt","billing","em","level"] },
  { id:"pocus",      type:"hub",      icon:"🔊", label:"POCUSHub",                  path:"/POCUSHub",           tags:["pocus","ultrasound","fast","rush","echo","blue","bedside"] },
  { id:"ortho",      type:"hub",      icon:"🦴", label:"OrthoHub",                  path:"/OrthoHub",           tags:["ortho","fracture","splint","dislocation","reduction"] },
  { id:"triage",     type:"hub",      icon:"🏥", label:"TriageHub",                 path:"/TriageHub",          tags:["triage","esi","acuity","ctas","priority"] },
  { id:"consult",    type:"hub",      icon:"📞", label:"ConsultHub",                path:"/ConsultHub",         tags:["consult","sbar","specialty","cardiology","surgery"] },
  { id:"procedures", type:"hub",      icon:"✂️", label:"EDProcedureNotes",          path:"/EDProcedureNotes",   tags:["procedure","laceration","lp","central","intubation"] },
  { id:"score",      type:"hub",      icon:"🧮", label:"ScoreHub",                  path:"/ScoreHub",           tags:["score","heart","wells","perc","curb","nexus","ottawa","gcs","risk"] },
  { id:"dose",       type:"hub",      icon:"⚖️", label:"WeightDoseHub",             path:"/WeightDoseHub",      tags:["dose","dosing","weight","rsi","epinephrine","ketamine"] },
  { id:"tox",        type:"hub",      icon:"☠️", label:"ToxHub",                    path:"/ToxHub",             tags:["tox","poison","antidote","overdose","nac","naloxone","nomogram","ingestion"] },
  { id:"lab",        type:"hub",      icon:"🔬", label:"LabInterpreter",            path:"/LabInterpreter",     tags:["lab","bmp","cbc","lft","abg","anion","gap","lactate","interpret"] },
  { id:"resus",      type:"hub",      icon:"❤️", label:"ResusHub",                  path:"/ResusHub",           tags:["resus","acls","pals","cpr","vf","pea","asystole","defib","arrest"] },
  { id:"stroke",     type:"hub",      icon:"🧠", label:"StrokeHub",                 path:"/StrokeHub",          tags:["stroke","tpa","nihss","lvo","dtn","alteplase","thrombectomy"] },
  { id:"pain",       type:"hub",      icon:"💊", label:"PainHub",                   path:"/PainHub",            tags:["pain","mme","opioid","ketamine","ketorolac","pdmp","rotation"] },
  { id:"chestpain",  type:"hub",      icon:"💓", label:"Chest Pain Hub",             path:"/ChestPainHub",       tags:["chest pain","heart score","acs","stemi","nstemi","troponin","edacs","heart"] },
  { id:"dyspnea",    type:"hub",      icon:"💨", label:"Dyspnea Hub",                path:"/DyspneaHub",         tags:["dyspnea","sob","chf","copd","asthma","pe","blue","bnp","perc","wells"] },
  { id:"headache",   type:"hub",      icon:"🤕", label:"Headache Hub",               path:"/HeadacheHub",        tags:["headache","sah","migraine","ottawa","lp","xanthochromia","cluster","snoop"] },
  { id:"abdpain",    type:"hub",      icon:"🔴", label:"Abdominal Pain Hub",         path:"/AbdominalPainHub",   tags:["abdominal","appendicitis","alvarado","bisap","pancreatitis","gi bleed","cholecystitis"] },
  { id:"ams",        type:"hub",      icon:"😵", label:"AMS Hub",                    path:"/AMSHub",             tags:["ams","altered mental status","delirium","cam-icu","rass","wernicke","encephalitis"] },
  { id:"dvt",        type:"hub",      icon:"🩸", label:"DVT / VTE Hub",              path:"/DVTHub",             tags:["dvt","vte","wells","doac","anticoagulation","rivaroxaban","apixaban","enoxaparin"] },
  { id:"peds",       type:"hub",      icon:"🧒", label:"Pediatric Hub",              path:"/PediatricHub",       tags:["pediatric","peds","broselow","pecarn","fever","rochester","westley","croup","pals"] },
  { id:"obgyn",      type:"hub",      icon:"🤰", label:"OB/GYN Hub",                 path:"/OBGYNHub",           tags:["ectopic","pregnancy","preeclampsia","hellp","magnesium","torsion","beta-hcg"] },
  { id:"trauma",     type:"hub",      icon:"🚑", label:"Trauma Hub",                 path:"/TraumaHub",          tags:["trauma","atls","mtp","txa","gcs","shock","nexus","hemorrhage","crash-2"] },
  { id:"syncope",    type:"hub",      icon:"💫", label:"Syncope Hub",                path:"/SyncopeHub",         tags:["syncope","faint","sfsr","csrs","canadian","rose","oesil","high risk"] },
  { id:"syncope",    type:"hub",      icon:"😵", label:"SyncopeHub",                path:"/SyncopeHub",         tags:["syncope","rose","sfsr","csrs","oesil","faint","loss consciousness"] },
  { id:"imaging",    type:"hub",      icon:"🖼️", label:"ImagingInterpreter",        path:"/ImagingInterpreter", tags:["imaging","cxr","xray","ct","radiology","report","interpret"] },
  { id:"wound",      type:"hub",      icon:"🩹", label:"WoundCareHub",              path:"/WoundCareHub",       tags:["wound","laceration","closure","tetanus","irrigation","abx","suture"] },
  { id:"seizure",    type:"hub",      icon:"⚡", label:"SeizureHub",                path:"/SeizureHub",         tags:["seizure","status","epilepticus","benzo","lorazepam","levetiracetam","keppra"] },
  // Encounter sections
  { id:"s_demo",     type:"section",  icon:"👤", label:"Demographics",              section:"demo",            tags:["demo","registration","patient","sdoh","demographics"] },
  { id:"s_triage",   type:"section",  icon:"📊", label:"Triage and Vitals",         section:"triage",          tags:["triage","vitals","esi","bp","hr","temp","spo2"] },
  { id:"s_hpi",      type:"section",  icon:"📝", label:"History of Present Illness",section:"hpi",            tags:["hpi","history","chief","complaint","onset","duration","oldcarts"] },
  { id:"s_diff",     type:"section",  icon:"🧠", label:"Smart Differential",        section:"diff",            tags:["differential","diagnosis","ddx","must miss","ai"] },
  { id:"s_ros",      type:"section",  icon:"🔍", label:"Review of Systems",         section:"ros",             tags:["ros","review","systems","symptoms"] },
  { id:"s_pe",       type:"section",  icon:"🩺", label:"Physical Exam",             section:"pe",              tags:["exam","physical","pe","auscultation","palpation"] },
  { id:"s_mdm",      type:"section",  icon:"📋", label:"Medical Decision Making",   section:"mdm",             tags:["mdm","decision","making","complexity","narrative","assessment","plan"] },
  { id:"s_consult",  type:"section",  icon:"📞", label:"Consult",                   section:"consult",         tags:["consult","specialty","call","cardiology","surgery","npi"] },
  { id:"s_scores",   type:"section",  icon:"🧮", label:"Clinical Scores",           section:"scores",          tags:["scores","heart","wells","perc","score","risk"] },
  { id:"s_labs",     type:"section",  icon:"🔬", label:"Lab Interpreter",           section:"labs",            tags:["labs","bmp","cbc","interpreter","results","abnormal"] },
  { id:"s_dosing",   type:"section",  icon:"⚖️", label:"Drug Dosing",               section:"dosing",          tags:["dosing","drugs","weight","dose","calculate"] },
  { id:"s_orders",   type:"section",  icon:"📋", label:"Orders",                    section:"orders",          tags:["orders","medications","labs","imaging","order"] },
  { id:"s_sepsis",   type:"section",  icon:"🦠", label:"Sepsis Bundle",             section:"sepsis",          tags:["sepsis","bundle","qsofa","lactate","hour"] },
  { id:"s_capacity", type:"section",  icon:"⚖️", label:"Capacity and AMA",          section:"capacity",        tags:["capacity","ama","appelbaum","refusal","against medical","consent"] },
  { id:"s_closeout", type:"section",  icon:"🚪", label:"Disposition",               section:"closeout",        tags:["disposition","discharge","admit","transfer","ama","lwbs","obs"] },
  { id:"s_handoff",  type:"section",  icon:"🤝", label:"Shift Handoff",             section:"handoff",         tags:["handoff","ipass","shift","sign out","care"] },
  { id:"s_discharge",type:"section",  icon:"🏠", label:"Discharge Instructions",    section:"discharge",       tags:["discharge","instructions","medications","follow up","aftercare"] },
  { id:"s_audit",    type:"section",  icon:"🔒", label:"Audit and Lock Note",       section:"audit",           tags:["audit","lock","note","hash","sign","finalize"] },
  // Scores
  { id:"q_heart",    type:"score",    icon:"💓", label:"HEART Score",               path:"/ScoreHub",           tags:["heart","acs","chest pain","troponin","risk","ecg"] },
  { id:"q_wells_pe", type:"score",    icon:"🫁", label:"Wells PE Score",            path:"/ScoreHub",           tags:["wells","pe","pulmonary embolism","dvt","probability","d-dimer"] },
  { id:"q_perc",     type:"score",    icon:"🫁", label:"PERC Rule",                 path:"/ScoreHub",           tags:["perc","pe","rule out","dimer","low risk"] },
  { id:"q_curb65",   type:"score",    icon:"🫁", label:"CURB-65",                   path:"/ScoreHub",           tags:["curb","pneumonia","cap","severity","mortality","inpatient"] },
  { id:"q_gcs",      type:"score",    icon:"🧠", label:"Glasgow Coma Scale",        path:"/ScoreHub",           tags:["gcs","glasgow","coma","consciousness","neuro","level"] },
  { id:"q_nihss",    type:"score",    icon:"🧠", label:"NIHSS",                     path:"/StrokeHub",          tags:["nihss","stroke","neurologic","deficit","scale","motor"] },
  { id:"q_rose",     type:"score",    icon:"😵", label:"ROSE Rule Syncope",         path:"/SyncopeHub",         tags:["rose","syncope","bnp","bradycardia","rule","cardiac"] },
  { id:"q_csrs",     type:"score",    icon:"😵", label:"CSRS Syncope",              path:"/SyncopeHub",         tags:["csrs","canadian","syncope","risk"] },
  // Drugs
  { id:"d_epi",      type:"drug",     icon:"💉", label:"Epinephrine",               path:"/WeightDoseHub",      tags:["epi","epinephrine","anaphylaxis","arrest","vasopressor","adrenaline"] },
  { id:"d_ketamine", type:"drug",     icon:"💉", label:"Ketamine",                  path:"/WeightDoseHub",      tags:["ketamine","rsi","dissociation","sedation","pain","induction"] },
  { id:"d_sux",      type:"drug",     icon:"💉", label:"Succinylcholine",           path:"/WeightDoseHub",      tags:["succinylcholine","sux","rsi","paralytic","nmb","depolarizing"] },
  { id:"d_roc",      type:"drug",     icon:"💉", label:"Rocuronium",                path:"/WeightDoseHub",      tags:["rocuronium","roc","rsi","paralytic","nmb","sugammadex"] },
  { id:"d_norepi",   type:"drug",     icon:"💉", label:"Norepinephrine",            path:"/WeightDoseHub",      tags:["norepinephrine","norepi","levophed","vasopressor","pressor","shock"] },
  { id:"d_nac",      type:"drug",     icon:"☠️", label:"N-Acetylcysteine NAC",      path:"/ToxHub",             tags:["nac","acetylcysteine","apap","tylenol","acetaminophen","antidote"] },
  { id:"d_naloxone", type:"drug",     icon:"☠️", label:"Naloxone",                  path:"/ToxHub",             tags:["naloxone","narcan","opioid","reversal","overdose","intranasal"] },
  { id:"d_vanc",     type:"drug",     icon:"🦠", label:"Vancomycin",                path:"/SepsisAbxHub",       tags:["vancomycin","vanc","mrsa","auc","trough","nephrotoxicity"] },
  { id:"d_alteplase",type:"drug",     icon:"🧠", label:"Alteplase tPA",             path:"/StrokeHub",          tags:["alteplase","tpa","thrombolytic","stroke","rtpa","dose"] },
  { id:"d_mag",      type:"drug",     icon:"💉", label:"Magnesium Sulfate",         path:"/WeightDoseHub",      tags:["magnesium","eclampsia","torsades","asthma","sulfate"] },
  { id:"d_fentanyl", type:"drug",     icon:"💉", label:"Fentanyl",                  path:"/WeightDoseHub",      tags:["fentanyl","opioid","analgesia","pain","rsi","intranasal"] },
  // Protocols
  { id:"p_rsi",      type:"protocol", icon:"😮", label:"RSI Protocol",              path:"/AirwayHub",          tags:["rsi","rapid sequence","intubation","preox","drugs"] },
  { id:"p_acls",     type:"protocol", icon:"❤️", label:"ACLS Cardiac Arrest",       path:"/ResusHub",           tags:["acls","arrest","vf","pea","asystole","cpr","epinephrine","timer"] },
  { id:"p_se",       type:"protocol", icon:"⚡", label:"Status Epilepticus",        path:"/SeizureHub",         tags:["status","epilepticus","seizure","benzo","lorazepam","keppra","refractory"] },
  { id:"p_stroke",   type:"protocol", icon:"🧠", label:"Stroke Protocol",           path:"/StrokeHub",          tags:["stroke","tpa","protocol","nihss","dtn","lvo","alteplase"] },
  { id:"p_sepsis",   type:"protocol", icon:"🦠", label:"Sepsis Protocol",           path:"/SepsisHub",          tags:["sepsis","protocol","bundle","antibiotics","fluids","vasopressor"] },
  { id:"p_ttm",      type:"protocol", icon:"✅", label:"Post-ROSC TTM",             path:"/ResusHub",           tags:["rosc","ttm","post arrest","temperature","targeted","cooling"] },
];

const CMD_ID_SET = new Set(COMMANDS.map(c => c.id));

// ── Type metadata ─────────────────────────────────────────────────────────────
const TYPE_META = {
  hub:      { label:"Hub",      color:T.teal,   bg:"rgba(0,229,192,0.12)"  },
  section:  { label:"Section",  color:T.blue,   bg:"rgba(59,158,255,0.12)" },
  score:    { label:"Score",    color:T.purple, bg:"rgba(155,109,255,0.12)"},
  drug:     { label:"Drug",     color:T.orange, bg:"rgba(255,159,67,0.12)" },
  protocol: { label:"Protocol", color:T.coral,  bg:"rgba(255,107,107,0.12)"},
};

// ── Quick actions ─────────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { id:"differential",
    aliases:["diff","ddx","differential","diagnosis","diagnose"],
    label:"Generate Differential",
    icon:"🧠", color:T.purple,
    desc:"AI differential from current CC, vitals, and PMH",
    mode:"route", section:"diff" },
  { id:"handoff",
    aliases:["handoff","sign out","signout","ipass","transfer"],
    label:"Start Shift Handoff",
    icon:"🤝", color:T.teal,
    desc:"I-PASS AI handoff from full encounter",
    mode:"route", section:"handoff" },
  { id:"discharge",
    aliases:["discharge","dc","instructions","aftercare","d/c"],
    label:"Generate Discharge Instructions",
    icon:"🏠", color:T.green,
    desc:"AI discharge with med reconciliation and follow-up",
    mode:"route", section:"discharge" },
  { id:"summarize",
    aliases:["summarize","summary","note","overview","brief","recap"],
    label:"Summarize Encounter",
    icon:"📋", color:T.gold,
    desc:"Brief AI summary of current encounter",
    mode:"generate", action:"summarize" },
  { id:"workup",
    aliases:["workup","work up","plan","orders","next steps","what to order"],
    label:"Generate Workup Plan",
    icon:"🔬", color:T.blue,
    desc:"AI prioritized workup based on CC and context",
    mode:"generate", action:"workup" },
  { id:"disposition",
    aliases:["disposition","admit","dispo","where to send"],
    label:"Go to Disposition",
    icon:"🚪", color:T.orange,
    desc:"Navigate to disposition panel",
    mode:"route", section:"closeout" },
];

// ── Fuzzy score ───────────────────────────────────────────────────────────────
function scoreMatch(cmd, q) {
  if (!q) return 0;
  const label = cmd.label.toLowerCase();
  const tags  = (cmd.tags || []).join(" ").toLowerCase();
  if (label.startsWith(q))                          return 100;
  if (label.includes(q))                             return 80;
  if (cmd.tags?.some(t => t === q))                  return 70;
  if (tags.includes(q))                              return 60;
  const words = q.split(/\s+/).filter(Boolean);
  if (words.length > 1) {
    const all = `${label} ${tags}`;
    if (words.every(w => all.includes(w)))            return 55;
  }
  return 0;
}

// ── Context boost — deterministic ────────────────────────────────────────────
function contextBoost(id, ctx) {
  const { activeSection, cc, disposition, vitals, pmhSelected, isInEncounter } = ctx;
  if (!isInEncounter) return 0;
  let b = 0;
  const ccT = (cc?.text || "").toLowerCase();
  const pmh  = (pmhSelected || []).map(p => p.toLowerCase());

  // Flow-adjacent sections
  const FLOW = ["demo","triage","hpi","diff","ros","pe","mdm",
    "consult","scores","labs","dosing","orders","sepsis",
    "capacity","closeout","handoff","discharge","audit"];
  const si = FLOW.indexOf(activeSection);
  if (si >= 0) {
    if (id === `s_${FLOW[si + 1]}`) b += 40;
    if (id === `s_${FLOW[si - 1]}`) b += 10;
    if (id === `s_${activeSection}`) b -= 20;
  }

  // CC pattern matching
  const ccBoosts = [
    { pattern:/chest\s*pain|angina|acs|nstemi|stemi/, ids:["q_heart","score","s_scores","ecg","p_acls"] },
    { pattern:/sob|dyspnea|breath|hypox|respiratory/, ids:["q_wells_pe","q_perc","airway","pocus","lab","q_curb65"] },
    { pattern:/seiz|convuls|epilep|sz/,               ids:["seizure","p_se"] },
    { pattern:/stroke|facial droop|aphasia|hemiplegia|weakness/, ids:["stroke","p_stroke","q_nihss"] },
    { pattern:/alter|ams|confus|lethargy|unresponsive/, ids:["q_gcs","s_diff","lab","tox","imaging"] },
    { pattern:/sepsis|fever|infect|bacteremia|chills/, ids:["sepsis","sepsisabx","p_sepsis","lab"] },
    { pattern:/overdose|ingestion|poison|OD/,          ids:["tox","d_nac","d_naloxone"] },
    { pattern:/syncope|faint|pass out|loss of conscious/, ids:["syncope","q_rose","q_csrs","ecg"] },
    { pattern:/trauma|fracture|injury|mvs|mvc|fall/,   ids:["ortho","procedures","imaging"] },
    { pattern:/cardiac arrest|arrest|cpr|down/,        ids:["resus","p_acls","dose"] },
    { pattern:/intubat|rsi|airway/,                    ids:["airway","p_rsi","dose"] },
  ];
  ccBoosts.forEach(({ pattern, ids }) => {
    if (pattern.test(ccT) && ids.includes(id)) b += 55;
  });

  // PMH boosts
  if (pmh.some(p => /warfarin|coumadin|anticoagul|afib/.test(p))) {
    if (["lab","ecg"].includes(id)) b += 20;
  }
  if (pmh.some(p => /hiv|transplant|immunocompromised|chemo/.test(p))) {
    if (["sepsisabx","lab"].includes(id)) b += 25;
  }

  // Disposition context
  if (disposition === "admit"    && ["s_handoff","s_audit","autocoder"].includes(id)) b += 40;
  if (disposition === "discharge"&& ["s_discharge","s_audit","autocoder"].includes(id)) b += 50;
  if (disposition === "ama"      && id === "s_capacity") b += 80;
  if (disposition === "transfer" && ["s_handoff","s_audit"].includes(id)) b += 60;

  // Vital sign flags
  const hr   = parseFloat(vitals?.hr);
  const sbp  = parseFloat((vitals?.bp || "").split("/")[0]);
  const spo2 = parseFloat(vitals?.spo2);
  if (!isNaN(sbp)  && sbp  < 90  && ["resus","shock","p_acls","dose"].includes(id)) b += 50;
  if (!isNaN(spo2) && spo2 < 92  && ["airway","p_rsi","pocus"].includes(id)) b += 50;
  if (!isNaN(hr)   && hr   > 130 && ["ecg","resus","shock"].includes(id)) b += 30;

  return b;
}

// ── Quick action detector ─────────────────────────────────────────────────────
function detectAction(query) {
  const q = query.trim().toLowerCase();
  if (!q.startsWith(">")) return null;
  const cmd = q.slice(1).trim();
  if (!cmd) return { action:null, suggestions:QUICK_ACTIONS };
  const exact = QUICK_ACTIONS.find(a =>
    a.aliases.some(al => al === cmd || cmd === al ||
      al.startsWith(cmd) || cmd.startsWith(al.split(" ")[0]))
  );
  if (exact) return { action:exact, suggestions:[exact] };
  const partial = QUICK_ACTIONS.filter(a =>
    a.aliases.some(al => al.includes(cmd) || cmd.includes(al.split(" ")[0]))
  );
  return { action:null, suggestions:partial.length ? partial : QUICK_ACTIONS };
}

// ── AI prompts ────────────────────────────────────────────────────────────────
function augmentPrompt(query, ctx) {
  const ids = COMMANDS.map(c => c.id).join(",");
  return {
    system:"You are a command router for an ED clinical decision support app. Return ONLY a valid JSON array of command IDs from the provided list. No other text, no markdown.",
    user:`Query: "${query}"
Patient: CC="${ctx.cc?.text || ""}" Section="${ctx.activeSection || ""}" PMH="${(ctx.pmhSelected||[]).slice(0,4).join(",")}"
Available IDs: ${ids}
Return 3-5 most relevant IDs as a JSON array.`,
  };
}

function actionPrompt(type, ctx) {
  const { demo, cc, vitals, pmhSelected, medications } = ctx;
  const pt  = [demo?.age && `${demo.age}yo`, demo?.sex].filter(Boolean).join(" ");
  const ccT = cc?.text || "not specified";
  const pmh = (pmhSelected || []).slice(0,5).join(", ") || "none";
  const meds = (medications || [])
    .map(m => typeof m === "string" ? m : m.name || "")
    .filter(Boolean).slice(0,5).join(", ") || "none";
  const vs  = [
    vitals?.hr   && `HR ${vitals.hr}`,
    vitals?.bp   && `BP ${vitals.bp}`,
    vitals?.spo2 && `SpO2 ${vitals.spo2}%`,
    vitals?.temp && `T ${vitals.temp}`,
  ].filter(Boolean).join("  ") || "not recorded";
  const base = `Patient: ${pt||"unknown"}. CC: ${ccT}. Vitals: ${vs}. PMH: ${pmh}. Meds: ${meds}.`;

  if (type === "summarize") return {
    system:"You are an emergency medicine physician. Write a concise ED encounter summary using medical terminology. 3-5 sentences. Format: patient intro sentence → key findings → current plan.",
    user:`${base}\nGenerate a brief ED encounter summary.`,
  };
  if (type === "workup") return {
    system:"You are an emergency medicine physician. Generate a focused, prioritized ED workup plan. Use a numbered list. Include labs, imaging, and bedside assessments. 6-10 items max. Prioritize time-sensitive items first. Be specific.",
    user:`${base}\nGenerate a focused ED workup plan.`,
  };
  return { system:"Emergency medicine clinical assistant.", user:base };
}

// ── Session recents ───────────────────────────────────────────────────────────
const recentIds = [];
function addRecent(id) {
  const i = recentIds.indexOf(id);
  if (i >= 0) recentIds.splice(i, 1);
  recentIds.unshift(id);
  if (recentIds.length > 6) recentIds.pop();
}

// ── ResultItem ────────────────────────────────────────────────────────────────
function ResultItem({ cmd, active, onSelect, rawQuery, aiSuggested, contextual }) {
  const tm  = TYPE_META[cmd.type] || TYPE_META.hub;
  const ref = useRef(null);
  useEffect(() => {
    if (active && ref.current) ref.current.scrollIntoView({ block:"nearest", behavior:"smooth" });
  }, [active]);

  const labelEl = useMemo(() => {
    const q = (rawQuery || "").trim();
    if (!q) return cmd.label;
    try {
      const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")})`, "gi");
      const parts = cmd.label.split(re);
      return parts.map((p, i) =>
        re.test(p)
          ? <mark key={i} style={{ background:`${tm.color}30`, color:tm.color, borderRadius:2, padding:"0 1px" }}>{p}</mark>
          : p
      );
    } catch { return cmd.label; }
  }, [cmd.label, rawQuery, tm.color]);

  return (
    <button ref={ref} onClick={() => onSelect(cmd)}
      style={{ display:"flex", alignItems:"center", gap:10, width:"100%",
        padding:"9px 14px", cursor:"pointer", textAlign:"left",
        border:"none", transition:"background .1s",
        background:active ? `linear-gradient(135deg,${tm.color}14,${tm.color}06)` : "transparent",
        borderLeft:`3px solid ${active ? tm.color : "transparent"}` }}>
      <div style={{ width:32, height:32, borderRadius:8, flexShrink:0,
        display:"flex", alignItems:"center", justifyContent:"center",
        background:active ? tm.bg : "rgba(14,37,68,0.5)", fontSize:16 }}>
        {cmd.icon}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
          fontSize:13, color:active ? T.txt : T.txt2,
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {labelEl}
        </div>
        {cmd.desc && (
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
            color:T.txt4, marginTop:1,
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {cmd.desc}
          </div>
        )}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:5, flexShrink:0 }}>
        {aiSuggested && (
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
            letterSpacing:1, textTransform:"uppercase", padding:"1px 5px",
            borderRadius:3, background:"rgba(155,109,255,0.12)",
            border:"1px solid rgba(155,109,255,0.3)", color:T.purple }}>AI</span>
        )}
        {contextual && !aiSuggested && (
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
            letterSpacing:1, textTransform:"uppercase", padding:"1px 5px",
            borderRadius:3, background:"rgba(0,229,192,0.1)",
            border:"1px solid rgba(0,229,192,0.25)", color:T.teal }}>CTX</span>
        )}
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          fontWeight:700, letterSpacing:1, textTransform:"uppercase",
          padding:"2px 7px", borderRadius:4,
          background:tm.bg, color:tm.color, border:`1px solid ${tm.color}30` }}>
          {tm.label}
        </span>
        {active && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4 }}>↵</span>}
      </div>
    </button>
  );
}

// ── ActionItem ────────────────────────────────────────────────────────────────
function ActionItem({ qa, active, onSelect }) {
  const ref = useRef(null);
  useEffect(() => {
    if (active && ref.current) ref.current.scrollIntoView({ block:"nearest", behavior:"smooth" });
  }, [active]);
  return (
    <button ref={ref} onClick={() => onSelect(qa)}
      style={{ display:"flex", alignItems:"center", gap:10, width:"100%",
        padding:"9px 14px", cursor:"pointer", textAlign:"left",
        border:"none", transition:"background .1s",
        background:active ? `linear-gradient(135deg,${qa.color}14,${qa.color}06)` : "transparent",
        borderLeft:`3px solid ${active ? qa.color : "transparent"}` }}>
      <div style={{ width:32, height:32, borderRadius:8, flexShrink:0,
        display:"flex", alignItems:"center", justifyContent:"center",
        background:active ? `${qa.color}20` : "rgba(14,37,68,0.5)", fontSize:16 }}>
        {qa.icon}
      </div>
      <div style={{ flex:1 }}>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
          fontSize:13, color:active ? T.txt : T.txt2 }}>{qa.label}</div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
          color:T.txt4, marginTop:1 }}>{qa.desc}</div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:5, flexShrink:0 }}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          letterSpacing:1, textTransform:"uppercase", padding:"2px 7px",
          borderRadius:4, background:`${qa.color}15`, color:qa.color,
          border:`1px solid ${qa.color}30` }}>
          {qa.mode === "generate" ? "AI" : "Navigate"}
        </span>
        {active && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4 }}>↵</span>}
      </div>
    </button>
  );
}

// ── OutputPanel ───────────────────────────────────────────────────────────────
function OutputPanel({ output, busy, error, label, onCopy, copied, onClear }) {
  return (
    <div style={{ padding:"11px 14px", borderTop:"1px solid rgba(26,53,85,0.45)" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:7 }}>
        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.purple, letterSpacing:1.5, textTransform:"uppercase" }}>
            🧠 {label || "AI Output"}
          </span>
          {busy && <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.txt4 }}>generating…</span>}
        </div>
        <div style={{ display:"flex", gap:5 }}>
          {output && (
            <button onClick={onCopy}
              style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
                fontSize:11, padding:"3px 10px", borderRadius:6, cursor:"pointer",
                border:`1px solid ${copied ? T.green+"66" : "rgba(42,79,122,0.4)"}`,
                background:copied ? "rgba(61,255,160,0.1)" : "rgba(42,79,122,0.15)",
                color:copied ? T.green : T.txt4 }}>
              {copied ? "✓ Copied" : "Copy"}
            </button>
          )}
          <button onClick={onClear}
            style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              padding:"3px 9px", borderRadius:6, cursor:"pointer",
              border:"1px solid rgba(42,79,122,0.35)",
              background:"transparent", color:T.txt4, letterSpacing:1 }}>
            Clear
          </button>
        </div>
      </div>
      {error && (
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.coral,
          padding:"6px 8px", borderRadius:6,
          background:"rgba(255,107,107,0.08)", border:"1px solid rgba(255,107,107,0.25)" }}>
          {error}
        </div>
      )}
      {busy && !output && (
        <div style={{ display:"flex", gap:6, padding:"8px 0", alignItems:"center" }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width:7, height:7, borderRadius:"50%", background:T.purple }}
              className={`dot-${i}`} />
          ))}
          <style>{`
            .dot-0{animation:dpulse 1.2s ease-in-out 0s infinite}
            .dot-1{animation:dpulse 1.2s ease-in-out 0.2s infinite}
            .dot-2{animation:dpulse 1.2s ease-in-out 0.4s infinite}
            @keyframes dpulse{0%,100%{opacity:0.3;transform:scale(0.8)}50%{opacity:1;transform:scale(1)}}
          `}</style>
        </div>
      )}
      {output && (
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
          color:T.txt2, lineHeight:1.75, maxHeight:200, overflowY:"auto",
          whiteSpace:"pre-wrap", padding:"8px 10px", borderRadius:7,
          background:"rgba(5,15,30,0.85)", border:"1px solid rgba(42,79,122,0.3)" }}>
          {output}
        </div>
      )}
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────
export default function CommandPalette({
  onNavigate, onSelectSection,
  isInEncounter = false,
  demo, cc, vitals, pmhSelected, medications,
  disposition, activeSection,
}) {
  const [open,          setOpen]         = useState(false);
  const [query,         setQuery]        = useState("");
  const [activeIdx,     setActiveIdx]    = useState(0);
  const [aiIds,         setAiIds]        = useState([]);
  const [aiLoading,     setAiLoading]    = useState(false);
  const [actionOutput,  setActionOutput] = useState(null);
  const [actionBusy,    setActionBusy]   = useState(false);
  const [actionError,   setActionError]  = useState(null);
  const [actionLabel,   setActionLabel]  = useState("");
  const [copied,        setCopied]       = useState(false);
  const inputRef   = useRef(null);
  const debRef     = useRef(null);

  const ctx = useMemo(() => ({
    activeSection, cc, vitals, pmhSelected,
    medications, disposition, demo, isInEncounter,
  }), [activeSection, cc, vitals, pmhSelected,
      medications, disposition, demo, isInEncounter]);

  const handleOpen = useCallback(() => {
    setOpen(true); setQuery(""); setActiveIdx(0);
    setAiIds([]); setActionOutput(null); setActionError(null);
    setTimeout(() => inputRef.current?.focus(), 40);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false); setQuery(""); setActiveIdx(0);
    setAiIds([]); setActionOutput(null); setActionError(null);
    clearTimeout(debRef.current);
  }, []);

  // ⌘+K
  useEffect(() => {
    const h = e => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        open ? handleClose() : handleOpen();
      }
      if (e.key === "Escape" && open) handleClose();
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, handleOpen, handleClose]);

  // Action mode detection
  const actionState = useMemo(() => detectAction(query), [query]);
  const isActionMode = Boolean(actionState);

  // Results
  const results = useMemo(() => {
    if (isActionMode) return [];
    const q = query.trim().toLowerCase();
    if (!q) {
      const recent = recentIds.map(id => COMMANDS.find(c => c.id === id))
        .filter(Boolean).map(c => ({ ...c, _recent:true }));
      const ctx_suggestions = COMMANDS
        .filter(c => !recentIds.includes(c.id))
        .map(c => ({ ...c, _boost:contextBoost(c.id, ctx) }))
        .filter(c => c._boost > 20)
        .sort((a, b) => b._boost - a._boost)
        .slice(0, 5)
        .map(c => ({ ...c, _contextual:true }));
      return [...recent, ...ctx_suggestions].slice(0, 9);
    }

    let pool = COMMANDS;
    let sq   = q;
    const typeMatch = q.match(/^(hub|drug|score|section|protocol):/);
    if (typeMatch) { pool = COMMANDS.filter(c => c.type === typeMatch[1]); sq = q.slice(typeMatch[1].length+1).trim(); }

    return pool
      .map(c => {
        const fuzz  = scoreMatch(c, sq);
        const boost = contextBoost(c.id, ctx);
        const aiB   = aiIds.includes(c.id) ? 35 : 0;
        return { ...c, _score:fuzz + boost*0.35 + aiB,
          _aiSuggested:aiIds.includes(c.id),
          _contextual:boost > 30 && fuzz === 0 };
      })
      .filter(c => c._score > 0)
      .sort((a, b) => b._score - a._score)
      .slice(0, 12);
  }, [query, ctx, aiIds, isActionMode]);

  // Debounced AI augmentation
  useEffect(() => {
    clearTimeout(debRef.current);
    if (isActionMode || !query.trim() || query.trim().length < 8 || results.length >= 3) return;
    debRef.current = setTimeout(async () => {
      setAiLoading(true);
      try {
        const { system, user } = augmentPrompt(query.trim(), ctx);
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method:"POST",
          headers:{ "Content-Type":"application/json", "anthropic-dangerous-direct-browser-access":"true" },
          body:JSON.stringify({
            model:"claude-sonnet-4-20250514",
            max_tokens:150,
            system,
            messages:[{ role:"user", content:user }],
          }),
        });
        const data = await res.json();
        const raw  = data.content?.find(b => b.type === "text")?.text || "[]";
        const ids  = JSON.parse(raw.replace(/```json|```/g,"").trim());
        if (Array.isArray(ids)) setAiIds(ids.filter(id => CMD_ID_SET.has(id)).slice(0,5));
      } catch { /* silent */ }
      finally { setAiLoading(false); }
    }, 450);
    return () => clearTimeout(debRef.current);
  }, [query, results.length, ctx, isActionMode]);

  // Execute action
  const executeAction = useCallback(async (qa) => {
    if (qa.mode === "route") {
      addRecent(qa.id);
      handleClose();
      if (onSelectSection) onSelectSection(qa.section);
      return;
    }
    setActionOutput(null); setActionError(null);
    setActionLabel(qa.label);
    setActionBusy(true);
    try {
      const { system, user } = actionPrompt(qa.action, ctx);
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json", "anthropic-dangerous-direct-browser-access":"true" },
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:600,
          system,
          messages:[{ role:"user", content:user }],
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      setActionOutput(data.content?.find(b => b.type === "text")?.text || "");
    } catch (e) {
      setActionError("Error: " + (e.message || "Check API connectivity"));
    } finally {
      setActionBusy(false);
    }
  }, [ctx, handleClose, onSelectSection]);

  const actionItems = isActionMode
    ? (actionState?.action ? [actionState.action] : (actionState?.suggestions || []))
    : [];
  const totalItems = isActionMode ? actionItems.length : results.length;

  useEffect(() => { setActiveIdx(p => Math.min(p, Math.max(0, totalItems-1))); }, [totalItems]);

  const handleSelectCmd = useCallback((cmd) => {
    addRecent(cmd.id);
    handleClose();
    if (cmd.section && onSelectSection) onSelectSection(cmd.section);
    else if (cmd.path && onNavigate) onNavigate(cmd.path);
  }, [handleClose, onNavigate, onSelectSection]);

  const onKeyDown = useCallback(e => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(p => Math.min(p+1, totalItems-1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx(p => Math.max(p-1, 0)); }
    else if (e.key === "Enter") {
      e.preventDefault();
      if (isActionMode) { const qa = actionItems[activeIdx]; if (qa) executeAction(qa); }
      else { const cmd = results[activeIdx]; if (cmd) handleSelectCmd(cmd); }
    }
  }, [totalItems, isActionMode, actionItems, results, activeIdx, executeAction, handleSelectCmd]);

  const copyOutput = useCallback(() => {
    if (!actionOutput) return;
    navigator.clipboard.writeText(actionOutput).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2500);
    });
  }, [actionOutput]);

  // Closed: trigger button
  if (!open) {
    return (
      <button onClick={handleOpen}
        style={{ display:"flex", alignItems:"center", gap:7,
          padding:"5px 13px", borderRadius:20, cursor:"pointer",
          fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:12,
          transition:"all .15s",
          border:"1px solid rgba(42,79,122,0.45)",
          background:"rgba(42,79,122,0.1)", color:T.txt4 }}>
        <span>🔍</span><span>Search</span>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4 }}>⌘K</span>
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div onClick={handleClose}
        style={{ position:"fixed", inset:0, zIndex:1000,
          background:"rgba(5,15,30,0.72)",
          backdropFilter:"blur(4px)", WebkitBackdropFilter:"blur(4px)" }} />

      {/* Palette */}
      <div style={{ position:"fixed", top:"12vh", left:"50%",
        transform:"translateX(-50%)",
        width:"min(700px, 94vw)", zIndex:1001,
        background:"rgba(8,18,42,0.98)",
        border:"1px solid rgba(42,79,122,0.65)",
        borderRadius:16,
        boxShadow:"0 24px 80px rgba(0,0,0,0.72), 0 0 0 1px rgba(0,229,192,0.06)",
        overflow:"hidden" }}>

        {/* Input */}
        <div style={{ display:"flex", alignItems:"center", gap:10,
          padding:"14px 16px",
          borderBottom:"1px solid rgba(26,53,85,0.5)" }}>
          <span style={{ fontSize:18, flexShrink:0 }}>{isActionMode ? "⚡" : "🔍"}</span>
          <input ref={inputRef} value={query}
            onChange={e => { setQuery(e.target.value); setActiveIdx(0); setAiIds([]);
              if (!e.target.value.startsWith(">")) { setActionOutput(null); setActionError(null); }
            }}
            onKeyDown={onKeyDown}
            placeholder={isActionMode
              ? "Type action — differential, summarize, workup, handoff, discharge..."
              : "Search hubs, scores, drugs, protocols… or > for AI actions"}
            style={{ flex:1, background:"transparent", border:"none", outline:"none",
              fontFamily:"'DM Sans',sans-serif", fontSize:17, fontWeight:500,
              color:isActionMode ? T.purple : T.txt, caretColor:T.teal }} />
          <div style={{ display:"flex", alignItems:"center", gap:7, flexShrink:0 }}>
            {aiLoading && (
              <span style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:8, color:T.purple, letterSpacing:1 }}>AI…</span>
            )}
            <button onClick={handleClose}
              style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                padding:"3px 8px", borderRadius:5, cursor:"pointer",
                border:"1px solid rgba(42,79,122,0.4)",
                background:"rgba(42,79,122,0.15)", color:T.txt4 }}>Esc</button>
          </div>
        </div>

        {/* Sub-header */}
        {!query && (
          <div style={{ display:"flex", alignItems:"center", gap:5,
            padding:"6px 14px", borderBottom:"1px solid rgba(26,53,85,0.3)",
            flexWrap:"wrap" }}>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.txt4 }}>Filter:</span>
            {["hub:","drug:","score:","section:","protocol:"].map(p => (
              <button key={p} onClick={() => { setQuery(p); inputRef.current?.focus(); }}
                style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                  padding:"2px 7px", borderRadius:4, cursor:"pointer",
                  border:"1px solid rgba(42,79,122,0.35)",
                  background:"transparent", color:T.txt4 }}>{p}</button>
            ))}
            <button onClick={() => { setQuery(">"); inputRef.current?.focus(); }}
              style={{ marginLeft:"auto",
                fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                padding:"2px 9px", borderRadius:4, cursor:"pointer",
                border:"1px solid rgba(155,109,255,0.4)",
                background:"rgba(155,109,255,0.08)", color:T.purple }}>
              &gt; AI actions
            </button>
          </div>
        )}

        {isActionMode && !actionState?.action && (
          <div style={{ padding:"6px 14px", borderBottom:"1px solid rgba(26,53,85,0.3)",
            fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.purple, letterSpacing:1.5, textTransform:"uppercase" }}>
            AI Action Mode
          </div>
        )}

        {/* Results */}
        <div style={{ maxHeight:"52vh", overflowY:"auto" }}>
          {isActionMode ? (
            actionItems.length === 0
              ? <div style={{ padding:"20px", textAlign:"center",
                  fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt4 }}>
                  No matching action — try: differential, summarize, workup, handoff
                </div>
              : actionItems.map((qa, i) => (
                  <ActionItem key={qa.id} qa={qa} active={i === activeIdx} onSelect={executeAction} />
                ))
          ) : results.length === 0
            ? <div style={{ padding:"24px", textAlign:"center",
                fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt4 }}>
                No results for &ldquo;{query}&rdquo;
                <div style={{ fontSize:11, marginTop:5 }}>Try: hub: drug: score: — or &gt; for AI actions</div>
              </div>
            : (() => {
                const recents  = results.filter(r => r._recent);
                const ctxItems = results.filter(r => r._contextual && !r._recent);
                const rest     = results.filter(r => !r._recent && !r._contextual);
                let gi = 0;
                const grp = (label, color, items) => {
                  if (!items.length) return null;
                  return (
                    <div key={label}>
                      {label && (
                        <div style={{ padding:"5px 14px 1px",
                          fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                          fontWeight:700, letterSpacing:1.5, textTransform:"uppercase",
                          color:color || T.txt4,
                          borderTop:gi > 0 ? "1px solid rgba(26,53,85,0.3)" : "none" }}>
                          {label}
                        </div>
                      )}
                      {items.map(cmd => {
                        const idx = gi++;
                        return <ResultItem key={cmd.id} cmd={cmd}
                          active={idx === activeIdx} onSelect={handleSelectCmd}
                          rawQuery={query.replace(/^(hub|drug|score|section|protocol):/, "").trim()}
                          aiSuggested={cmd._aiSuggested} contextual={cmd._contextual} />;
                      })}
                    </div>
                  );
                };
                return (
                  <>
                    {grp(recents.length ? "Recent" : null, T.teal, recents)}
                    {grp(ctxItems.length ? "Suggested for this patient" : null, T.teal, ctxItems)}
                    {grp((rest.length && (recents.length || ctxItems.length)) ? "Results" : null, T.txt4, rest)}
                  </>
                );
              })()
          }
        </div>

        {/* AI output panel */}
        {(actionOutput || actionBusy || actionError) && (
          <OutputPanel output={actionOutput} busy={actionBusy} error={actionError}
            label={actionLabel} onCopy={copyOutput} copied={copied}
            onClear={() => { setActionOutput(null); setActionError(null); }} />
        )}

        {/* Footer */}
        <div style={{ display:"flex", alignItems:"center", gap:10,
          padding:"7px 14px", borderTop:"1px solid rgba(26,53,85,0.35)",
          flexWrap:"wrap" }}>
          {[["↑↓","navigate"],["↵","open"],[">"," AI actions"],["⌘K","toggle"]].map(([k,d]) => (
            <div key={k} style={{ display:"flex", alignItems:"center", gap:4 }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                color:k === ">" ? T.purple : T.teal,
                background:k === ">" ? "rgba(155,109,255,0.1)" : "rgba(0,229,192,0.1)",
                border:`1px solid ${k === ">" ? "rgba(155,109,255,0.3)" : "rgba(0,229,192,0.3)"}`,
                borderRadius:4, padding:"1px 6px" }}>{k}</span>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.txt4 }}>{d}</span>
            </div>
          ))}
          <span style={{ marginLeft:"auto", fontFamily:"'JetBrains Mono',monospace",
            fontSize:8, color:aiLoading ? T.purple : T.txt4 }}>
            {aiLoading ? "AI augmenting..." : `${totalItems} result${totalItems !== 1 ? "s" : ""}`}
          </span>
        </div>
      </div>
    </>
  );
}