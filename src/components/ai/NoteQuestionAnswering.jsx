import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Send, HelpCircle, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function NoteQuestionAnswering({ note, onAddToNote }) {
  const [question, setQuestion] = useState("");
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);

  const buildNoteContext = () => {
    return [
      note.patient_name && `Patient: ${note.patient_name}`,
      note.patient_age && `Age: ${note.patient_age}`,
      note.patient_gender && `Gender: ${note.patient_gender}`,
      note.chief_complaint && `Chief Complaint: ${note.chief_complaint}`,
      note.history_of_present_illness && `HPI: ${note.history_of_present_illness}`,
      note.medical_history && `Medical History: ${note.medical_history}`,
      note.review_of_systems && `ROS: ${note.review_of_systems}`,
      note.physical_exam && `Physical Exam: ${note.physical_exam}`,
      note.vital_signs && Object.keys(note.vital_signs).length > 0 && `Vitals: ${JSON.stringify(note.vital_signs)}`,
      note.assessment && `Assessment: ${note.assessment}`,
      note.plan && `Plan: ${note.plan}`,
      note.diagnoses?.length && `Diagnoses: ${note.diagnoses.join(", ")}`,
      note.medications?.length && `Medications: ${note.medications.join(", ")}`,
      note.allergies?.length && `Allergies: ${note.allergies.join(", ")}`,
      note.date_of_visit && `Visit Date: ${note.date_of_visit}`,
      note.time_of_visit && `Visit Time: ${note.time_of_visit}`,
    ].filter(Boolean).join("\n");
  };

  const askQuestion = async () => {
    if (!question.trim()) return;

    const context = buildNoteContext();
    if (!context.trim()) {
      toast.error("No clinical data available to query");
      return;
    }

    setLoading(true);
    const newConversation = {
      question: question.trim(),
      answer: null,
      loading: true
    };
    setConversations(prev => [...prev, newConversation]);
    setQuestion("");

    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a clinical AI assistant. Answer the user's question ONLY based on the clinical note data provided. Be precise, concise, and accurate. If the information is not in the note, say "This information is not available in the current note."

CLINICAL NOTE DATA:
${context}

USER QUESTION: ${question.trim()}

Provide a clear, direct answer.`,
        response_json_schema: {
          type: "object",
          properties: {
            answer: { type: "string" },
            confidence: { type: "string", enum: ["high", "moderate", "low"] },
            data_source: { type: "array", items: { type: "string" } }
          }
        }
      });

      setConversations(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          question: updated[updated.length - 1].question,
          answer: res.answer,
          confidence: res.confidence,
          dataSources: res.data_source,
          loading: false
        };
        return updated;
      });
    } catch (error) {
      toast.error("Failed to answer question");
      setConversations(prev => prev.filter((_, i) => i !== prev.length - 1));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      askQuestion();
    }
  };

  const confidenceColor = (conf) => {
    if (conf === "high") return "bg-green-100 text-green-700";
    if (conf === "moderate") return "bg-yellow-100 text-yellow-700";
    return "bg-orange-100 text-orange-700";
  };

  return (
    <div className="space-y-4 flex flex-col h-full">
      {/* Help text */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-xs text-indigo-800 flex gap-2">
        <HelpCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>Ask natural language questions about the patient record. E.g., "When was the last lab test?", "What allergies does the patient have?"</span>
      </div>

      {/* Conversation history */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {conversations.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">Ask your first question about the note</p>
          </div>
        ) : (
          conversations.map((conv, idx) => (
            <div key={idx} className="space-y-2">
              {/* User question */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-indigo-900">Q: {conv.question}</p>
              </div>

              {/* AI answer */}
              {conv.loading ? (
                <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                  <span className="text-xs text-slate-500">Analyzing note...</span>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs text-slate-700 leading-relaxed flex-1">{conv.answer}</p>
                    {conv.confidence && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded whitespace-nowrap flex-shrink-0 ${confidenceColor(conv.confidence)}`}>
                        {conv.confidence}
                      </span>
                    )}
                  </div>
                  {conv.dataSources?.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-100">
                      <p className="text-xs font-semibold text-slate-600 mb-1">Sources:</p>
                      <div className="flex flex-wrap gap-1">
                        {conv.dataSources.map((source, i) => (
                          <span key={i} className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded">
                            {source}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Input area */}
      <div className="space-y-2 border-t border-slate-200 pt-3">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask a question about the patient record..."
          className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 placeholder:text-slate-400 resize-none"
          rows="3"
          disabled={loading}
        />
        <Button
          onClick={askQuestion}
          disabled={loading || !question.trim()}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Answering...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" /> Ask Question
            </>
          )}
        </Button>
      </div>
    </div>
  );
}