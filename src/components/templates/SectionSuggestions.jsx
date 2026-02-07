import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, Plus, ChevronDown, ChevronUp, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function SectionSuggestions({ suggestions, onApply, isLoading }) {
  const [selectedSections, setSelectedSections] = useState(new Set());
  const [expandedSections, setExpandedSections] = useState(new Set());

  const toggleSection = (index) => {
    const newSet = new Set(selectedSections);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setSelectedSections(newSet);
  };

  const toggleExpanded = (index) => {
    const newSet = new Set(expandedSections);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setExpandedSections(newSet);
  };

  const handleApplySelected = () => {
    if (selectedSections.size > 0) {
      const selected = suggestions
        .filter((_, idx) => selectedSections.has(idx))
        .map((section, idx) => ({
          id: `section_${Date.now()}_${idx}`,
          name: section.name,
          description: section.description,
          ai_instructions: section.ai_instructions,
          ai_instructions_detailed: {
            global_instructions: section.ai_instructions,
            field_instructions: []
          },
          enabled: true,
          order: idx,
          conditional_logic: {
            enabled: false,
            condition_type: "note_type",
            condition_value: ""
          }
        }));
      onApply(selected);
      setSelectedSections(new Set());
    }
  };

  if (!suggestions || suggestions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <div>
            <h3 className="font-semibold text-slate-900">AI-Suggested Sections</h3>
            <p className="text-xs text-slate-500">Based on note type and specialty</p>
          </div>
        </div>
        <Badge className="bg-purple-100 text-purple-700">
          {suggestions.length} sections
        </Badge>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {suggestions.map((section, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`bg-white rounded-lg border-2 p-3 transition-all cursor-pointer ${
              selectedSections.has(idx)
                ? "border-purple-300 bg-purple-50"
                : "border-slate-200 hover:border-purple-200"
            }`}
            onClick={() => toggleSection(idx)}
          >
            <div className="flex items-start gap-3">
              <Checkbox
                checked={selectedSections.has(idx)}
                onChange={() => toggleSection(idx)}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-slate-900 truncate">
                    {section.name}
                  </h4>
                  {selectedSections.has(idx) && (
                    <Badge className="bg-purple-600 text-white text-xs">
                      Selected
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-slate-600 mb-2 line-clamp-2">
                  {section.description}
                </p>
                {section.ai_instructions && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpanded(idx);
                    }}
                    className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1"
                  >
                    {expandedSections.has(idx) ? (
                      <>
                        <ChevronUp className="w-3 h-3" /> Hide instructions
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3 h-3" /> View AI guidance
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {expandedSections.has(idx) && section.ai_instructions && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 pt-2 border-t border-slate-200"
              >
                <div className="flex gap-2 mb-1">
                  <Zap className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {section.ai_instructions}
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="flex gap-2 pt-2 border-t border-purple-200">
        <Button
          onClick={handleApplySelected}
          disabled={selectedSections.size === 0}
          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Selected ({selectedSections.size})
        </Button>
        <Button
          onClick={() => {
            const newSet = new Set(selectedSections);
            if (newSet.size === suggestions.length) {
              newSet.clear();
            } else {
              suggestions.forEach((_, idx) => newSet.add(idx));
            }
            setSelectedSections(newSet);
          }}
          variant="outline"
          className="text-xs"
        >
          {selectedSections.size === suggestions.length ? "Deselect All" : "Select All"}
        </Button>
      </div>
    </motion.div>
  );
}