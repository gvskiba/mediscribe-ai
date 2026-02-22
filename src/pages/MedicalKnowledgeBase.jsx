import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen, Search, Loader2, ExternalLink, AlertCircle, Pill,
  Stethoscope, FlaskConical, FileText, Sparkles, TrendingUp,
  ChevronDown, ChevronUp, Copy, BookMarked, Globe, Activity, Star
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const SEARCH_TABS = [
  { id: "literature", label: "Medical Literature", icon: BookOpen, color: "blue", description: "PubMed, Cochrane, meta-analyses" },
  { id: "drug", label: "Drug Information", icon: Pill, color: "emerald", description: "Pharmacology, dosing, interactions" },
  { id: "guidelines", label: "Clinical Guidelines", icon: FileText, color: "purple", description: "ACEP, ACC/AHA, IDSA & more" },
  { id: "condition", label: "Disease & Condition", icon: Stethoscope, color: "amber", description: "Pathophysiology, dx, treatment" },
];

const QUICK_SEARCHES = {
  literature: ["Atrial fibrillation management RCT", "Sepsis bundle outcomes", "Hypertension treatment meta-analysis", "Type 2 diabetes SGLT2 inhibitors"],
  drug: ["Metformin dosing renal failure", "Apixaban drug interactions", "Amoxicillin pediatric dosing", "Metoprolol vs carvedilol heart failure"],
  guidelines: ["ACEP chest pain guidelines", "ADA diabetes standards 2024", "IDSA CAP treatment", "ACC/AHA heart failure"],
  condition: ["Community acquired pneumonia", "Acute coronary syndrome", "Pulmonary embolism diagnosis", "Stroke TIA management"],
};

const QUICK_DRUG_LINKS = [
  { name: "Epocrates", url: "https://online.epocrates.com", icon: "💊" },
  { name: "Drugs.com", url: "https://www.drugs.com", icon: "🔬" },
  { name: "Micromedex", url: "https://www.micromedexsolutions.com", icon: "📋" },
  { name: "FDA Drug DB", url: "https://www.accessdata.fda.gov/scripts/cder/daf/", icon: "🏛️" },
  { name: "PubMed", url: "https://pubmed.ncbi.nlm.nih.gov", icon: "📚" },
  { name: "Cochrane", url: "https://www.cochranelibrary.com", icon: "🔍" },
  { name: "OpenEvidence", url: "https://www.openevidence.com", icon: "✨" },
  { name: "UpToDate", url: "https://www.uptodate.com", icon: "📖" },
];

function ResultCard({ title, content, color = "blue", expandable = false, defaultExpanded = true }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const colorMap = {
    blue: "bg-blue-50 border-blue-200 text-blue-900",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-900",
    purple: "bg-purple-50 border-purple-200 text-purple-900",
    amber: "bg-amber-50 border-amber-200 text-amber-900",
    red: "bg-red-50 border-red-200 text-red-900",
    slate: "bg-slate-50 border-slate-200 text-slate-900",
  };
  const headerColor = colorMap[color] || colorMap.blue;

  return (
    <div className={`rounded-xl border overflow-hidden ${headerColor}`}>
      {expandable ? (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between p-4 hover:opacity-80 transition-opacity"
        >
          <span className="font-semibold text-sm">{title}</span>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      ) : (
        <div className="p-4 pb-2 font-semibold text-sm">{title}</div>
      )}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-4 pb-4">{content}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function MedicalKnowledgeBase() {
  const [activeTab, setActiveTab] = useState("literature");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [savedResults, setSavedResults] = useState([]);
  const [showSaved, setShowSaved] = useState(false);

  const buildPrompt = (q, tab) => {
    if (tab === "drug") {
      return `You are a clinical pharmacist and medical knowledge expert. Search all available drug databases, FDA labeling, pharmacology references, and clinical literature to provide comprehensive information on: "${q}"

Search the following databases:
- FDA Drug Database (accessdata.fda.gov)
- Drugs.com and Micromedex
- Clinical pharmacology databases
- PubMed for drug studies

Return comprehensive drug information including:
- drug_class: Drug/therapeutic class
- mechanism: Mechanism of action
- indications: FDA-approved and off-label indications
- dosing: Dosing by indication and patient population (include renal/hepatic adjustments)
- contraindications: Absolute and relative contraindications
- adverse_effects: Common (>5%) and serious adverse effects
- drug_interactions: Major and moderate drug interactions with clinical significance
- monitoring: Labs, parameters, and frequency to monitor
- pearls: Key clinical pearls and special considerations
- evidence_summary: Brief summary of supporting clinical evidence
- source_links: Array of {title, url, source} with real working links to FDA label, drug monographs, key studies
- black_box_warnings: Array of black box warnings if applicable`;
    }

    if (tab === "guidelines") {
      return `You are a clinical evidence expert. Search major medical society guidelines and evidence databases for: "${q}"

Search:
- ACEP, AAFP, ACC/AHA, ADA, IDSA, ATS/CHEST, AAN, AAP, ACOG, AGA, NICE, ESC guidelines
- OpenEvidence (openevidence.com)
- UpToDate
- Cochrane Library

Return structured guideline information:
- summary: Executive summary of key recommendations (3-4 sentences)
- key_recommendations: Array of 5-8 specific, actionable recommendations with strength/evidence levels
- first_line_treatment: First-line treatment options
- second_line_treatment: Second-line or alternative options
- when_to_refer: Criteria for referral or escalation
- monitoring: Follow-up and monitoring recommendations
- source_links: Array of {title, url, source, year} with REAL links to the actual guidelines
- organizations: Array of organizations with relevant guidelines
- evidence_grade: Overall evidence grade (A/B/C)
- last_updated: Year of most recent major update`;
    }

    if (tab === "condition") {
      return `You are a clinical medicine expert. Provide comprehensive clinical information on the condition/disease: "${q}"

Draw from:
- Major medical textbooks and UpToDate
- Current clinical guidelines
- Recent systematic reviews (PubMed/Cochrane)

Return:
- definition: Concise clinical definition
- epidemiology: Prevalence, incidence, risk factors
- pathophysiology: Key pathophysiologic mechanisms
- clinical_presentation: Typical symptoms, signs, and variants
- diagnosis: Diagnostic criteria, key tests, imaging, labs with sensitivity/specificity
- differential_diagnosis: Array of key differentials with distinguishing features
- treatment_overview: Summary of management approach
- prognosis: Expected outcomes and prognostic factors
- complications: Important complications to watch for
- patient_education: Key points for patient counseling
- source_links: Array of {title, url, source} with real references`;
    }

    // literature (default)
    return `You are a medical research librarian and evidence synthesis expert. Search PubMed, Cochrane Library, major medical journals, and clinical databases for: "${q}"

Search:
- PubMed/MEDLINE (pubmed.ncbi.nlm.nih.gov)
- Cochrane Library (cochranelibrary.com)
- Major journals: NEJM, JAMA, Lancet, BMJ, JACC, Circulation, CHEST, etc.
- ClinicalTrials.gov for ongoing studies

Return structured literature review:
- summary: 3-4 sentence synthesis of the best available evidence
- key_findings: Array of 5-7 key findings from major studies with study names and years
- evidence_quality: Assessment of overall evidence quality (high/moderate/low) with explanation
- landmark_trials: Array of {name, year, finding, n_patients} for major trials
- meta_analyses: Key systematic reviews and meta-analyses with findings
- current_consensus: Current clinical consensus based on literature
- knowledge_gaps: Areas where evidence is lacking or conflicting
- recent_updates: Any 2023-2026 updates or new data
- source_links: Array of {title, url, source, year} with REAL PubMed links (format: pubmed.ncbi.nlm.nih.gov/PMID)`;
  };

  const handleSearch = async (searchQuery = query, tab = activeTab) => {
    if (!searchQuery.trim()) return;
    setQuery(searchQuery);
    setLoading(true);
    setResults(null);

    const schemaMap = {
      drug: {
        type: "object",
        properties: {
          drug_class: { type: "string" },
          mechanism: { type: "string" },
          indications: { type: "array", items: { type: "string" } },
          dosing: { type: "string" },
          contraindications: { type: "array", items: { type: "string" } },
          adverse_effects: { type: "array", items: { type: "string" } },
          drug_interactions: { type: "array", items: { type: "string" } },
          monitoring: { type: "array", items: { type: "string" } },
          pearls: { type: "array", items: { type: "string" } },
          evidence_summary: { type: "string" },
          black_box_warnings: { type: "array", items: { type: "string" } },
          source_links: { type: "array", items: { type: "object", properties: { title: { type: "string" }, url: { type: "string" }, source: { type: "string" } } } }
        }
      },
      guidelines: {
        type: "object",
        properties: {
          summary: { type: "string" },
          key_recommendations: { type: "array", items: { type: "string" } },
          first_line_treatment: { type: "string" },
          second_line_treatment: { type: "string" },
          when_to_refer: { type: "string" },
          monitoring: { type: "string" },
          organizations: { type: "array", items: { type: "string" } },
          evidence_grade: { type: "string" },
          last_updated: { type: "string" },
          source_links: { type: "array", items: { type: "object", properties: { title: { type: "string" }, url: { type: "string" }, source: { type: "string" }, year: { type: "string" } } } }
        }
      },
      condition: {
        type: "object",
        properties: {
          definition: { type: "string" },
          epidemiology: { type: "string" },
          pathophysiology: { type: "string" },
          clinical_presentation: { type: "string" },
          diagnosis: { type: "string" },
          differential_diagnosis: { type: "array", items: { type: "string" } },
          treatment_overview: { type: "string" },
          prognosis: { type: "string" },
          complications: { type: "array", items: { type: "string" } },
          patient_education: { type: "string" },
          source_links: { type: "array", items: { type: "object", properties: { title: { type: "string" }, url: { type: "string" }, source: { type: "string" } } } }
        }
      },
      literature: {
        type: "object",
        properties: {
          summary: { type: "string" },
          key_findings: { type: "array", items: { type: "string" } },
          evidence_quality: { type: "string" },
          landmark_trials: { type: "array", items: { type: "object", properties: { name: { type: "string" }, year: { type: "string" }, finding: { type: "string" }, n_patients: { type: "string" } } } },
          meta_analyses: { type: "array", items: { type: "string" } },
          current_consensus: { type: "string" },
          knowledge_gaps: { type: "string" },
          recent_updates: { type: "string" },
          source_links: { type: "array", items: { type: "object", properties: { title: { type: "string" }, url: { type: "string" }, source: { type: "string" }, year: { type: "string" } } } }
        }
      }
    };

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: buildPrompt(searchQuery, tab),
        add_context_from_internet: true,
        response_json_schema: schemaMap[tab]
      });
      setResults({ ...result, _tab: tab, _query: searchQuery });
    } catch (error) {
      toast.error("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!results) return;
    setSavedResults(prev => [{ ...results, _savedAt: new Date().toISOString() }, ...prev]);
    toast.success("Result saved");
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const renderResults = () => {
    if (!results) return null;
    const tab = results._tab;

    if (tab === "drug") return <DrugResults r={results} onCopy={handleCopy} />;
    if (tab === "guidelines") return <GuidelineResults r={results} onCopy={handleCopy} />;
    if (tab === "condition") return <ConditionResults r={results} onCopy={handleCopy} />;
    return <LiteratureResults r={results} onCopy={handleCopy} />;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <FlaskConical className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Medical Knowledge Base</h1>
              <p className="text-slate-300 text-sm mt-0.5">Literature • Drug Info • Guidelines • Disease Reference</p>
            </div>
          </div>
          {/* Quick External Links */}
          <div className="flex flex-wrap gap-2 mt-5">
            {QUICK_DRUG_LINKS.map(link => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1.5 rounded-full border border-white/20 transition-all"
              >
                <span>{link.icon}</span>
                {link.name}
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Search Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {SEARCH_TABS.map(tab => {
          const Icon = tab.icon;
          const colorMap = {
            blue: "border-blue-500 bg-blue-600 text-white",
            emerald: "border-emerald-500 bg-emerald-600 text-white",
            purple: "border-purple-500 bg-purple-600 text-white",
            amber: "border-amber-500 bg-amber-600 text-white",
          };
          const inactiveMap = {
            blue: "border-blue-200 hover:border-blue-400 hover:bg-blue-50",
            emerald: "border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50",
            purple: "border-purple-200 hover:border-purple-400 hover:bg-purple-50",
            amber: "border-amber-200 hover:border-amber-400 hover:bg-amber-50",
          };
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setResults(null); setQuery(""); }}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${active ? colorMap[tab.color] : `bg-white ${inactiveMap[tab.color]}`}`}
            >
              <Icon className={`w-6 h-6 ${active ? "text-white" : `text-${tab.color}-600`}`} />
              <span className={`font-semibold text-sm ${active ? "text-white" : "text-slate-900"}`}>{tab.label}</span>
              <span className={`text-xs text-center ${active ? "text-white/80" : "text-slate-500"}`}>{tab.description}</span>
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder={
                activeTab === "drug" ? "Search drug name, class, or indication..." :
                activeTab === "guidelines" ? "Search clinical topic or condition..." :
                activeTab === "condition" ? "Search disease or condition name..." :
                "Search medical topic, trial name, or question..."
              }
              className="pl-9 h-12 text-base rounded-xl"
            />
          </div>
          <Button
            onClick={() => handleSearch()}
            disabled={loading || !query.trim()}
            className="h-12 px-6 rounded-xl gap-2 bg-slate-800 hover:bg-slate-900 text-white"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Search
          </Button>
        </div>

        {/* Quick Search Chips */}
        <div className="mt-4">
          <p className="text-xs text-slate-500 mb-2 font-medium">Quick searches:</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_SEARCHES[activeTab]?.map((qs, i) => (
              <button
                key={i}
                onClick={() => handleSearch(qs)}
                className="text-xs px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all"
              >
                {qs}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-slate-600 animate-spin" />
          </div>
          <p className="text-slate-900 font-semibold">Searching medical databases...</p>
          <p className="text-slate-500 text-sm mt-1">Querying PubMed, Cochrane, specialty guidelines & more</p>
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {results && !loading && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Result Header */}
            <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200 px-5 py-4">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">
                  {SEARCH_TABS.find(t => t.id === results._tab)?.label} Results
                </p>
                <h2 className="text-lg font-bold text-slate-900 mt-0.5">"{results._query}"</h2>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleSave} className="gap-1.5 rounded-lg">
                  <BookMarked className="w-4 h-4" /> Save
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleCopy(JSON.stringify(results, null, 2))} className="gap-1.5 rounded-lg">
                  <Copy className="w-4 h-4" /> Copy
                </Button>
              </div>
            </div>
            {renderResults()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!results && !loading && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <FlaskConical className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Select a search type above and enter your query to search the medical knowledge base</p>
        </div>
      )}

      {/* Saved Results */}
      {savedResults.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <button
            onClick={() => setShowSaved(!showSaved)}
            className="w-full flex items-center justify-between p-5 hover:bg-slate-50"
          >
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              <span className="font-semibold text-slate-900">Saved Results ({savedResults.length})</span>
            </div>
            {showSaved ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>
          {showSaved && (
            <div className="border-t border-slate-200 p-5 space-y-3">
              {savedResults.map((r, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div>
                    <Badge className="mb-1 text-xs">{SEARCH_TABS.find(t => t.id === r._tab)?.label}</Badge>
                    <p className="font-medium text-slate-900 text-sm">{r._query}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{new Date(r._savedAt).toLocaleString()}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setResults(r)} className="rounded-lg">View</Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SourceLinks({ links }) {
  if (!links?.length) return null;
  return (
    <div className="mt-3 space-y-1.5 border-t border-current/20 pt-3">
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70 mb-2">Sources & References</p>
      {links.map((link, i) => (
        <a
          key={i}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-2 text-xs hover:underline opacity-80 hover:opacity-100 transition-opacity"
        >
          <ExternalLink className="w-3 h-3 flex-shrink-0 mt-0.5" />
          <span><strong>{link.source}</strong>{link.year ? ` (${link.year})` : ""}: {link.title}</span>
        </a>
      ))}
    </div>
  );
}

function LiteratureResults({ r, onCopy }) {
  return (
    <div className="space-y-4">
      <ResultCard
        title="Evidence Summary"
        color="blue"
        content={
          <div className="space-y-3">
            <p className="text-sm text-blue-800 leading-relaxed">{r.summary}</p>
            {r.evidence_quality && (
              <Badge className="bg-blue-100 text-blue-800 border border-blue-300">
                Evidence Quality: {r.evidence_quality}
              </Badge>
            )}
            {r.current_consensus && (
              <div className="bg-white/60 rounded-lg p-3 border border-blue-200 mt-2">
                <p className="text-xs font-semibold text-blue-900 mb-1">Current Consensus</p>
                <p className="text-sm text-blue-800">{r.current_consensus}</p>
              </div>
            )}
            <SourceLinks links={r.source_links} />
          </div>
        }
      />

      {r.landmark_trials?.length > 0 && (
        <ResultCard
          title={`Landmark Trials (${r.landmark_trials.length})`}
          color="purple"
          expandable
          content={
            <div className="space-y-3">
              {r.landmark_trials.map((trial, i) => (
                <div key={i} className="bg-white rounded-lg p-4 border border-purple-200">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="font-bold text-purple-900 text-sm">{trial.name}</p>
                    <div className="flex gap-1.5 flex-shrink-0">
                      {trial.year && <Badge className="bg-purple-100 text-purple-700 border border-purple-300 text-xs">{trial.year}</Badge>}
                      {trial.n_patients && <Badge className="bg-slate-100 text-slate-600 border border-slate-200 text-xs">n={trial.n_patients}</Badge>}
                    </div>
                  </div>
                  <p className="text-sm text-purple-800">{trial.finding}</p>
                </div>
              ))}
            </div>
          }
        />
      )}

      {r.key_findings?.length > 0 && (
        <ResultCard
          title="Key Findings"
          color="emerald"
          expandable
          content={
            <ul className="space-y-2">
              {r.key_findings.map((f, i) => (
                <li key={i} className="text-sm text-emerald-800 flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
                  {f}
                </li>
              ))}
            </ul>
          }
        />
      )}

      {r.meta_analyses?.length > 0 && (
        <ResultCard
          title="Systematic Reviews & Meta-Analyses"
          color="amber"
          expandable
          defaultExpanded={false}
          content={
            <ul className="space-y-2">
              {r.meta_analyses.map((m, i) => (
                <li key={i} className="text-sm text-amber-800 flex items-start gap-2">
                  <span className="text-amber-500 mt-1">•</span>{m}
                </li>
              ))}
            </ul>
          }
        />
      )}

      {(r.knowledge_gaps || r.recent_updates) && (
        <ResultCard
          title="Knowledge Gaps & Recent Updates"
          color="slate"
          expandable
          defaultExpanded={false}
          content={
            <div className="space-y-3">
              {r.recent_updates && <div><p className="text-xs font-semibold text-slate-700 mb-1">Recent Updates (2023-2026)</p><p className="text-sm text-slate-700">{r.recent_updates}</p></div>}
              {r.knowledge_gaps && <div><p className="text-xs font-semibold text-slate-700 mb-1">Knowledge Gaps</p><p className="text-sm text-slate-700">{r.knowledge_gaps}</p></div>}
            </div>
          }
        />
      )}
    </div>
  );
}

function DrugResults({ r, onCopy }) {
  return (
    <div className="space-y-4">
      {r.black_box_warnings?.length > 0 && (
        <div className="bg-red-600 text-white rounded-xl p-4 border-2 border-red-700">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5" />
            <span className="font-bold text-sm uppercase tracking-wide">⚠ Black Box Warning(s)</span>
          </div>
          {r.black_box_warnings.map((w, i) => <p key={i} className="text-sm mt-1 text-red-100">• {w}</p>)}
        </div>
      )}

      <ResultCard
        title="Drug Overview"
        color="emerald"
        content={
          <div className="space-y-3">
            {r.drug_class && <div><p className="text-xs font-semibold text-emerald-900 mb-1">Drug Class</p><p className="text-sm text-emerald-800">{r.drug_class}</p></div>}
            {r.mechanism && <div><p className="text-xs font-semibold text-emerald-900 mb-1">Mechanism of Action</p><p className="text-sm text-emerald-800">{r.mechanism}</p></div>}
            {r.indications?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-emerald-900 mb-1">Indications</p>
                <div className="flex flex-wrap gap-1.5">{r.indications.map((ind, i) => <Badge key={i} className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs">{ind}</Badge>)}</div>
              </div>
            )}
            <SourceLinks links={r.source_links} />
          </div>
        }
      />

      {r.dosing && (
        <ResultCard
          title="Dosing"
          color="blue"
          content={<p className="text-sm text-blue-800 leading-relaxed whitespace-pre-line">{r.dosing}</p>}
        />
      )}

      {r.adverse_effects?.length > 0 && (
        <ResultCard
          title="Adverse Effects"
          color="amber"
          expandable
          content={
            <ul className="space-y-1.5">
              {r.adverse_effects.map((ae, i) => <li key={i} className="text-sm text-amber-800 flex items-start gap-2"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-600" />{ae}</li>)}
            </ul>
          }
        />
      )}

      {r.contraindications?.length > 0 && (
        <ResultCard
          title="Contraindications"
          color="red"
          expandable
          content={
            <ul className="space-y-1.5">
              {r.contraindications.map((ci, i) => <li key={i} className="text-sm text-red-800 flex items-start gap-2"><span className="text-red-500 mt-1 flex-shrink-0">✕</span>{ci}</li>)}
            </ul>
          }
        />
      )}

      {r.drug_interactions?.length > 0 && (
        <ResultCard
          title="Drug Interactions"
          color="purple"
          expandable
          defaultExpanded={false}
          content={
            <ul className="space-y-1.5">
              {r.drug_interactions.map((di, i) => <li key={i} className="text-sm text-purple-800 flex items-start gap-2"><span className="text-purple-500 mt-1 flex-shrink-0">⚡</span>{di}</li>)}
            </ul>
          }
        />
      )}

      {r.monitoring?.length > 0 && (
        <ResultCard
          title="Monitoring Parameters"
          color="slate"
          expandable
          defaultExpanded={false}
          content={
            <ul className="space-y-1.5">
              {r.monitoring.map((m, i) => <li key={i} className="text-sm text-slate-700 flex items-start gap-2"><Activity className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-slate-500" />{m}</li>)}
            </ul>
          }
        />
      )}

      {r.pearls?.length > 0 && (
        <ResultCard
          title="Clinical Pearls"
          color="blue"
          expandable
          defaultExpanded={false}
          content={
            <ul className="space-y-1.5">
              {r.pearls.map((p, i) => <li key={i} className="text-sm text-blue-800 flex items-start gap-2"><Sparkles className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-blue-500" />{p}</li>)}
            </ul>
          }
        />
      )}
    </div>
  );
}

function GuidelineResults({ r, onCopy }) {
  return (
    <div className="space-y-4">
      <ResultCard
        title="Guideline Summary"
        color="purple"
        content={
          <div className="space-y-3">
            <p className="text-sm text-purple-800 leading-relaxed">{r.summary}</p>
            <div className="flex flex-wrap gap-2">
              {r.evidence_grade && <Badge className="bg-purple-100 text-purple-800 border border-purple-300">Evidence Grade: {r.evidence_grade}</Badge>}
              {r.last_updated && <Badge className="bg-slate-100 text-slate-700 border border-slate-300">Updated: {r.last_updated}</Badge>}
            </div>
            {r.organizations?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {r.organizations.map((org, i) => <Badge key={i} className="bg-indigo-100 text-indigo-700 border border-indigo-300 text-xs">{org}</Badge>)}
              </div>
            )}
            <SourceLinks links={r.source_links} />
          </div>
        }
      />

      {r.key_recommendations?.length > 0 && (
        <ResultCard
          title="Key Recommendations"
          color="blue"
          content={
            <ul className="space-y-2">
              {r.key_recommendations.map((rec, i) => (
                <li key={i} className="text-sm text-blue-800 flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">{i + 1}</span>
                  {rec}
                </li>
              ))}
            </ul>
          }
        />
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {r.first_line_treatment && (
          <ResultCard
            title="First-Line Treatment"
            color="emerald"
            content={<p className="text-sm text-emerald-800 leading-relaxed">{r.first_line_treatment}</p>}
          />
        )}
        {r.second_line_treatment && (
          <ResultCard
            title="Second-Line / Alternatives"
            color="amber"
            content={<p className="text-sm text-amber-800 leading-relaxed">{r.second_line_treatment}</p>}
          />
        )}
      </div>

      {r.when_to_refer && (
        <ResultCard
          title="When to Refer / Escalate"
          color="red"
          expandable
          defaultExpanded={false}
          content={<p className="text-sm text-red-800 leading-relaxed">{r.when_to_refer}</p>}
        />
      )}

      {r.monitoring && (
        <ResultCard
          title="Monitoring & Follow-Up"
          color="slate"
          expandable
          defaultExpanded={false}
          content={<p className="text-sm text-slate-700 leading-relaxed">{r.monitoring}</p>}
        />
      )}
    </div>
  );
}

function ConditionResults({ r, onCopy }) {
  return (
    <div className="space-y-4">
      {r.definition && (
        <ResultCard
          title="Definition & Overview"
          color="amber"
          content={
            <div>
              <p className="text-sm text-amber-800 leading-relaxed">{r.definition}</p>
              {r.epidemiology && (
                <div className="mt-3 pt-3 border-t border-amber-200">
                  <p className="text-xs font-semibold text-amber-900 mb-1">Epidemiology</p>
                  <p className="text-sm text-amber-800">{r.epidemiology}</p>
                </div>
              )}
              <SourceLinks links={r.source_links} />
            </div>
          }
        />
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {r.clinical_presentation && (
          <ResultCard
            title="Clinical Presentation"
            color="blue"
            content={<p className="text-sm text-blue-800 leading-relaxed">{r.clinical_presentation}</p>}
          />
        )}
        {r.pathophysiology && (
          <ResultCard
            title="Pathophysiology"
            color="purple"
            content={<p className="text-sm text-purple-800 leading-relaxed">{r.pathophysiology}</p>}
          />
        )}
      </div>

      {r.diagnosis && (
        <ResultCard
          title="Diagnosis"
          color="emerald"
          content={<p className="text-sm text-emerald-800 leading-relaxed">{r.diagnosis}</p>}
        />
      )}

      {r.differential_diagnosis?.length > 0 && (
        <ResultCard
          title="Differential Diagnosis"
          color="slate"
          expandable
          content={
            <div className="flex flex-wrap gap-2">
              {r.differential_diagnosis.map((dd, i) => (
                <span key={i} className="text-sm bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-700">{dd}</span>
              ))}
            </div>
          }
        />
      )}

      {r.treatment_overview && (
        <ResultCard
          title="Treatment Overview"
          color="blue"
          content={<p className="text-sm text-blue-800 leading-relaxed">{r.treatment_overview}</p>}
        />
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {r.complications?.length > 0 && (
          <ResultCard
            title="Complications"
            color="red"
            expandable
            defaultExpanded={false}
            content={
              <ul className="space-y-1.5">
                {r.complications.map((c, i) => <li key={i} className="text-sm text-red-800 flex items-start gap-2"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-red-500" />{c}</li>)}
              </ul>
            }
          />
        )}
        {r.prognosis && (
          <ResultCard
            title="Prognosis"
            color="slate"
            expandable
            defaultExpanded={false}
            content={<p className="text-sm text-slate-700 leading-relaxed">{r.prognosis}</p>}
          />
        )}
      </div>

      {r.patient_education && (
        <ResultCard
          title="Patient Education Key Points"
          color="emerald"
          expandable
          defaultExpanded={false}
          content={<p className="text-sm text-emerald-800 leading-relaxed">{r.patient_education}</p>}
        />
      )}
    </div>
  );
}