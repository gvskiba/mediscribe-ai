import React, { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Search, Filter, Loader2, ChevronDown, ChevronUp, Plus, Check, Save, Share2, Clock, Star, Zap, BarChart3, User, Scale, BookOpen, Sparkles } from "lucide-react";
import { toast } from "sonner";
import ForYouPanel, { recordSearch, recordAnalyzed } from "../components/guidelines/ForYouPanel";

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

const EVIDENCE_LEVELS = ["Any Level", "A", "B", "C", "D", "I"];
const GUIDELINE_TYPES = ["Any Type", "guideline", "systematic_review", "meta_analysis", "consensus_statement", "clinical_pathway"];
const GUIDELINE_TYPE_LABELS = {
  guideline: "Guideline",
  systematic_review: "Systematic Review",
  meta_analysis: "Meta-Analysis",
  consensus_statement: "Consensus Statement",
  clinical_pathway: "Clinical Pathway",
};
const YEAR_OPTIONS = ["Any Year", ...Array.from({ length: 15 }, (_, i) => String(2025 - i))];
const SOURCE_OPTIONS = ["All Sources", ...GUIDELINE_SOURCES.map((s) => s.name)];

const DEFAULT_FILTERS = { specialty: "", source: "", yearFrom: "", yearTo: "", evidenceLevel: "", guidelineType: "" };

const QUICK_TOPICS = [
  "STEMI", "Sepsis 3.0", "PE / DVT", "Stroke / tPA", "ACS / NSTEMI",
  "Atrial Fibrillation", "Heart Failure", "CAP / Pneumonia", "DKA", "Hypertensive Emergency",
  "Anaphylaxis", "COPD Exacerbation", "Acute Kidney Injury", "Hyponatremia", "Subarachnoid Hemorrhage", "GI Bleed"
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

function FilterSelect({ label, value, options, onChange, renderOption }) {
  const [open, setOpen] = useState(false);
  const displayLabel = value ? (renderOption ? renderOption(value) : value) : label;
  const isActive = !!value;
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`w-full px-3 py-2.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all text-left flex items-center justify-between gap-1 ${isActive ? "border-[#9b6dff] bg-[rgba(155,109,255,0.1)] text-[#9b6dff]" : "border-[#1e3a5f] bg-[#162d4f] text-[#c8ddf0] hover:border-[#2a4d72]"}`}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown size={10} className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-[#0e2340] border border-[#1e3a5f] rounded-lg shadow-xl max-h-44 overflow-y-auto scrollbar-hide">
          {options.map((opt) => {
            const isEmpty = opt === label || opt === "All Specialties" || opt === "All Sources" || opt === "Any Year" || opt === "Any Level" || opt === "Any Type";
            const val = isEmpty ? "" : opt;
            return (
              <button
                key={opt}
                onClick={() => { onChange(val); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-[#162d4f] transition-all ${value === val ? "text-[#9b6dff] font-semibold" : "text-[#c8ddf0]"}`}
              >
                {renderOption && !isEmpty ? renderOption(opt) : opt}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SearchPanel({ query, setQuery, filters, setFilters, analysisMode, setAnalysisMode, onSearch, loading }) {

  const analysisModes = [
    { id: "full_analysis", label: "Full Analysis", icon: "📋", desc: "Complete structured analysis with all sections" },
    { id: "quick_summary", label: "Quick Summary", icon: "⚡", desc: "Key points and top recommendations only" },
    { id: "patient_specific", label: "Patient-Specific", icon: "👤", desc: "Contextualized to active encounter via Base44" },
    { id: "comparative", label: "Compare Guidelines", icon: "⚖️", desc: "Side-by-side comparison of selected guidelines" },
  ];

  return (
    <div className="bg-[#0e2340] border border-[#1e3a5f] rounded-xl p-4 flex flex-col gap-4 overflow-y-auto scrollbar-hide h-full">
      {/* Section Header */}
       <div className="text-xs font-bold uppercase tracking-wide text-[#9b6dff] flex items-center gap-1.5">
         <span>●</span> GUIDELINE SEARCH
       </div>

       {/* Search Bar */}
       <div className="flex gap-2 items-center bg-[#162d4f] border border-[#1e3a5f] rounded-lg p-3">
         <Search size={14} className="text-[#4a7299]" />
         <input
           type="text"
           placeholder="Enter clinical question, condition…"
           value={query}
           onChange={(e) => setQuery(e.target.value)}
           onKeyDown={(e) => e.key === "Enter" && onSearch()}
           className="flex-1 bg-transparent border-none text-[#e8f4ff] text-sm outline-none placeholder:text-[#4a7299]"
         />
         <button className="bg-[#9b6dff] text-white border-none rounded px-2 py-1 text-xs font-semibold cursor-pointer hover:bg-[#8b5cf6] transition-all">AI</button>
       </div>

       {/* Search Button */}
       <button
         onClick={onSearch}
         disabled={loading}
         className="px-3 py-3 rounded-lg text-sm font-bold border-none bg-gradient-to-br from-[#9b6dff] to-[#8b5cf6] text-white cursor-pointer hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
       >
         <Plus size={16} /> Search Clinical Guidelines
       </button>

      {/* Analysis Mode */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wide text-[#4a7299] mb-3">Analysis Mode</div>
        <div className="grid grid-cols-2 gap-2.5">
          {analysisModes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setAnalysisMode(mode.id)}
              className={`px-3 py-3 rounded-lg text-xs font-semibold cursor-pointer transition-all flex flex-col items-start gap-2 text-left ${analysisMode === mode.id ? "border border-[#9b6dff] bg-[rgba(155,109,255,0.15)]" : "border border-[#1e3a5f] bg-[#162d4f] hover:border-[#2a4d72]"}`}
            >
              <span className="text-lg">{mode.icon}</span>
              <span className="text-[#e8f4ff] font-semibold leading-tight">{mode.label}</span>
              <span className="text-xs text-[#4a7299] font-normal leading-tight">{mode.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Topics */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wide text-[#4a7299] mb-2.5">Quick Topics</div>
        <div className="flex flex-wrap gap-2">
          {QUICK_TOPICS.map((topic) => (
            <button
              key={topic}
              onClick={() => { setQuery(topic); onSearch(); }}
              className="px-3 py-2 rounded-md text-xs border border-[#4a7299] bg-transparent text-[#4a7299] cursor-pointer transition-all hover:border-[#9b6dff] hover:text-[#9b6dff]"
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="pt-3 border-t border-[#1e3a5f]">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-bold uppercase tracking-wide text-[#4a7299] flex items-center gap-1.5">
            ⚙️ FILTERS
          </div>
          {Object.values(filters).some(Boolean) && (
            <button
              onClick={() => setFilters(DEFAULT_FILTERS)}
              className="text-xs text-[#ff5c6c] hover:text-[#ff8a95] transition-all font-semibold flex items-center gap-1"
            >
              ✕ Clear All
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <FilterSelect
            label="All Specialties"
            value={filters.specialty}
            options={SPECIALTIES}
            onChange={(v) => setFilters((f) => ({ ...f, specialty: v }))}
          />
          <FilterSelect
            label="All Sources"
            value={filters.source}
            options={SOURCE_OPTIONS}
            onChange={(v) => setFilters((f) => ({ ...f, source: v }))}
          />
          <FilterSelect
            label="Year From"
            value={filters.yearFrom}
            options={YEAR_OPTIONS}
            onChange={(v) => setFilters((f) => ({ ...f, yearFrom: v }))}
          />
          <FilterSelect
            label="Year To"
            value={filters.yearTo}
            options={YEAR_OPTIONS}
            onChange={(v) => setFilters((f) => ({ ...f, yearTo: v }))}
          />
          <FilterSelect
            label="Any Level"
            value={filters.evidenceLevel}
            options={EVIDENCE_LEVELS}
            onChange={(v) => setFilters((f) => ({ ...f, evidenceLevel: v }))}
          />
          <FilterSelect
            label="Any Type"
            value={filters.guidelineType}
            options={GUIDELINE_TYPES}
            renderOption={(v) => GUIDELINE_TYPE_LABELS[v] || v}
            onChange={(v) => setFilters((f) => ({ ...f, guidelineType: v }))}
          />
        </div>

        {/* Patient Context Toggle */}
        <div className="flex items-start gap-3 p-3 bg-[#162d4f] rounded-lg border border-[#1e3a5f]">
          <input
            type="checkbox"
            checked={analysisMode === "patient_specific"}
            onChange={() => setAnalysisMode(analysisMode === "patient_specific" ? "full_analysis" : "patient_specific")}
            className="cursor-pointer mt-1 accent-[#9b6dff]"
          />
          <div className="flex-1">
            <div className="text-xs font-semibold text-[#e8f4ff]">Apply Patient Context</div>
            <div className="text-xs text-[#4a7299] mt-0.5">Contextualizes analysis to active encounter via Base44</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultsPanel({ results, loading, onAnalyze, selectedForCompare, onToggleCompare }) {
  return (
    <div className="bg-[#0e2340] border border-[#1e3a5f] rounded-lg p-3 flex flex-col gap-2.5 flex-1 overflow-hidden min-h-0">
      <div className="text-xs font-semibold text-[#c8ddf0] uppercase tracking-wider">
        Results {results.length > 0 && <span className="text-[#4a7299]">({results.length})</span>}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col gap-2">
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
                <div className="text-xs text-[#4a7299] mt-0.5 flex items-center flex-wrap gap-1">
                  <span className="font-medium text-[#c8ddf0]">{result.source_abbreviation || result.source_name}</span>
                  <span>·</span>
                  <span>{result.publicationYear}</span>
                  {result.source_url && (
                    <a
                      href={result.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[#00d4bc] hover:underline ml-1"
                    >
                      View Source ↗
                    </a>
                  )}
                </div>
                {result.source_name && result.source_abbreviation && (
                  <div className="text-xs text-[#4a7299] mt-0.5 italic">{result.source_name}</div>
                )}
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
        <div className="flex flex-col gap-0.5">
          <div className="text-xs font-semibold text-[#c8ddf0] uppercase">Analysis</div>
          {analysis.source_name && (
            <div className="text-xs text-[#4a7299] flex items-center gap-1">
              <span className="font-medium text-[#9b6dff]">{analysis.source_abbreviation || analysis.source_name}</span>
              <span>·</span>
              <span>{analysis.source_name}</span>
              {analysis.source_url && (
                <a href={analysis.source_url} target="_blank" rel="noopener noreferrer" className="text-[#00d4bc] hover:underline ml-1">
                  ↗ Official Source
                </a>
              )}
            </div>
          )}
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
              <div className="px-3 py-2.5 border-t border-[#1e3a5f] text-xs text-[#c8ddf0] leading-relaxed max-h-64 overflow-auto whitespace-pre-wrap">
                {analysis.sections?.[section.id] || <span className="text-[#4a7299] italic">No data available for this section.</span>}
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
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [analysisMode, setAnalysisMode] = useState("full_analysis");
  const [results, setResults] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedSections, setSelectedSections] = useState([]);
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [rightTab, setRightTab] = useState("analysis"); // "analysis" | "foryou"

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResults([]);

    const filterInstructions = [
      filters.specialty ? `Specialty: ${filters.specialty}.` : "",
      filters.source ? `Preferred source: ${filters.source}.` : "",
      filters.yearFrom ? `Published from ${filters.yearFrom} onwards.` : "",
      filters.yearTo ? `Published up to ${filters.yearTo}.` : "",
      filters.evidenceLevel ? `Evidence level: ${filters.evidenceLevel}.` : "",
      filters.guidelineType ? `Guideline type: ${filters.guidelineType}.` : "",
    ].filter(Boolean).join(" ");

    const prompt = `Search for clinical guidelines related to "${query}" from reputable professional medical associations and colleges. Prioritize authoritative sources such as ACC/AHA (American College of Cardiology / American Heart Association), ACEP (American College of Emergency Physicians), IDSA (Infectious Diseases Society of America), ATS (American Thoracic Society), ASA (American Stroke Association), USPSTF, NIH, WHO, Cochrane, UpToDate, SCCM, ACOG, ACS, and other recognized professional medical societies and academic institutions.

${filterInstructions ? `Apply these filters: ${filterInstructions}` : ""}

For each relevant guideline found, return an object with:
1. title: Official guideline title
2. publicationYear: Year published or last updated (number)
3. summary: Concise 2-3 sentence executive summary of key recommendations
4. evidenceLevel: Highest evidence level (A, B, C, D, or I)
5. guidelineType: One of "clinical_practice_guideline", "consensus_statement", "systematic_review", "meta_analysis", "expert_opinion"
6. source_name: Full name of the publishing professional association or college
7. source_abbreviation: Abbreviation (e.g., ACC/AHA, ACEP)
8. source_url: Direct URL to the guideline on the official organization website

Return 3-6 of the most relevant, current guidelines. Prioritize the most recent versions.`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          guidelines: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                publicationYear: { type: "number" },
                summary: { type: "string" },
                evidenceLevel: { type: "string", enum: ["A", "B", "C", "D", "I"] },
                guidelineType: { type: "string" },
                source_name: { type: "string" },
                source_abbreviation: { type: "string" },
                source_url: { type: "string" },
              },
              required: ["title", "publicationYear", "summary", "evidenceLevel", "guidelineType", "source_name", "source_abbreviation", "source_url"],
            },
          },
        },
      },
    });

    const rawResults = (response?.guidelines || []).map((g, i) => ({ ...g, id: String(i + 1) }));
    setResults(rawResults);
    setLoading(false);
    if (query.trim()) recordSearch(query.trim());
  }, [query, filters]);

  const handleAnalyze = async (result) => {
    setLoading(true);
    setAnalysis(null);

    const prompt = `Perform a comprehensive clinical analysis of the following guideline for healthcare providers:

Guideline: "${result.title}"
Published by: ${result.source_name} (${result.source_abbreviation})
Year: ${result.publicationYear}
Evidence Level: ${result.evidenceLevel}
Background: ${result.summary}

Provide a detailed, structured clinical analysis with the following sections:
1. executive_summary: A concise 3-4 sentence overview of the guideline scope and most critical recommendations.
2. key_recommendations: A numbered list of the top 5-7 key clinical recommendations from this guideline.
3. diagnostic_criteria: Specific diagnostic criteria, scoring systems, thresholds, and algorithms recommended.
4. treatment_algorithm: Step-by-step clinical decision pathway for treatment, including first-line, second-line, and escalation options.
5. medication_guidance: Specific drug recommendations with drug names, dosing regimens, routes, and monitoring parameters.
6. monitoring_parameters: Key clinical, laboratory, and imaging parameters to monitor, with intervals and target values.
7. special_populations: Adjustments and considerations for elderly patients, pregnancy, renal/hepatic impairment, pediatrics, and other special groups.
8. contraindications: Absolute and relative contraindications, black box warnings, and important cautions.

Be specific, clinically precise, and use medical terminology appropriate for physicians and advanced practice providers.`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          executive_summary: { type: "string" },
          key_recommendations: { type: "string" },
          diagnostic_criteria: { type: "string" },
          treatment_algorithm: { type: "string" },
          medication_guidance: { type: "string" },
          monitoring_parameters: { type: "string" },
          special_populations: { type: "string" },
          contraindications: { type: "string" },
        },
      },
    });

    setAnalysis({
      id: result.id,
      title: result.title,
      source_name: result.source_name,
      source_abbreviation: result.source_abbreviation,
      source_url: result.source_url,
      evidenceLevel: result.evidenceLevel,
      guidelineType: result.guidelineType,
      sections: response,
    });
    setSelectedSections([]);
    setLoading(false);
    recordAnalyzed(result.title, result.source_abbreviation || result.source_name);
    setRightTab("analysis");
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
    <div className="flex flex-col h-screen bg-[#050f1e] text-[#c8ddf0]">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&family=Playfair+Display:wght@400;500;600;700&family=JetBrains+Mono:wght@300;400;500&display=swap" />

      {/* Topbar */}
      <div className="h-16 bg-[#0b1d35] border-b border-[#1e3a5f] px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-[#e8f4ff]">ClinAI</span>
          <span className="text-sm text-[#c8ddf0] font-medium">—</span>
          <span className="text-sm text-[#9b6dff] font-semibold">Clinical Guidelines Search</span>
          <span className="text-xs text-[#4a7299] ml-2">AI-powered · Base44 · ACC/AHA · ACEP · IDSA · Cochrane · USPSTF · +10 sources</span>
        </div>
        <div className="flex gap-2 items-center">
          <button className="px-2.5 py-1.5 rounded-md text-xs border border-[#1e3a5f] bg-[#162d4f] text-[#4a7299] cursor-pointer flex items-center gap-1 hover:bg-[rgba(155,109,255,0.1)]">
            <Clock size={12} /> 0 Recent
          </button>
          <button className="px-2.5 py-1.5 rounded-md text-xs border border-[#1e3a5f] bg-[#162d4f] text-[#fbbf24] cursor-pointer flex items-center gap-1 hover:bg-[rgba(155,109,255,0.1)]">
            <Star size={12} /> 0 Saved
          </button>
          <button className="px-2.5 py-1.5 rounded-md text-xs border border-[#00d4bc] bg-[rgba(0,212,188,0.1)] text-[#00d4bc] cursor-pointer flex items-center gap-1 font-semibold">
            <Zap size={12} /> AI ACTIVE
          </button>
          <button className="px-2.5 py-1.5 rounded-md text-xs border border-[#1e3a5f] bg-[#162d4f] text-[#4a7299] cursor-pointer flex items-center gap-1 hover:bg-[rgba(155,109,255,0.1)]">
            🖨️ Print
          </button>
          <button className="px-3 py-1.5 rounded-md text-xs border-none bg-[#00d4bc] text-[#050f1e] cursor-pointer flex items-center gap-1 font-semibold hover:bg-[#00a896]">
            <Save size={12} /> Save Analysis
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-[320px_1fr] gap-3 p-3 overflow-hidden">
        {/* Left Column */}
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

        {/* Right Column */}
        <div className="flex flex-col gap-0 overflow-hidden">
          {/* Tab bar */}
          <div className="flex items-center gap-0 mb-3">
            <button
              onClick={() => setRightTab("analysis")}
              className={`px-4 py-2 text-xs font-bold rounded-l-lg border transition-all ${rightTab === "analysis" ? "border-[#9b6dff] bg-[rgba(155,109,255,0.15)] text-[#9b6dff]" : "border-[#1e3a5f] bg-[#0e2340] text-[#4a7299] hover:text-[#c8ddf0]"}`}
            >
              Clinical Analysis
            </button>
            <button
              onClick={() => setRightTab("foryou")}
              className={`px-4 py-2 text-xs font-bold rounded-r-lg border-t border-r border-b transition-all flex items-center gap-1.5 ${rightTab === "foryou" ? "border-[#9b6dff] bg-[rgba(155,109,255,0.15)] text-[#9b6dff]" : "border-[#1e3a5f] bg-[#0e2340] text-[#4a7299] hover:text-[#c8ddf0]"}`}
            >
              <Sparkles size={11} /> For You
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden min-h-0" style={{ height: "calc(100vh - 160px)" }}>
            {rightTab === "analysis" ? (
              <AnalysisPanel
                analysis={analysis}
                loading={loading}
                selectedSections={selectedSections}
                onToggleSection={(id) => setSelectedSections((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])}
                onAddToNote={handleAddToNote}
                onSave={handleSave}
              />
            ) : (
              <ForYouPanel
                onSearch={(q) => { setQuery(q); setRightTab("analysis"); handleSearchWithQuery(q); }}
                onAnalyzeRecommendation={(rec) => { setQuery(rec.search_query); setRightTab("analysis"); handleSearchWithQuery(rec.search_query); }}
              />
            )}
          </div>
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