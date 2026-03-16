import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { BUILTIN_TEMPLATES, SPECIALTY_CONFIG } from "../notetemplates/templateData";

const G = {
  navy:"#050f1e", slate:"#0b1d35", panel:"#0d2240", edge:"#162d4f",
  border:"#1e3a5f", muted:"#2a4d72", dim:"#4a7299", text:"#c8ddf0",
  bright:"#e8f4ff", teal:"#00d4bc", amber:"#f5a623", purple:"#9b6dff",
};
const F = { body:"'DM Sans', sans-serif", mono:"'JetBrains Mono', monospace", display:"'Playfair Display', serif" };

// Group templates by specialty
const SPECIALTIES = [...new Set(BUILTIN_TEMPLATES.map(t => t.specialty))].sort();

export default function TemplatePicker({ open, onClose, onApply }) {
  const [search, setSearch] = useState("");
  const [activeSpec, setActiveSpec] = useState("All");
  const [selected, setSelected] = useState(null);
  const [fieldValues, setFieldValues] = useState({});
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState("");
  const [customTemplates, setCustomTemplates] = useState([]);

  useEffect(() => {
    if (open) {
      base44.entities.NoteTemplate.list().then(setCustomTemplates).catch(() => {});
    }
  }, [open]);

  const allTemplates = [
    ...BUILTIN_TEMPLATES,
    ...customTemplates.map(t => ({
      ...t,
      template_key: `custom_${t.id}`,
      name: t.name,
      specialty: t.specialty || "Custom",
      fields: t.dynamic_fields || [],
      ai_prompt_template: t.ai_instructions || "",
      _isCustom: true,
    })),
  ];

  const filtered = allTemplates.filter(t => {
    const matchSpec = activeSpec === "All" || t.specialty === activeSpec;
    const q = search.toLowerCase();
    return matchSpec && (!q || t.name.toLowerCase().includes(q) || (t.specialty||"").toLowerCase().includes(q));
  });

  const specs = ["All", ...SPECIALTIES, ...(customTemplates.length ? ["Custom"] : [])];

  const selectTemplate = (t) => {
    setSelected(t);
    setFieldValues({});
    setPreview("");
  };

  const generatePreview = async () => {
    if (!selected) return;
    setGenerating(true);
    setPreview("");
    const fields = selected.fields || selected.dynamic_fields || [];
    let prompt = selected.ai_prompt_template || selected.ai_instructions || `Generate a clinical note for a ${selected.specialty} ${selected.name} encounter.`;
    fields.forEach(f => {
      const val = fieldValues[f.id] || "N/A";
      prompt = prompt.replaceAll(`{{${f.id}}}`, val);
    });
    prompt = prompt.replace(/\{\{[^}]+\}\}/g, "N/A");
    try {
      const res = await base44.integrations.Core.InvokeLLM({ prompt });
      setPreview(typeof res === "string" ? res : JSON.stringify(res));
    } catch {
      setPreview("Unable to generate preview. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleApply = () => {
    if (!preview && !selected) return;
    onApply({
      template: selected,
      generatedNote: preview,
      fieldValues,
    });
    onClose();
  };

  if (!open) return null;

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:9000, background:"rgba(5,15,30,.87)", backdropFilter:"blur(6px)",
      display:"flex", alignItems:"center", justifyContent:"center", padding:16,
    }}>
      <div style={{
        width:"100%", maxWidth:980, height:"84vh", background:G.navy,
        border:`1px solid ${G.border}`, borderRadius:16, display:"flex", flexDirection:"column", overflow:"hidden",
        boxShadow:"0 32px 80px rgba(0,0,0,.6)",
      }}>
        {/* Header */}
        <div style={{ height:50, background:G.slate, borderBottom:`1px solid ${G.border}`, display:"flex", alignItems:"center", padding:"0 18px", gap:12, flexShrink:0 }}>
          <span style={{ fontFamily:F.mono, fontSize:11, color:G.teal, letterSpacing:".1em", fontWeight:700 }}>📋 NOTE TEMPLATES</span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search templates…"
            style={{ height:30, background:G.edge, border:`1px solid ${G.border}`, borderRadius:8, padding:"0 10px", color:G.text, fontFamily:F.body, fontSize:12, outline:"none", width:220 }}
          />
          <div style={{ flex:1 }} />
          {preview && (
            <button onClick={handleApply} style={{
              padding:"6px 16px", borderRadius:9, fontSize:12, fontWeight:700, cursor:"pointer",
              background:`linear-gradient(135deg,${G.teal},#00b8a5)`, border:"none", color:G.navy,
            }}>✓ Apply to Note</button>
          )}
          <button onClick={onClose} style={{ width:28, height:28, borderRadius:"50%", background:G.edge, border:`1px solid ${G.border}`, color:G.dim, cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
        </div>

        <div style={{ display:"flex", flex:1, overflow:"hidden" }}>
          {/* Left: Specialty filter + Template list */}
          <div style={{ width:220, flexShrink:0, background:G.panel, borderRight:`1px solid ${G.border}`, display:"flex", flexDirection:"column", overflow:"hidden" }}>
            <div style={{ flex:1, overflowY:"auto" }}>
              {specs.map(spec => {
                const cfg = SPECIALTY_CONFIG?.[spec] || { icon:"📄", color:G.teal };
                const count = spec === "All" ? allTemplates.length : allTemplates.filter(t => t.specialty === spec).length;
                return (
                  <div
                    key={spec}
                    onClick={() => setActiveSpec(spec)}
                    style={{
                      display:"flex", alignItems:"center", gap:8, padding:"8px 14px",
                      cursor:"pointer", transition:"background .12s",
                      background: activeSpec === spec ? `${G.teal}10` : "transparent",
                      borderLeft:`2px solid ${activeSpec===spec?G.teal:"transparent"}`,
                    }}
                  >
                    <span style={{ fontSize:14 }}>{spec === "All" ? "🏥" : cfg.icon}</span>
                    <span style={{ fontFamily:F.body, fontSize:12, color:activeSpec===spec?G.teal:G.text, flex:1 }}>{spec}</span>
                    <span style={{ fontFamily:F.mono, fontSize:9, color:G.muted, background:G.edge, padding:"1px 5px", borderRadius:8 }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Center: Template cards */}
          <div style={{ width:280, flexShrink:0, background:G.slate, borderRight:`1px solid ${G.border}`, display:"flex", flexDirection:"column", overflow:"hidden" }}>
            <div style={{ padding:"10px 12px", borderBottom:`1px solid ${G.border}`, fontFamily:F.mono, fontSize:9, color:G.dim, letterSpacing:".1em" }}>
              {filtered.length} TEMPLATES
            </div>
            <div style={{ flex:1, overflowY:"auto", padding:"8px" }}>
              {filtered.length === 0 && (
                <div style={{ textAlign:"center", padding:"32px 16px", color:G.muted, fontSize:12 }}>No templates found</div>
              )}
              {filtered.map(t => {
                const cfg = SPECIALTY_CONFIG?.[t.specialty] || { icon:"📄", color:G.teal };
                const isSelected = selected?.template_key === t.template_key;
                return (
                  <div
                    key={t.template_key}
                    onClick={() => selectTemplate(t)}
                    style={{
                      padding:"10px 12px", borderRadius:10, marginBottom:5, cursor:"pointer",
                      background: isSelected ? `${cfg.color}12` : G.edge,
                      border:`1px solid ${isSelected?cfg.color+"45":G.border}`,
                      transition:"all .12s",
                    }}
                  >
                    <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:3 }}>
                      <span style={{ fontSize:14 }}>{cfg.icon}</span>
                      <span style={{ fontFamily:F.body, fontSize:12, fontWeight:600, color:isSelected?cfg.color:G.bright, flex:1 }}>{t.name}</span>
                    </div>
                    <div style={{ fontFamily:F.mono, fontSize:9, color:G.muted }}>{t.specialty}</div>
                    {t._isCustom && <div style={{ fontFamily:F.mono, fontSize:8, color:G.purple, marginTop:2 }}>CUSTOM</div>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Fields + Preview */}
          <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
            {!selected ? (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", gap:12, padding:32, textAlign:"center" }}>
                <div style={{ fontSize:40 }}>📋</div>
                <div style={{ fontFamily:F.display, fontSize:18, color:G.bright }}>Select a Template</div>
                <div style={{ fontFamily:F.body, fontSize:12, color:G.dim, lineHeight:1.7, maxWidth:320 }}>
                  Choose a template from the list to fill in key fields. Notrya AI will generate the full clinical note and apply it to your current note in the studio.
                </div>
              </div>
            ) : (
              <>
                {/* Template Header */}
                <div style={{ padding:"12px 16px", borderBottom:`1px solid ${G.border}`, background:G.panel, flexShrink:0 }}>
                  <div style={{ fontFamily:F.display, fontSize:16, color:G.bright, fontWeight:700 }}>{selected.name}</div>
                  <div style={{ fontFamily:F.mono, fontSize:10, color:G.dim, marginTop:2 }}>{selected.specialty}</div>
                </div>

                <div style={{ flex:1, overflowY:"auto", padding:"14px 16px" }}>
                  {/* Fields */}
                  {(selected.fields || selected.dynamic_fields || []).length > 0 && (
                    <div style={{ marginBottom:16 }}>
                      <div style={{ fontFamily:F.mono, fontSize:9, color:G.dim, letterSpacing:".1em", marginBottom:10 }}>TEMPLATE FIELDS</div>
                      {(selected.fields || selected.dynamic_fields || []).map(f => (
                        <div key={f.id} style={{ marginBottom:10 }}>
                          <label style={{ fontFamily:F.mono, fontSize:9, color:G.dim, display:"block", marginBottom:4 }}>
                            {f.label || f.name} {f.required && <span style={{ color:G.amber }}>*</span>}
                          </label>
                          {f.type === "textarea" || f.type === "text_long" ? (
                            <textarea
                              value={fieldValues[f.id] || ""}
                              onChange={e => setFieldValues(prev => ({...prev,[f.id]:e.target.value}))}
                              placeholder={f.placeholder || ""}
                              rows={3}
                              style={{ width:"100%", background:G.edge, border:`1px solid ${G.border}`, borderRadius:7, padding:"7px 10px", color:G.text, fontFamily:F.body, fontSize:12, outline:"none", resize:"vertical", lineHeight:1.6, boxSizing:"border-box" }}
                            />
                          ) : f.type === "select" ? (
                            <select
                              value={fieldValues[f.id] || ""}
                              onChange={e => setFieldValues(prev => ({...prev,[f.id]:e.target.value}))}
                              style={{ width:"100%", background:G.edge, border:`1px solid ${G.border}`, borderRadius:7, padding:"7px 10px", color:G.text, fontFamily:F.body, fontSize:12, outline:"none" }}
                            >
                              <option value="">Select…</option>
                              {(f.options||[]).map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          ) : (
                            <input
                              value={fieldValues[f.id] || ""}
                              onChange={e => setFieldValues(prev => ({...prev,[f.id]:e.target.value}))}
                              placeholder={f.placeholder || ""}
                              style={{ width:"100%", background:G.edge, border:`1px solid ${G.border}`, borderRadius:7, padding:"7px 10px", color:G.text, fontFamily:F.body, fontSize:12, outline:"none", boxSizing:"border-box" }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Generate Button */}
                  <button onClick={generatePreview} disabled={generating} style={{
                    width:"100%", padding:"9px", borderRadius:10, cursor:generating?"not-allowed":"pointer",
                    background:`rgba(0,212,188,.12)`, border:`1px solid ${G.teal}45`, color:G.teal,
                    fontFamily:F.body, fontSize:13, fontWeight:700, marginBottom:14, opacity:generating?.6:1,
                  }}>
                    {generating ? "✦ Generating…" : "✦ Generate Note Preview"}
                  </button>

                  {/* Preview */}
                  {preview && (
                    <div>
                      <div style={{ fontFamily:F.mono, fontSize:9, color:G.dim, letterSpacing:".1em", marginBottom:8 }}>NOTE PREVIEW</div>
                      <div style={{ background:G.edge, border:`1px solid ${G.border}`, borderRadius:10, padding:"12px 14px", fontFamily:F.body, fontSize:12, color:G.text, lineHeight:1.75, whiteSpace:"pre-wrap", maxHeight:300, overflowY:"auto" }}>
                        {preview}
                      </div>
                      <button onClick={handleApply} style={{
                        width:"100%", marginTop:12, padding:"10px", borderRadius:10, cursor:"pointer",
                        background:`linear-gradient(135deg,${G.teal},#00b8a5)`, border:"none", color:G.navy,
                        fontFamily:F.body, fontSize:13, fontWeight:700,
                      }}>✓ Apply to Note</button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}