import { useState, useCallback } from "react";
import { InvokeLLM } from "@/integrations/Core";

(() => {
  if (document.getElementById("cph-css")) return;
  const l = document.createElement("link"); l.id = "cph-f"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "cph-css";
  s.textContent = `
    *{box-sizing:border-box;}
    @keyframes cphIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
    @keyframes cphSpin{to{transform:rotate(360deg)}}
    .cph-in{animation:cphIn .22s ease both;}
    .cph-hov:hover{background:rgba(255,255,255,.07)!important;border-color:rgba(0,180,216,.35)!important;}
    ::-webkit-scrollbar{width:3px;height:3px;}
    ::-webkit-scrollbar-thumb{background:rgba(0,180,216,.22);border-radius:2px;}
    input::placeholder{color:rgba(221,230,240,.18);}
    input:focus{border-color:rgba(0,180,216,.55)!important;outline:none;}
  `;
  document.head.appendChild(s);
})();

const T = {
  bg:"#07111f",card:"rgba(255,255,255,0.04)",bdr:"rgba(255,255,255,0.08)",
  teal:"#00b4d8",tD:"rgba(0,180,216,0.12)",tB:"rgba(0,180,216,0.25)",
  gold:"#f0a500",gD:"rgba(240,165,0,0.12)",
  coral:"#ff6060",cD:"rgba(255,96,96,0.12)",
  green:"#4ade80",grnD:"rgba(74,222,128,0.1)",
  purple:"#9b6dff",pD:"rgba(155,109,255,0.12)",
  orange:"#ff9f43",oD:"rgba(255,159,67,0.12)",
  txt:"#dde6f0",mut:"rgba(221,230,240,0.55)",dim:"rgba(221,230,240,0.28)",
};
const gl=(x={})=>({backdropFilter:"blur(14px)",background:T.card,border:`1px solid ${T.bdr}`,borderRadius:12,...x});
const ib=(x={})=>({width:"100%",background:"rgba(13,27,46,.8)",border:`1px solid ${T.bdr}`,borderRadius:8,padding:"8px 12px",color:T.txt,fontFamily:"DM Sans,sans-serif",fontSize:13,transition:"border-color .15s",...x});
const Sp=()=><span style={{display:"inline-block",width:13,height:13,border:"2px solid rgba(0,180,216,.2)",borderTopColor:T.teal,borderRadius:"50%",animation:"cphSpin .7s linear infinite"}}/>;

function CopyBtn({text,label="📋 Copy",color=T.teal,full=false}){
  const [done,setDone]=useState(false);
  const go=()=>{if(!text?.trim())return;navigator.clipboard?.writeText(text.trim()).then(()=>{setDone(true);setTimeout(()=>setDone(false),1800);});};
  return<button onClick={go} disabled={!text?.trim()} style={{padding:full?"10px 0":"5px 14px",width:full?"100%":"auto",borderRadius:8,cursor:text?.trim()?"pointer":"not-allowed",border:`1px solid ${done?T.green+"55":color+"55"}`,background:done?T.grnD:`${color}14`,color:done?T.green:color,fontFamily:"DM Sans,sans-serif",fontWeight:700,fontSize:full?13:11,opacity:text?.trim()?1:.35,transition:"all .15s",display:full?"flex":"inline-flex",alignItems:"center",justifyContent:"center",gap:6}}>{done?"✓ Copied":label}</button>;
}

function Sec({label,color=T.teal,icon,copyText,children}){
  return<div style={{...gl({marginBottom:9,overflow:"hidden",borderLeft:`3px solid ${color}55`})}}>
    <div style={{padding:"8px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${T.bdr}`}}>
      <div style={{display:"flex",alignItems:"center",gap:7}}>
        {icon&&<span style={{fontSize:13}}>{icon}</span>}
        <span style={{fontSize:9,fontWeight:700,color,fontFamily:"JetBrains Mono,monospace",letterSpacing:1.5,textTransform:"uppercase"}}>{label}</span>
      </div>
      {copyText&&<CopyBtn text={copyText} color={color}/>}
    </div>
    <div style={{padding:"10px 14px"}}>{children}</div>
  </div>;
}

const PRESENTATIONS = [
  {id:"feb_inf",   cat:"peds", label:"Febrile Infant <60 days",        icon:"🍼", color:"#ff9f43", peds:true,  hint:"Rochester/Philadelphia criteria, LP decision, empiric antibiotics"},
  {id:"feb_child", cat:"peds", label:"Febrile Child 2–36 months",      icon:"👶", color:"#ff9f43", peds:true,  hint:"SBI risk stratification, occult bacteremia, UTI workup"},
  {id:"croup",     cat:"peds", label:"Croup",                          icon:"🗣", color:"#9b6dff", peds:true,  hint:"Westley score, racemic epi, dexamethasone dosing"},
  {id:"bronch",    cat:"peds", label:"Bronchiolitis",                  icon:"🫁", color:"#9b6dff", peds:true,  hint:"RSV, evidence-based care, admission criteria"},
  {id:"ped_asthma",cat:"peds", label:"Pediatric Asthma",               icon:"💨", color:"#9b6dff", peds:true,  hint:"PRAM/PASS score, weight-based dosing, stepwise management"},
  {id:"feb_sz",    cat:"peds", label:"Febrile Seizure",                icon:"🧠", color:"#ff6060", peds:true,  hint:"Simple vs complex, LP indications, recurrence risk"},
  {id:"pecarn",    cat:"peds", label:"Pediatric Head Injury (PECARN)", icon:"🪖", color:"#ff6060", peds:true,  hint:"CT decision rule, observation criteria, age-based approach"},
  {id:"ped_sep",   cat:"peds", label:"Pediatric Sepsis",               icon:"🚨", color:"#ff6060", peds:true,  hint:"SIRS criteria in children, fluid resuscitation, empiric antibiotics"},
  {id:"stridor",   cat:"peds", label:"Stridor in Child",               icon:"😮", color:"#f0a500", peds:true,  hint:"Differentiate croup vs epiglottitis vs FB, do not examine throat"},
  {id:"ped_abd",   cat:"peds", label:"Pediatric Abdominal Pain",       icon:"🫃", color:"#f0a500", peds:true,  hint:"Intussusception, appendicitis, Meckel, volvulus red flags"},
  {id:"chest_pain",cat:"cv",   label:"Chest Pain",                     icon:"🫀", color:"#ff6060", peds:false, hint:"ACS vs PE vs aortic vs MSK, HEART score, troponin strategy"},
  {id:"syncope",   cat:"cv",   label:"Syncope",                        icon:"😵", color:"#ff6060", peds:false, hint:"SFSR/ROSE rules, cardiac vs vasovagal vs orthostatic"},
  {id:"htn_urg",   cat:"cv",   label:"Hypertensive Emergency",         icon:"💢", color:"#ff6060", peds:false, hint:"End-organ damage, MAP reduction strategy, agent selection"},
  {id:"hf",        cat:"cv",   label:"Acute Heart Failure",            icon:"💧", color:"#3b9eff", peds:false, hint:"Diuresis, nitrates, CPAP/BiPAP, disposition"},
  {id:"afib_new",  cat:"cv",   label:"New-Onset AFib",                 icon:"〰️", color:"#3b9eff", peds:false, hint:"Rate vs rhythm, anticoagulation, cardioversion criteria"},
  {id:"dyspnea",   cat:"pulm", label:"Acute Dyspnea",                  icon:"🫁", color:"#00b4d8", peds:false, hint:"Systematic approach: ARDS vs CHF vs PE vs pneumonia vs PTX"},
  {id:"asthma",    cat:"pulm", label:"Asthma Exacerbation",            icon:"💨", color:"#00b4d8", peds:false, hint:"Severity scoring, stepwise bronchodilator therapy, steroids, BiPAP"},
  {id:"copd",      cat:"pulm", label:"COPD Exacerbation",              icon:"🌫️", color:"#00b4d8", peds:false, hint:"GOLD criteria, NIV, antibiotics, steroids, discharge threshold"},
  {id:"pe",        cat:"pulm", label:"Suspected PE",                   icon:"🩸", color:"#ff6060", peds:false, hint:"Wells/PERC, CTPA vs V/Q, anticoagulation choice, massive PE"},
  {id:"ha",        cat:"neuro",label:"Headache",                       icon:"🧠", color:"#9b6dff", peds:false, hint:"Thunderclap, LP indications, Ottawa SAH rule, migraine tx"},
  {id:"ams",       cat:"neuro",label:"Altered Mental Status",          icon:"🌀", color:"#9b6dff", peds:false, hint:"AEIOU TIPS mnemonic, reversible causes, metabolic workup"},
  {id:"vertigo",   cat:"neuro",label:"Dizziness / Vertigo",            icon:"🌪️", color:"#9b6dff", peds:false, hint:"HINTS exam, BPPV vs central, Epley maneuver"},
  {id:"seizure",   cat:"neuro",label:"Seizure (Adult)",                icon:"⚡", color:"#9b6dff", peds:false, hint:"First seizure workup, status epilepticus protocol, medication selection"},
  {id:"abd_pain",  cat:"gi",   label:"Abdominal Pain",                 icon:"🫃", color:"#f0a500", peds:false, hint:"Systematic approach by quadrant, surgical vs medical, imaging strategy"},
  {id:"gi_bleed",  cat:"gi",   label:"GI Bleed",                      icon:"🩸", color:"#ff6060", peds:false, hint:"Glasgow-Blatchford, upper vs lower, resuscitation, GI consultation"},
  {id:"vomiting",  cat:"gi",   label:"Nausea / Vomiting",             icon:"🤢", color:"#f0a500", peds:false, hint:"Antiemetic selection, dehydration assessment, red flags"},
  {id:"sepsis_w",  cat:"inf",  label:"Sepsis Workup",                 icon:"🦠", color:"#ff6060", peds:false, hint:"qSOFA, source identification, Hour-1 bundle, antibiotics by source"},
  {id:"pneumonia", cat:"inf",  label:"Pneumonia",                     icon:"🫁", color:"#4ade80", peds:false, hint:"PSI/PORT score, CURB-65, CAP vs HAP, antibiotic selection"},
  {id:"uti_pye",   cat:"inf",  label:"UTI / Pyelonephritis",          icon:"💧", color:"#4ade80", peds:false, hint:"Risk stratification, imaging indications, antibiotic selection by severity"},
  {id:"cellulitis",cat:"inf",  label:"Cellulitis / SSTI",             icon:"🩹", color:"#4ade80", peds:false, hint:"MRSA risk, severity grading, IDSA criteria, admission vs discharge"},
];

const CATS = [
  {id:"all",  label:"All"},
  {id:"peds", label:"👶 Pediatric", color:"#ff9f43"},
  {id:"cv",   label:"🫀 Cardiac",   color:"#ff6060"},
  {id:"pulm", label:"🫁 Pulmonary", color:"#00b4d8"},
  {id:"neuro",label:"🧠 Neuro",     color:"#9b6dff"},
  {id:"gi",   label:"🫃 GI",        color:"#f0a500"},
  {id:"inf",  label:"🦠 Infectious",color:"#4ade80"},
];

function ptCtxLine(a,w,t,e){
  const parts=[a&&`Age: ${a}`,w&&`Wt: ${w} kg`,t&&`Temp: ${t}`,e&&e].filter(Boolean);
  return parts.length?`Patient: ${parts.join(" | ")}`:"";
}

export default function ClinicalPresentationHub() {
  const [cat,setCat]   = useState("peds");
  const [sel,setSel]   = useState(null);
  const [guide,setGuide] = useState(null);
  const [loading,setLoading] = useState(false);

  const [age,setAge]   = useState("");
  const [wt,setWt]     = useState("");
  const [temp,setTemp] = useState("");
  const [extra,setExtra] = useState("");

  const filtered = cat==="all" ? PRESENTATIONS : PRESENTATIONS.filter(p=>p.cat===cat);

  const run = useCallback(async(pres) => {
    setSel(pres); setGuide(null); setLoading(true);
    const ptCtx = [
      age   ? `Age: ${age}` : "",
      wt    ? `Weight: ${wt} kg` : "",
      temp  ? `Temperature: ${temp}` : "",
      extra ? extra : "",
    ].filter(Boolean).join(", ");

    try {
      const r = await InvokeLLM({
        prompt:`You are a senior emergency physician providing clinical guidance for an ED provider.

Presentation: ${pres.label}
Patient context: ${ptCtx || "not specified"}

Provide structured ED management guidance. Be specific, evidence-based, and clinically actionable.
Include specific clinical decision rules (PECARN, HEART, Wells, Westley, CURB-65 etc.) where applicable.
For pediatric presentations, include weight-based dosing calculations where relevant.
For severity tiers, use mild/moderate/severe if applicable to this presentation.

Format each list item as a complete, actionable sentence.`,
        response_json_schema:{
          type:"object",
          properties:{
            clinical_approach:   {type:"string"},
            key_diagnostics:     {type:"array",items:{type:"string"}},
            mild_management:     {type:"string"},
            moderate_management: {type:"string"},
            severe_management:   {type:"string"},
            red_flags:           {type:"array",items:{type:"string"}},
            admission_criteria:  {type:"array",items:{type:"string"}},
            discharge_criteria:  {type:"array",items:{type:"string"}},
            return_precautions:  {type:"array",items:{type:"string"}},
            peds_pearls:         {type:"array",items:{type:"string"}},
            clinical_pearls:     {type:"array",items:{type:"string"}},
          },
          required:["clinical_approach","key_diagnostics","red_flags","admission_criteria","discharge_criteria","return_precautions","clinical_pearls"],
        },
      });
      setGuide(r);
    } catch { setGuide({_err:true}); }
    setLoading(false);
  },[age,wt,temp,extra]);

  const fullText = guide && !guide._err && sel ? [
    `=== ${sel.label.toUpperCase()} — ED MANAGEMENT ===`,
    ptCtxLine(age,wt,temp,extra),
    "",
    guide.clinical_approach && `CLINICAL APPROACH:\n${guide.clinical_approach}`,
    guide.key_diagnostics?.length && `\nKEY DIAGNOSTICS:\n${guide.key_diagnostics.map(d=>`• ${d}`).join("\n")}`,
    guide.mild_management     && `\nMILD:     ${guide.mild_management}`,
    guide.moderate_management && `MODERATE: ${guide.moderate_management}`,
    guide.severe_management   && `SEVERE:   ${guide.severe_management}`,
    guide.red_flags?.length   && `\nRED FLAGS:\n${guide.red_flags.map(r=>`⚠ ${r}`).join("\n")}`,
    guide.admission_criteria?.length  && `\nADMIT IF:\n${guide.admission_criteria.map(a=>`• ${a}`).join("\n")}`,
    guide.discharge_criteria?.length  && `\nDISCHARGE IF:\n${guide.discharge_criteria.map(d=>`• ${d}`).join("\n")}`,
    guide.return_precautions?.length  && `\nRETURN TO ED IF:\n${guide.return_precautions.map(r=>`• ${r}`).join("\n")}`,
    guide.clinical_pearls?.length     && `\nCLINICAL PEARLS:\n${guide.clinical_pearls.map(p=>`★ ${p}`).join("\n")}`,
  ].filter(Boolean).join("\n") : "";

  return(
    <div style={{background:T.bg,minHeight:"100vh",fontFamily:"DM Sans,sans-serif",color:T.txt,display:"grid",gridTemplateColumns:"260px 1fr",gap:0}}>

      {/* ── LEFT SIDEBAR ─────────────────────────────────────────────── */}
      <div style={{borderRight:`1px solid ${T.bdr}`,padding:"20px 14px 60px",minHeight:"100vh",overflowY:"auto"}}>

        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
          <div style={{width:38,height:38,borderRadius:9,background:T.tD,border:`1px solid ${T.tB}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>🏥</div>
          <div>
            <div style={{fontFamily:"Playfair Display,serif",fontSize:16,color:T.teal,fontWeight:700,lineHeight:1}}>Clinical Hub</div>
            <div style={{fontSize:10,color:T.mut,marginTop:2}}>ED management by presentation</div>
          </div>
        </div>

        <div style={{...gl({padding:"10px 12px",marginBottom:14})}}>
          <div style={{fontSize:8,color:T.gold,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>Patient Context</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:6}}>
            {[["Age",age,setAge,"yr"],["Weight",wt,setWt,"kg"],["Temp",temp,setTemp,"°F"]].map(([l,v,set,u])=>(
              <div key={l} style={l==="Temp"?{gridColumn:"1/-1"}:{}}>
                <div style={{fontSize:7,color:T.dim,fontFamily:"JetBrains Mono,monospace",letterSpacing:1,textTransform:"uppercase",marginBottom:2}}>{l}</div>
                <div style={{position:"relative"}}>
                  <input type={l==="Age"||l==="Weight"?"number":"text"} value={v} onChange={e=>set(e.target.value)} placeholder="—"
                    style={{...ib({padding:"5px 22px 5px 8px",fontSize:11})}}/>
                  <span style={{position:"absolute",right:5,top:"50%",transform:"translateY(-50%)",fontSize:8,color:T.dim,pointerEvents:"none"}}>{u}</span>
                </div>
              </div>
            ))}
          </div>
          <input value={extra} onChange={e=>setExtra(e.target.value)} placeholder="Other context: vitals, key symptoms..."
            style={{...ib({fontSize:11,padding:"5px 8px"})}}/>
        </div>

        <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:12}}>
          {CATS.map(c=>(
            <button key={c.id} onClick={()=>setCat(c.id)} style={{padding:"4px 10px",borderRadius:20,cursor:"pointer",border:`1px solid ${cat===c.id?(c.color||T.teal)+"55":T.bdr}`,background:cat===c.id?`${c.color||T.teal}14`:"transparent",color:cat===c.id?(c.color||T.teal):T.dim,fontSize:10,fontWeight:cat===c.id?700:400,fontFamily:"DM Sans,sans-serif"}}>
              {c.label}
            </button>
          ))}
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:5}}>
          {filtered.map(p=>(
            <button key={p.id} onClick={()=>run(p)} className="cph-hov" style={{display:"flex",alignItems:"flex-start",gap:8,padding:"9px 11px",borderRadius:9,cursor:"pointer",textAlign:"left",border:`1px solid ${sel?.id===p.id?p.color+"55":T.bdr}`,background:sel?.id===p.id?`${p.color}12`:T.card,transition:"all .15s"}}>
              <span style={{fontSize:16,flexShrink:0,lineHeight:1.3}}>{p.icon}</span>
              <div>
                <div style={{fontSize:12,fontWeight:700,color:sel?.id===p.id?p.color:T.txt,lineHeight:1.2}}>{p.label}</div>
                <div style={{fontSize:9,color:T.dim,marginTop:2,lineHeight:1.35}}>{p.hint}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── RIGHT: Clinical Guidance ──────────────────────────────────── */}
      <div style={{padding:"20px 22px 60px",overflowY:"auto",maxHeight:"100vh"}}>

        {!sel&&(
          <div style={{textAlign:"center",padding:"80px 20px",color:T.dim}}>
            <div style={{fontSize:48,marginBottom:14}}>🏥</div>
            <div style={{fontFamily:"Playfair Display,serif",fontSize:20,color:T.mut,marginBottom:8}}>Select a Clinical Presentation</div>
            <div style={{fontSize:12,lineHeight:1.8,maxWidth:400,margin:"0 auto"}}>
              Evidence-based ED management · Clinical decision rules<br/>
              Severity-tiered treatment · Admission & discharge criteria<br/>
              Pediatric pearls · Return precautions
            </div>
          </div>
        )}

        {sel&&(
          <div>
            <div style={{...gl({padding:"16px 20px",marginBottom:16,borderLeft:`4px solid ${sel.color}`,background:`${sel.color}08`})}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                    <span style={{fontSize:26}}>{sel.icon}</span>
                    <h2 style={{margin:0,fontFamily:"Playfair Display,serif",fontSize:22,color:sel.color,lineHeight:1.1}}>{sel.label}</h2>
                  </div>
                  <div style={{fontSize:11,color:T.mut}}>{sel.hint}</div>
                  {ptCtxLine(age,wt,temp,extra)&&(
                    <div style={{marginTop:6,fontSize:11,color:T.dim,fontFamily:"JetBrains Mono,monospace"}}>{ptCtxLine(age,wt,temp,extra)}</div>
                  )}
                </div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {loading
                    ? <div style={{display:"flex",alignItems:"center",gap:8,fontSize:11,color:sel.color}}><Sp/>Generating guidance...</div>
                    : guide&&!guide._err&&<CopyBtn text={fullText} label="📋 Copy Full Guidance" color={sel.color}/>
                  }
                  <button onClick={()=>run(sel)} disabled={loading} style={{padding:"6px 14px",borderRadius:8,cursor:"pointer",border:`1px solid ${sel.color}55`,background:`${sel.color}14`,color:sel.color,fontFamily:"DM Sans,sans-serif",fontSize:11,fontWeight:700,opacity:loading?.4:1}}>
                    {loading?"Loading...":"↺ Regenerate"}
                  </button>
                </div>
              </div>
            </div>

            {loading&&(
              <div style={{...gl({padding:"40px",textAlign:"center"})}}>
                <Sp/>
                <div style={{fontSize:12,color:T.mut,marginTop:12}} className="cph-in">Generating evidence-based guidance for {sel.label}...</div>
              </div>
            )}

            {guide&&!guide._err&&!loading&&(
              <div className="cph-in">
                {guide.clinical_approach&&(
                  <Sec label="Clinical Approach" color={T.teal} icon="🩺" copyText={guide.clinical_approach}>
                    <p style={{margin:0,fontSize:13,color:T.txt,lineHeight:1.7}}>{guide.clinical_approach}</p>
                  </Sec>
                )}

                {guide.key_diagnostics?.length>0&&(
                  <Sec label="Key Diagnostics" color={T.purple} icon="🔬" copyText={guide.key_diagnostics.map(d=>`• ${d}`).join("\n")}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
                      {guide.key_diagnostics.map((d,i)=>(
                        <div key={i} style={{display:"flex",gap:7,padding:"5px 8px",borderRadius:6,background:T.pD,border:`1px solid ${T.purple}20`,alignItems:"flex-start"}}>
                          <span style={{color:T.purple,flexShrink:0,fontSize:11,marginTop:1}}>◆</span>
                          <span style={{fontSize:11,color:T.txt,lineHeight:1.45}}>{d}</span>
                        </div>
                      ))}
                    </div>
                  </Sec>
                )}

                {(guide.mild_management||guide.moderate_management||guide.severe_management)&&(
                  <div style={{...gl({marginBottom:9,overflow:"hidden"})}}>
                    <div style={{padding:"8px 14px",borderBottom:`1px solid ${T.bdr}`}}>
                      <span style={{fontSize:9,fontWeight:700,color:T.gold,fontFamily:"JetBrains Mono,monospace",letterSpacing:1.5,textTransform:"uppercase"}}>Management by Severity</span>
                    </div>
                    <div style={{padding:"10px 14px",display:"flex",flexDirection:"column",gap:8}}>
                      {[["MILD",guide.mild_management,T.green,T.grnD],["MODERATE",guide.moderate_management,T.gold,T.gD],["SEVERE",guide.severe_management,T.coral,T.cD]].map(([l,v,c,bg])=>v&&(
                        <div key={l} style={{borderRadius:9,padding:"10px 14px",background:bg,border:`1px solid ${c}25`,display:"flex",gap:12,alignItems:"flex-start"}}>
                          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,flexShrink:0}}>
                            <span style={{fontSize:9,fontWeight:700,color:c,fontFamily:"JetBrains Mono,monospace",letterSpacing:1}}>{l}</span>
                            <CopyBtn text={v} color={c}/>
                          </div>
                          <p style={{margin:0,fontSize:12,color:T.txt,lineHeight:1.65}}>{v}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {guide.red_flags?.length>0&&(
                  <Sec label="Red Flags — Do Not Miss" color={T.coral} icon="🚨" copyText={guide.red_flags.map(r=>`⚠ ${r}`).join("\n")}>
                    <div style={{display:"flex",flexDirection:"column",gap:5}}>
                      {guide.red_flags.map((r,i)=>(
                        <div key={i} style={{display:"flex",gap:8,padding:"6px 10px",borderRadius:7,background:T.cD,border:`1px solid ${T.coral}20`,alignItems:"flex-start"}}>
                          <span style={{color:T.coral,flexShrink:0,fontSize:13,lineHeight:1.3}}>⚠</span>
                          <span style={{fontSize:12,color:T.txt,lineHeight:1.5,fontWeight:600}}>{r}</span>
                        </div>
                      ))}
                    </div>
                  </Sec>
                )}

                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:9}}>
                  {guide.admission_criteria?.length>0&&(
                    <div style={{...gl({overflow:"hidden",borderLeft:`3px solid ${T.coral}55`})}}>
                      <div style={{padding:"7px 12px",borderBottom:`1px solid ${T.bdr}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <span style={{fontSize:9,fontWeight:700,color:T.coral,fontFamily:"JetBrains Mono,monospace",letterSpacing:1.5,textTransform:"uppercase"}}>🏥 Admit If</span>
                        <CopyBtn text={guide.admission_criteria.map(a=>`• ${a}`).join("\n")} color={T.coral}/>
                      </div>
                      <div style={{padding:"8px 12px"}}>
                        {guide.admission_criteria.map((a,i)=><div key={i} style={{fontSize:11,color:T.txt,padding:"3px 0",lineHeight:1.5,borderBottom:i<guide.admission_criteria.length-1?`1px solid ${T.bdr}`:"none"}}>• {a}</div>)}
                      </div>
                    </div>
                  )}
                  {guide.discharge_criteria?.length>0&&(
                    <div style={{...gl({overflow:"hidden",borderLeft:`3px solid ${T.green}55`})}}>
                      <div style={{padding:"7px 12px",borderBottom:`1px solid ${T.bdr}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <span style={{fontSize:9,fontWeight:700,color:T.green,fontFamily:"JetBrains Mono,monospace",letterSpacing:1.5,textTransform:"uppercase"}}>🏠 Discharge If</span>
                        <CopyBtn text={guide.discharge_criteria.map(d=>`• ${d}`).join("\n")} color={T.green}/>
                      </div>
                      <div style={{padding:"8px 12px"}}>
                        {guide.discharge_criteria.map((d,i)=><div key={i} style={{fontSize:11,color:T.txt,padding:"3px 0",lineHeight:1.5,borderBottom:i<guide.discharge_criteria.length-1?`1px solid ${T.bdr}`:"none"}}>• {d}</div>)}
                      </div>
                    </div>
                  )}
                </div>

                {guide.return_precautions?.length>0&&(
                  <Sec label="Return to ED If" color={T.orange} icon="↩️" copyText={guide.return_precautions.map(r=>`• ${r}`).join("\n")}>
                    <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                      {guide.return_precautions.map((r,i)=>(
                        <span key={i} style={{borderRadius:20,padding:"4px 12px",fontSize:11,background:T.oD,border:`1px solid ${T.orange}25`,color:T.orange,fontWeight:600,lineHeight:1.4}}>{r}</span>
                      ))}
                    </div>
                  </Sec>
                )}

                {guide.peds_pearls?.length>0&&(
                  <Sec label="Pediatric Pearls" color={T.gold} icon="👶" copyText={guide.peds_pearls.map(p=>`★ ${p}`).join("\n")}>
                    {guide.peds_pearls.map((p,i)=>(
                      <div key={i} style={{display:"flex",gap:8,padding:"5px 0",borderBottom:i<guide.peds_pearls.length-1?`1px solid ${T.bdr}`:"none",alignItems:"flex-start"}}>
                        <span style={{color:T.gold,flexShrink:0,fontSize:12,lineHeight:1.4}}>★</span>
                        <span style={{fontSize:12,color:T.txt,lineHeight:1.55}}>{p}</span>
                      </div>
                    ))}
                  </Sec>
                )}

                {guide.clinical_pearls?.length>0&&(
                  <Sec label="Clinical Pearls" color={T.teal} icon="💡" copyText={guide.clinical_pearls.map(p=>`★ ${p}`).join("\n")}>
                    {guide.clinical_pearls.map((p,i)=>(
                      <div key={i} style={{display:"flex",gap:8,padding:"5px 0",borderBottom:i<guide.clinical_pearls.length-1?`1px solid ${T.bdr}`:"none",alignItems:"flex-start"}}>
                        <span style={{color:T.teal,flexShrink:0,fontSize:12,lineHeight:1.4}}>★</span>
                        <span style={{fontSize:12,color:T.txt,lineHeight:1.55}}>{p}</span>
                      </div>
                    ))}
                  </Sec>
                )}

                <CopyBtn text={fullText} label="📋 Copy Full Guidance for Chart" color={sel.color} full/>
                <div style={{fontSize:9,color:T.dim,marginTop:8,textAlign:"center"}}>AI-generated · Evidence-based · Always apply clinical judgment</div>
              </div>
            )}

            {guide?._err&&(
              <div style={{...gl({padding:"20px",textAlign:"center"})}}>
                <div style={{fontSize:12,color:T.coral,marginBottom:10}}>Guidance generation failed.</div>
                <button onClick={()=>run(sel)} style={{padding:"7px 18px",borderRadius:8,cursor:"pointer",border:`1px solid ${T.teal}55`,background:T.tD,color:T.teal,fontFamily:"DM Sans,sans-serif",fontSize:12,fontWeight:700}}>Retry</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}