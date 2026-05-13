// AIAutocomplete.jsx
// Reusable AI-powered autocomplete dropdown for clinical text inputs.
// Shows suggestions with details (e.g. medication dosing) as user types.

import { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";

const DEBOUNCE_MS = 200;

// Mode configs
const MODE_CONFIG = {
  medication: {
    label: "medications",
    prompt: (q) =>
      `List the top 5 most common medications matching "${q}". For each, include the most common ED/outpatient doses and routes. Return ONLY a JSON array: [{"name":"Metoprolol succinate","detail":"25–200mg PO daily (tartrate: 25–100mg PO BID)"},{"name":"Metoprolol tartrate","detail":"25–100mg PO BID; IV: 5mg q5min x3"}]. No markdown.`,
    placeholder: "e.g. Metoprolol 25mg daily...",
  },
  surgical: {
    label: "surgical procedures",
    prompt: (q) =>
      `List the top 5 surgical history entries matching "${q}". Include the typical year range or context if helpful. Return ONLY a JSON array: [{"name":"Coronary artery bypass grafting (CABG)","detail":"Triple-vessel or LIMA-LAD; typical 2000s–2020s"},{"name":"Cardiac catheterization","detail":"Diagnostic or with stent placement"}]. No markdown.`,
    placeholder: "e.g. CABG 2018, appendectomy...",
  },
  allergy: {
    label: "allergies",
    prompt: (q) =>
      `List the top 5 allergy entries matching "${q}". Include common reaction types. Return ONLY a JSON array: [{"name":"Penicillin","detail":"Rash, urticaria, anaphylaxis"},{"name":"Piperacillin-tazobactam","detail":"Cross-react with penicillin allergy"}]. No markdown.`,
    placeholder: "e.g. Penicillin (rash)...",
  },
};

export function AIAutocompleteInput({
  mode = "medication",   // "medication" | "surgical" | "allergy"
  value,
  onChange,
  onAdd,
  style = {},
  addBtnStyle = {},
}) {
  const [suggestions, setSuggestions]   = useState([]);
  const [loading, setLoading]           = useState(false);
  const [open, setOpen]                 = useState(false);
  const timerRef                        = useRef(null);
  const containerRef                    = useRef(null);

  const config = MODE_CONFIG[mode] || MODE_CONFIG.medication;

  const fetchSuggestions = useCallback(async (q) => {
    if (q.length < 1) { setSuggestions([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: config.prompt(q),
        response_json_schema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name:   { type: "string" },
                  detail: { type: "string" },
                },
              },
            },
          },
        },
      });
      // The InvokeLLM with json schema returns a dict — pull items array
      let arr = [];
      if (Array.isArray(res)) arr = res;
      else if (res?.items) arr = res.items;
      else if (res?.output?.items) arr = res.output.items;
      setSuggestions(arr.slice(0, 5));
      setOpen(arr.length > 0);
    } catch {
      setSuggestions([]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  // Debounce on value change
  useEffect(() => {
    clearTimeout(timerRef.current);
    if (value.trim().length < 1) { setSuggestions([]); setOpen(false); setLoading(false); return; }
    setLoading(true);
    timerRef.current = setTimeout(() => fetchSuggestions(value.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timerRef.current);
  }, [value, fetchSuggestions]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (item) => {
    onChange(item.name);
    setSuggestions([]);
    setOpen(false);
  };

  const handleAddSelected = (item) => {
    onAdd(item.name);
    setSuggestions([]);
    setOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: "relative", flex: 1 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          style={style}
          placeholder={config.placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { onAdd(value); setSuggestions([]); setOpen(false); }
            if (e.key === "Escape") { setOpen(false); setSuggestions([]); }
          }}
          onFocus={() => { if (suggestions.length) setOpen(true); }}
          autoComplete="off"
        />
        {/* Spinner indicator */}
        {loading && (
          <span style={{
            position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
            fontFamily: "'JetBrains Mono',monospace", fontSize: 9,
            color: "rgba(59,158,255,.6)", pointerEvents: "none",
          }}>
            ●
          </span>
        )}
      </div>

      {/* Dropdown */}
      {open && suggestions.length > 0 && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 999,
          background: "#0a1929", border: "1px solid rgba(59,158,255,.4)",
          borderRadius: 10, overflow: "hidden",
          boxShadow: "0 8px 32px rgba(0,0,0,.6)",
        }}>
          <div style={{
            padding: "5px 10px",
            fontFamily: "'JetBrains Mono',monospace", fontSize: 7, fontWeight: 700,
            color: "rgba(59,158,255,.7)", letterSpacing: 1, textTransform: "uppercase",
            borderBottom: "1px solid rgba(42,79,122,.35)",
            background: "rgba(14,37,68,.7)",
          }}>
            AI Suggestions · click to select or ⊕ to add
          </div>
          {suggestions.map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 10px",
                borderBottom: i < suggestions.length - 1 ? "1px solid rgba(42,79,122,.2)" : "none",
                cursor: "pointer", transition: "background .12s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(59,158,255,.08)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              {/* Click name to populate input */}
              <div style={{ flex: 1 }} onClick={() => handleSelect(item)}>
                <div style={{
                  fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600,
                  color: "var(--qn-txt)",
                }}>
                  {item.name}
                </div>
                {item.detail && (
                  <div style={{
                    fontFamily: "'JetBrains Mono',monospace", fontSize: 9,
                    color: "rgba(107,158,200,.75)", marginTop: 1,
                  }}>
                    {item.detail}
                  </div>
                )}
              </div>
              {/* ⊕ button to add directly */}
              <button
                onClick={(e) => { e.stopPropagation(); handleAddSelected(item); }}
                title={`Add "${item.name}"`}
                style={{
                  padding: "3px 8px", borderRadius: 5, cursor: "pointer",
                  fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 700,
                  border: "1px solid rgba(61,255,160,.45)",
                  background: "rgba(61,255,160,.08)", color: "var(--qn-green)",
                  flexShrink: 0,
                }}
              >
                ⊕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}