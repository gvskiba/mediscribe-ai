import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";
import { Sparkles, Copy, Check, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function AIComprehensiveSummary({ note, onApply }) {
  const [generating, setGenerating] = useState(false);
  const [summary, setSummary] = useState(null);
  const [copiedSection, setCopiedSection] = useState(null);

  const generateSummary = async () => {
    setGenerating(true);
    try {
      const prompt = `You are a clinical documentation AI assistant. Generate a comprehensive, structured clinical summary from the following patient encounter data.

RAW CLINICAL NOTE:
${note.raw_note || 'No raw note provided'}

EXISTING STRUCTURED DATA:
- Patient: ${note.patient_name || 'Unknown'}, Age: ${note.patient_age || 'Unknown'}, Gender: ${note.patient_gender || 'Unknown'}
- Chief Complaint: ${note.chief_complaint || 'Not documented'}
- HPI: ${note.history_of_present_illness || 'Not documented'}
- Medical History: ${note.medical_history || 'Not documented'}
- Vital Signs: ${note.vital_signs ? JSON.stringify(note.vital_signs) : 'Not documented'}
- Physical Exam: ${note.physical_exam || 'Not documented'}
- Assessment: ${note.assessment || 'Not documented'}
- Plan: ${note.plan || 'Not documented'}
- Diagnoses: ${note.diagnoses?.join(', ') || 'Not documented'}
- Medications: ${note.medications?.join(', ') || 'Not documented'}

Generate a detailed clinical summary with the following sections:

1. EXECUTIVE SUMMARY (2-3 sentences overview of the encounter)
2. KEY CLINICAL FINDINGS (bullet points of most important findings)
3. DIFFERENTIAL DIAGNOSES (with rationale for each)
4. PRIMARY DIAGNOSES (with ICD-10 codes if applicable)
5. TREATMENT PLAN (detailed, actionable steps)
6. FOLLOW-UP RECOMMENDATIONS
7. RED FLAGS / SAFETY CONCERNS (if any)

Format your response as JSON with these exact keys: executive_summary, key_findings (array), differential_diagnoses (array of objects with diagnosis and rationale), primary_diagnoses (array of objects with diagnosis and icd10), treatment_plan (array), follow_up (array), red_flags (array).`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            executive_summary: { type: "string" },
            key_findings: { 
              type: "array",
              items: { type: "string" }
            },
            differential_diagnoses: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  diagnosis: { type: "string" },
                  rationale: { type: "string" }
                }
              }
            },
            primary_diagnoses: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  diagnosis: { type: "string" },
                  icd10: { type: "string" }
                }
              }
            },
            treatment_plan: {
              type: "array",
              items: { type: "string" }
            },
            follow_up: {
              type: "array",
              items: { type: "string" }
            },
            red_flags: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      setSummary(result);
      toast.success("Comprehensive summary generated");
    } catch (error) {
      console.error("Failed to generate summary:", error);
      toast.error("Failed to generate summary");
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text, section) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
    toast.success(`${section} copied to clipboard`);
  };

  const applyToNote = (field, value) => {
    onApply(field, value);
    toast.success(`Applied to ${field}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            AI Comprehensive Summary
          </h3>
          <p className="text-sm text-slate-600">Generate detailed clinical analysis and treatment plan</p>
        </div>
        <Button
          onClick={generateSummary}
          disabled={generating}
          className="bg-blue-600 hover:bg-blue-700 gap-2"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Summary
            </>
          )}
        </Button>
      </div>

      {summary && (
        <div className="space-y-4">
          {/* Executive Summary */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Executive Summary</span>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(summary.executive_summary, "Executive Summary")}
                    className="h-7 w-7 p-0"
                  >
                    {copiedSection === "Executive Summary" ? (
                      <Check className="w-3 h-3 text-green-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => applyToNote("summary", summary.executive_summary)}
                    className="h-7 px-2 text-xs"
                  >
                    Apply
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700 leading-relaxed">{summary.executive_summary}</p>
            </CardContent>
          </Card>

          {/* Key Findings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Key Clinical Findings</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(summary.key_findings.join('\n• '), "Key Findings")}
                  className="h-7 w-7 p-0"
                >
                  {copiedSection === "Key Findings" ? (
                    <Check className="w-3 h-3 text-green-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {summary.key_findings.map((finding, idx) => (
                  <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>{finding}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Differential Diagnoses */}
          {summary.differential_diagnoses?.length > 0 && (
            <Card className="border-purple-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Differential Diagnoses</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(
                      summary.differential_diagnoses.map(d => `${d.diagnosis}\n  Rationale: ${d.rationale}`).join('\n\n'),
                      "Differential Diagnoses"
                    )}
                    className="h-7 w-7 p-0"
                  >
                    {copiedSection === "Differential Diagnoses" ? (
                      <Check className="w-3 h-3 text-green-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {summary.differential_diagnoses.map((item, idx) => (
                  <div key={idx} className="border-l-2 border-purple-300 pl-3">
                    <p className="font-medium text-slate-900 text-sm">{item.diagnosis}</p>
                    <p className="text-xs text-slate-600 mt-1">{item.rationale}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Primary Diagnoses */}
          {summary.primary_diagnoses?.length > 0 && (
            <Card className="border-emerald-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Primary Diagnoses</span>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(
                        summary.primary_diagnoses.map(d => `${d.diagnosis} (${d.icd10})`).join('\n'),
                        "Primary Diagnoses"
                      )}
                      className="h-7 w-7 p-0"
                    >
                      {copiedSection === "Primary Diagnoses" ? (
                        <Check className="w-3 h-3 text-green-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => applyToNote("diagnoses", summary.primary_diagnoses.map(d => d.diagnosis))}
                      className="h-7 px-2 text-xs"
                    >
                      Apply
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {summary.primary_diagnoses.map((item, idx) => (
                  <div key={idx} className="flex items-start justify-between bg-emerald-50 p-2 rounded-lg">
                    <span className="text-sm text-slate-900">{item.diagnosis}</span>
                    <span className="text-xs font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      {item.icd10}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Treatment Plan */}
          <Card className="border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Treatment Plan</span>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(summary.treatment_plan.map((t, i) => `${i + 1}. ${t}`).join('\n'), "Treatment Plan")}
                    className="h-7 w-7 p-0"
                  >
                    {copiedSection === "Treatment Plan" ? (
                      <Check className="w-3 h-3 text-green-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => applyToNote("plan", summary.treatment_plan.join('\n'))}
                    className="h-7 px-2 text-xs"
                  >
                    Apply
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2">
                {summary.treatment_plan.map((step, idx) => (
                  <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                    <span className="font-semibold text-blue-600 min-w-[20px]">{idx + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {/* Follow-up Recommendations */}
          {summary.follow_up?.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Follow-up Recommendations</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(summary.follow_up.join('\n• '), "Follow-up")}
                    className="h-7 w-7 p-0"
                  >
                    {copiedSection === "Follow-up" ? (
                      <Check className="w-3 h-3 text-green-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {summary.follow_up.map((item, idx) => (
                    <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Red Flags */}
          {summary.red_flags?.length > 0 && (
            <Card className="border-red-200 bg-red-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-red-900">
                  <AlertCircle className="w-4 h-4" />
                  Red Flags / Safety Concerns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {summary.red_flags.map((flag, idx) => (
                    <li key={idx} className="text-sm text-red-800 flex items-start gap-2">
                      <span className="text-red-600 mt-1">⚠</span>
                      <span>{flag}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}