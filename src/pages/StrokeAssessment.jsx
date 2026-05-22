// StrokeHub.jsx — Lakonyx Stroke Protocol Hub
// Left-rail nav · keyboard-first · no router · no localStorage · no form/alert · straight quotes

import { useState, useCallback, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import QuickOrderPanel, { useQuickOrder, QuickOrderButton } from './QuickOrderPanel';
import NotryaHubHeader from "@/components/HubHeader/NotryaHubHeader";
import NotryaPatientBar from "@/components/HubHeader/NotryaPatientBar";
import { PulseNavBadge } from "@/components/PulseActivators";
const StrokeQualityLog = base44.entities.StrokeQualityLog;

const PRINT_CSS = `@media print { body { background: #fff !important; } .sh-no-print { display: none !important; } }`;

const C = {
  bg:"rgba(8,14,36,1)", bgPanel:"rgba(12,20,44,1)", bgCard:"rgba(255,255,255,0.03)",
  border:"rgba(255,255,255,0.07)", teal:"#2dd4bf", teal2:"#14b8a6",
  slate:"#94a3b8", dim:"#64748b", dimmer:"#475569", text:"#e8edf5", textSub:"#94a3b8",
};

const S = {
  card:{ background:C.bgCard, border:"1px solid "+C.border, borderRadius:10, padding:"16px 18px", marginBottom:12 },
  cardTitle:{ color:C.dim, fontSize:11, fontWeight:700, letterSpacing:"0.9px", textTransform:"uppercase", marginBottom:10 },
  focusRow:(focused)=>({ display:"flex", alignItems:"flex-start", gap:10, padding:"8px 10px",
    borderRadius:7, cursor:"pointer", transition:"background .1s",
    background:focused?"rgba(20,184,166,0.1)":"transparent",
    border:focused?"1px solid rgba(20,184,166,0.28)":"1px solid transparent", marginBottom:2 }),
  checkbox:(checked,color)=>{const c=color||C.teal;return{width:17,height:17,borderRadius:4,flexShrink:0,marginTop:2,
    background:checked?c+"28":"rgba(255,255,255,0.05)",border:"2px solid "+(checked?c:"rgba(255,255,255,0.14)"),
    display:"flex",alignItems:"center",justifyContent:"center"};},
  input:{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)",
    borderRadius:7, color:C.text, fontSize:14, padding:"8px 11px", outline:"none", fontFamily:"'JetBrains Mono',monospace" },
  kbd:{ background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)",
    borderRadius:4, color:C.slate, fontFamily:"'JetBrains Mono',monospace", fontSize:10, padding:"2px 6px" },
};

function KbHints({hints}){
  return(<div style={{display:"flex",gap:14,flexWrap:"wrap",padding:"10px 0 2px",
    borderTop:"1px solid rgba(255,255,255,0.05)",marginTop:14}}>
    {hints.map(({key,label})=>(
      <span key={key} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#4b5563"}}>
        <kbd style={S.kbd}>{key}</kbd>{label}
      </span>
    ))}
  </div>);
}

// ─── NIHSS ────────────────────────────────────────────────────────────────────
const NIHSS_ITEMS=[
  {id:"1a",label:"1a. Level of Consciousness",max:3,opts:["Alert","Not alert, arousable","Not alert, obtunded","Unresponsive / coma"]},
  {id:"1b",label:"1b. LOC Questions (month / age)",max:2,opts:["Both correct","One correct","Neither correct"]},
  {id:"1c",label:"1c. LOC Commands (eyes / grip)",max:2,opts:["Both correct","One correct","Neither correct"]},
  {id:"2", label:"2. Best Gaze",max:2,opts:["Normal","Partial gaze palsy","Forced deviation"]},
  {id:"3", label:"3. Visual Fields",max:3,opts:["No visual loss","Partial hemianopia","Complete hemianopia","Bilateral / cortical blindness"]},
  {id:"4", label:"4. Facial Palsy",max:3,opts:["Normal","Minor paralysis","Partial paralysis","Complete paralysis"]},
  {id:"5a",label:"5a. Motor Arm — Left",max:4,opts:["No drift","Drift down","Some effort vs gravity","No effort vs gravity","No movement"],un:true},
  {id:"5b",label:"5b. Motor Arm — Right",max:4,opts:["No drift","Drift down","Some effort vs gravity","No effort vs gravity","No movement"],un:true},
  {id:"6a",label:"6a. Motor Leg — Left",max:4,opts:["No drift","Drift down","Some effort vs gravity","No effort vs gravity","No movement"],un:true},
  {id:"6b",label:"6b. Motor Leg — Right",max:4,opts:["No drift","Drift down","Some effort vs gravity","No effort vs gravity","No movement"],un:true},
  {id:"7", label:"7. Limb Ataxia",max:2,opts:["Absent","Present in 1 limb","Present in 2 limbs"],un:true},
  {id:"8", label:"8. Sensory",max:2,opts:["Normal","Mild-moderate loss","Severe / total loss"]},
  {id:"9", label:"9. Best Language",max:3,opts:["No aphasia","Mild-moderate aphasia","Severe aphasia","Mute / global aphasia"]},
  {id:"10",label:"10. Dysarthria",max:2,opts:["Normal","Mild-moderate slurring","Severe / unintelligible"],un:true},
  {id:"11",label:"11. Extinction / Inattention",max:2,opts:["Normal","Inattention to 1 modality","Profound hemi-inattention"]},
];
const nihssSev=(n)=>{
  if(n===0) return{label:"No Stroke",color:"#4ade80"};
  if(n<=4)  return{label:"Minor",color:"#86efac"};
  if(n<=15) return{label:"Moderate",color:"#fbbf24"};
  if(n<=20) return{label:"Mod-Severe",color:"#fb923c"};
  return         {label:"Severe",color:"#f87171"};
};

function NIHSSTab({nihss,setNihss}){
  const[focusIdx,setFocusIdx]=useState(0);
  const panelRef=useRef(null);
  useEffect(()=>{panelRef.current?.focus();},[]);

  const score=NIHSS_ITEMS.reduce((s,it)=>{const v=nihss[it.id];return(!v||v==="UN")?s:s+parseInt(v,10);},0);
  const sev=nihssSev(score);
  const scoredCount=NIHSS_ITEMS.filter(it=>nihss[it.id]!==undefined).length;

  const record=useCallback((id,val)=>{
    setNihss(prev=>({...prev,[id]:val}));
    setFocusIdx(i=>Math.min(i+1,NIHSS_ITEMS.length-1));
  },[setNihss]);

  const handleKey=useCallback((e)=>{
    const item=NIHSS_ITEMS[focusIdx]; if(!item) return;
    if(e.key==="ArrowDown"){e.preventDefault();setFocusIdx(i=>Math.min(i+1,NIHSS_ITEMS.length-1));return;}
    if(e.key==="ArrowUp")  {e.preventDefault();setFocusIdx(i=>Math.max(i-1,0));return;}
    if(e.key==="Backspace"){setNihss(p=>{const n={...p};delete n[item.id];return n;});return;}
    if((e.key==="u"||e.key==="U")&&item.un){record(item.id,"UN");return;}
    const n=parseInt(e.key,10);
    if(!isNaN(n)&&n>=0&&n<=item.max){e.preventDefault();record(item.id,String(n));}
  },[focusIdx,record,setNihss]);

  return(
    <div>
      {/* Score header */}
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:14}}>
        <div style={{background:sev.color+"14",border:"1px solid "+sev.color+"38",
          borderRadius:9,padding:"9px 16px",textAlign:"center",minWidth:76}}>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:26,fontWeight:700,color:sev.color,lineHeight:1}}>{score}</div>
          <div style={{color:sev.color,fontSize:10,fontWeight:700,marginTop:3,letterSpacing:"0.3px"}}>{sev.label}</div>
        </div>
        {/* Progress dots */}
        <div style={{flex:1}}>
          <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:6}}>
            {NIHSS_ITEMS.map((item,i)=>{
              const val=nihss[item.id];
              const bg=val===undefined?"rgba(255,255,255,0.08)":val==="UN"?"#fbbf2440":C.teal+"50";
              const br=val===undefined?"rgba(255,255,255,0.12)":val==="UN"?"#fbbf24":C.teal;
              return(<div key={item.id} onClick={()=>setFocusIdx(i)} title={item.label} style={{
                width:14,height:14,borderRadius:3,background:bg,border:"1.5px solid "+br,
                cursor:"pointer",transition:"all .1s",
                outline:i===focusIdx?"2px solid "+C.teal:"none",outlineOffset:1,
              }}/>);
            })}
          </div>
          <div style={{color:C.dim,fontSize:11}}>{scoredCount} of {NIHSS_ITEMS.length} scored</div>
        </div>
        <button style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.09)",
          borderRadius:6,color:C.dim,cursor:"pointer",fontSize:12,padding:"5px 12px"}}
          onClick={()=>setNihss({})}>Reset</button>
      </div>

      <div ref={panelRef} tabIndex={0} onKeyDown={handleKey} style={{outline:"none"}}>
        {NIHSS_ITEMS.map((item,idx)=>{
          const val=nihss[item.id]; const focused=idx===focusIdx;
          return(
            <div key={item.id} onClick={()=>setFocusIdx(idx)} style={S.focusRow(focused)}>
              <div style={{flex:1}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:13,color:focused?"#e2e8f0":C.textSub,fontWeight:focused?600:400}}>{item.label}</span>
                  {val!==undefined&&(
                    <span style={{background:val==="UN"?"rgba(251,191,36,0.18)":"rgba(20,184,166,0.18)",
                      border:"1px solid "+(val==="UN"?"rgba(251,191,36,0.4)":"rgba(20,184,166,0.38)"),
                      borderRadius:5,color:val==="UN"?"#fbbf24":C.teal,
                      fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:700,padding:"2px 9px"}}>
                      {val} {val!=="UN"?"— "+item.opts[parseInt(val,10)]:"UN"}
                    </span>
                  )}
                </div>
                {focused&&(
                  <div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:8}}>
                    {item.opts.map((opt,oi)=>(
                      <button key={oi} onClick={(e)=>{e.stopPropagation();record(item.id,String(oi));}}
                        style={{background:val===String(oi)?"rgba(20,184,166,0.18)":"rgba(255,255,255,0.04)",
                          border:"1px solid "+(val===String(oi)?"rgba(20,184,166,0.45)":"rgba(255,255,255,0.09)"),
                          borderRadius:5,color:val===String(oi)?C.teal:C.textSub,cursor:"pointer",fontSize:12,padding:"4px 10px"}}>
                        <span style={{fontFamily:"'JetBrains Mono',monospace",color:C.dim,marginRight:5}}>{oi}</span>{opt}
                      </button>
                    ))}
                    {item.un&&(
                      <button onClick={(e)=>{e.stopPropagation();record(item.id,"UN");}}
                        style={{background:val==="UN"?"rgba(251,191,36,0.18)":"rgba(255,255,255,0.04)",
                          border:"1px solid "+(val==="UN"?"rgba(251,191,36,0.4)":"rgba(255,255,255,0.09)"),
                          borderRadius:5,color:val==="UN"?"#fbbf24":C.dim,cursor:"pointer",fontSize:12,padding:"4px 10px"}}>
                        <span style={{fontFamily:"'JetBrains Mono',monospace",marginRight:5}}>U</span>Untestable
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <KbHints hints={[{key:"↑ ↓",label:"navigate"},{key:"0–4",label:"score"},{key:"U",label:"untestable"},{key:"⌫",label:"clear"}]}/>
    </div>
  );
}

// ─── WORKUP ───────────────────────────────────────────────────────────────────
const WORKUP_WINDOWS=[
  {label:"0 – 10 min",color:"#f87171",tasks:["Stroke code activated","IV access — 2 large bore","12-lead ECG obtained","Fingerstick glucose","Vitals: BP both arms, SpO2, HR, temp","NIHSS initiated","CT head ordered (non-contrast)"]},
  {label:"0 – 25 min",color:"#fb923c",tasks:["CT head completed and read","Labs: CBC, BMP, PT/INR, PTT, type & screen","Troponin + BNP sent","NPO status confirmed","Last known well time documented","Pregnancy test if applicable"]},
  {label:"25 – 60 min",color:"#fbbf24",tasks:["CTA head/neck or CT perfusion","Neurology at bedside","tPA eligibility complete","Informed consent obtained","Family contacted","Foley placed if tPA planned"]},
  {label:"60 – 120 min",color:"#4ade80",tasks:["MRI brain (if CT non-diagnostic)","Telemetry established","BP goal documented","Neurosurgery / IR notified if LVO","ICU / stroke unit bed requested","tPA given or decision documented"]},
];
const WORKUP_FLAT=WORKUP_WINDOWS.flatMap((w,wi)=>w.tasks.map((task,ti)=>({key:wi+"-"+ti,task,wi,color:w.color})));

function WorkupTab({checked,setChecked}){
  const[focusIdx,setFocusIdx]=useState(0);
  const[times,setTimes]=useState({});
  const panelRef=useRef(null);
  useEffect(()=>{panelRef.current?.focus();},[]);

  const toggle=useCallback((key)=>{
    const now=new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
    setChecked(prev=>{
      if(prev[key]){const n={...prev};delete n[key];return n;}
      setTimes(t=>({...t,[key]:now}));
      return{...prev,[key]:true};
    });
  },[setChecked]);

  const handleKey=useCallback((e)=>{
    if(e.key==="ArrowDown"){e.preventDefault();setFocusIdx(i=>Math.min(i+1,WORKUP_FLAT.length-1));return;}
    if(e.key==="ArrowUp")  {e.preventDefault();setFocusIdx(i=>Math.max(i-1,0));return;}
    if(e.key===" "||e.key==="Enter"){
      e.preventDefault();const item=WORKUP_FLAT[focusIdx];
      if(item){toggle(item.key);setFocusIdx(i=>Math.min(i+1,WORKUP_FLAT.length-1));}
    }
    if(e.key==="Backspace"){const item=WORKUP_FLAT[focusIdx];if(item)setChecked(p=>{const n={...p};delete n[item.key];return n;});}
  },[focusIdx,toggle,setChecked]);

  const done=Object.keys(checked).length;
  const total=WORKUP_FLAT.length;
  let flatIdx=0;

  return(
    <div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:18,fontWeight:700,color:C.teal}}>{done}</span>
        <span style={{color:C.dim,fontSize:12}}>/ {total} tasks</span>
        <div style={{flex:1,background:"rgba(255,255,255,0.06)",borderRadius:4,height:5,overflow:"hidden"}}>
          <div style={{width:(done/total*100)+"%",height:"100%",background:"linear-gradient(90deg,"+C.teal+",#38bdf8)",transition:"width .3s"}}/>
        </div>
        <button style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.09)",
          borderRadius:6,color:C.dim,cursor:"pointer",fontSize:12,padding:"4px 11px"}}
          onClick={()=>{setChecked({});setTimes({});}}>Reset</button>
      </div>

      <div ref={panelRef} tabIndex={0} onKeyDown={handleKey} style={{outline:"none"}}>
        {WORKUP_WINDOWS.map((win,wi)=>{
          const winTasks=WORKUP_FLAT.filter(f=>f.wi===wi);
          const winDone=winTasks.filter(f=>checked[f.key]).length;
          const startIdx=flatIdx; flatIdx+=winTasks.length;
          return(
            <div key={wi} style={{marginBottom:10,borderRadius:"0 10px 10px 0",overflow:"hidden",
              background:"rgba(255,255,255,0.025)",
              border:"1px solid rgba(255,255,255,0.06)",borderLeft:"4px solid "+win.color}}>
              <div style={{background:win.color+"0f",padding:"8px 14px",
                display:"flex",alignItems:"center",justifyContent:"space-between",
                borderBottom:"1px solid "+win.color+"20"}}>
                <span style={{color:win.color,fontWeight:700,fontSize:12,letterSpacing:"0.3px"}}>{win.label}</span>
                <span style={{fontFamily:"'JetBrains Mono',monospace",color:win.color,fontSize:11,opacity:0.8}}>{winDone}/{winTasks.length}</span>
              </div>
              <div style={{padding:"6px 8px"}}>
                {winTasks.map((item,ti)=>{
                  const idx=startIdx+ti; const focused=idx===focusIdx; const isDone=!!checked[item.key];
                  return(
                    <div key={item.key} onClick={()=>{setFocusIdx(idx);toggle(item.key);}} style={S.focusRow(focused)}>
                      <div style={S.checkbox(isDone,win.color)}>
                        {isDone&&<span style={{color:win.color,fontSize:10,lineHeight:1}}>✓</span>}
                      </div>
                      <span style={{fontSize:13,color:isDone?C.dim:C.textSub,flex:1,textDecoration:isDone?"line-through":"none"}}>{item.task}</span>
                      {isDone&&times[item.key]&&(
                        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"#374151"}}>{times[item.key]}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <KbHints hints={[{key:"↑ ↓",label:"navigate"},{key:"Space / Enter",label:"check + advance"},{key:"⌫",label:"uncheck"}]}/>
    </div>
  );
}

// ─── TREATMENT ────────────────────────────────────────────────────────────────
const INCL_ITEMS=[
  "Ischemic stroke with measurable deficit (NIHSS >= 4 or significant deficit)",
  "CT head shows no hemorrhage",
  "Symptom onset < 3h (or < 4.5h if extended criteria met)",
  "Age >= 18 years",
  "Consent obtained from patient or surrogate",
];
const EXCL_ABS=[
  "Intracranial hemorrhage on CT","BP > 185/110 after treatment (unable to stabilize)",
  "Active internal bleeding (not menses)","Platelets < 100,000 / mm3",
  "INR > 1.7 or PT > 15 sec","Glucose < 50 or > 400 (uncorrected)",
  "Intracranial / spinal surgery < 3 months","Head trauma or prior stroke < 3 months",
  "History of intracranial hemorrhage","Intracranial neoplasm, AVM, or aneurysm",
  "IV / SC heparin within 48h with elevated aPTT","Direct thrombin or Xa inhibitor within 48h",
];
const EXCL_REL=[
  "Minor / rapidly improving symptoms","Seizure at onset with postictal deficits",
  "Major surgery or trauma < 14 days","GI or urinary hemorrhage < 21 days",
  "Arterial puncture non-compressible site < 7 days","Age > 80 (3-4.5h window only)",
  "NIHSS > 25 (3-4.5h window only)","Diabetes + prior stroke (3-4.5h only)",
  "Antiplatelet use — weigh risk/benefit",
];
const TX_FLAT=[...INCL_ITEMS.map((text,i)=>({section:"incl",idx:i,text})),...EXCL_ABS.map((text,i)=>({section:"abs",idx:i,text})),...EXCL_REL.map((text,i)=>({section:"rel",idx:i,text}))];
const SEC_META={incl:{label:"Inclusion — all must be met",color:"#4ade80"},abs:{label:"Absolute Exclusions — none present",color:"#f87171"},rel:{label:"Relative Exclusions — 3-4.5h window",color:"#fbbf24"}};
const BP_TABLE=[
  {condition:"Pre-tPA — BP > 185/110",target:"Labetalol 10-20 mg IV x1-2 or Nicardipine 5 mg/hr",goal:"< 185/110",qopSeed:{medication:"Labetalol",dose:"10-20mg IV x1-2",route:"IV",frequency:"PRN",indication:"Pre-tPA BP control — target < 185/110"}},
  {condition:"Post-tPA (first 24h)",target:"Labetalol or Nicardipine per protocol",goal:"< 180/105",qopSeed:{medication:"Nicardipine",dose:"5 mg/hr",route:"IV infusion",frequency:"titrate",indication:"Post-tPA BP control — target < 180/105"}},
  {condition:"Ischemic — no tPA",target:"Permissive — treat only if > 220/120",goal:"< 220/120",qopSeed:{medication:"Labetalol",dose:"10-20mg IV",route:"IV",frequency:"PRN",indication:"Ischemic stroke BP — treat only if >220/120"}},
  {condition:"Hemorrhagic transform",target:"Aggressive reduction",goal:"SBP < 140",qopSeed:{medication:"Nicardipine",dose:"5 mg/hr",route:"IV infusion",frequency:"titrate to SBP <140",indication:"Hemorrhagic transformation"}},
  {condition:"Pre-thrombectomy",target:"Maintain, avoid hypotension",goal:"SBP >= 140",qopSeed:null},
];

function TreatmentTab({demo,vitals,nihss,txChecked,setTxChecked,weight,setWeight,onOpenOrder}){
  const[focusIdx,setFocusIdx]=useState(0);
  const[inputActive,setInputActive]=useState(false);
  const checked=txChecked;const setChecked=setTxChecked;
  const panelRef=useRef(null);const weightRef=useRef(null);
  useEffect(()=>{panelRef.current?.focus();},[]);

  const toggle=useCallback((section,idx)=>{setChecked(p=>({...p,[section+"-"+idx]:!p[section+"-"+idx]}));},[]); 
  const handleKey=useCallback((e)=>{
    if(inputActive){if(e.key==="Escape"){setInputActive(false);panelRef.current?.focus();}return;}
    if(e.key==="ArrowDown"){e.preventDefault();setFocusIdx(i=>Math.min(i+1,TX_FLAT.length-1));return;}
    if(e.key==="ArrowUp")  {e.preventDefault();setFocusIdx(i=>Math.max(i-1,0));return;}
    if(e.key===" "||e.key==="Enter"){e.preventDefault();const row=TX_FLAT[focusIdx];if(row){toggle(row.section,row.idx);setFocusIdx(i=>Math.min(i+1,TX_FLAT.length-1));}}
    if(e.key==="w"||e.key==="W"){e.preventDefault();setInputActive(true);weightRef.current?.focus();}
  },[focusIdx,toggle,inputActive]);

  const nihssScore=NIHSS_ITEMS.reduce((s,it)=>{const v=nihss?.[it.id];return(!v||v==="UN")?s:s+parseInt(v,10);},0);
  const inclMet=INCL_ITEMS.every((_,i)=>checked["incl-"+i]);
  const exclAbsMet=EXCL_ABS.some((_,i)=>checked["abs-"+i]);
  const exclRelMet=EXCL_REL.some((_,i)=>checked["rel-"+i]);
  const elig=!inclMet?"incomplete":exclAbsMet?"contraindicated":exclRelMet?"relative":"eligible";
  const eligColor={incomplete:C.slate,contraindicated:"#f87171",relative:"#fbbf24",eligible:"#4ade80"}[elig];
  const eligLabel={incomplete:"Checklist Incomplete",contraindicated:"Contraindicated",relative:"Relative Contraindication",eligible:"tPA Eligible"}[elig];
  const wt=parseFloat(weight)||0;
  const altepTotal=wt?Math.min(parseFloat((wt*0.9).toFixed(1)),90):null;
  const altepBolus=altepTotal?parseFloat((altepTotal*0.1).toFixed(1)):null;
  const altepInfuse=(altepTotal&&altepBolus)?parseFloat((altepTotal-altepBolus).toFixed(1)):null;
  let lastSection=null;

  return(
    <div>
      <div style={{background:eligColor+"10",border:"1px solid "+eligColor+"32",borderRadius:10,
        padding:"12px 16px",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:eligColor}}>{eligLabel}</div>
          <div style={{color:C.dim,fontSize:12,marginTop:2}}>NIHSS {nihssScore} · {demo?.age?"Age "+demo.age:"—"} · BP {(vitals&&vitals.bp)||"—"}</div>
        </div>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:28,color:eligColor}}>
          {elig==="eligible"?"✓":elig==="contraindicated"?"✗":"?"}
        </div>
      </div>

      <div ref={panelRef} tabIndex={0} onKeyDown={handleKey}
        style={{outline:"none",background:"rgba(255,255,255,0.02)",borderRadius:10,
          border:"1px solid rgba(255,255,255,0.06)",padding:"12px 14px",marginBottom:12}}>
        {TX_FLAT.map((row,idx)=>{
          const focused=idx===focusIdx;const key=row.section+"-"+row.idx;const done=!!checked[key];
          const isNew=row.section!==lastSection;lastSection=row.section;
          const sec=SEC_META[row.section];const ckColor=row.section==="incl"?"#4ade80":row.section==="abs"?"#f87171":"#fbbf24";
          return(
            <div key={key}>
              {isNew&&(<div style={{color:sec.color,fontSize:10,fontWeight:700,letterSpacing:"0.8px",textTransform:"uppercase",
                padding:"12px 0 5px",borderTop:row.section==="incl"?"none":"1px solid rgba(255,255,255,0.05)"}}>{sec.label}</div>)}
              <div onClick={()=>{setFocusIdx(idx);toggle(row.section,row.idx);}} style={S.focusRow(focused)}>
                <div style={S.checkbox(done,ckColor)}>{done&&<span style={{color:ckColor,fontSize:9,lineHeight:1}}>{row.section==="incl"?"✓":"!"}</span>}</div>
                <span style={{fontSize:13,color:done?C.dimmer:C.textSub}}>{row.text}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={S.card}>
        <div style={{...S.cardTitle,color:C.teal}}>Alteplase Dose · 0.9 mg/kg, max 90 mg</div>
        <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
          <div>
            <div style={{color:C.dim,fontSize:11,marginBottom:4}}>WEIGHT (kg) · press W</div>
            <input ref={weightRef} style={{...S.input,width:104}} value={weight}
              onChange={e=>setWeight(e.target.value)}
              onFocus={()=>setInputActive(true)}
              onBlur={()=>{setInputActive(false);setTimeout(()=>panelRef.current?.focus(),50);}}
              placeholder="70"/>
          </div>
          {altepTotal&&(<>
            {[{label:"TOTAL",val:altepTotal+" mg",color:C.teal},{label:"BOLUS · 10%/1m",val:altepBolus+" mg",color:"#fbbf24"},{label:"INF · 90%/60m",val:altepInfuse+" mg",color:"#38bdf8"}].map(({label,val,color})=>(
              <div key={label} style={{background:color+"0e",border:"1px solid "+color+"28",borderRadius:8,padding:"7px 13px"}}>
                <div style={{color:C.dim,fontSize:10}}>{label}</div>
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:17,color,fontWeight:700}}>{val}</div>
              </div>
            ))}
          </>)}
        </div>
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>BP Management</div>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead><tr>{["Scenario","Agent","Target"].map(h=>(<th key={h} style={{color:C.dim,fontWeight:600,padding:"5px 10px",borderBottom:"1px solid rgba(255,255,255,0.07)",textAlign:"left"}}>{h}</th>))}</tr></thead>
          <tbody>{BP_TABLE.map((r,i)=>(<tr key={i}>
            <td style={{padding:"7px 10px",color:C.textSub,borderBottom:"1px solid rgba(255,255,255,0.04)"}}>{r.condition}</td>
            <td style={{padding:"7px 10px",color:"#e2e8f0",fontFamily:"'JetBrains Mono',monospace",fontSize:11,borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span>{r.target}</span>
                {r.qopSeed && onOpenOrder && <QuickOrderButton seed={r.qopSeed} onOpen={onOpenOrder} size='sm' />}
              </div>
            </td>
            <td style={{padding:"7px 10px",color:"#fbbf24",fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:700,borderBottom:"1px solid rgba(255,255,255,0.04)"}}>{r.goal}</td>
          </tr>))}</tbody>
        </table>
      </div>

      <KbHints hints={[{key:"↑ ↓",label:"navigate"},{key:"Space / Enter",label:"toggle"},{key:"W",label:"weight"},{key:"Esc",label:"back to list"}]}/>
    </div>
  );
}

// ─── NEURO CONSULT ────────────────────────────────────────────────────────────
const CONSULT_ITEMS=[
  "Stroke history and LKW documented","NIHSS scored and recorded","CT head reviewed",
  "CTA / CTP reviewed — LVO excluded or identified","tPA eligibility determination documented",
  "tPA administered or exclusion reason charted","BP management orders placed",
  "Antiplatelet / anticoagulation plan reviewed","Statin initiated (ischemic stroke)",
  "Swallowing screen ordered","PT / OT / Speech consults placed","Echocardiogram ordered",
  "Telemetry for AF detection","Carotid imaging ordered or scheduled","Stroke unit / ICU bed confirmed",
];

function NeuroConsultTab({demo,vitals,nihss,consultChecked,setConsultChecked,times,setTimes,notes,setNotes,workupChecked,txChecked}){
  const[focusIdx,setFocusIdx]=useState(0);
  const[inputActive,setInputActive]=useState(false);
  const[saveState,setSaveState]=useState("idle");
  const checked=consultChecked;const setChecked=setConsultChecked;
  const panelRef=useRef(null);const timeArrivalRef=useRef(null);const notesRef=useRef(null);
  useEffect(()=>{panelRef.current?.focus();},[]);

  const handleKey=useCallback((e)=>{
    if(inputActive){if(e.key==="Escape"){setInputActive(false);panelRef.current?.focus();}return;}
    if(e.key==="ArrowDown"){e.preventDefault();setFocusIdx(i=>Math.min(i+1,CONSULT_ITEMS.length-1));return;}
    if(e.key==="ArrowUp")  {e.preventDefault();setFocusIdx(i=>Math.max(i-1,0));return;}
    if(e.key===" "||e.key==="Enter"){e.preventDefault();setChecked(p=>({...p,[focusIdx]:!p[focusIdx]}));setFocusIdx(i=>Math.min(i+1,CONSULT_ITEMS.length-1));}
    if(e.key==="Backspace"){setChecked(p=>({...p,[focusIdx]:false}));}
    if(e.key==="t"||e.key==="T"){e.preventDefault();setInputActive(true);timeArrivalRef.current?.focus();}
    if(e.key==="n"||e.key==="N"){e.preventDefault();setInputActive(true);notesRef.current?.focus();}
  },[focusIdx,inputActive]);

  const nihssScore=NIHSS_ITEMS.reduce((s,it)=>{const v=nihss?.[it.id];return(!v||v==="UN")?s:s+parseInt(v,10);},0);
  const sev=nihssSev(nihssScore);
  const nihssItemsScored=NIHSS_ITEMS.filter(it=>nihss?.[it.id]!==undefined).length;
  const dtn=(()=>{
    if(!times.arrival||!times.tpa)return null;
    const p=(t)=>{const[h,m]=t.split(":").map(Number);return h*60+m;};
    const d=p(times.tpa)-p(times.arrival);return d>=0?d:d+1440;
  })();
  const done=Object.values(checked).filter(Boolean).length;
  const tpaEligibility=(()=>{
    if(!txChecked)return"incomplete";
    const inclMet=Array.from({length:5},(_,i)=>txChecked["incl-"+i]).every(Boolean);
    const exclAbsMet=Array.from({length:12},(_,i)=>txChecked["abs-"+i]).some(Boolean);
    const exclRelMet=Array.from({length:9},(_,i)=>txChecked["rel-"+i]).some(Boolean);
    if(!inclMet)return"incomplete";if(exclAbsMet)return"contraindicated";if(exclRelMet)return"relative";
    return"eligible";
  })();
  const workupDone=workupChecked?Object.keys(workupChecked).length:0;
  const workupTotal=25;

  const saveRecord=useCallback(async()=>{
    setSaveState("saving");
    try{
      const record={
        encounter_date:new Date().toISOString().split("T")[0],
        nihss_score:nihssScore>0?nihssScore:undefined,nihss_severity:nihssScore>0?sev.label:undefined,
        nihss_items_scored:nihssItemsScored>0?nihssItemsScored:undefined,
        tpa_given:!!times.tpa,tpa_time:times.tpa||undefined,tpa_eligible:tpaEligibility,
        arrival_time:times.arrival||undefined,consult_time:times.consult||undefined,neurology_consulted:!!times.consult,
        dtn_minutes:dtn!==null?dtn:undefined,dtn_goal_met:dtn!==null?dtn<=60:undefined,
        workup_tasks_completed:workupDone,workup_tasks_total:workupTotal,
        consult_items_completed:done,provider_notes:notes||undefined,
      };
      const clean=Object.fromEntries(Object.entries(record).filter(([,v])=>v!==undefined));
      await StrokeQualityLog.create(clean);
      setSaveState("saved");setTimeout(()=>setSaveState("idle"),4000);
    }catch{setSaveState("error");setTimeout(()=>setSaveState("idle"),4000);}
  },[nihssScore,sev,nihssItemsScored,times,tpaEligibility,dtn,workupDone,done,notes]);

  const summary=[
    demo?.age?(demo.age+(demo.sex?" "+demo.sex:"")+" with acute stroke."):null,
    nihssScore>0?("NIHSS "+nihssScore+" — "+sev.label+"."):null,
    times.arrival?("Arrival: "+times.arrival+"."):null,
    times.consult?("Neurology called: "+times.consult+"."):null,
    times.tpa?("tPA: "+times.tpa+(dtn!==null?" (DTN "+dtn+" min)":"")+"."):null,
    notes||null,
  ].filter(Boolean).join(" ");

  return(
    <div>
      <div style={S.card}>
        <div style={S.cardTitle}>Stroke Times · press T</div>
        <div style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"flex-end"}}>
          {[{key:"arrival",label:"Door / Arrival",ref:timeArrivalRef},{key:"consult",label:"Neurology Called",ref:null},{key:"tpa",label:"tPA Given",ref:null}].map(({key,label,ref})=>(
            <div key={key}>
              <div style={{color:C.dim,fontSize:11,marginBottom:4}}>{label.toUpperCase()}</div>
              <input ref={ref} type="time" style={{...S.input,width:128}}
                value={times[key]} onChange={e=>setTimes(t=>({...t,[key]:e.target.value}))}
                onFocus={()=>setInputActive(true)}
                onBlur={()=>{setInputActive(false);setTimeout(()=>panelRef.current?.focus(),50);}}/>
            </div>
          ))}
          {dtn!==null&&(
            <div style={{padding:"7px 14px",borderRadius:8,
              background:dtn<=60?"rgba(74,222,128,0.1)":"rgba(248,113,113,0.1)",
              border:"1px solid "+(dtn<=60?"rgba(74,222,128,0.28)":"rgba(248,113,113,0.28)")}}>
              <div style={{color:C.dim,fontSize:10}}>DOOR-TO-NEEDLE</div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:17,fontWeight:700,color:dtn<=60?"#4ade80":"#f87171"}}>
                {dtn} min {dtn<=60?"✓":"✗"}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{...S.card,padding:"13px 15px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={S.cardTitle}>Neuro Recommendations</div>
          <span style={{color:C.teal,fontFamily:"'JetBrains Mono',monospace",fontSize:12}}>{done} / {CONSULT_ITEMS.length}</span>
        </div>
        <div ref={panelRef} tabIndex={0} onKeyDown={handleKey} style={{outline:"none"}}>
          {CONSULT_ITEMS.map((item,idx)=>{
            const focused=idx===focusIdx;const isDone=!!checked[idx];
            return(
              <div key={idx} onClick={()=>{setFocusIdx(idx);setChecked(p=>({...p,[idx]:!p[idx]}));}} style={S.focusRow(focused)}>
                <div style={S.checkbox(isDone)}>{isDone&&<span style={{color:C.teal,fontSize:10,lineHeight:1}}>✓</span>}</div>
                <span style={{fontSize:13,color:isDone?C.dimmer:C.textSub,textDecoration:isDone?"line-through":"none"}}>{item}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>Notes · press N</div>
        <textarea ref={notesRef} rows={3}
          style={{...S.input,resize:"vertical",lineHeight:1.6,width:"100%",boxSizing:"border-box"}}
          value={notes} onChange={e=>setNotes(e.target.value)}
          onFocus={()=>setInputActive(true)}
          onBlur={()=>{setInputActive(false);setTimeout(()=>panelRef.current?.focus(),50);}}
          placeholder="Neuro recommendations, disposition, plan..."/>
        {summary&&(<div style={{marginTop:8,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",
          borderRadius:7,padding:"9px 13px",fontSize:13,color:C.textSub,lineHeight:1.7}}>
          <div style={{color:"#374151",fontSize:10,marginBottom:3}}>AUTO-SUMMARY</div>{summary}
        </div>)}
      </div>

      <KbHints hints={[{key:"↑ ↓",label:"navigate"},{key:"Space / Enter",label:"check"},{key:"T",label:"times"},{key:"N",label:"notes"},{key:"Esc",label:"back"}]}/>

      <div style={{marginTop:14,padding:"14px 16px",borderRadius:10,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
          <div>
            <div style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:13,color:"#f1f5f9"}}>Save to Quality Log</div>
            <div style={{fontSize:11,color:"#374151",marginTop:3}}>De-identified · NIHSS, DTN, tPA status, checklist. No patient identifiers.</div>
          </div>
          <button onClick={saveRecord} disabled={saveState==="saving"||saveState==="saved"} style={{
            fontWeight:700,fontSize:13,padding:"9px 20px",borderRadius:8,
            cursor:saveState==="saving"?"wait":saveState==="saved"?"default":"pointer",transition:"all .2s",
            background:saveState==="saved"?"linear-gradient(135deg,rgba(74,222,128,0.22),rgba(74,222,128,0.1))":saveState==="error"?"linear-gradient(135deg,rgba(248,113,113,0.22),rgba(248,113,113,0.1))":saveState==="saving"?"rgba(255,255,255,0.04)":"linear-gradient(135deg,rgba(20,184,166,0.22),rgba(20,184,166,0.1))",
            border:saveState==="saved"?"1px solid rgba(74,222,128,0.45)":saveState==="error"?"1px solid rgba(248,113,113,0.45)":"1px solid rgba(20,184,166,0.38)",
            color:saveState==="saved"?"#4ade80":saveState==="error"?"#f87171":saveState==="saving"?C.dim:C.teal,
          }}>{saveState==="saving"?"Saving...":saveState==="saved"?"✓ Saved":saveState==="error"?"✗ Error":"Save to Quality Log"}</button>
        </div>
        <div style={{marginTop:10,display:"flex",flexWrap:"wrap",gap:7}}>
          {[
            nihssScore>0&&{label:"NIHSS",val:nihssScore+" — "+sev.label,color:C.teal},
            times.tpa&&{label:"tPA",val:"Given "+times.tpa,color:"#4ade80"},
            !times.tpa&&{label:"tPA",val:"Not given",color:C.dim},
            dtn!==null&&{label:"DTN",val:dtn+" min "+(dtn<=60?"✓":"✗"),color:dtn<=60?"#4ade80":"#f87171"},
            tpaEligibility!=="incomplete"&&{label:"Elig",val:tpaEligibility,color:tpaEligibility==="eligible"?"#4ade80":tpaEligibility==="contraindicated"?"#f87171":"#fbbf24"},
            workupDone>0&&{label:"Workup",val:workupDone+" / "+workupTotal,color:C.textSub},
            done>0&&{label:"Consult",val:done+" / "+CONSULT_ITEMS.length,color:C.textSub},
          ].filter(Boolean).map((item,i)=>(
            <div key={i} style={{background:item.color+"10",border:"1px solid "+item.color+"30",borderRadius:6,padding:"3px 9px"}}>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:C.dim,marginRight:5}}>{item.label}</span>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:item.color,fontWeight:700}}>{item.val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── PRINT CARDS ──────────────────────────────────────────────────────────────
const SENTENCES=["You know how.","Down to earth.","I got home from work.","Near the table in the dining room.","They heard him speak on the radio last night."];
const NAMING_ITEMS=["Pen / pencil","Hand","Chair","Glasses","Cane"];
const DYSA_WORDS=["MAMA","TIP-TOP","FIFTY-FIFTY","THANKS","HUCKLEBERRY","BASEBALL PLAYER"];
const COOKIE_CUES=["Boy stealing cookies from the jar","Boy standing on a tipping stool","Woman washing dishes — sink overflowing","Woman handing cookie to girl","Window, curtains, outdoor scene"];

function PrintCardsTab(){
  const pCard={background:"#fff",border:"2px solid #1e293b",borderRadius:10,padding:"22px 26px",color:"#0f172a",fontFamily:"'DM Sans',Arial,sans-serif"};
  const pH=(t)=>(<div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:17,fontWeight:700,color:"#0f172a",borderBottom:"2px solid #0f172a",paddingBottom:7,marginBottom:14}}>{t}</div>);
  const pL=(t)=>(<div style={{fontSize:10,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",color:"#64748b",marginBottom:5}}>{t}</div>);
  const pN=(t)=>(<div style={{background:"#f1f5f9",borderRadius:6,padding:"7px 11px",fontSize:11,color:"#475569",fontStyle:"italic",marginBottom:12}}>{t}</div>);
  return(
    <div>
      <style>{PRINT_CSS}</style>
      <div className="sh-no-print" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,
        background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:8,padding:"10px 14px"}}>
        <div style={{fontSize:12,color:C.dim}}>Bedside stimulus cards · items 9 and 10 · print for patient use</div>
        <button onClick={()=>window.print()} style={{background:"linear-gradient(135deg,rgba(20,184,166,0.2),rgba(20,184,166,0.08))",
          border:"1px solid rgba(20,184,166,0.36)",borderRadius:7,color:C.teal,cursor:"pointer",fontSize:12,fontWeight:700,padding:"7px 18px"}}>⎙ Print</button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:18}}>
        <div style={pCard}>
          {pH("Item 9 — Best Language")}
          {pL("READING SENTENCES · Ask patient to read aloud")}
          {pN("Please read each sentence aloud. Score on fluency, substitutions, and paraphrasic errors. Do not prompt.")}
          <div style={{display:"flex",flexDirection:"column",gap:9,marginBottom:18}}>
            {SENTENCES.map((s,i)=>(<div key={i} style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:7,
              padding:"11px 15px",fontFamily:"'Playfair Display',Georgia,serif",fontSize:21,fontWeight:700,color:"#0f172a",lineHeight:1.3}}>{s}</div>))}
          </div>
          {pL("NAMING · Ask patient to name each object")}
          {pN("Show each item or point to object in the room. Record errors and perseverations.")}
          <div style={{display:"grid",gridTemplateColumns:"repeat(5, 1fr)",gap:7,marginBottom:18}}>
            {NAMING_ITEMS.map(item=>(<div key={item} style={{border:"2px solid #1e293b",borderRadius:7,padding:"11px 5px",textAlign:"center"}}>
              <div style={{fontSize:13,fontWeight:700,color:"#0f172a"}}>{item}</div>
            </div>))}
          </div>
          {pL("COOKIE THEFT · Show NIH card — Tell me everything you see happening")}
          <div style={{border:"2px dashed #94a3b8",borderRadius:7,padding:"12px 16px",background:"#f8fafc"}}>
            <div style={{fontSize:10,fontWeight:700,color:"#64748b",marginBottom:7,letterSpacing:"0.8px"}}>SCENE ELEMENTS TO LISTEN FOR</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
              {COOKIE_CUES.map((cue,i)=>(<div key={i} style={{display:"flex",gap:7,fontSize:12,color:"#334155"}}><span style={{color:"#94a3b8",flexShrink:0}}>□</span>{cue}</div>))}
            </div>
            <div style={{marginTop:9,fontSize:10,color:"#94a3b8",fontStyle:"italic"}}>Attach official NIH / AHA Cookie Theft stimulus card for full administration.</div>
          </div>
        </div>

        <div style={pCard}>
          {pH("Item 10 — Dysarthria")}
          {pL("WORD LIST · Show to patient or read for repeat")}
          {pN("Please read each word aloud. If unable to read, say the word and ask the patient to repeat. Intubated or physical barrier: score UN.")}
          <div style={{display:"flex",flexDirection:"column",gap:11,marginBottom:20}}>
            {DYSA_WORDS.map(word=>(<div key={word} style={{background:"#0f172a",borderRadius:9,padding:"15px 20px",
              fontFamily:"'JetBrains Mono','Courier New',monospace",fontSize:30,fontWeight:700,color:"#f1f5f9",letterSpacing:"4px",textAlign:"center"}}>{word}</div>))}
          </div>
          {pL("SCORING RUBRIC")}
          <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:14}}>
            {[
              {score:"0",label:"Normal articulation",color:"#4ade80"},
              {score:"1",label:"Mild-moderate slurring — can be understood with effort",color:"#fbbf24"},
              {score:"2",label:"Severe — unintelligible or mute (not aphasia)",color:"#f87171"},
              {score:"UN",label:"Untestable — intubated or physical barrier",color:"#94a3b8"},
            ].map(({score,label,color})=>(
              <div key={score} style={{display:"flex",alignItems:"center",gap:12,background:color+"10",border:"1px solid "+color+"38",borderRadius:7,padding:"9px 13px"}}>
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:17,fontWeight:700,color,minWidth:30,textAlign:"center"}}>{score}</div>
                <div style={{fontSize:13,color:"#0f172a"}}>{label}</div>
              </div>
            ))}
          </div>
          <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:7,padding:"9px 13px",fontSize:11,color:"#92400e"}}>
            <strong>Clinical note:</strong> Distinguish dysarthria from aphasia. A globally aphasic patient scoring 3 on Item 9 should not automatically receive a high Item 10 score unless motor speech impairment is separately identifiable.
          </div>
        </div>

        <div style={{textAlign:"center",fontSize:10,color:C.dim,fontFamily:"'JetBrains Mono',monospace",paddingTop:4}}>
          Lakonyx · StrokeHub · NIHSS Stimulus Reference · Not a substitute for certified NIHSS training
        </div>
      </div>
    </div>
  );
}

// ─── SHELL ────────────────────────────────────────────────────────────────────
const TABS=[{label:"NIHSS"},{label:"Workup"},{label:"Treatment"},{label:"Neuro Consult"},{label:"Print Cards",muted:true}];

export default function StrokeHub({embedded=false,onBack,demo={},vitals={},cc={},nihssInit={}}){
  const[tab,setTab]=useState(0);
  const { activeOrder, openOrder, closeOrder } = useQuickOrder();
  const[nihss,setNihss]=useState(nihssInit);
  const[workupChecked,setWorkupChecked]=useState({});
  const[txChecked,setTxChecked]=useState({});
  const[weight,setWeight]=useState("");
  const[consultChecked,setConsultChecked]=useState({});
  const[times,setTimes]=useState({arrival:"",consult:"",tpa:""});
  const[notes,setNotes]=useState("");
  const wrapRef=useRef(null);

  const handleBack=useCallback(()=>{if(onBack){onBack();}else{window.history.back();}},[onBack]);

  useEffect(()=>{
    const handler=(e)=>{
      if(!(e.metaKey||e.ctrlKey))return;
      if(!wrapRef.current?.contains(e.target))return;
      const n=parseInt(e.key,10);
      if(n>=1&&n<=5){e.preventDefault();setTab(n-1);}
    };
    window.addEventListener("keydown",handler);
    return()=>window.removeEventListener("keydown",handler);
  },[]);

  const nihssScore=NIHSS_ITEMS.reduce((s,it)=>{const v=nihss[it.id];return(!v||v==="UN")?s:s+parseInt(v,10);},0);
  const sev=nihssSev(nihssScore);
  const workupDone=Object.keys(workupChecked).length;
  const workupTotal=WORKUP_FLAT.length;

  return(
    <div ref={wrapRef} style={{display:"flex",flexDirection:"column",minHeight:"100vh",
      background:"linear-gradient(160deg,rgba(7,12,32,1) 0%,rgba(11,19,46,1) 100%)",
      fontFamily:"'DM Sans',sans-serif",color:C.text}}>
      {!embedded && <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingRight:16}}><NotryaHubHeader hubName="Stroke Hub" category="Neurology" homeUrl="/" /><PulseNavBadge /></div>}
      {!embedded && <NotryaPatientBar />}
      <div style={{display:"flex",flex:1}}>

      {/* Left rail */}
      <div className="sh-no-print" style={{width:172,flexShrink:0,
        background:"rgba(0,0,0,0.35)",borderRight:"1px solid rgba(255,255,255,0.06)",
        display:"flex",flexDirection:"column",padding:"0 0 24px 0",
        position:"sticky",top:0,height:"100vh",overflowY:"auto"}}>

        

        {/* Tabs */}
        <div style={{flex:1,padding:"4px 0"}}>
          {TABS.map((t,i)=>{
            const active=i===tab;
            return(<button key={t.label} onClick={()=>setTab(i)} style={{
              display:"flex",alignItems:"center",gap:10,padding:"10px 16px",width:"100%",
              borderLeft:active?"3px solid "+(t.muted?C.dim:C.teal):"3px solid transparent",
              borderTop:"none",borderRight:"none",borderBottom:"none",
              color:active?(t.muted?C.slate:C.teal):C.dimmer,
              cursor:"pointer",fontSize:13,fontWeight:active?700:400,textAlign:"left",transition:"all .15s",
              background:active?(t.muted?"rgba(255,255,255,0.04)":"rgba(20,184,166,0.08)"):"transparent",
            }}>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,
                color:active?(t.muted?C.dim:C.teal2):"#2d3748",minWidth:22}}>⌘{i+1}</span>
              {t.label}
            </button>);
          })}
        </div>

        {/* Status */}
        <div style={{padding:"12px 14px",borderTop:"1px solid rgba(255,255,255,0.06)"}}>
          {nihssScore>0?(
            <div style={{background:sev.color+"10",border:"1px solid "+sev.color+"28",borderRadius:8,padding:"8px 11px",marginBottom:8}}>
              <div style={{color:C.dim,fontSize:9,fontWeight:700,letterSpacing:"0.8px",marginBottom:3}}>NIHSS</div>
              <div style={{display:"flex",alignItems:"baseline",gap:7}}>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:22,fontWeight:700,color:sev.color,lineHeight:1}}>{nihssScore}</span>
                <span style={{color:sev.color,fontSize:11,opacity:0.85}}>{sev.label}</span>
              </div>
            </div>
          ):(
            <div style={{color:"#1e2d44",fontSize:11,marginBottom:8}}>NIHSS not scored</div>
          )}
          <div style={{color:C.dim,fontSize:9,fontWeight:700,letterSpacing:"0.8px",marginBottom:5}}>WORKUP</div>
          <div style={{display:"flex",alignItems:"center",gap:7}}>
            <div style={{flex:1,background:"rgba(255,255,255,0.06)",borderRadius:3,height:4,overflow:"hidden"}}>
              <div style={{width:(workupDone/workupTotal*100)+"%",height:"100%",
                background:"linear-gradient(90deg,"+C.teal+",#38bdf8)",transition:"width .3s"}}/>
            </div>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:C.dim}}>{workupDone}/{workupTotal}</span>
          </div>
          {tab===4&&(<button onClick={()=>window.print()} style={{marginTop:10,width:"100%",
            background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.09)",
            borderRadius:7,color:C.dim,cursor:"pointer",fontSize:12,fontWeight:700,padding:"7px 0"}}>⎙ Print</button>)}
        </div>
      </div>

      {/* Content */}
      <div style={{flex:1,overflowY:"auto",padding:"22px 26px 56px"}}>
        {tab===0&&<NIHSSTab nihss={nihss} setNihss={setNihss}/>}
        {tab===1&&<WorkupTab checked={workupChecked} setChecked={setWorkupChecked}/>}
        {tab===2&&<TreatmentTab demo={demo} vitals={vitals} nihss={nihss}
          txChecked={txChecked} setTxChecked={setTxChecked} weight={weight} setWeight={setWeight} onOpenOrder={openOrder}/>}
        {tab===3&&<NeuroConsultTab demo={demo} vitals={vitals} nihss={nihss}
          consultChecked={consultChecked} setConsultChecked={setConsultChecked}
          times={times} setTimes={setTimes} notes={notes} setNotes={setNotes}
          workupChecked={workupChecked} txChecked={txChecked}/>}
        {tab===4&&<PrintCardsTab/>}
      </div>
    </div>
    {activeOrder && (
      <QuickOrderPanel orderSeed={activeOrder} patientContext={{}} hubName='StrokeHub' onClose={closeOrder} C='dark' />
    )}
    </div>
  );
}