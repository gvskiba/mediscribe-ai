import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronUp,
  X,
  Plus,
  GripVertical,
  Sparkles,
  Settings2,
  Eye,
  EyeOff
} from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function SectionEditor({ sections, onChange }) {
  const [expandedSections, setExpandedSections] = useState(new Set([0]));

  const toggleSection = (index) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  const addSection = () => {
    const newSection = {
      id: `section_${Date.now()}`,
      name: "",
      description: "",
      ai_instructions: "",
      enabled: true,
      order: sections.length,
      conditional_logic: {
        enabled: false,
        condition_type: "note_type",
        condition_value: ""
      }
    };
    onChange([...sections, newSection]);
    setExpandedSections(new Set([...expandedSections, sections.length]));
  };

  const removeSection = (index) => {
    onChange(sections.filter((_, i) => i !== index));
  };

  const updateSection = (index, field, value) => {
    const updated = [...sections];
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      updated[index] = {
        ...updated[index],
        [parent]: {
          ...updated[index][parent],
          [child]: value
        }
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    onChange(updated);
  };

  const toggleEnabled = (index) => {
    updateSection(index, 'enabled', !sections[index].enabled);
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order property
    const reordered = items.map((item, index) => ({
      ...item,
      order: index
    }));

    onChange(reordered);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <Label className="text-sm font-semibold text-slate-700">Template Sections</Label>
        <Button
          type="button"
          onClick={addSection}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Plus className="w-3.5 h-3.5" /> Add Section
        </Button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="sections">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-2"
            >
              {sections.map((section, index) => (
                <Draggable
                  key={section.id || `section-${index}`}
                  draggableId={section.id || `section-${index}`}
                  index={index}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`bg-white rounded-lg border transition-all ${
                        snapshot.isDragging
                          ? "border-blue-300 shadow-lg"
                          : section.enabled
                          ? "border-slate-200"
                          : "border-slate-100 bg-slate-50/50"
                      }`}
                    >
                      <div className="flex items-center gap-2 p-3">
                        <div
                          {...provided.dragHandleProps}
                          className="cursor-grab active:cursor-grabbing"
                        >
                          <GripVertical className="w-4 h-4 text-slate-400" />
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleEnabled(index)}
                          className="p-1.5 hover:bg-slate-100 rounded-md transition-colors"
                        >
                          {section.enabled ? (
                            <Eye className="w-4 h-4 text-slate-600" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-slate-400" />
                          )}
                        </button>

                        <Input
                          placeholder="Section name (e.g., Chief Complaint)"
                          value={section.name}
                          onChange={(e) => updateSection(index, "name", e.target.value)}
                          className="flex-1 h-9 text-sm"
                          disabled={!section.enabled}
                        />

                        <button
                          type="button"
                          onClick={() => toggleSection(index)}
                          className="p-1.5 hover:bg-slate-100 rounded-md transition-colors"
                        >
                          {expandedSections.has(index) ? (
                            <ChevronUp className="w-4 h-4 text-slate-500" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-500" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => removeSection(index)}
                          className="p-1.5 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </button>
                      </div>

                      {expandedSections.has(index) && (
                        <div className="px-3 pb-3 space-y-3 border-t border-slate-100 pt-3">
                          <div>
                            <Label className="text-xs text-slate-600 mb-1.5">
                              Section Description
                            </Label>
                            <Textarea
                              placeholder="What should this section contain?"
                              value={section.description || ""}
                              onChange={(e) =>
                                updateSection(index, "description", e.target.value)
                              }
                              className="h-16 text-sm resize-none"
                              disabled={!section.enabled}
                            />
                          </div>

                          <div>
                            <div className="flex items-center gap-2 mb-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                              <Label className="text-xs text-slate-600">
                                AI Extraction Instructions
                              </Label>
                            </div>
                            <Textarea
                              placeholder="Tell the AI how to extract and structure information for this section..."
                              value={section.ai_instructions || ""}
                              onChange={(e) =>
                                updateSection(index, "ai_instructions", e.target.value)
                              }
                              className="h-24 text-sm resize-none font-mono"
                              disabled={!section.enabled}
                            />
                            <p className="text-xs text-slate-500 mt-1">
                              Be specific: "Extract all symptoms by body system", "List medications with dosages", etc.
                            </p>
                          </div>

                          {/* Conditional Logic */}
                          <div className="border-t border-slate-100 pt-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Settings2 className="w-3.5 h-3.5 text-slate-400" />
                                <Label className="text-xs text-slate-600">
                                  Conditional Display
                                </Label>
                              </div>
                              <Switch
                                checked={section.conditional_logic?.enabled || false}
                                onCheckedChange={(checked) =>
                                  updateSection(index, "conditional_logic.enabled", checked)
                                }
                                disabled={!section.enabled}
                              />
                            </div>

                            {section.conditional_logic?.enabled && (
                              <div className="space-y-2 pl-5">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <Label className="text-xs text-slate-600 mb-1">
                                      Condition Type
                                    </Label>
                                    <Select
                                      value={section.conditional_logic.condition_type || "note_type"}
                                      onValueChange={(value) =>
                                        updateSection(index, "conditional_logic.condition_type", value)
                                      }
                                      disabled={!section.enabled}
                                    >
                                      <SelectTrigger className="h-8 text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="note_type">Note Type</SelectItem>
                                        <SelectItem value="specialty">Specialty</SelectItem>
                                        <SelectItem value="diagnosis_contains">Diagnosis Contains</SelectItem>
                                        <SelectItem value="custom">Custom Logic</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div>
                                    <Label className="text-xs text-slate-600 mb-1">
                                      Condition Value
                                    </Label>
                                    <Input
                                      placeholder="e.g., h_and_p"
                                      value={section.conditional_logic.condition_value || ""}
                                      onChange={(e) =>
                                        updateSection(index, "conditional_logic.condition_value", e.target.value)
                                      }
                                      className="h-8 text-xs"
                                      disabled={!section.enabled}
                                    />
                                  </div>
                                </div>
                                <p className="text-xs text-slate-500">
                                  This section will only appear when the condition matches
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {sections.length === 0 && (
        <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200">
          <p className="text-sm text-slate-500 mb-3">No sections defined yet</p>
          <Button
            type="button"
            onClick={addSection}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Plus className="w-3.5 h-3.5" /> Add First Section
          </Button>
        </div>
      )}
    </div>
  );
}