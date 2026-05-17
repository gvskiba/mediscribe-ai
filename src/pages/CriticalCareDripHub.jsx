import { useState, useMemo, useCallback } from "react";

import NotryaPatientBar from "@/components/HubHeader/NotryaPatientBar";

(() => {
  if (document.getElementById("cc-css")) return;
  const l = document.createElement("link"); l.id = "cc-f"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "cc-css";
  s.textContent = `
    *{box-sizing:border-box;}
    @keyframes ccIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
    .cc-in{animation:ccIn .22s ease both;}
    .cc-hov:hover{border-color:rgba(255,159,67,.5)!important;background:rgba(255,159,67,.07)!important;}
    ::-webkit-scrollbar{width:3px;height:3px;}
    ::-webkit-scrollbar-thumb{background:rgba(255,159,67,.25);border-radius:2px;}
    input::placeholder{color:rgba(221,230,240,.2);}
    input:focus{border-color:rgba(255,159,67,.6)!important;outline:none;}
    select option{background:#0d1b2e;}
    input[type=range]{-webkit-appearance:none;height:4px;background:rgba(42,79,122,.5);border-radius:2px;outline:none;cursor:pointer;}
    input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:#ff9f43;cursor:pointer;}
  `;
  document.head.appendChild(s);
})();

const T = {
  bg:"#07111f", card:"rgba(255,255,255,0.04)", bdr:"rgba(255,255,255,0.08)",
  teal:"#00b4d8", tD:"rgba(0,180,216,0.12)",
  gold:"#f0a500", gD:"rgba(240,165,0,0.12)",
  coral:"#ff6060", cD:"rgba(255,96,96,0.12)",
  green:"#4ade80", grnD:"rgba(74,222,128,0.1)",
  purple:"#9b6dff", pD:"rgba(155,109,255,0.12)",
  orange:"#ff9f43", oD:"rgba(255,159,67,0.12)", oB:"rgba(255,159,67,0.25)",
  blue:"#3b9eff",
  txt:"#dde6f0", mut:"rgba(221,230,240,0.55)", dim:"rgba(221,230,240,0.28)",
};
const gl = (x={}) => ({backdropFilter:"blur(14px)",background:T.card,border:`1px solid ${T.bdr}`,borderRadius:12,...x});
const ab = (c=T.orange,x={}) => ({padding:"8px 18px",borderRadius:9,cursor:"pointer",border:`1px solid ${c}55`,background:`${c}18`,color:c,fontFamily:"DM Sans,sans-serif",fontSize:13,fontWeight:700,transition:"all .16s",...x});

const DRIPS = [
  { id:"norep", name:"Norepinephrine", abbrev:"NE", color:T.orange, type:"vasopressor",
    indication:"First-line vasopressor — septic, distributive, mixed shock",
    mechanism:"Potent α1 (vasoconstriction) + moderate β1 (inotropy)",
    start:0.01, lo:0.01, hi:3.0, unit:"mcg/kg/min",
    titrate:0.05, titrate_freq:"q5-15 min",
    target:"MAP ≥65 mmHg (or per protocol)",
    max:"No strict ceiling — typical max 0.5-2 mcg/kg/min before adding 2nd agent",
    wean:"Reduce by 0.05 mcg/kg/min q30-60 min once MAP stable ×6h; hold vasopressin last",
    concs:[["4mg/250mL",16],["8mg/250mL",32]],
    warnings:["Peripheral ischemia at high doses","Preferred central line — tissue necrosis with extravasation","Add vasopressin at 0.3 mcg/kg/min as 2nd agent"],
    monitoring:"MAP q5-15 min; UO; lactate q6h; skin perfusion; limb ischemia signs" },

  { id:"vasop", name:"Vasopressin", abbrev:"AVP", color:T.teal, type:"vasopressor",
    indication:"Add-on vasopressor — septic shock at NE ≥0.25 mcg/kg/min; refractory vasodilatory shock",
    mechanism:"V1 receptor (vascular smooth muscle vasoconstriction) — not adrenergic",
    start:0.03, lo:0.01, hi:0.04, unit:"units/min",
    titrate:0, titrate_freq:"FIXED DOSE — not titrated",
    target:"Fixed dose 0.03 units/min as add-on to NE",
    max:"0.04 units/min maximum (myocardial ischemia risk above this)",
    wean:"Wean last (after NE at low dose). Discontinue when NE <0.1 mcg/kg/min",
    concs:[["20u/100mL",0.2],["40u/100mL",0.4]],
    warnings:["Do NOT titrate up — fixed add-on dose only","Splanchnic ischemia at high doses","Hyponatremia with prolonged use"],
    monitoring:"MAP; mesenteric ischemia symptoms (rare); sodium" },

  { id:"epi", name:"Epinephrine", abbrev:"EPI", color:T.coral, type:"vasopressor",
    indication:"Anaphylaxis; cardiac arrest (ACLS); cardiogenic shock; refractory septic shock",
    mechanism:"Strong α1 + β1 + β2 — combined vasopressor and inotrope",
    start:0.05, lo:0.01, hi:1.0, unit:"mcg/kg/min",
    titrate:0.05, titrate_freq:"q5-10 min",
    target:"MAP ≥65; reverse anaphylaxis (HR, BP, urticaria); ROSC",
    max:"No absolute ceiling; dose-limiting arrhythmias and lactic acidosis",
    wean:"Taper by 0.05 mcg/kg/min q30 min once target achieved; monitor for rebound",
    concs:[["1mg/250mL",4],["2mg/250mL",8]],
    warnings:["Significant arrhythmia risk","Elevated lactate (β2 stimulation — metabolic, not ischemic)","Myocardial ischemia at high doses"],
    monitoring:"Continuous ECG; lactate (may be falsely elevated); BP; signs of ischemia" },

  { id:"phen", name:"Phenylephrine", abbrev:"PHE", color:T.purple, type:"vasopressor",
    indication:"Neurogenic shock; intraoperative hypotension; septic shock with tachyarrhythmia (no inotropic effect)",
    mechanism:"Pure α1 agonist — pure vasoconstriction only",
    start:100, lo:50, hi:400, unit:"mcg/min",
    titrate:50, titrate_freq:"q5-10 min",
    target:"MAP ≥65; HR decrease often seen (reflex bradycardia)",
    max:"500 mcg/min",
    wean:"Taper by 50 mcg/min q15-30 min; reflex bradycardia resolves with weaning",
    concs:[["100mg/250mL",400],["50mg/250mL",200]],
    warnings:["Reflex bradycardia (HR may drop significantly)","No cardiac output augmentation — may worsen CO in cardiogenic shock","Preferred when tachyarrhythmia is rate-limiting"],
    monitoring:"MAP; HR (expect decrease); CO if measured; peripheral perfusion" },

  { id:"dop", name:"Dopamine", abbrev:"DA", color:T.gold, type:"vasopressor",
    indication:"Cardiogenic shock (historical); bradycardia with hemodynamic compromise (alternative to atropine)",
    mechanism:"Dose-dependent: 2-4 mcg/kg/min dopaminergic; 5-10 β1 inotropic; >10 α1 vasopressor",
    start:5, lo:2, hi:20, unit:"mcg/kg/min",
    titrate:2.5, titrate_freq:"q10-15 min",
    target:"MAP ≥65; CO improvement; HR in bradycardia",
    max:"20 mcg/kg/min (prefer norepinephrine above 10 mcg/kg/min)",
    wean:"Taper by 2-3 mcg/kg/min q30 min; higher arrhythmia rate than norepinephrine",
    concs:[["400mg/250mL",1600],["800mg/250mL",3200]],
    warnings:["Higher arrhythmia rate vs norepinephrine (SOAP II trial)","Renal-dose dopamine does NOT protect kidneys (myth)","Tachyarrhythmia risk — avoid in AF/tachycardia"],
    monitoring:"Continuous ECG (arrhythmia risk); MAP; HR; consider switching to NE" },

  { id:"dobut", name:"Dobutamine", abbrev:"DBT", color:T.green, type:"inotrope",
    indication:"Cardiogenic shock with adequate MAP; low cardiac output (LVEF severely reduced); bridge to mechanical support",
    mechanism:"Primarily β1 inotrope — increases cardiac output; some β2 vasodilation (may LOWER BP)",
    start:2, lo:2, hi:20, unit:"mcg/kg/min",
    titrate:2.5, titrate_freq:"q10-15 min",
    target:"CI >2.2 L/min/m2; mixed venous O2 saturation >65%; improved UO and mentation",
    max:"20 mcg/kg/min (tolerance develops with prolonged use >72h)",
    wean:"Taper by 2-3 mcg/kg/min q30 min; transition to oral heart failure therapy when stable",
    concs:[["250mg/250mL",1000],["500mg/250mL",2000]],
    warnings:["May DECREASE MAP — do NOT use as vasopressor","Tachyarrhythmia and worsened ischemia risk","Tolerance after 72h — consider milrinone or mechanical support"],
    monitoring:"Cardiac output/index (PA catheter or echo); MAP; HR; ECG; mixed venous O2 sat" },
];

const SHOCK_TYPES = [
  { id:"dist", label:"Distributive", icon:"🔴", examples:"Sepsis, anaphylaxis, neurogenic, adrenal",
    findings:"Low SVR, high CO, warm extremities, bounding pulse",
    first:"Norepinephrine", second:"+ Vasopressin at NE ≥0.25 mcg/kg/min", third:"+ Epinephrine if refractory",
    color:T.coral },
  { id:"cardio", label:"Cardiogenic", icon:"🫀", examples:"STEMI, decompensated HFrEF, massive PE, myocarditis",
    findings:"Low CO, high SVR, cool extremities, pulmonary edema",
    first:"Dobutamine (if MAP adequate)", second:"+ Norepinephrine (if MAP inadequate)", third:"Consider IABP/Impella, transfer to PCI",
    color:T.purple },
  { id:"hypo", label:"Hypovolemic", icon:"💧", examples:"Hemorrhage, GI losses, burns, third-spacing",
    findings:"Low CO, high SVR, cool extremities, low JVP",
    first:"Volume resuscitation FIRST (fluids/blood)", second:"Norepinephrine if MAP not responding to volume", third:"Address source of volume loss (surgery, endoscopy)",
    color:T.blue },
  { id:"obstruct", label:"Obstructive", icon:"⛔", examples:"Massive PE, tension PTX, cardiac tamponade",
    findings:"Low CO, high SVR, JVD, Beck triad (tamponade) or absent breath sounds (PTX)",
    first:"Treat the OBSTRUCTION — thrombolytics (PE), needle decompression (PTX), pericardiocentesis (tamponade)", second:"Norepinephrine as bridge only", third:"Do NOT rely on vasopressors alone",
    color:T.gold },
];

export default function CriticalCareDripHub() {
  const [wt,setWt]=useState(""); const [mapTarget,setMapTarget]=useState("65");
  const [selDrip,setSelDrip]=useState("norep");
  const [dose,setDose]=useState("");
  const [selConc,setSelConc]=useState(0);
  const [tab,setTab]=useState("titration");
  const [shockType,setShockType]=useState(null);
  const [activeDrips,setActiveDrips]=useState([]);
  const [copied,setCopied]=useState(false);

  const drug = DRIPS.find(d=>d.id===selDrip)||DRIPS[0];
  const wtNum = parseFloat(wt)||70;

  const calcRate = useCallback((d,dose,wt,concIdx)=>{
    const c=d.concs[concIdx]?.[1]||d.concs[0][1];
    const dv=parseFloat(dose)||d.start;
    if(d.unit.includes("mcg/kg/min")) return (dv*wt*60/c).toFixed(1);
    if(d.unit.includes("units/min")) return (dv*60/c).toFixed(1);
    if(d.unit.includes("mcg/min")) return (dv*60/c).toFixed(1);
    return (dv*60/c).toFixed(1);
  },[]);

  const rate = useMemo(()=>calcRate(drug,dose||drug.start,wtNum,selConc),[drug,dose,wtNum,selConc]);

  const addToSheet = () => {
    const d=drug, dv=parseFloat(dose)||d.start;
    const r=calcRate(d,dv,wtNum,selConc);
    if(!activeDrips.find(x=>x.id===d.id)) {
      setActiveDrips(p=>[...p,{id:d.id,name:d.name,dose:dv,unit:d.unit,rate:r,color:d.color,conc:d.concs[selConc]?.[0]||d.concs[0][0]}]);
    }
  };

  const removeFromSheet = (id) => setActiveDrips(p=>p.filter(x=>x.id!==id));

  const sheetText = useMemo(()=>{
    const lines=[
      `VASOPRESSOR / INOTROPE TITRATION SHEET`,
      `Patient Weight: ${wt||"___"} kg | MAP Target: >${mapTarget} mmHg`,
      `Generated: ${new Date().toLocaleString()}`,``,
      ...activeDrips.map(d=>[
        `${d.name.toUpperCase()}`,
        `  Concentration: ${d.conc}`,
        `  Current Dose: ${d.dose} ${d.unit}`,
        `  Infusion Rate: ${d.rate} mL/hr`,
        `  Titrate: per protocol`,``,
      ].join("\n")),
      `MAP Target: >${mapTarget} mmHg`,
      `Titration: Increase by respective agent increment per unit protocol`,
      `Wean: When MAP stable >6h; reduce by titration increment q30-60 min`,
    ];
    return lines.join("\n");
  },[activeDrips,wt,mapTarget]);

  const copy=()=>{
    navigator.clipboard?.writeText(sheetText).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);});
  };

  return(
    <div style={{background:T.bg,minHeight:"100vh",padding:"20px 18px 60px",fontFamily:"DM Sans,sans-serif",color:T.txt}}>
      <NotryaPatientBar />
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:22}}>
        <div style={{width:44,height:44,borderRadius:11,background:T.oD,border:`1px solid ${T.oB}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>💊</div>
        <div>
          <h1 style={{margin:0,fontFamily:"Playfair Display,serif",fontSize:22,color:T.orange,letterSpacing:"-0.5px",lineHeight:1}}>Critical Care Drip Hub</h1>
          <p style={{margin:"3px 0 0",fontSize:12,color:T.mut}}>Vasopressor & inotrope titration · Shock classifier · Copyable titration sheet</p>
        </div>
      </div>

      {/* Patient bar */}
      <div style={{...gl({padding:"10px 16px",marginBottom:16,display:"flex",gap:14,alignItems:"center",flexWrap:"wrap"})}}>
        <div>
          <div style={{fontSize:8,color:T.dim,fontFamily:"JetBrains Mono,monospace",letterSpacing:1,textTransform:"uppercase",marginBottom:3}}>Patient Weight</div>
          <div style={{position:"relative"}}>
            <input type="number" value={wt} onChange={e=>setWt(e.target.value)} placeholder="70"
              style={{background:"rgba(13,27,46,.8)",border:`1px solid ${T.bdr}`,borderRadius:8,padding:"6px 30px 6px 11px",color:T.txt,fontFamily:"JetBrains Mono,monospace",fontSize:13,fontWeight:700,width:90}} />
            <span style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",fontSize:9,color:T.dim,pointerEvents:"none"}}>kg</span>
          </div>
        </div>
        <div>
          <div style={{fontSize:8,color:T.dim,fontFamily:"JetBrains Mono,monospace",letterSpacing:1,textTransform:"uppercase",marginBottom:3}}>MAP Target</div>
          <div style={{position:"relative"}}>
            <input type="number" value={mapTarget} onChange={e=>setMapTarget(e.target.value)}
              style={{background:"rgba(13,27,46,.8)",border:`1px solid ${T.bdr}`,borderRadius:8,padding:"6px 38px 6px 11px",color:T.txt,fontFamily:"JetBrains Mono,monospace",fontSize:13,fontWeight:700,width:110}} />
            <span style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",fontSize:9,color:T.dim,pointerEvents:"none"}}>mmHg</span>
          </div>
        </div>
        {activeDrips.length>0&&(
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {activeDrips.map(d=>(
              <div key={d.id} style={{padding:"5px 10px",borderRadius:7,background:`${d.color}18`,border:`1px solid ${d.color}40`,display:"flex",alignItems:"center",gap:7}}>
                <span style={{fontSize:11,fontWeight:700,color:d.color}}>{d.name}</span>
                <span style={{fontSize:10,color:T.mut,fontFamily:"JetBrains Mono,monospace"}}>{d.dose} {d.unit} → {d.rate} mL/hr</span>
                <button onClick={()=>removeFromSheet(d.id)} style={{background:"none",border:"none",color:T.coral,cursor:"pointer",fontSize:13,padding:0,lineHeight:1}}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:5,marginBottom:20,background:T.card,borderRadius:9,padding:4,border:`1px solid ${T.bdr}`,width:"fit-content"}}>
        {[["titration","💊 Titration Protocols"],["shock","🚨 Shock Classifier"],["sheet","📋 Titration Sheet"]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{padding:"7px 16px",borderRadius:7,border:"none",cursor:"pointer",fontFamily:"DM Sans,sans-serif",fontSize:13,fontWeight:700,background:tab===k?T.orange:"transparent",color:tab===k?"#060e1a":T.mut,transition:"all .16s"}}>{l}</button>
        ))}
      </div>

      {/* Titration Protocols */}
      {tab==="titration"&&(
        <div className="cc-in" style={{display:"grid",gridTemplateColumns:"180px 1fr",gap:14,alignItems:"start"}}>
          <div style={{...gl({padding:"8px",overflow:"auto"})}}>
            {DRIPS.map(d=>(
              <button key={d.id} onClick={()=>{setSelDrip(d.id);setDose(String(d.start));setSelConc(0);}} className="cc-hov"
                style={{display:"flex",alignItems:"center",gap:8,width:"100%",textAlign:"left",padding:"9px 11px",borderRadius:9,border:`1px solid ${selDrip===d.id?d.color+"55":T.bdr}`,background:selDrip===d.id?`${d.color}12`:T.card,cursor:"pointer",marginBottom:5,transition:"all .15s"}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:d.color,flexShrink:0}}/>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:selDrip===d.id?d.color:T.txt}}>{d.name}</div>
                  <div style={{fontSize:9,color:T.dim}}>{d.type==="inotrope"?"Inotrope":"Vasopressor"}</div>
                </div>
              </button>
            ))}
          </div>

          <div>
            <div style={{...gl({padding:"16px 20px",marginBottom:12,borderLeft:`4px solid ${drug.color}`})}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10,marginBottom:8}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                    <h2 style={{margin:0,fontFamily:"Playfair Display,serif",fontSize:20,color:drug.color,lineHeight:1.1}}>{drug.name}</h2>
                    <span style={{borderRadius:6,padding:"3px 9px",fontSize:10,fontWeight:700,background:`${drug.color}18`,border:`1px solid ${drug.color}30`,color:drug.color}}>{drug.type}</span>
                  </div>
                  <div style={{fontSize:12,color:T.mut,marginBottom:6}}>{drug.mechanism}</div>
                  <div style={{fontSize:12,color:T.txt,fontStyle:"italic"}}>{drug.indication}</div>
                </div>
              </div>
            </div>

            <div style={{...gl({padding:"14px 18px",marginBottom:12,border:`1px solid ${drug.color}35`})}}>
              <div style={{fontSize:9,color:drug.color,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:12}}>Live Rate Calculator</div>
              <div style={{display:"flex",gap:12,alignItems:"flex-end",flexWrap:"wrap",marginBottom:12}}>
                <div>
                  <div style={{fontSize:8,color:T.dim,fontFamily:"JetBrains Mono,monospace",letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>Dose ({drug.unit})</div>
                  <input type="number" value={dose} onChange={e=>setDose(e.target.value)}
                    placeholder={String(drug.start)} style={{background:"rgba(13,27,46,.8)",border:`1px solid ${T.bdr}`,borderRadius:8,padding:"8px 12px",color:T.txt,fontFamily:"JetBrains Mono,monospace",fontSize:14,fontWeight:700,width:140}} />
                  <div style={{fontSize:9,color:T.dim,marginTop:3}}>Range: {drug.lo}–{drug.hi}</div>
                </div>
                <div>
                  <div style={{fontSize:8,color:T.dim,fontFamily:"JetBrains Mono,monospace",letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>Concentration</div>
                  <select value={selConc} onChange={e=>setSelConc(parseInt(e.target.value))} style={{background:"rgba(13,27,46,.8)",border:`1px solid ${T.bdr}`,borderRadius:8,padding:"8px 12px",color:T.txt,fontFamily:"DM Sans,sans-serif",fontSize:12,cursor:"pointer",width:200}}>
                    {drug.concs.map(([l],i)=><option key={i} value={i}>{l}</option>)}
                  </select>
                </div>
                <div style={{textAlign:"center",background:`${drug.color}12`,borderRadius:10,padding:"10px 18px",border:`2px solid ${drug.color}40`}}>
                  <div style={{fontSize:9,color:drug.color,fontFamily:"JetBrains Mono,monospace",fontWeight:700,textTransform:"uppercase",marginBottom:3}}>Infusion Rate</div>
                  <div style={{fontFamily:"JetBrains Mono,monospace",fontWeight:700,fontSize:32,color:drug.color,lineHeight:1}}>{rate}</div>
                  <div style={{fontSize:11,color:T.mut,marginTop:2}}>mL/hr</div>
                </div>
              </div>
              <button onClick={addToSheet} style={{...ab(drug.color,{fontSize:12,padding:"7px 16px"})}}>
                ➕ Add to Titration Sheet
              </button>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
              {[["Starting Dose",`${drug.start} ${drug.unit}`,drug.color],
                ["Titration Increment",`${drug.titrate||"FIXED"} ${drug.titrate?drug.unit:""} ${drug.titrate_freq}`,T.gold],
                ["Target",drug.target,T.teal],
                ["Max Dose",drug.max,T.coral]].map(([l,v,c])=>(
                <div key={l} style={{...gl({padding:"10px 14px",borderLeft:`3px solid ${c}55`})}}>
                  <div style={{fontSize:8,color:T.dim,fontFamily:"JetBrains Mono,monospace",letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>{l}</div>
                  <div style={{fontSize:12,color:T.txt,lineHeight:1.5}}>{v}</div>
                </div>
              ))}
            </div>

            <div style={{...gl({padding:"10px 14px",marginBottom:10,borderLeft:`3px solid ${T.purple}55`})}}>
              <div style={{fontSize:8,color:T.purple,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:5}}>Weaning Protocol</div>
              <div style={{fontSize:12,color:T.txt,lineHeight:1.55}}>{drug.wean}</div>
            </div>

            {drug.warnings.length>0&&(
              <div style={{...gl({padding:"10px 14px",marginBottom:10,borderLeft:`3px solid ${T.coral}`})}}>
                <div style={{fontSize:8,color:T.coral,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:5}}>⚠ Warnings</div>
                {drug.warnings.map((w,i)=><div key={i} style={{fontSize:11,color:T.mut,marginBottom:3}}>• {w}</div>)}
              </div>
            )}

            <div style={{...gl({padding:"10px 14px"})}}>
              <div style={{fontSize:8,color:T.dim,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:5}}>Monitoring</div>
              <div style={{fontSize:12,color:T.mut,lineHeight:1.55}}>{drug.monitoring}</div>
            </div>
          </div>
        </div>
      )}

      {/* Shock Classifier */}
      {tab==="shock"&&(
        <div className="cc-in" style={{maxWidth:700}}>
          <p style={{fontSize:12,color:T.mut,margin:"0 0 16px"}}>Select shock type to see recommended vasopressor/inotrope strategy and escalation sequence.</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
            {SHOCK_TYPES.map(s=>(
              <button key={s.id} onClick={()=>setShockType(shockType?.id===s.id?null:s)} className="cc-hov"
                style={{...gl({padding:"14px 16px",cursor:"pointer",textAlign:"left",border:`1px solid ${shockType?.id===s.id?s.color+"55":T.bdr}`,background:shockType?.id===s.id?`${s.color}12`:T.card,transition:"all .15s"})}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                  <span style={{fontSize:20}}>{s.icon}</span>
                  <span style={{fontWeight:700,fontSize:14,color:shockType?.id===s.id?s.color:T.txt}}>{s.label}</span>
                </div>
                <div style={{fontSize:11,color:T.mut,marginBottom:5}}>{s.examples}</div>
                <div style={{fontSize:10,color:T.dim,lineHeight:1.5}}>{s.findings}</div>
              </button>
            ))}
          </div>
          {shockType&&(
            <div className="cc-in" style={{...gl({padding:"16px 20px",borderLeft:`4px solid ${shockType.color}`})}}>
              <h3 style={{margin:"0 0 14px",fontFamily:"Playfair Display,serif",fontSize:18,color:shockType.color}}>{shockType.label} Shock — Management Sequence</h3>
              {[["First-line",shockType.first,shockType.color],["Second-line",shockType.second,T.gold],["Third-line / Escalation",shockType.third,T.purple]].map(([l,v,c])=>(
                <div key={l} style={{...gl({padding:"10px 14px",marginBottom:8,borderLeft:`3px solid ${c}55`})}}>
                  <div style={{fontSize:9,color:c,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:4}}>{l}</div>
                  <div style={{fontSize:13,color:T.txt,lineHeight:1.55}}>{v}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Titration Sheet */}
      {tab==="sheet"&&(
        <div className="cc-in" style={{maxWidth:600}}>
          {activeDrips.length===0?(
            <div style={{textAlign:"center",padding:"50px 20px",color:T.dim}}>
              <div style={{fontSize:36,marginBottom:10}}>📋</div>
              <div style={{fontSize:13,color:T.mut,marginBottom:6}}>No drips added yet</div>
              <div style={{fontSize:11}}>Go to Titration Protocols tab and click "Add to Titration Sheet"</div>
            </div>
          ):(
            <>
              <div style={{...gl({padding:"16px",marginBottom:12,border:`1px solid ${T.orange}35`})}}>
                <pre style={{margin:0,fontFamily:"JetBrains Mono,monospace",fontSize:12,color:T.txt,lineHeight:1.75,whiteSpace:"pre-wrap"}}>{sheetText}</pre>
              </div>
              <button onClick={copy} style={{...ab(T.orange,{display:"flex",alignItems:"center",gap:8})}}>
                {copied?"✓ Copied":"📋 Copy Titration Sheet"}
              </button>
            </>
          )}
        </div>
      )}

      <div style={{marginTop:40,textAlign:"center"}}>
        <span style={{fontFamily:"JetBrains Mono,monospace",fontSize:9,color:T.dim,letterSpacing:1.5}}>NOTRYA · CRITICAL CARE DRIP HUB · VERIFY DOSES PER UNIT PROTOCOL · CONSULT INTENSIVIST FOR REFRACTORY SHOCK</span>
      </div>
    </div>
  );
}