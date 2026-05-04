// ECGHub.jsx — Notrya ECG Hub
// Structured ECG input + AI interpretation + Clinical tools
// No SVG wave library. Physician enters findings, AI analyzes.

import { useState, useCallback, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { ClinicalNote } from "@/api/entities";
import ECGNSTEMIHub from "@/components/ecg/ECGNSTEMIHub";
import ECGAFPathway  from "@/components/ecg/ECGAFPathway";

(() => {
  if (typeof document === "undefined") return;
  if (document.getElementById("ecg-fonts")) return;
  const l = document.createElement("link");
  l.id = "ecg-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "ecg-css";
  s.textContent = `
    @keyframes ecg-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    .ecg-fade{animation:ecg-in .25s ease forwards;}
  `;
  document.head.appendChild(s);
})();

const T = {
  bg:"#050f1e", panel:"#081628", up:"#0e2544",
  b:"rgba(26,53,85,0.8)", bhi:"rgba(42,79,122,0.9)",
  txt:"#e8f0fe", txt2:"#8aaccc", txt3:"#4a6a8a", txt4:"#2e4a6a",
  red:"#ff4444", orange:"#ff9f43", gold:"#f5c842",
  blue:"#3b9eff", purple:"#9b6dff", teal:"#00e5c0", coral:"#ff6b6b",
};
const glass = {backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",background:"rgba(8,22,40,0.72)",border:"1px solid rgba(26,53,85,0.75)",borderRadius:14};

function SendToChartBtn({content}){
  const[sending,setSending]=useState(false);const[sent,setSent]=useState(false);
  if(!content)return null;
  const send=async()=>{setSending(true);try{await ClinicalNote.create({content,source:"QN-Handoff",status:"pending"});setSent(true);setTimeout(()=>setSent(false),3000);}catch(e){}finally{setSending(false);}};
  return(
    <button onClick={send} disabled={sending||sent} style={{width:"100%",padding:"10px 0",borderRadius:8,cursor:sending?"not-allowed":"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:13,border:`1px solid ${sent?"rgba(0,229,192,.4)":"rgba(59,158,255,.3)"}`,background:sent?"rgba(0,229,192,.1)":"rgba(59,158,255,.08)",color:sent?T.teal:T.blue,transition:"all .2s"}}>
      {sent?"✓ Sent to Chart":sending?"Sending…":"📤 Send to Chart"}
    </button>
  );
}

const TABS = [
  {id:"ai",       label:"AI Interpret",   icon:"🤖"},
  {id:"localizer",label:"STEMI Localizer",icon:"🗺"},
  {id:"avblock",  label:"AV Block",       icon:"📶"},
  {id:"qtcalc",   label:"QTc Calc",       icon:"📐"},
  {id:"chads",    label:"CHA₂DS₂-VASc",  icon:"🩸"},
  {id:"nstemi",   label:"NSTEMI",         icon:"🫀"},
  {id:"af",       label:"AF Pathway",     icon:"💙"},
  {id:"timer",    label:"Serial ECG",     icon:"⏱"},
];

// ── STEMI Localizer ──────────────────────────────────────────
const LEADS_LIST = ["I","II","III","aVF","aVL","aVR","V1","V2","V3","V4","V5","V6","V7","V4R"];

function stemiTerritory(ls) {
  const ste  = l => ls[l]==="ste";
  const std  = l => ls[l]==="std";
  const steN = a => a.filter(ste).length;
  const stdN = a => a.filter(std).length;
  if (!Object.values(ls).some(v=>v&&v!=="normal")) return null;
  if (ste("aVR")&&stdN(["I","II","V4","V5","V6"])>=3)
    return {label:"LMCA / Proximal LAD / 3-Vessel Disease",culprit:"Left Main or 3VD",color:T.red,
      action:"Emergent cath. Highest ACS mortality. Consider Impella for cardiogenic shock (Class 2a, 2025). Radial approach preferred (Class 1).",
      pitfall:"Diffuse STD + aVR STE dismissed as demand ischemia. STE aVR > V1 = LMCA over proximal LAD.",source:"2025 ACC/AHA ACS Guideline (Class 1)"};
  if (stdN(["V1","V2","V3"])>=2&&steN(["V1","V2","V3","V4"])===0&&!ste("V7"))
    return {label:"Posterior Wall STEMI Equivalent",culprit:"RCA or LCx",color:T.coral,
      action:"Place posterior leads V7-V9 immediately. STE ≥0.5 mm = diagnostic. Activate cath. Treat as full STEMI.",
      pitfall:"Most missed STEMI. STD in V1-V3 = posterior STE mirrored. Tall upright T in V1-V3 is the second sign.",source:"2025 ACC/AHA ACS Guideline (STEMI Equivalent)"};
  if (ste("V7"))
    return {label:"Confirmed Posterior STEMI",culprit:"RCA posterior descending or LCx",color:T.coral,
      action:"Cath lab activation. ASA + heparin + P2Y12. Radial preferred.",
      pitfall:"Always obtain V7-V9 when V1-V3 show STD without clear anterior territory STE.",source:"2025 ACC/AHA ACS Guideline"};
  if (steN(["II","III","aVF"])>=2){
    const rv=ste("V1")||ste("V4R");
    return {label:"Inferior STEMI"+(rv?" + RV Involvement":""),culprit:rv?"Proximal RCA — confirm V4R STE ≥0.5mm":"RCA (80%) or LCx (20%)",color:T.orange,
      action:rv?"AVOID nitrates. Cautious IV fluids for preload-dependent RV. Activate cath. Watch for high-degree AV block."
              :"Activate cath. Complete revascularisation recommended (Class 1, 2025). Monitor for AV block.",
      pitfall:"RV MI is volume-dependent — nitrates can cause fatal hypotension. STE in V1 with inferior STEMI = proximal RCA.",source:"2025 ACC/AHA ACS Guideline (Class 1)"};
  }
  if (steN(["V1","V2","V3","V4"])>=2){
    const ext=ste("V5")||ste("V6")||ste("I")||ste("aVL");
    return {label:ext?"Extensive Anterior / Anterolateral STEMI":"Anterior / Anteroseptal STEMI",culprit:ste("V1")&&ste("V2")?"Proximal LAD (highest risk — before D1/S1)":"Mid-LAD",color:T.red,
      action:"Activate cath. Largest myocardium at risk. Monitor for complete AV block and VF. Complete revascularisation recommended.",
      pitfall:"De Winter pattern (upsloping STD + peaked T in V1-V4, NO STE) = proximal LAD occlusion. Activate cath.",source:"2025 ACC/AHA ACS Guideline (Class 1)"};
  }
  if (steN(["I","aVL","V5","V6"])>=2)
    return {label:"Lateral STEMI",culprit:"LCx or First Diagonal (D1)",color:T.orange,
      action:"Activate cath. Check inferior leads — lateral STEMI frequently extends. Radial preferred.",
      pitfall:"High lateral MI (I, aVL only) has small STE — easy to underread. Reciprocal STD in II/III/aVF is the tip-off.",source:"2025 ACC/AHA ACS Guideline (Class 1)"};
  return {label:"Nonspecific / Pattern Unclear",culprit:"Indeterminate",color:T.txt4,
    action:"Serial ECGs at 0, 30, 60 min. Obtain posterior (V7-V9) and right-sided (V4R) leads if territory unclear. hs-cTn at 0 and 1-2h.",
    pitfall:"Normal or nonspecific ECG does not rule out complete coronary occlusion (OMI paradigm). Serial ECG + troponin mandatory.",source:"2025 ACC/AHA ACS Guideline"};
}

function STEMILocalizer() {
  const [leadStates, setLeadStates] = useState({});
  function cycle(lead){setLeadStates(p=>{const cur=p[lead]||"normal";return{...p,[lead]:cur==="normal"?"ste":cur==="ste"?"std":"normal"};});}
  const result = stemiTerritory(leadStates);
  return (
    <div>
      <div style={{fontSize:11,color:T.txt3,marginBottom:10}}>Tap each lead to cycle: <span style={{color:T.red,fontWeight:700}}>STE</span> → <span style={{color:T.blue,fontWeight:700}}>STD</span> → Normal</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:6,marginBottom:8}}>
        {LEADS_LIST.map(lead=>{
          const st=leadStates[lead]||"normal";
          const bc=st==="ste"?T.red:st==="std"?T.blue:"rgba(42,79,122,0.4)";
          const bg=st==="ste"?`${T.red}18`:st==="std"?`${T.blue}18`:"rgba(8,22,40,0.5)";
          return <button key={lead} onClick={()=>cycle(lead)}
            style={{padding:"9px 3px",borderRadius:8,border:`1px solid ${bc}`,background:bg,color:bc,fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:700,cursor:"pointer",textAlign:"center",lineHeight:1.2}}>
            {lead}{st!=="normal"&&<div style={{fontSize:7,marginTop:1}}>{st.toUpperCase()}</div>}
          </button>;
        })}
      </div>
      <button onClick={()=>setLeadStates({})} style={{marginBottom:12,padding:"3px 10px",borderRadius:5,border:"1px solid rgba(42,79,122,0.35)",background:"transparent",color:T.txt4,fontFamily:"'JetBrains Mono',monospace",fontSize:8,letterSpacing:1,textTransform:"uppercase",cursor:"pointer"}}>Clear All</button>
      {result?(
        <div className="ecg-fade" style={{padding:"14px 16px",borderRadius:12,background:`${result.color}0d`,border:`1px solid ${result.color}33`}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:16,color:result.color,marginBottom:3}}>{result.label}</div>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.txt3,marginBottom:12}}>Likely culprit: {result.culprit}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:8}}>
            <div style={{padding:"9px 11px",borderRadius:8,background:"rgba(0,229,192,0.06)",border:"1px solid rgba(0,229,192,0.2)"}}>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.teal,letterSpacing:1,textTransform:"uppercase",marginBottom:5}}>Action</div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.txt2,lineHeight:1.5}}>{result.action}</div>
            </div>
            <div style={{padding:"9px 11px",borderRadius:8,background:"rgba(255,159,67,0.06)",border:"1px solid rgba(255,159,67,0.2)"}}>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.orange,letterSpacing:1,textTransform:"uppercase",marginBottom:5}}>Pitfall</div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.txt2,lineHeight:1.5,fontStyle:"italic"}}>{result.pitfall}</div>
            </div>
          </div>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.txt4,textAlign:"right"}}>{result.source}</div>
        </div>
      ):(
        <div style={{padding:"14px",borderRadius:10,textAlign:"center",background:"rgba(42,79,122,0.1)",border:"1px solid rgba(42,79,122,0.25)",fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.txt4}}>
          Select lead findings above to localize territory and culprit artery
        </div>
      )}
    </div>
  );
}

// ── AV Block Classifier ──────────────────────────────────────
const AV_Q = [
  {id:"ratio",q:"P:QRS relationship?",options:[
    {label:"1:1 — every P conducts",next:"pr"},
    {label:"Progressively longer PR → dropped beat",next:"mobitz1"},
    {label:"Constant PR → sudden dropped beat",next:"mobitz2"},
    {label:"2:1 — every other P blocked",next:"two1"},
    {label:"P and QRS march independently",next:"chb"},
  ]},
  {id:"pr",q:"PR interval?",options:[
    {label:"Short < 120ms",next:"pre_exc"},
    {label:"Normal 120–200ms",next:"nsr"},
    {label:"Prolonged > 200ms",next:"first"},
  ]},
];
const AV_RES = {
  nsr:{label:"Normal Sinus Conduction",color:T.teal,urgency:"None",
    action:"No AV block. Review if clinically bradycardic.",source:"Normal"},
  pre_exc:{label:"Pre-Excitation / Short PR",color:T.gold,urgency:"Moderate",
    action:"Look for delta wave (WPW). Pre-excited AF: procainamide or ibutilide. NEVER adenosine, verapamil, or digoxin in WPW+AF.",source:"2015 ACC/AHA/HRS SVT"},
  first:{label:"First-Degree AV Block",color:T.gold,urgency:"Low",
    action:"Review causative drugs (BB, CCB, digoxin). No pacing required in isolation.",source:"2018 ACC/AHA Bradycardia Guideline"},
  mobitz1:{label:"Mobitz I — Wenckebach",color:T.orange,urgency:"Moderate",
    action:"Address reversible causes (inferior MI, vagal, AV-nodal drugs). Atropine if symptomatic. Rarely requires pacing.",source:"2018 ACC/AHA Bradycardia Guideline"},
  mobitz2:{label:"Mobitz II",color:T.red,urgency:"High — Pacing Likely",
    action:"Urgent cardiology. TCP if unstable. Permanent pacemaker indicated (Class 1). Avoid ALL AV-nodal blocking agents.",source:"2018 ACC/AHA Bradycardia (Class 1 PPM)"},
  chb:{label:"Third-Degree Complete AV Block",color:T.red,urgency:"Critical",
    action:"TCP immediately if unstable. Atropine temporizing only. Transvenous pacing. Assess: inferior MI, Lyme, drug toxicity, hyperkalemia.",source:"2018 ACC/AHA Bradycardia (Class 1 pacing)"},
  two1:{label:"2:1 AV Block — Indeterminate",color:T.red,urgency:"High",
    action:"Treat as Mobitz II until proven otherwise. TCP if unstable. Cardiology consult. Look for AV block type on longer strips.",source:"2018 ACC/AHA Bradycardia Guideline"},
};

function AVBlockTab() {
  const [step, setStep] = useState("ratio");
  const [path, setPath] = useState([]);
  const result = AV_RES[step];
  const question = AV_Q.find(q=>q.id===step);
  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
        {path.length>0&&<button onClick={()=>{const prev=path[path.length-1];setPath(p=>p.slice(0,-1));setStep(prev);}} style={{padding:"4px 10px",borderRadius:6,border:"1px solid rgba(42,79,122,0.5)",background:"transparent",color:T.txt3,fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>← Back</button>}
        {path.length>0&&<div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.txt4}}>Step {path.length}</div>}
        <button onClick={()=>{setStep("ratio");setPath([]);}} style={{marginLeft:"auto",padding:"3px 9px",borderRadius:5,border:"1px solid rgba(42,79,122,0.4)",background:"transparent",color:T.txt4,fontSize:9,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",letterSpacing:1,textTransform:"uppercase"}}>Reset</button>
      </div>
      {result ? (
        <div className="ecg-fade" style={{padding:"16px 18px",borderRadius:12,background:`${result.color}0d`,border:`2px solid ${result.color}44`,borderLeft:`5px solid ${result.color}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:result.color}}>{result.label}</div>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:20,background:`${result.color}20`,border:`1px solid ${result.color}44`,color:result.color}}>{result.urgency}</span>
          </div>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.txt,lineHeight:1.65,marginBottom:10}}>{result.action}</div>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.txt4}}>{result.source}</div>
        </div>
      ) : question ? (
        <div>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:600,color:T.txt,marginBottom:14,padding:"10px 14px",background:"rgba(14,37,68,0.5)",borderRadius:8,border:"1px solid rgba(26,53,85,0.7)"}}>{question.q}</div>
          {question.options.map((opt,i)=>(
            <button key={i} onClick={()=>{setPath(p=>[...p,step]);setStep(opt.next);}}
              style={{display:"flex",alignItems:"center",gap:14,width:"100%",minHeight:52,padding:"12px 14px",borderRadius:10,cursor:"pointer",textAlign:"left",border:"1.5px solid rgba(42,79,122,0.6)",marginBottom:8,transition:"all .12s",background:"rgba(14,28,58,0.75)",fontFamily:"'DM Sans',sans-serif",fontSize:13,color:T.txt2}}>
              <div style={{width:28,height:28,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(18,40,80,0.8)",fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:700,color:T.txt4}}>{i+1}</div>
              {opt.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ── QTc Calculator ──────────────────────────────────────────
function QTcTab() {
  const [qt, setQt] = useState("");
  const [hr, setHr] = useState("");
  const [sex, setSex] = useState("M");
  const qtcMs = useMemo(()=>{const q=parseFloat(qt),h=parseFloat(hr);if(isNaN(q)||isNaN(h)||h<=0)return null;return Math.round(q/Math.sqrt(60/h));},[qt,hr]);
  const norm = sex==="M"?440:460;
  const risk = qtcMs===null?"—":qtcMs<norm?"Normal":qtcMs<500?"Borderline":qtcMs<600?"High Risk — TdP":"CRITICAL — Imminent TdP";
  const rCol = qtcMs===null?T.txt4:qtcMs<norm?T.teal:qtcMs<500?T.gold:qtcMs<600?T.coral:T.red;
  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr auto",gap:10,alignItems:"end"}}>
        {[{label:"QT Interval (ms)",val:qt,set:setQt,ph:"400"},{label:"Heart Rate (bpm)",val:hr,set:setHr,ph:"72"}].map(f=>(
          <div key={f.label}>
            <div style={{fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:".06em",fontWeight:700,marginBottom:4}}>{f.label}</div>
            <input type="number" value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph} style={{width:"100%",background:"rgba(14,37,68,.5)",border:"1px solid rgba(26,53,85,.8)",borderRadius:6,padding:"8px 10px",color:T.txt,fontFamily:"'JetBrains Mono',monospace",fontSize:15,fontWeight:700,outline:"none",textAlign:"center"}}/>
          </div>
        ))}
        <div>
          <div style={{fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:".06em",fontWeight:700,marginBottom:4}}>Sex</div>
          <div style={{display:"flex",gap:4}}>{["M","F"].map(s=><button key={s} onClick={()=>setSex(s)} style={{flex:1,padding:"8px 0",borderRadius:6,cursor:"pointer",border:`1px solid ${sex===s?"rgba(59,158,255,.5)":"rgba(26,53,85,.7)"}`,background:sex===s?"rgba(59,158,255,.15)":"rgba(14,37,68,.4)",color:sex===s?T.blue:T.txt4,fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:700}}>{s}</button>)}</div>
        </div>
      </div>
      {qtcMs&&(
        <div className="ecg-fade" style={{padding:"18px 20px",borderRadius:12,background:`${rCol}0d`,border:`2px solid ${rCol}44`,textAlign:"center"}}>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>QTc (Bazett)</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:52,fontWeight:900,color:rCol,lineHeight:1,marginBottom:6}}>{qtcMs} ms</div>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:700,color:rCol,marginBottom:4}}>{risk}</div>
          <div style={{fontSize:11,color:T.txt3}}>Normal limit: {norm}ms ({sex==="M"?"male":"female"}) · RR interval: {qt&&hr?(60/parseFloat(hr)*1000).toFixed(0):"—"} ms</div>
        </div>
      )}
      <div style={{...glass,padding:"14px 16px"}}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:1,marginBottom:10,fontWeight:700}}>QTc Risk Thresholds</div>
        {[["< 440ms (♂) / < 460ms (♀)","Normal","#00e5c0"],["440–499ms","Borderline — review drugs, electrolytes",T.gold],["≥ 500ms","High TdP risk — hold offending drugs, Mg²⁺ 2g IV, monitor",T.coral],["≥ 600ms","Imminent TdP — Mg²⁺ IV, overdrive pacing, EP consult",T.red]].map(([r,d,c])=>(
          <div key={r} style={{display:"grid",gridTemplateColumns:"180px 1fr",gap:10,marginBottom:8,paddingBottom:8,borderBottom:"1px solid rgba(26,53,85,.4)"}}>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:700,color:c}}>{r}</div>
            <div style={{fontSize:11,color:T.txt2}}>{d}</div>
          </div>
        ))}
        <div style={{fontSize:10,color:T.txt4,lineHeight:1.6,marginTop:4,fontStyle:"italic"}}>Always measure QTc manually — automated values are incorrect in ~30% of cases. Use the lead with the longest visible T wave. Measure in a long-cycle RR interval.</div>
      </div>
    </div>
  );
}

// ── CHA₂DS₂-VASc ────────────────────────────────────────────
const CHADS_ITEMS = [
  {id:"chf",label:"Congestive Heart Failure (or LV dysfunction)",pts:1},
  {id:"htn",label:"Hypertension",pts:1},
  {id:"age75",label:"Age ≥ 75 years",pts:2},
  {id:"dm",label:"Diabetes Mellitus",pts:1},
  {id:"stroke",label:"Prior Stroke / TIA / Thromboembolism",pts:2},
  {id:"vasc",label:"Vascular disease (prior MI, PAD, aortic plaque)",pts:1},
  {id:"age65",label:"Age 65–74 years",pts:1},
  {id:"sex",label:"Sex category — Female",pts:1},
];

function CHADSTab() {
  const [checked, setChecked] = useState({});
  const score = CHADS_ITEMS.reduce((s,i)=>s+(checked[i.id]?i.pts:0),0);
  const risk = score===0?"Low — No anticoagulation":score===1?"Borderline — Consider sex only (female alone = 0 net points)":score>=2?"High — Anticoagulate (DOAC preferred over warfarin)":"";
  const stroke1yr = [0,1.3,2.2,3.2,4,6.7,9.8,9.6,12.5,15.2][Math.min(score,9)]||"—";
  const rCol = score===0?T.teal:score===1?T.gold:T.coral;
  return (
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      <div style={{display:"flex",alignItems:"center",gap:14,padding:"12px 16px",borderRadius:10,background:`${rCol}10`,border:`1px solid ${rCol}30`,borderLeft:`4px solid ${rCol}`}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:44,fontWeight:900,color:rCol,lineHeight:1}}>{score}</div>
        <div><div style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,color:rCol}}>{risk||"Select items below"}</div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:rCol,marginTop:3}}>{score>0?`~${stroke1yr}% annual stroke risk`:""}</div></div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:5}}>
        {CHADS_ITEMS.map(item=>{
          const on=checked[item.id];
          return(
            <div key={item.id} onClick={()=>setChecked(p=>({...p,[item.id]:!p[item.id]}))}
              style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:8,cursor:"pointer",background:on?"rgba(59,158,255,.08)":"rgba(14,37,68,.4)",border:`1px solid ${on?"rgba(59,158,255,.3)":"rgba(26,53,85,.6)"}`,transition:"all .12s"}}>
              <div style={{width:18,height:18,borderRadius:4,flexShrink:0,border:`1.5px solid ${on?T.blue:"rgba(42,79,122,.6)"}`,background:on?"rgba(59,158,255,.2)":"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>
                {on&&<span style={{color:T.blue,fontSize:11,lineHeight:1}}>✓</span>}
              </div>
              <span style={{flex:1,fontSize:12,color:on?T.txt:T.txt3}}>{item.label}</span>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:700,color:on?T.blue:T.txt4,minWidth:24,textAlign:"right"}}>+{item.pts}</span>
            </div>
          );
        })}
      </div>
      <div style={{...glass,padding:"12px 14px"}}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:1,marginBottom:8,fontWeight:700}}>2023 ACC/AHA AF Guideline — Anticoagulation Thresholds</div>
        {[["Score 0 (male)","No anticoagulation recommended",T.teal],["Score 1 (female only)","No net benefit — female sex alone does not count",T.gold],["Score ≥2 (or 1 if male)","Anticoagulate — DOAC preferred over warfarin (Class 1)",T.coral]].map(([r,d,c])=>(
          <div key={r} style={{display:"flex",gap:10,marginBottom:7,paddingBottom:7,borderBottom:"1px solid rgba(26,53,85,.4)"}}>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:700,color:c,minWidth:130}}>{r}</div>
            <div style={{fontSize:11,color:T.txt2}}>{d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── AI Interpreter ───────────────────────────────────────────
const RHYTHMS_LIST = ["Normal Sinus Rhythm","Sinus Tachycardia","Sinus Bradycardia","Atrial Fibrillation","Atrial Flutter","SVT / AVNRT","AVRT","Junctional Rhythm","Accelerated Idioventricular","Ventricular Tachycardia","Ventricular Fibrillation","Paced Rhythm","Sinus Pause / SA Block","Other"];
const AXES_LIST    = ["Normal (−30° to +90°)","Left Axis Deviation (< −30°)","Right Axis Deviation (> +90°)","Extreme / Northwest (< −90°)"];
const MORPH_OPTS   = ["LBBB","RBBB","LAFB (left anterior hemiblock)","LPFB","LVH","RVH","Delta wave / WPW","Brugada coved pattern (V1-V2)","Epsilon wave (ARVC — V1-V3)","Osborn wave (hypothermia)","Q waves — inferior","Q waves — anterior","Q waves — lateral","Low voltage (< 5mm limb leads)","Pacemaker spikes"];
const TWAVE_OPTS   = ["T inversions — anterior (V1-V4)","T inversions — inferior (II/III/aVF)","T inversions — lateral (I/aVL/V5-V6)","Hyperacute T waves (tall, broad, asymmetric)","Peaked symmetric T waves (hyperkalemia)","Biphasic T waves V2-V3 (Wellens A)","Deep symmetric inversions V2-V3 (Wellens B)","Reciprocal T inversion aVL (inferior STEMI)","Flattened T waves diffuse","Prominent U waves"];
const OTHER_OPTS   = ["New LBBB (STEMI equivalent)","De Winter T-wave pattern (proximal LAD)","Diffuse saddle-shaped STE + PR depression (pericarditis)","PR depression (pericarditis)","aVR STE + diffuse STD (LMCA / 3VD)","Terminal R in aVR ≥ 3mm (TCA toxicity)","Electrical alternans","QRS widening (toxicology / hyperkalemia)","Prolonged QTc > 500ms","PVCs — frequent or runs","Pacemaker malfunction","P pulmonale (peaked P > 2.5mm)","P mitrale (notched, wide P)"];

const URGENCY_COLOR = {Critical:T.red, High:T.coral, Moderate:T.gold, Low:T.teal};

function ECGAITab() {
  const [rate,      setRate]      = useState("");
  const [rhythm,    setRhythm]    = useState("");
  const [pr,        setPr]        = useState("");
  const [qrs,       setQrs]       = useState("");
  const [qt,        setQt]        = useState("");
  const [axis,      setAxis]      = useState("");
  const [morph,     setMorph]     = useState(new Set());
  const [stChanges, setStChanges] = useState({});
  const [tWaves,    setTWaves]    = useState(new Set());
  const [other,     setOther]     = useState(new Set());
  const [context,   setContext]   = useState("");
  const [loading,   setLoading]   = useState(false);
  const [result,    setResult]    = useState(null);
  const [errMsg,    setErrMsg]    = useState(null);

  const qtcMs = useMemo(()=>{const q=parseFloat(qt),h=parseFloat(rate);if(isNaN(q)||isNaN(h)||h<=0)return null;return Math.round(q/Math.sqrt(60/h));},[qt,rate]);

  const toggle = useCallback((setter,val)=>setter(prev=>{const n=new Set(prev);n.has(val)?n.delete(val):n.add(val);return n;}),[]);

  const cycleSTLead = lead=>setStChanges(p=>{const cur=p[lead]||"normal";return{...p,[lead]:cur==="normal"?"ste":cur==="ste"?"std":"normal"};});

  const buildFindings = useCallback(()=>{
    const parts = [];
    if (rate)    parts.push(`Rate: ${rate} bpm`);
    if (rhythm)  parts.push(`Rhythm: ${rhythm}`);
    if (pr)      parts.push(`PR interval: ${pr} ms`);
    if (qrs)     parts.push(`QRS duration: ${qrs} ms`);
    if (qt)      parts.push(`QT interval: ${qt} ms`);
    if (qtcMs)   parts.push(`QTc (Bazett): ${qtcMs} ms`);
    if (axis)    parts.push(`Axis: ${axis}`);
    if (morph.size>0) parts.push(`QRS morphology: ${[...morph].join(", ")}`);
    const steL = Object.entries(stChanges).filter(([,v])=>v==="ste").map(([l])=>l);
    const stdL = Object.entries(stChanges).filter(([,v])=>v==="std").map(([l])=>l);
    if (steL.length>0) parts.push(`ST elevation in: ${steL.join(", ")}`);
    if (stdL.length>0) parts.push(`ST depression in: ${stdL.join(", ")}`);
    if (tWaves.size>0) parts.push(`T wave changes: ${[...tWaves].join(", ")}`);
    if (other.size>0)  parts.push(`Other findings: ${[...other].join(", ")}`);
    if (context)       parts.push(`Clinical context: ${context}`);
    return parts.join("\n");
  },[rate,rhythm,pr,qrs,qt,qtcMs,axis,morph,stChanges,tWaves,other,context]);

  const analyze = useCallback(async()=>{
    const findings = buildFindings();
    if(!findings.trim()){setErrMsg("Enter at least one ECG finding before analyzing.");return;}
    setLoading(true); setResult(null); setErrMsg(null);
    const PROMPT = `You are an expert emergency medicine ECG interpreter following 2025 ACC/AHA/ACEP guidelines. Analyze the ECG findings below and return a structured JSON interpretation. Be clinically precise and actionable. For any STEMI equivalent (Wellens syndrome, De Winter pattern, posterior MI, Brugada type 1, aVR elevation with diffuse depression, new LBBB), explicitly flag it. For dangerous patterns (WPW with AF, TCA toxicity, hyperkalemia, long QT with TdP risk), flag them. Never miss a critical finding.

ECG FINDINGS:
${findings}

Return ONLY valid JSON with this exact structure — no preamble, no markdown:
{"interpretation":"primary ECG interpretation in 1-2 sentences","urgency":"Critical|High|Moderate|Low","urgency_reason":"brief reason for urgency level","stemi_equivalent":true,"dangerous_pattern":"pattern name or null","key_findings":["finding1","finding2","finding3"],"differentials":["diagnosis1","diagnosis2","diagnosis3"],"recommended_actions":["action1","action2","action3"],"do_not_miss":"critical pitfall to avoid","guideline_note":"relevant guideline reference"}`;
    try{
      const reply = await base44.integrations.Core.InvokeLLM({prompt: PROMPT});
      let parsed;
      if(typeof reply==="object"&&reply!==null&&reply.interpretation){parsed=reply;}
      else if(typeof reply==="string"){parsed=JSON.parse(reply.replace(/```json|```/g,"").trim());}
      else{parsed=reply;}
      setResult(parsed);
    }catch(e){
      setErrMsg("AI interpretation failed — check connection and try again.");
    }finally{setLoading(false);}
  },[buildFindings]);

  const reset = ()=>{setRate("");setRhythm("");setPr("");setQrs("");setQt("");setAxis("");setMorph(new Set());setStChanges({});setTWaves(new Set());setOther(new Set());setContext("");setResult(null);setErrMsg(null);};

  const Chip = ({label,active,color,onClick})=>(
    <button onClick={onClick} style={{padding:"4px 10px",borderRadius:20,fontSize:10,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:active?700:400,border:`1px solid ${active?color+"88":"rgba(26,53,85,.6)"}`,background:active?`${color}16`:"rgba(14,37,68,.35)",color:active?color:T.txt4,transition:"all .1s"}}>
      {label}
    </button>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:12}}>

      {/* Rate + Rhythm */}
      <div style={{...glass,padding:"14px 16px"}}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.teal,letterSpacing:1.2,textTransform:"uppercase",fontWeight:700,marginBottom:12}}>Rate & Rhythm</div>
        <div style={{display:"grid",gridTemplateColumns:"140px 1fr",gap:10}}>
          <div>
            <div style={{fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:".06em",fontWeight:700,marginBottom:4}}>Rate (bpm)</div>
            <input type="number" value={rate} onChange={e=>setRate(e.target.value)} placeholder="72" style={{width:"100%",background:"rgba(14,37,68,.5)",border:"1px solid rgba(26,53,85,.8)",borderRadius:6,padding:"8px 10px",color:T.txt,fontFamily:"'JetBrains Mono',monospace",fontSize:15,fontWeight:700,outline:"none",textAlign:"center"}}/>
          </div>
          <div>
            <div style={{fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:".06em",fontWeight:700,marginBottom:4}}>Rhythm</div>
            <select value={rhythm} onChange={e=>setRhythm(e.target.value)} style={{width:"100%",background:"rgba(14,37,68,.5)",border:"1px solid rgba(26,53,85,.8)",borderRadius:6,padding:"8px 10px",color:rhythm?T.txt:T.txt4,fontFamily:"'DM Sans',sans-serif",fontSize:13,outline:"none"}}>
              <option value="">— Select rhythm —</option>
              {RHYTHMS_LIST.map(r=><option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Intervals */}
      <div style={{...glass,padding:"14px 16px"}}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.teal,letterSpacing:1.2,textTransform:"uppercase",fontWeight:700,marginBottom:12}}>Intervals</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
          {[{label:"PR (ms)",val:pr,set:setPr,ph:"160"},{label:"QRS (ms)",val:qrs,set:setQrs,ph:"80"},{label:"QT (ms)",val:qt,set:setQt,ph:"400"}].map(f=>(
            <div key={f.label}>
              <div style={{fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:".06em",fontWeight:700,marginBottom:4}}>{f.label}</div>
              <input type="number" value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph} style={{width:"100%",background:"rgba(14,37,68,.5)",border:"1px solid rgba(26,53,85,.8)",borderRadius:6,padding:"8px 8px",color:T.txt,fontFamily:"'JetBrains Mono',monospace",fontSize:14,fontWeight:700,outline:"none",textAlign:"center"}}/>
            </div>
          ))}
          <div>
            <div style={{fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:".06em",fontWeight:700,marginBottom:4}}>QTc (Bazett)</div>
            <div style={{background:"rgba(14,37,68,.3)",border:`1px solid ${qtcMs&&qtcMs>=500?"rgba(255,107,107,.5)":qtcMs&&qtcMs>=440?"rgba(245,200,66,.4)":"rgba(26,53,85,.7)"}`,borderRadius:6,padding:"8px 8px",textAlign:"center",fontFamily:"'JetBrains Mono',monospace",fontSize:14,fontWeight:700,color:qtcMs&&qtcMs>=500?T.coral:qtcMs&&qtcMs>=440?T.gold:qtcMs?T.teal:T.txt4}}>
              {qtcMs?`${qtcMs} ms`:"auto"}
            </div>
          </div>
        </div>
      </div>

      {/* Axis */}
      <div style={{...glass,padding:"14px 16px"}}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.teal,letterSpacing:1.2,textTransform:"uppercase",fontWeight:700,marginBottom:10}}>Axis</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {AXES_LIST.map(a=>{
            const sel=axis===a;
            const c=a.includes("Left")?T.blue:a.includes("Right")?T.orange:a.includes("Extreme")?T.red:T.teal;
            return <button key={a} onClick={()=>setAxis(sel?"":a)} style={{padding:"6px 12px",borderRadius:20,fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:sel?700:500,border:`1px solid ${sel?c+"88":"rgba(26,53,85,.7)"}`,background:sel?`${c}18`:"rgba(14,37,68,.4)",color:sel?c:T.txt3}}>{a.split(" (")[0]}</button>;
          })}
        </div>
      </div>

      {/* QRS Morphology */}
      <div style={{...glass,padding:"14px 16px"}}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.teal,letterSpacing:1.2,textTransform:"uppercase",fontWeight:700,marginBottom:10}}>QRS Morphology</div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {MORPH_OPTS.map(m=>{
            const danger=["LBBB","Delta wave / WPW","Brugada coved pattern (V1-V2)","Epsilon wave (ARVC — V1-V3)"].includes(m);
            return <Chip key={m} label={m} active={morph.has(m)} color={danger?T.coral:T.blue} onClick={()=>toggle(setMorph,m)}/>;
          })}
        </div>
      </div>

      {/* ST Segments */}
      <div style={{...glass,padding:"14px 16px"}}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.teal,letterSpacing:1.2,textTransform:"uppercase",fontWeight:700,marginBottom:8}}>ST Segments — tap: STE → STD → Normal</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:5,marginBottom:8}}>
          {["I","II","III","aVF","aVL","aVR","V1","V2","V3","V4","V5","V6","V7","V4R"].map(lead=>{
            const st=stChanges[lead]||"normal";
            const bc=st==="ste"?T.red:st==="std"?T.blue:"rgba(42,79,122,0.4)";
            const bg=st==="ste"?`${T.red}18`:st==="std"?`${T.blue}18`:"rgba(8,22,40,0.5)";
            return <button key={lead} onClick={()=>cycleSTLead(lead)} style={{padding:"8px 3px",borderRadius:7,border:`1px solid ${bc}`,background:bg,color:bc,fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:700,cursor:"pointer",textAlign:"center",lineHeight:1.2}}>
              {lead}{st!=="normal"&&<div style={{fontSize:7,marginTop:1}}>{st.toUpperCase()}</div>}
            </button>;
          })}
        </div>
        <button onClick={()=>setStChanges({})} style={{padding:"3px 10px",borderRadius:5,border:"1px solid rgba(26,53,85,.5)",background:"transparent",color:T.txt4,fontFamily:"'JetBrains Mono',monospace",fontSize:8,letterSpacing:1,textTransform:"uppercase",cursor:"pointer"}}>Clear ST</button>
      </div>

      {/* T Waves + Other */}
      <div style={{...glass,padding:"14px 16px"}}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.teal,letterSpacing:1.2,textTransform:"uppercase",fontWeight:700,marginBottom:10}}>T Wave Changes</div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:14}}>
          {TWAVE_OPTS.map(t=>{
            const urgent=t.includes("Wellens")||t.includes("Hyperacute")||t.includes("hyperkalemia");
            return <Chip key={t} label={t} active={tWaves.has(t)} color={urgent?T.orange:T.purple} onClick={()=>toggle(setTWaves,t)}/>;
          })}
        </div>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.teal,letterSpacing:1.2,textTransform:"uppercase",fontWeight:700,marginBottom:10}}>Other Findings</div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {OTHER_OPTS.map(o=>{
            const urgent=o.includes("New LBBB")||o.includes("De Winter")||o.includes("TCA")||o.includes("QTc");
            return <Chip key={o} label={o} active={other.has(o)} color={urgent?T.coral:T.teal} onClick={()=>toggle(setOther,o)}/>;
          })}
        </div>
      </div>

      {/* Clinical Context */}
      <div style={{...glass,padding:"14px 16px"}}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.teal,letterSpacing:1.2,textTransform:"uppercase",fontWeight:700,marginBottom:8}}>Clinical Context (optional)</div>
        <textarea value={context} onChange={e=>setContext(e.target.value)} rows={2}
          placeholder="e.g. 58M, chest pain × 2h, diaphoretic, BP 90/60. Prior ECG normal 6 months ago. On metoprolol."
          style={{width:"100%",background:"rgba(14,37,68,.4)",border:"1px solid rgba(26,53,85,.7)",borderRadius:8,padding:"9px 12px",color:T.txt,fontFamily:"'DM Sans',sans-serif",fontSize:12,outline:"none",resize:"vertical",lineHeight:1.5}}/>
      </div>

      {/* Analyze */}
      <button onClick={analyze} disabled={loading}
        style={{width:"100%",minHeight:52,borderRadius:12,cursor:loading?"not-allowed":"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:15,border:`1.5px solid ${loading?"rgba(0,229,192,.15)":"rgba(0,229,192,.4)"}`,background:loading?"rgba(0,229,192,.04)":"linear-gradient(135deg,rgba(0,229,192,.18),rgba(59,158,255,.12))",color:loading?T.txt3:T.teal,transition:"all .2s",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
        {loading?<>⏳ Analyzing ECG…</>:<>🤖 Analyze with AI</>}
      </button>

      {errMsg&&<div style={{padding:"10px 14px",borderRadius:8,background:"rgba(255,107,107,.08)",border:"1px solid rgba(255,107,107,.3)",fontSize:12,color:T.coral}}>{errMsg}</div>}

      {/* Results */}
      {result&&(
        <div className="ecg-fade" style={{display:"flex",flexDirection:"column",gap:10}}>
          {/* Urgency header */}
          <div style={{padding:"16px 18px",borderRadius:12,background:`${URGENCY_COLOR[result.urgency]||T.teal}10`,border:`2px solid ${URGENCY_COLOR[result.urgency]||T.teal}44`,borderLeft:`5px solid ${URGENCY_COLOR[result.urgency]||T.teal}`}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,flexWrap:"wrap"}}>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:700,color:URGENCY_COLOR[result.urgency],background:`${URGENCY_COLOR[result.urgency]}22`,padding:"3px 12px",borderRadius:20,border:`1px solid ${URGENCY_COLOR[result.urgency]}44`}}>{result.urgency}</span>
              {result.stemi_equivalent&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:700,color:T.red,background:"rgba(255,68,68,.15)",padding:"3px 12px",borderRadius:20,border:"1px solid rgba(255,68,68,.4)"}}>⚡ STEMI EQUIVALENT</span>}
              {result.dangerous_pattern&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.orange,background:"rgba(255,159,67,.1)",padding:"2px 10px",borderRadius:20,border:"1px solid rgba(255,159,67,.35)"}}>{result.dangerous_pattern}</span>}
            </div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,color:T.txt,marginBottom:6}}>{result.interpretation}</div>
            {result.urgency_reason&&<div style={{fontSize:11,color:T.txt3,lineHeight:1.55}}>{result.urgency_reason}</div>}
          </div>

          {/* Key findings + Differentials */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div style={{...glass,padding:"12px 14px"}}>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.teal,textTransform:"uppercase",letterSpacing:1,fontWeight:700,marginBottom:8}}>Key Findings</div>
              {result.key_findings?.map((f,i)=><div key={i} style={{display:"flex",gap:6,marginBottom:4}}><span style={{color:T.teal,fontSize:9,marginTop:2,flexShrink:0}}>▸</span><span style={{fontSize:11,color:T.txt2,lineHeight:1.45}}>{f}</span></div>)}
            </div>
            <div style={{...glass,padding:"12px 14px"}}>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.blue,textTransform:"uppercase",letterSpacing:1,fontWeight:700,marginBottom:8}}>Differential</div>
              {result.differentials?.map((d,i)=><div key={i} style={{display:"flex",gap:6,marginBottom:4}}><span style={{color:T.blue,fontSize:9,marginTop:2,flexShrink:0,fontFamily:"'JetBrains Mono',monospace"}}>{i+1}.</span><span style={{fontSize:11,color:T.txt2,lineHeight:1.45}}>{d}</span></div>)}
            </div>
          </div>

          {/* Recommended actions */}
          <div style={{...glass,padding:"14px 16px"}}>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.orange,textTransform:"uppercase",letterSpacing:1,fontWeight:700,marginBottom:10}}>Recommended Actions</div>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              {result.recommended_actions?.map((a,i)=>(
                <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"7px 10px",borderRadius:7,background:"rgba(255,159,67,.06)",border:"1px solid rgba(255,159,67,.15)"}}>
                  <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:T.orange,fontWeight:700,flexShrink:0,minWidth:16}}>{i+1}</span>
                  <span style={{fontSize:12,color:T.txt,lineHeight:1.5}}>{a}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Do not miss + Guideline */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {result.do_not_miss&&<div style={{padding:"11px 13px",borderRadius:9,background:"rgba(255,107,107,.07)",border:"1px solid rgba(255,107,107,.25)"}}>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.coral,textTransform:"uppercase",letterSpacing:1,fontWeight:700,marginBottom:6}}>⚠ Do Not Miss</div>
              <div style={{fontSize:11,color:T.txt2,lineHeight:1.5,fontStyle:"italic"}}>{result.do_not_miss}</div>
            </div>}
            {result.guideline_note&&<div style={{padding:"11px 13px",borderRadius:9,background:"rgba(0,229,192,.05)",border:"1px solid rgba(0,229,192,.2)"}}>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.teal,textTransform:"uppercase",letterSpacing:1,fontWeight:700,marginBottom:6}}>Guideline</div>
              <div style={{fontSize:11,color:T.txt3,lineHeight:1.5}}>{result.guideline_note}</div>
            </div>}
          </div>

          <SendToChartBtn content={result?(()=>{
            const lines=[`ECG INTERPRETATION — ${new Date().toLocaleString()}`,"=".repeat(44),``,`URGENCY: ${result.urgency}`,result.stemi_equivalent?"⚡ STEMI EQUIVALENT — Activate cath lab":"",result.dangerous_pattern?`DANGEROUS PATTERN: ${result.dangerous_pattern}`:"",``,`INTERPRETATION:`,result.interpretation||"",``,`KEY FINDINGS:`,
              ...(result.key_findings||[]).map(f=>`  • ${f}`),``,`DIFFERENTIAL:`,
              ...(result.differentials||[]).map((d,i)=>`  ${i+1}. ${d}`),``,`RECOMMENDED ACTIONS:`,
              ...(result.recommended_actions||[]).map((a,i)=>`  ${i+1}. ${a}`),``,
              result.do_not_miss?`⚠ DO NOT MISS: ${result.do_not_miss}`:"",
              result.guideline_note?`Guideline: ${result.guideline_note}`:"",``,`Generated by Notrya ECG Hub AI · Clinical decision support only`];
            return lines.filter(l=>l!==undefined&&l!=="").join("\n");
          })():""}/>

          <button onClick={reset} style={{padding:"9px 0",borderRadius:8,background:"transparent",border:"1px solid rgba(26,53,85,.6)",color:T.txt4,fontFamily:"'DM Sans',sans-serif",fontSize:12,cursor:"pointer"}}>
            Reset — New ECG
          </button>
        </div>
      )}
    </div>
  );
}

// ── Serial ECG Timer ─────────────────────────────────────────
function SerialECGTimer() {
  const [t0,      setT0]      = useState(null);
  const [now,     setNow]     = useState(Date.now());
  const [ecgLog,  setEcgLog]  = useState([]);
  const [note,    setNote]    = useState("");
  const [sent,    setSent]    = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(()=>{
    const id=setInterval(()=>setNow(Date.now()),15000);
    return()=>clearInterval(id);
  },[]);

  const fmt    = ts=>new Date(ts).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
  const elMin  = t0?Math.floor((now-t0)/60000):null;
  const TGTS   = [{label:"Baseline",mins:0,c:T.teal},{label:"30-min Serial",mins:30,c:T.gold},{label:"60-min Serial",mins:60,c:T.coral}];

  const logECG = ()=>{
    if(!t0)return;
    setEcgLog(p=>[...p,{n:p.length+1,time:fmt(Date.now()),mins:Math.floor((Date.now()-t0)/60000),note:note.trim()}]);
    setNote("");
  };

  const sendLog = async()=>{
    if(!ecgLog.length)return;
    setSending(true);
    try{
      const lines=ecgLog.map(e=>`ECG #${e.n}  ${e.time}  +${e.mins} min${e.note?`  — ${e.note}`:""}`);
      await ClinicalNote.create({content:`SERIAL ECG LOG — Started ${fmt(t0)}\n${"─".repeat(42)}\n${lines.join("\n")}\n\nGenerated by Notrya ECG Hub · Serial ECG Timer`,source:"QN-Handoff",status:"pending"});
      setSent(true);setTimeout(()=>setSent(false),3000);
    }catch(e){}finally{setSending(false);}
  };

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {!t0?(
        <div style={{textAlign:"center",padding:"32px 0"}}>
          <div style={{fontSize:40,marginBottom:14}}>⏱</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:T.txt,marginBottom:8}}>Serial ECG Timer</div>
          <div style={{fontSize:12,color:T.txt3,marginBottom:24,lineHeight:1.6}}>Track 0 / 30 / 60-min serial ECGs for NSTEMI workup.<br/>Start the timer when you obtain the first ECG.</div>
          <button onClick={()=>setT0(Date.now())} style={{padding:"12px 32px",borderRadius:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:14,border:"1.5px solid rgba(0,229,192,.4)",background:"linear-gradient(135deg,rgba(0,229,192,.18),rgba(59,158,255,.12))",color:T.teal}}>
            Start Timer — ECG #1
          </button>
        </div>
      ):(
        <>
          {/* Elapsed + target strip */}
          <div style={{...glass,padding:"14px 16px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:8}}>
              <div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>Elapsed</div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:36,fontWeight:900,color:elMin>=60?T.coral:elMin>=30?T.gold:T.teal,lineHeight:1}}>{elMin} <span style={{fontSize:14,fontWeight:400,color:T.txt3}}>min</span></div>
              </div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.txt4}}>Started {fmt(t0)}</div>
              <button onClick={()=>{setT0(null);setEcgLog([]);setNote("");setSent(false);}} style={{padding:"4px 12px",borderRadius:6,border:"1px solid rgba(255,107,107,.3)",background:"rgba(255,107,107,.07)",color:T.coral,fontFamily:"'DM Sans',sans-serif",fontSize:11,cursor:"pointer"}}>Reset</button>
            </div>
            <div style={{display:"flex",gap:8}}>
              {TGTS.map(tg=>{
                const done=ecgLog.some(e=>e.mins>=tg.mins&&(tg.mins===0||e.mins<tg.mins+15));
                const due=elMin!==null&&elMin>=tg.mins;
                return(
                  <div key={tg.label} style={{flex:1,padding:"9px 10px",borderRadius:8,background:done?"rgba(0,229,192,.06)":due?`${tg.c}0f`:"rgba(14,37,68,.4)",border:`1px solid ${done?"rgba(0,229,192,.3)":due?tg.c+"44":"rgba(26,53,85,.6)"}`,textAlign:"center"}}>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:done?T.teal:due?tg.c:T.txt4,marginBottom:3,textTransform:"uppercase",letterSpacing:1}}>{done?"✓ Done":due?"DUE NOW":"Upcoming"}</div>
                    <div style={{fontSize:11,color:done?T.teal:due?tg.c:T.txt3,fontWeight:600}}>{tg.label}</div>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.txt4}}>+{tg.mins} min</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Log ECG */}
          <div style={{...glass,padding:"14px 16px"}}>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.teal,textTransform:"uppercase",letterSpacing:1,fontWeight:700,marginBottom:10}}>Log ECG #{ecgLog.length+1}</div>
            <textarea value={note} onChange={e=>setNote(e.target.value)} rows={2}
              placeholder="Optional note: new ST changes, rate change, clinical status…"
              style={{width:"100%",background:"rgba(14,37,68,.4)",border:"1px solid rgba(26,53,85,.7)",borderRadius:8,padding:"8px 11px",color:T.txt,fontFamily:"'DM Sans',sans-serif",fontSize:12,outline:"none",resize:"vertical",lineHeight:1.5,marginBottom:10}}/>
            <button onClick={logECG} style={{width:"100%",padding:"9px 0",borderRadius:8,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:13,border:"1px solid rgba(0,229,192,.35)",background:"rgba(0,229,192,.1)",color:T.teal}}>
              📋 Log ECG #{ecgLog.length+1} at +{elMin} min
            </button>
          </div>

          {/* Log table */}
          {ecgLog.length>0&&(
            <div style={{...glass,padding:"14px 16px"}}>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.teal,textTransform:"uppercase",letterSpacing:1,fontWeight:700,marginBottom:10}}>ECG Log</div>
              {ecgLog.map((e,i)=>(
                <div key={i} style={{display:"grid",gridTemplateColumns:"40px 60px 70px 1fr",gap:10,alignItems:"center",padding:"7px 0",borderBottom:i<ecgLog.length-1?"1px solid rgba(26,53,85,.4)":"none"}}>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:900,color:T.teal}}>#{e.n}</div>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:T.txt2}}>{e.time}</div>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:e.mins>=60?T.coral:e.mins>=30?T.gold:T.teal}}>+{e.mins} min</div>
                  <div style={{fontSize:11,color:T.txt3}}>{e.note||"—"}</div>
                </div>
              ))}
              <button onClick={sendLog} disabled={sending||sent}
                style={{width:"100%",marginTop:12,padding:"9px 0",borderRadius:8,cursor:sending?"not-allowed":"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:13,border:`1px solid ${sent?"rgba(0,229,192,.4)":"rgba(59,158,255,.3)"}`,background:sent?"rgba(0,229,192,.1)":"rgba(59,158,255,.1)",color:sent?T.teal:T.blue,transition:"all .2s"}}>
                {sent?"✓ Sent to Chart":sending?"Sending…":"📤 Send ECG Log to Chart"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Main ECGHub ───────────────────────────────────────────────
export default function ECGHub({ embedded = false, onBack }) {
  const [tab, setTab] = useState("ai");

  const handleBack = useCallback(()=>{if(onBack)onBack();else window.history.back();},[onBack]);

  return (
    <div style={{fontFamily:"'DM Sans',sans-serif",background:embedded?"transparent":T.bg,minHeight:embedded?"auto":"100vh",color:T.txt}}>
      <div style={{maxWidth:960,margin:"0 auto",padding:embedded?"0":"0 16px"}}>

        {!embedded&&(
          <div style={{padding:"18px 0 14px"}}>
            <button onClick={handleBack} style={{marginBottom:10,display:"inline-flex",alignItems:"center",gap:7,fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,padding:"5px 14px",borderRadius:8,background:"rgba(14,28,58,0.88)",border:"1px solid rgba(42,79,122,0.75)",color:T.txt3,cursor:"pointer"}}>← Back</button>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
              <div style={{background:"rgba(14,28,58,0.94)",border:"1px solid rgba(42,79,122,0.75)",borderRadius:10,padding:"5px 12px",display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.purple,letterSpacing:3}}>NOTRYA</span>
                <span style={{color:T.txt4,fontFamily:"'JetBrains Mono',monospace",fontSize:10}}>/</span>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.txt3,letterSpacing:2}}>ECG HUB</span>
              </div>
            </div>
            <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:32,fontWeight:900,letterSpacing:-0.5,lineHeight:1.1,color:T.txt,marginBottom:4}}>ECG Hub</h1>
            <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.txt4}}>AI ECG Interpretation · STEMI Localizer · AV Block · QTc · CHA₂DS₂-VASc · AF Pathway</p>
          </div>
        )}

        {/* Tab bar */}
        <div style={{display:"flex",gap:4,flexWrap:"wrap",padding:4,marginBottom:16,background:"rgba(8,22,40,0.72)",border:"1px solid rgba(26,53,85,.75)",borderRadius:12,backdropFilter:"blur(16px)"}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:8,fontSize:12,fontWeight:tab===t.id?700:500,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,transition:"all .2s",background:tab===t.id?"rgba(0,229,192,.12)":"transparent",border:tab===t.id?"1px solid rgba(0,229,192,.3)":"1px solid transparent",color:tab===t.id?T.teal:T.txt3}}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{...glass,padding:"18px 20px"}}>
          {tab==="ai"       &&<ECGAITab/>}
          {tab==="localizer"&&<STEMILocalizer/>}
          {tab==="avblock"  &&<AVBlockTab/>}
          {tab==="qtcalc"   &&<QTcTab/>}
          {tab==="chads"    &&<CHADSTab/>}
          {tab==="nstemi"   &&<ECGNSTEMIHub/>}
          {tab==="af"       &&<ECGAFPathway/>}
          {tab==="timer"    &&<SerialECGTimer/>}
        </div>

        {!embedded&&(
          <div style={{textAlign:"center",padding:"20px 0 14px",fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.txt4,letterSpacing:1.5}}>
            NOTRYA ECG HUB · CLINICAL DECISION SUPPORT ONLY · 2025 ACC/AHA/ACEP · AI-ASSISTED INTERPRETATION
          </div>
        )}
      </div>
    </div>
  );
}