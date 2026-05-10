import { useState } from "react";

const P = {
  bg:"#0a1628",bgD:"#060e1a",glass:"rgba(255,255,255,0.055)",gb:"rgba(0,188,212,0.18)",
  teal:"#00bcd4",tL:"rgba(0,188,212,0.14)",gold:"#ffd700",gL:"rgba(255,215,0,0.1)",
  red:"#ff5252",rL:"rgba(255,82,82,0.12)",grn:"#69f0ae",gnL:"rgba(105,240,174,0.1)",
  amber:"#ffab40",aL:"rgba(255,171,64,0.1)",txt:"#e8eef7",dim:"#7a8fa6",
  purple:"#ce93d8",pL:"rgba(206,147,216,0.1)",coral:"#ff7043",
};
const PL="'Playfair Display',Georgia,serif";
const DM="'DM Sans',system-ui,sans-serif";
const MO="'JetBrains Mono','Courier New',monospace";

const glassPanel=(extra={})=>({background:P.glass,border:`1px solid ${P.gb}`,backdropFilter:"blur(12px)",borderRadius:12,padding:"16px 20px",...extra});
const inp={background:"rgba(0,0,0,0.35)",border:`1px solid ${P.gb}`,borderRadius:8,color:P.txt,fontFamily:MO,fontSize:14,padding:"8px 12px",width:"100%",outline:"none",boxSizing:"border-box"};
const lbl={display:"block",fontFamily:DM,fontSize:11,color:P.dim,marginBottom:4,letterSpacing:"0.06em",textTransform:"uppercase"};
const Btn=({active,color=P.teal,onClick,children,style={}})=>(
  <button onClick={onClick} style={{background:active?color:"rgba(255,255,255,0.07)",border:`1px solid ${active?color:"rgba(255,255,255,0.12)"}`,borderRadius:8,color:active?(color===P.gold?"#0a1628":"#fff"):P.dim,cursor:"pointer",fontFamily:DM,fontSize:13,fontWeight:600,padding:"7px 18px",transition:"all 0.18s",...style}}>{children}</button>
);
const StepCard=({num,label,children,color=P.teal})=>(
  <div style={{...glassPanel(),marginBottom:10,borderLeft:`3px solid ${color}`}}>
    <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
      <span style={{fontFamily:MO,fontSize:10,color,border:`1px solid ${color}`,borderRadius:"50%",minWidth:20,height:20,display:"inline-flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{num}</span>
      <div style={{flex:1}}>
        <div style={{fontFamily:DM,fontSize:11,color:P.dim,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:5}}>{label}</div>
        {children}
      </div>
    </div>
  </div>
);
const Pill=({text,color})=>(
  <span style={{background:`${color}22`,border:`1px solid ${color}44`,borderRadius:6,color,fontFamily:DM,fontSize:11,fontWeight:700,padding:"2px 9px",letterSpacing:"0.04em"}}>{text}</span>
);
const ValRow=({label:rl,value,unit="",color=P.gold})=>(
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:"1px solid rgba(255,255,255,0.05)",flexWrap:"wrap",gap:4}}>
    <span style={{fontFamily:DM,fontSize:12,color:P.dim}}>{rl}</span>
    <span style={{fontFamily:MO,fontSize:13,color,textAlign:"right"}}>{value}<span style={{fontSize:11,color:P.dim,marginLeft:4}}>{unit}</span></span>
  </div>
);
const AlertBox=({text,color=P.amber})=>(
  <div style={{background:`${color}18`,border:`1px solid ${color}44`,borderRadius:8,padding:"9px 14px",marginTop:8,display:"flex",alignItems:"flex-start",gap:8}}>
    <span style={{color,fontSize:13,flexShrink:0}}>⚠</span>
    <span style={{fontFamily:DM,fontSize:12,color:P.txt,lineHeight:1.5}}>{text}</span>
  </div>
);
const FG=({label:fl,value,onChange,placeholder="",half=false})=>(
  <div style={{flex:half?"1 1 calc(50% - 6px)":"1 1 100%"}}>
    <div style={lbl}>{fl}</div>
    <input style={inp} type="number" value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>
  </div>
);
const Row=({children})=>(<div style={{display:"flex",gap:10,flexWrap:"wrap"}}>{children}</div>);
const SectionHead=({title})=>(<div style={{fontFamily:PL,fontSize:17,color:P.gold,margin:"20px 0 10px"}}>{title}</div>);

// ─── ABG LOGIC ────────────────────────────────────────────────────────────────
function interpretABG(pH,pCO2,HCO3,Na,Cl,isVBG,respType){
  const aPH=isVBG?+pH+0.035:+pH;
  const aPCO2=isVBG?+pCO2-6:+pCO2;
  const hco3=+HCO3;
  const pHStatus=aPH<7.35?"Acidemia":aPH>7.45?"Alkalemia":"Normal pH";
  let disorder="Normal";
  if(aPH<7.35){
    if(hco3<22&&aPCO2>45)disorder="Mixed: MetAcid + RespAcid";
    else if(hco3<22)disorder="Metabolic Acidosis";
    else if(aPCO2>45)disorder="Respiratory Acidosis";
    else disorder="Acidemia — unclear primary";
  }else if(aPH>7.45){
    if(hco3>26&&aPCO2<35)disorder="Mixed: MetAlk + RespAlk";
    else if(hco3>26)disorder="Metabolic Alkalosis";
    else if(aPCO2<35)disorder="Respiratory Alkalosis";
    else disorder="Alkalemia — unclear primary";
  }else{
    if(hco3<22&&aPCO2<35)disorder="Mixed: MetAcid + RespAlk (normalized pH)";
    else if(hco3>26&&aPCO2>45)disorder="Mixed: MetAlk + RespAcid (normalized pH)";
  }
  let comp=null,compStatus="";
  if(disorder==="Metabolic Acidosis"){const exp=1.5*hco3+8;comp={label:"Expected pCO2 (Winters)",exp:exp.toFixed(1),low:(exp-2).toFixed(1),high:(exp+2).toFixed(1),measured:aPCO2.toFixed(1)};compStatus=aPCO2>exp+2?"Inadequate → concurrent Resp Acidosis":aPCO2<exp-2?"Excessive → concurrent Resp Alkalosis":"Appropriate respiratory compensation";}
  else if(disorder==="Metabolic Alkalosis"){const exp=0.7*hco3+21;comp={label:"Expected pCO2",exp:exp.toFixed(1),low:(exp-5).toFixed(1),high:(exp+5).toFixed(1),measured:aPCO2.toFixed(1)};compStatus=aPCO2>exp+5?"Inadequate → concurrent Resp Acidosis":aPCO2<exp-5?"Excessive → concurrent Resp Alkalosis":"Appropriate respiratory compensation";}
  else if(disorder==="Respiratory Acidosis"){const expA=24+(aPCO2-40)*0.1,expC=24+(aPCO2-40)*0.35,exp=respType==="chronic"?expC:expA;comp={label:`Expected HCO3 (${respType})`,exp:exp.toFixed(1),low:(exp-2).toFixed(1),high:(exp+2).toFixed(1),measured:hco3.toFixed(1),acute:expA.toFixed(1),chronic:expC.toFixed(1)};compStatus=hco3>exp+2?"Excess HCO3 → concurrent Metabolic Alkalosis":hco3<exp-2?"Insufficient HCO3 → concurrent Metabolic Acidosis":"Appropriate metabolic compensation";}
  else if(disorder==="Respiratory Alkalosis"){const expA=24-(40-aPCO2)*0.2,expC=24-(40-aPCO2)*0.5,exp=respType==="chronic"?expC:expA;comp={label:`Expected HCO3 (${respType})`,exp:exp.toFixed(1),low:(exp-2).toFixed(1),high:(exp+2).toFixed(1),measured:hco3.toFixed(1),acute:expA.toFixed(1),chronic:expC.toFixed(1)};compStatus=hco3<exp-2?"Excess HCO3 drop → concurrent Metabolic Acidosis":hco3>exp+2?"Insufficient HCO3 drop → concurrent Metabolic Alkalosis":"Appropriate metabolic compensation";}
  let ag=null,agInterp="",dd=null,ddInterp="";
  if(Na&&Cl){ag=+Na-(+Cl+hco3);agInterp=ag>12?"Elevated AG (HAGMA)":ag<6?"Low AG (hypoalbuminemia / IgG paraprotein)":"Normal AG";if(ag>12&&disorder==="Metabolic Acidosis"){dd=(ag-12)/(24-hco3);ddInterp=dd<0.4?"Pure NAGMA (hyperchloremic)":dd<1?"Mixed HAGMA + NAGMA":dd<=2?"Pure HAGMA":"HAGMA + concurrent Metabolic Alkalosis";}}
  return{aPH,aPCO2,pHStatus,disorder,comp,compStatus,ag,agInterp,dd,ddInterp};
}

// ─── ABG TAB ─────────────────────────────────────────────────────────────────
function ABGTab(){
  const[mode,setMode]=useState("abg");
  const[respType,setRespType]=useState("acute");
  const[v,setV]=useState({pH:"",pCO2:"",HCO3:"",Na:"",Cl:""});
  const[result,setResult]=useState(null);
  // Osmolar Gap state
  const[og,setOg]=useState({mOsm:"",oNa:"",glu:"",bun:"",etoh:""});
  // Urine Osm Gap state
  const[uog,setUog]=useState({uOsm:"",uNa:"",uK:""});
  const set=k=>val=>setV(p=>({...p,[k]:val}));
  const setO=k=>val=>setOg(p=>({...p,[k]:val}));
  const setU=k=>val=>setUog(p=>({...p,[k]:val}));

  const run=()=>{if(!v.pH||!v.pCO2||!v.HCO3)return;setResult(interpretABG(v.pH,v.pCO2,v.HCO3,v.Na,v.Cl,mode==="vbg",respType));};
  const dc=d=>{if(!d||d==="Normal")return P.grn;if(d.toLowerCase().includes("acid"))return P.red;if(d.toLowerCase().includes("alk"))return P.amber;return P.teal;};
  const ddx={"Metabolic Acidosis":{ha:"MUDPILES — Methanol • Uremia • DKA • Propylene glycol • Isoniazid/Iron • Lactic acidosis • Ethylene glycol • Salicylates",na:"HARDUPS — Hyperalimentation • Acetazolamide • RTA • Diarrhea • Ureteroenteric fistula • Pancreatic fistula • Saline excess"},"Metabolic Alkalosis":"Vomiting/NG suction • Diuretics • Hyperaldosteronism • Post-hypercapnia • Contraction alkalosis","Respiratory Acidosis":"COPD exacerbation • Pneumonia • Neuromuscular disease • Opioid overdose • Obesity hypoventilation • Chest wall deformity","Respiratory Alkalosis":"Anxiety/hyperventilation • PE • Pneumonia • Hepatic failure • Salicylate toxicity • Mechanical overventilation • Altitude"};

  // Osmolar gap calc
  const ogCalc=()=>{
    const{mOsm,oNa,glu,bun,etoh}=og;
    if(!mOsm||!oNa)return null;
    const calc=2*(+oNa)+(glu?(+glu)/18:0)+(bun?(+bun)/2.8:0)+(etoh?(+etoh)/4.6:0);
    const gap=+mOsm-calc;
    let interp="",color=P.grn,causes="";
    if(gap<10){interp="Normal osmolar gap";color=P.grn;causes="Osmolar gap <10 is normal. If metabolic acidosis present without gap elevation, consider HAGMA without unmeasured osmole (DKA with ketonuria, lactic acidosis).";}
    else if(gap<20){interp="Borderline elevated gap";color=P.amber;causes="Gap 10–20: borderline. Consider: early toxic alcohol ingestion, mannitol, propylene glycol (lorazepam drip). Correlate with ABG and clinical context.";}
    else{interp="Elevated osmolar gap (>20)";color=P.red;causes="MUDPILES toxic screen: Methanol (fruity/formic acid odor, visual changes) • Ethylene glycol (oxalate crystals in urine, renal failure) • Isopropanol (no anion gap, ketones without acidosis) • Propylene glycol (ICU sedation) • Mannitol • Ethanol (if not entered)";}
    return{calc:calc.toFixed(1),gap:gap.toFixed(1),interp,color,causes};
  };
  const ogR=ogCalc();

  // Urine osmolal gap
  const uogCalc=()=>{
    const{uOsm,uNa,uK}=uog;
    if(!uOsm||!uNa||!uK)return null;
    const calc=2*(+uNa+(+uK));
    const gap=+uOsm-calc;
    let interp="",color=P.grn,detail="";
    if(gap>100){interp="High urine osmolal gap (>100)";color=P.amber;detail="Osmotic diuresis: glucosuria, mannitol, urea, sorbitol. Non-electrolyte solutes driving urine concentration. Check urine glucose and recent medications.";}
    else{interp="Low urine osmolal gap (<100)";color=P.teal;detail="Water diuresis: diabetes insipidus (central or nephrogenic) or primary polydipsia. Kidney appropriately eliminating free water without osmotic solutes.";}
    return{calc:calc.toFixed(0),gap:gap.toFixed(0),interp,color,detail};
  };
  const uogR=uogCalc();

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
        <Btn active={mode==="abg"} onClick={()=>setMode("abg")}>ABG</Btn>
        <Btn active={mode==="vbg"} onClick={()=>setMode("vbg")}>VBG</Btn>
        {mode==="vbg"&&<span style={{fontFamily:DM,fontSize:12,color:P.amber}}>Offset: pH +0.035 | pCO2 ±6 mmHg</span>}
        <div style={{marginLeft:"auto",display:"flex",gap:6}}>
          <Btn active={respType==="acute"} onClick={()=>setRespType("acute")} style={{fontSize:12,padding:"5px 13px"}}>Acute</Btn>
          <Btn active={respType==="chronic"} onClick={()=>setRespType("chronic")} style={{fontSize:12,padding:"5px 13px"}}>Chronic</Btn>
        </div>
      </div>
      <Row>
        <FG label="pH" value={v.pH} onChange={set("pH")} placeholder="7.35 – 7.45" half/>
        <FG label="pCO2 (mmHg)" value={v.pCO2} onChange={set("pCO2")} placeholder="35 – 45" half/>
        <FG label="HCO3 (mEq/L)" value={v.HCO3} onChange={set("HCO3")} placeholder="22 – 26" half/>
        <FG label="Na — optional for AG" value={v.Na} onChange={set("Na")} placeholder="135 – 145" half/>
        <FG label="Cl — optional for AG" value={v.Cl} onChange={set("Cl")} placeholder="98 – 106" half/>
      </Row>
      <Btn active onClick={run} style={{alignSelf:"flex-start",padding:"9px 26px",fontSize:14}}>Interpret ABG/VBG</Btn>
      {result&&(
        <div>
          {mode==="vbg"&&<div style={{...glassPanel({marginBottom:10}),background:`${P.amber}12`,borderColor:`${P.amber}44`}}><span style={{fontFamily:DM,fontSize:12,color:P.amber}}>Estimated arterial: pH ≈ {result.aPH.toFixed(3)} | pCO2 ≈ {result.aPCO2.toFixed(0)} mmHg</span></div>}
          <StepCard num={1} label="pH Status" color={dc(result.pHStatus)}><div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}><Pill text={result.pHStatus} color={dc(result.pHStatus)}/><span style={{fontFamily:MO,fontSize:14,color:P.txt}}>pH {result.aPH.toFixed(3)}</span></div></StepCard>
          <StepCard num={2} label="Primary Disorder" color={dc(result.disorder)}>
            <Pill text={result.disorder} color={dc(result.disorder)}/>
            {result.disorder==="Metabolic Acidosis"&&result.ag!==null&&result.ag>12&&<div style={{fontFamily:DM,fontSize:11,color:P.dim,marginTop:6,lineHeight:1.5}}>{ddx["Metabolic Acidosis"].ha}</div>}
            {result.disorder==="Metabolic Acidosis"&&result.ag!==null&&result.ag<=12&&<div style={{fontFamily:DM,fontSize:11,color:P.dim,marginTop:6,lineHeight:1.5}}>{ddx["Metabolic Acidosis"].na}</div>}
            {result.disorder==="Metabolic Acidosis"&&!result.ag&&<div style={{fontFamily:DM,fontSize:11,color:P.dim,marginTop:6}}>Enter Na + Cl to calculate AG and classify HAGMA vs NAGMA</div>}
            {ddx[result.disorder]&&typeof ddx[result.disorder]==="string"&&<div style={{fontFamily:DM,fontSize:11,color:P.dim,marginTop:6,lineHeight:1.5}}>{ddx[result.disorder]}</div>}
          </StepCard>
          {result.comp&&(
            <StepCard num={3} label="Expected Compensation" color={P.teal}>
              <ValRow label={result.comp.label} value={`${result.comp.low} – ${result.comp.high}`} unit="expected range"/>
              <ValRow label="Measured" value={result.comp.measured} color={P.txt}/>
              {result.comp.acute&&<div style={{display:"flex",gap:18,marginTop:5}}><span style={{fontFamily:DM,fontSize:11,color:P.dim}}>Acute: {result.comp.acute}</span><span style={{fontFamily:DM,fontSize:11,color:P.dim}}>Chronic: {result.comp.chronic}</span></div>}
              <div style={{marginTop:8}}><Pill text={result.compStatus} color={result.compStatus.includes("Appropriate")?P.grn:P.amber}/></div>
            </StepCard>
          )}
          {result.ag!==null&&(
            <StepCard num={4} label="Anion Gap" color={result.ag>12?P.red:P.grn}>
              <ValRow label="AG = Na − (Cl + HCO3)" value={result.ag.toFixed(1)} unit="mEq/L" color={result.ag>12?P.red:P.grn}/>
              <div style={{marginTop:6}}><Pill text={result.agInterp} color={result.ag>12?P.red:P.grn}/></div>
              {result.dd!==null&&<div style={{marginTop:10}}><ValRow label="Delta-Delta ratio" value={result.dd.toFixed(2)} color={P.teal}/><div style={{marginTop:6}}><Pill text={result.ddInterp} color={P.teal}/></div></div>}
            </StepCard>
          )}
        </div>
      )}

      <SectionHead title="Osmolar Gap"/>
      <div style={glassPanel()}>
        <div style={{fontFamily:DM,fontSize:12,color:P.dim,marginBottom:12}}>Calc Osm = 2×Na + Glucose/18 + BUN/2.8 + Ethanol/4.6 | Normal gap &lt;10</div>
        <Row>
          <FG label="Measured Osm (mOsm/kg)" value={og.mOsm} onChange={setO("mOsm")} placeholder="280 – 295" half/>
          <FG label="Serum Na (mEq/L)" value={og.oNa} onChange={setO("oNa")} placeholder="135 – 145" half/>
          <FG label="Glucose (mg/dL)" value={og.glu} onChange={setO("glu")} placeholder="optional" half/>
          <FG label="BUN (mg/dL)" value={og.bun} onChange={setO("bun")} placeholder="optional" half/>
          <FG label="Ethanol (mg/dL)" value={og.etoh} onChange={setO("etoh")} placeholder="optional — if known" half/>
        </Row>
        {ogR&&(
          <div style={{marginTop:14}}>
            <ValRow label="Calculated Osm" value={ogR.calc} unit="mOsm/kg" color={P.teal}/>
            <ValRow label="Osmolar Gap" value={ogR.gap} unit="mOsm/kg" color={ogR.color}/>
            <div style={{marginTop:8}}><Pill text={ogR.interp} color={ogR.color}/></div>
            <div style={{fontFamily:DM,fontSize:12,color:P.dim,marginTop:8,lineHeight:1.6}}>{ogR.causes}</div>
          </div>
        )}
      </div>

      <SectionHead title="Urine Osmolal Gap"/>
      <div style={glassPanel()}>
        <div style={{fontFamily:DM,fontSize:12,color:P.dim,marginBottom:12}}>UOG = Urine Osm − 2×(Urine Na + Urine K) | Distinguishes osmotic vs water diuresis</div>
        <Row>
          <FG label="Urine Osm (mOsm/kg)" value={uog.uOsm} onChange={setU("uOsm")} placeholder="spot urine" half/>
          <FG label="Urine Na (mEq/L)" value={uog.uNa} onChange={setU("uNa")} placeholder="spot" half/>
          <FG label="Urine K (mEq/L)" value={uog.uK} onChange={setU("uK")} placeholder="spot" half/>
        </Row>
        {uogR&&(
          <div style={{marginTop:14}}>
            <ValRow label="Electrolyte contribution 2×(UNa+UK)" value={uogR.calc} unit="mOsm/kg" color={P.teal}/>
            <ValRow label="Urine Osmolal Gap" value={uogR.gap} unit="mOsm/kg" color={uogR.color}/>
            <div style={{marginTop:8}}><Pill text={uogR.interp} color={uogR.color}/></div>
            <div style={{fontFamily:DM,fontSize:12,color:P.dim,marginTop:8,lineHeight:1.6}}>{uogR.detail}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ELECTROLYTES TAB ────────────────────────────────────────────────────────
function ElectrolytesTab(){
  const[sub,setSub]=useState("k");
  const[K,setK]=useState("");const[access,setAccess]=useState("peripheral");
  const[curNa,setCurNa]=useState("");const[naWt,setNaWt]=useState("");const[sex,setSex]=useState("m");const[naChron,setNaChron]=useState("chronic");
  const[totCa,setTotCa]=useState("");const[albumin,setAlbumin]=useState("");const[mg,setMg]=useState("");
  const[phos,setPhos]=useState("");const[ua,setUa]=useState("");const[phosWt,setPhosWt]=useState("");

  const kVal=parseFloat(K);
  const kProt=()=>{
    if(!kVal||kVal>=3.5)return kVal>=3.5?{level:"Normal",color:P.grn,dose:"No replacement indicated",rate:"—",monitor:"Routine"}:null;
    if(kVal>=3.0)return{level:"Mild Hypokalemia",color:P.amber,dose:"40 mEq PO preferred; or 20 mEq IV in 100mL over 2h",rate:"10 mEq/hr peripheral",monitor:"Recheck in 4–6h"};
    if(kVal>=2.5)return{level:"Moderate Hypokalemia",color:"#ff7043",dose:"40–60 mEq IV; replace Mg2+ concurrently (MgSO4 2g IV)",rate:access==="central"?"20 mEq/hr central":"10 mEq/hr peripheral (max)",monitor:"Continuous telemetry · recheck q2–4h"};
    return{level:"Severe Hypokalemia",color:P.red,dose:"60–80 mEq IV; central access preferred; always correct Mg2+",rate:access==="central"?"20–40 mEq/hr central":"10 mEq/hr peripheral — obtain central access",monitor:"Continuous telemetry · recheck q1–2h · ICU consideration"};
  };
  const kR=kProt();

  const naR=()=>{const na=parseFloat(curNa),w=parseFloat(naWt);if(!na||!w)return null;const tbw=w*(sex==="m"?0.6:0.5);const deficit=tbw*(140-na);return{tbw:tbw.toFixed(1),deficit:deficit.toFixed(0),maxDay:naChron==="chronic"?"8–10 mEq/L":"1–2 mEq/hr; max 8–10 mEq"};};
  const naResult=naR();

  const corrCa=()=>{const ca=parseFloat(totCa),alb=parseFloat(albumin);if(!ca||!alb)return null;const corr=ca+0.8*(4-alb);return{corrected:corr.toFixed(2),low:corr<8.5,high:corr>10.5};};
  const caR=corrCa();
  const mgVal=parseFloat(mg);

  // Phosphorus & Uric Acid logic
  const phosVal=parseFloat(phos);
  const uaVal=parseFloat(ua);
  const phosProtocol=()=>{
    if(!phosVal)return null;
    if(phosVal>=2.5&&phosVal<=4.5)return{level:"Normal",color:P.grn,dose:"No replacement",note:"Normal range 2.5–4.5 mg/dL",route:""};
    if(phosVal<1.0)return{level:"Severe Hypophosphatemia (<1.0)",color:P.red,dose:"IV only: Na-Phos or K-Phos 0.32–0.64 mmol/kg IV over 4–6h (max 20–40 mmol/dose)",note:"Risk: hemolytic anemia, respiratory failure (diaphragm weakness), rhabdo, seizures, cardiac dysfunction. ICU monitoring.",route:"IV preferred"};
    if(phosVal<2.0)return{level:"Moderate Hypophosphatemia (1.0–1.9)",color:"#ff7043",dose:"Moderate symptoms: Neutra-Phos or K-Phos IV 0.16–0.32 mmol/kg over 4–6h | Asymptomatic: Neutra-Phos PO 250–500mg TID",note:"Causes: DKA (esp. during treatment), refeeding syndrome, alcoholism, antacid overuse, malabsorption, hyperparathyroidism.",route:"IV or PO based on symptoms"};
    if(phosVal<2.5)return{level:"Mild Hypophosphatemia (2.0–2.4)",color:P.amber,dose:"PO: Neutra-Phos 250–500mg (8–16 mmol) 3–4× daily with meals",note:"Oral preferred. Avoid aluminum-containing antacids which bind phosphorus. Recheck in 24–48h.",route:"PO"};
    return{level:"Hyperphosphatemia (>4.5)",color:P.coral,dose:"Dietary phosphate restriction (<800 mg/day) | PO phosphate binders: calcium carbonate or sevelamer with meals | HD if refractory + severe CKD",note:"Causes: CKD, hypoparathyroidism, TLS, rhabdomyolysis, acidosis. Check Ca×Phos product (>55 risk of vascular calcification).",route:"Dietary + binders"};
  };
  const phosR=phosProtocol();

  const uaInterp=()=>{
    if(!uaVal)return null;
    if(uaVal<=6.0)return{level:"Normal uric acid",color:P.grn,note:"Normal <6 mg/dL in women, <7 mg/dL in men. No action needed."};
    if(uaVal<=8.0)return{level:"Mild hyperuricemia",color:P.amber,note:"Monitor. Consider hydration. Allopurinol if recurrent gout or TLS risk. Check medications (diuretics, low-dose ASA)."};
    if(uaVal<=10.0)return{level:"Moderate hyperuricemia",color:"#ff7043",note:"Aggressive hydration 200–250 mL/hr. Allopurinol 300 mg/day (prophylaxis) or rasburicase 0.2 mg/kg IV (therapeutic, G6PD screen first). Screen for TLS if malignancy context."};
    return{level:"Severe hyperuricemia (>10) — TLS concern",color:P.red,note:"Rasburicase 0.2 mg/kg IV (G6PD screen first — hemolysis risk). Aggressive hydration 2–3 L/m². Do NOT alkalinize urine with rasburicase. Check uric acid q4–6h. Nephrology consult."};
  };
  const uaR=uaInterp();

  return(
    <div>
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        {[["k","Potassium"],["na","Sodium Deficit"],["ca","Calcium / Mg"],["phos","Phos / Uric Acid"]].map(([id,title])=>(
          <Btn key={id} active={sub===id} onClick={()=>setSub(id)}>{title}</Btn>
        ))}
      </div>

      {sub==="k"&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Row>
            <FG label="Serum K (mEq/L)" value={K} onChange={setK} placeholder="3.5 – 5.0" half/>
            <div style={{flex:"1 1 calc(50% - 6px)"}}>
              <div style={lbl}>IV Access</div>
              <div style={{display:"flex",gap:8}}>
                <Btn active={access==="peripheral"} onClick={()=>setAccess("peripheral")} style={{fontSize:12,padding:"6px 12px"}}>Peripheral</Btn>
                <Btn active={access==="central"} onClick={()=>setAccess("central")} style={{fontSize:12,padding:"6px 12px"}}>Central</Btn>
              </div>
            </div>
          </Row>
          {kR&&(
            <div style={{...glassPanel(),borderLeft:`3px solid ${kR.color}`}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,flexWrap:"wrap"}}><Pill text={kR.level} color={kR.color}/>{kVal&&<span style={{fontFamily:MO,fontSize:16,color:kR.color}}>K = {kVal.toFixed(1)} mEq/L</span>}</div>
              <ValRow label="Replacement" value={kR.dose} color={P.txt}/>
              <ValRow label="Max infusion rate" value={kR.rate} color={P.gold}/>
              <ValRow label="Monitoring" value={kR.monitor} color={P.teal}/>
              {kVal&&kVal<3.5&&<ValRow label="Est. deficit" value={`~${((3.5-kVal)*100).toFixed(0)}`} unit="mEq total body" color={P.amber}/>}
              <AlertBox text="Never give K IV push. Peripheral bag max: 40 mEq/L. Always replace Mg2+ concurrently — hypomagnesemia perpetuates hypokalemia."/>
            </div>
          )}
          <div style={glassPanel()}>
            <div style={{fontFamily:DM,fontSize:13,fontWeight:600,color:P.teal,marginBottom:8}}>Causes of Hypokalemia</div>
            {[["GI loss","Vomiting, NG suction, diarrhea, fistula"],["Renal loss","Loop/thiazide diuretics, hyperaldosteronism, RTA type I/II, Mg deficiency, Gitelman/Bartter"],["Transcellular shift","Insulin, alkalosis, beta-2 agonists, hypokalemic periodic paralysis"],["Poor intake","Elderly, alcoholism, anorexia — rarely sole cause"]].map(([cat,cause])=>(
              <div key={cat} style={{display:"flex",gap:8,padding:"5px 0",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                <span style={{fontFamily:DM,fontSize:12,fontWeight:600,color:P.gold,minWidth:130}}>{cat}</span>
                <span style={{fontFamily:DM,fontSize:12,color:P.dim}}>{cause}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {sub==="na"&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Row>
            <FG label="Current Na (mEq/L)" value={curNa} onChange={setCurNa} placeholder="< 135" half/>
            <FG label="Weight (kg)" value={naWt} onChange={setNaWt} placeholder="70" half/>
          </Row>
          <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
            <div><div style={lbl}>Sex</div><div style={{display:"flex",gap:8}}><Btn active={sex==="m"} onClick={()=>setSex("m")} style={{fontSize:12,padding:"6px 12px"}}>Male 60%</Btn><Btn active={sex==="f"} onClick={()=>setSex("f")} style={{fontSize:12,padding:"6px 12px"}}>Female 50%</Btn></div></div>
            <div><div style={lbl}>Duration</div><div style={{display:"flex",gap:8}}><Btn active={naChron==="acute"} onClick={()=>setNaChron("acute")} style={{fontSize:12,padding:"6px 12px"}}>Acute &lt;48h</Btn><Btn active={naChron==="chronic"} onClick={()=>setNaChron("chronic")} style={{fontSize:12,padding:"6px 12px"}}>Chronic / Unknown</Btn></div></div>
          </div>
          {naResult&&(
            <div style={glassPanel()}>
              <ValRow label="Total Body Water" value={naResult.tbw} unit="L"/>
              <ValRow label="Na Deficit (target 140)" value={naResult.deficit} unit="mEq" color={P.red}/>
              <ValRow label="Max correction" value={naResult.maxDay} unit="per 24h" color={P.amber}/>
              <div style={{marginTop:12,fontFamily:DM,fontSize:13,fontWeight:600,color:P.teal}}>3% NaCl (513 mEq Na/L)</div>
              <ValRow label="Symptomatic rescue" value="100 mL bolus IV × 2–3" unit="q10–20 min until sz/coma resolves" color={P.txt}/>
              <AlertBox text={naChron==="chronic"?"CHRONIC: Max 8–10 mEq/L/24h. Rapid correction → ODS. Overcorrected: D5W + DDAVP 2–4 mcg IV q8h to re-lower Na.":"ACUTE (<48h): May correct 1–2 mEq/hr. Total should not exceed 8–10 mEq/24h. Recheck Na q2h."} color={naChron==="chronic"?P.red:P.amber}/>
            </div>
          )}
        </div>
      )}

      {sub==="ca"&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Row>
            <FG label="Total Ca (mg/dL)" value={totCa} onChange={setTotCa} placeholder="8.5 – 10.5" half/>
            <FG label="Albumin (g/dL)" value={albumin} onChange={setAlbumin} placeholder="4.0" half/>
          </Row>
          {caR&&(
            <div style={{...glassPanel(),borderLeft:`3px solid ${caR.low?P.red:caR.high?P.amber:P.grn}`}}>
              <ValRow label="Corrected Ca" value={caR.corrected} unit="mg/dL" color={caR.low?P.red:caR.high?P.amber:P.grn}/>
              <div style={{marginTop:6}}><Pill text={caR.low?"Hypocalcemia":caR.high?"Hypercalcemia":"Normal corrected Ca"} color={caR.low?P.red:caR.high?P.amber:P.grn}/></div>
              {caR.low&&<div style={{marginTop:12}}><div style={{fontFamily:DM,fontSize:13,fontWeight:600,color:P.teal,marginBottom:8}}>Replacement</div><ValRow label="Symptomatic / Severe" value="Ca gluconate 1–2g IV over 10–20 min" unit="(repeat q10 min PRN)" color={P.txt}/><ValRow label="VFib / Tetany (emergent)" value="CaCl2 1g IV" unit="3× elemental Ca vs gluconate" color={P.red}/><ValRow label="Maintenance infusion" value="Ca gluconate 1–2g/hr" unit="titrate to iCa >1.1" color={P.txt}/><AlertBox text="CaCl2 extravasation → tissue necrosis. Use central line. Ca gluconate safer peripherally."/></div>}
              {caR.high&&<div style={{marginTop:12}}><ValRow label="Hypercalcemia — SCALP" value="Sarcoid/granuloma, Cancer, Adrenal insuff, Lithium, PTH/PTHrP" color={P.amber}/><ValRow label="Mild-moderate (10.5–12)" value="Aggressive NS hydration 200–300 mL/hr" unit="goal UO 100–150 mL/hr" color={P.txt}/><ValRow label="Severe (>12) or symptomatic" value="NS + loop diuretic + bisphosphonate (zoledronate 4mg IV)" color={P.txt}/><AlertBox text="If malignancy: denosumab or calcitonin 4 IU/kg SC q12h for rapid effect. Hemodialysis for refractory life-threatening hypercalcemia." color={P.amber}/></div>}
            </div>
          )}
          <div style={glassPanel()}>
            <div style={{fontFamily:DM,fontSize:13,fontWeight:600,color:P.teal,marginBottom:8}}>Magnesium Replacement</div>
            <Row><FG label="Serum Mg (mEq/L)" value={mg} onChange={setMg} placeholder="1.5 – 2.5" half/></Row>
            {[[1.5,99,P.amber,"Mild (1.5–1.8)","Mg oxide 400–800 mg PO BID; recheck q24h"],[1.0,1.5,"#ff7043","Moderate (1.0–1.5)","MgSO4 2g IV over 1h; repeat q4–6h PRN; check DTRs"],[0,1.0,P.red,"Severe (<1.0) / Symptomatic","MgSO4 4–8g IV over 4–8h; monitor DTRs, UO, respiratory rate, Mg q2h"]].map(([lo,hi,color,level,tx])=>{
              const mgV=parseFloat(mg);const active=mg&&mgV>=lo&&mgV<hi;
              return(<div key={level} style={{padding:"6px 0",borderBottom:"1px solid rgba(255,255,255,0.05)",opacity:mg&&!active?0.45:1}}><div style={{fontFamily:DM,fontSize:11,color,fontWeight:700,marginBottom:2}}>{level}</div><div style={{fontFamily:DM,fontSize:12,color:P.dim}}>{tx}</div></div>);
            })}
          </div>
        </div>
      )}

      {sub==="phos"&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <SectionHead title="Phosphorus"/>
          <Row>
            <FG label="Serum Phos (mg/dL)" value={phos} onChange={setPhos} placeholder="2.5 – 4.5" half/>
            <FG label="Weight (kg) — for IV dosing" value={phosWt} onChange={setPhosWt} placeholder="optional" half/>
          </Row>
          {phosR&&(
            <div style={{...glassPanel(),borderLeft:`3px solid ${phosR.color}`}}>
              <Pill text={phosR.level} color={phosR.color}/>
              <ValRow label="Replacement / Management" value={phosR.dose} color={P.txt}/>
              <ValRow label="Route" value={phosR.route||"—"} color={P.teal}/>
              <div style={{fontFamily:DM,fontSize:12,color:P.dim,marginTop:8,lineHeight:1.6}}>{phosR.note}</div>
              {phosVal<1.0&&phosWt&&<AlertBox text={`IV dose: ${(0.32*parseFloat(phosWt)).toFixed(1)}–${(0.64*parseFloat(phosWt)).toFixed(1)} mmol over 4–6h. Max 40 mmol/dose.`} color={P.red}/>}
            </div>
          )}
          <div style={glassPanel()}>
            <div style={{fontFamily:DM,fontSize:13,fontWeight:600,color:P.teal,marginBottom:8}}>Common Causes of Hypophosphatemia</div>
            {[["Refeeding syndrome","Carbs after starvation → insulin surge → intracellular shift; most severe in first 24–72h"],["DKA treatment","Insulin drives Phos intracellularly; losses via osmotic diuresis"],["Alcoholism","Poor intake + vomiting + renal wasting"],["Hyperparathyroidism","PTH increases renal Phos excretion"],["Antacid overuse","Al/Mg-containing antacids bind dietary Phos"],["Respiratory alkalosis","Hyperventilation → intracellular shift"]].map(([c,d])=>(
              <div key={c} style={{display:"flex",gap:8,padding:"5px 0",borderBottom:"1px solid rgba(255,255,255,0.05)"}}><span style={{fontFamily:DM,fontSize:12,fontWeight:600,color:P.gold,minWidth:170}}>{c}</span><span style={{fontFamily:DM,fontSize:12,color:P.dim}}>{d}</span></div>
            ))}
          </div>

          <SectionHead title="Uric Acid"/>
          <Row>
            <FG label="Serum Uric Acid (mg/dL)" value={ua} onChange={setUa} placeholder="Normal <6 F / <7 M" half/>
          </Row>
          {uaR&&(
            <div style={{...glassPanel(),borderLeft:`3px solid ${uaR.color}`}}>
              <Pill text={uaR.level} color={uaR.color}/>
              <div style={{fontFamily:DM,fontSize:12,color:P.dim,marginTop:8,lineHeight:1.6}}>{uaR.note}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── SODIUM DISORDERS TAB ────────────────────────────────────────────────────
function SodiumTab(){
  const[mode,setMode]=useState("hypo");
  const[serNa,setSerNa]=useState("");const[serOsm,setSerOsm]=useState("");const[urOsm,setUrOsm]=useState("");const[urNa,setUrNa]=useState("");const[glucose,setGlucose]=useState("");const[volStatus,setVolStatus]=useState("eu");const[duration,setDuration]=useState("unknown");const[weight,setWeight]=useState("");const[sexH,setSexH]=useState("m");const[result,setResult]=useState(null);
  // SIADH vs CSW
  const[bun,setBun]=useState("");const[uaCSW,setUaCSW]=useState("");const[feua,setFeua]=useState("");

  const interpretHypo=()=>{
    const na=parseFloat(serNa),sOsm=parseFloat(serOsm),uOsm=parseFloat(urOsm),uNa=parseFloat(urNa),glu=parseFloat(glucose);
    const steps=[];
    if(sOsm){
      if(sOsm>295){const corrNa=na+1.6*(glu-100)/100;steps.push({title:"Hypertonic Hyponatremia",color:P.amber,body:`Osmotically active solute present. Causes: hyperglycemia, mannitol, sorbitol.${glu?` Corrected Na = ${corrNa.toFixed(1)} mEq/L.`:" Enter glucose for corrected Na."}`});}
      else if(sOsm>=280){steps.push({title:"Isotonic — Pseudohyponatremia",color:P.amber,body:"Osmolar gap suggests artifact. Check: hypertriglyceridemia (>1500 mg/dL), hyperproteinemia (IgG myeloma). True Na normal. Confirm with direct ISE method."});}
      else{
        steps.push({title:"Hypotonic Hyponatremia confirmed",color:P.teal,body:"Serum Osm <280 mOsm/kg. True dilutional hyponatremia. Proceed to urine osmolality."});
        if(uOsm){
          if(uOsm<100){steps.push({title:"Urine Osm <100 — Maximal dilution",color:P.grn,body:"ADH appropriately suppressed. Causes: primary polydipsia (>3 L/day), beer potomania, reset osmostat. Urine output often >3 L/day."});}
          else{
            steps.push({title:`Urine Osm ${uOsm} — ADH active / Impaired dilution`,color:P.amber,body:"ADH active or renal inability to dilute. Continue to urine Na and volume status."});
            if(urNa!==""&&!isNaN(uNa)){
              if(uNa<20){steps.push({title:volStatus==="hypo"?"Low Urine Na + Hypovolemic — Non-renal loss":"Low Urine Na — Na-avid state",color:P.red,body:volStatus==="hypo"?"GI losses (vomiting, diarrhea, fistula), skin losses, third-spacing. Tx: isotonic saline.":"CHF, cirrhosis, nephrotic syndrome. Effective circulating volume low despite apparent euvolemia."});}
              else{const dx=volStatus==="hypo"?"Cerebral salt wasting, Addison disease, salt-wasting nephropathy, diuretics (check after 24–48h off).":"SIADH (Serum Osm <280, Urine Osm >100, Urine Na >40, euvolemic). Also: hypothyroidism, adrenal insufficiency.";steps.push({title:volStatus==="hypo"?"High Urine Na + Hypovolemic — Renal Na wasting":"High Urine Na + Euvolemic — SIADH vs CSW",color:P.teal,body:dx});}
            }
          }
        }
      }
    }else{steps.push({title:"Enter serum osmolality to begin",color:P.dim,body:"Serum Osm classifies hyponatremia as hypertonic, isotonic (pseudohyponatremia), or hypotonic."});}
    const mgmt=duration==="acute"?["Acute (<48h): Correct 1–2 mEq/hr; max 8–10 mEq total in 24h","Symptomatic (sz, coma): 3% NaCl 100 mL IV bolus × 2–3 until sx resolve, then slow","Asymptomatic: 0.5–1 mEq/hr correction rate"]:["Chronic/Unknown: MAX 8–10 mEq/L per 24h — ODS risk","Asymptomatic SIADH: free water restrict 800–1000 mL/day + treat underlying cause","If FWR fails: oral urea 15–30g/day, demeclocycline, or tolvaptan (monitor Na rate closely)","Overcorrection (>10 mEq/24h): relower with D5W ± DDAVP 2–4 mcg IV q8h"];
    if(volStatus==="hypo")mgmt.unshift("Hypovolemic: NS first — Na will self-correct. Monitor closely for overcorrection.");
    setResult({steps,mgmt});
  };

  const interpretHyper=()=>{
    const na=parseFloat(serNa),uOsmV=parseFloat(urOsm),w=parseFloat(weight);
    const steps=[];
    if(uOsmV){
      if(uOsmV<300){steps.push({title:"Urine Osm <300 — Diabetes Insipidus",color:P.red,body:"ADH absent or ineffective. DDAVP trial → response: Central DI (trauma, neurosurgery, meningitis, sarcoid). No response: Nephrogenic DI (lithium, demeclocycline, hypercalcemia, hypokalemia)."});}
      else if(uOsmV<800){steps.push({title:"Urine Osm 300–800 — Partial DI or osmotic diuresis",color:P.amber,body:"Partial central/nephrogenic DI, or osmotic diuresis (hyperglycemia, mannitol, urea, post-ATN). Check urine glucose."});}
      else{steps.push({title:"Urine Osm >800 — Extrarenal water loss",color:P.grn,body:"Kidney appropriately concentrating. Cause: inadequate free water intake or extrarenal losses (insensible, burns, fever, lactulose diarrhea). Increase free water."});}
    }
    if(na&&w){const tbw=w*(sexH==="m"?0.6:0.5);const fwd=tbw*(na/140-1);steps.push({title:"Free Water Deficit",color:P.teal,body:`TBW = ${tbw.toFixed(1)}L | FWD ≈ ${fwd.toFixed(1)}L | Replace at ~${(fwd/48).toFixed(1)} mL/hr (titrate). Recheck Na q4–6h.`});}
    const mgmt=["Max correction: 10–12 mEq/L per 24h; 0.5 mEq/hr in chronic hypernatremia","Replace with D5W IV or enteral free water (NG if NPO)","Rapid correction → cerebral edema risk in chronic hypernatremia","Central DI: DDAVP 1–2 mcg IV/SC q8–24h; titrate to UO and Na","Nephrogenic DI: amiloride (lithium-induced), HCTZ + low-Na diet, indomethacin","Treat underlying cause"];
    setResult({steps,mgmt});
  };

  // SIADH vs CSW comparison matrix
  const siadh_csw=[
    ["Volume status","Euvolemic (or slightly hypervolemic)","Hypovolemic","Volume exam — JVP, mucous membranes, skin turgor, orthostatics"],
    ["BUN","Normal or low (<12)","Elevated (prerenal >15)","Dehydration raises BUN in CSW"],
    ["Urine Na","High (>40 mEq/L)","High (>40 mEq/L)","Cannot differentiate on urine Na alone"],
    ["Serum uric acid","Low (<4 mg/dL) — SIADH suppresses proximal reabsorption","Normal or low","FEUrate more specific than FEUA"],
    ["FEUA","<11% (low) — key distinguisher","≥11% (elevated)","FEUA = (urine UA/serum UA)/(urine Cr/serum Cr) × 100"],
    ["Response to NS","Na rises transiently then falls (SIADH ADH persists)","Na rises and stays (volume repleted)","Diagnostic trial — monitor Na q2–4h"],
    ["Tx","Fluid restrict 800–1000 mL/day; oral urea; tolvaptan; treat cause","IV NS resuscitation; fludrocortisone 0.1–0.2 mg/day","Misdiagnosing CSW as SIADH → fluid restriction worsens volume depletion"],
  ];

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <Btn active={mode==="hypo"} color={P.teal} onClick={()=>{setMode("hypo");setResult(null);}}>Hyponatremia</Btn>
        <Btn active={mode==="hyper"} color={P.amber} onClick={()=>{setMode("hyper");setResult(null);}}>Hypernatremia</Btn>
        <Btn active={mode==="siadh"} color={P.purple} onClick={()=>{setMode("siadh");setResult(null);}}>SIADH vs CSW</Btn>
      </div>

      {(mode==="hypo"||mode==="hyper")&&(
        <>
          <Row>
            <FG label="Serum Na (mEq/L)" value={serNa} onChange={setSerNa} placeholder={mode==="hypo"?"< 135":"> 145"} half/>
            <FG label="Serum Osmolality (mOsm/kg)" value={serOsm} onChange={setSerOsm} placeholder="280 – 295" half/>
            <FG label="Urine Osmolality (mOsm/kg)" value={urOsm} onChange={setUrOsm} placeholder="spot urine" half/>
            {mode==="hypo"&&<FG label="Urine Na (mEq/L)" value={urNa} onChange={setUrNa} placeholder="spot urine Na" half/>}
            {mode==="hypo"&&<FG label="Serum Glucose (mg/dL)" value={glucose} onChange={setGlucose} placeholder="optional — corrected Na" half/>}
            {mode==="hyper"&&<FG label="Weight (kg)" value={weight} onChange={setWeight} placeholder="for FWD calc" half/>}
          </Row>
          {mode==="hypo"&&(
            <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
              <div><div style={lbl}>Volume Status</div><div style={{display:"flex",gap:6}}>{[["hypo","Hypovolemic"],["eu","Euvolemic"],["hyper","Hypervolemic"]].map(([val,title])=>(<Btn key={val} active={volStatus===val} onClick={()=>setVolStatus(val)} style={{fontSize:12,padding:"5px 11px"}}>{title}</Btn>))}</div></div>
              <div><div style={lbl}>Duration</div><div style={{display:"flex",gap:6}}><Btn active={duration==="acute"} onClick={()=>setDuration("acute")} style={{fontSize:12,padding:"5px 11px"}}>Acute &lt;48h</Btn><Btn active={duration!=="acute"} onClick={()=>setDuration("unknown")} style={{fontSize:12,padding:"5px 11px"}}>Chronic / Unknown</Btn></div></div>
            </div>
          )}
          {mode==="hyper"&&<div style={{display:"flex",gap:8,alignItems:"center"}}><div style={lbl}>Sex</div><Btn active={sexH==="m"} onClick={()=>setSexH("m")} style={{fontSize:12,padding:"5px 12px"}}>Male</Btn><Btn active={sexH==="f"} onClick={()=>setSexH("f")} style={{fontSize:12,padding:"5px 12px"}}>Female</Btn></div>}
          <Btn active onClick={mode==="hypo"?interpretHypo:interpretHyper} color={mode==="hypo"?P.teal:P.amber} style={{alignSelf:"flex-start",padding:"9px 26px",fontSize:14}}>{mode==="hypo"?"Analyze Hyponatremia":"Analyze Hypernatremia"}</Btn>
          {result&&(
            <div>
              {result.steps.map((s,i)=>(<StepCard key={i} num={i+1} label={s.title} color={s.color}><div style={{fontFamily:DM,fontSize:12,color:P.dim,lineHeight:1.6}}>{s.body}</div></StepCard>))}
              <div style={{...glassPanel(),borderLeft:`3px solid ${P.gold}`}}>
                <div style={{fontFamily:DM,fontSize:13,fontWeight:600,color:P.gold,marginBottom:8}}>Management</div>
                {result.mgmt.map((m,i)=>(<div key={i} style={{display:"flex",gap:8,padding:"4px 0",borderBottom:"1px solid rgba(255,255,255,0.05)"}}><span style={{color:P.gold,fontFamily:MO,fontSize:11,flexShrink:0}}>{i+1}.</span><span style={{fontFamily:DM,fontSize:12,color:P.txt,lineHeight:1.5}}>{m}</span></div>))}
              </div>
            </div>
          )}
        </>
      )}

      {mode==="siadh"&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{fontFamily:DM,fontSize:13,color:P.dim,lineHeight:1.6}}>Both SIADH and CSW cause euvolemic/hypovolemic hyponatremia with high urine Na. The distinction is critical — wrong treatment worsens the patient. Key: FEUA &lt;11% = SIADH; ≥11% = CSW.</div>
          <div style={glassPanel()}>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontFamily:DM,fontSize:12}}>
                <thead>
                  <tr>
                    {["Feature","SIADH","CSW","Clinical Pearl"].map(h=>(
                      <th key={h} style={{textAlign:"left",padding:"8px 10px",borderBottom:`1px solid ${P.gb}`,color:P.teal,fontWeight:600,whiteSpace:"nowrap"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {siadh_csw.map(([feat,s,c,pearl],i)=>(
                    <tr key={i} style={{background:i%2===0?"rgba(0,0,0,0.15)":"transparent"}}>
                      <td style={{padding:"8px 10px",color:P.gold,fontWeight:600,whiteSpace:"nowrap"}}>{feat}</td>
                      <td style={{padding:"8px 10px",color:P.teal}}>{s}</td>
                      <td style={{padding:"8px 10px",color:P.amber}}>{c}</td>
                      <td style={{padding:"8px 10px",color:P.dim,lineHeight:1.4,minWidth:200}}>{pearl}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div style={glassPanel()}>
            <div style={{fontFamily:DM,fontSize:13,fontWeight:600,color:P.purple,marginBottom:10}}>FEUA Calculator</div>
            <div style={{fontFamily:DM,fontSize:11,color:P.dim,marginBottom:10}}>FEUA = (Urine UA / Serum UA) ÷ (Urine Cr / Serum Cr) × 100</div>
            <Row>
              <FG label="Serum Uric Acid (mg/dL)" value={uaCSW} onChange={setUaCSW} placeholder="e.g. 4.2" half/>
              <FG label="Pre-calculated FEUA %" value={feua} onChange={setFeua} placeholder="if available" half/>
            </Row>
            {feua&&(
              <div style={{marginTop:12}}>
                <ValRow label="FEUA" value={`${parseFloat(feua).toFixed(1)}%`} color={parseFloat(feua)<11?P.teal:P.amber}/>
                <div style={{marginTop:8}}><Pill text={parseFloat(feua)<11?"Consistent with SIADH (FEUA <11%)":"Consistent with CSW (FEUA ≥11%)"} color={parseFloat(feua)<11?P.teal:P.amber}/></div>
                <AlertBox text="FEUA is also low in SIADH treated with saline (volume restores proximal reabsorption). Best measured before saline treatment." color={P.purple}/>
              </div>
            )}
          </div>
          <AlertBox text="When in doubt: give 1L NS over 4–6h and check Na hourly. SIADH → Na does not improve (or falls). CSW → Na improves and holds. Never fluid restrict a volume-depleted CSW patient." color={P.red}/>
        </div>
      )}
    </div>
  );
}

// ─── HYPERKALEMIA TAB ────────────────────────────────────────────────────────
const TX=[
  {order:1,name:"Calcium Gluconate",mech:"Membrane stabilization",color:P.red,dose:"1g (10 mL of 10%) IV over 2–3 min; repeat q5 min × 2–3 if EKG changes persist",onset:"1–3 min",dur:"30–60 min",effect:"No K lowering — cardiac protection only",note:"If on digoxin: infuse over 20–30 min (Ca potentiates toxicity). CaCl2 = 3× elemental Ca — reserve for cardiac arrest.",when:"EKG changes or K ≥6.5",thresh:5.5},
  {order:2,name:"Regular Insulin + D50W",mech:"Transcellular shift",color:P.amber,dose:"10 units regular insulin IV + D50W 25g (1 amp). Omit dextrose if glucose >250",onset:"15–30 min",dur:"4–6 hr",effect:"↓ K 0.5–1.5 mEq/L",note:"Monitor glucose q1h × 4h. Peak hypoglycemia risk at 1–4h. Consider D10W infusion after.",when:"K ≥5.5",thresh:5.5},
  {order:3,name:"Nebulized Albuterol",mech:"Transcellular shift (beta-2)",color:P.amber,dose:"10–20 mg nebulized (4–8× standard dose; standard 2.5 mg is subtherapeutic)",onset:"20–30 min",dur:"2–4 hr",effect:"↓ K 0.5–1.0 mEq/L — additive with insulin",note:"Tachycardia expected. Use cautiously in ischemic HD or active ACS. Not reliable if on beta-blocker.",when:"K ≥5.5 — additive to insulin",thresh:5.5},
  {order:4,name:"Sodium Bicarbonate",mech:"Transcellular shift (alkalosis)",color:P.teal,dose:"50–100 mEq IV (1–2 amps) over 5–10 min; or bicarb drip for sustained alkalinization",onset:"30–60 min",dur:"2 hr",effect:"Modest — most effective with concurrent metabolic acidosis",note:"Minimal effect at normal pH. Do NOT co-administer with Ca in same line (precipitates). See Bicarb Drip Builder below.",when:"Concurrent metabolic acidosis",thresh:5.5},
  {order:5,name:"Furosemide",mech:"Renal elimination",color:P.grn,dose:"40–80 mg IV (if not anuric and volume-replete)",onset:"15–30 min",dur:"6 hr",effect:"Increases urinary K excretion",note:"Ineffective in oligo/anuria or severe AKI. Higher doses if chronic loop diuretic use.",when:"Functioning kidneys, volume-replete",thresh:5.5},
  {order:6,name:"Patiromer / SZC (Lokelma)",mech:"GI cation exchange — elimination",color:P.grn,dose:"Patiromer: 8.4g PO daily | SZC (Lokelma): 10g PO TID × 48h then 5–10g daily",onset:"2–6h (SZC faster)",dur:"Ongoing",effect:"↓ K 0.5–1.0 mEq/L over hours–days",note:"Not for acute emergencies. Avoid Kayexalate (sodium polystyrene sulfonate) — risk of bowel necrosis, especially post-op.",when:"Subacute / discharge planning",thresh:5.0},
  {order:7,name:"Emergent Hemodialysis",mech:"Definitive elimination",color:P.red,dose:"HD preferred; CRRT if hemodynamically unstable",onset:"During treatment",dur:"Session-dependent",effect:"↓ K 1–2 mEq/L per hour of HD",note:"Indications: K ≥6.5 refractory to meds, AKI/CKD, life-threatening arrhythmia. Contact nephrology early.",when:"Refractory / AKI / EKG instability",thresh:6.5},
];

function HyperkalemiaTab(){
  const[K,setK]=useState("");const[kVal,setKVal]=useState(0);
  const[qt,setQt]=useState("");const[hr,setHr]=useState("");const[sexQT,setSexQT]=useState("m");
  const[ind,setInd]=useState("metAcid");const[wt,setWt]=useState("");const[hco3Start,setHco3Start]=useState("");const[hco3Target,setHco3Target]=useState("22");

  const kNum=parseFloat(K)||0;
  const ekgChanges=()=>{
    const out=[];
    if(kNum<5.5)out.push({finding:"No expected EKG changes",detail:"EKG changes begin at K ≥5.5. Current level below threshold.",color:P.grn});
    if(kNum>=5.5)out.push({finding:"Peaked T waves",detail:"Narrow-based, symmetric, tall T waves. Best in V2–V4. First EKG change.",color:P.amber});
    if(kNum>=6.0)out.push({finding:"PR prolongation + QRS widening",detail:"P-R interval >200 ms. QRS begins to widen. P wave amplitude decreasing.",color:"#ff7043"});
    if(kNum>=6.5)out.push({finding:"P wave flattening / loss",detail:"Atrial standstill. Junctional or ventricular escape. Significant QRS widening.",color:P.red});
    if(kNum>=7.0)out.push({finding:"Sine wave pattern",detail:"QRS and T wave merge. Pre-terminal arrhythmia. Imminent VFib/pulseless VT — cardiac emergency.",color:P.red});
    return out;
  };

  // QTc calculator
  const qtcCalc=()=>{
    const qtMs=parseFloat(qt),hrN=parseFloat(hr);if(!qtMs||!hrN)return null;
    const rr=60000/hrN;
    const bazett=qtMs/Math.sqrt(rr/1000);
    const fridericicia=qtMs/Math.pow(rr/1000,1/3);
    const upper=sexQT==="m"?440:460;
    const bazColor=bazett>500?P.red:bazett>upper?P.amber:P.grn;
    const friColor=fridericicia>500?P.red:fridericicia>upper?P.amber:P.grn;
    const interp=Math.max(bazett,fridericicia)>500?"HIGH RISK — Torsades de Pointes. Discontinue QT-prolonging agents. Correct K, Mg. Consider MgSO4 2g IV."
      :Math.max(bazett,fridericicia)>upper?"Prolonged QTc — caution with QT-prolonging medications. Correct electrolytes (K, Mg, Ca). Telemetry."
      :"Normal QTc — no immediate concern. Continue monitoring.";
    const intColor=Math.max(bazett,fridericicia)>500?P.red:Math.max(bazett,fridericicia)>upper?P.amber:P.grn;
    return{bazett:bazett.toFixed(0),fridericicia:fridericicia.toFixed(0),bazColor,friColor,interp,intColor,rr:rr.toFixed(0)};
  };
  const qtcR=qtcCalc();

  // Bicarb drip builder
  const bicarbCalc=()=>{
    const w=parseFloat(wt),hStart=parseFloat(hco3Start);if(!w)return null;
    const bolusEq=w*0.3*(24-(hStart||12));
    let rec="",goal="",rate="",note="";
    if(ind==="metAcid"){goal="HCO3 ≥18 mEq/L (not full correction)";const halfDef=bolusEq/2;rec=`Bolus: ${halfDef.toFixed(0)} mEq (half-deficit), then check HCO3 and blood gas.`;rate=`Standard drip: 3 amps NaHCO3 (150 mEq) in 1L D5W = 150 mEq/L. Run at ${((halfDef/4)/150*1000).toFixed(0)} mL/hr over 4h.`;note="Do NOT fully normalize HCO3 in MetAcid — may mask underlying cause and shift oxyhemoglobin curve. Target pH >7.20 or HCO3 ≥18.";}
    else if(ind==="hyperK"){goal="Serum pH ≥7.45 (adjunct to K-lowering)";rec=`1–2 mEq/kg bolus = ${(w*1.5).toFixed(0)}–${(w*2).toFixed(0)} mEq IV over 5–10 min. Then drip.`;rate=`Drip: 3 amps NaHCO3 in 1L D5W @ 100–150 mL/hr. Recheck ABG q2h.`;note="Efficacy limited at normal pH. Most effective in concurrent MetAcid. Do NOT administer in same IV line as Ca (precipitation).";}
    else{goal="Serum pH >7.45 (target; not HCO3)";rec=`Bolus 1–2 mEq/kg = ${(w*1).toFixed(0)}–${(w*2).toFixed(0)} mEq IV over 5–10 min. Repeat if QRS remains wide.`;rate=`Drip: 3 amps NaHCO3 (150 mEq) in 1L D5W @ 150–200 mL/hr. Titrate to pH 7.45–7.55.`;note="TCA overdose: alkalinization narrows QRS by reducing Na channel blockade. Target pH 7.45–7.55. Watch for hypernatremia (Na load). Intubate if airway concern before acidosis worsens.";}
    return{goal,rec,rate,note,bolusEq:bolusEq.toFixed(0)};
  };
  const bicR=bicarbCalc();

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <Row>
        <FG label="Serum K (mEq/L)" value={K} onChange={v=>{setK(v);setKVal(parseFloat(v)||0);}} placeholder="5.0 – 7.5+" half/>
        {kNum>=6.5&&<div style={{flex:"1 1 calc(50% - 6px)"}}><AlertBox text="CRITICAL K ≥6.5. Emergent treatment. Cardiac monitor now. Call nephrology." color={P.red}/></div>}
      </Row>

      {kNum>0&&(
        <div style={glassPanel()}>
          <div style={{fontFamily:DM,fontSize:13,fontWeight:600,color:P.teal,marginBottom:10}}>Expected EKG Changes at K = {kNum.toFixed(1)} mEq/L</div>
          {ekgChanges().map((e,i)=>(
            <div key={i} style={{display:"flex",gap:12,padding:"7px 0",borderBottom:"1px solid rgba(255,255,255,0.05)",alignItems:"flex-start",flexWrap:"wrap"}}>
              <div style={{minWidth:200}}><Pill text={e.finding} color={e.color}/></div>
              <span style={{fontFamily:DM,fontSize:12,color:P.dim,lineHeight:1.5,flex:1}}>{e.detail}</span>
            </div>
          ))}
        </div>
      )}

      <SectionHead title="Treatment Cascade"/>
      <div style={{fontFamily:DM,fontSize:12,color:P.dim,marginTop:-8}}>Steps 1–3 are additive — initiate simultaneously in emergent hyperkalemia.</div>
      {TX.filter(t=>!kNum||kNum>=t.thresh).map(t=>(
        <div key={t.order} style={{...glassPanel(),borderLeft:`3px solid ${t.color}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8,flexWrap:"wrap"}}>
            <span style={{fontFamily:MO,fontSize:10,color:t.color,border:`1px solid ${t.color}`,borderRadius:"50%",width:20,height:20,display:"inline-flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{t.order}</span>
            <span style={{fontFamily:PL,fontSize:15,color:P.txt}}>{t.name}</span>
            <Pill text={t.mech} color={t.color}/>
            <span style={{marginLeft:"auto",fontFamily:DM,fontSize:11,color:P.dim,fontStyle:"italic"}}>{t.when}</span>
          </div>
          <ValRow label="Dose" value={t.dose} color={P.txt}/>
          <ValRow label="Onset" value={t.onset} color={P.teal}/>
          <ValRow label="Duration" value={t.dur} color={P.dim}/>
          <ValRow label="K-lowering effect" value={t.effect} color={P.gold}/>
          <AlertBox text={t.note} color={t.color}/>
        </div>
      ))}

      <SectionHead title="QTc Calculator"/>
      <div style={glassPanel()}>
        <div style={{fontFamily:DM,fontSize:12,color:P.dim,marginBottom:12}}>Bazett: QT/√RR | Fridericia: QT/RR^(1/3) | Upper limit: 440 ms (M), 460 ms (F)</div>
        <Row>
          <FG label="QT interval (ms)" value={qt} onChange={setQt} placeholder="e.g. 420" half/>
          <FG label="Heart rate (bpm)" value={hr} onChange={setHr} placeholder="e.g. 72" half/>
          <div style={{flex:"1 1 calc(50% - 6px)"}}>
            <div style={lbl}>Sex</div>
            <div style={{display:"flex",gap:8}}>
              <Btn active={sexQT==="m"} onClick={()=>setSexQT("m")} style={{fontSize:12,padding:"6px 12px"}}>Male ≤440</Btn>
              <Btn active={sexQT==="f"} onClick={()=>setSexQT("f")} style={{fontSize:12,padding:"6px 12px"}}>Female ≤460</Btn>
            </div>
          </div>
        </Row>
        {qtcR&&(
          <div style={{marginTop:14}}>
            <ValRow label="RR interval" value={qtcR.rr} unit="ms"/>
            <ValRow label="QTc — Bazett" value={`${qtcR.bazett} ms`} color={qtcR.bazColor}/>
            <ValRow label="QTc — Fridericia" value={`${qtcR.fridericicia} ms`} color={qtcR.friColor}/>
            <div style={{marginTop:8}}><Pill text={qtcR.interp} color={qtcR.intColor}/></div>
            <div style={{fontFamily:DM,fontSize:11,color:P.dim,marginTop:8,lineHeight:1.5}}>QT-prolonging agents to avoid: antipsychotics (haloperidol, quetiapine), antiarrhythmics (amiodarone, sotalol), antibiotics (azithromycin, fluoroquinolones), methadone, ondansetron at high doses.</div>
          </div>
        )}
      </div>

      <SectionHead title="Bicarb Drip Builder"/>
      <div style={glassPanel()}>
        <div style={{fontFamily:DM,fontSize:12,color:P.dim,marginBottom:12}}>Standard bag: 3 amps NaHCO3 (150 mEq) in 1L D5W = 150 mEq/L | Each amp = 50 mEq / 50 mL</div>
        <Row>
          <div style={{flex:"1 1 100%"}}>
            <div style={lbl}>Indication</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              <Btn active={ind==="metAcid"} onClick={()=>setInd("metAcid")} style={{fontSize:12,padding:"6px 12px"}}>Metabolic Acidosis</Btn>
              <Btn active={ind==="hyperK"} onClick={()=>setInd("hyperK")} style={{fontSize:12,padding:"6px 12px"}}>Hyperkalemia</Btn>
              <Btn active={ind==="tca"} onClick={()=>setInd("tca")} style={{fontSize:12,padding:"6px 12px"}}>TCA Overdose</Btn>
            </div>
          </div>
        </Row>
        <Row>
          <FG label="Weight (kg)" value={wt} onChange={setWt} placeholder="70" half/>
          {ind==="metAcid"&&<FG label="Current HCO3 (mEq/L)" value={hco3Start} onChange={setHco3Start} placeholder="e.g. 12" half/>}
        </Row>
        {bicR&&(
          <div style={{marginTop:14}}>
            <ValRow label="Goal" value={bicR.goal} color={P.teal}/>
            {ind==="metAcid"&&hco3Start&&<ValRow label="HCO3 deficit (0.3×wt×deficit)" value={`${bicR.bolusEq} mEq`} color={P.amber}/>}
            <ValRow label="Initial dosing" value={bicR.rec} color={P.txt}/>
            <ValRow label="Drip rate guidance" value={bicR.rate} color={P.gold}/>
            <AlertBox text={bicR.note} color={ind==="tca"?P.red:P.amber}/>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TUMOR LYSIS TAB ─────────────────────────────────────────────────────────
function TLSTab(){
  const[ua,setUA]=useState("");const[K,setK]=useState("");const[phos,setPhos]=useState("");const[ca,setCa]=useState("");const[cr,setCr]=useState("");const[result,setResult]=useState(null);
  const[risk,setRisk]=useState("low");

  const THRESHOLDS={ua:{val:8,unit:"mg/dL",label:"Uric acid ≥8"},k:{val:6.0,unit:"mEq/L",label:"K ≥6.0"},phos:{val:4.5,unit:"mg/dL",label:"Phos ≥4.5"},ca:{val:7.0,unit:"mg/dL",label:"Ca ≤7.0",low:true}};

  const analyze=()=>{
    const vals={ua:parseFloat(ua),K:parseFloat(K),phos:parseFloat(phos),ca:parseFloat(ca),cr:parseFloat(cr)};
    const labCriteria=[];
    if(vals.ua>=8)labCriteria.push({label:"Uric acid",val:`${vals.ua.toFixed(1)} mg/dL`,thresh:"≥8",color:P.red});
    if(vals.K>=6.0)labCriteria.push({label:"Potassium",val:`${vals.K.toFixed(1)} mEq/L`,thresh:"≥6.0",color:P.red});
    if(vals.phos>=4.5)labCriteria.push({label:"Phosphorus",val:`${vals.phos.toFixed(1)} mg/dL`,thresh:"≥4.5",color:P.amber});
    if(vals.ca&&vals.ca<=7.0)labCriteria.push({label:"Calcium",val:`${vals.ca.toFixed(1)} mg/dL`,thresh:"≤7.0",color:P.red});
    const labTLS=labCriteria.length>=2;
    const clinTLS=labTLS&&(vals.cr>=1.5||false);
    let severity="No TLS criteria met",sevColor=P.grn,sevGrade=0;
    if(labTLS&&!clinTLS){severity="Laboratory TLS";sevColor=P.amber;sevGrade=1;}
    if(clinTLS){severity="Clinical TLS";sevColor=P.red;sevGrade=3;}
    setResult({labCriteria,labTLS,clinTLS,severity,sevColor,sevGrade,vals});
  };

  const mgmt={
    low:["Hydration: PO or IV maintenance","Allopurinol 300 mg/day PO (if not initiated) — prevention","Monitor electrolytes, uric acid, creatinine daily × 7 days","No rasburicase indicated"],
    intermediate:["Aggressive IV hydration 200 mL/hr (no KCl, no added phos)","Allopurinol 300 mg/day PO","Consider rasburicase 0.2 mg/kg IV if uric acid rising","Monitor electrolytes, uric acid, creatinine q6–8h","Telemetry for hyperkalemia risk"],
    high:["Aggressive IV hydration 200–300 mL/hr target UO 80–100 mL/hr","Rasburicase 0.2 mg/kg IV (G6PD screen first — hemolysis in G6PD deficiency)","Do NOT use allopurinol with rasburicase (antagonizes)","Do NOT alkalinize urine with rasburicase (uric acid soluble at all pH)","Electrolytes, uric acid, creatinine q4–6h","Hyperkalemia management: see Hyperkalemia tab","Hyperphosphatemia: sevelamer or calcium carbonate binders","Hypocalcemia: ONLY treat if symptomatic (tetany, arrhythmia) — Ca + Phos → calcification","Nephrology consult early — may need dialysis","Cardiology/telemetry — K and Ca both potentially lethal"],
  };

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{fontFamily:DM,fontSize:13,color:P.dim,lineHeight:1.6}}>Cairo-Bishop criteria: Lab TLS = ≥2 abnormal lab values within 3 days before to 7 days after chemotherapy. Clinical TLS = Lab TLS + creatinine ≥1.5× ULN, cardiac arrhythmia, seizure, or death.</div>

      <div style={glassPanel()}>
        <div style={{fontFamily:DM,fontSize:13,fontWeight:600,color:P.teal,marginBottom:10}}>Lab TLS Criteria</div>
        <Row>
          <FG label="Uric Acid (mg/dL)" value={ua} onChange={setUA} placeholder="threshold ≥8" half/>
          <FG label="Potassium (mEq/L)" value={K} onChange={setK} placeholder="threshold ≥6.0" half/>
          <FG label="Phosphorus (mg/dL)" value={phos} onChange={setPhos} placeholder="threshold ≥4.5" half/>
          <FG label="Calcium (mg/dL)" value={ca} onChange={setCa} placeholder="threshold ≤7.0" half/>
          <FG label="Creatinine (mg/dL)" value={cr} onChange={setCr} placeholder="≥1.5× ULN for clinical TLS" half/>
        </Row>
        <Btn active onClick={analyze} style={{marginTop:12,alignSelf:"flex-start",padding:"9px 26px",fontSize:14}}>Evaluate TLS</Btn>
      </div>

      {result&&(
        <div>
          <StepCard num={1} label="Cairo-Bishop Lab Criteria" color={result.labTLS?P.red:P.grn}>
            {result.labCriteria.length===0?<div style={{fontFamily:DM,fontSize:12,color:P.grn}}>No lab criteria met. K, Phos, Uric Acid, Ca within thresholds.</div>:result.labCriteria.map((c,i)=>(
              <div key={i} style={{display:"flex",gap:10,alignItems:"center",padding:"4px 0"}}><Pill text={c.label} color={c.color}/><span style={{fontFamily:MO,fontSize:13,color:c.color}}>{c.val}</span><span style={{fontFamily:DM,fontSize:11,color:P.dim}}>threshold {c.thresh}</span></div>
            ))}
            {result.labCriteria.length>0&&<div style={{marginTop:8}}><Pill text={result.labTLS?"≥2 criteria — Lab TLS present":"<2 criteria — Lab TLS not met"} color={result.labTLS?P.red:P.amber}/></div>}
          </StepCard>

          <StepCard num={2} label="TLS Classification" color={result.sevColor}>
            <Pill text={result.severity} color={result.sevColor}/>
            {result.labTLS&&!result.clinTLS&&<div style={{fontFamily:DM,fontSize:12,color:P.dim,marginTop:6}}>Creatinine ≥1.5× ULN, arrhythmia, or seizure would classify as Clinical TLS.</div>}
          </StepCard>

          {result.labTLS&&(
            <StepCard num={3} label="Electrolyte Complications" color={P.amber}>
              <ValRow label="Hyperkalemia" value="K ≥6.0 → see Hyperkalemia tab for full treatment cascade" color={P.txt}/>
              <ValRow label="Hyperphosphatemia" value="Ca×Phos product >55 mg²/dL² → vascular calcification risk" color={P.amber}/>
              <ValRow label="Hypocalcemia" value="Symptomatic only: Ca gluconate IV. Avoid if high Ca×Phos product." color={P.txt}/>
              <ValRow label="Uric acid nephropathy" value="Rasburicase preferred over allopurinol for established TLS" color={P.gold}/>
            </StepCard>
          )}
        </div>
      )}

      <SectionHead title="Prevention & Management by Risk Tier"/>
      <div style={{display:"flex",gap:8,marginBottom:4,flexWrap:"wrap"}}>
        {[["low","Low Risk"],["intermediate","Intermediate Risk"],["high","High Risk / Established TLS"]].map(([r,label])=>(
          <Btn key={r} active={risk===r} color={r==="high"?P.red:r==="intermediate"?P.amber:P.grn} onClick={()=>setRisk(r)}>{label}</Btn>
        ))}
      </div>
      <div style={{...glassPanel(),borderLeft:`3px solid ${risk==="high"?P.red:risk==="intermediate"?P.amber:P.grn}`}}>
        {mgmt[risk].map((m,i)=>(
          <div key={i} style={{display:"flex",gap:8,padding:"5px 0",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
            <span style={{color:risk==="high"?P.red:risk==="intermediate"?P.amber:P.grn,fontFamily:MO,fontSize:11,flexShrink:0}}>{i+1}.</span>
            <span style={{fontFamily:DM,fontSize:12,color:P.txt,lineHeight:1.5}}>{m}</span>
          </div>
        ))}
      </div>
      <AlertBox text="Tumor types at highest risk: Burkitt lymphoma, ALL (high WBC), large B-cell lymphoma (bulky), AML (WBC >100k). TLS can occur before chemotherapy in rapidly proliferating tumors (spontaneous TLS)." color={P.coral}/>
    </div>
  );
}

// ─── MAIN HUB ─────────────────────────────────────────────────────────────────
export default function ElectrolyteAcidBaseHub(){
  const[tab,setTab]=useState("abg");
  const TABS=[
    {id:"abg",icon:"🫧",label:"ABG / VBG + Osm"},
    {id:"electrolytes",icon:"⚗",label:"Electrolytes"},
    {id:"sodium",icon:"⚖",label:"Sodium Disorders"},
    {id:"hyperkalemia",icon:"⚡",label:"Hyperkalemia + Tools"},
    {id:"tls",icon:"🧬",label:"Tumor Lysis"},
  ];
  return(
    <div style={{minHeight:"100vh",background:P.bg,fontFamily:DM,color:P.txt,padding:0}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');*{box-sizing:border-box;}input[type=number]::-webkit-inner-spin-button{opacity:0.3;}input[type=number]{-moz-appearance:textfield;}`}</style>
      <div style={{padding:"24px 24px 0",borderBottom:`1px solid ${P.gb}`,background:"rgba(0,0,0,0.18)"}}>
        <div style={{maxWidth:960,margin:"0 auto"}}>
          <div style={{fontFamily:PL,fontSize:26,fontWeight:700,color:P.teal,marginBottom:3}}>Electrolyte & Acid-Base Hub</div>
          <div style={{fontFamily:DM,fontSize:13,color:P.dim,marginBottom:18}}>ABG/VBG · Osmolar gaps · Electrolyte replacement · Sodium disorders · SIADH vs CSW · Hyperkalemia · QTc · Bicarb drip · Tumor lysis</div>
          <div style={{display:"flex",gap:2,flexWrap:"wrap"}}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{background:tab===t.id?`${P.teal}18`:"transparent",border:"none",borderBottom:tab===t.id?`2px solid ${P.teal}`:"2px solid transparent",color:tab===t.id?P.teal:P.dim,cursor:"pointer",fontFamily:DM,fontSize:13,fontWeight:tab===t.id?600:400,padding:"10px 18px",transition:"all 0.15s",borderRadius:"6px 6px 0 0"}}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div style={{maxWidth:960,margin:"0 auto",padding:"24px 24px 48px"}}>
        {tab==="abg"&&<ABGTab/>}
        {tab==="electrolytes"&&<ElectrolytesTab/>}
        {tab==="sodium"&&<SodiumTab/>}
        {tab==="hyperkalemia"&&<HyperkalemiaTab/>}
        {tab==="tls"&&<TLSTab/>}
      </div>
    </div>
  );
}