import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export default function NotryaFloatingAI() {
  const [aiOpen, setAiOpen] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiMsgs, setAiMsgs] = useState([{ role: 'sys', text: 'Notrya AI ready.' }]);
  const [aiLoading, setAiLoading] = useState(false);
  const msgsRef = useRef(null);

  useEffect(() => {
    if (msgsRef.current) {
      msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
    }
  }, [aiMsgs, aiLoading]);

  const sendAI = async (question = null) => {
    const q = question || aiInput.trim();
    if (!q || aiLoading) return;

    setAiInput('');
    setAiMsgs(prev => [...prev, { role: 'user', text: q }]);
    setAiLoading(true);

    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Notrya AI, an ED clinical assistant. Be concise and practical. ${q}`,
      });
      const text = typeof res === 'string' ? res : JSON.stringify(res);
      setAiMsgs(prev => [...prev, { role: 'bot', text }]);
    } catch {
      setAiMsgs(prev => [...prev, { role: 'sys', text: '⚠ Error connecting to AI.' }]);
    }
    setAiLoading(false);
  };

  return (
    <>
      {!aiOpen && <div className="ai-fab-ring" />}
      <button
        className={`ai-fab${aiOpen ? ' open' : ''}`}
        onClick={() => setAiOpen(!aiOpen)}
        title="Notrya AI"
      >
        {aiOpen ? '✕' : '🤖'}
      </button>

      {aiOpen && (
        <div className="ai-float">
          <div className="ai-float-hdr">
            <div className="ai-float-hdr-top">
              <div className="ai-float-avatar">🤖</div>
              <div>
                <div className="ai-float-name">Notrya AI</div>
                <div className="ai-float-status">
                  <div className="ai-dot" /> Live · Powered by AI
                </div>
              </div>
              <div className="ai-float-close" onClick={() => setAiOpen(false)}>
                ✕
              </div>
            </div>
            <div className="ai-float-chips">
              {[
                ['📋 Summarize', 'Summarize this patient chart in 3 bullet points.'],
                ['💊 Drug Check', 'Check for drug interactions in the current med list.'],
                ['🔍 Workup', 'What additional workup should be considered?'],
                ['🚪 Dispo', 'Suggest disposition and next steps.'],
                ['📚 Guidelines', 'What guidelines apply to this presentation?'],
              ].map(([lbl, q]) => (
                <button
                  key={lbl}
                  className="ai-chip"
                  onClick={() => sendAI(q)}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>
          <div className="ai-float-msgs" ref={msgsRef}>
            {aiMsgs.map((m, i) => (
              <div key={i} className={`ai-bubble ${m.role}`}>
                {m.text}
              </div>
            ))}
            {aiLoading && (
              <div className="ai-typing">
                <span />
                <span />
                <span />
              </div>
            )}
          </div>
          <div className="ai-float-input-row">
            <textarea
              className="ai-float-input"
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
              className="ai-float-send"
              onClick={() => sendAI()}
              disabled={aiLoading || !aiInput.trim()}
            >
              ↑
            </button>
          </div>
          <div className="ai-float-footer">
            <span className="ai-model-badge">Powered by Notrya AI</span>
          </div>
        </div>
      )}
    </>
  );
}