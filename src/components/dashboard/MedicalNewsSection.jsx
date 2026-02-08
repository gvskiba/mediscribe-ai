import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Newspaper, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function MedicalNewsSection() {
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: newsData, isLoading } = useQuery({
    queryKey: ["medicalNews", refreshKey],
    queryFn: async () => {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Search for the top 5 most important medical news stories from the past 24-48 hours. Focus on:
- Clinical practice updates
- New treatment guidelines
- Significant research findings
- FDA approvals or warnings
- Public health developments

For each story, provide a concise professional summary (2-3 sentences) that a clinician would find actionable.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            stories: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  summary: { type: "string" },
                  category: { 
                    type: "string",
                    enum: ["Clinical Guidelines", "Research", "FDA Updates", "Public Health", "Treatment Advances"]
                  },
                  relevance: { type: "string" },
                  source: { type: "string" }
                }
              }
            }
          }
        }
      });
      
      return result.stories || [];
    },
    staleTime: 1000 * 60 * 60,
  });

  const categoryColors = {
    "Clinical Guidelines": "bg-blue-50 text-blue-700 border-blue-200",
    "Research": "bg-purple-50 text-purple-700 border-purple-200",
    "FDA Updates": "bg-red-50 text-red-700 border-red-200",
    "Public Health": "bg-green-50 text-green-700 border-green-200",
    "Treatment Advances": "bg-amber-50 text-amber-700 border-amber-200"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
    >
      <div className="flex items-center justify-between p-6 pb-4">
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-slate-900">Medical News</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setRefreshKey(prev => prev + 1)}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="px-4 pb-4">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-5 w-full mb-2" />
                <Skeleton className="h-12 w-full" />
              </Card>
            ))}
          </div>
        ) : newsData && newsData.length > 0 ? (
          <div className="space-y-3">
            {newsData.map((story, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${categoryColors[story.category] || "bg-slate-50 text-slate-700 border-slate-200"}`}
                    >
                      {story.category}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2 leading-snug">
                    {story.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-3">
                    {story.summary}
                  </p>
                  {story.relevance && (
                    <p className="text-xs text-slate-500 italic mb-2">
                      Clinical Relevance: {story.relevance}
                    </p>
                  )}
                  {story.source && (
                    <div className="flex items-center text-xs text-slate-400">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      {story.source}
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            <Newspaper className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No news available</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}