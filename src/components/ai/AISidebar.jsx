import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Sparkles, 
  X, 
  ChevronRight, 
  FileText, 
  Activity, 
  Code,
  Pill,
  BookOpen,
  AlertCircle,
  Brain
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AIDocumentationAssistant from "./AIDocumentationAssistant";
import AIComprehensiveSummary from "../notes/AIComprehensiveSummary";
import AIMDMAnalyzer from "../notes/AIMDMAnalyzer";
import AITreatmentPlanAnalyzer from "../notes/AITreatmentPlanAnalyzer";
import AIGuidelineSuggestions from "../notes/AIGuidelineSuggestions";
import ClinicalDecisionSupport from "../notes/ClinicalDecisionSupport";

export default function AISidebar({ isOpen, onClose, note, noteId, onUpdateNote }) {
  const [activeAITab, setActiveAITab] = useState("assistant");

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full md:w-[600px] lg:w-[700px] bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-5 flex items-center justify-between text-white flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">AI Assistant Hub</h2>
                  <p className="text-purple-100 text-sm">Intelligent clinical tools</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-white/20 rounded-lg"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* AI Tools Tabs */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <Tabs value={activeAITab} onValueChange={setActiveAITab} className="flex-1 flex flex-col">
                <TabsList className="flex-shrink-0 bg-slate-50 border-b border-slate-200 px-4 py-3 justify-start overflow-x-auto scrollbar-hide">
                  <TabsTrigger value="assistant" className="gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                    <FileText className="w-4 h-4" /> Documentation
                  </TabsTrigger>
                  <TabsTrigger value="analysis" className="gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                    <Brain className="w-4 h-4" /> Analysis
                  </TabsTrigger>
                  <TabsTrigger value="diagnosis" className="gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    <Activity className="w-4 h-4" /> Diagnosis
                  </TabsTrigger>
                  <TabsTrigger value="treatment" className="gap-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                    <Pill className="w-4 h-4" /> Treatment
                  </TabsTrigger>
                  <TabsTrigger value="guidelines" className="gap-2 data-[state=active]:bg-amber-600 data-[state=active]:text-white">
                    <BookOpen className="w-4 h-4" /> Guidelines
                  </TabsTrigger>
                  <TabsTrigger value="mdm" className="gap-2 data-[state=active]:bg-rose-600 data-[state=active]:text-white">
                    <Code className="w-4 h-4" /> MDM
                  </TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-y-auto">
                  {/* AI Documentation Assistant */}
                  <TabsContent value="assistant" className="p-6 m-0 h-full">
                    <AIDocumentationAssistant note={note} onUpdateNote={onUpdateNote} />
                  </TabsContent>

                  {/* Comprehensive Analysis */}
                  <TabsContent value="analysis" className="p-6 m-0 h-full space-y-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                          <Brain className="w-5 h-5 text-indigo-600" />
                          Comprehensive Clinical Analysis
                        </h3>
                        <p className="text-sm text-slate-600">AI-powered synthesis of all clinical data</p>
                      </div>
                      <AIComprehensiveSummary note={note} onApply={onUpdateNote} />
                    </div>
                  </TabsContent>

                  {/* Diagnostic Support */}
                  <TabsContent value="diagnosis" className="p-6 m-0 h-full space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-600" />
                        AI Diagnostic Support
                      </h3>
                      
                      <div className="space-y-6">
                        {/* Diagnostic Suggestions */}
                        <div className="bg-white rounded-xl border-2 border-blue-200 p-4">
                          <h4 className="text-sm font-bold text-blue-900 mb-3">AI Suggestions</h4>
                          <ClinicalDecisionSupport
                            type="diagnostic"
                            note={note}
                            onAddToNote={async (diagnosis) => {
                              const updatedDiagnoses = [...(note.diagnoses || []), diagnosis];
                              await onUpdateNote({ diagnoses: updatedDiagnoses });
                            }}
                          />
                        </div>

                        {/* Safety Checks */}
                        <div className="bg-white rounded-xl border-2 border-red-200 p-4">
                          <h4 className="text-sm font-bold text-red-900 mb-3 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            Safety Alerts
                          </h4>
                          <ClinicalDecisionSupport
                            type="contraindications"
                            note={note}
                            onAddToNote={async (warning) => {
                              const updatedPlan = (note.plan || "") + "\n\n⚠️ ALERT: " + warning;
                              await onUpdateNote({ plan: updatedPlan });
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Treatment Planning */}
                  <TabsContent value="treatment" className="p-6 m-0 h-full space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Pill className="w-5 h-5 text-emerald-600" />
                        AI Treatment Planner
                      </h3>
                      <AITreatmentPlanAnalyzer note={note} onAddToPlan={async (planText) => {
                        const updatedPlan = (note.plan || "") + planText;
                        await onUpdateNote({ plan: updatedPlan });
                      }} />
                    </div>
                  </TabsContent>

                  {/* Guidelines */}
                  <TabsContent value="guidelines" className="p-6 m-0 h-full space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-amber-600" />
                        Evidence-Based Guidelines
                      </h3>
                      <AIGuidelineSuggestions
                        note={note}
                        onAddToPlan={async (text) => {
                          await onUpdateNote({ plan: (note.plan || "") + text });
                        }}
                      />
                    </div>
                  </TabsContent>

                  {/* MDM */}
                  <TabsContent value="mdm" className="p-6 m-0 h-full space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Code className="w-5 h-5 text-rose-600" />
                        Medical Decision Making
                      </h3>
                      <AIMDMAnalyzer
                        note={note}
                        onAddToNote={async (mdmText) => {
                          await onUpdateNote({ mdm: (note.mdm || "") + mdmText });
                        }}
                      />
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}