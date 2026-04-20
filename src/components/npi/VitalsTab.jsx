import { useRef, useEffect, useCallback } from 'react';
import VitalsPasteParser from "@/components/npi/VitalsPasteParser";
import VitalsFhirPoll    from "@/components/npi/VitalsFhirPoll";

// ─── VITAL FIELD DEFINITIONS ──────────────────────────────────────────────────
const VITAL_FIELDS = [
  { key: 'hr',     label: 'Heart Rate',     unit: 'bpm',     lo: 60,   hi: 100,   norm: '75'    },
  { key: 'bp',     label: 'Blood Pressure', unit: 'mmHg',    lo: null, hi: null,  norm: '120/80', text: true },
  { key: 'rr',     label: 'Resp Rate',      unit: '/min',    lo: 12,   hi: 20,    norm: '16'    },
  { key: 'spo2',   label: 'SpO\u2082',      unit: '%',       lo: 95,   hi: 100,   norm: '99'    },
  { key: 'temp',   label: 'Temperature',    unit: '\u00b0F', lo: 97.0, hi: 100.4, norm: '98.6'  },
  { key: 'gcs',    label: 'GCS',            unit: '/15',     lo: 14,   hi: 15,    norm: '15'    },
  { key: 'weight', label: 'Weight',         unit: 'kg',      lo: null, hi: null,  norm: ''      },
  { key: 'height', label: 'Height',         unit: 'cm',      lo: null, hi: null,  norm: ''      },
];

const ADULT_NORMALS = Object.fromEntries(
  VITAL_FIELDS.filter(f => f.norm).map(f => [f.key, f.norm])
);

const AVPU_OPTS = [
  { key: 'a', value: 'Alert',        label: 'Alert',        color: 'var(--npi-teal)'   },
  { key: 'v', value: 'Voice',        label: 'Voice',        color: 'var(--npi-blue)'   },
  { key: 'p', value: 'Pain',         label: 'Pain',         color: 'var(--npi-orange)' },
  { key: 'u', value: 'Unresponsive', label: 'Unresponsive', color: 'var(--npi-coral)'  },
];

// O2 delivery options — keyboard shortcut: Shift+1..8 (avoids conflict with 0-9 pain scale)
const O2_OPTS = [
  'Room air', 'Nasal cannula', 'Simple mask', 'Non-rebreather',
  'High-flow NC', 'BiPAP / CPAP', 'Intubated', 'Other',
];

const PAIN_COLOR = (n) => n >= 7 ? 'var(--npi-coral)' : n >= 4 ? 'var(--npi-orange)' : 'var(--npi-teal)';

const isAbn = (f, v) => {
  if (!v || f.lo === null) return false;
  const n = parseFloat(v);
  return n < f.lo || n > f.hi;
};

const FL = {
  fontSize: 10, color: 'var(--npi-txt4)', fontFamily: "'JetBrains Mono',monospace",
  textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 5,
};

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function VitalsTab({
  vitals, setVitals, avpu, setAvpu,
  o2del, setO2del, pain, setPain,
  triage, setTriage,
  onAdvance, onToast,
  registration, demo,
}) {
  const refs = useRef([]);

  // Auto-focus first vital field on mount
  useEffect(() => {
    const t = setTimeout(() => refs.current[0]?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  // Ctrl+N / Cmd+N — fill adult normals
  useEffect(() => {
    const h = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        setVitals(v => ({ ...v, ...ADULT_NORMALS }));
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [setVitals]);

  // Cmd+Enter — advance to Meds from anywhere on this tab
  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        onAdvance?.();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onAdvance]);

  // A/V/P/U — AVPU shortcut when not in an input
  useEffect(() => {
    const h = (e) => {
      if (['INPUT','TEXTAREA'].includes(e.target.tagName)) return;
      if (e.ctrlKey || e.metaKey || e.shiftKey) return;
      const match = AVPU_OPTS.find(o => o.key === e.key.toLowerCase());
      if (match) setAvpu(prev => prev === match.value ? '' : match.value);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [setAvpu]);

  // 0–9 — pain scale when not in an input (Shift excluded to avoid O2 conflict)
  useEffect(() => {
    const h = (e) => {
      if (['INPUT','TEXTAREA'].includes(e.target.tagName)) return;
      if (e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (/^[0-9]$/.test(e.key)) setPain(prev => prev === e.key ? '' : e.key);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [setPain]);

  // Shift+1..8 — O2 delivery selection when not in an input
  // Uses Shift modifier to avoid conflicting with 0-9 pain scale
  useEffect(() => {
    const h = (e) => {
      if (['INPUT','TEXTAREA'].includes(e.target.tagName)) return;
      if (!e.shiftKey || e.ctrlKey || e.metaKey) return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= O2_OPTS.length) {
        const opt = O2_OPTS[n - 1];
        setO2del(prev => prev === opt ? '' : opt);
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [setO2del]);

  // Enter → advance through vital fields; last field → onAdvance
  const advance = useCallback((idx) => {
    const next = refs.current.slice(idx + 1).find(Boolean);
    if (next) next.focus();
    else onAdvance?.();
  }, [onAdvance]);

  const onKey = (e, idx) => {
    if (e.key === 'Enter') { e.preventDefault(); advance(idx); }
  };

  const set = (key, val) => setVitals(p => ({ ...p, [key]: val }));

  const bmi = () => {
    const wt = parseFloat(vitals.weight), ht = parseFloat(vitals.height);
    if (!wt || !ht) return null;
    return (wt / ((ht / 100) ** 2)).toFixed(1);
  };

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", maxWidth: 800, display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0, fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 600, color: '#fff' }}>
          Vital Signs
        </h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <VitalsPasteParser vitals={vitals} setVitals={setVitals} onToast={onToast} />
          <VitalsFhirPoll
            vitals={vitals} setVitals={setVitals} onToast={onToast}
            patientMrn={registration?.mrn || demo?.mrn}
            patientFhirId={demo?.fhirId}
          />
          <button
            onClick={() => setVitals(v => ({ ...v, ...ADULT_NORMALS }))}
            style={{ padding: '5px 14px', borderRadius: 7, background: 'rgba(0,229,192,.1)', border: '1px solid rgba(0,229,192,.3)', color: 'var(--npi-teal)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            Fill Normals
            <kbd style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, background: 'rgba(0,229,192,.15)', border: '1px solid rgba(0,229,192,.3)', borderRadius: 3, padding: '0 4px' }}>
              Ctrl+N
            </kbd>
          </button>
          <button
            onClick={() => setVitals({})}
            style={{ padding: '5px 12px', borderRadius: 7, background: 'none', border: '1px solid rgba(255,255,255,.12)', color: 'var(--npi-txt4)', fontSize: 12, cursor: 'pointer' }}>
            Clear
          </button>
          {onAdvance && (
            <button onClick={onAdvance}
              style={{ padding: '5px 14px', borderRadius: 7, background: 'var(--npi-teal)', color: '#050f1e', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              Next: Meds
              <kbd style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, background: 'rgba(5,15,30,.3)', borderRadius: 3, padding: '0 4px' }}>
                ⌘↵
              </kbd>
            </button>
          )}
        </div>
      </div>

      {/* ── Vital fields grid ──────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {VITAL_FIELDS.map((f, i) => {
          const val = vitals[f.key] || '';
          const abn = isAbn(f, val);
          return (
            <div key={f.key} style={{ background: abn ? 'rgba(255,107,107,.07)' : 'rgba(13,31,60,.6)', border: `1px solid ${abn ? 'rgba(255,107,107,.4)' : 'rgba(59,130,246,.15)'}`, borderRadius: 10, padding: '12px 14px', transition: 'border-color .2s' }}>
              <div style={{ ...FL, color: abn ? 'var(--npi-coral)' : 'var(--npi-txt4)', marginBottom: 5 }}>{f.label}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <input
                  ref={el => { refs.current[i] = el; }}
                  value={val}
                  onChange={e => set(f.key, e.target.value)}
                  onKeyDown={e => onKey(e, i)}
                  placeholder={f.norm || '—'}
                  type={f.text ? 'text' : 'number'}
                  step={f.key === 'temp' ? '0.1' : '1'}
                  style={{ flex: 1, padding: '7px 9px', background: 'rgba(255,255,255,.07)', border: `1px solid ${abn ? 'rgba(255,107,107,.5)' : 'rgba(59,130,246,.2)'}`, borderRadius: 6, color: abn ? 'var(--npi-coral)' : '#e2e8f0', fontFamily: "'JetBrains Mono',monospace", fontSize: 17, fontWeight: 600, outline: 'none', transition: 'border-color .15s' }}
                />
                <span style={{ fontSize: 10, color: 'var(--npi-txt4)', fontFamily: "'JetBrains Mono',monospace", whiteSpace: 'nowrap', lineHeight: 1 }}>{f.unit}</span>
              </div>
              {abn && (
                <div style={{ fontSize: 9, color: 'var(--npi-coral)', marginTop: 3, fontFamily: "'JetBrains Mono',monospace" }}>
                  Normal: {f.lo}–{f.hi}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── BMI ────────────────────────────────────────────────────────── */}
      {bmi() && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(155,109,255,.1)', border: '1px solid rgba(155,109,255,.25)', borderRadius: 8, padding: '6px 14px', alignSelf: 'flex-start' }}>
          <span style={{ fontSize: 11, color: 'var(--npi-txt4)', fontFamily: "'JetBrains Mono',monospace" }}>BMI</span>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: 'var(--npi-purple)', fontSize: 16 }}>{bmi()}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>

        {/* ── Pain scale ─────────────────────────────────────────────── */}
        <div>
          <div style={FL}>
            Pain Scale
            <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#64748b' }}> (press 0–9)</span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {[0,1,2,3,4,5,6,7,8,9].map(n => {
              const active = pain === String(n);
              const c = PAIN_COLOR(n);
              return (
                <button key={n} onClick={() => setPain(active ? '' : String(n))}
                  style={{ flex: 1, padding: '8px 0', borderRadius: 7, border: `1px solid ${active ? c : 'rgba(255,255,255,.1)'}`, background: active ? c+'22' : 'rgba(255,255,255,.04)', color: active ? c : 'var(--npi-txt4)', fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: active ? 700 : 400, cursor: 'pointer', transition: 'all .12s' }}>
                  {n}
                </button>
              );
            })}
          </div>
          {pain && (
            <div style={{ fontSize: 10, color: PAIN_COLOR(parseInt(pain)), fontFamily: "'JetBrains Mono',monospace", marginTop: 4 }}>
              Pain: {pain}/9
            </div>
          )}
        </div>

        {/* ── AVPU ───────────────────────────────────────────────────── */}
        <div>
          <div style={FL}>
            AVPU
            <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#64748b' }}> (press A/V/P/U)</span>
          </div>
          <div style={{ display: 'flex', gap: 5 }}>
            {AVPU_OPTS.map(o => {
              const active = avpu === o.value;
              return (
                <button key={o.key} onClick={() => setAvpu(active ? '' : o.value)}
                  style={{ flex: 1, padding: '7px 4px', borderRadius: 7, border: `1px solid ${active ? o.color : 'rgba(255,255,255,.1)'}`, background: active ? o.color+'22' : 'rgba(255,255,255,.04)', color: active ? o.color : 'var(--npi-txt3)', fontFamily: "'DM Sans',sans-serif", fontSize: 10, cursor: 'pointer', transition: 'all .12s', textAlign: 'center' }}>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 700 }}>{o.key.toUpperCase()}</div>
                  <div style={{ fontSize: 8, marginTop: 1 }}>{o.label.replace(o.key.toUpperCase(),'').trim()}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── O2 delivery ────────────────────────────────────────────── */}
        {/* Keyboard: Shift+1..8 (Shift avoids conflict with 0-9 pain scale) */}
        <div>
          <div style={FL}>
            O\u2082 Delivery
            <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#64748b' }}> (Shift+1–8)</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {O2_OPTS.map((opt, i) => {
              const active = o2del === opt;
              return (
                <button key={opt} onClick={() => setO2del(active ? '' : opt)}
                  style={{ padding: '4px 9px', borderRadius: 6, border: `1px solid ${active ? 'var(--npi-blue)' : 'rgba(255,255,255,.1)'}`, background: active ? 'rgba(59,158,255,.15)' : 'rgba(255,255,255,.04)', color: active ? 'var(--npi-blue)' : 'var(--npi-txt3)', fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: active ? 600 : 400, cursor: 'pointer', transition: 'all .12s', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: active ? 'var(--npi-blue)' : 'var(--npi-blue)', opacity: .6 }}>
                    ⇧{i+1}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Keyboard legend ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: '8px 12px', background: 'rgba(14,37,68,.5)', border: '1px solid var(--npi-bd)', borderRadius: 8 }}>
        {[
          ['Enter',   'Next vital field'],
          ['⌘↵',      '→ Meds (from anywhere)'],
          ['Ctrl+N',  'Fill adult normals'],
          ['0–9',     'Pain scale'],
          ['A/V/P/U', 'AVPU level'],
          ['⇧1–8',    'O\u2082 delivery'],
        ].map(([k, d]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--npi-txt4)' }}>
            <kbd style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, background: 'var(--npi-up)', border: '1px solid var(--npi-bhi)', borderRadius: 3, padding: '0 5px', color: 'var(--npi-blue)' }}>{k}</kbd>
            {d}
          </div>
        ))}
        <div style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--npi-txt4)', fontStyle: 'italic' }}>
          pain/AVPU/O\u2082 shortcuts active when no input is focused
        </div>
      </div>
    </div>
  );
}