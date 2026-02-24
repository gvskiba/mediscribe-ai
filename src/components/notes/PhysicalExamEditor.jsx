import React, { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { 
  Activity, Eye, Heart, Wind, User, Brain,
  Plus, X, Check, ChevronDown, Settings
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const SECTIONS = [
  { id: "general", label: "General", icon: User, short: "Gen", defaultText: "Well-developed, well-nourished, in no acute distress" },
  { id: "heent", label: "HEENT", icon: Eye, short: "HEENT", defaultText: "Normocephalic, atraumatic. PERRLA. EOMI. TMs clear bilaterally. Oropharynx clear" },
  { id: "neck", label: "Neck", icon: User, short: "Neck", defaultText: "Supple, no JVD, no lymphadenopathy, no thyromegaly" },
  { id: "cardiovascular", label: "Cardiovascular", icon: Heart, short: "CV", defaultText: "Regular rate and rhythm, normal S1/S2, no murmurs/rubs/gallops" },
  { id: "respiratory", label: "Respiratory", icon: Wind, short: "Resp", defaultText: "Clear to auscultation bilaterally, no wheezes/rales/rhonchi" },
  { id: "abdomen", label: "Abdomen", icon: User, short: "Abd", defaultText: "Soft, non-tender, non-distended, normoactive bowel sounds, no organomegaly" },
  { id: "musculoskeletal", label: "Musculoskeletal", icon: Activity, short: "MSK", defaultText: "Full range of motion, no deformities, no tenderness, normal gait" },
  { id: "neurological", label: "Neurological", icon: Brain, short: "Neuro", defaultText: "Alert and oriented x3, cranial nerves II-XII intact, normal strength and sensation" },
  { id: "skin", label: "Skin", icon: User, short: "Skin", defaultText: "Warm, dry, intact. No rashes, lesions, or wounds" },
  { id: "psychiatric", label: "Psychiatric", icon: Brain, short: "Psych", defaultText: "Appropriate mood and affect, normal thought process" },
];

const SECTION_COLORS = {
  general: "emerald",
  heent: "sky",
  neck: "teal",
  cardiovascular: "rose",
  respiratory: "blue",
  abdomen: "amber",
  musculoskeletal: "violet",
  neurological: "purple",
  skin: "orange",
  psychiatric: "pink",
};

const colorClass = (color, type) => {
  const map = {
    emerald: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500", focusBorder: "focus:border-emerald-400" },
    sky: { bg: "bg-sky-50", border: "border-sky-200", text: "text-sky-700", dot: "bg-sky-500", focusBorder: "focus:border-sky-400" },
    teal: { bg: "bg-teal-50", border: "border-teal-200", text: "text-teal-700", dot: "bg-teal-500", focusBorder: "focus:border-teal-400" },
    rose: { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", dot: "bg-rose-500", focusBorder: "focus:border-rose-400" },
    blue: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", dot: "bg-blue-500", focusBorder: "focus:border-blue-400" },
    amber: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", dot: "bg-amber-500", focusBorder: "focus:border-amber-400" },
    violet: { bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-700", dot: "bg-violet-500", focusBorder: "focus:border-violet-400" },
    purple: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", dot: "bg-purple-500", focusBorder: "focus:border-purple-400" },
    orange: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", dot: "bg-orange-500", focusBorder: "focus:border-orange-400" },
    pink: { bg: "bg-pink-50", border: "border-pink-200", text: "text-pink-700", dot: "bg-pink-500", focusBorder: "focus:border-pink-400" },
  };
  return map[color]?.[type] || map.emerald[type];
};

function SectionRow({ section, onChange, isCustom, onRemove }) {
  const [expanded, setExpanded] = useState(false);
  const textareaRef = useRef(null);
  const color = SECTION_COLORS[section.id] || "emerald";
  const isNormal = section.content === section.defaultText;
  const hasContent = !!section.content;

  useEffect(() => {
    if (expanded && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [expanded]);

  const setNormal = () => {
    onChange(section.id, section.defaultText || "");
    setExpanded(false);
  };

  const setAbnormal = () => {
    if (isNormal || !hasContent) onChange(section.id, "");
    setExpanded(true);
  };

  const status = !hasContent ? "empty" : isNormal ? "normal" : "abnormal";

  return (
    <div className={`rounded-xl border transition-all duration-150 ${
      expanded 
        ? `${colorClass(color, 'bg')} ${colorClass(color, 'border')} shadow-sm`
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
        <span className="text-xs font-semibold text-slate-700 w-28 flex-shrink-0">{section.label}</span>

        {/* Normal / Abnormal chips */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={setNormal}
            className={`px-2.5 py-0.5 rounded-full text-xs font-medium border transition-all ${
              status === "normal"
                ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                : "bg-white border-slate-200 text-slate-400 hover:border-emerald-300 hover:text-emerald-700"
            }`}
          >✓ Normal</button>
          <button
            onClick={setAbnormal}
            className={`px-2.5 py-0.5 rounded-full text-xs font-medium border transition-all ${
              status === "abnormal"
                ? "bg-rose-100 border-rose-300 text-rose-800"
                : "bg-white border-slate-200 text-slate-400 hover:border-rose-300 hover:text-rose-700"
            }`}
          >✗ Abnormal</button>
        </div>

        {/* Inline text preview */}
        {!expanded && hasContent && (
          <span
            onClick={() => setExpanded(true)}
            className="flex-1 min-w-0 text-xs text-slate-500 truncate cursor-text hover:text-slate-700 transition-colors"
          >
            {section.content}
          </span>
        )}
        {!expanded && !hasContent && (
          <span
            onClick={() => setExpanded(true)}
            className="flex-1 min-w-0 text-xs text-slate-300 italic cursor-text"
          >
            Add findings...
          </span>
        )}
        {expanded && <div className="flex-1" />}

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex-shrink-0 p-1 rounded text-slate-300 hover:text-slate-500 transition-colors"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>

        <button onClick={() => onRemove(section.id)} className="flex-shrink-0 text-slate-300 hover:text-red-400 transition-colors" title="Remove section">
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
                ref={textareaRef}
                value={section.content || ""}
                onChange={(e) => onChange(section.id, e.target.value)}
                placeholder={`Describe ${section.label.toLowerCase()} findings...`}
                rows={3}
                className={`w-full text-xs rounded-lg border px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-offset-0 transition-all bg-white ${colorClass(color, 'border')} ${colorClass(color, 'focusBorder')} focus:ring-${color}-200`}
              />
              <div className="flex items-center gap-2 mt-1.5">
                <button
                  onClick={setNormal}
                  className="text-xs text-slate-400 hover:text-emerald-600 transition-colors"
                >
                  Reset to normal
                </button>
                <span className="text-slate-200">·</span>
                <button
                  onClick={() => { onChange(section.id, ""); setExpanded(false); }}
                  className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PhysicalExamEditor({ examData, onUpdate, onAddToNote }) {
  const [sections, setSections] = useState(() => {
    if (examData && typeof examData === 'object' && !Array.isArray(examData)) {
      const base = SECTIONS.map(s => ({
        ...s,
        content: examData[s.id] ?? s.defaultText,
        enabled: true,
      }));
      const extras = Object.keys(examData)
        .filter(k => !SECTIONS.find(s => s.id === k))
        .map(k => ({ id: k, label: k, icon: User, defaultText: "", content: examData[k], enabled: true, isCustom: true }));
      return [...base, ...extras];
    }
    return SECTIONS.map(s => ({ ...s, content: s.defaultText, enabled: true }));
  });

  const [customizing, setCustomizing] = useState(false);

  const handleChange = (id, content) => {
    const updated = sections.map(s => s.id === id ? { ...s, content } : s);
    setSections(updated);
    const obj = {};
    updated.filter(s => s.enabled).forEach(s => { obj[s.id] = s.content; });
    onUpdate(obj);
  };

  const markAllNormal = () => {
    const updated = sections.map(s => ({ ...s, content: s.defaultText || s.content }));
    setSections(updated);
    const obj = {};
    updated.filter(s => s.enabled).forEach(s => { obj[s.id] = s.content; });
    onUpdate(obj);
    toast.success("All sections set to normal");
  };

  const toggleEnabled = (id) => {
    const updated = sections.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s);
    setSections(updated);
    const obj = {};
    updated.filter(s => s.enabled).forEach(s => { obj[s.id] = s.content; });
    onUpdate(obj);
  };

  const addCustomSection = () => {
    const id = `custom_${Date.now()}`;
    setSections(prev => [...prev, { id, label: "Custom", icon: User, defaultText: "", content: "", enabled: true, isCustom: true }]);
  };

  const removeSection = (id) => {
    const updated = sections.filter(s => s.id !== id);
    setSections(updated);
    const obj = {};
    updated.filter(s => s.enabled).forEach(s => { obj[s.id] = s.content; });
    onUpdate(obj);
  };

  const formatForNote = () => {
    let text = "\nPHYSICAL EXAMINATION\n" + "─".repeat(40) + "\n\n";
    sections.filter(s => s.enabled && s.content).forEach(s => {
      text += `${s.label.toUpperCase()}: ${s.content}\n\n`;
    });
    return text;
  };

  const active = sections.filter(s => s.enabled);
  const normalCount = active.filter(s => s.content === s.defaultText && s.content).length;
  const abnormalCount = active.filter(s => s.content && s.content !== s.defaultText).length;

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      <div className="flex items-center justify-between gap-3 bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-200">
        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-500">{active.length} sections</span>
          {normalCount > 0 && <span className="flex items-center gap-1 text-emerald-600 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />{normalCount} normal</span>}
          {abnormalCount > 0 && <span className="flex items-center gap-1 text-rose-600 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />{abnormalCount} abnormal</span>}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={markAllNormal}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
          >
            All Normal
          </button>
          <button
            onClick={() => setCustomizing(c => !c)}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${customizing ? "bg-slate-200 border-slate-300 text-slate-700" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-100"}`}
            title="Customize sections"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => { onAddToNote(formatForNote()); toast.success("Added to note"); }}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors flex items-center gap-1"
          >
            <Check className="w-3 h-3" /> Save to Note
          </button>
        </div>
      </div>

      {/* Customize panel */}
      <AnimatePresence>
        {customizing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-3">
              <p className="text-xs font-semibold text-slate-600 mb-2">Toggle exam sections</p>
              <div className="flex flex-wrap gap-2">
                {sections.map(s => (
                  <button
                    key={s.id}
                    onClick={() => toggleEnabled(s.id)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                      s.enabled
                        ? "bg-white border-emerald-300 text-emerald-700"
                        : "bg-slate-100 border-slate-200 text-slate-400 line-through"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
                <button
                  onClick={addCustomSection}
                  className="px-2.5 py-1 rounded-full text-xs font-medium border border-dashed border-slate-300 text-slate-500 hover:border-slate-400 hover:text-slate-700 transition-all flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sections */}
      <div className="space-y-1.5">
        {active.map((section, idx) => (
          <SectionRow
            key={section.id}
            section={section}
            onChange={handleChange}
            isCustom={section.isCustom}
            onRemove={removeSection}
          />
        ))}
      </div>

      {active.length === 0 && (
        <div className="text-center py-8 text-slate-400 text-sm">
          No sections enabled. Use customize to add sections.
        </div>
      )}
    </div>
  );
}