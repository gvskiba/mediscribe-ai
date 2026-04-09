import { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

// ─── TOKENS (inherit from parent CSS vars) ────────────────────────────────────
const T = {
  bg: 'var(--npi-bg)', panel: 'var(--npi-panel)', card: 'var(--npi-card)',
  up: 'var(--npi-up)', bd: 'var(--npi-bd)', bhi: 'var(--npi-bhi)',
  blue: 'var(--npi-blue)', teal: 'var(--npi-teal)', coral: 'var(--npi-coral)',
  orange: 'var(--npi-orange)', purple: 'var(--npi-purple)',
  txt: 'var(--npi-txt)', txt2: 'var(--npi-txt2)', txt3: 'var(--npi-txt3)', txt4: 'var(--npi-txt4)',
  font: "'DM Sans', sans-serif", mono: "'JetBrains Mono', monospace",
  serif: "'Playfair Display', serif",
};

// ─── DURATION PRESET MAP ──────────────────────────────────────────────────────
const DURATION_OPTS = [
  { key: 'T', label: 'Today',           value: 'today'           },
  { key: 'Y', label: 'Yesterday',       value: 'yesterday'       },
  { key: '2', label: '2–3 days',        value: '2-3 days'        },
  { key: 'W', label: '~1 week',         value: 'approximately 1 week' },
  { key: 'M', label: '~1 month',        value: 'approximately 1 month' },
  { key: 'C', label: 'Chronic/ongoing', value: 'chronic / ongoing' },
];

// ─── PROMPTS ──────────────────────────────────────────────────────────────────
function buildQPrompt(cc) {
  return `You are a clinical documentation assistant for an emergency physician. Generate exactly 7-9 structured HPI interview questions for a patient presenting to the ED with: "${cc}".

Return ONLY a valid JSON array. Each element must have this exact shape:
{"id":"snake_case_id","label":"Question text (concise)","type":"single|multi|scale|duration|text","options":["opt1","opt2"]}

Rules:
- "scale": 0-10 pain/severity. Omit options field.
- "duration": time since onset. Omit options field.
- "single": exactly one choice. Include 4-8 specific options.
- "multi": one or more choices. Include 4-8 specific options.
- "text": free text. Omit options field.
Cover in order: onset/duration, character/quality, severity (scale), location/radiation, aggravating, relieving, associated symptoms, timing pattern.
Tailor ALL options specifically to "${cc}" — not generic. Return ONLY the JSON array.`;
}

function buildHPIPrompt(cc, questions, answers) {
  const lines = questions
    .filter(q => {
      const a = answers[q.id];
      return a && (!Array.isArray(a) || a.length > 0);
    })
    .map(q => {
      const a = answers[q.id];
      return `${q.label}: ${Array.isArray(a) ? a.join(', ') : a}`;
    })
    .join('\n');

  return `Write a concise emergency medicine History of Present Illness paragraph.

Chief Complaint: "${cc}"
Documented answers:
${lines}

Requirements: 2-4 sentences, third person ("The patient"), professional clinical language, past tense for history, present tense for current state. Incorporate all answered items naturally. Do not fabricate anything not listed. Return ONLY the HPI paragraph text, no labels or preamble.`;
}

function buildVoiceHPIPrompt(cc, transcript) {
  return `You are a clinical documentation assistant. A physician dictated the following about a patient presenting with "${cc}":

"${transcript}"

Extract the clinical information and return ONLY valid JSON with these fields (use null if not mentioned):
{"onset":null,"duration":null,"character":null,"radiation":null,"associations":null,"timing":null,"exacerbating":null,"relieving":null,"severity":null,"hpi":"2-4 sentence clinical HPI paragraph in professional EM language, third person, all relevant details incorporated"}`;
}

// ─── FALLBACK QUESTIONS (if AI fails) ─────────────────────────────────────────
function fallbackQuestions(cc) {
  return [
    { id: 'onset',      label: 'When did it start?',            type: 'duration' },
    { id: 'severity',   label: 'Severity at worst (0–10)',       type: 'scale'    },
    { id: 'quality',    label: `Character of the ${cc}`,        type: 'single',
      options: ['Sharp/stabbing', 'Dull/aching', 'Pressure/squeezing', 'Burning', 'Throbbing', 'Cramping'] },
    { id: 'radiation',  label: 'Does it radiate anywhere?',     type: 'single',
      options: ['No radiation', 'Left arm', 'Jaw/neck', 'Back', 'Right shoulder', 'Epigastric', 'Both arms'] },
    { id: 'aggravating',label: 'What makes it worse?',          type: 'multi',
      options: ['Exertion', 'Deep breath', 'Movement', 'Eating', 'Palpation', 'Supine', 'Nothing'] },
    { id: 'relieving',  label: 'What brings relief?',           type: 'multi',
      options: ['Rest', 'Position change', 'Antacids', 'Nitroglycerin', 'Nothing tried', 'Nothing'] },
    { id: 'assoc',      label: 'Associated symptoms',           type: 'multi',
      options: ['Shortness of breath', 'Nausea/vomiting', 'Diaphoresis', 'Dizziness', 'Palpitations', 'Syncope', 'None'] },
    { id: 'timing',     label: 'Pattern since onset',           type: 'single',
      options: ['Constant', 'Intermittent', 'Worsening progressively', 'Improving', 'Fluctuating'] },
  ];
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────
function KbHint({ keys, desc }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <code style={{
        fontFamily: T.mono, fontSize: 10, color: T.blue,
        background: 'rgba(59,158,255,.1)', border: '1px solid rgba(59,158,255,.2)',
        borderRadius: 4, padding: '1px 6px', whiteSpace: 'nowrap',
      }}>{keys}</code>
      <span style={{ fontSize: 10, color: T.txt4, fontFamily: T.font }}>{desc}</span>
    </div>
  );
}

function LoadingDots() {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center', padding: 8 }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: '50%', background: 'var(--npi-teal)',
          animation: `npi-bounce 1.2s ${i * 0.15}s ease-in-out infinite`,
        }} />
      ))}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function HPIBuilder({ cc, onHpiChange, existingHpi }) {
  // phase: 'loading' | 'wizard' | 'generating' | 'preview'
  const [phase, setPhase] = useState('loading');
  const [questions, setQuestions] = useState([]);
  const [activeQ, setActiveQ] = useState(0);
  const [optFocus, setOptFocus] = useState(0);
  const [answers, setAnswers] = useState({});
  const [hpiText, setHpiText] = useState(existingHpi || '');
  const [aiError, setAiError] = useState(false);

  const wizardRef = useRef(null);
  const textRef   = useRef(null);
  const prevCC    = useRef('');

  // ── Voice state ───────────────────────────────────────────────────────────
  const [voiceOpen,  setVoiceOpen]  = useState(false);
  const [voicePhase, setVoicePhase] = useState('idle'); // 'idle'|'recording'|'processing'
  const [transcript, setTranscript] = useState('');
  const [voiceError, setVoiceError] = useState('');
  const recogRef = useRef(null);
  const finalRef = useRef(''); // accumulates final speech segments

  const currentQ = questions[activeQ];
  const answeredCount = Object.values(answers).filter(a => a && (!Array.isArray(a) || a.length > 0)).length;

  // ── Load questions when CC is set ─────────────────────────────────────────
  const loadQuestions = useCallback(async (complaint) => {
    setPhase('loading');
    setAiError(false);
    try {
      const res = await base44.integrations.Core.InvokeLLM({ prompt: buildQPrompt(complaint) });
      const raw = typeof res === 'string' ? res : JSON.stringify(res);
      const clean = raw.replace(/```json[\s\S]*?```|```[\s\S]*?```/g, s => s.replace(/```json|```/g, '')).trim();
      const startIdx = clean.indexOf('[');
      const endIdx = clean.lastIndexOf(']');
      if (startIdx === -1 || endIdx === -1) throw new Error('No JSON array');
      const qs = JSON.parse(clean.slice(startIdx, endIdx + 1));
      if (!Array.isArray(qs) || qs.length === 0) throw new Error('Empty array');
      setQuestions(qs);
    } catch {
      setQuestions(fallbackQuestions(complaint));
      setAiError(true);
    }
    setActiveQ(0);
    setOptFocus(0);
    setAnswers({});
    setPhase('wizard');
  }, []);

  useEffect(() => {
    if (cc && cc !== prevCC.current) {
      prevCC.current = cc;
      loadQuestions(cc);
    } else if (!cc) {
      setPhase('wizard');
    }
  }, [cc, loadQuestions]);

  // ── Focus management ──────────────────────────────────────────────────────
  useEffect(() => {
    if (phase === 'wizard') setTimeout(() => wizardRef.current?.focus(), 80);
    if (phase === 'preview') setTimeout(() => textRef.current?.focus(), 80);
  }, [phase, activeQ]);

  // ── HPI generation ────────────────────────────────────────────────────────
  const generateHPI = useCallback(async () => {
    if (!cc) return;
    setPhase('generating');
    try {
      const res = await base44.integrations.Core.InvokeLLM({ prompt: buildHPIPrompt(cc, questions, answers) });
      const text = typeof res === 'string' ? res : (res?.text || JSON.stringify(res));
      setHpiText(text.trim());
    } catch {
      const parts = questions
        .filter(q => answers[q.id])
        .map(q => {
          const a = answers[q.id];
          return `${q.label.toLowerCase()}: ${Array.isArray(a) ? a.join(', ') : a}`;
        });
      setHpiText(`The patient presents with ${cc}. ${parts.slice(0, 4).join('; ')}.`);
    }
    setPhase('preview');
  }, [cc, questions, answers]);

  // ── Answer helpers ────────────────────────────────────────────────────────
  const setAnswer = useCallback((qid, value) => {
    setAnswers(a => ({ ...a, [qid]: value }));
  }, []);

  const toggleMulti = useCallback((qid, opt) => {
    setAnswers(a => {
      const cur = Array.isArray(a[qid]) ? a[qid] : [];
      return { ...a, [qid]: cur.includes(opt) ? cur.filter(x => x !== opt) : [...cur, opt] };
    });
  }, []);

  const advanceQ = useCallback((delta = 1) => {
    const next = activeQ + delta;
    setOptFocus(0);
    if (next >= questions.length) {
      generateHPI();
    } else {
      setActiveQ(Math.max(0, next));
    }
  }, [activeQ, questions.length, generateHPI]);

  // ── Voice capture ─────────────────────────────────────────────────────────
  const hasSpeechAPI = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  const startRecording = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setVoiceError('Speech recognition not available in this browser. Use Chrome or Edge.'); return; }
    finalRef.current = '';
    setTranscript('');
    setVoiceError('');
    const recog = new SR();
    recog.continuous     = true;
    recog.interimResults = true;
    recog.lang           = 'en-US';
    recog.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalRef.current += e.results[i][0].transcript + ' ';
        else interim += e.results[i][0].transcript;
      }
      setTranscript(finalRef.current + interim);
    };
    recog.onerror = (e) => { setVoiceError(`Microphone error: ${e.error}`); setVoicePhase('idle'); };
    recog.onend   = ()  => { setVoicePhase(prev => prev === 'recording' ? 'idle' : prev); };
    recogRef.current = recog;
    recog.start();
    setVoicePhase('recording');
  }, []);

  const stopRecording = useCallback(() => {
    recogRef.current?.stop();
    setVoicePhase('idle');
  }, []);

  const structureTranscript = useCallback(async () => {
    const text = transcript.trim();
    if (!text || !cc) return;
    setVoicePhase('processing');
    setVoiceError('');
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: buildVoiceHPIPrompt(cc, text),
        response_json_schema: {
          type: 'object',
          properties: {
            onset: {type:'string'}, duration: {type:'string'}, character: {type:'string'},
            radiation: {type:'string'}, associations: {type:'string'}, timing: {type:'string'},
            exacerbating: {type:'string'}, relieving: {type:'string'}, severity: {type:'string'},
            hpi: {type:'string'},
          },
        },
      });
      const parsed = typeof res === 'object' ? res : JSON.parse(String(res).replace(/```json|```/g,'').trim());
      if (parsed.severity   && !isNaN(parseFloat(parsed.severity))) setAnswer('severity',    parsed.severity);
      if (parsed.onset || parsed.duration)                           setAnswer('onset',        parsed.onset || parsed.duration);
      if (parsed.character)                                          setAnswer('quality',      parsed.character);
      if (parsed.exacerbating)                                       setAnswer('aggravating',  parsed.exacerbating);
      if (parsed.relieving)                                          setAnswer('relieving',    parsed.relieving);
      if (parsed.timing)                                             setAnswer('timing',       parsed.timing);
      if (parsed.associations)                                       setAnswer('assoc',        parsed.associations);
      setHpiText(parsed.hpi?.trim() || text);
    } catch {
      setHpiText(text);
    }
    setVoicePhase('idle');
    setVoiceOpen(false);
    setPhase('preview');
  }, [transcript, cc, setAnswer]);

  // ── Wizard keyboard handler ───────────────────────────────────────────────
  const handleWizardKey = useCallback((e) => {
    if (!currentQ) return;
    const tag = e.target.tagName;
    const inInput = tag === 'INPUT' || tag === 'TEXTAREA';
    const { type, options = [], id } = currentQ;
    const mod = e.metaKey || e.ctrlKey;

    if (mod && e.key.toLowerCase() === 'g') { e.preventDefault(); generateHPI(); return; }
    if (e.key === 'Escape') { e.preventDefault(); generateHPI(); return; }
    if (e.key === 'Backspace' && !inInput && activeQ > 0) {
      e.preventDefault(); setActiveQ(q => q - 1); setOptFocus(0); return;
    }
    if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); advanceQ(1); return; }
    if (e.key === 'Tab' && e.shiftKey) { e.preventDefault(); if (activeQ > 0) { setActiveQ(q => q - 1); setOptFocus(0); } return; }

    if (type === 'scale') {
      const n = e.key === '0' ? 10 : parseInt(e.key, 10);
      if (n >= 1 && n <= 10) {
        e.preventDefault();
        setAnswer(id, String(n));
        setTimeout(() => advanceQ(1), 320);
      }
    }

    if (type === 'duration') {
      const opt = DURATION_OPTS.find(d => d.key.toLowerCase() === e.key.toLowerCase());
      if (opt) {
        e.preventDefault();
        setAnswer(id, opt.value);
        setTimeout(() => advanceQ(1), 320);
      }
    }

    if (type === 'single' && options.length > 0) {
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= options.length) {
        e.preventDefault();
        setAnswer(id, options[n - 1]);
        setTimeout(() => advanceQ(1), 320);
        return;
      }
      if (e.key === 'ArrowDown')  { e.preventDefault(); setOptFocus(f => Math.min(f + 1, options.length - 1)); }
      if (e.key === 'ArrowUp')    { e.preventDefault(); setOptFocus(f => Math.max(f - 1, 0)); }
      if (e.key === 'Enter' || (e.key === ' ' && !inInput)) {
        e.preventDefault();
        setAnswer(id, options[optFocus]);
        setTimeout(() => advanceQ(1), 320);
      }
    }

    if (type === 'multi' && options.length > 0) {
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= options.length) { e.preventDefault(); toggleMulti(id, options[n - 1]); return; }
      if (e.key === 'ArrowDown')  { e.preventDefault(); setOptFocus(f => Math.min(f + 1, options.length - 1)); }
      if (e.key === 'ArrowUp')    { e.preventDefault(); setOptFocus(f => Math.max(f - 1, 0)); }
      if (e.key === ' ' && !inInput) { e.preventDefault(); toggleMulti(id, options[optFocus]); }
      if (e.key === 'Enter') { e.preventDefault(); advanceQ(1); }
    }

    if (type === 'text' && e.key === 'Enter' && !e.shiftKey && inInput) {
      e.preventDefault(); advanceQ(1);
    }
  }, [currentQ, activeQ, optFocus, advanceQ, setAnswer, toggleMulti, generateHPI]);

  // ── RENDER: no CC set ─────────────────────────────────────────────────────
  if (!cc) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, padding: 40 }}>
        <div style={{ fontSize: 32 }}>📝</div>
        <div style={{ fontFamily: T.serif, fontSize: 18, fontWeight: 600, color: T.txt }}>HPI Builder</div>
        <div style={{ fontFamily: T.font, fontSize: 13, color: T.txt4, textAlign: 'center', lineHeight: 1.6, maxWidth: 340 }}>
          Set a Chief Complaint first, then return here for an AI-guided symptom interview.
        </div>
        <div style={{
          background: 'rgba(59,158,255,.08)', border: '1px solid rgba(59,158,255,.2)',
          borderRadius: 8, padding: '8px 16px',
          fontFamily: T.mono, fontSize: 11, color: T.blue,
        }}>⌘2  →  Chief Complaint</div>
      </div>
    );
  }

  // ── RENDER: loading ───────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 14, padding: 40 }}>
        <div style={{ fontSize: 28 }}>🤖</div>
        <div style={{ fontFamily: T.serif, fontSize: 16, color: T.txt2 }}>
          Building questions for <span style={{ color: 'var(--npi-teal)' }}>{cc}</span>
        </div>
        <LoadingDots />
        <div style={{ fontFamily: T.mono, fontSize: 10, color: T.txt4 }}>AI is tailoring the symptom interview</div>
      </div>
    );
  }

  // ── RENDER: generating HPI ────────────────────────────────────────────────
  if (phase === 'generating') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 14, padding: 40 }}>
        <div style={{ fontSize: 28 }}>📄</div>
        <div style={{ fontFamily: T.serif, fontSize: 16, color: T.txt2 }}>Composing HPI narrative…</div>
        <LoadingDots />
      </div>
    );
  }

  // ── RENDER: preview ───────────────────────────────────────────────────────
  if (phase === 'preview') {
    return (
      <div style={{ padding: '24px 28px', maxWidth: 800, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: T.serif, fontSize: 19, fontWeight: 600, color: T.txt }}>HPI Preview</span>
          <span style={{ background: 'rgba(0,229,192,.12)', color: 'var(--npi-teal)', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontFamily: T.mono }}>
            {cc}
          </span>
          {hasSpeechAPI && (
            <button
              onClick={() => { setPhase('wizard'); setActiveQ(0); setVoiceOpen(true); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px',
                borderRadius: 7, border: '1px solid rgba(155,109,255,.3)',
                background: 'rgba(155,109,255,.07)', color: 'var(--npi-purple)',
                fontSize: 11, fontFamily: T.mono, cursor: 'pointer',
              }}
            >🎙 Re-dictate</button>
          )}
          <button
            onClick={() => { setPhase('wizard'); setActiveQ(0); }}
            style={{
              marginLeft: hasSpeechAPI ? 0 : 'auto', padding: '4px 12px', borderRadius: 7,
              border: '1px solid var(--npi-bd)', background: 'var(--npi-up)',
              color: 'var(--npi-txt3)', fontFamily: T.font, fontSize: 12, cursor: 'pointer',
            }}
          >← Edit answers</button>
        </div>

        <textarea
          ref={textRef}
          value={hpiText}
          onChange={e => setHpiText(e.target.value)}
          rows={7}
          onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); onHpiChange?.(hpiText); } }}
          style={{
            width: '100%', padding: '16px 18px', boxSizing: 'border-box',
            background: 'rgba(255,255,255,.05)', border: '1px solid var(--npi-bhi)',
            borderRadius: 10, color: 'var(--npi-txt)', fontFamily: T.font,
            fontSize: 14, lineHeight: 1.7, resize: 'vertical', outline: 'none',
            transition: 'border-color .15s',
          }}
          onFocus={e => { e.target.style.borderColor = 'var(--npi-teal)'; }}
          onBlur={e => { e.target.style.borderColor = 'var(--npi-bhi)'; }}
        />

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={() => onHpiChange?.(hpiText)}
            style={{
              padding: '9px 22px', borderRadius: 8, border: 'none',
              background: 'var(--npi-teal)', color: 'var(--npi-bg)',
              fontFamily: T.font, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              transition: 'filter .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.filter = 'none'; }}
          >✓ Save HPI to Chart</button>
          <button
            onClick={generateHPI}
            style={{
              padding: '9px 16px', borderRadius: 8,
              border: '1px solid var(--npi-bd)', background: 'var(--npi-up)',
              color: 'var(--npi-txt3)', fontFamily: T.font, fontSize: 12, cursor: 'pointer',
            }}
          >🔄 Regenerate</button>
          <span style={{ fontFamily: T.mono, fontSize: 10, color: T.txt4 }}>⌘↵ to save</span>
        </div>

        {/* Documented answers */}
        <div>
          <div style={{
            fontSize: 9, color: T.txt4, fontFamily: T.mono,
            letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10,
          }}>Documented Answers ({answeredCount}/{questions.length})</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 7 }}>
            {questions.filter(q => {
              const a = answers[q.id];
              return a && (!Array.isArray(a) || a.length > 0);
            }).map(q => (
              <div key={q.id} style={{
                background: 'rgba(255,255,255,.03)', borderRadius: 7, padding: '8px 12px',
                border: '1px solid var(--npi-bd)', borderLeft: '3px solid rgba(0,229,192,.4)',
              }}>
                <div style={{ fontSize: 9, color: T.txt4, fontFamily: T.mono, textTransform: 'uppercase', marginBottom: 3 }}>
                  {q.label}
                </div>
                <div style={{ fontSize: 12, color: 'var(--npi-txt2)', fontFamily: T.font, fontWeight: 500 }}>
                  {Array.isArray(answers[q.id]) ? answers[q.id].join(', ') : answers[q.id]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── RENDER: wizard ────────────────────────────────────────────────────────
  if (!currentQ) return null;
  const { type, options = [], id: qId, label: qLabel } = currentQ;
  const curAns = answers[qId];
  const progressPct = (activeQ / Math.max(questions.length, 1)) * 100;

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* ── LEFT: active question ── */}
      <div
        ref={wizardRef}
        tabIndex={0}
        onKeyDown={handleWizardKey}
        style={{
          flex: 1, padding: '24px 32px', outline: 'none',
          overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 0,
        }}
      >
        {/* Progress header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: voiceOpen ? 12 : 26 }}>
          <span style={{
            background: 'rgba(0,229,192,.1)', color: 'var(--npi-teal)',
            borderRadius: 20, padding: '3px 12px', fontSize: 11, fontFamily: T.mono, flexShrink: 0,
          }}>{cc}</span>
          <span style={{ fontSize: 11, color: T.txt4, fontFamily: T.mono, flexShrink: 0 }}>
            Q {activeQ + 1}/{questions.length}
          </span>
          <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,.06)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${progressPct}%`,
              background: 'var(--npi-teal)', borderRadius: 3, transition: 'width .35s ease',
            }} />
          </div>
          {aiError && (
            <span style={{ fontSize: 10, color: T.txt4, fontFamily: T.mono }}>
              using template questions
            </span>
          )}
          <button
            onClick={() => setVoiceOpen(v => !v)}
            title={hasSpeechAPI ? 'Dictate HPI by voice' : 'Voice requires Chrome or Edge'}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px',
              borderRadius: 7, flexShrink: 0,
              border: `1px solid ${voiceOpen ? 'rgba(155,109,255,.45)' : 'var(--npi-bd)'}`,
              background: voiceOpen ? 'rgba(155,109,255,.1)' : 'rgba(255,255,255,.04)',
              color: voiceOpen ? 'var(--npi-purple)' : T.txt4,
              fontSize: 11, fontFamily: T.mono, cursor: 'pointer', transition: 'all .15s',
            }}
          >
            🎙 {voiceOpen ? 'Close' : 'Dictate'}
          </button>
          {answeredCount >= 3 && (
            <button
              onClick={generateHPI}
              style={{
                padding: '4px 12px', borderRadius: 7, flexShrink: 0,
                border: '1px solid rgba(0,229,192,.3)', background: 'rgba(0,229,192,.08)',
                color: 'var(--npi-teal)', fontSize: 11, fontFamily: T.mono, cursor: 'pointer',
              }}
            >⌘G  Generate HPI</button>
          )}
        </div>

        {/* ── Voice panel (inline, collapsible) ── */}
        {voiceOpen && (
          <div style={{
            marginBottom: 20, borderRadius: 10,
            border: '1px solid rgba(155,109,255,.3)', background: 'rgba(155,109,255,.05)',
            padding: 16,
          }}>
            <div style={{ fontSize: 10, color: 'var(--npi-purple)', fontFamily: T.mono, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 12 }}>
              🎙 Voice dictation — speak the full HPI narrative
            </div>

            {!hasSpeechAPI ? (
              <div style={{ fontSize: 12, color: T.txt4, fontFamily: T.font, fontStyle: 'italic' }}>
                Speech recognition requires Chrome or Edge. Firefox is not supported.
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <button
                    onClick={voicePhase === 'recording' ? stopRecording : startRecording}
                    disabled={voicePhase === 'processing'}
                    style={{
                      width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: voicePhase === 'processing' ? 'not-allowed' : 'pointer',
                      background: voicePhase === 'recording' ? '#ff6b6b' : voicePhase === 'processing' ? 'rgba(155,109,255,.3)' : 'rgba(155,109,255,.2)',
                      color: '#fff', fontSize: 18, flexShrink: 0, transition: 'all .15s',
                      boxShadow: voicePhase === 'recording' ? '0 0 0 6px rgba(255,107,107,.2)' : 'none',
                    }}
                    title={voicePhase === 'recording' ? 'Stop recording' : 'Start recording'}
                  >
                    {voicePhase === 'recording' ? '⏹' : voicePhase === 'processing' ? '⏳' : '🎙'}
                  </button>
                  <div style={{ flex: 1, fontSize: 11, color: T.txt4, fontFamily: T.mono }}>
                    {voicePhase === 'recording' && <span style={{ color: '#ff6b6b' }}>● Recording — speak clearly, then press ⏹ to stop</span>}
                    {voicePhase === 'idle' && !transcript && 'Press 🎙 to start — describe the presentation in your own words'}
                    {voicePhase === 'idle' && transcript && 'Recording complete. Review the transcript below, then structure it.'}
                    {voicePhase === 'processing' && <span style={{ color: 'var(--npi-purple)' }}>Structuring transcript into HPI…</span>}
                  </div>
                </div>

                <textarea
                  value={transcript}
                  onChange={e => setTranscript(e.target.value)}
                  placeholder="Transcript will appear here as you speak… or paste/type directly."
                  rows={3}
                  style={{
                    width: '100%', boxSizing: 'border-box', background: 'rgba(8,22,40,.7)',
                    border: '1px solid rgba(155,109,255,.25)', borderRadius: 8,
                    padding: '10px 12px', color: T.txt, fontFamily: T.font,
                    fontSize: 13, lineHeight: 1.6, resize: 'vertical', outline: 'none',
                    marginBottom: 10,
                  }}
                />

                {voiceError && (
                  <div style={{ fontSize: 11, color: 'var(--npi-coral)', fontFamily: T.mono, marginBottom: 8 }}>
                    ⚠ {voiceError}
                  </div>
                )}

                {transcript.trim() && voicePhase !== 'recording' && (
                  <button
                    onClick={structureTranscript}
                    disabled={voicePhase === 'processing'}
                    style={{
                      padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: 'rgba(155,109,255,.2)', color: 'var(--npi-purple)',
                      fontFamily: T.font, fontSize: 12, fontWeight: 700, transition: 'all .15s',
                    }}
                  >
                    ✦ Structure as HPI
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* Question text */}
        <div style={{
          fontFamily: T.serif, fontSize: 22, fontWeight: 600, color: 'var(--npi-txt)',
          marginBottom: 8, lineHeight: 1.3,
        }}>{qLabel}</div>

        {/* Type hint */}
        <div style={{ fontSize: 11, color: T.txt4, fontFamily: T.mono, marginBottom: 22 }}>
          {type === 'scale'    && 'Press 1–9 or 0 for 10'}
          {type === 'single'   && 'Number key · ↑↓ to move · Enter/Space to select'}
          {type === 'multi'    && 'Numbers toggle · Space toggles focused · Enter to advance'}
          {type === 'duration' && 'Press the letter key shown on each option'}
          {type === 'text'     && 'Type answer — Enter to advance'}
        </div>

        {/* ── Scale ── */}
        {type === 'scale' && (
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {[1,2,3,4,5,6,7,8,9,10].map(n => {
              const sel = curAns === String(n);
              const col = n <= 3 ? 'var(--npi-teal)' : n <= 6 ? 'var(--npi-orange)' : 'var(--npi-coral)';
              return (
                <button
                  key={n}
                  onClick={() => { setAnswer(qId, String(n)); setTimeout(() => advanceQ(1), 300); }}
                  style={{
                    width: 52, height: 52, borderRadius: 10, cursor: 'pointer',
                    border: `2px solid ${sel ? col : col + '40'}`,
                    background: sel ? col + '22' : 'rgba(255,255,255,.04)',
                    color: col, fontFamily: T.mono, fontSize: 18, fontWeight: 700,
                    transition: 'all .1s',
                  }}
                >{n}</button>
              );
            })}
          </div>
        )}

        {/* ── Duration ── */}
        {type === 'duration' && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {DURATION_OPTS.map(d => {
              const sel = curAns === d.value;
              return (
                <button
                  key={d.key}
                  onClick={() => { setAnswer(qId, d.value); setTimeout(() => advanceQ(1), 300); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
                    borderRadius: 9, cursor: 'pointer', transition: 'all .12s',
                    border: `1px solid ${sel ? 'var(--npi-teal)' : 'var(--npi-bd)'}`,
                    background: sel ? 'rgba(0,229,192,.1)' : 'rgba(255,255,255,.04)',
                    color: sel ? 'var(--npi-teal)' : 'var(--npi-txt2)',
                    fontFamily: T.font, fontSize: 13,
                  }}
                >
                  <span style={{
                    fontFamily: T.mono, fontSize: 11, fontWeight: 700,
                    background: 'rgba(59,158,255,.12)', color: 'var(--npi-blue)',
                    borderRadius: 5, padding: '2px 7px', minWidth: 18, textAlign: 'center',
                  }}>{d.key}</span>
                  {d.label}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Single / Multi options ── */}
        {(type === 'single' || type === 'multi') && options.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {options.map((opt, i) => {
              const isSel = type === 'single' ? curAns === opt : (curAns || []).includes(opt);
              const isFoc = i === optFocus;
              return (
                <button
                  key={opt}
                  onClick={() => {
                    if (type === 'single') { setAnswer(qId, opt); setTimeout(() => advanceQ(1), 300); }
                    else toggleMulti(qId, opt);
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9, padding: '11px 14px',
                    borderRadius: 9, cursor: 'pointer', transition: 'all .12s', textAlign: 'left',
                    border: `1px solid ${isSel ? 'var(--npi-teal)' : isFoc ? 'var(--npi-bhi)' : 'var(--npi-bd)'}`,
                    background: isSel ? 'rgba(0,229,192,.1)' : isFoc ? 'rgba(59,158,255,.07)' : 'rgba(255,255,255,.04)',
                    color: isSel ? 'var(--npi-teal)' : 'var(--npi-txt2)',
                    fontFamily: T.font, fontSize: 13,
                  }}
                >
                  <span style={{
                    fontFamily: T.mono, fontSize: 10, flexShrink: 0, minWidth: 18,
                    textAlign: 'center', padding: '1px 5px', borderRadius: 4,
                    background: isSel ? 'rgba(0,229,192,.2)' : 'rgba(255,255,255,.06)',
                    color: isSel ? 'var(--npi-teal)' : 'var(--npi-txt4)',
                  }}>{i + 1 <= 9 ? i + 1 : '·'}</span>
                  <span style={{ flex: 1 }}>{opt}</span>
                  {isSel && <span style={{ color: 'var(--npi-teal)', fontSize: 13 }}>✓</span>}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Text ── */}
        {type === 'text' && (
          <input
            autoFocus
            value={curAns || ''}
            onChange={e => setAnswer(qId, e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); advanceQ(1); } }}
            placeholder="Type your answer and press Enter..."
            style={{
              width: '100%', maxWidth: 500, padding: '12px 16px', boxSizing: 'border-box',
              background: 'rgba(255,255,255,.06)', border: '1px solid var(--npi-bhi)',
              borderRadius: 9, color: 'var(--npi-txt)', fontFamily: T.font,
              fontSize: 14, outline: 'none',
            }}
          />
        )}

        {/* Keyboard legend */}
        <div style={{ marginTop: 'auto', paddingTop: 28, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {activeQ > 0 && <KbHint keys="⌫ Backspace" desc="Previous" />}
          <KbHint keys="Tab" desc="Skip" />
          {type === 'multi' && <KbHint keys="Enter" desc="Advance" />}
          <KbHint keys="⌘G" desc="Generate HPI now" />
          <KbHint keys="Esc" desc="Skip to preview" />
        </div>
      </div>

      {/* ── RIGHT: answered summary sidebar ── */}
      <div style={{
        width: 210, flexShrink: 0,
        borderLeft: '1px solid var(--npi-bd)',
        padding: '18px 12px', overflow: 'auto',
        background: 'rgba(8,22,40,.5)',
      }}>
        <div style={{
          fontSize: 9, color: T.txt4, fontFamily: T.mono,
          letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10,
        }}>Progress</div>

        {questions.map((q, i) => {
          const ans = answers[q.id];
          const isDone = ans && (!Array.isArray(ans) || ans.length > 0);
          const isActive = i === activeQ;
          return (
            <button
              key={q.id}
              onClick={() => { setActiveQ(i); setOptFocus(0); setTimeout(() => wizardRef.current?.focus(), 50); }}
              style={{
                display: 'flex', flexDirection: 'column', width: '100%',
                padding: '8px 10px', marginBottom: 4, borderRadius: 7, cursor: 'pointer',
                border: `1px solid ${isActive ? 'var(--npi-blue)' : isDone ? 'rgba(0,229,192,.18)' : 'var(--npi-bd)'}`,
                background: isActive ? 'rgba(59,158,255,.08)' : isDone ? 'rgba(0,229,192,.04)' : 'transparent',
                textAlign: 'left', transition: 'all .12s',
              }}
            >
              <div style={{
                fontSize: 10, fontFamily: T.mono, marginBottom: isDone ? 3 : 0,
                color: isActive ? 'var(--npi-blue)' : isDone ? 'var(--npi-teal)' : T.txt4,
              }}>
                {isDone ? '✓' : i === activeQ ? '▸' : String(i + 1).padStart(2, '0')} {q.label.slice(0, 26)}{q.label.length > 26 ? '…' : ''}
              </div>
              {isDone && (
                <div style={{ fontSize: 11, color: 'var(--npi-txt2)', fontFamily: T.font, fontWeight: 500, lineHeight: 1.3 }}>
                  {Array.isArray(ans)
                    ? ans.slice(0, 2).join(', ') + (ans.length > 2 ? ' +' + (ans.length - 2) : '')
                    : String(ans).slice(0, 30)}
                </div>
              )}
            </button>
          );
        })}

        {answeredCount >= 3 && (
          <button
            onClick={generateHPI}
            style={{
              width: '100%', marginTop: 12, padding: '9px 0', borderRadius: 8,
              border: '1px solid rgba(0,229,192,.3)', background: 'rgba(0,229,192,.07)',
              color: 'var(--npi-teal)', fontFamily: T.font, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', transition: 'background .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,229,192,.13)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,229,192,.07)'; }}
          >Generate HPI →<br /><span style={{ fontFamily: T.mono, fontSize: 9, opacity: .6 }}>⌘G</span></button>
        )}
      </div>
    </div>
  );
}