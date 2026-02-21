import React from "react";
import { X, Check, FileText, Sparkles, Activity, ClipboardList, Stethoscope, Target, Pill, AlertTriangle, FlaskConical, Scan } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

// Section metadata: label, icon, color, tab group
const FIELD_META = {
  chief_complaint:            { label: "Chief Complaint",            tab: "subjective",      icon: Target,        color: "blue" },
  summary:                    { label: "Clinical Summary",           tab: "subjective",      icon: FileText,      color: "blue" },
  history_of_present_illness: { label: "History of Present Illness", tab: "subjective",      icon: FileText,      color: "indigo" },
  medical_history:            { label: "Past Medical History",       tab: "subjective",      icon: FileText,      color: "slate" },
  allergies:                  { label: "Allergies",                  tab: "subjective",      icon: AlertTriangle, color: "red" },
  review_of_systems:          { label: "Review of Systems",          tab: "ros",             icon: ClipboardList, color: "violet" },
  physical_exam:              { label: "Physical Examination",       tab: "physical_exam",   icon: Stethoscope,   color: "teal" },
  assessment:                 { label: "Assessment",                 tab: "assessment",      icon: Activity,      color: "orange" },
  plan:                       { label: "Treatment Plan",             tab: "plan",            icon: FileText,      color: "emerald" },
  diagnoses:                  { label: "Diagnoses",                  tab: "diagnoses",       icon: Target,        color: "purple" },
  medications:                { label: "Medications",                tab: "medications",     icon: Pill,          color: "pink" },
  lab_findings:               { label: "Lab Findings",              tab: "labs",            icon: FlaskConical,  color: "cyan" },
  imaging_findings:           { label: "Imaging Findings",          tab: "imaging",         icon: Scan,          color: "sky" },
};

const TAB_ORDER = ["subjective", "ros", "physical_exam", "assessment", "plan", "diagnoses", "medications", "labs", "imaging"];

const TAB_LABELS = {
  subjective:    "Subjective",
  ros:           "Review of Systems",
  physical_exam: "Physical Exam",
  assessment:    "Assessment",
  plan:          "Plan",
  diagnoses:     "Diagnoses",
  medications:   "Medications",
  labs:          "Labs & Imaging",
  imaging:       "Labs & Imaging",
};

// Merge labs and imaging under one group label
const DISPLAY_GROUPS = {
  subjective:    { label: "Subjective / History",  color: "blue" },
  ros:           { label: "Review of Systems",      color: "violet" },
  physical_exam: { label: "Physical Exam",          color: "teal" },
  assessment:    { label: "Assessment",             color: "orange" },
  plan:          { label: "Treatment Plan",         color: "emerald" },
  diagnoses:     { label: "Diagnoses",              color: "purple" },
  medications:   { label: "Medications",            color: "pink" },
  labs:          { label: "Labs & Imaging",         color: "cyan" },
};

const COLOR_MAP = {
  blue:    { header: "bg-blue-50 border-blue-200 text-blue-900",    label: "text-blue-700",    dot: "bg-blue-500" },
  indigo:  { header: "bg-indigo-50 border-indigo-200 text-indigo-900", label: "text-indigo-700", dot: "bg-indigo-500" },
  slate:   { header: "bg-slate-50 border-slate-200 text-slate-900", label: "text-slate-600",   dot: "bg-slate-400" },
  red:     { header: "bg-red-50 border-red-200 text-red-900",       label: "text-red-700",     dot: "bg-red-500" },
  violet:  { header: "bg-violet-50 border-violet-200 text-violet-900", label: "text-violet-700", dot: "bg-violet-500" },
  teal:    { header: "bg-teal-50 border-teal-200 text-teal-900",    label: "text-teal-700",    dot: "bg-teal-500" },
  orange:  { header: "bg-orange-50 border-orange-200 text-orange-900", label: "text-orange-700", dot: "bg-orange-500" },
  emerald: { header: "bg-emerald-50 border-emerald-200 text-emerald-900", label: "text-emerald-700", dot: "bg-emerald-500" },
  purple:  { header: "bg-purple-50 border-purple-200 text-purple-900", label: "text-purple-700", dot: "bg-purple-500" },
  pink:    { header: "bg-pink-50 border-pink-200 text-pink-900",    label: "text-pink-700",    dot: "bg-pink-500" },
  cyan:    { header: "bg-cyan-50 border-cyan-200 text-cyan-900",    label: "text-cyan-700",    dot: "bg-cyan-500" },
  sky:     { header: "bg-sky-50 border-sky-200 text-sky-900",       label: "text-sky-700",     dot: "bg-sky-500" },
};

const GROUP_HEADER_COLORS = {
  blue:    "from-blue-600 to-blue-700",
  violet:  "from-violet-600 to-purple-600",
  teal:    "from-teal-600 to-cyan-600",
  orange:  "from-orange-500 to-amber-500",
  emerald: "from-emerald-600 to-green-600",
  purple:  "from-purple-600 to-indigo-600",
  pink:    "from-pink-500 to-rose-500",
  cyan:    "from-cyan-600 to-teal-600",
};

function renderValue(key, value, color) {
  const c = COLOR_MAP[color] || COLOR_MAP.slate;

  if (!value) return null;

  if (Array.isArray(value)) {
    if (value.length === 0) return null;

    // Objects: lab/imaging findings
    if (typeof value[0] === "object") {
      return (
        <div className="space-y-2 mt-2">
          {value.map((item, i) => (
            <div key={i} className="bg-white rounded-lg border border-slate-200 px-3 py-2.5 text-sm">
              {Object.entries(item).filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="flex items-start gap-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide min-w-[90px] mt-0.5">
                    {k.replace(/_/g, " ")}
                  </span>
                  <span className="text-slate-800 text-sm">{String(v)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      );
    }

    // String arrays: diagnoses, medications, allergies
    return (
      <div className="flex flex-wrap gap-1.5 mt-2">
        {value.map((v, i) => (
          <Badge key={i} variant="outline" className={`text-xs font-medium px-2.5 py-1 border ${c.label} border-current bg-white`}>
            {v}
          </Badge>
        ))}
      </div>
    );
  }

  // Long text
  return (
    <p className="text-sm text-slate-800 mt-2 leading-relaxed whitespace-pre-wrap">{value}</p>
  );
}

function FieldCard({ label, value, icon: Icon, color }) {
  const c = COLOR_MAP[color] || COLOR_MAP.slate;
  if (!value || (Array.isArray(value) && value.length === 0)) return null;

  return (
    <div className={`rounded-xl border overflow-hidden ${c.header.includes("border") ? "" : ""}`}>
      <div className={`flex items-center gap-2 px-4 py-2.5 border-b ${c.header}`}>
        {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
        <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
      </div>
      <div className="px-4 py-3 bg-white">
        {renderValue(label, value, color)}
      </div>
    </div>
  );
}

export default function AIStructuredNotePreview({ structured, activeTab, onApply, onClose }) {
  if (!structured) return null;

  const activeTabIndex = TAB_ORDER.indexOf(activeTab);
  const relevantTabs = activeTabIndex >= 0 ? TAB_ORDER.slice(0, activeTabIndex + 1) : TAB_ORDER;

  // Group fields
  const grouped = {};
  Object.entries(FIELD_META).forEach(([key, meta]) => {
    const val = structured[key];
    if (!val || (Array.isArray(val) && val.length === 0)) return;
    // Merge imaging into labs group
    const groupKey = meta.tab === "imaging" ? "labs" : meta.tab;
    if (!relevantTabs.includes(meta.tab)) return;
    if (!grouped[groupKey]) grouped[groupKey] = [];
    grouped[groupKey].push({ key, label: meta.label, value: val, icon: meta.icon, color: meta.color });
  });

  const totalFields = Object.values(grouped).flat().length;
  const hasData = totalFields > 0;

  // Unique ordered groups (no duplicates for labs/imaging)
  const orderedGroups = [...new Set(TAB_ORDER.map(t => t === "imaging" ? "labs" : t))].filter(g => grouped[g]);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-base">AI Structured Note</h2>
                <p className="text-blue-100 text-xs mt-0.5">{totalFields} fields extracted — review before applying</p>
              </div>
            </div>
            <button onClick={onClose} className="hover:bg-white/20 rounded-lg p-1.5 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 p-5 space-y-6 bg-slate-50">
            {!hasData ? (
              <div className="text-center py-16 text-slate-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-sm font-medium">No structured data extracted for the current scope.</p>
                <p className="text-xs text-slate-400 mt-1">Try advancing further through the note tabs first.</p>
              </div>
            ) : (
              orderedGroups.map(groupKey => {
                const group = DISPLAY_GROUPS[groupKey] || { label: groupKey, color: "slate" };
                const fields = grouped[groupKey];
                const gradClass = GROUP_HEADER_COLORS[group.color] || "from-slate-500 to-slate-600";

                return (
                  <div key={groupKey} className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                    {/* Group header */}
                    <div className={`bg-gradient-to-r ${gradClass} px-4 py-2.5 flex items-center gap-2`}>
                      <span className="text-white font-bold text-sm tracking-wide">{group.label}</span>
                      <span className="ml-auto text-white/70 text-xs">{fields.length} field{fields.length > 1 ? "s" : ""}</span>
                    </div>
                    {/* Fields */}
                    <div className="bg-slate-50 p-3 space-y-3">
                      {fields.map(({ key, label, value, icon, color }) => (
                        <FieldCard key={key} label={label} value={value} icon={icon} color={color} />
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 flex-shrink-0 bg-white">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-xs text-slate-500">{totalFields} field{totalFields !== 1 ? "s" : ""} ready to apply</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl">Dismiss</Button>
              <Button
                size="sm"
                onClick={onApply}
                disabled={!hasData}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white gap-1.5 rounded-xl"
              >
                <Check className="w-3.5 h-3.5" /> Apply to Note
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}