// QuickNotePickers.jsx
// CC picker, ROS/PE template picker, and hub strip
// Exported: CCPicker, TemplatePicker, HubStrip

import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { CC_CATEGORIES, CC_HUB_MAP } from "./QuickNoteData";
import { ROS_TEMPLATES, PE_TEMPLATES } from "./QuickNoteTemplates";

// ─── HUB STRIP ────────────────────────────────────────────────────────────────
export function HubStrip({ catId, label }) {
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

// ─── CC PICKER ────────────────────────────────────────────────────────────────
export function CCPicker({ onInsert, onClose }) {
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
export function TemplatePicker({ type, onInsert, onClose, hasContent }) {
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
                  if (e.key === "Tab") { e.preventDefault(); }
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