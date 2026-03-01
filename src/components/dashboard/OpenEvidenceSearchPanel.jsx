import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Star, Pill, BookOpen, Search, Loader2, AlertTriangle, Activity, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import SaveGuidelineModal from "./SaveGuidelineModal";

const T = {
  navy: "#050f1e",
  slate: "#0b1d35",
  panel: "#0e2340",
  edge: "#162d4f",
  border: "#1e3a5f",
  muted: "#2a4d72",
  dim: "#4a7299",
  text: "#c8ddf0",
  bright: "#e8f4ff",
  teal: "#00d4bc",
  teal2: "#00a896",
  amber: "#f5a623",
  red: "#ff5c6c",
  green: "#2ecc71",
  purple: "#9b6dff",
};

const QUICK_SEARCHES = [
  "Sepsis management",
  "Acute MI protocol",
  "Stroke evaluation",
  "Pneumonia treatment",
  "Asthma exacerbation",
];

const COMMON_MEDS = ["Metoprolol", "Lisinopril", "Warfarin", "Metformin", "Amoxicillin", "Furosemide"];

// ── Tab Button ───────────────────────────────────────────────────────────────
function TabBtn({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: "9px 6px",
        borderBottom: active ? `2px solid ${T.teal}` : "2px solid transparent",
        background: "transparent",
        color: active ? T.teal : T.dim,
        fontSize: "11px",
        fontWeight: active ? 700 : 500,
        cursor: "pointer",
        border: "none",
        borderBottom: active ? `2px solid ${T.teal}` : `2px solid transparent`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "5px",
        transition: "all 0.15s",
        letterSpacing: "0.03em",
      }}
    >
      <Icon style={{ width: 13, height: 13 }} /> {label}
    </button>
  );
}

// ── Drug Quick Lookup ─────────────────────────────────────────────────────────
function DrugLookupTab() {
  const [medQuery, setMedQuery] = useState("");
  const [drugInfo, setDrugInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState({ dosage: true, contra: false, interactions: false });

  const lookup = async (med) => {
    if (!med.trim()) return;
    setMedQuery(med);
    setLoading(true);
    setDrugInfo(null);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Provide a clinical quick-reference for the medication: "${med}".
Return concise, evidence-based information for bedside use.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            drug_name: { type: "string" },
            drug_class: { type: "string" },
            common_dosages: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  indication: { type: "string" },
                  dose: { type: "string" },
                  route: { type: "string" },
                  frequency: { type: "string" },
                }
              }
            },
            contraindications: { type: "array", items: { type: "string" } },
            major_interactions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  drug: { type: "string" },
                  severity: { type: "string" },
                  effect: { type: "string" },
                }
              }
            },
            key_monitoring: { type: "array", items: { type: "string" } },
            black_box_warning: { type: "string" },
          }
        }
      });
      setDrugInfo(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggle = (key) => setExpanded(p => ({ ...p, [key]: !p[key] }));

  const Section = ({ id, label, children, color = T.teal }) => (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden", marginBottom: 8 }}>
      <button
        onClick={() => toggle(id)}
        style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 12px", background: T.edge, border: "none", cursor: "pointer", color: T.bright, fontSize: 12, fontWeight: 600 }}
      >
        <span style={{ color }}>{label}</span>
        {expanded[id] ? <ChevronUp style={{ width: 13, height: 13, color: T.dim }} /> : <ChevronDown style={{ width: 13, height: 13, color: T.dim }} />}
      </button>
      {expanded[id] && <div style={{ padding: "10px 12px", background: T.slate, fontSize: 12, color: T.text }}>{children}</div>}
    </div>
  );

  return (
    <div>
      {/* Search bar */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <input
          type="text"
          placeholder="Enter medication name…"
          value={medQuery}
          onChange={e => setMedQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && lookup(medQuery)}
          style={{ flex: 1, background: T.edge, border: `1px solid ${T.border}`, borderRadius: 6, padding: "9px 12px", color: T.text, fontSize: 13, outline: "none" }}
        />
        <button
          onClick={() => lookup(medQuery)}
          disabled={loading}
          style={{ padding: "9px 16px", background: T.teal, color: T.navy, border: "none", borderRadius: 6, fontWeight: 700, fontSize: 11, cursor: "pointer", opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "…" : "Look up"}
        </button>
      </div>

      {/* Common meds chips */}
      {!drugInfo && !loading && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
          {COMMON_MEDS.map(m => (
            <button key={m} onClick={() => lookup(m)}
              style={{ fontSize: 11, padding: "4px 10px", borderRadius: 4, border: `1px solid ${T.border}`, background: "transparent", color: T.text, cursor: "pointer" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.teal; e.currentTarget.style.color = T.teal; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.text; }}
            >{m}</button>
          ))}
        </div>
      )}

      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "16px 0", color: T.dim, fontSize: 12 }}>
          <Loader2 style={{ width: 14, height: 14, animation: "spin 0.7s linear infinite" }} />
          Looking up {medQuery}…
        </div>
      )}

      {drugInfo && !loading && (
        <div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 15, color: T.bright, fontWeight: 700 }}>{drugInfo.drug_name}</div>
            <div style={{ fontSize: 11, color: T.dim }}>{drugInfo.drug_class}</div>
            {drugInfo.black_box_warning && (
              <div style={{ display: "flex", gap: 6, alignItems: "flex-start", marginTop: 8, padding: "8px 10px", background: "rgba(255,92,108,0.1)", border: `1px solid rgba(255,92,108,0.3)`, borderRadius: 6 }}>
                <AlertTriangle style={{ width: 13, height: 13, color: T.red, flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 11, color: "#ff8a95" }}><strong>BLACK BOX:</strong> {drugInfo.black_box_warning}</span>
              </div>
            )}
          </div>

          <Section id="dosage" label="📋 Common Dosages" color={T.teal}>
            {drugInfo.common_dosages?.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {drugInfo.common_dosages.map((d, i) => (
                  <div key={i} style={{ padding: "7px 10px", background: T.edge, borderRadius: 6 }}>
                    <div style={{ color: T.amber, fontSize: 11, fontWeight: 600, marginBottom: 2 }}>{d.indication}</div>
                    <div style={{ color: T.bright, fontSize: 12 }}>{d.dose} {d.route} {d.frequency}</div>
                  </div>
                ))}
              </div>
            ) : <span style={{ color: T.dim }}>No dosage info available.</span>}
          </Section>

          <Section id="contra" label="🚫 Contraindications" color={T.red}>
            {drugInfo.contraindications?.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {drugInfo.contraindications.map((c, i) => <li key={i} style={{ marginBottom: 4 }}>{c}</li>)}
              </ul>
            ) : <span style={{ color: T.dim }}>None listed.</span>}
          </Section>

          <Section id="interactions" label="⚡ Major Interactions" color={T.purple}>
            {drugInfo.major_interactions?.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {drugInfo.major_interactions.map((ix, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div>
                      <span style={{ color: T.bright, fontWeight: 600 }}>{ix.drug}</span>
                      <span style={{ color: T.dim, fontSize: 11 }}> — {ix.effect}</span>
                    </div>
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 3, flexShrink: 0,
                      background: ix.severity?.toLowerCase() === "major" ? "rgba(255,92,108,0.2)" : ix.severity?.toLowerCase() === "moderate" ? "rgba(245,166,35,0.2)" : "rgba(0,212,188,0.15)",
                      color: ix.severity?.toLowerCase() === "major" ? T.red : ix.severity?.toLowerCase() === "moderate" ? T.amber : T.teal,
                    }}>{ix.severity?.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            ) : <span style={{ color: T.dim }}>No major interactions on record.</span>}
          </Section>

          {drugInfo.key_monitoring?.length > 0 && (
            <div style={{ padding: "8px 12px", background: T.edge, borderRadius: 6, marginTop: 4 }}>
              <div style={{ fontSize: 10, color: T.dim, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>Monitoring</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {drugInfo.key_monitoring.map((m, i) => (
                  <span key={i} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 4, background: "rgba(0,212,188,0.1)", color: T.teal, border: `1px solid rgba(0,212,188,0.2)` }}>{m}</span>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => setDrugInfo(null)}
            style={{ marginTop: 10, fontSize: 11, color: T.dim, background: "transparent", border: "none", cursor: "pointer", textDecoration: "underline" }}
          >
            ← New lookup
          </button>
        </div>
      )}
    </div>
  );
}

// ── AI Guideline Summarizer ───────────────────────────────────────────────────
function GuidelineSummaryTab() {
  const [diagnoses, setDiagnoses] = useState("");
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const summarize = async () => {
    if (!diagnoses.trim()) return;
    setLoading(true);
    setSummary(null);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a clinical decision support AI. Summarize the most current, evidence-based clinical guidelines relevant to the following patient diagnoses. Focus on management, key recommendations, and recent updates.

Diagnoses: ${diagnoses}

Be concise and actionable — suitable for bedside review.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            overall_summary: { type: "string" },
            guideline_summaries: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  diagnosis: { type: "string" },
                  guideline_source: { type: "string" },
                  key_recommendations: { type: "array", items: { type: "string" } },
                  recent_updates: { type: "string" },
                  evidence_level: { type: "string" },
                }
              }
            },
            red_flags: { type: "array", items: { type: "string" } },
            suggested_searches: { type: "array", items: { type: "string" } },
          }
        }
      });
      setSummary(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const EXAMPLE_DX = ["HTN + DM2", "COPD exacerbation", "Atrial fibrillation + HFrEF", "Sepsis (pneumonia source)"];

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <textarea
          placeholder="Enter patient diagnoses (e.g., Type 2 Diabetes, Hypertension, CKD stage 3)…"
          value={diagnoses}
          onChange={e => setDiagnoses(e.target.value)}
          rows={3}
          style={{ width: "100%", background: T.edge, border: `1px solid ${T.border}`, borderRadius: 6, padding: "10px 12px", color: T.text, fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }}
        />
        <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
          {EXAMPLE_DX.map(dx => (
            <button key={dx} onClick={() => setDiagnoses(dx)}
              style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, border: `1px solid ${T.border}`, background: "transparent", color: T.dim, cursor: "pointer" }}
              onMouseEnter={e => { e.currentTarget.style.color = T.teal; e.currentTarget.style.borderColor = T.teal; }}
              onMouseLeave={e => { e.currentTarget.style.color = T.dim; e.currentTarget.style.borderColor = T.border; }}
            >{dx}</button>
          ))}
        </div>
      </div>

      <button
        onClick={summarize}
        disabled={loading || !diagnoses.trim()}
        style={{ width: "100%", padding: "10px", background: `linear-gradient(135deg, ${T.teal}, ${T.teal2})`, color: T.navy, border: "none", borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: loading || !diagnoses.trim() ? "not-allowed" : "pointer", opacity: loading || !diagnoses.trim() ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 14 }}
      >
        {loading ? <><Loader2 style={{ width: 13, height: 13, animation: "spin 0.7s linear infinite" }} /> Analyzing guidelines…</> : <><Sparkles style={{ width: 13, height: 13 }} /> Summarize Guidelines</>}
      </button>

      {summary && !loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Overall summary */}
          <div style={{ padding: "10px 12px", background: "rgba(0,212,188,0.07)", border: `1px solid rgba(0,212,188,0.2)`, borderRadius: 8 }}>
            <div style={{ fontSize: 10, color: T.teal, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>AI Summary</div>
            <p style={{ fontSize: 12, color: T.text, lineHeight: 1.6, margin: 0 }}>{summary.overall_summary}</p>
          </div>

          {/* Per-diagnosis guidelines */}
          {summary.guideline_summaries?.map((gs, i) => (
            <div key={i} style={{ border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
              <div style={{ padding: "9px 12px", background: T.edge, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ color: T.bright, fontSize: 13, fontWeight: 600 }}>{gs.diagnosis}</div>
                  <div style={{ color: T.dim, fontSize: 10 }}>{gs.guideline_source}</div>
                </div>
                {gs.evidence_level && (
                  <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 3, background: "rgba(155,109,255,0.15)", color: T.purple, fontWeight: 700, border: `1px solid rgba(155,109,255,0.3)` }}>
                    {gs.evidence_level}
                  </span>
                )}
              </div>
              <div style={{ padding: "10px 12px", background: T.slate }}>
                {gs.key_recommendations?.length > 0 && (
                  <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: T.text, lineHeight: 1.7 }}>
                    {gs.key_recommendations.map((r, j) => <li key={j}>{r}</li>)}
                  </ul>
                )}
                {gs.recent_updates && (
                  <div style={{ marginTop: 8, padding: "6px 10px", background: "rgba(245,166,35,0.08)", borderRadius: 5, fontSize: 11, color: T.amber, border: `1px solid rgba(245,166,35,0.2)` }}>
                    <strong>Recent update:</strong> {gs.recent_updates}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Red flags */}
          {summary.red_flags?.length > 0 && (
            <div style={{ padding: "10px 12px", background: "rgba(255,92,108,0.07)", border: `1px solid rgba(255,92,108,0.25)`, borderRadius: 8 }}>
              <div style={{ fontSize: 10, color: T.red, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>⚠ Red Flags</div>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "#ff8a95", lineHeight: 1.7 }}>
                {summary.red_flags.map((rf, i) => <li key={i}>{rf}</li>)}
              </ul>
            </div>
          )}

          {/* Suggested searches */}
          {summary.suggested_searches?.length > 0 && (
            <div>
              <div style={{ fontSize: 10, color: T.dim, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Dig deeper</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {summary.suggested_searches.map((s, i) => (
                  <button key={i} onClick={() => { setDiagnoses(""); setSummary(null); }}
                    style={{ fontSize: 11, padding: "4px 10px", borderRadius: 4, border: `1px solid ${T.border}`, background: "transparent", color: T.text, cursor: "pointer" }}
                  >{s}</button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => { setSummary(null); setDiagnoses(""); }}
            style={{ fontSize: 11, color: T.dim, background: "transparent", border: "none", cursor: "pointer", textDecoration: "underline", alignSelf: "flex-start" }}
          >
            ← New summary
          </button>
        </div>
      )}
    </div>
  );
}

// ── Guidelines Search (original) ──────────────────────────────────────────────
function GuidelinesSearchTab() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedGuideline, setSelectedGuideline] = useState(null);

  const handleSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setHasSearched(true);
    setQuery(searchQuery);
    try {
      const response = await base44.functions.invoke("openEvidenceSearch", { q: searchQuery });
      const data = response.data;
      if (data && data.results) {
        setResults(data.results.map((r, idx) => ({
          id: r.id || idx,
          title: r.title || "Untitled",
          description: r.description || "",
          source: r.source || "OpenEvidence",
          url: r.url || "#",
        })));
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error("Search failed:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 0, border: `1px solid ${T.border}`, background: T.edge, borderRadius: 6, overflow: "hidden", marginBottom: 12 }}>
        <input
          type="text"
          placeholder="Search guidelines…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyPress={e => e.key === "Enter" && handleSearch(query)}
          style={{ flex: 1, fontSize: 13, padding: "10px 14px", border: "none", background: "transparent", color: T.text, outline: "none", fontFamily: "inherit" }}
        />
        <button onClick={() => handleSearch(query)} disabled={loading}
          style={{ padding: "10px 16px", background: T.teal, color: T.navy, border: "none", cursor: loading ? "not-allowed" : "pointer", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", opacity: loading ? 0.6 : 1 }}>
          {loading ? "…" : "Search"}
        </button>
      </div>

      {!hasSearched && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {QUICK_SEARCHES.map(qs => (
            <button key={qs} onClick={() => handleSearch(qs)}
              style={{ fontSize: 11, padding: "5px 12px", border: `1px solid ${T.border}`, background: "transparent", color: T.text, cursor: "pointer", borderRadius: 4, transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.teal; e.currentTarget.style.color = T.teal; e.currentTarget.style.background = `rgba(0,212,188,0.1)`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.text; e.currentTarget.style.background = "transparent"; }}
            >{qs}</button>
          ))}
        </div>
      )}

      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 0", color: T.dim, fontSize: 12 }}>
          <Loader2 style={{ width: 13, height: 13, animation: "spin 0.7s linear infinite" }} /> Searching guidelines…
        </div>
      )}

      {hasSearched && !loading && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 10, color: T.dim, marginBottom: 10 }}>{results.length} results</div>
          {results.length === 0 ? (
            <div style={{ textAlign: "center", padding: 24, color: T.dim, fontSize: 12 }}>No results. Try a different search.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {results.map(result => (
                <div key={result.id}
                  style={{ border: `1px solid ${T.border}`, background: T.edge, padding: 12, borderRadius: 6, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 0 0 1px ${T.teal}`; e.currentTarget.style.background = `rgba(0,212,188,0.05)`; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.background = T.edge; }}
                >
                  <div style={{ flex: 1, cursor: "pointer" }} onClick={() => window.open(result.url, "_blank")}>
                    <div style={{ fontSize: 13, color: T.bright, fontWeight: 600, marginBottom: 4 }}>{result.title}</div>
                    {result.description && <p style={{ fontSize: 12, color: T.text, marginBottom: 6, lineHeight: 1.5 }}>{result.description}</p>}
                    <span style={{ fontSize: 10, color: T.teal, fontFamily: "monospace" }}>{result.source}</span>
                  </div>
                  <button onClick={e => { e.stopPropagation(); setSelectedGuideline(result); }}
                    style={{ background: "transparent", border: "none", cursor: "pointer", color: T.teal, padding: 4, flexShrink: 0 }}>
                    <Star style={{ width: 18, height: 18 }} fill="currentColor" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedGuideline && (
        <SaveGuidelineModal guideline={selectedGuideline} onClose={() => setSelectedGuideline(null)} onSaved={() => setSelectedGuideline(null)} />
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function OpenEvidenceSearchPanel() {
  const [activeTab, setActiveTab] = useState("search");

  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px 20px", display: "flex", flexDirection: "column" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, color: T.dim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Evidence Search</div>
        <h2 style={{ fontSize: 17, color: T.bright, fontWeight: 600, margin: 0 }}>Clinical Guidelines</h2>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid ${T.border}`, marginBottom: 16 }}>
        <TabBtn active={activeTab === "search"} onClick={() => setActiveTab("search")} icon={Search} label="Guidelines" />
        <TabBtn active={activeTab === "drug"} onClick={() => setActiveTab("drug")} icon={Pill} label="Drug Lookup" />
        <TabBtn active={activeTab === "summarize"} onClick={() => setActiveTab("summarize")} icon={Sparkles} label="AI Summary" />
      </div>

      {/* Tab content */}
      {activeTab === "search" && <GuidelinesSearchTab />}
      {activeTab === "drug" && <DrugLookupTab />}
      {activeTab === "summarize" && <GuidelineSummaryTab />}
    </div>
  );
}