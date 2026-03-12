export const G = {
  navy:"#050f1e", slate:"#0b1d35", panel:"#0d2240", edge:"#162d4f",
  border:"#1e3a5f", muted:"#2a4d72", dim:"#4a7299", text:"#c8ddf0",
  bright:"#e8f4ff", teal:"#00d4bc", amber:"#f5a623", red:"#ff5c6c",
  green:"#2ecc71", purple:"#9b6dff", blue:"#4a90d9", rose:"#f472b6",
  gold:"#f0c040", orange:"#ff8c42", cyan:"#22d3ee",
};

export const CAT_CFG = {
  admit:    { icon:"🏥", label:"Admit Orders",          color:"#4a90d9" },
  vitals:   { icon:"📊", label:"Vitals & Monitoring",   color:"#00d4bc" },
  diet:     { icon:"🍽️", label:"Diet & Activity",       color:"#2ecc71" },
  fluids:   { icon:"💧", label:"IV Access & Fluids",    color:"#22d3ee" },
  labs:     { icon:"🧪", label:"Laboratory",            color:"#f5a623" },
  meds:     { icon:"💊", label:"Medications",           color:"#9b6dff" },
  imaging:  { icon:"🩻", label:"Imaging & Diagnostics", color:"#f472b6" },
  consults: { icon:"👨‍⚕️", label:"Consults",             color:"#ff8c42" },
  nursing:  { icon:"🩺", label:"Nursing Orders",        color:"#f0c040" },
};

export const PRI_CFG = {
  stat:    { color:"#ff5c6c", bg:"rgba(255,92,108,.12)",  label:"STAT"    },
  urgent:  { color:"#f5a623", bg:"rgba(245,166,35,.12)",  label:"URGENT"  },
  routine: { color:"#4a90d9", bg:"rgba(74,144,217,.1)",   label:"ROUTINE" },
};

export const SPECIALTIES = {
  "Cardiology":    { icon:"❤️",  color:"#ff5c6c", conditions:["chf","acute_mi","nstemi","afib_rvr","pe","dvt","hypertensive_emergency"] },
  "Critical Care": { icon:"🚨",  color:"#ff8c42", conditions:["sepsis","anaphylaxis","cardiogenic_shock","alcohol_withdrawal","copd_exacerbation_severe"] },
  "Neurology":     { icon:"🧠",  color:"#9b6dff", conditions:["stroke","ich","status_epilepticus","meningitis"] },
  "Endocrinology": { icon:"🩸",  color:"#f5a623", conditions:["dka","hhs","thyroid_storm","diabetic_foot_ulcer"] },
  "Respiratory":   { icon:"🫁",  color:"#22d3ee", conditions:["copd","asthma","pneumonia","ards"] },
  "Gastroenterology": { icon:"🫃", color:"#2ecc71", conditions:["gi_bleed_upper","pancreatitis","bowel_obstruction","cholecystitis","appendicitis"] },
  "Nephrology":    { icon:"🩻",  color:"#f0c040", conditions:["aki","hyperkalemia","uti_pyelonephritis"] },
  "Infectious Disease": { icon:"🦠", color:"#ff8c42", conditions:["cellulitis"] },
  "Rheumatology":  { icon:"🦴",  color:"#9b6dff", conditions:["gout_flare"] },
};

const tag = (color, bg, label) => ({ color, bg, label });
export const BADGES = {
  REQUIRED:   tag("#ff5c6c","rgba(255,92,108,.12)","REQUIRED"),
  MODIFIED:   tag("#f5a623","rgba(245,166,35,.12)","MODIFIED"),
  AI:         tag("#9b6dff","rgba(155,109,255,.14)","AI"),
  CUSTOM:     tag("#f0c040","rgba(240,192,64,.12)","CUSTOM"),
  "HIGH ALERT":tag("#ff8c42","rgba(255,140,66,.14)","HIGH ALERT"),
};

// ── Condition library ──────────────────────────────────────────────────────
export const CONDITIONS = {
  chf: {
    id:"chf", name:"CHF Exacerbation", subtitle:"Acute Decompensated Heart Failure",
    icon:"❤️", specialty:"Cardiology", acuity:"urgent",
    guideline:"2022 AHA/ACC/HFSA Heart Failure Guidelines",
    tags:["HFrEF","HFpEF","ADHF","Volume Overload"],
    orders:[
      {id:"chf-a1",cat:"admit",  priority:"urgent", required:true, name:"Admit to",                  detail:"Cardiology / Telemetry Unit"},
      {id:"chf-a2",cat:"admit",  priority:"urgent", required:true, name:"Level of Care",              detail:"Monitored bed. Escalate to ICU if hemodynamic instability, vasopressors required, or SaO₂ < 90% on O₂"},
      {id:"chf-a3",cat:"admit",  priority:"urgent", required:true, name:"Admitting Diagnosis",        detail:"Acute Decompensated Heart Failure"},
      {id:"chf-a4",cat:"admit",  priority:"routine",required:true, name:"Attending Physician",        detail:"[Attending Physician — to be completed]"},
      {id:"chf-a5",cat:"admit",  priority:"routine",required:true, name:"Code Status",                detail:"Confirm and document. Default Full Code."},
      {id:"chf-a6",cat:"admit",  priority:"routine",required:true, name:"Allergy Reconciliation",     detail:"Verify and reconcile all medication allergies on admission"},
      {id:"chf-v1",cat:"vitals", priority:"urgent", required:true, name:"Vital Signs",                detail:"Q4h × 24h, then Q8h if stable. Include HR, BP, RR, SpO₂, Temp"},
      {id:"chf-v2",cat:"vitals", priority:"urgent", required:true, name:"Daily Weight",               detail:"Every morning before breakfast, same scale. Notify MD if weight increases > 2 lbs/day",guideline:"AHA HF 2022 Class I"},
      {id:"chf-v3",cat:"vitals", priority:"urgent", required:true, name:"Strict Intake & Output",     detail:"Q8h. Notify MD if UO < 0.5 mL/kg/hr × 2h or net positive > 2L in 24h"},
      {id:"chf-v4",cat:"vitals", priority:"urgent", required:true, name:"Continuous SpO₂",            detail:"Continuous pulse oximetry. Supplemental O₂ to maintain SpO₂ ≥ 95%"},
      {id:"chf-v5",cat:"vitals", priority:"urgent", required:true, name:"Telemetry",                  detail:"Continuous cardiac telemetry monitoring"},
      {id:"chf-v6",cat:"vitals", priority:"urgent", required:true, name:"Daily BMP",                  detail:"Every morning while on IV diuretics — monitor K⁺, Na⁺, Cr, BUN",guideline:"KDIGO / AHA HF"},
      {id:"chf-d1",cat:"diet",   priority:"routine",required:true, name:"Sodium-Restricted Diet",     detail:"2g sodium, fluid restriction 1.5–2 L/day; heart-healthy diet",guideline:"AHA HF 2022"},
      {id:"chf-d2",cat:"diet",   priority:"routine",required:false,name:"Activity Restrictions",      detail:"Bed rest with bedside commode; advance as tolerated"},
      {id:"chf-d3",cat:"diet",   priority:"routine",required:false,name:"Dietary Consult",            detail:"Heart failure diet education — low-sodium, fluid restriction techniques"},
      {id:"chf-f1",cat:"fluids", priority:"urgent", required:true, name:"IV Access",                  detail:"18G or larger peripheral IV × 1. Consider PICC if prolonged course"},
      {id:"chf-f2",cat:"fluids", priority:"urgent", required:true, name:"Fluid Restriction",          detail:"Total IV + PO fluids ≤ 1.5 L/day unless volume-depleted",guideline:"AHA HF 2022"},
      {id:"chf-f3",cat:"fluids", priority:"stat",   required:true, name:"IV Furosemide",              detail:"40–80 mg IV bolus Q12h OR continuous infusion. Titrate to UO > 3–5 mL/kg/hr.",guideline:"DOSE Trial — AHA 2022 Class I"},
      {id:"chf-l1",cat:"labs",   priority:"stat",   required:true, name:"BMP",                        detail:"STAT on admission, then daily while on IV diuretics"},
      {id:"chf-l2",cat:"labs",   priority:"stat",   required:true, name:"BNP or NT-proBNP",           detail:"STAT on admission — baseline and trending to guide diuresis",guideline:"AHA HF 2022 Class I"},
      {id:"chf-l3",cat:"labs",   priority:"stat",   required:true, name:"CBC with differential",      detail:"STAT on admission"},
      {id:"chf-l4",cat:"labs",   priority:"stat",   required:true, name:"Troponin I/T (hsTn)",        detail:"STAT; repeat in 3h if initial negative. Rule out ACS.",guideline:"AHA 2022"},
      {id:"chf-l5",cat:"labs",   priority:"stat",   required:false,name:"Magnesium",                  detail:"STAT — replete if < 2.0 mEq/L"},
      {id:"chf-l6",cat:"labs",   priority:"routine",required:false,name:"TSH",                        detail:"On admission — rule out thyroid-induced HF exacerbation"},
      {id:"chf-l7",cat:"labs",   priority:"routine",required:false,name:"Urinalysis with reflex culture",detail:"On admission"},
      {id:"chf-m1",cat:"meds",   priority:"stat",   required:true, name:"Furosemide IV",              detail:"40–80 mg IV Q12h or continuous infusion. Titrate. Convert to PO when euvolemic.",guideline:"DOSE Trial — AHA 2022 Class I"},
      {id:"chf-m2",cat:"meds",   priority:"routine",required:true, name:"Beta-Blocker (home dose)",   detail:"Continue home dose UNLESS HR < 60, SBP < 90, or cardiogenic shock.",guideline:"AHA HF 2022 Class III for new initiation"},
      {id:"chf-m3",cat:"meds",   priority:"routine",required:false,name:"Sacubitril/Valsartan or ACEi/ARB",detail:"If EF < 40%: sacubitril/valsartan preferred (PARADIGM-HF). Hold if SBP < 90 or AKI.",guideline:"PARADIGM-HF — AHA 2022 Class I"},
      {id:"chf-m4",cat:"meds",   priority:"routine",required:false,name:"Spironolactone 25mg PO daily",detail:"If HFrEF (EF < 35%) and GFR > 30, K⁺ < 5.0. Reduces mortality (RALES trial).",guideline:"RALES — AHA 2022 Class I"},
      {id:"chf-m5",cat:"meds",   priority:"routine",required:false,name:"SGLT2 Inhibitor",            detail:"Empagliflozin 10mg or Dapagliflozin 10mg PO daily. Start before discharge.",guideline:"AHA 2022 Class I"},
      {id:"chf-m6",cat:"meds",   priority:"urgent", required:false,name:"Potassium Chloride — Repletion",detail:"Replace per renal protocol. Target K⁺ 4.0–5.0 mEq/L."},
      {id:"chf-m7",cat:"meds",   priority:"routine",required:true, name:"Enoxaparin 40mg SQ daily",   detail:"VTE prophylaxis. Adjust to UFH 5000u Q8h if CrCl < 30.",guideline:"CHEST Guidelines"},
      {id:"chf-m8",cat:"meds",   priority:"routine",required:false,name:"Acetaminophen 650mg PO Q6h PRN",detail:"Pain/fever. AVOID NSAIDs in HF — contraindicated.",guideline:"AHA HF 2022 Class III"},
      {id:"chf-i1",cat:"imaging",priority:"stat",   required:true, name:"Chest X-ray (PA/Lateral)",   detail:"STAT — assess pulmonary congestion, pleural effusions, cardiomegaly"},
      {id:"chf-i2",cat:"imaging",priority:"stat",   required:true, name:"12-Lead EKG",                detail:"STAT — rule out ACS, arrhythmia, LBBB, AF"},
      {id:"chf-i3",cat:"imaging",priority:"urgent", required:true, name:"Echocardiogram (TTE)",       detail:"Within 24–48h if no recent echo within 3 months. Assess EF, wall motion, valvular disease.",guideline:"AHA HF 2022 Class I"},
      {id:"chf-i4",cat:"imaging",priority:"routine",required:false,name:"Right Heart Catheterization",detail:"Consider if etiology unclear or refractory to management.",guideline:"AHA HF 2022 Class IIa"},
      {id:"chf-c1",cat:"consults",priority:"urgent",required:true, name:"Cardiology Consult",         detail:"URGENT — attending cardiologist for ADHF management and GDMT optimization"},
      {id:"chf-c2",cat:"consults",priority:"routine",required:false,name:"Advanced HF / HF Service",  detail:"If prior HF hospitalization within 6 months, LVAD candidate, or transplant evaluation"},
      {id:"chf-c3",cat:"consults",priority:"routine",required:false,name:"Pharmacy — Med Reconciliation",detail:"GDMT optimization and medication reconciliation prior to discharge"},
      {id:"chf-c4",cat:"consults",priority:"routine",required:false,name:"Social Work",               detail:"Assess barriers: medication adherence, insurance gaps, home support, food/sodium education"},
      {id:"chf-n1",cat:"nursing", priority:"routine",required:true, name:"Fall Precautions",          detail:"Implement — orthostatic hypotension risk with diuresis"},
      {id:"chf-n2",cat:"nursing", priority:"urgent", required:true, name:"O₂ Supplementation Protocol",detail:"Titrate O₂ to SpO₂ ≥ 95%. Document device and flow rate Q4h."},
      {id:"chf-n3",cat:"nursing", priority:"urgent", required:false,name:"Foley Catheter",            detail:"Insert if strict hourly UO monitoring required or patient unable to void"},
      {id:"chf-n4",cat:"nursing", priority:"routine",required:false,name:"SCDs (bilateral)",          detail:"Sequential compression devices, bilateral lower extremities"},
      {id:"chf-n5",cat:"nursing", priority:"routine",required:false,name:"HF Discharge Education",    detail:"Begin Day 1: daily weight, fluid/sodium restriction, medication adherence, return precautions",guideline:"AHA HF 2022"},
    ]
  },

  sepsis: {
    id:"sepsis", name:"Sepsis / Septic Shock", subtitle:"Adult Sepsis — Hour-1 Bundle",
    icon:"🦠", specialty:"Critical Care", acuity:"stat",
    guideline:"Surviving Sepsis Campaign 2021",
    tags:["SIRS","qSOFA","Organ Dysfunction","Hour-1 Bundle","Bacteremia"],
    orders:[
      {id:"sep-a1",cat:"admit",  priority:"stat",   required:true, name:"Admit to",                   detail:"ICU or Step-Down based on hemodynamic stability and organ dysfunction",guideline:"SSC 2021"},
      {id:"sep-a2",cat:"admit",  priority:"stat",   required:true, name:"Level of Care",               detail:"ICU if: vasopressor requirement, lactate > 4, intubation needed, or SOFA ≥ 2",guideline:"SSC 2021"},
      {id:"sep-a3",cat:"admit",  priority:"stat",   required:true, name:"Admitting Diagnosis",         detail:"Sepsis with [suspected source] OR Septic Shock"},
      {id:"sep-a4",cat:"admit",  priority:"urgent", required:true, name:"Code Status",                 detail:"Confirm and document. Goals-of-care within 24h for critically ill."},
      {id:"sep-a5",cat:"admit",  priority:"urgent", required:false,name:"Isolation Precautions",       detail:"Contact/droplet/airborne as indicated. MRSA/VRE if healthcare-associated."},
      {id:"sep-v1",cat:"vitals", priority:"stat",   required:true, name:"Vital Signs",                 detail:"Q1h until hemodynamically stable × 6h, then Q2h"},
      {id:"sep-v2",cat:"vitals", priority:"stat",   required:true, name:"Continuous SpO₂",             detail:"Maintain SpO₂ ≥ 92%"},
      {id:"sep-v3",cat:"vitals", priority:"stat",   required:true, name:"Hourly Urine Output",         detail:"Via Foley. Notify MD if UO < 0.5 mL/kg/hr × 2 consecutive hours.",guideline:"SSC 2021"},
      {id:"sep-v4",cat:"vitals", priority:"stat",   required:true, name:"Telemetry",                   detail:"Continuous cardiac monitoring"},
      {id:"sep-v5",cat:"vitals", priority:"urgent", required:false,name:"Arterial Line",               detail:"Continuous BP monitoring and serial ABGs in septic shock"},
      {id:"sep-d1",cat:"diet",   priority:"urgent", required:true, name:"NPO Initially",               detail:"NPO until hemodynamically stable. Early enteral nutrition within 24–48h.",guideline:"ESPEN 2019"},
      {id:"sep-d2",cat:"diet",   priority:"urgent", required:false,name:"Nutrition Consult",           detail:"Early enteral nutrition assessment within 24h"},
      {id:"sep-d3",cat:"diet",   priority:"urgent", required:true, name:"Activity",                    detail:"Strict bed rest. HOB elevated 30–45° for aspiration prevention (VAP bundle)."},
      {id:"sep-f1",cat:"fluids", priority:"stat",   required:true, name:"IV Access",                   detail:"2 large-bore peripheral IVs (16G+) OR Central Venous Catheter",guideline:"SSC 2021 Hour-1"},
      {id:"sep-f2",cat:"fluids", priority:"stat",   required:true, name:"IV Fluid Resuscitation",      detail:"30 mL/kg IV crystalloid over 3h for sepsis-induced hypoperfusion. Reassess with dynamic fluid responsiveness.",guideline:"SSC 2021 Hour-1 — Class 1B"},
      {id:"sep-f3",cat:"fluids", priority:"stat",   required:false,name:"Norepinephrine (Vasopressor)",detail:"0.1–0.2 mcg/kg/min IV via central line. Titrate to MAP ≥ 65 mmHg. First-line.",high_alert:true,guideline:"SSC 2021 — Class 1B"},
      {id:"sep-f4",cat:"fluids", priority:"urgent", required:false,name:"Vasopressin (adjunct)",       detail:"0.03 units/min IV. Add when norepinephrine > 0.25 mcg/kg/min.",high_alert:true,guideline:"SSC 2021 — Class 2B"},
      {id:"sep-l1",cat:"labs",   priority:"stat",   required:true, name:"Blood Cultures × 2",          detail:"STAT before antibiotics. Do not delay ABx > 45 min to obtain cultures.",guideline:"SSC 2021 Hour-1 — Class 1B"},
      {id:"sep-l2",cat:"labs",   priority:"stat",   required:true, name:"Lactate",                     detail:"STAT. > 2 = sepsis; > 4 = septic shock. Repeat in 2h — target clearance ≥ 10%.",guideline:"SSC 2021 Hour-1 — Class 1C"},
      {id:"sep-l3",cat:"labs",   priority:"stat",   required:true, name:"CBC with differential",       detail:"STAT"},
      {id:"sep-l4",cat:"labs",   priority:"stat",   required:true, name:"CMP (BMP + LFTs)",            detail:"STAT — renal/hepatic dysfunction for organ failure scoring"},
      {id:"sep-l5",cat:"labs",   priority:"stat",   required:true, name:"Coagulation (PT/INR/PTT)",    detail:"STAT — DIC screen"},
      {id:"sep-l6",cat:"labs",   priority:"stat",   required:false,name:"Procalcitonin",               detail:"STAT baseline; serial monitoring guides antibiotic de-escalation",guideline:"SSC 2021 — Class 2B"},
      {id:"sep-l7",cat:"labs",   priority:"stat",   required:true, name:"Urinalysis + Urine Culture",  detail:"STAT; midstream clean-catch or via Foley"},
      {id:"sep-m1",cat:"meds",   priority:"stat",   required:true, name:"Broad-Spectrum Antibiotics",  detail:"STAT within 1h of sepsis recognition. De-escalate per culture results.",guideline:"SSC 2021 Hour-1 — Class 1B"},
      {id:"sep-m2",cat:"meds",   priority:"stat",   required:false,name:"Piperacillin-Tazobactam",     detail:"3.375g IV Q6h (extended infusion 4h). Adjust for renal function.",guideline:"SSC 2021"},
      {id:"sep-m3",cat:"meds",   priority:"stat",   required:false,name:"Vancomycin IV",               detail:"15–20 mg/kg Q8–12h. Load 25–30 mg/kg for severe sepsis. Target AUC/MIC 400–600.",high_alert:true,guideline:"ASHP/SIDP 2020"},
      {id:"sep-m4",cat:"meds",   priority:"urgent", required:false,name:"Hydrocortisone 200mg/day",    detail:"IV infusion ONLY if vasopressor-refractory shock. Taper when vasopressors d/c.",guideline:"SSC 2021 — Class 2C"},
      {id:"sep-m5",cat:"meds",   priority:"urgent", required:false,name:"Insulin Infusion Protocol",   detail:"Target glucose 140–180 mg/dL. Initiate if glucose > 180 × 2.",high_alert:true,guideline:"SSC 2021 — Class 1A"},
      {id:"sep-m6",cat:"meds",   priority:"routine",required:false,name:"Stress Ulcer Prophylaxis",    detail:"Pantoprazole 40mg IV daily. Indicated if on ventilator or coagulopathic.",guideline:"SSC 2021 — Class 2B"},
      {id:"sep-m7",cat:"meds",   priority:"urgent", required:true, name:"VTE Prophylaxis",             detail:"UFH 5000u SQ Q8h OR enoxaparin 40mg SQ daily. SCDs always.",guideline:"SSC 2021 — Class 1B"},
      {id:"sep-i1",cat:"imaging",priority:"stat",   required:true, name:"Chest X-ray (portable AP)",   detail:"STAT — pneumonia, pulmonary edema, line placement confirmation"},
      {id:"sep-i2",cat:"imaging",priority:"urgent", required:false,name:"CT Abdomen/Pelvis + contrast", detail:"URGENT if intra-abdominal source suspected."},
      {id:"sep-i3",cat:"imaging",priority:"urgent", required:false,name:"POCUS — Cardiac + IVC",       detail:"Bedside echo to assess volume status, cardiac function"},
      {id:"sep-i4",cat:"imaging",priority:"stat",   required:true, name:"12-Lead EKG",                 detail:"STAT — rule out MI as precipitant, assess arrhythmia"},
      {id:"sep-c1",cat:"consults",priority:"urgent",required:true, name:"Infectious Disease",          detail:"URGENT for antibiotic selection, source identification, and de-escalation"},
      {id:"sep-c2",cat:"consults",priority:"stat",  required:false,name:"Intensivist / Critical Care", detail:"STAT if septic shock, multi-organ failure, or MV anticipated"},
      {id:"sep-c3",cat:"consults",priority:"stat",  required:false,name:"Surgery",                     detail:"STAT if source control required: abscess, perforation, necrotizing fasciitis"},
      {id:"sep-n1",cat:"nursing", priority:"stat",  required:true, name:"Foley Catheter",              detail:"Insert for strict hourly urine output monitoring per Sepsis protocol",guideline:"SSC 2021"},
      {id:"sep-n2",cat:"nursing", priority:"urgent",required:true, name:"HOB Elevation 30–45°",        detail:"Head of bed 30–45° at all times. VAP prevention bundle."},
      {id:"sep-n3",cat:"nursing", priority:"stat",  required:true, name:"Sepsis Bundle Checklist",     detail:"Initiate institutional Sepsis/SIRS nursing protocol. Document bundle completion time.",guideline:"SSC Hour-1 Bundle"},
      {id:"sep-n4",cat:"nursing", priority:"routine",required:false,name:"Oral Care Q4h",              detail:"Chlorhexidine 0.12% oral rinse Q4h — VAP prevention bundle"},
    ]
  },

  stroke: {
    id:"stroke", name:"Acute Ischemic Stroke", subtitle:"tPA Candidate / Non-tPA Protocol",
    icon:"🧠", specialty:"Neurology", acuity:"stat",
    guideline:"AHA/ASA 2019 Acute Ischemic Stroke Guidelines",
    tags:["tPA","NIHSS","Thrombectomy","LVO","LKWN"],
    orders:[
      {id:"str-a1",cat:"admit",  priority:"stat",   required:true, name:"Admit to",                   detail:"Neurology / Certified Stroke Unit",guideline:"AHA/ASA 2019 Class I"},
      {id:"str-a2",cat:"admit",  priority:"stat",   required:true, name:"Code Stroke Activation",      detail:"Activate institutional Code Stroke protocol immediately upon arrival"},
      {id:"str-a3",cat:"admit",  priority:"stat",   required:true, name:"tPA Eligibility Assessment",  detail:"Evaluate inclusion/exclusion criteria. Onset time ≤ 4.5h from LKWN for IV alteplase.",guideline:"AHA 2019 Class I Level A"},
      {id:"str-a4",cat:"admit",  priority:"urgent", required:true, name:"Code Status",                 detail:"Confirm and document. Goals-of-care within 24h."},
      {id:"str-v1",cat:"vitals", priority:"stat",   required:true, name:"Vital Signs",                 detail:"Q15min × 2h post-tPA OR Q1h if no tPA; then Q4h when stable",guideline:"AHA 2019 — BP management"},
      {id:"str-v2",cat:"vitals", priority:"stat",   required:true, name:"Neurological Checks (NIHSS)", detail:"Q1h × 24h. Notify MD for NIHSS change ≥ 4 points or new deficit.",guideline:"AHA 2019 Class I"},
      {id:"str-v3",cat:"vitals", priority:"stat",   required:true, name:"BP Management Target",        detail:"No tPA: permissive HTN < 220/120. Post-tPA: maintain BP < 180/105 × 24h.",guideline:"AHA 2019 Class I Level B"},
      {id:"str-v4",cat:"vitals", priority:"urgent", required:true, name:"SpO₂ Monitoring",             detail:"Maintain SpO₂ ≥ 94%. Supplemental O₂ ONLY if SpO₂ < 94%.",guideline:"AHA 2019 Class III if normoxic"},
      {id:"str-v5",cat:"vitals", priority:"stat",   required:true, name:"Telemetry",                   detail:"Continuous × 24h minimum. Detect paroxysmal AF as embolic source.",guideline:"AHA 2019 Class I"},
      {id:"str-v6",cat:"vitals", priority:"urgent", required:true, name:"Temperature Monitoring",      detail:"Q4h. Treat fever > 38°C aggressively with acetaminophen.",guideline:"AHA 2019 Class I Level C"},
      {id:"str-v7",cat:"vitals", priority:"urgent", required:true, name:"Blood Glucose Monitoring",    detail:"Q1–2h if tPA; Q4–6h otherwise. Target 140–180. Treat hypoglycemia immediately.",guideline:"AHA 2019 Class I"},
      {id:"str-d1",cat:"diet",   priority:"urgent", required:true, name:"NPO — Swallow Screen First",  detail:"Nothing by mouth until formal dysphagia screen or SLP evaluation",guideline:"AHA 2019 Class I"},
      {id:"str-d2",cat:"diet",   priority:"urgent", required:true, name:"Activity — Strict Bed Rest",  detail:"Strict bed rest × 24h. No early mobilization if large territory infarct or tPA given.",guideline:"AHA 2019 Class IIb"},
      {id:"str-f1",cat:"fluids", priority:"stat",   required:true, name:"IV Access",                   detail:"18G or larger peripheral IV × 1. Avoid femoral access."},
      {id:"str-f2",cat:"fluids", priority:"urgent", required:true, name:"Normal Saline (0.9% NaCl)",   detail:"Maintenance IV fluids. Avoid hypotonic fluids (worsen cerebral edema).",guideline:"AHA 2019"},
      {id:"str-f3",cat:"fluids", priority:"stat",   required:false,name:"Labetalol IV (BP Management)",detail:"10–20 mg IV over 1–2 min; repeat Q10–20 min PRN if BP > 185/110 (pre-tPA). Max 300 mg/day.",guideline:"AHA 2019 Class I"},
      {id:"str-l1",cat:"labs",   priority:"stat",   required:true, name:"CT Head (non-contrast)",      detail:"STAT — must be done BEFORE tPA decision (< 25 min door-to-CT)",guideline:"AHA 2019 Class I"},
      {id:"str-l2",cat:"labs",   priority:"stat",   required:true, name:"POC Glucose",                 detail:"STAT. Must be 50–400 mg/dL for tPA eligibility.",guideline:"AHA 2019"},
      {id:"str-l3",cat:"labs",   priority:"stat",   required:true, name:"PT/INR, aPTT",               detail:"STAT — tPA exclusion if INR > 1.7 or aPTT supratherapeutic",guideline:"AHA 2019"},
      {id:"str-l4",cat:"labs",   priority:"stat",   required:true, name:"CBC with platelets",          detail:"STAT — tPA exclusion if platelets < 100,000"},
      {id:"str-l5",cat:"labs",   priority:"stat",   required:true, name:"CMP",                         detail:"STAT"},
      {id:"str-l6",cat:"labs",   priority:"stat",   required:true, name:"Troponin I (hsTnI)",          detail:"STAT — elevated in ~50% of stroke. Rule out concurrent ACS."},
      {id:"str-l7",cat:"labs",   priority:"routine",required:false,name:"HbA1c",                       detail:"Diabetes management and stroke risk factor assessment"},
      {id:"str-l8",cat:"labs",   priority:"routine",required:false,name:"Hypercoagulable Panel",       detail:"If young patient (< 55yo) or cryptogenic stroke. Protein C/S, Factor V Leiden."},
      {id:"str-m1",cat:"meds",   priority:"stat",   required:false,name:"IV Alteplase (tPA) 0.9 mg/kg",detail:"IF ELIGIBLE: Max 90 mg. 10% bolus over 1 min, remainder over 60 min. Within 4.5h of LKWN.",high_alert:true,guideline:"AHA 2019 Class I Level A"},
      {id:"str-m2",cat:"meds",   priority:"urgent", required:true, name:"Aspirin 325mg (loading dose)",detail:"Start 24h post-tPA OR immediately if no tPA. Reduces early stroke recurrence.",guideline:"AHA 2019 Class I Level A"},
      {id:"str-m3",cat:"meds",   priority:"urgent", required:true, name:"Atorvastatin 80mg PO daily",  detail:"Start on admission regardless of baseline LDL. High-intensity statin (SPARCL).",guideline:"AHA 2019 Class I Level A"},
      {id:"str-m4",cat:"meds",   priority:"urgent", required:true, name:"Acetaminophen 650mg Q6h PRN", detail:"Fever management. Target normothermia. AVOID NSAIDs.",guideline:"AHA 2019 — Class I"},
      {id:"str-m5",cat:"meds",   priority:"urgent", required:true, name:"Insulin Sliding Scale",       detail:"Target glucose 140–180. Avoid hypoglycemia < 60 (mimics stroke).",guideline:"AHA 2019 Class I"},
      {id:"str-m6",cat:"meds",   priority:"routine",required:true, name:"VTE Prophylaxis",             detail:"Enoxaparin 40mg SQ daily — start after 24h from tPA completion. SCDs always.",guideline:"AHA 2019 Class I"},
      {id:"str-i1",cat:"imaging",priority:"stat",   required:true, name:"CT Head + CTA Head/Neck",     detail:"STAT — within 45 min. LVO assessment for thrombectomy eligibility.",guideline:"AHA 2019 Class I"},
      {id:"str-i2",cat:"imaging",priority:"urgent", required:false,name:"MRI Brain with DWI",          detail:"Preferred for infarct characterization. FLAIR mismatch for wake-up stroke.",guideline:"AHA 2019 Class I for DWI"},
      {id:"str-i3",cat:"imaging",priority:"urgent", required:false,name:"CT Perfusion (CTP)",          detail:"If 6–24h from LKWN and LVO identified — DAWN/DEFUSE-3 criteria.",guideline:"DAWN / DEFUSE-3 Trials"},
      {id:"str-i4",cat:"imaging",priority:"urgent", required:false,name:"Echocardiogram (TTE/TEE)",    detail:"Within 24–48h — cardioembolic source workup: AF, thrombus, PFO",guideline:"AHA 2019 Class IIa"},
      {id:"str-i5",cat:"imaging",priority:"stat",   required:true, name:"12-Lead EKG",                 detail:"STAT — AF detection, concurrent ACS screening"},
      {id:"str-c1",cat:"consults",priority:"stat",  required:true, name:"Neurology (Stroke Attending)",detail:"STAT — code stroke protocol activation"},
      {id:"str-c2",cat:"consults",priority:"stat",  required:false,name:"Neuroradiology / Neurosurgery",detail:"STAT if LVO on CTA for mechanical thrombectomy. Time = brain.",guideline:"AHA 2019 Class I Level A"},
      {id:"str-c3",cat:"consults",priority:"urgent",required:true, name:"Speech-Language Pathology",   detail:"STAT for dysphagia screen and formal swallow evaluation",guideline:"AHA 2019 Class I"},
      {id:"str-c4",cat:"consults",priority:"urgent",required:false,name:"Physical & Occupational Therapy",detail:"Within 24h of stabilization for early rehabilitation assessment",guideline:"AHA 2019 Class I"},
      {id:"str-n1",cat:"nursing", priority:"stat",  required:false,name:"Post-tPA Monitoring Protocol",detail:"BP Q15min × 2h, Q30min × 6h, Q1h × 16h. Neuro checks Q1h. No anticoagulants × 24h.",guideline:"AHA 2019"},
      {id:"str-n2",cat:"nursing", priority:"urgent",required:true, name:"Head of Bed Position",        detail:"HOB flat (0°) × 24h unless ICP concern or aspiration risk.",guideline:"AHA 2019 Class IIb"},
      {id:"str-n3",cat:"nursing", priority:"routine",required:true,name:"SCDs",                        detail:"Sequential compression devices, bilateral lower extremities on admission"},
      {id:"str-n4",cat:"nursing", priority:"urgent",required:true, name:"Fall Precautions",            detail:"High fall risk due to neurological deficits. Implement immediately."},
    ]
  },

  dka: {
    id:"dka", name:"Diabetic Ketoacidosis (DKA)", subtitle:"Adult DKA — ADA Protocol",
    icon:"🩸", specialty:"Endocrinology", acuity:"urgent",
    guideline:"ADA 2024 Standards of Care — DKA/HHS Management",
    tags:["Type 1 DM","Type 2 DM","Anion Gap","Euglycemic DKA","SGLT2i"],
    orders:[
      {id:"dka-a1",cat:"admit",  priority:"urgent", required:true, name:"Admit to",                   detail:"Medical floor if mild-moderate DKA (pH > 7.20). ICU if severe (pH < 7.0) or hemodynamic instability.",guideline:"ADA 2024"},
      {id:"dka-a2",cat:"admit",  priority:"urgent", required:true, name:"Admitting Diagnosis",         detail:"Diabetic Ketoacidosis — [Mild/Moderate/Severe]. Precipitant: [infection/missed insulin/new DM/SGLT2i/other]"},
      {id:"dka-a3",cat:"admit",  priority:"urgent", required:true, name:"HOLD all SGLT2 Inhibitors",   detail:"CRITICAL: Discontinue dapagliflozin, empagliflozin, canagliflozin — cause euglycemic DKA. Do not restart until fully resolved > 48h.",guideline:"ADA 2024 — SGLT2i DKA risk"},
      {id:"dka-a4",cat:"admit",  priority:"routine",required:true, name:"Code Status",                 detail:"Confirm and document"},
      {id:"dka-v1",cat:"vitals", priority:"urgent", required:true, name:"Vital Signs",                 detail:"Q1h until hemodynamically stable; Q2h when improved"},
      {id:"dka-v2",cat:"vitals", priority:"urgent", required:true, name:"POC Glucose Monitoring",      detail:"Q1h while on insulin infusion. Target 150–200 mg/dL during active DKA treatment.",guideline:"ADA 2024"},
      {id:"dka-v3",cat:"vitals", priority:"urgent", required:true, name:"Strict I&O",                  detail:"Q1h. Foley for accurate output monitoring if obtunded or hemodynamically unstable."},
      {id:"dka-v4",cat:"vitals", priority:"urgent", required:true, name:"Serial Anion Gap Trending",   detail:"AG = Na − (Cl + HCO₃). DKA resolution: AG ≤ 12, pH > 7.3, bicarb > 18, glucose < 200.",guideline:"ADA 2024"},
      {id:"dka-v5",cat:"vitals", priority:"urgent", required:true, name:"Neurological Status (GCS)",   detail:"Q2h. Alert MD for any mental status change — cerebral edema risk."},
      {id:"dka-d1",cat:"diet",   priority:"urgent", required:true, name:"NPO Initially",               detail:"NPO until nausea/vomiting resolved. Advance to diabetic diet when DKA resolving."},
      {id:"dka-d2",cat:"diet",   priority:"routine",required:false,name:"Dietary Consult",             detail:"Diabetes diet education, carbohydrate counting, sick day rules"},
      {id:"dka-f1",cat:"fluids", priority:"urgent", required:true, name:"IV Access",                   detail:"2 large-bore peripheral IVs (18G or larger)"},
      {id:"dka-f2",cat:"fluids", priority:"urgent", required:true, name:"0.9% NaCl — Initial Resuscitation",detail:"1L IV over first hour. After 1L NS: switch to 0.45% NaCl + 20 mEq KCl at 250–500 mL/hr.",guideline:"ADA 2024 Class A"},
      {id:"dka-f3",cat:"fluids", priority:"urgent", required:true, name:"D5W/0.45% NaCl (Two-Bag System)",detail:"Add when glucose reaches 200–250 mg/dL. Prevents hypoglycemia while continuing insulin.",guideline:"ADA 2024 — Two-bag system"},
      {id:"dka-l1",cat:"labs",   priority:"stat",   required:true, name:"BMP",                         detail:"STAT on admission; repeat Q2–4h until resolved. Track AG, bicarb, glucose, K⁺.",guideline:"ADA 2024"},
      {id:"dka-l2",cat:"labs",   priority:"stat",   required:true, name:"ABG or Venous Blood Gas",     detail:"STAT — pH, pCO₂, bicarb. Venous pH acceptable if pH > 6.9 and patient stable.",guideline:"ADA 2024"},
      {id:"dka-l3",cat:"labs",   priority:"stat",   required:true, name:"Beta-Hydroxybutyrate",        detail:"STAT on admission; repeat Q4h. Target < 0.6 mmol/L for resolution.",guideline:"ADA 2024"},
      {id:"dka-l4",cat:"labs",   priority:"stat",   required:true, name:"CBC with differential",       detail:"WBC > 25K suggests superimposed infection. Leukocytosis expected in DKA."},
      {id:"dka-l5",cat:"labs",   priority:"stat",   required:true, name:"Magnesium, Phosphorus",       detail:"STAT — frequently depleted in DKA. Replete if symptomatic.",guideline:"ADA 2024"},
      {id:"dka-l6",cat:"labs",   priority:"urgent", required:false,name:"HbA1c",                       detail:"Assess chronic glycemic control and guide insulin dose calculations at discharge"},
      {id:"dka-l7",cat:"labs",   priority:"stat",   required:false,name:"Blood Cultures × 2",          detail:"If infection suspected as precipitant (fever, leukocytosis > 25K)"},
      {id:"dka-l8",cat:"labs",   priority:"stat",   required:true, name:"Urinalysis + Urine Culture",  detail:"STAT — rule out UTI as common precipitant of DKA"},
      {id:"dka-l9",cat:"labs",   priority:"routine",required:false,name:"Lipase",                      detail:"If abdominal pain prominent — rule out acute pancreatitis as precipitant"},
      {id:"dka-m1",cat:"meds",   priority:"urgent", required:true, name:"Regular Insulin IV Infusion",  detail:"0.1 units/kg/hr continuous IV. Decrease to 0.02–0.05 units/kg/hr when glucose < 200 while adding dextrose.",high_alert:true,guideline:"ADA 2024 Class A"},
      {id:"dka-m2",cat:"meds",   priority:"urgent", required:true, name:"Potassium Replacement Protocol",detail:"CRITICAL: HOLD insulin if K⁺ < 3.3. Replace 20–40 mEq/hr until K⁺ ≥ 3.3. Add KCl to all IV fluids once K⁺ < 5.0. Target K⁺ 4.0–5.0.",high_alert:true,guideline:"ADA 2024 — CRITICAL"},
      {id:"dka-m3",cat:"meds",   priority:"urgent", required:false,name:"Sodium Bicarbonate",           detail:"50–100 mEq IV over 2h ONLY if pH < 6.9. Do NOT use if pH ≥ 7.0.",guideline:"ADA 2024 — Limited use"},
      {id:"dka-m4",cat:"meds",   priority:"urgent", required:true, name:"Transition to Subcutaneous Insulin",detail:"When resolved (pH > 7.3, bicarb > 18, AG ≤ 12, tolerating PO): overlap SC insulin 1–2h before stopping drip.",guideline:"ADA 2024 — Critical step"},
      {id:"dka-m5",cat:"meds",   priority:"routine",required:false,name:"Ondansetron 4mg IV Q6h PRN",  detail:"Nausea/vomiting control; facilitates oral intake transition"},
      {id:"dka-m6",cat:"meds",   priority:"routine",required:false,name:"VTE Prophylaxis",             detail:"Enoxaparin 40mg SQ daily when hemodynamically stable. SCDs always."},
      {id:"dka-i1",cat:"imaging",priority:"urgent", required:true, name:"Chest X-ray",                 detail:"On admission — rule out pneumonia as precipitant of DKA"},
      {id:"dka-i2",cat:"imaging",priority:"stat",   required:true, name:"12-Lead EKG",                 detail:"STAT — hyperkalemia-related changes (peaked T-waves, widened QRS) are immediately life-threatening.",guideline:"DKA — K⁺ monitoring"},
      {id:"dka-i3",cat:"imaging",priority:"urgent", required:false,name:"CT Head (non-contrast)",      detail:"If altered mental status or concern for cerebral edema."},
      {id:"dka-c1",cat:"consults",priority:"urgent",required:true, name:"Endocrinology / Diabetes Team",detail:"On admission for insulin regimen optimization and discharge planning"},
      {id:"dka-c2",cat:"consults",priority:"routine",required:false,name:"Diabetes Education (CDE)",    detail:"Prior to discharge: insulin technique, sick day rules, ketone monitoring at home"},
      {id:"dka-c3",cat:"consults",priority:"routine",required:false,name:"Social Work",                 detail:"If insulin access, cost barriers, food insecurity, or psychiatric barriers identified"},
      {id:"dka-n1",cat:"nursing", priority:"urgent",required:true, name:"DKA Flow Sheet",              detail:"Hourly glucose, I&O, BMP results, anion gap, insulin rate, fluid rate in DKA flow sheet"},
      {id:"dka-n2",cat:"nursing", priority:"urgent",required:false,name:"Foley Catheter",              detail:"Insert if altered mental status, hemodynamically unstable, or strict I&O required"},
      {id:"dka-n3",cat:"nursing", priority:"urgent",required:true, name:"Cardiac Monitoring",          detail:"Continuous ECG monitoring for potassium-related changes. Alert MD for peaked T-waves or widened QRS."},
      {id:"dka-n4",cat:"nursing", priority:"urgent",required:true, name:"Insulin Drip Protocol",       detail:"Two-nurse verification before initiating insulin infusion. Follow institutional DKA insulin protocol exactly."},
    ]
  },

  // Additional Cardiovascular Conditions
  acute_mi: {
    id:"acute_mi", name:"Acute STEMI", subtitle:"ST-Elevation Myocardial Infarction",
    icon:"💔", specialty:"Cardiology", acuity:"stat",
    guideline:"ACC/AHA 2023 STEMI Guidelines",
    tags:["PCI","Cath Lab","Door-to-Balloon","Antiplatelet"],
    orders:[
      {id:"mi-a1",cat:"admit",priority:"stat",required:true,name:"Activate Cath Lab",detail:"STAT Code STEMI. Target door-to-balloon < 90 min",guideline:"ACC/AHA 2023 Class I"},
      {id:"mi-a2",cat:"admit",priority:"stat",required:true,name:"Admit to CCU",detail:"Coronary Care Unit with telemetry"},
      {id:"mi-v1",cat:"vitals",priority:"stat",required:true,name:"Continuous Telemetry",detail:"Cardiac monitoring for arrhythmia detection"},
      {id:"mi-v2",cat:"vitals",priority:"urgent",required:true,name:"Vital Signs Q15min",detail:"Until hemodynamically stable × 1h, then Q1h × 4h"},
      {id:"mi-l1",cat:"labs",priority:"stat",required:true,name:"Troponin I serial",detail:"STAT, 3h, 6h. Peak typically 12-24h"},
      {id:"mi-l2",cat:"labs",priority:"stat",required:true,name:"BMP, Mg, CBC",detail:"STAT baseline labs"},
      {id:"mi-m1",cat:"meds",priority:"stat",required:true,name:"Aspirin 325mg chew",detail:"STAT loading dose. Reduces mortality 23%",guideline:"ACC/AHA 2023 Class I"},
      {id:"mi-m2",cat:"meds",priority:"stat",required:true,name:"Ticagrelor 180mg OR Prasugrel 60mg",detail:"P2Y12 inhibitor loading. Ticagrelor preferred if > 75yo",high_alert:true,guideline:"ACC/AHA 2023"},
      {id:"mi-m3",cat:"meds",priority:"stat",required:true,name:"Heparin bolus + infusion",detail:"70 units/kg bolus, then 12 units/kg/hr. Target aPTT 50-70s",high_alert:true},
      {id:"mi-m4",cat:"meds",priority:"stat",required:true,name:"Atorvastatin 80mg",detail:"High-intensity statin. Start immediately",guideline:"ACC/AHA 2023"},
      {id:"mi-i1",cat:"imaging",priority:"stat",required:true,name:"12-Lead EKG",detail:"STAT — repeat Q15-30min if pain recurs"},
      {id:"mi-i2",cat:"imaging",priority:"urgent",required:true,name:"Chest X-ray portable",detail:"On admission"},
      {id:"mi-c1",cat:"consults",priority:"stat",required:true,name:"Interventional Cardiology",detail:"STAT for emergent PCI"},
    ]
  },

  copd: {
    id:"copd", name:"COPD Exacerbation", subtitle:"Acute Exacerbation of COPD",
    icon:"🫁", specialty:"Respiratory", acuity:"urgent",
    guideline:"GOLD 2024 COPD Guidelines",
    tags:["Bronchodilators","Steroids","ABG","NIV"],
    orders:[
      {id:"copd-a1",cat:"admit",priority:"urgent",required:true,name:"Admit to Telemetry",detail:"Medical floor with telemetry. ICU if respiratory failure"},
      {id:"copd-v1",cat:"vitals",priority:"urgent",required:true,name:"Continuous SpO₂",detail:"Target 88-92%. Avoid hyperoxia (worsens CO₂ retention)",guideline:"GOLD 2024"},
      {id:"copd-v2",cat:"vitals",priority:"urgent",required:true,name:"Vital Signs Q4h",detail:"HR, BP, RR, SpO₂, Temp"},
      {id:"copd-l1",cat:"labs",priority:"stat",required:true,name:"ABG",detail:"STAT — assess pH, pCO₂, pO₂. Respiratory acidosis?"},
      {id:"copd-l2",cat:"labs",priority:"stat",required:true,name:"CBC, BMP",detail:"STAT baseline"},
      {id:"copd-m1",cat:"meds",priority:"stat",required:true,name:"Albuterol 2.5mg + Ipratropium 0.5mg neb",detail:"Q4h. Continuous albuterol if severe",guideline:"GOLD 2024 Class I"},
      {id:"copd-m2",cat:"meds",priority:"urgent",required:true,name:"Prednisone 40mg PO daily × 5 days",detail:"OR Methylprednisolone 125mg IV Q6h if NPO",guideline:"GOLD 2024 — reduces length of stay"},
      {id:"copd-m3",cat:"meds",priority:"urgent",required:true,name:"Azithromycin 500mg PO daily × 5d",detail:"If purulent sputum or increased sputum volume",guideline:"GOLD 2024"},
      {id:"copd-i1",cat:"imaging",priority:"stat",required:true,name:"Chest X-ray PA/Lateral",detail:"Rule out pneumonia, pneumothorax"},
      {id:"copd-n1",cat:"nursing",priority:"urgent",required:false,name:"BiPAP Protocol",detail:"If pH < 7.35, pCO₂ > 45, RR > 25. Initiate NIV"},
    ]
  },

  asthma: {
    id:"asthma", name:"Severe Asthma Exacerbation", subtitle:"Acute Asthma Attack",
    icon:"💨", specialty:"Respiratory", acuity:"urgent",
    guideline:"GINA 2024 Asthma Guidelines",
    tags:["Status Asthmaticus","Peak Flow","Beta-Agonist"],
    orders:[
      {id:"ast-a1",cat:"admit",priority:"urgent",required:true,name:"Admit to Telemetry / ICU",detail:"ICU if impending respiratory failure, silent chest, altered MS"},
      {id:"ast-v1",cat:"vitals",priority:"stat",required:true,name:"Peak Flow Monitoring",detail:"Baseline, then Q1h during acute treatment"},
      {id:"ast-l1",cat:"labs",priority:"stat",required:true,name:"ABG",detail:"If SpO₂ < 92% or severe distress"},
      {id:"ast-m1",cat:"meds",priority:"stat",required:true,name:"Continuous Albuterol Neb",detail:"2.5-5mg continuous nebulization",guideline:"GINA 2024"},
      {id:"ast-m2",cat:"meds",priority:"stat",required:true,name:"Ipratropium 0.5mg neb Q20min × 3",detail:"Add to albuterol for severe exacerbation"},
      {id:"ast-m3",cat:"meds",priority:"stat",required:true,name:"Methylprednisolone 125mg IV",detail:"Q6h × 48h. Switch to prednisone 60mg PO when improved",guideline:"GINA 2024"},
      {id:"ast-m4",cat:"meds",priority:"urgent",required:false,name:"Magnesium Sulfate 2g IV",detail:"Over 20 min if life-threatening or refractory",guideline:"GINA 2024"},
      {id:"ast-i1",cat:"imaging",priority:"urgent",required:true,name:"Chest X-ray",detail:"Rule out pneumothorax, pneumomediastinum"},
    ]
  },

  pneumonia: {
    id:"pneumonia", name:"Community-Acquired Pneumonia", subtitle:"CAP — PORT/CURB-65 Stratified",
    icon:"🦠", specialty:"Respiratory", acuity:"urgent",
    guideline:"IDSA/ATS 2024 CAP Guidelines",
    tags:["CURB-65","Antibiotics","Sepsis"],
    orders:[
      {id:"pna-a1",cat:"admit",priority:"urgent",required:true,name:"Admit per CURB-65",detail:"Floor if CURB-65 0-1. ICU if severe CAP or sepsis"},
      {id:"pna-l1",cat:"labs",priority:"stat",required:true,name:"Blood Cultures × 2",detail:"STAT before antibiotics"},
      {id:"pna-l2",cat:"labs",priority:"stat",required:true,name:"Sputum Culture + Gram Stain",detail:"If productive cough"},
      {id:"pna-l3",cat:"labs",priority:"stat",required:true,name:"CBC, BMP, Lactate",detail:"STAT"},
      {id:"pna-m1",cat:"meds",priority:"stat",required:true,name:"Ceftriaxone 2g IV Q24h",detail:"STAT first dose. Covers S. pneumoniae",guideline:"IDSA 2024"},
      {id:"pna-m2",cat:"meds",priority:"stat",required:true,name:"Azithromycin 500mg IV daily",detail:"Atypical coverage. Switch to PO when improved",guideline:"IDSA 2024"},
      {id:"pna-i1",cat:"imaging",priority:"stat",required:true,name:"Chest X-ray PA/Lateral",detail:"STAT — confirms infiltrate"},
    ]
  },

  gi_bleed_upper: {
    id:"gi_bleed_upper", name:"Upper GI Bleed", subtitle:"Acute UGIB — Hematemesis / Melena",
    icon:"🩸", specialty:"Gastroenterology", acuity:"urgent",
    guideline:"ACG 2021 UGIB Guidelines",
    tags:["Hematemesis","Melena","Varices","PPI"],
    orders:[
      {id:"gib-a1",cat:"admit",priority:"urgent",required:true,name:"Admit to ICU/Step-Down",detail:"ICU if hemodynamically unstable or massive bleed"},
      {id:"gib-v1",cat:"vitals",priority:"stat",required:true,name:"Vital Signs Q15min",detail:"Until stable, then Q1h"},
      {id:"gib-f1",cat:"fluids",priority:"stat",required:true,name:"2 large-bore IVs",detail:"18G or larger"},
      {id:"gib-f2",cat:"fluids",priority:"stat",required:true,name:"LR or NS bolus 1-2L",detail:"Aggressive volume resuscitation. Target MAP > 65"},
      {id:"gib-l1",cat:"labs",priority:"stat",required:true,name:"Type & Cross 4 units pRBCs",detail:"STAT. Transfuse if Hgb < 7 (restrictive strategy)",guideline:"ACG 2021"},
      {id:"gib-l2",cat:"labs",priority:"stat",required:true,name:"CBC, BMP, PT/INR, Lactate",detail:"STAT baseline"},
      {id:"gib-m1",cat:"meds",priority:"stat",required:true,name:"Pantoprazole 80mg IV bolus",detail:"Then 8mg/hr infusion × 72h",guideline:"ACG 2021"},
      {id:"gib-m2",cat:"meds",priority:"stat",required:false,name:"Octreotide 50mcg bolus + infusion",detail:"If variceal bleed suspected. 50mcg/hr infusion",guideline:"ACG 2021"},
      {id:"gib-m3",cat:"meds",priority:"stat",required:false,name:"Ceftriaxone 1g IV daily",detail:"If cirrhosis — prevent SBP and bacterial infections",guideline:"ACG 2021"},
      {id:"gib-c1",cat:"consults",priority:"stat",required:true,name:"GI for Emergent EGD",detail:"STAT — within 12-24h for most; emergent if massive bleed"},
    ]
  },

  pancreatitis: {
    id:"pancreatitis", name:"Acute Pancreatitis", subtitle:"Acute Interstitial Pancreatitis",
    icon:"🫃", specialty:"Gastroenterology", acuity:"urgent",
    guideline:"ACG 2023 Pancreatitis Guidelines",
    tags:["Lipase","ERCP","Ranson Criteria"],
    orders:[
      {id:"pan-a1",cat:"admit",priority:"urgent",required:true,name:"Admit to Floor/ICU",detail:"ICU if severe or organ failure"},
      {id:"pan-d1",cat:"diet",priority:"urgent",required:true,name:"NPO",detail:"Until pain improved, then advance diet as tolerated",guideline:"ACG 2023"},
      {id:"pan-f1",cat:"fluids",priority:"stat",required:true,name:"LR 250-500 mL/hr",detail:"Aggressive IV fluids. LR superior to NS",guideline:"ACG 2023 Class I"},
      {id:"pan-l1",cat:"labs",priority:"stat",required:true,name:"Lipase",detail:"STAT — typically > 3× ULN"},
      {id:"pan-l2",cat:"labs",priority:"stat",required:true,name:"CBC, CMP, Lactate",detail:"STAT"},
      {id:"pan-m1",cat:"meds",priority:"urgent",required:true,name:"Hydromorphone 0.5-1mg IV Q3h PRN",detail:"Pain control. Avoid morphine"},
      {id:"pan-i1",cat:"imaging",priority:"urgent",required:true,name:"CT Abdomen/Pelvis + contrast",detail:"If diagnosis uncertain or severe. Wait 72h for necrosis assessment"},
      {id:"pan-i2",cat:"imaging",priority:"urgent",required:true,name:"RUQ Ultrasound",detail:"Rule out gallstones as etiology"},
    ]
  },

  aki: {
    id:"aki", name:"Acute Kidney Injury", subtitle:"AKI — KDIGO Staging",
    icon:"🩻", specialty:"Nephrology", acuity:"urgent",
    guideline:"KDIGO 2024 AKI Guidelines",
    tags:["Creatinine","Oliguria","Pre-renal","ATN"],
    orders:[
      {id:"aki-a1",cat:"admit",priority:"urgent",required:true,name:"Admit to Medicine",detail:"ICU if severe AKI (Stage 3) or hyperkalemia"},
      {id:"aki-v1",cat:"vitals",priority:"urgent",required:true,name:"Strict I&O",detail:"Q1h. Foley for accurate UOP"},
      {id:"aki-l1",cat:"labs",priority:"stat",required:true,name:"BMP",detail:"STAT, then Q6-12h"},
      {id:"aki-l2",cat:"labs",priority:"stat",required:true,name:"Urinalysis + Microscopy",detail:"STAT — assess for ATN (muddy brown casts)"},
      {id:"aki-l3",cat:"labs",priority:"stat",required:true,name:"Urine Na, Cr, Osmolality",detail:"Calculate FENa (< 1% = pre-renal)"},
      {id:"aki-f1",cat:"fluids",priority:"urgent",required:true,name:"IV Fluid Challenge",detail:"500mL NS bolus. Assess response. Hold if volume overload"},
      {id:"aki-m1",cat:"meds",priority:"urgent",required:true,name:"STOP nephrotoxins",detail:"Hold NSAIDs, ACEi/ARB, aminoglycosides, contrast"},
      {id:"aki-i1",cat:"imaging",priority:"urgent",required:true,name:"Renal Ultrasound",detail:"Rule out obstruction"},
      {id:"aki-c1",cat:"consults",priority:"urgent",required:false,name:"Nephrology",detail:"If Stage 3 AKI, hyperkalemia > 6.5, or dialysis indication"},
    ]
  },

  hyperkalemia: {
    id:"hyperkalemia", name:"Severe Hyperkalemia", subtitle:"K⁺ > 6.0 mEq/L",
    icon:"⚡", specialty:"Nephrology", acuity:"stat",
    guideline:"Nephrology Practice Guidelines 2024",
    tags:["EKG Changes","Dialysis","Calcium Gluconate"],
    orders:[
      {id:"hk-a1",cat:"admit",priority:"stat",required:true,name:"Admit to Telemetry/ICU",detail:"ICU if EKG changes or K⁺ > 7.0"},
      {id:"hk-v1",cat:"vitals",priority:"stat",required:true,name:"Continuous Telemetry",detail:"Monitor for arrhythmia"},
      {id:"hk-l1",cat:"labs",priority:"stat",required:true,name:"BMP",detail:"STAT, repeat in 1-2h after treatment"},
      {id:"hk-i1",cat:"imaging",priority:"stat",required:true,name:"12-Lead EKG",detail:"STAT — peaked T-waves, widened QRS, sine wave pattern"},
      {id:"hk-m1",cat:"meds",priority:"stat",required:true,name:"Calcium Gluconate 1g IV",detail:"STAT if EKG changes. Cardioprotective. Give over 3 min",high_alert:true},
      {id:"hk-m2",cat:"meds",priority:"stat",required:true,name:"Insulin 10 units + D50 50mL IV",detail:"Shifts K⁺ intracellularly. Onset 15-30 min",high_alert:true},
      {id:"hk-m3",cat:"meds",priority:"stat",required:true,name:"Albuterol 10-20mg neb",detail:"Continuous. Shifts K⁺ into cells"},
      {id:"hk-m4",cat:"meds",priority:"urgent",required:true,name:"Sodium Polystyrene 30g PO/PR",detail:"Removes K⁺ from body. Takes hours"},
      {id:"hk-c1",cat:"consults",priority:"stat",required:false,name:"Nephrology — Emergent Dialysis",detail:"If K⁺ > 7.5, refractory, or severe EKG changes"},
    ]
  },

  anaphylaxis: {
    id:"anaphylaxis", name:"Anaphylaxis", subtitle:"Severe Allergic Reaction",
    icon:"🚨", specialty:"Critical Care", acuity:"stat",
    guideline:"World Allergy Organization 2024",
    tags:["Epinephrine","Antihistamine","Biphasic Reaction"],
    orders:[
      {id:"ana-a1",cat:"admit",priority:"stat",required:true,name:"Admit for Observation",detail:"24h observation for biphasic reaction (10-20% risk)"},
      {id:"ana-v1",cat:"vitals",priority:"stat",required:true,name:"Continuous SpO₂ + Telemetry",detail:"Monitor airway, breathing, circulation"},
      {id:"ana-m1",cat:"meds",priority:"stat",required:true,name:"Epinephrine 0.3mg IM",detail:"STAT in lateral thigh. Repeat Q5-15min PRN",high_alert:true,guideline:"WAO 2024 Class I"},
      {id:"ana-m2",cat:"meds",priority:"urgent",required:true,name:"Diphenhydramine 50mg IV",detail:"H1 blocker"},
      {id:"ana-m3",cat:"meds",priority:"urgent",required:true,name:"Ranitidine 50mg IV",detail:"H2 blocker"},
      {id:"ana-m4",cat:"meds",priority:"urgent",required:true,name:"Methylprednisolone 125mg IV",detail:"Prevents late-phase reaction"},
      {id:"ana-f1",cat:"fluids",priority:"stat",required:true,name:"NS 1-2L rapid bolus",detail:"If hypotensive"},
      {id:"ana-c1",cat:"consults",priority:"urgent",required:false,name:"Allergy/Immunology",detail:"Outpatient referral for allergy testing and EpiPen prescription"},
    ]
  },

  ich: {
    id:"ich", name:"Intracerebral Hemorrhage", subtitle:"Spontaneous ICH",
    icon:"🧠", specialty:"Neurology", acuity:"stat",
    guideline:"AHA/ASA 2022 ICH Guidelines",
    tags:["BP Control","Reversal","ICP Monitoring"],
    orders:[
      {id:"ich-a1",cat:"admit",priority:"stat",required:true,name:"Admit to Neuro ICU",detail:"STAT neurocritical care"},
      {id:"ich-v1",cat:"vitals",priority:"stat",required:true,name:"BP Control Target",detail:"SBP 140-160 mmHg if no ICP concern",guideline:"AHA 2022 INTERACT-2"},
      {id:"ich-v2",cat:"vitals",priority:"stat",required:true,name:"Neuro Checks Q1h",detail:"GCS, pupils, motor exam"},
      {id:"ich-l1",cat:"labs",priority:"stat",required:true,name:"PT/INR, aPTT, CBC",detail:"STAT coagulation studies"},
      {id:"ich-m1",cat:"meds",priority:"stat",required:true,name:"Reverse Anticoagulation",detail:"If on warfarin: Vitamin K + 4F-PCC. If on DOAC: idarucizumab or andexanet",high_alert:true},
      {id:"ich-m2",cat:"meds",priority:"stat",required:false,name:"Nicardipine Infusion",detail:"5-15 mg/hr for BP control",high_alert:true},
      {id:"ich-i1",cat:"imaging",priority:"stat",required:true,name:"CT Head non-contrast",detail:"STAT. Repeat in 6h to assess expansion"},
      {id:"ich-i2",cat:"imaging",priority:"stat",required:true,name:"CTA Head",detail:"STAT — spot sign predicts hematoma expansion"},
      {id:"ich-c1",cat:"consults",priority:"stat",required:true,name:"Neurosurgery",detail:"STAT evaluation for EVD or surgical evacuation"},
    ]
  },

  status_epilepticus: {
    id:"status_epilepticus", name:"Status Epilepticus", subtitle:"Prolonged Seizure > 5 min",
    icon:"⚡", specialty:"Neurology", acuity:"stat",
    guideline:"Neurocritical Care Society 2024",
    tags:["Benzodiazepines","Intubation","EEG"],
    orders:[
      {id:"se-a1",cat:"admit",priority:"stat",required:true,name:"Admit to ICU",detail:"STAT — airway protection, hemodynamic support"},
      {id:"se-m1",cat:"meds",priority:"stat",required:true,name:"Lorazepam 4mg IV",detail:"STAT. Repeat × 1 if ongoing. Or Midazolam 10mg IM",high_alert:true,guideline:"NCS 2024 Class I"},
      {id:"se-m2",cat:"meds",priority:"stat",required:true,name:"Fosphenytoin 20 PE/kg IV",detail:"Load at 100-150 PE/min",high_alert:true},
      {id:"se-m3",cat:"meds",priority:"stat",required:false,name:"Levetiracetam 60mg/kg IV",detail:"If fosphenytoin contraindicated or ongoing seizure"},
      {id:"se-m4",cat:"meds",priority:"stat",required:false,name:"Propofol or Midazolam Infusion",detail:"For refractory status. Requires intubation",high_alert:true},
      {id:"se-l1",cat:"labs",priority:"stat",required:true,name:"BMP, Mg, CBC, AED levels",detail:"STAT"},
      {id:"se-i1",cat:"imaging",priority:"urgent",required:true,name:"CT Head non-contrast",detail:"URGENT — rule out acute bleed, mass"},
      {id:"se-c1",cat:"consults",priority:"stat",required:true,name:"Neurology",detail:"STAT"},
      {id:"se-n1",cat:"nursing",priority:"urgent",required:true,name:"Continuous EEG",detail:"Monitor for non-convulsive seizures"},
    ]
  },

  ards: {
    id:"ards", name:"ARDS", subtitle:"Acute Respiratory Distress Syndrome",
    icon:"🫁", specialty:"Critical Care", acuity:"stat",
    guideline:"ARDSNet / ATS 2024",
    tags:["Mechanical Ventilation","Prone Positioning","Berlin Criteria"],
    orders:[
      {id:"ards-a1",cat:"admit",priority:"stat",required:true,name:"Admit to ICU",detail:"STAT — requires mechanical ventilation"},
      {id:"ards-m1",cat:"meds",priority:"stat",required:true,name:"Low Tidal Volume Ventilation",detail:"6 mL/kg IBW. Plateau pressure < 30 cmH₂O",guideline:"ARDSNet 2024 Class I"},
      {id:"ards-m2",cat:"meds",priority:"urgent",required:false,name:"Paralysis (Cisatracurium)",detail:"If severe ARDS (P/F < 150) and high ventilator demand"},
      {id:"ards-n1",cat:"nursing",priority:"urgent",required:false,name:"Prone Positioning",detail:"16h/day if P/F < 150. Mortality benefit",guideline:"PROSEVA Trial"},
      {id:"ards-l1",cat:"labs",priority:"stat",required:true,name:"ABG",detail:"STAT, then Q4-6h"},
    ]
  },

  cardiogenic_shock: {
    id:"cardiogenic_shock", name:"Cardiogenic Shock", subtitle:"Pump Failure — Post-MI or HF",
    icon:"💔", specialty:"Critical Care", acuity:"stat",
    guideline:"SCAI 2024 Cardiogenic Shock",
    tags:["Inotropes","IABP","ECMO"],
    orders:[
      {id:"cs-a1",cat:"admit",priority:"stat",required:true,name:"Admit to CCU",detail:"STAT"},
      {id:"cs-v1",cat:"vitals",priority:"stat",required:true,name:"Arterial Line",detail:"Continuous BP monitoring"},
      {id:"cs-m1",cat:"meds",priority:"stat",required:true,name:"Dobutamine 2.5-20 mcg/kg/min",detail:"Positive inotrope. First-line",high_alert:true},
      {id:"cs-m2",cat:"meds",priority:"stat",required:false,name:"Norepinephrine",detail:"If hypotensive despite dobutamine",high_alert:true},
      {id:"cs-c1",cat:"consults",priority:"stat",required:true,name:"Cardiology — MCS Evaluation",detail:"IABP, Impella, or ECMO consideration"},
    ]
  },

  hhs: {
    id:"hhs", name:"Hyperosmolar Hyperglycemic State", subtitle:"HHS — Non-Ketotic Hyperglycemia",
    icon:"💧", specialty:"Endocrinology", acuity:"urgent",
    guideline:"ADA 2024 HHS Guidelines",
    tags:["Type 2 DM","Severe Dehydration","Hyperosmolarity"],
    orders:[
      {id:"hhs-a1",cat:"admit",priority:"urgent",required:true,name:"Admit to ICU",detail:"Altered mental status, severe dehydration"},
      {id:"hhs-f1",cat:"fluids",priority:"stat",required:true,name:"0.9% NS 1L/hr × 2-3h",detail:"Then 250-500 mL/hr. Goal replace 50% deficit in 12h",guideline:"ADA 2024"},
      {id:"hhs-l1",cat:"labs",priority:"stat",required:true,name:"BMP, Serum Osmolality",detail:"STAT. Osmolality typically > 320 mOsm/kg"},
      {id:"hhs-m1",cat:"meds",priority:"urgent",required:true,name:"Insulin 0.1 units/kg/hr IV",detail:"Start AFTER initial fluid resuscitation",high_alert:true},
    ]
  },

  thyroid_storm: {
    id:"thyroid_storm", name:"Thyroid Storm", subtitle:"Severe Thyrotoxicosis",
    icon:"🌡️", specialty:"Endocrinology", acuity:"stat",
    guideline:"ATA 2024 Thyroid Storm",
    tags:["Hyperthyroidism","PTU","Beta-Blocker"],
    orders:[
      {id:"ts-a1",cat:"admit",priority:"stat",required:true,name:"Admit to ICU",detail:"High mortality if untreated"},
      {id:"ts-m1",cat:"meds",priority:"stat",required:true,name:"Propylthiouracil 600mg PO",detail:"Then 200mg Q6h. Blocks T4→T3 conversion",high_alert:true},
      {id:"ts-m2",cat:"meds",priority:"stat",required:true,name:"Propranolol 60-80mg PO Q4h",detail:"Beta-blockade. HR goal < 100"},
      {id:"ts-m3",cat:"meds",priority:"urgent",required:true,name:"Hydrocortisone 100mg IV Q8h",detail:"Prevents adrenal insufficiency"},
      {id:"ts-l1",cat:"labs",priority:"stat",required:true,name:"TSH, Free T4, T3",detail:"STAT"},
      {id:"ts-c1",cat:"consults",priority:"stat",required:true,name:"Endocrinology",detail:"STAT"},
    ]
  },

  afib_rvr: {
    id:"afib_rvr", name:"Atrial Fibrillation with RVR", subtitle:"AF with Rapid Ventricular Response",
    icon:"💓", specialty:"Cardiology", acuity:"urgent",
    guideline:"AHA/ACC 2023 AFib Guidelines",
    tags:["Rate Control","Anticoagulation","Cardioversion"],
    orders:[
      {id:"afib-a1",cat:"admit",priority:"urgent",required:true,name:"Admit to Telemetry",detail:"Cardiac monitoring"},
      {id:"afib-v1",cat:"vitals",priority:"urgent",required:true,name:"Continuous Telemetry",detail:"Monitor HR and rhythm"},
      {id:"afib-m1",cat:"meds",priority:"urgent",required:true,name:"Metoprolol 5mg IV",detail:"Q5min × 3 PRN. Then 25-50mg PO Q6h",guideline:"ACC/AHA 2023"},
      {id:"afib-m2",cat:"meds",priority:"urgent",required:false,name:"Diltiazem 0.25mg/kg IV",detail:"If beta-blocker contraindicated"},
      {id:"afib-m3",cat:"meds",priority:"urgent",required:true,name:"Apixaban 5mg PO BID",detail:"Start anticoagulation if CHA₂DS₂-VASc ≥ 2",guideline:"ACC/AHA 2023"},
      {id:"afib-i1",cat:"imaging",priority:"stat",required:true,name:"12-Lead EKG",detail:"STAT — confirm AF"},
      {id:"afib-l1",cat:"labs",priority:"stat",required:true,name:"TSH, BMP, Troponin",detail:"STAT"},
      {id:"afib-i2",cat:"imaging",priority:"urgent",required:true,name:"Echocardiogram",detail:"Within 24h — assess for thrombus before cardioversion"},
    ]
  },

  pe: {
    id:"pe", name:"Pulmonary Embolism", subtitle:"Acute PE — Massive or Submassive",
    icon:"🫁", specialty:"Cardiology", acuity:"stat",
    guideline:"ESC 2024 PE Guidelines",
    tags:["Anticoagulation","Thrombolysis","CTPA"],
    orders:[
      {id:"pe-a1",cat:"admit",priority:"stat",required:true,name:"Admit to ICU/Telemetry",detail:"ICU if hemodynamically unstable or RV strain"},
      {id:"pe-v1",cat:"vitals",priority:"stat",required:true,name:"Continuous SpO₂ + Telemetry",detail:"Monitor for decompensation"},
      {id:"pe-l1",cat:"labs",priority:"stat",required:true,name:"D-Dimer, Troponin, BNP",detail:"STAT. RV strain markers"},
      {id:"pe-i1",cat:"imaging",priority:"stat",required:true,name:"CTA Chest (PE Protocol)",detail:"STAT — gold standard for PE diagnosis",guideline:"ESC 2024"},
      {id:"pe-i2",cat:"imaging",priority:"urgent",required:true,name:"Bilateral LE Doppler US",detail:"Rule out DVT"},
      {id:"pe-m1",cat:"meds",priority:"stat",required:true,name:"Heparin 80 units/kg bolus",detail:"Then 18 units/kg/hr infusion. Target aPTT 60-80s",high_alert:true,guideline:"ESC 2024 Class I"},
      {id:"pe-m2",cat:"meds",priority:"stat",required:false,name:"tPA 100mg IV",detail:"ONLY if massive PE with shock. Bleeding risk 10%",high_alert:true,guideline:"ESC 2024"},
      {id:"pe-c1",cat:"consults",priority:"stat",required:false,name:"Cardiothoracic Surgery",detail:"If massive PE and tPA contraindicated — surgical embolectomy"},
    ]
  },

  bowel_obstruction: {
    id:"bowel_obstruction", name:"Small Bowel Obstruction", subtitle:"SBO — Mechanical Obstruction",
    icon:"🫃", specialty:"Gastroenterology", acuity:"urgent",
    guideline:"WSES 2024 SBO Guidelines",
    tags:["NGT","CT Abdomen","Surgery Consult"],
    orders:[
      {id:"sbo-a1",cat:"admit",priority:"urgent",required:true,name:"Admit to Surgery Service",detail:"Observation vs operative management"},
      {id:"sbo-d1",cat:"diet",priority:"urgent",required:true,name:"NPO",detail:"Strict NPO"},
      {id:"sbo-f1",cat:"fluids",priority:"urgent",required:true,name:"LR or NS at 125 mL/hr",detail:"Volume resuscitation"},
      {id:"sbo-l1",cat:"labs",priority:"stat",required:true,name:"CBC, BMP, Lactate",detail:"STAT. Lactate > 4 suggests ischemia"},
      {id:"sbo-i1",cat:"imaging",priority:"stat",required:true,name:"CT Abdomen/Pelvis + contrast",detail:"STAT — identifies transition point, ischemia"},
      {id:"sbo-n1",cat:"nursing",priority:"urgent",required:true,name:"NGT to low continuous suction",detail:"Decompression"},
      {id:"sbo-c1",cat:"consults",priority:"urgent",required:true,name:"General Surgery",detail:"URGENT evaluation for operative vs conservative management"},
    ]
  },

  nstemi: {
    id:"nstemi", name:"NSTEMI / Unstable Angina", subtitle:"Non-ST Elevation Myocardial Infarction",
    icon:"💔", specialty:"Cardiology", acuity:"urgent",
    guideline:"ACC/AHA 2023 NSTE-ACS Guidelines",
    tags:["ACS","GRACE Score","Troponin","Dual Antiplatelet"],
    orders:[
      {id:"nst-a1",cat:"admit",priority:"urgent",required:true,name:"Admit to Telemetry/CCU",detail:"Cardiac monitoring. ICU if high GRACE score"},
      {id:"nst-v1",cat:"vitals",priority:"urgent",required:true,name:"Continuous Telemetry",detail:"Monitor for arrhythmia, ST changes"},
      {id:"nst-l1",cat:"labs",priority:"stat",required:true,name:"Troponin I serial",detail:"STAT, 3h, 6h. Rising troponin = NSTEMI"},
      {id:"nst-l2",cat:"labs",priority:"stat",required:true,name:"BMP, Mg, CBC, PT/INR",detail:"STAT"},
      {id:"nst-m1",cat:"meds",priority:"stat",required:true,name:"Aspirin 325mg",detail:"STAT loading dose",guideline:"ACC/AHA 2023 Class I"},
      {id:"nst-m2",cat:"meds",priority:"stat",required:true,name:"Ticagrelor 180mg",detail:"P2Y12 inhibitor. Clopidogrel if contraindicated",high_alert:true},
      {id:"nst-m3",cat:"meds",priority:"stat",required:true,name:"Heparin infusion",detail:"70 units/kg bolus, then 12 units/kg/hr",high_alert:true},
      {id:"nst-m4",cat:"meds",priority:"urgent",required:true,name:"Atorvastatin 80mg",detail:"High-intensity statin"},
      {id:"nst-m5",cat:"meds",priority:"urgent",required:true,name:"Metoprolol 25-50mg PO",detail:"Beta-blocker if no contraindication"},
      {id:"nst-i1",cat:"imaging",priority:"stat",required:true,name:"12-Lead EKG",detail:"STAT, repeat Q8h or PRN for chest pain"},
      {id:"nst-c1",cat:"consults",priority:"urgent",required:true,name:"Cardiology",detail:"URGENT for risk stratification and cath timing"},
    ]
  },

  hypertensive_emergency: {
    id:"hypertensive_emergency", name:"Hypertensive Emergency", subtitle:"BP > 180/120 with End-Organ Damage",
    icon:"🩺", specialty:"Critical Care", acuity:"stat",
    guideline:"AHA 2024 Hypertension Guidelines",
    tags:["Encephalopathy","Aortic Dissection","Nicardipine"],
    orders:[
      {id:"hte-a1",cat:"admit",priority:"stat",required:true,name:"Admit to ICU",detail:"STAT — requires IV antihypertensives"},
      {id:"hte-v1",cat:"vitals",priority:"stat",required:true,name:"Arterial Line",detail:"Continuous BP monitoring"},
      {id:"hte-l1",cat:"labs",priority:"stat",required:true,name:"BMP, Troponin, BNP",detail:"STAT — assess end-organ damage"},
      {id:"hte-l2",cat:"labs",priority:"stat",required:true,name:"UA, Urine Protein",detail:"Renal involvement"},
      {id:"hte-m1",cat:"meds",priority:"stat",required:true,name:"Nicardipine 5mg/hr IV",detail:"Titrate by 2.5mg/hr Q5-15min. Max 15mg/hr. Target 25% BP reduction in 1h",high_alert:true,guideline:"AHA 2024"},
      {id:"hte-m2",cat:"meds",priority:"stat",required:false,name:"Labetalol 20mg IV bolus",detail:"Alternative. Repeat Q10min PRN"},
      {id:"hte-i1",cat:"imaging",priority:"stat",required:true,name:"CT Head non-contrast",detail:"If neuro symptoms — r/o hemorrhage"},
      {id:"hte-i2",cat:"imaging",priority:"stat",required:true,name:"CTA Chest",detail:"If chest pain — r/o aortic dissection"},
      {id:"hte-i3",cat:"imaging",priority:"stat",required:true,name:"12-Lead EKG",detail:"STAT — LVH, ischemia"},
    ]
  },

  cellulitis: {
    id:"cellulitis", name:"Cellulitis / Skin/Soft Tissue Infection", subtitle:"SSTI — Non-Purulent",
    icon:"🦠", specialty:"Infectious Disease", acuity:"routine",
    guideline:"IDSA 2024 SSTI Guidelines",
    tags:["MRSA","Cephalosporin","Incision and Drainage"],
    orders:[
      {id:"cell-a1",cat:"admit",priority:"routine",required:false,name:"Admit if severe",detail:"Consider admission if systemic toxicity, immunocompromised, or failed outpatient Rx"},
      {id:"cell-l1",cat:"labs",priority:"urgent",required:false,name:"Blood Cultures × 2",detail:"Only if systemic signs (fever, hypotension)"},
      {id:"cell-m1",cat:"meds",priority:"urgent",required:true,name:"Cefazolin 2g IV Q8h",detail:"First-line for non-purulent cellulitis",guideline:"IDSA 2024"},
      {id:"cell-m2",cat:"meds",priority:"urgent",required:false,name:"Vancomycin 15-20mg/kg IV",detail:"If MRSA suspected or purulent drainage",high_alert:true},
      {id:"cell-i1",cat:"imaging",priority:"urgent",required:false,name:"Ultrasound affected area",detail:"If abscess suspected"},
      {id:"cell-c1",cat:"consults",priority:"urgent",required:false,name:"General Surgery",detail:"If abscess requires I&D"},
    ]
  },

  uti_pyelonephritis: {
    id:"uti_pyelonephritis", name:"Acute Pyelonephritis", subtitle:"Upper UTI with Systemic Symptoms",
    icon:"🩺", specialty:"Infectious Disease", acuity:"urgent",
    guideline:"IDSA 2024 UTI Guidelines",
    tags:["Flank Pain","Ceftriaxone","Urine Culture"],
    orders:[
      {id:"pyelo-a1",cat:"admit",priority:"urgent",required:true,name:"Admit to Medicine",detail:"Observation if mild; floor if moderate-severe"},
      {id:"pyelo-l1",cat:"labs",priority:"stat",required:true,name:"Urinalysis + Urine Culture",detail:"STAT before antibiotics"},
      {id:"pyelo-l2",cat:"labs",priority:"stat",required:true,name:"Blood Cultures × 2",detail:"If febrile or septic"},
      {id:"pyelo-l3",cat:"labs",priority:"stat",required:true,name:"CBC, BMP",detail:"STAT"},
      {id:"pyelo-m1",cat:"meds",priority:"stat",required:true,name:"Ceftriaxone 1-2g IV Q24h",detail:"Empiric coverage",guideline:"IDSA 2024"},
      {id:"pyelo-f1",cat:"fluids",priority:"urgent",required:true,name:"NS or LR 125 mL/hr",detail:"Hydration"},
      {id:"pyelo-i1",cat:"imaging",priority:"urgent",required:false,name:"Renal Ultrasound or CT",detail:"If no improvement in 48-72h — r/o abscess, obstruction"},
    ]
  },

  dvt: {
    id:"dvt", name:"Deep Vein Thrombosis", subtitle:"Acute DVT — Lower Extremity",
    icon:"🩸", specialty:"Cardiology", acuity:"urgent",
    guideline:"ACCP 2024 VTE Guidelines",
    tags:["Wells Score","D-Dimer","Anticoagulation","Doppler"],
    orders:[
      {id:"dvt-a1",cat:"admit",priority:"routine",required:false,name:"Outpatient vs Admission",detail:"Admit if massive DVT, hemodynamic instability, or high PE risk"},
      {id:"dvt-l1",cat:"labs",priority:"stat",required:false,name:"D-Dimer",detail:"Only if low/intermediate Wells score. High sensitivity"},
      {id:"dvt-l2",cat:"labs",priority:"stat",required:true,name:"CBC, PT/INR, aPTT, BMP",detail:"STAT baseline"},
      {id:"dvt-i1",cat:"imaging",priority:"stat",required:true,name:"Bilateral LE Doppler US",detail:"STAT — compressibility, flow"},
      {id:"dvt-m1",cat:"meds",priority:"stat",required:true,name:"Enoxaparin 1mg/kg SQ Q12h",detail:"OR Apixaban 10mg PO BID × 7d, then 5mg BID",high_alert:true,guideline:"ACCP 2024"},
      {id:"dvt-m2",cat:"meds",priority:"routine",required:false,name:"Rivaroxaban 15mg PO BID",detail:"Alternative DOAC × 3 weeks, then 20mg daily"},
    ]
  },

  alcohol_withdrawal: {
    id:"alcohol_withdrawal", name:"Alcohol Withdrawal Syndrome", subtitle:"AWS — CIWA Protocol",
    icon:"🧠", specialty:"Critical Care", acuity:"urgent",
    guideline:"ASAM 2024 Withdrawal Guidelines",
    tags:["CIWA-Ar","Benzodiazepines","Seizure Risk","Delirium Tremens"],
    orders:[
      {id:"aw-a1",cat:"admit",priority:"urgent",required:true,name:"Admit to Telemetry",detail:"ICU if severe withdrawal or DTs"},
      {id:"aw-v1",cat:"vitals",priority:"urgent",required:true,name:"CIWA-Ar Scoring Q1-4h",detail:"Symptom-triggered benzodiazepine protocol"},
      {id:"aw-l1",cat:"labs",priority:"stat",required:true,name:"BMP, Mg, Phos, CBC, LFTs",detail:"STAT"},
      {id:"aw-l2",cat:"labs",priority:"stat",required:true,name:"Blood Alcohol Level",detail:"STAT"},
      {id:"aw-m1",cat:"meds",priority:"urgent",required:true,name:"Lorazepam 2-4mg IV/PO Q1h PRN",detail:"CIWA-Ar ≥ 10. Titrate to symptoms",high_alert:true,guideline:"ASAM 2024"},
      {id:"aw-m2",cat:"meds",priority:"urgent",required:true,name:"Thiamine 100mg IV daily",detail:"BEFORE dextrose. Prevents Wernicke's",guideline:"ASAM 2024 Class I"},
      {id:"aw-m3",cat:"meds",priority:"urgent",required:true,name:"Folic Acid 1mg PO daily",detail:"Nutritional support"},
      {id:"aw-m4",cat:"meds",priority:"urgent",required:true,name:"Multivitamin daily",detail:"Nutritional repletion"},
      {id:"aw-d1",cat:"diet",priority:"routine",required:true,name:"Regular Diet",detail:"High-calorie, high-protein. Nutrition consult"},
    ]
  },

  cholecystitis: {
    id:"cholecystitis", name:"Acute Cholecystitis", subtitle:"Calculous Cholecystitis",
    icon:"🫃", specialty:"Gastroenterology", acuity:"urgent",
    guideline:"Tokyo Guidelines 2024",
    tags:["RUQ Pain","Murphy's Sign","Cholecystectomy"],
    orders:[
      {id:"chol-a1",cat:"admit",priority:"urgent",required:true,name:"Admit to Surgery Service",detail:"Early cholecystectomy within 72h"},
      {id:"chol-d1",cat:"diet",priority:"urgent",required:true,name:"NPO",detail:"Nothing by mouth"},
      {id:"chol-f1",cat:"fluids",priority:"urgent",required:true,name:"NS or LR 125 mL/hr",detail:"IV hydration"},
      {id:"chol-l1",cat:"labs",priority:"stat",required:true,name:"CBC, CMP, Lipase",detail:"STAT. WBC elevated, Alk Phos elevated"},
      {id:"chol-m1",cat:"meds",priority:"urgent",required:true,name:"Ceftriaxone 1g IV Q24h + Metronidazole 500mg IV Q8h",detail:"Empiric antibiotics",guideline:"Tokyo 2024"},
      {id:"chol-m2",cat:"meds",priority:"urgent",required:true,name:"Hydromorphone 0.5-1mg IV Q3h PRN",detail:"Pain control"},
      {id:"chol-i1",cat:"imaging",priority:"stat",required:true,name:"RUQ Ultrasound",detail:"STAT — gallstones, wall thickening, pericholecystic fluid"},
      {id:"chol-c1",cat:"consults",priority:"urgent",required:true,name:"General Surgery",detail:"URGENT for cholecystectomy timing"},
    ]
  },

  appendicitis: {
    id:"appendicitis", name:"Acute Appendicitis", subtitle:"Right Lower Quadrant Pain",
    icon:"🫃", specialty:"Gastroenterology", acuity:"urgent",
    guideline:"WSES 2024 Appendicitis Guidelines",
    tags:["RLQ Pain","Appendectomy","Perforation"],
    orders:[
      {id:"app-a1",cat:"admit",priority:"urgent",required:true,name:"Admit to Surgery Service",detail:"Appendectomy"},
      {id:"app-d1",cat:"diet",priority:"urgent",required:true,name:"NPO",detail:"Nothing by mouth"},
      {id:"app-l1",cat:"labs",priority:"stat",required:true,name:"CBC, BMP, Lactate",detail:"STAT. WBC > 10K typical"},
      {id:"app-l2",cat:"labs",priority:"stat",required:false,name:"Pregnancy Test (females)",detail:"STAT — affects imaging choice"},
      {id:"app-i1",cat:"imaging",priority:"stat",required:true,name:"CT Abdomen/Pelvis + contrast",detail:"STAT — sensitivity 95%. US if pediatric/pregnant"},
      {id:"app-m1",cat:"meds",priority:"urgent",required:true,name:"Piperacillin-Tazobactam 3.375g IV",detail:"Pre-op antibiotics"},
      {id:"app-c1",cat:"consults",priority:"urgent",required:true,name:"General Surgery",detail:"URGENT evaluation for appendectomy"},
    ]
  },

  gout_flare: {
    id:"gout_flare", name:"Acute Gout Flare", subtitle:"Monoarticular Arthritis",
    icon:"🦴", specialty:"Rheumatology", acuity:"routine",
    guideline:"ACR 2024 Gout Guidelines",
    tags:["Podagra","Uric Acid","Colchicine","NSAIDs"],
    orders:[
      {id:"gout-a1",cat:"admit",priority:"routine",required:false,name:"Outpatient Management",detail:"Admit only if polyarticular or septic joint concern"},
      {id:"gout-l1",cat:"labs",priority:"urgent",required:true,name:"Serum Uric Acid",detail:"May be normal during flare"},
      {id:"gout-l2",cat:"labs",priority:"urgent",required:false,name:"Arthrocentesis + Synovial Fluid Analysis",detail:"If first flare — confirm urate crystals, r/o septic joint"},
      {id:"gout-m1",cat:"meds",priority:"urgent",required:true,name:"Colchicine 1.2mg PO × 1",detail:"Then 0.6mg in 1h. Max 1.8mg first day",guideline:"ACR 2024"},
      {id:"gout-m2",cat:"meds",priority:"urgent",required:false,name:"Indomethacin 50mg PO TID",detail:"NSAID alternative if no renal disease"},
      {id:"gout-m3",cat:"meds",priority:"routine",required:false,name:"Prednisone 40mg PO daily × 5d",detail:"If colchicine/NSAIDs contraindicated"},
    ]
  },

  diabetic_foot_ulcer: {
    id:"diabetic_foot_ulcer", name:"Diabetic Foot Infection", subtitle:"Complicated DFU with Osteomyelitis Risk",
    icon:"🦶", specialty:"Infectious Disease", acuity:"urgent",
    guideline:"IDSA 2024 Diabetic Foot Infection",
    tags:["Osteomyelitis","Amputation Risk","Vascular Insufficiency"],
    orders:[
      {id:"dfu-a1",cat:"admit",priority:"urgent",required:true,name:"Admit to Medicine/Surgery",detail:"Severe infection or vascular compromise"},
      {id:"dfu-l1",cat:"labs",priority:"stat",required:true,name:"CBC, BMP, HbA1c, ESR/CRP",detail:"STAT. ESR/CRP for osteo"},
      {id:"dfu-l2",cat:"labs",priority:"stat",required:true,name:"Wound Culture + Gram Stain",detail:"Deep tissue or bone culture if osteo suspected"},
      {id:"dfu-m1",cat:"meds",priority:"stat",required:true,name:"Vancomycin 15-20mg/kg IV",detail:"MRSA coverage",high_alert:true},
      {id:"dfu-m2",cat:"meds",priority:"stat",required:true,name:"Piperacillin-Tazobactam 3.375g IV Q6h",detail:"Broad gram-negative + anaerobic coverage"},
      {id:"dfu-i1",cat:"imaging",priority:"urgent",required:true,name:"Foot X-ray (3 views)",detail:"R/o osteomyelitis, gas"},
      {id:"dfu-i2",cat:"imaging",priority:"urgent",required:false,name:"MRI Foot with contrast",detail:"If osteo suspected — sensitivity 90%"},
      {id:"dfu-c1",cat:"consults",priority:"urgent",required:true,name:"Podiatry / Wound Care",detail:"Debridement, offloading"},
      {id:"dfu-c2",cat:"consults",priority:"urgent",required:true,name:"Vascular Surgery",detail:"ABI, revascularization evaluation"},
    ]
  },

  meningitis: {
    id:"meningitis", name:"Bacterial Meningitis", subtitle:"Acute Bacterial Meningitis — Adult",
    icon:"🧠", specialty:"Infectious Disease", acuity:"stat",
    guideline:"IDSA 2024 Meningitis Guidelines",
    tags:["Lumbar Puncture","Empiric Antibiotics","Dexamethasone"],
    orders:[
      {id:"men-a1",cat:"admit",priority:"stat",required:true,name:"Admit to ICU",detail:"STAT — high mortality if delayed treatment"},
      {id:"men-l1",cat:"labs",priority:"stat",required:true,name:"Blood Cultures × 2",detail:"STAT before antibiotics"},
      {id:"men-l2",cat:"labs",priority:"stat",required:true,name:"Lumbar Puncture + CSF Studies",detail:"Cell count, glucose, protein, Gram stain, culture. Do NOT delay ABx for LP",guideline:"IDSA 2024 — ABx within 1h"},
      {id:"men-l3",cat:"labs",priority:"stat",required:true,name:"CBC, BMP, PT/INR",detail:"STAT"},
      {id:"men-m1",cat:"meds",priority:"stat",required:true,name:"Ceftriaxone 2g IV Q12h",detail:"STAT first dose",high_alert:true,guideline:"IDSA 2024"},
      {id:"men-m2",cat:"meds",priority:"stat",required:true,name:"Vancomycin 15-20mg/kg IV Q8-12h",detail:"STAT. S. pneumoniae coverage",high_alert:true},
      {id:"men-m3",cat:"meds",priority:"stat",required:true,name:"Dexamethasone 10mg IV Q6h × 4d",detail:"Give BEFORE or WITH first antibiotic dose. Reduces mortality in pneumococcal meningitis",guideline:"IDSA 2024 Class I"},
      {id:"men-m4",cat:"meds",priority:"stat",required:false,name:"Ampicillin 2g IV Q4h",detail:"If > 50yo or immunocompromised — Listeria coverage"},
      {id:"men-i1",cat:"imaging",priority:"stat",required:true,name:"CT Head non-contrast",detail:"Before LP if: altered MS, focal neuro deficit, papilledema, or immunocompromised"},
      {id:"men-c1",cat:"consults",priority:"stat",required:true,name:"Infectious Disease",detail:"STAT"},
    ]
  },

  copd_exacerbation_severe: {
    id:"copd_exacerbation_severe", name:"Severe COPD Exacerbation", subtitle:"COPD with Respiratory Failure",
    icon:"🫁", specialty:"Respiratory", acuity:"stat",
    guideline:"GOLD 2024 COPD",
    tags:["NIV","BiPAP","Intubation","Respiratory Acidosis"],
    orders:[
      {id:"copds-a1",cat:"admit",priority:"stat",required:true,name:"Admit to ICU",detail:"Respiratory failure, pH < 7.35"},
      {id:"copds-v1",cat:"vitals",priority:"stat",required:true,name:"Continuous SpO₂ + Telemetry",detail:"Target SpO₂ 88-92%"},
      {id:"copds-l1",cat:"labs",priority:"stat",required:true,name:"ABG",detail:"STAT — pH, pCO₂, pO₂"},
      {id:"copds-m1",cat:"meds",priority:"stat",required:true,name:"Continuous Albuterol Nebulization",detail:"2.5-5mg continuous"},
      {id:"copds-m2",cat:"meds",priority:"stat",required:true,name:"Methylprednisolone 125mg IV Q6h",detail:"Then taper to prednisone"},
      {id:"copds-n1",cat:"nursing",priority:"stat",required:true,name:"BiPAP Initiation",detail:"IPAP 10-20, EPAP 5. If pH < 7.35 and pCO₂ > 45",guideline:"GOLD 2024 — reduces intubation"},
      {id:"copds-c1",cat:"consults",priority:"stat",required:true,name:"Pulmonology / Critical Care",detail:"STAT"},
    ]
  },

  acute_myocarditis: {
    id:"acute_myocarditis", name:"Acute Myocarditis", subtitle:"Inflammatory Cardiomyopathy",
    icon:"💔", specialty:"Cardiology", acuity:"urgent",
    guideline:"ESC 2024 Myocarditis Guidelines",
    tags:["Troponin Elevation","Arrhythmias","Ejection Fraction","Fulminant"],
    orders:[
      {id:"myo-a1",cat:"admit",priority:"urgent",required:true,name:"Admit to CCU/ICU",detail:"Hemodynamic monitoring, arrhythmia surveillance"},
      {id:"myo-v1",cat:"vitals",priority:"urgent",required:true,name:"Continuous Telemetry",detail:"Arrhythmia detection"},
      {id:"myo-l1",cat:"labs",priority:"stat",required:true,name:"Troponin I serial",detail:"STAT, 3h, 6h. Peak at 3-4 days"},
      {id:"myo-l2",cat:"labs",priority:"stat",required:true,name:"BNP / NT-proBNP",detail:"Baseline and daily while elevated"},
      {id:"myo-l3",cat:"labs",priority:"stat",required:true,name:"ESR / CRP",detail:"Inflammatory markers"},
      {id:"myo-i1",cat:"imaging",priority:"stat",required:true,name:"12-Lead EKG",detail:"STAT — ST elevation, T-wave inversion"},
      {id:"myo-i2",cat:"imaging",priority:"urgent",required:true,name:"Echocardiogram (TTE)",detail:"Assess EF, wall motion, pericardial effusion"},
      {id:"myo-i3",cat:"imaging",priority:"urgent",required:false,name:"Cardiac MRI",detail:"Diagnostic gold standard if EF preserved"},
      {id:"myo-m1",cat:"meds",priority:"routine",required:true,name:"ACE-inhibitor or ARB",detail:"Start after stabilization if reduced EF"},
      {id:"myo-m2",cat:"meds",priority:"routine",required:true,name:"Beta-blocker low-dose",detail:"Carvedilol 3.125mg BID, titrate slowly"},
      {id:"myo-c1",cat:"consults",priority:"urgent",required:true,name:"Cardiology",detail:"URGENT for fulminant myocarditis evaluation"},
      {id:"myo-c2",cat:"consults",priority:"urgent",required:false,name:"Infectious Disease / Virology",detail:"If viral prodrome — consider antiviral therapy"},
    ]
  },

  acute_decompensated_hf_hfpef: {
    id:"hfpef", name:"Acute Decompensated HF with Preserved EF", subtitle:"HFpEF Exacerbation",
    icon:"❤️", specialty:"Cardiology", acuity:"urgent",
    guideline:"2022 AHA/ACC/HFSA HFpEF Guidelines",
    tags:["Hypertension Control","Diastolic Dysfunction","Pulmonary Hypertension"],
    orders:[
      {id:"hfpef-a1",cat:"admit",priority:"urgent",required:true,name:"Admit to Cardiology Telemetry",detail:"Telemetry unit preferred"},
      {id:"hfpef-v1",cat:"vitals",priority:"urgent",required:true,name:"Daily Weight",detail:"Same time, same scale. Alert if > 2 lbs/day"},
      {id:"hfpef-v2",cat:"vitals",priority:"urgent",required:true,name:"Daily BP",detail:"Target < 130/80. More aggressive than HFrEF"},
      {id:"hfpef-d1",cat:"diet",priority:"routine",required:true,name:"Sodium-Restricted Diet",detail:"2g sodium daily"},
      {id:"hfpef-f1",cat:"fluids",priority:"urgent",required:true,name:"IV Furosemide",detail:"40-80mg IV Q12h. Titrate to UO"},
      {id:"hfpef-l1",cat:"labs",priority:"stat",required:true,name:"BMP Daily",detail:"K⁺, Cr, Na⁺ while on diuretics"},
      {id:"hfpef-l2",cat:"labs",priority:"stat",required:true,name:"NT-proBNP",detail:"Baseline. May be disproportionately elevated"},
      {id:"hfpef-i1",cat:"imaging",priority:"urgent",required:true,name:"Echocardiogram (TTE)",detail:"Within 24-48h — EF ≥ 50%, assess diastolic function"},
      {id:"hfpef-m1",cat:"meds",priority:"routine",required:true,name:"ACE-inhibitor or ARB",detail:"For hypertension control and afterload reduction"},
      {id:"hfpef-m2",cat:"meds",priority:"routine",required:false,name:"SGLT2 Inhibitor",detail:"Empagliflozin 10mg daily — evidence emerging in HFpEF"},
      {id:"hfpef-c1",cat:"consults",priority:"urgent",required:true,name:"Cardiology",detail:"URGENT for HFpEF management"},
    ]
  },

  acute_aortic_dissection: {
    id:"aortic_dissection", name:"Acute Aortic Dissection", subtitle:"Type A vs B — Critical Emergencies",
    icon:"🩸", specialty:"Cardiology", acuity:"stat",
    guideline:"ACC/AHA 2024 Aortic Dissection Guidelines",
    tags:["Hypertensive Emergency","Cardiothoracic Surgery","Type A","Type B"],
    orders:[
      {id:"aod-a1",cat:"admit",priority:"stat",required:true,name:"Admit to ICU/CVICU",detail:"Highest acuity. Cardiothoracic surgery standby"},
      {id:"aod-v1",cat:"vitals",priority:"stat",required:true,name:"Arterial Line",detail:"Continuous BP monitoring — both arms"},
      {id:"aod-v2",cat:"vitals",priority:"stat",required:true,name:"BP Management Target",detail:"SBP < 120 mmHg. Reduce dP/dt (heart rate × SBP)"},
      {id:"aod-l1",cat:"labs",priority:"stat",required:true,name:"Type & Cross 6 units",detail:"STAT"},
      {id:"aod-l2",cat:"labs",priority:"stat",required:true,name:"CBC, CMP, Lactate, Troponin",detail:"STAT"},
      {id:"aod-i1",cat:"imaging",priority:"stat",required:true,name:"CT Chest with Contrast (CTA)",detail:"STAT — gold standard. Type A requires immediate imaging"},
      {id:"aod-i2",cat:"imaging",priority:"stat",required:true,name:"12-Lead EKG",detail:"STAT — r/o inferior STEMI if type A"},
      {id:"aod-m1",cat:"meds",priority:"stat",required:true,name:"Labetalol IV",detail:"Start 10-20mg, repeat Q10min. SBP goal < 120",high_alert:true},
      {id:"aod-m2",cat:"meds",priority:"stat",required:true,name:"Nitroprusside Infusion",detail:"0.5-1.4 mcg/kg/min if BP not controlled with labetalol",high_alert:true},
      {id:"aod-m3",cat:"meds",priority:"stat",required:true,name:"Beta-blocker (Esmolol or Propranolol)",detail:"HR goal 60 bpm. Give BEFORE vasodilators",high_alert:true},
      {id:"aod-c1",cat:"consults",priority:"stat",required:true,name:"Cardiothoracic Surgery",detail:"STAT — Type A requires emergent surgical repair"},
      {id:"aod-c2",cat:"consults",priority:"stat",required:true,name:"Cardiology",detail:"Type B management — anticoagulation, BP control"},
    ]
  },

  acute_liver_failure: {
    id:"acute_liver_failure", name:"Acute Liver Failure", subtitle:"Fulminant Hepatic Failure",
    icon:"🩺", specialty:"Hepatology", acuity:"stat",
    guideline:"AASLD 2024 Acute Liver Failure Guidelines",
    tags:["Encephalopathy","INR Elevation","Hyperammonemia","Transplant Candidate"],
    orders:[
      {id:"alf-a1",cat:"admit",priority:"stat",required:true,name:"Admit to ICU",detail:"Highest acuity. Transplant center evaluation"},
      {id:"alf-v1",cat:"vitals",priority:"stat",required:true,name:"Neurological Checks Q1h",detail:"Glasgow Coma Score. Encephalopathy assessment"},
      {id:"alf-v2",cat:"vitals",priority:"stat",required:true,name:"Glucose Q1h",detail:"Profound hypoglycemia risk"},
      {id:"alf-l1",cat:"labs",priority:"stat",required:true,name:"STAT Labs (INR/PT, Bili, AST/ALT, Albumin, Glucose)",detail:"Baseline, then Q4-6h"},
      {id:"alf-l2",cat:"labs",priority:"stat",required:true,name:"Ammonia Level",detail:"Baseline and q4h if encephalopathy present"},
      {id:"alf-l3",cat:"labs",priority:"stat",required:true,name:"Blood Cultures × 2",detail:"Sepsis risk high"},
      {id:"alf-l4",cat:"labs",priority:"urgent",required:false,name:"Acetaminophen Level",detail:"If suspected ingestion — nomogram interpretation"},
      {id:"alf-l5",cat:"labs",priority:"urgent",required:false,name:"Viral Serology (HAV, HBV, HCV, EBV, CMV)",detail:"Identify etiology"},
      {id:"alf-f1",cat:"fluids",priority:"stat",required:true,name:"D50 IV For Hypoglycemia",detail:"Target glucose 100-150. Repeat q1h as needed"},
      {id:"alf-m1",cat:"meds",priority:"urgent",required:true,name:"Lactulose + Rifaxomicin",detail:"Hepatic encephalopathy management"},
      {id:"alf-m2",cat:"meds",priority:"stat",required:false,name:"N-Acetylcysteine (NAC)",detail:"If acetaminophen toxicity — continued benefit even after 36h"},
      {id:"alf-i1",cat:"imaging",priority:"stat",required:true,name:"Head CT (non-contrast)",detail:"Rule out intracranial hemorrhage if coma"},
      {id:"alf-i2",cat:"imaging",priority:"stat",required:true,name:"Abdominal Ultrasound ± Doppler",detail:"Assess liver size, rule out Budd-Chiari"},
      {id:"alf-c1",cat:"consults",priority:"stat",required:true,name:"Hepatology / Transplant Surgery",detail:"STAT — transplant evaluation"},
      {id:"alf-c2",cat:"consults",priority:"stat",required:false,name:"Nephrology",detail:"AKI prophylaxis and management"},
    ]
  },

  acute_epiglottitis: {
    id:"acute_epiglottitis", name:"Acute Epiglottitis", subtitle:"Airway Emergency",
    icon:"🚨", specialty:"Critical Care", acuity:"stat",
    guideline:"BSAC/NICE 2024 Epiglottitis",
    tags:["Airway Threat","Intubation","Stridor","Tripod Position"],
    orders:[
      {id:"epig-a1",cat:"admit",priority:"stat",required:true,name:"Admit to ICU",detail:"Airway emergency. Prepare for intubation"},
      {id:"epig-v1",cat:"vitals",priority:"stat",required:true,name:"Continuous Monitoring",detail:"Maintain calm — avoid agitation"},
      {id:"epig-l1",cat:"labs",priority:"stat",required:true,name:"Blood Cultures × 2",detail:"STAT before antibiotics"},
      {id:"epig-l2",cat:"labs",priority:"stat",required:true,name:"CBC, CMP",detail:"STAT"},
      {id:"epig-m1",cat:"meds",priority:"stat",required:true,name:"Ceftriaxone 2g IV Q12h",detail:"STAT first dose",high_alert:true,guideline:"BSAC 2024"},
      {id:"epig-m2",cat:"meds",priority:"stat",required:false,name:"Dexamethasone 10mg IV",detail:"Reduces edema if stridor present"},
      {id:"epig-i1",cat:"imaging",priority:"stat",required:true,name:"Lateral Neck X-ray",detail:"Thumb sign — epiglottic enlargement. DO NOT delay intubation"},
      {id:"epig-c1",cat:"consults",priority:"stat",required:true,name:"Anesthesia / ENT",detail:"STAT airway management — intubation likely needed"},
      {id:"epig-c2",cat:"consults",priority:"stat",required:true,name:"Infectious Disease",detail:"Antibiotic selection and eradication therapy"},
    ]
  },

  acute_coronary_syndrome_unstable_angina: {
    id:"acs_unstable_angina", name:"ACS — Unstable Angina", subtitle:"No Troponin Elevation",
    icon:"💔", specialty:"Cardiology", acuity:"urgent",
    guideline:"ACC/AHA 2023 ACS Guidelines",
    tags:["No MI","Risk Stratification","Serial Troponin","Stress Testing"],
    orders:[
      {id:"acs-a1",cat:"admit",priority:"urgent",required:true,name:"Admit to Telemetry",detail:"Continuous cardiac monitoring"},
      {id:"acs-v1",cat:"vitals",priority:"urgent",required:true,name:"Continuous Telemetry",detail:"Arrhythmia and ST-segment monitoring"},
      {id:"acs-l1",cat:"labs",priority:"stat",required:true,name:"Troponin SERIAL",detail:"STAT, 3h, 6h. Must rule out MI"},
      {id:"acs-l2",cat:"labs",priority:"stat",required:true,name:"BMP, Mg, CBC",detail:"STAT"},
      {id:"acs-l3",cat:"labs",priority:"stat",required:true,name:"Lipid Panel",detail:"Fasting if possible"},
      {id:"acs-i1",cat:"imaging",priority:"stat",required:true,name:"12-Lead EKG",detail:"STAT, then repeat with chest pain"},
      {id:"acs-m1",cat:"meds",priority:"stat",required:true,name:"Aspirin 325mg chew",detail:"STAT if not contraindicated"},
      {id:"acs-m2",cat:"meds",priority:"stat",required:true,name:"Ticagrelor 180mg or Prasugrel 60mg",detail:"P2Y12 inhibitor loading",high_alert:true},
      {id:"acs-m3",cat:"meds",priority:"urgent",required:true,name:"Unfractionated Heparin or Enoxaparin",detail:"Anticoagulation per protocol"},
      {id:"acs-m4",cat:"meds",priority:"routine",required:true,name:"Atorvastatin 80mg",detail:"High-intensity statin"},
      {id:"acs-m5",cat:"meds",priority:"urgent",required:true,name:"Sublingual NTG Q5min PRN",detail:"For chest pain relief"},
      {id:"acs-i2",cat:"imaging",priority:"urgent",required:false,name:"Stress Test or Cath Timing",detail:"Risk stratification — defer cath if low-risk"},
      {id:"acs-c1",cat:"consults",priority:"urgent",required:true,name:"Cardiology",detail:"URGENT for risk stratification and cath timing"},
    ]
  },

  acute_pericarditis: {
    id:"pericarditis", name:"Acute Pericarditis", subtitle:"Pleuritic Chest Pain",
    icon:"💔", specialty:"Cardiology", acuity:"routine",
    guideline:"ESC 2024 Pericarditis Guidelines",
    tags:["Pericardial Effusion","Tamponade Risk","NSAIDs","Colchicine"],
    orders:[
      {id:"peri-a1",cat:"admit",priority:"routine",required:false,name:"Admit for Observation",detail:"Observation if uncomplicated. ICU if tamponade"},
      {id:"peri-v1",cat:"vitals",priority:"routine",required:true,name:"Vital Signs Q4h",detail:"Monitor for tamponade — JVD, pulsus"},
      {id:"peri-l1",cat:"labs",priority:"stat",required:true,name:"Troponin I",detail:"STAT — may be minimally elevated"},
      {id:"peri-l2",cat:"labs",priority:"stat",required:true,name:"CRP / ESR",detail:"Inflammatory markers"},
      {id:"peri-l3",cat:"labs",priority:"stat",required:false,name:"Viral Serology",detail:"If suspected viral pericarditis"},
      {id:"peri-i1",cat:"imaging",priority:"stat",required:true,name:"12-Lead EKG",detail:"Diffuse ST elevation, PR depression"},
      {id:"peri-i2",cat:"imaging",priority:"urgent",required:true,name:"Echocardiogram (TTE)",detail:"Assess pericardial effusion size, tamponade physiology"},
      {id:"peri-m1",cat:"meds",priority:"routine",required:true,name:"Indomethacin 50mg TID",detail:"OR naproxen 500mg BID. NSAIDs are first-line",guideline:"ESC 2024"},
      {id:"peri-m2",cat:"meds",priority:"routine",required:true,name:"Colchicine 0.5mg BID",detail:"Reduces recurrence. Use with NSAIDs",guideline:"ESC 2024"},
      {id:"peri-m3",cat:"meds",priority:"urgent",required:false,name:"Corticosteroids",detail:"If pericarditis-induced and NSAIDs contraindicated"},
      {id:"peri-c1",cat:"consults",priority:"urgent",required:false,name:"Cardiology",detail:"If effusion or recurrent pericarditis"},
    ]
  },

  acute_spontaneous_pneumothorax: {
    id:"pneumothorax", name:"Acute Spontaneous Pneumothorax", subtitle:"PSP vs SSP",
    icon:"🫁", specialty:"Respiratory", acuity:"urgent",
    guideline:"BTS 2024 Pneumothorax Guidelines",
    tags:["Chest Tube","Observation","Tension Pneumothorax","Small vs Large"],
    orders:[
      {id:"ptx-a1",cat:"admit",priority:"urgent",required:true,name:"Admit for Observation",detail:"ICU if hemodynamically unstable or tension PTX"},
      {id:"ptx-v1",cat:"vitals",priority:"urgent",required:true,name:"Continuous SpO₂",detail:"Supplemental O₂ to hasten reabsorption"},
      {id:"ptx-l1",cat:"labs",priority:"stat",required:true,name:"ABC if indicated",detail:"Assess oxygenation"},
      {id:"ptx-i1",cat:"imaging",priority:"stat",required:true,name:"Chest X-ray (CXR) PA/Lateral",detail:"STAT — measure pneumothorax size"},
      {id:"ptx-i2",cat:"imaging",priority:"urgent",required:false,name:"CT Chest Non-contrast",detail:"If recurrent PSP or secondary causes suspected"},
      {id:"ptx-m1",cat:"meds",priority:"routine",required:false,name:"Analgesia",detail:"Adequate pain control for breathing exercises"},
      {id:"ptx-n1",cat:"nursing",priority:"urgent",required:false,name:"Chest Tube Placement (if > 2cm)",detail:"BTS guidelines: observe < 2cm; drain if > 2cm or symptoms"},
      {id:"ptx-n2",cat:"nursing",priority:"routine",required:false,name:"Breathing Exercises",detail:"Incentive spirometry to promote lung re-expansion"},
      {id:"ptx-c1",cat:"consults",priority:"urgent",required:false,name:"Thoracic Surgery",detail:"If recurrent, bilateral, hemopneumothorax, or failed intervention"},
    ]
  },

  hypoglycemic_emergency: {
    id:"hypoglycemia", name:"Severe Hypoglycemia", subtitle:"Blood Glucose < 70 mg/dL with Altered MS",
    icon:"🩸", specialty:"Endocrinology", acuity:"stat",
    guideline:"ADA 2024 Hypoglycemia Guidelines",
    tags:["Altered Mental Status","Seizures","Loss of Consciousness","Glucose Tabs"],
    orders:[
      {id:"hypo-a1",cat:"admit",priority:"stat",required:true,name:"Admit to Medicine/ICU",detail:"ICU if seizures or prolonged altered MS"},
      {id:"hypo-v1",cat:"vitals",priority:"stat",required:true,name:"POC Glucose STAT",detail:"Fingerstick immediately"},
      {id:"hypo-l1",cat:"labs",priority:"stat",required:true,name:"Serum Glucose (lab confirmation)",detail:"Stat venous sample for confirmation"},
      {id:"hypo-m1",cat:"meds",priority:"stat",required:true,name:"Dextrose 50% IV",detail:"25-50mL (12.5-25g glucose) IV bolus STAT",high_alert:true,guideline:"ADA 2024"},
      {id:"hypo-m2",cat:"meds",priority:"stat",required:false,name:"Glucagon 1mg IM/IV",detail:"If IV access not available — onset 5-10 min"},
      {id:"hypo-f1",cat:"fluids",priority:"stat",required:true,name:"D5W or D10W Infusion",detail:"Maintenance after initial bolus to prevent recurrence"},
      {id:"hypo-l2",cat:"labs",priority:"urgent",required:true,name:"BMP",detail:"Renal function, electrolytes"},
      {id:"hypo-l3",cat:"labs",priority:"urgent",required:true,name:"Insulin + C-peptide",detail:"If hypoglycemia unclear etiology (insulinoma vs meds)"},
    ]
  },

  hemolytic_transfusion_reaction: {
    id:"transfusion_reaction", name:"Acute Hemolytic Transfusion Reaction", subtitle:"Suspected During Blood Transfusion",
    icon:"🩸", specialty:"Critical Care", acuity:"stat",
    guideline:"AABB 2024 Transfusion Reaction Guidelines",
    tags:["Fever","Back Pain","Hemoglobinuria","ABO Incompatibility","Septic Shock"],
    orders:[
      {id:"htr-a1",cat:"admit",priority:"stat",required:true,name:"Stop Transfusion IMMEDIATELY",detail:"Disconnect blood product. Keep IV patent with saline"},
      {id:"htr-v1",cat:"vitals",priority:"stat",required:true,name:"Vital Signs Q15min",detail:"Monitor for shock, renal failure"},
      {id:"htr-l1",cat:"labs",priority:"stat",required:true,name:"Blood Bank Workup",detail:"Repeat type & cross, DAT (direct antiglobulin test), antibody screen"},
      {id:"htr-l2",cat:"labs",priority:"stat",required:true,name:"CBC, BMP, Bilirubin, LDH",detail:"Hemolysis markers"},
      {id:"htr-l3",cat:"labs",priority:"stat",required:true,name:"Urinalysis + Urine Hemoglobin",detail:"Check for hemoglobinuria"},
      {id:"htr-f1",cat:"fluids",priority:"stat",required:true,name:"NS Wide Open (Aggressive Hydration)",detail:"Goal UO > 200-300 mL/hr to prevent AKI",high_alert:true},
      {id:"htr-m1",cat:"meds",priority:"urgent",required:true,name:"Furosemide 40-80mg IV",detail:"Maintain high urine output (alkaline urine prevents precipitation)"},
      {id:"htr-m2",cat:"meds",priority:"urgent",required:true,name:"Sodium Bicarbonate",detail:"If urine pH < 6.5 — add 100 mEq to IV fluids"},
      {id:"htr-l4",cat:"labs",priority:"stat",required:true,name:"Blood Cultures × 2",detail:"If fever — rule out sepsis from contaminated product"},
      {id:"htr-c1",cat:"consults",priority:"stat",required:true,name:"Blood Bank / Transfusion Medicine",detail:"STAT investigation"},
      {id:"htr-c2",cat:"consults",priority:"urgent",required:true,name:"Nephrology",detail:"AKI prevention and management"},
    ]
  },

  adrenal_crisis: {
    id:"adrenal_crisis", name:"Acute Adrenal Crisis", subtitle:"Adrenal Insufficiency — Shock",
    icon:"⚡", specialty:"Endocrinology", acuity:"stat",
    guideline:"Endocrine Society 2024 Adrenal Insufficiency",
    tags:["Refractory Shock","Hypoglycemia","Hyponatremia","Glucocorticoid"],
    orders:[
      {id:"adr-a1",cat:"admit",priority:"stat",required:true,name:"Admit to ICU",detail:"Shock physiology — vasopressor likely needed"},
      {id:"adr-v1",cat:"vitals",priority:"stat",required:true,name:"Arterial Line",detail:"Continuous BP monitoring"},
      {id:"adr-f1",cat:"fluids",priority:"stat",required:true,name:"NS 1-2L rapid bolus",detail:"Aggressive fluid resuscitation for shock"},
      {id:"adr-l1",cat:"labs",priority:"stat",required:true,name:"Cortisol AM (random acceptable in crisis)",detail:"STAT — > 20 mcg/dL makes crisis unlikely. Treat first, draw later"},
      {id:"adr-l2",cat:"labs",priority:"stat",required:true,name:"ACTH + Cortisol",detail:"Obtain before treatment if possible — post-treatment levels unreliable"},
      {id:"adr-l3",cat:"labs",priority:"stat",required:true,name:"BMP (Na⁺, glucose, K⁺)",detail:"Hyponatremia, hypoglycemia common"},
      {id:"adr-m1",cat:"meds",priority:"stat",required:true,name:"Hydrocortisone 100mg IV STAT",detail:"Then 50-100mg IV Q6-8h or continuous infusion",high_alert:true,guideline:"Endocrine Society — Class 1"},
      {id:"adr-m2",cat:"meds",priority:"stat",required:false,name:"Norepinephrine",detail:"If shock persists after fluids and hydrocortisone"},
      {id:"adr-m3",cat:"meds",priority:"urgent",required:true,name:"Dextrose 50%",detail:"Bolus for hypoglycemia if present"},
      {id:"adr-c1",cat:"consults",priority:"urgent",required:true,name:"Endocrinology",detail:"Long-term steroid replacement planning"},
    ]
  },

  acute_psychosis: {
    id:"acute_psychosis", name:"Acute Psychosis (First Episode)", subtitle:"Acute Onset Hallucinations/Delusions",
    icon:"🧠", specialty:"Psychiatry", acuity:"urgent",
    guideline:"APA 2024 Psychosis Guidelines",
    tags:["Organic Workup","Antipsychotics","Safety","Restraint Protocol"],
    orders:[
      {id:"psy-a1",cat:"admit",priority:"urgent",required:true,name:"Admit to Psychiatry/Medicine",detail:"R/O medical causes first. Psychiatry consult"},
      {id:"psy-v1",cat:"vitals",priority:"urgent",required:true,name:"Vital Signs Q4h",detail:"Monitor for neuroleptic malignant syndrome"},
      {id:"psy-l1",cat:"labs",priority:"stat",required:true,name:"Comprehensive Labs",detail:"Glucose, electrolytes, renal function, LFTs"},
      {id:"psy-l2",cat:"labs",priority:"stat",required:true,name:"Urine Drug Screen (UDS)",detail:"Methamphetamine, cocaine, PCP common mimics"},
      {id:"psy-l3",cat:"labs",priority:"urgent",required:true,name:"TSH",detail:"Hyperthyroidism can mimic psychosis"},
      {id:"psy-l4",cat:"labs",priority:"urgent",required:false,name:"Syphilis (RPR) + HIV + Syphilis LP if neuro signs",detail:"Neurosyphilis presents as psychosis"},
      {id:"psy-i1",cat:"imaging",priority:"urgent",required:true,name:"Head CT (non-contrast)",detail:"Rule out intracranial pathology"},
      {id:"psy-i2",cat:"imaging",priority:"stat",required:true,name:"12-Lead EKG",detail:"Baseline before antipsychotics (QT prolongation risk)"},
      {id:"psy-m1",cat:"meds",priority:"urgent",required:true,name:"Olanzapine 5mg IM or Haloperidol 5mg IM",detail:"Acute agitation control",high_alert:true},
      {id:"psy-m2",cat:"meds",priority:"urgent",required:true,name:"Lorazepam 1-2mg IV/IM Q1h PRN",detail:"Agitation and anxiety"},
      {id:"psy-m3",cat:"meds",priority:"routine",required:false,name:"Risperidone 2-3mg PO daily",detail:"First-generation atypical antipsychotic"},
      {id:"psy-c1",cat:"consults",priority:"urgent",required:true,name:"Psychiatry",detail:"URGENT psychosis workup and management"},
      {id:"psy-c2",cat:"consults",priority:"urgent",required:false,name:"Neurology",detail:"If seizure-like activity or focal deficits"},
    ]
  },

  acute_intracranial_hemorrhage: {
    id:"acute_ich_ext", name:"Acute Intracranial Hemorrhage — Extended", subtitle:"Non-Traumatic ICH Management",
    icon:"🧠", specialty:"Neurology", acuity:"stat",
    guideline:"AHA/ASA 2024 ICH Guidelines",
    tags:["Hypertension Control","ICP Monitoring","Osmotic Therapy","Reversal"],
    orders:[
      {id:"ich-ext-a1",cat:"admit",priority:"stat",required:true,name:"Admit to Neuro ICU",detail:"Highest acuity. ICP monitoring likely needed"},
      {id:"ich-ext-v1",cat:"vitals",priority:"stat",required:true,name:"Neuro Checks Q15min",detail:"GCS, pupils, motor exam — document findings"},
      {id:"ich-ext-v2",cat:"vitals",priority:"stat",required:true,name:"Head Elevation 30°",detail:"Reduces ICP"},
      {id:"ich-ext-l1",cat:"labs",priority:"stat",required:true,name:"PT/INR, aPTT, Fibrinogen",detail:"STAT — anticoagulation reversal assessment"},
      {id:"ich-ext-l2",cat:"labs",priority:"stat",required:true,name:"CBC, CMP, Glucose",detail:"STAT baseline"},
      {id:"ich-ext-i1",cat:"imaging",priority:"stat",required:true,name:"CT Head non-contrast (STAT)",detail:"Hematoma volume, midline shift, hydrocephalus"},
      {id:"ich-ext-i2",cat:"imaging",priority:"urgent",required:false,name:"CT Angiography (CTA)",detail:"Spot sign predicts hematoma expansion"},
      {id:"ich-ext-m1",cat:"meds",priority:"stat",required:true,name:"Nicardipine IV Drip",detail:"5-15 mg/hr. SBP target 140-160 mmHg",high_alert:true},
      {id:"ich-ext-m2",cat:"meds",priority:"stat",required:true,name:"Mannitol or Hypertonic Saline",detail:"If mass effect/herniation. Osmotic therapy for ICP",high_alert:true},
      {id:"ich-ext-c1",cat:"consults",priority:"stat",required:true,name:"Neurosurgery",detail:"STAT — EVD or surgical evacuation evaluation"},
      {id:"ich-ext-c2",cat:"consults",priority:"urgent",required:true,name:"Neuroradiology",detail:"Imaging interpretation and monitoring"},
    ]
  },

  acute_subarachnoid_hemorrhage: {
    id:"sah", name:"Acute Subarachnoid Hemorrhage", subtitle:"Ruptured Cerebral Aneurysm",
    icon:"💥", specialty:"Neurology", acuity:"stat",
    guideline:"AHA/ASA 2024 SAH Guidelines",
    tags:["Aneurysm","Vasospasm","Rebleeding","Endovascular Coiling"],
    orders:[
      {id:"sah-a1",cat:"admit",priority:"stat",required:true,name:"Admit to Neuro ICU",detail:"Highest acuity. Neurosurgery standby"},
      {id:"sah-v1",cat:"vitals",priority:"stat",required:true,name:"BP Management Strict",detail:"SBP 140-160 mmHg. Reduce rebleeding risk"},
      {id:"sah-v2",cat:"vitals",priority:"stat",required:true,name:"Neuro Checks Q15min",detail:"Rapid deterioration indicates rebleeding"},
      {id:"sah-l1",cat:"labs",priority:"stat",required:true,name:"PT/INR, CBC, CMP",detail:"STAT baseline"},
      {id:"sah-i1",cat:"imaging",priority:"stat",required:true,name:"CT Head non-contrast (STAT)",detail:"Blood in subarachnoid space. ICH assessment"},
      {id:"sah-i2",cat:"imaging",priority:"urgent",required:true,name:"CTA Head (Angiography)",detail:"Aneurysm localization and anatomy"},
      {id:"sah-m1",cat:"meds",priority:"stat",required:true,name:"Nicardipine or Labetalol IV",detail:"BP control to prevent rebleeding",high_alert:true},
      {id:"sah-m2",cat:"meds",priority:"urgent",required:true,name:"Nimodipine 60mg PO/NG Q4h",detail:"Reduces vasospasm-related ischemia (CGRP)",guideline:"AHA 2024 Class I"},
      {id:"sah-m3",cat:"meds",priority:"routine",required:true,name:"Stool Softener + PPI",detail:"Prevent straining and GI bleeding"},
      {id:"sah-c1",cat:"consults",priority:"stat",required:true,name:"Neurosurgery + Neurointerventional",detail:"STAT — aneurysm repair: clipping vs coiling"},
      {id:"sah-c2",cat:"consults",priority:"urgent",required:true,name:"Neuroradiology",detail:"Imaging review and monitoring"},
    ]
  },

  acute_hepatic_encephalopathy: {
    id:"hepatic_encephalopathy", name:"Hepatic Encephalopathy", subtitle:"Altered Mental Status — Cirrhosis",
    icon:"🧠", specialty:"Hepatology", acuity:"urgent",
    guideline:"AASLD 2024 Hepatic Encephalopathy",
    tags:["Ammonia","Lactulose","Rifaxomicin","Precipitants"],
    orders:[
      {id:"he-a1",cat:"admit",priority:"urgent",required:true,name:"Admit to Medicine/ICU",detail:"ICU if severe (Grade 3-4) or refractory"},
      {id:"he-v1",cat:"vitals",priority:"urgent",required:true,name:"Neuro Checks Q4h",detail:"West Haven Grade scoring"},
      {id:"he-l1",cat:"labs",priority:"stat",required:true,name:"Ammonia Level",detail:"STAT — >150 mcmol/L concerning. NOT diagnostic but correlates"},
      {id:"he-l2",cat:"labs",priority:"stat",required:true,name:"Glucose, BMP, INR/PT",detail:"STAT — hypoglycemia common. Check coagulopathy"},
      {id:"he-l3",cat:"labs",priority:"stat",required:true,name:"Blood Cultures × 2",detail:"SBP and other infections are common precipitants"},
      {id:"he-l4",cat:"labs",priority:"urgent",required:true,name:"Urinalysis + Urine Culture",detail:"UTI is common precipitant"},
      {id:"he-i1",cat:"imaging",priority:"urgent",required:true,name:"Head CT (non-contrast)",detail:"Rule out intracranial pathology if atypical"},
      {id:"he-m1",cat:"meds",priority:"urgent",required:true,name:"Lactulose 30mL Q2h",detail:"Titrate to 2-3 bowel movements/day"},
      {id:"he-m2",cat:"meds",priority:"urgent",required:true,name:"Rifaxomicin 550mg PO BID",detail:"Non-absorbed antibiotic. Reduces ammonia-producing bacteria",guideline:"AASLD 2024"},
      {id:"he-m3",cat:"meds",priority:"routine",required:false,name:"Zinc Supplementation",detail:"100-200mg daily — amino acid metabolism"},
      {id:"he-c1",cat:"consults",priority:"urgent",required:true,name:"Hepatology",detail:"Underlying liver disease management"},
      {id:"he-c2",cat:"consults",priority:"urgent",required:false,name:"Transplant Surgery",detail:"If acute decompensation or hepatic failure"},
    ]
  },

  acute_asthma_attack: {
    id:"asthma_attack", name:"Acute Asthma Exacerbation (Severe)", subtitle:"Status Asthmaticus",
    icon:"💨", specialty:"Respiratory", acuity:"urgent",
    guideline:"GINA 2024 Asthma Exacerbation",
    tags:["Beta-Agonist","Steroids","Peak Flow","Silent Chest"],
    orders:[
      {id:"ast-sv-a1",cat:"admit",priority:"urgent",required:true,name:"Admit to Telemetry/ICU",detail:"ICU if silent chest, severe PEF reduction, or altered MS"},
      {id:"ast-sv-v1",cat:"vitals",priority:"urgent",required:true,name:"Peak Flow Monitoring",detail:"Baseline and Q1h during treatment. Goal > 50% predicted"},
      {id:"ast-sv-v2",cat:"vitals",priority:"urgent",required:true,name:"Continuous SpO₂",detail:"Maintain SpO₂ ≥ 92-94%"},
      {id:"ast-sv-l1",cat:"labs",priority:"stat",required:true,name:"ABG (if SpO₂ < 92%)",detail:"STAT — pH, pCO₂. Elevated pCO₂ = impending respiratory failure"},
      {id:"ast-sv-l2",cat:"labs",priority:"stat",required:true,name:"CXR PA/Lateral",detail:"Rule out pneumothorax, pneumomediastinum"},
      {id:"ast-sv-m1",cat:"meds",priority:"stat",required:true,name:"Continuous Albuterol Nebulization",detail:"2.5-5mg continuous (not Q20min intervals) — driven by oxygen",guideline:"GINA 2024 Class I"},
      {id:"ast-sv-m2",cat:"meds",priority:"stat",required:true,name:"Ipratropium 0.5mg neb Q20min × 3",detail:"Anticholinergic — synergistic with beta-agonist"},
      {id:"ast-sv-m3",cat:"meds",priority:"stat",required:true,name:"Methylprednisolone 125mg IV Q6h",detail:"Then taper to oral prednisone. High-dose corticosteroids",high_alert:true},
      {id:"ast-sv-m4",cat:"meds",priority:"urgent",required:false,name:"Magnesium Sulfate 2g IV",detail:"Over 20 min if life-threatening exacerbation"},
      {id:"ast-sv-c1",cat:"consults",priority:"urgent",required:true,name:"Pulmonology / Critical Care",detail:"URGENT if impending respiratory failure"},
    ]
  },

  hyperkalemia_severe: {
    id:"hyperkalemia_severe", name:"Severe Hyperkalemia with EKG Changes", subtitle:"K⁺ > 6.5 mEq/L",
    icon:"⚡", specialty:"Nephrology", acuity:"stat",
    guideline:"Nephrology Practice Guidelines 2024",
    tags:["Peaked T-Waves","Widened QRS","Dialysis","Calcium Gluconate"],
    orders:[
      {id:"hks-a1",cat:"admit",priority:"stat",required:true,name:"Admit to ICU/Telemetry",detail:"Continuous cardiac monitoring — arrhythmia risk"},
      {id:"hks-v1",cat:"vitals",priority:"stat",required:true,name:"Continuous Telemetry + SpO₂",detail:"Cardiac arrhythmia surveillance"},
      {id:"hks-l1",cat:"labs",priority:"stat",required:true,name:"Serum K⁺ STAT",detail:"Venous acceptable for treatment initiation"},
      {id:"hks-i1",cat:"imaging",priority:"stat",required:true,name:"12-Lead EKG STAT",detail:"Peaked T-waves, widened QRS, ST depression, sine wave pattern"},
      {id:"hks-m1",cat:"meds",priority:"stat",required:true,name:"Calcium Gluconate 1-2g IV",detail:"STAT if EKG changes. Cardioprotective. Onset immediate",high_alert:true,guideline:"Life-saving — Class 1"},
      {id:"hks-m2",cat:"meds",priority:"stat",required:true,name:"Insulin 10 units IV + Dextrose 25g IV",detail:"Shifts K⁺ intracellularly. Onset 15-30 min",high_alert:true},
      {id:"hks-m3",cat:"meds",priority:"stat",required:true,name:"Albuterol 10-20mg Nebulized",detail:"Continuous neb. Shifts K⁺ into cells"},
      {id:"hks-m4",cat:"meds",priority:"urgent",required:true,name:"Sodium Polystyrene (Kayexalate) 30g PO/PR",detail:"Removes K⁺ from body. Slower onset but long-acting"},
      {id:"hks-c1",cat:"consults",priority:"stat",required:true,name:"Nephrology — EMERGENT Dialysis",detail:"If K⁺ > 7 or refractory to medical management"},
    ]
  },

  acute_pulmonary_edema: {
    id:"pulm_edema_acute", name:"Acute Pulmonary Edema", subtitle:"Flash Pulmonary Edema — Cardiogenic",
    icon:"🫁", specialty:"Cardiology", acuity:"stat",
    guideline:"AHA/ACC 2024 Cardiogenic Pulmonary Edema",
    tags:["Orthopnea","Crackles","Frothy Sputum","CPAP/BiPAP"],
    orders:[
      {id:"ape-a1",cat:"admit",priority:"stat",required:true,name:"Admit to ICU/CCU",detail:"Respiratory distress — may need intubation"},
      {id:"ape-v1",cat:"vitals",priority:"stat",required:true,name:"Continuous SpO₂ + Telemetry",detail:"Maintain SpO₂ ≥ 90-94%"},
      {id:"ape-v2",cat:"vitals",priority:"stat",required:true,name:"Position: Sitting Upright",detail:"Reduces preload — improves breathing"},
      {id:"ape-l1",cat:"labs",priority:"stat",required:true,name:"BNP / NT-proBNP",detail:"Diagnosis confirmation"},
      {id:"ape-l2",cat:"labs",priority:"stat",required:true,name:"BMP, CBC, Troponin",detail:"STAT baseline"},
      {id:"ape-i1",cat:"imaging",priority:"stat",required:true,name:"Chest X-ray Portable",detail:"Bilateral infiltrates (Kerley B lines, bat wing)"},
      {id:"ape-i2",cat:"imaging",priority:"stat",required:true,name:"12-Lead EKG",detail:"STAT — assess for concurrent ACS"},
      {id:"ape-m1",cat:"meds",priority:"stat",required:true,name:"IV Furosemide 80-160mg STAT",detail:"Diuresis. Titrate based on response",high_alert:true},
      {id:"ape-m2",cat:"meds",priority:"stat",required:true,name:"Nitroglycerin SL or IV",detail:"Afterload reduction. Caution if hypotensive"},
      {id:"ape-m3",cat:"meds",priority:"stat",required:false,name:"Morphine 2-4mg IV",detail:"Anxiolysis + venodilation. Use cautiously (respiratory depression)"},
      {id:"ape-n1",cat:"nursing",priority:"stat",required:true,name:"CPAP or BiPAP Mask",detail:"Non-invasive ventilation — first-line respiratory support",guideline:"AHA/ACC 2024 Class I"},
      {id:"ape-c1",cat:"consults",priority:"urgent",required:true,name:"Cardiology",detail:"Underlying etiology and HF management"},
    ]
  },

  acute_coronary_syndrome_nstemi_extended: {
    id:"nstemi_extended", name:"NSTEMI — Extended Management", subtitle:"Troponin Elevation, No ST Elevation",
    icon:"💔", specialty:"Cardiology", acuity:"urgent",
    guideline:"ESC 2024 NSTEMI Guidelines",
    tags:["Risk Stratification","Clopidogrel","Heparin","Serial Troponins"],
    orders:[
      {id:"nstemi-ext-a1",cat:"admit",priority:"urgent",required:true,name:"Admit to Telemetry/CCU",detail:"Continuous monitoring"},
      {id:"nstemi-ext-v1",cat:"vitals",priority:"urgent",required:true,name:"Continuous Telemetry",detail:"ST-segment monitoring"},
      {id:"nstemi-ext-l1",cat:"labs",priority:"stat",required:true,name:"High-sensitivity Troponin Serial",detail:"STAT, 3h, 6h. Rule-out algorithm per ESC"},
      {id:"nstemi-ext-l2",cat:"labs",priority:"stat",required:true,name:"HEART Score or TIMI Risk",detail:"Stratification for invasive vs conservative strategy"},
      {id:"nstemi-ext-m1",cat:"meds",priority:"stat",required:true,name:"Aspirin 325mg",detail:"STAT loading"},
      {id:"nstemi-ext-m2",cat:"meds",priority:"stat",required:true,name:"Clopidogrel 600mg or Prasugrel 60mg",detail:"P2Y12 inhibitor loading",high_alert:true},
      {id:"nstemi-ext-m3",cat:"meds",priority:"stat",required:true,name:"Unfractionated Heparin 80 units/kg bolus",detail:"Then 18 units/kg/hr infusion"},
      {id:"nstemi-ext-m4",cat:"meds",priority:"urgent",required:true,name:"Atorvastatin 80mg",detail:"High-intensity statin STAT"},
      {id:"nstemi-ext-m5",cat:"meds",priority:"urgent",required:true,name:"Sublingual NTG Q5min PRN",detail:"Anginal chest pain relief"},
      {id:"nstemi-ext-c1",cat:"consults",priority:"urgent",required:true,name:"Cardiology",detail:"Early invasive strategy timing discussion"},
    ]
  },
};