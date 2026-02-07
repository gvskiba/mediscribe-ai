import React from "react";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ArrowUpRight } from "lucide-react";

const confidenceColors = {
  high: "bg-emerald-50 text-emerald-700 border-emerald-200",
  moderate: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-red-50 text-red-700 border-red-200",
};

const categoryLabels = {
  cardiology: "Cardiology",
  pulmonology: "Pulmonology",
  endocrinology: "Endocrinology",
  infectious_disease: "ID",
  neurology: "Neurology",
  oncology: "Oncology",
  gastroenterology: "GI",
  nephrology: "Nephrology",
  rheumatology: "Rheumatology",
  general: "General",
};

export default function RecentQueryCard({ query }) {
  return (
    <div className="group flex items-start gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors duration-200 cursor-pointer">
      <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
        <BookOpen className="w-4 h-4 text-purple-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 line-clamp-2">{query.question}</p>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600">
            {categoryLabels[query.category] || "General"}
          </Badge>
          {query.confidence_level && (
            <Badge variant="outline" className={`text-xs ${confidenceColors[query.confidence_level]}`}>
              {query.confidence_level} confidence
            </Badge>
          )}
        </div>
      </div>
      <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0 mt-1" />
    </div>
  );
}