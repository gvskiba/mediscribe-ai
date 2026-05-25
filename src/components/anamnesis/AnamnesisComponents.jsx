// AnamnesisComponents.jsx
// All Anamnesis UI panels and tab components.
// Imports from anamnesisEngines.js for pure logic.
// Place at: @/components/anamnesis/AnamnesisComponents.jsx

import { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  d1Score, d2Score, d3Score, overallMDM, genMDMNote,
  MDM_CPT, genHIPAA, genCOC,
  fetchDocContent, decodeBase64Doc, extractCCDAText,
} from "@/utils/anamnesisEngines";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DESIGN TOKENS (exported — AnamnesisPage imports these)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const T = {
  bg:"#060f1c", panel:"#0a1828", card:"#0d2040",
  teal:"#00d4a8", tealDim:"#008f72", gold:"#e8b84b",
  coral:"#f06060", blue:"#4a9eff", warn:"#e8a838",
  violet:"#9b7de8", txt:"#e8f0fb", txt2:"#9ab8d8",
  txt3:"#5e88b0", txt4:"#3a5f80",
  border:"rgba(0,212,168,0.13)", borderHi:"rgba(0,212,168,0.32)",
};

export const FONTS = {
  display:"'Playfair Display', Georgia, serif",
  body:   "'DM Sans', system-ui, sans-serif",
  mono:   "'JetBrains Mono', 'Fira Code', monospace",
};

export const g = (r=10, extra={}) => ({
  background:"rgba(10,24,40,0.88)", backdropFilter:"blur(16px)",
  WebkitBackdropFilter:"blur(16px)", border:`1px solid ${T.border}`,
  borderRadius:r, ...extra,
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ATOMS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function Pill({ children, color=T.teal, bg }) {
  return <span style={{display:"inline-flex",alignItems:"center",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20,letterSpacing:"0.05em",background:bg??`${color}20`,color}}>{children}</span>;
}

export function Dot({ color=T.teal, pulse }) {
  return <span style={{width:6,height:6,borderRadius:"50%",background:color,display:"inline-block",flexShrink:0,animation:pulse?"lkxPulse 1.6s ease-in-out infinite":"none"}}/>;
}

export function CopyBtn({ text, label="Copy" }) {
  const [copied,setCopied]=useState(false);
  const handle=async()=>{await navigator.clipboard.writeText(text).catch(()=>{});setCopied(true);setTimeout(()=>setCopied(false),1800);};
  return <span onClick={handle} style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:10,fontWeight:600,cursor:"pointer",color:copied?T.teal:T.txt3,padding:"3px 8px",borderRadius:5,border:`1px solid ${copied?T.borderHi:T.border}`,background:copied?`${T.teal}12`:"transparent",transition:"all .2s",fontFamily:FONTS.body}}>{copied?"✓ Copied":label}</span>;
}

export function SectionHeader({ title, count, copyText }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
      <span style={{fontFamily:FONTS.body,fontSize:10,fontWeight:700,color:T.txt3,letterSpacing:"0.08em",textTransform:"uppercase",flex:1}}>{title}</span>
      {count!=null&&<span style={{fontSize:10,fontWeight:700,minWidth:18,height:18,borderRadius:9,background:T.teal,color:"#000",display:"inline-flex",alignItems:"center",justifyContent:"center",padding:"0 5px"}}>{count}</span>}
      {copyText&&<CopyBtn text={copyText}/>}
    </div>
  );
}

export function LvlBadge({ level }) {
  const c={minimal:T.txt4,low:T.teal,moderate:T.gold,high:T.coral}[level]??T.txt4;
  const bg={minimal:"rgba(58,95,128,0.3)",low:`${T.teal}20`,moderate:`${T.gold}20`,high:`${T.coral}20`}[level]??"rgba(58,95,128,0.3)";
  return <span style={{display:"inline-flex",alignItems:"center",fontSize:10,fontWeight:700,padding:"2px 9px",borderRadius:20,letterSpacing:"0.06em",background:bg,color:c}}>{(level??"—").toUpperCase()}</span>;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RESULT TAB RENDERERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function Empty({ msg }) {
  return <div style={{textAlign:"center",padding:24,color:T.txt4,fontSize:12}}><div style={{fontSize:28,marginBottom:8,opacity:0.3}}>○</div>{msg}</div>;
}

export function VisitList({ data }) {
  if (!data?.length) return <Empty msg="No prior visits on record"/>;
  const copy=data.map(v=>`${v.date}: ${v.cc} → ${v.dx||"—"} (${v.dispo})`).join("\n");
  const dispColor=t=>{const s=(t??"").toLowerCase();return s.includes("admit")||s.includes("or")?T.coral:s.includes("obs")?T.warn:T.teal;};
  return <>
    <SectionHeader title="ED & Inpatient Visits" count={data.length} copyText={copy}/>
    <div style={{display:"grid",gridTemplateColumns:"92px 1fr 1fr 78px",gap:8,padding:"0 0 6px",borderBottom:`1px solid ${T.border}`,marginBottom:4}}>
      {["Date","Chief Complaint","Diagnosis","Dispo"].map(h=><span key={h} style={{fontSize:9,color:T.txt4,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>{h}</span>)}
    </div>
    {data.map((v,i)=>(
      <div key={i} style={{display:"grid",gridTemplateColumns:"92px 1fr 1fr 78px",gap:8,padding:"8px 0",borderBottom:`1px solid rgba(255,255,255,0.04)`,alignItems:"center"}}>
        <span style={{fontFamily:FONTS.mono,fontSize:11,color:T.txt3}}>{v.date}</span>
        <span style={{fontSize:12,color:T.txt,fontWeight:500}}>{v.cc}</span>
        <span style={{fontSize:11,color:T.txt2}}>{v.dx||"—"}</span>
        <Pill color={dispColor(v.dispo)}>{v.dispo}</Pill>
      </div>
    ))}
  </>;
}

export function MedList({ data, normData }) {
  if (!data?.length) return <Empty msg="No active medications found"/>;
  const seen=new Map();const dupKeys=new Set();
  (normData??[]).forEach(m=>{const k=m.ingredientRxcui?`rxcui:${m.ingredientRxcui}`:m.ingredientName?`ing:${m.ingredientName}`:`name:${m.cleanedName}`;if(seen.has(k))dupKeys.add(k);else seen.set(k,m);});
  const getNorm=n=>normData?.find(x=>x.name===n);
  const getDK=n=>n?.ingredientRxcui?`rxcui:${n.ingredientRxcui}`:n?.ingredientName?`ing:${n.ingredientName}`:`name:${n?.cleanedName}`;
  const crossDups=[];const s2=new Map();
  (normData??[]).forEach(m=>{const k=getDK(m);if(s2.has(k)&&!crossDups.find(d=>d.a.name===s2.get(k).name&&d.b.name===m.name))crossDups.push({a:s2.get(k),b:m});else s2.set(k,m);});
  const copy=data.map(m=>`${m.name} ${m.dose||""} ${m.freq||""}`.trim()).join("\n");
  return <>
    <SectionHeader title="Active Medications" count={data.length} copyText={copy}/>
    {crossDups.length>0&&(
      <div style={{display:"flex",alignItems:"flex-start",gap:8,padding:"8px 10px",marginBottom:10,borderRadius:7,background:"rgba(232,184,75,0.08)",border:`1px solid rgba(232,184,75,0.25)`}}>
        <span style={{fontSize:14,color:T.gold,flexShrink:0}}>⬡</span>
        <div>
          <div style={{fontSize:11,fontWeight:700,color:T.gold,marginBottom:3}}>{crossDups.length} cross-system duplicate{crossDups.length!==1?"s":""} detected</div>
          {crossDups.map((d,i)=><div key={i} style={{fontSize:10,color:T.txt3}}><span style={{color:T.gold}}>{d.a.name}</span><span style={{color:T.txt4,margin:"0 5px"}}>↔</span><span style={{color:T.gold}}>{d.b.name}</span>{d.a.ingredientName&&<span style={{color:T.txt4,marginLeft:5}}>(both: {d.a.ingredientName})</span>}</div>)}
        </div>
      </div>
    )}
    {data.map((m,i)=>{
      const norm=getNorm(m.name);const dup=norm?dupKeys.has(getDK(norm)):false;
      return(
        <div key={i} style={{padding:"8px 0",borderBottom:`1px solid rgba(255,255,255,0.04)`,borderLeft:dup?"2px solid rgba(232,184,75,0.4)":"2px solid transparent",paddingLeft:dup?"8px":"0",marginLeft:dup?"-8px":"0",background:dup?"rgba(232,184,75,0.04)":"transparent",transition:"all .2s"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{flex:2}}>
              <span style={{fontSize:12,color:T.txt,fontWeight:500}}>{m.name}</span>
              {norm?.ingredientName&&norm.ingredientName!==m.name.toLowerCase().trim()&&(
                <div style={{fontSize:10,color:T.txt4,marginTop:1}}><span style={{color:T.teal}}>⬡</span> {norm.ingredientName}{norm.ingredientRxcui&&<span style={{color:T.txt4,marginLeft:4,fontFamily:FONTS.mono}}>RxCUI {norm.ingredientRxcui}</span>}</div>
              )}
            </div>
            <span style={{fontFamily:FONTS.mono,fontSize:11,color:T.teal,flexShrink:0}}>{m.dose||"—"}</span>
            <span style={{fontSize:11,color:T.txt2,flex:1}}>{m.freq||"—"}</span>
            <div style={{display:"flex",gap:4,flexShrink:0}}>
              {m.src&&<span style={{fontSize:10,color:T.txt4}}>{m.src}</span>}
              {dup&&<Pill color={T.gold}>DUPLICATE</Pill>}
              {!dup&&norm?.isNormalized&&<Pill color={T.blue}>NORMALIZED</Pill>}
              {norm?.rxnormResolved&&!dup&&!norm.isNormalized&&<span style={{fontSize:9,color:T.txt4,padding:"2px 5px",borderRadius:10,border:`1px solid rgba(255,255,255,0.07)`}}>✓ RxNorm</span>}
            </div>
          </div>
        </div>
      );
    })}
  </>;
}

export function AllergyList({ data }) {
  if (!data?.length) return <Empty msg="No allergies documented"/>;
  const sevColor={severe:T.coral,moderate:T.warn,mild:T.blue,unknown:T.txt3};
  const copy=data.map(a=>`${a.name}: ${a.rxn||"reaction unreported"} (${a.sev})`).join("\n");
  return <>
    <SectionHeader title="Allergies & Adverse Reactions" count={data.length} copyText={copy}/>
    {data.map((a,i)=>(
      <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:`1px solid rgba(255,255,255,0.04)`}}>
        <Pill color={sevColor[a.sev]??T.txt3}>{(a.sev||"?").toUpperCase()}</Pill>
        <span style={{fontSize:12,color:T.txt,fontWeight:600,flex:1}}>{a.name}</span>
        <span style={{fontSize:11,color:T.txt2,flex:1}}>{a.rxn||"—"}</span>
        <span style={{fontSize:10,color:T.txt4}}>{a.src||"—"}</span>
      </div>
    ))}
  </>;
}

export function ProblemList({ data }) {
  if (!data?.length) return <Empty msg="No active problems found"/>;
  const copy=data.map(p=>`${p.name}${p.icd?" ("+p.icd+")":""}`).join("\n");
  return <>
    <SectionHeader title="Active Problem List" count={data.length} copyText={copy}/>
    {data.map((p,i)=>(
      <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:`1px solid rgba(255,255,255,0.04)`}}>
        <Dot color={T.teal}/><span style={{fontSize:12,color:T.txt,flex:1}}>{p.name}</span>
        <span style={{fontFamily:FONTS.mono,fontSize:10,color:T.txt3}}>{p.icd||"—"}</span>
        <span style={{fontSize:10,color:T.txt4}}>{p.src||"—"}</span>
      </div>
    ))}
  </>;
}

export function LabList({ data }) {
  if (!data?.length) return <Empty msg="No recent labs found"/>;
  const flagColor=f=>["H","HH"].includes(f)?T.coral:["L","LL"].includes(f)?T.blue:T.teal;
  const copy=data.map(l=>`${l.name}: ${l.val} (ref ${l.ref||"—"}) [${l.flag}] ${l.date}`).join("\n");
  return <>
    <SectionHeader title="Recent Laboratory Results" count={data.length} copyText={copy}/>
    <div style={{display:"grid",gridTemplateColumns:"1fr 100px 100px 80px",gap:8,padding:"0 0 6px",borderBottom:`1px solid ${T.border}`,marginBottom:4}}>
      {["Test","Value","Reference","Date"].map(h=><span key={h} style={{fontSize:9,color:T.txt4,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>{h}</span>)}
    </div>
    {data.map((l,i)=>(
      <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 100px 100px 80px",gap:8,padding:"7px 0",borderBottom:`1px solid rgba(255,255,255,0.04)`,alignItems:"center"}}>
        <span style={{fontSize:12,color:T.txt}}>{l.name}</span>
        <span style={{fontFamily:FONTS.mono,fontSize:12,color:flagColor(l.flag),fontWeight:["H","L","HH","LL"].includes(l.flag)?700:400}}>{l.val}</span>
        <span style={{fontSize:11,color:T.txt4}}>{l.ref||"—"}</span>
        <span style={{fontFamily:FONTS.mono,fontSize:10,color:T.txt3}}>{l.date}</span>
      </div>
    ))}
  </>;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SESSION ITEM
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function SessionItem({ session, active, onClick }) {
  const { patient, ts, sources, summary } = session;
  const name=`${patient?.firstName??""} ${patient?.lastName??""}`.trim()||"Unknown";
  return (
    <div onClick={onClick} style={{padding:"10px 12px",borderRadius:8,cursor:"pointer",background:active?`${T.teal}12`:"rgba(255,255,255,0.02)",border:`1px solid ${active?T.borderHi:T.border}`,marginBottom:6,transition:"all .15s"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
        <span style={{fontFamily:FONTS.body,fontSize:12,fontWeight:600,color:T.txt,flex:1}}>{name}</span>
        <span style={{fontFamily:FONTS.mono,fontSize:10,color:T.txt4}}>{new Date(ts).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</span>
      </div>
      {patient?.dob&&<div style={{fontSize:10,color:T.txt3,marginBottom:4}}>DOB: {patient.dob}</div>}
      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
        {sources?.map((s,i)=><Pill key={i} color={T.txt4}>{s.slice(0,20)}</Pill>)}
        <Pill color={T.teal}>{summary?.visits??0} visits</Pill>
        <Pill color={T.teal}>{summary?.meds??0} meds</Pill>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POLLING PANEL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function PollingPanel({ job, onCancel, onRetry }) {
  const fmtMs=ms=>{const s=Math.floor(ms/1000),m=Math.floor(s/60);return`${m}:${String(s%60).padStart(2,"0")}`;};
  const isLive=["submitting","polling"].includes(job.phase);
  const isDone=job.phase==="complete";
  const isBad=["error","timeout","cancelled"].includes(job.phase);
  const barColor=isDone?T.teal:isBad?T.coral:`linear-gradient(90deg,${T.tealDim},${T.teal})`;
  return (
    <div style={{...g(10),padding:"14px 16px",marginBottom:12,border:`1px solid ${isDone?T.borderHi:isBad?"rgba(240,96,96,0.3)":T.border}`}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
        <div style={{width:34,height:34,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",background:isDone?`${T.teal}18`:isBad?`${T.coral}18`:`${T.teal}12`,border:`1.5px solid ${isDone?T.teal:isBad?T.coral:T.txt4}44`}}>
          {isLive?<span style={{width:14,height:14,borderRadius:"50%",border:`2px solid ${T.teal}33`,borderTop:`2px solid ${T.teal}`,display:"inline-block",animation:"lkxSpin .85s linear infinite"}}/>:<span style={{fontSize:14,color:isDone?T.teal:T.coral}}>{isDone?"✓":isBad?"✕":"○"}</span>}
        </div>
        <div style={{flex:1}}>
          <div style={{fontFamily:FONTS.body,fontSize:13,fontWeight:600,color:isDone?T.teal:isBad?T.coral:T.txt}}>
            {job.phase==="submitting"&&"Submitting async request..."}{job.phase==="polling"&&`Querying network · poll #${job.polls}`}{job.phase==="complete"&&`Records retrieved · ${job.bundle?.entry?.length??0} resources`}{job.phase==="error"&&"Query failed"}{job.phase==="timeout"&&"Query timed out"}{job.phase==="cancelled"&&"Cancelled"}
          </div>
          <div style={{fontSize:11,color:T.txt4,marginTop:2}}>{isLive?"Carequality · CommonWell · CMS Claims · TEFCA QHIN":job.error?.slice(0,90)??""}</div>
        </div>
        <div style={{fontFamily:FONTS.mono,fontSize:22,fontWeight:700,color:isLive?T.teal:T.txt4,letterSpacing:"0.05em"}}>{fmtMs(job.elapsed)}</div>
      </div>
      <div style={{height:4,background:"rgba(255,255,255,0.06)",borderRadius:2,overflow:"hidden",marginBottom:12}}>
        <div style={{height:"100%",width:`${job.pct}%`,borderRadius:2,background:barColor,transition:isDone?"width .5s ease":"width 1.2s linear",animation:isLive?"lkxShimmer 2.2s linear infinite":"none",backgroundSize:"200% 100%"}}/>
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
        {[["Carequality",true],["CommonWell",true],["CMS Claims",true],["TEFCA QHIN",false]].map(([name,active])=>(
          <span key={name} style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:10,fontWeight:600,padding:"3px 9px",borderRadius:20,letterSpacing:"0.04em",background:active&&(isLive||isDone)?`${T.teal}15`:"rgba(255,255,255,0.04)",color:active&&(isLive||isDone)?T.teal:T.txt4,border:`1px solid ${active&&(isLive||isDone)?T.borderHi:"rgba(255,255,255,0.06)"}`}}>
            <span style={{width:5,height:5,borderRadius:"50%",background:active&&(isLive||isDone)?T.teal:T.txt4,animation:active&&isLive?"lkxPulse 1.4s ease-in-out infinite":"none"}}/>{name}
          </span>
        ))}
      </div>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        {isLive&&<span onClick={onCancel} style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:11,fontWeight:600,cursor:"pointer",color:T.coral,padding:"5px 10px",borderRadius:6,background:"rgba(240,96,96,0.1)",border:"1px solid rgba(240,96,96,0.25)",fontFamily:FONTS.body}}>✕ Cancel</span>}
        {isBad&&onRetry&&<span onClick={onRetry} style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:11,fontWeight:600,cursor:"pointer",color:T.teal,padding:"5px 10px",borderRadius:6,background:`${T.teal}15`,border:`1px solid ${T.borderHi}`,fontFamily:FONTS.body}}>↻ Retry</span>}
        <span style={{flex:1}}/>{job.log.length>0&&<span style={{fontSize:10,color:T.txt4}}>{job.log[job.log.length-1].msg}</span>}
      </div>
      {job.error&&<div style={{marginTop:10,padding:"8px 10px",borderRadius:7,background:"rgba(240,96,96,0.08)",border:"1px solid rgba(240,96,96,0.2)",fontSize:11,color:T.coral,lineHeight:1.6}}>{job.error}</div>}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// IDENTITY MATCH PANEL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function ScoreGauge({ score, color }) {
  const CX=60,CY=64,R=46,START=200,SWEEP=280;
  const toR=d=>d*Math.PI/180,pt=deg=>({x:CX+R*Math.cos(toR(deg)),y:CY+R*Math.sin(toR(deg))});
  const arc=(f,t)=>{const s=pt(f),e=pt(t),lg=(t-f)%360>180?1:0;return`M ${s.x} ${s.y} A ${R} ${R} 0 ${lg} 1 ${e.x} ${e.y}`;};
  const scoreDeg=Math.min(START+(score/100)*SWEEP,START+SWEEP);
  return(
    <svg viewBox="0 0 120 80" width={130} height={87} style={{display:"block",overflow:"visible"}}>
      <defs><linearGradient id="gG2" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#f06060"/><stop offset="35%" stopColor="#e8a838"/><stop offset="65%" stopColor="#e8b84b"/><stop offset="100%" stopColor="#00d4a8"/></linearGradient></defs>
      <path d={arc(START,START+SWEEP)} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={7} strokeLinecap="round"/>
      {score>0&&<path d={arc(START,scoreDeg)} fill="none" stroke="url(#gG2)" strokeWidth={7} strokeLinecap="round"/>}
      {(()=>{const p=pt(scoreDeg);return<circle cx={p.x} cy={p.y} r={4} fill={color} style={{filter:`drop-shadow(0 0 4px ${color})`}}/>;})()}
      <text x={CX} y={CY-4} textAnchor="middle" style={{fontFamily:FONTS.mono,fontSize:22,fontWeight:700,fill:color}}>{score}</text>
      <text x={CX} y={CY+10} textAnchor="middle" style={{fontFamily:FONTS.body,fontSize:7,fill:T.txt4,letterSpacing:"0.08em"}}>IDENTITY SCORE</text>
    </svg>
  );
}

function SimBar({ sim }) {
  const pct=sim==null?0:Math.round(sim*100);
  const c=pct>=90?T.teal:pct>=75?T.gold:pct>=55?T.warn:T.coral;
  return <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:60,height:4,background:"rgba(255,255,255,0.07)",borderRadius:2,overflow:"hidden"}}><div style={{width:`${pct}%`,height:"100%",background:c,borderRadius:2,transition:"width .6s ease"}}/></div><span style={{fontFamily:FONTS.mono,fontSize:10,color:c,fontWeight:700,minWidth:28}}>{sim==null?"—":`${pct}%`}</span></div>;
}

const ID_LEVEL_CFG={
  CONFIRMED:{color:T.teal,bg:"rgba(0,212,168,0.10)",icon:"✓",label:"Identity Confirmed"},
  REVIEW:   {color:T.gold,bg:"rgba(232,184,75,0.10)",icon:"⚠",label:"Review Recommended"},
  CAUTION:  {color:"#e8a838",bg:"rgba(232,168,56,0.10)",icon:"!",label:"Attestation Required"},
  BLOCKED:  {color:T.coral,bg:"rgba(240,96,96,0.10)",icon:"✕",label:"Identity Blocked"},
};

export function IdentityMatchPanel({ result, queryDemog, fhirDemog, onAttest, attested }) {
  const [expanded,setExpanded]=useState(false);
  if (!result) return null;
  const { score, level, color, blockReason, warnings, fields, weights, mrnProvided } = result;
  const cfg=ID_LEVEL_CFG[level]??ID_LEVEL_CFG.REVIEW;
  const ROWS=[
    {key:"last",label:"Last Name",qVal:queryDemog?.lastName||"—",fVal:fhirDemog?.lastName||"—",field:fields?.last??{sim:null,label:"—",detail:""},weight:weights?.last??0},
    {key:"first",label:"First Name",qVal:queryDemog?.firstName||"—",fVal:fhirDemog?.firstName||"—",field:fields?.first??{sim:null,label:"—",detail:""},weight:weights?.first??0},
    {key:"dob",label:"Date of Birth",qVal:queryDemog?.dob||"—",fVal:fhirDemog?.dob||"—",field:fields?.dob??{sim:null,label:"—",detail:""},weight:weights?.dob??0},
    ...(mrnProvided?[{key:"mrn",label:"MRN",qVal:queryDemog?.mrn||"—",fVal:fhirDemog?.mrn||"(not in record)",field:fields?.mrn??{sim:null,label:"—",detail:""},weight:weights?.mrn??0}]:[]),
  ];
  return (
    <div style={{...g(10),marginBottom:12,overflow:"hidden",border:`1px solid ${level==="BLOCKED"?"rgba(240,96,96,0.35)":level==="CAUTION"?"rgba(232,168,56,0.25)":T.border}`}}>
      <div style={{display:"flex",alignItems:"center",background:cfg.bg,borderBottom:`1px solid ${T.border}`,padding:"10px 16px"}}>
        <div style={{width:26,height:26,borderRadius:"50%",background:`${cfg.color}22`,border:`1.5px solid ${cfg.color}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:cfg.color,fontWeight:700,marginRight:10,flexShrink:0}}>{cfg.icon}</div>
        <div style={{flex:1}}><div style={{fontFamily:FONTS.body,fontSize:12,fontWeight:700,color:cfg.color}}>{cfg.label}</div><div style={{fontSize:10,color:T.txt4,marginTop:1}}>Lakonyx Anamnesis · Fellegi-Sunter probabilistic identity match</div></div>
        <div onClick={()=>setExpanded(v=>!v)} style={{fontSize:10,color:T.txt4,cursor:"pointer",padding:"4px 8px",border:`1px solid ${T.border}`,borderRadius:5,fontFamily:FONTS.body,flexShrink:0}}>{expanded?"▲ Less":"▼ Details"}</div>
      </div>
      <div style={{display:"flex",alignItems:"center",padding:"12px 16px",borderBottom:`1px solid ${T.border}`}}>
        <ScoreGauge score={score} color={color}/>
        <div style={{marginLeft:16,flex:1}}>
          {[{r:"≥ 92",l:"Confirmed",c:T.teal,a:level==="CONFIRMED"},{r:"80–91",l:"Review",c:T.gold,a:level==="REVIEW"},{r:"65–79",l:"Caution",c:"#e8a838",a:level==="CAUTION"},{r:"< 65",l:"Blocked",c:T.coral,a:level==="BLOCKED"}].map(t=>(
            <div key={t.l} style={{display:"flex",alignItems:"center",gap:6,marginBottom:4,opacity:t.a?1:0.35}}>
              <span style={{width:6,height:6,borderRadius:"50%",background:t.c,flexShrink:0}}/><span style={{fontFamily:FONTS.mono,fontSize:10,color:T.txt4,width:38}}>{t.r}</span><span style={{fontSize:10,fontWeight:t.a?700:400,color:t.a?t.c:T.txt4}}>{t.l}</span>
              {t.a&&<span style={{fontSize:9,color:t.c,background:`${t.c}18`,padding:"1px 5px",borderRadius:3,fontWeight:700}}>▶ NOW</span>}
            </div>
          ))}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:6,minWidth:160}}>
          {ROWS.map(r=><div key={r.key} style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:10,color:T.txt4,width:80,flexShrink:0}}>{r.label}</span><SimBar sim={r.field.sim}/></div>)}
        </div>
      </div>
      {warnings?.length>0&&<div style={{padding:"8px 16px",borderBottom:`1px solid ${T.border}`,display:"flex",flexDirection:"column",gap:3}}>{warnings.map((w,i)=><div key={i} style={{fontSize:11,color:w.startsWith("⚠")?T.warn:T.txt3,lineHeight:1.5}}>{w}</div>)}</div>}
      {expanded&&(
        <div style={{padding:"10px 16px",borderBottom:`1px solid ${T.border}`}}>
          <div style={{fontSize:10,fontWeight:700,color:T.txt4,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8}}>Field-by-Field Analysis</div>
          <div style={{display:"grid",gridTemplateColumns:"80px 1fr 1fr 140px 70px",gap:8,padding:"0 0 5px",borderBottom:`1px solid rgba(255,255,255,0.05)`,marginBottom:4}}>
            {["Field","Query","FHIR Record","Match","Weight"].map(h=><span key={h} style={{fontSize:9,color:T.txt4,fontWeight:700,letterSpacing:"0.07em",textTransform:"uppercase"}}>{h}</span>)}
          </div>
          {ROWS.map(r=>(
            <div key={r.key} style={{display:"grid",gridTemplateColumns:"80px 1fr 1fr 140px 70px",gap:8,padding:"7px 0",borderBottom:`1px solid rgba(255,255,255,0.04)`,alignItems:"start"}}>
              <span style={{fontSize:11,color:T.txt3,fontWeight:600}}>{r.label}</span>
              <span style={{fontFamily:FONTS.mono,fontSize:11,color:T.txt,wordBreak:"break-all"}}>{r.qVal}</span>
              <span style={{fontFamily:FONTS.mono,fontSize:11,color:T.txt,wordBreak:"break-all"}}>{r.fVal}</span>
              <div><div style={{fontSize:10,fontWeight:700,color:r.field.sim==null?T.txt4:r.field.sim>=0.90?T.teal:r.field.sim>=0.70?T.gold:r.field.sim>=0.50?T.warn:T.coral,marginBottom:3}}>{r.field.label}</div><div style={{fontSize:10,color:T.txt4,lineHeight:1.5}}>{r.field.detail}</div>{r.field.nickname&&<div style={{fontSize:9,color:T.blue,marginTop:2}}>Nickname match detected</div>}</div>
              <div style={{display:"flex",flexDirection:"column",gap:3}}><SimBar sim={r.field.sim}/><span style={{fontSize:9,color:T.txt4}}>wt {r.weight}</span></div>
            </div>
          ))}
        </div>
      )}
      {level==="BLOCKED"&&<div style={{padding:"14px 16px",background:"rgba(240,96,96,0.10)",borderTop:`1px solid rgba(240,96,96,0.25)`}}><div style={{display:"flex",alignItems:"flex-start",gap:10}}><span style={{fontSize:20,color:T.coral,lineHeight:1,marginTop:1}}>⊘</span><div><div style={{fontSize:12,fontWeight:700,color:T.coral,marginBottom:4}}>IDENTITY VERIFICATION REQUIRED — Import Blocked</div><div style={{fontSize:11,color:"rgba(240,96,96,0.8)",lineHeight:1.6}}>{blockReason}</div><div style={{marginTop:8,fontSize:11,color:T.txt4,lineHeight:1.6}}>Confirm name and DOB verbally, check MRN against wristband, or search with additional identifiers.</div></div></div></div>}
      {level==="CAUTION"&&<div style={{padding:"12px 16px",background:"rgba(232,168,56,0.08)",borderTop:`1px solid rgba(232,168,56,0.2)`}}><div style={{fontSize:11,color:"#e8a838",marginBottom:10,lineHeight:1.6}}><strong>Clinician attestation required.</strong> You may view the records below. Importing requires direct identity verification.</div><label style={{display:"flex",alignItems:"flex-start",gap:10,cursor:"pointer"}}><div onClick={onAttest} style={{width:18,height:18,borderRadius:4,border:`2px solid ${attested?"#e8a838":"rgba(232,168,56,0.5)"}`,background:attested?"rgba(232,168,56,0.25)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1,transition:"all .15s",cursor:"pointer"}}>{attested&&<span style={{fontSize:11,color:"#e8a838",lineHeight:1}}>✓</span>}</div><span style={{fontSize:11,color:attested?T.txt:T.txt3,lineHeight:1.6,userSelect:"none"}}>I have verbally confirmed this patient's identity (name, date of birth) and accept clinical responsibility for this record import.</span></label>{attested&&<div style={{marginTop:8,fontSize:10,color:"#e8a838",fontStyle:"italic"}}>Attestation recorded · {new Date().toLocaleString()}</div>}</div>}
      {level==="REVIEW"&&<div style={{padding:"10px 16px",background:"rgba(232,184,75,0.07)",borderTop:`1px solid rgba(232,184,75,0.15)`}}><div style={{fontSize:11,color:T.gold,lineHeight:1.6}}><strong>Identity review recommended.</strong> Score is within acceptable range but below the confirmed threshold. Verify at least one additional identifier before importing.</div></div>}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DDI PANEL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const DDI_SEV={
  critical:{color:T.coral,bg:"rgba(240,96,96,0.10)",bdr:"rgba(240,96,96,0.30)",label:"CRITICAL",icon:"⊘",ack:true},
  major:   {color:T.warn, bg:"rgba(232,168,56,0.10)",bdr:"rgba(232,168,56,0.25)",label:"MAJOR",   icon:"⚠",ack:true},
  moderate:{color:T.gold, bg:"rgba(232,184,75,0.08)",bdr:"rgba(232,184,75,0.20)",label:"MODERATE",icon:"!",ack:false},
  minor:   {color:T.blue, bg:"rgba(74,158,255,0.08)",bdr:"rgba(74,158,255,0.15)",label:"MINOR",   icon:"ℹ",ack:false},
};

function IxCard({ ix, acknowledged, onAcknowledge }) {
  const [open,setOpen]=useState(ix.severity==="critical");
  const cfg=DDI_SEV[ix.severity]??DDI_SEV.moderate;
  const acked=acknowledged?.has(ix.key);
  return(
    <div style={{borderRadius:8,overflow:"hidden",marginBottom:6,border:`1px solid ${acked?"rgba(0,212,168,0.2)":cfg.bdr}`,background:acked?"rgba(0,212,168,0.04)":cfg.bg,opacity:acked?0.75:1}}>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",cursor:"pointer"}} onClick={()=>setOpen(v=>!v)}>
        <Pill color={cfg.color} bg={cfg.bg}>{cfg.icon} {cfg.label}</Pill>
        <div style={{flex:1}}><div style={{fontFamily:FONTS.body,fontSize:12,fontWeight:700,color:T.txt}}>{ix.drugA}<span style={{color:T.txt4,fontWeight:400,margin:"0 5px"}}>+</span>{ix.drugB}</div><div style={{fontSize:10,color:cfg.color,marginTop:1}}>{ix.class}</div></div>
        {acked&&<span style={{fontSize:9,color:T.teal,fontWeight:700,padding:"2px 6px",borderRadius:4,background:`${T.teal}15`}}>✓ Acked</span>}
        <span style={{fontSize:10,color:T.txt4}}>{open?"▲":"▼"}</span>
      </div>
      {open&&(
        <div style={{padding:"0 12px 12px",borderTop:`1px solid rgba(255,255,255,0.05)`}}>
          <div style={{marginTop:10}}><div style={{fontSize:9,fontWeight:700,color:T.txt4,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:3}}>Clinical Effect</div><div style={{fontSize:12,color:T.txt,lineHeight:1.6}}>{ix.effect}</div></div>
          <div style={{marginTop:8}}><div style={{fontSize:9,fontWeight:700,color:T.txt4,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:3}}>Mechanism</div><div style={{fontSize:11,color:T.txt2,lineHeight:1.6}}>{ix.mechanism}</div></div>
          <div style={{marginTop:8,padding:"8px 10px",borderRadius:6,background:"rgba(0,0,0,0.25)",border:`1px solid rgba(255,255,255,0.07)`}}><div style={{fontSize:9,fontWeight:700,color:T.txt4,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:3}}>Clinical Management</div><div style={{fontSize:11,color:T.txt2,lineHeight:1.6}}>{ix.management}</div></div>
          <div style={{marginTop:6,fontSize:10,color:T.txt4}}>Source: {ix.source}</div>
          {cfg.ack&&!acked&&<div style={{marginTop:10}}><div onClick={()=>onAcknowledge?.(ix.key)} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:7,cursor:"pointer",fontSize:11,fontWeight:600,background:`${cfg.color}18`,color:cfg.color,border:`1px solid ${cfg.bdr}`,fontFamily:FONTS.body}}>✓ I have reviewed this interaction and accept clinical responsibility</div></div>}
          {cfg.ack&&acked&&<div style={{marginTop:8,fontSize:10,color:T.teal,fontStyle:"italic"}}>Acknowledged · {new Date().toLocaleString()}</div>}
        </div>
      )}
    </div>
  );
}

export function DDIPanel({ ddiState, checking, onAcknowledge, acknowledged }) {
  const [showAll,setShowAll]=useState(false);
  if (checking) return <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:8,background:"rgba(255,255,255,0.03)",border:`1px solid ${T.border}`,marginBottom:10}}><span style={{display:"inline-block",width:14,height:14,borderRadius:"50%",border:`2px solid ${T.teal}33`,borderTop:`2px solid ${T.teal}`,animation:"lkxSpin .85s linear infinite",flexShrink:0}}/><div><div style={{fontSize:12,fontWeight:600,color:T.txt}}>Checking drug interactions...</div><div style={{fontSize:10,color:T.txt4,marginTop:1}}>ONCHigh curated table + OpenFDA label API</div></div></div>;
  if (!ddiState) return null;
  const {status,interactions,resolvedNames,fdaChecked,checkedAt}=ddiState;
  if (status==="clean"||status==="ok") return <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:8,background:`${T.teal}08`,border:`1px solid ${T.borderHi}`,marginBottom:10}}><span style={{fontSize:16,color:T.teal}}>✓</span><div style={{flex:1}}><div style={{fontSize:12,fontWeight:600,color:T.teal}}>No drug interactions detected</div><div style={{fontSize:10,color:T.txt4,marginTop:1}}>{resolvedNames?.length??0} med(s) checked · ONCHigh + {fdaChecked?"OpenFDA":"static"}{checkedAt?` · ${new Date(checkedAt).toLocaleTimeString()}`:""}</div></div><span style={{fontSize:9,color:T.txt4,fontStyle:"italic"}}>Data from U.S. National Library of Medicine.</span></div>;
  const crits=interactions.filter(i=>i.severity==="critical");
  const majs=interactions.filter(i=>i.severity==="major");
  const unacked=[...crits,...majs].filter(i=>!acknowledged?.has(i.key));
  const hdrColor=status==="critical"?T.coral:status==="major"?T.warn:T.gold;
  const hdrBdr=status==="critical"?"rgba(240,96,96,0.30)":status==="major"?"rgba(232,168,56,0.25)":"rgba(232,184,75,0.20)";
  const shown=showAll?interactions:[...crits,...majs,...interactions.filter(i=>!["critical","major"].includes(i.severity))].slice(0,5);
  return(
    <div style={{marginBottom:10}}>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:"8px 8px 0 0",background:status==="critical"?"rgba(240,96,96,0.10)":status==="major"?"rgba(232,168,56,0.10)":"rgba(232,184,75,0.08)",border:`1px solid ${hdrBdr}`,borderBottom:"none"}}>
        <span style={{fontSize:14,color:hdrColor}}>{status==="critical"?"⊘":"⚠"}</span>
        <div style={{flex:1}}><div style={{fontFamily:FONTS.body,fontSize:12,fontWeight:700,color:hdrColor}}>{crits.length>0?`${crits.length} Critical`:""}{crits.length>0&&majs.length>0?" + ":""}{majs.length>0?`${majs.length} Major`:""}{crits.length===0&&majs.length===0?`${interactions.length} Moderate`:""}{" "}Drug Interaction{interactions.length!==1?"s":""} Detected</div><div style={{fontSize:10,color:T.txt4,marginTop:1}}>{resolvedNames?.length??0} med(s) · ONCHigh + {fdaChecked?"OpenFDA":"static"}{checkedAt?` · ${new Date(checkedAt).toLocaleTimeString()}`:""}</div></div>
        {unacked.length>0&&<span style={{fontSize:10,color:T.coral,fontWeight:700,padding:"3px 8px",borderRadius:5,background:"rgba(240,96,96,0.15)",border:"1px solid rgba(240,96,96,0.3)"}}>{unacked.length} require acknowledgment</span>}
        {unacked.length===0&&(crits.length+majs.length>0)&&<span style={{fontSize:10,color:T.teal,fontWeight:700,padding:"3px 8px",borderRadius:5,background:`${T.teal}15`,border:`1px solid ${T.borderHi}`}}>✓ All acknowledged</span>}
      </div>
      <div style={{padding:"10px 12px",borderRadius:"0 0 8px 8px",background:"rgba(10,24,40,0.6)",border:`1px solid ${hdrBdr}`,borderTop:"none"}}>
        {shown.map((ix,i)=><IxCard key={`${ix.key}-${i}`} ix={ix} acknowledged={acknowledged} onAcknowledge={onAcknowledge}/>)}
        {interactions.length>5&&<div onClick={()=>setShowAll(v=>!v)} style={{textAlign:"center",padding:"6px 0",fontSize:11,color:T.txt4,cursor:"pointer",borderTop:`1px solid ${T.border}`,marginTop:4}}>{showAll?`▲ Show less`:`▼ Show ${interactions.length-5} more`}</div>}
        <div style={{marginTop:8,paddingTop:8,borderTop:`1px solid rgba(255,255,255,0.04)`,fontSize:9,color:T.txt4,lineHeight:1.5}}>This product uses publicly available data from the U.S. National Library of Medicine. Not a substitute for clinical pharmacist review.</div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MDM NOTE PANEL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const PROB_OPTS=[{val:"",label:"— Select presenting problem —"},{val:"self_limited",label:"Self-limited or minor problem",level:"low"},{val:"stable_chronic",label:"1 stable chronic illness",level:"low"},{val:"new_undiagnosed",label:"New problem with uncertain diagnosis",level:"moderate"},{val:"acute_systemic",label:"Acute illness with systemic symptoms",level:"moderate"},{val:"acute_complicated",label:"Acute complicated injury",level:"moderate"},{val:"chronic_exacerbation",label:"Chronic illness with exacerbation",level:"moderate"},{val:"multiple_chronic",label:"Multiple stable chronic illnesses",level:"moderate"},{val:"severe_exacerbation",label:"Chronic illness with severe exacerbation",level:"high"},{val:"threat_to_life",label:"Acute/chronic illness — threat to life",level:"high"}];
const PT_OPTS=[{val:"ed",label:"Emergency Department"},{val:"new",label:"New Patient (Office)"},{val:"established",label:"Established Patient (Office)"}];
const selSty={width:"100%",background:"rgba(0,0,0,0.35)",border:`1px solid ${T.border}`,borderRadius:6,padding:"6px 8px",color:T.txt,fontSize:11,fontFamily:"'DM Sans',sans-serif",outline:"none"};

export function MDMNotePanel({ data, sources, ddiState, medNorm }) {
  const [pp,setPP]=useState("");const [cat2,setCat2]=useState(false);const [cat3,setCat3]=useState(false);
  const [d3Ov,setD3Ov]=useState("");const [pt,setPT]=useState("ed");const [copied,setCopied]=useState(null);
  const d1=d1Score({problems:data?.problems??[],presentingProblem:pp||null});
  const d2=d2Score({visits:data?.visits??[],labs:data?.labs??[],medications:data?.medications??[],sources,hasCategory2:cat2,hasCategory3:cat3});
  const d3=d3Score({medications:data?.medications??[],medNorm:medNorm??[],ddiState,riskOverride:d3Ov||null});
  const overall=overallMDM(d1.level,d2.level,d3.level);
  const note=genMDMNote({d1,d2,d3,overall,data,sources,patientType:pt,checkedAt:new Date().toISOString()});
  const copy=(text,key)=>{navigator.clipboard.writeText(text).catch(()=>{});setCopied(key);setTimeout(()=>setCopied(null),1800);};
  const oColor={minimal:T.txt4,low:T.teal,moderate:T.gold,high:T.coral}[overall]??T.teal;
  const cb=(label,checked,toggle)=>(
    <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",marginBottom:6}}>
      <div onClick={toggle} style={{width:16,height:16,borderRadius:3,border:`2px solid ${checked?T.teal:"rgba(0,212,168,0.3)"}`,background:checked?`${T.teal}25`:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,cursor:"pointer"}}>
        {checked&&<span style={{fontSize:10,color:T.teal,lineHeight:1}}>✓</span>}
      </div>
      <span style={{fontSize:11,color:checked?T.txt:T.txt3,userSelect:"none",lineHeight:1.5}}>{label}</span>
    </label>
  );
  const blk=(title,text,key,lvl)=>(
    <div style={{marginBottom:10,borderRadius:8,overflow:"hidden",border:`1px solid ${T.border}`}}>
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:"rgba(255,255,255,0.03)",borderBottom:`1px solid ${T.border}`}}>
        <span style={{fontSize:11,fontWeight:700,color:T.txt3,flex:1}}>{title}</span><LvlBadge level={lvl}/>
        <span onClick={()=>copy(text,key)} style={{fontSize:10,cursor:"pointer",color:copied===key?T.teal:T.txt4,padding:"2px 7px",borderRadius:4,border:`1px solid ${copied===key?T.borderHi:T.border}`,background:copied===key?`${T.teal}12`:"transparent",fontFamily:FONTS.body}}>{copied===key?"✓ Copied":"Copy"}</span>
      </div>
      <textarea readOnly value={text} onFocus={e=>e.target.select()} style={{width:"100%",background:"transparent",border:"none",padding:"10px 12px",color:T.txt2,fontSize:11,fontFamily:FONTS.mono,lineHeight:1.7,resize:"none",outline:"none",minHeight:80,boxSizing:"border-box"}} rows={text.split("\n").length+1}/>
    </div>
  );
  return(
    <div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12,padding:"12px 14px",borderRadius:8,background:"rgba(0,0,0,0.25)",border:`1px solid ${T.border}`}}>
        <div><div style={{fontSize:9,fontWeight:700,color:T.txt4,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:5}}>Presenting Problem (Domain 1)</div><select value={pp} onChange={e=>setPP(e.target.value)} style={selSty}>{PROB_OPTS.map(o=><option key={o.val} value={o.val}>{o.label}</option>)}</select>{d1.isSuggested&&!pp&&<div style={{fontSize:9,color:T.txt4,marginTop:4}}>Auto-suggested from {d1.chronicCount} imported problem{d1.chronicCount!==1?"s":""}.</div>}</div>
        <div>
          <div style={{fontSize:9,fontWeight:700,color:T.txt4,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:5}}>Patient / Visit Type</div>
          <select value={pt} onChange={e=>setPT(e.target.value)} style={{...selSty,marginBottom:8}}>{PT_OPTS.map(o=><option key={o.val} value={o.val}>{o.label}</option>)}</select>
          <div style={{fontSize:9,fontWeight:700,color:T.txt4,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:5}}>Domain 3 Override</div>
          <select value={d3Ov} onChange={e=>setD3Ov(e.target.value)} style={selSty}><option value="">Auto-detect from medications</option>{["minimal","low","moderate","high"].map(l=><option key={l} value={l}>{l.charAt(0).toUpperCase()+l.slice(1)}</option>)}</select>
        </div>
        <div style={{gridColumn:"1/-1"}}><div style={{fontSize:9,fontWeight:700,color:T.txt4,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6}}>Additional Data Credits (Domain 2)</div>{cb("Category 2 — I independently interpreted an external test not separately billed",cat2,()=>setCat2(v=>!v))}{cb("Category 3 — I discussed this case with an external physician or qualified health professional",cat3,()=>setCat3(v=>!v))}</div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",marginBottom:12,borderRadius:8,background:`${oColor}12`,border:`1px solid ${oColor}30`}}>
        <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:oColor,fontFamily:FONTS.display}}>Overall MDM: {overall.toUpperCase()}</div><div style={{fontSize:11,color:T.txt3,marginTop:2}}>Domain 1 (Problems): {d1.level.toUpperCase()} · Domain 2 (Data): {d2.level.toUpperCase()} · Domain 3 (Risk): {d3.level.toUpperCase()} · 2-of-3 rule applied</div></div>
        <div style={{textAlign:"right",flexShrink:0}}><div style={{fontFamily:FONTS.mono,fontSize:18,fontWeight:700,color:oColor}}>{note.cpt}</div><div style={{fontSize:9,color:T.txt4,marginTop:1}}>{pt==="ed"?"ED E&M":pt==="new"?"New Pt":"Est. Pt"}</div></div>
        <span onClick={()=>copy(note.fullNote,"all")} style={{display:"inline-flex",alignItems:"center",gap:5,padding:"7px 14px",borderRadius:7,cursor:"pointer",fontSize:11,fontWeight:700,color:copied==="all"?"#000":oColor,background:copied==="all"?oColor:`${oColor}15`,border:`1px solid ${oColor}40`,fontFamily:FONTS.body,flexShrink:0}}>{copied==="all"?"✓ Copied":"Copy Full MDM Note"}</span>
      </div>
      {blk("Domain 1 — Problems Addressed",note.d1Block,"d1",d1.level)}
      {blk("Domain 2 — Data Reviewed",note.d2Block,"d2",d2.level)}
      {blk("Domain 3 — Risk",note.d3Block,"d3",d3.level)}
      {blk("Summary & E&M Code",note.summaryBlock,"sum",overall)}
      <div style={{fontSize:9,color:T.txt4,lineHeight:1.6,marginTop:6}}>MDM scoring per AMA 2023 E&M Guidelines. Provider must verify all selections and confirm final MDM level. Generated by Lakonyx Anamnesis.</div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PROVENANCE PANEL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const PROV_COLORS={QUERY_INITIATED:"rgba(74,158,255,0.15)",IDENTITY_VERIFIED:"rgba(0,212,168,0.12)",RECORDS_RECEIVED:"rgba(0,212,168,0.12)",PROVIDER_ATTESTED:"rgba(232,168,56,0.15)",IMPORTED_TO_ENCOUNTER:"rgba(155,125,232,0.15)"};
const PROV_ICONS={QUERY_INITIATED:"⬡",IDENTITY_VERIFIED:"✓",RECORDS_RECEIVED:"↓",PROVIDER_ATTESTED:"!",IMPORTED_TO_ENCOUNTER:"→"};

export function ProvenancePanel({ provRecord, attested, onSaveToBase44, savedToBase44 }) {
  const [copied,setCopied]=useState(null);const [showItems,setShowItems]=useState(false);
  if (!provRecord) return <div style={{textAlign:"center",padding:32,color:T.txt4,fontSize:12}}><div style={{fontSize:28,marginBottom:8,opacity:0.3}}>⬡</div>No provenance record yet. Query the network to generate a chain of custody.</div>;
  const copy=(text,key)=>{navigator.clipboard.writeText(text).catch(()=>{});setCopied(key);setTimeout(()=>setCopied(null),2000);};
  const ts=s=>s?new Date(s).toLocaleString("en-US",{timeStyle:"short",dateStyle:"short"}):"—";
  const lat=provRecord.latencyMs!=null?`${(provRecord.latencyMs/1000).toFixed(1)}s`:null;
  return(
    <div>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:8,background:"rgba(0,0,0,0.3)",border:`1px solid ${T.border}`,marginBottom:10}}>
        <div style={{flex:1}}><div style={{fontSize:10,fontWeight:700,color:T.txt4,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:3}}>Provenance Query ID</div><div style={{fontFamily:FONTS.mono,fontSize:13,fontWeight:700,color:T.teal,letterSpacing:"0.06em"}}>{provRecord.queryId}</div><div style={{fontSize:10,color:T.txt4,marginTop:2}}>{"async-fhir"===provRecord.retrievalMethod?"Async FHIR R4 $everything":"paste-ai"===provRecord.retrievalMethod?"AI-parsed document":"Session cache"} · {provRecord.networkSources?.join(", ")??"—"}{lat?` · ${lat} latency`:""}</div></div>
        <div style={{display:"flex",gap:6}}>
          {!savedToBase44&&onSaveToBase44&&<div onClick={onSaveToBase44} style={{display:"inline-flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:7,cursor:"pointer",fontSize:11,fontWeight:600,background:`${T.violet}18`,color:T.violet,border:"1px solid rgba(155,125,232,0.3)",fontFamily:FONTS.body}}>⬡ Save to Base44</div>}
          {savedToBase44&&<span style={{fontSize:10,color:T.violet,padding:"3px 8px",borderRadius:5,background:"rgba(155,125,232,0.12)",border:"1px solid rgba(155,125,232,0.25)"}}>✓ Saved</span>}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6,marginBottom:10}}>
        {[["Visits",provRecord.resourceSummary?.visits??0],["Meds",provRecord.resourceSummary?.medications??0],["Allergies",provRecord.resourceSummary?.allergies??0],["Problems",provRecord.resourceSummary?.problems??0],["Labs",provRecord.resourceSummary?.labs??0]].map(([lbl,val])=>(
          <div key={lbl} style={{textAlign:"center",padding:"8px 4px",borderRadius:7,background:"rgba(0,0,0,0.25)",border:`1px solid ${T.border}`}}><div style={{fontFamily:FONTS.mono,fontSize:16,fontWeight:700,color:T.teal}}>{val}</div><div style={{fontSize:9,color:T.txt4,letterSpacing:"0.06em",textTransform:"uppercase",marginTop:2}}>{lbl}</div></div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
        <div style={{padding:"10px 12px",borderRadius:8,background:"rgba(0,0,0,0.25)",border:`1px solid ${T.border}`}}>
          <div style={{fontSize:9,fontWeight:700,color:T.txt4,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6}}>Identity Verification</div>
          {provRecord.identityMatchScore!=null?(<><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}><div style={{flex:1,height:5,background:"rgba(255,255,255,0.07)",borderRadius:3,overflow:"hidden"}}><div style={{width:`${provRecord.identityMatchScore}%`,height:"100%",background:provRecord.identityMatchScore>=92?T.teal:provRecord.identityMatchScore>=80?T.gold:T.warn,borderRadius:3}}/></div><span style={{fontFamily:FONTS.mono,fontSize:12,fontWeight:700,color:provRecord.identityMatchScore>=92?T.teal:provRecord.identityMatchScore>=80?T.gold:T.warn}}>{provRecord.identityMatchScore}%</span></div><div style={{fontSize:10,color:T.txt3}}>{provRecord.identityMatchLevel}</div>{provRecord.identityAttested&&<div style={{fontSize:10,color:T.gold,marginTop:4}}>! Attested: {ts(provRecord.attestedAt)}</div>}</>):<div style={{fontSize:11,color:T.txt4}}>N/A — Document paste mode</div>}
        </div>
        <div style={{padding:"10px 12px",borderRadius:8,background:"rgba(0,0,0,0.25)",border:`1px solid ${T.border}`}}>
          <div style={{fontSize:9,fontWeight:700,color:T.txt4,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6}}>Timing</div>
          <div style={{fontSize:11,color:T.txt3,lineHeight:1.7}}>
            <div>Initiated: <span style={{color:T.txt,fontFamily:FONTS.mono,fontSize:10}}>{ts(provRecord.queryInitiatedAt)}</span></div>
            {provRecord.recordsReceivedAt&&<div>Received: <span style={{color:T.txt,fontFamily:FONTS.mono,fontSize:10}}>{ts(provRecord.recordsReceivedAt)}</span></div>}
            {lat&&<div>Latency: <span style={{color:T.teal,fontFamily:FONTS.mono,fontSize:10,fontWeight:700}}>{lat}</span></div>}
            {provRecord.importedToEncounter&&<div style={{color:T.violet}}>Imported: {ts(provRecord.importedAt)}</div>}
          </div>
        </div>
      </div>
      <div style={{marginBottom:10}}><div style={{fontSize:9,fontWeight:700,color:T.txt4,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6}}>Audit Trail</div>
        {(provRecord.auditLog??[]).map((e,i)=>(
          <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"7px 10px",marginBottom:4,borderRadius:7,background:PROV_COLORS[e.event]??"rgba(255,255,255,0.03)",border:`1px solid rgba(255,255,255,0.05)`}}>
            <span style={{fontSize:14,flexShrink:0,marginTop:1,opacity:0.8}}>{PROV_ICONS[e.event]??"·"}</span>
            <div style={{flex:1}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}><span style={{fontSize:9,fontWeight:700,color:T.txt4,letterSpacing:"0.07em",textTransform:"uppercase"}}>{e.event.replace(/_/g," ")}</span><span style={{fontFamily:FONTS.mono,fontSize:9,color:T.txt4}}>{new Date(e.ts).toLocaleTimeString("en-US",{hour12:false})}</span></div><div style={{fontSize:11,color:T.txt2,lineHeight:1.5}}>{e.detail}</div></div>
          </div>
        ))}
      </div>
      {provRecord.resourceCount>0&&(
        <div style={{marginBottom:10}}><div onClick={()=>setShowItems(v=>!v)} style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",marginBottom:showItems?8:0}}><span style={{fontSize:9,fontWeight:700,color:T.txt4,letterSpacing:"0.08em",textTransform:"uppercase"}}>FHIR Resource IDs</span><span style={{fontSize:9,color:T.txt4}}>{showItems?"▲ Hide":"▼ Show"} ({provRecord.resourceCount} items)</span></div>
          {showItems&&(<div style={{background:"rgba(0,0,0,0.3)",borderRadius:8,padding:"8px 12px",border:`1px solid ${T.border}`,maxHeight:200,overflowY:"auto"}}>
            {Object.entries(provRecord.resources??{}).map(([domain,items])=>items.length>0&&items.map((item,i)=>(
              <div key={`${domain}-${i}`} style={{display:"flex",alignItems:"center",gap:8,padding:"3px 0",borderBottom:`1px solid rgba(255,255,255,0.03)`}}>
                <span style={{fontSize:9,fontWeight:700,color:T.txt4,width:80,flexShrink:0}}>{item.resourceType?.replace("MedicationRequest","Rx")?.replace("AllergyIntolerance","Allergy")?.replace("Observation","Lab")??domain}</span>
                <span style={{fontSize:11,color:T.txt,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name||"—"}</span>
                {item.fhirId&&<span style={{fontFamily:FONTS.mono,fontSize:9,color:T.txt4,flexShrink:0}}>{item.fhirId.slice(0,12)}{item.fhirId.length>12?"…":""}</span>}
              </div>
            )))}
          </div>)}
        </div>
      )}
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {[{text:genHIPAA(provRecord),key:"hipaa",label:"⎙ HIPAA Audit Report"},{text:genCOC(provRecord),key:"coc",label:"⎙ Chain of Custody (Note)"},{text:provRecord.queryId,key:"id",label:`# ${provRecord.queryId}`}].map(({text,key,label})=>(
          <div key={key} onClick={()=>copy(text,key)} style={{display:"inline-flex",alignItems:"center",gap:5,padding:"7px 13px",borderRadius:7,cursor:"pointer",fontSize:11,fontWeight:600,background:copied===key?`${T.teal}20`:"rgba(0,0,0,0.3)",color:copied===key?T.teal:T.txt3,border:`1px solid ${copied===key?T.borderHi:T.border}`,fontFamily:FONTS.body}}>{copied===key?"✓ Copied":label}</div>
        ))}
      </div>
      <div style={{marginTop:10,fontSize:9,color:T.txt4,lineHeight:1.7}}>Provenance records maintained per AMA/CMS E&M documentation standards and HIPAA audit trail requirements. Store for 7 years per HIPAA minimum retention. Generated by Lakonyx Anamnesis.</div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DOCUMENTS TAB
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const DOC_CAT_CFG = {
  summary:   { icon:"🏥", color:"#00d4a8", label:"Summary"   },
  ed:        { icon:"🚨", color:"#f06060", label:"ED Note"   },
  radiology: { icon:"🩻", color:"#4a9eff", label:"Radiology" },
  consult:   { icon:"👨‍⚕️", color:"#e8b84b", label:"Consult"   },
  hp:        { icon:"📋", color:"#9b7de8", label:"H&P"       },
  procedure: { icon:"⚕",  color:"#e8a838", label:"Procedure" },
  progress:  { icon:"📝", color:"#5e88b0", label:"Progress"  },
  other:     { icon:"📄", color:"#5e88b0", label:"Document"  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CLINICAL SNAPSHOT STRIP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function ClinicalSnapshotStrip({ data, ddiState, medNorm, onNavigate }) {
  if (!data) return null;
  const critDDI = (ddiState?.interactions??[]).filter(i=>i.severity==="critical").length;
  const majorDDI = (ddiState?.interactions??[]).filter(i=>i.severity==="major").length;
  const seen = new Map(); let dups = 0;
  (medNorm??[]).forEach(m=>{const k=m.ingredientRxcui?`rxcui:${m.ingredientRxcui}`:m.ingredientName?`ing:${m.ingredientName}`:`name:${m.cleanedName}`;if(seen.has(k))dups++;else seen.set(k,true);});
  const sevAllergy = (data.allergies??[]).some(a=>a.sev==="severe");
  const critLabs = (data.labs??[]).filter(l=>["HH","LL"].includes(l.flag)).length;
  const chips = [
    critDDI > 0 && { label:`${critDDI} Critical DDI`, color:T.coral, tab:"meds" },
    majorDDI > 0 && { label:`${majorDDI} Major DDI`, color:T.warn, tab:"meds" },
    dups > 0 && { label:`${dups} Duplicate Med`, color:T.gold, tab:"meds" },
    sevAllergy && { label:"Severe Allergy on File", color:T.coral, tab:"allergies" },
    critLabs > 0 && { label:`${critLabs} Critical Lab(s)`, color:T.coral, tab:"labs" },
  ].filter(Boolean);
  if (!chips.length) return null;
  return (
    <div style={{display:"flex",gap:6,flexWrap:"wrap",padding:"8px 16px",borderBottom:`1px solid ${T.border}`,background:"rgba(240,96,96,0.04)"}}>
      <span style={{fontSize:9,fontWeight:700,color:T.txt4,letterSpacing:"0.08em",textTransform:"uppercase",alignSelf:"center",flexShrink:0}}>Alerts</span>
      {chips.map((c,i)=>(
        <span key={i} onClick={()=>onNavigate?.(c.tab)} style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:20,background:`${c.color}18`,color:c.color,border:`1px solid ${c.color}40`,cursor:"pointer",letterSpacing:"0.04em"}}>{c.label}</span>
      ))}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SUMMARY TAB
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function SummaryTab({ data, ddiState, medNorm, sources, matchResult }) {
  if (!data) return null;
  const lastVisit = (data.visits??[]).slice().sort((a,b)=>(b.date??"").localeCompare(a.date??""))[0];
  const critMeds = (data.medications??[]).filter(m=>/(warfarin|insulin|heparin|lithium|digoxin|methotrexate|chemotherapy|immunosuppressant)/i.test(m.name));
  const critDDI = (ddiState?.interactions??[]).filter(i=>i.severity==="critical");
  const seen = new Map(); let dups = 0;
  (medNorm??[]).forEach(m=>{const k=m.ingredientRxcui?`rxcui:${m.ingredientRxcui}`:m.ingredientName?`ing:${m.ingredientName}`:`name:${m.cleanedName}`;if(seen.has(k))dups++;else seen.set(k,true);});
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      {/* Identity */}
      {matchResult && (
        <div style={{gridColumn:"1/-1",padding:"10px 14px",borderRadius:8,background:matchResult.level==="CONFIRMED"?`${T.teal}08`:`${T.gold}08`,border:`1px solid ${matchResult.level==="CONFIRMED"?T.borderHi:"rgba(232,184,75,0.25)"}`}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:11,fontWeight:700,color:matchResult.level==="CONFIRMED"?T.teal:T.gold}}>Identity: {matchResult.level}</span><span style={{fontFamily:FONTS.mono,fontSize:11,color:matchResult.level==="CONFIRMED"?T.teal:T.gold}}>{matchResult.score}%</span><span style={{fontSize:10,color:T.txt4,marginLeft:"auto"}}>Fellegi-Sunter probabilistic match · Lakonyx Anamnesis</span></div>
        </div>
      )}
      {/* Last visit */}
      <div style={{padding:"12px 14px",borderRadius:8,background:"rgba(0,0,0,0.25)",border:`1px solid ${T.border}`}}>
        <div style={{fontSize:9,fontWeight:700,color:T.txt4,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6}}>Last Encounter</div>
        {lastVisit ? <>
          <div style={{fontFamily:FONTS.mono,fontSize:12,color:T.txt,marginBottom:3}}>{lastVisit.date}</div>
          <div style={{fontSize:12,color:T.txt2,marginBottom:2}}>{lastVisit.cc}</div>
          {lastVisit.dx&&<div style={{fontSize:11,color:T.txt3}}>{lastVisit.dx}</div>}
          {lastVisit.dispo&&<Pill color={T.teal}>{lastVisit.dispo}</Pill>}
        </> : <div style={{fontSize:11,color:T.txt4}}>No prior visits on record</div>}
      </div>
      {/* High-risk meds */}
      <div style={{padding:"12px 14px",borderRadius:8,background:critMeds.length?"rgba(240,96,96,0.06)":"rgba(0,0,0,0.25)",border:`1px solid ${critMeds.length?"rgba(240,96,96,0.2)":T.border}`}}>
        <div style={{fontSize:9,fontWeight:700,color:T.txt4,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6}}>High-Risk Medications</div>
        {critMeds.length ? critMeds.map((m,i)=><div key={i} style={{fontSize:11,color:T.coral,marginBottom:2}}>⊘ {m.name} {m.dose&&<span style={{color:T.txt3}}>{m.dose}</span>}</div>) : <div style={{fontSize:11,color:T.teal}}>✓ None identified</div>}
      </div>
      {/* DDI summary */}
      <div style={{padding:"12px 14px",borderRadius:8,background:critDDI.length?"rgba(240,96,96,0.06)":"rgba(0,0,0,0.25)",border:`1px solid ${critDDI.length?"rgba(240,96,96,0.2)":T.border}`}}>
        <div style={{fontSize:9,fontWeight:700,color:T.txt4,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6}}>Drug Interactions</div>
        {!ddiState&&<div style={{fontSize:11,color:T.txt4}}>Checking…</div>}
        {ddiState?.status==="clean"&&<div style={{fontSize:11,color:T.teal}}>✓ No interactions detected</div>}
        {critDDI.length>0&&critDDI.slice(0,3).map((ix,i)=><div key={i} style={{fontSize:11,color:T.coral,marginBottom:2}}>⊘ {ix.drugA} + {ix.drugB}</div>)}
        {(ddiState?.interactions??[]).filter(i=>i.severity==="major").slice(0,2).map((ix,i)=><div key={i} style={{fontSize:11,color:T.warn,marginBottom:2}}>⚠ {ix.drugA} + {ix.drugB}</div>)}
      </div>
      {/* RxNorm */}
      <div style={{padding:"12px 14px",borderRadius:8,background:dups?"rgba(232,184,75,0.06)":"rgba(0,0,0,0.25)",border:`1px solid ${dups?"rgba(232,184,75,0.2)":T.border}`}}>
        <div style={{fontSize:9,fontWeight:700,color:T.txt4,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6}}>RxNorm / Duplicates</div>
        {!medNorm&&<div style={{fontSize:11,color:T.txt4}}>Normalizing…</div>}
        {medNorm&&dups===0&&<div style={{fontSize:11,color:T.teal}}>✓ No cross-system duplicates</div>}
        {dups>0&&<div style={{fontSize:11,color:T.gold}}>⬡ {dups} duplicate med{dups!==1?"s":""} detected by RxNorm</div>}
      </div>
      {/* Allergies */}
      <div style={{padding:"12px 14px",borderRadius:8,background:"rgba(0,0,0,0.25)",border:`1px solid ${T.border}`}}>
        <div style={{fontSize:9,fontWeight:700,color:T.txt4,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6}}>Allergies</div>
        {!(data.allergies?.length)&&<div style={{fontSize:11,color:T.txt4}}>NKDA on record</div>}
        {(data.allergies??[]).slice(0,4).map((a,i)=><div key={i} style={{fontSize:11,color:a.sev==="severe"?T.coral:T.txt2,marginBottom:2}}>{a.name}{a.rxn&&<span style={{color:T.txt4}}> — {a.rxn}</span>}</div>)}
        {(data.allergies??[]).length>4&&<div style={{fontSize:10,color:T.txt4}}>+{(data.allergies??[]).length-4} more</div>}
      </div>
      {/* Data sources */}
      <div style={{gridColumn:"1/-1",padding:"10px 14px",borderRadius:8,background:"rgba(0,0,0,0.2)",border:`1px solid ${T.border}`}}>
        <div style={{fontSize:9,fontWeight:700,color:T.txt4,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6}}>Data Sources</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{(sources??[]).map((s,i)=><Pill key={i} color={T.teal}>{s}</Pill>)}</div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LAB TREND LIST
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function LabTrendList({ data }) {
  if (!data?.length) return <div style={{textAlign:"center",padding:24,color:T.txt4,fontSize:12}}><div style={{fontSize:28,marginBottom:8,opacity:0.3}}>○</div>No recent labs found</div>;
  // Group by test name to show trends
  const grouped = {};
  data.forEach(l => {
    const key = l.name;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(l);
  });
  const flagColor = f => ["H","HH"].includes(f) ? T.coral : ["L","LL"].includes(f) ? T.blue : T.teal;
  const copy = data.map(l=>`${l.name}: ${l.val} (ref ${l.ref||"—"}) [${l.flag||"—"}] ${l.date||""}`).join("\n");
  return <>
    <SectionHeader title="Laboratory Results" count={data.length} copyText={copy}/>
    {Object.entries(grouped).map(([name, results]) => (
      <div key={name} style={{marginBottom:8,padding:"8px 10px",borderRadius:8,background:"rgba(0,0,0,0.2)",border:`1px solid ${T.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:results.length>1?6:0}}>
          <span style={{fontSize:12,color:T.txt,fontWeight:500,flex:1}}>{name}</span>
          {results.slice(0,1).map((l,i)=>(
            <span key={i} style={{fontFamily:FONTS.mono,fontSize:12,color:flagColor(l.flag),fontWeight:["H","L","HH","LL"].includes(l.flag)?700:400}}>{l.val}</span>
          ))}
          {results[0]?.ref&&<span style={{fontSize:10,color:T.txt4}}>ref {results[0].ref}</span>}
          {results[0]?.date&&<span style={{fontFamily:FONTS.mono,fontSize:10,color:T.txt3}}>{results[0].date}</span>}
        </div>
        {results.length > 1 && (
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:4}}>
            {results.slice(1).map((l,i)=>(
              <span key={i} style={{fontSize:10,color:flagColor(l.flag),fontFamily:FONTS.mono}}>{l.val} <span style={{color:T.txt4,fontSize:9}}>{l.date}</span></span>
            ))}
          </div>
        )}
      </div>
    ))}
  </>;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MED DELTA PANEL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function MedDeltaPanel({ medications=[], medNorm=[], visits=[] }) {
  if (!medications.length) return null;
  // Identify meds introduced in recent visits vs older ones
  const recentVisit = visits.slice().sort((a,b)=>(b.date??"").localeCompare(a.date??""))[0];
  const newMeds = medications.filter(m => m.src && recentVisit && m.src.includes(recentVisit.src??"__NONE__"));
  if (!newMeds.length) return null;
  return (
    <div style={{marginBottom:10,padding:"10px 12px",borderRadius:8,background:`${T.blue}08`,border:`1px solid rgba(74,158,255,0.2)`}}>
      <div style={{fontSize:9,fontWeight:700,color:T.blue,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6}}>Recent Medication Changes</div>
      {newMeds.map((m,i)=>(
        <div key={i} style={{fontSize:11,color:T.txt2,marginBottom:3}}>
          <span style={{color:T.blue}}>+</span> {m.name} {m.dose&&<span style={{color:T.txt3}}>{m.dose}</span>} {m.freq&&<span style={{color:T.txt4}}>{m.freq}</span>}
        </div>
      ))}
    </div>
  );
}

export function DocumentsTab({ documents=[], hgToken="", onParseCCDA=null }) {
  const [selId,  setSelId]  = useState(null);
  const [conts,  setConts]  = useState({});
  const [loading,setLoad]   = useState({});
  const [aiSum,  setAiSum]  = useState({});
  const [aiLoad, setAiLoad] = useState({});
  const [copied, setCopied] = useState(null);

  if (!documents?.length) return(
    <div style={{textAlign:"center",padding:32,color:T.txt4,fontSize:12}}>
      <div style={{fontSize:32,marginBottom:10,opacity:0.3}}>📄</div>
      <div>No DocumentReference resources in this FHIR bundle.</div>
      <div style={{marginTop:6,fontSize:11}}>Discharge summaries, ED notes, radiology reports, and consult notes appear here when returned by the FHIR network.</div>
    </div>
  );

  const loadContent=async(doc)=>{
    const id=doc.fhirId??doc.description;
    if(conts[id])return;
    setLoad(l=>({...l,[id]:true}));
    let result=null;
    if(doc.data)result=decodeBase64Doc(doc.data,doc.contentType);
    else if(doc.url)result=await fetchDocContent(doc.url,hgToken);
    else result={type:"error",content:"No content URL or inline data available."};
    if(result?.type==="xml")result={...result,textContent:extractCCDAText(result.content)};
    setConts(c=>({...c,[id]:result}));
    setLoad(l=>({...l,[id]:false}));
  };

  const aiInterpret=async(doc)=>{
    const id=doc.fhirId??doc.description;const cont=conts[id];if(!cont)return;
    const text=cont.textContent??cont.content??"";if(!text||text.length<20)return;
    setAiLoad(l=>({...l,[id]:true}));
    try{
      const r=await base44.integrations.Core.InvokeLLM({
        prompt:`You are a clinical record intelligence engine for an emergency physician. Analyze the following ${doc.typeLabel} and extract a structured clinical summary. Focus on: key diagnoses, significant findings, medications started/changed, follow-up instructions, critical abnormalities, and ED-relevant red flags. Return a concise bulleted summary (max 300 words). Use plain text.\n\nDOCUMENT:\n${text.slice(0,4000)}`,
        response_json_schema:{type:"object",properties:{summary:{type:"string"},keyFindings:{type:"array",items:{type:"string"}},redFlags:{type:"array",items:{type:"string"}}}},
      });
      setAiSum(s=>({...s,[id]:r?.summary??"No summary available."}));
    }catch(e){setAiSum(s=>({...s,[id]:"AI interpretation failed: "+e.message}));}
    setAiLoad(l=>({...l,[id]:false}));
  };

  const groups={"Priority Documents":documents.filter(d=>d.priority<=1),"Clinical Notes":documents.filter(d=>d.priority===2),"Additional":documents.filter(d=>d.priority>=3)};

  return(
    <div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
        {Object.entries(DOC_CAT_CFG).map(([cat,cfg])=>{const cnt=documents.filter(d=>d.category===cat).length;if(!cnt)return null;return<span key={cat} style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:10,fontWeight:600,padding:"3px 9px",borderRadius:20,background:`${cfg.color}15`,color:cfg.color,border:`1px solid ${cfg.color}30`,letterSpacing:"0.04em"}}>{cfg.icon} {cfg.label} <span style={{fontFamily:FONTS.mono}}>{cnt}</span></span>;})}
      </div>
      {Object.entries(groups).map(([grpLabel,docs])=>{
        if(!docs.length)return null;
        return(
          <div key={grpLabel} style={{marginBottom:14}}>
            <div style={{fontSize:9,fontWeight:700,color:T.txt4,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6,paddingBottom:4,borderBottom:`1px solid ${T.border}`}}>{grpLabel}</div>
            {docs.map((doc,idx)=>{
              const id=doc.fhirId??`${doc.typeLabel}-${idx}`;
              const cfg=DOC_CAT_CFG[doc.category]??DOC_CAT_CFG.other;
              const isOpen=selId===id;const cont=conts[id];const isLoad=loading[id];
              const displayText=cont?.textContent??cont?.content??null;
              const aiS=aiSum[id];const aiL=aiLoad[id];
              return(
                <div key={id} style={{marginBottom:8,borderRadius:8,overflow:"hidden",border:`1px solid ${isOpen?cfg.color+"40":T.border}`}}>
                  <div onClick={()=>{if(isOpen)setSelId(null);else{setSelId(id);loadContent(doc);}}} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",cursor:"pointer",background:isOpen?`${cfg.color}08`:"transparent"}}>
                    <span style={{fontSize:18,flexShrink:0}}>{cfg.icon}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                        <span style={{fontSize:12,fontWeight:600,color:T.txt}}>{doc.typeLabel}</span>
                        {doc.status==="superseded"&&<span style={{fontSize:9,color:T.txt4,padding:"1px 5px",borderRadius:4,border:`1px solid ${T.border}`}}>Superseded</span>}
                        {doc.isCCDA&&<span style={{fontSize:9,color:T.blue,padding:"1px 5px",borderRadius:4,background:"rgba(74,158,255,0.1)"}}>C-CDA</span>}
                        {doc.isPDF&&<span style={{fontSize:9,color:T.coral,padding:"1px 5px",borderRadius:4,background:"rgba(240,96,96,0.1)"}}>PDF</span>}
                      </div>
                      <div style={{fontSize:11,color:T.txt3,display:"flex",gap:8,flexWrap:"wrap"}}>
                        {doc.date&&<span>{doc.date}</span>}{doc.author&&<span>· {doc.author}</span>}{doc.src&&<span>· {doc.src}</span>}
                      </div>
                    </div>
                    <span style={{fontSize:11,color:cfg.color,flexShrink:0}}>{isOpen?"▲":"▼"}</span>
                  </div>
                  {isOpen&&(
                    <div style={{borderTop:`1px solid ${T.border}`,background:"rgba(0,0,0,0.25)"}}>
                      <div style={{display:"flex",gap:6,padding:"8px 12px",borderBottom:`1px solid rgba(255,255,255,0.05)`,flexWrap:"wrap"}}>
                        {isLoad&&<span style={{fontSize:11,color:T.txt4,display:"flex",alignItems:"center",gap:6}}><span style={{width:10,height:10,borderRadius:"50%",border:`1.5px solid ${T.teal}33`,borderTop:`1.5px solid ${T.teal}`,display:"inline-block",animation:"lkxSpin .85s linear infinite"}}/>Loading document...</span>}
                        {displayText&&!isLoad&&(
                          <>
                            <div onClick={()=>aiInterpret(doc)} style={{display:"inline-flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:6,cursor:"pointer",fontSize:10,fontWeight:600,background:aiL?"rgba(0,0,0,0.3)":`${T.teal}15`,color:aiL?T.txt4:T.teal,border:`1px solid ${aiL?T.border:T.borderHi}`,fontFamily:FONTS.body}}>{aiL?"⟳ Interpreting...":"✦ Interpret with Anamnesis"}</div>
                            {doc.isCCDA&&onParseCCDA&&<div onClick={()=>onParseCCDA(displayText)} style={{display:"inline-flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:6,cursor:"pointer",fontSize:10,fontWeight:600,background:"rgba(74,158,255,0.12)",color:T.blue,border:"1px solid rgba(74,158,255,0.25)",fontFamily:FONTS.body}}>⬡ Load as Anamnesis Record</div>}
                            <div onClick={()=>{navigator.clipboard.writeText(displayText).catch(()=>{});setCopied(id);setTimeout(()=>setCopied(null),1800);}} style={{display:"inline-flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:6,cursor:"pointer",fontSize:10,fontWeight:600,background:"rgba(0,0,0,0.3)",color:copied===id?T.teal:T.txt3,border:`1px solid ${copied===id?T.borderHi:T.border}`,fontFamily:FONTS.body}}>{copied===id?"✓ Copied":"Copy text"}</div>
                          </>
                        )}
                        {cont?.type==="pdf"&&<a href={cont.objectUrl} download={`${doc.typeLabel}.pdf`} style={{display:"inline-flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:6,fontSize:10,fontWeight:600,background:"rgba(240,96,96,0.12)",color:T.coral,border:"1px solid rgba(240,96,96,0.25)",textDecoration:"none",fontFamily:FONTS.body}}>↓ Download PDF</a>}
                        {cont?.type==="error"&&<span style={{fontSize:11,color:T.coral}}>⚠ {cont.content}</span>}
                        {!cont&&!isLoad&&!doc.url&&!doc.data&&<span style={{fontSize:11,color:T.txt4}}>No inline content or URL — metadata only.</span>}
                      </div>
                      {aiS&&<div style={{margin:"8px 12px",padding:"10px 12px",borderRadius:7,background:`${T.teal}08`,border:`1px solid ${T.borderHi}`}}><div style={{fontSize:9,fontWeight:700,color:T.teal,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6}}>Anamnesis AI Interpretation</div><div style={{fontSize:12,color:T.txt2,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{aiS}</div></div>}
                      {displayText&&!isLoad&&<div style={{margin:"0 12px 12px",borderRadius:7,overflow:"hidden",border:`1px solid rgba(255,255,255,0.06)`}}><textarea readOnly value={displayText} onFocus={e=>e.target.select()} style={{width:"100%",background:"rgba(0,0,0,0.4)",border:"none",padding:"12px",color:T.txt2,fontSize:11,fontFamily:FONTS.mono,lineHeight:1.7,resize:"vertical",outline:"none",minHeight:180,maxHeight:400,boxSizing:"border-box",display:"block"}}/></div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}