import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, ChevronRight, ExternalLink, RefreshCw, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SmartGuidelinePanel({ noteContent, diagnoses = [], medications = [], patientHistory = null }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [lastAnalyzed, setLastAnalyzed] = useState("");

  useEffect(() => {
    const contentToAnalyze = [noteContent, ...diagnoses, ...medications].join(" ").trim();
    
    if (!contentToAnalyze || contentToAnalyze === lastAnalyzed) return;

    const timer = setTimeout(() => {
      analyzeClinicalContext(contentToAnalyze);
    }, 2000);

    return () => clearTimeout(timer);
  }, [noteContent, diagnoses, medications]);

  const analyzeClinicalContext = async (content) => {
    if (!content.trim()) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    setLastAnalyzed(content);

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a clinical decision support AI analyzing a patient encounter note in real-time.

CLINICAL CONTEXT:
${content}

TASK: Identify the TOP 3 most clinically relevant guideline topics that would help the clinician managing this patient RIGHT NOW.

Consider:
1. Active diagnoses or suspected conditions
2. Medications mentioned (drug interactions, contraindications, dosing)
3. Risk factors or comorbidities
4. Acute management needs vs. chronic disease management
5. Preventive care or screening opportunities

For each guideline suggestion, provide:
- A clear, actionable guideline topic (as a clinical question)
- Brief rationale (why this is relevant NOW)
- Priority level (high/medium/low)

Focus on ACTIONABLE guidelines that would impact clinical decision-making for THIS patient.`,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  rationale: { type: "string" },
                  priority: { type: "string" },
                  category: { type: "string" }
                }
              }
            }
          }
        }
      });

      setSuggestions(result.suggestions || []);
    } catch (error) {
      console.error("Failed to analyze clinical context:", error);
      setSuggestions([]);
    }

    setLoading(false);
  };

  const handleRefresh = () => {
    setLastAnalyzed("");
    const content = [noteContent, ...diagnoses, ...medications].join(" ").trim();
    analyzeClinicalContext(content);
  };

  if (!expanded) {
    return (
      <motion.button
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => setExpanded(true)}
        className="fixed right-0 top-1/3 bg-blue-600 text-white p-3 rounded-l-xl shadow-lg hover:bg-blue-700 transition-colors z-40"
      >
        <Lightbulb className="w-5 h-5" />
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="fixed right-0 top-20 bottom-0 w-96 bg-white border-l border-slate-200 shadow-2xl flex flex-col z-40 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Smart Guidelines</h3>
            <p className="text-xs text-slate-600">AI-powered suggestions</p>
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            className="h-8 w-8"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setExpanded(false)}
            className="h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
        ) : suggestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Lightbulb className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-sm text-slate-600 mb-1">No suggestions yet</p>
            <p className="text-xs text-slate-500">
              Start documenting to get AI-powered guideline recommendations
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((suggestion, idx) => (
              <GuidelineSuggestionCard
                key={idx}
                suggestion={suggestion}
                index={idx}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-200 bg-slate-50">
        <p className="text-xs text-slate-500 text-center">
          Suggestions update automatically as you document
        </p>
      </div>
    </motion.div>
  );
}

function GuidelineSuggestionCard({ suggestion, index }) {
  const [expanded, setExpanded] = useState(false);

  const priorityColors = {
    high: "bg-red-100 text-red-700 border-red-200",
    medium: "bg-amber-100 text-amber-700 border-amber-200",
    low: "bg-blue-100 text-blue-700 border-blue-200",
  };

  const handleViewGuideline = () => {
    const url = `/app/Guidelines?question=${encodeURIComponent(suggestion.question)}`;
    window.open(url, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden hover:border-blue-300 transition-colors"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3 text-left flex items-start justify-between gap-2"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className={`text-xs ${priorityColors[suggestion.priority] || priorityColors.medium}`}>
              {suggestion.priority || 'medium'} priority
            </Badge>
          </div>
          <p className="text-sm font-medium text-slate-900 leading-snug">
            {suggestion.question}
          </p>
        </div>
        <ChevronRight className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-200 bg-white"
          >
            <div className="p-3 space-y-3">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Why this matters</p>
                <p className="text-sm text-slate-700 leading-relaxed">{suggestion.rationale}</p>
              </div>
              <Button
                onClick={handleViewGuideline}
                size="sm"
                className="w-full bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                <ExternalLink className="w-3 h-3 mr-2" />
                View Full Guideline
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}