import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { MessageCircle, X, Send, Loader2, Bot, User, Sparkles, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

const SUGGESTED_QUESTIONS = [
  "What are the first-line treatments for hypertension?",
  "Explain Type 2 diabetes in simple terms",
  "What are common drug interactions with warfarin?",
  "Summarize HEART score guidelines",
];

export default function MedicalChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I'm your **Medical AI Assistant**. I can answer questions about medical conditions, treatments, medications, and clinical guidelines. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;

    setInput("");
    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const history = newMessages
        .slice(-8) // keep last 8 for context
        .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
        .join("\n");

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a knowledgeable Medical AI Assistant for Notrya AI, a clinical platform used by healthcare professionals. 
        
Your role is to:
- Answer questions about medical conditions, treatments, medications, and clinical guidelines
- Explain complex medical terms in simple, clear language
- Reference evidence-based guidelines (ACC/AHA, WHO, UpToDate-style summaries)
- Suggest relevant articles or guidelines when appropriate
- Keep responses concise but thorough — use bullet points and headers for clarity
- Always add a brief disclaimer that information is for educational purposes and clinical judgment is essential

Conversation history:
${history}

Current question: ${userText}

Respond in a structured, helpful way. Use markdown formatting (bold, bullets, headers) for readability.`,
        add_context_from_internet: true,
      });

      setMessages((prev) => [...prev, { role: "assistant", content: result }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I'm sorry, I encountered an error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-28 right-5 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl flex items-center justify-center hover:scale-105 transition-transform"
            title="Medical AI Chat"
          >
            <MessageCircle className="w-6 h-6 text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed bottom-5 right-5 z-50 w-[370px] max-w-[calc(100vw-16px)] flex flex-col rounded-2xl shadow-2xl border border-slate-200 bg-white overflow-hidden"
            style={{ height: "540px" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Medical AI Assistant</p>
                  <p className="text-xs text-blue-100">Evidence-based answers</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-slate-50">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                  )}
                  <div
                    className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-br-sm"
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
                    <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-2 justify-start">
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Suggested Questions (only when 1 message = just the greeting) */}
            {messages.length === 1 && (
              <div className="px-3 pb-2 flex flex-wrap gap-1.5 bg-slate-50 flex-shrink-0">
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    className="text-xs px-2.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors text-left"
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
                placeholder="Ask about medications, conditions..."
                className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 bg-slate-50"
                disabled={loading}
              />
              <Button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-3 h-9 flex-shrink-0"
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