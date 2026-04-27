// QuickNoteDisposition.jsx
// DiagnosisCodingCard, InterventionsCard, DispositionResult
// Extracted from QuickNoteComponents for file size management

import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";

function s(v) {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function SectionLabel({ children, color = "var(--qn-txt4)" }) {
  return (
    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700,
      color, letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>
      {children}
    </div>
  );
}

function dispColor(disp) {
  const d = (disp || "").toLowerCase();
  if (d.includes("icu"))    return "#ff4444";
  if (d.includes("admit"))  return "#ff6b6b";
  if (d.includes("obs"))    return "#ff9f43";
  if (d.includes("trans"))  return "#9b6dff";
  return "#3dffa0";
}

// ─── DIAGNOSIS CODING CARD ────────────────────────────────────────────────────
const CODE_TYPE_COLOR = {
  primary:     "var(--qn-teal)",
  secondary:   "var(--qn-blue)",
  comorbidity: "var(--qn-purple)",
  symptom:     "var(--qn-gold)",
};

export function DiagnosisCodingCard({ finalDiagnosis, suggestions, selected, searching, error, onSearch, onSelect, onRemove }) {
  const [searched, setSearched] = useState(false);
  const handleSearch = () => { setSearched(true); onSearch(); };

  return (
    <div style={{ marginBottom:14, padding:"14px 16px",
      background:"rgba(8,22,40,.5)", border:"1px solid rgba(0,229,192,.25)", borderRadius:14 }}>
      <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:12 }}>
        <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
          fontSize:15, color:"var(--qn-teal)" }}>Final Diagnosis &amp; ICD-10</span>
        <div style={{ flex:1 }} />
        <button onClick={handleSearch} disabled={searching}
          style={{ padding:"5px 14px", borderRadius:7, cursor:"pointer",
            fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
            border:`1px solid ${searching ? "rgba(42,79,122,.3)" : "rgba(0,229,192,.4)"}`,
            background:searching ? "rgba(14,37,68,.4)" : "rgba(0,229,192,.1)",
            color:searching ? "var(--qn-txt4)" : "var(--qn-teal)" }}>
          {searching ? "Searching…" : searched ? "↺ Re-search" : "🔍 Find ICD-10 Codes"}
        </button>
      </div>
      {finalDiagnosis && (
        <div style={{ marginBottom:10, padding:"8px 12px", borderRadius:8,
          background:"rgba(0,229,192,.06)", border:"1px solid rgba(0,229,192,.2)" }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
            color:"var(--qn-teal)", letterSpacing:1, textTransform:"uppercase", marginBottom:3 }}>
            Diagnosis for coding</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
            fontSize:13, color:"var(--qn-txt)" }}>{s(finalDiagnosis)}</div>
        </div>
      )}
      {selected.length > 0 && (
        <div style={{ marginBottom:10 }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
            color:"var(--qn-txt4)", letterSpacing:1, textTransform:"uppercase", marginBottom:6 }}>Confirmed Codes</div>
          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
            {selected.map((c, i) => {
              const tc = CODE_TYPE_COLOR[c.type] || "var(--qn-blue)";
              return (
                <div key={c.code} style={{ display:"flex", alignItems:"center", gap:8,
                  padding:"7px 10px", borderRadius:8,
                  background:`${tc}10`, border:`1px solid ${tc}33` }}>
                  {i === 0 && (
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                      color:"var(--qn-gold)", background:"rgba(245,200,66,.12)",
                      border:"1px solid rgba(245,200,66,.3)", borderRadius:3,
                      padding:"1px 5px", flexShrink:0 }}>PRIMARY</span>
                  )}
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontWeight:700,
                    fontSize:12, color:tc, flexShrink:0 }}>{s(c.code)}</span>
                  <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
                    color:"var(--qn-txt2)", flex:1 }}>{s(c.description)}</span>
                  <button onClick={() => onRemove(c.code)}
                    style={{ background:"transparent", border:"none", cursor:"pointer",
                      color:"var(--qn-txt4)", fontSize:12, padding:"0 2px", flexShrink:0 }}>×</button>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {suggestions.length > 0 && (
        <div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
            color:"var(--qn-txt4)", letterSpacing:1, textTransform:"uppercase", marginBottom:6 }}>
            Suggested Codes — Click to Add</div>
          <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
            {suggestions.map(c => {
              const alreadySelected = selected.find(x => x.code === c.code);
              const tc = CODE_TYPE_COLOR[c.type] || "var(--qn-blue)";
              return (
                <div key={c.code} onClick={() => !alreadySelected && onSelect(c)}
                  style={{ display:"flex", alignItems:"flex-start", gap:9,
                    padding:"8px 10px", borderRadius:8, cursor:alreadySelected ? "default" : "pointer",
                    opacity:alreadySelected ? .45 : 1,
                    background:`${tc}08`, border:`1px solid ${alreadySelected ? "rgba(42,79,122,.3)" : tc + "28"}` }}>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontWeight:700,
                    fontSize:12, color:tc, flexShrink:0, minWidth:56 }}>{s(c.code)}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
                      color:alreadySelected ? "var(--qn-txt4)" : "var(--qn-txt2)",
                      lineHeight:1.3, marginBottom:2 }}>{s(c.description)}</div>
                    {c.specificity_note && (
                      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                        color:"var(--qn-txt4)", letterSpacing:.3 }}>{s(c.specificity_note)}</div>
                    )}
                  </div>
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
          fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"var(--qn-coral)" }}>{error}</div>
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
  const [type, setType] = useState("medication");
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [show, setShow] = useState(false);

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({ type, name:name.trim(), dose_route:dose.trim(), time_given:"", response:"" });
    setName(""); setDose(""); setShow(false);
  };

  if (!show) return (
    <button onClick={() => setShow(true)}
      style={{ padding:"5px 12px", borderRadius:7, cursor:"pointer",
        fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
        border:"1px solid rgba(42,79,122,.4)", background:"rgba(14,37,68,.5)",
        color:"var(--qn-txt4)", marginTop:4 }}>+ Add Intervention</button>
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
        placeholder="Intervention name" onKeyDown={e => e.key === "Enter" && handleAdd()}
        style={{ flex:"1 1 160px", padding:"4px 9px", borderRadius:6,
          background:"rgba(8,22,40,.8)", border:"1px solid rgba(42,79,122,.5)",
          color:"var(--qn-txt)", fontFamily:"'DM Sans',sans-serif", fontSize:11, outline:"none" }} />
      <input value={dose} onChange={e => setDose(e.target.value)}
        placeholder="Dose/route (optional)" onKeyDown={e => e.key === "Enter" && handleAdd()}
        style={{ flex:"1 1 120px", padding:"4px 9px", borderRadius:6,
          background:"rgba(8,22,40,.8)", border:"1px solid rgba(42,79,122,.5)",
          color:"var(--qn-txt3)", fontFamily:"'DM Sans',sans-serif", fontSize:11, outline:"none" }} />
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
      background:"rgba(8,22,40,.5)", border:"1px solid rgba(59,158,255,.25)", borderRadius:14 }}>
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
              color:loading ? "var(--qn-txt4)" : "var(--qn-blue)" }}>
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
          Click to generate a pre-populated interventions list. Uncheck anything not performed.
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
            const tc = INT_TYPE_CONFIG[item.type] || INT_TYPE_CONFIG.other;
            const off = item.confirmed === false;
            return (
              <div key={item.id} style={{ display:"flex", alignItems:"flex-start",
                gap:8, padding:"7px 10px", borderRadius:8,
                opacity:off ? .4 : 1,
                background:off ? "rgba(14,37,68,.3)" : `${tc.color}08`,
                border:`1px solid ${off ? "rgba(42,79,122,.2)" : tc.color + "28"}` }}>
                <div onClick={() => onToggle(item.id)}
                  style={{ width:16, height:16, borderRadius:4, flexShrink:0, cursor:"pointer", marginTop:1,
                    background:off ? "rgba(14,37,68,.6)" : `${tc.color}20`,
                    border:`2px solid ${off ? "rgba(42,79,122,.4)" : tc.color}`,
                    display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {!off && <span style={{ fontSize:9, color:tc.color, lineHeight:1 }}>✓</span>}
                </div>
                <span style={{ fontSize:14, flexShrink:0 }}>{tc.icon}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
                    fontSize:12, color:off ? "var(--qn-txt4)" : "var(--qn-txt)", marginBottom:2 }}>
                    {s(item.name)}
                    {item.dose_route && (
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                        color:tc.color, marginLeft:7, fontWeight:400 }}>{s(item.dose_route)}</span>
                    )}
                  </div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    <input value={item.time_given || ""}
                      onChange={e => onUpdate(item.id, "time_given", e.target.value)}
                      placeholder="Time (e.g. 1430)"
                      style={{ padding:"2px 7px", borderRadius:5, width:110,
                        background:"rgba(8,22,40,.6)", border:"1px solid rgba(42,79,122,.4)",
                        color:"var(--qn-txt3)", fontFamily:"'JetBrains Mono',monospace",
                        fontSize:9, outline:"none" }} />
                    <input value={item.response || ""}
                      onChange={e => onUpdate(item.id, "response", e.target.value)}
                      placeholder="Response / result"
                      style={{ padding:"2px 7px", borderRadius:5, flex:"1 1 140px",
                        background:"rgba(8,22,40,.6)", border:"1px solid rgba(42,79,122,.4)",
                        color:"var(--qn-txt3)", fontFamily:"'DM Sans',sans-serif",
                        fontSize:10, outline:"none" }} />
                  </div>
                </div>
                <button onClick={() => onRemove(item.id)}
                  style={{ background:"transparent", border:"none", cursor:"pointer",
                    color:"var(--qn-txt4)", fontSize:13, padding:"0 2px", flexShrink:0, opacity:.5 }}>×</button>
              </div>
            );
          })}
        </div>
      )}
      <AddInterventionRow onAdd={onAdd} />
    </div>
  );
}

// ─── DIAGNOSIS EXPLANATION CARD ───────────────────────────────────────────────
function DiagnosisExplanationCard({ text, onEdit }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  const [saved, setSaved] = useState(false);
  const [simplifying, setSimplifying] = useState(false);
  const [simpError, setSimpError] = useState(null);
  const prevText = useRef(text);

  useEffect(() => {
    if (text !== prevText.current) { setDraft(text); setEditing(false); prevText.current = text; }
  }, [text]);

  const handleSave = () => {
    if (onEdit) onEdit(draft);
    setEditing(false); setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const handleSimplify = async () => {
    setSimplifying(true); setSimpError(null);
    try {
      const schema = { type:"object", required:["simplified"], properties:{ simplified:{ type:"string" } } };
      const prompt = `Rewrite the following patient discharge explanation at a 6th grade reading level. Use only common everyday words. Keep all clinical information accurate. Replace every medical term with a plain-language equivalent. Write in second person. 2-3 sentences maximum.\n\nORIGINAL:\n${draft || text}\n\nReturn JSON: { "simplified": "<rewritten text>" }`;
      const res = await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
      const simplified = res?.simplified?.trim();
      if (!simplified) throw new Error("Empty response");
      setDraft(simplified);
      if (onEdit) onEdit(simplified);
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch (e) { setSimpError("Simplify failed — " + (e.message || "try again")); }
    finally { setSimplifying(false); }
  };

  return (
    <div style={{ marginBottom:10, padding:"8px 10px", borderRadius:8,
      background:"rgba(61,255,160,.05)", border:"1px solid rgba(61,255,160,.2)" }}>
      <div style={{ display:"flex", alignItems:"center", marginBottom:6 }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
          color:"var(--qn-green)", letterSpacing:.8, flex:1 }}>
          WHAT YOU HAVE
          {saved && <span style={{ color:"var(--qn-green)", marginLeft:8, fontSize:8 }}>✓ Saved</span>}
        </div>
        <div style={{ display:"flex", gap:5 }}>
          {!editing && (
            <button onClick={handleSimplify} disabled={simplifying}
              style={{ padding:"2px 8px", borderRadius:5, cursor:"pointer",
                fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
                border:"1px solid rgba(0,229,192,.35)", background:"rgba(0,229,192,.07)",
                color:simplifying ? "var(--qn-txt4)" : "var(--qn-teal)", letterSpacing:.4 }}>
              {simplifying ? "Simplifying…" : "↓ Simplify"}
            </button>
          )}
          {!editing ? (
            <button onClick={() => { setDraft(draft || text); setEditing(true); }}
              style={{ padding:"2px 8px", borderRadius:5, cursor:"pointer",
                fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
                border:"1px solid rgba(61,255,160,.3)", background:"rgba(61,255,160,.06)",
                color:"var(--qn-green)", letterSpacing:.4 }}>✎ Edit</button>
          ) : (
            <>
              <button onClick={handleSave}
                style={{ padding:"2px 8px", borderRadius:5, cursor:"pointer",
                  fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
                  border:"1px solid rgba(61,255,160,.5)", background:"rgba(61,255,160,.12)",
                  color:"var(--qn-green)", letterSpacing:.4 }}>✓ Done</button>
              <button onClick={() => { setDraft(text); setEditing(false); }}
                style={{ padding:"2px 8px", borderRadius:5, cursor:"pointer",
                  fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                  border:"1px solid rgba(42,79,122,.4)", background:"transparent",
                  color:"var(--qn-txt4)" }}>Cancel</button>
            </>
          )}
        </div>
      </div>
      {editing ? (
        <textarea value={draft} onChange={e => setDraft(e.target.value)} rows={4} autoFocus
          style={{ background:"rgba(14,37,68,.7)", border:"1px solid rgba(61,255,160,.4)",
            borderRadius:8, padding:"8px 10px", color:"var(--qn-txt)",
            fontFamily:"'DM Sans',sans-serif", fontSize:12, lineHeight:1.7,
            outline:"none", width:"100%", boxSizing:"border-box", resize:"vertical" }} />
      ) : (
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
          color:"var(--qn-txt2)", lineHeight:1.7 }}>{s(draft || text)}</div>
      )}
      {simpError && (
        <div style={{ marginTop:5, fontFamily:"'DM Sans',sans-serif", fontSize:10,
          color:"var(--qn-coral)" }}>{simpError}</div>
      )}
    </div>
  );
}

function labFlagColor(status) {
  const x = (status || "").toLowerCase();
  if (x === "critical")   return ["var(--qn-red)",    "rgba(255,68,68,.1)",   "rgba(255,68,68,.4)"];
  if (x === "high")       return ["var(--qn-coral)",  "rgba(255,107,107,.08)","rgba(255,107,107,.35)"];
  if (x === "low")        return ["var(--qn-blue)",   "rgba(59,158,255,.08)", "rgba(59,158,255,.35)"];
  if (x === "borderline") return ["var(--qn-gold)",   "rgba(245,200,66,.08)", "rgba(245,200,66,.3)"];
  return                         ["var(--qn-purple)", "rgba(155,109,255,.07)","rgba(155,109,255,.28)"];
}

function LabFlagsCard({ flags }) {
  if (!flags?.length) return null;
  return (
    <div style={{ padding:"10px 12px", borderRadius:10, marginBottom:10,
      background:"rgba(8,22,40,.7)", border:"1px solid rgba(42,79,122,.4)" }}>
      <SectionLabel color="var(--qn-gold)">Lab &amp; Imaging Interpretation</SectionLabel>
      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {flags.map((f, i) => {
          const [c, bg, bd] = labFlagColor(f.status);
          return (
            <div key={i} style={{ padding:"8px 10px", borderRadius:8, background:bg, border:`1px solid ${bd}` }}>
              <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:4, flexWrap:"wrap" }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontWeight:700,
                  fontSize:11, color:c }}>{s(f.parameter)}</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11,
                  color:"var(--qn-txt)", fontWeight:600 }}>{s(f.value)}</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                  color:c, background:`${c}18`, border:`1px solid ${bd}`,
                  borderRadius:4, padding:"1px 7px", textTransform:"uppercase",
                  letterSpacing:.8, fontWeight:700 }}>{s(f.status)}</span>
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

export function DispositionResult({ result, copiedDisch, setCopiedDisch, onDiagExplanationEdit }) {
  const [copiedReeval, setCopiedReeval] = useState(false);
  const [copiedPlan,   setCopiedPlan]   = useState(false);
  const [copiedOrders, setCopiedOrders] = useState(false);
  if (!result) return null;

  const copyWith = (text, setter) => {
    navigator.clipboard.writeText(text).then(() => { setter(true); setTimeout(() => setter(false), 2000); });
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
        padding:"11px 14px", borderRadius:10, background:`${dc}10`, border:`2px solid ${dc}44` }}>
        <div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700,
            color:dc, letterSpacing:1.5, textTransform:"uppercase", marginBottom:2 }}>Disposition</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
            fontSize:20, color:dc, letterSpacing:-.3 }}>{s(result.disposition) || "—"}</div>
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

      {result.final_diagnosis && (
        <div className="qn-card" style={{ marginBottom:10 }}>
          <SectionLabel color="var(--qn-teal)">Final Impression</SectionLabel>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
            fontSize:13, color:"var(--qn-txt)", lineHeight:1.5 }}>{s(result.final_diagnosis)}</div>
        </div>
      )}

      {result.updated_impression && (
        <div style={{ padding:"8px 12px", borderRadius:8, marginBottom:10,
          background:"rgba(0,229,192,.06)", border:"1px solid rgba(0,229,192,.2)",
          display:"flex", alignItems:"flex-start", gap:8 }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
            color:"var(--qn-teal)", letterSpacing:1, textTransform:"uppercase", flexShrink:0, marginTop:1 }}>Updated:</span>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
            color:"var(--qn-txt2)", lineHeight:1.6 }}>{s(result.updated_impression)}</span>
        </div>
      )}

      <LabFlagsCard flags={result.result_flags} />

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
                letterSpacing:.5, textTransform:"uppercase" }}>
              {copiedReeval ? "✓ Copied" : "Copy"}
            </button>
          </div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
            color:"var(--qn-txt2)", lineHeight:1.75, whiteSpace:"pre-wrap" }}>
            {s(result.reevaluation_note)}
          </div>
        </div>
      )}

      {result.plan_summary && (
        <div className="qn-card" style={{ marginBottom:10 }}>
          <div style={{ display:"flex", alignItems:"center", marginBottom:6 }}>
            <SectionLabel color="var(--qn-purple)" style={{ marginBottom:0, flex:1 }}>Plan — Chart-Ready</SectionLabel>
            <button onClick={() => copyWith(result.plan_summary, setCopiedPlan)}
              style={{ padding:"2px 10px", borderRadius:6, cursor:"pointer",
                fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
                border:`1px solid ${copiedPlan ? "rgba(61,255,160,.5)" : "rgba(155,109,255,.35)"}`,
                background:copiedPlan ? "rgba(61,255,160,.1)" : "rgba(155,109,255,.08)",
                color:copiedPlan ? "var(--qn-green)" : "var(--qn-purple)",
                letterSpacing:.5, textTransform:"uppercase" }}>
              {copiedPlan ? "✓ Copied" : "Copy"}
            </button>
          </div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
            color:"var(--qn-txt2)", lineHeight:1.75, whiteSpace:"pre-wrap" }}>
            {s(result.plan_summary)}
          </div>
        </div>
      )}

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
                letterSpacing:.5, textTransform:"uppercase" }}>
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
              setCopiedDisch(true); setTimeout(() => setCopiedDisch(false), 2000);
            }}
              style={{ padding:"2px 10px", borderRadius:6, cursor:"pointer",
                fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
                border:`1px solid ${copiedDisch ? "rgba(61,255,160,.7)" : "rgba(61,255,160,.35)"}`,
                background:copiedDisch ? "rgba(61,255,160,.2)" : "rgba(61,255,160,.08)",
                color:"var(--qn-green)", letterSpacing:.5, textTransform:"uppercase" }}>
              {copiedDisch ? "✓ Copied" : "Copy"}
            </button>
          </div>
          {di.diagnosis_explanation && (
            <DiagnosisExplanationCard text={s(di.diagnosis_explanation)} onEdit={onDiagExplanationEdit} />
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
                color:"var(--qn-coral)", letterSpacing:.8, marginBottom:6 }}>RETURN TO ED IF —</div>
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
        </div>
      )}

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