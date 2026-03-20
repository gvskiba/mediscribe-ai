import React, { useState, useEffect } from 'react';
import { usePatient } from '@/lib/PatientContext';
import { Search, AlertCircle, Copy, RotateCcw } from 'lucide-react';

const CALCULATORS = [
  // NUTRITION
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
      { lt: 18.5, label: 'Underweight', color: 'blue', rec: 'Nutritional assessment recommended.' },
      { lt: 25, label: 'Normal Weight', color: 'teal', rec: 'Healthy weight range. Continue current nutrition.' },
      { lt: 30, label: 'Overweight', color: 'gold', rec: 'Lifestyle modification counseling indicated.' },
      { lt: 35, label: 'Obese Class I', color: 'orange', rec: 'Obesity management program recommended.' },
      { lt: 40, label: 'Obese Class II', color: 'coral', rec: 'Intensive management and bariatric evaluation.' },
      { lt: Infinity, label: 'Obese Class III', color: 'red', rec: 'Severe obesity. Multidisciplinary approach needed.' },
    ],
    formula: 'BMI = Weight (kg) ÷ Height² (m)',
    reference: 'WHO Expert Consultation. Lancet 2004',
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
      { lt: 15, label: 'G5 — Kidney Failure', color: 'red', rec: 'ESRD. Hold renally-cleared drugs. Nephrology consult urgent.' },
      { lt: 30, label: 'G4 — Severely Reduced', color: 'coral', rec: 'Significant dose reduction required. Nephrology referral.' },
      { lt: 60, label: 'G3 — Moderately Reduced', color: 'orange', rec: 'Adjust doses for aminoglycosides, vancomycin, DOACs.' },
      { lt: 90, label: 'G2 — Mildly Reduced', color: 'gold', rec: 'Most drugs dosed normally. Monitor renal function.' },
      { lt: Infinity, label: 'G1 — Normal', color: 'teal', rec: 'Normal kidney function. Standard dosing.' },
    ],
    formula: 'CrCl = [(140 − Age) × Weight(kg)] ÷ (72 × SCr) × 0.85 if female',
    reference: 'Cockcroft DW, Gault MH. Nephron 1976',
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
      { id: 'stroke', label: 'Stroke, TIA, or thromboembolism', pts: 2, autofill: p => p.pmh?.stroke },
      { id: 'vasc', label: 'Vascular disease', pts: 1, autofill: p => p.pmh?.vascularDisease },
      { id: 'age65', label: 'Age 65–74 years', pts: 1, autofill: p => p.age >= 65 && p.age < 75 },
      { id: 'female', label: 'Female sex category', pts: 1, autofill: p => p.gender === 'F' },
    ],
    compute: (v, checked) => {
      const score = Object.values(checked).reduce((s, x) => s + x, 0);
      return { value: score, unit: 'pts', precision: 0, extra: `${[0, 1.3, 2.2, 3.2, 4.0, 6.7, 9.8, 9.6, 12.5, 15.2][Math.min(score, 9)]}% annual stroke risk` };
    },
    bands: [
      { lt: 1, label: 'Low Risk', color: 'teal', rec: 'Score 0 (male) or 1 (female): Anticoagulation not recommended.' },
      { lt: 2, label: 'Low-Moderate', color: 'gold', rec: 'Score 1 (male): Consider anticoagulation after risk assessment.' },
      { lt: Infinity, label: 'Moderate-High Risk', color: 'coral', rec: 'Oral anticoagulation recommended. DOAC preferred.' },
    ],
    formula: 'CHF(1) + HTN(1) + Age≥75(2) + DM(1) + Stroke(2) + Vascular(1) + Age 65–74(1) + Female(1)',
    reference: 'Lip GY et al. Chest 2010',
  },
  {
    id: 'gcs', name: 'Glasgow Coma Scale', shortName: 'GCS', icon: '🧠', category: 'neurology',
    description: 'Standardized consciousness assessment',
    rangeMin: 3, rangeMax: 15,
    fields: [
      { id: 'eye', label: 'Eye Opening', type: 'select', opts: [{ v: '4', l: '4 — Spontaneous' }, { v: '3', l: '3 — To voice' }, { v: '2', l: '2 — To pain' }, { v: '1', l: '1 — None' }], required: true },
      { id: 'verbal', label: 'Verbal Response', type: 'select', opts: [{ v: '5', l: '5 — Oriented' }, { v: '4', l: '4 — Confused' }, { v: '3', l: '3 — Inappropriate' }, { v: '2', l: '2 — Sounds' }, { v: '1', l: '1 — None' }], required: true },
      { id: 'motor', label: 'Motor Response', type: 'select', opts: [{ v: '6', l: '6 — Obeys commands' }, { v: '5', l: '5 — Localizes pain' }, { v: '4', l: '4 — Withdraws' }, { v: '3', l: '3 — Flexion' }, { v: '2', l: '2 — Extension' }, { v: '1', l: '1 — None' }], required: true },
    ],
    compute: (v) => {
      const e = Number(v.eye || 0), vb = Number(v.verbal || 0), m = Number(v.motor || 0);
      if (!e || !vb || !m) return null;
      return { value: e + vb + m, unit: `E${e}V${vb}M${m}`, precision: 0 };
    },
    bands: [
      { lt: 9, label: 'Severe TBI', color: 'coral', rec: 'GCS ≤8: Endotracheal intubation indicated. ICU care.' },
      { lt: 13, label: 'Moderate TBI', color: 'gold', rec: 'GCS 9–12: CT head, ICU admission, neurology consult.' },
      { lt: 15, label: 'Mild TBI', color: 'blue', rec: 'GCS 13–14: CT per protocol, observation, neurology follow-up.' },
      { lt: Infinity, label: 'Normal', color: 'teal', rec: 'GCS 15: Normal consciousness.' },
    ],
    formula: 'GCS = Eye (1–4) + Verbal (1–5) + Motor (1–6)',
    reference: 'Teasdale G, Jennett B. Lancet 1974',
  },
];

const CAT_META = {
  nutrition: { label: 'Nutrition', color: 'bg-emerald-100 text-emerald-700' },
  renal: { label: 'Renal', color: 'bg-cyan-100 text-cyan-700' },
  cardiology: { label: 'Cardiology', color: 'bg-rose-100 text-rose-700' },
  neurology: { label: 'Neurology', color: 'bg-amber-100 text-amber-700' },
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

  const getBand = (value) => {
    if (!activeCalc) return null;
    return activeCalc.bands.find(b => value < b.lt) || activeCalc.bands[activeCalc.bands.length - 1];
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
  const band = result ? getBand(result.value) : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100" style={{ paddingLeft: 0 }}>
      {/* Navbar */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center gap-4 z-40">
        <span className="text-sm text-slate-400">Welcome, <strong className="text-slate-200">Dr. Provider</strong></span>
        <div className="w-px h-6 bg-slate-700"></div>
        <div className="ml-auto flex items-center gap-4">
          <div className="text-sm text-slate-400">Emergency Medicine</div>
          <div className="text-sm text-slate-400 font-mono">--:--</div>
          <div className="text-sm font-semibold text-teal-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span> AI ON
          </div>
        </div>
      </div>

      <div className="flex h-screen pt-16">
        {/* Left Sidebar - Calculator List */}
        <div className="w-72 bg-slate-900 border-r border-slate-800 overflow-y-auto flex flex-col">
          <div className="p-4 border-b border-slate-800">
            <h2 className="text-base font-bold text-slate-200 mb-3 flex items-center gap-2">
              🧮 Calculators <span className="text-xs text-slate-500 font-mono">({CALCULATORS.length})</span>
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-600" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded pl-9 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-4 space-y-6">
            {Object.entries(
              filteredCalcs.reduce((acc, calc) => {
                if (!acc[calc.category]) acc[calc.category] = [];
                acc[calc.category].push(calc);
                return acc;
              }, {})
            ).map(([cat, calcs]) => (
              <div key={cat}>
                <div className="text-xs font-bold text-slate-500 uppercase px-2 mb-2">{CAT_META[cat]?.label || cat}</div>
                {calcs.map(calc => (
                  <button
                    key={calc.id}
                    onClick={() => {
                      setActiveCalcId(calc.id);
                      setCurrentValues({});
                      setCurrentChecked({});
                    }}
                    className={`w-full text-left p-3 rounded transition-all ${
                      activeCalcId === calc.id
                        ? 'bg-slate-800 border border-blue-500'
                        : 'hover:bg-slate-800'
                    }`}
                  >
                    <div className="text-sm font-semibold text-slate-200">{calc.shortName}</div>
                    <div className="text-xs text-slate-500 mt-1">{calc.description}</div>
                    {history[calc.id]?.[0] && (
                      <div className="text-xs text-teal-400 mt-2 font-mono">{history[calc.id][0].value.toFixed(1)} {history[calc.id][0].unit}</div>
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
            <div className="w-96 bg-slate-900 border-r border-slate-800 overflow-y-auto p-6">
              {activePatient && (
                <div className="bg-teal-500/10 border border-teal-500/30 rounded p-3 mb-4 text-xs">
                  <div className="font-semibold text-teal-400">{activePatient.patient_name}</div>
                  <div className="text-slate-400">{activePatient.patient_age ? `${activePatient.patient_age}y` : ''} {activePatient.gender}</div>
                </div>
              )}

              <div className="space-y-4">
                {activeCalc.fields?.map(field => (
                  <div key={field.id}>
                    <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">{field.label}</label>
                    {field.type === 'select' ? (
                      <select
                        value={currentValues[field.id] ?? ''}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
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
                        />
                        {field.unit && <span className="absolute right-3 top-2.5 text-xs text-slate-500">{field.unit}</span>}
                      </div>
                    )}
                  </div>
                ))}

                {activeCalc.scored?.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleToggleScore(item.id, item.pts)}
                    className={`w-full text-left p-3 rounded border transition-all ${
                      currentChecked[item.id]
                        ? 'bg-teal-500/20 border-teal-500/50'
                        : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded border ${currentChecked[item.id] ? 'bg-teal-500 border-teal-500' : 'border-slate-600'}`}></div>
                      <div className="flex-1">
                        <div className="text-sm text-slate-200">{item.label}</div>
                      </div>
                      <div className="text-xs font-semibold text-teal-400">+{item.pts}</div>
                    </div>
                  </button>
                ))}

                <button
                  onClick={compute}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 rounded transition mt-4"
                >
                  Calculate
                </button>
              </div>
            </div>

            {/* Results Column */}
            <div className="flex-1 bg-slate-950 overflow-y-auto p-8">
              {result && band ? (
                <div className="max-w-2xl space-y-6">
                  {/* Primary Result */}
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 text-center">
                    <div className="flex items-baseline justify-center gap-2 mb-2">
                      <div className="text-6xl font-bold text-teal-400">{result.value.toFixed(result.precision ?? 1)}</div>
                      <div className="text-xl text-slate-400">{result.unit}</div>
                    </div>
                    {result.extra && <div className="text-sm text-slate-400">{result.extra}</div>}
                  </div>

                  {/* Risk Badge */}
                  <div className="flex justify-center">
                    <div className="px-4 py-2 rounded-full bg-slate-800 border border-slate-700 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-teal-400"></span>
                      <span className="text-sm font-semibold text-slate-200">{band.label}</span>
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                    <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Clinical Recommendation</div>
                    <div className="text-sm text-slate-300 leading-relaxed">{band.rec}</div>
                  </div>

                  {/* Formula */}
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Formula</div>
                    <div className="text-xs text-blue-300 font-mono mb-3">{activeCalc.formula}</div>
                    <div className="text-xs text-slate-500 italic">{activeCalc.reference}</div>
                  </div>

                  {/* History */}
                  {history[activeCalcId]?.length > 1 && (
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-3">Previous Results</div>
                      <div className="space-y-2">
                        {history[activeCalcId].slice(1).map((h, i) => (
                          <div key={i} className="flex items-center justify-between text-sm text-slate-400 bg-slate-800 rounded px-3 py-2">
                            <span className="font-mono font-semibold">{h.value.toFixed(1)} {h.unit}</span>
                            <span className="text-xs">{h.ts.toLocaleTimeString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <div className="text-4xl mb-4">⟳</div>
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