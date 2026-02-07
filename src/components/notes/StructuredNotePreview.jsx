import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Pill, Stethoscope, ClipboardList, Target, Lightbulb, X, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import EditableSection from "./EditableSection";

export default function StructuredNotePreview({ note, onFinalize, onEdit, onUpdate, onReanalyze, guidelineRecommendations = [], loadingGuidelines = false }) {
  const [showGuidelines, setShowGuidelines] = useState(true);
  const [expandedGuideline, setExpandedGuideline] = useState(null);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
    >
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">AI-Structured Note</h2>
          <p className="text-sm text-slate-500 mt-1">Review and finalize the structured note.</p>
        </div>
        <div className="flex gap-2">
          {onFinalize && (
            <Button onClick={onFinalize} className="bg-emerald-600 hover:bg-emerald-700 rounded-xl gap-2">
              <Check className="w-4 h-4" /> Finalize
            </Button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* AI-Powered Guideline Recommendations */}
        {(loadingGuidelines || (guidelineRecommendations.length > 0 && showGuidelines)) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-100 overflow-hidden"
          >
            <div className="p-4 flex items-start justify-between border-b border-purple-100 bg-white/50">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-purple-600" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">AI Guideline Recommendations</h3>
                  <p className="text-xs text-slate-500">Evidence-based suggestions for diagnosed conditions</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowGuidelines(false)}
                className="h-7 w-7 -mt-1 -mr-1"
              >
                <X className="w-4 h-4 text-slate-400" />
              </Button>
            </div>

            <div className="p-4 space-y-3">
              {loadingGuidelines ? (
                <div className="flex items-center gap-2 text-sm text-purple-600 py-4">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Fetching evidence-based guidelines...
                </div>
              ) : (
                guidelineRecommendations.map((rec, idx) => (
                  <div key={idx} className="bg-white rounded-lg border border-purple-100 overflow-hidden">
                    <button
                      onClick={() => setExpandedGuideline(expandedGuideline === idx ? null : idx)}
                      className="w-full flex items-center justify-between p-3 hover:bg-purple-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-purple-100 flex items-center justify-center">
                          <Target className="w-3.5 h-3.5 text-purple-600" />
                        </div>
                        <span className="text-sm font-semibold text-slate-900">{rec.condition}</span>
                      </div>
                      {expandedGuideline === idx ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </button>

                    <AnimatePresence>
                      {expandedGuideline === idx && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t border-purple-100"
                        >
                          <div className="p-3 space-y-2">
                            {rec.summary && (
                              <p className="text-xs text-slate-600 leading-relaxed">{rec.summary}</p>
                            )}
                            {rec.key_points && rec.key_points.length > 0 && (
                              <ul className="text-xs text-slate-600 space-y-1 ml-4 list-disc">
                                {rec.key_points.map((point, i) => (
                                  <li key={i}>{point}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* Chief Complaint */}
        {note.chief_complaint && (
          <EditableSection
            icon={Target}
            title="Chief Complaint"
            color="blue"
            value={note.chief_complaint}
            field="chief_complaint"
            type="text"
            onUpdate={onUpdate}
            onReanalyze={onReanalyze}
          />
        )}

        {/* Assessment */}
        {note.assessment && (
          <EditableSection
            icon={Stethoscope}
            title="Assessment"
            color="purple"
            value={note.assessment}
            field="assessment"
            type="textarea"
            onUpdate={onUpdate}
            onReanalyze={onReanalyze}
          />
        )}

        {/* Plan */}
        {note.plan && (
          <EditableSection
            icon={ClipboardList}
            title="Plan"
            color="emerald"
            value={note.plan}
            field="plan"
            type="textarea"
            onUpdate={onUpdate}
            onReanalyze={onReanalyze}
          />
        )}

        {/* Diagnoses */}
        {note.diagnoses?.length > 0 && (
          <EditableSection
            icon={Target}
            title="Diagnoses"
            color="amber"
            value={note.diagnoses}
            field="diagnoses"
            type="array"
            onUpdate={onUpdate}
            onReanalyze={onReanalyze}
          />
        )}

        {/* Medications */}
        {note.medications?.length > 0 && (
          <EditableSection
            icon={Pill}
            title="Medications"
            color="rose"
            value={note.medications}
            field="medications"
            type="array"
            onUpdate={onUpdate}
            onReanalyze={onReanalyze}
          />
        )}
      </div>
    </motion.div>
  );
}