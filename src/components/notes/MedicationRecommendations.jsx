import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Plus, X, Sparkles, RefreshCw, ChevronDown, ChevronUp, AlertCircle, Activity, Stethoscope } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const SETTING_TABS = [
  { id: "all", label: "All", icon: Sparkles },
  { id: "outpatient", label: "Outpatient", icon: Stethoscope },
  { id: "er", label: "ER / Acute", icon: Activity },
];

export default function MedicationRecommendations({ note, onAddMedications }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMeds, setSelectedMeds] = useState(new Set());
  const [expanded, setExpanded] = useState(false);
  const [settingFilter, setSettingFilter] = useState("all");
  const [expandedCards, setExpandedCards] = useState(new Set());

  const generateRecommendations = async () => {
    if (!note?.chief_complaint && !note?.assessment && !note?.diagnoses?.length) {
      toast.error("Please fill in Chief Complaint, Assessment, or Diagnoses first");
      return;
    }

    setLoading(true);
    setRecommendations([]);
    setSelectedMeds(new Set());
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a clinical pharmacotherapy expert. Based on the following clinical presentation, generate comprehensive medication recommendations for BOTH outpatient AND emergency/acute settings.

CLINICAL INFORMATION:
Chief Complaint: ${note.chief_complaint || "N/A"}
Diagnoses: ${Array.isArray(note.diagnoses) ? note.diagnoses.join(", ") : "N/A"}
Assessment: ${note.assessment || "N/A"}
Medical History: ${note.medical_history || "N/A"}
Current Medications: ${Array.isArray(note.medications) ? note.medications.join(", ") : "None listed"}
Allergies: ${Array.isArray(note.allergies) ? note.allergies.join(", ") : (note.allergies || "None listed")}
Vital Signs: ${note.vital_signs ? JSON.stringify(note.vital_signs) : "N/A"}
Plan: ${note.plan || "N/A"}

TASK: Generate 6-12 evidence-based medication recommendations. For each, clearly indicate whether it is for OUTPATIENT (chronic management, discharge) or ER/ACUTE (immediate/in-hospital) use. Include:
1. Medication name (generic preferred)
2. Setting: "outpatient" or "er"
3. Category (e.g., "First-Line", "Alternative", "Adjunct", "Acute Rescue", "Bridge Therapy")
4. Recommended dosing with route and frequency
5. Clinical rationale tied to the patient's presentation
6. Key monitoring parameters
7. Contraindications / cautions specific to this patient
8. Priority: "high", "medium", or "low"

Cover first-line, alternative, and adjunct agents where appropriate.`,
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
                  setting: { type: "string", enum: ["outpatient", "er"] },
                  category: { type: "string" },
                  dosing: { type: "string" },
                  rationale: { type: "string" },
                  monitoring: { type: "string" },
                  contraindications: { type: "string" },
                  priority: { type: "string", enum: ["high", "medium", "low"] }
                }
              }
            },
            clinical_note: { type: "string" }
          }
        }
      });

      setRecommendations(result.medications || []);
      setExpanded(true);
      toast.success(`${result.medications?.length || 0} medication recommendations generated`);
    } catch (error) {
      console.error("Failed to generate recommendations:", error);
      toast.error("Failed to generate medication recommendations");
    } finally {
      setLoading(false);
    }
  };

  const toggleMedication = (idx) => {
    const next = new Set(selectedMeds);
    next.has(idx) ? next.delete(idx) : next.add(idx);
    setSelectedMeds(next);
  };

  const toggleCard = (idx) => {
    const next = new Set(expandedCards);
    next.has(idx) ? next.delete(idx) : next.add(idx);
    setExpandedCards(next);
  };

  const handleAddSelected = () => {
    const arr = Array.from(selectedMeds).map(idx => {
      const med = recommendations[idx];
      return `${med.name} ${med.dosing} [${med.setting === "er" ? "ER/Acute" : "Outpatient"}]`;
    });
    if (arr.length === 0) { toast.error("Select at least one medication"); return; }
    onAddMedications(arr);
    setSelectedMeds(new Set());
    toast.success(`Added ${arr.length} medication(s) to note`);
  };

  const filtered = recommendations.filter(med => {
    const matchesSearch = med.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSetting = settingFilter === "all" || med.setting === settingFilter;
    return matchesSearch && matchesSetting;
  });

  const priorityColors = { high: "bg-red-100 text-red-700 border-red-200", medium: "bg-amber-100 text-amber-700 border-amber-200", low: "bg-slate-100 text-slate-600 border-slate-200" };
  const settingColors = { er: "bg-rose-100 text-rose-700 border-rose-200", outpatient: "bg-blue-100 text-blue-700 border-blue-200" };
  const categoryColors = { "First-Line": "bg-emerald-100 text-emerald-700", "Alternative": "bg-purple-100 text-purple-700", "Adjunct": "bg-cyan-100 text-cyan-700", "Acute Rescue": "bg-red-100 text-red-700", "Bridge Therapy": "bg-orange-100 text-orange-700" };

  const erCount = recommendations.filter(m => m.setting === "er").length;
  const outpatientCount = recommendations.filter(m => m.setting === "outpatient").length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h4 className="font-semibold text-slate-900">AI Medication Recommendations</h4>
          {recommendations.length > 0 && (
            <div className="flex gap-1.5 ml-1">
              {erCount > 0 && <Badge className="bg-rose-100 text-rose-700 border border-rose-200 text-xs">{erCount} ER</Badge>}
              {outpatientCount > 0 && <Badge className="bg-blue-100 text-blue-700 border border-blue-200 text-xs">{outpatientCount} Outpatient</Badge>}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {recommendations.length > 0 && (
            <>
              <Button size="sm" variant="outline" onClick={generateRecommendations} disabled={loading} className="gap-1.5 text-xs">
                <RefreshCw className="w-3 h-3" /> Regenerate
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setExpanded(v => !v)} className="text-slate-500 text-xs">
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Generate Button */}
      {recommendations.length === 0 && (
        <Button onClick={generateRecommendations} disabled={loading} className="w-full gap-2 bg-blue-600 hover:bg-blue-700 py-5 text-sm">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating recommendations...</> : <><Sparkles className="w-4 h-4" /> Generate Medication Recommendations</>}
        </Button>
      )}

      {/* Loading State */}
      {loading && recommendations.length === 0 && (
        <div className="flex items-center justify-center py-10 gap-3 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
          <span className="text-sm">Analyzing clinical data and generating recommendations...</span>
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {expanded && recommendations.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
            {/* Setting Filter Tabs */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
              {SETTING_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSettingFilter(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${settingFilter === tab.id ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                  {tab.id === "er" && erCount > 0 && <span className="bg-rose-100 text-rose-700 rounded-full px-1.5 text-xs">{erCount}</span>}
                  {tab.id === "outpatient" && outpatientCount > 0 && <span className="bg-blue-100 text-blue-700 rounded-full px-1.5 text-xs">{outpatientCount}</span>}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Search medications..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 text-sm" />
            </div>

            {/* Medication Cards */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {filtered.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No medications match your filter</p>
              ) : (
                filtered.map((med) => {
                  const originalIdx = recommendations.indexOf(med);
                  const isSelected = selectedMeds.has(originalIdx);
                  const isCardExpanded = expandedCards.has(originalIdx);

                  return (
                    <div
                      key={originalIdx}
                      className={`rounded-xl border-2 transition-all ${isSelected ? "border-blue-400 bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300"}`}
                    >
                      <div className="flex items-start gap-3 p-3 cursor-pointer" onClick={() => toggleMedication(originalIdx)}>
                        {/* Checkbox */}
                        <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? "bg-blue-500 border-blue-500" : "border-slate-300"}`}>
                          {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            <span className="font-semibold text-slate-900 text-sm">{med.name}</span>
                            <Badge className={`text-xs border ${settingColors[med.setting] || "bg-slate-100 text-slate-600"}`}>
                              {med.setting === "er" ? "ER / Acute" : "Outpatient"}
                            </Badge>
                            {med.category && (
                              <Badge className={`text-xs ${categoryColors[med.category] || "bg-slate-100 text-slate-600"}`}>{med.category}</Badge>
                            )}
                            {med.priority && (
                              <Badge className={`text-xs border ${priorityColors[med.priority]}`}>{med.priority} priority</Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-600"><span className="font-medium">Dose:</span> {med.dosing}</p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleCard(originalIdx); }}
                          className="text-slate-400 hover:text-slate-600 p-1 flex-shrink-0"
                        >
                          {isCardExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Expanded Details */}
                      <AnimatePresence>
                        {isCardExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-3 pb-3 pt-1 border-t border-slate-100 space-y-2 ml-8">
                              {med.rationale && (
                                <div>
                                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-0.5">Rationale</p>
                                  <p className="text-xs text-slate-700">{med.rationale}</p>
                                </div>
                              )}
                              {med.monitoring && (
                                <div>
                                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-0.5">Monitoring</p>
                                  <p className="text-xs text-slate-700">{med.monitoring}</p>
                                </div>
                              )}
                              {med.contraindications && (
                                <div className="bg-red-50 rounded-lg p-2 border border-red-100">
                                  <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-0.5 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> Cautions / Contraindications
                                  </p>
                                  <p className="text-xs text-red-700">{med.contraindications}</p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              )}
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-2 pt-3 border-t border-slate-200">
              <Button onClick={handleAddSelected} disabled={selectedMeds.size === 0} className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4" /> Add Selected to Note ({selectedMeds.size})
              </Button>
              {selectedMeds.size > 0 && (
                <Button onClick={() => setSelectedMeds(new Set())} variant="outline" size="sm" className="gap-1.5">
                  <X className="w-4 h-4" /> Clear
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}