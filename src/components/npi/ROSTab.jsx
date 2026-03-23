import React, { useState, useRef, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

// ─── DESIGN TOKENS ───────────────────────────────────────
const S = {
  bg: '#050f1e', panel: '#081628', card: '#0b1e36', up: '#0e2544',
  border: '#1a3555', borderHi: '#2a4f7a',
  blue: '#3b9eff', teal: '#00e5c0', gold: '#f5c842',
  purple: '#9b6dff', coral: '#ff6b6b', orange: '#ff9f43',
  txt: '#e8f0fe', txt2: '#8aaccc', txt3: '#4a6a8a', txt4: '#2e4a6a',
};

// ─── ROS DATA ─────────────────────────────────────────────
const ROS_SYSTEMS = [
  { id: 'constitutional', name: 'Constitutional', icon: '🌡️', key: '1',
    symptoms: ['Fever','Chills','Fatigue','Malaise','Night sweats','Weight loss','Weight gain','Weakness','Diaphoresis'] },
  { id: 'eyes', name: 'Eyes', icon: '👁️', key: '2',
    symptoms: ['Vision changes','Blurred vision','Double vision','Eye pain','Redness','Discharge','Photophobia','Floaters'] },
  { id: 'ent', name: 'ENT', icon: '👂', key: '3',
    symptoms: ['Hearing loss','Tinnitus','Ear pain','Sore throat','Nasal congestion','Epistaxis','Hoarseness','Dysphagia'] },
  { id: 'cardiovascular', name: 'Cardiovascular', icon: '❤️', key: '4',
    symptoms: ['Chest pain','Palpitations','Orthopnea','PND','Edema','Syncope','Claudication','DOE'] },
  { id: 'respiratory', name: 'Respiratory', icon: '🫁', key: '5',
    symptoms: ['Dyspnea','Cough','Hemoptysis','Wheezing','Pleuritic pain','Sputum production','Stridor','SOB'] },
  { id: 'gi', name: 'Gastrointestinal', icon: '🔄', key: '6',
    symptoms: ['Nausea','Vomiting','Diarrhea','Constipation','Abdominal pain','Hematemesis','Melena','Hematochezia','Dyspepsia'] },
  { id: 'gu', name: 'Genitourinary', icon: '🔬', key: '7',
    symptoms: ['Dysuria','Frequency','Urgency','Hematuria','Flank pain','Incontinence','Discharge','Testicular pain'] },
  { id: 'msk', name: 'Musculoskeletal', icon: '🦴', key: '8',
    symptoms: ['Joint pain','Joint swelling','Stiffness','Back pain','Muscle weakness','Muscle pain','Limited ROM','Deformity'] },
  { id: 'skin', name: 'Skin', icon: '🩹', key: '9',
    symptoms: ['Rash','Itching','Lesions','Wounds','Bruising','Skin color changes','Hair loss','Nail changes'] },
  { id: 'neuro', name: 'Neurological', icon: '🧠', key: '0',
    symptoms: ['Headache','Dizziness','Numbness','Tingling','Seizures','Tremor','Gait disturbance','Memory loss','Focal weakness','Syncope'] },
  { id: 'psych', name: 'Psychiatric', icon: '💭', key: '-',
    symptoms: ['Depression','Anxiety','SI/HI','Hallucinations','Sleep disturbance','Agitation','Confusion','Substance use'] },
  { id: 'endo', name: 'Endocrine', icon: '⚗️', key: '=',
    symptoms: ['Polydipsia','Polyuria','Heat intolerance','Cold intolerance','Excessive sweating','Hair changes'] },
  { id: 'heme', name: 'Heme/Lymph', icon: '🩸', key: 'Q',
    symptoms: ['Easy bruising','Prolonged bleeding','Lymphadenopathy','Petechiae','Blood clots','Anemia symptoms'] },
  { id: 'allergic', name: 'Allergy/Immune', icon: '🛡️', key: 'W',
    symptoms: ['Seasonal allergies','Drug allergies','Hives/urticaria','Anaphylaxis hx','Recurrent infections','Immunodeficiency'] },
];

const HPI_TEXT = `42-year-old male presents with acute onset substernal chest pain that started 2 hours ago while watching television. Patient describes the pain as pressure-like, radiating to the left arm, rated 7/10. He reports associated shortness of breath and nausea without vomiting. He also notes diaphoresis since symptom onset. He denies dizziness, syncope, or headache. Denies palpitations or prior episodes. No cough, hemoptysis, or wheezing. No musculoskeletal pain or recent trauma.`;

const HPI_SYSTEM_KEYWORDS = {
  cardiovascular: ['chest pain','substernal','radiating','palpitations','arm','pressure-like'],
  respiratory: ['shortness of breath','sob','cough','hemoptysis','wheezing','dyspnea'],
  constitutional: ['diaphoresis','fever','chills','fatigue','sweating'],
  gi: ['nausea','vomiting','abdominal pain','diarrhea'],
  neuro: ['dizziness','syncope','headache','numbness','tingling'],
  msk: ['musculoskeletal','trauma','back pain','joint pain'],
};

function initRosState() {
  const state = {};
  ROS_SYSTEMS.forEach(sys => {
    state[sys.id] = {};
    sys.symptoms.forEach(s => { state[sys.id][s] = { status: 'unreviewed', detail: '', aiSet: false }; });
  });
  return state;
}

function detectHpiSystems() {
  const hpiLower = HPI_TEXT.toLowerCase();
  const detected = new Set();
  Object.entries(HPI_SYSTEM_KEYWORDS).forEach(([sysId, keywords]) => {
    if (keywords.some(kw => hpiLower.includes(kw))) detected.add(sysId);
  });
  return detected;
}

const HPI_DETECTED = detectHpiSystems();

const HPI_COLORS = {
  cardiovascular: S.coral, respiratory: S.blue, constitutional: S.gold,
  gi: S.teal, neuro: S.purple, msk: S.orange,
};

// ─── STYLES ──────────────────────────────────────────────
const CSS = `
@keyframes chip-pop { from{transform:scale(0.8);opacity:0} to{transform:scale(1);opacity:1} }
@keyframes ai-scan-glow {
  0%{box-shadow:inset 0 0 0 1px rgba(155,109,255,0.5),0 0 15px rgba(155,109,255,0.2)}
  100%{box-shadow:inset 0 0 0 1px rgba(155,109,255,0),0 0 0 rgba(155,109,255,0)}
}
@keyframes scanline { 0%{left:-100%} 100%{left:100%} }
@keyframes shimmer { 0%{left:-100%} 100%{left:100%} }
@keyframes strip-in { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
@keyframes bounce { 0%,80%,100%{transform:translateY(0);opacity:0.4} 40%{transform:translateY(-6px);opacity:1} }
@keyframes star-pop { 0%{transform:scale(1)} 50%{transform:scale(1.4)} 100%{transform:scale(1)} }
.ros-chip-pos { animation: chip-pop 0.2s cubic-bezier(0.34,1.56,0.64,1); }
.ros-sys-ai-touched { animation: ai-scan-glow 1.5s ease forwards; }
.ros-sys-scanning::after {
  content:''; position:absolute; top:0; left:-100%; width:100%; height:100%;
  background:linear-gradient(90deg,transparent,rgba(155,109,255,0.08),rgba(155,109,255,0.15),rgba(155,109,255,0.08),transparent);
  animation:scanline 0.6s ease-in-out forwards; z-index:2; pointer-events:none;
}
.ros-abn-chip-enter { animation: chip-pop 0.25s cubic-bezier(0.34,1.56,0.64,1); }
.ai-bounce-1 { animation: bounce 1.2s ease-in-out infinite; }
.ai-bounce-2 { animation: bounce 1.2s 0.2s ease-in-out infinite; }
.ai-bounce-3 { animation: bounce 1.2s 0.4s ease-in-out infinite; }
.sweep-shimmer {
  position:absolute; top:0; left:-100%; width:100%; height:100%;
  background:linear-gradient(90deg,transparent,rgba(155,109,255,0.3),transparent);
}
.sweep-shimmer-active { animation: shimmer 1s ease-in-out infinite; }
`;

// ─── COMPONENT ────────────────────────────────────────────
export default function ROSTab() {
  const [rosState, setRosState] = useState(initRosState);
  const [pins, setPins] = useState(new Set(['constitutional','cardiovascular','respiratory','neuro']));
  const [aiTouched, setAiTouched] = useState(new Set());
  const [expandedSys, setExpandedSys] = useState(null);
  const [sweepState, setSweepState] = useState('idle'); // idle | sweeping | done
  const [sweepStatus, setSweepStatus] = useState('');
  const [noteMode, setNoteMode] = useState('smart');
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [hpiOpen, setHpiOpen] = useState(true);
  const [scanningIds, setScanningIds] = useState(new Set());
  const [copied, setCopied] = useState(false);
  const [aiMsgs, setAiMsgs] = useState([{ role: 'sys', text: 'ROS assistant ready. I can auto-fill from the HPI, suggest pertinent negatives, or help with differentials.' }]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const aiRef = useRef(null);

  useEffect(() => {
    if (aiRef.current) aiRef.current.scrollTop = aiRef.current.scrollHeight;
  }, [aiMsgs, aiLoading]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const keyMap = {};
      ROS_SYSTEMS.forEach(sys => { keyMap[sys.key.toLowerCase()] = sys.id; });
      if (keyMap[e.key.toLowerCase()] && !e.shiftKey) {
        e.preventDefault();
        setExpandedSys(prev => prev === keyMap[e.key.toLowerCase()] ? null : keyMap[e.key.toLowerCase()]);
      }
      if ((e.key === 'n' || e.key === 'N') && expandedSys && !e.shiftKey) { e.preventDefault(); toggleSystemNeg(expandedSys); }
      if ((e.key === 'a' || e.key === 'A') && e.shiftKey) { e.preventDefault(); masterAllNeg(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [expandedSys]);

  // ── Symptom cycle ──────────────────────────────────────
  const cycleSymptom = (sysId, symptom) => {
    setRosState(prev => {
      const cur = prev[sysId][symptom].status;
      return { ...prev, [sysId]: { ...prev[sysId], [symptom]: { status: cur === 'pos' ? 'neg' : 'pos', detail: '', aiSet: false } } };
    });
  };

  const setDetail = (sysId, symptom, detail) => {
    setRosState(prev => ({ ...prev, [sysId]: { ...prev[sysId], [symptom]: { ...prev[sysId][symptom], detail } } }));
  };

  const toggleSystemNeg = (sysId) => {
    setRosState(prev => {
      const vals = Object.values(prev[sysId]);
      const allNeg = vals.every(s => s.status === 'neg');
      const updated = {};
      Object.keys(prev[sysId]).forEach(symptom => {
        updated[symptom] = allNeg ? { status: 'unreviewed', detail: '', aiSet: false } : prev[sysId][symptom].status !== 'pos' ? { ...prev[sysId][symptom], status: 'neg' } : prev[sysId][symptom];
      });
      return { ...prev, [sysId]: updated };
    });
  };

  const masterAllNeg = () => {
    setRosState(prev => {
      const next = { ...prev };
      ROS_SYSTEMS.forEach(sys => {
        const updated = {};
        Object.keys(prev[sys.id]).forEach(s => { updated[s] = prev[sys.id][s].status !== 'pos' ? { ...prev[sys.id][s], status: 'neg' } : prev[sys.id][s]; });
        next[sys.id] = updated;
      });
      return next;
    });
  };

  const masterReset = () => {
    setRosState(initRosState());
    setAiTouched(new Set());
    setSweepState('idle');
    setSweepStatus('');
  };

  const togglePin = (sysId) => {
    setPins(prev => { const n = new Set(prev); n.has(sysId) ? n.delete(sysId) : n.add(sysId); return n; });
  };

  // ── AI Sweep ───────────────────────────────────────────
  const aiSweep = async () => {
    if (sweepState === 'sweeping') return;
    setSweepState('sweeping');
    setSweepStatus('Parsing clinical narrative…');

    const aiResult = {
      constitutional: { positives: ['Diaphoresis'], negatives: ['Fever','Chills','Fatigue','Malaise','Night sweats','Weight loss','Weight gain','Weakness'] },
      cardiovascular: { positives: ['Chest pain','DOE'], negatives: ['Palpitations','Orthopnea','PND','Edema','Syncope','Claudication'], details: { 'Chest pain': 'substernal, pressure-like, radiating to L arm, 7/10' } },
      respiratory: { positives: ['SOB'], negatives: ['Cough','Hemoptysis','Wheezing','Pleuritic pain','Sputum production','Stridor','Dyspnea'] },
      gi: { positives: ['Nausea'], negatives: ['Vomiting','Diarrhea','Constipation','Abdominal pain','Hematemesis','Melena','Hematochezia','Dyspepsia'] },
      neuro: { positives: [], negatives: ['Dizziness','Headache','Syncope','Numbness','Tingling','Focal weakness'] },
      msk: { positives: [], negatives: ['Joint pain','Back pain','Muscle pain'] },
    };

    for (const [sysId, result] of Object.entries(aiResult)) {
      const sys = ROS_SYSTEMS.find(s => s.id === sysId);
      setSweepStatus(`Scanning ${sys.name}…`);
      setScanningIds(prev => new Set([...prev, sysId]));
      await new Promise(r => setTimeout(r, 350));

      setRosState(prev => {
        const updated = { ...prev[sysId] };
        result.positives.forEach(symptom => {
          if (updated[symptom]) updated[symptom] = { status: 'pos', detail: result.details?.[symptom] || '', aiSet: true };
        });
        result.negatives.forEach(symptom => {
          if (updated[symptom]) updated[symptom] = { status: 'neg', detail: '', aiSet: true };
        });
        return { ...prev, [sysId]: updated };
      });
      setAiTouched(prev => new Set([...prev, sysId]));

      await new Promise(r => setTimeout(r, 250));
      setScanningIds(prev => { const n = new Set(prev); n.delete(sysId); return n; });
    }

    // Mark pinned systems not in HPI as all-neg
    setRosState(prev => {
      const next = { ...prev };
      pins.forEach(sysId => {
        if (!aiResult[sysId]) {
          const updated = {};
          Object.keys(prev[sysId]).forEach(s => { updated[s] = prev[sysId][s].status === 'unreviewed' ? { status: 'neg', detail: '', aiSet: false } : prev[sysId][s]; });
          next[sysId] = updated;
        }
      });
      return next;
    });

    const totalPos = Object.values(aiResult).reduce((a, r) => a + r.positives.length, 0);
    setSweepState('done');
    setSweepStatus(`${Object.keys(aiResult).length} systems filled · ${totalPos} positives found`);
    setAiMsgs(prev => [...prev, { role: 'sys', text: `✦ AI Auto-Fill complete — analyzed HPI and populated ${Object.keys(aiResult).length} systems. Found ${totalPos} positive finding(s).` }]);
    setTimeout(() => setSweepState('idle'), 3000);
  };

  // ── Stats ──────────────────────────────────────────────
  const getStats = () => {
    let reviewed = 0, totalPos = 0;
    const allPositives = [];
    ROS_SYSTEMS.forEach(sys => {
      const vals = Object.values(rosState[sys.id]);
      if (vals.some(s => s.status !== 'unreviewed')) reviewed++;
      Object.keys(rosState[sys.id]).forEach(symptom => {
        if (rosState[sys.id][symptom].status === 'pos') {
          totalPos++;
          allPositives.push({ sysId: sys.id, sysName: sys.name, symptom, detail: rosState[sys.id][symptom].detail });
        }
      });
    });
    return { reviewed, totalPos, allPositives };
  };

  const getSysStatus = (sysId) => {
    const vals = Object.values(rosState[sysId]);
    const hasPos = vals.some(s => s.status === 'pos');
    const anyReviewed = vals.some(s => s.status !== 'unreviewed');
    if (hasPos) return { label: `${vals.filter(s => s.status === 'pos').length} POSITIVE`, type: 'pos' };
    if (anyReviewed) return { label: 'NEGATIVE', type: 'neg' };
    return { label: 'NOT REVIEWED', type: 'none' };
  };

  const isAllNeg = (sysId) => Object.values(rosState[sysId]).every(s => s.status === 'neg') && Object.values(rosState[sysId]).some(s => s.status === 'neg');

  // ── Note generation ────────────────────────────────────
  const generateNote = () => {
    const anyReviewed = ROS_SYSTEMS.some(sys => Object.values(rosState[sys.id]).some(s => s.status !== 'unreviewed'));
    if (!anyReviewed) return null;
    const negSystems = [], posSystems = [];
    let includedCount = 0;
    ROS_SYSTEMS.forEach(sys => {
      const vals = Object.values(rosState[sys.id]);
      if (!vals.some(s => s.status !== 'unreviewed')) return;
      if (noteMode === 'smart') {
        const hasPos = vals.some(s => s.status === 'pos');
        if (!hasPos && !HPI_DETECTED.has(sys.id) && !aiTouched.has(sys.id) && !pins.has(sys.id)) return;
      }
      includedCount++;
      const pos = [];
      const neg = [];
      Object.keys(rosState[sys.id]).forEach(symptom => {
        const st = rosState[sys.id][symptom];
        if (st.status === 'pos') pos.push(symptom.toLowerCase() + (st.detail ? ` (${st.detail})` : ''));
        else if (st.status === 'neg') neg.push(symptom.toLowerCase());
      });
      if (pos.length > 0) posSystems.push({ name: sys.name, pos, neg, id: sys.id });
      else negSystems.push(sys.name);
    });
    return { negSystems, posSystems, includedCount, omitted: ROS_SYSTEMS.length - includedCount };
  };

  const note = generateNote();
  const { reviewed, totalPos, allPositives } = getStats();
  const total = ROS_SYSTEMS.length;
  const progressPct = reviewed / total;
  const circumference = 94.25;

  // ── Copy note ──────────────────────────────────────────
  const copyNote = () => {
    if (!note) return;
    let text = '';
    if (note.negSystems.length > 0) {
      text += note.negSystems.length === total ? `A complete ${total}-point review of systems is negative.` : `Negative: ${note.negSystems.join(', ')}.`;
    }
    note.posSystems.forEach(ps => {
      text += `\n${ps.name}: Positive for ${ps.pos.join(', ')}.`;
      if (ps.neg.length > 0) text += ` Denies ${ps.neg.join(', ')}.`;
    });
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  };

  // ── AI Chat ────────────────────────────────────────────
  const buildContext = () => {
    let ctx = `Patient: CC Chest Pain, HPI: ${HPI_TEXT}\n\nROS:\n`;
    ROS_SYSTEMS.forEach(sys => {
      const vals = Object.values(rosState[sys.id]);
      if (!vals.some(s => s.status !== 'unreviewed')) { ctx += `${sys.name}: Not reviewed\n`; return; }
      const pos = [], neg = [];
      Object.keys(rosState[sys.id]).forEach(s => {
        if (rosState[sys.id][s].status === 'pos') pos.push(s);
        else if (rosState[sys.id][s].status === 'neg') neg.push(s);
      });
      ctx += `${sys.name}: ${pos.length ? 'Positive for ' + pos.join(', ') + '. ' : ''}${neg.length ? 'Denies ' + neg.join(', ') + '.' : ''}\n`;
    });
    return ctx;
  };

  const sendAI = async (q) => {
    const question = q || aiInput.trim();
    if (!question || aiLoading) return;
    setAiInput('');
    setAiMsgs(prev => [...prev, { role: 'user', text: question }]);
    setAiLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Notrya AI, a clinical assistant for emergency medicine. ROS context:\n${buildContext()}\n\nQuestion: ${question}`,
      });
      setAiMsgs(prev => [...prev, { role: 'bot', text: typeof res === 'string' ? res : JSON.stringify(res) }]);
    } catch {
      setAiMsgs(prev => [...prev, { role: 'sys', text: '⚠ Connection error.' }]);
    }
    setAiLoading(false);
  };

  // ──────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{CSS}</style>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px 30px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>🔍</span>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 600, color: S.txt }}>Review of Systems</div>
            <div style={{ fontSize: 12, color: S.txt3, marginTop: 1 }}>AI-powered auto-fill from HPI · Provider presets · Exception-based rapid entry</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
            {[['1','–','0'], ['N','negate'], ['⇧A','all neg']].map(([k, l]) => (
              <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: S.txt4 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", background: S.up, border: `1px solid ${S.border}`, borderRadius: 3, padding: '1px 5px', color: S.txt3, fontSize: 9 }}>{k}</span>
                {l && <span>{l}</span>}
              </span>
            ))}
          </div>
        </div>

        {/* HPI INTELLIGENCE PANEL */}
        <div style={{ background: S.panel, border: `1px solid ${S.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <div onClick={() => setHpiOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', cursor: 'pointer', userSelect: 'none' }}>
            <span style={{ fontSize: 11, color: S.txt4, transition: 'transform 0.25s', display: 'inline-block', transform: hpiOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}>▾</span>
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
              {/* HPI text with highlights */}
              <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 8, padding: '12px 14px', fontSize: 12.5, lineHeight: 1.8, color: S.txt2, marginBottom: 12 }}>
                {HPI_TEXT.split(/(acute onset substernal chest pain|pressure-like, radiating to the left arm|shortness of breath|nausea without vomiting|diaphoresis|dizziness, syncope,|Denies palpitations or prior episodes|cough, hemoptysis, or wheezing|musculoskeletal pain or recent trauma)/g).map((part, i) => {
                  const hl = {
                    'acute onset substernal chest pain': ['hpi-hl-cardio', S.coral],
                    'pressure-like, radiating to the left arm': ['hpi-hl-cardio', S.coral],
                    'shortness of breath': ['hpi-hl-resp', S.blue],
                    'nausea without vomiting': ['hpi-hl-gi', S.teal],
                    'diaphoresis': ['hpi-hl-const', S.gold],
                    'dizziness, syncope,': ['hpi-hl-neuro', S.purple],
                    'Denies palpitations or prior episodes': ['hpi-hl-cardio', S.coral],
                    'cough, hemoptysis, or wheezing': ['hpi-hl-resp', S.blue],
                    'musculoskeletal pain or recent trauma': ['hpi-hl-msk', S.orange],
                  }[part];
                  if (hl) return <span key={i} style={{ borderRadius: 3, padding: '1px 3px', fontWeight: 500, background: `${hl[1]}22`, color: hl[1], borderBottom: `1px dashed ${hl[1]}66` }}>{part}</span>;
                  return part;
                })}
              </div>
              {/* Detected system tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 10, color: S.txt4, marginRight: 4 }}>Systems detected:</span>
                {[...HPI_DETECTED].map(sysId => {
                  const sys = ROS_SYSTEMS.find(s => s.id === sysId);
                  const color = HPI_COLORS[sysId] || S.txt2;
                  return (
                    <span key={sysId} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: `${color}15`, color, border: `1px solid ${color}40` }}>
                      {sys.icon} {sys.name}
                    </span>
                  );
                })}
              </div>
              {/* Sweep button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  onClick={aiSweep}
                  disabled={sweepState === 'sweeping'}
                  style={{ position: 'relative', overflow: 'hidden', padding: '9px 22px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: sweepState === 'sweeping' ? 'wait' : 'pointer', border: `2px solid ${sweepState === 'done' ? 'rgba(0,229,192,0.4)' : 'rgba(155,109,255,0.4)'}`, background: sweepState === 'done' ? 'rgba(0,229,192,0.15)' : 'rgba(155,109,255,0.1)', color: sweepState === 'done' ? S.teal : S.purple, fontFamily: "'DM Sans', sans-serif" }}>
                  <span className={`sweep-shimmer${sweepState === 'sweeping' ? ' sweep-shimmer-active' : ''}`} />
                  {sweepState === 'done' ? '✓ HPI Auto-Fill Complete' : sweepState === 'sweeping' ? '✦ Analyzing HPI…' : '✦ AI Auto-Fill from HPI'}
                </button>
                {sweepStatus && <span style={{ fontSize: 11, color: S.txt3, fontStyle: 'italic' }}>{sweepStatus}</span>}
              </div>
            </div>
          )}
        </div>

        {/* MASTER CONTROLS */}
        <div style={{ background: S.panel, border: `1px solid ${S.border}`, borderRadius: 12, padding: '12px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={masterAllNeg} style={{ padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: `2px solid rgba(0,229,192,0.4)`, background: 'rgba(0,229,192,0.12)', color: S.teal, fontFamily: "'DM Sans', sans-serif" }}>✓ All Systems Negative</button>
            <button onClick={masterReset} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: `2px solid ${S.border}`, background: S.up, color: S.txt3, fontFamily: "'DM Sans', sans-serif" }}>↺ Reset</button>
            <button onClick={() => setPrefsOpen(o => !o)} style={{ padding: '6px 14px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: `1px solid ${prefsOpen ? 'rgba(245,200,66,0.5)' : S.border}`, background: prefsOpen ? 'rgba(245,200,66,0.08)' : S.up, color: prefsOpen ? S.gold : S.txt3, fontFamily: "'DM Sans', sans-serif" }}>⭐ My Presets</button>

            {/* Progress ring */}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ position: 'relative', width: 36, height: 36 }}>
                <svg width="36" height="36" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="18" cy="18" r="15" fill="none" stroke={S.border} strokeWidth="3" />
                  <circle cx="18" cy="18" r="15" fill="none" stroke={S.teal} strokeWidth="3" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progressPct)} style={{ transition: 'stroke-dashoffset 0.4s ease' }} />
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

        {/* PREFS DRAWER */}
        {prefsOpen && (
          <div style={{ background: 'rgba(245,200,66,0.03)', border: `1px solid rgba(245,200,66,0.2)`, borderRadius: 12, padding: '12px 16px', marginTop: -6 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: S.gold, marginBottom: 8 }}>⭐ Always Include These Systems</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {ROS_SYSTEMS.map(sys => (
                <span key={sys.id} onClick={() => togglePin(sys.id)} style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, cursor: 'pointer', border: `1px solid ${pins.has(sys.id) ? 'rgba(245,200,66,0.4)' : S.border}`, background: pins.has(sys.id) ? 'rgba(245,200,66,0.12)' : S.up, color: pins.has(sys.id) ? S.gold : S.txt3, fontWeight: pins.has(sys.id) ? 600 : 400, userSelect: 'none' }}>
                  {sys.icon} {sys.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ABNORMAL STRIP */}
        {allPositives.length > 0 && (
          <div style={{ background: 'rgba(255,107,107,0.06)', border: `1px solid rgba(255,107,107,0.2)`, borderRadius: 12, padding: '10px 14px', animation: 'strip-in 0.3s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 13 }}>⚠️</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: S.coral, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Abnormal Findings</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {allPositives.map((p, i) => (
                <span key={i} onClick={() => cycleSymptom(p.sysId, p.symptom)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: 'rgba(255,107,107,0.15)', border: `1px solid rgba(255,107,107,0.35)`, color: S.coral, cursor: 'pointer' }} className="ros-abn-chip-enter">
                  <span style={{ fontSize: 9, color: 'rgba(255,107,107,0.6)', marginRight: 2 }}>{p.sysName}:</span>
                  {p.symptom}{p.detail ? ` — ${p.detail}` : ''}<span style={{ fontSize: 13, marginLeft: 2, opacity: 0.5 }}>×</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* SYSTEM ROWS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {ROS_SYSTEMS.map(sys => {
            const isExpanded = expandedSys === sys.id;
            const isScanning = scanningIds.has(sys.id);
            const isTouched = aiTouched.has(sys.id);
            const isPinned = pins.has(sys.id);
            const status = getSysStatus(sys.id);
            const allNeg = isAllNeg(sys.id);
            const positives = Object.keys(rosState[sys.id]).filter(s => rosState[sys.id][s].status === 'pos');

            return (
              <div key={sys.id} style={{ background: S.panel, border: `1px solid ${status.type === 'pos' ? 'rgba(255,107,107,0.35)' : status.type === 'neg' ? 'rgba(0,229,192,0.2)' : S.border}`, borderRadius: 10, overflow: 'hidden', position: 'relative' }} className={isScanning ? 'ros-sys-scanning' : isTouched ? 'ros-sys-ai-touched' : ''}>
                {/* System header row */}
                <div onClick={() => setExpandedSys(isExpanded ? null : sys.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', cursor: 'pointer', userSelect: 'none', position: 'relative', zIndex: 3 }}>
                  {/* Star */}
                  <span onClick={e => { e.stopPropagation(); togglePin(sys.id); }} style={{ fontSize: 14, cursor: 'pointer', flexShrink: 0, opacity: isPinned ? 1 : 0.25, filter: isPinned ? 'none' : 'grayscale(1)', transition: 'all 0.2s' }} title="Pin system">⭐</span>
                  {/* Key badge */}
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, width: 18, height: 18, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', background: S.up, color: S.txt4, border: `1px solid ${S.border}`, flexShrink: 0, fontWeight: 600 }}>{sys.key}</span>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{sys.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: S.txt, flexShrink: 0, minWidth: 120 }}>{sys.name}</span>
                  {/* Status badge */}
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, padding: '1px 8px', borderRadius: 20, flexShrink: 0, fontWeight: 600, transition: 'all 0.2s', background: status.type === 'pos' ? 'rgba(255,107,107,0.15)' : status.type === 'neg' ? 'rgba(0,229,192,0.1)' : S.up, color: status.type === 'pos' ? S.coral : status.type === 'neg' ? S.teal : S.txt4, border: `1px solid ${status.type === 'pos' ? 'rgba(255,107,107,0.3)' : status.type === 'neg' ? 'rgba(0,229,192,0.3)' : S.border}` }}>{status.label}</span>
                  {isTouched && <span style={{ fontSize: 9, padding: '0px 5px', borderRadius: 10, background: 'rgba(155,109,255,0.15)', color: S.purple, border: `1px solid rgba(155,109,255,0.3)`, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, flexShrink: 0 }}>AI</span>}
                  {/* Positive pills */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, flex: 1, minWidth: 0, margin: '0 4px' }}>
                    {positives.map(s => (
                      <span key={s} style={{ fontSize: 10, padding: '1px 7px', borderRadius: 12, background: 'rgba(255,107,107,0.1)', color: S.coral, border: `1px solid rgba(255,107,107,0.25)`, whiteSpace: 'nowrap' }}>{s}</span>
                    ))}
                  </div>
                  {/* Neg button */}
                  <button onClick={e => { e.stopPropagation(); toggleSystemNeg(sys.id); }} style={{ padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: 'pointer', border: `1px solid ${allNeg ? S.teal : 'rgba(0,229,192,0.3)'}`, background: allNeg ? S.teal : 'rgba(0,229,192,0.08)', color: allNeg ? S.bg : S.teal, marginLeft: 'auto', flexShrink: 0, fontFamily: "'DM Sans', sans-serif" }}>✓ Negative</button>
                  <span style={{ fontSize: 12, color: S.txt4, transition: 'transform 0.2s', flexShrink: 0, display: 'inline-block', transform: isExpanded ? 'rotate(180deg)' : 'none' }}>▾</span>
                </div>

                {/* Expanded symptom grid */}
                {isExpanded && (
                  <div style={{ padding: '10px 14px 12px', background: 'rgba(0,0,0,0.15)', borderTop: `1px solid ${S.border}` }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {sys.symptoms.map(symptom => {
                        const st = rosState[sys.id][symptom];
                        return (
                          <div key={symptom} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <span
                              onClick={() => cycleSymptom(sys.id, symptom)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer', userSelect: 'none', transition: 'all 0.15s', border: `1px solid ${st.status === 'pos' ? 'rgba(255,107,107,0.5)' : st.status === 'neg' ? 'rgba(0,229,192,0.2)' : S.border}`, background: st.status === 'pos' ? (st.aiSet ? 'rgba(155,109,255,0.12)' : 'rgba(255,107,107,0.12)') : st.status === 'neg' ? 'rgba(0,229,192,0.04)' : S.up, color: st.status === 'pos' ? (st.aiSet ? S.purple : S.coral) : st.status === 'neg' ? S.txt3 : S.txt3, fontWeight: st.status === 'pos' ? 600 : 400 }}
                              className={st.status === 'pos' ? 'ros-chip-pos' : ''}
                            >
                              <span style={{ fontSize: 10 }}>{st.status === 'pos' ? '⊕' : st.status === 'neg' ? '−' : '○'}</span>
                              {symptom}
                            </span>
                            {st.status === 'pos' && (
                              <input type="text" placeholder="Details…" value={st.detail} onClick={e => e.stopPropagation()} onChange={e => setDetail(sys.id, symptom, e.target.value)} style={{ background: S.up, border: `1px solid rgba(255,107,107,0.3)`, borderRadius: 6, padding: '4px 8px', color: S.txt, fontSize: 11, outline: 'none', width: 120, fontFamily: "'DM Sans', sans-serif", marginTop: 4 }} />
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

        {/* GENERATED NOTE */}
        <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: `1px solid ${S.border}` }}>
            <span style={{ fontSize: 14 }}>📝</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: S.txt2 }}>Generated ROS Note</span>
            <div style={{ display: 'flex', gap: 0, border: `1px solid ${S.border}`, borderRadius: 6, overflow: 'hidden', marginLeft: 8 }}>
              {['smart','full'].map(mode => (
                <button key={mode} onClick={() => setNoteMode(mode)} style={{ padding: '3px 10px', fontSize: 10, fontWeight: 600, cursor: 'pointer', background: noteMode === mode ? 'rgba(59,158,255,0.15)' : S.up, color: noteMode === mode ? S.blue : S.txt4, border: 'none', fontFamily: "'DM Sans', sans-serif" }}>
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
            <span style={{ fontSize: 10, color: S.txt4, marginLeft: 4 }}>Smart = HPI-relevant + pinned + positives</span>
            <button onClick={copyNote} style={{ marginLeft: 'auto', padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: 'pointer', background: copied ? 'rgba(0,229,192,0.08)' : S.up, border: `1px solid ${copied ? S.teal : S.border}`, color: copied ? S.teal : S.txt3, fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s' }}>
              {copied ? '✓ Copied' : '📋 Copy'}
            </button>
          </div>
          <div style={{ padding: '12px 14px', fontSize: 12, lineHeight: 1.7, color: S.txt2, minHeight: 60, whiteSpace: 'pre-wrap' }}>
            {!note ? (
              <span style={{ color: S.txt4, fontStyle: 'italic' }}>Complete the review of systems above to generate note text.</span>
            ) : (
              <>
                {note.negSystems.length > 0 && (
                  <span style={{ color: S.txt3 }}>{note.negSystems.length === total ? `A complete ${total}-point review of systems is negative.` : `Negative: ${note.negSystems.join(', ')}.`}</span>
                )}
                {note.posSystems.map(ps => (
                  <div key={ps.id}>
                    {'\n'}<strong style={{ color: S.txt }}>{ps.name}:</strong>{' '}
                    <span style={{ color: S.coral, fontWeight: 500 }}>Positive for {ps.pos.join(', ')}.</span>
                    {ps.neg.length > 0 && <span style={{ color: S.txt3 }}> Denies {ps.neg.join(', ')}.</span>}
                  </div>
                ))}
                {noteMode === 'smart' && note.omitted > 0 && (
                  <div style={{ color: S.txt4, fontSize: 11, fontStyle: 'italic', marginTop: 8 }}>{note.omitted} system(s) omitted (not mentioned in HPI and not pinned)</div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* AI PANEL */}
      <aside style={{ width: 280, flexShrink: 0, background: S.panel, borderLeft: `1px solid ${S.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '10px 12px', borderBottom: `1px solid ${S.border}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: S.teal, flexShrink: 0 }} />
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
          {aiMsgs.map((m, i) => (
            <div key={i} style={{ padding: '8px 10px', borderRadius: 8, fontSize: 11, lineHeight: 1.5, background: m.role === 'sys' ? S.up : m.role === 'user' ? 'rgba(59,158,255,0.12)' : 'rgba(0,229,192,0.07)', border: `1px solid ${m.role === 'sys' ? S.border : m.role === 'user' ? 'rgba(59,158,255,0.25)' : 'rgba(0,229,192,0.18)'}`, color: m.role === 'sys' ? S.txt3 : S.txt, fontStyle: m.role === 'sys' ? 'italic' : 'normal' }}>{m.text}</div>
          ))}
          {aiLoading && (
            <div style={{ display: 'flex', gap: 5, padding: '10px 12px', alignItems: 'center' }}>
              {['ai-bounce-1','ai-bounce-2','ai-bounce-3'].map(cls => (
                <div key={cls} className={cls} style={{ width: 6, height: 6, borderRadius: '50%', background: S.teal }} />
              ))}
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