import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, Pill, Stethoscope, ClipboardList, Target, Lightbulb, X, Loader2, ChevronDown, ChevronUp, FileText, Activity, BookOpen, Sparkles, Link, CheckCircle2, Copy, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import EditableSection from "./EditableSection";

export default function StructuredNotePreview({ note, onFinalize, onEdit, onUpdate, onReanalyze, guidelineRecommendations = [], loadingGuidelines = false, onGenerateEducationMaterials, onRateField, confidenceScores = {} }) {
  const [showGuidelines, setShowGuidelines] = useState(true);
  const [expandedGuideline, setExpandedGuideline] = useState(null);
  const [linkedGuidelines, setLinkedGuidelines] = useState(note.linked_guidelines || []);
  const [previewOpen, setPreviewOpen] = useState(false);

  const generateFormattedNote = () => {
    let formatted = `CLINICAL NOTE\n${"=".repeat(60)}\n\n`;
    
    if (note.patient_name) formatted += `Patient: ${note.patient_name}\n`;
    if (note.patient_id) formatted += `MRN: ${note.patient_id}\n`;
    if (note.date_of_visit) formatted += `Date of Visit: ${note.date_of_visit}\n`;
    if (note.note_type) formatted += `Note Type: ${note.note_type.replace(/_/g, " ").toUpperCase()}\n`;
    formatted += `\n${"=".repeat(60)}\n\n`;
    
    if (note.chief_complaint) {
      formatted += `CHIEF COMPLAINT:\n${note.chief_complaint}\n\n`;
    }
    
    if (note.clinical_impression) {
      formatted += `CLINICAL IMPRESSION:\n${note.clinical_impression}\n\n`;
    }
    
    if (note.history_of_present_illness) {
      formatted += `HISTORY OF PRESENT ILLNESS:\n${note.history_of_present_illness}\n\n`;
    }
    
    if (note.medical_history) {
      formatted += `MEDICAL HISTORY:\n${note.medical_history}\n\n`;
    }
    
    if (note.review_of_systems) {
      formatted += `REVIEW OF SYSTEMS:\n${note.review_of_systems}\n\n`;
    }
    
    if (note.physical_exam) {
      formatted += `PHYSICAL EXAMINATION:\n${note.physical_exam}\n\n`;
    }
    
    if (note.assessment) {
      formatted += `ASSESSMENT:\n${note.assessment}\n\n`;
    }
    
    if (Array.isArray(note.diagnoses) && note.diagnoses.length > 0) {
      formatted += `DIAGNOSES:\n`;
      note.diagnoses.forEach((dx, i) => {
        formatted += `${i + 1}. ${dx}\n`;
      });
      formatted += `\n`;
    }
    
    if (note.plan) {
      formatted += `PLAN:\n${note.plan}\n\n`;
    }
    
    if (Array.isArray(note.medications) && note.medications.length > 0) {
      formatted += `MEDICATIONS:\n`;
      note.medications.forEach((med, i) => {
        formatted += `${i + 1}. ${med}\n`;
      });
      formatted += `\n`;
    }
    
    return formatted;
  };

  const handleCopyNote = () => {
    const formatted = generateFormattedNote();
    navigator.clipboard.writeText(formatted);
    toast.success("Note copied to clipboard");
  };
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
          <Button 
            variant="outline"
            onClick={() => setPreviewOpen(true)}
            className="rounded-xl gap-2"
          >
            <Eye className="w-4 h-4" /> Preview & Copy
          </Button>
          {onGenerateEducationMaterials && (
            <Button 
              variant="outline"
              onClick={onGenerateEducationMaterials} 
              className="rounded-xl gap-2 text-emerald-600 border-emerald-300 hover:bg-emerald-50"
            >
              <BookOpen className="w-4 h-4" /> Patient Education
            </Button>
          )}
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-xl border border-purple-200 shadow-sm overflow-hidden"
          >
            <div className="p-5 flex items-start justify-between border-b border-slate-100 bg-gradient-to-r from-purple-50/50 to-blue-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Clinical Guidelines</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Evidence-based recommendations</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowGuidelines(false)}
                className="h-8 w-8 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4 text-slate-400" />
              </Button>
            </div>

            <div className="p-5">
              {loadingGuidelines ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-3" />
                  <p className="text-sm font-medium text-slate-900">Analyzing guidelines</p>
                  <p className="text-xs text-slate-500 mt-1">Fetching evidence-based recommendations...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {guidelineRecommendations.map((rec, idx) => {
                    const isLinked = linkedGuidelines.some(g => g.condition === rec.condition);
                    const isExpanded = expandedGuideline === idx;

                    return (
                      <div key={idx} className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden hover:border-purple-300 transition-colors">
                        <button
                          onClick={() => setExpandedGuideline(isExpanded ? null : idx)}
                          className="w-full flex items-center justify-between p-4 hover:bg-slate-100/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLinked ? 'bg-green-100' : 'bg-purple-100'}`}>
                              {isLinked ? (
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                              ) : (
                                <Target className="w-4 h-4 text-purple-600" />
                              )}
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-semibold text-slate-900">{rec.condition}</p>
                              {isLinked && (
                                <p className="text-xs text-green-600 mt-0.5">Linked to note</p>
                              )}
                            </div>
                          </div>
                          <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="border-t border-slate-200 bg-white"
                            >
                              <div className="p-4 space-y-4">
                                {rec.summary && (
                                  <div>
                                    <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Summary</h4>
                                    <p className="text-sm text-slate-600 leading-relaxed">{rec.summary}</p>
                                  </div>
                                )}
                                
                                {rec.key_points && rec.key_points.length > 0 && (
                                  <div>
                                    <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Key Points</h4>
                                    <ul className="space-y-2">
                                      {rec.key_points.map((point, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                          <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
                                          <span>{point}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                <div className="flex gap-2 pt-3 border-t border-slate-100">
                                  {!isLinked ? (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          const newLinked = [...linkedGuidelines, {
                                            guideline_query_id: rec.guideline_id,
                                            condition: rec.condition,
                                            incorporated: false,
                                            adherence_notes: ""
                                          }];
                                          setLinkedGuidelines(newLinked);
                                          onUpdate("linked_guidelines", newLinked);
                                        }}
                                        className="flex-1 gap-1.5 rounded-lg"
                                      >
                                        <Link className="w-3.5 h-3.5" /> Link to Note
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={() => {
                                          const guidelineText = `\n\n[Guideline - ${rec.condition}]\n${rec.summary}\nKey Points:\n${rec.key_points?.map(p => `- ${p}`).join('\n')}`;
                                          onUpdate("plan", (note.plan || "") + guidelineText);

                                          const newLinked = [...linkedGuidelines, {
                                            guideline_query_id: rec.guideline_id,
                                            condition: rec.condition,
                                            incorporated: true,
                                            adherence_notes: "Guideline incorporated into plan"
                                          }];
                                          setLinkedGuidelines(newLinked);
                                          onUpdate("linked_guidelines", newLinked);
                                        }}
                                        className="flex-1 gap-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg"
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Add to Plan
                                      </Button>
                                    </>
                                  ) : (
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg text-green-700 text-sm font-medium">
                                      <CheckCircle2 className="w-4 h-4" />
                                      <span>Successfully linked</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Clinical Impression */}
        {note.clinical_impression && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-slate-900">Clinical Impression</h3>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">{note.clinical_impression}</p>
          </div>
        )}

        {/* Chief Complaint */}
        <EditableSection
          icon={Target}
          title="Chief Complaint"
          color="blue"
          value={note.chief_complaint || "Not extracted"}
          field="chief_complaint"
          type="text"
          onUpdate={onUpdate}
          onReanalyze={onReanalyze}
        />

        {/* History of Present Illness */}
        {note.history_of_present_illness && (
          <EditableSection
            icon={FileText}
            title="History of Present Illness"
            color="indigo"
            value={note.history_of_present_illness}
            field="history_of_present_illness"
            type="textarea"
            onUpdate={onUpdate}
            onReanalyze={onReanalyze}
          />
        )}

        {/* Medical History */}
        <EditableSection
          icon={FileText}
          title="Medical History"
          color="slate"
          value={note.medical_history || "Not extracted"}
          field="medical_history"
          type="textarea"
          onUpdate={onUpdate}
          onReanalyze={onReanalyze}
        />

        {/* Review of Systems */}
        <div>
          <EditableSection
            icon={ClipboardList}
            title="Review of Systems"
            color="indigo"
            value={note.review_of_systems || "Not extracted"}
            field="review_of_systems"
            type="textarea"
            onUpdate={onUpdate}
            onReanalyze={onReanalyze}
          />
          {onRateField && confidenceScores.review_of_systems && (
            <div className="mt-2 flex justify-end">
              <button
                onClick={() => onRateField("review_of_systems", note.review_of_systems, confidenceScores.review_of_systems)}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Rate accuracy
              </button>
            </div>
          )}
        </div>

        {/* Physical Exam */}
        <div>
          <EditableSection
            icon={Activity}
            title="Physical Exam"
            color="teal"
            value={note.physical_exam || "Not extracted"}
            field="physical_exam"
            type="textarea"
            onUpdate={onUpdate}
            onReanalyze={onReanalyze}
          />
          {onRateField && confidenceScores.physical_exam && (
            <div className="mt-2 flex justify-end">
              <button
                onClick={() => onRateField("physical_exam", note.physical_exam, confidenceScores.physical_exam)}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Rate accuracy
              </button>
            </div>
          )}
        </div>

        {/* Assessment */}
        <EditableSection
          icon={Stethoscope}
          title="Assessment"
          color="purple"
          value={note.assessment || "Not extracted"}
          field="assessment"
          type="textarea"
          onUpdate={onUpdate}
          onReanalyze={onReanalyze}
        />

        {/* Plan */}
        <EditableSection
          icon={ClipboardList}
          title="Plan"
          color="emerald"
          value={note.plan || "Not extracted"}
          field="plan"
          type="textarea"
          onUpdate={onUpdate}
          onReanalyze={onReanalyze}
        />

        {/* Diagnoses */}
        <EditableSection
          icon={Target}
          title="Diagnoses"
          color="amber"
          value={note.diagnoses && note.diagnoses.length > 0 ? note.diagnoses : ["Not extracted"]}
          field="diagnoses"
          type="array"
          onUpdate={onUpdate}
          onReanalyze={onReanalyze}
        />

        {/* Medications */}
        <EditableSection
          icon={Pill}
          title="Medications"
          color="rose"
          value={note.medications && note.medications.length > 0 ? note.medications : ["Not extracted"]}
          field="medications"
          type="array"
          onUpdate={onUpdate}
          onReanalyze={onReanalyze}
        />
      </div>

      {/* Preview & Copy Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Note Preview
              </span>
              <Button onClick={handleCopyNote} className="gap-2">
                <Copy className="w-4 h-4" /> Copy to Clipboard
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            <pre className="text-sm bg-slate-50 p-6 rounded-lg border border-slate-200 font-mono whitespace-pre-wrap leading-relaxed">
              {generateFormattedNote()}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}