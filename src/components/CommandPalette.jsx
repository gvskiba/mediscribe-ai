// CommandPalette.jsx
// Global ⌘+K command palette — fires from anywhere in the app.
// Searches across: hubs, encounter sections, scores, drugs, protocols.
//
// Usage in App root (or Layout):
//   import CommandPalette from "@/components/CommandPalette";
//   <CommandPalette onNavigate={navigate} onSelectSection={selectSection} />
//
// Opens: ⌘+K (Mac) or Ctrl+K (Windows/Linux)
// Close: Esc or click backdrop
//
// Props:
//   onNavigate     fn(path)      — router navigate for hub pages
//   onSelectSection fn(section)  — NPI section selector (if in encounter)
//   isInEncounter  bool          — show encounter sections in results
//   demo           object        — patient context for contextual suggestions
//
// Constraints: no form, no localStorage, no router import, straight quotes only,
//   single react import, border before borderTop/etc.

import { useState, useEffect, useCallback, useRef, useMemo } from "react";

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36",
  txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0", red:"#ff4444",
};

// ── Command index ─────────────────────────────────────────────────────────────
const COMMANDS = [
  // ── Hub pages ──────────────────────────────────────────────────────────────
  { id:"ecg",       type:"hub",      label:"ECGHub",               desc:"ECG interpretation, rhythm recognition, interval analysis",    icon:"💓", path:"/ecg-hub",             tags:["ecg","ekg","rhythm","qt","lbbb","stemi","afib"] },
  { id:"airway",    type:"hub",      label:"AirwayHub",            desc:"RSI, intubation, surgical airway, difficult airway algorithm", icon:"😮", path:"/airway-hub",          tags:["rsi","intubation","airway","cric","video","bvm"] },
  { id:"shock",     type:"hub",      label:"ShockHub",             desc:"Shock classification, vasopressors, hemodynamic targets",      icon:"⚡", path:"/shock-hub",           tags:["shock","vasopressor","pressors","hypotension","MAP"] },
  { id:"psych",     type:"hub",      label:"PsychHub",             desc:"Agitation, psychiatric emergencies, capacity, restraint",      icon:"🧠", path:"/psyche-hub",          tags:["psych","agitation","droperidol","haldol","psychiatric"] },
  { id:"sepsis",    type:"hub",      label:"SepsisHub",            desc:"Sepsis bundle, qSOFA, lactate, vasopressors",                  icon:"🦠", path:"/sepsis-hub",          tags:["sepsis","bundle","lactate","qsofa","sofa","ssc"] },
  { id:"sepsisabx", type:"hub",      label:"Sepsis Antibiotic Stewardship", desc:"Source-specific antibiotic regimens, de-escalation",  icon:"💊", path:"/sepsis-hub",          tags:["antibiotic","abx","sepsis","vancomycin","pip-tazo","carbapenem"] },
  { id:"erx",       type:"hub",      label:"ERxHub",               desc:"Emergency prescribing, drug dosing, interactions",             icon:"💊", path:"/erx",                 tags:["erx","prescribing","medications","dosing"] },
  { id:"pocus",     type:"hub",      label:"POCUSHub",             desc:"FAST, RUSH, BLUE protocol, eFAST, echo",                      icon:"🔊", path:"/pocus-hub",           tags:["pocus","ultrasound","fast","rush","echo","blue"] },
  { id:"ortho",     type:"hub",      label:"OrthoHub",             desc:"Fracture classification, splinting, dislocation reduction",    icon:"🦴", path:"/ortho-hub",           tags:["ortho","fracture","splint","dislocation","reduction"] },
  { id:"triage",    type:"hub",      label:"TriageHub",            desc:"ESI triage, acuity levels, CTAS",                             icon:"🏥", path:"/triage-hub",          tags:["triage","esi","acuity","ctas"] },
  { id:"rapid",     type:"hub",      label:"RapidAssessmentHub",   desc:"Rapid clinical assessment templates",                          icon:"⚡", path:"/rapid-assessment-hub",tags:["rapid","assessment","template"] },
  { id:"consult",   type:"hub",      label:"ConsultHub",           desc:"Specialty consult preparation, SBAR",                         icon:"📞", path:"/consult-hub",         tags:["consult","sbar","specialty","cardiology","surgery"] },
  { id:"procedures",type:"hub",      label:"EDProcedureNotes",     desc:"Procedure notes, CPT codes, 10 procedure types",              icon:"✂️", path:"/ed-procedure-notes",  tags:["procedure","laceration","lp","central","intubation"] },
  { id:"score",     type:"hub",      label:"ScoreHub",             desc:"HEART, Wells, PERC, CURB-65, Ottawa, GCS, ABCD2",             icon:"🧮", path:"/score-hub",           tags:["score","heart","wells","perc","curb","nexus","ottawa","gcs"] },
  { id:"dose",      type:"hub",      label:"WeightDoseHub",        desc:"Weight-based drug dosing, RSI, vasopressors, reversal",       icon:"⚖️", path:"/weight-dose",         tags:["dose","dosing","weight","rsi","epinephrine","ketamine"] },
  { id:"tox",       type:"hub",      label:"ToxHub",               desc:"Antidotes, ingestion protocols, Rumack-Matthew nomogram",     icon:"☠️", path:"/tox-hub",             tags:["tox","poison","antidote","overdose","nac","naloxone","nomogram"] },
  { id:"lab",       type:"hub",      label:"LabInterpreter",       desc:"BMP, CBC, LFT, coag, ABG interpretation, AI analysis",        icon:"🔬", path:"/lab-interpreter",     tags:["lab","bmp","cbc","lft","abg","anion","gap","lactate"] },
  { id:"resus",     type:"hub",      label:"ResusHub",             desc:"ACLS, PALS, CPR timer, epinephrine tracker, Hs and Ts",       icon:"❤️", path:"/resus-hub",           tags:["resus","acls","pals","cpr","vf","pea","asystole","defib"] },
  { id:"stroke",    type:"hub",      label:"StrokeHub",            desc:"tPA eligibility, door-to-needle timer, NIHSS, LVO criteria",  icon:"🧠", path:"/stroke-hub",          tags:["stroke","tpa","nihss","lvo","dtn","alteplase","thrombectomy"] },
  { id:"pain",      type:"hub",      label:"PainHub",              desc:"MME calculator, opioid rotation, adjuncts, PDMP",             icon:"💊", path:"/pain-hub",            tags:["pain","mme","opioid","ketamine","ketorolac","pdmp","rotation"] },
  { id:"syncope",   type:"hub",      label:"SyncopeHub",           desc:"ROSE, SFSR, CSRS, OESIL, disposition matrix",                 icon:"😵", path:"/syncope-hub",         tags:["syncope","rose","sfsr","csrs","oesil","faint"] },
  { id:"imaging",   type:"hub",      label:"ImagingInterpreter",   desc:"CXR, CT head, CT chest, CT abdomen interpretation",           icon:"🖼️", path:"/imaging-interpreter", tags:["imaging","cxr","xray","ct","radiology","report","interpret"] },
  { id:"wound",     type:"hub",      label:"WoundCareHub",         desc:"Irrigation, closure, antibiotic prophylaxis, tetanus",        icon:"🩹", path:"/wound-care-hub",      tags:["wound","laceration","closure","tetanus","irrigation","abx"] },
  { id:"seizure",   type:"hub",      label:"SeizureHub",           desc:"SE protocol, BZD dosing, levetiracetam, ACEP 2024",           icon:"⚡", path:"/seizure-hub",         tags:["seizure","status","epilepticus","benzo","levetiracetam","keppra"] },
  { id:"chestpain", type:"hub",      label:"ChestPainHub",         desc:"HEART score, serial troponin, EDACS, ACS protocol, disposition", icon:"💓", path:"/ChestPainHub",        tags:["chest","pain","heart","acs","stemi","nstemi","troponin","edacs"] },
  { id:"dyspnea",   type:"hub",      label:"DyspneaHub",           desc:"BLUE protocol, PE pathway (PERC/Wells), CHF/ADHF, COPD, asthma, pneumonia (CURB-65, IDSA 2019)", icon:"💨", path:"/DyspneaHub",         tags:["dyspnea","shortness","breath","chf","copd","asthma","pneumonia","pe","blue","protocol","curb","bnp","perc","wells","bipap"] },
  { id:"headache",  type:"hub",      label:"HeadacheHub",          desc:"Ottawa SAH Rule, SNOOP4 red flags, LP interpretation, migraine cocktail, cluster, GCA, ICHD-3", icon:"🧠", path:"/HeadacheHub",         tags:["headache","sah","migraine","cluster","ottawa","snoop","lp","thunderclap","subarachnoid","gca","temporal arteritis","xanthochromia"] },
  { id:"abdpain",   type:"hub",      label:"AbdominalPainHub",     desc:"Alvarado appendicitis, BISAP pancreatitis, Glasgow-Blatchford GI bleed, Tokyo cholangitis, AAA, ectopic, mesenteric ischemia", icon:"🫘", path:"/AbdominalPainHub", tags:["abdomen","pain","alvarado","appendix","bisap","pancreatitis","blatchford","gibleed","cholangitis","aaa","ectopic","mesenteric"] },
  { id:"trauma",    type:"hub",      label:"TraumaHub",            desc:"ATLS primary survey, hemorrhagic shock, MTP, hemostasis, NEXUS C-spine, GCS, head injury, specific injuries", icon:"🚨", path:"/trauma-hub",     tags:["trauma","atls","mtp","txa","gcs","shock","hemorrhage","nexus","primary survey"] },
  { id:"peds",      type:"hub",      label:"PediatricHub",         desc:"Broselow weight estimation, PECARN head CT, fever workup, Rochester criteria, PALS drug dosing, Westley croup score", icon:"🧒", path:"/peds-hub", tags:["pediatric","peds","broselow","pecarn","fever","rochester","westley","croup","pals"] },
  { id:"ams",       type:"hub",      label:"AMSHub",               desc:"AEIOU-TIPS differential, CAM-ICU delirium, RASS sedation scale, Wernicke, NCSE, PRES, hepatic encephalopathy", icon:"🔆", path:"/ams-hub",       tags:["ams","altered mental status","delirium","cam-icu","wernicke","ncse","pres","hepatic"] },
  { id:"dvt",       type:"hub",      label:"DVTHub",               desc:"Wells DVT score, DOAC selection and dosing, renal adjustments, pregnancy, cancer-associated VTE, APS, reversal agents", icon:"🩸", path:"/dvt-hub",       tags:["dvt","vte","wells","doac","apixaban","rivaroxaban","dabigatran","edoxaban","anticoagulation","pe","clot"] },

  // ── NPI Encounter sections ─────────────────────────────────────────────────
  { id:"s_demo",    type:"section",  label:"Demographics",         desc:"Patient registration, demographics, SDOH",                    icon:"👤", section:"demo",             tags:["demo","registration","patient","sdoh","demographics"] },
  { id:"s_triage",  type:"section",  label:"Triage & Vitals",      desc:"ESI level, vital signs, triage notes",                        icon:"📊", section:"triage",           tags:["triage","vitals","esi","bp","hr","temp","spo2"] },
  { id:"s_hpi",     type:"section",  label:"History of Present Illness", desc:"HPI entry, AI-assisted, chief complaint",              icon:"📝", section:"hpi",              tags:["hpi","history","chief","complaint","onset","duration"] },
  { id:"s_diff",    type:"section",  label:"Smart Differential",   desc:"AI-generated differential diagnosis, must-not-miss",          icon:"🧠", section:"diff",             tags:["differential","diagnosis","ddx","must","miss"] },
  { id:"s_ros",     type:"section",  label:"Review of Systems",    desc:"Structured ROS by system",                                    icon:"🔍", section:"ros",              tags:["ros","review","systems","symptoms"] },
  { id:"s_pe",      type:"section",  label:"Physical Exam",        desc:"Structured physical examination",                             icon:"🩺", section:"pe",               tags:["exam","physical","pe","auscultation","palpation"] },
  { id:"s_mdm",     type:"section",  label:"Medical Decision Making", desc:"MDM narrative, AI assist, complexity",                    icon:"📋", section:"mdm",              tags:["mdm","decision","making","complexity","narrative"] },
  { id:"s_consult", type:"section",  label:"Consult",              desc:"Consult preparation, specialty call, NPI lookup",             icon:"📞", section:"consult",          tags:["consult","specialty","call","cardiology"] },
  { id:"s_scores",  type:"section",  label:"Clinical Scores",      desc:"HEART, Wells, PERC embedded in encounter",                   icon:"🧮", section:"scores",           tags:["scores","heart","wells","perc","score"] },
  { id:"s_labs",    type:"section",  label:"Lab Interpreter",      desc:"Lab interpretation embedded in encounter",                    icon:"🔬", section:"labs",             tags:["labs","bmp","cbc","interpreter"] },
  { id:"s_dosing",  type:"section",  label:"Drug Dosing",          desc:"Weight-based drug dosing in encounter",                       icon:"⚖️", section:"dosing",           tags:["dosing","drugs","weight","dose"] },
  { id:"s_orders",  type:"section",  label:"Orders",               desc:"Order entry and management",                                  icon:"📋", section:"orders",           tags:["orders","medications","labs","imaging"] },
  { id:"s_sepsis",  type:"section",  label:"Sepsis Bundle",        desc:"Sepsis screening and bundle tracking",                        icon:"🦠", section:"sepsis",           tags:["sepsis","bundle","qsofa","lactate"] },
  { id:"s_erx",     type:"section",  label:"Prescribing",          desc:"E-prescribing, medication management",                        icon:"💊", section:"erx",              tags:["erx","prescribe","medications"] },
  { id:"s_autocoder",type:"section", label:"Auto-Coder",           desc:"Visit coding, E/M level, ICD-10",                             icon:"🏷️", section:"autocoder",        tags:["coding","icd","cpt","billing"] },
  { id:"s_capacity",type:"section",  label:"Capacity / AMA",       desc:"Appelbaum capacity assessment, AMA documentation",            icon:"⚖️", section:"capacity",         tags:["capacity","ama","appelbaum","refusal"] },
  { id:"s_closeout",type:"section",  label:"Disposition",          desc:"Patient disposition, admit/discharge/transfer",               icon:"🚪", section:"closeout",         tags:["disposition","discharge","admit","transfer","ama","lwbs"] },
  { id:"s_handoff", type:"section",  label:"Shift Handoff",        desc:"I-PASS AI shift handoff generator",                           icon:"🤝", section:"handoff",          tags:["handoff","ipass","shift","transfer","care"] },
  { id:"s_discharge",type:"section", label:"Discharge Instructions",desc:"AI discharge instructions, Beers flags, follow-up",         icon:"🏠", section:"discharge",        tags:["discharge","instructions","medications","follow","up"] },
  { id:"s_audit",   type:"section",  label:"Audit & Lock Note",    desc:"SHA-256 note lock, completeness checklist",                   icon:"🔒", section:"audit",            tags:["audit","lock","note","hash","sign"] },

  // ── Scores ────────────────────────────────────────────────────────────────
  { id:"q_heart",   type:"score",    label:"HEART Score",          desc:"Chest pain risk stratification for ACS",                      icon:"💓", path:"/score-hub",           tags:["heart","acs","chest","pain","troponin","risk"] },
  { id:"q_wells_pe",type:"score",    label:"Wells PE Score",       desc:"Pre-test probability for pulmonary embolism",                 icon:"🫁", path:"/score-hub",           tags:["wells","pe","pulmonary","embolism","dvt","probability"] },
  { id:"q_wells_dvt",type:"score",   label:"Wells DVT Score",      desc:"Pre-test probability for deep vein thrombosis",               icon:"🦵", path:"/score-hub",           tags:["wells","dvt","deep","vein","thrombosis","clot"] },
  { id:"q_perc",    type:"score",    label:"PERC Rule",            desc:"Rule out PE without d-dimer in low-risk patients",            icon:"🫁", path:"/score-hub",           tags:["perc","pe","rule","out","dimer"] },
  { id:"q_curb65",  type:"score",    label:"CURB-65",              desc:"Pneumonia severity, inpatient vs outpatient decision",         icon:"🫁", path:"/score-hub",           tags:["curb","pneumonia","cap","severity","mortality"] },
  { id:"q_gcs",     type:"score",    label:"Glasgow Coma Scale",   desc:"Level of consciousness assessment",                           icon:"🧠", path:"/score-hub",           tags:["gcs","glasgow","coma","consciousness","neuro"] },
  { id:"q_nihss",   type:"score",    label:"NIHSS",                desc:"NIH Stroke Scale — neurologic deficit severity",              icon:"🧠", path:"/stroke-hub",          tags:["nihss","stroke","neurologic","deficit","scale"] },
  { id:"q_ottawa_a",type:"score",    label:"Ottawa Ankle Rules",   desc:"Ankle and midfoot X-ray decision rule",                       icon:"🦶", path:"/score-hub",           tags:["ottawa","ankle","xray","fracture","rule"] },
  { id:"q_ottawa_k",type:"score",    label:"Ottawa Knee Rules",    desc:"Knee X-ray decision rule",                                    icon:"🦵", path:"/score-hub",           tags:["ottawa","knee","xray","fracture"] },
  { id:"q_nexus",   type:"score",    label:"NEXUS C-Spine",        desc:"C-spine clearance without imaging",                           icon:"🦴", path:"/score-hub",           tags:["nexus","cspine","clearance","cervical","xray"] },
  { id:"q_abcd2",   type:"score",    label:"ABCD2 Score",          desc:"TIA stroke risk in 2 and 7 days",                             icon:"🧠", path:"/score-hub",           tags:["abcd2","tia","stroke","risk","2day"] },
  { id:"q_rose",    type:"score",    label:"ROSE Rule (Syncope)",  desc:"Syncope 30-day serious outcome risk",                         icon:"😵", path:"/syncope-hub",         tags:["rose","syncope","bnp","bradycardia","rule"] },
  { id:"q_csrs",    type:"score",    label:"CSRS (Syncope)",       desc:"Canadian Syncope Risk Score",                                 icon:"😵", path:"/syncope-hub",         tags:["csrs","canadian","syncope","risk","score"] },

  // ── Drugs ─────────────────────────────────────────────────────────────────
  { id:"d_epi",     type:"drug",     label:"Epinephrine",          desc:"Anaphylaxis, cardiac arrest, analgesia, vasopressor dosing",  icon:"💉", path:"/weight-dose",         tags:["epi","epinephrine","anaphylaxis","arrest","vasopressor","adrenaline"] },
  { id:"d_ketamine",type:"drug",     label:"Ketamine",             desc:"RSI induction, sedation, sub-dissociative analgesia dosing",  icon:"💉", path:"/weight-dose",         tags:["ketamine","rsi","dissociation","sedation","pain","induction"] },
  { id:"d_etomidate",type:"drug",    label:"Etomidate",            desc:"RSI induction agent dosing",                                  icon:"💉", path:"/weight-dose",         tags:["etomidate","rsi","induction","intubation"] },
  { id:"d_sux",     type:"drug",     label:"Succinylcholine",      desc:"Depolarizing neuromuscular blocker for RSI",                  icon:"💉", path:"/weight-dose",         tags:["succinylcholine","sux","rsi","paralytic","nmb","fasciculations"] },
  { id:"d_roc",     type:"drug",     label:"Rocuronium",           desc:"Non-depolarizing NMB for RSI and maintenance",                icon:"💉", path:"/weight-dose",         tags:["rocuronium","roc","rsi","paralytic","nmb","sugammadex"] },
  { id:"d_norepi",  type:"drug",     label:"Norepinephrine",       desc:"First-line vasopressor for septic shock, infusion calculator", icon:"💉", path:"/weight-dose",        tags:["norepinephrine","norepi","levophed","vasopressor","pressor","shock"] },
  { id:"d_nac",     type:"drug",     label:"N-Acetylcysteine (NAC)",desc:"Acetaminophen overdose antidote, Rumack-Matthew nomogram",   icon:"☠️", path:"/tox-hub",            tags:["nac","acetylcysteine","apap","tylenol","acetaminophen","antidote"] },
  { id:"d_naloxone",type:"drug",     label:"Naloxone",             desc:"Opioid reversal — dosing, intranasal, infusion",              icon:"☠️", path:"/tox-hub",            tags:["naloxone","narcan","opioid","reversal","overdose"] },
  { id:"d_vanc",    type:"drug",     label:"Vancomycin",           desc:"MRSA coverage, AUC-guided dosing, renal adjustment",          icon:"🦠", path:"/sepsis-hub",          tags:["vancomycin","vanc","mrsa","auc","trough","nephrotoxicity"] },
  { id:"d_piptz",   type:"drug",     label:"Piperacillin-Tazobactam",desc:"Broad-spectrum antibiotic, extended infusion dosing",       icon:"🦠", path:"/sepsis-hub",          tags:["piperacillin","tazobactam","pip","tazo","zosyn","extended"] },
  { id:"d_alteplase",type:"drug",    label:"Alteplase (tPA)",      desc:"Stroke thrombolysis 0.9 mg/kg, PE massive, STEMI",            icon:"🧠", path:"/stroke-hub",          tags:["alteplase","tpa","thrombolytic","stroke","rtpa","dose"] },
  { id:"d_fentanyl",type:"drug",     label:"Fentanyl",             desc:"IV/IN analgesia, RSI adjunct, mcg/kg dosing",                 icon:"💉", path:"/weight-dose",         tags:["fentanyl","opioid","analgesia","pain","rsi","intranasal"] },
  { id:"d_morph",   type:"drug",     label:"Morphine",             desc:"IV opioid analgesia, MME reference",                          icon:"💉", path:"/pain-hub",            tags:["morphine","opioid","analgesia","mme","pain"] },
  { id:"d_mag",     type:"drug",     label:"Magnesium Sulfate",    desc:"Eclampsia, torsades, asthma, pre-eclampsia dosing",           icon:"💉", path:"/weight-dose",         tags:["magnesium","eclampsia","torsades","asthma","sulfate"] },

  // ── Protocols ─────────────────────────────────────────────────────────────
  { id:"p_rsi",     type:"protocol", label:"RSI Protocol",         desc:"Rapid sequence intubation — prep, drugs, sequence",           icon:"😮", path:"/airway-hub",          tags:["rsi","rapid","sequence","intubation","preox","drugs"] },
  { id:"p_acls",    type:"protocol", label:"ACLS / Cardiac Arrest",desc:"VF, PEA, asystole — real-time checklist with timer",          icon:"❤️", path:"/resus-hub",           tags:["acls","arrest","vf","pea","asystole","cpr","epinephrine"] },
  { id:"p_se",      type:"protocol", label:"Status Epilepticus",   desc:"Stepped SE management, BZD → second-line → refractory",       icon:"⚡", path:"/seizure-hub",         tags:["status","epilepticus","seizure","benzo","lorazepam","keppra"] },
  { id:"p_stroke",  type:"protocol", label:"Stroke Protocol",      desc:"tPA eligibility, DTN timer, thrombectomy criteria",           icon:"🧠", path:"/stroke-hub",          tags:["stroke","tpa","protocol","nihss","dtn","lvo"] },
  { id:"p_sepsis",  type:"protocol", label:"Sepsis Protocol",      desc:"1-hour bundle, antibiotics, vasopressors, fluids",             icon:"🦠", path:"/sepsis-hub",          tags:["sepsis","protocol","bundle","antibiotics","fluids","vasopressor"] },
  { id:"p_tox_apap",type:"protocol", label:"APAP Overdose",        desc:"Rumack-Matthew nomogram, NAC 3-bag protocol",                  icon:"☠️", path:"/tox-hub",            tags:["apap","acetaminophen","tylenol","nac","overdose","nomogram"] },
  { id:"p_tox_tca", type:"protocol", label:"TCA Overdose",         desc:"QRS >100ms → sodium bicarbonate, seizure management",         icon:"☠️", path:"/tox-hub",            tags:["tca","tricyclic","antidepressant","bicarbonate","overdose"] },
  { id:"p_tox_opioid",type:"protocol",label:"Opioid Overdose",     desc:"Naloxone dosing, buprenorphine, fentanyl analogues",          icon:"☠️", path:"/tox-hub",            tags:["opioid","overdose","naloxone","fentanyl","buprenorphine","narcan"] },
  { id:"p_ama",     type:"protocol", label:"AMA Documentation",    desc:"Capacity assessment, AMA refusal note, Appelbaum criteria",   icon:"⚖️", section:"capacity",         tags:["ama","capacity","appelbaum","refusal","against","medical","advice"] },
  { id:"p_ttm",     type:"protocol", label:"Post-ROSC / TTM",      desc:"Post-cardiac arrest care, targeted temperature management",    icon:"✅", path:"/resus-hub",           tags:["rosc","ttm","post","arrest","temperature","targeted"] },
];

// ── Type metadata ─────────────────────────────────────────────────────────────
const TYPE_META = {
  hub:      { label:"Hub",      color:T.teal,   bg:"rgba(0,229,192,0.12)" },
  section:  { label:"Section",  color:T.blue,   bg:"rgba(59,158,255,0.12)" },
  score:    { label:"Score",    color:T.purple, bg:"rgba(155,109,255,0.12)" },
  drug:     { label:"Drug",     color:T.orange, bg:"rgba(255,159,67,0.12)" },
  protocol: { label:"Protocol", color:T.coral,  bg:"rgba(255,107,107,0.12)" },
  tool:     { label:"Tool",     color:T.gold,   bg:"rgba(245,200,66,0.12)" },
};

// ── Fuzzy score ────────────────────────────────────────────────────────────────
function scoreMatch(cmd, query) {
  if (!query) return 1;
  const q     = query.toLowerCase();
  const label = cmd.label.toLowerCase();
  const desc  = (cmd.desc || "").toLowerCase();
  const tags  = (cmd.tags || []).join(" ").toLowerCase();
  if (label.startsWith(q)) return 100;
  if (label.includes(q)) return 80;
  if (cmd.tags?.some(t => t === q)) return 70;
  if (tags.includes(q)) return 60;
  if (desc.includes(q)) return 40;
  const words = q.split(/\s+/).filter(Boolean);
  if (words.length > 1) {
    const all = `${label} ${desc} ${tags}`;
    if (words.every(w => all.includes(w))) return 50;
  }
  return 0;
}

// ── Recent commands store (session-only, no localStorage) ────────────────────
const recentIds = [];
function addRecent(id) {
  const idx = recentIds.indexOf(id);
  if (idx >= 0) recentIds.splice(idx, 1);
  recentIds.unshift(id);
  if (recentIds.length > 5) recentIds.pop();
}

// ── Result item ───────────────────────────────────────────────────────────────
function ResultItem({ cmd, active, onSelect, query }) {
  const tm  = TYPE_META[cmd.type] || TYPE_META.hub;
  const ref = useRef(null);

  useEffect(() => {
    if (active && ref.current) {
      ref.current.scrollIntoView({ block:"nearest", behavior:"smooth" });
    }
  }, [active]);

  const highlighted = useMemo(() => {
    if (!query) return cmd.label;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
    const re    = new RegExp(`(${escaped})`, "gi");
    const parts = cmd.label.split(re);
    // Use a fresh regex (no g flag) for testing each part to avoid lastIndex state
    const reTest = new RegExp(`^${escaped}$`, "i");
    return parts.map((p, i) =>
      reTest.test(p)
        ? <mark key={i} style={{ background:`${tm.color}30`, color:tm.color,
            borderRadius:2, padding:"0 1px" }}>{p}</mark>
        : p
    );
  }, [cmd.label, query, tm.color]);

  return (
    <button ref={ref}
      onClick={() => onSelect(cmd)}
      style={{ display:"flex", alignItems:"center", gap:10, width:"100%",
        padding:"9px 14px", cursor:"pointer", textAlign:"left",
        transition:"background .1s",
        background:active
          ? `linear-gradient(135deg,${tm.color}14,${tm.color}06)`
          : "transparent",
        border:"none",
        borderLeft:`3px solid ${active ? tm.color : "transparent"}` }}>
      <div style={{ width:32, height:32, borderRadius:8, flexShrink:0,
        display:"flex", alignItems:"center", justifyContent:"center",
        background:active ? tm.bg : "rgba(14,37,68,0.5)",
        fontSize:16 }}>
        {cmd.icon}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
          fontSize:13, color:active ? T.txt : T.txt2,
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {highlighted}
        </div>
        {cmd.desc && (
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
            color:T.txt4, marginTop:1,
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {cmd.desc}
          </div>
        )}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          fontWeight:700, letterSpacing:1, textTransform:"uppercase",
          padding:"2px 7px", borderRadius:4,
          background:tm.bg, color:tm.color,
          border:`1px solid ${tm.color}30` }}>
          {tm.label}
        </span>
        {active && (
          <span style={{ fontFamily:"'JetBrains Mono',monospace",
            fontSize:9, color:T.txt4 }}>↵</span>
        )}
      </div>
    </button>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────
export default function CommandPalette({
  onNavigate,
  onSelectSection,
  isInEncounter = false,
  demo,
}) {
  const [open,      setOpen]      = useState(false);
  const [query,     setQuery]     = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef(null);

  const handleOpen = useCallback(() => {
    setOpen(true);
    setQuery("");
    setActiveIdx(0);
    setTimeout(() => inputRef.current?.focus(), 40);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIdx(0);
  }, []);

  useEffect(() => {
    const handler = e => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (open) { handleClose(); } else { handleOpen(); }
      }
      if (e.key === "Escape" && open) handleClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, handleOpen, handleClose]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      const recent  = recentIds.map(id => COMMANDS.find(c => c.id === id)).filter(Boolean);
      const suggest = COMMANDS.filter(c =>
        ["resus","stroke","sepsis","tox","seizure","lab","dose"].includes(c.id)
      );
      const combined = [...recent];
      suggest.forEach(s => { if (!combined.find(c => c.id === s.id)) combined.push(s); });
      return combined.slice(0, 8);
    }
    let filtered = COMMANDS;
    let searchQ  = q;
    const typePrefix = q.match(/^(hub|drug|score|section|protocol|tool):/);
    if (typePrefix) {
      filtered = COMMANDS.filter(c => c.type === typePrefix[1]);
      searchQ  = q.slice(typePrefix[1].length + 1).trim();
    }
    return filtered
      .map(c => ({ ...c, _score:scoreMatch(c, searchQ) }))
      .filter(c => c._score > 0)
      .sort((a, b) => b._score - a._score)
      .slice(0, 12);
  }, [query]);

  useEffect(() => {
    setActiveIdx(p => Math.min(p, Math.max(0, results.length - 1)));
  }, [results.length]);

  const handleSelect = useCallback((cmd) => {
    addRecent(cmd.id);
    handleClose();
    if (cmd.section && onSelectSection) {
      onSelectSection(cmd.section);
    } else if (cmd.path && onNavigate) {
      onNavigate(cmd.path);
    }
  }, [handleClose, onNavigate, onSelectSection]);

  const onKeyDown = useCallback(e => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx(p => Math.min(p + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx(p => Math.max(p - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const cmd = results[activeIdx];
      if (cmd) handleSelect(cmd);
    } else if (e.key === "Escape") {
      handleClose();
    }
  }, [results, activeIdx, handleSelect, handleClose]);

  const grouped = useMemo(() => {
    if (!query.trim()) return [{ label:null, items:results }];
    const groups = {};
    results.forEach(r => {
      if (!groups[r.type]) groups[r.type] = [];
      groups[r.type].push(r);
    });
    return Object.entries(groups).map(([type, items]) => ({
      label:TYPE_META[type]?.label || type,
      color:TYPE_META[type]?.color || T.txt4,
      items,
    }));
  }, [results, query]);

  if (!open) {
    return (
      <button onClick={handleOpen}
        style={{ display:"flex", alignItems:"center", gap:7,
          padding:"5px 13px", borderRadius:20, cursor:"pointer",
          fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:12,
          transition:"all .15s",
          border:"1px solid rgba(42,79,122,0.45)",
          background:"rgba(42,79,122,0.1)", color:T.txt4 }}>
        <span style={{ fontSize:13 }}>🔍</span>
        <span>Search</span>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
          color:T.txt4, marginLeft:2 }}>⌘K</span>
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div onClick={handleClose}
        style={{ position:"fixed", inset:0, zIndex:1000,
          background:"rgba(5,15,30,0.7)",
          backdropFilter:"blur(4px)",
          WebkitBackdropFilter:"blur(4px)" }} />

      {/* Palette */}
      <div style={{ position:"fixed", top:"12vh", left:"50%",
        transform:"translateX(-50%)",
        width:"min(680px, 94vw)", zIndex:1001,
        background:"rgba(8,18,40,0.98)",
        border:"1px solid rgba(42,79,122,0.7)",
        borderRadius:16,
        boxShadow:"0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,229,192,0.08)",
        overflow:"hidden" }}>

        {/* Search input */}
        <div style={{ display:"flex", alignItems:"center", gap:10,
          padding:"14px 16px",
          borderBottom:"1px solid rgba(26,53,85,0.5)" }}>
          <span style={{ fontSize:18, flexShrink:0 }}>🔍</span>
          <input ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setActiveIdx(0); }}
            onKeyDown={onKeyDown}
            placeholder="Search hubs, scores, drugs, protocols..."
            style={{ flex:1, background:"transparent", border:"none",
              outline:"none", fontFamily:"'DM Sans',sans-serif",
              fontSize:17, fontWeight:500,
              color:T.txt, caretColor:T.teal }} />
          <button onClick={handleClose}
            style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
              padding:"3px 8px", borderRadius:5, cursor:"pointer",
              border:"1px solid rgba(42,79,122,0.4)",
              background:"rgba(42,79,122,0.15)", color:T.txt4,
              letterSpacing:1 }}>
            Esc
          </button>
        </div>

        {/* Type filter hints */}
        {!query && (
          <div style={{ display:"flex", gap:4, padding:"8px 14px",
            borderBottom:"1px solid rgba(26,53,85,0.3)" }}>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
              color:T.txt4 }}>Filter: </span>
            {["hub:","drug:","score:","section:","protocol:"].map(prefix => (
              <button key={prefix}
                onClick={() => { setQuery(prefix); inputRef.current?.focus(); }}
                style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                  padding:"2px 7px", borderRadius:4, cursor:"pointer",
                  border:"1px solid rgba(42,79,122,0.35)",
                  background:"transparent", color:T.txt4,
                  letterSpacing:0.5 }}>
                {prefix}
              </button>
            ))}
          </div>
        )}

        {/* Results */}
        <div style={{ maxHeight:"58vh", overflowY:"auto" }}>
          {results.length === 0 ? (
            <div style={{ padding:"28px", textAlign:"center",
              fontFamily:"'DM Sans',sans-serif", fontSize:13,
              color:T.txt4 }}>
              No results for "{query}"
              <div style={{ fontSize:11, marginTop:6, color:T.txt4 }}>
                Try: hub: · drug: · score: · section: · protocol:
              </div>
            </div>
          ) : (
            grouped.map((group, gi) => {
              return (
                <div key={gi}>
                  {group.label && (
                    <div style={{ padding:"7px 14px 3px",
                      fontFamily:"'JetBrains Mono',monospace",
                      fontSize:8, fontWeight:700,
                      color:group.color || T.txt4,
                      letterSpacing:1.5, textTransform:"uppercase",
                      borderTop:gi > 0 ? "1px solid rgba(26,53,85,0.3)" : "none" }}>
                      {group.label}
                    </div>
                  )}
                  {group.items.map(cmd => {
                    const idx = results.indexOf(cmd);
                    return (
                      <ResultItem
                        key={cmd.id}
                        cmd={cmd}
                        active={idx === activeIdx}
                        onSelect={handleSelect}
                        query={query.trim().toLowerCase()} />
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{ display:"flex", alignItems:"center", gap:14,
          padding:"8px 16px",
          borderTop:"1px solid rgba(26,53,85,0.35)" }}>
          {[
            { key:"↑↓", desc:"navigate" },
            { key:"↵",  desc:"open"     },
            { key:"Esc",desc:"close"    },
            { key:"⌘K", desc:"toggle"   },
          ].map(h => (
            <div key={h.key} style={{ display:"flex", alignItems:"center", gap:4 }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:9, color:T.teal,
                background:"rgba(0,229,192,0.1)",
                border:"1px solid rgba(0,229,192,0.3)",
                borderRadius:4, padding:"1px 6px" }}>
                {h.key}
              </span>
              <span style={{ fontFamily:"'DM Sans',sans-serif",
                fontSize:10, color:T.txt4 }}>
                {h.desc}
              </span>
            </div>
          ))}
          <span style={{ marginLeft:"auto",
            fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1 }}>
            {results.length} result{results.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </>
  );
}