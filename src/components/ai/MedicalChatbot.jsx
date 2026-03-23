import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const S = {
  bg: '#050f1e', panel: '#081628', card: '#0b1e36', up: '#0e2544',
  border: '#1a3555', teal: '#00e5c0', blue: '#3b9eff',
  purple: '#9b6dff', coral: '#ff6b6b',
  txt: '#e8f0fe', txt2: '#8aaccc', txt3: '#4a6a8a', txt4: '#2e4a6a',
};

const CSS = `
@keyframes ai-pulse { 0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(0,229,192,0.4)} 50%{opacity:.8;box-shadow:0 0 0 5px rgba(0,229,192,0)} }
@keyframes notrya-bounce { 0%,80%,100%{transform:translateY(0);opacity:.4} 40%{transform:translateY(-5px);opacity:1} }
.notrya-dot { animation: ai-pulse 2s ease-in-out infinite; }
.nb1{animation:notrya-bounce 1.2s ease-in-out infinite}
.nb2{animation:notrya-bounce 1.2s 0.2s ease-in-out infinite}
.nb3{animation:notrya-bounce 1.2s 0.4s ease-in-out infinite}
.notrya-toggle-btn {
  position:fixed; bottom:24px; right:24px; z-index:500;
  width:48px; height:48px; border-radius:50%;
  background:#081628; border:1px solid #1a3555;
  display:flex; align-items:center; justify-content:center;
  cursor:pointer; font-size:18px; transition:all .2s;
  box-shadow:0 4px 20px rgba(0,0,0,0.5);
}
.notrya-toggle-btn:hover { border-color:#00e5c0; box-shadow:0 4px 24px rgba(0,229,192,0.15); }
.notrya-toggle-btn.open { background: rgba(0,229,192,0.1); border-color:rgba(0,229,192,0.4); }
.notrya-panel {
  position:fixed; bottom:84px; right:24px; z-index:500;
  width:320px; height:520px;
  background:#081628; border:1px solid #1a3555; border-radius:14px;
  display:flex; flex-direction:column; overflow:hidden;
  box-shadow:0 8px 40px rgba(0,0,0,0.6);
  animation:panel-in .2s ease;
}
@keyframes panel-in { from{opacity:0;transform:translateY(12px) scale(0.97)} to{opacity:1;transform:none} }
.notrya-msgs::-webkit-scrollbar { width:4px; }
.notrya-msgs::-webkit-scrollbar-thumb { background:#1a3555; border-radius:2px; }
.notrya-input:focus { border-color:#00e5c0 !important; outline:none; }
`;

const QUICK = [
  ['🚩 Red Flags', 'What red-flag symptoms should not be missed in an emergency department presentation?'],
  ['💊 Drug Check', 'What are the most important drug interactions to watch for in the ED?'],
  ['📋 Differentials', 'Help me think through a differential diagnosis for chest pain in a middle-aged patient.'],
  ['📝 SOAP Note', 'Help me structure a SOAP note for an acute presentation.'],
];

export default function MedicalChatbot() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([{ role: 'sys', text: 'Notrya AI ready. Ask a clinical question or use a quick action above.' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const msgsRef = useRef(null);

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [msgs, loading]);

  const send = async (q) => {
    const question = q || input.trim();
    if (!question || loading) return;
    setInput('');
    setMsgs(p => [...p, { role: 'user', text: question }]);
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Notrya AI, a clinical assistant for emergency medicine providers. Be concise and clinically precise. Use **bold** for key terms.\n\nQuestion: ${question}`,
      });
      setMsgs(p => [...p, { role: 'bot', text: typeof res === 'string' ? res : JSON.stringify(res) }]);
    } catch {
      setMsgs(p => [...p, { role: 'sys', text: '⚠ Connection error. Please try again.' }]);
    }
    setLoading(false);
  };

  return (
    <>
      <style>{CSS}</style>

      {/* Toggle button */}
      <button className={`notrya-toggle-btn${open ? ' open' : ''}`} onClick={() => setOpen(o => !o)} title="Notrya AI">
        {open ? <span style={{ fontSize: 16, color: S.teal }}>✕</span> : <span>✦</span>}
      </button>

      {/* Panel */}
      {open && (
        <div className="notrya-panel">
          {/* Header */}
          <div style={{ padding: '10px 14px', borderBottom: `1px solid ${S.border}`, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
              <div className="notrya-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: S.teal, flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: S.txt, fontFamily: "'DM Sans', sans-serif" }}>Notrya AI</span>
              <span style={{ marginLeft: 'auto', fontFamily: "'JetBrains Mono', monospace", fontSize: 9, background: S.up, border: `1px solid ${S.border}`, borderRadius: 20, padding: '2px 7px', color: S.txt3 }}>claude-sonnet-4</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {QUICK.map(([label, q]) => (
                <button key={label} onClick={() => send(q)} style={{ padding: '2px 9px', borderRadius: 20, fontSize: 10, cursor: 'pointer', background: S.up, border: `1px solid ${S.border}`, color: S.txt2, fontFamily: "'DM Sans', sans-serif", transition: 'all .15s' }}>{label}</button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div ref={msgsRef} className="notrya-msgs" style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 7 }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ padding: '9px 11px', borderRadius: 8, fontSize: 12, lineHeight: 1.55, background: m.role === 'sys' ? S.up : m.role === 'user' ? 'rgba(59,158,255,0.12)' : 'rgba(0,229,192,0.07)', border: `1px solid ${m.role === 'sys' ? S.border : m.role === 'user' ? 'rgba(59,158,255,0.25)' : 'rgba(0,229,192,0.18)'}`, color: m.role === 'sys' ? S.txt3 : S.txt, fontStyle: m.role === 'sys' ? 'italic' : 'normal', fontFamily: "'DM Sans', sans-serif" }}
                dangerouslySetInnerHTML={{ __html: m.text.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: 5, padding: '10px 12px', alignItems: 'center' }}>
                {['nb1','nb2','nb3'].map(c => <div key={c} className={c} style={{ width: 6, height: 6, borderRadius: '50%', background: S.teal }} />)}
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{ padding: '10px 12px', borderTop: `1px solid ${S.border}`, flexShrink: 0, display: 'flex', gap: 6 }}>
            <input
              className="notrya-input"
              style={{ flex: 1, background: S.up, border: `1px solid ${S.border}`, borderRadius: 7, padding: '7px 10px', color: S.txt, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Ask a clinical question…"
            />
            <button onClick={() => send()} style={{ background: S.teal, color: S.bg, border: 'none', borderRadius: 7, padding: '7px 12px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>↑</button>
          </div>
        </div>
      )}
    </>
  );
}