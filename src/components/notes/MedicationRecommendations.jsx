import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Plus, X, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function MedicationRecommendations({ note, onAddMedications }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMeds, setSelectedMeds] = useState(new Set());
  const [expanded, setExpanded] = useState(false);

  const generateRecommendations = async () => {
    if (!note?.chief_complaint && !note?.assessment && !note?.diagnoses?.length) {
      toast.error("Please fill in Chief Complaint, Assessment, or Diagnoses to generate recommendations");
      return;
    }

    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a pharmacotherapy expert. Based on the following clinical note, generate first-line medication recommendations for the patient's conditions.

CLINICAL INFORMATION:
Chief Complaint: ${note.chief_complaint || "N/A"}
Diagnoses: ${Array.isArray(note.diagnoses) ? note.diagnoses.join(", ") : "N/A"}
Assessment: ${note.assessment || "N/A"}
Medical History: ${note.medical_history || "N/A"}
Current Medications: ${Array.isArray(note.medications) ? note.medications.join(", ") : "None listed"}
Allergies: ${note.allergies || "None listed"}

TASK: Generate 4-8 first-line medication recommendations appropriate for the diagnoses. For each medication, provide:
1. Medication name
2. Recommended dosing
3. Clinical rationale
4. Key monitoring parameters
5. Contraindications to watch for

Focus on evidence-based, first-line therapies appropriate for primary care or general practice.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            medications: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  dosing: { type: "string" },
                  rationale: { type: "string" },
                  monitoring: { type: "string" },
                  contraindications: { type: "string" }
                }
              }
            }
          }
        }
      });

      setRecommendations(result.medications || []);
      setExpanded(true);
      toast.success("Medication recommendations generated");
    } catch (error) {
      console.error("Failed to generate recommendations:", error);
      toast.error("Failed to generate medication recommendations");
    } finally {
      setLoading(false);
    }
  };

  const toggleMedication = (idx) => {
    const newSelected = new Set(selectedMeds);
    if (newSelected.has(idx)) {
      newSelected.delete(idx);
    } else {
      newSelected.add(idx);
    }
    setSelectedMeds(newSelected);
  };

  const handleAddSelected = () => {
    const selectedMeds_array = Array.from(selectedMeds)
      .map(idx => {
        const med = recommendations[idx];
        return `${med.name} - ${med.dosing} (${med.rationale})`;
      });

    if (selectedMeds_array.length === 0) {
      toast.error("Please select at least one medication");
      return;
    }

    onAddMedications(selectedMeds_array);
    setSelectedMeds(new Set());
    toast.success(`Added ${selectedMeds_array.length} medication(s) to note`);
  };

  const filteredRecs = recommendations.filter(med =>
    med.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg border border-emerald-200 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-600" />
          <h4 className="font-semibold text-slate-900">AI Medication Recommendations</h4>
        </div>
        {recommendations.length > 0 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setExpanded(!expanded)}
            className="text-slate-600 hover:bg-white/50"
          >
            {expanded ? "Collapse" : "Expand"}
          </Button>
        )}
      </div>

      {!expanded && recommendations.length === 0 ? (
        <Button
          onClick={generateRecommendations}
          disabled={loading}
          className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          Generate First-Line Medications
        </Button>
      ) : null}

      {expanded && recommendations.length > 0 && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search medications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>

          {/* Medication List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredRecs.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No medications match your search</p>
            ) : (
              filteredRecs.map((med, idx) => {
                const originalIdx = recommendations.indexOf(med);
                const isSelected = selectedMeds.has(originalIdx);

                return (
                  <div
                    key={originalIdx}
                    className={`bg-white rounded-lg p-3 border-2 cursor-pointer transition-all ${
                      isSelected ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-emerald-300"
                    }`}
                    onClick={() => toggleMedication(originalIdx)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h5 className="font-semibold text-slate-900">{med.name}</h5>
                        <p className="text-sm text-slate-600 mt-1">
                          <span className="font-medium">Dosing:</span> {med.dosing}
                        </p>
                      </div>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        isSelected ? "bg-emerald-500 border-emerald-500" : "border-slate-300"
                      }`}>
                        {isSelected && <span className="text-white text-xs">✓</span>}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div>
                        <p className="text-xs font-semibold text-slate-600 uppercase">Rationale</p>
                        <p className="text-xs text-slate-600">{med.rationale}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-600 uppercase">Monitoring</p>
                        <p className="text-xs text-slate-600">{med.monitoring}</p>
                      </div>
                      {med.contraindications && (
                        <div>
                          <p className="text-xs font-semibold text-red-600 uppercase">Contraindications</p>
                          <p className="text-xs text-red-600">{med.contraindications}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Action Buttons */}
          {filteredRecs.length > 0 && (
            <div className="flex gap-2 pt-3 border-t border-slate-200">
              <Button
                onClick={handleAddSelected}
                disabled={selectedMeds.size === 0}
                className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="w-4 h-4" />
                Add Selected ({selectedMeds.size})
              </Button>
              {selectedMeds.size > 0 && (
                <Button
                  onClick={() => setSelectedMeds(new Set())}
                  variant="outline"
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Clear
                </Button>
              )}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-600 mr-2" />
              <span className="text-sm text-slate-600">Generating recommendations...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}