// ECGDTBTimer.jsx — Door-to-Balloon / Door-to-Needle Timer + Activation Checklist
import { useState, useEffect } from "react";

const T = {
  txt:"#e8f0fe", txt2:"#aac8e8", txt3:"#90b8d4", txt4:"#6898b4",
  red:"#ff4444", orange:"#ff9f43", gold:"#f5c842",
  blue:"#3b9eff", purple:"#9b6dff", teal:"#00e5c0", coral:"#ff6b6b",
};
const glass = {backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",background:"rgba(8,22,40,0.72)",border:"1px solid rgba(26,53,85,0.75)",borderRadius:14};

const CL_PCI = [
  {id:"asp",  label:"Aspirin 325mg PO (or 300mg PR if unable to swallow)"},
  {id:"hep",  label:"Heparin 60 U/kg IV bolus (max 4,000 U) — hold if radial PCI center prefers bivalirudin"},
  {id:"p2y",  label:"P2Y12: ticagrelor 180mg (preferred) OR clopidogrel 600mg PO"},
  {id:"iv",   label:"IV access × 2 · CBC, BMP, troponin, coags, type & screen"},
  {id:"cath", label:"Cath lab activated · Interventional cardiologist notified"},
  {id:"ecg",  label:"12-lead ECG transmitted to receiving center / cath lab"},
  {id:"o2",   label:"O₂ only if SpO₂ < 90% — avoid routine supplemental O₂ (Class III)"},
  {id:"pain", label:"Fentanyl 25-50mcg IV for refractory pain — morphine increases P2Y12 absorption delay"},
  {id:"bp",   label:"BP and rhythm documented · Defib pads on if unstable"},
];

const CL_LYTIC = [
  {id:"contra",label:"Absolute contraindications screened (prior ICH, active bleeding, aortic dissection, BP > 185/110 persistent)"},
  {id:"asp",   label:"Aspirin 300mg PO"},
  {id:"hep",   label:"Heparin 60 U/kg IV bolus (max 4,000 U) + 12 U/kg/h (max 1,000 U/h) infusion"},
  {id:"tpa",   label:"tPA: 15mg IV bolus → 0.75 mg/kg over 30 min (max 50mg) → 0.5 mg/kg over 60 min (max 35mg)"},
  {id:"bp2",   label:"Maintain BP < 185/110 throughout — labetalol 10-20mg IV or nitropaste"},
  {id:"neuro", label:"Neuro baseline documented · Monitor for reperfusion arrhythmias"},
  {id:"xfer",  label:"Transfer to PCI center arranged — target door-in/door-out ≤ 30 min"},
  {id:"repeat",label:"Repeat ECG at 60-90 min — check for reperfusion (ST resolution ≥ 50%)"},
];

export default function ECGDTBTimer() {
  const [t0,      setT0]      = useState(null);
  const [now,     setNow]     = useState(Date.now());
  const [mode,    setMode]    = useState("pci");
  const [checked, setChecked] = useState({});

  useEffect(()=>{
    const id=setInterval(()=>setNow(Date.now()),5000);
    return()=>clearInterval(id);
  },[]);

  const elapsed  = t0 ? Math.floor((now-t0)/60000) : null;
  const target   = mode==="pci" ? 90 : 30;
  const remaining= elapsed!==null ? target-elapsed : null;
  const over     = remaining!==null && remaining<0;
  const tCol     = elapsed===null?T.teal:over?T.red:elapsed>=target*.85?T.coral:elapsed>=target*.65?T.gold:T.teal;
  const checklist= mode==="pci" ? CL_PCI : CL_LYTIC;
  const done     = checklist.filter(i=>checked[i.id]).length;

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{fontSize:11,color:T.txt3,lineHeight:1.55,padding:"10px 12px",borderRadius:8,background:"rgba(14,37,68,.4)",border:"1px solid rgba(26,53,85,.6)"}}>
        2025 ACC/AHA: Primary PCI target ≤ 90 min door-to-balloon. Fibrinolysis if PCI delay &gt; 120 min or transfer &gt; 2h — target door-to-needle ≤ 30 min.
      </div>

      {/* Mode */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
        {[{id:"pci",label:"Primary PCI",sub:"DTB target ≤ 90 min"},{id:"lytic",label:"Fibrinolysis",sub:"DTN target ≤ 30 min"}].map(m=>{
          const sel=mode===m.id;
          return(
            <button key={m.id} onClick={()=>{setMode(m.id);setChecked({});}}
              style={{padding:"10px 8px",borderRadius:10,cursor:"pointer",textAlign:"center",border:`1.5px solid ${sel?"rgba(0,229,192,.4)":"rgba(26,53,85,.6)"}`,background:sel?"rgba(0,229,192,.1)":"rgba(14,37,68,.4)",fontFamily:"'DM Sans',sans-serif"}}>
              <div style={{fontSize:13,fontWeight:700,color:sel?T.teal:T.txt2}}>{m.label}</div>
              <div style={{fontSize:9,color:sel?T.txt3:T.txt4,fontFamily:"'JetBrains Mono',monospace"}}>{m.sub}</div>
            </button>
          );
        })}
      </div>

      {/* Timer */}
      <div style={{...glass,padding:"22px",textAlign:"center"}}>
        {!t0?(
          <>
            <div style={{fontSize:13,color:T.txt3,marginBottom:18,lineHeight:1.55}}>Start when STEMI confirmed on ECG.<br/>Records exact activation time.</div>
            <button onClick={()=>setT0(Date.now())}
              style={{padding:"14px 36px",borderRadius:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:15,border:"1.5px solid rgba(0,229,192,.4)",background:"linear-gradient(135deg,rgba(0,229,192,.18),rgba(59,158,255,.12))",color:T.teal}}>
              🎯 Start {mode==="pci"?"DTB":"DTN"} Timer
            </button>
          </>
        ):(
          <>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.txt3,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Elapsed</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:80,fontWeight:900,color:tCol,lineHeight:1,marginBottom:6}}>
              {elapsed}<span style={{fontSize:24,fontWeight:400,color:T.txt3}}> min</span>
            </div>
            {over?(
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:700,color:T.red,marginBottom:8}}>
                ⚠ {Math.abs(remaining)} MIN PAST TARGET — document reason
              </div>
            ):(
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:700,color:tCol,marginBottom:8}}>
                {remaining} min to {target}-min target
              </div>
            )}
            {/* Target progress bar */}
            <div style={{height:6,borderRadius:3,background:"rgba(26,53,85,.6)",marginBottom:12,overflow:"hidden"}}>
              <div style={{height:"100%",borderRadius:3,background:tCol,width:`${Math.min(100,(elapsed/target)*100)}%`,transition:"width .5s"}}/>
            </div>
            <div style={{display:"flex",gap:8,justifyContent:"center",alignItems:"center"}}>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.txt4}}>
                {mode.toUpperCase()} · Target {target} min · {new Date(t0).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}
              </div>
              <button onClick={()=>{setT0(null);setChecked({});}}
                style={{padding:"3px 10px",borderRadius:5,border:"1px solid rgba(255,107,107,.3)",background:"rgba(255,107,107,.07)",color:T.coral,fontFamily:"'DM Sans',sans-serif",fontSize:11,cursor:"pointer"}}>
                Reset
              </button>
            </div>
          </>
        )}
      </div>

      {/* Activation checklist */}
      <div style={{...glass,padding:"14px 16px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.teal,textTransform:"uppercase",letterSpacing:1,fontWeight:700}}>
            {mode==="pci"?"PCI":"Fibrinolysis"} Activation Checklist
          </div>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:done===checklist.length?T.teal:T.txt3}}>
            {done}/{checklist.length}
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:4}}>
          {checklist.map((item,i)=>{
            const on=checked[item.id];
            return(
              <div key={item.id} onClick={()=>setChecked(p=>({...p,[item.id]:!p[item.id]}))}
                style={{display:"flex",alignItems:"flex-start",gap:10,padding:"8px 10px",borderRadius:7,cursor:"pointer",background:on?"rgba(0,229,192,.06)":"rgba(14,37,68,.35)",border:`1px solid ${on?"rgba(0,229,192,.3)":"rgba(26,53,85,.5)"}`,transition:"all .1s"}}>
                <div style={{width:18,height:18,borderRadius:4,flexShrink:0,border:`1.5px solid ${on?T.teal:"rgba(42,79,122,.6)"}`,background:on?"rgba(0,229,192,.2)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",marginTop:1}}>
                  {on&&<span style={{color:T.teal,fontSize:11,lineHeight:1,fontWeight:700}}>✓</span>}
                </div>
                <div style={{display:"flex",gap:7,alignItems:"flex-start",flex:1}}>
                  <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:on?T.teal:T.txt4,flexShrink:0,marginTop:2}}>{i+1}</span>
                  <span style={{fontSize:11,color:on?T.txt3:T.txt,lineHeight:1.45,textDecoration:on?"line-through":"none",opacity:on?.65:1}}>{item.label}</span>
                </div>
              </div>
            );
          })}
        </div>
        {done===checklist.length&&(
          <div className="ecg-fade" style={{marginTop:10,padding:"8px 12px",borderRadius:8,background:"rgba(0,229,192,.08)",border:"1px solid rgba(0,229,192,.35)",fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.teal,textAlign:"center",fontWeight:700,letterSpacing:1}}>
            ✓ ACTIVATION COMPLETE — {new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}
          </div>
        )}
      </div>
      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.txt4,textAlign:"center"}}>
        2025 ACC/AHA ACS Guideline · Class 1 Recommendations
      </div>
    </div>
  );
}