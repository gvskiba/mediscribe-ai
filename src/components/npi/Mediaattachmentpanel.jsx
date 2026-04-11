import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { MEDIA_CATEGORIES, BODY_REGIONS, DISPOSITION_OPTS } from "@/components/npi/npiData";

export default function MediaAttachmentPanel({
  open, onClose,
  attachments, setAttachments,
  patientName, demo, cc, providerName,
}) {
  const [activeTab,   setActiveTab]   = useState("attach");
  const [dragOver,    setDragOver]    = useState(false);
  const [staged,      setStaged]      = useState(null);
  const [stagedCat,   setStagedCat]   = useState("");
  const [stagedReg,   setStagedReg]   = useState("");
  const [stagedCap,   setStagedCap]   = useState("");
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const [analyzing,   setAnalyzing]   = useState(null);
  const [editCap,     setEditCap]     = useState("");
  const [editMode,    setEditMode]    = useState(false);
  const fileRef = useRef(null);

  const lightboxItem = lightboxIdx !== null ? attachments[lightboxIdx] : null;

  function handleFiles(fileList) {
    const file = Array.from(fileList).find(f => f.type.startsWith("image/") || f.type === "application/pdf");
    if (!file) { toast.error("Unsupported file type — images only"); return; }
    if (file.size > 15 * 1024 * 1024) { toast.error("File too large (max 15\u2005MB)"); return; }
    const reader = new FileReader();
    reader.onload = e => {
      setStaged({ file, dataUrl: e.target.result });
      setStagedCat(""); setStagedReg(""); setStagedCap("");
    };
    reader.readAsDataURL(file);
  }

  function commitAttachment() {
    if (!staged) return;
    const entry = {
      id: Date.now(), ts: Date.now(),
      name: staged.file.name, size: staged.file.size, type: staged.file.type,
      dataUrl: staged.dataUrl,
      category: stagedCat, region: stagedReg, caption: stagedCap.trim(),
      author: providerName || "Provider",
      aiAnalysis: null,
    };
    setAttachments(p => [entry, ...p]);
    setStaged(null); setStagedCat(""); setStagedReg(""); setStagedCap("");
    setActiveTab("gallery");
    toast.success("Image attached to chart");
  }

  function deleteAttachment(id) {
    setAttachments(p => p.filter(a => a.id !== id));
    if (lightboxIdx !== null) setLightboxIdx(null);
  }

  async function analyzeAttachment(att) {
    setAnalyzing(att.id);
    try {
      const ctx = [
        att.category  ? `Image type: ${att.category}`              : "",
        att.region    ? `Body region: ${att.region}`               : "",
        att.caption   ? `Provider note: "${att.caption}"`          : "",
        cc.text       ? `Patient chief complaint: ${cc.text}`      : "",
        demo.age      ? `Patient age: ${demo.age}y ${demo.sex||""}`: "",
      ].filter(Boolean).join(". ");
      const prompt = [
        "You are a clinical documentation assistant for an emergency physician.",
        "Generate a concise (2-3 sentence) clinical documentation note for a medical image.",
        "Use precise, objective language appropriate for an ED chart note.",
        `Image context: ${ctx}.`,
        "Do not speculate about diagnoses not supported by the context.",
        "Format: plain sentences, no headers, suitable for direct inclusion in a chart.",
      ].join(" ");
      const res = await base44.integrations.Core.InvokeLLM({ prompt });
      const text = typeof res === "string" ? res : (res?.content || res?.text || "");
      setAttachments(p => p.map(a => a.id === att.id ? { ...a, aiAnalysis: text } : a));
    } catch(_) {
      toast.error("AI analysis failed — add a manual description in the caption");
    } finally { setAnalyzing(null); }
  }

  function formatSize(bytes) {
    return bytes < 1024 * 1024 ? `${Math.round(bytes/1024)}\u2005KB` : `${(bytes/(1024*1024)).toFixed(1)}\u2005MB`;
  }

  const elapsed = ms => {
    const m = Math.floor((Date.now() - ms) / 60000);
    return m < 1 ? "just now" : m < 60 ? `${m}m ago` : `${Math.floor(m/60)}h ${m%60}m ago`;
  };

  const catMeta  = c => MEDIA_CATEGORIES.find(x => x.label === c);
  const TABS = [
    { id:"attach",  label:"Attach",  icon:"\uD83D\uDCCE" },
    { id:"gallery", label:"Gallery", icon:"\uD83D\uDDBC\uFE0F", badge: attachments.length },
    { id:"log",     label:"Log",     icon:"\uD83D\uDD50" },
  ];

  const chipBase = (active, col) => ({
    padding:"3px 10px", borderRadius:20, cursor:"pointer",
    fontFamily:"'DM Sans',sans-serif", fontSize:11,
    fontWeight: active ? 600 : 400, transition:"all .12s",
    border:`1px solid ${active ? col+"88" : "rgba(42,77,114,0.4)"}`,
    background: active ? col+"18" : "transparent",
    color: active ? col : "var(--npi-txt3)",
  });

  const fieldBase = {
    background:"rgba(8,24,48,0.75)", border:"1px solid rgba(26,53,85,0.55)",
    borderRadius:7, padding:"7px 10px", color:"var(--npi-txt)",
    fontFamily:"'DM Sans',sans-serif", fontSize:13, outline:"none", boxSizing:"border-box",
  };

  const lblBase = {
    fontFamily:"'JetBrains Mono',monospace", fontSize:8,
    color:"var(--npi-txt4)", letterSpacing:.8, textTransform:"uppercase", marginBottom:5,
  };

  if (!open) return null;

  return (
    <>
      {/* Scrim */}
      <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:9984,
        background:"rgba(2,8,18,0.4)", backdropFilter:"blur(2px)" }} />

      {/* Panel */}
      <div style={{ position:"fixed", top:0, right:0, bottom:0, width:460, zIndex:9985,
        background:"#060f20", borderLeft:"1px solid rgba(26,53,85,0.7)",
        display:"flex", flexDirection:"column",
        boxShadow:"-10px 0 48px rgba(0,0,0,0.65)" }}>

        {/* ── Header ── */}
        <div style={{ padding:"12px 16px 10px", borderBottom:"1px solid rgba(26,53,85,0.5)",
          background:"rgba(5,14,28,0.95)", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:9 }}>
              <span style={{ fontSize:18 }}>📎</span>
              <div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
                  fontSize:14, color:"var(--npi-txt)" }}>Media Attachments</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                  color:"var(--npi-txt4)", marginTop:1 }}>
                  {patientName}{demo.age ? ` \xb7 ${demo.age}y` : ""}{demo.sex ? ` \xb7 ${demo.sex}` : ""}
                  {attachments.length > 0 ? ` \xb7 ${attachments.length} image${attachments.length > 1 ? "s" : ""}` : ""}
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{ width:26, height:26, borderRadius:13,
              border:"1px solid rgba(42,77,114,0.5)", background:"rgba(14,37,68,0.7)",
              color:"var(--npi-txt4)", fontSize:12, cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              \u2715
            </button>
          </div>
        </div>

        {/* ── Sub-tab bar ── */}
        <div style={{ display:"flex", borderBottom:"1px solid rgba(26,53,85,0.45)",
          background:"rgba(5,12,24,0.7)", flexShrink:0 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{ flex:1, padding:"9px 4px", border:"none", cursor:"pointer",
                borderBottom: activeTab===t.id ? "2px solid var(--npi-teal)" : "2px solid transparent",
                background:"transparent",
                fontFamily:"'DM Sans',sans-serif", fontSize:11,
                fontWeight: activeTab===t.id ? 700 : 400,
                color: activeTab===t.id ? "var(--npi-teal)" : "var(--npi-txt4)",
                display:"flex", flexDirection:"column", alignItems:"center", gap:2,
                position:"relative", transition:"all .12s" }}>
              <span style={{ fontSize:14 }}>{t.icon}</span>
              <span>{t.label}</span>
              {t.badge > 0 && (
                <span style={{ position:"absolute", top:5, right:"18%", minWidth:14, height:14,
                  borderRadius:7, background:"var(--npi-teal)", color:"#050f1e",
                  fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
                  display:"flex", alignItems:"center", justifyContent:"center", padding:"0 3px" }}>
                  {t.badge > 9 ? "9+" : t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        <div style={{ flex:1, overflowY:"auto", padding:"14px 16px" }}>

          {/* ──── ATTACH TAB ──── */}
          {activeTab === "attach" && (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {/* Hidden file input */}
              <input ref={fileRef} type="file" accept="image/*,application/pdf"
                style={{ display:"none" }}
                onChange={e => { if (e.target.files[0]) handleFiles(e.target.files); e.target.value=""; }} />

              {/* Drop zone */}
              {!staged && (
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                  onClick={() => fileRef.current?.click()}
                  style={{ border:`2px dashed ${dragOver ? "var(--npi-teal)" : "rgba(42,77,114,0.5)"}`,
                    borderRadius:12, padding:"32px 20px",
                    background: dragOver ? "rgba(0,229,192,0.05)" : "rgba(14,37,68,0.4)",
                    display:"flex", flexDirection:"column", alignItems:"center", gap:10,
                    cursor:"pointer", transition:"all .15s", userSelect:"none" }}>
                  <span style={{ fontSize:36 }}>📷</span>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13,
                    fontWeight:600, color:"var(--npi-txt)", textAlign:"center" }}>
                    Drop image here or click to browse
                  </div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                    color:"var(--npi-txt4)", textAlign:"center" }}>
                    Photos, ECG strips, wound images \xb7 JPEG, PNG, PDF \xb7 max 15\u2005MB
                  </div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                    padding:"4px 12px", borderRadius:5, letterSpacing:1,
                    border:"1px solid rgba(0,229,192,0.3)", color:"var(--npi-teal)",
                    background:"rgba(0,229,192,0.06)", textTransform:"uppercase" }}>
                    Browse files
                  </div>
                </div>
              )}

              {/* Staged preview + tagging form */}
              {staged && (
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {/* Preview */}
                  <div style={{ display:"flex", gap:12, alignItems:"flex-start",
                    padding:"12px", borderRadius:10,
                    background:"rgba(14,37,68,0.6)", border:"1px solid rgba(26,53,85,0.5)" }}>
                    <img src={staged.dataUrl} alt="preview"
                      style={{ width:96, height:96, objectFit:"cover", borderRadius:8,
                        border:"1px solid rgba(42,77,114,0.4)", flexShrink:0 }} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
                        fontWeight:600, color:"var(--npi-txt)",
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {staged.file.name}
                      </div>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                        color:"var(--npi-txt4)", marginTop:2 }}>
                        {formatSize(staged.file.size)} \xb7 {staged.file.type.split("/")[1]?.toUpperCase()}
                      </div>
                      <button onClick={() => setStaged(null)}
                        style={{ marginTop:8, fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                          letterSpacing:1, textTransform:"uppercase",
                          padding:"3px 9px", borderRadius:4, cursor:"pointer",
                          border:"1px solid rgba(255,107,107,0.35)", background:"transparent",
                          color:"#ff8a8a" }}>
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <div style={lblBase}>Clinical Category</div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                      {MEDIA_CATEGORIES.map(cat => (
                        <button key={cat.label} onClick={() => setStagedCat(c => c === cat.label ? "" : cat.label)}
                          style={{ ...chipBase(stagedCat === cat.label, cat.col),
                            display:"flex", alignItems:"center", gap:4 }}>
                          <span style={{ fontSize:11 }}>{cat.icon}</span>{cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Body region */}
                  <div>
                    <div style={lblBase}>Body Region</div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                      {BODY_REGIONS.map(r => (
                        <button key={r} onClick={() => setStagedReg(x => x === r ? "" : r)}
                          style={{ ...chipBase(stagedReg === r, "#3b9eff") }}>
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Caption */}
                  <div>
                    <div style={lblBase}>Caption / Clinical Note</div>
                    <textarea value={stagedCap} onChange={e => setStagedCap(e.target.value)} rows={2}
                      placeholder="e.g. 3cm stellate laceration requiring closure, distal pulse intact..."
                      style={{ ...fieldBase, width:"100%", resize:"none", lineHeight:1.55 }} />
                  </div>

                  {/* Commit */}
                  <button onClick={commitAttachment}
                    style={{ padding:"10px 18px", borderRadius:9,
                      background:"linear-gradient(135deg,#00e5c0,#00b4d8)", border:"none",
                      color:"#050f1e", fontFamily:"'DM Sans',sans-serif",
                      fontWeight:700, fontSize:13, cursor:"pointer",
                      display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
                    📎 Attach to Chart
                  </button>
                </div>
              )}

              {/* Quick category legend */}
              {!staged && (
                <div style={{ display:"flex", flexWrap:"wrap", gap:5, paddingTop:4 }}>
                  {MEDIA_CATEGORIES.map(cat => (
                    <span key={cat.label} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                      color:"var(--npi-txt4)", display:"flex", alignItems:"center", gap:3 }}>
                      <span style={{ fontSize:10 }}>{cat.icon}</span>{cat.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ──── GALLERY TAB ──── */}
          {activeTab === "gallery" && (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {attachments.length === 0 ? (
                <div style={{ textAlign:"center", padding:"36px 0",
                  color:"var(--npi-txt4)", fontFamily:"'DM Sans',sans-serif",
                  fontSize:12, fontStyle:"italic" }}>
                  No images attached yet \u2014 use the Attach tab to add clinical photos
                </div>
              ) : (
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  {attachments.map((att, idx) => {
                    const cat = catMeta(att.category);
                    return (
                      <div key={att.id}
                        style={{ borderRadius:10, overflow:"hidden",
                          background:"rgba(14,37,68,0.7)",
                          border:`1px solid ${cat ? cat.col+"22" : "rgba(26,53,85,0.4)"}`,
                          cursor:"pointer", transition:"border-color .15s" }}
                        onClick={() => { setLightboxIdx(idx); setEditCap(att.caption); setEditMode(false); }}>
                        <div style={{ position:"relative", height:120 }}>
                          <img src={att.dataUrl} alt={att.name}
                            style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
                          {cat && (
                            <div style={{ position:"absolute", top:5, left:5,
                              background:"rgba(5,14,28,0.82)", borderRadius:20,
                              padding:"2px 7px", display:"flex", alignItems:"center", gap:4 }}>
                              <span style={{ fontSize:10 }}>{cat.icon}</span>
                              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9,
                                fontWeight:600, color:cat.col }}>{cat.label}</span>
                            </div>
                          )}
                          {att.aiAnalysis && (
                            <div style={{ position:"absolute", top:5, right:5,
                              background:"rgba(59,158,255,0.85)", borderRadius:4,
                              padding:"2px 5px", fontFamily:"'JetBrains Mono',monospace",
                              fontSize:7, color:"#fff", letterSpacing:.5 }}>
                              AI
                            </div>
                          )}
                        </div>
                        <div style={{ padding:"7px 9px" }}>
                          {att.region && (
                            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                              color:"var(--npi-txt4)", marginBottom:2 }}>{att.region}</div>
                          )}
                          {att.caption ? (
                            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                              color:"var(--npi-txt3)", lineHeight:1.4,
                              overflow:"hidden", textOverflow:"ellipsis",
                              display:"-webkit-box", WebkitLineClamp:2,
                              WebkitBoxOrient:"vertical" }}>
                              {att.caption}
                            </div>
                          ) : (
                            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                              color:"var(--npi-txt4)", fontStyle:"italic" }}>
                              No caption
                            </div>
                          )}
                          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                            color:"var(--npi-txt4)", marginTop:4 }}>
                            {att.author} \xb7 {elapsed(att.ts)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ──── LOG TAB ──── */}
          {activeTab === "log" && (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                color:"var(--npi-txt4)", letterSpacing:1.5, textTransform:"uppercase" }}>
                Attachment Log
              </div>
              {attachments.length === 0 ? (
                <div style={{ textAlign:"center", padding:"28px 0",
                  color:"var(--npi-txt4)", fontFamily:"'DM Sans',sans-serif",
                  fontSize:12, fontStyle:"italic" }}>
                  No attachments logged
                </div>
              ) : attachments.map((att, idx) => {
                const cat = catMeta(att.category);
                return (
                  <div key={att.id} style={{ display:"flex", gap:10, padding:"10px 12px",
                    borderRadius:9, background:"rgba(14,37,68,0.7)",
                    border:"1px solid rgba(26,53,85,0.4)",
                    borderLeft:`3px solid ${cat ? cat.col : "rgba(42,77,114,0.6)"}`,
                    cursor:"pointer" }}
                    onClick={() => { setLightboxIdx(idx); setEditCap(att.caption); setEditMode(false); setActiveTab("gallery"); }}>
                    <img src={att.dataUrl} alt={att.name}
                      style={{ width:44, height:44, objectFit:"cover",
                        borderRadius:6, border:"1px solid rgba(42,77,114,0.4)", flexShrink:0 }} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                        {cat && <span style={{ fontSize:11 }}>{cat.icon}</span>}
                        <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                          fontWeight:600, color: cat ? cat.col : "var(--npi-txt3)" }}>
                          {att.category || "Uncategorized"}
                        </span>
                        {att.region && (
                          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                            color:"var(--npi-txt4)" }}>{att.region}</span>
                        )}
                      </div>
                      {att.caption && (
                        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                          color:"var(--npi-txt3)", overflow:"hidden", textOverflow:"ellipsis",
                          whiteSpace:"nowrap" }}>
                          {att.caption}
                        </div>
                      )}
                      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                        color:"var(--npi-txt4)", marginTop:3 }}>
                        {att.author} \xb7 {elapsed(att.ts)} \xb7 {formatSize(att.size)}
                        {att.aiAnalysis ? " \xb7 AI analyzed" : ""}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ──── LIGHTBOX ──── */}
      {lightboxItem && (
        <div onClick={() => setLightboxIdx(null)}
          style={{ position:"fixed", inset:0, zIndex:9990,
            background:"rgba(2,6,14,0.92)", backdropFilter:"blur(6px)",
            display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background:"#071525", border:"1px solid rgba(26,53,85,0.7)",
              borderRadius:14, width:"min(680px,92vw)", maxHeight:"90vh",
              display:"flex", flexDirection:"column",
              boxShadow:"0 28px 80px rgba(0,0,0,0.75)", overflow:"hidden" }}>

            {/* Lightbox header */}
            <div style={{ padding:"12px 16px", borderBottom:"1px solid rgba(26,53,85,0.5)",
              display:"flex", alignItems:"center", justifyContent:"space-between",
              background:"rgba(5,14,28,0.9)", flexShrink:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                {catMeta(lightboxItem.category) && (
                  <span style={{ fontSize:16 }}>{catMeta(lightboxItem.category).icon}</span>
                )}
                <div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600,
                    color: catMeta(lightboxItem.category)?.col || "var(--npi-txt)" }}>
                    {lightboxItem.category || "Attachment"}
                  </div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                    color:"var(--npi-txt4)", marginTop:1 }}>
                    {lightboxItem.region && `${lightboxItem.region} \xb7 `}
                    {lightboxItem.author} \xb7 {elapsed(lightboxItem.ts)} \xb7 {formatSize(lightboxItem.size)}
                  </div>
                </div>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                {lightboxIdx > 0 && (
                  <button onClick={() => { setLightboxIdx(i => i-1); setEditMode(false); }}
                    style={{ padding:"4px 10px", borderRadius:6, border:"1px solid rgba(42,77,114,0.4)",
                      background:"transparent", color:"var(--npi-txt4)", cursor:"pointer", fontSize:13 }}>
                    \u2039
                  </button>
                )}
                {lightboxIdx < attachments.length-1 && (
                  <button onClick={() => { setLightboxIdx(i => i+1); setEditMode(false); }}
                    style={{ padding:"4px 10px", borderRadius:6, border:"1px solid rgba(42,77,114,0.4)",
                      background:"transparent", color:"var(--npi-txt4)", cursor:"pointer", fontSize:13 }}>
                    \u203A
                  </button>
                )}
                <button onClick={() => deleteAttachment(lightboxItem.id)}
                  style={{ padding:"4px 10px", borderRadius:6, border:"1px solid rgba(255,107,107,0.35)",
                    background:"transparent", color:"#ff8a8a", cursor:"pointer",
                    fontFamily:"'DM Sans',sans-serif", fontSize:11 }}>
                  Delete
                </button>
                <button onClick={() => setLightboxIdx(null)}
                  style={{ width:26, height:26, borderRadius:13,
                    border:"1px solid rgba(42,77,114,0.5)", background:"rgba(14,37,68,0.7)",
                    color:"var(--npi-txt4)", fontSize:12, cursor:"pointer",
                    display:"flex", alignItems:"center", justifyContent:"center" }}>
                  \u2715
                </button>
              </div>
            </div>

            {/* Image */}
            <div style={{ background:"#030810", display:"flex",
              alignItems:"center", justifyContent:"center",
              padding:12, flexShrink:0, maxHeight:340, overflow:"hidden" }}>
              <img src={lightboxItem.dataUrl} alt={lightboxItem.name}
                style={{ maxWidth:"100%", maxHeight:316, objectFit:"contain", borderRadius:6 }} />
            </div>

            {/* Metadata + AI panel */}
            <div style={{ padding:"12px 16px 16px", overflowY:"auto",
              display:"flex", flexDirection:"column", gap:10 }}>

              {/* Caption row */}
              <div>
                <div style={{ ...lblBase }}>Caption</div>
                {editMode ? (
                  <div style={{ display:"flex", gap:8 }}>
                    <textarea value={editCap} onChange={e => setEditCap(e.target.value)} rows={2}
                      style={{ ...fieldBase, flex:1, resize:"none", lineHeight:1.5 }} />
                    <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                      <button onClick={() => {
                        setAttachments(p => p.map(a => a.id===lightboxItem.id ? {...a, caption:editCap} : a));
                        setEditMode(false);
                      }} style={{ padding:"5px 10px", borderRadius:6, border:"none",
                        background:"rgba(0,229,192,0.15)", color:"var(--npi-teal)",
                        fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600, cursor:"pointer" }}>
                        Save
                      </button>
                      <button onClick={() => setEditMode(false)}
                        style={{ padding:"5px 10px", borderRadius:6,
                          border:"1px solid rgba(42,77,114,0.4)", background:"transparent",
                          color:"var(--npi-txt4)", fontFamily:"'DM Sans',sans-serif",
                          fontSize:11, cursor:"pointer" }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13,
                      color: lightboxItem.caption ? "var(--npi-txt2)" : "var(--npi-txt4)",
                      fontStyle: lightboxItem.caption ? "normal" : "italic", flex:1, lineHeight:1.6 }}>
                      {lightboxItem.caption || "No caption — click Edit to add"}
                    </div>
                    <button onClick={() => { setEditCap(lightboxItem.caption); setEditMode(true); }}
                      style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                        letterSpacing:1, textTransform:"uppercase", padding:"3px 8px",
                        borderRadius:4, cursor:"pointer", flexShrink:0,
                        border:"1px solid rgba(42,77,114,0.4)", background:"transparent",
                        color:"var(--npi-txt4)" }}>
                      Edit
                    </button>
                  </div>
                )}
              </div>

              {/* AI analysis */}
              <div style={{ padding:"11px 13px", borderRadius:9,
                background:"rgba(59,158,255,0.06)", border:"1px solid rgba(59,158,255,0.2)" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:7 }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                    color:"#3b9eff", letterSpacing:1.5, textTransform:"uppercase" }}>
                    AI Documentation Draft
                  </div>
                  <button
                    onClick={() => analyzeAttachment(lightboxItem)}
                    disabled={analyzing === lightboxItem.id}
                    style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                      letterSpacing:1, textTransform:"uppercase",
                      padding:"3px 9px", borderRadius:5, cursor:"pointer",
                      border:"1px solid rgba(59,158,255,0.4)",
                      background: analyzing===lightboxItem.id ? "transparent" : "rgba(59,158,255,0.1)",
                      color: analyzing===lightboxItem.id ? "var(--npi-txt4)" : "#3b9eff" }}>
                    {analyzing === lightboxItem.id ? "Generating\u2026" : lightboxItem.aiAnalysis ? "\u21ba Redo" : "\u2728 Generate"}
                  </button>
                </div>
                {lightboxItem.aiAnalysis ? (
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
                    color:"var(--npi-txt2)", lineHeight:1.65 }}>
                    {lightboxItem.aiAnalysis}
                  </div>
                ) : (
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                    color:"var(--npi-txt4)", fontStyle:"italic" }}>
                    Generate a chart-ready documentation phrase from this image\u2019s tags and caption
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}