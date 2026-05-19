// commandkit_data.js — Notrya CommandKit data layer
// Medications, Imaging, Labs, Scenarios, Hub links, and dose calculation utilities

// ─── UTILS ───────────────────────────────────────────────────────────────────
export const lbsToKg = (lbs) => Math.round(lbs / 2.205 * 10) / 10;
export const kgToLbs = (kg)  => Math.round(kg  * 2.205 * 10) / 10;
export const isPediatric = (ageYears, weightKg) =>
  (ageYears != null && ageYears < 18) || (weightKg != null && weightKg < 40);

// ─── DRUG CATEGORIES ─────────────────────────────────────────────────────────
export const DRUG_CATEGORIES = {
  analgesic:      { label: "Analgesic",        color: "#34D399" },
  antibiotic:     { label: "Antibiotic",       color: "#60A5FA" },
  anticoagulant:  { label: "Anticoagulant",    color: "#F59E0B" },
  antidote:       { label: "Antidote",         color: "#A78BFA" },
  cardiac:        { label: "Cardiac",          color: "#F87171" },
  electrolyte:    { label: "Electrolyte",      color: "#6EE7B7" },
  gi:             { label: "GI",               color: "#FCD34D" },
  neuro:          { label: "Neuro",            color: "#C084FC" },
  pressor:        { label: "Vasopressor",      color: "#FB923C" },
  rsi:            { label: "RSI / Airway",     color: "#38BDF8" },
  sedation:       { label: "Sedation",         color: "#818CF8" },
  reversal:       { label: "Reversal Agent",   color: "#4ADE80" },
  thrombolytic:   { label: "Thrombolytic",     color: "#FF4444" },
  other:          { label: "Other",            color: "#94A3B8" },
};

// ─── DOSE CALCULATOR ─────────────────────────────────────────────────────────
export function calcDose(drug, weightKg, isPeds) {
  if (!drug.doses) return [];
  return drug.doses.map(dose => {
    const d = { ...dose };
    if (d.isWeightBased && weightKg) {
      const mgPerKg = isPeds && d.mgPerKgPeds != null ? d.mgPerKgPeds : d.mgPerKg;
      let raw = mgPerKg * weightKg;
      let capped = false;
      if (d.maxDose && raw > d.maxDose) { raw = d.maxDose; capped = true; }
      d.calculatedDose = Math.round(raw * 10) / 10;
      d.calculatedUnit = d.unit;
      d.cappedAtMax     = capped;
      d.perKgDisplay    = `${mgPerKg} ${d.unit}/kg`;
    }
    return d;
  });
}

export function formatMedOrder(drug, doses, weightKg) {
  if (!doses?.length) return drug.name;
  const d = doses[0];
  const doseStr = d.calculatedDose != null
    ? `${d.calculatedDose} ${d.calculatedUnit}`
    : d.display || `${d.flatDose} ${d.unit}`;
  const route = d.route?.[0] || "";
  const rate   = d.rate ? ` over ${d.rate}` : "";
  return `${drug.name} ${doseStr}${route ? " " + route : ""}${rate}${d.cappedAtMax ? " [MAX DOSE]" : ""}`;
}

// ─── MEDICATION DATABASE ──────────────────────────────────────────────────────
export const MEDICATION_DB = {

  // ── ANALGESICS ──────────────────────────────────────────────────────────────
  morphine: {
    id: "morphine", name: "Morphine", genericName: "morphine sulfate",
    category: "analgesic", hubLink: "PainHub",
    doses: [
      { label: "Acute pain (IV)", isWeightBased: true, mgPerKg: 0.1, mgPerKgPeds: 0.05, unit: "mg", route: ["IV"], rate: "2–5 min", maxDose: 10, notes: "Titrate q15–20 min PRN" },
      { label: "Acute pain (PO)", isWeightBased: false, flatDose: "15–30", unit: "mg", route: ["PO"], notes: "IR formulation" },
    ],
    warnings: ["Respiratory depression at high doses", "Titrate carefully in elderly or renal impairment"],
  },

  fentanyl: {
    id: "fentanyl", name: "Fentanyl", genericName: "fentanyl citrate",
    category: "analgesic", controlled: true, schedule: "II", hubLink: "PainHub",
    doses: [
      { label: "Acute pain (IV)", isWeightBased: true, mgPerKg: 1, unit: "mcg", route: ["IV", "IN"], rate: "3–5 min", maxDose: 150, notes: "Onset 1–2 min; IN dose may need 2 mcg/kg" },
      { label: "Procedural sedation", isWeightBased: true, mgPerKg: 2, unit: "mcg", route: ["IV"], maxDose: 200, notes: "Slow push over 3–5 min" },
    ],
    warnings: ["Chest wall rigidity with rapid IV push", "Short-acting — redose q30–60 min PRN"],
  },

  ketorolac: {
    id: "ketorolac", name: "Ketorolac", brandName: "Toradol",
    category: "analgesic",
    doses: [
      { label: "Single dose (IV/IM, ≥17y)", isWeightBased: false, flatDose: "15–30", unit: "mg", route: ["IV", "IM"], notes: "15 mg if ≥65y, <50kg, or CrCl <30. Max 5 days total." },
    ],
    contraindications: ["Active GI bleed", "Renal failure", "Concurrent NSAID use", "Last trimester pregnancy"],
  },

  acetaminophen_iv: {
    id: "acetaminophen_iv", name: "Acetaminophen IV", brandName: "Ofirmev",
    category: "analgesic",
    doses: [
      { label: "Adults ≥50 kg", isWeightBased: false, flatDose: "1000", unit: "mg", route: ["IV"], rate: "15 min infusion", notes: "q6h PRN; max 4 g/day" },
      { label: "Adults <50 kg / peds", isWeightBased: true, mgPerKg: 15, unit: "mg", route: ["IV"], rate: "15 min", maxDose: 750, notes: "q6h PRN; max 75 mg/kg/day" },
    ],
  },

  // ── RSI / AIRWAY ─────────────────────────────────────────────────────────────
  succinylcholine: {
    id: "succinylcholine", name: "Succinylcholine", brandName: "Anectine",
    category: "rsi", isPanic: true,
    panicReason: "Contraindicated in crush injury >3 days, burns >48h, hyperkalemia, denervation injuries, personal/family hx of malignant hyperthermia.",
    hubLink: "AirwayRSIHub",
    doses: [
      { label: "RSI (adults)", isWeightBased: true, mgPerKg: 1.5, unit: "mg", route: ["IV"], maxDose: 200, notes: "Onset 45–60 sec; duration 8–10 min" },
      { label: "RSI (peds)", isWeightBased: true, mgPerKg: 2, mgPerKgPeds: 2, unit: "mg", route: ["IV"], maxDose: 150, notes: "Higher dose in children due to larger volume of distribution" },
    ],
    contraindications: ["Hyperkalemia", "Crush injury >72h", "Burns >48h", "Malignant hyperthermia history", "Denervation / UMN injury"],
    warnings: ["Check K+ if at risk", "Have dantrolene available for MH"],
  },

  rocuronium: {
    id: "rocuronium", name: "Rocuronium", brandName: "Zemuron",
    category: "rsi", hubLink: "AirwayRSIHub",
    doses: [
      { label: "RSI", isWeightBased: true, mgPerKg: 1.2, unit: "mg", route: ["IV"], maxDose: 200, notes: "Onset 60–90 sec at 1.2 mg/kg; duration 45–60 min" },
      { label: "Standard intubation", isWeightBased: true, mgPerKg: 0.6, unit: "mg", route: ["IV"], maxDose: 100, notes: "Onset ~3 min; reversal with sugammadex available" },
    ],
    warnings: ["Reversal: Sugammadex 16 mg/kg for immediate reversal of 1.2 mg/kg dose"],
  },

  ketamine_rsi: {
    id: "ketamine_rsi", name: "Ketamine (RSI induction)", genericName: "ketamine HCl",
    category: "rsi", hubLink: "AirwayRSIHub",
    doses: [
      { label: "Induction (IV)", isWeightBased: true, mgPerKg: 1.5, unit: "mg", route: ["IV"], maxDose: 200, notes: "Onset 30–60 sec; avoid in uncontrolled HTN or aortic dissection" },
      { label: "Induction (IM)", isWeightBased: true, mgPerKg: 4, unit: "mg", route: ["IM"], maxDose: 500, notes: "Onset 3–5 min" },
    ],
    warnings: ["May increase HR and BP — use caution in CAD, HTN crisis, aortic dissection", "Laryngospasm rare but possible"],
  },

  etomidate: {
    id: "etomidate", name: "Etomidate", brandName: "Amidate",
    category: "rsi", hubLink: "AirwayRSIHub",
    doses: [
      { label: "Induction (IV)", isWeightBased: true, mgPerKg: 0.3, unit: "mg", route: ["IV"], maxDose: 40, notes: "Onset 30–60 sec; avoid in septic shock (adrenal suppression)" },
    ],
    warnings: ["Single dose causes transient adrenal suppression", "Myoclonus common — does not indicate seizure"],
  },

  // ── SEDATION ─────────────────────────────────────────────────────────────────
  propofol: {
    id: "propofol", name: "Propofol", brandName: "Diprivan",
    category: "sedation",
    preparation: "Ready to use as 10 mg/mL. Strict aseptic technique — discard unused portion after 6h.",
    doses: [
      { label: "Procedural sedation bolus", isWeightBased: true, mgPerKg: 1, unit: "mg", route: ["IV"], maxDose: 200, rate: "40 mg q10 sec", notes: "Titrate to effect; significant hypotension risk" },
      { label: "Sedation infusion (ICU)", isWeightBased: false, display: "5–50 mcg/kg/min", unit: "mcg/kg/min", route: ["IV infusion"], notes: "Titrate; monitor TG if >48h" },
    ],
    warnings: ["Hypotension, especially in hypovolemic patients", "Pain on injection — premedicate with lidocaine"],
    contraindications: ["Egg/soy allergy (relative)", "Hypovolemia without resuscitation"],
  },

  midazolam: {
    id: "midazolam", name: "Midazolam", brandName: "Versed",
    category: "sedation", controlled: true, schedule: "IV",
    doses: [
      { label: "Procedural sedation (IV)", isWeightBased: true, mgPerKg: 0.05, unit: "mg", route: ["IV"], maxDose: 5, notes: "Titrate q3–5 min; onset 2–3 min" },
      { label: "Status epilepticus (IM)", isWeightBased: true, mgPerKg: 0.2, unit: "mg", route: ["IM", "IN"], maxDose: 10 },
    ],
    warnings: ["Respiratory depression — have flumazenil available", "Amnestic effect"],
  },

  // ── CARDIAC ──────────────────────────────────────────────────────────────────
  adenosine: {
    id: "adenosine", name: "Adenosine", brandName: "Adenocard",
    category: "cardiac", hubLink: "CardiacHub",
    doses: [
      { label: "SVT (1st dose)", isWeightBased: false, flatDose: "6", unit: "mg", route: ["IV rapid push"], notes: "Flush immediately with 20 mL NS; use antecubital or central line" },
      { label: "SVT (2nd dose)", isWeightBased: false, flatDose: "12", unit: "mg", route: ["IV rapid push"], notes: "If no response after 1–2 min; may repeat 12 mg once more" },
      { label: "Peds dose", isWeightBased: true, mgPerKg: 0.1, unit: "mg", route: ["IV"], maxDose: 6, notes: "1st dose; increase to 0.2 mg/kg if no response (max 12 mg)" },
    ],
    warnings: ["Brief asystole expected — warn patient", "Avoid in Wolff-Parkinson-White with pre-excitation"],
    contraindications: ["2nd/3rd degree AV block without pacemaker", "Sick sinus syndrome", "WPW with rapid AFib"],
  },

  amiodarone: {
    id: "amiodarone", name: "Amiodarone", brandName: "Cordarone",
    category: "cardiac", isPanic: true,
    panicReason: "Multiple serious drug interactions. Thyroid, pulmonary, hepatic toxicity with chronic use. Hypotension with IV loading.",
    hubLink: "CardiacHub",
    doses: [
      { label: "VF / pulseless VT (ACLS)", isWeightBased: false, flatDose: "300", unit: "mg", route: ["IV push"], notes: "1st dose; may give 150 mg supplemental after 3–5 min" },
      { label: "Stable VT / AF rate control loading", isWeightBased: false, flatDose: "150", unit: "mg", route: ["IV"], rate: "10 min infusion", notes: "Then 1 mg/min × 6h, then 0.5 mg/min × 18h" },
    ],
    warnings: ["Hypotension during IV loading", "QT prolongation", "Phlebitis with peripheral IV — use central if prolonged"],
  },

  metoprolol: {
    id: "metoprolol", name: "Metoprolol", brandName: "Lopressor",
    category: "cardiac",
    doses: [
      { label: "Rate control (IV)", isWeightBased: false, flatDose: "5", unit: "mg", route: ["IV"], rate: "over 2 min", notes: "Repeat q5 min × 3 doses PRN; max 15 mg total" },
      { label: "Rate control (PO)", isWeightBased: false, flatDose: "25–50", unit: "mg", route: ["PO"], notes: "q6–12h" },
    ],
    contraindications: ["Acute decompensated HF", "2nd/3rd degree AV block", "HR <60", "SBP <90"],
  },

  // ── ANTIBIOTICS ──────────────────────────────────────────────────────────────
  vancomycin: {
    id: "vancomycin", name: "Vancomycin",
    category: "antibiotic", hubLink: "AntibioticStewardshipHub",
    doses: [
      { label: "Empiric (IV)", isWeightBased: true, mgPerKg: 25, unit: "mg", route: ["IV"], maxDose: 3000, rate: "max 1 g/hr", notes: "Target AUC/MIC 400–600. Adjust based on levels/pharmacy." },
    ],
    warnings: ["Red man syndrome with rapid infusion — slow rate or premedicate with antihistamine", "Nephrotoxic — monitor Cr + levels", "Dose adjust in renal impairment"],
  },

  pip_tazo: {
    id: "pip_tazo", name: "Piperacillin-Tazobactam", brandName: "Zosyn",
    category: "antibiotic", hubLink: "AntibioticStewardshipHub",
    doses: [
      { label: "Standard (IV)", isWeightBased: false, flatDose: "4.5", unit: "g", route: ["IV"], rate: "30 min infusion", notes: "q6–8h; extended infusion 4h may improve PK for resistant organisms" },
      { label: "Severe / Pseudomonas coverage", isWeightBased: false, flatDose: "4.5", unit: "g", route: ["IV"], rate: "4h extended infusion", notes: "q6–8h" },
    ],
    warnings: ["Avoid with AMS (encephalopathy risk, especially with renal impairment)"],
  },

  ceftriaxone: {
    id: "ceftriaxone", name: "Ceftriaxone", brandName: "Rocephin",
    category: "antibiotic",
    doses: [
      { label: "Standard (IV/IM)", isWeightBased: false, flatDose: "1", unit: "g", route: ["IV", "IM"], rate: "30 min", notes: "q24h" },
      { label: "Meningitis / severe infection", isWeightBased: false, flatDose: "2", unit: "g", route: ["IV"], rate: "30 min", notes: "q12–24h" },
      { label: "Peds (IV/IM)", isWeightBased: true, mgPerKg: 50, unit: "mg", route: ["IV", "IM"], maxDose: 2000, notes: "q12–24h" },
    ],
  },

  azithromycin: {
    id: "azithromycin", name: "Azithromycin", brandName: "Zithromax",
    category: "antibiotic",
    doses: [
      { label: "Community pneumonia (IV)", isWeightBased: false, flatDose: "500", unit: "mg", route: ["IV"], rate: "60 min", notes: "Daily" },
      { label: "Community pneumonia (PO)", isWeightBased: false, flatDose: "500", unit: "mg", route: ["PO"], notes: "Day 1, then 250 mg daily × 4 days" },
    ],
    warnings: ["QT prolongation — avoid with other QT-prolonging agents"],
  },

  // ── VASOPRESSORS ──────────────────────────────────────────────────────────────
  norepinephrine: {
    id: "norepinephrine", name: "Norepinephrine", brandName: "Levophed",
    category: "pressor", hubLink: "SepsisHub",
    preparation: "4 mg in 250 mL NS = 16 mcg/mL  |  8 mg in 250 mL = 32 mcg/mL",
    doses: [
      { label: "Vasopressor infusion", isWeightBased: false, display: "0.01–3 mcg/kg/min", unit: "mcg/kg/min", route: ["IV central preferred"], notes: "Titrate to MAP ≥65. 1st-line in septic shock." },
    ],
    warnings: ["Peripheral extravasation causes tissue necrosis — use central line when possible", "Phentolamine for extravasation treatment"],
  },

  phenylephrine: {
    id: "phenylephrine", name: "Phenylephrine",
    category: "pressor",
    preparation: "100 mcg/mL (standard); 200 mcg/mL (concentrate)",
    doses: [
      { label: "Hypotension bolus", isWeightBased: false, display: "100–200 mcg IV bolus", unit: "mcg", route: ["IV push"], notes: "Repeat q5–10 min PRN; onset immediate" },
      { label: "Infusion", isWeightBased: false, display: "0.5–6 mcg/kg/min", unit: "mcg/kg/min", route: ["IV"], notes: "Pure alpha-1; use when tachycardia is problematic" },
    ],
    warnings: ["Pure alpha agonist — may worsen cardiac output in cardiogenic shock", "Reflex bradycardia"],
  },

  epinephrine: {
    id: "epinephrine", name: "Epinephrine", brandName: "EpiPen / Adrenalin",
    category: "pressor", isPanic: true,
    panicReason: "Dose-dependent dysrhythmias and hypertensive crisis. Verify indication and dose carefully.",
    hubLink: "AnaphylaxisHub",
    doses: [
      { label: "Anaphylaxis (IM)", isWeightBased: false, flatDose: "0.3–0.5", unit: "mg", route: ["IM mid-thigh"], notes: "1:1000 (1 mg/mL); repeat q5–15 min PRN" },
      { label: "Cardiac arrest (ACLS)", isWeightBased: false, flatDose: "1", unit: "mg", route: ["IV/IO push"], notes: "1:10,000 (0.1 mg/mL); q3–5 min" },
      { label: "Peds anaphylaxis (IM)", isWeightBased: true, mgPerKg: 0.01, unit: "mg", route: ["IM"], maxDose: 0.5, notes: "1:1000; repeat q5–15 min PRN" },
    ],
    warnings: ["Dysrhythmias at high doses", "Hypertensive crisis possible"],
  },

  vasopressin: {
    id: "vasopressin", name: "Vasopressin",
    category: "pressor", hubLink: "SepsisHub",
    preparation: "20 units in 100 mL NS = 0.2 units/mL",
    doses: [
      { label: "Septic shock adjunct", isWeightBased: false, display: "0.03–0.04 units/min fixed", unit: "units/min", route: ["IV continuous"], notes: "Add to NE; do not titrate" },
    ],
  },

  // ── REVERSAL AGENTS ───────────────────────────────────────────────────────────
  naloxone: {
    id: "naloxone", name: "Naloxone", brandName: "Narcan",
    category: "reversal", hubLink: "OpioidOverdoseHub",
    doses: [
      { label: "Opioid reversal (IV)", isWeightBased: false, flatDose: "0.4–2", unit: "mg", route: ["IV", "IM", "IN"], notes: "Titrate to adequate respiration — not full reversal in chronic users (precipitates withdrawal)" },
      { label: "Opioid reversal (IN)", isWeightBased: false, flatDose: "4", unit: "mg", route: ["IN per nostril"], notes: "Standard intranasal formulation; may repeat in 2–3 min" },
      { label: "Peds (IV)", isWeightBased: true, mgPerKg: 0.01, unit: "mg", route: ["IV"], maxDose: 0.4, notes: "Repeat q2–3 min PRN; shorter duration than most opioids — may need infusion" },
    ],
  },

  flumazenil: {
    id: "flumazenil", name: "Flumazenil", brandName: "Romazicon",
    category: "reversal", isPanic: true,
    panicReason: "Can precipitate seizures in benzo-dependent patients or those with TCA overdose. Short duration of action — resedation common.",
    doses: [
      { label: "Benzo reversal (IV)", isWeightBased: false, flatDose: "0.2", unit: "mg", route: ["IV over 30 sec"], notes: "Repeat q1 min to max 1 mg total; onset 1–2 min; duration 30–60 min" },
    ],
    contraindications: ["Known seizure disorder on benzos", "TCA overdose", "Elevated ICP"],
  },

  sugammadex: {
    id: "sugammadex", name: "Sugammadex", brandName: "Bridion",
    category: "reversal",
    doses: [
      { label: "Routine reversal (2 twitches)", isWeightBased: true, mgPerKg: 2, unit: "mg", route: ["IV"], maxDose: 200, notes: "After rocuronium/vecuronium" },
      { label: "Immediate (RSI dose roc)", isWeightBased: true, mgPerKg: 16, unit: "mg", route: ["IV"], maxDose: 1600, notes: "For can't intubate/can't oxygenate scenario after rocuronium 1.2 mg/kg" },
    ],
    warnings: ["May reactivate hormonal contraceptives — advise alternate BC for 7 days"],
  },

  // ── ANTICOAGULANTS ────────────────────────────────────────────────────────────
  heparin: {
    id: "heparin", name: "Unfractionated Heparin", brandName: "Heparin",
    category: "anticoagulant", hubLink: "CardiacHub",
    doses: [
      { label: "ACS / PE loading", isWeightBased: true, mgPerKg: 60, unit: "units", route: ["IV bolus"], maxDose: 5000, notes: "Then 12 units/kg/hr infusion; target aPTT 60–100 sec" },
      { label: "DVT prophylaxis", isWeightBased: false, flatDose: "5000", unit: "units", route: ["SQ"], notes: "q8–12h" },
    ],
    warnings: ["Monitor aPTT", "HIT risk — check platelets after day 4"],
  },

  // ── NEURO ─────────────────────────────────────────────────────────────────────
  levetiracetam: {
    id: "levetiracetam", name: "Levetiracetam", brandName: "Keppra",
    category: "neuro", hubLink: "StatusEpilepticusHub",
    doses: [
      { label: "Status epilepticus (IV)", isWeightBased: true, mgPerKg: 60, unit: "mg", route: ["IV"], maxDose: 4500, rate: "5–15 min infusion", notes: "Can be given faster in status; 2nd-line after benzos" },
      { label: "Peds seizure (IV)", isWeightBased: true, mgPerKg: 40, unit: "mg", route: ["IV"], maxDose: 3000, rate: "5–10 min" },
    ],
  },

  lorazepam: {
    id: "lorazepam", name: "Lorazepam", brandName: "Ativan",
    category: "neuro", controlled: true, hubLink: "StatusEpilepticusHub",
    doses: [
      { label: "Status epilepticus (IV)", isWeightBased: true, mgPerKg: 0.1, unit: "mg", route: ["IV"], maxDose: 4, rate: "2 mg/min", notes: "1st-line; may repeat after 5 min" },
      { label: "Agitation (IV/IM)", isWeightBased: false, flatDose: "1–2", unit: "mg", route: ["IV", "IM"], notes: "Titrate to effect" },
    ],
    warnings: ["Respiratory depression — have BVM ready", "Propylene glycol toxicity with prolonged high-dose infusion"],
  },

  tPA: {
    id: "tPA", name: "Alteplase (tPA)", brandName: "Activase",
    category: "thrombolytic", isPanic: true,
    panicReason: "Irreversible thrombolysis — must rule out hemorrhage and confirm indication. Verify contraindications checklist before administration.",
    hubLink: "AcuteIschemicStrokeHub",
    doses: [
      { label: "Ischemic stroke (IV)", isWeightBased: true, mgPerKg: 0.9, unit: "mg", route: ["IV"], maxDose: 90, notes: "10% bolus over 1 min; remaining 90% over 60 min. Within 3–4.5h of symptom onset." },
      { label: "Massive PE (IV)", isWeightBased: false, flatDose: "100", unit: "mg", route: ["IV"], rate: "2h infusion", notes: "Only for hemodynamically unstable PE" },
    ],
    contraindications: [
      "Active internal bleeding", "Recent intracranial surgery/trauma",
      "History of intracranial hemorrhage", "Uncontrolled HTN (SBP >185 or DBP >110)",
      "Recent ischemic stroke <3 months (relative)", "Platelets <100k",
    ],
  },

  // ── ELECTROLYTES / METABOLIC ──────────────────────────────────────────────────
  magnesium: {
    id: "magnesium", name: "Magnesium Sulfate",
    category: "electrolyte",
    doses: [
      { label: "Severe asthma (IV)", isWeightBased: false, flatDose: "2", unit: "g", route: ["IV"], rate: "20 min infusion", notes: "Single dose; most benefit in severe exacerbation" },
      { label: "Torsades de pointes", isWeightBased: false, flatDose: "2", unit: "g", route: ["IV"], rate: "5–20 min", notes: "Can push 1–2 min if unstable" },
      { label: "Pre-eclampsia / Eclampsia", isWeightBased: false, flatDose: "4–6", unit: "g", route: ["IV loading"], rate: "15–20 min", notes: "Then 1–2 g/hr maintenance" },
      { label: "Replacement (IV)", isWeightBased: false, flatDose: "1–2", unit: "g", route: ["IV"], rate: "1 g/hr", notes: "Per gram corrects approximately 0.1 mg/dL" },
    ],
    warnings: ["Toxicity: loss of DTRs → respiratory depression → cardiac arrest", "Have calcium gluconate available for reversal"],
  },

  potassium_iv: {
    id: "potassium_iv", name: "Potassium Chloride (IV)", brandName: "KCl",
    category: "electrolyte", isPanic: true,
    panicReason: "IV potassium can cause fatal cardiac dysrhythmias if infused too rapidly. Maximum rate: 10 mEq/hr peripherally, 20 mEq/hr central.",
    doses: [
      { label: "Replacement (peripheral)", isWeightBased: false, flatDose: "10", unit: "mEq", route: ["IV peripheral"], rate: "over 60 min", notes: "Max 10 mEq/hr peripherally" },
      { label: "Replacement (central)", isWeightBased: false, flatDose: "20", unit: "mEq", route: ["IV central"], rate: "over 60 min", notes: "Max 20 mEq/hr centrally" },
    ],
    warnings: ["NEVER IV push", "Recheck K+ after each 20–40 mEq administered"],
  },

};

// ─── CLINICAL SCENARIOS ───────────────────────────────────────────────────────
export const SCENARIOS = {
  sepsis: {
    id: "sepsis", label: "Sepsis / Shock", icon: "🔴",
    accentColor: "#FF4444",
    drugIds: ["vancomycin", "pip_tazo", "norepinephrine", "vasopressin", "epinephrine"],
    imagingIds: ["ct_abd_pelvis_contrast", "cxr_pa", "us_aorta"],
    labPanels: ["sepsis_workup"],
  },
  cardiac_arrest: {
    id: "cardiac_arrest", label: "Cardiac Arrest", icon: "⚡",
    accentColor: "#F59E0B",
    drugIds: ["epinephrine", "amiodarone", "adenosine", "magnesium"],
    imagingIds: ["cxr_pa"],
    labPanels: ["cardiac_arrest_labs"],
  },
  airway: {
    id: "airway", label: "Airway / RSI", icon: "🫁",
    accentColor: "#38BDF8",
    drugIds: ["succinylcholine", "rocuronium", "ketamine_rsi", "etomidate", "propofol"],
    imagingIds: ["cxr_pa", "ct_chest_no_contrast"],
    labPanels: ["airway_labs"],
  },
  stroke: {
    id: "stroke", label: "Stroke / Neuro", icon: "🧠",
    accentColor: "#A78BFA",
    drugIds: ["tPA", "levetiracetam", "lorazepam"],
    imagingIds: ["ct_head_no_contrast", "ct_angio_head_neck", "mri_brain_dw"],
    labPanels: ["stroke_workup"],
  },
  overdose: {
    id: "overdose", label: "Tox / OD", icon: "⚠️",
    accentColor: "#FB923C",
    drugIds: ["naloxone", "flumazenil"],
    imagingIds: ["cxr_pa", "ct_head_no_contrast"],
    labPanels: ["tox_labs"],
  },
  anaphylaxis: {
    id: "anaphylaxis", label: "Anaphylaxis", icon: "🟡",
    accentColor: "#F0B429",
    drugIds: ["epinephrine", "diphenhydramine_only"],
    imagingIds: ["cxr_pa"],
    labPanels: ["anaphylaxis_labs"],
  },
  pain: {
    id: "pain", label: "Pain Mgmt", icon: "💊",
    accentColor: "#34D399",
    drugIds: ["morphine", "fentanyl", "ketorolac", "acetaminophen_iv"],
    imagingIds: [],
    labPanels: [],
  },
};

// ─── IMAGING DATABASE ─────────────────────────────────────────────────────────
export const IMAGING_DB = {
  ct_head_no_contrast: {
    id: "ct_head_no_contrast", name: "CT Head Without Contrast",
    modality: "CT", region: "Head", contrast: "without",
    indication: "Altered mental status, acute neurologic deficit, headache, trauma, rule out hemorrhage or mass",
    stat: true,
    orderText: "CT Head Without Contrast — STAT\nIndication: Acute neurologic change / rule out intracranial pathology\nAllergies: Per chart",
    hubLink: "AcuteIschemicStrokeHub",
  },
  ct_angio_head_neck: {
    id: "ct_angio_head_neck", name: "CTA Head and Neck",
    modality: "CT", region: "Head & Neck", contrast: "with",
    indication: "Suspected stroke, TIA, aneurysm, dissection, large vessel occlusion evaluation",
    stat: true,
    orderText: "CTA Head and Neck With Contrast — STAT\nIndication: Suspected LVO / stroke / dissection\nAllergies: Per chart\nCreatinine: [check before ordering]",
    hubLink: "AcuteIschemicStrokeHub",
  },
  mri_brain_dw: {
    id: "mri_brain_dw", name: "MRI Brain with DWI",
    modality: "MRI", region: "Brain", contrast: "without",
    indication: "Ischemic stroke, posterior fossa pathology, demyelinating disease",
    orderText: "MRI Brain Without Contrast with DWI/ADC sequences\nIndication: Rule out acute ischemic stroke / posterior fossa lesion",
    hubLink: "AcuteIschemicStrokeHub",
  },
  ct_chest_no_contrast: {
    id: "ct_chest_no_contrast", name: "CT Chest Without Contrast",
    modality: "CT", region: "Chest", contrast: "without",
    indication: "Pneumonia workup, pleural effusion characterization, pulmonary nodule, post-intubation",
    orderText: "CT Chest Without Contrast\nIndication: [specify]\nAllergies: Per chart",
    hubLink: "AirwayHub",
  },
  ct_pa: {
    id: "ct_pa", name: "CT Pulmonary Angiography (CTPA)",
    modality: "CT", region: "Chest", contrast: "with",
    indication: "Suspected pulmonary embolism",
    stat: true,
    orderText: "CTPA — CT Pulmonary Angiography With Contrast — STAT\nIndication: Suspected acute pulmonary embolism\nAllergies: Per chart\nCreatinine: [required]",
    hubLink: "MassivePEHub",
  },
  ct_abd_pelvis_contrast: {
    id: "ct_abd_pelvis_contrast", name: "CT Abdomen & Pelvis With Contrast",
    modality: "CT", region: "Abdomen/Pelvis", contrast: "with",
    indication: "Sepsis source, abdominal pain, appendicitis, bowel pathology",
    orderText: "CT Abdomen and Pelvis With IV Contrast\nIndication: [specify]\nAllergies: Per chart\nCreatinine: [required if contrast]",
    hubLink: "AbdominalPainHub",
  },
  ct_abd_pelvis_no_contrast: {
    id: "ct_abd_pelvis_no_contrast", name: "CT Abdomen & Pelvis Without Contrast",
    modality: "CT", region: "Abdomen/Pelvis", contrast: "without",
    indication: "Nephrolithiasis, bowel obstruction, renal failure precluding contrast",
    orderText: "CT Abdomen and Pelvis Without Contrast\nIndication: [specify — kidney stone / obstruction]\nAllergies: Per chart",
  },
  cxr_pa: {
    id: "cxr_pa", name: "Chest X-Ray PA/Lateral",
    modality: "XR", region: "Chest", contrast: "N/A",
    indication: "Dyspnea, chest pain, post-intubation, pneumonia, pulmonary edema, pneumothorax",
    orderText: "CXR PA and Lateral\nIndication: [specify]\nPortable OK if patient unable to ambulate",
  },
  cxr_portable: {
    id: "cxr_portable", name: "Portable CXR (AP)",
    modality: "XR", region: "Chest", contrast: "N/A",
    indication: "Post-procedure line/tube check, critically ill patient unable to transport",
    stat: true,
    orderText: "Portable Chest X-Ray AP — STAT\nIndication: Post-procedure check / critically ill\nPatient is unable to transport to radiology",
  },
  us_fast: {
    id: "us_fast", name: "FAST Exam (POCUS)",
    modality: "US", region: "Abdomen/Pelvis", contrast: "N/A",
    indication: "Trauma, hemodynamic instability, rule out hemoperitoneum, cardiac tamponade, pneumothorax",
    stat: true,
    orderText: "FAST Ultrasound — Bedside Emergency\nViews: Pericardial, RUQ, LUQ, Pelvic, Bilateral lung\nIndication: Trauma / hemodynamic instability",
    hubLink: "POCUSHub",
  },
  us_aorta: {
    id: "us_aorta", name: "Aorta POCUS",
    modality: "US", region: "Aorta", contrast: "N/A",
    indication: "Suspected AAA, back/flank pain with hemodynamic instability",
    stat: true,
    orderText: "Bedside Aortic Ultrasound — STAT\nViews: Proximal, mid, distal aorta\nIndication: Rule out AAA",
    hubLink: "POCUSHub",
  },
  us_dvt: {
    id: "us_dvt", name: "Bilateral Lower Extremity DVT Ultrasound",
    modality: "US", region: "Lower Extremities", contrast: "N/A",
    indication: "Suspected deep vein thrombosis",
    orderText: "Duplex Ultrasound Bilateral Lower Extremity — DVT Protocol\nIndication: Suspected DVT",
    hubLink: "DVTHub",
  },
  echo_bedside: {
    id: "echo_bedside", name: "Bedside Echo (POCUS)",
    modality: "Echo", region: "Cardiac", contrast: "N/A",
    indication: "Hemodynamic instability, undifferentiated shock, pericardial effusion, cardiac arrest",
    stat: true,
    orderText: "Bedside Cardiac Ultrasound (POCUS)\nViews: Parasternal long/short, Apical 4-chamber, Subcostal\nIndication: Hemodynamic instability / undifferentiated shock",
    hubLink: "POCUSHub",
  },
};

// ─── LAB PANELS ───────────────────────────────────────────────────────────────
export const LAB_PANELS = {
  sepsis_workup: {
    id: "sepsis_workup", name: "Sepsis Workup",
    scenarios: ["sepsis"],
    items: ["CBC with differential", "CMP (BMP + LFTs)", "Lactic acid", "Procalcitonin", "Blood cultures × 2 (before antibiotics)", "UA with microscopy", "Urine culture", "Coagulation: PT/INR, aPTT", "Fibrinogen", "ABG or VBG", "Type & Screen"],
    orderText: "SEPSIS WORKUP PANEL\n- CBC with differential\n- CMP (BMP + LFTs)\n- Lactic acid (STAT)\n- Procalcitonin\n- Blood cultures × 2 (BEFORE antibiotics)\n- UA with microscopy + urine culture\n- PT/INR, aPTT, Fibrinogen\n- ABG or VBG\n- Type and Screen",
  },
  cardiac_arrest_labs: {
    id: "cardiac_arrest_labs", name: "Cardiac Arrest / ROSC Labs",
    scenarios: ["cardiac_arrest"],
    items: ["ABG (STAT)", "BMP (K+, glucose, CO2)", "CBC", "Troponin (hs-Tn)", "Lactic acid", "Prothrombin time", "Magnesium", "Phosphorus", "TSH", "Toxicology screen", "Blood cultures if febrile"],
    orderText: "CARDIAC ARREST / ROSC LABS\n- ABG (STAT)\n- BMP: potassium, glucose, bicarbonate\n- CBC\n- Troponin high-sensitivity\n- Lactic acid\n- Magnesium, Phosphorus\n- PT/INR\n- TSH\n- Serum toxicology screen",
  },
  airway_labs: {
    id: "airway_labs", name: "Pre-/Post-Intubation Labs",
    scenarios: ["airway"],
    items: ["ABG (STAT)", "BMP", "CBC", "Coagulation (PT/INR, aPTT)", "Lactic acid", "Type & Screen"],
    orderText: "PRE/POST-INTUBATION LABS\n- ABG (STAT)\n- BMP\n- CBC\n- PT/INR, aPTT\n- Lactic acid\n- Type and Screen",
  },
  stroke_workup: {
    id: "stroke_workup", name: "Acute Stroke Workup",
    scenarios: ["stroke"],
    items: ["CBC with platelets", "BMP (glucose, Cr)", "PT/INR", "aPTT", "Fingerstick glucose (immediate)", "Type & Screen", "ECG (12-lead)", "Echo if source needed", "Lipid panel", "HbA1c"],
    orderText: "ACUTE STROKE WORKUP\n- Fingerstick glucose (IMMEDIATE)\n- CBC with platelets\n- BMP (glucose, creatinine)\n- PT/INR, aPTT\n- Type and Screen\n- 12-lead ECG\n- Lipid panel\n- HbA1c",
  },
  tox_labs: {
    id: "tox_labs", name: "Toxicology / Overdose Panel",
    scenarios: ["overdose"],
    items: ["Serum acetaminophen", "Serum salicylate", "Serum ethanol", "Urine drug screen (qualitative)", "BMP (AG, glucose, Cr, K+)", "ABG / VBG", "CBC", "Lactic acid", "ECG (QRS, QTc)"],
    orderText: "TOXICOLOGY / OVERDOSE PANEL\n- Serum acetaminophen level\n- Serum salicylate\n- Serum ethanol\n- Urine drug screen\n- BMP (anion gap, glucose, Cr)\n- ABG or VBG\n- CBC\n- Lactic acid\n- 12-lead ECG (QRS and QTc measurement)",
  },
  anaphylaxis_labs: {
    id: "anaphylaxis_labs", name: "Anaphylaxis Labs",
    scenarios: ["anaphylaxis"],
    items: ["CBC", "BMP", "Serum tryptase (within 3h of reaction)", "ABG if respiratory compromise"],
    orderText: "ANAPHYLAXIS LABS\n- CBC\n- BMP\n- Serum tryptase (draw within 15 min–3h of reaction onset)\n- ABG if respiratory compromise present",
  },
  chest_pain_workup: {
    id: "chest_pain_workup", name: "Chest Pain Workup",
    scenarios: [],
    items: ["Troponin (hs-Tn × 2, 0h and 3h)", "ECG (STAT 12-lead)", "BMP (creatinine, glucose)", "CBC", "BNP or NT-proBNP", "D-dimer (if PE risk)", "CXR PA/Lateral", "Lipid panel", "HbA1c"],
    orderText: "CHEST PAIN WORKUP\n- 12-lead ECG (STAT)\n- Troponin high-sensitivity × 2 (0h and 3h)\n- BMP\n- CBC\n- BNP or NT-proBNP\n- D-dimer (if PE pre-test probability intermediate/high)\n- CXR PA/Lateral\n- Lipid panel\n- HbA1c",
  },
  bmp: {
    id: "bmp", name: "Basic Metabolic Panel (BMP)",
    scenarios: [],
    items: ["Sodium", "Potassium", "Chloride", "CO2 (bicarb)", "BUN", "Creatinine", "Glucose", "Calcium"],
    orderText: "Basic Metabolic Panel (BMP)\n- Sodium, Potassium, Chloride, CO2\n- BUN, Creatinine\n- Glucose, Calcium",
  },
  cmp: {
    id: "cmp", name: "Comprehensive Metabolic Panel (CMP)",
    scenarios: [],
    items: ["BMP components", "Total protein", "Albumin", "Total bilirubin", "Direct bilirubin", "AST", "ALT", "Alkaline phosphatase"],
    orderText: "Comprehensive Metabolic Panel (CMP)\n- BMP: Na, K, Cl, CO2, BUN, Cr, Glucose, Ca\n- LFTs: Total protein, Albumin, Total bili, Direct bili, AST, ALT, Alk phos",
  },
};

// ─── HUB LINKS ────────────────────────────────────────────────────────────────
export const HUB_LINKS = [
  { id: "EDOrderHub",    label: "Orders",        icon: "📋", path: "/EDOrderHub" },
  { id: "QuickNote",     label: "Quick Note",    icon: "✏️", path: "/QuickNote" },
  { id: "AirwayRSIHub",  label: "Airway/RSI",    icon: "🫁", path: "/AirwayRSIHub" },
  { id: "SepsisHub",     label: "Sepsis",        icon: "🔴", path: "/SepsisHub" },
  { id: "StrokeHub",     label: "Stroke",        icon: "🧠", path: "/stroke-hub" },
  { id: "AntibioticStewardshipHub", label: "Antibiotics", icon: "💊", path: "/AntibioticStewardshipHub" },
  { id: "POCUSHub",      label: "POCUS",         icon: "📡", path: "/pocus-hub" },
  { id: "OpioidOverdoseHub", label: "Tox/OD",   icon: "⚠️", path: "/OpioidOverdoseHub" },
  { id: "DrugComparisonHub", label: "Drug Compare", icon: "⚖️", path: "/DrugComparisonHub" },
];