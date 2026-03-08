import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";

// ─── Design Tokens ────────────────────────────────────────────────────────
const G = {
  navy:"#050f1e", slate:"#0b1d35", panel:"#0d2240", edge:"#162d4f",
  border:"#1e3a5f", muted:"#2a4d72", dim:"#4a7299", text:"#c8ddf0",
  bright:"#e8f4ff", teal:"#00d4bc", amber:"#f5a623", red:"#ff5c6c",
  green:"#2ecc71", purple:"#9b6dff", blue:"#4a90d9", rose:"#f472b6",
  gold:"#f0c040", orange:"#ff8c42", cyan:"#22d3ee",
};
const F = {
  display:"'Playfair Display', Georgia, serif",
  body:"'DM Sans','Segoe UI',sans-serif",
  mono:"'JetBrains Mono','Fira Code',monospace",
};

// ─── Macro Library ────────────────────────────────────────────────────────
const MACROS = [
  { id:"hpi-complete",  label:"HPI Complete",       category:"HPI",       text:"The history of present illness is complete as documented above." },
  { id:"ros-negative",  label:"ROS Negative",        category:"ROS",       text:"A 10-point review of systems is negative except as noted in the HPI." },
  { id:"ros-positive",  label:"ROS Positive HPI",    category:"ROS",       text:"Review of systems positive for symptoms noted in HPI. All other systems reviewed and negative." },
  { id:"exam-normal",   label:"Exam Normal",         category:"Exam",      text:"Physical examination within normal limits. Patient is alert and oriented ×4, in no acute distress." },
  { id:"vitals-stable", label:"Vitals Stable",       category:"Objective", text:"Vital signs stable and within acceptable limits." },
  { id:"no-allergies",  label:"NKDA",                category:"Meds",      text:"No known drug allergies (NKDA)." },
  { id:"meds-unchanged",label:"Meds Unchanged",      category:"Meds",      text:"Current medications reviewed and unchanged from prior visit." },
  { id:"counseled",     label:"Patient Counseled",   category:"Plan",      text:"Patient counseled on diagnosis, treatment plan, expected course, return precautions, and medication instructions. All questions answered." },
  { id:"followup-1wk",  label:"F/U 1 Week",          category:"Plan",      text:"Follow up in 1 week or sooner if symptoms worsen." },
  { id:"followup-1mo",  label:"F/U 1 Month",         category:"Plan",      text:"Follow up in 1 month for reassessment." },
  { id:"er-precautions",label:"Return Precautions",  category:"Plan",      text:"Patient instructed to return to ED or call 911 if experiencing chest pain, difficulty breathing, severe symptoms, or any concerns." },
  { id:"labs-pending",  label:"Labs Pending",        category:"Objective", text:"Laboratory results pending at time of this note; to be reviewed and addressed separately." },
  { id:"informed-consent",label:"Informed Consent",  category:"Plan",      text:"Risks, benefits, and alternatives were discussed with the patient/guardian. Informed consent was obtained." },
  { id:"interpreter",   label:"Interpreter Used",    category:"Social",    text:"Professional interpreter utilized for this visit. Patient demonstrated understanding of discussion." },
];
const MACRO_CATS = [...new Set(MACROS.map(m => m.category))];

// ─── Demo transcript ──────────────────────────────────────────────────────
const DEMO = [
  { id:1,  speaker:"physician", text:"Good morning. What brings you in today?", ts:0 },
  { id:2,  speaker:"patient",   text:"I've been having this chest pain for two days. It's like a pressure, right in the middle of my chest.", ts:4 },
  { id:3,  speaker:"physician", text:"On a scale of 0 to 10, how would you rate the pain?", ts:12 },
  { id:4,  speaker:"patient",   text:"About a 6 or 7. Gets worse when I walk up stairs.", ts:16 },
  { id:5,  speaker:"physician", text:"Does it radiate anywhere — arm, jaw, or back?", ts:24 },
  { id:6,  speaker:"patient",   text:"Yes, into my left arm sometimes. And I've been sweating a lot.", ts:29 },
  { id:7,  speaker:"physician", text:"Any shortness of breath or nausea?", ts:36 },
  { id:8,  speaker:"patient",   text:"A little nausea, yes. Not much trouble breathing.", ts:40 },
  { id:9,  speaker:"physician", text:"Any history of heart problems, high blood pressure, or diabetes?", ts:46 },
  { id:10, speaker:"patient",   text:"I have high blood pressure. On lisinopril for about 3 years. No diabetes that I know of.", ts:51 },
  { id:11, speaker:"physician", text:"Any family history of heart disease?", ts:59 },
  { id:12, speaker:"patient",   text:"My father had a heart attack at 58. I'm 54 now so it worries me.", ts:63 },
  { id:13, speaker:"physician", text:"Do you smoke or drink alcohol?", ts:70 },
  { id:14, speaker:"patient",   text:"Quit smoking 5 years ago — pack a day for 20 years. I drink socially, maybe once a week.", ts:74 },
  { id:15, speaker:"physician", text:"I'll order an EKG and troponin levels now. Let me examine you.", ts:83 },
];

// ─── Utilities ─────────────────────────────────────────────────────────────
const fmtTime = s => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,"0")}`;

function parseSOAP(raw) {
  if (!raw) return { s:"", o:"", a:"", p:"" };
  const get = (head, next) => {
    const m = raw.match(new RegExp(`##?\\s*${head}\\s*\\n([\\s\\S]*?)(?=##?\\s*${next}|$)`,"i"));
    return m ? m[1].trim() : "";
  };
  return {
    s: get("SUBJECTIVE","OBJECTIVE"),
    o: get("OBJECTIVE","ASSESSMENT"),
    a: get("ASSESSMENT","PLAN"),
    p: get("PLAN","$$$"),
  };
}

function buildPrompt(transcript, existing) {
  const lines = transcript.map(t=>`[${t.speaker==="physician"?"MD":"PT"}]: ${t.text}`).join("\n");
  return `You are Notrya AI, a clinical documentation assistant. Based on this live patient encounter transcript, write a structured SOAP note.

TRANSCRIPT:
${lines}

PRIOR DRAFT:
${existing || "(none)"}

Generate a professional SOAP note. Sections:
## SUBJECTIVE
## OBJECTIVE
## ASSESSMENT
## PLAN

Rules: extract facts from transcript only, mark incomplete sections as "(in progress)", use medical terminology, be concise. Respond ONLY with the SOAP note.`;
}

// ─── Waveform ────────────────────────────────────────────────────────
function Waveform({ active, color }) {
  const [bars, setBars] = useState(Array(36).fill(4));
  useEffect(() => {
    if (!active) { setBars(Array(36).fill(4)); return; }
    const iv = setInterval(() => setBars(b => b.map(() => active ? Math.floor(Math.random()*28)+4 : 4)), 90);
    return () => clearInterval(iv);
  }, [active]);
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"2px", height:"36px" }}>
      {bars.map((h,i) => (
        <div key={i} style={{
          width:"3px", borderRadius:"2px", flexShrink:0,
          height: active ? `${h}px` : "4px",
          background: active ? color : G.muted,
          transition:"height 0.08s ease",
        }} />
      ))}
    </div>
  );
}

// ─── SOAP Section Block ───────────────────────────────────────────────────
function SOAPBlock({ title, icon, content, color, streaming }) {
  return (
    <div style={{ marginBottom:"14px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"7px" }}>
        <span style={{ fontSize:"13px" }}>{icon}</span>
        <span style={{ fontFamily:F.mono, fontSize:"10px", fontWeight:700, letterSpacing:"0.1em", color }}>{title}</span>
        <div style={{ flex:1, height:"1px", background:color+"25" }} />
        {streaming && <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:color, animation:"pulse 0.7s infinite" }} />}
      </div>
      <div style={{
        fontFamily:F.body, fontSize:"13px", color:G.text, lineHeight:1.75,
        whiteSpace:"pre-wrap", padding:"10px 12px", borderRadius:"8px",
        background:color+"09", border:`1px solid ${color}22`, minHeight:"38px",
      }}>
        {content || <span style={{ color:G.muted, fontStyle:"italic" }}>
          {streaming ? "Generating…" : "Awaiting data…"}
        </span>}
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────
function Skel({ w="100%", h=10, mb=6 }) {
  return <div style={{ width:w, height:`${h}px`, borderRadius:"4px", background:G.edge, marginBottom:`${mb}px`, animation:"pulse 1.4s infinite" }} />;
}

// ─── Main ─────────────────────────────────────────────────────────────────
export default function LiveTranscriptionStudio({
  patient=null, encounter=null, currentUser=null,
  isLoading=false, onPushToSOAPCompiler=null, onSaveSession=null,
}) {
  const [state, setState] = useState("idle"); // idle|recording|paused|complete
  const [elapsed, setElapsed] = useState(0);
  const [transcript, setTranscript] = useState([]);
  const [soapRaw, setSoapRaw] = useState("");
  const [isAI, setIsAI] = useState(false);
  const [genCount, setGenCount] = useState(0);
  const [genMs, setGenMs] = useState(null);
  const [autoGen, setAutoGen] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editText, setEditText] = useState("");
  const [macroCat, setMacroCat] = useState("All");
  const [macroQ, setMacroQ] = useState("");
  const [showMacros, setShowMacros] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [pushOk, setPushOk] = useState(false);

  const timerRef = useRef(); const demoRef = useRef();
  const genRef = useRef(); const endRef = useRef();

  // Timer
  useEffect(() => {
    if (state==="recording") timerRef.current = setInterval(()=>setElapsed(t=>t+1), 1000);
    else clearInterval(timerRef.current);
    return ()=>clearInterval(timerRef.current);
  }, [state]);

  // Auto-scroll
  useEffect(() => { endRef.current?.scrollIntoView({ behavior:"smooth" }); }, [transcript]);

  // Auto-generate SOAP when new transcript segments arrive
  useEffect(() => {
    if (!autoGen || transcript.length < 2 || state==="idle") return;
    clearTimeout(genRef.current);
    genRef.current = setTimeout(()=>generateSOAP(transcript), 2800);
    return ()=>clearTimeout(genRef.current);
  }, [transcript, autoGen]);

  // AI Generation
  const generateSOAP = async (txts) => {
    if (isAI || txts.length < 2) return;
    setIsAI(true); setGenCount(c=>c+1);
    const t0 = Date.now();
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          stream:true,
          messages:[{ role:"user", content:buildPrompt(txts, soapRaw) }],
        }),
      });
      let acc="";
      const rdr=res.body.getReader(); const dec=new TextDecoder();
      while(true) {
        const {done,value}=await rdr.read(); if(done) break;
        for(const line of dec.decode(value).split("\n")) {
          if(!line.startsWith("data: ")) continue;
          try {
            const d=JSON.parse(line.slice(6));
            if(d.type==="content_block_delta"&&d.delta?.text) { acc+=d.delta.text; setSoapRaw(acc); }
          } catch{}
        }
      }
      setGenMs(Date.now()-t0);
    } catch {
      toast("AI unavailable — note generation failed","error");
    } finally { setIsAI(false); }
  };

  // Demo playback
  const runDemo = useCallback(() => {
    let i=0;
    const next=()=>{
      if(i>=DEMO.length){ setState("complete"); return; }
      setTranscript(prev=>[...prev,{...DEMO[i],ts:i*7}]);
      i++; demoRef.current=setTimeout(next, 2600+Math.random()*1400);
    };
    next();
  },[]);

  const startRec = () => { setState("recording"); setElapsed(0); setTranscript([]); setSoapRaw(""); setGenCount(0); runDemo(); };
  const pauseRec = () => { setState("paused"); clearTimeout(demoRef.current); toast("Recording paused","info"); };
  const resumeRec= () => { setState("recording"); runDemo(); };
  const stopRec  = () => { setState("complete"); clearTimeout(demoRef.current); clearTimeout(genRef.current); generateSOAP(transcript); toast("Session complete — generating final SOAP","success"); };

  const insertMacro = (m) => {
    setSoapRaw(prev=>{
      if(!prev) return `## SUBJECTIVE\n\n## OBJECTIVE\n\n## ASSESSMENT\n\n## PLAN\n${m.text}`;
      const planIdx = prev.toLowerCase().lastIndexOf("## plan");
      if(m.category==="Plan"||m.category==="Social") {
        return planIdx===-1 ? prev+"\n"+m.text : prev.slice(0,planIdx+7)+"\n"+m.text+prev.slice(planIdx+7);
      }
      const subjIdx = prev.toLowerCase().indexOf("## subjective");
      const objIdx  = prev.toLowerCase().indexOf("## objective");
      const insertAt = (m.category==="Exam"||m.category==="Objective"||m.category==="Meds") ? objIdx : subjIdx;
      if(insertAt===-1) return prev+"\n"+m.text;
      const nextSection = prev.indexOf("## ",insertAt+5);
      const at = nextSection===-1 ? prev.length : nextSection;
      return prev.slice(0,at)+"\n"+m.text+"\n"+prev.slice(at);
    });
    toast(`Inserted: ${m.label}`,"success");
  };

  const toast=(msg,type="info")=>{
    const id=Date.now(); setToasts(t=>[...t,{id,msg,type}]);
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),3200);
  };

  const handlePush=()=>{
    onPushToSOAPCompiler?.({ transcript, soapNote:editMode?editText:soapRaw, patient, encounter });
    setPushOk(true); toast("✓ Pushed to SOAP Compiler!","success");
    setTimeout(()=>setPushOk(false),3000);
  };

  const filteredMacros=MACROS.filter(m=>{
    const cat=macroCat==="All"||m.category===macroCat;
    const q=!macroQ||m.label.toLowerCase().includes(macroQ.toLowerCase());
    return cat&&q;
  });

  const soap=parseSOAP(editMode?editText:soapRaw);
  const wordCount=(soapRaw||"").split(/\s+/).filter(Boolean).length;

  const BtnPrimary=({label,onClick,color,disabled,full=false})=>(
    <button disabled={disabled} onClick={onClick} style={{
      background:color+"1a", border:`1px solid ${color}55`, color,
      borderRadius:"10px", padding:"9px 14px", cursor:disabled?"not-allowed":"pointer",
      fontFamily:F.body, fontSize:"13px", fontWeight:600,
      width:full?"100%":"auto", transition:"all 0.15s", opacity:disabled?0.4:1,
    }}>{label}</button>
  );

  return (
    <div style={{ minHeight:"100vh", background:G.navy, fontFamily:F.body, position:"relative", paddingTop:"42px" }}>

      {/* Navbar */}
      <div style={{
        height:"54px", background:G.slate, borderBottom:`1px solid ${G.border}`,
        display:"flex", alignItems:"center", padding:"0 20px", gap:"14px",
        position:"sticky", top:"0px", zIndex:40,
      }}>
        <span style={{ fontFamily:F.display, fontSize:"18px", color:G.bright, letterSpacing:"-0.01em" }}>Notrya</span>
        <span style={{ color:G.border }}>|</span>
        <span style={{ fontFamily:F.mono, fontSize:"11px", color:G.teal, letterSpacing:"0.08em" }}>LIVE TRANSCRIPTION STUDIO</span>
        <div style={{ flex:1 }}/>
        {state==="recording"&&(
          <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
            <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:G.red, animation:"pulse 1s infinite" }}/>
            <span style={{ fontFamily:F.mono, fontSize:"12px", color:G.red }}>● REC · {fmtTime(elapsed)}</span>
          </div>
        )}
        {patient&&(
          <div style={{ background:G.panel, border:`1px solid ${G.border}`, borderRadius:"8px", padding:"4px 12px" }}>
            <span style={{ fontFamily:F.mono, fontSize:"11px", color:G.text }}>{patient.fullName||"Patient"}</span>
          </div>
        )}
      </div>

      {/* Page Header */}
      <div style={{
        background:G.slate, borderBottom:`1px solid ${G.border}`,
        padding:"14px 20px", display:"flex", alignItems:"center", gap:"16px",
      }}>
        <div style={{
          width:"42px", height:"42px", borderRadius:"10px",
          background:`linear-gradient(135deg,${G.teal}25,${G.blue}25)`,
          border:`1px solid ${G.teal}35`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"22px",
        }}>🎙️</div>
        <div>
          <h1 style={{ fontFamily:F.display, fontSize:"22px", color:G.bright, margin:0, letterSpacing:"-0.02em" }}>
            Live Transcription Studio
          </h1>
          <p style={{ fontFamily:F.body, fontSize:"12px", color:G.dim, margin:0 }}>
            Ambient AI · Speaker diarization · Real-time SOAP generation
          </p>
        </div>
        <div style={{ flex:1 }}/>
        {[
          { label:"Diarization",  active:state==="recording", icon:"👥" },
          { label:"Auto SOAP",    active:autoGen,              icon:"✦", click:()=>setAutoGen(v=>!v) },
          { label:`${transcript.length} seg`, active:transcript.length>0, icon:"📝" },
        ].map(chip=>(
          <div key={chip.label} onClick={chip.click} style={{
            display:"flex", alignItems:"center", gap:"6px",
            padding:"4px 10px", borderRadius:"20px",
            background:chip.active?G.teal+"12":G.edge,
            border:`1px solid ${chip.active?G.teal+"45":G.border}`,
            cursor:chip.click?"pointer":"default",
          }}>
            <span style={{ fontSize:"11px" }}>{chip.icon}</span>
            <span style={{ fontFamily:F.mono, fontSize:"10px", color:chip.active?G.teal:G.dim }}>{chip.label}</span>
            {chip.active&&<div style={{ width:"5px",height:"5px",borderRadius:"50%",background:G.teal,animation:"pulse 1.5s infinite" }}/>}
          </div>
        ))}
      </div>

      {/* Three-column body */}
      <div style={{ display:"flex", minHeight:"calc(100vh - 42px - 54px - 70px)" }}>

        {/* ── LEFT: Controls + Macros ── */}
        <div style={{ width:"264px", flexShrink:0, background:G.panel, borderRight:`1px solid ${G.border}`, overflowY:"auto", display:"flex", flexDirection:"column" }}>

          {/* Recording */}
          <div style={{ padding:"16px", borderBottom:`1px solid ${G.border}` }}>
            <p style={{ fontFamily:F.mono, fontSize:"10px", color:G.dim, letterSpacing:"0.1em", margin:"0 0 12px" }}>RECORDING CONTROLS</p>

            {/* Waveforms */}
            <div style={{
              background:G.slate, borderRadius:"10px", padding:"12px 14px", marginBottom:"12px",
              border:`1px solid ${state==="recording"?G.teal+"45":G.border}`,
              display:"flex", flexDirection:"column", gap:"10px",
            }}>
              {[
                { label:"PHYSICIAN", color:G.teal },
                { label:"PATIENT",   color:G.purple },
              ].map(mic=>(
                <div key={mic.label}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"4px" }}>
                    <span style={{ fontFamily:F.mono, fontSize:"9px", color:G.dim }}>{mic.label}</span>
                    <span style={{ fontFamily:F.mono, fontSize:"9px", color:mic.color }}>
                      {state==="recording"?"ACTIVE":"—"}
                    </span>
                  </div>
                  <Waveform active={state==="recording"} color={mic.color}/>
                </div>
              ))}
            </div>

            {/* Timer */}
            <div style={{
              fontFamily:F.mono, fontSize:"30px", fontWeight:700, textAlign:"center",
              letterSpacing:"0.05em", marginBottom:"12px",
              color:state==="recording"?G.teal:G.muted, transition:"color 0.3s",
            }}>
              {fmtTime(elapsed)}
            </div>

            {/* Control buttons */}
            {state==="idle"&&(
              <button onClick={startRec} style={{
                width:"100%", background:`linear-gradient(135deg,${G.teal}22,${G.blue}15)`,
                border:`1px solid ${G.teal}50`, color:G.teal, borderRadius:"10px",
                padding:"10px", cursor:"pointer", fontFamily:F.body, fontSize:"13px", fontWeight:700,
                letterSpacing:"0.02em",
              }}>● Start Recording</button>
            )}
            {state==="recording"&&(
              <div style={{ display:"flex", gap:"8px" }}>
                {[{l:"⏸ Pause",c:G.amber,fn:pauseRec},{l:"■ Stop",c:G.red,fn:stopRec}].map(b=>(
                  <button key={b.l} onClick={b.fn} style={{
                    flex:1, background:b.c+"1a", border:`1px solid ${b.c}50`, color:b.c,
                    borderRadius:"10px", padding:"9px 4px", cursor:"pointer",
                    fontFamily:F.body, fontSize:"12px", fontWeight:600,
                  }}>{b.l}</button>
                ))}
              </div>
            )}
            {state==="paused"&&(
              <div style={{ display:"flex", gap:"8px" }}>
                {[{l:"▶ Resume",c:G.green,fn:resumeRec},{l:"■ Stop",c:G.red,fn:stopRec}].map(b=>(
                  <button key={b.l} onClick={b.fn} style={{
                    flex:1, background:b.c+"1a", border:`1px solid ${b.c}50`, color:b.c,
                    borderRadius:"10px", padding:"9px 4px", cursor:"pointer",
                    fontFamily:F.body, fontSize:"12px", fontWeight:600,
                  }}>{b.l}</button>
                ))}
              </div>
            )}
            {state==="complete"&&(
              <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                <div style={{
                  padding:"8px", borderRadius:"8px", background:G.green+"12",
                  border:`1px solid ${G.green}35`, textAlign:"center",
                  fontFamily:F.mono, fontSize:"11px", color:G.green,
                }}>✓ Session Complete · {fmtTime(elapsed)}</div>
                <button onClick={startRec} style={{
                  background:G.muted+"22", border:`1px solid ${G.border}`, color:G.dim,
                  borderRadius:"10px", padding:"9px", cursor:"pointer", fontFamily:F.body, fontSize:"12px",
                }}>↺ New Session</button>
              </div>
            )}
          </div>

          {/* Stats */}
          {transcript.length>0&&(
            <div style={{ padding:"14px 16px", borderBottom:`1px solid ${G.border}` }}>
              <p style={{ fontFamily:F.mono, fontSize:"10px", color:G.dim, letterSpacing:"0.1em", margin:"0 0 10px" }}>SESSION STATS</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px" }}>
                {[
                  { l:"Segments",  v:transcript.length, c:G.teal },
                  { l:"MD Lines",  v:transcript.filter(x=>x.speaker==="physician").length, c:G.teal },
                  { l:"PT Lines",  v:transcript.filter(x=>x.speaker==="patient").length, c:G.purple },
                  { l:"SOAP Words",v:wordCount, c:G.gold },
                ].map(s=>(
                  <div key={s.l} style={{ background:G.edge, borderRadius:"8px", padding:"8px", textAlign:"center", border:`1px solid ${G.border}` }}>
                    <div style={{ fontFamily:F.mono, fontSize:"18px", fontWeight:700, color:s.c }}>{s.v}</div>
                    <div style={{ fontFamily:F.body, fontSize:"10px", color:G.dim }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Macro Library */}
          <div onClick={()=>setShowMacros(v=>!v)} style={{
            padding:"11px 16px", borderBottom:`1px solid ${G.border}`,
            cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center",
            background:showMacros?G.edge+"80":"transparent",
          }}>
            <span style={{ fontFamily:F.mono, fontSize:"10px", color:G.dim, letterSpacing:"0.1em" }}>
              📚 MACRO LIBRARY ({MACROS.length})
            </span>
            <span style={{ color:G.dim, fontSize:"11px" }}>{showMacros?"▴":"▾"}</span>
          </div>

          {showMacros&&(
            <div style={{ flex:1, overflowY:"auto", padding:"12px 14px" }}>
              <input
                placeholder="Search macros…" value={macroQ}
                onChange={e=>setMacroQ(e.target.value)}
                style={{
                  width:"100%", background:G.edge, border:`1px solid ${G.border}`,
                  borderRadius:"8px", padding:"7px 10px", color:G.text,
                  fontFamily:F.body, fontSize:"12px", marginBottom:"9px",
                  outline:"none", boxSizing:"border-box",
                }}
              />
              <div style={{ display:"flex", flexWrap:"wrap", gap:"4px", marginBottom:"10px" }}>
                {["All",...MACRO_CATS].map(cat=>(
                  <button key={cat} onClick={()=>setMacroCat(cat)} style={{
                    padding:"3px 8px", borderRadius:"10px", border:"none",
                    background:macroCat===cat?G.teal:G.edge, color:macroCat===cat?G.navy:G.dim,
                    fontFamily:F.mono, fontSize:"9px", fontWeight:macroCat===cat?700:400, cursor:"pointer",
                  }}>{cat}</button>
                ))}
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:"4px" }}>
                {filteredMacros.map(m=>(
                  <button key={m.id} onClick={()=>insertMacro(m)} title={m.text} style={{
                    background:G.edge, border:`1px solid ${G.border}`, borderRadius:"8px",
                    padding:"7px 10px", textAlign:"left", cursor:"pointer",
                    fontFamily:F.body, fontSize:"12px", color:G.text,
                    display:"flex", justifyContent:"space-between", alignItems:"center",
                    transition:"all 0.12s",
                  }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=G.teal;e.currentTarget.style.background=G.teal+"12";}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=G.border;e.currentTarget.style.background=G.edge;}}
                  >
                    <span>{m.label}</span>
                    <span style={{ fontFamily:F.mono, fontSize:"9px", color:G.muted }}>{m.category}</span>
                  </button>
                ))}
                {filteredMacros.length===0&&(
                  <p style={{ color:G.muted, fontSize:"12px", textAlign:"center", padding:"12px 0" }}>No macros found</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── CENTER: Live Transcript ── */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

          {/* Center Header */}
          <div style={{
            padding:"10px 16px", background:G.panel, borderBottom:`1px solid ${G.border}`,
            display:"flex", alignItems:"center", gap:"12px",
          }}>
            <span style={{ fontFamily:F.mono, fontSize:"10px", color:G.dim, letterSpacing:"0.1em" }}>
              LIVE TRANSCRIPT
            </span>
            <div style={{ display:"flex", gap:"16px", marginLeft:"auto", alignItems:"center" }}>
              <div style={{ display:"flex", gap:"12px" }}>
                <SpkLegend color={G.teal}  label="Physician"/>
                <SpkLegend color={G.purple} label="Patient"/>
              </div>
              {isAI&&(
                <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                  <div style={{ width:"6px",height:"6px",borderRadius:"50%",background:G.purple,animation:"pulse 0.7s infinite" }}/>
                  <span style={{ fontFamily:F.mono, fontSize:"10px", color:G.purple }}>AI UPDATING SOAP…</span>
                </div>
              )}
              {genMs&&!isAI&&(
                <span style={{ fontFamily:F.mono, fontSize:"10px", color:G.green }}>✓ Gen #{genCount} · {(genMs/1000).toFixed(1)}s</span>
              )}
            </div>
          </div>

          {/* Transcript Scroll Area */}
          <div style={{ flex:1, overflowY:"auto", padding:"16px", display:"flex", flexDirection:"column", gap:"6px" }}>
            {state==="idle"&&(
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", textAlign:"center", padding:"40px" }}>
                <div style={{ fontSize:"52px", marginBottom:"16px", filter:"drop-shadow(0 0 20px "+G.teal+"60)" }}>🎙️</div>
                <h3 style={{ fontFamily:F.display, fontSize:"22px", color:G.bright, margin:"0 0 10px", letterSpacing:"-0.01em" }}>Ready to Record</h3>
                <p style={{ fontFamily:F.body, fontSize:"13px", color:G.dim, lineHeight:1.7, maxWidth:"340px" }}>
                  Click <strong style={{ color:G.teal }}>Start Recording</strong> to begin. Notrya AI transcribes the encounter in real time, separates physician and patient voices, and builds a SOAP note as you speak.
                </p>
                <div style={{ display:"flex", gap:"20px", marginTop:"24px" }}>
                  {[
                    { icon:"👥", label:"Speaker Diarization" },
                    { icon:"✦",  label:"Auto SOAP" },
                    { icon:"📚", label:"14 Macros" },
                  ].map(f=>(
                    <div key={f.label} style={{
                      display:"flex", flexDirection:"column", alignItems:"center", gap:"6px",
                      padding:"12px 16px", borderRadius:"10px",
                      background:G.panel, border:`1px solid ${G.border}`,
                    }}>
                      <span style={{ fontSize:"20px" }}>{f.icon}</span>
                      <span style={{ fontFamily:F.body, fontSize:"11px", color:G.dim }}>{f.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {transcript.map((seg, idx) => {
              const isDoc = seg.speaker==="physician";
              return (
                <div key={seg.id} style={{
                  display:"flex", gap:"10px", alignItems:"flex-start",
                  padding:"9px 12px", borderRadius:"9px",
                  background:isDoc?G.teal+"07":G.purple+"07",
                  borderLeft:`2px solid ${isDoc?G.teal+"55":G.purple+"55"}`,
                  animation:idx===transcript.length-1?"slideIn 0.25s ease":"none",
                }}>
                  <span style={{
                    fontFamily:F.mono, fontSize:"10px", fontWeight:700, letterSpacing:"0.06em",
                    padding:"2px 7px", borderRadius:"10px", flexShrink:0,
                    background:isDoc?G.teal+"20":G.purple+"20",
                    color:isDoc?G.teal:G.purple,
                    border:`1px solid ${isDoc?G.teal+"35":G.purple+"35"}`,
                  }}>{isDoc?"MD":"PT"}</span>
                  <p style={{ fontFamily:F.body, fontSize:"14px", color:G.text, margin:0, lineHeight:1.55, flex:1 }}>
                    {seg.text}
                  </p>
                  <span style={{ fontFamily:F.mono, fontSize:"10px", color:G.muted, flexShrink:0 }}>
                    {fmtTime(seg.ts)}
                  </span>
                </div>
              );
            })}

            {state==="recording"&&transcript.length>0&&(
              <div style={{ display:"flex", gap:"8px", alignItems:"center", padding:"8px 12px", opacity:0.55 }}>
                {[0,1,2].map(i=>(
                  <div key={i} style={{ width:"6px",height:"6px",borderRadius:"50%",background:G.teal,animation:`bounce 1s ${i*0.15}s infinite` }}/>
                ))}
                <span style={{ fontFamily:F.body, fontSize:"12px", color:G.dim }}>Listening…</span>
              </div>
            )}
            <div ref={endRef}/>
          </div>
        </div>

        {/* ── RIGHT: Live SOAP ── */}
        <div style={{ width:"300px", flexShrink:0, background:G.panel, borderLeft:`1px solid ${G.border}`, display:"flex", flexDirection:"column" }}>

          {/* Right Header */}
          <div style={{
            padding:"12px 14px", borderBottom:`1px solid ${G.border}`,
            display:"flex", justifyContent:"space-between", alignItems:"center",
          }}>
            <div>
              <p style={{ fontFamily:F.mono, fontSize:"10px", color:G.purple, letterSpacing:"0.1em", margin:"0 0 2px" }}>✦ LIVE SOAP NOTE</p>
              <p style={{ fontFamily:F.mono, fontSize:"10px", color:isAI?G.purple:genMs?G.green:G.muted, margin:0 }}>
                {isAI?"AI generating…":genMs?`${wordCount} words · ${(genMs/1000).toFixed(1)}s`:"Waiting for transcript…"}
              </p>
            </div>
            <div style={{ display:"flex", gap:"5px" }}>
              {soapRaw&&(
                <button onClick={()=>{ if(!editMode)setEditText(soapRaw); setEditMode(v=>!v); }} style={{
                  padding:"5px 9px", borderRadius:"7px",
                  background:editMode?G.green+"18":G.amber+"18",
                  border:`1px solid ${editMode?G.green+"40":G.amber+"40"}`,
                  color:editMode?G.green:G.amber, fontFamily:F.mono,
                  fontSize:"10px", cursor:"pointer", fontWeight:600,
                }}>{editMode?"✓ Done":"✏ Edit"}</button>
              )}
              {transcript.length>0&&(
                <button onClick={()=>generateSOAP(transcript)} style={{
                  padding:"5px 9px", borderRadius:"7px",
                  background:G.blue+"18", border:`1px solid ${G.blue}40`,
                  color:G.blue, fontFamily:F.mono, fontSize:"10px", cursor:"pointer", fontWeight:600,
                }}>↺</button>
              )}
            </div>
          </div>

          {/* SOAP Content */}
          <div style={{ flex:1, overflowY:"auto", padding:"12px 14px" }}>
            {!soapRaw&&state==="idle"&&(
              <div style={{ padding:"24px 0", textAlign:"center" }}>
                <div style={{ fontSize:"36px", marginBottom:"12px" }}>📋</div>
                <p style={{ fontFamily:F.body, fontSize:"12px", color:G.muted, lineHeight:1.7 }}>
                  SOAP note builds here in real time as the encounter is transcribed.
                </p>
              </div>
            )}
            {isAI&&!soapRaw&&(
              <div>
                {[
                  {l:"SUBJECTIVE",c:G.teal},{l:"OBJECTIVE",c:G.blue},
                  {l:"ASSESSMENT",c:G.purple},{l:"PLAN",c:G.amber},
                ].map(s=>(
                  <div key={s.l} style={{ marginBottom:"14px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"7px", marginBottom:"7px" }}>
                      <div style={{ width:"5px",height:"5px",borderRadius:"50%",background:s.c,animation:"pulse 1s infinite" }}/>
                      <Skel w="70px" h={10}/>
                    </div>
                    <div style={{ background:G.edge, borderRadius:"8px", padding:"10px", display:"flex", flexDirection:"column", gap:"5px" }}>
                      {[100,80,90,55].map((w,i)=><Skel key={i} w={`${w}%`} h={9}/>)}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {editMode?(
              <textarea value={editText} onChange={e=>setEditText(e.target.value)} style={{
                width:"100%", minHeight:"380px", background:G.edge, border:`1px solid ${G.border}`,
                borderRadius:"8px", padding:"10px", color:G.text, fontFamily:F.mono,
                fontSize:"12px", lineHeight:1.7, resize:"none", outline:"none", boxSizing:"border-box",
              }}/>
            ):soapRaw?(
              <div>
                <SOAPBlock title="SUBJECTIVE" icon="🗣️" content={soap.s} color={G.teal}    streaming={isAI&&!soap.o} />
                <SOAPBlock title="OBJECTIVE"  icon="🔬" content={soap.o} color={G.blue}    streaming={isAI&&!soap.a} />
                <SOAPBlock title="ASSESSMENT" icon="🧠" content={soap.a} color={G.purple}  streaming={isAI&&!soap.p} />
                <SOAPBlock title="PLAN"       icon="📋" content={soap.p} color={G.amber}   streaming={isAI&&!!soap.a&&!soap.p} />
              </div>
            ):null}
          </div>

          {/* Action Bar */}
          <div style={{ padding:"12px 14px", borderTop:`1px solid ${G.border}`, display:"flex", flexDirection:"column", gap:"8px" }}>
            <button onClick={handlePush} disabled={!soapRaw} style={{
              width:"100%", background:pushOk?G.green+"20":G.teal+"18",
              border:`1px solid ${pushOk?G.green+"50":G.teal+"50"}`,
              color:pushOk?G.green:G.teal, borderRadius:"10px",
              padding:"10px", cursor:!soapRaw?"not-allowed":"pointer",
              fontFamily:F.body, fontSize:"13px", fontWeight:700,
              opacity:!soapRaw?0.4:1, transition:"all 0.2s", letterSpacing:"0.01em",
            }}>
              {pushOk?"✓ Pushed to SOAP Compiler!":"⟶ Push to SOAP Compiler"}
            </button>
            <div style={{ display:"flex", gap:"7px" }}>
              <button onClick={()=>{ navigator.clipboard?.writeText(editMode?editText:soapRaw); toast("Copied to clipboard","success"); }}
                disabled={!soapRaw}
                style={{ flex:1, background:G.muted+"18", border:`1px solid ${G.border}`, color:G.dim,
                  borderRadius:"9px", padding:"8px", cursor:"pointer", fontFamily:F.body, fontSize:"12px",
                  opacity:!soapRaw?0.4:1,
                }}>📋 Copy</button>
              {onSaveSession&&(
                <button onClick={()=>{ onSaveSession({transcript,soapNote:editMode?editText:soapRaw}); toast("Session saved","success"); }}
                  disabled={!soapRaw}
                  style={{ flex:1, background:G.blue+"18", border:`1px solid ${G.blue}40`, color:G.blue,
                    borderRadius:"9px", padding:"8px", cursor:"pointer", fontFamily:F.body, fontSize:"12px",
                    opacity:!soapRaw?0.4:1,
                  }}>💾 Save</button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toasts */}
      <div style={{ position:"fixed", bottom:"20px", right:"20px", display:"flex", flexDirection:"column", gap:"7px", zIndex:9999 }}>
        {toasts.map(t=>(
          <div key={t.id} style={{
            background:t.type==="success"?G.green+"1f":t.type==="error"?G.red+"1f":G.blue+"1f",
            border:`1px solid ${t.type==="success"?G.green+"55":t.type==="error"?G.red+"55":G.blue+"55"}`,
            color:t.type==="success"?G.green:t.type==="error"?G.red:G.text,
            padding:"10px 16px", borderRadius:"10px", fontFamily:F.body, fontSize:"13px",
            backdropFilter:"blur(8px)", animation:"slideIn 0.2s ease",
            boxShadow:`0 4px 20px ${G.navy}80`,
          }}>{t.msg}</div>
        ))}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap');
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.25} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes slideIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#1e3a5f; border-radius:3px; }
      `}</style>
    </div>
  );
}

function SpkLegend({ color, label }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
      <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:color }}/>
      <span style={{ fontFamily:F.mono, fontSize:"10px", color:G.dim }}>{label}</span>
    </div>
  );
}