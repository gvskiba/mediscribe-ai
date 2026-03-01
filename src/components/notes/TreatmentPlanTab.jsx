import React, { useState, useEffect, useRef } from "react";
import { X, Plus, Sparkles, Loader2, ChevronDown, ChevronRight, BookOpen, ArrowRight, Search } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";

const T = {
  bg: "#080b10", surface: "#0e1320", surface_2: "#141b2d",
  card: "#0f1624", card_hover: "#141f32",
  border: "#1a2236", border_2: "#243048",
  text: "#dde2ef", muted: "#4e5a78", dim: "#2d3a56",
  teal: "#00cca3", teal_dim: "#003328",
  blue: "#3b82f6", blue_dim: "#0d2040",
  amber: "#f59e0b", amber_dim: "#2a1a00",
  green: "#34d399", green_dim: "#002a1a",
  red: "#f87171", red_dim: "#2a0f0f",
  purple: "#a78bfa", purple_dim: "#1a1040",
  sky: "#38bdf8", sky_dim: "#0c2a3a",
  orange: "#fb923c", orange_dim: "#2a1000",
};

const uid = () => Math.random().toString(36).slice(2, 9);

const LAB_PANELS = {
  cbc: ["WBC","Hgb","Hct","Plt","MCV","Neut%","Lymph%"],
  bmp: ["Na","K","Cl","CO2","BUN","Creatinine","Glucose","Ca"],
  cmp: ["Na","K","Cl","CO2","BUN","Creatinine","Glucose","Ca","Total Protein","Albumin","Total Bili","ALT","AST","Alk Phos"],
  coags: ["PT","INR","PTT","Fibrinogen","D-Dimer"],
  cardiac: ["Troponin I","Troponin T","CK-MB","BNP","NT-proBNP"],
  abg: ["pH","pO2","pCO2","HCO3","BE","SaO2","Lactate"],
  ua: ["Urinalysis","Urine Culture"],
  lft: ["Total Bili","Direct Bili","ALT","AST","Alk Phos","GGT","Albumin","Total Protein"],
  lipids: ["Total Chol","LDL","HDL","Triglycerides","VLDL"],
  tsh: ["TSH","Free T4","Free T3"],
  sepsis: ["WBC","Lactate","Blood Culture x2","Procalcitonin","CRP","Creatinine","Total Bili","PT/INR"],
  tox_screen: ["Urine Drug Screen","Serum EtOH","Serum Acetaminophen","Serum Salicylate"],
};

const MONITORING_QUICK = [
  "Continuous cardiac telemetry","Pulse oximetry Q1h","BP Q1h","Urine output Q1h",
  "Daily weights","Neuro checks Q1h","Serial ECGs","Strict I&Os",
  "Fall precautions","DVT prophylaxis","Aspiration precautions","NPO",
];

// ─── Inline editable field ────────────────────────────────────────────────────
function InlineField({ value, onChange, placeholder, style = {} }) {
  return (
    <input
      value={value || ""}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        background: "transparent", border: "none", outline: "none",
        color: T.text, fontFamily: "sans-serif", fontSize: 13,
        padding: "2px 4px", borderRadius: 4, width: "100%", ...style
      }}
      onFocus={e => e.target.style.background = T.surface_2}
      onBlur={e => e.target.style.background = "transparent"}
    />
  );
}

function MiniSelect({ value, onChange, options, style = {} }) {
  return (
    <select
      value={value || ""}
      onChange={e => onChange(e.target.value)}
      style={{
        fontFamily: "monospace", fontSize: "9px", textTransform: "uppercase",
        background: T.surface_2, border: `1px solid ${T.border_2}`,
        color: T.muted, padding: "2px 6px", borderRadius: 4, outline: "none",
        cursor: "pointer", ...style
      }}
    >
      <option value="">—</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function Badge({ label, color = T.teal, bg = T.teal_dim }) {
  if (!label) return null;
  return (
    <span style={{ fontFamily: "monospace", fontSize: "8px", letterSpacing: "0.1em", color, background: bg, border: `1px solid ${color}33`, padding: "2px 5px", borderRadius: 3, flexShrink: 0 }}>
      {label}
    </span>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function OrderSection({ label, icon, accentColor, children, count, onAdd, defaultOpen = true, quickPanels, quickAdds, addLabel = "+ Add" }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: "100%", padding: "12px 14px", display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "none", cursor: "pointer", borderBottom: open ? `1px solid ${T.border}` : "none" }}
        onMouseEnter={e => e.currentTarget.style.background = T.surface_2}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        <div style={{ width: 3, height: 14, background: accentColor, borderRadius: 2, flexShrink: 0 }} />
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontFamily: "serif", fontStyle: "italic", fontSize: 15, color: T.text, flex: 1, textAlign: "left" }}>{label}</span>
        {count > 0 && <span style={{ fontFamily: "monospace", fontSize: "10px", color: accentColor, background: accentColor + "22", border: `1px solid ${accentColor}33`, padding: "2px 7px", borderRadius: 4 }}>{count}</span>}
        {open ? <ChevronDown size={13} color={T.muted} /> : <ChevronRight size={13} color={T.muted} />}
      </button>
      {open && (
        <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
          {quickPanels && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
              {quickPanels.map(p => (
                <button key={p.id} onClick={() => p.onAdd()} style={{ fontFamily: "monospace", fontSize: "9px", padding: "3px 8px", borderRadius: 4, border: `1px solid ${T.border_2}`, color: T.muted, background: "transparent", cursor: "pointer" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = accentColor; e.currentTarget.style.color = accentColor; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border_2; e.currentTarget.style.color = T.muted; }}
                >{p.label}</button>
              ))}
            </div>
          )}
          {quickAdds && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
              {quickAdds.map((qa, i) => (
                <button key={i} onClick={() => qa.onAdd()} style={{ fontFamily: "monospace", fontSize: "9px", padding: "3px 8px", borderRadius: 4, border: `1px solid ${T.border_2}`, color: T.muted, background: "transparent", cursor: "pointer" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = accentColor; e.currentTarget.style.color = accentColor; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border_2; e.currentTarget.style.color = T.muted; }}
                >{qa.label}</button>
              ))}
            </div>
          )}
          {children}
          <button onClick={onAdd} style={{ width: "100%", padding: "7px 12px", borderRadius: 6, border: `1px dashed ${T.border_2}`, color: T.muted, fontFamily: "monospace", fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", textAlign: "center", cursor: "pointer", background: "transparent", marginTop: 2 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = accentColor; e.currentTarget.style.color = accentColor; e.currentTarget.style.background = accentColor + "11"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border_2; e.currentTarget.style.color = T.muted; e.currentTarget.style.background = "transparent"; }}
          >{addLabel}</button>
        </div>
      )}
    </div>
  );
}

// ─── Order card/row remove button ─────────────────────────────────────────────
function RemoveBtn({ onRemove }) {
  return (
    <button onClick={onRemove} style={{ background: "none", border: "none", color: T.dim, cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", padding: 2 }}
      onMouseEnter={e => e.currentTarget.style.color = T.red}
      onMouseLeave={e => e.currentTarget.style.color = T.dim}
    ><X size={13} /></button>
  );
}

function PromoteBtn({ onPromote }) {
  return (
    <button onClick={onPromote} style={{ fontFamily: "monospace", fontSize: "9px", color: T.dim, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}
      onMouseEnter={e => e.currentTarget.style.color = T.teal}
      onMouseLeave={e => e.currentTarget.style.color = T.dim}
    >→ Final</button>
  );
}

// ─── MEDICATION CARD ─────────────────────────────────────────────────────────
function MedCard({ item, onChange, onRemove, onPromote, accentColor }) {
  const up = (k, v) => onChange({ ...item, [k]: v });
  return (
    <div style={{ background: T.surface_2, border: `1px solid ${T.border}`, borderLeft: `2px solid ${accentColor}`, borderRadius: 7, padding: "10px 12px", marginBottom: 4, display: "flex", flexDirection: "column", gap: 7 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <InlineField value={item.name} onChange={v => up("name", v)} placeholder="Medication name" style={{ flex: 1, fontWeight: 500 }} />
        <input value={item.dose || ""} onChange={e => up("dose", e.target.value)} placeholder="Dose" style={{ fontFamily: "monospace", fontSize: "11px", color: T.green, background: T.green_dim, border: `1px solid ${T.green}33`, padding: "2px 7px", borderRadius: 4, width: 80, outline: "none" }} />
        <MiniSelect value={item.route} onChange={v => up("route", v)} options={["PO","IV","IM","SQ","SL","Inhaled","PR","Intranasal","Topical","Other"]} style={{ width: 72 }} />
        {item.source === "ai" && <Badge label="AI" />}
        {item.guideline_source && <Badge label={item.guideline_source} color={T.blue} bg={T.blue_dim} />}
        {onPromote && <PromoteBtn onPromote={onPromote} />}
        <RemoveBtn onRemove={onRemove} />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <MiniSelect value={item.frequency} onChange={v => up("frequency", v)} options={["Once","PRN","Daily","BID","TID","QID","Q4h","Q6h","Q8h","Q12h","Continuous","Weekly","Other"]} />
        <input value={item.duration || ""} onChange={e => up("duration", e.target.value)} placeholder="Duration" style={{ fontFamily: "monospace", fontSize: "10px", color: T.muted, background: "none", border: "none", borderBottom: `1px solid ${T.border}`, padding: "2px 4px", width: 90, outline: "none" }} />
        <input value={item.indication || ""} onChange={e => up("indication", e.target.value)} placeholder="Indication" style={{ flex: 1, fontFamily: "sans-serif", fontSize: "11px", color: T.muted, background: "none", border: "none", borderBottom: `1px solid ${T.border}`, padding: "2px 4px", outline: "none" }} />
        <MiniSelect value={item.status} onChange={v => up("status", v)} options={["Ordered","Given","Active","Held","Discontinued","Completed","Cancelled"]} />
      </div>
    </div>
  );
}

// ─── LAB ROW ─────────────────────────────────────────────────────────────────
function LabRow({ item, onChange, onRemove, onPromote, accentColor }) {
  const up = (k, v) => onChange({ ...item, [k]: v });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", background: T.surface_2, border: `1px solid ${T.border}`, borderLeft: `2px solid ${accentColor}`, borderRadius: 6, marginBottom: 4 }}>
      <InlineField value={item.name} onChange={v => up("name", v)} placeholder="Lab / Panel name" style={{ flex: 1 }} />
      {item.timing !== undefined && <input value={item.timing || ""} onChange={e => up("timing", e.target.value)} placeholder="Timing" style={{ fontFamily: "monospace", fontSize: "10px", color: T.muted, background: "none", border: "none", borderBottom: `1px solid ${T.border}`, padding: "2px 4px", width: 90, outline: "none" }} />}
      <MiniSelect value={item.priority} onChange={v => up("priority", v)} options={["Routine","STAT","ASAP"]} />
      {item.source === "ai" && <Badge label="AI" />}
      {item.guideline_source && <Badge label={item.guideline_source} color={T.blue} bg={T.blue_dim} />}
      {onPromote && <PromoteBtn onPromote={onPromote} />}
      <RemoveBtn onRemove={onRemove} />
    </div>
  );
}

// ─── IMAGING ROW ─────────────────────────────────────────────────────────────
function ImagingRow({ item, onChange, onRemove, onPromote, accentColor }) {
  const up = (k, v) => onChange({ ...item, [k]: v });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", background: T.surface_2, border: `1px solid ${T.border}`, borderLeft: `2px solid ${accentColor}`, borderRadius: 6, marginBottom: 4 }}>
      <MiniSelect value={item.modality} onChange={v => up("modality", v)} options={["X-Ray","CT","MRI","Ultrasound","Echo","Nuclear Med","PET","Fluoroscopy","Angio","Other"]} style={{ color: T.blue, background: T.blue_dim, border: `1px solid ${T.blue}33`, width: 90 }} />
      <InlineField value={item.study} onChange={v => up("study", v)} placeholder="Study description" style={{ flex: 1 }} />
      <MiniSelect value={item.contrast} onChange={v => up("contrast", v)} options={["Without","With","With & Without","N/A"]} />
      <MiniSelect value={item.priority} onChange={v => up("priority", v)} options={["Routine","STAT","ASAP"]} />
      {item.source === "ai" && <Badge label="AI" />}
      {onPromote && <PromoteBtn onPromote={onPromote} />}
      <RemoveBtn onRemove={onRemove} />
    </div>
  );
}

// ─── IV FLUID ROW ────────────────────────────────────────────────────────────
function IVFluidRow({ item, onChange, onRemove, onPromote, accentColor }) {
  const up = (k, v) => onChange({ ...item, [k]: v });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", background: T.surface_2, border: `1px solid ${T.border}`, borderLeft: `2px solid ${accentColor}`, borderRadius: 6, marginBottom: 4 }}>
      <MiniSelect value={item.fluid} onChange={v => up("fluid", v)} options={["NS (0.9%)","½NS (0.45%)","LR","D5W","D5½NS","D5LR","D5NS","Albumin 5%","Albumin 25%","Blood (pRBC)","FFP","Platelets","Cryoprecipitate","Other"]} style={{ color: T.sky, background: T.sky_dim, border: `1px solid ${T.sky}33`, width: 110 }} />
      <input value={item.volume || ""} onChange={e => up("volume", e.target.value)} placeholder="Volume (e.g. 1L)" style={{ fontFamily: "monospace", fontSize: "11px", color: T.text, background: "none", border: "none", borderBottom: `1px solid ${T.border}`, padding: "2px 4px", width: 80, outline: "none" }} />
      <input value={item.rate || ""} onChange={e => up("rate", e.target.value)} placeholder="Rate (e.g. 125 mL/hr)" style={{ flex: 1, fontFamily: "monospace", fontSize: "11px", color: T.muted, background: "none", border: "none", borderBottom: `1px solid ${T.border}`, padding: "2px 4px", outline: "none" }} />
      {item.access !== undefined && <MiniSelect value={item.access} onChange={v => up("access", v)} options={["PIV","PICC","CVC","IO","Arterial Line","Other"]} />}
      {item.source === "ai" && <Badge label="AI" />}
      {onPromote && <PromoteBtn onPromote={onPromote} />}
      <RemoveBtn onRemove={onRemove} />
    </div>
  );
}

// ─── PROCEDURE ROW ───────────────────────────────────────────────────────────
function ProcedureRow({ item, onChange, onRemove, accentColor }) {
  const up = (k, v) => onChange({ ...item, [k]: v });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", background: T.surface_2, border: `1px solid ${T.border}`, borderLeft: `2px solid ${accentColor}`, borderRadius: 6, marginBottom: 4 }}>
      <InlineField value={item.name} onChange={v => up("name", v)} placeholder="Procedure name" style={{ flex: 1 }} />
      <MiniSelect value={item.urgency} onChange={v => up("urgency", v)} options={["Elective","Urgent","Emergent"]} />
      <input value={item.provider || ""} onChange={e => up("provider", e.target.value)} placeholder="By / Consult" style={{ fontFamily: "monospace", fontSize: "10px", color: T.muted, background: "none", border: "none", borderBottom: `1px solid ${T.border}`, padding: "2px 4px", width: 110, outline: "none" }} />
      {item.source === "ai" && <Badge label="AI" />}
      <RemoveBtn onRemove={onRemove} />
    </div>
  );
}

// ─── CONSULT ROW ─────────────────────────────────────────────────────────────
function ConsultRow({ item, onChange, onRemove, accentColor }) {
  const up = (k, v) => onChange({ ...item, [k]: v });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", background: T.surface_2, border: `1px solid ${T.border}`, borderLeft: `2px solid ${accentColor}`, borderRadius: 6, marginBottom: 4 }}>
      <InlineField value={item.service} onChange={v => up("service", v)} placeholder="Service (e.g. Cardiology)" style={{ flex: 1 }} />
      <input value={item.reason || ""} onChange={e => up("reason", e.target.value)} placeholder="Reason / clinical question" style={{ flex: 2, fontFamily: "sans-serif", fontSize: "11px", color: T.muted, background: "none", border: "none", borderBottom: `1px solid ${T.border}`, padding: "2px 4px", outline: "none" }} />
      <MiniSelect value={item.urgency} onChange={v => up("urgency", v)} options={["Routine","Urgent","STAT"]} />
      <MiniSelect value={item.status} onChange={v => up("status", v)} options={["Placed","Accepted","Responded","Complete","Declined"]} />
      {item.source === "ai" && <Badge label="AI" />}
      <RemoveBtn onRemove={onRemove} />
    </div>
  );
}

// ─── MONITORING ROW ──────────────────────────────────────────────────────────
function MonitoringRow({ item, onChange, onRemove, accentColor }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", background: T.surface_2, border: `1px solid ${T.border}`, borderLeft: `2px solid ${accentColor}`, borderRadius: 6, marginBottom: 4 }}>
      <InlineField value={item.detail} onChange={v => onChange({ ...item, detail: v })} placeholder="Monitoring / nursing order detail" style={{ flex: 1 }} />
      <RemoveBtn onRemove={onRemove} />
    </div>
  );
}

// ─── OTHER ROW ───────────────────────────────────────────────────────────────
function OtherRow({ item, onChange, onRemove, onPromote, accentColor }) {
  const up = (k, v) => onChange({ ...item, [k]: v });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", background: T.surface_2, border: `1px solid ${T.border}`, borderLeft: `2px solid ${accentColor}`, borderRadius: 6, marginBottom: 4 }}>
      <MiniSelect value={item.type} onChange={v => up("type", v)} options={["Procedure","Monitoring","Oxygen","Airway","Splint / Cast","Wound Care","Physical Therapy","Nutrition","Consult","Nursing Order","Dietary","Respiratory Therapy","Other"]} style={{ color: T.amber, background: T.amber_dim, border: `1px solid ${T.amber}33`, width: 110 }} />
      <InlineField value={item.detail} onChange={v => up("detail", v)} placeholder="Treatment / order detail" style={{ flex: 1 }} />
      {item.source === "ai" && <Badge label="AI" />}
      {onPromote && <PromoteBtn onPromote={onPromote} />}
      <RemoveBtn onRemove={onRemove} />
    </div>
  );
}

// ─── MLabel ──────────────────────────────────────────────────────────────────
const MLabel = ({ children }) => (
  <div style={{ fontFamily: "monospace", fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: T.muted, marginBottom: 6 }}>{children}</div>
);

// ─── Guidelines Drawer ────────────────────────────────────────────────────────
function GuidelinesDrawer({ open, onClose, note, onAddToInitial, onAddToFinal }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!query || query.length < 2) { setResults([]); return; }
    clearTimeout(debounceRef.current);
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await base44.integrations.Core.InvokeLLM({
          prompt: `Return 5 clinical guideline recommendations for: "${query}". Use ACEP, AHA, ACC, IDSA, SCCM, ATS, CHEST, ACOG guidelines where applicable.`,
          response_json_schema: {
            type: "object",
            properties: {
              guidelines: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    source: { type: "string" },
                    title: { type: "string" },
                    recommendation: { type: "string" },
                    strength: { type: "string" },
                    category: { type: "string" },
                    year: { type: "string" }
                  }
                }
              }
            }
          }
        });
        setResults(res.guidelines || []);
      } catch { setResults([]); }
      setLoading(false);
    }, 400);
  }, [query]);

  if (!open) return null;

  const strengthColor = (s) => {
    if (!s) return { color: T.muted, bg: T.surface_2 };
    if (s.includes("I") && !s.includes("II") || s === "Level A" || s === "Strong") return { color: T.green, bg: T.green_dim };
    if (s.includes("IIa") || s === "Level B" || s === "Moderate") return { color: T.amber, bg: T.amber_dim };
    if (s.includes("III") || s === "Weak") return { color: T.red, bg: T.red_dim };
    return { color: T.muted, bg: T.surface_2 };
  };

  return (
    <motion.div initial={{ x: 420 }} animate={{ x: 0 }} exit={{ x: 420 }} transition={{ duration: 0.2 }}
      style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 420, background: T.surface, borderLeft: `1px solid ${T.border_2}`, boxShadow: "-8px 0 32px rgba(0,0,0,0.5)", zIndex: 40, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "16px 18px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 18 }}>⚖</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "serif", fontStyle: "italic", fontSize: 17, color: T.text }}>Clinical Guidelines</div>
          <div style={{ fontFamily: "monospace", fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", color: T.muted, marginTop: 2 }}>Evidence-based recommendations</div>
        </div>
        <button onClick={onClose} style={{ width: 26, height: 26, borderRadius: 5, border: `1px solid ${T.border_2}`, background: "transparent", color: T.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = T.red; e.currentTarget.style.color = T.red; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border_2; e.currentTarget.style.color = T.muted; }}
        >✕</button>
      </div>
      {/* Search */}
      <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ position: "relative" }}>
          <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: T.muted }} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search condition, drug, or guideline keyword…"
            style={{ width: "100%", background: T.bg, border: `1px solid ${T.border_2}`, borderRadius: 7, color: T.text, fontFamily: "sans-serif", fontSize: 13, padding: "9px 14px 9px 34px", outline: "none", boxSizing: "border-box" }}
            onFocus={e => e.target.style.borderColor = T.blue}
            onBlur={e => e.target.style.borderColor = T.border_2}
          />
          {loading && <Loader2 size={12} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: T.blue, animation: "spin 1s linear infinite" }} />}
        </div>
      </div>
      {/* Results */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
        {query.length < 2 && (
          <div style={{ textAlign: "center", padding: "32px 0", color: T.dim }}>
            <div style={{ fontSize: 28, marginBottom: 10, opacity: 0.3 }}>📖</div>
            <div style={{ fontFamily: "monospace", fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase" }}>Type to search guidelines</div>
          </div>
        )}
        {results.map((gl, i) => {
          const sc = strengthColor(gl.strength);
          return (
            <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
              <button onClick={() => setExpanded(expanded === i ? null : i)} style={{ width: "100%", padding: "12px 14px", display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "none", cursor: "pointer" }}
                onMouseEnter={e => e.currentTarget.style.background = T.card_hover}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <span style={{ fontFamily: "monospace", fontSize: "8px", letterSpacing: "0.1em", color: T.blue, background: T.blue_dim, border: `1px solid ${T.blue}33`, padding: "2px 7px", borderRadius: 3, flexShrink: 0 }}>{gl.source}</span>
                <span style={{ flex: 1, fontFamily: "sans-serif", fontSize: 12, fontWeight: 500, color: T.text, textAlign: "left" }}>{gl.title}</span>
                {gl.strength && <span style={{ fontFamily: "monospace", fontSize: "8px", color: sc.color, background: sc.bg, padding: "2px 6px", borderRadius: 3, flexShrink: 0 }}>{gl.strength}</span>}
                <ChevronDown size={12} color={T.muted} style={{ transform: expanded === i ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s" }} />
              </button>
              {expanded === i && (
                <div style={{ padding: "0 14px 12px", borderTop: `1px solid ${T.border}`, display: "flex", flexDirection: "column", gap: 8 }}>
                  <p style={{ fontFamily: "sans-serif", fontSize: 12, color: T.text, lineHeight: 1.6, paddingTop: 10 }}>{gl.recommendation}</p>
                  {gl.year && <p style={{ fontFamily: "monospace", fontSize: "9px", color: T.dim, fontStyle: "italic" }}>{gl.source} {gl.year}</p>}
                  <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                    <button onClick={() => { onAddToInitial(gl); toast.success("⚖ Added to Initial Plan"); }}
                      style={{ fontFamily: "monospace", fontSize: "9px", padding: "4px 10px", borderRadius: 4, border: `1px solid ${T.sky}44`, color: T.sky, background: T.sky_dim, cursor: "pointer" }}
                      onMouseEnter={e => { e.currentTarget.style.background = T.sky; e.currentTarget.style.color = T.bg; }}
                      onMouseLeave={e => { e.currentTarget.style.background = T.sky_dim; e.currentTarget.style.color = T.sky; }}
                    >+ Initial Plan</button>
                    <button onClick={() => { onAddToFinal(gl); toast.success("⚖ Added to Final Plan"); }}
                      style={{ fontFamily: "monospace", fontSize: "9px", padding: "4px 10px", borderRadius: 4, border: `1px solid ${T.teal}44`, color: T.teal, background: T.teal_dim, cursor: "pointer" }}
                      onMouseEnter={e => { e.currentTarget.style.background = T.teal; e.currentTarget.style.color = T.bg; }}
                      onMouseLeave={e => { e.currentTarget.style.background = T.teal_dim; e.currentTarget.style.color = T.teal; }}
                    >+ Final Plan</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {query.length >= 2 && !loading && results.length === 0 && (
          <div style={{ textAlign: "center", padding: "24px 0", color: T.dim }}>
            <div style={{ fontSize: 20, opacity: 0.3 }}>🔍</div>
            <div style={{ fontFamily: "monospace", fontSize: "10px", marginTop: 6 }}>No guidelines found</div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function TreatmentPlanTab({ note, noteId, queryClient }) {
  const emptyPlan = () => ({
    narrative: "",
    medications: [], labs: [], imaging: [], ivFluids: [], other: []
  });
  const emptyFinalPlan = () => ({
    narrative: "",
    medications: [], labs: [], imaging: [], ivFluids: [],
    procedures: [], consults: [], monitoring: [], other: []
  });

  const getTreatmentPlan = () => note?.treatmentPlan || { initial: emptyPlan(), final: emptyFinalPlan() };

  const [plan, setPlan] = useState(getTreatmentPlan);
  const [aiState, setAiState] = useState("idle"); // idle | analyzing | has_suggestions
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [guidelinesOpen, setGuidelinesOpen] = useState(false);
  const [userSettings, setUserSettings] = useState(null);

  useEffect(() => {
    base44.auth.me().then(s => setUserSettings(s)).catch(() => {});
  }, []);

  useEffect(() => {
    if (note?.treatmentPlan) setPlan(note.treatmentPlan);
  }, [note?.id]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const updateInitial = (patch) => setPlan(p => ({ ...p, initial: { ...p.initial, ...patch } }));
  const updateFinal = (patch) => setPlan(p => ({ ...p, final: { ...p.final, ...patch } }));

  const addInitialItem = (section, item) => updateInitial({ [section]: [...(plan.initial[section] || []), { id: uid(), source: "manual", ...item }] });
  const removeInitialItem = (section, id) => updateInitial({ [section]: plan.initial[section].filter(i => i.id !== id) });
  const updateInitialItem = (section, updated) => updateInitial({ [section]: plan.initial[section].map(i => i.id === updated.id ? updated : i) });

  const addFinalItem = (section, item) => updateFinal({ [section]: [...(plan.final[section] || []), { id: uid(), source: "manual", ...item }] });
  const removeFinalItem = (section, id) => updateFinal({ [section]: plan.final[section].filter(i => i.id !== id) });
  const updateFinalItem = (section, updated) => updateFinal({ [section]: plan.final[section].map(i => i.id === updated.id ? updated : i) });

  const promoteToFinal = (section, item) => {
    addFinalItem(section, { ...item, id: uid() });
    toast.success("→ Promoted to Final Plan");
  };

  const promoteAllToFinal = () => {
    const init = plan.initial;
    ["medications","labs","imaging","ivFluids","other"].forEach(sec => {
      (init[sec] || []).forEach(item => addFinalItem(sec, { ...item, id: uid() }));
    });
    toast.success("→ All initial orders promoted to Final Plan");
  };

  // ── Lab panels ────────────────────────────────────────────────────────────
  const addLabPanel = (panelId, target) => {
    const labs = LAB_PANELS[panelId] || [];
    labs.forEach(name => {
      const item = { id: uid(), name, priority: "Routine", source: "manual" };
      if (target === "initial") updateInitial({ labs: [...(plan.initial.labs || []), item] });
      else updateFinal({ labs: [...(plan.final.labs || []), item] });
    });
    toast.success(`🧪 ${panelId.toUpperCase()} panel added`);
  };

  // ── Guideline add ─────────────────────────────────────────────────────────
  const addGuidelineToInitial = (gl) => {
    addInitialItem("other", { type: "Other", detail: `[${gl.source}] ${gl.recommendation?.substring(0, 80)}…`, guideline_source: gl.source });
  };
  const addGuidelineToFinal = (gl) => {
    addFinalItem("other", { type: "Other", detail: `[${gl.source}] ${gl.recommendation?.substring(0, 80)}…`, guideline_source: gl.source });
  };

  // ── AI Suggest ────────────────────────────────────────────────────────────
  const runAI = async () => {
    setAiState("analyzing");
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a clinical decision support assistant. Generate an evidence-based treatment plan based on this patient data.

Primary Diagnosis: ${note?.diagnoses?.[0] || "Unknown"}
Other Diagnoses: ${note?.diagnoses?.slice(1).join(", ") || "None"}
Chief Complaint: ${note?.chief_complaint || "N/A"}
HPI: ${note?.history_of_present_illness || "N/A"}
Current Medications: ${note?.medications?.join(", ") || "None"}
Allergies: ${note?.allergies?.join(", ") || "None"}
Assessment: ${note?.assessment || "N/A"}
Specialty: ${userSettings?.clinical_settings?.medical_specialty?.replace(/_/g, " ") || "Internal Medicine"}

Separate into initial (immediate) and final (definitive) plans. Include medications, labs, imaging, IV fluids. Cite guidelines where applicable (ACEP, AHA, ACC, IDSA, etc).`,
        response_json_schema: {
          type: "object",
          properties: {
            initial: {
              type: "object",
              properties: {
                narrative: { type: "string" },
                medications: { type: "array", items: { type: "object", properties: { name: { type: "string" }, dose: { type: "string" }, route: { type: "string" }, frequency: { type: "string" }, indication: { type: "string" }, guideline_source: { type: "string" } } } },
                labs: { type: "array", items: { type: "object", properties: { name: { type: "string" }, priority: { type: "string" }, guideline_source: { type: "string" } } } },
                imaging: { type: "array", items: { type: "object", properties: { modality: { type: "string" }, study: { type: "string" }, priority: { type: "string" } } } },
                ivFluids: { type: "array", items: { type: "object", properties: { fluid: { type: "string" }, volume: { type: "string" }, rate: { type: "string" } } } },
                other: { type: "array", items: { type: "object", properties: { type: { type: "string" }, detail: { type: "string" } } } }
              }
            },
            final: {
              type: "object",
              properties: {
                narrative: { type: "string" },
                medications: { type: "array", items: { type: "object", properties: { name: { type: "string" }, dose: { type: "string" }, route: { type: "string" }, frequency: { type: "string" }, duration: { type: "string" }, indication: { type: "string" }, guideline_source: { type: "string" } } } },
                labs: { type: "array", items: { type: "object", properties: { name: { type: "string" }, timing: { type: "string" }, priority: { type: "string" }, guideline_source: { type: "string" } } } },
                imaging: { type: "array", items: { type: "object", properties: { modality: { type: "string" }, study: { type: "string" }, priority: { type: "string" } } } },
                procedures: { type: "array", items: { type: "object", properties: { name: { type: "string" }, urgency: { type: "string" }, provider: { type: "string" } } } },
                consults: { type: "array", items: { type: "object", properties: { service: { type: "string" }, reason: { type: "string" }, urgency: { type: "string" } } } },
                monitoring: { type: "array", items: { type: "object", properties: { detail: { type: "string" } } } },
                other: { type: "array", items: { type: "object", properties: { type: { type: "string" }, detail: { type: "string" } } } }
              }
            }
          }
        }
      });

      // Merge AI results
      if (result.initial) {
        const mergeSection = (existing, incoming) => [...(existing || []), ...(incoming || []).map(i => ({ id: uid(), source: "ai", ...i }))];
        setPlan(p => ({
          ...p,
          initial: {
            ...p.initial,
            narrative: result.initial.narrative || p.initial.narrative,
            medications: mergeSection(p.initial.medications, result.initial.medications),
            labs: mergeSection(p.initial.labs, result.initial.labs),
            imaging: mergeSection(p.initial.imaging, result.initial.imaging),
            ivFluids: mergeSection(p.initial.ivFluids, result.initial.ivFluids),
            other: mergeSection(p.initial.other, result.initial.other),
          },
          final: {
            ...p.final,
            narrative: result.final?.narrative || p.final.narrative,
            medications: mergeSection(p.final.medications, result.final?.medications),
            labs: mergeSection(p.final.labs, result.final?.labs),
            imaging: mergeSection(p.final.imaging, result.final?.imaging),
            procedures: mergeSection(p.final.procedures, result.final?.procedures),
            consults: mergeSection(p.final.consults, result.final?.consults),
            monitoring: mergeSection(p.final.monitoring, result.final?.monitoring),
            other: mergeSection(p.final.other, result.final?.other),
          }
        }));
      }
      setAiState("has_suggestions");
      toast.success("✨ Treatment recommendations ready");
    } catch {
      setAiState("idle");
      toast.error("AI recommendation failed — please try again");
    }
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const savePlan = async () => {
    setSaving(true);
    await base44.entities.ClinicalNote.update(noteId, { treatmentPlan: plan });
    queryClient.invalidateQueries({ queryKey: ["note", noteId] });
    setSavedAt(new Date());
    setSaving(false);
    toast.success("✓ Treatment plan saved");
  };

  const initialCount = Object.values(plan.initial || {}).reduce((s, v) => s + (Array.isArray(v) ? v.length : 0), 0);
  const finalCount = Object.values(plan.final || {}).reduce((s, v) => s + (Array.isArray(v) ? v.length : 0), 0);

  return (
    <div style={{ display: "grid", gridTemplateRows: "52px 1fr", height: "100%", background: T.bg, position: "relative" }}>
      {/* ── TOP BAR ── */}
      <div style={{ height: 52, background: T.surface, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 10, padding: "0 20px", flexShrink: 0 }}>
        <span style={{ fontFamily: "monospace", fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", color: saving ? T.amber : savedAt ? T.green : T.muted }}>
          {saving ? "… Saving" : savedAt ? `✓ Saved ${savedAt.toLocaleTimeString()}` : "● Unsaved"}
        </span>
        <div style={{ flex: 1 }} />
        <button onClick={() => setGuidelinesOpen(o => !o)}
          style={{ fontFamily: "monospace", fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", padding: "6px 14px", borderRadius: 6, background: T.blue_dim, color: T.blue, border: `1px solid ${T.blue}4d`, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          onMouseEnter={e => { e.currentTarget.style.background = T.blue; e.currentTarget.style.color = T.bg; }}
          onMouseLeave={e => { e.currentTarget.style.background = T.blue_dim; e.currentTarget.style.color = T.blue; }}
        ><BookOpen size={13} /> Guidelines</button>
        <button onClick={runAI} disabled={aiState === "analyzing"}
          style={{ fontFamily: "monospace", fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", padding: "6px 14px", borderRadius: 6, background: T.teal_dim, color: T.teal, border: `1px solid ${T.teal}4d`, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, opacity: aiState === "analyzing" ? 0.7 : 1 }}
          onMouseEnter={e => { if (aiState !== "analyzing") { e.currentTarget.style.background = T.teal; e.currentTarget.style.color = T.bg; } }}
          onMouseLeave={e => { e.currentTarget.style.background = T.teal_dim; e.currentTarget.style.color = T.teal; }}
        >{aiState === "analyzing" ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Analyzing…</> : <><Sparkles size={13} /> AI Suggest</>}</button>
        <button onClick={savePlan}
          style={{ fontFamily: "monospace", fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", padding: "6px 14px", borderRadius: 6, background: T.teal, color: T.bg, border: `1px solid ${T.teal}`, cursor: "pointer" }}
          onMouseEnter={e => e.currentTarget.style.background = "#00efd8"}
          onMouseLeave={e => e.currentTarget.style.background = T.teal}
        >Save Plan</button>
      </div>

      {/* ── BODY: 2 panels ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", overflow: "hidden", height: "100%" }}>

        {/* ── LEFT: INITIAL PLAN ── */}
        <div style={{ borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Panel header */}
          <div style={{ padding: "18px 22px 14px", borderBottom: `1px solid ${T.border}`, background: T.surface, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 3, height: 18, background: T.sky, borderRadius: 2, flexShrink: 0 }} />
              <span style={{ fontSize: 18 }}>📋</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "serif", fontStyle: "italic", fontSize: 18, color: T.text }}>Initial Plan</div>
                <div style={{ fontFamily: "monospace", fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", color: T.muted, marginTop: 2 }}>On-arrival orders & early interventions</div>
              </div>
              <span style={{ fontFamily: "monospace", fontSize: "10px", color: T.sky, background: T.sky_dim, border: `1px solid ${T.sky}33`, padding: "3px 8px", borderRadius: 5 }}>{initialCount} orders</span>
              <button onClick={promoteAllToFinal} style={{ fontFamily: "monospace", fontSize: "9px", letterSpacing: "0.06em", textTransform: "uppercase", padding: "5px 10px", borderRadius: 5, border: `1px solid ${T.border_2}`, color: T.muted, background: "transparent", cursor: "pointer" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = T.teal; e.currentTarget.style.color = T.teal; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = T.border_2; e.currentTarget.style.color = T.muted; }}
              >→ Final All</button>
            </div>
          </div>
          {/* Scrollable body */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 22px 32px", display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Narrative */}
            <div>
              <MLabel>Initial Management Summary</MLabel>
              <textarea value={plan.initial?.narrative || ""} onChange={e => updateInitial({ narrative: e.target.value })}
                placeholder="Summarize the immediate management approach and rationale at the time of patient arrival…"
                style={{ width: "100%", background: T.card, border: `1px solid ${T.border_2}`, borderRadius: 7, color: T.text, fontFamily: "sans-serif", fontSize: 13, padding: "10px 12px", minHeight: "72px", resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.6 }}
                onFocus={e => e.target.style.borderColor = T.sky}
                onBlur={e => e.target.style.borderColor = T.border_2}
              />
            </div>

            {/* Medications */}
            <OrderSection label="Medications" icon="💊" accentColor={T.green} count={plan.initial?.medications?.length || 0} defaultOpen={true}
              onAdd={() => addInitialItem("medications", { name: "", dose: "", route: "", frequency: "", duration: "", indication: "", status: "Ordered" })}
              addLabel="+ Add Medication">
              {(plan.initial?.medications || []).map(item => (
                <MedCard key={item.id} item={item} accentColor={T.green} onPromote={() => promoteToFinal("medications", item)}
                  onChange={u => updateInitialItem("medications", u)} onRemove={() => removeInitialItem("medications", item.id)} />
              ))}
            </OrderSection>

            {/* Labs */}
            <OrderSection label="Labs" icon="🧪" accentColor={T.purple} count={plan.initial?.labs?.length || 0} defaultOpen={true}
              onAdd={() => addInitialItem("labs", { name: "", priority: "Routine" })} addLabel="+ Add Lab"
              quickPanels={Object.keys(LAB_PANELS).map(id => ({ id, label: id.toUpperCase().replace("_", " "), onAdd: () => addLabPanel(id, "initial") }))}>
              {(plan.initial?.labs || []).map(item => (
                <LabRow key={item.id} item={item} accentColor={T.purple} onPromote={() => promoteToFinal("labs", item)}
                  onChange={u => updateInitialItem("labs", u)} onRemove={() => removeInitialItem("labs", item.id)} />
              ))}
            </OrderSection>

            {/* Imaging */}
            <OrderSection label="Imaging" icon="🩻" accentColor={T.blue} count={plan.initial?.imaging?.length || 0} defaultOpen={true}
              onAdd={() => addInitialItem("imaging", { modality: "", study: "", contrast: "Without", priority: "Routine" })} addLabel="+ Add Imaging">
              {(plan.initial?.imaging || []).map(item => (
                <ImagingRow key={item.id} item={item} accentColor={T.blue} onPromote={() => promoteToFinal("imaging", item)}
                  onChange={u => updateInitialItem("imaging", u)} onRemove={() => removeInitialItem("imaging", item.id)} />
              ))}
            </OrderSection>

            {/* IV Fluids */}
            <OrderSection label="IV / Fluids" icon="💧" accentColor={T.sky} count={plan.initial?.ivFluids?.length || 0} defaultOpen={false}
              onAdd={() => addInitialItem("ivFluids", { fluid: "", volume: "", rate: "", access: "PIV" })} addLabel="+ Add IV / Fluid">
              {(plan.initial?.ivFluids || []).map(item => (
                <IVFluidRow key={item.id} item={item} accentColor={T.sky} onPromote={() => promoteToFinal("ivFluids", item)}
                  onChange={u => updateInitialItem("ivFluids", u)} onRemove={() => removeInitialItem("ivFluids", item.id)} />
              ))}
            </OrderSection>

            {/* Other */}
            <OrderSection label="Other Treatments" icon="⚡" accentColor={T.amber} count={plan.initial?.other?.length || 0} defaultOpen={false}
              onAdd={() => addInitialItem("other", { type: "", detail: "" })} addLabel="+ Add Treatment">
              {(plan.initial?.other || []).map(item => (
                <OtherRow key={item.id} item={item} accentColor={T.amber} onPromote={() => promoteToFinal("other", item)}
                  onChange={u => updateInitialItem("other", u)} onRemove={() => removeInitialItem("other", item.id)} />
              ))}
            </OrderSection>
          </div>
        </div>

        {/* ── RIGHT: FINAL PLAN ── */}
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Panel header */}
          <div style={{ padding: "18px 22px 14px", borderBottom: `1px solid ${T.border}`, background: T.surface, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 3, height: 18, background: T.teal, borderRadius: 2, flexShrink: 0 }} />
              <span style={{ fontSize: 18 }}>✅</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "serif", fontStyle: "italic", fontSize: 18, color: T.text }}>Final Plan</div>
                <div style={{ fontFamily: "monospace", fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", color: T.muted, marginTop: 2 }}>Definitive management after full data review</div>
              </div>
              <span style={{ fontFamily: "monospace", fontSize: "10px", color: T.teal, background: T.teal_dim, border: `1px solid ${T.teal}33`, padding: "3px 8px", borderRadius: 5 }}>{finalCount} orders</span>
            </div>
          </div>
          {/* Scrollable body */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 22px 32px", display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Narrative */}
            <div>
              <MLabel>Final Management Summary</MLabel>
              <textarea value={plan.final?.narrative || ""} onChange={e => updateFinal({ narrative: e.target.value })}
                placeholder="Summarize the definitive management plan integrating all data, diagnoses, and clinical reasoning…"
                style={{ width: "100%", background: T.card, border: `1px solid ${T.border_2}`, borderRadius: 7, color: T.text, fontFamily: "sans-serif", fontSize: 13, padding: "10px 12px", minHeight: "72px", resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.6 }}
                onFocus={e => e.target.style.borderColor = T.teal}
                onBlur={e => e.target.style.borderColor = T.border_2}
              />
            </div>

            {/* Medications */}
            <OrderSection label="Medications" icon="💊" accentColor={T.green} count={plan.final?.medications?.length || 0} defaultOpen={true}
              onAdd={() => addFinalItem("medications", { name: "", dose: "", route: "", frequency: "", duration: "", indication: "", refills: "", status: "Active" })}
              addLabel="+ Add Medication">
              {(plan.final?.medications || []).map(item => (
                <MedCard key={item.id} item={item} accentColor={T.green}
                  onChange={u => updateFinalItem("medications", u)} onRemove={() => removeFinalItem("medications", item.id)} />
              ))}
            </OrderSection>

            {/* Labs */}
            <OrderSection label="Labs" icon="🧪" accentColor={T.purple} count={plan.final?.labs?.length || 0} defaultOpen={true}
              onAdd={() => addFinalItem("labs", { name: "", timing: "", priority: "Routine" })} addLabel="+ Add Lab"
              quickPanels={Object.keys(LAB_PANELS).map(id => ({ id, label: id.toUpperCase().replace("_", " "), onAdd: () => addLabPanel(id, "final") }))}>
              {(plan.final?.labs || []).map(item => (
                <LabRow key={item.id} item={item} accentColor={T.purple}
                  onChange={u => updateFinalItem("labs", u)} onRemove={() => removeFinalItem("labs", item.id)} />
              ))}
            </OrderSection>

            {/* Imaging */}
            <OrderSection label="Imaging" icon="🩻" accentColor={T.blue} count={plan.final?.imaging?.length || 0} defaultOpen={true}
              onAdd={() => addFinalItem("imaging", { modality: "", study: "", contrast: "Without", priority: "Routine" })} addLabel="+ Add Imaging">
              {(plan.final?.imaging || []).map(item => (
                <ImagingRow key={item.id} item={item} accentColor={T.blue}
                  onChange={u => updateFinalItem("imaging", u)} onRemove={() => removeFinalItem("imaging", item.id)} />
              ))}
            </OrderSection>

            {/* IV Fluids */}
            <OrderSection label="IV / Fluids" icon="💧" accentColor={T.sky} count={plan.final?.ivFluids?.length || 0} defaultOpen={false}
              onAdd={() => addFinalItem("ivFluids", { fluid: "", volume: "", rate: "" })} addLabel="+ Add IV / Fluid">
              {(plan.final?.ivFluids || []).map(item => (
                <IVFluidRow key={item.id} item={item} accentColor={T.sky}
                  onChange={u => updateFinalItem("ivFluids", u)} onRemove={() => removeFinalItem("ivFluids", item.id)} />
              ))}
            </OrderSection>

            {/* Procedures */}
            <OrderSection label="Procedures" icon="🔬" accentColor={T.orange} count={plan.final?.procedures?.length || 0} defaultOpen={false}
              onAdd={() => addFinalItem("procedures", { name: "", urgency: "", provider: "" })} addLabel="+ Add Procedure">
              {(plan.final?.procedures || []).map(item => (
                <ProcedureRow key={item.id} item={item} accentColor={T.orange}
                  onChange={u => updateFinalItem("procedures", u)} onRemove={() => removeFinalItem("procedures", item.id)} />
              ))}
            </OrderSection>

            {/* Consults */}
            <OrderSection label="Consults" icon="💬" accentColor={T.amber} count={plan.final?.consults?.length || 0} defaultOpen={false}
              onAdd={() => addFinalItem("consults", { service: "", reason: "", urgency: "Routine", status: "Placed" })} addLabel="+ Add Consult">
              {(plan.final?.consults || []).map(item => (
                <ConsultRow key={item.id} item={item} accentColor={T.amber}
                  onChange={u => updateFinalItem("consults", u)} onRemove={() => removeFinalItem("consults", item.id)} />
              ))}
            </OrderSection>

            {/* Monitoring */}
            <OrderSection label="Monitoring & Nursing" icon="📡" accentColor={T.red} count={plan.final?.monitoring?.length || 0} defaultOpen={false}
              onAdd={() => addFinalItem("monitoring", { detail: "" })} addLabel="+ Add Monitoring"
              quickAdds={MONITORING_QUICK.map(q => ({ label: q, onAdd: () => addFinalItem("monitoring", { detail: q }) }))}>
              {(plan.final?.monitoring || []).map(item => (
                <MonitoringRow key={item.id} item={item} accentColor={T.red}
                  onChange={u => updateFinalItem("monitoring", u)} onRemove={() => removeFinalItem("monitoring", item.id)} />
              ))}
            </OrderSection>

            {/* Other */}
            <OrderSection label="Other Treatments" icon="⚡" accentColor={T.amber} count={plan.final?.other?.length || 0} defaultOpen={false}
              onAdd={() => addFinalItem("other", { type: "", detail: "" })} addLabel="+ Add Treatment">
              {(plan.final?.other || []).map(item => (
                <OtherRow key={item.id} item={item} accentColor={T.amber}
                  onChange={u => updateFinalItem("other", u)} onRemove={() => removeFinalItem("other", item.id)} />
              ))}
            </OrderSection>

            {/* Footer */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 16, borderTop: `1px solid ${T.border}`, marginTop: 4 }}>
              <span style={{ fontFamily: "monospace", fontSize: "9px", color: T.dim }}>
                {savedAt ? `Last saved ${savedAt.toLocaleTimeString()}` : "Unsaved changes"}
              </span>
              <div style={{ flex: 1 }} />
              <button onClick={savePlan}
                style={{ fontFamily: "monospace", fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", padding: "7px 16px", borderRadius: 6, background: T.teal, color: T.bg, border: `1px solid ${T.teal}`, cursor: "pointer" }}
                onMouseEnter={e => e.currentTarget.style.background = "#00efd8"}
                onMouseLeave={e => e.currentTarget.style.background = T.teal}
              >Save Treatment Plan</button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Loading Overlay */}
      <AnimatePresence>
        {aiState === "analyzing" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "absolute", inset: 0, background: "rgba(8,11,16,0.75)", backdropFilter: "blur(2px)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", border: `2px solid ${T.teal}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>✨</div>
            <div style={{ fontFamily: "serif", fontStyle: "italic", fontSize: 18, color: T.text }}>Building treatment recommendations…</div>
            <div style={{ fontFamily: "monospace", fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: T.muted }}>Reviewing diagnosis, note data & clinical guidelines</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guidelines Drawer */}
      <AnimatePresence>
        {guidelinesOpen && (
          <GuidelinesDrawer open={guidelinesOpen} onClose={() => setGuidelinesOpen(false)} note={note}
            onAddToInitial={addGuidelineToInitial} onAddToFinal={addGuidelineToFinal} />
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}