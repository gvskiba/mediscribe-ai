import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { MessageCircle, XCircle, Send, Loader2, Bot, User, Sparkles, Stethoscope, Pill, BookOpen, FlaskConical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

const MODES = [
  { id: "general", label: "General", icon: Sparkles, color: "blue" },
  { id: "differential", label: "Differential Dx", icon: Stethoscope, color: "purple" },
  { id: "interactions", label: "Drug Interactions", icon: Pill, color: "rose" },
  { id: "knowledge", label: "My Notes", icon: BookOpen, color: "emerald" },
];

const SUGGESTED_BY_MODE = {
  general: [
    "What are first-line treatments for hypertension?",
    "Explain Type 2 diabetes management",
    "Summarize HEART score guidelines",
  ],
  differential: [
    "Patient has chest pain, dyspnea, and diaphoresis",
    "Fever, neck stiffness, and photophobia in a 25yo",
    "Sudden onset severe headache, worst of life",
  ],
  interactions: [
    "Warfarin + Aspirin interaction risks",
    "Check: Metformin, Lisinopril, Atorvastatin",
    "SSRIs and MAOIs — why dangerous?",
  ],
  knowledge: [
    "Summarize my recent clinical notes",
    "What diagnoses have I seen most recently?",
    "Show medications from my recent notes",
  ],
};

function buildPrompt(mode, userText, history, knowledgeBase) {
  const base = `You are a knowledgeable Medical AI Assistant for Notrya AI, a clinical platform used by healthcare professionals. Use markdown formatting (bold, bullets, headers) for readability. Always end with a brief disclaimer that clinical judgment is essential.\n\nConversation history:\n${history}\n\nCurrent question: ${userText}`;

  if (mode === "differential") {
    return `${base}

TASK: Provide a structured **differential diagnosis** based on the symptoms/presentation described.
Format your response as:
1. **Most Likely Diagnosis** — with brief reasoning
2. **Top Differentials** (list 4-6) — each with key supporting features and distinguishing tests
3. **Red Flags to Rule Out** — dangerous conditions not to miss
4. **Suggested Workup** — labs, imaging, or additional history needed`;
  }

  if (mode === "interactions") {
    return `${base}

TASK: Provide a thorough **drug interaction analysis**.
Format your response as:
- **Severity** (Contraindicated / Major / Moderate / Minor) for each pair
- **Mechanism** of interaction
- **Clinical Effects** — what can go wrong
- **Management** — dose adjustments, monitoring, alternatives
- **Special Populations** at higher risk (elderly, renal/hepatic impairment, pregnancy)
Reference FDA, Lexicomp, or Micromedex-style guidance.`;
  }

  if (mode === "knowledge") {
    const kb = knowledgeBase?.length > 0
      ? `\n\nINTERNAL KNOWLEDGE BASE (recent notes & guidelines from this app):\n${knowledgeBase}`
      : "\n\n(No internal knowledge base data available — answering from general medical knowledge.)";
    return `${base}${kb}

TASK: Answer using the internal knowledge base above when relevant. Cite which note or guideline you're referencing. If not found internally, answer from general medical knowledge and indicate so.`;
  }

  // general
  return `${base}

Your role:
- Answer questions about medical conditions, treatments, medications, and clinical guidelines
- Reference evidence-based guidelines (ACC/AHA, WHO, UpToDate-style)
- Keep responses concise but thorough`;
}

export default function MedicalChatbot() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("general");
  const [messagesByMode, setMessagesByMode] = useState({
    general: [{ role: "assistant", content: "Hi! I'm your **Medical AI Assistant**. Ask me anything about clinical guidelines, conditions, or treatments." }],
    differential: [{ role: "assistant", content: "Describe a patient presentation (symptoms, age, vitals) and I'll generate a structured **differential diagnosis** with workup suggestions." }],
    interactions: [{ role: "assistant", content: "List medications (e.g. 'Warfarin + Aspirin + Lisinopril') and I'll provide a comprehensive **drug interaction analysis** including severity, mechanism, and management." }],
    knowledge: [{ role: "assistant", content: "I'll search your **internal notes and saved guidelines** to answer questions or provide summaries. Loading your knowledge base..." }],
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [knowledgeBase, setKnowledgeBase] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const messages = messagesByMode[mode];

  const setMessages = (updater) => {
    setMessagesByMode((prev) => ({
      ...prev,
      [mode]: typeof updater === "function" ? updater(prev[mode]) : updater,
    }));
  };

  // Load knowledge base when switching to knowledge mode
  useEffect(() => {
    if (mode === "knowledge" && knowledgeBase === null) {
      loadKnowledgeBase();
    }
  }, [mode]);

  const loadKnowledgeBase = async () => {
    try {
      const [notes, guidelines] = await Promise.all([
        base44.entities.ClinicalNote.list("-updated_date", 10),
        base44.entities.GuidelineQuery.list("-updated_date", 10),
      ]);

      const noteSummaries = notes
        .filter((n) => n.patient_name || n.chief_complaint || n.summary)
        .map((n) => `NOTE [${n.patient_name || "Unknown"}, ${n.date_of_visit || ""}]: CC: ${n.chief_complaint || ""} | Summary: ${n.summary || ""} | Diagnoses: ${(n.diagnoses || []).join(", ")} | Medications: ${(n.medications || []).join(", ")}`)
        .join("\n");

      const guidelineSummaries = guidelines
        .filter((g) => g.question && g.answer)
        .map((g) => `GUIDELINE [${g.category || "general"}]: Q: ${g.question} | A: ${g.answer?.slice(0, 300)}...`)
        .join("\n");

      const kb = [noteSummaries, guidelineSummaries].filter(Boolean).join("\n\n");
      setKnowledgeBase(kb || "");

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: kb ? `✅ Loaded **${notes.length} recent notes** and **${guidelines.length} saved guidelines** from your knowledge base. Ask me anything!` : "No notes or guidelines found in your knowledge base yet. I'll answer from general medical knowledge." },
      ]);
    } catch {
      setKnowledgeBase("");
    }
  };

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messagesByMode, mode]);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open, mode]);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;

    setInput("");
    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const history = newMessages
        .slice(-4)
        .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content?.slice(0, 400)}`)
        .join("\n");

      const prompt = buildPrompt(mode, userText, history, knowledgeBase);

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false,
      });

      setMessages((prev) => [...prev, { role: "assistant", content: result }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const modeConfig = MODES.find((m) => m.id === mode);
  const colorMap = {
    blue: { bg: "from-blue-600 to-indigo-600", pill: "bg-blue-100 text-blue-700 border-blue-200", active: "bg-blue-600 text-white" },
    purple: { bg: "from-purple-600 to-indigo-600", pill: "bg-purple-100 text-purple-700 border-purple-200", active: "bg-purple-600 text-white" },
    rose: { bg: "from-rose-500 to-pink-600", pill: "bg-rose-100 text-rose-700 border-rose-200", active: "bg-rose-500 text-white" },
    emerald: { bg: "from-emerald-500 to-teal-600", pill: "bg-emerald-100 text-emerald-700 border-emerald-200", active: "bg-emerald-500 text-white" },
  };
  const colors = colorMap[modeConfig.color];

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setOpen(true)}
            className={`fixed bottom-28 right-5 z-50 w-14 h-14 rounded-full bg-gradient-to-br ${colors.bg} shadow-xl flex items-center justify-center hover:scale-105 transition-transform`}
            title="Medical AI Chat"
          >
            <MessageCircle className="w-6 h-6 text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed bottom-5 right-5 z-50 w-[390px] max-w-[calc(100vw-16px)] flex flex-col rounded-2xl shadow-2xl border border-slate-200 bg-white overflow-hidden"
            style={{ height: "580px" }}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-4 py-3 bg-gradient-to-r ${colors.bg} text-white flex-shrink-0`}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  {React.createElement(modeConfig.icon, { className: "w-4 h-4 text-white" })}
                </div>
                <div>
                  <p className="font-semibold text-sm">Medical AI Assistant</p>
                  <p className="text-xs text-white/70">{modeConfig.label} mode</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Tabs */}
            <div className="flex gap-1 px-3 py-2 border-b border-slate-100 bg-white flex-shrink-0 overflow-x-auto scrollbar-hide">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
                    mode === m.id
                      ? colorMap[m.color].active + " border-transparent"
                      : "text-slate-500 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {React.createElement(m.icon, { className: "w-3 h-3" })}
                  {m.label}
                </button>
              ))}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-slate-50">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${colors.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-slate-700 text-white rounded-br-sm"
                        : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <ReactMarkdown
                        className="prose prose-sm prose-slate max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                        components={{
                          p: ({ children }) => <p className="mb-1 leading-relaxed">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc ml-4 mb-1 space-y-0.5">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal ml-4 mb-1 space-y-0.5">{children}</ol>,
                          li: ({ children }) => <li className="text-xs">{children}</li>,
                          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                          h2: ({ children }) => <p className="font-bold mt-2 mb-0.5 text-slate-900">{children}</p>,
                          h3: ({ children }) => <p className="font-semibold mt-1.5 mb-0.5">{children}</p>,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      msg.content
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-2 justify-start">
                  <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Suggested prompts */}
            {messages.length <= 2 && (
              <div className="px-3 pb-2 flex flex-wrap gap-1.5 bg-slate-50 flex-shrink-0">
                {SUGGESTED_BY_MODE[mode].map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    className={`text-xs px-2.5 py-1.5 rounded-full border ${colorMap[modeConfig.color].pill} hover:opacity-80 transition-colors text-left`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="flex items-center gap-2 px-3 py-3 border-t border-slate-200 bg-white flex-shrink-0">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) sendMessage(); }}
                placeholder={
                  mode === "differential" ? "Describe symptoms & presentation..." :
                  mode === "interactions" ? "List medications to check..." :
                  mode === "knowledge" ? "Ask about your notes or guidelines..." :
                  "Ask about medications, conditions..."
                }
                className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 bg-slate-50"
                disabled={loading}
              />
              <Button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                size="sm"
                className={`bg-gradient-to-r ${colors.bg} text-white rounded-xl px-3 h-9 flex-shrink-0 border-0`}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}