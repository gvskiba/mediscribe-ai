import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { AlertCircle, Pill, TestTube, Users, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ClinicalDecisionSupport({
  medications = [],
  diagnoses = [],
  medicalHistory,
  allergies = [],
  vitalsAndLabs,
  patientAge,
  specialty
}) {
  const [alerts, setAlerts] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    if (medications.length > 0 || diagnoses.length > 0 || vitalsAndLabs) {
      analyzeClinicalContext();
    }
  }, [medications, diagnoses]);

  const analyzeClinicalContext = async () => {
    setLoading(true);
    try {
      const medicationList = medications.join(", ") || "None documented";
      const allergyList = allergies.join(", ") || "NKDA";
      const diagnosisList = diagnoses.join(", ") || "Not specified";

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a clinical pharmacist and decision support specialist. Analyze the following patient information for safety concerns and clinical recommendations:

PATIENT CONTEXT:
- Age: ${patientAge || "Not specified"}
- Specialty: ${specialty || "General Medicine"}
- Diagnoses: ${diagnosisList}
- Known Allergies: ${allergyList}
- Past Medical History: ${medicalHistory || "Not documented"}

CURRENT MEDICATIONS:
${medicationList}

${vitalsAndLabs ? `
VITAL SIGNS AND LAB VALUES:
${vitalsAndLabs}
` : ""}

Provide a comprehensive clinical decision support analysis with:

1. DRUG INTERACTIONS & CONTRAINDICATIONS (Critical):
   - List any significant interactions between current medications
   - Flag medications contraindicated with documented allergies or conditions
   - Note any dose adjustments needed based on patient age/comorbidities
   - Severity: HIGH/MODERATE/LOW for each

2. CRITICAL LAB/VITAL ALERTS (if lab values provided):
   - Flag any abnormal vital signs or lab values outside normal ranges
   - Highlight critical values requiring immediate attention
   - Suggest clinical actions for each abnormality

3. DIAGNOSTIC TEST RECOMMENDATIONS:
   - Suggest 3-5 tests based on diagnoses and medication monitoring needs
   - Include frequency and clinical rationale
   - Prioritize by urgency

4. SPECIALIST REFERRAL SUGGESTIONS:
   - Recommend specialist consultations based on diagnoses
   - Note timing (urgent/routine)
   - Specific concerns to address

Format each section clearly with actionable, evidence-based recommendations.`,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            drug_interactions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  interaction: { type: "string" },
                  severity: { type: "string", enum: ["HIGH", "MODERATE", "LOW"] },
                  action: { type: "string" }
                }
              }
            },
            lab_alerts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  finding: { type: "string" },
                  critical: { type: "boolean" },
                  clinical_action: { type: "string" }
                }
              }
            },
            diagnostic_tests: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  test_name: { type: "string" },
                  rationale: { type: "string" },
                  frequency: { type: "string" },
                  urgency: { type: "string", enum: ["URGENT", "ROUTINE"] }
                }
              }
            },
            specialist_referrals: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  specialty: { type: "string" },
                  reason: { type: "string" },
                  timing: { type: "string", enum: ["URGENT", "ROUTINE"] }
                }
              }
            }
          }
        }
      });

      setAlerts(result);
    } catch (error) {
      console.error("Failed to analyze clinical context:", error);
      toast.error("Failed to generate clinical decision support");
    } finally {
      setLoading(false);
    }
  };

  if (!alerts && !loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <Button
          onClick={analyzeClinicalContext}
          variant="outline"
          className="w-full gap-2 text-blue-700 border-blue-300 hover:bg-blue-50"
        >
          <AlertCircle className="w-4 h-4" />
          Analyze Clinical Safety & Recommendations
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-blue-100/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-slate-900">Clinical Decision Support</h3>
          {alerts?.drug_interactions?.some(d => d.severity === "HIGH") && (
            <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-1 rounded">
              ⚠️ HIGH PRIORITY
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              analyzeClinicalContext();
            }}
            variant="ghost"
            size="icon"
            disabled={loading}
            className="h-8 w-8"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-blue-200 divide-y divide-blue-200">
          {/* Drug Interactions */}
          {alerts?.drug_interactions && alerts.drug_interactions.length > 0 && (
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <Pill className="w-5 h-5 text-red-600" />
                <h4 className="font-semibold text-slate-900">Drug Interactions & Contraindications</h4>
              </div>
              <div className="space-y-2">
                {alerts.drug_interactions.map((interaction, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border-l-4 ${
                      interaction.severity === "HIGH"
                        ? "bg-red-50 border-l-red-500"
                        : interaction.severity === "MODERATE"
                        ? "bg-yellow-50 border-l-yellow-500"
                        : "bg-blue-50 border-l-blue-500"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 text-sm">{interaction.interaction}</p>
                        <p className="text-xs text-slate-600 mt-1">{interaction.action}</p>
                      </div>
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded whitespace-nowrap ${
                          interaction.severity === "HIGH"
                            ? "bg-red-200 text-red-800"
                            : interaction.severity === "MODERATE"
                            ? "bg-yellow-200 text-yellow-800"
                            : "bg-blue-200 text-blue-800"
                        }`}
                      >
                        {interaction.severity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lab Alerts */}
          {alerts?.lab_alerts && alerts.lab_alerts.length > 0 && (
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <TestTube className="w-5 h-5 text-orange-600" />
                <h4 className="font-semibold text-slate-900">Critical Lab & Vital Alerts</h4>
              </div>
              <div className="space-y-2">
                {alerts.lab_alerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border-l-4 ${
                      alert.critical
                        ? "bg-red-50 border-l-red-500"
                        : "bg-yellow-50 border-l-yellow-500"
                    }`}
                  >
                    <p className="font-semibold text-slate-900 text-sm">{alert.finding}</p>
                    <p className="text-xs text-slate-600 mt-1">{alert.clinical_action}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Diagnostic Tests */}
          {alerts?.diagnostic_tests && alerts.diagnostic_tests.length > 0 && (
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <TestTube className="w-5 h-5 text-emerald-600" />
                <h4 className="font-semibold text-slate-900">Recommended Diagnostic Tests</h4>
              </div>
              <div className="space-y-2">
                {alerts.diagnostic_tests.map((test, idx) => (
                  <div key={idx} className="p-3 bg-white rounded-lg border border-slate-200">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-semibold text-slate-900 text-sm">{test.test_name}</p>
                      {test.urgency === "URGENT" && (
                        <span className="text-xs font-bold bg-red-100 text-red-800 px-2 py-1 rounded">
                          URGENT
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600">{test.rationale}</p>
                    <p className="text-xs text-slate-500 mt-1">Frequency: {test.frequency}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Specialist Referrals */}
          {alerts?.specialist_referrals && alerts.specialist_referrals.length > 0 && (
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-purple-600" />
                <h4 className="font-semibold text-slate-900">Specialist Referral Suggestions</h4>
              </div>
              <div className="space-y-2">
                {alerts.specialist_referrals.map((referral, idx) => (
                  <div key={idx} className="p-3 bg-white rounded-lg border border-slate-200">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-semibold text-slate-900 text-sm">{referral.specialty}</p>
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded ${
                          referral.timing === "URGENT"
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {referral.timing}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{referral.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className="p-4 flex items-center justify-center gap-2 text-slate-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing clinical context...
            </div>
          )}
        </div>
      )}
    </div>
  );
}