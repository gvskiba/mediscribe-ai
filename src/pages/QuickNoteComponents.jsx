// QuickNoteComponents.jsx
// Extracted UI components for QuickNote.jsx
// Imports data from QuickNoteData.js and QuickNoteTemplates.js
// Exported: dispColor, StepProgress, InputZone, MDMResult, DispositionResult

import { useState, useEffect, useRef, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { CC_CATEGORIES, CC_HUB_MAP, BLANK_OPTIONS } from "./QuickNoteData";
import { ROS_TEMPLATES, PE_TEMPLATES } from "./QuickNoteTemplates";

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function mdmLevelColor(level) {
  if (!level) return "#6b9ec8";
  const l = level.toLowerCase();
  if (l.includes("high"))           return "#ff4444";
  if (l.includes("moderate"))       return "#ff9f43";
  if (l.includes("low"))            return "#f5c842";
  if (l.includes("straightforward")) return "#3dffa0";
  return "#3b9eff";
}

export function dispColor(disp) {
  if (!disp) return "#6b9ec8";
  const d = disp.toLowerCase();
  if (d.includes("icu"))        return "#ff4444";
  if (d.includes("admit"))      return "#ff6b6b";
  if (d.includes("obs"))        return "#ff9f43";
  if (d.includes("transfer"))   return "#9b6dff";
  if (d.includes("precaution")) return "#f5c842";
  return "#3dffa0";
}

function SectionLabel({ children, color, style: extraStyle }) {
  return (
    <div className="qn-section-lbl"
      style={{ ...(color ? { color } : {}), ...(extraStyle || {}) }}>
      {children}
    </div>
  );
}


// Safe string coercion — prevents React Error #31 when AI returns unexpected objects
function s(val) {
  if (val === null || val === undefined) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number") return String(val);
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

// ─── STEP PROGRESS ────────────────────────────────────────────────────────────
export function StepProgress({ phase1Done, phase2Done, p2Open }) {
  const steps = [
    { n:1, label:"Initial Assessment", sub:"CC · Vitals · HPI · ROS · Exam", done:phase1Done },
    { n:2, label:"Workup & Disposition", sub:"Labs · Imaging · Recheck Vitals", done:phase2Done },
  ];
  return (
    <div style={{ display:"flex", alignItems:"center", gap:0, marginBottom:14,
      padding:"10px 14px", borderRadius:10,
      background:"rgba(8,22,40,.6)", border:"1px solid rgba(42,79,122,.3)" }}
      className="no-print">
      {steps.map((step, i) => {
        const isActive = step.n === 1 ? !phase1Done : p2Open;
        const color = step.done ? "var(--qn-green)" : isActive ? "var(--qn-teal)" : "var(--qn-txt4)";
        return (
          <div key={step.n} style={{ display:"flex", alignItems:"center", flex: i === 0 ? "0 0 auto" : 1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:26, height:26, borderRadius:"50%", flexShrink:0,
                display:"flex", alignItems:"center", justifyContent:"center",
                background: step.done ? "rgba(61,255,160,.15)" : isActive ? "rgba(0,229,192,.12)" : "rgba(42,79,122,.2)",
                border:`1.5px solid ${step.done ? "rgba(61,255,160,.5)" : isActive ? "rgba(0,229,192,.4)" : "rgba(42,79,122,.4)"}`,
                fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:700, color }}>
                {step.done ? "✓" : step.n}
              </div>
              <div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
                  fontSize:12, color, lineHeight:1.2 }}>{step.label}</div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                  color:"var(--qn-txt4)", letterSpacing:.5 }}>{step.sub}</div>
              </div>
            </div>
            {i === 0 && (
              <div style={{ flex:1, height:1.5, margin:"0 14px",
                background: phase1Done
                  ? "linear-gradient(90deg,rgba(61,255,160,.5),rgba(0,229,192,.3))"
                  : "rgba(42,79,122,.3)",
                borderRadius:1, minWidth:24 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── ROS / PE TEMPLATES ──────────────────────────────────────────────────────

// ─── CHIEF COMPLAINT CATEGORIES ─────────────────────────────────────────────

// ─── CC PICKER ────────────────────────────────────────────────────────────────
function CCPicker({ onInsert, onClose }) {
  const [activeCat, setActiveCat] = useState(CC_CATEGORIES[0].id);
  const cat = CC_CATEGORIES.find(c => c.id === activeCat);

  useEffect(() => {
    const fn = e => { if (e.key === "Escape") { e.preventDefault(); onClose(); } };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  return (
    <div style={{ position:"absolute", zIndex:100, left:0, right:0, bottom:"calc(100% + 4px)",
      background:"rgba(8,22,40,.97)", border:"1px solid rgba(59,158,255,.4)",
      borderRadius:10, padding:"10px 12px", boxShadow:"0 8px 32px rgba(0,0,0,.6)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700,
          color:"var(--qn-blue)", letterSpacing:1.5, textTransform:"uppercase" }}>
          Chief Complaint
        </span>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:"var(--qn-txt4)", letterSpacing:.5 }}>Click to insert · Esc to close</span>
        <div style={{ flex:1 }} />
        <button onClick={onClose}
          style={{ background:"transparent", border:"none", cursor:"pointer",
            color:"var(--qn-txt4)", fontFamily:"'JetBrains Mono',monospace", fontSize:11 }}>✕</button>
      </div>
      <div style={{ display:"flex", gap:4, marginBottom:8, flexWrap:"wrap" }}>
        {CC_CATEGORIES.map(c => (
          <button key={c.id} onClick={() => setActiveCat(c.id)}
            style={{ padding:"3px 10px", borderRadius:6, cursor:"pointer", transition:"all .12s",
              fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600,
              border:`1px solid ${activeCat === c.id ? c.color + "66" : "rgba(42,79,122,.35)"}`,
              background:activeCat === c.id ? c.color + "14" : "transparent",
              color:activeCat === c.id ? c.color : "var(--qn-txt3)" }}>
            {c.label}
          </button>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:4 }}>
        {cat.ccs.map((cc, i) => (
          <button key={i} onClick={() => { onInsert(cc.text); onClose(); }}
            style={{ padding:"6px 10px", borderRadius:7, cursor:"pointer", textAlign:"left",
              transition:"all .12s",
              border:`1px solid ${cat.color}22`,
              background:`${cat.color}06`,
              fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:500,
              color:"var(--qn-txt2)" }}
            onMouseEnter={e => { e.currentTarget.style.background = cat.color + "18"; e.currentTarget.style.borderColor = cat.color + "55"; e.currentTarget.style.color = "var(--qn-txt)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = cat.color + "06"; e.currentTarget.style.borderColor = cat.color + "22"; e.currentTarget.style.color = "var(--qn-txt2)"; }}>
            {cc.label}
          </button>
        ))}
      </div>
      <HubStrip catId={activeCat} label="Suggested Hubs" />
    </div>
  );
}

// ─── TEMPLATE PICKER ─────────────────────────────────────────────────────────
function TemplatePicker({ type, onInsert, onClose, hasContent }) {
  const builtIns  = type === "ros" ? ROS_TEMPLATES : PE_TEMPLATES;
  const [userTpls,    setUserTpls]    = useState([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [confirmKey,  setConfirmKey]  = useState(null);
  const [activeTag,   setActiveTag]   = useState(null);
  const [searchQ,     setSearchQ]     = useState("");
  const searchRef = useRef();
  const color    = type === "ros" ? "var(--qn-teal)" : "var(--qn-purple)";
  const colorRgb = type === "ros" ? "0,229,192" : "155,109,255";

  // Parse comma-separated category into tags array
  const parseTags = (str) => (str || "").split(",").map(t => t.trim()).filter(Boolean);

  useEffect(() => {
    base44.entities.NoteTemplate.list({ sort:"-created_date", limit:50 })
      .then(res => {
        const filtered = (res || []).filter(t => t.type === type);
        filtered.sort((a, b) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0));
        setUserTpls(filtered);
      })
      .catch(() => {})
      .finally(() => setLoadingUser(false));
  }, [type]);

  // Auto-focus search when enough templates exist
  useEffect(() => {
    if (!loadingUser && userTpls.length >= 5) {
      setTimeout(() => searchRef.current?.focus(), 60);
    }
  }, [loadingUser, userTpls.length]);

  const handleInsert = (text, key) => {
    if (hasContent && confirmKey !== key) { setConfirmKey(key); return; }
    onInsert(text);
    onClose();
  };

  useEffect(() => {
    const fn = e => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); return; }
      const n = parseInt(e.key);
      if (n >= 1 && n <= 9) {
        e.preventDefault();
        const tpl = builtIns.find(t => t.id === n);
        if (tpl) handleInsert(tpl.text, "b-" + n);
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [hasContent, confirmKey, onInsert, onClose]);

  return (
    <div style={{ position:"absolute", zIndex:100, left:0, right:0, top:"calc(100% + 4px)",
      background:"rgba(8,22,40,.97)", border:`1px solid rgba(${colorRgb},.4)`,
      borderRadius:10, padding:"10px 12px", boxShadow:"0 8px 32px rgba(0,0,0,.6)",
      maxHeight:420, overflowY:"auto" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700,
          color, letterSpacing:1.5, textTransform:"uppercase" }}>
          {type === "ros" ? "ROS" : "PE"} Templates
        </span>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:"var(--qn-txt4)", letterSpacing:.5 }}>1-9 built-ins · click custom</span>
        <div style={{ flex:1 }} />
        <button onClick={() => { window.location.href = "/TemplateStudio"; }}
          style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:"var(--qn-txt4)", background:"rgba(42,79,122,.2)",
            border:"1px solid rgba(42,79,122,.4)", borderRadius:5,
            padding:"2px 8px", cursor:"pointer", letterSpacing:.3 }}>
          + Studio
        </button>
        <button onClick={onClose}
          style={{ background:"transparent", border:"none", cursor:"pointer",
            color:"var(--qn-txt4)", fontFamily:"'JetBrains Mono',monospace", fontSize:11 }}>✕</button>
      </div>

      {!loadingUser && userTpls.length > 0 && (
        <div style={{ marginBottom:10 }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:`rgba(${colorRgb},.7)`, letterSpacing:1.2, textTransform:"uppercase",
            marginBottom:5, paddingBottom:4,
            borderBottom:`1px solid rgba(${colorRgb},.15)` }}>
            My Templates ({userTpls.length})
          </div>

          {/* Search input — visible when 5+ templates */}
          {userTpls.length >= 5 && (
            <div style={{ marginBottom:7, position:"relative" }}>
              <input
                ref={searchRef}
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Escape") { e.preventDefault(); setSearchQ(""); onClose(); }
                  if (e.key === "Tab") { e.preventDefault(); /* let Tab fall to template buttons */ }
                }}
                placeholder="Search templates…"
                style={{ width:"100%", padding:"5px 10px 5px 28px",
                  borderRadius:7, background:"rgba(14,37,68,.8)",
                  border:`1px solid rgba(${colorRgb},.3)`,
                  color:"var(--qn-txt)", fontFamily:"'DM Sans',sans-serif",
                  fontSize:11, outline:"none", boxSizing:"border-box",
                  transition:"border-color .15s" }}
                onFocus={e => e.target.style.borderColor = `rgba(${colorRgb},.6)`}
                onBlur={e  => e.target.style.borderColor = `rgba(${colorRgb},.3)`}
              />
              <span style={{ position:"absolute", left:9, top:"50%",
                transform:"translateY(-50%)", fontSize:11,
                color:`rgba(${colorRgb},.5)`, pointerEvents:"none" }}>🔍</span>
              {searchQ && (
                <button onClick={() => setSearchQ("")}
                  style={{ position:"absolute", right:7, top:"50%",
                    transform:"translateY(-50%)", background:"transparent",
                    border:"none", cursor:"pointer", fontSize:12,
                    color:`rgba(${colorRgb},.5)`, padding:"0 2px",
                    lineHeight:1 }}>×</button>
              )}
            </div>
          )}
          {/* Tag filter chips — only shown when templates have tags */}
          {(() => {
            const pickerTags = [...new Set(userTpls.flatMap(t => parseTags(t.category)))];
            return pickerTags.length > 0 ? (
              <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:7 }}>
                <button onClick={() => setActiveTag(null)}
                  style={{ padding:"2px 8px", borderRadius:20, cursor:"pointer",
                    fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                    border:`1px solid ${!activeTag ? `rgba(${colorRgb},.5)` : "rgba(42,79,122,.4)"}`,
                    background:!activeTag ? `rgba(${colorRgb},.12)` : "transparent",
                    color:!activeTag ? color : "var(--qn-txt4)", transition:"all .12s" }}>
                  All
                </button>
                {pickerTags.map(tag => (
                  <button key={tag} onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                    style={{ padding:"2px 8px", borderRadius:20, cursor:"pointer",
                      fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                      border:`1px solid ${activeTag === tag ? `rgba(${colorRgb},.5)` : "rgba(42,79,122,.35)"}`,
                      background:activeTag === tag ? `rgba(${colorRgb},.12)` : "transparent",
                      color:activeTag === tag ? color : "var(--qn-txt4)",
                      transition:"all .12s" }}>
                    {tag}
                  </button>
                ))}
              </div>
            ) : null;
          })()}
          {(() => {
            const visible = userTpls
              .filter(t => !activeTag || parseTags(t.category).includes(activeTag))
              .filter(t => {
                if (!searchQ.trim()) return true;
                const q = searchQ.toLowerCase();
                return t.name?.toLowerCase().includes(q) ||
                       (t.short || "").toLowerCase().includes(q) ||
                       parseTags(t.category).some(tag => tag.includes(q));
              });
            if (!visible.length) return (
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                color:"var(--qn-txt4)", padding:"8px 4px", textAlign:"center" }}>
                {searchQ ? `No templates matching "${searchQ}"` : "No templates in this tag"}
              </div>
            );
            return (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:4 }}>
                {visible.map(t => (
                  <button key={t.id} onClick={() => handleInsert(t.text, "u-"+t.id)}
                    style={{ display:"flex", alignItems:"center", gap:7, padding:"5px 8px",
                      borderRadius:6, cursor:"pointer", textAlign:"left", transition:"all .12s",
                      border:`1px solid ${confirmKey === "u-"+t.id ? "rgba(255,159,67,.6)" : `rgba(${colorRgb},.2)`}`,
                      background:confirmKey === "u-"+t.id ? "rgba(255,159,67,.12)" : `rgba(${colorRgb},.04)` }}>
                    {t.is_default && (
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                        color:"var(--qn-gold)", flexShrink:0 }}>★</span>
                    )}
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600,
                        color:confirmKey === "u-"+t.id ? "var(--qn-orange)" : "var(--qn-txt2)",
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {t.name}
                      </div>
                      {parseTags(t.category).length > 0 && confirmKey !== "u-"+t.id && (
                        <div style={{ display:"flex", gap:3, flexWrap:"wrap", marginTop:2 }}>
                          {parseTags(t.category).map(tag => (
                            <span key={tag} style={{ fontFamily:"'JetBrains Mono',monospace",
                              fontSize:7, color:`rgba(${colorRgb},.6)`,
                              background:`rgba(${colorRgb},.07)`,
                              border:`1px solid rgba(${colorRgb},.2)`,
                              borderRadius:10, padding:"1px 5px" }}>{tag}</span>
                          ))}
                        </div>
                      )}
                      {confirmKey === "u-"+t.id && (
                        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                          color:"var(--qn-orange)", letterSpacing:.3 }}>
                          Overwrites text — click again to confirm
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            );
          })()}
        </div>
      )}
      {loadingUser && (
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:"var(--qn-txt4)", marginBottom:8 }}>Loading custom templates…</div>
      )}

      <div>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:"var(--qn-txt4)", letterSpacing:1.2, textTransform:"uppercase",
          marginBottom:5, paddingBottom:4,
          borderBottom:"1px solid rgba(42,79,122,.25)" }}>
          Built-in · Press 1–9
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:4 }}>
          {builtIns.map(t => (
            <button key={t.id} onClick={() => handleInsert(t.text, "b-"+t.id)}
              style={{ display:"flex", alignItems:"center", gap:7, padding:"5px 8px",
                borderRadius:6, cursor:"pointer", textAlign:"left", transition:"all .12s",
                border:`1px solid ${confirmKey === "b-"+t.id ? "rgba(255,159,67,.6)" : `rgba(${colorRgb},.2)`}`,
                background:confirmKey === "b-"+t.id ? "rgba(255,159,67,.12)" : `rgba(${colorRgb},.04)` }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700,
                color:confirmKey === "b-"+t.id ? "var(--qn-orange)" : "var(--qn-txt4)",
                flexShrink:0, minWidth:14 }}>{t.id}</span>
              <div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600,
                  color:confirmKey === "b-"+t.id ? "var(--qn-orange)" : "var(--qn-txt2)" }}>
                  {t.label}
                </div>
                {confirmKey === "b-"+t.id && (
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                    color:"var(--qn-orange)", letterSpacing:.3 }}>
                    Overwrites text — press {t.id} again to confirm
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SMARTFILL (Sequential Guided Mode) ──────────────────────────────────────
// One token at a time. Active token highlighted with context label.
// Keyboard: 1–N selects option · Tab/→ skips · Escape exits · Enter confirms text input

// Parse ___ blanks and option/option toggles from template text
// Returns array: { idx, raw, type:"blank"|"options"|"toggle", options?[], context? }
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

  // Pass 2 — find ___ blanks and word/word slash-toggles
  // Skip positions already covered by [or] tokens
  const orRanges = tokens.map(t => [t.idx, t.idx + t.raw.length]);
  const inOrRange = (idx) => orRanges.some(([s, e]) => idx >= s && idx < e);

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

function SmartFillBar({ value, onChange }) {
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

  const total   = tokens.length;
  const remaining = total - cursor;

  const replaceAndAdvance = (raw, replacement) => {
    onChange(value.replace(raw, replacement));
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
  const barColor    = tok.type === "toggle" ? "rgba(0,229,192,.25)"    : "rgba(245,200,66,.25)";
  const barBg       = tok.type === "toggle" ? "rgba(0,229,192,.06)"    : "rgba(245,200,66,.06)";
  const labelColor  = tok.type === "toggle" ? "var(--qn-teal)"         : "var(--qn-gold)";
  const optColor    = tok.type === "options" ? "var(--qn-gold)"        : "var(--qn-teal)";
  const optBd       = tok.type === "options" ? "rgba(245,200,66,.35)"  : "rgba(0,229,192,.3)";
  const optHoverBg  = tok.type === "options" ? "rgba(245,200,66,.18)"  : "rgba(0,229,192,.15)";

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

// ─── INPUT ZONE ───────────────────────────────────────────────────────────────
export function InputZone({ label, value, onChange, placeholder, rows, phase, ref: _ref, onRef, onKeyDown, copyable, templateType, smartfill, kbdHint, vitalsTrendLink }) {
  const inputRef = useRef();
  const [copiedField, setCopiedField] = useState(false);
  const [showPicker,  setShowPicker]  = useState(false);
  useEffect(() => { if (onRef) onRef(inputRef); }, []);
  const phaseClass = phase === 1 ? " active-phase" : phase === 2 ? " p2-active" : "";
  const handleCopy = () => {
    if (!value.trim()) return;
    navigator.clipboard.writeText(value.trim()).then(() => {
      setCopiedField(true);
      setTimeout(() => setCopiedField(false), 2000);
    });
  };
  const handleKeyDown = e => {
    if (templateType && e.ctrlKey && (e.key === "t" || e.key === "T") && !e.metaKey) {
      e.preventDefault(); setShowPicker(p => !p); return;
    }
    if (onKeyDown) onKeyDown(e);
  };
  return (
    <div style={{ position:"relative" }}>
      <div style={{ display:"flex", alignItems:"center", marginBottom:6 }}>
        <SectionLabel color={phase === 2 ? "var(--qn-blue)" : undefined}
          style={{ marginBottom:0, flex:1 }}>
          {label}
          {kbdHint && (
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:"rgba(107,158,200,.5)", background:"rgba(42,79,122,.2)",
              border:"1px solid rgba(42,79,122,.35)", borderRadius:4,
              padding:"1px 6px", marginLeft:7, letterSpacing:.5,
              verticalAlign:"middle" }}>
              {kbdHint}
            </span>
          )}
          {vitalsTrendLink && (
            <span onClick={vitalsTrendLink}
              style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:"var(--qn-teal)", background:"rgba(0,229,192,.08)",
                border:"1px solid rgba(0,229,192,.25)", borderRadius:4,
                padding:"1px 7px", marginLeft:7, letterSpacing:.5,
                cursor:"pointer", verticalAlign:"middle", transition:"all .15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,229,192,.18)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,229,192,.08)"; }}>
              📈 VitalsHub
            </span>
          )}
        </SectionLabel>
        <div style={{ display:"flex", gap:5 }}>
          {templateType && (
            <button onClick={() => setShowPicker(p => !p)}
              style={{ padding:"1px 8px", borderRadius:5, cursor:"pointer",
                fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
                border:`1px solid ${showPicker ? "rgba(0,229,192,.5)" : "rgba(42,79,122,.4)"}`,
                background:showPicker ? "rgba(0,229,192,.1)" : "rgba(14,37,68,.5)",
                color:showPicker ? "var(--qn-teal)" : "var(--qn-txt4)",
                letterSpacing:.5, textTransform:"uppercase", transition:"all .15s" }}>
              {templateType === "cc" ? "Ctrl+T · CC" : "Ctrl+T · Template"}
            </button>
          )}
          {copyable && value.trim() && (
            <button onClick={handleCopy}
              style={{ padding:"1px 8px", borderRadius:5, cursor:"pointer",
                fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
                border:`1px solid ${copiedField ? "rgba(61,255,160,.5)" : "rgba(42,79,122,.4)"}`,
                background:copiedField ? "rgba(61,255,160,.08)" : "rgba(14,37,68,.5)",
                color:copiedField ? "var(--qn-green)" : "var(--qn-txt4)",
                letterSpacing:.5, textTransform:"uppercase", transition:"all .15s" }}>
              {copiedField ? "✓" : "Copy"}
            </button>
          )}
        </div>
      </div>
      {showPicker && templateType === "cc" && (
        <CCPicker
          onInsert={text => { onChange(text); inputRef.current?.focus(); }}
          onClose={() => setShowPicker(false)}
        />
      )}
      {showPicker && templateType !== "cc" && (
        <TemplatePicker
          type={templateType}
          hasContent={Boolean(value.trim())}
          onInsert={text => { onChange(text); inputRef.current?.focus(); }}
          onClose={() => setShowPicker(false)}
        />
      )}
      {smartfill && <SmartFillBar value={value} onChange={onChange} />}
      <textarea
        ref={inputRef}
        className={`qn-ta${phaseClass}`}
        data-phase={phase || 1}
        rows={rows || 4}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}

// ─── HUB STRIP ────────────────────────────────────────────────────────────────
function HubStrip({ catId, label }) {
  const hubs = CC_HUB_MAP[catId];
  if (!hubs) return null;
  const all = [...(hubs.primary || []), ...(hubs.secondary || [])];
  return (
    <div style={{ marginTop:8, padding:"7px 10px", borderRadius:8,
      background:"rgba(8,22,40,.7)", border:"1px solid rgba(42,79,122,.35)" }}>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
        color:"var(--qn-txt4)", letterSpacing:1.2, textTransform:"uppercase",
        marginBottom:6 }}>
        {label || "Suggested Hubs"}
      </div>
      <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
        {all.map((h, i) => (
          <button key={i} onClick={() => { window.location.href = h.route; }}
            style={{ display:"inline-flex", alignItems:"center", gap:5,
              padding:"4px 10px", borderRadius:7, cursor:"pointer",
              fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600,
              border:`1px solid ${h.color}44`,
              background:`${h.color}0e`,
              color:h.color, transition:"all .15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = h.color + "20"; }}
            onMouseLeave={e => { e.currentTarget.style.background = h.color + "0e"; }}>
            <span style={{ fontSize:13 }}>{h.icon}</span>
            {h.label}
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              opacity:.5 }}>→</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── MEDICATIONS & ALLERGIES ZONE ────────────────────────────────────────────
export function MedsAllergyZone({
  medsRaw, setMedsRaw, allergiesRaw, setAllergiesRaw,
  parsedMeds, parsedAllergies, onParse, parsing, parseError,
  onEditMed, onRemoveMed, onEditAllergy, onRemoveAllergy,
}) {
  const [copiedTable, setCopiedTable] = useState(false);
  const [medsExpanded, setMedsExpanded] = useState(true);

  const copyMedsTable = () => {
    if (!parsedMeds.length && !parsedAllergies.length) return;
    const header = "MEDICATION\tDOSE\tROUTE\tFREQUENCY";
    const divider = "─".repeat(60);
    const rows = parsedMeds.map(m =>
      [m.name, m.dose, m.route, m.frequency].join("\t")
    );
    const allergyLine = parsedAllergies.length
      ? "\nALLERGIES: " + parsedAllergies.map(a => `${a.allergen} (${a.reaction})`).join(", ")
      : "";
    const text = [header, divider, ...rows, allergyLine].filter(Boolean).join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopiedTable(true);
      setTimeout(() => setCopiedTable(false), 2500);
    });
  };

  const hasParsed = parsedMeds.length > 0 || parsedAllergies.length > 0;
  const hasInput  = medsRaw.trim() || allergiesRaw.trim();

  return (
    <div style={{ marginBottom:12 }}>
      {/* Section header */}
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6,
        cursor:"pointer" }} onClick={() => setMedsExpanded(e => !e)}>
        <SectionLabel style={{ marginBottom:0, flex:1 }}>
          Medications &amp; Allergies
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:"rgba(107,158,200,.5)", background:"rgba(42,79,122,.2)",
            border:"1px solid rgba(42,79,122,.35)", borderRadius:4,
            padding:"1px 6px", marginLeft:7, letterSpacing:.5,
            verticalAlign:"middle" }}>Smart-Parse</span>
        </SectionLabel>
        {hasParsed && (
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:"var(--qn-green)", letterSpacing:.5 }}>
            {parsedMeds.length} meds · {parsedAllergies.length} allergies
          </span>
        )}
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
          color:"var(--qn-txt4)" }}>{medsExpanded ? "▲" : "▼"}</span>
      </div>

      {medsExpanded && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
          {/* Left: inputs */}
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            <div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:"var(--qn-txt4)", letterSpacing:1, textTransform:"uppercase",
                marginBottom:4 }}>Current Medications</div>
              <textarea value={medsRaw} onChange={e => setMedsRaw(e.target.value)}
                rows={5} placeholder={"metoprolol 25mg PO BID\nlisinopril 10mg daily\natorvastatin 40mg QHS\n\nor paste full med list…"}
                style={{ background:"rgba(14,37,68,.75)", border:"1px solid rgba(42,79,122,.5)",
                  borderRadius:10, padding:"8px 10px", color:"var(--qn-txt)",
                  fontFamily:"'JetBrains Mono',monospace", fontSize:10, outline:"none",
                  width:"100%", boxSizing:"border-box", resize:"vertical",
                  lineHeight:1.6, transition:"border-color .15s" }}
                onFocus={e => e.target.style.borderColor = "rgba(0,229,192,.5)"}
                onBlur={e  => e.target.style.borderColor = "rgba(42,79,122,.5)"} />
            </div>
            <div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:"var(--qn-txt4)", letterSpacing:1, textTransform:"uppercase",
                marginBottom:4 }}>Allergies</div>
              <textarea value={allergiesRaw} onChange={e => setAllergiesRaw(e.target.value)}
                rows={2} placeholder="Penicillin — anaphylaxis\nSulfa — rash"
                style={{ background:"rgba(14,37,68,.75)", border:"1px solid rgba(42,79,122,.5)",
                  borderRadius:10, padding:"8px 10px", color:"var(--qn-txt)",
                  fontFamily:"'JetBrains Mono',monospace", fontSize:10, outline:"none",
                  width:"100%", boxSizing:"border-box", resize:"vertical",
                  lineHeight:1.6, transition:"border-color .15s" }}
                onFocus={e => e.target.style.borderColor = "rgba(0,229,192,.5)"}
                onBlur={e  => e.target.style.borderColor = "rgba(42,79,122,.5)"} />
            </div>
            {hasInput && (
              <button onClick={onParse} disabled={parsing}
                style={{ padding:"6px 14px", borderRadius:7, cursor:"pointer",
                  fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
                  border:`1px solid ${parsing ? "rgba(42,79,122,.3)" : "rgba(0,229,192,.4)"}`,
                  background:parsing ? "rgba(14,37,68,.4)" : "rgba(0,229,192,.1)",
                  color:parsing ? "var(--qn-txt4)" : "var(--qn-teal)",
                  alignSelf:"flex-start", transition:"all .15s" }}>
                {parsing ? "Parsing…" : "✦ Smart-Parse"}
              </button>
            )}
            {parseError && (
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                color:"var(--qn-coral)" }}>{parseError}</div>
            )}
          </div>

          {/* Right: structured table */}
          <div>
            {hasParsed ? (
              <div>
                <div style={{ display:"flex", alignItems:"center", marginBottom:6 }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                    color:"var(--qn-teal)", letterSpacing:1, textTransform:"uppercase",
                    flex:1 }}>Structured Table</div>
                  <button onClick={copyMedsTable}
                    style={{ padding:"2px 9px", borderRadius:5, cursor:"pointer",
                      fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
                      border:`1px solid ${copiedTable ? "rgba(61,255,160,.5)" : "rgba(0,229,192,.35)"}`,
                      background:copiedTable ? "rgba(61,255,160,.1)" : "rgba(0,229,192,.07)",
                      color:copiedTable ? "var(--qn-green)" : "var(--qn-teal)",
                      letterSpacing:.4, transition:"all .15s" }}>
                    {copiedTable ? "✓ Copied" : "Copy Table"}
                  </button>
                </div>

                {/* Medications table */}
                {parsedMeds.length > 0 && (
                  <div style={{ marginBottom:8, border:"1px solid rgba(0,229,192,.2)",
                    borderRadius:8, overflow:"hidden" }}>
                    {/* Table header */}
                    <div style={{ display:"grid",
                      gridTemplateColumns:"1fr 70px 50px 80px 24px",
                      background:"rgba(0,229,192,.06)",
                      borderBottom:"1px solid rgba(0,229,192,.15)" }}>
                      {["Medication","Dose","Route","Frequency",""].map((h,i) => (
                        <div key={i} style={{ padding:"4px 8px",
                          fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                          fontWeight:700, color:"var(--qn-teal)", letterSpacing:1,
                          textTransform:"uppercase" }}>{h}</div>
                      ))}
                    </div>
                    {parsedMeds.map((med, i) => (
                      <div key={i} style={{ display:"grid",
                        gridTemplateColumns:"1fr 70px 50px 80px 24px",
                        borderBottom: i < parsedMeds.length-1 ? "1px solid rgba(42,79,122,.2)" : "none" }}>
                        {[med.name, med.dose, med.route, med.frequency].map((val, ci) => (
                          <div key={ci} contentEditable suppressContentEditableWarning
                            onBlur={e => onEditMed && onEditMed(i,
                              ["name","dose","route","frequency"][ci],
                              e.currentTarget.textContent)}
                            style={{ padding:"4px 8px",
                              fontFamily:"'JetBrains Mono',monospace",
                              fontSize:9, color: ci === 0 ? "var(--qn-txt)" : "var(--qn-txt3)",
                              outline:"none", cursor:"text",
                              background: ci === 0 ? "transparent" : "rgba(8,22,40,.4)" }}>
                            {val || "—"}
                          </div>
                        ))}
                        <div style={{ padding:"4px 4px", display:"flex",
                          alignItems:"center", justifyContent:"center" }}>
                          <button onClick={() => onRemoveMed && onRemoveMed(i)}
                            style={{ background:"transparent", border:"none",
                              cursor:"pointer", color:"var(--qn-txt4)", fontSize:12,
                              lineHeight:1, opacity:.5 }}>×</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Allergies */}
                {parsedAllergies.length > 0 && (
                  <div>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                      color:"var(--qn-coral)", letterSpacing:1, textTransform:"uppercase",
                      marginBottom:4 }}>Allergies</div>
                    <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
                      {parsedAllergies.map((a, i) => (
                        <div key={i} style={{ display:"flex", alignItems:"center",
                          gap:7, padding:"4px 8px", borderRadius:6,
                          background:"rgba(255,107,107,.06)",
                          border:"1px solid rgba(255,107,107,.2)" }}>
                          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                            fontWeight:600, color:"var(--qn-coral)", flex:1 }}>
                            {a.allergen}
                          </span>
                          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                            color:"var(--qn-txt4)" }}>{a.reaction}</span>
                          <button onClick={() => onRemoveAllergy && onRemoveAllergy(i)}
                            style={{ background:"transparent", border:"none",
                              cursor:"pointer", color:"var(--qn-txt4)", fontSize:12,
                              opacity:.5 }}>×</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ marginTop:6, fontFamily:"'JetBrains Mono',monospace",
                  fontSize:7, color:"rgba(107,158,200,.5)", lineHeight:1.5 }}>
                  Click any cell to edit · × to remove ·
                  Included in MDM and Full Note
                </div>
              </div>
            ) : (
              <div style={{ height:"100%", display:"flex", alignItems:"center",
                justifyContent:"center", border:"1px dashed rgba(42,79,122,.35)",
                borderRadius:10, padding:16 }}>
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:20, opacity:.3, marginBottom:6 }}>💊</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                    color:"var(--qn-txt4)" }}>
                    Paste med list → Smart-Parse
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MDM NARRATIVE CARD (editable) ───────────────────────────────────────────
function MDMNarrativeCard({ narrative, copiedMDM, setCopiedMDM, onEdit }) {
  const [editing,   setEditing]   = useState(false);
  const [draftText, setDraftText] = useState(narrative);
  const [saved,     setSaved]     = useState(false);

  // Sync if parent narrative changes (re-run MDM)
  const prevNarrative = useRef(narrative);
  useEffect(() => {
    if (narrative !== prevNarrative.current) {
      setDraftText(narrative);
      setEditing(false);
      prevNarrative.current = narrative;
    }
  }, [narrative]);

  // E key opens edit mode from anywhere on the page
  useEffect(() => {
    const fn = () => { if (!editing) { setDraftText(narrative); setEditing(true); } };
    window.addEventListener("qn-edit-narrative", fn);
    return () => window.removeEventListener("qn-edit-narrative", fn);
  }, [editing, narrative]);

  const handleSave = () => {
    if (onEdit) onEdit(draftText);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleCancel = () => {
    setDraftText(narrative);
    setEditing(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editing ? draftText : narrative);
    setCopiedMDM(true);
    setTimeout(() => setCopiedMDM(false), 2000);
  };

  return (
    <div className="qn-card" style={{ marginBottom:10 }}>
      <div style={{ display:"flex", alignItems:"center", marginBottom:6, gap:6 }}>
        <SectionLabel color="var(--qn-purple)" style={{ marginBottom:0 }}>
          MDM Narrative — Chart-Ready
        </SectionLabel>
        {saved && (
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:"var(--qn-green)", letterSpacing:.5 }}>✓ Saved</span>
        )}
        <div style={{ flex:1 }} />
        {!editing ? (
          <>
            <button onClick={() => { setDraftText(narrative); setEditing(true); }}
              style={{ padding:"2px 10px", borderRadius:6, cursor:"pointer",
                fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
                border:"1px solid rgba(155,109,255,.35)",
                background:"rgba(155,109,255,.08)", color:"var(--qn-purple)",
                letterSpacing:.5, textTransform:"uppercase", transition:"all .15s" }}>
              ✎ Edit
            </button>
            <button onClick={handleCopy}
              style={{ padding:"2px 10px", borderRadius:6, cursor:"pointer",
                fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
                border:`1px solid ${copiedMDM ? "rgba(61,255,160,.5)" : "rgba(155,109,255,.35)"}`,
                background:copiedMDM ? "rgba(61,255,160,.1)" : "rgba(155,109,255,.08)",
                color:copiedMDM ? "var(--qn-green)" : "var(--qn-purple)",
                letterSpacing:.5, textTransform:"uppercase", transition:"all .15s" }}>
              {copiedMDM ? "✓ Copied" : "Copy"}
            </button>
          </>
        ) : (
          <>
            <button onClick={handleSave}
              style={{ padding:"2px 10px", borderRadius:6, cursor:"pointer",
                fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
                border:"1px solid rgba(61,255,160,.5)",
                background:"rgba(61,255,160,.1)", color:"var(--qn-green)",
                letterSpacing:.5, textTransform:"uppercase" }}>
              ✓ Done
            </button>
            <button onClick={handleCancel}
              style={{ padding:"2px 10px", borderRadius:6, cursor:"pointer",
                fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
                border:"1px solid rgba(42,79,122,.4)",
                background:"transparent", color:"var(--qn-txt4)",
                letterSpacing:.5, textTransform:"uppercase" }}>
              Cancel
            </button>
          </>
        )}
      </div>

      {editing ? (
        <div>
          <textarea
            value={draftText}
            onChange={e => setDraftText(e.target.value)}
            rows={6}
            style={{ background:"rgba(14,37,68,.7)",
              border:"1px solid rgba(155,109,255,.45)",
              borderRadius:8, padding:"10px 12px",
              color:"var(--qn-txt)", fontFamily:"'DM Sans',sans-serif",
              fontSize:12, lineHeight:1.75, outline:"none",
              width:"100%", boxSizing:"border-box", resize:"vertical",
              transition:"border-color .15s" }}
            onFocus={e => e.target.style.borderColor = "rgba(155,109,255,.7)"}
            onBlur={e => e.target.style.borderColor = "rgba(155,109,255,.45)"}
            autoFocus
          />
          <div style={{ marginTop:5, fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:"var(--qn-txt4)", letterSpacing:.5 }}>
            Editing physician narrative · Changes update Copy MDM and Copy Full Note ·
            Re-run MDM resets to AI version
          </div>
        </div>
      ) : (
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
          color:"var(--qn-txt2)", lineHeight:1.75, whiteSpace:"pre-wrap" }}>
          {narrative}
        </div>
      )}
    </div>
  );
}


// ─── EXTRACTED TO SEPARATE FILES ────────────────────────────────────────────
import { DifferentialCard, QuickDDxCard, MDMResult } from "./QuickNoteMDM";
import { ClinicalCalcsCard } from "./QuickNoteCalcs";
export { DifferentialCard, QuickDDxCard, MDMResult, ClinicalCalcsCard };


// ─── EXTRACTED TO SEPARATE FILES ────────────────────────────────────────────
import { DiagnosisCodingCard, InterventionsCard, DispositionResult } from "./QuickNoteDisposition";
export { DiagnosisCodingCard, InterventionsCard, DispositionResult };