import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter } from "lucide-react";

export default function TemplateSearch({ 
  category = "all",
  onCategoryChange,
  onSearchChange,
  onNoteTypeChange
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [noteTypeFilter, setNoteTypeFilter] = useState("all");

  const CATEGORIES = [
    "all", "general", "cardiology", "pulmonology", "endocrinology", "neurology",
    "oncology", "pediatrics", "emergency", "surgery", "psychiatry"
  ];

  const NOTE_TYPES = [
    { value: "all", label: "All Types" },
    { value: "progress_note", label: "Progress Note" },
    { value: "h_and_p", label: "History & Physical" },
    { value: "discharge_summary", label: "Discharge Summary" },
    { value: "consult", label: "Consultation" },
    { value: "procedure_note", label: "Procedure Note" },
  ];

  const handleSearchChange = (query) => {
    setSearchQuery(query);
    onSearchChange?.(query);
  };

  const handleNoteTypeChange = (type) => {
    setNoteTypeFilter(type);
    onNoteTypeChange?.(type);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-col sm:flex-row">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search templates by name, specialty..."
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 rounded-lg"
          />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-sm text-slate-600">Filter:</span>
        </div>

        <Select value={category} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map(cat => (
              <SelectItem key={cat} value={cat} className="capitalize">
                {cat === "all" ? "All Categories" : cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={noteTypeFilter} onValueChange={handleNoteTypeChange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {NOTE_TYPES.map(type => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}