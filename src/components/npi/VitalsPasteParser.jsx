import { useState, useCallback } from "react";

// ── VitalsPasteParser ─────────────────────────────────────────────────────────
// Paste any clinical text (triage note, nursing assessment, etc.).
// Calls Anthropic API to extract structured vitals, shows a preview,
// then merges into parent vitals state on confirm.
// Props: vitals, setVitals, onToast

export default function VitalsPasteParser({ vitals, setVitals, onToast }) {
  const [open,   setOpen]   = useState(false);
  const [text,   setText]   = useState("");
  const [busy,   setBusy]   = useState(false);
  const [parsed, setParsed] = useState(null);

  const close = useCallback(() => {
    if (busy) return;
    setOpen(false);
    setText("");
    setParsed(null);
  }, [busy]);

  const extract = useCallback(async () => {
    if (!text.trim()) return;
    setBusy(true);
    setParsed(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 300,
          system: `You are a clinical data extractor. From the provided clinical text, extract vital signs if present.
Return ONLY a valid JSON object with these keys (omit keys that are absent or unclear):
  hr       — heart rate, digits only (e.g. "88")
  bp       — blood pressure as "systolic/diastolic" (e.g. "132/84")
  rr       — respiratory rate, digits only (e.g. "16")
  spo2     — SpO2 percent, digits only, no % sign (e.g. "98")
  temp     — temperature in Fahrenheit, decimal string (e.g. "98.6")
  weight   — weight in kg, decimal string (e.g. "72.5")
  height   — height in cm, decimal string (e.g. "175")
Return only the JSON object — no markdown, no explanation, no surrounding text.`,
          messages: [{ role: "user", content: text }],
        }),
      });
      const data  = await res.json();
      const raw   = data.content?.[0]?.text || "{}";
      const clean = raw.replace(/```json|```/g, "").trim();
      const result = JSON.parse(clean);
      if (Object.keys(result).length === 0) {
        onToast?.("No recognizable vital signs found in the pasted text.", "error");
      } else {
        setParsed(result);
      }
    } catch {
      onToast?.("Extraction failed — check your connection and try again.", "error");
    } finally {
      setBusy(false);
    }
  }, [text, onToast]);

  const apply = useCallback(() => {
    if (!parsed) return;
    setVitals(prev => ({ ...prev, ...parsed }));
    onToast?.(`${Object.keys(parsed).length} vital sign${Object.keys(parsed).length > 1 ? "s" : ""} applied.`, "success");
    close();
  }, [parsed, setVitals, onToast, close]);

  return (
    <>
      {/* ── Trigger button ────────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(true)}
        title="Parse vitals from pasted clinical text"
        style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "5px 11px", borderRadius: 7, cursor: "pointer",
          background: "rgba(59,158,255,0.1)", border: "1px solid rgba(59,158,255,0.3)",
          color: "#3b9eff", fontFamily: "'DM Sans',sans-serif",
          fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
          transition: "background .15s, border-color .15s",
        }}
      >
        📋 Parse Text
      </button>

      {/* ── Modal overlay ─────────────────────────────────────────────────── */}
      {open && (
        <div
          onClick={close}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(3,8,16,0.8)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#081628", border: "1px solid rgba(26,53,85,0.7)",
              borderRadius: 16, padding: "24px 28px",
              width: 480, maxWidth: "94vw",
              boxShadow: "0 28px 80px rgba(0,0,0,0.65)",
            }}
          >
            {/* Title */}
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 700, color: "#e8f0fe", marginBottom: 3 }}>
              Parse Vitals from Text
            </div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#4a6a8a", marginBottom: 16, lineHeight: 1.55 }}>
              Paste a triage note, nursing assessment, or any clinical text. AI will extract vital signs and let you review before applying.
            </div>

            {/* Paste area */}
            <textarea
              rows={6}
              autoFocus
              placeholder={"T 98.6   HR 88   BP 132/84   RR 16   SpO2 98%   Wt 72 kg\n\nOr paste a full triage note or nursing assessment…"}
              value={text}
              onChange={e => { setText(e.target.value); setParsed(null); }}
              style={{
                width: "100%", boxSizing: "border-box",
                background: "rgba(14,37,68,0.7)", border: "1px solid rgba(26,53,85,0.55)",
                borderRadius: 9, padding: "10px 13px",
                color: "#f2f7ff", fontFamily: "'DM Sans',sans-serif",
                fontSize: 12, resize: "vertical", outline: "none",
                lineHeight: 1.6, transition: "border-color .15s",
              }}
              onFocus={e => { e.target.style.borderColor = "rgba(59,158,255,0.5)"; }}
              onBlur={e =>  { e.target.style.borderColor = "rgba(26,53,85,0.55)"; }}
            />

            {/* Extracted preview */}
            {parsed && (
              <div style={{
                marginTop: 12, padding: "11px 14px", borderRadius: 9,
                background: "rgba(0,229,192,0.06)", border: "1px solid rgba(0,229,192,0.22)",
              }}>
                <div style={{
                  fontFamily: "'JetBrains Mono',monospace", fontSize: 9,
                  color: "#00e5c0", letterSpacing: 1, textTransform: "uppercase", marginBottom: 9,
                }}>
                  Extracted — review before applying
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {Object.entries(parsed).map(([k, v]) => (
                    <span key={k} style={{
                      fontFamily: "'JetBrains Mono',monospace", fontSize: 11,
                      background: "rgba(0,229,192,0.1)", border: "1px solid rgba(0,229,192,0.28)",
                      borderRadius: 5, padding: "2px 9px", color: "#00e5c0",
                    }}>
                      {k.toUpperCase()}: {v}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action row */}
            <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
              <button
                onClick={close}
                disabled={busy}
                style={{
                  padding: "7px 16px", borderRadius: 8, cursor: busy ? "not-allowed" : "pointer",
                  background: "transparent", border: "1px solid rgba(26,53,85,0.6)",
                  color: "#5a82a8", fontFamily: "'DM Sans',sans-serif", fontSize: 12,
                }}
              >
                Cancel
              </button>

              {parsed ? (
                <button
                  onClick={apply}
                  style={{
                    padding: "7px 20px", borderRadius: 8, cursor: "pointer",
                    background: "linear-gradient(135deg,#00e5c0,#00b4d8)", border: "none",
                    color: "#050f1e", fontFamily: "'DM Sans',sans-serif",
                    fontSize: 12, fontWeight: 700,
                  }}
                >
                  ✓ Apply Vitals
                </button>
              ) : (
                <button
                  onClick={extract}
                  disabled={busy || !text.trim()}
                  style={{
                    padding: "7px 20px", borderRadius: 8,
                    cursor: busy || !text.trim() ? "not-allowed" : "pointer",
                    background: busy || !text.trim()
                      ? "rgba(59,158,255,0.06)"
                      : "rgba(59,158,255,0.18)",
                    border: "1px solid rgba(59,158,255,0.35)",
                    color: busy || !text.trim() ? "#2a5a88" : "#3b9eff",
                    fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600,
                    transition: "all .15s",
                  }}
                >
                  {busy ? "Extracting…" : "Extract Vitals"}
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}