import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, FileText, ChevronRight, Loader2, Zap, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";

const NOTE_TYPES = [
  {
    id: "progress_note",
    label: "Progress Note",
    description: "Follow-up visit or ongoing care documentation",
    icon: "📋",
    color: "blue"
  },
  {
    id: "h_and_p",
    label: "History & Physical",
    description: "Comprehensive initial assessment and examination",
    icon: "🏥",
    color: "emerald"
  },
  {
    id: "discharge_summary",
    label: "Discharge Summary",
    description: "Summary for patient discharge from hospital/facility",
    icon: "📤",
    color: "amber"
  },
  {
    id: "consult",
    label: "Consultation",
    description: "Specialist consultation note",
    icon: "👨‍⚕️",
    color: "purple"
  },
  {
    id: "procedure_note",
    label: "Procedure Note",
    description: "Documentation of performed procedure",
    icon: "🔧",
    color: "rose"
  }
];

export default function NoteTypeAndTemplateSelector({
  note,
  templates = [],
  selectedTemplate,
  onNoteTypeChange,
  onTemplateSelect,
  onApplyTemplate,
  isApplyingTemplate = false
}) {
  const [expandedType, setExpandedType] = useState(note?.note_type || "progress_note");

  const currentType = NOTE_TYPES.find(t => t.id === expandedType);
  const applicableTemplates = templates.filter(t => !t.note_type || t.note_type === expandedType);

  return (
    <div className="space-y-6">
      {/* Note Type Selection */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 p-8 shadow-lg">
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Note Type
          </h3>
          <p className="text-sm text-slate-600">Select the type of clinical note you're creating</p>
        </div>

        {/* Type Grid */}
        <div className="grid md:grid-cols-5 gap-3">
          {NOTE_TYPES.map((type) => (
            <motion.button
              key={type.id}
              onClick={() => {
                setExpandedType(type.id);
                onNoteTypeChange(type.id);
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                expandedType === type.id
                  ? `border-${type.color}-500 bg-white shadow-lg ring-2 ring-${type.color}-200`
                  : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
              }`}
            >
              <div className="text-3xl mb-2">{type.icon}</div>
              <p className="text-xs font-bold text-slate-900 leading-tight">{type.label}</p>
              {expandedType === type.id && (
                <div className={`absolute top-2 right-2 w-3 h-3 rounded-full bg-${type.color}-500`} />
              )}
            </motion.button>
          ))}
        </div>

        {/* Type Description */}
        {currentType && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-white rounded-lg border border-blue-200"
          >
            <p className="text-sm text-slate-700">
              <span className="font-semibold text-slate-900">{currentType.label}:</span> {currentType.description}
            </p>
          </motion.div>
        )}
      </div>

      {/* Smart Template Applicator */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200 p-8 shadow-lg">
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            AI Smart Templates
          </h3>
          <p className="text-sm text-slate-600">Apply a pre-built template to auto-populate sections</p>
        </div>

        {applicableTemplates.length > 0 ? (
          <div className="space-y-3">
            {applicableTemplates.map((template) => (
              <motion.div
                key={template.id}
                whileHover={{ scale: 1.02 }}
                className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedTemplate?.id === template.id
                    ? "border-purple-500 bg-white shadow-lg ring-2 ring-purple-200"
                    : "border-slate-200 bg-white hover:border-purple-300 hover:shadow-md"
                }`}
                onClick={() => onTemplateSelect(template)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900">{template.name}</h4>
                    <p className="text-xs text-slate-600 mt-1">{template.description}</p>
                    {template.specialty && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 font-medium">
                          {template.specialty}
                        </span>
                      </div>
                    )}
                  </div>
                  {selectedTemplate?.id === template.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center"
                    >
                      <ChevronRight className="w-4 h-4 text-white" />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-white rounded-xl border-2 border-dashed border-purple-300">
            <Sparkles className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">No templates available for this note type</p>
            <p className="text-sm text-slate-500 mt-1">Create a custom template from your existing notes</p>
          </div>
        )}

        {/* Apply Template Button */}
        {selectedTemplate && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4"
          >
            <Button
              onClick={() => onApplyTemplate(selectedTemplate.id)}
              disabled={isApplyingTemplate}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white gap-2 py-6"
            >
              {isApplyingTemplate ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Applying Template...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Apply Template
                </>
              )}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}