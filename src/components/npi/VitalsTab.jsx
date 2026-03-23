import React from "react";
import { VITAL_DEFS } from "./npiData";

const S = {
  bg: '#050f1e', panel: '#081628', card: '#0b1e36', up: '#0e2544',
  border: '#1a3555', borderHi: '#2a4f7a',
  blue: '#3b9eff', teal: '#00e5c0', gold: '#f5c842', coral: '#ff6b6b', orange: '#ff9f43',
  txt: '#e8f0fe', txt2: '#8aaccc', txt3: '#4a6a8a', txt4: '#2e4a6a',
};

const inp = {
  width: '100%', background: S.up, border: `1px solid ${S.border}`,
  borderRadius: 6, padding: '7px 10px', color: S.txt, fontSize: 12,
  outline: 'none', fontFamily: "'JetBrains Mono', monospace", boxSizing: 'border-box',
};

const lbl = {
  fontSize: 9, color: S.txt3, textTransform: 'uppercase',
  letterSpacing: '0.06em', fontWeight: 500, marginBottom: 4, display: 'block',
};

const card = {
  background: S.panel, border: `1px solid ${S.border}`,
  borderRadius: 12, padding: '16px 18px',
};

const TRIAGE_COLORS = {
  'ESI 1': S.coral,
  'ESI 2': S.orange,
  'ESI 3': S.gold,
  'ESI 4': S.teal,
  'ESI 5': S.txt2,
};

function getVitalStatus(id, vitals) {
  const def = VITAL_DEFS.find(v => v.id === id);
  if (!def) return '';
  const val = parseFloat(vitals[id]);
  if (isNaN(val)) return '';
  if (def.hi !== null && val > def.hi) return 'high';
  if (def.lo !== null && val < def.lo) return 'low';
  return 'ok';
}

function statusColor(s) {
  if (s === 'high') return S.coral;
  if (s === 'low') return S.blue;
  if (s === 'ok') return S.teal;
  return S.border;
}

export default function VitalsTab({ vitals, setVitals, avpu, setAvpu, o2del, setO2del, pain, setPain, triage, setTriage }) {
  const abnormals = VITAL_DEFS.filter(v => {
    const s = getVitalStatus(v.id, vitals);
    return s === 'high' || s === 'low';
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 20 }}>📊</span>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 600, color: S.txt }}>Vital Signs</div>
          <div style={{ fontSize: 12, color: S.txt3, marginTop: 1 }}>Enter available vitals — abnormal values flag automatically</div>
        </div>
        {abnormals.length > 0 && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 8, padding: '4px 12px' }}>
            <span style={{ fontSize: 12 }}>⚠️</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: S.coral, fontWeight: 600 }}>{abnormals.length} ABNORMAL</span>
          </div>
        )}
      </div>

      {/* Vitals Grid */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 16 }}>🩺</span>
          <div style={{ fontSize: 14, fontWeight: 600, color: S.txt }}>Core Vitals</div>
          <span style={{ marginLeft: 'auto', fontSize: 10, color: S.txt4 }}>Red = high · Blue = low · Green = normal</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
          {VITAL_DEFS.map(v => {
            const status = getVitalStatus(v.id, vitals);
            const color = statusColor(status);
            const hasVal = vitals[v.id] !== undefined && vitals[v.id] !== '';
            return (
              <div key={v.id} style={{
                background: hasVal ? (status === 'ok' ? 'rgba(0,229,192,0.04)' : status === 'high' ? 'rgba(255,107,107,0.06)' : 'rgba(59,158,255,0.06)') : S.card,
                border: `1px solid ${hasVal ? color : S.border}`,
                borderRadius: 10, padding: '12px 14px',
                transition: 'all 0.2s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: 18 }}>{v.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: S.txt3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{v.label}</div>
                    <div style={{ fontSize: 9, color: S.txt4, fontFamily: "'JetBrains Mono', monospace" }}>{v.unit}</div>
                  </div>
                  {hasVal && (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 5px ${color}` }} />
                  )}
                </div>
                <input
                  type={v.isText ? 'text' : 'number'}
                  style={{
                    ...inp,
                    fontSize: 16, fontWeight: 700, padding: '6px 10px', textAlign: 'center',
                    color: hasVal ? color : S.txt4,
                    borderColor: hasVal ? color : S.border,
                  }}
                  value={vitals[v.id] || ''}
                  onChange={e => setVitals(p => ({ ...p, [v.id]: e.target.value }))}
                  placeholder={v.ph}
                />
                {hasVal && status !== 'ok' && (
                  <div style={{ marginTop: 4, fontSize: 9, color, textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
                    {status === 'high' ? `▲ HIGH (nml ≤${v.hi})` : `▼ LOW (nml ≥${v.lo})`}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Secondary Assessment */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 16 }}>🧠</span>
          <div style={{ fontSize: 14, fontWeight: 600, color: S.txt }}>Secondary Assessment</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={lbl}>AVPU</label>
            <select style={{ ...inp, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }} value={avpu} onChange={e => setAvpu(e.target.value)}>
              <option value="">— Select —</option>
              {['A — Alert', 'V — Voice', 'P — Pain', 'U — Unresponsive'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={lbl}>Oxygen Delivery</label>
            <select style={{ ...inp, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }} value={o2del} onChange={e => setO2del(e.target.value)}>
              <option value="">— Select —</option>
              {['Room air', 'Nasal cannula 2L', 'Nasal cannula 4L', 'Simple face mask', 'Non-rebreather mask 15L', 'High-flow nasal oxygen', 'BiPAP', 'Intubated / Ventilated'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={lbl}>Pain Score (0–10)</label>
            <input type="number" min="0" max="10" style={{ ...inp, fontSize: 18, fontWeight: 700, textAlign: 'center', color: pain ? (parseInt(pain) >= 7 ? S.coral : parseInt(pain) >= 4 ? S.orange : S.teal) : S.txt4 }} value={pain} onChange={e => setPain(e.target.value)} placeholder="0–10" />
          </div>
        </div>
      </div>

      {/* Triage */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 16 }}>🏥</span>
          <div style={{ fontSize: 14, fontWeight: 600, color: S.txt }}>Triage / Acuity Level</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
          {[
            { val: 'ESI 1 / ATS 1 — Immediate', label: 'ESI 1', sub: 'Immediate', color: S.coral },
            { val: 'ESI 2 / ATS 2 — Emergent', label: 'ESI 2', sub: 'Emergent', color: S.orange },
            { val: 'ESI 3 / ATS 3 — Urgent', label: 'ESI 3', sub: 'Urgent', color: S.gold },
            { val: 'ESI 4 / ATS 4 — Semi-Urgent', label: 'ESI 4', sub: 'Semi-Urgent', color: S.teal },
            { val: 'ESI 5 / ATS 5 — Non-Urgent', label: 'ESI 5', sub: 'Non-Urgent', color: S.txt2 },
          ].map(t => (
            <button key={t.val} onClick={() => setTriage(triage === t.val ? '' : t.val)}
              style={{
                padding: '10px 8px', borderRadius: 8, cursor: 'pointer', border: `1px solid ${triage === t.val ? t.color : S.border}`,
                background: triage === t.val ? `rgba(${t.color === S.coral ? '255,107,107' : t.color === S.orange ? '255,159,67' : t.color === S.gold ? '245,200,66' : t.color === S.teal ? '0,229,192' : '138,172,204'}, 0.1)` : S.card,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, transition: 'all 0.15s', fontFamily: "'DM Sans', sans-serif",
              }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: t.color, boxShadow: triage === t.val ? `0 0 8px ${t.color}` : 'none' }} />
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: triage === t.val ? t.color : S.txt }}>{t.label}</div>
              <div style={{ fontSize: 10, color: triage === t.val ? t.color : S.txt3 }}>{t.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Abnormal Summary */}
      {abnormals.length > 0 && (
        <div style={{ background: 'rgba(255,107,107,0.06)', border: '1px solid rgba(255,107,107,0.25)', borderRadius: 12, padding: '12px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: S.coral, marginBottom: 8 }}>⚠️ Abnormal Values Detected</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {abnormals.map(v => {
              const s = getVitalStatus(v.id, vitals);
              return (
                <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 5, background: S.up, border: `1px solid ${s === 'high' ? 'rgba(255,107,107,0.4)' : 'rgba(59,158,255,0.4)'}`, borderRadius: 6, padding: '3px 10px' }}>
                  <span style={{ fontSize: 12 }}>{v.icon}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: s === 'high' ? S.coral : S.blue }}>{v.label}: {vitals[v.id]} {v.unit}</span>
                  <span style={{ fontSize: 10, color: s === 'high' ? S.coral : S.blue }}>{s === 'high' ? '▲' : '▼'}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}