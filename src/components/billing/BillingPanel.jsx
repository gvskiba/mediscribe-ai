import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DollarSign, Loader2, AlertTriangle, AlertCircle, TrendingUp,
  CheckCircle, BarChart3, RefreshCw, ChevronDown, ChevronUp
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const EM_COLORS = {
  "99202": "bg-green-100 text-green-700",
  "99203": "bg-green-100 text-green-700",
  "99204": "bg-blue-100 text-blue-700",
  "99205": "bg-purple-100 text-purple-700",
  "99211": "bg-slate-100 text-slate-600",
  "99212": "bg-green-100 text-green-700",
  "99213": "bg-green-100 text-green-700",
  "99214": "bg-blue-100 text-blue-700",
  "99215": "bg-purple-100 text-purple-700",
};

const COMPLEXITY_COLORS = {
  straightforward: "bg-green-50 text-green-700",
  low: "bg-blue-50 text-blue-700",
  moderate: "bg-amber-50 text-amber-700",
  high: "bg-rose-50 text-rose-700",
};

const GAP_STYLES = {
  critical: { bar: "border-l-rose-500", bg: "bg-rose-50", icon: <AlertCircle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0 mt-0.5" /> },
  warning: { bar: "border-l-amber-500", bg: "bg-amber-50", icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" /> },
  info: { bar: "border-l-blue-400", bg: "bg-blue-50", icon: <AlertCircle className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" /> },
};

function ScoreCircle({ score }) {
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";
  const r = 22;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="relative flex items-center justify-center" style={{ width: 60, height: 60 }}>
      <svg width="60" height="60" className="-rotate-90">
        <circle cx="30" cy="30" r={r} fill="none" stroke="#e2e8f0" strokeWidth="4" />
        <circle cx="30" cy="30" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <span className="absolute text-xs font-bold text-slate-700">{score}</span>
    </div>
  );
}

export default function BillingPanel({ note, noteId }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const { data: analysisArr = [], isLoading, refetch } = useQuery({
    queryKey: ["billingAnalysis", noteId],
    queryFn: () => base44.entities.BillingAnalysis.filter({ note_id: noteId }),
    enabled: !!noteId,
  });

  const analysis = analysisArr[0] || null;

  const handleAnalyze = async () => {
    if (note?.status !== "finalized") {
      toast.error("Please finalize the note before running billing analysis.");
      return;
    }
    setAnalyzing(true);
    try {
      await base44.functions.invoke("analyzeBilling", { noteId });
      await refetch();
      toast.success("Billing analysis complete");
    } catch (err) {
      toast.error("Analysis failed: " + err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const criticalGaps = analysis?.documentation_gaps?.filter(g => g.severity === "critical") || [];
  const otherGaps = analysis?.documentation_gaps?.filter(g => g.severity !== "critical") || [];
  const visibleGaps = showAll ? analysis?.documentation_gaps || [] : [...criticalGaps, ...otherGaps.slice(0, 2)];

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-semibold text-slate-800">E&M Billing Analysis</span>
          {analysis && (
            <Badge className={`text-xs font-mono ${EM_COLORS[analysis.em_level] || "bg-slate-100 text-slate-600"}`}>
              {analysis.em_level}
            </Badge>
          )}
        </div>
        <Button
          size="sm"
          variant={analysis ? "outline" : "default"}
          className={`h-7 text-xs gap-1 ${!analysis ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}`}
          onClick={handleAnalyze}
          disabled={analyzing}
        >
          {analyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : analysis ? <RefreshCw className="w-3 h-3" /> : <BarChart3 className="w-3 h-3" />}
          {analyzing ? "Analyzing..." : analysis ? "Re-analyze" : "Run Analysis"}
        </Button>
      </div>

      {note?.status !== "finalized" && !analysis && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          Finalize the note to enable billing analysis.
        </div>
      )}

      {analysis && (
        <>
          {/* Main result card */}
          <div className="rounded-xl border border-slate-100 bg-white p-3 flex items-center gap-4">
            <ScoreCircle score={analysis.score || 0} />
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base font-bold text-slate-800">{analysis.em_level_label || analysis.em_level}</span>
                <Badge className={`text-xs capitalize ${COMPLEXITY_COLORS[analysis.complexity] || ""}`}>
                  {analysis.complexity}
                </Badge>
                {analysis.compliant
                  ? <span className="flex items-center gap-1 text-xs text-emerald-600"><CheckCircle className="w-3 h-3" /> Compliant</span>
                  : <span className="flex items-center gap-1 text-xs text-rose-600"><AlertCircle className="w-3 h-3" /> Gaps Found</span>
                }
              </div>
              {/* MDM mini bars */}
              <div className="flex gap-3 flex-wrap">
                {[["Problems", analysis.mdm_score?.problems], ["Data", analysis.mdm_score?.data], ["Risk", analysis.mdm_score?.risk]].map(([label, val]) => (
                  <div key={label} className="flex items-center gap-1">
                    <span className="text-xs text-slate-400">{label}</span>
                    <div className="flex gap-0.5">
                      {[1,2,3].map(i => (
                        <div key={i} className={`w-3.5 h-1.5 rounded-sm ${i <= (val||0) ? "bg-blue-500" : "bg-slate-100"}`} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Upgrade opportunities */}
          {analysis.upgrade_opportunities?.length > 0 && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2 space-y-1">
              <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Upgrade Opportunities
              </p>
              {analysis.upgrade_opportunities.map((op, i) => (
                <p key={i} className="text-xs text-emerald-700 flex items-start gap-1.5">
                  <span className="flex-shrink-0 mt-0.5">→</span>{op}
                </p>
              ))}
            </div>
          )}

          {/* Documentation gaps */}
          {analysis.documentation_gaps?.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-500" /> Documentation Gaps
              </p>
              {visibleGaps.map((gap, i) => {
                const style = GAP_STYLES[gap.severity] || GAP_STYLES.info;
                return (
                  <div key={i} className={`rounded-lg border-l-4 ${style.bar} ${style.bg} px-3 py-2`}>
                    <div className="flex items-start gap-2">
                      {style.icon}
                      <div>
                        <p className="text-xs font-semibold text-slate-700">{gap.field}</p>
                        <p className="text-xs text-slate-600">{gap.message}</p>
                        {gap.recommendation && <p className="text-xs text-slate-400 mt-0.5">💡 {gap.recommendation}</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
              {analysis.documentation_gaps.length > 3 && (
                <button onClick={() => setShowAll(!showAll)} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                  {showAll ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Show {analysis.documentation_gaps.length - 3} more</>}
                </button>
              )}
            </div>
          )}

          {/* AI Reasoning */}
          {analysis.ai_reasoning && (
            <details className="group">
              <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600 list-none flex items-center gap-1">
                <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform" /> AI Reasoning
              </summary>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed pl-4 border-l-2 border-slate-100">{analysis.ai_reasoning}</p>
            </details>
          )}

          {analysis.analyzed_at && (
            <p className="text-xs text-slate-400 text-right">Last analyzed {format(new Date(analysis.analyzed_at), "MMM d 'at' h:mm a")}</p>
          )}
        </>
      )}
    </div>
  );
}