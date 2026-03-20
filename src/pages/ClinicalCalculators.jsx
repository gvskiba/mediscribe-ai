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
    compute: (v) => {
      const bmi = v.weight / Math.pow(v.height / 100, 2);
      return { value: bmi, unit: 'kg/m²', precision: 1 };
    },
    bands: [
      { lt: 18.5, label: 'Underweight', color: 'blue', rec: 'Nutritional assessment recommended. Evaluate for underlying etiology. Consider caloric supplementation and dietitian referral.' },
      { lt: 25, label: 'Normal Weight', color: 'teal', rec: 'Healthy weight range (18.5–24.9). Encourage continued balanced nutrition and regular physical activity.' },
      { lt: 30, label: 'Overweight', color: 'gold', rec: 'Lifestyle modification counseling indicated. Consider dietary assessment, exercise prescription, and metabolic screening.' },
      { lt: 35, label: 'Obese Class I', color: 'orange', rec: 'Obesity management program. Screen for T2DM, HTN, dyslipidemia, NAFLD, OSA. Consider pharmacotherapy.' },
      { lt: 40, label: 'Obese Class II', color: 'coral', rec: 'Intensive behavioral + pharmacological weight management. Bariatric surgery evaluation appropriate.' },
      { lt: Infinity, label: 'Obese Class III', color: 'red', rec: 'Severe obesity. High perioperative and metabolic risk. Multidisciplinary bariatric team evaluation. Surgical risk assessment required.' },
    ],
    formula: 'BMI = Weight (kg) ÷ Height² (m)',
    reference: 'WHO Expert Consultation. Lancet 2004; 363:157–163',
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
      const mult = v.sex === 'F' ? 0.85 : 1.0;
      const crcl = ((140 - v.age) * v.weight) / (72 * v.scr) * mult;
      return { value: Math.max(crcl, 0), unit: 'mL/min', precision: 0 };
    },
    bands: [
      { lt: 15, label: 'G5 — Kidney Failure', color: 'red', rec: 'ESRD. Hold or contraindicate renally-cleared drugs. Nephrology consult urgent. Consider renal replacement therapy.' },
      { lt: 30, label: 'G4 — Severely Reduced', color: 'coral', rec: 'Significant dose reduction required. Nephrology referral. Avoid nephrotoxins.' },
      { lt: 60, label: 'G3 — Moderately Reduced', color: 'orange', rec: 'Adjust doses for aminoglycosides, vancomycin, DOACs. Monitor drug levels.' },
      { lt: 90, label: 'G2 — Mildly Reduced', color: 'gold', rec: 'Most drugs dosed normally. Monitor renal function trends. Avoid chronic NSAID use.' },
      { lt: Infinity, label: 'G1 — Normal / High', color: 'teal', rec: 'Standard dosing appropriate for all renally-cleared medications at usual frequencies.' },
    ],
    formula: 'CrCl = [(140 − Age) × Weight(kg)] ÷ (72 × SCr) × 0.85 if female',
    reference: 'Cockcroft DW, Gault MH. Nephron 1976; 16:31–41',
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
    ],
    compute: (v, checked) => {
      const STROKE = [0, 1.3, 2.2, 3.2, 4.0, 6.7, 9.8, 9.6, 12.5, 15.2];
      const score = Object.values(checked).reduce((s, x) => s + x, 0);
      const risk = STROKE[Math.min(score, 9)];
      return { value: score, unit: 'pts', precision: 0, extra: `${risk}% annual stroke risk` };
    },
    bands: [
      { lt: 1, label: 'Low Risk', color: 'teal', rec: 'Score 0 (male) or 1 (female): Anticoagulation not recommended. Reassess annually or with change in clinical status.' },
      { lt: 2, label: 'Low-Moderate Risk', color: 'gold', rec: 'Score 1 (male): Consider anticoagulation. Evaluate bleeding risk with HAS-BLED.' },
      { lt: Infinity, label: 'Moderate-High Risk', color: 'coral', rec: 'Score ≥2 (male) or ≥3 (female): Oral anticoagulation recommended. DOAC preferred over warfarin.' },
    ],
    formula: 'CHF(1) + HTN(1) + Age≥75(2) + DM(1) + Stroke/TIA(2) + Vascular(1) + Age 65–74(1) + Female(1)',
    reference: 'Lip GY et al. Chest 2010; 137:263–272',
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
      { lt: 9, label: 'Severe TBI', color: 'coral', rec: 'GCS 3–8: Severe TBI. Endotracheal intubation indicated. Neurosurgery consult stat. CT head emergently. Consider ICP monitoring.' },
      { lt: 13, label: 'Moderate TBI', color: 'gold', rec: 'GCS 9–12: Moderate TBI. CT head immediately. ICU admission. Neurological checks q1h.' },
      { lt: 15, label: 'Mild TBI', color: 'blue', rec: 'GCS 13–14: Mild TBI. CT head per protocol. 4–6h observation. Neurology follow-up.' },
      { lt: Infinity, label: 'Normal', color: 'teal', rec: 'GCS 15: Normal level of consciousness.' },
    ],
    formula: 'GCS = Eye (1–4) + Verbal (1–5) + Motor (1–6)  |  Range: 3–15',
    reference: 'Teasdale G, Jennett B. Lancet 1974; 2:81–84',
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
      { lt: 8, label: 'Below Normal', color: 'blue', rec: 'Low AG (<8). Consider hypoalbuminemia, hypercalcemia, hypermagnesemia, lithium toxicity. Calculate corrected AG.' },
      { lt: 12, label: 'Normal', color: 'teal', rec: 'Normal AG (8–12 mEq/L). If acidosis present → non-AG metabolic acidosis.' },
      { lt: 20, label: 'Elevated', color: 'gold', rec: 'Elevated AG (12–20). Evaluate for MUDPILES. Check lactate, ketones, osmolar gap.' },
      { lt: Infinity, label: 'High AG Acidosis', color: 'coral', rec: 'High AG acidosis (>20). Urgent evaluation. Lactate, glucose, ketones, osmolality as indicated.' },
    ],
    formula: 'AG = Na⁺ − (Cl⁻ + HCO₃⁻) | Corrected AG = AG + 2.5 × (4.0 − Albumin)',
    reference: 'Emmett M, Narins RG. Medicine 1977; 56:38–54',
  },
  {
    id: 'meld', name: 'MELD Score', shortName: 'MELD', icon: '🫀', category: 'hepatic',
    description: 'End-stage liver disease — transplant listing priority',
    rangeMin: 6, rangeMax: 40,
    fields: [
      { id: 'bili', label: 'Bilirubin', type: 'number', unit: 'mg/dL', min: 0.1, max: 50, step: 0.1, autofill: p => p.labs?.bilirubin, required: true },
      { id: 'inr', label: 'INR', type: 'number', unit: '', min: 0.5, max: 15, step: 0.01, autofill: p => p.labs?.inr, required: true },
      { id: 'cr', label: 'Creatinine', type: 'number', unit: 'mg/dL', min: 0.1, max: 30, step: 0.01, autofill: p => p.labs?.scr, required: true },
      { id: 'sodium', label: 'Sodium (for MELD-Na)', type: 'number', unit: 'mEq/L', min: 100, max: 160, step: 1, autofill: p => p.labs?.na, required: false },
    ],
    compute: (v) => {
      const bili = Math.max(v.bili, 1);
      const inr = Math.max(v.inr, 1);
      const cr = Math.min(Math.max(v.cr, 1), 4);
      const meld = Math.round(3.78 * Math.log(bili) + 11.2 * Math.log(inr) + 9.57 * Math.log(cr) + 6.43);
      let meldNa = null;
      if (v.sodium) {
        const na = Math.min(Math.max(v.sodium, 125), 137);
        meldNa = Math.round(meld + 1.32 * (137 - na) - (0.033 * meld * (137 - na)));
      }
      return { value: meld, value2: meldNa != null ? meldNa : null, unit: 'pts', precision: 0, label2: meldNa != null ? 'MELD-Na' : null };
    },
    bands: [
      { lt: 10, label: 'Low Priority', color: 'teal', rec: '< 10% 90-day mortality. Optimize medical management. Serial MELD every 3–6 months if on transplant list.' },
      { lt: 20, label: 'Moderate Priority', color: 'gold', rec: '6–19% 90-day mortality. Active transplant workup if not already underway.' },
      { lt: 30, label: 'High Priority', color: 'orange', rec: '19–52% 90-day mortality. Accelerate transplant evaluation. Close monitoring for AKI, HE, variceal bleeding.' },
      { lt: 40, label: 'Very High Priority', color: 'coral', rec: '52–79% 90-day mortality. Urgent transplant listing. SICU management.' },
      { lt: Infinity, label: 'Critical Priority', color: 'red', rec: '> 71% 90-day mortality. Fulminant hepatic failure. Liver transplant listed Status 1A.' },
    ],
    formula: '3.78×ln[Bili] + 11.2×ln[INR] + 9.57×ln[Cr] + 6.43',
    reference: 'Kamath PS et al. Hepatology 2001; 33:464–470',
  },
];

const COLOR_MAP = { teal: '#00e5c0', gold: '#f5c842', orange: '#ff9f43', coral: '#ff6b6b', blue: '#3b9eff', red: '#ff3366' };
const CAT_META = {
  nutrition: { label: 'Nutrition', dotColor: '#00e5c0' },
  renal: { label: 'Renal', dotColor: '#00d4ff' },
  cardiology: { label: 'Cardiology', dotColor: '#ff6b6b' },
  hepatic: { label: 'Hepatic', dotColor: '#ff9f43' },
  labs: { label: 'Labs', dotColor: '#9b6dff' },
  neurology: { label: 'Neurology', dotColor: '#f5c842' },
};

export default function ClinicalCalculators() {
  const { activePatient } = usePatient();
  const [time, setTime] = useState(new Date());
  const [activeCalcId, setActiveCalcId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentValues, setCurrentValues] = useState({});
  const [currentChecked, setCurrentChecked] = useState({});
  const [history, setHistory] = useState({});

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

  const getResult = () => {
    if (!activeCalc) return null;
    try {
      return activeCalc.compute(currentValues, currentChecked);
    } catch {
      return null;
    }
  };

  const result = getResult();
  const band = result && activeCalc ? activeCalc.bands.find(b => result.value < b.lt) || activeCalc.bands[activeCalc.bands.length - 1] : null;

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
    setCurrentChecked(prev => ({
      ...prev,
      [itemId]: prev[itemId] ? 0 : pts
    }));
  };

  const handleCompute = () => {
    if (!activeCalc) return;
    const result = activeCalc.compute(currentValues, currentChecked);
    if (result) {
      setHistory(prev => ({
        ...prev,
        [activeCalcId]: [{ value: result.value, unit: result.unit, ts: new Date() }, ...(prev[activeCalcId] || []).slice(0, 4)]
      }));
    }
  };

  return (
    <div style={{ background: '#050f1e', color: '#e8f0fe', fontFamily: "'DM Sans', sans-serif", minHeight: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        body { margin: 0; padding: 0; }
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type="number"] { -moz-appearance: textfield; }
        @keyframes ai-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.8; } }
      `}</style>

      {/* Icon Sidebar */}
      <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: '65px', background: '#040d19', borderRight: '1px solid #1a3555', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 200, overflowY: 'auto' }}>
        <div style={{ width: '100%', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #1a3555', flexShrink: 0 }}>
          <div style={{ width: '34px', height: '34px', background: '#3b9eff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Playfair Display'", fontSize: '14px', fontWeight: '700', color: 'white', cursor: 'pointer' }}>Calc</div>
        </div>
      </div>

      {/* Navbar */}
      <div style={{ position: 'fixed', top: 0, left: '65px', right: 0, height: '50px', background: '#081628', borderBottom: '1px solid #1a3555', display: 'flex', alignItems: 'center', padding: '0 16px', gap: '10px', zIndex: 100 }}>
        <span style={{ fontSize: '13px', color: '#8aaccc' }}>Welcome, <strong style={{ color: '#e8f0fe' }}>Dr. Gabriel Skiba</strong></span>
        <div style={{ width: '1px', height: '22px', background: '#1a3555' }}></div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#0e2544', border: '1px solid #1a3555', borderRadius: '8px', padding: '4px 12px', minWidth: '70px' }}>
            <span style={{ fontFamily: "'JetBrains Mono'", fontSize: '14px', fontWeight: '600', color: '#e8f0fe' }}>9</span>
            <span style={{ fontSize: '9px', color: '#4a6a8a', textTransform: 'uppercase', letterSpacing: '.04em' }}>Active Pts</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#0e2544', border: '1px solid #1a3555', borderRadius: '8px', padding: '4px 12px', minWidth: '70px' }}>
            <span style={{ fontFamily: "'JetBrains Mono'", fontSize: '14px', fontWeight: '600', color: '#f5c842' }}>3</span>
            <span style={{ fontSize: '9px', color: '#4a6a8a', textTransform: 'uppercase', letterSpacing: '.04em' }}>Notes Pending</span>
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ fontSize: '12px', color: '#8aaccc' }}>Emergency Medicine</div>
          <div style={{ fontSize: '12px', color: '#8aaccc', fontFamily: "'JetBrains Mono'" }}>{String(time.getHours()).padStart(2, '0')}:{String(time.getMinutes()).padStart(2, '0')}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(0,229,192,.08)', border: '1px solid rgba(0,229,192,.3)', borderRadius: '8px', padding: '5px 12px', fontSize: '12px', fontWeight: '600', color: '#00e5c0' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#00e5c0', animation: 'ai-pulse 2s infinite' }}></span> AI ON
          </div>
          <button style={{ background: '#00e5c0', color: '#050f1e', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>+ New Patient</button>
        </div>
      </div>

      {/* Page Layout */}
      <div style={{ display: 'flex', height: 'calc(100vh - 50px)', marginTop: '50px', marginLeft: '65px', overflow: 'hidden' }}>
        {/* Left Picker */}
        <div style={{ width: '272px', background: '#081628', borderRight: '1px solid #1a3555', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '14px', borderBottom: '1px solid #1a3555', flexShrink: 0 }}>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#e8f0fe', marginBottom: '10px', fontFamily: "'Playfair Display'" }}>🧮 Calculators <span style={{ fontSize: '11px', color: '#4a6a8a', fontFamily: "'JetBrains Mono'" }}>({CALCULATORS.length})</span></h2>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px' }}>🔍</span>
              <input
                type="text"
                placeholder="Search calculators..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', background: '#0e2544', border: '1px solid #1a3555', borderRadius: '8px', padding: '7px 10px 7px 32px', color: '#e8f0fe', fontSize: '12px', outline: 'none', fontFamily: "'DM Sans'" }}
              />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px 16px' }}>
            {Object.entries(
              filteredCalcs.reduce((acc, calc) => {
                if (!acc[calc.category]) acc[calc.category] = [];
                acc[calc.category].push(calc);
                return acc;
              }, {})
            ).map(([cat, calcs]) => (
              <div key={cat}>
                <div style={{ fontSize: '9px', color: '#2e4a6a', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: '700', padding: '10px 6px 4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: CAT_META[cat]?.dotColor || '#00e5c0' }}></span>
                  {CAT_META[cat]?.label || cat}
                </div>
                {calcs.map(calc => (
                  <button
                    key={calc.id}
                    onClick={() => handleLoadCalc(calc.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: activeCalcId === calc.id ? '1px solid rgba(59, 158, 255, .25)' : '1px solid transparent',
                      background: activeCalcId === calc.id ? 'rgba(59,158,255,.08)' : 'transparent',
                      marginBottom: '2px',
                      transition: 'all .15s',
                    }}
                  >
                    <div style={{ width: '30px', height: '30px', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', background: 'rgba(0,229,192,.12)' }}>{calc.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#e8f0fe' }}>{calc.shortName}</div>
                      <div style={{ fontSize: '10px', color: '#4a6a8a', marginTop: '1px' }}>{calc.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Main Panel */}
        {!activeCalc ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '40px', textAlign: 'center', background: '#050f1e', overflowY: 'auto' }}>
            <div style={{ fontSize: '40px' }}>🧮</div>
            <div style={{ fontFamily: "'Playfair Display'", fontSize: '22px', fontWeight: '700', color: '#e8f0fe' }}>Clinical Calculators</div>
            <div style={{ fontSize: '13px', color: '#4a6a8a', maxWidth: '420px', lineHeight: '1.6' }}>Evidence-based clinical tools with automatic patient data integration. Select a calculator from the sidebar or choose a quick-start below.</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', width: '100%', maxWidth: '600px', marginTop: '8px' }}>
              {['bmi', 'crcl', 'chadsvasc'].map(id => {
                const c = CALCULATORS.find(x => x.id === id);
                return (
                  <button
                    key={id}
                    onClick={() => handleLoadCalc(id)}
                    style={{
                      background: '#081628',
                      border: '1px solid #1a3555',
                      borderRadius: '12px',
                      padding: '14px',
                      cursor: 'pointer',
                      transition: 'all .18s',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.borderColor = '#2a4f7a';
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 4px 16px rgba(0,0,0,.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.borderColor = '#1a3555';
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ fontSize: '22px', marginBottom: '6px' }}>{c.icon}</div>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#e8f0fe', marginBottom: '3px' }}>{c.shortName}</div>
                    <div style={{ fontSize: '10px', color: '#4a6a8a', lineHeight: '1.4' }}>{c.description}</div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* Inputs */}
            <div style={{ width: '380px', overflowY: 'auto', padding: '16px', borderRight: '1px solid #1a3555', background: '#081628' }}>
              {activeCalc.fields && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: '#4a6a8a', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                    Input Values
                    <div style={{ flex: 1, height: '1px', background: '#1a3555' }}></div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {activeCalc.fields.map(f => (
                      <div key={f.id} style={{ gridColumn: f.type === 'select' && f.opts?.length > 3 ? '1/-1' : 'auto' }}>
                        <label style={{ fontSize: '11px', color: '#8aaccc', display: 'block', marginBottom: '4px', fontWeight: '500' }}>{f.label}</label>
                        {f.type === 'select' ? (
                          <select
                            value={currentValues[f.id] ?? ''}
                            onChange={(e) => handleFieldChange(f.id, e.target.value)}
                            style={{ width: '100%', background: '#0e2544', border: '1.5px solid #1a3555', borderRadius: '8px', padding: '8px 10px', color: '#e8f0fe', fontSize: '13px', outline: 'none', appearance: 'none', cursor: 'pointer', fontFamily: "'DM Sans'" }}
                          >
                            <option value="">— Select —</option>
                            {f.opts?.map(opt => (
                              <option key={opt.v} value={opt.v}>{opt.l}</option>
                            ))}
                          </select>
                        ) : (
                          <div style={{ position: 'relative' }}>
                            <input
                              type="number"
                              min={f.min}
                              max={f.max}
                              step={f.step}
                              value={currentValues