import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Plus, X, GripVertical, ChevronDown, ChevronRight } from "lucide-react";

export default function SectionEditor({ sections, onChange }) {
  const [expandedSections, setExpandedSections] = useState(new Set([0]));

  const addSection = () => {
    onChange([...sections, { name: "", description: "", subsections: [] }]);
    setExpandedSections(new Set([...expandedSections, sections.length]));
  };

  const removeSection = (index) => {
    onChange(sections.filter((_, i) => i !== index));
  };

  const updateSection = (index, field, value) => {
    const updated = [...sections];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const toggleSection = (index) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  return (
    <div className="space-y-3">
      {sections.map((section, sIdx) => (
        <Card key={sIdx} className="p-4">
          <div className="flex items-start gap-3">
            <GripVertical className="w-4 h-4 text-slate-400 mt-2 cursor-move" />
            <div className="flex-1 space-y-3">
              <div className="flex items-start gap-2">
                <button
                  onClick={() => toggleSection(sIdx)}
                  className="mt-2 text-slate-500 hover:text-slate-700"
                >
                  {expandedSections.has(sIdx) ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                <div className="flex-1 space-y-2">
                  <Input
                    value={section.name}
                    onChange={(e) => updateSection(sIdx, "name", e.target.value)}
                    placeholder="Section name (e.g., History of Present Illness)"
                    className="rounded-lg font-medium"
                  />
                  {expandedSections.has(sIdx) && (
                    <>
                      <Input
                        value={section.description}
                        onChange={(e) => updateSection(sIdx, "description", e.target.value)}
                        placeholder="Section description (optional)"
                        className="rounded-lg text-sm"
                      />
                      <Textarea
                        value={section.ai_instructions || ""}
                        onChange={(e) => updateSection(sIdx, "ai_instructions", e.target.value)}
                        placeholder="AI instructions for this section (e.g., 'Focus on current symptoms and duration', 'Include vital signs and physical exam findings')"
                        className="rounded-lg text-sm min-h-[80px]"
                      />
                    </>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSection(sIdx)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}
      
      <Button
        type="button"
        variant="outline"
        onClick={addSection}
        className="w-full rounded-lg gap-2"
      >
        <Plus className="w-4 h-4" /> Add Section
      </Button>
    </div>
  );
}