// QuickNoteSmartFill.jsx
// SmartFill sequential guided fill mode
// Exported: SmartFillBar

import { useState, useEffect, useRef, useMemo } from "react";
import { BLANK_OPTIONS } from "./QuickNoteData";

// ─── SMARTFILL (Sequential Guided Mode) ──────────────────────────────────────
// One token at a time. Active token highlighted with context label.
// Keyboard: 1–N selects option · Tab/→ skips · Escape exits · Enter confirms text input

// Parse ___ blanks and option/option toggles from template text
// Returns array: { idx, raw, type:"blank"|"options"|"toggle", options?[], context?, labelPrefix? }
function parseTokens(text) {
  const tokens = [];

  // Pass 1 — find all [or] toggle spans
  // Captures full "phrase A [or] phrase B [or] phrase C" sequences
  // Left side: back up from [or] to nearest sentence boundary or semicolon/colon
  // Right side: forward from last [or] to nearest boundary
  const orRe = /([^:;.\n(]+?)\s*(?:\[or\]\s*[^:;.\n([]+)*\[or\]\s*([^:;.\n([)]+)/gi;
  let m;
  while ((m = orRe.exec(text)) !== null) {
    const fullMatch = m[0];
    // Split the full match on [or] to get all options
    const parts = fullMatch.split(/\s*\[or\]\s*/).map(p => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      tokens.push({
        idx:     m.index,
        raw:     fullMatch,
        type:    "toggle",
        options: parts,
      });
    }
  }

  // Pass 1.5 — labeled yes/no: "word: yes/no" (e.g. "exertional: yes/no")
  // Must run before Pass 2 so these spans are claimed before the slash-toggle regex fires
  const labeledYesNoRe = /([\w][\w -]*):\s*(yes\/no|no\/yes)/gi;
  while ((m = labeledYesNoRe.exec(text)) !== null) {
    const fullMatch = m[0];
    const labelKey = m[1].trim();
    tokens.push({
      idx:         m.index,
      raw:         fullMatch,    // full span e.g. "exertional: yes/no"
      type:        "toggle",
      options:     ["Yes", "No"],
      context:     labelKey,     // shown as FILL label e.g. "EXERTIONAL"
      labelPrefix: labelKey,     // prepended on confirm e.g. "exertional: Yes"
    });
  }

  // Pass 2 — find ___ blanks and word/word slash-toggles
  // Skip positions already covered by Pass 1 [or] tokens AND Pass 1.5 labeled yes/no
  const skipRanges = tokens.map(t => [t.idx, t.idx + t.raw.length]);
  const inOrRange = (idx) => skipRanges.some(([s, e]) => idx >= s && idx < e);

  const re2 = /(___|(?<!\w)([a-z][a-z -]*)(?:\/[a-z][a-z -]*)+(?!\w))/gi;
  while ((m = re2.exec(text)) !== null) {
    if (inOrRange(m.index)) continue;
    const raw = m[0];
    if (raw === "___") {
      const before = text.slice(0, m.index).trimEnd();
      const ctxMatch = before.match(/([a-z]+)[^a-z]*$/i);
      const ctx = ctxMatch ? ctxMatch[1].toLowerCase() : null;
      const opts = ctx && BLANK_OPTIONS[ctx] ? BLANK_OPTIONS[ctx] : null;
      tokens.push({ idx:m.index, raw, type:opts ? "options" : "blank", options:opts, context:ctx });
    } else if (raw.includes("/")) {
      tokens.push({ idx:m.index, raw, type:"toggle", options:raw.split("/") });
    }
  }

  // Sort by position in text so SmartFill sequential mode walks them in order
  tokens.sort((a, b) => a.idx - b.idx);
  return tokens;
}

export function SmartFillBar({ value, onChange }) {
  const tokens = useMemo(() => parseTokens(value), [value]);
  const [cursor,     setCursor]     = useState(0);   // index into tokens array
  const [textInput,  setTextInput]  = useState("");
  const [exited,     setExited]     = useState(false);
  const inputRef = useRef();

  // Reset cursor when tokens change (new template inserted)
  const prevLength = useRef(tokens.length);
  useEffect(() => {
    if (tokens.length !== prevLength.current) {
      setCursor(0); setTextInput(""); setExited(false);
      prevLength.current = tokens.length;
    }
  }, [tokens.length]);

  // Auto-focus text input when blank token becomes active
  useEffect(() => {
    if (!exited && tokens[cursor]?.type === "blank") {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [cursor, exited, tokens]);

  if (!tokens.length || exited) return null;

  const tok = tokens[cursor];
  if (!tok) return null;

  const total = tokens.length;

  const replaceAndAdvance = (raw, replacement) => {
    const actual = tok.labelPrefix
      ? `${tok.labelPrefix}: ${replacement}`
      : replacement;
    onChange(value.replace(raw, actual));
    // Advance or exit
    if (cursor + 1 >= total) {
      setExited(true);
    } else {
      setCursor(cursor + 1);
      setTextInput("");
    }
  };

  const skip = () => {
    if (cursor + 1 >= total) { setExited(true); }
    else { setCursor(cursor + 1); setTextInput(""); }
  };

  const exit = () => setExited(true);

  const handleTextSubmit = () => {
    if (textInput.trim()) { replaceAndAdvance(tok.raw, textInput.trim()); }
    else skip();
  };

  // Bar color by token type
  const barColor   = tok.type === "toggle" ? "rgba(0,229,192,.25)"   : "rgba(245,200,66,.25)";
  const barBg      = tok.type === "toggle" ? "rgba(0,229,192,.06)"   : "rgba(245,200,66,.06)";
  const labelColor = tok.type === "toggle" ? "var(--qn-teal)"        : "var(--qn-gold)";
  const optColor   = tok.type === "options" ? "var(--qn-gold)"       : "var(--qn-teal)";
  const optBd      = tok.type === "options" ? "rgba(245,200,66,.35)" : "rgba(0,229,192,.3)";
  const optHoverBg = tok.type === "options" ? "rgba(245,200,66,.18)" : "rgba(0,229,192,.15)";

  return (
    <div style={{ padding:"8px 10px", borderRadius:8, marginBottom:6,
      background:barBg, border:`1px solid ${barColor}`,
      display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>

      {/* Progress + context label */}
      <div style={{ display:"flex", flexDirection:"column", flexShrink:0, minWidth:90 }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:"var(--qn-txt4)", letterSpacing:.8, marginBottom:2 }}>
          FILL {cursor + 1} OF {total}
        </div>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
          fontWeight:700, color:labelColor, letterSpacing:.5 }}>
          {tok.context
            ? tok.context.toUpperCase()
            : tok.type === "toggle"
              ? tok.raw
              : "TYPE VALUE"}
        </div>
      </div>

      {/* Divider */}
      <div style={{ width:1, height:32, background:"rgba(42,79,122,.4)", flexShrink:0 }} />

      {/* Option buttons */}
      <div style={{ display:"flex", gap:5, flexWrap:"wrap", flex:1 }}>
        {(tok.type === "options" || tok.type === "toggle") && tok.options.map((opt, oi) => (
          <button key={oi} onClick={() => replaceAndAdvance(tok.raw, opt)}
            style={{ padding:"4px 12px", borderRadius:6, cursor:"pointer",
              fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:700,
              border:`1px solid ${optBd}`,
              background:"rgba(14,37,68,.7)", color:optColor,
              transition:"all .12s" }}
            onMouseEnter={e => { e.currentTarget.style.background = optHoverBg; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(14,37,68,.7)"; e.currentTarget.style.color = optColor; }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              opacity:.6, marginRight:4 }}>{oi + 1}</span>
            {opt}
          </button>
        ))}

        {tok.type === "blank" && (
          <span style={{ display:"inline-flex", gap:5, alignItems:"center" }}>
            <input ref={inputRef} value={textInput}
              onChange={e => setTextInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter")  { e.preventDefault(); handleTextSubmit(); }
                if (e.key === "Tab")    { e.preventDefault(); skip(); }
                if (e.key === "Escape") { e.preventDefault(); exit(); }
              }}
              placeholder="Type value · Enter to confirm"
              style={{ padding:"4px 10px", borderRadius:6,
                background:"rgba(14,37,68,.8)", border:"1px solid rgba(245,200,66,.45)",
                color:"var(--qn-txt)", fontFamily:"'DM Sans',sans-serif", fontSize:11,
                outline:"none", minWidth:160 }} />
            <button onClick={handleTextSubmit}
              style={{ padding:"4px 10px", borderRadius:6, cursor:"pointer",
                fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
                background:"rgba(245,200,66,.12)", border:"1px solid rgba(245,200,66,.4)",
                color:"var(--qn-gold)" }}>✓</button>
          </span>
        )}
      </div>

      {/* Nav controls */}
      <div style={{ display:"flex", gap:5, flexShrink:0, alignItems:"center" }}>
        {cursor > 0 && (
          <button onClick={() => { setCursor(cursor - 1); setTextInput(""); }}
            style={{ padding:"3px 8px", borderRadius:5, cursor:"pointer",
              fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              border:"1px solid rgba(42,79,122,.4)", background:"transparent",
              color:"var(--qn-txt4)" }}>← Back</button>
        )}
        <button onClick={skip}
          style={{ padding:"3px 8px", borderRadius:5, cursor:"pointer",
            fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            border:"1px solid rgba(42,79,122,.4)", background:"transparent",
            color:"var(--qn-txt4)" }}>Skip →</button>
        <button onClick={exit}
          style={{ padding:"3px 8px", borderRadius:5, cursor:"pointer",
            fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            border:"1px solid rgba(42,79,122,.4)", background:"transparent",
            color:"var(--qn-txt4)" }}>✕ Done</button>
      </div>
    </div>
  );
}