import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, BookOpen, Loader2, ExternalLink, Lightbulb, TrendingUp, Pill, AlertCircle, Plus, Stethoscope, Activity } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function MedicalKnowledgeSearch({ 
  open, 
  onClose, 
  noteContext = {},
  onAddToNote = null
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("general"); // "general", "condition", "medication", "procedure"
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [suggestedQueries, setSuggestedQueries] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    if (open && noteContext && Object.keys(noteContext).length > 0) {
      generateSuggestedQueries();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const generateSuggestedQueries = async () => {
    setLoadingSuggestions(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on this clinical note, suggest 5 relevant medical knowledge queries that would be helpful:

Chief Complaint: ${noteContext.chief_complaint || "N/A"}
Diagnoses: ${noteContext.diagnoses?.join(", ") || "N/A"}
Medications: ${noteContext.medications?.join(", ") || "N/A"}
Assessment: ${noteContext.assessment || "N/A"}

Suggest queries about:
- Differential diagnoses
- Treatment guidelines
- Medication side effects or interactions
- Diagnostic workup
- Prognosis or complications

Return specific, actionable queries that a clinician would search for.`,
        response_json_schema: {
          type: "object",
          properties: {
            queries: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  query: { type: "string" },
                  category: { type: "string" },
                  rationale: { type: "string" }
                }
              }
            }
          }
        }
      });

      setSuggestedQueries(result.queries || []);
    } catch (error) {
      console.error("Failed to generate suggested queries:", error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const getSearchPrompt = (query, type) => {
    const basePrompt = `Search medical literature and clinical guidelines for: "${query}"

Focus on ${type === "medication" ? "pharmacology, dosing, side effects, drug interactions, and clinical use" : type === "condition" ? "pathophysiology, diagnosis, and treatment" : type === "procedure" ? "indications, technique, complications, and outcomes" : "clinical information and evidence-based recommendations"}

Provide:
1. Executive summary (2-3 sentences max)
2. Key facts and evidence level
3. Practical clinical guidance
4. Important contraindications, warnings, or adverse effects
5. Provide relevant source URLs from reputable sources (UpToDate, PubMed, specialty society guidelines)

Keep summary ultra-concise and focus on actionable clinical information.`;

    return basePrompt;
  };

  const handleSearch = async (query, type = searchType) => {
    if (!query.trim()) return;

    setSearchQuery(query);
    setSearching(true);
    setSearchResults(null);

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: getSearchPrompt(query, type),
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            key_points: { type: "array", items: { type: "string" } },
            clinical_recommendations: { type: "array", items: { type: "string" } },
            evidence_level: { type: "string" },
            warnings: { type: "array", items: { type: "string" } },
            guidelines_referenced: { type: "array", items: { type: "string" } },
            source_links: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  url: { type: "string" },
                  source: { type: "string" }
                }
              }
            }
          }
        }
      });

      setSearchResults({ ...result, searchType: type, searchQuery: query });
      toast.success("Search completed");
    } catch (error) {
      console.error("Search failed:", error);
      toast.error("Search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  const handleQuickAdd = (content, section = "assessment") => {
    if (onAddToNote) {
      onAddToNote(content, section);
      toast.success(`Added to ${section}`);
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      "Differential Diagnosis": Lightbulb,
      "Treatment": TrendingUp,
      "Medication": Pill,
      "Diagnostic": Search,
      "Safety": AlertCircle
    };
    return icons[category] || BookOpen;
  };

  const getCategoryColor = (category) => {
    const colors = {
      "Differential Diagnosis": "bg-purple-100 text-purple-700 border-purple-300",
      "Treatment": "bg-blue-100 text-blue-700 border-blue-300",
      "Medication": "bg-green-100 text-green-700 border-green-300",
      "Diagnostic": "bg-amber-100 text-amber-700 border-amber-300",
      "Safety": "bg-red-100 text-red-700 border-red-300"
    };
    return colors[category] || "bg-slate-100 text-slate-700 border-slate-300";
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Medical Knowledge Search
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
           {/* Search Type Selector */}
           <div className="flex gap-2 flex-wrap">
             {[
               { id: "general", label: "General", icon: BookOpen },
               { id: "condition", label: "Condition", icon: Stethoscope },
               { id: "medication", label: "Medication", icon: Pill },
               { id: "procedure", label: "Procedure", icon: Activity }
             ].map(type => (
               <Button
                 key={type.id}
                 variant={searchType === type.id ? "default" : "outline"}
                 size="sm"
                 onClick={() => setSearchType(type.id)}
                 className="gap-1.5"
               >
                 <type.icon className="w-4 h-4" />
                 {type.label}
               </Button>
             ))}
           </div>

           {/* Search Bar */}
           <div className="flex gap-2">
             <Input
               placeholder={`Search for ${searchType === "medication" ? "drugs, interactions, side effects..." : searchType === "condition" ? "diagnoses, symptoms, diseases..." : searchType === "procedure" ? "procedures, techniques, interventions..." : "medical topics, guidelines..."}`}
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               onKeyPress={(e) => e.key === "Enter" && handleSearch(searchQuery, searchType)}
               className="flex-1"
             />
             <Button 
               onClick={() => handleSearch(searchQuery, searchType)}
               disabled={searching || !searchQuery.trim()}
               className="gap-2"
             >
               {searching ? (
                 <Loader2 className="w-4 h-4 animate-spin" />
               ) : (
                 <Search className="w-4 h-4" />
               )}
               Search
             </Button>
           </div>

          {/* Suggested Queries */}
          {suggestedQueries.length > 0 && (
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                Suggested Searches Based on This Note
              </h3>
              {loadingSuggestions ? (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating suggestions...
                </div>
              ) : (
                <div className="space-y-2">
                  {suggestedQueries.map((sq, idx) => {
                    const Icon = getCategoryIcon(sq.category);
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSearch(sq.query)}
                        className="w-full text-left bg-white rounded-lg p-3 border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getCategoryColor(sq.category)} border flex-shrink-0`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 group-hover:text-blue-700">
                              {sq.query}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">{sq.rationale}</p>
                          </div>
                          <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-500 flex-shrink-0" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Search Results */}
          {searching && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
                <p className="text-sm text-slate-600">Searching medical knowledge base...</p>
              </div>
            </div>
          )}

          {searchResults && !searching && (
            <div className="space-y-4">
              {/* Summary with Source Links */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Summary
                </h3>
                <p className="text-sm text-blue-800 leading-relaxed mb-3">{searchResults.summary}</p>

                {/* Evidence Level Badge */}
                {searchResults.evidence_level && (
                  <Badge className="mb-3 bg-blue-100 text-blue-700 border border-blue-300">
                    Evidence Level: {searchResults.evidence_level}
                  </Badge>
                )}

                {/* Reference Links */}
                {searchResults.source_links && searchResults.source_links.length > 0 && (
                  <div className="space-y-2 pt-3 border-t border-blue-200">
                    <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide">References</p>
                    <div className="space-y-1.5">
                      {searchResults.source_links.map((link, idx) => (
                        <a
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-2 text-xs text-blue-700 hover:text-blue-900 hover:underline break-all transition-colors"
                        >
                          <ExternalLink className="w-3 h-3 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <span className="font-medium">{link.source}:</span> {link.title}
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Key Points */}
              {searchResults.key_points && searchResults.key_points.length > 0 && (
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">Key Points</h3>
                  <ul className="space-y-2">
                    {searchResults.key_points.map((point, idx) => (
                      <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                        <span className="text-blue-500 mt-1 flex-shrink-0">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Clinical Recommendations */}
              {searchResults.clinical_recommendations && searchResults.clinical_recommendations.length > 0 && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h3 className="text-sm font-semibold text-green-900 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Clinical Recommendations
                  </h3>
                  <ul className="space-y-2">
                    {searchResults.clinical_recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm text-green-800 flex items-start gap-2">
                        <span className="text-green-600 mt-1 flex-shrink-0">✓</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warnings */}
              {searchResults.warnings && searchResults.warnings.length > 0 && (
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <h3 className="text-sm font-semibold text-red-900 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Important Warnings & Contraindications
                  </h3>
                  <ul className="space-y-2">
                    {searchResults.warnings.map((warning, idx) => (
                      <li key={idx} className="text-sm text-red-800 flex items-start gap-2">
                        <span className="text-red-600 mt-1 flex-shrink-0">⚠</span>
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Guidelines Referenced */}
              {searchResults.guidelines_referenced && searchResults.guidelines_referenced.length > 0 && (
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <h3 className="text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Guidelines Referenced
                  </h3>
                  <ul className="space-y-1">
                    {searchResults.guidelines_referenced.map((guideline, idx) => (
                      <li key={idx} className="text-sm text-purple-800">• {guideline}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Quick Add Section */}
              {onAddToNote && (
                <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                  <h3 className="text-sm font-semibold text-emerald-900 mb-3 flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add to Note
                  </h3>
                  <div className="space-y-2">
                    <p className="text-xs text-emerald-800 mb-2">Quick add to note section:</p>
                    {["assessment", "plan", "medications"].map(section => (
                      <Button
                        key={section}
                        onClick={() => handleQuickAdd(searchResults.summary, section)}
                        variant="outline"
                        size="sm"
                        className="w-full gap-2 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                      >
                        <Plus className="w-4 h-4" />
                        Add Summary to {section.charAt(0).toUpperCase() + section.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!searching && !searchResults && (
            <div className="text-center py-12 text-slate-500">
              <Search className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm">Enter a search query or select a suggested search above</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}