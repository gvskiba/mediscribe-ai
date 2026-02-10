import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { 
  FileText, 
  Code, 
  Sparkles, 
  Check, 
  AlertCircle,
  TrendingUp,
  Pill,
  BookOpen,
  Loader2,
  Eye,
  Plus
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { toast } from "sonner";
import ICD10Suggestions from "./ICD10Suggestions";
import ICD10CodeSearch from "./ICD10CodeSearch";
import PatientSummary from "./PatientSummary";

export default function StructuredNoteReview({
  structuredNote,
  rawData,
  patientHistory,
  guidelineRecommendations,
  loadingGuidelines,
  icd10Suggestions,
  loadingIcd10,
  medicationRecommendations,
  loadingMedications,
  onUpdate,
  onReanalyze,
  onGenerateGuidelines,
  onGenerateICD10,
  onGenerateMedications
}) {
  const navigate = useNavigate();
  const [finalizing, setFinalizing] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);

  const handleFinalize = async () => {
    setFinalizing(true);
    try {
      const created = await base44.entities.ClinicalNote.create({
        ...rawData,
        ...structuredNote,
        status: "finalized"
      });

      // Auto-link guidelines
      try {
        await base44.functions.invoke('autoLinkGuidelines', { noteId: created.id });
      } catch (error) {
        console.error("Failed to auto-link guidelines:", error);
      }

      toast.success("Note finalized successfully");
      navigate(createPageUrl(`NoteDetail?id=${created.id}`));
    } catch (error) {
      console.error("Failed to finalize note:", error);
      toast.error("Failed to finalize note");
    } finally {
      setFinalizing(false);
    }
  };

  const generateSummary = async () => {
    setGeneratingSummary(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a concise patient summary from this clinical note. Focus on actionable information for continuity of care.

Patient: ${structuredNote.patient_name || rawData?.patient_name || "Unknown"}
Date: ${rawData?.date_of_visit || new Date().toISOString().split('T')[0]}

Chief Complaint: ${structuredNote.chief_complaint || "N/A"}
Assessment: ${structuredNote.assessment || "N/A"}
Plan: ${structuredNote.plan || "N/A"}
Diagnoses: ${structuredNote.diagnoses?.join(", ") || "N/A"}
Medications: ${structuredNote.medications?.join(", ") || "N/A"}

Provide:
1. Overview - 2-3 sentence summary of visit
2. Key Diagnoses - List of primary diagnoses
3. Current Medications - All medications with dosages
4. Follow-up Plans - Next steps, appointments, tests ordered
5. Critical Alerts - Any urgent items requiring attention (empty array if none)`,
        response_json_schema: {
          type: "object",
          properties: {
            overview: { type: "string" },
            key_diagnoses: { type: "array", items: { type: "string" } },
            current_medications: { type: "array", items: { type: "string" } },
            follow_up_plans: { type: "array", items: { type: "string" } },
            critical_alerts: { type: "array", items: { type: "string" } }
          }
        }
      });

      setAiSummary(result);
    } catch (error) {
      console.error("Failed to generate summary:", error);
      toast.error("Failed to generate summary");
    } finally {
      setGeneratingSummary(false);
    }
  };

  const confidenceColor = (level) => {
    switch (level) {
      case "high": return "text-emerald-600 bg-emerald-50";
      case "medium": return "text-amber-600 bg-amber-50";
      case "low": return "text-red-600 bg-red-50";
      default: return "text-slate-600 bg-slate-50";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {structuredNote.patient_name || rawData?.patient_name || "New Clinical Note"}
            </h1>
            <p className="text-slate-500 mt-1">Review and finalize your clinical note</p>
          </div>
          <Badge className="bg-amber-100 text-amber-700 border-amber-200">
            Draft
          </Badge>
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-200">
          <Button
            onClick={handleFinalize}
            disabled={finalizing}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-2"
          >
            {finalizing ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Finalizing...</>
            ) : (
              <><Check className="w-4 h-4" /> Finalize Note</>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(createPageUrl("NewNote"))}
            className="flex-1"
          >
            Start New Note
          </Button>
        </div>
      </div>

      {/* Main Tabbed Interface */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="w-full justify-start border-b border-slate-200 rounded-none bg-transparent px-6 h-14">
            <TabsTrigger value="summary" className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-600 px-4">
              <Eye className="w-4 h-4 mr-2" />
              Summary
            </TabsTrigger>
            <TabsTrigger value="clinical" className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-600 px-4">
              <FileText className="w-4 h-4 mr-2" />
              Clinical Note
            </TabsTrigger>
            <TabsTrigger value="codes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-600 px-4">
              <Code className="w-4 h-4 mr-2" />
              Codes & Guidelines
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-600 px-4">
              <Sparkles className="w-4 h-4 mr-2" />
              AI Recommendations
            </TabsTrigger>
          </TabsList>

          {/* Summary Tab */}
          <TabsContent value="summary" className="p-6 space-y-4">
            {!aiSummary ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Generate AI Summary</h3>
                <p className="text-slate-500 mb-4">Create a comprehensive summary for quick reference</p>
                <Button
                  onClick={generateSummary}
                  disabled={generatingSummary}
                  className="gap-2 bg-cyan-600 hover:bg-cyan-700"
                >
                  {generatingSummary ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> Generate Summary</>
                  )}
                </Button>
              </div>
            ) : (
              <PatientSummary 
                summary={aiSummary}
                patientName={structuredNote.patient_name || rawData?.patient_name}
              />
            )}
          </TabsContent>

          {/* Clinical Note Tab */}
          <TabsContent value="clinical" className="p-6">
            <div className="space-y-6">
              {/* Chief Complaint */}
              {structuredNote.chief_complaint && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">Chief Complaint</h3>
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <p className="text-slate-700">{structuredNote.chief_complaint}</p>
                  </div>
                </div>
              )}

              {/* HPI */}
              {structuredNote.history_of_present_illness && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">History of Present Illness</h3>
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <p className="text-slate-700 whitespace-pre-wrap">{structuredNote.history_of_present_illness}</p>
                  </div>
                </div>
              )}

              {/* Medical History */}
              {structuredNote.medical_history && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">Medical History</h3>
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <p className="text-slate-700 whitespace-pre-wrap">{structuredNote.medical_history}</p>
                  </div>
                </div>
              )}

              {/* ROS */}
              {structuredNote.review_of_systems && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">Review of Systems</h3>
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <p className="text-slate-700 whitespace-pre-wrap">{structuredNote.review_of_systems}</p>
                  </div>
                </div>
              )}

              {/* Physical Exam */}
              {structuredNote.physical_exam && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">Physical Examination</h3>
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <p className="text-slate-700 whitespace-pre-wrap">{structuredNote.physical_exam}</p>
                  </div>
                </div>
              )}

              {/* Assessment */}
              {structuredNote.assessment && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">Assessment</h3>
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <p className="text-slate-700 whitespace-pre-wrap">{structuredNote.assessment}</p>
                  </div>
                </div>
              )}

              {/* Plan */}
              {structuredNote.plan && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">Plan</h3>
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <p className="text-slate-700 whitespace-pre-wrap">{structuredNote.plan}</p>
                  </div>
                </div>
              )}

              {/* Diagnoses */}
              {structuredNote.diagnoses && structuredNote.diagnoses.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">Diagnoses</h3>
                  <div className="flex flex-wrap gap-2">
                    {structuredNote.diagnoses.map((dx, idx) => (
                      <Badge key={idx} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {dx}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Medications */}
              {structuredNote.medications && structuredNote.medications.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">Medications</h3>
                  <div className="flex flex-wrap gap-2">
                    {structuredNote.medications.map((med, idx) => (
                      <Badge key={idx} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {med}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Codes & Guidelines Tab */}
          <TabsContent value="codes" className="p-6 space-y-6">
            {/* ICD-10 Codes */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Code className="w-4 h-4 text-blue-600" />
                  ICD-10 Code Suggestions
                </h3>
                {!loadingIcd10 && icd10Suggestions.length === 0 && (
                  <Button
                    onClick={onGenerateICD10}
                    size="sm"
                    variant="outline"
                    className="gap-2"
                  >
                    <Sparkles className="w-3 h-3" /> Generate Codes
                  </Button>
                )}
              </div>

              {loadingIcd10 ? (
                <div className="flex items-center gap-3 text-slate-500 py-8">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Generating ICD-10 suggestions...</span>
                </div>
              ) : icd10Suggestions.length > 0 ? (
                <>
                  <ICD10Suggestions
                    suggestions={icd10Suggestions}
                    loading={false}
                    onApplyToNote={(codes) => {
                      const newDiagnoses = codes.map(c => `${c.code} - ${c.description}`);
                      onUpdate("diagnoses", [...(structuredNote.diagnoses || []), ...newDiagnoses]);
                    }}
                  />
                  <div className="mt-4">
                    <ICD10CodeSearch
                      suggestions={icd10Suggestions}
                      diagnoses={structuredNote.diagnoses || []}
                      onAddDiagnoses={(newDiagnoses) => {
                        onUpdate("diagnoses", [...(structuredNote.diagnoses || []), ...newDiagnoses]);
                      }}
                    />
                  </div>
                </>
              ) : (
                <Card className="p-8 text-center bg-slate-50">
                  <Code className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-600">No ICD-10 codes generated yet</p>
                  <p className="text-xs text-slate-500 mt-1">Generate codes from your diagnoses</p>
                </Card>
              )}
            </div>

            {/* Clinical Guidelines */}
            <div className="pt-6 border-t border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-600" />
                  Evidence-Based Guidelines
                </h3>
                {!loadingGuidelines && guidelineRecommendations.length === 0 && (
                  <Button
                    onClick={onGenerateGuidelines}
                    size="sm"
                    variant="outline"
                    className="gap-2"
                  >
                    <Sparkles className="w-3 h-3" /> Generate Guidelines
                  </Button>
                )}
              </div>

              {loadingGuidelines ? (
                <div className="flex items-center gap-3 text-slate-500 py-8">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Fetching clinical guidelines...</span>
                </div>
              ) : guidelineRecommendations.length > 0 ? (
                <div className="space-y-4">
                  {guidelineRecommendations.map((rec, idx) => (
                    <Card key={idx} className="p-5 bg-gradient-to-br from-slate-50 to-white">
                      <h4 className="font-bold text-slate-900 mb-2">{rec.condition}</h4>
                      <p className="text-sm text-slate-600 mb-3">{rec.summary}</p>
                      {rec.key_points && rec.key_points.length > 0 && (
                        <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                          <p className="text-xs font-semibold text-purple-900 mb-2">Key Recommendations:</p>
                          <ul className="space-y-1">
                            {rec.key_points.map((point, i) => (
                              <li key={i} className="text-xs text-purple-800 flex items-start gap-2">
                                <span className="text-purple-600">•</span>
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center bg-slate-50">
                  <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-600">No guidelines generated yet</p>
                  <p className="text-xs text-slate-500 mt-1">Generate guidelines based on diagnoses</p>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* AI Recommendations Tab */}
          <TabsContent value="recommendations" className="p-6 space-y-6">
            {/* Medication Recommendations */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Pill className="w-4 h-4 text-green-600" />
                  Medication Recommendations
                </h3>
                {!loadingMedications && medicationRecommendations.length === 0 && (
                  <Button
                    onClick={onGenerateMedications}
                    size="sm"
                    variant="outline"
                    className="gap-2"
                  >
                    <Sparkles className="w-3 h-3" /> Generate Recommendations
                  </Button>
                )}
              </div>

              {loadingMedications ? (
                <div className="flex items-center gap-3 text-slate-500 py-8">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Generating medication recommendations...</span>
                </div>
              ) : medicationRecommendations.length > 0 ? (
                <div className="space-y-4">
                  {medicationRecommendations.map((rec, idx) => (
                    <Card key={idx} className="p-5 bg-gradient-to-br from-green-50 to-white border-2 border-green-100">
                      <h4 className="font-bold text-slate-900 mb-3">{rec.condition}</h4>
                      
                      {rec.first_line && rec.first_line.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-green-900 mb-2">First-Line Options:</p>
                          <div className="space-y-2">
                            {rec.first_line.map((med, i) => (
                              <div key={i} className="bg-white rounded-lg p-3 border border-green-200">
                                <p className="text-sm font-semibold text-slate-900">{med.medication}</p>
                                <p className="text-xs text-slate-600 mt-1"><strong>Dosing:</strong> {med.dosing}</p>
                                <p className="text-xs text-slate-600"><strong>Rationale:</strong> {med.rationale}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {rec.alternatives && rec.alternatives.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-amber-900 mb-2">Alternative Options:</p>
                          <div className="space-y-2">
                            {rec.alternatives.map((alt, i) => (
                              <div key={i} className="bg-amber-50 rounded-lg p-2 border border-amber-200">
                                <p className="text-xs font-semibold text-slate-900">{alt.medication}</p>
                                <p className="text-xs text-slate-600">{alt.when_to_use}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {rec.monitoring && (
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-100 mb-2">
                          <p className="text-xs font-semibold text-blue-900 mb-1">Monitoring:</p>
                          <p className="text-xs text-blue-800">{rec.monitoring}</p>
                        </div>
                      )}

                      {rec.contraindications && (
                        <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                          <p className="text-xs font-semibold text-red-900 mb-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Contraindications:
                          </p>
                          <p className="text-xs text-red-800">{rec.contraindications}</p>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center bg-slate-50">
                  <Pill className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-600">No medication recommendations yet</p>
                  <p className="text-xs text-slate-500 mt-1">Generate based on diagnoses and patient history</p>
                </Card>
              )}
            </div>

            {/* Data Quality Insights */}
            <div className="pt-6 border-t border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-cyan-600" />
                Documentation Quality
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <p className="text-xs text-slate-500 mb-1">Completeness</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ 
                          width: `${Math.min(
                            100,
                            ([
                              structuredNote.chief_complaint,
                              structuredNote.history_of_present_illness,
                              structuredNote.assessment,
                              structuredNote.plan
                            ].filter(Boolean).length / 4) * 100
                          )}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-slate-900">
                      {Math.round(([
                        structuredNote.chief_complaint,
                        structuredNote.history_of_present_illness,
                        structuredNote.assessment,
                        structuredNote.plan
                      ].filter(Boolean).length / 4) * 100)}%
                    </span>
                  </div>
                </Card>
                
                <Card className="p-4">
                  <p className="text-xs text-slate-500 mb-1">Diagnoses</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {structuredNote.diagnoses?.length || 0}
                  </p>
                </Card>
                
                <Card className="p-4">
                  <p className="text-xs text-slate-500 mb-1">Medications</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {structuredNote.medications?.length || 0}
                  </p>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
}