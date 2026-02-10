import React from "react";
import { BookOpen, TrendingUp, Star, Clock } from "lucide-react";

export default function GuidelinesStats({ queries }) {
  const totalQueries = queries.length;
  const highConfidence = queries.filter(q => q.confidence_level === "high").length;
  const avgRating = queries.filter(q => q.rating).length > 0
    ? (queries.reduce((sum, q) => sum + (q.rating || 0), 0) / queries.filter(q => q.rating).length).toFixed(1)
    : "N/A";
  const thisWeek = queries.filter(q => {
    const daysDiff = (new Date() - new Date(q.created_date)) / (1000 * 60 * 60 * 24);
    return daysDiff <= 7;
  }).length;

  const stats = [
    { label: "Total Queries", value: totalQueries, icon: BookOpen, color: "blue" },
    { label: "High Confidence", value: highConfidence, icon: TrendingUp, color: "emerald" },
    { label: "Avg Rating", value: avgRating, icon: Star, color: "amber" },
    { label: "This Week", value: thisWeek, icon: Clock, color: "purple" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className={`bg-white/80 backdrop-blur rounded-xl p-4 border border-${stat.color}-200 shadow-sm`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 text-${stat.color}-600`} />
              <p className={`text-xs font-semibold text-${stat.color}-600 uppercase tracking-wide`}>
                {stat.label}
              </p>
            </div>
            <p className={`text-2xl font-bold text-${stat.color}-700`}>{stat.value}</p>
          </div>
        );
      })}
    </div>
  );
}