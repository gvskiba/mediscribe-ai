import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

// ─── FONTS ────────────────────────────────────────────────────────────────────
(() => {
  if (document.getElementById('cnv2-fonts')) return;
  const l = document.createElement('link');
  l.id = 'cnv2-fonts'; l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap';
  document.head.appendChild(l);
})();

// ─── TOKENS ───────────────────────────────────────────────────────────────────
const T = {
  bg:     '#040d1a',
  panel:  '#071220',
  card:   '#091828',
  up:     '#0d2240',
  bd:     'rgba(42,79,122,.35)',
  bhi:    'rgba(59,130,246,.4)',
  teal:   '#00e5c0',
  blue:   '#3b9eff',
  coral:  '#ff6b6b',
  orange: '#ff9f43',
  purple: '#9b6dff',
  gold:   '#f5c842',
  txt:    '#f0f6ff',
  txt2:   '#b8d4f0',
  txt3:   '#82aece',
  txt4:   '#4a7090',
  font:   "'DM Sans', sans-serif",
  mono:   "'JetBrains Mono', monospace",
  serif:  "'Playfair Display', serif",
};

// ─── SECTION SCHEMA ───────────────────────────────────────────────────────────
const SECTIONS = [
  { id: 'cc',     label: 'Chief Complaint',              icon: '💬', key: '1' },
  { id: 'hpi',    label: 'History of Present Illness',   icon: '📝', key: '2' },
  { id: 'ros',    label: 'Review of Systems',            icon: '🔍', key: '3' },
  { id: 'pmh',    label: 'Past Medical / Surgical Hx',   icon: '📋', key: '4' },
  { id: 'meds',   label: 'Medications & Allergies',      icon: '💊', key: '5' },
  { id: 'pe',     label: 'Physical Exam',                icon: '🩺', key: '6' },
  { id: 'data',   label: 'Data / Results',               icon: '🧪', key: '7' },
  { id: 'mdm',    label: 'Medical Decision Making',      icon: '⚖️',  key: '8' },
  { id: 'plan',   label: 'Assessment & Plan',            icon: '🗺️',  key: '9' },
  { id: 'dispo',  label: 'Disposition',                  icon: '🚪', key: '0' },
];

const NOTE_TYPES = [
  'ED Progress Note', 'History & Physical', 'Discharge Summary',
  'Consult Note', 'Procedure Note', 'Addendum',
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function wordCount(str) {
  return str.trim() ? str.trim().split(/\s+/).length : 0;
}

function getCompleteness(sections) {
  const filled = Object.values(sections).filter(v => v.trim().length > 20).length;
  return Math.round((filled / SECTIONS.length) * 100);
}

// ─── PRIMITIVES ───────────────────────────────────────────────────────────────
function SectionDot({ value }) {
  const len = value?.trim().length || 0;
  const bg = len > 40 ? T.teal : len > 0 ? T.orange : 'transparent';
  const border = len === 0 ? `1.5px solid ${T.txt4}` : 'none';
  return (
    <span style={{
      width: 8, height: 8, borderRadius: '50%', display: 'inline-block',
      background: bg, border, boxShadow: len > 40 ? `0 0 6px ${T.teal}88` : 'none',
      flexShrink: 0, transition: 'all .25s',
    }} />
  );
}

function AIBadge({ loading }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: loading ? 'rgba(155,109,255,.18)' : 'rgba(155,109,255,.1)',
      border: `1px solid rgba(155,109,255,${loading ? '.45' : '.25'})`,
      borderRadius: 20, padding: '2px 9px',
      fontSize: 10, fontFamily: T.mono, color: T.purple,
    }}>
      {loading ? (
        <><span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: T.purple, animation: 'cnv2pulse 1s infinite' }} />Generating…</>
      ) : '✦ AI Ready'}
    </span>
  );
}

// ─── SECTION EDITOR ───────────────────────────────────────────────────────────
function SectionEditor({ section, value, onChange, onGenerate, generating, patientCtx }) {
  const taRef = useRef(null);
  useEffect(() => { taRef.current?.focus(); }, [section.id]);
  const wc = wordCount(value);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>

      {/* Section top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 22 }}>{section.icon}</span>
        <span style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 700, color: T.txt }}>{section.label}</span>
        <span style={{
          fontFamily: T.mono, fontSize: 9, color: T.txt4, background: T.up,
          border: `1px solid ${T.bd}`, borderRadius: 4, padding: '1px 6px',
        }}>⌘{section.key}</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: T.txt4, fontFamily: T.mono }}>{wc} words</span>
        <button
          onClick={() => onGenerate(section.id, section.label, value)}
          disabled={generating}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '5px 13px', borderRadius: 8, cursor: generating ? 'not-allowed' : 'pointer',
            border: `1px solid rgba(155,109,255,${generating ? '.2' : '.35'})`,
            background: generating ? 'rgba(155,109,255,.06)' : 'rgba(155,109,255,.12)',
            color: generating ? T.purple + '88' : T.purple,
            fontFamily: T.font, fontSize: 12, fontWeight: 600,
            transition: 'all .15s', opacity: generating ? .6 : 1,
          }}
        >
          {generating ? '⟳ Drafting…' : '✦ AI Draft'}
        </button>
      </div>

      {/* Textarea */}
      <textarea
        ref={taRef}
        value={value}
        onChange={e => onChange(section.id, e.target.value)}
        placeholder={getPlaceholder(section.id)}
        style={{
          flex: 1, width: '100%', minHeight: 260,
          background: 'rgba(13,34,64,.55)',
          border: `1px solid ${value.trim().length > 0 ? T.bhi : T.bd}`,
          borderRadius: 12, padding: '16px 18px',
          color: T.txt, fontFamily: T.font, fontSize: 14, lineHeight: 1.75,
          resize: 'none', outline: 'none',
          transition: 'border-color .15s, box-shadow .15s',
          boxShadow: value.trim().length > 0 ? `0 0 0 1px rgba(59,130,246,.1)` : 'none',
          boxSizing: 'border-box',
        }}
        onFocus={e => { e.target.style.borderColor = T.teal; e.target.style.boxShadow = `0 0 0 2px rgba(0,229,192,.1)`; }}
        onBlur={e => { e.target.style.borderColor = value.trim().length > 0 ? T.bhi : T.bd; e.target.style.boxShadow = 'none'; }}
      />

      {/* Bottom strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {value.trim().length > 0 && (
          <span style={{ fontSize: 11, color: T.teal, fontFamily: T.mono }}>✓ {wc} word{wc !== 1 ? 's' : ''}</span>
        )}
        <div style={{ flex: 1 }} />
        {value.trim().length > 0 && (
          <button
            onClick={() => onChange(section.id, '')}
            style={{
              background: 'transparent', border: `1px solid ${T.bd}`, borderRadius: 6,
              padding: '3px 10px', fontSize: 11, color: T.txt4, cursor: 'pointer',
              fontFamily: T.font, transition: 'all .12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.coral; e.currentTarget.style.color = T.coral; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.bd; e.currentTarget.style.color = T.txt4; }}
          >Clear</button>
        )}
      </div>
    </div>
  );
}

function getPlaceholder(id) {
  const p = {
    cc:    'Patient presents with… (chief complaint in patient\'s own words or triage note)',
    hpi:   '38-year-old male with no significant PMH presenting with sudden-onset chest pain…\n\nOnset: …\nQuality: …\nSeverity: …\nRadiation: …\nAssociated symptoms: …',
    ros:   'Constitutional: Denies fever, chills, fatigue.\nCVS: Reports chest pain. Denies palpitations, orthopnea.\nResp: Denies SOB, cough, hemoptysis.\nGI: Denies nausea, vomiting, abdominal pain.\nNeuro: Denies dizziness, focal weakness.',
    pmh:   'PMH: Hypertension, Hyperlipidemia, Type 2 Diabetes\nPSH: Appendectomy (2010)\nFamily Hx: Father — MI age 54\nSocial Hx: Non-smoker, occasional alcohol, denies illicit drug use',
    meds:  'Medications:\n- Metoprolol 50mg PO daily\n- Atorvastatin 40mg PO nightly\n- Metformin 1000mg PO BID\n\nAllergies: Penicillin (rash)',
    pe:    'General: Well-appearing, in no acute distress\nVS: HR 88 BP 142/88 RR 16 SpO₂ 98% T 98.4°F\nCV: RRR, no murmurs/rubs/gallops\nResp: CTAB, no wheezes/rales/rhonchi\nAbd: Soft, NT/ND, +BS\nExt: No edema',
    data:  'Labs: Troponin 0.04 (H), BMP within normal limits, CBC: WBC 11.2\nECG: Normal sinus rhythm, no ST changes\nImaging: CXR — no acute cardiopulmonary process',
    mdm:   'Complexity: Moderate\n\nData reviewed: ECG, troponin, CXR\nDifferential: ACS vs. demand ischemia vs. MSK\nRisk stratification: HEART score 4 (low-intermediate)\nDecision rationale: …',
    plan:  '1. Chest pain, r/o ACS\n   - Serial troponins q3h × 2\n   - Aspirin 325mg PO given\n   - Cardiology consult placed\n\n2. Hypertension — continue home medications\n\n3. Disposition: Admit to telemetry pending troponin result',
    dispo: 'Disposition: Admit to cardiology / telemetry\nCondition: Stable\nFollow-up: Cardiology within 24h\nReturn precautions: Discussed with patient and family',
  };
  return p[id] || 'Begin typing or click AI Draft to generate…';
}

// ─── FULL NOTE PREVIEW ────────────────────────────────────────────────────────
function NotePreview({ sections, sectionValues, patient, noteType, onClose }) {
  const built = SECTIONS.map(s => {
    const v = sectionValues[s.id]?.trim();
    if (!v) return null;
    return `**${s.label.toUpperCase()}**\n${v}`;
  }).filter(Boolean).join('\n\n');

  const header = [
    patient.name && `Patient: ${patient.name}`,
    patient.age && patient.sex && `${patient.age}y ${patient.sex}`,
    patient.mrn && `MRN: ${patient.mrn}`,
    `Date: ${new Date().toLocaleDateString()}`,
    `Type: ${noteType}`,
  ].filter(Boolean).join('  ·  ');

  const copyText = `${header}\n${'─'.repeat(60)}\n\n${built}`;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(3,8,18,.88)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: T.panel, border: `1px solid ${T.bhi}`,
          borderRadius: 16, width: '100%', maxWidth: 780,
          maxHeight: '88vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 32px 80px rgba(0,0,0,.65)',
        }}
      >
        {/* Preview header */}
        <div style={{
          padding: '14px 20px', borderBottom: `1px solid ${T.bd}`,
          display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
        }}>
          <span style={{ fontFamily: T.serif, fontSize: 15, fontWeight: 700, color: T.txt }}>Note Preview</span>
          <span style={{ fontSize: 11, color: T.txt4, fontFamily: T.mono }}>{noteType}</span>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => { navigator.clipboard.writeText(copyText); }}
            style={{
              background: 'rgba(0,229,192,.1)', border: `1px solid rgba(0,229,192,.3)`,
              borderRadius: 7, padding: '5px 14px', fontSize: 12, fontWeight: 600,
              color: T.teal, cursor: 'pointer', fontFamily: T.font,
            }}
          >📋 Copy</button>
          <button
            onClick={onClose}
            style={{
              background: T.up, border: `1px solid ${T.bd}`, borderRadius: 7,
              width: 32, height: 32, color: T.txt3, cursor: 'pointer', fontSize: 16,
            }}
          >✕</button>
        </div>

        {/* Preview body */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
          <div style={{
            fontFamily: T.mono, fontSize: 11, color: T.txt3,
            background: 'rgba(0,0,0,.3)', borderRadius: 8, padding: '10px 14px',
            marginBottom: 20,
          }}>{header}</div>
          {SECTIONS.map(s => {
            const v = sectionValues[s.id]?.trim();
            if (!v) return null;
            return (
              <div key={s.id} style={{ marginBottom: 22 }}>
                <div style={{
                  fontFamily: T.mono, fontSize: 10, fontWeight: 700, letterSpacing: '2px',
                  textTransform: 'uppercase', color: T.blue, marginBottom: 8,
                  paddingBottom: 5, borderBottom: `1px solid rgba(59,130,246,.18)`,
                }}>{s.icon} {s.label}</div>
                <div style={{
                  fontFamily: T.font, fontSize: 13, color: T.txt2, lineHeight: 1.8,
                  whiteSpace: 'pre-wrap',
                }}>{v}</div>
              </div>
            );
          })}
          {!SECTIONS.some(s => sectionValues[s.id]?.trim()) && (
            <div style={{ textAlign: 'center', color: T.txt4, fontFamily: T.mono, fontSize: 12, padding: 40 }}>
              No content yet — fill in sections to preview the note.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── AI PANEL ─────────────────────────────────────────────────────────────────
function AIPanel({ open, onClose, patient, sectionValues, onInsert }) {
  const [msgs, setMsgs] = useState([
    { role: 'sys', text: '✦ Notrya AI — ask about the note or request clinical support.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const msgsRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open]);

  useEffect(() => {
    msgsRef.current?.scrollTo({ top: 99999, behavior: 'smooth' });
  }, [msgs, loading]);

  const buildCtx = () => {
    const filled = SECTIONS.map(s => {
      const v = sectionValues[s.id]?.trim();
      return v ? `${s.label}: ${v.slice(0, 200)}` : null;
    }).filter(Boolean).join('\n');
    return `Patient: ${patient.name || 'Unknown'}, ${patient.age || '?'}y ${patient.sex || ''}\n${filled}`;
  };

  const send = useCallback(async (text) => {
    if (!text.trim() || loading) return;
    setMsgs(m => [...m, { role: 'user', text }]);
    setInput('');
    setLoading(true);
    try {
      const ctx = buildCtx();
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Notrya AI, a clinical documentation assistant. Be concise and evidence-based.\n\nNOTE CONTEXT:\n${ctx}\n\nQUESTION:\n${text}`,
      });
      const reply = typeof res === 'string' ? res : JSON.stringify(res);
      setMsgs(m => [...m, { role: 'bot', text: reply }]);
    } catch {
      setMsgs(m => [...m, { role: 'sys', text: '⚠ Connection error — please try again.' }]);
    } finally {
      setLoading(false);
    }
  }, [loading, sectionValues, patient]); // eslint-disable-line

  const QUICK = [
    { label: 'Summarise', prompt: 'Give me a 3-sentence clinical summary of this patient.' },
    { label: 'DDx',       prompt: 'What are the top 3 differential diagnoses based on this presentation?' },
    { label: 'Gaps',      prompt: 'What key information is missing from this note?' },
    { label: 'MDM',       prompt: 'Draft a concise MDM paragraph for this patient.' },
  ];

  return (
    <div style={{
      position: 'fixed', right: open ? 0 : -380, top: 0, bottom: 0, zIndex: 400,
      width: 360, background: T.panel,
      borderLeft: `1px solid ${T.bd}`,
      display: 'flex', flexDirection: 'column',
      transition: 'right .28s cubic-bezier(.4,0,.2,1)',
      boxShadow: open ? '-16px 0 48px rgba(0,0,0,.4)' : 'none',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px', borderBottom: `1px solid ${T.bd}`,
        display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9, flexShrink: 0,
          background: 'linear-gradient(135deg,#9b6dff,#6d3fff)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
        }}>✦</div>
        <div>
          <div style={{ fontFamily: T.serif, fontSize: 13, fontWeight: 700, color: T.txt }}>Notrya AI</div>
          <div style={{ fontFamily: T.mono, fontSize: 9, color: T.txt3 }}>Clinical assistant · online</div>
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={onClose} style={{
          background: T.up, border: `1px solid ${T.bd}`, borderRadius: 7,
          width: 28, height: 28, color: T.txt3, cursor: 'pointer', fontSize: 14,
        }}>✕</button>
      </div>

      {/* Quick chips */}
      <div style={{ padding: '10px 12px', borderBottom: `1px solid ${T.bd}`, display: 'flex', flexWrap: 'wrap', gap: 5, flexShrink: 0 }}>
        {QUICK.map(q => (
          <button key={q.label} onClick={() => send(q.prompt)} disabled={loading} style={{
            padding: '4px 11px', borderRadius: 20, fontSize: 11,
            background: T.up, border: `1px solid ${T.bd}`, color: T.txt2,
            cursor: loading ? 'not-allowed' : 'pointer', fontFamily: T.font,
            transition: 'all .12s', opacity: loading ? .5 : 1,
          }}>{q.label}</button>
        ))}
      </div>

      {/* Messages */}
      <div ref={msgsRef} style={{ flex: 1, overflow: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{
            padding: '9px 12px', borderRadius: m.role === 'sys' ? 8 : m.role === 'user' ? '10px 10px 3px 10px' : '10px 10px 10px 3px',
            maxWidth: m.role === 'sys' ? '100%' : '90%',
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            background: m.role === 'sys' ? 'rgba(14,34,64,.5)'
              : m.role === 'user' ? 'rgba(59,130,246,.14)'
              : 'rgba(155,109,255,.1)',
            border: m.role === 'sys' ? `1px solid ${T.bd}`
              : m.role === 'user' ? '1px solid rgba(59,130,246,.25)'
              : '1px solid rgba(155,109,255,.22)',
            fontSize: m.role === 'sys' ? 10 : 12,
            color: m.role === 'sys' ? T.txt4 : T.txt,
            fontFamily: T.font, lineHeight: 1.65,
            textAlign: m.role === 'sys' ? 'center' : 'left',
            fontStyle: m.role === 'sys' ? 'italic' : 'normal',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}>{m.text}</div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: 5, padding: '8px 12px', alignSelf: 'flex-start' }}>
            {[0, 1, 2].map(i => (
              <span key={i} style={{
                width: 6, height: 6, borderRadius: '50%', background: T.purple,
                animation: `cnv2bounce 1.2s ease-in-out ${i * 0.15}s infinite`,
                display: 'inline-block',
              }} />
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: '10px 12px 14px', borderTop: `1px solid ${T.bd}`, display: 'flex', gap: 7, flexShrink: 0 }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
          placeholder="Ask anything…"
          rows={2}
          style={{
            flex: 1, background: T.up, border: `1px solid ${T.bd}`, borderRadius: 9,
            padding: '8px 11px', color: T.txt, fontFamily: T.font, fontSize: 12,
            outline: 'none', resize: 'none', lineHeight: 1.5, transition: 'border-color .15s',
          }}
          onFocus={e => { e.target.style.borderColor = T.purple; }}
          onBlur={e => { e.target.style.borderColor = T.bd; }}
          disabled={loading}
        />
        <button
          onClick={() => send(input)}
          disabled={loading || !input.trim()}
          style={{
            width: 36, height: 36, flexShrink: 0, alignSelf: 'flex-end',
            background: 'linear-gradient(135deg,#9b6dff,#6d3fff)',
            border: 'none', borderRadius: 9, color: '#fff', fontSize: 17,
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            opacity: loading || !input.trim() ? .4 : 1, transition: 'all .15s',
          }}
        >↑</button>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function ClinicalNoteV2() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [patient, setPatient] = useState({
    name: searchParams.get('name') || '',
    age:  searchParams.get('age')  || '',
    sex:  searchParams.get('sex')  || '',
    mrn:  searchParams.get('mrn')  || '',
  });

  const [noteType, setNoteType]   = useState('ED Progress Note');
  const [activeSec, setActiveSec] = useState(SECTIONS[0].id);
  const [values, setValues]       = useState(() => Object.fromEntries(SECTIONS.map(s => [s.id, ''])));
  const [generating, setGenerating] = useState('');
  const [aiOpen, setAiOpen]       = useState(false);
  const [preview, setPreview]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  const completeness = getCompleteness(values);
  const activeSection = SECTIONS.find(s => s.id === activeSec);

  const onChange = useCallback((id, val) => {
    setValues(prev => ({ ...prev, [id]: val }));
    setSaved(false);
  }, []);

  // ── AI draft for section ───────────────────────────────────────────────────
  const generateSection = useCallback(async (sectionId, label, current) => {
    setGenerating(sectionId);
    const ctx = SECTIONS.map(s => {
      const v = values[s.id]?.trim();
      return v && s.id !== sectionId ? `${s.label}: ${v.slice(0, 300)}` : null;
    }).filter(Boolean).join('\n');
    const patCtx = `Patient: ${patient.name || 'Unknown'}, ${patient.age || '?'}y ${patient.sex || ''}`;
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an emergency medicine documentation assistant. Generate ONLY the "${label}" section of a clinical note. Use standard EP documentation style. Be specific and concise. Do NOT include a header or section label — output only the content.\n\n${patCtx}\n${ctx ? 'Other sections filled so far:\n' + ctx : ''}\n${current ? 'Current draft:\n' + current : 'No content yet.'}`,
      });
      const text = typeof res === 'string' ? res : JSON.stringify(res);
      setValues(prev => ({ ...prev, [sectionId]: text }));
      setSaved(false);
    } catch { /* silent */ } finally {
      setGenerating('');
    }
  }, [values, patient]);

  // ── Auto-save to ClinicalNote entity ──────────────────────────────────────
  const saveNote = useCallback(async () => {
    setSaving(true);
    try {
      await base44.entities.ClinicalNote.create({
        raw_note: SECTIONS.map(s => values[s.id]?.trim() ? `${s.label.toUpperCase()}\n${values[s.id]}` : null).filter(Boolean).join('\n\n'),
        patient_name: patient.name,
        patient_age:  patient.age,
        patient_id:   patient.mrn,
        chief_complaint: values.cc,
        history_of_present_illness: values.hpi,
        review_of_systems: values.ros,
        physical_exam: values.pe,
        assessment: values.mdm,
        plan: values.plan,
        status: 'draft',
        note_type: 'progress_note',
      });
      setSaved(true);
      setLastSaved(new Date());
    } catch { /* silent */ } finally {
      setSaving(false);
    }
  }, [values, patient]);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e) {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const n = e.key;
      const sec = SECTIONS.find(s => s.key === (n === '0' ? '0' : n));
      if (sec) { e.preventDefault(); setActiveSec(sec.id); return; }
      if (n === 's') { e.preventDefault(); saveNote(); return; }
      if (n === 'p') { e.preventDefault(); setPreview(v => !v); return; }
      if (n === 'i') { e.preventDefault(); setAiOpen(v => !v); return; }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [saveNote]);

  return (
    <>
      <style>{CNV2_CSS}</style>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: T.bg, color: T.txt, fontFamily: T.font, position: 'relative' }}>

        {/* ── HEADER ─────────────────────────────────────────────────── */}
        <div style={{
          height: 52, flexShrink: 0,
          background: T.panel, borderBottom: `1px solid ${T.bd}`,
          display: 'flex', alignItems: 'center', padding: '0 18px', gap: 12, zIndex: 100,
        }}>
          <button onClick={() => navigate(-1)} style={{
            background: 'transparent', border: `1px solid ${T.bd}`, borderRadius: 7,
            padding: '4px 10px', color: T.txt3, cursor: 'pointer', fontSize: 12, fontFamily: T.font,
          }}>← Back</button>

          <div style={{ width: 1, height: 18, background: T.bd }} />

          {/* Patient chip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {patient.name ? (
              <>
                <span style={{ fontFamily: T.serif, fontSize: 14, fontWeight: 700, color: T.txt }}>{patient.name}</span>
                {(patient.age || patient.sex) && (
                  <span style={{ fontSize: 11, color: T.txt3 }}>{[patient.age && patient.age + 'y', patient.sex].filter(Boolean).join(' · ')}</span>
                )}
                {patient.mrn && (
                  <span style={{ fontFamily: T.mono, fontSize: 10, color: T.teal, background: 'rgba(0,229,192,.1)', border: '1px solid rgba(0,229,192,.22)', borderRadius: 12, padding: '1px 8px' }}>{patient.mrn}</span>
                )}
              </>
            ) : (
              <input
                value={patient.name}
                onChange={e => setPatient(p => ({ ...p, name: e.target.value }))}
                placeholder="Patient name…"
                style={{
                  background: 'rgba(255,255,255,.05)', border: `1px solid ${T.bd}`, borderRadius: 7,
                  padding: '4px 10px', color: T.txt, fontFamily: T.serif, fontSize: 13,
                  outline: 'none', width: 180,
                }}
              />
            )}
          </div>

          {/* Note type */}
          <select
            value={noteType}
            onChange={e => setNoteType(e.target.value)}
            style={{
              background: T.up, border: `1px solid ${T.bd}`, borderRadius: 7,
              padding: '4px 10px', color: T.txt2, fontFamily: T.font, fontSize: 12,
              outline: 'none', cursor: 'pointer',
            }}
          >
            {NOTE_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>

          <div style={{ flex: 1 }} />

          {/* Progress */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 80, height: 4, background: 'rgba(255,255,255,.08)', borderRadius: 3 }}>
              <div style={{ width: `${completeness}%`, height: '100%', background: completeness === 100 ? T.teal : T.blue, borderRadius: 3, transition: 'width .4s' }} />
            </div>
            <span style={{ fontFamily: T.mono, fontSize: 10, color: T.txt4 }}>{completeness}%</span>
          </div>

          {saved && lastSaved && (
            <span style={{ fontSize: 10, color: T.teal, fontFamily: T.mono }}>
              ✓ Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}

          <AIBadge loading={!!generating} />

          <button onClick={() => setPreview(true)} style={{
            background: 'rgba(59,130,246,.1)', border: '1px solid rgba(59,130,246,.28)',
            borderRadius: 7, padding: '5px 12px', fontSize: 12, fontWeight: 600,
            color: T.blue, cursor: 'pointer', fontFamily: T.font,
          }}>👁 Preview <span style={{ fontFamily: T.mono, fontSize: 9, color: T.txt4 }}>⌘P</span></button>

          <button onClick={() => setAiOpen(v => !v)} style={{
            background: aiOpen ? 'rgba(155,109,255,.2)' : 'rgba(155,109,255,.1)',
            border: `1px solid rgba(155,109,255,${aiOpen ? '.45' : '.28'})`,
            borderRadius: 7, padding: '5px 12px', fontSize: 12, fontWeight: 600,
            color: T.purple, cursor: 'pointer', fontFamily: T.font,
            transition: 'all .15s',
          }}>✦ AI <span style={{ fontFamily: T.mono, fontSize: 9, color: T.txt4 }}>⌘I</span></button>

          <button onClick={saveNote} disabled={saving} style={{
            background: T.teal, border: 'none', borderRadius: 7,
            padding: '6px 16px', fontSize: 12, fontWeight: 600,
            color: '#050f1e', cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: T.font, opacity: saving ? .6 : 1, transition: 'opacity .15s',
          }}>{saving ? '⟳ Saving…' : '💾 Save'} <span style={{ fontFamily: T.mono, fontSize: 9, opacity: .6 }}>⌘S</span></button>
        </div>

        {/* ── BODY ───────────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* ── SIDEBAR ────────────────────────────────────────────── */}
          <div style={{
            width: 220, flexShrink: 0,
            background: 'rgba(7,18,32,.7)',
            borderRight: `1px solid ${T.bd}`,
            display: 'flex', flexDirection: 'column',
            overflow: 'auto',
          }}>
            <div style={{ padding: '10px 8px', borderBottom: `1px solid ${T.bd}` }}>
              <div style={{ fontSize: 9, color: T.txt4, fontFamily: T.mono, letterSpacing: '1.5px', textTransform: 'uppercase', padding: '4px 8px', marginBottom: 4 }}>
                Note Sections
              </div>
              {SECTIONS.map(sec => {
                const isActive = sec.id === activeSec;
                const val = values[sec.id] || '';
                return (
                  <button
                    key={sec.id}
                    onClick={() => setActiveSec(sec.id)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                      padding: '9px 11px', border: 'none', borderLeft: `2px solid ${isActive ? T.teal : 'transparent'}`,
                      background: isActive ? 'rgba(0,229,192,.07)' : 'transparent',
                      cursor: 'pointer', transition: 'all .13s',
                      color: isActive ? T.teal : T.txt3,
                      fontFamily: T.font, fontSize: 12, fontWeight: isActive ? 600 : 400,
                      borderRadius: '0 7px 7px 0', marginBottom: 1,
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: 14, flexShrink: 0 }}>{sec.icon}</span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sec.label}</span>
                    <span style={{ fontFamily: T.mono, fontSize: 8, color: T.txt4, background: T.up, border: `1px solid ${T.bd}`, borderRadius: 3, padding: '1px 4px', flexShrink: 0 }}>⌘{sec.key}</span>
                    <SectionDot value={val} />
                  </button>
                );
              })}
            </div>

            {/* Patient fields in sidebar */}
            <div style={{ padding: '12px 12px 0' }}>
              <div style={{ fontSize: 9, color: T.txt4, fontFamily: T.mono, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>
                Patient Info
              </div>
              {[
                { key: 'name', label: 'Name',   placeholder: 'Full name' },
                { key: 'age',  label: 'Age',    placeholder: 'Years' },
                { key: 'sex',  label: 'Sex',    placeholder: 'M / F' },
                { key: 'mrn',  label: 'MRN',    placeholder: 'Record #' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 9, color: T.txt4, fontFamily: T.mono, marginBottom: 3, textTransform: 'uppercase' }}>{f.label}</div>
                  <input
                    value={patient[f.key]}
                    onChange={e => setPatient(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    style={{
                      width: '100%', padding: '5px 8px', boxSizing: 'border-box',
                      background: 'rgba(255,255,255,.04)', border: `1px solid ${T.bd}`,
                      borderRadius: 6, color: T.txt, fontFamily: T.font, fontSize: 12, outline: 'none',
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Completeness summary */}
            <div style={{ padding: '12px', marginTop: 'auto' }}>
              <div style={{ fontSize: 9, color: T.txt4, fontFamily: T.mono, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>
                Completeness
              </div>
              {SECTIONS.map(s => {
                const len = values[s.id]?.trim().length || 0;
                const status = len > 40 ? 'done' : len > 0 ? 'partial' : 'empty';
                return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 11 }}>{s.icon}</span>
                    <span style={{ flex: 1, fontSize: 10, color: T.txt4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.label}</span>
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                      background: status === 'done' ? T.teal : status === 'partial' ? T.orange : T.bd,
                      boxShadow: status === 'done' ? `0 0 5px ${T.teal}66` : 'none',
                    }} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── EDITOR ─────────────────────────────────────────────── */}
          <div style={{ flex: 1, overflow: 'auto', padding: '28px 32px' }}>
            {activeSection && (
              <SectionEditor
                section={activeSection}
                value={values[activeSec]}
                onChange={onChange}
                onGenerate={generateSection}
                generating={generating === activeSec}
                patientCtx={patient}
              />
            )}
          </div>

        </div>{/* /body */}

        {/* ── KEYBOARD LEGEND ────────────────────────────────────────── */}
        <div style={{
          height: 34, flexShrink: 0,
          background: T.panel, borderTop: `1px solid ${T.bd}`,
          display: 'flex', alignItems: 'center', padding: '0 18px', gap: 18,
          overflow: 'hidden',
        }}>
          {[
            ['⌘1–0', 'Jump section'], ['⌘S', 'Save'], ['⌘P', 'Preview'],
            ['⌘I', 'Toggle AI'], ['✦ AI Draft', 'Per-section draft'],
          ].map(([k, d]) => (
            <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
              <kbd style={{ fontFamily: T.mono, fontSize: 9, background: T.up, border: `1px solid ${T.bd}`, borderRadius: 3, padding: '1px 5px', color: T.txt2 }}>{k}</kbd>
              <span style={{ fontSize: 10, color: T.txt4 }}>{d}</span>
            </span>
          ))}
        </div>

        {/* ── AI PANEL ───────────────────────────────────────────────── */}
        <AIPanel
          open={aiOpen}
          onClose={() => setAiOpen(false)}
          patient={patient}
          sectionValues={values}
          onInsert={() => {}}
        />

        {/* ── PREVIEW MODAL ──────────────────────────────────────────── */}
        {preview && (
          <NotePreview
            sections={SECTIONS}
            sectionValues={values}
            patient={patient}
            noteType={noteType}
            onClose={() => setPreview(false)}
          />
        )}
      </div>
    </>
  );
}

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CNV2_CSS = `
@keyframes cnv2pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
@keyframes cnv2bounce { 0%,80%,100%{transform:translateY(0);opacity:.4} 40%{transform:translateY(-5px);opacity:1} }
* { box-sizing: border-box; }
select option { background: #071220; color: #f0f6ff; }
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-thumb { background: rgba(42,79,122,.5); border-radius: 2px; }
::-webkit-scrollbar-track { background: transparent; }
`;