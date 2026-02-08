import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../../utils";
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
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(createPageUrl(`GuidelineDetail?id=${query.id}`));
  };

  return (
    <div 
      onClick={handleClick}
      className="group flex items-start gap-4 p-4 rounded-xl hover:bg-[#242938] transition-colors duration-200 cursor-pointer">
      <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
        <BookOpen className="w-4 h-4 text-purple-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white line-clamp-2">{query.question}</p>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-300 border-purple-500/20">
            {categoryLabels[query.category] || "General"}
          </Badge>
          {query.confidence_level && (
            <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-300 border-emerald-500/20">
              {query.confidence_level} confidence
            </Badge>
          )}
        </div>
      </div>
      <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-purple-300 transition-colors flex-shrink-0 mt-1" />
    </div>
  );
}