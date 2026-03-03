import React, { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { formatDistanceToNow } from "date-fns";
import { createPageUrl } from "@/utils";

// ── Topics ────────────────────────────────────────────────────────────────────
const TOPICS = [
  { id: "all",        label: "All Health",      q: "health medicine medical",                       cat: "health,science" },
  { id: "clinical",   label: "Clinical",         q: "clinical trial treatment therapy",              cat: "health,science" },
  { id: "drugs",      label: "FDA & Drugs",      q: "FDA drug approval medication",                  cat: "health,science" },
  { id: "cardio",     label: "Cardiology",       q: "cardiology heart cardiovascular",               cat: "health,science" },
  { id: "oncology",   label: "Oncology",         q: "cancer oncology tumor chemotherapy",            cat: "health,science" },
  { id: "infectious", label: "Infectious Dis.",  q: "infectious disease virus bacteria outbreak",    cat: "health,science" },
  { id: "neuro",      label: "Neurology",        q: "neurology brain stroke dementia alzheimer",     cat: "health,science" },
  { id: "pubhealth",  label: "Public Health",    q: "public health CDC WHO epidemic",               cat: "health,science" },
  { id: "research",   label: "Research",         q: "medical research study journal",               cat: "health,science" },
];

const CAT_COLORS = {
  health:  { bg: "rgba(0,212,188,.15)",  fg: "#00d4bc" },
  science: { bg: "rgba(155,109,255,.15)", fg: "#9b6dff" },
  general: { bg: "rgba(74,114,153,.15)", fg: "#4a7299" },
  tech:    { bg: "rgba(74,144,217,.15)", fg: "#4a90d9" },
};

function catStyle(cats) {
  const c = (cats || []).find(x => CAT_COLORS[x]);
  return CAT_COLORS[c || "general"];
}

function relTime(dateStr) {
  if (!dateStr) return "";
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch { return ""; }
}

const SOURCES = [
  { id: "thenewsapi", label: "TheNewsAPI", storageKey: "thenewsapi_token" },
  { id: "webzio",     label: "Webz.io",    storageKey: "webzio_token" },
  { id: "newsdata",   label: "NewsData.io", storageKey: "newsdata_token" },
];

const SAVED_KEY = "tna_saved_v1";
function getSaved() {
  try { return new Set(JSON.parse(localStorage.getItem(SAVED_KEY) || "[]")); } catch { return new Set(); }
}
function persistSaved(s) {
  localStorage.setItem(SAVED_KEY, JSON.stringify([...s]));
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, color, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4500);
    return () => clearTimeout(t);
  }, []);
  return (
    <div style={{
      position: "fixed", bottom: 20, right: 20, background: "#0e2340",
      border: "1px solid rgba(0,212,188,.3)", borderRadius: 10,
      padding: "10px 15px", display: "flex", alignItems: "center", gap: 8,
      fontSize: 12, color: "#e8f4ff", boxShadow: "0 8px 32px rgba(0,0,0,.4)",
      zIndex: 999, animation: "fadeUp .28s ease", maxWidth: 480
    }}>
      <span style={{ color: color || "var(--teal)", fontSize: 14 }}>✦</span>
      <span>{msg}</span>
      <button onClick={onClose} style={{ marginLeft: 5, cursor: "pointer", color: "#4a7299", fontSize: 13, background: "none", border: "none" }}>✕</button>
    </div>
  );
}

// ── Article Card ──────────────────────────────────────────────────────────────
function ArticleCard({ article, bookmarked, onToggleBookmark, onCopyLink, animDelay }) {
  const cats = article.categories || [];
  const cs = catStyle(cats);
  const catLabel = cats[0] ? cats[0].charAt(0).toUpperCase() + cats[0].slice(1) : "Health";
  const summary = (article.description || article.snippet || "").trim();
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <article style={{
      padding: "13px 16px", borderBottom: "1px solid rgba(30,58,95,.55)",
      transition: "background .15s", display: "flex", gap: 11, alignItems: "flex-start",
      animation: `fadeUp .3s ease both`, animationDelay: `${Math.min(animDelay * 35, 500)}ms`
    }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(22,45,79,.5)"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      {/* Thumbnail */}
      {article.image_url && !imgFailed ? (
        <img
          src={article.image_url} alt="" loading="lazy"
          onError={() => setImgFailed(true)}
          style={{ width: 68, height: 68, borderRadius: 8, objectFit: "cover", flexShrink: 0, border: "1px solid #1e3a5f", background: "#162d4f" }}
        />
      ) : (
        <div style={{ width: 68, height: 68, borderRadius: 8, flexShrink: 0, background: "#162d4f", border: "1px solid #1e3a5f", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, opacity: .4 }}>🩺</div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <a href={article.url} target="_blank" rel="noopener noreferrer"
          style={{ fontSize: 13, fontWeight: 600, color: "#e8f4ff", textDecoration: "none", lineHeight: 1.52, display: "block", wordBreak: "break-word", marginBottom: 5, transition: "color .15s" }}
          onMouseEnter={e => { e.target.style.color = "#00d4bc"; e.target.style.textDecoration = "underline"; }}
          onMouseLeave={e => { e.target.style.color = "#e8f4ff"; e.target.style.textDecoration = "none"; }}
        >
          {article.title}
        </a>

        {summary && (
          <div style={{ fontSize: 11.5, color: "#c8ddf0", lineHeight: 1.7, marginBottom: 6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {summary}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap", marginBottom: 5 }}>
          <span style={{ fontSize: 9, padding: "1.5px 6px", borderRadius: 3, fontWeight: 700, letterSpacing: ".04em", background: cs.bg, color: cs.fg }}>
            {article.source || "Unknown"}
          </span>
          <span style={{ fontSize: 9, padding: "1.5px 6px", borderRadius: 3, background: "rgba(74,114,153,.12)", color: "#4a7299", border: "1px solid rgba(30,58,95,.8)" }}>
            {catLabel}
          </span>
          {article.published_at && (
            <>
              <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#2a4d72", flexShrink: 0 }} />
              <span style={{ fontSize: 9.5, color: "#4a7299", fontFamily: "monospace" }}>{relTime(article.published_at)}</span>
            </>
          )}
        </div>

        <div className="art-acts" style={{ display: "flex", gap: 5 }}>
          <a href={article.url} target="_blank" rel="noopener noreferrer"
            style={{ padding: "3px 8px", borderRadius: 5, fontSize: 9.5, fontWeight: 600, cursor: "pointer", border: "1px solid #1e3a5f", background: "transparent", color: "#4a7299", textDecoration: "none", transition: "all .15s" }}
            onMouseEnter={e => Object.assign(e.target.style, { borderColor: "rgba(0,212,188,.3)", color: "#00d4bc", background: "rgba(0,212,188,.06)" })}
            onMouseLeave={e => Object.assign(e.target.style, { borderColor: "#1e3a5f", color: "#4a7299", background: "transparent" })}
          >🔗 Open</a>
          <button onClick={() => onToggleBookmark(article.uuid)}
            style={{ padding: "3px 8px", borderRadius: 5, fontSize: 9.5, fontWeight: 600, cursor: "pointer", border: bookmarked ? "1px solid rgba(251,191,36,.35)" : "1px solid #1e3a5f", background: bookmarked ? "rgba(251,191,36,.06)" : "transparent", color: bookmarked ? "#fbbf24" : "#4a7299", transition: "all .15s", fontFamily: "inherit" }}
          >{bookmarked ? "★ Saved" : "☆ Save"}</button>
          <button onClick={() => onCopyLink(article.url)}
            style={{ padding: "3px 8px", borderRadius: 5, fontSize: 9.5, fontWeight: 600, cursor: "pointer", border: "1px solid #1e3a5f", background: "transparent", color: "#4a7299", transition: "all .15s", fontFamily: "inherit" }}
            onMouseEnter={e => Object.assign(e.target.style, { borderColor: "#2a4d72", color: "#c8ddf0", background: "#162d4f" })}
            onMouseLeave={e => Object.assign(e.target.style, { borderColor: "#1e3a5f", color: "#4a7299", background: "transparent" })}
          >📋 Copy Link</button>
        </div>
      </div>
    </article>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MedicalNews() {
  const [articles, setArticles] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [topic, setTopic] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [activeSource, setActiveSource] = useState(() => {
    // Pick whichever source has a token; default to thenewsapi
    if (localStorage.getItem("webzio_token")) return "webzio";
    return "thenewsapi";
  });
  const [bookmarks, setBookmarks] = useState(() => getSaved());
  const [lastRef, setLastRef] = useState(null);
  const [countdown, setCountdown] = useState(30 * 60);
  const [toast, setToast] = useState(null);
  const timersRef = useRef({});

  const showToast = (msg, color) => setToast({ msg, color });

  const fetchNews = useCallback(async (pg = 1, topicId = topic, q = searchQuery, src = activeSource) => {
    setLoading(true);
    setError(null);

    const sourceInfo = SOURCES.find(s => s.id === src) || SOURCES[0];
    const localToken = localStorage.getItem(sourceInfo.storageKey);

    if (!localToken) {
      setError(`No API token for ${sourceInfo.label}. Please add it in App Settings.`);
      setArticles([]);
      setLoading(false);
      return;
    }

    try {
      const currentTopic = TOPICS.find(t => t.id === topicId) || TOPICS[0];
      const query = q.trim() || currentTopic.q;

      let resp;
      if (src === "webzio") {
        resp = await base44.functions.invoke("fetchWebzNews", {
          query,
          page: pg - 1,   // webz uses 0-based offset via "from"
          size: 10,
          token: localToken,
        });
      } else {
        resp = await base44.functions.invoke("fetchMedicalNews", {
          query,
          categories: currentTopic.cat,
          page: pg,
          limit: 10,
          token: localToken,
        });
      }

      setArticles(resp.data?.articles || []);
      setMeta(resp.data?.meta || {});
      setLastRef(new Date());
      setCountdown(30 * 60);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Failed to fetch news.");
      setArticles([]);
    }
    setLoading(false);
  }, [topic, searchQuery, activeSource]);

  // Initial load + auto-refresh
  useEffect(() => {
    fetchNews(1, topic, searchQuery, activeSource);
    timersRef.current.ar = setInterval(() => fetchNews(1, topic, searchQuery, activeSource), 30 * 60 * 1000);
    return () => clearInterval(timersRef.current.ar);
  }, [activeSource]);

  // Countdown ticker
  useEffect(() => {
    timersRef.current.cd = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timersRef.current.cd);
  }, []);

  const handleSourceChange = (src) => {
    setActiveSource(src);
    setPage(1);
    // fetchNews will be triggered by the activeSource useEffect
  };

  const handleTopicChange = (id) => {
    setTopic(id);
    setSearchQuery("");
    setSearchInput("");
    setPage(1);
    fetchNews(1, id, "", activeSource);
  };

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setPage(1);
    fetchNews(1, topic, searchInput, activeSource);
  };

  const handlePageChange = (pg) => {
    setPage(pg);
    fetchNews(pg, topic, searchQuery, activeSource);
  };

  const handleToggleBookmark = (uuid) => {
    setBookmarks(prev => {
      const next = new Set(prev);
      if (next.has(uuid)) { next.delete(uuid); showToast("Bookmark removed", "#4a7299"); }
      else { next.add(uuid); showToast("⭐ Article saved", "#fbbf24"); }
      persistSaved(next);
      return next;
    });
  };

  const handleCopyLink = (url) => {
    navigator.clipboard?.writeText(url)
      .then(() => showToast("📋 Link copied", "#00d4bc"))
      .catch(() => showToast("Could not copy", "#f5a623"));
  };

  const mm = String(Math.floor(countdown / 60)).padStart(2, "0");
  const ss = String(countdown % 60).padStart(2, "0");
  const total = meta.found || 0;
  const totalPages = Math.ceil(Math.min(total, 200) / 10);

  return (
    <div style={{ minHeight: "100vh", background: "#050f1e", color: "#c8ddf0", fontFamily: "'DM Sans', -apple-system, sans-serif", fontSize: 13, paddingTop: 0 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=Playfair+Display:wght@400;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 50%{opacity:.2;transform:scale(.6)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes scanH { 0%,100%{opacity:0;transform:scaleX(.06)} 50%{opacity:.38;transform:scaleX(1)} }
        .catbar::-webkit-scrollbar{height:0}
        .feed-scroll::-webkit-scrollbar{width:4px}
        .feed-scroll::-webkit-scrollbar-thumb{background:#1e3a5f;border-radius:4px}
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 0px)", animation: "fadeUp .4s ease both" }}>

        {/* ── Header ── */}
        <div style={{ padding: "12px 16px 10px", borderBottom: "1px solid #1e3a5f", display: "flex", alignItems: "center", gap: 10, background: "rgba(14,35,64,.88)", flexShrink: 0, position: "relative", overflow: "hidden" }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, fontSize: 15, background: "linear-gradient(135deg,rgba(0,212,188,.2),rgba(155,109,255,.15))", border: "1px solid rgba(0,212,188,.28)", display: "flex", alignItems: "center", justifyContent: "center" }}>📰</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15.5, color: "#e8f4ff" }}>Medical News Feed</div>
            <div style={{ fontSize: 9.5, color: "#4a7299", marginTop: 2 }}>Live health & medical stories · Auto-refresh every 30 min</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 20, background: "rgba(46,204,113,.08)", border: "1px solid rgba(46,204,113,.22)", fontSize: 9.5, color: "#2ecc71", fontWeight: 700 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#2ecc71", animation: "pulse 2s infinite", display: "inline-block" }} />
              LIVE
            </div>
            <div style={{ fontFamily: "monospace", fontSize: 9.5, color: "#4a7299", padding: "3px 7px", borderRadius: 5, border: "1px solid #1e3a5f", background: "#162d4f" }}>{mm}:{ss}</div>
            <button
              onClick={() => fetchNews(page, topic, searchQuery, activeSource)}
              disabled={loading}
              style={{ width: 28, height: 28, borderRadius: 7, background: "transparent", border: "1px solid #1e3a5f", color: "#4a7299", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, animation: loading ? "spin .65s linear infinite" : "none" }}
              title="Refresh now"
            >↻</button>
          </div>
        </div>

        {/* ── Source Switcher ── */}
        <div style={{ padding: "7px 14px", borderBottom: "1px solid #1e3a5f", display: "flex", gap: 5, alignItems: "center", flexShrink: 0 }}>
          {SOURCES.map(s => {
            const hasToken = !!localStorage.getItem(s.storageKey);
            return (
              <button key={s.id} onClick={() => handleSourceChange(s.id)}
                style={{
                  padding: "3px 12px", borderRadius: 20, fontSize: 10.5, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit", transition: "all .15s",
                  background: activeSource === s.id ? "rgba(0,212,188,.1)" : "transparent",
                  color: activeSource === s.id ? "#00d4bc" : hasToken ? "#c8ddf0" : "#4a7299",
                  border: activeSource === s.id ? "1px solid rgba(0,212,188,.3)" : "1px solid #1e3a5f",
                  opacity: hasToken ? 1 : 0.5,
                }}
                title={hasToken ? `Switch to ${s.label}` : `No token — add in App Settings`}
              >{s.label}{!hasToken && " (no key)"}</button>
            );
          })}
          <a
            href={createPageUrl("AppSettings")}
            style={{
              marginLeft: "auto", padding: "3px 10px", borderRadius: 20, fontSize: 10.5, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit", transition: "all .15s",
              background: "transparent", color: "#4a7299",
              border: "1px solid #1e3a5f", textDecoration: "none", display: "flex", alignItems: "center", gap: 4,
              flexShrink: 0
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#2a4d72"; e.currentTarget.style.color = "#c8ddf0"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e3a5f"; e.currentTarget.style.color = "#4a7299"; }}
            title="Manage API keys in App Settings"
          >🔑 Manage API Keys</a>
        </div>

        {/* ── Search ── */}
        <div style={{ padding: "9px 14px", borderBottom: "1px solid #1e3a5f", display: "flex", gap: 7, alignItems: "center", flexShrink: 0 }}>
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="Search medical news… e.g. CRISPR, sepsis, FDA approval, JAMA"
            style={{ flex: 1, background: "#162d4f", border: "1.5px solid #1e3a5f", borderRadius: 8, padding: "7px 12px", color: "#e8f4ff", fontSize: 12.5, fontFamily: "inherit", outline: "none" }}
            onFocus={e => e.target.style.borderColor = "#00d4bc"}
            onBlur={e => e.target.style.borderColor = "#1e3a5f"}
          />
          <button
            onClick={handleSearch}
            style={{ padding: "7px 14px", borderRadius: 8, background: "linear-gradient(135deg,#00d4bc,#00a896)", color: "#050f1e", fontWeight: 700, fontSize: 11.5, cursor: "pointer", border: "none", fontFamily: "inherit", whiteSpace: "nowrap" }}
          >🔍 Search</button>
        </div>

        {/* ── Category Bar ── */}
        <div className="catbar" style={{ display: "flex", gap: 4, padding: "8px 14px", borderBottom: "1px solid #1e3a5f", flexShrink: 0, overflowX: "auto" }}>
          {TOPICS.map(t => (
            <button key={t.id} onClick={() => handleTopicChange(t.id)}
              style={{
                padding: "4px 11px", borderRadius: 20, fontSize: 10.5, fontWeight: 600,
                cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit", transition: "all .15s",
                background: topic === t.id ? "rgba(0,212,188,.1)" : "transparent",
                color: topic === t.id ? "#00d4bc" : "#4a7299",
                border: topic === t.id ? "1px solid rgba(0,212,188,.3)" : "1px solid #1e3a5f",
              }}
            >{t.label}</button>
          ))}
        </div>

        {/* ── Status Row ── */}
        <div style={{ padding: "5px 16px", borderBottom: "1px solid #1e3a5f", display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 26, flexShrink: 0 }}>
          <div style={{ fontSize: 10, color: "#4a7299", display: "flex", alignItems: "center", gap: 6 }}>
            {loading ? (
              <span>⏳ Fetching from {SOURCES.find(s => s.id === activeSource)?.label}…</span>
            ) : (
              <>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 9, padding: "1px 7px", borderRadius: 3, background: "rgba(0,212,188,.08)", color: "#00d4bc", border: "1px solid rgba(0,212,188,.2)", fontWeight: 600 }}>📡 {SOURCES.find(s => s.id === activeSource)?.label}</span>
                <span style={{ color: "#c8ddf0", fontWeight: 600, fontSize: 10.5 }}>{articles.length}</span>
                articles {total ? `· Page ${page} · ${total.toLocaleString()} found` : ""}
              </>
            )}
          </div>
          {lastRef && <div style={{ fontFamily: "monospace", fontSize: 9, color: "#4a7299" }}>Updated {lastRef.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>}
        </div>

        {/* ── Error Banner ── */}
        {error && (
          <div style={{ margin: "8px 14px", padding: "9px 13px", borderRadius: 8, background: "rgba(245,166,35,.07)", border: "1px solid rgba(245,166,35,.25)", fontSize: 11.5, color: "#f5a623", display: "flex", gap: 8, alignItems: "flex-start", flexShrink: 0 }}>
            ⚠ {error}
          </div>
        )}

        {/* ── Feed ── */}
        <div className="feed-scroll" style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "52px 24px", gap: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", border: "2.5px solid #1e3a5f", borderTopColor: "#00d4bc", animation: "spin .7s linear infinite" }} />
              <div style={{ fontSize: 12, color: "#4a7299", textAlign: "center", lineHeight: 1.75 }}>
                <strong style={{ color: "#c8ddf0", display: "block", marginBottom: 4, fontSize: 13 }}>Fetching medical news…</strong>
                Querying TheNewsAPI for health & medical stories
              </div>
            </div>
          ) : !articles.length ? (
            <div style={{ padding: "42px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 36, opacity: .3, marginBottom: 12 }}>📰</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: "#e8f4ff", marginBottom: 6 }}>
                {error ? "API Connection Issue" : "No results found"}
              </div>
              <div style={{ fontSize: 12, color: "#4a7299", lineHeight: 1.7, maxWidth: 380, margin: "0 auto 14px" }}>
                {error ? "Could not fetch news from TheNewsAPI." : "No medical news matched your search. Try different keywords or select another category."}
              </div>
              <button onClick={() => { setTopic("all"); setSearchInput(""); setSearchQuery(""); fetchNews(1, "all", "", activeSource); }}
                style={{ padding: "7px 18px", borderRadius: 8, background: "rgba(0,212,188,.1)", color: "#00d4bc", border: "1px solid rgba(0,212,188,.25)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                ↺ Show All Health News
              </button>
            </div>
          ) : (
            articles.map((a, i) => (
              <ArticleCard
                key={a.uuid || a.url || i}
                article={a}
                bookmarked={bookmarks.has(a.uuid)}
                onToggleBookmark={handleToggleBookmark}
                onCopyLink={handleCopyLink}
                animDelay={i}
              />
            ))
          )}
        </div>

        {/* ── Pagination ── */}
        {!loading && totalPages > 1 && (
          <div style={{ padding: "9px 16px", borderTop: "1px solid #1e3a5f", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <div style={{ fontSize: 10, color: "#4a7299" }}>Page {page} of {totalPages} · {total.toLocaleString()} articles found</div>
            <div style={{ display: "flex", gap: 5 }}>
              <button disabled={page <= 1} onClick={() => handlePageChange(page - 1)}
                style={{ padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: page <= 1 ? "default" : "pointer", border: "1px solid #1e3a5f", background: "transparent", color: page <= 1 ? "rgba(74,114,153,.28)" : "#4a7299", fontFamily: "inherit" }}>← Prev</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pg = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                if (pg < 1 || pg > totalPages) return null;
                return (
                  <button key={pg} onClick={() => handlePageChange(pg)}
                    style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: pg === page ? "1px solid rgba(0,212,188,.3)" : "1px solid #1e3a5f", background: pg === page ? "rgba(0,212,188,.1)" : "transparent", color: pg === page ? "#00d4bc" : "#4a7299", fontFamily: "inherit" }}>
                    {pg}
                  </button>
                );
              })}
              <button disabled={page >= totalPages} onClick={() => handlePageChange(page + 1)}
                style={{ padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: page >= totalPages ? "default" : "pointer", border: "1px solid #1e3a5f", background: "transparent", color: page >= totalPages ? "rgba(74,114,153,.28)" : "#4a7299", fontFamily: "inherit" }}>Next →</button>
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div style={{ padding: "8px 16px", borderTop: "1px solid #1e3a5f", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, background: "rgba(11,29,53,.6)" }}>
          <div style={{ fontSize: 9.5, color: "#4a7299", display: "flex", alignItems: "center", gap: 6 }}>
            📡 {SOURCES.find(s => s.id === activeSource)?.label} · Base44
            {bookmarks.size > 0 && <span style={{ color: "#fbbf24" }}>· ★ {bookmarks.size} saved</span>}
          </div>
          <div style={{ display: "flex", gap: 5 }}>
            <button onClick={() => showToast(bookmarks.size ? `★ ${bookmarks.size} article${bookmarks.size !== 1 ? "s" : ""} saved this session` : "No saved articles yet — hover an article and click ☆ Save", "#fbbf24")}
              style={{ padding: "3px 9px", borderRadius: 5, background: "transparent", border: "1px solid #1e3a5f", color: "#4a7299", fontSize: 9.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              ★ Saved ({bookmarks.size})
            </button>
            <button onClick={() => fetchNews(page, topic, searchQuery, activeSource)}
              style={{ padding: "3px 9px", borderRadius: 5, background: "transparent", border: "1px solid #1e3a5f", color: "#4a7299", fontSize: 9.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              ↻ Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ── Toast ── */}
      {toast && <Toast msg={toast.msg} color={toast.color} onClose={() => setToast(null)} />}
    </div>
  );
}