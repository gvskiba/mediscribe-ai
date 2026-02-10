import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Sparkles, Check, X } from "lucide-react";
import { toast } from "sonner";

export default function DiagnosisICD10Matcher({ diagnoses = [], onCodesGenerated }) {
  const [selectedDiagnoses, setSelectedDiagnoses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState([]);

  // Ensure diagnoses is always an array of strings, not individual characters
  const diagnosisArray = Array.isArray(diagnoses) 
    ? diagnoses.filter(d => d && typeof d === 'string' && d.trim().length > 1)
    : [];

  const handleDiagnosisToggle = (diagnosis) => {
    setSelectedDiagnoses((prev) =>
      prev.includes(diagnosis)
        ? prev.filter((d) => d !== diagnosis)
        : [...prev, diagnosis]
    );
  };

  const generateCodes = async () => {
    if (selectedDiagnoses.length === 0) {
      toast.error("Please select at least one diagnosis");
      return;
    }

    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert medical coder. For each diagnosis, generate the 3 most appropriate ICD-10 codes ranked by specificity and clinical relevance.

DIAGNOSES TO CODE:
${selectedDiagnoses.join("\n")}

For each code, provide:
1. The specific ICD-10 code
2. The complete description
3. Which diagnosis it codes
4. Confidence level (high/moderate/low)

Format as a JSON array where each object has: code, description, diagnosis, confidence`,
        response_json_schema: {
          type: "object",
          properties: {
            codes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  code: { type: "string" },
                  description: { type: "string" },
                  diagnosis: { type: "string" },
                  confidence: { type: "string", enum: ["high", "moderate", "low"] }
                }
              }
            }
          }
        }
      });

      setGeneratedCodes(result.codes || []);
      if (onCodesGenerated) {
        onCodesGenerated(result.codes || []);
      }
      toast.success(`Generated codes for ${selectedDiagnoses.length} diagnosis(es)`);
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
      <div className="space-y-2 max-h-48 overflow-y-auto bg-white rounded-lg border border-blue-100 p-4">
        {diagnosisArray.length > 0 ? (
          diagnosisArray.map((diagnosis, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Checkbox
                id={`diag-${idx}`}
                checked={selectedDiagnoses.includes(diagnosis)}
                onCheckedChange={() => handleDiagnosisToggle(diagnosis)}
              />
              <label
                htmlFor={`diag-${idx}`}
                className="text-sm text-slate-700 cursor-pointer flex-1"
              >
                {diagnosis}
              </label>
            </div>
          ))
        ) : (
          <p className="text-xs text-slate-500">No diagnoses available</p>
        )}
      </div>

      {/* Generate Button */}
      <Button
        onClick={generateCodes}
        disabled={loading || selectedDiagnoses.length === 0}
        className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating Codes...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Generate ICD-10 Codes ({selectedDiagnoses.length} selected)
          </>
        )}
      </Button>

      {/* Generated Codes */}
      {generatedCodes.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold text-slate-700">Generated Codes ({generatedCodes.length}):</p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {generatedCodes.map((item, idx) => (
              <div key={idx} className="bg-blue-50 rounded-lg border border-blue-200 p-3 text-xs">
                <div className="flex items-start justify-between mb-1">
                  <code className="font-bold text-blue-700">{item.code}</code>
                  <span className={`px-2 py-0.5 rounded text-white text-xs font-semibold ${
                    item.confidence === 'high' ? 'bg-green-600' :
                    item.confidence === 'moderate' ? 'bg-yellow-600' :
                    'bg-orange-600'
                  }`}>
                    {item.confidence}
                  </span>
                </div>
                <p className="text-slate-700">{item.description}</p>
                <p className="text-slate-600 mt-1 italic">For: {item.diagnosis}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}