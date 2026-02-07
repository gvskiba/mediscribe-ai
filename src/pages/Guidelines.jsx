import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import GuidelineSearchBar from "../components/guidelines/GuidelineSearchBar";
import GuidelineAnswer from "../components/guidelines/GuidelineAnswer";
import RecentQueryCard from "../components/dashboard/RecentQueryCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Search, Loader2, Sparkles, Filter } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export default function Guidelines() {
  const [isLoading, setIsLoading] = useState(false);
  const [latestAnswer, setLatestAnswer] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterConfidence, setFilterConfidence] = useState("all");
  const [filterDateRange, setFilterDateRange] = useState("all");
  const [viewMode, setViewMode] = useState("search");
  const [relatedGuidelines, setRelatedGuidelines] = useState([]);
  const queryClient = useQueryClient();

  const { data: pastQueries = [], isLoading: queriesLoading } = useQuery({
    queryKey: ["queries"],
    queryFn: () => base44.entities.GuidelineQuery.list("-created_date", 50),
  });

  const handleSubmit = async (question, attachedFiles = []) => {
    setIsLoading(true);
    setLatestAnswer(null);
    setSearchTerm("");

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

  const handleRate = async (queryId, rating) => {
    await rateMutation.mutateAsync({ queryId, rating });
    if (latestAnswer && latestAnswer.id === queryId) {
      setLatestAnswer(prev => ({ ...prev, rating }));
    }
  };

  const handleSelectRelatedQuestion = (question) => {
    handleSubmit(question);
  };

  // Enhanced semantic search
  const [semanticSearching, setSemanticSearching] = useState(false);
  const [semanticResults, setSemanticResults] = useState(null);

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

  // Apply filters
  let filteredQueries = semanticResults !== null ? semanticResults : pastQueries;
  
  filteredQueries = filteredQueries.filter(query => {
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

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Clinical Guidelines</h1>
          <p className="text-slate-600">Evidence-based clinical guidelines with AI-powered search</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "search" ? "default" : "outline"}
            onClick={() => setViewMode("search")}
            className="rounded-xl"
          >
            Search
          </Button>
          <Button
            variant={viewMode === "browse" ? "default" : "outline"}
            onClick={() => setViewMode("browse")}
            className="rounded-xl"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Browse
          </Button>
        </div>
      </div>

      {viewMode === "search" && (
        <GuidelineSearchBar onSubmit={handleSubmit} isLoading={isLoading} />
      )}

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-8 w-2/3 rounded-xl" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      )}

      <AnimatePresence>
        {latestAnswer && (
          <>
            <GuidelineAnswer 
              query={latestAnswer} 
              onRate={handleRate}
              onSelectRelatedQuestion={handleSelectRelatedQuestion}
            />
            
            {relatedGuidelines.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-slate-900">Related Guidelines</h3>
                </div>
                <p className="text-sm text-slate-600 mb-4">Based on your query, these related topics might be helpful:</p>
                <div className="grid gap-3">
                  {relatedGuidelines.map((related, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectRelatedQuestion(related.question)}
                      className="text-left bg-white rounded-xl p-4 border border-blue-100 hover:border-blue-300 hover:shadow-sm transition-all group"
                    >
                      <p className="text-sm font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                        {related.question}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{related.reason}</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>

      {/* Knowledge Base */}
      {pastQueries.length > 0 && !latestAnswer && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-1">
              {viewMode === "browse" ? "Guidelines Knowledge Base" : "Query History"}
            </h2>
            <p className="text-sm text-slate-500">
              {viewMode === "browse" 
                ? "Browse and filter all saved clinical guidelines" 
                : "Search through past clinical guideline queries"}
            </p>
          </div>
          
          {/* Filters */}
          {viewMode === "browse" && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6 p-4 bg-slate-50 rounded-xl">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">Specialty</label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="rounded-lg bg-white">
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
              
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">Confidence</label>
                <Select value={filterConfidence} onValueChange={setFilterConfidence}>
                  <SelectTrigger className="rounded-lg bg-white">
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
              
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">Time Period</label>
                <Select value={filterDateRange} onValueChange={setFilterDateRange}>
                  <SelectTrigger className="rounded-lg bg-white">
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
              
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilterCategory("all");
                    setFilterConfidence("all");
                    setFilterDateRange("all");
                    setSearchTerm("");
                  }}
                  className="w-full rounded-lg"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          )}

          {/* Semantic Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            {semanticSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500 animate-spin" />
            )}
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="AI-powered search: 'heart failure', 'diabetes', 'anticoagulation'..."
              className="pl-10 pr-10 rounded-xl"
            />
          </div>
          {searchTerm && semanticResults !== null && (
            <p className="text-xs text-purple-600 mb-4">
              <Sparkles className="w-3 h-3 inline mr-1" />
              AI semantic search • Found {filteredQueries.length} related {filteredQueries.length === 1 ? 'query' : 'queries'}
            </p>
          )}

          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-500">
              {filteredQueries.length} guideline{filteredQueries.length !== 1 ? 's' : ''}
            </p>
          </div>

          {queriesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : filteredQueries.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No guidelines found</p>
              <Button
                variant="outline"
                onClick={() => {
                  setFilterCategory("all");
                  setFilterConfidence("all");
                  setFilterDateRange("all");
                  setSearchTerm("");
                }}
                className="mt-3 rounded-xl"
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredQueries.map((query) => (
                <Link
                  key={query.id}
                  to={createPageUrl("GuidelineDetail") + `?id=${query.id}`}
                  className="block"
                >
                  <RecentQueryCard query={query} />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}