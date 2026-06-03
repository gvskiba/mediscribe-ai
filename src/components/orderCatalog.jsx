// orderCatalog.js — weight-based dosing / CPOE composer catalog.
// Plain JavaScript module (no React, no JSX). Consumed by:
//   • EDOrderHub.jsx  (composer + queue — primary consumer)
// NOTE: The in-board quick-pick surfaces (CommandCenter OrdersTab and
//   RapidOrderDrawer) use a separate catalog: boardOrderCatalog.js.
// Import path convention: "@/components/orderCatalog" (match across all consumers).
//
// IMPORTANT — clinical data integrity:
// Do NOT re-type the dose strings. The SIMPLE and DRUGS arrays below are paste
// slots. Move them VERBATIM out of your already-tested EDOrderHub.jsx so no
// weight-based dose math is re-keyed by hand.

// ── Text-builder helpers (order text / CPOE bridge) ─────────────────────────
// These back every drug scenario's build() function. Lakonyx-branded footer.
const BAR = "\u2501".repeat(46);
const ts = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};
export const fmt = (n) => Math.round(n).toLocaleString();
const pad = (s, n = 12) => s.padEnd(n, " ");
const bline = (k, v) => `${pad(k + ":")} ${v}`;
export const buildBlock = (name, rows, note) => {
  const body = rows.map(([k, v]) => bline(k, v)).join("\n");
  return `${BAR}\n${body}${note ? `\n${BAR}\n\u26A0  ${note}` : ""}\n${BAR}\n[Lakonyx Order Generator \u00B7 ${ts()}]`;
};

// ── Allergy map (labels only — no dose math, safe to define here) ───────────
export const AMAP = {
  contrast: { name: "Iodinated Contrast", sev: "Moderate", reaction: "Urticaria" },
  codeine:  { name: "Codeine",            sev: "Mild",     reaction: "Nausea/Vomiting" },
  pcn:      { name: "Penicillin",         sev: "SEVERE",   reaction: "Anaphylaxis" },
};
export const getAllergyWarn = (o) => {
  if (o && o.alert && AMAP[o.alert]) return AMAP[o.alert];
  if (o && o.contrast && AMAP.contrast) return AMAP.contrast;
  return null;
};

// ── Category meta (medication catalog grouping) ─────────────────────────────
export const CAT_META = {
  cardiac:  { label: "Cardiac",                    color: "#ff6b6b" },
  rhythm:   { label: "Arrhythmia",                 color: "#f5c842" },
  pressors: { label: "Vasopressors",               color: "#ff9f43" },
  abx:      { label: "Antibiotics",                color: "#00e5c0" },
  sedation: { label: "RSI / Sedation",             color: "#9b6dff" },
  pain:     { label: "Analgesia",                  color: "#3b9eff" },
  psych:    { label: "Psych / Behavioral Health",  color: "#9b6dff" },
  support:  { label: "Supportive",                 color: "#3dffa0" },
};

// ── NON-MEDICATION ORDERS (labs / imaging / procedures / consults) ──────────
// PASTE EDOrderHub.jsx's exact `SIMPLE` array contents below, verbatim.
// (Just the array literal entries — the `export const SIMPLE = [` wrapper is here.)
export const SIMPLE = [
  { id: "l_trop",  cat: "labs", sub: "Cardiac",    icon: "\u2764\uFE0F", name: "Troponin-I (High Sensitivity)",      detail: "Serial q3h \u00B7 NSTEMI protocol",        meta: "~30 min",            priority: "STAT",    alert: null,       contrast: false },
  { id: "l_bnp",   cat: "labs", sub: "Cardiac",    icon: "\u2764\uFE0F", name: "BNP (B-Natriuretic Peptide)",        detail: "Heart failure marker",                meta: "~45 min",            priority: "STAT",    alert: null,       contrast: false },
  { id: "l_ckmb",  cat: "labs", sub: "Cardiac",    icon: "\u2764\uFE0F", name: "CK-MB",                              detail: "Cardiac isoenzyme",                   meta: "~45 min",            priority: "URGENT",  alert: null,       contrast: false },
  { id: "l_bmp",   cat: "labs", sub: "Metabolic",  icon: "\uD83E\uDDEA", name: "BMP (Basic Metabolic Panel)",        detail: "Na, K, Cl, CO\u2082, BUN, Cr, Glu",   meta: "~30 min",            priority: "STAT",    alert: null,       contrast: false },
  { id: "l_cmp",   cat: "labs", sub: "Metabolic",  icon: "\uD83E\uDDEA", name: "CMP (Comprehensive Metabolic)",      detail: "Full metabolic + LFTs",               meta: "~45 min",            priority: "ROUTINE", alert: null,       contrast: false },
  { id: "l_mg",    cat: "labs", sub: "Metabolic",  icon: "\uD83E\uDDEA", name: "Magnesium (Serum)",                  detail: "Electrolyte monitoring",              meta: "~30 min",            priority: "ROUTINE", alert: null,       contrast: false },
  { id: "l_lac",   cat: "labs", sub: "Metabolic",  icon: "\uD83E\uDDEA", name: "Lactate (Serum)",                    detail: "Perfusion / shock marker",            meta: "~25 min",            priority: "URGENT",  alert: null,       contrast: false },
  { id: "l_a1c",   cat: "labs", sub: "Metabolic",  icon: "\uD83E\uDE78", name: "HbA1c",                              detail: "Diabetes monitoring",                 meta: "~2 hr",              priority: "ROUTINE", alert: null,       contrast: false },
  { id: "l_bhcg",  cat: "labs", sub: "Metabolic",  icon: "\uD83E\uDE78", name: "\u03B2-hCG (Quantitative)",          detail: "Pregnancy test",                      meta: "~45 min",            priority: "STAT",    alert: null,       contrast: false },
  { id: "l_ua",    cat: "labs", sub: "Metabolic",  icon: "\uD83E\uDDEA", name: "Urinalysis + Culture",               detail: "UTI, pyelo, renal eval",              meta: "~30 min / 48h Cx",   priority: "ROUTINE", alert: null,       contrast: false },
  { id: "l_etoh",  cat: "labs", sub: "Tox/Psych",  icon: "\uD83E\uDDEA", name: "Ethanol Level (Serum)",              detail: "Quantitative ETOH \u00B7 toxicology", meta: "~45 min",            priority: "STAT",    alert: null,       contrast: false },
  { id: "l_utox",  cat: "labs", sub: "Tox/Psych",  icon: "\uD83E\uDDEA", name: "Urine Drug Screen (Comprehensive)",  detail: "Multi-panel UDS \u00B7 immunoassay",  meta: "~60 min",            priority: "URGENT",  alert: null,       contrast: false },
  { id: "l_tsh",   cat: "labs", sub: "Tox/Psych",  icon: "\uD83E\uDDEA", name: "TSH (Thyroid Stimulating Hormone)",  detail: "Thyroid function \u2014 AMS, agitation workup", meta: "~2 hr",     priority: "ROUTINE", alert: null,       contrast: false },
  { id: "l_cbc",   cat: "labs", sub: "Hematology", icon: "\uD83E\uDE78", name: "CBC with Differential",              detail: "Complete blood count + diff",         meta: "~30 min",            priority: "STAT",    alert: null,       contrast: false },
  { id: "l_coag",  cat: "labs", sub: "Hematology", icon: "\uD83E\uDE78", name: "PT / INR / PTT",                     detail: "PTT goal 60\u2013100 on heparin",     meta: "~30 min",            priority: "STAT",    alert: null,       contrast: false },
  { id: "l_type",  cat: "labs", sub: "Hematology", icon: "\uD83E\uDE78", name: "Type & Screen",                      detail: "Blood bank \u00B7 pre-procedure",     meta: "Blood Bank",         priority: "URGENT",  alert: null,       contrast: false },
  { id: "i_cxr",   cat: "imaging", sub: "X-Ray", icon: "\uD83E\uDEC1", name: "Chest X-Ray PA / Lateral",            detail: "Cardiomegaly, pulm edema, effusion",  meta: "XR \u00B7 ~15 min",  priority: "STAT",    alert: null,       contrast: false },
  { id: "i_tte",   cat: "imaging", sub: "Echo",  icon: "\u2764\uFE0F", name: "Echocardiogram (TTE)",                detail: "LV function, wall motion, EF",        meta: "Echo \u00B7 ~45 min", priority: "URGENT", alert: null,      contrast: false },
  { id: "i_ctpe",  cat: "imaging", sub: "CT",    icon: "\uD83E\uDEBB", name: "CT Pulmonary Angiography",            detail: "R/O pulmonary embolism",              meta: "CT W \u00B7 ~30 min", priority: "STAT",   alert: "contrast", contrast: true },
  { id: "i_ctca",  cat: "imaging", sub: "CT",    icon: "\uD83E\uDEBB", name: "CT Coronary Angiography",             detail: "Non-invasive coronary imaging",       meta: "CT W \u00B7 ~45 min", priority: "URGENT", alert: "contrast", contrast: true },
  { id: "i_cthead",cat: "imaging", sub: "CT",    icon: "\uD83E\uDEBB", name: "CT Head (Non-Contrast)",              detail: "R/O ICH, stroke, mass",               meta: "CT \u00B7 ~20 min",  priority: "STAT",    alert: null,       contrast: false },
  { id: "i_ctabd", cat: "imaging", sub: "CT",    icon: "\uD83E\uDEBB", name: "CT Abdomen / Pelvis",                 detail: "Acute abdomen, appy, diverticulitis", meta: "CT W/WO \u00B7 ~30 min", priority: "URGENT", alert: "contrast", contrast: true },
  { id: "p_ecg",   cat: "procedures", sub: "Cardiac",    icon: "\u26A1",     name: "12-Lead ECG",                  detail: "ST changes, rhythm eval",             meta: "~5 min \u00B7 Bedside", priority: "STAT",   alert: null, contrast: false },
  { id: "p_ecg_s", cat: "procedures", sub: "Cardiac",    icon: "\u26A1",     name: "Serial 12-Lead ECG (q4h \u00D7 3)", detail: "NSTEMI monitoring protocol",      meta: "~5 min each",        priority: "URGENT", alert: null, contrast: false },
  { id: "p_tele",  cat: "procedures", sub: "Monitoring", icon: "\uD83D\uDCE1", name: "Continuous Cardiac Telemetry", detail: "Real-time arrhythmia monitoring",     meta: "Ongoing",            priority: "STAT",   alert: null, contrast: false },
  { id: "p_o2",    cat: "procedures", sub: "Monitoring", icon: "\uD83D\uDCA8", name: "Supplemental O\u2082 \u2014 2L NC", detail: "SpO\u2082 target \u2265 94%",      meta: "Ongoing",            priority: "STAT",   alert: null, contrast: false },
  { id: "p_iv2",   cat: "procedures", sub: "Access",     icon: "\uD83D\uDC89", name: "Peripheral IV \u00D7 2 Large Bore", detail: "18G+ \u2014 antecubital preferred", meta: "Bedside",          priority: "STAT",   alert: null, contrast: false },
  { id: "p_1to1",  cat: "procedures", sub: "Safety",     icon: "\uD83D\uDEE1\uFE0F", name: "1:1 Nursing Observation",  detail: "Continuous monitoring \u2014 behavioral health", meta: "Ongoing",  priority: "STAT",   alert: null, contrast: false },
  { id: "p_rest",  cat: "procedures", sub: "Safety",     icon: "\uD83D\uDD12", name: "Soft Restraints (4-point)",    detail: "PRN agitation \u2014 document Q15 min", meta: "PRN \u00B7 Ongoing", priority: "URGENT", alert: null, contrast: false },
  { id: "c_cards", cat: "consults", sub: "Medical",    icon: "\uD83E\uDE7A", name: "Cardiology Consult",            detail: "NSTEMI mgmt, cath lab decision",      meta: "URGENT",             priority: "URGENT",  alert: null, contrast: false },
  { id: "c_surg",  cat: "consults", sub: "Medical",    icon: "\uD83E\uDE7A", name: "General Surgery Consult",       detail: "Acute abdomen, appendicitis eval",    meta: "URGENT",             priority: "URGENT",  alert: null, contrast: false },
  { id: "c_neuro", cat: "consults", sub: "Medical",    icon: "\uD83E\uDE7A", name: "Neurology Consult",             detail: "Stroke eval, seizure management",     meta: "STAT",               priority: "STAT",    alert: null, contrast: false },
  { id: "c_psych", cat: "consults", sub: "Behavioral", icon: "\uD83E\uDDE0", name: "Psychiatry Consult",            detail: "Capacity eval, disposition, safety plan", meta: "URGENT",         priority: "URGENT",  alert: null, contrast: false },
  { id: "c_addx",  cat: "consults", sub: "Behavioral", icon: "\uD83E\uDD1D", name: "Addiction Medicine / SBIRT",    detail: "ETOH / opioid use \u2014 treatment linkage", meta: "ROUTINE",      priority: "ROUTINE", alert: null, contrast: false },
  { id: "c_pharm", cat: "consults", sub: "Support",    icon: "\uD83D\uDC8A", name: "Pharmacy Consult",              detail: "Drip adjustment, med reconcile",      meta: "ROUTINE",            priority: "ROUTINE", alert: null, contrast: false },
  { id: "c_sw",    cat: "consults", sub: "Support",    icon: "\uD83E\uDD1D", name: "Social Work Consult",           detail: "Disposition, resources, safety",      meta: "ROUTINE",            priority: "ROUTINE", alert: null, contrast: false },
];

// ── MEDICATION CATALOG (weight-based dosing builders) ───────────────────────
// MOVE EDOrderHub.jsx's exact `DRUGS` array entries into the slot below,
// VERBATIM. In your EDOrderHub source, select everything between the
// `const DRUGS=[` opening bracket and its closing `];` (the 44 drug objects,
// including all the `// ── Cardiac ──` style comments) and paste it here,
// replacing the placeholder line.
//
// No edits needed after pasting:
//   • Each entry's scenarios[].build() calls buildBlock(...) / fmt(...), which
//     are exported from this file above — they resolve automatically.
//   • The CPOE footer rebrands from "[Notrya ...]" to
//     "[Lakonyx Order Generator ...]" for free, because the build() functions
//     use THIS file's buildBlock.
//
// Do NOT retype the dose strings by hand. This must be a copy, so every dose,
// max, and weight coefficient is preserved exactly as in your tested source.
export const DRUGS = [
  // ── Cardiac ──
  {id:'asa',cat:'cardiac',icon:'💊',name:'Aspirin',sub:'Antiplatelet — ACS',cor:'I',wtBased:false,alert:null,contrast:false,
   scenarios:[
     {label:'ACS Load',build:()=>buildBlock('Aspirin',[['DRUG','Aspirin (ASA) — PO'],['DOSE','325 mg PO × 1 (non-enteric coated — chewed)'],['INDICATION','ACS — antiplatelet load'],['FREQUENCY','Then 81 mg PO daily']],'COR I — ACS standard of care  [AHA/ACC 2025]')},
   ]},
  {id:'tica',cat:'cardiac',icon:'💊',name:'Ticagrelor',sub:'P2Y₁₂ Inhibitor — ACS',cor:'I',wtBased:false,alert:null,contrast:false,
   scenarios:[
     {label:'ACS Load',build:()=>buildBlock('Ticagrelor',[['DRUG','Ticagrelor (Brilinta) — PO'],['DOSE','180 mg PO × 1 load'],['MAINTENANCE','90 mg PO BID'],['INDICATION','NSTEMI / STEMI — DAPT with ASA']],'Avoid if planned CABG < 5 days · COR I  [AHA/ACC 2025]')},
   ]},
  {id:'clopi',cat:'cardiac',icon:'💊',name:'Clopidogrel',sub:'P2Y₁₂ Inhibitor — ACS alt',cor:'I',wtBased:false,alert:null,contrast:false,
   scenarios:[
     {label:'ACS Load',build:()=>buildBlock('Clopidogrel',[['DRUG','Clopidogrel (Plavix) — PO'],['DOSE','300–600 mg PO × 1 load'],['MAINTENANCE','75 mg PO daily'],['INDICATION','ACS / NSTEMI — alt to ticagrelor']],'CYP2C19 poor metabolizers have reduced efficacy')},
   ]},
  {id:'heparin',cat:'cardiac',icon:'💉',name:'Heparin UFH',sub:'Anticoagulant — ACS / PE',cor:'I',wtBased:true,alert:null,contrast:false,
   scenarios:[
     {label:'STEMI / PCI',build:(W)=>buildBlock('Heparin UFH',[['DRUG','Unfractionated Heparin — IV'],['DOSE',`${fmt(60*W)} units IV bolus  [60 units/kg × ${W} kg, max 4,000 units]`],['DRIP',`${fmt(12*W)} units/hr  [12 units/kg/hr, max 1,000 units/hr]`],['INDICATION','STEMI / PCI anticoagulation'],['MONITOR','PTT goal 60–100 sec · recheck q6h']],'Weight-capped: bolus max 4,000 units · drip max 1,000 units/hr')},
     {label:'ACS Medical Mgmt',build:(W)=>buildBlock('Heparin UFH',[['DRUG','Unfractionated Heparin — IV'],['DOSE',`${fmt(60*W)} units IV bolus  [60 units/kg × ${W} kg, max 5,000 units]`],['DRIP',`${fmt(12*W)} units/hr  [12 units/kg/hr, max 1,000 units/hr]`],['INDICATION','NSTEMI / ACS medical management'],['MONITOR','PTT goal 60–100 sec · recheck q6h']],'Adjust per institutional nomogram · weight-capped')},
   ]},
  {id:'enox',cat:'cardiac',icon:'💉',name:'Enoxaparin',sub:'LMWH — NSTEMI / PE',cor:'I',wtBased:true,alert:null,contrast:false,
   scenarios:[
     {label:'NSTEMI Treatment',build:(W)=>buildBlock('Enoxaparin',[['DRUG','Enoxaparin (Lovenox) — SQ'],['DOSE',`${fmt(1*W)} mg SQ q12h  [1 mg/kg × ${W} kg]`],['INDICATION','NSTEMI — LMWH anticoagulation'],['NOTE','Adjust: CrCl < 30 → 1 mg/kg SQ q24h']],'Max dose uncapped; do NOT use if CrCl < 15 or HD')},
     {label:'PE Treatment',build:(W)=>buildBlock('Enoxaparin',[['DRUG','Enoxaparin (Lovenox) — SQ'],['DOSE',`${fmt(1*W)} mg SQ q12h  [1 mg/kg × ${W} kg]`],['INDICATION','Pulmonary embolism treatment'],['NOTE','Adjust: CrCl < 30 → 1 mg/kg SQ q24h']],'Confirmed or high-probability PE · anti-Xa monitoring optional')},
   ]},
  {id:'statin',cat:'cardiac',icon:'💊',name:'Atorvastatin',sub:'Statin — ACS High-Intensity',cor:'I',wtBased:false,alert:null,contrast:false,
   scenarios:[
     {label:'ACS High-Intensity',build:()=>buildBlock('Atorvastatin',[['DRUG','Atorvastatin (Lipitor) — PO'],['DOSE','80 mg PO once daily'],['INDICATION','ACS — high-intensity statin plaque stabilization'],['TIMING','Start in ED — first dose at presentation']],'COR I for all ACS  [AHA/ACC 2025] · do not delay')},
   ]},
  {id:'tnk',cat:'cardiac',icon:'💉',name:'Tenecteplase (TNK)',sub:'Fibrinolytic — STEMI lytics',cor:'I',wtBased:true,alert:null,contrast:false,
   scenarios:[
     {label:'STEMI Lytics (no PCI)',build:(W)=>buildBlock('Tenecteplase (TNK-tPA)',[
       ['DRUG','Tenecteplase — IV bolus'],
       ['DOSE', W<60?'30 mg IV bolus  [< 60 kg]': W<70?'35 mg IV bolus  [60–70 kg]': W<80?'40 mg IV bolus  [70–80 kg]': W<90?'45 mg IV bolus  [80–90 kg]':'50 mg IV bolus  [≥ 90 kg, max]'],
       ['ROUTE','Single IV bolus over 5 seconds'],
       ['INDICATION','STEMI — fibrinolysis when PCI not available < 120 min'],
       ['ADJUNCT','UFH drip after (see heparin order)'],
     ],'ABSOLUTE CI: prior ICH, active bleeding, recent surgery < 3 mo  [AHA/ACC COR I]')},
   ]},
  // ── Arrhythmia ──
  {id:'diltia',cat:'rhythm',icon:'💊',name:'Diltiazem',sub:'CCB Rate Control — AFib',cor:'I',wtBased:false,alert:null,contrast:false,
   scenarios:[
     {label:'AFib Rate Control',build:()=>buildBlock('Diltiazem',[['DRUG','Diltiazem — IV'],['DOSE','0.25 mg/kg IV over 2 min (round to nearest 5 mg)'],['REDOSE','0.35 mg/kg IV × 1 if inadequate response at 15 min'],['DRIP','5–15 mg/hr IV infusion to maintain rate'],['INDICATION','AFib/flutter — rate control']],'AVOID if EF < 40%, WPW, wide-complex tachycardia of unknown origin')},
   ]},
  {id:'metro_iv',cat:'rhythm',icon:'💊',name:'Metoprolol IV',sub:'β-Blocker Rate Control',cor:'I',wtBased:false,alert:null,contrast:false,
   scenarios:[
     {label:'IV Rate Control / ACS',build:()=>buildBlock('Metoprolol',[['DRUG','Metoprolol Tartrate — IV'],['DOSE','2.5–5 mg IV over 2–5 min'],['REPEAT','May repeat q5 min × 3 (max 15 mg total)'],['INDICATION','AFib rate control / ACS — HR reduction']],'AVOID: HR < 60, SBP < 100, active bronchospasm, AV block > 1°')},
   ]},
  {id:'amio_iv',cat:'rhythm',icon:'💉',name:'Amiodarone IV',sub:'Antiarrhythmic — AF/VT/VF',cor:'IIa',wtBased:true,alert:null,contrast:false,
   scenarios:[
     {label:'AF Rhythm Control',build:(W)=>buildBlock('Amiodarone',[['DRUG','Amiodarone — IV infusion'],['DOSE',`150 mg IV over 10 min`],['DRIP','1 mg/min × 6h, then 0.5 mg/min × 18h'],['INDICATION','AF — rhythm control / rate refractory']],'Monitor QTc · Phlebitis risk — prefer central or large peripheral')},
     {label:'VT / Pulseless VF (ACLS)',build:(W)=>buildBlock('Amiodarone',[['DRUG','Amiodarone — IV/IO bolus'],['DOSE',`${fmt(5*W)} mg IV/IO  [5 mg/kg × ${W} kg, max 300 mg]`],['REPEAT','150 mg IV/IO × 1 after 3–5 min if refractory VF'],['INDICATION','Refractory pulseless VT / VF — ACLS']],'ACLS 2025 — after 3rd shock; max 2.2 g/24h')},
   ]},
  {id:'adenosine',cat:'rhythm',icon:'💉',name:'Adenosine',sub:'SVT Conversion',cor:'I',wtBased:false,alert:null,contrast:false,
   scenarios:[
     {label:'SVT Conversion',build:()=>buildBlock('Adenosine',[['DRUG','Adenosine — rapid IV push'],['DOSE','6 mg rapid IV push + 20 mL saline flush (antecubital or above)'],['REPEAT','12 mg rapid IV × 1 if no conversion (may repeat × 1 more)'],['INDICATION','Narrow-complex SVT conversion']],'Must be given as FAST bolus + immediate saline flush · 18G+ AC preferred')},
   ]},
  {id:'procain',cat:'rhythm',icon:'💉',name:'Procainamide',sub:'Antiarrhythmic — AF/VT',cor:'IIa',wtBased:true,alert:null,contrast:false,
   scenarios:[
     {label:'Stable VT / AF with WPW',build:(W)=>buildBlock('Procainamide',[['DRUG','Procainamide — IV infusion'],['DOSE',`${fmt(17*W)} mg IV load  [17 mg/kg × ${W} kg, max 1,000 mg]`],['RATE','20–50 mg/min — STOP if QRS widens > 50%, hypotension, or arrhythmia'],['DRIP','1–4 mg/min maintenance'],['INDICATION','Stable VT / AF with WPW']],'AVOID in QT prolongation, SLE, myasthenia gravis; max load 1,000 mg')},
   ]},
  {id:'mag_iv',cat:'rhythm',icon:'💉',name:'Magnesium Sulfate',sub:'TdP / Eclampsia / Hypomagnesemia',cor:'I',wtBased:false,alert:null,contrast:false,
   scenarios:[
     {label:'Torsades de Pointes',build:()=>buildBlock('Magnesium Sulfate',[['DRUG','Magnesium Sulfate — IV'],['DOSE','2 g IV over 2–5 min (push slowly if hemostable)'],['REPEAT','2 g IV repeat × 1 if recurs'],['DRIP','0.5–1 g/hr continuous for recurrent TdP'],['INDICATION','Torsades de Pointes / hypomagnesemia']],'Monitor DTRs · Have calcium chloride ready for toxicity reversal')},
     {label:'Eclampsia Seizure',build:()=>buildBlock('Magnesium Sulfate',[['DRUG','Magnesium Sulfate — IV'],['DOSE','4–6 g IV over 15–20 min (load)'],['DRIP','2 g/hr IV maintenance'],['INDICATION','Eclampsia seizure prophylaxis / treatment']],'Monitor: DTRs, UO, resp rate · Antidote: calcium gluconate 1 g IV')},
   ]},
  {id:'atropine',cat:'rhythm',icon:'💉',name:'Atropine',sub:'Bradycardia / Organophosphate',cor:'IIb',wtBased:false,alert:null,contrast:false,
   scenarios:[
     {label:'Symptomatic Bradycardia',build:()=>buildBlock('Atropine',[['DRUG','Atropine Sulfate — IV'],['DOSE','1 mg IV rapid push'],['REPEAT','Repeat q3–5 min × 3 (max 3 mg total)'],['INDICATION','Symptomatic bradycardia — HR < 50 with symptoms']],'ACLS COR IIb — if ineffective → TCP or dopamine/epi drip')},
   ]},
  // ── Vasopressors ──
  {id:'norepi',cat:'pressors',icon:'💉',name:'Norepinephrine',sub:'First-line Vasopressor — Septic Shock',cor:'I',wtBased:true,alert:null,contrast:false,
   scenarios:[
     {label:'Septic Shock',build:(W)=>buildBlock('Norepinephrine (Levophed)',[['DRUG','Norepinephrine — IV infusion'],['START',`${(0.01*W).toFixed(1)} mcg/min  [0.01 mcg/kg/min × ${W} kg]`],['RANGE','0.01–3.0 mcg/kg/min — titrate MAP ≥ 65 mmHg'],['CONCENTRATION','4 mg/250 mL NS (16 mcg/mL) or 8 mg/250 mL (32 mcg/mL)'],['INDICATION','Septic shock — first-line vasopressor']],'SSC 2021 COR I · Prefer central line; peripheral 16G acceptable short-term')},
   ]},
  {id:'epi_anap',cat:'pressors',icon:'💉',name:'Epinephrine',sub:'Anaphylaxis / Cardiac Arrest',cor:'I',wtBased:true,alert:null,contrast:false,
   scenarios:[
     {label:'Anaphylaxis — IM',build:(W)=>buildBlock('Epinephrine',[['DRUG','Epinephrine 1:1,000 — IM'],['DOSE',`${W<30?'0.15 mg':W>60?'0.5 mg':'0.3 mg'} IM — anterolateral thigh`],['REPEAT','Repeat q5–15 min × 2 PRN if inadequate response'],['INDICATION','Anaphylaxis — first-line treatment']],'COR I anaphylaxis  [WAO 2020] · NEVER delay · Autoinjector or drawn-up 1:1,000')},
     {label:'Cardiac Arrest (ACLS)',build:()=>buildBlock('Epinephrine',[['DRUG','Epinephrine 1:10,000 — IV/IO'],['DOSE','1 mg IV/IO q3–5 min during CPR'],['INDICATION','Pulseless arrest — PEA, asystole, refractory VF/VT']],'ACLS 2025 · Give early for non-shockable rhythms')},
   ]},
  {id:'dopa',cat:'pressors',icon:'💉',name:'Dopamine',sub:'Vasopressor / Chronotrope',cor:'IIb',wtBased:true,alert:null,contrast:false,
   scenarios:[
     {label:'Cardiogenic / Distributive Shock',build:(W)=>buildBlock('Dopamine',[['DRUG','Dopamine — IV infusion'],['DOSE',`${(5*W).toFixed(0)} mcg/min start  [5 mcg/kg/min × ${W} kg]`],['RANGE','2–20 mcg/kg/min — titrate to MAP ≥ 65 mmHg'],['INDICATION','Cardiogenic or distributive shock (alt pressor)']],'Highly arrhythmogenic — prefer norepinephrine (COR I); dopamine COR IIb  [SSC 2021]')},
   ]},
  // ── Antibiotics ──
  {id:'vanc',cat:'abx',icon:'💉',name:'Vancomycin',sub:'MRSA / Gram-positive Coverage',cor:'I',wtBased:true,alert:null,contrast:false,
   scenarios:[
     {label:'Sepsis / SSTI / CAP',build:(W)=>buildBlock('Vancomycin',[['DRUG','Vancomycin — IV infusion'],['DOSE',`${fmt(25*W)} mg IV over ${W<60?60:W<90?90:120} min  [25 mg/kg × ${W} kg]`],['FREQUENCY','Q8–12h based on renal function'],['INDICATION','MRSA coverage — sepsis, SSTI, CAP (failed outpatient)'],['MONITOR','Trough 15–20 mcg/mL or AUC 400–600 (pharmacy to dose']],'AVOID: severe vancomycin allergy → use linezolid or daptomycin')},
   ]},
  {id:'piptz',cat:'abx',icon:'💉',name:'Piperacillin-Tazobactam',sub:'Broad Spectrum — Gram-neg/Sepsis',cor:'I',wtBased:false,alert:'pcn',contrast:false,
   scenarios:[
     {label:'Broad Spectrum Sepsis',build:()=>buildBlock('Piperacillin-Tazobactam',[['DRUG','Pip-Tazo (Zosyn) — IV infusion'],['DOSE','4.5 g IV over 30 min'],['FREQUENCY','Q6h (extended infusion: 3.375 g over 4h Q8h)'],['INDICATION','Broad-spectrum: gram-neg / Pseudomonas / polymicrobial']],'⚠ Penicillin allergy — cross-reactivity ~1–2% (check allergy history)')},
   ]},
  {id:'ceftx',cat:'abx',icon:'💉',name:'Ceftriaxone',sub:'CAP / UTI / Meningitis',cor:'I',wtBased:false,alert:null,contrast:false,
   scenarios:[
     {label:'CAP / UTI / Meningitis',build:()=>buildBlock('Ceftriaxone',[['DRUG','Ceftriaxone (Rocephin) — IV'],['DOSE','1 g IV over 30 min (CAP/UTI) · 2 g IV (meningitis)'],['FREQUENCY','Q24h (CAP/UTI) · Q12h (meningitis)'],['INDICATION','CAP, pyelonephritis, meningitis']],'Q12h dosing for meningitis/CNS · safe in PCN allergy (non-anaphylactic)')},
   ]},
  {id:'azithro',cat:'abx',icon:'💊',name:'Azithromycin',sub:'CAP Atypical / SSTI',cor:'I',wtBased:false,alert:null,contrast:false,
   scenarios:[
     {label:'CAP Atypical Coverage',build:()=>buildBlock('Azithromycin',[['DRUG','Azithromycin (Z-Pack) — IV/PO'],['DOSE','500 mg IV/PO q24h'],['INDICATION','CAP — atypical organism coverage (Mycoplasma, Legionella, Chlamydia)'],['COMBINATION','Pair with ceftriaxone for standard CAP combo']],'Monitor QTc — use macrolide alternative if QTc > 450 ms at baseline')},
   ]},
  {id:'cefep',cat:'abx',icon:'💉',name:'Cefepime',sub:'4th-Gen Cephalosporin — Pseudomonas',cor:'I',wtBased:false,alert:null,contrast:false,
   scenarios:[
     {label:'Febrile Neutropenia / Pseudomonas',build:()=>buildBlock('Cefepime',[['DRUG','Cefepime — IV infusion'],['DOSE','2 g IV over 30 min'],['FREQUENCY','Q8h (febrile neutropenia) · Q12h (less severe)'],['INDICATION','Febrile neutropenia, Pseudomonas coverage, PCN-allergic sepsis']],'4th-gen cephalosporin — low cross-reactivity in non-anaphylactic PCN allergy')},
   ]},
  // ── RSI / Sedation ──
  {id:'etom',cat:'sedation',icon:'💉',name:'Etomidate',sub:'RSI Induction Agent',cor:'I',wtBased:true,alert:null,contrast:false,
   scenarios:[
     {label:'RSI Induction',build:(W)=>buildBlock('Etomidate',[['DRUG','Etomidate — IV push'],['DOSE',`${fmt(0.3*W)} mg IV push  [0.3 mg/kg × ${W} kg]`],['ONSET','30–60 seconds'],['DURATION','3–5 minutes'],['INDICATION','RSI induction — hemodynamically stable/unstable']],'Inhibits cortisol synthesis × 24h — single dose acceptable in sepsis')},
   ]},
  {id:'ketamine',cat:'sedation',icon:'💉',name:'Ketamine',sub:'RSI Induction / Dissociative',cor:'I',wtBased:true,alert:null,contrast:false,
   scenarios:[
     {label:'RSI Induction',build:(W)=>buildBlock('Ketamine',[['DRUG','Ketamine — IV push'],['DOSE',`${fmt(1.5*W)} mg IV push  [1.5 mg/kg × ${W} kg]`],['ONSET','45–60 seconds'],['DURATION','10–15 minutes'],['INDICATION','RSI induction — hemodynamically unstable, asthma, agitation']],'Preferred in shock/hypotension · Increases HR/BP · Causes emergence phenomena')},
     {label:'Procedural Sedation',build:(W)=>buildBlock('Ketamine',[['DRUG','Ketamine — IV push (PSA)'],['DOSE',`${fmt(1.0*W)} mg IV  [1 mg/kg × ${W} kg]`],['ONSET','45–60 sec'],['DURATION','10–15 min'],['INDICATION','Procedural sedation — dissociative anesthesia']],'Have atropine and midazolam (emergence) available at bedside')},
   ]},
  {id:'succs',cat:'sedation',icon:'💉',name:'Succinylcholine',sub:'Depolarizing NMB — RSI Paralytic',cor:'I',wtBased:true,alert:null,contrast:false,
   scenarios:[
     {label:'RSI Paralytic',build:(W)=>buildBlock('Succinylcholine',[['DRUG','Succinylcholine — IV push'],['DOSE',`${fmt(1.5*W)} mg IV push  [1.5 mg/kg × ${W} kg]`],['ONSET','45–60 seconds'],['DURATION','6–10 minutes'],['INDICATION','RSI paralysis — rapid sequence intubation']],'CONTRAINDICATED: crush injury > 72h, burns > 72h, denervation, MH hx, hyperkalemia · Use rocuronium if CI')},
   ]},
  {id:'roc',cat:'sedation',icon:'💉',name:'Rocuronium',sub:'Non-depolarizing NMB — RSI alt',cor:'I',wtBased:true,alert:null,contrast:false,
   scenarios:[
     {label:'RSI Paralytic (alt)',build:(W)=>buildBlock('Rocuronium',[['DRUG','Rocuronium — IV push'],['DOSE',`${fmt(1.2*W)} mg IV push  [1.2 mg/kg × ${W} kg]`],['ONSET','60–75 seconds'],['DURATION','30–60 minutes'],['INDICATION','RSI paralysis — succinylcholine contraindicated']],'REVERSAL: Sugammadex 16 mg/kg IV · Have sugammadex at bedside before intubation')},
   ]},
  {id:'midaz',cat:'sedation',icon:'💉',name:'Midazolam',sub:'Benzo — Procedural Sedation / Anxiolysis',cor:'I',wtBased:true,alert:null,contrast:false,
   scenarios:[
     {label:'Procedural Sedation',build:(W)=>buildBlock('Midazolam',[['DRUG','Midazolam (Versed) — IV'],['DOSE',`${(0.02*W).toFixed(1)} mg IV over 2 min  [0.02 mg/kg × ${W} kg, max 2.5 mg]`],['ONSET','1–2 minutes'],['INDICATION','Procedural sedation — amnesia/anxiolysis component']],'REVERSAL: flumazenil 0.2 mg IV q1 min (max 1 mg) · Max 2.5 mg single dose IV')},
   ]},
  // ── Analgesia ──
  {id:'fent',cat:'pain',icon:'💉',name:'Fentanyl',sub:'Opioid Analgesia / RSI Blunting',cor:'I',wtBased:true,alert:'codeine',contrast:false,
   scenarios:[
     {label:'IV Pain Management',build:(W)=>buildBlock('Fentanyl',[['DRUG','Fentanyl Citrate — IV'],['DOSE',`${fmt(1*W)} mcg IV over 2–3 min  [1 mcg/kg × ${W} kg]`],['ONSET','1–2 min peak'],['REPEAT','Titrate 25–50 mcg IV q5–10 min PRN NRS ≥ 7'],['INDICATION','Moderate–severe acute pain']],'REVERSAL: naloxone 0.4 mg IV · 100× potency vs morphine · Chest wall rigidity with rapid large doses')},
     {label:'RSI Blunting (defasciculation)',build:(W)=>buildBlock('Fentanyl',[['DRUG','Fentanyl — IV (RSI adjunct)'],['DOSE',`${fmt(3*W)} mcg IV over 30–60 sec  [3 mcg/kg × ${W} kg]`],['TIMING','Give 3 min BEFORE induction agent'],['INDICATION','RSI — blunt hemodynamic response to laryngoscopy']],'Prevents ICP spike — especially important in head trauma / hemorrhagic stroke')},
   ]},
  {id:'morph',cat:'pain',icon:'💉',name:'Morphine Sulfate',sub:'Opioid Analgesia',cor:'I',wtBased:true,alert:null,contrast:false,
   scenarios:[
     {label:'IV Pain Management',build:(W)=>buildBlock('Morphine Sulfate',[['DRUG','Morphine Sulfate — IV'],['DOSE',`${fmt(0.1*W)} mg IV over 5 min  [0.1 mg/kg × ${W} kg, max 4 mg]`],['REPEAT','2–4 mg IV q15–20 min PRN NRS ≥ 7'],['INDICATION','Moderate–severe acute pain']],'REVERSAL: naloxone 0.4 mg IV · Histamine release — avoid in true opioid allergy')},
   ]},
  {id:'ketor',cat:'pain',icon:'💊',name:'Ketorolac',sub:'NSAID — Non-opioid Analgesia',cor:'I',wtBased:false,alert:null,contrast:false,
   scenarios:[
     {label:'IV Non-Opioid Analgesia',build:()=>buildBlock('Ketorolac',[['DRUG','Ketorolac (Toradol) — IV'],['DOSE','15–30 mg IV over 2 min (15 mg if age > 65 or < 50 kg)'],['FREQUENCY','Q6h PRN · max 5 days total course'],['INDICATION','Non-opioid analgesia — renal colic, MSK, headache, dental']],'AVOID: CrCl < 30, active GI bleed, anticoagulation, NSAID allergy · Max 5-day course')},
   ]},
  {id:'apap',cat:'pain',icon:'💊',name:'Acetaminophen IV',sub:'Non-opioid Analgesic / Antipyretic',cor:'I',wtBased:true,alert:null,contrast:false,
   scenarios:[
     {label:'IV Analgesia / Antipyretic',build:(W)=>buildBlock('Acetaminophen (Ofirmev)',[['DRUG','Acetaminophen IV (Ofirmev)'],['DOSE',`${W<50?'650 mg':'1,000 mg'} IV over 15 min  [${W} kg]`],['FREQUENCY','Q6h scheduled or Q4–6h PRN'],['INDICATION','Pain · fever · opioid-sparing multimodal analgesia']],'Safe in renal failure · Reduce dose in hepatic impairment / chronic ETOH · Max 4 g/day')},
   ]},
  {id:'nitro_sl',cat:'cardiac',icon:'💊',name:'Nitroglycerin SL',sub:'Vasodilator — ACS / Hypertensive Urgency',cor:'I',wtBased:false,alert:null,contrast:false,
   scenarios:[
     {label:'ACS Sublingual',build:()=>buildBlock('Nitroglycerin',[['DRUG','Nitroglycerin 0.4 mg — SL tablet or spray'],['DOSE','0.4 mg SL q5 min × 3 PRN chest pain'],['INDICATION','ACS — ischemic chest pain relief'],['NOTE','Check ECG before redosing — r/o RV infarct / inferior STEMI']],'CONTRAINDICATED: PDE5 inhibitors (sildenafil/tadalafil) < 24–48h · SBP < 90 mmHg')},
   ]},
  {id:'labet',cat:'cardiac',icon:'💉',name:'Labetalol',sub:'α/β-Blocker — Hypertensive Emergency',cor:'I',wtBased:false,alert:null,contrast:false,
   scenarios:[
     {label:'Hypertensive Emergency',build:()=>buildBlock('Labetalol',[['DRUG','Labetalol — IV'],['DOSE','20 mg IV over 2 min (initial)'],['REPEAT','40 mg IV q10 min × 2 PRN (max bolus 80 mg) — then drip'],['DRIP','0.5–2 mg/min IV infusion'],['INDICATION','Hypertensive emergency — target SBP reduction 20–25% in 1h']],'AVOID: severe asthma, decompensated HF, heart block > 1° · Preferred in aortic dissection, pregnancy')},
   ]},
  // ── Psych / Behavioral ──
  {id:'haldo',cat:'psych',icon:'💊',name:'Haloperidol',sub:'Antipsychotic — Acute Agitation',cor:'IIa',wtBased:false,alert:null,contrast:false,
   scenarios:[
     {label:'Acute Agitation IM',build:()=>buildBlock('Haloperidol (Haldol)',[['DRUG','Haloperidol — IM'],['DOSE','5 mg IM (anterolateral thigh or deltoid)'],['REPEAT','5 mg IM q30–60 min PRN — max ~20 mg/24h'],['INDICATION','Acute agitation — antipsychotic chemical restraint']],'Baseline QTc required · No respiratory depression (advantage over BZDs) · COR IIa')},
   ]},
  {id:'droper',cat:'psych',icon:'💊',name:'Droperidol',sub:'Antipsychotic — Acute Agitation',cor:'IIa',wtBased:false,alert:null,contrast:false,
   scenarios:[
     {label:'Acute Agitation IM',build:()=>buildBlock('Droperidol',[['DRUG','Droperidol — IM/IV'],['DOSE','5–10 mg IM/IV'],['REPEAT','May repeat 5 mg q30–60 min PRN'],['INDICATION','Acute agitation — potent, rapid-onset antipsychotic']],'FDA Black Box: QTc prolongation · Baseline ECG mandatory · Continuous monitoring')},
   ]},
  {id:'olanzIM',cat:'psych',icon:'💊',name:'Olanzapine IM',sub:'Atypical Antipsychotic — Agitation',cor:'IIa',wtBased:false,alert:null,contrast:false,
   scenarios:[
     {label:'Acute Agitation IM',build:()=>buildBlock('Olanzapine IM (Zyprexa)',[['DRUG','Olanzapine — IM'],['DOSE','10 mg IM × 1 (anterolateral thigh)'],['REPEAT','5 mg IM q2h PRN — max 20 mg/24h'],['INDICATION','Acute agitation — atypical antipsychotic']],'⚠ NEVER give IM olanzapine + IM lorazepam — fatal respiratory depression  [FDA Black Box]')},
   ]},
  {id:'lzp',cat:'psych',icon:'💉',name:'Lorazepam',sub:'Benzo — Seizure / Agitation',cor:'I',wtBased:true,alert:null,contrast:false,
   scenarios:[
     {label:'Status Epilepticus',build:(W)=>buildBlock('Lorazepam (Ativan)',[['DRUG','Lorazepam — IV'],['DOSE',`${fmt(0.1*W)} mg IV over 2 min  [0.1 mg/kg × ${W} kg, max 4 mg]`],['ONSET','1–3 minutes'],['REPEAT','May repeat × 1 in 5–10 min if seizing'],['INDICATION','Status epilepticus — first-line BZD  [AES 2023]']],'REVERSAL: flumazenil 0.2 mg IV q1 min × 5 · Airway monitoring required')},
     {label:'ETOH Withdrawal',build:(W)=>buildBlock('Lorazepam (Ativan)',[['DRUG','Lorazepam — IV/PO (symptom-triggered)'],['DOSE','2 mg IV/PO q1h PRN CIWA-Ar ≥ 8'],['INDICATION','ETOH withdrawal — symptom-triggered (CIWA protocol)']],'Short-acting: preferred in hepatic failure · Monitor sedation level')},
   ]},
  {id:'diaz',cat:'psych',icon:'💊',name:'Diazepam',sub:'Long-acting Benzo — Seizure / ETOH W/D',cor:'I',wtBased:true,alert:null,contrast:false,
   scenarios:[
     {label:'Status Epilepticus (alt)',build:(W)=>buildBlock('Diazepam (Valium)',[['DRUG','Diazepam — IV'],['DOSE',`${fmt(0.15*W)} mg IV over 2 min  [0.15 mg/kg × ${W} kg, max 10 mg]`],['REPEAT','May repeat × 1 in 5 min'],['INDICATION','Status epilepticus — alternative BZD']],'Longer-acting than lorazepam — preferred for ETOH W/D seizure prevention')},
     {label:'ETOH Withdrawal',build:()=>buildBlock('Diazepam (Valium)',[['DRUG','Diazepam — PO (ETOH W/D)'],['DOSE','10–20 mg PO q1–2h PRN CIWA-Ar ≥ 8'],['INDICATION','ETOH withdrawal — preferred long-acting agent (front-loading protocol)']],'Longer half-life reduces seizure recurrence vs lorazepam in ETOH W/D')},
   ]},
  // ── Supportive ──
  {id:'zofran',cat:'support',icon:'💊',name:'Ondansetron (Zofran)',sub:'Antiemetic',cor:'I',wtBased:false,alert:null,contrast:false,
   scenarios:[
     {label:'Nausea / Vomiting',build:()=>buildBlock('Ondansetron (Zofran)',[['DRUG','Ondansetron — IV/PO'],['DOSE','4 mg IV over 2–5 min (or 4 mg ODT PO)'],['FREQUENCY','Q4–6h PRN nausea/vomiting'],['INDICATION','Acute nausea / vomiting — antiemetic']],'Monitor QTc at higher doses (> 32 mg/day) · Safe in pregnancy for hyperemesis')},
   ]},
  {id:'nalox',cat:'support',icon:'💉',name:'Naloxone',sub:'Opioid Reversal Agent',cor:'I',wtBased:true,alert:null,contrast:false,
   scenarios:[
     {label:'Opioid Reversal',build:(W)=>buildBlock('Naloxone (Narcan)',[['DRUG','Naloxone — IV/IM/IN'],['DOSE','0.4 mg IV q2–3 min — titrate to respiratory drive (NOT full reversal)'],['ALT ROUTE','IN: 4 mg per nare (2 mg/mL × 2 mL) — no IV access'],['ONSET','2–3 min IV · 5–10 min IN'],['REPEAT','Infusion: 2/3 of effective reversal dose per hour if renarcotization risk'],['INDICATION','Opioid respiratory depression']],'Duration 30–90 min — WATCH FOR RENARCOTIZATION · Avoid precipitating acute withdrawal')},
   ]},
  {id:'thiam',cat:'support',icon:'💉',name:'Thiamine (Vitamin B1)',sub:'Wernicke Prophylaxis',cor:'I',wtBased:false,alert:null,contrast:false,
   scenarios:[
     {label:'Wernicke Prophylaxis',build:()=>buildBlock('Thiamine (Vitamin B1)',[['DRUG','Thiamine — IV/IM'],['DOSE','100 mg IV/IM'],['TIMING','Give BEFORE dextrose in alcoholic or malnourished patient'],['INDICATION','Wernicke encephalopathy prophylaxis — ETOH use, malnutrition']],'Standard of care before glucose in at-risk patients · No evidence of toxicity at therapeutic doses')},
   ]},
  {id:'d50',cat:'support',icon:'💉',name:'Dextrose 50% (D50)',sub:'Hypoglycemia Treatment',cor:'I',wtBased:false,alert:null,contrast:false,
   scenarios:[
     {label:'Symptomatic Hypoglycemia',build:()=>buildBlock('Dextrose 50% (D50W)',[['DRUG','Dextrose 50% — IV push'],['DOSE','25 g (50 mL of D50) IV over 2–5 min'],['REPEAT','Recheck glucose in 15 min · Repeat PRN if BG < 70'],['INDICATION','Symptomatic hypoglycemia — altered mental status, seizure']],'Give thiamine FIRST if ETOH/malnourished · Monitor BG q15 min post-treatment')},
   ]},
  {id:'cacl',cat:'support',icon:'💉',name:'Calcium Chloride',sub:'Hyperkalemia / CCB OD / Arrest',cor:'I',wtBased:false,alert:null,contrast:false,
   scenarios:[
     {label:'Hyperkalemia / CCB OD / Arrest',build:()=>buildBlock('Calcium Chloride',[['DRUG','Calcium Chloride 10% — IV'],['DOSE','1 g (10 mL of 10%) IV over 2–5 min (can push in arrest)'],['REPEAT','Repeat q10 min × 3 for severe hyperkalemia or CCB OD'],['INDICATION','Hyperkalemia / CCB OD / pulseless arrest']],'Use central or large peripheral IV — vesicant, causes tissue necrosis if extravasated · Separate line from bicarb/Mg')},
   ]},
  {id:'bicarb',cat:'support',icon:'💉',name:'Sodium Bicarbonate',sub:'TCA OD / Metabolic Acidosis',cor:'I',wtBased:true,alert:null,contrast:false,
   scenarios:[
     {label:'TCA Overdose / Na-Channel Blockade',build:(W)=>buildBlock('Sodium Bicarbonate',[['DRUG','Sodium Bicarbonate — IV bolus'],['DOSE',`${fmt(1*W)} mEq IV over 2 min  [1 mEq/kg × ${W} kg]`],['REPEAT','Repeat q5–10 min until QRS narrows or pH 7.50–7.55'],['DRIP','150 mEq in 1L D5W at 200–250 mL/hr to maintain alkalinization'],['INDICATION','TCA overdose · Na-channel blockade · severe metabolic acidosis']],'Target arterial pH 7.50–7.55 for TCA toxicity · Monitor K⁺ (alkalinization drives K into cells)')},
   ]},
];

// ── Selectors (the shared API every order surface calls) ────────────────────
export const ALL_ORDERS = () => [...SIMPLE, ...DRUGS];
export const getSimple = (id) => SIMPLE.find((o) => o.id === id);
export const getDrug = (id) => DRUGS.find((d) => d.id === id);
export const getOrder = (id) => getSimple(id) || getDrug(id);
export const drugsByCategory = (cat) => DRUGS.filter((d) => d.cat === cat);

// Unified search across both order types. Returns tagged results so a caller
// can render meds and simple orders differently.
export const searchCatalog = (query) => {
  const q = (query || "").trim().toLowerCase();
  if (!q) return [];
  const inText = (...parts) => parts.some((p) => (p || "").toLowerCase().includes(q));
  const simple = SIMPLE.filter((o) => inText(o.name, o.detail, o.sub)).map((o) => ({ ...o, _type: "simple" }));
  const drugs = DRUGS.filter((d) => inText(d.name, d.sub)).map((d) => ({ ...d, _type: "drug" }));
  return [...simple, ...drugs];
};

// Build the CPOE order text for a drug id at a given weight (kg), scenario index.
// Centralizes the "which scenario" + "what weight" logic so every surface that
// wants order text calls one function instead of reaching into scenarios[].
export const buildOrderText = (drugId, weightKg = 70, scenarioIdx = 0) => {
  const d = getDrug(drugId);
  if (!d || !d.scenarios || !d.scenarios.length) return "";
  const sc = d.scenarios[scenarioIdx] || d.scenarios[0];
  return sc.build(parseFloat(weightKg) || 70);
};