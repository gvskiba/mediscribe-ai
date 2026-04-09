import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

// ── Tier helpers ──────────────────────────────────────────────────────────────
const TC = { STAT:"var(--npi-coral)", URGENT:"var(--npi-orange)", ROUTINE:"var(--npi-txt4)" };
const TB = { STAT:"rgba(255,107,107,.12)", URGENT:"rgba(255,159,67,.12)", ROUTINE:"rgba(255,255,255,.05)" };
const TD = { STAT:"rgba(255,107,107,.28)", URGENT:"rgba(255,159,67,.28)", ROUTINE:"rgba(255,255,255,.10)" };
const TL = { STAT:"var(--npi-coral)", URGENT:"var(--npi-orange)", ROUTINE:"rgba(255,255,255,.15)" };
const CAT_ICON = { lab:"🧪", medication:"💊", iv:"💧", imaging:"🔬", procedure:"⚙️", consult:"👤", monitoring:"📡" };

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
const CONSULTS=[
  "Cardiology","Pulmonology","Gastroenterology","Nephrology","Neurology","Neurosurgery",
  "General Surgery","Vascular Surgery","Orthopedics","Urology","OB/GYN","Ophthalmology",
  "ENT","Psychiatry","Social Work","Infectious Disease","Hematology / Oncology",
  "Palliative Care","Case Management","Pharmacy",
];
const CATS=[{id:"sets",label:"Order Sets",icon:"⊞"},{id:"all",label:"Add-ons",icon:"⊕"},{id:"labs",label:"Labs",icon:"🧪"},{id:"meds",label:"Meds",icon:"💊"},{id:"iv",label:"IV",icon:"💧"},{id:"imaging",label:"Imaging",icon:"🔬"},{id:"consult",label:"Consult",icon:"👤"}];

// ── OrdersPanel ───────────────────────────────────────────────────────────────
export default function OrdersPanel({ patientName, allergies, chiefComplaint, patientAge, patientSex }) {
  const [bundle,   setBundle]   = useState(null);
  const [checked,  setChecked]  = useState(new Set());
  const [queue,    setQueue]    = useState([]);
  const [signed,   setSigned]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [busySign, setBusySign] = useState(false);
  const [search,   setSearch]   = useState("");
  const [cat,      setCat]      = useState("sets");
  const [loadedSet,setLoadedSet]= useState(null);

  useEffect(() => { if (chiefComplaint) generateBundle(); }, []); // eslint-disable-line

  const generateBundle = useCallback(async () => {
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt:`You are an ED clinical decision support AI.
Patient: ${patientName||"Unknown"}, age ${patientAge||"?"}, sex ${patientSex||"?"}.
Chief complaint: "${chiefComplaint||"not specified"}". Allergies: ${allergies?.length?allergies.join(", "):"NKDA"}.
Generate an evidence-based ED order bundle. Return ONLY valid JSON:
{"diagnosis":"Brief working dx","confidence":85,"suppressed":["reason for omitted items"],
"orders":[{"id":"o1","name":"Order name","detail":"Dose/detail","tier":"STAT","category":"lab"}]}
tier: STAT|URGENT|ROUTINE. category: lab|medication|iv|imaging|procedure|consult|monitoring.
Include 8-12 orders across relevant categories.`,
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
      // Default: ALL orders pre-checked — "confirm and remove" pattern (Kawamoto 2005)
      setChecked(new Set((parsed.orders||[]).map(o=>o.id)));
    } catch { toast.error("Could not generate order bundle."); }
    finally { setLoading(false); }
  }, [chiefComplaint, patientAge, patientSex, allergies, patientName]);

  const toggleCheck = useCallback((id) =>
    setChecked(prev => { const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; }), []);

  const enqueue = useCallback((orders) => {
    const toAdd = orders.filter(o=>!queue.find(q=>q.id===o.id));
    if (!toAdd.length) { toast.info("All orders already in queue."); return; }
    setQueue(prev=>[...prev,...toAdd]);
    setSigned(false);
    return toAdd.length;
  }, [queue]);

  // One-click order set load — entire set goes straight to queue, no selection step
  const loadOrderSet = useCallback((set) => {
    const n = enqueue(set.orders);
    if (n > 0) {
      setLoadedSet(set.id);
      toast.success(`${set.name} — ${n} orders added. Review queue and remove anything not indicated.`);
    }
  }, [enqueue]);

  const acceptChecked = useCallback(() => {
    if (!bundle) return;
    const n = enqueue(bundle.orders.filter(o=>checked.has(o.id)));
    if (n > 0) toast.success(`${n} orders added to queue.`);
  }, [bundle, checked, enqueue]);

  const quickAdd = useCallback((name,detail,tier,category) => {
    const id=`qa-${name.replace(/\s/g,"-").toLowerCase()}`;
    enqueue([{id,name,detail,tier:tier||"URGENT",category:category||"lab"}]);
  }, [enqueue]);

  const signQueue = useCallback(() => {
    setBusySign(true);
    setTimeout(()=>{
      setSigned(true); setBusySign(false);
      toast.success(`${queue.length} order${queue.length!==1?"s":""} signed.`);
    }, 500);
  }, [queue.length]);

  const removeFromQueue = useCallback((id) => {
    setQueue(p=>p.filter(x=>x.id!==id));
    setSigned(false);
  }, []);

  const statN=queue.filter(o=>o.tier==="STAT").length;
  const urgentN=queue.filter(o=>o.tier==="URGENT").length;
  const routineN=queue.filter(o=>o.tier==="ROUTINE").length;

  // ── Shared sub-components ─────────────────────────────────────────────────
  function SecLabel({children}) {
    return <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:"var(--npi-txt4)",margin:"12px 0 6px"}}>{children}</div>;
  }
  function OrderRow({item,catIcon,onClick}) {
    return (
      <div className="ord-row" onClick={onClick}
        style={{cursor:"pointer",padding:"8px 10px",borderRadius:7,display:"flex",alignItems:"flex-start",gap:8,background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.07)",transition:"background .12s",marginBottom:4}}>
        <span style={{fontSize:12,flexShrink:0,marginTop:1}}>{catIcon}</span>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:12,fontWeight:600,color:"var(--npi-txt)"}}>{item.name}</div>
          <div style={{fontSize:10,color:"var(--npi-txt4)",marginTop:1,lineHeight:1.4}}>{item.detail}</div>
        </div>
        <TierBadge tier={item.tier}/>
      </div>
    );
  }

  // ── Category content ──────────────────────────────────────────────────────
  function renderCategoryContent() {
    if (cat==="sets") {
      return (
        <div>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11.5,color:"var(--npi-txt3)",lineHeight:1.6,marginBottom:12,padding:"8px 10px",background:"rgba(59,158,255,.05)",border:"1px solid rgba(59,158,255,.14)",borderRadius:7}}>
            One click loads the complete set into the queue. Review and remove anything not indicated — then sign.
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {ORDER_SETS.map(set=>{
              const loaded=loadedSet===set.id;
              const alreadyIn=set.orders.every(o=>queue.find(q=>q.id===o.id));
              return (
                <div key={set.id}
                  style={{borderRadius:9,border:`1px solid ${set.bd}`,background:set.color,padding:"10px 12px",cursor:alreadyIn?"default":"pointer",transition:"opacity .13s",opacity:alreadyIn?.6:1}}
                  onClick={()=>!alreadyIn&&loadOrderSet(set)}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:16}}>{set.icon}</span>
                    <div style={{flex:1}}>
                      <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:13,color:"var(--npi-txt)"}}>{set.name}</div>
                      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--npi-txt4)",marginTop:2}}>
                        {set.orders.length} orders · {set.orders.filter(o=>o.tier==="STAT").length} STAT · {set.orders.filter(o=>o.tier==="URGENT").length} URGENT
                      </div>
                    </div>
                    {alreadyIn
                      ? <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--npi-teal)"}}>✓ loaded</span>
                      : <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--npi-txt3)"}}>+ Load all →</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    if (cat==="all") {
      const ALL=[
        {n:"CBC w/ diff",c:"lab"},{n:"BMP",c:"lab"},{n:"Troponin",c:"lab"},{n:"Lactate",c:"lab"},
        {n:"Blood cultures",c:"lab"},{n:"UA",c:"lab"},{n:"CXR",c:"imaging"},{n:"CT head",c:"imaging"},
        {n:"US FAST",c:"imaging"},{n:"Ondansetron 4mg IV",c:"medication"},{n:"Ketorolac 30mg IV",c:"medication"},
        {n:"NS 1L bolus",c:"iv"},{n:"LR 1L bolus",c:"iv"},{n:"Norepinephrine",c:"iv"},
      ];
      const chips=search?ALL.filter(c=>c.n.toLowerCase().includes(search.toLowerCase())):ALL;
      return (
        <>
          <div style={{display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",borderRadius:9,padding:"8px 11px",marginBottom:8}}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="5.5" cy="5.5" r="4" stroke="rgba(255,255,255,.3)" strokeWidth="1.3"/><line x1="8.8" y1="8.8" x2="12" y2="12" stroke="rgba(255,255,255,.3)" strokeWidth="1.3" strokeLinecap="round"/></svg>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search all orders…"
              style={{background:"none",border:"none",outline:"none",color:"var(--npi-txt)",fontSize:12,flex:1,fontFamily:"'DM Sans',sans-serif"}}/>
            {search&&<button onClick={()=>setSearch("")} style={{background:"none",border:"none",color:"var(--npi-txt4)",cursor:"pointer",fontSize:13}}>✕</button>}
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
            {chips.map(c=>(
              <button key={c.n} className="ord-chip" onClick={()=>quickAdd(c.n,"Quick add — verify dose/detail",c.c==="lab"?"URGENT":"URGENT",c.c)}>
                {c.n}
              </button>
            ))}
            {search&&!chips.length&&(
              <button className="ord-chip" onClick={()=>{quickAdd(search,"Custom order","ROUTINE","procedure");setSearch("");}}>
                + Add "{search}"
              </button>
            )}
          </div>
        </>
      );
    }
    if (cat==="labs") return Object.entries(LABS).map(([g,items])=>(<div key={g}><SecLabel>{g}</SecLabel>{items.map(item=>(<OrderRow key={item.name} item={item} catIcon="🧪" onClick={()=>quickAdd(item.name,item.detail,item.tier,"lab")}/>))}</div>));
    if (cat==="meds") return Object.entries(MEDS).map(([g,items])=>(<div key={g}><SecLabel>{g}</SecLabel>{items.map(item=>(<OrderRow key={item.name} item={item} catIcon="💊" onClick={()=>quickAdd(item.name,item.detail,item.tier,"medication")}/>))}</div>));
    if (cat==="iv")   return Object.entries(IV_STRAT).map(([g,items])=>(<div key={g}><SecLabel>{g}</SecLabel>{items.map(item=>(<OrderRow key={item.name} item={item} catIcon="💧" onClick={()=>quickAdd(item.name,item.detail,item.tier,"iv")}/>))}</div>));
    if (cat==="imaging") return (<div>{IMAGING_ORDERS.map(item=>(<OrderRow key={item.name} item={item} catIcon="🔬" onClick={()=>quickAdd(item.name,item.detail,item.tier,"imaging")}/>))}</div>);
    if (cat==="consult") return (<><SecLabel>Consult services</SecLabel><div style={{display:"flex",flexWrap:"wrap",gap:5}}>{CONSULTS.map(s=>(<button key={s} className="ord-chip" onClick={()=>quickAdd(`${s} consult`,`Consult ${s} — indication to be specified`,"URGENT","consult")}>{s}</button>))}</div></>);
    return null;
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{display:"grid",gridTemplateColumns:"56% 44%",height:"100%",background:"var(--npi-bg)"}}>

      {/* LEFT ── Build */}
      <div style={{padding:"14px 16px",display:"flex",flexDirection:"column",gap:10,overflowY:"auto",borderRight:"1px solid var(--npi-bd)"}}>

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
                <button onClick={()=>setChecked(new Set(bundle.orders.map(o=>o.id)))}
                  style={{padding:"3px 8px",borderRadius:5,background:"transparent",border:"1px solid rgba(255,255,255,.15)",color:"var(--npi-txt4)",fontFamily:"'DM Sans',sans-serif",fontSize:10,cursor:"pointer"}}>
                  All
                </button>
                <button onClick={()=>setChecked(new Set())}
                  style={{padding:"3px 8px",borderRadius:5,background:"transparent",border:"1px solid rgba(255,255,255,.15)",color:"var(--npi-txt4)",fontFamily:"'DM Sans',sans-serif",fontSize:10,cursor:"pointer"}}>
                  None
                </button>
                <button onClick={acceptChecked} disabled={!checked.size} className="ord-btn-teal">
                  Accept ({checked.size})
                </button>
              </div>
            )}
          </div>

          {loading&&(
            <div style={{display:"flex",alignItems:"center",gap:9,padding:"6px 0",color:"var(--npi-txt4)",fontSize:12,fontFamily:"'DM Sans',sans-serif"}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:"var(--npi-teal)",animation:"npi-ai-pulse 1.4s ease-in-out infinite"}}/>
              Generating order bundle…
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
                  return (
                    <div key={ord.id} className="ord-row" onClick={()=>toggleCheck(ord.id)}>
                      <div className={`ord-chk${on?" on":""}`}>
                        {on&&<span style={{color:"var(--npi-bg)",fontSize:9,fontWeight:700,lineHeight:1}}>✓</span>}
                      </div>
                      <span style={{fontSize:11,marginTop:1,flexShrink:0}}>{CAT_ICON[ord.category]||"📋"}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12,fontWeight:500,color:"var(--npi-txt)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ord.name}</div>
                        <div style={{fontSize:10,color:"var(--npi-txt4)",marginTop:1}}>{ord.detail}</div>
                      </div>
                      <TierBadge tier={ord.tier}/>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {bundle?.suppressed?.length>0&&(
            <div style={{background:"rgba(245,200,66,.07)",border:"1px solid rgba(245,200,66,.18)",borderRadius:7,padding:"7px 10px",fontSize:10,color:"rgba(245,200,66,.82)",display:"flex",gap:6,alignItems:"flex-start",marginTop:8}}>
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

        <div style={{flex:1}}>{renderCategoryContent()}</div>
      </div>

      {/* RIGHT ── Queue */}
      <div style={{padding:"14px 16px",display:"flex",flexDirection:"column",gap:10,overflowY:"auto"}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:2}}>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:"var(--npi-txt)",fontFamily:"'Playfair Display',serif"}}>Order queue</div>
            <div style={{fontSize:11,color:"var(--npi-txt4)",marginTop:2,fontFamily:"'DM Sans',sans-serif"}}>
              {queue.length===0?"No orders yet":signed?`${queue.length} orders · all signed`:`${queue.length} order${queue.length!==1?"s":""} · pending signature`}
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
            <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
              <rect x="5" y="9" width="28" height="4" rx="2" fill="rgba(122,160,192,.15)"/>
              <rect x="5" y="17" width="22" height="4" rx="2" fill="rgba(122,160,192,.15)"/>
              <rect x="5" y="25" width="26" height="4" rx="2" fill="rgba(122,160,192,.15)"/>
            </svg>
            <div style={{fontSize:12,fontFamily:"'DM Sans',sans-serif"}}>No orders in queue</div>
            <div style={{fontSize:10,fontFamily:"'DM Sans',sans-serif",maxWidth:200}}>Load an order set or check items in the AI bundle</div>
          </div>
        )}

        {queue.length>0&&(
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            {queue.map(ord=>(
              <div key={ord.id} style={{padding:"10px 12px",background:signed?"rgba(0,229,192,.04)":"rgba(255,255,255,.03)",border:`1px solid ${signed?"rgba(0,229,192,.15)":"rgba(255,255,255,.07)"}`,borderLeft:`3px solid ${TL[ord.tier]||TL.ROUTINE}`,borderRadius:"0 9px 9px 0"}}>
                <div style={{display:"flex",alignItems:"center",gap:7}}>
                  <span style={{fontSize:12,flexShrink:0}}>{CAT_ICON[ord.category]||"📋"}</span>
                  <span style={{fontSize:12,fontWeight:600,color:"var(--npi-txt)",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ord.name}</span>
                  <TierBadge tier={ord.tier}/>
                  {!signed&&<button onClick={()=>removeFromQueue(ord.id)} style={{background:"none",border:"none",color:"var(--npi-txt4)",cursor:"pointer",fontSize:12,padding:2,lineHeight:1,flexShrink:0}}>✕</button>}
                </div>
                {ord.detail&&(
                  <div style={{fontSize:10,color:"var(--npi-txt4)",marginTop:3,marginLeft:19,lineHeight:1.4}}>{ord.detail}</div>
                )}
                <div style={{display:"flex",alignItems:"center",gap:5,marginTop:4}}>
                  <div style={{width:5,height:5,borderRadius:"50%",background:signed?"var(--npi-teal)":"var(--npi-orange)",flexShrink:0}}/>
                  <span style={{fontSize:10,color:signed?"rgba(0,229,192,.7)":"rgba(255,149,64,.7)",fontFamily:"'DM Sans',sans-serif"}}>
                    {signed?"Signed — active":"Awaiting signature"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {queue.length>0&&!signed&&(
          <div style={{background:"rgba(0,229,192,.06)",border:"1px solid rgba(0,229,192,.2)",borderRadius:10,padding:14,textAlign:"center",marginTop:"auto"}}>
            <div style={{fontSize:11,color:"rgba(255,255,255,.45)",marginBottom:9,fontFamily:"'DM Sans',sans-serif"}}>
              {queue.length} order{queue.length!==1?"s":""} awaiting signature
            </div>
            <button onClick={signQueue} disabled={busySign}
              style={{width:"100%",background:"var(--npi-teal)",color:"var(--npi-bg)",border:"none",borderRadius:8,padding:9,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",opacity:busySign?.6:1}}>
              {busySign?"Signing…":"Sign orders"}
            </button>
          </div>
        )}

        {signed&&(
          <div style={{background:"rgba(0,229,192,.06)",border:"1px solid rgba(0,229,192,.2)",borderRadius:10,padding:14,textAlign:"center",marginTop:"auto"}}>
            <div style={{fontSize:12,color:"var(--npi-teal)",fontWeight:700,fontFamily:"'DM Sans',sans-serif"}}>
              ✓ {queue.length} orders signed — all active
            </div>
          </div>
        )}
      </div>
    </div>
  );
}