import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const S = {
  bg: '#050f1e', panel: '#081628', card: '#0b1e36', up: '#0e2544',
  border: '#1a3555', borderHi: '#2a4f7a',
  blue: '#3b9eff', teal: '#00e5c0', gold: '#f5c842',
  purple: '#9b6dff', coral: '#ff6b6b', orange: '#ff9f43',
  txt: '#e8f0fe', txt2: '#8aaccc', txt3: '#4a6a8a', txt4: '#2e4a6a',
};

const ROS_SYSTEMS = [
  { id: 'constitutional', name: 'Constitutional', icon: '🌡️', key: '1', symptoms: ['Fever','Chills','Fatigue','Malaise','Night sweats','Weight loss','Weight gain','Weakness','Diaphoresis'] },
  { id: 'eyes', name: 'Eyes', icon: '👁️', key: '2', symptoms: ['Vision changes','Blurred vision','Double vision','Eye pain','Redness','Discharge','Photophobia','Floaters'] },
  { id: 'ent', name: 'ENT', icon: '👂', key: '3', symptoms: ['Hearing loss','Tinnitus','Ear pain','Sore throat','Nasal congestion','Epistaxis','Hoarseness','Dysphagia'] },
  { id: 'cardiovascular', name: 'Cardiovascular', icon: '❤️', key: '4', symptoms: ['Chest pain','Palpitations','Orthopnea','PND','Edema','Syncope','Claudication','DOE'] },
  { id: 'respiratory', name: 'Respiratory', icon: '🫁', key: '5', symptoms: ['Dyspnea','Cough','Hemoptysis','Wheezing','Pleuritic pain','Sputum production','Stridor','SOB'] },
  { id: 'gi', name: 'Gastrointestinal', icon: '🔄', key: '6', symptoms: ['Nausea','Vomiting','Diarrhea','Constipation','Abdominal pain','Hematemesis','Melena','Hematochezia','Dyspepsia'] },
  { id: 'gu', name: 'Genitourinary', icon: '🔬', key: '7', symptoms: ['Dysuria','Frequency','Urgency','Hematuria','Flank pain','Incontinence','Discharge','Testicular pain'] },
  { id: 'msk', name: 'Musculoskeletal', icon: '🦴', key: '8', symptoms: ['Joint pain','Joint swelling','Stiffness','Back pain','Muscle weakness','Muscle pain','Limited ROM','Deformity'] },
  { id: 'skin', name: 'Skin', icon: '🩹', key: '9', symptoms: ['Rash','Itching','Lesions','Wounds','Bruising','Skin color changes','Hair loss','Nail changes'] },
  { id: 'neuro', name: 'Neurological', icon: '🧠', key: '0', symptoms: ['Headache','Dizziness','Numbness','Tingling','Seizures','Tremor','Gait disturbance','Memory loss','Focal weakness','Syncope'] },
  { id: 'psych', name: 'Psychiatric', icon: '💭', key: '-', symptoms: ['Depression','Anxiety','SI/HI','Hallucinations','Sleep disturbance','Agitation','Confusion','Substance use'] },
  { id: 'endo', name: 'Endocrine', icon: '⚗️', key: '=', symptoms: ['Polydipsia','Polyuria','Heat intolerance','Cold intolerance','Excessive sweating','Hair changes'] },
  { id: 'heme', name: 'Heme/Lymph', icon: '🩸', key: 'Q', symptoms: ['Easy bruising','Prolonged bleeding','Lymphadenopathy','Petechiae','Blood clots','Anemia symptoms'] },
  { id: 'allergic', name: 'Allergy/Immune', icon: '🛡️', key: 'W', symptoms: ['Seasonal allergies','Drug allergies','Hives/urticaria','Anaphylaxis hx','Recurrent infections','Immunodeficiency'] },
];

const HPI_TEXT = `42-year-old male presents with acute onset substernal chest pain that started 2 hours ago while watching television. Patient describes the pain as pressure-like, radiating to the left arm, rated 7/10. He reports associated shortness of breath and nausea without vomiting. He also notes diaphoresis since symptom onset. He denies dizziness, syncope, or headache. Denies palpitations or prior episodes. No cough, hemoptysis, or wheezing. No musculoskeletal pain or recent trauma.`;

const HPI_KEYWORDS = {
  cardiovascular: ['chest pain','substernal','radiating','palpitations','arm','pressure-like'],
  respiratory: ['shortness of breath','sob','cough','hemoptysis','wheezing','dyspnea'],
  constitutional: ['diaphoresis','fever','chills','fatigue','sweating'],
  gi: ['nausea','vomiting','abdominal pain','diarrhea'],
  neuro: ['dizziness','syncope','headache','numbness','tingling'],
  msk: ['musculoskeletal','trauma','back pain','joint pain'],
};

const HPI_COLORS = { cardiovascular: S.coral, respiratory: S.blue, constitutional: S.gold, gi: S.teal, neuro: S.purple, msk: S.orange };

const HPI_DETECTED = new Set(
  Object.entries(HPI_KEYWORDS)
    .filter(([, kws]) => kws.some(kw => HPI_TEXT.toLowerCase().includes(kw)))
    .map(([id]) => id)
);

function initState() {
  const s = {};
  ROS_SYSTEMS.forEach(sys => {
    s[sys.id] = {};
    sys.symptoms.forEach(sym => { s[sys.id][sym] = { status: 'unreviewed', detail: '', aiSet: false }; });
  });
  return s;
}

const AI_RESULT = {
  constitutional: { pos: ['Diaphoresis'], neg: ['Fever','Chills','Fatigue','Malaise','Night sweats','Weight loss','Weight gain','Weakness'] },
  cardiovascular: { pos: ['Chest pain','DOE'], neg: ['Palpitations','Orthopnea','PND','Edema','Syncope','Claudication'], details: { 'Chest pain': 'substernal, pressure-like, radiating to L arm, 7/10, 2hr onset' } },
  respiratory: { pos: ['SOB'], neg: ['Cough','Hemoptysis','Wheezing','Pleuritic pain','Sputum production','Stridor','Dyspnea'] },
  gi: { pos: ['Nausea'], neg: ['Vomiting','Diarrhea','Constipation','Abdominal pain','Hematemesis','Melena','Hematochezia','Dyspepsia'] },
  neuro: { pos: [], neg: ['Dizziness','Headache','Syncope','Numbness','Tingling','Focal weakness'] },
  msk: { pos: [], neg: ['Joint pain','Back pain','Muscle pain'] },
};

const CSS = `
@keyframes chip-pop { from{transform:scale(0.8);opacity:0} to{transform:scale(1);opacity:1} }
@keyframes ai-scan-glow { 0%{box-shadow:inset 0 0 0 1px rgba(155,109,255,0.5),0 0 15px rgba(155,109,255,0.2)} 100%{box-shadow:inset 0 0 0 1px transparent,0 0 0 transparent} }
@keyframes scanline { 0%{left:-100%} 100%{left:100%} }
@keyframes shimmer { 0%{left:-100%} 100%{left:100%} }
@keyframes strip-in { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
@keyframes bounce-dot { 0%,80%,100%{transform:translateY(0);opacity:0.4} 40%{transform:translateY(-6px);opacity:1} }
.ros-chip-animate { animation: chip-pop 0.2s cubic-bezier(0.34,1.56,0.64,1); }
.ros-ai-glow { animation: ai-scan-glow 1.5s ease forwards; }
.ros-scanning::after {
  content:''; position:absolute; top:0; left:-100%; width:100%; height:100%;
  background:linear-gradient(90deg,transparent,rgba(155,109,255,0.08),rgba(155,109,255,0.15),rgba(155,109,255,0.08),transparent);
  animation:scanline 0.6s ease-in-out forwards; z-index:2; pointer-events:none; border-radius:10px;
}
.sweep-shimmer-animate { animation: shimmer 1s ease-in-out infinite; }
.bd1{animation:bounce-dot 1.2s ease-in-out infinite}
.bd2{animation:bounce-dot 1.2s 0.2s ease-in-out infinite}
.bd3{animation:bounce-dot 1.2s 0.4s ease-in-out infinite}
`;

export default function ROSTab() {
  const [state, setState] = useState(initState);
  const [pins, setPins] = useState(new Set(['constitutional','cardiovascular','respiratory','neuro']));
  const [aiTouched, setAiTouched] = useState(new Set());
  const [expanded, setExpanded] = useState(null);
  const [sweep, setSweep] = useState('idle'); // idle | sweeping | done
  const [sweepMsg, setSweepMsg] = useState('');
  const [scanning, setScanning] = useState(new Set());
  const [noteMode, setNoteMode] = useState('smart');
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [hpiOpen, setHpiOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const [msgs, setMsgs] = useState([{ role: 'sys', text: 'ROS assistant ready. I can auto-fill from the HPI, suggest pertinent negatives, or help with differentials.' }]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const aiRef = useRef(null);

  useEffect(() => { if (aiRef.current) aiRef.current.scrollTop = aiRef.current.scrollHeight; }, [msgs, aiLoading]);

  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const map = {};
      ROS_SYSTEMS.forEach(s => { map[s.key.toLowerCase()] = s.id; });
      if (map[e.key.toLowerCase()] && !e.shiftKey) { e.preventDefault(); setExpanded(p => p === map[e.key.toLowerCase()] ? null : map[e.key.toLowerCase()]); }
      if ((e.key === 'n' || e.key === 'N') && expanded && !e.shiftKey) { e.preventDefault(); doToggleNeg(expanded); }
      if ((e.key === 'a' || e.key === 'A') && e.shiftKey) { e.preventDefault(); doAllNeg(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [expanded]);

  const cycleSymptom = (sysId, sym) => {
    setState(p => ({ ...p, [sysId]: { ...p[sysId], [sym]: { status: p[sysId][sym].status === 'pos' ? 'neg' : 'pos', detail: '', aiSet: false } } }));
  };

  const setDetail = (sysId, sym, val) => {
    setState(p => ({ ...p, [sysId]: { ...p[sysId], [sym]: { ...p[sysId][sym], detail: val } } }));
  };

  const doToggleNeg = (sysId) => {
    setState(p => {
      const allNeg = Object.values(p[sysId]).every(s => s.status === 'neg');
      const updated = {};
      Object.keys(p[sysId]).forEach(sym => {
        updated[sym] = allNeg ? { status: 'unreviewed', detail: '', aiSet: false } : p[sysId][sym].status !== 'pos' ? { ...p[sysId][sym], status: 'neg' } : p[sysId][sym];
      });
      return { ...p, [sysId]: updated };
    });
  };

  const doAllNeg = () => {
    setState(p => {
      const next = { ...p };
      ROS_SYSTEMS.forEach(sys => {
        const u = {};
        Object.keys(p[sys.id]).forEach(sym => { u[sym] = p[sys.id][sym].status !== 'pos' ? { ...p[sys.id][sym], status: 'neg' } : p[sys.id][sym]; });
        next[sys.id] = u;
      });
      return next;
    });
  };

  const doReset = () => { setState(initState()); setAiTouched(new Set()); setSweep('idle'); setSweepMsg(''); };

  const doSweep = async () => {
    if (sweep === 'sweeping') return;
    setSweep('sweeping'); setSweepMsg('Parsing clinical narrative…');
    for (const [sysId, result] of Object.entries(AI_RESULT)) {
      setSweepMsg(`Scanning ${ROS_SYSTEMS.find(s => s.id === sysId).name}…`);
      setScanning(p => new Set([...p, sysId]));
      await new Promise(r => setTimeout(r, 380));
      setState(p => {
        const u = { ...p[sysId] };
        result.pos.forEach(sym => { if (u[sym]) u[sym] = { status: 'pos', detail: result.details?.[sym] || '', aiSet: true }; });
        result.neg.forEach(sym => { if (u[sym]) u[sym] = { status: 'neg', detail: '', aiSet: true }; });
        return { ...p, [sysId]: u };
      });
      setAiTouched(p => new Set([...p, sysId]));
      await new Promise(r => setTimeout(r, 200));
      setScanning(p => { const n = new Set(p); n.delete(sysId); return n; });
    }
    // Fill pinned non-HPI systems with negatives
    setState(p => {
      const next = { ...p };
      pins.forEach(sysId => {
        if (!AI_RESULT[sysId]) {
          const u = {};
          Object.keys(p[sysId]).forEach(sym => { u[sym] = p[sysId][sym].status === 'unreviewed' ? { status: 'neg', detail: '', aiSet: false } : p[sysId][sym]; });
          next[sysId] = u;
        }
      });
      return next;
    });
    const totalPos = Object.values(AI_RESULT).reduce((a, r) => a + r.pos.length, 0);
    setSweep('done');
    setSweepMsg(`${Object.keys(AI_RESULT).length} systems filled · ${totalPos} positives found`);
    setMsgs(p => [...p, { role: 'sys', text: `✦ AI Auto-Fill complete — ${Object.keys(AI_RESULT).length} systems populated, ${totalPos} positive findings.` }]);
    setTimeout(() => setSweep('idle'), 3000);
  };

  const sendAI = async (q) => {
    const question = q || aiInput.trim();
    if (!question || aiLoading) return;
    setAiInput('');
    setMsgs(p => [...p, { role: 'user', text: question }]);
    setAiLoading(true);
    try {
      let ctx = `Patient CC: Chest Pain. HPI: ${HPI_TEXT}\nROS:\n`;
      ROS_SYSTEMS.forEach(sys => {
        const vals = Object.values(state[sys.id]);
        if (!vals.some(s => s.status !== 'unreviewed')) return;
        const pos = [], neg = [];
        Object.keys(state[sys.id]).forEach(sym => {
          if (state[sys.id][sym].status === 'pos') pos.push(sym);
          else if (state[sys.id][sym].status === 'neg') neg.push(sym);
        });
        ctx += `${sys.name}: ${pos.length ? 'Positive for ' + pos.join(', ') + '. ' : ''}${neg.length ? 'Denies ' + neg.join(', ') + '.' : ''}\n`;
      });
      const res = await base44.integrations.Core.InvokeLLM({ prompt: `You are Notrya AI, a clinical EM assistant. Context:\n${ctx}\n\nQuestion: ${question}` });
      setMsgs(p => [...p, { role: 'bot', text: typeof res === 'string' ? res : JSON.stringify(res) }]);
    } catch { setMsgs(p => [...p, { role: 'sys', text: '⚠ Connection error.' }]); }
    setAiLoading(false);
  };

  // Computed stats
  let reviewed = 0, totalPos = 0;
  const allPositives = [];
  ROS_SYSTEMS.forEach(sys => {
    const vals = Object.values(state[sys.id]);
    if (vals.some(s => s.status !== 'unreviewed')) reviewed++;
    Object.keys(state[sys.id]).forEach(sym => {
      if (state[sys.id][sym].status === 'pos') { totalPos++; allPositives.push({ sysId: sys.id, sysName: sys.name, sym, detail: state[sys.id][sym].detail }); }
    });
  });
  const total = ROS_SYSTEMS.length;
  const circumference = 94.25;

  // Note generation
  const generateNote = () => {
    if (!ROS_SYSTEMS.some(sys => Object.values(state[sys.id]).some(s => s.status !== 'unreviewed'))) return null;
    const neg = [], pos = []; let omitted = 0;
    ROS_SYSTEMS.forEach(sys => {
      const vals = Object.values(state[sys.id]);
      if (!vals.some(s => s.status !== 'unreviewed')) return;
      if (noteMode === 'smart') {
        const hasPos = vals.some(s => s.status === 'pos');
        if (!hasPos && !HPI_DETECTED.has(sys.id) && !aiTouched.has(sys.id) && !pins.has(sys.id)) { omitted++; return; }
      }
      const posItems = [], negItems = [];
      Object.keys(state[sys.id]).forEach(sym => {
        const st = state[sys.id][sym];
        if (st.status === 'pos') posItems.push(sym.toLowerCase() + (st.detail ? ` (${st.detail})` : ''));
        else if (st.status === 'neg') negItems.push(sym.toLowerCase());
      });
      if (posItems.length) pos.push({ name: sys.name, id: sys.id, posItems, negItems });
      else neg.push(sys.name);
    });
    return { neg, pos, omitted };
  };
  const note = generateNote();

  const getSysStatus = (sysId) => {
    const vals = Object.values(state[sysId]);
    const posCount = vals.filter(s => s.status === 'pos').length;
    if (posCount) return { type: 'pos', label: `${posCount} POSITIVE` };
    if (vals.some(s => s.status !== 'unreviewed')) return { type: 'neg', label: 'NEGATIVE' };
    return { type: 'none', label: 'NOT REVIEWED' };
  };

  const isAllNeg = (sysId) => Object.values(state[sysId]).every(s => s.status === 'neg') && Object.values(state[sysId]).some(s => s.status === 'neg');

  const copyNote = () => {
    if (!note) return;
    let t = note.neg.length === total ? `A complete ${total}-point review of systems is negative.` : note.neg.length ? `Negative: ${note.neg.join(', ')}.` : '';
    note.pos.forEach(p => { t += `\n${p.name}: Positive for ${p.posItems.join(', ')}.`; if (p.negItems.length) t += ` Denies ${p.negItems.join(', ')}.`; });
    navigator.clipboard.writeText(t).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  };

  const hpiParts = [
    { text: 'acute onset substernal chest pain', hl: S.coral },
    { text: 'pressure-like, radiating to the left arm', hl: S.coral },
    { text: 'shortness of breath', hl: S.blue },
    { text: 'nausea without vomiting', hl: S.teal },
    { text: 'diaphoresis', hl: S.gold },
    { text: 'dizziness, syncope,', hl: S.purple },
    { text: 'Denies palpitations or prior episodes', hl: S.coral },
    { text: 'cough, hemoptysis, or wheezing', hl: S.blue },
    { text: 'musculoskeletal pain or recent trauma', hl: S.orange },
  ];

  const renderHpiText = () => {
    let remaining = HPI_TEXT;
    const parts = [];
    let idx = 0;
    while (remaining.length > 0) {
      let matched = false;
      for (const { text, hl } of hpiParts) {
        const i = remaining.indexOf(text);
        if (i === 0) {
          parts.push(<span key={idx++} style={{ borderRadius: 3, padding: '1px 3px', fontWeight: 500, background: `${hl}22`, color: hl, borderBottom: `1px dashed ${hl}66` }}>{text}</span>);
          remaining = remaining.slice(text.length);
          matched = true; break;
        }
      }
      if (!matched) {
        let nextIdx = remaining.length;
        for (const { text } of hpiParts) {
          const i = remaining.indexOf(text);
          if (i > 0 && i < nextIdx) nextIdx = i;
        }
        parts.push(<span key={idx++}>{remaining.slice(0, nextIdx)}</span>);
        remaining = remaining.slice(nextIdx);
      }
    }
    return parts;
  };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>
      <style>{CSS}</style>

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px 30px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Page Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>🔍</span>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 600, color: S.txt }}>Review of Systems</div>
            <div style={{ fontSize: 12, color: S.txt3, marginTop: 1 }}>AI-powered auto-fill from HPI · Provider presets · Exception-based rapid entry</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            {[['1–0','jump'],['N','negate'],['⇧A','all neg']].map(([k, l]) => (
              <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: S.txt4 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", background: S.up, border: `1px solid ${S.border}`, borderRadius: 3, padding: '1px 5px', color: S.txt3, fontSize: 9 }}>{k}</span>
                <span>{l}</span>
              </span>
            ))}
          </div>
        </div>

        {/* ═══ HPI INTELLIGENCE PANEL ═══ */}
        <div style={{ background: S.panel, border: `1px solid ${S.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <div onClick={() => setHpiOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', cursor: 'pointer', userSelect: 'none' }}>
            <span style={{ fontSize: 11, color: S.txt4, display: 'inline-block', transform: hpiOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.25s' }}>▾</span>
            <span style={{ fontSize: 16 }}>🧠</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: S.txt }}>HPI Intelligence</div>
              <div style={{ fontSize: 10, color: S.txt3 }}>AI reads the HPI and auto-populates your ROS</div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 5 }}>
              <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", padding: '2px 9px', borderRadius: 20, fontWeight: 600, background: 'rgba(155,109,255,0.12)', color: S.purple, border: `1px solid rgba(155,109,255,0.3)` }}>{HPI_DETECTED.size} systems detected</span>
              <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", padding: '2px 9px', borderRadius: 20, fontWeight: 600, background: 'rgba(245,200,66,0.12)', color: S.gold, border: `1px solid rgba(245,200,66,0.3)` }}>4 positives identified</span>
            </div>
          </div>
          {hpiOpen && (
            <div style={{ padding: '14px 16px 16px', borderTop: `1px solid ${S.border}` }}>
              <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 8, padding: '12px 14px', fontSize: 12.5, lineHeight: 1.8, color: S.txt2, marginBottom: 12 }}>
                {renderHpiText()}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 10, color: S.txt4, marginRight: 4 }}>Systems detected:</span>
                {[...HPI_DETECTED].map(sysId => {
                  const sys = ROS_SYSTEMS.find(s => s.id === sysId);
                  const color = HPI_COLORS[sysId] || S.txt2;
                  return <span key={sysId} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: `${color}15`, color, border: `1px solid ${color}40` }}>{sys.icon} {sys.name}</span>;
                })}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button onClick={doSweep} disabled={sweep === 'sweeping'} style={{ position: 'relative', overflow: 'hidden', padding: '9px 22px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: sweep === 'sweeping' ? 'wait' : 'pointer', border: `2px solid ${sweep === 'done' ? 'rgba(0,229,192,0.4)' : 'rgba(155,109,255,0.4)'}`, background: sweep === 'done' ? 'rgba(0,229,192,0.15)' : 'rgba(155,109,255,0.1)', color: sweep === 'done' ? S.teal : S.purple, fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.02em' }}>
                  <span className={sweep === 'sweeping' ? 'sweep-shimmer-animate' : ''} style={{ position: 'absolute', top: 0, left: '-100%', width: '100%', height: '100%', background: 'linear-gradient(90deg,transparent,rgba(155,109,255,0.3),transparent)' }} />
                  {sweep === 'done' ? '✓ HPI Auto-Fill Complete' : sweep === 'sweeping' ? '✦ Analyzing HPI…' : '✦ AI Auto-Fill from HPI'}
                </button>
                {sweepMsg && <span style={{ fontSize: 11, color: S.txt3, fontStyle: 'italic' }}>{sweepMsg}</span>}
              </div>
            </div>
          )}
        </div>

        {/* ═══ MASTER CONTROLS ═══ */}
        <div style={{ background: S.panel, border: `1px solid ${S.border}`, borderRadius: 12, padding: '12px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={doAllNeg} style={{ padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: `2px solid rgba(0,229,192,0.4)`, background: 'rgba(0,229,192,0.12)', color: S.teal, fontFamily: "'DM Sans', sans-serif" }}>✓ All Systems Negative</button>
            <button onClick={doReset} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: `2px solid ${S.border}`, background: S.up, color: S.txt3, fontFamily: "'DM Sans', sans-serif" }}>↺ Reset</button>
            <button onClick={() => setPrefsOpen(o => !o)} style={{ padding: '6px 14px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: `1px solid ${prefsOpen ? 'rgba(245,200,66,0.5)' : S.border}`, background: prefsOpen ? 'rgba(245,200,66,0.08)' : S.up, color: prefsOpen ? S.gold : S.txt3, fontFamily: "'DM Sans', sans-serif" }}>⭐ My Presets</button>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ position: 'relative', width: 36, height: 36 }}>
                <svg width="36" height="36" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="18" cy="18" r="15" fill="none" stroke={S.border} strokeWidth="3" />
                  <circle cx="18" cy="18" r="15" fill="none" stroke={S.teal} strokeWidth="3" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - reviewed / total)} style={{ transition: 'stroke-dashoffset 0.4s ease' }} />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600, color: S.teal }}>{reviewed}/{total}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <div style={{ fontSize: 11, color: S.txt3 }}><strong style={{ color: S.txt }}>{reviewed}</strong> reviewed</div>
                <div style={{ fontSize: 11, color: S.txt3 }}><strong style={{ color: S.coral }}>{totalPos}</strong> positive findings</div>
              </div>
            </div>
          </div>
        </div>

        {/* Provider Presets Drawer */}
        {prefsOpen && (
          <div style={{ background: 'rgba(245,200,66,0.03)', border: `1px solid rgba(245,200,66,0.2)`, borderRadius: 12, padding: '12px 16px', marginTop: -4 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: S.gold, marginBottom: 8 }}>⭐ Always Include These Systems <span style={{ fontWeight: 400, color: S.txt4 }}>(click to toggle)</span></div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {ROS_SYSTEMS.map(sys => (
                <span key={sys.id} onClick={() => setPins(p => { const n = new Set(p); n.has(sys.id) ? n.delete(sys.id) : n.add(sys.id); return n; })} style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, cursor: 'pointer', border: `1px solid ${pins.has(sys.id) ? 'rgba(245,200,66,0.4)' : S.border}`, background: pins.has(sys.id) ? 'rgba(245,200,66,0.12)' : S.up, color: pins.has(sys.id) ? S.gold : S.txt3, fontWeight: pins.has(sys.id) ? 600 : 400, userSelect: 'none' }}>
                  {sys.icon} {sys.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Abnormal Findings Strip */}
        {allPositives.length > 0 && (
          <div style={{ background: 'rgba(255,107,107,0.06)', border: `1px solid rgba(255,107,107,0.2)`, borderRadius: 12, padding: '10px 14px', animation: 'strip-in 0.3s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span>⚠️</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: S.coral, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Abnormal Findings</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {allPositives.map((p, i) => (
                <span key={i} onClick={() => cycleSymptom(p.sysId, p.sym)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: 'rgba(255,107,107,0.15)', border: `1px solid rgba(255,107,107,0.35)`, color: S.coral, cursor: 'pointer', animation: 'chip-pop 0.25s cubic-bezier(0.34,1.56,0.64,1)' }}>
                  <span style={{ fontSize: 9, color: 'rgba(255,107,107,0.6)' }}>{p.sysName}:</span>{p.sym}{p.detail ? ` — ${p.detail}` : ''}<span style={{ fontSize: 13, opacity: 0.5, marginLeft: 2 }}>×</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ═══ SYSTEM ROWS ═══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {ROS_SYSTEMS.map(sys => {
            const isExpanded = expanded === sys.id;
            const isScanning = scanning.has(sys.id);
            const isTouched = aiTouched.has(sys.id);
            const isPinned = pins.has(sys.id);
            const status = getSysStatus(sys.id);
            const allNeg = isAllNeg(sys.id);
            const positives = Object.keys(state[sys.id]).filter(sym => state[sys.id][sym].status === 'pos');

            return (
              <div key={sys.id} className={isScanning ? 'ros-scanning' : isTouched ? 'ros-ai-glow' : ''} style={{ background: S.panel, border: `1px solid ${status.type === 'pos' ? 'rgba(255,107,107,0.35)' : status.type === 'neg' ? 'rgba(0,229,192,0.2)' : S.border}`, borderRadius: 10, overflow: 'hidden', position: 'relative', transition: 'border-color 0.2s' }}>
                {/* Row */}
                <div onClick={() => setExpanded(p => p === sys.id ? null : sys.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', cursor: 'pointer', userSelect: 'none', position: 'relative', zIndex: 3 }}>
                  <span onClick={e => { e.stopPropagation(); setPins(p => { const n = new Set(p); n.has(sys.id) ? n.delete(sys.id) : n.add(sys.id); return n; }); }} title="Pin system" style={{ fontSize: 14, cursor: 'pointer', flexShrink: 0, opacity: isPinned ? 1 : 0.25, filter: isPinned ? 'none' : 'grayscale(1)', transition: 'all 0.2s' }}>⭐</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, width: 18, height: 18, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', background: S.up, color: S.txt4, border: `1px solid ${S.border}`, flexShrink: 0, fontWeight: 600 }}>{sys.key}</span>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{sys.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: S.txt, flexShrink: 0, minWidth: 120 }}>{sys.name}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, padding: '1px 8px', borderRadius: 20, flexShrink: 0, fontWeight: 600, transition: 'all 0.2s', background: status.type === 'pos' ? 'rgba(255,107,107,0.15)' : status.type === 'neg' ? 'rgba(0,229,192,0.1)' : S.up, color: status.type === 'pos' ? S.coral : status.type === 'neg' ? S.teal : S.txt4, border: `1px solid ${status.type === 'pos' ? 'rgba(255,107,107,0.3)' : status.type === 'neg' ? 'rgba(0,229,192,0.3)' : S.border}` }}>{status.label}</span>
                  {isTouched && <span style={{ fontSize: 9, padding: '0 5px', borderRadius: 10, background: 'rgba(155,109,255,0.15)', color: S.purple, border: `1px solid rgba(155,109,255,0.3)`, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, flexShrink: 0 }}>AI</span>}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, flex: 1, minWidth: 0, margin: '0 4px' }}>
                    {positives.map(sym => <span key={sym} style={{ fontSize: 10, padding: '1px 7px', borderRadius: 12, background: 'rgba(255,107,107,0.1)', color: S.coral, border: `1px solid rgba(255,107,107,0.25)`, whiteSpace: 'nowrap', animation: 'chip-pop 0.2s ease' }}>{sym}</span>)}
                  </div>
                  <button onClick={e => { e.stopPropagation(); doToggleNeg(sys.id); }} style={{ padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: 'pointer', border: `1px solid ${allNeg ? S.teal : 'rgba(0,229,192,0.3)'}`, background: allNeg ? S.teal : 'rgba(0,229,192,0.08)', color: allNeg ? S.bg : S.teal, marginLeft: 'auto', flexShrink: 0, fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap', position: 'relative', zIndex: 5 }}>✓ Negative</button>
                  <span style={{ fontSize: 12, color: S.txt4, transition: 'transform 0.2s', flexShrink: 0, display: 'inline-block', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', marginLeft: 4 }}>▾</span>
                </div>

                {/* Expanded Symptom Grid */}
                {isExpanded && (
                  <div style={{ padding: '10px 14px 12px', background: 'rgba(0,0,0,0.15)', borderTop: `1px solid ${S.border}` }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {sys.symptoms.map(sym => {
                        const st = state[sys.id][sym];
                        return (
                          <div key={sym} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <span
                              onClick={() => cycleSymptom(sys.id, sym)}
                              className={st.status === 'pos' ? 'ros-chip-animate' : ''}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer', userSelect: 'none', transition: 'all 0.15s', border: `1px solid ${st.status === 'pos' ? (st.aiSet ? 'rgba(155,109,255,0.5)' : 'rgba(255,107,107,0.5)') : st.status === 'neg' ? 'rgba(0,229,192,0.2)' : S.border}`, background: st.status === 'pos' ? (st.aiSet ? 'rgba(155,109,255,0.12)' : 'rgba(255,107,107,0.12)') : st.status === 'neg' ? 'rgba(0,229,192,0.04)' : S.up, color: st.status === 'pos' ? (st.aiSet ? S.purple : S.coral) : st.status === 'neg' ? S.txt3 : S.txt3, fontWeight: st.status === 'pos' ? 600 : 400 }}>
                              <span style={{ fontSize: 10 }}>{st.status === 'pos' ? '⊕' : st.status === 'neg' ? '−' : '○'}</span> {sym}
                            </span>
                            {st.status === 'pos' && (
                              <input type="text" placeholder="Details…" value={st.detail} onClick={e => e.stopPropagation()} onChange={e => setDetail(sys.id, sym, e.target.value)} style={{ background: S.up, border: `1px solid rgba(255,107,107,0.3)`, borderRadius: 6, padding: '4px 8px', color: S.txt, fontSize: 11, outline: 'none', width: 130, fontFamily: "'DM Sans', sans-serif", marginTop: 4 }} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ═══ GENERATED NOTE ═══ */}
        <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: `1px solid ${S.border}` }}>
            <span>📝</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: S.txt2 }}>Generated ROS Note</span>
            <div style={{ display: 'flex', border: `1px solid ${S.border}`, borderRadius: 6, overflow: 'hidden', marginLeft: 6 }}>
              {['smart','full'].map(m => (
                <button key={m} onClick={() => setNoteMode(m)} style={{ padding: '3px 10px', fontSize: 10, fontWeight: 600, cursor: 'pointer', background: noteMode === m ? 'rgba(59,158,255,0.15)' : S.up, color: noteMode === m ? S.blue : S.txt4, border: 'none', fontFamily: "'DM Sans', sans-serif" }}>{m.charAt(0).toUpperCase() + m.slice(1)}</button>
              ))}
            </div>
            <span style={{ fontSize: 10, color: S.txt4, marginLeft: 4 }}>Smart = HPI-relevant + pinned + positives</span>
            <button onClick={copyNote} style={{ marginLeft: 'auto', padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: 'pointer', background: copied ? 'rgba(0,229,192,0.08)' : S.up, border: `1px solid ${copied ? S.teal : S.border}`, color: copied ? S.teal : S.txt3, fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s' }}>{copied ? '✓ Copied' : '📋 Copy'}</button>
          </div>
          <div style={{ padding: '12px 14px', fontSize: 12, lineHeight: 1.7, color: S.txt2, minHeight: 60, whiteSpace: 'pre-wrap' }}>
            {!note ? (
              <span style={{ color: S.txt4, fontStyle: 'italic' }}>Complete the review of systems above to generate note text.</span>
            ) : (
              <>
                {note.neg.length > 0 && <span style={{ color: S.txt3 }}>{note.neg.length === total ? `A complete ${total}-point review of systems is negative.` : `Negative: ${note.neg.join(', ')}.`}</span>}
                {note.pos.map(ps => (
                  <div key={ps.id}>
                    {'\n'}<strong style={{ color: S.txt }}>{ps.name}:</strong>{' '}
                    <span style={{ color: S.coral, fontWeight: 500 }}>Positive for {ps.posItems.join(', ')}.</span>
                    {ps.negItems.length > 0 && <span style={{ color: S.txt3 }}> Denies {ps.negItems.join(', ')}.</span>}
                  </div>
                ))}
                {noteMode === 'smart' && note.omitted > 0 && <div style={{ color: S.txt4, fontSize: 11, fontStyle: 'italic', marginTop: 8 }}>{note.omitted} system(s) omitted (not mentioned in HPI and not pinned)</div>}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── AI PANEL ── */}
      <aside style={{ width: 280, flexShrink: 0, background: S.panel, borderLeft: `1px solid ${S.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '10px 12px', borderBottom: `1px solid ${S.border}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: S.teal }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: S.txt2 }}>Notrya AI</span>
            <span style={{ marginLeft: 'auto', fontFamily: "'JetBrains Mono', monospace", fontSize: 9, background: S.up, border: `1px solid ${S.border}`, borderRadius: 20, padding: '1px 6px', color: S.txt3 }}>claude-sonnet-4</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {[['🚩 Red Flags','Based on the HPI, what ROS findings should I be particularly attentive to? Are there red-flag symptoms I should ask about?'],['➖ Pertinent Neg','Review my current ROS. What pertinent negatives am I missing for this presentation?'],['📝 Billing Note','Generate a polished ROS note from my current entries, optimized for billing.'],['🔬 Differentials','What differential diagnoses does this ROS support or argue against?']].map(([label, q]) => (
              <button key={label} onClick={() => sendAI(q)} style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, cursor: 'pointer', background: S.up, border: `1px solid ${S.border}`, color: S.txt2, fontFamily: "'DM Sans', sans-serif" }}>{label}</button>
            ))}
          </div>
        </div>
        <div ref={aiRef} style={{ flex: 1, overflowY: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {msgs.map((m, i) => (
            <div key={i} style={{ padding: '8px 10px', borderRadius: 8, fontSize: 11, lineHeight: 1.5, background: m.role === 'sys' ? S.up : m.role === 'user' ? 'rgba(59,158,255,0.12)' : 'rgba(0,229,192,0.07)', border: `1px solid ${m.role === 'sys' ? S.border : m.role === 'user' ? 'rgba(59,158,255,0.25)' : 'rgba(0,229,192,0.18)'}`, color: m.role === 'sys' ? S.txt3 : S.txt, fontStyle: m.role === 'sys' ? 'italic' : 'normal' }}>{m.text}</div>
          ))}
          {aiLoading && (
            <div style={{ display: 'flex', gap: 5, padding: '10px 12px', alignItems: 'center' }}>
              {['bd1','bd2','bd3'].map(c => <div key={c} className={c} style={{ width: 6, height: 6, borderRadius: '50%', background: S.teal }} />)}
            </div>
          )}
        </div>
        <div style={{ padding: '8px 10px', borderTop: `1px solid ${S.border}`, flexShrink: 0, display: 'flex', gap: 5 }}>
          <input style={{ flex: 1, background: S.up, border: `1px solid ${S.border}`, borderRadius: 6, padding: '6px 8px', color: S.txt, fontSize: 11, outline: 'none', fontFamily: "'DM Sans', sans-serif" }} value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendAI()} placeholder="Ask about ROS…" />
          <button onClick={() => sendAI()} style={{ background: S.teal, color: S.bg, border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>↑</button>
        </div>
      </aside>
    </div>
  );
}