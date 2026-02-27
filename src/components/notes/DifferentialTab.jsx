import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, Loader2, Plus, AlertCircle, XCircle, ChevronDown, ChevronUp,
  FlaskConical, Scan, BookOpen, CheckCircle2, Stethoscope, ListFilter,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import TabPageLayout from "./TabPageLayout";

// ─── Shared helpers ────────────────────────────────────────────────────────────
function LikelihoodBar({ rank }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <div key={n} className={`w-1.5 h-3 rounded-sm ${n <= rank ? "bg-rose-500" : "bg-slate-200"}`} />
      ))}
    </div>
  );
}

// ─── AI Workup Recommendations ────────────────────────────────────────────────
function WorkupRecommendations({ note, differentials }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const generate = async () => {
    if (!differentials.length) { toast.error("Add differential diagnoses first"); return; }
    setLoading(true);
    setOpen(true);
    setResult(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert clinician. Based on these differential diagnoses to rule out, recommend specific labs and imaging to order.

Patient: CC: ${note.chief_complaint || "N/A"} | HPI: ${note.history_of_present_illness || "N/A"}

Differential Diagnoses to Rule Out:
${differentials.map((d, i) => `${i + 1}. ${d.diagnosis} (ICD-10: ${d.icd10_code || "N/A"}) – Likelihood: ${d.likelihood_rank}/5`).join("\n")}

For each recommendation, explain WHY it rules in or out specific diagnoses on the differential list.`,
        response_json_schema: {
          type: "object",
          properties: {
            labs: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  rationale: { type: "string" },
                  targets_diagnoses: { type: "array", items: { type: "string" } },
                  priority: { type: "string", enum: ["stat", "routine", "send-out"] },
                },
              },
            },
            imaging: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  rationale: { type: "string" },
                  targets_diagnoses: { type: "array", items: { type: "string" } },
                  priority: { type: "string", enum: ["stat", "urgent", "routine"] },
                },
              },
            },
            additional_notes: { type: "string" },
          },
        },
      });
      setResult(res);
    } catch {
      toast.error("Workup generation failed");
    }
    setLoading(false);
  };

  const priorityColor = (p) => ({
    stat: "bg-red-100 text-red-700 border-red-200",
    urgent: "bg-orange-100 text-orange-700 border-orange-200",
    routine: "bg-green-100 text-green-700 border-green-200",
    "send-out": "bg-purple-100 text-purple-700 border-purple-200",
  }[p] || "bg-slate-100 text-slate-700 border-slate-200");

  return (
    <div className="rounded-xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50 overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shadow-sm">
            <FlaskConical className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-indigo-900">AI Workup Recommendations</p>
            <p className="text-xs text-slate-500">Labs & imaging to rule out differential diagnoses</p>
          </div>
        </div>
        <div className="flex gap-2">
          {result && (
            <Button size="sm" variant="outline" onClick={() => setOpen(!open)} className="border-indigo-300 text-indigo-700 gap-1">
              {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {open ? "Hide" : "Show"}
            </Button>
          )}
          <Button size="sm" onClick={generate} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {loading ? "Analyzing…" : result ? "Re-analyze" : "Analyze & Recommend"}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {open && (loading || result) && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <div className="px-4 pb-4 space-y-4">
              {loading && (
                <div className="flex items-center gap-2 text-indigo-600 text-sm py-3">
                  <Loader2 className="w-4 h-4 animate-spin" /> Analyzing differentials and generating workup plan…
                </div>
              )}
              {result && !loading && (
                <div className="space-y-4">
                  {/* Labs */}
                  {result.labs?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <FlaskConical className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm font-semibold text-slate-800">Laboratory Tests</span>
                      </div>
                      <div className="space-y-2">
                        {result.labs.map((lab, i) => (
                          <div key={i} className="bg-white rounded-lg border border-indigo-100 p-3">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-sm font-semibold text-slate-900">{lab.name}</span>
                              {lab.priority && <Badge className={`text-xs border ${priorityColor(lab.priority)}`}>{lab.priority.toUpperCase()}</Badge>}
                            </div>
                            <p className="text-xs text-slate-600 mb-1">{lab.rationale}</p>
                            {lab.targets_diagnoses?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {lab.targets_diagnoses.map((d, j) => (
                                  <span key={j} className="text-xs bg-indigo-50 text-indigo-700 rounded px-1.5 py-0.5 border border-indigo-100">→ {d}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Imaging */}
                  {result.imaging?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Scan className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm font-semibold text-slate-800">Imaging Studies</span>
                      </div>
                      <div className="space-y-2">
                        {result.imaging.map((img, i) => (
                          <div key={i} className="bg-white rounded-lg border border-indigo-100 p-3">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-sm font-semibold text-slate-900">{img.name}</span>
                              {img.priority && <Badge className={`text-xs border ${priorityColor(img.priority)}`}>{img.priority.toUpperCase()}</Badge>}
                            </div>
                            <p className="text-xs text-slate-600 mb-1">{img.rationale}</p>
                            {img.targets_diagnoses?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {img.targets_diagnoses.map((d, j) => (
                                  <span key={j} className="text-xs bg-indigo-50 text-indigo-700 rounded px-1.5 py-0.5 border border-indigo-100">→ {d}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.additional_notes && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                        <span className="text-xs font-semibold text-amber-800">Clinical Notes</span>
                      </div>
                      <p className="text-xs text-slate-700">{result.additional_notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function DifferentialTab({
  note, noteId, queryClient,
  templates, selectedTemplate, setSelectedTemplate,
  isFirstTab, isLastTab, handleBack, handleNext,
}) {
  const differentials = note?.differentials || [];
  const finalDiagnoses = note?.diagnoses || [];

  const [loading, setLoading] = useState(false);
  const [userSettings, setUserSettings] = useState(null);
  const [showInputs, setShowInputs] = useState(false);
  const [symptoms, setSymptoms] = useState("");
  const [patientHistory, setPatientHistory] = useState("");
  const [newDiffDx, setNewDiffDx] = useState("");
  const [addingDiff, setAddingDiff] = useState(false);
  const [newFinalDx, setNewFinalDx] = useState("");
  const [addingFinal, setAddingFinal] = useState(false);

  useEffect(() => {
    base44.auth.me().then((s) => s && setUserSettings(s));
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const updateNote = (patch) => {
    queryClient.setQueryData(["note", noteId], (old) => ({ ...old, ...patch }));
    base44.entities.ClinicalNote.update(noteId, patch);
  };

  // ── Differential (Diagnoses to Rule Out) ─────────────────────────────────────
  const generateDifferentials = async () => {
    if (!note?.chief_complaint && !symptoms.trim()) return;
    setLoading(true);
    try {
      const response = await base44.functions.invoke("generateSpecialtyAwareDifferential", {
        chiefComplaint: note.chief_complaint || "",
        hpi: note.history_of_present_illness || "",
        physicalExam: note.physical_exam || "",
        assessment: note.assessment || "",
        specialty: userSettings?.clinical_settings?.medical_specialty || "internal_medicine",
        symptoms: symptoms.trim() || undefined,
        patientHistory: patientHistory.trim() || undefined,
      });
      if (response.data.differentials) {
        updateNote({ differentials: response.data.differentials });
        toast.success("Differentials generated");
      }
    } catch {
      toast.error("Failed to generate differentials");
    }
    setLoading(false);
  };

  const removeDifferential = (idx) => {
    const updated = differentials.filter((_, i) => i !== idx);
    updateNote({ differentials: updated });
  };

  const addManualDifferential = () => {
    if (!newDiffDx.trim()) return;
    const updated = [...differentials, { diagnosis: newDiffDx.trim(), icd10_code: "", likelihood_rank: 3, clinical_reasoning: "Manually added", red_flags_to_monitor: [] }];
    updateNote({ differentials: updated });
    setNewDiffDx("");
    setAddingDiff(false);
    toast.success("Differential added");
  };

  const addToMDM = () => {
    const lines = differentials.map((d, i) =>
      `${i + 1}. **${d.diagnosis}**${d.icd10_code ? ` (${d.icd10_code})` : ""} – Likelihood: ${d.likelihood_rank}/5\n   ${d.clinical_reasoning}`
    ).join("\n\n");
    const mdmText = `## Differential Diagnoses — To Rule Out\n\n${lines}`;

    // Append to MDM (structured format)
    let existingMdm = { initial: [], final: [] };
    try {
      const parsed = note.mdm ? (typeof note.mdm === "string" ? JSON.parse(note.mdm) : note.mdm) : {};
      if (parsed && !Array.isArray(parsed) && (parsed.initial || parsed.final)) existingMdm = parsed;
    } catch {}

    const newEntry = { id: `mdm_diff_${Date.now()}`, title: "Differential Diagnoses — To Rule Out", content: lines.replace(/\*\*/g, ""), timestamp: new Date().toISOString() };
    existingMdm.initial = [...existingMdm.initial, newEntry];
    updateNote({ mdm: JSON.stringify(existingMdm) });
    toast.success("Differential Dx added to Initial MDM");
  };

  // ── Final Diagnoses ────────────────────────────────────────────────────────
  const addFinalDiagnosis = () => {
    if (!newFinalDx.trim()) return;
    const updated = [...finalDiagnoses, newFinalDx.trim()];
    updateNote({ diagnoses: updated });
    setNewFinalDx("");
    setAddingFinal(false);
    toast.success("Final diagnosis added");
  };

  const removeFinalDiagnosis = (idx) => {
    const updated = finalDiagnoses.filter((_, i) => i !== idx);
    updateNote({ diagnoses: updated });
  };

  const promoteToFinal = async (diff) => {
    // Use AI to get a clean final diagnosis string with ICD-10
    const label = diff.icd10_code ? `${diff.diagnosis} (${diff.icd10_code})` : diff.diagnosis;
    const updated = [...finalDiagnoses, label];
    updateNote({ diagnoses: updated });
    toast.success(`"${diff.diagnosis}" promoted to Final Diagnoses`);
  };

  const canGenerate = !!(note?.chief_complaint || symptoms.trim());

  return (
    <TabPageLayout
      title="Diagnoses"
      subtitle="Differential Dx to rule out & Final Clinical Impression"
      tabId="differential"
      note={note}
      templates={templates}
      selectedTemplate={selectedTemplate}
      setSelectedTemplate={setSelectedTemplate}
      onUpdate={async (field, value) => { updateNote({ [field]: value }); }}
      isFirstTab={isFirstTab} isLastTab={isLastTab} handleBack={handleBack} handleNext={handleNext}
    >
      {/* CC context strip */}
      {note.chief_complaint && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
          <span className="text-xs font-semibold text-blue-700 mr-1">CC</span>
          <span className="text-xs text-slate-700">{note.chief_complaint}</span>
        </div>
      )}

      {/* ── SECTION 1: Differential Diagnoses ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center">
            <ListFilter className="w-4 h-4 text-rose-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Differential Diagnoses</h3>
            <p className="text-xs text-slate-500">Diagnoses to rule out — added to Initial MDM</p>
          </div>
        </div>

        {/* AI Generator */}
        <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-rose-500 shadow-sm">
          <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-sm font-semibold text-slate-800">AI Generator</span>
            <span className="text-xs text-slate-400">· ranked by likelihood with ICD-10 codes</span>
          </div>
          <div className="p-4 space-y-3">
            <button onClick={() => setShowInputs((v) => !v)} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors">
              {showInputs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {showInputs ? "Hide" : "Add"} additional symptoms & history
            </button>
            <AnimatePresence>
              {showInputs && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden space-y-2">
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">Symptoms</label>
                    <textarea value={symptoms} onChange={(e) => setSymptoms(e.target.value)} placeholder="e.g. sharp chest pain, diaphoresis..." rows={2} className="w-full text-xs rounded-lg border border-slate-200 focus:border-rose-300 focus:ring-1 focus:ring-rose-100 focus:outline-none px-3 py-2 resize-none" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">Patient History</label>
                    <textarea value={patientHistory} onChange={(e) => setPatientHistory(e.target.value)} placeholder="e.g. PMH: HTN, DM2..." rows={2} className="w-full text-xs rounded-lg border border-slate-200 focus:border-rose-300 focus:ring-1 focus:ring-rose-100 focus:outline-none px-3 py-2 resize-none" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!canGenerate ? (
              <div className="flex items-center gap-2 text-xs text-slate-500 py-1">
                <AlertCircle className="w-4 h-4 text-slate-400" /> Add a chief complaint or symptoms to generate differentials.
              </div>
            ) : (
              <Button onClick={generateDifferentials} disabled={loading} size="sm" className="bg-rose-600 hover:bg-rose-700 text-white gap-1.5 text-xs h-7 px-3">
                {loading ? <><Loader2 className="w-3 h-3 animate-spin" />Generating...</> : <><Sparkles className="w-3 h-3" />Generate Differentials</>}
              </Button>
            )}
          </div>
        </div>

        {/* Differential List */}
        {differentials.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-rose-400" />
                <span className="text-sm font-semibold text-slate-800">Differentials to Rule Out</span>
                <Badge className="bg-rose-100 text-rose-700 border border-rose-200 text-xs">{differentials.length}</Badge>
              </div>
              <Button size="sm" variant="outline" onClick={addToMDM} className="text-xs h-7 px-3 border-rose-200 text-rose-700 hover:bg-rose-50 gap-1">
                <Plus className="w-3 h-3" /> Add All to MDM
              </Button>
            </div>
            <div className="p-4 space-y-3">
              {differentials.map((diff, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="border border-slate-200 rounded-lg p-3 hover:border-rose-200 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{idx + 1}</div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold text-slate-900">{diff.diagnosis}</span>
                        {diff.icd10_code && (
                          <span className="ml-2 text-xs bg-slate-100 text-slate-600 border border-slate-200 rounded px-1.5 py-0.5 font-mono">{diff.icd10_code}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <LikelihoodBar rank={diff.likelihood_rank} />
                      <Button size="sm" onClick={() => promoteToFinal(diff)} className="h-5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2 rounded gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Confirm
                      </Button>
                      <button onClick={() => removeDifferential(idx)} className="p-0.5 text-slate-300 hover:text-red-400 transition-colors">
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed ml-7">{diff.clinical_reasoning}</p>
                  {diff.red_flags_to_monitor?.length > 0 && (
                    <div className="mt-2 ml-7 flex flex-wrap gap-1">
                      {diff.red_flags_to_monitor.map((f, i) => (
                        <span key={i} className="text-xs bg-red-50 text-red-700 border border-red-200 rounded px-1.5 py-0.5">⚠ {f}</span>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Manual add to differentials */}
              <AnimatePresence>
                {addingDiff && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="flex gap-2 mt-1">
                      <input autoFocus value={newDiffDx} onChange={(e) => setNewDiffDx(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") addManualDifferential(); if (e.key === "Escape") { setAddingDiff(false); setNewDiffDx(""); } }}
                        placeholder="Diagnosis name (ICD-10 optional)..."
                        className="flex-1 text-xs rounded-lg border border-slate-200 focus:border-rose-300 focus:outline-none px-3 py-1.5" />
                      <Button size="sm" onClick={addManualDifferential} className="h-7 text-xs bg-rose-600 hover:bg-rose-700 text-white px-3">Add</Button>
                      <Button size="sm" variant="ghost" onClick={() => { setAddingDiff(false); setNewDiffDx(""); }} className="h-7 text-xs px-2">Cancel</Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {!addingDiff && (
                <button onClick={() => setAddingDiff(true)} className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-slate-300 text-xs text-slate-500 hover:border-rose-400 hover:text-rose-600 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Add differential manually
                </button>
              )}
            </div>
          </div>
        )}

        {/* Empty state manual add */}
        {differentials.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <p className="text-xs text-slate-500 mb-3">No differentials yet. Generate above or add manually.</p>
            <AnimatePresence>
              {addingDiff && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-2">
                  <div className="flex gap-2">
                    <input autoFocus value={newDiffDx} onChange={(e) => setNewDiffDx(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") addManualDifferential(); if (e.key === "Escape") { setAddingDiff(false); setNewDiffDx(""); } }}
                      placeholder="Diagnosis name..."
                      className="flex-1 text-xs rounded-lg border border-slate-200 focus:border-rose-300 focus:outline-none px-3 py-1.5" />
                    <Button size="sm" onClick={addManualDifferential} className="h-7 text-xs bg-rose-600 hover:bg-rose-700 text-white px-3">Add</Button>
                    <Button size="sm" variant="ghost" onClick={() => { setAddingDiff(false); setNewDiffDx(""); }} className="h-7 text-xs px-2">Cancel</Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {!addingDiff && (
              <button onClick={() => setAddingDiff(true)} className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-slate-300 text-xs text-slate-500 hover:border-rose-400 hover:text-rose-600 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add diagnosis manually
              </button>
            )}
          </div>
        )}

        {/* AI Workup Recommendations */}
        {differentials.length > 0 && (
          <WorkupRecommendations note={note} differentials={differentials} />
        )}
      </div>

      {/* Divider */}
      <div className="border-t-2 border-dashed border-slate-200 my-2" />

      {/* ── SECTION 2: Final Diagnoses ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
            <Stethoscope className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Final Diagnoses</h3>
            <p className="text-xs text-slate-500">Final Clinical Impression — confirmed diagnoses for the note</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border-2 border-emerald-200 shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 border-b border-emerald-100 flex items-center justify-between bg-emerald-50">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-900">Confirmed Final Diagnoses</span>
              <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs">{finalDiagnoses.length}</Badge>
            </div>
          </div>

          <div className="p-4 space-y-2">
            {finalDiagnoses.length === 0 && !addingFinal && (
              <p className="text-xs text-slate-500 text-center py-3">
                No final diagnoses yet. Confirm differentials using <strong>"Confirm"</strong> or add manually below.
              </p>
            )}

            {finalDiagnoses.map((dx, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between gap-3 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="text-sm font-semibold text-slate-900 truncate">{dx}</span>
                </div>
                <button onClick={() => removeFinalDiagnosis(idx)} className="p-0.5 text-slate-300 hover:text-red-400 transition-colors flex-shrink-0">
                  <XCircle className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}

            {/* Manual add final */}
            <AnimatePresence>
              {addingFinal && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="flex gap-2 mt-1">
                    <input autoFocus value={newFinalDx} onChange={(e) => setNewFinalDx(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") addFinalDiagnosis(); if (e.key === "Escape") { setAddingFinal(false); setNewFinalDx(""); } }}
                      placeholder="e.g. Acute MI (I21.9) or type diagnosis name..."
                      className="flex-1 text-xs rounded-lg border border-slate-200 focus:border-emerald-400 focus:outline-none px-3 py-1.5" />
                    <Button size="sm" onClick={addFinalDiagnosis} className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3">Add</Button>
                    <Button size="sm" variant="ghost" onClick={() => { setAddingFinal(false); setNewFinalDx(""); }} className="h-7 text-xs px-2">Cancel</Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {!addingFinal && (
              <button onClick={() => setAddingFinal(true)} className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-emerald-300 text-xs text-emerald-600 hover:border-emerald-500 hover:text-emerald-700 transition-colors mt-1">
                <Plus className="w-3.5 h-3.5" /> Add final diagnosis manually
              </button>
            )}
          </div>
        </div>
      </div>
    </TabPageLayout>
  );
}