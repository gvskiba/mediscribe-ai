import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Plus, Check } from "lucide-react";
import { toast } from "sonner";

export default function DiagnosisRecommendations({ note, onAddDiagnoses }) {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedRecs, setSelectedRecs] = useState([]);

  useEffect(() => {
    if (!recommendations.length && !loading) {
      generateRecommendations();
    }
  }, []);

  const generateRecommendations = async () => {
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on this clinical presentation, suggest 3-5 additional diagnoses or clinical considerations that should be evaluated or ruled out.

CHIEF COMPLAINT: ${note.chief_complaint || "N/A"}
HISTORY: ${note.history_of_present_illness || "N/A"}
PHYSICAL EXAM: ${note.physical_exam || "N/A"}
ASSESSMENT: ${note.assessment || "N/A"}
CURRENT DIAGNOSES: ${note.diagnoses?.join(", ") || "N/A"}

For each recommendation, provide:
1. The suggested diagnosis or consideration
2. Clinical reasoning (why this should be considered)
3. Key findings that support this
4. Suggested workup/tests if needed

Return as a JSON array of objects with: diagnosis, reasoning, findings, workup`,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  diagnosis: { type: "string" },
                  reasoning: { type: "string" },
                  findings: { type: "string" },
                  workup: { type: "string" }
                }
              }
            }
          }
        }
      });

      setRecommendations(result.recommendations || []);
    } catch (error) {
      console.error("Failed to generate recommendations:", error);
      toast.error("Failed to generate recommendations");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (idx) => {
    setSelectedRecs(prev =>
      prev.includes(idx)
        ? prev.filter(i => i !== idx)
        : [...prev, idx]
    );
  };

  const handleAdd = async () => {
    if (selectedRecs.length === 0) {
      toast.error("Select at least one diagnosis to add");
      return;
    }

    try {
      const newDiagnoses = selectedRecs.map(idx => recommendations[idx].diagnosis);
      await onAddDiagnoses(newDiagnoses);
      setSelectedRecs([]);
      toast.success(`Added ${newDiagnoses.length} diagnosis recommendation(s)`);
    } catch (error) {
      console.error("Failed to add diagnoses:", error);
      toast.error("Failed to add diagnoses");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            AI Diagnosis Recommendations
          </h3>
          <p className="text-xs text-slate-500 mt-1">Additional diagnoses to consider based on clinical presentation</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={generateRecommendations}
          disabled={loading}
          className="gap-1"
        >
          {loading ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-3 h-3" />
              Regenerate
            </>
          )}
        </Button>
      </div>

      {loading && (
        <div className="flex items-center gap-3 text-slate-500 py-8">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Analyzing clinical data...</span>
        </div>
      )}

      {!loading && recommendations.length > 0 && (
        <>
          <div className="space-y-3">
            {recommendations.map((rec, idx) => (
              <div
                key={idx}
                onClick={() => handleToggle(idx)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedRecs.includes(idx)
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`h-5 w-5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      selectedRecs.includes(idx)
                        ? "bg-blue-600 border-blue-600"
                        : "border-slate-300"
                    }`}
                  >
                    {selectedRecs.includes(idx) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-900">{rec.diagnosis}</p>
                    <p className="text-xs text-slate-600 mt-2"><strong>Reasoning:</strong> {rec.reasoning}</p>
                    <p className="text-xs text-slate-600 mt-1"><strong>Key Findings:</strong> {rec.findings}</p>
                    {rec.workup && (
                      <p className="text-xs text-slate-600 mt-1"><strong>Suggested Workup:</strong> {rec.workup}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedRecs.length > 0 && (
            <Button
              onClick={handleAdd}
              className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4" />
              Add {selectedRecs.length} Selected Diagnosis{selectedRecs.length !== 1 ? "es" : ""}
            </Button>
          )}
        </>
      )}

      {!loading && recommendations.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <p className="text-sm">No recommendations generated</p>
        </div>
      )}
    </div>
  );
}