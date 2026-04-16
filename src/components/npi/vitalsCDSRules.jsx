// ── vitalsCDSRules.js ────────────────────────────────────────────────────────
// Pure deterministic rule engine. No network calls, no AI.
// Returns an array of triggered clinical flags sorted critical → advisory → info.
//
// Usage:
//   import { getVitalsCDSFlags } from "@/components/npi/vitalsCDSRules";
//   const flags = getVitalsCDSFlags(vitals, demo, cc, pmhSelected, avpu);
//
// Each flag:
//   { id, tier, icon, title, rationale, action, evidence, score }
//
// Temp expected in °F (US ED standard).
// BP expected as "systolic/diastolic" string or systolic-only string.
// ─────────────────────────────────────────────────────────────────────────────

// ── Parsing helpers ───────────────────────────────────────────────────────────
function num(v) {
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}
function sbp(bp) {
  if (!bp) return null;
  const n = num(String(bp).split("/")[0]);
  return n > 0 ? n : null;
}
function dbp(bp) {
  if (!bp) return null;
  const parts = String(bp).split("/");
  if (parts.length < 2) return null;
  const n = num(parts[1]);
  return n > 0 ? n : null;
}
function ccIncludes(ccText, ...keywords) {
  if (!ccText) return false;
  const lc = ccText.toLowerCase();
  return keywords.some(kw => lc.includes(kw));
}
function hasPmh(pmhSelected, ...keys) {
  if (!pmhSelected) return false;
  return keys.some(k => pmhSelected[k]);
}

// ── Rule definitions ──────────────────────────────────────────────────────────
// Each rule: { id, tier, icon, title, rationale, action, evidence, compute }
// compute(parsed) → string | null  (returns score label if triggered, null if not)

const RULES = [

  // ═══════════════════════════════════════════════════════════════════════════
  // CRITICAL — requires immediate evaluation
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: "hypotension",
    tier: "critical",
    icon: "🔴",
    title: "Hypotension",
    rationale: "Systolic BP <90 mmHg. Evaluate for distributive, obstructive, cardiogenic, or hemorrhagic shock.",
    action: "IV access × 2, 1L NS bolus, point-of-care lactate, EKG, consider RUSH exam. Activate Shock Hub.",
    evidence: "ATLS / Surviving Sepsis Campaign",
    compute: ({ SBP }) => {
      if (SBP === null) return null;
      return SBP < 90 ? `SBP ${SBP} mmHg` : null;
    },
  },

  {
    id: "shock-index-high",
    tier: "critical",
    icon: "📉",
    title: "Shock Index ≥ 1.0",
    rationale: "HR/SBP ≥ 1.0 is associated with significant occult hemorrhage, sepsis, and massive PE. Sensitivity >85% for hemorrhagic shock.",
    action: "Activate MTP if trauma. Obtain type & screen, lactate, and point-of-care echo. Reassess immediately after any intervention.",
    evidence: "Cannon CM et al. Ann Emerg Med 2009",
    compute: ({ HR, SBP }) => {
      if (HR === null || SBP === null || SBP === 0) return null;
      const si = HR / SBP;
      return si >= 1.0 ? `SI = ${si.toFixed(2)} (HR ${HR} / SBP ${SBP})` : null;
    },
  },

  {
    id: "severe-hypoxia",
    tier: "critical",
    icon: "💨",
    title: "Severe Hypoxia — SpO₂ < 90%",
    rationale: "SpO₂ <90% corresponds to PaO₂ <60 mmHg on the oxygen-hemoglobin dissociation curve. Immediate supplemental oxygen indicated.",
    action: "High-flow O₂ (NRB 15 L/min). ABG. CXR. Consider CPAP/BiPAP or early intubation if not responsive. Activate Airway Hub.",
    evidence: "BTS O₂ Guidelines 2017",
    compute: ({ SPO2 }) => {
      if (SPO2 === null) return null;
      return SPO2 < 90 ? `SpO₂ ${SPO2}%` : null;
    },
  },

  {
    id: "severe-tachycardia",
    tier: "critical",
    icon: "⚡",
    title: "Severe Tachycardia — HR > 150",
    rationale: "HR >150 bpm suggests SVT, AF/flutter with rapid ventricular response, or VT. At this rate diastolic filling is impaired and cardiac output falls.",
    action: "12-lead EKG immediately. If unstable → synchronized cardioversion. If stable → adenosine (SVT) or rate control (AF). Activate ECG Hub.",
    evidence: "AHA ACLS 2020",
    compute: ({ HR }) => {
      if (HR === null) return null;
      return HR > 150 ? `HR ${HR} bpm` : null;
    },
  },

  {
    id: "severe-bradycardia",
    tier: "critical",
    icon: "🐢",
    title: "Severe Bradycardia — HR < 40",
    rationale: "HR <40 with or without symptoms warrants immediate evaluation. High-degree AV block, sick sinus syndrome, or drug toxicity (beta-blocker, digoxin, CCB).",
    action: "12-lead EKG. Atropine 0.5 mg IV if symptomatic. Transcutaneous pacing on standby. Check medications for AV nodal agents.",
    evidence: "AHA ACLS 2020",
    compute: ({ HR }) => {
      if (HR === null) return null;
      return HR < 40 ? `HR ${HR} bpm` : null;
    },
  },

  {
    id: "hyperpyrexia",
    tier: "critical",
    icon: "🔥",
    title: "Hyperpyrexia — Temp > 104°F",
    rationale: "Temp >104°F (40°C) may indicate heat stroke, CNS infection, or malignant hyperthermia. Neurological examination essential.",
    action: "Active cooling (ice packs, cooling blanket). LP if meningismus or altered mental status. CT head before LP if focal deficit. Blood cultures × 2 before antibiotics.",
    evidence: "Uptodate / Tintinalli ED Medicine",
    compute: ({ TEMP }) => {
      if (TEMP === null) return null;
      return TEMP > 104 ? `Temp ${TEMP}°F` : null;
    },
  },

  {
    id: "hypertensive-emergency",
    tier: "critical",
    icon: "🆘",
    title: "Hypertensive Emergency — SBP > 220",
    rationale: "SBP >220 mmHg with any end-organ symptoms (headache, vision change, chest pain, neuro deficit, dyspnea) constitutes hypertensive emergency.",
    action: "IV labetalol or nicardipine. Target 20–25% MAP reduction in first hour. Head CT if neuro symptoms. EKG. Troponin. CXR. Urinalysis.",
    evidence: "ACC/AHA Hypertension Guidelines 2017",
    compute: ({ SBP }) => {
      if (SBP === null) return null;
      return SBP > 220 ? `SBP ${SBP} mmHg` : null;
    },
  },

  {
    id: "qsofa-2",
    tier: "critical",
    icon: "🧫",
    title: "qSOFA ≥ 2 — Initiate Sepsis Workup",
    rationale: "qSOFA ≥2 (altered mentation, RR ≥22, SBP ≤100) is associated with >10% in-hospital mortality in suspected infection. Sepsis-3 criteria met.",
    action: "Blood cultures × 2 before antibiotics. Lactate. Broad-spectrum ABX within 1 hour of recognition. 30 mL/kg crystalloid if lactate >2. Activate Sepsis Hub.",
    evidence: "Sepsis-3 / Singer M et al. JAMA 2016",
    compute: ({ HR, RR, SBP, AVPU }) => {
      if (SBP === null && RR === null && !AVPU) return null;
      const rrMet = RR !== null && RR >= 22;
      const bpMet = SBP !== null && SBP <= 100;
      const msMet = Boolean(AVPU && AVPU !== "Alert");
      const score = (rrMet ? 1 : 0) + (bpMet ? 1 : 0) + (msMet ? 1 : 0);
      return score >= 2 ? `qSOFA ${score}/3` : null;
    },
  },

  {
    id: "neonatal-fever",
    tier: "critical",
    icon: "👶",
    title: "Neonatal / Young Infant Fever",
    rationale: "Fever ≥100.4°F in infants <3 months carries 10–15% risk of serious bacterial infection. Standard fever criteria do not apply in this age group.",
    action: "Full sepsis workup: CBC, CMP, UA/UCx, blood cultures, LP. Consider empiric ampicillin + gentamicin or ceftriaxone per age. Admit for observation.",
    evidence: "Rochester / Philadelphia / Boston Criteria; AAP 2021",
    compute: ({ TEMP, AGE }) => {
      if (TEMP === null || AGE === null) return null;
      return TEMP >= 100.4 && AGE < 3 ? `${TEMP}°F, age ${AGE} months` : null;
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ADVISORY — should act; time-sensitive but not immediately life-threatening
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: "hypertensive-urgency",
    tier: "advisory",
    icon: "⚠️",
    title: "Hypertensive Urgency — SBP 180–220",
    rationale: "SBP 180–220 without end-organ damage constitutes hypertensive urgency. Goal is gradual reduction over 24–48h, not rapid correction.",
    action: "Oral antihypertensives (amlodipine, lisinopril). Avoid rapid IV reduction. Assess for end-organ symptoms. ECG, UA, CMP, fundoscopy if available.",
    evidence: "JNC 8 / ACC-AHA 2017",
    compute: ({ SBP }) => {
      if (SBP === null) return null;
      return SBP >= 180 && SBP <= 220 ? `SBP ${SBP} mmHg` : null;
    },
  },

  {
    id: "shock-index-borderline",
    tier: "advisory",
    icon: "📊",
    title: "Borderline Shock Index 0.7–0.99",
    rationale: "SI 0.7–0.99 represents a gray zone with increased risk of deterioration, particularly in occult hemorrhage and early sepsis.",
    action: "Fluid challenge and reassess. Repeat vitals q15 min. Point-of-care ultrasound (IVC, cardiac). Low threshold for additional workup.",
    evidence: "Cannon CM et al. Ann Emerg Med 2009",
    compute: ({ HR, SBP }) => {
      if (HR === null || SBP === null || SBP === 0) return null;
      const si = HR / SBP;
      return si >= 0.7 && si < 1.0 ? `SI = ${si.toFixed(2)} (HR ${HR} / SBP ${SBP})` : null;
    },
  },

  {
    id: "tachycardia-moderate",
    tier: "advisory",
    icon: "💓",
    title: "Tachycardia — HR 101–150",
    rationale: "Tachycardia is a nonspecific but important finding. Common causes in the ED: pain, anxiety, hypovolemia, infection, PE, thyroid storm.",
    action: "12-lead EKG. Consider PE if HR >100 + dyspnea/pleuritic pain — apply PERC rule. Treat underlying cause before rate control.",
    evidence: "AHA ACLS / ACEP Clinical Policy",
    compute: ({ HR }) => {
      if (HR === null) return null;
      return HR > 100 && HR <= 150 ? `HR ${HR} bpm` : null;
    },
  },

  {
    id: "bradycardia-moderate",
    tier: "advisory",
    icon: "🐌",
    title: "Bradycardia — HR 40–50",
    rationale: "HR 40–50 requires evaluation for AV nodal disease, hypothyroidism, or drug effect (beta-blockers, digoxin, calcium channel blockers).",
    action: "12-lead EKG for PR interval and AV block. Check medication list for nodal agents. TSH. Orthostatic vitals. Observe on monitor.",
    evidence: "AHA ACLS 2020",
    compute: ({ HR }) => {
      if (HR === null) return null;
      return HR >= 40 && HR <= 50 ? `HR ${HR} bpm` : null;
    },
  },

  {
    id: "moderate-hypoxia",
    tier: "advisory",
    icon: "🫁",
    title: "Hypoxia — SpO₂ 90–93%",
    rationale: "SpO₂ 90–93% is clinically significant, particularly in patients with known lung disease where baseline may be lower.",
    action: "Supplemental O₂ titrated to SpO₂ ≥94% (88–92% if COPD). CXR. Consider ABG if not improving. POCUS (lung, IVC).",
    evidence: "BTS O₂ Guidelines 2017",
    compute: ({ SPO2 }) => {
      if (SPO2 === null) return null;
      return SPO2 >= 90 && SPO2 < 94 ? `SpO₂ ${SPO2}%` : null;
    },
  },

  {
    id: "fever",
    tier: "advisory",
    icon: "🌡️",
    title: "Fever — Temp 100.4–103.9°F",
    rationale: "Fever ≥100.4°F (38°C) in the ED context requires source identification. Consider occult bacteremia in the elderly and immunocompromised.",
    action: "Source survey: UA, CXR, blood cultures × 2 if systemically ill. CBC, CMP. Consider LP if meningismus or altered mental status.",
    evidence: "Tintinalli ED Medicine 9th Ed",
    compute: ({ TEMP, AGE }) => {
      if (TEMP === null) return null;
      // Neonatal fever is handled as critical above
      if (AGE !== null && AGE < 3) return null;
      return TEMP >= 100.4 && TEMP <= 103.9 ? `Temp ${TEMP}°F` : null;
    },
  },

  {
    id: "hypothermia",
    tier: "advisory",
    icon: "🧊",
    title: "Hypothermia — Temp < 96.8°F",
    rationale: "Temp <96.8°F (36°C) indicates hypothermia. Consider environmental exposure, sepsis, hypothyroidism, and adrenal insufficiency.",
    action: "Passive rewarming (blankets). Active external rewarming if moderate (<91.4°F). EKG (Osborne J-waves). Glucose. TSH. Cortisol if no obvious cause.",
    evidence: "Wilderness Medical Society Guidelines 2019",
    compute: ({ TEMP }) => {
      if (TEMP === null) return null;
      return TEMP < 96.8 ? `Temp ${TEMP}°F` : null;
    },
  },

  {
    id: "elevated-rr",
    tier: "advisory",
    icon: "🌬️",
    title: "Tachypnea — RR ≥ 22",
    rationale: "RR ≥22 is one of the most sensitive early warning signs of deterioration. Present in sepsis, PE, metabolic acidosis (DKA, renal failure), and pulmonary disease.",
    action: "Pulse oximetry. ABG or VBG for pH and lactate. CXR. Consider D-dimer or CT-PA if PE suspected. Check glucose if DKA risk.",
    evidence: "Sepsis-3 / NICE NEWS2",
    compute: ({ RR }) => {
      if (RR === null) return null;
      return RR >= 22 ? `RR ${RR} breaths/min` : null;
    },
  },

  {
    id: "perc-not-met",
    tier: "advisory",
    icon: "🩸",
    title: "PERC Not Met — Evaluate for PE",
    rationale: "HR ≥100 or SpO₂ <95% or age ≥50 means PERC rule cannot exclude PE in a patient presenting with chest pain or dyspnea.",
    action: "Apply full Wells PE criteria. If Wells >4: CT-PA. If Wells ≤4: D-dimer (age-adjusted threshold if ≥50: age × 10 µg/L).",
    evidence: "Kline JA et al. J Thromb Haemost 2004 / YEARS Algorithm",
    compute: ({ HR, SPO2, AGE, CC_TEXT }) => {
      if (!ccIncludes(CC_TEXT, "chest", "breath", "dyspnea", "sob", "syncope", "palpitat", "pleuritic")) return null;
      if (HR === null && SPO2 === null && AGE === null) return null;
      const percFail = (HR !== null && HR >= 100) || (SPO2 !== null && SPO2 < 95) || (AGE !== null && AGE >= 50);
      return percFail ? `HR ${HR ?? "—"}, SpO₂ ${SPO2 ?? "—"}%, Age ${AGE ?? "—"}` : null;
    },
  },

  {
    id: "age-adjusted-ddimer",
    tier: "advisory",
    icon: "🔬",
    title: "Age-Adjusted D-Dimer Threshold",
    rationale: "Standard D-dimer cutoff (500 µg/L) has low specificity in patients ≥50. Use age × 10 µg/L as threshold to maintain sensitivity while improving specificity.",
    action: "If D-dimer ordered: use age-adjusted threshold. In patients ≥50, a result above 500 µg/L but below (age × 10) may still be negative.",
    evidence: "Righini M et al. JAMA 2014",
    compute: ({ AGE, CC_TEXT }) => {
      if (AGE === null || AGE < 50) return null;
      if (!ccIncludes(CC_TEXT, "chest", "breath", "dyspnea", "sob", "pe ", "dvt", "clot", "syncope")) return null;
      const threshold = AGE * 10;
      return `Age ${AGE} → threshold ${threshold} µg/L (vs. standard 500)`;
    },
  },

  {
    id: "heart-score-context",
    tier: "advisory",
    icon: "❤️",
    title: "Chest Pain + Tachycardia — HEART Score Context",
    rationale: "HR >100 in a chest pain presentation may reflect underlying ACS (compensatory tachycardia) or confound HEART score interpretation. Requires serial troponins.",
    action: "Serial troponin at 0h and 2–3h (high-sensitivity) or 3h and 6h (conventional). EKG. HEART score requires risk factor assessment — document now in MDM.",
    evidence: "ACEP Chest Pain Guideline 2023",
    compute: ({ HR, CC_TEXT }) => {
      if (HR === null) return null;
      if (!ccIncludes(CC_TEXT, "chest", "palpitat", "pressure", "tightness")) return null;
      return HR > 100 ? `HR ${HR} bpm with chest complaint` : null;
    },
  },

  {
    id: "headache-htn",
    tier: "advisory",
    icon: "🧠",
    title: "Headache + Elevated BP — Rule Out Hypertensive Emergency",
    rationale: "New severe headache with SBP >180 requires evaluation for hypertensive encephalopathy, intracranial hemorrhage, and posterior reversible encephalopathy syndrome (PRES).",
    action: "Non-contrast CT head. Neurological exam. Fundoscopy if available. MRI brain if CT negative and clinical concern persists.",
    evidence: "AHA/ASA Stroke Guidelines 2022",
    compute: ({ SBP, CC_TEXT }) => {
      if (SBP === null) return null;
      if (!ccIncludes(CC_TEXT, "headache", "head pain", "worst headache")) return null;
      return SBP >= 180 ? `SBP ${SBP} mmHg with headache` : null;
    },
  },

  {
    id: "altered-mentation",
    tier: "advisory",
    icon: "🧩",
    title: "Altered Mentation — AVPU ≠ Alert",
    rationale: "Any deviation from Alert on AVPU corresponds roughly to GCS ≤13. Requires systematic AEIOU-TIPS evaluation for reversible causes.",
    action: "Glucose (bedside). Naloxone if opioid ingestion suspected. Thiamine before dextrose if alcoholism history. CT head. Basic metabolic panel.",
    evidence: "Tintinalli ED Medicine / AEIOU-TIPS mnemonic",
    compute: ({ AVPU }) => {
      if (!AVPU) return null;
      return AVPU !== "Alert" ? `AVPU: ${AVPU}` : null;
    },
  },

  {
    id: "syncope-arrhythmia",
    tier: "advisory",
    icon: "⚡",
    title: "Syncope + Abnormal HR — Arrhythmia Risk",
    rationale: "HR <50 or >100 in a syncope presentation increases pre-test probability of arrhythmic etiology. The SFSR assigns points for HR <50 or >100 at triage.",
    action: "12-lead EKG immediately. Continuous telemetry. Assess SFSR and CSRS criteria. Echocardiogram if structural heart disease suspected.",
    evidence: "Quinn J et al. Ann Emerg Med 2004 (SFSR)",
    compute: ({ HR, CC_TEXT }) => {
      if (HR === null) return null;
      if (!ccIncludes(CC_TEXT, "syncope", "faint", "passed out", "blacked out", "presyncope")) return null;
      return (HR < 50 || HR > 100) ? `HR ${HR} bpm with syncope` : null;
    },
  },

  {
    id: "abd-pain-fever-tachycardia",
    tier: "advisory",
    icon: "🫃",
    title: "Abdominal Pain + Fever + Tachycardia — Septic Source",
    rationale: "The triad of abdominal pain, fever ≥100.4°F, and HR >90 has high sensitivity for intra-abdominal septic process (appendicitis, cholangitis, diverticulitis, SBP).",
    action: "CBC, CMP, lipase, LFTs, UA, lactate. CT abdomen/pelvis with IV contrast. Blood cultures × 2. Surgical consult if peritoneal signs.",
    evidence: "Tokyo Guidelines 2018 (cholangitis) / Alvarado Score",
    compute: ({ HR, TEMP, CC_TEXT }) => {
      if (HR === null || TEMP === null) return null;
      if (!ccIncludes(CC_TEXT, "abdom", "stomach", "belly", "right lower", "rlq", "flank")) return null;
      return HR > 90 && TEMP >= 100.4 ? `HR ${HR}, Temp ${TEMP}°F` : null;
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // INFO — contextual reminders, documentation prompts
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: "geriatric-hypotension",
    tier: "info",
    icon: "👴",
    title: "Geriatric Consideration — SBP <120",
    rationale: "Patients ≥65 who are chronically hypertensive may be functionally hypotensive at SBP values that appear normal for younger patients. Baseline BP is critical context.",
    action: "Ask about baseline BP. Consider IV fluids if symptomatic. Lower threshold for admission. ISAR score already triggered if documented in Triage tab.",
    evidence: "ACEP Geriatric ED Guidelines 2014",
    compute: ({ SBP, AGE }) => {
      if (SBP === null || AGE === null) return null;
      return AGE >= 65 && SBP < 120 ? `Age ${AGE}, SBP ${SBP} mmHg` : null;
    },
  },

  {
    id: "pediatric-tachycardia",
    tier: "info",
    icon: "🧒",
    title: "Pediatric HR Context — Age-Adjusted Normal",
    rationale: "Normal pediatric HR varies by age: <1y ≤160, 1–2y ≤150, 3–5y ≤140, 6–12y ≤120. Adult thresholds do not apply.",
    action: "Apply age-adjusted tachycardia threshold. Review Broselow tape or Pediatric Hub for weight-based dosing if intervention needed.",
    evidence: "PALS 2020 / Pediatric Hub",
    compute: ({ HR, AGE }) => {
      if (HR === null || AGE === null || AGE >= 13) return null;
      // Only fire if HR appears abnormal by adult standard but may be normal for age
      return HR > 100 && AGE < 13 ? `HR ${HR} bpm, age ${AGE}y — verify age-adjusted threshold` : null;
    },
  },

  {
    id: "fever-immunocompromised",
    tier: "info",
    icon: "🛡️",
    title: "Fever in Potentially Immunocompromised Patient",
    rationale: "PMH of malignancy, HIV, transplant, or chronic steroid use significantly lowers threshold for sepsis and opportunistic infection in febrile patients.",
    action: "Consider empiric broad-spectrum antibiotics earlier. Check ANC if oncology patient. Lower threshold for CT imaging. Fungal coverage if prolonged neutropenia.",
    evidence: "IDSA Febrile Neutropenia Guidelines 2010",
    compute: ({ TEMP, PMH }) => {
      if (TEMP === null || TEMP < 100.4) return null;
      const immuno = hasPmh(PMH, "cancer", "malignancy", "hiv", "transplant", "chemotherapy", "immunosuppressed");
      return immuno ? `Temp ${TEMP}°F with immunocompromising PMH` : null;
    },
  },

];

// ── Main export ───────────────────────────────────────────────────────────────
export function getVitalsCDSFlags(vitals = {}, demo = {}, cc = {}, pmhSelected = {}, avpu = "") {
  // Parse all inputs once
  const SBP      = sbp(vitals.bp);
  const DBP      = dbp(vitals.bp);
  const HR       = num(vitals.hr);
  const RR       = num(vitals.rr);
  const SPO2     = num(vitals.spo2);
  const TEMP     = num(vitals.temp);
  const AGE      = num(demo.age);
  const AVPU     = avpu || "";
  const CC_TEXT  = cc.text || "";
  const PMH      = pmhSelected;

  const ctx = { SBP, DBP, HR, RR, SPO2, TEMP, AGE, AVPU, CC_TEXT, PMH };

  const triggered = [];
  for (const rule of RULES) {
    try {
      const score = rule.compute(ctx);
      if (score !== null) {
        triggered.push({ ...rule, score, compute: undefined });
      }
    } catch (_) {
      // Never crash the UI — silently skip a broken rule
    }
  }

  // Sort: critical → advisory → info
  const ORDER = { critical: 0, advisory: 1, info: 2 };
  triggered.sort((a, b) => ORDER[a.tier] - ORDER[b.tier]);

  return triggered;
}