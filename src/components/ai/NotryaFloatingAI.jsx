import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { usePatientData } from "@/lib/PatientDataContext";
import { toast } from "sonner";

const T = {
  bg: "#050f1e", panel: "#081628", card: "#0b1e36", up: "#0e2544",
  border: "#1a3555", borderHi: "#2a4f7a",
  blue: "#3b9eff", teal: "#00e5c0", gold: "#f5c842",
  coral: "#ff6b6b", orange: "#ff9f43", purple: "#9b6dff",
  txt: "#e8f0fe", txt2: "#8aaccc", txt3: "#4a6a8a", txt4: "#2e4a6a",
};

const AI_CSS = `
@keyframes aipulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(0, 229, 192, 0.4); }
  50% { box-shadow: 0 0 0 5px rgba(0, 229, 192, 0); }
}

@keyframes fabring {
  0% { box-shadow: 0 0 0 0 rgba(0, 229, 192, 0.5); }
  70% { box-shadow: 0 0 0 14px rgba(0, 229, 192, 0); }
  100% { box-shadow: 0 0 0 0 rgba(0, 229, 192, 0); }
}

@keyframes typing {
  0%, 80%, 100% { transform: translateY(0); opacity: 0.35; }
  40% { transform: translateY(-5px); opacity: 1; }
}

@keyframes chatopen {
  0% { opacity: 0; transform: scale(0.85) translateY(20px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

@keyframes badgepop {
  0% { transform: scale(0); }
  100% { transform: scale(1); }
}

.ai-fab {
  position: fixed;
  bottom: 66px;
  right: 22px;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${T.teal} 0%, #00b8a9 100%);
  border: none;
  cursor: pointer;
  z-index: 400;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(0, 229, 192, 0.35), 0 2px 8px rgba(0, 0, 0, 0.4);
  transition: transform 0.2s, box-shadow 0.2s;
  font-size: 20px;
}

.ai-fab:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 28px rgba(0, 229, 192, 0.5), 0 4px 12px rgba(0, 0, 0, 0.4);
}

.ai-fab.open {
  transform: scale(0.94);
}

.ai-fab-ring {
  position: fixed;
  bottom: 66px;
  right: 22px;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  z-index: 399;
  pointer-events: none;
  animation: fabring 2.4s ease-out infinite;
}

.ai-fab-badge {
  position: absolute;
  top: -3px;
  right: -3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: ${T.coral};
  border: 2px solid ${T.bg};
  font-size: 9px;
  font-weight: 700;
  color: #fff;
  font-family: 'JetBrains Mono', monospace;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: badgepop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.ai-float {
  position: fixed;
  bottom: 80px;
  right: 18px;
  width: 340px;
  height: 520px;
  background: ${T.panel};
  border: 1px solid ${T.borderHi};
  border-radius: 16px;
  z-index: 400;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.6), 0 4px 16px rgba(0, 229, 192, 0.08);
  transform-origin: bottom right;
  animation: chatopen 0.22s cubic-bezier(0.34, 1.3, 0.64, 1);
}

.ai-float-hdr {
  flex-shrink: 0;
  padding: 0 14px;
  background: linear-gradient(135deg, rgba(0, 229, 192, 0.12) 0%, rgba(59, 158, 255, 0.06) 100%);
  border-bottom: 1px solid ${T.border};
  display: flex;
  flex-direction: column;
  gap: 0;
}

.ai-float-hdr-top {
  height: 44px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.ai-float-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(0, 229, 192, 0.15);
  border: 1px solid rgba(0, 229, 192, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}

.ai-float-name {
  font-size: 13px;
  font-weight: 600;
  color: ${T.txt};
}

.ai-float-status {
  font-size: 10px;
  color: ${T.teal};
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: 'JetBrains Mono', monospace;
}

.ai-float-close {
  margin-left: auto;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${T.up};
  border: 1px solid ${T.border};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${T.txt3};
  font-size: 13px;
  transition: all 0.15s;
  font-family: inherit;
  font-weight: bold;
}

.ai-float-close:hover {
  border-color: ${T.borderHi};
  color: ${T.txt};
}

.ai-float-chips {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  padding: 10px 14px;
}

.ai-chip {
  padding: 3px 9px;
  border-radius: 20px;
  font-size: 10px;
  cursor: pointer;
  background: ${T.up};
  border: 1px solid ${T.border};
  color: ${T.txt2};
  transition: all 0.15s;
  font-family: 'DM Sans', sans-serif;
  white-space: nowrap;
  font-weight: 500;
}

.ai-chip:hover {
  border-color: ${T.teal};
  color: ${T.teal};
  background: rgba(0, 229, 192, 0.06);
}

.ai-float-msgs {
  flex: 1;
  overflow-y: auto;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ai-float-msgs::-webkit-scrollbar {
  width: 3px;
}

.ai-float-msgs::-webkit-scrollbar-thumb {
  background: ${T.border};
  border-radius: 2px;
}

.ai-bubble {
  max-width: 88%;
  padding: 9px 11px;
  border-radius: 12px;
  font-size: 12px;
  line-height: 1.55;
  animation: chatopen 0.18s ease-out;
}

.ai-bubble.sys {
  background: ${T.up};
  color: ${T.txt3};
  font-style: italic;
  border: 1px solid ${T.border};
  border-radius: 8px;
  max-width: 100%;
  font-size: 11px;
}

.ai-bubble.user {
  background: rgba(59, 158, 255, 0.15);
  border: 1px solid rgba(59, 158, 255, 0.25);
  color: ${T.txt};
  align-self: flex-end;
  border-bottom-right-radius: 3px;
}

.ai-bubble.bot {
  background: ${T.card};
  border: 1px solid ${T.border};
  color: ${T.txt};
  align-self: flex-start;
  border-bottom-left-radius: 3px;
}

.ai-bubble.bot strong {
  color: ${T.teal};
  font-weight: 600;
}

.ai-typing {
  display: flex;
  gap: 4px;
  padding: 9px 11px;
  background: ${T.card};
  border: 1px solid ${T.border};
  border-radius: 12px;
  border-bottom-left-radius: 3px;
  align-self: flex-start;
  align-items: center;
}

.ai-typing span {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: ${T.teal};
  animation: typing 1.2s ease-in-out infinite;
}

.ai-typing span:nth-child(2) {
  animation-delay: 0.2s;
}

.ai-typing span:nth-child(3) {
  animation-delay: 0.4s;
}

.ai-float-input-row {
  flex-shrink: 0;
  padding: 10px 12px;
  border-top: 1px solid ${T.border};
  display: flex;
  gap: 6px;
  align-items: flex-end;
  background: ${T.panel};
}

.ai-float-input {
  flex: 1;
  background: ${T.up};
  border: 1px solid ${T.border};
  border-radius: 10px;
  padding: 8px 10px;
  color: ${T.txt};
  font-size: 12px;
  outline: none;
  resize: none;
  font-family: 'DM Sans', sans-serif;
  line-height: 1.4;
  max-height: 80px;
  transition: border-color 0.15s;
}

.ai-float-input:focus {
  border-color: rgba(0, 229, 192, 0.5);
}

.ai-float-input::placeholder {
  color: ${T.txt4};
}

.ai-float-send {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${T.teal};
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  color: ${T.bg};
  font-weight: 700;
  transition: all 0.15s;
  font-family: inherit;
}

.ai-float-send:hover {
  filter: brightness(1.15);
  transform: scale(1.05);
}

.ai-float-send:disabled {
  background: ${T.up};
  border: 1px solid ${T.border};
  color: ${T.txt4};
  cursor: not-allowed;
  transform: none;
}

.ai-float-footer {
  padding: 5px 14px;
  border-top: 1px solid rgba(26, 53, 85, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex-shrink: 0;
}

.ai-model-badge {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  background: ${T.up};
  border: 1px solid ${T.border};
  border-radius: 20px;
  padding: 2px 8px;
  color: ${T.txt4};
}
`;

export default function NotryaFloatingAI() {
  const location = useLocation();
  const { patientData } = usePatientData();
  const [aiOpen, setAiOpen] = useState(false);
  const [aiMsgs, setAiMsgs] = useState([
    { role: "sys", text: "👋 Hi! I'm Notrya AI. Ask me about what you're viewing or anything clinical." }
  ]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const [conversationHistory, setConversationHistory] = useState([]);
  const msgsRef = useRef(null);

  // Get current page name from location
  const getCurrentPage = () => {
    const path = location.pathname.replace(/^\/$/, "Home").replace(/^\//, "");
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  // Build context from patient data
  const getContextString = () => {
    const patientName = [patientData.firstName, patientData.lastName].filter(Boolean).join(" ") || "New Patient";
    const currentPage = getCurrentPage();
    const vitals = [];
    if (patientData.bp) vitals.push(`BP ${patientData.bp}`);
    if (patientData.hr) vitals.push(`HR ${patientData.hr}`);
    if (patientData.temp) vitals.push(`T ${patientData.temp}°F`);
    if (patientData.spo2) vitals.push(`SpO₂ ${patientData.spo2}%`);
    const vitalStr = vitals.length > 0 ? ` Vitals: ${vitals.join(" · ")}.` : "";
    const ccStr = patientData.cc_text ? ` CC: ${patientData.cc_text}.` : "";
    return `Current page: ${currentPage}. Patient: ${patientName}.${vitalStr}${ccStr}`;
  };

  useEffect(() => {
    if (msgsRef.current) {
      msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
    }
  }, [aiMsgs, aiLoading]);

  const sendAI = async (question = null) => {
    const msg = (question || aiInput).trim();
    if (!msg || aiLoading) return;

    setAiInput("");
    setUnread(0);
    setAiMsgs(prev => [...prev, { role: "user", text: msg }]);
    setAiLoading(true);

    // Add to conversation history
    const newHistory = [
      ...conversationHistory,
      { role: "user", content: msg }
    ];

    try {
      const context = getContextString();
      const systemPrompt = `You are Notrya AI, a helpful clinical assistant embedded in an emergency medicine documentation app. You provide concise, actionable advice. Context: ${context}. Respond in 2–4 sentences. Never fabricate data. If information is missing, ask for clarification.`;

      const fullPrompt = newHistory.map(m =>
        m.role === "user" ? `User: ${m.content}` : `Assistant: ${m.content}`
      ).join("\n");

      const botMsg = await base44.integrations.Core.InvokeLLM({
        prompt: `${systemPrompt}\n\n${fullPrompt}`,
      });

      const replyText = typeof botMsg === "string" ? botMsg : JSON.stringify(botMsg);
      setAiMsgs(prev => [...prev, { role: "bot", text: replyText }]);
      setConversationHistory([
        ...newHistory,
        { role: "assistant", content: replyText }
      ]);
      if (!aiOpen) setUnread(n => n + 1);
    } catch (e) {
      setAiMsgs(prev => [...prev, { role: "sys", text: "⚠ Error — please try again." }]);
    } finally {
      setAiLoading(false);
    }
  };

  const openAI = () => {
    setAiOpen(true);
    setUnread(0);
  };

  return (
    <>
      <style>{AI_CSS}</style>

      {!aiOpen && <div className="ai-fab-ring" />}
      <button
        className={`ai-fab${aiOpen ? " open" : ""}`}
        onClick={() => (aiOpen ? setAiOpen(false) : openAI())}
        title="Notrya AI"
      >
        🤖
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
                  <div style={{width: 6, height: 6, borderRadius: "50%", background: T.teal}} /> Live
                </div>
              </div>
              <button className="ai-float-close" onClick={() => setAiOpen(false)}>✕</button>
            </div>
            <div className="ai-float-chips">
              {[
                ["📋 Summarize", "Summarize the current view in 3 bullet points."],
                ["❓ Help", "Help me understand what I'm looking at."],
                ["💡 Suggest", "Suggest next steps or actions."],
                ["🔍 Explain", "Explain a clinical concept."],
              ].map(([lbl, q]) => (
                <button key={lbl} className="ai-chip" onClick={() => sendAI(q)}>
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          <div className="ai-float-msgs" ref={msgsRef}>
            {aiMsgs.map((m, i) => (
              <div key={i} className={`ai-bubble ${m.role}`}>{m.text}</div>
            ))}
            {aiLoading && (
              <div className="ai-typing"><span /><span /><span /></div>
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
                if (e.key === "Enter" && !e.shiftKey) {
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
            <span className="ai-model-badge">Notrya AI</span>
          </div>
        </div>
      )}
    </>
  );
}