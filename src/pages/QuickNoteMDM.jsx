// QuickNoteMDM.jsx
// MDM result display — differential, audit trail, narrative editor
// Extracted from QuickNoteComponents.jsx
// Exports: DifferentialCard, QuickDDxCard, MDMResult

import { useState, useEffect, useRef } from "react";
import { CC_HUB_MAP } from "./QuickNoteData";
import GuidelineSuggestionStrip from "@/components/notes/GuidelineSuggestionStrip";

// ─── LOCAL HELPERS ───────────────────────────────────────────────────────────
const s = (v) => (typeof v === 'string' ? v : v == null ? '' : String(v));

function useEditableList(initialItems, toText) {
  const [items, setItems] = useState(() => (initialItems||[]).map((item,i)=>({ id:i, text:toText?toText(item):(item||""), selected:true, editing:false })));
  const prevRef = useRef(initialItems);
  useEffect(() => {
    if (JSON.stringify(initialItems) !== JSON.stringify(prevRef.current)) {
      prevRef.current = initialItems;
      setItems((initialItems||[]).map((item,i)=>({ id:i, text:toText?toText(item):(item||""), selected:true, editing:false })));
    }
  }, [initialItems]);
  const toggle    = id => setItems(p => p.map(x => x.id===id?{...x,selected:!x.selected}:x));
  const startEdit = id => setItems(p => p.map(x => x.id===id?{...x,editing:true}:x));
  const saveEdit  = (id,val) => setItems(p => p.map(x => x.id===id?{...x,text:val,editing:false}:x));
  const cancelEdit= id => setItems(p => p.map(x => x.id===id?{...x,editing:false}:x));
  const remove    = id => setItems(p => p.filter(x => x.id!==id));
  const addItem   = (text="") => { const newId=Date.now(); setItems(p=>[...p,{id:newId,text,selected:true,editing:!text}]); };
  const selectAll = () => setItems(p => p.map(x=>({...x,selected:true})));
  const selectNone= () => setItems(p => p.map(x=>({...x,selected:false})));
  const checked   = items.filter(x => x.selected);
  return { items, toggle, startEdit, saveEdit, cancelEdit, remove, addItem, selectAll, selectNone, checked };
}

function SubsectionList({ label, list, onAddLabel }) {
  const [copiedSec, setCopiedSec] = useState(false);
  const { items, toggle, startEdit, saveEdit, cancelEdit, remove, addItem, selectAll, selectNone, checked } = list;
  const copySection = async () => {
    const lines = [label.toUpperCase() + ":"]; checked.forEach(x => lines.push("- " + x.text));
    try { await navigator.clipboard.writeText(lines.join("\n")); } catch {}
    setCopiedSec(true); setTimeout(() => setCopiedSec(false), 2000);
  };
  const chk = (sel) => ({ width:14,height:14,borderRadius:3,flexShrink:0,marginTop:2,border:sel?"1px solid #00e5c0":"1px solid rgba(200,223,240,0.2)",background:sel?"#00e5c0":"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer" });
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6 }}>
        <span style={{ fontSize:10,fontFamily:"'JetBrains Mono',monospace",color:"rgba(200,223,240,0.45)",letterSpacing:"0.09em",textTransform:"uppercase" }}>{label}</span>
        <div style={{ display:"flex",gap:4 }}>
          <button onClick={selectAll}  style={{ padding:"2px 7px",borderRadius:3,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700,border:"1px solid rgba(0,184,154,0.2)",background:"transparent",color:"rgba(200,223,240,0.35)",textTransform:"uppercase",letterSpacing:"0.05em" }}>All</button>
          <button onClick={selectNone} style={{ padding:"2px 7px",borderRadius:3,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700,border:"1px solid rgba(0,184,154,0.2)",background:"transparent",color:"rgba(200,223,240,0.35)",textTransform:"uppercase",letterSpacing:"0.05em" }}>None</button>
          <button onClick={copySection} style={{ padding:"3px 9px",borderRadius:4,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontSize:9.5,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",border:copiedSec?"1px solid #00e5c0":"1px solid rgba(0,184,154,0.25)",background:copiedSec?"rgba(0,229,192,0.12)":"transparent",color:copiedSec?"#00e5c0":"rgba(200,223,240,0.4)",transition:"all 0.15s" }}>
            {copiedSec?"✓ Copied":"⎘ Copy"}
          </button>
        </div>
      </div>
      {items.map(item => (
        <div key={item.id} style={{ display:"flex",gap:6,alignItems:"flex-start",padding:"6px 8px",borderRadius:6,marginBottom:4,background:item.selected?"rgba(0,184,154,0.05)":"rgba(11,30,54,0.3)",border:item.selected?"1px solid rgba(0,184,154,0.18)":"1px solid rgba(0,184,154,0.06)",transition:"all 0.1s" }}>
          <div style={chk(item.selected)} onClick={()=>toggle(item.id)}>
            {item.selected&&<span style={{ color:"#081628",fontSize:9,fontWeight:700 }}>✓</span>}
          </div>
          {item.editing
            ? <input autoFocus defaultValue={item.text} onBlur={e=>saveEdit(item.id,e.target.value)} onKeyDown={e=>{if(e.key==="Enter")saveEdit(item.id,e.target.value);if(e.key==="Escape")cancelEdit(item.id);}} style={{ flex:1,background:"rgba(11,30,54,0.7)",border:"1px solid rgba(0,229,192,0.35)",borderRadius:4,color:"#c8dff0",fontFamily:"'DM Sans',sans-serif",fontSize:12.5,padding:"2px 7px",outline:"none" }} />
            : <span onClick={()=>toggle(item.id)} onDoubleClick={()=>startEdit(item.id)} title="Click to select · Double-click to edit" style={{ flex:1,fontSize:12.5,color:item.selected?"#c8dff0":"rgba(200,223,240,0.4)",lineHeight:1.45,cursor:"pointer" }}>{item.text||<em style={{ opacity:0.4 }}>empty</em>}</span>
          }
          <div style={{ display:"flex",gap:3,flexShrink:0 }}>
            {!item.editing&&<button onClick={()=>startEdit(item.id)} style={{ padding:"1px 5px",borderRadius:3,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontSize:9,border:"1px solid rgba(200,223,240,0.15)",background:"transparent",color:"rgba(200,223,240,0.3)" }}>✎</button>}
            <button onClick={()=>remove(item.id)} style={{ padding:"1px 5px",borderRadius:3,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontSize:9,border:"1px solid rgba(255,77,79,0.2)",background:"transparent",color:"rgba(255,77,79,0.35)" }}>✕</button>
          </div>
        </div>
      ))}
      <button onClick={()=>addItem()} style={{ marginTop:4,padding:"5px 0",width:"100%",borderRadius:5,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontSize:9.5,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",border:"1px dashed rgba(0,184,154,0.2)",background:"transparent",color:"rgba(0,229,192,0.45)" }}>
        + {onAddLabel||"Add Item"}
      </button>
    </div>
  );
}

async function copyText(text, setCopied) {
  try {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  } catch {
    const el = document.createElement("textarea");
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
}

function SectionCopyBtn({ buildText, label = "Copy" }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { const text = typeof buildText === "function" ? buildText() : buildText; copyText(text, setCopied); }}
      style={{ padding: "3px 10px", borderRadius: 4, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", border: copied ? "1px solid #00e5c0" : "1px solid rgba(0,184,154,0.25)", background: copied ? "rgba(0,229,192,0.12)" : "transparent", color: copied ? "#00e5c0" : "rgba(200,223,240,0.4)", transition: "all 0.15s", flexShrink: 0 }}
    >
      {copied ? "✓ Copied" : label}
    </button>
  );
}

export function EditablePlanSection({ items = [], title = "Plan Items", copyLabel = "Copy Selected" }) {
  const [planItems, setPlanItems] = useState(() => items.map((text, i) => ({ id: i, text, selected: true, editing: false })));
  const [copied, setCopied] = useState(false);
  const prevRef = useRef(items);

  useEffect(() => {
    if (JSON.stringify(items) !== JSON.stringify(prevRef.current)) {
      prevRef.current = items;
      setPlanItems(items.map((text, i) => ({ id: i, text, selected: true, editing: false })));
    }
  }, [items]);

  const toggle    = id => setPlanItems(p => p.map(x => x.id === id ? { ...x, selected: !x.selected } : x));
  const startEdit = id => setPlanItems(p => p.map(x => x.id === id ? { ...x, editing: true } : x));
  const saveEdit  = (id, text) => setPlanItems(p => p.map(x => x.id === id ? { ...x, text, editing: false } : x));
  const cancelEdit= id => setPlanItems(p => p.map(x => x.id === id ? { ...x, editing: false } : x));
  const deleteItem= id => setPlanItems(p => p.filter(x => x.id !== id));
  const addItem   = () => { const newId = Date.now(); setPlanItems(p => [...p, { id: newId, text: "", selected: true, editing: true }]); };
  const selectAll = () => setPlanItems(p => p.map(x => ({ ...x, selected: true })));
  const selectNone= () => setPlanItems(p => p.map(x => ({ ...x, selected: false })));

  const selectedCount = planItems.filter(p => p.selected).length;

  const handleCopy = () => {
    const sel = planItems.filter(p => p.selected && p.text.trim());
    if (!sel.length) return;
    const text = title.toUpperCase() + ":\n" + sel.map(p => "- " + p.text).join("\n");
    copyText(text, setCopied);
  };

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: "rgba(200,223,240,0.45)", letterSpacing: "0.09em", textTransform: "uppercase" }}>{title}</span>
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          <button onClick={selectAll}  style={{ padding: "2px 7px", borderRadius: 3, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", border: "1px solid rgba(0,184,154,0.2)", background: "transparent", color: "rgba(200,223,240,0.35)" }}>All</button>
          <button onClick={selectNone} style={{ padding: "2px 7px", borderRadius: 3, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", border: "1px solid rgba(0,184,154,0.2)", background: "transparent", color: "rgba(200,223,240,0.35)" }}>None</button>
          <button onClick={handleCopy} disabled={selectedCount === 0} style={{ padding: "3px 10px", borderRadius: 4, cursor: selectedCount === 0 ? "not-allowed" : "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", border: copied ? "1px solid #00e5c0" : "1px solid rgba(0,184,154,0.25)", background: copied ? "rgba(0,229,192,0.12)" : "transparent", color: copied ? "#00e5c0" : "rgba(200,223,240,0.4)", opacity: selectedCount === 0 ? 0.4 : 1, transition: "all 0.15s" }}>
            {copied ? "✓ Copied" : copyLabel + " (" + selectedCount + ")"}
          </button>
        </div>
      </div>

      {planItems.map(item => (
        <div key={item.id} style={{ display: "flex", gap: 6, alignItems: "flex-start", padding: "5px 6px", borderRadius: 5, marginBottom: 3, background: item.selected ? "rgba(0,184,154,0.05)" : "transparent", border: item.selected ? "1px solid rgba(0,184,154,0.12)" : "1px solid transparent", transition: "all 0.1s" }}>
          <div onClick={() => toggle(item.id)} style={{ width: 14, height: 14, borderRadius: 3, flexShrink: 0, marginTop: 2, border: item.selected ? "1px solid #00e5c0" : "1px solid rgba(200,223,240,0.2)", background: item.selected ? "#00e5c0" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            {item.selected && <span style={{ color: "#081628", fontSize: 9, fontWeight: 700 }}>✓</span>}
          </div>
          {item.editing ? (
            <input
              autoFocus
              defaultValue={item.text}
              onBlur={e => saveEdit(item.id, e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") saveEdit(item.id, e.target.value); if (e.key === "Escape") cancelEdit(item.id); }}
              style={{ flex: 1, background: "rgba(11,30,54,0.7)", border: "1px solid rgba(0,229,192,0.3)", borderRadius: 4, color: "#c8dff0", fontFamily: "'DM Sans',sans-serif", fontSize: 12.5, padding: "3px 7px", outline: "none", lineHeight: 1.45 }}
            />
          ) : (
            <span onClick={() => toggle(item.id)} onDoubleClick={() => startEdit(item.id)} title="Click to select/deselect - Double-click to edit" style={{ flex: 1, fontSize: 12.5, fontFamily: "'DM Sans',sans-serif", color: item.selected ? "#c8dff0" : "rgba(200,223,240,0.35)", lineHeight: 1.45, cursor: "pointer" }}>
              {item.text || <em style={{ opacity: 0.4 }}>empty</em>}
            </span>
          )}
          {!item.editing && (
            <>
              <button onClick={() => startEdit(item.id)} title="Edit" style={{ padding: "1px 6px", borderRadius: 3, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 9, border: "1px solid rgba(0,184,154,0.2)", background: "transparent", color: "rgba(200,223,240,0.3)", flexShrink: 0 }}>✎</button>
              <button onClick={() => deleteItem(item.id)} title="Remove" style={{ padding: "1px 5px", borderRadius: 3, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 9, border: "1px solid rgba(255,77,79,0.2)", background: "transparent", color: "rgba(255,77,79,0.35)", flexShrink: 0 }}>✕</button>
            </>
          )}
        </div>
      ))}
      <button onClick={addItem} style={{ marginTop: 5, padding: "4px 10px", borderRadius: 4, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", border: "1px dashed rgba(0,184,154,0.2)", background: "transparent", color: "rgba(0,229,192,0.4)", width: "100%" }}>+ Add item</button>
    </div>
  );
}

function mdmLevelColor(level) {
  const l = (level || '').toLowerCase();
  if (l.includes('high'))            return '#ff4444';
  if (l.includes('moderate'))        return '#ff9f43';
  if (l.includes('low'))             return '#f5c842';
  if (l.includes('straightforward')) return '#3dffa0';
  return '#3b9eff';
}

function SectionLabel({ children, color, style }) {
  return (
    <div className="qn-section-lbl"
      style={{ color: color || 'var(--qn-txt4)', marginBottom:4, ...style }}>
      {children}
    </div>
  );
}

// ─── MDM NARRATIVE CARD ──────────────────────────────────────────────────────
function MDMNarrativeCard({ narrative, copiedMDM, setCopiedMDM, onEdit }) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(narrative);
  const [saved,   setSaved]   = useState(false);
  const prevNarrative = useRef(narrative);

  useEffect(() => {
    if (narrative !== prevNarrative.current) {
      setDraft(narrative); setEditing(false);
      prevNarrative.current = narrative;
    }
  }, [narrative]);

  useEffect(() => {
    const fn = () => { if (!editing) { setDraft(narrative); setEditing(true); } };
    window.addEventListener("qn-edit-narrative", fn);
    return () => window.removeEventListener("qn-edit-narrative", fn);
  }, [editing, narrative]);

  const handleSave = () => { if (onEdit) onEdit(draft); setEditing(false); setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const copy = () => { navigator.clipboard.writeText(editing ? draft : narrative); setCopiedMDM(true); setTimeout(() => setCopiedMDM(false), 2000); };

  return (
    <div className="qn-card" style={{ marginBottom:10 }}>
      <div style={{ display:"flex", alignItems:"center", marginBottom:6, gap:6 }}>
        <SectionLabel color="var(--qn-purple)" style={{ marginBottom:0 }}>MDM Narrative — Chart-Ready</SectionLabel>
        {saved && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"var(--qn-green)" }}>✓ Saved</span>}
        <div style={{ flex:1 }} />
        {!editing ? (
          <>
            <button onClick={() => { setDraft(narrative); setEditing(true); }}
              style={{ padding:"2px 10px", borderRadius:6, cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, border:"1px solid rgba(155,109,255,.35)", background:"rgba(155,109,255,.08)", color:"var(--qn-purple)", letterSpacing:.5, textTransform:"uppercase" }}>✎ Edit</button>
            <button onClick={copy}
              style={{ padding:"2px 10px", borderRadius:6, cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, border:`1px solid ${copiedMDM ? "rgba(61,255,160,.5)" : "rgba(155,109,255,.35)"}`, background:copiedMDM ? "rgba(61,255,160,.1)" : "rgba(155,109,255,.08)", color:copiedMDM ? "var(--qn-green)" : "var(--qn-purple)", letterSpacing:.5, textTransform:"uppercase" }}>{copiedMDM ? "✓ Copied" : "Copy"}</button>
          </>
        ) : (
          <>
            <button onClick={handleSave} style={{ padding:"2px 10px", borderRadius:6, cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, border:"1px solid rgba(61,255,160,.5)", background:"rgba(61,255,160,.1)", color:"var(--qn-green)" }}>✓ Done</button>
            <button onClick={() => { setDraft(narrative); setEditing(false); }} style={{ padding:"2px 10px", borderRadius:6, cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:8, border:"1px solid rgba(42,79,122,.4)", background:"transparent", color:"var(--qn-txt4)" }}>Cancel</button>
          </>
        )}
      </div>
      {editing ? (
        <textarea value={draft} onChange={e => setDraft(e.target.value)} rows={5} autoFocus
          style={{ background:"rgba(14,37,68,.7)", border:"1px solid rgba(155,109,255,.45)", borderRadius:8, padding:"10px 12px", color:"var(--qn-txt)", fontFamily:"'DM Sans',sans-serif", fontSize:12, lineHeight:1.75, outline:"none", width:"100%", boxSizing:"border-box", resize:"vertical" }} />
      ) : (
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"var(--qn-txt2)", lineHeight:1.75, whiteSpace:"pre-wrap" }}>{s(narrative)}</div>
      )}
    </div>
  );
}

// ─── HUB STRIP ────────────────────────────────────────────────────────────────
function HubStrip({ catId, label }) {
  const hubs = CC_HUB_MAP[catId];
  if (!hubs) return null;
  const all = [...(hubs.primary || []), ...(hubs.secondary || [])];
  return (
    <div style={{ marginTop:8, padding:"7px 10px", borderRadius:8, background:"rgba(8,22,40,.7)", border:"1px solid rgba(42,79,122,.35)" }}>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"var(--qn-txt4)", letterSpacing:1.2, textTransform:"uppercase", marginBottom:6 }}>{label || "Related Hubs"}</div>
      <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
        {all.map((h, i) => (
          <button key={i} onClick={() => { window.location.href = h.route; }}
            style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:7, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600, border:`1px solid ${h.color}44`, background:`${h.color}0e`, color:h.color, transition:"all .15s" }}>
            <span style={{ fontSize:13 }}>{h.icon}</span>{h.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── DIFFERENTIAL HELPERS ────────────────────────────────────────────────────
const PROB_CONFIG = {
  high:     { color:"var(--qn-coral)",  bg:"rgba(255,107,107,.1)",  bd:"rgba(255,107,107,.35)", label:"HIGH"    },
  moderate: { color:"var(--qn-gold)",   bg:"rgba(245,200,66,.08)",  bd:"rgba(245,200,66,.3)",   label:"MOD"     },
  low:      { color:"var(--qn-txt3)",   bg:"rgba(130,174,206,.07)", bd:"rgba(130,174,206,.25)", label:"LOW"     },
};

function DDxItem({ item, idx, expanded, onToggle }) {
  const prob  = (item.probability || "low").toLowerCase();
  const pc    = PROB_CONFIG[prob] || PROB_CONFIG.low;
  const isMNM = item.must_not_miss;

  return (
    <div style={{ borderRadius:9, overflow:"hidden",
      border:`1px solid ${isMNM ? "rgba(255,68,68,.4)" : pc.bd}`,
      background: isMNM ? "rgba(255,68,68,.05)" : pc.bg,
      transition:"all .15s" }}>
      {/* Row header */}
      <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px",
        cursor:"pointer" }} onClick={onToggle}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
          color:"var(--qn-txt4)", flexShrink:0, minWidth:16 }}>{idx + 1}.</span>
        {isMNM && (
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
            fontWeight:700, color:"var(--qn-red)",
            background:"rgba(255,68,68,.15)", border:"1px solid rgba(255,68,68,.4)",
            borderRadius:3, padding:"1px 5px", letterSpacing:.6,
            flexShrink:0 }}>⚠ MUST NOT MISS</span>
        )}
        <span style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700,
          fontSize:12, color: isMNM ? "var(--qn-red)" : "var(--qn-txt)",
          flex:1, lineHeight:1.3 }}>{s(item.diagnosis)}</span>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          fontWeight:700, color:pc.color,
          background:pc.bg, border:`1px solid ${pc.bd}`,
          borderRadius:4, padding:"1px 6px", letterSpacing:.6,
          flexShrink:0 }}>{pc.label}</span>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
          color:"var(--qn-txt4)" }}>{expanded ? "▲" : "▼"}</span>
      </div>
      {/* Expanded reasoning */}
      {expanded && (
        <div style={{ padding:"0 10px 9px", borderTop:"1px solid rgba(42,79,122,.2)" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:8 }}>
            <div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                color:"var(--qn-teal)", letterSpacing:1, textTransform:"uppercase",
                marginBottom:4 }}>Supporting</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                color:"var(--qn-txt2)", lineHeight:1.5 }}>
                {s(item.supporting_evidence) || "—"}
              </div>
            </div>
            <div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                color:"var(--qn-txt4)", letterSpacing:1, textTransform:"uppercase",
                marginBottom:4 }}>Against</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                color:"var(--qn-txt4)", lineHeight:1.5 }}>
                {s(item.against) || "—"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Full differential card — used inside MDMResult
export function DifferentialCard({ differential }) {
  const [expandedIdx, setExpandedIdx] = useState(null);
  const mustNotMiss = (differential || []).filter(d => d.must_not_miss);

  // If still the old string[] format, render legacy flat list
  if (differential?.length && typeof differential[0] === "string") {
    return (
      <div className="qn-card">
        <SectionLabel>Differential</SectionLabel>
        {differential.map((d, i) => (
          <div key={i} style={{ display:"flex", gap:6, alignItems:"flex-start", marginBottom:3 }}>
            <span style={{ color:"var(--qn-txt4)", fontFamily:"'JetBrains Mono',monospace",
              fontSize:9, marginTop:2, flexShrink:0 }}>{i + 1}.</span>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
              color:"var(--qn-txt2)" }}>{s(d)}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="qn-card">
      <div style={{ display:"flex", alignItems:"center", marginBottom:8 }}>
        <SectionLabel style={{ marginBottom:0, flex:1 }}>Differential Diagnosis</SectionLabel>
        {mustNotMiss.length > 0 && (
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:"var(--qn-red)", letterSpacing:.4 }}>
            {mustNotMiss.length} must-not-miss
          </span>
        )}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
        {(differential || []).map((item, i) => (
          <DDxItem key={i} item={item} idx={i}
            expanded={expandedIdx === i}
            onToggle={() => setExpandedIdx(expandedIdx === i ? null : i)} />
        ))}
      </div>
      <div style={{ marginTop:6, fontFamily:"'JetBrains Mono',monospace", fontSize:7,
        color:"rgba(107,158,200,.4)", letterSpacing:.5 }}>
        Click any item to expand reasoning
      </div>
    </div>
  );
}

// Quick DDx card — used in Phase 1 before MDM runs
export function QuickDDxCard({ items, onDismiss, onRerun, busy }) {
  const [expandedIdx, setExpandedIdx] = useState(null);
  const mustNotMiss = (items || []).filter(d => d.must_not_miss);

  return (
    <div className="qn-fade" style={{ marginTop:8, padding:"12px 14px",
      borderRadius:12, background:"rgba(155,109,255,.06)",
      border:"1px solid rgba(155,109,255,.3)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
          fontWeight:700, color:"var(--qn-purple)", letterSpacing:1.2,
          textTransform:"uppercase", flex:1 }}>
          Quick DDx
        </span>
        {mustNotMiss.length > 0 && (
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:"var(--qn-red)", background:"rgba(255,68,68,.1)",
            border:"1px solid rgba(255,68,68,.3)", borderRadius:4,
            padding:"1px 7px", letterSpacing:.4 }}>
            ⚠ {mustNotMiss.length} must-not-miss
          </span>
        )}
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:"rgba(155,109,255,.5)", letterSpacing:.3 }}>
          Superseded when MDM runs
        </span>
        <button onClick={onRerun} disabled={busy}
          style={{ padding:"2px 8px", borderRadius:5, cursor:"pointer",
            fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            border:"1px solid rgba(155,109,255,.3)",
            background:"transparent", color:"var(--qn-txt4)" }}>
          ↺
        </button>
        <button onClick={onDismiss}
          style={{ background:"transparent", border:"none", cursor:"pointer",
            color:"var(--qn-txt4)", fontSize:12, padding:"0 2px" }}>✕</button>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
        {(items || []).map((item, i) => (
          <DDxItem key={i} item={item} idx={i}
            expanded={expandedIdx === i}
            onToggle={() => setExpandedIdx(expandedIdx === i ? null : i)} />
        ))}
      </div>
      <div style={{ marginTop:7, fontFamily:"'JetBrains Mono',monospace", fontSize:7,
        color:"rgba(107,158,200,.4)", letterSpacing:.5 }}>
        Click any item to expand reasoning · Based on CC and HPI only
      </div>
    </div>
  );
}

// ─── MDM RESULT DISPLAY ───────────────────────────────────────────────────────
export function MDMResult({ result, copiedMDM, setCopiedMDM, onNarrativeEdit }) {
  const [auditOpen, setAuditOpen] = useState(false);
  if (!result) return null;
  const lc = mdmLevelColor(result.mdm_level);

  // E&M 2023 criteria explanation per field
  const PROBLEM_CRITERIA = {
    "1 self-limited or minor problem":              { level:"Straightforward", col:"Problem" },
    "1 stable chronic illness":                     { level:"Low",             col:"Problem" },
    "2+ self-limited problems":                     { level:"Low",             col:"Problem" },
    "1+ chronic illness with exacerbation":         { level:"Moderate",        col:"Problem" },
    "Undiagnosed new problem with uncertain prognosis":{ level:"Moderate",     col:"Problem" },
    "Acute illness with systemic symptoms":         { level:"Moderate",        col:"Problem" },
    "Acute or chronic illness posing threat to life or function":{ level:"High", col:"Problem" },
  };
  const DATA_CRITERIA = {
    "Minimal or none":                              { level:"Straightforward", col:"Data" },
    "Limited — ordering or reviewing tests":        { level:"Low",             col:"Data" },
    "Moderate — independent interpretation of results":{ level:"Moderate",    col:"Data" },
    "Moderate — discussion with treating provider": { level:"Moderate",        col:"Data" },
    "Extensive — independent interpretation and provider discussion":{ level:"High", col:"Data" },
  };
  const RISK_CRITERIA = {
    "Minimal":{ level:"Straightforward", col:"Risk",
      note:"Self-limited, OTC meds, no prescribed Rx" },
    "Low":    { level:"Low",             col:"Risk",
      note:"Prescription drug management, minor surgery" },
    "Moderate":{ level:"Moderate",       col:"Risk",
      note:"New Rx, minor procedure, observation" },
    "High":   { level:"High",            col:"Risk",
      note:"Intensive Rx monitoring, hospitalization, or major surgery" },
  };
  const probInfo = Object.entries(PROBLEM_CRITERIA).find(([k]) =>
    (result.problem_complexity||"").toLowerCase().includes(k.toLowerCase().slice(0,20)))?.[1];
  const dataInfo = Object.entries(DATA_CRITERIA).find(([k]) =>
    (result.data_complexity||"").toLowerCase().includes(k.toLowerCase().slice(0,20)))?.[1];
  const riskKey  = Object.keys(RISK_CRITERIA).find(k =>
    (result.risk_tier||"").toLowerCase().includes(k.toLowerCase()));
  const riskInfo = riskKey ? RISK_CRITERIA[riskKey] : null;

  return (
    <div className="qn-fade">

      {/* CommandKit guideline suggestions */}
      <GuidelineSuggestionStrip
        diagnoses={result.differential?.map(d => d.diagnosis || d).filter(Boolean)}
        assessment={result.working_diagnosis}
        chiefComplaint={null}
        rawNote={null}
      />

      {/* Level badge */}
      <div style={{ marginBottom:12, padding:"11px 14px", borderRadius:10,
        background:`${lc}10`, border:`2px solid ${lc}44` }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
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
          {/* Audit trail toggle */}
          <button onClick={() => setAuditOpen(o => !o)}
            style={{ padding:"3px 10px", borderRadius:6, cursor:"pointer",
              fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
              border:`1px solid ${lc}44`, background:`${lc}0c`,
              color:lc, letterSpacing:.5, textTransform:"uppercase",
              transition:"all .15s", flexShrink:0 }}>
            {auditOpen ? "Hide Why ▲" : "Why? ▼"}
          </button>
        </div>

        {/* Audit trail — collapsible */}
        {auditOpen && (
          <div style={{ marginTop:10, paddingTop:10,
            borderTop:`1px solid ${lc}25` }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:lc, letterSpacing:1.2, textTransform:"uppercase",
              marginBottom:8 }}>AMA/CMS 2023 E&M — Complexity Reasoning</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
              {[
                { label:"Problem", value:result.problem_complexity, info:probInfo,
                  borderColor:"rgba(155,109,255,.3)", bgColor:"rgba(155,109,255,.06)" },
                { label:"Data",    value:result.data_complexity,    info:dataInfo,
                  borderColor:"rgba(59,158,255,.3)",  bgColor:"rgba(59,158,255,.06)" },
                { label:"Risk",    value:result.risk_tier,          info:riskInfo,
                  borderColor:`${lc}33`,              bgColor:`${lc}06` },
              ].map(({ label, value, info, borderColor, bgColor }) => (
                <div key={label} style={{ padding:"8px 10px", borderRadius:8,
                  background:bgColor, border:`1px solid ${borderColor}` }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                    fontWeight:700, letterSpacing:1, textTransform:"uppercase",
                    color:"var(--qn-txt4)", marginBottom:4 }}>{label}</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                    fontWeight:600, color:"var(--qn-txt)", lineHeight:1.4,
                    marginBottom:4 }}>
                    {s(value) || "—"}
                  </div>
                  {info && (
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                      color:lc, letterSpacing:.3 }}>
                      → Drives {info.level} level
                      {info.note && (
                        <div style={{ color:"var(--qn-txt4)", marginTop:2 }}>{info.note}</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ marginTop:7, fontFamily:"'JetBrains Mono',monospace", fontSize:7,
              color:"rgba(107,158,200,.4)", letterSpacing:.5 }}>
              ACEP GUIDANCE: MDM level determined by HIGHEST column — not an average ·
              AMA/CMS 2023 E&M Guidelines
            </div>
          </div>
        )}
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
            <DifferentialCard differential={result.differential} />
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

// ─── ED DRUG LIBRARY ─────────────────────────────────────────────────────────
const ED_DRUG_LIBRARY = [
  { name:"Ketorolac", category:"Analgesia", routes:[{ route:"IV", dose:"15-30 mg", freq:"q6h", max:"120 mg/day", notes:"Max 5 days; renally dose-adjust" },{ route:"IM", dose:"30-60 mg", freq:"q6h", max:"120 mg/day", notes:"Max 5 days" },{ route:"PO", dose:"10 mg", freq:"q4-6h", max:"40 mg/day", notes:"Continuation only" }]},
  { name:"Morphine", category:"Analgesia", routes:[{ route:"IV", dose:"2-4 mg", freq:"q3-4h PRN", max:"", notes:"Titrate to effect; monitor resp" },{ route:"IM", dose:"5-10 mg", freq:"q3-4h PRN", max:"", notes:"" },{ route:"PO", dose:"5-30 mg", freq:"q4h PRN", max:"", notes:"IR formulation" }]},
  { name:"Hydromorphone (Dilaudid)", category:"Analgesia", routes:[{ route:"IV", dose:"0.2-1 mg", freq:"q3-4h PRN", max:"", notes:"8x more potent than morphine IV" },{ route:"IM", dose:"1-2 mg", freq:"q4-6h PRN", max:"", notes:"" },{ route:"PO", dose:"2-4 mg", freq:"q4-6h PRN", max:"", notes:"" }]},
  { name:"Fentanyl", category:"Analgesia", routes:[{ route:"IV", dose:"0.5-1 mcg/kg", freq:"q30-60 min PRN", max:"", notes:"Rapid onset; short duration" },{ route:"IM", dose:"1-2 mcg/kg", freq:"q1-2h PRN", max:"", notes:"" },{ route:"IN", dose:"1-2 mcg/kg", freq:"q5-10 min x2", max:"", notes:"Intranasal; 0.5 mL per nostril" }]},
  { name:"Acetaminophen", category:"Analgesia", routes:[{ route:"PO", dose:"650-1000 mg", freq:"q6h", max:"4g/day", notes:"" },{ route:"IV", dose:"1000 mg", freq:"q6h", max:"4g/day", notes:"Over 15 min; <50 kg use 15mg/kg" },{ route:"PR", dose:"650 mg", freq:"q6h", max:"4g/day", notes:"Rectal if unable to take PO" }]},
  { name:"Ibuprofen", category:"Analgesia", routes:[{ route:"PO", dose:"400-800 mg", freq:"q6-8h", max:"3200 mg/day", notes:"Take with food" },{ route:"IV", dose:"400-800 mg", freq:"q6h", max:"3200 mg/day", notes:"Over 30 min" }]},
  { name:"Ketamine (sub-dissociative)", category:"Analgesia", routes:[{ route:"IV", dose:"0.1-0.3 mg/kg", freq:"over 10-15 min", max:"", notes:"Sub-dissociative dose for analgesia" },{ route:"IN", dose:"0.5-1 mg/kg", freq:"q20 min PRN", max:"", notes:"Intranasal; max 1 mL per nostril" },{ route:"IM", dose:"0.5 mg/kg", freq:"PRN", max:"", notes:"" }]},
  { name:"Ondansetron (Zofran)", category:"Antiemetic", routes:[{ route:"IV", dose:"4-8 mg", freq:"q4-6h PRN", max:"32 mg/day", notes:"Over 2 min; QT prolongation risk" },{ route:"PO", dose:"4-8 mg", freq:"q4-6h PRN", max:"32 mg/day", notes:"ODT available" },{ route:"IM", dose:"4 mg", freq:"q4h PRN", max:"", notes:"" }]},
  { name:"Metoclopramide (Reglan)", category:"Antiemetic", routes:[{ route:"IV", dose:"10-20 mg", freq:"q6h PRN", max:"", notes:"Over 15 min; extrapyramidal risk" },{ route:"PO", dose:"10 mg", freq:"q6h PRN", max:"", notes:"30 min before meals" }]},
  { name:"Prochlorperazine (Compazine)", category:"Antiemetic", routes:[{ route:"IV", dose:"5-10 mg", freq:"q3-4h PRN", max:"40 mg/day", notes:"Extrapyramidal risk; consider diphenhydramine prophylaxis" },{ route:"IM", dose:"5-10 mg", freq:"q3-4h PRN", max:"40 mg/day", notes:"" },{ route:"PR", dose:"25 mg", freq:"q12h PRN", max:"", notes:"Rectal suppository" }]},
  { name:"Ceftriaxone", category:"Antibiotic", routes:[{ route:"IV", dose:"1-2 g", freq:"q12-24h", max:"", notes:"4g/day for meningitis" },{ route:"IM", dose:"250-500 mg", freq:"single dose", max:"", notes:"STI treatment" }]},
  { name:"Cefazolin", category:"Antibiotic", routes:[{ route:"IV", dose:"1-2 g", freq:"q8h", max:"12 g/day", notes:"Skin/soft tissue; surgical prophylaxis" }]},
  { name:"Cephalexin", category:"Antibiotic", routes:[{ route:"PO", dose:"500 mg", freq:"q6h", max:"4 g/day", notes:"SSTI; adjust for GFR <30" }]},
  { name:"Augmentin (Amoxicillin-Clavulanate)", category:"Antibiotic", routes:[{ route:"PO", dose:"875/125 mg", freq:"q12h", max:"", notes:"Bite wounds; SSTI; sinusitis" }]},
  { name:"Azithromycin", category:"Antibiotic", routes:[{ route:"PO", dose:"500 mg day 1, then 250 mg days 2-5", freq:"daily", max:"", notes:"CAP; STI" },{ route:"IV", dose:"500 mg", freq:"q24h", max:"", notes:"Severe CAP" }]},
  { name:"Doxycycline", category:"Antibiotic", routes:[{ route:"PO", dose:"100 mg", freq:"q12h", max:"", notes:"SSTI; STI; Lyme; CAP; take with food" },{ route:"IV", dose:"100 mg", freq:"q12h", max:"", notes:"Over 1 hour" }]},
  { name:"TMP-SMX (Bactrim DS)", category:"Antibiotic", routes:[{ route:"PO", dose:"1-2 DS tablets (160/800 mg)", freq:"q12h", max:"", notes:"MRSA SSTI; UTI; adjust for renal; monitor K+" },{ route:"IV", dose:"8-10 mg/kg/day TMP component", freq:"divided q8-12h", max:"", notes:"Severe MRSA" }]},
  { name:"Vancomycin", category:"Antibiotic", routes:[{ route:"IV", dose:"15-20 mg/kg", freq:"q8-12h", max:"3 g/dose", notes:"AUC/MIC dosing preferred; monitor renal function" },{ route:"PO", dose:"125-500 mg", freq:"q6h", max:"", notes:"C. diff only - NOT absorbed systemically" }]},
  { name:"Piperacillin-Tazobactam (Zosyn)", category:"Antibiotic", routes:[{ route:"IV", dose:"3.375 g", freq:"q6h or 4.5g q8h", max:"", notes:"Extended infusion over 4h preferred; sepsis; intraabdominal" }]},
  { name:"Metronidazole (Flagyl)", category:"Antibiotic", routes:[{ route:"IV", dose:"500 mg", freq:"q8h", max:"4 g/day", notes:"Anaerobic; C. diff; over 30-60 min" },{ route:"PO", dose:"500 mg", freq:"q8h", max:"4 g/day", notes:"C. diff; BV; trichomoniasis" }]},
  { name:"Ciprofloxacin", category:"Antibiotic", routes:[{ route:"PO", dose:"500 mg", freq:"q12h", max:"", notes:"UTI; GI infections" },{ route:"IV", dose:"400 mg", freq:"q12h", max:"", notes:"Over 60 min" }]},
  { name:"Levofloxacin", category:"Antibiotic", routes:[{ route:"PO", dose:"500-750 mg", freq:"q24h", max:"", notes:"CAP; UTI; QT prolongation risk" },{ route:"IV", dose:"500-750 mg", freq:"q24h", max:"", notes:"Over 60-90 min" }]},
  { name:"Clindamycin", category:"Antibiotic", routes:[{ route:"PO", dose:"300-450 mg", freq:"q6-8h", max:"", notes:"SSTI; MRSA alternative; anaerobic" },{ route:"IV", dose:"600-900 mg", freq:"q8h", max:"2.7 g/day", notes:"Over 20-60 min" }]},
  { name:"Cefepime", category:"Antibiotic", routes:[{ route:"IV", dose:"1-2 g", freq:"q8-12h", max:"", notes:"Pseudomonas; febrile neutropenia; meningitis" }]},
  { name:"Aspirin", category:"Cardiovascular", routes:[{ route:"PO", dose:"325 mg (ACS) or 81 mg (antiplatelet)", freq:"once or daily", max:"", notes:"Non-enteric coated preferred for ACS" }]},
  { name:"Nitroglycerin", category:"Cardiovascular", routes:[{ route:"SL", dose:"0.3-0.4 mg", freq:"q5 min x3 PRN", max:"", notes:"Hold if SBP <90 or recent PDE5 inhibitor" },{ route:"IV", dose:"5-200 mcg/min", freq:"continuous", max:"", notes:"Titrate to symptom relief; monitor BP" }]},
  { name:"Metoprolol", category:"Cardiovascular", routes:[{ route:"IV", dose:"2.5-5 mg", freq:"q5 min x3 PRN", max:"15 mg", notes:"Rate control; ACS; caution in decompensated HF" },{ route:"PO", dose:"25-100 mg", freq:"q6-12h", max:"", notes:"" }]},
  { name:"Labetalol", category:"Cardiovascular", routes:[{ route:"IV", dose:"10-20 mg", freq:"q10 min PRN", max:"300 mg total", notes:"Hypertensive urgency/emergency" },{ route:"PO", dose:"100-400 mg", freq:"q12h", max:"", notes:"" }]},
  { name:"Adenosine", category:"Cardiovascular", routes:[{ route:"IV", dose:"6 mg first, then 12 mg x2 PRN", freq:"rapid bolus", max:"30 mg", notes:"SVT; push fast then flush; warn patient" }]},
  { name:"Amiodarone", category:"Cardiovascular", routes:[{ route:"IV", dose:"150 mg over 10 min, then 1 mg/min x6h", freq:"per protocol", max:"", notes:"VT/VF; AFib; central line preferred" }]},
  { name:"Diltiazem", category:"Cardiovascular", routes:[{ route:"IV", dose:"0.25 mg/kg over 2 min, repeat 0.35 mg/kg in 15 min if needed", freq:"then 5-15 mg/hr infusion", max:"", notes:"AFib rate control; avoid in WPW" }]},
  { name:"Albuterol", category:"Respiratory", routes:[{ route:"INH", dose:"2.5 mg in 3 mL NS", freq:"q20 min x3, then q1-4h", max:"", notes:"Nebulization; continuous neb for severe asthma" },{ route:"MDI", dose:"2-4 puffs (90 mcg/puff)", freq:"q4-6h PRN", max:"", notes:"With spacer" }]},
  { name:"Ipratropium (Atrovent)", category:"Respiratory", routes:[{ route:"INH", dose:"0.5 mg in 3 mL NS", freq:"q20 min x3 with albuterol", max:"", notes:"Add to albuterol neb; COPD exacerbation" }]},
  { name:"Methylprednisolone (Solu-Medrol)", category:"Respiratory", routes:[{ route:"IV", dose:"60-125 mg", freq:"q6h x24h then taper", max:"", notes:"Asthma/COPD exacerbation; anaphylaxis" },{ route:"IM", dose:"60-125 mg", freq:"once", max:"", notes:"Single dose for asthma if unable to take PO" }]},
  { name:"Prednisone", category:"Respiratory", routes:[{ route:"PO", dose:"40-60 mg", freq:"daily x5 days", max:"", notes:"Asthma/COPD exacerbation outpatient course" }]},
  { name:"Dexamethasone", category:"Respiratory/Neuro", routes:[{ route:"PO", dose:"10 mg", freq:"once", max:"", notes:"Asthma single-dose alternative to prednisone burst" },{ route:"IV", dose:"4-10 mg", freq:"q6-8h", max:"", notes:"Cerebral edema; croup; severe asthma" },{ route:"IM", dose:"0.6 mg/kg", freq:"once", max:"10 mg", notes:"Croup" }]},
  { name:"Magnesium Sulfate", category:"Respiratory/OB", routes:[{ route:"IV", dose:"2 g over 20 min (asthma) or 4-6 g over 20-30 min (eclampsia)", freq:"single/continuous", max:"", notes:"Severe asthma; eclampsia; torsades; monitor resp and DTRs" }]},
  { name:"Lorazepam (Ativan)", category:"Neurology", routes:[{ route:"IV", dose:"2-4 mg (0.05-0.1 mg/kg)", freq:"q5-10 min PRN seizure", max:"8-10 mg total", notes:"Seizure; EtOH withdrawal" },{ route:"IM", dose:"0.05-0.1 mg/kg", freq:"once PRN", max:"", notes:"" },{ route:"IN", dose:"0.1 mg/kg", freq:"once", max:"", notes:"Intranasal; pediatric seizure" }]},
  { name:"Diazepam (Valium)", category:"Neurology", routes:[{ route:"IV", dose:"5-10 mg", freq:"q5 min PRN seizure", max:"30 mg", notes:"Faster onset than lorazepam" },{ route:"PR", dose:"0.2-0.5 mg/kg", freq:"once", max:"20 mg", notes:"Pediatric rectal" },{ route:"PO", dose:"5-10 mg", freq:"q6-8h", max:"40 mg/day", notes:"EtOH withdrawal" }]},
  { name:"Levetiracetam (Keppra)", category:"Neurology", routes:[{ route:"IV", dose:"20-60 mg/kg or 1000-3000 mg", freq:"over 15 min", max:"3000 mg/dose", notes:"Seizure; renal adjust" },{ route:"PO", dose:"500-1500 mg", freq:"q12h", max:"", notes:"Maintenance" }]},
  { name:"Sumatriptan", category:"Neurology", routes:[{ route:"PO", dose:"25-100 mg", freq:"once, repeat in 2h PRN", max:"200 mg/day", notes:"Migraine; avoid in hemiplegic migraine or CAD" },{ route:"SC", dose:"4-6 mg", freq:"once, repeat in 1h PRN", max:"12 mg/day", notes:"Faster onset" },{ route:"IN", dose:"5-20 mg", freq:"once", max:"40 mg/day", notes:"Nasal spray" }]},
  { name:"Pantoprazole (Protonix)", category:"GI", routes:[{ route:"IV", dose:"40-80 mg", freq:"q12-24h", max:"", notes:"GI bleed; over 2-15 min" },{ route:"PO", dose:"40 mg", freq:"q24h", max:"", notes:"30 min before eating" }]},
  { name:"Epinephrine", category:"Allergy/Resus", routes:[{ route:"IM", dose:"0.3-0.5 mg (1:1000)", freq:"q5-15 min PRN", max:"", notes:"Anaphylaxis FIRST LINE; lateral thigh; 0.01 mg/kg pediatric" },{ route:"IV", dose:"0.1-0.5 mcg/kg/min", freq:"infusion", max:"", notes:"Anaphylaxis refractory to IM" },{ route:"IV", dose:"1 mg (1:10,000)", freq:"q3-5 min", max:"", notes:"Cardiac arrest only - ACLS" }]},
  { name:"Diphenhydramine (Benadryl)", category:"Allergy", routes:[{ route:"IV", dose:"25-50 mg", freq:"q4-6h PRN", max:"400 mg/day", notes:"Anaphylaxis adjunct; EPS prophylaxis; sedating" },{ route:"PO", dose:"25-50 mg", freq:"q4-6h PRN", max:"400 mg/day", notes:"" },{ route:"IM", dose:"25-50 mg", freq:"q4-6h PRN", max:"", notes:"" }]},
  { name:"Normal Saline (0.9% NaCl)", category:"Fluids", routes:[{ route:"IV", dose:"500 mL - 1 L bolus", freq:"per clinical need", max:"", notes:"Sepsis: 30 mL/kg bolus; reassess after each bolus" }]},
  { name:"Lactated Ringer's", category:"Fluids", routes:[{ route:"IV", dose:"500 mL - 1 L bolus", freq:"per clinical need", max:"", notes:"Preferred over NS for sepsis; not for hyperkalemia" }]},
  { name:"Potassium Chloride", category:"Fluids", routes:[{ route:"IV", dose:"10-20 mEq over 1 hour", freq:"per K+ level", max:"40 mEq/hr central", notes:"Max 10-20 mEq/hr peripheral; cardiac monitor required" },{ route:"PO", dose:"20-40 mEq", freq:"q4-6h", max:"", notes:"Preferred if able to tolerate PO" }]},
  { name:"Haloperidol (Haldol)", category:"Psychiatry", routes:[{ route:"IV", dose:"2-5 mg", freq:"q30-60 min PRN agitation", max:"", notes:"QT prolongation; monitor ECG" },{ route:"IM", dose:"2-10 mg", freq:"q30-60 min PRN", max:"", notes:"" },{ route:"PO", dose:"1-10 mg", freq:"q4-8h", max:"", notes:"" }]},
  { name:"Olanzapine (Zyprexa)", category:"Psychiatry", routes:[{ route:"IM", dose:"5-10 mg", freq:"q2-4h PRN agitation", max:"30 mg/day", notes:"Do NOT give IV; avoid with benzodiazepines IM within 1h" },{ route:"PO", dose:"5-20 mg", freq:"once or q12h", max:"", notes:"" }]},
  { name:"Ketamine (dissociative)", category:"Sedation", routes:[{ route:"IV", dose:"1-2 mg/kg", freq:"over 1-2 min", max:"", notes:"PSA; consider midazolam for emergence reactions" },{ route:"IM", dose:"4-6 mg/kg", freq:"once", max:"", notes:"Uncooperative patient; pediatric" }]},
  { name:"Midazolam (Versed)", category:"Sedation", routes:[{ route:"IV", dose:"0.02-0.05 mg/kg (usual 1-2.5 mg)", freq:"q3-5 min PRN", max:"", notes:"Procedural sedation; monitor airway" },{ route:"IM", dose:"0.07-0.1 mg/kg", freq:"once", max:"", notes:"" },{ route:"IN", dose:"0.2-0.3 mg/kg", freq:"once", max:"10 mg", notes:"Intranasal; pediatric seizure" }]},
  { name:"Naloxone (Narcan)", category:"Toxicology", routes:[{ route:"IV", dose:"0.04-0.4 mg (resp depression) or 2 mg (OD/arrest)", freq:"q2-3 min PRN", max:"10 mg", notes:"Titrate to respiratory rate; short duration - re-dose or infuse" },{ route:"IM", dose:"0.4-2 mg", freq:"q2-3 min PRN", max:"", notes:"" },{ route:"IN", dose:"4 mg per nostril", freq:"q2-3 min PRN", max:"", notes:"Narcan nasal spray" }]},
  { name:"N-Acetylcysteine (NAC)", category:"Toxicology", routes:[{ route:"IV", dose:"150 mg/kg over 60 min, then 50 mg/kg over 4h, then 100 mg/kg over 16h", freq:"per protocol", max:"", notes:"APAP toxicity; use Rumack-Matthew nomogram" },{ route:"PO", dose:"140 mg/kg load, then 70 mg/kg q4h x17 doses", freq:"per protocol", max:"", notes:"May cause N/V; mix in juice" }]},
  { name:"Activated Charcoal", category:"Toxicology", routes:[{ route:"PO", dose:"1 g/kg (usual 25-100 g)", freq:"once", max:"100 g", notes:"Within 1-2h of ingestion; protected airway required; contraindicated in caustics/hydrocarbons" }]},
  { name:"Heparin", category:"Anticoagulation", routes:[{ route:"IV", dose:"80 units/kg bolus then 18 units/kg/hr", freq:"continuous", max:"", notes:"ACS/PE/DVT; weight-based protocol; monitor aPTT q6h" },{ route:"SC", dose:"5000 units", freq:"q8-12h", max:"", notes:"DVT prophylaxis" }]},
  { name:"Enoxaparin (Lovenox)", category:"Anticoagulation", routes:[{ route:"SC", dose:"1 mg/kg", freq:"q12h (treatment)", max:"", notes:"Reduce to q24h if GFR <30; avoid if GFR <15" },{ route:"SC", dose:"40 mg", freq:"q24h (prophylaxis)", max:"", notes:"DVT prophylaxis" }]},
];

// ─── MEDICATION MANAGER ───────────────────────────────────────────────────────
function MedicationManager({ aiMedications, onCopy }) {
  const [selected, setSelected] = useState(() => (aiMedications || []).map((m, i) => ({ id:"ai-"+i, source:"ai", category:m.category||"Other", agent:m.agent||"", dose:m.dosing||"", route:m.route||"", freq:"", notes:m.indication||"", caveats:m.caveats||[], is_note:m.is_note||false, checked:true })));
  const prevAI = useRef(aiMedications);
  useEffect(() => {
    if (JSON.stringify(aiMedications) !== JSON.stringify(prevAI.current)) {
      prevAI.current = aiMedications;
      setSelected(prev => { const userMeds = prev.filter(m => m.source !== "ai"); const newAI = (aiMedications||[]).map((m,i)=>({ id:"ai-"+i, source:"ai", category:m.category||"Other", agent:m.agent||"", dose:m.dosing||"", route:m.route||"", freq:"", notes:m.indication||"", caveats:m.caveats||[], is_note:m.is_note||false, checked:true })); return [...newAI,...userMeds]; });
    }
  }, [aiMedications]);

  const [query, setQuery]           = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [searchHL, setSearchHL]     = useState(0);
  const [routePicker, setRoutePicker] = useState(null);
  const [copiedMeds, setCopiedMeds] = useState(false);
  const searchRef = useRef(null);

  const searchResults = query.trim().length > 1 ? ED_DRUG_LIBRARY.filter(d => d.name.toLowerCase().includes(query.toLowerCase()) || d.category.toLowerCase().includes(query.toLowerCase())).slice(0, 10) : [];

  const toggle = id => setSelected(p => p.map(m => m.id===id ? {...m,checked:!m.checked} : m));
  const remove = id => setSelected(p => p.filter(m => m.id!==id));
  const openRoutePicker = drug => { setRoutePicker({ drug, selectedRoute:drug.routes[0] }); setShowSearch(false); setQuery(""); };
  const confirmRoute = () => {
    if (!routePicker) return;
    const { drug, selectedRoute: r } = routePicker;
    setSelected(p => [...p, { id:"lib-"+Date.now(), source:"library", category:drug.category, agent:drug.name, dose:r.dose, route:r.route, freq:r.freq, notes:r.notes, caveats:[], is_note:false, checked:true }]);
    setRoutePicker(null);
  };

  const handleCopy = async () => {
    const checked = selected.filter(m => m.checked);
    if (!checked.length) return;
    const lines = ["MEDICATIONS:"];
    checked.forEach(m => {
      if (m.is_note) { lines.push("- Note: " + m.agent); }
      else { const parts = ["- " + m.category + ": " + m.agent]; if (m.dose) parts.push(m.dose); if (m.route) parts.push(m.route); if (m.freq) parts.push(m.freq); const cavStr = m.caveats?.length ? " (" + m.caveats.join("; ") + ")" : ""; lines.push(parts.join(" ") + cavStr); if (m.notes) lines.push("  Indication: " + m.notes); }
    });
    const text = lines.join("\n");
    try { await navigator.clipboard.writeText(text); } catch {}
    setCopiedMeds(true); setTimeout(() => setCopiedMeds(false), 2000);
    if (onCopy) onCopy(text);
  };

  const checkedCount = selected.filter(m => m.checked).length;
  const pill = color => ({ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, padding:"1px 7px", borderRadius:4, border:"1px solid "+color+"44", background:color+"11", color });

  return (
    <div style={{ marginTop:8 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
        <span style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace", color:"rgba(200,223,240,0.45)", letterSpacing:"0.09em", textTransform:"uppercase" }}>Medications</span>
        <div style={{ display:"flex", gap:5 }}>
          <button onClick={() => { setShowSearch(s=>!s); if (!showSearch) setTimeout(()=>searchRef.current?.focus(),50); }} style={{ padding:"3px 9px", borderRadius:4, cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:9.5, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", border:"1px solid rgba(0,184,154,0.25)", background:showSearch?"rgba(0,229,192,0.1)":"transparent", color:showSearch?"#00e5c0":"rgba(0,229,192,0.5)" }}>
            {showSearch ? "✕ Close" : "+ Search Meds"}
          </button>
          <button onClick={handleCopy} disabled={checkedCount===0} style={{ padding:"3px 9px", borderRadius:4, cursor:checkedCount===0?"not-allowed":"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:9.5, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", border:copiedMeds?"1px solid #00e5c0":"1px solid rgba(0,184,154,0.25)", background:copiedMeds?"rgba(0,229,192,0.12)":"transparent", color:copiedMeds?"#00e5c0":checkedCount>0?"rgba(0,229,192,0.7)":"rgba(200,223,240,0.3)", opacity:checkedCount===0?0.5:1, transition:"all 0.15s" }}>
            {copiedMeds ? "✓ Copied" : checkedCount>0 ? "Copy ("+checkedCount+")" : "Copy"}
          </button>
        </div>
      </div>

      {showSearch && (
        <div style={{ background:"rgba(11,30,54,0.7)", border:"1px solid rgba(0,229,192,0.3)", borderRadius:7, padding:"8px 10px", marginBottom:8 }}>
          <input ref={searchRef} value={query} onChange={e=>{setQuery(e.target.value);setSearchHL(0);}}
            onKeyDown={e=>{ if(e.key==="ArrowDown"){e.preventDefault();setSearchHL(h=>Math.min(h+1,searchResults.length-1));} if(e.key==="ArrowUp"){e.preventDefault();setSearchHL(h=>Math.max(h-1,0));} if(e.key==="Enter"&&searchResults[searchHL]){openRoutePicker(searchResults[searchHL]);} if(e.key==="Escape"){setShowSearch(false);setQuery("");} }}
            placeholder="Search 80+ ED medications (ketorolac, vancomycin, metoprolol...)"
            style={{ width:"100%", boxSizing:"border-box", background:"transparent", border:"none", color:"#c8dff0", fontFamily:"'DM Sans',sans-serif", fontSize:13, outline:"none" }} />
          {query.trim().length > 1 && (
            <div style={{ marginTop:6 }}>
              {searchResults.length === 0
                ? <div style={{ fontSize:12, color:"rgba(200,223,240,0.35)", fontStyle:"italic", padding:"6px 8px" }}>No results for "{query}"</div>
                : searchResults.map((drug, i) => (
                    <div key={drug.name} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 8px", borderRadius:5, cursor:"pointer", background:i===searchHL?"rgba(0,229,192,0.1)":"transparent", border:i===searchHL?"1px solid rgba(0,229,192,0.2)":"1px solid transparent", marginBottom:2 }}
                      onClick={()=>openRoutePicker(drug)} onMouseEnter={()=>setSearchHL(i)}>
                      <span style={{ fontSize:12.5, color:i===searchHL?"#00e5c0":"#c8dff0", fontWeight:i===searchHL?600:400, flex:1 }}>{drug.name}</span>
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"rgba(200,223,240,0.35)" }}>{drug.category}</span>
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"rgba(200,223,240,0.25)" }}>{drug.routes.map(r=>r.route).join(" · ")}</span>
                    </div>
                  ))}
            </div>
          )}
          {query.trim().length <= 1 && <div style={{ marginTop:4, fontSize:11, color:"rgba(200,223,240,0.3)", fontFamily:"'JetBrains Mono',monospace" }}>Type 2+ characters to search</div>}
        </div>
      )}

      {selected.length === 0
        ? <div style={{ padding:"12px 0", fontSize:12, color:"rgba(200,223,240,0.3)", fontStyle:"italic", textAlign:"center" }}>No medications yet - AI medications will appear here, or search above</div>
        : selected.map(m => (
            <div key={m.id} style={{ display:"flex", gap:6, alignItems:"flex-start", padding:"7px 8px", borderRadius:6, marginBottom:4, background:m.checked?"rgba(0,184,154,0.05)":"rgba(11,30,54,0.3)", border:m.checked?"1px solid rgba(0,184,154,0.18)":"1px solid rgba(0,184,154,0.06)", transition:"all 0.1s" }}>
              <div onClick={()=>toggle(m.id)} style={{ width:14, height:14, borderRadius:3, flexShrink:0, marginTop:3, border:m.checked?"1px solid #00e5c0":"1px solid rgba(200,223,240,0.2)", background:m.checked?"#00e5c0":"transparent", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                {m.checked && <span style={{ color:"#081628", fontSize:9, fontWeight:700 }}>✓</span>}
              </div>
              <div style={{ flex:1 }}>
                {m.is_note
                  ? <div style={{ fontSize:12.5, color:"#e0c97a", fontStyle:"italic" }}>Note: {m.agent}</div>
                  : <>
                      <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, color:"#00b89a", letterSpacing:"0.07em", textTransform:"uppercase" }}>{m.category}</span>
                        <span style={{ fontSize:13, fontWeight:600, color:"#a8d4f0" }}>{m.agent}</span>
                        {m.dose  && <span style={pill("#a8d4f0")}>{m.dose}</span>}
                        {m.route && <span style={pill("#7ec8f7")}>{m.route}</span>}
                        {m.freq  && <span style={pill("#00b89a")}>{m.freq}</span>}
                        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, padding:"1px 5px", borderRadius:3, border:m.source==="ai"?"1px solid rgba(245,200,66,0.3)":"1px solid rgba(0,184,154,0.2)", color:m.source==="ai"?"#f5c842":"#00b89a", letterSpacing:"0.05em", textTransform:"uppercase" }}>{m.source==="ai"?"AI":"Added"}</span>
                      </div>
                      {m.notes && <div style={{ fontSize:11.5, color:"rgba(200,223,240,0.55)", fontStyle:"italic", marginTop:3 }}>{m.notes}</div>}
                      {m.caveats?.map((c,i) => <div key={i} style={{ fontSize:11, color:"#e0c97a", marginTop:2 }}>⚠ {c}</div>)}
                    </>
                }
              </div>
              <button onClick={()=>remove(m.id)} style={{ padding:"1px 5px", borderRadius:3, cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:9, border:"1px solid rgba(255,77,79,0.2)", background:"transparent", color:"rgba(255,77,79,0.35)", flexShrink:0, marginTop:1 }}>✕</button>
            </div>
          ))
      }

      {routePicker && (
        <div style={{ position:"fixed", inset:0, zIndex:9300, background:"rgba(3,8,16,0.8)", backdropFilter:"blur(3px)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }} onClick={()=>setRoutePicker(null)}>
          <div style={{ background:"#081628", border:"1px solid rgba(0,184,154,0.3)", borderRadius:10, width:480, maxWidth:"96vw", boxShadow:"0 16px 48px rgba(0,0,0,0.6)", padding:"18px 20px" }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:14, fontWeight:700, color:"#00e5c0", marginBottom:4 }}>{routePicker.drug.name}</div>
            <div style={{ fontSize:11, color:"rgba(200,223,240,0.4)", marginBottom:14 }}>{routePicker.drug.category} · Select route and dosing</div>
            {routePicker.drug.routes.map((r,i) => {
              const isActive = routePicker.selectedRoute === r;
              return (
                <div key={i} onClick={()=>setRoutePicker(p=>({...p,selectedRoute:r}))} style={{ padding:"10px 12px", borderRadius:7, cursor:"pointer", marginBottom:6, border:isActive?"1px solid #00e5c0":"1px solid rgba(0,184,154,0.12)", background:isActive?"rgba(0,229,192,0.08)":"rgba(11,30,54,0.4)", transition:"all 0.1s" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:4, border:"1px solid rgba(0,184,154,0.3)", color:"#00b89a" }}>{r.route}</span>
                    <span style={{ fontSize:13, fontWeight:600, color:"#a8d4f0" }}>{r.dose}</span>
                    {r.freq && <span style={{ fontSize:12, color:"rgba(200,223,240,0.6)", marginLeft:"auto" }}>{r.freq}</span>}
                  </div>
                  {r.max && <div style={{ fontSize:11, color:"#f5c842", marginBottom:2 }}>Max: {r.max}</div>}
                  {r.notes && <div style={{ fontSize:11.5, color:"rgba(200,223,240,0.45)", fontStyle:"italic" }}>{r.notes}</div>}
                </div>
              );
            })}
            <div style={{ display:"flex", gap:8, marginTop:14 }}>
              <button onClick={()=>setRoutePicker(null)} style={{ padding:"8px 16px", borderRadius:6, cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, letterSpacing:"0.07em", textTransform:"uppercase", border:"1px solid rgba(200,223,240,0.15)", background:"transparent", color:"rgba(200,223,240,0.4)" }}>Cancel</button>
              <button onClick={confirmRoute} style={{ flex:1, padding:"9px 0", borderRadius:6, cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", border:"1px solid #00e5c0", background:"rgba(0,229,192,0.1)", color:"#00e5c0" }}>
                + Add {routePicker.selectedRoute?.route} - {routePicker.selectedRoute?.dose}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── INTERACTIVE DIFFERENTIALS ───────────────────────────────────────────────
function InteractiveDifferentials({ differentials }) {
  const [items, setItems] = useState(() =>
    differentials.map((d, i) => ({
      id: i,
      rank: d.rank,
      diagnosis: d.diagnosis,
      rationale: d.rationale || "",
      selected: false,
      editing: false,
    }))
  );
  const [newDx, setNewDx] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [copied, setCopied] = useState(false);
  const addRef = useRef(null);

  const prevRef = useRef(differentials);
  useEffect(() => {
    if (JSON.stringify(differentials) !== JSON.stringify(prevRef.current)) {
      prevRef.current = differentials;
      setItems(differentials.map((d, i) => ({ id: i, rank: d.rank, diagnosis: d.diagnosis, rationale: d.rationale || "", selected: false, editing: false })));
    }
  }, [differentials]);

  const toggle     = id => setItems(p => p.map(x => x.id === id ? { ...x, selected: !x.selected } : x));
  const startEdit  = id => { setItems(p => p.map(x => x.id === id ? { ...x, editing: true } : x)); };
  const saveEdit   = (id, val) => setItems(p => p.map(x => x.id === id ? { ...x, diagnosis: val, editing: false } : x));
  const cancelEdit = id => setItems(p => p.map(x => x.id === id ? { ...x, editing: false } : x));
  const remove     = id => setItems(p => { const next = p.filter(x => x.id !== id).map((x, i) => ({ ...x, rank: i + 1 })); return next; });
  const moveUp     = id => setItems(p => { const i = p.findIndex(x => x.id === id); if (i === 0) return p; const n = [...p]; [n[i-1], n[i]] = [n[i], n[i-1]]; return n.map((x, idx) => ({ ...x, rank: idx + 1 })); });
  const moveDown   = id => setItems(p => { const i = p.findIndex(x => x.id === id); if (i === p.length - 1) return p; const n = [...p]; [n[i], n[i+1]] = [n[i+1], n[i]]; return n.map((x, idx) => ({ ...x, rank: idx + 1 })); });

  const selectAll  = () => setItems(p => p.map(x => ({ ...x, selected: true })));
  const selectNone = () => setItems(p => p.map(x => ({ ...x, selected: false })));

  const addItem = () => {
    if (!newDx.trim()) return;
    const newId = Date.now();
    setItems(p => [...p, { id: newId, rank: p.length + 1, diagnosis: newDx.trim(), rationale: "", selected: true, editing: false }]);
    setNewDx("");
    setShowAdd(false);
  };

  const handleCopy = async () => {
    const selected = items.filter(x => x.selected);
    const src = selected.length > 0 ? selected : items;
    const text = "Differentials (ranked):\n" + src.map(x => x.rank + ". " + x.diagnosis).join("\n");
    try { await navigator.clipboard.writeText(text); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedCount = items.filter(x => x.selected).length;

  const S = {
    wrap: { marginTop: 10 },
    headerRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
    subHead: { fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: "rgba(200,223,240,0.45)", letterSpacing: "0.09em", textTransform: "uppercase" },
    controls: { display: "flex", gap: 5, alignItems: "center" },
    microBtn: { padding: "2px 7px", borderRadius: 3, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", border: "1px solid rgba(0,184,154,0.2)", background: "transparent", color: "rgba(200,223,240,0.35)" },
    copyBtn: { padding: "3px 9px", borderRadius: 4, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", border: copied ? "1px solid #00e5c0" : "1px solid rgba(0,184,154,0.25)", background: copied ? "rgba(0,229,192,0.12)" : "transparent", color: copied ? "#00e5c0" : "rgba(200,223,240,0.4)", transition: "all 0.15s" },
    addBtn: { padding: "3px 9px", borderRadius: 4, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", border: "1px solid rgba(0,184,154,0.25)", background: "transparent", color: "rgba(0,229,192,0.5)" },
    item: (sel) => ({ display: "flex", gap: 6, alignItems: "flex-start", padding: "6px 8px", borderRadius: 6, marginBottom: 4, background: sel ? "rgba(0,184,154,0.06)" : "rgba(11,30,54,0.3)", border: sel ? "1px solid rgba(0,184,154,0.2)" : "1px solid rgba(0,184,154,0.07)", transition: "all 0.1s", cursor: "pointer" }),
    checkbox: (sel) => ({ width: 14, height: 14, borderRadius: 3, flexShrink: 0, marginTop: 2, border: sel ? "1px solid #00e5c0" : "1px solid rgba(200,223,240,0.2)", background: sel ? "#00e5c0" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }),
    checkmark: { color: "#081628", fontSize: 9, fontWeight: 700, lineHeight: 1 },
    rankBadge: { fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 700, color: "#00b89a", minWidth: 16, flexShrink: 0, paddingTop: 2 },
    diagText: (sel) => ({ flex: 1, fontSize: 12.5, color: sel ? "#c8dff0" : "rgba(200,223,240,0.55)", lineHeight: 1.4, cursor: "pointer" }),
    editInput: { flex: 1, background: "rgba(11,30,54,0.7)", border: "1px solid rgba(0,229,192,0.35)", borderRadius: 4, color: "#c8dff0", fontFamily: "'DM Sans',sans-serif", fontSize: 12.5, padding: "2px 7px", outline: "none" },
    actionBtns: { display: "flex", gap: 4, flexShrink: 0 },
    iconBtn: (color) => ({ padding: "1px 5px", borderRadius: 3, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 9, border: "1px solid " + (color || "rgba(200,223,240,0.15)"), background: "transparent", color: color || "rgba(200,223,240,0.3)" }),
    addRow: { display: "flex", gap: 6, marginTop: 6 },
    addInput: { flex: 1, background: "rgba(11,30,54,0.7)", border: "1px solid rgba(0,229,192,0.3)", borderRadius: 5, color: "#c8dff0", fontFamily: "'DM Sans',sans-serif", fontSize: 12.5, padding: "6px 10px", outline: "none" },
    addConfirm: { padding: "6px 12px", borderRadius: 5, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 700, border: "1px solid #00e5c0", background: "rgba(0,229,192,0.1)", color: "#00e5c0" },
    addCancel: { padding: "6px 10px", borderRadius: 5, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 10, border: "1px solid rgba(200,223,240,0.15)", background: "transparent", color: "rgba(200,223,240,0.4)" },
    showAddBtn: { marginTop: 6, padding: "5px 0", width: "100%", borderRadius: 5, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", border: "1px dashed rgba(0,184,154,0.2)", background: "transparent", color: "rgba(0,229,192,0.45)" },
  };

  return (
    <div style={S.wrap}>
      <div style={S.headerRow}>
        <div style={S.subHead}>Differentials (ranked)</div>
        <div style={S.controls}>
          <button style={S.microBtn} onClick={selectAll}>All</button>
          <button style={S.microBtn} onClick={selectNone}>None</button>
          <button style={S.copyBtn} onClick={handleCopy}>
            {copied ? "✓ Copied" : selectedCount > 0 ? `Copy (${selectedCount})` : "Copy All"}
          </button>
          <button style={S.addBtn} onClick={() => { setShowAdd(true); setTimeout(() => addRef.current?.focus(), 50); }}>+ Add</button>
        </div>
      </div>

      {items.map((item, idx) => (
        <div key={item.id} style={S.item(item.selected)}>
          <div style={S.checkbox(item.selected)} onClick={() => toggle(item.id)}>
            {item.selected && <span style={S.checkmark}>✓</span>}
          </div>
          <span style={S.rankBadge}>{item.rank}.</span>
          {item.editing ? (
            <input
              autoFocus
              style={S.editInput}
              defaultValue={item.diagnosis}
              onBlur={e => saveEdit(item.id, e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") saveEdit(item.id, e.target.value);
                if (e.key === "Escape") cancelEdit(item.id);
              }}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <span style={S.diagText(item.selected)} onClick={() => toggle(item.id)} onDoubleClick={() => startEdit(item.id)} title="Click to select · Double-click to edit">
              {item.diagnosis}
              {item.rationale && <span style={{ color: "rgba(200,223,240,0.4)", fontStyle: "italic", marginLeft: 6, fontSize: 11.5 }}>— {item.rationale}</span>}
            </span>
          )}
          <div style={S.actionBtns}>
            {idx > 0 && <button style={S.iconBtn()} onClick={() => moveUp(item.id)} title="Move up">↑</button>}
            {idx < items.length - 1 && <button style={S.iconBtn()} onClick={() => moveDown(item.id)} title="Move down">↓</button>}
            {!item.editing && <button style={S.iconBtn()} onClick={() => startEdit(item.id)} title="Edit">✎</button>}
            <button style={S.iconBtn("rgba(255,77,79,0.4)")} onClick={() => remove(item.id)} title="Remove">✕</button>
          </div>
        </div>
      ))}

      {showAdd ? (
        <div style={S.addRow}>
          <input
            ref={addRef}
            style={S.addInput}
            value={newDx}
            onChange={e => setNewDx(e.target.value)}
            placeholder="Enter diagnosis..."
            onKeyDown={e => {
              if (e.key === "Enter") addItem();
              if (e.key === "Escape") { setShowAdd(false); setNewDx(""); }
            }}
          />
          <button style={S.addConfirm} onClick={addItem}>Add</button>
          <button style={S.addCancel} onClick={() => { setShowAdd(false); setNewDx(""); }}>Cancel</button>
        </div>
      ) : (
        <button style={S.showAddBtn} onClick={() => { setShowAdd(true); setTimeout(() => addRef.current?.focus(), 50); }}>
          + Add Differential
        </button>
      )}
    </div>
  );
}

// ─── INITIAL IMPRESSION DISPLAY ──────────────────────────────────────────────
export function InitialImpressionDisplay({ result }) {
  if (!result) return null;
  const imp  = result.initial_impression  || {};
  const hasImp  = imp.working_dx_line || imp.clinical_rationale || imp.cannot_exclude?.length || imp.differentials?.length;
  if (!hasImp) return null;

  const MONO = "'JetBrains Mono',monospace";
  const SANS = "'DM Sans',sans-serif";
  const SERIF = "'Playfair Display',serif";

  return (
    <div style={{
      background: "rgba(11,30,54,0.55)",
      border: "1px solid rgba(0,184,154,0.18)",
      borderRadius: 10,
      padding: "18px 20px",
    }}>

      {/* ── VITAL SIGNS ANALYSIS ── */}
      {imp.vital_analysis && (imp.vital_analysis.summary || imp.vital_analysis.abnormalities?.length > 0) && (
        <div style={{ background:"rgba(11,30,54,0.5)", border:"1px solid rgba(0,184,154,0.15)", borderRadius:8, padding:"12px 14px", marginBottom:14 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, color:"rgba(200,223,240,0.45)", letterSpacing:"0.09em", textTransform:"uppercase" }}>
              Vital Signs Analysis
            </span>
            {imp.vital_analysis.overall_stability && (
              <span style={{
                fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700,
                padding:"2px 8px", borderRadius:3, letterSpacing:"0.07em", textTransform:"uppercase",
                border: imp.vital_analysis.overall_stability === "Critical" ? "1px solid #ff4d4f"
                     : imp.vital_analysis.overall_stability === "Unstable" ? "1px solid #ff7a45"
                     : imp.vital_analysis.overall_stability === "Borderline stable" ? "1px solid #f5c842"
                     : "1px solid rgba(0,229,192,0.35)",
                color: imp.vital_analysis.overall_stability === "Critical" ? "#ff4d4f"
                     : imp.vital_analysis.overall_stability === "Unstable" ? "#ff7a45"
                     : imp.vital_analysis.overall_stability === "Borderline stable" ? "#f5c842"
                     : "#00e5c0",
              }}>
                {imp.vital_analysis.overall_stability}
              </span>
            )}
          </div>
          {imp.vital_analysis.summary && (
            <p style={{ fontSize:13, color:"#c8dff0", lineHeight:1.6, marginBottom: imp.vital_analysis.abnormalities?.length ? 10 : 0 }}>
              {imp.vital_analysis.summary}
            </p>
          )}
          {imp.vital_analysis.abnormalities?.map((a, i) => (
            <div key={i} style={{ display:"flex", gap:8, alignItems:"flex-start", marginBottom:4 }}>
              <span style={{
                fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700,
                padding:"1px 6px", borderRadius:3, flexShrink:0, letterSpacing:"0.06em", textTransform:"uppercase",
                border: a.severity === "Critical" ? "1px solid #ff4d4f"
                     : a.severity === "Concerning" ? "1px solid #f5a623"
                     : a.severity === "Mild" ? "1px solid #f5c842"
                     : "1px solid rgba(200,223,240,0.2)",
                color: a.severity === "Critical" ? "#ff4d4f"
                     : a.severity === "Concerning" ? "#f5a623"
                     : a.severity === "Mild" ? "#f5c842"
                     : "rgba(200,223,240,0.45)",
              }}>
                {a.vital}
              </span>
              <span style={{ fontSize:12.5, color:"#c8dff0" }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:"#a8d4f0", fontWeight:600 }}>{a.value}</span>
                {a.interpretation && <span style={{ color:"rgba(200,223,240,0.6)", marginLeft:6 }}>— {a.interpretation}</span>}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── HPI SYNTHESIS ── */}
      {imp.hpi_synthesis && Object.values(imp.hpi_synthesis).some(v => v) && (
        <div style={{ background:"rgba(11,30,54,0.5)", border:"1px solid rgba(0,184,154,0.15)", borderRadius:8, padding:"12px 14px", marginBottom:14 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, color:"rgba(200,223,240,0.45)", letterSpacing:"0.09em", textTransform:"uppercase" }}>
              HPI Synthesis
            </span>
            {imp.hpi_synthesis.clinical_concern_level && (
              <span style={{
                fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700,
                padding:"2px 8px", borderRadius:3, letterSpacing:"0.07em", textTransform:"uppercase",
                border: imp.hpi_synthesis.clinical_concern_level === "High" ? "1px solid #ff4d4f"
                     : imp.hpi_synthesis.clinical_concern_level === "Moderate" ? "1px solid #f5c842"
                     : "1px solid rgba(0,184,154,0.35)",
                color: imp.hpi_synthesis.clinical_concern_level === "High" ? "#ff4d4f"
                     : imp.hpi_synthesis.clinical_concern_level === "Moderate" ? "#f5c842"
                     : "#00b89a",
              }}>
                {imp.hpi_synthesis.clinical_concern_level} Concern
              </span>
            )}
          </div>
          {[
            { key:"onset_and_timeline",    label:"Onset & Timeline" },
            { key:"character_and_severity",label:"Character & Severity" },
            { key:"associated_symptoms",   label:"Associated Symptoms" },
            { key:"modifying_factors",     label:"Modifying Factors" },
            { key:"pertinent_negatives",   label:"Pertinent Negatives" },
          ].map(row => imp.hpi_synthesis[row.key] ? (
            <div key={row.key} style={{ display:"flex", gap:10, marginBottom:6, alignItems:"flex-start" }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9.5, color:"rgba(200,223,240,0.4)", letterSpacing:"0.06em", textTransform:"uppercase", minWidth:130, flexShrink:0, paddingTop:2 }}>
                {row.label}
              </span>
              <span style={{ fontSize:12.5, color:"#c8dff0", lineHeight:1.5, flex:1 }}>
                {imp.hpi_synthesis[row.key]}
              </span>
            </div>
          ) : null)}
        </div>
      )}

      {/* ── INITIAL IMPRESSION ── */}
      {hasImp && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontFamily: SERIF, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.13em", color: "#00e5c0", marginBottom: 0 }}>
              Initial Impression
            </div>
            <SectionCopyBtn
              label="Copy Section"
              buildText={() => {
                const imp  = result?.initial_impression  || {};
                const lines = [];
                lines.push("INITIAL IMPRESSION");
                if (imp.working_dx_line) lines.push("Working diagnosis: " + imp.working_dx_line);
                if (imp.clinical_rationale) lines.push(imp.clinical_rationale);
                (imp.cannot_exclude || []).forEach(s => lines.push(s));
                if (imp.differentials?.length) { lines.push("Differentials (ranked):"); imp.differentials.forEach(d => lines.push(d.rank + ". " + d.diagnosis)); }
                return lines.join("\n");
              }}
            />
          </div>

          {imp.working_dx_line && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontFamily: MONO, fontSize: 10, textTransform: "uppercase", color: "rgba(200,223,240,0.45)", marginBottom: 4 }}>
                Working Diagnosis
              </div>
              <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: "#f5c842" }}>
                {imp.working_dx_line}
              </div>
            </div>
          )}

          {imp.clinical_rationale && (
            <div style={{ fontFamily: SANS, fontSize: 13, color: "#c8dff0", lineHeight: 1.6, marginBottom: 10 }}>
              {imp.clinical_rationale}
            </div>
          )}

          {imp.cannot_exclude?.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              {imp.cannot_exclude.map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 7, alignItems: "flex-start", marginBottom: 5 }}>
                  <span style={{ color: "#f5c842", fontSize: 12, flexShrink: 0, marginTop: 1 }}>▸</span>
                  <span style={{ fontFamily: SANS, fontSize: 13, color: "#e0c97a", lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
            </div>
          )}

          {imp.differentials?.length > 0 && (
            <InteractiveDifferentials differentials={imp.differentials} />
          )}
        </div>
      )}

    </div>
  );
}

// ─── ASSESSMENT & PLAN MANAGER ───────────────────────────────────────────────
function AssessmentPlanManager({ triage, guideline, interventions, diagnostics, medications, monitoring, pendingSummary, attestation }) {
  const ivList  = useEditableList(interventions);
  const dxList  = useEditableList(diagnostics, d => d.test+(d.rationale?": "+d.rationale:""));
  const monList = useEditableList(monitoring);
  const [pending, setPending] = useState(pendingSummary||"");
  const [copiedAll, setCopiedAll] = useState(false);
  const DCOL = { "Emergent":"#ff4d4f","Urgent":"#f5c842","Less Urgent":"#00b89a","Non-Urgent":"rgba(200,223,240,0.5)" };
  const dc = DCOL[triage?.acuity]||"#f5c842";
  const div = { border:"none",borderTop:"1px solid rgba(0,184,154,0.1)",margin:"10px 0" };

  const copyAll = async () => {
    const L = [];
    if (triage?.acuity||triage?.rationale) { L.push("TRIAGE: "+(triage.acuity||"")+(triage.rationale?" -- "+triage.rationale:"")); L.push(""); }
    if (ivList.checked.length)  { L.push("IMMEDIATE INTERVENTIONS:"); ivList.checked.forEach(x=>L.push("- "+x.text)); L.push(""); }
    if (dxList.checked.length)  { L.push("DIAGNOSTICS:"); dxList.checked.forEach(x=>L.push("- "+x.text)); L.push(""); }
    if (monList.checked.length) { L.push("MONITORING AND SAFETY:"); monList.checked.forEach(x=>L.push("- "+x.text)); L.push(""); }
    if (pending.trim()) { L.push("PENDING DATA: "+pending.trim()); L.push(""); }
    if (guideline?.society) { L.push("Guideline: "+guideline.society+" -- "+guideline.policy_name+(guideline.year?" ("+guideline.year+")":"")); if(guideline.key_recommendation) L.push(guideline.key_recommendation); }
    if (attestation) { L.push(""); L.push("AI-generated recommendations. Physician attestation and clinical correlation required."); }
    try { await navigator.clipboard.writeText(L.join("\n")); } catch {}
    setCopiedAll(true); setTimeout(()=>setCopiedAll(false),2000);
  };

  return (
    <div style={{ background:"rgba(11,30,54,0.55)",border:"1px solid rgba(0,184,154,0.18)",borderRadius:10,padding:"18px 20px",fontFamily:"'DM Sans',sans-serif",color:"#c8dff0",lineHeight:1.65,marginTop:10 }}>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14 }}>
        <p style={{ fontFamily:"'Playfair Display',serif",fontSize:11,fontWeight:700,letterSpacing:"0.13em",textTransform:"uppercase",color:"#00e5c0",margin:0 }}>Assessment & Plan</p>
        <button onClick={copyAll} style={{ padding:"5px 14px",borderRadius:5,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:700,letterSpacing:"0.07em",textTransform:"uppercase",border:copiedAll?"1px solid #00e5c0":"1px solid rgba(0,184,154,0.3)",background:copiedAll?"rgba(0,229,192,0.12)":"rgba(0,184,154,0.06)",color:copiedAll?"#00e5c0":"rgba(200,223,240,0.5)",transition:"all 0.15s" }}>
          {copiedAll?"✓ Copied":"⎘ Copy All"}
        </button>
      </div>

      {(triage?.acuity||triage?.rationale) && (
        <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:12,flexWrap:"wrap" }}>
          {triage.acuity&&<span style={{ display:"inline-flex",alignItems:"center",padding:"3px 12px",borderRadius:5,border:"1px solid "+dc,color:dc,fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase" }}>{triage.acuity}</span>}
          {triage.rationale&&<span style={{ fontSize:13,color:"#c8dff0",flex:1 }}>{triage.rationale}</span>}
        </div>
      )}

      {guideline?.society && (
        <div style={{ background:"rgba(0,184,154,0.06)",border:"1px solid rgba(0,184,154,0.25)",borderRadius:7,padding:"10px 12px",marginBottom:14 }}>
          <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:4 }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700,color:"#00b89a",letterSpacing:"0.08em",textTransform:"uppercase",border:"1px solid rgba(0,184,154,0.3)",borderRadius:3,padding:"1px 6px" }}>{guideline.society}</span>
            <span style={{ fontSize:12.5,fontWeight:600,color:"#a8d4f0" }}>{guideline.policy_name}{guideline.year&&<span style={{ fontWeight:400,color:"rgba(200,223,240,0.4)",marginLeft:6 }}>({guideline.year})</span>}</span>
            {guideline.evidence_level&&<span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700,color:"#f5c842",border:"1px solid rgba(245,200,66,0.3)",borderRadius:3,padding:"1px 5px",marginLeft:"auto",flexShrink:0 }}>{guideline.evidence_level}</span>}
          </div>
          {guideline.key_recommendation&&<p style={{ fontSize:12,color:"rgba(200,223,240,0.6)",fontStyle:"italic",margin:0 }}>{guideline.key_recommendation}</p>}
        </div>
      )}

      <hr style={div} />
      <SubsectionList label="Immediate Interventions" list={ivList} onAddLabel="Add Intervention" />
      <hr style={div} />
      <SubsectionList label="Diagnostics" list={dxList} onAddLabel="Add Diagnostic" />
      <hr style={div} />
      <MedicationManager aiMedications={medications} />
      <hr style={div} />
      <SubsectionList label="Monitoring & Safety" list={monList} onAddLabel="Add Monitoring Item" />
      <hr style={div} />

      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:10,fontFamily:"'JetBrains Mono',monospace",color:"rgba(200,223,240,0.45)",letterSpacing:"0.09em",textTransform:"uppercase",marginBottom:6 }}>Pending Data</div>
        <textarea value={pending} onChange={e=>setPending(e.target.value)} rows={2} placeholder="Results pending and next steps..."
          style={{ width:"100%",boxSizing:"border-box",background:"rgba(11,30,54,0.6)",border:"1px solid rgba(0,184,154,0.15)",borderRadius:6,color:"#c8dff0",fontFamily:"'DM Sans',sans-serif",fontSize:13,padding:"8px 10px",outline:"none",resize:"vertical",lineHeight:1.55 }} />
      </div>

      {attestation&&<p style={{ marginTop:10,paddingTop:10,borderTop:"1px solid rgba(0,184,154,0.08)",fontSize:11,color:"rgba(200,223,240,0.35)",fontStyle:"italic",textAlign:"center" }}>AI-generated recommendations. Physician attestation and clinical correlation required.</p>}
    </div>
  );
}

// ─── TREATMENT DISPLAY ────────────────────────────────────────────────────────
export function TreatmentDisplay({ result }) {
  if (!result) return null;
  return (
    <AssessmentPlanManager
      triage={{ acuity: result.triage_acuity, rationale: result.triage_rationale }}
      guideline={result.acep_guideline}
      interventions={result.immediate_interventions || []}
      diagnostics={result.diagnostics || []}
      medications={result.medications || []}
      monitoring={result.monitoring_safety || []}
      pendingSummary={result.pending_data_summary || ""}
      attestation={result.attestation_required}
    />
  );
}