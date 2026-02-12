import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, BookOpen, ExternalLink, Quote, Plus, Sparkles, FileText } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function MedicalLiteratureSearch({ noteContext, onAddToNote }) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedArticles, setSelectedArticles] = useState([]);

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error("Please enter a search query");
      return;
    }

    setSearching(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Search for relevant medical literature, research papers, and clinical guidelines for the following query:

SEARCH QUERY: ${query}

${noteContext ? `
CLINICAL CONTEXT:
- Chief Complaint: ${noteContext.chief_complaint || "Not specified"}
- Diagnoses: ${noteContext.diagnoses?.join(", ") || "None"}
- Assessment: ${noteContext.assessment || "Not documented"}
` : ""}

Find 5-7 highly relevant, recent, and evidence-based sources including:
1. Peer-reviewed research papers
2. Clinical guidelines from major organizations (AHA, ACC, ACP, etc.)
3. Systematic reviews or meta-analyses
4. High-quality clinical studies

For each source, provide:
- Title
- Authors/Organization
- Publication year
- Journal/Source
- Key findings (2-3 sentences)
- Clinical relevance
- Citation format (AMA style)
- URL or DOI if available`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            search_summary: { type: "string" },
            results: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  authors: { type: "string" },
                  year: { type: "string" },
                  source: { type: "string" },
                  key_findings: { type: "string" },
                  clinical_relevance: { type: "string" },
                  citation: { type: "string" },
                  url: { type: "string" },
                  type: { 
                    type: "string",
                    enum: ["research_paper", "clinical_guideline", "systematic_review", "meta_analysis", "clinical_study"]
                  },
                  quality_level: {
                    type: "string",
                    enum: ["high", "moderate"]
                  }
                }
              }
            }
          }
        }
      });

      setResults(result.results || []);
      if (result.results?.length === 0) {
        toast.info("No results found. Try refining your search.");
      }
    } catch (error) {
      console.error("Search failed:", error);
      toast.error("Search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  const handleToggleSelect = (index) => {
    setSelectedArticles(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleAddSelected = () => {
    if (selectedArticles.length === 0) {
      toast.error("Please select at least one article");
      return;
    }

    const selectedRefs = selectedArticles.map(i => results[i]);
    const citationText = selectedRefs.map(ref => 
      `\n\n${ref.citation}\nKey Findings: ${ref.key_findings}`
    ).join("\n");

    onAddToNote?.(citationText);
    toast.success(`Added ${selectedArticles.length} citation(s) to note`);
    setSelectedArticles([]);
  };

  const typeColors = {
    research_paper: "bg-blue-100 text-blue-800 border-blue-300",
    clinical_guideline: "bg-purple-100 text-purple-800 border-purple-300",
    systematic_review: "bg-green-100 text-green-800 border-green-300",
    meta_analysis: "bg-orange-100 text-orange-800 border-orange-300",
    clinical_study: "bg-cyan-100 text-cyan-800 border-cyan-300"
  };

  const typeLabels = {
    research_paper: "Research Paper",
    clinical_guideline: "Clinical Guideline",
    systematic_review: "Systematic Review",
    meta_analysis: "Meta-Analysis",
    clinical_study: "Clinical Study"
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Medical Literature Search</h2>
            <p className="text-sm text-slate-600">AI-powered search for research papers, guidelines, and clinical evidence</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search for medical literature, guidelines, or clinical evidence..."
            className="flex-1 h-12 text-base"
            disabled={searching}
          />
          <Button
            onClick={handleSearch}
            disabled={searching || !query.trim()}
            className="h-12 px-6 bg-indigo-600 hover:bg-indigo-700"
          >
            {searching ? (
              <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Searching...</>
            ) : (
              <><Search className="w-5 h-5 mr-2" /> Search</>
            )}
          </Button>
        </div>

        {noteContext && (
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs text-slate-600">Context-aware search using:</span>
            {noteContext.chief_complaint && (
              <Badge variant="outline" className="text-xs">CC: {noteContext.chief_complaint.substring(0, 30)}...</Badge>
            )}
            {noteContext.diagnoses?.length > 0 && (
              <Badge variant="outline" className="text-xs">{noteContext.diagnoses.length} diagnosis(es)</Badge>
            )}
          </div>
        )}
      </div>

      {/* Selected Articles Actions */}
      {selectedArticles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between"
        >
          <p className="text-sm font-medium text-blue-900">
            {selectedArticles.length} article{selectedArticles.length > 1 ? "s" : ""} selected
          </p>
          <Button
            onClick={handleAddSelected}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" /> Add to Note
          </Button>
        </motion.div>
      )}

      {/* Results */}
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                Search Results ({results.length})
              </h3>
            </div>

            {results.map((article, index) => {
              const isSelected = selectedArticles.includes(index);
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-white rounded-xl border-2 p-5 transition-all cursor-pointer ${
                    isSelected 
                      ? "border-blue-500 bg-blue-50/50 shadow-md" 
                      : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                  }`}
                  onClick={() => handleToggleSelect(index)}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isSelected ? "bg-blue-600" : "bg-slate-100"
                    }`}>
                      {isSelected ? (
                        <Quote className="w-5 h-5 text-white" />
                      ) : (
                        <BookOpen className="w-5 h-5 text-slate-600" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h4 className="text-base font-semibold text-slate-900 leading-snug">
                          {article.title}
                        </h4>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {article.quality_level === "high" && (
                            <Badge className="bg-green-100 text-green-800 border border-green-300">
                              High Quality
                            </Badge>
                          )}
                          <Badge className={`${typeColors[article.type]} border`}>
                            {typeLabels[article.type]}
                          </Badge>
                        </div>
                      </div>

                      <p className="text-sm text-slate-600 mb-1">
                        {article.authors} ({article.year})
                      </p>
                      <p className="text-sm text-slate-500 italic mb-3">
                        {article.source}
                      </p>

                      <div className="bg-slate-50 rounded-lg p-3 mb-3">
                        <p className="text-xs font-semibold text-slate-700 mb-1">Key Findings:</p>
                        <p className="text-sm text-slate-700 leading-relaxed">{article.key_findings}</p>
                      </div>

                      <div className="bg-indigo-50 rounded-lg p-3 mb-3">
                        <p className="text-xs font-semibold text-indigo-900 mb-1">Clinical Relevance:</p>
                        <p className="text-sm text-indigo-800 leading-relaxed">{article.clinical_relevance}</p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-600 mb-1">Citation:</p>
                          <p className="text-xs text-slate-700 font-mono bg-slate-100 p-2 rounded">
                            {article.citation}
                          </p>
                        </div>
                        {article.url && (
                          <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="ml-3 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            <ExternalLink className="w-4 h-4" />
                            View
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!searching && results.length === 0 && (
        <div className="text-center py-16 px-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Search Medical Literature</h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Enter a query to search for research papers, clinical guidelines, and evidence-based medicine resources.
            Results will be tailored to your clinical context.
          </p>
        </div>
      )}
    </div>
  );
}