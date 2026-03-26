import { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const CSS = `
.notrya-ai-fab {
  position: fixed;
  bottom: 72px;
  right: 22px;
  z-index: 500;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #00e5c0, #00b4d8);
  box-shadow: 0 4px 20px rgba(0, 229, 192, 0.35);
  transition: all 0.3s;
  font-size: 22px;
  color: #050f1e;
  font-weight: 700;
}
.notrya-ai-fab:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 28px rgba(0, 229, 192, 0.5);
}
.notrya-ai-fab.open {
  background: linear-gradient(135deg, #ff6b6b, #e05555);
}
.notrya-ai-overlay {
  position: fixed;
  bottom: 136px;
  right: 22px;
  width: 340px;
  max-height: 480px;
  z-index: 499;
  background: #081628;
  border: 1px solid #1a3555;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  transition: all 0.3s;
  opacity: 0;
  transform: translateY(16px) scale(0.96);
  pointer-events: none;
}
.notrya-ai-overlay.open {
  opacity: 1;
  transform: translateY(0) scale(1);
  pointer-events: auto;
}
.notrya-ai-header {
  padding: 10px 12px;
  border-bottom: 1px solid #1a3555;
  display: flex;
  align-items: center;
  gap: 8px;
  background: #081628;
}
.notrya-ai-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #00e5c0;
}
.notrya-ai-title {
  font-family: 'Playfair Display', serif;
  font-size: 14px;
  font-weight: 600;
  color: #e8f0fe;
}
.notrya-ai-badge {
  margin-left: auto;
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  background: #0e2544;
  border: 1px solid #1a3555;
  border-radius: 20px;
  padding: 2px 7px;
  color: #4a6a8a;
}
.notrya-ai-close {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
  border: 1px solid #1a3555;
  background: #0e2544;
  color: #4a6a8a;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.15s;
}
.notrya-ai-close:hover {
  color: #e8f0fe;
  border-color: #2a4f7a;
}
.notrya-ai-msgs {
  flex: 1;
  overflow-y: auto;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 180px;
  max-height: 320px;
}
.notrya-ai-msg {
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.55;
}
.notrya-ai-msg.sys {
  background: #0e2544;
  color: #4a6a8a;
  border: 1px solid #1a3555;
  align-self: center;
  font-size: 11px;
  text-align: center;
}
.notrya-ai-msg.user {
  background: rgba(59, 158, 255, 0.12);
  border: 1px solid rgba(59, 158, 255, 0.25);
  color: #e8f0fe;
  align-self: flex-end;
  border-radius: 8px 8px 2px 8px;
  max-width: 90%;
}
.notrya-ai-msg.bot {
  background: rgba(0, 229, 192, 0.07);
  border: 1px solid rgba(0, 229, 192, 0.18);
  color: #e8f0fe;
  align-self: flex-start;
  border-radius: 8px 8px 8px 2px;
  max-width: 90%;
}
.notrya-ai-loader {
  display: flex;
  gap: 4px;
  padding: 8px;
  align-self: flex-start;
}
.notrya-ai-loader span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #00e5c0;
  animation: notrya-bounce 1.2s ease-in-out infinite;
}
.notrya-ai-loader span:nth-child(2) { animation-delay: 0.2s; }
.notrya-ai-loader span:nth-child(3) { animation-delay: 0.4s; }
@keyframes notrya-bounce {
  0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
  40% { transform: translateY(-6px); opacity: 1; }
}
.notrya-ai-input-wrap {
  padding: 8px 10px;
  border-top: 1px solid #1a3555;
  display: flex;
  gap: 5px;
}
.notrya-ai-input {
  flex: 1;
  background: #0e2544;
  border: 1px solid #1a3555;
  border-radius: 8px;
  padding: 7px 10px;
  color: #e8f0fe;
  font-size: 12px;
  outline: none;
  resize: none;
  font-family: 'DM Sans', sans-serif;
}
.notrya-ai-input:focus {
  border-color: #00e5c0;
}
.notrya-ai-send {
  width: 34px;
  height: 34px;
  background: #00e5c0;
  color: #050f1e;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.notrya-ai-send:hover {
  filter: brightness(1.15);
}
.notrya-ai-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
`;

export default function NotryaAIChat() {
  const [aiOpen, setAiOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState([{ role: 'sys', text: '✦ Notrya AI ready. Ask anything.' }]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const aiMsgsRef = useRef(null);

  useEffect(() => {
    if (aiMsgsRef.current) aiMsgsRef.current.scrollTop = aiMsgsRef.current.scrollHeight;
  }, [aiMessages, aiLoading]);

  const sendAI = async () => {
    const q = aiInput.trim();
    if (!q || aiLoading) return;
    setAiInput('');
    setAiMessages(prev => [...prev, { role: 'user', text: q }]);
    setAiLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Notrya AI, a concise clinical assistant. Be helpful and practical. ${q}`,
      });
      setAiMessages(prev => [...prev, { role: 'bot', text: typeof res === 'string' ? res : JSON.stringify(res) }]);
    } catch {
      setAiMessages(prev => [...prev, { role: 'sys', text: '⚠ Error connecting to AI.' }]);
    }
    setAiLoading(false);
  };

  return (
    <>
      <style>{CSS}</style>
      <div className={`notrya-ai-overlay${aiOpen ? ' open' : ''}`}>
        <div className="notrya-ai-header">
          <div className="notrya-ai-dot" />
          <div className="notrya-ai-title">Notrya AI</div>
          <div className="notrya-ai-badge">gpt</div>
          <button
            className="notrya-ai-close"
            onClick={() => setAiOpen(false)}
          >
            ─
          </button>
        </div>
        <div className="notrya-ai-msgs" ref={aiMsgsRef}>
          {aiMessages.map((m, i) => (
            <div key={i} className={`notrya-ai-msg ${m.role}`}>
              {m.text}
            </div>
          ))}
          {aiLoading && (
            <div className="notrya-ai-loader">
              <span />
              <span />
              <span />
            </div>
          )}
        </div>
        <div className="notrya-ai-input-wrap">
          <textarea
            className="notrya-ai-input"
            rows={1}
            placeholder="Ask anything…"
            value={aiInput}
            onChange={e => setAiInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendAI();
              }
            }}
          />
          <button
            className="notrya-ai-send"
            onClick={sendAI}
            disabled={aiLoading || !aiInput.trim()}
          >
            ↑
          </button>
        </div>
      </div>
      <button
        className={`notrya-ai-fab${aiOpen ? ' open' : ''}`}
        onClick={() => setAiOpen(o => !o)}
      >
        {aiOpen ? '✕' : '✦'}
      </button>
    </>
  );
}