import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Loader2, RefreshCw, ExternalLink, Newspaper } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

const T = {
  navy: "#050f1e", panel: "#0e2340", edge: "#162d4f", border: "#1e3a5f",
  dim: "#4a7299", text: "#c8ddf0", bright: "#e8f4ff", teal: "#00d4bc", teal2: "#00a896",
};

export default function NewsSummaryWidget() {
  const [summary, setSummary] = useState(null);
  const [headlines, setHeadlines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const generateSummary = async () => {
    setLoading(true);
    try {
      // Pull latest cached articles
      const articles = await base44.entities.MedicalNewsCache.list('-publishedAt', 15);
      if (!articles || articles.length === 0) {
        setSummary("No recent medical news found. Visit the Medical News page to load articles first.");
        setGenerated(true);
        setLoading(false);
        return;
      }

      setHeadlines(articles.slice(0, 5));

      const articleList = articles
        .slice(0, 12)
        .map((a, i) => `${i + 1}. [${a.sourceName}] ${a.title}${a.originalDescription ? ` — ${a.originalDescription.slice(0, 120)}` : ""}`)
        .join("\n");

      const resp = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a clinical news editor briefing a physician. Based on these recent medical news headlines and descriptions, write a concise 3–4 sentence clinical briefing that highlights the most important findings, trends, or public health updates relevant to practicing clinicians. Be direct and clinically focused.\n\nArticles:\n${articleList}`,
        response_json_schema: {
          type: "object",
          properties: { briefing: { type: "string" } }
        }
      });

      setSummary(resp?.briefing || "Unable to generate summary.");
      setGenerated(true);
    } catch {
      setSummary("Unable to generate AI summary. Please try again.");
      setGenerated(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    generateSummary();
  }, []);

  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: "14px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Sparkles style={{ width: 14, height: 14, color: T.teal }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: T.bright }}>AI News Briefing</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={generateSummary}
            disabled={loading}
            style={{ background: "transparent", border: "none", cursor: loading ? "not-allowed" : "pointer", color: T.dim, display: "flex", alignItems: "center" }}
            title="Regenerate"
          >
            <RefreshCw style={{ width: 12, height: 12, animation: loading ? "spin 1s linear infinite" : "none" }} />
          </button>
          <Link
            to={createPageUrl("MedicalNews")}
            style={{ fontSize: 10, color: T.teal, textDecoration: "none", display: "flex", alignItems: "center", gap: 3, padding: "3px 8px", border: `1px solid rgba(0,212,188,0.3)`, borderRadius: 5, fontWeight: 600 }}
          >
            <ExternalLink style={{ width: 10, height: 10 }} />
            Full Feed
          </Link>
        </div>
      </div>

      {/* AI Summary */}
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${T.border}` }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: T.dim, fontSize: 12 }}>
            <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />
            Analyzing latest medical news…
          </div>
        ) : summary ? (
          <p style={{ fontSize: 12, color: T.text, lineHeight: 1.65, margin: 0 }}>{summary}</p>
        ) : null}
      </div>

      {/* Top Headlines */}
      {headlines.length > 0 && (
        <div style={{ flex: 1, overflowY: "auto" }}>
          <div style={{ fontSize: 9, color: T.dim, textTransform: "uppercase", letterSpacing: "0.1em", padding: "8px 16px 4px" }}>Top Headlines</div>
          {headlines.map((article, idx) => (
            <a
              key={article.id || idx}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "flex", gap: 10, padding: "8px 16px", borderBottom: `1px solid ${T.border}`, textDecoration: "none", transition: "background 0.15s", cursor: "pointer" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(22,45,79,0.6)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
            >
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.teal, marginTop: 5, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: T.bright, fontWeight: 500, lineHeight: 1.4, marginBottom: 2, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                  {article.title}
                </div>
                <div style={{ fontSize: 10, color: T.dim }}>{article.sourceName}</div>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ padding: "8px 16px", display: "flex", alignItems: "center", gap: 6 }}>
        <Newspaper style={{ width: 10, height: 10, color: T.dim }} />
        <span style={{ fontSize: 10, color: T.dim }}>Powered by MedicalNews cache · Base44</span>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}