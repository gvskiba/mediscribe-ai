import React, { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Search, Filter, Loader2, ChevronDown, ChevronUp, Plus, Check, Save, Share2 } from "lucide-react";
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
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div style={{
      background: T.panel,
      border: `1px solid ${T.border}`,
      borderRadius: "8px",
      padding: "12px",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
    }}>
      {/* Search Bar */}
      <div style={{
        display: "flex",
        gap: "8px",
        alignItems: "center",
        background: T.edge,
        border: `1px solid ${T.border}`,
        borderRadius: "6px",
        padding: "8px 12px",
      }}>
        {loading ? <Loader2 size={16} style={{ color: T.teal, animation: "spin 1s linear infinite" }} /> : <Search size={16} style={{ color: T.dim }} />}
        <input
          type="text"
          placeholder="Search guidelines by condition, drug, procedure…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            color: T.bright,
            fontSize: "12px",
            outline: "none",
            fontFamily: "DM Sans, sans-serif",
          }}
        />
      </div>

      {/* Mode Selection */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "6px",
      }}>
        {["full_analysis", "quick_summary"].map((mode) => (
          <button
            key={mode}
            onClick={() => setAnalysisMode(mode)}
            style={{
              padding: "6px 10px",
              borderRadius: "4px",
              fontSize: "10px",
              fontWeight: 600,
              border: analysisMode === mode ? `1px solid ${T.teal}` : `1px solid ${T.border}`,
              background: analysisMode === mode ? `rgba(0,212,188,0.1)` : T.edge,
              color: analysisMode === mode ? T.teal : T.dim,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {mode === "full_analysis" ? "Full Analysis" : "Quick Summary"}
          </button>
        ))}
      </div>

      {/* Quick Topics */}
      <div style={{ fontSize: "9px", color: T.dim, fontWeight: 600, marginTop: "4px" }}>Quick Topics</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
        {QUICK_TOPICS.slice(0, 5).map((topic) => (
          <button
            key={topic}
            onClick={() => { setQuery(topic); onSearch(); }}
            style={{
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "10px",
              background: `rgba(0,212,188,0.1)`,
              border: `1px solid ${T.teal}`,
              color: T.teal,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = `rgba(0,212,188,0.2)`; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = `rgba(0,212,188,0.1)`; }}
          >
            {topic}
          </button>
        ))}
      </div>

      {/* Filters Toggle */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        style={{
          padding: "6px 10px",
          borderRadius: "4px",
          fontSize: "10px",
          fontWeight: 600,
          border: `1px solid ${T.border}`,
          background: showFilters ? `rgba(0,212,188,0.1)` : T.edge,
          color: showFilters ? T.teal : T.dim,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          transition: "all 0.2s",
        }}
      >
        <Filter size={12} /> Filters {showFilters ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {/* Filters */}
      {showFilters && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingTop: "8px", borderTop: `1px solid ${T.border}` }}>
          <div>
            <label style={{ fontSize: "9px", color: T.dim, fontWeight: 600, display: "block", marginBottom: "4px" }}>Specialty</label>
            <select
              value={filters.specialty}
              onChange={(e) => setFilters({ ...filters, specialty: e.target.value })}
              style={{
                width: "100%",
                padding: "6px 8px",
                borderRadius: "4px",
                border: `1px solid ${T.border}`,
                background: T.edge,
                color: T.bright,
                fontSize: "11px",
              }}
            >
              {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: "9px", color: T.dim, fontWeight: 600, display: "block", marginBottom: "4px" }}>Source</label>
            <select
              value={filters.source}
              onChange={(e) => setFilters({ ...filters, source: e.target.value })}
              style={{
                width: "100%",
                padding: "6px 8px",
                borderRadius: "4px",
                border: `1px solid ${T.border}`,
                background: T.edge,
                color: T.bright,
                fontSize: "11px",
              }}
            >
              <option value="">All Sources</option>
              {GUIDELINE_SOURCES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: "9px", color: T.dim, fontWeight: 600, display: "block", marginBottom: "4px" }}>Year</label>
            <select
              value={filters.yearFrom}
              onChange={(e) => setFilters({ ...filters, yearFrom: e.target.value })}
              style={{
                width: "100%",
                padding: "6px 8px",
                borderRadius: "4px",
                border: `1px solid ${T.border}`,
                background: T.edge,
                color: T.bright,
                fontSize: "11px",
              }}
            >
              <option value="">Any Year</option>
              <option value="2024">2024+</option>
              <option value="2023">2023+</option>
              <option value="2022">2022+</option>
              <option value="2020">2020+</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: "9px", color: T.dim, fontWeight: 600, display: "block", marginBottom: "4px" }}>Evidence Level</label>
            <select
              value={filters.evidenceLevel}
              onChange={(e) => setFilters({ ...filters, evidenceLevel: e.target.value })}
              style={{
                width: "100%",
                padding: "6px 8px",
                borderRadius: "4px",
                border: `1px solid ${T.border}`,
                background: T.edge,
                color: T.bright,
                fontSize: "11px",
              }}
            >
              <option value="">Any Level</option>
              <option value="A">A - Strong</option>
              <option value="B">B - Moderate</option>
              <option value="C">C - Weak</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultsPanel({ results, loading, onAnalyze, selectedForCompare, onToggleCompare }) {
  return (
    <div style={{
      background: T.panel,
      border: `1px solid ${T.border}`,
      borderRadius: "8px",
      padding: "12px",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      flex: 1,
      overflow: "hidden",
    }}>
      <div style={{ fontSize: "11px", fontWeight: 600, color: T.text, textTransform: "uppercase", letterSpacing: "0.5px" }}>
        Results {results.length > 0 && <span style={{ color: T.dim }}>({results.length})</span>}
      </div>

      <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
        {!loading && results.length === 0 && (
          <div style={{ textAlign: "center", color: T.dim, fontSize: "11px", padding: "20px 10px" }}>
            🔍 Enter a clinical question to search guidelines
          </div>
        )}

        {results.map((result) => (
          <div
            key={result.id}
            style={{
              background: T.edge,
              border: `1px solid ${T.border}`,
              borderRadius: "6px",
              padding: "10px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.teal; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "10px", fontWeight: 600, color: T.bright }}>{result.title}</div>
                <div style={{ fontSize: "9px", color: T.dim, marginTop: "2px" }}>{result.source} · {result.publicationYear}</div>
              </div>
              <div style={{
                width: "24px",
                height: "24px",
                borderRadius: "4px",
                border: `1px solid ${selectedForCompare.includes(result.id) ? T.teal : T.border}`,
                background: selectedForCompare.includes(result.id) ? `rgba(0,212,188,0.1)` : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onClick={(e) => { e.stopPropagation(); onToggleCompare(result.id); }}>
                {selectedForCompare.includes(result.id) && <Check size={12} style={{ color: T.teal }} />}
              </div>
            </div>

            {result.evidenceLevel && (
              <div style={{
                display: "flex",
                gap: "4px",
                alignItems: "center",
              }}>
                <div style={{
                  padding: "2px 6px",
                  borderRadius: "3px",
                  fontSize: "8px",
                  fontWeight: 600,
                  background: EVIDENCE_COLORS[result.evidenceLevel].bg,
                  color: EVIDENCE_COLORS[result.evidenceLevel].color,
                }}>
                  {EVIDENCE_COLORS[result.evidenceLevel].label}
                </div>
              </div>
            )}

            <button
              onClick={() => onAnalyze(result)}
              style={{
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "9px",
                fontWeight: 600,
                border: `1px solid ${T.teal}`,
                background: `rgba(0,212,188,0.1)`,
                color: T.teal,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = `rgba(0,212,188,0.2)`; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = `rgba(0,212,188,0.1)`; }}
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
      <div style={{
        background: T.panel,
        border: `1px solid ${T.border}`,
        borderRadius: "8px",
        padding: "24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        flex: 1,
      }}>
        <Loader2 size={20} style={{ color: T.teal, animation: "spin 1s linear infinite" }} />
        <span style={{ fontSize: "12px", color: T.dim }}>Analyzing guideline…</span>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div style={{
        background: T.panel,
        border: `1px solid ${T.border}`,
        borderRadius: "8px",
        padding: "24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flex: 1,
      }}>
        <span style={{ fontSize: "12px", color: T.dim }}>📋 Select a guideline to analyze</span>
      </div>
    );
  }

  return (
    <div style={{
      background: T.panel,
      border: `1px solid ${T.border}`,
      borderRadius: "8px",
      padding: "12px",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      flex: 1,
      overflow: "hidden",
    }}>
      {/* Toolbar */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: "10px",
        borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ fontSize: "11px", fontWeight: 600, color: T.text, textTransform: "uppercase" }}>
          Analysis
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <button
            onClick={() => onAddToNote(selectedSections)}
            style={{
              padding: "4px 10px",
              borderRadius: "4px",
              fontSize: "9px",
              fontWeight: 600,
              border: `1px solid ${T.teal}`,
              background: `rgba(0,212,188,0.1)`,
              color: T.teal,
              cursor: "pointer",
            }}
          >
            <Plus size={10} style={{ display: "inline", marginRight: "4px" }} /> Add to Note
          </button>
          <button
            onClick={onSave}
            style={{
              padding: "4px 10px",
              borderRadius: "4px",
              fontSize: "9px",
              fontWeight: 600,
              border: `1px solid ${T.border}`,
              background: T.edge,
              color: T.dim,
              cursor: "pointer",
            }}
          >
            <Save size={10} style={{ display: "inline", marginRight: "4px" }} /> Save
          </button>
        </div>
      </div>

      {/* Sections */}
      <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
        {ANALYSIS_SECTIONS.map((section) => (
          <div
            key={section.id}
            style={{
              background: T.edge,
              border: `1px solid ${selectedSections.includes(section.id) ? T.teal : T.border}`,
              borderRadius: "6px",
              overflow: "hidden",
              transition: "all 0.2s",
            }}
          >
            <div
              onClick={() => setExpandedSections((prev) => ({ ...prev, [section.id]: !prev[section.id] }))}
              style={{
                padding: "10px 12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                background: expandedSections[section.id] ? `rgba(0,212,188,0.05)` : "transparent",
              }}
            >
              <input
                type="checkbox"
                checked={selectedSections.includes(section.id)}
                onChange={() => onToggleSection(section.id)}
                onClick={(e) => e.stopPropagation()}
                style={{ cursor: "pointer" }}
              />
              <span style={{ fontSize: "14px" }}>{section.icon}</span>
              <span style={{ flex: 1, fontSize: "10px", fontWeight: 600, color: T.text }}>{section.title}</span>
              {expandedSections[section.id] ? <ChevronUp size={12} style={{ color: T.dim }} /> : <ChevronDown size={12} style={{ color: T.dim }} />}
            </div>

            {expandedSections[section.id] && (
              <div style={{
                padding: "10px 12px",
                borderTop: `1px solid ${T.border}`,
                fontSize: "11px",
                color: T.text,
                lineHeight: "1.5",
                maxHeight: "200px",
                overflow: "auto",
              }}>
                <p style={{ margin: 0 }}>
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
        height: "58px",
        background: T.slate,
        borderBottom: `1px solid ${T.border}`,
        padding: "0 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ fontSize: "14px", fontWeight: 600, color: T.bright }}>Clinical Guidelines</div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button style={{ padding: "6px 12px", borderRadius: "4px", fontSize: "10px", border: `1px solid ${T.border}`, background: T.edge, color: T.dim, cursor: "pointer" }}>
            Print
          </button>
          <button style={{ padding: "6px 12px", borderRadius: "4px", fontSize: "10px", border: `1px solid ${T.border}`, background: T.edge, color: T.dim, cursor: "pointer" }}>
            Share
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: "320px 1fr",
        gap: "11px",
        padding: "13px 16px",
        overflow: "hidden",
      }}>
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "11px", overflow: "hidden" }}>
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
        <AnalysisPanel
          analysis={analysis}
          loading={loading}
          selectedSections={selectedSections}
          onToggleSection={(id) => setSelectedSections((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])}
          onAddToNote={handleAddToNote}
          onSave={handleSave}
        />
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}