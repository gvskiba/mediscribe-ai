import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles, Loader2, Check, X, ClipboardPaste, Activity,
  Thermometer, Heart, Wind, Droplet, Weight, Ruler, History, Save, Plus, Copy
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";

const VITAL_CONFIG = [
  { field: "temperature", label: "Temp", icon: Thermometer, color: "red", unit: "°F", placeholder: "98.6" },
  { field: "heart_rate", label: "HR", icon: Heart, color: "pink", unit: "bpm", placeholder: "72" },
  { field: "blood_pressure", label: "BP", icon: Activity, color: "blue", unit: "mmHg", isBP: true },
  { field: "respiratory_rate", label: "RR", icon: Wind, color: "cyan", unit: "/min", placeholder: "16" },
  { field: "oxygen_saturation", label: "SpO₂", icon: Droplet, color: "indigo", unit: "%", placeholder: "98" },
  { field: "weight", label: "Weight", icon: Weight, color: "purple", unit: "lbs", placeholder: "150" },
  { field: "height", label: "Height", icon: Ruler, color: "amber", unit: "in", placeholder: "68" },
];

const ICON_COLORS = {
  red: "text-red-500", pink: "text-pink-500", blue: "text-blue-500",
  cyan: "text-cyan-500", indigo: "text-indigo-500", purple: "text-purple-500", amber: "text-amber-500",
};

const BG_COLORS = {
  red: "bg-red-50 border-red-200", pink: "bg-pink-50 border-pink-200", blue: "bg-blue-50 border-blue-200",
  cyan: "bg-cyan-50 border-cyan-200", indigo: "bg-indigo-50 border-indigo-200",
  purple: "bg-purple-50 border-purple-200", amber: "bg-amber-50 border-amber-200",
};

function getVitalDisplay(field, vital) {
  if (!vital) return null;
  if (field === "blood_pressure") {
    if (!vital.systolic) return null;
    return `${vital.systolic}/${vital.diastolic}`;
  }
  if (vital.value === undefined || vital.value === "") return null;
  return `${vital.value}`;
}

export default function VitalSignsCard({ note, noteId, queryClient, vitalSignsHistory, setVitalSignsHistory }) {
  const [activeTab, setActiveTab] = useState("enter"); // "enter" | "paste" | "history"
  const [localVitals, setLocalVitals] = useState(note?.vital_signs || {});
  const [pastedText, setPastedText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [parsedVitals, setParsedVitals] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analyzingVitals, setAnalyzingVitals] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sync if note.vital_signs changes externally
  React.useEffect(() => {
    setLocalVitals(note?.vital_signs || {});
  }, [note?.vital_signs]);

  const updateField = (field, key, rawValue) => {
    const parsed = parseFloat(rawValue);
    const value = key === "unit" ? rawValue : (rawValue === "" ? "" : (!isNaN(parsed) ? parsed : rawValue));
    setLocalVitals(prev => ({
      ...prev,
      [field]: { ...(prev[field] || {}), [key]: value }
    }));
  };

  const handleSave = async () => {
    const sanitized = Object.fromEntries(
      Object.entries(localVitals).filter(([_, v]) => {
        if (!v || typeof v !== "object") return false;
        if ("systolic" in v) return v.systolic !== undefined && v.systolic !== "";
        return v.value !== undefined && v.value !== "";
      })
    );
    if (Object.keys(sanitized).length === 0) { toast.error("Enter at least one vital sign"); return; }
    setSaving(true);
    await base44.entities.ClinicalNote.update(noteId, { vital_signs: sanitized });
    queryClient.invalidateQueries({ queryKey: ["note", noteId] });
    setVitalSignsHistory(prev => [{ vitals: sanitized, timestamp: new Date().toISOString() }, ...prev]);
    setSaving(false);
    toast.success("Vital signs saved");
  };

  const handlePasteAnalyze = async () => {
    if (!pastedText.trim()) { toast.error("Paste some vital signs data first"); return; }
    setAnalyzing(true);
    setParsedVitals(null);
    setAiAnalysis(null);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a clinical expert. Extract and interpret vital signs from the following text. Infer what each number represents based on context, typical value ranges, abbreviations, and units.

For example:
- A number like "120/80" is Blood Pressure
- "HR 72" or "P 72" is Heart Rate (pulse)
- "T 98.6" or "Temp 37.2" is Temperature
- "RR 16" or "R 16" is Respiratory Rate
- "SpO2 98" or "O2 sat 98" is Oxygen Saturation
- Numbers like "5'10" or "170cm" are Height
- Numbers like "180lbs" or "82kg" are Weight

TEXT TO PARSE:
${pastedText}

Extract all vital signs found. For Temperature: default unit to F unless stated otherwise or value is <50 (then C). For Weight: default to lbs unless kg stated. For Height: default to in unless cm stated. Only include vitals you found — do not invent values.`,
        response_json_schema: {
          type: "object",
          properties: {
            temperature: { type: "object", properties: { value: { type: "number" }, unit: { type: "string", enum: ["F", "C"] } } },
            heart_rate: { type: "object", properties: { value: { type: "number" }, unit: { type: "string" } } },
            blood_pressure: { type: "object", properties: { systolic: { type: "number" }, diastolic: { type: "number" }, unit: { type: "string" } } },
            respiratory_rate: { type: "object", properties: { value: { type: "number" }, unit: { type: "string" } } },
            oxygen_saturation: { type: "object", properties: { value: { type: "number" }, unit: { type: "string" } } },
            height: { type: "object", properties: { value: { type: "number" }, unit: { type: "string", enum: ["in", "cm"] } } },
            weight: { type: "object", properties: { value: { type: "number" }, unit: { type: "string", enum: ["lbs", "kg"] } } },
            analysis: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  vital_sign: { type: "string" },
                  status: { type: "string", enum: ["normal", "abnormal"] },
                  value: { type: "string" },
                  reference_range: { type: "string" },
                  note: { type: "string" }
                }
              }
            },
            overall_summary: { type: "string" }
          }
        }
      });
      setParsedVitals(result);
      if (result.analysis) setAiAnalysis(result);
      toast.success("Vital signs extracted and analyzed");
    } catch {
      toast.error("Failed to analyze pasted text");
    } finally {
      setAnalyzing(false);
    }
  };

  const applyParsedVitals = async () => {
    if (!parsedVitals) return;
    const { analysis, overall_summary, ...vitalsOnly } = parsedVitals;
    const sanitized = Object.fromEntries(
      Object.entries(vitalsOnly).filter(([_, v]) => {
        if (!v || typeof v !== "object") return false;
        if ("systolic" in v) return v.systolic !== undefined && v.systolic !== "";
        return v.value !== undefined && v.value !== "";
      })
    );
    setLocalVitals(sanitized);
    await base44.entities.ClinicalNote.update(noteId, { vital_signs: sanitized });
    queryClient.invalidateQueries({ queryKey: ["note", noteId] });
    setVitalSignsHistory(prev => [{ vitals: sanitized, timestamp: new Date().toISOString() }, ...prev]);
    setPastedText("");
    setParsedVitals(null);
    setActiveTab("enter");
    toast.success("Vital signs applied");
  };

  const savedVitals = note?.vital_signs || {};
  const hasSavedVitals = Object.keys(savedVitals).length > 0;

  return (
    <div className="rounded-xl border border-slate-200 shadow-sm bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-semibold text-slate-800">Vital Signs</span>
          {hasSavedVitals && <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">Recorded</Badge>}
        </div>
        <div className="flex items-center gap-1">
          {["enter", "paste", "history"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                activeTab === tab ? "bg-white text-emerald-700 shadow-sm border border-emerald-200" : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
              }`}
            >
              {tab === "enter" && <Activity className="w-3 h-3" />}
              {tab === "paste" && <ClipboardPaste className="w-3 h-3" />}
              {tab === "history" && <><History className="w-3 h-3" />{vitalSignsHistory.length > 0 && <span className="bg-emerald-600 text-white rounded-full px-1 text-[10px]">{vitalSignsHistory.length}</span>}</>}
              <span className="capitalize">{tab}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {/* TAB: Manual Entry */}
        {activeTab === "enter" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {VITAL_CONFIG.map(({ field, label, icon: Icon, color, unit, placeholder, isBP }) => {
                const v = localVitals[field] || {};
                const display = getVitalDisplay(field, v);
                return (
                  <div key={field} className={`rounded-lg border p-2.5 ${display ? BG_COLORS[color] : "bg-slate-50 border-slate-200"}`}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Icon className={`w-3.5 h-3.5 ${ICON_COLORS[color]}`} />
                      <span className="text-xs font-semibold text-slate-700">{label}</span>
                    </div>
                    {isBP ? (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={v.systolic || ""}
                          onChange={e => updateField(field, "systolic", e.target.value)}
                          placeholder="120"
                          className="h-7 text-xs px-2 w-full border-slate-300"
                        />
                        <span className="text-slate-400 text-xs">/</span>
                        <Input
                          type="number"
                          value={v.diastolic || ""}
                          onChange={e => updateField(field, "diastolic", e.target.value)}
                          placeholder="80"
                          className="h-7 text-xs px-2 w-full border-slate-300"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={v.value || ""}
                          onChange={e => updateField(field, "value", e.target.value)}
                          placeholder={placeholder}
                          className="h-7 text-xs px-2 flex-1 border-slate-300"
                        />
                        <span className="text-xs text-slate-400 flex-shrink-0">{v.unit || unit}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              size="sm"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 h-8 text-xs"
            >
              {saving ? <><Loader2 className="w-3 h-3 animate-spin" />Saving...</> : <><Save className="w-3 h-3" />Save Vitals</>}
            </Button>
          </div>
        )}

        {/* TAB: Paste & AI Extract */}
        {activeTab === "paste" && (
          <div className="space-y-3">
            <Textarea
              value={pastedText}
              onChange={e => setPastedText(e.target.value)}
              placeholder={"Paste any format – e.g.:\nBP 120/80 HR 72 Temp 98.6 RR 16 SpO2 98% Wt 180lbs Ht 5'10\n\nor from an EMR copy-paste…"}
              className="min-h-[90px] text-sm resize-none border-slate-200"
            />
            <Button
              onClick={handlePasteAnalyze}
              disabled={analyzing || !pastedText.trim()}
              size="sm"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-1.5 h-8 text-xs"
            >
              {analyzing ? <><Loader2 className="w-3 h-3 animate-spin" />Analyzing...</> : <><Sparkles className="w-3 h-3" />Extract & Analyze with AI</>}
            </Button>

            {/* Parsed Result */}
            <AnimatePresence>
              {parsedVitals && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                  {/* Extracted values */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-emerald-800 mb-2 flex items-center gap-1"><Check className="w-3 h-3" />Extracted Vitals</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {VITAL_CONFIG.map(({ field, label, icon: Icon, color, unit }) => {
                        const v = parsedVitals[field];
                        const display = getVitalDisplay(field, v);
                        if (!display) return null;
                        const unitDisplay = field === "blood_pressure" ? (v.unit || "mmHg") : (v.unit || unit);
                        return (
                          <div key={field} className={`rounded-md border p-2 ${BG_COLORS[color]}`}>
                            <div className="flex items-center gap-1 mb-0.5">
                              <Icon className={`w-3 h-3 ${ICON_COLORS[color]}`} />
                              <span className="text-xs font-medium text-slate-600">{label}</span>
                            </div>
                            <p className="text-sm font-bold text-slate-900">{display} <span className="text-xs font-normal text-slate-500">{unitDisplay}</span></p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* AI Analysis */}
                  {parsedVitals.analysis && parsedVitals.analysis.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-slate-600 flex items-center gap-1"><Sparkles className="w-3 h-3 text-blue-500" />AI Interpretation</p>
                      {parsedVitals.analysis.map((item, i) => (
                        <div key={i} className={`flex items-center justify-between rounded-lg border px-3 py-2 ${item.status === "abnormal" ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"}`}>
                          <div>
                            <span className="text-xs font-semibold text-slate-800">{item.vital_sign}</span>
                            <span className="text-xs text-slate-500 ml-2">{item.value} · {item.reference_range}</span>
                            {item.note && <p className="text-xs text-slate-500 mt-0.5">{item.note}</p>}
                          </div>
                          <Badge className={`text-xs ml-2 flex-shrink-0 ${item.status === "abnormal" ? "bg-red-100 text-red-700 border border-red-200" : "bg-emerald-100 text-emerald-700 border border-emerald-200"}`}>{item.status}</Badge>
                        </div>
                      ))}
                      {parsedVitals.overall_summary && (
                        <p className="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">{parsedVitals.overall_summary}</p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button onClick={applyParsedVitals} size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 h-8 text-xs">
                      <Check className="w-3 h-3" />Apply to Note
                    </Button>
                    <Button onClick={() => { setParsedVitals(null); setAiAnalysis(null); }} size="sm" variant="ghost" className="h-8 px-3 text-xs text-slate-500">
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* TAB: History */}
        {activeTab === "history" && (
          <div className="space-y-3">
            {vitalSignsHistory.length === 0 ? (
              <div className="text-center py-8">
                <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No saved vitals yet</p>
                <p className="text-xs text-slate-400 mt-0.5">Save vitals from the Enter tab to build history</p>
              </div>
            ) : (
              vitalSignsHistory.map((entry, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="bg-white rounded-lg border border-slate-200 p-3 hover:border-emerald-300 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-xs font-semibold text-slate-700">
                        {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                      </p>
                      <p className="text-xs text-slate-400">{format(new Date(entry.timestamp), "MMM d · h:mm a")}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={async () => {
                        await base44.entities.ClinicalNote.update(noteId, { vital_signs: entry.vitals });
                        queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                        setLocalVitals(entry.vitals);
                        setActiveTab("enter");
                        toast.success("Vitals loaded");
                      }} className="h-6 px-2 text-xs gap-1 text-emerald-600 hover:bg-emerald-50">
                        <Plus className="w-3 h-3" />Use
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => {
                        const text = Object.entries(entry.vitals)
                          .map(([k, v]) => {
                            const label = k.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                            if (k === "blood_pressure") return `${label}: ${v.systolic}/${v.diastolic} ${v.unit || "mmHg"}`;
                            return `${label}: ${v.value} ${v.unit || ""}`.trim();
                          }).join("\n");
                        navigator.clipboard.writeText(text);
                        toast.success("Copied");
                      }} className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600">
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                    {Object.entries(entry.vitals).map(([field, vital]) => {
                      const display = getVitalDisplay(field, vital);
                      if (!display) return null;
                      const cfg = VITAL_CONFIG.find(c => c.field === field);
                      const Icon = cfg?.icon || Activity;
                      const color = cfg?.color || "blue";
                      const unitDisplay = field === "blood_pressure" ? (vital.unit || "mmHg") : (vital.unit || cfg?.unit || "");
                      return (
                        <div key={field} className={`rounded-md border p-1.5 ${BG_COLORS[color]}`}>
                          <div className="flex items-center gap-1 mb-0.5">
                            <Icon className={`w-2.5 h-2.5 ${ICON_COLORS[color]}`} />
                            <span className="text-[10px] text-slate-500">{cfg?.label || field}</span>
                          </div>
                          <p className="text-xs font-bold text-slate-800">{display} <span className="font-normal text-slate-400 text-[10px]">{unitDisplay}</span></p>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}