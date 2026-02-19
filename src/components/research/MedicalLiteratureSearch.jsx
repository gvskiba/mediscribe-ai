import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, ExternalLink, BookOpen, Lightbulb, CheckCircle2, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function MedicalLiteratureSearch({ note }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error("Please enter a medical query");
      return;
    }

    setLoading(true);
    setResults(null);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a medical research expert. Search for and summarize relevant medical literature, clinical trials, and guidelines for the following query:

MEDICAL QUERY: ${query}

Provide a comprehensive summary including:
1. Recent clinical trials and their findings
2. Relevant clinical guidelines and recommendations
3. Key research papers and their conclusions
4. Treatment options and efficacy data
5. Potential risks and contraindications

For each finding, include:
- Title/Name of the research or guideline
- Key finding or recommendation
- Source type (clinical trial, guideline, research paper, etc.)
- Year/Publication date if available
- Relevance to the query

Format the response to be clear, evidence-based, and actionable for clinical use.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            clinical_trials: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  finding: { type: "string" },
                  year: { type: "string" },
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
                  considerations: { type: "string" }
                }
              }
            },
            key_takeaways: { type: "array", items: { type: "string" } }
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

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
        <p className="font-semibold mb-1">Medical Literature Search</p>
        <p>Search for clinical trials, guidelines, and research on any medical condition, treatment, or drug.</p>
      </div>

      {/* Search Input */}
      <div className="flex gap-2">
        <Input
          placeholder="e.g., Hypertension management, COVID-19 vaccines, Aspirin dosing..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
          className="text-sm"
        />
        <Button
          onClick={handleSearch}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2 flex-shrink-0"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </Button>
      </div>

      {results && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-bold text-slate-700 uppercase mb-2">Overview</p>
            <p className="text-sm text-slate-600 leading-relaxed">{results.summary}</p>
          </div>

          {/* Key Takeaways */}
          {results.key_takeaways?.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-xs font-bold text-green-900 uppercase mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Key Takeaways
              </p>
              <ul className="space-y-1">
                {results.key_takeaways.map((takeaway, i) => (
                  <li key={i} className="text-xs text-green-800 flex gap-2">
                    <span className="text-green-600 font-bold">•</span>
                    <span>{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Clinical Trials */}
          {results.clinical_trials?.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-xs font-bold text-slate-700 uppercase mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Clinical Trials
              </p>
              <div className="space-y-2">
                {results.clinical_trials.map((trial, i) => (
                  <div key={i} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                    <p className="font-semibold text-xs text-slate-900">{trial.title}</p>
                    <p className="text-xs text-slate-600 mt-1">{trial.finding}</p>
                    {trial.year && <p className="text-xs text-slate-500 mt-1">Published: {trial.year}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Guidelines */}
          {results.guidelines?.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-xs font-bold text-slate-700 uppercase mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Guidelines & Recommendations
              </p>
              <div className="space-y-2">
                {results.guidelines.map((guideline, i) => (
                  <div key={i} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-semibold text-xs text-slate-900">{guideline.name}</p>
                      <span className={`text-xs px-2 py-1 rounded ${
                        guideline.strength === 'strong' ? 'bg-green-100 text-green-700' :
                        guideline.strength === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {guideline.strength?.charAt(0).toUpperCase() + guideline.strength?.slice(1)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{guideline.recommendation}</p>
                    {guideline.source && <p className="text-xs text-slate-500 mt-1">Source: {guideline.source}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Research Papers */}
          {results.research_papers?.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-xs font-bold text-slate-700 uppercase mb-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" /> Research Papers
              </p>
              <div className="space-y-2">
                {results.research_papers.map((paper, i) => (
                  <div key={i} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                    <p className="font-semibold text-xs text-slate-900">{paper.title}</p>
                    <p className="text-xs text-slate-600 mt-1"><strong>Methodology:</strong> {paper.methodology}</p>
                    <p className="text-xs text-slate-600"><strong>Conclusion:</strong> {paper.conclusion}</p>
                    {paper.year && <p className="text-xs text-slate-500 mt-1">Published: {paper.year}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Treatment Options */}
          {results.treatment_options?.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-xs font-bold text-slate-700 uppercase mb-3">Treatment Options</p>
              <div className="space-y-2">
                {results.treatment_options.map((option, i) => (
                  <div key={i} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                    <p className="font-semibold text-xs text-slate-900">{option.option}</p>
                    <p className="text-xs text-slate-600 mt-1"><strong>Efficacy:</strong> {option.efficacy}</p>
                    <p className="text-xs text-slate-600"><strong>Considerations:</strong> {option.considerations}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}