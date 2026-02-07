import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import GuidelineSearchBar from "../components/guidelines/GuidelineSearchBar";
import GuidelineAnswer from "../components/guidelines/GuidelineAnswer";
import { BookOpen, Search } from "lucide-react";
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

  const handleSubmit = async (question) => {
    setIsLoading(true);
    setLatestAnswer(null);
    setSearchTerm("");

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a clinical evidence expert similar to OpenEvidence. Answer the following clinical question using the latest evidence-based guidelines and medical literature.

Question: ${question}

Provide:
1. A comprehensive, evidence-based answer with specific guideline recommendations
2. Mention specific guidelines (e.g., ACC/AHA, ESC, ADA, IDSA, NICE, etc.) when relevant
3. Include drug names, dosages, and class of recommendation/level of evidence when applicable
4. Format with markdown headers for organization
5. Note any recent updates or controversies

Also classify:
- Category (cardiology, pulmonology, endocrinology, infectious_disease, neurology, oncology, gastroenterology, nephrology, rheumatology, general)
- Confidence level (high, moderate, low) based on strength of evidence
- Sources: List the specific guidelines and key studies referenced`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          answer: { type: "string" },
          category: { type: "string" },
          confidence_level: { type: "string" },
          sources: { type: "array", items: { type: "string" } },
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

  // Semantic search filtering
  const filteredQueries = useMemo(() => {
    if (!searchTerm.trim()) return pastQueries;
    
    const searchLower = searchTerm.toLowerCase();
    return pastQueries.filter(q => 
      q.question.toLowerCase().includes(searchLower) ||
      q.answer.toLowerCase().includes(searchLower) ||
      q.category?.toLowerCase().includes(searchLower) ||
      q.sources?.some(s => s.toLowerCase().includes(searchLower))
    );
  }, [pastQueries, searchTerm]);

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
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search past queries, answers, or topics..."
              className="pl-10 rounded-xl border-slate-200 bg-white"
            />
          </div>

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