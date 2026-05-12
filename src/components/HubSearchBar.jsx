import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { searchHubs } from "@/lib/hubRegistry";

export default function HubSearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (query.trim()) {
      setResults(searchHubs(query));
      setSelectedIdx(-1);
    } else {
      setResults([]);
    }
  }, [query]);

  const handleSelect = (route) => {
    navigate(route);
    setQuery("");
    setOpen(false);
    setResults([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx(prev => (prev > -1 ? prev - 1 : -1));
    } else if (e.key === "Enter" && selectedIdx >= 0) {
      e.preventDefault();
      handleSelect(results[selectedIdx].route);
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
  };

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 400 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8,
          padding: "8px 12px",
        }}
      >
        <Search size={16} style={{ color: "rgba(255,255,255,0.5)" }} />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search hubs..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "rgba(255,255,255,0.9)",
            fontSize: 13,
            fontFamily: "inherit",
          }}
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
              inputRef.current?.focus();
            }}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.5)",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 4,
            background: "rgba(15,23,42,0.95)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            backdropFilter: "blur(12px)",
            maxHeight: 320,
            overflowY: "auto",
            zIndex: 1000,
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          }}
        >
          {results.map((hub, idx) => (
            <button
              key={hub.route}
              onClick={() => handleSelect(hub.route)}
              onMouseEnter={() => setSelectedIdx(idx)}
              style={{
                width: "100%",
                padding: "10px 14px",
                background: selectedIdx === idx ? "rgba(0,212,184,0.15)" : "transparent",
                border: "none",
                borderBottom: idx < results.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                color: selectedIdx === idx ? "#00d4b8" : "rgba(226,232,244,0.8)",
                textAlign: "left",
                cursor: "pointer",
                fontSize: 13,
                transition: "all 0.15s",
              }}
            >
              {hub.name}
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginLeft: 8 }}>
                {hub.route}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}