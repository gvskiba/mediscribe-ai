import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import {
  Activity,
  Heart,
  Pill,
  AlertCircle,
  FileText,
  TrendingUp,
  Loader2,
  Calendar,
  Clock,
  Sparkles,
  Microscope,
  Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { toast } from "sonner";

export default function PatientDashboard() {
  const [aiInsights, setAiInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  // Fetch most recent clinical notes
  const { data: notes = [], isLoading: notesLoading } = useQuery({
    queryKey: ["patientDashboardNotes"],
    queryFn: async () => {
      const allNotes = await base44.entities.ClinicalNote.list();
      return allNotes.sort((a, b) => 
        new Date(b.created_date) - new Date(a.created_date)
      );
    },
  });

  const latestNote = notes[0];

  // Generate AI insights whenever latest note changes
  useEffect(() => {
    if (latestNote && !aiInsights && !loadingInsights) {
      generateAiInsights();
    }
  }, [latestNote?.id]);

  const generateAiInsights = async () => {
    if (!latestNote) return;
    setLoadingInsights(true);

    try {
      const riskSummary = `
PATIENT: ${latestNote.patient_name}
AGE: ${latestNote.patient_age || "Unknown"}

VITAL SIGNS:
${latestNote.vital_signs ? Object.entries(latestNote.vital_signs)
  .filter(([_, v]) => v && v.value)
  .map(([k, v]) => `- ${k}: ${v.value} ${v.unit || ""}`)
  .join("\n") : "Not recorded"}

DIAGNOSES:
${latestNote.diagnoses?.join(", ") || "None"}

MEDICATIONS:
${latestNote.medications?.join(", ") || "None"}

ASSESSMENT:
${latestNote.assessment || "None"}

RECENT FINDINGS:
${latestNote.review_of_systems ? latestNote.review_of_systems.substring(0, 200) : "None"}
`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this patient data and provide a concise risk assessment. Identify:
1. Any abnormal vital signs requiring attention
2. Potential drug interactions or contraindications
3. High-risk diagnoses or conditions
4. Urgent items requiring immediate follow-up
5. Overall risk level (low/moderate/high)

${riskSummary}

Be specific and actionable. Focus only on genuine clinical concerns.`,
        response_json_schema: {
          type: "object",
          properties: {
            risk_level: { 
              type: "string", 
              enum: ["low", "moderate", "high"],
              description: "Overall patient risk level"
            },
            abnormal_vitals: { 
              type: "array", 
              items: { type: "string" },
              description: "List of abnormal vital findings"
            },
            drug_concerns: { 
              type: "array", 
              items: { type: "string" },
              description: "Medication interactions or concerns"
            },
            high_risk_diagnoses: { 
              type: "array", 
              items: { type: "string" },
              description: "Diagnoses requiring close monitoring"
            },
            urgent_actions: { 
              type: "array", 
              items: { type: "string" },
              description: "Urgent follow-up items"
            },
            summary: { 
              type: "string",
              description: "Brief clinical summary"
            }
          },
        },
      });

      setAiInsights(result);
    } catch (error) {
      console.error("Failed to generate insights:", error);
      toast.error("Failed to generate AI insights");
    } finally {
      setLoadingInsights(false);
    }
  };

  if (notesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!latestNote) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12 text-center">
        <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">No Patient Data</h2>
        <p className="text-slate-600 mb-6">Create a clinical note to see patient dashboard insights</p>
        <Link to={createPageUrl("NotesLibrary")}>
          <Button className="bg-blue-600 hover:bg-blue-700">Go to Notes</Button>
        </Link>
      </div>
    );
  }

  const getVitalStatus = (key, value, unit) => {
    if (!value) return { status: "unknown", color: "bg-slate-100" };
    
    const ranges = {
      temperature: { normal: [97, 99], unit: "°F" },
      heart_rate: { normal: [60, 100], unit: "bpm" },
      blood_pressure: { systolic: [90, 120], diastolic: [60, 80] },
      respiratory_rate: { normal: [12, 20], unit: "breaths/min" },
      oxygen_saturation: { normal: [95, 100], unit: "%" },
    };

    if (key === "blood_pressure" && value.systolic && value.diastolic) {
      if (value.systolic >= 140 || value.diastolic >= 90) return { status: "high", color: "bg-red-100" };
      if (value.systolic >= 120 || value.diastolic >= 80) return { status: "elevated", color: "bg-yellow-100" };
      return { status: "normal", color: "bg-green-100" };
    }

    const range = ranges[key]?.normal;
    if (!range) return { status: "unknown", color: "bg-slate-100" };
    if (value >= range[0] && value <= range[1]) return { status: "normal", color: "bg-green-100" };
    return { status: "abnormal", color: "bg-red-100" };
  };

  const getRiskColor = (level) => {
    switch (level) {
      case "high":
        return "bg-red-50 border-red-300";
      case "moderate":
        return "bg-yellow-50 border-yellow-300";
      default:
        return "bg-green-50 border-green-300";
    }
  };

  const getRiskBadgeColor = (level) => {
    switch (level) {
      case "high":
        return "bg-red-600 text-white";
      case "moderate":
        return "bg-yellow-600 text-white";
      default:
        return "bg-green-600 text-white";
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-20">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{latestNote.patient_name}</h1>
            <div className="flex gap-4 mt-1 text-xs text-slate-600">
              {latestNote.patient_id && <span>MRN: {latestNote.patient_id}</span>}
              {latestNote.patient_age && <span>Age: {latestNote.patient_age}</span>}
              {latestNote.date_of_visit && (
                <span>{format(new Date(latestNote.date_of_visit), "MMM d, yyyy")}</span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Link to={createPageUrl(`PatientHistory?patient=${encodeURIComponent(latestNote.patient_name)}`)}>
              <Button size="sm" variant="outline" className="gap-1">
                <Calendar className="w-4 h-4" /> History
              </Button>
            </Link>
            <Link to={createPageUrl(`NoteDetail?id=${latestNote.id}`)}>
              <Button size="sm" className="gap-1">
                <FileText className="w-4 h-4" /> View Note
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white">
            <h2 className="text-lg font-bold">Clinical Overview</h2>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: Vital Signs & Assessment */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600" /> Vital Signs
                </h3>
                {latestNote.vital_signs && Object.keys(latestNote.vital_signs).length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(latestNote.vital_signs)
                      .filter(([_, v]) => v && v.value)
                      .map(([key, vital]) => {
                        const vitalStatus = getVitalStatus(key, vital.value);
                        const displayKey = key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                        return (
                          <div key={key} className={`rounded p-2 ${vitalStatus.color} border ${
                            vitalStatus.status === "normal" ? "border-green-300" :
                            vitalStatus.status === "abnormal" ? "border-red-300" : "border-yellow-300"
                          }`}>
                            <p className="text-xs font-semibold text-slate-600">{displayKey}</p>
                            <p className="text-sm font-bold text-slate-900 mt-0.5">
                              {key === "blood_pressure" && vital.systolic
                                ? `${vital.systolic}/${vital.diastolic}`
                                : vital.value}
                            </p>
                            <p className="text-xs text-slate-500">{vital.unit || ""}</p>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <p className="text-slate-500 text-xs">No vital signs</p>
                )}
              </div>

              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <h4 className="text-xs font-bold text-blue-900 mb-1">Summary</h4>
                <p className="text-xs text-blue-800 leading-relaxed">
                  {latestNote.summary || "No summary available"}
                </p>
              </div>
            </div>

            {/* Column 2: Medications & Lab */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Pill className="w-4 h-4 text-blue-600" /> Medications
                </h3>
                {latestNote.medications && latestNote.medications.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {latestNote.medications.slice(0, 4).map((med, idx) => (
                      <div key={idx} className="text-xs bg-blue-50 border border-blue-200 rounded p-2">
                        <p className="text-slate-700 font-medium">{med}</p>
                      </div>
                    ))}
                    {latestNote.medications.length > 4 && (
                      <p className="text-xs text-slate-500">+{latestNote.medications.length - 4} more</p>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-500 text-xs">No medications</p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Microscope className="w-4 h-4 text-red-600" /> Lab Results
                </h3>
                {latestNote.lab_findings && latestNote.lab_findings.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {latestNote.lab_findings.slice(0, 4).map((lab, idx) => (
                      <div key={idx} className="text-xs bg-red-50 border border-red-200 rounded p-2">
                        <p className="font-semibold text-slate-900">{lab.test_name}</p>
                        <div className="flex justify-between items-center gap-1 mt-1">
                          <span className="text-slate-700">{lab.result} {lab.unit || ""}</span>
                          {lab.status && (
                            <Badge className={`text-xs ${
                              lab.status === "critical" ? "bg-red-600 text-white" :
                              lab.status === "abnormal" ? "bg-yellow-600 text-white" :
                              "bg-green-600 text-white"
                            }`}>
                              {lab.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                    {latestNote.lab_findings.length > 4 && (
                      <p className="text-xs text-slate-500">+{latestNote.lab_findings.length - 4} more</p>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-500 text-xs">No lab findings</p>
                )}
              </div>
            </div>

            {/* Column 3: Imaging, Diagnoses & Risk */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Radio className="w-4 h-4 text-cyan-600" /> Imaging
                </h3>
                {latestNote.imaging_findings && latestNote.imaging_findings.length > 0 ? (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {latestNote.imaging_findings.slice(0, 2).map((imaging, idx) => (
                      <div key={idx} className="text-xs bg-cyan-50 border border-cyan-200 rounded p-2">
                        <p className="font-semibold text-slate-900">{imaging.study_type}</p>
                        <p className="text-slate-600">{imaging.location}</p>
                      </div>
                    ))}
                    {latestNote.imaging_findings.length > 2 && (
                      <p className="text-xs text-slate-500">+{latestNote.imaging_findings.length - 2} more</p>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-500 text-xs">No imaging</p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-600" /> Diagnoses
                </h3>
                {latestNote.diagnoses && latestNote.diagnoses.length > 0 ? (
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                    {latestNote.diagnoses.slice(0, 4).map((diag, idx) => (
                      <div key={idx} className="text-xs bg-purple-100 border border-purple-300 rounded-full px-2 py-1 text-slate-800">
                        {diag.length > 20 ? diag.substring(0, 17) + "..." : diag}
                      </div>
                    ))}
                    {latestNote.diagnoses.length > 4 && (
                      <span className="text-xs text-slate-500">+{latestNote.diagnoses.length - 4}</span>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-500 text-xs">No diagnoses</p>
                )}
              </div>

              <div className={`rounded-lg p-3 border ${aiInsights?.risk_level === "high" ? "bg-red-50 border-red-300" : aiInsights?.risk_level === "moderate" ? "bg-yellow-50 border-yellow-300" : "bg-green-50 border-green-300"}`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-900">Risk Assessment</h4>
                  <Button
                    size="sm"
                    onClick={generateAiInsights}
                    disabled={loadingInsights}
                    variant="ghost"
                    className="h-5 w-5 p-0"
                  >
                    {loadingInsights ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  </Button>
                </div>
                {loadingInsights && !aiInsights ? (
                  <Loader2 className="w-3 h-3 animate-spin text-slate-500" />
                ) : aiInsights ? (
                  <div className="space-y-2">
                    <Badge className={getRiskBadgeColor(aiInsights.risk_level)} style={{ fontSize: "10px" }}>
                      {aiInsights.risk_level.toUpperCase()}
                    </Badge>
                    {aiInsights.urgent_actions?.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-slate-700">Actions:</p>
                        <ul className="space-y-0.5">
                          {aiInsights.urgent_actions.slice(0, 1).map((action, idx) => (
                            <li key={idx} className="text-xs text-slate-600">• {action.substring(0, 40)}...</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-600">Click to analyze</p>
                )}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}