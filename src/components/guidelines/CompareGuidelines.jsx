import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { X, ArrowLeftRight, Loader2, Pill, Microscope, FileText, Activity, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";

const comparisonAspects = [
  { id: "medications", label: "Drug Recommendations", icon: Pill, description: "Compare medication choices, dosing, and alternatives" },
  { id: "diagnostics", label: "Diagnostic Criteria", icon: Microscope, description: "Compare diagnostic tests and thresholds" },
  { id: "treatment", label: "Treatment Protocols", icon: Activity, description: "Compare overall treatment approaches" },
  { id: "evidence", label: "Evidence Quality", icon: FileText, description: "Compare strength of evidence and sources" },
];

export default function CompareGuidelines({ selectedGuidelines, onClose, comparison, isLoading, onCompare }) {
  const [selectedAspects, setSelectedAspects] = useState(comparisonAspects.map(a => a.id));
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <ArrowLeftRight className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Compare Guidelines</h2>
              <p className="text-sm text-slate-500">{selectedGuidelines.length} guidelines selected</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Selected Guidelines */}
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Comparing:</p>
          <div className="space-y-2 mb-6">
            {selectedGuidelines.map((guideline, idx) => (
              <div key={guideline.id} className="flex items-start gap-2">
                <Badge variant="outline" className="bg-white">
                  {idx + 1}
                </Badge>
                <p className="text-sm text-slate-700 flex-1">{guideline.question}</p>
              </div>
            ))}
          </div>

          {/* Comparison Focus Selector */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Focus Comparison On:</p>
            <div className="grid grid-cols-2 gap-3">
              {comparisonAspects.map((aspect) => {
                const Icon = aspect.icon;
                const isSelected = selectedAspects.includes(aspect.id);
                return (
                  <div
                    key={aspect.id}
                    onClick={() => {
                      setSelectedAspects(prev => 
                        prev.includes(aspect.id) 
                          ? prev.filter(id => id !== aspect.id)
                          : [...prev, aspect.id]
                      );
                    }}
                    className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected 
                        ? "border-blue-500 bg-blue-50" 
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isSelected ? "bg-blue-500" : "bg-slate-100"
                    }`}>
                      {isSelected ? (
                        <Check className="w-4 h-4 text-white" />
                      ) : (
                        <Icon className="w-4 h-4 text-slate-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${isSelected ? "text-blue-900" : "text-slate-900"}`}>
                        {aspect.label}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">{aspect.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <Button
              onClick={() => onCompare(selectedAspects)}
              disabled={selectedAspects.length === 0}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700 rounded-xl"
            >
              <ArrowLeftRight className="w-4 h-4 mr-2" />
              Generate Focused Comparison
            </Button>
          </div>
        </div>

        {/* Comparison Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-4" />
              <p className="text-sm text-slate-600">Analyzing guidelines and generating comparison...</p>
            </div>
          ) : comparison ? (
            <ReactMarkdown
              className="prose prose-sm prose-slate max-w-none
                [&>h1]:text-xl [&>h1]:font-bold [&>h1]:mt-6 [&>h1]:mb-3 [&>h1]:text-slate-900
                [&>h2]:text-lg [&>h2]:font-semibold [&>h2]:mt-5 [&>h2]:mb-2 [&>h2]:text-slate-800
                [&>h3]:text-base [&>h3]:font-semibold [&>h3]:mt-4 [&>h3]:mb-2 [&>h3]:text-slate-700
                [&>p]:text-sm [&>p]:leading-relaxed [&>p]:text-slate-700 [&>p]:mb-3
                [&>ul]:text-sm [&>ul]:text-slate-700 [&>ul]:mb-3 [&>ul]:space-y-1
                [&>ol]:text-sm [&>ol]:text-slate-700 [&>ol]:mb-3 [&>ol]:space-y-1
                [&>li]:mb-1
                [&>table]:text-sm [&>table]:border-collapse [&>table]:w-full [&>table]:my-4
                [&>table>thead]:bg-slate-50
                [&>table>thead>tr>th]:border [&>table>thead>tr>th]:border-slate-200 [&>table>thead>tr>th]:p-2 [&>table>thead>tr>th]:font-semibold [&>table>thead>tr>th]:text-left
                [&>table>tbody>tr>td]:border [&>table>tbody>tr>td]:border-slate-200 [&>table>tbody>tr>td]:p-2
                [&>blockquote]:border-l-4 [&>blockquote]:border-purple-300 [&>blockquote]:bg-purple-50/50 [&>blockquote]:rounded-r-lg [&>blockquote]:px-4 [&>blockquote]:py-2
                [&>strong]:text-slate-900 [&>strong]:font-semibold
              "
            >
              {comparison}
            </ReactMarkdown>
          ) : (
            <div className="flex items-center justify-center py-12 text-slate-500">
              <p>No comparison available</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}