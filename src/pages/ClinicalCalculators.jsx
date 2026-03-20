import React, { useState, useEffect } from 'react';
import { usePatient } from '@/lib/PatientContext';
import { Search, Copy } from 'lucide-react';

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
      { lt: 18.5, label: 'Underweight', color: '#3b9eff' },
      { lt: 25, label: 'Normal Weight', color: '#00e5c0' },
      { lt: 30, label: 'Overweight', color: '#f5c842' },
      { lt: 35, label: 'Obese Class I', color: '#ff9f43' },
      { lt: 40, label: 'Obese Class II', color: '#ff6b6b' },
      { lt: Infinity, label: 'Obese Class III', color: '#ff3366' },
    ],
    formula: 'BMI = Weight (kg) ÷ Height² (m)',
    reference: 'WHO Expert Consultation. Lancet 2004',
    rec: 'Lifestyle modification counseling indicated. Consider dietary assessment, exercise prescription, and metabolic screening.',
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
    bands: [
      { lt: Infinity, label: 'Calculated', color: '#3b9eff' },
    ],
    formula: 'Male: 50 + 2.3 × (height_in − 60) | Female: 45.5 + 2.3 × (height_in − 60)',
    reference: 'Devine BJ. Drug Intell Clin Pharm 1974',
    rec: 'IBW: Use for aminoglycosides, vancomycin, phenytoin dosing.',
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
      { lt: 15, label: 'G5 — Kidney Failure', color: '#ff3366' },
      { lt: 30, label: 'G4 — Severely Reduced', color: '#ff6b6b' },
      { lt: 60, label: 'G3 — Moderately Reduced', color: '#ff9f43' },
      { lt: 90, label: 'G2 — Mildly Reduced', color: '#f5c842' },
      { lt: Infinity, label: 'G1 — Normal', color: '#00e5c0' },
    ],
    formula: 'CrCl = [(140 − Age) × Weight(kg)] ÷ (72 × SCr) × 0.85 if female',
    reference: 'Cockcroft DW, Gault MH. Nephron 1976',
    rec: 'Adjust doses for renally-cleared medications based on GFR.',
  },
  {
    id: 'chadsvasc', name: 'CHA₂DS₂-VASc Score', shortName: 'CHADS-VASc', icon: '❤️', category: 'cardiology',
    description: 'Stroke risk in non-valvular atrial fibrillation',
    rangeMin: 0, rangeMax: 9,
    scored: [
      { id: 'chf', label: 'Congestive Heart Failure', pts: 1, autofill: p => p.pmh?.chf },
      { id: 'htn', label: 'Hypertension', pts: 1, autofill: p => p.pmh?.htn },
      { id: 'age75', label: 'Age ≥ 75', pts: 2, autofill: p => p.age >= 75 },
      { id: 'dm', label: 'Diabetes mellitus', pts: 1, autofill: p => p.pmh?.dm },
      { id: 'stroke', label: 'Stroke/TIA', pts: 2, autofill: p => p.pmh?.stroke },
    ],
    compute: (v, checked) => {
      const score = Object.values(checked).reduce((s, x) => s + x, 0);
      return { value: score, unit: 'pts', precision: 0 };
    },
    bands: [
      { lt: 1, label: 'Low Risk', color: '#00e5c0' },
      { lt: 2, label: 'Low-Moderate', color: '#f5c842' },
      { lt: Infinity, label: 'Moderate-High', color: '#ff6b6b' },
    ],
    formula: 'CHF(1) + HTN(1) + Age≥75(2) + DM(1) + Stroke(2)',
    reference: 'Lip GY et al. Chest 2010',
    rec: 'Anticoagulation recommended for scores ≥2.',
  },
  {
    id: 'gcs', name: 'Glasgow Coma Scale', shortName: 'GCS', icon: '🧠', category: 'neurology',
    description: 'Standardized consciousness assessment',
    rangeMin: 3, rangeMax: 15,
    fields: [
      { id: 'eye', label: 'Eye Opening', type: 'select', opts: [{ v: '4', l: '4 — Spontaneous' }, { v: '3', l: '3 — To voice' }, { v: '2', l: '2 — To pain' }, { v: '1', l: '1 — None' }], required: true },
      { id: 'verbal', label: 'Verbal Response', type: 'select', opts: [{ v: '5', l: '5 — Oriented' }, { v: '4', l: '4 — Confused' }, { v: '3', l: '3 — Inappropriate' }, { v: '2', l: '2 — Sounds' }, { v: '1', l: '1 — None' }], required: true },
      { id: 'motor', label: 'Motor Response', type: 'select', opts: [{ v: '6', l: '6 — Obeys' }, { v: '5', l: '5 — Localizes' }, { v: '4', l: '4 — Withdraws' }, { v: '3', l: '3 — Flexion' }, { v: '2', l: '2 — Extension' }, { v: '1', l: '1 — None' }], required: true },
    ],
    compute: (v) => {
      const e = Number(v.eye || 0), vb = Number(v.verbal || 0), m = Number(v.motor || 0);
      if (!e || !vb || !m) return null;
      return { value: e + vb + m, unit: `E${e}V${vb}M${m}`, precision: 0 };
    },
    bands: [
      { lt: 9, label: 'Severe TBI', color: '#ff3366' },
      { lt: 13, label: 'Moderate TBI', color: '#ff9f43' },
      { lt: 15, label: 'Mild TBI', color: '#f5c842' },
      { lt: Infinity, label: 'Normal', color: '#00e5c0' },
    ],
    formula: 'GCS = Eye (1–4) + Verbal (1–5) + Motor (1–6)',
    reference: 'Teasdale G, Jennett B. Lancet 1974',
    rec: 'GCS ≤8 requires intubation. ICU admission for GCS 9-14.',
  },
];

const CAT_COLORS = {
  nutrition: { icon: '🥗', color: '#00e5c0' },
  renal: { icon: '🫘', color: '#00d4ff' },
  cardiology: { icon: '❤️', color: '#ff6b6b' },
  neurology: { icon: '🧠', color: '#f5c842' },
  labs: { icon: '⚗️', color: '#9b6dff' },
};

export default function ClinicalCalculators() {
  const { activePatient } = usePatient();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCalcId, setActiveCalcId] = useState('bmi');
  const [currentValues, setCurrentValues] = useState({});
  const [currentChecked, setCurrentChecked] = useState({});
  const [history, setHistory] = useState({});

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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100" style={{ background: '#050f1e', color: '#e8f0fe', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Navbar */}
      <div className="fixed top-0 left-0 right-0 h-12 bg-slate-900 border-b border-slate-800 px-6 flex items-center gap-4 z-40" style={{ background: '#081628', borderBottomColor: '#1a3555' }}>
        <span className="text-xs text-slate-400">Welcome, <strong className="text-slate-200">Dr. Gabriel Skiba</strong></span>
        <div className="w-px h-4 bg-slate-700" style={{ background: '#1a3555' }}></div>
        <div className="ml-auto flex items-center gap-3">
          <div className="text-xs text-slate-400">Emergency Medicine</div>
          <div className="text-xs text-slate-400 font-mono">14:26</div>
          <div className="text-xs font-semibold text-teal-400 flex items-center gap-1" style={{ color: '#00e5c0' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" style={{ background: '#00e5c0' }}></span> AI ON
          </div>
          <button className="text-xs font-bold px-3 py-1 rounded" style={{ background: '#00e5c0', color: '#050f1e' }}>+ New Patient</button>
        </div>
      </div>

      <div className="flex h-screen pt-12">
        {/* Left Sidebar - Calculator List */}
        <div className="w-64 bg-slate-900 border-r border-slate-800 overflow-y-auto flex flex-col" style={{ background: '#081628', borderRightColor: '#1a3555' }}>
          <div className="p-4 border-b border-slate-800" style={{ borderBottomColor: '#1a3555' }}>
            <h2 className="text-sm font-bold text-slate-200 mb-3">📊 Calculators <span className="text-xs text-slate-500 font-mono">({CALCULATORS.length})</span></h2>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-600" />
              <input
                type="text"
                placeholder="Search calculators..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded pl-9 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                style={{ background: '#0e2544', borderColor: '#1a3555' }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4" style={{ fontSize: '13px' }}>
            {Object.entries(
              filteredCalcs.reduce((acc, calc) => {
                if (!acc[calc.category]) acc[calc.category] = [];
                acc[calc.category].push(calc);
                return acc;
              }, {})
            ).map(([cat, calcs]) => (
              <div key={cat}>
                <div className="text-xs font-bold text-slate-500 uppercase px-2 mb-1" style={{ color: '#4a6a8a', letterSpacing: '0.08em' }}>
                  {CAT_COLORS[cat]?.icon} {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </div>
                {calcs.map(calc => (
                  <button
                    key={calc.id}
                    onClick={() => {
                      setActiveCalcId(calc.id);
                      setCurrentValues({});
                      setCurrentChecked({});
                    }}
                    className={`w-full text-left p-2.5 rounded transition-all text-xs ${
                      activeCalcId === calc.id
                        ? 'bg-blue-900'
                        : ''
                    }`}
                    style={{
                      background: activeCalcId === calc.id ? 'rgba(59, 158, 255, 0.1)' : 'transparent',
                      border: activeCalcId === calc.id ? '1px solid #1a3555' : '1px solid transparent',
                    }}
                  >
                    <div className="font-semibold text-slate-200">{calc.icon} {calc.shortName}</div>
                    <div className="text-slate-500 mt-0.5 text-xs">{calc.description}</div>
                    {history[calc.id]?.[0] && (
                      <div className="text-teal-400 mt-1 font-mono text-xs" style={{ color: '#00e5c0' }}>
                        {history[calc.id][0].value.toFixed(1)} {history[calc.id][0].unit}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        {activeCalc && (
          <div className="flex-1 flex overflow-hidden">
            {/* Inputs Column */}
            <div className="w-80 border-r border-slate-800 overflow-y-auto p-5" style={{ background: '#081628', borderRightColor: '#1a3555' }}>
              {activePatient && (
                <div className="rounded p-3 mb-4 text-xs" style={{ background: 'rgba(0, 229, 192, 0.05)', border: '1px solid rgba(0, 229, 192, 0.2)' }}>
                  <div className="font-semibold" style={{ color: '#00e5c0' }}>👤 {activePatient.patient_name}</div>
                  <div className="text-slate-400 text-xs mt-1">
                    {activePatient.age ? `${activePatient.age}y` : ''} {activePatient.gender || ''} · MRN: {activePatient.patient_id || '—'}
                  </div>
                </div>
              )}

              <div className="space-y-4 text-sm">
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase mb-3" style={{ color: '#4a6a8a', letterSpacing: '0.06em' }}>Input Values</div>
                  {activeCalc.fields?.map(field => (
                    <div key={field.id} className="mb-4">
                      <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">{field.label}</label>
                      {field.type === 'select' ? (
                        <select
                          value={currentValues[field.id] ?? ''}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                          style={{ background: '#0e2544', borderColor: '#1a3555' }}
                        >
                          <option value="">Select...</option>
                          {field.opts?.map(opt => (
                            <option key={opt.v} value={opt.v}>{opt.l}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="relative">
                          <input
                            type="number"
                            min={field.min}
                            max={field.max}
                            step={field.step}
                            value={currentValues[field.id] ?? ''}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                            style={{ background: '#0e2544', borderColor: '#1a3555' }}
                          />
                          {field.unit && <span className="absolute right-3 top-2 text-xs text-slate-500">{field.unit}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {activeCalc.scored?.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleToggleScore(item.id, item.pts)}
                    className="w-full text-left p-3 rounded border transition-all text-xs"
                    style={{
                      background: currentChecked[item.id] ? 'rgba(0, 229, 192, 0.08)' : '#0e2544',
                      border: currentChecked[item.id] ? '1px solid rgba(0, 229, 192, 0.3)' : '1px solid #1a3555',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded border-2`} style={{ borderColor: currentChecked[item.id] ? '#00e5c0' : '#1a3555', background: currentChecked[item.id] ? '#00e5c0' : 'transparent' }}></div>
                      <div className="flex-1">{item.label}</div>
                      <div className="font-semibold text-teal-400" style={{ color: '#00e5c0' }}>+{item.pts}</div>
                    </div>
                  </button>
                ))}

                <div className="flex gap-2 mt-4 pt-2">
                  <button
                    onClick={compute}
                    className="flex-1 font-bold py-2 rounded transition"
                    style={{ background: '#00e5c0', color: '#050f1e' }}
                  >
                    ⟳ Calculate
                  </button>
                  <button
                    className="px-4 py-2 rounded border text-xs font-bold"
                    style={{ background: '#0e2544', borderColor: '#1a3555', color: '#8aaccc' }}
                  >
                    Auto-fill
                  </button>
                </div>
              </div>
            </div>

            {/* Results Column */}
            <div className="flex-1 bg-slate-950 overflow-y-auto p-8" style={{ background: '#050f1e' }}>
              {result && band ? (
                <div className="max-w-3xl space-y-5">
                  {/* Primary Result */}
                  <div className="rounded-lg p-8 text-center" style={{ background: '#0b1e36', border: '1px solid #1a3555' }}>
                    <div className="flex items-baseline justify-center gap-3 mb-2">
                      <div className="text-7xl font-bold" style={{ color: band.color }}>{result.value.toFixed(result.precision ?? 1)}</div>
                      <div className="text-2xl" style={{ color: '#4a6a8a' }}>{result.unit}</div>
                    </div>
                    {result.extra && <div className="text-sm" style={{ color: '#8aaccc' }}>{result.extra}</div>}
                  </div>

                  {/* Band Strip */}
                  {activeCalc.rangeMin !== undefined && (
                    <div className="rounded-lg p-4" style={{ background: '#0b1e36', border: '1px solid #1a3555' }}>
                      <div className="flex justify-between text-xs mb-2" style={{ color: '#4a6a8a' }}>
                        <span>{activeCalc.rangeMin}</span>
                        <span>Range</span>
                        <span>{activeCalc.rangeMax}</span>
                      </div>
                      <div className="h-3 rounded-full flex overflow-hidden mb-2" style={{ background: '#081628' }}>
                        {activeCalc.bands.map((b, i) => {
                          const nextLt = activeCalc.bands[i + 1]?.lt || activeCalc.rangeMax;
                          const width = ((Math.min(b.lt, nextLt) - (i === 0 ? activeCalc.rangeMin : activeCalc.bands[i - 1]?.lt || activeCalc.rangeMin)) / (activeCalc.rangeMax - activeCalc.rangeMin)) * 100;
                          return (
                            <div
                              key={i}
                              style={{
                                width: `${width}%`,
                                background: b.color,
                                opacity: 0.7,
                              }}
                            />
                          );
                        })}
                      </div>
                      <div className="relative h-6" style={{ marginTop: '-4px' }}>
                        <div
                          className="absolute top-0 w-0.5 h-3 rounded"
                          style={{
                            left: `${((Math.min(result.value, activeCalc.rangeMax) - activeCalc.rangeMin) / (activeCalc.rangeMax - activeCalc.rangeMin)) * 100}%`,
                            background: band.color,
                            transform: 'translateX(-50%)',
                          }}
                        >
                          <div className="text-center text-xs font-bold mt-2.5" style={{ color: band.color, whiteSpace: 'nowrap', marginLeft: '-20px' }}>▲</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Risk Badge */}
                  <div className="flex justify-center">
                    <div className="px-4 py-2 rounded-full border font-bold text-sm flex items-center gap-2" style={{ background: `${band.color}15`, borderColor: `${band.color}50`, color: band.color }}>
                      <span className="w-2 h-2 rounded-full" style={{ background: band.color }}></span>
                      {band.label}
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div className="rounded-lg p-4" style={{ background: '#0b1e36', border: '1px solid #1a3555' }}>
                    <div className="text-xs font-bold text-slate-500 uppercase mb-2" style={{ color: '#4a6a8a', letterSpacing: '0.06em' }}>Clinical Recommendation</div>
                    <div className="text-sm leading-relaxed" style={{ color: '#8aaccc' }}>{activeCalc.rec}</div>
                  </div>

                  {/* Formula */}
                  <div className="rounded-lg p-4" style={{ background: 'rgba(59, 158, 255, 0.03)', border: '1px solid rgba(59, 158, 255, 0.15)' }}>
                    <div className="text-xs font-bold text-slate-500 uppercase mb-2" style={{ color: '#4a6a8a', letterSpacing: '0.06em' }}>Formula & Reference</div>
                    <div className="text-xs font-mono mb-2" style={{ color: '#3b9eff' }}>{activeCalc.formula}</div>
                    <div className="text-xs italic" style={{ color: '#4a6a8a' }}>{activeCalc.reference}</div>
                  </div>

                  {/* History */}
                  {history[activeCalcId]?.length > 1 && (
                    <div className="rounded-lg p-4" style={{ background: '#0b1e36', border: '1px solid #1a3555' }}>
                      <div className="text-xs font-bold text-slate-500 uppercase mb-3" style={{ color: '#4a6a8a', letterSpacing: '0.06em' }}>Previous Results</div>
                      <div className="space-y-2">
                        {history[activeCalcId].slice(1).map((h, i) => (
                          <div key={i} className="flex justify-between text-xs p-2 rounded" style={{ background: '#081628', color: '#8aaccc' }}>
                            <span className="font-mono font-semibold">{h.value.toFixed(1)} {h.unit}</span>
                            <span>{h.ts.toLocaleTimeString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button className="flex-1 px-4 py-2 rounded text-xs font-bold" style={{ background: '#0b1e36', border: '1px solid #1a3555', color: '#8aaccc' }}>📋 Copy to Note</button>
                    <button className="flex-1 px-4 py-2 rounded text-xs font-bold" style={{ background: '#0b1e36', border: '1px solid #1a3555', color: '#8aaccc' }}>↺ Recalculate</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <div className="text-5xl mb-4">⟳</div>
                  <div className="text-lg">Fill in the fields to compute</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}