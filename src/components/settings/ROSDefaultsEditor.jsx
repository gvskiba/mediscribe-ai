import React, { useState } from "react";
import { Check, ChevronDown, RotateCcw, Plus, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const SYSTEMS = [
  { id: "constitutional",   label: "Constitutional",   normal: "Denies fever, chills, fatigue, weight loss, or night sweats." },
  { id: "eyes",             label: "Eyes",             normal: "Denies vision changes, eye pain, redness, or discharge." },
  { id: "ent",              label: "ENT",              normal: "Denies hearing loss, ear pain, nasal congestion, sore throat, or dysphagia." },
  { id: "cardiovascular",   label: "Cardiovascular",   normal: "Denies chest pain, palpitations, orthopnea, or lower extremity edema." },
  { id: "respiratory",      label: "Respiratory",      normal: "Denies shortness of breath, cough, wheezing, or hemoptysis." },
  { id: "gastrointestinal", label: "Gastrointestinal", normal: "Denies nausea, vomiting, diarrhea, constipation, abdominal pain, or blood in stool." },
  { id: "genitourinary",    label: "Genitourinary",    normal: "Denies dysuria, hematuria, frequency, urgency, or incontinence." },
  { id: "musculoskeletal",  label: "Musculoskeletal",  normal: "Denies joint pain, swelling, stiffness, back pain, or muscle weakness." },
  { id: "neurological",     label: "Neurological",     normal: "Denies headaches, dizziness, syncope, seizures, weakness, or paresthesias." },
  { id: "psychiatric",      label: "Psychiatric",      normal: "Denies depression, anxiety, mood changes, or sleep disturbances." },
  { id: "endocrine",        label: "Endocrine",        normal: "Denies polyuria, polydipsia, heat/cold intolerance, or changes in hair/skin." },
  { id: "hematologic",      label: "Hematologic",      normal: "Denies easy bruising, bleeding, lymphadenopathy, or history of blood clots." },
  { id: "integumentary",    label: "Integumentary",    normal: "Denies rashes, skin lesions, pruritus, or changes in moles." },
];

export default function ROSDefaultsEditor({ defaults, onChange, onSave }) {
  const [expandedId, setExpandedId] = useState(null);
  const [customSystems, setCustomSystems] = useState([]);
  const [addingNew, setAddingNew] = useState(false);
  const [newLabel, setNewLabel] = useState("");

  const allSystems = [...SYSTEMS, ...customSystems];

  const getValue = (id) => defaults?.[id] ?? allSystems.find(s => s.id === id)?.normal ?? "";

  const handleChange = (id, value) => {
    onChange({ ...defaults, [id]: value });
  };

  const resetOne = (id) => {
    const orig = SYSTEMS.find(s => s.id === id)?.normal ?? "";
    handleChange(id, orig);
  };

  const addSystem = () => {
    if (!newLabel.trim()) return;
    const id = `custom_${Date.now()}`;
    const newSystem = { id, label: newLabel.trim(), normal: "", isCustom: true };
    setCustomSystems(prev => [...prev, newSystem]);
    handleChange(id, "");
    setNewLabel("");
    setAddingNew(false);
    setExpandedId(id);
  };

  const removeSystem = (id) => {
    setCustomSystems(prev => prev.filter(s => s.id !== id));
    const updated = { ...defaults };
    delete updated[id];
    const next = { ...updated, [`_hidden_${id}`]: true };
    onChange(next);
    if (expandedId === id) setExpandedId(null);
    if (onSave) onSave(next);
  };

  const visibleSystems = allSystems.filter(s => !defaults?.[`_hidden_${s.id}`]);

  return (
    <div className="space-y-1.5">
      {visibleSystems.map((system) => {
        const value = getValue(system.id);
        const isExpanded = expandedId === system.id;
        const isModified = value !== system.normal;
        return (
          <div key={system.id} className={`rounded-xl border transition-all ${isExpanded ? "bg-purple-50 border-purple-200 shadow-sm" : "bg-white border-slate-200 hover:border-slate-300"}`}>
            <div className="flex items-center gap-1 px-3 py-2.5">
              <button
                type="button"
                className="flex-1 flex items-center gap-3 text-left min-w-0"
                onClick={() => setExpandedId(isExpanded ? null : system.id)}
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isModified ? "bg-purple-500" : "bg-slate-300"}`} />
                <span className="text-xs font-semibold text-slate-700 w-32 flex-shrink-0">{system.label}</span>
                <span className="flex-1 min-w-0 text-xs text-slate-500 truncate">{value}</span>
                {isModified && <span className="text-xs text-purple-600 font-medium flex-shrink-0">modified</span>}
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 flex-shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
              </button>
              <button
                type="button"
                onClick={() => removeSystem(system.id)}
                className="flex-shrink-0 ml-1 p-1 text-slate-300 hover:text-red-400 transition-colors"
                title="Remove system"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <AnimatePresence>
              {isExpanded && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
                  <div className="px-3 pb-3 space-y-2">
                    <textarea
                      value={value}
                      onChange={(e) => handleChange(system.id, e.target.value)}
                      rows={2}
                      autoFocus
                      className="w-full text-xs rounded-lg border border-purple-200 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-100 px-3 py-2 resize-none bg-white"
                    />
                    <div className="flex items-center gap-2">
                      {!system.isCustom && (
                        <button onClick={() => resetOne(system.id)} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors">
                          <RotateCcw className="w-3 h-3" /> Reset to default
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {/* Add new system */}
      <AnimatePresence>
        {addingNew && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-xl px-3 py-2">
              <input
                autoFocus
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addSystem(); if (e.key === "Escape") { setAddingNew(false); setNewLabel(""); } }}
                placeholder="System name (e.g. Allergic/Immunologic)..."
                className="flex-1 text-xs bg-transparent border-0 outline-none placeholder:text-slate-400"
              />
              <button onClick={addSystem} className="text-purple-600 hover:text-purple-800"><Check className="w-4 h-4" /></button>
              <button onClick={() => { setAddingNew(false); setNewLabel(""); }} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setAddingNew(true)}
        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-slate-300 text-xs text-slate-500 hover:border-purple-400 hover:text-purple-600 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" /> Add System
      </button>
    </div>
  );
}