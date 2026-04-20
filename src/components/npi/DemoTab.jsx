import { useRef, useEffect, useCallback } from 'react';

// ─── FIELD ORDER ──────────────────────────────────────────────────────────────
// allRefs order: [MRN(0), Room(1), firstName(2), lastName(3), ... notes(17)]
// REG_MRN_IDX / REG_ROOM_IDX are the leading registration fields so they are
// reachable by Enter from the very first keystroke, before demographics.
const FIELDS = [
  { key: 'firstName',   label: 'First Name',         placeholder: 'Jane',               type: 'text'   },
  { key: 'lastName',    label: 'Last Name',           placeholder: 'Smith',              type: 'text'   },
  { key: 'dob',         label: 'Date of Birth',       placeholder: 'MM/DD/YYYY',         type: 'text'   },
  { key: 'age',         label: 'Age',                 placeholder: 'yrs',                type: 'number' },
  { key: 'phone',       label: 'Phone',               placeholder: '(555) 555-5555',     type: 'tel'    },
  { key: 'email',       label: 'Email',               placeholder: 'patient@email.com',  type: 'email'  },
  { key: 'address',     label: 'Address',             placeholder: '123 Main St',        type: 'text'   },
  { key: 'city',        label: 'City',                placeholder: 'City, State',        type: 'text'   },
  { key: 'insurance',   label: 'Insurance',           placeholder: 'Carrier name',       type: 'text'   },
  { key: 'insuranceId', label: 'Insurance ID',        placeholder: 'Policy / member #',  type: 'text'   },
  { key: 'emerg',       label: 'Emergency Contact',   placeholder: 'Name & phone',       type: 'text'   },
  { key: 'lang',        label: 'Language',            placeholder: 'English',            type: 'text'   },
  { key: 'height',      label: 'Height',              placeholder: "5'8\" or 172 cm",    type: 'text'   },
  { key: 'weight',      label: 'Weight',              placeholder: 'kg or lbs',          type: 'text'   },
  { key: 'pronouns',    label: 'Pronouns',            placeholder: 'they/them',          type: 'text'   },
  { key: 'notes',       label: 'Notes',               placeholder: 'Additional notes',   type: 'text',   wide: true },
];

const SEX_OPTS = [
  { key: 'm', value: 'Male',       label: 'Male'       },
  { key: 'f', value: 'Female',     label: 'Female'     },
  { key: 'x', value: 'Non-binary', label: 'Non-binary' },
  { key: 'u', value: 'Unknown',    label: 'Unknown'    },
];

const ESI_COLORS = { 1: '#ff6b6b', 2: '#ff9f43', 3: '#ffd93d', 4: '#00e5c0', 5: '#3b9eff' };
const ESI_LABELS = { 1: 'Resuscitation', 2: 'Emergent', 3: 'Urgent', 4: 'Less Urgent', 5: 'Non-urgent' };

// Combined Enter-chain indices
const REG_MRN_IDX  = 0;
const REG_ROOM_IDX = 1;
const FIELD_OFFSET = 2;

// ─── STYLES ───────────────────────────────────────────────────────────────────
const S = {
  input: {
    width: '100%', padding: '9px 12px', boxSizing: 'border-box',
    background: 'rgba(255,255,255,.05)', border: '1px solid rgba(59,130,246,.2)',
    borderRadius: 8, color: '#e2e8f0', fontFamily: "'DM Sans',sans-serif",
    fontSize: 13, outline: 'none', transition: 'border-color .15s',
  },
  label: {
    fontSize: 10, color: 'var(--npi-txt4)', fontFamily: "'JetBrains Mono',monospace",
    textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 5,
  },
};

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function DemoTab({
  demo, setDemo,
  parseText, setParseText, parsing, onSmartParse,
  esiLevel, setEsiLevel,
  registration, setRegistration,
  onAdvance,
}) {
  // Single ordered ref array: [MRN, Room, ...FIELDS]
  const allRefs  = useRef([]);
  const parseRef = useRef(null);

  // Auto-focus first field (MRN) on mount
  useEffect(() => {
    const t = setTimeout(() => allRefs.current[REG_MRN_IDX]?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  // Auto-compute age when DOB changes
  useEffect(() => {
    if (!demo.dob) return;
    const parts = demo.dob.split('/');
    if (parts.length !== 3 || parts[2]?.length < 4) return;
    const d = new Date(`${parts[2]}-${String(parts[0]).padStart(2,'0')}-${String(parts[1]).padStart(2,'0')}`);
    if (isNaN(d.getTime())) return;
    const age = Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000));
    if (age > 0 && age < 130) setDemo(p => ({ ...p, age: String(age) }));
  }, [demo.dob, setDemo]);

  // M/F/X/U — sex shortcut when focus is not inside an input
  useEffect(() => {
    const h = (e) => {
      if (['INPUT','TEXTAREA'].includes(e.target.tagName)) return;
      if (e.ctrlKey || e.metaKey) return;
      const match = SEX_OPTS.find(o => o.key === e.key.toLowerCase());
      if (match) setDemo(p => ({ ...p, sex: p.sex === match.value ? '' : match.value }));
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [setDemo]);

  // 1–5 — ESI shortcut when focus is not inside an input
  useEffect(() => {
    const h = (e) => {
      if (['INPUT','TEXTAREA'].includes(e.target.tagName)) return;
      if (e.ctrlKey || e.metaKey) return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= 5) setEsiLevel(prev => String(prev) === String(n) ? '' : n);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [setEsiLevel]);

  // Cmd+Enter — advance to CC from anywhere on this tab
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

  // Cmd+P — focus SmartParse textarea
  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        parseRef.current?.focus();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  // Enter chain: focus next ref in allRefs; call onAdvance when past last
  const advance = useCallback((idx) => {
    const next = allRefs.current.slice(idx + 1).find(r => r);
    if (next) next.focus();
    else onAdvance?.();
  }, [onAdvance]);

  const onFieldKey = (e, idx) => {
    if (e.key === 'Enter') { e.preventDefault(); advance(idx); }
  };

  const set    = (key, val) => setDemo(p => ({ ...p, [key]: val }));
  const setReg = (key, val) => setRegistration(p => ({ ...p, [key]: val }));

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", maxWidth: 820, display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0, fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 600, color: '#fff' }}>
          Demographics
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <KbdLegend items={[['Enter','Next field'],['M/F/X/U','Set sex'],['1–5','Set ESI'],['⌘↵','→ CC'],['⌘P','SmartParse']]} />
          {onAdvance && <AdvBtn onClick={onAdvance} label="Next: CC →" />}
        </div>
      </div>

      {/* ── Smart Parse ────────────────────────────────────────────────── */}
      <div style={{ background: 'rgba(59,158,255,.05)', border: '1px solid rgba(59,158,255,.18)', borderRadius: 10, padding: '12px 16px' }}>
        <div style={{ fontSize: 10, color: 'var(--npi-blue)', fontFamily: "'JetBrains Mono',monospace", letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>
          ✦ Smart Parse — paste any triage note, EMS runsheet, or referral letter
          <span style={{ fontWeight: 400, color: '#64748b', marginLeft: 8 }}>(⌘P to focus)</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <textarea
            ref={parseRef}
            value={parseText}
            onChange={e => setParseText(e.target.value)}
            placeholder="Paste text to auto-extract patient data..."
            rows={2}
            style={{ flex: 1, padding: '8px 12px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(59,130,246,.18)', borderRadius: 7, color: '#e2e8f0', fontFamily: "'DM Sans',sans-serif", fontSize: 12, resize: 'none', outline: 'none' }}
          />
          <button
            onClick={onSmartParse}
            disabled={parsing || !parseText?.trim()}
            style={{ padding: '8px 18px', borderRadius: 7, background: parsing ? 'transparent' : 'var(--npi-blue)', color: parsing ? 'var(--npi-blue)' : '#050f1e', border: '1px solid rgba(59,158,255,.3)', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', opacity: !parseText?.trim() ? .4 : 1, transition: 'all .15s' }}
          >
            {parsing ? '⏳ Parsing…' : '✦ Parse'}
          </button>
        </div>
      </div>

      {/* ── Registration + ESI ─────────────────────────────────────────── */}
      {/* MRN and Room are allRefs[0] and [1] — first stops in the Enter chain */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 12 }}>
        <div>
          <div style={S.label}>Registration MRN</div>
          <input
            ref={el => { allRefs.current[REG_MRN_IDX] = el; }}
            value={registration.mrn || ''}
            onChange={e => setReg('mrn', e.target.value)}
            onKeyDown={e => onFieldKey(e, REG_MRN_IDX)}
            placeholder="Auto / manual"
            style={S.input}
          />
        </div>
        <div>
          <div style={S.label}>Room / Bay</div>
          <input
            ref={el => { allRefs.current[REG_ROOM_IDX] = el; }}
            value={registration.room || ''}
            onChange={e => setReg('room', e.target.value)}
            onKeyDown={e => onFieldKey(e, REG_ROOM_IDX)}
            placeholder="e.g. Trauma 2"
            style={S.input}
          />
        </div>
        <div>
          <div style={S.label}>ESI Triage Level <Hint>(press 1–5)</Hint></div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[1,2,3,4,5].map(n => {
              const active = String(esiLevel) === String(n);
              const c = ESI_COLORS[n];
              return (
                <button
                  key={n}
                  onClick={() => setEsiLevel(active ? '' : n)}
                  title={ESI_LABELS[n]}
                  style={{ flex: 1, padding: '8px 4px', borderRadius: 7, border: `1px solid ${active ? c : 'rgba(255,255,255,.1)'}`, background: active ? `${c}22` : 'rgba(255,255,255,.04)', color: active ? c : 'var(--npi-txt4)', fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: active ? 700 : 400, cursor: 'pointer', transition: 'all .13s' }}
                >
                  {n}
                </button>
              );
            })}
          </div>
          {esiLevel && (
            <div style={{ fontSize: 10, color: ESI_COLORS[esiLevel], fontFamily: "'JetBrains Mono',monospace", marginTop: 4 }}>
              ESI {esiLevel} — {ESI_LABELS[esiLevel]}
            </div>
          )}
        </div>
      </div>

      {/* ── Sex picker ─────────────────────────────────────────────────── */}
      <div>
        <div style={S.label}>Sex <Hint>(press M / F / X / U)</Hint></div>
        <div style={{ display: 'flex', gap: 7 }}>
          {SEX_OPTS.map(o => {
            const active = demo.sex === o.value;
            return (
              <button
                key={o.key}
                onClick={() => set('sex', active ? '' : o.value)}
                style={{ padding: '8px 20px', borderRadius: 8, border: `1px solid ${active ? 'var(--npi-blue)' : 'rgba(255,255,255,.1)'}`, background: active ? 'rgba(59,158,255,.15)' : 'rgba(255,255,255,.04)', color: active ? 'var(--npi-blue)' : 'var(--npi-txt3)', fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: active ? 600 : 400, cursor: 'pointer', transition: 'all .13s', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <kbd style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, background: active ? 'rgba(59,158,255,.2)' : 'rgba(255,255,255,.06)', border: `1px solid ${active ? 'rgba(59,158,255,.4)' : 'rgba(255,255,255,.12)'}`, borderRadius: 3, padding: '0 5px', color: active ? 'var(--npi-blue)' : 'var(--npi-txt4)' }}>{o.key.toUpperCase()}</kbd>
                {o.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main fields grid ───────────────────────────────────────────── */}
      {/* allRefs[FIELD_OFFSET + i] continues the Enter chain after MRN/Room */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {FIELDS.map((f, i) => (
          <div key={f.key} style={{ gridColumn: f.wide ? '1 / -1' : undefined }}>
            <div style={S.label}>{f.label}</div>
            <input
              ref={el => { allRefs.current[FIELD_OFFSET + i] = el; }}
              type={f.type || 'text'}
              value={demo[f.key] || ''}
              onChange={e => set(f.key, e.target.value)}
              onKeyDown={e => onFieldKey(e, FIELD_OFFSET + i)}
              placeholder={f.placeholder}
              style={S.input}
            />
          </div>
        ))}
      </div>

      <KbdLegend
        items={[
          ['Enter',    'Next field — MRN → Room → First Name → … → Notes → CC'],
          ['Tab',      'Browser-native focus'],
          ['M/F/X/U', 'Set sex (anywhere on this tab)'],
          ['1–5',      'Set ESI level (anywhere on this tab)'],
          ['⌘↵',       'Skip ahead to CC tab immediately'],
          ['⌘P',       'Jump to SmartParse paste box'],
        ]}
        wide
      />
    </div>
  );
}

// ─── SMALL PRIMITIVES ─────────────────────────────────────────────────────────
function Hint({ children }) {
  return (
    <span style={{ fontWeight: 400, color: '#64748b', textTransform: 'none', letterSpacing: 0 }}>
      {children}
    </span>
  );
}

function AdvBtn({ onClick, label }) {
  return (
    <button onClick={onClick}
      style={{ padding: '5px 14px', borderRadius: 7, background: 'var(--npi-teal)', color: '#050f1e', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", whiteSpace: 'nowrap' }}>
      {label}
    </button>
  );
}

function KbdLegend({ items, wide }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: wide ? 14 : 8, padding: '8px 12px', background: 'rgba(14,37,68,.5)', border: '1px solid var(--npi-bd)', borderRadius: 8 }}>
      {items.map(([k, d]) => (
        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--npi-txt4)' }}>
          <kbd style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, background: 'var(--npi-up)', border: '1px solid var(--npi-bhi)', borderRadius: 3, padding: '0 5px', color: 'var(--npi-blue)' }}>{k}</kbd>
          {d}
        </div>
      ))}
    </div>
  );
}