import React from "react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronRight, BookOpen, Calendar, Star } from "lucide-react";
import { format } from "date-fns";

const confidenceColors = {
  high: "bg-emerald-50 text-emerald-700 border-emerald-200",
  moderate: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-red-50 text-red-700 border-red-200",
};

const categoryColors = {
  cardiology: "bg-red-50 text-red-700 border-red-200",
  pulmonology: "bg-blue-50 text-blue-700 border-blue-200",
  endocrinology: "bg-purple-50 text-purple-700 border-purple-200",
  infectious_disease: "bg-green-50 text-green-700 border-green-200",
  neurology: "bg-indigo-50 text-indigo-700 border-indigo-200",
  oncology: "bg-pink-50 text-pink-700 border-pink-200",
  gastroenterology: "bg-orange-50 text-orange-700 border-orange-200",
  nephrology: "bg-cyan-50 text-cyan-700 border-cyan-200",
  rheumatology: "bg-violet-50 text-violet-700 border-violet-200",
  general: "bg-slate-50 text-slate-700 border-slate-200",
};

export default function GuidelineQueryCard({ query, selected, onSelect, onClick }) {
  return (
    <div className="flex items-start gap-3 group">
      {onSelect && (
        <div className="pt-6">
          <Checkbox
            checked={selected}
            onCheckedChange={(e) => {
              e.stopPropagation?.();
              onSelect(query);
            }}
            className="rounded-md"
          />
        </div>
      )}
      
      <div
        onClick={onClick}
        className="flex-1 bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 text-base leading-snug mb-2 group-hover:text-blue-600 transition-colors">
              {query.question}
            </h3>
            <div className="flex flex-wrap gap-2">
              {query.category && (
                <Badge variant="outline" className={`text-xs ${categoryColors[query.category] || categoryColors.general}`}>
                  {query.category.replace(/_/g, ' ')}
                </Badge>
              )}
              {query.confidence_level && (
                <Badge variant="outline" className={`text-xs ${confidenceColors[query.confidence_level]}`}>
                  {query.confidence_level} confidence
                </Badge>
              )}
              {query.rating && (
                <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                  <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                  {query.rating}/5
                </Badge>
              )}
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
        </div>

        {query.answer && (
          <p className="text-sm text-slate-600 line-clamp-2 mb-3 leading-relaxed">
            {query.answer.substring(0, 150)}...
          </p>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(query.created_date), "MMM d, yyyy")}
            </span>
            {query.sources?.length > 0 && (
              <span className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                {query.sources.length} sources
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}