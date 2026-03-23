import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const CSS = `
@keyframes fab-ring {
  0%,100% { box-shadow: 0 4px 20px rgba(0,229,192,0.35), 0 0 0 0 rgba(0,229,192,0.25); }
  50%      { box-shadow: 0 4px 20px rgba(0,229,192,0.35), 0 0 0 10px rgba(0,229,192,0); }
}
@keyframes ai-pulse {
  0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(0,229,192,0.4)}
  50%{opacity:.8;box-shadow:0 0 0 5px rgba(0,229,192,0)}
}
@keyframes bounce {
  0%,80%,100%{transform:translateY(0);opacity:0.4}
  40%{transform:translateY(-6px);opacity:1}
}
@keyframes msg-in {
  from{opacity:0;transform:translateY(6px)}
  to{opacity:1;transform:translateY(0)}
}

.ai-fab {
  position: fixed;
  bottom: 72px; right: 22px;
  z-index: 500;
  width: 52px; height: 52px;
  border-radius: 50%; border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #00e5c0, #00b4d8);
  box-shadow: 0 4px 20px rgba(0,229,192,0.35), 0 0 0 0 rgba(0,229,192,0.3);
  transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1);
  animation: fab-ring 3s ease-in-out infinite;
}
.ai-fab:hover { transform: scale(1.1); box-shadow: 0 6px 28px rgba(0,229,192,0.5); }
.ai-fab:active { transform: scale(0.95); }
.ai-fab.open {
  transform: rotate(45deg) scale(1);
  background: linear-gradient(135deg, #ff6b6b, #e05555);
  box-shadow: 0 4px 20px rgba(255,107,107,0.35);
  animation: none;
}
.ai-fab.open:hover { transform: rotate(45deg) scale(1.1); }

.ai-fab-icon {
  font-size: 22px; line-height: 1;
  transition: transform 0.3s ease;
  color: #050f1e; font-weight: 700;
}
.ai-fab-badge {
  position: absolute; top: -2px; right: -2px;
  width: 18px; height: 18px; border-radius: 50%;
  background: #ff6b6b; color: white;
  font-size: 10px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid #050f1e;
  opacity: 0; transform: scale(0);
  transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1);
  font-family: 'JetBrains Mono', monospace;
  pointer-events: none;
}
.ai-fab-badge.show { opacity: 1; transform: scale(1); }

.ai-overlay {
  position: fixed;
  bottom: 136px; right: 22px;
  width: 380px;
  max-height: calc(100vh - 200px);
  z-index: 499;
  background: #081628;
  border: 1px solid #1a3555;
  border-radius: 16px;
  display: flex; flex-direction: column; overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 1px rgba(0,229,192,0.2);
  opacity: 0;
  transform: translateY(16px) scale(0.96);
  pointer-events: none;
  transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1);
}
.ai-overlay.open {
  opacity: 1; transform: translateY(0) scale(1); pointer-events: auto;
}

.ai-ov-header {
  padding: 14px 16px 10px;
  border-bottom: 1px solid #1a3555; flex-shrink: 0;
  background: linear-gradient(180deg, rgba(0,229,192,0.04) 0%, transparent 100%);
}
.ai-ov-header-top { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.ai-ov-dot {
  width: 8px; height: 8px; border-radius: 50%; background: #00e5c0;
  animation: ai-pulse 2s ease-in-out infinite; flex-shrink: 0;
}
.ai-ov-title {
  font-family: 'Playfair Display', serif;
  font-size: 15px; font-weight: 600; color: #e8f0fe;
}
.ai-ov-model {
  margin-left: auto;
  font-family: 'JetBrains Mono', monospace; font-size: 9px;
  background: #0e2544; border: 1px solid #1a3555; border-radius: 20px;
  padding: 2px 8px; color: #4a6a8a;
}
.ai-ov-minimize {
  margin-left: 6px; width: 26px; height: 26px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 6px; border: 1px solid #1a3555;
  background: #0e2544; color: #4a6a8a; font-size: 13px;
  cursor: pointer; transition: all 0.15s; font-family: inherit;
}
.ai-ov-minimize:hover { border-color: #2a4f7a; color: #e8f0fe; }

.ai-ov-quick { display: flex; flex-wrap: wrap; gap: 4px; }
.ai-ov-qbtn {
  padding: 4px 10px; border-radius: 20px; font-size: 10px; cursor: pointer;
  transition: all 0.15s; background: #0e2544; border: 1px solid #1a3555;
  color: #8aaccc; font-family: 'DM Sans', sans-serif;
}
.ai-ov-qbtn:hover { border-color: #00e5c0; color: #00e5c0; background: rgba(0,229,192,0.06); }

.ai-ov-msgs {
  flex: 1; overflow-y: auto; padding: 12px 14px;
  display: flex; flex-direction: column; gap: 8px;
  min-height: 220px; max-height: 400px;
}
.ai-ov-msgs::-webkit-scrollbar { width: 4px; }
.ai-ov-msgs::-webkit-scrollbar-thumb { background: #1a3555; border-radius: 2px; }

.ai-ov-msg {
  padding: 10px 12px; border-radius: 10px; font-size: 12px; line-height: 1.6;
  max-width: 92%; animation: msg-in 0.3s ease;
  font-family: 'DM Sans', sans-serif;
}
.ai-ov-msg.sys {
  background: #0e2544; color: #4a6a8a; font-style: italic;
  border: 1px solid #1a3555; align-self: center;
  max-width: 100%; text-align: center; font-size: 11px;
}
.ai-ov-msg.user {
  background: rgba(59,158,255,0.12); border: 1px solid rgba(59,158,255,0.25);
  color: #e8f0fe; align-self: flex-end; border-radius: 10px 10px 2px 10px;
}
.ai-ov-msg.bot {
  background: rgba(0,229,192,0.07); border: 1px solid rgba(0,229,192,0.18);
  color: #e8f0fe; align-self: flex-start; border-radius: 10px 10px 10px 2px;
}
.ai-ov-msg.bot strong { color: #00e5c0; }

.ai-ov-loader { display: flex; gap: 5px; padding: 10px 12px; align-items: center; align-self: flex-start; }
.ai-ov-loader span { width: 6px; height: 6px; border-radius: 50%; background: #00e5c0; animation: bounce 1.2s ease-in-out infinite; }
.ai-ov-loader span:nth-child(2) { animation-delay: 0.2s; }
.ai-ov-loader span:nth-child(3) { animation-delay: 0.4s; }

.ai-ov-input-wrap {
  padding: 10px 14px 14px; border-top: 1px solid #1a3555; flex-shrink: 0;
  display: flex; gap: 6px; align-items: flex-end;
  background: linear-gradient(0deg, rgba(0,229,192,0.02) 0%, transparent 100%);
}
.ai-ov-input {
  flex: 1; background: #0e2544; border: 1px solid #1a3555; border-radius: 10px;
  padding: 8px 12px; color: #e8f0fe; font-size: 12px; outline: none; resize: none;
  min-height: 38px; max-height: 100px; font-family: 'DM Sans', sans-serif;
  line-height: 1.5; transition: border-color 0.15s;
}
.ai-ov-input:focus { border-color: #00e5c0; }
.ai-ov-input::placeholder { color: #2e4a6a; }
.ai-ov-send {
  width: 38px; height: 38px;
  background: #00e5c0; color: #050f1e; border: none; border-radius: 10px;
  font-size: 16px; font-weight: 700; cursor: pointer; flex-shrink: 0;
  transition: all 0.15s; display: flex; align-items: center; justify-content: center;
}
.ai-ov-send:hover { filter: brightness(1.15); transform: scale(1.05); }
.ai-ov-send:active { transform: scale(0.95); }
`;

const QUICK_ACTIONS = [
  ['📋 Summarise', 'Summarise what I have entered so far.'],
  ['🔍 Check', 'What am I missing? Check my entries for completeness.'],
  ['📝 Draft Note', 'Generate a draft note from the data entered.'],
  ['🧠 DDx', 'Suggest differential diagnoses based on current data.'],
];

export default function MedicalChatbot() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([{ role: 'sys', text: 'Notrya AI ready. Select a quick action or ask a clinical question.' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const msgsRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [msgs, loading]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && open) setOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  const appendMsg = (role, text) => {
    setMsgs(p => [...p, { role, text }]);
  };

  const sendAI = async (q) => {
    const question = q || input.trim();
    if (!question || loading) return;
    setInput('');
    if (!open) setOpen(true);
    appendMsg('user', question);
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Notrya AI, a clinical assistant in an emergency medicine documentation platform. Be concise and clinically precise. Use **bold** for key terms.\n\nQuestion: ${question}`,
      });
      const reply = typeof res === 'string' ? res : JSON.stringify(res);
      appendMsg('bot', reply);
      if (!open) setUnread(u => u + 1);
    } catch {
      appendMsg('sys', '⚠ Connection error.');
    }
    setLoading(false);
  };

  const autoGrow = (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
  };

  return (
    <>
      <style>{CSS}</style>

      {/* Chat Overlay */}
      <div className={`ai-overlay${open ? ' open' : ''}`}>
        <div className="ai-ov-header">
          <div className="ai-ov-header-top">
            <div className="ai-ov-dot" />
            <span className="ai-ov-title">Notrya AI</span>
            <span className="ai-ov-model">claude-sonnet-4</span>
            <button className="ai-ov-minimize" onClick={() => setOpen(false)} title="Minimize">─</button>
          </div>
          <div className="ai-ov-quick">
            {QUICK_ACTIONS.map(([label, q]) => (
              <button key={label} className="ai-ov-qbtn" onClick={() => sendAI(q)}>{label}</button>
            ))}
          </div>
        </div>

        <div className="ai-ov-msgs" ref={msgsRef}>
          {msgs.map((m, i) => (
            <div
              key={i}
              className={`ai-ov-msg ${m.role}`}
              dangerouslySetInnerHTML={{ __html: m.text.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
            />
          ))}
          {loading && (
            <div className="ai-ov-loader">
              <span /><span /><span />
            </div>
          )}
        </div>

        <div className="ai-ov-input-wrap">
          <textarea
            ref={inputRef}
            className="ai-ov-input"
            rows={1}
            placeholder="Ask anything…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onInput={autoGrow}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAI(); } }}
          />
          <button className="ai-ov-send" onClick={() => sendAI()}>↑</button>
        </div>
      </div>

      {/* Floating Action Button */}
      <button className={`ai-fab${open ? ' open' : ''}`} onClick={() => setOpen(o => !o)} title="Notrya AI Assistant">
        <span className="ai-fab-icon">{open ? '✕' : '✦'}</span>
        <span className={`ai-fab-badge${unread > 0 ? ' show' : ''}`}>{unread > 9 ? '9+' : unread}</span>
      </button>
    </>
  );
}