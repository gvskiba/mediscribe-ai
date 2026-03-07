import { useState, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowLeft } from "lucide-react";

const G = {
  navy:"#050f1e", slate:"#0b1d35", panel:"#0d2240", edge:"#162d4f",
  border:"#1e3a5f", muted:"#2a4d72", dim:"#4a7299", text:"#c8ddf0",
  bright:"#e8f4ff", teal:"#00d4bc", amber:"#f5a623", red:"#ff5c6c",
  green:"#2ecc71", purple:"#9b6dff", blue:"#4a90d9", rose:"#f472b6",
  orange:"#ff8c42",
};

const SEV = {
  critical: { color:G.red,    bg:"rgba(255,92,108,.12)",  border:"rgba(255,92,108,.35)",  icon:"🔴" },
  high:     { color:G.orange, bg:"rgba(255,140,66,.12)",  border:"rgba(255,140,66,.35)",  icon:"🟠" },
  moderate: { color:G.amber,  bg:"rgba(245,166,35,.12)",  border:"rgba(245,166,35,.35)",  icon:"🟡" },
  low:      { color:G.blue,   bg:"rgba(74,144,217,.1)",   border:"rgba(74,144,217,.3)",   icon:"🔵" },
  normal:   { color:G.green,  bg:"rgba(46,204,113,.08)",  border:"rgba(46,204,113,.25)",  icon:"🟢" },
};

const btn = (bg, fg="#fff", br="transparent", p="9px 18px") => ({
  padding:p, borderRadius:8, fontFamily:"inherit", fontSize:12.5, fontWeight:700,
  cursor:"pointer", display:"inline-flex", alignItems:"center", gap:6,
  border:`1px solid ${br}`, background:bg, color:fg, transition:"all .15s", whiteSpace:"nowrap",
});
const badge = (bg, fg, br, p="3px 9px") => ({
  padding:p, borderRadius:20, fontSize:10.5, fontWeight:700,
  background:bg, border:`1px solid ${br}`, color:fg, display:"inline-block",
});
const card  = { background:G.panel, border:`1px solid ${G.border}`, borderRadius:13, overflow:"hidden" };
const panelHead = {
  padding:"11px 16px 9px", fontFamily:"serif",
  fontSize:13, fontWeight:700, color:G.bright,
  borderBottom:`1px solid rgba(30,58,95,.4)`, background:"rgba(11,29,53,.5)",
  display:"flex", alignItems:"center", gap:8, flexShrink:0,
};

const calcAge = dob => dob ? Math.floor((new Date()-new Date(dob))/(365.25*86400000)) : null;
const fmtDate = d => d ? new Date(d).toLocaleDateString("en-US",{ month:"short", day:"numeric", year:"numeric", hour:"2-digit", minute:"2-digit" }) : "—";

function Skeleton({ w="100%", h=13, mb=8 }) {
  return <div style={{ height:h, width:w, borderRadius:4, marginBottom:mb,
    background:`linear-gradient(90deg,${G.edge} 25%,${G.muted} 50%,${G.edge} 75%)`,
    backgroundSize:"200% 100%", animation:"shimmer 1.4s infinite" }}/>;
}

function SevBadge({ sev }) {
  const s = SEV[sev] || SEV.normal;
  return <span style={{ ...badge(s.bg, s.color, s.border), fontSize:9.5, fontWeight:800, letterSpacing:".06em" }}>{s.icon} {sev?.toUpperCase()}</span>;
}

function AnalysisResult({ result }) {
  if (!result) return null;
  let parsed = null;
  try {
    const clean = result.replace(/```json|```/g,"").trim();
    parsed = JSON.parse(clean);
  } catch { /* raw text fallback */ }

  if (!parsed) {
    return (
      <div style={{ ...card, marginTop:14 }}>
        <div style={{ ...panelHead }}>✦ AI Analysis</div>
        <div style={{ padding:"16px", fontSize:13, color:G.text, lineHeight:1.85, whiteSpace:"pre-wrap" }}>{result}</div>
      </div>
    );
  }

  const { summary, abnormalFindings = [], normalFindings = [], recommendations = [], additionalWorkup = [], urgency, guideline } = parsed;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12, marginTop:14 }}>
      <div style={{ background:"linear-gradient(135deg,rgba(0,212,188,.06),rgba(155,109,255,.04))", border:`1px solid rgba(0,212,188,.2)`, borderRadius:13, padding:"16px 18px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10, flexWrap:"wrap" }}>
          <span style={{ fontSize:15, fontWeight:700, color:G.bright }}>✦ AI Clinical Summary</span>
          {urgency && <SevBadge sev={urgency.toLowerCase()}/>}
          {guideline && <span style={{ fontSize:10.5, color:G.dim, marginLeft:"auto" }}>📖 {guideline}</span>}
        </div>
        <div style={{ fontSize:13, color:G.text, lineHeight:1.85 }}>{summary}</div>
      </div>

      {abnormalFindings.length > 0 && (
        <div style={card}>
          <div style={{ ...panelHead, background:"rgba(255,92,108,.07)", borderBottom:`1px solid rgba(255,92,108,.2)` }}>
            ⚠️ Abnormal Findings
            <span style={{ marginLeft:"auto", ...badge("rgba(255,92,108,.15)",G.red,"rgba(255,92,108,.3)","2px 8px"), fontSize:10 }}>{abnormalFindings.length} flagged</span>
          </div>
          <div style={{ padding:"12px 14px", display:"flex", flexDirection:"column", gap:10 }}>
            {abnormalFindings.map((f, i) => {
              const s = SEV[f.severity?.toLowerCase()] || SEV.moderate;
              return (
                <div key={i} style={{ background:s.bg, border:`1px solid ${s.border}`, borderRadius:10, padding:"13px 15px", borderLeft:`3px solid ${s.color}` }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
                    <span style={{ fontWeight:800, fontSize:13.5, color:G.bright }}>{f.name}</span>
                    <SevBadge sev={f.severity?.toLowerCase() || "moderate"}/>
                    {f.value && (
                      <span style={{ fontFamily:"monospace", fontSize:12, fontWeight:700, color:s.color, background:`${s.color}18`, border:`1px solid ${s.color}44`, borderRadius:6, padding:"2px 8px" }}>
                        {f.value}{f.unit ? ` ${f.unit}` : ""}
                      </span>
                    )}
                    {f.referenceRange && <span style={{ fontSize:11, color:G.muted }}>Ref: {f.referenceRange}</span>}
                  </div>
                  <div style={{ fontSize:12.5, color:G.text, lineHeight:1.7 }}>{f.interpretation}</div>
                  {f.recommendation && (
                    <div style={{ marginTop:8, background:"rgba(0,0,0,.2)", borderRadius:8, padding:"10px 12px", borderLeft:`2px solid ${s.color}88` }}>
                      <div style={{ fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:".08em", color:s.color, marginBottom:5 }}>💊 Recommended Action</div>
                      <div style={{ fontSize:12.5, color:G.text, lineHeight:1.7 }}>{f.recommendation}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {normalFindings.length > 0 && (
        <details style={{ ...card }}>
          <summary style={{ padding:"12px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:8, listStyle:"none" }}>
            <span>🟢</span>
            <span style={{ fontWeight:700, fontSize:13, color:G.text }}>Normal / Within Reference Range</span>
            <span style={{ marginLeft:"auto", ...badge("rgba(46,204,113,.1)",G.green,"rgba(46,204,113,.3)","2px 8px"), fontSize:10 }}>{normalFindings.length}</span>
          </summary>
          <div style={{ padding:"10px 14px 14px", borderTop:`1px solid rgba(30,58,95,.3)`, display:"flex", flexWrap:"wrap", gap:6 }}>
            {normalFindings.map((f, i) => (
              <span key={i} style={{ fontSize:11.5, padding:"4px 11px", borderRadius:20, background:"rgba(46,204,113,.07)", border:"1px solid rgba(46,204,113,.2)", color:G.green }}>
                ✓ {f.name}{f.value ? `: ${f.value}` : ""}
              </span>
            ))}
          </div>
        </details>
      )}

      {recommendations.length > 0 && (
        <div style={card}>
          <div style={{ ...panelHead, background:"rgba(0,212,188,.05)", borderBottom:`1px solid rgba(0,212,188,.2)` }}>📋 Clinical Recommendations</div>
          <div style={{ padding:"12px 14px", display:"flex", flexDirection:"column", gap:8 }}>
            {recommendations.map((r, i) => (
              <div key={i} style={{ display:"flex", gap:12, padding:"10px 12px", background:"rgba(0,212,188,.05)", border:"1px solid rgba(0,212,188,.15)", borderRadius:9 }}>
                <div style={{ width:24, height:24, borderRadius:"50%", background:"rgba(0,212,188,.15)", border:"1px solid rgba(0,212,188,.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:G.teal, flexShrink:0, marginTop:1 }}>{i+1}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:13, color:G.bright, marginBottom:3 }}>{r.action}</div>
                  {r.rationale && <div style={{ fontSize:12, color:G.dim, lineHeight:1.65 }}>{r.rationale}</div>}
                  {r.urgency && <div style={{ marginTop:5 }}><SevBadge sev={r.urgency.toLowerCase()}/></div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {additionalWorkup.length > 0 && (
        <div style={card}>
          <div style={{ ...panelHead, background:"rgba(155,109,255,.05)", borderBottom:`1px solid rgba(155,109,255,.2)` }}>🔬 Suggested Additional Workup</div>
          <div style={{ padding:"12px 14px", display:"flex", flexDirection:"column", gap:7 }}>
            {additionalWorkup.map((w, i) => (
              <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"9px 12px", background:"rgba(155,109,255,.06)", border:"1px solid rgba(155,109,255,.18)", borderRadius:9 }}>
                <span style={{ fontSize:16, flexShrink:0 }}>
                  {w.type?.toLowerCase().includes("lab") ? "🧪" : w.type?.toLowerCase().includes("imag") ? "🩻" : w.type?.toLowerCase().includes("ekg") || w.type?.toLowerCase().includes("ecg") ? "💓" : "📋"}
                </span>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:13, color:G.bright }}>{w.test}</div>
                  {w.indication && <div style={{ fontSize:12, color:G.dim, marginTop:2 }}>{w.indication}</div>}
                </div>
                {w.type && <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:6, background:"rgba(155,109,255,.1)", border:"1px solid rgba(155,109,255,.25)", color:G.purple, flexShrink:0 }}>{w.type}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InputPanel({ icon, placeholder, value, onChange, onFileLoad, accept, hint }) {
  const fileRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFile(file) {
    if (!file) return;
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = e => onFileLoad({ type:"image", dataUrl:e.target.result, name:file.name, mimeType:file.type });
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = e => { onChange(e.target.result); onFileLoad({ type:"text", name:file.name }); };
      reader.readAsText(file);
    }
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
        onClick={() => fileRef.current?.click()}
        style={{ border:`2px dashed ${dragOver?"rgba(0,212,188,.6)":G.border}`, borderRadius:11, padding:"20px 16px", textAlign:"center", cursor:"pointer", background:dragOver?"rgba(0,212,188,.04)":"rgba(11,29,53,.4)", transition:"all .15s" }}>
        <input ref={fileRef} type="file" accept={accept} style={{ display:"none" }} onChange={e => handleFile(e.target.files[0])}/>
        <div style={{ fontSize:28, marginBottom:8, opacity:.6 }}>{icon}</div>
        <div style={{ fontSize:13, fontWeight:600, color:G.text, marginBottom:3 }}>Drop file here or click to upload</div>
        <div style={{ fontSize:11, color:G.muted }}>{hint}</div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ flex:1, height:1, background:`rgba(30,58,95,.5)` }}/>
        <span style={{ fontSize:11, color:G.muted }}>or paste text below</span>
        <div style={{ flex:1, height:1, background:`rgba(30,58,95,.5)` }}/>
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={8}
        style={{ width:"100%", background:"rgba(11,29,53,.6)", border:`1px solid ${G.border}`, borderRadius:10, padding:"13px 15px", fontFamily:"monospace", fontSize:11.5, color:G.bright, lineHeight:1.75, resize:"vertical", outline:"none" }}
      />
    </div>
  );
}

const SCHEMA_INSTRUCTION = `
Respond ONLY with valid JSON (no markdown, no backticks) matching this exact schema:
{
  "urgency": "critical | high | moderate | low | normal",
  "summary": "2-3 sentence plain-English clinical summary",
  "guideline": "Primary guideline referenced",
  "abnormalFindings": [{ "name": "string", "value": "string", "unit": "string", "referenceRange": "string", "severity": "critical|high|moderate|low", "interpretation": "string", "recommendation": "string" }],
  "normalFindings": [{ "name": "string", "value": "string" }],
  "recommendations": [{ "action": "string", "rationale": "string", "urgency": "string" }],
  "additionalWorkup": [{ "test": "string", "type": "Lab|Imaging|EKG|Consult|Procedure", "indication": "string" }]
}`;

function dataUrlToBlob(dataUrl) {
  const [header, base64] = dataUrl.split(",");
  const mimeType = header.match(/:(.*?);/)[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mimeType });
}

async function uploadImageFile(dataUrl, fileName) {
  const blob = dataUrlToBlob(dataUrl);
  const file = new File([blob], fileName || "upload.png", { type: blob.type });
  const uploaded = await base44.integrations.Core.UploadFile({ file });
  return uploaded.file_url;
}

async function callAI(prompt, fileUrls) {
  const params = { prompt, response_json_schema: null };
  if (fileUrls?.length) params.file_urls = fileUrls;
  const result = await base44.integrations.Core.InvokeLLM(params);
  return typeof result === "string" ? result : JSON.stringify(result);
}

export default function LabsImagingTab({ note, noteId, queryClient, isFirstTab, isLastTab, handleBack, handleNext }) {
  const [activeTab, setActiveTab] = useState("labs");

  const [labText, setLabText]         = useState("");
  const [labFile, setLabFile]         = useState(null);
  const [labResult, setLabResult]     = useState(null);
  const [labAnalyzing, setLabAnalyzing] = useState(false);
  const [labHistory, setLabHistory]   = useState([]);

  const [imgText, setImgText]         = useState("");
  const [imgFile, setImgFile]         = useState(null);
  const [imgResult, setImgResult]     = useState(null);
  const [imgAnalyzing, setImgAnalyzing] = useState(false);
  const [imgHistory, setImgHistory]   = useState([]);

  const [ekgText, setEkgText]         = useState("");
  const [ekgFile, setEkgFile]         = useState(null);
  const [ekgResult, setEkgResult]     = useState(null);
  const [ekgAnalyzing, setEkgAnalyzing] = useState(false);
  const [ekgHistory, setEkgHistory]   = useState([]);

  const [toastMsg, setToastMsg]       = useState(null);
  const toastRef = useRef(null);

  const showToast = useCallback((msg, color = G.teal) => {
    clearTimeout(toastRef.current);
    setToastMsg({ msg, color });
    toastRef.current = setTimeout(() => setToastMsg(null), 3800);
  }, []);

  const patientName   = note?.patient_name || "Unknown Patient";
  const patientMRN    = note?.patient_id || "—";
  const patientAge    = note?.patient_age || (note?.date_of_birth ? calcAge(note.date_of_birth) : null);
  const patientGender = note?.patient_gender || "—";
  const primaryDx     = (note?.diagnoses || []).slice(0,2).join("; ") || note?.assessment || "";
  const allergies     = note?.allergies || [];
  const activeMeds    = note?.medications || [];

  function patientCtx() {
    return `Patient: ${patientName}${patientAge ? ", "+patientAge+"yo" : ""} ${patientGender}
MRN: ${patientMRN}
Primary Diagnosis: ${primaryDx || "Not specified"}
Medications: ${activeMeds.slice(0,5).join(", ") || "None"}
Allergies: ${allergies.join(", ") || "NKDA"}`;
  }

  async function analyzeLabs() {
    if (!labText.trim() && !labFile) { showToast("Paste lab results or upload a file first", G.amber); return; }
    setLabAnalyzing(true); setLabResult(null);
    try {
      let text;
      if (labFile?.type === "image") {
        const uploaded = await base44.integrations.Core.UploadFile({ file: labFile.dataUrl });
        text = await callAI(`Analyze these lab results.\n\n${patientCtx()}\n\n${SCHEMA_INSTRUCTION}`, [uploaded.file_url]);
      } else {
        text = await callAI(`Analyze the following lab results using evidence-based guidelines (ACC/AHA, ADA, KDIGO, ASH, IDSA).\n\n${patientCtx()}\n\nLAB RESULTS:\n${labText}\n\n${SCHEMA_INSTRUCTION}`);
      }
      setLabResult(text);
      setLabHistory(p => [{ id:Date.now(), timestamp:new Date().toISOString(), input:labText||`[Image: ${labFile?.name}]`, result:text }, ...p]);
      // Save abnormal findings to note
      try {
        const parsed = JSON.parse(text.replace(/```json|```/g,"").trim());
        const newFindings = (parsed.abnormalFindings||[]).map(f => ({ test_name:f.name, result:f.value||"", reference_range:f.referenceRange||"", status:f.severity==="critical"?"critical":["high","moderate"].includes(f.severity)?"abnormal":"normal", unit:f.unit||"" }));
        if (newFindings.length) {
          await base44.entities.ClinicalNote.update(noteId, { lab_findings:[...(note?.lab_findings||[]), ...newFindings] });
          queryClient.invalidateQueries({ queryKey:["note", noteId] });
        }
      } catch { /* skip */ }
      showToast("Lab analysis complete ✓", G.teal);
    } catch { showToast("AI service unavailable — please retry", G.red); }
    setLabAnalyzing(false);
  }

  async function analyzeImaging() {
    if (!imgText.trim() && !imgFile) { showToast("Paste a radiology report or upload an image first", G.amber); return; }
    setImgAnalyzing(true); setImgResult(null);
    try {
      let text;
      if (imgFile?.type === "image") {
        const uploaded = await base44.integrations.Core.UploadFile({ file: imgFile.dataUrl });
        text = await callAI(`Analyze this imaging study using ACR/RSNA guidelines.\n\n${patientCtx()}\n\n${SCHEMA_INSTRUCTION}`, [uploaded.file_url]);
      } else {
        text = await callAI(`Analyze this radiology/imaging report using ACR, RSNA guidelines.\n\n${patientCtx()}\n\nIMAGING REPORT:\n${imgText}\n\n${SCHEMA_INSTRUCTION}`);
      }
      setImgResult(text);
      setImgHistory(p => [{ id:Date.now(), timestamp:new Date().toISOString(), input:imgText||`[Image: ${imgFile?.name}]`, result:text }, ...p]);
      try {
        const parsed = JSON.parse(text.replace(/```json|```/g,"").trim());
        const newFindings = (parsed.abnormalFindings||[]).map(f => ({ study_type:"Imaging", location:f.name, findings:f.interpretation||"", impression:f.recommendation||"" }));
        if (newFindings.length) {
          await base44.entities.ClinicalNote.update(noteId, { imaging_findings:[...(note?.imaging_findings||[]), ...newFindings] });
          queryClient.invalidateQueries({ queryKey:["note", noteId] });
        }
      } catch { /* skip */ }
      showToast("Imaging analysis complete ✓", G.purple);
    } catch { showToast("AI service unavailable — please retry", G.red); }
    setImgAnalyzing(false);
  }

  async function analyzeEKG() {
    if (!ekgText.trim() && !ekgFile) { showToast("Paste EKG findings or upload an EKG image first", G.amber); return; }
    setEkgAnalyzing(true); setEkgResult(null);
    try {
      let text;
      if (ekgFile?.type === "image") {
        const uploaded = await base44.integrations.Core.UploadFile({ file: ekgFile.dataUrl });
        text = await callAI(`Analyze this 12-lead EKG using ACC/AHA and HRS guidelines.\n\n${patientCtx()}\n\n${SCHEMA_INSTRUCTION}`, [uploaded.file_url]);
      } else {
        text = await callAI(`Analyze the following EKG findings using ACC/AHA and HRS guidelines.\n\n${patientCtx()}\n\nEKG FINDINGS:\n${ekgText}\n\n${SCHEMA_INSTRUCTION}`);
      }
      setEkgResult(text);
      setEkgHistory(p => [{ id:Date.now(), timestamp:new Date().toISOString(), input:ekgText||`[Image: ${ekgFile?.name}]`, result:text }, ...p]);
      showToast("EKG analysis complete ✓", G.rose);
    } catch { showToast("AI service unavailable — please retry", G.red); }
    setEkgAnalyzing(false);
  }

  function countAbnormals(r) { try { return JSON.parse(r?.replace(/```json|```/g,"").trim()||"{}").abnormalFindings?.length||0; } catch { return 0; } }
  function getUrgency(r)    { try { return JSON.parse(r?.replace(/```json|```/g,"").trim()||"{}").urgency||null; } catch { return null; } }

  const labAbn = countAbnormals(labResult), imgAbn = countAbnormals(imgResult), ekgAbn = countAbnormals(ekgResult);
  const labUrg = getUrgency(labResult), imgUrg = getUrgency(imgResult), ekgUrg = getUrgency(ekgResult);
  const totalAbn = labAbn + imgAbn + ekgAbn;

  const TABS = [
    { id:"labs",    icon:"🧪", label:"Lab Analysis",     color:G.teal,   abn:labAbn, urg:labUrg, has:!!labResult },
    { id:"imaging", icon:"🩻", label:"Imaging Analysis", color:G.purple, abn:imgAbn, urg:imgUrg, has:!!imgResult },
    { id:"ekg",     icon:"💓", label:"EKG Analysis",     color:G.rose,   abn:ekgAbn, urg:ekgUrg, has:!!ekgResult },
  ];

  function AnalyzingState({ label, color }) {
    return (
      <div style={{ ...card, marginTop:14, padding:"28px 24px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:20 }}>
          <div style={{ width:10, height:10, borderRadius:"50%", background:color, flexShrink:0 }}/>
          <span style={{ fontSize:15, color:G.bright }}>Analyzing {label}…</span>
        </div>
        {[90,75,100,60,82,55].map((w,i) => <Skeleton key={i} w={`${w}%`} h={i===0?16:12} mb={i===0?14:8}/>)}
      </div>
    );
  }

  function HistoryPanel({ history, onSelect }) {
    if (!history.length) return null;
    return (
      <div style={{ ...card, marginTop:14 }}>
        <div style={{ ...panelHead }}>🕐 Previous Analyses ({history.length})</div>
        <div style={{ padding:"8px" }}>
          {history.slice(0,5).map((h,i) => (
            <button key={h.id} onClick={() => onSelect(h.result)}
              style={{ width:"100%", textAlign:"left", padding:"9px 12px", background:i===0?"rgba(22,45,79,.6)":"transparent", border:`1px solid ${i===0?G.border:"transparent"}`, borderRadius:8, cursor:"pointer", fontFamily:"inherit", marginBottom:4 }}
              onMouseEnter={e => e.currentTarget.style.background="rgba(22,45,79,.5)"}
              onMouseLeave={e => { e.currentTarget.style.background=i===0?"rgba(22,45,79,.6)":"transparent"; }}>
              <div style={{ fontSize:11.5, fontWeight:700, color:G.bright, marginBottom:2 }}>{fmtDate(h.timestamp)}</div>
              <div style={{ fontSize:10.5, color:G.dim, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{(h.input||"").slice(0,80)}…</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  function PatientChip({ accentColor }) {
    return (
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14, padding:"8px 13px", background:"rgba(22,45,79,.4)", border:`1px solid rgba(30,58,95,.5)`, borderRadius:9, flexWrap:"wrap" }}>
        <span style={{ fontSize:10.5, color:G.dim }}>Patient:</span>
        <span style={{ fontSize:11.5, fontWeight:600, color:G.bright }}>{patientName}</span>
        {patientAge && <span style={{ fontSize:11, color:G.dim }}>{patientAge}yo {patientGender}</span>}
        {primaryDx && <span style={{ fontSize:11, color:accentColor, background:`${accentColor}18`, border:`1px solid ${accentColor}33`, borderRadius:5, padding:"1px 7px" }}>{primaryDx.split("(")[0].trim().slice(0,40)}</span>}
        {allergies.length > 0 && <span style={{ fontSize:11, color:G.red }}>⚠ {allergies.length} allerg{allergies.length>1?"ies":"y"}</span>}
      </div>
    );
  }

  function FileIndicator({ file, onClear, accentColor }) {
    if (!file) return null;
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 13px", background:`${accentColor}12`, border:`1px solid ${accentColor}33`, borderRadius:8 }}>
          <span style={{ fontSize:14 }}>{file.type==="image"?"🖼":"📄"}</span>
          <span style={{ fontSize:12.5, fontWeight:600, color:accentColor }}>{file.name}</span>
          <button style={{ marginLeft:"auto", background:"none", border:"none", color:G.muted, cursor:"pointer", fontSize:14 }} onClick={onClear}>✕</button>
        </div>
        {file.type==="image" && file.dataUrl && (
          <div style={{ border:`1px solid ${accentColor}33`, borderRadius:10, overflow:"hidden", maxHeight:240, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,.4)" }}>
            <img src={file.dataUrl} alt="Uploaded" style={{ maxWidth:"100%", maxHeight:240, objectFit:"contain" }}/>
          </div>
        )}
      </div>
    );
  }

  async function saveToNote(resultText, type) {
    if (!resultText) return showToast(`Run ${type} analysis first`, G.amber);
    try {
      const p = JSON.parse(resultText.replace(/```json|```/g,"").trim());
      const append = `\n\n[${type} Analysis]\n${p.summary||""}\n${(p.abnormalFindings||[]).map(f=>`• ${f.name}${f.value?`: ${f.value}`:""} — ${f.interpretation||""}`).join("\n")}`;
      await base44.entities.ClinicalNote.update(noteId, { assessment:(note.assessment||"")+append });
      queryClient.invalidateQueries({ queryKey:["note", noteId] });
      showToast(`${type} findings saved to note ✓`, G.teal);
    } catch { showToast("Save failed", G.red); }
  }

  return (
    <div style={{ fontFamily:"system-ui,sans-serif", background:G.navy, height:"100%", color:G.text, display:"flex", flexDirection:"column", position:"relative", overflow:"hidden" }}>
      <style>{`
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#2a4d72;border-radius:2px}
        details>summary{user-select:none;list-style:none}
        details>summary::-webkit-details-marker{display:none}
        details[open]>summary{border-bottom:1px solid rgba(30,58,95,.4)}
        @keyframes shimmer{to{background-position:-200% 0}}
      `}</style>

      {/* Header */}
      <div style={{ padding:"12px 20px 10px", borderBottom:`1px solid rgba(30,58,95,.6)`, background:"rgba(11,29,53,.5)", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:38, height:38, background:"rgba(0,212,188,.1)", border:"1px solid rgba(0,212,188,.25)", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🔬</div>
          <div>
            <div style={{ fontSize:18, fontWeight:700, color:G.bright }}>Clinical Analysis Center</div>
            <div style={{ fontSize:11, color:G.dim }}>Labs · Imaging · EKG — AI-Powered</div>
          </div>
        </div>
        {totalAbn > 0 && (
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", background:"rgba(255,92,108,.08)", border:"1px solid rgba(255,92,108,.25)", borderRadius:8 }}>
            <span>⚠️</span>
            <span style={{ fontWeight:700, fontSize:12, color:G.red }}>{totalAbn} abnormal finding{totalAbn!==1?"s":""}</span>
          </div>
        )}
      </div>

      {/* 3-col layout */}
      <div style={{ display:"grid", gridTemplateColumns:"200px 1fr 240px", flex:1, overflow:"hidden", minHeight:0 }}>

        {/* LEFT: Nav */}
        <div style={{ borderRight:`1px solid ${G.border}`, background:"rgba(11,29,53,.3)", display:"flex", flexDirection:"column", overflow:"hidden" }}>
          <div style={{ ...panelHead }}>🔬 Modules</div>
          <div style={{ padding:"6px 6px 0 6px", borderBottom:`1px solid rgba(30,58,95,.4)` }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px 10px" }}>
              <div style={{ width:28, height:28, borderRadius:7, background:"rgba(0,212,188,.1)", border:"1px solid rgba(0,212,188,.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, flexShrink:0 }}>👤</div>
              <div style={{ minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:11.5, color:G.bright, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{patientName}</div>
                <div style={{ fontSize:10, color:G.dim }}>{patientMRN}{patientAge?` · ${patientAge}yo`:""}</div>
              </div>
            </div>
          </div>
          <div style={{ padding:"8px", flex:1, overflow:"auto" }}>
            {TABS.map(tab => {
              const isActive = activeTab === tab.id;
              const s = tab.urg ? SEV[tab.urg.toLowerCase()] : null;
              return (
                <button key={tab.id}
                  style={{ width:"100%", textAlign:"left", padding:"11px 12px", background:isActive?`${tab.color}12`:"transparent", border:`1px solid ${isActive?`${tab.color}44`:"rgba(30,58,95,.5)"}`, borderRadius:9, cursor:"pointer", fontFamily:"inherit", fontSize:12.5, fontWeight:600, color:isActive?G.bright:G.dim, display:"flex", alignItems:"center", gap:8, marginBottom:5, transition:"all .12s" }}
                  onClick={() => setActiveTab(tab.id)}>
                  <span style={{ fontSize:17, width:20 }}>{tab.icon}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ lineHeight:1.25, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{tab.label}</div>
                    {tab.has && <div style={{ fontSize:10, color:tab.abn>0?s?.color||G.amber:G.green, marginTop:2 }}>{tab.abn>0?`${tab.abn} abnormal`:"All normal"}</div>}
                  </div>
                  {tab.abn>0 && <span style={{ width:18, height:18, borderRadius:"50%", background:s?.bg||"rgba(245,166,35,.15)", border:`1px solid ${s?.border||"rgba(245,166,35,.3)"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:800, color:s?.color||G.amber, flexShrink:0 }}>{tab.abn}</span>}
                  {tab.has && tab.abn===0 && <span style={{ fontSize:12, color:G.green }}>✓</span>}
                </button>
              );
            })}
          </div>
          <div style={{ borderTop:`1px solid rgba(30,58,95,.4)`, padding:"8px 12px", flexShrink:0 }}>
            <div style={{ fontSize:9, fontWeight:800, textTransform:"uppercase", letterSpacing:".09em", color:G.dim, marginBottom:5 }}>Guidelines</div>
            {[["Labs","ACC/AHA, ADA, KDIGO"],["Imaging","ACR, RSNA"],["EKG","ACC/AHA, HRS"]].map(([t,g]) => (
              <div key={t} style={{ display:"flex", gap:6, marginBottom:4 }}>
                <span style={{ fontSize:10, fontWeight:700, color:G.dim, flexShrink:0, width:40 }}>{t}</span>
                <span style={{ fontSize:10, color:G.muted }}>{g}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CENTER */}
        <div style={{ overflowY:"auto", background:"rgba(5,10,20,.3)" }}>

          {/* LABS */}
          {activeTab==="labs" && (
            <div style={{ padding:20 }}>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10, flexWrap:"wrap", marginBottom:16 }}>
                <div>
                  <div style={{ fontSize:19, fontWeight:700, color:G.bright, display:"flex", alignItems:"center", gap:10 }}>🧪 Lab Analysis</div>
                  <div style={{ fontSize:12, color:G.dim, marginTop:3 }}>Upload or paste lab results · AI flags abnormals with guideline recommendations</div>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  {(labText||labFile) && !labAnalyzing && <button style={btn("transparent",G.dim,G.border,"7px 12px")} onClick={() => { setLabText(""); setLabFile(null); setLabResult(null); }}>✕ Clear</button>}
                  <button style={{ ...btn(`linear-gradient(135deg,${G.teal},#00a896)`), opacity:labAnalyzing?0.6:1 }} onClick={analyzeLabs} disabled={labAnalyzing}>{labAnalyzing?"✦ Analyzing…":"✦ Analyze Labs"}</button>
                </div>
              </div>
              <PatientChip accentColor={G.teal}/>
              <FileIndicator file={labFile} onClear={() => setLabFile(null)} accentColor={G.teal}/>
              <InputPanel icon="🧪" placeholder={`Paste lab results here, e.g.:\n\nNa: 132 (135-145) LOW\nK: 5.8 (3.5-5.0) HIGH\nCr: 2.1 HIGH\nWBC: 18.4 HIGH\n\n--- or upload your lab report ---`}
                value={labText} onChange={setLabText} onFileLoad={f => setLabFile(f)} accept=".txt,.pdf,.csv,image/*" hint="Accepts .txt, .csv, PDF, or image (JPG/PNG)"/>
              {labAnalyzing && <AnalyzingState label="lab results" color={G.teal}/>}
              {!labAnalyzing && labResult && <AnalysisResult result={labResult}/>}
              {!labAnalyzing && !labResult && <HistoryPanel history={labHistory} onSelect={r => setLabResult(r)}/>}
            </div>
          )}

          {/* IMAGING */}
          {activeTab==="imaging" && (
            <div style={{ padding:20 }}>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10, flexWrap:"wrap", marginBottom:16 }}>
                <div>
                  <div style={{ fontSize:19, fontWeight:700, color:G.bright }}>🩻 Imaging Analysis</div>
                  <div style={{ fontSize:12, color:G.dim, marginTop:3 }}>Upload radiology images or paste report text · ACR/RSNA guidelines</div>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  {(imgText||imgFile) && !imgAnalyzing && <button style={btn("transparent",G.dim,G.border,"7px 12px")} onClick={() => { setImgText(""); setImgFile(null); setImgResult(null); }}>✕ Clear</button>}
                  <button style={{ ...btn(`linear-gradient(135deg,${G.purple},#7c5cd6)`), opacity:imgAnalyzing?0.6:1 }} onClick={analyzeImaging} disabled={imgAnalyzing}>{imgAnalyzing?"✦ Analyzing…":"✦ Analyze Imaging"}</button>
                </div>
              </div>
              <PatientChip accentColor={G.purple}/>
              <FileIndicator file={imgFile} onClear={() => setImgFile(null)} accentColor={G.purple}/>
              <InputPanel icon="🩻" placeholder={`Paste radiology report, e.g.:\n\nCHEST X-RAY\nFindings: Bilateral interstitial opacities. Small pleural effusions. Cardiomegaly.\nImpression: Pulmonary edema.\n\n--- or upload CT, X-ray, MRI image ---`}
                value={imgText} onChange={setImgText} onFileLoad={f => setImgFile(f)} accept="image/*,.txt,.pdf" hint="Accepts radiology images (JPG/PNG) or report text"/>
              {imgAnalyzing && <AnalyzingState label="imaging study" color={G.purple}/>}
              {!imgAnalyzing && imgResult && <AnalysisResult result={imgResult}/>}
              {!imgAnalyzing && !imgResult && <HistoryPanel history={imgHistory} onSelect={r => setImgResult(r)}/>}
            </div>
          )}

          {/* EKG */}
          {activeTab==="ekg" && (
            <div style={{ padding:20 }}>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10, flexWrap:"wrap", marginBottom:16 }}>
                <div>
                  <div style={{ fontSize:19, fontWeight:700, color:G.bright }}>💓 EKG Analysis</div>
                  <div style={{ fontSize:12, color:G.dim, marginTop:3 }}>Upload a 12-lead EKG or paste interpretation · ACC/AHA & HRS guidelines</div>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  {(ekgText||ekgFile) && !ekgAnalyzing && <button style={btn("transparent",G.dim,G.border,"7px 12px")} onClick={() => { setEkgText(""); setEkgFile(null); setEkgResult(null); }}>✕ Clear</button>}
                  <button style={{ ...btn(`linear-gradient(135deg,${G.rose},#c0309e)`), opacity:ekgAnalyzing?0.6:1 }} onClick={analyzeEKG} disabled={ekgAnalyzing}>{ekgAnalyzing?"✦ Analyzing…":"✦ Analyze EKG"}</button>
                </div>
              </div>
              <PatientChip accentColor={G.rose}/>
              <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:14 }}>
                {[["Rate","60–100 bpm"],["PR","120–200ms"],["QRS","<120ms"],["QTc","<440/<460ms"]].map(([l,v]) => (
                  <div key={l} style={{ padding:"4px 9px", background:"rgba(22,45,79,.5)", border:`1px solid rgba(30,58,95,.5)`, borderRadius:6, display:"flex", gap:5 }}>
                    <span style={{ fontSize:9.5, fontWeight:800, textTransform:"uppercase", color:G.dim }}>{l}</span>
                    <span style={{ fontFamily:"monospace", fontSize:10, color:G.teal, fontWeight:700 }}>{v}</span>
                  </div>
                ))}
              </div>
              <FileIndicator file={ekgFile} onClear={() => setEkgFile(null)} accentColor={G.rose}/>
              <InputPanel icon="💓" placeholder={`Paste EKG interpretation, e.g.:\n\nRate: 112 bpm\nPR: 186 ms\nQRS: 148 ms\nQTc: 584 ms\nInterpretation: Sinus tachycardia, LBBB, QTc prolonged\n\n--- or upload a 12-lead EKG image ---`}
                value={ekgText} onChange={setEkgText} onFileLoad={f => setEkgFile(f)} accept="image/*,.txt,.pdf" hint="Upload EKG image or paste computerized interpretation"/>
              {ekgAnalyzing && <AnalyzingState label="EKG" color={G.rose}/>}
              {!ekgAnalyzing && ekgResult && <AnalysisResult result={ekgResult}/>}
              {!ekgAnalyzing && !ekgResult && <HistoryPanel history={ekgHistory} onSelect={r => setEkgResult(r)}/>}
            </div>
          )}
        </div>

        {/* RIGHT: Summary */}
        <div style={{ borderLeft:`1px solid ${G.border}`, background:"rgba(11,29,53,.3)", display:"flex", flexDirection:"column", overflow:"hidden" }}>
          <div style={panelHead}>📊 Summary</div>
          <div style={{ overflowY:"auto", flex:1, padding:10 }}>
            <div style={{ background:G.panel, border:`1px solid ${G.border}`, borderRadius:10, padding:"10px 12px", marginBottom:8 }}>
              <div style={{ fontSize:9.5, fontWeight:800, textTransform:"uppercase", letterSpacing:".08em", color:G.dim, marginBottom:7 }}>Analysis Status</div>
              {TABS.map(tab => {
                const s = tab.urg ? SEV[tab.urg.toLowerCase()] : null;
                return (
                  <div key={tab.id} style={{ display:"flex", alignItems:"center", gap:7, marginBottom:7, padding:"8px 10px", background:"rgba(22,45,79,.4)", border:`1px solid rgba(30,58,95,.5)`, borderRadius:8, cursor:"pointer" }}
                    onClick={() => setActiveTab(tab.id)}>
                    <span style={{ fontSize:14 }}>{tab.icon}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:tab.has?G.bright:G.dim, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{tab.label}</div>
                      <div style={{ fontSize:10, color:tab.has?(tab.abn>0?s?.color||G.amber:G.green):G.muted }}>{tab.has?(tab.abn>0?`${tab.abn} abnormal`:"✓ All normal"):"Not analyzed"}</div>
                    </div>
                    {tab.has && (tab.abn>0 ? <span style={{ fontSize:12 }}>{s?.icon||"🟡"}</span> : <span style={{ fontSize:12 }}>🟢</span>)}
                  </div>
                );
              })}
            </div>

            {!labResult && !imgResult && !ekgResult && (
              <div style={{ padding:"12px", background:"rgba(22,45,79,.3)", border:`1px solid rgba(30,58,95,.4)`, borderRadius:10, marginBottom:8 }}>
                <div style={{ fontSize:9.5, fontWeight:800, textTransform:"uppercase", letterSpacing:".08em", color:G.dim, marginBottom:7 }}>How to use</div>
                {["Select Labs, Imaging, or EKG","Paste results or upload a file","Click Analyze — AI flags abnormals","Save findings to note"].map((tip,i) => (
                  <div key={i} style={{ display:"flex", gap:7, marginBottom:6, fontSize:11.5, color:G.text, lineHeight:1.5 }}>
                    <span style={{ color:G.teal, fontWeight:700, flexShrink:0 }}>{i+1}.</span>{tip}
                  </div>
                ))}
              </div>
            )}

            <div style={{ ...panelHead, borderRadius:"10px 10px 0 0", marginTop:4 }}>📥 Save to Note</div>
            <div style={{ background:G.panel, border:`1px solid ${G.border}`, borderTop:"none", borderRadius:"0 0 10px 10px", padding:8, display:"flex", flexDirection:"column", gap:6, marginBottom:8 }}>
              {[
                { icon:"🧪", label:"Save Lab Findings",     color:G.teal,   type:"Lab",     result:labResult },
                { icon:"🩻", label:"Save Imaging Findings", color:G.purple, type:"Imaging", result:imgResult },
                { icon:"💓", label:"Save EKG Findings",     color:G.rose,   type:"EKG",     result:ekgResult },
              ].map(a => (
                <button key={a.label}
                  style={{ width:"100%", padding:"8px 10px", borderRadius:7, fontFamily:"inherit", fontSize:11.5, fontWeight:700, cursor:"pointer", border:`1px solid ${a.color}33`, background:`${a.color}0d`, color:a.color, display:"flex", alignItems:"center", gap:7, transition:"all .15s" }}
                  onMouseEnter={e => { e.currentTarget.style.background=`${a.color}22`; }}
                  onMouseLeave={e => { e.currentTarget.style.background=`${a.color}0d`; }}
                  onClick={() => saveToNote(a.result, a.type)}>
                  <span style={{ fontSize:14 }}>{a.icon}</span>{a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer nav */}
      <div style={{ flexShrink:0, display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 20px", borderTop:`1px solid ${G.border}`, background:"rgba(11,29,53,.8)" }}>
        <div>
          {totalAbn > 0
            ? <span style={{ padding:"4px 10px", borderRadius:20, fontSize:10.5, fontWeight:700, background:"rgba(255,92,108,.1)", border:"1px solid rgba(255,92,108,.3)", color:G.red }}>⚠ {totalAbn} abnormal</span>
            : (labResult||imgResult||ekgResult) && <span style={{ padding:"4px 10px", borderRadius:20, fontSize:10.5, fontWeight:700, background:"rgba(46,204,113,.08)", border:"1px solid rgba(46,204,113,.25)", color:G.green }}>✓ All normal</span>
          }
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {!isFirstTab() && (
            <button onClick={handleBack} style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 14px", borderRadius:7, fontSize:12, fontWeight:600, cursor:"pointer", background:"transparent", color:G.dim, border:`1px solid ${G.border}` }}
              onMouseEnter={e => e.currentTarget.style.color=G.text}
              onMouseLeave={e => e.currentTarget.style.color=G.dim}>
              <ArrowLeft size={13}/> Back
            </button>
          )}
          {!isLastTab() && (
            <button onClick={handleNext} style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 14px", borderRadius:7, fontSize:12, fontWeight:600, cursor:"pointer", background:`rgba(0,212,188,.12)`, color:G.teal, border:`1px solid rgba(0,212,188,.3)` }}
              onMouseEnter={e => { e.currentTarget.style.background=G.teal; e.currentTarget.style.color=G.navy; }}
              onMouseLeave={e => { e.currentTarget.style.background=`rgba(0,212,188,.12)`; e.currentTarget.style.color=G.teal; }}>
              Next <ArrowLeft size={13} style={{ transform:"rotate(180deg)" }}/>
            </button>
          )}
        </div>
      </div>

      {toastMsg && (
        <div style={{ position:"absolute", bottom:70, right:16, zIndex:99 }}>
          <div style={{ background:G.panel, border:`1px solid ${G.border}`, borderLeft:`3px solid ${toastMsg.color}`, borderRadius:9, padding:"10px 14px", fontSize:12.5, fontWeight:600, color:G.bright, boxShadow:"0 8px 24px rgba(0,0,0,.35)" }}>{toastMsg.msg}</div>
        </div>
      )}
    </div>
  );
}