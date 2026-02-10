import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import GuidelineAnswer from "../components/guidelines/GuidelineAnswer";

export default function GuidelineDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const guidelineId = urlParams.get("id");
  const [relatedGuidelines, setRelatedGuidelines] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [summary, setSummary] = useState("");
  const [loadingSummary, setLoadingSummary] = useState(false);

  const { data: guideline, isLoading } = useQuery({
    queryKey: ["guideline", guidelineId],
    queryFn: () =>
      base44.entities.GuidelineQuery.list().then((queries) =>
        queries.find((q) => q.id === guidelineId)
      ),
    enabled: !!guidelineId,
  });

  const generateSummary = useCallback(async () => {
    if (!guideline) return;
    
    setLoadingSummary(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Provide a brief 2-3 sentence clinical summary of this guideline that captures the key takeaway for a healthcare provider:

Question: "${guideline.question}"
Answer: ${guideline.answer}

Keep it concise, actionable, and focused on the most important clinical point.`,
      });
      setSummary(result);
    } catch (error) {
      console.error("Error generating summary:", error);
    }
    setLoadingSummary(false);
  }, [guideline]);

  const generateRelatedGuidelines = useCallback(async () => {
    if (!guideline) return;
    
    setLoadingRelated(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on this clinical guideline, suggest related guidelines that would be clinically relevant.

Current Guideline: "${guideline.question}"
Category: ${guideline.category}
Answer excerpt: ${guideline.answer.substring(0, 300)}...

Suggest 5-6 related guideline topics. Consider:
- Related conditions, complications, or differential diagnoses
- Alternative treatment approaches or therapies
- Monitoring, follow-up, or screening guidelines
- Preventive measures and risk reduction
- Drug interactions, contraindications, or side effect management
- Comorbidity management and special populations

Format each as a concise, actionable clinical question.`,
        response_json_schema: {
          type: "object",
          properties: {
            related_topics: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  reason: { type: "string" },
                  priority: { type: "string", enum: ["high", "medium", "low"] }
                },
              },
            },
          },
        },
      });

      setRelatedGuidelines(result.related_topics || []);
    } catch (error) {
      console.error("Error generating related guidelines:", error);
    }
    setLoadingRelated(false);
  }, [guideline]);

  useEffect(() => {
    if (guideline) {
      generateSummary();
      generateRelatedGuidelines();
    }
  }, [guideline, generateSummary, generateRelatedGuidelines]);

  const handleRate = async (queryId, rating) => {
    await base44.entities.GuidelineQuery.update(queryId, { rating });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (!guideline) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <p className="text-slate-600 mb-4">Guideline not found</p>
        <Link to={createPageUrl("Guidelines")}>
          <Button variant="outline" className="rounded-xl">
            Back to Guidelines
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        to={createPageUrl("Guidelines")}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Guidelines
      </Link>

      <GuidelineAnswer query={guideline} onRate={handleRate} />

      {/* AI Summary */}
      {summary && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 p-6"
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Key Takeaway</h3>
              {loadingSummary ? (
                <div className="flex items-center gap-2 text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Generating summary...</span>
                </div>
              ) : (
                <p className="text-sm text-slate-700 leading-relaxed">{summary}</p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* AI-Powered Related Guidelines */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-slate-900">Related Guidelines</h3>
        </div>

        {loadingRelated ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : relatedGuidelines.length > 0 ? (
          <>
            <p className="text-sm text-slate-600 mb-4">
              Based on this guideline, these related topics might be helpful:
            </p>
            <div className="grid gap-3">
              {relatedGuidelines.map((related, idx) => (
                <Link
                  key={idx}
                  to={createPageUrl("Guidelines")}
                  state={{ autoQuery: related.question }}
                  className="text-left bg-white rounded-xl p-4 border border-blue-100 hover:border-blue-300 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                        {related.question}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{related.reason}</p>
                    </div>
                    {related.priority === "high" && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                        High Priority
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-500">No related guidelines found</p>
        )}
      </motion.div>
    </div>
  );
}