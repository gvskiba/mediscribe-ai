import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Search, Send, RotateCcw } from "lucide-react";

const COLORS = {
  background: "#0a0d12",
  surface: "#111520",
  border: "#1e2535",
  borderActive: "#2a3347",
  text: "#e8eaf0",
  muted: "#5a6380",
  dim: "#3a4260",
  accent: "#00d4a0",
  accentDim: "#003d2e",
  warning: "#f59e0b",
  error: "#ef4444"
};

const QUICK_PROMPTS = [
  {
    id: "hypertension",
    label: "🫀 Hypertension treatment thresholds",
    query: "What are the 2023 ACC/AHA hypertension guidelines for treatment thresholds and first-line medications?"
  },
  {
    id: "diabetes_t2",
    label: "💉 Diabetes management ADA 2024",
    query: "Summarize the ADA 2024 Standards of Care for Type 2 Diabetes including HbA1c targets and drug selection."
  },
  {
    id: "sepsis",
    label: "🦠 Sepsis 1-hour bundle protocol",
    query: "What does the Surviving Sepsis Campaign 2021 recommend for the initial 1-hour bundle?"
  },
  {
    id: "copd",
    label: "🫁 COPD GOLD guidelines",
    query: "What are the GOLD guidelines for COPD staging and recommended inhaler therapy by stage?"
  },
  {
    id: "stroke_tpa",
    label: "🧠 Stroke thrombolysis criteria",
    query: "Summarize stroke thrombolysis eligibility criteria and contraindications per AHA/ASA guidelines."
  },
  {
    id: "afib_anticoag",
    label: "❤️ A-Fib anticoagulation guidelines",
    query: "What are the current guidelines for anticoagulation in atrial fibrillation including CHA₂DS₂-VASc scoring?"
  }
];

const SUGGESTED_TOPICS = [
  {
    category: "Cardiology",
    topics: ["Hypertension management", "Atrial fibrillation anticoagulation", "Heart failure therapy"]
  },
  {
    category: "Endocrinology",
    topics: ["Type 2 diabetes pharmacotherapy", "Thyroid nodule evaluation", "Osteoporosis screening"]
  },
  {
    category: "Pulmonology",
    topics: ["Asthma step therapy", "COPD exacerbation management", "Pneumonia management"]
  },
  {
    category: "Infectious Disease",
    topics: ["Sepsis and septic shock", "Antibiotic stewardship", "UTI management"]
  }
];

export default function ClinicalGuidelinesPanel() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  const handleSearch = async (searchQuery = query) => {
    if (!searchQuery.trim()) return;

    const userMessage = {
      role: "user",
      content: searchQuery
    };
    setMessages([...messages, userMessage]);
    setQuery("");
    setShowWelcome(false);
    setLoading(true);

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: searchQuery,
        response_json_schema: {
          type: "object",
          properties: {
            response: { type: "string" }
          }
        }
      });

      const aiMessage = {
        role: "assistant",
        content: response.response || "Unable to generate response"
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error:", error);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Error retrieving guidelines. Please try again."
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([]);
    setQuery("");
    setShowWelcome(true);
  };

  return (
    <div style={{
      background: COLORS.background,
      borderRadius: 16,
      border: `1px solid ${COLORS.border}`,
      padding: 28,
      maxWidth: 860,
      margin: "0 auto"
    }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{
          fontSize: 24,
          fontWeight: 700,
          color: COLORS.text,
          marginBottom: 8
        }}>
          ⚕️ Clinical Guidelines AI
        </h2>
        <p style={{
          fontSize: 13,
          color: COLORS.muted,
          lineHeight: 1.5
        }}>
          Evidence-based guidelines, answered by AI. Ask about clinical protocols, treatment algorithms, diagnostic criteria, drug dosing, or any medical guideline question.
        </p>
      </div>

      {/* Messages */}
      {messages.length > 0 && (
        <div style={{
          marginBottom: 28,
          maxHeight: 400,
          overflowY: "auto",
          paddingRight: 12
        }}>
          {messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: 16,
                padding: 14,
                borderRadius: 10,
                background: msg.role === "user" ? COLORS.dim : COLORS.surface,
                border: `1px solid ${msg.role === "user" ? COLORS.dim : COLORS.border}`,
                color: COLORS.text,
                fontSize: 13,
                lineHeight: 1.6,
                whiteSpace: "pre-wrap"
              }}
            >
              {msg.content}
            </div>
          ))}
          {loading && (
            <div style={{
              padding: 14,
              borderRadius: 10,
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              color: COLORS.muted,
              fontSize: 13
            }}>
              Loading response...
            </div>
          )}
        </div>
      )}

      {/* Welcome Screen */}
      {showWelcome && messages.length === 0 && (
        <div style={{ marginBottom: 28 }}>
          {/* Quick Prompts */}
          <div style={{ marginBottom: 24 }}>
            <p style={{
              fontSize: 12,
              fontWeight: 600,
              color: COLORS.muted,
              marginBottom: 12,
              textTransform: "uppercase",
              letterSpacing: "0.5px"
            }}>
              Quick Prompts
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt.id}
                  onClick={() => handleSearch(prompt.query)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 8,
                    background: COLORS.surface,
                    border: `1px solid ${COLORS.border}`,
                    color: COLORS.text,
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.2s",
                    hover: {
                      borderColor: COLORS.accent,
                      background: COLORS.accentDim
                    }
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = COLORS.accent;
                    e.currentTarget.style.background = COLORS.accentDim;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = COLORS.border;
                    e.currentTarget.style.background = COLORS.surface;
                  }}
                >
                  {prompt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Suggested Topics */}
          <div>
            <p style={{
              fontSize: 12,
              fontWeight: 600,
              color: COLORS.muted,
              marginBottom: 12,
              textTransform: "uppercase",
              letterSpacing: "0.5px"
            }}>
              Suggested Topics
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {SUGGESTED_TOPICS.map((group) => (
                <div key={group.category}>
                  <p style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: COLORS.accent,
                    marginBottom: 8
                  }}>
                    {group.category}
                  </p>
                  <ul style={{ fontSize: 12, color: COLORS.muted, lineHeight: 1.6 }}>
                    {group.topics.map((topic, idx) => (
                      <li key={idx} style={{ marginBottom: 4 }}>• {topic}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search Input */}
      <div style={{
        display: "flex",
        gap: 10,
        marginBottom: 12
      }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Ask about clinical guidelines..."
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: 8,
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            color: COLORS.text,
            fontSize: 13,
            outline: "none",
            transition: "all 0.2s"
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = COLORS.accent;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = COLORS.border;
          }}
        />
        <button
          onClick={() => handleSearch()}
          disabled={loading || !query.trim()}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            background: query.trim() ? COLORS.accent : COLORS.dim,
            border: "none",
            color: COLORS.background,
            fontSize: 13,
            fontWeight: 600,
            cursor: query.trim() ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            gap: 6,
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => {
            if (query.trim()) e.currentTarget.style.opacity = "0.9";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
        >
          <Send size={14} />
        </button>
        {messages.length > 0 && (
          <button
            onClick={handleReset}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              color: COLORS.muted,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = COLORS.text;
              e.currentTarget.style.color = COLORS.text;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = COLORS.border;
              e.currentTarget.style.color = COLORS.muted;
            }}
          >
            <RotateCcw size={14} />
          </button>
        )}
      </div>

      {/* Disclaimer */}
      <p style={{
        fontSize: 11,
        color: COLORS.muted,
        lineHeight: 1.4,
        textAlign: "center"
      }}>
        For informational and educational purposes only. Clinical judgment must be applied. Not a substitute for professional medical advice.
      </p>
    </div>
  );
}