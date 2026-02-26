import React from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Brain, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import MDMSectionRenderer from "./MDMSectionRenderer";

export default function AIAnalysisGenerator({ 
  note, 
  noteId,
  userSettings,
  onSectionAdd 
}) {
  const [aiAnalysis, setAiAnalysis] = React.useState(null);
  const [aiRanking, setAiRanking] = React.useState(null);
  const [loadingAI, setLoadingAI] = React.useState(false);
  const [loadingRank, setLoadingRank] = React.useState(false);
  const [editingSection, setEditingSection] = React.useState(null);
  const [editedContent, setEditedContent] = React.useState({});

  const generateAIMDMAnalysis = async () => {
    if (!note.chief_complaint && !note.history_of_present_illness && !note.assessment && !note.diagnoses?.length) {
      toast.error("Add chief complaint, HPI, assessment, or diagnoses first");
      return;
    }

    setLoadingAI(true);
    try {
      let vitalSummary = "";
      if (note.vital_signs && typeof note.vital_signs === "object") {
        const vs = note.vital_signs;
        const parts = [];
        if (vs.temperature?.value) parts.push(`Temp: ${vs.temperature.value}°${vs.temperature.unit || "F"}`);
        if (vs.heart_rate?.value) parts.push(`HR: ${vs.heart_rate.value} bpm`);
        if (vs.blood_pressure?.systolic) parts.push(`BP: ${vs.blood_pressure.systolic}/${vs.blood_pressure.diastolic}`);
        if (vs.respiratory_rate?.value) parts.push(`RR: ${vs.respiratory_rate.value}`);
        if (vs.oxygen_saturation?.value) parts.push(`O2: ${vs.oxygen_saturation.value}%`);
        vitalSummary = parts.join(", ");
      }

      const context = [
        note.chief_complaint && `Chief Complaint: ${note.chief_complaint}`,
        note.history_of_present_illness && `HPI: ${note.history_of_present_illness}`,
        note.assessment && `Assessment: ${note.assessment}`,
        note.diagnoses?.length && `Diagnoses: ${note.diagnoses.join(", ")}`,
        vitalSummary && `Vital Signs: ${vitalSummary}`,
        note.review_of_systems && `ROS: ${typeof note.review_of_systems === "string" ? note.review_of_systems : JSON.stringify(note.review_of_systems)}`,
        note.physical_exam && `Physical Exam: ${note.physical_exam}`,
      ].filter(Boolean).join("\n\n");

      const specialty = userSettings?.clinical_settings?.medical_specialty?.replace(/_/g, ' ').toUpperCase() || 'GENERAL MEDICINE';
      
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert clinician specializing in ${specialty}. Provide a comprehensive Medical Decision Making (MDM) analysis with detailed clinical reasoning based on ${specialty} guidelines and standards of care. Return each section as an array of bullet points.

${context}

IMPORTANT: Base all clinical decisions, diagnostic recommendations, and treatment approaches on ${specialty} guidelines, protocols, and best practices.

Return:
1. Problem Summary - Array of key clinical synthesis points
2. Differential Diagnosis Reasoning - Array of differentials with reasoning (ranked by ${specialty} likelihood)
3. Imaging/Labs Rationale - Array of tests and their justifications (using ${specialty} standards)
4. Treatment Reasoning - Array of treatment plans/rationale (following ${specialty} protocols)
5. Risk Assessment - Array of identified risks (with ${specialty} risk stratification)
6. Follow-up Strategy - Array of follow-up items with timing (per ${specialty} standards)`,
        response_json_schema: {
          type: "object",
          properties: {
            problem_summary: { type: "array", items: { type: "string" } },
            differential_reasoning: { type: "array", items: { type: "string" } },
            imaging_labs_rationale: { type: "array", items: { type: "string" } },
            treatment_reasoning: { type: "array", items: { type: "string" } },
            risk_assessment: { type: "array", items: { type: "string" } },
            follow_up_strategy: { type: "array", items: { type: "string" } },
          },
        },
      });

      setAiAnalysis(res);
      toast.success("MDM analysis generated");
      rankByLikelihood(res);
    } catch (error) {
      console.error("Failed to generate MDM analysis:", error);
      toast.error("Failed to generate MDM analysis");
    } finally {
      setLoadingAI(false);
    }
  };

  const rankByLikelihood = async (analysis) => {
    setLoadingRank(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze the following clinical reasoning sections and rank them by likelihood of clinical importance (percentage 0-100%).

  Problem Summary: ${analysis.problem_summary}
  Differential Diagnosis Reasoning: ${analysis.differential_reasoning}
  Imaging/Labs Rationale: ${analysis.imaging_labs_rationale}
  Treatment Reasoning: ${analysis.treatment_reasoning}
  Risk Assessment: ${analysis.risk_assessment}
  Follow-up Strategy: ${analysis.follow_up_strategy}

  Return a JSON with each section and its likelihood percentage (0-100).`,
        response_json_schema: {
          type: "object",
          properties: {
            problem_summary: { type: "number", minimum: 0, maximum: 100 },
            differential_reasoning: { type: "number", minimum: 0, maximum: 100 },
            imaging_labs_rationale: { type: "number", minimum: 0, maximum: 100 },
            treatment_reasoning: { type: "number", minimum: 0, maximum: 100 },
            risk_assessment: { type: "number", minimum: 0, maximum: 100 },
            follow_up_strategy: { type: "number", minimum: 0, maximum: 100 },
          },
        },
      });
      setAiRanking(res);
    } catch (error) {
      console.error("Failed to rank by likelihood:", error);
    } finally {
      setLoadingRank(false);
    }
  };

  const addAIAnalysisSection = async () => {
    if (!aiAnalysis) return;

    const newSection = {
      id: `mdm_${Date.now()}`,
      title: "AI Clinical Reasoning",
      timestamp: new Date().toISOString(),
      content: [
        `Problem Summary:\n${aiAnalysis.problem_summary}`,
        `Differential Diagnosis Reasoning:\n${aiAnalysis.differential_reasoning}`,
        `Imaging/Labs Rationale:\n${aiAnalysis.imaging_labs_rationale}`,
        `Treatment Reasoning:\n${aiAnalysis.treatment_reasoning}`,
        `Risk Assessment:\n${aiAnalysis.risk_assessment}`,
        `Follow-up Strategy:\n${aiAnalysis.follow_up_strategy}`,
      ].join("\n\n"),
    };

    try {
      // Get existing MDM sections and append
      const existingMDM = note.mdm ? (typeof note.mdm === "string" ? JSON.parse(note.mdm) : note.mdm) : [];
      const mdmArray = Array.isArray(existingMDM) ? existingMDM : [];
      const updatedMDM = [...mdmArray, newSection];
      
      await base44.entities.ClinicalNote.update(noteId, { mdm: JSON.stringify(updatedMDM) });
      toast.success("AI analysis added to MDM");
      setAiAnalysis(null);
      setAiRanking(null);
      onSectionAdd?.();
    } catch (error) {
      console.error("Failed to save MDM section:", error);
      toast.error("Failed to save MDM section");
    }
  };

  return (
    <div className="bg-white rounded-xl border-2 border-indigo-300 shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              AI Clinical Reasoning
            </h4>
            <p className="text-indigo-100 text-sm mt-1">Generate comprehensive MDM analysis from your note</p>
          </div>
        </div>
      </div>
      <div className="p-6 space-y-4">
        {!aiAnalysis ? (
          <>
            {!note.chief_complaint && !note.history_of_present_illness && !note.assessment && !note.diagnoses?.length && (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-center">
                Add a chief complaint, HPI, assessment, or diagnoses to generate MDM analysis
              </p>
            )}
            <Button
              onClick={generateAIMDMAnalysis}
              disabled={loadingAI || (!note.chief_complaint && !note.history_of_present_illness && !note.assessment && !note.diagnoses?.length)}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-2 disabled:opacity-50"
            >
              {loadingAI ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generating Analysis...</>
              ) : (
                <><Brain className="w-4 h-4" /> Generate AI MDM Analysis</>
              )}
            </Button>
          </>
        ) : (
          <div className="space-y-3">
            {loadingRank && (
              <div className="text-center py-2">
                <p className="text-xs text-indigo-600 flex items-center justify-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" /> Ranking by likelihood...
                </p>
              </div>
            )}

            {/* Problem Summary */}
            <MDMSectionRenderer
              sectionKey="problem_summary"
              title="Problem Summary"
              content={editedContent.problem_summary || aiAnalysis.problem_summary}
              likelihood={aiRanking?.problem_summary}
              color="indigo"
              isEditing={editingSection === "problem_summary"}
              editValue={editedContent.problem_summary}
              onEditChange={(updated) => setEditedContent({...editedContent, problem_summary: updated})}
              onAdd={async (content) => {
                const text = Array.isArray(content) ? content.join("\n• ") : content;
                const fullMDM = `## Problem Summary\n• ${text}`;
                try {
                  await base44.entities.ClinicalNote.update(noteId, { mdm: fullMDM });
                  toast.success("Added to clinical note");
                } catch (error) {
                  toast.error("Failed to add to note");
                }
              }}
            />

            <div className="grid md:grid-cols-2 gap-3">
              <MDMSectionRenderer
                sectionKey="differential_reasoning"
                title="Differential Diagnosis"
                content={editedContent.differential_reasoning || aiAnalysis.differential_reasoning}
                likelihood={aiRanking?.differential_reasoning}
                color="cyan"
                isEditing={editingSection === "differential_reasoning"}
                editValue={editedContent.differential_reasoning}
                onEditChange={(updated) => setEditedContent({...editedContent, differential_reasoning: updated})}
                onAdd={async (content) => {
                  const text = Array.isArray(content) ? content.join("\n• ") : content;
                  const fullMDM = `## Differential Diagnosis Reasoning\n• ${text}`;
                  try {
                    await base44.entities.ClinicalNote.update(noteId, { mdm: fullMDM });
                    toast.success("Added to clinical note");
                  } catch (error) {
                    toast.error("Failed to add to note");
                  }
                }}
              />

              <MDMSectionRenderer
                sectionKey="imaging_labs_rationale"
                title="Labs/Imaging"
                content={editedContent.imaging_labs_rationale || aiAnalysis.imaging_labs_rationale}
                likelihood={aiRanking?.imaging_labs_rationale}
                color="purple"
                isEditing={editingSection === "imaging_labs_rationale"}
                editValue={editedContent.imaging_labs_rationale}
                onEditChange={(updated) => setEditedContent({...editedContent, imaging_labs_rationale: updated})}
                onAdd={async (content) => {
                  const text = Array.isArray(content) ? content.join("\n• ") : content;
                  const fullMDM = `## Imaging/Labs Rationale\n• ${text}`;
                  try {
                    await base44.entities.ClinicalNote.update(noteId, { mdm: fullMDM });
                    toast.success("Added to clinical note");
                  } catch (error) {
                    toast.error("Failed to add to note");
                  }
                }}
              />

              <MDMSectionRenderer
                sectionKey="treatment_reasoning"
                title="Treatment Reasoning"
                content={editedContent.treatment_reasoning || aiAnalysis.treatment_reasoning}
                likelihood={aiRanking?.treatment_reasoning}
                color="pink"
                isEditing={editingSection === "treatment_reasoning"}
                editValue={editedContent.treatment_reasoning}
                onEditChange={(updated) => setEditedContent({...editedContent, treatment_reasoning: updated})}
                onAdd={async (content) => {
                  const text = Array.isArray(content) ? content.join("\n• ") : content;
                  const fullMDM = `## Treatment Reasoning\n• ${text}`;
                  try {
                    await base44.entities.ClinicalNote.update(noteId, { mdm: fullMDM });
                    toast.success("Added to clinical note");
                  } catch (error) {
                    toast.error("Failed to add to note");
                  }
                }}
              />

              <MDMSectionRenderer
                sectionKey="risk_assessment"
                title="Risk Assessment"
                content={editedContent.risk_assessment || aiAnalysis.risk_assessment}
                likelihood={aiRanking?.risk_assessment}
                color="orange"
                isEditing={editingSection === "risk_assessment"}
                editValue={editedContent.risk_assessment}
                onEditChange={(updated) => setEditedContent({...editedContent, risk_assessment: updated})}
                onAdd={async (content) => {
                  const text = Array.isArray(content) ? content.join("\n• ") : content;
                  const fullMDM = `## Risk Assessment\n• ${text}`;
                  try {
                    await base44.entities.ClinicalNote.update(noteId, { mdm: fullMDM });
                    toast.success("Added to clinical note");
                  } catch (error) {
                    toast.error("Failed to add to note");
                  }
                }}
              />

              <MDMSectionRenderer
                sectionKey="follow_up_strategy"
                title="Follow-up Strategy"
                content={editedContent.follow_up_strategy || aiAnalysis.follow_up_strategy}
                likelihood={aiRanking?.follow_up_strategy}
                color="emerald"
                isEditing={editingSection === "follow_up_strategy"}
                editValue={editedContent.follow_up_strategy}
                onEditChange={(updated) => setEditedContent({...editedContent, follow_up_strategy: updated})}
                onAdd={async (content) => {
                  const text = Array.isArray(content) ? content.join("\n• ") : content;
                  const fullMDM = `## Follow-up Strategy\n• ${text}`;
                  try {
                    await base44.entities.ClinicalNote.update(noteId, { mdm: fullMDM });
                    toast.success("Added to clinical note");
                  } catch (error) {
                    toast.error("Failed to add to note");
                  }
                }}
              />
            </div>

            <Button
              onClick={addAIAnalysisSection}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
            >
              <Plus className="w-4 h-4" /> Add All Sections to MDM
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}