// ECGAIInterpreter.jsx
// Claude Vision-powered 12-lead ECG interpretation for Notrya ECGHub
// Place at: @/components/ecg/ECGAIInterpreter.jsx
//
// Exports:
//   default  ECGAIInterpreter  — full interpreter panel (used in ECGHub AI tab)
//   named    PMcardioButton    — standalone deep link button for any hub
//
// Constraints: no form, no localStorage, straight quotes only, single react import

import { useState, useRef, useCallback } from "react";

// ── Font injection (idempotent) ─────────────────────────────────────────────
if (typeof document !== "undefined" && !document.getElementById("ecgai-fonts")) {
  const l = document.createElement("link");
  l.id = "ecgai-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "ecgai-css";
  s.textContent = `
    @keyframes ecgai-fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
    @keyframes ecgai-scan{
      0%{top:2%;opacity:1}44%{top:92%;opacity:1}
      50%{top:92%;opacity:0}51%{top:2%;opacity:0}55%{top:2%;opacity:1}100%{top:2%;opacity:1}}
    @keyframes ecgai-pulse{0%,100%{opacity:.45;transform:scale(.92)}50%{opacity:1;transform:scale(1)}}
    @keyframes ecgai-shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
    .ecgai-fade{animation:ecgai-fade .22s ease forwards}
    .ecgai-scan-line{position:absolute;left:4px;right:4px;height:1.5px;
      background:linear-gradient(90deg,transparent,#00e5c0,transparent);
      animation:ecgai-scan 2s ease-in-out infinite;pointer-events:none;border-radius:1px;}
    .ecgai-dot{animation:ecgai-pulse 1.3s ease-in-out infinite}
  `;
  document.head.appendChild(s);
}

// ── Tokens — matches Notrya palette ────────────────────────────────────────
const T = {
  bg:"#050f1e", card:"rgba(14,28,58,0.94)", txt:"#e8f0fe", txt2:"#8aaccc",
  txt3:"#4a6a8a", txt4:"#638ab5", border:"rgba(35,70,115,0.65)",
  teal:"#00e5c0", coral:"#ff6b6b", gold:"#f5c842", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", red:"#ff4444", green:"#3dffa0",
};
const FF = {
  mono:"'JetBrains Mono',monospace",
  sans:"'DM Sans',sans-serif",
  serif:"'Playfair Display',serif",
};
const glass = {
  backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",
  background:"rgba(8,22,40,0.75)",border:"1px solid rgba(42,79,122,0.35)",borderRadius:14,
};

// ── ECG interpretation system prompt ───────────────────────────────────────
const ECG_SYSTEM = `You are a board-certified cardiac electrophysiologist performing a structured 12-lead ECG interpretation.
Analyze the ECG image provided and return ONLY a valid JSON object in the exact schema below.
Use null for any value you cannot determine. Do not add text outside the JSON.

{
  "rate": <integer bpm or null>,
  "rhythm": "<primary rhythm name>",
  "regular": <true|false>,
  "p_waves": "<P wave morphology and P:QRS relationship>",
  "pr_ms": <integer ms or null>,
  "qrs_ms": <integer ms or null>,
  "qtc_ms": <integer ms or null>,
  "qtc_method": "<Bazett|Fridericia|estimated>",
  "axis": "<degrees or quadrant description>",
  "st": {
    "elevation": "<leads with STE and magnitude, or None>",
    "depression": "<leads with STD and magnitude, or None>",
    "morphology": "<concave|convex|flat|downsloping|mixed — describe pattern>"
  },
  "t_waves": "<T wave description across key leads — note hyperacute, inverted, biphasic, or peaked>",
  "qrs_morphology": "<RBBB/LBBB/delta wave/LVH/RVH/Q waves/fragmentation/epsilon wave or Normal>",
  "high_risk": [
    "<list any: Classic STEMI | Posterior STEMI | De Winter | Wellens A | Wellens B | aVR Elevation | Sgarbossa+ | Brugada Type 1 | Brugada Type 2 | WPW | Long QT | Hyperkalemia pattern | TCA toxicity | ARVC-epsilon | VT | Complete heart block | None>"
  ],
  "impression": "<2-3 sentence clinical impression>",
  "omi_note": "<one sentence on whether OMI can be excluded — always flag if PMcardio/Queen of Hearts review is warranted>",
  "confidence": "<high|moderate|low>",
  "image_quality": "<good|degraded|poor>",
  "urgency": "<emergent|urgent|routine>"
}`;

// ── PMcardio deep link button (exported for reuse) ─────────────────────────
export function PMcardioButton({ compact = false }) {
  const open = () => {
    const ios     = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const android = /Android/.test(navigator.userAgent);
    if (ios) {
      window.location.href = "pmcardio://";
      setTimeout(() => { window.location.href = "https://apps.apple.com/us/app/pmcardio-for-individuals/id1640037895"; }, 800);
    } else if (android) {
      window.location.href = "intent://open#Intent;scheme=pmcardio;package=com.powerfulmedical.pmcardio;end";
      setTimeout(() => { window.location.href = "https://play.google.com/store/apps/details?id=com.powerfulmedical.pmcardio"; }, 800);
    } else {
      window.open("https://www.powerfulmedical.com/", "_blank");
    }
  };

  if (compact) {
    return (
      <button onClick={open}
        style={{ display:"flex", alignItems:"center", gap:8, width:"100%",
          padding:"8px 12px", borderRadius:8, cursor:"pointer",
          border:"1.5px solid rgba(255,107,107,0.48)",
          background:"linear-gradient(135deg,rgba(255,107,107,0.13),rgba(255,107,107,0.04))",
          fontFamily:FF.sans, fontWeight:700, fontSize:12, color:T.coral }}>
        <span style={{ fontSize:15 }}>{"\u2665"}</span>
        <span style={{ flex:1, textAlign:"left" }}>
          Open PMcardio — Queen of Hearts OMI analysis
        </span>
        <span style={{ fontFamily:FF.mono, fontSize:10, color:"rgba(255,107,107,0.55)" }}>{"\u2192"}</span>
      </button>
    );
  }

  return (
    <button onClick={open}
      style={{ display:"flex", alignItems:"center", gap:12, width:"100%",
        padding:"13px 16px", borderRadius:11, cursor:"pointer",
        border:"1.5px solid rgba(255,107,107,0.52)",
        background:"linear-gradient(135deg,rgba(255,107,107,0.13),rgba(255,107,107,0.04))" }}>
      <div style={{ width:40, height:40, borderRadius:10, flexShrink:0,
        background:"rgba(255,107,107,0.14)", border:"1px solid rgba(255,107,107,0.38)",
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:22, color:T.coral }}>{"\u2665"}</div>
      <div style={{ flex:1, textAlign:"left" }}>
        <div style={{ fontFamily:FF.sans, fontWeight:700, fontSize:13, color:T.coral }}>
          Open in PMcardio
        </div>
        <div style={{ fontFamily:FF.sans, fontSize:11, color:T.txt3, marginTop:2 }}>
          Queen of Hearts {"\u00b7"} OMI / STEMI-equivalent detection {"\u00b7"} CE-marked AI
        </div>
      </div>
      <div style={{ fontFamily:FF.mono, fontSize:12, color:"rgba(255,107,107,0.5)" }}>{"\u2192"}</div>
    </button>
  );
}

// ── Report sub-components ───────────────────────────────────────────────────
function Chip({ label, color }) {
  return (
    <span style={{ fontFamily:FF.mono, fontSize:9, letterSpacing:1,
      textTransform:"uppercase", padding:"2px 8px", borderRadius:5, fontWeight:700,
      color, background:`${color}18`, border:`1px solid ${color}44` }}>
      {label}
    </span>
  );
}

function MetricBox({ label, value, sub, color, wide }) {
  return (
    <div style={{ padding:"9px 11px", borderRadius:9,
      background:`${color || T.blue}09`, border:`1px solid ${color || T.blue}28`,
      flex: wide ? "1 1 100%" : "1 1 calc(50% - 4px)", minWidth:0 }}>
      <div style={{ fontFamily:FF.mono, fontSize:9, color:T.txt4,
        letterSpacing:.9, marginBottom:3, textTransform:"uppercase" }}>{label}</div>
      <div style={{ fontFamily:FF.mono, fontSize:15, fontWeight:700,
        color:color || T.blue, lineHeight:1.15 }}>{value ?? "--"}</div>
      {sub && <div style={{ fontFamily:FF.sans, fontSize:9.5, color:T.txt4, marginTop:2 }}>{sub}</div>}
    </div>
  );
}

function AlertRow({ text, color }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8,
      padding:"6px 10px", borderRadius:7, marginBottom:5,
      background:`${color}10`, border:`1px solid ${color}44` }}>
      <div className="ecgai-dot" style={{ width:7, height:7, borderRadius:"50%",
        background:color, flexShrink:0 }} />
      <span style={{ fontFamily:FF.sans, fontSize:11.5, color, lineHeight:1.45 }}>{text}</span>
    </div>
  );
}

function Bul({ c, children }) {
  return (
    <div style={{ display:"flex", gap:7, alignItems:"flex-start", marginBottom:5 }}>
      <span style={{ color:c || T.teal, fontSize:8, marginTop:3, flexShrink:0 }}>{"\u25b8"}</span>
      <span style={{ fontFamily:FF.sans, fontSize:11.5, color:T.txt2, lineHeight:1.55 }}>{children}</span>
    </div>
  );
}

// ── Report card ─────────────────────────────────────────────────────────────
function ECGReport({ data }) {
  const urgColor = data.urgency === "emergent" ? T.coral
    : data.urgency === "urgent"   ? T.gold : T.teal;
  const confColor = data.confidence === "high" ? T.teal
    : data.confidence === "moderate" ? T.gold : T.txt4;

  const highRisk = (data.high_risk || []).filter(r => r && r !== "None");
  const qrsWide  = data.qrs_ms && parseInt(data.qrs_ms) > 120;
  const qtcHigh  = data.qtc_ms && parseInt(data.qtc_ms) >= 500;
  const qtcBorder = data.qtc_ms && parseInt(data.qtc_ms) >= 440 && parseInt(data.qtc_ms) < 500;

  return (
    <div className="ecgai-fade" style={{ marginTop:14 }}>
      {/* Urgency header */}
      <div style={{ padding:"10px 14px", borderRadius:"11px 11px 0 0",
        background:`linear-gradient(135deg,${urgColor}16,${urgColor}06)`,
        border:`1.5px solid ${urgColor}55`, borderBottom:"none",
        display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontFamily:FF.serif, fontSize:19, fontWeight:900, color:urgColor }}>
            {data.urgency === "emergent" ? "EMERGENT"
              : data.urgency === "urgent" ? "Urgent Review" : "Routine"}
          </div>
          <div style={{ fontFamily:FF.mono, fontSize:9, color:urgColor,
            letterSpacing:1.3, marginTop:2 }}>AI ECG INTERPRETATION {"\u00b7"} NOTRYA</div>
        </div>
        <div style={{ textAlign:"right", display:"flex", flexDirection:"column", gap:5 }}>
          <Chip label={`Confidence: ${data.confidence || "--"}`} color={confColor} />
          {data.image_quality && data.image_quality !== "good" && (
            <Chip label={`Image: ${data.image_quality}`} color={T.gold} />
          )}
        </div>
      </div>

      <div style={{ padding:"13px 14px 16px", borderRadius:"0 0 11px 11px",
        background:T.card, border:`1.5px solid ${urgColor}55`, borderTop:"none" }}>

        {/* High-risk patterns */}
        {highRisk.length > 0 && (
          <div style={{ marginBottom:13 }}>
            <div style={{ fontFamily:FF.mono, fontSize:9, color:T.coral,
              letterSpacing:1.4, textTransform:"uppercase", marginBottom:7,
              paddingBottom:4, borderBottom:`1px solid ${T.coral}22` }}>
              {"\u26A0"} High-Risk Patterns
            </div>
            {highRisk.map((p, i) => <AlertRow key={i} text={p} color={T.coral} />)}
          </div>
        )}

        {/* Core measurements */}
        <div style={{ marginBottom:12 }}>
          <div style={{ fontFamily:FF.mono, fontSize:9, color:T.blue,
            letterSpacing:1.4, textTransform:"uppercase", marginBottom:7,
            paddingBottom:4, borderBottom:`1px solid ${T.blue}22` }}>
            Measurements
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
            <MetricBox label="Rate" value={data.rate ? `${data.rate} bpm` : null} color={T.blue} />
            <MetricBox label="Rhythm" value={data.rhythm} color={data.regular === false ? T.coral : T.blue} wide />
            <MetricBox label="PR"  value={data.pr_ms  ? `${data.pr_ms} ms`  : null} color={T.blue} />
            <MetricBox label="QRS" value={data.qrs_ms ? `${data.qrs_ms} ms` : null}
              color={qrsWide ? T.gold : T.blue}
              sub={qrsWide ? "Wide — assess morphology" : null} />
            <MetricBox label="QTc" value={data.qtc_ms ? `${data.qtc_ms} ms` : null}
              color={qtcHigh ? T.coral : qtcBorder ? T.gold : T.blue}
              sub={data.qtc_ms ? `${data.qtc_method || "Bazett"}${qtcHigh ? " \u2014 HIGH RISK" : qtcBorder ? " \u2014 borderline" : ""}` : null} />
            <MetricBox label="Axis" value={data.axis} color={T.blue} />
          </div>
        </div>

        {/* ST segments */}
        {(data.st?.elevation !== "None" || data.st?.depression !== "None") && (
          <div style={{ marginBottom:12 }}>
            <div style={{ fontFamily:FF.mono, fontSize:9, color:T.orange,
              letterSpacing:1.4, textTransform:"uppercase", marginBottom:7,
              paddingBottom:4, borderBottom:`1px solid ${T.orange}22` }}>
              ST Segments
            </div>
            {data.st?.elevation && data.st.elevation !== "None" && (
              <AlertRow text={`Elevation: ${data.st.elevation}`} color={T.coral} />
            )}
            {data.st?.depression && data.st.depression !== "None" && (
              <AlertRow text={`Depression: ${data.st.depression}`} color={T.orange} />
            )}
            {data.st?.morphology && (
              <div style={{ fontFamily:FF.sans, fontSize:11, color:T.txt2,
                lineHeight:1.55, marginTop:5 }}>{data.st.morphology}</div>
            )}
          </div>
        )}

        {/* Waveform analysis */}
        <div style={{ marginBottom:12 }}>
          <div style={{ fontFamily:FF.mono, fontSize:9, color:T.purple,
            letterSpacing:1.4, textTransform:"uppercase", marginBottom:7,
            paddingBottom:4, borderBottom:`1px solid ${T.purple}22` }}>
            Waveform Analysis
          </div>
          {data.qrs_morphology && (
            <Bul c={T.purple}><strong style={{ color:T.txt4, fontFamily:FF.mono,
              fontSize:9 }}>QRS: </strong>{data.qrs_morphology}</Bul>
          )}
          {data.p_waves && (
            <Bul c={T.purple}><strong style={{ color:T.txt4, fontFamily:FF.mono,
              fontSize:9 }}>P waves: </strong>{data.p_waves}</Bul>
          )}
          {data.t_waves && (
            <Bul c={T.purple}><strong style={{ color:T.txt4, fontFamily:FF.mono,
              fontSize:9 }}>T waves: </strong>{data.t_waves}</Bul>
          )}
        </div>

        {/* Impression */}
        <div style={{ marginBottom:12, padding:"10px 13px", borderRadius:9,
          background:"rgba(59,158,255,0.06)", border:"1px solid rgba(59,158,255,0.22)" }}>
          <div style={{ fontFamily:FF.mono, fontSize:9, color:T.blue,
            letterSpacing:1.4, textTransform:"uppercase", marginBottom:6 }}>
            Clinical Impression
          </div>
          <div style={{ fontFamily:FF.sans, fontSize:12.5, color:T.txt,
            lineHeight:1.65 }}>{data.impression}</div>
        </div>

        {/* OMI caveat + PMcardio */}
        <div style={{ padding:"10px 13px", borderRadius:9, marginBottom:10,
          background:"rgba(255,107,107,0.06)", border:"1px solid rgba(255,107,107,0.28)" }}>
          <div style={{ fontFamily:FF.mono, fontSize:9, color:T.coral,
            letterSpacing:1.4, textTransform:"uppercase", marginBottom:5 }}>
            OMI / Occlusion Assessment Limitation
          </div>
          <div style={{ fontFamily:FF.sans, fontSize:11, color:T.txt3,
            lineHeight:1.55, marginBottom:9 }}>
            {data.omi_note || "Claude Vision is not validated for occlusion MI detection. Queen of Hearts (PMcardio) uses deep neural networks trained on angiographic outcomes and significantly outperforms both LLMs and physicians for OMI identification."}
          </div>
          <PMcardioButton compact />
        </div>

        {/* Disclaimer */}
        <div style={{ fontFamily:FF.mono, fontSize:8.5, color:T.txt4,
          letterSpacing:.7, lineHeight:1.55, textAlign:"center" }}>
          CLINICAL DECISION SUPPORT ONLY {"\u00b7"} NOT A DIAGNOSTIC DEVICE {"\u00b7"} PHYSICIAN JUDGMENT REQUIRED
          {"\u00b7"} AUTOMATED QTc INACCURATE IN ~30% OF ECGs {"\u00b7"} VERIFY ALL MEASUREMENTS MANUALLY
        </div>
      </div>
    </div>
  );
}

// ── Loading animation ───────────────────────────────────────────────────────
function ScanningOverlay() {
  return (
    <div style={{ position:"absolute", inset:0, borderRadius:10,
      background:"rgba(5,15,30,0.65)", display:"flex",
      flexDirection:"column", alignItems:"center", justifyContent:"center", gap:10 }}>
      <div className="ecgai-scan-line" />
      <div style={{ fontFamily:FF.mono, fontSize:11, color:T.teal,
        letterSpacing:2, textTransform:"uppercase" }}>Analyzing ECG</div>
      <div style={{ display:"flex", gap:5 }}>
        {[0,1,2].map(i => (
          <div key={i} className="ecgai-dot"
            style={{ width:6, height:6, borderRadius:"50%", background:T.teal,
              animationDelay:`${i * 0.28}s` }} />
        ))}
      </div>
    </div>
  );
}

// ── Main ECGAIInterpreter component ─────────────────────────────────────────
export default function ECGAIInterpreter({ embedded = false, vitals, cc, medications, pmhSelected }) {
  const [imageB64,  setImageB64]  = useState(null);
  const [imageUrl,  setImageUrl]  = useState(null);
  const [status,    setStatus]    = useState("idle");  // idle | loading | done | error
  const [report,    setReport]    = useState(null);
  const [errorMsg,  setErrorMsg]  = useState("");
  const [dragOver,  setDragOver]  = useState(false);
  const fileRef = useRef(null);

  // Build context string from NPI props if available
  const buildContext = useCallback(() => {
    const parts = [];
    if (cc)          parts.push(`Chief complaint: ${cc}`);
    if (vitals) {
      const vParts = [];
      if (vitals.hr)   vParts.push(`HR ${vitals.hr}`);
      if (vitals.bp)   vParts.push(`BP ${vitals.bp}`);
      if (vitals.spo2) vParts.push(`SpO2 ${vitals.spo2}`);
      if (vParts.length) parts.push(`Vitals: ${vParts.join(", ")}`);
    }
    if (medications?.length) parts.push(`Medications: ${medications.slice(0,5).join(", ")}`);
    if (pmhSelected?.length) parts.push(`PMH: ${pmhSelected.slice(0,5).join(", ")}`);
    return parts.length ? `\n\nPatient context:\n${parts.join("\n")}` : "";
  }, [cc, vitals, medications, pmhSelected]);

  const processFile = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) return;
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setReport(null); setStatus("idle"); setErrorMsg("");
    // Compress before encoding: resize to max 1600px, 0.85 quality
    const img = new window.Image();
    img.onload = () => {
      const MAX = 1600;
      let w = img.naturalWidth, h = img.naturalHeight;
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
        else        { w = Math.round(w * MAX / h); h = MAX; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      const compressed = canvas.toDataURL("image/jpeg", 0.85);
      setImageB64(compressed.split(",")[1]);
    };
    img.onerror = () => {
      // Fallback: use raw file if canvas fails
      const reader = new FileReader();
      reader.onload = e => setImageB64(e.target.result.split(",")[1]);
      reader.readAsDataURL(file);
    };
    img.src = url;
  }, [imageUrl]);

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false);
    processFile(e.dataTransfer.files?.[0]);
  }, [processFile]);

  const handleAnalyze = async () => {
    if (!imageB64) return;
    setStatus("loading"); setReport(null); setErrorMsg("");
    try {
      const context = buildContext();
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: ECG_SYSTEM,
          messages: [{
            role:"user",
            content:[
              { type:"image", source:{ type:"base64", media_type:"image/jpeg", data:imageB64 } },
              { type:"text",  text:`Interpret this 12-lead ECG. Return only the JSON object.${context}` },
            ],
          }],
        }),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      const raw = (data.content?.find(b => b.type === "text")?.text || "").trim();
      const clean = raw.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(clean);
      setReport(parsed);
      setStatus("done");
    } catch (err) {
      console.error("ECG AI error:", err);
      const msg = err.message?.includes("JSON")
        ? "Could not parse AI response. Try a clearer ECG image or retry."
        : `Analysis failed: ${err.message}`;
      setErrorMsg(msg);
      setStatus("error");
    }
  };

  const handleClear = () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageB64(null); setImageUrl(null); setReport(null);
    setStatus("idle"); setErrorMsg("");
  };

  return (
    <div style={{ fontFamily:FF.sans }}>
      {/* Section intro */}
      <div style={{ marginBottom:12, padding:"10px 14px", borderRadius:10,
        ...glass, border:"1px solid rgba(59,158,255,0.3)" }}>
        <div style={{ display:"flex", alignItems:"center",
          justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
          <div>
            <div style={{ fontFamily:FF.serif, fontSize:15, fontWeight:700,
              color:T.blue, marginBottom:3 }}>Claude Vision ECG Interpreter</div>
            <div style={{ fontFamily:FF.sans, fontSize:11, color:T.txt3, lineHeight:1.5 }}>
              Photograph or upload any 12-lead ECG. Claude Vision provides structured
              rate/rhythm/interval analysis, ST assessment, and pattern recognition.
              Not validated for OMI detection — use PMcardio Queen of Hearts for that.
            </div>
          </div>
          <div style={{ display:"flex", gap:6, flexShrink:0 }}>
            {[
              { label:"Rate/Rhythm", color:T.blue },
              { label:"Intervals",   color:T.purple },
              { label:"ST Segments", color:T.orange },
              { label:"Pattern Dx",  color:T.coral },
            ].map(b => (
              <span key={b.label} style={{ fontFamily:FF.mono, fontSize:8,
                letterSpacing:.8, padding:"2px 8px", borderRadius:5,
                color:b.color, background:`${b.color}12`,
                border:`1px solid ${b.color}30` }}>{b.label}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Upload zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !imageUrl && fileRef.current?.click()}
        style={{ position:"relative", borderRadius:12, overflow:"hidden",
          cursor:imageUrl ? "default" : "pointer",
          border:`1.5px dashed ${dragOver ? T.teal : imageUrl ? "rgba(35,70,115,0.55)" : "rgba(59,158,255,0.38)"}`,
          background:dragOver ? "rgba(0,229,192,0.06)" : "rgba(5,13,32,0.6)",
          transition:"border-color .15s, background .15s",
          minHeight: imageUrl ? "auto" : 140 }}>

        {!imageUrl && (
          <div style={{ padding:"32px 20px", textAlign:"center" }}>
            <div style={{ fontSize:36, marginBottom:10 }}>{"\uD83D\uDCF7"}</div>
            <div style={{ fontFamily:FF.sans, fontWeight:600, fontSize:14,
              color:T.txt2, marginBottom:5 }}>
              Photograph or upload a 12-lead ECG
            </div>
            <div style={{ fontFamily:FF.sans, fontSize:11, color:T.txt4, lineHeight:1.5 }}>
              Drag & drop {"\u00b7"} tap to browse {"\u00b7"} take a photo<br/>
              Paper printout, monitor screen, or digital image — any format
            </div>
          </div>
        )}

        {imageUrl && (
          <div style={{ position:"relative" }}>
            <img src={imageUrl} alt="ECG"
              style={{ width:"100%", display:"block", borderRadius:10,
                maxHeight:340, objectFit:"contain",
                background:"rgba(5,10,20,0.95)" }} />
            {status === "loading" && <ScanningOverlay />}
          </div>
        )}

        <input ref={fileRef} type="file" accept="image/*" capture="environment"
          style={{ display:"none" }}
          onChange={e => processFile(e.target.files?.[0])} />
      </div>

      {/* Context hint if NPI data available */}
      {(cc || vitals) && imageB64 && (
        <div style={{ marginTop:7, padding:"6px 11px", borderRadius:7,
          background:"rgba(0,229,192,0.07)", border:"1px solid rgba(0,229,192,0.25)",
          fontFamily:FF.mono, fontSize:9, color:T.teal, letterSpacing:.8 }}>
          Patient context will be included: {[cc, vitals?.hr && `HR ${vitals.hr}`, vitals?.bp && `BP ${vitals.bp}`].filter(Boolean).join(" \u00b7 ")}
        </div>
      )}

      {/* Action buttons */}
      {imageUrl && (
        <div style={{ display:"flex", gap:8, marginTop:10 }}>
          <button onClick={handleAnalyze} disabled={status === "loading" || !imageB64}
            style={{ flex:1, minHeight:46, borderRadius:10, cursor:status === "loading" ? "wait" : "pointer",
              fontFamily:FF.sans, fontWeight:700, fontSize:13,
              border:`1.5px solid ${T.blue}66`,
              background:status === "loading"
                ? "rgba(59,158,255,0.07)"
                : "linear-gradient(135deg,rgba(59,158,255,0.18),rgba(59,158,255,0.06))",
              color:status === "loading" ? T.txt4 : T.blue,
              transition:"all .15s" }}>
            {status === "loading" ? "Analyzing\u2026" : status === "done" ? "Re-analyze" : "Analyze ECG"}
          </button>
          <button onClick={() => fileRef.current?.click()}
            style={{ padding:"0 16px", minHeight:46, borderRadius:10, cursor:"pointer",
              fontFamily:FF.sans, fontWeight:600, fontSize:12,
              border:"1px solid rgba(35,70,115,0.65)",
              background:"rgba(14,28,58,0.85)", color:T.txt4 }}>
            Change
          </button>
          {status === "done" && (
            <button onClick={handleClear}
              style={{ padding:"0 14px", minHeight:46, borderRadius:10, cursor:"pointer",
                fontFamily:FF.sans, fontWeight:600, fontSize:12,
                border:"1px solid rgba(255,107,107,0.35)",
                background:"rgba(255,107,107,0.06)", color:T.coral }}>
              Clear
            </button>
          )}
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <div style={{ marginTop:10, padding:"10px 13px", borderRadius:9,
          background:"rgba(255,68,68,0.08)", border:"1px solid rgba(255,68,68,0.3)",
          fontFamily:FF.sans, fontSize:11, color:T.coral, lineHeight:1.5 }}>
          {errorMsg}
        </div>
      )}

      {/* Report */}
      {status === "done" && report && <ECGReport data={report} />}

      {/* PMcardio standalone button (always visible at bottom) */}
      {!imageUrl && (
        <div style={{ marginTop:14 }}>
          <div style={{ fontFamily:FF.mono, fontSize:9, color:T.txt4,
            letterSpacing:1.2, textTransform:"uppercase",
            marginBottom:7 }}>Also recommended for OMI detection</div>
          <PMcardioButton />
        </div>
      )}
    </div>
  );
}