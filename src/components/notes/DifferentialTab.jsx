import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { X, Plus, Sparkles, Loader2, Search, ChevronRight, Star, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const T = {
  bg: "#080b10", surface: "#0e1320", surface_2: "#141b2d",
  card: "#0f1624", card_hover: "#141f32",
  border: "#1a2236", border_2: "#243048",
  text: "#dde2ef", muted: "#4e5a78", dim: "#2d3a56",
  teal: "#00cca3", teal_dim: "#003328",
  blue: "#3b82f6", blue_dim: "#0d2040",
  amber: "#f59e0b", amber_dim: "#2a1a00",
  green: "#34d399", green_dim: "#002a1a",
  red: "#f87171", red_dim: "#2a0f0f",
  purple: "#a78bfa", purple_dim: "#1a1040",
};

const LIKELIHOOD_OPTIONS = [
  { value: "most_likely", label: "Most Likely", color: T.amber, bg: T.amber_dim },
  { value: "possible",    label: "Possible",    color: T.blue,  bg: T.blue_dim  },
  { value: "less_likely", label: "Less Likely", color: T.muted, bg: T.surface_2 },
  { value: "rule_out",    label: "Rule Out",    color: T.red,   bg: T.red_dim   },
];

const STATUS_OPTIONS = ["Working", "Probable", "Confirmed"];

// ─── Diagnosis Search Modal ────────────────────────────────────────────────────
function DiagnosisSearchModal({ open, onClose, onAdd, target, onTargetChange }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem("saved_diagnoses") || "[]"); } catch { return []; }
  });
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (open) { setQuery(""); setResults([]); setSelected(null); setTimeout(() => inputRef.current?.focus(), 80); }
  }, [open]);

  useEffect(() => {
    if (!query || query.length < 2) { setResults([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search?sf=code,name&df=code,name&terms=${encodeURIComponent(query)}&maxList=20`);
        const data = await res.json();
        const items = (data[3] || []).map(([code, name]) => ({ icd10: code, name }));
        setResults(items);
      } catch { setResults([]); }
      setLoading(false);
    }, 250);
  }, [query]);

  const toggleFavorite = (item) => {
    const key = item.icd10;
    let newFavs;
    if (favorites.find(f => f.icd10 === key)) {
      newFavs = favorites.filter(f => f.icd10 !== key);
    } else {
      newFavs = [...favorites, item];
    }
    setFavorites(newFavs);
    localStorage.setItem("saved_diagnoses", JSON.stringify(newFavs));
  };

  const handleConfirm = () => {
    if (!selected) return;
    onAdd(selected, target);
    setSelected(null);
    onClose();
  };

  const handleCustomAdd = () => {
    if (!query.trim()) return;
    onAdd({ name: query.trim(), icd10: "" }, target);
    onClose();
  };

  const listToShow = query.length < 2 ? favorites : results;

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.14 }}
        onClick={e => e.stopPropagation()}
        style={{ width: "min(540px, 96vw)", maxHeight: "80vh", background: T.card, border: `1px solid ${T.border_2}`, borderRadius: "12px", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}
      >
        {/* Header */}
        <div style={{ padding: "16px 18px 0", borderBottom: `1px solid ${T.border}`, paddingBottom: "14px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontFamily: "serif", fontSize: "17px", fontStyle: "italic", color: T.text, flex: 1 }}>Add Diagnosis</div>
          <button onClick={onClose} style={{ width: 26, height: 26, borderRadius: 5, border: `1px solid ${T.border_2}`, background: "transparent", color: T.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 12, flex: 1, overflow: "hidden" }}>
          {/* Search input */}
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: T.muted }} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by diagnosis name or ICD-10 code…"
              style={{ width: "100%", background: T.bg, border: `1px solid ${T.border_2}`, borderRadius: 8, color: T.text, fontFamily: "sans-serif", fontSize: 14, padding: "10px 14px 10px 36px", outline: "none", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = T.teal}
              onBlur={e => e.target.style.borderColor = T.border_2}
            />
            {loading && <Loader2 size={13} style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", color: T.teal, animation: "spin 1s linear infinite" }} />}
          </div>

          {/* Add to selector */}
          <div>
            <div style={{ fontFamily: "Geist Mono, monospace", fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: T.muted, marginBottom: 6 }}>Add to</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[
                { value: "initial", label: "💡 Initial Impression" },
                { value: "final_primary", label: "📌 Final — Primary" },
                { value: "final_secondary", label: "📋 Final — Secondary" },
                { value: "both", label: "↕ Both" },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => onTargetChange(opt.value)}
                  style={{ fontFamily: "Geist Mono, monospace", fontSize: "9px", letterSpacing: "0.06em", textTransform: "uppercase", padding: "5px 10px", borderRadius: 5, border: `1px solid ${target === opt.value ? T.teal : T.border_2}`, background: target === opt.value ? T.teal_dim : "transparent", color: target === opt.value ? T.teal : T.muted, cursor: "pointer", transition: "all 0.12s" }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Results */}
          <div style={{ flex: 1, overflowY: "auto", maxHeight: "300px", display: "flex", flexDirection: "column", gap: 2 }}>
            {query.length < 2 && favorites.length === 0 && (
              <div style={{ textAlign: "center", padding: "28px 0", color: T.dim, fontSize: 12 }}>
                <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.4 }}>🔍</div>
                <div style={{ fontFamily: "Geist Mono, monospace", fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase" }}>Type to search ICD-10 diagnoses</div>
              </div>
            )}
            {query.length < 2 && favorites.length > 0 && (
              <div style={{ fontFamily: "Geist Mono, monospace", fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: T.muted, padding: "4px 0 8px" }}>Saved</div>
            )}
            {listToShow.map((item, idx) => (
              <div
                key={idx}
                onClick={() => setSelected(item)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 7, cursor: "pointer",
                  background: selected?.icd10 === item.icd10 ? T.teal_dim : "transparent",
                  border: `1px solid ${selected?.icd10 === item.icd10 ? T.teal + "44" : "transparent"}`,
                  transition: "all 0.1s",
                }}
                onMouseEnter={e => { if (selected?.icd10 !== item.icd10) e.currentTarget.style.background = T.surface_2; }}
                onMouseLeave={e => { if (selected?.icd10 !== item.icd10) e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                </div>
                {item.icd10 && (
                  <div style={{ fontFamily: "Geist Mono, monospace", fontSize: "10px", color: T.blue, background: T.blue_dim, border: `1px solid ${T.blue}44`, padding: "3px 8px", borderRadius: 4, flexShrink: 0 }}>{item.icd10}</div>
                )}
                <button
                  onClick={e => { e.stopPropagation(); toggleFavorite(item); }}
                  style={{ background: "transparent", border: "none", color: favorites.find(f => f.icd10 === item.icd10) ? T.amber : T.dim, cursor: "pointer", fontSize: 14, flexShrink: 0, padding: 2 }}
                >
                  {favorites.find(f => f.icd10 === item.icd10) ? "★" : "☆"}
                </button>
              </div>
            ))}
            {query.length >= 2 && !loading && results.length === 0 && (
              <div style={{ textAlign: "center", padding: "28px 0", color: T.dim }}>
                <div style={{ fontSize: 24, opacity: 0.3 }}>🔍</div>
                <div style={{ fontFamily: "Geist Mono, monospace", fontSize: "10px", marginTop: 6 }}>No results — add as custom below</div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 18px", borderTop: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 8 }}>
          {query.length >= 2 && (
            <button
              onClick={handleCustomAdd}
              style={{ fontFamily: "Geist Mono, monospace", fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", padding: "6px 12px", borderRadius: 6, border: `1px solid ${T.border_2}`, color: T.muted, background: "transparent", cursor: "pointer" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.teal; e.currentTarget.style.color = T.teal; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border_2; e.currentTarget.style.color = T.muted; }}
            >
              Add "{query.trim()}" as Custom
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button
            onClick={handleConfirm}
            disabled={!selected}
            style={{ fontFamily: "Geist Mono, monospace", fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", padding: "6px 14px", borderRadius: 6, background: selected ? T.teal : T.surface_2, color: selected ? T.bg : T.dim, border: `1px solid ${selected ? T.teal : T.border_2}`, cursor: selected ? "pointer" : "not-allowed", transition: "all 0.12s" }}
          >
            Add Selected
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Rank Badge ────────────────────────────────────────────────────────────────
function RankBadge({ rank }) {
  const style = rank === 1
    ? { background: T.amber, color: T.bg }
    : rank === 2
    ? { background: T.amber_dim, color: T.amber, border: `1px solid ${T.amber}55` }
    : { background: T.surface_2, color: T.muted, border: `1px solid ${T.border_2}` };
  return (
    <div style={{ width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Geist Mono, monospace", fontSize: "10px", fontWeight: 600, flexShrink: 0, ...style }}>
      {rank}
    </div>
  );
}

// ─── Differential Card ────────────────────────────────────────────────────────
function DifferentialCard({ item, index, onUpdate, onRemove, onPromote }) {
  const lk = LIKELIHOOD_OPTIONS.find(o => o.value === item.likelihood) || LIKELIHOOD_OPTIONS[1];

  return (
    <div
      style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: "12px 14px", marginBottom: 4, display: "flex", flexDirection: "column", gap: 10 }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = T.border_2; e.currentTarget.style.background = T.card_hover; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.card; }}
    >
      {/* Row 1: Rank, Name, AI badge, Promote, Remove */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <RankBadge rank={index + 1} />
        <input
          value={item.name || ""}
          onChange={e => onUpdate({ ...item, name: e.target.value })}
          placeholder="Diagnosis name"
          style={{ flex: 1, background: "transparent", border: "none", color: T.text, fontFamily: "sans-serif", fontSize: 13, fontWeight: 500, outline: "none", padding: "2px 4px", borderRadius: 4 }}
          onFocus={e => e.target.style.background = T.surface_2}
          onBlur={e => e.target.style.background = "transparent"}
        />
        {item.source === "ai" && (
          <div style={{ fontFamily: "Geist Mono, monospace", fontSize: "8px", letterSpacing: "0.1em", color: T.teal, background: T.teal_dim, border: `1px solid ${T.teal}33`, padding: "2px 6px", borderRadius: 3, flexShrink: 0 }}>AI</div>
        )}
        <button
          onClick={() => onPromote(item)}
          title="Promote to Final Diagnosis"
          style={{ fontFamily: "Geist Mono, monospace", fontSize: "9px", letterSpacing: "0.06em", textTransform: "uppercase", color: T.dim, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 3, flexShrink: 0, padding: "2px 4px" }}
          onMouseEnter={e => e.currentTarget.style.color = T.teal}
          onMouseLeave={e => e.currentTarget.style.color = T.dim}
        >
          → Final <ArrowRight size={10} />
        </button>
        <button
          onClick={() => onRemove(item.id)}
          style={{ background: "none", border: "none", color: T.dim, cursor: "pointer", display: "flex", alignItems: "center", padding: 2 }}
          onMouseEnter={e => e.currentTarget.style.color = T.red}
          onMouseLeave={e => e.currentTarget.style.color = T.dim}
        >
          <X size={14} />
        </button>
      </div>

      {/* Row 2: ICD-10, Likelihood */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <input
          value={item.icd10 || ""}
          onChange={e => onUpdate({ ...item, icd10: e.target.value })}
          placeholder="ICD-10"
          style={{ fontFamily: "Geist Mono, monospace", fontSize: "10px", color: T.blue, background: T.blue_dim, border: `1px solid ${T.blue}33`, padding: "3px 8px", borderRadius: 4, width: 100, outline: "none" }}
          onFocus={e => e.target.style.borderColor = T.blue}
          onBlur={e => e.target.style.borderColor = `${T.blue}33`}
        />
        <div style={{ display: "flex", gap: 3 }}>
          {LIKELIHOOD_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => onUpdate({ ...item, likelihood: opt.value })}
              style={{
                fontFamily: "Geist Mono, monospace", fontSize: "9px", letterSpacing: "0.06em", textTransform: "uppercase",
                padding: "3px 7px", borderRadius: 4, cursor: "pointer", transition: "all 0.1s",
                background: item.likelihood === opt.value ? opt.bg : "transparent",
                color: item.likelihood === opt.value ? opt.color : T.dim,
                border: `1px solid ${item.likelihood === opt.value ? opt.color + "55" : T.border_2}`,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Row 3: Reasoning */}
      <textarea
        value={item.reasoning || ""}
        onChange={e => onUpdate({ ...item, reasoning: e.target.value })}
        placeholder="Clinical reasoning for this diagnosis…"
        style={{ background: T.surface_2, border: `1px solid ${T.border}`, borderRadius: 5, color: T.muted, fontFamily: "sans-serif", fontSize: "12px", padding: "7px 10px", minHeight: "40px", resize: "none", outline: "none", width: "100%", boxSizing: "border-box" }}
        onFocus={e => e.target.style.borderColor = T.amber}
        onBlur={e => e.target.style.borderColor = T.border}
      />

      {/* AI confidence bar */}
      {item.source === "ai" && item.confidence != null && (
        <div>
          <div style={{ fontFamily: "Geist Mono, monospace", fontSize: "9px", color: T.teal, letterSpacing: "0.06em", marginBottom: 4 }}>
            AI Confidence: {item.confidence}%
          </div>
          <div style={{ height: 3, background: T.border_2, borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${item.confidence}%`, background: T.teal, borderRadius: 2 }} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Secondary Dx Row ─────────────────────────────────────────────────────────
function SecondaryDxRow({ item, onUpdate, onRemove }) {
  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: T.card, border: `1px solid ${T.border}`, borderRadius: 7, marginBottom: 4, transition: "all 0.1s" }}
      onMouseEnter={e => e.currentTarget.style.borderColor = T.border_2}
      onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
    >
      <span style={{ color: T.dim, fontSize: 14, flexShrink: 0 }}>⠿</span>
      <input
        value={item.name || ""}
        onChange={e => onUpdate({ ...item, name: e.target.value })}
        placeholder="Secondary diagnosis"
        style={{ flex: 1, background: "transparent", border: "none", color: T.text, fontFamily: "sans-serif", fontSize: 13, outline: "none" }}
      />
      <input
        value={item.icd10 || ""}
        onChange={e => onUpdate({ ...item, icd10: e.target.value })}
        placeholder="ICD-10"
        style={{ fontFamily: "Geist Mono, monospace", fontSize: "10px", color: T.blue, background: T.blue_dim, border: `1px solid ${T.blue}33`, padding: "3px 8px", borderRadius: 4, width: 90, outline: "none" }}
      />
      <select
        value={item.type || ""}
        onChange={e => onUpdate({ ...item, type: e.target.value })}
        style={{ fontFamily: "Geist Mono, monospace", fontSize: "9px", textTransform: "uppercase", background: T.surface_2, border: `1px solid ${T.border_2}`, color: T.muted, padding: "3px 6px", borderRadius: 4, width: 110, outline: "none" }}
      >
        <option value="">Type…</option>
        <option value="Comorbidity">Comorbidity</option>
        <option value="Complication">Complication</option>
        <option value="Incidental">Incidental</option>
        <option value="Chronic">Chronic</option>
      </select>
      {item.source === "ai" && (
        <div style={{ fontFamily: "Geist Mono, monospace", fontSize: "8px", color: T.teal, background: T.teal_dim, border: `1px solid ${T.teal}33`, padding: "2px 5px", borderRadius: 3, flexShrink: 0 }}>AI</div>
      )}
      <button
        onClick={() => onRemove(item.id)}
        style={{ background: "none", border: "none", color: T.dim, cursor: "pointer", flexShrink: 0 }}
        onMouseEnter={e => e.currentTarget.style.color = T.red}
        onMouseLeave={e => e.currentTarget.style.color = T.dim}
      >
        <X size={14} />
      </button>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function DifferentialTab({ note, noteId, queryClient }) {
  const differentials = note?.differentials || [];
  const [primaryDx, setPrimaryDx] = useState({ name: "", icd10: "", status: "Working", notes: "", source: "manual" });
  const [secondaryDx, setSecondaryDx] = useState([]);
  const [initialReasoning, setInitialReasoning] = useState("");
  const [finalImpression, setFinalImpression] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTarget, setModalTarget] = useState("initial");
  const [aiState, setAiState] = useState("idle"); // idle | analyzing | done
  const [aiInitialSuggestions, setAiInitialSuggestions] = useState([]);
  const [aiFinalSuggestions, setAiFinalSuggestions] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [selectedInitialSuggestions, setSelectedInitialSuggestions] = useState(new Set());
  const [selectedFinalSuggestions, setSelectedFinalSuggestions] = useState({ primary: false, secondary: new Set() });

  // Sync from note on load
  useEffect(() => {
    if (!note) return;
    if (note.clinical_impression) setFinalImpression(note.clinical_impression);
    if (note.assessment) setInitialReasoning(note.assessment);
    // Parse secondary dx from diagnoses[1..] if structured
    const raw = note.diagnoses || [];
    const secondary = raw.slice(1).map((d, i) => ({ id: `sec_${i}`, name: d, icd10: "", type: "", source: "manual" }));
    setSecondaryDx(secondary);
    if (raw[0]) setPrimaryDx(prev => ({ ...prev, name: raw[0] }));
  }, [note?.id]);

  const uid = () => Math.random().toString(36).slice(2, 9);

  const updateNote = (patch) => {
    queryClient.setQueryData(["note", noteId], old => ({ ...old, ...patch }));
    base44.entities.ClinicalNote.update(noteId, patch);
  };

  // ── Differentials ─────────────────────────────────────────────────────────
  const updateDifferential = (updated) => {
    const newList = differentials.map(d => d.id === updated.id ? updated : d);
    updateNote({ differentials: newList });
  };

  const removeDifferential = (id) => {
    updateNote({ differentials: differentials.filter(d => d.id !== id) });
  };

  const promoteToFinal = (item) => {
    const newSec = [...secondaryDx, { id: uid(), name: item.name, icd10: item.icd10 || "", type: "manual", source: "manual" }];
    setSecondaryDx(newSec);
    saveFinalToNote(primaryDx, newSec, finalImpression);
    toast.success(`→ "${item.name}" added to Final Secondary Dx`);
  };

  // ── Final Diagnosis ───────────────────────────────────────────────────────
  const saveFinalToNote = (primary, secondary, impression) => {
    const allDiagnoses = [primary.name, ...secondary.map(d => d.icd10 ? `${d.name} (${d.icd10})` : d.name)].filter(Boolean);
    updateNote({ diagnoses: allDiagnoses, clinical_impression: impression });
  };

  // ── Add from modal ─────────────────────────────────────────────────────────
  const handleAddDiagnosis = (item, target) => {
    if (target === "initial" || target === "both") {
      const newDiff = { id: uid(), name: item.name, icd10: item.icd10 || "", likelihood: "possible", reasoning: "", source: "manual", confidence: null };
      updateNote({ differentials: [...differentials, newDiff] });
    }
    if (target === "final_primary") {
      const updated = { ...primaryDx, name: item.name, icd10: item.icd10 || "" };
      setPrimaryDx(updated);
      saveFinalToNote(updated, secondaryDx, finalImpression);
    }
    if (target === "final_secondary" || target === "both") {
      const newSec = [...secondaryDx, { id: uid(), name: item.name, icd10: item.icd10 || "", type: "", source: "manual" }];
      setSecondaryDx(newSec);
      saveFinalToNote(primaryDx, newSec, finalImpression);
    }
    toast.success(`✅ ${item.name} added`);
  };

  // ── AI Analysis ───────────────────────────────────────────────────────────
  const runAIAnalysis = async () => {
    setAiState("analyzing");
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a clinical decision support assistant. Analyze this clinical note and return differential and final diagnosis suggestions.

Patient: ${note.patient_name || "Unknown"}
Chief Complaint: ${note.chief_complaint || "N/A"}
HPI: ${note.history_of_present_illness || "N/A"}
Physical Exam: ${note.physical_exam || "N/A"}
Assessment: ${note.assessment || "N/A"}
Labs: ${JSON.stringify(note.lab_findings || [])}
Imaging: ${JSON.stringify(note.imaging_findings || [])}

Return ONLY valid JSON with this structure:
{
  "initial_differential": [{"name": "string", "icd10": "string", "likelihood": "most_likely|possible|less_likely|rule_out", "reasoning": "string", "confidence": 0-100}],
  "final_diagnoses": {
    "primary": {"name": "string", "icd10": "string", "notes": "string"},
    "secondary": [{"name": "string", "icd10": "string", "type": "Comorbidity|Complication|Incidental|Chronic"}]
  }
}`,
        response_json_schema: {
          type: "object",
          properties: {
            initial_differential: {
              type: "array",
              items: { type: "object", properties: { name: { type: "string" }, icd10: { type: "string" }, likelihood: { type: "string" }, reasoning: { type: "string" }, confidence: { type: "number" } } }
            },
            final_diagnoses: {
              type: "object",
              properties: {
                primary: { type: "object", properties: { name: { type: "string" }, icd10: { type: "string" }, notes: { type: "string" } } },
                secondary: { type: "array", items: { type: "object", properties: { name: { type: "string" }, icd10: { type: "string" }, type: { type: "string" } } } }
              }
            }
          }
        }
      });
      const initial = result.initial_differential || [];
      const final_dx = result.final_diagnoses || null;
      setAiInitialSuggestions(initial);
      setAiFinalSuggestions(final_dx);
      // Pre-select all suggestions
      setSelectedInitialSuggestions(new Set(initial.map((_, i) => i)));
      if (final_dx) {
        setSelectedFinalSuggestions({ primary: true, secondary: new Set((final_dx.secondary || []).map((_, i) => i)) });
      }
      setAiState("done");
      toast.success("✨ AI analysis complete — review suggestions");
    } catch {
      setAiState("idle");
      toast.error("AI analysis failed — please try again");
    }
  };

  const acceptAllInitial = () => {
    const newDiffs = aiInitialSuggestions.map(s => ({ id: uid(), name: s.name, icd10: s.icd10 || "", likelihood: s.likelihood || "possible", reasoning: s.reasoning || "", source: "ai", confidence: s.confidence || null }));
    updateNote({ differentials: [...differentials, ...newDiffs] });
    setAiInitialSuggestions([]);
    toast.success("✅ Differential applied");
  };

  const acceptAllFinal = () => {
    if (!aiFinalSuggestions) return;
    const primary = { ...primaryDx, name: aiFinalSuggestions.primary?.name || primaryDx.name, icd10: aiFinalSuggestions.primary?.icd10 || primaryDx.icd10, notes: aiFinalSuggestions.primary?.notes || "", source: "ai" };
    const secondary = (aiFinalSuggestions.secondary || []).map(s => ({ id: uid(), name: s.name, icd10: s.icd10 || "", type: s.type || "", source: "ai" }));
    setPrimaryDx(primary);
    const combined = [...secondaryDx, ...secondary];
    setSecondaryDx(combined);
    saveFinalToNote(primary, combined, finalImpression);
    setAiFinalSuggestions(null);
    toast.success("✅ Final diagnoses applied");
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    updateNote({ assessment: initialReasoning, clinical_impression: finalImpression });
    saveFinalToNote(primaryDx, secondaryDx, finalImpression);
    await new Promise(r => setTimeout(r, 400));
    setSaving(false);
    setSavedAt(new Date());
    toast.success("✓ Diagnoses saved");
  };

  const MLabel = ({ children }) => (
    <div style={{ fontFamily: "Geist Mono, monospace", fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: T.muted, marginBottom: 6 }}>{children}</div>
  );

  return (
    <div style={{ position: "relative", display: "flex", minHeight: "100%", background: T.bg, fontFamily: "sans-serif" }}>

      {/* AI Loading Overlay */}
      <AnimatePresence>
        {aiState === "analyzing" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "absolute", inset: 0, background: "rgba(8,11,16,0.8)", backdropFilter: "blur(2px)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", border: `2px solid ${T.teal}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, animation: "pulse 1.4s ease-in-out infinite" }}>✨</div>
            <div style={{ fontFamily: "serif", fontSize: 18, fontStyle: "italic", color: T.text }}>Analyzing note…</div>
            <div style={{ fontFamily: "Geist Mono, monospace", fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: T.muted }}>Reviewing HPI, exam, labs, imaging & context</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── TOP ACTION BAR ─── */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 52, background: T.surface, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 10, padding: "0 22px", zIndex: 10 }}>
        <div style={{ fontFamily: "Geist Mono, monospace", fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", color: savedAt ? T.green : T.muted, display: "flex", alignItems: "center", gap: 6 }}>
          {saving ? <><Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> Saving…</> : savedAt ? <>✓ Saved</> : <>● Unsaved</>}
        </div>
        <div style={{ flex: 1 }} />
        <button
          onClick={runAIAnalysis}
          disabled={aiState === "analyzing"}
          style={{ fontFamily: "Geist Mono, monospace", fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", padding: "6px 14px", borderRadius: 6, background: T.teal_dim, color: T.teal, border: `1px solid ${T.teal}4d`, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          onMouseEnter={e => { e.currentTarget.style.background = T.teal; e.currentTarget.style.color = T.bg; }}
          onMouseLeave={e => { e.currentTarget.style.background = T.teal_dim; e.currentTarget.style.color = T.teal; }}
        >
          <Sparkles size={13} /> Analyze with AI
        </button>
        <button
          onClick={() => { setModalTarget("initial"); setModalOpen(true); }}
          style={{ fontFamily: "Geist Mono, monospace", fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", padding: "6px 14px", borderRadius: 6, background: T.teal, color: T.bg, border: `1px solid ${T.teal}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
        >
          <Plus size={13} /> Add Diagnosis
        </button>
        <button
          onClick={handleSave}
          style={{ fontFamily: "Geist Mono, monospace", fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", padding: "6px 12px", borderRadius: 6, border: `1px solid ${T.border_2}`, color: T.muted, background: "transparent", cursor: "pointer" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = T.teal; e.currentTarget.style.color = T.teal; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border_2; e.currentTarget.style.color = T.muted; }}
        >
          Save
        </button>
      </div>

      {/* ─── LEFT PANEL: Initial Impression ─── */}
      <div style={{ flex: 1, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", overflow: "hidden", marginTop: 52 }}>
        {/* Panel header */}
        <div style={{ padding: "18px 22px 14px", borderBottom: `1px solid ${T.border}`, background: T.surface, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 3, height: 18, background: T.amber, borderRadius: 2, flexShrink: 0 }} />
            <span style={{ fontSize: 18 }}>💡</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "serif", fontSize: 18, fontStyle: "italic", color: T.text }}>Initial Impression</div>
              <div style={{ fontFamily: "Geist Mono, monospace", fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", color: T.muted, marginTop: 2 }}>Working differential formed on arrival</div>
            </div>
            <div style={{ fontFamily: "Geist Mono, monospace", fontSize: "10px", color: T.amber, background: T.amber_dim, border: `1px solid ${T.amber}33`, padding: "3px 8px", borderRadius: 5 }}>
              {differentials.length} dx
            </div>
            <button
              onClick={() => { setModalTarget("initial"); setModalOpen(true); }}
              style={{ fontFamily: "Geist Mono, monospace", fontSize: "9px", letterSpacing: "0.08em", textTransform: "uppercase", padding: "5px 10px", borderRadius: 5, border: `1px solid ${T.border_2}`, color: T.muted, background: "transparent", cursor: "pointer" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.amber; e.currentTarget.style.color = T.amber; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border_2; e.currentTarget.style.color = T.muted; }}
            >+ Add</button>
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 22px 32px", display: "flex", flexDirection: "column", gap: 10 }}>
          {/* AI Banner */}
          <AnimatePresence>
            {aiInitialSuggestions.length > 0 && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                style={{ background: "rgba(0,204,163,0.08)", border: `1px solid ${T.teal}26`, borderRadius: 8, padding: "12px 14px", display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 14 }}>✨</span>
                <div style={{ fontFamily: "Geist Mono, monospace", fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: T.teal }}>AI suggested</div>
                <div style={{ fontFamily: "Geist Mono, monospace", fontSize: "10px", color: T.muted, flex: 1 }}>{aiInitialSuggestions.length} diagnoses based on your note</div>
                <button onClick={acceptAllInitial} style={{ fontFamily: "Geist Mono, monospace", fontSize: "9px", padding: "4px 10px", borderRadius: 4, background: T.teal, color: T.bg, border: `1px solid ${T.teal}`, cursor: "pointer" }}>Accept All</button>
                <button onClick={() => setAiInitialSuggestions([])} style={{ fontFamily: "Geist Mono, monospace", fontSize: "9px", padding: "4px 10px", borderRadius: 4, border: `1px solid ${T.border_2}`, color: T.muted, background: "transparent", cursor: "pointer" }}>Dismiss</button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Differentials List */}
          {differentials.length === 0 && (
            <div style={{ padding: "32px 0", textAlign: "center", opacity: 0.5 }}>
              <div style={{ fontSize: 24, marginBottom: 10 }}>💡</div>
              <div style={{ fontFamily: "serif", fontSize: 15, fontStyle: "italic", color: T.muted }}>No differential diagnoses yet</div>
              <div style={{ fontSize: 11, color: T.dim, marginTop: 4 }}>Tap "+ Add" or run AI analysis to populate your differential.</div>
            </div>
          )}
          {differentials.map((item, idx) => (
            <DifferentialCard
              key={item.id || idx}
              item={item}
              index={idx}
              onUpdate={updateDifferential}
              onRemove={removeDifferential}
              onPromote={promoteToFinal}
            />
          ))}

          {/* Initial Reasoning */}
          <div style={{ marginTop: 8 }}>
            <MLabel>Initial Clinical Reasoning</MLabel>
            <textarea
              value={initialReasoning}
              onChange={e => setInitialReasoning(e.target.value)}
              placeholder="Summarize your initial clinical reasoning — key findings driving your differential, working hypothesis, and areas of uncertainty…"
              style={{ width: "100%", background: T.card, border: `1px solid ${T.border_2}`, borderRadius: 7, color: T.text, fontFamily: "sans-serif", fontSize: 13, padding: "10px 12px", minHeight: "100px", resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.6 }}
              onFocus={e => e.target.style.borderColor = T.amber}
              onBlur={e => { e.target.style.borderColor = T.border_2; updateNote({ assessment: initialReasoning }); }}
            />
          </div>
        </div>
      </div>

      {/* ─── RIGHT PANEL: Final Diagnosis ─── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", marginTop: 52 }}>
        {/* Panel header */}
        <div style={{ padding: "18px 22px 14px", borderBottom: `1px solid ${T.border}`, background: T.surface, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 3, height: 18, background: T.teal, borderRadius: 2, flexShrink: 0 }} />
            <span style={{ fontSize: 18 }}>📌</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "serif", fontSize: 18, fontStyle: "italic", color: T.text }}>Final Diagnosis</div>
              <div style={{ fontFamily: "Geist Mono, monospace", fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", color: T.muted, marginTop: 2 }}>Confirmed after full data review</div>
            </div>
            <div style={{ fontFamily: "Geist Mono, monospace", fontSize: "10px", color: T.teal, background: T.teal_dim, border: `1px solid ${T.teal}33`, padding: "3px 8px", borderRadius: 5 }}>
              {secondaryDx.length + (primaryDx.name ? 1 : 0)} dx
            </div>
            <button
              onClick={() => { setModalTarget("final_secondary"); setModalOpen(true); }}
              style={{ fontFamily: "Geist Mono, monospace", fontSize: "9px", letterSpacing: "0.08em", textTransform: "uppercase", padding: "5px 10px", borderRadius: 5, border: `1px solid ${T.border_2}`, color: T.muted, background: "transparent", cursor: "pointer" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.teal; e.currentTarget.style.color = T.teal; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border_2; e.currentTarget.style.color = T.muted; }}
            >+ Add</button>
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 22px 32px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* AI Banner */}
          <AnimatePresence>
            {aiFinalSuggestions && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                style={{ background: "rgba(0,204,163,0.08)", border: `1px solid ${T.teal}26`, borderRadius: 8, padding: "12px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14 }}>✨</span>
                <div style={{ fontFamily: "Geist Mono, monospace", fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: T.teal }}>AI suggested</div>
                <div style={{ fontFamily: "Geist Mono, monospace", fontSize: "10px", color: T.muted, flex: 1 }}>{(aiFinalSuggestions.secondary?.length || 0) + 1} diagnoses after full note review</div>
                <button onClick={acceptAllFinal} style={{ fontFamily: "Geist Mono, monospace", fontSize: "9px", padding: "4px 10px", borderRadius: 4, background: T.teal, color: T.bg, border: `1px solid ${T.teal}`, cursor: "pointer" }}>Accept All</button>
                <button onClick={() => setAiFinalSuggestions(null)} style={{ fontFamily: "Geist Mono, monospace", fontSize: "9px", padding: "4px 10px", borderRadius: 4, border: `1px solid ${T.border_2}`, color: T.muted, background: "transparent", cursor: "pointer" }}>Dismiss</button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Primary Diagnosis */}
          <div>
            <MLabel>Primary Diagnosis</MLabel>
            <div style={{ background: T.card, border: `1px solid ${T.border_2}`, borderRadius: 8, padding: "14px", borderLeft: `3px solid ${T.teal}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <input
                  value={primaryDx.name}
                  onChange={e => setPrimaryDx(prev => ({ ...prev, name: e.target.value }))}
                  onBlur={() => saveFinalToNote(primaryDx, secondaryDx, finalImpression)}
                  placeholder="Primary diagnosis"
                  style={{ flex: 1, background: "transparent", border: "none", color: T.text, fontFamily: "sans-serif", fontSize: 14, fontWeight: 600, outline: "none", padding: "4px 8px", borderRadius: 5 }}
                  onFocus={e => e.target.style.background = T.surface_2}
                />
                <input
                  value={primaryDx.icd10}
                  onChange={e => setPrimaryDx(prev => ({ ...prev, icd10: e.target.value }))}
                  onBlur={() => saveFinalToNote(primaryDx, secondaryDx, finalImpression)}
                  placeholder="ICD-10"
                  style={{ fontFamily: "Geist Mono, monospace", fontSize: "11px", color: T.teal, background: T.teal_dim, border: `1px solid ${T.teal}33`, padding: "4px 10px", borderRadius: 5, width: 110, outline: "none" }}
                />
                <select
                  value={primaryDx.status}
                  onChange={e => setPrimaryDx(prev => ({ ...prev, status: e.target.value }))}
                  style={{ fontFamily: "Geist Mono, monospace", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.06em", padding: "4px 8px", borderRadius: 5, border: `1px solid ${T.border_2}`, background: T.surface_2, color: T.text, width: 110, outline: "none" }}
                >
                  {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <textarea
                value={primaryDx.notes}
                onChange={e => setPrimaryDx(prev => ({ ...prev, notes: e.target.value }))}
                onBlur={() => saveFinalToNote(primaryDx, secondaryDx, finalImpression)}
                placeholder="Supporting evidence for this primary diagnosis…"
                style={{ width: "100%", background: T.surface_2, border: `1px solid ${T.border}`, borderRadius: 5, color: T.muted, fontFamily: "sans-serif", fontSize: 12, padding: "7px 10px", minHeight: "52px", resize: "none", outline: "none", boxSizing: "border-box", lineHeight: 1.5 }}
                onFocus={e => e.target.style.borderColor = T.teal}
                onBlur={e => e.target.style.borderColor = T.border}
              />
            </div>
          </div>

          {/* Secondary Diagnoses */}
          <div>
            <MLabel>Secondary Diagnoses</MLabel>
            {secondaryDx.length === 0 && (
              <div style={{ fontFamily: "Geist Mono, monospace", fontSize: "11px", color: T.dim, textAlign: "center", padding: "16px 0" }}>No secondary diagnoses added.</div>
            )}
            {secondaryDx.map(item => (
              <SecondaryDxRow
                key={item.id}
                item={item}
                onUpdate={updated => {
                  const newList = secondaryDx.map(d => d.id === updated.id ? updated : d);
                  setSecondaryDx(newList);
                  saveFinalToNote(primaryDx, newList, finalImpression);
                }}
                onRemove={id => {
                  const newList = secondaryDx.filter(d => d.id !== id);
                  setSecondaryDx(newList);
                  saveFinalToNote(primaryDx, newList, finalImpression);
                }}
              />
            ))}
            <button
              onClick={() => { setModalTarget("final_secondary"); setModalOpen(true); }}
              style={{ width: "100%", padding: "8px 14px", borderRadius: 6, border: `1px dashed ${T.border_2}`, color: T.muted, fontFamily: "Geist Mono, monospace", fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", textAlign: "center", cursor: "pointer", background: "transparent", marginTop: 4, transition: "all 0.12s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.teal; e.currentTarget.style.color = T.teal; e.currentTarget.style.background = T.teal_dim; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border_2; e.currentTarget.style.color = T.muted; e.currentTarget.style.background = "transparent"; }}
            >
              + Add Secondary Diagnosis
            </button>
          </div>

          {/* Final Clinical Impression */}
          <div>
            <MLabel>Final Clinical Impression</MLabel>
            <textarea
              value={finalImpression}
              onChange={e => setFinalImpression(e.target.value)}
              placeholder="Synthesize your final clinical impression — integrate all data (labs, imaging, exam, history) into your definitive assessment and rationale…"
              style={{ width: "100%", background: T.card, border: `1px solid ${T.border_2}`, borderRadius: 7, color: T.text, fontFamily: "sans-serif", fontSize: 13, padding: "10px 12px", minHeight: "110px", resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.6 }}
              onFocus={e => e.target.style.borderColor = T.teal}
              onBlur={e => { e.target.style.borderColor = T.border_2; updateNote({ clinical_impression: finalImpression }); }}
            />
          </div>

          {/* Footer */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
            <div style={{ fontFamily: "Geist Mono, monospace", fontSize: "9px", color: T.dim }}>
              {savedAt ? `Last saved ${savedAt.toLocaleTimeString()}` : "Unsaved changes"}
            </div>
            <div style={{ flex: 1 }} />
            <button
              onClick={handleSave}
              style={{ fontFamily: "Geist Mono, monospace", fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", padding: "7px 16px", borderRadius: 6, background: T.teal, color: T.bg, border: `1px solid ${T.teal}`, cursor: "pointer" }}
              onMouseEnter={e => e.currentTarget.style.background = "#00efd8"}
              onMouseLeave={e => e.currentTarget.style.background = T.teal}
            >
              Save Diagnoses
            </button>
          </div>
        </div>
      </div>

      {/* Search Modal */}
      <AnimatePresence>
        {modalOpen && (
          <DiagnosisSearchModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            onAdd={handleAddDiagnosis}
            target={modalTarget}
            onTargetChange={setModalTarget}
          />
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.5; } }`}</style>
    </div>
  );
}