import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { TrendingUp, AlertCircle, Loader2 } from "lucide-react";

export default function StockMarketNewsWidget() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStockNews = async () => {
      setLoading(true);
      setError(null);

      try {
        // Try to find available API token
        const newsApiToken = localStorage.getItem("thenewsapi_token") || 
                             localStorage.getItem("webzio_token") || 
                             localStorage.getItem("newsdata_token");

        if (!newsApiToken) {
          setError("No API token configured. Please add one in App Settings.");
          setArticles([]);
          setLoading(false);
          return;
        }

        // Fetch stock market news
        const resp = await base44.functions.invoke("fetchMedicalNews", {
          query: "stock market trading stocks NYSE NASDAQ S&P 500 dow jones",
          categories: "business,finance",
          page: 1,
          limit: 5,
          token: newsApiToken,
        });

        setArticles(resp.data?.articles || []);
      } catch (err) {
        setError("Failed to fetch stock market news.");
        setArticles([]);
      }
      setLoading(false);
    };

    fetchStockNews();
  }, []);

  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(37,99,235,0.08), rgba(14,165,233,0.08))",
      border: "1px solid rgba(37,99,235,0.2)",
      borderRadius: 12,
      padding: 16,
      height: "100%",
      display: "flex",
      flexDirection: "column",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: "rgba(37,99,235,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#2563eb"
        }}>
          <TrendingUp size={16} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#1f2937" }}>Stock Market News</div>
          <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>Top trading stories</div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, minHeight: 150 }}>
          <Loader2 size={20} style={{ color: "#2563eb", animation: "spin 1s linear infinite" }} />
        </div>
      ) : error ? (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: 12,
          background: "rgba(239,68,68,0.06)",
          border: "1px solid rgba(239,68,68,0.2)",
          borderRadius: 8,
          fontSize: 11,
          color: "#dc2626"
        }}>
          <AlertCircle size={14} />
          {error}
        </div>
      ) : articles.length === 0 ? (
        <div style={{ padding: 20, textAlign: "center", color: "#9ca3af", fontSize: 12 }}>
          No stock market news available
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, overflowY: "auto" }}>
          {articles.map((article, idx) => (
            <a
              key={idx}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: 10,
                background: "rgba(255,255,255,0.5)",
                border: "1px solid rgba(37,99,235,0.1)",
                borderRadius: 8,
                textDecoration: "none",
                color: "#1f2937",
                transition: "all 0.15s",
                cursor: "pointer",
                display: "block"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "rgba(37,99,235,0.08)";
                e.currentTarget.style.borderColor = "rgba(37,99,235,0.3)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "rgba(255,255,255,0.5)";
                e.currentTarget.style.borderColor = "rgba(37,99,235,0.1)";
              }}
            >
              <div style={{ fontSize: 11.5, fontWeight: 600, marginBottom: 4, lineHeight: 1.4 }}>
                {article.title}
              </div>
              <div style={{ fontSize: 10, color: "#6b7280", lineHeight: 1.3 }}>
                {article.description || "Stock market update"}
              </div>
            </a>
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}