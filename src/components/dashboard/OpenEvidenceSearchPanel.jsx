import React, { useState } from "react";
import { base44 } from "@/api/base44Client";

const T = {
  navy: "#050f1e",
  slate: "#0b1d35",
  panel: "#0e2340",
  edge: "#162d4f",
  border: "#1e3a5f",
  muted: "#2a4d72",
  dim: "#4a7299",
  text: "#c8ddf0",
  bright: "#e8f4ff",
  teal: "#00d4bc",
  teal2: "#00a896",
  amber: "#f5a623",
  red: "#ff5c6c",
  green: "#2ecc71",
};

const QUICK_SEARCHES = [
  "Sepsis management",
  "Acute MI protocol",
  "Stroke evaluation",
  "Pneumonia treatment",
  "Asthma exacerbation",
];

export default function OpenEvidenceSearchPanel() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setHasSearched(true);
    setQuery(searchQuery);

    try {
      const response = await base44.functions.invoke("openEvidenceSearch", {
        q: searchQuery,
      });

      const data = response.data;
      if (data && data.results) {
        setResults(
          data.results.map((r, idx) => ({
            id: r.id || idx,
            title: r.title || "Untitled",
            description: r.description || "",
            source: r.source || "OpenEvidence",
            url: r.url || "#",
          }))
        );
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error("Search failed:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: T.panel,
        border: `1px solid ${T.border}`,
        borderRadius: "14px",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Title */}
      <div style={{ marginBottom: "20px" }}>
        <div
          style={{
            fontSize: "11px",
            color: T.dim,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: "8px",
          }}
        >
          Evidence Search
        </div>
        <h2
          style={{
            fontSize: "18px",
            color: T.bright,
            fontWeight: 600,
            marginBottom: "4px",
          }}
        >
          Clinical Guidelines
        </h2>
      </div>

      {/* Search Box */}
      <div
        style={{
          display: "flex",
          gap: 0,
          border: `2px solid ${T.border}`,
          background: T.edge,
          marginBottom: "16px",
          borderRadius: "6px",
          overflow: "hidden",
          transition: "box-shadow 0.2s",
        }}
        onFocus={(e) => {
          e.currentTarget.style.boxShadow = `0 0 0 3px ${T.teal}`;
        }}
        onBlur={(e) => {
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <input
          type="text"
          placeholder="Search guidelines…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") handleSearch(query);
          }}
          style={{
            flex: 1,
            fontSize: "14px",
            padding: "12px 16px",
            border: "none",
            background: "transparent",
            color: T.text,
            outline: "none",
            fontFamily: "inherit",
          }}
        />
        <button
          onClick={() => handleSearch(query)}
          disabled={loading}
          style={{
            padding: "12px 20px",
            background: T.teal,
            color: T.navy,
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            transition: "opacity 0.2s",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {/* Quick Searches */}
      {!hasSearched && (
        <div style={{ marginBottom: "20px" }}>
          <div
            style={{
              fontSize: "10px",
              color: T.dim,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: "8px",
            }}
          >
            Try searching
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {QUICK_SEARCHES.map((qs) => (
              <button
                key={qs}
                onClick={() => handleSearch(qs)}
                style={{
                  fontSize: "11px",
                  padding: "5px 12px",
                  border: `1px solid ${T.border}`,
                  background: "transparent",
                  color: T.text,
                  cursor: "pointer",
                  borderRadius: "4px",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = T.teal;
                  e.currentTarget.style.color = T.teal;
                  e.currentTarget.style.background = `rgba(0,212,188,0.1)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = T.border;
                  e.currentTarget.style.color = T.text;
                  e.currentTarget.style.background = "transparent";
                }}
              >
                {qs}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Status Bar */}
      {loading && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px 0",
            borderTop: `1px solid ${T.border}`,
            borderBottom: `1px solid ${T.border}`,
            marginBottom: "16px",
            fontSize: "11px",
            color: T.dim,
          }}
        >
          <div
            style={{
              width: "12px",
              height: "12px",
              border: `2px solid ${T.border}`,
              borderTopColor: T.teal,
              borderRadius: "50%",
              animation: "spin 0.7s linear infinite",
            }}
          />
          <span>Searching guidelines...</span>
        </div>
      )}

      {/* Results */}
      {hasSearched && !loading && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: "16px",
              paddingBottom: "12px",
              borderBottom: `1px solid ${T.border}`,
            }}
          >
            <h3 style={{ fontSize: "14px", color: T.bright, fontWeight: 500 }}>
              Results
            </h3>
            <span style={{ fontSize: "10px", color: T.dim }}>
              {results.length} found
            </span>
          </div>

          {results.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "24px",
                color: T.dim,
                fontSize: "12px",
              }}
            >
              No results found. Try a different search.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {results.map((result) => (
                <div
                  key={result.id}
                  style={{
                    border: `1px solid ${T.border}`,
                    background: T.edge,
                    padding: "14px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = `0 0 0 1px ${T.teal}`;
                    e.currentTarget.style.background = `rgba(0,212,188,0.05)`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.background = T.edge;
                  }}
                  onClick={() => window.open(result.url, "_blank")}
                >
                  <h4
                    style={{
                      fontSize: "13px",
                      color: T.bright,
                      fontWeight: 600,
                      marginBottom: "6px",
                    }}
                  >
                    {result.title}
                  </h4>
                  {result.description && (
                    <p
                      style={{
                        fontSize: "12px",
                        color: T.text,
                        marginBottom: "8px",
                        lineHeight: 1.5,
                      }}
                    >
                      {result.description}
                    </p>
                  )}
                  <span
                    style={{
                      fontSize: "10px",
                      color: T.teal,
                      fontFamily: "monospace",
                    }}
                  >
                    {result.source}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}