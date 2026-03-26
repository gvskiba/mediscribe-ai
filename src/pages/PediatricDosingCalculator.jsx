import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";

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

const BROSELOW_ZONES = [
  { max: 5,   zone: 'Grey',   color: '#9ca3af', range: '3–5 kg' },
  { max: 7,   zone: 'Pink',   color: '#ec4899', range: '5–7 kg' },
  { max: 9,   zone: 'Red',    color: '#ef4444', range: '7–9 kg' },
  { max: 11,  zone: 'Purple', color: '#8b5cf6', range: '9–11 kg' },
  { max: 14,  zone: 'Yellow', color: '#eab308', range: '11–14 kg' },
  { max: 18,  zone: 'White',  color: '#cbd5e1', range: '14–18 kg' },
  { max: 23,  zone: 'Blue',   color: '#3b82f6', range: '18–23 kg' },
  { max: 29,  zone: 'Orange', color: '#f97316', range: '23–29 kg' },
  { max: 36,  zone: 'Green',  color: '#22c55e', range: '29–36 kg' },
  { max: 999, zone: 'Adult',  color: '#6b7280', range: '>36 kg' },
];

function getBroselow(wKg) {
  return BROSELOW_ZONES.find(z => wKg < z.max) || BROSELOW_ZONES[BROSELOW_ZONES.length - 1];
}

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
  const [drugDB, setDrugDB]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [activeBroad, setActiveBroad]       = useState('all');
  const [activeSubcat, setActiveSubcat]     = useState(null);
  const searchRef = useRef(null);

  const BROAD_CATEGORIES = [
    { id: 'all',           label: 'All',              icon: '💊', subcats: [] },
    { id: 'antibiotics',   label: 'Antibiotics',      icon: '🧪', subcats: [
      { id: 'antibiotics', label: 'General Antibiotics' },
      { id: 'abx',         label: 'ER Antibiotics' },
    ]},
    { id: 'respiratory',   label: 'Respiratory',      icon: '🫁', subcats: [
      { id: 'respiratory', label: 'Bronchodilators / Resp' },
      { id: 'rsi',         label: 'RSI / Intubation' },
    ]},
    { id: 'pain',          label: 'Pain / Sedation',  icon: '🔵', subcats: [
      { id: 'analgesic',   label: 'Analgesics / Opioids' },
      { id: 'sedation',    label: 'Sedation' },
      { id: 'seizure',     label: 'Seizure / Status' },
    ]},
    { id: 'resuscitation', label: 'Resuscitation',    icon: '🚨', subcats: [
      { id: 'resuscitation', label: 'Cardiac Arrest / ACLS' },
      { id: 'cardiac',     label: 'Cardiac / HTN' },
    ]},
    { id: 'gi',            label: 'GI',               icon: '💚', subcats: [
      { id: 'gi',          label: 'GI / Antiemetics' },
    ]},
    { id: 'other',         label: 'Other',            icon: '📌', subcats: [
      { id: 'other',       label: 'Other / Misc' },
      { id: 'psych',       label: 'Psych / Agitation' },
    ]},
  ];

  useEffect(() => {
    base44.entities.Medication.filter({ setting: 'er' })
      .then(meds => {
        // Only include meds that have pediatric dosing data
        const withPed = meds
          .filter(m => m.ped?.doses?.length > 0)
          .map(m => ({
            id: m.med_id || m.id,
            name: m.name,
            category: m.drugClass || m.category || 'Other',
            color: m.color || '#3b9eff',
            icon: m.emoji || '💊',
            ped: {
              concentration_mg_per_ml: m.ped.concentration || 1,
              concentration_label: m.ped.concLabel || `${m.ped.concentration} mg/mL`,
              max_single_dose_mg: m.ped.doses[0]?.maxDose || 9999,
              max_daily_dose_mg_per_kg: null,
              route: m.route || 'PO',
            },
            indications: m.ped.doses.map((d, i) => ({
              id: `${m.med_id || m.id}_${i}`,
              label: d.label || `Dose ${i + 1}`,
              dose_per_kg: d.dosePerKg || 0,
              freq: m.ped.repeat || 'PRN',
              duration: 'Per clinical judgment',
              unit: d.unit || 'mg/kg/dose',
              notes: m.ped.notes || '',
            })),
          }));
        setDrugDB(withPed);
      })
      .catch(() => setDrugDB([]))
      .finally(() => setLoading(false));
  }, []);

  const weightKg = weightVal
    ? parseFloat(weightVal) * (WEIGHT_UNITS.find(u => u.id === weightUnit)?.factor ?? 1)
    : null;

  const broselow = weightKg && weightKg > 0 ? getBroselow(weightKg) : null;

  const activeBroadObj = BROAD_CATEGORIES.find(b => b.id === activeBroad);
  const broadSubcatIds  = activeBroadObj?.subcats.map(s => s.id) ?? [];

  const filtered = drugDB.filter(d => {
    const matchesSearch = !query || d.name.toLowerCase().includes(query.toLowerCase()) || d.category.toLowerCase().includes(query.toLowerCase());
    let matchesCat = true;
    if (activeBroad !== 'all') {
      if (activeSubcat) {
        matchesCat = d.category === activeSubcat;
      } else {
        matchesCat = broadSubcatIds.includes(d.category);
      }
    }
    return matchesSearch && matchesCat;
  });

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
    const drug = drugDB.find(d => d.name === item.drug);
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
              <span className="dc-sec-badge">{loading ? '...' : `${filtered.length} available`}</span>
              <div className="dc-sec-line" />
            </div>

            {!loading && (
              <div style={{ marginBottom: 14 }}>
                {/* BROAD CATEGORY ROW */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {BROAD_CATEGORIES.map(broad => {
                    const isActive = activeBroad === broad.id;
                    const count = broad.id === 'all'
                      ? drugDB.length
                      : drugDB.filter(d => broad.subcats.some(s => s.id === d.category)).length;
                    return (
                      <button
                        key={broad.id}
                        onClick={() => { setActiveBroad(broad.id); setActiveSubcat(null); setSelectedDrug(null); setSelectedInd(null); }}
                        style={{
                          background: isActive ? 'rgba(0,229,192,0.12)' : '#0b1e36',
                          border: `1px solid ${isActive ? 'rgba(0,229,192,0.5)' : '#1a3555'}`,
                          borderRadius: 8, padding: '7px 14px',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                          fontSize: 12, fontWeight: isActive ? 700 : 500,
                          color: isActive ? '#00e5c0' : '#8aaccc',
                          transition: 'all 0.15s', whiteSpace: 'nowrap',
                          fontFamily: "'DM Sans', sans-serif",
                          boxShadow: isActive ? '0 0 0 1px rgba(0,229,192,0.2)' : 'none',
                        }}
                      >
                        <span style={{ fontSize: 14 }}>{broad.icon}</span>
                        <span>{broad.label}</span>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: isActive ? 'rgba(0,229,192,0.6)' : '#4a6a8a' }}>{count}</span>
                      </button>
                    );
                  })}
                </div>

                {/* SUBCATEGORY ROW */}
                {activeBroad !== 'all' && activeBroadObj?.subcats.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, paddingLeft: 10, borderLeft: '2px solid rgba(0,229,192,0.2)' }}>
                    <button
                      onClick={() => { setActiveSubcat(null); setSelectedDrug(null); setSelectedInd(null); }}
                      style={{
                        background: !activeSubcat ? 'rgba(59,158,255,0.1)' : 'transparent',
                        border: `1px solid ${!activeSubcat ? 'rgba(59,158,255,0.4)' : '#1a3555'}`,
                        borderRadius: 20, padding: '3px 10px', cursor: 'pointer',
                        fontSize: 10, fontWeight: !activeSubcat ? 700 : 400,
                        color: !activeSubcat ? '#3b9eff' : '#4a6a8a',
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      All {activeBroadObj.label}
                    </button>
                    {activeBroadObj.subcats.map(sc => {
                      const isActiveSc = activeSubcat === sc.id;
                      const scCount = drugDB.filter(d => d.category === sc.id).length;
                      if (scCount === 0) return null;
                      return (
                        <button
                          key={sc.id}
                          onClick={() => { setActiveSubcat(sc.id); setSelectedDrug(null); setSelectedInd(null); }}
                          style={{
                            background: isActiveSc ? 'rgba(59,158,255,0.1)' : 'transparent',
                            border: `1px solid ${isActiveSc ? 'rgba(59,158,255,0.4)' : '#1a3555'}`,
                            borderRadius: 20, padding: '3px 10px', cursor: 'pointer',
                            fontSize: 10, fontWeight: isActiveSc ? 700 : 400,
                            color: isActiveSc ? '#3b9eff' : '#4a6a8a',
                            fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap',
                          }}
                        >
                          {sc.label} ({scCount})
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

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
              {loading && (
                <div className="dc-empty" style={{ gridColumn: '1/-1' }}>
                  <div className="dc-empty-icon" style={{ animation: 'fadeIn 1s infinite alternate' }}>💊</div>
                  <div className="dc-empty-txt">Loading medications from database…</div>
                </div>
              )}
              {!loading && filtered.length === 0 && (
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
                          {broselow && (
                            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{
                                background: broselow.color + '22',
                                border: `1px solid ${broselow.color}66`,
                                borderLeft: `4px solid ${broselow.color}`,
                                borderRadius: 6, padding: '6px 12px',
                                display: 'flex', alignItems: 'center', gap: 10,
                              }}>
                                <div style={{ width: 14, height: 14, borderRadius: 3, background: broselow.color, flexShrink: 0 }} />
                                <div>
                                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: broselow.color }}>
                                    Broselow {broselow.zone}
                                  </div>
                                  <div style={{ fontSize: 10, color: T.txt3 }}>{broselow.range}</div>
                                </div>
                              </div>
                            </div>
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