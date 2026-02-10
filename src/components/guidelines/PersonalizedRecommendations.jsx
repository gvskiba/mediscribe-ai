import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { Sparkles, Loader2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

export default function PersonalizedRecommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const generateRecommendations = async () => {
      setIsLoading(true);
      try {
        const user = await base44.auth.me();
        const allGuidelines = await base44.entities.GuidelineQuery.list('-updated_date', 100);
        
        // Get user's viewing/interaction history from localStorage
        const viewHistory = JSON.parse(localStorage.getItem('guidelineViewHistory') || '[]');
        const searchHistory = JSON.parse(localStorage.getItem('guidelineSearchHistory') || '[]');

        // Get user's rated guidelines
        const ratedGuidelines = allGuidelines.filter(g => g.rating && g.created_by === user.email);

        if (viewHistory.length === 0 && ratedGuidelines.length === 0 && searchHistory.length === 0) {
          setRecommendations([]);
          setIsLoading(false);
          return;
        }

        // Get viewed guideline categories
        const viewedGuidelines = allGuidelines.filter(g => viewHistory.includes(g.id));
        const viewedCategories = [...new Set(viewedGuidelines.map(g => g.category))];
        const recentSearches = searchHistory.slice(-5).join(", ");
        const topRatedCategories = ratedGuidelines
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 3)
          .map(g => g.category)
          .join(", ");

        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `Based on a healthcare provider's guideline interaction history, recommend 3-4 new guidelines they should explore.

User Profile:
- Recently viewed categories: ${viewedCategories.join(", ") || "None yet"}
- Recent searches: ${recentSearches || "None yet"}
- Top-rated guideline categories: ${topRatedCategories || "None yet"}
- Most recent viewed guideline: ${viewedGuidelines[0]?.question || "None"}

Available guideline categories: cardiology, pulmonology, endocrinology, infectious_disease, neurology, oncology, gastroenterology, nephrology, rheumatology, general

Generate personalized recommendation topics that:
1. Build on their viewed categories (go deeper or explore related conditions)
2. Match their search patterns and interests
3. Are clinically relevant to their specialty focus
4. Represent high-value clinical topics

Format as actionable clinical questions suitable for guidelines.`,
          response_json_schema: {
            type: "object",
            properties: {
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    question: { type: "string" },
                    category: { type: "string" },
                    reason: { type: "string" },
                    relevance_score: { type: "number" }
                  }
                }
              }
            }
          }
        });

        setRecommendations(result.recommendations || []);
      } catch (error) {
        console.error("Error generating recommendations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    generateRecommendations();
  }, []);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-100 p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-slate-900">Personalized for You</h3>
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Generating personalized recommendations...</span>
        </div>
      </motion.div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-100 p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-semibold text-slate-900">Personalized for You</h3>
      </div>

      <p className="text-sm text-slate-600 mb-4">
        Based on your viewing history and interests, we recommend these guidelines:
      </p>

      <div className="grid gap-3">
        {recommendations.map((rec, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Link
              to={`${createPageUrl("Guidelines")}?autoQuery=${encodeURIComponent(rec.question)}`}
              className="block bg-white rounded-xl p-4 border border-purple-100 hover:border-purple-300 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 group-hover:text-purple-600 transition-colors line-clamp-2">
                    {rec.question}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{rec.reason}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full capitalize">
                      {rec.category}
                    </span>
                    <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-600 rounded-full"
                        style={{ width: `${Math.min(rec.relevance_score * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors flex-shrink-0 mt-0.5" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}