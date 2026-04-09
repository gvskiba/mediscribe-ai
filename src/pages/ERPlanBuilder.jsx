import { useState, useCallback, useRef, useMemo } from "react";
import { base44 } from "@/api/base44Client";

// ── Font + CSS ────────────────────────────────────────────────────────────────
(() => {
  if (document.getElementById("erp-fonts")) return;
  const l = document.createElement("link"); l.id = "erp-fonts";
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "erp-css";
  s.textContent = `
    @keyframes erp-in     { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
    @keyframes erp-spin   { to{transform:rotate(360deg)} }
    @keyframes erp-msg    { from{opacity:0;transform:translateX(6px)} to{opacity:1;transform:translateX(0)} }
    @keyframes erp-shimmer{ 0%{background-position:-200% center}100%{background-position:200% center} }
    .erp-in  { animation: erp-in .22s ease forwards; }
    .erp-msg { animation: erp-msg .18s ease forwards; }
    .erp-shimmer{background:linear-gradient(90deg,#e8f0fe 0%,#fff 30%,#3b9eff 55%,#00e5c0 75%,#e8f0fe 100%);background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:erp-shimmer 5s linear infinite;}
    ::-webkit-scrollbar{width:3px;height:3px;}
    ::-webkit-scrollbar-track{background:transparent;}
    ::-webkit-scrollbar-thumb{background:rgba(42,77,114,0.5);border-radius:2px;}
    .erp-dx{transition:background .12s;} .erp-dx:hover{background:rgba(22,45,79,0.6)!important;}
    .erp-cm{transition:all .13s;cursor:pointer;} .erp-cm:hover{transform:translateY(-1px);}
    .erp-qbtn{transition:all .13s;cursor:pointer;} .erp-qbtn:hover{background:rgba(0,229,192,0.1)!important;border-color:rgba(0,229,192,0.35)!important;color:#00e5c0!important;}
    textarea{resize:none;} input{outline:none;}
  `;
  document.head.appendChild(s);
})();

// ── Tokens ────────────────────────────────────────────────────────────────────
const T = {
  bg:"#050f1e",panel:"#081628",card:"#0b1e36",up:"#0e2544",
  b:"rgba(26,53,85,0.8)",bhi:"rgba(42,79,122,0.9)",
  txt:"#e8f0fe",txt2:"#8aaccc",txt3:"#4a6a8a",txt4:"#2e4a6a",
  coral:"#ff6b6b",gold:"#f5c842",teal:"#00e5c0",blue:"#3b9eff",
  orange:"#ff9f43",purple:"#9b6dff",green:"#3dffa0",
};
const glass = (x={}) => ({backdropFilter:"blur(24px) saturate(200%)",WebkitBackdropFilter:"blur(24px) saturate(200%)",background:"rgba(8,22,40,0.78)",border:"1px solid rgba(26,53,85,0.5)",borderRadius:14,...x});
const deep  = (x={}) => ({backdropFilter:"blur(40px) saturate(220%)",WebkitBackdropFilter:"blur(40px) saturate(220%)",background:"rgba(5,15,30,0.9)",border:"1px solid rgba(26,53,85,0.7)",...x});
const inp   = (focus=false,x={}) => ({width:"100%",background:"rgba(14,37,68,0.8)",border:`1px solid ${focus?"rgba(59,158,255,0.6)":"rgba(26,53,85,0.55)"}`,borderRadius:9,padding:"9px 12px",color:T.txt,fontFamily:"DM Sans,sans-serif",fontSize:13,outline:"none",boxSizing:"border-box",transition:"border-color .15s",...x});

// ── Clinical data ─────────────────────────────────────────────────────────────
const CANT_MISS = {
  chest:   ["ACS / STEMI","Aortic dissection","Pulmonary embolism","Tension pneumothorax","Cardiac tamponade","Esophageal rupture"],
  head:    ["Subarachnoid hemorrhage","Bacterial meningitis","Hypertensive emergency","CVST","Vertebral artery dissection"],
  dyspnea: ["Pulmonary embolism","Tension pneumothorax","Acute MI","Epiglottitis","Anaphylaxis"],
  abdomen: ["Ruptured AAA","Mesenteric ischemia","Bowel perforation","Ectopic pregnancy","Aortic dissection"],
  back:    ["Aortic dissection","Ruptured AAA","Epidural abscess","Spinal cord compression"],
  syncope: ["Ventricular arrhythmia","Aortic stenosis","HOCM","Pulmonary embolism","SAH"],
  neuro:   ["Intracranial hemorrhage","Ischemic stroke","CNS infection","Herniation","CVST"],
  default: ["Sepsis","Pulmonary embolism","ACS","Aortic dissection","Intracranial hemorrhage"],
};
const DATA_OPTS = [
  "Review of prior external notes","Review of each unique test result","Order of each unique test",
  "Independent interpretation of imaging study","Independent interpretation of ECG / tracing",
  "Discussion with treating/consulting physician","Independent historian obtained",
  "Review of external records (prior ED, PCP, specialist)","Prescription drug monitoring (PDMP) review",
];
const RISK_C = {
  high:{ bg:"rgba(255,107,107,0.1)", bd:"rgba(255,107,107,0.3)", txt:T.coral  },
  mod: { bg:"rgba(255,159,67,0.1)",  bd:"rgba(255,159,67,0.25)", txt:T.orange },
  low: { bg:"rgba(61,255,160,0.06)", bd:"rgba(61,255,160,0.2)",  txt:T.green  },
};
const QUICK = {
  plan:  [
    { l:"✦ Full Plan",      p:"Generate a complete evidence-based ED plan: working diagnosis, priority differential with explicit risk stratification (high/moderate/low), can't-miss diagnoses with exclusion criteria, and overall treatment strategy." },
    { l:"⊕ Differential",  p:"Generate a priority differential diagnosis for this presentation with risk levels and one or two key distinguishing features per diagnosis." },
    { l:"⚑ Can't-Miss",     p:"What are the can't-miss diagnoses for this presentation? For each one, provide the key criteria or findings that would support or exclude it." },
    { l:"⊙ Risk Stratify",  p:"Apply relevant risk stratification tools for this presentation (e.g., HEART score, Wells, PERC, CURB-65, ABCD2). What risk category is this patient in?" },
  ],
  mdm: [
    { l:"⊕ Estimate MDM",   p:"Based on this patient's presentation, what MDM complexity level is most likely supported under AMA 2021 guidelines, and why?" },
    { l:"⊙ Risk Level",     p:"What risk of complications, morbidity, or mortality best describes this encounter for MDM coding purposes? Explain the key factors." },
    { l:"⊙ Coding Guidance",p:"What E/M code does this encounter most likely support, and what documentation should I ensure is present?" },
  ],
  ap:  [
    { l:"✦ Draft A&P",      p:"Draft an Assessment and Plan note section for this ED encounter. Use numbered problem format. Include clinical reasoning and disposition paragraph at the end." },
    { l:"⊙ Strengthen",     p:"Review the clinical picture and suggest what additional reasoning or documentation would strengthen the A&P for this encounter." },
  ],
  dispo:[
    { l:"⊕ Disposition",   p:"What disposition is most appropriate for this patient and what evidence-based criteria support that decision?" },
    { l:"⊙ Safe Discharge", p:"What safety criteria must be met before discharge? List the most important return precautions for this presentation." },
    { l:"⚑ Admit Criteria", p:"What are the evidence-based admission criteria for this presentation? What risk factors tip the balance toward admission vs discharge?" },
  ],
};
function computeMDM(probs, data, risk) {
  const pv = {none:0,minimal:0.5,low:1,mod:2,high:3}[probs]??0;
  const dv = data.length >= 3 ? 3 : data.length >= 1 ? 1 : 0;
  const rv = {none:0,minimal:0.5,low:1,mod:2,high:3}[risk]??0;
  const s  = Math.max(pv, dv, rv);
  if (s >= 3) return { label:"High complexity",     code:"99215 / 99285", color:T.coral  };
  if (s >= 2) return { label:"Moderate complexity", code:"99214 / 99284", color:T.gold   };
  if (s >= 1) return { label:"Low complexity",      code:"99213 / 99283", color:T.teal   };
  if (s > 0)  return { label:"Straightforward",     code:"99212 / 99282", color:T.txt3   };
  return null;
}

// ── DxRow ─────────────────────────────────────────────────────────────────────
function DxRow({ item, index, onRemove, onRiskChange, onRatChange }) {
  const [showRat, setShowRat] = useState(!!item.rationale);
  const r = RISK_C[item.risk] || RISK_C.mod;
  return (
    <div className="erp-dx" style={{ ...glass({borderRadius:9,background:"rgba(11,30,54,0.6)"}), padding:"10px 12px", marginBottom:6 }}>
      <div style={{ display:"flex", alignItems:"center", gap:9 }}>
        <span style={{ fontFamily:"JetBrains Mono", fontSize:10, color:T.txt4, flexShrink:0 }}>{String(index+1).padStart(2,"0")}</span>
        <span style={{ fontFamily:"DM Sans", fontWeight:600, fontSize:13, color:T.txt, flex:1, minWidth:0 }}>{item.dx}</span>
        <div style={{ display:"flex", gap:3 }}>
          {["high","mod","low"].map(lvl => (
            <button key={lvl} onClick={()=>onRiskChange(item.id,lvl)}
              style={{ padding:"2px 7px", borderRadius:5, fontFamily:"JetBrains Mono", fontSize:9, fontWeight:700, cursor:"pointer", border:`1px solid ${item.risk===lvl?RISK_C[lvl].bd:"rgba(26,53,85,0.35)"}`, background:item.risk===lvl?RISK_C[lvl].bg:"transparent", color:item.risk===lvl?RISK_C[lvl].txt:T.txt4, textTransform:"uppercase", transition:"all .1s" }}>
              {lvl}
            </button>
          ))}
        </div>
        <button onClick={()=>onRemove(item.id)} style={{ background:"none",border:"none",color:T.txt4,cursor:"pointer",fontSize:13,padding:2,lineHeight:1 }}>✕</button>
      </div>
      {showRat ? (
        <input value={item.rationale} onChange={e=>onRatChange(item.id,e.target.value)}
          placeholder="Key supporting findings..." style={{ ...inp(false,{marginTop:7,fontSize:11.5,padding:"5px 9px",color:T.txt2}) }}/>
      ) : (
        <button onClick={()=>setShowRat(true)} style={{ background:"none",border:"none",color:T.txt4,fontSize:11,cursor:"pointer",padding:"3px 0 0 28px",fontFamily:"DM Sans" }}>
          + add rationale
        </button>
      )}
    </div>
  );
}

// ── ERPlanBuilder ─────────────────────────────────────────────────────────────
export default function ERPlanBuilder({ embedded, patientAge, patientSex, patientCC, patientVitals, patientAllergies, patientMedications }) {
  const [activeTab,  setActiveTab]  = useState("plan");
  const [workingDx,  setWorkingDx]  = useState("");
  const [ddx,        setDdx]        = useState([]);
  const [dxInput,    setDxInput]    = useState("");
  const [dxRisk,     setDxRisk]     = useState("mod");
  const [cantOn,     setCantOn]     = useState([]);
  const [treatment,  setTreatment]  = useState("");
  const [mdmProbs,   setMdmProbs]   = useState("");
  const [mdmData,    setMdmData]    = useState([]);
  const [mdmRisk,    setMdmRisk]    = useState("");
  const [apDraft,    setApDraft]    = useState("");
  const [apBusy,     setApBusy]     = useState(false);
  const [dispChoice, setDispChoice] = useState("");
  const [dispSvc,    setDispSvc]    = useState("");
  const [dispCrit,   setDispCrit]   = useState("");
  const [followUp,   setFollowUp]   = useState("");
  const [returnPrec, setReturnPrec] = useState("");
  const [aiMsgs,     setAiMsgs]     = useState([{ role:"assistant", content:"Plan Advisor ready. Enter working diagnosis and chief complaint, then use the quick actions or ask a clinical question." }]);
  const [aiInput,    setAiInput]    = useState("");
  const [aiBusy,     setAiBusy]     = useState(false);
  const aiEnd = useRef(null);

  const cantList = useMemo(() => {
    const cc = (patientCC||"").toLowerCase();
    const k  = Object.keys(CANT_MISS).find(k=>cc.includes(k)) || "default";
    return CANT_MISS[k];
  }, [patientCC]);
  const mdmResult   = useMemo(()=>computeMDM(mdmProbs,mdmData,mdmRisk), [mdmProbs,mdmData,mdmRisk]);
  const planActive  = !!(workingDx && ddx.length > 0);

  const addDx = useCallback(()=>{
    if (!dxInput.trim()) return;
    setDdx(p=>[...p,{id:Date.now(),dx:dxInput.trim(),risk:dxRisk,rationale:""}]);
    setDxInput(""); setDxRisk("mod");
  },[dxInput,dxRisk]);

  const removeDx  = useCallback((id)=>setDdx(p=>p.filter(x=>x.id!==id)),[]);
  const riskDx    = useCallback((id,r)=>setDdx(p=>p.map(x=>x.id===id?{...x,risk:r}:x)),[]);
  const ratDx     = useCallback((id,v)=>setDdx(p=>p.map(x=>x.id===id?{...x,rationale:v}:x)),[]);
  const toggleCM  = useCallback((cm)=>setCantOn(p=>p.includes(cm)?p.filter(x=>x!==cm):[...p,cm]),[]);
  const toggleMDM = useCallback((opt)=>setMdmData(p=>p.includes(opt)?p.filter(x=>x!==opt):[...p,opt]),[]);

  const ctx = useCallback(()=>
    `${patientAge||"?"}y ${patientSex||""} — CC: ${patientCC||"not entered"}. Working Dx: ${workingDx||"none"}. DDx: ${ddx.map(d=>`${d.dx}(${d.risk})`).join(", ")||"none"}. Meds: ${(patientMedications||[]).join(", ")||"none"}. Allergies: ${(patientAllergies||[]).join(", ")||"NKDA"}.`,
  [patientAge,patientSex,patientCC,workingDx,ddx,patientMedications,patientAllergies]);

  const sendAI = useCallback(async(prompt)=>{
    const msg = prompt||aiInput.trim();
    if (!msg||aiBusy) return;
    setAiInput("");
    setAiMsgs(p=>[...p,{role:"user",content:msg}]);
    setAiBusy(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt:`You are a senior emergency medicine physician. Patient: ${ctx()}\n\n${msg}\n\nBe concise and clinician-level. Use bullet points when appropriate. Focus on clinical reasoning, not order entry.`
      });
      setAiMsgs(p=>[...p,{role:"assistant",content:res}]);
      setTimeout(()=>aiEnd.current?.scrollIntoView({behavior:"smooth"}),80);
    } catch { setAiMsgs(p=>[...p,{role:"assistant",content:"AI advisor unavailable."}]); }
    finally  { setAiBusy(false); }
  },[aiInput,aiBusy,ctx]);

  const generateAP = useCallback(async()=>{
    setApBusy(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt:`Write an ED Assessment and Plan note section.
Patient: ${patientAge}y ${patientSex}, CC: ${patientCC}
Working Dx: ${workingDx||"not documented"}.
Differential: ${ddx.map(d=>d.dx).join(", ")||"none documented"}.
Can't-miss addressed: ${cantOn.join(", ")||"none checked"}.
Treatment strategy: ${treatment||"not documented"}.
Disposition: ${dispChoice||"pending"}${dispSvc?" — "+dispSvc:""}.
Follow-up: ${followUp||"not documented"}.

Use numbered problem format. Include brief clinical reasoning for each. Disposition paragraph last.`
      });
      setApDraft(res);
    } catch { setApDraft("Generation failed. Check AI connection."); }
    finally  { setApBusy(false); }
  },[patientAge,patientSex,patientCC,workingDx,ddx,cantOn,treatment,dispChoice,dispSvc,followUp]);

  // ── Tab: Plan ──────────────────────────────────────────────────────────────
  function PlanTab() {
    return (
      <div style={{display:"flex",flexDirection:"column",gap:18}}>
        <div>
          <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,letterSpacing:1.5,textTransform:"uppercase",marginBottom:7}}>Working Diagnosis</div>
          <input value={workingDx} onChange={e=>setWorkingDx(e.target.value)}
            placeholder="Primary working diagnosis..." style={inp(false,{fontSize:14,fontWeight:600,color:T.txt})}/>
        </div>
        <div>
          <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,letterSpacing:1.5,textTransform:"uppercase",marginBottom:7}}>Priority Differential</div>
          {ddx.length===0 && (
            <div style={{...glass({borderRadius:9,background:"rgba(14,37,68,0.35)"}),padding:"12px",fontFamily:"DM Sans",fontSize:12,color:T.txt4,textAlign:"center",marginBottom:6}}>
              Build your differential — rank diagnoses from most to least likely
            </div>
          )}
          {ddx.map((item,i)=>(
            <DxRow key={item.id} item={item} index={i} onRemove={removeDx} onRiskChange={riskDx} onRatChange={ratDx}/>
          ))}
          <div style={{display:"flex",gap:7,marginTop:4}}>
            <input value={dxInput} onChange={e=>setDxInput(e.target.value)}
              placeholder="Add diagnosis..." onKeyDown={e=>{if(e.key==="Enter")addDx();}}
              style={inp(false,{flex:1})}/>
            <div style={{display:"flex",gap:3}}>
              {["high","mod","low"].map(lvl=>(
                <button key={lvl} onClick={()=>setDxRisk(lvl)}
                  style={{padding:"0 9px",borderRadius:7,fontFamily:"JetBrains Mono",fontSize:9,fontWeight:700,cursor:"pointer",border:`1px solid ${dxRisk===lvl?RISK_C[lvl].bd:"rgba(26,53,85,0.4)"}`,background:dxRisk===lvl?RISK_C[lvl].bg:"transparent",color:dxRisk===lvl?RISK_C[lvl].txt:T.txt4,textTransform:"uppercase",transition:"all .1s"}}>
                  {lvl}
                </button>
              ))}
            </div>
            <button onClick={addDx} style={{padding:"0 14px",borderRadius:8,background:"rgba(0,229,192,0.1)",border:"1px solid rgba(0,229,192,0.28)",color:T.teal,fontFamily:"DM Sans",fontWeight:600,fontSize:13,cursor:"pointer"}}>
              + Add
            </button>
          </div>
        </div>
        <div>
          <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>Can't-Miss Diagnoses</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:6}}>
            {cantList.map(cm=>{
              const on=cantOn.includes(cm);
              return (
                <button key={cm} className="erp-cm" onClick={()=>toggleCM(cm)}
                  style={{padding:"5px 12px",borderRadius:20,fontFamily:"DM Sans",fontWeight:600,fontSize:11.5,border:`1px solid ${on?"rgba(255,107,107,0.45)":"rgba(26,53,85,0.45)"}`,background:on?"rgba(255,107,107,0.1)":"transparent",color:on?T.coral:T.txt3}}>
                  {on?"✓ ":""}{cm}
                </button>
              );
            })}
          </div>
          <div style={{fontFamily:"DM Sans",fontSize:10.5,color:T.txt4,lineHeight:1.5}}>
            Check each diagnosis that has been explicitly considered and addressed this encounter. This documents your clinical reasoning for medicolegal purposes.
          </div>
        </div>
        <div>
          <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,letterSpacing:1.5,textTransform:"uppercase",marginBottom:7}}>Treatment Strategy</div>
          <textarea value={treatment} onChange={e=>setTreatment(e.target.value)}
            placeholder="Document your overall treatment approach and rationale. Specific orders are entered in the Orders tab." rows={4}
            style={inp(false,{lineHeight:1.65})}/>
          <div style={{display:"flex",alignItems:"center",gap:6,marginTop:6,padding:"7px 12px",borderRadius:8,background:"rgba(59,158,255,0.05)",border:"1px solid rgba(59,158,255,0.14)"}}>
            <span style={{fontSize:12}}>📋</span>
            <span style={{fontFamily:"DM Sans",fontSize:11,color:T.txt4}}>Medications, labs, imaging, and IV fluids are ordered in the <strong style={{color:T.blue}}>Orders tab</strong>.</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Tab: MDM ───────────────────────────────────────────────────────────────
  function MDMTab() {
    const RG = ({label,opts,val,onChange}) => (
      <div style={{marginBottom:16}}>
        <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>{label}</div>
        <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
          {opts.map(o=>{
            const on=val===o.id;
            return (
              <button key={o.id} onClick={()=>onChange(o.id)}
                style={{padding:"7px 14px",borderRadius:8,fontFamily:"DM Sans",fontSize:12,fontWeight:on?600:400,cursor:"pointer",border:`1px solid ${on?"rgba(59,158,255,0.5)":"rgba(26,53,85,0.35)"}`,background:on?"rgba(59,158,255,0.1)":"transparent",color:on?T.blue:T.txt3,transition:"all .12s"}}>
                {o.label}
              </button>
            );
          })}
        </div>
      </div>
    );
    return (
      <div style={{display:"flex",flexDirection:"column"}}>
        <div style={{...glass({borderRadius:10,background:"rgba(59,158,255,0.04)",borderColor:"rgba(59,158,255,0.16)"}),padding:"11px 14px",fontFamily:"DM Sans",fontSize:12,color:T.txt2,marginBottom:14,lineHeight:1.65}}>
          AMA 2021 E/M: MDM level requires 2 of 3 elements (problems, data, risk) to meet or exceed the threshold. Documents complexity for ED billing.
        </div>
        <RG label="Number / Complexity of Problems" val={mdmProbs} onChange={setMdmProbs}
          opts={[{id:"minimal",label:"Minimal"},{id:"low",label:"Low"},{id:"mod",label:"Moderate"},{id:"high",label:"High"}]}/>
        <div style={{marginBottom:16}}>
          <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>Data Reviewed / Ordered</div>
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            {DATA_OPTS.map(opt=>{
              const on=mdmData.includes(opt);
              return (
                <div key={opt} onClick={()=>toggleMDM(opt)}
                  style={{display:"flex",alignItems:"center",gap:9,padding:"7px 11px",borderRadius:7,cursor:"pointer",background:on?"rgba(59,158,255,0.07)":"transparent",border:`1px solid ${on?"rgba(59,158,255,0.28)":"rgba(26,53,85,0.22)"}`,transition:"all .11s"}}>
                  <div style={{width:14,height:14,borderRadius:3,border:`1px solid ${on?T.blue:"rgba(42,77,114,0.55)"}`,background:on?T.blue:"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {on && <span style={{color:"#050f1e",fontSize:9,fontWeight:900,lineHeight:1}}>✓</span>}
                  </div>
                  <span style={{fontFamily:"DM Sans",fontSize:12,color:on?T.txt:T.txt3}}>{opt}</span>
                </div>
              );
            })}
          </div>
        </div>
        <RG label="Risk of Complications / Morbidity / Mortality" val={mdmRisk} onChange={setMdmRisk}
          opts={[{id:"minimal",label:"Minimal"},{id:"low",label:"Low"},{id:"mod",label:"Moderate"},{id:"high",label:"High"}]}/>
        {mdmResult && (
          <div style={{...glass({borderRadius:12,background:`${mdmResult.color}0d`,borderColor:`${mdmResult.color}2e`}),padding:"16px 18px",marginTop:4}}>
            <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:mdmResult.color,textTransform:"uppercase",letterSpacing:2,marginBottom:6}}>Computed MDM Level</div>
            <div style={{fontFamily:"Playfair Display",fontSize:22,fontWeight:700,color:mdmResult.color,marginBottom:4}}>{mdmResult.label}</div>
            <div style={{fontFamily:"JetBrains Mono",fontSize:11,color:T.txt3}}>Supports billing: {mdmResult.code}</div>
            <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt4,marginTop:8,lineHeight:1.5}}>
              Two of three elements must meet this level. Verify all supporting documentation is present before coding.
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Tab: A&P ───────────────────────────────────────────────────────────────
  function APTab() {
    return (
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
          <div style={{flex:1}}>
            <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,letterSpacing:1.5,textTransform:"uppercase",marginBottom:5}}>Assessment & Plan Draft</div>
            <div style={{fontFamily:"DM Sans",fontSize:11.5,color:T.txt3,lineHeight:1.55}}>Synthesizes Plan, MDM, and Disposition into a note-ready A&P. Review and edit before adding to chart.</div>
          </div>
          <button onClick={generateAP} disabled={apBusy}
            style={{padding:"8px 16px",borderRadius:9,background:"linear-gradient(135deg,rgba(0,229,192,0.15),rgba(59,158,255,0.12))",border:"1px solid rgba(0,229,192,0.32)",color:T.teal,fontFamily:"DM Sans",fontWeight:700,fontSize:13,cursor:apBusy?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:7,flexShrink:0,whiteSpace:"nowrap"}}>
            {apBusy
              ? <><span style={{display:"inline-block",width:12,height:12,border:`2px solid ${T.teal}`,borderTopColor:"transparent",borderRadius:"50%",animation:"erp-spin .8s linear infinite"}}/> Drafting...</>
              : "✦ Draft A&P"}
          </button>
        </div>
        {!apDraft && !apBusy && (
          <div style={{...glass({borderRadius:12,background:"rgba(14,37,68,0.4)"}),padding:"40px 24px",textAlign:"center"}}>
            <div style={{fontSize:36,marginBottom:10}}>📄</div>
            <div style={{fontFamily:"Playfair Display",fontSize:16,color:T.txt2,marginBottom:6}}>No draft yet</div>
            <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt4,maxWidth:260,margin:"0 auto"}}>Complete the Plan and Disposition tabs first, then click Draft A&P for a complete note section</div>
          </div>
        )}
        {apDraft && (
          <>
            <textarea value={apDraft} onChange={e=>setApDraft(e.target.value)}
              rows={22} style={inp(false,{lineHeight:1.7,fontSize:12.5,fontFamily:"DM Sans,sans-serif"})}/>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>navigator.clipboard?.writeText(apDraft)}
                style={{padding:"7px 16px",borderRadius:8,background:"rgba(59,158,255,0.1)",border:"1px solid rgba(59,158,255,0.28)",color:T.blue,fontFamily:"DM Sans",fontWeight:600,fontSize:12,cursor:"pointer"}}>Copy</button>
              <button onClick={generateAP} disabled={apBusy}
                style={{padding:"7px 16px",borderRadius:8,background:"transparent",border:"1px solid rgba(26,53,85,0.45)",color:T.txt4,fontFamily:"DM Sans",fontWeight:600,fontSize:12,cursor:apBusy?"not-allowed":"pointer"}}>Regenerate</button>
            </div>
          </>
        )}
      </div>
    );
  }

  // ── Tab: Disposition ───────────────────────────────────────────────────────
  function DispoTab() {
    const OPTS=[{id:"discharge",label:"Discharge home",color:T.teal},{id:"obs",label:"Observation",color:T.gold},{id:"admit",label:"Admit",color:T.orange},{id:"transfer",label:"Transfer",color:T.coral}];
    return (
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        <div>
          <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>Disposition Decision</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {OPTS.map(o=>{
              const on=dispChoice===o.id;
              return (
                <button key={o.id} onClick={()=>setDispChoice(o.id)}
                  style={{padding:"9px 18px",borderRadius:9,fontFamily:"DM Sans",fontWeight:on?700:400,fontSize:13,cursor:"pointer",border:`1px solid ${on?o.color+"55":"rgba(26,53,85,0.38)"}`,background:on?`${o.color}12`:"transparent",color:on?o.color:T.txt3,transition:"all .13s"}}>
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>
        {dispChoice==="admit" && (
          <div>
            <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,letterSpacing:1.5,textTransform:"uppercase",marginBottom:7}}>Admitting Service</div>
            <input value={dispSvc} onChange={e=>setDispSvc(e.target.value)}
              placeholder="e.g., Internal Medicine, Cardiology, Surgery..." style={inp()}/>
          </div>
        )}
        <div>
          <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,letterSpacing:1.5,textTransform:"uppercase",marginBottom:7}}>Disposition Criteria / Rationale</div>
          <textarea value={dispCrit} onChange={e=>setDispCrit(e.target.value)}
            placeholder="Criteria met for this disposition. What must be completed before the patient leaves?" rows={3} style={inp()}/>
        </div>
        {(dispChoice==="discharge"||!dispChoice) && (
          <>
            <div>
              <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,letterSpacing:1.5,textTransform:"uppercase",marginBottom:7}}>Follow-up</div>
              <input value={followUp} onChange={e=>setFollowUp(e.target.value)}
                placeholder="Follow-up with whom, when, and for what..." style={inp()}/>
            </div>
            <div>
              <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,letterSpacing:1.5,textTransform:"uppercase",marginBottom:7}}>Return Precautions</div>
              <textarea value={returnPrec} onChange={e=>setReturnPrec(e.target.value)}
                placeholder="Return if: worsening pain, fever, dyspnea, new symptoms, unable to tolerate PO..." rows={3} style={inp()}/>
            </div>
          </>
        )}
        {dispChoice && (
          <div style={{...glass({borderRadius:12,background:"rgba(8,22,40,0.5)"}),padding:"14px 16px"}}>
            <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:2,marginBottom:8}}>Disposition Summary</div>
            {[
              {l:"Decision", v:OPTS.find(x=>x.id===dispChoice)?.label},
              {l:"Service",  v:dispSvc||null},
              {l:"Criteria", v:dispCrit||"Not documented"},
              {l:"Follow-up",v:followUp||"Not documented"},
            ].filter(r=>r.v).map((r,i)=>(
              <div key={i} style={{display:"flex",gap:8,padding:"5px 0",borderBottom:"1px solid rgba(26,53,85,0.22)"}}>
                <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,width:66,flexShrink:0}}>{r.l}</span>
                <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.4}}>{r.v}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  const TABS = [{id:"plan",label:"Plan"},{id:"mdm",label:"MDM"},{id:"ap",label:"A&P Draft"},{id:"dispo",label:"Disposition"}];

  return (
    <div style={{background:T.bg,height:"100%",fontFamily:"DM Sans,sans-serif",display:"flex",flexDirection:"column"}}>

      {/* Header */}
      <div style={{...deep({borderRadius:0}),padding:"10px 20px",flexShrink:0,zIndex:10,borderBottom:"1px solid rgba(26,53,85,0.6)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
          {!embedded && (
            <div style={{...deep({borderRadius:9}),padding:"4px 12px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.teal,letterSpacing:3}}>NOTRYA</span>
              <span style={{color:T.txt4,fontFamily:"JetBrains Mono",fontSize:10}}>/</span>
              <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.txt3,letterSpacing:2}}>ER PLAN</span>
            </div>
          )}
          <h1 className="erp-shimmer" style={{fontFamily:"Playfair Display",fontSize:"clamp(16px,2vw,22px)",fontWeight:900,letterSpacing:-.5,margin:0}}>ER Plan Builder</h1>
          <div style={{flex:1}}/>
          {patientCC && (
            <div style={{padding:"3px 10px",borderRadius:6,background:"rgba(59,158,255,0.1)",border:"1px solid rgba(59,158,255,0.24)"}}>
              <span style={{fontFamily:"DM Sans",fontSize:11,fontWeight:600,color:T.blue}}>CC: {patientCC}</span>
            </div>
          )}
          <div style={{padding:"3px 10px",borderRadius:6,background:planActive?"rgba(61,255,160,0.1)":"rgba(245,200,66,0.1)",border:`1px solid ${planActive?"rgba(61,255,160,0.28)":"rgba(245,200,66,0.28)"}`}}>
            <span style={{fontFamily:"JetBrains Mono",fontSize:10,fontWeight:700,color:planActive?T.green:T.gold}}>
              {planActive?"PLAN ACTIVE":"PLAN PENDING"}
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{display:"flex",flex:1,minHeight:0,overflow:"hidden"}}>

        {/* LEFT — Plan builder */}
        <div style={{flex:"0 0 56%",display:"flex",flexDirection:"column",borderRight:"1px solid rgba(26,53,85,0.5)",minHeight:0,overflow:"hidden"}}>
          <div style={{display:"flex",padding:"0 20px",borderBottom:"1px solid rgba(26,53,85,0.4)",background:T.panel,flexShrink:0}}>
            {TABS.map(tab=>{
              const active=tab.id===activeTab;
              return (
                <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
                  style={{padding:"9px 14px",background:"none",border:"none",borderBottom:`2px solid ${active?T.teal:"transparent"}`,marginBottom:-1,cursor:"pointer",fontFamily:"DM Sans",fontSize:12,fontWeight:active?600:400,color:active?T.teal:T.txt3,transition:"all .13s",whiteSpace:"nowrap"}}>
                  {tab.label}
                </button>
              );
            })}
          </div>
          <div key={activeTab} className="erp-in" style={{flex:1,overflowY:"auto",padding:"18px 20px"}}>
            {activeTab==="plan"  && <PlanTab/>}
            {activeTab==="mdm"   && <MDMTab/>}
            {activeTab==="ap"    && <APTab/>}
            {activeTab==="dispo" && <DispoTab/>}
          </div>
        </div>

        {/* RIGHT — AI Advisor */}
        <div style={{flex:"0 0 44%",display:"flex",flexDirection:"column",minHeight:0}}>
          <div style={{...deep({borderRadius:0}),padding:"10px 16px",borderBottom:"1px solid rgba(26,53,85,0.5)",flexShrink:0,display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:T.teal,boxShadow:`0 0 6px ${T.teal}`}}/>
            <span style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:14,color:T.txt}}>Notrya AI — Plan Advisor</span>
            <div style={{...deep({borderRadius:5}),padding:"2px 7px",fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,marginLeft:"auto"}}>GPT-4o</div>
          </div>

          {/* Context-aware quick actions */}
          <div style={{padding:"10px 14px",borderBottom:"1px solid rgba(26,53,85,0.28)",background:"rgba(5,15,30,0.55)",flexShrink:0}}>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {(QUICK[activeTab]||QUICK.plan).map(qa=>(
                <button key={qa.l} className="erp-qbtn" onClick={()=>sendAI(qa.p)} disabled={aiBusy}
                  style={{padding:"5px 11px",borderRadius:7,background:"rgba(0,229,192,0.05)",border:"1px solid rgba(0,229,192,0.18)",color:T.txt2,fontFamily:"DM Sans",fontSize:11,fontWeight:500,cursor:aiBusy?"not-allowed":"pointer"}}>
                  {qa.l}
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div style={{flex:1,overflowY:"auto",padding:"12px 14px",display:"flex",flexDirection:"column",gap:10}}>
            {aiMsgs.map((msg,i)=>(
              <div key={i} className="erp-msg" style={{maxWidth:"94%",alignSelf:msg.role==="user"?"flex-end":"flex-start"}}>
                {msg.role==="user"
                  ? <div style={{...glass({borderRadius:"12px 12px 4px 12px",background:"rgba(59,158,255,0.1)",borderColor:"rgba(59,158,255,0.25)"}),padding:"9px 13px",fontFamily:"DM Sans",fontSize:12.5,color:T.txt,lineHeight:1.55}}>{msg.content}</div>
                  : <div style={{...glass({borderRadius:"4px 12px 12px 12px"}),padding:"10px 13px",fontFamily:"DM Sans",fontSize:12.5,color:T.txt2,lineHeight:1.65,whiteSpace:"pre-wrap"}}>{msg.content}</div>
                }
              </div>
            ))}
            {aiBusy && (
              <div style={{...glass({borderRadius:"4px 12px 12px 12px"}),padding:"10px 14px",display:"flex",alignItems:"center",gap:8,alignSelf:"flex-start"}}>
                <span style={{display:"inline-block",width:12,height:12,border:`2px solid ${T.teal}`,borderTopColor:"transparent",borderRadius:"50%",animation:"erp-spin .8s linear infinite"}}/>
                <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt4}}>Thinking...</span>
              </div>
            )}
            <div ref={aiEnd}/>
          </div>

          {/* Input */}
          <div style={{padding:"10px 14px",borderTop:"1px solid rgba(26,53,85,0.38)",flexShrink:0,display:"flex",gap:8}}>
            <input value={aiInput} onChange={e=>setAiInput(e.target.value)}
              placeholder="Ask a clinical question..."
              onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey)sendAI();}}
              style={inp(!!aiInput,{flex:1,borderRadius:9})}/>
            <button onClick={()=>sendAI()} disabled={aiBusy||!aiInput.trim()}
              style={{width:38,height:38,borderRadius:9,background:aiInput.trim()?T.teal:"rgba(0,229,192,0.14)",border:"none",color:aiInput.trim()?"#050f1e":T.teal,fontSize:16,cursor:aiInput.trim()&&!aiBusy?"pointer":"not-allowed",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"background .2s",fontWeight:700}}>
              ↑
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}