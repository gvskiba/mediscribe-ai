import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookOpen, Download, Loader2, FileText } from "lucide-react";
import { motion } from "framer-motion";

export default function PatientEducationMaterials({ diagnoses, plan, medications, open, onClose }) {
  const [materials, setMaterials] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && !materials) {
      generateMaterials();
    }
  }, [open]);

  const generateMaterials = async () => {
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate comprehensive patient education materials for the following clinical scenario. Write in patient-friendly language (8th grade reading level).

Diagnoses: ${diagnoses?.join(", ") || "N/A"}
Treatment Plan: ${plan || "N/A"}
Medications: ${medications?.join(", ") || "N/A"}

Provide:
1. condition_overview - Brief explanation of the condition(s) in simple terms
2. what_to_expect - What the patient should expect in their recovery/management
3. medication_instructions - How to take medications, what to watch for (include all medications)
4. lifestyle_recommendations - Diet, activity, and lifestyle changes
5. warning_signs - When to seek immediate medical attention
6. follow_up_care - What follow-up appointments or tests are needed
7. additional_resources - Helpful resources or support groups`,
        response_json_schema: {
          type: "object",
          properties: {
            condition_overview: { type: "string" },
            what_to_expect: { type: "string" },
            medication_instructions: { type: "array", items: { type: "string" } },
            lifestyle_recommendations: { type: "array", items: { type: "string" } },
            warning_signs: { type: "array", items: { type: "string" } },
            follow_up_care: { type: "string" },
            additional_resources: { type: "array", items: { type: "string" } }
          }
        }
      });

      setMaterials(result);
    } catch (error) {
      console.error("Failed to generate education materials:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadMaterials = () => {
    if (!materials) return;

    const content = `
PATIENT EDUCATION MATERIALS
Generated: ${new Date().toLocaleDateString()}

UNDERSTANDING YOUR CONDITION
${materials.condition_overview}

WHAT TO EXPECT
${materials.what_to_expect}

MEDICATION INSTRUCTIONS
${materials.medication_instructions?.map((inst, i) => `${i + 1}. ${inst}`).join("\n") || "No medications prescribed"}

LIFESTYLE RECOMMENDATIONS
${materials.lifestyle_recommendations?.map((rec, i) => `• ${rec}`).join("\n") || "None"}

WARNING SIGNS - SEEK IMMEDIATE MEDICAL ATTENTION IF:
${materials.warning_signs?.map((sign, i) => `⚠️ ${sign}`).join("\n") || "None"}

FOLLOW-UP CARE
${materials.follow_up_care}

ADDITIONAL RESOURCES
${materials.additional_resources?.map((res, i) => `• ${res}`).join("\n") || "None"}

---
This information is for educational purposes only and does not replace professional medical advice.
    `.trim();

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Patient_Education_${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            Patient Education Materials
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <span className="ml-3 text-slate-600">Generating patient-friendly materials...</span>
          </div>
        ) : materials ? (
          <div className="space-y-4 mt-4">
            {/* Condition Overview */}
            <Card className="p-4 bg-blue-50 border-blue-100">
              <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Understanding Your Condition
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed">{materials.condition_overview}</p>
            </Card>

            {/* What to Expect */}
            <Card className="p-4 bg-purple-50 border-purple-100">
              <h3 className="font-semibold text-slate-900 mb-2">What to Expect</h3>
              <p className="text-sm text-slate-700 leading-relaxed">{materials.what_to_expect}</p>
            </Card>

            {/* Medication Instructions */}
            {materials.medication_instructions?.length > 0 && (
              <Card className="p-4 bg-emerald-50 border-emerald-100">
                <h3 className="font-semibold text-slate-900 mb-2">Medication Instructions</h3>
                <ul className="space-y-2">
                  {materials.medication_instructions.map((inst, idx) => (
                    <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">{idx + 1}.</span>
                      <span>{inst}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Lifestyle Recommendations */}
            {materials.lifestyle_recommendations?.length > 0 && (
              <Card className="p-4 bg-amber-50 border-amber-100">
                <h3 className="font-semibold text-slate-900 mb-2">Lifestyle Recommendations</h3>
                <ul className="space-y-1">
                  {materials.lifestyle_recommendations.map((rec, idx) => (
                    <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                      <span className="text-amber-600">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Warning Signs */}
            {materials.warning_signs?.length > 0 && (
              <Card className="p-4 bg-red-50 border-red-200">
                <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <span className="text-red-600">⚠️</span>
                  Warning Signs - Seek Immediate Medical Attention
                </h3>
                <ul className="space-y-1">
                  {materials.warning_signs.map((sign, idx) => (
                    <li key={idx} className="text-sm text-red-700 flex items-start gap-2">
                      <span className="text-red-600 font-bold">•</span>
                      <span>{sign}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Follow-up Care */}
            <Card className="p-4 bg-slate-50 border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-2">Follow-up Care</h3>
              <p className="text-sm text-slate-700 leading-relaxed">{materials.follow_up_care}</p>
            </Card>

            {/* Additional Resources */}
            {materials.additional_resources?.length > 0 && (
              <Card className="p-4 bg-indigo-50 border-indigo-100">
                <h3 className="font-semibold text-slate-900 mb-2">Additional Resources</h3>
                <ul className="space-y-1">
                  {materials.additional_resources.map((res, idx) => (
                    <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                      <span className="text-indigo-600">•</span>
                      <span>{res}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={downloadMaterials} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                <Download className="w-4 h-4" /> Download for Patient
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}