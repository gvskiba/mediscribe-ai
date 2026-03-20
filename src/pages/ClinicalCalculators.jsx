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
    reference: 'Lip GY et al. Chest 2010; 137:263–272 | ESC AF Guidelines 2020',
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
];

const COLOR_MAP = { teal: '#00e5c0', gold: '#f5c842', orange: '#ff9f43', coral: '#ff6b6b', blue: '#3b9eff', red: '#ff3366' };
const CAT_META = {
  nutrition: { label: 'Nutrition', dotColor: '#00e5c0' },
  renal: { label: 'Renal', dotColor: '#00d4ff' },
  cardiology: { label: 'Cardiology', dotColor: '#ff6b6b' },
  neurology: { label: 'Neurology', dotColor: '#f5c842' },
};

export default function ClinicalCalculators() {
  const { activePatient } = usePatient();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCalcId, setActiveCalcId] = useState('bmi');
  const [currentValues, setCurrentValues] = useState({});
  const [currentChecked, setCurrentChecked] = useState({});
  const [history, setHistory] = useState({});
  const [time, setTime] = useState(new Date());

  const activeCalc = CALCULATORS.find(c => c.id === activeCalcId);
  const filteredCalcs = CALCULATORS.filter(c =>
    !searchTerm || c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.shortName.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const compute = () => {
    if (!activeCalc) return;
    let result;
    try {
      result = activeCalc.compute(currentValues, currentChecked);
    } catch {
      return;
    }
    if (!result) return;

    setHistory(prev => ({
      ...prev,
      [activeCalcId]: [{ value: result.value, unit: result.unit, ts: new Date() }, ...(prev[activeCalcId] || []).slice(0, 4)]
    }));
  };

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

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ background: '#050f1e', color: '#e8f0fe', fontFamily: "'DM Sans', sans-serif", minHeight: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type="number"] { -moz-appearance: textfield; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
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
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#00e5c0', animation: 'pulse 2s infinite' }}></span> AI ON
          </div>
          <button style={{ background: '#00e5c0', color: '#050f1e', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>+ New Patient</button>
        </div>
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 50px)', marginTop: '50px', marginLeft: '65px' }}>
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
                style={{ width: '100%', background: '#0e2544', border: '1px solid #1a3555', borderRadius: '8px', padding: '7px 10px 7px 32px', color: '#e8f0fe', fontSize: '12px', outline: 'none' }}
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
                    onClick={() => {
                      setActiveCalcId(calc.id);
                      setCurrentValues({});
                      setCurrentChecked({});
                    }}
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
                    {history[calc.id]?.[0] && (
                      <div style={{ fontSize: '10px', fontFamily: "'JetBrains Mono'", fontWeight: '600', color: '#00e5c0' }}>{history[calc.id][0].value.toFixed(1)} {history[calc.id][0].unit}</div>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Main Panel */}
        {activeCalc && (
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* Inputs */}
            <div style={{ width: '380px', overflowY: 'auto', padding: '16px', borderRight: '1px solid #1a3555', background: '#081628' }}>
              {activePatient && (
                <div style={{ background: 'rgba(0,229,192,.05)', border: '1px solid rgba(0,229,192,.18)', borderRadius: '8px', padding: '8px 12px', marginBottom: '16px', fontSize: '11px' }}>
                  <div style={{ fontWeight: '700', color: '#00e5c0' }}>👤 {activePatient.patient_name}</div>
                  <div style={{ color: '#4a6a8a', marginTop: '4px' }}>{activePatient.age}y {activePatient.gender}</div>
                </div>
              )}

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
                            style={{ width: '100%', background: '#0e2544', border: '1.5px solid #1a3555', borderRadius: '8px', padding: '8px 10px', color: '#e8f0fe', fontSize: '13px', outline: 'none', appearance: 'none', cursor: 'pointer' }}
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
                              value={currentValues[f.id] ?? ''}
                              onChange={(e) => handleFieldChange(f.id, e.target.value)}
                              style={{ width: '100%', background: '#0e2544', border: '1.5px solid #1a3555', borderRadius: '8px', padding: '8px 40px 8px 10px', color: '#e8f0fe', fontSize: '13px', outline: 'none' }}
                            />
                            <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', color: '#4a6a8a', fontFamily: "'JetBrains Mono'", pointerEvents: 'none' }}>{f.unit}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeCalc.scored && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: '#4a6a8a', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                    Clinical Criteria
                    <div style={{ flex: 1, height: '1px', background: '#1a3555' }}></div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {activeCalc.scored.map(s => (
                      <button
                        key={s.id}
                        onClick={() => handleToggleScore(s.id, s.pts)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: '1.5px solid #1a3555',
                          cursor: 'pointer',
                          background: currentChecked[s.id] ? 'rgba(0,229,192,.07)' : '#0e2544',
                          borderColor: currentChecked[s.id] ? 'rgba(0,229,192,.3)' : '#1a3555',
                          userSelect: 'none',
                          transition: 'all .15s'
                        }}
                      >
                        <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: '2px solid', borderColor: currentChecked[s.id] ? '#00e5c0' : '#1a3555', background: currentChecked[s.id] ? '#00e5c0' : '#050f1e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#050f1e', fontWeight: '900' }}>
                          {currentChecked[s.id] && '✓'}
                        </div>
                        <div style={{ flex: 1, fontSize: '12px', color: currentChecked[s.id] ? '#e8f0fe' : '#8aaccc' }}>{s.label}</div>
                        <div style={{ fontSize: '11px', fontFamily: "'JetBrains Mono'", fontWeight: '700', padding: '2px 7px', borderRadius: '4px', background: 'rgba(59,158,255,.15)', color: '#3b9eff' }}>+{s.pts}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '14px' }}>
                <button onClick={compute} style={{ background: '#00e5c0', color: '#050f1e', border: 'none', borderRadius: '8px', padding: '8px 20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', flex: 1 }}>⟳ Calculate</button>
                <button style={{ background: '#0e2544', border: '1px solid #1a3555', borderRadius: '8px', padding: '7px 12px', fontSize: '11px', color: '#8aaccc', cursor: 'pointer' }}>⚡ Auto-fill</button>
                <button onClick={() => { setCurrentValues({}); setCurrentChecked({}); }} style={{ background: '#0e2544', border: '1px solid #1a3555', borderRadius: '8px', padding: '7px 12px', fontSize: '12px', color: '#8aaccc', cursor: 'pointer' }}>Clear</button>
              </div>
            </div>

            {/* Results */}
            <div style={{ flex: 1, background: '#050f1e', overflowY: 'auto', padding: '16px' }}>
              {result && band ? (
                <div style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Primary Result */}
                  <div style={{ background: '#0b1e36', border: '1px solid #1a3555', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
                      <div style={{ fontFamily: "'JetBrains Mono'", fontSize: '52px', fontWeight: '600', color: COLOR_MAP[band.color] }}>{result.value.toFixed(result.precision ?? 1)}</div>
                      <div style={{ fontSize: '14px', color: '#4a6a8a', fontFamily: "'JetBrains Mono'" }}>{result.unit}</div>
                    </div>
                    {result.extra && <div style={{ fontSize: '12px', fontFamily: "'JetBrains Mono'", color: '#8aaccc', marginTop: '4px' }}>{result.extra}</div>}
                  </div>

                  {/* Band Strip */}
                  <div style={{ background: '#0b1e36', border: '1px solid #1a3555', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#4a6a8a', fontFamily: "'JetBrains Mono'", marginBottom: '8px' }}>
                      <span>{activeCalc.rangeMin}</span>
                      <span style={{ fontSize: '10px', color: '#4a6a8a' }}>{activeCalc.shortName} Range</span>
                      <span>{activeCalc.rangeMax}{result.value > activeCalc.rangeMax ? '+' : ''}</span>
                    </div>
                    <div style={{ height: '10px', borderRadius: '6px', display: 'flex', overflow: 'hidden', gap: '1px', marginBottom: '8px' }}>
                      {activeCalc.bands.map((b, i) => {
                        const nextLt = activeCalc.bands[i + 1]?.lt || activeCalc.rangeMax;
                        const width = ((Math.min(b.lt, nextLt) - (i === 0 ? activeCalc.rangeMin : activeCalc.bands[i - 1]?.lt || activeCalc.rangeMin)) / (activeCalc.rangeMax - activeCalc.rangeMin)) * 100;
                        return <div key={i} style={{ width: `${width}%`, background: COLOR_MAP[b.color], opacity: 0.7 }} />;
                      })}
                    </div>
                    <div style={{ position: 'relative', height: '22px' }}>
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: `${((Math.min(result.value, activeCalc.rangeMax) - activeCalc.rangeMin) / (activeCalc.rangeMax - activeCalc.rangeMin)) * 100}%`,
                          width: '2px',
                          height: '14px',
                          borderRadius: '2px',
                          background: COLOR_MAP[band.color],
                          transform: 'translateX(-50%)',
                          display: 'flex',
                          alignItems: 'flex-end',
                          justifyContent: 'center',
                        }}
                      >
                        <span style={{ fontSize: '8px', color: COLOR_MAP[band.color], marginTop: '2px' }}>▲</span>
                      </div>
                    </div>
                  </div>

                  {/* Risk Badge */}
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', background: `${COLOR_MAP[band.color]}20`, border: `1px solid ${COLOR_MAP[band.color]}50`, color: COLOR_MAP[band.color] }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLOR_MAP[band.color] }}></span>
                      {band.label}
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div style={{ background: '#0e2544', border: '1px solid #1a3555', borderRadius: '8px', padding: '10px 12px' }}>
                    <div style={{ fontSize: '9px', color: '#2e4a6a', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: '700', marginBottom: '5px' }}>Clinical Recommendation</div>
                    <div style={{ fontSize: '12px', color: '#8aaccc', lineHeight: '1.5' }}>{band.rec}</div>
                  </div>

                  {/* Formula */}
                  <div style={{ background: 'rgba(59,158,255,.03)', border: '1px solid rgba(59,158,255,.15)', borderRadius: '8px', padding: '10px 12px' }}>
                    <div style={{ fontSize: '9px', color: '#4a6a8a', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '4px' }}>Formula & Reference</div>
                    <div style={{ fontFamily: "'JetBrains Mono'", fontSize: '10px', color: '#3b9eff', lineHeight: '1.6', marginBottom: '4px' }}>{activeCalc.formula}</div>
                    <div style={{ fontSize: '10px', color: '#2e4a6a', fontStyle: 'italic' }}>{activeCalc.reference}</div>
                  </div>

                  {/* History */}
                  {history[activeCalcId]?.length > 1 && (
                    <div style={{ background: '#0b1e36', border: '1px solid #1a3555', borderRadius: '8px', padding: '10px 12px' }}>
                      <div style={{ fontSize: '9px', color: '#2e4a6a', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '6px', fontWeight: '700' }}>Previous Results</div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {history[activeCalcId].slice(1).map((h, i) => (
                          <div key={i} style={{ background: '#0e2544', border: '1px solid #1a3555', borderRadius: '8px', padding: '5px 10px', fontSize: '10px', cursor: 'pointer' }}>
                            <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: '700', color: '#e8f0fe' }}>{h.value.toFixed(1)}</span>
                            <span style={{ color: '#2e4a6a', marginLeft: '5px' }}>{h.ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '10px', opacity: 0.35 }}>
                  <div style={{ fontSize: '40px' }}>⟳</div>
                  <div style={{ fontSize: '12px', color: '#4a6a8a' }}>Fill in the fields to compute the result</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
}