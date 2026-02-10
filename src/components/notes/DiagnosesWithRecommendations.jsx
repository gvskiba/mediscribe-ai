import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Plus, Code, Check, X } from "lucide-react";
import { toast } from "sonner";

export default function DiagnosesWithRecommendations({ 
  note, 
  onAddDiagnoses,
  icd10Suggestions,
  loadingIcd10 
}) {
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [selectedRecommendations, setSelectedRecommendations] = useState({});

  // Generate AI recommendations based on chief complaint
  const generateRecommendations = async () => {
    if (!note?.chief_complaint) {
      toast.error("No chief complaint available for recommendations");
      return;
    }

    setLoadingRecommendations(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on this chief complaint, suggest 4-6 likely differential diagnoses that should be considered and coded.

CHIEF COMPLAINT: ${note.chief_complaint}

${note.assessment ? `ASSESSMENT: ${note.assessment}` : ""}

For each diagnosis, provide:
1. The likely diagnosis name
2. The most probable ICD-10 code (format: CODE - Description)
3. Why this diagnosis is relevant to the chief complaint (2-3 sentences)
4. Confidence level (high/moderate/low)

Return as JSON array where each object has: diagnosis_name, icd10_code, reasoning, confidence`,
        response_json_schema: {
          type: "object",
          properties: {
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  diagnosis_name: { type: "string" },
                  icd10_code: { type: "string" },
                  reasoning: { type: "string" },
                  confidence: { type: "string", enum: ["high", "moderate", "low"] }
                }
              }
            }
          }
        }
      });

      setRecommendations(result.recommendations || []);
    } catch (error) {
      console.error("Failed to generate recommendations:", error);
      toast.error("Failed to generate diagnosis recommendations");
    } finally {
      setLoadingRecommendations(false);
    }
  };

  useEffect(() => {
    if (note && !recommendations.length && note.status === "finalized") {
      generateRecommendations();
    }
  }, [note?.id, note?.status]);

  const toggleRecommendation = (index) => {
    setSelectedRecommendations((prev) => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const addSelectedRecommendations = async () => {
    const selectedDiagnoses = recommendations
      .map((rec, idx) => selectedRecommendations[idx] ? rec.icd10_code : null)
      .filter(Boolean);

    if (selectedDiagnoses.length === 0) {
      toast.error("Please select at least one diagnosis");
      return;
    }

    try {
      const updatedDiagnoses = [...(note.diagnoses || []), ...selectedDiagnoses];
      await onAddDiagnoses(updatedDiagnoses);
      setSelectedRecommendations({});
      toast.success(`Added ${selectedDiagnoses.length} diagnosis(es)`);
    } catch (error) {
      console.error("Failed to add diagnoses:", error);
      toast.error("Failed to add diagnoses");
    }
  };

  return (
    <div className="space-y-6">
      {/* Current ICD-10 Coded Diagnoses */}
      {note?.diagnoses && Array.isArray(note.diagnoses) && note.diagnoses.length > 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl border-2 border-blue-200 p-5">
          <h3 className="text-sm font-bold text-blue-900 mb-4 flex items-center gap-2">
            <Code className="w-4 h-4" />
            Current Diagnoses ({note.diagnoses.filter(d => d && /^[A-Z0-9]{1,}.*-/.test(d.trim())).length})
          </h3>
          <div className="space-y-2">
            {note.diagnoses
              .filter(d => d && /^[A-Z0-9]{1,}.*-/.test(d.trim()))
              .map((diag, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border border-blue-200 bg-white hover:border-blue-300 transition-all">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{diag}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* AI Recommended Diagnoses Based on Chief Complaint */}
      {note?.status === "finalized" && (
        <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl border-2 border-purple-300 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-purple-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              AI-Recommended Diagnoses
            </h3>
            {!loadingRecommendations && recommendations.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={generateRecommendations}
                className="text-xs text-purple-600 hover:bg-purple-100 h-6"
              >
                Refresh
              </Button>
            )}
          </div>

          {loadingRecommendations ? (
            <div className="flex items-center gap-3 text-slate-500 py-8">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Analyzing chief complaint for recommendations...</span>
            </div>
          ) : recommendations.length > 0 ? (
            <>
              <div className="space-y-3 mb-4">
                {recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className={`rounded-lg border-2 p-4 cursor-pointer transition-all ${
                      selectedRecommendations[idx]
                        ? "border-purple-400 bg-purple-50"
                        : "border-purple-200 bg-white hover:border-purple-300"
                    }`}
                    onClick={() => toggleRecommendation(idx)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${
                        selectedRecommendations[idx]
                          ? "bg-purple-600 border-purple-600"
                          : "border-purple-300"
                      }`}>
                        {selectedRecommendations[idx] && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-slate-900">{rec.diagnosis_name}</p>
                            <code className="text-xs text-purple-700 font-bold">{rec.icd10_code}</code>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full font-semibold flex-shrink-0 ${
                            rec.confidence === 'high' ? 'bg-green-100 text-green-700' :
                            rec.confidence === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {rec.confidence}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{rec.reasoning}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {Object.values(selectedRecommendations).some(Boolean) && (
                <Button
                  onClick={addSelectedRecommendations}
                  className="w-full gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Plus className="w-4 h-4" />
                  Add {Object.values(selectedRecommendations).filter(Boolean).length} Selected Diagnosis(es)
                </Button>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-slate-500">No recommendations generated</p>
              <Button
                size="sm"
                variant="outline"
                onClick={generateRecommendations}
                className="mt-3 gap-2"
              >
                <Sparkles className="w-3 h-3" />
                Generate Recommendations
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ICD-10 Code Suggestions from extraction */}
      {note?.status === "finalized" && icd10Suggestions?.length > 0 && (
        <div className="bg-gradient-to-br from-cyan-50 to-white rounded-xl border-2 border-cyan-200 p-5">
          <h3 className="text-sm font-bold text-cyan-900 mb-3 flex items-center gap-2">
            <Code className="w-4 h-4" />
            Additional ICD-10 Code Options ({icd10Suggestions.length})
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {icd10Suggestions.map((item, idx) => (
              <div key={idx} className="bg-white rounded-lg border border-cyan-100 p-3 text-xs hover:border-cyan-300 transition-all">
                <div className="flex items-start justify-between">
                  <code className="font-bold text-cyan-700">{item.code}</code>
                  <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                    item.confidence === 'high' ? 'bg-green-100 text-green-700' :
                    item.confidence === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {item.confidence}
                  </span>
                </div>
                <p className="text-slate-700 mt-1">{item.description}</p>
                <p className="text-slate-500 mt-1">For: {item.diagnosis}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!note?.diagnoses || note.diagnoses.length === 0) && note?.status === "finalized" && (
        <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <Code className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600">No diagnoses added yet</p>
          <p className="text-xs text-slate-500 mt-1">Use AI recommendations above or search for ICD-10 codes</p>
        </div>
      )}
    </div>
  );
}