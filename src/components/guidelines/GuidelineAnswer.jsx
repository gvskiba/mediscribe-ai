import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Shield, Tag, Sparkles, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import RatingComponent from "./RatingComponent";
import RelatedQuestions from "./RelatedQuestions";

const confidenceColors = {
  high: "bg-emerald-50 text-emerald-700 border-emerald-200",
  moderate: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-red-50 text-red-700 border-red-200",
};

const categoryLabels = {
  cardiology: "Cardiology",
  pulmonology: "Pulmonology",
  endocrinology: "Endocrinology",
  infectious_disease: "Infectious Disease",
  neurology: "Neurology",
  oncology: "Oncology",
  gastroenterology: "Gastroenterology",
  nephrology: "Nephrology",
  rheumatology: "Rheumatology",
  general: "General Medicine",
};

export default function GuidelineAnswer({ query, onRate, onSelectRelatedQuestion }) {
  const [sourceSummary, setSourceSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [expandedSummary, setExpandedSummary] = useState(false);

  const generateSourceSummary = async () => {
    if (!query.sources?.length) return;
    
    setLoadingSummary(true);
    try {
      const sourcesText = query.sources.join("\n");
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Provide a concise, clinically relevant summary of these evidence sources. Highlight:
1. Key findings that directly support the guideline
2. Level of evidence (if available)
3. Important limitations or considerations
4. Clinical implications

Sources:
${sourcesText}

Keep the summary to 2-3 sentences maximum.`,
      });

      setSourceSummary(result);
      setExpandedSummary(true);
    } catch (error) {
      console.error("Error generating summary:", error);
    } finally {
      setLoadingSummary(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
    >
      {/* Question */}
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <p className="text-lg font-semibold text-slate-900 leading-relaxed">{query.question}</p>
        <div className="flex items-center gap-2 mt-3">
          {query.category && (
            <Badge variant="outline" className="bg-white text-slate-600 gap-1">
              <Tag className="w-3 h-3" />
              {categoryLabels[query.category] || query.category}
            </Badge>
          )}
          {query.confidence_level && (
            <Badge variant="outline" className={`gap-1 ${confidenceColors[query.confidence_level]}`}>
              <Shield className="w-3 h-3" />
              {query.confidence_level} confidence
            </Badge>
          )}
        </div>
      </div>

      {/* Answer */}
      <div className="p-6">
        <ReactMarkdown
          className="prose prose-sm prose-slate max-w-none
            [&>h1]:text-lg [&>h1]:font-bold [&>h1]:mt-4 [&>h1]:mb-2
            [&>h2]:text-base [&>h2]:font-semibold [&>h2]:mt-4 [&>h2]:mb-2
            [&>h3]:text-sm [&>h3]:font-semibold [&>h3]:mt-3 [&>h3]:mb-1
            [&>p]:text-sm [&>p]:leading-relaxed [&>p]:text-slate-700 [&>p]:mb-3
            [&>ul]:text-sm [&>ul]:text-slate-700 [&>ul]:mb-3
            [&>ol]:text-sm [&>ol]:text-slate-700 [&>ol]:mb-3
            [&>li]:mb-1
            [&>blockquote]:border-purple-300 [&>blockquote]:bg-purple-50/50 [&>blockquote]:rounded-lg [&>blockquote]:px-4
          "
        >
          {query.answer}
        </ReactMarkdown>
      </div>

      {/* Sources */}
      {query.sources?.length > 0 && (
        <div className="px-6 pb-4 pt-2 border-t border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-slate-400" />
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Evidence Sources</p>
              <Badge variant="outline" className="text-xs">{query.sources.length}</Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={generateSourceSummary}
              disabled={loadingSummary || sourceSummary}
              className="gap-1 text-xs h-8"
            >
              {loadingSummary ? (
                <><Loader2 className="w-3 h-3 animate-spin" /> Summarizing...</>
              ) : sourceSummary ? (
                <>{expandedSummary ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />} Summary</>
              ) : (
                <><Sparkles className="w-3 h-3" /> AI Summary</>
              )}
            </Button>
          </div>

          {/* AI Summary */}
          {sourceSummary && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={`bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-3 space-y-2 ${
                !expandedSummary ? "hidden" : ""
              }`}
            >
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-slate-700 leading-relaxed">{sourceSummary}</p>
              </div>
            </motion.div>
          )}

          {/* Sources List */}
          <div className="space-y-2">
            {query.sources.map((source, i) => {
              const urlMatch = source.match(/(https?:\/\/[^\s)]+)/);
              const url = urlMatch ? urlMatch[1] : null;
              const textWithoutUrl = url ? source.replace(url, '').trim() : source;
              
              return (
                <div key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="text-xs font-semibold text-slate-400 bg-slate-100 rounded w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <span className="text-sm leading-relaxed">{textWithoutUrl}</span>
                    {url && (
                      <a 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="ml-2 text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1 text-xs"
                      >
                        View Source →
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rating */}
      {onRate && (
        <div className="px-6 pb-4 border-t border-slate-100 pt-4">
          <RatingComponent 
            queryId={query.id} 
            initialRating={query.rating} 
            onRate={onRate}
          />
        </div>
      )}

      {/* Related Questions */}
      {query.related_questions && query.related_questions.length > 0 && onSelectRelatedQuestion && (
        <div className="px-6 pb-4">
          <RelatedQuestions 
            questions={query.related_questions}
            onSelectQuestion={onSelectRelatedQuestion}
          />
        </div>
      )}
    </motion.div>
  );
}