import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter } from "lucide-react";

export default function TemplateSearch({ 
  templates = [], 
  onTemplateSelect, 
  category = "all",
  onCategoryChange 
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

  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      const matchesSearch = 
        t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.specialty?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = category === "all" || t.category === category;
      const matchesNoteType = noteTypeFilter === "all" || t.note_type === noteTypeFilter;
      
      return matchesSearch && matchesCategory && matchesNoteType;
    });
  }, [templates, searchQuery, category, noteTypeFilter]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search templates by name, specialty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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

        <Select value={noteTypeFilter} onValueChange={setNoteTypeFilter}>
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

      {filteredTemplates.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-slate-500">No templates match your search</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-2">
        {filteredTemplates.map(template => (
          <div
            key={template.id}
            onClick={() => onTemplateSelect?.(template)}
            className="p-3 border border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-sm text-slate-900">{template.name}</p>
                <p className="text-xs text-slate-500">{template.description}</p>
              </div>
              <Badge variant="outline" className="text-xs flex-shrink-0">
                v{template.version}
              </Badge>
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              {template.specialty && (
                <Badge variant="outline" className="text-xs">{template.specialty}</Badge>
              )}
              {template.usage_count > 0 && (
                <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700">
                  {template.usage_count} uses
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}