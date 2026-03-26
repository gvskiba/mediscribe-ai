import React, { useState, useEffect, useRef, useCallback } from "react";

/* ─────────────────────────────────────────────
   DESIGN TOKENS — mirrors Layout shell exactly
───────────────────────────────────────────── */
const T = {
  bg:       '#050f1e',
  panel:    '#081628',
  card:     '#0b1e36',
  up:       '#0e2544',
  border:   '#1a3555',
  borderHi: '#2a4f7a',
  blue:     '#3b9eff',
  teal:     '#00e5c0',
  gold:     '#f5c842',
  coral:    '#ff6b6b',
  orange:   '#ff9f43',
  txt:      '#e8f0fe',
  txt2:     '#8aaccc',
  txt3:     '#4a6a8a',
  txt4:     '#2e4a6a',
};

const DRUG_DB = [
  {
    id: 'amoxicillin',
    name: 'Amoxicillin',
    category: 'Antibiotic',
    color: T.blue,
    icon: '💊',
    ped: {
      concentration_mg_per_ml: 50,
      concentration_label: '250 mg/5 mL susp',
      max_single_dose_mg: 500,
      max_daily_dose_mg_per_kg: 90,
      route: 'PO',
    },
    indications: [
      { id: 'oti', label: 'Otitis Media', dose_per_kg: 40, freq: 'q12h', duration: '10 days', unit: 'mg/kg/day', notes: 'High-dose for resistant strains' },
      { id: 'phar', label: 'Pharyngitis / Strep', dose_per_kg: 25, freq: 'q12h', duration: '10 days', unit: 'mg/kg/day', notes: 'Max 500 mg/dose' },
      { id: 'pneu', label: 'Community Pneumonia', dose_per_kg: 90, freq: 'q8h', duration: '5–7 days', unit: 'mg/kg/day', notes: 'High-dose protocol — divide by frequency' },
      { id: 'uti', label: 'UTI (uncomplicated)', dose_per_kg: 20, freq: 'q8h', duration: '7 days', unit: 'mg/kg/day', notes: 'Verify local sensitivity patterns' },
    ],
  },
  {
    id: 'azithromycin',
    name: 'Azithromycin',
    category: 'Macrolide',
    color: T.teal,
    icon: '🔵',
    ped: {
      concentration_mg_per_ml: 40,
      concentration_label: '200 mg/5 mL susp',
      max_single_dose_mg: 500,
      max_daily_dose_mg_per_kg: 10,
      route: 'PO',
    },
    indications: [
      { id: 'ati', label: 'Atypical Pneumonia', dose_per_kg: 10, freq: 'qDay × 5', duration: '5 days', unit: 'mg/kg/day', notes: 'Day 1: 10 mg/kg, Days 2–5: 5 mg/kg' },
      { id: 'sin', label: 'Sinusitis', dose_per_kg: 10, freq: 'qDay × 3', duration: '3 days', unit: 'mg/kg/day', notes: 'Max 500 mg/dose' },
      { id: 'phar2', label: 'Strep Pharyngitis (PCN allergy)', dose_per_kg: 12, freq: 'qDay × 5', duration: '5 days', unit: 'mg/kg/day', notes: 'For penicillin-allergic patients' },
    ],
  },
  {
    id: 'ibuprofen',
    name: 'Ibuprofen',
    category: 'NSAID / Analgesic',
    color: T.orange,
    icon: '🟠',
    ped: {
      concentration_mg_per_ml: 20,
      concentration_label: '100 mg/5 mL susp',
      max_single_dose_mg: 400,
      max_daily_dose_mg_per_kg: 40,
      route: 'PO',
    },
    indications: [
      { id: 'fever', label: 'Fever', dose_per_kg: 10, freq: 'q6–8h PRN', duration: 'PRN', unit: 'mg/kg/dose', notes: 'Max 400 mg/dose. ≥ 6 mo of age.' },
      { id: 'pain', label: 'Mild–Moderate Pain', dose_per_kg: 10, freq: 'q6–8h PRN', duration: 'PRN', unit: 'mg/kg/dose', notes: 'Max 400 mg/dose' },
      { id: 'jia', label: 'JIA / Inflammatory', dose_per_kg: 30, freq: 'q6h', duration: 'As directed', unit: 'mg/kg/day', notes: 'Divide into 3–4 doses/day' },
    ],
  },
  {
    id: 'acetaminophen',
    name: 'Acetaminophen',
    category: 'Analgesic / Antipyretic',
    color: T.gold,
    icon: '🟡',
    ped: {
      concentration_mg_per_ml: 32,
      concentration_label: '160 mg/5 mL susp',
      max_single_dose_mg: 1000,
      max_daily_dose_mg_per_kg: 75,
      route: 'PO',
    },
    indications: [
      { id: 'fev2', label: 'Fever', dose_per_kg: 15, freq: 'q4–6h PRN', duration: 'PRN', unit: 'mg/kg/dose', notes: 'Max 1000 mg/dose; max 5 doses/day' },
      { id: 'pain2', label: 'Pain (mild)', dose_per_kg: 15, freq: 'q4–6h', duration: 'PRN', unit: 'mg/kg/dose', notes: 'Max 4 g/day total' },
    ],
  },
  {
    id: 'ceftriaxone',
    name: 'Ceftriaxone',
    category: 'Cephalosporin',
    color: '#b06aff',
    icon: '💉',
    ped: {
      concentration_mg_per_ml: 100,
      concentration_label: '1g/10 mL reconstituted',
      max_single_dose_mg: 2000,
      max_daily_dose_mg_per_kg: 100,
      route: 'IV/IM',
    },
    indications: [
      { id: 'men', label: 'Meningitis', dose_per_kg: 100, freq: 'q12h', duration: '7–21 days', unit: 'mg/kg/day', notes: 'Divide into 2 doses. Max 4 g/day.' },
      { id: 'sepsis', label: 'Sepsis / Bacteremia', dose_per_kg: 50, freq: 'qDay', duration: 'Per culture', unit: 'mg/kg/day', notes: 'Single daily dose. Max 2 g.' },
      { id: 'pneu2', label: 'CAP (hospitalized)', dose_per_kg: 50, freq: 'qDay', duration: '5–7 days', unit: 'mg/kg/day', notes: 'Max 2 g/day' },
      { id: 'oti2', label: 'Otitis Media (1-dose)', dose_per_kg: 50, freq: 'Single dose', duration: '1 day', unit: 'mg/kg', notes: 'IM. Max 1 g. For non-adherence cases.' },
    ],
  },
  {
    id: 'prednisolone',
    name: 'Prednisolone',
    category: 'Corticosteroid',
    color: T.coral,
    icon: '🔴',
    ped: {
      concentration_mg_per_ml: 3,
      concentration_label: '15 mg/5 mL soln',
      max_single_dose_mg: 60,
      max_daily_dose_mg_per_kg: 2,
      route: 'PO',
    },
    indications: [
      { id: 'asth', label: 'Asthma Exacerbation', dose_per_kg: 1, freq: 'qDay × 3–5', duration: '3–5 days', unit: 'mg/kg/day', notes: 'Max 40 mg/day. Taper if > 5 days.' },
      { id: 'croup', label: 'Croup', dose_per_kg: 0.6, freq: 'Single dose', duration: '1 day', unit: 'mg/kg', notes: 'Max 10 mg. Alternative: dexamethasone.' },
      { id: 'neph', label: 'Nephrotic Syndrome', dose_per_kg: 2, freq: 'qDay', duration: '4–6 weeks', unit: 'mg/kg/day', notes: 'Max 60 mg/day. Long taper follows.' },
    ],
  },
  {
    id: 'albuterol',
    name: 'Albuterol (Salbutamol)',
    category: 'Bronchodilator',
    color: '#44d7a8',
    icon: '🌀',
    ped: {
      concentration_mg_per_ml: 1,
      concentration_label: '2.5 mg/2.5 mL nebule',
      max_single_dose_mg: 5,
      max_daily_dose_mg_per_kg: null,
      route: 'INH',
    },
    indications: [
      { id: 'asth2', label: 'Acute Asthma (mild)', dose_per_kg: 0.15, freq: 'q20 min × 3', duration: 'PRN', unit: 'mg/kg/dose', notes: 'Min 2.5 mg/dose. Max 5 mg/dose.' },
      { id: 'bronch', label: 'Bronchospasm', dose_per_kg: 0.1, freq: 'q4–6h PRN', duration: 'PRN', unit: 'mg/kg/dose', notes: 'Via MDI preferred for maintenance.' },
    ],
  },
  {
    id: 'amoxclav',
    name: 'Amoxicillin-Clavulanate',
    category: 'Antibiotic (β-lactam combo)',
    color: '#3b9eff',
    icon: '💊',
    ped: {
      concentration_mg_per_ml: 40,
      concentration_label: '200/28.5 mg/5 mL susp',
      max_single_dose_mg: 875,
      max_daily_dose_mg_per_kg: 90,
      route: 'PO',
    },
    indications: [
      { id: 'oti3', label: 'Otitis Media (resistant)', dose_per_kg: 90, freq: 'q12h', duration: '10 days', unit: 'mg/kg/day (amox)', notes: 'High-dose. Use 14:1 formulation.' },
      { id: 'sin2', label: 'Sinusitis (bacterial)', dose_per_kg: 45, freq: 'q12h', duration: '10–14 days', unit: 'mg/kg/day', notes: 'Standard dosing' },
      { id: 'bite', label: 'Animal / Human Bite', dose_per_kg: 40, freq: 'q8h', duration: '5–7 days', unit: 'mg/kg/day', notes: 'Max 875 mg amoxicillin/dose' },
    ],
  },
];

const WEIGHT_UNITS = [
  { id: 'kg', label: 'kg', factor: 1 },
  { id: 'lbs', label: 'lbs', factor: 0.453592 },
];

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.dc-search-wrap { position: relative; }
.dc-search {
  width: 100%; background: #0b1e36; border: 1px solid #1a3555;
  border-radius: 10px; padding: 11px 16px 11px 42px;
  font-family: 'DM Sans', sans-serif; font-size: 14px; color: #e8f0fe;
  outline: none; transition: border-color 0.2s;
}
.dc-search::placeholder { color: #4a6a8a; }
.dc-search:focus { border-color: #3b9eff; box-shadow: 0 0 0 2px rgba(59,158,255,0.1); }
.dc-search-icon {
  position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
  font-size: 15px; pointer-events: none; color: #4a6a8a;
}
.dc-search-clear {
  position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  background: #1a3555; border: none; border-radius: 4px; color: #8aaccc;
  width: 20px; height: 20px; cursor: pointer; font-size: 11px;
  display: flex; align-items: center; justify-content: center;
}
.dc-search-clear:hover { background: #2a4f7a; color: #e8f0fe; }

.dc-drug-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;
}
.dc-drug-card {
  background: #0b1e36; border: 1px solid #1a3555; border-radius: 10px;
  padding: 14px; cursor: pointer; transition: all 0.18s;
  display: flex; flex-direction: column; gap: 6px; user-select: none;
  position: relative; overflow: hidden;
}
.dc-drug-card::before {
  content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
  background: var(--drug-color, #1a3555); border-radius: 10px 0 0 10px;
  transition: width 0.18s;
}
.dc-drug-card:hover { border-color: #2a4f7a; transform: translateY(-1px); }
.dc-drug-card:hover::before { width: 4px; }
.dc-drug-card.selected { border-color: var(--drug-color, #3b9eff); background: #0e2544; }
.dc-drug-card.selected::before { width: 4px; }
.dc-drug-name { font-family: 'DM Sans', sans-serif; font-weight: 600; font-size: 13px; color: #e8f0fe; padding-left: 8px; }
.dc-drug-cat  { font-size: 10px; color: #4a6a8a; padding-left: 8px; }
.dc-drug-meta { display: flex; align-items: center; gap: 5px; padding-left: 8px; margin-top: 2px; }
.dc-drug-route { font-family: 'JetBrains Mono', monospace; font-size: 9px; font-weight: 600; padding: 1px 6px; border-radius: 3px; }
.dc-drug-conc { font-size: 9px; color: #4a6a8a; }

.dc-panel { background: #081628; border: 1px solid #1a3555; border-radius: 12px; overflow: hidden; }
.dc-panel-body { padding: 18px; }

.dc-ind-tabs { display: flex; flex-wrap: wrap; gap: 6px; }
.dc-ind-tab {
  background: #0e2544; border: 1px solid #1a3555; border-radius: 6px;
  padding: 6px 12px; cursor: pointer; font-size: 12px; color: #8aaccc;
  transition: all 0.15s; white-space: nowrap; font-family: 'DM Sans', sans-serif;
}
.dc-ind-tab:hover { border-color: #2a4f7a; color: #e8f0fe; }
.dc-ind-tab.active { color: #050f1e; border-color: transparent; font-weight: 600; }

.dc-input-row { display: flex; gap: 12px; align-items: flex-end; }
.dc-field { display: flex; flex-direction: column; gap: 5px; flex: 1; }
.dc-label { font-size: 11px; color: #4a6a8a; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; font-family: 'DM Sans', sans-serif; }
.dc-input-wrap { display: flex; border: 1px solid #1a3555; border-radius: 8px; overflow: hidden; transition: border-color 0.2s; background: #0b1e36; }
.dc-input-wrap:focus-within { border-color: #3b9eff; box-shadow: 0 0 0 2px rgba(59,158,255,0.08); }
.dc-input {
  flex: 1; background: transparent; border: none; padding: 9px 12px;
  font-family: 'JetBrains Mono', monospace; font-size: 15px; font-weight: 600; color: #e8f0fe;
  outline: none; min-width: 0;
}
.dc-input::placeholder { color: #2e4a6a; font-weight: 400; }
.dc-input-unit {
  background: #0e2544; border-left: 1px solid #1a3555; padding: 9px 10px;
  font-size: 11px; color: #4a6a8a; white-space: nowrap; display: flex; align-items: center;
}
.dc-unit-toggle { display: flex; }
.dc-unit-btn {
  background: #0e2544; border: none; padding: 9px 10px;
  font-size: 11px; color: #4a6a8a; cursor: pointer; transition: all 0.15s;
  border-left: 1px solid #1a3555; white-space: nowrap; font-family: 'DM Sans', sans-serif;
}
.dc-unit-btn:first-child { border-left: none; }
.dc-unit-btn.active { background: #3b9eff; color: #050f1e; font-weight: 700; }

.dc-result {
  background: linear-gradient(135deg, #081628 0%, #0b1e36 100%);
  border: 1px solid #1a3555; border-radius: 12px;
  padding: 24px; position: relative; overflow: hidden;
}
.dc-result::before {
  content: ''; position: absolute; inset: 0;
  background: radial-gradient(ellipse at top left, rgba(0,229,192,0.05) 0%, transparent 60%);
  pointer-events: none;
}
.dc-result-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.dc-result-item {
  background: #0e2544; border: 1px solid #1a3555; border-radius: 10px;
  padding: 16px; position: relative; overflow: hidden;
}
.dc-result-item.primary { border-color: rgba(0,229,192,0.3); }
.dc-result-item.secondary { border-color: rgba(59,158,255,0.2); }
.dc-result-lbl { font-size: 10px; color: #4a6a8a; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 8px; }
.dc-result-val {
  font-family: 'JetBrains Mono', monospace; font-size: 32px; font-weight: 600;
  line-height: 1; letter-spacing: -0.02em;
}
.dc-result-val.primary { color: #00e5c0; text-shadow: 0 0 20px rgba(0,229,192,0.3); }
.dc-result-val.secondary { color: #3b9eff; text-shadow: 0 0 20px rgba(59,158,255,0.2); }
.dc-result-unit { font-size: 14px; font-weight: 400; color: #4a6a8a; margin-left: 4px; }
.dc-result-sub { font-size: 11px; color: #4a6a8a; margin-top: 6px; }
.dc-result-warn {
  background: rgba(245,200,66,0.08); border: 1px solid rgba(245,200,66,0.3);
  border-radius: 8px; padding: 10px 14px; margin-top: 14px;
  font-size: 12px; color: #f5c842; display: flex; align-items: flex-start; gap: 8px;
}
.dc-result-note {
  background: rgba(59,158,255,0.06); border: 1px solid rgba(59,158,255,0.15);
  border-radius: 8px; padding: 10px 14px; margin-top: 10px;
  font-size: 12px; color: #8aaccc; display: flex; align-items: flex-start; gap: 8px;
}
.dc-max-badge {
  background: rgba(255,107,107,0.12); border: 1px solid rgba(255,107,107,0.3);
  border-radius: 6px; padding: 2px 8px; font-family: 'JetBrains Mono', monospace;
  font-size: 10px; color: #ff6b6b; display: inline-block; margin-top: 6px;
}

.dc-breakdown {
  background: #0b1e36; border: 1px solid #1a3555; border-radius: 10px;
  padding: 14px; margin-top: 16px; font-family: 'JetBrains Mono', monospace;
}
.dc-breakdown-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 5px 0; font-size: 12px; color: #4a6a8a; border-bottom: 1px solid #1a3555;
}
.dc-breakdown-row:last-child { border-bottom: none; padding-bottom: 0; }
.dc-breakdown-row .v { color: #8aaccc; font-weight: 600; }
.dc-breakdown-row .v.hi { color: #00e5c0; }

.dc-info-pills { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.dc-pill {
  background: #0e2544; border: 1px solid #1a3555; border-radius: 20px;
  padding: 3px 10px; font-size: 10px; color: #8aaccc; display: flex; align-items: center; gap: 4px;
}
.dc-pill .k { color: #4a6a8a; }

.dc-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 40px; gap: 10px; color: #2e4a6a; text-align: center;
}
.dc-empty-icon { font-size: 36px; opacity: 0.4; }
.dc-empty-txt { font-size: 13px; }

.dc-sec-hdr { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.dc-sec-title { font-family: 'Playfair Display', serif; font-size: 15px; font-weight: 600; color: #e8f0fe; }
.dc-sec-line { flex: 1; height: 1px; background: #1a3555; }
.dc-sec-badge {
  font-family: 'JetBrains Mono', monospace; font-size: 9px; background: #0e2544;
  border: 1px solid #1a3555; border-radius: 4px; padding: 2px 6px; color: #4a6a8a;
}

.dc-reset-btn {
  background: #0e2544; border: 1px solid #1a3555; border-radius: 6px;
  padding: 5px 12px; font-size: 11px; color: #4a6a8a; cursor: pointer;
  transition: all 0.15s; font-family: 'DM Sans', sans-serif;
}
.dc-reset-btn:hover { border-color: #2a4f7a; color: #8aaccc; }

.dc-hist-list { display: flex; flex-direction: column; gap: 6px; }
.dc-hist-item {
  background: #0b1e36; border: 1px solid #1a3555; border-radius: 8px;
  padding: 10px 14px; display: flex; align-items: center; gap: 10px;
  font-size: 12px; cursor: pointer; transition: border-color 0.15s;
}
.dc-hist-item:hover { border-color: #2a4f7a; }
.dc-hist-drug { font-weight: 600; color: #e8f0fe; }
.dc-hist-ind { color: #4a6a8a; }
.dc-hist-dose { font-family: 'JetBrains Mono', monospace; color: #00e5c0; margin-left: auto; font-weight: 600; font-size: 11px; }
.dc-hist-vol  { font-family: 'JetBrains Mono', monospace; color: #3b9eff; font-size: 11px; }

.dc-conc-row { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
.dc-conc-label { font-size: 10px; color: #4a6a8a; white-space: nowrap; }
.dc-conc-input {
  width: 80px; background: #0b1e36; border: 1px solid #1a3555; border-radius: 6px;
  padding: 5px 8px; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #e8f0fe;
  outline: none; transition: border-color 0.15s;
}
.dc-conc-input:focus { border-color: #3b9eff; }
.dc-conc-reset { font-size: 10px; color: #3b9eff; cursor: pointer; text-decoration: underline; }

.fade-in { animation: fadeIn 0.25s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
`;

function roundToDecimal(n, d = 1) {
  return Math.round(n * Math.pow(10, d)) / Math.pow(10, d);
}

function calcDose(drug, indication, weightKg) {
  if (!drug || !indication || !weightKg || weightKg <= 0) return null;
  const dosePerKg = indication.dose_per_kg;
  const maxSingle = drug.ped.max_single_dose_mg;
  let rawMg = dosePerKg * weightKg;
  let cappedByMax = false;
  if (rawMg > maxSingle) { rawMg = maxSingle; cappedByMax = true; }
  const finalMg = roundToDecimal(rawMg, 1);
  const concMl  = drug.ped.concentration_mg_per_ml;
  const volMl   = roundToDecimal(finalMg / concMl, 1);
  return {
    finalMg, volMl, cappedByMax,
    weightedMgPerKg: roundToDecimal(dosePerKg, 1),
    calculatedMgBeforeCap: roundToDecimal(dosePerKg * weightKg, 1),
    concMl,
    freq: indication.freq, duration: indication.duration,
    route: drug.ped.route, notes: indication.notes,
    concLabel: drug.ped.concentration_label,
  };
}

export default function PediatricDosingCalculator() {
  const [query, setQuery]               = useState('');
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [selectedInd, setSelectedInd]   = useState(null);
  const [weightVal, setWeightVal]       = useState('');
  const [weightUnit, setWeightUnit]     = useState('kg');
  const [ageYears, setAgeYears]         = useState('');
  const [ageMonths, setAgeMonths]       = useState('');
  const [concOverride, setConcOverride] = useState(null);
  const [history, setHistory]           = useState([]);
  const searchRef = useRef(null);

  const weightKg = weightVal
    ? parseFloat(weightVal) * (WEIGHT_UNITS.find(u => u.id === weightUnit)?.factor ?? 1)
    : null;

  const filtered = DRUG_DB.filter(d =>
    !query || d.name.toLowerCase().includes(query.toLowerCase()) ||
    d.category.toLowerCase().includes(query.toLowerCase())
  );

  const selectDrug = (drug) => {
    setSelectedDrug(drug);
    setSelectedInd(null);
    setConcOverride(null);
  };

  const effectiveDrug = selectedDrug && concOverride != null
    ? { ...selectedDrug, ped: { ...selectedDrug.ped, concentration_mg_per_ml: concOverride } }
    : selectedDrug;

  const result = calcDose(effectiveDrug, selectedInd, weightKg);

  const saveToHistory = () => {
    if (!result || !selectedDrug || !selectedInd) return;
    setHistory(prev => [
      {
        drug: selectedDrug.name, ind: selectedInd.label,
        mg: result.finalMg, ml: result.volMl,
        weight: `${weightKg?.toFixed(1)} kg`,
        ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      ...prev.slice(0, 9),
    ]);
  };

  const applyHistory = (item) => {
    const drug = DRUG_DB.find(d => d.name === item.drug);
    if (!drug) return;
    setSelectedDrug(drug);
    const ind = drug.indications.find(i => i.label === item.ind);
    if (ind) setSelectedInd(ind);
  };

  const indicatorColor = selectedDrug?.color ?? T.blue;

  return (
    <>
      <style>{CSS}</style>

      {/* PAGE HEADER */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 4 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: `linear-gradient(135deg, ${T.teal} 0%, ${T.blue} 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, flexShrink: 0, boxShadow: `0 4px 14px rgba(0,229,192,0.25)`,
          }}>⚖️</div>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: T.txt }}>
              Pediatric Dosing Calculator
            </div>
            <div style={{ fontSize: 12, color: T.txt3, marginTop: 2 }}>
              Weight-based dosing · Concentration-aware · Indication-specific
            </div>
          </div>
          {result && (
            <button
              onClick={saveToHistory}
              style={{
                marginLeft: 'auto', background: 'rgba(0,229,192,0.1)',
                border: '1px solid rgba(0,229,192,0.3)', borderRadius: 7,
                padding: '7px 16px', color: T.teal, fontSize: 12, fontWeight: 700,
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              }}
            >📌 Save to Log</button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, alignItems: 'start' }}>

        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* DRUG SEARCH */}
          <div>
            <div className="dc-sec-hdr">
              <span className="dc-sec-title">Select Drug</span>
              <span className="dc-sec-badge">{filtered.length} available</span>
              <div className="dc-sec-line" />
            </div>
            <div className="dc-search-wrap" style={{ marginBottom: 14 }}>
              <span className="dc-search-icon">🔍</span>
              <input
                ref={searchRef}
                className="dc-search"
                placeholder="Search by drug name or category…"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
              {query && <button className="dc-search-clear" onClick={() => setQuery('')}>✕</button>}
            </div>
            <div className="dc-drug-grid">
              {filtered.length === 0 && (
                <div className="dc-empty" style={{ gridColumn: '1/-1' }}>
                  <div className="dc-empty-icon">💊</div>
                  <div className="dc-empty-txt">No drugs match "{query}"</div>
                </div>
              )}
              {filtered.map(drug => (
                <div
                  key={drug.id}
                  className={`dc-drug-card${selectedDrug?.id === drug.id ? ' selected' : ''}`}
                  style={{ '--drug-color': drug.color }}
                  onClick={() => selectDrug(drug)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 8 }}>
                    <span style={{ fontSize: 18 }}>{drug.icon}</span>
                    <div>
                      <div className="dc-drug-name" style={{ paddingLeft: 0 }}>{drug.name}</div>
                      <div className="dc-drug-cat" style={{ paddingLeft: 0 }}>{drug.category}</div>
                    </div>
                  </div>
                  <div className="dc-drug-meta">
                    <span className="dc-drug-route" style={{ background: `${drug.color}22`, color: drug.color, border: `1px solid ${drug.color}44` }}>
                      {drug.ped.route}
                    </span>
                    <span className="dc-drug-conc">{drug.ped.concentration_label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* INDICATION */}
          {selectedDrug && (
            <div className="fade-in">
              <div className="dc-sec-hdr">
                <span className="dc-sec-title">Indication</span>
                <div className="dc-sec-line" />
                <span className="dc-sec-badge">{selectedDrug.indications.length} options</span>
              </div>
              <div className="dc-ind-tabs">
                {selectedDrug.indications.map(ind => (
                  <button
                    key={ind.id}
                    className={`dc-ind-tab${selectedInd?.id === ind.id ? ' active' : ''}`}
                    style={selectedInd?.id === ind.id ? { background: selectedDrug.color, color: '#050f1e' } : {}}
                    onClick={() => setSelectedInd(ind)}
                  >
                    {ind.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PATIENT INPUTS */}
          {selectedDrug && selectedInd && (
            <div className="fade-in">
              <div className="dc-sec-hdr">
                <span className="dc-sec-title">Patient Parameters</span>
                <div className="dc-sec-line" />
                <button className="dc-reset-btn" onClick={() => { setWeightVal(''); setAgeYears(''); setAgeMonths(''); }}>
                  ↺ Clear
                </button>
              </div>
              <div className="dc-input-row" style={{ marginBottom: 12 }}>
                <div className="dc-field">
                  <label className="dc-label">Body Weight</label>
                  <div className="dc-input-wrap">
                    <input className="dc-input" type="number" min="0" step="0.1" placeholder="0.0" value={weightVal} onChange={e => setWeightVal(e.target.value)} />
                    <div className="dc-unit-toggle">
                      {WEIGHT_UNITS.map(u => (
                        <button key={u.id} className={`dc-unit-btn${weightUnit === u.id ? ' active' : ''}`} onClick={() => setWeightUnit(u.id)}>{u.label}</button>
                      ))}
                    </div>
                  </div>
                  {weightKg && weightUnit === 'lbs' && (
                    <div style={{ fontSize: 11, color: T.txt3, marginTop: 4, fontFamily: "'JetBrains Mono'" }}>= {weightKg.toFixed(2)} kg</div>
                  )}
                </div>
                <div className="dc-field">
                  <label className="dc-label">Age (years)</label>
                  <div className="dc-input-wrap">
                    <input className="dc-input" type="number" min="0" step="1" placeholder="0" value={ageYears} onChange={e => setAgeYears(e.target.value)} />
                    <div className="dc-input-unit">yr</div>
                  </div>
                </div>
                <div className="dc-field" style={{ maxWidth: 120 }}>
                  <label className="dc-label">+ Months</label>
                  <div className="dc-input-wrap">
                    <input className="dc-input" type="number" min="0" max="11" step="1" placeholder="0" value={ageMonths} onChange={e => setAgeMonths(e.target.value)} />
                    <div className="dc-input-unit">mo</div>
                  </div>
                </div>
              </div>
              <div className="dc-conc-row">
                <span className="dc-conc-label">Concentration override:</span>
                <input
                  className="dc-conc-input" type="number" min="0" step="0.1"
                  placeholder={selectedDrug.ped.concentration_mg_per_ml}
                  value={concOverride ?? ''}
                  onChange={e => setConcOverride(e.target.value === '' ? null : parseFloat(e.target.value))}
                />
                <span className="dc-conc-label">mg/mL</span>
                {concOverride != null
                  ? <span className="dc-conc-reset" onClick={() => setConcOverride(null)}>reset to default</span>
                  : <span style={{ fontSize: 10, color: T.txt3 }}>Default: <b style={{ color: T.txt2 }}>{selectedDrug.ped.concentration_mg_per_ml} mg/mL</b> ({selectedDrug.ped.concentration_label})</span>
                }
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 20 }}>

          {result ? (
            <div className="dc-result fade-in">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: indicatorColor, boxShadow: `0 0 8px ${indicatorColor}` }} />
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 600, color: T.txt }}>{selectedDrug.name}</span>
                <span style={{ fontSize: 11, color: T.txt3 }}>·</span>
                <span style={{ fontSize: 12, color: T.txt2 }}>{selectedInd.label}</span>
              </div>
              <div className="dc-result-grid">
                <div className="dc-result-item primary">
                  <div className="dc-result-lbl">Dose</div>
                  <div className="dc-result-val primary">{result.finalMg}<span className="dc-result-unit">mg</span></div>
                  <div className="dc-result-sub">{result.weightedMgPerKg} mg/kg · {weightKg?.toFixed(1)} kg</div>
                  {result.cappedByMax && <div className="dc-max-badge">⚠ Capped at max {selectedDrug.ped.max_single_dose_mg} mg</div>}
                </div>
                <div className="dc-result-item secondary">
                  <div className="dc-result-lbl">Volume</div>
                  <div className="dc-result-val secondary">{result.volMl}<span className="dc-result-unit">mL</span></div>
                  <div className="dc-result-sub">
                    via {effectiveDrug.ped.concentration_mg_per_ml} mg/mL
                    {concOverride != null && <span style={{ color: T.orange }}> (custom)</span>}
                  </div>
                </div>
              </div>
              <div className="dc-breakdown">
                {[
                  ['Formula', `${result.weightedMgPerKg} mg/kg × ${weightKg?.toFixed(2)} kg = ${result.calculatedMgBeforeCap} mg`],
                  ['Final dose', `${result.finalMg} mg${result.cappedByMax ? ' (max cap applied)' : ''}`],
                  ['Volume', `${result.finalMg} mg ÷ ${result.concMl} mg/mL = ${result.volMl} mL`],
                  ['Frequency', result.freq],
                  ['Route', result.route],
                  ['Duration', result.duration],
                ].map(([k, v]) => (
                  <div className="dc-breakdown-row" key={k}>
                    <span>{k}</span>
                    <span className={`v${k === 'Final dose' || k === 'Volume' ? ' hi' : ''}`}>{v}</span>
                  </div>
                ))}
              </div>
              {result.notes && (
                <div className="dc-result-note" style={{ marginTop: 14 }}>
                  <span>ℹ️</span><span>{result.notes}</span>
                </div>
              )}
              {result.cappedByMax && (
                <div className="dc-result-warn">
                  <span>⚠️</span>
                  <span>Weight-based calc gave <strong>{result.calculatedMgBeforeCap} mg</strong>, but exceeds max single dose of <strong>{selectedDrug.ped.max_single_dose_mg} mg</strong>. Dose capped.</span>
                </div>
              )}
              <div className="dc-info-pills">
                <div className="dc-pill"><span className="k">Form:</span>{result.concLabel}</div>
                <div className="dc-pill"><span className="k">Dose unit:</span>{selectedInd.unit}</div>
                {ageYears && <div className="dc-pill"><span className="k">Age:</span>{ageYears}y{ageMonths ? ` ${ageMonths}mo` : ''}</div>}
              </div>
            </div>
          ) : (
            <div className="dc-panel">
              <div className="dc-empty" style={{ minHeight: 260 }}>
                <div className="dc-empty-icon">⚖️</div>
                <div className="dc-empty-txt" style={{ color: T.txt3 }}>
                  {!selectedDrug ? 'Select a drug to begin' : !selectedInd ? 'Choose an indication' : 'Enter patient weight'}
                </div>
              </div>
            </div>
          )}

          {history.length > 0 && (
            <div>
              <div className="dc-sec-hdr">
                <span style={{ font: "600 13px 'DM Sans'", color: T.txt2 }}>Recent Calculations</span>
                <div className="dc-sec-line" />
                <button className="dc-reset-btn" onClick={() => setHistory([])}>Clear</button>
              </div>
              <div className="dc-hist-list">
                {history.map((item, i) => (
                  <div key={i} className="dc-hist-item" onClick={() => applyHistory(item)}>
                    <div>
                      <div className="dc-hist-drug">{item.drug}</div>
                      <div className="dc-hist-ind">{item.ind} · {item.weight}</div>
                    </div>
                    <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                      <div className="dc-hist-dose">{item.mg} mg</div>
                      <div className="dc-hist-vol">{item.ml} mL</div>
                    </div>
                    <div style={{ fontSize: 10, color: T.txt4, flexShrink: 0 }}>{item.ts}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{
            background: '#0b1e36', border: `1px solid ${T.border}`,
            borderRadius: 8, padding: '10px 14px', fontSize: 10, color: T.txt3, lineHeight: 1.6,
          }}>
            ⚕️ <strong style={{ color: T.txt4 }}>Clinical Reminder:</strong> All dosing must be verified
            against current formulary references, patient-specific factors (renal/hepatic function, allergies),
            and attending physician orders. This tool assists but does not replace clinical judgment.
          </div>
        </div>
      </div>
    </>
  );
}