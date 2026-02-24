import React, { useState } from "react";
import { ChevronDown, RotateCcw, Plus, X, Check } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const SECTIONS = [
  { id: "general",        label: "General",        defaultText: "Well-developed, well-nourished, in no acute distress" },
  { id: "heent",          label: "HEENT",          defaultText: "Normocephalic, atraumatic. PERRLA. EOMI. TMs clear bilaterally. Oropharynx clear" },
  { id: "neck",           label: "Neck",           defaultText: "Supple, no JVD, no lymphadenopathy, no thyromegaly" },
  { id: "cardiovascular", label: "Cardiovascular", defaultText: "Regular rate and rhythm, normal S1/S2, no murmurs/rubs/gallops" },
  { id: "respiratory",    label: "Respiratory",    defaultText: "Clear to auscultation bilaterally, no wheezes/rales/rhonchi" },
  { id: "abdomen",        label: "Abdomen",        defaultText: "Soft, non-tender, non-distended, normoactive bowel sounds, no organomegaly" },
  { id: "musculoskeletal",label: "Musculoskeletal",defaultText: "Full range of motion, no deformities, no tenderness, normal gait" },
  { id: "neurological",   label: "Neurological",   defaultText: "Alert and oriented x3, cranial nerves II-XII intact, normal strength and sensation" },
  { id: "skin",           label: "Skin",           defaultText: "Warm, dry, intact. No rashes, lesions, or wounds" },
  { id: "psychiatric",    label: "Psychiatric",    defaultText: "Appropriate mood and affect, normal thought process" },
];

export default function PhysExamDefaultsEditor({ defaults, onChange }) {
  const [expandedId, setExpandedId] = useState(null);
  const [customSections, setCustomSections] = useState([]);
  const [addingNew, setAddingNew] = useState(false);
  const [newLabel, setNewLabel] = useState("");

  const allSections = [...SECTIONS, ...customSections];

  const getValue = (id) => defaults?.[id] ?? allSections.find(s => s.id === id)?.defaultText ?? "";

  const handleChange = (id, value) => {
    onChange({ ...defaults, [id]: value });
  };

  const resetOne = (id) => {
    const orig = SECTIONS.find(s => s.id === id)?.defaultText ?? "";
    handleChange(id, orig);
  };

  const deleteSection = (id) => {
    setCustomSections(prev => prev.filter(s => s.id !== id));
    const updated = { ...defaults };
    delete updated[id];
    onChange(updated);
  };

  const deleteBuiltIn = (id) => {
    const updated = { ...defaults };
    delete updated[id];
    onChange(updated);
    // Mark as hidden by storing a special key
    onChange({ ...defaults, [`_hidden_${id}`]: true, [id]: undefined });
  };

  const addSection = () => {
    if (!newLabel.trim()) return;
    const id = `custom_${Date.now()}`;
    const newSection = { id, label: newLabel.trim(), defaultText: "", isCustom: true };
    setCustomSections(prev => [...prev, newSection]);
    handleChange(id, "");
    setNewLabel("");
    setAddingNew(false);
    setExpandedId(id);
  };

  const removeSection = (id, isCustom) => {
    if (isCustom) {
      deleteSection(id);
    } else {
      const updated = { ...defaults };
      delete updated[id];
      onChange({ ...updated, [`_hidden_${id}`]: true });
    }
    if (expandedId === id) setExpandedId(null);
  };

  const visibleSections = allSections.filter(s => !defaults?.[`_hidden_${s.id}`]);

  return (
    <div className="space-y-1.5">
      {visibleSections.map((section) => {
        const value = getValue(section.id);
        const isExpanded = expandedId === section.id;
        const isModified = value !== section.defaultText;
        return (
          <div key={section.id} className={`rounded-xl border transition-all ${isExpanded ? "bg-emerald-50 border-emerald-200 shadow-sm" : "bg-white border-slate-200 hover:border-slate-300"}`}>
            <div className="flex items-center gap-1 px-3 py-2.5">
              <button
                type="button"
                className="flex-1 flex items-center gap-3 text-left min-w-0"
                onClick={() => setExpandedId(isExpanded ? null : section.id)}
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isModified ? "bg-emerald-500" : "bg-slate-300"}`} />
                <span className="text-xs font-semibold text-slate-700 w-32 flex-shrink-0">{section.label}</span>
                <span className="flex-1 min-w-0 text-xs text-slate-500 truncate">{value}</span>
                {isModified && <span className="text-xs text-emerald-600 font-medium flex-shrink-0">modified</span>}
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 flex-shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
              </button>
              <button
                type="button"
                onClick={() => removeSection(section.id, section.isCustom)}
                className="flex-shrink-0 ml-1 p-1 text-slate-300 hover:text-red-400 transition-colors"
                title="Remove section"
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
                      onChange={(e) => handleChange(section.id, e.target.value)}
                      rows={2}
                      autoFocus
                      className="w-full text-xs rounded-lg border border-emerald-200 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-100 px-3 py-2 resize-none bg-white"
                    />
                    <div className="flex items-center gap-2">
                      {!section.isCustom && (
                        <button onClick={() => resetOne(section.id)} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors">
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

      {/* Add new section */}
      <AnimatePresence>
        {addingNew && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
              <input
                autoFocus
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addSection(); if (e.key === "Escape") { setAddingNew(false); setNewLabel(""); } }}
                placeholder="Section name (e.g. Lymphatic)..."
                className="flex-1 text-xs bg-transparent border-0 outline-none placeholder:text-slate-400"
              />
              <button onClick={addSection} className="text-emerald-600 hover:text-emerald-800"><Check className="w-4 h-4" /></button>
              <button onClick={() => { setAddingNew(false); setNewLabel(""); }} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setAddingNew(true)}
        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-slate-300 text-xs text-slate-500 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" /> Add Section
      </button>
    </div>
  );
}