import { useState, useCallback, useMemo } from "react";
import { InvokeLLM } from "@/integrations/Core";

(() => {
  if (document.getElementById("ng-css")) return;
  const l = document.createElement("link"); l.id = "ng-f"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "ng-css";
  s.textContent = `
    *{box-sizing:border-box;}
    @keyframes ngIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
    @keyframes ngSpin{to{transform:rotate(360deg)}}
    @keyframes ngPop{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}
    .ng-in{animation:ngIn .2s ease both;}
    .ng-pop{animation:ngPop .15s ease both;}
    .ng-hov:hover{background:rgba(255,255,255,.06)!important;}
    .ng-copy-btn{transition:all .15s;}
    .ng-copy-btn:hover{filter:brightness(1.2);}
    ::-webkit-scrollbar{width:3px;height:3px;}
    ::-webkit-scrollbar-thumb{background:rgba(0,180,216,.22);border-radius:2px;}
    input::placeholder,textarea::placeholder{color:rgba(221,230,240,.18);}
    input:focus,textarea:focus,select:focus{border-color:rgba(0,180,216,.55)!important;outline:none;}
    select option{background:#0d1b2e;}
    .ng-tag{cursor:pointer;transition:all .13s;user-select:none;}
    .ng-tag:hover{opacity:.8;}
  `;
  document.head.appendChild(s);
})();

const T = {
  bg:"#07111f", card:"rgba(255,255,255,0.04)", bdr:"rgba(255,255,255,0.08)",
  teal:"#00b4d8", tD:"rgba(0,180,216,0.12)", tB:"rgba(0,180,216,0.25)",
  gold:"#f0a500", gD:"rgba(240,165,0,0.12)",
  coral:"#ff6060", cD:"rgba(255,96,96,0.12)",
  green:"#4ade80", grnD:"rgba(74,222,128,0.1)",
  purple:"#9b6dff", pD:"rgba(155,109,255,0.12)",
  txt:"#dde6f0", mut:"rgba(221,230,240,0.55)", dim:"rgba(221,230,240,0.28)",
};
const gl = (x={}) => ({backdropFilter:"blur(14px)",background:T.card,border:`1px solid ${T.bdr}`,borderRadius:12,...x});
const ib = (x={}) => ({width:"100%",background:"rgba(13,27,46,.8)",border:`1px solid ${T.bdr}`,borderRadius:8,padding:"8px 12px",color:T.txt,fontFamily:"DM Sans,sans-serif",fontSize:13,transition:"border-color .15s",...x});
const Sp = () => <span style={{display:"inline-block",width:12,height:12,border:"2px solid rgba(0,180,216,.2)",borderTopColor:T.teal,borderRadius:"50%",animation:"ngSpin .7s linear infinite"}}/>;

// ── ROS Systems ────────────────────────────────────────────────────────────────
const ROS_SYSTEMS = [
  { id:"const",   label:"Constitutional",   negatives:["fever","chills","night sweats","fatigue","weight loss","weight gain","appetite changes"] },
  { id:"heent",   label:"HEENT",            negatives:["headache","vision changes","diplopia","hearing loss","tinnitus","nasal congestion","sore throat","difficulty swallowing"] },
  { id:"cv",      label:"Cardiovascular",   negatives:["chest pain","chest pressure","palpitations","syncope","near-syncope","leg swelling","orthopnea","PND"] },
  { id:"resp",    label:"Respiratory",      negatives:["shortness of breath","cough","hemoptysis","wheezing","dyspnea on exertion","pleuritic chest pain"] },
  { id:"gi",      label:"GI / Abdominal",   negatives:["nausea","vomiting","diarrhea","constipation","abdominal pain","blood in stool","melena","heartburn"] },
  { id:"gu",      label:"GU / Urinary",     negatives:["dysuria","frequency","urgency","hematuria","discharge","pelvic pain","flank pain"] },
  { id:"msk",     label:"Musculoskeletal",  negatives:["joint pain","joint swelling","muscle pain","back pain","neck pain","limited range of motion"] },
  { id:"neuro",   label:"Neurological",     negatives:["dizziness","vertigo","weakness","numbness","tingling","tremor","seizure","memory problems","confusion"] },
  { id:"psych",   label:"Psychiatric",      negatives:["anxiety","depression","suicidal ideation","homicidal ideation","hallucinations","sleep disturbance"] },
  { id:"skin",    label:"Skin",             negatives:["rash","hives","itching","skin lesions","bruising","jaundice"] },
  { id:"endo",    label:"Endocrine",        negatives:["polydipsia","polyuria","heat/cold intolerance","excessive sweating"] },
  { id:"heme",    label:"Hematologic",      negatives:["easy bruising","easy bleeding","lymph node swelling","frequent infections"] },
];

// ── PE Systems ────────────────────────────────────────────────────────────────
const PE_SYSTEMS = [
  { id:"gen",   label:"General" },
  { id:"heent", label:"HEENT" },
  { id:"neck",  label:"Neck" },
  { id:"cv",    label:"Cardiovascular" },
  { id:"resp",  label:"Respiratory" },
  { id:"abd",   label:"Abdomen" },
  { id:"ext",   label:"Extremities" },
  { id:"skin",  label:"Skin" },
  { id:"neuro", label:"Neurological" },
  { id:"psych", label:"Psychiatric" },
];

// ── Copy Button ───────────────────────────────────────────────────────────────
function CopyBtn({text, label="Copy", color=T.teal, small=false}) {
  const [done, setDone] = useState(false);
  const copy = () => {
    if(!text?.trim()) return;
    navigator.clipboard?.writeText(text.trim()).then(()=>{
      setDone(true); setTimeout(()=>setDone(false), 1800);
    });
  };
  return(
    <button onClick={copy} className="ng-copy-btn" disabled={!text?.trim()} style={{
      padding: small?"3px 10px":"5px 14px",
      borderRadius:7, cursor:text?.trim()?"pointer":"not-allowed",
      border:`1px solid ${done?T.green+"55":color+"55"}`,
      background: done?T.grnD:`${color}14`,
      color: done?T.green:color,
      fontFamily:"JetBrains Mono,monospace", fontWeight:700,
      fontSize: small?9:10, letterSpacing:.5, flexShrink:0,
      opacity: text?.trim()?1:.35, transition:"all .15s",
    }}>
      {done?"✓ Copied":label}
    </button>
  );
}

// ── Section Card ──────────────────────────────────────────────────────────────
function SectionCard({label, color=T.teal, icon, text, extra, loading, children}) {
  return(
    <div style={{...gl({marginBottom:10,overflow:"hidden",borderLeft:`3px solid ${color}55`})}}>
      <div style={{padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:text||loading?`1px solid ${T.bdr}`:"none"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {icon&&<span style={{fontSize:14}}>{icon}</span>}
          <span style={{fontSize:11,fontWeight:700,color,fontFamily:"JetBrains Mono,monospace",letterSpacing:1,textTransform:"uppercase"}}>{label}</span>
          {loading&&<Sp/>}
          {extra}
        </div>
        {text&&<CopyBtn text={text} color={color}/>}
      </div>
      {(text||children)&&(
        <div style={{padding:"10px 14px"}}>
          {children||(text&&<p style={{margin:0,fontSize:12,color:T.txt,lineHeight:1.7,fontFamily:"DM Sans,sans-serif",whiteSpace:"pre-wrap"}}>{text}</p>)}
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function EDNoteGenerator() {
  // ── Core inputs
  const [cc,setCc]=useState("");
  const [duration,setDuration]=useState("");
  const [hpiPoints,setHpiPoints]=useState("");
  const [vitals,setVitals]=useState({bp:"",hr:"",rr:"",temp:"",o2:"",wt:""});
  const [dx,setDx]=useState("");
  const [plan,setPlan]=useState("");
  const [disposition,setDisposition]=useState("");
  const [mdmComplexity,setMdmComplexity]=useState("moderate");

  // ── ROS state: {system_id: {reviewed, positives, negatives:[checked]}}
  const [ros,setRos]=useState(()=>Object.fromEntries(ROS_SYSTEMS.map(s=>[s.id,{reviewed:false,positives:"",negChecked:[]}])));

  // ── PE state: {system_id: text}
  const [pe,setPe]=useState(()=>Object.fromEntries(PE_SYSTEMS.map(s=>[s.id,""])));

  // ── AI state
  const [hpiText,setHpiText]=useState("");
  const [hpiLoad,setHpiLoad]=useState(false);
  const [mdmText,setMdmText]=useState("");
  const [mdmLoad,setMdmLoad]=useState(false);

  // ── Include-heading toggle (some EHRs want just the value, not the label)
  const [inclHeading,setInclHeading]=useState(true);

  const setRosField=(id,field,val)=>setRos(p=>({...p,[id]:{...p[id],[field]:val}}));
  const toggleNeg=(sysId,neg)=>setRos(p=>{
    const cur=p[sysId].negChecked;
    return{...p,[sysId]:{...p[sysId],negChecked:cur.includes(neg)?cur.filter(n=>n!==neg):[...cur,neg]}};
  });
  const setAllNegs=(sysId,all)=>setRos(p=>({...p,[sysId]:{...p[sysId],negChecked:all?ROS_SYSTEMS.find(s=>s.id===sysId).negatives:[]}}));

  // ── Generate ROS text per system ──────────────────────────────────────────────
  const rosText = useCallback((sysId) => {
    const r = ros[sysId];
    if(!r.reviewed) return "";
    const parts = [];
    if(r.positives?.trim()) parts.push(`Positive for ${r.positives.trim()}`);
    if(r.negChecked.length>0) parts.push(`Denies ${r.negChecked.join(", ")}`);
    if(!r.positives?.trim() && r.negChecked.length===0) parts.push("No complaints");
    return parts.join(". ")+".";
  },[ros]);

  const rosSystemText = useCallback((sysId) => {
    const t = rosText(sysId);
    if(!t) return "";
    const sys = ROS_SYSTEMS.find(s=>s.id===sysId);
    return inclHeading?`${sys.label}: ${t}`:t;
  },[rosText,inclHeading]);

  const reviewedSystems = ROS_SYSTEMS.filter(s=>ros[s.id].reviewed);

  // ── Full ROS block
  const fullRosText = useMemo(()=>
    reviewedSystems.map(s=>rosSystemText(s.id)).filter(Boolean).join("\n")
  ,[reviewedSystems,rosSystemText]);

  // ── Vitals text
  const vitalsText = useMemo(()=>{
    const v=vitals;
    const parts=[v.bp&&`BP ${v.bp}`,v.hr&&`HR ${v.hr}`,v.rr&&`RR ${v.rr}`,
      v.temp&&`Temp ${v.temp}`,v.o2&&`O2 Sat ${v.o2}%`,v.wt&&`Wt ${v.wt} kg`].filter(Boolean);
    return parts.join(" | ");
  },[vitals]);

  // ── PE text per system
  const peText = useCallback((sysId) => {
    const t = pe[sysId]?.trim();
    if(!t) return "";
    const sys = PE_SYSTEMS.find(s=>s.id===sysId);
    return inclHeading?`${sys.label}: ${t}`:t;
  },[pe,inclHeading]);

  const fullPeText = useMemo(()=>
    PE_SYSTEMS.map(s=>pe[s.id]?.trim()?peText(s.id):"").filter(Boolean).join("\n")
  ,[pe,peText]);

  // ── Generate HPI via AI
  const genHPI = async() => {
    if(!cc||hpiLoad) return;
    setHpiLoad(true);
    try {
      const r = await InvokeLLM({
        prompt:`You are an emergency medicine physician. Write a concise, professional HPI paragraph for an ED chart note.
Chief complaint: ${cc}
Duration: ${duration||"not specified"}
Key points: ${hpiPoints||"not provided"}
Vitals: ${vitalsText||"not provided"}
Write in past tense, third person. One paragraph, 3-5 sentences. Clinical, chart-ready. No headers.`,
        response_json_schema:{type:"object",properties:{hpi:{type:"string"}},required:["hpi"]},
      });
      setHpiText(r.hpi||"");
    } catch{setHpiText("");}
    setHpiLoad(false);
  };

  // ── Generate MDM via AI
  const genMDM = async() => {
    if(!dx||mdmLoad) return;
    setMdmLoad(true);
    try {
      const r = await InvokeLLM({
        prompt:`You are an emergency medicine physician. Write an ED Medical Decision Making (MDM) section for a chart note.
Diagnosis/Assessment: ${dx}
Plan: ${plan||"not provided"}
Disposition: ${disposition||"not provided"}
MDM complexity: ${mdmComplexity}
Include: problem addressed, data reviewed/ordered, risk of complications, treatment plan rationale. Chart-ready prose, 3-5 sentences. No bullet points.`,
        response_json_schema:{type:"object",properties:{mdm:{type:"string"}},required:["mdm"]},
      });
      setMdmText(r.mdm||"");
    } catch{setMdmText("");}
    setMdmLoad(false);
  };

  // ── A/P text
  const apText = useMemo(()=>{
    const lines=[dx&&`Assessment: ${dx}`,plan&&`Plan: ${plan}`,disposition&&`Disposition: ${disposition}`].filter(Boolean);
    return lines.join("\n");
  },[dx,plan,disposition]);

  // ── Full note
  const fullNote = useMemo(()=>[
    cc&&`CC: ${cc}${duration?` x ${duration}`:""}`,
    vitalsText&&`Vitals: ${vitalsText}`,
    hpiText&&`HPI:\n${hpiText}`,
    fullRosText&&`ROS:\n${fullRosText}`,
    fullPeText&&`Physical Exam:\n${fullPeText}`,
    mdmText&&`MDM:\n${mdmText}`,
    apText&&`${apText}`,
  ].filter(Boolean).join("\n\n"),[cc,duration,vitalsText,hpiText,fullRosText,fullPeText,mdmText,apText]);

  const [activeTab,setActiveTab]=useState("hpi");
  const TABS=[["hpi","📝 HPI"],["ros","🔍 ROS"],["pe","🩺 PE"],["ap","📋 A/P"]];

  return(
    <div style={{background:T.bg,minHeight:"100vh",fontFamily:"DM Sans,sans-serif",color:T.txt,display:"grid",gridTemplateColumns:"1fr 380px",gap:0,alignItems:"start"}}>

      {/* ── LEFT: Input Panel ─────────────────────────────────────────────── */}
      <div style={{padding:"20px 18px 60px",borderRight:`1px solid ${T.bdr}`,minHeight:"100vh"}}>

        {/* Header */}
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:20}}>
          <div style={{width:44,height:44,borderRadius:11,background:T.tD,border:`1px solid ${T.tB}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>📝</div>
          <div>
            <h1 style={{margin:0,fontFamily:"Playfair Display,serif",fontSize:22,color:T.teal,letterSpacing:"-0.5px",lineHeight:1}}>ED Note Generator</h1>
            <p style={{margin:"3px 0 0",fontSize:12,color:T.mut}}>Section-by-section copy · Per-system ROS · EHR-ready</p>
          </div>
        </div>

        {/* CC + Duration */}
        <div style={{...gl({padding:"12px 16px",marginBottom:12})}}>
          <div style={{fontSize:9,color:T.teal,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}}>Chief Complaint</div>
          <div style={{display:"flex",gap:10}}>
            <div style={{flex:2}}>
              <div style={{fontSize:8,color:T.dim,fontFamily:"JetBrains Mono,monospace",letterSpacing:1,textTransform:"uppercase",marginBottom:3}}>Complaint</div>
              <input value={cc} onChange={e=>setCc(e.target.value)} placeholder="e.g. Chest pain, shortness of breath, abdominal pain..." style={{...ib()}}/>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:8,color:T.dim,fontFamily:"JetBrains Mono,monospace",letterSpacing:1,textTransform:"uppercase",marginBottom:3}}>Duration</div>
              <input value={duration} onChange={e=>setDuration(e.target.value)} placeholder="e.g. 2 hours, 3 days" style={{...ib()}}/>
            </div>
          </div>
        </div>

        {/* Vitals */}
        <div style={{...gl({padding:"12px 16px",marginBottom:12})}}>
          <div style={{fontSize:9,color:T.gold,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}}>Vital Signs</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
            {[["BP","bp","120/80"],["HR","hr","72"],["RR","rr","16"],["Temp","temp","98.6°F"],["O2 Sat","o2","98%"],["Weight","wt","kg"]].map(([l,k,ph])=>(
              <div key={k}>
                <div style={{fontSize:8,color:T.dim,fontFamily:"JetBrains Mono,monospace",letterSpacing:1,textTransform:"uppercase",marginBottom:3}}>{l}</div>
                <input value={vitals[k]} onChange={e=>setVitals(p=>({...p,[k]:e.target.value}))} placeholder={ph}
                  style={{...ib({fontSize:12,padding:"6px 10px"})}}/>
              </div>
            ))}
          </div>
        </div>

        {/* Section tabs */}
        <div style={{display:"flex",gap:4,marginBottom:12,background:T.card,borderRadius:9,padding:3,border:`1px solid ${T.bdr}`}}>
          {TABS.map(([id,l])=>(
            <button key={id} onClick={()=>setActiveTab(id)} style={{flex:1,padding:"7px 6px",borderRadius:7,border:"none",cursor:"pointer",fontFamily:"DM Sans,sans-serif",fontSize:12,fontWeight:700,background:activeTab===id?T.teal:"transparent",color:activeTab===id?"#060e1a":T.mut,transition:"all .16s"}}>{l}</button>
          ))}
        </div>

        {/* HPI Tab */}
        {activeTab==="hpi"&&(
          <div className="ng-in">
            <div style={{...gl({padding:"12px 16px",marginBottom:10})}}>
              <div style={{fontSize:9,color:T.teal,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>HPI Key Points</div>
              <textarea value={hpiPoints} onChange={e=>setHpiPoints(e.target.value)} rows={5}
                placeholder={"Enter key HPI points — AI will convert to chart prose:\n• Onset, location, quality, severity\n• Radiation, associated symptoms\n• Timing, modifying factors\n• Pertinent positives and negatives\n• Relevant PMHx, meds, allergies"}
                style={{...ib({resize:"vertical",lineHeight:1.7,marginBottom:10})}}/>
              <button onClick={genHPI} disabled={!cc||hpiLoad} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 18px",borderRadius:9,cursor:cc?"pointer":"not-allowed",border:`1px solid ${T.teal}55`,background:T.tD,color:T.teal,fontFamily:"DM Sans,sans-serif",fontSize:13,fontWeight:700,opacity:!cc||hpiLoad?.5:1}}>
                {hpiLoad?<><Sp/>Generating HPI...</>:"⚡ Generate HPI Prose"}
              </button>
              {hpiText&&(
                <div style={{marginTop:10}}>
                  <div style={{fontSize:8,color:T.dim,fontFamily:"JetBrains Mono,monospace",letterSpacing:1,textTransform:"uppercase",marginBottom:5}}>Edit if needed</div>
                  <textarea value={hpiText} onChange={e=>setHpiText(e.target.value)} rows={5}
                    style={{...ib({resize:"vertical",lineHeight:1.7,border:`1px solid ${T.teal}40`})}}/>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ROS Tab */}
        {activeTab==="ros"&&(
          <div className="ng-in">
            <div style={{...gl({padding:"10px 14px",marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center"})}}>
              <span style={{fontSize:11,color:T.mut}}>{reviewedSystems.length} of {ROS_SYSTEMS.length} systems reviewed</span>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>setRos(p=>Object.fromEntries(Object.entries(p).map(([k,v])=>[k,{...v,reviewed:true}])))} style={{fontSize:10,padding:"3px 9px",borderRadius:6,cursor:"pointer",border:`1px solid ${T.teal}55`,background:T.tD,color:T.teal,fontWeight:700,fontFamily:"DM Sans,sans-serif"}}>All Reviewed</button>
                <button onClick={()=>setRos(p=>Object.fromEntries(Object.entries(p).map(([k,v])=>[k,{...v,reviewed:false}])))} style={{fontSize:10,padding:"3px 9px",borderRadius:6,cursor:"pointer",border:`1px solid ${T.bdr}`,background:"transparent",color:T.dim,fontFamily:"DM Sans,sans-serif"}}>Clear All</button>
              </div>
            </div>
            {ROS_SYSTEMS.map(sys=>{
              const r=ros[sys.id];
              return(
                <div key={sys.id} style={{...gl({marginBottom:7,overflow:"hidden",opacity:r.reviewed?1:.55,transition:"opacity .15s"})}}>
                  {/* System header */}
                  <div style={{padding:"8px 14px",display:"flex",alignItems:"center",gap:10,cursor:"pointer",background:r.reviewed?T.tD:"transparent",transition:"background .15s"}}
                    onClick={()=>setRosField(sys.id,"reviewed",!r.reviewed)}>
                    <div style={{width:18,height:18,borderRadius:5,border:`2px solid ${r.reviewed?T.teal:T.bdr}`,background:r.reviewed?T.teal:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .15s"}}>
                      {r.reviewed&&<span style={{fontSize:10,color:"#060e1a",fontWeight:900}}>✓</span>}
                    </div>
                    <span style={{fontSize:12,fontWeight:700,color:r.reviewed?T.teal:T.mut}}>{sys.label}</span>
                    {r.reviewed&&rosText(sys.id)&&(
                      <span style={{fontSize:10,color:T.mut,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{rosText(sys.id).slice(0,60)}...</span>
                    )}
                  </div>

                  {r.reviewed&&(
                    <div style={{padding:"8px 14px",borderTop:`1px solid ${T.bdr}`}}>
                      {/* Positives */}
                      <div style={{marginBottom:8}}>
                        <div style={{fontSize:8,color:T.coral,fontFamily:"JetBrains Mono,monospace",letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>Positive Findings</div>
                        <input value={r.positives} onChange={e=>setRosField(sys.id,"positives",e.target.value)}
                          placeholder="e.g. chest pain x 2h radiating to left arm..."
                          style={{...ib({fontSize:12,padding:"6px 10px"})}}/>
                      </div>
                      {/* Negatives */}
                      <div style={{marginBottom:8}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                          <div style={{fontSize:8,color:T.dim,fontFamily:"JetBrains Mono,monospace",letterSpacing:1,textTransform:"uppercase"}}>Pertinent Negatives</div>
                          <div style={{display:"flex",gap:5}}>
                            <span onClick={()=>setAllNegs(sys.id,true)} style={{fontSize:9,color:T.teal,cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>All</span>
                            <span style={{fontSize:9,color:T.dim}}>·</span>
                            <span onClick={()=>setAllNegs(sys.id,false)} style={{fontSize:9,color:T.dim,cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>None</span>
                          </div>
                        </div>
                        <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                          {sys.negatives.map(neg=>{
                            const checked=r.negChecked.includes(neg);
                            return(
                              <span key={neg} className="ng-tag" onClick={()=>toggleNeg(sys.id,neg)} style={{
                                padding:"3px 10px",borderRadius:20,fontSize:11,
                                border:`1px solid ${checked?T.teal+"55":T.bdr}`,
                                background:checked?T.tD:"transparent",
                                color:checked?T.teal:T.dim,
                                fontFamily:"DM Sans,sans-serif",fontWeight:checked?700:400,
                              }}>{neg}</span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* PE Tab */}
        {activeTab==="pe"&&(
          <div className="ng-in">
            <div style={{fontSize:11,color:T.mut,marginBottom:12,lineHeight:1.6}}>
              Enter exam findings per system. Leave blank to omit from note.
            </div>
            {PE_SYSTEMS.map(sys=>(
              <div key={sys.id} style={{marginBottom:8}}>
                <div style={{fontSize:8,color:T.gold,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:3}}>{sys.label}</div>
                <input value={pe[sys.id]} onChange={e=>setPe(p=>({...p,[sys.id]:e.target.value}))}
                  placeholder={({gen:"Alert and oriented x3, no acute distress",cv:"Regular rate and rhythm, no murmurs",resp:"Clear to auscultation bilaterally",abd:"Soft, non-tender, non-distended",neuro:"Cranial nerves intact, no focal deficits"}[sys.id]||"")}
                  style={{...ib({fontSize:12,padding:"6px 10px"})}}/>
              </div>
            ))}
          </div>
        )}

        {/* A/P Tab */}
        {activeTab==="ap"&&(
          <div className="ng-in">
            <div style={{...gl({padding:"12px 16px",marginBottom:10})}}>
              <div style={{fontSize:9,color:T.purple,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}}>Assessment / Plan</div>
              {[["Assessment / Diagnosis","dx",dx,setDx,"e.g. Acute NSTEMI, Sepsis secondary to pneumonia, Cellulitis right leg","text"],
                ["Plan","plan",plan,setPlan,"e.g. Serial troponins, IV antibiotics, admit cardiology...","textarea"],
                ["Disposition","disposition",disposition,setDisposition,"Discharge, Admit floor, Admit ICU, Transfer...","text"]].map(([l,k,v,set,ph,type])=>(
                <div key={k} style={{marginBottom:10}}>
                  <div style={{fontSize:8,color:T.dim,fontFamily:"JetBrains Mono,monospace",letterSpacing:1,textTransform:"uppercase",marginBottom:3}}>{l}</div>
                  {type==="textarea"
                    ?<textarea value={v} onChange={e=>set(e.target.value)} rows={4} placeholder={ph} style={{...ib({resize:"vertical",lineHeight:1.6})}}/>
                    :<input value={v} onChange={e=>set(e.target.value)} placeholder={ph} style={{...ib()}}/>
                  }
                </div>
              ))}
              <div style={{marginBottom:10}}>
                <div style={{fontSize:8,color:T.dim,fontFamily:"JetBrains Mono,monospace",letterSpacing:1,textTransform:"uppercase",marginBottom:5}}>MDM Complexity</div>
                <div style={{display:"flex",gap:6}}>
                  {["straightforward","low","moderate","high"].map(c=>(
                    <button key={c} onClick={()=>setMdmComplexity(c)} style={{flex:1,padding:"6px 4px",borderRadius:7,cursor:"pointer",border:`1px solid ${mdmComplexity===c?T.purple+"55":T.bdr}`,background:mdmComplexity===c?T.pD:"transparent",color:mdmComplexity===c?T.purple:T.dim,fontSize:10,fontWeight:mdmComplexity===c?700:400,fontFamily:"DM Sans,sans-serif",textTransform:"capitalize"}}>{c}</button>
                  ))}
                </div>
              </div>
              <button onClick={genMDM} disabled={!dx||mdmLoad} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 18px",borderRadius:9,cursor:dx?"pointer":"not-allowed",border:`1px solid ${T.purple}55`,background:T.pD,color:T.purple,fontFamily:"DM Sans,sans-serif",fontSize:13,fontWeight:700,opacity:!dx||mdmLoad?.5:1}}>
                {mdmLoad?<><Sp/>Generating MDM...</>:"⚡ Generate MDM"}
              </button>
              {mdmText&&(
                <div style={{marginTop:10}}>
                  <div style={{fontSize:8,color:T.dim,fontFamily:"JetBrains Mono,monospace",letterSpacing:1,textTransform:"uppercase",marginBottom:5}}>Edit if needed</div>
                  <textarea value={mdmText} onChange={e=>setMdmText(e.target.value)} rows={5}
                    style={{...ib({resize:"vertical",lineHeight:1.7,border:`1px solid ${T.purple}40`})}}/>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── RIGHT: Output Panel ───────────────────────────────────────────── */}
      <div style={{padding:"20px 18px 60px",position:"sticky",top:0,maxHeight:"100vh",overflowY:"auto"}}>

        {/* Output header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div>
            <div style={{fontFamily:"Playfair Display,serif",fontSize:16,color:T.teal,fontWeight:700}}>Note Output</div>
            <div style={{fontSize:11,color:T.mut}}>Click any section to copy</div>
          </div>
          <div style={{display:"flex",gap:7,alignItems:"center"}}>
            <button onClick={()=>setInclHeading(p=>!p)} style={{fontSize:10,padding:"4px 10px",borderRadius:6,cursor:"pointer",border:`1px solid ${inclHeading?T.teal+"55":T.bdr}`,background:inclHeading?T.tD:"transparent",color:inclHeading?T.teal:T.dim,fontFamily:"DM Sans,sans-serif",fontWeight:700}}>
              {inclHeading?"Headings On":"Headings Off"}
            </button>
            <CopyBtn text={fullNote} label="Copy Full Note" color={T.teal}/>
          </div>
        </div>

        {/* CC + Vitals */}
        {(cc||vitalsText)&&(
          <SectionCard label="CC / Vitals" color={T.gold} icon="🏥"
            text={[cc&&`${cc}${duration?` x ${duration}`:""}`,vitalsText].filter(Boolean).join("\n")}>
          </SectionCard>
        )}

        {/* HPI */}
        <SectionCard label="HPI" color={T.teal} icon="📝" text={hpiText} loading={hpiLoad}>
          {!hpiText&&!hpiLoad&&<p style={{margin:0,fontSize:11,color:T.dim,fontStyle:"italic"}}>Complete HPI tab and generate prose →</p>}
        </SectionCard>

        {/* ROS — each system individually */}
        {reviewedSystems.length>0&&(
          <div style={{...gl({marginBottom:10,overflow:"hidden",borderLeft:`3px solid ${T.purple}55`})}}>
            <div style={{padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${T.bdr}`}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:14}}>🔍</span>
                <span style={{fontSize:11,fontWeight:700,color:T.purple,fontFamily:"JetBrains Mono,monospace",letterSpacing:1,textTransform:"uppercase"}}>ROS</span>
                <span style={{fontSize:10,color:T.dim}}>{reviewedSystems.length} systems</span>
              </div>
              <CopyBtn text={fullRosText} label="Copy All" color={T.purple}/>
            </div>
            <div style={{padding:"8px 12px",display:"flex",flexDirection:"column",gap:4}}>
              {reviewedSystems.map(sys=>{
                const txt=rosSystemText(sys.id);
                return txt?(
                  <div key={sys.id} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,padding:"5px 8px",borderRadius:7,background:"rgba(0,0,0,.15)"}}>
                    <div>
                      <span style={{fontSize:9,color:T.purple,fontFamily:"JetBrains Mono,monospace",fontWeight:700}}>{sys.label}: </span>
                      <span style={{fontSize:11,color:T.txt,lineHeight:1.5}}>{rosText(sys.id)}</span>
                    </div>
                    <CopyBtn text={inclHeading?txt:rosText(sys.id)} label="Copy" color={T.purple} small/>
                  </div>
                ):null;
              })}
            </div>
          </div>
        )}

        {/* PE — each system individually */}
        {PE_SYSTEMS.some(s=>pe[s.id]?.trim())&&(
          <div style={{...gl({marginBottom:10,overflow:"hidden",borderLeft:`3px solid ${T.gold}55`})}}>
            <div style={{padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${T.bdr}`}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:14}}>🩺</span>
                <span style={{fontSize:11,fontWeight:700,color:T.gold,fontFamily:"JetBrains Mono,monospace",letterSpacing:1,textTransform:"uppercase"}}>Physical Exam</span>
              </div>
              <CopyBtn text={fullPeText} label="Copy All" color={T.gold}/>
            </div>
            <div style={{padding:"8px 12px",display:"flex",flexDirection:"column",gap:4}}>
              {PE_SYSTEMS.filter(s=>pe[s.id]?.trim()).map(sys=>{
                const txt=peText(sys.id);
                return(
                  <div key={sys.id} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,padding:"5px 8px",borderRadius:7,background:"rgba(0,0,0,.15)"}}>
                    <div>
                      <span style={{fontSize:9,color:T.gold,fontFamily:"JetBrains Mono,monospace",fontWeight:700}}>{sys.label}: </span>
                      <span style={{fontSize:11,color:T.txt,lineHeight:1.5}}>{pe[sys.id]}</span>
                    </div>
                    <CopyBtn text={inclHeading?txt:pe[sys.id]} label="Copy" color={T.gold} small/>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MDM */}
        <SectionCard label="MDM" color={T.purple} icon="🧠" text={mdmText} loading={mdmLoad}>
          {!mdmText&&!mdmLoad&&<p style={{margin:0,fontSize:11,color:T.dim,fontStyle:"italic"}}>Complete A/P tab and generate MDM →</p>}
        </SectionCard>

        {/* A/P */}
        {apText&&<SectionCard label="Assessment / Plan" color={T.coral} icon="📋" text={apText}/>}

        {/* Empty state */}
        {!cc&&!hpiText&&reviewedSystems.length===0&&!PE_SYSTEMS.some(s=>pe[s.id])&&!apText&&(
          <div style={{textAlign:"center",padding:"40px 20px",color:T.dim}}>
            <div style={{fontSize:32,marginBottom:10}}>📝</div>
            <div style={{fontSize:13,color:T.mut,marginBottom:5}}>Start with the Chief Complaint</div>
            <div style={{fontSize:11}}>Each section will appear here with its own copy button</div>
          </div>
        )}

        <div style={{marginTop:20,fontSize:9,color:T.dim,textAlign:"center",fontFamily:"JetBrains Mono,monospace",letterSpacing:1}}>
          NOTRYA · ED NOTE GENERATOR · AI-ASSISTED · PHYSICIAN REVIEW REQUIRED
        </div>
      </div>
    </div>
  );
}