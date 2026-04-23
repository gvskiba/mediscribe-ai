// TemplateStudio.jsx
// Create, edit, and manage custom HPI, ROS, PE, and CC templates
// Saved templates appear in QuickNote Ctrl+T picker alongside built-ins

import { useState, useEffect, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";

// ─── STYLE INJECTION ─────────────────────────────────────────────────────────
(() => {
  if (document.getElementById("ts-css")) return;
  const s = document.createElement("style"); s.id = "ts-css";
  s.textContent = `
    :root {
      --ts-bg:#050f1e; --ts-card:#0b1e36;
      --ts-txt:#f2f7ff; --ts-txt2:#b8d4f0; --ts-txt3:#82aece; --ts-txt4:#6b9ec8;
      --ts-teal:#00e5c0; --ts-gold:#f5c842; --ts-coral:#ff6b6b;
      --ts-blue:#3b9eff; --ts-purple:#9b6dff; --ts-green:#3dffa0;
      --ts-red:#ff4444; --ts-bd:rgba(42,79,122,0.4);
    }
    @keyframes tsfade{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
    .ts-fade{animation:tsfade .18s ease both}
    .ts-ta{
      background:rgba(14,37,68,.75); border:1px solid rgba(42,79,122,.5);
      border-radius:10px; padding:10px 12px; color:var(--ts-txt);
      font-family:"JetBrains Mono",monospace; font-size:11px; outline:none;
      width:100%; box-sizing:border-box; resize:vertical;
      line-height:1.65; transition:border-color .15s;
    }
    .ts-ta:focus{border-color:rgba(0,229,192,.5); box-shadow:0 0 0 2px rgba(0,229,192,.08)}
    .ts-ta::placeholder{color:rgba(130,174,206,.35)}
    .ts-input{
      background:rgba(14,37,68,.75); border:1px solid rgba(42,79,122,.5);
      border-radius:8px; padding:8px 12px; color:var(--ts-txt);
      font-family:"DM Sans",sans-serif; font-size:12px; outline:none;
      width:100%; box-sizing:border-box; transition:border-color .15s;
    }
    .ts-input:focus{border-color:rgba(0,229,192,.5)}
    .ts-input::placeholder{color:rgba(130,174,206,.35)}
    .ts-btn{
      padding:8px 18px; border-radius:8px; cursor:pointer; font-weight:700;
      font-family:"DM Sans",sans-serif; font-size:12px; transition:all .15s;
      display:inline-flex; align-items:center; gap:6px;
    }
    .ts-btn:disabled{opacity:.45; cursor:not-allowed}
  `;
  document.head.appendChild(s);
  if (!document.getElementById("ts-fonts")) {
    const l = document.createElement("link"); l.id = "ts-fonts"; l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
    document.head.appendChild(l);
  }
})();

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const TYPES = [
  { id:"ros", label:"Review of Systems",  color:"var(--ts-teal)",   colorRaw:"#00e5c0" },
  { id:"pe",  label:"Physical Exam",      color:"var(--ts-purple)", colorRaw:"#9b6dff" },
  { id:"hpi", label:"HPI",                color:"var(--ts-blue)",   colorRaw:"#3b9eff" },
  { id:"cc",  label:"Chief Complaint",    color:"var(--ts-gold)",   colorRaw:"#f5c842" },
];
const TYPE_MAP = Object.fromEntries(TYPES.map(t => [t.id, t]));

const BLANK_HELPERS = [
  { label:"Blank ___",       insert:"___" },
  { label:"yes/no",          insert:"yes/no" },
  { label:"L/R",             insert:"L/R" },
  { label:"mild/moderate/severe", insert:"mild/moderate/severe" },
  { label:"present/absent",  insert:"present/absent" },
  { label:"positive/negative", insert:"positive/negative" },
];

const PLACEHOLDER_BY_TYPE = {
  ros: "Constitutional: Denies fever, chills, diaphoresis.\nCardiovascular: ___\nRespiratory: Denies dyspnea, cough.\n...",
  pe:  "General: Alert, oriented x3, no acute distress.\nVitals: As documented.\nCV: RRR, no murmurs.\n...",
  hpi: "___ yo ___ presenting with ___ for ___.\nOnset: ___, character: ___, severity: ___/10.\nModifying factors: ___\nAssociated symptoms: ___",
  cc:  "___ — onset: ___, character: ___, severity: ___/10",
};

// ─── TAG HELPERS ─────────────────────────────────────────────────────────────
// Tags stored as comma-separated string in category field — backwards compatible
const parseTags  = (str) => (str || "").split(",").map(t => t.trim()).filter(Boolean);
const serializeTags = (arr) => arr.join(", ");

const AUTO_TAG_SUGGESTIONS = [
  "cardiac", "pulm", "neuro", "abdominal", "msk", "trauma",
  "sepsis", "peds", "tox", "ob-gyn", "psych", "ent", "derm",
  "chest-pain", "stroke", "ams", "normal", "shift-handoff",
];

// ─── TAG CHIP INPUT ───────────────────────────────────────────────────────────
function TagChipInput({ tags, onChange, existingTags }) {
  const [inputVal, setInputVal] = useState("");
  const [showSugg, setShowSugg] = useState(false);
  const inputRef = useRef();

  const allSuggestions = [
    ...new Set([...AUTO_TAG_SUGGESTIONS, ...existingTags]),
  ].filter(s => !tags.includes(s));

  const filtered = inputVal.trim()
    ? allSuggestions.filter(s => s.includes(inputVal.toLowerCase()))
    : allSuggestions.slice(0, 12);

  const addTag = (tag) => {
    const t = tag.trim().toLowerCase().replace(/\s+/g, "-");
    if (!t || tags.includes(t) || tags.length >= 3) return;
    onChange([...tags, t]);
    setInputVal("");
    setShowSugg(false);
    inputRef.current?.focus();
  };

  const removeTag = (tag) => onChange(tags.filter(t => t !== tag));

  const handleKey = (e) => {
    if ((e.key === "Enter" || e.key === ",") && inputVal.trim()) {
      e.preventDefault(); addTag(inputVal);
    }
    if (e.key === "Backspace" && !inputVal && tags.length) {
      removeTag(tags[tags.length - 1]);
    }
    if (e.key === "Escape") setShowSugg(false);
  };

  return (
    <div style={{ position:"relative" }}>
      <div style={{ display:"flex", flexWrap:"wrap", gap:5, alignItems:"center",
        background:"rgba(14,37,68,.75)", border:"1px solid rgba(42,79,122,.5)",
        borderRadius:8, padding:"6px 10px", minHeight:36, cursor:"text" }}
        onClick={() => inputRef.current?.focus()}>
        {tags.map(tag => (
          <span key={tag} style={{ display:"inline-flex", alignItems:"center", gap:4,
            fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:600,
            color:"var(--ts-teal)", background:"rgba(0,229,192,.1)",
            border:"1px solid rgba(0,229,192,.3)", borderRadius:20,
            padding:"2px 8px", letterSpacing:.3 }}>
            {tag}
            <span onClick={e => { e.stopPropagation(); removeTag(tag); }}
              style={{ cursor:"pointer", opacity:.7, fontSize:10, lineHeight:1 }}>×</span>
          </span>
        ))}
        {tags.length < 3 && (
          <input ref={inputRef} value={inputVal}
            onChange={e => { setInputVal(e.target.value); setShowSugg(true); }}
            onKeyDown={handleKey}
            onFocus={() => setShowSugg(true)}
            onBlur={() => setTimeout(() => setShowSugg(false), 150)}
            placeholder={tags.length === 0 ? "Add tags (max 3)…" : ""}
            style={{ background:"transparent", border:"none", outline:"none",
              fontFamily:"'JetBrains Mono',monospace", fontSize:10,
              color:"var(--ts-txt)", flex:1, minWidth:80 }} />
        )}
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color: tags.length >= 3 ? "var(--ts-coral)" : "var(--ts-txt4)",
          marginLeft:"auto", flexShrink:0 }}>
          {tags.length}/3
        </span>
      </div>
      {showSugg && filtered.length > 0 && (
        <div style={{ position:"absolute", top:"calc(100% + 3px)", left:0, right:0,
          zIndex:50, background:"rgba(8,22,40,.97)",
          border:"1px solid rgba(42,79,122,.5)", borderRadius:8,
          padding:"6px", boxShadow:"0 8px 24px rgba(0,0,0,.5)",
          display:"flex", flexWrap:"wrap", gap:4 }}>
          {filtered.map(s => (
            <button key={s} onMouseDown={() => addTag(s)}
              style={{ padding:"2px 9px", borderRadius:20, cursor:"pointer",
                fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                border:"1px solid rgba(42,79,122,.4)", background:"rgba(14,37,68,.7)",
                color:"var(--ts-txt3)", transition:"all .1s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(0,229,192,.4)"; e.currentTarget.style.color = "var(--ts-teal)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(42,79,122,.4)"; e.currentTarget.style.color = "var(--ts-txt3)"; }}>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
function TemplateCard({ tpl, onEdit, onDelete }) {
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const [expanded,   setExpanded]   = useState(false);
  const typeInfo = TYPE_MAP[tpl.type] || TYPE_MAP.ros;

  const handleDelete = async () => {
    if (!confirmDel) { setConfirmDel(true); return; }
    setDeleting(true);
    try {
      await base44.entities.NoteTemplate.delete(tpl.id);
      onDelete(tpl.id);
    } catch { setDeleting(false); setConfirmDel(false); }
  };

  return (
    <div className="ts-fade" style={{
      background:"rgba(8,22,40,.65)", border:`1px solid ${typeInfo.colorRaw}28`,
      borderRadius:12, overflow:"hidden", transition:"border-color .15s",
    }}>
      <div style={{ padding:"12px 14px", cursor:"pointer" }}
        onClick={() => setExpanded(e => !e)}>
        <div style={{ display:"flex", alignItems:"center", gap:9, flexWrap:"wrap" }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            fontWeight:700, color:typeInfo.color,
            background:`${typeInfo.colorRaw}14`, border:`1px solid ${typeInfo.colorRaw}33`,
            borderRadius:4, padding:"2px 8px", letterSpacing:.8,
            textTransform:"uppercase", flexShrink:0 }}>
            {typeInfo.label}
          </span>
          {tpl.is_default && (
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:"var(--ts-gold)", background:"rgba(245,200,66,.1)",
              border:"1px solid rgba(245,200,66,.3)", borderRadius:4,
              padding:"2px 7px", letterSpacing:.5 }}>★ Default</span>
          )}
          <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
            fontSize:14, color:"var(--ts-txt)", flex:1 }}>{tpl.name}</span>
          {parseTags(tpl.category).map(tag => (
            <span key={tag} style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:"var(--ts-teal)", background:"rgba(0,229,192,.08)",
              border:"1px solid rgba(0,229,192,.25)",
              borderRadius:20, padding:"2px 8px", letterSpacing:.3 }}>{tag}</span>
          ))}
          {tpl.created_by && (
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:"var(--ts-txt4)" }}>{tpl.created_by}</span>
          )}
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
            color:"var(--ts-txt4)" }}>{expanded ? "▲" : "▼"}</span>
        </div>
        {!expanded && (
          <div style={{ marginTop:5, fontFamily:"'JetBrains Mono',monospace",
            fontSize:9, color:"var(--ts-txt4)", lineHeight:1.4,
            overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis",
            maxWidth:"100%" }}>
            {(tpl.text || "").split("\n")[0].slice(0, 120)}
          </div>
        )}
      </div>

      {expanded && (
        <div style={{ borderTop:"1px solid rgba(42,79,122,.3)", padding:"12px 14px" }}>
          <pre style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
            color:"var(--ts-txt3)", lineHeight:1.7, whiteSpace:"pre-wrap",
            wordBreak:"break-word", background:"rgba(14,37,68,.5)",
            border:"1px solid rgba(42,79,122,.3)", borderRadius:8,
            padding:"10px 12px", margin:"0 0 12px", maxHeight:240, overflowY:"auto" }}>
            {tpl.text}
          </pre>
          <div style={{ display:"flex", gap:7 }}>
            <button className="ts-btn" onClick={() => onEdit(tpl)}
              style={{ border:"1px solid rgba(0,229,192,.35)",
                background:"rgba(0,229,192,.08)", color:"var(--ts-teal)" }}>
              ✎ Edit
            </button>
            {!confirmDel ? (
              <button className="ts-btn" onClick={() => setConfirmDel(true)}
                style={{ border:"1px solid rgba(255,107,107,.3)",
                  background:"transparent", color:"var(--ts-coral)" }}>
                Delete
              </button>
            ) : (
              <div style={{ display:"flex", alignItems:"center", gap:6,
                padding:"4px 10px", borderRadius:8,
                background:"rgba(255,68,68,.08)", border:"1px solid rgba(255,68,68,.35)" }}>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                  color:"var(--ts-coral)" }}>Delete this template?</span>
                <button className="ts-btn" onClick={handleDelete} disabled={deleting}
                  style={{ border:"1px solid rgba(255,68,68,.5)",
                    background:"rgba(255,68,68,.2)", color:"var(--ts-red)",
                    padding:"4px 10px" }}>
                  {deleting ? "…" : "Yes"}
                </button>
                <button className="ts-btn" onClick={() => setConfirmDel(false)}
                  style={{ border:"1px solid rgba(42,79,122,.4)",
                    background:"transparent", color:"var(--ts-txt4)", padding:"4px 10px" }}>
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── EDITOR ───────────────────────────────────────────────────────────────────
function TemplateEditor({ initial, onSave, onCancel, existingTags = [] }) {
  const [name,       setName]       = useState(initial?.name || "");
  const [type,       setType]       = useState(initial?.type || "ros");
  const [text,       setText]       = useState(initial?.text || "");
  const [tags,       setTags]       = useState(parseTags(initial?.category || ""));
  const [shortLabel, setShortLabel] = useState(initial?.short || "");
  const [isDefault,  setIsDefault]  = useState(initial?.is_default || false);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState(null);
  const textareaRef = useRef();

  const insertAtCursor = (str) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    const before = text.slice(0, start);
    const after  = text.slice(end);
    const newText = before + str + after;
    setText(newText);
    setTimeout(() => {
      ta.selectionStart = ta.selectionEnd = start + str.length;
      ta.focus();
    }, 0);
  };

  const handleSave = async () => {
    if (!name.trim()) { setError("Template name is required."); return; }
    if (!text.trim()) { setError("Template text is required."); return; }
    if (text.split("\n").length > 60) {
      setError("Template is too long — keep under 60 lines for best results."); return;
    }
    setSaving(true); setError(null);
    try {
      const user = await base44.auth.me().catch(() => null);
      const payload = {
        name: name.trim(),
        type,
        text: text.trim(),
        category: serializeTags(tags),
        short: shortLabel.trim() || name.trim().slice(0, 12),
        is_default: isDefault,
        created_by: user?.full_name || user?.email || "",
      };
      let saved;
      if (initial?.id) {
        saved = await base44.entities.NoteTemplate.update(initial.id, payload);
      } else {
        saved = await base44.entities.NoteTemplate.create(payload);
      }
      onSave(saved);
    } catch (e) {
      setError("Save failed: " + (e.message || "unknown error"));
      setSaving(false);
    }
  };

  const typeInfo = TYPE_MAP[type];
  const lineCount = text.split("\n").length;
  const charCount = text.length;

  return (
    <div style={{ background:"rgba(8,22,40,.8)",
      border:`2px solid ${typeInfo.colorRaw}44`,
      borderRadius:14, padding:"20px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
        <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
          fontSize:16, color:typeInfo.color }}>
          {initial?.id ? "Edit Template" : "New Template"}
        </span>
        <div style={{ flex:1 }} />
        <button className="ts-btn" onClick={onCancel}
          style={{ border:"1px solid rgba(42,79,122,.4)",
            background:"transparent", color:"var(--ts-txt4)", padding:"5px 12px" }}>
          Cancel
        </button>
      </div>

      {/* Type selector */}
      <div style={{ marginBottom:14 }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
          color:"var(--ts-txt4)", letterSpacing:1.2, marginBottom:6,
          textTransform:"uppercase" }}>Template Type</div>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {TYPES.map(t => (
            <button key={t.id} onClick={() => setType(t.id)}
              style={{ padding:"6px 14px", borderRadius:7, cursor:"pointer",
                fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:12,
                transition:"all .15s",
                border:`1px solid ${type === t.id ? t.colorRaw + "66" : "rgba(42,79,122,.4)"}`,
                background:type === t.id ? t.colorRaw + "14" : "transparent",
                color:type === t.id ? t.color : "var(--ts-txt3)" }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Name + Short label row */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:10, marginBottom:12 }}>
        <div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
            color:"var(--ts-txt4)", letterSpacing:1.2, marginBottom:5,
            textTransform:"uppercase" }}>Template Name *</div>
          <input className="ts-input" value={name} onChange={e => setName(e.target.value)}
            placeholder={`e.g. My ${typeInfo.label} — Chest Pain`} />
        </div>
        <div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
            color:"var(--ts-txt4)", letterSpacing:1.2, marginBottom:5,
            textTransform:"uppercase" }}>Short Label</div>
          <input className="ts-input" value={shortLabel} onChange={e => setShortLabel(e.target.value)}
            placeholder="e.g. My CP" style={{ width:100 }} />
        </div>
      </div>

      {/* Tags */}
      <div style={{ marginBottom:12 }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
          color:"var(--ts-txt4)", letterSpacing:1.2, marginBottom:5,
          textTransform:"uppercase" }}>Tags <span style={{ color:"rgba(107,158,200,.5)" }}>(max 3 · Enter or comma to add)</span></div>
        <TagChipInput tags={tags} onChange={setTags} existingTags={existingTags} />
      </div>

      {/* Text editor */}
      <div style={{ marginBottom:8 }}>
        <div style={{ display:"flex", alignItems:"center", marginBottom:6 }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
            color:"var(--ts-txt4)", letterSpacing:1.2, textTransform:"uppercase",
            flex:1 }}>Template Text *</div>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color: lineCount > 50 ? "var(--ts-coral)" : "var(--ts-txt4)" }}>
            {lineCount} lines · {charCount} chars
          </span>
        </div>

        {/* Blank helpers toolbar */}
        <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:6 }}>
          {BLANK_HELPERS.map((h, i) => (
            <button key={i} onClick={() => insertAtCursor(h.insert)}
              style={{ padding:"2px 9px", borderRadius:5, cursor:"pointer",
                fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
                border:"1px solid rgba(42,79,122,.4)", background:"rgba(14,37,68,.6)",
                color:"var(--ts-txt3)", transition:"all .12s",
                letterSpacing:.3 }}>
              + {h.label}
            </button>
          ))}
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:"var(--ts-txt4)", alignSelf:"center", marginLeft:4 }}>
            Click to insert at cursor
          </span>
        </div>

        <textarea ref={textareaRef} className="ts-ta"
          value={text} onChange={e => setText(e.target.value)}
          rows={12}
          placeholder={PLACEHOLDER_BY_TYPE[type]} />
      </div>

      {/* Preview */}
      {text.trim() && (
        <div style={{ marginBottom:14, padding:"10px 12px", borderRadius:8,
          background:"rgba(14,37,68,.5)", border:`1px solid ${typeInfo.colorRaw}20` }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:"var(--ts-txt4)", letterSpacing:1, textTransform:"uppercase",
            marginBottom:6 }}>Preview — How it appears when inserted</div>
          <pre style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
            color:"var(--ts-txt3)", lineHeight:1.65, whiteSpace:"pre-wrap",
            margin:0, maxHeight:160, overflowY:"auto" }}>{text}</pre>
        </div>
      )}

      {/* Options */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
        <label style={{ display:"flex", alignItems:"center", gap:7, cursor:"pointer" }}>
          <div onClick={() => setIsDefault(p => !p)}
            style={{ width:18, height:18, borderRadius:4, cursor:"pointer",
              background: isDefault ? typeInfo.colorRaw + "30" : "rgba(14,37,68,.6)",
              border:`2px solid ${isDefault ? typeInfo.colorRaw : "rgba(42,79,122,.5)"}`,
              display:"flex", alignItems:"center", justifyContent:"center",
              transition:"all .15s" }}>
            {isDefault && <span style={{ fontSize:10, color:typeInfo.color }}>✓</span>}
          </div>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
            color:"var(--ts-txt3)" }}>Show first in picker (default template)</span>
        </label>
      </div>

      {error && (
        <div style={{ marginBottom:12, padding:"8px 11px", borderRadius:8,
          background:"rgba(255,107,107,.08)", border:"1px solid rgba(255,107,107,.3)",
          fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"var(--ts-coral)" }}>
          {error}
        </div>
      )}

      <div style={{ display:"flex", gap:8 }}>
        <button className="ts-btn" onClick={handleSave} disabled={saving}
          style={{ border:`1px solid ${typeInfo.colorRaw}55`,
            background:`${typeInfo.colorRaw}14`, color:typeInfo.color }}>
          {saving ? "Saving…" : initial?.id ? "Save Changes" : "Create Template"}
        </button>
        <button className="ts-btn" onClick={onCancel}
          style={{ border:"1px solid rgba(42,79,122,.4)",
            background:"transparent", color:"var(--ts-txt4)" }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function TemplateStudio() {
  const [templates,   setTemplates]  = useState([]);
  const [loading,     setLoading]    = useState(true);
  const [error,       setError]      = useState(null);
  const [editing,     setEditing]    = useState(null);   // null | "new" | template object
  const [filterType,  setFilterType] = useState("all");
  const [filterTag,   setFilterTag]  = useState(null);

  // Derive all unique tags across saved templates for suggestions + filter chips
  const allTags = [...new Set(
    templates.flatMap(t => parseTags(t.category))
  )].sort();

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const result = await base44.entities.NoteTemplate.list({ sort:"-created_date", limit:200 });
      setTemplates(result || []);
    } catch (e) {
      setError("Failed to load templates: " + (e.message || "unknown error"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSaved = (saved) => {
    setTemplates(prev => {
      const exists = prev.find(t => t.id === saved.id);
      return exists
        ? prev.map(t => t.id === saved.id ? saved : t)
        : [saved, ...prev];
    });
    setEditing(null);
  };

  const handleDelete = (id) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  const filtered = templates
    .filter(t => filterType === "all" || t.type === filterType)
    .filter(t => !filterTag || parseTags(t.category).includes(filterTag));

  const countByType = Object.fromEntries(
    TYPES.map(t => [t.id, templates.filter(x => x.type === t.id).length])
  );

  return (
    <div style={{ minHeight:"100vh", background:"var(--ts-bg)",
      fontFamily:"'DM Sans',sans-serif", color:"var(--ts-txt)",
      padding:"24px 20px 60px" }}>
      <div style={{ maxWidth:900, margin:"0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom:22 }}>
          <button onClick={() => window.history.back()}
            style={{ marginBottom:12, display:"inline-flex", alignItems:"center", gap:7,
              fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600,
              background:"rgba(14,37,68,.7)", border:"1px solid rgba(42,79,122,.5)",
              borderRadius:8, padding:"5px 14px", color:"var(--ts-txt3)", cursor:"pointer" }}>
            ← Back
          </button>
          <div style={{ display:"flex", alignItems:"flex-start",
            gap:14, flexWrap:"wrap" }}>
            <div>
              <h1 style={{ fontFamily:"'Playfair Display',serif", fontWeight:900,
                fontSize:"clamp(22px,4vw,34px)", letterSpacing:-.5,
                margin:"0 0 4px", color:"var(--ts-txt)" }}>
                Template Studio
              </h1>
              <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
                color:"var(--ts-txt4)", margin:0, lineHeight:1.6 }}>
                Create custom HPI, ROS, PE, and CC templates ·
                Appears in QuickNote Ctrl+T picker under "My Templates"
              </p>
            </div>
            <div style={{ marginLeft:"auto" }}>
              <button className="ts-btn" onClick={() => setEditing("new")}
                style={{ border:"1px solid rgba(0,229,192,.45)",
                  background:"rgba(0,229,192,.12)", color:"var(--ts-teal)",
                  fontSize:13 }}>
                + New Template
              </button>
            </div>
          </div>
        </div>

        {/* Editor — shown when creating/editing */}
        {editing && (
          <div style={{ marginBottom:20 }}>
            <TemplateEditor
              initial={editing === "new" ? null : editing}
              onSave={handleSaved}
              onCancel={() => setEditing(null)}
              existingTags={allTags}
            />
          </div>
        )}

        {/* Filter tabs */}
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center",
          padding:"10px 14px", borderRadius:10, marginBottom:16,
          background:"rgba(8,22,40,.6)", border:"1px solid rgba(42,79,122,.3)" }}>
          <button onClick={() => setFilterType("all")}
            style={{ padding:"5px 12px", borderRadius:20, cursor:"pointer",
              fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600,
              border:`1px solid ${filterType === "all" ? "rgba(0,229,192,.45)" : "rgba(42,79,122,.4)"}`,
              background:filterType === "all" ? "rgba(0,229,192,.12)" : "transparent",
              color:filterType === "all" ? "var(--ts-teal)" : "var(--ts-txt3)" }}>
            All ({templates.length})
          </button>
          {TYPES.map(t => (
            <button key={t.id} onClick={() => setFilterType(t.id)}
              style={{ padding:"5px 12px", borderRadius:20, cursor:"pointer",
                fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600,
                transition:"all .15s",
                border:`1px solid ${filterType === t.id ? t.colorRaw + "55" : "rgba(42,79,122,.4)"}`,
                background:filterType === t.id ? t.colorRaw + "12" : "transparent",
                color:filterType === t.id ? t.color : "var(--ts-txt3)" }}>
              {t.label} ({countByType[t.id] || 0})
            </button>
          ))}
          <span style={{ marginLeft:"auto", fontFamily:"'JetBrains Mono',monospace",
            fontSize:8, color:"var(--ts-txt4)", letterSpacing:.5 }}>
            {filtered.length} template{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Tag filter strip — only shown when tags exist */}
        {allTags.length > 0 && (
          <div style={{ display:"flex", gap:5, flexWrap:"wrap", alignItems:"center",
            padding:"8px 14px", borderRadius:10, marginBottom:12,
            background:"rgba(8,22,40,.4)", border:"1px solid rgba(42,79,122,.2)" }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:"var(--ts-txt4)", letterSpacing:1, textTransform:"uppercase",
              flexShrink:0 }}>Tags:</span>
            <button onClick={() => setFilterTag(null)}
              style={{ padding:"3px 10px", borderRadius:20, cursor:"pointer",
                fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:600,
                border:`1px solid ${!filterTag ? "rgba(0,229,192,.45)" : "rgba(42,79,122,.4)"}`,
                background:!filterTag ? "rgba(0,229,192,.12)" : "transparent",
                color:!filterTag ? "var(--ts-teal)" : "var(--ts-txt4)",
                transition:"all .15s" }}>All</button>
            {allTags.map(tag => {
              const count = templates.filter(t => parseTags(t.category).includes(tag)).length;
              return (
                <button key={tag} onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                  style={{ padding:"3px 10px", borderRadius:20, cursor:"pointer",
                    fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:600,
                    transition:"all .15s",
                    border:`1px solid ${filterTag === tag ? "rgba(0,229,192,.5)" : "rgba(42,79,122,.35)"}`,
                    background:filterTag === tag ? "rgba(0,229,192,.14)" : "transparent",
                    color:filterTag === tag ? "var(--ts-teal)" : "var(--ts-txt4)" }}>
                  {tag} <span style={{ opacity:.6 }}>({count})</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Template list */}
        {loading ? (
          <div style={{ textAlign:"center", padding:"60px 0",
            fontFamily:"'JetBrains Mono',monospace", fontSize:12,
            color:"var(--ts-txt4)" }}>
            Loading templates…
          </div>
        ) : error ? (
          <div style={{ padding:"16px", borderRadius:10, textAlign:"center",
            background:"rgba(255,68,68,.07)", border:"1px solid rgba(255,68,68,.3)",
            fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"var(--ts-coral)" }}>
            {error}
            <button onClick={load} style={{ marginLeft:12, padding:"4px 12px",
              borderRadius:6, cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
              fontSize:11, border:"1px solid rgba(255,68,68,.4)",
              background:"rgba(255,68,68,.1)", color:"var(--ts-coral)" }}>
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"60px 0" }}>
            <div style={{ fontSize:32, marginBottom:12 }}>✏️</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16,
              color:"var(--ts-txt)", marginBottom:8 }}>
              {templates.length === 0 ? "No custom templates yet" : "No templates of this type"}
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
              color:"var(--ts-txt4)", marginBottom:18 }}>
              {templates.length === 0
                ? "Create your first template — it will appear in the QuickNote Ctrl+T picker"
                : `Switch the filter or create a new ${filterType.toUpperCase()} template`}
            </div>
            <button className="ts-btn" onClick={() => setEditing("new")}
              style={{ border:"1px solid rgba(0,229,192,.45)",
                background:"rgba(0,229,192,.12)", color:"var(--ts-teal)" }}>
              + Create Template
            </button>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {filtered.map(tpl => (
              <TemplateCard key={tpl.id} tpl={tpl}
                onEdit={t => { setEditing(t); window.scrollTo({ top:0, behavior:"smooth" }); }}
                onDelete={handleDelete} />
            ))}
          </div>
        )}

        {/* Integration note */}
        {templates.length > 0 && !editing && (
          <div style={{ marginTop:28, padding:"12px 16px", borderRadius:10,
            background:"rgba(59,158,255,.06)", border:"1px solid rgba(59,158,255,.2)" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
              fontWeight:700, color:"var(--ts-blue)", letterSpacing:1,
              textTransform:"uppercase", marginBottom:5 }}>QuickNote Integration</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
              color:"var(--ts-txt3)", lineHeight:1.6 }}>
              Your custom templates appear in QuickNote under <b style={{ color:"var(--ts-txt2)" }}>My Templates</b> at
              the top of the Ctrl+T picker, above the built-in templates.
              Templates marked as <b style={{ color:"var(--ts-gold)" }}>★ Default</b> appear first.
              SmartFill blanks (<code style={{ background:"rgba(14,37,68,.6)", padding:"1px 5px",
                borderRadius:3, fontSize:10, color:"var(--ts-gold)" }}>___</code>) and
              toggle options (<code style={{ background:"rgba(14,37,68,.6)", padding:"1px 5px",
                borderRadius:3, fontSize:10, color:"var(--ts-teal)" }}>yes/no</code>) work
              automatically in your custom templates.
            </div>
          </div>
        )}

        <div style={{ marginTop:24, textAlign:"center",
          fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:"rgba(107,158,200,.4)", letterSpacing:1.5 }}>
          NOTRYA TEMPLATE STUDIO · CUSTOM TEMPLATES SYNC TO QUICKNOTE CTRL+T PICKER
        </div>
      </div>
    </div>
  );
}