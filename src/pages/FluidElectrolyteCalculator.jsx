import { useState, useMemo } from "react";

(() => {
  if (document.getElementById("fec-css")) return;
  const l = document.createElement("link"); l.id = "fec-f"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "fec-css";
  s.textContent = `
    *{box-sizing:border-box;}
    @keyframes fecIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
    .fec-in{animation:fecIn .22s ease both;}
    .fec-hov:hover{border-color:rgba(0,180,216,.5)!important;background:rgba(0,180,216,.06)!important;}
    ::-webkit-scrollbar{width:3px;}
    ::-webkit-scrollbar-thumb{background:rgba(0,180,216,.25);border-radius:2px;}
    input::placeholder{color:rgba(221,230,240,.2);}
    input:focus{border-color:rgba(0,180,216,.6)!important;outline:none;}
    select option{background:#0d1b2e;}
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
  orange:"#ff9f43", oD:"rgba(255,159,67,0.12)",
  blue:"#3b9eff", bD:"rgba(59,158,255,0.12)",
  txt:"#dde6f0", mut:"rgba(221,230,240,0.55)", dim:"rgba(221,230,240,0.28)",
};
const gl  = (x={}) => ({backdropFilter:"blur(14px)",background:T.card,border:`1px solid ${T.bdr}`,borderRadius:12,...x});
const ib  = (x={}) => ({background:"rgba(13,27,46,.8)",border:`1px solid ${T.bdr}`,borderRadius:8,padding:"8px 12px",color:T.txt,fontFamily:"DM Sans,sans-serif",fontSize:13,transition:"border-color .15s",width:"100%",...x});
const lbl = (t) => <div style={{fontSize:8,color:T.dim,fontFamily:"JetBrains Mono,monospace",letterSpacing:1,textTransform:"uppercase",marginBottom:4,fontWeight:700}}>{t}</div>;
const num = (v,u,c=T.teal,sz=28) => (
  <div style={{fontFamily:"JetBrains Mono,monospace",fontWeight:700,fontSize:sz,color:c,lineHeight:1}}>
    {v!==null&&v!==undefined&&!isNaN(v)?v:"-"}<span style={{fontSize:sz*0.45,color:c+"99",marginLeft:4}}>{u}</span>
  </div>
);

const Row = ({label,value,unit,color=T.teal,note}) => (
  <div style={{...gl({padding:"10px 14px",borderLeft:`3px solid ${color}`,background:`${color}08`})}}>
    <div style={{fontSize:8,color:T.dim,fontFamily:"JetBrains Mono,monospace",letterSpacing:1,textTransform:"uppercase",marginBottom:3}}>{label}</div>
    {note&&<div style={{fontSize:10,color:T.dim,marginBottom:3}}>{note}</div>}
    {num(value,unit,color,20)}
  </div>
);

const Section = ({title,color,icon,children}) => (
  <div style={{...gl({padding:"16px 18px",marginBottom:14,borderLeft:`4px solid ${color}`})}}>
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
      <span style={{fontSize:18}}>{icon}</span>
      <span style={{fontFamily:"Playfair Display,serif",fontSize:16,fontWeight:700,color}}>{title}</span>
    </div>
    {children}
  </div>
);

const Field = ({label,value,onChange,unit,placeholder,width=120}) => (
  <div style={{width}}>
    {lbl(label)}
    <div style={{position:"relative"}}>
      <input type="number" value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder||"—"}
        style={{...ib({paddingRight:unit?28:12})}} />
      {unit&&<span style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",fontSize:9,color:T.dim,pointerEvents:"none"}}>{unit}</span>}
    </div>
  </div>
);

function SodiumCalc() {
  const [wt,setWt]=useState(""); const [sex,setSex]=useState("M");
  const [na,setNa]=useState(""); const [targetNa,setTargetNa]=useState("125");
  const [fluid,setFluid]=useState("ns"); const [osmRisk,setOsmRisk]=useState(false);

  const TBW = useMemo(()=>{
    if(!wt) return null;
    return parseFloat(wt)*(sex==="M"?0.6:0.5);
  },[wt,sex]);

  const results = useMemo(()=>{
    if(!TBW||!na||!targetNa) return null;
    const curNa=parseFloat(na), tgtNa=parseFloat(targetNa);
    const deficit = TBW*(tgtNa-curNa);
    const fluidNa = {ns:154,"half-ns":77,"3pct":513,"lr":130}[fluid]||154;
    const corrRate = osmRisk?8:10;
    const volPer24h = corrRate>0?(corrRate*TBW/(fluidNa-curNa))*1000:null;
    return {deficit:deficit.toFixed(0),corrRate,volPer24h:volPer24h?volPer24h.toFixed(0):null,TBW:TBW.toFixed(1)};
  },[TBW,na,targetNa,fluid,osmRisk]);

  const sevColor = na?(parseFloat(na)<120?T.coral:parseFloat(na)<130?T.gold:T.green):T.dim;

  return(
    <Section title="Sodium / Hyponatremia" color={T.blue} icon="🧂">
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:12}}>
        <Field label="Weight" value={wt} onChange={setWt} unit="kg" width={110}/>
        <div style={{width:80}}>
          {lbl("Sex")}
          <div style={{display:"flex",gap:3}}>
            {["M","F"].map(s=><button key={s} onClick={()=>setSex(s)} style={{flex:1,padding:"7px 4px",borderRadius:7,cursor:"pointer",border:`1px solid ${sex===s?T.blue+"55":T.bdr}`,background:sex===s?T.bD:"transparent",color:sex===s?T.blue:T.mut,fontFamily:"JetBrains Mono,monospace",fontSize:12,fontWeight:700}}>{s}</button>)}
          </div>
        </div>
        <Field label="Current Na" value={na} onChange={setNa} unit="mEq/L" width={130}/>
        <Field label="Target Na" value={targetNa} onChange={setTargetNa} unit="mEq/L" width={130}/>
      </div>
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:12,alignItems:"flex-end"}}>
        <div>
          {lbl("Replacement Fluid")}
          <select value={fluid} onChange={e=>setFluid(e.target.value)} style={{...ib({width:200,cursor:"pointer"})}}>
            <option value="ns">Normal Saline (154 mEq/L)</option>
            <option value="half-ns">0.45% NaCl (77 mEq/L)</option>
            <option value="3pct">3% NaCl (513 mEq/L)</option>
            <option value="lr">Lactated Ringer (130 mEq/L)</option>
          </select>
        </div>
        <button onClick={()=>setOsmRisk(p=>!p)} style={{padding:"7px 13px",borderRadius:7,cursor:"pointer",border:`1px solid ${osmRisk?T.coral+"55":T.bdr}`,background:osmRisk?T.cD:"transparent",color:osmRisk?T.coral:T.mut,fontSize:12,fontWeight:700,fontFamily:"DM Sans,sans-serif"}}>
          {osmRisk?"✓ Osmotic Demyelination Risk":"ODS Risk (limit to 8 mEq/L/24h)"}
        </button>
      </div>
      {na&&<div style={{fontSize:11,color:sevColor,fontWeight:700,marginBottom:10}}>Na {na} mEq/L: {parseFloat(na)<120?"Severe — ICU monitoring":parseFloat(na)<130?"Moderate":"Mild"}</div>}
      {results&&(
        <div className="fec-in" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:8}}>
          <Row label="TBW" value={results.TBW} unit="L" color={T.dim}/>
          <Row label="Na Deficit" value={results.deficit} unit="mEq" color={T.blue}/>
          <Row label="Max Rate" value={results.corrRate} unit="mEq/L/24h" color={T.gold} note={osmRisk?"ODS risk limit":"Standard limit"}/>
          {results.volPer24h&&<Row label="Volume/24h" value={results.volPer24h} unit="mL" color={T.teal} note={`${fluid.toUpperCase()} to correct ${results.corrRate} mEq/L`}/>}
        </div>
      )}
      <div style={{fontSize:10,color:T.dim,marginTop:10,lineHeight:1.6}}>⚠ Rate limit: 10-12 mEq/L/24h (8 mEq/L if alcoholism, malnutrition, hypokalemia, or liver disease). Recheck Na q4-6h. Formula: Na deficit = TBW × (target Na - current Na)</div>
    </Section>
  );
}

function FreeWaterCalc() {
  const [wt,setWt]=useState(""); const [sex,setSex]=useState("M");
  const [na,setNa]=useState(""); const [rate,setRate]=useState("10");

  const TBW=useMemo(()=>wt?parseFloat(wt)*(sex==="M"?0.6:0.5):null,[wt,sex]);
  const results=useMemo(()=>{
    if(!TBW||!na) return null;
    const fwd=TBW*((parseFloat(na)/140)-1);
    const d5wPer24h=rate?((parseFloat(rate)/1)*TBW/((parseFloat(na)/140)-1))*1000/((parseFloat(na)-140)/parseFloat(rate)):null;
    return {fwd:fwd.toFixed(1),d5wPer24h:d5wPer24h&&d5wPer24h>0?Math.abs(d5wPer24h).toFixed(0):null};
  },[TBW,na,rate]);

  return(
    <Section title="Free Water Deficit (Hypernatremia)" color={T.orange} icon="💧">
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:12}}>
        <Field label="Weight" value={wt} onChange={setWt} unit="kg" width={110}/>
        <div style={{width:80}}>
          {lbl("Sex")}
          <div style={{display:"flex",gap:3}}>
            {["M","F"].map(s=><button key={s} onClick={()=>setSex(s)} style={{flex:1,padding:"7px 4px",borderRadius:7,cursor:"pointer",border:`1px solid ${sex===s?T.orange+"55":T.bdr}`,background:sex===s?T.oD:"transparent",color:sex===s?T.orange:T.mut,fontFamily:"JetBrains Mono,monospace",fontSize:12,fontWeight:700}}>{s}</button>)}
          </div>
        </div>
        <Field label="Current Na" value={na} onChange={setNa} unit="mEq/L" width={130}/>
        <Field label="Correction Rate" value={rate} onChange={setRate} unit="mEq/L/24h" width={160}/>
      </div>
      {results&&(
        <div className="fec-in" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:8}}>
          <Row label="TBW" value={TBW?.toFixed(1)} unit="L" color={T.dim}/>
          <Row label="Free Water Deficit" value={results.fwd} unit="L" color={T.orange}/>
          {results.d5wPer24h&&<Row label="D5W / 24h" value={results.d5wPer24h} unit="mL" color={T.teal} note="To correct at set rate"/>}
        </div>
      )}
      <div style={{fontSize:10,color:T.dim,marginTop:10,lineHeight:1.6}}>Max correction: 10 mEq/L/24h. Rapid correction risks cerebral edema. Formula: FWD = TBW × (Na/140 - 1)</div>
    </Section>
  );
}

function PotassiumCalc() {
  const [k,setK]=useState("");

  const guidance=useMemo(()=>{
    if(!k) return null;
    const kv=parseFloat(k);
    if(kv>=3.5) return {sev:"Normal",c:T.green,rx:"No replacement needed if ≥3.5 mEq/L",route:"—",dose:"—"};
    if(kv>=3.0) return {sev:"Mild Hypokalemia",c:T.gold,rx:"40-80 mEq oral KCl (prefer oral if tolerating)",route:"PO preferred",dose:"KCl 20-40 mEq PO q2-4h (max 40 mEq per dose PO)"};
    if(kv>=2.5) return {sev:"Moderate Hypokalemia",c:T.gold,rx:"80-120 mEq IV/PO over 4-8h; cardiac monitoring",route:"IV or PO",dose:"KCl 10-20 mEq/hr IV (peripheral: max 10 mEq/hr; central: up to 20 mEq/hr)"};
    return {sev:"Severe Hypokalemia",c:T.coral,rx:"IV replacement with continuous cardiac monitoring; ICU level care",route:"IV only",dose:"KCl 20 mEq/hr IV via central line (peripheral ≤10 mEq/hr); supplement magnesium"};
  },[k]);

  return(
    <Section title="Potassium Replacement" color={T.green} icon="🫀">
      <div style={{display:"flex",gap:10,marginBottom:12}}>
        <Field label="Serum Potassium" value={k} onChange={setK} unit="mEq/L" width={160}/>
      </div>
      {guidance&&(
        <div className="fec-in">
          <div style={{...gl({padding:"12px 16px",marginBottom:10,borderLeft:`4px solid ${guidance.c}`,background:`${guidance.c}0d`})}}>
            <div style={{fontSize:11,fontWeight:700,color:guidance.c,marginBottom:4}}>{guidance.sev}</div>
            <div style={{fontSize:12,color:T.txt,marginBottom:8}}>{guidance.rx}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <div><div style={{fontSize:9,color:T.dim,marginBottom:2}}>Route</div><div style={{fontSize:12,color:T.mut}}>{guidance.route}</div></div>
              <div><div style={{fontSize:9,color:T.dim,marginBottom:2}}>Dose</div><div style={{fontSize:12,color:T.mut}}>{guidance.dose}</div></div>
            </div>
          </div>
          {parseFloat(k)<3.0&&<div style={{...gl({padding:"9px 12px",background:T.oD,borderLeft:`3px solid ${T.orange}`}),fontSize:11,color:T.orange}}>⚠ Check and replace magnesium (Mg target &gt;2.0 mEq/L) — hypomagnesemia causes refractory hypokalemia. Also check phosphate and calcium.</div>}
        </div>
      )}
      <div style={{fontSize:10,color:T.dim,marginTop:10,lineHeight:1.6}}>Rough estimate: each 0.1 mEq/L below 4.0 ≈ 100 mEq total body deficit (highly variable). Recheck K+ after every 40 mEq replacement. Peripheral IV max: 10 mEq/hr.</div>
    </Section>
  );
}

function BicarbCalc() {
  const [wt,setWt]=useState(""); const [hco3,setHco3]=useState("");
  const [target,setTarget]=useState("15"); const [give,setGive]=useState("half");

  const results=useMemo(()=>{
    if(!wt||!hco3) return null;
    const deficit=0.5*parseFloat(wt)*(parseFloat(target)-parseFloat(hco3));
    const dose=give==="half"?deficit/2:deficit/3;
    const amps50=Math.ceil(dose/50);
    return {deficit:deficit.toFixed(0),dose:dose.toFixed(0),amps50};
  },[wt,hco3,target,give]);

  const ph=hco3?(parseFloat(hco3)<10?"<7.1 — Critical acidemia":parseFloat(hco3)<15?"7.1-7.2 — Severe":parseFloat(hco3)<20?"7.2-7.3 — Moderate":"Mild acidemia"):"";

  return(
    <Section title="Bicarbonate / Metabolic Acidosis" color={T.purple} icon="⚗️">
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:12}}>
        <Field label="Weight" value={wt} onChange={setWt} unit="kg" width={110}/>
        <Field label="Current HCO3" value={hco3} onChange={setHco3} unit="mEq/L" width={140}/>
        <Field label="Target HCO3" value={target} onChange={setTarget} unit="mEq/L" width={140}/>
        <div>
          {lbl("Give")}
          <div style={{display:"flex",gap:4}}>
            {[["half","1/2 deficit"],["third","1/3 deficit"]].map(([k,l])=>(
              <button key={k} onClick={()=>setGive(k)} style={{padding:"7px 12px",borderRadius:7,cursor:"pointer",border:`1px solid ${give===k?T.purple+"55":T.bdr}`,background:give===k?T.pD:"transparent",color:give===k?T.purple:T.mut,fontSize:11,fontWeight:700,fontFamily:"DM Sans,sans-serif"}}>{l}</button>
            ))}
          </div>
        </div>
      </div>
      {hco3&&<div style={{fontSize:11,color:parseFloat(hco3)<15?T.coral:T.gold,fontWeight:700,marginBottom:10}}>{ph}</div>}
      {results&&parseFloat(results.deficit)>0&&(
        <div className="fec-in" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:8}}>
          <Row label="Total Deficit" value={results.deficit} unit="mEq" color={T.purple}/>
          <Row label="Dose to Give" value={results.dose} unit="mEq" color={T.teal}/>
          <Row label="8.4% NaHCO3 Amps" value={results.amps50} unit="amps (50 mEq)" color={T.gold} note="50 mEq per 50 mL amp"/>
        </div>
      )}
      {results&&parseFloat(results.deficit)<=0&&<div style={{fontSize:11,color:T.green}}>No deficit — HCO3 at or above target</div>}
      <div style={{fontSize:10,color:T.dim,marginTop:10,lineHeight:1.6}}>{"Give 1/2 to 1/3 of deficit over 4-8h; recheck ABG. pH <7.1 or HCO3 <8 with hemodynamic compromise = consider sodium bicarb. Formula: deficit = 0.5 × wt × (target - current HCO3)"}</div>
    </Section>
  );
}

function AnionGapCalc() {
  const [na,setNa]=useState(""); const [cl,setCl]=useState(""); const [hco3,setHco3]=useState("");
  const [albumin,setAlbumin]=useState("4");

  const results=useMemo(()=>{
    if(!na||!cl||!hco3) return null;
    const ag=parseFloat(na)-(parseFloat(cl)+parseFloat(hco3));
    const corrAG=albumin?ag+2.5*(4-parseFloat(albumin)):ag;
    const deltaAG=corrAG-12;
    const deltaBicarb=24-parseFloat(hco3);
    const deltaRatio=deltaBicarb>0?deltaAG/deltaBicarb:null;
    return {ag:ag.toFixed(0),corrAG:corrAG.toFixed(0),deltaRatio:deltaRatio?deltaRatio.toFixed(2):null,deltaAG:deltaAG.toFixed(0),deltaBicarb:deltaBicarb.toFixed(0)};
  },[na,cl,hco3,albumin]);

  const agInterp=results?parseFloat(results.corrAG)>12?"Elevated AG (>12) — HAGMA present":"Normal AG — consider non-AG causes (NAGMA)":"";
  const drInterp=results?.deltaRatio?(parseFloat(results.deltaRatio)<0.4?"<0.4: Normal AG metabolic acidosis (hyperchloremic)":parseFloat(results.deltaRatio)<=0.8?"0.4-0.8: Mixed HAGMA + NAGMA":parseFloat(results.deltaRatio)<=2?"1-2: Pure HAGMA (expected HCO3 compensation)":">2: HAGMA + concurrent metabolic alkalosis"):"";

  return(
    <Section title="Anion Gap + Delta-Delta" color={T.gold} icon="📊">
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:12}}>
        <Field label="Na" value={na} onChange={setNa} unit="mEq/L" width={110}/>
        <Field label="Cl" value={cl} onChange={setCl} unit="mEq/L" width={110}/>
        <Field label="HCO3" value={hco3} onChange={setHco3} unit="mEq/L" width={110}/>
        <Field label="Albumin (AG correction)" value={albumin} onChange={setAlbumin} unit="g/dL" width={180}/>
      </div>
      {results&&(
        <div className="fec-in">
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:8,marginBottom:10}}>
            <Row label="Anion Gap" value={results.ag} unit="mEq/L" color={parseFloat(results.ag)>12?T.coral:T.green}/>
            <Row label="Corrected AG" value={results.corrAG} unit="mEq/L" color={parseFloat(results.corrAG)>12?T.coral:T.green} note="Albumin-corrected"/>
            {results.deltaRatio&&<Row label="Delta Ratio" value={results.deltaRatio} unit="" color={T.gold}/>}
          </div>
          {agInterp&&<div style={{...gl({padding:"9px 13px",marginBottom:8,borderLeft:`3px solid ${parseFloat(results.corrAG)>12?T.coral:T.green}`}),fontSize:12,color:T.txt}}>{agInterp}</div>}
          {drInterp&&<div style={{...gl({padding:"9px 13px",borderLeft:`3px solid ${T.gold}`}),fontSize:12,color:T.txt}}>{drInterp}</div>}
        </div>
      )}
      <div style={{fontSize:10,color:T.dim,marginTop:10,lineHeight:1.6}}>AG = Na - (Cl + HCO3); Normal 8-12. Corrected AG = AG + 2.5 × (4 - albumin). Delta-delta ratio = (AG-12) / (24-HCO3). HAGMA differential: MUD PILES (Methanol, Uremia, DKA, Propylene glycol, INH/Iron, Lactic acidosis, Ethylene glycol, Salicylates).</div>
    </Section>
  );
}

function OsmolalityCalc() {
  const [na,setNa]=useState(""); const [bun,setBun]=useState(""); const [gluc,setGluc]=useState("");
  const [etoh,setEtoh]=useState(""); const [measured,setMeasured]=useState("");

  const results=useMemo(()=>{
    if(!na) return null;
    const calc=2*parseFloat(na)+(bun?parseFloat(bun)/2.8:0)+(gluc?parseFloat(gluc)/18:0)+(etoh?parseFloat(etoh)/4.6:0);
    const gap=measured?parseFloat(measured)-calc:null;
    return {calc:calc.toFixed(1),gap:gap?gap.toFixed(1):null};
  },[na,bun,gluc,etoh,measured]);

  const gapInterp=results?.gap?(parseFloat(results.gap)>10?"Elevated osmol gap (>10) — consider toxic alcohols (methanol, ethylene glycol, isopropanol)":"Normal osmol gap (<10)"):"";

  return(
    <Section title="Serum Osmolality + Osmol Gap" color={T.teal} icon="🔬">
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:12}}>
        <Field label="Na" value={na} onChange={setNa} unit="mEq/L" width={110}/>
        <Field label="BUN" value={bun} onChange={setBun} unit="mg/dL" width={110}/>
        <Field label="Glucose" value={gluc} onChange={setGluc} unit="mg/dL" width={120}/>
        <Field label="EtOH (if known)" value={etoh} onChange={setEtoh} unit="mg/dL" width={150}/>
        <Field label="Measured Osm" value={measured} onChange={setMeasured} unit="mOsm/kg" width={160}/>
      </div>
      {results&&(
        <div className="fec-in">
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:8,marginBottom:10}}>
            <Row label="Calculated Osm" value={results.calc} unit="mOsm/kg" color={T.teal}/>
            {results.gap&&<Row label="Osmol Gap" value={results.gap} unit="mOsm/kg" color={parseFloat(results.gap)>10?T.coral:T.green}/>}
          </div>
          {gapInterp&&<div style={{...gl({padding:"9px 13px",borderLeft:`3px solid ${parseFloat(results.gap||0)>10?T.coral:T.green}`}),fontSize:12,color:T.txt}}>{gapInterp}</div>}
        </div>
      )}
      <div style={{fontSize:10,color:T.dim,marginTop:10,lineHeight:1.6}}>Calc = 2×Na + BUN/2.8 + Glucose/18 (+ EtOH/4.6). Normal serum osmolality: 275-295 mOsm/kg. Osmol gap &gt;10 suggests osmotically active substance not measured (toxic alcohols, mannitol).</div>
    </Section>
  );
}

export default function FluidElectrolyteCalculator() {
  const [active,setActive]=useState("na");
  const CALCS=[["na","🧂 Sodium"],["fwd","💧 Free Water"],["k","🫀 Potassium"],["bicarb","⚗️ Bicarb"],["ag","📊 Anion Gap"],["osm","🔬 Osmolality"]];

  return(
    <div style={{background:T.bg,minHeight:"100vh",padding:"20px 18px 60px",fontFamily:"DM Sans,sans-serif",color:T.txt}}>
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:22}}>
        <div style={{width:44,height:44,borderRadius:11,background:T.tD,border:`1px solid ${T.tB}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>⚗️</div>
        <div>
          <h1 style={{margin:0,fontFamily:"Playfair Display,serif",fontSize:22,color:T.teal,letterSpacing:"-0.5px",lineHeight:1}}>Fluid & Electrolyte Calculator</h1>
          <p style={{margin:"3px 0 0",fontSize:12,color:T.mut}}>Sodium deficit · Free water · Potassium · Bicarb · Anion Gap · Osmolality</p>
        </div>
      </div>

      <div style={{display:"flex",gap:5,marginBottom:22,flexWrap:"wrap"}}>
        {CALCS.map(([k,l])=>(
          <button key={k} onClick={()=>setActive(k)} style={{padding:"7px 14px",borderRadius:8,border:`1px solid ${active===k?T.teal+"55":T.bdr}`,background:active===k?T.tD:"transparent",color:active===k?T.teal:T.mut,fontFamily:"DM Sans,sans-serif",fontSize:12,fontWeight:700,cursor:"pointer",transition:"all .16s"}}>{l}</button>
        ))}
      </div>

      <div style={{maxWidth:700}} className="fec-in">
        {active==="na"    &&<SodiumCalc/>}
        {active==="fwd"   &&<FreeWaterCalc/>}
        {active==="k"     &&<PotassiumCalc/>}
        {active==="bicarb"&&<BicarbCalc/>}
        {active==="ag"    &&<AnionGapCalc/>}
        {active==="osm"   &&<OsmolalityCalc/>}
      </div>

      <div style={{marginTop:40,textAlign:"center"}}>
        <span style={{fontFamily:"JetBrains Mono,monospace",fontSize:9,color:T.dim,letterSpacing:1.5}}>NOTRYA · FLUID & ELECTROLYTE CALCULATOR · VERIFY ALL RESULTS CLINICALLY · NOT A SUBSTITUTE FOR CLINICAL JUDGMENT</span>
      </div>
    </div>
  );
}