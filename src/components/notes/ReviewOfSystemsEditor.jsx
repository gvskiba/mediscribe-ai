import React, { useState, useRef, useEffect } from "react";
import {
  Activity, Eye, Heart, Wind, User, Brain, Plus, XCircle, Check,
  Ear, Bone, Droplets, Thermometer, Zap, Shield, Sparkles, Loader2, ChevronDown, RefreshCw, FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

const ALL_SYSTEMS = [
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

function initSectionsWithDefaults(rosData, rosDefaults) {
  // Parse stored JSON if needed
  let parsed = rosData;
  if (parsed && typeof parsed === "string") {
    try { parsed = JSON.parse(parsed); } catch { 
      // If it's a formatted string (contains REVIEW OF SYSTEMS), don't use it for initialization
      if (parsed.includes("REVIEW OF SYSTEMS") || parsed.includes("SYSTEM") || parsed.length > 200) {
        parsed = null;
      }
    }
  }

  // If we have existing rosData (already saved on the note), restore from it
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const storedIds = Object.keys(parsed).filter(k => !k.startsWith("_hidden_"));
    return ALL_SYSTEMS
      .filter(s => storedIds.includes(s.id))
      .map(s => {
        const val = parsed[s.id];
        const normalText = (rosDefaults?.[s.id]) || s.normal;
        const status = val === normalText || val === s.normal ? "normal" : val ? "abnormal" : "normal";
        return { ...s, normal: normalText, status, notes: val || normalText };
      });
  }

  // No saved note data — use settings defaults to determine which systems to show
  if (rosDefaults) {
    const hiddenIds = Object.keys(rosDefaults).filter(k => k.startsWith("_hidden_")).map(k => k.replace("_hidden_", ""));
    return ALL_SYSTEMS
      .filter(s => !hiddenIds.includes(s.id))
      .map(s => ({ ...s, normal: rosDefaults[s.id] || s.normal, status: "normal", notes: rosDefaults[s.id] || s.normal }));
  }

  // Fallback: all systems
  return ALL_SYSTEMS.map(s => ({ ...s, status: "normal", notes: s.normal }));
}

function initSections(rosData, relevantIds = null) {
  // Parse stored JSON if needed
  if (rosData && typeof rosData === "string") {
    try { rosData = JSON.parse(rosData); } catch { /* not JSON */ }
  }

  // If we have existing rosData (object), restore from it
  if (rosData && typeof rosData === "object" && !Array.isArray(rosData)) {
    const storedIds = Object.keys(rosData);
    return ALL_SYSTEMS
      .filter(s => storedIds.includes(s.id))
      .map(s => {
        const val = rosData[s.id];
        const status = val === s.normal ? "normal" : val ? "abnormal" : "normal";
        return { ...s, status, notes: val || s.normal };
      });
  }

  // If AI determined relevant IDs, filter to those
  if (relevantIds && relevantIds.length > 0) {
    return ALL_SYSTEMS
      .filter(s => relevantIds.includes(s.id))
      .map(s => ({ ...s, status: "normal", notes: s.normal }));
  }

  // Default: return all systems
  return ALL_SYSTEMS.map(s => ({ ...s, status: "normal", notes: s.normal }));
}

function SystemRow({ section, onStatusChange, onNotesChange, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [localValue, setLocalValue] = useState(
    section.status === "normal" ? section.normal : (section.notes || "")
  );
  const { status, label } = section;

  // Sync local value when section changes from outside (status change, etc.)
  useEffect(() => {
    setLocalValue(section.status === "normal" ? section.normal : (section.notes || ""));
  }, [section.id, section.status]);

  const handleBlur = () => {
    if (status === "normal") onNotesChange(section.id, localValue, true);
    else onNotesChange(section.id, localValue, false);
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
        <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors ${
          status === "normal" ? "bg-emerald-500" : "bg-rose-500"
        }`} />
        <span className="text-xs font-semibold text-slate-700 w-28 flex-shrink-0">{label}</span>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => { onStatusChange(section.id, "normal"); setExpanded(false); }}
            className={`px-2.5 py-0.5 rounded-full text-xs font-medium border transition-all ${
              status === "normal"
                ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                : "bg-white border-slate-200 text-slate-400 hover:border-emerald-300 hover:text-emerald-700"
            }`}
          >✓ Normal</button>
          <button
            onClick={() => { onStatusChange(section.id, "abnormal"); setExpanded(true); }}
            className={`px-2.5 py-0.5 rounded-full text-xs font-medium border transition-all ${
              status === "abnormal"
                ? "bg-rose-100 border-rose-300 text-rose-800"
                : "bg-white border-slate-200 text-slate-400 hover:border-rose-300 hover:text-rose-700"
            }`}
          >✗ Abnormal</button>
        </div>

        {!expanded && status === "normal" && (
          <span className="flex-1 min-w-0 text-xs text-emerald-600 truncate">{section.normal}</span>
        )}
        {!expanded && status === "abnormal" && (
          <span onClick={() => setExpanded(true)} className="flex-1 min-w-0 text-xs text-rose-600 truncate cursor-text">
            {section.notes || <span className="italic text-slate-400">Add findings...</span>}
          </span>
        )}
        {expanded && <div className="flex-1" />}

        <button onClick={() => setExpanded(e => !e)} className="flex-shrink-0 p-1 rounded text-slate-300 hover:text-slate-500 transition-colors">
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
        <button onClick={() => onDelete(section.id)} className="flex-shrink-0 text-slate-300 hover:text-red-400 transition-colors" title="Remove system">
          <XCircle className="w-3 h-3" />
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
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onBlur={handleBlur}
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
                  <button onClick={() => onStatusChange(section.id, "normal")} className="text-xs text-slate-400 hover:text-emerald-600 transition-colors">
                    Reset to normal
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ReviewOfSystemsEditor({ rosData, onUpdate, onAddToNote, note, noteId }) {
  const [sections, setSections] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [addingSection, setAddingSection] = useState(false);
  const [newSectionLabel, setNewSectionLabel] = useState("");
  const [showAddFromList, setShowAddFromList] = useState(false);
  const [userRosDefaults, setUserRosDefaults] = useState(null);
  const [showAIHub, setShowAIHub] = useState(false);
  const [aiHubAlwaysVisible, setAIHubAlwaysVisible] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Load user settings first, then initialize sections
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const user = await base44.auth.me();
        const rosDefaults = user?.clinical_settings?.ros_defaults || null;
        setUserRosDefaults(rosDefaults);
        setSections(initSectionsWithDefaults(rosData, rosDefaults));
        const hasExistingData = rosData && typeof rosData !== "string"
          ? Object.keys(rosData).length > 0
          : typeof rosData === "string" && rosData.trim().length > 0;
        if (hasExistingData) setAnalyzed(true);
      } catch {
        setSections(initSections(rosData));
      }
    };
    loadSettings();
  }, []);

  // Re-initialize when rosData changes from DB
  const prevRosDataRef = useRef(rosData);
  useEffect(() => {
    if (rosData !== prevRosDataRef.current) {
      prevRosDataRef.current = rosData;
      setSections(initSectionsWithDefaults(rosData, userRosDefaults));
      setAnalyzed(true);
    }
  }, [rosData, userRosDefaults]);

  // Auto-analyze on mount if we have CC or HPI but no existing rosData
  useEffect(() => {
    if (userRosDefaults === null) return; // wait for settings to load
    const hasExistingData = rosData && typeof rosData !== "string" ? Object.keys(rosData).length > 0 :
      typeof rosData === "string" && rosData.trim().length > 0;
    if (!hasExistingData && (note?.chief_complaint || note?.history_of_present_illness) && !analyzed) {
      analyzeRelevantSystems();
    }
  }, [userRosDefaults]);

  // Load AI Hub always-visible setting
  const loadAIHubSetting = async () => {
    try {
      const user = await base44.auth.me();
      if (user?.ai_hub_always_visible) {
        setAIHubAlwaysVisible(true);
        setShowAIHub(true);
      }
    } catch { /* no user */ }
  };

  useEffect(() => {
    loadAIHubSetting();
  }, []);

  const save = (updated) => {
    const obj = {};
    updated.forEach(s => {
      obj[s.id] = s.status === "normal" ? s.normal : (s.notes || "");
    });
    onUpdate(obj);
  };

  const analyzeRelevantSystems = async () => {
    if (!note?.chief_complaint && !note?.history_of_present_illness) return;
    setLoadingAI(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a clinical documentation expert. Based on the chief complaint and HPI below, determine which body systems are RELEVANT and should appear in a Review of Systems.

Chief Complaint: ${note.chief_complaint || "N/A"}
History of Present Illness: ${note.history_of_present_illness || "N/A"}

From this list of system IDs, select only the ones that are clinically relevant to review given this presentation:
constitutional, eyes, ent, cardiovascular, respiratory, gastrointestinal, genitourinary, musculoskeletal, neurological, psychiatric, endocrine, hematologic, integumentary

Instructions:
1. Always include "constitutional" as a baseline
2. Include all systems directly mentioned or implied in the CC/HPI
3. Include related systems that should be screened based on the primary complaint (e.g., respiratory if chest pain, neurological if headache)
4. Exclude systems unrelated to the presentation
5. Return 4-10 most pertinent systems

Example: CC "chest pain" → include constitutional, cardiovascular, respiratory, gastrointestinal (GERD), musculoskeletal, psychiatric
Example: CC "cough" → include constitutional, respiratory, cardiovascular (heart failure), gastrointestinal (GERD)`,
        response_json_schema: {
          type: "object",
          properties: {
            relevant_system_ids: {
              type: "array",
              items: { type: "string" },
              description: "System IDs to include in ROS"
            },
            reasoning: { 
              type: "string",
              description: "Explanation of which systems are relevant and why"
            }
          }
        }
      });

      const relevantIds = result.relevant_system_ids || [];
      const hiddenIds = userRosDefaults ? Object.keys(userRosDefaults).filter(k => k.startsWith("_hidden_")).map(k => k.replace("_hidden_", "")) : [];
      const filtered = ALL_SYSTEMS
        .filter(s => relevantIds.includes(s.id) && !hiddenIds.includes(s.id))
        .map(s => ({ ...s, normal: userRosDefaults?.[s.id] || s.normal, status: "normal", notes: userRosDefaults?.[s.id] || s.normal }));

      setSections(filtered.length > 0 ? filtered : (userRosDefaults ? initSectionsWithDefaults(null, userRosDefaults) : ALL_SYSTEMS.map(s => ({ ...s, status: "normal", notes: s.normal }))));
      setAnalyzed(true);
      toast.success(`Showing ${filtered.length} relevant systems for ${note.chief_complaint || 'this presentation'}`);
    } catch {
      toast.error("Could not analyze relevant systems");
      setSections(ALL_SYSTEMS.map(s => ({ ...s, status: "normal", notes: s.normal })));
      setAnalyzed(true);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleStatusChange = (id, status) => {
    const updated = sections.map(s => {
      if (s.id !== id) return s;
      if (status === "normal") {
        return { ...s, status: "normal", notes: s.normal };
      }
      if (status === "abnormal") {
        // When switching to abnormal, clear the notes field so user can enter abnormal findings
        const currentNotes = s.notes === s.normal || !s.notes ? "" : s.notes;
        return { ...s, status: "abnormal", notes: currentNotes };
      }
      return { ...s, status: "not_assessed" };
    });
    setSections(updated);
    save(updated);
  };

  const handleNotesChange = (id, value, isNormalEdit) => {
    const updated = sections.map(s => {
      if (s.id !== id) return s;
      if (isNormalEdit) return { ...s, normal: value };
      // Auto-detect status based on value vs normal
      const status = value === s.normal || !value ? "normal" : "abnormal";
      return { ...s, status, notes: value };
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

  const addSystemFromList = (system) => {
    if (sections.find(s => s.id === system.id)) return;
    const updated = [...sections, { ...system, status: "normal", notes: system.normal }];
    setSections(updated);
    save(updated);
    setShowAddFromList(false);
  };

  const addCustomSection = () => {
    if (!newSectionLabel.trim()) return;
    const id = `custom_${Date.now()}`;
    const updated = [...sections, { id, label: newSectionLabel.trim(), icon: Activity, color: "slate", normal: "", status: "normal", notes: "", isCustom: true }];
    setSections(updated);
    setNewSectionLabel("");
    setAddingSection(false);
    save(updated);
  };

  const handleAddToNote = () => {
    let text = "\nREVIEW OF SYSTEMS\n" + "─".repeat(40) + "\n\n";
    sections.forEach(s => {
      const content = s.status === "normal" ? s.normal : (s.notes || "");
      text += `${s.label.toUpperCase()}: ${content}\n\n`;
    });
    onAddToNote(text);
    toast.success("ROS saved to note");
  };

  const availableToAdd = ALL_SYSTEMS.filter(s => !sections.find(existing => existing.id === s.id));
  const normalCount = sections.filter(s => s.status === "normal").length;
  const abnormalCount = sections.filter(s => s.status === "abnormal").length;

  return (
    <div className="space-y-3">
      {/* AI loading state */}
      {loadingAI && (
        <div className="flex items-center gap-3 bg-purple-50 border border-purple-200 rounded-xl px-4 py-3">
          <Loader2 className="w-4 h-4 animate-spin text-purple-600 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-purple-800">Analyzing chief complaint & HPI...</p>
            <p className="text-xs text-purple-600 mt-0.5">Selecting relevant systems to review</p>
          </div>
        </div>
      )}

      {/* Summary bar */}
      {!loadingAI && (
        <div className="flex items-center justify-between gap-3 bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-200">
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-500">{sections.length} systems</span>
            {normalCount > 0 && <span className="flex items-center gap-1 text-emerald-600 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />{normalCount} normal</span>}
            {abnormalCount > 0 && <span className="flex items-center gap-1 text-rose-600 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />{abnormalCount} abnormal</span>}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowAIHub(!showAIHub)}
              title="AI Assistance Hub"
              className="p-2 rounded-lg border bg-white border-purple-200 text-purple-600 hover:bg-purple-50 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
            </button>
            <button
              onClick={analyzeRelevantSystems}
              disabled={loadingAI}
              title="Re-analyze relevant systems"
              className="p-2 rounded-lg border bg-white border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-60"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={markAllNormal}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
            >
              All Normal
            </button>
            <button
              onClick={() => setShowAddFromList(v => !v)}
              className="p-2 rounded-lg border bg-white border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors"
              title="Add system"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={handleAddToNote}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors flex items-center gap-1"
            >
              <Check className="w-3 h-3" /> Save
            </button>
          </div>
        </div>
      )}

      {/* AI Hub Panel */}
      <AnimatePresence>
        {(showAIHub || aiHubAlwaysVisible) && !loadingAI && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-purple-900">AI Assistance Hub</p>
                  <p className="text-xs text-purple-600 mt-0.5">Generate ROS based on chief complaint</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      const newVal = !aiHubAlwaysVisible;
                      setAIHubAlwaysVisible(newVal);
                      await base44.auth.updateMe({ ai_hub_always_visible: newVal });
                    }}
                    className={`p-1 rounded-lg transition-colors ${aiHubAlwaysVisible ? "bg-purple-200 text-purple-700" : "text-purple-400 hover:bg-purple-100"}`}
                    title={aiHubAlwaysVisible ? "Disable always visible" : "Enable always visible"}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {!aiHubAlwaysVisible && (
                    <button onClick={() => setShowAIHub(false)} className="text-purple-400 hover:text-purple-600">
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={analyzeRelevantSystems}
                  disabled={loadingAI || (!note?.chief_complaint && !note?.history_of_present_illness)}
                  className="flex-1 min-w-max px-3 py-2 rounded-lg bg-purple-600 text-white text-xs font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Analyze CC & HPI
                </button>
                <button
                  onClick={markAllNormal}
                  className="flex-1 min-w-max px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  Mark All Normal
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add system from list */}
      <AnimatePresence>
        {showAddFromList && !loadingAI && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <p className="text-xs font-semibold text-blue-800 mb-2">Add a system</p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {availableToAdd.map(s => (
                  <button
                    key={s.id}
                    onClick={() => addSystemFromList(s)}
                    className="px-2.5 py-1 rounded-full text-xs font-medium border bg-white border-blue-300 text-blue-700 hover:bg-blue-100 transition-all"
                  >
                    {s.label}
                  </button>
                ))}
                {availableToAdd.length === 0 && <span className="text-xs text-slate-400">All systems added</span>}
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-blue-200">
                <input
                  type="text"
                  value={newSectionLabel}
                  onChange={(e) => setNewSectionLabel(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") addCustomSection(); if (e.key === "Escape") { setShowAddFromList(false); setNewSectionLabel(""); } }}
                  placeholder="Or type a custom system name..."
                  className="flex-1 text-xs bg-white border border-blue-200 rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-blue-300 placeholder:text-slate-400"
                />
                <button onClick={addCustomSection} className="text-blue-600 hover:text-blue-800"><Check className="w-4 h-4" /></button>
                <button onClick={() => { setShowAddFromList(false); setNewSectionLabel(""); }} className="text-slate-400 hover:text-slate-600"><XCircle className="w-4 h-4" /></button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Systems list */}
      {!loadingAI && (
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
          {sections.length === 0 && (
            <div className="text-center py-6 text-slate-400 text-xs">No systems. Click + to add.</div>
          )}
        </div>
      )}

      {/* Abnormal summary */}
      {!loadingAI && abnormalCount > 0 && (
        <div className="bg-rose-50 rounded-xl border border-rose-200 px-4 py-3">
          <p className="text-xs font-bold text-rose-800 uppercase tracking-wide mb-2">Abnormal Findings</p>
          <div className="space-y-1 mb-4">
            {sections.filter(s => s.status === "abnormal").map(s => (
              <p key={s.id} className="text-xs text-rose-900">
                <span className="font-semibold">{s.label}:</span> {s.notes || "—"}
              </p>
            ))}
          </div>
          <div className="flex items-center gap-2 border-t border-rose-200 pt-3">
            <button
              onClick={handleAddToNote}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              Save to Note
            </button>
            <button
              onClick={() => setShowPreview(true)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-rose-200 bg-white text-rose-700 text-xs font-semibold hover:bg-rose-50 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}