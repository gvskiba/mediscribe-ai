import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import GuidelineSearchBar from "../components/guidelines/GuidelineSearchBar";
import GuidelineAnswer from "../components/guidelines/GuidelineAnswer";
import { BookOpen, Search, Loader2, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatePresence, motion } from "framer-motion";
import { Input } from "@/components/ui/input";

export default function Guidelines() {
  const [isLoading, setIsLoading] = useState(false);
  const [latestAnswer, setLatestAnswer] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const { data: pastQueries = [], isLoading: queriesLoading } = useQuery({
    queryKey: ["queries"],
    queryFn: () => base44.entities.GuidelineQuery.list("-created_date", 20),
  });

  const handleSubmit = async (question, attachedFiles = []) => {
    setIsLoading(true);
    setLatestAnswer(null);
    setSearchTerm("");

    // Build enhanced prompt with context
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

    // Generate related questions
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
    setLatestAnswer({ ...queryData, id: created.id });
    queryClient.invalidateQueries({ queryKey: ["queries"] });
    setIsLoading(false);
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

  // Enhanced semantic search with AI assistance
  const [semanticSearching, setSemanticSearching] = useState(false);
  const [semanticResults, setSemanticResults] = useState(null);

  const performSemanticSearch = async (term) => {
    if (!term.trim()) {
      setSemanticResults(null);
      return;
    }

    setSemanticSearching(true);
    try {
      // Use AI to understand search intent and match queries
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
      // Fallback to basic search
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

  // Debounced semantic search
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

  const filteredQueries = semanticResults !== null ? semanticResults : pastQueries;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Clinical Guidelines</h1>
        <p className="text-slate-500 mt-1">Evidence-based answers powered by AI.</p>
      </div>

      <GuidelineSearchBar onSubmit={handleSubmit} isLoading={isLoading} />

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-8 w-2/3 rounded-xl" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      )}

      <AnimatePresence>
        {latestAnswer && (
          <GuidelineAnswer 
            query={latestAnswer} 
            onRate={handleRate}
            onSelectRelatedQuestion={handleSelectRelatedQuestion}
          />
        )}
      </AnimatePresence>

      {/* Past Queries */}
      {pastQueries.length > 0 && !latestAnswer && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-slate-400" />
              Query History
            </h2>
          </div>

          {/* Semantic Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            {semanticSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500 animate-spin" />
            )}
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Intelligent search: try 'heart failure', 'diabetes management', 'anticoagulation'..."
              className="pl-10 pr-10 rounded-xl border-slate-200 bg-white"
            />
          </div>
          {searchTerm && semanticResults !== null && (
            <p className="text-xs text-purple-600 -mt-2">
              <Sparkles className="w-3 h-3 inline mr-1" />
              AI-powered semantic search • Found {filteredQueries.length} related {filteredQueries.length === 1 ? 'query' : 'queries'}
            </p>
          )}

          {filteredQueries.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <p className="text-sm">No queries match your search</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQueries.map((q) => (
                <GuidelineAnswer 
                  key={q.id} 
                  query={q} 
                  onRate={handleRate}
                  onSelectRelatedQuestion={handleSelectRelatedQuestion}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}