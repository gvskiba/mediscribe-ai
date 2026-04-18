import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

// ── Tier helpers ──────────────────────────────────────────────────────────────
const TC = { STAT:"var(--npi-coral)", URGENT:"var(--npi-orange)", ROUTINE:"var(--npi-txt4)" };
const TB = { STAT:"rgba(255,107,107,.12)", URGENT:"rgba(255,159,67,.12)", ROUTINE:"rgba(255,255,255,.05)" };
const TD = { STAT:"rgba(255,107,107,.28)", URGENT:"rgba(255,159,67,.28)", ROUTINE:"rgba(255,255,255,.10)" };
const TL = { STAT:"var(--npi-coral)", URGENT:"var(--npi-orange)", ROUTINE:"rgba(255,255,255,.15)" };
const CAT_ICON = { lab:"🧪", medication:"💊", iv:"💧", imaging:"🔬", procedure:"⚙️", consult:"👤", monitoring:"📡" };


// ── Allergy cross-check — checked at point of ordering ───────────────────────
const ALLERGY_MAP = {
  penicillin:   ["amoxicillin","ampicillin","augmentin","pip-tazo","piperacillin","oxacillin","nafcillin","amoxicillin-clavulanate"],
  cephalosporin:["ceftriaxone","cefazolin","cephalexin","cefdinir","cefepime","cefuroxime","cefpodoxime"],
  sulfa:        ["bactrim","sulfamethoxazole","trimethoprim-sulfa","smx-tmp"],
  nsaid:        ["ibuprofen","ketorolac","naproxen","indomethacin","celecoxib","diclofenac"],
  aspirin:      ["aspirin 325mg","aspirin"],
  contrast:     ["ct angio","ct abd/pelvis w/ contrast","ct chest/abd/pelvis","mri brain","mri spine"],
  morphine:     ["morphine sulfate","codeine","hydrocodone","oxycodone"],
  fluoroquinolone:["ciprofloxacin","levofloxacin","moxifloxacin"],
};

function getAllergyWarning(orderName, allergies) {
  if (!allergies?.length) return null;
  const name = orderName.toLowerCase();
  for (const allergy of allergies) {
    const a = allergy.toLowerCase();
    const mapped = ALLERGY_MAP[a] || [];
    if (mapped.some(m => name.includes(m)) || name.includes(a)) {
      return `⚠ ${allergy} allergy on file`;
    }
  }
  return null;
}

function elapsed(ms) {
  if (!ms) return null;
  const m = Math.round((Date.now() - ms) / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60), r = m % 60;
  return r ? `${h}h ${r}m ago` : `${h}h ago`;
}

// ALL_SEARCHABLE is initialized after LABS/MEDS/IV_STRAT/IMAGING_ORDERS are declared below

function TierBadge({ tier }) {
  return (
    <span style={{ display:"inline-flex", padding:"1px 7px", borderRadius:20, fontSize:9, fontWeight:700,
      letterSpacing:.5, whiteSpace:"nowrap", background:TB[tier]||TB.ROUTINE,
      color:TC[tier]||TC.ROUTINE, border:`1px solid ${TD[tier]||TD.ROUTINE}` }}>
      {tier}
    </span>
  );
}

// ── Named order sets — scenario-based, one-click load ─────────────────────────
// Literature: Campbell et al., Kawamoto 2005 — providers think in presentations,
// not order categories. "Confirm and remove" > "browse and select."
const ORDER_SETS = [
  {
    id:"acs", name:"Chest Pain / ACS", icon:"🫀", color:"rgba(255,107,107,0.12)", bd:"rgba(255,107,107,0.25)",
    orders:[
      {id:"acs-ecg",   name:"12-lead ECG",        detail:"Immediately — goal door-to-ECG <10 min",                       tier:"STAT",    category:"monitoring"},
      {id:"acs-trop",  name:"Troponin (hsTnI)",   detail:"Serial 0h and 3h — HEART pathway or ESC 0/1h protocol",        tier:"STAT",    category:"lab"},
      {id:"acs-bmp",   name:"BMP",                detail:"Electrolytes, renal function — baseline before heparin",       tier:"STAT",    category:"lab"},
      {id:"acs-cbc",   name:"CBC w/ diff",        detail:"Anemia, infection; thrombocytopenia before anticoagulation",   tier:"URGENT",  category:"lab"},
      {id:"acs-coag",  name:"Coagulation",        detail:"PT/INR, PTT — anticoagulation planning",                      tier:"URGENT",  category:"lab"},
      {id:"acs-bnp",   name:"BNP",                detail:"Heart failure evaluation, dyspnea differentiation",            tier:"URGENT",  category:"lab"},
      {id:"acs-cxr",   name:"CXR PA/Lateral",     detail:"Cardiac silhouette, pulmonary edema, pneumothorax",           tier:"URGENT",  category:"imaging"},
      {id:"acs-asa",   name:"Aspirin 325mg PO",   detail:"Chew immediately if ACS not excluded",                        tier:"STAT",    category:"medication"},
      {id:"acs-o2",    name:"O₂ / SpO₂ monitor", detail:"Continuous pulse oximetry, supplemental O₂ if <94%",          tier:"STAT",    category:"monitoring"},
      {id:"acs-iv",    name:"IV access x2",       detail:"Large-bore bilateral antecubital — blood draw from one",      tier:"STAT",    category:"procedure"},
    ]
  },
  {
    id:"sepsis", name:"Sepsis Bundle", icon:"🦠", color:"rgba(255,107,107,0.1)", bd:"rgba(255,107,107,0.22)",
    orders:[
      {id:"sep-bc",    name:"Blood cultures x2",  detail:"Before antibiotics — peripheral sets bilateral",               tier:"STAT",    category:"lab"},
      {id:"sep-lac",   name:"Lactic acid",        detail:"Venous lactate — severity stratification (>2 = sepsis)",      tier:"STAT",    category:"lab"},
      {id:"sep-bmp",   name:"BMP",                detail:"Renal function, glucose, electrolytes",                       tier:"STAT",    category:"lab"},
      {id:"sep-cbc",   name:"CBC w/ diff",        detail:"WBC, bands, thrombocytopenia",                                tier:"STAT",    category:"lab"},
      {id:"sep-coag",  name:"Coagulation",        detail:"PT/INR, PTT, fibrinogen — DIC evaluation",                   tier:"URGENT",  category:"lab"},
      {id:"sep-ua",    name:"UA w/ microscopy",   detail:"Urinary source evaluation — reflex culture",                  tier:"URGENT",  category:"lab"},
      {id:"sep-cxr",   name:"CXR portable",       detail:"Pulmonary source, effusion",                                  tier:"URGENT",  category:"imaging"},
      {id:"sep-pip",   name:"Pip-tazo 3.375g IV", detail:"Broad spectrum — give within 1h of sepsis recognition",       tier:"STAT",    category:"medication"},
      {id:"sep-vanc",  name:"Vancomycin",         detail:"25 mg/kg IV load — MRSA coverage, pharmacy to dose",         tier:"STAT",    category:"medication"},
      {id:"sep-ns",    name:"NS 30 mL/kg bolus",  detail:"Surviving Sepsis 2021 — 30 mL/kg crystalloid within 3h",     tier:"STAT",    category:"iv"},
      {id:"sep-o2",    name:"O₂ / SpO₂ monitor", detail:"Continuous; target SpO₂ >94%",                               tier:"STAT",    category:"monitoring"},
    ]
  },
  {
    id:"dyspnea", name:"Dyspnea / SOB", icon:"🫁", color:"rgba(59,158,255,0.1)", bd:"rgba(59,158,255,0.22)",
    orders:[
      {id:"dys-bmp",   name:"BMP",                detail:"Renal function, acidosis",                                    tier:"STAT",    category:"lab"},
      {id:"dys-cbc",   name:"CBC w/ diff",        detail:"Anemia, infection",                                           tier:"URGENT",  category:"lab"},
      {id:"dys-bnp",   name:"BNP",                detail:"Heart failure vs. other dyspnea — key discriminator",         tier:"STAT",    category:"lab"},
      {id:"dys-trop",  name:"Troponin (hsTnI)",   detail:"Cardiac etiology, demand ischemia",                          tier:"URGENT",  category:"lab"},
      {id:"dys-ddim",  name:"D-Dimer",            detail:"PE evaluation if PERC positive",                             tier:"URGENT",  category:"lab"},
      {id:"dys-abg",   name:"ABG",                detail:"Hypoxemia, hypercapnia, acid-base",                          tier:"STAT",    category:"lab"},
      {id:"dys-cxr",   name:"CXR PA/Lateral",     detail:"Effusion, pneumothorax, infiltrate, cardiomegaly",           tier:"STAT",    category:"imaging"},
      {id:"dys-ecg",   name:"12-lead ECG",        detail:"Arrhythmia, RV strain (PE), LBBB (HF)",                     tier:"STAT",    category:"monitoring"},
      {id:"dys-alb",   name:"Albuterol neb",      detail:"2.5mg/3mL — bronchospasm, asthma/COPD exacerbation",        tier:"URGENT",  category:"medication"},
      {id:"dys-o2",    name:"O₂ / SpO₂ monitor", detail:"Continuous; titrate to SpO₂ >94%",                           tier:"STAT",    category:"monitoring"},
    ]
  },
  {
    id:"ams", name:"Altered Mental Status", icon:"🧠", color:"rgba(155,109,255,0.1)", bd:"rgba(155,109,255,0.22)",
    orders:[
      {id:"ams-gluc",  name:"Point-of-care glucose", detail:"Immediately — hypoglycemia is the fastest fixable cause",  tier:"STAT",    category:"monitoring"},
      {id:"ams-bmp",   name:"BMP",                detail:"Electrolytes, glucose, BUN/Cr, osmolality",                  tier:"STAT",    category:"lab"},
      {id:"ams-cbc",   name:"CBC w/ diff",        detail:"Infection, anemia",                                           tier:"STAT",    category:"lab"},
      {id:"ams-lfts",  name:"LFTs + ammonia",     detail:"Hepatic encephalopathy",                                     tier:"URGENT",  category:"lab"},
      {id:"ams-tsh",   name:"TSH",                detail:"Hypothyroid/thyroid storm",                                   tier:"URGENT",  category:"lab"},
      {id:"ams-uds",   name:"Urine drug screen",  detail:"Qualitative toxicology panel",                               tier:"URGENT",  category:"lab"},
      {id:"ams-etoh",  name:"EtOH level",         detail:"Serum ethanol quantitative",                                  tier:"URGENT",  category:"lab"},
      {id:"ams-ua",    name:"UA w/ microscopy",   detail:"UTI — common precipitant in elderly",                        tier:"URGENT",  category:"lab"},
      {id:"ams-ct",    name:"CT head w/o contrast",detail:"Hemorrhage, mass effect, midline shift — non-contrast first",tier:"STAT",    category:"imaging"},
      {id:"ams-ecg",   name:"12-lead ECG",        detail:"Arrhythmia, prolonged QTc",                                  tier:"URGENT",  category:"monitoring"},
    ]
  },
  {
    id:"abdo", name:"Abdominal Pain", icon:"🩺", color:"rgba(0,229,192,0.08)", bd:"rgba(0,229,192,0.2)",
    orders:[
      {id:"abd-bmp",   name:"BMP",                detail:"Electrolytes, renal function, glucose",                      tier:"URGENT",  category:"lab"},
      {id:"abd-cbc",   name:"CBC w/ diff",        detail:"WBC — infection, perforation, ischemia",                    tier:"URGENT",  category:"lab"},
      {id:"abd-lfts",  name:"LFTs + lipase",      detail:"Hepatobiliary disease, pancreatitis",                       tier:"URGENT",  category:"lab"},
      {id:"abd-coag",  name:"Coagulation",        detail:"Liver disease, anticoagulation planning",                   tier:"ROUTINE", category:"lab"},
      {id:"abd-lac",   name:"Lactic acid",        detail:"Mesenteric ischemia — elevated in bowel ischemia",          tier:"URGENT",  category:"lab"},
      {id:"abd-bhcg",  name:"Urine hCG",          detail:"All reproductive-age females — ectopic pregnancy",          tier:"STAT",    category:"lab"},
      {id:"abd-ua",    name:"UA w/ microscopy",   detail:"Renal colic, UTI/pyelonephritis",                           tier:"URGENT",  category:"lab"},
      {id:"abd-ct",    name:"CT abd/pelvis w/ contrast",detail:"Gold standard for most abdominal pain etiologies",    tier:"URGENT",  category:"imaging"},
      {id:"abd-keto",  name:"Ketorolac 30mg IV",  detail:"First-line analgesia — reassess surgical abdomen carefully", tier:"URGENT",  category:"medication"},
      {id:"abd-zofran",name:"Ondansetron 4mg IV", detail:"Nausea/vomiting — does not mask surgical signs",            tier:"URGENT",  category:"medication"},
    ]
  },
  {
    id:"headache", name:"Headache / SAH Protocol", icon:"💢", color:"rgba(245,200,66,0.08)", bd:"rgba(245,200,66,0.2)",
    orders:[
      {id:"ha-bmp",    name:"BMP",                detail:"Electrolytes, renal function",                               tier:"URGENT",  category:"lab"},
      {id:"ha-cbc",    name:"CBC w/ diff",        detail:"Infection — meningitis workup",                             tier:"URGENT",  category:"lab"},
      {id:"ha-coag",   name:"Coagulation",        detail:"Before LP — thrombocytopenia check",                        tier:"URGENT",  category:"lab"},
      {id:"ha-ct",     name:"CT head w/o contrast",detail:"Non-contrast FIRST — r/o hemorrhage before LP",            tier:"STAT",    category:"imaging"},
      {id:"ha-ecg",    name:"12-lead ECG",        detail:"SAH causes QTc prolongation, T-wave changes",               tier:"URGENT",  category:"monitoring"},
      {id:"ha-keto",   name:"Ketorolac 30mg IV",  detail:"First-line analgesia for headache",                         tier:"URGENT",  category:"medication"},
      {id:"ha-zofran", name:"Ondansetron 4mg IV", detail:"Nausea — common with SAH, meningitis, migraine",            tier:"URGENT",  category:"medication"},
      {id:"ha-proc",   name:"Prochlorperazine 10mg IV",detail:"Migraine abortive — give diphenhydramine with IV route",tier:"URGENT", category:"medication"},
    ]
  },
  {
    id:"trauma", name:"Trauma", icon:"🚨", color:"rgba(255,107,107,0.12)", bd:"rgba(255,107,107,0.3)",
    orders:[
      {id:"tr-fast",   name:"FAST exam (bedside US)",detail:"Immediate — free fluid, hemopericardium, pneumothorax",   tier:"STAT",    category:"imaging"},
      {id:"tr-cxr",    name:"CXR portable",        detail:"Pneumothorax, hemothorax, widened mediastinum",             tier:"STAT",    category:"imaging"},
      {id:"tr-pelvis", name:"Pelvis x-ray",        detail:"Pelvic ring fracture — major source of hemorrhage",         tier:"STAT",    category:"imaging"},
      {id:"tr-bmp",    name:"BMP",                 detail:"Electrolytes, renal function, glucose",                     tier:"STAT",    category:"lab"},
      {id:"tr-cbc",    name:"CBC w/ diff",         detail:"Hemorrhage — serial H&H",                                  tier:"STAT",    category:"lab"},
      {id:"tr-coag",   name:"Coagulation + fibrinogen",detail:"Trauma-induced coagulopathy (TIC) — TEG if available", tier:"STAT",    category:"lab"},
      {id:"tr-tns",    name:"Type & Screen",       detail:"Anticipatory — active crossmatch if hemorrhage suspected",  tier:"STAT",    category:"lab"},
      {id:"tr-lac",    name:"Lactic acid",         detail:"Hemorrhagic shock marker",                                  tier:"STAT",    category:"lab"},
      {id:"tr-txa",    name:"TXA 1g IV",           detail:"Within 3h of injury — CRASH-2/CRASH-3 protocol",           tier:"STAT",    category:"iv"},
      {id:"tr-ns",     name:"NS or LR 1L bolus",  detail:"Permissive hypotension in penetrating trauma — SBP 80–90", tier:"STAT",    category:"iv"},
    ]
  },
  {
    id:"syncope", name:"Syncope Workup", icon:"⚡", color:"rgba(59,158,255,0.1)", bd:"rgba(59,158,255,0.22)",
    orders:[
      {id:"syn-ecg",   name:"12-lead ECG",        detail:"Immediately — Brugada, WPW, prolonged QTc, LBBB, HB",       tier:"STAT",    category:"monitoring"},
      {id:"syn-ortho", name:"Orthostatic vitals",  detail:"Supine, sitting, standing BP/HR — q2 min",                  tier:"STAT",    category:"monitoring"},
      {id:"syn-bmp",   name:"BMP",                detail:"Electrolytes (K, Mg), glucose, BUN",                        tier:"URGENT",  category:"lab"},
      {id:"syn-cbc",   name:"CBC w/ diff",        detail:"Anemia — common cause of syncope",                          tier:"URGENT",  category:"lab"},
      {id:"syn-trop",  name:"Troponin (hsTnI)",   detail:"Cardiac syncope, arrhythmia — serial",                     tier:"URGENT",  category:"lab"},
      {id:"syn-poc",   name:"Point-of-care glucose",detail:"Hypoglycemia — immediate bedside check",                   tier:"STAT",    category:"monitoring"},
      {id:"syn-bhcg",  name:"Urine hCG",          detail:"All reproductive-age females",                              tier:"STAT",    category:"lab"},
      {id:"syn-cxr",   name:"CXR",                detail:"Cardiomegaly, effusion",                                    tier:"ROUTINE", category:"imaging"},
    ]
  },
];

// ── Lab / Imaging / Medication quick-add data (unchanged from prior version) ──
const LABS = {
  "Chemistries":[
    {name:"BMP",           detail:"Basic metabolic panel — Na, K, Cl, CO₂, BUN, Cr, glucose",            tier:"STAT"   },
    {name:"CMP",           detail:"Comprehensive metabolic panel — includes LFTs",                        tier:"URGENT" },
    {name:"Lactic acid",   detail:"Venous lactate — sepsis/shock screening",                              tier:"STAT"   },
    {name:"LFTs",          detail:"AST, ALT, ALP, total bilirubin, albumin",                             tier:"URGENT" },
    {name:"Lipase",        detail:"Serum lipase — pancreatitis workup",                                   tier:"URGENT" },
    {name:"Magnesium",     detail:"Serum magnesium level",                                                tier:"URGENT" },
  ],
  "Hematology":[
    {name:"CBC w/ diff",   detail:"Complete blood count with differential",                               tier:"STAT"   },
    {name:"Type & Screen", detail:"ABO/Rh typing + antibody screen — before transfusion",                tier:"URGENT" },
    {name:"Type & Cross",  detail:"Full crossmatch — active or imminent transfusion",                    tier:"STAT"   },
    {name:"Coagulation",   detail:"PT, PTT, INR, fibrinogen",                                            tier:"URGENT" },
    {name:"D-Dimer",       detail:"Quantitative — PE/DVT workup",                                        tier:"URGENT" },
  ],
  "Cardiac / Critical":[
    {name:"Troponin (hsTnI)",detail:"High-sensitivity, serial 0h/3h or 0h/1h protocol",                  tier:"STAT"   },
    {name:"BNP",           detail:"B-type natriuretic peptide — HF, dyspnea",                            tier:"URGENT" },
    {name:"ABG",           detail:"Arterial blood gas — pH, pO₂, pCO₂, HCO₃",                          tier:"STAT"   },
    {name:"Blood cultures",detail:"x2 sets peripheral — before antibiotics if possible",                 tier:"STAT"   },
  ],
  "Urine / Tox":[
    {name:"UA w/ microscopy",detail:"Urinalysis with microscopy and reflex culture",                     tier:"URGENT" },
    {name:"Urine drug screen",detail:"Qualitative immunoassay panel",                                    tier:"URGENT" },
    {name:"Urine hCG",     detail:"Qualitative pregnancy test",                                          tier:"STAT"   },
    {name:"EtOH level",    detail:"Serum ethanol quantitative",                                          tier:"URGENT" },
    {name:"Acetaminophen", detail:"Serum level — toxicology, overdose workup",                           tier:"URGENT" },
  ],
};
const MEDS = {
  "Pain / Sedation":[
    {name:"Ketorolac",           detail:"30mg IV x1 (15mg if >65, renal impairment, weight <50kg)",      tier:"URGENT" },
    {name:"Morphine sulfate",    detail:"4mg IV q4h PRN moderate–severe pain",                           tier:"URGENT" },
    {name:"Acetaminophen",       detail:"1g IV/PO q8h (max 3g/day — 2g if hepatic risk)",               tier:"URGENT" },
    {name:"Fentanyl",            detail:"1 mcg/kg IV PRN procedural pain (titrate)",                    tier:"URGENT" },
    {name:"Ibuprofen",           detail:"600mg PO q8h with food",                                        tier:"ROUTINE"},
  ],
  "Antiemetics":[
    {name:"Ondansetron",         detail:"4mg IV/ODT q8h PRN nausea/vomiting",                           tier:"URGENT" },
    {name:"Metoclopramide",      detail:"10mg IV q8h PRN (also useful for migraine)",                    tier:"URGENT" },
    {name:"Prochlorperazine",    detail:"10mg IV/IM q6h PRN (give diphenhydramine with IV route)",       tier:"URGENT" },
  ],
  "Antibiotics":[
    {name:"Ceftriaxone",         detail:"1g IV q24h (2g for meningitis, CNS infection)",                 tier:"STAT"   },
    {name:"Pip-tazo",            detail:"3.375g IV q8h — broad gram-neg/anaerobic (adjust for renal)",   tier:"STAT"   },
    {name:"Vancomycin",          detail:"25 mg/kg IV load, then pharmacy dosing (MRSA coverage)",        tier:"STAT"   },
    {name:"Azithromycin",        detail:"500mg IV/PO daily x5 days (CAP — atypical coverage)",          tier:"URGENT" },
    {name:"Metronidazole",       detail:"500mg IV q8h (anaerobic coverage, C. diff PO 500mg TID)",      tier:"URGENT" },
  ],
  "Cardiac / ACS":[
    {name:"Aspirin 325mg",       detail:"PO — chew for suspected ACS",                                   tier:"STAT"   },
    {name:"Nitroglycerin SL",    detail:"0.4mg SL q5min x3 PRN chest pain",                             tier:"STAT"   },
    {name:"Metoprolol tartrate", detail:"5mg IV q5min x3 (rate control — avoid if HF/shock)",           tier:"URGENT" },
    {name:"Amiodarone",          detail:"150mg IV over 10 min, then 1mg/min x6h (refractory AF/VT)",    tier:"STAT"   },
  ],
  "Respiratory":[
    {name:"Albuterol",           detail:"2.5mg/3mL neb q20 min x3, then q4h PRN",                       tier:"STAT"   },
    {name:"Ipratropium",         detail:"0.5mg/2.5mL neb q6h — combine with albuterol",                 tier:"URGENT" },
    {name:"Methylprednisolone",  detail:"125mg IV q6h (acute asthma, severe COPD exacerbation)",        tier:"URGENT" },
    {name:"Epi 1:1000 IM",       detail:"0.3–0.5mg IM lateral thigh — anaphylaxis 1st line",            tier:"STAT"   },
  ],
};
const IV_STRAT = {
  "Crystalloids":[
    {name:"NS 1L bolus",         detail:"Normal saline 1L IV over 30–60 min",                            tier:"STAT"   },
    {name:"LR 1L bolus",         detail:"Lactated Ringer's 1L IV over 30–60 min",                       tier:"STAT"   },
    {name:"NS @ 125 mL/hr",      detail:"Normal saline maintenance at 125 mL/hr",                       tier:"URGENT" },
    {name:"LR @ 125 mL/hr",      detail:"Lactated Ringer's maintenance at 125 mL/hr",                   tier:"URGENT" },
  ],
  "Blood Products":[
    {name:"pRBC 1 unit",         detail:"Over 2–4 hrs (type & screen/cross first)",                      tier:"URGENT" },
    {name:"FFP 2 units",         detail:"Coagulopathy, warfarin reversal",                               tier:"URGENT" },
    {name:"Platelets 1 pool",    detail:"Over 30–60 min (plt <50k with active bleed)",                   tier:"URGENT" },
    {name:"4-factor PCC",        detail:"25–50 units/kg — warfarin reversal + life-threatening bleed",   tier:"STAT"   },
    {name:"TXA 1g IV",           detail:"Over 10 min — trauma within 3h, major hemorrhage",             tier:"STAT"   },
  ],
  "Vasopressors":[
    {name:"Norepinephrine",      detail:"0.01–0.5 mcg/kg/min IV — septic shock 1st line vasopressor",    tier:"STAT"   },
    {name:"Epinephrine",         detail:"0.01–0.5 mcg/kg/min IV — cardiogenic, anaphylaxis, refractory", tier:"STAT"   },
    {name:"Vasopressin",         detail:"0.03–0.04 units/min IV — add-on to norepinephrine",             tier:"STAT"   },
    {name:"Dopamine",            detail:"5–20 mcg/kg/min IV — cardiogenic/distributive",                 tier:"STAT"   },
    {name:"Push-dose epi",       detail:"10–20 mcg IV bolus q2–5 min — peri-arrest, procedural hypotension",tier:"STAT"},
  ],
};
const IMAGING_ORDERS=[
  {name:"CXR PA/Lateral",       detail:"Chest x-ray PA and lateral views",                              tier:"URGENT", category:"imaging"},
  {name:"CXR portable",         detail:"Portable chest x-ray — unstable patient",                       tier:"STAT",   category:"imaging"},
  {name:"CT head w/o",          detail:"Non-contrast — headache, AMS, trauma",                          tier:"STAT",   category:"imaging"},
  {name:"CT angio chest (PE)",  detail:"PE protocol — r/o pulmonary embolism",                          tier:"STAT",   category:"imaging"},
  {name:"CT abd/pelvis",        detail:"With contrast — abdominal pain, appendicitis",                  tier:"URGENT", category:"imaging"},
  {name:"CT angio abdomen",     detail:"Aorta protocol — r/o AAA, dissection",                         tier:"STAT",   category:"imaging"},
  {name:"US FAST exam",         detail:"Bedside ultrasound — trauma, free fluid",                       tier:"STAT",   category:"imaging"},
  {name:"US abdomen",           detail:"Formal RUQ / hepatobiliary",                                    tier:"URGENT", category:"imaging"},
  {name:"US pelvis",            detail:"Trans-abdominal and transvaginal — pelvic pain, ectopic",       tier:"URGENT", category:"imaging"},
  {name:"Echo bedside",         detail:"POCUS cardiac — effusion, function, tamponade",                 tier:"URGENT", category:"imaging"},
  {name:"MRI brain",            detail:"Stroke, MS, encephalitis — with and without contrast",          tier:"URGENT", category:"imaging"},
];
// Flat array of all searchable orders — searched on every keystroke
const ALL_SEARCHABLE = [
  ...Object.values(LABS).flat().map(o=>({...o,category:"lab",    icon:"🧪"})),
  ...Object.values(MEDS).flat().map(o=>({...o,category:"medication",icon:"💊"})),
  ...Object.values(IV_STRAT).flat().map(o=>({...o,category:"iv",   icon:"💧"})),
  ...IMAGING_ORDERS.map(o=>({...o,icon:"🔬"})),
].filter(Boolean);

const CONSULTS=[
  "Cardiology","Pulmonology","Gastroenterology","Nephrology","Neurology","Neurosurgery",
  "General Surgery","Vascular Surgery","Orthopedics","Urology","OB/GYN","Ophthalmology",
  "ENT","Psychiatry","Social Work","Infectious Disease","Hematology / Oncology",
  "Palliative Care","Case Management","Pharmacy",
];
const CATS=[{id:"sets",label:"Order Sets",icon:"⊞"},{id:"all",label:"Add-ons",icon:"⊕"},{id:"labs",label:"Labs",icon:"🧪"},{id:"meds",label:"Meds",icon:"💊"},{id:"iv",label:"IV",icon:"💧"},{id:"imaging",label:"Imaging",icon:"🔬"},{id:"consult",label:"Consult",icon:"👤"}];

// ── Weight-based dosing ───────────────────────────────────────────────────────
// ISMP: weight-based dosing errors are among the most common preventable
// medication errors. Calculate at the point of ordering, not after.
const WEIGHT_DRUGS = {
  "fentanyl":             { dose:1,    unit:"mcg/kg", max:100,   label:"Fentanyl"              },
  "ketamine (sub-diss.)":{  dose:0.3,  unit:"mg/kg",  max:35,    label:"Ketamine (sub-dissoc.)" },
  "ketamine":             { dose:1.5,  unit:"mg/kg",  max:200,   label:"Ketamine (procedural)"  },
  "vancomycin":           { dose:25,   unit:"mg/kg",  max:3000,  label:"Vancomycin"             },
  "heparin unfractionated":{ dose:80,  unit:"units/kg",max:10000,label:"Heparin UFH"            },
  "tpa (alteplase)":      { dose:0.9,  unit:"mg/kg",  max:90,    label:"tPA (Alteplase)"        },
  "methylprednisolone":   { dose:1,    unit:"mg/kg",  max:125,   label:"Methylprednisolone"     },
  "lorazepam":            { dose:0.05, unit:"mg/kg",  max:4,     label:"Lorazepam"              },
  "magnesium sulfate":    { dose:50,   unit:"mg/kg",  max:2000,  label:"Magnesium sulfate"      },
  "succinylcholine":      { dose:1.5,  unit:"mg/kg",  max:200,   label:"Succinylcholine"        },
  "rocuronium":           { dose:1.2,  unit:"mg/kg",  max:200,   label:"Rocuronium"             },
  "etomidate":            { dose:0.3,  unit:"mg/kg",  max:30,    label:"Etomidate"              },
  "propofol":             { dose:1.5,  unit:"mg/kg",  max:200,   label:"Propofol"               },
};

// ── Renal dose adjustment ─────────────────────────────────────────────────────
// ASHP/KDIGO guidelines. eGFR thresholds below which warnings trigger.
const RENAL_DRUGS = {
  "ketorolac":      { gfr:30,  sev:"high",   warn:"Avoid if eGFR <30 — significant risk of AKI"                          },
  "ibuprofen":      { gfr:30,  sev:"high",   warn:"Avoid NSAIDs if eGFR <30 — AKI, fluid retention, hyperkalemia"         },
  "nitrofurantoin": { gfr:45,  sev:"high",   warn:"Avoid if eGFR <45 — inadequate urinary concentration, peripheral neuropathy"},
  "pip-tazo":       { gfr:40,  sev:"mod",    warn:"Reduce to 2.25g IV q8h if eGFR 20–40; 2.25g q12h if eGFR <20"         },
  "vancomycin":     { gfr:60,  sev:"mod",    warn:"Extended interval dosing required — pharmacy to dose by AUC/MIC levels" },
  "metronidazole":  { gfr:10,  sev:"low",    warn:"Caution in severe renal failure — hydroxy metabolite accumulates"       },
  "ciprofloxacin":  { gfr:30,  sev:"mod",    warn:"Reduce to 250–500mg q24h if eGFR <30"                                  },
  "cephalexin":     { gfr:30,  sev:"low",    warn:"Reduce frequency if eGFR <30 (q12h vs q6h)"                            },
  "enoxaparin":     { gfr:30,  sev:"high",   warn:"Reduce to once-daily dosing if eGFR <30; avoid if eGFR <15"            },
  "morphine sulfate":{ gfr:30, sev:"high",   warn:"M6G metabolite accumulates in CKD — use hydromorphone instead"         },
  "hydromorphone":  { gfr:30,  sev:"mod",    warn:"Caution — active metabolite accumulates in CKD; reduce dose/frequency"  },
  "gabapentin":     { gfr:60,  sev:"mod",    warn:"Dose reduction required at all eGFR levels below 60"                   },
  "metformin":      { gfr:30,  sev:"high",   warn:"Contraindicated if eGFR <30 — lactic acidosis risk"                    },
  "spironolactone": { gfr:30,  sev:"high",   warn:"Avoid if eGFR <30 — hyperkalemia risk"                                 },
};
const RENAL_SEV_COLOR = { high:"var(--npi-coral)", mod:"var(--npi-orange)", low:"var(--npi-gold)" };

function calcWeightDose(name, weightKg) {
  if (!weightKg || isNaN(weightKg)) return null;
  const key = Object.keys(WEIGHT_DRUGS).find(k => name.toLowerCase().includes(k));
  if (!key) return null;
  const cfg = WEIGHT_DRUGS[key];
  const calc = Math.min(cfg.dose * weightKg, cfg.max).toFixed(0);
  return `${cfg.label} ${weightKg}kg → ${calc} ${cfg.unit.split("/")[0]} (${cfg.dose} ${cfg.unit}, max ${cfg.max})`;
}

// Cockcroft-Gault simplified (uses standard 70kg body weight denominator —
// provider can enter actual weight in creatinine calculator for precision)
function eGFRcalc(age, sex, cr) {
  const crNum = parseFloat(cr);
  if (!age || !crNum || isNaN(crNum) || crNum <= 0) return null;
  const raw = ((140 - Number(age)) * 70) / (72 * crNum);
  const adj = (String(sex).toLowerCase().includes("f")) ? raw * 0.85 : raw;
  return Math.round(Math.max(1, adj));
}

function ckdStage(gfr) {
  if (!gfr) return null;
  if (gfr >= 90) return { label:"G1 (Normal)", color:"var(--npi-teal)"   };
  if (gfr >= 60) return { label:"G2 (Mild)",   color:"var(--npi-teal)"   };
  if (gfr >= 45) return { label:"G3a",          color:"var(--npi-gold)"   };
  if (gfr >= 30) return { label:"G3b",          color:"var(--npi-orange)" };
  if (gfr >= 15) return { label:"G4 (Severe)",  color:"var(--npi-coral)"  };
  return                 { label:"G5/ESRD",      color:"var(--npi-coral)"  };
}

function getRenalWarn(name, gfr) {
  if (!gfr || gfr >= 90) return null;
  const key = Object.keys(RENAL_DRUGS).find(k => name.toLowerCase().includes(k));
  if (!key) return null;
  const cfg = RENAL_DRUGS[key];
  return gfr < cfg.gfr ? { warn: cfg.warn, color: RENAL_SEV_COLOR[cfg.sev] || RENAL_SEV_COLOR.mod } : null;
}

// ── Status display helpers ────────────────────────────────────────────────────
const STATUS_CFG = {
  unsigned:  { dot:"var(--npi-orange)", label:"Awaiting signature",    pulse:false },
  sent:      { dot:"var(--npi-blue)",   label:"Sent — pending result", pulse:false },
  resulted:  { dot:"var(--npi-teal)",   label:"Resulted",              pulse:false },
  critical:  { dot:"var(--npi-coral)",  label:"CRITICAL — review now", pulse:true  },
};

// ── OrdersPanel ───────────────────────────────────────────────────────────────
export default function OrdersPanel({ patientName, allergies, chiefComplaint, patientAge, patientSex, patientWeight }) {
  const [bundle,        setBundle]        = useState(null);
  const [checked,       setChecked]       = useState(new Set());
  const [queue,         setQueue]         = useState([]);
  const [signed,        setSigned]        = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [busySign,      setBusySign]      = useState(false);
  const [search,        setSearch]        = useState("");
  const [cat,           setCat]           = useState("sets");
  const [loadedSet,     setLoadedSet]     = useState(null);
  const searchRef   = useRef(null);
  const [editingId,     setEditingId]     = useState(null);
  const [editDraft,     setEditDraft]     = useState({});
  const [ackdWarn,      setAckdWarn]      = useState(new Set());
  const [customName,    setCustomName]    = useState("");
  const [customTier,    setCustomTier]    = useState("URGENT");
  // Remaining recommendations state
  const [creatinine,    setCreatinine]    = useState("");
  const [orderStatuses, setOrderStatuses] = useState({});   // { [orderId]: 'sent'|'resulted'|'critical' }
  const [recentlySigned,setRecentlySigned]= useState([]);   // repeat-order prevention [{name, id, signedAt}]

  // Derived clinical values
  const workingWeight = parseFloat(patientWeight) || null;
  const eGFR          = useMemo(() => eGFRcalc(patientAge, patientSex, creatinine), [patientAge, patientSex, creatinine]);
  const ckd           = useMemo(() => ckdStage(eGFR), [eGFR]);

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => { if (chiefComplaint) generateBundle(); }, []); // eslint-disable-line

  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCat("all");
        setTimeout(() => searchRef.current?.focus(), 40);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  // ── Callbacks ─────────────────────────────────────────────────────────────
  const generateBundle = useCallback(async () => {
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt:`You are an ED clinical decision support AI.
Patient: ${patientName||"Unknown"}, age ${patientAge||"?"}, sex ${patientSex||"?"}.${workingWeight ? ` Weight: ${workingWeight}kg.` : ""}${eGFR ? ` eGFR: ~${eGFR} mL/min.` : ""}
Chief complaint: "${chiefComplaint||"not specified"}". Allergies: ${allergies?.length?allergies.join(", "):"NKDA"}.
Generate an evidence-based ED order bundle. Return ONLY valid JSON:
{"diagnosis":"Brief working dx","confidence":85,"suppressed":["reason for omitted items"],
"orders":[{"id":"o1","name":"Order name","detail":"Dose/detail","tier":"STAT","category":"lab"}]}
tier: STAT|URGENT|ROUTINE. category: lab|medication|iv|imaging|procedure|consult|monitoring.
Include 8-12 orders across relevant categories.${workingWeight ? " Include weight-based doses where applicable." : ""}${eGFR && eGFR < 60 ? ` Patient has reduced renal function (eGFR ~${eGFR}) — adjust medication doses accordingly.` : ""}`,
        response_json_schema:{type:"object",properties:{
          diagnosis:{type:"string"},confidence:{type:"number"},
          suppressed:{type:"array",items:{type:"string"}},
          orders:{type:"array",items:{type:"object",properties:{
            id:{type:"string"},name:{type:"string"},detail:{type:"string"},tier:{type:"string"},category:{type:"string"}
          }}}
        }}
      });
      const parsed = typeof result==="object" ? result : JSON.parse(String(result).replace(/```json|```/g,"").trim());
      setBundle(parsed);
      setChecked(new Set((parsed.orders||[]).map(o=>o.id)));
    } catch { toast.error("Could not generate order bundle."); }
    finally { setLoading(false); }
  }, [chiefComplaint, patientAge, patientSex, allergies, patientName, workingWeight, eGFR]);

  const toggleCheck = useCallback((id) =>
    setChecked(prev => { const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; }), []);

  const enqueue = useCallback((orders) => {
    const now = Date.now();
    const toAdd = orders
      .filter(o => !queue.find(q => q.id === o.id))
      .map(o => ({ ...o, t: o.t || now }));
    if (!toAdd.length) { toast.info("All orders already in queue."); return 0; }
    // Repeat-order prevention (Ash 2007: order duplication is a top CPOE error)
    const TWO_HRS = 7200000;
    toAdd.forEach(o => {
      const prev = recentlySigned.find(r =>
        r.name.toLowerCase() === o.name.toLowerCase() && (now - r.signedAt) < TWO_HRS
      );
      if (prev) toast.warning(`${o.name} was already signed ${elapsed(prev.signedAt)} this session`, { duration:5000 });
    });
    setQueue(p => [...p, ...toAdd]);
    setSigned(false);
    return toAdd.length;
  }, [queue, recentlySigned]);

  const loadOrderSet = useCallback((set) => {
    const n = enqueue(set.orders);
    if (n > 0) {
      setLoadedSet(set.id);
      toast.success(`${set.name} — ${n} orders added. Review and remove anything not indicated.`);
    }
  }, [enqueue]);

  const acceptChecked = useCallback(() => {
    if (!bundle) return;
    const n = enqueue(bundle.orders.filter(o => checked.has(o.id)));
    if (n > 0) toast.success(`${n} orders added to queue.`);
  }, [bundle, checked, enqueue]);

  const quickAdd = useCallback((name, detail, tier, category) => {
    const id = `qa-${name.replace(/\s/g,"-").toLowerCase()}`;
    const warn = getAllergyWarning(name, allergies);
    if (warn) toast.warning(`${name} — ${warn}`, { duration:6000 });
    enqueue([{ id, name, detail, tier:tier||"URGENT", category:category||"lab", allergyWarn:!!warn }]);
  }, [enqueue, allergies]);

  const signQueue = useCallback(() => {
    setBusySign(true);
    setTimeout(() => {
      setSigned(true); setBusySign(false);
      // Initialize all orders with 'sent' status
      const statuses = {};
      queue.forEach(o => { statuses[o.id] = "sent"; });
      setOrderStatuses(statuses);
      // Track for repeat-order prevention
      setRecentlySigned(prev => [
        ...prev,
        ...queue.map(o => ({ name:o.name, id:o.id, signedAt:Date.now() }))
      ]);
      toast.success(`${queue.length} order${queue.length!==1?"s":""} signed and transmitted.`);
    }, 500);
  }, [queue]);

  const removeFromQueue   = useCallback((id) => { setQueue(p=>p.filter(x=>x.id!==id)); setSigned(false); }, []);
  const startEdit         = useCallback((ord) => { setEditingId(ord.id); setEditDraft({ detail:ord.detail||"", tier:ord.tier, category:ord.category }); }, []);
  const saveEdit          = useCallback((id)  => { setQueue(p=>p.map(o=>o.id===id?{...o,...editDraft}:o)); setEditingId(null); setSigned(false); }, [editDraft]);
  const acknowledgeWarning= useCallback((id)  => setAckdWarn(p=>new Set([...p,id])), []);
  const setOrderStatus    = useCallback((id, status) => setOrderStatuses(p=>({...p,[id]:status})), []);
  const addCustomOrder    = useCallback(() => {
    if (!customName.trim()) return;
    quickAdd(customName.trim(), "Custom order — specify details", customTier, "procedure");
    setCustomName("");
  }, [customName, customTier, quickAdd]);

  // Derived
  const sortedQueue = useMemo(() => {
    const order = { STAT:0, URGENT:1, ROUTINE:2 };
    return [...queue].sort((a,b) => (order[a.tier]??3) - (order[b.tier]??3));
  }, [queue]);
  const queuedIds = useMemo(() => new Set(queue.map(o=>o.id)), [queue]);
  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q || cat !== "all") return [];
    return ALL_SEARCHABLE
      .filter(o => o.name.toLowerCase().includes(q) || o.detail.toLowerCase().includes(q))
      .slice(0, 10);
  }, [search, cat]);
  const statN    = queue.filter(o=>o.tier==="STAT").length;
  const urgentN  = queue.filter(o=>o.tier==="URGENT").length;
  const routineN = queue.filter(o=>o.tier==="ROUTINE").length;

  // ── Sub-components (closures — access weight/eGFR/queuedIds) ─────────────
  function SecLabel({ children }) {
    return <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:"var(--npi-txt4)",margin:"12px 0 6px"}}>{children}</div>;
  }

  function OrderRow({ item, catIcon, onClick }) {
    const inQueue    = queuedIds.has(`qa-${item.name.replace(/\s/g,"-").toLowerCase()}`);
    const allergyW   = getAllergyWarning(item.name, allergies);
    const weightDose = workingWeight ? calcWeightDose(item.name, workingWeight) : null;
    const renalW     = eGFR ? getRenalWarn(item.name, eGFR) : null;
    return (
      <div className="ord-row" onClick={!inQueue ? onClick : undefined}
        style={{cursor:inQueue?"default":"pointer",padding:"8px 10px",borderRadius:7,display:"flex",flexDirection:"column",gap:3,background:inQueue?"rgba(0,229,192,.05)":allergyW?"rgba(255,107,107,.05)":renalW?"rgba(255,107,107,.04)":"rgba(255,255,255,.03)",border:`1px solid ${inQueue?"rgba(0,229,192,.2)":allergyW||renalW?"rgba(255,107,107,.25)":"rgba(255,255,255,.07)"}`,transition:"all .12s",marginBottom:4,opacity:inQueue?.7:1}}>
        <div style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:12,flexShrink:0}}>{catIcon}</span>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:12,fontWeight:600,color:inQueue?"var(--npi-teal)":allergyW?"var(--npi-coral)":"var(--npi-txt)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</div>
            <div style={{fontSize:10,color:"var(--npi-txt4)",lineHeight:1.4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{allergyW||item.detail}</div>
          </div>
          {inQueue ? <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--npi-teal)",flexShrink:0}}>✓ queued</span> : <TierBadge tier={item.tier}/>}
        </div>
        {weightDose && !inQueue && (
          <div style={{display:"flex",alignItems:"flex-start",gap:5,padding:"4px 7px",borderRadius:5,background:"rgba(59,158,255,.08)",border:"1px solid rgba(59,158,255,.2)",marginLeft:19}}>
            <span style={{fontSize:9,color:"var(--npi-blue)"}}>⚖</span>
            <span style={{fontSize:10,color:"var(--npi-blue)",fontFamily:"'JetBrains Mono',monospace",lineHeight:1.4}}>{weightDose}</span>
          </div>
        )}
        {renalW && !inQueue && (
          <div style={{display:"flex",alignItems:"flex-start",gap:5,padding:"4px 7px",borderRadius:5,background:`${renalW.color}0d`,border:`1px solid ${renalW.color}30`,marginLeft:19}}>
            <span style={{fontSize:9,color:renalW.color}}>🫘</span>
            <span style={{fontSize:10,color:renalW.color,lineHeight:1.4}}>{renalW.warn}</span>
          </div>
        )}
      </div>
    );
  }

  // ── Clinical context bar ──────────────────────────────────────────────────
  function renderContextBar() {
    const hasData = workingWeight || eGFR || allergies?.length;
    if (!hasData && !creatinine) return null;
    return (
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:8,background:"rgba(8,22,40,.7)",border:"1px solid rgba(26,53,85,.5)",flexWrap:"wrap",flexShrink:0}}>
        {workingWeight && (
          <div style={{display:"flex",alignItems:"center",gap:4}}>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:"var(--npi-txt4)",letterSpacing:1,textTransform:"uppercase"}}>Wt</span>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:700,color:"var(--npi-blue)"}}>{workingWeight} kg</span>
          </div>
        )}
        {workingWeight && <div style={{width:1,height:12,background:"rgba(42,77,114,.5)"}}/>}
        <div style={{display:"flex",alignItems:"center",gap:5}}>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:"var(--npi-txt4)",letterSpacing:1,textTransform:"uppercase"}}>Cr</span>
          <input value={creatinine} onChange={e=>setCreatinine(e.target.value)} placeholder="—" type="number" step="0.1" min="0" max="20"
            style={{width:40,background:"transparent",border:"none",borderBottom:"1px solid rgba(42,77,114,.5)",outline:"none",color:"var(--npi-txt)",fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:700,textAlign:"center",padding:"1px 2px"}}/>
          <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,color:"var(--npi-txt4)"}}>mg/dL</span>
        </div>
        {eGFR && (
          <>
            <div style={{width:1,height:12,background:"rgba(42,77,114,.5)"}}/>
            <div style={{display:"flex",alignItems:"center",gap:4}}>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:"var(--npi-txt4)",letterSpacing:1,textTransform:"uppercase"}}>eGFR</span>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:700,color:ckd?.color}}>{eGFR}</span>
              <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,color:"var(--npi-txt4)"}}>mL/min</span>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:ckd?.color,background:`${ckd?.color}18`,border:`1px solid ${ckd?.color}30`,borderRadius:4,padding:"1px 5px"}}>{ckd?.label}</span>
            </div>
          </>
        )}
        {allergies?.length > 0 && (
          <>
            <div style={{flex:1}}/>
            <div style={{display:"flex",alignItems:"center",gap:4}}>
              <span style={{fontSize:9}}>⚠️</span>
              <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,fontWeight:600,color:"var(--npi-coral)"}}>{allergies.join(", ")}</span>
            </div>
          </>
        )}
      </div>
    );
  }

  // ── renderCategoryContent ─────────────────────────────────────────────────
  function renderCategoryContent() {
    if (cat==="sets") {
      return (
        <div>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11.5,color:"var(--npi-txt3)",lineHeight:1.6,marginBottom:12,padding:"8px 10px",background:"rgba(59,158,255,.05)",border:"1px solid rgba(59,158,255,.14)",borderRadius:7}}>
            One click loads the complete set into the queue. Review and remove anything not indicated — then sign.
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {ORDER_SETS.map(set=>{
              const alreadyIn=set.orders.every(o=>queue.find(q=>q.id===o.id));
              return (
                <div key={set.id}
                  style={{borderRadius:9,border:`1px solid ${set.bd}`,background:set.color,padding:"10px 12px",cursor:alreadyIn?"default":"pointer",opacity:alreadyIn?.6:1}}
                  onClick={()=>!alreadyIn&&loadOrderSet(set)}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:16}}>{set.icon}</span>
                    <div style={{flex:1}}>
                      <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:13,color:"var(--npi-txt)"}}>{set.name}</div>
                      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--npi-txt4)",marginTop:2}}>
                        {set.orders.length} orders · {set.orders.filter(o=>o.tier==="STAT").length} STAT · {set.orders.filter(o=>o.tier==="URGENT").length} URGENT
                      </div>
                    </div>
                    {alreadyIn ? <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--npi-teal)"}}>✓ loaded</span>
                               : <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--npi-txt3)"}}>+ Load all →</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    const ALL_CHIPS=[
      {n:"CBC w/ diff",c:"lab"},{n:"BMP",c:"lab"},{n:"Troponin",c:"lab"},{n:"Lactate",c:"lab"},
      {n:"Blood cultures",c:"lab"},{n:"UA",c:"lab"},{n:"CXR",c:"imaging"},{n:"CT head",c:"imaging"},
      {n:"US FAST",c:"imaging"},{n:"Ondansetron 4mg IV",c:"medication"},{n:"Ketorolac 30mg IV",c:"medication"},
      {n:"NS 1L bolus",c:"iv"},{n:"LR 1L bolus",c:"iv"},{n:"Norepinephrine",c:"iv"},
    ];

    if (cat==="all") {
      const chips=search?ALL_CHIPS.filter(c=>c.n.toLowerCase().includes(search.toLowerCase())):ALL_CHIPS;
      return (
        <>
          <div style={{display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",borderRadius:9,padding:"8px 11px",marginBottom:8}}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="5.5" cy="5.5" r="4" stroke="rgba(255,255,255,.3)" strokeWidth="1.3"/><line x1="8.8" y1="8.8" x2="12" y2="12" stroke="rgba(255,255,255,.3)" strokeWidth="1.3" strokeLinecap="round"/></svg>
            <input ref={searchRef} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search all orders… (⌘K)"
              onKeyDown={e=>{
                if (e.key==="Escape"){ setSearch(""); searchRef.current?.blur(); }
                if (e.key==="Enter" && search.trim()){
                  const match=ALL_CHIPS.find(c=>c.n.toLowerCase().includes(search.toLowerCase()));
                  quickAdd(match?match.n:search, match?"Quick add — verify dose/detail":"Custom order","URGENT",match?match.c:"procedure");
                  setSearch("");
                }
              }}
              style={{background:"none",border:"none",outline:"none",color:"var(--npi-txt)",fontSize:12,flex:1,fontFamily:"'DM Sans',sans-serif"}}/>
            {search&&<button onClick={()=>setSearch("")} style={{background:"none",border:"none",color:"var(--npi-txt4)",cursor:"pointer",fontSize:13}}>✕</button>}
          </div>
          {searchResults.length > 0 ? (
            <div style={{display:"flex",flexDirection:"column",gap:3,marginTop:4}}>
              {searchResults.map(item=>{
                const inQ=queuedIds.has(`qa-${item.name.replace(/\s/g,"-").toLowerCase()}`);
                const wDose=workingWeight?calcWeightDose(item.name,workingWeight):null;
                const rWarn=eGFR?getRenalWarn(item.name,eGFR):null;
                return (
                  <div key={item.name} className="ord-row" onClick={!inQ?()=>quickAdd(item.name,item.detail,item.tier,item.category):undefined}
                    style={{cursor:inQ?"default":"pointer",padding:"7px 10px",borderRadius:7,display:"flex",flexDirection:"column",gap:3,background:inQ?"rgba(0,229,192,.04)":"rgba(255,255,255,.03)",border:`1px solid ${inQ?"rgba(0,229,192,.18)":rWarn?"rgba(255,107,107,.2)":"rgba(255,255,255,.08)"}`,transition:"all .12s"}}>
                    <div style={{display:"flex",alignItems:"center",gap:7}}>
                      <span style={{fontSize:12,flexShrink:0}}>{item.icon}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12,fontWeight:600,color:inQ?"var(--npi-teal)":"var(--npi-txt)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</div>
                        <div style={{fontSize:10,color:"var(--npi-txt4)",lineHeight:1.4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.detail}</div>
                      </div>
                      {inQ?<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--npi-teal)"}}>✓</span>:<TierBadge tier={item.tier}/>}
                    </div>
                    {wDose&&!inQ&&<div style={{fontSize:9,color:"var(--npi-blue)",marginLeft:19,fontFamily:"'JetBrains Mono',monospace"}}>⚖ {wDose}</div>}
                    {rWarn&&!inQ&&<div style={{fontSize:9,color:rWarn.color,marginLeft:19}}>🫘 {rWarn.warn}</div>}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
              {chips.map(c=>(<button key={c.n} className="ord-chip" onClick={()=>quickAdd(c.n,"Quick add — verify dose/detail","URGENT",c.c)}>{c.n}</button>))}
              {search&&!chips.length&&(<button className="ord-chip" onClick={()=>{quickAdd(search,"Custom order","ROUTINE","procedure");setSearch("");}}>+ Add "{search}"</button>)}
            </div>
          )}
          <div style={{marginTop:14,paddingTop:12,borderTop:"1px solid rgba(255,255,255,.07)"}}>
            <SecLabel>Custom order</SecLabel>
            <div style={{display:"flex",gap:6}}>
              <input value={customName} onChange={e=>setCustomName(e.target.value)} placeholder="Order name / instruction…"
                onKeyDown={e=>{ if(e.key==="Enter") addCustomOrder(); }}
                style={{flex:1,background:"rgba(14,37,68,.7)",border:"1px solid rgba(26,53,85,.55)",borderRadius:8,padding:"7px 10px",color:"var(--npi-txt)",fontFamily:"'DM Sans',sans-serif",fontSize:12,outline:"none"}}/>
              <select value={customTier} onChange={e=>setCustomTier(e.target.value)}
                style={{background:"rgba(14,37,68,.7)",border:"1px solid rgba(26,53,85,.55)",borderRadius:8,padding:"7px 8px",color:"var(--npi-txt2)",fontFamily:"'JetBrains Mono',monospace",fontSize:10,outline:"none",cursor:"pointer"}}>
                <option value="STAT">STAT</option><option value="URGENT">URGENT</option><option value="ROUTINE">ROUTINE</option>
              </select>
              <button onClick={addCustomOrder} disabled={!customName.trim()}
                style={{padding:"7px 12px",borderRadius:8,background:"rgba(0,229,192,.1)",border:"1px solid rgba(0,229,192,.28)",color:"var(--npi-teal)",fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:12,cursor:customName.trim()?"pointer":"not-allowed",opacity:customName.trim()?1:.5}}>
                Add
              </button>
            </div>
          </div>
        </>
      );
    }

    if (cat==="labs")    return Object.entries(LABS).map(([g,items])=>(<div key={g}><SecLabel>{g}</SecLabel>{items.map(item=>(<OrderRow key={item.name} item={item} catIcon="🧪" onClick={()=>quickAdd(item.name,item.detail,item.tier,"lab")}/>))}</div>));
    if (cat==="meds")    return Object.entries(MEDS).map(([g,items])=>(<div key={g}><SecLabel>{g}</SecLabel>{items.map(item=>(<OrderRow key={item.name} item={item} catIcon="💊" onClick={()=>quickAdd(item.name,item.detail,item.tier,"medication")}/>))}</div>));
    if (cat==="iv")      return Object.entries(IV_STRAT).map(([g,items])=>(<div key={g}><SecLabel>{g}</SecLabel>{items.map(item=>(<OrderRow key={item.name} item={item} catIcon="💧" onClick={()=>quickAdd(item.name,item.detail,item.tier,"iv")}/>))}</div>));
    if (cat==="imaging") return (<div>{IMAGING_ORDERS.map(item=>(<OrderRow key={item.name} item={item} catIcon="🔬" onClick={()=>quickAdd(item.name,item.detail,item.tier,"imaging")}/>))}</div>);
    if (cat==="consult") return (<><SecLabel>Consult services</SecLabel><div style={{display:"flex",flexWrap:"wrap",gap:5}}>{CONSULTS.map(s=>(<button key={s} className="ord-chip" onClick={()=>quickAdd(`${s} consult`,`Consult ${s} — indication to be specified`,"URGENT","consult")}>{s}</button>))}</div></>);
    return null;
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{display:"grid",gridTemplateColumns:"56% 44%",height:"100%",background:"var(--npi-bg)"}}>

      {/* LEFT */}
      <div style={{padding:"12px 14px",display:"flex",flexDirection:"column",gap:10,overflowY:"auto",borderRight:"1px solid var(--npi-bd)",minHeight:0}}>

        {renderContextBar()}

        {/* AI Bundle */}
        <div style={{background:"rgba(0,229,192,.03)",border:"1px solid rgba(0,229,192,.22)",borderRadius:10,padding:14,flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,flexWrap:"wrap"}}>
            <span className="ord-ai-pill">✦ AI Bundle</span>
            {bundle&&<span style={{fontSize:20,fontWeight:800,color:"var(--npi-teal)",fontFamily:"'JetBrains Mono',monospace"}}>{bundle.confidence}%</span>}
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:700,color:"var(--npi-txt)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                {loading?"Analyzing…":bundle?.diagnosis||chiefComplaint||"Enter a chief complaint"}
              </div>
            </div>
            {bundle&&(
              <div style={{display:"flex",gap:5}}>
                <button onClick={()=>setChecked(new Set(bundle.orders.map(o=>o.id)))} style={{padding:"3px 8px",borderRadius:5,background:"transparent",border:"1px solid rgba(255,255,255,.15)",color:"var(--npi-txt4)",fontFamily:"'DM Sans',sans-serif",fontSize:10,cursor:"pointer"}}>All</button>
                <button onClick={()=>setChecked(new Set())} style={{padding:"3px 8px",borderRadius:5,background:"transparent",border:"1px solid rgba(255,255,255,.15)",color:"var(--npi-txt4)",fontFamily:"'DM Sans',sans-serif",fontSize:10,cursor:"pointer"}}>None</button>
                <button onClick={acceptChecked} disabled={!checked.size} className="ord-btn-teal">Accept ({checked.size})</button>
              </div>
            )}
          </div>
          {loading&&(
            <div style={{display:"flex",alignItems:"center",gap:9,padding:"6px 0",color:"var(--npi-txt4)",fontSize:12,fontFamily:"'DM Sans',sans-serif"}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:"var(--npi-teal)",animation:"npi-ai-pulse 1.4s ease-in-out infinite"}}/>
              Generating order bundle{workingWeight?` (${workingWeight}kg`:""}{ eGFR?`, eGFR ${eGFR}`:""}{(workingWeight||eGFR)?")":""}…
            </div>
          )}
          {!loading&&!bundle&&(
            <div style={{padding:"6px 0",color:"var(--npi-txt4)",fontSize:12,fontFamily:"'DM Sans',sans-serif"}}>
              {chiefComplaint?<button className="ord-btn-ghost" onClick={generateBundle}>✦ Generate bundle</button>:"Enter a chief complaint to generate an AI order bundle."}
            </div>
          )}
          {bundle&&["STAT","URGENT","ROUTINE"].map(tier=>{
            const orders=bundle.orders.filter(o=>o.tier===tier);
            if (!orders.length) return null;
            return (
              <div key={tier}>
                <div style={{display:"flex",alignItems:"center",gap:8,margin:"8px 0 4px"}}>
                  <span style={{fontSize:9,fontWeight:700,letterSpacing:1.5,color:TC[tier],fontFamily:"'JetBrains Mono',monospace"}}>{tier}</span>
                  <div style={{flex:1,height:1,background:"rgba(255,255,255,.07)"}}/>
                  <span style={{fontSize:9,color:TC[tier],opacity:.5,fontFamily:"'JetBrains Mono',monospace"}}>{orders.length}</span>
                </div>
                {orders.map(ord=>{
                  const on=checked.has(ord.id);
                  const wDose=workingWeight?calcWeightDose(ord.name,workingWeight):null;
                  const rWarn=eGFR?getRenalWarn(ord.name,eGFR):null;
                  return (
                    <div key={ord.id} className="ord-row" onClick={()=>toggleCheck(ord.id)}
                      style={{borderColor:rWarn?`${rWarn.color}25`:undefined}}>
                      <div className={`ord-chk${on?" on":""}`}>
                        {on&&<span style={{color:"var(--npi-bg)",fontSize:9,fontWeight:700,lineHeight:1}}>✓</span>}
                      </div>
                      <span style={{fontSize:11,marginTop:1,flexShrink:0}}>{CAT_ICON[ord.category]||"📋"}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12,fontWeight:500,color:"var(--npi-txt)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ord.name}</div>
                        <div style={{fontSize:10,color:"var(--npi-txt4)",marginTop:1}}>{ord.detail}</div>
                        {wDose&&<div style={{fontSize:9,color:"var(--npi-blue)",fontFamily:"'JetBrains Mono',monospace",marginTop:1}}>⚖ {wDose}</div>}
                        {rWarn&&<div style={{fontSize:9,color:rWarn.color,marginTop:1}}>🫘 {rWarn.warn}</div>}
                      </div>
                      <TierBadge tier={ord.tier}/>
                    </div>
                  );
                })}
              </div>
            );
          })}
          {bundle?.suppressed?.length>0&&(
            <div style={{background:"rgba(245,200,66,.07)",border:"1px solid rgba(245,200,66,.18)",borderRadius:7,padding:"7px 10px",fontSize:10,color:"rgba(245,200,66,.82)",display:"flex",gap:6,marginTop:8}}>
              <span style={{flexShrink:0}}>⚑</span><span>{bundle.suppressed.join(" · ")}</span>
            </div>
          )}
        </div>

        {/* Category tabs */}
        <div style={{display:"flex",gap:2,borderBottom:"1px solid rgba(255,255,255,.08)",flexShrink:0,overflowX:"auto"}}>
          {CATS.map(c=>{
            const active=c.id===cat;
            return (
              <button key={c.id} onClick={()=>setCat(c.id)}
                style={{padding:"7px 10px",background:"none",border:"none",borderBottom:`2px solid ${active?"var(--npi-teal)":"transparent"}`,marginBottom:-1,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:active?600:400,color:active?"var(--npi-teal)":"var(--npi-txt3)",whiteSpace:"nowrap",transition:"all .13s"}}>
                {c.icon} {c.label}
              </button>
            );
          })}
        </div>
        <div style={{flex:1,overflowY:"auto",minHeight:0}}>{renderCategoryContent()}</div>
      </div>

      {/* RIGHT — Queue */}
      <div style={{padding:"14px 16px",display:"flex",flexDirection:"column",gap:10,overflowY:"auto"}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:2}}>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:"var(--npi-txt)",fontFamily:"'Playfair Display',serif"}}>Order queue</div>
            <div style={{fontSize:11,color:"var(--npi-txt4)",marginTop:2,fontFamily:"'DM Sans',sans-serif"}}>
              {queue.length===0?"No orders yet":signed?`${queue.length} orders · transmitted`:`${queue.length} order${queue.length!==1?"s":""} · pending signature`}
            </div>
          </div>
          {queue.length>0&&!signed&&(
            <button className="ord-btn-teal" onClick={signQueue} disabled={busySign}>
              {busySign?"Signing…":`Sign all (${queue.length})`}
            </button>
          )}
        </div>

        {queue.length>0&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7}}>
            {[{n:statN,l:"STAT",c:"var(--npi-coral)"},{n:urgentN,l:"Urgent",c:"var(--npi-orange)"},{n:routineN,l:"Routine",c:"var(--npi-txt4)"}].map(s=>(
              <div key={s.l} style={{background:"rgba(255,255,255,.04)",borderRadius:7,padding:"8px 10px",textAlign:"center"}}>
                <div style={{fontSize:18,fontWeight:700,color:s.c,fontFamily:"'JetBrains Mono',monospace"}}>{s.n}</div>
                <div style={{fontSize:10,color:"rgba(255,255,255,.35)",marginTop:1,fontFamily:"'DM Sans',sans-serif"}}>{s.l}</div>
              </div>
            ))}
          </div>
        )}

        {queue.length===0&&(
          <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,color:"var(--npi-txt4)",textAlign:"center",padding:32}}>
            <svg width="38" height="38" viewBox="0 0 38 38" fill="none"><rect x="5" y="9" width="28" height="4" rx="2" fill="rgba(122,160,192,.15)"/><rect x="5" y="17" width="22" height="4" rx="2" fill="rgba(122,160,192,.15)"/><rect x="5" y="25" width="26" height="4" rx="2" fill="rgba(122,160,192,.15)"/></svg>
            <div style={{fontSize:12,fontFamily:"'DM Sans',sans-serif"}}>No orders in queue</div>
            <div style={{fontSize:10,fontFamily:"'DM Sans',sans-serif",maxWidth:200}}>Load an order set or check items in the AI bundle</div>
          </div>
        )}

        {queue.length>0&&(
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            {sortedQueue.map(ord=>{
              const status   = signed ? (orderStatuses[ord.id] || "sent") : "unsigned";
              const scfg     = STATUS_CFG[status] || STATUS_CFG.unsigned;
              const isEditing= editingId === ord.id;
              return (
                <div key={ord.id} style={{background:"rgba(255,255,255,.03)",border:`1px solid ${ord.allergyWarn&&!ackdWarn.has(ord.id)?"rgba(255,107,107,.3)":status==="critical"?"rgba(255,107,107,.4)":status==="resulted"?"rgba(0,229,192,.18)":"rgba(255,255,255,.07)"}`,borderLeft:`3px solid ${TL[ord.tier]||TL.ROUTINE}`,borderRadius:"0 9px 9px 0",overflow:"hidden"}}>
                  {/* Header */}
                  <div style={{display:"flex",alignItems:"center",gap:7,padding:"9px 12px"}}>
                    <span style={{fontSize:12,flexShrink:0}}>{CAT_ICON[ord.category]||"📋"}</span>
                    <span style={{fontSize:12,fontWeight:600,color:status==="resulted"?"var(--npi-teal)":status==="critical"?"var(--npi-coral)":"var(--npi-txt)",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ord.name}</span>
                    <TierBadge tier={ord.tier}/>
                    {!signed&&!isEditing&&(
                      <>
                        <button onClick={()=>startEdit(ord)} style={{background:"none",border:"none",color:"var(--npi-txt4)",cursor:"pointer",fontSize:10,padding:"1px 4px",fontFamily:"'DM Sans',sans-serif"}}>Edit</button>
                        <button onClick={()=>removeFromQueue(ord.id)} style={{background:"none",border:"none",color:"var(--npi-txt4)",cursor:"pointer",fontSize:12,padding:2,lineHeight:1,flexShrink:0}}>✕</button>
                      </>
                    )}
                  </div>
                  {/* Inline edit form */}
                  {isEditing&&!signed&&(
                    <div style={{padding:"0 12px 10px",display:"flex",flexDirection:"column",gap:6}}>
                      <textarea value={editDraft.detail} onChange={e=>setEditDraft(d=>({...d,detail:e.target.value}))} rows={2}
                        style={{width:"100%",background:"rgba(14,37,68,.8)",border:"1px solid rgba(59,158,255,.4)",borderRadius:7,padding:"6px 9px",color:"var(--npi-txt)",fontFamily:"'DM Sans',sans-serif",fontSize:11.5,outline:"none",resize:"none",boxSizing:"border-box"}}/>
                      <div style={{display:"flex",gap:5,alignItems:"center"}}>
                        <select value={editDraft.tier} onChange={e=>setEditDraft(d=>({...d,tier:e.target.value}))}
                          style={{background:"rgba(14,37,68,.8)",border:"1px solid rgba(26,53,85,.5)",borderRadius:6,padding:"4px 7px",color:"var(--npi-txt2)",fontFamily:"'JetBrains Mono',monospace",fontSize:10,outline:"none",cursor:"pointer"}}>
                          <option value="STAT">STAT</option><option value="URGENT">URGENT</option><option value="ROUTINE">ROUTINE</option>
                        </select>
                        <div style={{flex:1}}/>
                        <button onClick={()=>setEditingId(null)} style={{padding:"4px 10px",borderRadius:6,background:"transparent",border:"1px solid rgba(255,255,255,.12)",color:"var(--npi-txt4)",fontFamily:"'DM Sans',sans-serif",fontSize:11,cursor:"pointer"}}>Cancel</button>
                        <button onClick={()=>saveEdit(ord.id)} style={{padding:"4px 10px",borderRadius:6,background:"rgba(0,229,192,.12)",border:"1px solid rgba(0,229,192,.3)",color:"var(--npi-teal)",fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:11,cursor:"pointer"}}>Save</button>
                      </div>
                    </div>
                  )}
                  {/* Detail + status (when not editing) */}
                  {!isEditing&&(
                    <div style={{padding:"0 12px 9px"}}>
                      {/* Allergy override */}
                      {ord.allergyWarn&&!ackdWarn.has(ord.id)&&(
                        <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:5,padding:"5px 8px",borderRadius:6,background:"rgba(255,107,107,.08)",border:"1px solid rgba(255,107,107,.2)"}}>
                          <span style={{fontSize:10,color:"var(--npi-coral)",fontWeight:600,flex:1}}>⚠ Allergy flag — verify before signing</span>
                          <button onClick={()=>acknowledgeWarning(ord.id)} style={{padding:"2px 8px",borderRadius:5,background:"rgba(255,107,107,.15)",border:"1px solid rgba(255,107,107,.35)",color:"var(--npi-coral)",fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:10,cursor:"pointer",whiteSpace:"nowrap"}}>Override →</button>
                        </div>
                      )}
                      {ord.allergyWarn&&ackdWarn.has(ord.id)&&(
                        <div style={{fontSize:10,color:"var(--npi-txt4)",marginBottom:4}}>⚠ Allergy override acknowledged</div>
                      )}
                      {/* Detail string */}
                      {ord.detail&&(
                        <div style={{fontSize:10,color:"var(--npi-txt4)",lineHeight:1.45,marginBottom:5}}>{ord.detail}</div>
                      )}
                      {/* Status row */}
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <div style={{width:6,height:6,borderRadius:"50%",background:scfg.dot,flexShrink:0,animation:scfg.pulse?"npi-ai-pulse 1.2s ease-in-out infinite":undefined}}/>
                        <span style={{fontSize:10,color:status==="critical"?"var(--npi-coral)":status==="resulted"?"rgba(0,229,192,.8)":"rgba(255,149,64,.7)",fontFamily:"'DM Sans',sans-serif",flex:1,fontWeight:status==="critical"?700:400}}>
                          {scfg.label}
                        </span>
                        {!signed&&ord.t&&<span style={{fontSize:9,color:"var(--npi-txt4)",fontFamily:"'JetBrains Mono',monospace"}}>{elapsed(ord.t)}</span>}
                        {/* Result status actions */}
                        {signed&&status==="sent"&&(
                          <div style={{display:"flex",gap:4}}>
                            <button onClick={()=>setOrderStatus(ord.id,"resulted")}
                              style={{padding:"2px 7px",borderRadius:5,background:"rgba(0,229,192,.1)",border:"1px solid rgba(0,229,192,.3)",color:"var(--npi-teal)",fontFamily:"'DM Sans',sans-serif",fontSize:9,fontWeight:600,cursor:"pointer"}}>
                              Resulted
                            </button>
                            <button onClick={()=>setOrderStatus(ord.id,"critical")}
                              style={{padding:"2px 7px",borderRadius:5,background:"rgba(255,107,107,.1)",border:"1px solid rgba(255,107,107,.3)",color:"var(--npi-coral)",fontFamily:"'DM Sans',sans-serif",fontSize:9,fontWeight:600,cursor:"pointer"}}>
                              Critical
                            </button>
                          </div>
                        )}
                        {signed&&status==="resulted"&&(
                          <button onClick={()=>setOrderStatus(ord.id,"critical")}
                            style={{padding:"2px 7px",borderRadius:5,background:"rgba(255,107,107,.08)",border:"1px solid rgba(255,107,107,.2)",color:"var(--npi-coral)",fontFamily:"'DM Sans',sans-serif",fontSize:9,cursor:"pointer"}}>
                            Flag critical
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {queue.length>0&&!signed&&(
          <div style={{background:"rgba(0,229,192,.06)",border:"1px solid rgba(0,229,192,.2)",borderRadius:10,padding:14,textAlign:"center",marginTop:"auto"}}>
            <div style={{fontSize:11,color:"rgba(255,255,255,.45)",marginBottom:9,fontFamily:"'DM Sans',sans-serif"}}>
              {queue.length} order{queue.length!==1?"s":""} awaiting signature
              {recentlySigned.length>0 && <span style={{color:"var(--npi-gold)",marginLeft:6}}>· repeat check active</span>}
            </div>
            <button onClick={signQueue} disabled={busySign}
              style={{width:"100%",background:"var(--npi-teal)",color:"var(--npi-bg)",border:"none",borderRadius:8,padding:9,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",opacity:busySign?.6:1}}>
              {busySign?"Signing…":"Sign orders"}
            </button>
          </div>
        )}

        {signed&&(
          <div style={{background:"rgba(0,229,192,.06)",border:"1px solid rgba(0,229,192,.2)",borderRadius:10,padding:"12px 14px",marginTop:"auto"}}>
            <div style={{fontSize:12,color:"var(--npi-teal)",fontWeight:700,fontFamily:"'DM Sans',sans-serif",marginBottom:6}}>
              ✓ {queue.length} orders signed and transmitted
            </div>
            {Object.values(orderStatuses).some(s=>s==="critical")&&(
              <div style={{fontSize:11,color:"var(--npi-coral)",fontWeight:600,fontFamily:"'DM Sans',sans-serif",animation:"npi-ai-pulse 1.5s ease-in-out infinite"}}>
                ⚠ Critical result flagged — review immediately
              </div>
            )}
            <div style={{fontSize:10,color:"var(--npi-txt4)",marginTop:6,fontFamily:"'DM Sans',sans-serif"}}>
              Mark individual orders as Resulted or Critical as results return.
              {/* Integration point: in production, statuses update via EHR webhook */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}