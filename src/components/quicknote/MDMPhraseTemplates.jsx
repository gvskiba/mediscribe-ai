// MDMPhraseTemplates.jsx — Save & reuse custom MDM phrasing templates
// Stored in localStorage under "qn_mdm_templates_v1"
import React, { useState, useEffect } from "react";

const LS_KEY = "qn_mdm_templates_v1";

const CATEGORIES = [
  "Cardiac Risk","Head & Neuro","Cervical Spine","Pulmonary / PE",
  "Orthopedic","Infectious / Sepsis","Abdominal","Syncope",
  "Toxicology","General MDM","Custom",
];

function loadTemplates() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; }
  catch { return []; }
}
function saveTemplates(list) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch {}
}

export function MDMPhraseTemplates({ onInsert, currentNarrative }) {
  const [templates, setTemplates] = useState(loadTemplates);
  const [open, setOpen]           = useState(false);
  const [tab, setTab]             = useState("browse"); // browse | new
  const [search, setSearch]       = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [inserted, setInserted]   = useState({});

  // New template form state
  const [form, setForm] = useState({ name:"", text:"", category:"General MDM", tool:"" });
  const [saveFromNarrative, setSaveFromNarrative] = useState(false);

  useEffect(() => { saveTemplates(templates); }, [templates]);

  const filtered = templates.filter(t => {
    const matchCat = filterCat === "All" || t.category === filterCat;
    const matchQ   = !search.trim() ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.text.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchQ;
  });

  const handleSave = () => {
    if (!form.text.trim()) return;
    const entry = {
      id: Date.now().toString(),
      name: form.name.trim() || form.text.slice(0, 40),
      text: form.text.trim(),
      category: form.category,
      tool: form.tool.trim() || "Custom",
      savedAt: Date.now(),
    };
    setTemplates(prev => [entry, ...prev]);
    setForm({ name:"", text:"", category:"General MDM", tool:"" });
    setSaveFromNarrative(false);
    setTab("browse");
  };

  const handleDelete = (id) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  const handleInsert = (t) => {
    onInsert(t.text);
    setInserted(prev => ({ ...prev, [t.id]: true }));
    setTimeout(() => setInserted(prev => { const n={...prev}; delete n[t.id]; return n; }), 3000);
  };

  const handleSaveFromNarrative = () => {
    setForm(f => ({ ...f, text: currentNarrative || "" }));
    setSaveFromNarrative(true);
    setTab("new");
  };

  if (!open) return (
    <button onClick={() => setOpen(true)} style={{
      marginTop:8, padding:"4px 13px", borderRadius:7, cursor:"pointer",
      fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
      letterSpacing:.5, border:"1px solid rgba(61,255,160,.3)",
      background:"rgba(61,255,160,.05)", color:"var(--qn-green)",
      display:"inline-flex", alignItems:"center", gap:7, transition:"all .15s",
    }}>
      ⭐ My MDM Templates
      {templates.length > 0 && (
        <span style={{
          fontFamily:"'JetBrains Mono',monospace", fontSize:7,
          color:"rgba(61,255,160,.7)", background:"rgba(61,255,160,.1)",
          border:"1px solid rgba(61,255,160,.25)", borderRadius:3, padding:"1px 6px",
        }}>{templates.length}</span>
      )}
    </button>
  );

  return (
    <div className="qn-fade" style={{
      marginTop:10, borderRadius:12, overflow:"hidden",
      background:"rgba(8,22,40,.65)", border:"1px solid rgba(61,255,160,.25)",
    }}>
      {/* Header */}
      <div style={{
        display:"flex", alignItems:"center", gap:10, padding:"10px 14px",
        borderBottom:"1px solid rgba(42,79,122,.3)", background:"rgba(61,255,160,.04)",
      }}>
        <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:14, color:"var(--qn-green)", flex:1 }}>
          My MDM Templates
        </span>
        {/* Tabs */}
        {["browse","new"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding:"3px 10px", borderRadius:5, cursor:"pointer",
            fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
            border:`1px solid ${tab===t?"rgba(61,255,160,.5)":"rgba(42,79,122,.35)"}`,
            background:tab===t?"rgba(61,255,160,.1)":"transparent",
            color:tab===t?"var(--qn-green)":"var(--qn-txt4)",
          }}>
            {t==="browse" ? `Browse (${templates.length})` : "+ New Template"}
          </button>
        ))}
        {currentNarrative && tab==="browse" && (
          <button onClick={handleSaveFromNarrative} style={{
            padding:"3px 10px", borderRadius:5, cursor:"pointer",
            fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
            border:"1px solid rgba(0,229,192,.4)", background:"rgba(0,229,192,.07)",
            color:"var(--qn-teal)",
          }}>
            ↓ Save Current MDM
          </button>
        )}
        <button onClick={() => { setOpen(false); setTab("browse"); setSearch(""); }} style={{
          padding:"3px 8px", borderRadius:5, cursor:"pointer",
          fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          border:"1px solid rgba(42,79,122,.35)", background:"transparent", color:"var(--qn-txt4)",
        }}>✕</button>
      </div>

      {/* Browse tab */}
      {tab === "browse" && (
        <>
          {templates.length > 0 && (
            <div style={{ display:"flex", gap:8, padding:"8px 14px 6px", borderBottom:"1px solid rgba(42,79,122,.2)", flexWrap:"wrap", alignItems:"center" }}>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search templates…"
                style={{ padding:"4px 10px", borderRadius:6, flex:1, minWidth:120, maxWidth:200,
                  background:"rgba(14,37,68,.7)", border:"1px solid rgba(42,79,122,.5)",
                  color:"var(--qn-txt)", fontFamily:"'DM Sans',sans-serif", fontSize:11, outline:"none" }} />
              <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{
                padding:"4px 8px", borderRadius:6, background:"rgba(14,37,68,.7)",
                border:"1px solid rgba(42,79,122,.5)", color:"var(--qn-txt4)",
                fontFamily:"'JetBrains Mono',monospace", fontSize:8, outline:"none",
              }}>
                <option value="All">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          <div style={{ padding:"8px 14px", display:"flex", flexDirection:"column", gap:5, minHeight:60 }}>
            {templates.length === 0 ? (
              <div style={{ padding:"20px 0", textAlign:"center" }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"var(--qn-txt4)", marginBottom:8 }}>
                  No templates saved yet
                </div>
                <button onClick={() => setTab("new")} style={{
                  padding:"5px 14px", borderRadius:7, cursor:"pointer",
                  fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
                  border:"1px solid rgba(61,255,160,.4)", background:"rgba(61,255,160,.08)",
                  color:"var(--qn-green)",
                }}>
                  + Create your first template
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"var(--qn-txt4)", padding:"10px 0", textAlign:"center" }}>
                No templates match your search
              </div>
            ) : filtered.map(t => (
              <div key={t.id} style={{
                display:"flex", alignItems:"flex-start", gap:10, padding:"9px 11px",
                borderRadius:8, background:"rgba(14,37,68,.5)",
                border:`1px solid ${inserted[t.id]?"rgba(61,255,160,.4)":"rgba(42,79,122,.3)"}`,
                transition:"border-color .15s",
              }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4, flexWrap:"wrap" }}>
                    <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:700, color:"var(--qn-txt)" }}>
                      {t.name}
                    </span>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7, fontWeight:700,
                      color:"var(--qn-teal)", background:"rgba(0,229,192,.08)",
                      border:"1px solid rgba(0,229,192,.2)", borderRadius:3, padding:"1px 6px" }}>
                      {t.tool}
                    </span>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                      color:"rgba(107,158,200,.5)" }}>
                      {t.category}
                    </span>
                  </div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                    color:inserted[t.id]?"var(--qn-green)":"var(--qn-txt2)", lineHeight:1.6,
                    overflow:"hidden", display:"-webkit-box", WebkitLineClamp:3, WebkitBoxOrient:"vertical" }}>
                    {t.text}
                  </div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:4, flexShrink:0 }}>
                  <button onClick={() => handleInsert(t)} style={{
                    padding:"3px 10px", borderRadius:5, cursor:"pointer",
                    fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
                    border:`1px solid ${inserted[t.id]?"rgba(61,255,160,.5)":"rgba(61,255,160,.35)"}`,
                    background:inserted[t.id]?"rgba(61,255,160,.12)":"rgba(61,255,160,.06)",
                    color:inserted[t.id]?"var(--qn-green)":"var(--qn-green)", whiteSpace:"nowrap",
                  }}>
                    {inserted[t.id] ? "✓ Added" : "→ Insert"}
                  </button>
                  <button onClick={() => handleDelete(t.id)} style={{
                    padding:"3px 8px", borderRadius:5, cursor:"pointer",
                    fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                    border:"1px solid rgba(255,107,107,.25)", background:"transparent",
                    color:"rgba(255,107,107,.5)",
                  }}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* New template tab */}
      {tab === "new" && (
        <div style={{ padding:"14px" }}>
          {saveFromNarrative && (
            <div style={{ marginBottom:10, padding:"7px 12px", borderRadius:7,
              background:"rgba(0,229,192,.06)", border:"1px solid rgba(0,229,192,.25)",
              fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"var(--qn-teal)" }}>
              ↓ Saving current MDM narrative — add a name and save
            </div>
          )}
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div>
              <label style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"var(--qn-txt4)", letterSpacing:.8, display:"block", marginBottom:4 }}>
                TEMPLATE NAME
              </label>
              <input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))}
                placeholder="e.g. Low-risk chest pain discharge MDM"
                style={{ width:"100%", padding:"7px 10px", borderRadius:7,
                  background:"rgba(14,37,68,.7)", border:"1px solid rgba(42,79,122,.5)",
                  color:"var(--qn-txt)", fontFamily:"'DM Sans',sans-serif", fontSize:12, outline:"none",
                  boxSizing:"border-box" }} />
            </div>

            <div style={{ display:"flex", gap:10 }}>
              <div style={{ flex:1 }}>
                <label style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"var(--qn-txt4)", letterSpacing:.8, display:"block", marginBottom:4 }}>
                  CATEGORY
                </label>
                <select value={form.category} onChange={e => setForm(f=>({...f,category:e.target.value}))} style={{
                  width:"100%", padding:"7px 10px", borderRadius:7,
                  background:"rgba(14,37,68,.7)", border:"1px solid rgba(42,79,122,.5)",
                  color:"var(--qn-txt4)", fontFamily:"'JetBrains Mono',monospace", fontSize:8, outline:"none",
                }}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ flex:1 }}>
                <label style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"var(--qn-txt4)", letterSpacing:.8, display:"block", marginBottom:4 }}>
                  TOOL / SCORE TAG
                </label>
                <input value={form.tool} onChange={e => setForm(f=>({...f,tool:e.target.value}))}
                  placeholder="e.g. HEART, SDM, Custom"
                  style={{ width:"100%", padding:"7px 10px", borderRadius:7,
                    background:"rgba(14,37,68,.7)", border:"1px solid rgba(42,79,122,.5)",
                    color:"var(--qn-txt)", fontFamily:"'DM Sans',sans-serif", fontSize:12, outline:"none" }} />
              </div>
            </div>

            <div>
              <label style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"var(--qn-txt4)", letterSpacing:.8, display:"block", marginBottom:4 }}>
                MDM PHRASE / TEXT
              </label>
              <textarea value={form.text} onChange={e => setForm(f=>({...f,text:e.target.value}))}
                placeholder="Paste or type your preferred MDM phrasing here…"
                rows={5}
                style={{ width:"100%", padding:"8px 10px", borderRadius:7,
                  background:"rgba(14,37,68,.7)", border:"1px solid rgba(42,79,122,.5)",
                  color:"var(--qn-txt)", fontFamily:"'DM Sans',sans-serif", fontSize:12,
                  lineHeight:1.65, outline:"none", resize:"vertical", boxSizing:"border-box" }} />
            </div>

            <div style={{ display:"flex", gap:8 }}>
              <button onClick={handleSave} disabled={!form.text.trim()} style={{
                padding:"7px 18px", borderRadius:7, cursor:form.text.trim()?"pointer":"default",
                fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:12,
                border:`1px solid ${form.text.trim()?"rgba(61,255,160,.5)":"rgba(42,79,122,.3)"}`,
                background:form.text.trim()?"rgba(61,255,160,.12)":"rgba(14,37,68,.4)",
                color:form.text.trim()?"var(--qn-green)":"var(--qn-txt4)",
                transition:"all .15s",
              }}>
                ⭐ Save Template
              </button>
              <button onClick={() => { setTab("browse"); setSaveFromNarrative(false); setForm({name:"",text:"",category:"General MDM",tool:""}); }} style={{
                padding:"7px 14px", borderRadius:7, cursor:"pointer",
                fontFamily:"'DM Sans',sans-serif", fontSize:12,
                border:"1px solid rgba(42,79,122,.35)", background:"transparent", color:"var(--qn-txt4)",
              }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding:"6px 14px 10px", fontFamily:"'JetBrains Mono',monospace", fontSize:7, color:"rgba(107,158,200,.4)", letterSpacing:.4 }}>
        Saved locally in your browser · → Insert appends to MDM narrative
      </div>
    </div>
  );
}