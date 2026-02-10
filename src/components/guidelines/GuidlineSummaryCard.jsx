import { Sparkles, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

const confidenceBadgeStyles = {
  high: "bg-emerald-50 text-emerald-700 border-emerald-200",
  moderate: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-red-50 text-red-700 border-red-200"
};

export default function GuidlineSummaryCard({ summary, confidenceLevel, isLoading }) {
  if (isLoading) {
    return (
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="h-3 w-full rounded" />
        <Skeleton className="h-3 w-5/6 rounded" />
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="p-4 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 rounded-xl border border-purple-200 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0">
          <Sparkles className="w-5 h-5 text-purple-600" />
        </div>
        
        <div className="flex-1 space-y-3">
          {/* Key Recommendation */}
          <div>
            <p className="text-sm font-semibold text-slate-900 leading-snug">
              {summary.key_recommendation}
            </p>
          </div>

          {/* Essential Points */}
          {summary.essential_points && summary.essential_points.length > 0 && (
            <ul className="space-y-2">
              {summary.essential_points.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                  <span className="text-purple-500 font-bold mt-0.5 flex-shrink-0">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Evidence Level & Footer */}
          <div className="flex items-center justify-between pt-1 border-t border-purple-100">
            {summary.evidence_note && (
              <p className="text-xs text-slate-600 italic">{summary.evidence_note}</p>
            )}
            
            {confidenceLevel && (
              <span className={`text-xs px-2 py-1 rounded-lg border font-medium ml-2 flex-shrink-0 ${confidenceBadgeStyles[confidenceLevel] || confidenceBadgeStyles.moderate}`}>
                {confidenceLevel} confidence
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}