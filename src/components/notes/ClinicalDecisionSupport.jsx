import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Sparkles, TrendingUp, Pill, Plus, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function ClinicalDecisionSupport({ 
  type = "diagnostic", // diagnostic, contraindications, treatment_pathways
  note,
  onAddToNote
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [lastAnalyzed, setLastAnalyzed] = useState("");

  useEffect(() => {
    // Debounce the analysis to avoid too many API calls
    const timer = setTimeout(() => {
      if (shouldAnalyze()) {
        analyzeClinicalData();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [note?.chief_complaint, note?.history_of_present_illness, note?.medications, note?.diagnoses, note?.medical_history, note?.allergies]);

  const shouldAnalyze = () => {
    if (type === "diagnostic") {
      const currentData = `${note?.chief_complaint || ""}${note?.history_of_present_illness || ""}`;
      return currentData !== lastAnalyzed && currentData.trim().length > 10;
    } else if (type === "contraindications") {
      const currentData = JSON.stringify(note?.medications || []);
      return currentData !== lastAnalyzed && note?.medications?.length > 0;
    } else if (type === "treatment_pathways") {
      const currentData = JSON.stringify(note?.diagnoses || []);
      return currentData !== lastAnalyzed && note?.diagnoses?.length > 0;
    }
    return false;
  };

  const analyzeClinicalData = async () => {
    setLoading(true);
    try {
      if (type === "diagnostic") {
        await analyzeDiagnosticSuggestions();
      } else if (type === "contraindications") {
        await analyzeContraindications();
      } else if (type === "treatment_pathways") {
        await analyzeTreatmentPathways();
      }
    } catch (error) {
      console.error("Clinical analysis failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeDiagnosticSuggestions = async () => {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `As a clinical decision support system, analyze these symptoms and provide diagnostic suggestions:

CHIEF COMPLAINT: ${note.chief_complaint || "Not specified"}
HISTORY: ${note.history_of_present_illness || "Not documented"}
PATIENT AGE: ${note.patient_age || "Not specified"}
PATIENT GENDER: ${note.patient_gender || "Not specified"}
MEDICAL HISTORY: ${note.medical_history || "Not documented"}

Provide 3-5 most likely diagnostic considerations ranked by probability. For each:
- Diagnosis name
- Probability (high/moderate/low)
- Key supporting features from the presentation
- Critical "red flag" symptoms to watch for
- Recommended next diagnostic steps

Focus on clinically actionable suggestions.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          suggestions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                diagnosis: { type: "string" },
                probability: { type: "string", enum: ["high", "moderate", "low"] },
                supporting_features: { type: "array", items: { type: "string" } },
                red_flags: { type: "array", items: { type: "string" } },
                next_steps: { type: "array", items: { type: "string" } }
              }
            }
          }
        }
      }
    });

    setSuggestions(result.suggestions || []);
    setLastAnalyzed(`${note?.chief_complaint || ""}${note?.history_of_present_illness || ""}`);
  };

  const analyzeContraindications = async () => {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze these medications for contraindications and safety concerns:

MEDICATIONS: ${note.medications?.join(", ") || "None"}
PATIENT AGE: ${note.patient_age || "Not specified"}
PATIENT GENDER: ${note.patient_gender || "Not specified"}
ALLERGIES: ${note.allergies?.join(", ") || "None documented"}
MEDICAL HISTORY: ${note.medical_history || "Not documented"}
CURRENT DIAGNOSES: ${note.diagnoses?.join(", ") || "None"}

Identify:
1. Absolute contraindications (CRITICAL - should not prescribe)
2. Relative contraindications (caution needed)
3. Drug-disease interactions
4. Drug-allergy interactions
5. Dosing concerns based on patient factors

Only include clinically significant issues. Prioritize by severity.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          warnings: {
            type: "array",
            items: {
              type: "object",
              properties: {
                medication: { type: "string" },
                severity: { type: "string", enum: ["critical", "moderate", "low"] },
                type: { type: "string", enum: ["contraindication", "drug_disease", "allergy", "dosing"] },
                warning: { type: "string" },
                recommendation: { type: "string" }
              }
            }
          }
        }
      }
    });

    setSuggestions(result.warnings || []);
    setLastAnalyzed(JSON.stringify(note?.medications || []));
  };

  const analyzeTreatmentPathways = async () => {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Based on these diagnoses, recommend evidence-based treatment pathways:

DIAGNOSES: ${note.diagnoses?.join(", ") || "None"}
CHIEF COMPLAINT: ${note.chief_complaint || "Not specified"}
PATIENT AGE: ${note.patient_age || "Not specified"}
PATIENT GENDER: ${note.patient_gender || "Not specified"}
MEDICAL HISTORY: ${note.medical_history || "Not documented"}
CURRENT MEDICATIONS: ${note.medications?.join(", ") || "None"}

For each diagnosis, provide:
1. First-line treatment recommendations
2. Key monitoring parameters
3. Follow-up timing
4. Patient education priorities
5. When to escalate or refer

Focus on actionable, guideline-based recommendations.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          pathways: {
            type: "array",
            items: {
              type: "object",
              properties: {
                diagnosis: { type: "string" },
                first_line_treatment: { type: "array", items: { type: "string" } },
                monitoring: { type: "array", items: { type: "string" } },
                follow_up: { type: "string" },
                education_priorities: { type: "array", items: { type: "string" } },
                escalation_criteria: { type: "array", items: { type: "string" } }
              }
            }
          }
        }
      }
    });

    setSuggestions(result.pathways || []);
    setLastAnalyzed(JSON.stringify(note?.diagnoses || []));
  };

  const getTitleAndIcon = () => {
    switch (type) {
      case "diagnostic":
        return { 
          title: "Diagnostic Suggestions", 
          icon: Sparkles,
          color: "from-purple-500 to-indigo-500",
          bgColor: "bg-purple-50",
          borderColor: "border-purple-200"
        };
      case "contraindications":
        return { 
          title: "Medication Safety Alerts", 
          icon: AlertCircle,
          color: "from-red-500 to-orange-500",
          bgColor: "bg-red-50",
          borderColor: "border-red-200"
        };
      case "treatment_pathways":
        return { 
          title: "Treatment Recommendations", 
          icon: TrendingUp,
          color: "from-emerald-500 to-teal-500",
          bgColor: "bg-emerald-50",
          borderColor: "border-emerald-200"
        };
      default:
        return { title: "Clinical Support", icon: Sparkles, color: "from-blue-500 to-cyan-500" };
    }
  };

  const config = getTitleAndIcon();
  const Icon = config.icon;

  if (!suggestions.length && !loading) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border-2 ${config.borderColor} ${config.bgColor} overflow-hidden shadow-sm`}
    >
      <div 
        className={`bg-gradient-to-r ${config.color} px-4 py-3 flex items-center justify-between cursor-pointer`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-white" />
          <h3 className="font-bold text-white text-sm">
            {config.title}
            {suggestions.length > 0 && <span className="ml-2 text-xs opacity-90">({suggestions.length})</span>}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {loading && <Loader2 className="w-4 h-4 text-white animate-spin" />}
          {expanded ? 
            <ChevronUp className="w-5 h-5 text-white" /> : 
            <ChevronDown className="w-5 h-5 text-white" />
          }
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-3">
              {loading && suggestions.length === 0 ? (
                <div className="text-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">Analyzing clinical data...</p>
                </div>
              ) : type === "diagnostic" ? (
                suggestions.map((suggestion, idx) => (
                  <div key={idx} className="bg-white rounded-lg border border-slate-200 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-slate-900 text-sm">{suggestion.diagnosis}</h4>
                        <Badge className={`mt-1 ${
                          suggestion.probability === "high" ? "bg-red-100 text-red-700 border-red-300" :
                          suggestion.probability === "moderate" ? "bg-yellow-100 text-yellow-700 border-yellow-300" :
                          "bg-blue-100 text-blue-700 border-blue-300"
                        }`}>
                          {suggestion.probability} probability
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          onAddToNote?.(suggestion.diagnosis, "diagnosis");
                          toast.success("Added to differentials");
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add
                      </Button>
                    </div>
                    
                    {suggestion.supporting_features?.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold text-slate-700 mb-1">Supporting Features:</p>
                        <ul className="space-y-1">
                          {suggestion.supporting_features.map((feature, i) => (
                            <li key={i} className="text-xs text-slate-600 flex items-start gap-1">
                              <span className="text-green-600 mt-0.5">✓</span>
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {suggestion.red_flags?.length > 0 && (
                      <div className="mt-2 bg-red-50 rounded p-2 border border-red-200">
                        <p className="text-xs font-semibold text-red-900 mb-1">⚠️ Red Flags:</p>
                        <ul className="space-y-1">
                          {suggestion.red_flags.map((flag, i) => (
                            <li key={i} className="text-xs text-red-700">{flag}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {suggestion.next_steps?.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold text-slate-700 mb-1">Recommended Next Steps:</p>
                        <ul className="space-y-1">
                          {suggestion.next_steps.map((step, i) => (
                            <li key={i} className="text-xs text-slate-600">• {step}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))
              ) : type === "contraindications" ? (
                suggestions.map((warning, idx) => (
                  <div key={idx} className={`rounded-lg border p-4 ${
                    warning.severity === "critical" ? "bg-red-50 border-red-300" :
                    warning.severity === "moderate" ? "bg-yellow-50 border-yellow-300" :
                    "bg-blue-50 border-blue-300"
                  }`}>
                    <div className="flex items-start gap-3">
                      <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                        warning.severity === "critical" ? "text-red-600" :
                        warning.severity === "moderate" ? "text-yellow-600" :
                        "text-blue-600"
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-slate-900 text-sm">{warning.medication}</h4>
                          <Badge className={`text-xs ${
                            warning.severity === "critical" ? "bg-red-200 text-red-900" :
                            warning.severity === "moderate" ? "bg-yellow-200 text-yellow-900" :
                            "bg-blue-200 text-blue-900"
                          }`}>
                            {warning.severity}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {warning.type.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-700 mb-2">{warning.warning}</p>
                        <div className="bg-white rounded p-2 border border-slate-200">
                          <p className="text-xs font-semibold text-slate-700 mb-1">Recommendation:</p>
                          <p className="text-xs text-slate-600">{warning.recommendation}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : type === "treatment_pathways" ? (
                suggestions.map((pathway, idx) => (
                  <div key={idx} className="bg-white rounded-lg border border-slate-200 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold text-slate-900 text-sm">{pathway.diagnosis}</h4>
                      <Button
                        size="sm"
                        onClick={() => {
                          const pathwayText = `
TREATMENT PATHWAY: ${pathway.diagnosis}

First-Line Treatment:
${pathway.first_line_treatment?.map(t => `• ${t}`).join('\n')}

Monitoring:
${pathway.monitoring?.map(m => `• ${m}`).join('\n')}

Follow-up: ${pathway.follow_up}

Patient Education:
${pathway.education_priorities?.map(e => `• ${e}`).join('\n')}

Escalation Criteria:
${pathway.escalation_criteria?.map(c => `• ${c}`).join('\n')}
`;
                          onAddToNote?.(pathwayText, "treatment_plan");
                          toast.success("Treatment pathway added to plan");
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add
                      </Button>
                    </div>

                    {pathway.first_line_treatment?.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-semibold text-emerald-700 mb-1">First-Line Treatment:</p>
                        <ul className="space-y-1">
                          {pathway.first_line_treatment.map((treatment, i) => (
                            <li key={i} className="text-xs text-slate-600">• {treatment}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {pathway.monitoring?.length > 0 && (
                      <div className="mb-3 bg-blue-50 rounded p-2 border border-blue-200">
                        <p className="text-xs font-semibold text-blue-900 mb-1">Monitoring:</p>
                        <ul className="space-y-1">
                          {pathway.monitoring.map((item, i) => (
                            <li key={i} className="text-xs text-blue-700">• {item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {pathway.follow_up && (
                      <div className="mb-3">
                        <p className="text-xs font-semibold text-slate-700">Follow-up:</p>
                        <p className="text-xs text-slate-600">{pathway.follow_up}</p>
                      </div>
                    )}

                    {pathway.escalation_criteria?.length > 0 && (
                      <div className="bg-yellow-50 rounded p-2 border border-yellow-200">
                        <p className="text-xs font-semibold text-yellow-900 mb-1">When to Escalate:</p>
                        <ul className="space-y-1">
                          {pathway.escalation_criteria.map((criteria, i) => (
                            <li key={i} className="text-xs text-yellow-700">⚠️ {criteria}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}