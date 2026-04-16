import { useState, useCallback } from "react";

// ── Font injection ────────────────────────────────────────────────────────────
(() => {
  if (document.getElementById("hub-fonts")) return;
  const l = document.createElement("link");
  l.id = "hub-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
})();

// ── Color tokens ──────────────────────────────────────────────────────────────
const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36", up:"#0e2544",
  bd:"#1a3555", bhi:"#2a4f7a",
  txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  blue:"#3b9eff", teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0", red:"#ff3d3d",
};

// ── Lab panel definitions ─────────────────────────────────────────────────────
const LAB_PANELS = [
  {
    id:"bmp", label:"BMP", icon:"🧪",
    fields:[
      { id:"na",      label:"Na",       unit:"mEq/L",  lo:136,  hi:145,  clo:120,  chi:160  },
      { id:"k",       label:"K",        unit:"mEq/L",  lo:3.5,  hi:5.0,  clo:2.5,  chi:6.5  },
      { id:"cl",      label:"Cl",       unit:"mEq/L",  lo:98,   hi:106,  clo:80,   chi:120  },
      { id:"co2",     label:"CO2",      unit:"mEq/L",  lo:22,   hi:29,   clo:15,   chi:40   },
      { id:"bun",     label:"BUN",      unit:"mg/dL",  lo:7,    hi:20,   clo:null, chi:100  },
      { id:"cr",      label:"Cr",       unit:"mg/dL",  lo:0.6,  hi:1.2,  clo:null, chi:10   },
      { id:"glu",     label:"Glucose",  unit:"mg/dL",  lo:70,   hi:100,  clo:50,   chi:500  },
      { id:"ca",      label:"Ca",       unit:"mg/dL",  lo:8.5,  hi:10.5, clo:6.0,  chi:14.0 },
    ],
  },
  {
    id:"cbc", label:"CBC", icon:"🩸",
    fields:[
      { id:"wbc",   label:"WBC",   unit:"K/uL",  lo:4.5,  hi:11.0, clo:null, chi:30   },
      { id:"hgb",   label:"Hgb",   unit:"g/dL",  lo:12.0, hi:17.5, clo:7.0,  chi:null },
      { id:"hct",   label:"Hct",   unit:"%",     lo:36,   hi:52,   clo:21,   chi:null },
      { id:"plt",   label:"Plt",   unit:"K/uL",  lo:150,  hi:400,  clo:20,   chi:1000 },
      { id:"bands", label:"Bands", unit:"%",     lo:null, hi:5,    clo:null, chi:20   },
      { id:"segs",  label:"Segs",  unit:"%",     lo:45,   hi:75,   clo:null, chi:null },
    ],
  },
  {
    id:"lft", label:"LFTs", icon:"🫁",
    fields:[
      { id:"ast",   label:"AST",      unit:"U/L",   lo:10,  hi:40,  clo:null, chi:1000 },
      { id:"alt",   label:"ALT",      unit:"U/L",   lo:7,   hi:56,  clo:null, chi:1000 },
      { id:"alkp",  label:"Alk Phos", unit:"U/L",   lo:44,  hi:147, clo:null, chi:null },
      { id:"tbili", label:"T.Bili",   unit:"mg/dL", lo:0.2, hi:1.2, clo:null, chi:20   },
      { id:"dbili", label:"D.Bili",   unit:"mg/dL", lo:0,   hi:0.3, clo:null, chi:null },
      { id:"alb",   label:"Albumin",  unit:"g/dL",  lo:3.4, hi:5.4, clo:1.5,  chi:null },
      { id:"tp",    label:"T.Protein",unit:"g/dL",  lo:6.0, hi:8.3, clo:null, chi:null },
    ],
  },
  {
    id:"coag", label:"Coags", icon:"🩺",
    fields:[
      { id:"pt",   label:"PT",   unit:"sec",  lo:11,  hi:13.5, clo:null, chi:null },
      { id:"inr",  label:"INR",  unit:"",     lo:0.8, hi:1.2,  clo:null, chi:5.0  },
      { id:"aptt", label:"aPTT", unit:"sec",  lo:25,  hi:35,   clo:null, chi:100  },
      { id:"fbg",  label:"Fibrinogen", unit:"mg/dL", lo:200, hi:400, clo:null, chi:null },
    ],
  },
  {
    id:"cardiac", label:"Cardiac", icon:"❤️",
    fields:[
      { id:"trop",  label:"Troponin",   unit:"ng/L",  lo:null, hi:19,    clo:null, chi:null },
      { id:"bnp",   label:"BNP",        unit:"pg/mL", lo:null, hi:100,   clo:null, chi:null },
      { id:"probnp",label:"proBNP",     unit:"pg/mL", lo:null, hi:125,   clo:null, chi:null },
      { id:"ck",    label:"CK",         unit:"U/L",   lo:30,   hi:200,   clo:null, chi:null },
      { id:"ckmb",  label:"CK-MB",      unit:"ng/mL", lo:null, hi:5,     clo:null, chi:null },
      { id:"dimer", label:"D-Dimer",    unit:"ng/mL", lo:null, hi:500,   clo:null, chi:null },
    ],
  },
  {
    id:"other", label:"Other", icon:"⚗️",
    fields:[
      { id:"lac",    label:"Lactate",   unit:"mmol/L", lo:0.5,  hi:2.0,  clo:null, chi:4.0  },
      { id:"lip",    label:"Lipase",    unit:"U/L",    lo:null, hi:160,  clo:null, chi:null },
      { id:"amy",    label:"Amylase",   unit:"U/L",    lo:30,   hi:110,  clo:null, chi:null },
      { id:"mg",     label:"Mg",        unit:"mEq/L",  lo:1.7,  hi:2.2,  clo:1.0,  chi:4.0  },
      { id:"phos",   label:"Phos",      unit:"mg/dL",  lo:2.5,  hi:4.5,  clo:1.0,  chi:null },
      { id:"uric",   label:"Uric Acid", unit:"mg/dL",  lo:2.4,  hi:7.0,  clo:null, chi:null },
      { id:"tsh",    label:"TSH",       unit:"mIU/L",  lo:0.4,  hi:4.0,  clo:null, chi:null },
      { id:"preg",   label:"B-hCG",     unit:"mIU/mL", lo:null, hi:5,    clo:null, chi:null },
    ],
  },
  {
    id:"abg", label:"ABG", icon:"💨",
    fields:[
      { id:"ph",   label:"pH",    unit:"",      lo:7.35, hi:7.45, clo:7.2,  chi:7.6  },
      { id:"po2",  label:"pO2",   unit:"mmHg",  lo:80,   hi:100,  clo:60,   chi:null },
      { id:"pco2", label:"pCO2",  unit:"mmHg",  lo:35,   hi:45,   clo:20,   chi:70   },
      { id:"hco3", label:"HCO3",  unit:"mEq/L", lo:22,   hi:26,   clo:15,   chi:40   },
      { id:"sao2", label:"SaO2",  unit:"%",     lo:95,   hi:100,  clo:88,   chi:null },
      { id:"be",   label:"Base Ex",unit:"mEq/L",lo:-2,   hi:2,    clo:-10,  chi:10   },
    ],
  },
  {
    id:"ua", label:"UA", icon:"🔵",
    fields:[
      { id:"ua_wbc",  label:"WBC",     unit:"/hpf",  lo:null, hi:5,    clo:null, chi:null },
      { id:"ua_rbc",  label:"RBC",     unit:"/hpf",  lo:null, hi:2,    clo:null, chi:null },
      { id:"ua_prot", label:"Protein", unit:"",      lo:null, hi:null, clo:null, chi:null },
      { id:"ua_nit",  label:"Nitrites",unit:"",      lo:null, hi:null, clo:null, chi:null },
      { id:"ua_le",   label:"LE",      unit:"",      lo:null, hi:null, clo:null, chi:null },
      { id:"ua_glu",  label:"Glucose", unit:"",      lo:null, hi:null, clo:null, chi:null },
    ],
  },
];

const IMAGING_MODALITIES = ["CXR","CT Head","CT Chest","CT Abdomen/Pelvis","CT Angio","MRI","X-Ray","Ultrasound","Echo","Other"];
const CULTURE_SOURCES = ["Blood","Urine","Wound","Sputum","CSF","Throat","Stool","Other"];

// ── Helpers ───────────────────────────────────────────────────────────────────
function getFlag(val, field) {
  if (!val || val === "") return "normal";
  const n = parseFloat(val);
  if (isNaN(n)) return "normal";
  if ((field.clo !== null && n < field.clo) || (field.chi !== null && n > field.chi)) return "critical";
  if ((field.lo !== null && n < field.lo) || (field.hi !== null && n > field.hi)) return "abnormal";
  return "normal";
}

function flagColor(flag) {
  if (flag === "critical") return T.coral;
  if (flag === "abnormal") return T.gold;
  return T.teal;
}

function flagBg(flag) {
  if (flag === "critical") return "rgba(255,107,107,0.1)";
  if (flag === "abnormal") return "rgba(245,200,66,0.08)";
  return "transparent";
}

// ── Sub-components ────────────────────────────────────────────────────────────
function TabBar({ tabs, active, onSelect }) {
  return (
    <div style={{ display:"flex", gap:0, borderBottom:`1px solid ${T.bd}`, flexShrink:0 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onSelect(t.id)}
          style={{ padding:"10px 18px", border:"none", borderBottom: active===t.id ? `2px solid ${T.blue}` : "2px solid transparent", background:"transparent", color: active===t.id ? T.blue : T.txt4, fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight: active===t.id ? 700 : 400, cursor:"pointer", transition:"all .15s", display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
          <span style={{ fontSize:13 }}>{t.icon}</span>{t.label}
          {t.badge > 0 && <span style={{ background: t.badgeColor||T.blue, color:"#050f1e", borderRadius:10, fontSize:9, fontWeight:700, padding:"1px 5px", fontFamily:"'JetBrains Mono',monospace" }}>{t.badge}</span>}
        </button>
      ))}
    </div>
  );
}

function Panel({ title, children, accent = T.blue }) {
  return (
    <div style={{ background:T.panel, border:`1px solid ${T.bd}`, borderRadius:12, borderTop:`2px solid ${accent}`, overflow:"hidden" }}>
      <div style={{ padding:"11px 16px", borderBottom:`1px solid ${T.bd}`, fontFamily:"'Playfair Display',serif", fontSize:13, fontWeight:700, color:T.txt }}>{title}</div>
      <div style={{ padding:"14px 16px" }}>{children}</div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function ResultsViewer({ patientName, patientMrn, patientAge, patientSex, allergies = [], chiefComplaint, vitals = {} }) {
  const [tab, setTab]                 = useState("labs");
  const [activePanel, setActivePanel] = useState("bmp");
  const [labValues, setLabValues]     = useState({});
  const [imaging, setImaging]         = useState([]);
  const [cultures, setCultures]       = useState([]);
  const [pasteText, setPasteText]     = useState("");
  const [aiResult, setAiResult]       = useState("");
  const [aiLoading, setAiLoading]     = useState(false);
  const [newImaging, setNewImaging]   = useState({ modality:"CXR", findings:"", impression:"", date:"" });
  const [newCulture, setNewCulture]   = useState({ source:"Blood", organism:"", sensitivities:"", date:"", finalized:false });
  const [addingImg, setAddingImg]     = useState(false);
  const [addingCx, setAddingCx]       = useState(false);

  // ── Count critical / abnormal values across all labs ──────────────────────
  const criticalCount = (() => {
    let c = 0;
    LAB_PANELS.forEach(p => p.fields.forEach(f => {
      if (getFlag(labValues[f.id], f) === "critical") c++;
    }));
    return c;
  })();
  const abnormalCount = (() => {
    let a = 0;
    LAB_PANELS.forEach(p => p.fields.forEach(f => {
      const fl = getFlag(labValues[f.id], f);
      if (fl === "abnormal" || fl === "critical") a++;
    }));
    return a;
  })();

  // ── AI interpret ──────────────────────────────────────────────────────────
  const runInterpret = useCallback(async () => {
    if (!pasteText.trim() && Object.values(labValues).every(v => !v)) return;
    setAiLoading(true); setAiResult("");
    try {
      const labSummary = LAB_PANELS.flatMap(p =>
        p.fields.filter(f => labValues[f.id]).map(f => {
          const fl = getFlag(labValues[f.id], f);
          return `${f.label}: ${labValues[f.id]} ${f.unit} [${fl.toUpperCase()}]`;
        })
      ).join("\n");

      const ctx = [
        patientAge && `Age: ${patientAge}`,
        patientSex && `Sex: ${patientSex}`,
        chiefComplaint && `CC: ${chiefComplaint}`,
        allergies.length && `Allergies: ${allergies.join(", ")}`,
        vitals.bp && `BP: ${vitals.bp}`,
        vitals.hr && `HR: ${vitals.hr}`,
      ].filter(Boolean).join(" | ");

      const prompt = [
        ctx && `Patient context: ${ctx}`,
        labSummary && `Entered lab values:\n${labSummary}`,
        pasteText.trim() && `Raw result text:\n${pasteText.trim()}`,
      ].filter(Boolean).join("\n\n");

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514", max_tokens:1200,
          system:`You are an emergency medicine clinical decision support AI. Interpret the provided lab results and clinical data.

Return a structured interpretation with these sections:
**KEY FINDINGS** — list 3-6 most clinically significant results, one per line, starting with critical values
**CRITICAL VALUES** — any values requiring immediate action (state the value, threshold, and recommended action)
**PATTERN RECOGNITION** — identify any clinical patterns (e.g. AKI, metabolic acidosis, sepsis physiology, ACS pattern)
**CLINICAL CORRELATION** — brief interpretation in context of the chief complaint and patient demographics
**SUGGESTED FOLLOW-UP** — 2-4 concrete next steps based on the results

Be direct and clinically precise. Use ED-appropriate language. Flag any values that are immediately life-threatening.`,
          messages:[{ role:"user", content:prompt }],
        }),
      });
      const data = await res.json();
      setAiResult(data.content?.[0]?.text || "No response received.");
    } catch {
      setAiResult("\u26a0 Interpretation failed — check connection and try again.");
    } finally { setAiLoading(false); }
  }, [pasteText, labValues, patientAge, patientSex, chiefComplaint, allergies, vitals]);

  // ── Render AI result as formatted HTML ────────────────────────────────────
  const renderAI = txt =>
    txt.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/\*\*(.*?)\*\*/g, `<strong style="color:${T.teal};font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase">$1</strong>`)
      .replace(/\n/g,"<br>");

  const currentPanel = LAB_PANELS.find(p => p.id === activePanel);

  const tabs = [
    { id:"labs",    label:"Labs",    icon:"🧪", badge: criticalCount > 0 ? criticalCount : abnormalCount > 0 ? abnormalCount : 0, badgeColor: criticalCount > 0 ? T.coral : T.gold },
    { id:"imaging", label:"Imaging", icon:"🩻", badge:imaging.length, badgeColor:T.blue },
    { id:"micro",   label:"Micro",   icon:"🦠", badge:cultures.length, badgeColor:T.teal },
    { id:"interpret",label:"AI Interpret", icon:"✨", badge:0 },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:0, background:T.bg, minHeight:"calc(100vh - 88px)", fontFamily:"'DM Sans',sans-serif", color:T.txt }}>

      {/* ── Header ── */}
      <div style={{ padding:"16px 0 0", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14, flexWrap:"wrap" }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:T.txt }}>Results Viewer</div>
          {patientName && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.blue, background:"rgba(59,158,255,.1)", border:"1px solid rgba(59,158,255,.25)", borderRadius:4, padding:"2px 8px" }}>{patientName}</span>}
          {patientMrn && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.txt4, background:T.up, border:`1px solid ${T.bd}`, borderRadius:4, padding:"2px 8px" }}>MRN {patientMrn}</span>}
          {criticalCount > 0 && (
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, color:T.coral, background:"rgba(255,107,107,.1)", border:"1px solid rgba(255,107,107,.4)", borderRadius:4, padding:"2px 10px", letterSpacing:.5 }}>
              \u26a0 {criticalCount} CRITICAL VALUE{criticalCount > 1 ? "S" : ""}
            </span>
          )}
        </div>
        <TabBar tabs={tabs} active={tab} onSelect={setTab} />
      </div>

      {/* ══ LABS TAB ══ */}
      {tab === "labs" && (
        <div style={{ display:"grid", gridTemplateColumns:"160px 1fr", flex:1, gap:0, overflow:"hidden", marginTop:0 }}>

          {/* Panel sidebar */}
          <div style={{ borderRight:`1px solid ${T.bd}`, overflowY:"auto", paddingTop:8, background:"rgba(8,22,40,.4)" }}>
            {LAB_PANELS.map(p => {
              const hasCrit = p.fields.some(f => getFlag(labValues[f.id], f) === "critical");
              const hasAbn  = p.fields.some(f => getFlag(labValues[f.id], f) === "abnormal");
              const hasDone = p.fields.some(f => labValues[f.id]);
              return (
                <button key={p.id} onClick={() => setActivePanel(p.id)}
                  style={{ width:"100%", display:"flex", alignItems:"center", gap:8, padding:"9px 14px", border:"none", borderLeft: activePanel===p.id ? `2px solid ${T.blue}` : "2px solid transparent", background: activePanel===p.id ? "rgba(59,158,255,.08)" : "transparent", color: activePanel===p.id ? T.blue : T.txt3, fontFamily:"'DM Sans',sans-serif", fontSize:12, cursor:"pointer", transition:"all .12s", textAlign:"left" }}>
                  <span style={{ fontSize:14, lineHeight:1 }}>{p.icon}</span>
                  <span style={{ flex:1 }}>{p.label}</span>
                  {hasCrit && <span style={{ width:7, height:7, borderRadius:"50%", background:T.coral, flexShrink:0 }} />}
                  {!hasCrit && hasAbn && <span style={{ width:7, height:7, borderRadius:"50%", background:T.gold, flexShrink:0 }} />}
                  {!hasCrit && !hasAbn && hasDone && <span style={{ width:7, height:7, borderRadius:"50%", background:T.teal, flexShrink:0 }} />}
                  {!hasDone && <span style={{ width:7, height:7, borderRadius:"50%", border:`1.5px solid ${T.bd}`, flexShrink:0 }} />}
                </button>
              );
            })}
          </div>

          {/* Lab input grid */}
          <div style={{ overflowY:"auto", padding:"16px 20px", display:"flex", flexDirection:"column", gap:12 }}>

            {/* Critical alert banner */}
            {currentPanel && currentPanel.fields.some(f => getFlag(labValues[f.id], f) === "critical") && (
              <div style={{ padding:"9px 14px", borderRadius:8, background:"rgba(255,107,107,.09)", border:"1px solid rgba(255,107,107,.4)", borderLeft:"3px solid #ff6b6b", fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"#ff8a8a", display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:14 }}>&#x26a0;</span>
                Critical value(s) in this panel — notify provider immediately
              </div>
            )}

            {/* Panel header */}
            <div style={{ display:"flex", alignItems:"center", gap:10, paddingBottom:10, borderBottom:`1px solid ${T.bd}` }}>
              <span style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700, color:T.txt }}>{currentPanel?.icon} {currentPanel?.label}</span>
              {currentPanel && currentPanel.fields.some(f => labValues[f.id]) && (
                <button onClick={() => {
                  const clr = {};
                  currentPanel.fields.forEach(f => { clr[f.id] = ""; });
                  setLabValues(prev => ({ ...prev, ...clr }));
                }} style={{ marginLeft:"auto", padding:"3px 10px", borderRadius:5, border:`1px solid ${T.bd}`, background:"transparent", color:T.txt4, fontFamily:"'JetBrains Mono',monospace", fontSize:9, cursor:"pointer", letterSpacing:.5 }}>
                  CLEAR PANEL
                </button>
              )}
            </div>

            {/* Fields */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))", gap:8 }}>
              {currentPanel?.fields.map(f => {
                const val  = labValues[f.id] || "";
                const flag = val ? getFlag(val, f) : "normal";
                const col  = flag !== "normal" ? flagColor(flag) : T.txt;
                return (
                  <div key={f.id} style={{ padding:"10px 12px", borderRadius:9, background: flag !== "normal" ? flagBg(flag) : "rgba(14,37,68,.5)", border:`1px solid ${flag !== "normal" ? (flag==="critical"?"rgba(255,107,107,.35)":"rgba(245,200,66,.3)") : T.bd}`, transition:"all .2s" }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, color:T.txt4, letterSpacing:.04em }}>{f.label}</span>
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4 }}>{f.unit}</span>
                    </div>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="—"
                      value={val}
                      onChange={e => setLabValues(prev => ({ ...prev, [f.id]: e.target.value }))}
                      style={{ width:"100%", background:"transparent", border:"none", outline:"none", fontFamily:"'JetBrains Mono',monospace", fontSize:20, fontWeight:700, color:col, padding:0, lineHeight:1.2 }}
                    />
                    {(f.lo !== null || f.hi !== null) && (
                      <div style={{ marginTop:5, fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4 }}>
                        Ref: {f.lo ?? "—"} – {f.hi ?? "—"}
                        {flag === "critical" && <span style={{ marginLeft:6, color:T.coral, fontWeight:700, letterSpacing:.5 }}>CRITICAL</span>}
                        {flag === "abnormal" && <span style={{ marginLeft:6, color:T.gold, fontWeight:600 }}>ABN</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Anion gap calculation for BMP */}
            {activePanel === "bmp" && labValues.na && labValues.cl && labValues.co2 && (
              <div style={{ padding:"11px 14px", borderRadius:9, background:"rgba(59,158,255,.07)", border:"1px solid rgba(59,158,255,.25)", borderLeft:"3px solid rgba(59,158,255,.6)" }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.txt4, letterSpacing:.08em, textTransform:"uppercase" }}>Anion Gap </span>
                {(() => {
                  const ag = parseFloat(labValues.na) - (parseFloat(labValues.cl) + parseFloat(labValues.co2));
                  if (isNaN(ag)) return null;
                  const col = ag > 12 ? T.gold : ag > 20 ? T.coral : T.teal;
                  return (
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:18, fontWeight:700, color:col, marginLeft:10 }}>
                      {ag.toFixed(1)} {ag > 12 ? "\u2191 Elevated" : "Normal"}
                    </span>
                  );
                })()}
                {labValues.alb && (() => {
                  const ag  = parseFloat(labValues.na) - (parseFloat(labValues.cl) + parseFloat(labValues.co2));
                  const alb = parseFloat(labValues.alb);
                  if (isNaN(ag) || isNaN(alb)) return null;
                  const corr = ag + 2.5 * (4.0 - alb);
                  return <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt3, marginLeft:12 }}>Albumin-corrected: {corr.toFixed(1)}</span>;
                })()}
              </div>
            )}

            {/* eGFR for BMP */}
            {activePanel === "bmp" && labValues.cr && patientAge && (
              <div style={{ padding:"11px 14px", borderRadius:9, background:"rgba(0,229,192,.05)", border:"1px solid rgba(0,229,192,.2)", borderLeft:"3px solid rgba(0,229,192,.4)" }}>
                {(() => {
                  const cr  = parseFloat(labValues.cr);
                  const age = parseInt(patientAge);
                  if (isNaN(cr) || isNaN(age) || cr <= 0) return null;
                  const isFemale = patientSex?.toLowerCase() === "female" || patientSex?.toLowerCase() === "f";
                  const k = isFemale ? 0.7 : 0.9;
                  const a = isFemale ? -0.241 : -0.302;
                  const f = isFemale ? 1.012 : 1.0;
                  const ratio = cr / k;
                  const egfr = Math.round(142 * Math.pow(Math.min(ratio,1), a) * Math.pow(Math.max(ratio,1), -1.200) * Math.pow(0.9938, age) * f);
                  const col = egfr < 15 ? T.coral : egfr < 30 ? T.orange : egfr < 60 ? T.gold : T.teal;
                  const stage = egfr >= 90 ? "G1" : egfr >= 60 ? "G2" : egfr >= 45 ? "G3a" : egfr >= 30 ? "G3b" : egfr >= 15 ? "G4" : "G5";
                  return (
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.txt4, letterSpacing:.08em, textTransform:"uppercase" }}>eGFR (CKD-EPI)</span>
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:18, fontWeight:700, color:col }}>{egfr} mL/min/1.73m²</span>
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:col, background:`${col}18`, border:`1px solid ${col}40`, borderRadius:4, padding:"2px 7px" }}>{stage}</span>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ IMAGING TAB ══ */}
      {tab === "imaging" && (
        <div style={{ padding:"16px 0", display:"flex", flexDirection:"column", gap:12, overflowY:"auto" }}>

          {/* Add imaging form */}
          {addingImg ? (
            <Panel title="Add Imaging Study" accent={T.blue}>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <div>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4, letterSpacing:.1em, textTransform:"uppercase", marginBottom:5 }}>Modality</div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                      {IMAGING_MODALITIES.map(m => (
                        <button key={m} onClick={() => setNewImaging(p => ({ ...p, modality:m }))}
                          style={{ padding:"4px 10px", borderRadius:5, border:`1px solid ${newImaging.modality===m?"rgba(59,158,255,.5)":T.bd}`, background: newImaging.modality===m?"rgba(59,158,255,.12)":T.up, color: newImaging.modality===m?T.blue:T.txt3, fontFamily:"'DM Sans',sans-serif", fontSize:11, cursor:"pointer", transition:"all .12s" }}>
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4, letterSpacing:.1em, textTransform:"uppercase", marginBottom:5 }}>Date / Time (optional)</div>
                    <input type="text" placeholder="e.g. 14:32" value={newImaging.date} onChange={e => setNewImaging(p => ({ ...p, date:e.target.value }))}
                      style={{ background:T.up, border:`1px solid ${T.bd}`, borderRadius:7, padding:"7px 11px", color:T.txt, fontFamily:"'DM Sans',sans-serif", fontSize:12, outline:"none", width:"100%" }} />
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4, letterSpacing:.1em, textTransform:"uppercase", marginBottom:5 }}>Findings</div>
                  <textarea rows={3} placeholder="Radiologist findings or direct interpretation..." value={newImaging.findings} onChange={e => setNewImaging(p => ({ ...p, findings:e.target.value }))}
                    style={{ width:"100%", background:T.up, border:`1px solid ${T.bd}`, borderRadius:7, padding:"8px 12px", color:T.txt, fontFamily:"'DM Sans',sans-serif", fontSize:12, resize:"vertical", outline:"none", lineHeight:1.55 }} />
                </div>
                <div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4, letterSpacing:.1em, textTransform:"uppercase", marginBottom:5 }}>Impression</div>
                  <textarea rows={2} placeholder="Radiologist impression / final read..." value={newImaging.impression} onChange={e => setNewImaging(p => ({ ...p, impression:e.target.value }))}
                    style={{ width:"100%", background:T.up, border:`1px solid ${T.bd}`, borderRadius:7, padding:"8px 12px", color:T.txt, fontFamily:"'DM Sans',sans-serif", fontSize:12, resize:"vertical", outline:"none", lineHeight:1.55 }} />
                </div>
                <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                  <button onClick={() => { setAddingImg(false); setNewImaging({ modality:"CXR", findings:"", impression:"", date:"" }); }}
                    style={{ padding:"7px 16px", borderRadius:7, border:`1px solid ${T.bd}`, background:"transparent", color:T.txt4, fontFamily:"'DM Sans',sans-serif", fontSize:12, cursor:"pointer" }}>Cancel</button>
                  <button onClick={() => {
                    if (!newImaging.findings.trim() && !newImaging.impression.trim()) return;
                    setImaging(prev => [...prev, { id:Date.now(), ...newImaging }]);
                    setNewImaging({ modality:"CXR", findings:"", impression:"", date:"" });
                    setAddingImg(false);
                  }} style={{ padding:"7px 18px", borderRadius:7, border:"none", background:`linear-gradient(135deg,${T.blue},#2271d4)`, color:"#fff", fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:700, cursor:"pointer" }}>
                    Save Study
                  </button>
                </div>
              </div>
            </Panel>
          ) : (
            <button onClick={() => setAddingImg(true)}
              style={{ alignSelf:"flex-start", padding:"8px 16px", borderRadius:8, border:`1px solid rgba(59,158,255,.4)`, background:"rgba(59,158,255,.09)", color:T.blue, fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600, cursor:"pointer" }}>
              + Add Imaging Study
            </button>
          )}

          {/* Imaging results */}
          {imaging.length === 0 && !addingImg && (
            <div style={{ padding:"40px 20px", textAlign:"center", color:T.txt4, fontFamily:"'DM Sans',sans-serif", fontSize:13 }}>No imaging studies added yet</div>
          )}
          {imaging.map(img => (
            <Panel key={img.id} title={`${img.modality}${img.date ? " \u2014 " + img.date : ""}`} accent={T.blue}>
              {img.impression && (
                <div style={{ marginBottom:10, padding:"9px 12px", borderRadius:8, background:"rgba(59,158,255,.07)", border:"1px solid rgba(59,158,255,.2)" }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.blue, letterSpacing:.08em, textTransform:"uppercase", marginBottom:4 }}>Impression</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12.5, color:T.txt, lineHeight:1.6 }}>{img.impression}</div>
                </div>
              )}
              {img.findings && (
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt2, lineHeight:1.65 }}>{img.findings}</div>
              )}
              <div style={{ display:"flex", justifyContent:"flex-end", marginTop:10 }}>
                <button onClick={() => setImaging(prev => prev.filter(x => x.id !== img.id))}
                  style={{ padding:"3px 10px", borderRadius:5, border:`1px solid ${T.bd}`, background:"transparent", color:T.txt4, fontFamily:"'JetBrains Mono',monospace", fontSize:9, cursor:"pointer", letterSpacing:.5 }}>
                  REMOVE
                </button>
              </div>
            </Panel>
          ))}
        </div>
      )}

      {/* ══ MICRO TAB ══ */}
      {tab === "micro" && (
        <div style={{ padding:"16px 0", display:"flex", flexDirection:"column", gap:12, overflowY:"auto" }}>

          {addingCx ? (
            <Panel title="Add Culture Result" accent={T.teal}>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <div>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4, letterSpacing:.1em, textTransform:"uppercase", marginBottom:5 }}>Source</div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                      {CULTURE_SOURCES.map(s => (
                        <button key={s} onClick={() => setNewCulture(p => ({ ...p, source:s }))}
                          style={{ padding:"4px 10px", borderRadius:5, border:`1px solid ${newCulture.source===s?"rgba(0,229,192,.45)":T.bd}`, background: newCulture.source===s?"rgba(0,229,192,.1)":T.up, color: newCulture.source===s?T.teal:T.txt3, fontFamily:"'DM Sans',sans-serif", fontSize:11, cursor:"pointer", transition:"all .12s" }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4, letterSpacing:.1em, textTransform:"uppercase", marginBottom:5 }}>Collection Date / Time</div>
                    <input type="text" placeholder="e.g. 04/14 08:15" value={newCulture.date} onChange={e => setNewCulture(p => ({ ...p, date:e.target.value }))}
                      style={{ background:T.up, border:`1px solid ${T.bd}`, borderRadius:7, padding:"7px 11px", color:T.txt, fontFamily:"'DM Sans',sans-serif", fontSize:12, outline:"none", width:"100%" }} />
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4, letterSpacing:.1em, textTransform:"uppercase", marginBottom:5 }}>Organism (leave blank if pending)</div>
                  <input type="text" placeholder="e.g. E. coli, No growth, Pending..." value={newCulture.organism} onChange={e => setNewCulture(p => ({ ...p, organism:e.target.value }))}
                    style={{ width:"100%", background:T.up, border:`1px solid ${T.bd}`, borderRadius:7, padding:"8px 12px", color:T.txt, fontFamily:"'DM Sans',sans-serif", fontSize:12, outline:"none" }} />
                </div>
                <div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4, letterSpacing:.1em, textTransform:"uppercase", marginBottom:5 }}>Sensitivities / Notes</div>
                  <textarea rows={3} placeholder="Antibiotic sensitivities or additional micro notes..." value={newCulture.sensitivities} onChange={e => setNewCulture(p => ({ ...p, sensitivities:e.target.value }))}
                    style={{ width:"100%", background:T.up, border:`1px solid ${T.bd}`, borderRadius:7, padding:"8px 12px", color:T.txt, fontFamily:"'DM Sans',sans-serif", fontSize:12, resize:"vertical", outline:"none", lineHeight:1.55 }} />
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <button onClick={() => setNewCulture(p => ({ ...p, finalized:!p.finalized }))}
                    style={{ display:"flex", alignItems:"center", gap:7, padding:"5px 12px", borderRadius:6, border:`1px solid ${newCulture.finalized?"rgba(0,229,192,.45)":T.bd}`, background: newCulture.finalized?"rgba(0,229,192,.1)":"transparent", color: newCulture.finalized?T.teal:T.txt4, fontFamily:"'DM Sans',sans-serif", fontSize:11, cursor:"pointer" }}>
                    <span style={{ width:14, height:14, borderRadius:3, border:`1.5px solid ${newCulture.finalized?T.teal:T.txt4}`, background: newCulture.finalized?T.teal:"transparent", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:"#050f1e" }}>{newCulture.finalized?"✓":""}</span>
                    Finalized result
                  </button>
                  <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
                    <button onClick={() => { setAddingCx(false); setNewCulture({ source:"Blood", organism:"", sensitivities:"", date:"", finalized:false }); }}
                      style={{ padding:"7px 16px", borderRadius:7, border:`1px solid ${T.bd}`, background:"transparent", color:T.txt4, fontFamily:"'DM Sans',sans-serif", fontSize:12, cursor:"pointer" }}>Cancel</button>
                    <button onClick={() => {
                      setCultures(prev => [...prev, { id:Date.now(), ...newCulture }]);
                      setNewCulture({ source:"Blood", organism:"", sensitivities:"", date:"", finalized:false });
                      setAddingCx(false);
                    }} style={{ padding:"7px 18px", borderRadius:7, border:"none", background:`linear-gradient(135deg,${T.teal},#00b4d8)`, color:"#050f1e", fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:700, cursor:"pointer" }}>
                      Save Culture
                    </button>
                  </div>
                </div>
              </div>
            </Panel>
          ) : (
            <button onClick={() => setAddingCx(true)}
              style={{ alignSelf:"flex-start", padding:"8px 16px", borderRadius:8, border:`1px solid rgba(0,229,192,.38)`, background:"rgba(0,229,192,.08)", color:T.teal, fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600, cursor:"pointer" }}>
              + Add Culture Result
            </button>
          )}

          {cultures.length === 0 && !addingCx && (
            <div style={{ padding:"40px 20px", textAlign:"center", color:T.txt4, fontFamily:"'DM Sans',sans-serif", fontSize:13 }}>No culture results added yet</div>
          )}
          {cultures.map(cx => (
            <Panel key={cx.id} title={`${cx.source} Culture${cx.date ? " \u2014 " + cx.date : ""}`} accent={T.teal}>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:700, color: cx.organism ? (cx.organism.toLowerCase().includes("no growth")||cx.organism.toLowerCase().includes("negative") ? T.teal : T.orange) : T.txt4 }}>
                      {cx.organism || "Pending"}
                    </span>
                    {cx.finalized && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.teal, background:"rgba(0,229,192,.1)", border:"1px solid rgba(0,229,192,.25)", borderRadius:3, padding:"1px 6px", letterSpacing:.5 }}>FINAL</span>}
                    {!cx.finalized && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.gold, background:"rgba(245,200,66,.08)", border:"1px solid rgba(245,200,66,.25)", borderRadius:3, padding:"1px 6px", letterSpacing:.5 }}>PRELIM</span>}
                  </div>
                  {cx.sensitivities && (
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt2, lineHeight:1.6, whiteSpace:"pre-wrap" }}>{cx.sensitivities}</div>
                  )}
                </div>
                <button onClick={() => setCultures(prev => prev.filter(x => x.id !== cx.id))}
                  style={{ padding:"3px 10px", borderRadius:5, border:`1px solid ${T.bd}`, background:"transparent", color:T.txt4, fontFamily:"'JetBrains Mono',monospace", fontSize:9, cursor:"pointer", letterSpacing:.5, flexShrink:0 }}>
                  REMOVE
                </button>
              </div>
            </Panel>
          ))}
        </div>
      )}

      {/* ══ AI INTERPRET TAB ══ */}
      {tab === "interpret" && (
        <div style={{ padding:"16px 0", display:"flex", flexDirection:"column", gap:14, overflowY:"auto" }}>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            {/* Paste input */}
            <Panel title="Paste Raw Results" accent={T.purple}>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt4, lineHeight:1.6 }}>
                  Paste any raw result text from your EMR — lab printouts, radiology reports, nursing notes. AI will extract key findings and correlate with the patient context.
                </div>
                <textarea
                  rows={10}
                  placeholder={"Na 138  K 4.1  Cl 102  CO2 22  BUN 18  Cr 1.4  Glu 148\nWBC 14.2  Hgb 11.8  Hct 35  Plt 312\nTroponin 0.08\nLactate 2.8\n\nCXR: Mild pulmonary edema..."}
                  value={pasteText}
                  onChange={e => setPasteText(e.target.value)}
                  style={{ width:"100%", background:T.up, border:`1px solid ${T.bd}`, borderRadius:8, padding:"10px 12px", color:T.txt, fontFamily:"'DM Sans',sans-serif", fontSize:12, resize:"vertical", outline:"none", lineHeight:1.6, transition:"border-color .15s" }}
                  onFocus={e => e.target.style.borderColor="rgba(155,109,255,.5)"}
                  onBlur={e  => e.target.style.borderColor=T.bd}
                />

                {/* Patient context summary */}
                <div style={{ padding:"9px 12px", borderRadius:7, background:T.up, border:`1px solid ${T.bd}` }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4, letterSpacing:.08em, textTransform:"uppercase", marginBottom:5 }}>Patient context included</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt3, lineHeight:1.7 }}>
                    {[
                      patientAge && `Age ${patientAge}`,
                      patientSex,
                      chiefComplaint && `CC: ${chiefComplaint}`,
                      allergies.length > 0 && `Allergies: ${allergies.slice(0,2).join(", ")}${allergies.length > 2 ? " +" + (allergies.length-2) : ""}`,
                      Object.keys(labValues).filter(k => labValues[k]).length > 0 && `${Object.keys(labValues).filter(k => labValues[k]).length} entered lab value(s)`,
                    ].filter(Boolean).join(" \u00b7 ") || "No patient context available — enter data in other tabs"}
                  </div>
                </div>

                <button
                  onClick={runInterpret}
                  disabled={aiLoading || (!pasteText.trim() && !Object.values(labValues).some(v => v))}
                  style={{ padding:"10px 0", borderRadius:9, border:"none", background: aiLoading ? "rgba(155,109,255,.12)" : "linear-gradient(135deg,#9b6dff,#7b4de0)", color: aiLoading ? T.purple : "#fff", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:700, cursor: aiLoading ? "not-allowed" : "pointer", transition:"all .15s", opacity: (!pasteText.trim() && !Object.values(labValues).some(v => v)) ? .5 : 1 }}>
                  {aiLoading ? "Interpreting\u2026" : "\u2728 Interpret Results"}
                </button>
              </div>
            </Panel>

            {/* AI output */}
            <Panel title="AI Interpretation" accent={T.purple}>
              {!aiResult && !aiLoading && (
                <div style={{ padding:"40px 10px", textAlign:"center", color:T.txt4, fontFamily:"'DM Sans',sans-serif", fontSize:12 }}>
                  Paste results or enter lab values, then click Interpret
                </div>
              )}
              {aiLoading && (
                <div style={{ padding:"30px 10px", display:"flex", flexDirection:"column", alignItems:"center", gap:12, color:T.txt4 }}>
                  <div style={{ display:"flex", gap:6 }}>
                    {[0,.18,.36].map(d => (
                      <span key={d} style={{ width:8, height:8, borderRadius:"50%", background:T.purple, opacity:.4, animation:`dot-bounce 1s ${d}s ease-in-out infinite`, display:"inline-block" }} />
                    ))}
                  </div>
                  <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12 }}>Analyzing results\u2026</span>
                  <style>{`@keyframes dot-bounce{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-6px);opacity:1}}`}</style>
                </div>
              )}
              {aiResult && (
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12.5, color:T.txt, lineHeight:1.75 }}
                  dangerouslySetInnerHTML={{ __html: renderAI(aiResult) }} />
              )}
            </Panel>
          </div>

          {/* Quick summary of entered values */}
          {Object.values(labValues).some(v => v) && (
            <Panel title="Entered Lab Values Summary" accent={T.blue}>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {LAB_PANELS.flatMap(p => p.fields.filter(f => labValues[f.id]).map(f => {
                  const flag = getFlag(labValues[f.id], f);
                  const col  = flagColor(flag);
                  return (
                    <span key={f.id} style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, padding:"3px 9px", borderRadius:5, background: flag !== "normal" ? flagBg(flag) : T.up, border:`1px solid ${flag !== "normal" ? (flag==="critical"?"rgba(255,107,107,.35)":"rgba(245,200,66,.3)") : T.bd}`, color:col, whiteSpace:"nowrap" }}>
                      {f.label}: {labValues[f.id]} {f.unit}
                      {flag === "critical" && " \u26a0"}
                      {flag === "abnormal" && " \u2191"}
                    </span>
                  );
                }))}
              </div>
            </Panel>
          )}
        </div>
      )}
    </div>
  );
}