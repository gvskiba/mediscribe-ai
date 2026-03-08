import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DollarSign, AlertTriangle, CheckCircle, TrendingUp, FileText,
  Search, ArrowRight, Clock, BarChart3, AlertCircle, ChevronDown, ChevronUp, Loader2
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const EM_COLORS = {
  "99202": "bg-green-100 text-green-700 border-green-200",
  "99203": "bg-green-100 text-green-700 border-green-200",
  "99204": "bg-blue-100 text-blue-700 border-blue-200",
  "99205": "bg-purple-100 text-purple-700 border-purple-200",
  "99211": "bg-slate-100 text-slate-600 border-slate-200",
  "99212": "bg-green-100 text-green-700 border-green-200",
  "99213": "bg-green-100 text-green-700 border-green-200",
  "99214": "bg-blue-100 text-blue-700 border-blue-200",
  "99215": "bg-purple-100 text-purple-700 border-purple-200",
};

const COMPLEXITY_COLORS = {
  straightforward: "bg-green-50 text-green-700 border-green-200",
  low: "bg-blue-50 text-blue-700 border-blue-200",
  moderate: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-rose-50 text-rose-700 border-rose-200",
};

const GAP_COLORS = {
  critical: "border-l-rose-500 bg-rose-50",
  warning: "border-l-amber-500 bg-amber-50",
  info: "border-l-blue-500 bg-blue-50",
};

const GAP_ICONS = {
  critical: <AlertCircle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />,
  warning: <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />,
  info: <AlertCircle className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />,
};

function ScoreBar({ score }) {
  const color = score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-semibold text-slate-700 w-8 text-right">{score}</span>
    </div>
  );
}

function MDMBar({ label, value }) {
  const colors = ["bg-slate-200", "bg-blue-400", "bg-blue-600", "bg-purple-600"];
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-slate-500 w-14 flex-shrink-0">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3].map(i => (
          <div key={i} className={`w-5 h-2.5 rounded-sm ${i <= value ? colors[value] : "bg-slate-100"}`} />
        ))}
      </div>
      <span className="text-xs text-slate-500">{value}/3</span>
    </div>
  );
}

function NoteRow({ analysis, onReanalyze, reanalyzing }) {
  const [expanded, setExpanded] = useState(false);
  const criticalGaps = analysis.documentation_gaps?.filter(g => g.severity === "critical") || [];
  const warningGaps = analysis.documentation_gaps?.filter(g => g.severity === "warning") || [];

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setExpanded(!expanded)}>
        {/* Patient / Note info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-900 truncate">{analysis.patient_name || "Unknown Patient"}</span>
            {analysis.patient_id && <span className="text-xs text-slate-400">MRN: {analysis.patient_id}</span>}
            {analysis.date_of_visit && (
              <span className="text-xs text-slate-400">{format(new Date(analysis.date_of_visit), "MMM d, yyyy")}</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge className={`text-xs font-mono ${EM_COLORS[analysis.em_level] || "bg-slate-100 text-slate-600"}`}>
              {analysis.em_level}
            </Badge>
            {analysis.em_level_label && <span className="text-xs text-slate-500">{analysis.em_level_label}</span>}
            <Badge className={`text-xs capitalize ${COMPLEXITY_COLORS[analysis.complexity] || ""}`}>
              {analysis.complexity}
            </Badge>
          </div>
        </div>

        {/* Score */}
        <div className="w-28 hidden sm:block">
          <p className="text-xs text-slate-400 mb-1">Doc Score</p>
          <ScoreBar score={analysis.score || 0} />
        </div>

        {/* Flags */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {criticalGaps.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-full px-2 py-0.5">
              <AlertCircle className="w-3 h-3" />{criticalGaps.length}
            </span>
          )}
          {warningGaps.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
              <AlertTriangle className="w-3 h-3" />{warningGaps.length}
            </span>
          )}
          {analysis.compliant && <CheckCircle className="w-4 h-4 text-emerald-500" />}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Link to={createPageUrl(`NoteDetail?id=${analysis.note_id}`)} onClick={e => e.stopPropagation()}>
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1 text-blue-600 hover:text-blue-700">
              <ArrowRight className="w-3 h-3" /> Note
            </Button>
          </Link>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 px-4 py-4 space-y-4 bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* MDM Scores */}
            <div className="bg-white rounded-lg border border-slate-100 p-3 space-y-2">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">MDM Components</p>
              <MDMBar label="Problems" value={analysis.mdm_score?.problems || 0} />
              <MDMBar label="Data" value={analysis.mdm_score?.data || 0} />
              <MDMBar label="Risk" value={analysis.mdm_score?.risk || 0} />
            </div>

            {/* Upgrade Opportunities */}
            {analysis.upgrade_opportunities?.length > 0 && (
              <div className="bg-white rounded-lg border border-slate-100 p-3">
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Upgrade Opportunities
                </p>
                <ul className="space-y-1">
                  {analysis.upgrade_opportunities.map((op, i) => (
                    <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                      <span className="text-emerald-500 mt-0.5">→</span>{op}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Documentation Gaps */}
          {analysis.documentation_gaps?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Documentation Gaps
              </p>
              <div className="space-y-2">
                {analysis.documentation_gaps.map((gap, i) => (
                  <div key={i} className={`rounded-lg border-l-4 px-3 py-2 ${GAP_COLORS[gap.severity]}`}>
                    <div className="flex items-start gap-2">
                      {GAP_ICONS[gap.severity]}
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-700">{gap.field}: <span className="font-normal">{gap.message}</span></p>
                        {gap.recommendation && (
                          <p className="text-xs text-slate-500 mt-0.5">💡 {gap.recommendation}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Reasoning */}
          {analysis.ai_reasoning && (
            <div className="bg-white rounded-lg border border-slate-100 p-3">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">AI Reasoning</p>
              <p className="text-xs text-slate-600 leading-relaxed">{analysis.ai_reasoning}</p>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            {analysis.analyzed_at && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Analyzed {format(new Date(analysis.analyzed_at), "MMM d, yyyy 'at' h:mm a")}
              </span>
            )}
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1"
              onClick={() => onReanalyze(analysis.note_id)}
              disabled={reanalyzing === analysis.note_id}
            >
              {reanalyzing === analysis.note_id ? <Loader2 className="w-3 h-3 animate-spin" /> : <BarChart3 className="w-3 h-3" />}
              Re-analyze
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BillingDashboard() {
  const [search, setSearch] = useState("");
  const [filterComplexity, setFilterComplexity] = useState("all");
  const [filterGaps, setFilterGaps] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(null);
  const [bulkAnalyzing, setBulkAnalyzing] = useState(false);

  const { data: analyses = [], isLoading, refetch } = useQuery({
    queryKey: ["billingAnalyses"],
    queryFn: () => base44.entities.BillingAnalysis.list("-analyzed_at", 100),
  });

  const { data: finalizedNotes = [] } = useQuery({
    queryKey: ["finalizedNotes"],
    queryFn: () => base44.entities.ClinicalNote.filter({ status: "finalized" }),
  });

  const analyzedNoteIds = new Set(analyses.map(a => a.note_id));
  const unanalyzedNotes = finalizedNotes.filter(n => !analyzedNoteIds.has(n.id));

  const filtered = analyses.filter(a => {
    const matchSearch = !search || 
      a.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.patient_id?.toLowerCase().includes(search.toLowerCase()) ||
      a.em_level?.includes(search);
    const matchComplexity = filterComplexity === "all" || a.complexity === filterComplexity;
    const matchGaps = !filterGaps || (a.documentation_gaps?.some(g => g.severity === "critical"));
    return matchSearch && matchComplexity && matchGaps;
  });

  // Stats
  const totalAnalyzed = analyses.length;
  const criticalFlags = analyses.filter(a => a.documentation_gaps?.some(g => g.severity === "critical")).length;
  const avgScore = analyses.length > 0 ? Math.round(analyses.reduce((s, a) => s + (a.score || 0), 0) / analyses.length) : 0;
  const highComplexity = analyses.filter(a => a.complexity === "high" || a.complexity === "moderate").length;

  const handleReanalyze = async (noteId) => {
    setReanalyzing(noteId);
    try {
      await base44.functions.invoke("analyzeBilling", { noteId });
      await refetch();
      toast.success("Billing analysis updated");
    } catch (err) {
      toast.error("Analysis failed: " + err.message);
    } finally {
      setReanalyzing(null);
    }
  };

  const handleBulkAnalyze = async () => {
    setBulkAnalyzing(true);
    let success = 0;
    for (const note of unanalyzedNotes.slice(0, 10)) {
      try {
        await base44.functions.invoke("analyzeBilling", { noteId: note.id });
        success++;
      } catch {}
    }
    await refetch();
    setBulkAnalyzing(false);
    toast.success(`Analyzed ${success} notes`);
  };

  return (
    <div style={{ background: "#050f1e", minHeight: "100vh", fontFamily: "DM Sans, sans-serif" }}>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-emerald-400" />
              Billing Assistant
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">AI-powered E&M level analysis and documentation gap detection</p>
          </div>
          {unanalyzedNotes.length > 0 && (
            <Button
              onClick={handleBulkAnalyze}
              disabled={bulkAnalyzing}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              {bulkAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
              Analyze {Math.min(unanalyzedNotes.length, 10)} New Notes
            </Button>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Notes Analyzed", value: totalAnalyzed, icon: FileText, color: "text-blue-400", bg: "bg-blue-500/10" },
            { label: "Critical Flags", value: criticalFlags, icon: AlertCircle, color: "text-rose-400", bg: "bg-rose-500/10" },
            { label: "Avg Doc Score", value: `${avgScore}%`, icon: BarChart3, color: "text-emerald-400", bg: "bg-emerald-500/10" },
            { label: "Mod/High Level", value: highComplexity, icon: TrendingUp, color: "text-amber-400", bg: "bg-amber-500/10" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="rounded-xl p-4" style={{ background: "#0d2240", border: "1px solid #1e3a5f" }}>
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-2`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <p className="text-xl font-bold text-white">{value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Unanalyzed banner */}
        {unanalyzedNotes.length > 0 && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-300">{unanalyzedNotes.length} finalized {unanalyzedNotes.length === 1 ? "note" : "notes"} not yet analyzed</p>
              <p className="text-xs text-amber-400/70">These notes may have documentation gaps or missed billing opportunities.</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search patient, MRN, or CPT code..."
              className="pl-9 h-9 text-sm bg-white/5 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
          <div className="flex gap-1.5">
            {["all", "straightforward", "low", "moderate", "high"].map(c => (
              <button
                key={c}
                onClick={() => setFilterComplexity(c)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all capitalize ${
                  filterComplexity === c
                    ? "bg-blue-600 text-white"
                    : "bg-white/5 text-slate-400 hover:bg-white/10"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <button
            onClick={() => setFilterGaps(!filterGaps)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
              filterGaps ? "bg-rose-600 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"
            }`}
          >
            <AlertCircle className="w-3 h-3" /> Critical Flags Only
          </button>
        </div>

        {/* Note List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <DollarSign className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">
              {analyses.length === 0 ? "No billing analyses yet." : "No results match your filters."}
            </p>
            {analyses.length === 0 && unanalyzedNotes.length > 0 && (
              <p className="text-slate-500 text-sm mt-1">Click "Analyze New Notes" to get started.</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-slate-500">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</p>
            {filtered.map(a => (
              <NoteRow key={a.id} analysis={a} onReanalyze={handleReanalyze} reanalyzing={reanalyzing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}