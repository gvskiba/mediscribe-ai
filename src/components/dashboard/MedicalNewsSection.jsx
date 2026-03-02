import React, { useState, useEffect, useMemo, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Newspaper, ExternalLink, RefreshCw, Sparkles, ChevronDown, ChevronUp,
  Loader2, X, Settings, Check, Bookmark, BookmarkCheck, Clock, Share2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

// ── Storage helpers ────────────────────────────────────────────────────────────
const PREFS_KEY = "news_specialty_prefs_v1";
const HIDDEN_KEY = "news_hidden_v1";

function getSpecialtyPrefs() {
  try { return JSON.parse(localStorage.getItem(PREFS_KEY) || "[]"); } catch { return []; }
}
function saveSpecialtyPrefs(p) { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); }
function getHiddenUrls() {
  try { return JSON.parse(localStorage.getItem(HIDDEN_KEY) || "[]"); } catch { return []; }
}
function addHiddenUrl(url) {
  const h = getHiddenUrls();
  if (!h.includes(url)) localStorage.setItem(HIDDEN_KEY, JSON.stringify([...h, url].slice(0, 300)));
}

// ── Specialties for personalization ──────────────────────────────────────────
const SPECIALTIES = [
  { id: "cardiology",    label: "Cardiology",          emoji: "🫀" },
  { id: "neurology",     label: "Neurology",           emoji: "🧠" },
  { id: "infectious",    label: "Infectious Disease",  emoji: "🦠" },
  { id: "oncology",      label: "Oncology",            emoji: "🎗️" },
  { id: "emergency",     label: "Emergency Medicine",  emoji: "🚨" },
  { id: "pulmonology",   label: "Pulmonology",         emoji: "🫁" },
  { id: "gastro",        label: "Gastroenterology",    emoji: "🫃" },
  { id: "endocrinology", label: "Endocrinology",       emoji: "⚗️" },
  { id: "nephrology",    label: "Nephrology",          emoji: "🩺" },
  { id: "psychiatry",    label: "Psychiatry",          emoji: "🧩" },
  { id: "pediatrics",    label: "Pediatrics",          emoji: "👶" },
  { id: "surgery",       label: "Surgery",             emoji: "🔪" },
];

// ── Category filters ──────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "all",          label: "All",           icon: "📰" },
  { id: "Research",     label: "Research",      icon: "🔬" },
  { id: "Clinical Research", label: "Journals", icon: "📖" },
  { id: "Public Health",label: "Public Health", icon: "🛡️" },
  { id: "Global Health",label: "Global Health", icon: "🌍" },
  { id: "Health News",  label: "Health News",   icon: "🏥" },
  { id: "Medical News", label: "Medical News",  icon: "📡" },
];

// ── Badge colors ──────────────────────────────────────────────────────────────
const CATEGORY_COLORS = {
  "Global Health":     "bg-teal-50 text-teal-700 border-teal-200",
  "Public Health":     "bg-green-50 text-green-700 border-green-200",
  "Research":          "bg-violet-50 text-violet-700 border-violet-200",
  "Clinical Research": "bg-amber-50 text-amber-700 border-amber-200",
  "Health News":       "bg-cyan-50 text-cyan-700 border-cyan-200",
  "Medical News":      "bg-rose-50 text-rose-700 border-rose-200",
};

const SOURCE_COLORS = {
  "WHO":        "bg-teal-100 text-teal-800",
  "CDC":        "bg-green-100 text-green-800",
  "NIH":        "bg-violet-100 text-violet-800",
  "NEJM":       "bg-amber-100 text-amber-800",
  "Lancet":     "bg-red-100 text-red-800",
  "MedlinePlus":"bg-cyan-100 text-cyan-800",
};

// ── Relative time formatter ───────────────────────────────────────────────────
function relativeTime(dateStr) {
  if (!dateStr) return "";
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return "";
  }
}

// ── AI Summary (lazy) ─────────────────────────────────────────────────────────
function AISummaryPanel({ article }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(article.summary || null);

  const handleToggle = async (e) => {
    e.stopPropagation();
    if (open) { setOpen(false); return; }
    setOpen(true);
    if (summary) return;
    setLoading(true);
    try {
      const resp = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a medical editor summarizing news for licensed clinicians. Given this article title and description, write exactly 2 clear, informative sentences summarizing the key clinical finding or news item. Use clinical terminology. Be concise and accurate. Do not fabricate details not in the source.\n\nTitle: "${article.title}"\nDescription: "${article.originalDescription || ''}"`,
        response_json_schema: {
          type: "object",
          properties: { summary: { type: "string" } }
        }
      });
      setSummary(resp?.summary || article.originalDescription || "No summary available.");
      // Persist to cache
      if (article.id) {
        base44.entities.MedicalNewsCache.update(article.id, { summary: resp?.summary }).catch(() => {});
      }
    } catch {
      setSummary(article.originalDescription || "No summary available.");
    }
    setLoading(false);
  };

  return (
    <div>
      <button onClick={handleToggle} className="flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-700 transition-colors">
        <Sparkles className="w-3 h-3" />
        AI Summary
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="mt-2 pt-2 border-t border-slate-100">
              {loading ? (
                <div className="flex items-center gap-2 py-1">
                  <Loader2 className="w-3 h-3 animate-spin text-purple-500" />
                  <span className="text-xs text-slate-400">Generating clinical summary…</span>
                </div>
              ) : (
                <p className="text-xs text-slate-600 leading-relaxed">{summary}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Article Card ──────────────────────────────────────────────────────────────
function ArticleCard({ article, onHide }) {
  const [bookmarked, setBookmarked] = useState(article.isBookmarked || false);

  const toggleBookmark = async (e) => {
    e.stopPropagation();
    const next = !bookmarked;
    setBookmarked(next);
    if (article.id) {
      base44.entities.MedicalNewsCache.update(article.id, { isBookmarked: next }).catch(() => {});
    }
    toast(next ? "Bookmarked" : "Bookmark removed");
  };

  const handleShare = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(article.url).then(() => toast("Link copied"));
  };

  const timeAgo = relativeTime(article.publishedAt);

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="group">
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 hover:shadow-md transition-all hover:border-slate-300">
        {/* Top row: source badge + category badge + actions */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {article.sourceName && (
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${SOURCE_COLORS[article.sourceName] || "bg-slate-100 text-slate-600"}`}>
                {article.sourceName}
              </span>
            )}
            {article.category && (
              <Badge variant="outline" className={`text-xs border ${CATEGORY_COLORS[article.category] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
                {article.category}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button onClick={handleShare} title="Copy link" className="text-slate-300 hover:text-slate-500 cursor-pointer transition-colors">
              <Share2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={toggleBookmark} title={bookmarked ? "Remove bookmark" : "Bookmark"} className={`cursor-pointer transition-colors ${bookmarked ? "text-amber-500" : "text-slate-300 hover:text-amber-400"}`}>
              {bookmarked ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
            </button>
            <button onClick={(e) => { e.stopPropagation(); onHide(article.url); }} title="Hide this story" className="text-slate-300 hover:text-slate-500 cursor-pointer transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Title — always a real link */}
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Read full article: ${article.title}`}
          className="block font-semibold text-slate-900 text-sm leading-snug mb-1.5 hover:text-blue-600 transition-colors cursor-pointer"
          onClick={e => e.stopPropagation()}
        >
          {article.title}
        </a>

        {/* Description snippet */}
        {article.originalDescription && (
          <p className="text-xs text-slate-500 leading-relaxed mb-2 line-clamp-2">
            {article.originalDescription}
          </p>
        )}

        {/* Footer: timestamp + source link + AI summary */}
        <div className="flex items-center justify-between gap-2 mt-1.5 flex-wrap">
          <div className="flex items-center gap-3">
            {timeAgo && (
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Clock className="w-3 h-3" />
                {timeAgo}
              </span>
            )}
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 transition-colors font-medium"
            >
              <ExternalLink className="w-3 h-3" />
              Read full article
            </a>
          </div>
          <AISummaryPanel article={article} />
        </div>
      </div>
    </motion.div>
  );
}

// ── Specialty Modal ───────────────────────────────────────────────────────────
function SpecialtyModal({ selected, onSave, onClose }) {
  const [draft, setDraft] = useState(selected);
  const toggle = (id) => setDraft(p => p.includes(id) ? p.filter(s => s !== id) : [...p, id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl p-5 w-96 max-w-[95vw]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">Personalize News Feed</h3>
            <p className="text-xs text-slate-500 mt-0.5">Select specialties to prioritize</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {SPECIALTIES.map(s => {
            const active = draft.includes(s.id);
            return (
              <button key={s.id} onClick={() => toggle(s.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all cursor-pointer text-left ${active ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"}`}>
                <span>{s.emoji}</span>
                <span className="flex-1">{s.label}</span>
                {active && <Check className="w-3 h-3 text-blue-500 shrink-0" />}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg px-4 py-2 transition-colors cursor-pointer"
            onClick={() => { onSave(draft); onClose(); }}>
            Save Preferences
          </button>
          {draft.length > 0 && (
            <button className="border border-slate-200 text-xs text-slate-600 rounded-lg px-3 py-2 hover:bg-slate-50 cursor-pointer"
              onClick={() => setDraft([])}>
              Clear
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Widget ───────────────────────────────────────────────────────────────
export default function MedicalNewsSection({ compact = false }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fromCache, setFromCache] = useState(false);
  const [fetchedAt, setFetchedAt] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [specialtyPrefs, setSpecialtyPrefs] = useState(getSpecialtyPrefs);
  const [hiddenUrls, setHiddenUrls] = useState(getHiddenUrls);
  const [showModal, setShowModal] = useState(false);
  const [countdown, setCountdown] = useState(30 * 60);
  const timerRef = useRef(null);

  const loadNews = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await base44.functions.invoke('fetchMedicalNews', { forceRefresh, limit: compact ? 10 : 20 });
      const data = resp.data;
      setArticles(data.articles || []);
      setFromCache(data.fromCache || false);
      setFetchedAt(data.fetchedAt);
      setCountdown(30 * 60);
    } catch (err) {
      // Fallback: try to read from cache directly
      try {
        const cached = await base44.entities.MedicalNewsCache.list('-publishedAt', compact ? 10 : 20);
        setArticles(cached);
        setFromCache(true);
        setError("Live fetch failed — showing cached articles.");
      } catch {
        setError("Unable to load medical news. Please refresh.");
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadNews();
    timerRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { loadNews(); return 30 * 60; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const handleHide = (url) => {
    addHiddenUrl(url);
    setHiddenUrls(getHiddenUrls());
  };

  const handleSavePrefs = (prefs) => {
    setSpecialtyPrefs(prefs);
    saveSpecialtyPrefs(prefs);
  };

  const countdownLabel = useMemo(() => {
    const m = Math.floor(countdown / 60);
    const s = countdown % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }, [countdown]);

  const filtered = useMemo(() => {
    return articles.filter(a => {
      if (hiddenUrls.includes(a.url)) return false;
      if (activeCategory !== "all" && a.category !== activeCategory) return false;
      return true;
    });
  }, [articles, hiddenUrls, activeCategory]);

  return (
    <div role="feed" aria-label="Medical News Feed">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {specialtyPrefs.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-blue-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block animate-pulse" />
              Personalized
            </span>
          )}
          {fromCache && fetchedAt && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {relativeTime(fetchedAt)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!loading && (
            <span className="text-xs text-slate-400 hidden sm:block">Refresh in {countdownLabel}</span>
          )}
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors border border-slate-200 rounded-md px-2 py-1 cursor-pointer"
          >
            <Settings className="w-3 h-3" />
            {specialtyPrefs.length > 0 ? `${specialtyPrefs.length} interests` : "Personalize"}
          </button>
          <button
            onClick={() => loadNews(true)}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded-md px-2 py-1 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Specialty pills */}
      {specialtyPrefs.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {specialtyPrefs.map(id => {
            const s = SPECIALTIES.find(sp => sp.id === id);
            return s ? (
              <span key={id} className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5 font-medium">
                {s.emoji} {s.label}
                <button onClick={() => handleSavePrefs(specialtyPrefs.filter(p => p !== id))} className="ml-0.5 hover:text-blue-900 cursor-pointer leading-none">×</button>
              </span>
            ) : null;
          })}
        </div>
      )}

      {/* Category filter tabs */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`shrink-0 flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
              activeCategory === cat.id
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700"
            }`}
          >
            <span>{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3 text-xs text-amber-700">
          <span>⚠</span>
          {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(compact ? 3 : 5)].map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-3.5">
              <div className="flex gap-2 mb-2">
                <Skeleton className="h-5 w-12 rounded" />
                <Skeleton className="h-5 w-20 rounded" />
              </div>
              <Skeleton className="h-4 w-full mb-1.5" />
              <Skeleton className="h-3 w-4/5 mb-2" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.slice(0, compact ? 5 : 20).map((article, idx) => (
              <ArticleCard key={article.id || article.url || idx} article={article} onHide={handleHide} />
            ))}
          </AnimatePresence>
          {filtered.length === 0 && articles.length > 0 && (
            <div className="text-center py-6 text-slate-400 text-xs">
              No articles in this category. <button onClick={() => setActiveCategory("all")} className="text-blue-500 hover:underline cursor-pointer">Show all</button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-slate-400">
          <Newspaper className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-xs">
            {articles.length === 0
              ? "No medical news available. Check your connection."
              : "No articles in this category."}
          </p>
          {articles.length > 0 && activeCategory !== "all" && (
            <button onClick={() => setActiveCategory("all")} className="text-xs text-blue-500 mt-1 hover:underline cursor-pointer">
              Show all categories
            </button>
          )}
        </div>
      )}

      {/* Specialty modal */}
      <AnimatePresence>
        {showModal && (
          <SpecialtyModal selected={specialtyPrefs} onSave={handleSavePrefs} onClose={() => setShowModal(false)} />
        )}
      </AnimatePresence>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}