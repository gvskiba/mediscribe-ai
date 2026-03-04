import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { TrendingUp, TrendingDown, RefreshCw, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const T = {
  navy: "#050f1e", panel: "#0e2340", edge: "#162d4f",
  border: "#1e3a5f", dim: "#4a7299", text: "#c8ddf0",
  bright: "#e8f4ff", teal: "#00d4bc", green: "#2ecc71",
  red: "#ff5c6c", amber: "#f5a623",
};

const WATCHLIST = [
  { ticker: "SPY", label: "S&P 500" },
  { ticker: "QQQ", label: "NASDAQ" },
  { ticker: "DIA", label: "DOW" },
  { ticker: "AAPL", label: "Apple" },
  { ticker: "MSFT", label: "Microsoft" },
  { ticker: "NVDA", label: "NVIDIA" },
];

function PriceRow({ stock }) {
  const isUp = stock.changePercent >= 0;
  const color = isUp ? T.green : T.red;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8, padding: "7px 12px",
      borderBottom: `1px solid ${T.border}`, transition: "background 0.15s"
    }}
      onMouseEnter={e => e.currentTarget.style.background = T.edge}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.bright }}>{stock.ticker}</div>
        <div style={{ fontSize: 9.5, color: T.dim }}>{stock.label || stock.ticker}</div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: T.text, fontFamily: "monospace" }}>
          ${stock.price > 0 ? stock.price.toFixed(2) : "—"}
        </div>
        <div style={{ fontSize: 10, color, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 3 }}>
          {isUp ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
          {stock.changePercent !== 0 ? `${isUp ? "+" : ""}${stock.changePercent.toFixed(2)}%` : "—"}
        </div>
      </div>
    </div>
  );
}

export default function StockMarketWidget() {
  const [stocks, setStocks] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("prices");
  const [collapsed, setCollapsed] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await base44.functions.invoke("fetchPolygonStockData", {});
      const rawStocks = resp.data?.stocks || [];

      // Merge with our watchlist labels
      const labeled = WATCHLIST.map(w => {
        const found = rawStocks.find(s => s.ticker === w.ticker);
        return found ? { ...found, label: w.label } : { ticker: w.ticker, label: w.label, price: 0, changePercent: 0, change: 0 };
      });

      setStocks(labeled);
      setNews(resp.data?.news || []);
      setLastUpdated(new Date());
    } catch (err) {
      setError("Failed to load market data.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000); // refresh every 5 min
    return () => clearInterval(interval);
  }, []);

  const upCount = stocks.filter(s => s.changePercent >= 0).length;
  const downCount = stocks.filter(s => s.changePercent < 0).length;

  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div
        onClick={() => setCollapsed(c => !c)}
        style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderBottom: collapsed ? "none" : `1px solid ${T.border}`, cursor: "pointer", userSelect: "none" }}
      >
        <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(0,212,188,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: T.teal, flexShrink: 0 }}>
          <TrendingUp size={14} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.bright }}>Market Overview</div>
          {!collapsed && !loading && stocks.length > 0 && (
            <div style={{ fontSize: 9.5, color: T.dim, marginTop: 1 }}>
              <span style={{ color: T.green }}>▲ {upCount}</span>
              {" · "}
              <span style={{ color: T.red }}>▼ {downCount}</span>
            </div>
          )}
        </div>
        {loading && !collapsed && (
          <RefreshCw size={11} style={{ color: T.dim, animation: "spin 1s linear infinite", flexShrink: 0 }} />
        )}
        {!loading && !collapsed && (
          <button
            onClick={e => { e.stopPropagation(); fetchData(); }}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: T.dim, padding: 2, display: "flex" }}
            title="Refresh"
          >
            <RefreshCw size={11} />
          </button>
        )}
        {collapsed ? <ChevronDown size={13} style={{ color: T.dim, flexShrink: 0 }} /> : <ChevronUp size={13} style={{ color: T.dim, flexShrink: 0 }} />}
      </div>

      {!collapsed && (
        <>
          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: `1px solid ${T.border}` }}>
            {["prices", "news"].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: "6px 0", fontSize: 10.5, fontWeight: 600, cursor: "pointer", border: "none",
                background: tab === t ? "rgba(0,212,188,0.08)" : "transparent",
                color: tab === t ? T.teal : T.dim,
                borderBottom: tab === t ? `2px solid ${T.teal}` : "2px solid transparent",
                transition: "all 0.15s", fontFamily: "inherit"
              }}>
                {t === "prices" ? "📈 Prices" : "📰 News"}
              </button>
            ))}
          </div>

          {/* Content */}
          {error ? (
            <div style={{ padding: 16, textAlign: "center", color: T.red, fontSize: 11 }}>{error}</div>
          ) : loading ? (
            <div style={{ padding: 24, textAlign: "center", color: T.dim, fontSize: 11 }}>Loading market data…</div>
          ) : tab === "prices" ? (
            <div>
              {stocks.map(s => <PriceRow key={s.ticker} stock={s} />)}
              {lastUpdated && (
                <div style={{ padding: "6px 12px", fontSize: 9.5, color: T.dim, textAlign: "right" }}>
                  Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
                </div>
              )}
            </div>
          ) : (
            <div>
              {news.length === 0 ? (
                <div style={{ padding: 16, textAlign: "center", color: T.dim, fontSize: 11 }}>No news available</div>
              ) : news.map((article, i) => (
                <a key={i} href={article.url} target="_blank" rel="noopener noreferrer"
                  style={{ display: "flex", gap: 8, padding: "8px 12px", borderBottom: `1px solid ${T.border}`, textDecoration: "none", transition: "background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = T.edge}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: T.bright, lineHeight: 1.4, marginBottom: 3 }}>{article.title}</div>
                    <div style={{ fontSize: 9.5, color: T.dim, display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ padding: "1px 5px", borderRadius: 3, background: "rgba(0,212,188,0.1)", color: T.teal, fontSize: 9 }}>{article.source}</span>
                      {article.published_at && <span>{formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}</span>}
                    </div>
                  </div>
                  <ExternalLink size={10} style={{ color: T.dim, flexShrink: 0, marginTop: 2 }} />
                </a>
              ))}
            </div>
          )}
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}