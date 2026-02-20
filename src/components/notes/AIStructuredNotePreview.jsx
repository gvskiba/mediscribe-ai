import React from "react";
import { X, Check, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

// Map of field keys to friendly labels and which tabs they belong to
const FIELD_META = {
  chief_complaint:            { label: "Chief Complaint",             tab: "patient_intake" },
  summary:                    { label: "Summary",                     tab: "patient_intake" },
  history_of_present_illness: { label: "History of Present Illness",  tab: "patient_intake" },
  medical_history:            { label: "Medical History",             tab: "patient_intake" },
  review_of_systems:          { label: "Review of Systems",           tab: "review_of_systems" },
  physical_exam:              { label: "Physical Exam",               tab: "physical_exam" },
  assessment:                 { label: "Assessment",                  tab: "differential" },
  plan:                       { label: "Treatment Plan",              tab: "treatment_plan" },
  diagnoses:                  { label: "Diagnoses",                   tab: "diagnoses" },
  medications:                { label: "Medications",                 tab: "medications" },
  allergies:                  { label: "Allergies",                   tab: "patient_intake" },
  lab_findings:               { label: "Lab Findings",                tab: "labs_imaging" },
  imaging_findings:           { label: "Imaging Findings",            tab: "labs_imaging" },
};

// Tab display order
const TAB_ORDER = [
  "patient_intake", "review_of_systems", "physical_exam",
  "differential", "labs_imaging", "treatment_plan", "diagnoses", "medications"
];

function renderValue(key, value) {
  if (!value) return null;
  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    if (typeof value[0] === "object") {
      // lab_findings / imaging_findings
      return (
        <ul className="space-y-1.5 mt-1">
          {value.map((item, i) => (
            <li key={i} className="text-xs text-slate-700 bg-slate-50 rounded-md px-2 py-1.5 border border-slate-200">
              {Object.entries(item).filter(([, v]) => v).map(([k, v]) => (
                <span key={k} className="mr-2"><span className="font-medium text-slate-500">{k.replace(/_/g, " ")}:</span> {String(v)}</span>
              ))}
            </li>
          ))}
        </ul>
      );
    }
    return (
      <div className="flex flex-wrap gap-1.5 mt-1">
        {value.map((v, i) => (
          <Badge key={i} variant="outline" className="text-xs text-slate-700 border-slate-300">{v}</Badge>
        ))}
      </div>
    );
  }
  return <p className="text-sm text-slate-700 mt-1 leading-relaxed whitespace-pre-wrap">{value}</p>;
}

export default function AIStructuredNotePreview({ structured, activeTab, onApply, onClose }) {
  if (!structured) return null;

  // Group fields by tab, only up to and including the activeTab
  const activeTabIndex = TAB_ORDER.indexOf(activeTab);
  const relevantTabs = activeTabIndex >= 0 ? TAB_ORDER.slice(0, activeTabIndex + 1) : TAB_ORDER;

  const grouped = {};
  Object.entries(FIELD_META).forEach(([key, meta]) => {
    if (!structured[key] || (Array.isArray(structured[key]) && structured[key].length === 0)) return;
    if (!relevantTabs.includes(meta.tab)) return;
    if (!grouped[meta.tab]) grouped[meta.tab] = [];
    grouped[meta.tab].push({ key, label: meta.label, value: structured[key] });
  });

  const tabLabels = {
    patient_intake: "Subjective",
    review_of_systems: "Review of Systems",
    physical_exam: "Physical Exam",
    differential: "Assessment",
    labs_imaging: "Labs & Imaging",
    treatment_plan: "Treatment Plan",
    diagnoses: "Diagnoses",
    medications: "Medications",
  };

  const hasData = Object.keys(grouped).length > 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white flex-shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <div>
                <h2 className="font-bold text-base">AI Structured Note</h2>
                <p className="text-blue-100 text-xs">Preview extracted data up to current tab</p>
              </div>
            </div>
            <button onClick={onClose} className="hover:bg-white/20 rounded-lg p-1.5 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 p-5 space-y-5">
            {!hasData ? (
              <div className="text-center py-12 text-slate-500">
                <FileText className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                <p className="text-sm">No structured data extracted for the current tab scope.</p>
              </div>
            ) : (
              relevantTabs.filter(t => grouped[t]).map(tabKey => (
                <div key={tabKey}>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">{tabLabels[tabKey] || tabKey}</p>
                  <div className="space-y-3">
                    {grouped[tabKey].map(({ key, label, value }) => (
                      <div key={key} className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-3">
                        <p className="text-xs font-semibold text-blue-700">{label}</p>
                        {renderValue(key, value)}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 flex-shrink-0 bg-slate-50">
            <p className="text-xs text-slate-500">{Object.values(grouped).flat().length} fields extracted</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
              <Button
                size="sm"
                onClick={onApply}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white gap-1.5"
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