// ECGAIInterpreter.jsx
// AI-powered ECG interpretation for Notrya ECG Hub.
// Physician describes ECG findings in plain text -> AI returns structured
// clinical interpretation with differential, actions, and guideline context.
// Patient context injected from NPI props (demo, vitals, cc, medications, pmhSelected).

import { useState, useCallback, useMemo } from "react";
import { base44 } from "@/api/base44Client";

(() => {
  if (typeof document === "undefined") return;
  if (document.getElementById("ecgai-style")) return;
  const s = document.createElement("style"); s.id = "ecgai-style";
  s.textContent = `@keyframes ecgai-in{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}.ecgai-in{animation:ecgai-in .2s ease forwards;}`;
  document.head.appendChild(s);
})();

const T = {
  bg:"#050f1e", txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0", red:"#ff4444",
};

function buildPatientCtx(demo, vitals, cc, medications, pmhSelected) {
  const lines = [];
  if (demo?.age || demo?.sex) lines.push(`${demo?.age || ""}yo ${demo?.sex || ""}`.trim());
  if (cc?.text)               lines.push(`CC: ${cc.text}`);
  const pmh = (pmhSelected || []).slice(0, 5);
  if (pmh.length)             lines.push(`PMH: ${pmh.join(", ")}`);
  const meds = (medications || []).map(m => typeof m === "string" ? m : m.name || "").filter(Boolean).slice(0, 5);
  if (meds.length)            lines.push(`Meds: ${meds.join(", ")}`);
  const vs = [];
  if (vitals?.hr)   vs.push(`HR ${vitals.hr}`);
  if (vitals?.bp)   vs.push(`BP ${vitals.bp}`);
  if (vitals?.spo2) vs.push(`SpO2 ${vitals.spo2}%`);
  if (vs.length)    lines.push(`Vitals: ${vs.join("  ")}`);
  return lines.join("\n");
}

function buildPrompt(findings, ctx) {
  return `You are a senior emergency cardiologist providing real-time ECG interpretation for an EM physician at the bedside.

PATIENT CONTEXT:
${ctx || "No patient context provided"}

ECG FINDINGS AS DESCRIBED BY PHYSICIAN:
${findings}

Provide a structured clinical interpretation. Respond ONLY with valid JSON, no markdown fences:
{
  "overall_pattern": "One sentence: dominant ECG pattern and its clinical significance",
  "stemi_equivalent": false,
  "cath_activation": "no",
  "key_findings": ["specific finding 1", "finding 2", "finding 3"],
  "differential": [
    {"diagnosis": "Specific diagnosis", "probability": "high | moderate | consider", "ecg_support": "Which findings support this"}
  ],
  "immediate_actions": ["Actionable bedside step 1", "step 2", "step 3"],
  "serial_ecg": "yes or no -- with specific reason",
  "guideline_note": "Most relevant 2025 ACC/AHA or 2023 AF Guideline recommendation for this pattern",
  "pearl": "One high-yield clinical pearl specific to this pattern that reduces mortality or missed diagnosis"
}

Rules: stemi_equivalent true only for confirmed STEMI, posterior STEMI, De Winter, Wellens, or aVR elevation. cath_activation = "yes", "no", or "consider". Be specific and actionable.`;
}

const RESULT_SCHEMA = {
  type: "object",
  required: ["overall_pattern","stemi_equivalent","cath_activation","key_findings","differential","immediate_actions","serial_ecg","guideline_note","pearl"],
  properties: {
    overall_pattern:    { type: "string" },
    stemi_equivalent:   { type: "boolean" },
    cath_activation:    { type: "string" },
    key_findings:       { type: "array", items: { type: "string" } },
    differential: {
      type: "array",
      items: {
        type: "object",
        properties: {
          diagnosis:   { type: "string" },
          probability: { type: "string" },
          ecg_support: { type: "string" },
        },
      },
    },
    immediate_actions:  { type: "array", items: { type: "string" } },
    serial_ecg:         { type: "string" },
    guideline_note:     { type: "string" },
    pearl:              { type: "string" },
  },
};

function AIResult({ result }) {
  if (!result) return null;
  const pc = p => p === "high" ? T.coral : p === "moderate" ? T.orange : T.blue;

  return (
    <div className="ecgai-in">
      {result.stemi_equivalent && (
        <div style={{padding:"10px 14px",borderRadius:9,marginBottom:10,
          background:"rgba(255,68,68,0.12)",border:"2px solid rgba(255,68,68,0.5)"}}>
          <div style={{fontFamily:"JetBrains Mono",fontSize:10,fontWeight:700,color:T.red,
            letterSpacing:2,textTransform:"uppercase",marginBottom:3}}>
            STEMI Equivalent Detected
          </div>
          <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt2}}>
            Cath lab activation:
            <strong style={{color:result.cath_activation==="yes"?T.red:T.orange,marginLeft:6}}>
              {(result.cath_activation || "").toUpperCase()}
            </strong>
          </div>
        </div>
      )}

      <div style={{padding:"10px 13px",borderRadius:9,marginBottom:10,
        background:"rgba(0,229,192,0.08)",border:"1px solid rgba(0,229,192,0.3)"}}>
        <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.teal,
          letterSpacing:1.5,textTransform:"uppercase",marginBottom:4}}>Overall Pattern</div>
        <div style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:15,
          color:T.txt,lineHeight:1.4}}>{result.overall_pattern}</div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
        {result.key_findings?.length > 0 && (
          <div style={{padding:"9px 11px",borderRadius:8,
            background:"rgba(8,22,40,0.6)",border:"1px solid rgba(42,79,122,0.4)"}}>
            <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.txt4,
              letterSpacing:1.5,textTransform:"uppercase",marginBottom:7}}>Key Findings</div>
            {result.key_findings.map((f,i) => (
              <div key={i} style={{display:"flex",gap:6,alignItems:"flex-start",marginBottom:4}}>
                <span style={{color:T.teal,fontSize:8,marginTop:3,flexShrink:0}}>&#9658;</span>
                <span style={{fontFamily:"DM Sans",fontSize:11,color:T.txt2,lineHeight:1.4}}>{f}</span>
              </div>
            ))}
          </div>
        )}
        {result.immediate_actions?.length > 0 && (
          <div style={{padding:"9px 11px",borderRadius:8,
            background:"rgba(0,229,192,0.06)",border:"1px solid rgba(0,229,192,0.2)"}}>
            <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.teal,
              letterSpacing:1.5,textTransform:"uppercase",marginBottom:7}}>Immediate Actions</div>
            {result.immediate_actions.map((a,i) => (
              <div key={i} style={{display:"flex",gap:5,alignItems:"flex-start",marginBottom:4}}>
                <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.teal,
                  flexShrink:0,minWidth:16}}>{i+1}.</span>
                <span style={{fontFamily:"DM Sans",fontSize:11,color:T.txt2,lineHeight:1.4}}>{a}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {result.differential?.length > 0 && (
        <div style={{marginBottom:10}}>
          <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.txt4,
            letterSpacing:1.5,textTransform:"uppercase",marginBottom:7}}>Differential</div>
          {result.differential.map((d,i) => (
            <div key={i} style={{padding:"8px 10px",borderRadius:8,marginBottom:5,
              background:"rgba(8,22,40,0.55)",border:"1px solid rgba(26,53,85,0.4)"}}>
              <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3}}>
                <span style={{fontFamily:"Playfair Display",fontWeight:700,
                  fontSize:12,color:T.txt}}>{d.diagnosis}</span>
                <span style={{fontFamily:"JetBrains Mono",fontSize:7,fontWeight:700,
                  color:pc(d.probability),background:`${pc(d.probability)}12`,
                  border:`1px solid ${pc(d.probability)}33`,borderRadius:4,
                  padding:"1px 6px",letterSpacing:1,textTransform:"uppercase"}}>
                  {d.probability}
                </span>
              </div>
              <div style={{fontFamily:"DM Sans",fontSize:10,color:T.txt4}}>{d.ecg_support}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
        {result.serial_ecg && (
          <div style={{padding:"9px 11px",borderRadius:8,
            background:"rgba(245,200,66,0.06)",border:"1px solid rgba(245,200,66,0.2)"}}>
            <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.gold,
              letterSpacing:1.5,textTransform:"uppercase",marginBottom:4}}>Serial ECG</div>
            <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt2,lineHeight:1.4}}>
              {result.serial_ecg}
            </div>
          </div>
        )}
        {result.guideline_note && (
          <div style={{padding:"9px 11px",borderRadius:8,
            background:"rgba(59,158,255,0.06)",border:"1px solid rgba(59,158,255,0.2)"}}>
            <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.blue,
              letterSpacing:1.5,textTransform:"uppercase",marginBottom:4}}>Guideline</div>
            <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt2,lineHeight:1.4}}>
              {result.guideline_note}
            </div>
          </div>
        )}
      </div>

      {result.pearl && (
        <div style={{padding:"8px 11px",borderRadius:8,
          background:"rgba(155,109,255,0.07)",border:"1px solid rgba(155,109,255,0.25)"}}>
          <span style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.purple,
            letterSpacing:1,textTransform:"uppercase"}}>Pearl: </span>
          <span style={{fontFamily:"DM Sans",fontSize:11,color:T.txt2}}>{result.pearl}</span>
        </div>
      )}
    </div>
  );
}

export default function ECGAIInterpreter({
  embedded = false, onBack,
  demo, vitals, cc, medications, pmhSelected,
}) {
  const [findings, setFindings] = useState("");
  const [busy,     setBusy]     = useState(false);
  const [result,   setResult]   = useState(null);
  const [error,    setError]    = useState(null);
  const [copied,   setCopied]   = useState(false);

  const patCtx = useMemo(() =>
    buildPatientCtx(demo, vitals, cc, medications, pmhSelected),
    [demo, vitals, cc, medications, pmhSelected]);

  const handleInterpret = useCallback(async () => {
    if (!findings.trim()) return;
    setBusy(true); setError(null); setResult(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: buildPrompt(findings, patCtx),
        response_json_schema: RESULT_SCHEMA,
        model: "claude_sonnet_4_6",
      });
      setResult(res);
    } catch(e) {
      setError("Interpretation error: " + (e.message || "Check API connectivity"));
    } finally {
      setBusy(false);
    }
  }, [findings, patCtx]);

  const copyResult = useCallback(() => {
    if (!result) return;
    const lines = [
      "ECG AI INTERPRETATION -- " + new Date().toLocaleString(), "",
      "PATTERN: " + result.overall_pattern,
      result.stemi_equivalent ? "** STEMI EQUIVALENT -- CATH: " + (result.cath_activation || "").toUpperCase() + " **" : "",
      result.key_findings?.length ? "\nFINDINGS:\n" + result.key_findings.map(f => "  - " + f).join("\n") : "",
      result.differential?.length ? "\nDIFFERENTIAL:\n" + result.differential.map(d => `  - ${d.diagnosis} (${d.probability})`).join("\n") : "",
      result.immediate_actions?.length ? "\nACTIONS:\n" + result.immediate_actions.map((a,i) => `  ${i+1}. ${a}`).join("\n") : "",
      result.guideline_note ? "\nGUIDELINE: " + result.guideline_note : "",
      result.pearl ? "\nPEARL: " + result.pearl : "",
    ].filter(Boolean).join("\n");
    navigator.clipboard.writeText(lines).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); });
  }, [result]);

  return (
    <div style={{fontFamily:"DM Sans",
      background: embedded ? "transparent" : T.bg,
      minHeight:  embedded ? "auto" : "100vh",
      color: T.txt, padding: embedded ? "0" : "24px 16px"}}>

      {!embedded && onBack && (
        <button onClick={onBack} style={{marginBottom:16,padding:"6px 14px",borderRadius:8,
          border:"1px solid rgba(42,79,122,0.5)",background:"rgba(14,37,68,0.6)",
          color:T.txt3,fontFamily:"DM Sans",fontSize:12,fontWeight:600,cursor:"pointer"}}>
          Back to Hub
        </button>
      )}

      {embedded && (
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
          <span style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:15,color:T.teal}}>
            AI ECG Interpreter
          </span>
          <span style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.txt4,letterSpacing:1.5,
            textTransform:"uppercase",background:"rgba(0,229,192,0.1)",
            border:"1px solid rgba(0,229,192,0.25)",borderRadius:4,padding:"2px 7px"}}>
            Describe findings -- AI returns structured interpretation
          </span>
        </div>
      )}

      {patCtx && (
        <div style={{padding:"8px 12px",borderRadius:8,marginBottom:12,
          background:"rgba(59,158,255,0.07)",border:"1px solid rgba(59,158,255,0.2)",
          fontFamily:"JetBrains Mono",fontSize:9,color:T.txt3,lineHeight:1.7}}>
          <div style={{color:T.blue,letterSpacing:1,textTransform:"uppercase",
            fontSize:8,marginBottom:3}}>Patient Context</div>
          {patCtx}
        </div>
      )}

      <div style={{marginBottom:10}}>
        <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,
          letterSpacing:1,textTransform:"uppercase",marginBottom:6}}>
          Describe ECG Findings
        </div>
        <textarea value={findings} onChange={e => setFindings(e.target.value)} rows={5}
          placeholder={"Describe what you observe on the ECG...\nEx: Sinus tachycardia 110 bpm. Normal axis. PR 160ms. QRS narrow. 2mm STE in V2-V4 with reciprocal depression in II/III/aVF. No old ECG for comparison."}
          style={{width:"100%",resize:"vertical",boxSizing:"border-box",
            background:"rgba(14,37,68,0.75)",
            border:`1px solid ${findings ? "rgba(0,229,192,0.4)" : "rgba(42,79,122,0.35)"}`,
            borderRadius:8,padding:"9px 11px",outline:"none",
            fontFamily:"DM Sans",fontSize:12,color:T.txt,lineHeight:1.6}}/>
      </div>

      <div style={{display:"flex",gap:7,marginBottom:12}}>
        <button onClick={handleInterpret} disabled={busy || !findings.trim()}
          style={{flex:1,padding:"11px 0",borderRadius:10,
            cursor:busy||!findings.trim()?"not-allowed":"pointer",
            border:`1px solid ${!findings.trim()?"rgba(42,79,122,0.3)":"rgba(0,229,192,0.55)"}`,
            background:!findings.trim()
              ? "rgba(42,79,122,0.15)"
              : "linear-gradient(135deg,rgba(0,229,192,0.18),rgba(0,229,192,0.06))",
            color:!findings.trim()?T.txt4:T.teal,
            fontFamily:"DM Sans",fontWeight:700,fontSize:13,transition:"all .15s"}}>
          {busy ? "Interpreting..." : "Interpret ECG"}
        </button>
        {result && (
          <button onClick={copyResult}
            style={{padding:"11px 16px",borderRadius:10,cursor:"pointer",transition:"all .15s",
              border:`1px solid ${copied?"rgba(61,255,160,0.5)":"rgba(42,79,122,0.4)"}`,
              background:copied?"rgba(61,255,160,0.08)":"rgba(42,79,122,0.15)",
              color:copied?T.green:T.txt3,fontFamily:"DM Sans",fontWeight:600,fontSize:12}}>
            {copied ? "Copied" : "Copy"}
          </button>
        )}
        <button onClick={() => { setFindings(""); setResult(null); setError(null); }}
          style={{padding:"11px 12px",borderRadius:10,cursor:"pointer",
            border:"1px solid rgba(42,79,122,0.35)",background:"transparent",
            color:T.txt4,fontFamily:"JetBrains Mono",fontSize:8,
            letterSpacing:1,textTransform:"uppercase"}}>
          Clear
        </button>
      </div>

      {error && (
        <div style={{padding:"8px 12px",borderRadius:8,marginBottom:10,
          background:"rgba(255,107,107,0.08)",border:"1px solid rgba(255,107,107,0.3)",
          fontFamily:"DM Sans",fontSize:11,color:T.coral}}>{error}</div>
      )}

      {result && <AIResult result={result}/>}

      {!embedded && (
        <div style={{textAlign:"center",paddingTop:24,fontFamily:"JetBrains Mono",
          fontSize:8,color:T.txt4,letterSpacing:1.5}}>
          NOTRYA AI ECG INTERPRETER -- PHYSICIAN JUDGMENT REQUIRED -- NOT A SUBSTITUTE FOR CLINICAL ASSESSMENT
        </div>
      )}
    </div>
  );
}