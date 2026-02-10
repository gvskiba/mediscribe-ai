import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import GuidelineSearchBar from "../components/guidelines/GuidelineSearchBar";
import GuidelineAnswer from "../components/guidelines/GuidelineAnswer";
import RecentQueryCard from "../components/dashboard/RecentQueryCard";
import CompareGuidelines from "../components/guidelines/CompareGuidelines";
import PersonalizedRecommendations from "../components/guidelines/PersonalizedRecommendations";
import { trackGuidelineView, trackGuidelineSearch } from "../components/guidelines/GuidelineViewTracker";
import GuidlineSummaryCard from "../components/guidelines/GuidlineSummaryCard";
import { generateMultipleSummaries } from "../components/guidelines/AutoSummaryGenerator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Search, Loader2, Sparkles, Filter, ArrowLeftRight, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";

export default function Guidelines() {
  const [isLoading, setIsLoading] = useState(false);
  const [latestAnswer, setLatestAnswer] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterConfidence, setFilterConfidence] = useState("all");
  const [filterDateRange, setFilterDateRange] = useState("all");
  const [viewMode, setViewMode] = useState("search");
  const [relatedGuidelines, setRelatedGuidelines] = useState([]);
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [showCompare, setShowCompare] = useState(false);
  const [comparison, setComparison] = useState(null);
  const [comparing, setComparing] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [resultsCollapsed, setResultsCollapsed] = useState(false);
  const queryClient = useQueryClient();

  const { data: pastQueries = [], isLoading: queriesLoading } = useQuery({
    queryKey: ["queries"],
    queryFn: () => base44.entities.GuidelineQuery.list("-created_date", 50),
  });

  const handleSubmit = async (question, attachedFiles = []) => {
    setIsLoading(true);
    setLatestAnswer(null);
    setSearchTerm("");
    trackGuidelineSearch(question);

    let contextSection = "";
    if (attachedFiles.length > 0) {
      contextSection = `\n\nPATIENT-SPECIFIC CONTEXT:\nThe clinician has provided the following files for personalized recommendations:\n${attachedFiles.map(f => f.name).join(", ")}\n\nPlease analyze these documents and provide guidelines tailored to this specific patient's data (labs, imaging, etc.).`;
    }

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an advanced clinical evidence expert with real-time access to medical databases. Answer this clinical question using the most current, evidence-based guidelines and medical literature.

Question: ${question}${contextSection}

CRITICAL INSTRUCTIONS FOR SEARCHING EXTERNAL DATABASES:
1. **FIRST**, search OpenEvidence.com directly for this clinical question - it's a comprehensive medical evidence database with up-to-date guidelines
2. Search PubMed/MEDLINE for recent meta-analyses and systematic reviews
3. Access current practice guidelines from major medical societies
4. Check UpToDate and DynaMed for clinical decision support

REQUIRED SOURCE DATABASES (search ALL that are relevant):
- OpenEvidence (https://www.openevidence.com) - PRIMARY SOURCE for evidence synthesis
- PubMed Central / MEDLINE
- Cochrane Library (systematic reviews)
- Professional Society Guidelines:
  * ACC/AHA (cardiology) - https://www.acc.org/guidelines
  * ADA (diabetes) - https://diabetesjournals.org/care/issue
  * IDSA (infectious disease) - https://www.idsociety.org/practice-guideline
  * ATS/CHEST (pulmonary)
  * ESC (European cardiology)
  * NICE (UK guidelines) - https://www.nice.org.uk
- UpToDate clinical topics

OUTPUT REQUIREMENTS:
1. **Answer**: Comprehensive, evidence-based response with specific recommendations
2. **Drug/Treatment Details**: Include names, dosages, class of recommendation (I/IIa/IIb/III), level of evidence (A/B/C)
3. **Recent Updates**: Note any 2024-2026 guideline updates or controversies
4. **Format**: Use markdown headers for clear organization

5. **Sources**: For EACH source, provide:
   - Full citation with year
   - Direct URL/DOI when available (especially OpenEvidence links)
   - Specific section/page referenced
   
Example source format:
"2024 ACC/AHA Heart Failure Guidelines (Class I, Level A) - https://www.acc.org/guidelines/hf-2024"
"OpenEvidence: Management of Atrial Fibrillation - https://www.openevidence.com/topics/atrial-fibrillation"

6. **Confidence Assessment**:
   - High: Multiple concordant high-quality RCTs, current guidelines, strong evidence
   - Moderate: Some RCT evidence, guidelines exist but evolving, moderate-quality evidence
   - Low: Limited evidence, case series, expert opinion, conflicting studies

7. **Category**: Assign appropriate medical specialty

${attachedFiles.length > 0 ? "8. **Personalization**: Integrate patient-specific data from attached files into recommendations" : ""}`,
      add_context_from_internet: true,
      file_urls: attachedFiles.length > 0 ? attachedFiles.map(f => f.url) : undefined,
      response_json_schema: {
        type: "object",
        properties: {
          answer: { type: "string" },
          category: { type: "string" },
          confidence_level: { type: "string" },
          sources: { 
            type: "array", 
            items: { 
              type: "string",
              description: "Full citation with URL/DOI when available"
            } 
          },
        },
      },
    });

    const relatedQuestionsResult = await base44.integrations.Core.InvokeLLM({
      prompt: `Based on this clinical question: "${question}"

And this answer context:
${result.answer.substring(0, 500)}...

Generate 3 related clinical questions that would be valuable follow-ups or related topics a clinician might want to explore. Make them specific and clinically relevant.`,
      response_json_schema: {
        type: "object",
        properties: {
          questions: { type: "array", items: { type: "string" } },
        },
      },
    });

    const queryData = {
      question,
      answer: result.answer,
      category: result.category,
      confidence_level: result.confidence_level,
      sources: result.sources || [],
      related_questions: relatedQuestionsResult.questions || [],
    };

    const created = await base44.entities.GuidelineQuery.create(queryData);
    const newQuery = { ...queryData, id: created.id };
    setLatestAnswer(newQuery);
    generateRelatedGuidelines(newQuery);
    queryClient.invalidateQueries({ queryKey: ["queries"] });
    setIsLoading(false);
  };

  const generateRelatedGuidelines = async (currentQuery) => {
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on this clinical guideline query and answer, suggest related guidelines that a clinician might find helpful.

Current Query: "${currentQuery.question}"
Category: ${currentQuery.category}
Answer excerpt: ${currentQuery.answer.substring(0, 300)}...

Suggest 4-6 related guideline topics that would be clinically relevant. Consider:
- Related conditions or complications
- Alternative treatment approaches
- Monitoring or follow-up guidelines
- Preventive measures
- Drug interactions or contraindications
- Comorbidity management

Format each as a concise clinical question (similar to the original).`,
        response_json_schema: {
          type: "object",
          properties: {
            related_topics: { 
              type: "array", 
              items: { 
                type: "object",
                properties: {
                  question: { type: "string" },
                  reason: { type: "string" }
                }
              } 
            },
          },
        },
      });
      
      setRelatedGuidelines(result.related_topics || []);
    } catch (error) {
      console.error("Error generating related guidelines:", error);
    }
  };

  const rateMutation = useMutation({
    mutationFn: ({ queryId, rating }) => 
      base44.entities.GuidelineQuery.update(queryId, { rating }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["queries"] });
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: ({ queryId, isFavorite }) => 
      base44.entities.GuidelineQuery.update(queryId, { is_favorite: isFavorite }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["queries"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (queryId) => 
      base44.entities.GuidelineQuery.delete(queryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["queries"] });
      if (selectedQuery) {
        setSelectedQuery(null);
        setLatestAnswer(null);
      }
    },
  });

  const handleRate = async (queryId, rating) => {
    await rateMutation.mutateAsync({ queryId, rating });
    if (latestAnswer && latestAnswer.id === queryId) {
      setLatestAnswer(prev => ({ ...prev, rating }));
    }
  };

  const handleToggleFavorite = async (queryId, currentIsFavorite) => {
    await toggleFavoriteMutation.mutateAsync({ 
      queryId, 
      isFavorite: !currentIsFavorite 
    });
    if (latestAnswer && latestAnswer.id === queryId) {
      setLatestAnswer(prev => ({ ...prev, is_favorite: !prev.is_favorite }));
    }
    if (selectedQuery && selectedQuery.id === queryId) {
      setSelectedQuery(prev => ({ ...prev, is_favorite: !prev.is_favorite }));
    }
  };

  const handleDelete = async (queryId) => {
    await deleteMutation.mutateAsync(queryId);
  };

  const handleSelectRelatedQuestion = (question) => {
    handleSubmit(question);
  };

  const handleSelectQuery = (query) => {
    setSelectedQuery(query);
    setLatestAnswer(null);
    trackGuidelineView(query.id);
    generateRelatedGuidelines(query);
  };

  const toggleSelectForCompare = (query) => {
    setSelectedForCompare(prev => {
      const exists = prev.find(q => q.id === query.id);
      if (exists) {
        return prev.filter(q => q.id !== query.id);
      } else {
        return [...prev, query];
      }
    });
  };

  const handleCompareGuidelines = async (focusAspects = ["medications", "diagnostics", "treatment", "evidence"]) => {
    if (selectedForCompare.length < 2) return;
    
    setComparing(true);
    if (!showCompare) setShowCompare(true);
    setComparison(null);

    const aspectInstructions = {
      medications: `- **Drug Recommendations**: Compare medication choices with specific names, dosing regimens, duration, monitoring requirements. Highlight first-line vs. alternatives, generic vs. brand considerations, and cost-effectiveness.`,
      diagnostics: `- **Diagnostic Criteria**: Compare diagnostic tests, imaging modalities, laboratory thresholds, sensitivity/specificity considerations, and diagnostic algorithms. Note when to use each test.`,
      treatment: `- **Treatment Protocols**: Compare overall management strategies, timing of interventions, escalation criteria, combination therapies, and non-pharmacological approaches.`,
      evidence: `- **Evidence Quality**: Compare strength of evidence (Level A/B/C), types of studies cited (RCTs, meta-analyses, observational), sample sizes, publication years, and consensus levels.`
    };

    const selectedInstructions = focusAspects.map(aspect => aspectInstructions[aspect]).join('\n');

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a clinical evidence expert with expertise in guideline analysis. Compare these clinical guidelines with deep focus on the selected aspects.

GUIDELINES TO COMPARE:
${selectedForCompare.map((g, i) => `
GUIDELINE ${i + 1}:
Question: ${g.question}
Category: ${g.category}
Confidence Level: ${g.confidence_level}
Answer: ${g.answer}
Sources: ${g.sources?.join('; ') || 'None'}
Created: ${new Date(g.created_date).toLocaleDateString()}
`).join('\n━━━━━━━━━━━━━━━\n')}

FOCUSED COMPARISON REQUIREMENTS - ANALYZE THESE ASPECTS IN DEPTH:
${selectedInstructions}

For the focused aspects above, provide:

1. **Side-by-Side Analysis Table**
   - Create a detailed comparison table for each selected aspect
   - Use columns for each guideline
   - Highlight agreements (✓) and disagreements (✗)

2. **Discrepancy Analysis** (CRITICAL)
   For each disagreement, explain potential reasons:
   - **Regional Variations**: Different practice patterns (US vs. European guidelines)
   - **Evidence Updates**: One guideline may reflect newer studies or trials
   - **Population Differences**: Guidelines may target different patient demographics
   - **Specialty Perspectives**: Cardiology vs. internal medicine approaches may differ
   - **Resource Considerations**: Availability and cost of interventions
   - **Risk Tolerance**: Conservative vs. aggressive treatment philosophies
   - **Regulatory Factors**: FDA vs. EMA approval status, local regulations

3. **Evidence Timeline**
   - When was each guideline's evidence base established?
   - Have there been major trials published since?
   - Which guideline reflects the most current evidence?

4. **Practical Synthesis**
   - How to choose between conflicting recommendations
   - Clinical scenarios where one guideline is preferred
   - Red flags or contraindications specific to each approach

5. **Strength of Recommendations**
   - Compare class of recommendation (I, IIa, IIb, III) if available
   - Compare level of evidence (A, B, C)
   - Which guideline has stronger backing?

Use clear markdown formatting with tables, bullet points, and highlighting for differences. Be specific and clinically actionable.`,
        add_context_from_internet: true,
      });

      setComparison(result);
    } catch (error) {
      console.error("Comparison failed:", error);
      setComparison("Error generating comparison. Please try again.");
    }
    
    setComparing(false);
  };

  // Enhanced semantic search
  const [semanticSearching, setSemanticSearching] = useState(false);
  const [semanticResults, setSemanticResults] = useState(null);
  const [generatingSummaries, setGeneratingSummaries] = useState(false);
  const [summaries, setSummaries] = useState({});

  const performSemanticSearch = async (term) => {
    if (!term.trim()) {
      setSemanticResults(null);
      return;
    }

    setSemanticSearching(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a medical AI with deep understanding of clinical terminology and relationships. Analyze this search query and match it to relevant past queries.

Search Query: "${term}"

Past Clinical Guideline Queries:
${pastQueries.map((q, i) => `${i}. "${q.question}"\n   Specialty: ${q.category}\n   Key concepts: ${q.answer.substring(0, 150)}...`).join("\n\n")}

ADVANCED SEMANTIC MATCHING - Consider ALL of these relationships:

1. **Medical Synonyms & Abbreviations**:
   - MI = myocardial infarction = heart attack = AMI
   - DM = diabetes mellitus = diabetes = hyperglycemia
   - HTN = hypertension = high blood pressure
   - AF/AFib = atrial fibrillation
   - CHF = congestive heart failure = heart failure
   - COPD = chronic obstructive pulmonary disease = emphysema/chronic bronchitis
   - CKD = chronic kidney disease = renal insufficiency
   - PE = pulmonary embolism
   - DVT = deep vein thrombosis

2. **Related Clinical Conditions**:
   - Diabetes ↔ HbA1c, insulin, metformin, glucose control
   - Hypertension ↔ blood pressure, ACE inhibitors, antihypertensives
   - Heart failure ↔ ejection fraction, diuretics, GDMT
   - Atrial fibrillation ↔ anticoagulation, stroke prevention, rhythm control

3. **Drug Classes & Specific Medications**:
   - Anticoagulation ↔ warfarin, DOACs, rivaroxaban, apixaban
   - Beta blockers ↔ metoprolol, carvedilol, atenolol
   - Statins ↔ atorvastatin, rosuvastatin, cholesterol

4. **Treatment Contexts**:
   - Prevention, management, acute treatment, chronic management
   - First-line, second-line therapy
   - Risk stratification, screening

5. **Anatomical/System Relationships**:
   - Cardiac, cardiovascular, pulmonary, renal, endocrine

Return indices of ALL semantically related queries, ranked by relevance (most relevant first).`,
        response_json_schema: {
          type: "object",
          properties: {
            relevant_indices: { type: "array", items: { type: "number" } },
          },
        },
      });

      const relevantQueries = result.relevant_indices
        .filter(idx => idx >= 0 && idx < pastQueries.length)
        .map(idx => pastQueries[idx]);
      
      setSemanticResults(relevantQueries);
    } catch (error) {
      console.error("Semantic search failed:", error);
      const searchLower = term.toLowerCase();
      const basicResults = pastQueries.filter(q => 
        q.question.toLowerCase().includes(searchLower) ||
        q.answer.toLowerCase().includes(searchLower) ||
        q.category?.toLowerCase().includes(searchLower) ||
        q.sources?.some(s => s.toLowerCase().includes(searchLower))
      );
      setSemanticResults(basicResults);
    }
    setSemanticSearching(false);
  };

  React.useEffect(() => {
    if (!searchTerm.trim()) {
      setSemanticResults(null);
      return;
    }

    const timer = setTimeout(() => {
      performSemanticSearch(searchTerm);
    }, 800);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Generate summaries for guidelines in browse mode
  const generateSummariesForGuidelines = async (guidelines) => {
    if (guidelines.length === 0 || generatingSummaries) return;
    
    setGeneratingSummaries(true);
    try {
      const newSummaries = await generateMultipleSummaries(guidelines.slice(0, 10));
      setSummaries(prev => ({ ...prev, ...newSummaries }));
    } catch (error) {
      console.error("Failed to generate summaries:", error);
    } finally {
      setGeneratingSummaries(false);
    }
  };

  // Apply filters
  let filteredQueries = semanticResults !== null ? semanticResults : pastQueries;
  
  filteredQueries = filteredQueries.filter(query => {
    if (showSavedOnly && !query.is_favorite) return false;
    if (filterCategory !== "all" && query.category !== filterCategory) return false;
    if (filterConfidence !== "all" && query.confidence_level !== filterConfidence) return false;
    
    if (filterDateRange !== "all") {
      const queryDate = new Date(query.created_date);
      const now = new Date();
      const daysAgo = (now - queryDate) / (1000 * 60 * 60 * 24);
      
      if (filterDateRange === "week" && daysAgo > 7) return false;
      if (filterDateRange === "month" && daysAgo > 30) return false;
      if (filterDateRange === "quarter" && daysAgo > 90) return false;
      if (filterDateRange === "year" && daysAgo > 365) return false;
    }
    
    return true;
  });

  React.useEffect(() => {
    if (viewMode === "browse" && filteredQueries.length > 0 && !latestAnswer && !selectedQuery && !generatingSummaries) {
      generateSummariesForGuidelines(filteredQueries);
    }
  }, [viewMode, filteredQueries, latestAnswer, selectedQuery, generatingSummaries]);

  const statsData = [
    { label: "Total Queries", value: pastQueries.length, icon: BookOpen, color: "blue" },
    { label: "High Confidence", value: pastQueries.filter(q => q.confidence_level === "high").length, icon: Sparkles, color: "emerald" },
    { label: "This Week", value: pastQueries.filter(q => (new Date() - new Date(q.created_date)) / (1000 * 60 * 60 * 24) <= 7).length, icon: Filter, color: "purple" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-8 md:p-12 shadow-2xl">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-1">Clinical Guidelines</h1>
              <p className="text-blue-100 text-lg">Evidence-based recommendations with AI-powered semantic search</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            {statsData.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-white/80" />
                    <p className="text-xs font-medium text-white/70 uppercase tracking-wide">{stat.label}</p>
                  </div>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2 inline-flex gap-2">
        <button
          onClick={() => setViewMode("search")}
          className={`px-6 py-3 rounded-xl font-semibold transition-all ${
            viewMode === "search" 
              ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" 
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Sparkles className="w-4 h-4 inline mr-2" />
          New Search
        </button>
        <button
          onClick={() => setViewMode("browse")}
          className={`px-6 py-3 rounded-xl font-semibold transition-all ${
            viewMode === "browse" 
              ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" 
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <BookOpen className="w-4 h-4 inline mr-2" />
          Browse History
        </button>
      </div>

      {/* Compare Guidelines Bar */}
      {selectedForCompare.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <ArrowLeftRight className="w-5 h-5 text-slate-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {selectedForCompare.length} guideline{selectedForCompare.length !== 1 ? 's' : ''} selected for comparison
              </p>
              <p className="text-xs text-slate-700">
                {selectedForCompare.length < 2 
                  ? "Select at least 2 guidelines to compare" 
                  : "Ready to compare"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedForCompare([])}
              className="rounded-xl text-slate-700 border-slate-300"
            >
              Clear
            </Button>
            <Button
              onClick={handleCompareGuidelines}
              disabled={selectedForCompare.length < 2}
              className="bg-green-600 hover:bg-green-700 text-white rounded-xl"
            >
              <ArrowLeftRight className="w-4 h-4 mr-2" />
              Compare Guidelines
            </Button>
          </div>
        </motion.div>
      )}

      {viewMode === "search" && (
        <>
          <PersonalizedRecommendations />
          <GuidelineSearchBar onSubmit={handleSubmit} isLoading={isLoading} />
        </>
      )}

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-8 w-2/3 rounded-xl" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      )}

      <AnimatePresence>
        {(latestAnswer || selectedQuery) && (
          <>
            <GuidelineAnswer 
              query={latestAnswer || selectedQuery} 
              onRate={handleRate}
              onSelectRelatedQuestion={handleSelectRelatedQuestion}
            />
            
            {relatedGuidelines.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-200 p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-slate-700" />
                  <h3 className="text-lg font-semibold text-slate-900">Related Guidelines</h3>
                </div>
                <p className="text-sm text-slate-700 mb-4">Based on your query, these related topics might be helpful:</p>
                <div className="grid gap-3">
                  {relatedGuidelines.map((related, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectRelatedQuestion(related.question)}
                      className="text-left bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all group"
                    >
                      <p className="text-sm font-medium text-slate-900 group-hover:text-slate-700 transition-colors">
                        {related.question}
                      </p>
                      <p className="text-xs text-slate-700 mt-1">{related.reason}</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>

      {/* Knowledge Base */}
      {pastQueries.length > 0 && !latestAnswer && !selectedQuery && (
        <div className="space-y-6">
          {/* Advanced Search & Filters */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Search className="w-5 h-5 text-blue-600" />
                {viewMode === "browse" ? "Search Your Guidelines Library" : "Search History"}
              </h2>
              
              {/* Main Search Bar */}
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                {semanticSearching && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
                  </div>
                )}
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by condition, medication, specialty... (AI-powered semantic search)"
                  className="pl-12 pr-12 h-14 text-base rounded-xl border-slate-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {searchTerm && semanticResults !== null && (
                <div className="mb-6 p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <p className="text-sm font-medium text-purple-900">
                    AI found {filteredQueries.length} semantically related {filteredQueries.length === 1 ? 'guideline' : 'guidelines'}
                  </p>
                </div>
              )}
              
              {/* Filters - Only in Browse Mode */}
              {viewMode === "browse" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-700">Advanced Filters</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFilterCategory("all");
                        setFilterConfidence("all");
                        setFilterDateRange("all");
                        setShowSavedOnly(false);
                      }}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      Reset All
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <Checkbox
                      checked={showSavedOnly}
                      onCheckedChange={setShowSavedOnly}
                      id="saved-only"
                    />
                    <label 
                      htmlFor="saved-only"
                      className="text-sm font-medium text-slate-700 cursor-pointer flex-1"
                    >
                      Show saved guidelines only
                    </label>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Specialty</label>
                      <Select value={filterCategory} onValueChange={setFilterCategory}>
                        <SelectTrigger className="rounded-xl h-11 border-slate-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Specialties</SelectItem>
                          <SelectItem value="cardiology">Cardiology</SelectItem>
                          <SelectItem value="pulmonology">Pulmonology</SelectItem>
                          <SelectItem value="endocrinology">Endocrinology</SelectItem>
                          <SelectItem value="infectious_disease">Infectious Disease</SelectItem>
                          <SelectItem value="neurology">Neurology</SelectItem>
                          <SelectItem value="oncology">Oncology</SelectItem>
                          <SelectItem value="gastroenterology">Gastroenterology</SelectItem>
                          <SelectItem value="nephrology">Nephrology</SelectItem>
                          <SelectItem value="rheumatology">Rheumatology</SelectItem>
                          <SelectItem value="general">General Medicine</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Evidence Level</label>
                      <Select value={filterConfidence} onValueChange={setFilterConfidence}>
                        <SelectTrigger className="rounded-xl h-11 border-slate-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Levels</SelectItem>
                          <SelectItem value="high">High Confidence</SelectItem>
                          <SelectItem value="moderate">Moderate Confidence</SelectItem>
                          <SelectItem value="low">Low Confidence</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Time Range</label>
                      <Select value={filterDateRange} onValueChange={setFilterDateRange}>
                        <SelectTrigger className="rounded-xl h-11 border-slate-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Time</SelectItem>
                          <SelectItem value="week">Past Week</SelectItem>
                          <SelectItem value="month">Past Month</SelectItem>
                          <SelectItem value="quarter">Past 3 Months</SelectItem>
                          <SelectItem value="year">Past Year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <button
              onClick={() => setResultsCollapsed(!resultsCollapsed)}
              className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors"
            >
              <div className="text-left">
                <h3 className="text-lg font-bold text-slate-900">
                  {filteredQueries.length} {filteredQueries.length === 1 ? 'Guideline' : 'Guidelines'} Found
                </h3>
                {selectedForCompare.length > 0 && (
                  <p className="text-sm text-slate-500 mt-1">
                    {selectedForCompare.length} selected for comparison
                  </p>
                )}
              </div>
              <ChevronDown className={`w-5 h-5 text-slate-600 transition-transform ${resultsCollapsed ? '-rotate-90' : ''}`} />
            </button>
            {!resultsCollapsed && (
            <div className="border-t border-slate-200 px-6 py-6">

            {queriesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-32 rounded-2xl" />
                ))}
              </div>
            ) : filteredQueries.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No guidelines found</h3>
                <p className="text-slate-500 mb-6">Try adjusting your search or filter criteria</p>
                <Button
                  onClick={() => {
                    setFilterCategory("all");
                    setFilterConfidence("all");
                    setFilterDateRange("all");
                    setSearchTerm("");
                  }}
                  className="rounded-xl"
                >
                  Clear All Filters
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredQueries.map((query) => {
                  const summary = summaries[query.id];
                  const confidenceColors = {
                    high: "bg-emerald-50 text-emerald-700 border-emerald-200",
                    moderate: "bg-amber-50 text-amber-700 border-amber-200",
                    low: "bg-red-50 text-red-700 border-red-200"
                  };

                  return (
                    <div key={query.id} className="flex items-start gap-4 group">
                      <div className="pt-6">
                        <Checkbox
                           checked={selectedForCompare.some(q => q.id === query.id)}
                           onCheckedChange={() => toggleSelectForCompare(query)}
                           className="rounded-md w-5 h-5"
                         />
                      </div>
                      <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-md transition-all">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div 
                            onClick={() => handleSelectQuery(query)}
                            className="flex-1 cursor-pointer"
                          >
                            <h3 className="font-semibold text-slate-900 text-base mb-2 group-hover:text-blue-600 transition-colors">
                              {query.question}
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {query.category && (
                                <span className="text-xs px-2 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                                  {query.category.replace(/_/g, ' ')}
                                </span>
                              )}
                              {query.confidence_level && (
                                <span className={`text-xs px-2 py-1 rounded-lg border font-medium ${confidenceColors[query.confidence_level]}`}>
                                  {query.confidence_level} confidence
                                </span>
                              )}
                              {query.sources?.length > 0 && (
                                <span className="text-xs px-2 py-1 rounded-lg bg-slate-50 text-slate-700 border border-slate-200">
                                  {query.sources.length} sources
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleFavorite(query.id, query.is_favorite);
                              }}
                              className={`p-2 rounded-lg transition-all ${
                                query.is_favorite
                                  ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                              }`}
                              title={query.is_favorite ? 'Remove from saved' : 'Save guideline'}
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Are you sure you want to delete this guideline?')) {
                                  handleDelete(query.id);
                                }
                              }}
                              className="p-2 rounded-lg bg-slate-100 text-slate-400 hover:bg-red-100 hover:text-red-600 transition-all"
                              title="Delete guideline"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* AI Summary */}
                        {summary ? (
                          <div className="mt-4">
                            <GuidlineSummaryCard 
                              summary={summary}
                              confidenceLevel={query.confidence_level}
                              isLoading={false}
                            />
                          </div>
                        ) : generatingSummaries ? (
                          <div className="mt-4">
                            <GuidlineSummaryCard 
                              summary={null}
                              confidenceLevel={query.confidence_level}
                              isLoading={true}
                            />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            </div>
            </div>
            </div>
            )}

            {/* Compare Dialog */}
            {showCompare && (
            <CompareGuidelines
            selectedGuidelines={selectedForCompare}
            onClose={() => {
            setShowCompare(false);
            setComparison(null);
            }}
            comparison={comparison}
            isLoading={comparing}
            onCompare={handleCompareGuidelines}
            />
            )}
            </div>
            );
            }