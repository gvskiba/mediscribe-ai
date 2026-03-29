/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║           NOTRYA CLINICAL HUB — SEPSIS HUB                  ║
 * ║           Surviving Sepsis Campaign 2021 · Sepsis-3         ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { useState, useCallback, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";

// ════════════════════════════════════════════════════════════
//  HUB IDENTITY
// ════════════════════════════════════════════════════════════
const HUB_CONFIG = {
  name:        "Sepsis Hub",
  subtitle:    "Sepsis-3 · Hour-1 Bundle · Shock · Antibiotics · Source Control",
  icon:        "🦠",
  accentColor: "#f5c842",
  badgeText:   "SSC 2021",
  description: "Evidence-based sepsis management covering Sepsis-3 definitions, qSOFA/SOFA scoring, the SSC Hour-1 Bundle, septic shock resuscitation, antibiotic stewardship, source control strategies, and vasopressor protocols — based on the Surviving Sepsis Campaign 2021 International Guidelines.",
  evidenceBase: [
    "Surviving Sepsis Campaign Guidelines — Critical Care Medicine 2021",
    "Sepsis-3 Definitions — JAMA 2016 (Singer et al.)",
    "ARISE, ProCESS, ProMISe Trials — NEJM 2014–2015",
    "ANDROMEDA-SHOCK Trial — JAMA 2019",
    "SMART Trial — NEJM 2018 (Balanced Crystalloids)",
    "IDSA Antimicrobial Stewardship Guidelines 2016",
  ],
};

// ════════════════════════════════════════════════════════════
//  CATEGORIES
// ════════════════════════════════════════════════════════════
const CATEGORIES = [
  "Recognition",
  "Resuscitation",
  "Antimicrobials",
  "Organ Support",
  "Source Control",
];

// ════════════════════════════════════════════════════════════
//  CONDITIONS REGISTRY
// ════════════════════════════════════════════════════════════
const CONDITIONS = [
  {
    id: "sepsis3_definitions",
    icon: "🔬",
    title: "Sepsis-3 Definitions",
    subtitle: "Sepsis · Septic Shock · qSOFA · SOFA — 2016 consensus",
    acog: "JAMA 2016",
    incidence: "48.9M cases/year globally",
    severity: "11M deaths/year — 1 in 5 global deaths. Septic shock mortality 40–60%",
    category: "Recognition",
    color: "#f5c842", glass: "rgba(245,200,66,0.07)", border: "rgba(245,200,66,0.28)", accent: "#f7d875",
  },
  {
    id: "qsofa_sofa",
    icon: "📊",
    title: "qSOFA & SOFA Scoring",
    subtitle: "Rapid bedside screening and organ failure quantification",
    acog: "Sepsis-3",
    incidence: "Screen all suspected infections",
    severity: "qSOFA ≥ 2 = 3–14× increased in-hospital mortality",
    category: "Recognition",
    color: "#00e5c0", glass: "rgba(0,229,192,0.07)", border: "rgba(0,229,192,0.28)", accent: "#33eccc",
  },
  {
    id: "hour1_bundle",
    icon: "⏱",
    title: "Hour-1 Bundle",
    subtitle: "SSC 2018 — Five actions within the first hour of sepsis recognition",
    acog: "SSC 2021",
    incidence: "All sepsis/septic shock patients",
    severity: "Each hour of delay in antibiotics increases mortality by ~7%. Bundle compliance reduces mortality by 25%",
    category: "Resuscitation",
    color: "#ff6b6b", glass: "rgba(255,107,107,0.07)", border: "rgba(255,107,107,0.28)", accent: "#ff9999",
  },
  {
    id: "fluid_resuscitation",
    icon: "💧",
    title: "Fluid Resuscitation",
    subtitle: "Balanced crystalloids · Dynamic assessment · Avoid over-resuscitation",
    acog: "SSC 2021",
    incidence: "All septic shock patients",
    severity: "Fluid overload increases mortality — target-directed, reassessed frequently",
    category: "Resuscitation",
    color: "#3b9eff", glass: "rgba(59,158,255,0.07)", border: "rgba(59,158,255,0.28)", accent: "#6eb5ff",
  },
  {
    id: "vasopressors",
    icon: "💉",
    title: "Vasopressors & Inotropes",
    subtitle: "Noradrenaline first-line · Vasopressin · Dobutamine",
    acog: "SSC 2021",
    incidence: "Septic shock — ~30% of sepsis",
    severity: "Target MAP ≥ 65 mmHg. Early vasopressors reduce fluid load and improve outcomes",
    category: "Resuscitation",
    color: "#ff9f43", glass: "rgba(255,159,67,0.07)", border: "rgba(255,159,67,0.28)", accent: "#ffb76b",
  },
  {
    id: "antibiotic_selection",
    icon: "💊",
    title: "Empiric Antibiotic Selection",
    subtitle: "Broad-spectrum within 1 hour · De-escalation after 48–72h",
    acog: "SSC 2021 / IDSA",
    incidence: "All sepsis patients",
    severity: "Inappropriate empiric antibiotics associated with 3–5× increased mortality",
    category: "Antimicrobials",
    color: "#9b6dff", glass: "rgba(155,109,255,0.07)", border: "rgba(155,109,255,0.28)", accent: "#b99bff",
  },
  {
    id: "deescalation",
    icon: "📉",
    title: "Antibiotic De-escalation",
    subtitle: "Cultures · Procalcitonin-guided · Stewardship principles",
    acog: "SSC 2021 / IDSA",
    incidence: "All sepsis patients at 48–72h",
    severity: "De-escalation reduces resistance, toxicity, and C. diff without worsening mortality",
    category: "Antimicrobials",
    color: "#3dffa0", glass: "rgba(61,255,160,0.07)", border: "rgba(61,255,160,0.28)", accent: "#6fffbb",
  },
  {
    id: "ventilation",
    icon: "🫁",
    title: "Ventilation in Sepsis-Associated ARDS",
    subtitle: "Lung-protective · Low tidal volume · Prone positioning",
    acog: "SSC 2021 / ARDSNet",
    incidence: "~40% of septic shock develops ARDS",
    severity: "Lung-protective ventilation reduces 28-day mortality by 22% (ARDSNet)",
    category: "Organ Support",
    color: "#00d4ff", glass: "rgba(0,212,255,0.07)", border: "rgba(0,212,255,0.28)", accent: "#33ddff",
  },
  {
    id: "corticosteroids",
    icon: "⚗️",
    title: "Corticosteroids in Septic Shock",
    subtitle: "Hydrocortisone for refractory vasopressor-dependent shock",
    acog: "SSC 2021",
    incidence: "Refractory septic shock — ~15% of septic shock",
    severity: "ADRENAL / APROCCHSS — modest shock reversal benefit without mortality improvement",
    category: "Organ Support",
    color: "#ff6b9d", glass: "rgba(255,107,157,0.07)", border: "rgba(255,107,157,0.28)", accent: "#ff9ec0",
  },
  {
    id: "source_control",
    icon: "🔪",
    title: "Source Control",
    subtitle: "Identify and control infection source within 6–12 hours",
    acog: "SSC 2021",
    incidence: "Mandatory in all sepsis",
    severity: "Uncontrolled source → treatment failure. Adequate source control is the definitive treatment",
    category: "Source Control",
    color: "#ff9f43", glass: "rgba(255,159,67,0.07)", border: "rgba(255,159,67,0.28)", accent: "#ffb76b",
  },
];

// ════════════════════════════════════════════════════════════
//  TIME TARGETS
// ════════════════════════════════════════════════════════════
const TIME_TARGETS = [
  { icon:"🩸", label:"Blood Cultures",      target:"< 1 hour",   color:"#f5c842" },
  { icon:"💊", label:"Antibiotics",          target:"< 1 hour",   color:"#ff6b6b" },
  { icon:"💧", label:"IV Fluid Bolus",       target:"< 1 hour",   color:"#3b9eff" },
  { icon:"🔪", label:"Source Control",       target:"< 6–12 hrs", color:"#ff9f43" },
];

// ════════════════════════════════════════════════════════════
//  CLINICAL DATA (hardcoded fallback)
// ════════════════════════════════════════════════════════════
const CLINICAL_DATA = {

  sepsis3_definitions: {
    definition: "Sepsis-3 (2016): Sepsis is a life-threatening organ dysfunction caused by a dysregulated host response to infection. Organ dysfunction is identified by an acute change in SOFA score ≥ 2 points. Septic shock is a subset of sepsis with circulatory, cellular, and metabolic abnormalities profound enough to substantially increase mortality — defined clinically as vasopressor requirement to maintain MAP ≥ 65 mmHg AND serum lactate > 2 mmol/L despite adequate fluid resuscitation. SIRS criteria are no longer the defining criteria.",
    keyCriteria: [
      "Sepsis = Suspected/confirmed infection + acute SOFA increase ≥ 2 points (baseline 0 if no prior organ dysfunction)",
      "Septic shock = Sepsis + vasopressor to maintain MAP ≥ 65 + lactate > 2 mmol/L after adequate resuscitation",
      "qSOFA (bedside screen) ≥ 2: Altered mentation (GCS < 15), RR ≥ 22/min, SBP ≤ 100 mmHg",
      "qSOFA is a SCREENING tool — does NOT diagnose sepsis. SOFA is the defining organ dysfunction score",
      "Sepsis-3 eliminated SIRS criteria — SIRS is neither sensitive nor specific for sepsis",
      "Mortality: Sepsis without shock ~10–20%; Septic shock 40–60%",
    ],
    workup: [
      { icon:"🔬", label:"Blood Cultures × 2 (before antibiotics)", detail:"Two sets from two separate sites, ideally peripheral veins. Draw within 45 min of recognition. Each set = 1 aerobic + 1 anaerobic bottle. Do NOT delay antibiotics > 45 min to obtain cultures." },
      { icon:"🩸", label:"Serum Lactate (Stat)", detail:"Lactate > 2 mmol/L = occult tissue hypoperfusion even without hypotension. Lactate > 4 mmol/L = high-risk septic shock criteria met. Repeat within 2h if elevated — target clearance ≥ 10%/h." },
      { icon:"📊", label:"SOFA Score Components", detail:"Respiratory (PaO₂/FiO₂), Coagulation (platelets), Liver (bilirubin), Cardiovascular (MAP + vasopressor dose), CNS (GCS), Renal (creatinine/UO). Score 0–24; SOFA ≥ 2 = organ dysfunction." },
      { icon:"🧪", label:"Full Sepsis Labs Panel", detail:"FBC, UEC, LFTs, coagulation (PT/INR/fibrinogen), CRP, procalcitonin (PCT), ABG with lactate, urinalysis + MCS, blood cultures ×2, consider LP/sputum/wound cultures per source." },
      { icon:"📡", label:"Source Imaging", detail:"CXR (pneumonia, effusion), CT chest/abdomen/pelvis with contrast if source unclear, USS RUQ (cholangitis/cholecystitis), USS renal (pyelonephritis/abscess). Imaging guides source control." },
    ],
    treatment: [
      { cat:"Recognition", drug:"qSOFA Screen", dose:"Score 0–3: RR ≥ 22 (1pt), AMS/GCS < 15 (1pt), SBP ≤ 100 (1pt)", note:"qSOFA ≥ 2 outside ICU = further assessment for organ dysfunction + SOFA. Not a diagnostic criterion — clinical judgement essential.", ref:"Level A" },
      { cat:"Recognition", drug:"SOFA Assessment", dose:"Calculate on ED presentation and repeat every 6–12h in ICU", note:"Baseline SOFA = 0 unless pre-existing organ dysfunction. Delta-SOFA ≥ 2 from baseline = sepsis definition met.", ref:"Level A" },
      { cat:"Notify", drug:"Early ICU/HDU Escalation", dose:"qSOFA ≥ 2 or suspected sepsis = notify senior and activate Sepsis Pathway immediately", note:"Time-to-treatment is the single most important determinant of outcome. Early escalation is mandatory.", ref:"Level A" },
    ],
    followup: [
      "Reassess SOFA every 6–12h in ICU — trend correlates with prognosis",
      "Lactate clearance ≥ 10%/h is an acceptable resuscitation target (LACTATE trial)",
      "Procalcitonin trajectory: rising PCT at 48–72h = treatment failure or new infection",
      "Family communication: explain diagnosis, prognosis, treatment plan early",
      "Sepsis survivors: 50% develop physical/cognitive impairment. Post-sepsis syndrome screening at follow-up",
    ],
    reference: "Sepsis-3 — Singer et al. JAMA 2016; Seymour et al. JAMA 2016; SSC 2021 Guidelines",
  },

  qsofa_sofa: {
    definition: "qSOFA (Quick SOFA) is a 3-item bedside score for identifying adult patients outside the ICU who are likely to have poor outcomes from infection. A score of ≥ 2 warrants further assessment for organ dysfunction. SOFA (Sequential Organ Failure Assessment) quantifies the degree of organ dysfunction across six systems and defines sepsis when acutely increasing ≥ 2 points from baseline.",
    keyCriteria: [
      "qSOFA criteria (1 point each): Altered mentation (GCS < 15), RR ≥ 22/min, SBP ≤ 100 mmHg",
      "qSOFA ≥ 2 = 3–14× increased in-hospital mortality vs qSOFA 0–1",
      "qSOFA is FAST — no labs needed. Use at triage for rapid screening",
      "SOFA requires labs — use once sepsis is suspected to quantify organ dysfunction",
      "SOFA 0–6 = low risk; 7–9 = moderate; 10–12 = high; > 12 = very high mortality",
      "NEWS2 (National Early Warning Score) may outperform qSOFA in some ED settings for detection",
    ],
    workup: [
      { icon:"📊", label:"qSOFA — Three Components", detail:"1. Altered mentation: new confusion, GCS < 15. 2. Respiratory rate ≥ 22/min. 3. Systolic BP ≤ 100 mmHg. Calculate on ALL patients with suspected infection at triage." },
      { icon:"🔬", label:"SOFA: Respiratory (PF Ratio)", detail:"PaO₂/FiO₂ ≥ 400 = 0pts; 300–399 = 1pt; 200–299 = 2pts; 100–199 + vent = 3pts; < 100 + vent = 4pts. Use ABG. If ABG unavailable: SpO₂/FiO₂ ratio." },
      { icon:"🩸", label:"SOFA: Cardiovascular", detail:"MAP ≥ 70 = 0pts; MAP < 70 = 1pt; Dopamine ≤ 5 or Dobutamine = 2pts; Dopamine 5.1–15 or Epi/NA ≤ 0.1 = 3pts; Dopamine > 15 or Epi/NA > 0.1 = 4pts." },
      { icon:"🧪", label:"SOFA: Renal + Liver + Coagulation", detail:"Renal: creatinine + UO. Liver: bilirubin. Coagulation: platelets. CNS: GCS. All components scored 0–4. Maximum total SOFA = 24." },
    ],
    treatment: [
      { cat:"Screening", drug:"qSOFA at Triage", dose:"All adult patients with suspected infection in ED/ward", note:"Apply immediately on presentation. No labs required. Takes < 30 seconds.", ref:"Level A" },
      { cat:"Assessment", drug:"Full SOFA if qSOFA ≥ 2", dose:"Calculate SOFA at presentation and every 6–12h thereafter", note:"Acute change in SOFA ≥ 2 = sepsis diagnosis. Trend SOFA for prognostication and treatment response.", ref:"Level A" },
      { cat:"Escalation", drug:"ICU Referral Criteria", dose:"SOFA ≥ 2 + suspected infection = activate Sepsis Pathway + ICU/senior review", note:"Do not await SOFA result to initiate Hour-1 Bundle — begin simultaneously.", ref:"Level A" },
    ],
    followup: [
      "Serial SOFA every 6–12h — deteriorating SOFA = escalate care",
      "Lactate clearance target ≥ 10%/h within first 2–4h",
      "UO ≥ 0.5 mL/kg/h is a resuscitation endpoint",
      "Consider POC lactate at triage for all suspected sepsis — reduces time-to-recognition",
    ],
    reference: "Seymour et al. JAMA 2016 (qSOFA derivation); Vincent et al. ICM 1996 (SOFA); SSC 2021",
  },

  hour1_bundle: {
    definition: "The SSC Hour-1 Bundle (2018) replaces the former 3-hour and 6-hour bundles and consolidates five critical actions that should be initiated immediately (within 1 hour) of sepsis or septic shock recognition. Bundle compliance is associated with a 25% relative reduction in hospital mortality. The five elements are: measure lactate, obtain blood cultures, administer broad-spectrum antibiotics, begin fluid resuscitation, and start vasopressors for refractory hypotension.",
    keyCriteria: [
      "1️⃣ Measure serum lactate — repeat if > 2 mmol/L",
      "2️⃣ Obtain blood cultures BEFORE giving antibiotics (do not delay antibiotics > 45 min)",
      "3️⃣ Administer broad-spectrum antibiotics within 1 hour (within 1h of septic shock recognition)",
      "4️⃣ Administer 30 mL/kg IV crystalloid for hypotension (MAP < 65) or lactate ≥ 4 mmol/L",
      "5️⃣ Start vasopressors if MAP < 65 despite initial fluid resuscitation",
      "Document time of recognition, time of each bundle element, responsible provider",
    ],
    workup: [
      { icon:"🩸", label:"Lactate — STAT", detail:"Point-of-care or lab lactate. Target < 2 mmol/L. Lactate ≥ 4 mmol/L = cryptic septic shock regardless of BP. Repeat within 2h if elevated." },
      { icon:"🔬", label:"Blood Cultures × 2 before Antibiotics", detail:"Two sets from separate sites. If central line present, draw 1 from CL + 1 peripheral. Do not delay antibiotics > 45 min for cultures. Each set = aerobic + anaerobic bottle." },
      { icon:"📋", label:"Sepsis Bundle Checklist", detail:"Document: (1) Time sepsis recognised, (2) Lactate drawn, (3) BC drawn, (4) Abx given + which agents, (5) Fluid bolus given + volume, (6) Vasopressors started (if indicated). Timestamp each." },
      { icon:"🫀", label:"Haemodynamic Assessment", detail:"MAP, HR, RR, SpO₂, UO, mental status, skin perfusion (CRT, colour). Repeat after each fluid bolus. Dynamic fluid responsiveness tests if available (PLR, PPV)." },
    ],
    treatment: [
      { cat:"Element 1", drug:"Serum Lactate", dose:"STAT — within first 15 min of recognition", note:"Repeat within 2h if lactate > 2 mmol/L. Target lactate clearance ≥ 10%/h. Lactate ≥ 4 = septic shock by metabolic definition regardless of BP.", ref:"Level A" },
      { cat:"Element 2", drug:"Blood Cultures × 2", dose:"Two sets from two separate sites before antibiotics", note:"Do NOT delay antibiotics more than 45 min to obtain cultures. Cultures should not be a barrier to timely antibiotic administration.", ref:"Level A" },
      { cat:"Element 3", drug:"Broad-Spectrum Antibiotics", dose:"Within 1 hour of recognition — see Antibiotic Selection protocol for agent choice", note:"Cover all likely pathogens based on clinical syndrome, local resistance patterns, and patient risk factors. See Antibiotic De-escalation for streamlining at 48–72h.", ref:"Level A" },
      { cat:"Element 4", drug:"IV Crystalloid — 30 mL/kg", dose:"Balanced crystalloid (Hartmann's / Plasma-Lyte) preferred over NS for MAP < 65 or lactate ≥ 4", note:"Complete within 3h. Reassess after each 500 mL bolus for fluid responsiveness. Stop or slow if pulmonary oedema develops (SpO₂ ↓, crackles).", ref:"Level A" },
      { cat:"Element 5", drug:"Noradrenaline (Vasopressor)", dose:"Start if MAP < 65 after initial fluid bolus: 0.01–0.5 mcg/kg/min — titrate to MAP ≥ 65 mmHg", note:"Peripheral noradrenaline via large-bore IV is safe for up to 24h while central access is established. Do not delay vasopressors waiting for central line.", ref:"Level A" },
    ],
    followup: [
      "Bundle compliance documentation required for quality metrics — timestamp all elements",
      "ICU admission for septic shock — HDU acceptable for sepsis without shock",
      "Reassess volume status and fluid responsiveness every 1–2h during first 6h",
      "Transition from empiric to targeted antibiotics at 48–72h using culture results",
      "Sepsis trigger notification to family with clear communication of diagnosis and prognosis",
    ],
    reference: "SSC Hour-1 Bundle — Levy et al. CCM 2018; SSC International Guidelines 2021",
  },

  fluid_resuscitation: {
    definition: "Fluid resuscitation in sepsis should be guided by dynamic measures of fluid responsiveness rather than static parameters. The SSC 2021 recommends crystalloids as the fluid of choice, with balanced crystalloids (Hartmann's/Plasma-Lyte) preferred over 0.9% saline to reduce hyperchloraemic metabolic acidosis, AKI, and mortality (SMART trial). The initial 30 mL/kg bolus should be given rapidly but reassessed frequently — liberal fluid strategies worsen outcomes.",
    keyCriteria: [
      "Initial bolus: 30 mL/kg IV balanced crystalloid for MAP < 65 or lactate ≥ 4 mmol/L",
      "Balanced crystalloids (Hartmann's/Plasma-Lyte) PREFERRED over 0.9% NaCl — SMART trial (NEJM 2018)",
      "Colloids (albumin) acceptable but NOT superior to crystalloids for initial resuscitation",
      "Assess fluid responsiveness before each subsequent bolus: PLR test, PPV/SVV (ventilated), dynamic echo",
      "Fluid overload is harmful: cumulative positive balance > 5L associated with worse outcomes",
      "Targets: MAP ≥ 65, UO ≥ 0.5 mL/kg/h, lactate clearance ≥ 10%/h, improving mentation",
    ],
    workup: [
      { icon:"💧", label:"Passive Leg Raise (PLR) Test", detail:"Elevate legs 45° for 1 min while maintaining head flat (from 30° HOB). Fluid responder = cardiac output increases ≥ 10% (use echo or pulse pressure). Sensitivity 85%, specificity 91% for preload responsiveness." },
      { icon:"📊", label:"Pulse Pressure Variation (PPV)", detail:"Ventilated patients only (mandatory tidal volume ≥ 8 mL/kg, sinus rhythm). PPV > 13% = fluid responsive. Requires arterial line and mechanically ventilated patient without spontaneous breathing." },
      { icon:"🫀", label:"Bedside Echo — IVC Collapsibility", detail:"IVC collapsibility index > 50% (spontaneous breathing) or distensibility index > 18% (ventilated) predicts fluid responsiveness. Highly operator-dependent — use in conjunction with clinical assessment." },
      { icon:"🩸", label:"Serial Lactate + UO", detail:"Lactate clearance ≥ 10% per hour = adequate resuscitation. UO ≥ 0.5 mL/kg/h = renal perfusion maintained. CRT ≤ 2 sec = peripheral perfusion restored (ANDROMEDA-SHOCK)." },
    ],
    treatment: [
      { cat:"Initial Bolus", drug:"Balanced Crystalloid (Hartmann's / Plasma-Lyte)", dose:"30 mL/kg IV over 30–60 min for MAP < 65 mmHg or lactate ≥ 4 mmol/L", note:"SMART trial: balanced crystalloids reduce composite of death, renal failure, and persistent renal dysfunction vs 0.9% saline (p = 0.01). Complete initial bolus while reassessing.", ref:"Level A" },
      { cat:"Subsequent Boluses", drug:"Fluid Responsiveness Assessment", dose:"PLR test or echo before each subsequent bolus (after initial 30 mL/kg)", note:"Only give additional boluses (250–500 mL) if fluid responsive. Stop if: SpO₂ declining, bilateral crackles, worsening oedema, no haemodynamic response.", ref:"Level A" },
      { cat:"Colloid Option", drug:"Albumin 4–5%", dose:"200–500 mL IV if significant crystalloid volume required (> 3L) or hypoalbuminaemia (albumin < 25 g/L)", note:"SSC: 'suggest' albumin in patients who continue to require substantial crystalloid after initial resuscitation. No mortality benefit vs crystalloid in large RCTs (SAFE trial).", ref:"Level B" },
      { cat:"Avoid", drug:"Hydroxyethyl Starch (HES)", dose:"CONTRAINDICATED in sepsis", note:"HES associated with increased AKI and mortality in sepsis (CHEST, 6S trials). Never use in sepsis or septic shock.", ref:"Level A" },
    ],
    followup: [
      "Fluid balance documentation every 4–8h — target euvolaemia after initial resuscitation",
      "De-resuscitation with diuretics (frusemide 40 mg IV) once haemodynamically stable to remove excess fluid",
      "Weight daily — positive balance > 5L warrants active de-resuscitation",
      "CRRT for AKI with severe fluid overload unresponsive to diuretics",
      "Monitor for pulmonary oedema: daily CXR, SpO₂ trends, respiratory deterioration",
    ],
    reference: "SMART Trial — NEJM 2018; SAFE Trial — NEJM 2004; ANDROMEDA-SHOCK — JAMA 2019; SSC 2021",
  },

  vasopressors: {
    definition: "Vasopressors are indicated when MAP < 65 mmHg persists despite adequate initial fluid resuscitation (30 mL/kg) or if haemodynamic instability is so severe that fluid resuscitation alone cannot restore perfusion pressure rapidly. Noradrenaline is the first-line vasopressor in septic shock. Peripheral administration via large-bore IV is safe for up to 24h while central access is established.",
    keyCriteria: [
      "Noradrenaline is the FIRST-LINE vasopressor — superior to dopamine (SOAP II trial — less arrhythmia, less mortality)",
      "Start peripheral noradrenaline via large-bore IV if central access not immediately available",
      "Target MAP ≥ 65 mmHg — higher MAP (80–85) not superior in most patients (SEPSISPAM trial)",
      "Exception: MAP ≥ 75–80 in chronic severe hypertension — individualise",
      "Vasopressin 0.03 units/min added to reduce noradrenaline dose (VASST trial — noradrenaline-sparing)",
      "Dobutamine for septic cardiomyopathy: low EF + low CO despite adequate preload — NOT routine",
    ],
    workup: [
      { icon:"🫀", label:"Bedside Echo — Cardiac Function", detail:"Assess LV/RV function before starting dobutamine. Septic cardiomyopathy in ~40% of septic shock. Echo-guided vasopressor + inotrope selection improves targeting." },
      { icon:"📊", label:"Arterial Line for MAP Monitoring", detail:"Intra-arterial catheter provides continuous beat-to-beat MAP monitoring. Essential for titrating vasopressors. Insert early — radial preferred. Femoral if radial not feasible." },
      { icon:"🔬", label:"CVP / ScvO₂ Monitoring (Selective)", detail:"Central venous catheter for vasopressor infusion. ScvO₂ < 70% despite MAP > 65 = inadequate cardiac output — consider dobutamine. CVP is a poor predictor of preload (SSC 2021 no longer recommends CVP targets)." },
    ],
    treatment: [
      { cat:"First-Line", drug:"Noradrenaline", dose:"0.01–0.5 mcg/kg/min IV (peripheral large-bore or central) — titrate to MAP ≥ 65 mmHg", note:"SOAP II trial: noradrenaline superior to dopamine for septic shock — lower 28-day mortality, fewer arrhythmias. Start low, titrate up by 0.05 mcg/kg/min every 5–10 min.", ref:"Level A" },
      { cat:"Add-On (Noradrenaline-Sparing)", drug:"Vasopressin", dose:"0.03–0.04 units/min IV continuous infusion (add when NA ≥ 0.25 mcg/kg/min)", note:"VASST trial: vasopressin reduces noradrenaline dose requirement. Fixed dose — do not titrate. Reduces AF incidence. May have renal-protective effects.", ref:"Level A" },
      { cat:"Add-On (Refractory)", drug:"Adrenaline (Epinephrine)", dose:"0.01–0.3 mcg/kg/min IV (third-line, when noradrenaline + vasopressin inadequate)", note:"Increases HR and cardiac output. Elevates lactate (glycogenolysis) — do not use lactate as resuscitation target while on adrenaline.", ref:"Level B" },
      { cat:"Inotrope", drug:"Dobutamine", dose:"2.5–20 mcg/kg/min IV — for septic cardiomyopathy (low EF, low CO, high filling pressures)", note:"CATS trial: do NOT use routinely. Only if: ScvO₂ < 70%, clinical signs of low CO despite MAP ≥ 65. May cause hypotension — ensure adequate MAP before starting.", ref:"Level B" },
      { cat:"Corticosteroids (Adjunct)", drug:"Hydrocortisone 200 mg/day (refractory shock)", dose:"50 mg IV q6h OR 200 mg/24h continuous infusion — see Corticosteroids protocol", note:"Only for vasopressor-refractory septic shock despite adequate fluid and vasopressor therapy.", ref:"Level B" },
    ],
    followup: [
      "Wean vasopressors as MAP improves — reduce by 0.05 mcg/kg/min every 30–60 min if stable",
      "Target MAP ≥ 65 mmHg — titrate to clinical response (mentation, UO, lactate)",
      "Daily echo if on dobutamine — monitor EF recovery (septic cardiomyopathy often reverses at 7–14 days)",
      "Vasopressin: discontinue before noradrenaline weaning (taper NA first, then stop vasopressin last)",
    ],
    reference: "SOAP II — NEJM 2010; VASST — NEJM 2008; SEPSISPAM — NEJM 2014; SSC 2021",
  },

  antibiotic_selection: {
    definition: "Empiric antibiotic therapy in sepsis should cover all likely causative pathogens based on the clinical syndrome, likely source, local resistance patterns, patient risk factors (immunosuppression, prior resistant organisms, recent healthcare exposure), and allergy history. Combination therapy is recommended for septic shock. The goal is 'appropriate empiric therapy' — pathogen-directed de-escalation at 48–72h after culture results.",
    keyCriteria: [
      "Administer within 1 hour — each hour of delay increases mortality by ~7%",
      "Broad-spectrum empiric coverage based on most likely source + local antibiogram",
      "Combination therapy recommended for septic shock (add second agent for Gram-negative coverage)",
      "Anti-MRSA coverage (vancomycin/linezolid) if: skin/soft tissue, known MRSA, catheter-related",
      "Anti-fungal (micafungin) if: immunosuppressed, prolonged ICU + broad-spectrum Abx > 7 days, Candida colonisation",
      "Dose optimisation: use PK/PD principles — extended infusions for beta-lactams to maximise time > MIC",
    ],
    workup: [
      { icon:"🔬", label:"Blood Cultures × 2 (BEFORE antibiotics)", detail:"Two peripheral sets. If suspected catheter-related BSI: 1 from CL + 1 peripheral. Volume per set: 8–10 mL aerobic + 8–10 mL anaerobic. Incubation 5 days." },
      { icon:"🧪", label:"Source-Specific Cultures", detail:"Urine MCS (MSU or catheter specimen), sputum MCS (intubated: BAL or deep suction), wound swab, CSF (LP if meningitis suspected), pleural fluid, peritoneal fluid." },
      { icon:"📊", label:"PCT + CRP (Baseline)", detail:"Procalcitonin and CRP at baseline. PCT ≥ 0.5 mcg/L = likely bacterial infection. PCT-guided de-escalation reduces antibiotic duration without increasing mortality (PRORATA trial)." },
      { icon:"🏥", label:"Local Antibiogram Review", detail:"Review hospital/ICU antibiogram for prevalence of resistant organisms. Adjust empiric coverage if: recent hospitalisation, recent antibiotics, known resistant colonisation (ESBL, MRSA, CPE)." },
    ],
    treatment: [
      { cat:"Sepsis — Community (No Risk Factors)", drug:"Piperacillin-Tazobactam", dose:"4.5g IV q6h (or 3.375g q4h for severe sepsis) — extended 4h infusion for PK optimisation", note:"Covers most Gram-positive, Gram-negative, and anaerobes. First-choice for community-onset sepsis without immunosuppression or healthcare exposure.", ref:"Level A" },
      { cat:"Septic Shock — Broad Cover", drug:"Meropenem OR Imipenem", dose:"Meropenem 1–2g IV q8h (extended 3h infusion). Imipenem 500mg–1g IV q6h", note:"Reserve carbapenems for: shock, immunosuppression, healthcare-acquired sepsis, known resistant organisms, failed beta-lactam therapy. Antimicrobial stewardship essential.", ref:"Level A" },
      { cat:"Add-On — MRSA Cover", drug:"Vancomycin", dose:"25–30 mg/kg IV loading dose → AUC/MIC-guided dosing (target AUC 400–600 mg·h/L)", note:"Indication: suspected MRSA (SSTI, healthcare exposure, known MRSA carrier, catheter-related BSI). Use AUC/MIC monitoring (not trough-only) per 2020 ASHP/IDSA guidelines.", ref:"Level A" },
      { cat:"Add-On — Antifungal", drug:"Micafungin (Echinocandin)", dose:"100 mg IV daily (150 mg for Candida glabrata)", note:"Indications: immunocompromised + septic shock, Candida colonisation of ≥ 2 sites, prolonged ICU + broad-spectrum Abx > 7 days, abdominal perforation/pancreatitis. Do not use fluconazole for C. glabrata or C. krusei.", ref:"Level B" },
      { cat:"Urosepsis", drug:"Ceftriaxone ± Gentamicin", dose:"Ceftriaxone 2g IV daily OR Gentamicin 5–7 mg/kg IV daily (single daily dosing)", note:"Uncomplicated urosepsis: ceftriaxone monotherapy. Complicated/healthcare-associated: add gentamicin or escalate to pip-tazo. Always send MSU before antibiotics.", ref:"Level A" },
      { cat:"Meningococcal / Meningitis", drug:"Ceftriaxone + Dexamethasone", dose:"Ceftriaxone 2g IV q12h + Dexamethasone 0.15 mg/kg IV q6h × 4 days", note:"Start dexamethasone before or with first antibiotic dose. Reduces meningitis morbidity (hearing loss, neurological deficit). Cover HSV with aciclovir if encephalitis not excluded.", ref:"Level A" },
    ],
    followup: [
      "Review cultures and sensitivities at 48–72h — de-escalate to narrowest effective agent",
      "Procalcitonin trend: rising PCT at 48–72h = treatment failure / uncontrolled source",
      "Target antibiotic duration: 7–10 days for most sepsis syndromes. Shorter courses acceptable if rapid clinical response",
      "ID/Pharmacy consult for: fungal infections, resistant organisms, complex PK, renal dose adjustment",
      "Antibiotic drug levels: vancomycin AUC monitoring, aminoglycoside peak/trough",
    ],
    reference: "SSC 2021; IDSA Antimicrobial Stewardship Guidelines 2016; PRORATA Trial 2010",
  },

  deescalation: {
    definition: "Antibiotic de-escalation is the practice of narrowing empiric broad-spectrum antibiotics to the most targeted regimen based on culture results, clinical response, and biomarker trends. SSC 2021 strongly recommends de-escalation — it reduces selection pressure for resistance, drug toxicity, C. difficile risk, and costs without worsening clinical outcomes.",
    keyCriteria: [
      "Review cultures and sensitivities daily from 48h — de-escalate as soon as clinically appropriate",
      "Procalcitonin-guided discontinuation reduces antibiotic duration without increasing mortality (PRORATA, SAPS)",
      "Target PCT reduction: PCT ≤ 0.5 mcg/L OR > 80% decrease from peak = consider stopping antibiotics",
      "Total antibiotic duration most sepsis syndromes: 7–10 days",
      "Shorter courses (5–7 days): uncomplicated urosepsis, CAP, SSTI without bacteraemia",
      "No de-escalation for: fungal infections, endocarditis, prosthetic joint infection, osteomyelitis, TB",
    ],
    workup: [
      { icon:"📊", label:"Serial Procalcitonin", detail:"PCT at 0, 48h, 72h, then every 48h. Target: PCT ≤ 0.5 mcg/L or reduction ≥ 80% from peak = consider antibiotics discontinuation. PCT-guided strategy reduces duration by ~2 days without harm." },
      { icon:"🔬", label:"48–72h Culture Review", detail:"Review all culture results. Identify organism, sensitivities, and resistance pattern. Confirm appropriate coverage. Identify opportunities to narrow spectrum." },
      { icon:"🩺", label:"Clinical Response Assessment", detail:"Fever trend, WBC trend, haemodynamic stability, organ function trend. If clinically improving at 48–72h with cultures + sensitivities available = de-escalate." },
    ],
    treatment: [
      { cat:"De-escalation Strategy", drug:"Narrow-Spectrum Agent (per culture)", dose:"Step down to narrowest agent covering confirmed/likely organism based on sensitivities", note:"E.g. Pip-tazo → Cefuroxime (MSSA BSI); Meropenem → Ceftriaxone (ESBL-negative E. coli UTI); Vancomycin → Flucloxacillin (MSSA). Always use narrowest agent.", ref:"Level A" },
      { cat:"PCT-Guided Stop", drug:"Procalcitonin-Guided Discontinuation", dose:"Stop antibiotics when PCT ≤ 0.5 mcg/L OR ≥ 80% reduction from peak AND clinical improvement", note:"PRORATA trial: PCT-guided group received fewer antibiotic-days (10.3 vs 13.3) with equivalent 28-day mortality and 90-day mortality.", ref:"Level A" },
      { cat:"IV to PO Step-Down", drug:"Oral Step-Down (IDSA Criteria)", dose:"Step down to PO when: tolerating oral intake, GI absorption intact, systemic features resolving, no source requiring IV (endocarditis, meningitis, osteomyelitis)", note:"IV-to-PO step-down reduces duration of IV access, line-related infection risk, and length of stay. Many serious infections can complete treatment orally.", ref:"Level B" },
    ],
    followup: [
      "Total treatment duration document in medical record with rationale",
      "Stewardship team review for all courses > 7 days",
      "Repeat blood cultures at 2–4 days for Staph aureus bacteraemia — mandatory to confirm clearance",
      "Echo for S. aureus bacteraemia: rule out endocarditis if persistent bacteraemia > 48–72h",
      "Outpatient parenteral antibiotics (OPAT) for conditions requiring extended IV therapy",
    ],
    reference: "PRORATA Trial — Lancet 2010; IDSA Stewardship Guidelines 2016; SSC 2021",
  },

  ventilation: {
    definition: "Sepsis-associated ARDS develops in ~40% of septic shock patients. Lung-protective ventilation (LPV) with low tidal volumes (6 mL/kg IBW) and limited plateau pressure reduces mortality by 22% compared with conventional ventilation (ARDSNet). The SSC 2021 recommends LPV as standard of care in all mechanically ventilated sepsis patients with ARDS.",
    keyCriteria: [
      "Tidal volume 6 mL/kg IBW (ideal body weight) — use IBW not actual weight",
      "Plateau pressure ≤ 30 cmH₂O — reduce tidal volume further if Pplat > 30",
      "PEEP: titrate with FiO₂ per ARDS Network low-PEEP table (or high-PEEP in moderate-severe ARDS)",
      "Prone positioning ≥ 16 hours/day for P/F ratio < 150 (PROSEVA trial — 28-day mortality 16% vs 33%)",
      "HFNC before intubation if SpO₂ < 92% on high-flow mask O₂ — trial HFNC up to 1–2h if improving",
      "Avoid hyperoxia: target SpO₂ 92–96% — PaO₂ 55–80 mmHg",
    ],
    workup: [
      { icon:"🫁", label:"ABG + P/F Ratio (Berlin Criteria)", detail:"Mild ARDS: P/F 201–300 with PEEP ≥ 5. Moderate: P/F 101–200. Severe: P/F ≤ 100. Calculate IBW for TV target: male: 50 + 0.91(ht cm – 152.4); female: 45.5 + 0.91(ht cm – 152.4)." },
      { icon:"🩻", label:"CXR / CT Chest", detail:"Bilateral infiltrates not fully explained by effusions, lobar/lung collapse, or nodules. Exclude hydrostatic oedema (ECHO for PCWP). ARDS is non-cardiogenic — use echo to differentiate." },
      { icon:"📊", label:"Lung Compliance (Cstat)", detail:"Cstat = TV / (Pplat – PEEP). Normal > 50 mL/cmH₂O. ARDS Cstat typically 20–40. Lower Cstat = stiffer lungs = need lower TV. Drive pressure (Pplat – PEEP) ≤ 14 cmH₂O target." },
    ],
    treatment: [
      { cat:"Lung-Protective Ventilation", drug:"Low Tidal Volume", dose:"6 mL/kg IBW. If Pplat > 30 cmH₂O → reduce to 4 mL/kg IBW. Allow permissive hypercapnia (PaCO₂ up to 55–60 mmHg)", note:"ARDSNet trial (NEJM 2000): 6 vs 12 mL/kg — 22% relative mortality reduction. Foundational evidence for LPV. Use IBW (not actual body weight) for calculation.", ref:"Level A" },
      { cat:"PEEP Optimisation", drug:"PEEP Titration (Low vs High PEEP Table)", dose:"Moderate-severe ARDS (P/F < 200): consider higher PEEP strategy (10–18 cmH₂O) guided by oxygenation and Pplat", note:"No universal optimal PEEP. Meta-analyses suggest higher PEEP benefits patients with P/F < 200. Titrate incrementally (2 cmH₂O steps) while monitoring haemodynamics.", ref:"Level B" },
      { cat:"Prone Positioning", drug:"Prone Positioning ≥ 16 h/day", dose:"For P/F < 150 (moderate-severe ARDS) — rotate to prone position", note:"PROSEVA trial: prone vs supine — 28-day mortality 16% vs 33% (p < 0.001). Start within 36h of diagnosis. Requires dedicated trained team. Monitor pressure points, ETT position.", ref:"Level A" },
      { cat:"Neuromuscular Blockade", drug:"Cisatracurium (48h) — Severe ARDS", dose:"168 mg/day IV for 48h (ACURASYS protocol) in P/F < 150 on PEEP ≥ 5 with FiO₂ ≥ 0.6", note:"ACURASYS: NMB vs placebo — 90-day mortality benefit. ROSE trial did not replicate — conditional recommendation. Use if: severe dyssynchrony, severe hypoxaemia, raised ICP.", ref:"Level B" },
      { cat:"Corticosteroids", drug:"Methylprednisolone (Fibroproliferative Phase)", dose:"1 mg/kg/day IV (Day 5–14 ARDS) if no improvement on LPV + prone", note:"LaSRS trial, CAPE COD trial: modest oxygenation improvement. SSC 2021: conditional recommendation. Taper over 14 days — do not stop abruptly.", ref:"Level B" },
    ],
    followup: [
      "Daily SBT (spontaneous breathing trial) when: FiO₂ ≤ 0.4, PEEP ≤ 8, no vasopressors, responsive, adequate cough",
      "Spontaneous awakening trial (SAT) daily — aSAT + aBT bundle reduces ventilator days and ICU length of stay",
      "Document lung mechanics daily: TV, Pplat, PEEP, driving pressure, compliance, P/F ratio",
      "Physical therapy from Day 1 — early mobilisation reduces post-ICU weakness",
      "Post-ICU follow-up for PICS (Post-Intensive Care Syndrome) — cognitive, functional, psychological",
    ],
    reference: "ARDSNet — NEJM 2000; PROSEVA — NEJM 2013; ROSE — NEJM 2019; SSC 2021",
  },

  corticosteroids: {
    definition: "Low-dose hydrocortisone (200 mg/day) is recommended by SSC 2021 for vasopressor-dependent septic shock refractory to adequate fluid resuscitation and vasopressor therapy. The mechanism is partial correction of relative adrenal insufficiency (critical illness-related corticosteroid insufficiency — CIRCI). The ADRENAL and APROCCHSS trials show shorter time to shock reversal but no consistent mortality benefit.",
    keyCriteria: [
      "Indication: Noradrenaline OR adrenaline ≥ 0.25 mcg/kg/min for ≥ 4h despite adequate resuscitation",
      "Dose: Hydrocortisone 200 mg/day (50 mg IV q6h OR 200 mg/day continuous infusion)",
      "Do NOT use ACTH stimulation test to guide corticosteroid use — SSC 2021",
      "Do NOT use dexamethasone as substitute — mineralocorticoid activity of hydrocortisone is required",
      "Wean hydrocortisone when vasopressors are weaned — do not stop abruptly",
      "Fludrocortisone 50 mcg PO daily optional (APROCCHSS trial used combination)",
    ],
    workup: [
      { icon:"📊", label:"Vasopressor Dose Assessment", detail:"Confirm: noradrenaline or adrenaline ≥ 0.25 mcg/kg/min maintained for ≥ 4h despite adequate fluid resuscitation (30 mL/kg) and ongoing septic shock. Vasopressor threshold for steroid initiation." },
      { icon:"🩸", label:"Random Cortisol (Optional)", detail:"SSC 2021: ACTH stimulation test NOT recommended to guide steroid use. If clinical suspicion of primary adrenal insufficiency (hyperpigmentation, adrenal metastases, prior steroid use): random cortisol < 276 nmol/L suggests insufficiency." },
      { icon:"🧪", label:"Blood Glucose Monitoring", detail:"Corticosteroids cause hyperglycaemia. Monitor BSL every 1–2h initially. Maintain BSL 6–10 mmol/L with insulin infusion protocol. Avoid hypoglycaemia (BSL < 4 mmol/L)." },
    ],
    treatment: [
      { cat:"Vasopressor-Refractory Shock", drug:"Hydrocortisone 200 mg/day", dose:"50 mg IV q6h OR 200 mg/24h continuous infusion — start when NA ≥ 0.25 mcg/kg/min × 4h", note:"ADRENAL trial (n=3800): hydrocortisone vs placebo — faster shock reversal (3 vs 4 days) but no 90-day mortality benefit. APROCCHSS: combination hydrocortisone + fludrocortisone improved 90-day mortality.", ref:"Level B" },
      { cat:"Optional Add-On", drug:"Fludrocortisone 50 mcg PO/NG daily", dose:"50 mcg PO/NG once daily alongside hydrocortisone", note:"APROCCHSS trial used this combination — 90-day mortality: 43% vs 49% (p = 0.03). SSC 2021: conditional recommendation only. Not universally adopted.", ref:"Level B" },
      { cat:"Weaning", drug:"Hydrocortisone Taper", dose:"Begin taper once noradrenaline ≤ 0.1 mcg/kg/min. Reduce to 50 mg IV q8h × 24h → 50 mg q12h × 24h → stop", note:"Do NOT abruptly stop hydrocortisone — may precipitate rebound hypotension. Stepwise taper as vasopressors are weaned. Stop after vasopressors discontinued.", ref:"Level B" },
    ],
    followup: [
      "Monitor for steroid-related complications: hyperglycaemia, new infections, GI bleeding, neuromuscular weakness",
      "Stress dose steroids for surgical interventions during steroid therapy",
      "If weaning fails (return of shock on dose reduction): restart at full dose and attempt taper again after further stabilisation",
      "Endocrinology consult if suspected primary adrenal insufficiency (bilateral adrenal haemorrhage, metastases)",
    ],
    reference: "ADRENAL Trial — NEJM 2018; APROCCHSS Trial — NEJM 2018; SSC 2021",
  },

  source_control: {
    definition: "Source control is the definitive treatment for sepsis — all pharmacological interventions are supportive until the infection source is controlled. SSC 2021 recommends identifying the anatomic source of infection and initiating appropriate source control measures within 6–12 hours of diagnosis. The least invasive effective intervention should be used first (percutaneous drainage preferred over surgery where feasible).",
    keyCriteria: [
      "Source control within 6–12 hours of diagnosis — the shorter the delay, the better the outcome",
      "Identify source: clinical exam, cultures, imaging (USS, CT, PET-CT)",
      "Drain-able collections: percutaneous drainage under USS/CT guidance preferred over surgical drainage",
      "Infected foreign material (lines, prosthetics, implants) should be removed if feasible",
      "Surgical source control: intestinal perforation, necrotising fasciitis, gangrenous cholecystitis, ischaemic bowel",
      "Necrotising fasciitis: surgical emergency — mortality increases 30% for each 12h delay to OR",
    ],
    workup: [
      { icon:"📡", label:"Clinical Source Assessment", detail:"Systematic clinical exam: skin/SSTI, respiratory (pneumonia), urinary (flank pain, dysuria), abdomen (peritonism, guarding), CNS (meningism), vascular access sites (erythema, purulence). Document suspected source at time of diagnosis." },
      { icon:"🩻", label:"CT Imaging (Chest/Abdomen/Pelvis)", detail:"Haemodynamically stable patients: CT with IV contrast for occult source. Sensitivity > 90% for abdominal collection, pneumonia, empyema, pyelonephritis. Immediate CT if source unclear in septic shock." },
      { icon:"📡", label:"USS Abdomen / Pelvis", detail:"First-line for RUQ pathology (cholecystitis, cholangitis, liver abscess), renal abscess. Safer in unstable patients (no contrast, portable). Lower sensitivity than CT for retroperitoneal collections." },
      { icon:"🔬", label:"Source-Specific Cultures", detail:"Always collect appropriate cultures before drainage. Intraoperative swabs, BAL, pleural fluid, ascites, CSF — all provide sensitivity data to guide de-escalation." },
    ],
    treatment: [
      { cat:"Percutaneous Drainage", drug:"USS/CT-Guided Drainage", dose:"Preferred for: intra-abdominal abscess, empyema, liver abscess, psoas abscess, pericardial effusion. IR (interventional radiology) placement.", note:"Least invasive source control method. Appropriate when discrete collection identifiable on imaging. Drain output should decrease over 3–5 days. Remove when < 10 mL/day.", ref:"Level A" },
      { cat:"Endoscopic", drug:"ERCP + Biliary Stenting / Sphincterotomy", dose:"For acute cholangitis with biliary obstruction — within 24h of diagnosis if no rapid improvement", note:"Tokyo Guidelines 2018: Grade II–III cholangitis requires urgent ERCP. Biliary decompression is life-saving. Cholecystectomy deferred to elective setting after recovery.", ref:"Level A" },
      { cat:"Surgical", drug:"Emergency Laparotomy / Source Washout", dose:"Immediate for: intestinal perforation, gangrenous bowel, perforation peritonitis, ischaemia", note:"Damage control laparotomy in physiologically compromised patients (pH < 7.2, coagulopathy) — pack and return for reconstruction. See Trauma Hub DCS protocol.", ref:"Level A" },
      { cat:"Line Removal", drug:"Infected Vascular Catheter Removal", dose:"Remove infected CVC/arterial line and re-site at new location within 24h of suspected CLABSI", note:"Guidewire exchange NOT recommended for CLABSI — always re-site at new location. Catheter tip culture mandatory. Consider extended antibiotic duration if tunnel/port infection.", ref:"Level A" },
      { cat:"Necrotising Fasciitis", drug:"Emergency Surgical Debridement", dose:"IMMEDIATE to OR — do not delay for imaging if clinical diagnosis is made", note:"Mortality increases ~30% for each 12h delay. Wide debridement to bleeding tissue. Return every 24–48h for re-look until clean margins. Plastic surgery for reconstruction.", ref:"Level A" },
    ],
    followup: [
      "Reassess source control adequacy at 24–48h — if not improving, repeat imaging and consider additional intervention",
      "Follow-up imaging at 48–72h for percutaneous drains — confirm position and response",
      "All surgical specimens to pathology + intraoperative cultures for targeted therapy",
      "Multidisciplinary review for complex source control decisions (ID + surgery + IR + ICU)",
      "Necrotising fasciitis: plastic surgery consult for wound reconstruction planning after control achieved",
    ],
    reference: "SSC 2021; Tokyo Guidelines 2018 (Cholangitis); IDSA Soft Tissue Infection Guidelines 2014",
  },
};

// ════════════════════════════════════════════════════════════
//  SHARED DESIGN TOKENS
// ════════════════════════════════════════════════════════════
const T = {
  bg:"#050f1e", txt:"#e8f0fe", txt2:"#8aaccc", txt3:"#4a6a8a", txt4:"#2e4a6a",
  border:"rgba(26,53,85,0.8)", borderHi:"rgba(42,79,122,0.9)",
  coral:"#ff6b6b", gold:"#f5c842", teal:"#00e5c0", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff",
};
const AC = HUB_CONFIG.accentColor;

// ════════════════════════════════════════════════════════════
//  SHARED UI COMPONENTS
// ════════════════════════════════════════════════════════════
function GlassBg() {
  const orbs = [
    { x:"9%",  y:"16%", r:300, c:`${AC}09` },
    { x:"87%", y:"11%", r:250, c:`rgba(155,109,255,0.05)` },
    { x:"79%", y:"79%", r:330, c:`rgba(255,107,107,0.05)` },
    { x:"17%", y:"83%", r:210, c:`${AC}07` },
    { x:"50%", y:"46%", r:390, c:`rgba(59,158,255,0.03)` },
  ];
  return (
    <div style={{ position:"fixed", inset:0, overflow:"hidden", pointerEvents:"none", zIndex:0 }}>
      {orbs.map((o, i) => (
        <div key={i} style={{ position:"absolute", left:o.x, top:o.y, width:o.r*2, height:o.r*2, borderRadius:"50%", background:`radial-gradient(circle,${o.c} 0%,transparent 68%)`, transform:"translate(-50%,-50%)", animation:`sg${i%3} ${8+i*1.3}s ease-in-out infinite` }}/>
      ))}
      <svg width="100%" height="100%" style={{ position:"absolute", inset:0, opacity:0.036 }}>
        <defs>
          <pattern id="sgg" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0L0 0 0 40" fill="none" stroke={AC} strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#sgg)"/>
      </svg>
      <style>{`
        @keyframes sg0{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-50%) scale(1.12)}}
        @keyframes sg1{0%,100%{transform:translate(-50%,-50%) scale(1.08)}50%{transform:translate(-50%,-50%) scale(0.9)}}
        @keyframes sg2{0%,100%{transform:translate(-50%,-50%) scale(0.95)}50%{transform:translate(-50%,-50%) scale(1.1)}}
      `}</style>
    </div>
  );
}

function GBox({ children, style = {} }) {
  return (
    <div style={{ background:"rgba(8,22,40,0.7)", backdropFilter:"blur(22px)", WebkitBackdropFilter:"blur(22px)", border:`1px solid ${T.border}`, borderRadius:16, boxShadow:"0 4px 20px rgba(0,0,0,0.38),inset 0 1px 0 rgba(255,255,255,0.025)", ...style }}>
      {children}
    </div>
  );
}

function EvidenceBadge({ level }) {
  const map = {
    "Level A": { bg:"rgba(0,229,192,0.12)", br:"rgba(0,229,192,0.4)", c:"#00e5c0" },
    "Level B": { bg:"rgba(59,158,255,0.12)", br:"rgba(59,158,255,0.4)", c:"#3b9eff" },
    "Level C": { bg:"rgba(245,200,66,0.1)",  br:"rgba(245,200,66,0.4)",  c:"#f5c842" },
  };
  const s = map[level] || { bg:"rgba(155,109,255,0.1)", br:"rgba(155,109,255,0.3)", c:"#9b6dff" };
  return (
    <span style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, padding:"2px 7px", borderRadius:20, background:s.bg, border:`1px solid ${s.br}`, color:s.c, whiteSpace:"nowrap" }}>
      {level}
    </span>
  );
}

function TimeBanner() {
  return (
    <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
      {TIME_TARGETS.map((t, i) => (
        <div key={i} style={{ flex:"1 1 150px", background:"rgba(8,22,40,0.7)", border:`1px solid ${T.border}`, borderRadius:10, padding:"9px 13px", display:"flex", alignItems:"center", gap:9, backdropFilter:"blur(12px)" }}>
          <span style={{ fontSize:18 }}>{t.icon}</span>
          <div>
            <div style={{ fontSize:10, color:T.txt3 }}>{t.label}</div>
            <div style={{ fontSize:13, fontWeight:700, color:t.color, fontFamily:"'JetBrains Mono',monospace" }}>{t.target}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function WorkupItem({ item, checked, onToggle }) {
  return (
    <div onClick={onToggle} style={{ display:"grid", gridTemplateColumns:"32px 1fr", gap:10, alignItems:"center", background:checked?`${AC}08`:"rgba(14,37,68,0.45)", border:`1px solid ${checked?`${AC}35`:T.border}`, borderRadius:9, padding:"9px 12px", cursor:"pointer", transition:"all .18s", backdropFilter:"blur(8px)", marginBottom:6 }}>
      <div style={{ width:28, height:28, borderRadius:8, background:checked?`${AC}18`:"rgba(59,158,255,0.08)", border:`1px solid ${checked?`${AC}45`:"rgba(59,158,255,0.25)"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>
        {checked ? "✓" : item.icon}
      </div>
      <div>
        <div style={{ fontSize:12, fontWeight:600, color:checked?AC:T.txt, textDecoration:checked?"line-through":"none" }}>{item.label}</div>
        <div style={{ fontSize:11, color:T.txt3, marginTop:2, lineHeight:1.4 }}>{item.detail}</div>
      </div>
    </div>
  );
}

function DrugRow({ rx }) {
  return (
    <div style={{ background:"rgba(14,37,68,0.5)", border:`1px solid ${T.border}`, borderRadius:9, padding:"9px 13px", marginBottom:5, backdropFilter:"blur(8px)" }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8, marginBottom:rx.note?4:0 }}>
        <div>
          <span style={{ fontSize:12, fontWeight:700, color:T.txt }}>{rx.drug}</span>
          {rx.cat && <span style={{ fontSize:10, marginLeft:8, color:T.txt3 }}>{rx.cat}</span>}
        </div>
        {rx.ref && <EvidenceBadge level={rx.ref}/>}
      </div>
      <div style={{ fontSize:12, color:T.txt2, fontFamily:"'JetBrains Mono',monospace", lineHeight:1.5, marginBottom:rx.note?4:0 }}>{rx.dose}</div>
      {rx.note && <div style={{ fontSize:10, color:T.txt3, lineHeight:1.4 }}>{rx.note}</div>}
    </div>
  );
}

function SectionHeader({ icon, title, sub }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16, paddingBottom:12, borderBottom:`1px solid ${T.border}` }}>
      <span style={{ fontSize:18 }}>{icon}</span>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:14, fontWeight:700, color:T.txt }}>{title}</div>
        {sub && <div style={{ fontSize:11, color:T.txt3, marginTop:1 }}>{sub}</div>}
      </div>
      <span style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, padding:"3px 10px", borderRadius:20, background:`${AC}12`, border:`1px solid ${AC}30`, color:AC }}>
        SSC-Based
      </span>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  CONDITION PAGE
// ════════════════════════════════════════════════════════════
function ConditionPage({ condition, onBack, contentMap }) {
  const data = contentMap?.[condition.id] || CLINICAL_DATA[condition.id] || {};
  const [tab, setTab] = useState("overview");
  const [checked, setChecked] = useState({});

  const TABS = [
    { id:"overview",  label:"Overview",  icon:"📋" },
    { id:"workup",    label:"Workup",    icon:"✅" },
    { id:"treatment", label:"Treatment", icon:"💊" },
    { id:"followup",  label:"Follow-up", icon:"📅" },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <GBox style={{ padding:"18px 22px", position:"relative", overflow:"hidden", borderLeft:`3px solid ${condition.color}` }}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:2, borderRadius:"16px 16px 0 0", background:`linear-gradient(90deg,${condition.color},transparent)` }}/>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <button onClick={onBack} style={{ background:"rgba(26,53,85,0.6)", border:`1px solid ${T.borderHi}`, borderRadius:8, padding:"5px 12px", color:T.txt3, fontSize:11, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", backdropFilter:"blur(8px)", flexShrink:0 }}>← Back</button>
          <div style={{ width:52, height:52, borderRadius:14, background:condition.glass.replace("0.07","0.28"), border:`1px solid ${condition.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, flexShrink:0 }}>{condition.icon}</div>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:4 }}>
              <span style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, color:T.txt, lineHeight:1 }}>{condition.title}</span>
              <span style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, padding:"2px 8px", borderRadius:20, background:`${condition.color}14`, border:`1px solid ${condition.color}35`, color:condition.color }}>{condition.acog}</span>
            </div>
            <div style={{ fontSize:12, color:T.txt3 }}>{condition.subtitle}</div>
          </div>
          <div style={{ textAlign:"center", background:"rgba(14,37,68,0.6)", borderRadius:10, padding:"8px 14px", border:`1px solid ${T.border}`, flexShrink:0 }}>
            <div style={{ fontSize:9, color:T.txt4, textTransform:"uppercase", letterSpacing:".06em", marginBottom:2 }}>Incidence</div>
            <div style={{ fontSize:11, fontWeight:700, color:condition.color, fontFamily:"'JetBrains Mono',monospace" }}>{condition.incidence}</div>
          </div>
        </div>
      </GBox>

      <div style={{ display:"flex", gap:4, background:"rgba(8,22,40,0.7)", border:`1px solid ${T.border}`, borderRadius:12, padding:4, backdropFilter:"blur(14px)" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 16px", borderRadius:9, fontSize:12, fontWeight:tab===t.id?700:500, fontFamily:"'DM Sans',sans-serif", cursor:"pointer", whiteSpace:"nowrap", transition:"all .2s", background:tab===t.id?condition.glass.replace("0.07","0.22"):"transparent", border:tab===t.id?`1px solid ${condition.border}`:"1px solid transparent", color:tab===t.id?condition.color:T.txt3 }}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      <GBox style={{ padding:"20px 22px" }}>
        {tab === "overview" && (
          <div>
            <SectionHeader icon="📋" title="Clinical Overview" sub={condition.title}/>
            <div style={{ background:condition.glass.replace("0.07","0.14"), border:`1px solid ${condition.border}`, borderRadius:10, padding:"13px 16px", marginBottom:16, backdropFilter:"blur(8px)" }}>
              <div style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace", color:condition.accent, textTransform:"uppercase", letterSpacing:".08em", marginBottom:6 }}>Definition</div>
              <div style={{ fontSize:13, color:T.txt2, lineHeight:1.65 }}>{data.definition || "—"}</div>
            </div>
            {data.keyCriteria && data.keyCriteria.length > 0 && (
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:11, fontWeight:700, color:T.coral, marginBottom:8 }}>🚨 Key Criteria</div>
                {data.keyCriteria.map((c, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:8, marginBottom:6, fontSize:12, color:T.txt2 }}>
                    <span style={{ color:T.coral, flexShrink:0, marginTop:1 }}>▸</span>{c}
                  </div>
                ))}
              </div>
            )}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
              {[
                { label:"Incidence",             value:condition.incidence, color:condition.color },
                { label:"Clinical Significance",  value:condition.severity,  color:T.coral },
              ].map((s, i) => (
                <div key={i} style={{ background:"rgba(14,37,68,0.5)", border:`1px solid ${T.border}`, borderRadius:10, padding:"12px 14px", backdropFilter:"blur(8px)" }}>
                  <div style={{ fontSize:9, color:T.txt4, textTransform:"uppercase", letterSpacing:".07em", marginBottom:6 }}>{s.label}</div>
                  <div style={{ fontSize:12, fontWeight:700, color:s.color, lineHeight:1.35 }}>{s.value}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize:10, color:T.txt4, fontFamily:"'JetBrains Mono',monospace", padding:"10px 13px", background:"rgba(14,37,68,0.4)", borderRadius:8, border:`1px solid ${T.border}`, lineHeight:1.7 }}>
              📚 {data.reference || "Reference pending"}
            </div>
          </div>
        )}

        {tab === "workup" && (
          <div>
            <SectionHeader icon="✅" title="Workup Checklist" sub="Tap items to mark complete"/>
            {(data.workup || []).map((item, i) => (
              <WorkupItem key={i} item={item} checked={!!checked[`w${i}`]} onToggle={() => setChecked(p => ({ ...p, [`w${i}`]: !p[`w${i}`] }))}/>
            ))}
            {(!data.workup || data.workup.length === 0) && <div style={{ color:T.txt3, fontSize:12, textAlign:"center", padding:"24px 0" }}>No workup items defined.</div>}
          </div>
        )}

        {tab === "treatment" && (
          <div>
            <SectionHeader icon="💊" title="Treatment Protocol" sub="Evidence-based management"/>
            <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:14 }}>
              {[
                { l:"Level A", d:"Strong evidence — consistent RCTs",       c:"rgba(0,229,192,0.9)" },
                { l:"Level B", d:"Moderate evidence — limited/inconsistent", c:"rgba(59,158,255,0.9)" },
                { l:"Level C", d:"Weak — consensus / expert opinion",         c:"rgba(245,200,66,0.9)" },
              ].map((e, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:5, fontSize:10, color:e.c }}>
                  <span style={{ width:10, height:10, borderRadius:2, background:`${e.c}20`, border:`1px solid ${e.c}40` }}/>
                  {e.l}: <span style={{ color:T.txt3 }}>{e.d}</span>
                </div>
              ))}
            </div>
            {(data.treatment || []).map((rx, i) => <DrugRow key={i} rx={rx}/>)}
            {(!data.treatment || data.treatment.length === 0) && <div style={{ color:T.txt3, fontSize:12, textAlign:"center", padding:"24px 0" }}>No treatment entries defined.</div>}
          </div>
        )}

        {tab === "followup" && (
          <div>
            <SectionHeader icon="📅" title="Follow-up & Disposition" sub="Post-acute care, monitoring, de-escalation"/>
            <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
              {(data.followup || []).map((f, i) => (
                <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:10, background:"rgba(14,37,68,0.45)", border:`1px solid ${T.border}`, borderRadius:9, padding:"10px 13px", backdropFilter:"blur(8px)" }}>
                  <div style={{ width:26, height:26, borderRadius:7, background:condition.glass.replace("0.07","0.22"), border:`1px solid ${condition.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:condition.color, fontWeight:700, flexShrink:0 }}>{i + 1}</div>
                  <div style={{ fontSize:12, color:T.txt2, lineHeight:1.55 }}>{f}</div>
                </div>
              ))}
              {(!data.followup || data.followup.length === 0) && <div style={{ color:T.txt3, fontSize:12, textAlign:"center", padding:"24px 0" }}>No follow-up items defined.</div>}
            </div>
            <div style={{ marginTop:16, fontSize:10, color:T.txt4, fontFamily:"'JetBrains Mono',monospace", padding:"10px 13px", background:"rgba(14,37,68,0.4)", borderRadius:8, border:`1px solid ${T.border}`, lineHeight:1.7 }}>
              ⚠ Clinical decision support only — final management decisions rest with the treating physician<br/>
              📚 {data.reference || "Reference pending"}
            </div>
          </div>
        )}
      </GBox>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  CONDITION CARD
// ════════════════════════════════════════════════════════════
function ConditionCard({ condition, onSelect, index }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={() => onSelect(condition)} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ position:"relative", borderRadius:18, padding:"20px 20px 16px", cursor:"pointer", overflow:"hidden", transition:"all 0.32s cubic-bezier(0.34,1.56,0.64,1)", transform:hov?"translateY(-6px) scale(1.022)":"translateY(0) scale(1)", animation:`sg-in 0.52s ease both ${index * 0.055}s`,
        background:hov?`linear-gradient(135deg,${condition.glass.replace("0.07","0.22")},${condition.glass})`:"rgba(8,22,40,0.68)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)",
        border:`1px solid ${hov?condition.border:T.border}`,
        boxShadow:hov?`0 20px 44px rgba(0,0,0,0.5),0 0 0 1px ${condition.border},inset 0 1px 0 rgba(255,255,255,0.06)`:"0 4px 18px rgba(0,0,0,0.38),inset 0 1px 0 rgba(255,255,255,0.025)" }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2, borderRadius:"18px 18px 0 0", background:`linear-gradient(90deg,${condition.color},transparent)`, opacity:hov?1:0.22, transition:"opacity 0.3s" }}/>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:12 }}>
        <div style={{ width:48, height:48, borderRadius:13, background:condition.glass.replace("0.07","0.28"), border:`1px solid ${condition.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{condition.icon}</div>
        <span style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, padding:"2px 8px", borderRadius:20, background:condition.glass.replace("0.07","0.2"), border:`1px solid ${condition.border}`, color:condition.color, letterSpacing:".05em" }}>{condition.acog}</span>
      </div>
      <div style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:condition.accent, letterSpacing:".12em", textTransform:"uppercase", marginBottom:3, opacity:0.85 }}>{condition.category}</div>
      <div style={{ fontSize:14, fontFamily:"'Playfair Display',serif", fontWeight:600, color:T.txt, lineHeight:1.25, marginBottom:4 }}>{condition.title}</div>
      <div style={{ fontSize:11, color:T.txt3, lineHeight:1.4, marginBottom:12 }}>{condition.subtitle}</div>
      <div style={{ height:1, background:`linear-gradient(90deg,${condition.border},transparent)`, marginBottom:10 }}/>
      <div style={{ fontSize:10, color:T.txt3, lineHeight:1.35 }}>{condition.severity}</div>
      <div style={{ position:"absolute", bottom:14, right:14, width:26, height:26, borderRadius:"50%", background:condition.glass.replace("0.07","0.18"), border:`1px solid ${condition.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:condition.color, opacity:hov?1:0, transform:hov?"scale(1) translateX(0)":"scale(0.6) translateX(-6px)", transition:"all 0.22s ease" }}>→</div>
      <style>{`@keyframes sg-in{from{opacity:0;transform:translateY(18px) scale(0.96)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  MAIN HUB
// ════════════════════════════════════════════════════════════
export default function SepsisHub({ onBack }) {
  const navigate = useNavigate();
  const [selected,   setSelected]   = useState(null);
  const [search,     setSearch]     = useState("");
  const [category,   setCategory]   = useState("All");
  const [contentMap, setContentMap] = useState({});

  useEffect(() => {
    base44.entities.ProtocolContent.filter({ hub_id: "sepsis" })
      .then(records => {
        const map = {};
        records.forEach(r => { if (r.condition_id) map[r.condition_id] = r; });
        setContentMap(map);
      })
      .catch(() => {});
  }, []);

  const allCats = ["All", ...CATEGORIES];

  const filtered = CONDITIONS
    .filter(c => category === "All" || c.category === category)
    .filter(c => !search
      || c.title.toLowerCase().includes(search.toLowerCase())
      || c.subtitle.toLowerCase().includes(search.toLowerCase())
      || c.category.toLowerCase().includes(search.toLowerCase())
    );

  const handleBack = useCallback(() => {
    if (onBack) onBack();
    else navigate("/hub");
  }, [onBack, navigate]);

  if (selected) {
    return (
      <div style={{ minHeight:"100vh", background:T.bg, fontFamily:"'DM Sans',sans-serif", position:"relative" }}>
        <GlassBg/>
        <div style={{ position:"relative", zIndex:1, padding:"28px 36px 48px", maxWidth:1100, margin:"0 auto" }}>
          <ConditionPage condition={selected} onBack={() => setSelected(null)} contentMap={contentMap}/>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:T.bg, fontFamily:"'DM Sans',sans-serif", position:"relative" }}>
      <GlassBg/>
      <div style={{ position:"relative", zIndex:1, padding:"24px 36px 48px", maxWidth:1300, margin:"0 auto" }}>

        {/* Back */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
          <button onClick={handleBack} style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 20px", cursor:"pointer", background:"rgba(8,22,40,0.85)", border:`1px solid ${AC}38`, borderRadius:12, color:AC, fontSize:12, fontWeight:700, fontFamily:"'DM Sans',sans-serif", backdropFilter:"blur(16px)", transition:"all .22s" }}
            onMouseEnter={e => { e.currentTarget.style.background=`${AC}14`; e.currentTarget.style.transform="translateX(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.background="rgba(8,22,40,0.85)"; e.currentTarget.style.transform="translateX(0)"; }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7L9 12" stroke={AC} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Back to Hub
          </button>
          <div style={{ height:1, flex:1, background:`linear-gradient(90deg,${AC}22,transparent)` }}/>
          <span style={{ fontSize:10, color:T.txt4, fontFamily:"'JetBrains Mono',monospace" }}>Notrya · {HUB_CONFIG.name}</span>
        </div>

        {/* Hero */}
        <GBox style={{ padding:"26px 30px 22px", marginBottom:18, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:2.5, borderRadius:"16px 16px 0 0", background:`linear-gradient(90deg,${AC},${AC}80,${AC}30,${AC})` }}/>
          <div style={{ position:"absolute", inset:0, background:`linear-gradient(108deg,${AC}07 0%,transparent 55%,rgba(59,158,255,0.03) 100%)`, pointerEvents:"none" }}/>
          <div style={{ display:"flex", alignItems:"flex-start", gap:20, position:"relative" }}>
            <div style={{ width:64, height:64, borderRadius:18, background:`linear-gradient(135deg,${AC}22,rgba(255,107,107,0.12))`, border:`1px solid ${AC}38`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:30, flexShrink:0, boxShadow:`0 0 24px ${AC}22` }}>
              {HUB_CONFIG.icon}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6, flexWrap:"wrap" }}>
                <span style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:700, color:T.txt, lineHeight:1 }}>{HUB_CONFIG.name}</span>
                <span style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, padding:"3px 10px", borderRadius:20, background:`${AC}12`, color:AC, border:`1px solid ${AC}32`, letterSpacing:".06em" }}>{HUB_CONFIG.badgeText}</span>
                <span style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, padding:"3px 10px", borderRadius:20, background:"rgba(255,107,107,0.1)", color:"#ff6b6b", border:"1px solid rgba(255,107,107,0.3)", letterSpacing:".06em" }}>{CONDITIONS.length} PROTOCOLS</span>
              </div>
              <p style={{ fontSize:13, color:T.txt2, margin:0, lineHeight:1.65, maxWidth:580 }}>{HUB_CONFIG.description}</p>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, flexShrink:0 }}>
              {[
                { v:CONDITIONS.length, l:"Protocols", c:AC },
                { v:CATEGORIES.length, l:"Categories", c:"#ff6b6b" },
                { v:"2021",            l:"Edition",    c:T.gold },
                { v:"ICU/EM",          l:"Specialty",  c:T.blue },
              ].map((s, i) => (
                <div key={i} style={{ textAlign:"center", background:"rgba(14,37,68,0.7)", borderRadius:10, padding:"8px 12px", border:`1px solid ${T.border}` }}>
                  <div style={{ fontSize:14, fontWeight:700, color:s.c, fontFamily:"'JetBrains Mono',monospace", lineHeight:1 }}>{s.v}</div>
                  <div style={{ fontSize:9, color:T.txt4, marginTop:3, textTransform:"uppercase", letterSpacing:".06em" }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </GBox>

        {/* Alert banner */}
        <div style={{ background:`${AC}06`, border:`1px solid ${AC}20`, borderRadius:12, padding:"10px 16px", marginBottom:16, display:"flex", alignItems:"center", gap:12, backdropFilter:"blur(12px)" }}>
          <div style={{ width:8, height:8, borderRadius:"50%", background:AC, flexShrink:0, animation:"sgpulse 1.5s ease-in-out infinite" }}/>
          <span style={{ fontSize:11, color:T.gold, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, flexShrink:0 }}>SSC 2021</span>
          <span style={{ fontSize:11, color:T.txt2 }}>Clinical decision support based on Surviving Sepsis Campaign 2021 International Guidelines. All protocols should be adapted to local antibiograms and institutional policies.</span>
          <style>{`@keyframes sgpulse{0%,100%{box-shadow:0 0 0 0 ${AC}40}50%{box-shadow:0 0 0 6px ${AC}00}}`}</style>
        </div>

        {/* Time targets */}
        <div style={{ marginBottom:18 }}><TimeBanner/></div>

        {/* Search + filter */}
        <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:16, flexWrap:"wrap" }}>
          <div style={{ position:"relative", flex:1, maxWidth:380 }}>
            <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", fontSize:14, opacity:0.35 }}>🔍</span>
            <input type="text" placeholder="Search protocols…" value={search} onChange={e => setSearch(e.target.value)}
              style={{ width:"100%", background:"rgba(8,22,40,0.8)", border:"1px solid rgba(42,79,122,0.6)", borderRadius:11, padding:"10px 14px 10px 40px", color:T.txt, fontFamily:"'DM Sans',sans-serif", fontSize:13, outline:"none", backdropFilter:"blur(14px)" }}
              onFocus={e => e.target.style.borderColor=`${AC}55`}
              onBlur={e  => e.target.style.borderColor="rgba(42,79,122,0.6)"}/>
          </div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {allCats.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)} style={{ padding:"8px 16px", borderRadius:24, fontSize:12, fontWeight:600, fontFamily:"'DM Sans',sans-serif", cursor:"pointer", transition:"all .2s", background:category===cat?`${AC}16`:"rgba(8,22,40,0.75)", border:`1px solid ${category===cat?`${AC}45`:"rgba(42,79,122,0.5)"}`, color:category===cat?AC:T.txt3, backdropFilter:"blur(12px)" }}>
                {cat}
              </button>
            ))}
          </div>
          <span style={{ fontSize:11, color:T.txt4, fontFamily:"'JetBrains Mono',monospace", marginLeft:"auto" }}>{filtered.length} protocol{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Section label */}
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
          <div style={{ height:1, width:20, background:`${AC}50`, borderRadius:1 }}/>
          <span style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace", color:AC, textTransform:"uppercase", letterSpacing:".12em", fontWeight:700 }}>
            {category === "All" ? "All Protocols" : category}
          </span>
          <div style={{ flex:1, height:1, background:`linear-gradient(90deg,${AC}28,transparent)` }}/>
        </div>

        {/* Cards */}
        {filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"60px 0", color:T.txt3 }}>
            <div style={{ fontSize:36, marginBottom:12 }}>🔍</div>
            <div style={{ fontSize:14, fontFamily:"'Playfair Display',serif" }}>No protocols found</div>
            <div style={{ fontSize:12, marginTop:6 }}>Try a different search or category</div>
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:13 }}>
            {filtered.map((c, i) => <ConditionCard key={c.id} condition={c} onSelect={setSelected} index={i}/>)}
          </div>
        )}

        {/* Evidence footer */}
        <div style={{ marginTop:28, borderRadius:12, padding:"12px 18px", background:"rgba(5,15,30,0.65)", border:`1px solid ${T.border}`, backdropFilter:"blur(12px)", display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
          <span style={{ fontSize:10, color:AC, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, flexShrink:0 }}>⚕ EVIDENCE BASE</span>
          {HUB_CONFIG.evidenceBase.map((ref, i) => (
            <span key={i} style={{ fontSize:10, color:T.txt4 }}>
              {i > 0 && <span style={{ marginRight:10, color:T.txt4 }}>·</span>}
              {ref}
            </span>
          ))}
        </div>

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        input::placeholder { color: #2e4a6a; }
        button { outline: none; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1a3555; border-radius: 3px; }
      `}</style>
    </div>
  );
}