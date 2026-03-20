import React, { useState, useEffect } from 'react';
import { usePatient } from '@/lib/PatientContext';

const CALCULATORS = [
  {
    id: 'bmi', name: 'Body Mass Index', shortName: 'BMI', icon: '⚖️', category: 'nutrition',
    description: 'Weight classification relative to height',
    rangeMin: 14, rangeMax: 50,
    fields: [
      { id: 'weight', label: 'Weight', type: 'number', unit: 'kg', min: 1, max: 500, step: 0.1, autofill: p => p.weight, required: true },
      { id: 'height', label: 'Height', type: 'number', unit: 'cm', min: 50, max: 250, step: 0.1, autofill: p => p.height, required: true },
    ],
    compute: (v) => ({ value: v.weight / Math.pow(v.height / 100, 2), unit: 'kg/m²', precision: 1 }),
    bands: [
      { lt: 18.5, label: 'Underweight', color: 'blue', rec: 'Nutritional assessment recommended. Evaluate for underlying etiology. Consider caloric supplementation and dietitian referral.' },
      { lt: 25, label: 'Normal Weight', color: 'teal', rec: 'Healthy weight range (18.5–24.9). Encourage continued balanced nutrition and regular physical activity.' },
      { lt: 30, label: 'Overweight', color: 'gold', rec: 'Lifestyle modification counseling indicated. Consider dietary assessment, exercise prescription, and metabolic screening.' },
      { lt: 35, label: 'Obese Class I', color: 'orange', rec: 'Obesity management program. Screen for T2DM, HTN, dyslipidemia, NAFLD, OSA. Consider pharmacotherapy.' },
      { lt: 40, label: 'Obese Class II', color: 'coral', rec: 'Intensive behavioral + pharmacological weight management. Bariatric surgery evaluation appropriate.' },
      { lt: Infinity, label: 'Obese Class III', color: 'red', rec: 'Severe obesity. High perioperative and metabolic risk. Multidisciplinary bariatric team evaluation.' },
    ],
    formula: 'BMI = Weight (kg) ÷ Height² (m)',
    reference: 'WHO Expert Consultation. Lancet 2004; 363:157–163',
  },
  {
    id: 'ibw', name: 'Ideal / Adjusted Body Weight', shortName: 'IBW / ABW', icon: '📏', category: 'nutrition',
    description: 'Devine formula — use for drug dosing in obesity',
    rangeMin: 30, rangeMax: 120,
    fields: [
      { id: 'height', label: 'Height', type: 'number', unit: 'cm', min: 50, max: 250, step: 0.1, autofill: p => p.height, required: true },
      { id: 'weight', label: 'Actual Weight', type: 'number', unit: 'kg', min: 1, max: 500, step: 0.1, autofill: p => p.weight, required: true },
      { id: 'sex', label: 'Sex', type: 'select', opts: [{ v: 'M', l: 'Male' }, { v: 'F', l: 'Female' }], autofill: p => p.gender, required: true },
    ],
    compute: (v) => {
      const hi = v.height / 2.54;
      const adj = Math.max(hi - 60, 0);
      const ibw = v.sex === 'M' ? 50 + 2.3 * adj : 45.5 + 2.3 * adj;
      const abw = ibw + 0.4 * (v.weight - ibw);
      return { value: Math.max(ibw, 0), value2: abw > ibw ? Math.round(abw * 10) / 10 : null, unit: 'kg', precision: 1, label2: 'ABW' };
    },
    bands: [{ lt: Infinity, label: 'Calculated', color: 'blue', rec: 'IBW: Use for aminoglycosides, vancomycin, phenytoin dosing.\nABW: Use when actual weight exceeds IBW by >30%.' }],
    formula: 'Male: 50 + 2.3 × (height_in − 60)  |  Female: 45.5 + 2.3 × (height_in − 60)',
    reference: 'Devine BJ. Drug Intell Clin Pharm 1974; 8:650–655',
  },
  {
    id: 'crcl', name: 'Creatinine Clearance', shortName: 'CrCl', icon: '🫘', category: 'renal',
    description: 'Cockcroft-Gault — gold standard for renal drug dosing',
    rangeMin: 0, rangeMax: 150,
    fields: [
      { id: 'age', label: 'Age', type: 'number', unit: 'years', min: 1, max: 120, step: 1, autofill: p => p.age, required: true },
      { id: 'weight', label: 'Weight', type: 'number', unit: 'kg', min: 1, max: 500, step: 0.1, autofill: p => p.weight, required: true },
      { id: 'scr', label: 'Serum Creatinine', type: 'number', unit: 'mg/dL', min: 0.1, max: 30, step: 0.01, autofill: p => p.labs?.scr, required: true },
      { id: 'sex', label: 'Sex', type: 'select', opts: [{ v: 'M', l: 'Male' }, { v: 'F', l: 'Female' }], autofill: p => p.gender, required: true },
    ],
    compute: (v) => {
      const crcl = ((140 - v.age) * v.weight) / (72 * v.scr) * (v.sex === 'F' ? 0.85 : 1.0);
      return { value: Math.max(crcl, 0), unit: 'mL/min', precision: 0 };
    },
    bands: [
      { lt: 15, label: 'G5 — Kidney Failure', color: 'red', rec: 'ESRD. Hold renally-cleared drugs. Nephrology consult urgent. Consider renal replacement therapy.' },
      { lt: 30, label: 'G4 — Severely Reduced', color: 'coral', rec: 'Significant dose reduction required. Nephrology referral. Avoid nephrotoxins.' },
      { lt: 60, label: 'G3 — Moderately Reduced', color: 'orange', rec: 'Adjust doses for aminoglycosides, vancomycin, DOACs. Monitor drug levels.' },
      { lt: 90, label: 'G2 — Mildly Reduced', color: 'gold', rec: 'Most drugs dosed normally. Monitor renal function trends.' },
      { lt: Infinity, label: 'G1 — Normal / High', color: 'teal', rec: 'Standard dosing appropriate for all renally-cleared medications.' },
    ],
    formula: 'CrCl = [(140 − Age) × Weight(kg)] ÷ (72 × SCr) × 0.85 if female',
    reference: 'Cockcroft DW, Gault MH. Nephron 1976; 16:31–41',
  },
  {
    id: 'egfr', name: 'eGFR (CKD-EPI 2021)', shortName: 'eGFR', icon: '🔬', category: 'renal',
    description: 'Race-free CKD-EPI 2021 for CKD staging',
    rangeMin: 0, rangeMax: 130,
    fields: [
      { id: 'scr', label: 'Serum Creatinine', type: 'number', unit: 'mg/dL', min: 0.1, max: 30, step: 0.01, autofill: p => p.labs?.scr, required: true },
      { id: 'age', label: 'Age', type: 'number', unit: 'years', min: 18, max: 120, step: 1, autofill: p => p.age, required: true },
      { id: 'sex', label: 'Sex', type: 'select', opts: [{ v: 'M', l: 'Male' }, { v: 'F', l: 'Female' }], autofill: p => p.gender, required: true },
    ],
    compute: (v) => {
      const k = v.sex === 'F' ? 0.7 : 0.9;
      const a = v.sex === 'F' ? -0.241 : -0.302;
      const ratio = v.scr / k;
      const egfr = 142 * Math.pow(Math.min(ratio, 1), a) * Math.pow(Math.max(ratio, 1), -1.2) * Math.pow(0.9938, v.age) * (v.sex === 'F' ? 1.012 : 1);
      return { value: Math.round(egfr), unit: 'mL/min/1.73m²', precision: 0 };
    },
    bands: [
      { lt: 15, label: 'G5 — Kidney Failure', color: 'red', rec: 'Stage 5 CKD. Renal replacement therapy planning. Nephrology-directed management.' },
      { lt: 30, label: 'G4 — Severely Decreased', color: 'coral', rec: 'Stage 4 CKD. Prepare for RRT. Aggressive management. Transplant workup if candidate.' },
      { lt: 60, label: 'G3 — Moderately Decreased', color: 'gold', rec: 'Stage 3 CKD. Blood pressure control. Quarterly monitoring. Limit nephrotoxins.' },
      { lt: 90, label: 'G2 — Mildly Decreased', color: 'blue', rec: 'Stage 2 CKD. Annual monitoring. Address modifiable risk factors.' },
      { lt: Infinity, label: 'G1 — Normal / High', color: 'teal', rec: 'Normal kidney function. Routine annual screening if risk factors present.' },
    ],
    formula: 'CKD-EPI 2021: 142 × min(SCr/κ, 1)^α × max(SCr/κ, 1)^−1.200 × 0.9938^Age × 1.012[♀]',
    reference: 'Inker LA et al. N Engl J Med 2021; 385:1737–1749',
  },
  {
    id: 'chadsvasc', name: 'CHA₂DS₂-VASc Score', shortName: 'CHADS-VASc', icon: '❤️', category: 'cardiology',
    description: 'Stroke risk in non-valvular atrial fibrillation',
    rangeMin: 0, rangeMax: 9,
    scored: [
      { id: 'chf', label: 'Congestive Heart Failure or LV dysfunction', pts: 1, autofill: p => p.pmh?.chf },
      { id: 'htn', label: 'Hypertension (resting BP > 140/90 or treated)', pts: 1, autofill: p => p.pmh?.htn },
      { id: 'age75', label: 'Age ≥ 75 years', pts: 2, autofill: p => p.age >= 75 },
      { id: 'dm', label: 'Diabetes mellitus', pts: 1, autofill: p => p.pmh?.dm },
      { id: 'stroke', label: 'Stroke, TIA, or thromboembolism (prior)', pts: 2, autofill: p => p.pmh?.stroke },
      { id: 'vasc', label: 'Vascular disease (prior MI, PAD, aortic plaque)', pts: 1, autofill: p => p.pmh?.vascularDisease },
      { id: 'age65', label: 'Age 65–74 years', pts: 1, autofill: p => p.age >= 65 && p.age < 75 },
      { id: 'female', label: 'Female sex category', pts: 1, autofill: p => p.gender === 'F' },
    ],
    compute: (v, checked) => {
      const STROKE = [0, 1.3, 2.2, 3.2, 4.0, 6.7, 9.8, 9.6, 12.5, 15.2];
      const score = Object.values(checked).reduce((s, x) => s + x, 0);
      return { value: score, unit: 'pts', precision: 0, extra: `${STROKE[Math.min(score, 9)]}% annual stroke risk` };
    },
    bands: [
      { lt: 1, label: 'Low Risk', color: 'teal', rec: 'Score 0 (male) or 1 (female): Anticoagulation not recommended. Reassess annually.' },
      { lt: 2, label: 'Low-Moderate Risk', color: 'gold', rec: 'Score 1 (male): Consider anticoagulation. Evaluate bleeding risk with HAS-BLED.' },
      { lt: Infinity, label: 'Moderate-High Risk', color: 'coral', rec: 'Score ≥2: Oral anticoagulation recommended. DOAC preferred over warfarin.' },
    ],
    formula: 'CHF(1) + HTN(1) + Age≥75(2) + DM(1) + Stroke/TIA(2) + Vascular(1) + Age 65–74(1) + Female(1)',
    reference: 'Lip GY et al. Chest 2010; 137:263–272',
  },
  {
    id: 'hasbled', name: 'HAS-BLED Score', shortName: 'HAS-BLED', icon: '🩸', category: 'cardiology',
    description: 'Bleeding risk on anticoagulation in atrial fibrillation',
    rangeMin: 0, rangeMax: 9,
    scored: [
      { id: 'htn_uc', label: 'Hypertension — uncontrolled (SBP > 160 mmHg)', pts: 1, autofill: p => p.vitals?.sbp > 160 },
      { id: 'renal', label: 'Renal disease (Cr > 2.26 mg/dL or dialysis)', pts: 1, autofill: p => p.labs?.scr > 2.26 || p.pmh?.renalDisease },
      { id: 'liver', label: 'Liver disease (cirrhosis or bilirubin > 2× ULN)', pts: 1, autofill: p => p.pmh?.liverDisease },
      { id: 'stroke_hx', label: 'Stroke history', pts: 1, autofill: p => p.pmh?.stroke },
      { id: 'bleed_hx', label: 'Prior major bleeding or predisposition', pts: 1, autofill: p => p.pmh?.bleedingHistory },
      { id: 'labile_inr', label: 'Labile INR — TTR < 60% (if on warfarin)', pts: 1, autofill: () => false },
      { id: 'elderly', label: 'Elderly age > 65 years', pts: 1, autofill: p => p.age > 65 },
      { id: 'drugs', label: 'Antiplatelet agents or NSAIDs', pts: 1, autofill: p => p.meds?.antiplatelet || p.meds?.nsaid },
      { id: 'alcohol', label: 'Alcohol use (≥ 8 drinks per week)', pts: 1, autofill: () => false },
    ],
    compute: (v, checked) => {
      const BLEED = [0.9, 1.13, 1.88, 3.74, 8.70, 12.5];
      const score = Object.values(checked).reduce((s, x) => s + x, 0);
      return { value: score, unit: 'pts', precision: 0, extra: `${BLEED[Math.min(score, 5)]}% annual major bleed risk` };
    },
    bands: [
      { lt: 2, label: 'Low Bleeding Risk', color: 'teal', rec: 'Low risk. Anticoagulation appropriate. Continue and reassess annually.' },
      { lt: 3, label: 'Moderate Bleeding Risk', color: 'gold', rec: 'Moderate risk. Address modifiable factors: BP control, stop NSAIDs if possible.' },
      { lt: Infinity, label: 'High Bleeding Risk', color: 'coral', rec: 'Score ≥ 3: Does NOT preclude anticoagulation — identifies modifiable risk factors to correct.' },
    ],
    formula: 'H(1) + A(1) + S(1) + B(1) + L(1) + E(1) + D(1) = 0–9',
    reference: 'Pisters R et al. Chest 2010; 138:1093–1100',
  },
  {
    id: 'wells_pe', name: 'Wells Score — PE', shortName: 'Wells PE', icon: '🫁', category: 'pulmonary',
    description: 'Pre-test probability of pulmonary embolism',
    rangeMin: 0, rangeMax: 12.5,
    scored: [
      { id: 'dvt_signs', label: 'Clinical signs/symptoms of DVT', pts: 3, autofill: () => false },
      { id: 'pe_likely', label: 'PE is #1 diagnosis, or equally likely as alternative', pts: 3, autofill: () => false },
      { id: 'hr_high', label: 'Heart rate > 100 bpm', pts: 1.5, autofill: p => p.vitals?.hr > 100 },
      { id: 'immob', label: 'Immobilization ≥ 3 days, or surgery in prior 4 weeks', pts: 1.5, autofill: () => false },
      { id: 'prior_pe_dvt', label: 'Previous objectively-confirmed DVT or PE', pts: 1.5, autofill: () => false },
      { id: 'hemoptysis', label: 'Hemoptysis', pts: 1, autofill: () => false },
      { id: 'malignancy', label: 'Malignancy (treatment within 6 months or palliative)', pts: 1, autofill: p => p.pmh?.malignancy },
    ],
    compute: (v, checked) => ({ value: Object.values(checked).reduce((s, x) => s + x, 0), unit: 'pts', precision: 1 }),
    bands: [
      { lt: 2, label: 'Low Probability', color: 'teal', rec: '~1.3% PE prevalence. If PERC negative → no further workup. D-dimer if PERC positive.' },
      { lt: 7, label: 'Moderate Probability', color: 'gold', rec: '~16% PE prevalence. D-dimer recommended. If positive → CT-PA.' },
      { lt: Infinity, label: 'High Probability', color: 'coral', rec: '~37.5% PE prevalence. CT-PA indicated. Consider empirical anticoagulation.' },
    ],
    formula: 'DVT signs(3) + PE likely(3) + HR>100(1.5) + Immob(1.5) + Prior PE/DVT(1.5) + Hemoptysis(1) + Malignancy(1)',
    reference: 'Wells PS et al. Thromb Haemost 2000; 83:416–420',
  },
  {
    id: 'curb65', name: 'CURB-65 Score', shortName: 'CURB-65', icon: '🫀', category: 'pulmonary',
    description: 'Community-acquired pneumonia severity index',
    rangeMin: 0, rangeMax: 5,
    scored: [
      { id: 'confusion', label: 'Confusion — new onset or Mental Test ≤ 8', pts: 1, autofill: () => false },
      { id: 'urea', label: 'BUN > 19 mg/dL (Urea > 7 mmol/L)', pts: 1, autofill: p => p.labs?.bun > 19 },
      { id: 'rr', label: 'Respiratory rate ≥ 30 breaths per minute', pts: 1, autofill: p => p.vitals?.rr >= 30 },
      { id: 'bp_low', label: 'Low blood pressure: SBP < 90 or DBP ≤ 60 mmHg', pts: 1, autofill: p => p.vitals?.sbp < 90 || p.vitals?.dbp <= 60 },
      { id: 'age65', label: 'Age ≥ 65 years', pts: 1, autofill: p => p.age >= 65 },
    ],
    compute: (v, checked) => {
      const MORT = [0.7, 3.2, 13, 17, 41.5, 41.5];
      const score = Object.values(checked).reduce((s, x) => s + x, 0);
      return { value: score, unit: 'pts', precision: 0, extra: `~${MORT[Math.min(score, 5)]}% 30-day mortality` };
    },
    bands: [
      { lt: 1, label: 'Low Severity', color: 'teal', rec: 'Score 0: Outpatient oral antibiotics. Score 1: Outpatient with close follow-up.' },
      { lt: 3, label: 'Moderate Severity', color: 'gold', rec: 'Score 2: Inpatient admission. IV antibiotics, fluid resuscitation.' },
      { lt: Infinity, label: 'High Severity', color: 'coral', rec: 'Score 3–5: Severe CAP. ICU-level care. Combination antibiotic therapy.' },
    ],
    formula: 'Confusion(1) + Urea>7(1) + RR≥30(1) + Low BP(1) + Age≥65(1)',
    reference: 'Lim WS et al. Thorax 2003; 58:377–382',
  },
  {
    id: 'anion_gap', name: 'Anion Gap', shortName: 'Anion Gap', icon: '⚗️', category: 'labs',
    description: 'Unmeasured anions; corrected for hypoalbuminemia',
    rangeMin: 0, rangeMax: 35,
    fields: [
      { id: 'na', label: 'Sodium (Na⁺)', type: 'number', unit: 'mEq/L', min: 100, max: 180, step: 1, autofill: p => p.labs?.na, required: true },
      { id: 'cl', label: 'Chloride (Cl⁻)', type: 'number', unit: 'mEq/L', min: 60, max: 150, step: 1, autofill: p => p.labs?.cl, required: true },
      { id: 'hco3', label: 'Bicarbonate (HCO₃⁻)', type: 'number', unit: 'mEq/L', min: 1, max: 50, step: 1, autofill: p => p.labs?.hco3, required: true },
      { id: 'albumin', label: 'Albumin (optional)', type: 'number', unit: 'g/dL', min: 0.5, max: 6, step: 0.1, autofill: p => p.labs?.albumin, required: false },
    ],
    compute: (v) => {
      const ag = v.na - (v.cl + v.hco3);
      const corrAG = v.albumin != null ? ag + 2.5 * (4 - v.albumin) : null;
      return { value: ag, value2: corrAG !== null ? Math.round(corrAG * 10) / 10 : null, unit: 'mEq/L', precision: 0, label2: corrAG !== null ? 'Corrected AG' : null };
    },
    bands: [
      { lt: 8, label: 'Below Normal', color: 'blue', rec: 'Low AG. Consider hypoalbuminemia, hypercalcemia, or lab error. Calculate corrected AG.' },
      { lt: 12, label: 'Normal', color: 'teal', rec: 'Normal AG (8–12 mEq/L). If acidosis present → non-AG metabolic acidosis.' },
      { lt: 20, label: 'Elevated', color: 'gold', rec: 'Elevated AG. Evaluate for MUDPILES. Check lactate, ketones, osmolar gap.' },
      { lt: Infinity, label: 'High AG Acidosis', color: 'coral', rec: 'High AG acidosis (>20). Urgent evaluation required.' },
    ],
    formula: 'AG = Na⁺ − (Cl⁻ + HCO₃⁻) | Corrected AG = AG + 2.5 × (4.0 − Albumin)',
    reference: 'Emmett M, Narins RG. Medicine 1977; 56:38–54',
  },
  {
    id: 'corr_ca', name: 'Corrected Calcium', shortName: 'Corr. Ca²⁺', icon: '🦴', category: 'labs',
    description: 'Adjust total calcium for hypoalbuminemia',
    rangeMin: 6, rangeMax: 16,
    fields: [
      { id: 'ca', label: 'Total Calcium', type: 'number', unit: 'mg/dL', min: 4, max: 20, step: 0.1, autofill: p => p.labs?.ca, required: true },
      { id: 'albumin', label: 'Serum Albumin', type: 'number', unit: 'g/dL', min: 0.5, max: 6, step: 0.1, autofill: p => p.labs?.albumin, required: true },
    ],
    compute: (v) => ({ value: v.ca + 0.8 * (4 - v.albumin), unit: 'mg/dL', precision: 1 }),
    bands: [
      { lt: 8.5, label: 'Hypocalcemia', color: 'blue', rec: 'Check ionized Ca, Mg, PTH, vitamin D. IV calcium gluconate if symptomatic.' },
      { lt: 10.5, label: 'Normal', color: 'teal', rec: 'Normal corrected calcium (8.5–10.5 mg/dL).' },
      { lt: 12.0, label: 'Mild Hypercalcemia', color: 'gold', rec: 'Check PTH, PTHrP, 25-OH vitamin D. IV hydration if symptomatic.' },
      { lt: 14.0, label: 'Moderate Hypercalcemia', color: 'orange', rec: 'IV saline hydration. Bisphosphonates. Calcitonin for rapid reduction.' },
      { lt: Infinity, label: 'Severe / Crisis', color: 'coral', rec: 'Hypercalcemic crisis. ICU admission. Aggressive IV hydration, bisphosphonates, calcitonin.' },
    ],
    formula: 'Corrected Ca = Measured Ca + 0.8 × (4.0 − Albumin)',
    reference: 'Payne RB et al. BMJ 1973; 4:643–646',
  },
  {
    id: 'meld', name: 'MELD Score', shortName: 'MELD', icon: '🔴', category: 'hepatic',
    description: 'End-stage liver disease — transplant listing priority',
    rangeMin: 6, rangeMax: 40,
    fields: [
      { id: 'bili', label: 'Bilirubin', type: 'number', unit: 'mg/dL', min: 0.1, max: 50, step: 0.1, autofill: p => p.labs?.bilirubin, required: true },
      { id: 'inr', label: 'INR', type: 'number', unit: '', min: 0.5, max: 15, step: 0.01, autofill: p => p.labs?.inr, required: true },
      { id: 'cr', label: 'Creatinine', type: 'number', unit: 'mg/dL', min: 0.1, max: 30, step: 0.01, autofill: p => p.labs?.scr, required: true },
      { id: 'sodium', label: 'Sodium (for MELD-Na)', type: 'number', unit: 'mEq/L', min: 100, max: 160, step: 1, autofill: p => p.labs?.na, required: false },
    ],
    compute: (v) => {
      const bili = Math.max(v.bili, 1), inr = Math.max(v.inr, 1), cr = Math.min(Math.max(v.cr, 1), 4);
      const meld = Math.round(3.78 * Math.log(bili) + 11.2 * Math.log(inr) + 9.57 * Math.log(cr) + 6.43);
      let meldNa = null;
      if (v.sodium) { const na = Math.min(Math.max(v.sodium, 125), 137); meldNa = Math.round(meld + 1.32 * (137 - na) - (0.033 * meld * (137 - na))); }
      return { value: meld, value2: meldNa, unit: 'pts', precision: 0, label2: meldNa != null ? 'MELD-Na' : null };
    },
    bands: [
      { lt: 10, label: 'Low Priority', color: 'teal', rec: '< 10% 90-day mortality. Optimize medical management.' },
      { lt: 20, label: 'Moderate Priority', color: 'gold', rec: '6–19% 90-day mortality. Active transplant workup.' },
      { lt: 30, label: 'High Priority', color: 'orange', rec: '19–52% 90-day mortality. Accelerate transplant evaluation.' },
      { lt: 40, label: 'Very High Priority', color: 'coral', rec: '52–79% 90-day mortality. Urgent transplant listing.' },
      { lt: Infinity, label: 'Critical Priority', color: 'red', rec: '> 71% 90-day mortality. Fulminant hepatic failure. Status 1A listing.' },
    ],
    formula: '3.78×ln[Bili] + 11.2×ln[INR] + 9.57×ln[Cr] + 6.43',
    reference: 'Kamath PS et al. Hepatology 2001; 33:464–470',
  },
  {
    id: 'gcs', name: 'Glasgow Coma Scale', shortName: 'GCS', icon: '🧠', category: 'neurology',
    description: 'Standardized consciousness assessment (3–15)',
    rangeMin: 3, rangeMax: 15,
    fields: [
      { id: 'eye', label: 'Eye Opening', type: 'select', opts: [{ v: '4', l: '4 — Spontaneous' }, { v: '3', l: '3 — To voice' }, { v: '2', l: '2 — To pain' }, { v: '1', l: '1 — None' }], required: true },
      { id: 'verbal', label: 'Verbal Response', type: 'select', opts: [{ v: '5', l: '5 — Oriented' }, { v: '4', l: '4 — Confused' }, { v: '3', l: '3 — Inappropriate words' }, { v: '2', l: '2 — Sounds only' }, { v: '1', l: '1 — None' }], required: true },
      { id: 'motor', label: 'Motor Response', type: 'select', opts: [{ v: '6', l: '6 — Obeys commands' }, { v: '5', l: '5 — Localizes pain' }, { v: '4', l: '4 — Withdraws' }, { v: '3', l: '3 — Abnormal flexion' }, { v: '2', l: '2 — Extension' }, { v: '1', l: '1 — None' }], required: true },
    ],
    compute: (v) => {
      const e = Number(v.eye || 0), vb = Number(v.verbal || 0), m = Number(v.motor || 0);
      if (!e || !vb || !m) return null;
      return { value: e + vb + m, unit: `E${e}V${vb}M${m}`, precision: 0 };
    },
    bands: [
      { lt: 9, label: 'Severe TBI', color: 'coral', rec: 'GCS 3–8: Intubation indicated. Neurosurgery consult. CT head emergently.' },
      { lt: 13, label: 'Moderate TBI', color: 'gold', rec: 'GCS 9–12: CT head immediately. ICU admission. Neurological checks q1h.' },
      { lt: 15, label: 'Mild TBI', color: 'blue', rec: 'GCS 13–14: CT head per protocol. 4–6h observation. Neurology follow-up.' },
      { lt: Infinity, label: 'Normal', color: 'teal', rec: 'GCS 15: Normal level of consciousness.' },
    ],
    formula: 'GCS = Eye (1–4) + Verbal (1–5) + Motor (1–6)  |  Range: 3–15',
    reference: 'Teasdale G, Jennett B. Lancet 1974; 2:81–84',
  },
];

const COLOR_MAP = { teal: '#00e5c0', gold: '#f5c842', orange: '#ff9f43', coral: '#ff6b6b', blue: '#3b9eff', red: '#ff3366' };
const CAT_META = {
  nutrition: { label: 'Nutrition', dotColor: '#00e5c0' },
  renal: { label: 'Renal', dotColor: '#00d4ff' },
  cardiology: { label: 'Cardiology', dotColor: '#ff6b6b' },
  pulmonary: { label: 'Pulmonary', dotColor: '#3b9eff' },
  labs: { label: 'Labs', dotColor: '#9b6dff' },
  hepatic: { label: 'Hepatic', dotColor: '#ff9f43' },
  neurology: { label: 'Neurology', dotColor: '#f5c842' },
};

function getBand(calc, value) {
  return calc.bands.find(b => value < b.lt) || calc.bands[calc.bands.length - 1];
}

function formatVal(v, precision) {
  if (v == null) return '—';
  const p = precision ?? 1;
  return p === 0 ? Math.round(v).toString() : v.toFixed(p);
}

function BandStrip({ calc, value }) {
  const rMin = calc.rangeMin ?? 0;
  const rMax = calc.rangeMax ?? 100;
  const total = rMax - rMin;
  const band = getBand(calc, value);
  const needlePct = ((Math.max(rMin, Math.min(value, rMax)) - rMin) / total) * 100;
  const needleColor = COLOR_MAP[band.color] || '#00e5c0';

  let segs = [];
  let prev = rMin;
  calc.bands.forEach(b => {
    const segMax = Math.min(b.lt, rMax);
    const width = ((segMax - prev) / total) * 100;
    if (width > 0) segs.push({ color: b.color, width });
    prev = segMax;
    if (prev >= rMax) return;
  });

  return (
    <div style={{ margin: '10px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#2e4a6a', fontFamily: "'JetBrains Mono'", marginBottom: '3px' }}>
        <span>{rMin}</span>
        <span style={{ fontSize: '10px', color: '#4a6a8a' }}>{calc.shortName} Range</span>
        <span>{rMax}{value > rMax ? '+' : ''}</span>
      </div>
      <div style={{ height: '10px', borderRadius: '6px', display: 'flex', overflow: 'hidden', gap: '1px' }}>
        {segs.map((s, i) => (
          <div key={i} style={{ width: `${s.width}%`, background: COLOR_MAP[s.color] || '#1a3555', opacity: 0.7 }} />
        ))}
      </div>
      <div style={{ position: 'relative', height: '22px', marginTop: '2px' }}>
        <div style={{ position: 'absolute', top: 0, left: `${needlePct}%`, width: '2px', height: '14px', borderRadius: '2px', background: needleColor, transform: 'translateX(-50%)' }}>
          <span style={{ position: 'absolute', top: '14px', left: '50%', transform: 'translateX(-50%)', fontSize: '8px', color: needleColor, whiteSpace: 'nowrap' }}>▲</span>
        </div>
      </div>
    </div>
  );
}

export default function ClinicalCalculators() {
  const { activePatient } = usePatient();
  const [time, setTime] = useState(new Date());
  const [activeCalcId, setActiveCalcId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentValues, setCurrentValues] = useState({});
  const [currentChecked, setCurrentChecked] = useState({});
  const [history, setHistory] = useState({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const activeCalc = CALCULATORS.find(c => c.id === activeCalcId);

  const filteredCalcs = CALCULATORS.filter(c =>
    !searchTerm || c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.shortName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.category.includes(searchTerm.toLowerCase())
  );

  const grouped = filteredCalcs.reduce((acc, calc) => {
    if (!acc[calc.category]) acc[calc.category] = [];
    acc[calc.category].push(calc);
    return acc;
  }, {});

  const handleLoadCalc = (id) => {
    setActiveCalcId(id);
    setCurrentValues({});
    setCurrentChecked({});
  };

  const handleFieldChange = (fieldId, value) => {
    setCurrentValues(prev => ({
      ...prev,
      [fieldId]: value === '' ? undefined : (isNaN(value) ? value : Number(value))
    }));
  };

  const handleToggleScore = (itemId, pts) => {
    setCurrentChecked(prev => ({ ...prev, [itemId]: prev[itemId] ? 0 : pts }));
  };

  const getResult = () => {
    if (!activeCalc) return null;
    try { return activeCalc.compute(currentValues, currentChecked); } catch { return null; }
  };

  const result = getResult();
  const band = result && activeCalc ? getBand(activeCalc, result.value) : null;

  const handleCompute = () => {
    if (!activeCalc || !result) return;
    setHistory(prev => ({
      ...prev,
      [activeCalcId]: [{ value: result.value, unit: result.unit, ts: new Date() }, ...(prev[activeCalcId] || []).slice(0, 4)]
    }));
  };

  const handleCopy = () => {
    if (!activeCalc || !result || !band) return;
    const txt = `${activeCalc.name}: ${formatVal(result.value, result.precision)} ${result.unit} [${band.label}]${result.extra ? '\n' + result.extra : ''}\nFormula: ${activeCalc.formula}\nRef: ${activeCalc.reference}\nCalculated: ${new Date().toLocaleString()}`;
    navigator.clipboard.writeText(txt).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  return (
    <div style={{ background: '#050f1e', color: '#e8f0fe', fontFamily: "'DM Sans', sans-serif", minHeight: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance:none; }
        input[type=number] { -moz-appearance:textfield; }
        @keyframes ai-pulse { 0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(0,229,192,.4)} 50%{opacity:.8;box-shadow:0 0 0 6px rgba(0,229,192,0)} }
        @keyframes result-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1a3555; border-radius: 2px; }
      `}</style>

      {/* Icon Sidebar */}
      <div style={{ position: 'fixed', top: '50px', right: 0, bottom: 0, width: '50px', background: '#0a1419', borderLeft: '1px solid #1a3555', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '14px 0', zIndex: 200, overflowY: 'auto' }}>
        {[
          { icon: '📊', label: 'Dashboard' },
          { icon: '📋', label: 'Notes' },
          { icon: '🧪', label: 'Labs' },
          { icon: '⚙️', label: 'Settings' },
          { icon: '👥', label: 'Patients' },
        ].map((item, i) => (
          <div key={i} style={{ width: '34px', height: '34px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', background: 'rgba(0,229,192,.08)', border: '1px solid rgba(0,229,192,.2)', cursor: 'pointer', transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,229,192,.15)'; e.currentTarget.style.borderColor = 'rgba(0,229,192,.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,229,192,.08)'; e.currentTarget.style.borderColor = 'rgba(0,229,192,.2)'; }}
          >
            {item.icon}
          </div>
        ))}
      </div>

      {/* Navbar */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '50px', background: '#081628', borderBottom: '1px solid #1a3555', display: 'flex', alignItems: 'center', padding: '0 16px', gap: '14px', zIndex: 100 }}>
        <div style={{ fontSize: '16px', fontWeight: '700', color: '#00e5c0', fontFamily: 'Playfair Display' }}>Calc</div>
        <div style={{ width: '1px', height: '22px', background: '#1a3555' }}></div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {['ACTIVE PTS', 'NOTES PENDING', 'ORDERS QUEUE', 'SHIFT HOURS'].map((lbl, i) => (
            <button key={i} style={{ background: 'transparent', border: '1px solid #1a3555', borderRadius: '6px', padding: '4px 10px', fontSize: '10px', color: '#4a6a8a', fontWeight: '600', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '.04em', transition: 'all .15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#2a4f7a'; e.currentTarget.style.color = '#8aaccc'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a3555'; e.currentTarget.style.color = '#4a6a8a'; }}
            >
              {lbl}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: '12px', color: '#8aaccc' }}>{String(time.getHours()).padStart(2, '0')}:{String(time.getMinutes()).padStart(2, '0')}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(0,229,192,.08)', border: '1px solid rgba(0,229,192,.3)', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: '600', color: '#00e5c0' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00e5c0', display: 'inline-block', animation: 'ai-pulse 2s ease-in-out infinite' }}></span> AI ON
          </div>
          <button style={{ background: '#00e5c0', color: '#050f1e', border: 'none', borderRadius: '6px', padding: '5px 12px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>+ New Patient</button>
        </div>
      </div>

      {/* Content */}
      <div style={{ display: 'flex', height: '100vh', paddingTop: '50px', paddingLeft: '12px', paddingRight: '50px', overflow: 'hidden' }}>
        {/* Picker */}
        <div style={{ width: '230px', flexShrink: 0, background: '#081628', borderRight: '1px solid #1a3555', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '14px', borderBottom: '1px solid #1a3555' }}>
            <div style={{ fontFamily: 'Playfair Display', fontSize: '15px', fontWeight: '700', color: '#e8f0fe', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🧮 Calculators <span style={{ fontSize: '11px', color: '#4a6a8a', fontFamily: 'JetBrains Mono', fontWeight: '400' }}>({CALCULATORS.length})</span>
            </div>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px' }}>🔍</span>
              <input type="text" placeholder="Search calculators…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                style={{ width: '100%', background: '#0e2544', border: '1px solid #1a3555', borderRadius: '8px', padding: '7px 10px 7px 32px', color: '#e8f0fe', fontSize: '12px', outline: 'none', fontFamily: 'DM Sans' }} />
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px 16px' }}>
            {Object.entries(grouped).map(([cat, calcs]) => (
              <div key={cat}>
                <div style={{ fontSize: '9px', color: '#2e4a6a', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: '700', padding: '10px 6px 4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: CAT_META[cat]?.dotColor || '#8aaccc', display: 'inline-block' }}></span>
                  {CAT_META[cat]?.label || cat}
                </div>
                {calcs.map(calc => (
                  <button key={calc.id} onClick={() => handleLoadCalc(calc.id)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', border: activeCalcId === calc.id ? '1px solid rgba(59,158,255,.25)' : '1px solid transparent', background: activeCalcId === calc.id ? 'rgba(59,158,255,.08)' : 'transparent', marginBottom: '2px', transition: 'all .15s', textAlign: 'left' }}
                    onMouseEnter={e => { if (activeCalcId !== calc.id) e.currentTarget.style.background = '#0e2544'; }}
                    onMouseLeave={e => { if (activeCalcId !== calc.id) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{ width: '30px', height: '30px', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0, background: `rgba(${CAT_META[cat]?.dotColor === '#00e5c0' ? '0,229,192' : CAT_META[cat]?.dotColor === '#ff6b6b' ? '255,107,107' : CAT_META[cat]?.dotColor === '#3b9eff' ? '59,158,255' : CAT_META[cat]?.dotColor === '#f5c842' ? '245,200,66' : CAT_META[cat]?.dotColor === '#ff9f43' ? '255,159,67' : '155,109,255'},.12)` }}>{calc.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#e8f0fe', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{calc.shortName}</div>
                      <div style={{ fontSize: '10px', color: '#4a6a8a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '1px' }}>{calc.description}</div>
                    </div>
                    {history[calc.id]?.[0] && (
                      <div style={{ fontSize: '10px', fontFamily: 'JetBrains Mono', fontWeight: '600', color: '#00e5c0', flexShrink: 0, marginLeft: 'auto' }}>{formatVal(history[calc.id][0].value, 0)}</div>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Main */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Patient bar */}
          {activePatient && (
            <div style={{ background: 'rgba(0,229,192,.05)', borderBottom: '1px solid rgba(0,229,192,.18)', padding: '7px 18px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', flexShrink: 0 }}>
              <span style={{ fontSize: '14px' }}>👤</span>
              <span style={{ fontWeight: '700', color: '#00e5c0' }}>{activePatient.patient_name}</span>
              <span style={{ color: '#4a6a8a' }}>{activePatient.age ? activePatient.age + 'y' : ''} {activePatient.gender || ''} — BP {activePatient.vitals?.sbp || '—'}/{activePatient.vitals?.dbp || '—'}</span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '10px', color: '#4a6a8a' }}>Auto-filled:</span>
                {activePatient.weight && <span style={{ background: 'rgba(0,229,192,.1)', border: '1px solid rgba(0,229,192,.25)', borderRadius: '3px', padding: '1px 7px', fontSize: '10px', color: '#00e5c0', fontFamily: 'JetBrains Mono', fontWeight: '600' }}>Weight</span>}
                {activePatient.height && <span style={{ background: 'rgba(0,229,192,.1)', border: '1px solid rgba(0,229,192,.25)', borderRadius: '3px', padding: '1px 7px', fontSize: '10px', color: '#00e5c0', fontFamily: 'JetBrains Mono', fontWeight: '600' }}>Height</span>}
              </div>
            </div>
          )}

          {!activeCalc ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '40px', textAlign: 'center', overflowY: 'auto' }}>
              <div style={{ fontSize: '40px' }}>🧮</div>
              <div style={{ fontFamily: 'Playfair Display', fontSize: '22px', fontWeight: '700', color: '#e8f0fe' }}>Clinical Calculators</div>
              <div style={{ fontSize: '13px', color: '#4a6a8a', maxWidth: '420px', lineHeight: '1.6' }}>Evidence-based clinical tools with automatic patient data integration. Select a calculator from the sidebar or choose a quick-start below.</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', width: '100%', maxWidth: '600px', marginTop: '8px' }}>
                {['bmi', 'crcl', 'chadsvasc', 'gcs', 'anion_gap', 'meld'].map(id => {
                  const c = CALCULATORS.find(x => x.id === id);
                  if (!c) return null;
                  const m = CAT_META[c.category];
                  return (
                    <button key={id} onClick={() => handleLoadCalc(id)}
                      style={{ background: '#081628', border: '1px solid #1a3555', borderRadius: '12px', padding: '14px', cursor: 'pointer', textAlign: 'left', transition: 'all .18s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#2a4f7a'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a3555'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      <div style={{ fontSize: '22px', marginBottom: '6px' }}>{c.icon}</div>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#e8f0fe', marginBottom: '3px' }}>{c.shortName}</div>
                      <div style={{ fontSize: '10px', color: '#4a6a8a', lineHeight: '1.4' }}>{c.description}</div>
                      <span style={{ display: 'inline-block', marginTop: '8px', fontSize: '10px', fontFamily: 'JetBrains Mono', padding: '2px 8px', borderRadius: '20px', fontWeight: '700', background: `rgba(${m?.dotColor === '#00e5c0' ? '0,229,192' : m?.dotColor === '#ff6b6b' ? '255,107,107' : '59,158,255'},.12)`, color: m?.dotColor, border: `1px solid ${m?.dotColor}50` }}>{m?.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #1a3555', flexShrink: 0, background: '#081628' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', background: 'rgba(0,229,192,.12)' }}>{activeCalc.icon}</div>
                  <div style={{ fontFamily: 'Playfair Display', fontSize: '18px', fontWeight: '700', color: '#e8f0fe' }}>{activeCalc.name}</div>
                  <div style={{ display: 'flex', gap: '5px', marginLeft: 'auto' }}>
                    <span style={{ fontSize: '10px', fontFamily: 'JetBrains Mono', padding: '2px 8px', borderRadius: '20px', fontWeight: '700', background: 'rgba(0,229,192,.12)', color: '#00e5c0', border: '1px solid rgba(0,229,192,.3)' }}>{CAT_META[activeCalc.category]?.label}</span>
                    {activePatient && <span style={{ fontSize: '10px', fontFamily: 'JetBrains Mono', padding: '2px 8px', borderRadius: '20px', fontWeight: '700', background: 'rgba(0,229,192,.1)', color: '#00e5c0', border: '1px solid rgba(0,229,192,.3)' }}>⚡ Patient data available</span>}
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: '#4a6a8a', marginLeft: '46px' }}>{activeCalc.description}</div>
              </div>

              {/* Body */}
              <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* Inputs */}
                <div style={{ width: '340px', flexShrink: 0, overflowY: 'auto', padding: '16px', borderRight: '1px solid #1a3555' }}>
                  {activeCalc.fields && (
                    <>
                      <div style={{ fontSize: '10px', fontWeight: '700', color: '#4a6a8a', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                        Input Values <div style={{ flex: 1, height: '1px', background: '#1a3555' }}></div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                        {activeCalc.fields.map(f => (
                          <div key={f.id} style={{ gridColumn: f.type === 'select' && f.opts?.length > 3 ? '1/-1' : 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '11px', color: '#8aaccc', fontWeight: '500' }}>{f.label}{!f.required && <span style={{ color: '#2e4a6a' }}> (optional)</span>}</label>
                            {f.type === 'select' ? (
                              <select value={currentValues[f.id] ?? ''} onChange={e => handleFieldChange(f.id, e.target.value)}
                                style={{ width: '100%', background: '#0e2544', border: '1.5px solid #1a3555', borderRadius: '8px', padding: '8px 10px', color: '#e8f0fe', fontSize: '13px', outline: 'none', appearance: 'none', cursor: 'pointer' }}>
                                <option value="">— Select —</option>
                                {f.opts?.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                              </select>
                            ) : (
                              <div style={{ position: 'relative' }}>
                                <input type="number" min={f.min} max={f.max} step={f.step} value={currentValues[f.id] ?? ''} onChange={e => handleFieldChange(f.id, e.target.value)}
                                  style={{ width: '100%', background: '#0e2544', border: '1.5px solid #1a3555', borderRadius: '8px', padding: '8px 40px 8px 10px', color: '#e8f0fe', fontSize: '13px', outline: 'none' }} />
                                <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', color: '#4a6a8a', fontFamily: 'JetBrains Mono', pointerEvents: 'none' }}>{f.unit}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {activeCalc.scored && (
                    <>
                      <div style={{ fontSize: '10px', fontWeight: '700', color: '#4a6a8a', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '10px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                        Clinical Criteria <div style={{ flex: 1, height: '1px', background: '#1a3555' }}></div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '4px' }}>
                        {activeCalc.scored.map(s => (
                          <button key={s.id} onClick={() => handleToggleScore(s.id, s.pts)}
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', border: currentChecked[s.id] ? '1.5px solid rgba(0,229,192,.3)' : '1.5px solid #1a3555', cursor: 'pointer', background: currentChecked[s.id] ? 'rgba(0,229,192,.07)' : '#0e2544', userSelect: 'none', transition: 'all .15s', textAlign: 'left' }}>
                            <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: currentChecked[s.id] ? '2px solid #00e5c0' : '2px solid #1a3555', background: currentChecked[s.id] ? '#00e5c0' : '#050f1e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '10px', fontWeight: '900', color: '#050f1e' }}>
                              {currentChecked[s.id] ? '✓' : ''}
                            </div>
                            <div style={{ flex: 1, fontSize: '12px', color: currentChecked[s.id] ? '#e8f0fe' : '#8aaccc', lineHeight: '1.3' }}>{s.label}</div>
                            <div style={{ fontSize: '11px', fontFamily: 'JetBrains Mono', fontWeight: '700', padding: '2px 7px', borderRadius: '4px', flexShrink: 0, background: s.pts >= 2 ? 'rgba(155,109,255,.15)' : 'rgba(59,158,255,.15)', color: s.pts >= 2 ? '#9b6dff' : '#3b9eff' }}>+{s.pts}</div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  <div style={{ marginTop: '14px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button onClick={handleCompute}
                      style={{ background: '#00e5c0', color: '#050f1e', border: 'none', borderRadius: '8px', padding: '8px 20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>⟳ Calculate</button>
                    <button style={{ background: 'rgba(0,229,192,.08)', border: '1px solid rgba(0,229,192,.25)', borderRadius: '8px', padding: '7px 12px', fontSize: '11px', color: '#00e5c0', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}>⚡ Auto-fill from Patient</button>
                    <button onClick={() => { setCurrentValues({}); setCurrentChecked({}); }}
                      style={{ background: '#0e2544', border: '1px solid #1a3555', borderRadius: '8px', padding: '7px 14px', fontSize: '12px', color: '#8aaccc', cursor: 'pointer' }}>Clear</button>
                  </div>
                </div>

                {/* Results */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {result && band ? (
                    <>
                      {/* Result card */}
                      <div style={{ background: '#081628', border: '1px solid #1a3555', borderRadius: '12px', padding: '16px', animation: 'result-in .3s ease' }}>
                        <div style={{ textAlign: 'center', padding: '16px 0 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
                            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '52px', fontWeight: '600', lineHeight: '1', color: COLOR_MAP[band.color] }}>{formatVal(result.value, result.precision)}</div>
                            <div style={{ fontSize: '14px', color: '#4a6a8a', fontFamily: 'JetBrains Mono' }}>{result.unit}</div>
                          </div>
                          {result.extra && <div style={{ fontSize: '12px', fontFamily: 'JetBrains Mono', color: '#8aaccc', marginTop: '4px' }}>{result.extra}</div>}
                          {result.value2 != null && (
                            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '20px', fontWeight: '600', color: '#3b9eff' }}>{formatVal(result.value2, result.precision)}</div>
                                <div style={{ fontSize: '9px', color: '#2e4a6a', textTransform: 'uppercase', letterSpacing: '.05em', marginTop: '2px' }}>{result.label2}</div>
                              </div>
                            </div>
                          )}
                        </div>
                        <BandStrip calc={activeCalc} value={result.value} />
                        <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0 6px' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', background: `${COLOR_MAP[band.color]}25`, border: `1px solid ${COLOR_MAP[band.color]}60`, color: COLOR_MAP[band.color] }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLOR_MAP[band.color], display: 'inline-block' }}></span>
                            {band.label}
                          </div>
                        </div>
                      </div>

                      {/* Recommendation */}
                      <div style={{ background: '#0e2544', border: '1px solid #1a3555', borderRadius: '8px', padding: '10px 12px' }}>
                        <div style={{ fontSize: '9px', color: '#2e4a6a', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: '700', marginBottom: '5px' }}>Clinical Recommendation</div>
                        <div style={{ fontSize: '12px', color: '#8aaccc', lineHeight: '1.5' }}>{band.rec?.split('\n').map((line, i) => <span key={i}>{line}{i < band.rec.split('\n').length - 1 && <br />}</span>)}</div>
                      </div>

                      {/* Formula */}
                      <div style={{ background: 'rgba(59,158,255,.03)', border: '1px solid rgba(59,158,255,.15)', borderRadius: '8px', padding: '10px 12px' }}>
                        <div style={{ fontSize: '9px', color: '#4a6a8a', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '4px' }}>Formula & Reference</div>
                        <div style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#3b9eff', lineHeight: '1.6' }}>{activeCalc.formula}</div>
                        <div style={{ fontSize: '10px', color: '#2e4a6a', marginTop: '4px', fontStyle: 'italic' }}>{activeCalc.reference}</div>
                      </div>

                      {/* History */}
                      {(history[activeCalcId] || []).length > 1 && (
                        <div style={{ marginTop: '2px' }}>
                          <div style={{ fontSize: '9px', color: '#2e4a6a', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '6px', fontWeight: '700' }}>Previous Results</div>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {(history[activeCalcId] || []).slice(1).map((h, i) => (
                              <div key={i} style={{ background: '#0e2544', border: '1px solid #1a3555', borderRadius: '8px', padding: '5px 10px', fontSize: '10px', cursor: 'pointer' }}>
                                <span style={{ fontFamily: 'JetBrains Mono', fontWeight: '700', color: '#e8f0fe' }}>{formatVal(h.value, 1)}</span>
                                <span style={{ color: '#2e4a6a', marginLeft: '5px' }}>{h.ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                        <button onClick={handleCopy}
                          style={{ background: '#0e2544', border: copied ? '1px solid rgba(0,229,192,.4)' : '1px solid #1a3555', borderRadius: '8px', padding: '6px 12px', fontSize: '11px', color: copied ? '#00e5c0' : '#8aaccc', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', transition: 'all .15s' }}>
                          📋 {copied ? '✓ Copied!' : 'Copy to Note'}
                        </button>
                        <button onClick={() => { setCurrentValues({}); setCurrentChecked({}); }}
                          style={{ background: '#0e2544', border: '1px solid #1a3555', borderRadius: '8px', padding: '6px 12px', fontSize: '11px', color: '#8aaccc', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>↺ Recalculate</button>
                      </div>
                    </>
                  ) : (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', opacity: 0.35, minHeight: '300px' }}>
                      <div style={{ fontSize: '40px' }}>⟳</div>
                      <div style={{ fontSize: '12px', color: '#4a6a8a', textAlign: 'center' }}>Fill in the fields to compute the result</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}