import React, { useState, useRef, useEffect } from "react";
import {
  Activity, Eye, Heart, Wind, User, Brain, Plus, X, Check,
  Ear, Bone, Droplets, Thermometer, Zap, Shield, Sparkles, Loader2, ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

const SYSTEMS = [
  { id: "constitutional",   label: "Constitutional",   icon: Thermometer, color: "slate",  normal: "Denies fever, chills, fatigue, weight loss, or night sweats." },
  { id: "eyes",             label: "Eyes",             icon: Eye,         color: "sky",    normal: "Denies vision changes, eye pain, redness, or discharge." },
  { id: "ent",              label: "ENT",              icon: Ear,         color: "teal",   normal: "Denies hearing loss, ear pain, nasal congestion, sore throat, or dysphagia." },
  { id: "cardiovascular",   label: "Cardiovascular",   icon: Heart,       color: "rose",   normal: "Denies chest pain, palpitations, orthopnea, or lower extremity edema." },
  { id: "respiratory",      label: "Respiratory",      icon: Wind,        color: "blue",   normal: "Denies shortness of breath, cough, wheezing, or hemoptysis." },
  { id: "gastrointestinal", label: "Gastrointestinal", icon: Activity,    color: "amber",  normal: "Denies nausea, vomiting, diarrhea, constipation, abdominal pain, or blood in stool." },
  { id: "genitourinary",    label: "Genitourinary",    icon: Droplets,    color: "cyan",   normal: "Denies dysuria, hematuria, frequency, urgency, or incontinence." },
  { id: "musculoskeletal",  label: "Musculoskeletal",  icon: Bone,        color: "orange", normal: "Denies joint pain, swelling, stiffness, back pain, or muscle weakness." },
  { id: "neurological",     label: "Neurological",     icon: Brain,       color: "purple", normal: "Denies headaches, dizziness, syncope, seizures, weakness, or paresthesias." },
  { id: "psychiatric",      label: "Psychiatric",      icon: Zap,         color: "violet", normal: "Denies depression, anxiety, mood changes, or sleep disturbances." },
  { id: "endocrine",        label: "Endocrine",        icon: Activity,    color: "yellow", normal: "Denies polyuria, polydipsia, heat/cold intolerance, or changes in hair/skin." },
  { id: "hematologic",      label: "Hematologic",      icon: Droplets,    color: "red",    normal: "Denies easy bruising, bleeding, lymphadenopathy, or history of blood clots." },
  { id: "integumentary",    label: "Integumentary",    icon: Shield,      color: "green",  normal: "Denies rashes, skin lesions, pruritus, or changes in moles." },
];

const DOT_COLOR = {
  slate: "bg-slate-400", sky: "bg-sky-400", teal: "bg-teal-400", rose: "bg-rose-400",
  blue: "bg-blue-400", amber: "bg-amber-400", cyan: "bg-cyan-400", orange: "bg-orange-400",
  purple: "bg-purple-400", violet: "bg-violet-400", yellow: "bg-yellow-400", red: "bg-red-400", green: "bg-green-400",
};

function initSections(rosData) {
  // Handle JSON string stored from previous stringify
  if (rosData && typeof rosData === "string") {
    try { rosData = JSON.parse(rosData); } catch { /* not JSON, ignore */ }
  }
  if (rosData && typeof rosData === "object" && !Array.isArray(rosData)) {
    return SYSTEMS.map(s => {
      const val = rosData[s.id];
      const status = val === undefined ? "not_assessed" : val === s.normal ? "normal" : val ? "abnormal" : "not_assessed";
      return { ...s, status, notes: val || "" };
    });
  }
  return SYSTEMS.map(s => ({ ...s, status: "normal", notes: s.normal }));
}

function SystemRow({ section, onStatusChange, onNotesChange, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef(null);
  const { status, notes, label, color } = section;

  useEffect(() => {
    if (expanded && status === "abnormal" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [expanded, status]);

  const handleNormal = () => {
    onStatusChange(section.id, "normal");
    setExpanded(false);
  };

  const handleAbnormal = () => {
    onStatusChange(section.id, "abnormal");
    setExpanded(true);
  };

  const handleToggleAssessed = () => {
    if (status === "not_assessed") {
      onStatusChange(section.id, "normal");
    } else {
      onStatusChange(section.id, "not_assessed");
      setExpanded(false);
    }
  };

  return (
    <div className={`rounded-xl border transition-all duration-150 ${
      expanded && status === "abnormal"
        ? "bg-rose-50 border-rose-200 shadow-sm"
        : expanded
        ? "bg-slate-50 border-slate-300 shadow-sm"
        : "bg-white border-slate-200 hover:border-slate-300"
    }`}>
      <div className="flex items-center gap-3 px-3 py-2.5">
        {/* Status dot */}
        <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors ${
          status === "normal" ? "bg-emerald-500" :
          status === "abnormal" ? "bg-rose-500" :
          "bg-slate-200"
        }`} />

        {/* Label */}
        <span className="text-xs font-semibold text-slate-700 w-28 flex-shrink-0">{label}</span>

        {/* Normal / Abnormal chips */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={handleNormal}
            className={`px-2.5 py-0.5 rounded-full text-xs font-medium border transition-all ${
              status === "normal"
                ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                : "bg-white border-slate-200 text-slate-400 hover:border-emerald-300 hover:text-emerald-700"
            }`}
          >✓ Normal</button>
          <button
            onClick={handleAbnormal}
            className={`px-2.5 py-0.5 rounded-full text-xs font-medium border transition-all ${
              status === "abnormal"
                ? "bg-rose-100 border-rose-300 text-rose-800"
                : "bg-white border-slate-200 text-slate-400 hover:border-rose-300 hover:text-rose-700"
            }`}
          >✗ Abnormal</button>
        </div>

        {/* Inline content preview */}
        {!expanded && status === "normal" && (
          <span className="flex-1 min-w-0 text-xs text-emerald-600 truncate">{section.normal}</span>
        )}
        {!expanded && status === "abnormal" && (
          <span
            onClick={() => setExpanded(true)}
            className="flex-1 min-w-0 text-xs text-rose-600 truncate cursor-text"
          >{notes || <span className="italic text-slate-400">Add findings...</span>}</span>
        )}
        {!expanded && status === "not_assessed" && (
          <span className="flex-1 min-w-0 text-xs text-slate-300 italic">Not assessed</span>
        )}
        {expanded && <div className="flex-1" />}

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex-shrink-0 p-1 rounded text-slate-300 hover:text-slate-500 transition-colors"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>

        <button onClick={() => onDelete(section.id)} className="flex-shrink-0 text-slate-300 hover:text-red-400 transition-colors" title="Remove system">
          <X className="w-3 h-3" />
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3">
              <textarea
                ref={inputRef}
                value={status === "normal" ? section.normal : (notes || "")}
                onChange={(e) => {
                  if (status === "normal") {
                    // editing normal text directly
                    onNotesChange(section.id, e.target.value, true);
                  } else {
                    onNotesChange(section.id, e.target.value, false);
                  }
                }}
                placeholder={status === "normal" ? "Edit normal findings..." : `Describe ${label.toLowerCase()} findings...`}
                rows={2}
                className={`w-full text-xs rounded-lg border px-3 py-2 resize-none focus:outline-none focus:ring-1 transition-all bg-white ${
                  status === "abnormal"
                    ? "border-rose-200 focus:border-rose-400 focus:ring-rose-100"
                    : "border-slate-200 focus:border-emerald-300 focus:ring-emerald-50"
                }`}
              />
              <div className="flex items-center gap-2 mt-1.5">
                {status === "abnormal" && (
                  <button onClick={handleNormal} className="text-xs text-slate-400 hover:text-emerald-600 transition-colors">
                    Reset to normal
                  </button>
                )}
                <span className="text-slate-200">·</span>
                <button onClick={() => { onStatusChange(section.id, "not_assessed"); setExpanded(false); }} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
                  Mark not assessed
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ReviewOfSystemsEditor({ rosData, onUpdate, onAddToNote, note }) {
  const [sections, setSections] = useState(() => initSections(rosData));

  // Re-initialize when rosData changes (e.g. note loaded from DB)
  const prevRosDataRef = React.useRef(rosData);
  useEffect(() => {
    if (rosData !== prevRosDataRef.current) {
      prevRosDataRef.current = rosData;
      setSections(initSections(rosData));
    }
  }, [rosData]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [addingSection, setAddingSection] = useState(false);
  const [newSectionLabel, setNewSectionLabel] = useState("");

  const save = (updated) => {
    const obj = {};
    updated.forEach(s => {
      if (s.status !== "not_assessed") obj[s.id] = s.status === "normal" ? s.normal : (s.notes || "");
    });
    onUpdate(obj);
  };

  const handleStatusChange = (id, status) => {
    const updated = sections.map(s => {
      if (s.id !== id) return s;
      if (status === "normal") return { ...s, status: "normal", notes: s.normal };
      if (status === "abnormal") return { ...s, status: "abnormal", notes: s.notes === s.normal ? "" : s.notes };
      return { ...s, status: "not_assessed" };
    });
    setSections(updated);
    save(updated);
  };

  const handleNotesChange = (id, value, isNormalEdit) => {
    const updated = sections.map(s => {
      if (s.id !== id) return s;
      if (isNormalEdit) return { ...s, normal: value };
      return { ...s, notes: value };
    });
    setSections(updated);
    save(updated);
  };

  const handleDelete = (id) => {
    const updated = sections.filter(s => s.id !== id);
    setSections(updated);
    save(updated);
  };

  const markAllNormal = () => {
    const updated = sections.map(s => ({ ...s, status: "normal", notes: s.normal }));
    setSections(updated);
    save(updated);
    toast.success("All systems set to normal");
  };

  const addCustomSection = () => {
    if (!newSectionLabel.trim()) return;
    const id = `custom_${Date.now()}`;
    const updated = [...sections, { id, label: newSectionLabel.trim(), icon: Activity, color: "slate", normal: "", status: "not_assessed", notes: "", isCustom: true }];
    setSections(updated);
    setNewSectionLabel("");
    setAddingSection(false);
    save(updated);
  };

  const autoFillFromAI = async () => {
    if (!note?.chief_complaint && !note?.history_of_present_illness) {
      toast.error("Add a chief complaint or HPI first");
      return;
    }
    setLoadingAI(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a clinical documentation expert. Based on the following patient information, fill in a Review of Systems.

Chief Complaint: ${note.chief_complaint || "N/A"}
History of Present Illness: ${note.history_of_present_illness || "N/A"}
Assessment: ${note.assessment || "N/A"}

For each body system, determine if findings are NORMAL or ABNORMAL. Systems not clearly related to the presentation should default to "normal".

Return findings for: constitutional, eyes, ent, cardiovascular, respiratory, gastrointestinal, genitourinary, musculoskeletal, neurological, psychiatric, endocrine, hematologic, integumentary`,
        response_json_schema: {
          type: "object",
          properties: {
            systems: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  status: { type: "string", enum: ["normal", "abnormal"] },
                  findings: { type: "string" }
                }
              }
            }
          }
        }
      });

      const aiMap = {};
      (result.systems || []).forEach(s => { aiMap[s.id] = s; });

      const updated = sections.map(s => {
        const ai = aiMap[s.id];
        if (!ai) return s;
        if (ai.status === "abnormal") return { ...s, status: "abnormal", notes: ai.findings || "" };
        return { ...s, status: "normal", notes: s.normal };
      });

      setSections(updated);
      save(updated);
      toast.success("ROS filled from AI analysis");
    } catch (error) {
      toast.error("Failed to auto-fill ROS");
    } finally {
      setLoadingAI(false);
    }
  };

  const handleAddToNote = () => {
    let text = "\nREVIEW OF SYSTEMS\n" + "─".repeat(40) + "\n\n";
    sections.filter(s => s.status !== "not_assessed").forEach(s => {
      const content = s.status === "normal" ? s.normal : (s.notes || "");
      text += `${s.label.toUpperCase()}: ${content}\n\n`;
    });
    onAddToNote(text);
    toast.success("ROS added to note");
  };

  const normalCount = sections.filter(s => s.status === "normal").length;
  const abnormalCount = sections.filter(s => s.status === "abnormal").length;
  const notAssessedCount = sections.filter(s => s.status === "not_assessed").length;

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      <div className="flex items-center justify-between gap-3 bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-200">
        <div className="flex items-center gap-3 text-xs">
          {normalCount > 0 && <span className="flex items-center gap-1 text-emerald-600 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />{normalCount} normal</span>}
          {abnormalCount > 0 && <span className="flex items-center gap-1 text-rose-600 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />{abnormalCount} abnormal</span>}
          {notAssessedCount > 0 && <span className="flex items-center gap-1 text-slate-400"><span className="w-1.5 h-1.5 rounded-full bg-slate-300 inline-block" />{notAssessedCount} not assessed</span>}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={autoFillFromAI}
            disabled={loadingAI}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors flex items-center gap-1 disabled:opacity-60"
          >
            {loadingAI ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            {loadingAI ? "Analyzing..." : "AI Fill"}
          </button>
          <button
            onClick={markAllNormal}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
          >
            All Normal
          </button>
          <button
            onClick={() => setAddingSection(true)}
            className="p-1.5 rounded-lg border bg-white border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors"
            title="Add custom section"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleAddToNote}
            disabled={normalCount + abnormalCount === 0}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors flex items-center gap-1 disabled:opacity-50"
          >
            <Check className="w-3 h-3" /> Save to Note
          </button>
        </div>
      </div>

      {/* Add custom section */}
      <AnimatePresence>
        {addingSection && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-xl px-3 py-2">
              <input
                autoFocus
                type="text"
                value={newSectionLabel}
                onChange={(e) => setNewSectionLabel(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addCustomSection(); if (e.key === "Escape") { setAddingSection(false); setNewSectionLabel(""); } }}
                placeholder="Section name (e.g. Allergic/Immunologic)..."
                className="flex-1 text-xs bg-transparent border-0 outline-none placeholder:text-slate-400"
              />
              <button onClick={addCustomSection} className="text-purple-600 hover:text-purple-800"><Check className="w-4 h-4" /></button>
              <button onClick={() => { setAddingSection(false); setNewSectionLabel(""); }} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Systems list */}
      <div className="space-y-1.5">
        {sections.map((section) => (
          <SystemRow
            key={section.id}
            section={section}
            onStatusChange={handleStatusChange}
            onNotesChange={handleNotesChange}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Abnormal summary */}
      {abnormalCount > 0 && (
        <div className="bg-rose-50 rounded-xl border border-rose-200 px-4 py-3">
          <p className="text-xs font-bold text-rose-800 uppercase tracking-wide mb-2">Abnormal Findings</p>
          <div className="space-y-1">
            {sections.filter(s => s.status === "abnormal").map(s => (
              <p key={s.id} className="text-xs text-rose-900">
                <span className="font-semibold">{s.label}:</span> {s.notes || "—"}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}