import React from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Brain, Beaker, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

export default function QuickAIAnalysisTools({ note }) {
  const [keyFindings, setKeyFindings] = React.useState(null);
  const [drugInteractions, setDrugInteractions] = React.useState(null);
  const [criticalFlags, setCriticalFlags] = React.useState(null);
  const [loadingFindings, setLoadingFindings] = React.useState(false);
  const [loadingInteractions, setLoadingInteractions] = React.useState(false);
  const [loadingFlags, setLoadingFlags] = React.useState(false);

  const summarizeKeyFindings = async () => {
    if (!note.history_of_present_illness && !note.review_of_systems) {
      toast.error("Add HPI or ROS to summarize findings");
      return;
    }

    setLoadingFindings(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on the following clinical information, summarize the key findings that are most clinically significant:

History of Present Illness: ${note.history_of_present_illness || "Not documented"}

Review of Systems: ${note.review_of_systems ? (typeof note.review_of_systems === "string" ? note.review_of_systems : JSON.stringify(note.review_of_systems)) : "Not documented"}

Provide a concise summary highlighting:
1. Primary symptom complex
2. Associated symptoms of concern
3. Red flags or warning signs
4. Timeline and progression
5. Clinical significance`,
        response_json_schema: {
          type: "object",
          properties: {
            primary_findings: { type: "array", items: { type: "string" } },
            associated_symptoms: { type: "array", items: { type: "string" } },
            red_flags: { type: "array", items: { type: "string" } },
            clinical_significance: { type: "string" },
          },
        },
      });
      setKeyFindings(res);
      toast.success("Key findings summarized");
    } catch (error) {
      console.error("Failed to summarize findings:", error);
      toast.error("Failed to summarize findings");
    } finally {
      setLoadingFindings(false);
    }
  };

  const checkDrugInteractions = async () => {
    if (!note.medications?.length) {
      toast.error("Add medications to check for interactions");
      return;
    }

    setLoadingInteractions(true);
    try {
      const proposedTreatments = note.assessment || note.clinical_impression || "None specified";
      
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a pharmacist specializing in drug interactions. Analyze the following medications and proposed treatments for potential interactions:

Current Medications: ${note.medications.join(", ")}

Proposed Treatments/Assessment: ${proposedTreatments}

For each significant interaction found, identify:
1. Drugs involved
2. Type of interaction (PK/PD)
3. Severity (mild/moderate/severe)
4. Mechanism
5. Clinical recommendation

Return empty arrays if no significant interactions found.`,
        response_json_schema: {
          type: "object",
          properties: {
            interactions_found: { type: "array", items: { type: "string" } },
            severity_levels: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } },
          },
        },
      });
      setDrugInteractions(res);
      toast.success("Drug interactions analyzed");
    } catch (error) {
      console.error("Failed to check interactions:", error);
      toast.error("Failed to check drug interactions");
    } finally {
      setLoadingInteractions(false);
    }
  };

  const flagCriticalValues = async () => {
    const hasLabs = note.lab_findings?.length > 0;
    const hasVitals = note.vital_signs && typeof note.vital_signs === "object";

    if (!hasLabs && !hasVitals) {
      toast.error("Add lab results or vital signs to check critical values");
      return;
    }

    setLoadingFlags(true);
    try {
      let labsInfo = "";
      if (hasLabs) {
        labsInfo = note.lab_findings.map(lab => 
          `${lab.test_name}: ${lab.result} ${lab.unit} (ref: ${lab.reference_range}) - Status: ${lab.status}`
        ).join("\n");
      }

      let vitalsInfo = "";
      if (hasVitals) {
        const vs = note.vital_signs;
        const parts = [];
        if (vs.temperature?.value) parts.push(`Temperature: ${vs.temperature.value}°${vs.temperature.unit || "F"}`);
        if (vs.heart_rate?.value) parts.push(`Heart Rate: ${vs.heart_rate.value} bpm`);
        if (vs.blood_pressure?.systolic) parts.push(`BP: ${vs.blood_pressure.systolic}/${vs.blood_pressure.diastolic} mmHg`);
        if (vs.respiratory_rate?.value) parts.push(`RR: ${vs.respiratory_rate.value} breaths/min`);
        if (vs.oxygen_saturation?.value) parts.push(`O2 Sat: ${vs.oxygen_saturation.value}%`);
        vitalsInfo = parts.join("\n");
      }

      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze the following laboratory and vital sign values. Identify ANY values that are critically abnormal or require immediate clinical attention:

Lab Results:
${labsInfo || "Not provided"}

Vital Signs:
${vitalsInfo || "Not provided"}

For each critical or concerning value, provide:
1. The specific value
2. Why it is concerning
3. Immediate action needed
4. Potential underlying causes
5. Risk level (Critical/High/Moderate)`,
        response_json_schema: {
          type: "object",
          properties: {
            critical_values: { type: "array", items: { type: "string" } },
            concerns: { type: "array", items: { type: "string" } },
            immediate_actions: { type: "array", items: { type: "string" } },
            risk_assessment: { type: "string" },
          },
        },
      });
      setCriticalFlags(res);
      toast.success("Critical values flagged");
    } catch (error) {
      console.error("Failed to flag critical values:", error);
      toast.error("Failed to flag critical values");
    } finally {
      setLoadingFlags(false);
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-4">
      {/* Key Findings Summary */}
      <div className="bg-white rounded-lg border-2 border-blue-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-5 h-5 text-blue-600" />
          <h4 className="font-bold text-sm text-slate-900">Key Findings</h4>
        </div>
        <Button
          onClick={summarizeKeyFindings}
          disabled={loadingFindings}
          size="sm"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2 text-xs"
        >
          {loadingFindings ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          Summarize
        </Button>
        {keyFindings && (
          <div className="mt-3 text-xs space-y-2">
            {keyFindings.red_flags?.length > 0 && (
              <div className="p-2 bg-red-50 rounded border border-red-200">
                <p className="font-semibold text-red-700 mb-1">🚩 Red Flags:</p>
                <ul className="text-red-600 space-y-1">
                  {keyFindings.red_flags.map((flag, i) => <li key={i}>• {flag}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Drug Interactions */}
      <div className="bg-white rounded-lg border-2 border-orange-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Beaker className="w-5 h-5 text-orange-600" />
          <h4 className="font-bold text-sm text-slate-900">Interactions</h4>
        </div>
        <Button
          onClick={checkDrugInteractions}
          disabled={loadingInteractions}
          size="sm"
          className="w-full bg-orange-600 hover:bg-orange-700 text-white gap-2 text-xs"
        >
          {loadingInteractions ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          Check
        </Button>
        {drugInteractions && (
          <div className="mt-3 text-xs space-y-2">
            {drugInteractions.interactions_found?.length > 0 ? (
              <div className="p-2 bg-orange-50 rounded border border-orange-200">
                <p className="font-semibold text-orange-700 mb-1">⚠️ Found:</p>
                <ul className="text-orange-600 space-y-1">
                  {drugInteractions.interactions_found.slice(0, 3).map((int, i) => <li key={i}>• {int}</li>)}
                </ul>
              </div>
            ) : (
              <p className="text-green-600 p-2 bg-green-50 rounded">✓ No major interactions</p>
            )}
          </div>
        )}
      </div>

      {/* Critical Flags */}
      <div className="bg-white rounded-lg border-2 border-red-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <h4 className="font-bold text-sm text-slate-900">Critical Values</h4>
        </div>
        <Button
          onClick={flagCriticalValues}
          disabled={loadingFlags}
          size="sm"
          className="w-full bg-red-600 hover:bg-red-700 text-white gap-2 text-xs"
        >
          {loadingFlags ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          Flag
        </Button>
        {criticalFlags && (
          <div className="mt-3 text-xs space-y-2">
            {criticalFlags.critical_values?.length > 0 && (
              <div className="p-2 bg-red-50 rounded border border-red-200">
                <p className="font-semibold text-red-700 mb-1">🚨 Critical:</p>
                <ul className="text-red-600 space-y-1">
                  {criticalFlags.critical_values.slice(0, 2).map((val, i) => <li key={i}>• {val}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}