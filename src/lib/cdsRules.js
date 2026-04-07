/**
 * CDS Rule Engine
 * Returns an array of alert objects: { id, severity, category, title, detail, rule }
 * severity: "critical" | "warning" | "info"
 */

// ── Drug–allergy cross-reference ──────────────────────────────────────────
const ALLERGY_DRUG_MAP = [
  { allergen: "penicillin",     drugs: ["amoxicillin","ampicillin","piperacillin","amoxicillin-clavulanate","augmentin","oxacillin","nafcillin","dicloxacillin"],  crossReact: ["cephalexin","cefazolin","ceftriaxone","cefepime","carbapenems","meropenem","ertapenem","imipenem"] },
  { allergen: "sulfa",          drugs: ["trimethoprim-sulfamethoxazole","bactrim","sulfamethoxazole","sulfadiazine","dapsone"],                                    crossReact: ["furosemide","hydrochlorothiazide","celecoxib","probenecid"] },
  { allergen: "aspirin",        drugs: ["aspirin","asa"],                                                                                                          crossReact: ["ibuprofen","naproxen","ketorolac","indomethacin","meloxicam","diclofenac"] },
  { allergen: "nsaids",         drugs: ["ibuprofen","naproxen","ketorolac","indomethacin","meloxicam","diclofenac","aspirin"],                                     crossReact: [] },
  { allergen: "cephalosporin",  drugs: ["cephalexin","cefazolin","ceftriaxone","cefepime","cefuroxime","cefdinir"],                                                crossReact: ["penicillin","amoxicillin","ampicillin"] },
  { allergen: "fluoroquinolone",drugs: ["ciprofloxacin","levofloxacin","moxifloxacin","ofloxacin"],                                                                crossReact: [] },
  { allergen: "opioid",         drugs: ["morphine","oxycodone","hydrocodone","fentanyl","dilaudid","hydromorphone","codeine","tramadol","meperidine"],              crossReact: [] },
  { allergen: "contrast",       drugs: ["iodine","iodinated contrast","gadolinium"],                                                                               crossReact: [] },
  { allergen: "latex",          drugs: [],                                                                                                                          crossReact: [] },
  { allergen: "vancomycin",     drugs: ["vancomycin"],                                                                                                             crossReact: [] },
  { allergen: "metronidazole",  drugs: ["metronidazole","flagyl"],                                                                                                 crossReact: [] },
  { allergen: "clindamycin",    drugs: ["clindamycin","cleocin"],                                                                                                  crossReact: [] },
];

function checkDrugAllergy(medications, allergies) {
  const alerts = [];
  const medNames = medications.map(m => (typeof m === "string" ? m : m.name || "").toLowerCase());
  const allergyNames = allergies.map(a => a.toLowerCase());

  allergyNames.forEach(allergy => {
    ALLERGY_DRUG_MAP.forEach(rule => {
      if (!allergy.includes(rule.allergen) && !rule.allergen.includes(allergy)) return;

      // Direct match
      rule.drugs.forEach(drug => {
        medNames.forEach(med => {
          if (med.includes(drug) || drug.includes(med.split(" ")[0])) {
            alerts.push({
              id: `allergy-direct-${drug}`,
              severity: "critical",
              category: "Drug–Allergy",
              title: `Allergy conflict: ${med}`,
              detail: `Patient has documented ${allergy} allergy. ${med} is contraindicated.`,
              rule: "drug-allergy",
            });
          }
        });
      });

      // Cross-reactivity
      rule.crossReact.forEach(drug => {
        medNames.forEach(med => {
          if (med.includes(drug) || drug.includes(med.split(" ")[0])) {
            alerts.push({
              id: `allergy-cross-${drug}`,
              severity: "warning",
              category: "Cross-Reactivity",
              title: `Potential cross-reactivity: ${med}`,
              detail: `Patient has ${allergy} allergy. ${med} may cross-react (~5–10%). Use with caution or consider alternative.`,
              rule: "cross-reactivity",
            });
          }
        });
      });
    });
  });

  return alerts;
}

// ── Sepsis / qSOFA triggers ────────────────────────────────────────────────
function checkSepsis(vitals, cc) {
  const alerts = [];
  const hr   = parseInt(vitals.hr   || 0);
  const rr   = parseInt(vitals.rr   || 0);
  const spo2 = parseInt(vitals.spo2 || 100);
  const sbp  = parseInt((vitals.bp  || "0/0").split("/")[0]);
  const temp = parseFloat(vitals.temp || 37);
  const gcs  = parseInt(vitals.gcs  || 15);
  const ccLower = (cc || "").toLowerCase();

  const infectiousCC = ["fever","infection","sepsis","pneumonia","uti","cellulitis","abscess","pyelonephritis","meningitis","bacteremia","endocarditis","peritonitis"];
  const possibleInfection = infectiousCC.some(kw => ccLower.includes(kw));

  // qSOFA score
  let qsofa = 0;
  if (rr >= 22)  qsofa++;
  if (sbp > 0 && sbp <= 100) qsofa++;
  if (gcs < 15)  qsofa++;

  // SIRS criteria
  let sirs = 0;
  if (temp > 38.3 || temp < 36) sirs++;
  if (hr > 90)   sirs++;
  if (rr > 20)   sirs++;

  if (qsofa >= 2 && possibleInfection) {
    alerts.push({
      id: "sepsis-qsofa",
      severity: "critical",
      category: "Sepsis Alert",
      title: "qSOFA ≥ 2 — Possible Sepsis",
      detail: `qSOFA score ${qsofa}/3 (SBP ≤100: ${sbp<=100&&sbp>0?'✓':'✗'}, RR ≥22: ${rr>=22?'✓':'✗'}, GCS <15: ${gcs<15?'✓':'✗'}). Consider sepsis bundle: blood cultures, lactate, broad-spectrum abx, 30 mL/kg IVF.`,
      rule: "qsofa",
    });
  } else if (qsofa >= 2) {
    alerts.push({
      id: "sepsis-qsofa-nocc",
      severity: "warning",
      category: "Sepsis Alert",
      title: "qSOFA ≥ 2 — Assess for Infection",
      detail: `qSOFA score ${qsofa}/3. Consider infectious etiology and assess for sepsis if clinically indicated.`,
      rule: "qsofa",
    });
  }

  if (sirs >= 2 && possibleInfection && qsofa < 2) {
    alerts.push({
      id: "sepsis-sirs",
      severity: "warning",
      category: "Sepsis Alert",
      title: "SIRS Criteria Met",
      detail: `${sirs}/4 SIRS criteria present (Temp: ${temp}°, HR: ${hr}, RR: ${rr}). Monitor closely; evaluate for infectious source.`,
      rule: "sirs",
    });
  }

  // SpO2 hypoxia
  if (spo2 > 0 && spo2 < 90) {
    alerts.push({
      id: "hypoxia-critical",
      severity: "critical",
      category: "Respiratory",
      title: `Critical hypoxia: SpO₂ ${spo2}%`,
      detail: "SpO₂ <90%. Consider supplemental O₂, ABG, and assess for respiratory failure. Evaluate need for advanced airway.",
      rule: "hypoxia",
    });
  } else if (spo2 > 0 && spo2 < 94) {
    alerts.push({
      id: "hypoxia-warning",
      severity: "warning",
      category: "Respiratory",
      title: `Low SpO₂: ${spo2}%`,
      detail: "SpO₂ <94%. Initiate supplemental oxygen and monitor closely.",
      rule: "hypoxia",
    });
  }

  // Hypotension
  if (sbp > 0 && sbp < 90) {
    alerts.push({
      id: "hypotension",
      severity: "critical",
      category: "Hemodynamics",
      title: `Hypotension: BP ${vitals.bp}`,
      detail: "SBP <90 mmHg. Assess volume status, consider fluid resuscitation, vasopressors if refractory. Rule out shock (septic, cardiogenic, hemorrhagic, neurogenic).",
      rule: "hypotension",
    });
  }

  // Tachycardia
  if (hr > 150) {
    alerts.push({
      id: "tachy-critical",
      severity: "critical",
      category: "Cardiac",
      title: `Severe tachycardia: HR ${hr}`,
      detail: "HR >150. Obtain 12-lead ECG. Consider SVT, Afib with RVR, VT. Assess hemodynamic stability.",
      rule: "tachycardia",
    });
  } else if (hr > 120) {
    alerts.push({
      id: "tachy-warning",
      severity: "warning",
      category: "Cardiac",
      title: `Tachycardia: HR ${hr}`,
      detail: "HR >120. Evaluate for pain, anxiety, fever, hypovolemia, PE, dysrhythmia. Obtain ECG.",
      rule: "tachycardia",
    });
  }

  return alerts;
}

// ── PMH-based drug cautions ────────────────────────────────────────────────
const PMH_DRUG_CAUTIONS = [
  {
    conditions: ["renal failure","ckd","chronic kidney disease","dialysis","aki","renal insufficiency"],
    drugs:      ["nsaids","ibuprofen","naproxen","ketorolac","metformin","gabapentin","digoxin","lithium"],
    message:    (drug, cond) => `${drug} requires dose adjustment or is contraindicated in ${cond}. Check renal dosing.`,
    severity:   "warning",
  },
  {
    conditions: ["liver failure","cirrhosis","hepatic impairment","hepatitis"],
    drugs:      ["acetaminophen","tylenol","paracetamol","metformin","statins","warfarin"],
    message:    (drug, cond) => `${drug} may be hepatotoxic or require dose adjustment in ${cond}. Monitor LFTs.`,
    severity:   "warning",
  },
  {
    conditions: ["heart failure","chf","hf"],
    drugs:      ["nsaids","ibuprofen","naproxen","thiazolidinediones","pioglitazone","rosiglitazone","verapamil","diltiazem"],
    message:    (drug, cond) => `${drug} can worsen ${cond} due to sodium/water retention or negative inotropy.`,
    severity:   "warning",
  },
  {
    conditions: ["copd","asthma"],
    drugs:      ["beta blocker","metoprolol","atenolol","propranolol","carvedilol","labetalol","aspirin","nsaids"],
    message:    (drug, cond) => `${drug} may precipitate bronchospasm in patients with ${cond}. Use with caution.`,
    severity:   "warning",
  },
  {
    conditions: ["seizure","epilepsy"],
    drugs:      ["tramadol","bupropion","fluoroquinolone","ciprofloxacin","levofloxacin","imipenem","meperidine"],
    message:    (drug, cond) => `${drug} lowers seizure threshold — caution in ${cond}.`,
    severity:   "warning",
  },
  {
    conditions: ["gi bleed","peptic ulcer","ulcer"],
    drugs:      ["aspirin","ibuprofen","naproxen","ketorolac","nsaids","steroids","prednisone","dexamethasone","heparin","warfarin"],
    message:    (drug, cond) => `${drug} increases GI bleeding risk in ${cond}. Consider PPI co-therapy or alternative.`,
    severity:   "warning",
  },
  {
    conditions: ["hypertension","htn"],
    drugs:      ["pseudoephedrine","phenylephrine","decongestant","nsaids","ibuprofen","stimulant"],
    message:    (drug, cond) => `${drug} may exacerbate ${cond} via sympathomimetic or sodium-retaining effects.`,
    severity:   "info",
  },
  {
    conditions: ["diabetes","t2dm","type 2 diabetes","type 1 diabetes","t1dm"],
    drugs:      ["prednisone","dexamethasone","methylprednisolone","steroid","quetiapine","olanzapine"],
    message:    (drug, cond) => `${drug} can cause hyperglycemia in ${cond}. Monitor blood glucose closely.`,
    severity:   "info",
  },
];

function checkPMHDrugCautions(medications, pmhSelected) {
  const alerts = [];
  const medNames = medications.map(m => (typeof m === "string" ? m : m.name || "").toLowerCase());
  const activeConditions = Object.keys(pmhSelected || {}).filter(k => pmhSelected[k]).map(k => k.toLowerCase());

  PMH_DRUG_CAUTIONS.forEach(rule => {
    const matchedCondition = rule.conditions.find(c => activeConditions.some(ac => ac.includes(c) || c.includes(ac)));
    if (!matchedCondition) return;

    rule.drugs.forEach(drug => {
      medNames.forEach(med => {
        if (med.includes(drug) || drug.includes(med.split(" ")[0])) {
          alerts.push({
            id: `pmh-drug-${drug}-${matchedCondition}`.replace(/\s/g, "-"),
            severity: rule.severity,
            category: "PMH–Drug Caution",
            title: `Caution: ${med} + ${matchedCondition}`,
            detail: rule.message(med, matchedCondition),
            rule: "pmh-drug",
          });
        }
      });
    });
  });

  return alerts;
}

// ── Age-based guidelines ───────────────────────────────────────────────────
function checkAgeGuidelines(age, medications, pmhSelected) {
  const alerts = [];
  const ageNum = parseInt(age || 0);
  if (!ageNum) return alerts;

  const medNames = medications.map(m => (typeof m === "string" ? m : m.name || "").toLowerCase());
  const activeConditions = Object.keys(pmhSelected || {}).filter(k => pmhSelected[k]).map(k => k.toLowerCase());

  // Elderly (≥65) — Beers Criteria highlights
  if (ageNum >= 65) {
    const beersDrugs = [
      { drug:"diphenhydramine", reason:"anticholinergic — delirium/fall risk in elderly" },
      { drug:"benadryl",        reason:"anticholinergic — delirium/fall risk in elderly" },
      { drug:"diazepam",        reason:"benzodiazepine — prolonged half-life, fall risk" },
      { drug:"alprazolam",      reason:"benzodiazepine — fall/fracture risk in elderly" },
      { drug:"lorazepam",       reason:"benzodiazepine — fall/fracture risk in elderly" },
      { drug:"zolpidem",        reason:"z-drug — fall/fracture/delirium risk" },
      { drug:"amitriptyline",   reason:"TCA — anticholinergic, arrhythmia risk" },
      { drug:"nortriptyline",   reason:"TCA — anticholinergic, arrhythmia risk" },
      { drug:"meperidine",      reason:"avoid in elderly — neurotoxic metabolite accumulation" },
      { drug:"carisoprodol",    reason:"muscle relaxant — CNS depression, falls" },
      { drug:"methocarbamol",   reason:"muscle relaxant — CNS depression, falls" },
      { drug:"cyclobenzaprine", reason:"anticholinergic muscle relaxant — falls/delirium" },
      { drug:"digoxin",         reason:"narrow therapeutic index — toxicity risk in elderly" },
      { drug:"glibenclamide",   reason:"prolonged hypoglycemia risk in elderly" },
      { drug:"glyburide",       reason:"prolonged hypoglycemia risk in elderly" },
      { drug:"indomethacin",    reason:"high GI/CNS toxicity risk in elderly" },
    ];

    beersDrugs.forEach(({ drug, reason }) => {
      medNames.forEach(med => {
        if (med.includes(drug) || drug.includes(med.split(" ")[0])) {
          alerts.push({
            id: `beers-${drug}`,
            severity: "warning",
            category: "Beers Criteria (Age ≥65)",
            title: `Potentially inappropriate: ${med}`,
            detail: `Beers Criteria: ${reason}. Consider safer alternative.`,
            rule: "beers",
          });
        }
      });
    });

    // Fall risk reminder
    if (medNames.some(m => ["opioid","morphine","fentanyl","oxycodone","hydrocodone","dilaudid","lorazepam","alprazolam","diazepam","zolpidem","gabapentin","pregabalin"].some(d => m.includes(d)))) {
      alerts.push({
        id: "falls-elderly",
        severity: "info",
        category: "Fall Risk",
        title: "Fall precautions recommended (age ≥65)",
        detail: "Patient is ≥65 and on medication(s) that increase fall risk. Ensure fall precautions are documented.",
        rule: "falls",
      });
    }
  }

  // Pediatric weight-based dosing reminder (<18)
  if (ageNum < 18) {
    alerts.push({
      id: "peds-dosing",
      severity: "info",
      category: "Pediatric",
      title: "Weight-based dosing required",
      detail: `Patient is ${ageNum} years old. Verify all medication doses are weight-based (mg/kg). Consider pediatric pharmacist review.`,
      rule: "peds-dosing",
    });

    const adultOnlyMeds = ["aspirin","warfarin","fluoroquinolone","ciprofloxacin","levofloxacin","doxycycline","tetracycline"];
    adultOnlyMeds.forEach(drug => {
      medNames.forEach(med => {
        if (med.includes(drug) || drug.includes(med.split(" ")[0])) {
          alerts.push({
            id: `peds-adult-drug-${drug}`,
            severity: "warning",
            category: "Pediatric",
            title: `Not recommended in pediatrics: ${med}`,
            detail: `${med} is generally avoided in patients <18 due to adverse effects (Reye syndrome risk, cartilage toxicity, or dental staining).`,
            rule: "peds-contraindicated",
          });
        }
      });
    });
  }

  return alerts;
}

// ── High-alert medication warnings ────────────────────────────────────────
const HIGH_ALERT_MEDS = [
  { drug:"warfarin",     detail:"Narrow therapeutic index. Verify INR, check for drug interactions, and confirm dose." },
  { drug:"heparin",      detail:"High-alert anticoagulant. Double-check weight-based dosing and renal function." },
  { drug:"insulin",      detail:"High-alert medication. Verify type, dose, and timing. Monitor blood glucose." },
  { drug:"digoxin",      detail:"Narrow therapeutic index. Check renal function, electrolytes (K+, Mg2+), and drug levels." },
  { drug:"lithium",      detail:"Narrow therapeutic index. Monitor levels, renal function, and hydration status." },
  { drug:"methotrexate", detail:"High-alert oncologic agent. Confirm indication (oncology vs. rheumatology dosing — very different regimens)." },
  { drug:"amiodarone",   detail:"Complex pharmacology, long half-life. Check thyroid function, pulmonary status, LFTs." },
  { drug:"fentanyl",     detail:"High-alert opioid. Verify dose, route, patient opioid tolerance." },
  { drug:"morphine",     detail:"High-alert opioid. Consider renal function — active metabolite accumulates in CKD." },
  { drug:"potassium",    detail:"IV potassium: confirm concentration and rate. Max peripheral rate 10 mEq/hr." },
  { drug:"magnesium",    detail:"IV magnesium: monitor for respiratory depression and hyporeflexia at high doses." },
];

function checkHighAlertMeds(medications) {
  const alerts = [];
  const medNames = medications.map(m => (typeof m === "string" ? m : m.name || "").toLowerCase());

  HIGH_ALERT_MEDS.forEach(({ drug, detail }) => {
    medNames.forEach(med => {
      if (med.includes(drug) || drug.includes(med.split(" ")[0])) {
        alerts.push({
          id: `high-alert-${drug}`,
          severity: "info",
          category: "High-Alert Medication",
          title: `High-alert med: ${med}`,
          detail,
          rule: "high-alert",
        });
      }
    });
  });

  return alerts;
}

// ── Main export ────────────────────────────────────────────────────────────
export function runCDSRules({ medications = [], allergies = [], vitals = {}, pmhSelected = {}, age = "", cc = "" }) {
  const all = [
    ...checkDrugAllergy(medications, allergies),
    ...checkSepsis(vitals, cc),
    ...checkPMHDrugCautions(medications, pmhSelected),
    ...checkAgeGuidelines(age, medications, pmhSelected),
    ...checkHighAlertMeds(medications),
  ];

  // De-duplicate by id, keep highest severity
  const SEV = { critical: 0, warning: 1, info: 2 };
  const map = {};
  all.forEach(a => {
    if (!map[a.id] || SEV[a.severity] < SEV[map[a.id].severity]) map[a.id] = a;
  });

  return Object.values(map).sort((a, b) => SEV[a.severity] - SEV[b.severity]);
}