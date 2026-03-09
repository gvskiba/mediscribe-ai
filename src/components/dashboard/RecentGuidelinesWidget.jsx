import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { BookOpen, Clock, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import moment from "moment";

export default function RecentGuidelinesWidget() {
  const { data: guidelines, isLoading } = useQuery({
    queryKey: ["recentGuidelines"],
    queryFn: () => base44.entities.GuidelineQuery.list("-created_date", 5),
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-3">
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-3 w-24" />
          </Card>
        ))}
      </div>
    );
  }

  if (!guidelines || guidelines.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p className="text-xs">No recent guidelines</p>
      </div>
    );
  }

  const categoryColors = {
    cardiology: "bg-red-100 text-red-700 border-red-200",
    pulmonology: "bg-blue-100 text-blue-700 border-blue-200",
    endocrinology: "bg-purple-100 text-purple-700 border-purple-200",
    infectious_disease: "bg-green-100 text-green-700 border-green-200",
    neurology: "bg-indigo-100 text-indigo-700 border-indigo-200",
    oncology: "bg-pink-100 text-pink-700 border-pink-200",
    general: "bg-slate-100 text-slate-700 border-slate-200"
  };

  const confidenceColors = {
    high: "text-green-600",
    moderate: "text-amber-600",
    low: "text-slate-500"
  };

  return (
    <div className="space-y-2">
      {guidelines.map((guideline, idx) => (
        <motion.div
          key={guideline.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
        >
          <Link to={createPageUrl(`Guidelines`)}>
            <Card className="p-3 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="text-sm font-semibold text-slate-900 line-clamp-2 flex-1">
                  {guideline.question}
                </h4>
                {guideline.category && (
                  <Badge variant="outline" className={`text-xs ${categoryColors[guideline.category] || categoryColors.general}`}>
                    {guideline.category}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {moment(guideline.created_date).fromNow()}
                </div>
                {guideline.confidence_level && (
                  <div className={`flex items-center gap-1 ${confidenceColors[guideline.confidence_level]}`}>
                    <Star className="w-3 h-3" />
                    {guideline.confidence_level}
                  </div>
                )}
                {guideline.rating && (
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="w-3 h-3 fill-current" />
                    {guideline.rating}/5
                  </div>
                )}
              </div>
            </Card>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}