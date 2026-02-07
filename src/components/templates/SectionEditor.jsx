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

  const addSubsection = (sectionIndex) => {
    const updated = [...sections];
    updated[sectionIndex].subsections = [
      ...(updated[sectionIndex].subsections || []),
      { name: "", field_type: "text" }
    ];
    onChange(updated);
  };

  const removeSubsection = (sectionIndex, subsectionIndex) => {
    const updated = [...sections];
    updated[sectionIndex].subsections = updated[sectionIndex].subsections.filter((_, i) => i !== subsectionIndex);
    onChange(updated);
  };

  const updateSubsection = (sectionIndex, subsectionIndex, field, value) => {
    const updated = [...sections];
    updated[sectionIndex].subsections[subsectionIndex] = {
      ...updated[sectionIndex].subsections[subsectionIndex],
      [field]: value
    };
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
                      
                      {/* Subsections */}
                      <div className="ml-4 space-y-2 mt-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-600">Subsections</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addSubsection(sIdx)}
                            className="h-7 text-xs gap-1"
                          >
                            <Plus className="w-3 h-3" /> Add Field
                          </Button>
                        </div>
                        {section.subsections?.map((subsection, ssIdx) => (
                          <div key={ssIdx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg">
                            <Input
                              value={subsection.name}
                              onChange={(e) => updateSubsection(sIdx, ssIdx, "name", e.target.value)}
                              placeholder="Field name"
                              className="flex-1 h-8 text-sm bg-white"
                            />
                            <Select
                              value={subsection.field_type}
                              onValueChange={(v) => updateSubsection(sIdx, ssIdx, "field_type", v)}
                            >
                              <SelectTrigger className="w-32 h-8 text-xs bg-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">Text</SelectItem>
                                <SelectItem value="textarea">Long Text</SelectItem>
                                <SelectItem value="array">List</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSubsection(sIdx, ssIdx)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
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