import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import {
  RefreshCw, Bookmark, BookmarkCheck, ExternalLink, Sparkles,
  ChevronDown, ChevronUp, Loader2, X, Star, Newspaper, Settings2,
  Filter, Calendar, Zap, Check, Share2
} from "lucide-react";
import { formatDistanceToNow, subDays, isAfter } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import ArticleShareModal from "../components/news/ArticleShareModal";

// ── Config ────────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "all", label: "All News", icon: "📰" },
  { id: "Global Health", label: "Global Health", icon: "🌍" },
  { id: "Public Health", label: "Public Health", icon: "🛡️" },
  { id: "Research", label: "Research", icon: "🔬" },
  { id: "Clinical Research", label: "Journals", icon: "📖" },
  { id: "Health News", label: "Health News", icon: "🏥" },
  { id: "Associations", label: "Associations & Colleges", icon: "🏛️" },
];

const ALL_SOURCES = ["WHO", "CDC", "NIH", "NEJM", "MedlinePlus", "Lancet", "ACEP", "AAP", "AAFP", "ACA", "ACC"];

const SOURCE_COLORS = {
  WHO:         { border: "#14b8a6", text: "#14b8a6" },
  CDC:         { border: "#a855f7", text: "#a855f7" },
  NIH:         { border: "#3b82f6", text: "#3b82f6" },
  NEJM:        { border: "#22c55e", text: "#22c55e" },
  MedlinePlus: { border: "#f97316", text: "#f97316" },
  Lancet:      { border: "#ef4444", text: "#ef4444" },
  ACEP:        { border: "#f59e0b", text: "#f59e0b" },
  AAP:         { border: "#8b5cf6", text: "#8b5cf6" },
  AAFP:        { border: "#06b6d4", text: "#06b6d4" },
  ACA:         { border: "#84cc16", text: "#84cc16" },
  ACC:         { border: "#ec4899", text: "#ec4899" },
};

const CATEGORY_COLORS = {
  "Global Health":     "bg-teal-900/40 text-teal-300 border-teal-700",
  "Public Health":     "bg-green-900/40 text-green-300 border-green-700",
  "Research":          "bg-violet-900/40 text-violet-300 border-violet-700",
  "Clinical Research": "bg-amber-900/40 text-amber-300 border-amber-700",
  "Health News":       "bg-cyan-900/40 text-cyan-300 border-cyan-700",
  "Medical News":      "bg-rose-900/40 text-rose-300 border-rose-700",
  "Associations":      "bg-yellow-900/40 text-yellow-300 border-yellow-700",
};

const DATE_RANGES = [
  { id: "all", label: "Any Time" },
  { id: "1d", label: "Last 24h", days: 1 },
  { id: "7d", label: "Last 7 Days", days: 7 },
  { id: "30d", label: "Last 30 Days", days: 30 },
];

// Simple heuristic: longer title + has description = higher impact
function getImpactLevel(article) {
  if (article.impact) return article.impact;
  if (article.summary && article.originalDescription) return "high";
  if (article.originalDescription) return "medium";
  return "low";
}

const IMPACT_LEVELS = [
  { id: "all", label: "All Impact" },
  { id: "high", label: "High", color: "text-red-400" },
  { id: "medium", label: "Medium", color: "text-amber-400" },
  { id: "low", label: "Low", color: "text-slate-400" },
];

const PREFS_KEY = "news_prefs_v2";
const SAVED_KEY = "news_saved_v2";

function getPrefs() {
  try { return JSON.parse(localStorage.getItem(PREFS_KEY) || "{}"); } catch { return {}; }
}
function savePrefs(p) { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); }
function getSaved() {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY) || "[]"); } catch { return []; }
}

function relativeTime(dateStr) {
  if (!dateStr) return "";
  try { return formatDistanceToNow(new Date(dateStr), { addSuffix: true }); } catch { return ""; }
}

// ── AI Summary Modal ───────────────────────────────────────────────────────────
function AISummaryModal({ article, isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(article?.summary || null);
  const [error, setError] = useState(null);

  const fetchSummary = useCallback(async () => {
    if (summary || !article) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await base44.integrations.Core.InvokeLLM({
        prompt: `Provide a comprehensive but concise summary of this medical article for a physician. Include key findings, clinical relevance, and implications. Title: "${article.title}". Description: "${article.originalDescription || ''}"`,
        response_json_schema: { 
          type: "object", 
          properties: { 
            summary: { type: "string" },
            keyPoints: { type: "array", items: { type: "string" } },
            clinicalRelevance: { type: "string" }
          } 
        }
      });
      setSummary(resp?.summary || article.originalDescription || "No summary available.");
      if (article.id) base44.entities.MedicalNewsCache.update(article.id, { summary: resp?.summary }).catch(() => {});
    } catch (err) {
      setError("Failed to generate summary. Please try again.");
      setSummary(article.originalDescription || "No summary available.");
    }
    setLoading(false);
  }, [article, summary]);

  useEffect(() => {
    if (isOpen && !summary && article) {
      fetchSummary();
    }
  }, [isOpen, summary, article, fetchSummary]);

  if (!isOpen || !article) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#0e1f38] border border-white/15 rounded-2xl shadow-2xl p-6 w-[520px] max-w-[95vw] max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="bg-purple-500/20 p-2 rounded-lg shrink-0">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white text-lg leading-snug">AI-Powered Summary</h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{article.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 cursor-pointer shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="border-t border-white/10 pt-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-purple-400 mb-3" />
              <p className="text-sm text-slate-400">Generating AI summary...</p>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-sm text-red-400">{error}</p>
              <button 
                onClick={fetchSummary}
                className="mt-3 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 px-3 py-1.5 rounded transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-2">Summary</h4>
                <p className="text-sm text-slate-300 leading-relaxed bg-white/5 p-3 rounded-lg border border-white/10">{summary}</p>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <p className="text-xs text-slate-500">This summary was generated by AI to save you reading time.</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-6 pt-4 border-t border-white/10">
          <a 
            href={article.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            Read Full Article
          </a>
          <button 
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-white/10 text-slate-400 text-sm hover:bg-white/5 cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── AI Summary Button ───────────────────────────────────────────────────────────
function AISummaryButton({ article, onOpen }) {
  return (
    <button 
      onClick={(e) => { e.stopPropagation(); onOpen(); }}
      className="flex items-center gap-1.5 text-xs font-semibold text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 px-2.5 py-1 rounded transition-all"
      title="View AI-generated summary"
    >
      <Sparkles className="w-3.5 h-3.5" />
      AI Summary
    </button>
  );
}

// ── No Articles AI Fallback ───────────────────────────────────────────────────
function NoArticlesAIFallback({ showSaved, onResetFilters, onArticlesGenerated }) {
  const [generating, setGenerating] = useState(false);

  const generateAINews = async () => {
    setGenerating(true);
    try {
      const resp = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate 5 relevant medical news headlines and brief summaries as if they were from reputable medical news sources (WHO, CDC, NEJM, etc). Each should be clinically relevant and current. Format as JSON array with objects containing: title, originalDescription, sourceName, category, and publishedAt (ISO date).`,
        response_json_schema: {
          type: "object",
          properties: {
            news: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  originalDescription: { type: "string" },
                  sourceName: { type: "string" },
                  category: { type: "string" },
                  publishedAt: { type: "string" }
                }
              }
            }
          }
        }
      });
      
      if (resp?.news && Array.isArray(resp.news)) {
        const newsWithUrl = resp.news.map(item => ({
          ...item,
          url: `#ai-generated-${Date.now()}`,
          isAIGenerated: true
        }));
        onArticlesGenerated(newsWithUrl);
      }
    } catch (error) {
      console.error('Failed to generate AI news:', error);
    }
    setGenerating(false);
  };

  if (showSaved) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-6xl mb-4 opacity-40">📰</div>
        <h3 className="text-lg font-semibold text-white mb-2">No saved articles</h3>
        <p className="text-sm text-slate-400 mb-6 max-w-xs">You haven't saved any articles yet.</p>
        <button
          onClick={onResetFilters}
          className="flex items-center gap-2 bg-emerald-700/30 hover:bg-emerald-700/50 border border-emerald-600/50 text-emerald-300 text-sm font-medium px-5 py-2.5 rounded-lg transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          Reset Filters
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="text-6xl mb-4 opacity-40">🤖</div>
      <h3 className="text-lg font-semibold text-white mb-2">No articles match your filters</h3>
      <p className="text-sm text-slate-400 mb-6 max-w-xs">Let AI generate relevant medical news for you.</p>
      <div className="flex flex-col gap-3">
        <button
          onClick={generateAINews}
          disabled={generating}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors cursor-pointer"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate AI News
            </>
          )}
        </button>
        <button
          onClick={onResetFilters}
          className="flex items-center gap-2 bg-emerald-700/30 hover:bg-emerald-700/50 border border-emerald-600/50 text-emerald-300 text-sm font-medium px-5 py-2.5 rounded-lg transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          Reset Filters
        </button>
      </div>
    </div>
  );
}

// ── Article Card ──────────────────────────────────────────────────────────────
function ArticleCard({ article, saved, onSave }) {
  const [showShare, setShowShare] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const timeAgo = relativeTime(article.publishedAt);
  const sourceColor = SOURCE_COLORS[article.sourceName] || { border: "#64748b", text: "#94a3b8" };
  const catClass = CATEGORY_COLORS[article.category] || "bg-slate-700/40 text-slate-300 border-slate-600";
  const impact = getImpactLevel(article);
  const impactStyle = { high: "text-red-400", medium: "text-amber-400", low: "text-slate-500" };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="group">
        <div className="bg-[#0d1f3c]/60 border border-white/8 rounded-xl p-4 hover:border-white/20 hover:bg-[#0d1f3c]/80 transition-all">
          {/* Top row */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {article.sourceName && (
                <span className="text-xs font-bold px-2 py-0.5 rounded border"
                  style={{ borderColor: sourceColor.border, color: sourceColor.text, background: `${sourceColor.border}15` }}>
                  {article.sourceName}
                </span>
              )}
              {article.category && (
                <span className={`text-xs px-2 py-0.5 rounded border ${catClass}`}>{article.category}</span>
              )}
              {impact !== "low" && (
                <span className={`text-xs font-semibold flex items-center gap-0.5 ${impactStyle[impact]}`}>
                  <Zap className="w-2.5 h-2.5" />
                  {impact.toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); setShowSummary(true); }}
                title="View AI summary"
                className="shrink-0 transition-colors cursor-pointer text-slate-600 hover:text-purple-400 opacity-0 group-hover:opacity-100"
              >
                <Sparkles className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setShowShare(true); }}
                title="Share article"
                className="shrink-0 transition-colors cursor-pointer text-slate-600 hover:text-blue-400 opacity-0 group-hover:opacity-100"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onSave(article); }}
                title={saved ? "Remove from saved" : "Save for later"}
                className={`shrink-0 transition-colors cursor-pointer ${saved ? "text-amber-400" : "text-slate-600 hover:text-amber-400 opacity-0 group-hover:opacity-100"}`}
              >
                {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Title */}
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block font-semibold text-white text-sm leading-snug mb-1.5 hover:text-blue-400 transition-colors"
            onClick={e => e.stopPropagation()}
          >
            {article.title}
          </a>

          {/* Description */}
          {article.originalDescription && (
            <p className="text-xs text-slate-400 leading-relaxed mb-2.5 line-clamp-2">{article.originalDescription}</p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-3">
              {timeAgo && <span className="text-xs text-slate-500">{timeAgo}</span>}
              <a href={article.url} target="_blank" rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium">
                <ExternalLink className="w-3 h-3" />
                Read article
              </a>
            </div>
            <AISummaryButton article={article} onOpen={() => setShowSummary(true)} />
          </div>
        </div>
      </motion.div>
      <AnimatePresence>
        {showSummary && <AISummaryModal article={article} isOpen={showSummary} onClose={() => setShowSummary(false)} />}
        {showShare && <ArticleShareModal article={article} onClose={() => setShowShare(false)} />}
      </AnimatePresence>
    </>
  );
}

// ── Preferences Panel ─────────────────────────────────────────────────────────
function PreferencesPanel({ prefs, onSave, onClose }) {
  const [draft, setDraft] = useState({
    sources: prefs.sources || ALL_SOURCES,
    topics: prefs.topics || CATEGORIES.filter(c => c.id !== "all").map(c => c.id),
  });

  const toggleSource = (s) =>
    setDraft(p => ({ ...p, sources: p.sources.includes(s) ? p.sources.filter(x => x !== s) : [...p.sources, s] }));
  const toggleTopic = (t) =>
    setDraft(p => ({ ...p, topics: p.topics.includes(t) ? p.topics.filter(x => x !== t) : [...p.topics, t] }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#0e1f38] border border-white/15 rounded-2xl shadow-2xl p-6 w-[420px] max-w-[95vw]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-white text-base">News Preferences</h3>
            <p className="text-xs text-slate-400 mt-0.5">Customize your news feed sources and topics</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 cursor-pointer"><X className="w-4 h-4" /></button>
        </div>

        {/* Sources */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2.5">News Sources</p>
          <div className="flex flex-wrap gap-2">
            {ALL_SOURCES.map(src => {
              const color = SOURCE_COLORS[src] || { border: "#64748b", text: "#94a3b8" };
              const active = draft.sources.includes(src);
              return (
                <button key={src} onClick={() => toggleSource(src)}
                  style={{ borderColor: color.border, color: active ? "#fff" : color.text, background: active ? `${color.border}30` : "transparent" }}
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer">
                  {active && <Check className="w-3 h-3" />}
                  {src}
                </button>
              );
            })}
          </div>
        </div>

        {/* Topics */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2.5">Topics</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.filter(c => c.id !== "all").map(cat => {
              const active = draft.topics.includes(cat.id);
              return (
                <button key={cat.id} onClick={() => toggleTopic(cat.id)}
                  className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                    active ? "border-emerald-500/60 bg-emerald-900/30 text-emerald-300" : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20"
                  }`}>
                  {active && <Check className="w-3 h-3" />}
                  {cat.icon} {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => { onSave(draft); onClose(); toast.success("Preferences saved"); }}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg px-4 py-2.5 transition-colors cursor-pointer"
          >
            Save Preferences
          </button>
          <button
            onClick={() => { const all = { sources: ALL_SOURCES, topics: CATEGORIES.filter(c => c.id !== "all").map(c => c.id) }; onSave(all); onClose(); }}
            className="px-4 py-2.5 rounded-lg border border-white/10 text-slate-400 text-sm hover:bg-white/5 cursor-pointer transition-colors"
          >
            Reset
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MedicalNews() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchedAt, setFetchedAt] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeSources, setActiveSources] = useState([]);
  const [dateRange, setDateRange] = useState("all");
  const [impactFilter, setImpactFilter] = useState("all");
  const [savedArticles, setSavedArticles] = useState(() => getSaved());
  const [showSaved, setShowSaved] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [prefs, setPrefs] = useState(() => getPrefs());
  const [clock, setClock] = useState("");
  const timerRef = useRef(null);

  const savedUrls = useMemo(() => savedArticles.map(a => a.url), [savedArticles]);

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const loadNews = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await base44.functions.invoke('fetchMedicalNews', { forceRefresh, limit: 40 });
      const data = resp.data;
      setArticles(data.articles || []);
      setFetchedAt(data.fetchedAt);
    } catch {
      try {
        const cached = await base44.entities.MedicalNewsCache.list('-publishedAt', 40);
        setArticles(cached);
        setError("Live feed unavailable — showing cached articles.");
      } catch {
        setError("Unable to load news. Check your connection.");
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadNews();
    timerRef.current = setInterval(() => loadNews(), 30 * 60 * 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const handleSave = (article) => {
    const alreadySaved = savedUrls.includes(article.url);
    const next = alreadySaved
      ? savedArticles.filter(a => a.url !== article.url)
      : [...savedArticles, { url: article.url, title: article.title, sourceName: article.sourceName, publishedAt: article.publishedAt, savedAt: new Date().toISOString() }];
    setSavedArticles(next);
    localStorage.setItem(SAVED_KEY, JSON.stringify(next));
    toast(alreadySaved ? "Removed from saved" : "Saved for later!");
  };

  const handleSavePrefs = (newPrefs) => {
    setPrefs(newPrefs);
    savePrefs(newPrefs);
  };

  const toggleSource = (src) =>
    setActiveSources(prev => prev.includes(src) ? prev.filter(s => s !== src) : [...prev, src]);

  const activeFilterCount = [
    activeCategory !== "all",
    activeSources.length > 0,
    dateRange !== "all",
    impactFilter !== "all",
  ].filter(Boolean).length;

  const filtered = useMemo(() => {
    let list = articles;

    // Pref-based source filter (show only preferred sources unless manually overridden)
    const prefSources = prefs.sources || ALL_SOURCES;
    list = list.filter(a => prefSources.includes(a.sourceName) || !a.sourceName);

    // Pref-based topic filter
    const prefTopics = prefs.topics || CATEGORIES.filter(c => c.id !== "all").map(c => c.id);
    if (prefTopics.length > 0 && prefTopics.length < CATEGORIES.length - 1) {
      list = list.filter(a => !a.category || prefTopics.includes(a.category));
    }

    if (activeCategory !== "all") list = list.filter(a => a.category === activeCategory);
    if (activeSources.length > 0) list = list.filter(a => activeSources.includes(a.sourceName));
    if (showSaved) list = list.filter(a => savedUrls.includes(a.url));

    if (dateRange !== "all") {
      const dr = DATE_RANGES.find(d => d.id === dateRange);
      if (dr?.days) {
        const cutoff = subDays(new Date(), dr.days);
        list = list.filter(a => a.publishedAt && isAfter(new Date(a.publishedAt), cutoff));
      }
    }

    if (impactFilter !== "all") {
      list = list.filter(a => getImpactLevel(a) === impactFilter);
    }

    return list;
  }, [articles, activeCategory, activeSources, savedUrls, showSaved, dateRange, impactFilter, prefs]);

  const updatedLabel = fetchedAt ? relativeTime(fetchedAt) : "just now";

  return (
    <div className="min-h-screen bg-[#050f1e] text-white flex flex-col">
      {/* ── Header Bar ── */}
      <div className="border-b border-white/10 bg-[#071224] px-6 py-3 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center shrink-0">
            <Newspaper className="w-5 h-5 text-slate-300" />
          </div>
          <div>
            <h1 className="font-bold text-white text-lg leading-none">Medical News</h1>
            <p className="text-xs text-slate-400 mt-0.5">Updated {updatedLabel} · {filtered.length} articles</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 border border-emerald-500/50 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE
          </span>
          <span className="text-sm font-mono text-slate-300 bg-slate-800 px-3 py-1 rounded-lg">{clock}</span>
          <button
            onClick={() => setShowPrefs(true)}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/10 transition-colors cursor-pointer"
            title="News Preferences"
          >
            <Settings2 className="w-4 h-4 text-slate-300" />
          </button>
          <button
            onClick={() => loadNews(true)}
            disabled={loading}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/10 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 text-slate-300 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── Category Tabs ── */}
      <div className="border-b border-white/8 bg-[#071224]/60 px-6 py-2.5 flex items-center gap-2 overflow-x-auto scrollbar-hide shrink-0">
        {CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
            className={`shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all cursor-pointer whitespace-nowrap ${
              activeCategory === cat.id
                ? "border-emerald-500/60 bg-emerald-900/30 text-emerald-300"
                : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-slate-200"
            }`}
          >
            <span>{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* ── Source Filters + Filter Toggle ── */}
      <div className="border-b border-white/8 bg-[#071224]/40 px-6 py-2.5 flex items-center gap-3 shrink-0 overflow-x-auto scrollbar-hide">
        <span className="text-xs font-semibold text-slate-500 tracking-widest shrink-0">SOURCES:</span>
        {ALL_SOURCES.map(src => {
          const color = SOURCE_COLORS[src] || { border: "#64748b", text: "#94a3b8" };
          const active = activeSources.includes(src);
          return (
            <button key={src} onClick={() => toggleSource(src)}
              style={{ borderColor: color.border, color: active ? "#fff" : color.text, background: active ? `${color.border}30` : "transparent" }}
              className="shrink-0 text-xs font-bold px-3 py-1 rounded border transition-all cursor-pointer">
              {src}
            </button>
          );
        })}
        <div className="ml-auto shrink-0 flex items-center gap-2">
          <button
            onClick={() => setShowFilters(s => !s)}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
              showFilters || activeFilterCount > 0
                ? "border-blue-500/50 bg-blue-900/20 text-blue-300"
                : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20"
            }`}
          >
            <Filter className="w-3 h-3" />
            Filters {activeFilterCount > 0 && <span className="bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">{activeFilterCount}</span>}
          </button>
        </div>
      </div>

      {/* ── Advanced Filters Panel ── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-b border-white/8 bg-[#071224]/60 shrink-0"
          >
            <div className="px-6 py-4 flex flex-wrap gap-6">
              {/* Date Range */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" /> Date Range
                </p>
                <div className="flex gap-1.5">
                  {DATE_RANGES.map(dr => (
                    <button key={dr.id} onClick={() => setDateRange(dr.id)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer font-medium ${
                        dateRange === dr.id
                          ? "border-blue-500/60 bg-blue-900/30 text-blue-300"
                          : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20"
                      }`}>
                      {dr.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Impact Level */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Zap className="w-3 h-3" /> Impact Level
                </p>
                <div className="flex gap-1.5">
                  {IMPACT_LEVELS.map(il => (
                    <button key={il.id} onClick={() => setImpactFilter(il.id)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer font-medium ${
                        impactFilter === il.id
                          ? "border-white/40 bg-white/10 text-white"
                          : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20"
                      }`}>
                      {il.id !== "all" && <span className={`${il.color} mr-1`}>●</span>}
                      {il.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset */}
              {activeFilterCount > 0 && (
                <div className="flex items-end">
                  <button
                    onClick={() => { setActiveCategory("all"); setActiveSources([]); setDateRange("all"); setImpactFilter("all"); setShowSaved(false); }}
                    className="text-xs text-red-400 hover:text-red-300 border border-red-500/30 px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                  >
                    <X className="w-3 h-3 inline mr-1" />
                    Clear All
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Error Bar ── */}
      {error && (
        <div className="border-b border-amber-700/40 bg-amber-900/20 px-6 py-2 flex items-center justify-between">
          <span className="text-xs text-amber-400 flex items-center gap-2"><span>⚠</span>{error}</span>
        </div>
      )}

      {/* ── Articles ── */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="max-w-4xl mx-auto space-y-3">
            <AnimatePresence>
              {filtered.map((article, idx) => (
                <ArticleCard
                  key={article.id || article.url || idx}
                  article={article}
                  saved={savedUrls.includes(article.url)}
                  onSave={handleSave}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <NoArticlesAIFallback 
            showSaved={showSaved}
            onResetFilters={() => { setActiveCategory("all"); setActiveSources([]); setDateRange("all"); setImpactFilter("all"); setShowSaved(false); }}
            onArticlesGenerated={(newArticles) => setArticles([...articles, ...newArticles])}
          />
        )}
      </div>

      {/* ── Footer ── */}
      <div className="border-t border-white/10 bg-[#071224] px-6 py-2 flex items-center justify-between shrink-0">
        <span className="text-xs text-slate-500 flex items-center gap-1.5">
          <Newspaper className="w-3.5 h-3.5" />
          {articles.length} total · {filtered.length} shown
        </span>
        <button
          onClick={() => setShowSaved(s => !s)}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
            showSaved
              ? "border-amber-500/50 bg-amber-900/30 text-amber-300"
              : "border-white/10 bg-white/5 text-slate-400 hover:text-slate-200"
          }`}
        >
          {showSaved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
          Saved ({savedArticles.length})
        </button>
      </div>

      {/* ── Preferences Modal ── */}
      <AnimatePresence>
        {showPrefs && (
          <PreferencesPanel prefs={prefs} onSave={handleSavePrefs} onClose={() => setShowPrefs(false)} />
        )}
      </AnimatePresence>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}