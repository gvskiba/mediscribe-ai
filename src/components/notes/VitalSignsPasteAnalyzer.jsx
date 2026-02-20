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

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-white">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Copy className="w-4 h-4" />
            Paste Vital Signs
          </h3>
          <p className="text-xs text-emerald-100 mt-1">Paste vital signs data and let AI organize it</p>
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
    </div>
  );
}