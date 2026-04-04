import { useState, useCallback, useMemo } from "react";
import { base44 } from "@/api/base44Client";

// ── Font + CSS Injection ─────────────────────────────────────────
(() => {
  if (document.getElementById("results-fonts")) return;
  const l = document.createElement("link"); l.id = "results-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "results-css";
  s.textContent = `
    *{box-sizing:border-box;margin:0;padding:0;}
    ::-webkit-scrollbar{width:3px;height:3px;}
    ::-webkit-scrollbar-track{background:transparent;}
    ::-webkit-scrollbar-thumb{background:rgba(42,79,122,0.5);border-radius:2px;}
    @keyframes fadeSlide{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
    @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    @keyframes critPulse{0%,100%{opacity:1}50%{opacity:0.4}}
    .fade-in{animation:fadeSlide .22s ease forwards;}
    .res-spin{animation:spin 1s linear infinite;display:inline-block;}
    .crit-blink{animation:critPulse 1.8s ease-in-out infinite;}
    .shimmer-text{
      background:linear-gradient(90deg,#e8f0fe 0%,#fff 30%,#3b9eff 52%,#00e5c0 72%,#e8f0fe 100%);
      background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;
      background-clip:text;animation:shimmer 5s linear infinite;
    }
  `;
  document.head.appendChild(s);
})();

// ── Design Tokens ─────────────────────────────────────────────────
const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36", up:"#0e2544",
  b:"rgba(26,53,85,0.8)", bhi:"rgba(42,79,122,0.9)",
  txt:"#e8f0fe", txt2:"#8aaccc", txt3:"#4a6a8a", txt4:"#2e4a6a",
  red:"#ff4444", coral:"#ff6b6b", orange:"#ff9f43",
  yellow:"#f5c842", green:"#3dffa0", teal:"#00e5c0",
  blue:"#3b9eff", purple:"#9b6dff", cyan:"#00d4ff", rose:"#f472b6",
};
const glass = {
  backdropFilter:"blur(24px) saturate(200%)",
  WebkitBackdropFilter:"blur(24px) saturate(200%)",
  background:"rgba(8,22,40,0.78)",
  border:"1px solid rgba(42,79,122,0.35)",
  borderRadius:14,
};

// ── Data Definitions ─────────────────────────────────────────────
const CTX_FIELDS = [
  {id:"ctx_age",    label:"Age",           placeholder:"e.g. 64"},
  {id:"ctx_sex",    label:"Sex",           placeholder:"e.g. Male"},
  {id:"ctx_weight", label:"Weight",        placeholder:"e.g. 82 kg"},
  {id:"ctx_cc",     label:"Chief Complaint",placeholder:"e.g. chest pain x 2h, diaphoresis"},
  {id:"ctx_pmh",    label:"PMH",           placeholder:"e.g. HTN, DM2, CAD — prior MI 2019"},
  {id:"ctx_meds",   label:"Medications",   placeholder:"e.g. metformin 1g BID, ASA 81mg, lisinopril"},
  {id:"ctx_allergy",label:"Allergies",     placeholder:"e.g. PCN — rash, sulfa — anaphylaxis"},
];

const VITAL_FIELDS = [
  {id:"hr",   label:"HR",      unit:"bpm",  cL:40,  cH:150,  ref:"60–100" },
  {id:"sbp",  label:"Sys BP",  unit:"mmHg", cL:70,  cH:220,  ref:"<120"   },
  {id:"dbp",  label:"Dia BP",  unit:"mmHg", cL:null,cH:120,  ref:"<80"    },
  {id:"rr",   label:"RR",      unit:"/min", cL:8,   cH:30,   ref:"12–20"  },
  {id:"spo2", label:"SpO2",    unit:"%",    cL:88,  cH:null, ref:"≥95"    },
  {id:"temp", label:"Temp",    unit:"°C",   cL:35,  cH:40,   ref:"36.5–37.5"},
  {id:"gcs",  label:"GCS",     unit:"",     cL:8,   cH:null, ref:"15"     },
  {id:"map",  label:"MAP",     unit:"mmHg", cL:60,  cH:null, ref:"≥65"    },
  {id:"etco2",label:"ETCO2",   unit:"mmHg", cL:null,cH:null, ref:"35–45"  },
];

const LAB_PANELS = [
  {id:"cbc",      label:"CBC",           color:T.blue  },
  {id:"metabolic",label:"Metabolic/CMP", color:T.teal  },
  {id:"coag",     label:"Coagulation",   color:T.orange},
  {id:"cardiac",  label:"Cardiac",       color:T.red   },
  {id:"inflam",   label:"Inflammatory",  color:T.yellow},
  {id:"abg",      label:"ABG / VBG",    color:T.purple},
];

const LAB_FIELDS = [
  {id:"wbc",     label:"WBC",          unit:"k/µL",  panel:"cbc",      cL:1,   cH:30,   ref:"4.5–11"   },
  {id:"hgb",     label:"Hgb",          unit:"g/dL",  panel:"cbc",      cL:5,   cH:20,   ref:"12–17"    },
  {id:"hct",     label:"Hct",          unit:"%",     panel:"cbc",      cL:null,cH:null, ref:"36–50"    },
  {id:"plt",     label:"Plt",          unit:"k/µL",  panel:"cbc",      cL:20,  cH:1000, ref:"150–400"  },
  {id:"neut",    label:"Neut %",       unit:"%",     panel:"cbc",      cL:null,cH:null, ref:"50–70"    },
  {id:"bands",   label:"Bands %",      unit:"%",     panel:"cbc",      cL:null,cH:null, ref:"0–10"     },
  {id:"na",      label:"Na",           unit:"mEq/L", panel:"metabolic",cL:120, cH:160,  ref:"135–145"  },
  {id:"k",       label:"K",            unit:"mEq/L", panel:"metabolic",cL:2.5, cH:6.5,  ref:"3.5–5.1"  },
  {id:"cl",      label:"Cl",           unit:"mEq/L", panel:"metabolic",cL:null,cH:null, ref:"98–107"   },
  {id:"co2",     label:"CO2",          unit:"mEq/L", panel:"metabolic",cL:10,  cH:40,   ref:"22–29"    },
  {id:"bun",     label:"BUN",          unit:"mg/dL", panel:"metabolic",cL:null,cH:null, ref:"7–20"     },
  {id:"cr",      label:"Creatinine",   unit:"mg/dL", panel:"metabolic",cL:null,cH:10,   ref:"0.6–1.2"  },
  {id:"glu",     label:"Glucose",      unit:"mg/dL", panel:"metabolic",cL:40,  cH:500,  ref:"70–100"   },
  {id:"ast",     label:"AST",          unit:"U/L",   panel:"metabolic",cL:null,cH:null, ref:"10–40"    },
  {id:"alt",     label:"ALT",          unit:"U/L",   panel:"metabolic",cL:null,cH:null, ref:"7–56"     },
  {id:"tbili",   label:"T. Bili",      unit:"mg/dL", panel:"metabolic",cL:null,cH:null, ref:"0.1–1.2"  },
  {id:"alb",     label:"Albumin",      unit:"g/dL",  panel:"metabolic",cL:null,cH:null, ref:"3.5–5.0"  },
  {id:"pt",      label:"PT",           unit:"sec",   panel:"coag",     cL:null,cH:null, ref:"11–13"    },
  {id:"inr",     label:"INR",          unit:"",      panel:"coag",     cL:null,cH:5,    ref:"0.9–1.1"  },
  {id:"ptt",     label:"PTT",          unit:"sec",   panel:"coag",     cL:null,cH:null, ref:"25–35"    },
  {id:"fibr",    label:"Fibrinogen",   unit:"mg/dL", panel:"coag",     cL:150, cH:null, ref:"200–400"  },
  {id:"ddimer",  label:"D-Dimer",      unit:"µg/mL", panel:"coag",     cL:null,cH:null, ref:"<0.5"     },
  {id:"trop1",   label:"Troponin",     unit:"ng/mL", panel:"cardiac",  cL:null,cH:0.04, ref:"<0.04"    },
  {id:"trop2",   label:"Trop (2h Δ)", unit:"ng/mL", panel:"cardiac",  cL:null,cH:0.04, ref:"<0.04"    },
  {id:"bnp",     label:"BNP",          unit:"pg/mL", panel:"cardiac",  cL:null,cH:900,  ref:"<100"     },
  {id:"ntbnp",   label:"NT-proBNP",    unit:"pg/mL", panel:"cardiac",  cL:null,cH:900,  ref:"<300"     },
  {id:"ckmb",    label:"CK-MB",        unit:"ng/mL", panel:"cardiac",  cL:null,cH:null, ref:"<5"       },
  {id:"lactate", label:"Lactate",      unit:"mmol/L",panel:"inflam",   cL:null,cH:4,    ref:"0.5–2.2"  },
  {id:"crp",     label:"CRP",          unit:"mg/L",  panel:"inflam",   cL:null,cH:null, ref:"<3"       },
  {id:"procal",  label:"Procalcitonin",unit:"ng/mL", panel:"inflam",   cL:null,cH:null, ref:"<0.1"     },
  {id:"ferritin",label:"Ferritin",     unit:"ng/mL", panel:"inflam",   cL:null,cH:null, ref:"12–300"   },
  {id:"esr",     label:"ESR",          unit:"mm/hr", panel:"inflam",   cL:null,cH:null, ref:"0–20"     },
  {id:"ph",      label:"pH",           unit:"",      panel:"abg",      cL:7.1, cH:7.6,  ref:"7.35–7.45"},
  {id:"pco2",    label:"PaCO2",        unit:"mmHg",  panel:"abg",      cL:20,  cH:80,   ref:"35–45"    },
  {id:"po2",     label:"PaO2",         unit:"mmHg",  panel:"abg",      cL:60,  cH:null, ref:"80–100"   },
  {id:"hco3",    label:"HCO3",         unit:"mEq/L", panel:"abg",      cL:10,  cH:null, ref:"22–26"    },
  {id:"be",      label:"Base Excess",  unit:"mEq/L", panel:"abg",      cL:null,cH:null, ref:"-2 to +2" },
];

const EKG_CHIPS = [
  {id:"nsr",     label:"Normal Sinus",          color:T.green },
  {id:"stemi",   label:"STE / STEMI",           color:T.red   },
  {id:"lbbb_new",label:"New LBBB",              color:T.red   },
  {id:"avb3",    label:"3° AV Block",           color:T.red   },
  {id:"vt",      label:"Ventricular Tach",      color:T.red   },
  {id:"peakt",   label:"Peaked T-waves (HyperK)",color:T.red  },
  {id:"afib",    label:"AFib",                  color:T.orange},
  {id:"aflutter",label:"AFlutter",              color:T.orange},
  {id:"std",     label:"ST Depression",         color:T.coral },
  {id:"twi",     label:"T-Wave Inversions",     color:T.coral },
  {id:"qtlong",  label:"Prolonged QTc",         color:T.orange},
  {id:"s1q3t3",  label:"S1Q3T3 (PE Pattern)",  color:T.coral },
  {id:"qwave",   label:"Pathologic Q-waves",    color:T.yellow},
  {id:"rbbb",    label:"RBBB",                  color:T.yellow},
  {id:"lbbb_old",label:"LBBB (old/unknown)",   color:T.yellow},
  {id:"lvh",     label:"LVH",                   color:T.yellow},
  {id:"wpw",     label:"WPW / Delta Waves",     color:T.purple},
  {id:"avb2",    label:"Mobitz II",             color:T.red   },
];

const EKG_STRUCT = [
  {id:"ekg_rate",label:"Rate", unit:"bpm",cL:40, cH:150,ref:"60–100"},
  {id:"ekg_pr",  label:"PR",   unit:"ms", cL:null,cH:200,ref:"120–200"},
  {id:"ekg_qrs", label:"QRS",  unit:"ms", cL:null,cH:120,ref:"<120"},
  {id:"ekg_qtc", label:"QTc",  unit:"ms", cL:null,cH:500,ref:"<450 (F<470)"},
  {id:"ekg_axis",label:"Axis", unit:"°",  cL:-90, cH:180,ref:"-30 to +90"},
];

const IMAGING_MODS = ["CXR","CT Head","CT Chest","CT Abdomen/Pelvis","CT Angiography","MRI Brain","MRI Spine","Echo","Ultrasound","X-Ray","Nuclear Med","Other"];

// ── Helper Functions ──────────────────────────────────────────────
function isCrit(field, rawVal) {
  const n = parseFloat(rawVal);
  if (!rawVal || isNaN(n)) return false;
  return (field.cL != null && n < field.cL) || (field.cH != null && n > field.cH);
}

function buildPrompt(vals, ekgChips, imaging) {
  const ctx = CTX_FIELDS.filter(f => vals[f.id])
    .map(f => `${f.label}: ${vals[f.id]}`).join(" | ") || "Not provided";

  const vitals = VITAL_FIELDS.filter(f => vals[f.id])
    .map(f => `${f.label}: ${vals[f.id]}${f.unit}${isCrit(f,vals[f.id])?" [CRITICAL]":""}`)
    .join(", ") || "Not entered";

  const labs = LAB_PANELS.map(p => {
    const flds = LAB_FIELDS.filter(f => f.panel === p.id && vals[f.id]);
    if (!flds.length) return "";
    return p.label+":\n"+flds.map(f =>
      `  ${f.label}: ${vals[f.id]} ${f.unit} (ref ${f.ref})${isCrit(f,vals[f.id])?" [CRITICAL]":""}`
    ).join("\n");
  }).filter(Boolean).join("\n");

  const ekgStruct = EKG_STRUCT.filter(k=>vals[k.id])
    .map(k=>`${k.label}: ${vals[k.id]}${k.unit}`).join(", ");
  const ekgPats = EKG_CHIPS.filter(c=>ekgChips[c.id]).map(c=>c.label).join(", ");
  const ekgStr = [ekgStruct, ekgPats&&`Patterns: ${ekgPats}`, vals["ekg_notes"]&&`Notes: ${vals["ekg_notes"]}`]
    .filter(Boolean).join(". ") || "Not provided";

  const imgStr = imaging.filter(i=>i.report).map(i=>`${i.modality}:\n${i.report}`).join("\n\n") || "Not provided";
  const extraLabs = vals["labs_free"] ? `\nAdditional: ${vals["labs_free"]}` : "";

  return `PATIENT CONTEXT: ${ctx}\n\nVITALS: ${vitals}\n\nLABS:\n${labs||"Not entered"}${extraLabs}\n\nEKG: ${ekgStr}\n\nIMAGING:\n${imgStr}`;
}

// ── Module-Scope Primitives ────────────────────────────────────────
function AmbientBg() {
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}>
      <div style={{position:"absolute",top:"-15%",left:"-10%",width:"55%",height:"55%",
        background:"radial-gradient(circle,rgba(59,158,255,0.08) 0%,transparent 70%)"}}/>
      <div style={{position:"absolute",bottom:"-10%",right:"-5%",width:"50%",height:"50%",
        background:"radial-gradient(circle,rgba(0,229,192,0.07) 0%,transparent 70%)"}}/>
      <div style={{position:"absolute",top:"40%",left:"30%",width:"35%",height:"35%",
        background:"radial-gradient(circle,rgba(155,109,255,0.05) 0%,transparent 70%)"}}/>
    </div>
  );
}

function BulletRow({ text, color }) {
  return (
    <div style={{display:"flex",gap:7,alignItems:"flex-start",marginBottom:4}}>
      <span style={{color:color||T.teal,fontSize:8,marginTop:2,flexShrink:0}}>▸</span>
      <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.5}}>{text}</span>
    </div>
  );
}

function Badge({ label, color }) {
  return (
    <span style={{fontFamily:"JetBrains Mono",fontSize:9,fontWeight:700,padding:"2px 7px",
      borderRadius:20,background:`${color}18`,border:`1px solid ${color}44`,
      color,whiteSpace:"nowrap",textTransform:"uppercase",letterSpacing:1}}>
      {label}
    </span>
  );
}

function LabInput({ field, value, onChange }) {
  const crit = isCrit(field, value);
  return (
    <div style={{display:"flex",flexDirection:"column",gap:3}}>
      <div style={{display:"flex",justifyContent:"space-between"}}>
        <span style={{fontFamily:"JetBrains Mono",fontSize:9,fontWeight:700,
          color:crit?T.red:T.txt4,letterSpacing:0.5,textTransform:"uppercase"}}>{field.label}</span>
        <span style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.txt4}}>{field.ref}</span>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:4,
        border:`1px solid ${crit?T.red:value?"rgba(59,158,255,0.45)":"rgba(42,79,122,0.3)"}`,
        borderRadius:8,background:"rgba(14,37,68,0.7)",padding:"5px 9px",transition:"border-color .1s"}}>
        <input type="number" value={value||""} onChange={e=>onChange(field.id,e.target.value)}
          placeholder="—"
          style={{background:"transparent",border:"none",outline:"none",width:"100%",minWidth:0,
            fontFamily:"JetBrains Mono",fontSize:14,fontWeight:700,
            color:crit?T.red:T.txt}}/>
        {field.unit &&
          <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,whiteSpace:"nowrap"}}>{field.unit}</span>}
        {crit && <span className="crit-blink" style={{width:7,height:7,borderRadius:"50%",
          background:T.red,flexShrink:0}}/>}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────
export default function ResultsHub() {
  const [tab, setTab]       = useState("context");
  const [values, setValues] = useState({});
  const [labPanel, setLabPanel] = useState("cbc");
  const [ekgChips, setEkgChips] = useState({});
  const [imaging, setImaging]   = useState([]);

  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [parsePending, setParsePending] = useState(false);
  const [parseErr, setParseErr] = useState(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult]       = useState(null);
  const [analysisErr, setAnalysisErr] = useState(null);

  const [saving, setSaving]         = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // "saved" | "error"
  const [linkedNoteId, setLinkedNoteId] = useState(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [noteSearch, setNoteSearch] = useState("");
  const [recentNotes, setRecentNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(false);

  const setVal = useCallback((id, v) => setValues(p => ({...p, [id]: v})), []);
  const toggleChip = useCallback((id) => setEkgChips(p => ({...p, [id]: !p[id]})), []);
  const addImaging = useCallback(() =>
    setImaging(p => [...p, {id:Date.now(), modality:"CXR", report:"", time:""}]), []);

  // Build vital_signs object for ClinicalNote schema
  const buildVitalSigns = useCallback(() => {
    const v = {};
    if (values.hr)   v.heart_rate = { value: parseFloat(values.hr), unit: "bpm" };
    if (values.sbp || values.dbp) v.blood_pressure = { systolic: parseFloat(values.sbp||0), diastolic: parseFloat(values.dbp||0), unit: "mmHg" };
    if (values.rr)   v.respiratory_rate = { value: parseFloat(values.rr), unit: "breaths/min" };
    if (values.spo2) v.oxygen_saturation = { value: parseFloat(values.spo2), unit: "%" };
    if (values.temp) v.temperature = { value: parseFloat(values.temp), unit: "C" };
    return v;
  }, [values]);

  // Build lab_findings array for ClinicalNote schema
  const buildLabFindings = useCallback(() => {
    const findings = LAB_FIELDS.filter(f => values[f.id]).map(f => ({
      test_name: f.label,
      result: String(values[f.id]),
      reference_range: f.ref,
      unit: f.unit,
      status: isCrit(f, values[f.id]) ? "critical" : "normal",
    }));
    if (values.labs_free) findings.push({ test_name: "Additional Labs", result: values.labs_free, reference_range: "", unit: "", status: "normal" });
    return findings;
  }, [values]);

  // Build imaging_findings array for ClinicalNote schema
  const buildImagingFindings = useCallback(() =>
    imaging.filter(i => i.report).map(i => ({
      study_type: i.modality,
      location: i.time || "",
      findings: i.report,
      impression: "",
    })), [imaging]);

  const loadRecentNotes = useCallback(async () => {
    setLoadingNotes(true);
    const notes = await base44.entities.ClinicalNote.list("-updated_date", 10);
    setRecentNotes(notes);
    setLoadingNotes(false);
  }, []);

  const openSaveModal = useCallback(() => {
    setShowSaveModal(true);
    loadRecentNotes();
  }, [loadRecentNotes]);

  const saveResults = useCallback(async (noteId) => {
    setSaving(true); setSaveStatus(null);
    const payload = {
      vital_signs: buildVitalSigns(),
      lab_findings: buildLabFindings(),
      imaging_findings: buildImagingFindings(),
      chief_complaint: values.ctx_cc || undefined,
    };
    if (noteId) {
      await base44.entities.ClinicalNote.update(noteId, payload);
      setLinkedNoteId(noteId);
    } else {
      const note = await base44.entities.ClinicalNote.create({
        raw_note: `Results Hub entry — ${new Date().toLocaleString()}`,
        patient_name: values.ctx_age ? `Patient (${values.ctx_age}y ${values.ctx_sex||""})`.trim() : "Unknown",
        ...payload,
      });
      setLinkedNoteId(note.id);
    }
    setSaving(false); setSaveStatus("saved"); setShowSaveModal(false);
    setTimeout(() => setSaveStatus(null), 3000);
  }, [buildVitalSigns, buildLabFindings, buildImagingFindings, values]);

  const critCount = useMemo(() =>
    [...VITAL_FIELDS, ...LAB_FIELDS, ...EKG_STRUCT].filter(f => isCrit(f, values[f.id])).length,
    [values]);

  const dataCount = useMemo(() => ({
    vitals:  VITAL_FIELDS.filter(f => values[f.id]).length,
    labs:    LAB_FIELDS.filter(f => values[f.id]).length + (values["labs_free"]?1:0),
    ekg:     EKG_STRUCT.filter(k=>values[k.id]).length + EKG_CHIPS.filter(c=>ekgChips[c.id]).length,
    imaging: imaging.filter(i=>i.report).length,
  }), [values, ekgChips, imaging]);

  const hasData = dataCount.vitals + dataCount.labs + dataCount.ekg + dataCount.imaging > 0;

  // EMR Paste parser
  const runParse = useCallback(async () => {
    if (!pasteText.trim()) return;
    setParsePending(true); setParseErr(null);
    const panelFields = LAB_FIELDS.filter(f => f.panel === labPanel);
    const fieldGuide = panelFields.map(f => `"${f.id}" = ${f.label} (${f.unit})`).join(", ");
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-6", max_tokens:600,
          system:`Extract lab values from clinical text. Return ONLY valid JSON (no markdown). Use only these keys: ${fieldGuide}. Values must be numeric strings. Omit keys not found. Example: {"wbc":"14.2","hgb":"8.4"}`,
          messages:[{role:"user", content:pasteText}]
        })
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error.message);
      const raw = data.content?.find(b=>b.type==="text")?.text||"{}";
      const parsed = JSON.parse(raw.replace(/```json|```/g,"").trim());
      const count = Object.keys(parsed).length;
      if (!count) throw new Error("No recognizable values found — try a different paste format");
      setValues(prev => ({...prev, ...Object.fromEntries(Object.entries(parsed).map(([k,v])=>[k,String(v)]))}));
      setPasteOpen(false); setPasteText("");
    } catch(e) {
      setParseErr(e.message || "Parse failed — check API connectivity");
    } finally { setParsePending(false); }
  }, [pasteText, labPanel]);

  // Main AI analysis
  const runAnalysis = useCallback(async () => {
    if (!hasData) return;
    setAnalyzing(true); setAnalysisErr(null); setResult(null); setTab("analysis");
    const promptData = buildPrompt(values, ekgChips, imaging);
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-6", max_tokens:2000,
          system:`You are an AI clinical decision support system embedded in an emergency medicine platform. Analyze the provided clinical data. Respond ONLY in valid JSON — no markdown fences, no text outside the JSON object — matching this exact schema:
{
  "criticalFlags": [{"value":"e.g. K 6.8 mEq/L","significance":"one sentence","urgency":"immediate|urgent|monitor"}],
  "dataSynthesis": "3-4 sentences of INTEGRATED cross-domain clinical interpretation — not organ-by-organ, but how findings connect",
  "differential": [{"diagnosis":"name","probability":"high|moderate|low","supporting":["finding"],"against":["finding"]}],
  "nextSteps": {
    "now": ["specific immediate action"],
    "withinHours": ["action within 1-4h"],
    "routine": ["non-urgent follow-up"]
  },
  "gaps": [{"test":"specific test","rationale":"why it changes management or diagnosis"}],
  "disposition": {"recommendation":"ICU|Stepdown|Floor|OR|Cath Lab|Discharge|Observation","rationale":"one sentence"},
  "confidence": "high|moderate|low",
  "confidenceNote": "what is limiting certainty — missing data, conflicting values, insufficient context"
}
Critical values are pre-tagged [CRITICAL] in the data. All analysis is for clinical decision support only.`,
          messages:[{role:"user", content:promptData+"\n\nProvide integrated clinical interpretation."}]
        })
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error.message);
      const raw = data.content?.find(b=>b.type==="text")?.text||"{}";
      setResult(JSON.parse(raw.replace(/```json|```/g,"").trim()));
    } catch(e) {
      setAnalysisErr("Analysis error: " + (e.message || "Unknown. Check API connectivity."));
    } finally { setAnalyzing(false); }
  }, [values, ekgChips, imaging, hasData]);

  const probColor  = p => p==="high"?T.red:p==="moderate"?T.orange:T.yellow;
  const urgColor   = u => u==="immediate"?T.red:u==="urgent"?T.orange:T.yellow;
  const dispColor  = r => ["ICU","OR","Cath Lab"].some(x=>r?.includes(x))?T.red:
    ["Floor","Step"].some(x=>r?.includes(x))?T.orange:T.green;

  const TABS = [
    {id:"context",  label:"Context & Vitals", icon:"👤"},
    {id:"labs",     label:"Labs",             icon:"🧪"},
    {id:"ekg",      label:"EKG",              icon:"💓"},
    {id:"imaging",  label:"Imaging",          icon:"🫁"},
    {id:"analysis", label:"AI Analysis",      icon:"🤖"},
  ];

  return (
    <div style={{fontFamily:"DM Sans, sans-serif",background:T.bg,minHeight:"100vh",
      position:"relative",overflow:"hidden",color:T.txt}}>
      <AmbientBg/>
      <div style={{position:"relative",zIndex:1,maxWidth:1200,margin:"0 auto",padding:"0 16px"}}>

        {/* Header */}
        <div style={{padding:"18px 0 14px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <div style={{backdropFilter:"blur(40px)",WebkitBackdropFilter:"blur(40px)",
              background:"rgba(5,15,30,0.9)",border:"1px solid rgba(42,79,122,0.6)",
              borderRadius:10,padding:"5px 12px",display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.blue,letterSpacing:3}}>NOTRYA</span>
              <span style={{color:T.txt4,fontFamily:"JetBrains Mono",fontSize:10}}>/</span>
              <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.txt3,letterSpacing:2}}>RESULTS</span>
            </div>
            <div style={{height:1,flex:1,background:"linear-gradient(90deg,rgba(59,158,255,0.5),transparent)"}}/>
            {critCount > 0 && (
              <div className="crit-blink" style={{display:"flex",alignItems:"center",gap:6,
                padding:"5px 12px",borderRadius:20,
                background:"rgba(255,68,68,0.15)",border:"1px solid rgba(255,68,68,0.5)"}}>
                <div style={{width:7,height:7,borderRadius:"50%",background:T.red}}/>
                <span style={{fontFamily:"JetBrains Mono",fontSize:10,fontWeight:700,color:T.red}}>
                  {critCount} CRITICAL {critCount===1?"VALUE":"VALUES"}
                </span>
              </div>
            )}
          </div>
          <h1 className="shimmer-text"
            style={{fontFamily:"Playfair Display",fontSize:"clamp(24px,4vw,40px)",fontWeight:900,letterSpacing:-1,lineHeight:1.1}}>
            ResultsHub
          </h1>
          <p style={{fontFamily:"DM Sans",fontSize:12,color:T.txt3,marginTop:4}}>
            Labs · Vitals · EKG · Imaging · EMR Paste Import · AI Integrated Synthesis
          </p>
        </div>

        {/* Data strip + Analyze button */}
        <div style={{...glass,padding:"8px 14px",marginBottom:12,borderRadius:10,
          display:"flex",gap:14,flexWrap:"wrap",alignItems:"center"}}>
          <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,
            letterSpacing:2,textTransform:"uppercase",flexShrink:0}}>Entered:</span>
          {[
            {label:"Vitals", val:dataCount.vitals,  color:T.teal  },
            {label:"Labs",   val:dataCount.labs,    color:T.blue  },
            {label:"EKG",    val:dataCount.ekg,     color:T.purple},
            {label:"Imaging",val:dataCount.imaging, color:T.orange},
          ].map((d,i) => (
            <div key={i} style={{display:"flex",alignItems:"center",gap:4}}>
              <span style={{fontFamily:"JetBrains Mono",fontSize:12,fontWeight:700,
                color:d.val>0?d.color:T.txt4}}>{d.val}</span>
              <span style={{fontFamily:"DM Sans",fontSize:11,
                color:d.val>0?T.txt3:T.txt4}}>{d.label}</span>
            </div>
          ))}
          <div style={{flex:1}}/>
          {saveStatus === "saved" && (
            <span style={{fontFamily:"DM Sans",fontSize:11,color:T.teal,fontWeight:600}}>✓ Saved to chart</span>
          )}
          <button onClick={openSaveModal} disabled={!hasData}
            style={{fontFamily:"DM Sans",fontWeight:600,fontSize:12,padding:"7px 16px",
              borderRadius:10,cursor:!hasData?"not-allowed":"pointer",whiteSpace:"nowrap",
              border:`1px solid ${!hasData?"rgba(42,79,122,0.3)":"rgba(0,229,192,0.45)"}`,
              background:!hasData?"rgba(42,79,122,0.15)":"rgba(0,229,192,0.1)",
              color:!hasData?T.txt4:T.teal}}>
            💾 Save to Chart
          </button>
          <button onClick={runAnalysis} disabled={analyzing||!hasData}
            style={{fontFamily:"DM Sans",fontWeight:700,fontSize:12,padding:"7px 20px",
              borderRadius:10,cursor:!hasData||analyzing?"not-allowed":"pointer",whiteSpace:"nowrap",
              border:`1px solid ${!hasData?"rgba(42,79,122,0.3)":"rgba(59,158,255,0.5)"}`,
              background:!hasData?"rgba(42,79,122,0.15)":"linear-gradient(135deg,rgba(59,158,255,0.2),rgba(59,158,255,0.07))",
              color:!hasData?T.txt4:T.blue,transition:"all .15s"}}>
            {analyzing ? <><span className="res-spin">⚙</span> Analyzing...</> : "🤖 Analyze All Results"}
          </button>
        </div>

        {/* Tabs */}
        <div style={{...glass,padding:"6px",display:"flex",gap:4,marginBottom:16,flexWrap:"wrap"}}>
          {TABS.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{flex:"1 1 auto",fontFamily:"DM Sans",fontWeight:600,fontSize:11,padding:"9px 6px",
                borderRadius:10,
                border:`1px solid ${tab===t.id?"rgba(59,158,255,0.5)":"transparent"}`,
                background:tab===t.id?"linear-gradient(135deg,rgba(59,158,255,0.18),rgba(59,158,255,0.07))":"transparent",
                color:tab===t.id?T.blue:T.txt3,
                cursor:"pointer",textAlign:"center",transition:"all .15s",whiteSpace:"nowrap"}}>
              {t.icon} {t.label}
              {t.id==="analysis"&&result&&(
                <span style={{marginLeft:5,width:7,height:7,borderRadius:"50%",
                  background:T.green,display:"inline-block",verticalAlign:"middle"}}/>
              )}
            </button>
          ))}
        </div>

        {/* ═══ CONTEXT & VITALS ═══ */}
        {tab==="context" && (
          <div className="fade-in">
            <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,
              letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>Patient Context</div>
            <div style={{...glass,padding:"14px 16px",marginBottom:14}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:10}}>
                {CTX_FIELDS.map(f => (
                  <div key={f.id}>
                    <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,
                      letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>{f.label}</div>
                    <input type="text" value={values[f.id]||""} onChange={e=>setVal(f.id,e.target.value)}
                      placeholder={f.placeholder}
                      style={{width:"100%",background:"rgba(14,37,68,0.7)",
                        border:`1px solid ${values[f.id]?"rgba(0,229,192,0.4)":"rgba(42,79,122,0.3)"}`,
                        borderRadius:8,padding:"7px 10px",outline:"none",
                        fontFamily:"DM Sans",fontSize:12,color:T.txt,transition:"border-color .1s"}}/>
                  </div>
                ))}
              </div>
            </div>

            <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,
              letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>Vitals</div>
            <div style={{...glass,padding:"14px 16px",marginBottom:12}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10}}>
                {VITAL_FIELDS.map(f => (
                  <LabInput key={f.id} field={f} value={values[f.id]||""} onChange={setVal}/>
                ))}
              </div>
            </div>
            <div style={{padding:"9px 13px",background:"rgba(59,158,255,0.06)",
              border:"1px solid rgba(59,158,255,0.18)",borderRadius:10,
              fontFamily:"DM Sans",fontSize:11,color:T.txt3,lineHeight:1.6}}>
              💡 Patient context is the single highest-value input — the same creatinine means entirely different things in a 25yo vs a 75yo on gentamicin. Fill what you have; AI notes what is missing.
            </div>
          </div>
        )}

        {/* ═══ LABS ═══ */}
        {tab==="labs" && (
          <div className="fade-in">
            {/* Panel tabs */}
            <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}>
              {LAB_PANELS.map(p => {
                const filled = LAB_FIELDS.filter(f=>f.panel===p.id&&values[f.id]).length;
                const crits  = LAB_FIELDS.filter(f=>f.panel===p.id&&isCrit(f,values[f.id])).length;
                return (
                  <button key={p.id} onClick={()=>{setLabPanel(p.id);setPasteOpen(false);setPasteText("");setParseErr(null);}}
                    style={{fontFamily:"JetBrains Mono",fontSize:10,fontWeight:700,padding:"5px 14px",
                      borderRadius:20,cursor:"pointer",letterSpacing:1,textTransform:"uppercase",
                      border:`1px solid ${labPanel===p.id?p.color+"88":p.color+"33"}`,
                      background:labPanel===p.id?`${p.color}20`:`${p.color}08`,
                      color:labPanel===p.id?p.color:T.txt3,transition:"all .15s",
                      position:"relative"}}>
                    {p.label}
                    {filled>0&&<span style={{marginLeft:5,fontWeight:400,color:labPanel===p.id?p.color:T.txt4}}>({filled})</span>}
                    {crits>0&&<span style={{marginLeft:4,color:T.red,fontWeight:900}}>!</span>}
                  </button>
                );
              })}
            </div>

            {/* Paste from EMR */}
            <div style={{...glass,padding:"10px 14px",marginBottom:10,borderRadius:10}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
                marginBottom:pasteOpen?10:0}}>
                <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,
                  letterSpacing:2,textTransform:"uppercase"}}>
                  {LAB_PANELS.find(p=>p.id===labPanel)?.label} — {LAB_FIELDS.filter(f=>f.panel===labPanel).length} fields
                </span>
                <button onClick={()=>{setPasteOpen(o=>!o);setPasteText("");setParseErr(null);}}
                  style={{fontFamily:"DM Sans",fontWeight:600,fontSize:11,padding:"5px 14px",
                    borderRadius:8,cursor:"pointer",
                    border:"1px solid rgba(0,229,192,0.35)",
                    background:"rgba(0,229,192,0.07)",color:T.teal}}>
                  {pasteOpen?"✕ Close":"📋 Paste from EMR"}
                </button>
              </div>
              {pasteOpen && (
                <div className="fade-in">
                  <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt3,marginBottom:6}}>
                    Paste lab results from Epic, Cerner, or any source. AI will extract and fill the fields automatically.
                  </div>
                  <textarea value={pasteText} onChange={e=>setPasteText(e.target.value)}
                    placeholder={"Paste lab block here. Any format accepted:\n\nWBC 14.2 H  |  Hgb 8.4 L  |  Plt 312\nWBC: 14.2 (H)  Hgb: 8.4 (L)  Hct: 26.1 (L)\n---or full report block---"}
                    rows={5}
                    style={{width:"100%",background:"rgba(14,37,68,0.8)",
                      border:"1px solid rgba(42,79,122,0.4)",borderRadius:8,
                      padding:"10px 12px",outline:"none",resize:"vertical",marginBottom:8,
                      fontFamily:"JetBrains Mono",fontSize:11,color:T.txt2,lineHeight:1.65}}/>
                  {parseErr && (
                    <div style={{fontFamily:"DM Sans",fontSize:11,color:T.coral,marginBottom:8}}>{parseErr}</div>
                  )}
                  <button onClick={runParse} disabled={parsePending||!pasteText.trim()}
                    style={{fontFamily:"DM Sans",fontWeight:700,fontSize:12,padding:"7px 20px",
                      borderRadius:8,cursor:parsePending?"not-allowed":"pointer",
                      border:"1px solid rgba(0,229,192,0.4)",
                      background:parsePending?"rgba(42,79,122,0.2)":"rgba(0,229,192,0.12)",
                      color:parsePending?T.txt4:T.teal}}>
                    {parsePending?<><span className="res-spin">⚙</span> Parsing...</>:"🔍 Parse & Auto-Fill Fields"}
                  </button>
                </div>
              )}
            </div>

            {/* Lab inputs */}
            <div style={{...glass,padding:"14px 16px",marginBottom:10}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10}}>
                {LAB_FIELDS.filter(f=>f.panel===labPanel).map(f => (
                  <LabInput key={f.id} field={f} value={values[f.id]||""} onChange={setVal}/>
                ))}
              </div>
            </div>

            {/* Free text overflow */}
            <div style={{...glass,padding:"12px 14px"}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,
                letterSpacing:1.5,textTransform:"uppercase",marginBottom:6}}>
                Additional Labs / Special Studies / Drug Levels / Culture Results
              </div>
              <textarea value={values["labs_free"]||""} onChange={e=>setVal("labs_free",e.target.value)}
                placeholder="e.g. Vancomycin trough 8.2 mcg/mL. Blood culture x2 — pending. Urine culture growing GNR >100k CFU. TSH 0.04 (low). Lipase 1840 (high)."
                rows={3}
                style={{width:"100%",background:"rgba(14,37,68,0.7)",
                  border:`1px solid ${values["labs_free"]?"rgba(59,158,255,0.35)":"rgba(42,79,122,0.3)"}`,
                  borderRadius:8,padding:"8px 10px",outline:"none",resize:"vertical",
                  fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.6}}/>
            </div>
          </div>
        )}

        {/* ═══ EKG ═══ */}
        {tab==="ekg" && (
          <div className="fade-in">
            <div style={{display:"grid",gridTemplateColumns:"1fr 1.2fr",gap:12}}>
              {/* Structured measurements */}
              <div style={{...glass,padding:"14px 16px"}}>
                <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,
                  letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>Measurements</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:12}}>
                  {EKG_STRUCT.map(f => (
                    <LabInput key={f.id} field={f} value={values[f.id]||""} onChange={setVal}/>
                  ))}
                </div>
                <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,
                  letterSpacing:1,textTransform:"uppercase",marginBottom:5}}>Clinical Description / Rhythm</div>
                <textarea value={values["ekg_notes"]||""} onChange={e=>setVal("ekg_notes",e.target.value)}
                  placeholder="e.g. Regular rhythm, narrow complex. 2mm STE in V1-V4 with reciprocal changes in inferior leads. Hyperacute T-waves anterior..."
                  rows={4}
                  style={{width:"100%",background:"rgba(14,37,68,0.7)",
                    border:`1px solid ${values["ekg_notes"]?"rgba(155,109,255,0.4)":"rgba(42,79,122,0.3)"}`,
                    borderRadius:8,padding:"8px 10px",outline:"none",resize:"vertical",
                    fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.6}}/>
              </div>
              {/* Pattern chips */}
              <div style={{...glass,padding:"14px 16px"}}>
                <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,
                  letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>Patterns / Findings</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
                  {EKG_CHIPS.map(c => (
                    <button key={c.id} onClick={()=>toggleChip(c.id)}
                      style={{fontFamily:"DM Sans",fontSize:11,fontWeight:600,
                        padding:"4px 11px",borderRadius:20,cursor:"pointer",transition:"all .12s",
                        border:`1px solid ${ekgChips[c.id]?c.color+"88":c.color+"30"}`,
                        background:ekgChips[c.id]?`${c.color}20`:`${c.color}06`,
                        color:ekgChips[c.id]?c.color:T.txt4}}>
                      {ekgChips[c.id]&&"✓ "}{c.label}
                    </button>
                  ))}
                </div>
                {EKG_CHIPS.some(c=>ekgChips[c.id]) && (
                  <div style={{padding:"8px 11px",background:"rgba(42,79,122,0.12)",
                    border:"1px solid rgba(42,79,122,0.25)",borderRadius:8}}>
                    <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,
                      textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Selected:</div>
                    <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.6}}>
                      {EKG_CHIPS.filter(c=>ekgChips[c.id]).map(c=>c.label).join(" · ")}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══ IMAGING ═══ */}
        {tab==="imaging" && (
          <div className="fade-in">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,
                letterSpacing:2,textTransform:"uppercase"}}>Imaging Reports</div>
              <button onClick={addImaging}
                style={{fontFamily:"DM Sans",fontWeight:600,fontSize:12,padding:"6px 16px",
                  borderRadius:8,cursor:"pointer",
                  border:"1px solid rgba(59,158,255,0.4)",
                  background:"rgba(59,158,255,0.08)",color:T.blue}}>+ Add Study</button>
            </div>
            {imaging.length===0 && (
              <div style={{...glass,padding:"40px",textAlign:"center"}}>
                <div style={{fontSize:32,marginBottom:8}}>🫁</div>
                <div style={{fontFamily:"DM Sans",fontSize:13,color:T.txt3,marginBottom:4}}>No imaging added</div>
                <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt4}}>
                  Add studies and paste the radiology report or your key findings
                </div>
              </div>
            )}
            {imaging.map((img,i) => (
              <div key={img.id} style={{...glass,padding:"12px 14px",marginBottom:10}}>
                <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8,flexWrap:"wrap"}}>
                  <select value={img.modality}
                    onChange={e=>setImaging(p=>p.map((x,j)=>j===i?{...x,modality:e.target.value}:x))}
                    style={{background:"rgba(14,37,68,0.9)",border:"1px solid rgba(42,79,122,0.4)",
                      borderRadius:8,padding:"5px 10px",color:T.txt,outline:"none",cursor:"pointer",
                      fontFamily:"JetBrains Mono",fontSize:11,fontWeight:700}}>
                    {IMAGING_MODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <input type="text" value={img.time||""} placeholder="Date / time (optional)"
                    onChange={e=>setImaging(p=>p.map((x,j)=>j===i?{...x,time:e.target.value}:x))}
                    style={{flex:1,background:"rgba(14,37,68,0.7)",
                      border:"1px solid rgba(42,79,122,0.3)",borderRadius:8,
                      padding:"5px 10px",color:T.txt2,fontFamily:"DM Sans",fontSize:11,outline:"none"}}/>
                  <button onClick={()=>setImaging(p=>p.filter((_,j)=>j!==i))}
                    style={{background:"transparent",border:"1px solid rgba(255,68,68,0.3)",
                      borderRadius:6,padding:"4px 9px",cursor:"pointer",color:T.coral,flexShrink:0,
                      fontFamily:"DM Sans",fontSize:11}}>✕ Remove</button>
                </div>
                <textarea value={img.report}
                  onChange={e=>setImaging(p=>p.map((x,j)=>j===i?{...x,report:e.target.value}:x))}
                  placeholder={`Paste the ${img.modality} report or type key findings...\n\nCan include full radiology report or brief summary: "Bilateral lower lobe consolidations. Small right pleural effusion. No pneumothorax."`}
                  rows={5}
                  style={{width:"100%",background:"rgba(14,37,68,0.7)",
                    border:`1px solid ${img.report?"rgba(59,158,255,0.35)":"rgba(42,79,122,0.3)"}`,
                    borderRadius:8,padding:"8px 10px",outline:"none",resize:"vertical",
                    fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.65}}/>
              </div>
            ))}
          </div>
        )}

        {/* ═══ AI ANALYSIS ═══ */}
        {tab==="analysis" && (
          <div className="fade-in">
            {/* Persistent disclaimer */}
            <div style={{padding:"8px 13px",background:"rgba(245,200,66,0.07)",
              border:"1px solid rgba(245,200,66,0.22)",borderRadius:8,marginBottom:12,
              fontFamily:"DM Sans",fontSize:11,color:T.yellow,lineHeight:1.5}}>
              ⚠️ <strong>AI Clinical Decision Support Only.</strong> All findings require independent physician
              correlation and clinical judgment. Do not act on AI output without verifying against the full clinical picture.
            </div>

            {/* Empty / ready state */}
            {!result && !analyzing && !analysisErr && (
              <div style={{...glass,padding:"44px 24px",textAlign:"center"}}>
                <div style={{fontSize:42,marginBottom:12}}>🤖</div>
                <div style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:19,color:T.txt,marginBottom:6}}>
                  Ready to Synthesize
                </div>
                <div style={{fontFamily:"DM Sans",fontSize:13,color:T.txt3,marginBottom:16,
                  maxWidth:420,margin:"0 auto 20px"}}>
                  Enter patient data across the tabs then hit Analyze. The more context you provide, the more targeted the synthesis.
                </div>
                <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap",marginBottom:20}}>
                  {[
                    {label:`${dataCount.vitals} vitals`,  color:T.teal  },
                    {label:`${dataCount.labs} labs`,      color:T.blue  },
                    {label:`${dataCount.ekg} EKG fields`, color:T.purple},
                    {label:`${dataCount.imaging} imaging`,color:T.orange},
                  ].map((d,i)=><Badge key={i} label={d.label} color={d.color}/>)}
                </div>
                <button onClick={runAnalysis} disabled={!hasData}
                  style={{fontFamily:"DM Sans",fontWeight:700,fontSize:13,padding:"10px 30px",
                    borderRadius:12,cursor:hasData?"pointer":"not-allowed",
                    border:`1px solid ${hasData?"rgba(59,158,255,0.5)":"rgba(42,79,122,0.3)"}`,
                    background:hasData?"linear-gradient(135deg,rgba(59,158,255,0.22),rgba(59,158,255,0.08))":"rgba(42,79,122,0.15)",
                    color:hasData?T.blue:T.txt4}}>
                  🤖 Analyze All Results
                </button>
              </div>
            )}

            {/* Loading */}
            {analyzing && (
              <div style={{...glass,padding:"44px",textAlign:"center"}}>
                <span className="res-spin" style={{fontSize:38,display:"block",marginBottom:14}}>⚙</span>
                <div style={{fontFamily:"DM Sans",fontSize:13,color:T.txt2}}>
                  Synthesizing {dataCount.vitals + dataCount.labs + dataCount.ekg + dataCount.imaging} data points...
                </div>
                <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt4,marginTop:6}}>
                  Cross-domain pattern analysis in progress
                </div>
              </div>
            )}

            {/* Error */}
            {analysisErr && !analyzing && (
              <div style={{padding:"12px 14px",background:"rgba(255,68,68,0.1)",
                border:"1px solid rgba(255,68,68,0.3)",borderRadius:10,marginBottom:14,
                fontFamily:"DM Sans",fontSize:12,color:T.coral,marginBottom:12}}>
                {analysisErr}
              </div>
            )}

            {/* Results */}
            {result && !analyzing && (
              <div>
                {/* Critical flags */}
                {result.criticalFlags?.length > 0 && (
                  <div style={{...glass,padding:"12px 14px",marginBottom:10,
                    border:`1px solid ${T.red}44`,
                    background:"linear-gradient(135deg,rgba(255,68,68,0.08),rgba(8,22,40,0.93))"}}>
                    <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.red,
                      letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>🚨 Critical Flags</div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:7}}>
                      {result.criticalFlags.map((f,i) => (
                        <div key={i} style={{padding:"8px 11px",
                          background:"rgba(255,68,68,0.08)",border:"1px solid rgba(255,68,68,0.25)",borderRadius:8}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                            <span style={{fontFamily:"JetBrains Mono",fontSize:11,fontWeight:700,color:T.red}}>{f.value}</span>
                            <Badge label={f.urgency||"urgent"} color={urgColor(f.urgency)}/>
                          </div>
                          <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt2}}>{f.significance}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clinical synthesis */}
                {result.dataSynthesis && (
                  <div style={{...glass,padding:"13px 15px",marginBottom:10,
                    border:"1px solid rgba(59,158,255,0.3)",
                    background:"linear-gradient(135deg,rgba(59,158,255,0.07),rgba(8,22,40,0.93))"}}>
                    <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.blue,
                      letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Clinical Synthesis</div>
                    <div style={{fontFamily:"DM Sans",fontSize:13,color:T.txt,lineHeight:1.8}}>{result.dataSynthesis}</div>
                  </div>
                )}

                {/* Differential */}
                {result.differential?.length > 0 && (
                  <div style={{...glass,padding:"12px 14px",marginBottom:10,
                    border:"1px solid rgba(42,79,122,0.35)"}}>
                    <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,
                      letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>Differential Diagnosis</div>
                    <div style={{display:"flex",flexDirection:"column",gap:8}}>
                      {result.differential.map((d,i) => (
                        <div key={i} style={{padding:"9px 12px",borderRadius:9,
                          border:`1px solid ${probColor(d.probability)}33`,
                          background:`${probColor(d.probability)}07`}}>
                          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
                            <span style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:14,color:T.txt}}>{d.diagnosis}</span>
                            <Badge label={d.probability||"?"} color={probColor(d.probability)}/>
                          </div>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                            <div>
                              {d.supporting?.map((s,j) => <BulletRow key={j} text={s} color={T.green}/>)}
                            </div>
                            <div>
                              {d.against?.map((a,j) => <BulletRow key={j} text={a} color={T.red}/>)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Next steps */}
                {result.nextSteps && (
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10}}>
                    {[
                      {label:"🔴 Now",         items:result.nextSteps.now,         color:T.red   },
                      {label:"🟡 Within Hours",items:result.nextSteps.withinHours, color:T.orange},
                      {label:"🟢 Routine",     items:result.nextSteps.routine,     color:T.green },
                    ].map((tier,i) => (
                      <div key={i} style={{...glass,padding:"11px 13px",
                        border:`1px solid ${tier.color}28`}}>
                        <div style={{fontFamily:"JetBrains Mono",fontSize:9,fontWeight:700,
                          color:tier.color,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8}}>
                          {tier.label}
                        </div>
                        {tier.items?.length
                          ? tier.items.map((s,j) => <BulletRow key={j} text={s} color={tier.color}/>)
                          : <span style={{fontFamily:"DM Sans",fontSize:11,color:T.txt4}}>None identified</span>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Gaps */}
                {result.gaps?.length > 0 && (
                  <div style={{...glass,padding:"12px 14px",marginBottom:10,
                    border:"1px solid rgba(155,109,255,0.25)"}}>
                    <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.purple,
                      letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>
                      🔍 Data Gaps — Would Change Management
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))",gap:8}}>
                      {result.gaps.map((g,i) => (
                        <div key={i} style={{padding:"8px 10px",
                          background:"rgba(155,109,255,0.07)",border:"1px solid rgba(155,109,255,0.2)",borderRadius:8}}>
                          <div style={{fontFamily:"DM Sans",fontWeight:700,fontSize:12,
                            color:T.purple,marginBottom:3}}>{g.test}</div>
                          <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt3,lineHeight:1.5}}>{g.rationale}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Disposition + confidence */}
                <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:10,marginBottom:14}}>
                  {result.disposition && (
                    <div style={{...glass,padding:"13px 15px",
                      border:`1px solid ${dispColor(result.disposition.recommendation)}44`,
                      background:`linear-gradient(135deg,${dispColor(result.disposition.recommendation)}08,rgba(8,22,40,0.93))`}}>
                      <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,
                        letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>Recommended Disposition</div>
                      <div style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:19,
                        color:dispColor(result.disposition.recommendation),marginBottom:5}}>
                        {result.disposition.recommendation}
                      </div>
                      <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.6}}>
                        {result.disposition.rationale}
                      </div>
                    </div>
                  )}
                  {result.confidence && (
                    <div style={{...glass,padding:"13px 15px",
                      border:"1px solid rgba(42,79,122,0.35)"}}>
                      <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,
                        letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>AI Confidence</div>
                      <div style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:19,
                        color:result.confidence==="high"?T.green:result.confidence==="moderate"?T.yellow:T.orange,
                        marginBottom:5,textTransform:"capitalize"}}>
                        {result.confidence}
                      </div>
                      <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt3,lineHeight:1.5}}>
                        {result.confidenceNote}
                      </div>
                    </div>
                  )}
                </div>

                {/* Re-analyze */}
                <div style={{textAlign:"center",marginBottom:16}}>
                  <button onClick={runAnalysis}
                    style={{fontFamily:"DM Sans",fontWeight:600,fontSize:12,padding:"8px 22px",
                      borderRadius:10,cursor:"pointer",
                      border:"1px solid rgba(42,79,122,0.4)",
                      background:"transparent",color:T.txt3}}>
                    ↺ Re-analyze with Updated Data
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ SAVE MODAL ═══ */}
        {showSaveModal && (
          <div style={{position:"fixed",inset:0,background:"rgba(5,15,30,0.88)",backdropFilter:"blur(8px)",
            WebkitBackdropFilter:"blur(8px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div style={{...glass,padding:"24px",borderRadius:16,width:"100%",maxWidth:480,
              border:"1px solid rgba(42,79,122,0.6)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <span style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:17,color:T.txt}}>Save Results to Chart</span>
                <button onClick={()=>setShowSaveModal(false)}
                  style={{background:"transparent",border:"none",color:T.txt3,cursor:"pointer",fontSize:18}}>✕</button>
              </div>

              <button onClick={()=>saveResults(null)} disabled={saving}
                style={{width:"100%",fontFamily:"DM Sans",fontWeight:700,fontSize:13,padding:"11px",
                  borderRadius:10,cursor:saving?"not-allowed":"pointer",marginBottom:14,
                  border:"1px solid rgba(0,229,192,0.45)",background:"rgba(0,229,192,0.1)",color:T.teal}}>
                {saving?"Saving...":"+ Create New Clinical Note"}
              </button>

              <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,letterSpacing:2,
                textTransform:"uppercase",marginBottom:8}}>— or link to existing note —</div>

              {loadingNotes && <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt4,textAlign:"center",padding:"12px"}}>Loading notes...</div>}
              <div style={{maxHeight:220,overflowY:"auto",display:"flex",flexDirection:"column",gap:5}}>
                {recentNotes.map(note => (
                  <button key={note.id} onClick={()=>saveResults(note.id)} disabled={saving}
                    style={{width:"100%",textAlign:"left",padding:"9px 12px",borderRadius:9,
                      background:linkedNoteId===note.id?"rgba(59,158,255,0.15)":"rgba(14,37,68,0.7)",
                      border:`1px solid ${linkedNoteId===note.id?"rgba(59,158,255,0.5)":"rgba(42,79,122,0.3)"}`,
                      cursor:"pointer",display:"flex",flexDirection:"column",gap:2}}>
                    <span style={{fontFamily:"DM Sans",fontWeight:600,fontSize:12,color:T.txt}}>
                      {note.patient_name || "Unnamed"}
                    </span>
                    <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4}}>
                      {note.chief_complaint||"No CC"} · {new Date(note.updated_date).toLocaleDateString()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{textAlign:"center",paddingBottom:24,paddingTop:14}}>
          <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,letterSpacing:1.5}}>
            NOTRYA RESULTSHUB · AI CLINICAL DECISION SUPPORT · ALL FINDINGS REQUIRE PHYSICIAN CORRELATION · NOT FOR AUTONOMOUS CLINICAL USE
          </span>
        </div>
      </div>
    </div>
  );
}