import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// ── Design tokens ──────────────────────────────────────────────────
const C = {
  navy:"#050f1e", slate:"#0b1d35", panel:"#0d2240", edge:"#162d4f",
  border:"#1e3a5f", muted:"#2a4d72", dim:"#4a7299", text:"#c8ddf0",
  bright:"#e8f4ff", teal:"#00d4bc", amber:"#f5a623", red:"#ff5c6c",
  green:"#2ecc71", purple:"#9b6dff", blue:"#4a90d9", rose:"#f472b6",
  gold:"#f0c040", indigo:"#818cf8",
};

// ── Lab panel definitions ──────────────────────────────────────────
const LAB_PANELS = {
  cmp: {
    label:"CMP", name:"Comprehensive Metabolic Panel", icon:"🧬",
    tests:[
      { id:"na",    name:"Sodium",        unit:"mEq/L",  lo:136, hi:145, critical_lo:125, critical_hi:155 },
      { id:"k",     name:"Potassium",     unit:"mEq/L",  lo:3.5, hi:5.1, critical_lo:3.0, critical_hi:6.0 },
      { id:"cl",    name:"Chloride",      unit:"mEq/L",  lo:98,  hi:107 },
      { id:"co2",   name:"CO₂",           unit:"mEq/L",  lo:22,  hi:29 },
      { id:"bun",   name:"BUN",           unit:"mg/dL",  lo:7,   hi:25 },
      { id:"cr",    name:"Creatinine",    unit:"mg/dL",  lo:0.6, hi:1.2 },
      { id:"gfr",   name:"eGFR",          unit:"mL/min", lo:60,  hi:999 },
      { id:"gluc",  name:"Glucose",       unit:"mg/dL",  lo:70,  hi:99, critical_lo:50, critical_hi:400 },
      { id:"ca",    name:"Calcium",       unit:"mg/dL",  lo:8.5, hi:10.5, critical_lo:7.0, critical_hi:12.0 },
      { id:"tp",    name:"Total Protein", unit:"g/dL",   lo:6.0, hi:8.3 },
      { id:"alb",   name:"Albumin",       unit:"g/dL",   lo:3.5, hi:5.0 },
      { id:"bili",  name:"Bilirubin",     unit:"mg/dL",  lo:0,   hi:1.2 },
      { id:"alt",   name:"ALT",           unit:"U/L",    lo:0,   hi:40 },
      { id:"ast",   name:"AST",           unit:"U/L",    lo:0,   hi:40 },
      { id:"alkp",  name:"Alk Phos",      unit:"U/L",    lo:44,  hi:147 },
    ]
  },
  cbc: {
    label:"CBC", name:"Complete Blood Count", icon:"🩸",
    tests:[
      { id:"wbc",   name:"WBC",            unit:"K/μL",   lo:4.5, hi:11.0, critical_lo:2.0, critical_hi:30.0 },
      { id:"rbc",   name:"RBC",            unit:"M/μL",   lo:4.2, hi:5.9 },
      { id:"hgb",   name:"Hemoglobin",     unit:"g/dL",   lo:12.0,hi:17.5, critical_lo:7.0, critical_hi:20.0 },
      { id:"hct",   name:"Hematocrit",     unit:"%",      lo:36,  hi:52 },
      { id:"mcv",   name:"MCV",            unit:"fL",     lo:80,  hi:100 },
      { id:"plt",   name:"Platelets",      unit:"K/μL",   lo:150, hi:400, critical_lo:50, critical_hi:1000 },
      { id:"neut",  name:"Neutrophils",    unit:"%",      lo:50,  hi:70 },
      { id:"lymph", name:"Lymphocytes",    unit:"%",      lo:20,  hi:40 },
      { id:"mono",  name:"Monocytes",      unit:"%",      lo:2,   hi:10 },
    ]
  },
  coags: {
    label:"Coags", name:"Coagulation Panel", icon:"🔬",
    tests:[
      { id:"pt",    name:"PT",             unit:"sec",    lo:11,  hi:13.5 },
      { id:"inr",   name:"INR",            unit:"",       lo:0.8, hi:1.1, critical_hi:5.0 },
      { id:"ptt",   name:"PTT",            unit:"sec",    lo:25,  hi:35 },
      { id:"fib",   name:"Fibrinogen",     unit:"mg/dL",  lo:200, hi:400 },
      { id:"ddimer",name:"D-Dimer",        unit:"mg/L",   lo:0,   hi:0.5 },
    ]
  },
  cardiac: {
    label:"Cardiac", name:"Cardiac Markers", icon:"❤️",
    tests:[
      { id:"trop_i", name:"Troponin I",    unit:"ng/mL",  lo:0,   hi:0.04, critical_hi:0.5 },
      { id:"bnp",    name:"BNP",           unit:"pg/mL",  lo:0,   hi:100 },
      { id:"ck",     name:"CK",            unit:"U/L",    lo:30,  hi:200 },
      { id:"ck_mb",  name:"CK-MB",         unit:"ng/mL",  lo:0,   hi:5 },
      { id:"ldh",    name:"LDH",           unit:"U/L",    lo:140, hi:280 },
    ]
  },
  abg: {
    label:"ABG", name:"Arterial Blood Gas", icon:"💨",
    tests:[
      { id:"ph",    name:"pH",             unit:"",       lo:7.35,hi:7.45, critical_lo:7.20, critical_hi:7.60 },
      { id:"pco2",  name:"PaCO₂",          unit:"mmHg",   lo:35,  hi:45, critical_lo:20, critical_hi:70 },
      { id:"po2",   name:"PaO₂",           unit:"mmHg",   lo:80,  hi:100, critical_lo:55 },
      { id:"hco3",  name:"HCO₃",           unit:"mEq/L",  lo:22,  hi:26 },
      { id:"be",    name:"Base Excess",    unit:"mEq/L",  lo:-2,  hi:2 },
      { id:"sao2",  name:"SaO₂",           unit:"%",      lo:95,  hi:100, critical_lo:90 },
      { id:"lactate",name:"Lactate",       unit:"mmol/L", lo:0,   hi:2.0, critical_hi:4.0 },
    ]
  },
  urine: {
    label:"UA", name:"Urinalysis", icon:"💧",
    tests:[
      { id:"ua_gluc",  name:"Glucose",     unit:"",       qualitative:true },
      { id:"ua_pro",   name:"Protein",     unit:"",       qualitative:true },
      { id:"ua_leuk",  name:"Leukocytes",  unit:"",       qualitative:true },
      { id:"ua_nit",   name:"Nitrites",    unit:"",       qualitative:true },
      { id:"ua_blood", name:"Blood",       unit:"",       qualitative:true },
      { id:"ua_wbc",   name:"WBC/hpf",     unit:"/hpf",   lo:0, hi:5 },
      { id:"ua_rbc",   name:"RBC/hpf",     unit:"/hpf",   lo:0, hi:2 },
    ]
  },
  other: {
    label:"Other", name:"Other Labs", icon:"⚗️",
    tests:[
      { id:"tsh",   name:"TSH",            unit:"mIU/L",  lo:0.4, hi:4.0 },
      { id:"lipase",name:"Lipase",         unit:"U/L",    lo:0,   hi:160 },
      { id:"amylase",name:"Amylase",       unit:"U/L",    lo:25,  hi:125 },
      { id:"ethoh", name:"ETOH Level",     unit:"mg/dL",  lo:0,   hi:10 },
      { id:"bhcg",  name:"β-hCG",          unit:"mIU/mL", lo:0,   hi:5 },
      { id:"procalc",name:"Procalcitonin", unit:"ng/mL",  lo:0,   hi:0.1 },
      { id:"crp",   name:"CRP",            unit:"mg/L",   lo:0,   hi:8 },
      { id:"esr",   name:"ESR",            unit:"mm/hr",  lo:0,   hi:20 },
    ]
  },
};

// ── EKG findings options ───────────────────────────────────────────
const EKG_FINDINGS = [
  "Normal sinus rhythm","Sinus tachycardia","Sinus bradycardia","Atrial fibrillation",
  "Atrial flutter","SVT","Ventricular tachycardia","Ventricular fibrillation",
  "First-degree AV block","Second-degree AV block (Mobitz I)","Second-degree AV block (Mobitz II)",
  "Third-degree (complete) AV block","LBBB","RBBB","Bifascicular block",
  "ST elevation (STEMI)","ST depression","T-wave inversions","Q waves","Delta waves (WPW)",
  "Prolonged QTc","Short QT","Peaked T waves","Hyperkalemia pattern","Brugada pattern",
  "Early repolarization","Pericarditis pattern","LVH","RVH","Poor R-wave progression",
  "Electrical alternans","Low voltage",
];

const LEADS = ["I","II","III","aVR","aVL","aVF","V1","V2","V3","V4","V5","V6"];

// ── Shared UI ──────────────────────────────────────────────────────
const Label = ({ children, style={} }) => (
  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, color:C.dim, letterSpacing:".1em", marginBottom:5, ...style }}>{children}</div>
);

const inputS = {
  background:C.edge, border:`1px solid ${C.border}`, borderRadius:8,
  padding:"7px 10px", color:C.text, fontFamily:"'DM Sans',sans-serif", fontSize:12, outline:"none", width:"100%",
};

function Pill({ children, color=C.teal, style={} }) {
  return (
    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, padding:"2px 7px", borderRadius:6, background:`${color}18`, border:`1px solid ${color}40`, color, ...style }}>
      {children}
    </span>
  );
}

function Card({ title, icon, badge, badgeColor=C.blue, right, children, style={} }) {
  return (
    <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden", ...style }}>
      <div style={{ padding:"9px 14px", background:"rgba(0,0,0,.2)", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:8 }}>
        {icon && <span style={{ fontSize:13 }}>{icon}</span>}
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, color:C.dim, letterSpacing:".1em", flex:1 }}>{title}</span>
        {badge && <Pill color={badgeColor}>{badge}</Pill>}
        {right}
      </div>
      <div style={{ padding:"13px 14px" }}>{children}</div>
    </div>
  );
}

// ── Abnormality helpers ────────────────────────────────────────────
function getFlag(test, value) {
  if (!value || isNaN(+value)) return null;
  const v = +value;
  if (test.critical_lo !== undefined && v <= test.critical_lo) return "CRIT-L";
  if (test.critical_hi !== undefined && v >= test.critical_hi) return "CRIT-H";
  if (test.lo !== undefined && v < test.lo) return "LOW";
  if (test.hi !== undefined && v > test.hi) return "HIGH";
  return "NORMAL";
}

const FLAG_STYLE = {
  "CRIT-L": { color:C.red,   bg:"rgba(255,92,108,.18)",  border:"rgba(255,92,108,.5)",  label:"CRIT ↓" },
  "CRIT-H": { color:C.red,   bg:"rgba(255,92,108,.18)",  border:"rgba(255,92,108,.5)",  label:"CRIT ↑" },
  "LOW":    { color:C.amber, bg:"rgba(245,166,35,.12)",  border:"rgba(245,166,35,.4)",  label:"↓ LOW"  },
  "HIGH":   { color:C.amber, bg:"rgba(245,166,35,.12)",  border:"rgba(245,166,35,.4)",  label:"↑ HIGH" },
  "NORMAL": { color:C.green, bg:"rgba(46,204,113,.08)",  border:"rgba(46,204,113,.3)",  label:"WNL"    },
};

// ── Drop-zone component ────────────────────────────────────────────
function DropZone({ onFile, accept="image/*,.pdf", label, icon="📎", color=C.blue }) {
  const [over, setOver] = useState(false);
  const inputRef = useRef();

  const handleDrop = useCallback(e => {
    e.preventDefault(); setOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  }, [onFile]);

  return (
    <div
      onDragOver={e=>{e.preventDefault();setOver(true)}}
      onDragLeave={()=>setOver(false)}
      onDrop={handleDrop}
      onClick={()=>inputRef.current?.click()}
      style={{
        border:`2px dashed ${over ? color : C.border}`,
        borderRadius:12, padding:"20px 16px", textAlign:"center", cursor:"pointer",
        background: over ? `${color}08` : "transparent",
        transition:"all .15s",
      }}
    >
      <input ref={inputRef} type="file" accept={accept} style={{ display:"none" }} onChange={e=>{ const f=e.target.files?.[0]; if(f) onFile(f); }} />
      <div style={{ fontSize:28, marginBottom:7 }}>{icon}</div>
      <div style={{ fontSize:12, fontWeight:600, color:C.text, marginBottom:3 }}>{label}</div>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.muted }}>
        Click or drag &amp; drop · {accept.replace(/,/g,", ")}
      </div>
    </div>
  );
}

// ── AI Analysis Panel ──────────────────────────────────────────────
function AIAnalysisPanel({ analysis, analyzing }) {
  if (analyzing) return (
    <div style={{ padding:"16px 0" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
        {[0,.15,.3].map((d,i)=><div key={i} style={{ width:7,height:7,borderRadius:"50%",background:C.teal,animation:`pulse .8s ${d}s infinite` }} />)}
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.teal, letterSpacing:".1em" }}>ANALYZING RESULTS…</span>
      </div>
      {[90,75,85,60,80,55,70].map((w,i)=>(
        <div key={i} style={{ height:10, borderRadius:5, marginBottom:8, width:`${w}%`, background:`linear-gradient(90deg,${C.edge} 0%,${C.muted}40 50%,${C.edge} 100%)`, backgroundSize:"400px 100%", animation:`shimmer 1.4s infinite ${i*.1}s` }} />
      ))}
    </div>
  );

  if (!analysis) return (
    <div style={{ textAlign:"center", padding:"28px 16px" }}>
      <div style={{ fontSize:38, marginBottom:10, opacity:.18 }}>🤖</div>
      <div style={{ fontSize:12, color:C.muted, lineHeight:1.75 }}>
        Enter results and press <strong style={{color:C.teal}}>Analyze with AI</strong> to receive a clinical summary, abnormality interpretation, guideline references, and next-step recommendations.
      </div>
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14, animation:"fadeUp .25s ease" }}>

      {/* Risk badge */}
      {analysis.risk_level && (
        <div style={{ display:"flex", alignItems:"center", gap:7, padding:"8px 12px", borderRadius:10,
          background: analysis.risk_level==="critical"||analysis.risk_level==="high" ? "rgba(255,92,108,.08)" : analysis.risk_level==="moderate"?"rgba(245,166,35,.07)":"rgba(46,204,113,.07)",
          border:`1px solid ${analysis.risk_level==="critical"||analysis.risk_level==="high"?"rgba(255,92,108,.3)":analysis.risk_level==="moderate"?"rgba(245,166,35,.28)":"rgba(46,204,113,.25)"}`,
        }}>
          <span style={{ fontSize:16 }}>{analysis.risk_level==="critical"?"🔴":analysis.risk_level==="high"?"🟠":analysis.risk_level==="moderate"?"🟡":"🟢"}</span>
          <div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, color: analysis.risk_level==="critical"||analysis.risk_level==="high"?C.red:analysis.risk_level==="moderate"?C.amber:C.green, letterSpacing:".1em" }}>
              {analysis.risk_level?.toUpperCase()} RISK
            </div>
            {analysis.risk_rationale && <div style={{ fontSize:11, color:C.dim, marginTop:2 }}>{analysis.risk_rationale}</div>}
          </div>
        </div>
      )}

      {/* Summary */}
      {analysis.clinical_summary && (
        <div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, color:C.teal, letterSpacing:".1em", marginBottom:6 }}>✦ CLINICAL SUMMARY</div>
          <div style={{ fontSize:12, color:C.text, lineHeight:1.75, padding:"10px 12px", background:"rgba(0,212,188,.05)", border:"1px solid rgba(0,212,188,.18)", borderRadius:10 }}>
            {analysis.clinical_summary}
          </div>
        </div>
      )}

      {/* Critical / abnormal */}
      {analysis.critical_findings?.length > 0 && (
        <div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, color:C.red, letterSpacing:".1em", marginBottom:6 }}>🔴 CRITICAL FINDINGS</div>
          {analysis.critical_findings.map((f,i) => (
            <div key={i} style={{ display:"flex", gap:8, padding:"7px 10px", borderRadius:8, background:"rgba(255,92,108,.07)", border:"1px solid rgba(255,92,108,.25)", marginBottom:5 }}>
              <span style={{ fontSize:12 }}>⚠</span>
              <span style={{ fontSize:12, color:C.bright, lineHeight:1.55 }}>{f}</span>
            </div>
          ))}
        </div>
      )}

      {analysis.abnormal_findings?.length > 0 && (
        <div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, color:C.amber, letterSpacing:".1em", marginBottom:6 }}>⚠ ABNORMAL RESULTS</div>
          {analysis.abnormal_findings.map((f,i) => (
            <div key={i} style={{ display:"flex", gap:8, padding:"6px 10px", borderRadius:8, background:"rgba(245,166,35,.07)", border:"1px solid rgba(245,166,35,.22)", marginBottom:4 }}>
              <span style={{ fontSize:11 }}>→</span>
              <span style={{ fontSize:11, color:C.text, lineHeight:1.55 }}>{f}</span>
            </div>
          ))}
        </div>
      )}

      {/* Interpretations */}
      {analysis.interpretations?.length > 0 && (
        <div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, color:C.blue, letterSpacing:".1em", marginBottom:6 }}>🧠 INTERPRETATION</div>
          {analysis.interpretations.map((item,i) => (
            <div key={i} style={{ marginBottom:8, padding:"8px 10px", background:C.edge, borderRadius:9, border:`1px solid ${C.border}` }}>
              <div style={{ fontSize:12, fontWeight:600, color:C.bright, marginBottom:3 }}>{item.finding}</div>
              <div style={{ fontSize:11, color:C.dim, lineHeight:1.6 }}>{item.interpretation}</div>
            </div>
          ))}
        </div>
      )}

      {/* Guidelines */}
      {analysis.guidelines?.length > 0 && (
        <div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, color:C.purple, letterSpacing:".1em", marginBottom:6 }}>📘 GUIDELINES REFERENCED</div>
          {analysis.guidelines.map((g,i) => (
            <div key={i} style={{ display:"flex", gap:7, alignItems:"flex-start", padding:"5px 0", borderBottom:`1px solid ${C.edge}` }}>
              <span style={{ fontSize:10, marginTop:1 }}>📖</span>
              <span style={{ fontSize:11, color:C.dim, lineHeight:1.55 }}>{g}</span>
            </div>
          ))}
        </div>
      )}

      {/* Next steps */}
      {analysis.next_steps?.length > 0 && (
        <div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, color:C.green, letterSpacing:".1em", marginBottom:6 }}>→ RECOMMENDED NEXT STEPS</div>
          {analysis.next_steps.map((step,i) => (
            <div key={i} style={{ display:"flex", gap:9, alignItems:"flex-start", padding:"8px 10px", borderRadius:9, background:"rgba(46,204,113,.06)", border:"1px solid rgba(46,204,113,.2)", marginBottom:5 }}>
              <div style={{ width:20, height:20, borderRadius:"50%", background:"rgba(46,204,113,.15)", border:"1px solid rgba(46,204,113,.3)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, color:C.green }}>{i+1}</span>
              </div>
              <span style={{ fontSize:12, color:C.text, lineHeight:1.6 }}>{step}</span>
            </div>
          ))}
        </div>
      )}

      {/* Diagnoses */}
      {analysis.differential?.length > 0 && (
        <div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, color:C.indigo, letterSpacing:".1em", marginBottom:6 }}>🔍 DIFFERENTIAL DIAGNOSES</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {analysis.differential.map((dx,i) => (
              <Pill key={i} color={i===0?C.teal:C.indigo}>{dx}</Pill>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
export default function Results() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [clock, setClock] = useState("");

  // ── Main tab ───────────────────────────────────────────────────
  const [mainTab, setMainTab] = useState("labs");

  // ── Patient / note context ─────────────────────────────────────
  const [patient, setPatient] = useState({ name:"", age:"", sex:"Male", cc:"" });
  const [linkedNoteId, setLinkedNoteId] = useState(null);

  // ── Labs state ─────────────────────────────────────────────────
  const [activePanel, setActivePanel] = useState("cmp");
  const [labValues, setLabValues] = useState({});          // { testId: value }
  const [labTimestamps, setLabTimestamps] = useState({});  // { panelId: datetime }
  const [uploadedLabFiles, setUploadedLabFiles] = useState([]);
  const [labNote, setLabNote] = useState("");

  // ── Imaging state ──────────────────────────────────────────────
  const [imagingStudies, setImagingStudies] = useState([]);
  const [imagingFiles, setImagingFiles] = useState([]);
  const [newStudy, setNewStudy] = useState({ modality:"CXR", region:"Chest", indication:"", findings:"", impression:"", read_by:"" });
  const [addingStudy, setAddingStudy] = useState(false);

  // ── EKG state ──────────────────────────────────────────────────
  const [ekgFindings, setEkgFindings] = useState([]);
  const [ekgMeasurements, setEkgMeasurements] = useState({ hr:"", pr:"", qrs:"", qtc:"", axis:"", rhythm:"" });
  const [ekgLeads, setEkgLeads] = useState({});
  const [ekgFiles, setEkgFiles] = useState([]);
  const [ekgNotes, setEkgNotes] = useState("");

  // ── AI state ───────────────────────────────────────────────────
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [analysisPanelOpen, setAnalysisPanelOpen] = useState(false);

  // ── Upload state ───────────────────────────────────────────────
  const [uploadingFile, setUploadingFile] = useState(false);

  // ── URL params ─────────────────────────────────────────────────
  useEffect(()=>{
    const p = new URLSearchParams(window.location.search);
    if(p.get("noteId")) setLinkedNoteId(p.get("noteId"));
    if(p.get("patientName")) setPatient(prev=>({...prev, name:p.get("patientName")}));
    if(p.get("tab")) setMainTab(p.get("tab"));
  },[]);

  // ── Clock ──────────────────────────────────────────────────────
  useEffect(()=>{
    const iv=setInterval(()=>setClock(new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",hour12:false})),1000);
    return()=>clearInterval(iv);
  },[]);

  // ── Derived: all entered lab results ──────────────────────────
  const allLabTests = Object.values(LAB_PANELS).flatMap(p => p.tests.map(t => ({ ...t, panel:p.label })));

  const enteredLabs = allLabTests.filter(t => labValues[t.id] !== undefined && labValues[t.id] !== "");

  const abnormalLabs = enteredLabs.filter(t => {
    const flag = getFlag(t, labValues[t.id]);
    return flag && flag !== "NORMAL";
  });

  const criticalLabs = abnormalLabs.filter(t => {
    const flag = getFlag(t, labValues[t.id]);
    return flag?.startsWith("CRIT");
  });

  // ── Upload file helper ─────────────────────────────────────────
  const uploadFile = async (file, type) => {
    setUploadingFile(true);
    try {
      const uploaded = await base44.integrations.Core.UploadFile({ file });
      const fileObj = { name:file.name, url:uploaded.file_url, type, size:(file.size/1024).toFixed(0)+"KB", uploaded_at:new Date().toISOString() };
      if (type==="lab")    setUploadedLabFiles(p=>[...p, fileObj]);
      if (type==="imaging") setImagingFiles(p=>[...p, fileObj]);
      if (type==="ekg")     setEkgFiles(p=>[...p, fileObj]);
      toast.success("File uploaded: " + file.name);
      return fileObj;
    } catch(err) {
      // Fallback: store locally as blob URL
      const url = URL.createObjectURL(file);
      const fileObj = { name:file.name, url, type, size:(file.size/1024).toFixed(0)+"KB", uploaded_at:new Date().toISOString(), local:true };
      if (type==="lab")     setUploadedLabFiles(p=>[...p, fileObj]);
      if (type==="imaging") setImagingFiles(p=>[...p, fileObj]);
      if (type==="ekg")     setEkgFiles(p=>[...p, fileObj]);
      toast.success("File attached locally: " + file.name);
      return fileObj;
    } finally {
      setUploadingFile(false);
    }
  };

  const toggleEkgFinding = (f) =>
    setEkgFindings(prev => prev.includes(f) ? prev.filter(x=>x!==f) : [...prev, f]);

  const addImagingStudy = () => {
    if (!newStudy.findings && !newStudy.impression) { toast.error("Add findings or impression"); return; }
    setImagingStudies(p => [...p, { ...newStudy, id:`img_${Date.now()}`, timestamp:new Date().toISOString() }]);
    setNewStudy({ modality:"CXR", region:"Chest", indication:"", findings:"", impression:"", read_by:"" });
    setAddingStudy(false);
    toast.success("Study added");
  };

  // ── Build AI context ───────────────────────────────────────────
  const buildContext = () => {
    const labStr = enteredLabs.map(t => {
      const flag = getFlag(t, labValues[t.id]);
      const fs = FLAG_STYLE[flag] || {};
      return `${t.name}: ${labValues[t.id]} ${t.unit} [${fs.label||flag||""}]`;
    }).join("\n") || "No lab values entered";

    const imgStr = imagingStudies.map(s =>
      `${s.modality} ${s.region}: ${s.impression || s.findings}`
    ).join("\n") || "No imaging studies";

    const ekgStr = ekgFindings.length > 0
      ? `EKG Findings: ${ekgFindings.join(", ")}\nMeasurements: HR ${ekgMeasurements.hr||"—"}, PR ${ekgMeasurements.pr||"—"}, QRS ${ekgMeasurements.qrs||"—"}, QTc ${ekgMeasurements.qtc||"—"}, Axis ${ekgMeasurements.axis||"—"}`
      : "No EKG data entered";

    return `PATIENT: ${patient.name||"Unknown"}, ${patient.age||"?"} y/o ${patient.sex}\nCC: ${patient.cc||"Not specified"}\n\nLABORATORY RESULTS:\n${labStr}\n\nIMAGING:\n${imgStr}\n\nEKG:\n${ekgStr}\n\nClinical Notes: ${labNote||"None"}`;
  };

  // ── AI analysis ────────────────────────────────────────────────
  const runAIAnalysis = async () => {
    const hasData = enteredLabs.length > 0 || imagingStudies.length > 0 || ekgFindings.length > 0;
    if (!hasData) { toast.error("Enter at least one result before analyzing."); return; }
    setAnalyzing(true);
    setAnalysis(null);
    setAnalysisPanelOpen(true);

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Notrya AI, a clinical decision support system specializing in results interpretation for emergency medicine. Analyze the following results and provide expert clinical guidance.

${buildContext()}

Provide your analysis as valid JSON with this exact structure:
{
  "risk_level": "normal|low|moderate|high|critical",
  "risk_rationale": "one sentence explaining risk level",
  "clinical_summary": "3-4 sentence clinical synthesis integrating all results",
  "critical_findings": ["Critical finding 1 — action required", "..."],
  "abnormal_findings": ["Abnormal value and its significance", "..."],
  "interpretations": [
    { "finding": "Lab/finding name", "interpretation": "Clinical meaning and significance" }
  ],
  "differential": ["Most likely diagnosis", "DDx 2", "DDx 3"],
  "guidelines": [
    "Guideline name and relevant recommendation — e.g. AHA 2023: Troponin >0.04 warrants serial measurement at 3h",
    "..."
  ],
  "next_steps": [
    "Specific, actionable next step with urgency",
    "..."
  ]
}

Rules:
- Only list critical_findings if truly critical/immediately actionable
- Reference specific guidelines (ACEP, AHA, IDSA, UpToDate, ACR Appropriateness Criteria)
- Next steps must be specific and guideline-driven
- If results are all normal, risk_level should be "normal" or "low"`,
        response_json_schema: {
          type:"object",
          properties:{
            risk_level:{type:"string"}, risk_rationale:{type:"string"},
            clinical_summary:{type:"string"}, critical_findings:{type:"array",items:{type:"string"}},
            abnormal_findings:{type:"array",items:{type:"string"}},
            interpretations:{type:"array"}, differential:{type:"array",items:{type:"string"}},
            guidelines:{type:"array",items:{type:"string"}}, next_steps:{type:"array",items:{type:"string"}},
          }
        }
      });
      setAnalysis(result);
    } catch(err) {
      toast.error("Analysis failed: " + err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  // ── Save results to note ───────────────────────────────────────
  const saveToNote = async () => {
    if (!linkedNoteId) { toast.error("No linked note. Open from Clinical Studio."); return; }
    const labText = enteredLabs.map(t => {
      const flag = getFlag(t, labValues[t.id]);
      return `${t.name}: ${labValues[t.id]} ${t.unit} ${flag && flag!=="NORMAL" ? `[${FLAG_STYLE[flag]?.label||flag}]` : ""}`;
    }).join("\n");
    const imgText = imagingStudies.map(s => `${s.modality} ${s.region}: ${s.impression||s.findings}`).join("\n");
    const ekgText = ekgFindings.length > 0 ? `EKG: ${ekgFindings.join(", ")}` : "";

    const fullText = [labText && `LABS:\n${labText}`, imgText && `IMAGING:\n${imgText}`, ekgText].filter(Boolean).join("\n\n");

    try {
      await base44.entities.ClinicalNote.update(linkedNoteId, { labs_imaging: fullText });
      queryClient.invalidateQueries({ queryKey:["studioNote", linkedNoteId] });
      toast.success("Results saved to note");
    } catch(err) {
      toast.error("Save failed: " + err.message);
    }
  };

  // ── Stats bar ──────────────────────────────────────────────────
  const stats = [
    { label:"Labs Entered",    value:enteredLabs.length,    c:C.teal   },
    { label:"Abnormal",        value:abnormalLabs.length,   c:C.amber  },
    { label:"Critical",        value:criticalLabs.length,   c:C.red    },
    { label:"Imaging Studies", value:imagingStudies.length, c:C.blue   },
    { label:"EKG Findings",    value:ekgFindings.length,    c:C.purple },
  ];

  // ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:C.navy, position:"fixed", left:72, top:0, right:0, bottom:0, color:C.text, display:"flex", flexDirection:"column", overflow:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#1e3a5f;border-radius:2px}
        input,textarea,select{transition:border-color .15s}
        input:focus,textarea:focus,select:focus{border-color:#4a7299 !important;outline:none}
        input::placeholder,textarea::placeholder{color:#2a4d72}
        select option{background:#0b1d35}
        button:hover{filter:brightness(1.1)}
      `}</style>

      {/* ── Navbar ──────────────────────────────────────────────── */}
      <nav style={{ height:52, background:"rgba(11,29,53,.97)", borderBottom:`1px solid ${C.border}`, backdropFilter:"blur(20px)", display:"flex", alignItems:"center", padding:"0 16px", gap:10, flexShrink:0, zIndex:100 }}>
        <span onClick={()=>navigate(createPageUrl("Home"))} style={{ fontFamily:"'Playfair Display',serif", fontSize:19, fontWeight:700, color:C.bright, cursor:"pointer", letterSpacing:"-.02em" }}>Notrya</span>
        <div style={{ width:1, height:16, background:C.border }} />
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, color:C.teal, letterSpacing:".12em" }}>RESULTS</span>
        <div style={{ flex:1 }} />

        {/* Patient bar */}
        <input value={patient.name} onChange={e=>setPatient(p=>({...p,name:e.target.value}))} placeholder="Patient name" style={{ ...inputS, width:150, padding:"4px 9px", fontSize:11, background:C.edge }} />
        <input value={patient.age}  onChange={e=>setPatient(p=>({...p,age:e.target.value}))}  placeholder="Age"          style={{ ...inputS, width:44,  padding:"4px 8px",  fontSize:11, background:C.edge }} />
        <input value={patient.cc}   onChange={e=>setPatient(p=>({...p,cc:e.target.value}))}   placeholder="CC / Dx"      style={{ ...inputS, width:120, padding:"4px 9px",  fontSize:11, background:C.edge }} />

        <div style={{ width:1, height:16, background:C.border }} />

        {/* Analyze button */}
        <button onClick={runAIAnalysis} disabled={analyzing} style={{
          display:"flex", alignItems:"center", gap:6, padding:"5px 14px", borderRadius:9,
          fontSize:11, fontWeight:700, cursor:analyzing?"wait":"pointer", border:"none",
          background: analyzing ? C.edge : `linear-gradient(135deg,${C.purple},#7c52ee)`,
          color: analyzing ? C.dim : "#fff",
        }}>
          {analyzing
            ? <><div style={{ width:11,height:11,border:`2px solid ${C.purple}44`,borderTopColor:C.purple,borderRadius:"50%",animation:"spin .6s linear infinite" }}/>Analyzing…</>
            : "✦ Analyze with AI"
          }
        </button>

        {linkedNoteId && (
          <button onClick={saveToNote} style={{ padding:"5px 13px", borderRadius:9, fontSize:11, fontWeight:700, cursor:"pointer", background:"rgba(0,212,188,.12)", border:"1px solid rgba(0,212,188,.3)", color:C.teal }}>
            💾 Save to Note
          </button>
        )}

        {/* App nav */}
        <div style={{ width:1, height:16, background:C.border }} />
        {[
          { label:"📝 Studio",      page:"ClinicalNoteStudio",    c:C.teal   },
          { label:"🔬 Stewardship", page:"DiagnosticStewardship", c:C.blue   },
          { label:"🧬 Drugs",       page:"DrugsBugs",             c:C.green  },
        ].map(p=>(
          <button key={p.page} onClick={()=>navigate(createPageUrl(p.page))} style={{ padding:"4px 10px", borderRadius:8, fontSize:10, fontWeight:600, cursor:"pointer", border:`1px solid ${p.c}44`, background:`${p.c}0e`, color:p.c }}>
            {p.label}
          </button>
        ))}
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:C.dim }}>{clock}</span>
      </nav>

      {/* ── Stats bar ────────────────────────────────────────────── */}
      <div style={{ background:C.slate, borderBottom:`1px solid ${C.border}`, padding:"7px 18px", display:"flex", gap:16, alignItems:"center", flexShrink:0 }}>
        {stats.map(s=>(
          <div key={s.label} style={{ display:"flex", gap:7, alignItems:"center" }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:18, fontWeight:700, color:s.value>0?s.c:C.muted }}>{s.value}</span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.muted }}>{s.label.toUpperCase()}</span>
          </div>
        ))}
        <div style={{ flex:1 }} />
        {criticalLabs.length > 0 && (
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 12px", borderRadius:8, background:"rgba(255,92,108,.1)", border:"1px solid rgba(255,92,108,.3)", animation:"pulse 1.2s infinite" }}>
            <div style={{ width:6,height:6,borderRadius:"50%",background:C.red }} />
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, color:C.red }}>
              {criticalLabs.length} CRITICAL VALUE{criticalLabs.length>1?"S":""}
            </span>
          </div>
        )}
        {analysis && <Pill color={C.purple}>✦ AI Analysis Ready</Pill>}
        {uploadingFile && <Pill color={C.blue}>⏫ Uploading…</Pill>}
      </div>

      {/* ── Main layout ──────────────────────────────────────────── */}
      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

        {/* ══════════════════════════════════════════════════════════
            MAIN CONTENT
        ══════════════════════════════════════════════════════════ */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

          {/* Tab bar */}
          <div style={{ display:"flex", background:C.panel, borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
            {[
              { id:"labs",    label:"🧪 Laboratory",  count:enteredLabs.length,    abn:abnormalLabs.length   },
              { id:"imaging", label:"🔬 Imaging",      count:imagingStudies.length, abn:0                    },
              { id:"ekg",     label:"❤️ EKG",          count:ekgFindings.length,    abn:0                    },
            ].map(tab=>{
              const isActive = mainTab===tab.id;
              return (
                <button key={tab.id} onClick={()=>setMainTab(tab.id)} style={{
                  display:"flex", alignItems:"center", gap:8, padding:"11px 22px",
                  borderBottom:`2px solid ${isActive?C.teal:"transparent"}`,
                  background:"transparent", border:"none", cursor:"pointer", transition:"all .15s",
                }}>
                  <span style={{ fontSize:14 }}>{tab.label.split(" ")[0]}</span>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:700, color:isActive?C.teal:C.dim, letterSpacing:".06em" }}>
                    {tab.label.split(" ").slice(1).join(" ")}
                  </span>
                  {tab.count > 0 && (
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, padding:"1px 6px", borderRadius:6,
                      background:tab.abn>0?"rgba(245,166,35,.15)":"rgba(0,212,188,.1)",
                      border:`1px solid ${tab.abn>0?"rgba(245,166,35,.35)":"rgba(0,212,188,.25)"}`,
                      color:tab.abn>0?C.amber:C.teal,
                    }}>{tab.abn>0?`${tab.abn} abn`:tab.count}</span>
                  )}
                </button>
              );
            })}
          </div>

          <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
            <AnimatePresence mode="wait">

              {/* ═══════════ LABS ═══════════ */}
              {mainTab === "labs" && (
                <motion.div key="labs" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.15}} style={{ flex:1, display:"flex", overflow:"hidden" }}>

                  {/* Panel selector sidebar */}
                  <div style={{ width:130, flexShrink:0, background:C.panel, borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", padding:"8px" }}>
                    <Label style={{ padding:"4px 6px" }}>PANELS</Label>
                    {Object.entries(LAB_PANELS).map(([pid, panel])=>{
                      const entered = panel.tests.filter(t=>labValues[t.id]!==undefined && labValues[t.id]!=="").length;
                      const abn = panel.tests.filter(t=>{ const f=getFlag(t,labValues[t.id]); return f&&f!=="NORMAL"; }).length;
                      const isActive = activePanel===pid;
                      return (
                        <div key={pid} onClick={()=>setActivePanel(pid)} style={{ display:"flex", gap:7, alignItems:"center", padding:"7px 8px", borderRadius:9, cursor:"pointer", marginBottom:2, background:isActive?"rgba(0,212,188,.09)":"transparent", border:`1px solid ${isActive?"rgba(0,212,188,.3)":"transparent"}`, transition:"all .12s" }}>
                          <span style={{ fontSize:14 }}>{panel.icon}</span>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, color:isActive?C.teal:C.text }}>{panel.label}</div>
                            {entered>0 && <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:abn>0?C.amber:C.green }}>{abn>0?`${abn} abn`:entered+" entered"}</div>}
                          </div>
                        </div>
                      );
                    })}

                    {/* Upload section */}
                    <div style={{ marginTop:"auto", paddingTop:8 }}>
                      <div style={{ border:`1px dashed ${C.border}`, borderRadius:9, padding:"8px", textAlign:"center", cursor:"pointer" }}
                        onClick={()=>document.getElementById("lab-upload")?.click()}>
                        <input id="lab-upload" type="file" accept=".pdf,image/*,.csv,.txt" style={{ display:"none" }} onChange={e=>{ const f=e.target.files?.[0]; if(f) uploadFile(f,"lab"); }} />
                        <div style={{ fontSize:16, marginBottom:3 }}>📎</div>
                        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:C.muted }}>UPLOAD REPORT</div>
                      </div>
                      {uploadedLabFiles.length>0 && (
                        <div style={{ marginTop:6 }}>
                          {uploadedLabFiles.map((f,i)=>(
                            <div key={i} style={{ fontSize:9, color:C.dim, padding:"3px 6px", borderRadius:6, background:C.edge, border:`1px solid ${C.border}`, marginBottom:3, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                              📄 {f.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Lab entry grid */}
                  <div style={{ flex:1, overflowY:"auto", padding:"16px 18px" }}>
                    {(() => {
                      const panel = LAB_PANELS[activePanel];
                      return (
                        <>
                          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                            <span style={{ fontSize:22 }}>{panel.icon}</span>
                            <div>
                              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:C.bright }}>{panel.name}</div>
                              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.dim, marginTop:1 }}>
                                {panel.tests.filter(t=>labValues[t.id]).length} / {panel.tests.length} values entered
                              </div>
                            </div>
                            <div style={{ flex:1 }} />
                            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                              <Label style={{ marginBottom:0 }}>COLLECTED:</Label>
                              <input type="datetime-local" value={labTimestamps[activePanel]||""} onChange={e=>setLabTimestamps(p=>({...p,[activePanel]:e.target.value}))} style={{ ...inputS, width:"auto", fontSize:11, padding:"4px 9px" }} />
                            </div>
                          </div>

                          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:10 }}>
                            {panel.tests.map(test=>{
                              const val = labValues[test.id] || "";
                              const flag = val ? getFlag(test, val) : null;
                              const fs = flag ? FLAG_STYLE[flag] : null;
                              const isCrit = flag?.startsWith("CRIT");
                              return (
                                <div key={test.id} style={{
                                  background: fs ? fs.bg : C.edge,
                                  border:`1px solid ${fs ? fs.border : C.border}`,
                                  borderRadius:11, padding:"11px 12px",
                                  transition:"all .15s",
                                  animation: isCrit ? "pulse 1.5s infinite" : "none",
                                }}>
                                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, color:C.dim, letterSpacing:".07em" }}>{test.name.toUpperCase()}</div>
                                    {fs && (
                                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, padding:"1px 6px", borderRadius:5, background:`${fs.color}20`, border:`1px solid ${fs.color}44`, color:fs.color }}>{fs.label}</span>
                                    )}
                                  </div>
                                  <div style={{ display:"flex", alignItems:"baseline", gap:5 }}>
                                    {test.qualitative ? (
                                      <select value={val} onChange={e=>setLabValues(p=>({...p,[test.id]:e.target.value}))} style={{ ...inputS, background:"transparent", border:"none", fontSize:16, fontWeight:700, color:fs?fs.color:C.dim, padding:0, width:"100%" }}>
                                        <option value="">—</option>
                                        {["Negative","Trace","1+","2+","3+","Positive"].map(o=><option key={o} value={o}>{o}</option>)}
                                      </select>
                                    ) : (
                                      <>
                                        <input
                                          value={val}
                                          onChange={e=>setLabValues(p=>({...p,[test.id]:e.target.value}))}
                                          placeholder="—"
                                          style={{ flex:1, background:"transparent", border:"none", outline:"none", fontSize:22, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", color:fs?fs.color:C.bright, width:0 }}
                                        />
                                        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.muted, flexShrink:0 }}>{test.unit}</span>
                                      </>
                                    )}
                                  </div>
                                  {test.lo !== undefined && !test.qualitative && (
                                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:C.muted, marginTop:4 }}>
                                      Ref: {test.lo} – {test.hi} {test.unit}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Lab notes */}
                          <div style={{ marginTop:16 }}>
                            <Label>CLINICAL NOTES / ADDITIONAL LABS</Label>
                            <textarea value={labNote} onChange={e=>setLabNote(e.target.value)} rows={3} placeholder="Free text notes, culture results, pending tests..." style={{ ...inputS, resize:"vertical", lineHeight:1.65 }} />
                          </div>

                          {/* Drop zone for report upload */}
                          <div style={{ marginTop:12 }}>
                            <DropZone
                              onFile={f=>uploadFile(f,"lab")}
                              label="Upload Lab Report (PDF, image, CSV)"
                              icon="🧪"
                              color={C.teal}
                            />
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </motion.div>
              )}

              {/* ═══════════ IMAGING ═══════════ */}
              {mainTab === "imaging" && (
                <motion.div key="imaging" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.15}} style={{ flex:1, overflowY:"auto", padding:"18px 22px" }}>
                  <div style={{ maxWidth:860, display:"flex", flexDirection:"column", gap:14 }}>

                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:C.bright }}>Imaging Studies</div>
                      <div style={{ flex:1 }} />
                      <button onClick={()=>setAddingStudy(true)} style={{ padding:"6px 14px", borderRadius:9, fontSize:11, fontWeight:700, cursor:"pointer", background:`linear-gradient(135deg,${C.blue},#3a7fc5)`, border:"none", color:"#fff", display:"flex", alignItems:"center", gap:5 }}>
                        + Add Study
                      </button>
                    </div>

                    {/* Add study form */}
                    <AnimatePresence>
                      {addingStudy && (
                        <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:.15}}>
                          <Card title="NEW IMAGING STUDY" icon="🔬" badge="ENTER RESULT" badgeColor={C.blue}>
                            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:10 }}>
                              <div>
                                <Label>MODALITY</Label>
                                <select value={newStudy.modality} onChange={e=>setNewStudy(p=>({...p,modality:e.target.value}))} style={{ ...inputS, cursor:"pointer" }}>
                                  {["CXR","CT Head","CT Chest","CT Abdomen/Pelvis","CT Chest/Abdomen/Pelvis","CT C-Spine","CT Angiogram","MRI Brain","MRI Spine","Ultrasound","FAST Exam","X-Ray","Fluoroscopy","Nuclear Medicine","PET Scan","Echocardiogram","Other"].map(m=><option key={m}>{m}</option>)}
                                </select>
                              </div>
                              <div>
                                <Label>REGION / BODY PART</Label>
                                <input value={newStudy.region} onChange={e=>setNewStudy(p=>({...p,region:e.target.value}))} style={inputS} placeholder="Chest, Abdomen…" />
                              </div>
                              <div>
                                <Label>READ BY</Label>
                                <input value={newStudy.read_by} onChange={e=>setNewStudy(p=>({...p,read_by:e.target.value}))} style={inputS} placeholder="Radiologist, preliminary…" />
                              </div>
                            </div>
                            <div style={{ marginBottom:10 }}>
                              <Label>INDICATION</Label>
                              <input value={newStudy.indication} onChange={e=>setNewStudy(p=>({...p,indication:e.target.value}))} style={inputS} placeholder="Clinical indication..." />
                            </div>
                            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
                              <div>
                                <Label>FINDINGS</Label>
                                <textarea value={newStudy.findings} onChange={e=>setNewStudy(p=>({...p,findings:e.target.value}))} rows={4} style={{ ...inputS, resize:"vertical" }} placeholder="Detailed findings..." />
                              </div>
                              <div>
                                <Label>IMPRESSION</Label>
                                <textarea value={newStudy.impression} onChange={e=>setNewStudy(p=>({...p,impression:e.target.value}))} rows={4} style={{ ...inputS, resize:"vertical" }} placeholder="Radiologist impression..." />
                              </div>
                            </div>
                            <div style={{ display:"flex", gap:8 }}>
                              <button onClick={addImagingStudy} style={{ padding:"7px 18px", borderRadius:9, fontSize:12, fontWeight:700, cursor:"pointer", border:"none", background:`linear-gradient(135deg,${C.teal},#00b8a5)`, color:C.navy }}>Save Study</button>
                              <button onClick={()=>setAddingStudy(false)} style={{ padding:"7px 14px", borderRadius:9, fontSize:12, cursor:"pointer", background:C.edge, border:`1px solid ${C.border}`, color:C.dim }}>Cancel</button>
                            </div>
                          </Card>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Studies list */}
                    {imagingStudies.length === 0 && !addingStudy ? (
                      <Card title="NO STUDIES" icon="🔬">
                        <div style={{ textAlign:"center", padding:"24px 0", color:C.muted }}>
                          <div style={{ fontSize:36, marginBottom:10, opacity:.2 }}>🔬</div>
                          <div style={{ fontSize:12 }}>No imaging studies entered yet. Click <strong style={{color:C.blue}}>Add Study</strong> to enter results.</div>
                        </div>
                      </Card>
                    ) : (
                      imagingStudies.map((study, i) => (
                        <motion.div key={study.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*.06}}>
                          <Card
                            title={`${study.modality} — ${study.region}`}
                            icon="🔬"
                            badge={study.read_by || "Preliminary"}
                            badgeColor={C.blue}
                            right={
                              <button onClick={()=>setImagingStudies(p=>p.filter(s=>s.id!==study.id))} style={{ padding:"2px 8px", borderRadius:6, fontSize:10, cursor:"pointer", background:"transparent", border:`1px solid ${C.border}`, color:C.muted }}>✕</button>
                            }
                          >
                            {study.indication && (
                              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.muted, marginBottom:8 }}>Indication: {study.indication}</div>
                            )}
                            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                              {study.findings && (
                                <div>
                                  <Label>FINDINGS</Label>
                                  <div style={{ fontSize:12, color:C.text, lineHeight:1.7 }}>{study.findings}</div>
                                </div>
                              )}
                              {study.impression && (
                                <div>
                                  <Label>IMPRESSION</Label>
                                  <div style={{ fontSize:12, color:C.bright, lineHeight:1.7, fontWeight:500 }}>{study.impression}</div>
                                </div>
                              )}
                            </div>
                          </Card>
                        </motion.div>
                      ))
                    )}

                    {/* Upload image */}
                    <Card title="UPLOAD IMAGING" icon="📎">
                      <DropZone onFile={f=>uploadFile(f,"imaging")} label="Upload DICOM, image, or radiology report PDF" icon="🔬" color={C.blue} />
                      {imagingFiles.length > 0 && (
                        <div style={{ marginTop:10, display:"flex", flexWrap:"wrap", gap:8 }}>
                          {imagingFiles.map((f,i)=>(
                            <div key={i} style={{ display:"flex", gap:7, alignItems:"center", padding:"5px 10px", borderRadius:8, background:C.edge, border:`1px solid ${C.border}` }}>
                              {f.url && f.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                <img src={f.url} alt={f.name} style={{ width:40, height:40, objectFit:"cover", borderRadius:5 }} />
                              ) : <span style={{ fontSize:20 }}>📄</span>}
                              <div>
                                <div style={{ fontSize:11, fontWeight:600, color:C.bright }}>{f.name}</div>
                                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.dim }}>{f.size}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  </div>
                </motion.div>
              )}

              {/* ═══════════ EKG ═══════════ */}
              {mainTab === "ekg" && (
                <motion.div key="ekg" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.15}} style={{ flex:1, overflowY:"auto", padding:"18px 22px" }}>
                  <div style={{ maxWidth:900, display:"flex", flexDirection:"column", gap:14 }}>

                    <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:C.bright }}>EKG Interpretation</div>

                    {/* Measurements */}
                    <Card title="EKG MEASUREMENTS" icon="📏">
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:10 }}>
                        {[
                          { k:"hr",    label:"HEART RATE",  unit:"bpm",  crit:v=>+v>150||+v<40 },
                          { k:"pr",    label:"PR INTERVAL", unit:"ms",   crit:v=>+v>200||+v<120 },
                          { k:"qrs",   label:"QRS DURATION",unit:"ms",   crit:v=>+v>120 },
                          { k:"qtc",   label:"QTc",         unit:"ms",   crit:v=>+v>500 },
                          { k:"axis",  label:"AXIS",        unit:"°",    crit:v=>false },
                          { k:"rhythm",label:"RHYTHM",      unit:"",     crit:v=>false, text:true },
                        ].map(m=>{
                          const val = ekgMeasurements[m.k];
                          const isAbn = val && m.crit(val);
                          return (
                            <div key={m.k} style={{ background:isAbn?"rgba(255,92,108,.07)":C.edge, border:`1px solid ${isAbn?"rgba(255,92,108,.4)":C.border}`, borderRadius:10, padding:"10px 10px" }}>
                              <Label>{m.label}</Label>
                              <input value={val||""} onChange={e=>setEkgMeasurements(p=>({...p,[m.k]:e.target.value}))} placeholder="—" style={{ width:"100%", background:"transparent", border:"none", outline:"none", fontSize: m.text?13:20, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", color:isAbn?C.red:C.bright }} />
                              {m.unit && <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:isAbn?C.red:C.muted }}>{isAbn?"⚠ CRITICAL":m.unit}</div>}
                            </div>
                          );
                        })}
                      </div>
                    </Card>

                    {/* Findings checkboxes */}
                    <Card title="EKG FINDINGS" icon="❤️" badge={`${ekgFindings.length} SELECTED`} badgeColor={ekgFindings.length>0?C.teal:C.dim}>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                        {EKG_FINDINGS.map(f=>{
                          const isSel = ekgFindings.includes(f);
                          const isCrit = ["ST elevation (STEMI)","Ventricular fibrillation","Ventricular tachycardia","Third-degree (complete) AV block","Ventricular tachycardia"].includes(f);
                          return (
                            <div key={f} onClick={()=>toggleEkgFinding(f)} style={{
                              display:"flex", alignItems:"center", gap:6, padding:"5px 10px", borderRadius:8, cursor:"pointer", transition:"all .12s",
                              background: isSel ? (isCrit?"rgba(255,92,108,.15)":"rgba(0,212,188,.1)") : C.edge,
                              border:`1px solid ${isSel ? (isCrit?"rgba(255,92,108,.45)":"rgba(0,212,188,.35)") : C.border}`,
                            }}>
                              <div style={{ width:14, height:14, borderRadius:4, border:`2px solid ${isSel?(isCrit?C.red:C.teal):C.muted}`, background:isSel?(isCrit?C.red:C.teal):"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all .12s" }}>
                                {isSel && <span style={{ fontSize:9, color:C.navy, fontWeight:700 }}>✓</span>}
                              </div>
                              <span style={{ fontSize:11, fontWeight:isSel?600:400, color:isSel?(isCrit?C.red:C.teal):C.dim }}>{f}</span>
                              {isCrit && isSel && <span style={{ fontSize:10 }}>🔴</span>}
                            </div>
                          );
                        })}
                      </div>

                      {/* Selected findings summary */}
                      {ekgFindings.length > 0 && (
                        <div style={{ marginTop:12, padding:"10px 12px", borderRadius:10, background:"rgba(0,212,188,.05)", border:"1px solid rgba(0,212,188,.2)" }}>
                          <Label>SELECTED FINDINGS</Label>
                          <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                            {ekgFindings.map(f=><Pill key={f} color={["ST elevation (STEMI)","Ventricular fibrillation","Ventricular tachycardia"].includes(f)?C.red:C.teal}>{f}</Pill>)}
                          </div>
                        </div>
                      )}
                    </Card>

                    {/* Lead-specific findings */}
                    <Card title="LEAD-SPECIFIC FINDINGS" icon="📊">
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:8 }}>
                        {LEADS.map(lead=>(
                          <div key={lead} style={{ background:C.edge, border:`1px solid ${C.border}`, borderRadius:9, padding:"8px 9px" }}>
                            <Label>{lead}</Label>
                            <input value={ekgLeads[lead]||""} onChange={e=>setEkgLeads(p=>({...p,[lead]:e.target.value}))} placeholder="Normal" style={{ width:"100%", background:"transparent", border:"none", outline:"none", fontSize:11, color:C.text, fontFamily:"'DM Sans',sans-serif" }} />
                          </div>
                        ))}
                      </div>
                    </Card>

                    {/* Narrative / EKG notes */}
                    <Card title="NARRATIVE INTERPRETATION" icon="📝">
                      <textarea value={ekgNotes} onChange={e=>setEkgNotes(e.target.value)} rows={3} placeholder="Free text interpretation, clinical correlation, comparison to prior EKG..." style={{ ...inputS, resize:"vertical", lineHeight:1.65 }} />
                    </Card>

                    {/* Upload EKG */}
                    <Card title="UPLOAD EKG IMAGE / PDF" icon="📎">
                      <DropZone onFile={f=>uploadFile(f,"ekg")} label="Upload EKG tracing (image or PDF)" icon="❤️" color={C.rose} />
                      {ekgFiles.length > 0 && (
                        <div style={{ marginTop:10, display:"flex", flexWrap:"wrap", gap:8 }}>
                          {ekgFiles.map((f,i)=>(
                            <div key={i} style={{ display:"flex", gap:8, alignItems:"center", padding:"5px 10px", borderRadius:8, background:C.edge, border:`1px solid ${C.border}` }}>
                              {f.url && f.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                                ? <img src={f.url} alt="EKG" style={{ width:80, height:50, objectFit:"cover", borderRadius:5 }} />
                                : <span style={{ fontSize:20 }}>📄</span>}
                              <div>
                                <div style={{ fontSize:11, fontWeight:600, color:C.bright }}>{f.name}</div>
                                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.dim }}>{f.size}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            AI ANALYSIS SIDE PANEL
        ══════════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {analysisPanelOpen && (
            <motion.div
              initial={{ width:0, opacity:0 }}
              animate={{ width:320, opacity:1 }}
              exit={{ width:0, opacity:0 }}
              transition={{ duration:.22 }}
              style={{ background:C.panel, borderLeft:`1px solid ${C.border}`, display:"flex", flexDirection:"column", overflow:"hidden", flexShrink:0 }}
            >
              {/* Panel header */}
              <div style={{ padding:"10px 14px", borderBottom:`1px solid ${C.border}`, background:"rgba(0,0,0,.2)", display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:analyzing?C.amber:analysis?C.teal:C.dim, animation:analyzing?"pulse .8s infinite":"none" }} />
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, color:C.teal, letterSpacing:".1em", flex:1 }}>AI ANALYSIS</span>
                <button onClick={()=>setAnalysisPanelOpen(false)} style={{ padding:"2px 8px", borderRadius:6, fontSize:11, cursor:"pointer", background:"transparent", border:`1px solid ${C.border}`, color:C.muted }}>✕</button>
              </div>

              {/* Reanalyze */}
              <div style={{ padding:"8px 12px", borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
                <button onClick={runAIAnalysis} disabled={analyzing} style={{ width:"100%", padding:"7px", borderRadius:9, fontSize:11, fontWeight:700, cursor:analyzing?"wait":"pointer", border:"none", background:analyzing?C.edge:`linear-gradient(135deg,${C.purple},#7c52ee)`, color:analyzing?C.dim:"#fff", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                  {analyzing
                    ? <><div style={{ width:10,height:10,border:`2px solid ${C.purple}44`,borderTopColor:C.purple,borderRadius:"50%",animation:"spin .6s linear infinite" }}/>Analyzing…</>
                    : "✦ Re-Analyze"
                  }
                </button>
              </div>

              {/* Scrollable analysis */}
              <div style={{ flex:1, overflowY:"auto", padding:"14px 14px" }}>
                <AIAnalysisPanel analysis={analysis} analyzing={analyzing} />
              </div>

              {/* Footer: save to note */}
              {analysis && linkedNoteId && (
                <div style={{ padding:"10px 12px", borderTop:`1px solid ${C.border}`, flexShrink:0 }}>
                  <button onClick={saveToNote} style={{ width:"100%", padding:"8px", borderRadius:10, fontSize:12, fontWeight:700, cursor:"pointer", border:"none", background:`linear-gradient(135deg,${C.teal},#00b8a5)`, color:C.navy }}>
                    💾 Save Results to Note
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle button if panel closed */}
        {!analysisPanelOpen && (
          <button onClick={()=>setAnalysisPanelOpen(true)} style={{ position:"absolute", right:0, top:"50%", transform:"translateY(-50%)", padding:"12px 6px", borderRadius:"10px 0 0 10px", background:analysis?`linear-gradient(180deg,${C.purple},#7c52ee)`:`${C.panel}`, border:`1px solid ${analysis?C.purple:C.border}`, borderRight:"none", cursor:"pointer", writingMode:"vertical-rl", fontSize:10, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:analysis?C.bright:C.dim, letterSpacing:".08em" }}>
            {analysis ? "✦ AI ANALYSIS" : "ANALYSIS →"}
          </button>
        )}

      </div>
    </div>
  );
}