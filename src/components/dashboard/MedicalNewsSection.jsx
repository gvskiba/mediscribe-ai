import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Newspaper, ExternalLink, RefreshCw, Sparkles, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const newsCategories = [
  { id: "all", label: "All News" },
  { id: "clinical", label: "Clinical Guidelines" },
  { id: "research", label: "Research" },
  { id: "devices", label: "Medical Devices" },
  { id: "emergency", label: "Emergency Medicine" },
  { id: "ai", label: "AI & Technology" },
  { id: "fda", label: "FDA Updates" },
  { id: "public_health", label: "Public Health" }
];

function LearnMorePanel({ story }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState(null);

  const handleLearnMore = async (e) => {
    e.stopPropagation();
    if (open) { setOpen(false); return; }
    setOpen(true);
    if (questions) return;
    setLoading(true);
    const resp = await base44.integrations.Core.InvokeLLM({
      prompt: `A clinician is reading this medical news story: "${story.title}". Summary: "${story.summary}".

Generate 4 follow-up questions or related topics they might want to explore further to deepen their clinical understanding. Make them specific, practical, and clinically actionable.`,
      response_json_schema: {
        type: "object",
        properties: {
          questions: { type: "array", items: { type: "string" } }
        }
      }
    });
    setQuestions(resp?.questions || []);
    setLoading(false);
  };

  return (
    <div>
      <button
        onClick={handleLearnMore}
        className="flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-700 transition-colors"
      >
        <Sparkles className="w-3 h-3" />
        Learn More
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 pt-2 border-t border-slate-100">
              {loading ? (
                <div className="flex items-center gap-2 py-2">
                  <Loader2 className="w-3 h-3 animate-spin text-purple-500" />
                  <span className="text-xs text-slate-400">Generating follow-up questions…</span>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1.5">Related questions to explore:</p>
                  <ul className="space-y-1">
                    {questions?.map((q, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                        <span className="text-purple-400 font-bold shrink-0 mt-0.5">{i + 1}.</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function MedicalNewsSection({ compact = false }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: newsData, isLoading } = useQuery({
    queryKey: ["medicalNews", refreshKey, selectedCategory],
    queryFn: async () => {
      const categoryPrompts = {
        all: "Search for the top 6 most important medical news stories from the past 24-48 hours across all categories.",
        clinical: "Search for the latest clinical practice guidelines and treatment protocol updates from the past 24-48 hours.",
        research: "Search for significant recent medical research findings and breakthrough studies from the past 24-48 hours.",
        devices: "Search for the latest medical device innovations, approvals, and safety updates from the past 24-48 hours.",
        emergency: "Search for important emergency medicine updates, protocols, and critical care developments from the past 24-48 hours.",
        ai: "Search for the latest AI and technology developments in healthcare and clinical practice from the past 24-48 hours.",
        fda: "Search for recent FDA approvals, warnings, recalls, and regulatory updates from the past 24-48 hours.",
        public_health: "Search for important public health developments, disease outbreaks, and population health updates from the past 24-48 hours."
      };

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `${categoryPrompts[selectedCategory] || categoryPrompts.all}

For each story, provide:
- A clear, actionable title
- A concise professional summary (2-3 sentences) that a clinician would find useful
- A key_takeaway: 1-2 sentence AI-generated distillation of the single most important clinical insight from this story
- Clinical relevance or impact
- Source information
- A direct URL to the original article or source page (e.g., PubMed, NEJM, JAMA, CDC, FDA website)

Focus on stories that have direct clinical implications or are practice-changing.`,
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
                  key_takeaway: { type: "string" },
                  category: { type: "string" },
                  relevance: { type: "string" },
                  source: { type: "string" },
                  url: { type: "string" }
                }
              }
            }
          }
        }
      });
      
      return result.stories || [];
    },
    staleTime: 1000 * 60 * 30,
  });

  const getCategoryColor = (category) => {
    const colors = {
      "Clinical Guidelines": "bg-blue-50 text-blue-700 border-blue-200",
      "Research": "bg-purple-50 text-purple-700 border-purple-200",
      "FDA Updates": "bg-red-50 text-red-700 border-red-200",
      "Medical Devices": "bg-cyan-50 text-cyan-700 border-cyan-200",
      "Emergency Medicine": "bg-orange-50 text-orange-700 border-orange-200",
      "AI & Technology": "bg-indigo-50 text-indigo-700 border-indigo-200",
      "Public Health": "bg-green-50 text-green-700 border-green-200",
      "Treatment Advances": "bg-amber-50 text-amber-700 border-amber-200"
    };
    return colors[category] || "bg-slate-50 text-slate-700 border-slate-200";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setRefreshKey(prev => prev + 1)}
          disabled={isLoading}
          className="gap-2 ml-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Category Tabs */}
      <div className="mb-4 overflow-x-auto">
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="inline-flex h-auto p-1 bg-slate-100 rounded-lg">
            {newsCategories.map((cat) => (
              <TabsTrigger
                key={cat.id}
                value={cat.id}
                className="px-3 py-1.5 text-xs font-medium rounded-md data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
              >
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(compact ? 3 : 4)].map((_, i) => (
              <Card key={i} className="p-3">
                <Skeleton className="h-3 w-20 mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-8 w-full" />
              </Card>
            ))}
          </div>
        ) : newsData && newsData.length > 0 ? (
          <div className="space-y-2">
            {newsData.slice(0, compact ? 4 : 6).map((story, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <Card className="p-3 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge variant="outline" className={`text-xs ${getCategoryColor(story.category)}`}>
                      {story.category}
                    </Badge>
                    {story.url && (
                      <button
                        onClick={() => window.open(story.url, "_blank", "noopener,noreferrer")}
                        className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 transition-colors shrink-0 font-medium"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Source
                      </button>
                    )}
                  </div>

                  <h3
                    className={`font-semibold text-slate-900 mb-1 leading-snug text-sm ${story.url ? "cursor-pointer hover:text-blue-600 transition-colors" : ""}`}
                    onClick={() => story.url && window.open(story.url, "_blank", "noopener,noreferrer")}
                  >
                    {story.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed mb-2 line-clamp-2">
                    {story.summary}
                  </p>

                  {/* AI Key Takeaway */}
                  {story.key_takeaway && (
                    <div className="flex items-start gap-1.5 bg-purple-50 border border-purple-100 rounded-md px-2.5 py-1.5 mb-2">
                      <Sparkles className="w-3 h-3 text-purple-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-purple-700 leading-relaxed font-medium">{story.key_takeaway}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 mt-1">
                    {story.source && (
                      <span className="text-xs text-slate-400">{story.source}</span>
                    )}
                    <LearnMorePanel story={story} />
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-400">
            <Newspaper className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs">No news available</p>
          </div>
        )}
      </div>
    </div>
  );
}