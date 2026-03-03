import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Zap, ExternalLink, RefreshCw, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ED_SYSTEM_PROMPT = `You are an Emergency Medicine evidence curator. Your job is to retrieve, rank, and summarize high-quality medical news and research that is clinically actionable for Emergency Physicians.

PRIMARY OBJECTIVE
- Return the highest-quality, evidence-based items that impact ED decision-making, resuscitation, triage, disposition, medication choice, and ED operations.
- Prefer practice-changing updates over general medical news.

ED PRIORITY TOPICS (BOOST)
- Sepsis/septic shock, cardiac arrest, airway/RSI, trauma, massive hemorrhage, ACS/STEMI/NSTEMI, acute heart failure, PE/DVT, stroke/ICH/SAH, respiratory failure, asthma/COPD exacerbation, procedural sedation, toxicology/overdose, pediatric emergencies, OB emergencies, psychiatric emergencies, infectious disease outbreaks relevant to ED, EMS protocols, disaster medicine, mass casualty, ED throughput/boarding/overcrowding.

SOURCE PRIORITY (TRUST & AUTHORITY)
Tier 1 (Highest): NEJM, JAMA, The Lancet, BMJ, Annals of Emergency Medicine, Academic Emergency Medicine, Circulation, Stroke, CHEST, Critical Care Medicine.
Tier 2: ACEP, AHA, ACC, CDC, FDA, NIH, WHO (guidelines, advisories, safety alerts, protocol updates).
Tier 3: Academic medical centers/universities ONLY if tied to peer-reviewed publication or large multicenter trials.
Tier 4 (Secondary): MedPage Today, STAT, Medscape ONLY when clearly linked to primary research or official guidance.

EXCLUSION / DOWNRANK RULES
- Exclude or strongly downrank: outpatient-only chronic management with no ED relevance; basic science without direct ED implications; opinion-only pieces; sponsored/native advertising; articles lacking primary citations.

EVIDENCE HIERARCHY (RANKING)
Rank higher:
1) National/international guidelines, consensus statements, protocol updates.
2) Large multicenter RCTs with ED-relevant outcomes.
3) Systematic reviews/meta-analyses relevant to acute care.
4) Prospective ED-based studies.
5) Large observational cohorts.
6) Expert commentary.

MANDATORY EXTRACTION (NO FABRICATION)
For each selected item, extract ONLY what is supported by the source text provided.

OUTPUT FORMAT (STRICT JSON)
Return a JSON object with:
- topUpdate: string (1-2 sentence overall ED takeaway)
- items: array of up to 7 objects, each with:
  - title: string
  - source: string
  - evidenceType: string (e.g. "RCT", "Guideline", "Meta-analysis", "Cohort", "Press Release")
  - edRelevanceScore: number 1-5
  - evidenceStrengthScore: number 1-5
  - population: string
  - keyResults: string
  - limitations: string
  - edImpact: string
  - bottomLine: string (starts with "On your next shift...")
  - url: string
  - isWeakEvidence: boolean

SAFETY: Do not invent numbers, sample sizes, endpoints, or conclusions. Only use what is in the provided article data.`;

export default function EDPriorityFeed({ articles }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedIdx, setExpandedIdx] = useState(null);

  const generateEDFeed = async () => {
    if (!articles || articles.length === 0) return;
    setLoading(true);
    setError(null);

    const articleSummaries = articles.slice(0, 30).map(a => ({
      title: a.title,
      source: a.sourceName,
      description: a.originalDescription || "",
      url: a.url,
      publishedAt: a.publishedAt,
      category: a.category,
    }));

    try {
      const resp = await base44.integrations.Core.InvokeLLM({
        prompt: `${ED_SYSTEM_PROMPT}\n\nHere are the current medical news articles to curate and rank for Emergency Physicians:\n\n${JSON.stringify(articleSummaries, null, 2)}\n\nReturn only the JSON object as described.`,
        response_json_schema: {
          type: "object",
          properties: {
            topUpdate: { type: "string" },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  source: { type: "string" },
                  evidenceType: { type: "string" },
                  edRelevanceScore: { type: "number" },
                  evidenceStrengthScore: { type: "number" },
                  population: { type: "string" },
                  keyResults: { type: "string" },
                  limitations: { type: "string" },
                  edImpact: { type: "string" },
                  bottomLine: { type: "string" },
                  url: { type: "string" },
                  isWeakEvidence: { type: "boolean" },
                }
              }
            }
          }
        }
      });
      setResult(resp);
    } catch (err) {
      setError("Failed to generate ED Priority feed. Please try again.");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (articles && articles.length > 0 && !result && !loading) {
      generateEDFeed();
    }
  }, [articles]);

  const scoreColor = (score) => {
    if (score >= 4) return "text-emerald-400";
    if (score >= 3) return "text-amber-400";
    return "text-red-400";
  };

  const evidenceTypeBadge = (type) => {
    const map = {
      "Guideline": "bg-blue-900/50 text-blue-300 border-blue-700",
      "RCT": "bg-emerald-900/50 text-emerald-300 border-emerald-700",
      "Meta-analysis": "bg-purple-900/50 text-purple-300 border-purple-700",
      "Systematic Review": "bg-purple-900/50 text-purple-300 border-purple-700",
      "Cohort": "bg-amber-900/50 text-amber-300 border-amber-700",
      "Press Release": "bg-slate-700/50 text-slate-400 border-slate-600",
    };
    return map[type] || "bg-slate-700/50 text-slate-400 border-slate-600";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative mb-4">
          <div className="w-12 h-12 rounded-full border-2 border-red-500/30 flex items-center justify-center">
            <Zap className="w-6 h-6 text-red-400" />
          </div>
          <div className="absolute inset-0 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
        </div>
        <p className="text-sm font-semibold text-white">Curating ED-Priority Articles...</p>
        <p className="text-xs text-slate-400 mt-1">Ranking by evidence strength & clinical relevance</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-10 text-center">
        <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
        <p className="text-sm text-slate-400 mb-4">{error}</p>
        <button onClick={generateEDFeed} className="flex items-center gap-2 bg-red-700/30 border border-red-600/50 text-red-300 text-sm px-4 py-2 rounded-lg mx-auto cursor-pointer hover:bg-red-700/50 transition-colors">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="max-w-4xl mx-auto py-4">
      {/* Top ED Update Banner */}
      {result.topUpdate && (
        <div className="mb-5 bg-red-950/40 border border-red-700/50 rounded-xl p-4 flex items-start gap-3">
          <div className="shrink-0 bg-red-500/20 rounded-lg p-2">
            <Zap className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-1">Top ED Update</p>
            <p className="text-sm text-slate-200 leading-relaxed">{result.topUpdate}</p>
          </div>
          <button onClick={generateEDFeed} title="Refresh" className="ml-auto shrink-0 text-slate-600 hover:text-slate-400 cursor-pointer transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Ranked Items */}
      <div className="space-y-3">
        {(result.items || []).map((item, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
            <div
              className={`bg-[#0d1f3c]/70 border rounded-xl transition-all cursor-pointer ${expandedIdx === idx ? "border-red-600/40" : "border-white/8 hover:border-white/20"}`}
              onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
            >
              {/* Header row */}
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl font-black text-slate-700 w-7 shrink-0 leading-tight">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="text-xs font-bold text-slate-400">{item.source}</span>
                      {item.evidenceType && (
                        <span className={`text-xs px-2 py-0.5 rounded border font-medium ${evidenceTypeBadge(item.evidenceType)}`}>
                          {item.evidenceType}
                        </span>
                      )}
                      {item.isWeakEvidence && (
                        <span className="text-xs px-2 py-0.5 rounded border bg-slate-700/50 text-slate-400 border-slate-600 italic">
                          early/secondary data
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-white leading-snug">{item.title}</p>

                    {/* Scores */}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-slate-500">ED Relevance: <span className={`font-bold ${scoreColor(item.edRelevanceScore)}`}>{item.edRelevanceScore}/5</span></span>
                      <span className="text-xs text-slate-500">Evidence: <span className={`font-bold ${scoreColor(item.evidenceStrengthScore)}`}>{item.evidenceStrengthScore}/5</span></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded detail */}
              <AnimatePresence>
                {expandedIdx === idx && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-0 border-t border-white/8 mt-0 space-y-3">
                      {item.population && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Population</p>
                          <p className="text-xs text-slate-300">{item.population}</p>
                        </div>
                      )}
                      {item.keyResults && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Key Results</p>
                          <p className="text-xs text-slate-300">{item.keyResults}</p>
                        </div>
                      )}
                      {item.limitations && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Limitations</p>
                          <p className="text-xs text-slate-400 italic">{item.limitations}</p>
                        </div>
                      )}
                      {item.edImpact && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">ED Impact</p>
                          <p className="text-xs text-slate-300">{item.edImpact}</p>
                        </div>
                      )}
                      {item.bottomLine && (
                        <div className="bg-red-950/30 border border-red-700/30 rounded-lg p-3">
                          <p className="text-xs font-bold text-red-400 uppercase tracking-wide mb-1">Bottom Line for the Shift</p>
                          <p className="text-xs text-slate-200">{item.bottomLine}</p>
                        </div>
                      )}
                      {item.url && (
                        <a href={item.url} target="_blank" rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium">
                          <ExternalLink className="w-3 h-3" />
                          Read Source
                        </a>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </div>

      <p className="text-xs text-slate-600 text-center mt-6">
        AI-curated for Emergency Medicine. Not individualized medical advice. Always verify with primary sources.
      </p>
    </div>
  );
}