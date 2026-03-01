import React, { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Search, Filter, Loader2, ChevronDown, ChevronUp, Plus, Check, Save, Share2, Clock, Star, Zap, BarChart3, User, Scale, BookOpen } from "lucide-react";
import { toast } from "sonner";

const T = {
  navy: "#050f1e", slate: "#0b1d35", panel: "#0e2340",
  edge: "#162d4f", border: "#1e3a5f", muted: "#2a4d72",
  dim: "#4a7299", text: "#c8ddf0", bright: "#e8f4ff",
  teal: "#00d4bc", teal2: "#00a896", amber: "#f5a623",
  red: "#ff5c6c", green: "#2ecc71", purple: "#9b6dff",
  rose: "#f472b6", gold: "#fbbf24",
};

const EVIDENCE_COLORS = {
  A: { bg: "rgba(46,204,113,.12)", color: T.green, label: "Strong Evidence (A)" },
  B: { bg: "rgba(0,212,188,.1)", color: T.teal, label: "Moderate Evidence (B)" },
  C: { bg: "rgba(245,166,35,.1)", color: T.amber, label: "Weak Evidence (C)" },
  D: { bg: "rgba(255,92,108,.1)", color: T.red, label: "Evidence Against (D)" },
  I: { bg: "rgba(74,114,153,.12)", color: T.dim, label: "Insufficient Evidence (I)" },
};

const GUIDELINE_SOURCES = [
  { id: "acc_aha", name: "ACC/AHA", icon: "🫀" },
  { id: "acep", name: "ACEP", icon: "🚨" },
  { id: "idsa", name: "IDSA", icon: "🦠" },
  { id: "ats", name: "ATS", icon: "🫁" },
  { id: "asa", name: "ASA", icon: "🧠" },
  { id: "uspstf", name: "USPSTF", icon: "🛡️" },
  { id: "nih", name: "NIH", icon: "🔬" },
  { id: "who", name: "WHO", icon: "🌍" },
  { id: "cochrane", name: "Cochrane", icon: "📊" },
  { id: "uptodate", name: "UpToDate", icon: "📚" },
];

const SPECIALTIES = [
  "All Specialties", "Emergency Medicine", "Cardiology", "Pulmonology", "Neurology",
  "Infectious Disease", "Critical Care", "Internal Medicine", "Surgery",
];

const QUICK_TOPICS = [
  "STEMI", "Sepsis 3.0", "PE / DVT", "Stroke / tPA", "ACS / NSTEMI",
  "Atrial Fibrillation", "Heart Failure", "CAP / Pneumonia", "DKA", "Hypertensive Emergency",
];

const ANALYSIS_SECTIONS = [
  { id: "executive_summary", title: "Executive Summary", icon: "📌" },
  { id: "key_recommendations", title: "Key Recommendations", icon: "✅" },
  { id: "diagnostic_criteria", title: "Diagnostic Criteria", icon: "🔍" },
  { id: "treatment_algorithm", title: "Treatment Algorithm", icon: "🔄" },
  { id: "medication_guidance", title: "Medication Guidance", icon: "💊" },
  { id: "monitoring_parameters", title: "Monitoring Parameters", icon: "📊" },
  { id: "special_populations", title: "Special Populations", icon: "👥" },
  { id: "contraindications", title: "Contraindications & Cautions", icon: "⛔" },
];

function SearchPanel({ query, setQuery, filters, setFilters, analysisMode, setAnalysisMode, onSearch, loading }) {
  const [applyContext, setApplyContext] = useState(false);

  const analysisModes = [
    { id: "full_analysis", label: "Full Analysis", icon: "📋", desc: "Complete structured analysis with all sections" },
    { id: "quick_summary", label: "Quick Summary", icon: "⚡", desc: "Key points and top recommendations only" },
    { id: "patient_specific", label: "Patient-Specific", icon: "👤", desc: "Contextualized to active encounter via Base44" },
    { id: "comparative", label: "Compare Guidelines", icon: "⚖️", desc: "Side-by-side comparison of selected guidelines" },
  ];

  return (
    <div className="bg-[#0e2340] border border-[#1e3a5f] rounded-xl p-4 flex flex-col gap-3.5">
      {/* Section Header */}
       <div className="text-xs font-bold uppercase tracking-wide text-[#9b6dff] flex items-center gap-1.5">
         <span>●</span> GUIDELINE SEARCH
       </div>

       {/* Search Bar */}
       <div className="flex gap-1.5 items-center bg-[#162d4f] border border-[#1e3a5f] rounded-lg p-3">
         <Search size={14} className="text-[#4a7299]" />
         <input
           type="text"
           placeholder="Enter clinical question, condition…"
           value={query}
           onChange={(e) => setQuery(e.target.value)}
           onKeyDown={(e) => e.key === "Enter" && onSearch()}
           className="flex-1 bg-transparent border-none text-[#e8f4ff] text-sm outline-none"
         />
         <button className="bg-[#9b6dff] text-white border-none rounded px-2 py-1 text-xs font-semibold cursor-pointer">AI</button>
       </div>

       {/* Search Button */}
       <button
         onClick={onSearch}
         disabled={loading}
         className="px-3 py-3 rounded-lg text-sm font-bold border-none bg-gradient-to-br from-[#9b6dff] to-[#8b5cf6] text-white cursor-pointer hover:opacity-90 transition-all flex items-center justify-center gap-1.5 disabled:opacity-70"
       >
         <Plus size={14} /> Search Clinical Guidelines
       </button>

      {/* Analysis Mode */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wide text-[#4a7299] mb-2.5">Analysis Mode</div>
        <div className="grid grid-cols-2 gap-2">
          {analysisModes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setAnalysisMode(mode.id)}
              className={`px-2.5 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition-all flex flex-col items-start gap-1 ${analysisMode === mode.id ? "border border-[#9b6dff] bg-[rgba(155,109,255,0.15)]" : "border border-[#1e3a5f] bg-[#162d4f]"} text-[#c8ddf0]`}
            >
              <span className="text-base">{mode.icon}</span>
              <span>{mode.label}</span>
              <span className="text-xs text-[#4a7299] font-normal">{mode.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Topics */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wide text-[#4a7299] mb-2">Quick Topics</div>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_TOPICS.map((topic) => (
            <button
              key={topic}
              onClick={() => { setQuery(topic); onSearch(); }}
              className="px-2.5 py-1.5 rounded-md text-xs bg-[rgba(155,109,255,0.1)] border border-[rgba(155,109,255,0.3)] text-[#9b6dff] cursor-pointer transition-all hover:bg-[rgba(155,109,255,0.2)]"
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="pt-3 border-t border-[#1e3a5f]">
        <div className="text-xs font-bold uppercase tracking-wide text-[#4a7299] mb-2.5 flex items-center gap-1.5">
          <Filter size={12} /> FILTERS
        </div>
        <div className="grid grid-cols-2 gap-2 mb-2.5">
          {[
            { value: filters.specialty, onChange: (v) => setFilters({ ...filters, specialty: v }), options: SPECIALTIES },
            { value: filters.source, onChange: (v) => setFilters({ ...filters, source: v }), options: ["All Sources", ...GUIDELINE_SOURCES.map(s => s.name)] },
            { value: filters.yearFrom, onChange: (v) => setFilters({ ...filters, yearFrom: v }), options: ["Any Year", "2024+", "2023+", "2022+"] },
            { value: filters.evidenceLevel, onChange: (v) => setFilters({ ...filters, evidenceLevel: v }), options: ["Any Level", "A - Strong", "B - Moderate", "C - Weak"] },
          ].map((item, idx) => (
            <select
              key={idx}
              value={item.value}
              onChange={(e) => item.onChange(e.target.value)}
              className="w-full px-2 py-2 rounded-md border border-[#1e3a5f] bg-[#162d4f] text-[#e8f4ff] text-xs"
            >
              {item.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          ))}
        </div>

        {/* Patient Context Toggle */}
        <div className="flex items-center gap-2 p-2.5 bg-[#162d4f] rounded-md border border-[#1e3a5f]">
          <input
            type="checkbox"
            checked={applyContext}
            onChange={(e) => setApplyContext(e.target.checked)}
            className="cursor-pointer"
          />
          <div className="flex-1">
            <div className="text-xs font-semibold text-[#c8ddf0]">Apply Patient Context</div>
            <div className="text-xs text-[#4a7299]">Contextualizes analysis to active encounter via Base44</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultsPanel({ results, loading, onAnalyze, selectedForCompare, onToggleCompare }) {
  return (
    <div className="bg-[#0e2340] border border-[#1e3a5f] rounded-lg p-3 flex flex-col gap-2.5 flex-1 overflow-hidden h-full">
      <div className="text-xs font-semibold text-[#c8ddf0] uppercase tracking-wider">
        Results {results.length > 0 && <span className="text-[#4a7299]">({results.length})</span>}
      </div>

      <div className="flex-1 overflow-auto flex flex-col gap-2">
        {!loading && results.length === 0 && (
          <div className="text-center text-[#4a7299] text-xs py-5 px-2.5">
            🔍 Enter a clinical question to search guidelines
          </div>
        )}

        {results.map((result) => (
           <div
             key={result.id}
             className="bg-[#162d4f] border border-[#1e3a5f] rounded-md p-2.5 flex flex-col gap-1.5 cursor-pointer transition-all hover:border-[#00d4bc]"
           >
             <div className="flex justify-between items-start gap-2">
               <div className="flex-1">
                 <div className="text-xs font-semibold text-[#e8f4ff]">{result.title}</div>
                 <div className="text-xs text-[#4a7299] mt-0.5">{result.source} · {result.publicationYear}</div>
               </div>
               <div
                 className={`w-6 h-6 rounded border flex items-center justify-center cursor-pointer transition-all ${selectedForCompare.includes(result.id) ? "border-[#00d4bc] bg-[rgba(0,212,188,0.1)]" : "border-[#1e3a5f]"}`}
                 onClick={(e) => { e.stopPropagation(); onToggleCompare(result.id); }}
               >
                 {selectedForCompare.includes(result.id) && <Check size={12} className="text-[#00d4bc]" />}
               </div>
             </div>

             {result.evidenceLevel && (
               <div className="flex gap-1 items-center">
                 <div
                   className="px-1.5 py-0.5 rounded text-xs font-semibold"
                   style={{
                     background: EVIDENCE_COLORS[result.evidenceLevel].bg,
                     color: EVIDENCE_COLORS[result.evidenceLevel].color,
                   }}
                 >
                   {EVIDENCE_COLORS[result.evidenceLevel].label}
                 </div>
               </div>
             )}

             <button
               onClick={() => onAnalyze(result)}
               className="px-2 py-1 rounded text-xs font-semibold border border-[#00d4bc] bg-[rgba(0,212,188,0.1)] text-[#00d4bc] cursor-pointer transition-all hover:bg-[rgba(0,212,188,0.2)]"
             >
               Analyze
             </button>
           </div>
         ))}
      </div>
    </div>
  );
}

function AnalysisPanel({ analysis, loading, selectedSections, onToggleSection, onAddToNote, onSave }) {
  const [expandedSections, setExpandedSections] = useState({});

  if (loading) {
    return (
      <div className="bg-[#0e2340] border border-[#1e3a5f] rounded-lg p-6 flex items-center justify-center gap-3 h-full">
        <Loader2 size={20} className="text-[#00d4bc] animate-spin" />
        <span className="text-sm text-[#4a7299]">Analyzing guideline…</span>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-[#0e2340] border border-[#1e3a5f] rounded-xl p-10 flex flex-col items-center justify-center gap-5 h-full">
        {/* Section Header */}
        <div className="text-xs font-bold uppercase tracking-wide text-[#9b6dff] flex items-center gap-1.5 self-start -mt-6">
          <span>◆</span> CLINICAL ANALYSIS
        </div>

        {/* Book Icon */}
        <div className="w-24 h-24 rounded-full border-2 border-[#1e3a5f] flex items-center justify-center text-6xl bg-[rgba(0,212,188,0.05)]">
          📖
        </div>

        {/* Title */}
        <div className="text-2xl font-semibold text-[#e8f4ff] text-center">
          AI Clinical Analysis
        </div>

        {/* Instructions */}
        <div className="text-sm text-[#4a7299] text-center max-w-xs leading-relaxed">
          Search for a guideline or clinical question on the left, then click <span className="text-[#9b6dff] font-semibold">Analyze</span> to generate a structured clinical analysis formatted for provider use and clinical note insertion.
        </div>

        {/* Steps */}
        <div className="grid grid-cols-2 gap-3 w-full mt-5">
          {[
            { num: 1, text: "Enter a clinical question or search a condition" },
            { num: 2, text: "Select a guideline result and click Analyze" },
            { num: 3, text: "Review the structured provider analysis" },
            { num: 4, text: "Select sections and add directly to your clinical note" },
          ].map((step) => (
            <div key={step.num} className="flex flex-col items-center gap-2 p-3 bg-[#162d4f] border border-[#1e3a5f] rounded-lg">
              <div className="w-8 h-8 rounded-full border-2 border-[#9b6dff] flex items-center justify-center text-base font-bold text-[#9b6dff]">
                {step.num}
              </div>
              <span className="text-xs text-[#c8ddf0] text-center">{step.text}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0e2340] border border-[#1e3a5f] rounded-lg p-3 flex flex-col gap-2.5 h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex justify-between items-center pb-2.5 border-b border-[#1e3a5f]">
        <div className="text-xs font-semibold text-[#c8ddf0] uppercase">
          Analysis
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => onAddToNote(selectedSections)}
            className="px-2.5 py-1 rounded text-xs font-semibold border border-[#00d4bc] bg-[rgba(0,212,188,0.1)] text-[#00d4bc] cursor-pointer hover:bg-[rgba(0,212,188,0.2)] transition-all"
          >
            <Plus size={10} className="inline mr-1" /> Add to Note
          </button>
          <button
            onClick={onSave}
            className="px-2.5 py-1 rounded text-xs font-semibold border border-[#1e3a5f] bg-[#162d4f] text-[#4a7299] cursor-pointer hover:bg-[rgba(155,109,255,0.1)]"
          >
            <Save size={10} className="inline mr-1" /> Save
          </button>
        </div>
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-auto flex flex-col gap-2">
        {ANALYSIS_SECTIONS.map((section) => (
          <div
            key={section.id}
            className={`bg-[#162d4f] border rounded-md overflow-hidden transition-all ${selectedSections.includes(section.id) ? "border-[#00d4bc]" : "border-[#1e3a5f]"}`}
          >
            <div
              onClick={() => setExpandedSections((prev) => ({ ...prev, [section.id]: !prev[section.id] }))}
              className={`px-3 py-2.5 flex items-center gap-2 cursor-pointer transition-all ${expandedSections[section.id] ? "bg-[rgba(0,212,188,0.05)]" : ""}`}
            >
              <input
                type="checkbox"
                checked={selectedSections.includes(section.id)}
                onChange={() => onToggleSection(section.id)}
                onClick={(e) => e.stopPropagation()}
                className="cursor-pointer"
              />
              <span className="text-base">{section.icon}</span>
              <span className="flex-1 text-xs font-semibold text-[#c8ddf0]">{section.title}</span>
              {expandedSections[section.id] ? <ChevronUp size={12} className="text-[#4a7299]" /> : <ChevronDown size={12} className="text-[#4a7299]" />}
            </div>

            {expandedSections[section.id] && (
              <div className="px-3 py-2.5 border-t border-[#1e3a5f] text-xs text-[#c8ddf0] leading-relaxed max-h-48 overflow-auto">
                <p className="m-0">
                  {section.id === "executive_summary" && "Summary of guideline scope and key clinical recommendations…"}
                  {section.id === "key_recommendations" && "1. Primary intervention recommended\n2. Secondary monitoring suggested\n3. Special considerations for comorbidities…"}
                  {section.id === "diagnostic_criteria" && "Clinical criteria, scoring systems, and diagnostic algorithms…"}
                  {section.id === "treatment_algorithm" && "Step-by-step decision tree for treatment selection…"}
                  {section.id === "medication_guidance" && "Specific drug recommendations with dosing and monitoring…"}
                  {section.id === "monitoring_parameters" && "Key metrics to monitor, intervals, and target ranges…"}
                  {section.id === "special_populations" && "Adjustments for elderly, pregnancy, renal/hepatic disease…"}
                  {section.id === "contraindications" && "Absolute and relative contraindications, black box warnings…"}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ClinicalGuidelines() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({ specialty: "All Specialties", source: "", yearFrom: "", evidenceLevel: "" });
  const [analysisMode, setAnalysisMode] = useState("full_analysis");
  const [results, setResults] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedSections, setSelectedSections] = useState([]);
  const [selectedForCompare, setSelectedForCompare] = useState([]);

  const mockResults = [
    {
      id: "1",
      title: "2024 AHA/ACC Guideline for STEMI Management",
      source: "ACC/AHA",
      specialty: "Cardiology",
      publicationYear: 2024,
      evidenceLevel: "A",
      guidelineType: "guideline",
    },
    {
      id: "2",
      title: "Surviving Sepsis Campaign 3.0 Bundle Update",
      source: "SCCM",
      specialty: "Critical Care",
      publicationYear: 2023,
      evidenceLevel: "B",
      guidelineType: "systematic_review",
    },
    {
      id: "3",
      title: "Pulmonary Embolism: ACEP Evidence-Based Care Guideline",
      source: "ACEP",
      specialty: "Emergency Medicine",
      publicationYear: 2023,
      evidenceLevel: "A",
      guidelineType: "guideline",
    },
  ];

  const handleSearch = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      setResults(query ? mockResults : []);
      setLoading(false);
    }, 500);
  }, [query]);

  const handleAnalyze = (result) => {
    setLoading(true);
    setTimeout(() => {
      setAnalysis({
        id: result.id,
        title: result.title,
        source: result.source,
        evidenceLevel: result.evidenceLevel,
      });
      setSelectedSections([]);
      setLoading(false);
    }, 800);
  };

  const handleAddToNote = (sections) => {
    if (sections.length === 0) {
      toast.error("Select at least one section");
      return;
    }
    toast.success(`✓ Added ${sections.length} section(s) to note`);
  };

  const handleSave = () => {
    toast.success("✓ Analysis saved to library");
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      background: T.navy,
      fontFamily: "DM Sans, sans-serif",
      color: T.text,
    }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&family=Playfair+Display:wght@400;500;600;700&family=JetBrains+Mono:wght@300;400;500&display=swap" />

      {/* Topbar */}
      <div style={{
        height: "64px",
        background: T.slate,
        borderBottom: `1px solid ${T.border}`,
        padding: "0 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "16px", fontWeight: 700, color: T.bright }}>ClinAI</span>
          <span style={{ fontSize: "12px", color: T.text, fontWeight: 500 }}>—</span>
          <span style={{ fontSize: "12px", color: T.purple, fontWeight: 600 }}>Clinical Guidelines Search</span>
          <span style={{ fontSize: "10px", color: T.dim, marginLeft: "8px" }}>AI-powered · Base44 · ACC/AHA · ACEP · IDSA · Cochrane · USPSTF · +10 sources</span>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button style={{ padding: "6px 10px", borderRadius: "6px", fontSize: "10px", border: `1px solid ${T.border}`, background: T.edge, color: T.dim, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
            <Clock size={12} /> 0 Recent
          </button>
          <button style={{ padding: "6px 10px", borderRadius: "6px", fontSize: "10px", border: `1px solid ${T.border}`, background: T.edge, color: T.gold, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
            <Star size={12} /> 0 Saved
          </button>
          <button style={{ padding: "6px 10px", borderRadius: "6px", fontSize: "10px", border: `1px solid ${T.teal}`, background: `rgba(0,212,188,0.1)`, color: T.teal, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontWeight: 600 }}>
            <Zap size={12} /> AI ACTIVE
          </button>
          <button style={{ padding: "6px 10px", borderRadius: "6px", fontSize: "10px", border: `1px solid ${T.border}`, background: T.edge, color: T.dim, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
            🖨️ Print
          </button>
          <button style={{ padding: "6px 12px", borderRadius: "6px", fontSize: "10px", border: "none", background: T.teal, color: T.navy, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontWeight: 600 }}>
            <Save size={12} /> Save Analysis
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: "320px 1fr",
        gap: "12px",
        padding: "12px 16px",
        overflow: "hidden",
      }}>
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", overflow: "hidden", minWidth: 0 }}>
          <SearchPanel
            query={query}
            setQuery={setQuery}
            filters={filters}
            setFilters={setFilters}
            analysisMode={analysisMode}
            setAnalysisMode={setAnalysisMode}
            onSearch={handleSearch}
            loading={loading}
          />
          <ResultsPanel
            results={results}
            loading={loading}
            onAnalyze={handleAnalyze}
            selectedForCompare={selectedForCompare}
            onToggleCompare={(id) => setSelectedForCompare((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])}
          />
        </div>

        {/* Right Column */}
        <div style={{ overflow: "hidden" }}>
          <AnalysisPanel
            analysis={analysis}
            loading={loading}
            selectedSections={selectedSections}
            onToggleSection={(id) => setSelectedSections((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])}
            onAddToNote={handleAddToNote}
            onSave={handleSave}
          />
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}