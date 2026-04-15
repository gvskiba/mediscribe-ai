// pediatricUtils.js
// Shared pediatric reference data for Notrya.
// Imported by PediatricModePanel, WeightDoseHub, SmartDischargeHub,
// VitalsTab overlay, and any component that needs age-adjusted logic.
//
// All age values in years unless noted. Weights in kg.
// ─────────────────────────────────────────────────────────────────────────────

// ── Pediatric age classification ──────────────────────────────────────────────
export function getAgeBand(ageYears) {
  const a = parseFloat(ageYears);
  if (isNaN(a) || a >= 18) return null;
  if (a < 0.083)  return "neonate";      // < 1 month
  if (a < 1)      return "infant";       // 1–11 months
  if (a < 3)      return "toddler";      // 1–2 years
  if (a < 6)      return "preschool";    // 3–5 years
  if (a < 12)     return "school_age";   // 6–11 years
  return "adolescent";                   // 12–17 years
}

export const AGE_BAND_LABELS = {
  neonate:    "Neonate (<1 mo)",
  infant:     "Infant (1–11 mo)",
  toddler:    "Toddler (1–2 yr)",
  preschool:  "Preschool (3–5 yr)",
  school_age: "School Age (6–11 yr)",
  adolescent: "Adolescent (12–17 yr)",
};

// ── Age-appropriate vital sign ranges ─────────────────────────────────────────
// Each band: { hr, sbp, rr, spo2 }
// hr/sbp/rr: [low_normal, high_normal, critical_low, critical_high]
// spo2: [normal_low, critical_low]

export const VITAL_RANGES = {
  neonate: {
    hr:   { low:100, high:160, critLow:80,  critHigh:180, unit:"bpm"           },
    sbp:  { low:60,  high:90,  critLow:50,  critHigh:100, unit:"mmHg systolic" },
    rr:   { low:30,  high:60,  critLow:20,  critHigh:70,  unit:"breaths/min"   },
    spo2: { low:95,  critLow:90                                                  },
  },
  infant: {
    hr:   { low:100, high:160, critLow:80,  critHigh:180, unit:"bpm"           },
    sbp:  { low:70,  high:100, critLow:60,  critHigh:120, unit:"mmHg systolic" },
    rr:   { low:25,  high:50,  critLow:20,  critHigh:60,  unit:"breaths/min"   },
    spo2: { low:95,  critLow:90                                                  },
  },
  toddler: {
    hr:   { low:90,  high:150, critLow:70,  critHigh:170, unit:"bpm"           },
    sbp:  { low:80,  high:110, critLow:70,  critHigh:130, unit:"mmHg systolic" },
    rr:   { low:20,  high:40,  critLow:15,  critHigh:50,  unit:"breaths/min"   },
    spo2: { low:95,  critLow:90                                                  },
  },
  preschool: {
    hr:   { low:80,  high:140, critLow:60,  critHigh:160, unit:"bpm"           },
    sbp:  { low:80,  high:110, critLow:70,  critHigh:130, unit:"mmHg systolic" },
    rr:   { low:20,  high:35,  critLow:15,  critHigh:45,  unit:"breaths/min"   },
    spo2: { low:95,  critLow:90                                                  },
  },
  school_age: {
    hr:   { low:70,  high:120, critLow:55,  critHigh:140, unit:"bpm"           },
    sbp:  { low:85,  high:120, critLow:70,  critHigh:140, unit:"mmHg systolic" },
    rr:   { low:15,  high:30,  critLow:12,  critHigh:40,  unit:"breaths/min"   },
    spo2: { low:95,  critLow:90                                                  },
  },
  adolescent: {
    hr:   { low:60,  high:100, critLow:50,  critHigh:130, unit:"bpm"           },
    sbp:  { low:90,  high:130, critLow:80,  critHigh:150, unit:"mmHg systolic" },
    rr:   { low:12,  high:20,  critLow:10,  critHigh:30,  unit:"breaths/min"   },
    spo2: { low:95,  critLow:90                                                  },
  },
};

// ── Minimum systolic BP formula (hypotension threshold) ───────────────────────
// Pediatric hypotension: SBP < 70 + (2 × age in years) for 1–10yo
export function minSBP(ageYears) {
  const a = parseFloat(ageYears);
  if (isNaN(a)) return null;
  if (a < 1)  return 60;
  if (a <= 10) return Math.round(70 + 2 * a);
  return 90;
}

// ── Vital sign interpretation for a pediatric patient ─────────────────────────
// Returns array of { param, value, status, label, range }
// status: "normal" | "low" | "high" | "critical_low" | "critical_high"
export function interpretPedVitals(vitals, ageBand, ageYears) {
  if (!ageBand || !VITAL_RANGES[ageBand]) return [];
  const ranges = VITAL_RANGES[ageBand];
  const results = [];

  // Heart rate
  const hr = parseFloat(vitals?.hr);
  if (!isNaN(hr) && hr > 0) {
    const r = ranges.hr;
    const status = hr < r.critLow    ? "critical_low"
      : hr > r.critHigh ? "critical_high"
      : hr < r.low      ? "low"
      : hr > r.high     ? "high"
      : "normal";
    results.push({ param:"HR", value:hr, unit:"bpm", status,
      range:`Normal ${r.low}–${r.high}`,
      hint: status !== "normal" ? `Age-appropriate range: ${r.low}–${r.high} bpm` : "" });
  }

  // Systolic BP
  const bpParts = (vitals?.bp||"").split("/");
  const sbp = parseFloat(bpParts[0]);
  if (!isNaN(sbp) && sbp > 0) {
    const r      = ranges.sbp;
    const minBP  = minSBP(ageYears);
    const status = sbp < r.critLow    ? "critical_low"
      : sbp > r.critHigh  ? "critical_high"
      : sbp < (minBP||r.low) ? "low"
      : sbp > r.high      ? "high"
      : "normal";
    results.push({ param:"SBP", value:sbp, unit:"mmHg", status,
      range:`Normal ${r.low}–${r.high} · Hypotension <${minBP||r.low}`,
      hint: status !== "normal" ? `Peds hypotension threshold: <${minBP||r.low} mmHg` : "" });
  }

  // Respiratory rate
  const rr = parseFloat(vitals?.rr);
  if (!isNaN(rr) && rr > 0) {
    const r = ranges.rr;
    const status = rr < r.critLow    ? "critical_low"
      : rr > r.critHigh ? "critical_high"
      : rr < r.low      ? "low"
      : rr > r.high     ? "high"
      : "normal";
    results.push({ param:"RR", value:rr, unit:"/min", status,
      range:`Normal ${r.low}–${r.high}`,
      hint: status !== "normal" ? `Age-appropriate range: ${r.low}–${r.high}/min` : "" });
  }

  // SpO2
  const spo2 = parseFloat(vitals?.spo2);
  if (!isNaN(spo2) && spo2 > 0) {
    const r = ranges.spo2;
    const status = spo2 < r.critLow ? "critical_low"
      : spo2 < r.low    ? "low"
      : "normal";
    results.push({ param:"SpO2", value:spo2, unit:"%", status,
      range:`Normal ≥${r.low}%`,
      hint: status !== "normal" ? `Critical threshold: <${r.critLow}%` : "" });
  }

  return results;
}

// ── Broselow color bands ──────────────────────────────────────────────────────
// Standard 2011 Broselow-Luten tape
// Each band: { color, weightMin, weightMax, lengthMin, lengthMax, ageApprox }
export const BROSELOW_BANDS = [
  { color:"Grey",       hex:"#9e9e9e", weightMin:3,   weightMax:5,   lengthMin:46,  lengthMax:59,  ageApprox:"0–3 mo"    },
  { color:"Pink",       hex:"#f06292", weightMin:6,   weightMax:7,   lengthMin:60,  lengthMax:67,  ageApprox:"3–6 mo"    },
  { color:"Red",        hex:"#ef5350", weightMin:8,   weightMax:9,   lengthMin:68,  lengthMax:74,  ageApprox:"6–9 mo"    },
  { color:"Purple",     hex:"#ab47bc", weightMin:10,  weightMax:11,  lengthMin:75,  lengthMax:84,  ageApprox:"9–18 mo"   },
  { color:"Yellow",     hex:"#fdd835", weightMin:12,  weightMax:14,  lengthMin:85,  lengthMax:94,  ageApprox:"18 mo–3 yr"},
  { color:"White",      hex:"#eeeeee", weightMin:15,  weightMax:18,  lengthMin:95,  lengthMax:107, ageApprox:"3–4 yr"    },
  { color:"Blue",       hex:"#42a5f5", weightMin:19,  weightMax:22,  lengthMin:108, lengthMax:117, ageApprox:"4–6 yr"    },
  { color:"Orange",     hex:"#ffa726", weightMin:24,  weightMax:28,  lengthMin:118, lengthMax:129, ageApprox:"6–8 yr"    },
  { color:"Green",      hex:"#66bb6a", weightMin:29,  weightMax:36,  lengthMin:130, lengthMax:143, ageApprox:"8–10 yr"   },
  { color:"Tan/Khaki",  hex:"#bcaaa4", weightMin:37,  weightMax:40,  lengthMin:144, lengthMax:150, ageApprox:"10–12 yr"  },
];

export function getBroscolowBandByWeight(weightKg) {
  const w = parseFloat(weightKg);
  if (isNaN(w) || w <= 0) return null;
  return BROSELOW_BANDS.find(b => w >= b.weightMin && w <= b.weightMax)
    || (w < 3  ? BROSELOW_BANDS[0]
      : w > 40 ? null    // beyond tape — treat as adult
      : BROSELOW_BANDS[BROSELOW_BANDS.length - 1]);
}

export function getBroscolowBandByAge(ageYears) {
  const a = parseFloat(ageYears);
  if (isNaN(a) || a >= 13) return null;
  // Map age to approximate weight then find band
  const estWeight = estimateWeightFromAge(a);
  return getBroscolowBandByWeight(estWeight);
}

// ── Weight estimation ─────────────────────────────────────────────────────────
// Standard pediatric weight estimation formulas
export function estimateWeightFromAge(ageYears) {
  const a = parseFloat(ageYears);
  if (isNaN(a) || a < 0) return null;
  if (a < 0.083) return 3.5;               // newborn
  if (a < 1)     return Math.round(3.5 + a * 12 * 0.5); // roughly 0.5kg/mo gain
  if (a <= 5)    return Math.round((a + 4) * 2);          // (age + 4) × 2 — APLS
  if (a <= 14)   return Math.round(a * 2.5 + 8);          // 2.5 × age + 8
  return 50;
}

// ── Pediatric RSI weight-based doses ──────────────────────────────────────────
export const PED_RSI_DRUGS = [
  {
    name:"Atropine (pre-RSI)",
    indication:"Pre-medication for infants <1yr and when ketamine or succinylcholine used",
    dose:0.02, unit:"mg/kg", minDose:0.1, maxDose:0.5,
    conc:"0.1 mg/mL",
    note:"Minimum 0.1 mg to avoid paradoxical bradycardia. Give 2–3 min before induction.",
  },
  {
    name:"Etomidate",
    indication:"Induction — hemodynamically unstable",
    dose:0.3, unit:"mg/kg", minDose:null, maxDose:20,
    conc:"2 mg/mL",
    note:"Avoid in sepsis. Single dose only.",
  },
  {
    name:"Ketamine",
    indication:"Induction — preferred in bronchospasm, hypotension",
    dose:2.0, unit:"mg/kg", minDose:null, maxDose:200,
    conc:"10 mg/mL or 50 mg/mL",
    note:"2 mg/kg IV for RSI. 4–5 mg/kg IM. Increases secretions — consider atropine pretreatment.",
  },
  {
    name:"Succinylcholine",
    indication:"Depolarizing paralytic",
    dose:2.0, unit:"mg/kg", minDose:null, maxDose:150,
    conc:"20 mg/mL",
    note:"2 mg/kg for children <10kg; 1.5 mg/kg for older children. Administer atropine pre-treatment in <1yr.",
  },
  {
    name:"Rocuronium",
    indication:"Non-depolarizing paralytic — succinylcholine contraindicated",
    dose:1.2, unit:"mg/kg", minDose:null, maxDose:100,
    conc:"10 mg/mL",
    note:"1.2 mg/kg for RSI. Reversed by sugammadex 16 mg/kg.",
  },
  {
    name:"Fentanyl (analgesia)",
    indication:"Pre-RSI analgesia / procedural pain",
    dose:2.0, unit:"mcg/kg", minDose:null, maxDose:100,
    conc:"50 mcg/mL",
    note:"1–2 mcg/kg IV. Intranasal: 1.5 mcg/kg via MAD.",
  },
  {
    name:"Midazolam",
    indication:"Sedation / seizure / anxiolysis",
    dose:0.1, unit:"mg/kg", minDose:null, maxDose:5,
    conc:"1 mg/mL or 5 mg/mL",
    note:"0.1 mg/kg IV/IM. Intranasal: 0.2 mg/kg (max 10 mg) via MAD.",
  },
];

// ── Pediatric epinephrine for anaphylaxis ─────────────────────────────────────
export const PED_EPI_ANAPHYLAXIS = {
  name:"Epinephrine (anaphylaxis)",
  dose:0.01, unit:"mg/kg",
  route:"IM — anterolateral thigh",
  conc:"1 mg/mL (1:1000)",
  minDose:0.1, maxDose:0.5,
  note:"0.01 mg/kg IM (1:1000). Max 0.5 mg. May repeat q5–15 min.",
};

// ── Cardiac arrest doses ──────────────────────────────────────────────────────
export const PED_ARREST_DRUGS = [
  {
    name:"Epinephrine (arrest)",
    dose:0.01, unit:"mg/kg",
    conc:"0.1 mg/mL (1:10,000)",
    maxDose:1,
    note:"0.01 mg/kg IV/IO q3–5 min. Use 1:10,000 concentration.",
  },
  {
    name:"Amiodarone (VF/pVT)",
    dose:5, unit:"mg/kg",
    conc:"50 mg/mL",
    maxDose:300,
    note:"5 mg/kg IV/IO rapid push. May repeat x2 for refractory VF/pVT.",
  },
  {
    name:"Atropine (bradycardia)",
    dose:0.02, unit:"mg/kg",
    conc:"0.1 mg/mL",
    minDose:0.1, maxDose:0.5,
    note:"Minimum 0.1 mg. For symptomatic bradycardia — epinephrine preferred in arrest.",
  },
  {
    name:"Adenosine (SVT) — 1st dose",
    dose:0.1, unit:"mg/kg",
    conc:"3 mg/mL",
    maxDose:6,
    note:"0.1 mg/kg rapid IV push + flush. Max 6 mg first dose.",
  },
  {
    name:"Adenosine (SVT) — 2nd dose",
    dose:0.2, unit:"mg/kg",
    conc:"3 mg/mL",
    maxDose:12,
    note:"0.2 mg/kg if first dose unsuccessful. Max 12 mg.",
  },
  {
    name:"Sodium Bicarbonate",
    dose:1, unit:"mEq/kg",
    conc:"1 mEq/mL (8.4%)",
    maxDose:50,
    note:"1 mEq/kg IV/IO. Dilute 1:1 with sterile water in neonates and infants.",
  },
  {
    name:"Calcium Gluconate",
    dose:60, unit:"mg/kg",
    conc:"100 mg/mL (10%)",
    maxDose:3000,
    note:"For hyperkalemia or CCB OD. Slow IV push.",
  },
  {
    name:"Glucose (D10W neonates)",
    dose:5, unit:"mL/kg",
    conc:"D10W — 100 mg/mL",
    maxDose:null,
    note:"For neonatal hypoglycemia. Use D25W for infants/toddlers (2 mL/kg).",
  },
];

// ── Defibrillation / cardioversion ────────────────────────────────────────────
export function defibEnergy(weightKg, type) {
  const w = parseFloat(weightKg) || 0;
  if (type === "defib_first") return Math.round(w * 2);
  if (type === "defib_sub")   return Math.round(Math.min(w * 4, 360));
  if (type === "sync_svt")    return Math.round(w * 0.5);
  if (type === "sync_afib")   return Math.round(w * 1);
  return 0;
}

export const DEFIB_TYPES = [
  { id:"defib_first", label:"Defibrillation — 1st shock",    formula:"2 J/kg"          },
  { id:"defib_sub",   label:"Defibrillation — subsequent",   formula:"4 J/kg (max 360)"},
  { id:"sync_svt",    label:"Synchronized cardioversion SVT",formula:"0.5–1 J/kg"      },
  { id:"sync_afib",   label:"Synchronized cardioversion VT", formula:"1–2 J/kg"        },
];

// ── Endotracheal tube sizing ───────────────────────────────────────────────────
export function ettSize(ageYears) {
  const a = parseFloat(ageYears);
  if (isNaN(a)) return null;
  if (a < 0.5)  return { uncuffed:"3.5", cuffed:"3.0", depth: 9 };
  if (a < 1)    return { uncuffed:"4.0", cuffed:"3.5", depth:10 };
  // Cuffed: (age/4) + 3.5; Uncuffed: (age/4) + 4
  const cuffed   = ((a / 4) + 3.5).toFixed(1);
  const uncuffed = ((a / 4) + 4.0).toFixed(1);
  const depth    = Math.round((a / 2) + 12);
  return { uncuffed, cuffed, depth };
}

// ── Fluid resuscitation ───────────────────────────────────────────────────────
export function ivrFluid(weightKg, type) {
  const w = parseFloat(weightKg) || 0;
  if (type === "bolus_20")    return Math.round(w * 20);   // sepsis first bolus
  if (type === "bolus_10")    return Math.round(w * 10);   // cardiac/sepsis cautious
  if (type === "maintenance") {                             // Holliday-Segar
    if (w <= 10)  return Math.round(w * 100);              // mL/day
    if (w <= 20)  return Math.round(1000 + (w - 10) * 50);
    return Math.round(1500 + (w - 20) * 20);
  }
  return 0;
}

// ── Medication safety flags (pediatric-specific) ──────────────────────────────
// Returns true if the drug name contains a term that needs extra caution in peds
const PED_CAUTION_TERMS = [
  { term:"aspirin",      reason:"Reye syndrome risk — contraindicated in viral illness in children" },
  { term:"codeine",      reason:"FDA black box — ultra-rapid metabolizers, post-tonsillectomy deaths" },
  { term:"tramadol",     reason:"FDA warning in pediatric patients — respiratory depression risk" },
  { term:"ketorolac",    reason:"Use with caution — max 5 days; not approved <2yr" },
  { term:"metoclopramide",reason:"Extrapyramidal reactions more common in children — minimize dose/duration" },
  { term:"promethazine", reason:"Contraindicated <2yr — fatal respiratory depression risk" },
  { term:"bismuth",      reason:"Reye syndrome association — avoid in viral illness" },
  { term:"tetracycline", reason:"Dental staining and bone growth inhibition — avoid <8yr" },
  { term:"doxycycline",  reason:"Dental staining and bone growth inhibition — generally avoid <8yr (exception: RMSF)" },
  { term:"fluoroquinolone",reason:"Joint cartilage effects — avoid unless no alternatives" },
  { term:"ciprofloxacin",reason:"Fluoroquinolone — avoid unless no alternatives in peds" },
  { term:"levofloxacin", reason:"Fluoroquinolone — avoid unless no alternatives in peds" },
  { term:"chloramphenicol",reason:"Gray baby syndrome — avoid in neonates" },
];

export function getPedMedFlags(medicationName, ageYears) {
  if (!medicationName) return null;
  const name = medicationName.toLowerCase();
  const age  = parseFloat(ageYears);
  const flag = PED_CAUTION_TERMS.find(t => name.includes(t.term));
  if (!flag) return null;
  // Some only relevant at specific ages
  if (flag.term === "tetracycline" && age >= 8)   return null;
  if (flag.term === "doxycycline"  && age >= 8)   return null;
  if (flag.term === "promethazine" && age >= 2)   return null;
  if (flag.term === "chloramphenicol" && age >= 0.25) return null;
  return flag;
}

export function getPedMedFlagsForList(medications, ageYears) {
  if (!medications?.length) return [];
  return (medications || [])
    .map(m => {
      const name = typeof m === "string" ? m : m.name || "";
      const flag = getPedMedFlags(name, ageYears);
      return flag ? { drug:name, ...flag } : null;
    })
    .filter(Boolean);
}

// ── PALS fluid volumes (quick reference) ─────────────────────────────────────
export const PALS_QUICK = [
  { label:"Initial NS/LR bolus (sepsis)",        formula:"20 mL/kg", type:"bolus_20"    },
  { label:"Cautious bolus (cardiac/renal)",       formula:"10 mL/kg", type:"bolus_10"    },
  { label:"Daily maintenance (Holliday-Segar)",   formula:"See calculation", type:"maintenance" },
];

// ── Normal values summary by band (for display) ───────────────────────────────
export function getVitalSummary(ageBand) {
  const r = VITAL_RANGES[ageBand];
  if (!r) return null;
  return {
    hr:   `${r.hr.low}–${r.hr.high} bpm`,
    sbp:  `${r.sbp.low}–${r.sbp.high} mmHg`,
    rr:   `${r.rr.low}–${r.rr.high}/min`,
    spo2: `≥${r.spo2.low}%`,
  };
}