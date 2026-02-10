import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Sparkles, Search } from "lucide-react";
import { toast } from "sonner";

export default function DiagnosisICD10Matcher({ diagnoses = [], onCodesGenerated }) {
  const [selectedDiagnoses, setSelectedDiagnoses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState([]);

  const handleSelectDiagnosis = (diagnosis) => {
    setSelectedDiagnoses((prev) =>
      prev.includes(diagnosis)
        ? prev.filter((d) => d !== diagnosis)
        : [...prev, diagnosis]
    );
  };

  const handleGenerateCodes = async () => {
    if (selectedDiagnoses.length === 0) {
      toast.error("Please select at least one diagnosis");
      return;
    }

    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate the most appropriate and specific ICD-10 codes for the following diagnoses. For each diagnosis, provide the top 3-5 most relevant codes ranked by specificity and clinical applicability.

DIAGNOSES TO CODE:
${selectedDiagnoses.join("\n")}

For each code, provide:
1. The specific ICD-10 code (e.g., I10, E11.9231)
2. Complete description
3. Which diagnosis it addresses
4. Why this code is most appropriate (clinical reasoning)
5. Alternative codes if more specific information is needed`,
        response_json_schema: {
          type: "object",
          properties: {
            codes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  diagnosis: { type: "string" },
                  code: { type: "string" },
                  description: { type: "string" },
                  reasoning: { type: "string" },
                  alternatives: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        code: { type: "string" },
                        description: { type: "string" },
                        reason: { type: "string" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      setGeneratedCodes(result.codes || []);
      onCodesGenerated?.(result.codes || []);
      toast.success(`Generated ICD-10 codes for ${selectedDiagnoses.length} diagnosis/diagnoses`);
    } catch (error) {
      console.error("Failed to generate codes:", error);
      toast.error("Failed to generate ICD-10 codes");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Diagnosis Selection */}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <Search className="w-4 h-4 text-blue-600" />
          Select Diagnoses for ICD-10 Coding
        </h3>
        {diagnoses && diagnoses.length > 0 ? (
          <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-3 bg-slate-50">
            {diagnoses
              .filter(
                (d) =>
                  d &&
                  d.trim().length > 0 &&
                  !d.toLowerCase().includes("not documented") &&
                  !d.toLowerCase().includes("not extracted")
              )
              .map((diagnosis, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded">
                  <Checkbox
                    id={`diag-${idx}`}
                    checked={selectedDiagnoses.includes(diagnosis)}
                    onCheckedChange={() => handleSelectDiagnosis(diagnosis)}
                  />
                  <label htmlFor={`diag-${idx}`} className="text-sm text-slate-700 cursor-pointer flex-1">
                    {diagnosis}
                  </label>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 bg-slate-50 p-3 rounded-lg">No diagnoses available</p>
        )}
        <p className="text-xs text-slate-500 mt-2">
          {selectedDiagnoses.length} diagnosis/diagnoses selected
        </p>
      </div>

      {/* Generate Button */}
      <Button
        onClick={handleGenerateCodes}
        disabled={loading || selectedDiagnoses.length === 0}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating Codes...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Generate ICD-10 Codes
          </>
        )}
      </Button>

      {/* Generated Codes Display */}
      {generatedCodes.length > 0 && (
        <div className="space-y-4 mt-6 pt-6 border-t border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900">Generated Codes</h3>
          {generatedCodes.map((item, idx) => (
            <div key={idx} className="border border-blue-200 bg-blue-50 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-bold text-slate-900">{item.diagnosis}</p>
                  <p className="text-lg font-mono font-bold text-blue-700 mt-1">{item.code}</p>
                  <p className="text-xs text-slate-600 mt-1">{item.description}</p>
                </div>
              </div>
              <p className="text-xs text-slate-700 mt-3">
                <strong>Why:</strong> {item.reasoning}
              </p>

              {item.alternatives && item.alternatives.length > 0 && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <p className="text-xs font-semibold text-slate-700 mb-2">Alternative Codes:</p>
                  <div className="space-y-1">
                    {item.alternatives.map((alt, i) => (
                      <div key={i} className="text-xs text-slate-600 flex gap-2">
                        <span className="font-mono font-bold text-slate-900 min-w-fit">{alt.code}:</span>
                        <span>{alt.description} ({alt.reason})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}