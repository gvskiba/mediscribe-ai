import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Sparkles, Plus, Trash2, Edit2, Save, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SectionAIInstructions({ value, onChange }) {
  const [globalInstructions, setGlobalInstructions] = useState(value?.global_instructions || "");
  const [fieldInstructions, setFieldInstructions] = useState(value?.field_instructions || []);
  const [editingFieldIdx, setEditingFieldIdx] = useState(null);
  const [newField, setNewField] = useState({ field_name: "", instructions: "" });
  const [showNewField, setShowNewField] = useState(false);

  const handleUpdateGlobal = (text) => {
    setGlobalInstructions(text);
    onChange({ global_instructions: text, field_instructions: fieldInstructions });
  };

  const handleAddField = () => {
    if (!newField.field_name.trim() || !newField.instructions.trim()) return;
    const updated = [...fieldInstructions, newField];
    setFieldInstructions(updated);
    onChange({ global_instructions: globalInstructions, field_instructions: updated });
    setNewField({ field_name: "", instructions: "" });
    setShowNewField(false);
  };

  const handleRemoveField = (idx) => {
    const updated = fieldInstructions.filter((_, i) => i !== idx);
    setFieldInstructions(updated);
    onChange({ global_instructions: globalInstructions, field_instructions: updated });
  };

  const handleEditField = (idx, updated) => {
    const newFields = [...fieldInstructions];
    newFields[idx] = updated;
    setFieldInstructions(newFields);
    onChange({ global_instructions: globalInstructions, field_instructions: newFields });
    setEditingFieldIdx(null);
  };

  return (
    <div className="space-y-4">
      {/* Global Instructions */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <label className="text-sm font-semibold text-slate-900">Overall Section Instructions</label>
        </div>
        <Textarea
          value={globalInstructions}
          onChange={(e) => handleUpdateGlobal(e.target.value)}
          placeholder="Provide overall AI guidance for this section. Example: 'Focus on OLDCARTS framework for symptom characterization. Include temporal relationships between symptoms.'"
          className="min-h-20 text-sm"
        />
        <p className="text-xs text-slate-500 mt-1">
          These instructions guide the AI on how to extract and structure ALL information for this section.
        </p>
      </div>

      {/* Field-Specific Instructions */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-slate-900">Field-Specific Instructions</label>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowNewField(true)}
            className="gap-1 h-7"
          >
            <Plus className="w-3 h-3" /> Add Field
          </Button>
        </div>

        <AnimatePresence>
          {fieldInstructions.map((field, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-3 p-3 bg-slate-50 rounded-lg border border-slate-200"
            >
              {editingFieldIdx === idx ? (
                <div className="space-y-2">
                  <Input
                    value={field.field_name}
                    onChange={(e) => handleEditField(idx, { ...field, field_name: e.target.value })}
                    placeholder="Field name (e.g., 'symptom_onset', 'vital_signs')"
                    className="text-sm"
                  />
                  <Textarea
                    value={field.instructions}
                    onChange={(e) => handleEditField(idx, { ...field, instructions: e.target.value })}
                    placeholder="Instructions for this specific field"
                    className="text-sm min-h-16"
                  />
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      onClick={() => setEditingFieldIdx(null)}
                      className="gap-1 h-7"
                    >
                      <Save className="w-3 h-3" /> Done
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingFieldIdx(null)}
                      className="gap-1 h-7"
                    >
                      <X className="w-3 h-3" /> Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{field.field_name}</p>
                    <p className="text-xs text-slate-600 mt-1">{field.instructions}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingFieldIdx(idx)}
                      className="h-6 w-6 p-0"
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveField(idx)}
                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {showNewField && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-blue-50 rounded-lg border border-blue-200 space-y-2"
          >
            <Input
              value={newField.field_name}
              onChange={(e) => setNewField({ ...newField, field_name: e.target.value })}
              placeholder="Field name (e.g., 'symptom_onset', 'vital_signs')"
              className="text-sm"
              autoFocus
            />
            <Textarea
              value={newField.instructions}
              onChange={(e) => setNewField({ ...newField, instructions: e.target.value })}
              placeholder="Instructions for this specific field. Example: 'Extract the exact onset time and date. If relative (e.g., yesterday), convert to specific timeframe.'"
              className="text-sm min-h-16"
            />
            <div className="flex gap-1">
              <Button
                size="sm"
                onClick={handleAddField}
                className="gap-1 h-7 bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-3 h-3" /> Add
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowNewField(false);
                  setNewField({ field_name: "", instructions: "" });
                }}
                className="gap-1 h-7"
              >
                <X className="w-3 h-3" /> Cancel
              </Button>
            </div>
          </motion.div>
        )}

        {fieldInstructions.length === 0 && !showNewField && (
          <p className="text-xs text-slate-400 italic">No field-specific instructions added yet.</p>
        )}
      </div>
    </div>
  );
}