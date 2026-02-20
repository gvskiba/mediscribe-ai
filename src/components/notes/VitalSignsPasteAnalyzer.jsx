import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { Loader2, Sparkles, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function VitalSignsPasteAnalyzer({ onApplyVitals, vitalSigns, patientAge }) {
  const [pastedText, setPastedText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzedVitals, setAnalyzedVitals] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loadingVitalAnalysis, setLoadingVitalAnalysis] = useState(false);
  const [vitalSignsAnalysis, setVitalSignsAnalysis] = useState(null);

  const handleAnalyze = async () => {
    if (!pastedText.trim()) {
      toast.error("Please paste vital signs data");
      return;
    }

    setAnalyzing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Extract and organize vital signs from this text. Parse values and units.
        
PASTED TEXT:
${pastedText}

Extract the following vital signs if present:
- Temperature (value and unit: F or C)
- Heart Rate (BPM)
- Blood Pressure (systolic/diastolic in mmHg)
- Respiratory Rate (breaths/min)
- Oxygen Saturation (%)
- Height (value and unit: in or cm)
- Weight (value and unit: lbs or kg)
- BMI (if provided or calculated)

Return organized data with parsed numeric values and units.`,
        response_json_schema: {
          type: "object",
          properties: {
            temperature: {
              type: "object",
              properties: {
                value: { type: "number" },
                unit: { type: "string", enum: ["F", "C"] }
              }
            },
            heart_rate: {
              type: "object",
              properties: {
                value: { type: "number" },
                unit: { type: "string" }
              }
            },
            blood_pressure: {
              type: "object",
              properties: {
                systolic: { type: "number" },
                diastolic: { type: "number" },
                unit: { type: "string" }
              }
            },
            respiratory_rate: {
              type: "object",
              properties: {
                value: { type: "number" },
                unit: { type: "string" }
              }
            },
            oxygen_saturation: {
              type: "object",
              properties: {
                value: { type: "number" },
                unit: { type: "string" }
              }
            },
            height: {
              type: "object",
              properties: {
                value: { type: "number" },
                unit: { type: "string", enum: ["in", "cm"] }
              }
            },
            weight: {
              type: "object",
              properties: {
                value: { type: "number" },
                unit: { type: "string", enum: ["lbs", "kg"] }
              }
            },
            bmi: { type: "number" },
            summary: { type: "string" }
          }
        }
      });

      setAnalyzedVitals(result);
      toast.success("Vital signs analyzed successfully");
    } catch (error) {
      console.error("Failed to analyze vital signs:", error);
      toast.error("Failed to analyze vital signs");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApply = () => {
    if (analyzedVitals) {
      onApplyVitals(analyzedVitals);
      setPastedText("");
      setAnalyzedVitals(null);
      toast.success("Vital signs applied to note");
    }
  };

  const handleAnalyzeVitals = async () => {
    const vitals = vitalSigns || analyzedVitals;
    if (!vitals || Object.keys(vitals).length === 0) {
      toast.error("No vital signs to analyze");
      return;
    }
    setLoadingVitalAnalysis(true);
    try {
      const vitalsSummary = Object.entries(vitals)
        .filter(([_, v]) => v && (v.value || v.systolic))
        .map(([key, v]) => {
          const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          if (key === 'blood_pressure') return `- ${displayKey}: ${v.systolic}/${v.diastolic} ${v.unit || 'mmHg'}`;
          return `- ${displayKey}: ${v.value} ${v.unit || ''}`;
        })
        .join('\n');

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a clinical expert. Analyze these vital signs and classify each as NORMAL or ABNORMAL based on standard adult reference ranges.

PATIENT INFORMATION:
Age: ${patientAge || 'Adult (assumed)'}

VITAL SIGNS RECORDED:
${vitalsSummary}

REFERENCE RANGES FOR ADULTS:
- Temperature: 97-99°F (36.1-37.2°C)
- Heart Rate: 60-100 bpm
- Blood Pressure: <120/80 mmHg (normal), 120-139/80-89 (elevated), ≥140/90 (high)
- Respiratory Rate: 12-20 breaths/min
- Oxygen Saturation: ≥95%

For EACH vital sign provided, determine:
1. Is it NORMAL or ABNORMAL?
2. What is the normal reference range?
3. If abnormal, what is the clinical significance?`,
        response_json_schema: {
          type: "object",
          properties: {
            analysis: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  vital_sign: { type: "string" },
                  status: { type: "string", enum: ["normal", "abnormal"] },
                  value: { type: "string" },
                  reference_range: { type: "string" },
                  clinical_significance: { type: "string" }
                }
              }
            },
            summary: { type: "string" }
          }
        }
      });

      setVitalSignsAnalysis(result);
    } catch (error) {
      console.error("Failed to analyze vital signs:", error);
      toast.error("Failed to analyze vital signs");
    } finally {
      setLoadingVitalAnalysis(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
          <h3 className="font-semibold text-sm flex items-center gap-2 text-slate-700">
            <Copy className="w-4 h-4" />
            Paste Vital Signs
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Paste vital signs data and let AI organize it</p>
        </div>
        <div className="p-4 space-y-3">
          <Textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Paste vital signs here (e.g., 'BP 120/80, HR 72, Temp 98.6F, RR 16, SpO2 98%, Height 5'10, Weight 180lbs')"
            className="min-h-[100px] text-sm"
          />

        </div>
      </div>

      {analyzedVitals && (
        <div className="bg-white rounded-xl border-2 border-emerald-200 shadow-sm overflow-hidden">
          <div className="bg-emerald-50 px-4 py-3 border-b border-emerald-200">
            <h3 className="font-semibold text-sm text-emerald-900 flex items-center gap-2">
              <Check className="w-4 h-4" />
              Analyzed Vital Signs
            </h3>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {analyzedVitals.temperature?.value && (
                <Card className="p-3 bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
                  <p className="text-xs text-slate-600 font-medium">Temperature</p>
                  <p className="text-lg font-bold text-slate-900">
                    {analyzedVitals.temperature.value}°{analyzedVitals.temperature.unit}
                  </p>
                </Card>
              )}
              {analyzedVitals.heart_rate?.value && (
                <Card className="p-3 bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
                  <p className="text-xs text-slate-600 font-medium">Heart Rate</p>
                  <p className="text-lg font-bold text-slate-900">
                    {analyzedVitals.heart_rate.value} bpm
                  </p>
                </Card>
              )}
              {analyzedVitals.blood_pressure?.systolic && (
                <Card className="p-3 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                  <p className="text-xs text-slate-600 font-medium">Blood Pressure</p>
                  <p className="text-lg font-bold text-slate-900">
                    {analyzedVitals.blood_pressure.systolic}/{analyzedVitals.blood_pressure.diastolic}
                  </p>
                </Card>
              )}
              {analyzedVitals.respiratory_rate?.value && (
                <Card className="p-3 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
                  <p className="text-xs text-slate-600 font-medium">Respiratory Rate</p>
                  <p className="text-lg font-bold text-slate-900">
                    {analyzedVitals.respiratory_rate.value} /min
                  </p>
                </Card>
              )}
              {analyzedVitals.oxygen_saturation?.value && (
                <Card className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                  <p className="text-xs text-slate-600 font-medium">SpO₂</p>
                  <p className="text-lg font-bold text-slate-900">
                    {analyzedVitals.oxygen_saturation.value}%
                  </p>
                </Card>
              )}
              {analyzedVitals.bmi && (
                <Card className="p-3 bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
                  <p className="text-xs text-slate-600 font-medium">BMI</p>
                  <p className="text-lg font-bold text-slate-900">
                    {analyzedVitals.bmi.toFixed(1)}
                  </p>
                </Card>
              )}
            </div>

            {analyzedVitals.summary && (
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <p className="text-xs font-medium text-slate-700 mb-1">Summary</p>
                <p className="text-sm text-slate-600">{analyzedVitals.summary}</p>
              </div>
            )}

            <Button
              onClick={handleApply}
              className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2"
            >
              <Check className="w-4 h-4" />
              Apply to Note
            </Button>
          </div>
        </div>
      )}

      {/* AI Vital Signs Analysis */}
      <div className="bg-white rounded-xl border-2 border-teal-300 shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-teal-500 to-cyan-500 px-6 py-5 text-white">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Sparkles className="w-6 h-6" />
            AI Vital Signs Analysis
          </h3>
          <p className="text-teal-100 text-sm mt-1">Analyze vital signs for abnormalities</p>
        </div>
        <div className="p-6 space-y-4">
          <Button
            onClick={handleAnalyzeVitals}
            disabled={loadingVitalAnalysis}
            className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white gap-2"
          >
            {loadingVitalAnalysis ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Analyze Vital Signs</>
            )}
          </Button>

          {vitalSignsAnalysis && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 mt-2 pt-4 border-t border-teal-200"
            >
              <p className="text-sm font-semibold text-slate-700">Analysis Results:</p>
              <div className="space-y-3">
                {vitalSignsAnalysis.analysis?.map((item, idx) => (
                  <div
                    key={idx}
                    className={`rounded-lg border-2 p-4 ${
                      item.status === "abnormal"
                        ? "bg-red-50 border-red-200"
                        : "bg-green-50 border-green-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-slate-900 capitalize">{item.vital_sign}</h4>
                      <Badge className={item.status === "abnormal" ? "bg-red-600 text-white" : "bg-green-600 text-white"}>
                        {item.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-700 mb-1"><strong>Value:</strong> {item.value}</p>
                    <p className="text-sm text-slate-700 mb-1"><strong>Reference Range:</strong> {item.reference_range}</p>
                    {item.clinical_significance && (
                      <p className="text-sm text-slate-600"><strong>Significance:</strong> {item.clinical_significance}</p>
                    )}
                  </div>
                ))}
              </div>
              {vitalSignsAnalysis.summary && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-slate-700 mb-2">Summary:</p>
                  <p className="text-sm text-slate-600">{vitalSignsAnalysis.summary}</p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}