import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Activity, Eye, Heart, Wind, User, Brain, Plus, X, Check, Ear, Bone, Droplets, Thermometer, Zap, Shield
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const SYSTEMS = [
  { id: "constitutional",    label: "Constitutional",    icon: Thermometer, color: "slate",    normal: "Denies fever, chills, fatigue, weight loss, or night sweats." },
  { id: "eyes",              label: "Eyes",              icon: Eye,         color: "sky",      normal: "Denies vision changes, eye pain, redness, or discharge." },
  { id: "ent",               label: "ENT",               icon: Ear,         color: "teal",     normal: "Denies hearing loss, ear pain, nasal congestion, sore throat, or dysphagia." },
  { id: "cardiovascular",    label: "Cardiovascular",    icon: Heart,       color: "rose",     normal: "Denies chest pain, palpitations, orthopnea, or lower extremity edema." },
  { id: "respiratory",       label: "Respiratory",       icon: Wind,        color: "blue",     normal: "Denies shortness of breath, cough, wheezing, or hemoptysis." },
  { id: "gastrointestinal",  label: "Gastrointestinal",  icon: Activity,    color: "amber",    normal: "Denies nausea, vomiting, diarrhea, constipation, abdominal pain, or blood in stool." },
  { id: "genitourinary",     label: "Genitourinary",     icon: Droplets,    color: "cyan",     normal: "Denies dysuria, hematuria, frequency, urgency, or incontinence." },
  { id: "musculoskeletal",   label: "Musculoskeletal",   icon: Bone,        color: "orange",   normal: "Denies joint pain, swelling, stiffness, back pain, or muscle weakness." },
  { id: "neurological",      label: "Neurological",      icon: Brain,       color: "purple",   normal: "Denies headaches, dizziness, syncope, seizures, weakness, or paresthesias." },
  { id: "psychiatric",       label: "Psychiatric",       icon: Zap,         color: "violet",   normal: "Denies depression, anxiety, mood changes, or sleep disturbances." },
  { id: "endocrine",         label: "Endocrine",         icon: Activity,    color: "yellow",   normal: "Denies polyuria, polydipsia, heat/cold intolerance, or changes in hair/skin." },
  { id: "hematologic",       label: "Hematologic",       icon: Droplets,    color: "red",      normal: "Denies easy bruising, bleeding, lymphadenopathy, or history of blood clots." },
  { id: "integumentary",     label: "Integumentary",     icon: Shield,      color: "green",    normal: "Denies rashes, skin lesions, pruritus, or changes in moles." },
];

const COLOR_MAP = {
  slate:  { dot: "bg-slate-400",  badge: "bg-slate-100 text-slate-700",  ring: "focus:ring-slate-200" },
  sky:    { dot: "bg-sky-400",    badge: "bg-sky-100 text-sky-700",      ring: "focus:ring-sky-100" },
  teal:   { dot: "bg-teal-400",   badge: "bg-teal-100 text-teal-700",    ring: "focus:ring-teal-100" },
  rose:   { dot: "bg-rose-400",   badge: "bg-rose-100 text-rose-700",    ring: "focus:ring-rose-100" },
  blue:   { dot: "bg-blue-400",   badge: "bg-blue-100 text-blue-700",    ring: "focus:ring-blue-100" },
  amber:  { dot: "bg-amber-400",  badge: "bg-amber-100 text-amber-700",  ring: "focus:ring-amber-100" },
  cyan:   { dot: "bg-cyan-400",   badge: "bg-cyan-100 text-cyan-700",    ring: "focus:ring-cyan-100" },
  orange: { dot: "bg-orange-400", badge: "bg-orange-100 text-orange-700",ring: "focus:ring-orange-100" },
  purple: { dot: "bg-purple-400", badge: "bg-purple-100 text-purple-700",ring: "focus:ring-purple-100" },
  violet: { dot: "bg-violet-400", badge: "bg-violet-100 text-violet-700",ring: "focus:ring-violet-100" },
  yellow: { dot: "bg-yellow-400", badge: "bg-yellow-100 text-yellow-700",ring: "focus:ring-yellow-100" },
  red:    { dot: "bg-red-400",    badge: "bg-red-100 text-red-700",      ring: "focus:ring-red-100" },
  green:  { dot: "bg-green-400",  badge: "bg-green-100 text-green-700",  ring: "focus:ring-green-100" },
};

function initSections(rosData) {
  if (rosData && typeof rosData === "object" && !Array.isArray(rosData)) {
    return SYSTEMS.map(s => ({
      ...s,
      status: rosData[s.id] !== undefined
        ? (rosData[s.id] === s.normal ? "normal" : rosData[s.id] ? "abnormal" : "not_assessed")
        : "not_assessed",
      notes: rosData[s.id] || "",
    }));
  }
  return SYSTEMS.map(s => ({ ...s, status: "not_assessed", notes: "" }));
}

export default function ReviewOfSystemsEditor({ rosData, onUpdate, onAddToNote }) {
  const [sections, setSections] = useState(() => initSections(rosData));
  const [expandedId, setExpandedId] = useState(null);
  const [addingSection, setAddingSection] = useState(false);
  const [newSectionLabel, setNewSectionLabel] = useState("");

  const save = (updated) => {
    const obj = {};
    updated.forEach(s => { if (s.status !== "not_assessed") obj[s.id] = s.notes || s.normal; });
    onUpdate(obj);
  };

  const setStatus = (id, status) => {
    const updated = sections.map(s => {
      if (s.id !== id) return s;
      const notes = status === "normal" ? s.normal : status === "abnormal" ? "" : "";
      return { ...s, status, notes };
    });
    setSections(updated);
    save(updated);
    if (status === "abnormal") setExpandedId(id);
    else if (status === "normal") setExpandedId(null);
  };

  const setNotes = (id, notes) => {
    const updated = sections.map(s => s.id === id ? { ...s, notes } : s);
    setSections(updated);
    save(updated);
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

  const deleteSection = (id) => {
    const updated = sections.filter(s => s.id !== id);
    setSections(updated);
    save(updated);
  };

  const handleAddToNote = () => {
    let text = "\n\nREVIEW OF SYSTEMS\n" + "─".repeat(40) + "\n";
    sections.filter(s => s.status !== "not_assessed").forEach(s => {
      text += `\n${s.label.toUpperCase()}: ${s.notes || s.normal}`;
    });
    onAddToNote(text);
    toast.success("ROS added to note");
  };

  const assessed = sections.filter(s => s.status !== "not_assessed");
  const normals = sections.filter(s => s.status === "normal");
  const abnormals = sections.filter(s => s.status === "abnormal");

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="w-2 h-2 rounded-full bg-slate-300" />
            {sections.length - assessed.length} not assessed
          </span>
          <span className="flex items-center gap-1.5 text-green-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            {normals.length} normal
          </span>
          <span className="flex items-center gap-1.5 text-rose-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            {abnormals.length} abnormal
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setAddingSection(true)} className="border-purple-200 text-purple-700 hover:bg-purple-50 gap-1">
            <Plus className="w-3.5 h-3.5" /> Add Section
          </Button>
          <Button size="sm" onClick={handleAddToNote} disabled={assessed.length === 0} className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5">
            <Check className="w-3.5 h-3.5" /> Add to Note
          </Button>
        </div>
      </div>

      {/* Add section inline form */}
      {addingSection && (
        <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-xl px-3 py-2">
          <input
            autoFocus
            type="text"
            value={newSectionLabel}
            onChange={(e) => setNewSectionLabel(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addCustomSection(); if (e.key === "Escape") { setAddingSection(false); setNewSectionLabel(""); } }}
            placeholder="Section name (e.g. Allergic/Immunologic)..."
            className="flex-1 text-sm bg-transparent border-0 outline-none focus:ring-0 placeholder:text-slate-400"
          />
          <button onClick={addCustomSection} className="text-purple-600 hover:text-purple-800"><Check className="w-4 h-4" /></button>
          <button onClick={() => { setAddingSection(false); setNewSectionLabel(""); }} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Systems grid */}
      <div className="grid grid-cols-1 gap-2">
        {sections.map((section, idx) => {
          const Icon = section.icon;
          const c = COLOR_MAP[section.color];
          const isExpanded = expandedId === section.id;

          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.02 }}
              className={`rounded-xl border transition-all overflow-hidden ${
                section.status === "abnormal"
                  ? "border-rose-300 bg-rose-50/50"
                  : section.status === "normal"
                  ? "border-green-200 bg-green-50/30"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-center gap-3 px-4 py-3">
                {/* Color dot + icon + label */}
                <div className="flex items-center gap-2 w-40 flex-shrink-0">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
                  <Icon className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                  <span className="text-sm font-semibold text-slate-800 truncate">{section.label}</span>
                </div>

                {/* Status toggles */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => setStatus(section.id, section.status === "normal" ? "not_assessed" : "normal")}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-all ${
                      section.status === "normal"
                        ? "bg-green-500 border-green-500 text-white"
                        : "bg-white border-slate-200 text-slate-500 hover:border-green-400 hover:text-green-700"
                    }`}
                  >
                    Normal
                  </button>
                  <button
                    onClick={() => setStatus(section.id, section.status === "abnormal" ? "not_assessed" : "abnormal")}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-all ${
                      section.status === "abnormal"
                        ? "bg-rose-500 border-rose-500 text-white"
                        : "bg-white border-slate-200 text-slate-500 hover:border-rose-400 hover:text-rose-700"
                    }`}
                  >
                    Abnormal
                  </button>
                </div>

                {/* Findings preview / input for normal */}
                <div className="flex-1 min-w-0">
                  {section.status === "normal" ? (
                    <span className="text-xs text-green-700 truncate block">{section.normal}</span>
                  ) : section.status === "abnormal" ? (
                    <input
                      type="text"
                      value={section.notes}
                      onChange={(e) => setNotes(section.id, e.target.value)}
                      placeholder={`Describe ${section.label.toLowerCase()} findings...`}
                      className="w-full text-sm text-slate-900 placeholder:text-slate-400 bg-transparent border-0 outline-none focus:ring-0 p-0"
                      autoFocus={isExpanded}
                    />
                  ) : (
                    <span className="text-xs text-slate-400 italic">Not assessed</span>
                  )}
                </div>

                {/* Delete button */}
                <button
                  onClick={() => deleteSection(section.id)}
                  className="flex-shrink-0 text-slate-300 hover:text-red-500 transition-colors ml-1"
                  title="Remove section"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Abnormal summary if any */}
      {abnormals.length > 0 && (
        <div className="bg-rose-50 rounded-xl border border-rose-200 p-4">
          <p className="text-xs font-bold text-rose-800 uppercase tracking-wide mb-2 flex items-center gap-1">
            <X className="w-3.5 h-3.5" /> Abnormal Findings
          </p>
          <div className="space-y-1">
            {abnormals.map(s => (
              <p key={s.id} className="text-sm text-rose-900">
                <span className="font-semibold">{s.label}:</span> {s.notes || "—"}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}