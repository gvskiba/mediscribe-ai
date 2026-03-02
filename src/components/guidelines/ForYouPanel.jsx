import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Sparkles, RefreshCw, ChevronRight } from "lucide-react";

const SPECIALTIES = [
  "Emergency Medicine", "Cardiology", "Pulmonology", "Neurology",
  "Infectious Disease", "Critical Care", "Internal Medicine", "Surgery",
  "Gastroenterology", "Nephrology", "Endocrinology", "Rheumatology",
];

const STORAGE_KEY = "clin_guideline_history";

export function recordSearch(query) {
  const history = getHistory();
  history.searches = [query, ...history.searches.filter(s => s !== query)].slice(0, 20);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function recordAnalyzed(title, source) {
  const history = getHistory();
  const entry = `${title} (${source})`;
  history.analyzed = [entry, ...history.analyzed.filter(a => a !== entry)].slice(0, 10);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { searches: [], analyzed: [], specialties: [] };
  } catch {
    return { searches: [], analyzed: [], specialties: [] };
  }
}

function saveSpecialties(specialties) {
  const history = getHistory();
  history.specialties = specialties;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export default function ForYouPanel({ onSearch, onAnalyzeRecommendation }) {
  const [history, setHistory] = useState({ searches: [], analyzed: [], specialties: [] });
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSpecialties, setSelectedSpecialties] = useState([]);
  const [showSpecialtyPicker, setShowSpecialtyPicker] = useState(false);

  useEffect(() => {
    const h = getHistory();
    setHistory(h);
    setSelectedSpecialties(h.specialties || []);
    if (h.searches.length > 0 || h.analyzed.length > 0 || (h.specialties || []).length > 0) {
      fetchRecommendations(h);
    }
  }, []);

  const toggleSpecialty = (sp) => {
    const updated = selectedSpecialties.includes(sp)
      ? selectedSpecialties.filter(s => s !== sp)
      : [...selectedSpecialties, sp];
    setSelectedSpecialties(updated);
    saveSpecialties(updated);
    const h = getHistory();
    fetchRecommendations({ ...h, specialties: updated });
  };

  const fetchRecommendations = async (h) => {
    setLoading(true);
    setRecommendations([]);

    const contextParts = [];
    if ((h.specialties || []).length > 0) contextParts.push(`User's specialties: ${h.specialties.join(", ")}.`);
    if (h.searches.length > 0) contextParts.push(`Recent searches: ${h.searches.slice(0, 8).join(", ")}.`);
    if (h.analyzed.length > 0) contextParts.push(`Previously analyzed guidelines: ${h.analyzed.slice(0, 5).join("; ")}.`);

    const context = contextParts.length > 0 ? contextParts.join(" ") : "General internal medicine / emergency medicine provider.";

    const prompt = `You are a clinical guidelines recommendation engine for a physician. Based on the following context about this provider, suggest 5 clinical guidelines they may find valuable but haven't explicitly searched for yet.

Context: ${context}

Rules:
- Suggest guidelines that are topically ADJACENT or complementary to their history (not exact duplicates of prior searches)
- Prioritize recently updated (2020–2025) guidelines from authoritative sources (ACC/AHA, ACEP, IDSA, ATS, USPSTF, NIH, WHO, Cochrane, SCCM, etc.)
- Each recommendation should feel personalized and explain WHY it's relevant to this provider
- Vary the specialties and types (diagnostic, treatment, screening)

For each recommendation return:
- title: Official guideline title
- source_abbreviation: e.g. ACC/AHA, ACEP
- publicationYear: number
- why_recommended: 1–2 sentence explanation of why this is relevant to this provider
- search_query: A concise search term to find this guideline (3–6 words)
- tag: A short category tag (e.g. "Cardiology", "Sepsis", "Screening")`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: false,
      response_json_schema: {
        type: "object",
        properties: {
          recommendations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                source_abbreviation: { type: "string" },
                publicationYear: { type: "number" },
                why_recommended: { type: "string" },
                search_query: { type: "string" },
                tag: { type: "string" },
              },
            },
          },
        },
      },
    });

    setRecommendations(response?.recommendations || []);
    setLoading(false);
  };

  const TAG_COLORS = [
    "rgba(155,109,255,0.15)", "rgba(0,212,188,0.12)", "rgba(245,166,35,0.12)",
    "rgba(46,204,113,0.12)", "rgba(244,114,182,0.12)", "rgba(99,102,241,0.12)",
  ];
  const TAG_TEXT = ["#9b6dff", "#00d4bc", "#f5a623", "#2ecc71", "#f472b6", "#818cf8"];

  const hasContext = history.searches.length > 0 || history.analyzed.length > 0 || selectedSpecialties.length > 0;

  return (
    <div className="bg-[#0e2340] border border-[#1e3a5f] rounded-xl flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-[#1e3a5f] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-[#9b6dff]" />
          <span className="text-xs font-bold uppercase tracking-wide text-[#9b6dff]">For You</span>
          <span className="text-xs text-[#4a7299]">— AI-personalized recommendations</span>
        </div>
        <button
          onClick={() => fetchRecommendations({ ...history, specialties: selectedSpecialties })}
          disabled={loading}
          className="text-[#4a7299] hover:text-[#00d4bc] transition-all disabled:opacity-40"
          title="Refresh recommendations"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide p-4 flex flex-col gap-4">
        {/* Specialty Picker */}
        <div>
          <button
            onClick={() => setShowSpecialtyPicker(v => !v)}
            className="text-xs text-[#4a7299] hover:text-[#c8ddf0] flex items-center gap-1 mb-2 transition-all"
          >
            <ChevronRight size={11} className={`transition-transform ${showSpecialtyPicker ? "rotate-90" : ""}`} />
            Your Specialties {selectedSpecialties.length > 0 && <span className="text-[#9b6dff]">({selectedSpecialties.length} selected)</span>}
          </button>
          {showSpecialtyPicker && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {SPECIALTIES.map((sp, i) => (
                <button
                  key={sp}
                  onClick={() => toggleSpecialty(sp)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${selectedSpecialties.includes(sp) ? "border-[#9b6dff] bg-[rgba(155,109,255,0.15)] text-[#9b6dff]" : "border-[#1e3a5f] bg-[#162d4f] text-[#4a7299] hover:border-[#2a4d72]"}`}
                >
                  {sp}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-10">
            <Loader2 size={22} className="text-[#9b6dff] animate-spin" />
            <span className="text-xs text-[#4a7299]">Personalizing recommendations…</span>
          </div>
        )}

        {/* No context yet */}
        {!loading && !hasContext && recommendations.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="text-4xl">✨</div>
            <div className="text-sm font-semibold text-[#e8f4ff]">Personalize Your Feed</div>
            <div className="text-xs text-[#4a7299] leading-relaxed max-w-xs">
              Select your specialties above, then search for a few guidelines. The AI will learn your interests and recommend relevant guidelines you haven't discovered yet.
            </div>
            <button
              onClick={() => setShowSpecialtyPicker(true)}
              className="px-4 py-2 rounded-lg text-xs font-semibold border border-[#9b6dff] bg-[rgba(155,109,255,0.1)] text-[#9b6dff] cursor-pointer hover:bg-[rgba(155,109,255,0.2)] transition-all mt-1"
            >
              Select Specialties
            </button>
          </div>
        )}

        {/* Recommendations */}
        {!loading && recommendations.length > 0 && (
          <div className="flex flex-col gap-3">
            {recommendations.map((rec, i) => (
              <div
                key={i}
                className="bg-[#162d4f] border border-[#1e3a5f] rounded-lg p-3 flex flex-col gap-2 hover:border-[#9b6dff] transition-all cursor-pointer group"
                onClick={() => onSearch(rec.search_query)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-[#e8f4ff] leading-snug group-hover:text-white transition-all">{rec.title}</div>
                    <div className="text-xs text-[#4a7299] mt-0.5">
                      <span className="text-[#c8ddf0] font-medium">{rec.source_abbreviation}</span>
                      {rec.publicationYear && <span> · {rec.publicationYear}</span>}
                    </div>
                  </div>
                  {rec.tag && (
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                      style={{ background: TAG_COLORS[i % TAG_COLORS.length], color: TAG_TEXT[i % TAG_TEXT.length] }}
                    >
                      {rec.tag}
                    </span>
                  )}
                </div>
                <div className="text-xs text-[#4a7299] leading-relaxed italic border-l-2 border-[#2a4d72] pl-2">
                  {rec.why_recommended}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onSearch(rec.search_query); }}
                  className="self-start px-2.5 py-1 rounded text-xs font-semibold border border-[#9b6dff] bg-[rgba(155,109,255,0.1)] text-[#9b6dff] cursor-pointer hover:bg-[rgba(155,109,255,0.2)] transition-all"
                >
                  Search This →
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Search history summary */}
        {history.searches.length > 0 && (
          <div className="border-t border-[#1e3a5f] pt-3">
            <div className="text-xs text-[#4a7299] mb-2 font-semibold uppercase tracking-wide">Recent Searches</div>
            <div className="flex flex-wrap gap-1.5">
              {history.searches.slice(0, 8).map((s, i) => (
                <button
                  key={i}
                  onClick={() => onSearch(s)}
                  className="px-2.5 py-1 rounded-md text-xs border border-[#1e3a5f] bg-[#0e2340] text-[#4a7299] hover:border-[#4a7299] hover:text-[#c8ddf0] transition-all cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}