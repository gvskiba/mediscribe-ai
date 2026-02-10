import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Plus } from "lucide-react";

export default function AITagsSuggestions({ suggestions, onApplyTag }) {
  if (!suggestions) return null;

  const allTags = [
    ...suggestions.conditions,
    ...suggestions.specialties,
    ...suggestions.treatments,
    ...suggestions.procedures,
    ...suggestions.demographics,
  ].filter(Boolean);

  if (allTags.length === 0) return null;

  const categories = [
    { title: "Conditions", tags: suggestions.conditions },
    { title: "Specialties", tags: suggestions.specialties },
    { title: "Treatments", tags: suggestions.treatments },
    { title: "Procedures", tags: suggestions.procedures },
    { title: "Demographics", tags: suggestions.demographics },
  ];

  return (
    <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-amber-600" />
        <h4 className="font-semibold text-slate-900">Suggested Tags & Categories</h4>
      </div>

      <div className="space-y-3">
        {categories.map(
          (category) =>
            category.tags.length > 0 && (
              <div key={category.title}>
                <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
                  {category.title}
                </p>
                <div className="flex flex-wrap gap-2">
                  {category.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="cursor-pointer hover:bg-amber-100 transition-colors bg-white"
                      onClick={() => onApplyTag(tag)}
                      title="Click to add"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )
        )}
      </div>

      <p className="text-xs text-slate-500">Click on any tag to add it to your note</p>
    </div>
  );
}