import React, { useState, useRef, useEffect } from "react";
import { Search, X, ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

// Map of searchable sections with their tab targets and content fields
const SECTION_INDEX = [
  { label: "Chief Complaint", tab: "patient_intake", field: "chief_complaint", keywords: ["cc", "chief complaint", "reason for visit"] },
  { label: "History of Present Illness", tab: "patient_intake", field: "history_of_present_illness", keywords: ["hpi", "history", "present illness", "onset", "symptoms"] },
  { label: "Review of Systems", tab: "patient_intake", field: "review_of_systems", keywords: ["ros", "review of systems"] },
  { label: "Medical History", tab: "patient_intake", field: "medical_history", keywords: ["pmh", "past medical", "medical history"] },
  { label: "Vital Signs", tab: "patient_intake", field: "vital_signs", keywords: ["vitals", "bp", "blood pressure", "heart rate", "temperature", "spo2", "oxygen"] },
  { label: "Physical Exam", tab: "physical_exam", field: "physical_exam", keywords: ["pe", "physical exam", "examination", "auscultation", "palpation"] },
  { label: "Differential Diagnosis", tab: "differential", field: null, keywords: ["ddx", "differential", "differentials"] },
  { label: "Labs & Imaging", tab: "labs_imaging", field: "lab_findings", keywords: ["labs", "imaging", "lab results", "xray", "ct", "mri", "ultrasound", "cbc", "bmp", "cmp"] },
  { label: "MDM", tab: "mdm", field: "mdm", keywords: ["mdm", "medical decision making", "decision making", "complexity"] },
  { label: "Treatment Plan", tab: "treatment_plan", field: "plan", keywords: ["plan", "treatment", "management"] },
  { label: "Medications", tab: "medications", field: "medications", keywords: ["meds", "medications", "prescriptions", "drugs"] },
  { label: "Procedures", tab: "procedures", field: null, keywords: ["procedures", "procedure"] },
  { label: "Diagnoses / ICD-10", tab: "diagnoses", field: "diagnoses", keywords: ["diagnoses", "icd", "icd-10", "coding", "dx"] },
  { label: "Clinical Note", tab: "clinical_note", field: null, keywords: ["note", "soap", "structured note", "template"] },
  { label: "Assessment", tab: "clinical_note", field: "assessment", keywords: ["assessment", "impression", "a&p"] },
  { label: "Disposition", tab: "disposition_plan", field: "disposition_plan", keywords: ["disposition", "admit", "discharge", "transfer"] },
  { label: "Discharge Summary", tab: "discharge_summary", field: "discharge_summary", keywords: ["discharge", "discharge summary", "instructions"] },
  { label: "Patient Education", tab: "patient_education", field: null, keywords: ["patient education", "education", "handout"] },
  { label: "AI Analysis", tab: "ai_analysis", field: null, keywords: ["ai", "analysis", "ai analysis"] },
  { label: "Review & Export", tab: "finalize", field: null, keywords: ["finalize", "export", "sign", "review"] },
];

export default function NoteQuickFind({ note, onNavigate }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);

  const results = query.trim().length < 1 ? [] : (() => {
    const q = query.toLowerCase();
    return SECTION_INDEX.filter(section => {
      // Match section label or keywords
      if (section.label.toLowerCase().includes(q)) return true;
      if (section.keywords.some(k => k.includes(q))) return true;
      // Match note content
      if (section.field && note) {
        const val = note[section.field];
        if (typeof val === "string" && val.toLowerCase().includes(q)) return true;
        if (Array.isArray(val) && val.some(v => typeof v === "string" && v.toLowerCase().includes(q))) return true;
      }
      return false;
    });
  })();

  const handleSelect = (tab) => {
    onNavigate(tab);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  };

  // Keyboard shortcut: Ctrl+F or Cmd+F
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setQuery("");
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const getSnippet = (section) => {
    if (!section.field || !note) return null;
    const val = note[section.field];
    if (!val) return null;
    const text = Array.isArray(val) ? val.join(", ") : val;
    const q = query.toLowerCase();
    const idx = text.toLowerCase().indexOf(q);
    if (idx === -1) return null;
    const start = Math.max(0, idx - 20);
    const end = Math.min(text.length, idx + query.length + 40);
    return (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
  };

  return (
    <div className="relative">
      <div className={`flex items-center gap-2 rounded-lg border transition-all ${open ? "border-blue-400 ring-2 ring-blue-100 bg-white" : "border-slate-200 bg-slate-50 hover:border-slate-300"} px-2.5 py-1.5`}>
        <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Quick find… (⌘F)"
          className="text-xs text-slate-700 placeholder:text-slate-400 bg-transparent border-0 outline-none w-36 focus:w-52 transition-all duration-200"
        />
        {query && (
          <button onClick={() => { setQuery(""); setOpen(false); }} className="text-slate-400 hover:text-slate-600">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && results.length > 0 && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); setQuery(""); }} />
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 top-10 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden"
            >
              <div className="px-3 py-2 border-b border-slate-100 text-xs text-slate-400 font-medium">
                {results.length} section{results.length !== 1 ? "s" : ""} found
              </div>
              <div className="max-h-72 overflow-y-auto">
                {results.map((section, i) => {
                  const snippet = getSnippet(section);
                  return (
                    <button
                      key={i}
                      onClick={() => handleSelect(section.tab)}
                      className="w-full flex items-start gap-2.5 px-3 py-2.5 hover:bg-blue-50 text-left transition-colors group border-b border-slate-50 last:border-0"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 group-hover:text-blue-700">{section.label}</p>
                        {snippet && (
                          <p className="text-xs text-slate-500 mt-0.5 truncate">{snippet}</p>
                        )}
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 flex-shrink-0 mt-0.5" />
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}