// commandkit_data.js — CommandKit data layer
// All medication DB, imaging DB, lab panels, scenarios, and utility functions

// ─── UTILITIES ───────────────────────────────────────────────
export function lbsToKg(lbs) { return Math.round(lbs / 2.205 * 10) / 10; }
export function kgToLbs(kg)  { return Math.round(kg * 2.205 * 10) / 10; }
export function isPediatric(age, weightKg) {
  if (age != null && age < 18) return true;
  if (weightKg != null && weightKg < 40) return true;
  return false;
}

/**
 * calcDose — returns array of dose objects with calculatedDose filled in when weightKg provided.
 * Each dose object shape:
 *  { label, isWeightBased, mgPerKg, unit, maxDose, flatDose, display, route, rate, notes,
 *    calculatedDose, calculatedUnit, cappedAtMax, perKgDisplay }
 */
export function calcDose(drug, weightKg, isPeds) {
  if (!drug.doses) return [];
  return drug.doses.map(dose => {
    const d = { ...dose };
    if (d.isWeightBased && weightKg) {
      const raw = d.mgPerKg * weightKg;
      const capped = d.maxDose ? Math.min(raw, d.maxDose) : raw;
      d.calculatedDose = Math.round(capped * 10) / 10;
      d.calculatedUnit = d.unit;
      d.cappedAtMax = d.maxDose ? raw > d.maxDose : false;
      d.perKgDisplay = d.mgPerKg + " " + d.unit + "/kg";
    }
    return d;
  });
}

/**
 * formatMedOrder — builds a short copyable order string from drug + computed doses.
 */
export function formatMedOrder(drug, doses, weightKg) {
  const lines = [drug.name + (drug.brandName ? " (" + drug.brandName + ")" : "")];
  doses.forEach(d => {
    let dStr = "";
    if (d.calculatedDose != null) {
      dStr = d.calculatedDose + " " + d.calculatedUnit;
    } else if (d.isWeightBased) {
      dStr = d.mgPerKg + " " + d.unit + "/kg" + (d.maxDose ? " (max " + d.maxDose + " " + d.unit + ")" : "");
    } else {
      dStr = d.display || (d.flatDose + " " + d.unit);
    }
    const routes = d.route ? d.route.join("/") : "";
    lines.push("  " + d.label + ": " + dStr + (routes ? " " + routes : "") + (d.rate ? " over " + d.rate : ""));
  });
  if (weightKg) lines.push("  [weight: " + weightKg + " kg]");
  return lines.join("\n");
}

// ─── DRUG CATEGORIES ─────────────────────────────────────────
export const DRUG_CATEGORIES = {
  analgesic:     { label: "Analgesics",       color: "#F59E0B" },
  antibiotic:    { label: "Antibiotics",      color: "#34D399" },
  cardiac:       { label: "Cardiac",          color: "#60A5FA" },
  rsi:           { label: "RSI / Airway",     color: "#F87171" },
  sedation:      { label: "Sedation",         color: "#A78BFA" },
  reversal:      { label: "Reversal Agents",  color: "#FB923C" },
  anticoagulant: { label: "Anticoagulants",   color: "#E879F9" },
  pressor:       { label: "Vasopressors",     color: "#FF4444" },
  neuro:         { label: "Neuro / Seizure",  color: "#818CF8" },
  metabolic:     { label: "Metabolic",        color: "#2DD4BF" },
  tox:           { label: "Toxicology",       color: "#FBBF24" },
  ob:            { label: "OB / GYN",         color: "#F9A8D4" },
  other:         { label: "Other",            color: "#94A3B8" },
};

// ─── MEDICATION DATABASE ─────────────────────────────────────
export const MEDICATION_DB = {
  // ── ANALGESICS ───────────────────────────────────────────
  fentanyl: {
    id: "fentanyl", name: "Fentanyl", brandName: "Sublimaze",
    category: "analgesic", genericName: "fentanyl citrate",
    isPanic: false,
    doses: [
      { label: "Pain (IV)", isWeightBased: true, mgPerKg: 0.001, unit: "mg", maxDose: 0.1, route: ["IV", "IM"], rate: "2–5 min", notes: "1 mcg/kg = 0.001 mg/kg" },
      { label: "Pain (IN)", isWeightBased: true, mgPerKg: 0.0015, unit: "mg", maxDose: 0.15, route: ["IN"], notes: "Intranasal 1.5 mcg/kg" },
    ],
    warnings: ["Respiratory depression — have naloxone at bedside", "Chest wall rigidity with rapid large doses"],
    contraindications: ["Known hypersensitivity"],
    hubLink: "PainHub",
  },
  morphine: {
    id: "morphine", name: "Morphine Sulfate",
    category: "analgesic",
    doses: [
      { label: "Pain (IV)", isWeightBased: true, mgPerKg: 0.1, unit: "mg", maxDose: 10, route: ["IV"], rate: "5 min" },
      { label: "Pain (PO/IM)", isWeightBased: true, mgPerKg: 0.2, unit: "mg", maxDose: 15, route: ["PO", "IM"] },
    ],
    warnings: ["Respiratory depression", "Histamine release"],
    contraindications: ["Acute respiratory depression", "Paralytic ileus"],
  },
  ketorolac: {
    id: "ketorolac", name: "Ketorolac", brandName: "Toradol",
    category: "analgesic",
    doses: [
      { label: "IV/IM", isWeightBased: false, flatDose: 15, unit: "mg", display: "15–30 mg", route: ["IV", "IM"], notes: "Max 5 days. Elderly: 15 mg." },
    ],
    warnings: ["GI bleeding risk", "Renal function monitoring"],
    contraindications: ["Active PUD", "Renal failure", "NSAID allergy"],
  },
  acetaminophen_iv: {
    id: "acetaminophen_iv", name: "Acetaminophen IV", brandName: "Ofirmev",
    category: "analgesic",
    doses: [
      { label: "Adult (≥50 kg)", isWeightBased: false, flatDose: 1000, unit: "mg", display: "1000 mg", route: ["IV"], rate: "15 min" },
      { label: "Peds (<50 kg)", isWeightBased: true, mgPerKg: 15, unit: "mg", maxDose: 750, route: ["IV"], rate: "15 min" },
    ],
  },
  // ── ANTIBIOTICS ──────────────────────────────────────────
  vancomycin: {
    id: "vancomycin", name: "Vancomycin",
    category: "antibiotic",
    doses: [
      { label: "Loading dose", isWeightBased: true, mgPerKg: 25, unit: "mg", maxDose: 3000, route: ["IV"], rate: "≥1 hr", notes: "25–30 mg/kg for severe infections" },
      { label: "Maintenance", isWeightBased: true, mgPerKg: 15, unit: "mg", maxDose: 2000, route: ["IV"], notes: "Q8–12h, renally adjusted" },
    ],
    warnings: ["Red man syndrome with rapid infusion", "Nephrotoxicity"],
    monitoring: "Trough levels or AUC monitoring",
    hubLink: "AntibioticStewardshipHub",
  },
  piptazo: {
    id: "piptazo", name: "Piperacillin-Tazobactam", brandName: "Zosyn",
    category: "antibiotic",
    doses: [
      { label: "Standard", isWeightBased: false, flatDose: 4.5, unit: "g", display: "4.5 g", route: ["IV"], rate: "30 min" },
      { label: "Sepsis/extended", isWeightBased: false, flatDose: 4.5, unit: "g", display: "4.5 g", route: ["IV"], rate: "4 hr infusion", notes: "Extended infusion for severe/resistant infections" },
    ],
    contraindications: ["Penicillin allergy (cross-reactivity ~1%)"],
    hubLink: "SepsisHub",
  },
  cefepime: {
    id: "cefepime", name: "Cefepime", brandName: "Maxipime",
    category: "antibiotic",
    doses: [
      { label: "Moderate infection", isWeightBased: false, flatDose: 1, unit: "g", display: "1–2 g", route: ["IV"], rate: "30 min", notes: "Q8–12h" },
      { label: "Severe/febrile neutropenia", isWeightBased: false, flatDose: 2, unit: "g", display: "2 g", route: ["IV"], rate: "30 min", notes: "Q8h" },
    ],
    warnings: ["Neurotoxicity — especially in renal impairment"],
  },
  ceftriaxone: {
    id: "ceftriaxone", name: "Ceftriaxone", brandName: "Rocephin",
    category: "antibiotic",
    doses: [
      { label: "Standard", isWeightBased: false, flatDose: 1, unit: "g", display: "1–2 g", route: ["IV", "IM"], notes: "Q12–24h" },
      { label: "Meningitis", isWeightBased: false, flatDose: 2, unit: "g", display: "2 g", route: ["IV"], notes: "Q12h" },
    ],
    contraindications: ["Hyperbilirubinemia neonates", "Calcium-containing IV solutions simultaneously"],
    hubLink: "MeningitisHub",
  },
  azithromycin: {
    id: "azithromycin", name: "Azithromycin", brandName: "Zithromax",
    category: "antibiotic",
    doses: [
      { label: "CAP/PNA", isWeightBased: false, flatDose: 500, unit: "mg", display: "500 mg", route: ["IV", "PO"], rate: "1 hr", notes: "Daily dosing" },
    ],
    warnings: ["QTc prolongation"],
  },
  // ── RSI / AIRWAY ─────────────────────────────────────────
  succinylcholine: {
    id: "succinylcholine", name: "Succinylcholine", brandName: "Anectine",
    category: "rsi", isPanic: true,
    panicReason: "Depolarizing NMB — contraindicated in crush injury, burns >24h, denervation, hyperkalemia, and malignant hyperthermia. May cause life-threatening hyperkalemia.",
    doses: [
      { label: "RSI", isWeightBased: true, mgPerKg: 1.5, unit: "mg", maxDose: 200, route: ["IV"], notes: "1–2 mg/kg. Use 2 mg/kg in peds." },
    ],
    warnings: ["Fasciculations → ICP/IOP rise", "Bradycardia in peds (pretreat atropine)"],
    contraindications: ["Hyperkalemia", "Crush injury >24h", "Denervating conditions", "Malignant hyperthermia", "Personal/family hx MH"],
    hubLink: "AirwayRSIHub",
  },
  rocuronium: {
    id: "rocuronium", name: "Rocuronium", brandName: "Zemuron",
    category: "rsi",
    doses: [
      { label: "RSI dose", isWeightBased: true, mgPerKg: 1.2, unit: "mg", maxDose: 200, route: ["IV"], notes: "1.2 mg/kg for RSI. Reversible with sugammadex." },
      { label: "Maintenance NMB", isWeightBased: true, mgPerKg: 0.1, unit: "mg", maxDose: 50, route: ["IV"], notes: "Repeat PRN" },
    ],
    hubLink: "AirwayRSIHub",
  },
  etomidate: {
    id: "etomidate", name: "Etomidate", brandName: "Amidate",
    category: "rsi",
    doses: [
      { label: "RSI induction", isWeightBased: true, mgPerKg: 0.3, unit: "mg", maxDose: 30, route: ["IV"], rate: "30–60 sec", notes: "0.2–0.4 mg/kg" },
    ],
    warnings: ["Single dose adrenal suppression — avoid in septic shock if alternatives available", "Myoclonus"],
    hubLink: "AirwayRSIHub",
  },
  ketamine_rsi: {
    id: "ketamine_rsi", name: "Ketamine (RSI/Induction)", brandName: "Ketalar",
    category: "rsi",
    doses: [
      { label: "Induction", isWeightBased: true, mgPerKg: 2, unit: "mg", maxDose: 300, route: ["IV"], notes: "1–2 mg/kg IV" },
      { label: "IM sedation", isWeightBased: true, mgPerKg: 4, unit: "mg", maxDose: 500, route: ["IM"], notes: "4–6 mg/kg IM" },
    ],
    warnings: ["Emergence reactions — co-administer benzo", "Increases secretions — consider glycopyrrolate"],
    hubLink: "AirwayRSIHub",
  },
  // ── SEDATION ─────────────────────────────────────────────
  propofol: {
    id: "propofol", name: "Propofol", brandName: "Diprivan",
    category: "sedation",
    preparation: "Standard 10 mg/mL",
    doses: [
      { label: "Induction", isWeightBased: true, mgPerKg: 1.5, unit: "mg", maxDose: 200, route: ["IV"], rate: "60 sec", notes: "Reduce in elderly/hemodynamically compromised" },
      { label: "Sedation infusion", isWeightBased: false, display: "5–80 mcg/kg/min", flatDose: 5, unit: "mcg/kg/min", route: ["IV infusion"] },
    ],
    warnings: ["Hypotension", "Propofol infusion syndrome with prolonged high-dose use", "Pain on injection"],
    isPanic: false,
  },
  midazolam: {
    id: "midazolam", name: "Midazolam", brandName: "Versed",
    category: "sedation",
    doses: [
      { label: "Procedural sedation", isWeightBased: true, mgPerKg: 0.05, unit: "mg", maxDose: 5, route: ["IV"], notes: "Titrate slowly; 0.02–0.1 mg/kg" },
      { label: "Seizure", isWeightBased: true, mgPerKg: 0.2, unit: "mg", maxDose: 10, route: ["IV", "IM", "IN"], notes: "IN: 0.2 mg/kg, max 10 mg" },
    ],
    warnings: ["Respiratory depression — especially with opioids"],
    hubLink: "StatusEpilepticusHub",
  },
  lorazepam: {
    id: "lorazepam", name: "Lorazepam", brandName: "Ativan",
    category: "sedation",
    doses: [
      { label: "Seizure", isWeightBased: true, mgPerKg: 0.1, unit: "mg", maxDose: 4, route: ["IV"], rate: "2 min", notes: "Repeat q5–10 min x2" },
      { label: "Agitation", isWeightBased: false, flatDose: 1, unit: "mg", display: "1–2 mg", route: ["IV", "IM"] },
    ],
    hubLink: "StatusEpilepticusHub",
  },
  // ── CARDIAC ──────────────────────────────────────────────
  adenosine: {
    id: "adenosine", name: "Adenosine", brandName: "Adenocard",
    category: "cardiac",
    doses: [
      { label: "SVT (1st dose)", isWeightBased: false, flatDose: 6, unit: "mg", display: "6 mg", route: ["IV"], rate: "Rapid push", notes: "Rapid IV bolus, flush immediately" },
      { label: "SVT (2nd dose)", isWeightBased: false, flatDose: 12, unit: "mg", display: "12 mg", route: ["IV"], rate: "Rapid push", notes: "Repeat x2 if needed" },
    ],
    warnings: ["Transient asystole", "Bronchospasm"],
    contraindications: ["2nd/3rd degree AV block", "Sick sinus syndrome", "Wolff-Parkinson-White with A-fib"],
    hubLink: "CardiacHub",
  },
  amiodarone: {
    id: "amiodarone", name: "Amiodarone", brandName: "Cordarone",
    category: "cardiac", isPanic: true,
    panicReason: "Pulmonary toxicity, thyroid dysfunction, QTc prolongation, hepatotoxicity. Multiple drug interactions. Use only when alternatives unavailable.",
    doses: [
      { label: "VF/pVT (ACLS)", isWeightBased: false, flatDose: 300, unit: "mg", display: "300 mg", route: ["IV push"], notes: "ACLS cardiac arrest — 300 mg, then 150 mg" },
      { label: "Stable VT load", isWeightBased: false, flatDose: 150, unit: "mg", display: "150 mg", route: ["IV"], rate: "10 min" },
      { label: "Maintenance drip", isWeightBased: false, display: "1 mg/min x6h, then 0.5 mg/min", flatDose: 1, unit: "mg/min", route: ["IV infusion"] },
    ],
    preparation: "150 mg in 100 mL D5W over 10 min for loading",
    hubLink: "CardiacHub",
  },
  epinephrine_cardiac: {
    id: "epinephrine_cardiac", name: "Epinephrine (Cardiac Arrest)", brandName: "Adrenalin",
    category: "cardiac",
    doses: [
      { label: "Cardiac arrest", isWeightBased: false, flatDose: 1, unit: "mg", display: "1 mg", route: ["IV/IO"], notes: "Q3–5 min" },
    ],
    hubLink: "ResusHub",
  },
  metoprolol_iv: {
    id: "metoprolol_iv", name: "Metoprolol (IV)", brandName: "Lopressor",
    category: "cardiac",
    doses: [
      { label: "Rate control", isWeightBased: false, flatDose: 5, unit: "mg", display: "5 mg", route: ["IV"], rate: "5 min", notes: "Q5 min x3 if needed" },
    ],
    contraindications: ["Decompensated HF", "Bradycardia <50", "2nd/3rd degree block"],
  },
  // ── VASOPRESSORS ─────────────────────────────────────────
  norepinephrine: {
    id: "norepinephrine", name: "Norepinephrine", brandName: "Levophed",
    category: "pressor",
    preparation: "4 mg in 250 mL NS = 16 mcg/mL",
    doses: [
      { label: "Septic shock (first-line)", isWeightBased: false, display: "0.01–3 mcg/kg/min", flatDose: 0.01, unit: "mcg/kg/min", route: ["Central IV"], notes: "Titrate to MAP ≥65 mmHg" },
    ],
    hubLink: "ShockHub",
  },
  vasopressin: {
    id: "vasopressin", name: "Vasopressin",
    category: "pressor",
    preparation: "20 units in 100 mL NS = 0.2 units/mL",
    doses: [
      { label: "Septic shock (adjunct)", isWeightBased: false, display: "0.03–0.04 units/min", flatDose: 0.03, unit: "units/min", route: ["IV infusion"], notes: "Fixed dose — do not titrate beyond 0.04 units/min" },
    ],
    hubLink: "ShockHub",
  },
  dopamine: {
    id: "dopamine", name: "Dopamine",
    category: "pressor",
    preparation: "400 mg in 250 mL D5W = 1600 mcg/mL",
    doses: [
      { label: "Hemodynamic support", isWeightBased: false, display: "5–20 mcg/kg/min", flatDose: 5, unit: "mcg/kg/min", route: ["IV infusion"], notes: "Higher doses: alpha > beta effects" },
    ],
    warnings: ["Tachyarrhythmias more common than norepinephrine"],
  },
  // ── REVERSAL AGENTS ──────────────────────────────────────
  naloxone: {
    id: "naloxone", name: "Naloxone", brandName: "Narcan",
    category: "reversal",
    doses: [
      { label: "Opioid reversal (IV)", isWeightBased: false, display: "0.4–2 mg", flatDose: 0.4, unit: "mg", route: ["IV", "IM"], notes: "Titrate to respirations — avoid precipitating withdrawal. Repeat Q2–3 min." },
      { label: "IN (prehospital/no IV)", isWeightBased: false, flatDose: 4, unit: "mg", display: "4 mg", route: ["IN"], notes: "Each nostril 2 mg" },
    ],
    warnings: ["Duration shorter than many opioids — observe for re-narcotization"],
    hubLink: "OpioidOverdoseHub",
  },
  flumazenil: {
    id: "flumazenil", name: "Flumazenil", brandName: "Romazicon",
    category: "reversal", isPanic: true,
    panicReason: "Seizures in benzo-dependent patients. Short half-life — re-sedation likely. Contraindicated if benzo given for seizure control.",
    doses: [
      { label: "Reversal", isWeightBased: false, display: "0.2 mg", flatDose: 0.2, unit: "mg", route: ["IV"], rate: "30 sec", notes: "Q1 min to max 3 mg total" },
    ],
    contraindications: ["Chronic benzo use / dependence", "Benzo used for seizure control"],
  },
  sugammadex: {
    id: "sugammadex", name: "Sugammadex", brandName: "Bridion",
    category: "reversal",
    doses: [
      { label: "Routine reversal", isWeightBased: true, mgPerKg: 4, unit: "mg", maxDose: 400, route: ["IV"], notes: "4 mg/kg for deep block" },
      { label: "Immediate reversal", isWeightBased: true, mgPerKg: 16, unit: "mg", maxDose: 1600, route: ["IV"], notes: "16 mg/kg for immediate reversal of RSI dose rocuronium" },
    ],
    hubLink: "AirwayRSIHub",
  },
  // ── ANTICOAGULANTS ───────────────────────────────────────
  heparin: {
    id: "heparin", name: "Unfractionated Heparin",
    category: "anticoagulant",
    doses: [
      { label: "ACS / VTE (bolus)", isWeightBased: true, mgPerKg: 60, unit: "units/kg", maxDose: 5000, route: ["IV"], notes: "60–80 units/kg, max 5000 units" },
      { label: "Infusion", isWeightBased: true, mgPerKg: 12, unit: "units/kg/hr", maxDose: 1000, route: ["IV infusion"], notes: "Titrate per PTT protocol" },
    ],
  },
  tpa: {
    id: "tpa", name: "Alteplase (tPA)", brandName: "Activase",
    category: "anticoagulant", isPanic: true,
    panicReason: "Major bleeding risk including intracranial hemorrhage. Confirm diagnosis, time of onset, BP control, and absence of all contraindications before administration.",
    doses: [
      { label: "Ischemic stroke", isWeightBased: true, mgPerKg: 0.9, unit: "mg", maxDose: 90, route: ["IV"], notes: "10% as bolus over 1 min, remainder over 60 min. Max 90 mg." },
      { label: "Massive PE", isWeightBased: false, flatDose: 100, unit: "mg", display: "100 mg", route: ["IV"], rate: "2 hr", notes: "Cardiac arrest: 50 mg rapid bolus" },
    ],
    contraindications: ["Active intracranial bleeding", "Recent major surgery <3mo", "Prior hemorrhagic stroke"],
    hubLink: "AcuteIschemicStrokeHub",
  },
  // ── NEURO / SEIZURE ──────────────────────────────────────
  levetiracetam: {
    id: "levetiracetam", name: "Levetiracetam", brandName: "Keppra",
    category: "neuro",
    doses: [
      { label: "Status epilepticus", isWeightBased: true, mgPerKg: 60, unit: "mg", maxDose: 4500, route: ["IV"], rate: "15 min", notes: "60 mg/kg, max 4500 mg" },
    ],
    hubLink: "StatusEpilepticusHub",
  },
  phenytoin: {
    id: "phenytoin", name: "Fosphenytoin", brandName: "Cerebyx",
    category: "neuro",
    doses: [
      { label: "Status epilepticus", isWeightBased: true, mgPerKg: 20, unit: "mg PE/kg", maxDose: 1500, route: ["IV"], rate: "150 mg PE/min", notes: "PE = phenytoin equivalents. Monitor BP and ECG." },
    ],
    warnings: ["Hypotension and bradycardia with rapid infusion"],
  },
  // ── METABOLIC ────────────────────────────────────────────
  sodium_bicarb: {
    id: "sodium_bicarb", name: "Sodium Bicarbonate",
    category: "metabolic",
    doses: [
      { label: "Hyperkalemia / TCA", isWeightBased: true, mgPerKg: 1, unit: "mEq/kg", maxDose: 100, route: ["IV"], notes: "1–2 mEq/kg; may repeat. For TCA: bolus 1–2 mEq/kg until QRS narrows." },
      { label: "DKA bicarbonate (pH <6.9)", isWeightBased: false, flatDose: 100, unit: "mEq", display: "100 mEq", route: ["IV"], rate: "2 hr" },
    ],
    hubLink: "HyperkalemiaHub",
  },
  dextrose50: {
    id: "dextrose50", name: "Dextrose 50% (D50)",
    category: "metabolic",
    doses: [
      { label: "Hypoglycemia (adult)", isWeightBased: false, flatDose: 25, unit: "g", display: "25 g (50 mL D50)", route: ["IV"], notes: "For glucose <60 mg/dL" },
      { label: "Peds (D25)", isWeightBased: true, mgPerKg: 0.5, unit: "g", maxDose: 25, route: ["IV"], notes: "D25W 2 mL/kg or D10W 5 mL/kg" },
    ],
  },
  // ── TOXICOLOGY ───────────────────────────────────────────
  activated_charcoal: {
    id: "activated_charcoal", name: "Activated Charcoal",
    category: "tox",
    doses: [
      { label: "Adult", isWeightBased: false, flatDose: 50, unit: "g", display: "50–100 g", route: ["PO/NG"], notes: "Within 1–2 hr of ingestion. Protect airway first." },
      { label: "Peds", isWeightBased: true, mgPerKg: 1, unit: "g", maxDose: 50, route: ["PO/NG"], notes: "1 g/kg" },
    ],
    contraindications: ["Unprotected airway", "Caustic ingestion", "Ileus", "Hydrocarbon ingestion"],
    hubLink: "ToxicologyHub",
  },
  n_acetylcysteine: {
    id: "n_acetylcysteine", name: "N-Acetylcysteine (IV)", brandName: "Acetadote",
    category: "tox",
    doses: [
      { label: "Loading (Bag 1)", isWeightBased: true, mgPerKg: 150, unit: "mg", maxDose: 15000, route: ["IV"], rate: "60 min", notes: "150 mg/kg in 200 mL D5W" },
      { label: "Maintenance (Bag 2)", isWeightBased: true, mgPerKg: 50, unit: "mg", maxDose: 5000, route: ["IV"], rate: "4 hr", notes: "50 mg/kg in 500 mL D5W" },
      { label: "Maintenance (Bag 3)", isWeightBased: true, mgPerKg: 100, unit: "mg", maxDose: 10000, route: ["IV"], rate: "16 hr", notes: "100 mg/kg in 1000 mL D5W" },
    ],
    hubLink: "ToxicologyHub",
  },
  // ── OB ───────────────────────────────────────────────────
  oxytocin: {
    id: "oxytocin", name: "Oxytocin", brandName: "Pitocin",
    category: "ob",
    preparation: "30 units in 500 mL NS = 60 mUnits/mL",
    doses: [
      { label: "PPH", isWeightBased: false, flatDose: 10, unit: "units", display: "10–40 units", route: ["IV infusion"], rate: "Titrate", notes: "NEVER rapid IV bolus — fatal hypotension" },
    ],
    isPanic: true,
    panicReason: "NEVER give as rapid IV bolus — can cause severe hypotension, cardiac arrest. Administer as diluted infusion only.",
    hubLink: "PostPartumHemorrhageHub",
  },
  magnesium_sulfate: {
    id: "magnesium_sulfate", name: "Magnesium Sulfate",
    category: "ob",
    doses: [
      { label: "Eclampsia prevention", isWeightBased: false, flatDose: 4, unit: "g", display: "4–6 g", route: ["IV"], rate: "15–20 min", notes: "Then 1–2 g/hr maintenance" },
      { label: "Hypomagnesemia", isWeightBased: false, flatDose: 2, unit: "g", display: "2 g", route: ["IV"], rate: "30 min" },
    ],
    warnings: ["Hypermagnesemia — monitor DTRs, respiratory rate"],
    hubLink: "HELLPHub",
  },
};

// ─── IMAGING DATABASE ────────────────────────────────────────
export const IMAGING_DB = {
  ct_head_nc: {
    id: "ct_head_nc", name: "CT Head without Contrast",
    modality: "CT", region: "Head", contrast: "without", stat: true,
    indication: "Stroke, TIA, altered mental status, severe headache, trauma",
    orderText: "CT Head without contrast — STAT\nIndication: [Acute neurological change / rule out hemorrhage / trauma]\nClinical question: Intracranial hemorrhage vs. ischemic stroke",
    hubLink: "AcuteIschemicStrokeHub",
  },
  ct_head_perfusion: {
    id: "ct_head_perfusion", name: "CT Head Perfusion (CTP)",
    modality: "CT", region: "Head", contrast: "with", stat: true,
    indication: "Large vessel occlusion, wake-up stroke, extended window (>4.5h)",
    orderText: "CT Perfusion Head with contrast — STAT\nIndication: Suspected LVO / extended thrombolysis window\nMTT, CBF, CBV, Tmax maps requested",
    hubLink: "AcuteIschemicStrokeHub",
  },
  cta_head_neck: {
    id: "cta_head_neck", name: "CTA Head and Neck",
    modality: "CT", region: "Head & Neck", contrast: "with", stat: true,
    indication: "Suspected LVO, carotid dissection, SAH work-up",
    orderText: "CTA Head and Neck with contrast — STAT\nIndication: Suspected large vessel occlusion / carotid dissection\nRequest circle of Willis + extracranial cervical vessels",
    hubLink: "AcuteIschemicStrokeHub",
  },
  ct_chest_pe: {
    id: "ct_chest_pe", name: "CT Pulmonary Angiography (CTPA)",
    modality: "CT", region: "Chest", contrast: "with", stat: true,
    indication: "Suspected pulmonary embolism",
    orderText: "CT Pulmonary Angiography with contrast — STAT\nIndication: Suspected pulmonary embolism\nWells score: [_] | D-dimer: [_]\nNote renal function and allergy status",
    hubLink: "MassivePEHub",
  },
  ct_chest_aorta: {
    id: "ct_chest_aorta", name: "CT Aorta (Chest/Abdomen/Pelvis)",
    modality: "CT", region: "Chest/Abdomen/Pelvis", contrast: "with and without", stat: true,
    indication: "Suspected aortic dissection, aneurysm rupture",
    orderText: "CT Aorta Chest/Abdomen/Pelvis with and without contrast — STAT\nIndication: Suspected aortic dissection\nProtocol: Triple-rule-out / Aortic dissection protocol",
  },
  ct_abdomen: {
    id: "ct_abdomen", name: "CT Abdomen/Pelvis with Contrast",
    modality: "CT", region: "Abdomen/Pelvis", contrast: "with", stat: false,
    indication: "Abdominal pain, appendicitis, mesenteric ischemia, bowel obstruction",
    orderText: "CT Abdomen/Pelvis with IV contrast\nIndication: [Acute abdominal pain / r/o appendicitis / bowel obstruction]\nOral contrast per radiologist discretion",
  },
  ct_spine_c: {
    id: "ct_spine_c", name: "CT C-Spine without Contrast",
    modality: "CT", region: "Cervical Spine", contrast: "without", stat: true,
    indication: "Trauma, neck pain with neurological deficit",
    orderText: "CT Cervical Spine without contrast — STAT\nIndication: Trauma / neurological deficit / neck pain\nMaintain C-collar until cleared",
    hubLink: "TraumaHub",
  },
  xr_cxr: {
    id: "xr_cxr", name: "Chest X-Ray (PA/Lateral)",
    modality: "XR", region: "Chest", contrast: "N/A", stat: false,
    indication: "Dyspnea, cough, chest pain, pneumonia, CHF, line placement",
    orderText: "Chest X-Ray PA/Lateral\nIndication: [Dyspnea / cough / fever / chest pain]\nPortable if clinically unstable",
  },
  xr_pelvis: {
    id: "xr_pelvis", name: "Pelvis X-Ray AP",
    modality: "XR", region: "Pelvis", contrast: "N/A", stat: false,
    indication: "Hip fracture, trauma, pelvic pain",
    orderText: "X-Ray Pelvis AP\nIndication: [Suspected hip fracture / pelvic trauma]\nInclude bilateral hip views if femoral neck fracture suspected",
  },
  us_fast: {
    id: "us_fast", name: "FAST / eFAST Exam",
    modality: "US", region: "Abdomen/Chest", contrast: "N/A", stat: true,
    indication: "Trauma assessment, free fluid detection, pericardial effusion",
    orderText: "Bedside FAST/eFAST Ultrasound — STAT\nIndication: Trauma / hemodynamic instability\nViews: Perihepatic, perisplenic, pelvis, pericardial, bilateral pleural",
    hubLink: "POCUSHub",
  },
  us_echo_bedside: {
    id: "us_echo_bedside", name: "Bedside Echocardiogram (POCUS)",
    modality: "US", region: "Heart", contrast: "N/A", stat: true,
    indication: "Cardiac tamponade, pericardial effusion, global LV function, PEA arrest",
    orderText: "Bedside POCUS Cardiac — STAT\nIndication: [PEA / tamponade / hemodynamic instability]\nViews: Parasternal long/short, apical 4C, subcostal",
    hubLink: "POCUSHub",
  },
  us_dvt: {
    id: "us_dvt", name: "Venous Duplex Lower Extremity",
    modality: "US", region: "Lower Extremity", contrast: "N/A", stat: false,
    indication: "Suspected DVT, leg swelling, PE workup",
    orderText: "Bilateral Lower Extremity Venous Duplex Ultrasound\nIndication: Suspected DVT\nWells score: [_]",
    hubLink: "DVTHub",
  },
  echo_formal: {
    id: "echo_formal", name: "Formal Transthoracic Echo",
    modality: "Echo", region: "Heart", contrast: "N/A", stat: false,
    indication: "New murmur, decompensated HF, endocarditis evaluation, valvular disease",
    orderText: "Transthoracic Echocardiogram\nIndication: [New murmur / decompensated HF / rule out endocarditis]\nDoppler assessment of valves and LV function",
  },
};

// ─── LAB PANELS ──────────────────────────────────────────────
export const LAB_PANELS = {
  sepsis_basic: {
    id: "sepsis_basic", name: "Sepsis / Infection Panel",
    scenarios: ["sepsis"],
    items: ["CBC with differential", "CMP (BMP + LFTs)", "Lactic acid", "Blood cultures x2 (before abx)", "Urinalysis + culture", "Procalcitonin", "PT/INR, PTT", "Fibrinogen"],
    orderText: "SEPSIS PANEL:\n- CBC with differential\n- CMP (BMP + LFTs)\n- Lactic acid STAT\n- Blood cultures x2 BEFORE antibiotics\n- Urinalysis + urine culture\n- Procalcitonin\n- PT/INR, PTT\n- Fibrinogen",
  },
  cardiac_panel: {
    id: "cardiac_panel", name: "Cardiac / Chest Pain Panel",
    scenarios: ["acls"],
    items: ["Troponin I (serial 0, 3h)", "BNP or NT-proBNP", "BMP", "CBC", "Magnesium", "12-lead ECG", "PT/INR", "Lipase"],
    orderText: "CARDIAC PANEL:\n- Troponin I STAT (serial 0h, 3h)\n- BNP or NT-proBNP\n- BMP (electrolytes, BUN, Cr)\n- CBC\n- Magnesium level\n- PT/INR\n- 12-lead ECG (if not done)",
  },
  trauma_panel: {
    id: "trauma_panel", name: "Trauma Panel",
    scenarios: ["trauma"],
    items: ["Type & Screen (or X-match)", "CBC with differential", "CMP", "PT/INR, PTT, fibrinogen, TEG/ROTEM", "Lactic acid", "ABG", "Lipase", "UA", "UDS", "BHCG (female of childbearing age)", "Troponin"],
    orderText: "TRAUMA PANEL:\n- Type & Screen / Crossmatch [units needed]\n- CBC with differential\n- CMP\n- PT/INR, PTT, Fibrinogen, TEG/ROTEM\n- Lactic acid STAT\n- ABG\n- Lipase\n- Urinalysis\n- Urine drug screen\n- BHCG (females)\n- Troponin",
  },
  stroke_panel: {
    id: "stroke_panel", name: "Stroke / Neurology Panel",
    scenarios: ["stroke"],
    items: ["CBC with differential", "CMP", "PT/INR, PTT", "Glucose (fingerstick STAT)", "Lipid panel", "HgbA1c", "ESR/CRP", "Hypercoagulability panel (if indicated)", "TSH", "Troponin", "ECG"],
    orderText: "STROKE PANEL:\n- Glucose STAT (fingerstick)\n- CBC with differential\n- CMP\n- PT/INR, PTT\n- Lipid panel\n- HgbA1c\n- ESR, CRP\n- TSH\n- Troponin\n- ECG",
  },
  rsi_panel: {
    id: "rsi_panel", name: "Pre-RSI / Airway Panel",
    scenarios: ["rsi"],
    items: ["ABG or VBG", "BMP (electrolytes)", "Glucose", "Troponin", "CBC", "Lactic acid", "Chest X-ray portable (post-intubation)", "Waveform capnography"],
    orderText: "PRE-RSI PANEL:\n- ABG or VBG STAT\n- BMP\n- Glucose\n- Troponin\n- CBC\n- Lactic acid\n- Portable CXR (post-intubation)\n- Waveform capnography",
  },
  tox_panel: {
    id: "tox_panel", name: "Toxicology Panel",
    scenarios: ["tox"],
    items: ["Serum acetaminophen", "Salicylate level", "Ethanol level", "Urine drug screen (comprehensive)", "CBC", "CMP + LFTs", "PT/INR", "ABG", "Glucose", "Serum osmolality", "Lactate"],
    orderText: "TOXICOLOGY PANEL:\n- Serum acetaminophen level\n- Salicylate level\n- Ethanol level\n- Urine drug screen (comprehensive)\n- CBC\n- CMP + LFTs\n- PT/INR\n- ABG\n- Serum osmolality\n- Lactate",
  },
  ob_panel: {
    id: "ob_panel", name: "OB / Obstetric Emergency Panel",
    scenarios: ["ob"],
    items: ["BHCG quantitative", "CBC with differential", "CMP", "PT/INR, PTT, fibrinogen", "Type & Screen", "Blood cultures x2 (if sepsis)", "Urinalysis + culture", "LDH", "Uric acid"],
    orderText: "OB PANEL:\n- BHCG quantitative\n- CBC with differential\n- CMP\n- PT/INR, PTT, Fibrinogen\n- Type & Screen\n- LDH\n- Uric acid\n- Urinalysis + culture",
  },
  dka_panel: {
    id: "dka_panel", name: "DKA / Hyperglycemia Panel",
    scenarios: [],
    items: ["BMP (glucose, bicarb, BUN/Cr)", "ABG or VBG", "CBC", "Beta-hydroxybutyrate", "Phosphorus", "Magnesium", "UA with ketones", "HgbA1c", "Blood cultures (if febrile)"],
    orderText: "DKA PANEL:\n- BMP STAT\n- ABG or VBG\n- CBC\n- Beta-hydroxybutyrate\n- Phosphorus\n- Magnesium\n- Urinalysis with ketones\n- HgbA1c",
  },
};

// ─── SCENARIOS ───────────────────────────────────────────────
export const SCENARIOS = {
  acls: {
    id: "acls", label: "ACLS", icon: "💓", accentColor: "#FF4444",
    drugIds: ["epinephrine_cardiac", "amiodarone", "adenosine", "atropine", "sodium_bicarb"],
    imagingIds: ["xr_cxr", "us_echo_bedside", "ct_head_nc"],
  },
  trauma: {
    id: "trauma", label: "Trauma", icon: "🚨", accentColor: "#F59E0B",
    drugIds: ["txa", "morphine", "fentanyl", "ketamine_rsi", "rocuronium", "succinylcholine"],
    imagingIds: ["us_fast", "ct_spine_c", "ct_chest_aorta", "xr_pelvis", "xr_cxr"],
  },
  sepsis: {
    id: "sepsis", label: "Sepsis", icon: "🧫", accentColor: "#34D399",
    drugIds: ["piptazo", "vancomycin", "cefepime", "ceftriaxone", "norepinephrine", "vasopressin"],
    imagingIds: ["xr_cxr", "ct_abdomen", "us_echo_bedside"],
  },
  rsi: {
    id: "rsi", label: "RSI / Airway", icon: "💨", accentColor: "#F87171",
    drugIds: ["ketamine_rsi", "etomidate", "propofol", "rocuronium", "succinylcholine", "sugammadex", "midazolam"],
    imagingIds: ["xr_cxr"],
  },
  tox: {
    id: "tox", label: "Tox", icon: "☣️", accentColor: "#FBBF24",
    drugIds: ["naloxone", "flumazenil", "activated_charcoal", "n_acetylcysteine", "sodium_bicarb"],
    imagingIds: ["xr_cxr", "ct_head_nc"],
  },
  ob: {
    id: "ob", label: "OB", icon: "🤰", accentColor: "#F9A8D4",
    drugIds: ["oxytocin", "magnesium_sulfate"],
    imagingIds: ["us_fast"],
  },
  stroke: {
    id: "stroke", label: "Stroke", icon: "🧠", accentColor: "#818CF8",
    drugIds: ["tpa", "labetalol_iv", "nicardipine"],
    imagingIds: ["ct_head_nc", "ct_head_perfusion", "cta_head_neck"],
  },
};

// ─── HUB LINKS ───────────────────────────────────────────────
export const HUB_LINKS = [
  { id: "EDOrderHub",    label: "Orders",     icon: "📋", path: "/EDOrderHub" },
  { id: "AirwayRSIHub",  label: "Airway",     icon: "💨", path: "/AirwayRSIHub" },
  { id: "ResusHub",      label: "Resus",      icon: "💓", path: "/resus-hub" },
  { id: "SepsisHub",     label: "Sepsis",     icon: "🧫", path: "/SepsisHub" },
  { id: "StrokeHub",     label: "Stroke",     icon: "🧠", path: "/stroke-hub" },
  { id: "TraumaHub",     label: "Trauma",     icon: "🚨", path: "/trauma-hub" },
  { id: "CardiacHub",    label: "Cardiac",    icon: "❤️", path: "/cardiac-hub" },
  { id: "ToxicologyHub", label: "Tox",        icon: "☣️", path: "/tox-hub" },
  { id: "OpioidOverdoseHub", label: "Opioid", icon: "💉", path: "/OpioidOverdoseHub" },
  { id: "POCUSHub",      label: "POCUS",      icon: "🔬", path: "/pocus-hub" },
  { id: "UnifiedPharmacologyHub", label: "Pharm", icon: "💊", path: "/unified-pharma" },
];