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
      <QuickAIAnalysisTools note={note} />

      {/* AI Analysis Generator */}
      <AIAnalysisGenerator 
        note={note}
        noteId={noteId}
        userSettings={userSettings}
        onSectionAdd={() => {
          // Refresh MDM sections if needed
        }}
      />

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