import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Newspaper, ExternalLink, RefreshCw, Sparkles, ChevronDown, ChevronUp, Loader2, X, Settings, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ── Storage helpers ────────────────────────────────────────────────────────────
const PREFS_KEY = "news_specialty_prefs_v1";
const HIDDEN_KEY = "news_hidden_v1";

function getSpecialtyPrefs() {
  try { return JSON.parse(localStorage.getItem(PREFS_KEY) || "[]"); } catch { return []; }
}
function saveSpecialtyPrefs(prefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}
function getHiddenTitles() {
  try { return JSON.parse(localStorage.getItem(HIDDEN_KEY) || "[]"); } catch { return []; }
}
function hideStory(title) {
  const hidden = getHiddenTitles();
  if (!hidden.includes(title)) {
    localStorage.setItem(HIDDEN_KEY, JSON.stringify([...hidden, title].slice(0, 200)));
  }
}

// ── Available specialty interests ─────────────────────────────────────────────
const SPECIALTIES = [
  { id: "cardiology",       label: "Cardiology",         emoji: "🫀" },
  { id: "neurology",        label: "Neurology",          emoji: "🧠" },
  { id: "infectious",       label: "Infectious Disease", emoji: "🦠" },
  { id: "oncology",         label: "Oncology",           emoji: "🎗️" },
  { id: "emergency",        label: "Emergency Medicine", emoji: "🚨" },
  { id: "pulmonology",      label: "Pulmonology",        emoji: "🫁" },
  { id: "gastro",           label: "Gastroenterology",   emoji: "🫃" },
  { id: "endocrinology",    label: "Endocrinology",      emoji: "⚗️" },
  { id: "nephrology",       label: "Nephrology",         emoji: "🩺" },
  { id: "psychiatry",       label: "Psychiatry",         emoji: "🧩" },
  { id: "pediatrics",       label: "Pediatrics",         emoji: "👶" },
  { id: "surgery",          label: "Surgery",            emoji: "🔪" },
];

const newsCategories = [
  { id: "all", label: "All News" },
  { id: "clinical", label: "Clinical Guidelines" },
  { id: "research", label: "Research" },
  { id: "devices", label: "Medical Devices" },
  { id: "emergency", label: "Emergency Medicine" },
  { id: "ai", label: "AI & Technology" },
  { id: "fda", label: "FDA Updates" },
  { id: "public_health", label: "Public Health" },
];

// ── Specialty Preferences Modal ───────────────────────────────────────────────
function SpecialtyModal({ selected, onSave, onClose }) {
  const [draft, setDraft] = useState(selected);

  const toggle = (id) => setDraft(prev =>
    prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl p-5 w-96 max-w-[95vw]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">Personalize Your Feed</h3>
            <p className="text-xs text-slate-500 mt-0.5">Select specialties to prioritize in your news feed</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {SPECIALTIES.map(s => {
            const active = draft.includes(s.id);
            return (
              <button
                key={s.id}
                onClick={() => toggle(s.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all cursor-pointer text-left ${
                  active
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
                }`}
              >
                <span>{s.emoji}</span>
                <span className="flex-1">{s.label}</span>
                {active && <Check className="w-3 h-3 text-blue-500 shrink-0" />}
              </button>
            );
          })}
        </div>

        <div className="flex gap-2">
          <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs" onClick={() => { onSave(draft); onClose(); }}>
            Save Preferences
          </Button>
          {draft.length > 0 && (
            <Button size="sm" variant="outline" className="text-xs" onClick={() => setDraft([])}>
              Clear All
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── Learn More Panel ──────────────────────────────────────────────────────────
function LearnMorePanel({ story }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState(null);

  const handleLearnMore = async (e) => {
    e.stopPropagation();
    if (open) { setOpen(false); return; }
    setOpen(true);
    if (questions) return;
    setLoading(true);
    const resp = await base44.integrations.Core.InvokeLLM({
      prompt: `A clinician is reading this medical news story: "${story.title}". Summary: "${story.summary}".

Generate 4 follow-up questions or related topics they might want to explore further to deepen their clinical understanding. Make them specific, practical, and clinically actionable.`,
      response_json_schema: {
        type: "object",
        properties: { questions: { type: "array", items: { type: "string" } } }
      }
    });
    setQuestions(resp?.questions || []);
    setLoading(false);
  };

  return (
    <div>
      <button onClick={handleLearnMore} className="flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-700 transition-colors">
        <Sparkles className="w-3 h-3" />
        Learn More
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="mt-2 pt-2 border-t border-slate-100">
              {loading ? (
                <div className="flex items-center gap-2 py-2">
                  <Loader2 className="w-3 h-3 animate-spin text-purple-500" />
                  <span className="text-xs text-slate-400">Generating follow-up questions…</span>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1.5">Related questions to explore:</p>
                  <ul className="space-y-1">
                    {questions?.map((q, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                        <span className="text-purple-400 font-bold shrink-0 mt-0.5">{i + 1}.</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function MedicalNewsSection({ compact = false }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [specialtyPrefs, setSpecialtyPrefs] = useState(getSpecialtyPrefs);
  const [hiddenTitles, setHiddenTitles] = useState(getHiddenTitles);
  const [showModal, setShowModal] = useState(false);
  const [showHidden, setShowHidden] = useState(false);

  const handleHide = (title) => {
    hideStory(title);
    setHiddenTitles(getHiddenTitles());
  };

  const handleSavePrefs = (prefs) => {
    setSpecialtyPrefs(prefs);
    saveSpecialtyPrefs(prefs);
    setRefreshKey(k => k + 1); // refresh feed with new context
  };

  const specialtyContext = specialtyPrefs.length > 0
    ? `The user is particularly interested in: ${specialtyPrefs.map(id => SPECIALTIES.find(s => s.id === id)?.label).filter(Boolean).join(", ")}. Prioritize stories in these specialties first.`
    : "";

  const { data: newsData, isLoading } = useQuery({
    queryKey: ["medicalNews", refreshKey, selectedCategory],
    queryFn: async () => {
      const categoryPrompts = {
        all: "Search for the top 8 most important medical news stories from the past 24-48 hours across all categories.",
        clinical: "Search for the latest clinical practice guidelines and treatment protocol updates from the past 24-48 hours.",
        research: "Search for significant recent medical research findings and breakthrough studies from the past 24-48 hours.",
        devices: "Search for the latest medical device innovations, approvals, and safety updates from the past 24-48 hours.",
        emergency: "Search for important emergency medicine updates, protocols, and critical care developments from the past 24-48 hours.",
        ai: "Search for the latest AI and technology developments in healthcare and clinical practice from the past 24-48 hours.",
        fda: "Search for recent FDA approvals, warnings, recalls, and regulatory updates from the past 24-48 hours.",
        public_health: "Search for important public health developments, disease outbreaks, and population health updates from the past 24-48 hours."
      };

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `${categoryPrompts[selectedCategory] || categoryPrompts.all}

${specialtyContext}

For each story, provide:
- title: clear, actionable title
- summary: concise professional summary (2-3 sentences)
- key_takeaway: 1-2 sentence AI-generated distillation of the single most important clinical insight
- category: the medical category/specialty of this story (e.g., "Cardiology", "Neurology", "Research", "FDA Updates")
- source: source name
- url: direct URL to the original article or source page

Focus on stories with direct clinical implications or that are practice-changing.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            stories: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  summary: { type: "string" },
                  key_takeaway: { type: "string" },
                  category: { type: "string" },
                  source: { type: "string" },
                  url: { type: "string" }
                }
              }
            }
          }
        }
      });
      return result.stories || [];
    },
    staleTime: 1000 * 60 * 30,
  });

  const visibleStories = useMemo(() => {
    if (!newsData) return [];
    return newsData.filter(s => !hiddenTitles.includes(s.title));
  }, [newsData, hiddenTitles]);

  const hiddenStoriesFromFeed = useMemo(() => {
    if (!newsData) return [];
    return newsData.filter(s => hiddenTitles.includes(s.title));
  }, [newsData, hiddenTitles]);

  const getCategoryColor = (category) => {
    const colors = {
      "Clinical Guidelines": "bg-blue-50 text-blue-700 border-blue-200",
      "Research": "bg-purple-50 text-purple-700 border-purple-200",
      "FDA Updates": "bg-red-50 text-red-700 border-red-200",
      "Medical Devices": "bg-cyan-50 text-cyan-700 border-cyan-200",
      "Emergency Medicine": "bg-orange-50 text-orange-700 border-orange-200",
      "AI & Technology": "bg-indigo-50 text-indigo-700 border-indigo-200",
      "Public Health": "bg-green-50 text-green-700 border-green-200",
      "Treatment Advances": "bg-amber-50 text-amber-700 border-amber-200",
      "Cardiology": "bg-rose-50 text-rose-700 border-rose-200",
      "Neurology": "bg-violet-50 text-violet-700 border-violet-200",
      "Oncology": "bg-pink-50 text-pink-700 border-pink-200",
      "Infectious Disease": "bg-teal-50 text-teal-700 border-teal-200",
    };
    return colors[category] || "bg-slate-50 text-slate-700 border-slate-200";
  };

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {specialtyPrefs.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-blue-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
              Personalized
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors border border-slate-200 rounded-md px-2 py-1"
          >
            <Settings className="w-3 h-3" />
            {specialtyPrefs.length > 0 ? `${specialtyPrefs.length} interests` : "Personalize"}
          </button>
          <Button variant="ghost" size="sm" onClick={() => setRefreshKey(prev => prev + 1)} disabled={isLoading} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Specialty pills (when prefs set) */}
      {specialtyPrefs.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {specialtyPrefs.map(id => {
            const s = SPECIALTIES.find(sp => sp.id === id);
            return s ? (
              <span key={id} className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5 font-medium">
                {s.emoji} {s.label}
                <button onClick={() => handleSavePrefs(specialtyPrefs.filter(p => p !== id))} className="ml-0.5 hover:text-blue-900 cursor-pointer">×</button>
              </span>
            ) : null;
          })}
        </div>
      )}

      {/* Category Tabs */}
      <div className="mb-4 overflow-x-auto">
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="inline-flex h-auto p-1 bg-slate-100 rounded-lg">
            {newsCategories.map((cat) => (
              <TabsTrigger key={cat.id} value={cat.id}
                className="px-3 py-1.5 text-xs font-medium rounded-md data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Stories */}
      <div>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(compact ? 3 : 4)].map((_, i) => (
              <Card key={i} className="p-3">
                <Skeleton className="h-3 w-20 mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-8 w-full" />
              </Card>
            ))}
          </div>
        ) : visibleStories.length > 0 ? (
          <div className="space-y-2">
            {visibleStories.slice(0, compact ? 4 : 8).map((story, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }}>
                <Card className="p-3 hover:shadow-md transition-all group">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge variant="outline" className={`text-xs ${getCategoryColor(story.category)}`}>
                      {story.category}
                    </Badge>
                    <div className="flex items-center gap-2 shrink-0">
                      {story.url && (
                        <button onClick={() => window.open(story.url, "_blank", "noopener,noreferrer")}
                          className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 transition-colors font-medium">
                          <ExternalLink className="w-3 h-3" />
                          Source
                        </button>
                      )}
                      <button
                        onClick={() => handleHide(story.title)}
                        title="Hide this story"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-slate-500 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {story.url ? (
                    <a href={story.url} target="_blank" rel="noopener noreferrer"
                      className="block font-semibold text-slate-900 mb-1 leading-snug text-sm hover:text-blue-600 transition-colors cursor-pointer">
                      {story.title}
                    </a>
                  ) : (
                    <h3 className="font-semibold text-slate-900 mb-1 leading-snug text-sm">{story.title}</h3>
                  )}

                  <p className="text-xs text-slate-600 leading-relaxed mb-2 line-clamp-2">{story.summary}</p>

                  {story.key_takeaway && (
                    <div className="flex items-start gap-1.5 bg-purple-50 border border-purple-100 rounded-md px-2.5 py-1.5 mb-2">
                      <Sparkles className="w-3 h-3 text-purple-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-purple-700 leading-relaxed font-medium">{story.key_takeaway}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 mt-1">
                    {story.source && <span className="text-xs text-slate-400">{story.source}</span>}
                    <LearnMorePanel story={story} />
                  </div>
                </Card>
              </motion.div>
            ))}

            {/* Hidden stories toggle */}
            {hiddenStoriesFromFeed.length > 0 && (
              <button onClick={() => setShowHidden(s => !s)}
                className="w-full text-xs text-slate-400 hover:text-slate-600 transition-colors py-1 flex items-center justify-center gap-1">
                <X className="w-3 h-3" />
                {hiddenStoriesFromFeed.length} hidden {showHidden ? "— click to collapse" : "— click to show"}
              </button>
            )}
            <AnimatePresence>
              {showHidden && hiddenStoriesFromFeed.map((story, idx) => (
                <motion.div key={idx} initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }}>
                  <Card className="p-2.5 border-dashed">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-slate-400 line-through flex-1 truncate">{story.title}</p>
                      <button onClick={() => {
                        const next = getHiddenTitles().filter(t => t !== story.title);
                        localStorage.setItem(HIDDEN_KEY, JSON.stringify(next));
                        setHiddenTitles(next);
                      }} className="text-xs text-blue-400 hover:text-blue-600 shrink-0 cursor-pointer">Restore</button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-6 text-slate-400">
            <Newspaper className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs">No news available</p>
            {hiddenStoriesFromFeed.length > 0 && (
              <button onClick={() => {
                localStorage.setItem(HIDDEN_KEY, JSON.stringify([]));
                setHiddenTitles([]);
              }} className="text-xs text-blue-500 mt-1 hover:underline cursor-pointer">Clear hidden stories</button>
            )}
          </div>
        )}
      </div>

      {/* Specialty modal */}
      <AnimatePresence>
        {showModal && (
          <SpecialtyModal selected={specialtyPrefs} onSave={handleSavePrefs} onClose={() => setShowModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}