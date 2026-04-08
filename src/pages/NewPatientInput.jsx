import { useState, useEffect, useCallback, useRef } from 'react';
import ROSTab from '@/components/npi/ROSTab';
import PETab from '@/components/npi/PETab';

// ─── FONTS ────────────────────────────────────────────────────────────────────
(function loadFonts() {
  if (document.getElementById('npi-npi-fonts')) return;
  const l = document.createElement('link');
  l.id = 'npi-npi-fonts';
  l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=JetBrains+Mono:wght@400;500&family=DM+Sans:wght@300;400;500;600&display=swap';
  document.head.appendChild(l);
})();

// ─── TOKENS ───────────────────────────────────────────────────────────────────
const T = {
  bg:      '#0a1628',
  surface: '#0d1f3c',
  border:  'rgba(59,130,246,.18)',
  teal:    '#00e5c0',
  blue:    '#3b9eff',
  coral:   '#ff6b6b',
  orange:  '#ff9f43',
  purple:  '#a78bfa',
  yellow:  '#ffd93d',
  text:    '#e2e8f0',
  muted:   '#64748b',
  font:    "'DM Sans', sans-serif",
  mono:    "'JetBrains Mono', monospace",
  serif:   "'Playfair Display', serif",
};

// ─── GLASS ────────────────────────────────────────────────────────────────────
const glass = {
  background: 'rgba(13,31,60,.72)',
  backdropFilter: 'blur(16px) saturate(1.4)',
  WebkitBackdropFilter: 'blur(16px) saturate(1.4)',
  border: '1px solid rgba(59,130,246,.18)',
  borderRadius: 16,
};

// ─── STATIC DATA ──────────────────────────────────────────────────────────────
const TABS = [
  { id: 'intake', label: 'Intake',  icon: '📋', num: 1 },
  { id: 'vitals', label: 'Vitals',  icon: '💗', num: 2 },
  { id: 'hpi',    label: 'HPI',     icon: '📝', num: 3 },
  { id: 'ros',    label: 'ROS',     icon: '🔍', num: 4 },
  { id: 'exam',   label: 'Exam',    icon: '🩺', num: 5 },
  { id: 'mdm',    label: 'MDM',     icon: '🧠', num: 6 },
];

const TRIAGE_LEVELS = [
  { level: 1, label: 'Resuscitation', color: '#ff6b6b' },
  { level: 2, label: 'Emergent',      color: '#ff9f43' },
  { level: 3, label: 'Urgent',        color: '#ffd93d' },
  { level: 4, label: 'Less Urgent',   color: '#00e5c0' },
  { level: 5, label: 'Non-urgent',    color: '#3b9eff' },
];

const MOA_OPTIONS = ['Walk-in', 'EMS', 'Police', 'Transfer', 'Air Transport'];

const VITAL_FIELDS = [
  { id: 'hr',   label: 'Heart Rate',   unit: 'bpm',  lo: 60,   hi: 100,  norm: '75'    },
  { id: 'sbp',  label: 'Systolic BP',  unit: 'mmHg', lo: 90,   hi: 180,  norm: '120'   },
  { id: 'dbp',  label: 'Diastolic BP', unit: 'mmHg', lo: 50,   hi: 110,  norm: '80'    },
  { id: 'rr',   label: 'Resp Rate',    unit: '/min', lo: 12,   hi: 20,   norm: '16'    },
  { id: 'temp', label: 'Temperature',  unit: '°F',   lo: 97.0, hi: 100.4,norm: '98.6'  },
  { id: 'spo2', label: 'SpO₂',         unit: '%',    lo: 95,   hi: 100,  norm: '99'    },
  { id: 'wt',   label: 'Weight',       unit: 'kg',   lo: null, hi: null, norm: ''      },
  { id: 'ht',   label: 'Height',       unit: 'cm',   lo: null, hi: null, norm: ''      },
];

const DISPO_OPTIONS = ['Discharge', 'Admit', 'Observation', 'Transfer', 'AMA', 'Deceased'];

const OPQRST = [
  { key: 'O', label: 'Onset',       hint: 'When did it start? Sudden or gradual?' },
  { key: 'P', label: 'Provocation', hint: 'What makes it better or worse?' },
  { key: 'Q', label: 'Quality',     hint: 'How would you describe it?' },
  { key: 'R', label: 'Radiation',   hint: 'Does it go anywhere else?' },
  { key: 'S', label: 'Severity',    hint: 'Scale 0–10, at worst and now' },
  { key: 'T', label: 'Timing',      hint: 'Constant, intermittent, worsening?' },
];

// ─── PRIMITIVES ───────────────────────────────────────────────────────────────
function AmbientBg() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', top: '-20%', left: '-10%', width: '55%', height: '55%',
        background: 'radial-gradient(ellipse, rgba(0,229,192,.055) 0%, transparent 70%)',
        animation: 'npiAmb1 20s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', bottom: '-15%', right: '-5%', width: '50%', height: '50%',
        background: 'radial-gradient(ellipse, rgba(59,158,255,.065) 0%, transparent 70%)',
        animation: 'npiAmb2 25s ease-in-out infinite',
      }} />
      <style>{`
        @keyframes npiAmb1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(3%,4%)} }
        @keyframes npiAmb2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-2%,-3%)} }
        .npi-input:focus { border-color: ${T.teal} !important; box-shadow: 0 0 0 3px rgba(0,229,192,.12); }
        .npi-input::placeholder { color: ${T.muted}; opacity:.7; }
        .npi-ta:focus { border-color: ${T.blue} !important; box-shadow: 0 0 0 3px rgba(59,158,255,.12); }
        .npi-ta::placeholder { color: ${T.muted}; opacity:.7; }
        .npi-chip:hover { transform: translateY(-1px); }
        .npi-tab-btn:hover { background: rgba(255,255,255,.04) !important; }
      `}</style>
    </div>
  );
}

function StatusDot({ status }) {
  const map = {
    complete: { bg: T.teal,   glow: `0 0 7px ${T.teal}` },
    partial:  { bg: T.orange, glow: `0 0 7px ${T.orange}` },
    empty:    { bg: 'transparent', border: `1.5px solid ${T.muted}`, glow: 'none' },
  };
  const s = map[status] || map.empty;
  return (
    <span style={{
      width: 9, height: 9, borderRadius: '50%', display: 'inline-block', flexShrink: 0,
      background: s.bg, boxShadow: s.glow, border: s.border || 'none',
    }} />
  );
}

function FieldLabel({ children, mono }) {
  return (
    <div style={{
      fontSize: 11, color: T.muted, marginBottom: 6, letterSpacing: '.07em',
      textTransform: 'uppercase', fontFamily: mono ? T.mono : T.font, fontWeight: 500,
    }}>{children}</div>
  );
}

function GhostBtn({ children, onClick, accent, small, active }) {
  return (
    <button
      onClick={onClick}
      className="npi-chip"
      style={{
        padding: small ? '4px 11px' : '7px 16px',
        borderRadius: 8, cursor: 'pointer', transition: 'all .15s',
        border: `1px solid ${active ? (accent || T.teal) : 'rgba(255,255,255,.1)'}`,
        background: active ? `${(accent || T.teal)}18` : 'rgba(255,255,255,.04)',
        color: active ? (accent || T.teal) : T.muted,
        fontFamily: T.font, fontSize: small ? 12 : 13, fontWeight: active ? 600 : 400,
      }}
    >{children}</button>
  );
}

function PrimaryBtn({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 20px', borderRadius: 8, cursor: 'pointer',
        border: 'none', background: T.teal, color: '#0a1628',
        fontFamily: T.font, fontSize: 13, fontWeight: 600,
        transition: 'opacity .15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.opacity = '.85'; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
    >{children}</button>
  );
}

function SectionHead({ title, badge, sub }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <h2 style={{ margin: 0, fontFamily: T.serif, fontSize: 21, fontWeight: 600, color: T.text }}>{title}</h2>
        {badge && (
          <span style={{
            background: 'rgba(0,229,192,.12)', color: T.teal, borderRadius: 20,
            padding: '2px 10px', fontSize: 11, fontFamily: T.mono,
          }}>{badge}</span>
        )}
      </div>
      {sub && <div style={{ fontSize: 12, color: T.muted, marginTop: 5, fontFamily: T.font }}>{sub}</div>}
    </div>
  );
}

// ─── INTAKE TAB ───────────────────────────────────────────────────────────────
function IntakeTab({ cc, setCc, triageLevel, setTriageLevel, moa, setMoa, allergies, setAllergies, onAdvance }) {
  const ccRef = useRef(null);
  useEffect(() => { setTimeout(() => ccRef.current?.focus(), 80); }, []);

  return (
    <div style={{ padding: '28px 32px', maxWidth: 720 }}>
      <SectionHead title="Patient Intake" sub="Chief complaint, triage level, arrival mode" />

      <div style={{ marginBottom: 26 }}>
        <FieldLabel>Chief Complaint *</FieldLabel>
        <input
          ref={ccRef}
          value={cc}
          onChange={e => setCc(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && cc.trim()) onAdvance(); }}
          placeholder="e.g., chest pain, shortness of breath, altered mental status..."
          className="npi-input"
          style={{
            width: '100%', padding: '13px 16px', boxSizing: 'border-box',
            background: 'rgba(255,255,255,.05)',
            border: `1px solid ${cc ? T.teal : 'rgba(59,130,246,.22)'}`,
            borderRadius: 10, color: T.text, fontFamily: T.font, fontSize: 15,
            outline: 'none', transition: 'border-color .15s, box-shadow .15s',
          }}
        />
        <div style={{ fontSize: 11, color: T.muted, marginTop: 5, fontFamily: T.mono }}>
          Press Enter to advance to Vitals
        </div>
      </div>

      <div style={{ marginBottom: 26 }}>
        <FieldLabel>ESI Triage Level</FieldLabel>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {TRIAGE_LEVELS.map(t => (
            <button
              key={t.level}
              onClick={() => setTriageLevel(t.level)}
              style={{
                padding: '8px 15px', borderRadius: 8, cursor: 'pointer', transition: 'all .15s',
                border: `1px solid ${triageLevel === t.level ? t.color : 'rgba(255,255,255,.1)'}`,
                background: triageLevel === t.level ? `${t.color}20` : 'rgba(255,255,255,.04)',
                color: triageLevel === t.level ? t.color : T.muted,
                fontFamily: T.font, fontSize: 12, fontWeight: triageLevel === t.level ? 600 : 400,
              }}
            >ESI {t.level} · {t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 26 }}>
        <div>
          <FieldLabel>Mode of Arrival</FieldLabel>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {MOA_OPTIONS.map(m => (
              <GhostBtn key={m} onClick={() => setMoa(moa === m ? '' : m)} active={moa === m} small accent={T.blue}>
                {m}
              </GhostBtn>
            ))}
          </div>
        </div>
        <div>
          <FieldLabel>Allergies / Reactions</FieldLabel>
          <input
            value={allergies}
            onChange={e => setAllergies(e.target.value)}
            placeholder="NKDA  or  penicillin — rash"
            className="npi-input"
            style={{
              width: '100%', padding: '9px 13px', boxSizing: 'border-box',
              background: 'rgba(255,255,255,.05)', border: '1px solid rgba(59,130,246,.2)',
              borderRadius: 8, color: T.text, fontFamily: T.font, fontSize: 13, outline: 'none',
            }}
          />
        </div>
      </div>

      {cc.trim().length > 0 && (
        <div style={{ paddingTop: 12, borderTop: '1px solid rgba(255,255,255,.06)' }}>
          <PrimaryBtn onClick={onAdvance}>Continue to Vitals →</PrimaryBtn>
        </div>
      )}
    </div>
  );
}

// ─── VITALS TAB ───────────────────────────────────────────────────────────────
function VitalsTab({ vitals, setVitals, onAdvance }) {
  const firstRef = useRef(null);
  useEffect(() => { setTimeout(() => firstRef.current?.focus(), 80); }, []);

  const fillNormals = useCallback(() => {
    const norms = {};
    VITAL_FIELDS.forEach(f => { if (f.norm) norms[f.id] = f.norm; });
    setVitals(v => ({ ...v, ...norms }));
  }, [setVitals]);

  useEffect(() => {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') { e.preventDefault(); fillNormals(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fillNormals]);

  const isAbnormal = (field, val) => {
    if (!val || field.lo === null) return false;
    const n = parseFloat(val);
    return n < field.lo || n > field.hi;
  };

  const bmi = () => {
    const wt = parseFloat(vitals.wt), ht = parseFloat(vitals.ht);
    if (!wt || !ht) return null;
    const htM = ht / 100;
    return (wt / (htM * htM)).toFixed(1);
  };

  const requiredFilled = ['hr','sbp','dbp','rr','temp','spo2'].every(k => vitals[k]?.trim());

  return (
    <div style={{ padding: '28px 32px', maxWidth: 720 }}>
      <SectionHead
        title="Vital Signs"
        sub="Ctrl+N to fill adult normals"
        badge={requiredFilled ? '✓ Complete' : null}
      />

      <div style={{ display: 'flex', gap: 10, marginBottom: 22 }}>
        <PrimaryBtn onClick={fillNormals}>Fill Normals (Ctrl+N)</PrimaryBtn>
        <GhostBtn onClick={() => setVitals({})} accent={T.coral}>Clear All</GhostBtn>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        {VITAL_FIELDS.map((field, i) => {
          const val = vitals[field.id] || '';
          const abn = isAbnormal(field, val);
          return (
            <div key={field.id} style={{
              ...glass, padding: '14px 16px', borderRadius: 10,
              border: abn ? `1px solid ${T.coral}55` : '1px solid rgba(59,130,246,.15)',
              background: abn ? 'rgba(255,107,107,.07)' : 'rgba(13,31,60,.6)',
            }}>
              <FieldLabel mono>{field.label}</FieldLabel>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  ref={i === 0 ? firstRef : null}
                  value={val}
                  onChange={e => setVitals(v => ({ ...v, [field.id]: e.target.value }))}
                  placeholder={field.norm || '—'}
                  type="number"
                  className="npi-input"
                  style={{
                    flex: 1, padding: '7px 10px',
                    background: 'rgba(255,255,255,.06)',
                    border: `1px solid ${abn ? T.coral : 'rgba(59,130,246,.2)'}`,
                    borderRadius: 7, color: abn ? T.coral : T.text,
                    fontFamily: T.mono, fontSize: 16, fontWeight: 500, outline: 'none',
                  }}
                />
                <span style={{ fontSize: 11, color: T.muted, fontFamily: T.mono, whiteSpace: 'nowrap' }}>
                  {field.unit}
                </span>
              </div>
              {abn && (
                <div style={{ fontSize: 10, color: T.coral, marginTop: 4, fontFamily: T.mono }}>
                  ⚠ {field.lo}–{field.hi} {field.unit}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {bmi() && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          background: 'rgba(167,139,250,.1)', border: '1px solid rgba(167,139,250,.25)',
          borderRadius: 8, padding: '7px 16px', marginBottom: 20,
        }}>
          <span style={{ fontSize: 12, color: T.muted, fontFamily: T.mono }}>BMI</span>
          <span style={{ fontFamily: T.mono, fontWeight: 600, color: T.purple, fontSize: 16 }}>{bmi()}</span>
        </div>
      )}

      {requiredFilled && (
        <div style={{ paddingTop: 12, borderTop: '1px solid rgba(255,255,255,.06)' }}>
          <PrimaryBtn onClick={onAdvance}>Continue to HPI →</PrimaryBtn>
        </div>
      )}
    </div>
  );
}

// ─── HPI TAB ──────────────────────────────────────────────────────────────────
function HPITab({ hpi, setHpi, cc, onAdvance }) {
  const taRef = useRef(null);
  useEffect(() => { setTimeout(() => taRef.current?.focus(), 80); }, []);
  const wordCount = hpi.trim() ? hpi.trim().split(/\s+/).length : 0;
  const isComplete = hpi.trim().length > 30;

  return (
    <div style={{ padding: '28px 32px', maxWidth: 760 }}>
      <SectionHead title="History of Present Illness" sub={cc ? `Re: ${cc}` : undefined} />

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20,
      }}>
        {OPQRST.map(o => (
          <div key={o.key} style={{
            background: 'rgba(59,158,255,.06)', borderRadius: 8, padding: '9px 12px',
            border: '1px solid rgba(59,158,255,.15)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
              <span style={{
                fontFamily: T.mono, fontSize: 13, fontWeight: 700, color: T.blue,
                background: 'rgba(59,158,255,.15)', borderRadius: 4, padding: '1px 6px',
              }}>{o.key}</span>
              <span style={{ fontSize: 12, color: T.text, fontWeight: 500, fontFamily: T.font }}>
                {o.label}
              </span>
            </div>
            <div style={{ fontSize: 11, color: T.muted, fontFamily: T.font, lineHeight: 1.4 }}>{o.hint}</div>
          </div>
        ))}
      </div>

      <div>
        <FieldLabel>Free-text HPI</FieldLabel>
        <textarea
          ref={taRef}
          value={hpi}
          onChange={e => setHpi(e.target.value)}
          placeholder="38-year-old male with no significant PMH presenting with..."
          rows={10}
          className="npi-ta"
          style={{
            width: '100%', padding: '14px 16px', boxSizing: 'border-box',
            background: 'rgba(255,255,255,.05)', border: '1px solid rgba(59,130,246,.2)',
            borderRadius: 10, color: T.text, fontFamily: T.font, fontSize: 14, lineHeight: 1.65,
            resize: 'vertical', outline: 'none', transition: 'border-color .15s, box-shadow .15s',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ fontSize: 11, color: T.muted, fontFamily: T.mono }}>
            {wordCount} word{wordCount !== 1 ? 's' : ''}
          </span>
          {isComplete && (
            <span style={{ fontSize: 11, color: T.teal, fontFamily: T.mono }}>✓ HPI captured</span>
          )}
        </div>
      </div>

      {isComplete && (
        <div style={{ marginTop: 20, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,.06)' }}>
          <PrimaryBtn onClick={onAdvance}>Continue to ROS →</PrimaryBtn>
        </div>
      )}
    </div>
  );
}

// ─── MDM TAB ──────────────────────────────────────────────────────────────────
function MDMTab({ mdm, setMdm }) {
  const firstRef = useRef(null);
  useEffect(() => { setTimeout(() => firstRef.current?.focus(), 80); }, []);

  const update = (key, val) => setMdm(m => ({ ...m, [key]: val }));

  return (
    <div style={{ padding: '28px 32px', maxWidth: 760 }}>
      <SectionHead title="Medical Decision Making" sub="Assessment, plan, and disposition" />

      <div style={{ marginBottom: 24 }}>
        <FieldLabel>Assessment / Working Diagnoses</FieldLabel>
        <textarea
          ref={firstRef}
          value={mdm.assessment}
          onChange={e => update('assessment', e.target.value)}
          placeholder={'1. Acute STEMI — high probability\n2. Demand ischemia, r/o\n3. Aortic dissection, r/o'}
          rows={5}
          className="npi-ta"
          style={{
            width: '100%', padding: '13px 16px', boxSizing: 'border-box',
            background: 'rgba(255,255,255,.05)', border: '1px solid rgba(59,130,246,.2)',
            borderRadius: 10, color: T.text, fontFamily: T.font, fontSize: 14, lineHeight: 1.65,
            resize: 'vertical', outline: 'none', transition: 'border-color .15s, box-shadow .15s',
          }}
        />
      </div>

      <div style={{ marginBottom: 24 }}>
        <FieldLabel>Plan</FieldLabel>
        <textarea
          value={mdm.plan}
          onChange={e => update('plan', e.target.value)}
          placeholder={'— ECG, troponin x2, BMP\n— IV access, aspirin 325mg PO\n— Cardiology consult\n— NPO pending cath lab availability'}
          rows={6}
          className="npi-ta"
          style={{
            width: '100%', padding: '13px 16px', boxSizing: 'border-box',
            background: 'rgba(255,255,255,.05)', border: '1px solid rgba(59,130,246,.2)',
            borderRadius: 10, color: T.text, fontFamily: T.font, fontSize: 14, lineHeight: 1.65,
            resize: 'vertical', outline: 'none', transition: 'border-color .15s, box-shadow .15s',
          }}
        />
      </div>

      <div>
        <FieldLabel>Disposition</FieldLabel>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {DISPO_OPTIONS.map(d => {
            const active = mdm.disposition === d;
            const accent = d === 'Discharge' ? T.teal : d === 'Admit' ? T.coral : T.blue;
            return (
              <GhostBtn key={d} onClick={() => update('disposition', active ? '' : d)} active={active} accent={accent}>
                {d}
              </GhostBtn>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── SIDEBAR SUMMARY ──────────────────────────────────────────────────────────
function SidebarSummary({ activeTab, setActiveTab, tabStatuses, cc, triageLevel, vitals, hpi, rosState, peState, peFindings, mdm }) {
  const triageInfo = triageLevel ? TRIAGE_LEVELS.find(t => t.level === triageLevel) : null;

  const abnVitals = VITAL_FIELDS.filter(f => {
    const v = parseFloat(vitals[f.id]);
    return f.lo !== null && vitals[f.id] && (v < f.lo || v > f.hi);
  });

  const rosSystems = Object.keys(rosState);
  const rosPositive = rosSystems.filter(k => rosState[k] === 'has-positives');
  const peSystems = Object.keys(peState);
  const peAbnormal = peSystems.filter(k => peState[k] === 'abnormal' || peState[k] === 'mixed');

  const vitalsSummary = ['hr','sbp','dbp','spo2'].map(k => vitals[k]).filter(Boolean);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Tab nav */}
      <div style={{ padding: '8px 6px', borderBottom: '1px solid rgba(59,130,246,.12)' }}>
        {TABS.map((tab, i) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(i)}
            className="npi-tab-btn"
            style={{
              display: 'flex', alignItems: 'center', gap: 9, width: '100%',
              padding: '9px 12px', marginBottom: 2, border: 'none',
              background: activeTab === i ? 'rgba(0,229,192,.1)' : 'transparent',
              borderLeft: `3px solid ${activeTab === i ? T.teal : 'transparent'}`,
              borderRadius: 8, cursor: 'pointer', transition: 'all .13s',
              color: activeTab === i ? T.teal : T.text,
              fontFamily: T.font, fontSize: 13, fontWeight: activeTab === i ? 600 : 400,
            }}
          >
            <span style={{ fontSize: 15 }}>{tab.icon}</span>
            <span style={{ flex: 1, textAlign: 'left' }}>{tab.label}</span>
            <span style={{
              fontFamily: T.mono, fontSize: 10, color: T.muted,
              background: 'rgba(255,255,255,.06)', borderRadius: 4, padding: '1px 5px',
            }}>{tab.num}</span>
            <StatusDot status={tabStatuses[i]} />
          </button>
        ))}
      </div>

      {/* Live summary */}
      <div style={{ flex: 1, overflow: 'auto', padding: '14px 12px' }}>
        <div style={{ fontSize: 10, color: T.muted, fontFamily: T.mono, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10 }}>
          Live Summary
        </div>

        {cc && (
          <SummaryCard label="CC" accent={T.teal}>
            <span style={{ fontWeight: 600, color: T.text }}>{cc}</span>
            {triageInfo && (
              <span style={{ marginLeft: 6, fontSize: 10, color: triageInfo.color, fontFamily: T.mono }}>
                ESI {triageInfo.level}
              </span>
            )}
          </SummaryCard>
        )}

        {vitalsSummary.length > 0 && (
          <SummaryCard label="Vitals" accent={abnVitals.length > 0 ? T.coral : T.teal}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.text, lineHeight: 1.7 }}>
              {vitals.hr && <span style={{ color: VITAL_FIELDS[0].lo && (parseFloat(vitals.hr) < 60 || parseFloat(vitals.hr) > 100) ? T.coral : T.text }}>HR {vitals.hr} </span>}
              {vitals.sbp && vitals.dbp && <span>BP {vitals.sbp}/{vitals.dbp} </span>}
              {vitals.spo2 && <span style={{ color: parseFloat(vitals.spo2) < 95 ? T.coral : T.text }}>SpO₂ {vitals.spo2}% </span>}
              {vitals.temp && <span style={{ color: parseFloat(vitals.temp) > 100.4 ? T.orange : T.text }}>T {vitals.temp}° </span>}
              {vitals.rr && <span>RR {vitals.rr} </span>}
            </div>
            {abnVitals.length > 0 && (
              <div style={{ fontSize: 10, color: T.coral, marginTop: 3 }}>
                ⚠ {abnVitals.map(f => f.label).join(', ')}
              </div>
            )}
          </SummaryCard>
        )}

        {hpi.trim().length > 10 && (
          <SummaryCard label="HPI" accent={T.blue}>
            <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {hpi.trim().slice(0, 120)}{hpi.length > 120 ? '…' : ''}
            </div>
          </SummaryCard>
        )}

        {rosSystems.length > 0 && (
          <SummaryCard label="ROS" accent={rosPositive.length > 0 ? T.coral : T.teal}>
            <span style={{ fontFamily: T.mono, fontSize: 11, color: T.muted }}>
              {rosSystems.length}/13 systems
            </span>
            {rosPositive.length > 0 && (
              <div style={{ fontSize: 10, color: T.coral, marginTop: 2 }}>
                + {rosPositive.length} positive {rosPositive.length === 1 ? 'system' : 'systems'}
              </div>
            )}
          </SummaryCard>
        )}

        {peSystems.length > 0 && (
          <SummaryCard label="Exam" accent={peAbnormal.length > 0 ? T.coral : T.teal}>
            <span style={{ fontFamily: T.mono, fontSize: 11, color: T.muted }}>
              {peSystems.length}/10 systems
            </span>
            {peAbnormal.length > 0 && (
              <div style={{ fontSize: 10, color: T.coral, marginTop: 2 }}>
                ⚠ {peAbnormal.length} abnormal
              </div>
            )}
          </SummaryCard>
        )}

        {mdm.assessment.trim() && (
          <SummaryCard label="MDM" accent={T.purple}>
            <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {mdm.assessment.trim().slice(0, 100)}
            </div>
            {mdm.disposition && (
              <div style={{ fontSize: 10, color: T.purple, marginTop: 2 }}>→ {mdm.disposition}</div>
            )}
          </SummaryCard>
        )}
      </div>

      {/* Keyboard legend */}
      <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(59,130,246,.1)' }}>
        <div style={{ fontSize: 10, color: T.muted, fontFamily: T.mono, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 7 }}>
          Shortcuts
        </div>
        {[
          ['Ctrl+1–6', 'Jump to tab'],
          ['Ctrl+N',   'Fill normals (Vitals)'],
          ['Ctrl+⇧+N', 'Deny all (ROS)'],
          ['⌘+↵',      'System normal (PE/ROS)'],
        ].map(([k, d]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <code style={{ fontSize: 10, color: T.blue, fontFamily: T.mono }}>{k}</code>
            <span style={{ fontSize: 10, color: T.muted, fontFamily: T.font }}>{d}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryCard({ label, accent, children }) {
  return (
    <div style={{
      marginBottom: 10, padding: '9px 11px',
      background: 'rgba(255,255,255,.03)',
      border: `1px solid ${accent}28`,
      borderLeft: `3px solid ${accent}`,
      borderRadius: 7,
    }}>
      <div style={{ fontSize: 9, color: accent, fontFamily: T.mono, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function NewPatientInput() {
  const [activeTab, setActiveTab] = useState(0);

  // Intake
  const [cc, setCc]               = useState('');
  const [triageLevel, setTriageLevel] = useState(null);
  const [moa, setMoa]             = useState('');
  const [allergies, setAllergies] = useState('');

  // Vitals
  const [vitals, setVitals]       = useState({});

  // HPI
  const [hpi, setHpi]             = useState('');

  // ROS
  const [rosState, setRosState]   = useState({});

  // PE
  const [peState, setPeState]     = useState({});
  const [peFindings, setPeFindings] = useState({});

  // MDM
  const [mdm, setMdm]             = useState({ assessment: '', plan: '', disposition: '' });

  // ── Tab status computation ─────────────────────────────────────────────────
  const tabStatuses = [
    cc.trim() ? 'complete' : 'empty',
    ['hr','sbp','dbp','rr','temp','spo2'].every(k => vitals[k]?.trim()) ? 'complete'
      : Object.values(vitals).some(Boolean) ? 'partial' : 'empty',
    hpi.trim().length > 30 ? 'complete' : hpi.trim().length > 0 ? 'partial' : 'empty',
    Object.keys(rosState).length >= 6 ? 'complete'
      : Object.keys(rosState).length > 0 ? 'partial' : 'empty',
    Object.keys(peState).length >= 5 ? 'complete'
      : Object.keys(peState).length > 0 ? 'partial' : 'empty',
    mdm.assessment.trim() ? 'complete' : mdm.plan.trim() ? 'partial' : 'empty',
  ];

  // ── Global keyboard shortcuts ──────────────────────────────────────────────
  useEffect(() => {
    function handleKey(e) {
      if (!e.ctrlKey && !e.metaKey) return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= 6) { e.preventDefault(); setActiveTab(n - 1); }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // ── Auto-focus CC when returning to Intake ─────────────────────────────────
  useEffect(() => {
    if (activeTab !== 0) return;
    const el = document.getElementById('npi-cc-input');
    if (el) setTimeout(() => el.focus(), 60);
  }, [activeTab]);

  // ── Layout ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh', background: T.bg, fontFamily: T.font, color: T.text,
      display: 'flex', flexDirection: 'column', position: 'relative',
    }}>
      <AmbientBg />

      {/* Header */}
      <div style={{
        position: 'relative', zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 28px',
        background: 'rgba(10,22,40,.85)',
        borderBottom: '1px solid rgba(59,130,246,.15)',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.teal, boxShadow: `0 0 10px ${T.teal}` }} />
          <span style={{ fontFamily: T.serif, fontSize: 18, fontWeight: 600 }}>New Patient</span>
          {cc && (
            <span style={{
              background: 'rgba(0,229,192,.12)', color: T.teal, borderRadius: 6,
              padding: '2px 10px', fontSize: 12, fontFamily: T.mono,
            }}>{cc}</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: T.muted, fontFamily: T.mono }}>
            {tabStatuses.filter(s => s === 'complete').length}/6 complete
          </span>
          <div style={{ display: 'flex', gap: 5 }}>
            {tabStatuses.map((s, i) => (
              <div key={i} style={{
                width: 28, height: 4, borderRadius: 3,
                background: s === 'complete' ? T.teal : s === 'partial' ? T.orange : 'rgba(255,255,255,.1)',
                transition: 'background .3s',
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, position: 'relative', zIndex: 5, overflow: 'hidden' }}>

        {/* Sidebar */}
        <div style={{
          width: 230, flexShrink: 0,
          background: 'rgba(10,22,40,.75)',
          borderRight: '1px solid rgba(59,130,246,.12)',
          backdropFilter: 'blur(10px)',
          display: 'flex', flexDirection: 'column',
          height: 'calc(100vh - 57px)',
          position: 'sticky', top: 57, overflow: 'hidden',
        }}>
          <SidebarSummary
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            tabStatuses={tabStatuses}
            cc={cc}
            triageLevel={triageLevel}
            vitals={vitals}
            hpi={hpi}
            rosState={rosState}
            peState={peState}
            peFindings={peFindings}
            mdm={mdm}
          />
        </div>

        {/* Main panel */}
        <div style={{ flex: 1, overflow: 'auto', maxHeight: 'calc(100vh - 57px)' }}>
          <div style={{ minHeight: '100%', padding: '0 0 60px' }}>

            {activeTab === 0 && (
              <IntakeTab
                cc={cc} setCc={setCc}
                triageLevel={triageLevel} setTriageLevel={setTriageLevel}
                moa={moa} setMoa={setMoa}
                allergies={allergies} setAllergies={setAllergies}
                onAdvance={() => setActiveTab(1)}
              />
            )}

            {activeTab === 1 && (
              <VitalsTab
                vitals={vitals} setVitals={setVitals}
                onAdvance={() => setActiveTab(2)}
              />
            )}

            {activeTab === 2 && (
              <HPITab
                hpi={hpi} setHpi={setHpi}
                cc={cc}
                onAdvance={() => setActiveTab(3)}
              />
            )}

            {activeTab === 3 && (
              <div style={{ height: '100%' }}>
                <ROSTab
                  onStateChange={setRosState}
                  chiefComplaint={cc}
                />
              </div>
            )}

            {activeTab === 4 && (
              <div style={{ height: '100%' }}>
                <PETab
                  peState={peState} setPeState={setPeState}
                  peFindings={peFindings} setPeFindings={setPeFindings}
                />
              </div>
            )}

            {activeTab === 5 && (
              <MDMTab mdm={mdm} setMdm={setMdm} />
            )}

          </div>

          {/* Tab nav footer */}
          <div style={{
            position: 'sticky', bottom: 0,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 28px',
            background: 'rgba(10,22,40,.9)',
            borderTop: '1px solid rgba(59,130,246,.12)',
            backdropFilter: 'blur(10px)',
          }}>
            <button
              onClick={() => setActiveTab(t => Math.max(0, t - 1))}
              disabled={activeTab === 0}
              style={{
                padding: '7px 18px', borderRadius: 8, cursor: activeTab === 0 ? 'not-allowed' : 'pointer',
                border: '1px solid rgba(255,255,255,.1)',
                background: 'rgba(255,255,255,.04)',
                color: activeTab === 0 ? T.muted : T.text,
                fontFamily: T.font, fontSize: 13, opacity: activeTab === 0 ? .4 : 1,
              }}
            >← {activeTab > 0 ? TABS[activeTab - 1].label : 'Back'}</button>

            <div style={{ display: 'flex', gap: 8 }}>
              {TABS.map((tab, i) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(i)}
                  style={{
                    width: 32, height: 32, borderRadius: 8, cursor: 'pointer',
                    border: `1px solid ${i === activeTab ? T.teal : 'rgba(255,255,255,.1)'}`,
                    background: i === activeTab ? 'rgba(0,229,192,.15)' : 'rgba(255,255,255,.04)',
                    color: i === activeTab ? T.teal : T.muted,
                    fontFamily: T.mono, fontSize: 12, fontWeight: 600,
                  }}
                  title={`${tab.label} (Ctrl+${tab.num})`}
                >{tab.num}</button>
              ))}
            </div>

            <button
              onClick={() => setActiveTab(t => Math.min(5, t + 1))}
              disabled={activeTab === 5}
              style={{
                padding: '7px 18px', borderRadius: 8, cursor: activeTab === 5 ? 'not-allowed' : 'pointer',
                border: `1px solid ${T.teal}44`,
                background: 'rgba(0,229,192,.08)',
                color: activeTab === 5 ? T.muted : T.teal,
                fontFamily: T.font, fontSize: 13, opacity: activeTab === 5 ? .4 : 1, fontWeight: 500,
              }}
            >{activeTab < 5 ? TABS[activeTab + 1].label : 'Done'} →</button>
          </div>
        </div>
      </div>
    </div>
  );
}