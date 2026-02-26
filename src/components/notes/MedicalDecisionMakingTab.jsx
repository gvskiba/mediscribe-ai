import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Plus,
  XCircle,
  ChevronDown,
  ChevronUp,
  Brain,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import { Check } from "lucide-react";
import QuickAIAnalysisTools from "./QuickAIAnalysisTools";
import AIAnalysisGenerator from "./AIAnalysisGenerator";

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
  const [userSettings, setUserSettings] = useState(null);

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await base44.auth.me();
      if (settings) setUserSettings(settings);
    };
    loadSettings();
  }, []);





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
    try {
      await base44.entities.ClinicalNote.update(noteId, { mdm: JSON.stringify(updatedSections) });
      setNewSectionTitle("");
      setNewSectionContent("");
      setShowAddSection(false);
      toast.success("Section added to MDM");
    } catch (error) {
      console.error("Failed to save MDM section:", error);
      toast.error("Failed to save MDM section");
    }
  };

  // Delete MDM Section
  const deleteSection = async (sectionId) => {
    const updatedSections = mdmSections.filter((s) => s.id !== sectionId);
    setMdmSections(updatedSections);
    try {
      await base44.entities.ClinicalNote.update(noteId, { mdm: JSON.stringify(updatedSections) });
      toast.success("Section removed");
    } catch (error) {
      console.error("Failed to delete MDM section:", error);
      toast.error("Failed to delete MDM section");
    }
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

      {/* Quick AI Analysis Tools */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Key Findings Summary */}
        <div className="bg-white rounded-lg border-2 border-blue-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-5 h-5 text-blue-600" />
            <h4 className="font-bold text-sm text-slate-900">Key Findings</h4>
          </div>
          <Button
            onClick={summarizeKeyFindings}
            disabled={loadingFindings}
            size="sm"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2 text-xs"
          >
            {loadingFindings ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            Summarize
          </Button>
          {keyFindings && (
            <div className="mt-3 text-xs space-y-2">
              {keyFindings.red_flags?.length > 0 && (
                <div className="p-2 bg-red-50 rounded border border-red-200">
                  <p className="font-semibold text-red-700 mb-1">🚩 Red Flags:</p>
                  <ul className="text-red-600 space-y-1">
                    {keyFindings.red_flags.map((flag, i) => <li key={i}>• {flag}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Drug Interactions */}
        <div className="bg-white rounded-lg border-2 border-orange-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Beaker className="w-5 h-5 text-orange-600" />
            <h4 className="font-bold text-sm text-slate-900">Interactions</h4>
          </div>
          <Button
            onClick={checkDrugInteractions}
            disabled={loadingInteractions}
            size="sm"
            className="w-full bg-orange-600 hover:bg-orange-700 text-white gap-2 text-xs"
          >
            {loadingInteractions ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            Check
          </Button>
          {drugInteractions && (
            <div className="mt-3 text-xs space-y-2">
              {drugInteractions.interactions_found?.length > 0 ? (
                <div className="p-2 bg-orange-50 rounded border border-orange-200">
                  <p className="font-semibold text-orange-700 mb-1">⚠️ Found:</p>
                  <ul className="text-orange-600 space-y-1">
                    {drugInteractions.interactions_found.slice(0, 3).map((int, i) => <li key={i}>• {int}</li>)}
                  </ul>
                </div>
              ) : (
                <p className="text-green-600 p-2 bg-green-50 rounded">✓ No major interactions</p>
              )}
            </div>
          )}
        </div>

        {/* Critical Flags */}
        <div className="bg-white rounded-lg border-2 border-red-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h4 className="font-bold text-sm text-slate-900">Critical Values</h4>
          </div>
          <Button
            onClick={flagCriticalValues}
            disabled={loadingFlags}
            size="sm"
            className="w-full bg-red-600 hover:bg-red-700 text-white gap-2 text-xs"
          >
            {loadingFlags ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            Flag
          </Button>
          {criticalFlags && (
            <div className="mt-3 text-xs space-y-2">
              {criticalFlags.critical_values?.length > 0 && (
                <div className="p-2 bg-red-50 rounded border border-red-200">
                  <p className="font-semibold text-red-700 mb-1">🚨 Critical:</p>
                  <ul className="text-red-600 space-y-1">
                    {criticalFlags.critical_values.slice(0, 2).map((val, i) => <li key={i}>• {val}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
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
            <>
              {!note.chief_complaint && !note.history_of_present_illness && !note.assessment && !note.diagnoses?.length && (
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-center">
                  Add a chief complaint, HPI, assessment, or diagnoses to generate MDM analysis
                </p>
              )}
              <Button
                onClick={generateAIMDMAnalysis}
                disabled={loadingAI || (!note.chief_complaint && !note.history_of_present_illness && !note.assessment && !note.diagnoses?.length)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-2 disabled:opacity-50"
              >
                {loadingAI ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Generating Analysis...</>
                ) : (
                  <><Brain className="w-4 h-4" /> Generate AI MDM Analysis</>
                )}
              </Button>
            </>
          ) : (
            <div className="space-y-3">
              {loadingRank && (
                    <div className="text-center py-2">
                      <p className="text-xs text-indigo-600 flex items-center justify-center gap-2">
                        <Loader2 className="w-3 h-3 animate-spin" /> Ranking by likelihood...
                      </p>
                    </div>
                  )}

              {/* Problem Summary */}
              <MDMSectionRenderer
                sectionKey="problem_summary"
                title="Problem Summary"
                content={editedContent.problem_summary || aiAnalysis.problem_summary}
                likelihood={aiRanking?.problem_summary}
                color="indigo"
                isEditing={editingSection === "problem_summary"}
                editValue={editedContent.problem_summary}
                onEditChange={(updated) => setEditedContent({...editedContent, problem_summary: updated})}
                onAdd={async (content) => {
                  const text = Array.isArray(content) ? content.join("\n• ") : content;
                  await onUpdateNote({ mdm: `## Problem Summary\n• ${text}` });
                  toast.success("Added to clinical note");
                }}
              />

              <div className="grid md:grid-cols-2 gap-3">
                <MDMSectionRenderer
                  sectionKey="differential_reasoning"
                  title="Differential Diagnosis"
                  content={editedContent.differential_reasoning || aiAnalysis.differential_reasoning}
                  likelihood={aiRanking?.differential_reasoning}
                  color="cyan"
                  isEditing={editingSection === "differential_reasoning"}
                  editValue={editedContent.differential_reasoning}
                  onEditChange={(updated) => setEditedContent({...editedContent, differential_reasoning: updated})}
                  onAdd={async (content) => {
                    const text = Array.isArray(content) ? content.join("\n• ") : content;
                    await onUpdateNote({ mdm: `## Differential Diagnosis Reasoning\n• ${text}` });
                    toast.success("Added to clinical note");
                  }}
                />

                <MDMSectionRenderer
                  sectionKey="imaging_labs_rationale"
                  title="Labs/Imaging"
                  content={editedContent.imaging_labs_rationale || aiAnalysis.imaging_labs_rationale}
                  likelihood={aiRanking?.imaging_labs_rationale}
                  color="purple"
                  isEditing={editingSection === "imaging_labs_rationale"}
                  editValue={editedContent.imaging_labs_rationale}
                  onEditChange={(updated) => setEditedContent({...editedContent, imaging_labs_rationale: updated})}
                  onAdd={async (content) => {
                    const text = Array.isArray(content) ? content.join("\n• ") : content;
                    await onUpdateNote({ mdm: `## Imaging/Labs Rationale\n• ${text}` });
                    toast.success("Added to clinical note");
                  }}
                />

                <MDMSectionRenderer
                  sectionKey="treatment_reasoning"
                  title="Treatment Reasoning"
                  content={editedContent.treatment_reasoning || aiAnalysis.treatment_reasoning}
                  likelihood={aiRanking?.treatment_reasoning}
                  color="pink"
                  isEditing={editingSection === "treatment_reasoning"}
                  editValue={editedContent.treatment_reasoning}
                  onEditChange={(updated) => setEditedContent({...editedContent, treatment_reasoning: updated})}
                  onAdd={async (content) => {
                    const text = Array.isArray(content) ? content.join("\n• ") : content;
                    await onUpdateNote({ mdm: `## Treatment Reasoning\n• ${text}` });
                    toast.success("Added to clinical note");
                  }}
                />

                <MDMSectionRenderer
                  sectionKey="risk_assessment"
                  title="Risk Assessment"
                  content={editedContent.risk_assessment || aiAnalysis.risk_assessment}
                  likelihood={aiRanking?.risk_assessment}
                  color="orange"
                  isEditing={editingSection === "risk_assessment"}
                  editValue={editedContent.risk_assessment}
                  onEditChange={(updated) => setEditedContent({...editedContent, risk_assessment: updated})}
                  onAdd={async (content) => {
                    const text = Array.isArray(content) ? content.join("\n• ") : content;
                    await onUpdateNote({ mdm: `## Risk Assessment\n• ${text}` });
                    toast.success("Added to clinical note");
                  }}
                />

                <MDMSectionRenderer
                  sectionKey="follow_up_strategy"
                  title="Follow-up Strategy"
                  content={editedContent.follow_up_strategy || aiAnalysis.follow_up_strategy}
                  likelihood={aiRanking?.follow_up_strategy}
                  color="emerald"
                  isEditing={editingSection === "follow_up_strategy"}
                  editValue={editedContent.follow_up_strategy}
                  onEditChange={(updated) => setEditedContent({...editedContent, follow_up_strategy: updated})}
                  onAdd={async (content) => {
                    const text = Array.isArray(content) ? content.join("\n• ") : content;
                    await onUpdateNote({ mdm: `## Follow-up Strategy\n• ${text}` });
                    toast.success("Added to clinical note");
                  }}
                />
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
                  <XCircle className="w-3.5 h-3.5" /> Cancel
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
                            <XCircle className="w-3.5 h-3.5" /> Delete
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