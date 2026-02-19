import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Clock,
  Plus,
  Loader2,
  X,
  ChevronDown,
  ChevronUp,
  Brain,
  Beaker,
  ImageIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import { Check } from "lucide-react";

export default function MedicalDecisionMakingTab({ note, onUpdateNote, noteId }) {
  const [mdmSections, setMdmSections] = useState(() => {
    if (!note.mdm) return [];
    try {
      const parsed = typeof note.mdm === "string" ? JSON.parse(note.mdm) : note.mdm;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiRanking, setAiRanking] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [loadingRank, setLoadingRank] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newSectionContent, setNewSectionContent] = useState("");
  const [showAddSection, setShowAddSection] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [editedContent, setEditedContent] = useState({});

  // Generate AI MDM Analysis
  const generateAIMDMAnalysis = async () => {
    if (!note.assessment && !note.diagnoses?.length) {
      toast.error("Add assessment or diagnoses first");
      return;
    }

    setLoadingAI(true);
    try {
      // Safely extract vital signs info
      let vitalSummary = "";
      if (note.vital_signs && typeof note.vital_signs === "object") {
        const vs = note.vital_signs;
        const parts = [];
        if (vs.temperature?.value) parts.push(`Temp: ${vs.temperature.value}°${vs.temperature.unit || "F"}`);
        if (vs.heart_rate?.value) parts.push(`HR: ${vs.heart_rate.value} bpm`);
        if (vs.blood_pressure?.systolic) parts.push(`BP: ${vs.blood_pressure.systolic}/${vs.blood_pressure.diastolic}`);
        if (vs.respiratory_rate?.value) parts.push(`RR: ${vs.respiratory_rate.value}`);
        if (vs.oxygen_saturation?.value) parts.push(`O2: ${vs.oxygen_saturation.value}%`);
        vitalSummary = parts.join(", ");
      }

      const context = [
        note.chief_complaint && `Chief Complaint: ${note.chief_complaint}`,
        note.history_of_present_illness && `HPI: ${note.history_of_present_illness}`,
        note.assessment && `Assessment: ${note.assessment}`,
        note.diagnoses?.length && `Diagnoses: ${note.diagnoses.join(", ")}`,
        vitalSummary && `Vital Signs: ${vitalSummary}`,
        note.review_of_systems && `ROS: ${typeof note.review_of_systems === "string" ? note.review_of_systems : JSON.stringify(note.review_of_systems)}`,
        note.physical_exam && `Physical Exam: ${note.physical_exam}`,
      ].filter(Boolean).join("\n\n");

      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert clinician. Provide a comprehensive Medical Decision Making (MDM) analysis with detailed clinical reasoning.

${context}

Provide:
1. Problem Summary - Concise synthesis of key clinical issues
2. Differential Diagnosis Reasoning - Clinical reasoning for ranked differentials
3. Imaging/Labs Rationale - Evidence-based justification for recommended tests
4. Treatment Reasoning - Clinical rationale for proposed treatment plan
5. Risk Assessment - Key risks and safety considerations
6. Follow-up Strategy - Specific follow-up plan with timing and monitoring`,
        response_json_schema: {
          type: "object",
          properties: {
            problem_summary: { type: "string" },
            differential_reasoning: { type: "string" },
            imaging_labs_rationale: { type: "string" },
            treatment_reasoning: { type: "string" },
            risk_assessment: { type: "string" },
            follow_up_strategy: { type: "string" },
          },
        },
      });

      setAiAnalysis(res);
      toast.success("MDM analysis generated");
      
      // Auto-rank by acuity
      rankByAcuity(res);
    } catch (error) {
      console.error("Failed to generate MDM analysis:", error);
      toast.error("Failed to generate MDM analysis");
    } finally {
      setLoadingAI(false);
    }
  };

  // Rank reasoning by acuity
  const rankByAcuity = async (analysis) => {
    setLoadingRank(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze the following clinical reasoning sections and rank them by acuity level (HIGH, MEDIUM, LOW).
        
Problem Summary: ${analysis.problem_summary}
Differential Diagnosis Reasoning: ${analysis.differential_reasoning}
Imaging/Labs Rationale: ${analysis.imaging_labs_rationale}
Treatment Reasoning: ${analysis.treatment_reasoning}
Risk Assessment: ${analysis.risk_assessment}
Follow-up Strategy: ${analysis.follow_up_strategy}

Return a JSON with each section and its acuity ranking.`,
        response_json_schema: {
          type: "object",
          properties: {
            problem_summary: { type: "string", enum: ["HIGH", "MEDIUM", "LOW"] },
            differential_reasoning: { type: "string", enum: ["HIGH", "MEDIUM", "LOW"] },
            imaging_labs_rationale: { type: "string", enum: ["HIGH", "MEDIUM", "LOW"] },
            treatment_reasoning: { type: "string", enum: ["HIGH", "MEDIUM", "LOW"] },
            risk_assessment: { type: "string", enum: ["HIGH", "MEDIUM", "LOW"] },
            follow_up_strategy: { type: "string", enum: ["HIGH", "MEDIUM", "LOW"] },
          },
        },
      });
      setAiRanking(res);
    } catch (error) {
      console.error("Failed to rank by acuity:", error);
    } finally {
      setLoadingRank(false);
    }
  };

  // Add AI Analysis as MDM Section
  const addAIAnalysisSection = async () => {
    if (!aiAnalysis) return;

    const newSection = {
      id: `mdm_${Date.now()}`,
      title: "AI Clinical Reasoning",
      timestamp: new Date().toISOString(),
      content: [
        `Problem Summary:\n${aiAnalysis.problem_summary}`,
        `Differential Diagnosis Reasoning:\n${aiAnalysis.differential_reasoning}`,
        `Imaging/Labs Rationale:\n${aiAnalysis.imaging_labs_rationale}`,
        `Treatment Reasoning:\n${aiAnalysis.treatment_reasoning}`,
        `Risk Assessment:\n${aiAnalysis.risk_assessment}`,
        `Follow-up Strategy:\n${aiAnalysis.follow_up_strategy}`,
      ].join("\n\n"),
    };

    const updatedSections = [...mdmSections, newSection];
    setMdmSections(updatedSections);
    await onUpdateNote({ mdm: JSON.stringify(updatedSections) });
    toast.success("AI analysis added to MDM");
  };

  // Add Custom MDM Section
  const addCustomSection = async () => {
    if (!newSectionTitle.trim() || !newSectionContent.trim()) {
      toast.error("Title and content are required");
      return;
    }

    const newSection = {
      id: `mdm_${Date.now()}`,
      title: newSectionTitle,
      timestamp: new Date().toISOString(),
      content: newSectionContent,
    };

    const updatedSections = [...mdmSections, newSection];
    setMdmSections(updatedSections);
    await onUpdateNote({ mdm: JSON.stringify(updatedSections) });
    
    setNewSectionTitle("");
    setNewSectionContent("");
    setShowAddSection(false);
    toast.success("Section added to MDM");
  };

  // Delete MDM Section
  const deleteSection = async (sectionId) => {
    const updatedSections = mdmSections.filter((s) => s.id !== sectionId);
    setMdmSections(updatedSections);
    await onUpdateNote({ mdm: JSON.stringify(updatedSections) });
    toast.success("Section removed");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-200 p-5">
        <div className="flex items-center gap-3 mb-2">
          <Brain className="w-6 h-6 text-purple-600" />
          <h3 className="text-xl font-bold text-slate-900">Medical Decision Making</h3>
        </div>
        <p className="text-sm text-slate-600">
          Document your clinical reasoning, diagnostic rationale, and treatment justification with time-stamped entries.
        </p>
      </div>

      {/* AI Analysis Generator */}
      <div className="bg-white rounded-xl border-2 border-indigo-300 shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                AI Clinical Reasoning
              </h4>
              <p className="text-indigo-100 text-sm mt-1">Generate comprehensive MDM analysis from your note</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {!aiAnalysis ? (
            <Button
              onClick={generateAIMDMAnalysis}
              disabled={loadingAI}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
            >
              {loadingAI ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generating Analysis...</>
              ) : (
                <><Brain className="w-4 h-4" /> Generate AI MDM Analysis</>
              )}
            </Button>
          ) : (
            <div className="space-y-3">
              {loadingRank && (
                <div className="text-center py-2">
                  <p className="text-xs text-indigo-600 flex items-center justify-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" /> Ranking by acuity...
                  </p>
                </div>
              )}

              {/* Problem Summary */}
              <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-xs font-bold text-indigo-900">Problem Summary</p>
                  {aiRanking?.problem_summary && (
                    <Badge variant="secondary" className={`text-xs ${
                      aiRanking.problem_summary === "HIGH" ? "bg-red-100 text-red-700" :
                      aiRanking.problem_summary === "MEDIUM" ? "bg-yellow-100 text-yellow-700" :
                      "bg-green-100 text-green-700"
                    }`}>
                      {aiRanking.problem_summary}
                    </Badge>
                  )}
                </div>
                {editingSection === "problem_summary" ? (
                  <Textarea
                    value={editedContent.problem_summary || aiAnalysis.problem_summary}
                    onChange={(e) => setEditedContent({...editedContent, problem_summary: e.target.value})}
                    className="mb-2 text-xs"
                  />
                ) : (
                  <p className="text-sm text-slate-700 leading-relaxed mb-3">{editedContent.problem_summary || aiAnalysis.problem_summary}</p>
                )}
                <div className="flex gap-2">
                  {editingSection === "problem_summary" ? (
                    <>
                      <Button
                        onClick={() => setEditingSection(null)}
                        size="sm"
                        variant="outline"
                        className="flex-1"
                      >
                        Done Editing
                      </Button>
                      <Button
                        onClick={async () => {
                          await onUpdateNote({ mdm: `## Problem Summary\n${editedContent.problem_summary || aiAnalysis.problem_summary}` });
                          toast.success("Added to clinical note");
                          setEditingSection(null);
                        }}
                        size="sm"
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        <Plus className="w-3 h-3" /> Add to Note
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() => {
                          setEditingSection("problem_summary");
                          setEditedContent({...editedContent, problem_summary: aiAnalysis.problem_summary});
                        }}
                        size="sm"
                        variant="outline"
                        className="flex-1"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={async () => {
                          await onUpdateNote({ mdm: `## Problem Summary\n${editedContent.problem_summary || aiAnalysis.problem_summary}` });
                          toast.success("Added to clinical note");
                        }}
                        size="sm"
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        <Plus className="w-3 h-3" /> Add
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                {/* Differential Reasoning */}
                <div className="bg-cyan-50 rounded-lg p-4 border border-cyan-200">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-xs font-bold text-cyan-900">Differential Diagnosis</p>
                    {aiRanking?.differential_reasoning && (
                      <Badge variant="secondary" className={`text-xs ${
                        aiRanking.differential_reasoning === "HIGH" ? "bg-red-100 text-red-700" :
                        aiRanking.differential_reasoning === "MEDIUM" ? "bg-yellow-100 text-yellow-700" :
                        "bg-green-100 text-green-700"
                      }`}>
                        {aiRanking.differential_reasoning}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 line-clamp-3 mb-2">{aiAnalysis.differential_reasoning}</p>
                  <Button
                    onClick={async () => {
                      await onUpdateNote({ mdm: `## Differential Diagnosis Reasoning\n${aiAnalysis.differential_reasoning}` });
                      toast.success("Added to clinical note");
                    }}
                    size="sm"
                    variant="outline"
                    className="w-full gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add to Note
                  </Button>
                </div>

                {/* Labs/Imaging */}
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-xs font-bold text-purple-900 flex items-center gap-1">
                      <Beaker className="w-3 h-3" /> Labs/Imaging
                    </p>
                    {aiRanking?.imaging_labs_rationale && (
                      <Badge variant="secondary" className={`text-xs ${
                        aiRanking.imaging_labs_rationale === "HIGH" ? "bg-red-100 text-red-700" :
                        aiRanking.imaging_labs_rationale === "MEDIUM" ? "bg-yellow-100 text-yellow-700" :
                        "bg-green-100 text-green-700"
                      }`}>
                        {aiRanking.imaging_labs_rationale}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 line-clamp-3 mb-2">{aiAnalysis.imaging_labs_rationale}</p>
                  <Button
                    onClick={async () => {
                      await onUpdateNote({ mdm: `## Imaging/Labs Rationale\n${aiAnalysis.imaging_labs_rationale}` });
                      toast.success("Added to clinical note");
                    }}
                    size="sm"
                    variant="outline"
                    className="w-full gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add to Note
                  </Button>
                </div>

                {/* Treatment Reasoning */}
                <div className="bg-pink-50 rounded-lg p-4 border border-pink-200">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-xs font-bold text-pink-900">Treatment Reasoning</p>
                    {aiRanking?.treatment_reasoning && (
                      <Badge variant="secondary" className={`text-xs ${
                        aiRanking.treatment_reasoning === "HIGH" ? "bg-red-100 text-red-700" :
                        aiRanking.treatment_reasoning === "MEDIUM" ? "bg-yellow-100 text-yellow-700" :
                        "bg-green-100 text-green-700"
                      }`}>
                        {aiRanking.treatment_reasoning}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 line-clamp-3 mb-2">{aiAnalysis.treatment_reasoning}</p>
                  <Button
                    onClick={async () => {
                      await onUpdateNote({ mdm: `## Treatment Reasoning\n${aiAnalysis.treatment_reasoning}` });
                      toast.success("Added to clinical note");
                    }}
                    size="sm"
                    variant="outline"
                    className="w-full gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add to Note
                  </Button>
                </div>

                {/* Risk Assessment */}
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-xs font-bold text-orange-900">Risk Assessment</p>
                    {aiRanking?.risk_assessment && (
                      <Badge variant="secondary" className={`text-xs ${
                        aiRanking.risk_assessment === "HIGH" ? "bg-red-100 text-red-700" :
                        aiRanking.risk_assessment === "MEDIUM" ? "bg-yellow-100 text-yellow-700" :
                        "bg-green-100 text-green-700"
                      }`}>
                        {aiRanking.risk_assessment}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 line-clamp-3 mb-2">{aiAnalysis.risk_assessment}</p>
                  <Button
                    onClick={async () => {
                      await onUpdateNote({ mdm: `## Risk Assessment\n${aiAnalysis.risk_assessment}` });
                      toast.success("Added to clinical note");
                    }}
                    size="sm"
                    variant="outline"
                    className="w-full gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add to Note
                  </Button>
                </div>

                {/* Follow-up Strategy */}
                <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-xs font-bold text-emerald-900">Follow-up Strategy</p>
                    {aiRanking?.follow_up_strategy && (
                      <Badge variant="secondary" className={`text-xs ${
                        aiRanking.follow_up_strategy === "HIGH" ? "bg-red-100 text-red-700" :
                        aiRanking.follow_up_strategy === "MEDIUM" ? "bg-yellow-100 text-yellow-700" :
                        "bg-green-100 text-green-700"
                      }`}>
                        {aiRanking.follow_up_strategy}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 line-clamp-3 mb-2">{aiAnalysis.follow_up_strategy}</p>
                  <Button
                    onClick={async () => {
                      await onUpdateNote({ mdm: `## Follow-up Strategy\n${aiAnalysis.follow_up_strategy}` });
                      toast.success("Added to clinical note");
                    }}
                    size="sm"
                    variant="outline"
                    className="w-full gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add to Note
                  </Button>
                </div>
              </div>

              <Button
                onClick={addAIAnalysisSection}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
              >
                <Plus className="w-4 h-4" /> Add All Sections to MDM
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* MDM Sections */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-600" />
            MDM Timeline ({mdmSections.length})
          </h4>
          <Button
            onClick={() => setShowAddSection(!showAddSection)}
            size="sm"
            variant="outline"
            className="gap-2"
          >
            <Plus className="w-3.5 h-3.5" /> Add Section
          </Button>
        </div>

        {/* Add Section Form */}
        <AnimatePresence>
          {showAddSection && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white rounded-xl border-2 border-slate-200 shadow-lg p-6 space-y-4"
            >
              <input
                type="text"
                placeholder="Section title (e.g., Clinical Reasoning, Risk Assessment)"
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-100 text-sm"
              />
              <Textarea
                placeholder="Document your clinical reasoning, decision factors, and justification..."
                value={newSectionContent}
                onChange={(e) => setNewSectionContent(e.target.value)}
                className="min-h-[200px]"
              />
              <div className="flex gap-3 justify-end">
                <Button
                  onClick={() => setShowAddSection(false)}
                  variant="outline"
                  className="gap-2"
                >
                  <X className="w-3.5 h-3.5" /> Cancel
                </Button>
                <Button
                  onClick={addCustomSection}
                  className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Section
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Preview Section */}
        {mdmSections.length > 0 && (
          <div className="bg-slate-50 rounded-xl border-2 border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-slate-700">Preview</h4>
              <Button
                onClick={() => setShowPreview(!showPreview)}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                {showPreview ? "Hide" : "Show"} Preview
              </Button>
            </div>
            {showPreview && (
              <div className="prose prose-sm prose-slate max-w-none text-slate-700 bg-white rounded-lg p-4 border border-slate-200">
                {mdmSections.map((section) => (
                  <div key={section.id} className="mb-6">
                    <h3 className="text-base font-bold mt-0 mb-2">{section.title}</h3>
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
                        h1: ({ children }) => <h1 className="text-lg font-bold mt-3 mb-2">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-base font-bold mt-2 mb-1">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-sm font-bold mt-2 mb-1">{children}</h3>,
                        ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                        li: ({ children }) => <li className="block">{children}</li>,
                        strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                      }}
                    >
                      {section.content}
                    </ReactMarkdown>
                  </div>
                ))}
              </div>
            )}
            <Button
              onClick={async () => {
                const fullMDM = mdmSections.map(s => `## ${s.title}\n${s.content}`).join("\n\n");
                try {
                  await base44.entities.ClinicalNote.update(noteId, { mdm: fullMDM });
                  toast.success("MDM sections added to clinical note");
                } catch (error) {
                  toast.error("Failed to add MDM to note");
                }
              }}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white gap-2 mt-4"
            >
              <Check className="w-4 h-4" /> Add to Clinical Note
            </Button>
          </div>
        )}

        {/* Sections List */}
        <div className="space-y-2">
          {mdmSections.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
              <Brain className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">No MDM sections yet</p>
              <p className="text-sm text-slate-500 mt-1">Generate AI analysis or add custom sections</p>
            </div>
          ) : (
            mdmSections.map((section, idx) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border-2 border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <button
                  onClick={() =>
                    setExpandedSection(expandedSection === section.id ? null : section.id)
                  }
                  className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white hover:from-slate-100 hover:to-slate-50 transition-colors"
                >
                  <div className="flex items-start gap-4 flex-1 text-left">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-xs font-bold flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-semibold text-slate-900">{section.title}</h5>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(section.timestamp), "MMM d, yyyy h:mm a")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {expandedSection === section.id ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Content */}
                <AnimatePresence>
                  {expandedSection === section.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-slate-200"
                    >
                      <div className="px-6 py-4 bg-gradient-to-br from-slate-50 to-white">
                        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                          {section.content}
                        </p>
                        <div className="mt-4 pt-4 border-t border-slate-200 flex justify-end">
                          <Button
                            onClick={() => deleteSection(section.id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700 gap-2"
                          >
                            <X className="w-3.5 h-3.5" /> Delete
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}