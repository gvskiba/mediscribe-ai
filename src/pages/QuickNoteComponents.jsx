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
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:4 }}>
            {userTpls
              .filter(t => !activeTag || parseTags(t.category).includes(activeTag))
              .map(t => (
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
  const re = /(___|(?<!\w)([a-z][a-z -]*)(?:\/[a-z][a-z -]*)+(?!\w))/gi;
  let m;
  while ((m = re.exec(text)) !== null) {
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
export function InputZone({ label, value, onChange, placeholder, rows, phase, ref: _ref, onRef, onKeyDown, copyable, templateType, smartfill, kbdHint }) {
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

// ─── MDM RESULT DISPLAY ───────────────────────────────────────────────────────
export function MDMResult({ result, copiedMDM, setCopiedMDM, onNarrativeEdit }) {
  if (!result) return null;
  const lc = mdmLevelColor(result.mdm_level);
  return (
    <div className="qn-fade">

      {/* Level badge */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12,
        padding:"11px 14px", borderRadius:10,
        background:`${lc}10`, border:`2px solid ${lc}44` }}>
        <div>
          <div className="qn-section-lbl" style={{ color:lc, marginBottom:2 }}>MDM Complexity</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
            fontSize:20, color:lc, letterSpacing:-.3 }}>
            {s(result.mdm_level) || "—"}
          </div>
        </div>
        <div style={{ width:1, height:36, background:`${lc}30`, flexShrink:0 }} />
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
            color:"var(--qn-txt4)", letterSpacing:1, marginBottom:3 }}>
            PROBLEM · DATA · RISK
          </div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
            color:"var(--qn-txt2)", lineHeight:1.5 }}>
            {[result.problem_complexity, result.data_complexity, result.risk_tier]
              .filter(Boolean).join("  ·  ")}
          </div>
        </div>
      </div>

      {/* Working Dx + Differential */}
      {(result.working_diagnosis || result.differential?.length > 0) && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
          {result.working_diagnosis && (
            <div className="qn-card">
              <SectionLabel>Working Diagnosis</SectionLabel>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
                fontSize:13, color:"var(--qn-txt)", lineHeight:1.45 }}>
                {s(result.working_diagnosis)}
              </div>
            </div>
          )}
          {result.differential?.length > 0 && (
            <div className="qn-card">
              <SectionLabel>Differential</SectionLabel>
              {result.differential.map((d, i) => (
                <div key={i} style={{ display:"flex", gap:6, alignItems:"flex-start", marginBottom:3 }}>
                  <span style={{ color:"var(--qn-txt4)", fontFamily:"'JetBrains Mono',monospace",
                    fontSize:9, marginTop:2, flexShrink:0 }}>{i + 1}.</span>
                  <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                    color:"var(--qn-txt2)" }}>{s(d)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Red flags */}
      {result.red_flags?.length > 0 && (
        <div style={{ padding:"9px 12px", borderRadius:9, marginBottom:10,
          background:"rgba(255,68,68,.08)", border:"1px solid rgba(255,68,68,.35)" }}>
          <SectionLabel color="var(--qn-red)">Red Flags Identified</SectionLabel>
          <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
            {result.red_flags.map((f, i) => (
              <span key={i} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                color:"var(--qn-coral)", background:"rgba(255,68,68,.1)",
                border:"1px solid rgba(255,68,68,.28)", borderRadius:6,
                padding:"2px 9px" }}>{f}</span>
            ))}
          </div>
        </div>
      )}

      {/* Critical actions */}
      {result.critical_actions?.length > 0 && (
        <div style={{ padding:"9px 12px", borderRadius:9, marginBottom:10,
          background:"rgba(0,229,192,.06)", border:"1px solid rgba(0,229,192,.28)" }}>
          <SectionLabel color="var(--qn-teal)">Critical Actions</SectionLabel>
          {result.critical_actions.map((a, i) => (
            <div key={i} style={{ display:"flex", gap:7, alignItems:"flex-start", marginBottom:4 }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                color:"var(--qn-teal)", flexShrink:0, minWidth:16 }}>{i + 1}.</span>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                color:"var(--qn-txt2)", lineHeight:1.5 }}>{s(a)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Treatment Recommendations — evidence-based in-ED treatments */}
      {result.treatment_recommendations?.length > 0 && (
        <div style={{ padding:"10px 12px", borderRadius:9, marginBottom:10,
          background:"rgba(8,22,40,.7)", border:"1px solid rgba(42,79,122,.45)" }}>
          <SectionLabel color="var(--qn-teal)">Treatment Recommendations</SectionLabel>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {result.treatment_recommendations.map((t, i) => {
              const evColor =
                t.evidence_level === "Class I"         ? "var(--qn-green)"  :
                t.evidence_level === "Class IIa"       ? "var(--qn-teal)"   :
                t.evidence_level === "Class IIb"       ? "var(--qn-gold)"   :
                t.evidence_level === "Class III"       ? "var(--qn-coral)"  :
                                                         "var(--qn-blue)";
              const evBg =
                t.evidence_level === "Class I"         ? "rgba(61,255,160,.08)"   :
                t.evidence_level === "Class IIa"       ? "rgba(0,229,192,.06)"    :
                t.evidence_level === "Class IIb"       ? "rgba(245,200,66,.07)"   :
                t.evidence_level === "Class III"       ? "rgba(255,107,107,.07)"  :
                                                         "rgba(59,158,255,.06)";
              const evBd =
                t.evidence_level === "Class I"         ? "rgba(61,255,160,.3)"    :
                t.evidence_level === "Class IIa"       ? "rgba(0,229,192,.28)"    :
                t.evidence_level === "Class IIb"       ? "rgba(245,200,66,.3)"    :
                t.evidence_level === "Class III"       ? "rgba(255,107,107,.3)"   :
                                                         "rgba(59,158,255,.28)";
              return (
                <div key={i} style={{ padding:"8px 10px", borderRadius:8,
                  background:evBg, border:`1px solid ${evBd}` }}>
                  <div style={{ display:"flex", alignItems:"center", gap:7,
                    flexWrap:"wrap", marginBottom:3 }}>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                      fontWeight:700, color:evColor,
                      background:`${evColor}18`, border:`1px solid ${evBd}`,
                      borderRadius:4, padding:"1px 7px", letterSpacing:.8,
                      textTransform:"uppercase", flexShrink:0 }}>
                      {s(t.evidence_level)}
                    </span>
                    <span style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700,
                      fontSize:12, color:"var(--qn-txt)", flex:1 }}>
                      {s(t.intervention)}
                    </span>
                  </div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                    color:"var(--qn-txt3)", lineHeight:1.5, marginBottom:t.guideline_ref || t.notes ? 4 : 0 }}>
                    {s(t.indication)}
                  </div>
                  {t.guideline_ref && (
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                      color:"var(--qn-blue)", letterSpacing:.3, marginBottom:t.notes ? 2 : 0 }}>
                      {s(t.guideline_ref)}
                    </div>
                  )}
                  {t.notes && (
                    <div style={{ display:"flex", gap:5, alignItems:"flex-start" }}>
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                        color:"var(--qn-gold)", flexShrink:0 }}>⚠</span>
                      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                        color:"var(--qn-gold)", lineHeight:1.5 }}>{s(t.notes)}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recommended Actions — this-visit tier */}
      {result.recommended_actions?.length > 0 && (
        <div style={{ padding:"9px 12px", borderRadius:9, marginBottom:10,
          background:"rgba(59,158,255,.06)", border:"1px solid rgba(59,158,255,.28)" }}>
          <SectionLabel color="var(--qn-blue)">Recommended Actions — This Visit</SectionLabel>
          {result.recommended_actions.map((a, i) => {
            // Defensive: if AI returns an object instead of a string, format it gracefully
            let text;
            if (typeof a === "string") {
              text = a;
            } else if (a && typeof a === "object") {
              // Extract meaningful fields in priority order
              const parts = [];
              const f = a;
              if (f.test_name || f.name)   parts.push(f.test_name || f.name);
              if (f.timing)                 parts.push("in " + f.timing);
              if (f.indication)             parts.push(f.indication);
              if (f.decision_threshold || f.threshold)
                parts.push("→ " + (f.decision_threshold || f.threshold));
              if (f.action)                 parts.push(f.action);
              if (f.recommendation)         parts.push(f.recommendation);
              text = parts.length ? parts.join(" — ") : JSON.stringify(a);
            } else {
              text = String(a);
            }
            return (
              <div key={i} style={{ display:"flex", gap:7, alignItems:"flex-start", marginBottom:4 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                  color:"var(--qn-blue)", flexShrink:0, minWidth:16 }}>{i + 1}.</span>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                  color:"var(--qn-txt2)", lineHeight:1.5 }}>{text}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* MDM Narrative */}
      {result.mdm_narrative && (
        <MDMNarrativeCard
          narrative={s(result.mdm_narrative)}
          copiedMDM={copiedMDM}
          setCopiedMDM={setCopiedMDM}
          onEdit={onNarrativeEdit}
        />
      )}

      {/* Data reviewed + Risk rationale */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
        {result.data_reviewed && (
          <div className="qn-card">
            <SectionLabel>Data Reviewed</SectionLabel>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
              color:"var(--qn-txt3)", lineHeight:1.6 }}>{s(result.data_reviewed)}</div>
          </div>
        )}
        {result.risk_rationale && (
          <div className="qn-card">
            <SectionLabel>Risk Rationale</SectionLabel>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
              color:"var(--qn-txt3)", lineHeight:1.6 }}>{s(result.risk_rationale)}</div>
          </div>
        )}
      </div>

      {result.acep_policy_ref && (
        <div style={{ padding:"7px 11px", borderRadius:8,
          background:"rgba(59,158,255,.07)", border:"1px solid rgba(59,158,255,.25)" }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
            color:"var(--qn-blue)", letterSpacing:1, textTransform:"uppercase" }}>
            ACEP Policy:{" "}
          </span>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
            color:"var(--qn-txt2)" }}>{s(result.acep_policy_ref)}</span>
        </div>
      )}

      {/* Related Hubs — derived from working diagnosis */}
      {(() => {
        const dx = (result.working_diagnosis || "").toLowerCase();
        const catId =
          /chest|cardiac|acs|mi|stemi|nstemi|angina|pe|embol|syncope|palpit|dvt|hemoptysis/.test(dx) ? "cardiac" :
          /abdom|appy|pancreat|bowel|obstruct|gall|biliary|bleed|gi|hepat|jaundice|diarrhea/.test(dx) ? "abdominal" :
          /stroke|tia|seizure|headache|ams|dement|psych|enceph|altered|vertigo|vision/.test(dx) ? "neuro" :
          /fracture|disloc|sprain|msk|ortho|back|spine|fall|trauma|wound|laceration/.test(dx) ? "msk" :
          /eye|ocular|ear|otitis|pharyngit|tonsil|epistaxis|dental|peritonsillar|facial/.test(dx) ? "ent" :
          /pregnan|ectopic|pelvic|ovarian|uterine|vaginal|cervical|scrotal|torsion|uti|renal/.test(dx) ? "obgyn" :
          /overdose|ingestion|toxic|poison|withdrawal|anaphylaxis|allergic|envenomation/.test(dx) ? "tox" :
          /cellulitis|abscess|rash|derm|hypoglyc|diabetic|dka|hyperglycemia|sepsis|fever|infect|pneumonia/.test(dx) ? "derm" : null;
        if (!catId) return null;
        return <HubStrip catId={catId} label="Related Hubs" />;
      })()}
    </div>
  );
}

// ─── DIAGNOSIS CODING CARD ────────────────────────────────────────────────────
const CODE_TYPE_COLOR = {
  primary:     "var(--qn-teal)",
  secondary:   "var(--qn-blue)",
  comorbidity: "var(--qn-purple)",
  symptom:     "var(--qn-gold)",
};

export function DiagnosisCodingCard({
  finalDiagnosis, suggestions, selected, searching, error,
  onSearch, onSelect, onRemove,
}) {
  const [searched, setSearched] = useState(false);

  const handleSearch = () => { setSearched(true); onSearch(); };

  return (
    <div style={{ marginBottom:14, padding:"14px 16px",
      background:"rgba(8,22,40,.5)", border:"1px solid rgba(0,229,192,.25)",
      borderRadius:14 }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:12 }}>
        <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
          fontSize:15, color:"var(--qn-teal)" }}>Final Diagnosis &amp; ICD-10</span>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:"var(--qn-txt4)", letterSpacing:1, textTransform:"uppercase",
          background:"rgba(0,229,192,.08)", border:"1px solid rgba(0,229,192,.2)",
          borderRadius:4, padding:"2px 7px" }}>Physician confirms</span>
        <div style={{ flex:1 }} />
        <button onClick={handleSearch} disabled={searching}
          style={{ padding:"5px 14px", borderRadius:7, cursor:"pointer",
            fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
            border:`1px solid ${searching ? "rgba(42,79,122,.3)" : "rgba(0,229,192,.4)"}`,
            background:searching ? "rgba(14,37,68,.4)" : "rgba(0,229,192,.1)",
            color:searching ? "var(--qn-txt4)" : "var(--qn-teal)",
            transition:"all .15s" }}>
          {searching ? "Searching…" : searched ? "↺ Re-search" : "🔍 Find ICD-10 Codes"}
        </button>
      </div>

      {/* Final diagnosis display */}
      {finalDiagnosis && (
        <div style={{ marginBottom:10, padding:"8px 12px", borderRadius:8,
          background:"rgba(0,229,192,.06)", border:"1px solid rgba(0,229,192,.2)" }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
            color:"var(--qn-teal)", letterSpacing:1, textTransform:"uppercase",
            marginBottom:3 }}>Diagnosis for coding</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
            fontSize:13, color:"var(--qn-txt)" }}>{s(finalDiagnosis)}</div>
        </div>
      )}

      {/* Selected codes */}
      {selected.length > 0 && (
        <div style={{ marginBottom:10 }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
            color:"var(--qn-txt4)", letterSpacing:1, textTransform:"uppercase",
            marginBottom:6 }}>Confirmed Codes</div>
          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
            {selected.map((c, i) => (
              <div key={c.code} style={{ display:"flex", alignItems:"center", gap:8,
                padding:"7px 10px", borderRadius:8,
                background:`${CODE_TYPE_COLOR[c.type] || "var(--qn-blue)"}10`,
                border:`1px solid ${CODE_TYPE_COLOR[c.type] || "var(--qn-blue)"}33` }}>
                {i === 0 && (
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                    color:"var(--qn-gold)", background:"rgba(245,200,66,.12)",
                    border:"1px solid rgba(245,200,66,.3)", borderRadius:3,
                    padding:"1px 5px", flexShrink:0 }}>PRIMARY</span>
                )}
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontWeight:700,
                  fontSize:12, color:CODE_TYPE_COLOR[c.type] || "var(--qn-blue)",
                  flexShrink:0 }}>{s(c.code)}</span>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
                  color:"var(--qn-txt2)", flex:1 }}>{s(c.description)}</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                  color:"var(--qn-txt4)", flexShrink:0, textTransform:"uppercase" }}>
                  {s(c.type)}
                </span>
                <button onClick={() => onRemove(c.code)}
                  style={{ background:"transparent", border:"none", cursor:"pointer",
                    color:"var(--qn-txt4)", fontSize:12, padding:"0 2px", flexShrink:0 }}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
            color:"var(--qn-txt4)", letterSpacing:1, textTransform:"uppercase",
            marginBottom:6 }}>Suggested Codes — Click to Add</div>
          <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
            {suggestions.map(c => {
              const alreadySelected = selected.find(s => s.code === c.code);
              const tc = CODE_TYPE_COLOR[c.type] || "var(--qn-blue)";
              return (
                <div key={c.code}
                  onClick={() => !alreadySelected && onSelect(c)}
                  style={{ display:"flex", alignItems:"flex-start", gap:9,
                    padding:"8px 10px", borderRadius:8, transition:"all .15s",
                    cursor:alreadySelected ? "default" : "pointer",
                    opacity:alreadySelected ? .45 : 1,
                    background:alreadySelected ? "rgba(42,79,122,.1)" : `${tc}08`,
                    border:`1px solid ${alreadySelected ? "rgba(42,79,122,.3)" : tc + "28"}` }}
                  onMouseEnter={e => { if (!alreadySelected) e.currentTarget.style.background = tc + "14"; }}
                  onMouseLeave={e => { if (!alreadySelected) e.currentTarget.style.background = tc + "08"; }}>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontWeight:700,
                    fontSize:12, color:tc, flexShrink:0, minWidth:56 }}>{s(c.code)}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
                      color:alreadySelected ? "var(--qn-txt4)" : "var(--qn-txt2)",
                      lineHeight:1.3, marginBottom:2 }}>{s(c.description)}</div>
                    {c.specificity_note && (
                      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                        color:"var(--qn-txt4)", letterSpacing:.3, lineHeight:1.4 }}>
                        {s(c.specificity_note)}
                      </div>
                    )}
                  </div>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                    color:tc, background:`${tc}14`, border:`1px solid ${tc}30`,
                    borderRadius:4, padding:"2px 6px", flexShrink:0,
                    textTransform:"uppercase" }}>{s(c.type)}</span>
                  {alreadySelected && (
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                      color:"var(--qn-green)", flexShrink:0 }}>✓</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {error && (
        <div style={{ marginTop:8, padding:"7px 10px", borderRadius:7,
          background:"rgba(255,107,107,.08)", border:"1px solid rgba(255,107,107,.3)",
          fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"var(--qn-coral)" }}>
          {error}
        </div>
      )}

      {!searching && !suggestions.length && !selected.length && (
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
          color:"var(--qn-txt4)", textAlign:"center", padding:"12px 0" }}>
          Click "Find ICD-10 Codes" to get AI-suggested codes for this diagnosis.
          Always verify and select — codes are never auto-applied.
        </div>
      )}
    </div>
  );
}

// ─── INTERVENTIONS CARD ───────────────────────────────────────────────────────
const INT_TYPE_CONFIG = {
  medication: { icon:"💊", color:"var(--qn-blue)",   label:"Medication" },
  procedure:  { icon:"🔧", color:"var(--qn-purple)", label:"Procedure"  },
  iv_access:  { icon:"💉", color:"var(--qn-teal)",   label:"IV Access"  },
  monitoring: { icon:"📈", color:"var(--qn-gold)",   label:"Monitoring" },
  imaging:    { icon:"🩻", color:"var(--qn-coral)",  label:"Imaging"    },
  lab:        { icon:"🧪", color:"var(--qn-green)",  label:"Lab"        },
  other:      { icon:"📋", color:"var(--qn-txt3)",   label:"Other"      },
};

function AddInterventionRow({ onAdd }) {
  const [type,    setType]    = useState("medication");
  const [name,    setName]    = useState("");
  const [dose,    setDose]    = useState("");
  const [show,    setShow]    = useState(false);

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({ type, name: name.trim(), dose_route: dose.trim(), time_given:"", response:"" });
    setName(""); setDose(""); setShow(false);
  };

  if (!show) return (
    <button onClick={() => setShow(true)}
      style={{ padding:"5px 12px", borderRadius:7, cursor:"pointer",
        fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
        border:"1px solid rgba(42,79,122,.4)", background:"rgba(14,37,68,.5)",
        color:"var(--qn-txt4)", transition:"all .15s", marginTop:4 }}>
      + Add Intervention
    </button>
  );

  return (
    <div style={{ display:"flex", gap:7, flexWrap:"wrap", alignItems:"center",
      padding:"8px 10px", borderRadius:8, marginTop:6,
      background:"rgba(14,37,68,.5)", border:"1px solid rgba(42,79,122,.4)" }}>
      <select value={type} onChange={e => setType(e.target.value)}
        style={{ padding:"4px 8px", borderRadius:6, background:"rgba(8,22,40,.8)",
          border:"1px solid rgba(42,79,122,.5)", color:"var(--qn-txt3)",
          fontFamily:"'DM Sans',sans-serif", fontSize:11, outline:"none" }}>
        {Object.entries(INT_TYPE_CONFIG).map(([k,v]) => (
          <option key={k} value={k}>{v.icon} {v.label}</option>
        ))}
      </select>
      <input value={name} onChange={e => setName(e.target.value)}
        placeholder="Intervention name"
        onKeyDown={e => e.key === "Enter" && handleAdd()}
        style={{ flex:"1 1 160px", padding:"4px 9px", borderRadius:6,
          background:"rgba(8,22,40,.8)", border:"1px solid rgba(42,79,122,.5)",
          color:"var(--qn-txt)", fontFamily:"'DM Sans',sans-serif", fontSize:11,
          outline:"none" }} />
      <input value={dose} onChange={e => setDose(e.target.value)}
        placeholder="Dose/route (optional)"
        onKeyDown={e => e.key === "Enter" && handleAdd()}
        style={{ flex:"1 1 120px", padding:"4px 9px", borderRadius:6,
          background:"rgba(8,22,40,.8)", border:"1px solid rgba(42,79,122,.5)",
          color:"var(--qn-txt3)", fontFamily:"'DM Sans',sans-serif", fontSize:11,
          outline:"none" }} />
      <button onClick={handleAdd}
        style={{ padding:"4px 12px", borderRadius:6, cursor:"pointer",
          fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:11,
          border:"1px solid rgba(0,229,192,.4)", background:"rgba(0,229,192,.1)",
          color:"var(--qn-teal)" }}>Add</button>
      <button onClick={() => setShow(false)}
        style={{ padding:"4px 8px", borderRadius:6, cursor:"pointer",
          fontFamily:"'DM Sans',sans-serif", fontSize:11,
          border:"1px solid rgba(42,79,122,.35)", background:"transparent",
          color:"var(--qn-txt4)" }}>Cancel</button>
    </div>
  );
}

export function InterventionsCard({ items, loading, generated, onGenerate, onToggle, onUpdate, onAdd, onRemove }) {
  const confirmed = items.filter(i => i.confirmed !== false).length;

  return (
    <div style={{ marginBottom:14, padding:"14px 16px",
      background:"rgba(8,22,40,.5)", border:"1px solid rgba(59,158,255,.25)",
      borderRadius:14 }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:12 }}>
        <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
          fontSize:15, color:"var(--qn-blue)" }}>ED Interventions</span>
        {generated && (
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:"var(--qn-txt4)", letterSpacing:.5 }}>
            {confirmed} of {items.length} confirmed
          </span>
        )}
        <div style={{ flex:1 }} />
        {!generated && (
          <button onClick={onGenerate} disabled={loading}
            style={{ padding:"5px 14px", borderRadius:7, cursor:"pointer",
              fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
              border:`1px solid ${loading ? "rgba(42,79,122,.3)" : "rgba(59,158,255,.4)"}`,
              background:loading ? "rgba(14,37,68,.4)" : "rgba(59,158,255,.1)",
              color:loading ? "var(--qn-txt4)" : "var(--qn-blue)",
              transition:"all .15s" }}>
            {loading ? "Generating…" : "✦ Generate Interventions"}
          </button>
        )}
        {generated && (
          <button onClick={onGenerate} disabled={loading}
            style={{ padding:"4px 10px", borderRadius:6, cursor:"pointer",
              fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              border:"1px solid rgba(42,79,122,.4)", background:"transparent",
              color:"var(--qn-txt4)" }}>↺ Regenerate</button>
        )}
      </div>

      {!generated && !loading && (
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
          color:"var(--qn-txt4)", textAlign:"center", padding:"12px 0" }}>
          Click to generate a pre-populated interventions list from the clinical documentation.
          Uncheck anything not actually performed.
        </div>
      )}

      {loading && (
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11,
          color:"var(--qn-txt4)", textAlign:"center", padding:"12px 0" }}>
          Generating interventions…
        </div>
      )}

      {generated && items.length > 0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
          {items.map(item => {
            const tc  = INT_TYPE_CONFIG[item.type] || INT_TYPE_CONFIG.other;
            const off = item.confirmed === false;
            return (
              <div key={item.id} style={{ display:"flex", alignItems:"flex-start",
                gap:8, padding:"7px 10px", borderRadius:8, transition:"all .15s",
                opacity: off ? .4 : 1,
                background: off ? "rgba(14,37,68,.3)" : `${tc.color}08`,
                border:`1px solid ${off ? "rgba(42,79,122,.2)" : tc.color + "28"}` }}>

                {/* Checkbox */}
                <div onClick={() => onToggle(item.id)}
                  style={{ width:16, height:16, borderRadius:4, flexShrink:0,
                    cursor:"pointer", marginTop:1,
                    background: off ? "rgba(14,37,68,.6)" : `${tc.color}20`,
                    border:`2px solid ${off ? "rgba(42,79,122,.4)" : tc.color}`,
                    display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {!off && <span style={{ fontSize:9, color:tc.color, lineHeight:1 }}>✓</span>}
                </div>

                {/* Icon + type */}
                <span style={{ fontSize:14, flexShrink:0 }}>{tc.icon}</span>

                {/* Content */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
                    fontSize:12, color: off ? "var(--qn-txt4)" : "var(--qn-txt)",
                    marginBottom:2 }}>
                    {s(item.name)}
                    {item.dose_route && (
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                        color:tc.color, marginLeft:7, fontWeight:400 }}>
                        {s(item.dose_route)}
                      </span>
                    )}
                  </div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {/* Time input */}
                    <input value={item.time_given || ""}
                      onChange={e => onUpdate(item.id, "time_given", e.target.value)}
                      placeholder="Time (e.g. 1430)"
                      style={{ padding:"2px 7px", borderRadius:5, width:110,
                        background:"rgba(8,22,40,.6)", border:"1px solid rgba(42,79,122,.4)",
                        color:"var(--qn-txt3)", fontFamily:"'JetBrains Mono',monospace",
                        fontSize:9, outline:"none" }} />
                    {/* Response input */}
                    <input value={item.response || ""}
                      onChange={e => onUpdate(item.id, "response", e.target.value)}
                      placeholder="Response / result"
                      style={{ padding:"2px 7px", borderRadius:5, flex:"1 1 140px",
                        background:"rgba(8,22,40,.6)", border:"1px solid rgba(42,79,122,.4)",
                        color:"var(--qn-txt3)", fontFamily:"'DM Sans',sans-serif",
                        fontSize:10, outline:"none" }} />
                  </div>
                </div>

                {/* Remove */}
                <button onClick={() => onRemove(item.id)}
                  style={{ background:"transparent", border:"none", cursor:"pointer",
                    color:"var(--qn-txt4)", fontSize:13, padding:"0 2px",
                    flexShrink:0, opacity:.5 }}>×</button>
              </div>
            );
          })}
        </div>
      )}

      <AddInterventionRow onAdd={onAdd} />
    </div>
  );
}

// ─── LAB FLAGS CARD ──────────────────────────────────────────────────────────
function labFlagColor(status) {
  const s = (status || "").toLowerCase();
  if (s === "critical")   return ["var(--qn-red)",    "rgba(255,68,68,.1)",   "rgba(255,68,68,.4)"];
  if (s === "high")       return ["var(--qn-coral)",  "rgba(255,107,107,.08)","rgba(255,107,107,.35)"];
  if (s === "low")        return ["var(--qn-blue)",   "rgba(59,158,255,.08)", "rgba(59,158,255,.35)"];
  if (s === "borderline") return ["var(--qn-gold)",   "rgba(245,200,66,.08)", "rgba(245,200,66,.3)"];
  return                         ["var(--qn-purple)", "rgba(155,109,255,.07)","rgba(155,109,255,.28)"];
}

function LabFlagsCard({ flags }) {
  if (!flags?.length) return null;
  return (
    <div style={{ padding:"10px 12px", borderRadius:10, marginBottom:10,
      background:"rgba(8,22,40,.7)", border:"1px solid rgba(42,79,122,.4)" }}>
      <SectionLabel color="var(--qn-gold)">Lab & Imaging Interpretation</SectionLabel>
      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {flags.map((f, i) => {
          const [c, bg, bd] = labFlagColor(f.status);
          return (
            <div key={i} style={{ padding:"8px 10px", borderRadius:8,
              background:bg, border:`1px solid ${bd}` }}>
              <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:4,
                flexWrap:"wrap" }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontWeight:700,
                  fontSize:11, color:c }}>{s(f.parameter)}</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11,
                  color:"var(--qn-txt)", fontWeight:600 }}>{s(f.value)}</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                  color:c, background:`${c}18`, border:`1px solid ${bd}`,
                  borderRadius:4, padding:"1px 7px", textTransform:"uppercase",
                  letterSpacing:.8, fontWeight:700 }}>{s(f.status)}</span>
                {f.guideline_citation && (
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                    color:"var(--qn-blue)", letterSpacing:.3, marginLeft:"auto" }}>
                    {s(f.guideline_citation)}
                  </span>
                )}
              </div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                color:"var(--qn-txt2)", lineHeight:1.5, marginBottom:f.recommendation ? 4 : 0 }}>
                {s(f.clinical_significance)}
              </div>
              {f.recommendation && (
                <div style={{ display:"flex", gap:6, alignItems:"flex-start" }}>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                    color:c, flexShrink:0, marginTop:1 }}>→</span>
                  <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                    fontWeight:600, color:c, lineHeight:1.5 }}>{s(f.recommendation)}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── DISPOSITION RESULT DISPLAY ───────────────────────────────────────────────
export function DispositionResult({ result, copiedDisch, setCopiedDisch }) {
  const [copiedReeval, setCopiedReeval] = useState(false);
  const [copiedPlan,   setCopiedPlan]   = useState(false);
  const [copiedOrders, setCopiedOrders] = useState(false);
  if (!result) return null;
  const copyWith = (text, setter) => {
    navigator.clipboard.writeText(text).then(() => {
      setter(true); setTimeout(() => setter(false), 2000);
    });
  };
  const dc = dispColor(result.disposition);
  const isAdmit = result.disposition?.toLowerCase().includes("admit") ||
                  result.disposition?.toLowerCase().includes("icu")   ||
                  result.disposition?.toLowerCase().includes("obs")   ||
                  result.disposition?.toLowerCase().includes("transfer");
  const di = result.discharge_instructions;

  return (
    <div className="qn-fade">

      {/* Disposition badge */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12,
        padding:"11px 14px", borderRadius:10,
        background:`${dc}10`, border:`2px solid ${dc}44` }}>
        <div>
          <div className="qn-section-lbl" style={{ color:dc, marginBottom:2 }}>Disposition</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
            fontSize:20, color:dc, letterSpacing:-.3 }}>
            {s(result.disposition) || "—"}
          </div>
        </div>
        {result.admission_service && (
          <>
            <div style={{ width:1, height:36, background:`${dc}30`, flexShrink:0 }} />
            <div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                color:"var(--qn-txt4)", letterSpacing:1, marginBottom:2 }}>SERVICE</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
                fontSize:13, color:"var(--qn-txt)" }}>{s(result.admission_service)}</div>
            </div>
          </>
        )}
        {result.treatment_response && (
          <>
            <div style={{ width:1, height:36, background:`${dc}30`, flexShrink:0 }} />
            <div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                color:"var(--qn-txt4)", letterSpacing:1, marginBottom:2 }}>RESPONSE</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
                fontSize:12, color:"var(--qn-txt2)" }}>{s(result.treatment_response)}</div>
            </div>
          </>
        )}
      </div>

      {/* Final Dx */}
      {result.final_diagnosis && (
        <div className="qn-card" style={{ marginBottom:10 }}>
          <SectionLabel color="var(--qn-teal)">Final Impression</SectionLabel>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
            fontSize:13, color:"var(--qn-txt)", lineHeight:1.5 }}>
            {s(result.final_diagnosis)}
          </div>
        </div>
      )}

      {/* Updated impression */}
      {result.updated_impression && (
        <div style={{ padding:"8px 12px", borderRadius:8, marginBottom:10,
          background:"rgba(0,229,192,.06)", border:"1px solid rgba(0,229,192,.2)",
          display:"flex", alignItems:"flex-start", gap:8 }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
            color:"var(--qn-teal)", letterSpacing:1, textTransform:"uppercase",
            flexShrink:0, marginTop:1 }}>Updated:</span>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
            color:"var(--qn-txt2)", lineHeight:1.6 }}>{s(result.updated_impression)}</span>
        </div>
      )}

      {/* Lab & Imaging Flags */}
      <LabFlagsCard flags={s(result.result_flags)} />

      {/* Reevaluation note — full width */}
      {result.reevaluation_note && (
        <div className="qn-card" style={{ marginBottom:10 }}>
          <div style={{ display:"flex", alignItems:"center", marginBottom:6 }}>
            <SectionLabel color="var(--qn-blue)" style={{ marginBottom:0, flex:1 }}>
              ED Reevaluation — Chart-Ready
            </SectionLabel>
            <button onClick={() => copyWith(result.reevaluation_note, setCopiedReeval)}
              style={{ padding:"2px 10px", borderRadius:6, cursor:"pointer",
                fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
                border:`1px solid ${copiedReeval ? "rgba(61,255,160,.5)" : "rgba(59,158,255,.35)"}`,
                background:copiedReeval ? "rgba(61,255,160,.1)" : "rgba(59,158,255,.08)",
                color:copiedReeval ? "var(--qn-green)" : "var(--qn-blue)",
                letterSpacing:.5, textTransform:"uppercase", transition:"all .15s" }}>
              {copiedReeval ? "✓ Copied" : "Copy"}
            </button>
          </div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
            color:"var(--qn-txt2)", lineHeight:1.75, whiteSpace:"pre-wrap" }}>
            {s(result.reevaluation_note)}
          </div>
        </div>
      )}

      {/* Plan — full width */}
      {result.plan_summary && (
        <div className="qn-card" style={{ marginBottom:10 }}>
          <div style={{ display:"flex", alignItems:"center", marginBottom:6 }}>
            <SectionLabel color="var(--qn-purple)" style={{ marginBottom:0, flex:1 }}>
              Plan — Chart-Ready
            </SectionLabel>
            <button onClick={() => copyWith(result.plan_summary, setCopiedPlan)}
              style={{ padding:"2px 10px", borderRadius:6, cursor:"pointer",
                fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
                border:`1px solid ${copiedPlan ? "rgba(61,255,160,.5)" : "rgba(155,109,255,.35)"}`,
                background:copiedPlan ? "rgba(61,255,160,.1)" : "rgba(155,109,255,.08)",
                color:copiedPlan ? "var(--qn-green)" : "var(--qn-purple)",
                letterSpacing:.5, textTransform:"uppercase", transition:"all .15s" }}>
              {copiedPlan ? "✓ Copied" : "Copy"}
            </button>
          </div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
            color:"var(--qn-txt2)", lineHeight:1.75, whiteSpace:"pre-wrap" }}>
            {s(result.plan_summary)}
          </div>
        </div>
      )}

      {/* Orders */}
      {result.orders?.length > 0 && (
        <div style={{ padding:"9px 12px", borderRadius:9, marginBottom:10,
          background:"rgba(0,229,192,.05)", border:"1px solid rgba(0,229,192,.25)" }}>
          <div style={{ display:"flex", alignItems:"center", marginBottom:6 }}>
            <SectionLabel color="var(--qn-teal)" style={{ marginBottom:0, flex:1 }}>Orders</SectionLabel>
            <button onClick={() => copyWith(result.orders.map(o => "- " + o).join("\n"), setCopiedOrders)}
              style={{ padding:"2px 10px", borderRadius:6, cursor:"pointer",
                fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
                border:`1px solid ${copiedOrders ? "rgba(61,255,160,.5)" : "rgba(0,229,192,.3)"}`,
                background:copiedOrders ? "rgba(61,255,160,.1)" : "rgba(0,229,192,.06)",
                color:copiedOrders ? "var(--qn-green)" : "var(--qn-teal)",
                letterSpacing:.5, textTransform:"uppercase", transition:"all .15s" }}>
              {copiedOrders ? "✓ Copied" : "Copy"}
            </button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"3px 16px" }}>
            {result.orders.map((o, i) => (
              <div key={i} style={{ display:"flex", gap:7, alignItems:"flex-start" }}>
                <span style={{ color:"var(--qn-teal)", fontFamily:"'JetBrains Mono',monospace",
                  fontSize:9, flexShrink:0, marginTop:2 }}>▸</span>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                  color:"var(--qn-txt2)", lineHeight:1.55 }}>{s(o)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Discharge instructions — only if truly discharged */}
      {!isAdmit && di && (
        <div style={{ padding:"12px 14px", borderRadius:12, marginTop:4,
          background:"rgba(61,255,160,.04)", border:"1px solid rgba(61,255,160,.25)" }}>
          <div style={{ display:"flex", alignItems:"center", marginBottom:8 }}>
            <SectionLabel color="var(--qn-green)" style={{ marginBottom:0 }}>Discharge Instructions</SectionLabel>
            <div style={{ flex:1 }} />
            <button onClick={() => {
              const lines = [];
              if (di.diagnosis_explanation) lines.push(di.diagnosis_explanation);
              if (di.medications?.length) { lines.push(""); lines.push("Medications:"); di.medications.forEach(m => lines.push("  - " + m)); }
              if (di.activity) lines.push("Activity: " + di.activity);
              if (di.diet)     lines.push("Diet: " + di.diet);
              if (di.return_precautions?.length) { lines.push(""); lines.push("Return to ED if:"); di.return_precautions.forEach(r => lines.push("  ! " + r)); }
              if (di.followup) lines.push("Follow-up: " + di.followup);
              navigator.clipboard.writeText(lines.join("\n"));
              setCopiedDisch(true);
              setTimeout(() => setCopiedDisch(false), 2000);
            }}
              style={{ padding:"2px 10px", borderRadius:6, cursor:"pointer",
                fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
                border:`1px solid ${copiedDisch ? "rgba(61,255,160,.7)" : "rgba(61,255,160,.35)"}`,
                background:copiedDisch ? "rgba(61,255,160,.2)" : "rgba(61,255,160,.08)",
                color:"var(--qn-green)",
                letterSpacing:.5, textTransform:"uppercase", transition:"all .15s" }}>
              {copiedDisch ? "✓ Copied" : "Copy"}
            </button>
          </div>

          {di.diagnosis_explanation && (
            <div style={{ marginBottom:10, padding:"8px 10px", borderRadius:8,
              background:"rgba(61,255,160,.05)", border:"1px solid rgba(61,255,160,.15)" }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                color:"var(--qn-green)", letterSpacing:.8, marginBottom:4 }}>
                WHAT YOU HAVE
              </div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
                color:"var(--qn-txt2)", lineHeight:1.7 }}>{s(di.diagnosis_explanation)}</div>
            </div>
          )}

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
            {di.medications?.length > 0 && (
              <div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                  color:"var(--qn-gold)", letterSpacing:.8, marginBottom:5 }}>MEDICATIONS</div>
                {di.medications.map((m, i) => (
                  <div key={i} style={{ display:"flex", gap:6, alignItems:"flex-start", marginBottom:4 }}>
                    <span style={{ color:"var(--qn-gold)", fontFamily:"'JetBrains Mono',monospace",
                      fontSize:9, flexShrink:0, marginTop:2 }}>▸</span>
                    <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                      color:"var(--qn-txt2)", lineHeight:1.5 }}>{s(m)}</span>
                  </div>
                ))}
              </div>
            )}
            <div>
              {di.activity && (
                <>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                    color:"var(--qn-txt4)", letterSpacing:.8, marginBottom:4 }}>ACTIVITY</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                    color:"var(--qn-txt2)", lineHeight:1.55, marginBottom:8 }}>{s(di.activity)}</div>
                </>
              )}
              {di.diet && (
                <>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                    color:"var(--qn-txt4)", letterSpacing:.8, marginBottom:4 }}>DIET</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                    color:"var(--qn-txt2)", lineHeight:1.55 }}>{s(di.diet)}</div>
                </>
              )}
            </div>
          </div>

          {di.return_precautions?.length > 0 && (
            <div style={{ padding:"9px 11px", borderRadius:9, marginBottom:10,
              background:"rgba(255,107,107,.07)", border:"1px solid rgba(255,107,107,.28)" }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                color:"var(--qn-coral)", letterSpacing:.8, marginBottom:6 }}>
                RETURN TO ED IF —
              </div>
              {di.return_precautions.map((rp, i) => (
                <div key={i} style={{ display:"flex", gap:7, alignItems:"flex-start", marginBottom:4 }}>
                  <span style={{ color:"var(--qn-coral)", fontFamily:"'JetBrains Mono',monospace",
                    fontSize:10, flexShrink:0, marginTop:1 }}>!</span>
                  <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                    color:"var(--qn-txt2)", lineHeight:1.5 }}>{s(rp)}</span>
                </div>
              ))}
            </div>
          )}

          {di.followup && (
            <div style={{ display:"flex", gap:8, alignItems:"flex-start",
              padding:"7px 10px", borderRadius:8,
              background:"rgba(59,158,255,.07)", border:"1px solid rgba(59,158,255,.25)" }}>
              <span style={{ fontSize:14, flexShrink:0 }}>📅</span>
              <div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                  color:"var(--qn-blue)", letterSpacing:.8, marginBottom:2 }}>FOLLOW-UP</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                  color:"var(--qn-txt2)", lineHeight:1.55 }}>{s(di.followup)}</div>
              </div>
            </div>
          )}

          {di.acep_policy_ref && (
            <div style={{ marginTop:8, padding:"5px 10px", borderRadius:7,
              background:"rgba(59,158,255,.06)", border:"1px solid rgba(59,158,255,.2)" }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                color:"var(--qn-blue)", letterSpacing:.8 }}>ACEP: </span>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                color:"var(--qn-txt3)" }}>{s(di.acep_policy_ref)}</span>
            </div>
          )}
        </div>
      )}

      {/* Disposition rationale — all dispositions */}
      {result.disposition_rationale && (
        <div className="qn-card" style={{ marginBottom:10 }}>
          <SectionLabel>Disposition Rationale</SectionLabel>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
            color:"var(--qn-txt2)", lineHeight:1.7 }}>{s(result.disposition_rationale)}</div>
        </div>
      )}
    </div>
  );
}