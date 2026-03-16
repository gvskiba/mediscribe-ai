import { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";

const G = {
  navy:"#050f1e", slate:"#0b1d35", panel:"#0d2240", edge:"#162d4f",
  border:"#1e3a5f", muted:"#2a4d72", dim:"#4a7299", text:"#c8ddf0",
  bright:"#e8f4ff", teal:"#00d4bc", amber:"#f5a623", red:"#ff5c6c",
  green:"#2ecc71", purple:"#9b6dff", blue:"#4a90d9",
};
const F = {
  display:"'Playfair Display', serif",
  body:"'DM Sans', sans-serif",
  mono:"'JetBrains Mono', monospace",
};

const DEMO = [
  { id:1, speaker:"physician", text:"Good morning. What brings you in today?", ts:0 },
  { id:2, speaker:"patient",   text:"I've been having chest pain for two days. Pressure right in the middle.", ts:4 },
  { id:3, speaker:"physician", text:"On a scale of 0 to 10, how bad is the pain?", ts:12 },
  { id:4, speaker:"patient",   text:"About a 7. Gets worse walking up stairs.", ts:16 },
  { id:5, speaker:"physician", text:"Does it radiate to your arm, jaw, or back?", ts:24 },
  { id:6, speaker:"patient",   text:"Yes, into my left arm. And I've been sweating a lot.", ts:29 },
  { id:7, speaker:"physician", text:"Any shortness of breath or nausea?", ts:36 },
  { id:8, speaker:"patient",   text:"A little nausea. Not much trouble breathing.", ts:40 },
  { id:9, speaker:"physician", text:"Any history of heart disease, hypertension, or diabetes?", ts:46 },
  { id:10, speaker:"patient",  text:"High blood pressure. On lisinopril 3 years. No diabetes.", ts:51 },
  { id:11, speaker:"physician", text:"Family history of heart disease?", ts:59 },
  { id:12, speaker:"patient",  text:"Father had a heart attack at 58. I'm 54 — worries me.", ts:63 },
  { id:13, speaker:"physician", text:"Do you smoke or drink?", ts:70 },
  { id:14, speaker:"patient",  text:"Quit smoking 5 years ago, pack a day for 20 years. Drink socially.", ts:74 },
  { id:15, speaker:"physician", text:"I'll order an EKG and troponin now. Let me examine you.", ts:83 },
];

const fmtTime = s => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,"0")}`;

function parseSOAP(raw) {
  if (!raw) return { s:"", o:"", a:"", p:"" };
  const get = (head, next) => {
    const m = raw.match(new RegExp(`##?\\s*${head}\\s*\\n([\\s\\S]*?)(?=##?\\s*${next}|$)`,"i"));
    return m ? m[1].trim() : "";
  };
  return { s: get("SUBJECTIVE","OBJECTIVE"), o: get("OBJECTIVE","ASSESSMENT"), a: get("ASSESSMENT","PLAN"), p: get("PLAN","$$$") };
}

function Waveform({ active, color }) {
  const [bars, setBars] = useState(Array(24).fill(4));
  useEffect(() => {
    if (!active) { setBars(Array(24).fill(4)); return; }
    const iv = setInterval(() => setBars(b => b.map(() => Math.floor(Math.random()*22)+4)), 90);
    return () => clearInterval(iv);
  }, [active]);
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"2px", height:"28px" }}>
      {bars.map((h,i) => (
        <div key={i} style={{ width:"3px", borderRadius:"2px", height: active ? `${h}px` : "3px", background: active ? color : G.muted, transition:"height 0.08s ease" }} />
      ))}
    </div>
  );
}

export default function TranscriptionModal({ open, onClose, onApplyToNote }) {
  const [state, setState] = useState("idle");
  const [elapsed, setElapsed] = useState(0);
  const [transcript, setTranscript] = useState([]);
  const [soapRaw, setSoapRaw] = useState("");
  const [isAI, setIsAI] = useState(false);
  const [applying, setApplying] = useState(false);

  const timerRef = useRef(); const demoRef = useRef(); const genRef = useRef(); const endRef = useRef();

  useEffect(() => {
    if (state === "recording") timerRef.current = setInterval(() => setElapsed(t => t+1), 1000);
    else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [state]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:"smooth" }); }, [transcript]);

  useEffect(() => {
    if (transcript.length < 2 || state === "idle") return;
    clearTimeout(genRef.current);
    genRef.current = setTimeout(() => generateSOAP(transcript), 2800);
    return () => clearTimeout(genRef.current);
  }, [transcript]);

  const generateSOAP = async (txts) => {
    if (isAI || txts.length < 2) return;
    setIsAI(true);
    const lines = txts.map(t => `[${t.speaker === "physician" ? "MD" : "PT"}]: ${t.text}`).join("\n");
    const prompt = `You are Notrya AI, a clinical documentation assistant. Based on this live encounter transcript, write a structured SOAP note.

TRANSCRIPT:
${lines}

Generate a professional SOAP note with sections:
## SUBJECTIVE
## OBJECTIVE
## ASSESSMENT
## PLAN

Extract facts only from the transcript. Mark incomplete sections as "(in progress)". Be concise and use medical terminology. Respond ONLY with the SOAP note.`;
    try {
      const res = await base44.integrations.Core.InvokeLLM({ prompt });
      setSoapRaw(typeof res === "string" ? res : JSON.stringify(res));
    } catch {}
    finally { setIsAI(false); }
  };

  const runDemo = useCallback(() => {
    let i = 0;
    const next = () => {
      if (i >= DEMO.length) { setState("complete"); return; }
      setTranscript(prev => [...prev, { ...DEMO[i], ts: i*7 }]);
      i++;
      demoRef.current = setTimeout(next, 2400 + Math.random()*1200);
    };
    next();
  }, []);

  const startRec = () => { setState("recording"); setElapsed(0); setTranscript([]); setSoapRaw(""); runDemo(); };
  const stopRec = () => { setState("complete"); clearTimeout(demoRef.current); clearTimeout(genRef.current); generateSOAP(transcript); };
  const pauseRec = () => { setState("paused"); clearTimeout(demoRef.current); };
  const resumeRec = () => { setState("recording"); runDemo(); };

  const handleApply = async () => {
    if (!soapRaw) return;
    setApplying(true);
    const soap = parseSOAP(soapRaw);
    // Pass parsed SOAP to parent for merging into the studio form
    onApplyToNote({
      cc: transcript[1]?.text?.slice(0, 120) || "",
      hpi: soap.s || soapRaw.slice(0, 600),
      assessment_raw: soap.a,
      plan_raw: soap.p,
      soap_full: soapRaw,
    });
    setApplying(false);
    onClose();
  };

  const soap = parseSOAP(soapRaw);

  if (!open) return null;

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:9000, background:"rgba(5,15,30,.87)", backdropFilter:"blur(6px)",
      display:"flex", alignItems:"center", justifyContent:"center", padding:"16px",
    }}>
      <div style={{
        width:"100%", maxWidth:"960px", height:"82vh", background:G.navy,
        border:`1px solid ${G.border}`, borderRadius:"16px", display:"flex", flexDirection:"column", overflow:"hidden",
        boxShadow:"0 32px 80px rgba(0,0,0,.6)",
      }}>
        {/* Header */}
        <div style={{ height:52, background:G.slate, borderBottom:`1px solid ${G.border}`, display:"flex", alignItems:"center", padding:"0 18px", gap:12, flexShrink:0 }}>
          <span style={{ fontFamily:F.mono, fontSize:11, color:G.teal, letterSpacing:".1em", fontWeight:700 }}>🎙️ LIVE TRANSCRIPTION STUDIO</span>
          {state === "recording" && (
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <div style={{ width:7, height:7, borderRadius:"50%", background:G.red, animation:"pulse 1s infinite" }} />
              <span style={{ fontFamily:F.mono, fontSize:11, color:G.red }}>REC · {fmtTime(elapsed)}</span>
            </div>
          )}
          <div style={{ flex:1 }} />
          {soapRaw && (
            <button onClick={handleApply} disabled={applying} style={{
              padding:"6px 16px", borderRadius:9, fontSize:12, fontWeight:700, cursor:"pointer",
              background:`linear-gradient(135deg,${G.teal},#00b8a5)`, border:"none", color:G.navy,
              opacity: applying ? .6 : 1,
            }}>
              {applying ? "Applying..." : "✓ Apply to Note"}
            </button>
          )}
          <button onClick={onClose} style={{ width:28, height:28, borderRadius:"50%", background:G.edge, border:`1px solid ${G.border}`, color:G.dim, cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
        </div>

        <div style={{ display:"flex", flex:1, overflow:"hidden" }}>
          {/* Left Controls */}
          <div style={{ width:220, flexShrink:0, background:G.panel, borderRight:`1px solid ${G.border}`, padding:14, display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ fontFamily:F.mono, fontSize:9, color:G.dim, letterSpacing:".1em" }}>RECORDING CONTROLS</div>

            <div style={{ background:G.slate, borderRadius:10, padding:"10px 12px", border:`1px solid ${state==="recording"?G.teal+"45":G.border}` }}>
              {[{ label:"PHYSICIAN", color:G.teal }, { label:"PATIENT", color:G.purple }].map(mic => (
                <div key={mic.label} style={{ marginBottom:8 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                    <span style={{ fontFamily:F.mono, fontSize:8, color:G.dim }}>{mic.label}</span>
                    <span style={{ fontFamily:F.mono, fontSize:8, color:mic.color }}>{state==="recording"?"ACTIVE":"—"}</span>
                  </div>
                  <Waveform active={state==="recording"} color={mic.color} />
                </div>
              ))}
            </div>

            <div style={{ fontFamily:F.mono, fontSize:26, fontWeight:700, textAlign:"center", color:state==="recording"?G.teal:G.muted }}>{fmtTime(elapsed)}</div>

            {state === "idle" && (
              <button onClick={startRec} style={{ width:"100%", background:`linear-gradient(135deg,${G.teal}22,${G.blue}15)`, border:`1px solid ${G.teal}50`, color:G.teal, borderRadius:10, padding:"9px", cursor:"pointer", fontFamily:F.body, fontSize:13, fontWeight:700 }}>● Start Recording</button>
            )}
            {state === "recording" && (
              <div style={{ display:"flex", gap:7 }}>
                {[{l:"⏸ Pause",c:G.amber,fn:pauseRec},{l:"■ Stop",c:G.red,fn:stopRec}].map(b => (
                  <button key={b.l} onClick={b.fn} style={{ flex:1, background:b.c+"1a", border:`1px solid ${b.c}50`, color:b.c, borderRadius:9, padding:"8px 4px", cursor:"pointer", fontFamily:F.body, fontSize:11, fontWeight:600 }}>{b.l}</button>
                ))}
              </div>
            )}
            {state === "paused" && (
              <div style={{ display:"flex", gap:7 }}>
                {[{l:"▶ Resume",c:G.green,fn:resumeRec},{l:"■ Stop",c:G.red,fn:stopRec}].map(b => (
                  <button key={b.l} onClick={b.fn} style={{ flex:1, background:b.c+"1a", border:`1px solid ${b.c}50`, color:b.c, borderRadius:9, padding:"8px 4px", cursor:"pointer", fontFamily:F.body, fontSize:11, fontWeight:600 }}>{b.l}</button>
                ))}
              </div>
            )}
            {state === "complete" && (
              <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                <div style={{ padding:8, borderRadius:8, background:G.green+"12", border:`1px solid ${G.green}35`, textAlign:"center", fontFamily:F.mono, fontSize:10, color:G.green }}>✓ Complete · {fmtTime(elapsed)}</div>
                <button onClick={startRec} style={{ background:G.muted+"22", border:`1px solid ${G.border}`, color:G.dim, borderRadius:9, padding:8, cursor:"pointer", fontFamily:F.body, fontSize:12 }}>↺ New Session</button>
              </div>
            )}

            {transcript.length > 0 && (
              <div style={{ marginTop:4 }}>
                <div style={{ fontFamily:F.mono, fontSize:9, color:G.dim, letterSpacing:".1em", marginBottom:8 }}>SESSION STATS</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:5 }}>
                  {[
                    { l:"Segments", v:transcript.length, c:G.teal },
                    { l:"MD Lines", v:transcript.filter(x=>x.speaker==="physician").length, c:G.teal },
                    { l:"PT Lines", v:transcript.filter(x=>x.speaker==="patient").length, c:G.purple },
                    { l:"Words", v:(soapRaw||"").split(/\s+/).filter(Boolean).length, c:G.gold||G.amber },
                  ].map(s => (
                    <div key={s.l} style={{ background:G.edge, borderRadius:7, padding:"7px 6px", textAlign:"center", border:`1px solid ${G.border}` }}>
                      <div style={{ fontFamily:F.mono, fontSize:16, fontWeight:700, color:s.c }}>{s.v}</div>
                      <div style={{ fontFamily:F.body, fontSize:9, color:G.dim }}>{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Center: Live Transcript */}
          <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
            <div style={{ padding:"8px 14px", background:G.panel, borderBottom:`1px solid ${G.border}`, display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontFamily:F.mono, fontSize:9, color:G.dim, letterSpacing:".1em" }}>LIVE TRANSCRIPT</span>
              {isAI && (
                <div style={{ display:"flex", alignItems:"center", gap:5, marginLeft:"auto" }}>
                  <div style={{ width:5, height:5, borderRadius:"50%", background:G.purple, animation:"pulse 0.7s infinite" }} />
                  <span style={{ fontFamily:F.mono, fontSize:9, color:G.purple }}>AI GENERATING SOAP…</span>
                </div>
              )}
            </div>
            <div style={{ flex:1, overflowY:"auto", padding:"12px 14px", display:"flex", flexDirection:"column", gap:5 }}>
              {state === "idle" && (
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", textAlign:"center", padding:32 }}>
                  <div style={{ fontSize:44, marginBottom:12 }}>🎙️</div>
                  <div style={{ fontFamily:F.display, fontSize:18, color:G.bright, marginBottom:8 }}>Ready to Record</div>
                  <div style={{ fontFamily:F.body, fontSize:12, color:G.dim, lineHeight:1.7, maxWidth:300 }}>
                    Click <strong style={{ color:G.teal }}>Start Recording</strong> to begin. AI transcribes the encounter in real time and builds a SOAP note automatically.
                  </div>
                </div>
              )}
              {transcript.map((seg, idx) => {
                const isDoc = seg.speaker === "physician";
                return (
                  <div key={seg.id} style={{
                    display:"flex", gap:8, alignItems:"flex-start", padding:"8px 10px", borderRadius:8,
                    background:isDoc?G.teal+"07":G.purple+"07",
                    borderLeft:`2px solid ${isDoc?G.teal+"55":G.purple+"55"}`,
                    animation: idx === transcript.length-1 ? "slideIn 0.2s ease" : "none",
                  }}>
                    <span style={{ fontFamily:F.mono, fontSize:9, fontWeight:700, padding:"2px 6px", borderRadius:8, flexShrink:0, background:isDoc?G.teal+"20":G.purple+"20", color:isDoc?G.teal:G.purple, border:`1px solid ${isDoc?G.teal+"35":G.purple+"35"}` }}>{isDoc?"MD":"PT"}</span>
                    <span style={{ fontFamily:F.body, fontSize:13, color:G.text, flex:1, lineHeight:1.5 }}>{seg.text}</span>
                    <span style={{ fontFamily:F.mono, fontSize:9, color:G.muted, flexShrink:0 }}>{fmtTime(seg.ts)}</span>
                  </div>
                );
              })}
              {state === "recording" && transcript.length > 0 && (
                <div style={{ display:"flex", gap:6, alignItems:"center", padding:"7px 10px", opacity:.55 }}>
                  {[0,1,2].map(i => <div key={i} style={{ width:5, height:5, borderRadius:"50%", background:G.teal, animation:`bounce 1s ${i*0.15}s infinite` }} />)}
                  <span style={{ fontFamily:F.body, fontSize:11, color:G.dim }}>Listening…</span>
                </div>
              )}
              <div ref={endRef} />
            </div>
          </div>

          {/* Right: SOAP Output */}
          <div style={{ width:260, flexShrink:0, background:G.panel, borderLeft:`1px solid ${G.border}`, display:"flex", flexDirection:"column", overflow:"hidden" }}>
            <div style={{ padding:"10px 13px", borderBottom:`1px solid ${G.border}`, flexShrink:0 }}>
              <div style={{ fontFamily:F.mono, fontSize:9, color:G.purple, letterSpacing:".1em", fontWeight:700 }}>✦ LIVE SOAP NOTE</div>
              <div style={{ fontFamily:F.mono, fontSize:9, color:isAI?G.purple:soapRaw?G.green:G.muted, marginTop:2 }}>
                {isAI ? "Generating…" : soapRaw ? `${(soapRaw||"").split(/\s+/).filter(Boolean).length} words` : "Awaiting transcript…"}
              </div>
            </div>
            <div style={{ flex:1, overflowY:"auto", padding:"11px 13px" }}>
              {!soapRaw && !isAI && (
                <div style={{ textAlign:"center", padding:"28px 0", color:G.muted, fontSize:12 }}>
                  <div style={{ fontSize:32, marginBottom:10 }}>📋</div>
                  SOAP note will appear here in real time
                </div>
              )}
              {isAI && !soapRaw && (
                <div style={{ display:"flex", gap:5, alignItems:"center", padding:"12px 0", color:G.muted, fontSize:12 }}>
                  <div style={{ width:5,height:5,borderRadius:"50%",background:G.purple,animation:"pulse .7s infinite" }} />
                  <div style={{ width:5,height:5,borderRadius:"50%",background:G.purple,animation:"pulse .7s .2s infinite" }} />
                  <div style={{ width:5,height:5,borderRadius:"50%",background:G.purple,animation:"pulse .7s .4s infinite" }} />
                  <span style={{ marginLeft:4 }}>Generating…</span>
                </div>
              )}
              {soapRaw && [
                { title:"SUBJECTIVE", key:"s", color:G.teal },
                { title:"OBJECTIVE",  key:"o", color:G.blue },
                { title:"ASSESSMENT", key:"a", color:G.purple },
                { title:"PLAN",       key:"p", color:G.amber },
              ].map(sec => (
                <div key={sec.key} style={{ marginBottom:12 }}>
                  <div style={{ fontFamily:F.mono, fontSize:9, fontWeight:700, color:sec.color, letterSpacing:".1em", marginBottom:5 }}>{sec.title}</div>
                  <div style={{ fontFamily:F.body, fontSize:11, color:G.text, lineHeight:1.7, background:sec.color+"09", border:`1px solid ${sec.color}22`, borderRadius:7, padding:"8px 10px", minHeight:32, whiteSpace:"pre-wrap" }}>
                    {soap[sec.key] || <span style={{ color:G.muted, fontStyle:"italic" }}>{isAI?"Generating…":"—"}</span>}
                  </div>
                </div>
              ))}
            </div>
            {soapRaw && (
              <div style={{ padding:"10px 13px", borderTop:`1px solid ${G.border}` }}>
                <button onClick={handleApply} disabled={applying} style={{
                  width:"100%", background:`linear-gradient(135deg,${G.teal},#00b8a5)`, border:"none",
                  borderRadius:10, padding:"10px", cursor:"pointer", fontFamily:F.body, fontSize:13, fontWeight:700, color:G.navy,
                  opacity: applying ? .6 : 1,
                }}>
                  {applying ? "Applying…" : "✓ Apply to Note →"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.25} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes slideIn { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}