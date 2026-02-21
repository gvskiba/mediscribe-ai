import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2, Search, BookOpen, Lightbulb, CheckCircle2,
  AlertCircle, FlaskConical, Stethoscope, Sparkles, ChevronDown, ChevronUp, X
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const strengthColors = {
  strong: "bg-emerald-100 text-emerald-800 border-emerald-200",
  moderate: "bg-yellow-100 text-yellow-800 border-yellow-200",
  weak: "bg-orange-100 text-orange-800 border-orange-200",
};

function CollapsibleCard({ title, subtitle, badge, badgeClass, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white hover:border-slate-300 transition-all">
      <button
        className="w-full flex items-start justify-between p-4 text-left"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex-1 min-w-0 pr-2">
          <p className="text-sm font-semibold text-slate-900 leading-snug">{title}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {badge && (
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${badgeClass}`}>{badge}</span>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 text-xs text-slate-600 space-y-1 border-t border-slate-100 pt-3">
          {children}
        </div>
      )}
    </div>
  );
}

export default function MedicalLiteratureSearch({ note }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [activeQuery, setActiveQuery] = useState("");

  // Auto-suggested queries from note context
  const suggestions = [
    ...(note?.diagnoses?.slice(0, 3) || []).map(d => {
      const clean = d.replace(/^[A-Z0-9.]+\s*-\s*/, "").trim();
      return clean;
    }),
    note?.chief_complaint,
  ].filter(Boolean).slice(0, 4);

  const handleSearch = async (searchQuery) => {
    const q = searchQuery || query;
    if (!q.trim()) {
      toast.error("Please enter a medical query");
      return;
    }
    setLoading(true);
    setResults(null);
    setActiveQuery(q);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a clinical research expert with access to current medical literature. Provide a comprehensive, evidence-based literature summary for:

QUERY: "${q}"
${note?.patient_age ? `PATIENT AGE: ${note.patient_age}` : ""}
${note?.diagnoses?.length ? `CONTEXT DIAGNOSES: ${note.diagnoses.join(", ")}` : ""}

Return well-structured, clinically actionable information including:
1. A concise overview/summary (2-3 sentences)
2. Up to 5 key clinical trials with real names, findings, and years
3. Up to 5 clinical practice guidelines (ACC/AHA, WHO, NICE, USPSTF, etc.) with recommendations and evidence strength
4. Up to 4 notable research papers with methodology and conclusions
5. Up to 5 evidence-based treatment options with efficacy data
6. 4-6 key clinical takeaways

Be specific, cite real studies/guidelines where possible, and prioritize recent evidence (last 5 years preferred).`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            key_takeaways: { type: "array", items: { type: "string" } },
            clinical_trials: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  finding: { type: "string" },
                  year: { type: "string" },
                  n_size: { type: "string" },
                  relevance: { type: "string" }
                }
              }
            },
            guidelines: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  recommendation: { type: "string" },
                  source: { type: "string" },
                  year: { type: "string" },
                  strength: { type: "string", enum: ["strong", "moderate", "weak"] }
                }
              }
            },
            research_papers: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  conclusion: { type: "string" },
                  methodology: { type: "string" },
                  year: { type: "string" }
                }
              }
            },
            treatment_options: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  option: { type: "string" },
                  efficacy: { type: "string" },
                  considerations: { type: "string" },
                  evidence_level: { type: "string" }
                }
              }
            }
          }
        }
      });
      setResults(response);
    } catch (error) {
      console.error("Search failed:", error);
      toast.error("Failed to search medical literature");
    } finally {
      setLoading(false);
    }
  };

  const totalResults = results ? (
    (results.clinical_trials?.length || 0) +
    (results.guidelines?.length || 0) +
    (results.research_papers?.length || 0) +
    (results.treatment_options?.length || 0)
  ) : 0;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <Input
          placeholder="Search by condition, drug, treatment, symptom..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
          className="text-sm"
        />
        <Button
          onClick={() => handleSearch()}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2 flex-shrink-0 px-4"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {!loading && <span className="hidden sm:inline">Search</span>}
        </Button>
      </div>

      {/* Quick Suggestions from Note */}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> From this note:
          </span>
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => { setQuery(s); handleSearch(s); }}
              className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-full px-3 py-1 transition-colors"
            >
              {s.length > 40 ? s.slice(0, 40) + "…" : s}
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          </div>
          <p className="text-sm font-medium text-slate-700">Searching medical literature…</p>
          <p className="text-xs text-slate-500">Scanning clinical trials, guidelines & research papers</p>
        </div>
      )}

      {/* Results */}
      {results && !loading && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">Results for: <span className="text-blue-600">"{activeQuery}"</span></p>
              <p className="text-xs text-slate-500">{totalResults} sources found</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setResults(null)} className="text-slate-400 hover:text-slate-600 h-7 w-7 p-0">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Overview */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
            <p className="text-xs font-bold text-blue-900 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" /> Clinical Overview
            </p>
            <p className="text-sm text-slate-700 leading-relaxed">{results.summary}</p>
          </div>

          {/* Key Takeaways */}
          {results.key_takeaways?.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <p className="text-xs font-bold text-emerald-900 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Key Clinical Takeaways
              </p>
              <ul className="space-y-2">
                {results.key_takeaways.map((t, i) => (
                  <li key={i} className="flex gap-2 text-sm text-emerald-800">
                    <span className="text-emerald-500 font-bold flex-shrink-0 mt-0.5">✓</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tabbed Results */}
          <Tabs defaultValue="guidelines" className="w-full">
            <TabsList className="grid grid-cols-4 h-auto p-1 bg-slate-100 rounded-xl">
              <TabsTrigger value="guidelines" className="text-xs py-2 rounded-lg">
                <BookOpen className="w-3 h-3 mr-1" />
                Guidelines
                {results.guidelines?.length > 0 && (
                  <span className="ml-1 bg-white text-slate-600 rounded-full px-1.5 text-xs font-bold">{results.guidelines.length}</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="trials" className="text-xs py-2 rounded-lg">
                <FlaskConical className="w-3 h-3 mr-1" />
                Trials
                {results.clinical_trials?.length > 0 && (
                  <span className="ml-1 bg-white text-slate-600 rounded-full px-1.5 text-xs font-bold">{results.clinical_trials.length}</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="papers" className="text-xs py-2 rounded-lg">
                <Lightbulb className="w-3 h-3 mr-1" />
                Research
                {results.research_papers?.length > 0 && (
                  <span className="ml-1 bg-white text-slate-600 rounded-full px-1.5 text-xs font-bold">{results.research_papers.length}</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="treatment" className="text-xs py-2 rounded-lg">
                <Stethoscope className="w-3 h-3 mr-1" />
                Treatment
                {results.treatment_options?.length > 0 && (
                  <span className="ml-1 bg-white text-slate-600 rounded-full px-1.5 text-xs font-bold">{results.treatment_options.length}</span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Guidelines */}
            <TabsContent value="guidelines" className="mt-3 space-y-2">
              {results.guidelines?.length > 0 ? results.guidelines.map((g, i) => (
                <CollapsibleCard
                  key={i}
                  title={g.name}
                  subtitle={[g.source, g.year].filter(Boolean).join(" · ")}
                  badge={g.strength ? g.strength.charAt(0).toUpperCase() + g.strength.slice(1) : null}
                  badgeClass={strengthColors[g.strength] || strengthColors.weak}
                >
                  <p className="leading-relaxed">{g.recommendation}</p>
                </CollapsibleCard>
              )) : (
                <p className="text-sm text-slate-400 text-center py-8">No guidelines found</p>
              )}
            </TabsContent>

            {/* Clinical Trials */}
            <TabsContent value="trials" className="mt-3 space-y-2">
              {results.clinical_trials?.length > 0 ? results.clinical_trials.map((t, i) => (
                <CollapsibleCard
                  key={i}
                  title={t.title}
                  subtitle={[t.year, t.n_size ? `n=${t.n_size}` : null].filter(Boolean).join(" · ")}
                >
                  <p className="leading-relaxed mb-1"><strong>Finding:</strong> {t.finding}</p>
                  {t.relevance && <p className="text-slate-500"><strong>Relevance:</strong> {t.relevance}</p>}
                </CollapsibleCard>
              )) : (
                <p className="text-sm text-slate-400 text-center py-8">No clinical trials found</p>
              )}
            </TabsContent>

            {/* Research Papers */}
            <TabsContent value="papers" className="mt-3 space-y-2">
              {results.research_papers?.length > 0 ? results.research_papers.map((p, i) => (
                <CollapsibleCard
                  key={i}
                  title={p.title}
                  subtitle={p.year}
                >
                  {p.methodology && <p className="mb-1"><strong>Methodology:</strong> {p.methodology}</p>}
                  <p><strong>Conclusion:</strong> {p.conclusion}</p>
                </CollapsibleCard>
              )) : (
                <p className="text-sm text-slate-400 text-center py-8">No research papers found</p>
              )}
            </TabsContent>

            {/* Treatment Options */}
            <TabsContent value="treatment" className="mt-3 space-y-2">
              {results.treatment_options?.length > 0 ? results.treatment_options.map((t, i) => (
                <CollapsibleCard
                  key={i}
                  title={t.option}
                  subtitle={t.evidence_level ? `Evidence: ${t.evidence_level}` : null}
                >
                  <p className="mb-1"><strong>Efficacy:</strong> {t.efficacy}</p>
                  <p><strong>Considerations:</strong> {t.considerations}</p>
                </CollapsibleCard>
              )) : (
                <p className="text-sm text-slate-400 text-center py-8">No treatment options found</p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}