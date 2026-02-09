import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, Pill, Stethoscope, ClipboardList, Target, Lightbulb, X, Loader2, ChevronDown, ChevronUp, FileText, Activity, BookOpen, Sparkles, Link, CheckCircle2, Copy, Eye, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import EditableSection from "./EditableSection";
import MedicalKnowledgeSearch from "./MedicalKnowledgeSearch";
import InteractivePlanSection from "./InteractivePlanSection";

export default function StructuredNotePreview({ note, onFinalize, onEdit, onUpdate, onReanalyze, guidelineRecommendations = [], loadingGuidelines = false, medicationRecommendations = [], loadingMedications = false, onGenerateEducationMaterials }) {
  const [showGuidelines, setShowGuidelines] = useState(true);
  const [expandedGuideline, setExpandedGuideline] = useState(null);
  const [linkedGuidelines, setLinkedGuidelines] = useState(note.linked_guidelines || []);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [showMedications, setShowMedications] = useState(true);
  const [expandedMedication, setExpandedMedication] = useState(null);
  const [customSections, setCustomSections] = useState(note.custom_sections || []);
  const [analyzingHP, setAnalyzingHP] = useState(false);
  const [generatingAssessmentPlan, setGeneratingAssessmentPlan] = useState(false);
  const [differentialDiagnoses, setDifferentialDiagnoses] = useState([]);
  const [showDifferentials, setShowDifferentials] = useState(false);
  const [aiSuggestionFeedback, setAiSuggestionFeedback] = useState({});
  const [knowledgeSearchOpen, setKnowledgeSearchOpen] = useState(false);

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

  const handleAddSection = () => {
    const newSection = {
      id: Date.now().toString(),
      title: "New Section",
      content: ""
    };
    const updatedSections = [...customSections, newSection];
    setCustomSections(updatedSections);
    onUpdate("custom_sections", updatedSections);
  };

  const handleDeleteSection = (sectionId) => {
    const updatedSections = customSections.filter(s => s.id !== sectionId);
    setCustomSections(updatedSections);
    onUpdate("custom_sections", updatedSections);
  };

  const handleUpdateCustomSection = (sectionId, field, value) => {
    const updatedSections = customSections.map(s => 
      s.id === sectionId ? { ...s, [field]: value } : s
    );
    setCustomSections(updatedSections);
    onUpdate("custom_sections", updatedSections);
  };

  const handleAnalyzeHP = async () => {
    setAnalyzingHP(true);
    try {
      const { base44 } = await import("@/api/base44Client");
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze the following History and Physical examination and provide a concise clinical summary:

History of Present Illness:
${note.history_of_present_illness || "Not documented"}

Physical Exam:
${note.physical_exam || "Not documented"}

Medical History:
${note.medical_history || "Not documented"}

Review of Systems:
${note.review_of_systems || "Not documented"}

Provide:
1. A 2-3 sentence clinical summary highlighting the most significant findings
2. Key clinical patterns or red flags identified
3. Pertinent positive and negative findings`,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            key_patterns: { type: "array", items: { type: "string" } },
            pertinent_findings: { type: "string" }
          }
        }
      });

      toast.success("H&P Analysis Complete");
      
      // Update clinical impression with analysis
      const analysisText = `${result.summary}\n\nKey Patterns: ${result.key_patterns.join(", ")}\n\nPertinent Findings: ${result.pertinent_findings}`;
      onUpdate("clinical_impression", analysisText);
    } catch (error) {
      console.error("Failed to analyze H&P:", error);
      toast.error("Failed to analyze H&P");
    } finally {
      setAnalyzingHP(false);
    }
  };

  const handleGenerateAssessmentPlan = async () => {
    if (!note?.chief_complaint && !note?.history_of_present_illness) {
      toast.error("Please fill in at least Chief Complaint or History before generating Assessment & Plan");
      return;
    }

    setGeneratingAssessmentPlan(true);
    try {
      const { base44 } = await import("@/api/base44Client");
      
      // First, generate differential diagnoses with clinical reasoning
      const differentialResult = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a clinical reasoning expert. Analyze the following patient presentation and generate a comprehensive differential diagnosis with clinical reasoning:

Chief Complaint: ${note.chief_complaint || "Not documented"}
History of Present Illness: ${note.history_of_present_illness || "Not documented"}
Physical Exam: ${note.physical_exam || "Not documented"}
Medical History: ${note.medical_history || "Not documented"}
Review of Systems: ${note.review_of_systems || "Not documented"}
Vital Signs: Extract from physical exam if available

Using clinical reasoning, provide:
1. A ranked list of differential diagnoses (most likely to least likely)
2. For each diagnosis, explain the supporting and refuting evidence
3. Identify key features that distinguish between diagnoses
4. Suggest additional tests or findings needed to narrow the differential

Be thorough and evidence-based in your clinical reasoning.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            differentials: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  diagnosis: { type: "string" },
                  probability: { type: "string" },
                  supporting_evidence: { type: "array", items: { type: "string" } },
                  refuting_evidence: { type: "array", items: { type: "string" } },
                  distinguishing_features: { type: "string" },
                  recommended_workup: { type: "array", items: { type: "string" } }
                }
              }
            },
            clinical_reasoning_summary: { type: "string" }
          }
        }
      });

      setDifferentialDiagnoses(differentialResult.differentials || []);
      setShowDifferentials(true);

      // Now generate assessment and plan incorporating the differential
      const assessmentResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on the clinical information and differential diagnosis analysis, generate a comprehensive assessment and evidence-based treatment plan:

Chief Complaint: ${note.chief_complaint || "Not documented"}
History of Present Illness: ${note.history_of_present_illness || "Not documented"}
Physical Exam: ${note.physical_exam || "Not documented"}
Medical History: ${note.medical_history || "Not documented"}
Review of Systems: ${note.review_of_systems || "Not documented"}

Differential Diagnosis Analysis:
${differentialResult.clinical_reasoning_summary}

Top Differentials:
${differentialResult.differentials?.slice(0, 3).map((d, i) => 
  `${i + 1}. ${d.diagnosis} (${d.probability})
     Supporting: ${d.supporting_evidence.join(", ")}
     Refuting: ${d.refuting_evidence.join(", ")}`
).join("\n\n")}

Generate:
1. A detailed clinical assessment that:
   - Synthesizes all findings with clinical reasoning
   - Discusses the most likely diagnosis with supporting evidence
   - Addresses key differentials and why they are more or less likely
   - Identifies diagnostic uncertainty and next steps

2. A comprehensive evidence-based treatment plan that:
   - Addresses the most likely diagnosis
   - Includes diagnostic workup to confirm or rule out differentials
   - Provides specific interventions with rationale
   - Includes medications with dosing and clinical reasoning
   - Specifies follow-up timing and red flags
   - Incorporates patient education and safety netting

FORMATTING RULES (CRITICAL):
- NO bullet points, dashes, asterisks, arrows, or special symbols
- Write in flowing paragraphs with complete sentences
- Use periods and commas ONLY for punctuation
- Combine related information into coherent paragraphs
- Write in clear, professional medical language
- Separate major sections with a single line break`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            assessment: { type: "string" },
            plan: { type: "string" }
          }
        }
      });

      toast.success("Assessment & Plan Generated with Clinical Reasoning");
      onUpdate("assessment", assessmentResult.assessment);
      onUpdate("plan", assessmentResult.plan);
    } catch (error) {
      console.error("Failed to generate assessment/plan:", error);
      const errorMessage = error?.message || "Failed to generate assessment/plan";
      toast.error(errorMessage);
    } finally {
      setGeneratingAssessmentPlan(false);
    }
  };

  const handleFeedback = (suggestionId, feedbackType, comments = "") => {
    setAiSuggestionFeedback(prev => ({
      ...prev,
      [suggestionId]: { type: feedbackType, comments, timestamp: new Date().toISOString() }
    }));
    
    const feedbackMessage = feedbackType === "helpful" ? "Thank you for your feedback!" : 
                           feedbackType === "not_helpful" ? "Feedback noted. We'll improve." : 
                           "Feedback saved";
    toast.success(feedbackMessage);
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
    >
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">AI-Structured Note</h2>
            <p className="text-sm text-slate-500 mt-1">Review and finalize the structured note.</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => setKnowledgeSearchOpen(true)}
              className="rounded-xl gap-2 text-blue-600 border-blue-300 hover:bg-blue-50"
            >
              <Search className="w-4 h-4" /> Search Knowledge
            </Button>
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
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={handleAnalyzeHP}
            disabled={analyzingHP}
            className="rounded-xl gap-2 text-blue-600 border-blue-300 hover:bg-blue-50"
          >
            {analyzingHP ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Stethoscope className="w-4 h-4" />
            )}
            Analyze H&P
          </Button>
          <Button 
            variant="outline"
            onClick={handleGenerateAssessmentPlan}
            disabled={generatingAssessmentPlan}
            className="rounded-xl gap-2 text-purple-600 border-purple-300 hover:bg-purple-50"
          >
            {generatingAssessmentPlan ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Generate Assessment & Plan
          </Button>
          <Button 
            variant="outline"
            onClick={handleAddSection}
            className="rounded-xl gap-2 text-slate-600 border-slate-300 hover:bg-slate-50"
          >
            <ClipboardList className="w-4 h-4" /> Add Section
          </Button>
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
                                     <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">Key Recommendations</h4>
                                     <div className="space-y-2">
                                       {rec.key_points.map((point, i) => {
                                         const lineLabels = ['First line', 'Second line', 'Third line', 'Fourth line', 'Fifth line', 'Sixth line'];
                                         const colors = ['bg-blue-500', 'bg-purple-500', 'bg-indigo-500', 'bg-violet-500', 'bg-cyan-500', 'bg-emerald-500'];
                                         const bgColors = ['bg-blue-50', 'bg-purple-50', 'bg-indigo-50', 'bg-violet-50', 'bg-cyan-50', 'bg-emerald-50'];
                                         const borderColors = ['border-blue-200', 'border-purple-200', 'border-indigo-200', 'border-violet-200', 'border-cyan-200', 'border-emerald-200'];
                                         const textColors = ['text-blue-900', 'text-purple-900', 'text-indigo-900', 'text-violet-900', 'text-cyan-900', 'text-emerald-900'];

                                         const colorIndex = i % colors.length;
                                         const label = i < lineLabels.length ? lineLabels[i] : `Line ${i + 1}`;

                                         return (
                                           <div 
                                             key={i} 
                                             className={`flex items-start gap-3 p-3 rounded-lg border ${bgColors[colorIndex]} ${borderColors[colorIndex]}`}
                                           >
                                             <div className={`px-3 py-1 rounded-full ${colors[colorIndex]} flex items-center justify-center flex-shrink-0 text-white text-xs font-bold`}>
                                               {label}
                                             </div>
                                             <span className={`text-sm leading-relaxed ${textColors[colorIndex]} flex-1`}>
                                               • {point.replace(/[•\-\*→▸►]/g, '').trim()}
                                             </span>
                                           </div>
                                         );
                                       })}
                                     </div>
                                   </div>
                                 )}

                                 {rec.sources && rec.sources.length > 0 && (
                                   <div className="mt-4 pt-4 border-t border-slate-200">
                                     <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">References</h4>
                                     <div className="space-y-1">
                                       {rec.sources.map((source, i) => (
                                         <p key={i} className="text-xs text-slate-600 leading-relaxed">
                                           {i + 1}. {source}
                                         </p>
                                       ))}
                                     </div>
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

        {/* Differential Diagnosis Panel */}
        {showDifferentials && differentialDiagnoses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border-2 border-indigo-300 shadow-lg overflow-hidden"
          >
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-5 py-4 border-b border-indigo-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Differential Diagnosis</h3>
                  <p className="text-xs text-slate-500 mt-0.5">AI-powered clinical reasoning analysis</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDifferentials(false)}
                className="h-8 w-8 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4 text-slate-400" />
              </Button>
            </div>

            <div className="p-5 space-y-3">
              {differentialDiagnoses.map((diff, idx) => {
                const probabilityColors = {
                  "Very High": "bg-red-100 border-red-300 text-red-800",
                  "High": "bg-orange-100 border-orange-300 text-orange-800",
                  "Moderate": "bg-yellow-100 border-yellow-300 text-yellow-800",
                  "Low": "bg-blue-100 border-blue-300 text-blue-800"
                };
                const colorClass = probabilityColors[diff.probability] || "bg-slate-100 border-slate-300 text-slate-800";
                const feedbackId = `differential_${idx}`;
                const feedback = aiSuggestionFeedback[feedbackId];

                return (
                  <div key={idx} className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-base font-semibold text-slate-900">{diff.diagnosis}</h4>
                            <Badge className={`mt-2 ${colorClass} border`}>
                              Probability: {diff.probability}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 mt-4">
                        {diff.supporting_evidence && diff.supporting_evidence.length > 0 && (
                          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                            <h5 className="text-xs font-semibold text-green-900 mb-2">Supporting Evidence</h5>
                            <ul className="space-y-1">
                              {diff.supporting_evidence.map((evidence, i) => (
                                <li key={i} className="text-xs text-green-800 flex items-start gap-2">
                                  <span className="text-green-600 mt-0.5">+</span>
                                  <span>{evidence}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {diff.refuting_evidence && diff.refuting_evidence.length > 0 && (
                          <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                            <h5 className="text-xs font-semibold text-red-900 mb-2">Refuting Evidence</h5>
                            <ul className="space-y-1">
                              {diff.refuting_evidence.map((evidence, i) => (
                                <li key={i} className="text-xs text-red-800 flex items-start gap-2">
                                  <span className="text-red-600 mt-0.5">-</span>
                                  <span>{evidence}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {diff.distinguishing_features && (
                          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                            <h5 className="text-xs font-semibold text-blue-900 mb-1">Key Distinguishing Features</h5>
                            <p className="text-xs text-blue-800">{diff.distinguishing_features}</p>
                          </div>
                        )}

                        {Array.isArray(diff.recommended_workup) && diff.recommended_workup.length > 0 && (
                          <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                            <h5 className="text-xs font-semibold text-purple-900 mb-2">Recommended Workup</h5>
                            <ul className="space-y-1">
                              {diff.recommended_workup.map((test, i) => (
                                <li key={i} className="text-xs text-purple-800 flex items-start gap-2">
                                  <span className="text-purple-600 mt-0.5">•</span>
                                  <span>{test}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                        <span className="text-xs text-slate-500">Was this suggestion helpful?</span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={feedback?.type === "helpful" ? "default" : "outline"}
                            onClick={() => handleFeedback(feedbackId, "helpful")}
                            className="h-7 text-xs gap-1"
                          >
                            <Check className="w-3 h-3" /> Helpful
                          </Button>
                          <Button
                            size="sm"
                            variant={feedback?.type === "not_helpful" ? "default" : "outline"}
                            onClick={() => handleFeedback(feedbackId, "not_helpful")}
                            className="h-7 text-xs gap-1"
                          >
                            <X className="w-3 h-3" /> Not Helpful
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Clinical Impression Box */}
        <div className="bg-white rounded-xl border-2 border-purple-300 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-4 py-3 border-b border-purple-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-slate-900">Clinical Impression</h3>
            </div>
          </div>
          <div className="p-4">
            <EditableSection
              icon={Sparkles}
              title=""
              color="purple"
              value={note.clinical_impression || "Not extracted"}
              field="clinical_impression"
              type="textarea"
              onUpdate={onUpdate}
              onReanalyze={onReanalyze}
              hideBorder={true}
            />
          </div>
        </div>

        {/* Chief Complaint Box */}
        <div className="bg-white rounded-xl border-2 border-blue-300 shadow-sm overflow-hidden">
          <div className="bg-blue-50 px-4 py-3 border-b border-blue-200 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-slate-900">Chief Complaint</h3>
          </div>
          <div className="p-4">
            <EditableSection
              icon={Target}
              title=""
              color="blue"
              value={note.chief_complaint || "Not extracted"}
              field="chief_complaint"
              type="text"
              onUpdate={onUpdate}
              onReanalyze={onReanalyze}
              hideBorder={true}
            />
          </div>
        </div>

        {/* History of Present Illness Box */}
        <div className="bg-white rounded-xl border-2 border-indigo-300 shadow-sm overflow-hidden">
          <div className="bg-indigo-50 px-4 py-3 border-b border-indigo-200 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-slate-900">History of Present Illness</h3>
          </div>
          <div className="p-4">
            <EditableSection
              icon={FileText}
              title=""
              color="indigo"
              value={note.history_of_present_illness || "Not extracted"}
              field="history_of_present_illness"
              type="textarea"
              onUpdate={onUpdate}
              onReanalyze={onReanalyze}
              hideBorder={true}
            />
          </div>
        </div>

        {/* Medical History Box */}
        <div className="bg-white rounded-xl border-2 border-slate-300 shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-600" />
            <h3 className="font-semibold text-slate-900">Medical History</h3>
          </div>
          <div className="p-4">
            <EditableSection
              icon={FileText}
              title=""
              color="slate"
              value={note.medical_history || "Not extracted"}
              field="medical_history"
              type="textarea"
              onUpdate={onUpdate}
              onReanalyze={onReanalyze}
              hideBorder={true}
            />
          </div>
        </div>

        {/* Review of Systems Box */}
        <div className="bg-white rounded-xl border-2 border-indigo-300 shadow-sm overflow-hidden">
          <div className="bg-indigo-50 px-4 py-3 border-b border-indigo-200 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-slate-900">Review of Systems</h3>
          </div>
          <div className="p-4">
            <EditableSection
              icon={ClipboardList}
              title=""
              color="indigo"
              value={note.review_of_systems || "Not extracted"}
              field="review_of_systems"
              type="textarea"
              onUpdate={onUpdate}
              onReanalyze={onReanalyze}
              hideBorder={true}
            />
          </div>
        </div>

        {/* Physical Exam Box */}
        <div className="bg-white rounded-xl border-2 border-teal-300 shadow-sm overflow-hidden">
          <div className="bg-teal-50 px-4 py-3 border-b border-teal-200 flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-600" />
            <h3 className="font-semibold text-slate-900">Physical Exam</h3>
          </div>
          <div className="p-4">
            <EditableSection
              icon={Activity}
              title=""
              color="teal"
              value={note.physical_exam || "Not extracted"}
              field="physical_exam"
              type="textarea"
              onUpdate={onUpdate}
              onReanalyze={onReanalyze}
              hideBorder={true}
            />
          </div>
        </div>

        {/* Assessment Box */}
        <div className="bg-white rounded-xl border-2 border-purple-300 shadow-sm overflow-hidden">
          <div className="bg-purple-50 px-4 py-3 border-b border-purple-200 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-slate-900">Assessment</h3>
          </div>
          <div className="p-4">
            <EditableSection
              icon={Stethoscope}
              title=""
              color="purple"
              value={note.assessment || "Not extracted"}
              field="assessment"
              type="textarea"
              onUpdate={onUpdate}
              onReanalyze={onReanalyze}
              hideBorder={true}
            />
          </div>
        </div>

        {/* Plan Box */}
        <div className="bg-white rounded-xl border-2 border-green-300 shadow-sm overflow-hidden">
          <div className="bg-green-50 px-4 py-3 border-b border-green-200 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-slate-900">Plan</h3>
          </div>
          <div className="p-4">
            <InteractivePlanSection
              value={note.plan || "Not extracted"}
              onUpdate={onUpdate}
              onReanalyze={onReanalyze}
            />
          </div>
        </div>

        {/* Diagnoses Box */}
        <div className="bg-white rounded-xl border-2 border-amber-300 shadow-sm overflow-hidden">
          <div className="bg-amber-50 px-4 py-3 border-b border-amber-200 flex items-center gap-2">
            <Target className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-slate-900">Diagnoses</h3>
          </div>
          <div className="p-4">
            <EditableSection
              icon={Target}
              title=""
              color="amber"
              value={note.diagnoses && note.diagnoses.length > 0 ? note.diagnoses : ["Not extracted"]}
              field="diagnoses"
              type="array"
              onUpdate={onUpdate}
              onReanalyze={onReanalyze}
              hideBorder={true}
            />
          </div>
        </div>

        {/* Custom Sections */}
        {customSections.map((section) => (
          <div key={section.id} className="bg-white rounded-xl border-2 border-cyan-300 shadow-sm overflow-hidden">
            <div className="bg-cyan-50 px-4 py-3 border-b border-cyan-200 flex items-center justify-between">
              <input
                type="text"
                value={section.title}
                onChange={(e) => handleUpdateCustomSection(section.id, 'title', e.target.value)}
                className="font-semibold text-slate-900 bg-transparent border-none outline-none focus:ring-0"
                placeholder="Section Title"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteSection(section.id)}
                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-4">
              <textarea
                value={section.content}
                onChange={(e) => handleUpdateCustomSection(section.id, 'content', e.target.value)}
                className="w-full min-h-[120px] p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                placeholder="Enter section content..."
              />
            </div>
          </div>
        ))}

        {/* Medications Box */}
        <div className="bg-white rounded-xl border-2 border-rose-300 shadow-sm overflow-hidden">
          <div className="bg-rose-50 px-4 py-3 border-b border-rose-200 flex items-center gap-2">
            <Pill className="w-5 h-5 text-rose-600" />
            <h3 className="font-semibold text-slate-900">Medications</h3>
          </div>
          <div className="p-4 space-y-4">
          {/* Medication Recommendations */}
          {(loadingMedications || (medicationRecommendations.length > 0 && showMedications)) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white rounded-xl border border-rose-200 shadow-sm overflow-hidden"
            >
              <div className="p-5 flex items-start justify-between border-b border-slate-100 bg-gradient-to-r from-rose-50/50 to-pink-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                    <Pill className="w-5 h-5 text-rose-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Medication Recommendations</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Evidence-based prescribing guidance</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowMedications(false)}
                  className="h-8 w-8 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </Button>
              </div>

              <div className="p-5">
                {loadingMedications ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-rose-600 mb-3" />
                    <p className="text-sm font-medium text-slate-900">Analyzing medication guidelines</p>
                    <p className="text-xs text-slate-500 mt-1">Fetching evidence-based prescribing recommendations...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {medicationRecommendations.map((rec, idx) => {
                      const isExpanded = expandedMedication === idx;

                      return (
                        <div key={idx} className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden hover:border-rose-300 transition-colors">
                          <button
                            onClick={() => setExpandedMedication(isExpanded ? null : idx)}
                            className="w-full flex items-center justify-between p-4 hover:bg-slate-100/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-rose-100">
                                <Pill className="w-4 h-4 text-rose-600" />
                              </div>
                              <div className="text-left">
                                <p className="text-sm font-semibold text-slate-900">{rec.condition}</p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {rec.first_line?.length || 0} first-line options
                                </p>
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
                                  {rec.first_line && rec.first_line.length > 0 && (
                                    <div>
                                      <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">First-Line Medications</h4>
                                      <div className="space-y-3">
                                        {rec.first_line.map((med, i) => (
                                          <div key={i} className="bg-green-50 rounded-lg p-3 border border-green-200">
                                            <div className="flex items-start justify-between mb-2">
                                              <p className="text-sm font-semibold text-slate-900">{med.medication}</p>
                                              <Button
                                                size="sm"
                                                onClick={() => {
                                                  const medicationText = `${med.medication} - ${med.dosing}`;
                                                  onUpdate("medications", [...(note.medications || []), medicationText]);
                                                  toast.success("Medication added");
                                                }}
                                                className="h-7 text-xs gap-1 bg-rose-600 hover:bg-rose-700"
                                              >
                                                <CheckCircle2 className="w-3 h-3" /> Add
                                              </Button>
                                            </div>
                                            <p className="text-xs text-slate-600 mb-1"><strong>Dosing:</strong> {med.dosing}</p>
                                            <p className="text-xs text-slate-600"><strong>Rationale:</strong> {med.rationale}</p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {rec.alternatives && rec.alternatives.length > 0 && (
                                    <div>
                                      <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">Alternative Options</h4>
                                      <div className="space-y-2">
                                        {rec.alternatives.map((alt, i) => (
                                          <div key={i} className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                            <div className="flex items-start justify-between mb-2">
                                              <p className="text-sm font-medium text-slate-900">{alt.medication}</p>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                  const medicationText = `${alt.medication} - ${alt.dosing}`;
                                                  onUpdate("medications", [...(note.medications || []), medicationText]);
                                                  toast.success("Medication added");
                                                }}
                                                className="h-7 text-xs gap-1"
                                              >
                                                <CheckCircle2 className="w-3 h-3" /> Add
                                              </Button>
                                            </div>
                                            <p className="text-xs text-slate-600 mb-1"><strong>Dosing:</strong> {alt.dosing}</p>
                                            <p className="text-xs text-slate-600"><strong>When to use:</strong> {alt.when_to_use}</p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {rec.monitoring && (
                                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                                      <h4 className="text-xs font-semibold text-amber-900 mb-1">Monitoring Requirements</h4>
                                      <p className="text-xs text-slate-700">{rec.monitoring}</p>
                                    </div>
                                  )}

                                  {rec.contraindications && (
                                    <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                                      <h4 className="text-xs font-semibold text-red-900 mb-1">Contraindications</h4>
                                      <p className="text-xs text-slate-700">{rec.contraindications}</p>
                                    </div>
                                  )}
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

            <EditableSection
              icon={Pill}
              title=""
              color="rose"
              value={note.medications && note.medications.length > 0 ? note.medications : ["Not extracted"]}
              field="medications"
              type="array"
              onUpdate={onUpdate}
              onReanalyze={onReanalyze}
              hideBorder={true}
            />
          </div>
        </div>
      </div>

      {/* Preview & Copy Dialog */}
      <MedicalKnowledgeSearch
        open={knowledgeSearchOpen}
        onClose={() => setKnowledgeSearchOpen(false)}
        noteContext={{
          chief_complaint: note.chief_complaint,
          diagnoses: note.diagnoses,
          medications: note.medications,
          assessment: note.assessment,
          plan: note.plan
        }}
      />

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