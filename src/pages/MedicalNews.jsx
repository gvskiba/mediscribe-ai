import React, { useState, useEffect, useMemo, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { RefreshCw, Bookmark, BookmarkCheck, ExternalLink, Sparkles, ChevronDown, ChevronUp, Loader2, X, Star, Newspaper } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";

// ── Config ────────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "all", label: "All News", icon: "📰" },
  { id: "Global Health", label: "Global Health", icon: "🌍" },
  { id: "Public Health", label: "Public Health", icon: "🛡️" },
  { id: "Research", label: "Research", icon: "🔬" },
  { id: "Clinical Research", label: "Journals", icon: "📖" },
  { id: "Health News", label: "Health News", icon: "🏥" },
];

const SOURCES = ["WHO", "CDC", "NIH", "NEJM", "MedlinePlus", "Lancet"];

const SOURCE_COLORS = {
  WHO:         { border: "#14b8a6", text: "#14b8a6" },
  CDC:         { border: "#a855f7", text: "#a855f7" },
  NIH:         { border: "#3b82f6", text: "#3b82f6" },
  NEJM:        { border: "#22c55e", text: "#22c55e" },
  MedlinePlus: { border: "#f97316", text: "#f97316" },
  Lancet:      { border: "#ef4444", text: "#ef4444" },
};

const CATEGORY_COLORS = {
  "Global Health":     "bg-teal-900/40 text-teal-300 border-teal-700",
  "Public Health":     "bg-green-900/40 text-green-300 border-green-700",
  "Research":          "bg-violet-900/40 text-violet-300 border-violet-700",
  "Clinical Research": "bg-amber-900/40 text-amber-300 border-amber-700",
  "Health News":       "bg-cyan-900/40 text-cyan-300 border-cyan-700",
  "Medical News":      "bg-rose-900/40 text-rose-300 border-rose-700",
};

function relativeTime(dateStr) {
  if (!dateStr) return "";
  try { return formatDistanceToNow(new Date(dateStr), { addSuffix: true }); } catch { return ""; }
}

// ── AI Summary ────────────────────────────────────────────────────────────────
function AISummary({ article }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(article.summary || null);

  const toggle = async (e) => {
    e.stopPropagation();
    if (open) { setOpen(false); return; }
    setOpen(true);
    if (summary) return;
    setLoading(true);
    try {
      const resp = await base44.integrations.Core.InvokeLLM({
        prompt: `Summarize this medical article in 2 concise clinical sentences for a physician. Title: "${article.title}". Description: "${article.originalDescription || ''}"`,
        response_json_schema: { type: "object", properties: { summary: { type: "string" } } }
      });
      setSummary(resp?.summary || article.originalDescription || "No summary available.");
      if (article.id) base44.entities.MedicalNewsCache.update(article.id, { summary: resp?.summary }).catch(() => {});
    } catch {
      setSummary(article.originalDescription || "No summary available.");
    }
    setLoading(false);
  };

  return (
    <div>
      <button onClick={toggle} className="flex items-center gap-1 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors">
        <Sparkles className="w-3 h-3" />
        AI Summary
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="mt-2 pt-2 border-t border-white/10">
              {loading
                ? <div className="flex items-center gap-2 py-1"><Loader2 className="w-3 h-3 animate-spin text-purple-400" /><span className="text-xs text-slate-400">Generating…</span></div>
                : <p className="text-xs text-slate-300 leading-relaxed">{summary}</p>
              }
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Article Card ──────────────────────────────────────────────────────────────
function ArticleCard({ article, saved, onSave }) {
  const timeAgo = relativeTime(article.publishedAt);
  const sourceColor = SOURCE_COLORS[article.sourceName] || { border: "#64748b", text: "#94a3b8" };
  const catClass = CATEGORY_COLORS[article.category] || "bg-slate-700/40 text-slate-300 border-slate-600";

  return (
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
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onSave(article); }}
            className={`shrink-0 transition-colors cursor-pointer ${saved ? "text-amber-400" : "text-slate-600 hover:text-amber-400 opacity-0 group-hover:opacity-100"}`}
          >
            {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          </button>
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
          <AISummary article={article} />
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MedicalNews() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchedAt, setFetchedAt] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeSources, setActiveSources] = useState([]); // empty = all
  const [savedUrls, setSavedUrls] = useState(() => {
    try { return JSON.parse(localStorage.getItem("news_saved_v1") || "[]"); } catch { return []; }
  });
  const [showSaved, setShowSaved] = useState(false);
  const [clock, setClock] = useState("");
  const timerRef = useRef(null);

  // Live clock
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const loadNews = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await base44.functions.invoke('fetchMedicalNews', { forceRefresh, limit: 30 });
      const data = resp.data;
      setArticles(data.articles || []);
      setFetchedAt(data.fetchedAt);
    } catch {
      try {
        const cached = await base44.entities.MedicalNewsCache.list('-publishedAt', 30);
        setArticles(cached);
        setError("Unable to load news feeds. Check network connection.");
      } catch {
        setError("Unable to load news feeds. Check network connection.");
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
    const isAlreadySaved = savedUrls.includes(article.url);
    const next = isAlreadySaved ? savedUrls.filter(u => u !== article.url) : [...savedUrls, article.url];
    setSavedUrls(next);
    localStorage.setItem("news_saved_v1", JSON.stringify(next));
    toast(isAlreadySaved ? "Removed from saved" : "Saved!");
  };

  const toggleSource = (src) => {
    setActiveSources(prev => prev.includes(src) ? prev.filter(s => s !== src) : [...prev, src]);
  };

  const filtered = useMemo(() => {
    let list = articles;
    if (activeCategory !== "all") list = list.filter(a => a.category === activeCategory);
    if (activeSources.length > 0) list = list.filter(a => activeSources.includes(a.sourceName));
    if (showSaved) list = list.filter(a => savedUrls.includes(a.url));
    return list;
  }, [articles, activeCategory, activeSources, savedUrls, showSaved]);

  const updatedLabel = fetchedAt ? relativeTime(fetchedAt) : "just now";
  const activeSourceNames = SOURCES.filter(s => articles.some(a => a.sourceName === s));

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
            <p className="text-xs text-slate-400 mt-0.5">
              Updated {updatedLabel} · {activeSourceNames.join(" · ")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 border border-emerald-500/50 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE
          </span>
          <span className="text-sm font-mono text-slate-300 bg-slate-800 px-3 py-1 rounded-lg">{clock}</span>
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

      {/* ── Source Filters ── */}
      <div className="border-b border-white/8 bg-[#071224]/40 px-6 py-2.5 flex items-center gap-3 shrink-0 overflow-x-auto scrollbar-hide">
        <span className="text-xs font-semibold text-slate-500 tracking-widest shrink-0">SOURCES:</span>
        {SOURCES.map(src => {
          const color = SOURCE_COLORS[src] || { border: "#64748b", text: "#94a3b8" };
          const active = activeSources.includes(src);
          return (
            <button key={src} onClick={() => toggleSource(src)}
              style={{
                borderColor: color.border,
                color: active ? "#fff" : color.text,
                background: active ? `${color.border}30` : "transparent",
              }}
              className="shrink-0 text-xs font-bold px-3 py-1 rounded border transition-all cursor-pointer">
              {src}
            </button>
          );
        })}
      </div>

      {/* ── Error Bar ── */}
      {error && (
        <div className="border-b border-amber-700/40 bg-amber-900/20 px-6 py-2 flex items-center justify-between">
          <span className="text-xs text-amber-400 flex items-center gap-2"><span>⚠</span>{error}</span>
          <span className="text-xs text-slate-500">{clock}</span>
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
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-6xl mb-4 opacity-40">📰</div>
            <h3 className="text-lg font-semibold text-white mb-2">No articles found</h3>
            <p className="text-sm text-slate-400 mb-6 max-w-xs">
              No news matched the current filters. Try selecting different categories or sources.
            </p>
            <button
              onClick={() => { setActiveCategory("all"); setActiveSources([]); setShowSaved(false); }}
              className="flex items-center gap-2 bg-emerald-700/30 hover:bg-emerald-700/50 border border-emerald-600/50 text-emerald-300 text-sm font-medium px-5 py-2.5 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="border-t border-white/10 bg-[#071224] px-6 py-2 flex items-center justify-between shrink-0">
        <span className="text-xs text-slate-500 flex items-center gap-1.5">
          <Newspaper className="w-3.5 h-3.5" />
          Medical News Widget · Base44
        </span>
        <button
          onClick={() => setShowSaved(s => !s)}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
            showSaved
              ? "border-amber-500/50 bg-amber-900/30 text-amber-300"
              : "border-white/10 bg-white/5 text-slate-400 hover:text-slate-200"
          }`}
        >
          <Star className="w-3.5 h-3.5" />
          Saved ({savedUrls.length})
        </button>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}