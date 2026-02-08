import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Clock, FileText, Loader2, TrendingUp, AlertCircle, Activity } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { format } from "date-fns";

export default function PreviousEncountersSummary({ 
  patientId, 
  patientName,
  open, 
  onClose,
  onApplyToNote 
}) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [encounters, setEncounters] = useState([]);

  React.useEffect(() => {
    if (open && (patientId || patientName)) {
      loadEncountersSummary();
    }
  }, [open, patientId, patientName]);

  const loadEncountersSummary = async () => {
    setLoading(true);
    try {
      // Fetch all notes for this patient
      const allNotes = await base44.entities.ClinicalNote.list();
      const patientNotes = allNotes.filter(note => 
        (patientId && note.patient_id === patientId) || 
        (patientName && note.patient_name?.toLowerCase() === patientName.toLowerCase())
      ).sort((a, b) => new Date(b.date_of_visit) - new Date(a.date_of_visit));

      setEncounters(patientNotes);

      if (patientNotes.length === 0) {
        setSummary({ message: "No previous encounters found for this patient." });
        return;
      }

      // Generate comprehensive longitudinal summary
      const summaryResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze these ${patientNotes.length} previous clinical encounters and generate a comprehensive longitudinal patient summary:

${patientNotes.map((note, idx) => `
ENCOUNTER ${idx + 1} - ${note.date_of_visit || 'Date unknown'}
Note Type: ${note.note_type || 'Unknown'}
Chief Complaint: ${note.chief_complaint || 'N/A'}
Diagnoses: ${note.diagnoses?.join(', ') || 'N/A'}
Medications: ${note.medications?.join(', ') || 'N/A'}
Assessment: ${note.assessment || 'N/A'}
Plan: ${note.plan || 'N/A'}
${note.raw_note ? `Raw Note: ${note.raw_note.substring(0, 500)}...` : ''}
---`).join('\n')}

Generate a comprehensive longitudinal summary including:
1. CHRONIC CONDITIONS: Active ongoing conditions across encounters
2. MEDICATION HISTORY: Current medications, changes over time, adherence patterns
3. HOSPITAL/ER VISITS: Any hospitalizations or emergency visits
4. DISEASE PROGRESSION: How conditions have evolved (improving, stable, worsening)
5. TREATMENT RESPONSE: Response to interventions and medications
6. KEY LABS/TESTS: Important test results and trends
7. SOCIAL/FUNCTIONAL STATUS: Changes in functional ability, social situation
8. PREVENTIVE CARE: Immunizations, cancer screenings, preventive measures
9. RED FLAGS: Concerning trends, medication non-adherence, frequent visits
10. CARE GAPS: Missing preventive care, overdue follow-ups, unaddressed issues

Be specific with dates, medication names/doses, and quantify trends where possible.`,
        response_json_schema: {
          type: "object",
          properties: {
            chronic_conditions: { type: "array", items: { type: "string" } },
            active_medications: { type: "array", items: { type: "string" } },
            medication_changes: { type: "string" },
            hospitalizations: { type: "array", items: { type: "string" } },
            disease_progression: { type: "string" },
            treatment_response: { type: "string" },
            key_labs_trends: { type: "array", items: { type: "string" } },
            functional_status: { type: "string" },
            preventive_care_status: { type: "array", items: { type: "string" } },
            red_flags: { type: "array", items: { type: "string" } },
            care_gaps: { type: "array", items: { type: "string" } },
            encounter_frequency: { type: "string" },
            total_encounters_analyzed: { type: "number" }
          }
        }
      });

      setSummary(summaryResult);
      toast.success("Encounter summary generated");
    } catch (error) {
      console.error("Failed to generate encounter summary:", error);
      toast.error("Failed to generate summary");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToNote = () => {
    if (summary && onApplyToNote) {
      const summaryText = `LONGITUDINAL PATIENT SUMMARY (${summary.total_encounters_analyzed} encounters analyzed)

CHRONIC CONDITIONS:
${summary.chronic_conditions?.map(c => `• ${c}`).join('\n') || 'None documented'}

ACTIVE MEDICATIONS:
${summary.active_medications?.map(m => `• ${m}`).join('\n') || 'None documented'}

MEDICATION CHANGES:
${summary.medication_changes || 'No significant changes noted'}

HOSPITALIZATIONS/ER VISITS:
${summary.hospitalizations?.map(h => `• ${h}`).join('\n') || 'None documented'}

DISEASE PROGRESSION:
${summary.disease_progression || 'Stable'}

TREATMENT RESPONSE:
${summary.treatment_response || 'Not documented'}

KEY LAB/TEST TRENDS:
${summary.key_labs_trends?.map(t => `• ${t}`).join('\n') || 'No significant trends'}

FUNCTIONAL STATUS:
${summary.functional_status || 'Not documented'}

PREVENTIVE CARE:
${summary.preventive_care_status?.map(p => `• ${p}`).join('\n') || 'Not documented'}

RED FLAGS / CONCERNS:
${summary.red_flags?.map(r => `⚠ ${r}`).join('\n') || 'None identified'}

CARE GAPS:
${summary.care_gaps?.map(g => `• ${g}`).join('\n') || 'None identified'}`;

      onApplyToNote(summaryText);
      toast.success("Summary applied to note");
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Previous Encounters Summary
            {patientName && <span className="text-sm font-normal text-slate-500">- {patientName}</span>}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
              <p className="text-sm text-slate-600">Analyzing previous encounters...</p>
              <p className="text-xs text-slate-400 mt-1">This may take a moment</p>
            </div>
          ) : summary ? (
            <>
              {summary.message ? (
                <div className="text-center py-12 text-slate-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>{summary.message}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Summary Header */}
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-blue-900">Longitudinal Summary</h3>
                      <Badge className="bg-blue-100 text-blue-700">
                        {summary.total_encounters_analyzed} encounters
                      </Badge>
                    </div>
                    <p className="text-sm text-blue-800">
                      Frequency: {summary.encounter_frequency || 'N/A'}
                    </p>
                  </div>

                  {/* Chronic Conditions */}
                  {summary.chronic_conditions && summary.chronic_conditions.length > 0 && (
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                      <h3 className="text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Active Chronic Conditions
                      </h3>
                      <div className="space-y-1">
                        {summary.chronic_conditions.map((condition, idx) => (
                          <div key={idx} className="text-sm text-purple-800 flex items-start gap-2">
                            <span className="text-purple-600 mt-0.5">•</span>
                            <span>{condition}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Active Medications */}
                  {summary.active_medications && summary.active_medications.length > 0 && (
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <h3 className="text-sm font-semibold text-green-900 mb-3">Current Medication Regimen</h3>
                      <div className="space-y-1">
                        {summary.active_medications.map((med, idx) => (
                          <div key={idx} className="text-sm text-green-800">• {med}</div>
                        ))}
                      </div>
                      {summary.medication_changes && (
                        <div className="mt-3 pt-3 border-t border-green-300">
                          <p className="text-xs font-semibold text-green-900 mb-1">Recent Changes:</p>
                          <p className="text-sm text-green-800">{summary.medication_changes}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Disease Progression & Treatment Response */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {summary.disease_progression && (
                      <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                        <h3 className="text-sm font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Disease Progression
                        </h3>
                        <p className="text-sm text-indigo-800">{summary.disease_progression}</p>
                      </div>
                    )}

                    {summary.treatment_response && (
                      <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
                        <h3 className="text-sm font-semibold text-teal-900 mb-2">Treatment Response</h3>
                        <p className="text-sm text-teal-800">{summary.treatment_response}</p>
                      </div>
                    )}
                  </div>

                  {/* Hospitalizations */}
                  {summary.hospitalizations && summary.hospitalizations.length > 0 && (
                    <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                      <h3 className="text-sm font-semibold text-orange-900 mb-3">Hospitalizations & ER Visits</h3>
                      <div className="space-y-1">
                        {summary.hospitalizations.map((hosp, idx) => (
                          <div key={idx} className="text-sm text-orange-800">• {hosp}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Key Labs & Trends */}
                  {summary.key_labs_trends && summary.key_labs_trends.length > 0 && (
                    <div className="bg-cyan-50 rounded-lg p-4 border border-cyan-200">
                      <h3 className="text-sm font-semibold text-cyan-900 mb-3">Key Lab & Test Trends</h3>
                      <div className="space-y-1">
                        {summary.key_labs_trends.map((trend, idx) => (
                          <div key={idx} className="text-sm text-cyan-800">• {trend}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Red Flags */}
                  {summary.red_flags && summary.red_flags.length > 0 && (
                    <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                      <h3 className="text-sm font-semibold text-red-900 mb-3 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Red Flags & Concerns
                      </h3>
                      <div className="space-y-2">
                        {summary.red_flags.map((flag, idx) => (
                          <div key={idx} className="text-sm text-red-800 flex items-start gap-2 bg-red-100 rounded p-2">
                            <span className="text-red-600 flex-shrink-0">⚠</span>
                            <span className="font-medium">{flag}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Care Gaps */}
                  {summary.care_gaps && summary.care_gaps.length > 0 && (
                    <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                      <h3 className="text-sm font-semibold text-amber-900 mb-3">Care Gaps & Recommendations</h3>
                      <div className="space-y-1">
                        {summary.care_gaps.map((gap, idx) => (
                          <div key={idx} className="text-sm text-amber-800">• {gap}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Functional & Preventive Care Status */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {summary.functional_status && (
                      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <h3 className="text-sm font-semibold text-slate-900 mb-2">Functional Status</h3>
                        <p className="text-sm text-slate-700">{summary.functional_status}</p>
                      </div>
                    )}

                    {summary.preventive_care_status && summary.preventive_care_status.length > 0 && (
                      <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                        <h3 className="text-sm font-semibold text-emerald-900 mb-2">Preventive Care</h3>
                        <div className="space-y-1">
                          {summary.preventive_care_status.map((care, idx) => (
                            <div key={idx} className="text-sm text-emerald-800">• {care}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Recent Encounters Timeline */}
                  {encounters.length > 0 && (
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <h3 className="text-sm font-semibold text-slate-900 mb-3">Recent Encounters Timeline</h3>
                      <div className="space-y-2">
                        {encounters.slice(0, 5).map((encounter, idx) => (
                          <div key={idx} className="flex items-start gap-3 text-sm">
                            <div className="w-24 flex-shrink-0 text-slate-500">
                              {encounter.date_of_visit ? format(new Date(encounter.date_of_visit), 'MMM d, yyyy') : 'Unknown'}
                            </div>
                            <div className="flex-1">
                              <span className="font-medium text-slate-900">{encounter.chief_complaint || 'No CC'}</span>
                              {encounter.diagnoses && encounter.diagnoses.length > 0 && (
                                <span className="text-slate-600"> - {encounter.diagnoses[0]}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No summary available</p>
            </div>
          )}
        </div>

        {summary && !summary.message && onApplyToNote && (
          <div className="border-t pt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={handleApplyToNote} className="bg-blue-600 hover:bg-blue-700">
              Apply to Current Note
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}