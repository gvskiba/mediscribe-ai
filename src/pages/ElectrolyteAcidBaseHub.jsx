import { useState, useEffect, useCallback } from "react";
import NotryaPatientBar from "@/components/HubHeader/NotryaPatientBar";
import { PulseNavBadge } from "@/components/PulseActivators";
import QuickOrderPanel, { useQuickOrder, QuickOrderButton } from './QuickOrderPanel';

const P = {
  bg:"#0a1628",glass:"rgba(255,255,255,0.055)",gb:"rgba(0,188,212,0.18)",
  teal:"#00bcd4",gold:"#ffd700",red:"#ff5252",grn:"#69f0ae",
  amber:"#ffab40",txt:"#e8eef7",dim:"#7a8fa6",purple:"#ce93d8",coral:"#ff7043",
};
const PR = {
  bg:"#ffffff",glass:"#f8f9fa",gb:"#dee2e6",
  teal:"#0077aa",gold:"#856404",red:"#cc0000",grn:"#1a7a4a",
  amber:"#a05800",txt:"#111111",dim:"#555555",purple:"#6a1b9a",coral:"#c0392b",
};
const PL="'Playfair Display',Georgia,serif";
const DM="'DM Sans',system-ui,sans-serif";
const MO="'JetBrains Mono','Courier New',monospace";

const gp=(C,e={})=>({background:C.glass,border:`1px solid ${C.gb}`,backdropFilter:C===P?"blur(12px)":"none",borderRadius:12,padding:"16px 20px",...e});
const inp=(C)=>({background:C===P?"rgba(0,0,0,0.35)":"#fff",border:`1px solid ${C.gb}`,borderRadius:8,color:C.txt,fontFamily:MO,fontSize:14,padding:"8px 12px",width:"100%",outline:"none",boxSizing:"border-box"});
const lbl=(C)=>({display:"block",fontFamily:DM,fontSize:11,color:C.dim,marginBottom:4,letterSpacing:"0.06em",textTransform:"uppercase"});
const rowDiv={display:"flex",gap:10,flexWrap:"wrap"};
const sep=(C)=>`1px solid ${C===P?"rgba(255,255,255,0.05)":"#eee"}`;

const Btn=({active,color,onClick,children,style={},C=P})=>{
  const col=color||C.teal;
  return <button onClick={onClick} style={{background:active?col:"rgba(255,255,255,0.07)",border:`1px solid ${active?col:"rgba(255,255,255,0.15)"}`,borderRadius:8,color:active?(col===C.gold?"#0a1628":"#fff"):C.dim,cursor:"pointer",fontFamily:DM,fontSize:13,fontWeight:600,padding:"7px 18px",transition:"all 0.18s",...style}}>{children}</button>;
};
const Pill=({text,color,C=P})=>(
  <span style={{background:`${color}22`,border:`1px solid ${color}44`,borderRadius:6,color,fontFamily:DM,fontSize:11,fontWeight:700,padding:"2px 9px",display:"inline-block"}}>{text}</span>
);
const VR=({label:rl,value,unit="",color,C=P})=>(
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:sep(C),flexWrap:"wrap",gap:4}}>
    <span style={{fontFamily:DM,fontSize:12,color:C.dim}}>{rl}</span>
    <span style={{fontFamily:MO,fontSize:13,color:color||C.gold,textAlign:"right"}}>{value}<span style={{fontSize:11,color:C.dim,marginLeft:4}}>{unit}</span></span>
  </div>
);
const AB=({text,color,C=P})=>{const col=color||C.amber;return <div style={{background:`${col}18`,border:`1px solid ${col}44`,borderRadius:8,padding:"9px 14px",marginTop:8,display:"flex",alignItems:"flex-start",gap:8}}><span style={{color:col,fontSize:13,flexShrink:0}}>⚠</span><span style={{fontFamily:DM,fontSize:12,color:C.txt,lineHeight:1.5}}>{text}</span></div>;};
const FG=({label:fl,value,onChange,placeholder="",half=false,C=P})=>(
  <div style={{flex:half?"1 1 calc(50% - 6px)":"1 1 100%"}}><div style={lbl(C)}>{fl}</div><input style={inp(C)} type="number" value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/></div>
);
const SC=({num,label,children,color,C=P})=>{const col=color||C.teal;return <div style={{...gp(C),marginBottom:10,borderLeft:`3px solid ${col}`}}><div style={{display:"flex",alignItems:"flex-start",gap:10}}><span style={{fontFamily:MO,fontSize:10,color:col,border:`1px solid ${col}`,borderRadius:"50%",minWidth:20,height:20,display:"inline-flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{num}</span><div style={{flex:1}}><div style={{fontFamily:DM,fontSize:11,color:C.dim,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:5}}>{label}</div>{children}</div></div></div>;};
const SH=({title,C=P})=><div style={{fontFamily:PL,fontSize:17,color:C.gold,margin:"20px 0 10px"}}>{title}</div>;

// ── COPY BUTTON ───────────────────────────────────────────────────────────────
function CopyBtn({text,C=P}){
  const[cp,setCp]=useState(false);
  const copy=()=>{
    try{navigator.clipboard.writeText(text);}catch(e){const el=document.createElement("textarea");el.value=text;document.body.appendChild(el);el.select();document.execCommand("copy");document.body.removeChild(el);}
    setCp(true);setTimeout(()=>setCp(false),2000);
  };
  return <button onClick={copy} style={{background:cp?`${C.grn}22`:"rgba(255,255,255,0.07)",border:`1px solid ${cp?C.grn:"rgba(255,255,255,0.18)"}`,borderRadius:6,color:cp?C.grn:C.dim,cursor:"pointer",fontFamily:DM,fontSize:11,fontWeight:600,padding:"4px 12px",transition:"all 0.18s",display:"flex",alignItems:"center",gap:5}}><span>{cp?"✓":"⎘"}</span>{cp?"Copied":"Copy order"}</button>;
}

// ── SEVERITY GAUGE ────────────────────────────────────────────────────────────
const GAUGE_CFG={
  K:{min:2.5,max:8.0,label:"Serum K (mEq/L)",zones:[{from:2.5,to:3.0,color:"#ff5252",label:"Severe hypoK"},{from:3.0,to:3.5,color:"#ffab40",label:"Mild hypoK"},{from:3.5,to:5.0,color:"#69f0ae",label:"Normal"},{from:5.0,to:5.5,color:"#ffab40",label:"Mild hyperK"},{from:5.5,to:6.5,color:"#ff7043",label:"Moderate"},{from:6.5,to:8.0,color:"#ff5252",label:"Critical"}]},
  Na:{min:110,max:165,label:"Serum Na (mEq/L)",zones:[{from:110,to:118,color:"#ff5252",label:"Critical hypoNa"},{from:118,to:125,color:"#ffab40",label:"Severe"},{from:125,to:135,color:"#ffd700",label:"Mild hypoNa"},{from:135,to:145,color:"#69f0ae",label:"Normal"},{from:145,to:155,color:"#ffab40",label:"Mild hyperNa"},{from:155,to:165,color:"#ff5252",label:"Critical hyperNa"}]},
  pH:{min:6.9,max:7.8,label:"Arterial pH",zones:[{from:6.9,to:7.1,color:"#ff5252",label:"Critical acidemia"},{from:7.1,to:7.2,color:"#ff7043",label:"Severe acidemia"},{from:7.2,to:7.35,color:"#ffab40",label:"Acidemia"},{from:7.35,to:7.45,color:"#69f0ae",label:"Normal"},{from:7.45,to:7.55,color:"#ffab40",label:"Alkalemia"},{from:7.55,to:7.8,color:"#ff5252",label:"Critical alkalemia"}]},
};
function SeverityGauge({metric,value,C=P}){
  const cfg=GAUGE_CFG[metric];if(!cfg||isNaN(value))return null;
  const pct=v=>Math.max(0,Math.min(100,((v-cfg.min)/(cfg.max-cfg.min))*100));
  const vp=pct(value);
  const az=cfg.zones.find(z=>value>=z.from&&value<z.to)||cfg.zones[cfg.zones.length-1];
  return(
    <div style={{marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6,flexWrap:"wrap",gap:6}}>
        <span style={{fontFamily:DM,fontSize:11,color:C.dim,textTransform:"uppercase",letterSpacing:"0.06em"}}>{cfg.label}</span>
        <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontFamily:MO,fontSize:18,color:az.color,fontWeight:700}}>{value}</span><Pill text={az.label} color={az.color} C={C}/></div>
      </div>
      <div style={{position:"relative",height:14,borderRadius:7,overflow:"hidden",display:"flex"}}>
        {cfg.zones.map((z,i)=><div key={i} style={{width:`${pct(z.to)-pct(z.from)}%`,height:"100%",background:`${z.color}55`}}/>)}
        <div style={{position:"absolute",left:`calc(${vp}% - 1px)`,top:-2,width:3,height:18,background:az.color,borderRadius:2}}/>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:3}}>
        <span style={{fontFamily:MO,fontSize:10,color:C.dim}}>{cfg.min}</span>
        <span style={{fontFamily:MO,fontSize:10,color:C.dim}}>{cfg.max}</span>
      </div>
    </div>
  );
}

// ── SESSION TRACKER ───────────────────────────────────────────────────────────
const TRACKER_META={K:{label:"K",unit:"mEq/L"},Na:{label:"Na",unit:"mEq/L"},pH:{label:"pH",unit:"",decimals:3}};
function SessionTracker({metric,currentVal,history,onRecord,C=P}){
  const m=TRACKER_META[metric];
  const prev=history.length>0?history[history.length-1]:null;
  const cur=parseFloat(currentVal);
  const delta=prev&&!isNaN(cur)?cur-parseFloat(prev.val):null;
  const dColor=metric==="K"?(delta<0?C.grn:delta>0?C.red:C.dim):metric==="pH"?(delta>0?C.grn:delta<0?C.red:C.dim):(Math.abs(delta||0)>0.5?C.amber:C.dim);
  const fmt=v=>metric==="pH"?parseFloat(v).toFixed(3):parseFloat(v).toFixed(1);
  return(
    <div style={{...gp(C,{padding:"12px 16px"}),marginTop:10}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:history.length>0?8:0,flexWrap:"wrap",gap:8}}>
        <span style={{fontFamily:DM,fontSize:11,color:C.dim,textTransform:"uppercase",letterSpacing:"0.06em"}}>Session tracker — {m.label}</span>
        {currentVal&&<button onClick={()=>onRecord({val:currentVal,time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})})} style={{background:`${C.teal}20`,border:`1px solid ${C.teal}44`,borderRadius:6,color:C.teal,cursor:"pointer",fontFamily:DM,fontSize:11,fontWeight:600,padding:"3px 10px"}}>Record value</button>}
      </div>
      {history.length>0?(
        <div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8,alignItems:"flex-end"}}>
            {history.map((h,i)=>(
              <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",background:C===P?"rgba(0,0,0,0.2)":"#f0f0f0",borderRadius:6,padding:"5px 10px"}}>
                <span style={{fontFamily:MO,fontSize:13,color:C.txt}}>{fmt(h.val)}<span style={{fontSize:10,color:C.dim,marginLeft:3}}>{m.unit}</span></span>
                <span style={{fontFamily:DM,fontSize:10,color:C.dim}}>{h.time}</span>
              </div>
            ))}
            {currentVal&&parseFloat(currentVal)!==parseFloat(history[history.length-1]?.val)&&(
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",background:`${C.teal}15`,border:`1px solid ${C.teal}44`,borderRadius:6,padding:"5px 10px"}}>
                <span style={{fontFamily:MO,fontSize:13,color:C.teal}}>{fmt(currentVal)}<span style={{fontSize:10,color:C.dim,marginLeft:3}}>{m.unit}</span></span>
                <span style={{fontFamily:DM,fontSize:10,color:C.dim}}>now</span>
              </div>
            )}
          </div>
          {delta!==null&&!isNaN(delta)&&(
            <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
              <span style={{fontFamily:DM,fontSize:12,color:C.dim}}>Change from last: <span style={{fontFamily:MO,color:dColor,fontWeight:700}}>{delta>0?"+":""}{metric==="pH"?delta.toFixed(3):delta.toFixed(1)} {m.unit}</span></span>
              {metric==="K"&&!isNaN(cur)&&cur<3.5&&<span style={{fontFamily:DM,fontSize:12,color:C.dim}}>Deficit remaining: <span style={{fontFamily:MO,color:C.amber}}>{Math.max(0,(3.5-cur)*100).toFixed(0)} mEq</span></span>}
              {history.length>=2&&<span style={{fontFamily:DM,fontSize:12,color:C.dim}}>Total Δ from first: <span style={{fontFamily:MO,color:dColor}}>{cur>parseFloat(history[0].val)?"+":""}{metric==="pH"?(cur-parseFloat(history[0].val)).toFixed(3):(cur-parseFloat(history[0].val)).toFixed(1)} {m.unit}</span></span>}
            </div>
          )}
        </div>
      ):<div style={{fontFamily:DM,fontSize:11,color:C.dim}}>Enter a value and tap "Record" to track changes across rechecks.</div>}
    </div>
  );
}

// ── CONFIDENCE FLAG ───────────────────────────────────────────────────────────
function ConfidenceFlag({disorder,pH,pCO2,HCO3,C=P}){
  const ph=parseFloat(pH),pco2=parseFloat(pCO2),hco3=parseFloat(HCO3);
  const flags=[];
  if(ph>=7.32&&ph<=7.38&&disorder!=="Normal")flags.push("pH near-normal (7.32–7.38) — primary disorder may be masked by compensation or mixed process.");
  if(disorder==="Respiratory Acidosis"&&pco2>=45&&pco2<=50)flags.push("Borderline pCO2 (45–50 mmHg) — could represent mild hypoventilation or lab/VBG variation. Repeat if clinical concern.");
  if(disorder==="Metabolic Acidosis"&&hco3>=20&&hco3<22)flags.push("Borderline HCO3 (20–21 mEq/L) — mild MetAcid vs normal. Confirm with clinical context and repeat.");
  if(disorder==="Metabolic Alkalosis"&&hco3>=26&&hco3<=28)flags.push("Borderline HCO3 (26–28 mEq/L) — mild MetAlk vs normal variation. Assess volume status and diuretic use.");
  if(disorder.includes("Mixed"))flags.push("Mixed disorder identified — if clinical picture doesn't fit, consider triple acid-base disorder.");
  if(disorder.includes("unclear"))flags.push("Primary disorder unclear — pH and lab values are discordant. Verify blood draw, lab error, or look for compensated mixed process.");
  if(flags.length===0)return null;
  return(
    <div style={{background:`${C.amber}12`,border:`1px solid ${C.amber}44`,borderRadius:8,padding:"10px 14px",marginBottom:10,display:"flex",alignItems:"flex-start",gap:8}}>
      <span style={{color:C.amber,fontSize:14,flexShrink:0}}>◐</span>
      <div>
        <div style={{fontFamily:DM,fontSize:11,fontWeight:700,color:C.amber,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>Clinical Correlation Required</div>
        {flags.map((f,i)=><div key={i} style={{fontFamily:DM,fontSize:12,color:C.txt,lineHeight:1.5,marginBottom:i<flags.length-1?3:0}}>{f}</div>)}
      </div>
    </div>
  );
}

// ── PATIENT BAR ───────────────────────────────────────────────────────────────
function PatientBar({ctx,setCtx,C=P}){
  const set=k=>v=>setCtx(p=>({...p,[k]:v}));
  const filled=ctx.weight!=="";
  return(
    <div style={{background:C===P?"rgba(0,0,0,0.25)":"#f0f0f0",borderBottom:`1px solid ${C===P?"rgba(0,188,212,0.12)":C.gb}`,padding:"10px 24px"}}>
      <div style={{maxWidth:960,margin:"0 auto",display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
        <span style={{fontFamily:DM,fontSize:11,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em",flexShrink:0}}>Patient Context</span>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontFamily:DM,fontSize:11,color:C.dim}}>Weight</span>
          <input type="number" value={ctx.weight} onChange={e=>set("weight")(e.target.value)} placeholder="kg" style={{...inp(C),width:72,padding:"5px 10px",fontSize:13,borderColor:filled?`${C.teal}66`:C.gb}}/>
        </div>
        <div style={{display:"flex",gap:5}}>
          {[["m","Male"],["f","Female"]].map(([v,l])=><button key={v} onClick={()=>set("sex")(v)} style={{background:ctx.sex===v?`${C.teal}20`:"transparent",border:`1px solid ${ctx.sex===v?C.teal:"rgba(255,255,255,0.15)"}`,borderRadius:6,color:ctx.sex===v?C.teal:C.dim,cursor:"pointer",fontFamily:DM,fontSize:11,fontWeight:600,padding:"4px 10px"}}>{l}</button>)}
        </div>
        <div style={{display:"flex",gap:5}}>
          {[["acute","Acute <48h"],["chronic","Chronic / Unknown"]].map(([v,l])=><button key={v} onClick={()=>set("duration")(v)} style={{background:ctx.duration===v?`${C.gold}20`:"transparent",border:`1px solid ${ctx.duration===v?C.gold:"rgba(255,255,255,0.15)"}`,borderRadius:6,color:ctx.duration===v?C.gold:C.dim,cursor:"pointer",fontFamily:DM,fontSize:11,fontWeight:600,padding:"4px 10px"}}>{l}</button>)}
        </div>
        {filled&&<span style={{fontFamily:DM,fontSize:11,color:C.teal,marginLeft:"auto"}}>● {ctx.weight} kg · {ctx.sex==="m"?"Male":"Female"} · {ctx.duration==="acute"?"Acute":"Chronic"} — applied across all tabs</span>}
      </div>
    </div>
  );
}

// ── PANIC BANNER ──────────────────────────────────────────────────────────────
const PANIC=[
  {key:"K",thresh:v=>v>=6.5,label:v=>`K = ${v.toFixed(1)} mEq/L`,level:"CRITICAL",color:"#ff5252",action:"Ca gluconate 1g IV now  ·  Insulin 10u + D50W  ·  Albuterol 20mg neb  ·  Stat nephrology"},
  {key:"K",thresh:v=>v>=6.0&&v<6.5,label:v=>`K = ${v.toFixed(1)} mEq/L`,level:"URGENT",color:"#ffab40",action:"Insulin 10u IV + D50W  ·  Albuterol 20mg neb  ·  Telemetry  ·  Recheck K in 1h"},
  {key:"pH",thresh:v=>v<7.10,label:v=>`pH = ${v.toFixed(3)}`,level:"CRITICAL",color:"#ff5252",action:"NaHCO3 1–2 mEq/kg IV bolus  ·  Identify primary cause  ·  Consider early intubation"},
  {key:"pH",thresh:v=>v>=7.10&&v<7.20,label:v=>`pH = ${v.toFixed(3)}`,level:"URGENT",color:"#ffab40",action:"Bicarb if MetAcid + HyperK or TCA  ·  ABG q1h  ·  Treat underlying cause"},
  {key:"Na",thresh:v=>v<118,label:v=>`Na = ${v.toFixed(0)} mEq/L`,level:"CRITICAL",color:"#ff5252",action:"3% NaCl 100 mL IV bolus if symptomatic  ·  Max correction 8 mEq/24h  ·  Neurology if seizing"},
  {key:"Na",thresh:v=>v>=118&&v<125,label:v=>`Na = ${v.toFixed(0)} mEq/L`,level:"URGENT",color:"#ffab40",action:"3% NaCl if symptomatic  ·  FWR if chronic SIADH  ·  Recheck Na q2–4h"},
  {key:"Na",thresh:v=>v>160,label:v=>`Na = ${v.toFixed(0)} mEq/L`,level:"CRITICAL",color:"#ff5252",action:"D5W free water replacement  ·  Calculate FWD  ·  DDAVP if central DI"},
  {key:"Ca",thresh:v=>v<7.0,label:v=>`Ca = ${v.toFixed(1)} mg/dL`,level:"CRITICAL",color:"#ff5252",action:"Ca gluconate 1–2g IV over 10–20 min  ·  Repeat q10 min PRN  ·  Telemetry for QTc"},
];
function PanicBanner({criticals,print}){
  const[dismissed,setDismissed]=useState([]);
  if(print)return null;
  const active=PANIC.filter(r=>{const v=criticals[r.key];return v!==null&&!isNaN(v)&&r.thresh(v)&&!dismissed.includes(`${r.key}-${r.level}-${v}`);}).sort((a,b)=>a.level==="CRITICAL"?-1:1);
  if(active.length===0)return null;
  const top=active[0];const v=criticals[top.key];const dk=`${top.key}-${top.level}-${v}`;
  return(
    <div style={{background:`${top.color}18`,borderBottom:`2px solid ${top.color}`,padding:"10px 24px"}}>
      <div style={{maxWidth:960,margin:"0 auto",display:"flex",alignItems:"flex-start",gap:14,flexWrap:"wrap"}}>
        <div style={{background:top.color,color:top.level==="CRITICAL"?"#fff":"#0a1628",fontFamily:MO,fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:5,letterSpacing:"0.08em",flexShrink:0,marginTop:2}}>{top.level}</div>
        <div style={{flex:1}}>
          <span style={{fontFamily:MO,fontSize:16,color:top.color,fontWeight:700}}>{top.label(v)}</span>
          <div style={{fontFamily:DM,fontSize:13,color:P.txt,marginTop:4,lineHeight:1.5}}><span style={{color:top.color,fontWeight:600}}>→ </span>{top.action}</div>
        </div>
        {active.length>1&&<span style={{fontFamily:DM,fontSize:11,color:P.dim,alignSelf:"center"}}>+{active.length-1} more</span>}
        <button onClick={()=>setDismissed(p=>[...p,dk])} style={{background:"transparent",border:`1px solid ${top.color}44`,borderRadius:6,color:P.dim,cursor:"pointer",fontFamily:DM,fontSize:12,padding:"4px 10px",flexShrink:0}}>dismiss</button>
      </div>
    </div>
  );
}

// ── ABG LOGIC ─────────────────────────────────────────────────────────────────
function abgCalc(pH,pCO2,HCO3,Na,Cl,isVBG,respType){
  const aPH=isVBG?+pH+0.035:+pH,aPCO2=isVBG?+pCO2-6:+pCO2,h=+HCO3;
  const pHStatus=aPH<7.35?"Acidemia":aPH>7.45?"Alkalemia":"Normal pH";
  let disorder="Normal";
  if(aPH<7.35){if(h<22&&aPCO2>45)disorder="Mixed: MetAcid + RespAcid";else if(h<22)disorder="Metabolic Acidosis";else if(aPCO2>45)disorder="Respiratory Acidosis";else disorder="Acidemia — unclear primary";}
  else if(aPH>7.45){if(h>26&&aPCO2<35)disorder="Mixed: MetAlk + RespAlk";else if(h>26)disorder="Metabolic Alkalosis";else if(aPCO2<35)disorder="Respiratory Alkalosis";else disorder="Alkalemia — unclear primary";}
  else{if(h<22&&aPCO2<35)disorder="Mixed: MetAcid + RespAlk (normalized pH)";else if(h>26&&aPCO2>45)disorder="Mixed: MetAlk + RespAcid (normalized pH)";}
  let comp=null,cs="";
  if(disorder==="Metabolic Acidosis"){const e=1.5*h+8;comp={label:"Expected pCO2 (Winters)",low:(e-2).toFixed(1),high:(e+2).toFixed(1),measured:aPCO2.toFixed(1)};cs=aPCO2>e+2?"Inadequate → concurrent RespAcid":aPCO2<e-2?"Excessive → concurrent RespAlk":"Appropriate respiratory compensation";}
  else if(disorder==="Metabolic Alkalosis"){const e=0.7*h+21;comp={label:"Expected pCO2",low:(e-5).toFixed(1),high:(e+5).toFixed(1),measured:aPCO2.toFixed(1)};cs=aPCO2>e+5?"Inadequate → concurrent RespAcid":aPCO2<e-5?"Excessive → concurrent RespAlk":"Appropriate respiratory compensation";}
  else if(disorder==="Respiratory Acidosis"){const eA=24+(aPCO2-40)*0.1,eC=24+(aPCO2-40)*0.35,e=respType==="chronic"?eC:eA;comp={label:`Expected HCO3 (${respType})`,low:(e-2).toFixed(1),high:(e+2).toFixed(1),measured:h.toFixed(1),acute:eA.toFixed(1),chronic:eC.toFixed(1)};cs=h>e+2?"Excess HCO3 → concurrent MetAlk":h<e-2?"Insufficient → concurrent MetAcid":"Appropriate metabolic compensation";}
  else if(disorder==="Respiratory Alkalosis"){const eA=24-(40-aPCO2)*0.2,eC=24-(40-aPCO2)*0.5,e=respType==="chronic"?eC:eA;comp={label:`Expected HCO3 (${respType})`,low:(e-2).toFixed(1),high:(e+2).toFixed(1),measured:h.toFixed(1),acute:eA.toFixed(1),chronic:eC.toFixed(1)};cs=h<e-2?"Excess drop → concurrent MetAcid":h>e+2?"Insufficient drop → concurrent MetAlk":"Appropriate metabolic compensation";}
  let ag=null,agInterp="",dd=null,ddInterp="";
  if(Na&&Cl){ag=+Na-(+Cl+h);agInterp=ag>12?"Elevated AG (HAGMA)":ag<6?"Low AG (hypoalbuminemia / paraprotein)":"Normal AG";if(ag>12&&disorder==="Metabolic Acidosis"){dd=(ag-12)/(24-h);ddInterp=dd<0.4?"Pure NAGMA":dd<1?"Mixed HAGMA + NAGMA":dd<=2?"Pure HAGMA":"HAGMA + concurrent MetAlk";}}
  return{aPH,aPCO2,pHStatus,disorder,comp,cs,ag,agInterp,dd,ddInterp};
}

// ── ABG TAB ───────────────────────────────────────────────────────────────────
function ABGTab({onCritical,C=P}){
  const[mode,setMode]=useState("abg"),[rt,setRt]=useState("acute");
  const[v,setV]=useState({pH:"",pCO2:"",HCO3:"",Na:"",Cl:""});
  const[result,setResult]=useState(null);
  const[og,setOg]=useState({mOsm:"",oNa:"",glu:"",bun:"",etoh:""});
  const[uog,setUog]=useState({uOsm:"",uNa:"",uK:""});
  const[pHHist,setPHHist]=useState([]);
  const set=k=>val=>setV(p=>({...p,[k]:val}));
  const setO=k=>val=>setOg(p=>({...p,[k]:val}));
  const setU=k=>val=>setUog(p=>({...p,[k]:val}));
  const run=()=>{if(!v.pH||!v.pCO2||!v.HCO3)return;const r=abgCalc(v.pH,v.pCO2,v.HCO3,v.Na,v.Cl,mode==="vbg",rt);setResult(r);onCritical({pH:r.aPH});};
  const dc=d=>!d||d==="Normal"?C.grn:d.toLowerCase().includes("acid")?C.red:d.toLowerCase().includes("alk")?C.amber:C.teal;
  const DDX={"Metabolic Acidosis":{ha:"MUDPILES — Methanol · Uremia · DKA · Propylene glycol · Isoniazid/Iron · Lactic acidosis · Ethylene glycol · Salicylates",na:"HARDUPS — Hyperalimentation · Acetazolamide · RTA · Diarrhea · Ureteroenteric fistula · Pancreatic fistula · Saline excess"},"Metabolic Alkalosis":"Vomiting/NG suction · Diuretics · Hyperaldosteronism · Post-hypercapnia · Contraction alkalosis","Respiratory Acidosis":"COPD · Pneumonia · Neuromuscular disease · Opioid overdose · Obesity hypoventilation · Chest wall deformity","Respiratory Alkalosis":"Anxiety/hyperventilation · PE · Pneumonia · Hepatic failure · Salicylate toxicity · Mechanical overventilation"};
  const ogR=(()=>{const{mOsm,oNa,glu,bun,etoh}=og;if(!mOsm||!oNa)return null;const calc=2*(+oNa)+(glu?(+glu)/18:0)+(bun?(+bun)/2.8:0)+(etoh?(+etoh)/4.6:0);const gap=+mOsm-calc;return gap<10?{calc:calc.toFixed(1),gap:gap.toFixed(1),interp:"Normal osmolar gap (<10)",color:C.grn,causes:"No unmeasured osmoles. If MetAcid without gap: consider HAGMA without unmeasured osmole (DKA, lactic acidosis)."}:gap<20?{calc:calc.toFixed(1),gap:gap.toFixed(1),interp:"Borderline gap (10–20)",color:C.amber,causes:"Consider: early toxic alcohol, mannitol, propylene glycol (lorazepam drip). Correlate with ABG."}:{calc:calc.toFixed(1),gap:gap.toFixed(1),interp:"Elevated gap (>20) — toxic alcohol screen",color:C.red,causes:"Methanol (visual changes, formic acidosis) · Ethylene glycol (oxalate crystals, renal failure) · Isopropanol (ketones, no anion gap) · Propylene glycol (ICU lorazepam drip)"};})();
  const uogR=(()=>{const{uOsm,uNa,uK}=uog;if(!uOsm||!uNa||!uK)return null;const calc=2*(+uNa+(+uK));const gap=+uOsm-calc;return gap>100?{calc:calc.toFixed(0),gap:gap.toFixed(0),interp:"High UOG (>100) — osmotic diuresis",color:C.amber,detail:"Non-electrolyte solutes driving urine. Check: glucosuria, mannitol, urea, sorbitol."}:{calc:calc.toFixed(0),gap:gap.toFixed(0),interp:"Low UOG (<100) — water diuresis",color:C.teal,detail:"ADH pattern or DI. Consider central vs nephrogenic DI, primary polydipsia."};})();
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
        <Btn active={mode==="abg"} onClick={()=>setMode("abg")} C={C}>ABG</Btn>
        <Btn active={mode==="vbg"} onClick={()=>setMode("vbg")} C={C}>VBG</Btn>
        {mode==="vbg"&&<span style={{fontFamily:DM,fontSize:12,color:C.amber}}>Offset: pH +0.035 | pCO2 ±6 mmHg</span>}
        <div style={{marginLeft:"auto",display:"flex",gap:6}}>
          <Btn active={rt==="acute"} onClick={()=>setRt("acute")} style={{fontSize:12,padding:"5px 13px"}} C={C}>Acute</Btn>
          <Btn active={rt==="chronic"} onClick={()=>setRt("chronic")} style={{fontSize:12,padding:"5px 13px"}} C={C}>Chronic</Btn>
        </div>
      </div>
      <div style={rowDiv}>
        <FG label="pH" value={v.pH} onChange={set("pH")} placeholder="7.35–7.45" half C={C}/>
        <FG label="pCO2 (mmHg)" value={v.pCO2} onChange={set("pCO2")} placeholder="35–45" half C={C}/>
        <FG label="HCO3 (mEq/L)" value={v.HCO3} onChange={set("HCO3")} placeholder="22–26" half C={C}/>
        <FG label="Na — optional for AG" value={v.Na} onChange={set("Na")} placeholder="135–145" half C={C}/>
        <FG label="Cl — optional for AG" value={v.Cl} onChange={set("Cl")} placeholder="98–106" half C={C}/>
      </div>
      <Btn active onClick={run} style={{alignSelf:"flex-start",padding:"9px 26px",fontSize:14}} C={C}>Interpret ABG/VBG</Btn>
      {v.pH&&<SeverityGauge metric="pH" value={parseFloat(mode==="vbg"?parseFloat(v.pH)+0.035:v.pH)} C={C}/>}
      {result&&(
        <div>
          <ConfidenceFlag disorder={result.disorder} pH={result.aPH} pCO2={result.aPCO2} HCO3={v.HCO3} C={C}/>
          {mode==="vbg"&&<div style={{...gp(C,{marginBottom:10}),background:`${C.amber}12`,borderColor:`${C.amber}44`}}><span style={{fontFamily:DM,fontSize:12,color:C.amber}}>Estimated arterial: pH ≈ {result.aPH.toFixed(3)} | pCO2 ≈ {result.aPCO2.toFixed(0)} mmHg</span></div>}
          <SC num={1} label="pH Status" color={dc(result.pHStatus)} C={C}><div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}><Pill text={result.pHStatus} color={dc(result.pHStatus)} C={C}/><span style={{fontFamily:MO,fontSize:14,color:C.txt}}>pH {result.aPH.toFixed(3)}</span></div></SC>
          <SC num={2} label="Primary Disorder" color={dc(result.disorder)} C={C}><Pill text={result.disorder} color={dc(result.disorder)} C={C}/>{result.disorder==="Metabolic Acidosis"&&result.ag!==null&&result.ag>12&&<div style={{fontFamily:DM,fontSize:11,color:C.dim,marginTop:6,lineHeight:1.5}}>{DDX["Metabolic Acidosis"].ha}</div>}{result.disorder==="Metabolic Acidosis"&&result.ag!==null&&result.ag<=12&&<div style={{fontFamily:DM,fontSize:11,color:C.dim,marginTop:6,lineHeight:1.5}}>{DDX["Metabolic Acidosis"].na}</div>}{result.disorder==="Metabolic Acidosis"&&!result.ag&&<div style={{fontFamily:DM,fontSize:11,color:C.dim,marginTop:6}}>Enter Na + Cl to calculate AG</div>}{DDX[result.disorder]&&typeof DDX[result.disorder]==="string"&&<div style={{fontFamily:DM,fontSize:11,color:C.dim,marginTop:6,lineHeight:1.5}}>{DDX[result.disorder]}</div>}</SC>
          {result.comp&&<SC num={3} label="Expected Compensation" color={C.teal} C={C}><VR label={result.comp.label} value={`${result.comp.low} – ${result.comp.high}`} unit="expected range" C={C}/><VR label="Measured" value={result.comp.measured} color={C.txt} C={C}/>{result.comp.acute&&<div style={{display:"flex",gap:18,marginTop:5}}><span style={{fontFamily:DM,fontSize:11,color:C.dim}}>Acute: {result.comp.acute}</span><span style={{fontFamily:DM,fontSize:11,color:C.dim}}>Chronic: {result.comp.chronic}</span></div>}<div style={{marginTop:8}}><Pill text={result.cs} color={result.cs.includes("Appropriate")?C.grn:C.amber} C={C}/></div></SC>}
          {result.ag!==null&&<SC num={4} label="Anion Gap" color={result.ag>12?C.red:C.grn} C={C}><VR label="AG = Na − (Cl + HCO3)" value={result.ag.toFixed(1)} unit="mEq/L" color={result.ag>12?C.red:C.grn} C={C}/><div style={{marginTop:6}}><Pill text={result.agInterp} color={result.ag>12?C.red:C.grn} C={C}/></div>{result.dd!==null&&<div style={{marginTop:10}}><VR label="Delta-Delta" value={result.dd.toFixed(2)} color={C.teal} C={C}/><div style={{marginTop:6}}><Pill text={result.ddInterp} color={C.teal} C={C}/></div></div>}</SC>}
        </div>
      )}
      <SessionTracker metric="pH" currentVal={v.pH} history={pHHist} onRecord={h=>setPHHist(p=>[...p,h])} C={C}/>
      <SH title="Osmolar Gap" C={C}/>
      <div style={gp(C)}>
        <div style={{fontFamily:DM,fontSize:12,color:C.dim,marginBottom:12}}>Calc Osm = 2×Na + Glucose/18 + BUN/2.8 + Ethanol/4.6 | Normal gap &lt;10</div>
        <div style={rowDiv}><FG label="Measured Osm" value={og.mOsm} onChange={setO("mOsm")} placeholder="280–295" half C={C}/><FG label="Serum Na" value={og.oNa} onChange={setO("oNa")} placeholder="135–145" half C={C}/><FG label="Glucose (mg/dL)" value={og.glu} onChange={setO("glu")} placeholder="optional" half C={C}/><FG label="BUN (mg/dL)" value={og.bun} onChange={setO("bun")} placeholder="optional" half C={C}/><FG label="Ethanol (mg/dL)" value={og.etoh} onChange={setO("etoh")} placeholder="if known" half C={C}/></div>
        {ogR&&<div style={{marginTop:14}}><VR label="Calculated Osm" value={ogR.calc} unit="mOsm/kg" color={C.teal} C={C}/><VR label="Osmolar Gap" value={ogR.gap} unit="mOsm/kg" color={ogR.color} C={C}/><div style={{marginTop:8}}><Pill text={ogR.interp} color={ogR.color} C={C}/></div><div style={{fontFamily:DM,fontSize:12,color:C.dim,marginTop:8,lineHeight:1.6}}>{ogR.causes}</div></div>}
      </div>
      <SH title="Urine Osmolal Gap" C={C}/>
      <div style={gp(C)}>
        <div style={{fontFamily:DM,fontSize:12,color:C.dim,marginBottom:12}}>UOG = Urine Osm − 2×(UNa + UK)</div>
        <div style={rowDiv}><FG label="Urine Osm" value={uog.uOsm} onChange={setU("uOsm")} placeholder="spot" half C={C}/><FG label="Urine Na" value={uog.uNa} onChange={setU("uNa")} placeholder="spot" half C={C}/><FG label="Urine K" value={uog.uK} onChange={setU("uK")} placeholder="spot" half C={C}/></div>
        {uogR&&<div style={{marginTop:14}}><VR label="Electrolyte contribution" value={uogR.calc} unit="mOsm/kg" color={C.teal} C={C}/><VR label="UOG" value={uogR.gap} unit="mOsm/kg" color={uogR.color} C={C}/><div style={{marginTop:8}}><Pill text={uogR.interp} color={uogR.color} C={C}/></div><div style={{fontFamily:DM,fontSize:12,color:C.dim,marginTop:8,lineHeight:1.6}}>{uogR.detail}</div></div>}
      </div>
    </div>
  );
}

// ── ELECTROLYTES TAB ──────────────────────────────────────────────────────────
function ElectrolytesTab({ctx,onCritical,C=P}){
  const[sub,setSub]=useState("k");
  const[K,setK]=useState(""),[access,setAccess]=useState("peripheral");
  const[curNa,setCurNa]=useState(""),[naWt,setNaWt]=useState(""),[sex,setSex]=useState(ctx.sex),[naChron,setNaChron]=useState(ctx.duration);
  const[totCa,setTotCa]=useState(""),[albumin,setAlbumin]=useState(""),[mg,setMg]=useState("");
  const[phos,setPhos]=useState(""),[ua,setUa]=useState(""),[phosWt,setPhosWt]=useState("");
  const[kHist,setKHist]=useState([]);
  useEffect(()=>setSex(ctx.sex),[ctx.sex]);
  useEffect(()=>setNaChron(ctx.duration),[ctx.duration]);
  const eNaWt=naWt||ctx.weight,ePhWt=phosWt||ctx.weight;
  const kVal=parseFloat(K);
  const kR=(()=>{if(!kVal||kVal>=3.5)return kVal>=3.5?{level:"Normal",color:C.grn,dose:"No replacement indicated",rate:"—",monitor:"Routine"}:null;if(kVal>=3.0)return{level:"Mild (3.0–3.4)",color:C.amber,dose:"40 mEq PO preferred; or 20 mEq IV in 100 mL over 2h",rate:"10 mEq/hr peripheral",monitor:"Recheck q4–6h"};if(kVal>=2.5)return{level:"Moderate (2.5–2.9)",color:C.coral,dose:"40–60 mEq IV; replace Mg2+ concurrently",rate:access==="central"?"20 mEq/hr central":"10 mEq/hr peripheral",monitor:"Telemetry · recheck q2–4h"};return{level:"Severe (<2.5)",color:C.red,dose:"60–80 mEq IV; central preferred; correct Mg2+",rate:access==="central"?"20–40 mEq/hr central":"10 mEq/hr — obtain central",monitor:"Telemetry · recheck q1–2h · ICU"};})();
  const caR=(()=>{const ca=parseFloat(totCa),alb=parseFloat(albumin);if(!ca||!alb)return null;const corr=ca+0.8*(4-alb);return{corrected:corr.toFixed(2),low:corr<8.5,high:corr>10.5};})();
  useEffect(()=>{if(caR)onCritical({Ca:parseFloat(caR.corrected)});},[caR?.corrected]);
  const phR=(()=>{const pv=parseFloat(phos);if(!pv)return null;if(pv>=2.5&&pv<=4.5)return{level:"Normal",color:C.grn,dose:"No replacement",note:"Normal 2.5–4.5 mg/dL"};if(pv<1.0)return{level:"Severe (<1.0)",color:C.red,dose:"IV: 0.32–0.64 mmol/kg over 4–6h (max 40 mmol)",note:"Risk: hemolytic anemia, respiratory failure, rhabdo, cardiac dysfunction. ICU monitoring."};if(pv<2.0)return{level:"Moderate (1.0–1.9)",color:C.coral,dose:"Symptomatic: IV 0.16–0.32 mmol/kg | Asymptomatic: Neutra-Phos 250–500 mg PO TID",note:"Causes: DKA treatment, refeeding syndrome, alcoholism, antacid overuse."};if(pv<2.5)return{level:"Mild (2.0–2.4)",color:C.amber,dose:"Neutra-Phos 250–500 mg PO TID with meals",note:"Avoid Al/Mg antacids. Recheck 24–48h."};return{level:"Hyperphosphatemia (>4.5)",color:C.coral,dose:"Dietary restriction <800 mg/day + sevelamer or Ca carbonate binders",note:"Check Ca×Phos product (>55 → vascular calcification risk)."};})();
  const uaR=(()=>{const uv=parseFloat(ua);if(!uv)return null;if(uv<=6)return{level:"Normal",color:C.grn,note:"No action needed."};if(uv<=8)return{level:"Mild hyperuricemia",color:C.amber,note:"Hydration. Allopurinol if recurrent gout or TLS risk."};if(uv<=10)return{level:"Moderate hyperuricemia",color:C.coral,note:"Aggressive hydration. Allopurinol 300 mg/day or rasburicase 0.2 mg/kg IV. G6PD screen first."};return{level:"Severe (>10) — TLS concern",color:C.red,note:"Rasburicase 0.2 mg/kg IV. G6PD screen first. Nephrology consult. UA q4–6h."};})();
  return(
    <div>
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        {[["k","Potassium"],["na","Sodium Deficit"],["ca","Calcium / Mg"],["phos","Phos / Uric Acid"]].map(([id,title])=><Btn key={id} active={sub===id} onClick={()=>setSub(id)} C={C}>{title}</Btn>)}
      </div>
      {sub==="k"&&<div style={{display:"flex",flexDirection:"column",gap:14}}>
        {kVal>0&&<SeverityGauge metric="K" value={kVal} C={C}/>}
        <div style={rowDiv}><FG label="Serum K (mEq/L)" value={K} onChange={setK} placeholder="3.5–5.0" half C={C}/><div style={{flex:"1 1 calc(50% - 6px)"}}><div style={lbl(C)}>IV Access</div><div style={{display:"flex",gap:8}}><Btn active={access==="peripheral"} onClick={()=>setAccess("peripheral")} style={{fontSize:12,padding:"6px 12px"}} C={C}>Peripheral</Btn><Btn active={access==="central"} onClick={()=>setAccess("central")} style={{fontSize:12,padding:"6px 12px"}} C={C}>Central</Btn></div></div></div>
        {kR&&<div style={{...gp(C),borderLeft:`3px solid ${kR.color}`}}><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,flexWrap:"wrap"}}><Pill text={kR.level} color={kR.color} C={C}/>{kVal&&<span style={{fontFamily:MO,fontSize:16,color:kR.color}}>K = {kVal.toFixed(1)} mEq/L</span>}</div><VR label="Replacement" value={kR.dose} color={C.txt} C={C}/><VR label="Max rate" value={kR.rate} color={C.gold} C={C}/><VR label="Monitoring" value={kR.monitor} color={C.teal} C={C}/>{kVal&&kVal<3.5&&<VR label="Est. deficit" value={`~${((3.5-kVal)*100).toFixed(0)}`} unit="mEq total body" color={C.amber} C={C}/>}<AB text="Never give K IV push. Peripheral max 40 mEq/L. Always replace Mg2+." C={C}/></div>}
        <SessionTracker metric="K" currentVal={K} history={kHist} onRecord={h=>setKHist(p=>[...p,h])} C={C}/>
      </div>}
      {sub==="na"&&<div style={{display:"flex",flexDirection:"column",gap:14}}>
        {ctx.weight&&<div style={{fontFamily:DM,fontSize:11,color:C.teal}}>Using weight {ctx.weight} kg from patient context. Enter below to override.</div>}
        <div style={rowDiv}><FG label="Current Na (mEq/L)" value={curNa} onChange={setCurNa} placeholder="< 135" half C={C}/><FG label={`Weight (kg)${ctx.weight?` — ctx: ${ctx.weight}`:""}`} value={naWt} onChange={setNaWt} placeholder={ctx.weight||"70"} half C={C}/></div>
        <div style={{display:"flex",gap:16,flexWrap:"wrap"}}><div><div style={lbl(C)}>Sex</div><div style={{display:"flex",gap:8}}><Btn active={sex==="m"} onClick={()=>setSex("m")} style={{fontSize:12,padding:"6px 12px"}} C={C}>Male</Btn><Btn active={sex==="f"} onClick={()=>setSex("f")} style={{fontSize:12,padding:"6px 12px"}} C={C}>Female</Btn></div></div><div><div style={lbl(C)}>Duration</div><div style={{display:"flex",gap:8}}><Btn active={naChron==="acute"} onClick={()=>setNaChron("acute")} style={{fontSize:12,padding:"6px 12px"}} C={C}>Acute &lt;48h</Btn><Btn active={naChron==="chronic"} onClick={()=>setNaChron("chronic")} style={{fontSize:12,padding:"6px 12px"}} C={C}>Chronic</Btn></div></div></div>
        {(()=>{const na=parseFloat(curNa),w=parseFloat(eNaWt);if(!na||!w)return null;const tbw=w*(sex==="m"?0.6:0.5),deficit=tbw*(140-na);return <div style={gp(C)}><VR label="TBW" value={tbw.toFixed(1)} unit="L" C={C}/><VR label="Na Deficit (target 140)" value={deficit.toFixed(0)} unit="mEq" color={C.red} C={C}/><VR label="Max correction" value={naChron==="chronic"?"8–10 mEq/L":"1–2 mEq/hr; max 8–10 mEq"} unit="per 24h" color={C.amber} C={C}/><AB text={naChron==="chronic"?"CHRONIC: Max 8–10 mEq/L/24h. Overcorrection → ODS. Relower with D5W + DDAVP if overcorrected.":"ACUTE (<48h): 1–2 mEq/hr. Still ≤8–10 mEq/24h."} color={naChron==="chronic"?C.red:C.amber} C={C}/></div>;})()}
      </div>}
      {sub==="ca"&&<div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div style={rowDiv}><FG label="Total Ca (mg/dL)" value={totCa} onChange={setTotCa} placeholder="8.5–10.5" half C={C}/><FG label="Albumin (g/dL)" value={albumin} onChange={setAlbumin} placeholder="4.0" half C={C}/></div>
        {caR&&<div style={{...gp(C),borderLeft:`3px solid ${caR.low?C.red:caR.high?C.amber:C.grn}`}}><VR label="Corrected Ca" value={caR.corrected} unit="mg/dL" color={caR.low?C.red:caR.high?C.amber:C.grn} C={C}/><div style={{marginTop:6}}><Pill text={caR.low?"Hypocalcemia":caR.high?"Hypercalcemia":"Normal"} color={caR.low?C.red:caR.high?C.amber:C.grn} C={C}/></div>{caR.low&&<div style={{marginTop:12}}><VR label="Symptomatic" value="Ca gluconate 1–2g IV over 10–20 min" color={C.txt} C={C}/><VR label="Emergent (VFib/tetany)" value="CaCl2 1g IV" color={C.red} C={C}/><AB text="CaCl2 extravasation → tissue necrosis. Central line preferred." C={C}/></div>}</div>}
        <div style={gp(C)}><div style={{fontFamily:DM,fontSize:13,fontWeight:600,color:C.teal,marginBottom:8}}>Magnesium Replacement</div><div style={rowDiv}><FG label="Serum Mg (mEq/L)" value={mg} onChange={setMg} placeholder="1.5–2.5" half C={C}/></div>{[[1.5,99,C.amber,"Mild (1.5–1.8)","Mg oxide 400–800 mg PO BID"],[1.0,1.5,C.coral,"Moderate (1.0–1.5)","MgSO4 2g IV over 1h; repeat q4–6h PRN"],[0,1.0,C.red,"Severe (<1.0)","MgSO4 4–8g IV over 4–8h; monitor DTRs, UO, resp rate"]].map(([lo,hi,color,level,tx])=>{const mgV=parseFloat(mg),active=mg&&mgV>=lo&&mgV<hi;return <div key={level} style={{padding:"6px 0",borderBottom:sep(C),opacity:mg&&!active?0.45:1}}><div style={{fontFamily:DM,fontSize:11,color,fontWeight:700,marginBottom:2}}>{level}</div><div style={{fontFamily:DM,fontSize:12,color:C.dim}}>{tx}</div></div>;})}</div>
      </div>}
      {sub==="phos"&&<div style={{display:"flex",flexDirection:"column",gap:14}}>
        <SH title="Phosphorus" C={C}/><div style={rowDiv}><FG label="Serum Phos (mg/dL)" value={phos} onChange={setPhos} placeholder="2.5–4.5" half C={C}/><FG label={`Weight (kg)${ctx.weight?` — ctx: ${ctx.weight}`:""}`} value={phosWt} onChange={setPhosWt} placeholder={ctx.weight||"optional"} half C={C}/></div>
        {phR&&<div style={{...gp(C),borderLeft:`3px solid ${phR.color}`}}><Pill text={phR.level} color={phR.color} C={C}/><VR label="Replacement" value={phR.dose} color={C.txt} C={C}/><div style={{fontFamily:DM,fontSize:12,color:C.dim,marginTop:8,lineHeight:1.6}}>{phR.note}</div>{parseFloat(phos)<1.0&&ePhWt&&<AB text={`IV dose: ${(0.32*parseFloat(ePhWt)).toFixed(1)}–${(0.64*parseFloat(ePhWt)).toFixed(1)} mmol over 4–6h. Max 40 mmol.`} color={C.red} C={C}/>}</div>}
        <SH title="Uric Acid" C={C}/><div style={rowDiv}><FG label="Serum Uric Acid (mg/dL)" value={ua} onChange={setUa} placeholder="Normal <6–7" half C={C}/></div>
        {uaR&&<div style={{...gp(C),borderLeft:`3px solid ${uaR.color}`}}><Pill text={uaR.level} color={uaR.color} C={C}/><div style={{fontFamily:DM,fontSize:12,color:C.dim,marginTop:8,lineHeight:1.6}}>{uaR.note}</div></div>}
      </div>}
    </div>
  );
}

// ── SODIUM TAB ────────────────────────────────────────────────────────────────
function SodiumTab({ctx,onCritical,C=P}){
  const[mode,setMode]=useState("hypo");
  const[serNa,setSerNa]=useState(""),[serOsm,setSerOsm]=useState(""),[urOsm,setUrOsm]=useState(""),[urNa,setUrNa]=useState(""),[glucose,setGlucose]=useState(""),[volStatus,setVolStatus]=useState("eu"),[duration,setDuration]=useState(ctx.duration),[weight,setWeight]=useState(""),[sexH,setSexH]=useState(ctx.sex),[result,setResult]=useState(null),[feua,setFeua]=useState("");
  const[naHist,setNaHist]=useState([]);
  useEffect(()=>setSexH(ctx.sex),[ctx.sex]);useEffect(()=>setDuration(ctx.duration),[ctx.duration]);
  useEffect(()=>{const na=parseFloat(serNa);if(na&&!isNaN(na))onCritical({Na:na});},[serNa]);
  const eWt=weight||ctx.weight;
  const iH=()=>{const na=parseFloat(serNa),sO=parseFloat(serOsm),uO=parseFloat(urOsm),uN=parseFloat(urNa),gl=parseFloat(glucose);const steps=[];if(sO){if(sO>295){const cN=na+1.6*(gl-100)/100;steps.push({title:"Hypertonic Hyponatremia",color:C.amber,body:`Osmotically active solute.${gl?` Corrected Na = ${cN.toFixed(1)} mEq/L.`:" Enter glucose."} Causes: hyperglycemia, mannitol, sorbitol.`});}else if(sO>=280){steps.push({title:"Isotonic — Pseudohyponatremia",color:C.amber,body:"Artifact. Check: hypertriglyceridemia (>1500 mg/dL), hyperproteinemia. Confirm with direct ISE."});}else{steps.push({title:"Hypotonic confirmed",color:C.teal,body:"Serum Osm <280. True dilutional hyponatremia."});if(uO){if(uO<100){steps.push({title:"UOsm <100 — Maximal dilution",color:C.grn,body:"ADH suppressed. Causes: primary polydipsia (>3 L/day), beer potomania, reset osmostat."});}else{steps.push({title:`UOsm ${uO} — ADH active`,color:C.amber,body:"ADH active or impaired dilution."});if(urNa!==""&&!isNaN(uN)){if(uN<20)steps.push({title:volStatus==="hypo"?"Low UNa + Hypovolemic — Non-renal loss":"Low UNa — Na-avid state",color:C.red,body:volStatus==="hypo"?"GI losses, skin losses, third-spacing. Tx: NS resuscitation.":"CHF, cirrhosis, nephrotic syndrome."});else{steps.push({title:volStatus==="hypo"?"High UNa + Hypovolemic — Renal Na wasting":"High UNa + Euvolemic — SIADH vs CSW",color:C.teal,body:volStatus==="hypo"?"CSW, Addison, salt-wasting nephropathy, diuretics.":"SIADH most likely. Also: hypothyroidism, adrenal insufficiency. See SIADH vs CSW."});}}}}}}else steps.push({title:"Enter serum osmolality to begin",color:C.dim,body:"Classifies as hypertonic, isotonic, or hypotonic."});
  const mgmt=duration==="acute"?["Acute: 1–2 mEq/hr; max 8–10 mEq/24h","Symptomatic (sz/coma): 3% NaCl 100 mL IV bolus × 2–3","Asymptomatic: 0.5–1 mEq/hr"]:["Chronic: MAX 8–10 mEq/L per 24h — ODS risk","SIADH: FWR 800–1000 mL/day + treat cause","If FWR fails: oral urea, demeclocycline, or tolvaptan","Overcorrection: D5W ± DDAVP 2–4 mcg IV q8h"];
  if(volStatus==="hypo")mgmt.unshift("Hypovolemic: NS first. Monitor closely for overcorrection.");
  setResult({steps,mgmt});};
  const iHy=()=>{const uO=parseFloat(urOsm),w=parseFloat(eWt),na=parseFloat(serNa);const steps=[];if(uO){if(uO<300)steps.push({title:"UOsm <300 — Diabetes Insipidus",color:C.red,body:"DDAVP trial → response: Central DI. No response: Nephrogenic DI (lithium, demeclocycline, hypercalcemia)."});else if(uO<800)steps.push({title:"UOsm 300–800 — Partial DI or osmotic diuresis",color:C.amber,body:"Partial DI or osmotic diuresis (hyperglycemia, mannitol, urea)."});else steps.push({title:"UOsm >800 — Extrarenal water loss",color:C.grn,body:"Kidney concentrating appropriately. Cause: inadequate free water or extrarenal losses."});}
  if(na&&w){const tbw=w*(sexH==="m"?0.6:0.5),fwd=tbw*(na/140-1);steps.push({title:"Free Water Deficit",color:C.teal,body:`TBW = ${tbw.toFixed(1)} L | FWD ≈ ${fwd.toFixed(1)} L | ~${(fwd/48).toFixed(1)} mL/hr. Recheck Na q4–6h.`});}
  setResult({steps,mgmt:["Max 10–12 mEq/L per 24h; 0.5 mEq/hr chronic","Replace: D5W IV or enteral free water","Central DI: DDAVP 1–2 mcg IV/SC q8–24h","Nephrogenic DI: amiloride (Li-induced), HCTZ + low-Na diet"]});};
  const SCSW=[["Volume status","Euvolemic / slightly hypervolemic","Hypovolemic","JVP, mucous membranes, orthostatics"],["BUN","Normal or low (<12)","Elevated (prerenal >15)","Dehydration raises BUN in CSW"],["Urine Na","High (>40 mEq/L)","High (>40 mEq/L)","Cannot differentiate on UNa alone — order FEUA"],["Serum uric acid","Low (<4 mg/dL)","Normal or low","SIADH suppresses proximal urate reabsorption"],["FEUA","<11% — SIADH","≥11% — CSW","FEUA = (urine UA/serum UA) ÷ (urine Cr/serum Cr) × 100"],["Response to NS","Na rises then falls","Na rises and holds","Diagnostic trial — monitor Na q2–4h"],["Treatment","Fluid restrict · urea · tolvaptan","IV NS · fludrocortisone 0.1–0.2 mg/day","Misdiagnosing CSW as SIADH → fluid restrict worsens depletion"]];
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <Btn active={mode==="hypo"} color={C.teal} onClick={()=>{setMode("hypo");setResult(null);}} C={C}>Hyponatremia</Btn>
        <Btn active={mode==="hyper"} color={C.amber} onClick={()=>{setMode("hyper");setResult(null);}} C={C}>Hypernatremia</Btn>
        <Btn active={mode==="siadh"} color={C.purple} onClick={()=>{setMode("siadh");setResult(null);}} C={C}>SIADH vs CSW</Btn>
      </div>
      {(mode==="hypo"||mode==="hyper")&&<>
        {serNa&&<SeverityGauge metric="Na" value={parseFloat(serNa)} C={C}/>}
        <div style={rowDiv}><FG label="Serum Na (mEq/L)" value={serNa} onChange={setSerNa} placeholder={mode==="hypo"?"< 135":"> 145"} half C={C}/><FG label="Serum Osm" value={serOsm} onChange={setSerOsm} placeholder="280–295" half C={C}/><FG label="Urine Osm" value={urOsm} onChange={setUrOsm} placeholder="spot" half C={C}/>{mode==="hypo"&&<FG label="Urine Na" value={urNa} onChange={setUrNa} placeholder="spot" half C={C}/>}{mode==="hypo"&&<FG label="Glucose (mg/dL)" value={glucose} onChange={setGlucose} placeholder="optional" half C={C}/>}{mode==="hyper"&&<FG label={`Weight (kg)${ctx.weight?` — ctx: ${ctx.weight}`:""}`} value={weight} onChange={setWeight} placeholder={ctx.weight||"70"} half C={C}/>}</div>
        {mode==="hypo"&&<div style={{display:"flex",gap:16,flexWrap:"wrap"}}><div><div style={lbl(C)}>Volume Status</div><div style={{display:"flex",gap:6}}>{[["hypo","Hypovolemic"],["eu","Euvolemic"],["hyper","Hypervolemic"]].map(([val,title])=><Btn key={val} active={volStatus===val} onClick={()=>setVolStatus(val)} style={{fontSize:12,padding:"5px 11px"}} C={C}>{title}</Btn>)}</div></div><div><div style={lbl(C)}>Duration</div><div style={{display:"flex",gap:6}}><Btn active={duration==="acute"} onClick={()=>setDuration("acute")} style={{fontSize:12,padding:"5px 11px"}} C={C}>Acute &lt;48h</Btn><Btn active={duration!=="acute"} onClick={()=>setDuration("chronic")} style={{fontSize:12,padding:"5px 11px"}} C={C}>Chronic</Btn></div></div></div>}
        {mode==="hyper"&&<div style={{display:"flex",gap:8,alignItems:"center"}}><div style={lbl(C)}>Sex</div><Btn active={sexH==="m"} onClick={()=>setSexH("m")} style={{fontSize:12,padding:"5px 12px"}} C={C}>Male</Btn><Btn active={sexH==="f"} onClick={()=>setSexH("f")} style={{fontSize:12,padding:"5px 12px"}} C={C}>Female</Btn></div>}
        <Btn active onClick={mode==="hypo"?iH:iHy} color={mode==="hypo"?C.teal:C.amber} style={{alignSelf:"flex-start",padding:"9px 26px",fontSize:14}} C={C}>{mode==="hypo"?"Analyze Hyponatremia":"Analyze Hypernatremia"}</Btn>
        {result&&<div>{result.steps.map((s,i)=><SC key={i} num={i+1} label={s.title} color={s.color} C={C}><div style={{fontFamily:DM,fontSize:12,color:C.dim,lineHeight:1.6}}>{s.body}</div></SC>)}<div style={{...gp(C),borderLeft:`3px solid ${C.gold}`}}><div style={{fontFamily:DM,fontSize:13,fontWeight:600,color:C.gold,marginBottom:8}}>Management</div>{result.mgmt.map((m,i)=><div key={i} style={{display:"flex",gap:8,padding:"4px 0",borderBottom:sep(C)}}><span style={{color:C.gold,fontFamily:MO,fontSize:11,flexShrink:0}}>{i+1}.</span><span style={{fontFamily:DM,fontSize:12,color:C.txt,lineHeight:1.5}}>{m}</span></div>)}</div></div>}
        <SessionTracker metric="Na" currentVal={serNa} history={naHist} onRecord={h=>setNaHist(p=>[...p,h])} C={C}/>
      </>}
      {mode==="siadh"&&<div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div style={{fontFamily:DM,fontSize:13,color:C.dim,lineHeight:1.6}}>Both cause hyponatremia with high urine Na. The distinction is critical. Key: FEUA &lt;11% = SIADH; ≥11% = CSW.</div>
        <div style={gp(C)}><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontFamily:DM,fontSize:12}}><thead><tr>{["Feature","SIADH","CSW","Clinical Pearl"].map(h=><th key={h} style={{textAlign:"left",padding:"8px 10px",borderBottom:`1px solid ${C.gb}`,color:C.teal,fontWeight:600,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead><tbody>{SCSW.map(([feat,s,c,pearl],i)=><tr key={i} style={{background:i%2===0?C===P?"rgba(0,0,0,0.15)":"#f5f5f5":"transparent"}}><td style={{padding:"8px 10px",color:C.gold,fontWeight:600,whiteSpace:"nowrap"}}>{feat}</td><td style={{padding:"8px 10px",color:C.teal}}>{s}</td><td style={{padding:"8px 10px",color:C.amber}}>{c}</td><td style={{padding:"8px 10px",color:C.dim,lineHeight:1.4,minWidth:180}}>{pearl}</td></tr>)}</tbody></table></div></div>
        <div style={gp(C)}><div style={{fontFamily:DM,fontSize:13,fontWeight:600,color:C.purple,marginBottom:10}}>FEUA</div><div style={rowDiv}><FG label="Pre-calculated FEUA %" value={feua} onChange={setFeua} placeholder="if available" half C={C}/></div>{feua&&<div style={{marginTop:12}}><VR label="FEUA" value={`${parseFloat(feua).toFixed(1)}%`} color={parseFloat(feua)<11?C.teal:C.amber} C={C}/><div style={{marginTop:8}}><Pill text={parseFloat(feua)<11?"SIADH (FEUA <11%)":"CSW (FEUA ≥11%)"} color={parseFloat(feua)<11?C.teal:C.amber} C={C}/></div><AB text="FEUA is also low in SIADH treated with saline. Best measured before saline therapy." color={C.purple} C={C}/></div>}</div>
        <AB text="Diagnostic trial: 1L NS over 4–6h. SIADH → Na doesn't hold. CSW → Na improves and holds. Never fluid restrict a hypovolemic CSW patient." color={C.red} C={C}/>
      </div>}
    </div>
  );
}

// ── HYPERKALEMIA TAB ──────────────────────────────────────────────────────────
const TX=[
  {order:1,name:"Calcium Gluconate",mech:"Membrane stabilization",color:"#ff5252",thresh:5.5,when:"EKG changes or K ≥6.5",onset:"1–3 min",dur:"30–60 min",effect:"No K lowering — cardiac protection only",doseShort:"Ca gluconate 1g (10 mL of 10%) IV over 2–3 min. Repeat ×2 q5 min PRN.",note:"Digoxin: infuse over 20–30 min. CaCl2 = 3× elemental Ca — cardiac arrest only.",orderText:"Calcium gluconate 1 g (10 mL of 10%) IV over 2–3 min. May repeat ×2 q5 min. Indication: Hyperkalemia — cardiac membrane stabilization.",qopSeed:{medication:"Calcium Gluconate",dose:"1g (10 mL 10%) IV",route:"IV",frequency:"over 2-3 min, repeat x2 q5min PRN",indication:"Hyperkalemia — membrane stabilization"}},
  {order:2,name:"Regular Insulin + D50W",mech:"Transcellular shift",color:"#ffab40",thresh:5.5,when:"K ≥5.5",onset:"15–30 min",dur:"4–6 hr",effect:"↓ K 0.5–1.5 mEq/L",doseShort:"Insulin 10u IV push + D50W 25g (1 amp). Omit D50 if glucose >250.",note:"Monitor glucose q1h ×4h. Peak hypoglycemia 1–4h. Consider D10W infusion after.",orderText:"Regular insulin 10 units IV push + D50W 25 g IV. Omit dextrose if glucose >250. Monitor glucose q1h ×4h. Indication: Hyperkalemia — transcellular shift.",qopSeed:{medication:"Regular Insulin + D50W",dose:"Insulin 10 units IV + D50W 25g",route:"IV push",frequency:"once",indication:"Hyperkalemia — transcellular shift"}},
  {order:3,name:"Albuterol 20mg Neb",mech:"Transcellular shift (β2)",color:"#ffab40",thresh:5.5,when:"K ≥5.5 — additive to insulin",onset:"20–30 min",dur:"2–4 hr",effect:"↓ K 0.5–1.0 mEq/L (additive)",doseShort:"Albuterol 20mg neb. (8× 2.5 mg vials — standard 2.5 mg is subtherapeutic.)",note:"Tachycardia expected. Caution in ischemic HD or ACS. Less effective on beta-blocker.",orderText:"Albuterol 20 mg (8× 2.5 mg vials) via nebulizer. Standard 2.5 mg dose is subtherapeutic for hyperkalemia. Indication: Hyperkalemia adjunct — transcellular shift.",qopSeed:{medication:"Albuterol",dose:"20mg (8x 2.5mg vials)",route:"nebulizer",frequency:"once",indication:"Hyperkalemia — transcellular shift adjunct"}},
  {order:4,name:"Sodium Bicarbonate",mech:"Transcellular shift (alkalosis)",color:"#00bcd4",thresh:5.5,when:"Concurrent metabolic acidosis",onset:"30–60 min",dur:"2 hr",effect:"Modest — most effective with MetAcid",doseShort:"NaHCO3 50–100 mEq (1–2 amps) IV over 5–10 min.",note:"Minimal effect at normal pH. Do NOT co-administer with Ca in same IV line.",orderText:"Sodium bicarbonate 50–100 mEq (1–2 amps) IV over 5–10 min. Indication: Hyperkalemia with concurrent metabolic acidosis. Do not co-administer with calcium."},
  {order:5,name:"Furosemide",mech:"Renal elimination",color:"#69f0ae",thresh:5.5,when:"Functioning kidneys, volume-replete",onset:"15–30 min",dur:"6 hr",effect:"↑ urinary K excretion",doseShort:"Furosemide 40–80 mg IV.",note:"Ineffective in oligo/anuria. Higher dose if on chronic loop diuretics.",orderText:"Furosemide 40–80 mg IV. Indication: Hyperkalemia — renal potassium elimination. Verify functioning kidneys before administering."},
  {order:6,name:"Patiromer / SZC (Lokelma)",mech:"GI cation exchange",color:"#69f0ae",thresh:5.0,when:"Subacute / discharge planning",onset:"2–6h",dur:"Ongoing",effect:"↓ K 0.5–1.0 mEq/L over hours–days",doseShort:"Patiromer 8.4g PO daily OR SZC 10g PO TID ×48h then 5–10g daily.",note:"Not for acute emergencies. Avoid Kayexalate — bowel necrosis risk.",orderText:"Patiromer (Veltassa) 8.4 g PO daily with food. OR SZC (Lokelma) 10 g PO TID ×48h then 5–10 g PO daily. Indication: Maintenance hyperkalemia."},
  {order:7,name:"Emergent Hemodialysis",mech:"Definitive elimination",color:"#ff5252",thresh:6.5,when:"Refractory / AKI / EKG instability",onset:"During treatment",dur:"Session-dependent",effect:"↓ K 1–2 mEq/L per hr HD",doseShort:"HD preferred; CRRT if hemodynamically unstable. Nephrology STAT.",note:"K ≥6.5 refractory to meds, AKI/CKD, life-threatening arrhythmia.",orderText:"Emergent hemodialysis. Nephrology STAT. Indication: Hyperkalemia refractory to medical management [K ≥6.5 / AKI / EKG instability]."},
];
function HyperkalemiaTab({ctx,onCritical,C=P,onOpenOrder}){
  const[K,setK]=useState(""),[qt,setQt]=useState(""),[hr,setHr]=useState(""),[sexQT,setSexQT]=useState("m"),[ind,setInd]=useState("metAcid"),[wt,setWt]=useState(""),[hco3S,setHco3S]=useState("");
  const[kHist,setKHist]=useState([]);
  const kN=parseFloat(K)||0;const eWt=wt||ctx.weight;
  useEffect(()=>{if(kN>0)onCritical({K:kN});},[kN]);
  const ekg=()=>{const o=[];if(kN<5.5)o.push({finding:"No EKG changes expected",detail:"Changes begin at K ≥5.5.",color:C.grn});if(kN>=5.5)o.push({finding:"Peaked T waves",detail:"Narrow-based, symmetric, tall T waves in V2–V4.",color:C.amber});if(kN>=6.0)o.push({finding:"PR prolongation + QRS widening",detail:"PR >200 ms. QRS begins to widen. P wave amplitude decreasing.",color:C.coral});if(kN>=6.5)o.push({finding:"P wave flattening / loss",detail:"Atrial standstill. Junctional/ventricular escape. Significant QRS widening.",color:C.red});if(kN>=7.0)o.push({finding:"Sine wave — pre-terminal",detail:"QRS and T merge. Imminent VFib/pVT. Cardiac emergency.",color:C.red});return o;};
  const qtR=(()=>{const qtM=parseFloat(qt),hrN=parseFloat(hr);if(!qtM||!hrN)return null;const rr=60000/hrN,baz=qtM/Math.sqrt(rr/1000),fri=qtM/Math.pow(rr/1000,1/3),up=sexQT==="m"?440:460,worst=Math.max(baz,fri);return{baz:baz.toFixed(0),fri:fri.toFixed(0),rr:rr.toFixed(0),bC:baz>500?C.red:baz>up?C.amber:C.grn,fC:fri>500?C.red:fri>up?C.amber:C.grn,iC:worst>500?C.red:worst>up?C.amber:C.grn,interp:worst>500?"HIGH RISK — Torsades. Discontinue QT-prolonging agents. MgSO4 2g IV.":worst>up?"Prolonged QTc — caution. Correct K, Mg, Ca.":"Normal QTc."};})();
  const bicR=(()=>{const w=parseFloat(eWt),hS=parseFloat(hco3S);if(!w)return null;const bEq=w*0.3*(24-(hS||12));if(ind==="metAcid")return{goal:"HCO3 ≥18 mEq/L (partial correction)",rec:`Bolus: ${(bEq/2).toFixed(0)} mEq IV.`,rate:`Drip: 3 amps in 1L D5W @ ${(((bEq/2)/4)/150*1000).toFixed(0)} mL/hr over 4h.`,note:"Target pH >7.20. Do NOT fully normalize.",deficit:bEq.toFixed(0),ot:`NaHCO3 ${(bEq/2).toFixed(0)} mEq IV bolus then 3 amps in 1L D5W @ ${(((bEq/2)/4)/150*1000).toFixed(0)} mL/hr. Target HCO3 ≥18. Indication: Metabolic acidosis.`};if(ind==="hyperK")return{goal:"Serum pH ≥7.45 (K-lowering adjunct)",rec:`Bolus: ${(w*1.5).toFixed(0)}–${(w*2).toFixed(0)} mEq IV over 5–10 min.`,rate:"Drip: 3 amps in 1L D5W @ 100–150 mL/hr.",note:"Efficacy limited at normal pH. Do NOT co-administer with Ca.",ot:`NaHCO3 ${(w*1.5).toFixed(0)}–${(w*2).toFixed(0)} mEq IV over 5–10 min then 3 amps in 1L D5W @ 100–150 mL/hr. Target pH ≥7.45. Indication: Hyperkalemia adjunct.`};return{goal:"Serum pH 7.45–7.55",rec:`Bolus: ${(w*1).toFixed(0)}–${(w*2).toFixed(0)} mEq IV over 5–10 min.`,rate:"Drip: 3 amps in 1L D5W @ 150–200 mL/hr.",note:"QRS narrowing confirms effect. Target 7.45–7.55. Watch for hypernatremia.",ot:`NaHCO3 ${(w*1).toFixed(0)}–${(w*2).toFixed(0)} mEq IV over 5–10 min. Repeat if QRS wide. Maintenance: 3 amps in 1L D5W @ 150–200 mL/hr. Target pH 7.45–7.55. Indication: TCA overdose.`};})();
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={rowDiv}><FG label="Serum K (mEq/L)" value={K} onChange={setK} placeholder="5.0–7.5+" half C={C}/>{kN>=6.5&&<div style={{flex:"1 1 calc(50% - 6px)"}}><AB text="CRITICAL K ≥6.5. Cardiac monitor now. Steps 1–3 simultaneously. Stat nephrology." color={C.red} C={C}/></div>}</div>
      {kN>0&&<SeverityGauge metric="K" value={kN} C={C}/>}
      {kN>0&&<div style={gp(C)}><div style={{fontFamily:DM,fontSize:13,fontWeight:600,color:C.teal,marginBottom:10}}>EKG Changes at K = {kN.toFixed(1)} mEq/L</div>{ekg().map((e,i)=><div key={i} style={{display:"flex",gap:12,padding:"7px 0",borderBottom:sep(C),alignItems:"flex-start",flexWrap:"wrap"}}><div style={{minWidth:200}}><Pill text={e.finding} color={e.color} C={C}/></div><span style={{fontFamily:DM,fontSize:12,color:C.dim,lineHeight:1.5,flex:1}}>{e.detail}</span></div>)}</div>}
      <SH title="Treatment Cascade" C={C}/>
      <div style={{fontFamily:DM,fontSize:12,color:C.dim,marginTop:-8,marginBottom:4}}>Steps 1–3 are additive — initiate simultaneously in emergent hyperkalemia.</div>
      {TX.filter(t=>!kN||kN>=t.thresh).map(t=>(
        <div key={t.order} style={{...gp(C),borderLeft:`3px solid ${t.color}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,flexWrap:"wrap"}}>
            <span style={{fontFamily:MO,fontSize:10,color:t.color,border:`1px solid ${t.color}`,borderRadius:"50%",width:20,height:20,display:"inline-flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{t.order}</span>
            <span style={{fontFamily:PL,fontSize:15,color:C.txt,flex:1}}>{t.name}</span>
            <Pill text={t.mech} color={t.color} C={C}/>
            {t.qopSeed && onOpenOrder && <QuickOrderButton seed={t.qopSeed} onOpen={onOpenOrder} size='sm' />}
            <CopyBtn text={t.orderText} C={C}/>
          </div>
          <div style={{fontFamily:MO,fontSize:13,color:t.color,padding:"8px 12px",background:`${t.color}10`,borderRadius:6,marginBottom:8,lineHeight:1.5}}>{t.doseShort}</div>
          <div style={{display:"flex",gap:16,flexWrap:"wrap",marginBottom:6}}>
            <span style={{fontFamily:DM,fontSize:11,color:C.dim}}>Onset: <span style={{color:C.teal}}>{t.onset}</span></span>
            <span style={{fontFamily:DM,fontSize:11,color:C.dim}}>Duration: {t.dur}</span>
            <span style={{fontFamily:DM,fontSize:11,color:C.dim}}>Effect: <span style={{color:C.gold}}>{t.effect}</span></span>
            <span style={{fontFamily:DM,fontSize:11,color:C.dim,fontStyle:"italic"}}>{t.when}</span>
          </div>
          <AB text={t.note} color={t.color} C={C}/>
        </div>
      ))}
      <SessionTracker metric="K" currentVal={K} history={kHist} onRecord={h=>setKHist(p=>[...p,h])} C={C}/>
      <SH title="QTc Calculator" C={C}/>
      <div style={gp(C)}>
        <div style={{fontFamily:DM,fontSize:12,color:C.dim,marginBottom:12}}>Bazett: QT/√RR | Fridericia: QT/RR^(1/3) | Upper: 440ms (M), 460ms (F)</div>
        <div style={rowDiv}><FG label="QT interval (ms)" value={qt} onChange={setQt} placeholder="e.g. 420" half C={C}/><FG label="Heart rate (bpm)" value={hr} onChange={setHr} placeholder="e.g. 72" half C={C}/><div style={{flex:"1 1 calc(50% - 6px)"}}><div style={lbl(C)}>Sex</div><div style={{display:"flex",gap:8}}><Btn active={sexQT==="m"} onClick={()=>setSexQT("m")} style={{fontSize:12,padding:"6px 12px"}} C={C}>Male ≤440</Btn><Btn active={sexQT==="f"} onClick={()=>setSexQT("f")} style={{fontSize:12,padding:"6px 12px"}} C={C}>Female ≤460</Btn></div></div></div>
        {qtR&&<div style={{marginTop:14}}><VR label="RR interval" value={qtR.rr} unit="ms" C={C}/><VR label="QTc — Bazett" value={`${qtR.baz} ms`} color={qtR.bC} C={C}/><VR label="QTc — Fridericia" value={`${qtR.fri} ms`} color={qtR.fC} C={C}/><div style={{marginTop:8}}><Pill text={qtR.interp} color={qtR.iC} C={C}/></div><div style={{fontFamily:DM,fontSize:11,color:C.dim,marginTop:8,lineHeight:1.5}}>QT-prolonging: antipsychotics (haloperidol, quetiapine), antiarrhythmics (amiodarone, sotalol), antibiotics (azithromycin, fluoroquinolones), methadone, ondansetron (high dose).</div></div>}
      </div>
      <SH title="Bicarb Drip Builder" C={C}/>
      <div style={gp(C)}>
        <div style={{fontFamily:DM,fontSize:12,color:C.dim,marginBottom:12}}>Standard: 3 amps NaHCO3 (150 mEq) in 1L D5W = 150 mEq/L</div>
        <div style={{marginBottom:10}}><div style={lbl(C)}>Indication</div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}><Btn active={ind==="metAcid"} onClick={()=>setInd("metAcid")} style={{fontSize:12,padding:"6px 12px"}} C={C}>Metabolic Acidosis</Btn><Btn active={ind==="hyperK"} onClick={()=>setInd("hyperK")} style={{fontSize:12,padding:"6px 12px"}} C={C}>Hyperkalemia</Btn><Btn active={ind==="tca"} onClick={()=>setInd("tca")} style={{fontSize:12,padding:"6px 12px"}} C={C}>TCA Overdose</Btn></div></div>
        <div style={rowDiv}><FG label={`Weight (kg)${ctx.weight?` — ctx: ${ctx.weight}`:""}`} value={wt} onChange={setWt} placeholder={ctx.weight||"70"} half C={C}/>{ind==="metAcid"&&<FG label="Current HCO3 (mEq/L)" value={hco3S} onChange={setHco3S} placeholder="e.g. 12" half C={C}/>}</div>
        {bicR&&<div style={{marginTop:14}}><VR label="Goal" value={bicR.goal} color={C.teal} C={C}/>{ind==="metAcid"&&hco3S&&<VR label="HCO3 deficit" value={`${bicR.deficit} mEq`} color={C.amber} C={C}/>}<VR label="Initial dosing" value={bicR.rec} color={C.txt} C={C}/><VR label="Drip rate" value={bicR.rate} color={C.gold} C={C}/><div style={{marginTop:10,display:"flex",justifyContent:"flex-end"}}><CopyBtn text={bicR.ot} C={C}/></div><AB text={bicR.note} color={ind==="tca"?C.red:C.amber} C={C}/></div>}
      </div>
    </div>
  );
}

// ── TLS TAB ───────────────────────────────────────────────────────────────────
function TLSTab({ctx,C=P}){
  const[ua,setUA]=useState(""),[K,setK]=useState(""),[phos,setPhos]=useState(""),[ca,setCa]=useState(""),[cr,setCr]=useState(""),[result,setResult]=useState(null),[risk,setRisk]=useState("low");
  const analyze=()=>{const vals={ua:parseFloat(ua),K:parseFloat(K),phos:parseFloat(phos),ca:parseFloat(ca),cr:parseFloat(cr)};const lc=[];if(vals.ua>=8)lc.push({label:"Uric acid",val:`${vals.ua.toFixed(1)} mg/dL`,thresh:"≥8",color:C.red});if(vals.K>=6.0)lc.push({label:"Potassium",val:`${vals.K.toFixed(1)} mEq/L`,thresh:"≥6.0",color:C.red});if(vals.phos>=4.5)lc.push({label:"Phosphorus",val:`${vals.phos.toFixed(1)} mg/dL`,thresh:"≥4.5",color:C.amber});if(vals.ca&&vals.ca<=7.0)lc.push({label:"Calcium",val:`${vals.ca.toFixed(1)} mg/dL`,thresh:"≤7.0",color:C.red});const lt=lc.length>=2,ct=lt&&vals.cr>=1.5;setResult({lc,lt,ct,severity:ct?"Clinical TLS":lt?"Laboratory TLS":"No TLS criteria met",sc:ct?C.red:lt?C.amber:C.grn});};
  const mgmt={low:["Hydration PO or IV maintenance","Allopurinol 300 mg/day PO (prevention)","Monitor electrolytes, UA, creatinine daily ×7 days"],intermediate:["IV hydration 200 mL/hr (no KCl, no added phos)","Allopurinol 300 mg/day PO","Rasburicase 0.2 mg/kg IV if UA rising (G6PD screen first)","Electrolytes, UA, creatinine q6–8h","Telemetry"],high:["IV hydration 200–300 mL/hr; target UO 80–100 mL/hr","Rasburicase 0.2 mg/kg IV (G6PD screen first — hemolysis risk)","Do NOT use allopurinol with rasburicase","Do NOT alkalinize urine with rasburicase","Electrolytes, UA, creatinine q4–6h","Hyperkalemia: see HyperK tab for full cascade","Hypocalcemia: treat only if symptomatic (tetany, arrhythmia)","Nephrology early — dialysis if refractory AKI","Telemetry"]};
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{fontFamily:DM,fontSize:13,color:C.dim,lineHeight:1.6}}>Cairo-Bishop: Lab TLS = ≥2 abnormal values within 3 days before to 7 days after chemo. Clinical TLS = Lab TLS + Cr ≥1.5× ULN, arrhythmia, seizure, or death.</div>
      <div style={gp(C)}><div style={rowDiv}><FG label="Uric Acid (mg/dL)" value={ua} onChange={setUA} placeholder="≥8" half C={C}/><FG label="Potassium (mEq/L)" value={K} onChange={setK} placeholder="≥6.0" half C={C}/><FG label="Phosphorus (mg/dL)" value={phos} onChange={setPhos} placeholder="≥4.5" half C={C}/><FG label="Calcium (mg/dL)" value={ca} onChange={setCa} placeholder="≤7.0" half C={C}/><FG label="Creatinine (mg/dL)" value={cr} onChange={setCr} placeholder="≥1.5× ULN" half C={C}/></div><Btn active onClick={analyze} style={{marginTop:12,padding:"9px 26px",fontSize:14}} C={C}>Evaluate TLS</Btn></div>
      {result&&<div><SC num={1} label="Lab Criteria" color={result.lt?C.red:C.grn} C={C}>{result.lc.length===0?<div style={{fontFamily:DM,fontSize:12,color:C.grn}}>No lab criteria met.</div>:result.lc.map((c,i)=><div key={i} style={{display:"flex",gap:10,alignItems:"center",padding:"4px 0"}}><Pill text={c.label} color={c.color} C={C}/><span style={{fontFamily:MO,fontSize:13,color:c.color}}>{c.val}</span><span style={{fontFamily:DM,fontSize:11,color:C.dim}}>threshold {c.thresh}</span></div>)}{result.lc.length>0&&<div style={{marginTop:8}}><Pill text={result.lt?"≥2 — Lab TLS present":"<2 — Lab TLS not met"} color={result.lt?C.red:C.amber} C={C}/></div>}</SC><SC num={2} label="Classification" color={result.sc} C={C}><Pill text={result.severity} color={result.sc} C={C}/></SC></div>}
      <SH title="Management by Risk Tier" C={C}/>
      <div style={{display:"flex",gap:8,marginBottom:4,flexWrap:"wrap"}}>{[["low","Low Risk",C.grn],["intermediate","Intermediate",C.amber],["high","High Risk / Established TLS",C.red]].map(([r,label,color])=><Btn key={r} active={risk===r} color={color} onClick={()=>setRisk(r)} C={C}>{label}</Btn>)}</div>
      <div style={{...gp(C),borderLeft:`3px solid ${risk==="high"?C.red:risk==="intermediate"?C.amber:C.grn}`}}>{mgmt[risk].map((m,i)=><div key={i} style={{display:"flex",gap:8,padding:"5px 0",borderBottom:sep(C)}}><span style={{color:risk==="high"?C.red:risk==="intermediate"?C.amber:C.grn,fontFamily:MO,fontSize:11,flexShrink:0}}>{i+1}.</span><span style={{fontFamily:DM,fontSize:12,color:C.txt,lineHeight:1.5}}>{m}</span></div>)}</div>
      <AB text="Highest TLS risk: Burkitt lymphoma, ALL (high WBC), large B-cell (bulky), AML (WBC >100k). Spontaneous TLS can occur before chemo." color={C.coral} C={C}/>
    </div>
  );
}

// ── MAIN HUB ──────────────────────────────────────────────────────────────────
export default function ElectrolyteAcidBaseHub(){
  const[tab,setTab]=useState("abg");
  const[ctx,setCtx]=useState({weight:"",sex:"m",duration:"chronic"});
  const[criticals,setCriticals]=useState({K:null,pH:null,Na:null,Ca:null});
  const[print,setPrint]=useState(false);
  const { activeOrder, openOrder, closeOrder } = useQuickOrder();
  const C=print?PR:P;
  const onCritical=useCallback(vals=>setCriticals(prev=>({...prev,...vals})),[]);
  const TABS=[{id:"abg",label:"ABG / VBG + Osm"},{id:"electrolytes",label:"Electrolytes"},{id:"sodium",label:"Sodium"},{id:"hyperkalemia",label:"HyperK + Tools"},{id:"tls",label:"Tumor Lysis"}];
  return(
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:DM,color:C.txt,transition:"background 0.2s"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');*{box-sizing:border-box;}input[type=number]::-webkit-inner-spin-button{opacity:0.3;}input[type=number]{-moz-appearance:textfield;}@media print{.no-print{display:none!important;}}`}</style>
      <div className="no-print" style={{padding:"24px 24px 0",borderBottom:`1px solid ${C.gb}`,background:print?"#e8e8e8":"rgba(0,0,0,0.18)"}}>
        <div style={{maxWidth:960,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
            <div>
              <div style={{fontFamily:PL,fontSize:26,fontWeight:700,color:C.teal,marginBottom:3}}>Electrolyte & Acid-Base Hub</div>
              <div style={{fontFamily:DM,fontSize:13,color:C.dim,marginBottom:18}}>ABG/VBG · Osmolar gaps · Electrolyte replacement · Sodium disorders · SIADH vs CSW · Hyperkalemia · QTc · Bicarb drip · Tumor lysis</div>
              <PulseNavBadge />
            </div>
            <div style={{display:"flex",gap:8,flexShrink:0,paddingTop:4}}>
              <button onClick={()=>setPrint(p=>!p)} style={{background:print?`${C.teal}20`:"rgba(255,255,255,0.07)",border:`1px solid ${print?C.teal:"rgba(255,255,255,0.2)"}`,borderRadius:8,color:print?C.teal:P.dim,cursor:"pointer",fontFamily:DM,fontSize:12,fontWeight:600,padding:"7px 14px"}}>{print?"● Print mode":"⎙ Print mode"}</button>
              {print&&<button onClick={()=>window.print()} style={{background:C.teal,border:"none",borderRadius:8,color:"#fff",cursor:"pointer",fontFamily:DM,fontSize:12,fontWeight:600,padding:"7px 14px"}}>Print / Save PDF</button>}
            </div>
          </div>
          <div style={{display:"flex",gap:2,flexWrap:"wrap"}}>
            {TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{background:tab===t.id?`${C.teal}18`:"transparent",border:"none",borderBottom:tab===t.id?`2px solid ${C.teal}`:"2px solid transparent",color:tab===t.id?C.teal:C.dim,cursor:"pointer",fontFamily:DM,fontSize:13,fontWeight:tab===t.id?600:400,padding:"10px 18px",transition:"all 0.15s",borderRadius:"6px 6px 0 0"}}>{t.label}</button>)}
          </div>
        </div>
      </div>
      <NotryaPatientBar />
      <PatientBar ctx={ctx} setCtx={setCtx} C={C}/>
      <PanicBanner criticals={criticals} print={print}/>
      {print&&<div style={{maxWidth:960,margin:"0 auto",padding:"10px 24px 4px",borderBottom:`1px solid ${C.gb}`}}><div style={{fontFamily:DM,fontSize:11,color:C.dim}}>Notrya — Electrolyte & Acid-Base Hub · Printed {new Date().toLocaleDateString()} · For clinical reference only. Verify all doses.{ctx.weight&&` · ${ctx.weight} kg · ${ctx.sex==="m"?"Male":"Female"} · ${ctx.duration==="acute"?"Acute":"Chronic"}`}</div></div>}
      <div style={{maxWidth:960,margin:"0 auto",padding:"24px 24px 48px"}}>
        {tab==="abg"&&<ABGTab onCritical={onCritical} C={C}/>}
        {tab==="electrolytes"&&<ElectrolytesTab ctx={ctx} onCritical={onCritical} C={C}/>}
        {tab==="sodium"&&<SodiumTab ctx={ctx} onCritical={onCritical} C={C}/>}
        {tab==="hyperkalemia"&&<HyperkalemiaTab ctx={ctx} onCritical={onCritical} C={C} onOpenOrder={openOrder}/>}
        {tab==="tls"&&<TLSTab ctx={ctx} C={C}/>}
      </div>
      {activeOrder && (
        <QuickOrderPanel orderSeed={activeOrder} patientContext={{weight:ctx.weight}} hubName='ElectrolyteHub' onClose={closeOrder} C='dark' />
      )}
    </div>
  );
}