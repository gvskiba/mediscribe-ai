import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Plus, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function AITreatmentPlanAnalyzer({ note, onAddToPlan }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState(null);

  const analyzeAndRecommend = async () => {
    setAnalyzing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `As a clinical decision support system, analyze this clinical presentation and provide comprehensive, evidence-based treatment recommendations following current clinical guidelines.

PATIENT INFORMATION:
- Age: ${note.patient_age || "Not specified"}
- Gender: ${note.patient_gender || "Not specified"}

CLINICAL PRESENTATION:
- Chief Complaint: ${note.chief_complaint || "Not documented"}
- History: ${note.history_of_present_illness || "Not documented"}
- Assessment: ${note.assessment || "Not documented"}

CURRENT STATUS:
- Diagnoses: ${note.diagnoses?.join(", ") || "None documented"}
- Current Medications: ${note.medications?.join(", ") || "None"}
- Allergies: ${note.allergies?.join(", ") || "None documented"}
- Medical History: ${note.medical_history || "Not documented"}

VITAL SIGNS:
${note.vital_signs ? `
- BP: ${note.vital_signs.blood_pressure?.systolic || "?"}/${note.vital_signs.blood_pressure?.diastolic || "?"} mmHg
- HR: ${note.vital_signs.heart_rate?.value || "?"} bpm
- Temp: ${note.vital_signs.temperature?.value || "?"} °F
- SpO2: ${note.vital_signs.oxygen_saturation?.value || "?"}%
` : "Not documented"}

Provide a comprehensive, evidence-based treatment plan including:

1. PHARMACOLOGICAL MANAGEMENT
   - First-line medications with specific dosing (dose, route, frequency)
   - Alternative options if first-line is contraindicated
   - Duration of therapy
   - Special considerations for this patient

2. NON-PHARMACOLOGICAL INTERVENTIONS
   - Lifestyle modifications
   - Physical therapy or exercises if applicable
   - Dietary recommendations
   - Patient education priorities

3. MONITORING PLAN
   - What to monitor (labs, vitals, symptoms)
   - Frequency of monitoring
   - Target values or goals

4. FOLLOW-UP SCHEDULE
   - When to schedule follow-up
   - What to assess at follow-up
   - Criteria for treatment escalation

5. REFERRALS & CONSULTATIONS
   - When specialist referral is indicated
   - What type of specialist
   - Urgency level

6. RED FLAGS & PRECAUTIONS
   - Warning signs requiring immediate medical attention
   - Potential complications to monitor

Base all recommendations on current evidence-based guidelines. Be specific with dosages, timing, and monitoring parameters.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            pharmacological: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  medication: { type: "string" },
                  dosing: { type: "string" },
                  duration: { type: "string" },
                  rationale: { type: "string" }
                }
              }
            },
            non_pharmacological: {
              type: "array",
              items: { type: "string" }
            },
            monitoring: {
              type: "object",
              properties: {
                parameters: { type: "array", items: { type: "string" } },
                frequency: { type: "string" },
                goals: { type: "array", items: { type: "string" } }
              }
            },
            follow_up: {
              type: "object",
              properties: {
                timing: { type: "string" },
                assessment_points: { type: "array", items: { type: "string" } },
                escalation_criteria: { type: "array", items: { type: "string" } }
              }
            },
            referrals: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  specialist: { type: "string" },
                  indication: { type: "string" },
                  urgency: { type: "string" }
                }
              }
            },
            red_flags: {
              type: "array",
              items: { type: "string" }
            },
            guideline_references: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      setRecommendations(result);
      toast.success("Treatment plan analysis complete");
    } catch (error) {
      console.error("Failed to analyze treatment plan:", error);
      toast.error("Failed to generate recommendations");
    } finally {
      setAnalyzing(false);
    }
  };

  const formatTreatmentPlan = () => {
    if (!recommendations) return "";

    let plan = "\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    plan += "AI-GENERATED EVIDENCE-BASED TREATMENT PLAN\n";
    plan += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

    if (recommendations.summary) {
      plan += `${recommendations.summary}\n\n`;
    }

    if (recommendations.pharmacological?.length > 0) {
      plan += "═══ PHARMACOLOGICAL MANAGEMENT ═══\n\n";
      recommendations.pharmacological.forEach((med, i) => {
        plan += `${i + 1}. ${med.medication}\n`;
        plan += `   • Dosing: ${med.dosing}\n`;
        plan += `   • Duration: ${med.duration}\n`;
        plan += `   • Rationale: ${med.rationale}\n\n`;
      });
    }

    if (recommendations.non_pharmacological?.length > 0) {
      plan += "═══ NON-PHARMACOLOGICAL INTERVENTIONS ═══\n\n";
      recommendations.non_pharmacological.forEach((intervention, i) => {
        plan += `${i + 1}. ${intervention}\n`;
      });
      plan += "\n";
    }

    if (recommendations.monitoring) {
      plan += "═══ MONITORING PLAN ═══\n\n";
      if (recommendations.monitoring.parameters?.length > 0) {
        plan += "Parameters to Monitor:\n";
        recommendations.monitoring.parameters.forEach(param => {
          plan += `• ${param}\n`;
        });
      }
      if (recommendations.monitoring.frequency) {
        plan += `\nFrequency: ${recommendations.monitoring.frequency}\n`;
      }
      if (recommendations.monitoring.goals?.length > 0) {
        plan += "\nTarget Goals:\n";
        recommendations.monitoring.goals.forEach(goal => {
          plan += `• ${goal}\n`;
        });
      }
      plan += "\n";
    }

    if (recommendations.follow_up) {
      plan += "═══ FOLLOW-UP SCHEDULE ═══\n\n";
      if (recommendations.follow_up.timing) {
        plan += `Timing: ${recommendations.follow_up.timing}\n\n`;
      }
      if (recommendations.follow_up.assessment_points?.length > 0) {
        plan += "Assessment Points:\n";
        recommendations.follow_up.assessment_points.forEach(point => {
          plan += `• ${point}\n`;
        });
        plan += "\n";
      }
      if (recommendations.follow_up.escalation_criteria?.length > 0) {
        plan += "Escalation Criteria:\n";
        recommendations.follow_up.escalation_criteria.forEach(criteria => {
          plan += `⚠️ ${criteria}\n`;
        });
        plan += "\n";
      }
    }

    if (recommendations.referrals?.length > 0) {
      plan += "═══ REFERRALS & CONSULTATIONS ═══\n\n";
      recommendations.referrals.forEach((ref, i) => {
        plan += `${i + 1}. ${ref.specialist}\n`;
        plan += `   • Indication: ${ref.indication}\n`;
        plan += `   • Urgency: ${ref.urgency}\n\n`;
      });
    }

    if (recommendations.red_flags?.length > 0) {
      plan += "═══ RED FLAGS & PRECAUTIONS ═══\n\n";
      plan += "Seek immediate medical attention if:\n";
      recommendations.red_flags.forEach(flag => {
        plan += `🚨 ${flag}\n`;
      });
      plan += "\n";
    }

    if (recommendations.guideline_references?.length > 0) {
      plan += "═══ GUIDELINE REFERENCES ═══\n\n";
      recommendations.guideline_references.forEach((ref, i) => {
        plan += `${i + 1}. ${ref}\n`;
      });
    }

    return plan;
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-xl border-2 border-indigo-300 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-600" />
            AI Treatment Plan Analyzer
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            Get evidence-based, guideline-compliant treatment recommendations
          </p>
        </div>
        <Button
          onClick={analyzeAndRecommend}
          disabled={analyzing || !note.chief_complaint}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white gap-2 shadow-lg"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Analyzing...
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4" /> Generate Treatment Plan
            </>
          )}
        </Button>
      </div>

      {recommendations && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Summary */}
          {recommendations.summary && (
            <div className="bg-white rounded-lg border border-indigo-200 p-4">
              <h4 className="text-sm font-bold text-indigo-900 mb-2">Clinical Summary</h4>
              <p className="text-sm text-slate-700 leading-relaxed">{recommendations.summary}</p>
            </div>
          )}

          {/* Pharmacological Management */}
          {recommendations.pharmacological?.length > 0 && (
            <div className="bg-white rounded-lg border border-blue-200 p-4">
              <h4 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                💊 Pharmacological Management
              </h4>
              <div className="space-y-3">
                {recommendations.pharmacological.map((med, idx) => (
                  <div key={idx} className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                    <p className="font-semibold text-sm text-slate-900 mb-1">{med.medication}</p>
                    <div className="space-y-1 text-xs text-slate-700">
                      <p><strong className="text-blue-700">Dosing:</strong> {med.dosing}</p>
                      <p><strong className="text-blue-700">Duration:</strong> {med.duration}</p>
                      <p><strong className="text-blue-700">Rationale:</strong> {med.rationale}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Non-Pharmacological */}
          {recommendations.non_pharmacological?.length > 0 && (
            <div className="bg-white rounded-lg border border-green-200 p-4">
              <h4 className="text-sm font-bold text-green-900 mb-3">🌱 Non-Pharmacological Interventions</h4>
              <ul className="space-y-2">
                {recommendations.non_pharmacological.map((intervention, idx) => (
                  <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>{intervention}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Monitoring */}
          {recommendations.monitoring && (
            <div className="bg-white rounded-lg border border-amber-200 p-4">
              <h4 className="text-sm font-bold text-amber-900 mb-3">📊 Monitoring Plan</h4>
              <div className="space-y-2 text-sm text-slate-700">
                {recommendations.monitoring.parameters?.length > 0 && (
                  <div>
                    <p className="font-semibold text-amber-800 mb-1">Parameters:</p>
                    <ul className="space-y-1 ml-4">
                      {recommendations.monitoring.parameters.map((param, idx) => (
                        <li key={idx}>• {param}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {recommendations.monitoring.frequency && (
                  <p><strong className="text-amber-800">Frequency:</strong> {recommendations.monitoring.frequency}</p>
                )}
                {recommendations.monitoring.goals?.length > 0 && (
                  <div>
                    <p className="font-semibold text-amber-800 mb-1">Goals:</p>
                    <ul className="space-y-1 ml-4">
                      {recommendations.monitoring.goals.map((goal, idx) => (
                        <li key={idx}>• {goal}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Red Flags */}
          {recommendations.red_flags?.length > 0 && (
            <div className="bg-red-50 rounded-lg border border-red-300 p-4">
              <h4 className="text-sm font-bold text-red-900 mb-3">🚨 Red Flags & Precautions</h4>
              <ul className="space-y-2">
                {recommendations.red_flags.map((flag, idx) => (
                  <li key={idx} className="text-sm text-red-800 flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">⚠️</span>
                    <span>{flag}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Button */}
          <div className="flex justify-end pt-4 border-t border-indigo-200">
            <Button
              onClick={() => {
                const planText = formatTreatmentPlan();
                onAddToPlan(planText);
                toast.success("Treatment plan added to clinical note");
              }}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white gap-2 shadow-lg"
            >
              <Plus className="w-4 h-4" /> Add Treatment Plan to Clinical Note
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}