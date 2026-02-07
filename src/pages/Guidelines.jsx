import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import GuidelineSearchBar from "../components/guidelines/GuidelineSearchBar";
import GuidelineAnswer from "../components/guidelines/GuidelineAnswer";
import { BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatePresence, motion } from "framer-motion";

export default function Guidelines() {
  const [isLoading, setIsLoading] = useState(false);
  const [latestAnswer, setLatestAnswer] = useState(null);
  const queryClient = useQueryClient();

  const { data: pastQueries = [], isLoading: queriesLoading } = useQuery({
    queryKey: ["queries"],
    queryFn: () => base44.entities.GuidelineQuery.list("-created_date", 20),
  });

  const handleSubmit = async (question) => {
    setIsLoading(true);
    setLatestAnswer(null);

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

    const queryData = {
      question,
      answer: result.answer,
      category: result.category,
      confidence_level: result.confidence_level,
      sources: result.sources || [],
    };

    await base44.entities.GuidelineQuery.create(queryData);
    setLatestAnswer(queryData);
    queryClient.invalidateQueries({ queryKey: ["queries"] });
    setIsLoading(false);
  };

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
        {latestAnswer && <GuidelineAnswer query={latestAnswer} />}
      </AnimatePresence>

      {/* Past Queries */}
      {pastQueries.length > 0 && !latestAnswer && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-slate-400" />
            Recent Queries
          </h2>
          <div className="space-y-4">
            {pastQueries.map((q) => (
              <GuidelineAnswer key={q.id} query={q} />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}