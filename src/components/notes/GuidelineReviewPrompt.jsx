import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Lightbulb,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function GuidelineReviewPrompt({
  linkedGuidelines,
  onIncorporate,
  onDismiss,
}) {
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [incorporatedGuidelines, setIncorporatedGuidelines] = useState(
    new Set()
  );

  if (!linkedGuidelines || linkedGuidelines.length === 0) {
    return null;
  }

  const pendingGuidelines = linkedGuidelines.filter(
    (g) => !incorporatedGuidelines.has(g.guideline_query_id)
  );

  if (pendingGuidelines.length === 0) {
    return null;
  }

  const handleIncorporate = async (guideline) => {
    setIncorporatedGuidelines(
      new Set([...incorporatedGuidelines, guideline.guideline_query_id])
    );
    if (onIncorporate) {
      await onIncorporate(guideline);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl p-5 mb-6"
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0">
          <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-blue-900 text-sm mb-1">
            Evidence-Based Guidelines Available
          </h3>
          <p className="text-xs text-blue-700">
            {pendingGuidelines.length} guideline{pendingGuidelines.length !== 1 ? "s" : ""} linked to this note's diagnoses. Review and
            incorporate into your treatment plan.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {pendingGuidelines.map((guideline, idx) => (
          <motion.div
            key={guideline.guideline_query_id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white rounded-xl border border-blue-100 overflow-hidden"
          >
            <button
              onClick={() =>
                setExpandedIndex(
                  expandedIndex === idx ? null : idx
                )
              }
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 text-left">
                <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {guideline.condition}
                  </p>
                  <p className="text-xs text-slate-600 line-clamp-1">
                    {guideline.summary}
                  </p>
                </div>
              </div>
              {expandedIndex === idx ? (
                <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
              )}
            </button>

            <AnimatePresence>
              {expandedIndex === idx && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-blue-100 bg-blue-50 px-4 py-3 space-y-3"
                >
                  {guideline.diagnostic_approach && (
                    <div>
                      <p className="text-xs font-semibold text-blue-900 mb-1">
                        Diagnostic Approach
                      </p>
                      <p className="text-xs text-slate-700">
                        {guideline.diagnostic_approach}
                      </p>
                    </div>
                  )}

                  {guideline.first_line_treatments &&
                    guideline.first_line_treatments.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-blue-900 mb-2">
                          First-Line Treatments
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {guideline.first_line_treatments.map((treatment, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {treatment}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                  {guideline.recommendations &&
                    guideline.recommendations.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-blue-900 mb-2">
                          Key Recommendations
                        </p>
                        <ul className="space-y-1">
                          {guideline.recommendations.map((rec, i) => (
                            <li key={i} className="text-xs text-slate-700 flex gap-2">
                              <span className="text-blue-600">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {guideline.referral_criteria && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
                      <p className="text-xs font-semibold text-amber-900 mb-1">
                        Referral Criteria
                      </p>
                      <p className="text-xs text-amber-800">
                        {guideline.referral_criteria}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => handleIncorporate(guideline)}
                      className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 flex-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Incorporate
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setExpandedIndex(null)
                      }
                      className="flex-1"
                    >
                      Review Later
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {pendingGuidelines.length > 0 && (
        <div className="mt-4 flex gap-2 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDismiss?.()}
            className="text-slate-600 hover:text-slate-900"
          >
            Dismiss
          </Button>
        </div>
      )}
    </motion.div>
  );
}