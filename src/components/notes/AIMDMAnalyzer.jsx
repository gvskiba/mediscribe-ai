import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Check, AlertCircle, Plus, Copy } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function AIMDMAnalyzer({ note, onAddToNote }) {
  const [generating, setGenerating] = useState(false);
  const [mdmAnalysis, setMdmAnalysis] = useState(null);
  const [copied, setCopied] = useState(false);

  const generateMDM = async () => {
    setGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate comprehensive Medical Decision Making (MDM) documentation for this clinical encounter.

PATIENT PRESENTATION:
Chief Complaint: ${note.chief_complaint || "Not documented"}
History: ${note.history_of_present_illness || "Not documented"}
Vital Signs: ${note.vital_signs ? JSON.stringify(note.vital_signs) : "Not documented"}
Physical Exam: ${note.physical_exam || "Not documented"}
Assessment: ${note.assessment || "Not documented"}
Diagnoses: ${note.diagnoses?.join(", ") || "None"}
Medications: ${note.medications?.join(", ") || "None"}
Plan: ${note.plan || "Not documented"}

Generate detailed Medical Decision Making documentation including:

1. COMPLEXITY OF MEDICAL DECISION MAKING
   - Level of complexity (straightforward/low/moderate/high)
   - Number of diagnoses/management options considered
   - Amount and complexity of data reviewed

2. DIFFERENTIAL DIAGNOSIS REASONING
   - Alternative diagnoses considered
   - Why certain diagnoses were ruled in or out
   - Clinical reasoning for final diagnosis

3. DIAGNOSTIC WORKUP RATIONALE
   - Laboratory tests: Why each test was ordered (indications) or not ordered (contraindications)
   - Imaging studies: Clinical justification for each study
   - Consultations: Reasoning for specialist involvement
   - Tests deferred: Why certain tests were not indicated

4. TREATMENT DECISION RATIONALE
   - Medications prescribed: Evidence-based rationale for each
   - Medications NOT prescribed: Contraindications or reasons avoided
   - Alternative treatments considered and why chosen/rejected
   - Risk-benefit analysis of treatment decisions

5. CLINICAL RISK ASSESSMENT
   - Risk stratification for complications
   - Prognosis and expected outcomes
   - Patient-specific risk factors considered
   - Safety considerations and monitoring plan

6. SHARED DECISION MAKING
   - Patient preferences and values considered
   - Risks and benefits discussed with patient
   - Patient understanding and agreement with plan
   - Alternative options offered

7. FOLLOW-UP PLANNING RATIONALE
   - Why specific follow-up timing was chosen
   - What parameters will be monitored and why
   - Red flags communicated to patient
   - Contingency plans if treatment fails

8. BILLING/COMPLEXITY JUSTIFICATION
   - Time spent on patient care
   - Complexity indicators for coding
   - Documentation of counseling/coordination

Be specific, evidence-based, and demonstrate thorough clinical reasoning. Include medical terminology appropriate for professional documentation.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            complexity_level: {
              type: "string",
              enum: ["straightforward", "low", "moderate", "high"],
              description: "Overall MDM complexity"
            },
            differential_reasoning: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  diagnosis: { type: "string" },
                  likelihood: { type: "string" },
                  reasoning: { type: "string" }
                }
              }
            },
            diagnostic_workup: {
              type: "object",
              properties: {
                labs_ordered: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      test: { type: "string" },
                      indication: { type: "string" }
                    }
                  }
                },
                imaging_ordered: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      study: { type: "string" },
                      justification: { type: "string" }
                    }
                  }
                },
                tests_deferred: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      test: { type: "string" },
                      reason_not_indicated: { type: "string" }
                    }
                  }
                }
              }
            },
            treatment_rationale: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  medication: { type: "string" },
                  indication: { type: "string" },
                  evidence_basis: { type: "string" },
                  alternatives_considered: { type: "string" }
                }
              }
            },
            contraindications_avoided: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  medication_or_treatment: { type: "string" },
                  contraindication_reason: { type: "string" }
                }
              }
            },
            risk_assessment: {
              type: "object",
              properties: {
                risk_level: { type: "string", enum: ["low", "moderate", "high"] },
                complications_considered: { type: "array", items: { type: "string" } },
                patient_risk_factors: { type: "array", items: { type: "string" } },
                monitoring_plan: { type: "string" }
              }
            },
            shared_decision_making: {
              type: "object",
              properties: {
                patient_preferences: { type: "string" },
                risks_discussed: { type: "array", items: { type: "string" } },
                benefits_discussed: { type: "array", items: { type: "string" } },
                alternatives_offered: { type: "array", items: { type: "string" } }
              }
            },
            complexity_indicators: {
              type: "object",
              properties: {
                diagnoses_count: { type: "number" },
                data_points_reviewed: { type: "string" },
                time_spent: { type: "string" },
                counseling_coordination: { type: "string" }
              }
            }
          }
        }
      });

      setMdmAnalysis(result);
      toast.success("Medical Decision Making analysis generated");
    } catch (error) {
      console.error("Failed to generate MDM:", error);
      toast.error("Failed to generate MDM analysis");
    } finally {
      setGenerating(false);
    }
  };

  const formatMDMForNote = () => {
    if (!mdmAnalysis) return "";

    let mdmText = "\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    mdmText += "MEDICAL DECISION MAKING\n";
    mdmText += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

    mdmText += `COMPLEXITY LEVEL: ${mdmAnalysis.complexity_level?.toUpperCase()}\n\n`;

    if (mdmAnalysis.differential_reasoning?.length > 0) {
      mdmText += "DIFFERENTIAL DIAGNOSIS REASONING:\n";
      mdmAnalysis.differential_reasoning.forEach((diff, i) => {
        mdmText += `  ${i + 1}. ${diff.diagnosis} (${diff.likelihood})\n`;
        mdmText += `     ${diff.reasoning}\n`;
      });
      mdmText += "\n";
    }

    if (mdmAnalysis.diagnostic_workup) {
      mdmText += "DIAGNOSTIC WORKUP RATIONALE:\n";
      
      if (mdmAnalysis.diagnostic_workup.labs_ordered?.length > 0) {
        mdmText += "\n  Laboratory Tests Ordered:\n";
        mdmAnalysis.diagnostic_workup.labs_ordered.forEach((lab, i) => {
          mdmText += `    • ${lab.test}\n`;
          mdmText += `      Indication: ${lab.indication}\n`;
        });
      }

      if (mdmAnalysis.diagnostic_workup.imaging_ordered?.length > 0) {
        mdmText += "\n  Imaging Studies Ordered:\n";
        mdmAnalysis.diagnostic_workup.imaging_ordered.forEach((img, i) => {
          mdmText += `    • ${img.study}\n`;
          mdmText += `      Justification: ${img.justification}\n`;
        });
      }

      if (mdmAnalysis.diagnostic_workup.tests_deferred?.length > 0) {
        mdmText += "\n  Tests Deferred/Not Indicated:\n";
        mdmAnalysis.diagnostic_workup.tests_deferred.forEach((test, i) => {
          mdmText += `    • ${test.test}\n`;
          mdmText += `      Reason: ${test.reason_not_indicated}\n`;
        });
      }
      mdmText += "\n";
    }

    if (mdmAnalysis.treatment_rationale?.length > 0) {
      mdmText += "TREATMENT DECISION RATIONALE:\n";
      mdmAnalysis.treatment_rationale.forEach((tx, i) => {
        mdmText += `  ${i + 1}. ${tx.medication}\n`;
        mdmText += `     Indication: ${tx.indication}\n`;
        mdmText += `     Evidence: ${tx.evidence_basis}\n`;
        mdmText += `     Alternatives: ${tx.alternatives_considered}\n`;
      });
      mdmText += "\n";
    }

    if (mdmAnalysis.contraindications_avoided?.length > 0) {
      mdmText += "CONTRAINDICATIONS AVOIDED:\n";
      mdmAnalysis.contraindications_avoided.forEach((contra, i) => {
        mdmText += `  • ${contra.medication_or_treatment}\n`;
        mdmText += `    Reason: ${contra.contraindication_reason}\n`;
      });
      mdmText += "\n";
    }

    if (mdmAnalysis.risk_assessment) {
      mdmText += "CLINICAL RISK ASSESSMENT:\n";
      mdmText += `  Risk Level: ${mdmAnalysis.risk_assessment.risk_level?.toUpperCase()}\n`;
      if (mdmAnalysis.risk_assessment.complications_considered?.length > 0) {
        mdmText += `  Complications Considered: ${mdmAnalysis.risk_assessment.complications_considered.join(", ")}\n`;
      }
      if (mdmAnalysis.risk_assessment.patient_risk_factors?.length > 0) {
        mdmText += `  Patient Risk Factors: ${mdmAnalysis.risk_assessment.patient_risk_factors.join(", ")}\n`;
      }
      mdmText += `  Monitoring Plan: ${mdmAnalysis.risk_assessment.monitoring_plan}\n\n`;
    }

    if (mdmAnalysis.shared_decision_making) {
      mdmText += "SHARED DECISION MAKING:\n";
      mdmText += `  Patient Preferences: ${mdmAnalysis.shared_decision_making.patient_preferences}\n`;
      if (mdmAnalysis.shared_decision_making.risks_discussed?.length > 0) {
        mdmText += `  Risks Discussed: ${mdmAnalysis.shared_decision_making.risks_discussed.join(", ")}\n`;
      }
      if (mdmAnalysis.shared_decision_making.benefits_discussed?.length > 0) {
        mdmText += `  Benefits Discussed: ${mdmAnalysis.shared_decision_making.benefits_discussed.join(", ")}\n`;
      }
      mdmText += "\n";
    }

    if (mdmAnalysis.complexity_indicators) {
      mdmText += "COMPLEXITY JUSTIFICATION:\n";
      mdmText += `  Number of Diagnoses: ${mdmAnalysis.complexity_indicators.diagnoses_count}\n`;
      mdmText += `  Data Reviewed: ${mdmAnalysis.complexity_indicators.data_points_reviewed}\n`;
      mdmText += `  Time Spent: ${mdmAnalysis.complexity_indicators.time_spent}\n`;
      mdmText += `  Counseling/Coordination: ${mdmAnalysis.complexity_indicators.counseling_coordination}\n`;
    }

    return mdmText;
  };

  const copyToClipboard = () => {
    const mdmText = formatMDMForNote();
    navigator.clipboard.writeText(mdmText);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const complexityColors = {
    straightforward: "bg-green-100 text-green-800 border-green-300",
    low: "bg-blue-100 text-blue-800 border-blue-300",
    moderate: "bg-yellow-100 text-yellow-800 border-yellow-300",
    high: "bg-red-100 text-red-800 border-red-300"
  };

  const riskColors = {
    low: "bg-green-50 border-green-200 text-green-900",
    moderate: "bg-yellow-50 border-yellow-200 text-yellow-900",
    high: "bg-red-50 border-red-200 text-red-900"
  };

  return (
    <div className="space-y-6">
      {/* Generate Button */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-600" />
              AI Medical Decision Making Analysis
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Generate comprehensive MDM documentation with clinical reasoning for all diagnostic and treatment decisions
            </p>
            <Button
              onClick={generateMDM}
              disabled={generating || (!note.chief_complaint && !note.assessment && !note.diagnoses?.length)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg gap-2"
            >
              {generating ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generating MDM...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Generate Medical Decision Making</>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* MDM Analysis Display */}
      {mdmAnalysis && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Complexity Level */}
          <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-slate-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-indigo-600" />
                Complexity Assessment
              </h4>
              <Badge className={`${complexityColors[mdmAnalysis.complexity_level] || complexityColors.moderate} border font-semibold px-4 py-1`}>
                {mdmAnalysis.complexity_level?.toUpperCase()}
              </Badge>
            </div>
            {mdmAnalysis.complexity_indicators && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <p className="text-xs text-slate-600 mb-1">Diagnoses Considered</p>
                  <p className="font-semibold text-slate-900">{mdmAnalysis.complexity_indicators.diagnoses_count}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <p className="text-xs text-slate-600 mb-1">Time Spent</p>
                  <p className="font-semibold text-slate-900">{mdmAnalysis.complexity_indicators.time_spent}</p>
                </div>
              </div>
            )}
          </div>

          {/* Differential Diagnosis Reasoning */}
          {mdmAnalysis.differential_reasoning?.length > 0 && (
            <div className="bg-white rounded-xl border-2 border-purple-200 p-6">
              <h4 className="font-bold text-slate-900 mb-4 text-purple-900">Differential Diagnosis Reasoning</h4>
              <div className="space-y-3">
                {mdmAnalysis.differential_reasoning.map((diff, idx) => (
                  <div key={idx} className="bg-purple-50 rounded-lg border border-purple-200 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-semibold text-slate-900">{diff.diagnosis}</p>
                      <Badge className="bg-purple-600 text-white text-xs">{diff.likelihood}</Badge>
                    </div>
                    <p className="text-sm text-slate-700">{diff.reasoning}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Diagnostic Workup */}
          {mdmAnalysis.diagnostic_workup && (
            <div className="bg-white rounded-xl border-2 border-blue-200 p-6">
              <h4 className="font-bold text-slate-900 mb-4 text-blue-900">Diagnostic Workup Rationale</h4>
              <div className="space-y-4">
                {mdmAnalysis.diagnostic_workup.labs_ordered?.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-blue-800 mb-2">Laboratory Tests Ordered:</p>
                    {mdmAnalysis.diagnostic_workup.labs_ordered.map((lab, idx) => (
                      <div key={idx} className="bg-blue-50 rounded-lg border border-blue-100 p-3 mb-2">
                        <p className="text-sm font-semibold text-slate-900">{lab.test}</p>
                        <p className="text-xs text-slate-600 mt-1"><strong>Indication:</strong> {lab.indication}</p>
                      </div>
                    ))}
                  </div>
                )}

                {mdmAnalysis.diagnostic_workup.imaging_ordered?.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-blue-800 mb-2">Imaging Studies Ordered:</p>
                    {mdmAnalysis.diagnostic_workup.imaging_ordered.map((img, idx) => (
                      <div key={idx} className="bg-blue-50 rounded-lg border border-blue-100 p-3 mb-2">
                        <p className="text-sm font-semibold text-slate-900">{img.study}</p>
                        <p className="text-xs text-slate-600 mt-1"><strong>Justification:</strong> {img.justification}</p>
                      </div>
                    ))}
                  </div>
                )}

                {mdmAnalysis.diagnostic_workup.tests_deferred?.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-slate-600 mb-2">Tests Deferred/Not Indicated:</p>
                    {mdmAnalysis.diagnostic_workup.tests_deferred.map((test, idx) => (
                      <div key={idx} className="bg-slate-50 rounded-lg border border-slate-200 p-3 mb-2">
                        <p className="text-sm font-semibold text-slate-900">{test.test}</p>
                        <p className="text-xs text-slate-600 mt-1"><strong>Reason:</strong> {test.reason_not_indicated}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Treatment Rationale */}
          {mdmAnalysis.treatment_rationale?.length > 0 && (
            <div className="bg-white rounded-xl border-2 border-green-200 p-6">
              <h4 className="font-bold text-slate-900 mb-4 text-green-900">Treatment Decision Rationale</h4>
              <div className="space-y-3">
                {mdmAnalysis.treatment_rationale.map((tx, idx) => (
                  <div key={idx} className="bg-green-50 rounded-lg border border-green-200 p-4">
                    <p className="font-semibold text-slate-900 mb-2">{tx.medication}</p>
                    <div className="space-y-1 text-sm">
                      <p className="text-slate-700"><strong className="text-green-800">Indication:</strong> {tx.indication}</p>
                      <p className="text-slate-700"><strong className="text-green-800">Evidence:</strong> {tx.evidence_basis}</p>
                      <p className="text-slate-700"><strong className="text-green-800">Alternatives:</strong> {tx.alternatives_considered}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contraindications */}
          {mdmAnalysis.contraindications_avoided?.length > 0 && (
            <div className="bg-white rounded-xl border-2 border-red-200 p-6">
              <h4 className="font-bold text-slate-900 mb-4 text-red-900">Contraindications Avoided</h4>
              <div className="space-y-2">
                {mdmAnalysis.contraindications_avoided.map((contra, idx) => (
                  <div key={idx} className="bg-red-50 rounded-lg border border-red-200 p-3">
                    <p className="text-sm font-semibold text-slate-900">{contra.medication_or_treatment}</p>
                    <p className="text-xs text-slate-700 mt-1">{contra.contraindication_reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risk Assessment */}
          {mdmAnalysis.risk_assessment && (
            <div className={`bg-white rounded-xl border-2 p-6 ${riskColors[mdmAnalysis.risk_assessment.risk_level] || "border-slate-200"}`}>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-slate-900">Clinical Risk Assessment</h4>
                <Badge className={`${riskColors[mdmAnalysis.risk_assessment.risk_level] || "bg-slate-100 text-slate-800"} border font-semibold`}>
                  {mdmAnalysis.risk_assessment.risk_level?.toUpperCase()} RISK
                </Badge>
              </div>
              <div className="space-y-3 text-sm">
                {mdmAnalysis.risk_assessment.complications_considered?.length > 0 && (
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">Complications Considered:</p>
                    <p className="text-slate-700">{mdmAnalysis.risk_assessment.complications_considered.join(", ")}</p>
                  </div>
                )}
                {mdmAnalysis.risk_assessment.patient_risk_factors?.length > 0 && (
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">Patient Risk Factors:</p>
                    <p className="text-slate-700">{mdmAnalysis.risk_assessment.patient_risk_factors.join(", ")}</p>
                  </div>
                )}
                <div>
                  <p className="font-semibold text-slate-900 mb-1">Monitoring Plan:</p>
                  <p className="text-slate-700">{mdmAnalysis.risk_assessment.monitoring_plan}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={() => {
                const mdmText = formatMDMForNote();
                onAddToNote(mdmText);
              }}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg gap-2"
            >
              <Plus className="w-4 h-4" />
              Add MDM to Clinical Note
            </Button>
            <Button
              variant="outline"
              onClick={copyToClipboard}
              className="gap-2 border-slate-300 hover:bg-slate-50"
            >
              {copied ? (
                <><Check className="w-4 h-4 text-green-600" /> Copied</>
              ) : (
                <><Copy className="w-4 h-4" /> Copy</>
              )}
            </Button>
          </div>
        </motion.div>
      )}

      {!mdmAnalysis && !generating && (
        <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600">Medical Decision Making analysis will appear here</p>
        </div>
      )}
    </div>
  );
}