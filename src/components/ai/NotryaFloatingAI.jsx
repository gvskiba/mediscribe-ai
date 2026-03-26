import { useState, useEffect, useRef } from "react";

export default function FloatingAI({ patientContext }) {
  const [aiOpen,    setAiOpen]    = useState(false);
  const [aiMsgs,    setAiMsgs]    = useState([{ role: "sys", text: "👋 Ask me anything about this patient." }]);
  const [aiInput,   setAiInput]   = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [unread,    setUnread]    = useState(1);
  const msgsRef = useRef(null);

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [aiMsgs]);

  const openAI = () => { setAiOpen(true); setUnread(0); };

  const sendAI = async q => {
    const question = (q || aiInput).trim();
    if (!question || aiLoading) return;
    setAiInput(""); setUnread(0);
    setAiMsgs(prev => [...prev, { role: "user", text: question }]);
    setAiLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: patientContext || "You are Notrya AI, an ED clinical assistant. Be concise and direct.",
          messages: [{ role: "user", content: question }],
        }),
      });
      const data = await res.json();
      const text = data.content?.find(b => b.type === "text")?.text || "No response.";
      setAiMsgs(prev => [...prev, { role: "bot", text }]);
      if (!aiOpen) setUnread(n => n + 1);
    } catch {
      setAiMsgs(prev => [...prev, { role: "sys", text: "⚠ AI error." }]);
    }
    setAiLoading(false);
  };

  return (
    <>
      {!aiOpen && <div className="ai-fab-ring" />}
      <button className={`ai-fab${aiOpen ? " open" : ""}`} onClick={() => aiOpen ? setAiOpen(false) : openAI()}>
        {aiOpen ? "✕" : "🤖"}
        {!aiOpen && unread > 0 && <span className="ai-fab-badge">{unread}</span>}
      </button>
      {aiOpen && (
        <div className="ai-float">
          <div className="ai-float-hdr">
            <div className="ai-float-hdr-top">
              <div className="ai-float-avatar">🤖</div>
              <div>
                <div className="ai-float-name">Notrya AI</div>
                <div className="ai-float-status">
                  <div className="ai-dot" /> Live · Powered by Claude
                </div>
              </div>
              <div className="ai-float-close" onClick={() => setAiOpen(false)}>
                ✕
              </div>
            </div>
            <div className="ai-float-chips">
              {[
                ['📋 Summarize', 'Summarize this patient case in 3 key points.'],
                ['💊 Drug Check', 'Check for drug interactions.'],
                ['🔍 Workup', 'What additional workup is needed?'],
                ['🚪 Dispo', 'Disposition recommendation?'],
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
              placeholder="Ask about this patient…"
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
            <span className="ai-model-badge">Claude Sonnet 4</span>
          </div>
        </div>
      )}
    </>
  );
}