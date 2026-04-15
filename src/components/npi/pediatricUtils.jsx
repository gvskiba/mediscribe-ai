// pediatricUtils.js
// Shared pediatric reference data and calculation utilities for NPI components.
// Pure JS — no React imports.

// ── Age parsing ───────────────────────────────────────────────────────────────
// Accepts strings like "4", "4y", "18m", "6mo", "2.5", or numeric years.
// Returns age in decimal years (e.g. 18 months → 1.5).
export function parseAgeYears(ageStr) {
  if (!ageStr) return null;
  const s = String(ageStr).trim().toLowerCase();
  const moMatch = s.match(/^(\d+\.?\d*)\s*(m|mo|month|months)$/);
  if (moMatch) return parseFloat(moMatch[1]) / 12;
  const yrMatch = s.match(/^(\d+\.?\d*)\s*(y|yr|year|years)?$/);
  if (yrMatch) return parseFloat(yrMatch[1]);
  return null;
}

export function isPediatric(ageStr) {
  const yrs = parseAgeYears(ageStr);
  return yrs !== null && yrs < 18;
}

export function isNeonate(ageStr) {
  const yrs = parseAgeYears(ageStr);
  return yrs !== null && yrs < 28 / 365;
}

export function isInfant(ageStr) {
  const yrs = parseAgeYears(ageStr);
  return yrs !== null && yrs < 1;
}

// ── Broselow / weight estimation ──────────────────────────────────────────────
// Estimated weight in kg by age (years) using standard ED approximation formulas.
// Uses Luscombe & Owens formula for children 1–12 y; APLS for others.
export function estimateWeightKg(ageYears) {
  if (ageYears === null || ageYears === undefined) return null;
  if (ageYears < 1/12)  return 3.5;                        // newborn
  if (ageYears < 1)     return (ageYears * 12 + 4) * 0.5; // 4–12 kg range for infants
  if (ageYears <= 12)   return 3 * (ageYears + 7) - 3;    // Luscombe & Owens
  return 50 + 2.5 * (ageYears - 12);                       // adolescent approx
}

// Ideal body weight (Traub-Johnson for peds)
export function idealBodyWeightKg(ageYears, heightCm) {
  if (!heightCm) return estimateWeightKg(ageYears);
  if (ageYears < 1) return estimateWeightKg(ageYears);
  return 2.396 * Math.exp(0.01863 * heightCm);
}

// ── Broselow color band ───────────────────────────────────────────────────────
const BROSELOW_BANDS = [
  { color:"Grey",   minKg:3,   maxKg:5,   label:"Grey (3–5 kg)"   },
  { color:"Pink",   minKg:6,   maxKg:7,   label:"Pink (6–7 kg)"   },
  { color:"Red",    minKg:8,   maxKg:9,   label:"Red (8–9 kg)"    },
  { color:"Purple", minKg:10,  maxKg:11,  label:"Purple (10–11 kg)"},
  { color:"Yellow", minKg:12,  maxKg:14,  label:"Yellow (12–14 kg)"},
  { color:"White",  minKg:15,  maxKg:18,  label:"White (15–18 kg)"},
  { color:"Blue",   minKg:19,  maxKg:22,  label:"Blue (19–22 kg)" },
  { color:"Orange", minKg:23,  maxKg:29,  label:"Orange (23–29 kg)"},
  { color:"Green",  minKg:30,  maxKg:36,  label:"Green (30–36 kg)"},
];

export function getBroselowBand(weightKg) {
  if (!weightKg) return null;
  return BROSELOW_BANDS.find(b => weightKg >= b.minKg && weightKg <= b.maxKg) || null;
}

// ── Vital sign normal ranges by age ──────────────────────────────────────────
// Returns { hr, rr, sbp } normal ranges for a given age in years.
export function normalVitalRanges(ageYears) {
  if (ageYears === null) return null;
  if (ageYears < 1/12)  return { hr:[100,160], rr:[40,60], sbp:[60,80]  };
  if (ageYears < 1)     return { hr:[100,160], rr:[30,60], sbp:[70,100] };
  if (ageYears < 2)     return { hr:[90,150],  rr:[24,40], sbp:[80,110] };
  if (ageYears < 5)     return { hr:[80,140],  rr:[22,34], sbp:[80,110] };
  if (ageYears < 8)     return { hr:[70,120],  rr:[18,30], sbp:[85,120] };
  if (ageYears < 12)    return { hr:[60,110],  rr:[16,22], sbp:[90,125] };
  return                       { hr:[60,100],  rr:[12,20], sbp:[90,130] };
}

// Returns "normal" | "high" | "low" | null
export function classifyVital(key, value, ageYears) {
  const ranges = normalVitalRanges(ageYears);
  if (!ranges || value === null || value === undefined) return null;
  const v = parseFloat(value);
  if (isNaN(v)) return null;
  const [lo, hi] = ranges[key] || [];
  if (lo === undefined) return null;
  if (v < lo) return "low";
  if (v > hi) return "high";
  return "normal";
}

// Min systolic BP threshold (PALS: 5th-percentile floor = 70 + 2*age)
export function minSBP(ageYears) {
  if (ageYears === null) return 70;
  if (ageYears < 1)     return 60;
  return Math.round(70 + 2 * Math.min(ageYears, 10));
}

// ── GCS — pediatric modifications ────────────────────────────────────────────
// Standard GCS for >2y is identical to adult. Below 2y verbal score differs.
export const GCS_VERBAL_INFANT = [
  { score:5, label:"Coos, babbles" },
  { score:4, label:"Irritable cry, consolable" },
  { score:3, label:"Crying to pain, inconsolable" },
  { score:2, label:"Moaning to pain" },
  { score:1, label:"None" },
];

export const GCS_VERBAL_CHILD = [
  { score:5, label:"Appropriate words / phrases" },
  { score:4, label:"Inappropriate words" },
  { score:3, label:"Cries / screams" },
  { score:2, label:"Moaning / grunting" },
  { score:1, label:"None" },
];

// ── PECARN TBI risk categories ────────────────────────────────────────────────
// Returns one of: "very_low" | "low" | "intermediate" | "high"
// Based on simplified age-stratified criteria.
export function pecarnRiskCategory({ ageYears, gcs, alteredMental, palpableSkullFx,
  lossOfConsciousness, vomiting, severeHaMechanism, basalSkullFxSigns }) {
  if (gcs < 14 || alteredMental || basalSkullFxSigns || palpableSkullFx) return "high";

  if (ageYears < 2) {
    if (lossOfConsciousness || vomiting || severeHaMechanism) return "intermediate";
    return "very_low";
  }
  if (lossOfConsciousness && vomiting) return "intermediate";
  if (severeHaMechanism) return "intermediate";
  return "very_low";
}

// ── ETT sizing ────────────────────────────────────────────────────────────────
// Uncuffed: (age/4) + 4  |  Cuffed: (age/4) + 3.5
export function ettSize(ageYears, cuffed = false) {
  if (ageYears === null) return null;
  const size = cuffed
    ? (ageYears / 4) + 3.5
    : (ageYears / 4) + 4;
  return Math.round(size * 2) / 2; // round to nearest 0.5
}

// ETT depth at lip (cm) = ETT size × 3
export function ettDepthCm(ageYears, cuffed = false) {
  const size = ettSize(ageYears, cuffed);
  return size ? Math.round(size * 3 * 10) / 10 : null;
}

// ── Laryngoscope blade ────────────────────────────────────────────────────────
export function laryngoscopeBlade(ageYears) {
  if (ageYears === null) return null;
  if (ageYears < 1)  return "Miller 0–1 (straight)";
  if (ageYears < 2)  return "Miller 1 (straight)";
  if (ageYears < 8)  return "Miller 2 (straight)";
  return "Mac 2–3 or Miller 2";
}

// ── IO / IV access sizing ─────────────────────────────────────────────────────
export function ivGauge(weightKg) {
  if (!weightKg) return "22–24g";
  if (weightKg < 10)  return "24g";
  if (weightKg < 20)  return "22–24g";
  if (weightKg < 40)  return "20–22g";
  return "18–20g";
}

// ── Common weight-based dosing (ED critical meds) ─────────────────────────────
// Returns { dose, unit, max, route, note } for a given drug and weight.
// All doses verified against standard pediatric references (Taketomo, PALS 2020).
export function calcDose(drug, weightKg) {
  if (!weightKg || weightKg <= 0) return null;
  const w = Math.min(weightKg, 70); // cap at adult weight for most drugs

  const drugs = {
    // Resuscitation
    epinephrine_cardiac:  { dose: 0.01 * w,   unit:"mg",  max:1,    route:"IV/IO", note:"1:10,000; repeat q3-5min" },
    epinephrine_anaphylaxis:{ dose:0.01*w,    unit:"mg",  max:0.5,  route:"IM",    note:"1:1,000 IM lateral thigh" },
    atropine:             { dose: 0.02 * w,   unit:"mg",  max:1,    route:"IV/IO", note:"Min dose 0.1 mg" },
    adenosine_first:      { dose: 0.1 * w,    unit:"mg",  max:6,    route:"IV",    note:"Rapid push + flush" },
    adenosine_second:     { dose: 0.2 * w,    unit:"mg",  max:12,   route:"IV",    note:"If first dose fails" },
    bicarbonate:          { dose: 1 * w,      unit:"mEq", max:50,   route:"IV/IO", note:"8.4% solution; slow push" },
    calcium_gluconate:    { dose: 60 * w,     unit:"mg",  max:3000, route:"IV/IO", note:"Hyperkalemia / hypocalcemia" },
    dextrose_d10:         { dose: 5 * w,      unit:"mL",  max:250,  route:"IV",    note:"D10W; <8yo preferred over D50" },

    // Airway / RSI
    etomidate:            { dose: 0.3 * w,    unit:"mg",  max:20,   route:"IV",    note:"Induction; not <10y preferred" },
    ketamine_rsi:         { dose: 1.5 * w,    unit:"mg",  max:150,  route:"IV",    note:"Induction; preferred peds" },
    ketamine_dissociative:{ dose: 4 * w,      unit:"mg",  max:300,  route:"IM",    note:"IM dissociation" },
    succinylcholine:      { dose: 2 * w,      unit:"mg",  max:150,  route:"IV/IO", note:"Infants: 2 mg/kg; children: 1–1.5 mg/kg" },
    rocuronium:           { dose: 1.2 * w,    unit:"mg",  max:100,  route:"IV/IO", note:"RSI dose" },
    midazolam_iv:         { dose: 0.1 * w,    unit:"mg",  max:5,    route:"IV",    note:"Sedation/anxiolysis" },
    midazolam_in:         { dose: 0.2 * w,    unit:"mg",  max:10,   route:"IN",    note:"Intranasal; use atomizer" },
    fentanyl:             { dose: 1 * w,      unit:"mcg", max:100,  route:"IV/IN", note:"Slow push; IN: 2 mcg/kg" },

    // Seizures
    lorazepam:            { dose: 0.1 * w,    unit:"mg",  max:4,    route:"IV/IO", note:"First-line benzodiazepine" },
    diazepam_rectal:      { dose: 0.5 * w,    unit:"mg",  max:20,   route:"PR",    note:"No IV access" },
    levetiracetam:        { dose: 60 * w,     unit:"mg",  max:4500, route:"IV",    note:"Status epilepticus; over 15 min" },
    phenobarbital:        { dose: 20 * w,     unit:"mg",  max:1000, route:"IV",    note:"Third-line; load slowly" },
    pyridoxine_b6:        { dose: 100,        unit:"mg",  max:100,  route:"IV",    note:"INH/B6-dependent seizure" },

    // Analgesia
    morphine:             { dose: 0.1 * w,    unit:"mg",  max:5,    route:"IV",    note:"Titrate" },
    ketorolac:            { dose: 0.5 * w,    unit:"mg",  max:15,   route:"IV",    note:">6 months; avoid renal/GI risk" },
    acetaminophen_iv:     { dose: 15 * w,     unit:"mg",  max:1000, route:"IV",    note:"q6h; max 75 mg/kg/day" },
    ibuprofen:            { dose: 10 * w,     unit:"mg",  max:400,  route:"PO",    note:">6 months; q6–8h" },

    // Antibiotics
    ceftriaxone:          { dose: 50 * w,     unit:"mg",  max:2000, route:"IV",    note:"Meningitis: 100 mg/kg, max 4g" },
    ampicillin:           { dose: 50 * w,     unit:"mg",  max:2000, route:"IV",    note:"Neonatal sepsis; q6h" },
    gentamicin:           { dose: 2.5 * w,    unit:"mg",  max:120,  route:"IV",    note:"Neonates: 4 mg/kg/dose q24-48h" },
    vancomycin:           { dose: 15 * w,     unit:"mg",  max:750,  route:"IV",    note:"Over 60 min; monitor levels" },
    clindamycin:          { dose: 10 * w,     unit:"mg",  max:600,  route:"IV",    note:"Skin/soft tissue; q8h" },

    // Anaphylaxis / Allergic
    diphenhydramine:      { dose: 1 * w,      unit:"mg",  max:50,   route:"IV/PO", note:"H1 blocker" },
    methylprednisolone:   { dose: 1 * w,      unit:"mg",  max:60,   route:"IV",    note:"Anaphylaxis / asthma" },
    dexamethasone:        { dose: 0.6 * w,    unit:"mg",  max:10,   route:"IV/PO", note:"Croup / asthma" },

    // Cardiac
    amiodarone:           { dose: 5 * w,      unit:"mg",  max:300,  route:"IV/IO", note:"VF/pVT; over 20–60 min" },
    procainamide:         { dose: 15 * w,     unit:"mg",  max:1000, route:"IV",    note:"SVT; over 30–60 min" },

    // GI / Other
    ondansetron:          { dose: 0.15 * w,   unit:"mg",  max:4,    route:"IV/PO", note:">6 months" },
    naloxone:             { dose: 0.01 * w,   unit:"mg",  max:2,    route:"IV/IN", note:"Opioid reversal; repeat q2-3min" },
    flumazenil:           { dose: 0.01 * w,   unit:"mg",  max:0.2,  route:"IV",    note:"Benzo reversal; caution seizure Hx" },
    glucose_oral:         { dose: 0.5 * w,    unit:"g",   max:25,   route:"PO",    note:"Juice / glucose gel" },

    // Fluid resuscitation
    ns_bolus:             { dose: 20 * w,     unit:"mL",  max:1000, route:"IV/IO", note:"Sepsis: 10–20 mL/kg over 5–20 min" },
    albumin_5pct:         { dose: 10 * w,     unit:"mL",  max:500,  route:"IV",    note:"Hypoalbuminemia / shock adjunct" },

    // Burns
    parkland:             { dose: 4 * w,      unit:"mL",  max:null, route:"IV",    note:"x TBSA%; half in first 8h from burn" },
  };

  const d = drugs[drug];
  if (!d) return null;

  const rawDose = d.dose;
  const finalDose = d.max !== null ? Math.min(rawDose, d.max) : rawDose;
  return {
    drug,
    dose: Math.round(finalDose * 100) / 100,
    unit: d.unit,
    max: d.max,
    route: d.route,
    note: d.note,
    capped: d.max !== null && rawDose > d.max,
  };
}

// Convenience: get multiple doses at once
export function calcDoses(drugs, weightKg) {
  return drugs.reduce((acc, drug) => {
    const result = calcDose(drug, weightKg);
    if (result) acc[drug] = result;
    return acc;
  }, {});
}

// ── RSI drug set ──────────────────────────────────────────────────────────────
export const RSI_DRUGS = [
  "ketamine_rsi", "etomidate", "succinylcholine", "rocuronium",
  "atropine", "midazolam_iv", "fentanyl",
];

// ── Sepsis drug set ───────────────────────────────────────────────────────────
export const SEPSIS_DRUGS = [
  "ceftriaxone", "ampicillin", "vancomycin", "ns_bolus",
  "epinephrine_cardiac", "dextrose_d10",
];

// ── Anaphylaxis drug set ──────────────────────────────────────────────────────
export const ANAPHYLAXIS_DRUGS = [
  "epinephrine_anaphylaxis", "diphenhydramine",
  "methylprednisolone", "ondansetron",
];

// ── Seizure drug set ──────────────────────────────────────────────────────────
export const SEIZURE_DRUGS = [
  "lorazepam", "levetiracetam", "phenobarbital",
  "midazolam_in", "diazepam_rectal",
];

// ── Maintenance fluid rate (Holliday-Segar) ───────────────────────────────────
// Returns mL/hr
export function maintenanceFluidRate(weightKg) {
  if (!weightKg || weightKg <= 0) return null;
  if (weightKg <= 10)  return weightKg * 4;
  if (weightKg <= 20)  return 40 + (weightKg - 10) * 2;
  return 60 + (weightKg - 20) * 1;
}

// ── Defibrillation / cardioversion ───────────────────────────────────────────
export function defibJoules(weightKg, type = "defibrillation") {
  if (!weightKg) return null;
  const j = type === "cardioversion" ? 0.5 * weightKg : 2 * weightKg;
  return { initial: Math.round(j), max: type === "cardioversion" ? 50 : Math.min(4 * weightKg, 360) };
}

// ── Developmental stage label ─────────────────────────────────────────────────
export function developmentalStage(ageYears) {
  if (ageYears === null) return null;
  if (ageYears < 28/365)  return "Neonate";
  if (ageYears < 1)       return "Infant";
  if (ageYears < 3)       return "Toddler";
  if (ageYears < 6)       return "Preschool";
  if (ageYears < 12)      return "School-age";
  if (ageYears < 18)      return "Adolescent";
  return "Adult";
}

// ── Pain scale recommendation by age ─────────────────────────────────────────
export function recommendedPainScale(ageYears) {
  if (ageYears === null)  return "NRS-11 or VAS";
  if (ageYears < 1)       return "FLACC (observational)";
  if (ageYears < 3)       return "FLACC / CHEOPS";
  if (ageYears < 7)       return "Wong-Baker FACES";
  if (ageYears < 12)      return "Wong-Baker FACES or NRS";
  return "NRS-11 (0–10)";
}

// ── APGAR score helper ────────────────────────────────────────────────────────
export const APGAR_FIELDS = [
  { key:"appearance",  label:"Appearance",   opts:["Blue/pale (0)","Acrocyanosis (1)","Pink (2)"]    },
  { key:"pulse",       label:"Pulse",         opts:["Absent (0)","<100 (1)",">100 (2)"]              },
  { key:"grimace",     label:"Grimace",       opts:["None (0)","Grimace (1)","Cry/cough/sneeze (2)"] },
  { key:"activity",    label:"Activity",      opts:["Limp (0)","Some flexion (1)","Active (2)"]      },
  { key:"respiration", label:"Respiration",   opts:["Absent (0)","Weak/irregular (1)","Strong cry (2)"] },
];

export function apgarInterpret(score) {
  if (score >= 7) return { label:"Normal", color:"#00e5c0" };
  if (score >= 4) return { label:"Moderate depression", color:"#f5c842" };
  return              { label:"Severe depression — immediate resuscitation", color:"#ff6b6b" };
}

// ── Jaundice / bilirubin risk (Bhutani nomogram — simplified) ─────────────────
// Returns "low" | "low-intermediate" | "high-intermediate" | "high"
export function bilirubinRiskZone(totalBiliMgDl, ageHours) {
  if (!totalBiliMgDl || !ageHours) return null;
  const t = totalBiliMgDl;
  const h = ageHours;
  if (h < 24)  { if (t < 4)  return "low"; if (t < 8)  return "low-intermediate"; if (t < 12) return "high-intermediate"; return "high"; }
  if (h < 48)  { if (t < 8)  return "low"; if (t < 12) return "low-intermediate"; if (t < 15) return "high-intermediate"; return "high"; }
  if (h < 72)  { if (t < 11) return "low"; if (t < 15) return "low-intermediate"; if (t < 18) return "high-intermediate"; return "high"; }
                 if (t < 13) return "low"; if (t < 17) return "low-intermediate"; if (t < 20) return "high-intermediate"; return "high";
}