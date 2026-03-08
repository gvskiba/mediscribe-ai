import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";

const C = {
  navy:"#050f1e", slate:"#0b1d35", panel:"#0d2240", edge:"#162d4f",
  border:"#1e3a5f", muted:"#2a4d72", dim:"#4a7299", text:"#c8ddf0",
  bright:"#e8f4ff", teal:"#00d4bc", amber:"#f5a623", red:"#ff5c6c",
  green:"#2ecc71", purple:"#9b6dff", blue:"#4a90d9", orange:"#ff8c42", cyan:"#22d3ee",
};

const VT = { hr:{l:50,h:100}, sbp:{l:90,h:180}, dbp:{l:60,h:110}, temp:{l:36,h:38.3}, rr:{l:12,h:20}, spo2:{l:94,h:101}, gcs:{l:14,h:16}, glu:{l:70,h:180} };

const DEMOS = {
  sepsis:{name:'Marcus Webb, MRN-4821',age:'58',sex:'Male',HR:'118',SBP:'88',DBP:'56',Temp:'38.9',RR:'24',SpO2:'94',GCS:'13',Glu:'98',WBC:'18.4',Lac:'4.2',Cr:'2.1',Trop:'0.04',Dimer:'',INR:'',pH:'7.28',Bic:'16',BNP:'',Hgb:'',cc:'58M with fever, hypotension, tachycardia, altered mentation. 6-hour history. Started with UTI symptoms 2 days ago. Decreased urine output, general weakness.',pmh:'DM2, CKD Stage 3, on metformin. No recent hospitalizations.',img:'CXR: no infiltrate, no cardiomegaly. ECG: sinus tachycardia.'},
  stemi:{name:'Robert Kim, MRN-3357',age:'67',sex:'Male',HR:'98',SBP:'96',DBP:'62',Temp:'37.1',RR:'20',SpO2:'92',GCS:'15',Glu:'210',WBC:'11.2',Lac:'2.8',Cr:'1.4',Trop:'2.84',Dimer:'',INR:'',pH:'7.34',Bic:'20',BNP:'580',Hgb:'14.2',cc:'67M crushing substernal chest pain 9/10, radiates to left jaw and arm, diaphoretic, onset 45 minutes ago while shoveling snow. Severe dyspnea.',pmh:'HTN, hyperlipidemia, 30 pack-year smoker. Father died of MI at 62. On amlodipine, atorvastatin.',img:'ECG: ST elevation V1-V4, reciprocal changes in inferior leads. CXR: mild pulmonary vascular congestion.'},
  stroke:{name:'Elena Torres, MRN-7193',age:'72',sex:'Female',HR:'88',SBP:'196',DBP:'108',Temp:'37.0',RR:'16',SpO2:'97',GCS:'12',Glu:'142',WBC:'8.2',Lac:'',Cr:'1.1',Trop:'0.02',Dimer:'',INR:'1.1',pH:'',Bic:'',BNP:'',Hgb:'13.8',cc:'72F sudden onset right arm and leg weakness, facial droop right side, unable to speak clearly. Last seen normal 1.5 hours ago. NIHSS estimated 14.',pmh:'HTN, AF on warfarin (subtherapeutic INR), type 2 DM. On metoprolol, warfarin, metformin.',img:'CT head: no hemorrhage, no early ischemic changes. CTA pending.'},
  pe:{name:'Jennifer Walsh, MRN-5519',age:'44',sex:'Female',HR:'124',SBP:'84',DBP:'50',Temp:'37.2',RR:'28',SpO2:'88',GCS:'14',Glu:'115',WBC:'12.1',Lac:'3.8',Cr:'1.0',Trop:'0.22',Dimer:'8400',INR:'1.2',pH:'7.31',Bic:'18',BNP:'890',Hgb:'13.4',cc:'44F acute onset severe dyspnea, pleuritic chest pain, syncope at home. Returned from 14-hour flight 3 days ago. Right leg swelling and pain 1 week.',pmh:'OCP use, no prior VTE, no malignancy. Non-smoker.',img:'ECG: S1Q3T3 pattern, sinus tachycardia. CXR: Hampton hump right lower lobe. Bedside echo: RV dilation, McConnell sign.'},
  dissection:{name:'Thomas Briggs, MRN-8801',age:'62',sex:'Male',HR:'108',SBP:'182',DBP:'96',Temp:'37.3',RR:'22',SpO2:'96',GCS:'14',Glu:'126',WBC:'14.8',Lac:'2.1',Cr:'1.8',Trop:'0.08',Dimer:'6200',INR:'',pH:'',Bic:'',BNP:'',Hgb:'15.1',cc:'62M sudden-onset tearing chest pain radiating to back, worst pain of life, onset at rest 2 hours ago. BP differential: R 182/96, L 148/84. Pulse deficit left radial.',pmh:'Untreated hypertension, Marfan features (tall, long arms, lens dislocation history).',img:'CXR: widened mediastinum, left pleural effusion. ECG: LVH, no ST elevation.'},
  dka:{name:'Maria Santos, MRN-2234',age:'24',sex:'Female',HR:'114',SBP:'102',DBP:'66',Temp:'37.4',RR:'28',SpO2:'97',GCS:'13',Glu:'482',WBC:'16.2',Lac:'1.8',Cr:'1.6',Trop:'0.01',Dimer:'',INR:'',pH:'7.08',Bic:'8',BNP:'',Hgb:'',cc:'24F type 1 diabetic presenting with polyuria, polydipsia, nausea, vomiting, abdominal pain, Kussmaul breathing. Ran out of insulin 3 days ago. Fruity breath.',pmh:'Type 1 DM since age 9. On insulin glargine and lispro. No prior DKA.',img:'CXR: clear. ECG: peaked T waves consistent with hyperkalemia.'},
};

function esc(s) { return String(s || ""); }

function getVitalStatus(val, key) {
  const v = parseFloat(val);
  if (isNaN(v)) return "normal";
  const t = VT[key];
  if (v < t.l || v > t.h) return "abn";
  if ((key === 'sbp' && v < 100) || (key === 'spo2' && v < 96) || (key === 'gcs' && v < 15)) return "warn";
  return "normal";
}

function VitalBox({ label, id, value, onChange, unit, vkey }) {
  const status = getVitalStatus(value, vkey);
  const boxStyle = {
    background: status === "abn" ? "rgba(255,92,108,.07)" : status === "warn" ? "rgba(245,166,35,.05)" : C.edge,
    border: `1px solid ${status === "abn" ? "rgba(255,92,108,.55)" : status === "warn" ? "rgba(245,166,35,.5)" : C.border}`,
    borderRadius: 8, padding: "8px 9px", transition: "all .2s",
  };
  return (
    <div style={boxStyle}>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.muted, letterSpacing:".06em", marginBottom:2 }}>{label}</div>
      <input value={value} onChange={e => onChange(e.target.value)}
        style={{ width:"100%", background:"transparent", border:"none", color:C.text, fontFamily:"'JetBrains Mono',monospace", fontSize:17, fontWeight:700, outline:"none" }}
        placeholder="—"
      />
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.muted }}>{unit}</div>
    </div>
  );
}

function AlertCard({ dx, idx }) {
  const sc = dx.severity === 'critical' ? C.red : dx.severity === 'high' ? C.amber : C.blue;
  const tc = dx.timeframe === 'immediate' || dx.timeframe === 'urgent' ? dx.timeframe : 'monitor';
  const timeColor = tc === 'immediate' ? C.red : tc === 'urgent' ? C.amber : C.blue;
  const cardBorder = dx.severity === 'critical' ? "rgba(255,92,108,.5)" : dx.severity === 'high' ? "rgba(245,166,35,.45)" : "rgba(74,144,217,.35)";
  const cardBg = dx.severity === 'critical' ? "linear-gradient(135deg,rgba(255,92,108,.08),rgba(255,92,108,.03))" : dx.severity === 'high' ? "linear-gradient(135deg,rgba(245,166,35,.07),rgba(245,166,35,.02))" : "rgba(74,144,217,.05)";

  return (
    <div style={{
      borderRadius:14, overflow:"hidden", cursor:"pointer",
      border: `1px solid ${cardBorder}`, background: cardBg,
      animation: `fadeUp .3s ease ${.05+idx*.09}s both`,
      transition: "transform .2s, box-shadow .2s",
    }}
    onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
    onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
    >
      {/* Top */}
      <div style={{ padding:"14px 16px", display:"flex", alignItems:"flex-start", gap:12 }}>
        <div style={{ fontSize:30, flexShrink:0, marginTop:2 }}>{dx.icon || "⚠️"}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{
            fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, letterSpacing:".09em",
            padding:"2px 8px", borderRadius:8, display:"inline-flex", alignItems:"center", gap:4, marginBottom:5,
            background: `${sc}30`, color: sc, border: `1px solid ${sc}55`,
          }}>{(dx.severity||"").toUpperCase()}</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:C.bright, letterSpacing:"-.01em", lineHeight:1.1, marginBottom:4 }}>{dx.name}</div>
          <div style={{ fontSize:12, color:C.dim, lineHeight:1.5 }}>{dx.subtitle}</div>
          {dx.timeframeLabel && (
            <div style={{
              display:"inline-flex", alignItems:"center", gap:5, padding:"3px 9px", borderRadius:7,
              fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, marginTop:7,
              background:`${timeColor}22`, color:timeColor, border:`1px solid ${timeColor}45`,
            }}>⏱ {dx.timeframeLabel}</div>
          )}
        </div>
        <div style={{ textAlign:"right", flexShrink:0 }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:24, fontWeight:700, color:sc, lineHeight:1 }}>{dx.confidence}%</div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.dim, letterSpacing:".06em" }}>CONFIDENCE</div>
        </div>
      </div>

      {/* Key findings */}
      {(dx.keyFindings||[]).length > 0 && (
        <div style={{ padding:"0 16px 14px", borderTop:"1px solid rgba(255,255,255,.06)" }}>
          {(dx.keyFindings||[]).map((f, i) => {
            const fc = f.flag==='critical'?C.red:f.flag==='high'?C.amber:C.dim;
            return (
              <div key={i} style={{ display:"flex", gap:8, padding:"6px 0", borderBottom: i < dx.keyFindings.length-1 ? "1px solid rgba(255,255,255,.04)" : "none" }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:fc, flexShrink:0, marginTop:5 }} />
                <div style={{ fontSize:12, color:C.text, lineHeight:1.55, flex:1 }}>{f.text}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Criteria + scores chips */}
      {((dx.criteria||[]).length > 0 || (dx.scores||[]).length > 0) && (
        <div style={{ padding:"9px 16px", borderTop:"1px solid rgba(255,255,255,.05)", background:"rgba(0,0,0,.18)", display:"flex", flexWrap:"wrap", gap:6 }}>
          {(dx.criteria||[]).map((cr, i) => {
            const cc = cr.flag==='critical'?"rgba(255,92,108,.18)":cr.flag==='high'?"rgba(245,166,35,.14)":C.edge;
            const ct = cr.flag==='critical'?C.red:cr.flag==='high'?C.amber:C.text;
            return (
              <div key={i} style={{ padding:"3px 9px", borderRadius:7, fontFamily:"'JetBrains Mono',monospace", fontSize:10, background:cc, border:`1px solid ${ct}22`, color:ct, display:"inline-flex", alignItems:"center", gap:5 }}>
                <span style={{ color:C.muted, fontSize:9 }}>{cr.label}:</span>
                <span style={{ fontWeight:700 }}>{cr.value}</span>
              </div>
            );
          })}
          {(dx.scores||[]).map((s, i) => {
            const sc2 = s.color==='red'?"rgba(255,92,108,.18)":s.color==='amber'?"rgba(245,166,35,.15)":C.edge;
            const st = s.color==='red'?C.red:s.color==='amber'?C.amber:C.teal;
            return (
              <div key={i} style={{ padding:"3px 9px", borderRadius:7, fontFamily:"'JetBrains Mono',monospace", fontSize:10, background:sc2, border:`1px solid ${st}35`, color:st, display:"inline-flex", alignItems:"center", gap:5 }}>
                <span style={{ color:C.muted, fontSize:9 }}>{s.name}:</span>
                <span style={{ fontWeight:700 }}>{s.value}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RecItem({ item, priority, type }) {
  const colors = { imm: C.red, urg: C.amber, rou: C.blue };
  const col = colors[type] || C.blue;
  const labels = { imm: "NOW", urg: "URGENT", rou: "REF" };
  return (
    <div style={{
      padding:"9px 11px", borderRadius:9, background:C.edge, border:`1px solid ${C.border}`,
      marginBottom:7, cursor:"pointer", borderLeft:`3px solid ${col}`,
      transition:"border-color .15s", animation:"slideIn .3s ease both",
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = C.muted}
    onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
    >
      <div style={{ fontSize:12, fontWeight:600, color:C.bright, marginBottom:3, display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, padding:"1px 6px", borderRadius:6, background:`${col}25`, color:col }}>{labels[type]}</span>
        {item.action || item.source || item.target}
      </div>
      {(item.detail || item.recommendation) && (
        <div style={{ fontSize:11, color:C.dim, lineHeight:1.55 }}>{item.detail || item.recommendation}</div>
      )}
      {item.class && (
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.muted, marginTop:5 }}>{item.class} · Evidence: {item.evidence||''}</div>
      )}
    </div>
  );
}

export default function CantMissDiagnoses() {
  const navigate = useNavigate();
  const [clock, setClock] = useState("");
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [barState, setBarState] = useState({ type:"idle", txt:"Enter patient data and click Analyze", ts:"" });
  const [results, setResults] = useState(null);
  const [aiSrc, setAiSrc] = useState("");

  // Patient data
  const [ptName, setPtName] = useState("");
  const [ptAge, setPtAge] = useState("");
  const [ptSex, setPtSex] = useState("Male");
  const [vitals, setVitals] = useState({ HR:"", SBP:"", DBP:"", Temp:"", RR:"", SpO2:"", GCS:"", Glu:"" });
  const [labs, setLabs] = useState({ WBC:"", Lac:"", Cr:"", Trop:"", Dimer:"", INR:"", pH:"", Bic:"", BNP:"", Hgb:"" });
  const [ccx, setCcx] = useState("");
  const [pmh, setPmh] = useState("");
  const [imag, setImag] = useState("");

  useEffect(() => {
    const iv = setInterval(() => {
      const n = new Date();
      const t = n.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})+' · '+n.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
      setClock(t);
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  const toast = (msg, type = "i") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  };

  const loadDemo = (key) => {
    const d = DEMOS[key]; if (!d) return;
    setPtName(d.name); setPtAge(d.age); setPtSex(d.sex);
    setVitals({ HR:d.HR, SBP:d.SBP, DBP:d.DBP, Temp:d.Temp, RR:d.RR, SpO2:d.SpO2, GCS:d.GCS, Glu:d.Glu });
    setLabs({ WBC:d.WBC, Lac:d.Lac, Cr:d.Cr, Trop:d.Trop, Dimer:d.Dimer, INR:d.INR, pH:d.pH, Bic:d.Bic, BNP:d.BNP, Hgb:d.Hgb });
    setCcx(d.cc); setPmh(d.pmh); setImag(d.img);
    toast(`Loaded: ${key.toUpperCase()} scenario`, 'i');
  };

  const buildPt = () =>
    `PATIENT: ${ptName}, Age: ${ptAge}, Sex: ${ptSex}\n\nVITAL SIGNS:\n- HR: ${vitals.HR} bpm\n- BP: ${vitals.SBP}/${vitals.DBP} mmHg\n- Temp: ${vitals.Temp}°C\n- RR: ${vitals.RR} breaths/min\n- SpO₂: ${vitals.SpO2}%\n- GCS: ${vitals.GCS}/15\n- Glucose: ${vitals.Glu} mg/dL\n\nLABS:\n- WBC: ${labs.WBC} | Lactate: ${labs.Lac} | Creatinine: ${labs.Cr} | Troponin: ${labs.Trop}\n- D-Dimer: ${labs.Dimer} | INR: ${labs.INR} | pH: ${labs.pH} | Bicarb: ${labs.Bic}\n- BNP: ${labs.BNP} | Hemoglobin: ${labs.Hgb}\n\nCHIEF COMPLAINT: ${ccx}\nPMH/MEDS: ${pmh}\nIMAGING/ECG: ${imag}`;

  const doAnalysis = async () => {
    if (busy) return;
    setBusy(true); setScanning(true); setResults(null); setAiSrc("");
    setBarState({ type:"act", txt:"⚡ AI scanning for critical diagnoses…", ts:"" });

    const SYSTEM = `You are Notrya AI, a critical care CDS system specializing in time-sensitive diagnosis detection. You use validated clinical criteria and reference the MOST CURRENT published society guidelines (SSC 2021, ACC/AHA 2023, AHA Stroke 2023, ESC PE 2019, ADA 2024, etc.).

Screen for ALL of these critical diagnoses: Sepsis/Septic Shock, STEMI/NSTEMI/ACS, Acute Ischemic Stroke, Hemorrhagic Stroke, Massive/Submassive PE, Type A Aortic Dissection, DKA/HHS, Hypertensive Emergency, Meningitis/Encephalitis, Anaphylaxis, Tension Pneumothorax, Necrotizing Fasciitis, Spinal Cord Compression, Carbon Monoxide Poisoning, Acute Liver Failure, Addisonian Crisis.

Apply validated scores where data allows: qSOFA, SOFA, HEART, Wells PE, NIHSS, ABCD2, NEWS2.

Return ONLY a valid JSON object:
{
  "diagnoses": [{"name":string,"severity":"critical"|"high"|"moderate","confidence":number,"icon":string,"subtitle":string,"timeframe":"immediate"|"urgent"|"monitor","timeframeLabel":string,"criteria":[{"label":string,"value":string,"flag":"critical"|"high"|"normal"}],"keyFindings":[{"text":string,"flag":"critical"|"high"|"normal"}],"scores":[{"name":string,"value":string,"color":"red"|"amber"|"blue"}]}],
  "immediateActions":[{"action":string,"priority":"immediate"|"urgent","detail":string}],
  "urgentWorkup":[{"action":string,"detail":string}],
  "guidelines":[{"source":string,"recommendation":string,"class":string,"evidence":string}],
  "timingTargets":[{"target":string,"goal":string,"critical":boolean}],
  "summary":string
}
Only include diagnoses >40% confidence. Sort by severity then confidence. Return ONLY JSON.`;

    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `${SYSTEM}\n\nAnalyze this patient for critical diagnoses and provide specific actionable recommendations.\n\n${buildPt()}`,
        response_json_schema: {
          type: "object",
          properties: {
            diagnoses: { type: "array", items: { type: "object" } },
            immediateActions: { type: "array", items: { type: "object" } },
            urgentWorkup: { type: "array", items: { type: "object" } },
            guidelines: { type: "array", items: { type: "object" } },
            timingTargets: { type: "array", items: { type: "object" } },
            summary: { type: "string" },
          },
        },
      });
      setResults(res);
      const dxCount = (res.diagnoses||[]).length;
      setBarState({ type:"ok", txt:`✓ Analysis complete — ${dxCount} diagnosis flags`, ts:`Last analyzed: ${new Date().toLocaleTimeString()}` });
      toast(`${dxCount} diagnoses flagged`, 's');
    } catch (err) {
      setBarState({ type:"err", txt:"Analysis failed — check connection", ts:"" });
      toast("Error: " + err.message, 'e');
    } finally {
      setBusy(false); setScanning(false);
    }
  };

  const dxList = results?.diagnoses || [];
  const critCount = dxList.filter(d => d.severity === 'critical').length;
  const barColor = barState.type === 'act' ? C.red : barState.type === 'ok' ? C.green : barState.type === 'err' ? C.amber : C.muted;

  const inputStyle = { width:"100%", background:C.edge, border:`1px solid ${C.border}`, borderRadius:7, padding:"6px 9px", color:C.text, fontFamily:"'DM Sans',sans-serif", fontSize:12, outline:"none" };
  const labelStyle = { fontSize:11, color:C.dim, marginBottom:3, display:"block" };
  const sectionLabel = { fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, color:C.dim, letterSpacing:".12em", marginBottom:9 };

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:C.navy, minHeight:"100vh", color:C.text, display:"flex", flexDirection:"column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.2}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes critGlow{0%,100%{box-shadow:0 0 0 0 rgba(255,92,108,0)}50%{box-shadow:0 0 30px 0 rgba(255,92,108,.25)}}
        @keyframes scanLine{0%{top:-3px}100%{top:102%}}
        @keyframes warnPulse{0%,100%{border-color:rgba(245,166,35,.4)}50%{border-color:rgba(245,166,35,.9)}}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#1e3a5f;border-radius:3px}
        input,select,textarea{transition:border-color .15s}
        input:focus,select:focus,textarea:focus{border-color:#4a7299 !important}
        input::placeholder,textarea::placeholder{color:#2a4d72}
        select option{background:#0b1d35}
      `}</style>

      {/* Navbar */}
      <nav style={{ position:"sticky", top:0, zIndex:200, height:54, background:"rgba(11,29,53,.96)", borderBottom:`1px solid ${C.border}`, backdropFilter:"blur(20px)", display:"flex", alignItems:"center", padding:"0 22px", gap:14, flexShrink:0 }}>
        <span onClick={() => navigate(createPageUrl("Home"))} style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:C.bright, letterSpacing:"-.02em", cursor:"pointer" }}>Notrya</span>
        <div style={{ width:1, height:18, background:C.border }} />
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, color:C.red, letterSpacing:".1em" }}>⚠ CAN'T-MISS DIAGNOSES</span>
        <div style={{ flex:1 }} />
        <div style={{ display:"flex", alignItems:"center", gap:7, padding:"4px 12px", borderRadius:20, background:"rgba(255,92,108,.1)", border:"1px solid rgba(255,92,108,.3)" }}>
          <div style={{ width:7, height:7, borderRadius:"50%", background:C.red, animation:"pulse 1s infinite" }} />
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, color:C.red, letterSpacing:".08em" }}>AI ACTIVE</span>
        </div>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:C.dim }}>{clock}</span>
        <button onClick={() => navigate(createPageUrl("Home"))} style={{ padding:"5px 12px", borderRadius:9, background:C.edge, border:`1px solid ${C.border}`, color:C.dim, fontSize:12, cursor:"pointer", fontWeight:500 }}>← Home</button>
      </nav>

      {/* Critical banner */}
      <div style={{ position:"relative", zIndex:10, padding:"8px 22px", background:"linear-gradient(90deg,rgba(255,92,108,.1),rgba(255,92,108,.05) 60%,transparent)", borderBottom:"1px solid rgba(255,92,108,.25)", display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
        <div style={{ width:7, height:7, borderRadius:"50%", background:C.red, animation:"pulse .9s infinite", flexShrink:0 }} />
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:700, color:C.red, letterSpacing:".06em" }}>CRITICAL DIAGNOSIS SCREENING — AI ANALYZES AGAINST LATEST PUBLISHED GUIDELINES IN REAL TIME</span>
      </div>

      {/* Page header */}
      <div style={{ position:"relative", zIndex:1, padding:"16px 22px", background:C.slate, borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:14, flexShrink:0 }}>
        <div style={{ width:44, height:44, borderRadius:11, fontSize:22, display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg,rgba(255,92,108,.2),rgba(245,166,35,.1))", border:"1px solid rgba(255,92,108,.35)", flexShrink:0 }}>🚨</div>
        <div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:21, fontWeight:700, color:C.bright, letterSpacing:"-.02em" }}>Can't-Miss Diagnoses</div>
          <div style={{ fontSize:12, color:C.dim, marginTop:2 }}>Enter vitals + labs + clinical context → AI screens, scores, and recommends based on current guidelines</div>
        </div>
        <div style={{ flex:1 }} />
        <div style={{ padding:"7px 15px", borderRadius:10, background:C.panel, border:`1px solid ${C.border}`, textAlign:"center", minWidth:68 }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:20, fontWeight:700, color:C.dim }}>{results ? dxList.length : "—"}</div>
          <div style={{ fontSize:10, color:C.muted, marginTop:1 }}>Flags</div>
        </div>
        <div style={{ padding:"7px 15px", borderRadius:10, background:C.panel, border: critCount > 0 ? "1px solid rgba(255,92,108,.4)" : `1px solid ${C.border}`, textAlign:"center", minWidth:68 }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:20, fontWeight:700, color: results ? (critCount > 0 ? C.red : C.dim) : C.dim }}>{results ? critCount : "—"}</div>
          <div style={{ fontSize:10, color:C.muted, marginTop:1 }}>Critical</div>
        </div>
      </div>

      {/* 3-col body */}
      <div style={{ display:"flex", flex:1, overflow:"hidden", position:"relative", zIndex:1 }}>

        {/* LEFT */}
        <div style={{ width:285, flexShrink:0, background:C.panel, borderRight:`1px solid ${C.border}`, overflowY:"auto", display:"flex", flexDirection:"column" }}>

          {/* Patient */}
          <div style={{ padding:"12px 14px", borderBottom:`1px solid ${C.border}` }}>
            <div style={sectionLabel}>👤 PATIENT</div>
            <div style={{ marginBottom:9 }}>
              <label style={labelStyle}>Name / MRN</label>
              <input style={inputStyle} value={ptName} onChange={e => setPtName(e.target.value)} />
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7 }}>
              <div><label style={labelStyle}>Age</label><input type="number" style={inputStyle} value={ptAge} onChange={e => setPtAge(e.target.value)} /></div>
              <div><label style={labelStyle}>Sex</label>
                <select style={inputStyle} value={ptSex} onChange={e => setPtSex(e.target.value)}>
                  <option>Male</option><option>Female</option>
                </select>
              </div>
            </div>
          </div>

          {/* Vitals */}
          <div style={{ padding:"12px 14px", borderBottom:`1px solid ${C.border}` }}>
            <div style={sectionLabel}>📊 VITALS</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7 }}>
              {[
                { label:"HEART RATE", key:"HR", vkey:"hr", unit:"bpm" },
                { label:"SYS BP", key:"SBP", vkey:"sbp", unit:"mmHg" },
                { label:"DIA BP", key:"DBP", vkey:"dbp", unit:"mmHg" },
                { label:"TEMP", key:"Temp", vkey:"temp", unit:"°C" },
                { label:"RESP RATE", key:"RR", vkey:"rr", unit:"br/min" },
                { label:"SpO₂", key:"SpO2", vkey:"spo2", unit:"%" },
                { label:"GCS", key:"GCS", vkey:"gcs", unit:"/15" },
                { label:"GLUCOSE", key:"Glu", vkey:"glu", unit:"mg/dL" },
              ].map(v => (
                <VitalBox key={v.key} label={v.label} value={vitals[v.key]} vkey={v.vkey} unit={v.unit}
                  onChange={val => setVitals(p => ({...p, [v.key]: val}))} />
              ))}
            </div>
          </div>

          {/* Labs */}
          <div style={{ padding:"12px 14px", borderBottom:`1px solid ${C.border}` }}>
            <div style={sectionLabel}>🧪 KEY LABS</div>
            {[
              [["WBC (×10³/µL)","WBC"],["Lactate (mmol/L)","Lac"]],
              [["Creatinine","Cr"],["Troponin (ng/mL)","Trop"]],
              [["D-Dimer (ng/mL)","Dimer"],["INR","INR"]],
              [["pH (ABG)","pH"],["Bicarb (mEq/L)","Bic"]],
              [["BNP (pg/mL)","BNP"],["Hemoglobin","Hgb"]],
            ].map((row, ri) => (
              <div key={ri} style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7, marginBottom:9 }}>
                {row.map(([lbl, key]) => (
                  <div key={key}>
                    <label style={labelStyle}>{lbl}</label>
                    <input style={inputStyle} value={labs[key]} onChange={e => setLabs(p => ({...p, [key]: e.target.value}))} />
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Clinical context */}
          <div style={{ padding:"12px 14px", borderBottom:`1px solid ${C.border}` }}>
            <div style={sectionLabel}>📋 CLINICAL CONTEXT</div>
            {[
              ["Chief Complaint", ccx, setCcx, 4],
              ["PMH / Medications", pmh, setPmh, 2],
              ["Imaging / ECG", imag, setImag, 2],
            ].map(([lbl, val, setter, rows]) => (
              <div key={lbl} style={{ marginBottom:9 }}>
                <label style={labelStyle}>{lbl}</label>
                <textarea rows={rows} style={{...inputStyle, resize:"none", lineHeight:1.55}} value={val} onChange={e => setter(e.target.value)} />
              </div>
            ))}
          </div>

          {/* Demos */}
          <div style={{ padding:"12px 14px 6px", borderBottom:`1px solid ${C.border}` }}>
            <div style={sectionLabel}>⚡ DEMO SCENARIOS</div>
          </div>
          <div style={{ padding:"0 14px 12px", display:"flex", flexDirection:"column", gap:5 }}>
            {[
              ["sepsis", C.red, "Septic Shock — UTI source"],
              ["stemi", C.red, "STEMI — Anterior wall"],
              ["stroke", C.red, "Acute Ischemic Stroke"],
              ["pe", C.amber, "Massive Pulmonary Embolism"],
              ["dissection", C.red, "Aortic Dissection"],
              ["dka", C.amber, "DKA — Severe"],
            ].map(([key, color, label]) => (
              <button key={key} onClick={() => loadDemo(key)} style={{
                display:"flex", alignItems:"center", gap:8, padding:"7px 10px", borderRadius:8,
                background:C.edge, border:`1px solid ${C.border}`, color:C.dim, fontSize:11,
                cursor:"pointer", textAlign:"left", transition:"all .13s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor="rgba(255,92,108,.4)"; e.currentTarget.style.color=C.text; e.currentTarget.style.background="rgba(255,92,108,.05)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.dim; e.currentTarget.style.background=C.edge; }}
              >
                <div style={{ width:6, height:6, borderRadius:"50%", background:color, flexShrink:0 }} />
                {label}
              </button>
            ))}
          </div>

          {/* Analyze btn */}
          <button onClick={doAnalysis} disabled={busy} style={{
            margin:"12px 14px 14px", padding:11, borderRadius:12, cursor: busy ? "not-allowed" : "pointer",
            background:"linear-gradient(135deg,rgba(255,92,108,.22),rgba(245,166,35,.12))",
            border:"1px solid rgba(255,92,108,.5)", color:C.red,
            fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:700,
            display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            opacity: busy ? 0.45 : 1, transition:"all .2s",
          }}
          onMouseEnter={e => { if (!busy) { e.currentTarget.style.background="linear-gradient(135deg,rgba(255,92,108,.32),rgba(245,166,35,.2))"; e.currentTarget.style.transform="translateY(-1px)"; }}}
          onMouseLeave={e => { e.currentTarget.style.background="linear-gradient(135deg,rgba(255,92,108,.22),rgba(245,166,35,.12))"; e.currentTarget.style.transform="translateY(0)"; }}
          >
            {busy ? (
              <div style={{ width:15, height:15, border:"2px solid rgba(255,92,108,.3)", borderTopColor:C.red, borderRadius:"50%", animation:"spin .6s linear infinite" }} />
            ) : (results ? "🔄" : "🔍")}
            {busy ? "Analyzing…" : results ? "Re-Analyze" : "Analyze for Critical Diagnoses"}
          </button>
        </div>

        {/* CENTER */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          {/* Status bar */}
          <div style={{ padding:"9px 20px", background:C.slate, borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:barColor, flexShrink:0, transition:"background .3s", animation: barState.type === "act" ? "pulse .8s infinite" : "none" }} />
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color: barState.type === "act" ? C.red : C.dim }}>{barState.txt}</span>
            <div style={{ flex:1 }} />
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.muted }}>{barState.ts}</span>
          </div>

          {/* Content */}
          <div style={{ flex:1, overflowY:"auto", position:"relative" }}>
            {/* Scan line */}
            {scanning && (
              <div style={{ position:"absolute", left:0, right:0, height:2, background:"linear-gradient(90deg,transparent,rgba(0,212,188,.8),transparent)", animation:"scanLine 1.8s linear infinite", zIndex:5, pointerEvents:"none" }} />
            )}

            <div style={{ padding:"16px 20px", display:"flex", flexDirection:"column", gap:11 }}>
              {!results && !busy && (
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"52px 24px", textAlign:"center" }}>
                  <div style={{ fontSize:52, marginBottom:14, opacity:.45 }}>🛡️</div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, color:C.dim, marginBottom:8 }}>Ready to Screen</div>
                  <div style={{ fontSize:13, color:C.muted, lineHeight:1.65, maxWidth:340 }}>Load a demo or enter patient data, then click <strong style={{ color:C.red }}>Analyze</strong>. AI will screen for life-threatening diagnoses using current published guidelines.</div>
                  <div style={{ marginTop:18, display:"flex", flexWrap:"wrap", justifyContent:"center" }}>
                    {[
                      [C.red,"Sepsis / Septic Shock"],["Sepsis / Septic Shock",C.red,"STEMI / NSTEMI"],[C.red,"STEMI / NSTEMI"],[C.red,"Ischemic Stroke"],
                      [C.amber,"Pulmonary Embolism"],[C.amber,"Aortic Dissection"],[C.blue,"DKA / HHS"],[C.blue,"Meningitis"],[C.blue,"Hypertensive Emergency"],["#9b6dff","Necrotizing Fasciitis"],["#9b6dff","Tension Pneumothorax"],
                    ].filter((_, i) => i % 2 === 0).map(([color, label]) => (
                      <span key={label} style={{ padding:"5px 12px", borderRadius:10, fontSize:11, display:"inline-block", margin:3, border:`1px solid ${color}50`, background:`${color}10`, color:`${color}b0` }}>{label}</span>
                    ))}
                  </div>
                </div>
              )}

              {busy && (
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"52px 24px", textAlign:"center" }}>
                  <div style={{ fontSize:52, marginBottom:14, animation:"spin 1.5s linear infinite" }}>⚙️</div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, color:C.dim, marginBottom:8 }}>Analyzing…</div>
                  <div style={{ fontSize:13, color:C.muted, lineHeight:1.65 }}>Searching current guidelines and screening for critical diagnoses.</div>
                </div>
              )}

              {results && !busy && (
                <>
                  {results.summary && (
                    <div style={{ padding:"12px 14px", background:"rgba(255,92,108,.06)", border:"1px solid rgba(255,92,108,.2)", borderRadius:12, fontSize:13, color:C.text, lineHeight:1.65, animation:"fadeUp .3s ease" }}>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.red, letterSpacing:".1em", marginBottom:5, fontWeight:700 }}>⚠ AI CLINICAL SUMMARY</div>
                      {results.summary}
                    </div>
                  )}
                  {dxList.length === 0 ? (
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"40px", textAlign:"center" }}>
                      <div style={{ fontSize:52, marginBottom:14 }}>✅</div>
                      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, color:C.dim, marginBottom:8 }}>No Critical Diagnoses Flagged</div>
                      <div style={{ fontSize:13, color:C.muted }}>AI analysis did not identify high-confidence critical diagnoses. Continue clinical monitoring.</div>
                    </div>
                  ) : (
                    dxList.map((dx, i) => <AlertCard key={i} dx={dx} idx={i} />)
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ width:310, flexShrink:0, background:C.panel, borderLeft:`1px solid ${C.border}`, overflowY:"auto" }}>

          {/* Immediate actions */}
          <div style={{ padding:"12px 14px", borderBottom:`1px solid ${C.border}` }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, color:C.dim, letterSpacing:".12em", marginBottom:9, display:"flex", alignItems:"center", gap:6 }}>
              ⚡ IMMEDIATE ACTIONS
              {results && (results.immediateActions||[]).length > 0 && (
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.red, padding:"1px 7px", borderRadius:7, background:"rgba(255,92,108,.14)", border:"1px solid rgba(255,92,108,.3)" }}>
                  {(results.immediateActions||[]).length}
                </span>
              )}
            </div>
            {results ? (results.immediateActions||[]).map((r,i) => <RecItem key={i} item={r} type="imm" />) : <div style={{ fontSize:12, color:C.muted, textAlign:"center", padding:10 }}>Run analysis to generate recommendations</div>}
          </div>

          {/* Urgent workup */}
          <div style={{ padding:"12px 14px", borderBottom:`1px solid ${C.border}` }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, color:C.dim, letterSpacing:".12em", marginBottom:9 }}>🕐 URGENT WORKUP</div>
            {results ? (results.urgentWorkup||[]).map((r,i) => <RecItem key={i} item={r} type="urg" />) : <div style={{ fontSize:12, color:C.muted, textAlign:"center", padding:10 }}>—</div>}
          </div>

          {/* Guidelines */}
          <div style={{ padding:"12px 14px", borderBottom:`1px solid ${C.border}` }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, color:C.dim, letterSpacing:".12em", marginBottom:9 }}>📚 GUIDELINE REFERENCES</div>
            {results ? (results.guidelines||[]).map((g,i) => <RecItem key={i} item={g} type="rou" />) : <div style={{ fontSize:12, color:C.muted, textAlign:"center", padding:10 }}>—</div>}
          </div>

          {/* Timing targets */}
          <div style={{ padding:"12px 14px" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, color:C.dim, letterSpacing:".12em", marginBottom:9 }}>⏱ TIME-TO-TREATMENT TARGETS</div>
            {results ? (results.timingTargets||[]).map((t, i) => (
              <div key={i} style={{
                display:"flex", justifyContent:"space-between", alignItems:"center",
                padding:"7px 10px", borderRadius:8, marginBottom:6,
                background: t.critical ? "rgba(255,92,108,.06)" : "rgba(245,166,35,.05)",
                border: t.critical ? "1px solid rgba(255,92,108,.2)" : "1px solid rgba(245,166,35,.18)",
                animation:"slideIn .3s ease both",
              }}>
                <span style={{ fontSize:11, color:C.text }}>{t.target}</span>
                <span style={{
                  fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:7,
                  background: t.critical ? "rgba(255,92,108,.14)" : "rgba(245,166,35,.14)",
                  color: t.critical ? C.red : C.amber,
                  border: t.critical ? "1px solid rgba(255,92,108,.3)" : "1px solid rgba(245,166,35,.3)",
                }}>{t.goal}</span>
              </div>
            )) : <div style={{ fontSize:12, color:C.muted, textAlign:"center", padding:10 }}>—</div>}
          </div>
        </div>
      </div>

      {/* Toasts */}
      <div style={{ position:"fixed", bottom:20, right:20, display:"flex", flexDirection:"column", gap:7, zIndex:999 }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            padding:"10px 15px", borderRadius:10, fontSize:13, backdropFilter:"blur(8px)", animation:"fadeUp .2s ease",
            background: t.type==='s'?"rgba(46,204,113,.12)":t.type==='e'?"rgba(255,92,108,.12)":"rgba(74,144,217,.12)",
            border: `1px solid ${t.type==='s'?"rgba(46,204,113,.4)":t.type==='e'?"rgba(255,92,108,.4)":"rgba(74,144,217,.4)"}`,
            color: t.type==='s'?C.green:t.type==='e'?C.red:C.blue,
          }}>{t.msg}</div>
        ))}
      </div>
    </div>
  );
}