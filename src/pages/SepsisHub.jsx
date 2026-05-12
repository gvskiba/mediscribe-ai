import { useState } from "react";
import { useNavigate } from "react-router-dom";

(() => {
  if (typeof document === "undefined") return;
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap";
  document.head.appendChild(l);
})();

const T = {
  bg: "#0a1628", glass: "rgba(255,255,255,0.04)", glassMid: "rgba(255,255,255,0.07)",
  border: "rgba(255,255,255,0.08)", borderMid: "rgba(255,255,255,0.15)",
  teal: "#14b8a6", tealDark: "#0d9488", gold: "#f59e0b", coral: "#f43f5e",
  green: "#22c55e", blue: "#3b82f6", purple: "#a78bfa", amber: "#fb923c",
  slate: "#94a3b8", white: "#f0f4f8", muted: "rgba(240,244,248,0.55)",
  dim: "rgba(240,244,248,0.28)", mono: "'JetBrains Mono', monospace",
  sans: "'DM Sans', sans-serif", serif: "'Playfair Display', serif",
};
const G = (x = {}) => ({ background: T.glass, backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", border: `1px solid ${T.border}`, borderRadius: 14, ...x });

const ABX_DATA = [
  { id:"pulm", label:"Pulmonary", color:"#3b82f6", bg:"rgba(59,130,246,0.12)", primary:"Ceftriaxone 2g IV + Azithromycin 500mg IV", alt:"Levofloxacin 750mg IV (β-lactam allergy)", note:null },
  { id:"abdo", label:"Abdominal", color:"#f97316", bg:"rgba(249,115,22,0.12)", primary:"Pip-tazo 4.5g IV q 6h", alt:"Meropenem 1g IV q 8h (ESBL)", note:null },
  { id:"uri", label:"Urinary", color:"#06b6d4", bg:"rgba(6,182,212,0.12)", primary:"Ceftriaxone 2g IV + Gentamicin 5 mg/kg IV", alt:"Pip-tazo 4.5g IV q 8h (complicated)", note:null },
  { id:"skin", label:"Skin / NF", color:"#f43f5e", bg:"rgba(244,63,94,0.12)", primary:"Vancomycin 25 mg/kg IV + Pip-tazo 4.5g IV + Clindamycin 900mg q 8h", alt:"Linezolid IV (vancomycin contraindicated)", note:"⚠ Suspect NF → urgent surgical consult" },
  { id:"cns", label:"CNS", color:"#a78bfa", bg:"rgba(167,139,250,0.12)", primary:"Ceftriaxone 2g IV q 12h + Vancomycin 25 mg/kg IV + Ampicillin 2g IV q 4h", alt:"± Acyclovir if HSV suspected · Dexamethasone 10mg IV before abx", note:"⚠ Dexamethasone BEFORE first antibiotic dose" },
  { id:"immune", label:"Immunocomp.", color:"#22c55e", bg:"rgba(34,197,94,0.12)", primary:"Pip-tazo 4.5g IV + Vancomycin 25 mg/kg IV + Echinocandin (if neutropenic)", alt:"± Acyclovir × 4 days", note:null },
  { id:"unk", label:"Unknown", color:"#94a3b8", bg:"rgba(148,163,184,0.10)", primary:"Vancomycin 25 mg/kg IV + Pip-tazo 4.5g IV", alt:"Meropenem 1g IV (MDR risk)", note:"+ Vanc if MRSA risk · β-lactam allergy → aztreonam + vanc" },
];

const PRESSOR_STEPS = [
  { step:1, drug:"NOREPINEPHRINE", dose:"0.05 – 0.5 mcg/kg/min", color:T.coral, bg:"rgba(244,63,94,0.10)", trigger:"1st line — start if MAP < 65 despite fluids", titrate:"Titrate to MAP ≥ 65 mmHg" },
  { step:2, drug:"+ VASOPRESSIN", dose:"0.03 – 0.04 U/min (fixed)", color:T.gold, bg:"rgba(245,158,11,0.10)", trigger:"Add if NE > 0.25 mcg/kg/min", titrate:"Recheck MAP at 15–30 min before adding step 3" },
  { step:3, drug:"+ EPINEPHRINE", dose:"0.01 – 0.5 mcg/kg/min", color:T.amber, bg:"rgba(251,146,60,0.10)", trigger:"Add if MAP falling on dual therapy", titrate:"Alt: Angiotensin II 20–200 ng/kg/min" },
];

export default function SepsisHub({ onBack }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [src, setSrc] = useState(null);
  const [lactate, setLactate] = useState(null);
  const [vasStep, setVasStep] = useState(1);
  const [copied, setCopied] = useState(false);

  const TABS = ["Hour-1 Bundle","Antibiotics","POCUS","Vasopressors"];
  const selAbx = ABX_DATA.find(a => a.id === src);

  const handleBack = () => onBack ? onBack() : navigate("/CriticalProtocolsPage");

  const copyAbx = () => {
    if (!selAbx) return;
    const txt = `Empiric ABX — ${selAbx.label}\nFirst-line: ${selAbx.primary}\nAlternative: ${selAbx.alt}${selAbx.note ? "\nNote: " + selAbx.note : ""}`;
    navigator.clipboard.writeText(txt).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const card = (x = {}) => ({ ...G(), padding: "14px 16px", ...x });
  const sL = { fontSize:10, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:T.teal, margin:"18px 0 10px", display:"flex", alignItems:"center", gap:8 };
  const pill = bg => ({ display:"inline-block", background:bg, borderRadius:6, padding:"3px 9px", fontSize:10, fontWeight:700, letterSpacing:"0.07em", textTransform:"uppercase", marginRight:6, marginBottom:10 });
  const tg = c => ({ display:"inline-block", background:c+"22", border:`1px solid ${c}44`, borderRadius:5, padding:"2px 8px", fontSize:10.5, fontWeight:600, color:c });
  const ch = (c, a) => ({ padding:"7px 14px", borderRadius:9, border:`1.5px solid ${a?c:T.border}`, background:a?c+"22":T.glass, color:a?c:T.muted, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:T.sans, transition:"all 0.15s", backdropFilter:"blur(8px)" });
  const aB = (c, mb = 10) => ({ background:c+"14", border:`1px solid ${c}40`, borderRadius:10, padding:"10px 14px", marginBottom:mb });
  const dv = { height:1, background:T.border, margin:"10px 0" };
  const nb = (c = T.teal) => ({ width:26, height:26, borderRadius:"50%", background:c+"22", border:`1.5px solid ${c}55`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:c, flexShrink:0 });
  const lMeta = {
    low: { label:"< 2 mmol/L", color:T.green, action:"Monitor · No immediate resuscitation required" },
    mid: { label:"2 – 4 mmol/L", color:T.gold, action:"Resuscitate · Repeat lactate q 2h · Target ≥ 10% reduction at 2h" },
    high: { label:"≥ 4 mmol/L", color:T.coral, action:"30 mL/kg aggressive IVF · Target ≥ 10% ↓ at 2h · High mortality risk" },
  };

  const B0 = (
    <div>
      <div style={aB(T.coral, 16)}><span style={{fontSize:12,fontWeight:700,color:T.coral}}>⏱ Time-Critical &nbsp;</span><span style={{fontSize:11.5,color:T.muted}}>Abx ≤ 1h if SHOCK or DEFINITE sepsis · ≤ 3h if POSSIBLE sepsis</span></div>
      <div style={sL}><span style={tg(T.teal)}>TAKE 3</span>What you measure</div>
      <div style={{...card(),display:"flex",gap:12,alignItems:"flex-start",marginBottom:10}}><div style={nb()}>1</div><div><div style={{fontSize:14,fontWeight:700,marginBottom:3}}>Blood Cultures</div><div style={{fontSize:11.5,color:T.muted,lineHeight:1.55}}>× 2 sets (aerobic + anaerobic) · Draw before antibiotics<br/><span style={{color:T.coral}}>Don't delay Abx &gt; 45 min waiting for cultures</span></div></div></div>
      <div style={{...card(),marginBottom:10}}>
        <div style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:10}}><div style={nb()}>2</div><div><div style={{fontSize:14,fontWeight:700,marginBottom:2}}>Lactate</div><div style={{fontSize:11.5,color:T.muted}}>Venous OK · Repeat at 2h / 4h / 6h if &gt; 2 mmol/L</div></div></div>
        <div style={{display:"flex",gap:6}}>
          {[{k:"low",label:"< 2",c:T.green},{k:"mid",label:"2 – 4",c:T.gold},{k:"high",label:"≥ 4",c:T.coral}].map(({k,label,c})=>(
            <button key={k} style={{...ch(c,lactate===k),flex:1}} onClick={()=>setLactate(lactate===k?null:k)}>{label}</button>
          ))}
        </div>
        {lactate && (<div style={{...aB(lMeta[lactate].color,0),marginTop:10}}><div style={{fontSize:11.5,fontWeight:700,color:lMeta[lactate].color,marginBottom:2}}>{lMeta[lactate].label}</div><div style={{fontSize:11.5,color:T.muted}}>{lMeta[lactate].action}</div></div>)}
      </div>
      <div style={{...card(),display:"flex",gap:12,alignItems:"flex-start",marginBottom:18}}><div style={nb()}>3</div><div><div style={{fontSize:14,fontWeight:700,marginBottom:3}}>Urine Output</div><div style={{fontSize:11.5,color:T.muted,lineHeight:1.55}}>Monitor q 1h · Target <span style={{fontFamily:T.mono,color:T.teal}}>≥ 0.5 mL/kg/h</span><br/>Consider Foley if not already placed</div></div></div>
      <div style={sL}><span style={tg(T.gold)}>GIVE 3</span>What you administer</div>
      <div style={{...card(),display:"flex",gap:12,alignItems:"flex-start",marginBottom:10}}><div style={nb(T.blue)}>4</div><div><div style={{fontSize:14,fontWeight:700,marginBottom:3}}>Oxygen</div><div style={{fontSize:11.5,color:T.muted,lineHeight:1.55}}>Target SpO₂ <span style={{fontFamily:T.mono,color:T.blue}}>≥ 94%</span><br/><span style={{color:T.gold}}>88–92% if COPD / hypercapnic respiratory failure</span></div></div></div>
      <div style={{...card(),display:"flex",gap:12,alignItems:"flex-start",marginBottom:10}}><div style={nb(T.blue)}>5</div><div><div style={{fontSize:14,fontWeight:700,marginBottom:3}}>IV Crystalloid</div><div style={{fontSize:11.5,color:T.muted,lineHeight:1.55}}><span style={{color:T.white,fontWeight:600}}>Balanced: LR or Plasma-Lyte</span><br/><span style={{fontFamily:T.mono,color:T.blue}}>30 mL/kg</span> over 3h — reassess after 1st liter<br/><span style={{color:T.gold}}>Titrate: stop if B-lines or fluid overload</span></div></div></div>
      <div style={{...card(),marginBottom:18}}><div style={{display:"flex",gap:12,alignItems:"flex-start"}}><div style={nb(T.blue)}>6</div><div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,marginBottom:3}}>IV Antibiotics</div><div style={{fontSize:11.5,color:T.muted,lineHeight:1.55,marginBottom:10}}><span style={{color:T.coral,fontWeight:600}}>≤ 1h</span> if SHOCK · <span style={{color:T.gold,fontWeight:600}}>≤ 3h</span> if possible sepsis<br/>Severe PCN allergy → aztreonam + vancomycin</div><button style={{...ch(T.teal,false),fontSize:11.5}} onClick={()=>setTab(1)}>View Empiric ABX by Source →</button></div></div></div>
      <div style={sL}><span style={tg(T.purple)}>ADJUNCTS 3</span>Alongside the bundle</div>
      {[{n:7,c:T.purple,title:"POCUS",sub:"Fluid responsiveness assessment",go:()=>setTab(2),btn:"Open →"},{n:8,c:T.gold,title:"Source Control",sub:"CT / US ASAP · Surgery or IR for abscess, perf, NF\n4 Ps: Phlegm · Pee · Pus · PICC",go:null},{n:9,c:T.coral,title:"IF SHOCK",sub:"MAP < 65 despite fluids → vasopressor ladder",go:()=>setTab(3),btn:"Ladder →",urgent:true}].map(({n,c,title,sub,go,btn,urgent})=>(
        <div key={n} style={{...card({marginBottom:10,...(urgent?{background:"rgba(244,63,94,0.07)",borderColor:"rgba(244,63,94,0.2)"}:{})})}}>
          <div style={{display:"flex",gap:12,alignItems:"flex-start"}}><div style={nb(c)}>{n}</div><div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,marginBottom:3}}>{title}</div><div style={{fontSize:11.5,color:T.muted,lineHeight:1.55,whiteSpace:"pre-line"}}>{sub}</div></div>{go&&<button style={{...ch(c,false),fontSize:11,flexShrink:0}} onClick={go}>{btn}</button>}</div>
        </div>
      ))}
    </div>
  );

  const B1 = (
    <div>
      <div style={aB(T.gold,14)}><span style={{fontSize:11.5,fontWeight:700,color:T.gold}}>Timing: </span><span style={{fontSize:11.5,color:T.muted}}>SHOCK → <span style={{color:T.coral,fontWeight:600}}>≤ 1h</span> · Definite sepsis → <span style={{color:T.gold,fontWeight:600}}>≤ 1h</span> · Possible → <span style={{color:T.green,fontWeight:600}}>≤ 3h</span></span></div>
      <div style={sL}>Select Suspected Source</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
        {ABX_DATA.map(a=>(<button key={a.id} style={{padding:"7px 14px",borderRadius:9,border:`1.5px solid ${src===a.id?a.color:T.border}`,background:src===a.id?a.bg:T.glass,color:src===a.id?a.color:T.muted,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:T.sans,transition:"all 0.15s",backdropFilter:"blur(8px)"}} onClick={()=>setSrc(src===a.id?null:a.id)}>{a.label}</button>))}
      </div>
      {!src ? (
        <div>
          <div style={{...G(),padding:"28px 16px",textAlign:"center",marginBottom:16}}><div style={{fontSize:32,marginBottom:8}}>💊</div><div style={{color:T.muted,fontSize:13}}>Select a suspected source above to view empiric regimen</div></div>
          <div style={sL}>All Empiric Regimens</div>
          {ABX_DATA.map(a=>(<div key={a.id} style={{...G(),padding:"12px 14px",marginBottom:8,borderLeft:`3px solid ${a.color}`}}><div style={{fontSize:12,fontWeight:700,color:a.color,marginBottom:5}}>{a.label}</div><div style={{fontFamily:T.mono,fontSize:11.5,color:T.teal,lineHeight:1.6}}>{a.primary}</div><div style={{fontFamily:T.mono,fontSize:11,color:T.gold,marginTop:2}}>alt: {a.alt}</div></div>))}
        </div>
      ) : selAbx && (
        <div>
          <div style={{...G(),padding:"16px",marginBottom:12,border:`1.5px solid ${selAbx.color}55`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><span style={{...tg(selAbx.color),fontSize:13,padding:"4px 12px"}}>{selAbx.label}</span><button onClick={copyAbx} style={{padding:"6px 14px",borderRadius:7,border:`1px solid ${T.teal}40`,background:copied?"rgba(20,184,166,0.2)":T.glass,color:copied?T.teal:T.muted,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:T.sans}}>{copied?"✓ Copied":"⎘ Copy Order"}</button></div>
            <div style={{marginBottom:12}}><div style={{fontSize:10,fontWeight:700,color:T.muted,letterSpacing:"0.09em",textTransform:"uppercase",marginBottom:6}}>First-Line</div><div style={{fontFamily:T.mono,fontSize:13,color:T.teal,lineHeight:1.7}}>{selAbx.primary}</div></div>
            <div style={dv}/>
            <div style={{marginBottom:selAbx.note?12:0}}><div style={{fontSize:10,fontWeight:700,color:T.muted,letterSpacing:"0.09em",textTransform:"uppercase",marginBottom:6}}>Alternative</div><div style={{fontFamily:T.mono,fontSize:12,color:T.gold,lineHeight:1.7}}>{selAbx.alt}</div></div>
            {selAbx.note && <div style={{...aB(T.coral,0),marginTop:10}}><div style={{fontSize:11.5,color:T.coral}}>{selAbx.note}</div></div>}
          </div>
          <div style={card()}><div style={{fontSize:10.5,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Always Consider</div>{["+ Vancomycin if MRSA risk (abscess, IVDU, prior MRSA, healthcare exposure)","β-lactam allergy (severe) → aztreonam + vancomycin","De-escalate at 48–72h based on cultures & sensitivities"].map((n,i)=>(<div key={i} style={{fontSize:11.5,color:T.muted,paddingLeft:10,borderLeft:`2px solid ${T.border}`,lineHeight:1.5,marginBottom:i<2?7:0}}>{n}</div>))}</div>
        </div>
      )}
    </div>
  );

  const B2 = (
    <div>
      {[{label:"CARDIAC",color:T.teal,findings:[{f:"Hyperdynamic + small LV",a:"Give fluid",c:T.green},{f:"Poor EF (depressed function)",a:"Consider Dobutamine",c:T.gold},{f:"RV dilated · D-sign on parasternal",a:"? PE / RV failure — Hold fluid",c:T.coral}]},{label:"IVC",color:T.blue,findings:[{f:"< 1 cm or > 50% collapse on sniff",a:"Fluid responsive",c:T.green},{f:"> 2 cm or < 50% collapse",a:"Stop / Diurese",c:T.coral}]},{label:"LUNG ULTRASOUND",color:T.purple,findings:[{f:"A-lines (dry lungs)",a:"Can tolerate fluid",c:T.green},{f:"B-lines (wet / pulmonary edema)",a:"Stop / Diurese",c:T.coral}]}].map(({label,color,findings})=>(<div key={label}><div style={sL}><span style={tg(color)}>{label}</span></div>{findings.map(({f,a,c})=>(<div key={f} style={{...card({marginBottom:8}),display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}><div style={{fontSize:12,color:T.muted,flex:1,lineHeight:1.4}}>{f}</div><div style={{...tg(c),whiteSpace:"nowrap"}}>→ {a}</div></div>))}</div>))}
      <div style={sL}>REASSESS — After 1st Liter / 30 Min</div>
      <div style={{display:"grid",gap:10}}>
        <div style={{...card({background:"rgba(34,197,94,0.07)",borderColor:"rgba(34,197,94,0.25)"})}}>
          <div style={{fontSize:10.5,fontWeight:700,color:T.green,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:10}}>✓ Targets (all required)</div>
          {["MAP ≥ 65 mmHg on fluids alone","Lactate improving (≥ 10% ↓ at 2h)","UO ≥ 0.5 mL/kg/h · CRT < 3s · Intact mentation"].map((t,i)=>(<div key={i} style={{fontSize:12,color:T.muted,marginBottom:5,display:"flex",gap:8}}><span style={{color:T.green}}>●</span>{t}</div>))}
        </div>
        <div style={{...card({background:"rgba(244,63,94,0.07)",borderColor:"rgba(244,63,94,0.25)"})}}>
          <div style={{fontSize:10.5,fontWeight:700,color:T.coral,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:10}}>⚠ Triggers → Refractory Protocol</div>
          {["MAP < 65 despite 30 mL/kg IVF","Lactate not falling ≥ 10% at 2h (or rising)","Vasopressor-dependent"].map((t,i)=>(<div key={i} style={{fontSize:12,color:T.muted,marginBottom:5,display:"flex",gap:8,alignItems:"center"}}><span style={{color:T.coral}}>●</span>{t}{i===2&&<button style={{...ch(T.coral,false),fontSize:11,marginLeft:"auto"}} onClick={()=>setTab(3)}>Ladder →</button>}</div>))}
        </div>
      </div>
    </div>
  );

  const B3 = (
    <div>
      <div style={aB(T.coral,16)}><div style={{fontSize:12,fontWeight:700,color:T.coral,marginBottom:2}}>REFRACTORY SEPTIC SHOCK</div><div style={{fontSize:11.5,color:T.muted}}>MAP &lt; 65 despite adequate IVF resuscitation · Tap each step to mark active</div></div>
      <div style={sL}>Vasopressor Ladder</div>
      {PRESSOR_STEPS.map(({step,drug,dose,color,bg,trigger,titrate})=>(
        <div key={step} style={{...G(),padding:"14px 16px",marginBottom:10,border:`1.5px solid ${vasStep>=step?color+"66":T.border}`,background:vasStep>=step?bg:T.glass,cursor:"pointer",transition:"all 0.2s"}} onClick={()=>setVasStep(step)}>
          <div style={{display:"flex",gap:12,alignItems:"center"}}>
            <div style={{width:32,height:32,borderRadius:"50%",background:vasStep>=step?color+"28":T.glass,border:`2.5px solid ${vasStep>=step?color:T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:vasStep>=step?color:T.dim,flexShrink:0,transition:"all 0.2s"}}>{step}</div>
            <div style={{flex:1}}>
              <div style={{fontFamily:T.mono,fontSize:14,fontWeight:700,color:vasStep>=step?color:T.muted,letterSpacing:"0.05em",transition:"color 0.2s"}}>{drug}</div>
              <div style={{fontFamily:T.mono,fontSize:13,color:vasStep>=step?T.white:T.dim,marginTop:2,transition:"color 0.2s"}}>{dose}</div>
            </div>
            {vasStep<step&&<div style={{fontSize:11,color:T.dim}}>tap to activate</div>}
          </div>
          {vasStep>=step&&(<div style={{marginTop:10,paddingLeft:44}}><div style={{fontSize:11.5,color:T.muted,marginBottom:3}}><span style={{color,fontWeight:600}}>Trigger: </span>{trigger}</div><div style={{fontSize:11.5,color:T.dim}}>{titrate}</div></div>)}
        </div>
      ))}
      <div style={sL}>Add-On Agents</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <div style={{...card({background:"rgba(245,158,11,0.08)",borderColor:"rgba(245,158,11,0.3)"})}}>
          <div style={{fontFamily:T.mono,fontSize:12,fontWeight:700,color:T.gold,marginBottom:4}}>HYDROCORTISONE</div>
          <div style={{fontFamily:T.mono,fontSize:13,color:T.white,marginBottom:6}}>50 mg IV q 6h</div>
          <div style={{fontSize:11,color:T.muted}}>If ≥ 2 pressors &gt; 4h · Adrenal insufficiency</div>
        </div>
        <div style={{...card({background:"rgba(59,130,246,0.08)",borderColor:"rgba(59,130,246,0.3)"})}}>
          <div style={{fontFamily:T.mono,fontSize:12,fontWeight:700,color:T.blue,marginBottom:4}}>DOBUTAMINE</div>
          <div style={{fontFamily:T.mono,fontSize:13,color:T.white,marginBottom:6}}>2 – 20 mcg/kg/min</div>
          <div style={{fontSize:11,color:T.muted}}>Cardiogenic shock · Poor EF on POCUS</div>
        </div>
      </div>
      <div style={{...card({marginTop:10})}}>
        <div style={{fontSize:10.5,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Clinical Pearls</div>
        {["Central access: CVC + arterial line · Peripheral pressors safe while awaiting","Source control ≤ 6h if emergent (perf, NF, abscess) · ≤ 12h elective","Not responding? Think: adrenal crisis · PE/tamponade · cardiogenic (MI) · anaphylaxis · lactic acidosis · undrained source"].map((n,i)=>(<div key={i} style={{fontSize:11.5,color:T.muted,paddingLeft:10,borderLeft:`2px solid ${T.border}`,lineHeight:1.5,marginBottom:i<2?7:0}}>{n}</div>))}
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:`radial-gradient(ellipse 70% 45% at 15% 0%, rgba(20,184,166,0.10) 0%, transparent 65%), radial-gradient(ellipse 50% 35% at 85% 95%, rgba(244,63,94,0.08) 0%, transparent 55%), ${T.bg}`,fontFamily:T.sans,color:T.white,paddingBottom:80}}>
      <div style={{padding:"20px 20px 0"}}>
        <button onClick={handleBack} style={{display:"flex",alignItems:"center",gap:5,background:"none",border:"none",color:T.teal,fontSize:13,fontFamily:T.sans,cursor:"pointer",padding:"4px 0",marginBottom:16}}>← Critical Protocols</button>
        <div>
          <span style={pill("linear-gradient(135deg,#f43f5e,#be185d)")}>🔴 Critical</span>
          <span style={pill("linear-gradient(135deg,#0d9488,#065f46)")}>SSC 2021</span>
        </div>
        <h1 style={{fontFamily:T.serif,fontSize:26,fontWeight:700,margin:"0 0 4px",lineHeight:1.15}}>Sepsis Hour-1 Bundle</h1>
        <p style={{color:T.muted,fontSize:12,margin:"0 0 20px"}}>Surviving Sepsis Campaign · Initiate all elements in parallel on recognition</p>
      </div>
      <div style={{display:"flex",gap:4,padding:"0 20px",marginBottom:18,overflowX:"auto",scrollbarWidth:"none"}}>
        {TABS.map((t,i)=>(<button key={t} style={{padding:"7px 15px",borderRadius:9,border:`1.5px solid ${tab===i?T.teal:T.border}`,background:tab===i?"rgba(20,184,166,0.14)":T.glass,color:tab===i?T.teal:T.muted,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:T.sans,whiteSpace:"nowrap",transition:"all 0.18s",backdropFilter:"blur(8px)"}} onClick={()=>setTab(i)}>{t}</button>))}
      </div>
      <div style={{padding:"0 20px"}}>
        {tab===0&&B0}{tab===1&&B1}{tab===2&&B2}{tab===3&&B3}
      </div>
    </div>
  );
}