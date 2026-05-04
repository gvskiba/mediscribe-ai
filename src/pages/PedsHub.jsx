// PediatricHub.jsx — Notrya Pediatric Emergency Hub
// Broselow-Luten 1992 · PECARN Kuppermann 2009 · Rochester Criteria 1985
// PALS 2020 · Nelson's Antimicrobial Therapy 2024 · AAP Red Book 2024
// IDSA CAP/UTI · AAFP/AAP AOM 2013 · Westley 1978 · PRAM · CDS Goldman 2008
// Route: /PediatricHub
// Constraints: no form/localStorage, straight quotes, single react import

import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const T = {
  bg:"#050d1a",txt:"#ddeeff",txt2:"#7aafd4",txt3:"#4d82a8",txt4:"#3a6a9a",
  teal:"#00d4b4",gold:"#f5c842",coral:"#ff6060",blue:"#4da6ff",
  orange:"#ff9f43",purple:"#b06dff",green:"#3dffa0",red:"#ff4444",
  mint:"#7fffcf",cyan:"#00c8d4",
};
const S = { mono:"'JetBrains Mono',monospace", sans:"'DM Sans',sans-serif", serif:"'Playfair Display',serif" };

const TABS = [
  { id:"vitals",  label:"Vitals",         icon:"📏", color:T.mint   },
  { id:"pecarn",  label:"PECARN",         icon:"🧠", color:T.blue   },
  { id:"fever",   label:"Fever",          icon:"🌡️", color:T.coral  },
  { id:"meds",    label:"Medications",    icon:"💊", color:T.green  },
  { id:"scoring", label:"Scoring",        icon:"📋", color:T.purple },
  { id:"tools",   label:"Clinical Tools", icon:"🩺", color:T.gold   },
];

// ── Shared components ────────────────────────────────────────────────
function Card({ color, title, children, mb }) {
  return (
    <div style={{ padding:"7px 10px",borderRadius:9,marginBottom:mb||7,
      background:`${color}07`,border:`1px solid ${color}28`,borderLeft:`3px solid ${color}` }}>
      {title && <div style={{ fontFamily:S.mono,fontSize:8,color,letterSpacing:1.5,
        textTransform:"uppercase",marginBottom:7 }}>{title}</div>}
      {children}
    </div>
  );
}
function Bullet({ text, color }) {
  return (
    <div style={{ display:"flex",gap:7,alignItems:"flex-start",marginBottom:5 }}>
      <span style={{ color:color||T.teal,fontSize:7,marginTop:4,flexShrink:0 }}>▸</span>
      <span style={{ fontFamily:S.sans,fontSize:9.5,color:T.txt2,lineHeight:1.6 }}>{text}</span>
    </div>
  );
}
function Check({ label, sub, checked, onToggle, color }) {
  const c = color||T.teal;
  return (
    <button onClick={onToggle} style={{ display:"flex",alignItems:"flex-start",gap:9,
      width:"100%",padding:"8px 12px",borderRadius:8,cursor:"pointer",textAlign:"left",
      border:"none",marginBottom:4,background:checked?`${c}10`:"rgba(5,13,32,0.75)",
      borderLeft:`3px solid ${checked?c:"rgba(30,70,130,0.4)"}` }}>
      <div style={{ width:17,height:17,borderRadius:4,flexShrink:0,marginTop:1,
        border:`2px solid ${checked?c:"rgba(40,90,160,0.5)"}`,
        background:checked?c:"transparent",display:"flex",alignItems:"center",justifyContent:"center" }}>
        {checked && <span style={{ color:"#030d0f",fontSize:9,fontWeight:900 }}>✓</span>}
      </div>
      <div>
        <div style={{ fontFamily:S.sans,fontWeight:600,fontSize:12,color:checked?c:T.txt2 }}>{label}</div>
        {sub && <div style={{ fontFamily:S.sans,fontSize:9,color:T.txt4,marginTop:1 }}>{sub}</div>}
      </div>
    </button>
  );
}
function ResultBox({ label, detail, color }) {
  return (
    <div style={{ padding:"12px 14px",borderRadius:10,background:`${color}0c`,
      border:`1px solid ${color}44`,marginTop:10 }}>
      <div style={{ fontFamily:S.serif,fontWeight:700,fontSize:14,color,marginBottom:3 }}>{label}</div>
      <div style={{ fontFamily:S.sans,fontSize:9.5,color:T.txt2,lineHeight:1.65 }}>{detail}</div>
    </div>
  );
}
function ScoreWidget({ items, scores, setScores, color }) {
  const c = color||T.teal;
  return items.map(item => (
    <div key={item.key} style={{ marginBottom:7 }}>
      <div style={{ fontFamily:S.mono,fontSize:8,color:c,letterSpacing:1.3,
        textTransform:"uppercase",marginBottom:5 }}>{item.label}</div>
      <div style={{ display:"flex",gap:5,flexWrap:"wrap" }}>
        {item.opts.map(opt => (
          <button key={opt.v} onClick={() => setScores(p => ({ ...p,[item.key]:opt.v }))}
            style={{ padding:"5px 11px",borderRadius:7,cursor:"pointer",
              fontFamily:S.sans,fontWeight:600,fontSize:10,
              border:`1px solid ${scores[item.key]===opt.v?c+"66":"rgba(30,70,130,0.4)"}`,
              background:scores[item.key]===opt.v?`${c}14`:"transparent",
              color:scores[item.key]===opt.v?c:T.txt4 }}>
            {opt.v} — {opt.l}
          </button>
        ))}
      </div>
    </div>
  ));
}
// ── DrugSection: renders calc + all solutions simultaneously ────────
// solutions: [{l:"label", m:mg_per_mL}] — mL computed from doseNum/m
function DrugSection({ title, color, drugs, wtCalc }) {
  if (!drugs||!drugs.length) return null;
  return (
    <div style={{ marginBottom:4 }}>
      <div style={{ fontFamily:S.mono,fontSize:7.5,color,letterSpacing:1.5,
        textTransform:"uppercase",padding:"3px 8px",marginBottom:3,
        background:`${color}10`,borderRadius:5,border:`1px solid ${color}25` }}>{title}</div>
      {drugs.map((d,i) => (
        <div key={i} style={{ padding:"6px 7px",
          borderBottom:i<drugs.length-1?"1px solid rgba(30,70,130,0.2)":"none" }}>
          <div style={{ display:"flex",alignItems:"flex-start",gap:10 }}>
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ fontFamily:S.sans,fontWeight:600,fontSize:9.5,color:T.txt2 }}>{d.name}</div>
              <div style={{ fontFamily:S.mono,fontSize:8,color:T.txt4,marginTop:1 }}>{d.dose}</div>
              <div style={{ fontFamily:S.sans,fontSize:9,color:T.txt4,marginTop:2,lineHeight:1.5 }}>{d.note}</div>
            </div>
            <div style={{ textAlign:"right",flexShrink:0,minWidth:130 }}>
              {wtCalc&&d.calc&&<div style={{ fontFamily:S.mono,fontSize:13,fontWeight:700,color,marginBottom:3 }}>{d.calc}</div>}
              {wtCalc&&d.solutions&&d.solutions.map((s,j)=>(
                <div key={j} style={{ display:"flex",justifyContent:"flex-end",alignItems:"baseline",
                  gap:5,marginBottom:2 }}>
                  <span style={{ fontFamily:S.mono,fontSize:7,color:T.txt4,maxWidth:100,textAlign:"right",lineHeight:1.3 }}>{s.l}</span>
                  <span style={{ fontFamily:S.mono,fontSize:12,fontWeight:700,color:T.mint,minWidth:42,textAlign:"right" }}>{s.v} mL</span>
                </div>
              ))}
              {wtCalc&&!d.solutions&&d.ml&&<div style={{ fontFamily:S.mono,fontSize:9,color:T.mint,marginTop:1 }}>{d.ml}</div>}
              {(!wtCalc||!d.calc)&&<div style={{ fontFamily:S.mono,fontSize:11,fontWeight:600,color }}>{d.dose}</div>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// VITALS
const VITAL_NORMS = [
  { age:"Neonate (0–28d)",hr:[100,160],sbp:[60,90],  rr:[30,60],wt:"2.5–4.5 kg" },
  { age:"1–3 months",    hr:[100,160],sbp:[70,100], rr:[30,60],wt:"3.5–6 kg"   },
  { age:"3–6 months",    hr:[90,150], sbp:[70,110], rr:[25,45],wt:"5.5–8 kg"   },
  { age:"6–12 months",   hr:[80,140], sbp:[80,115], rr:[25,40],wt:"7–11 kg"    },
  { age:"1–2 years",     hr:[80,130], sbp:[80,115], rr:[20,35],wt:"10–14 kg"   },
  { age:"2–5 years",     hr:[75,120], sbp:[80,115], rr:[20,30],wt:"12–20 kg"   },
  { age:"6–10 years",    hr:[70,110], sbp:[85,120], rr:[16,24],wt:"20–35 kg"   },
  { age:"11–14 years",   hr:[60,105], sbp:[90,130], rr:[12,20],wt:"35–60 kg"   },
];
const BROSELOW = [
  { color:"Grey",  length:"46–55 cm",  wt:"3–5 kg",   hex:"#9e9e9e" },
  { color:"Pink",  length:"55–67 cm",  wt:"6–7 kg",   hex:"#ff80ab" },
  { color:"Red",   length:"67–75 cm",  wt:"8–9 kg",   hex:"#ff5252" },
  { color:"Purple",length:"75–85 cm",  wt:"10–11 kg", hex:"#b06dff" },
  { color:"Yellow",length:"85–95 cm",  wt:"12–14 kg", hex:"#f5c842" },
  { color:"White", length:"95–107 cm", wt:"15–18 kg", hex:"#e0e0e0" },
  { color:"Blue",  length:"107–122 cm",wt:"19–22 kg", hex:"#4da6ff" },
  { color:"Orange",length:"122–137 cm",wt:"24–28 kg", hex:"#ff9f43" },
  { color:"Green", length:"137–152 cm",wt:"30–36 kg", hex:"#3dffa0" },
];
function VitalsTab({ globalWt, setGlobalWt }) {
  const [ageMonths,setAgeMonths]=useState(""); const [htCm,setHtCm]=useState("");
  const [hrVal,setHRVal]=useState(""); const [sbpVal,setSBPVal]=useState("");
  const ageM=parseFloat(ageMonths)||0; const ageY=ageM/12; const ht=parseFloat(htCm)||0;
  const estWt=useMemo(()=>{
    if(!ageM)return null;
    if(ageM<=3)return{kg:3+(ageM*0.5),m:"Neonate: 3+(age_mo×0.5)"};
    if(ageM<=12)return{kg:Math.round((ageM+9)/2),m:"Infant: (age_mo+9)/2"};
    if(ageY<=5)return{kg:Math.round(2*ageY+8),m:"Young child: 2×age_yr+8"};
    if(ageY<=10)return{kg:Math.round(3*ageY+7),m:"School age: 3×age_yr+7"};
    return{kg:Math.round(3.3*ageY+4),m:"Adolescent approximation"};
  },[ageM,ageY]);
  const bz=useMemo(()=>{
    if(!ht)return null;
    return BROSELOW.find(z=>{const[lo,hi]=z.length.split("–").map(parseFloat);return ht>=lo&&ht<hi;})||
      (ht>=152?BROSELOW[BROSELOW.length-1]:null);
  },[ht]);
  const norm=useMemo(()=>{
    if(!ageM)return null;
    if(ageM<=1)return VITAL_NORMS[0]; if(ageM<=3)return VITAL_NORMS[1];
    if(ageM<=6)return VITAL_NORMS[2]; if(ageM<=12)return VITAL_NORMS[3];
    if(ageY<=2)return VITAL_NORMS[4]; if(ageY<=5)return VITAL_NORMS[5];
    if(ageY<=10)return VITAL_NORMS[6]; return VITAL_NORMS[7];
  },[ageM,ageY]);
  const hrSt=norm&&hrVal?(parseFloat(hrVal)<norm.hr[0]?"low":parseFloat(hrVal)>norm.hr[1]?"high":"ok"):null;
  const sbpSt=norm&&sbpVal?(parseFloat(sbpVal)<norm.sbp[0]?"low":parseFloat(sbpVal)>norm.sbp[1]?"high":"ok"):null;
  const sc=s=>s==="ok"?T.teal:s==="high"?T.coral:T.orange;
  return (
    <div className="peds-in">
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:9 }}>
        {[["Age (months)",ageMonths,setAgeMonths,T.mint],["Height / Length (cm)",htCm,setHtCm,T.blue]].map(([lbl,val,set,c])=>(
          <div key={lbl}>
            <div style={{ fontFamily:S.mono,fontSize:8,color:T.txt4,letterSpacing:1.3,
              textTransform:"uppercase",marginBottom:4 }}>{lbl}</div>
            <input type="number" value={val} onChange={e=>set(e.target.value)}
              style={{ width:"100%",padding:"7px 10px",background:"rgba(5,13,32,0.92)",
                border:`1px solid ${val?c+"55":"rgba(30,70,130,0.4)"}`,borderRadius:8,outline:"none",
                fontFamily:S.mono,fontSize:20,fontWeight:700,color:c }} />
          </div>
        ))}
      </div>
      {estWt&&<Card color={T.mint} title="Estimated Weight">
        <div style={{ display:"flex",alignItems:"center",gap:12 }}>
          <div style={{ fontFamily:S.serif,fontSize:32,fontWeight:900,color:T.mint,lineHeight:1 }}>
            {estWt.kg.toFixed(1)}<span style={{ fontSize:20 }}> kg</span>
          </div>
          <div>
            <div style={{ fontFamily:S.sans,fontSize:11,color:T.txt3 }}>{estWt.m}</div>
            <div style={{ fontFamily:S.sans,fontSize:9,color:T.txt4,marginTop:2 }}>Broselow tape = gold standard for dosing.</div>
            <button onClick={()=>setGlobalWt(estWt.kg.toFixed(1))}
              style={{ marginTop:6,padding:"4px 12px",borderRadius:6,cursor:"pointer",
                fontFamily:S.sans,fontWeight:600,fontSize:10,
                background:"rgba(127,255,207,0.12)",border:"1px solid rgba(127,255,207,0.4)",color:T.mint }}>
              Use {estWt.kg.toFixed(1)} kg for drug dosing →
            </button>
          </div>
        </div>
      </Card>}
      {bz&&<Card color={bz.hex} title="Broselow Zone">
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ width:44,height:44,borderRadius:8,background:bz.hex,flexShrink:0 }} />
          <div>
            <div style={{ fontFamily:S.serif,fontWeight:700,fontSize:15,color:bz.hex }}>{bz.color} Zone</div>
            <div style={{ fontFamily:S.mono,fontSize:9,color:T.txt3 }}>{bz.length} · {bz.wt}</div>
            <div style={{ fontFamily:S.sans,fontSize:9,color:T.txt4,marginTop:2 }}>Use color-coded drug cards for weight-appropriate dosing</div>
          </div>
        </div>
      </Card>}
      {norm&&<Card color={T.cyan} title={`Normal Vitals — ${ageM<24?ageM+" months":ageY.toFixed(1)+" years"}`}>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:7 }}>
          {[{l:"HR",r:`${norm.hr[0]}–${norm.hr[1]}`,u:"bpm"},{l:"SBP",r:`${norm.sbp[0]}–${norm.sbp[1]}`,u:"mmHg"},{l:"RR",r:`${norm.rr[0]}–${norm.rr[1]}`,u:"/min"}].map(v=>(
            <div key={v.l} style={{ padding:"8px",borderRadius:8,textAlign:"center",
              background:"rgba(5,13,32,0.75)",border:"1px solid rgba(30,70,130,0.4)" }}>
              <div style={{ fontFamily:S.mono,fontSize:8,color:T.txt4,letterSpacing:1 }}>{v.l}</div>
              <div style={{ fontFamily:S.mono,fontSize:13,fontWeight:700,color:T.cyan }}>{v.r}</div>
              <div style={{ fontFamily:S.mono,fontSize:7,color:T.txt4 }}>{v.u}</div>
            </div>
          ))}
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
          {[{lbl:"Patient HR",val:hrVal,set:setHRVal,st:hrSt,n:norm.hr},{lbl:"Patient SBP",val:sbpVal,set:setSBPVal,st:sbpSt,n:norm.sbp}].map(f=>(
            <div key={f.lbl}>
              <div style={{ fontFamily:S.mono,fontSize:7,color:T.txt4,letterSpacing:1.3,
                textTransform:"uppercase",marginBottom:4 }}>{f.lbl}</div>
              <input type="number" value={f.val} onChange={e=>f.set(e.target.value)}
                style={{ width:"100%",padding:"7px 9px",background:"rgba(5,13,32,0.92)",
                  border:`1px solid ${f.val?sc(f.st)+"55":"rgba(30,70,130,0.35)"}`,
                  borderRadius:6,outline:"none",fontFamily:S.mono,fontSize:16,fontWeight:700,
                  color:f.val?sc(f.st):T.txt4 }} />
              {f.st&&f.st!=="ok"&&<div style={{ fontFamily:S.sans,fontSize:9,color:sc(f.st),marginTop:2 }}>
                {f.st==="high"?`High (norm ${f.n[0]}–${f.n[1]})`:`Low (norm ${f.n[0]}–${f.n[1]})`}
              </div>}
            </div>
          ))}
        </div>
        {ageM>0&&<div style={{ marginTop:8,padding:"6px 9px",borderRadius:7,
          background:"rgba(255,92,92,0.07)",border:"1px solid rgba(255,92,92,0.22)" }}>
          <span style={{ fontFamily:S.mono,fontSize:8,color:T.coral,letterSpacing:1 }}>PALS Hypotension  </span>
          <span style={{ fontFamily:S.mono,fontSize:9,fontWeight:700,color:T.coral }}>
            SBP &lt; {ageY<=1?70:ageY<=10?Math.round(70+2*ageY):90} mmHg
          </span>
        </div>}
      </Card>}
      <Card color={T.teal} title="Pediatric Vital Sign Reference Table">
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%",borderCollapse:"collapse",fontFamily:S.mono,fontSize:9 }}>
            <thead><tr style={{ borderBottom:"1px solid rgba(30,70,130,0.4)" }}>
              {["Age Group","HR (bpm)","SBP (mmHg)","RR (/min)","Wt (kg)"].map(h=>(
                <th key={h} style={{ padding:"5px 8px",textAlign:"left",color:T.txt4,fontWeight:700 }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>{VITAL_NORMS.map((r,i)=>(
              <tr key={i} style={{ borderBottom:"1px solid rgba(30,70,130,0.2)" }}>
                <td style={{ padding:"5px 8px",color:T.teal,fontWeight:700 }}>{r.age}</td>
                <td style={{ padding:"5px 8px",color:T.txt2 }}>{r.hr[0]}–{r.hr[1]}</td>
                <td style={{ padding:"5px 8px",color:T.txt2 }}>{r.sbp[0]}–{r.sbp[1]}</td>
                <td style={{ padding:"5px 8px",color:T.txt2 }}>{r.rr[0]}–{r.rr[1]}</td>
                <td style={{ padding:"5px 8px",color:T.txt3 }}>{r.wt}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// PECARN
const P2 = [
  { key:"gcs1",  label:"GCS < 15",high:true, sub:"On initial ED evaluation" },
  { key:"palpfx",label:"Palpable skull fracture",high:true, sub:"On physical examination" },
  { key:"alt1",  label:"Altered mental status",high:true, sub:"Agitation, somnolence, repetitive questioning, slow response" },
  { key:"loc1",  label:"Loss of consciousness ≥ 5 sec",mod:true, sub:"Parent-reported or witnessed" },
  { key:"hem",   label:"Non-frontal scalp hematoma",mod:true, sub:"Scalp hematoma other than frontal region" },
  { key:"mech1", label:"Severe mechanism",mod:true, sub:"MVC ejection/rollover/pedestrian, fall >0.9m, high-impact head strike" },
  { key:"behav", label:"Acting abnormally per parent",mod:true, sub:"Behavior different from baseline per caregiver" },
];
const P2P = [
  { key:"gcs2",  label:"GCS < 15",high:true, sub:"On initial ED evaluation" },
  { key:"alt2",  label:"Altered mental status",high:true, sub:"Agitation, somnolence, repetitive questioning, slow response" },
  { key:"bsf",   label:"Signs of basilar skull fracture",high:true, sub:"Hemotympanum, Battle sign, raccoon eyes, CSF rhinorrhea/otorrhea" },
  { key:"loc2",  label:"Loss of consciousness",mod:true, sub:"Any duration" },
  { key:"vomit", label:"Vomiting",mod:true, sub:"Any vomiting" },
  { key:"mech2", label:"Severe mechanism",mod:true, sub:"MVC ejection/rollover/pedestrian, fall >1.5m, high-impact head strike" },
  { key:"ha",    label:"Severe headache",mod:true, sub:"Patient reports severe headache" },
];
const PEDS_GCS_VERBAL = [
  { score:5, adult:"Oriented", child:"Coos, babbles", infant:"Smiles, coos" },
  { score:4, adult:"Confused", child:"Irritable crying", infant:"Cries but consolable" },
  { score:3, adult:"Inappropriate words", child:"Crying to pain", infant:"Persistent irritable cry" },
  { score:2, adult:"Incomprehensible sounds", child:"Moaning to pain", infant:"Grunts to pain" },
  { score:1, adult:"None", child:"None", infant:"None" },
];
function PECARNTab() {
  const [arm,setArm]=useState("u2"); const [items,setItems]=useState({});
  const [showGcs,setShowGcs]=useState(false);
  const crit=arm==="u2"?P2:P2P; const toggle=k=>setItems(p=>({...p,[k]:!p[k]}));
  const hiRisk=crit.filter(c=>c.high&&items[c.key]).length>0;
  const modRisk=crit.filter(c=>c.mod&&items[c.key]).length>0;
  const anySet=Object.keys(items).length>0;
  const res=!anySet?null:hiRisk?{label:"CT Recommended — High Risk",color:T.coral,
    detail:"High-risk factor present. CT head recommended immediately. cTBI risk > 4.4%."}
  :modRisk?{label:"CT vs Observation — Physician Decision",color:T.gold,
    detail:arm==="u2"?"Intermediate-risk in child < 2. CT vs 4–6h observation."
    :"Intermediate-risk only. CT vs observation — consider factors, age, worsening symptoms."}
  :{label:"CT Not Recommended",color:T.teal,
    detail:arm==="u2"?"No high/intermediate-risk factors. cTBI risk < 0.02%. Observe 4–6h."
    :"No risk factors. cTBI risk < 0.05%. Discharge with return precautions."};
  return (
    <div className="peds-in">
      <Card color={T.blue} title="PECARN Pediatric Head CT Rule — Kuppermann 2009">
        <div style={{ fontFamily:S.sans,fontSize:9.5,color:T.txt3,lineHeight:1.6,marginBottom:7 }}>
          Prospective validation in 42,412 children. Sensitivity 99%+ in both age arms.
        </div>
        <div style={{ display:"flex",gap:7,marginBottom:4 }}>
          {[["u2","< 2 Years"],["2p","≥ 2 Years"]].map(([v,l])=>(
            <button key={v} onClick={()=>{setArm(v);setItems({});}}
              style={{ flex:1,padding:"5px 0",borderRadius:9,cursor:"pointer",
                fontFamily:S.sans,fontWeight:600,fontSize:12,
                border:`1px solid ${arm===v?T.blue+"66":"rgba(30,70,130,0.4)"}`,
                background:arm===v?"rgba(77,166,255,0.12)":"transparent",
                color:arm===v?T.blue:T.txt4 }}>{l}</button>
          ))}
        </div>
      </Card>
      <div style={{ fontFamily:S.mono,fontSize:8,color:T.coral,letterSpacing:1.5,textTransform:"uppercase",marginBottom:5 }}>High Risk (CT Recommended if Present)</div>
      {crit.filter(c=>c.high).map(c=><Check key={c.key} label={c.label} sub={c.sub} checked={!!items[c.key]} onToggle={()=>toggle(c.key)} color={T.coral} />)}
      <div style={{ fontFamily:S.mono,fontSize:8,color:T.gold,letterSpacing:1.5,textTransform:"uppercase",margin:"10px 0 5px" }}>Intermediate Risk (CT vs Observation)</div>
      {crit.filter(c=>c.mod).map(c=><Check key={c.key} label={c.label} sub={c.sub} checked={!!items[c.key]} onToggle={()=>toggle(c.key)} color={T.gold} />)}
      {res&&<ResultBox label={res.label} color={res.color} detail={res.detail} />}
      {arm==="u2"&&<Card color={T.purple} title="Age < 3 Months — Additional Considerations" mb={10}>
        <Bullet text="Higher risk of intracranial injury even with low-energy mechanisms — lower threshold for CT" color={T.purple} />
        <Bullet text="Non-accidental trauma must be considered — bruising, retinal hemorrhage, long bone fractures" color={T.purple} />
        <Bullet text="Bulging fontanelle = elevated ICP until proven otherwise" color={T.purple} />
      </Card>}
      <button onClick={()=>setShowGcs(!showGcs)}
        style={{ width:"100%",padding:"8px",borderRadius:8,cursor:"pointer",marginBottom:8,
          fontFamily:S.sans,fontWeight:600,fontSize:11,
          border:`1px solid ${T.blue}44`,background:`${T.blue}08`,color:T.blue }}>
        {showGcs?"▲ Hide":"▼ Show"} Pediatric GCS Reference
      </button>
      {showGcs&&<Card color={T.blue} title="Pediatric GCS — Verbal Component (Age-Modified)">
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%",borderCollapse:"collapse",fontFamily:S.mono,fontSize:9 }}>
            <thead><tr style={{ borderBottom:"1px solid rgba(77,166,255,0.3)" }}>
              {["V Score","Adult (> 5y)","Child (2–5y)","Infant (< 2y)"].map(h=>(
                <th key={h} style={{ padding:"5px 8px",textAlign:"left",color:T.blue,fontWeight:700 }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>{PEDS_GCS_VERBAL.map(r=>(
              <tr key={r.score} style={{ borderBottom:"1px solid rgba(30,70,130,0.2)" }}>
                <td style={{ padding:"5px 8px",fontWeight:700,color:T.blue }}>{r.score}</td>
                <td style={{ padding:"5px 8px",color:T.txt2 }}>{r.adult}</td>
                <td style={{ padding:"5px 8px",color:T.txt2 }}>{r.child}</td>
                <td style={{ padding:"5px 8px",color:T.txt2 }}>{r.infant}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={{ marginTop:8,fontFamily:S.sans,fontSize:9,color:T.txt4,lineHeight:1.6 }}>
          GCS 13–15: Mild TBI · GCS 9–12: Moderate TBI · GCS 3–8: Severe TBI
        </div>
      </Card>}
    </div>
  );
}
// FEVER
const ROCHESTER = [
  { key:"healthy",label:"Previously healthy — no perinatal complications",sub:"Full-term, no NICU stay, no prior illness" },
  { key:"noabx",  label:"No prior antibiotic treatment",sub:"No antibiotics in past 48h" },
  { key:"nohosp", label:"No hospitalization or medical problem",sub:"No underlying medical condition" },
  { key:"nofocus",label:"No identifiable bacterial focus on exam",sub:"No otitis, SSTI, bone/joint infection" },
  { key:"wbc",    label:"WBC 5,000–15,000/µL",sub:"And band:neutrophil ratio < 0.2" },
  { key:"ua",     label:"Urinalysis: < 10 WBC/hpf, negative LE/nitrite",sub:"Clean catch or catheterized" },
  { key:"stool",  label:"If diarrhea: stool smear < 5 WBC/hpf",sub:"Only if diarrhea present" },
];
function FeverTab() {
  const [ageW,setAgeW]=useState(""); const [roc,setRoc]=useState({});
  const aW=parseFloat(ageW)||0; const toggle=k=>setRoc(p=>({...p,[k]:!p[k]}));
  const lowRisk=ROCHESTER.every(c=>roc[c.key]);
  const tiers=[
    { r:"< 28 days (0–4 weeks)",color:T.red,active:aW>0&&aW<4,approach:[
      "FULL SEPSIS WORKUP: CBC+diff, CMP, UA+UC, blood culture, LP",
      "Empiric: ampicillin 50 mg/kg IV q6h + gentamicin 4 mg/kg IV q24h",
      "Add acyclovir 20 mg/kg IV q8h if HSV risk (maternal lesions, ill-appearing, seizures)",
      "Hospitalize ALL neonates — no outpatient option",
    ]},
    { r:"29–60 days (4–8 weeks)",color:T.orange,active:aW>=4&&aW<=8.5,approach:[
      "Full workup: CBC, CMP, UA+UC, blood culture, LP strongly recommended",
      "Rochester Criteria (below): if all met, consider outpatient after LP with 24h f/u",
      "Ill-appearing or high-risk: hospitalize + empiric antibiotics regardless of criteria",
    ]},
    { r:"61–90 days (8–13 weeks)",color:T.gold,active:aW>8.5&&aW<=13,approach:[
      "Stratify: blood culture, UA+UC, procalcitonin",
      "Low risk: PCT < 0.5 + CRP < 20 + ANC < 5,200 + UA negative → consider outpatient",
      "Ceftriaxone 50 mg/kg IM + 24h return if managed outpatient",
    ]},
    { r:"3–36 months",color:T.teal,active:aW>13&&aW<=156,approach:[
      "Fully vaccinated (Hib + PCV13): SBI risk < 1% — targeted evaluation by symptoms",
      "UA+UC: female < 24m or uncircumcised male < 12m with fever > 39°C",
      "Blood culture: fever > 39°C + WBC > 15,000 or ill-appearing",
    ]},
  ];
  return (
    <div className="peds-in">
      <div style={{ marginBottom:9 }}>
        <div style={{ fontFamily:S.mono,fontSize:8,color:T.txt4,letterSpacing:1.3,textTransform:"uppercase",marginBottom:4 }}>Age (weeks)</div>
        <input type="number" value={ageW} onChange={e=>setAgeW(e.target.value)}
          style={{ width:140,padding:"7px 10px",background:"rgba(5,13,32,0.92)",
            border:`1px solid ${ageW?T.coral+"55":"rgba(30,70,130,0.4)"}`,borderRadius:8,
            outline:"none",fontFamily:S.mono,fontSize:17,fontWeight:700,color:T.coral }} />
      </div>
      {tiers.map((tier,i)=>(
        <div key={i} style={{ marginBottom:7,padding:"7px 10px",borderRadius:9,
          background:tier.active?`${tier.color}10`:`${tier.color}06`,
          border:`1px solid ${tier.active?tier.color+"55":tier.color+"22"}`,
          borderLeft:`4px solid ${tier.color}` }}>
          <div style={{ fontFamily:S.serif,fontWeight:700,fontSize:12,color:tier.color,marginBottom:tier.active?6:0 }}>
            {tier.r}
            {tier.active&&<span style={{ fontFamily:S.mono,fontSize:8,color:tier.color,marginLeft:8,
              background:`${tier.color}18`,border:`1px solid ${tier.color}40`,borderRadius:4,padding:"1px 7px" }}>ACTIVE</span>}
          </div>
          {tier.active&&tier.approach.map((a,j)=><Bullet key={j} text={a} color={tier.color} />)}
        </div>
      ))}
      {aW>=4&&aW<=8.5&&<Card color={T.orange} title="Rochester Criteria — Low-Risk SBI (29–60 days)">
        <div style={{ fontFamily:S.sans,fontSize:9,color:T.txt4,marginBottom:8 }}>ALL criteria must be met. Does NOT replace clinical judgment.</div>
        {ROCHESTER.map(c=><Check key={c.key} label={c.label} sub={c.sub} checked={!!roc[c.key]} onToggle={()=>toggle(c.key)} color={T.orange} />)}
        {Object.keys(roc).length>0&&<div style={{ marginTop:8,padding:"6px 9px",borderRadius:7,
          background:lowRisk?"rgba(255,159,67,0.08)":"rgba(255,92,92,0.08)",
          border:`1px solid ${lowRisk?"rgba(255,159,67,0.35)":"rgba(255,92,92,0.3)"}` }}>
          <div style={{ fontFamily:S.serif,fontWeight:700,fontSize:14,color:lowRisk?T.orange:T.coral }}>
            {lowRisk?"Low-Risk by Rochester Criteria":"Does Not Meet Low-Risk Criteria"}
          </div>
          <div style={{ fontFamily:S.sans,fontSize:11,color:T.txt3,marginTop:3,lineHeight:1.55 }}>
            {lowRisk?"May consider outpatient after LP with 24h f/u. Cultures must be followed."
            :"High-risk features present — hospitalize and treat empirically."}
          </div>
        </div>}
      </Card>}
    </div>
  );
}

// ── MEDICATIONS DATA ─────────────────────────────────────────────────
// ABX by condition: concs:[{l,m}] same structure as Discharge PO
// m = mg per mL of suspension (all concs shown simultaneously)
const ABX_CONDITIONS = [
  { id:"aom",  label:"Otitis Media (AOM)",     icon:"👂",color:T.orange,ages:["infant","child"],
    lines:[
      { tier:"1st line",           drug:"Amoxicillin HD",   mpkDose:42.5,freq:"q12h",max:1000,dur:"10d (<2y/severe) · 5–7d (≥2y mild)",
        concs:[{l:"125 mg/5 mL",m:25},{l:"250 mg/5 mL",m:50},{l:"400 mg/5 mL",m:80}] },
      { tier:"Failure/β-lactamase",drug:"Amox-clav ES 600", mpkDose:45,  freq:"q12h",max:1000,dur:"10d",
        concs:[{l:"600 mg/5 mL",m:120}] },
      { tier:"PCN allergy (mild)", drug:"Cefdinir",          mpkDose:7,   freq:"q12h",max:300, dur:"5–10d",
        concs:[{l:"125 mg/5 mL",m:25},{l:"250 mg/5 mL",m:50}] },
      { tier:"PCN allergy (sev)",  drug:"Azithromycin",      mpkDose:10,  freq:"Day1; 5mg/kg×4d",max:500,dur:"5d",
        concs:[{l:"100 mg/5 mL",m:20},{l:"200 mg/5 mL",m:40}] },
    ],
    note:"Watchful waiting: ≥2y, unilateral, mild. Return: worsening pain/fever >48h, ear drainage. AAFP/AAP 2013." },
  { id:"gas",  label:"Strep Pharyngitis",       icon:"🦠",color:T.coral,ages:["child"],
    lines:[
      { tier:"1st line",       drug:"Amoxicillin",  mpkDose:25,  freq:"q12h",max:500,dur:"10d",concs:[{l:"125 mg/5 mL",m:25},{l:"250 mg/5 mL",m:50},{l:"400 mg/5 mL",m:80}] },
      { tier:"Alternative",    drug:"Penicillin VK",mpkDose:12.5,freq:"q6h", max:500,dur:"10d",concs:[{l:"125 mg/5 mL",m:25},{l:"250 mg/5 mL",m:50}] },
      { tier:"PCN allergy",    drug:"Cephalexin",   mpkDose:12.5,freq:"q6h", max:500,dur:"10d",concs:[{l:"125 mg/5 mL",m:25},{l:"250 mg/5 mL",m:50}] },
      { tier:"PCN+ceph allergy",drug:"Clindamycin", mpkDose:7,   freq:"q8h", max:300,dur:"10d",concs:[{l:"75 mg/5 mL",m:15}] },
    ],
    note:"Rapid strep + culture recommended. Full 10-day course prevents ARF. Return: fever >2d on abx, rash, neck stiffness." },
  { id:"cap",  label:"Pneumonia (CAP, outpt)",  icon:"🫁",color:T.blue,ages:["infant","child"],
    lines:[
      { tier:"Typical (S. pneumo)",  drug:"Amoxicillin HD", mpkDose:42.5,freq:"q12h",max:1000,dur:"5–7d",concs:[{l:"125 mg/5 mL",m:25},{l:"250 mg/5 mL",m:50},{l:"400 mg/5 mL",m:80}] },
      { tier:"Atypical (Mycoplasma)",drug:"Azithromycin",   mpkDose:10,  freq:"Day1; 5mg/kg×4d",max:500,dur:"5d",concs:[{l:"100 mg/5 mL",m:20},{l:"200 mg/5 mL",m:40}] },
      { tier:"PCN allergy",          drug:"Clarithromycin", mpkDose:7.5, freq:"q12h",max:500,dur:"7–10d",concs:[{l:"125 mg/5 mL",m:25},{l:"250 mg/5 mL",m:50}] },
    ],
    note:"IDSA 2011: Amox first-line typical CAP. Add atypical ≥5y. Return: worsening breathing, cyanosis, fever >48h on abx." },
  { id:"uti",  label:"UTI / Pyelonephritis",    icon:"💧",color:T.cyan,ages:["all"],
    lines:[
      { tier:"Uncomplicated UTI",   drug:"TMP-SMX",   mpkDose:4,   freq:"q12h (TMP)",max:160,dur:"3–5d (≥2y) · 7–10d (<2y)",concs:[{l:"40 mg TMP/5 mL",m:8}] },
      { tier:"Alternative",         drug:"Cefdinir",   mpkDose:7,   freq:"q12h",max:300,dur:"5–7d",concs:[{l:"125 mg/5 mL",m:25},{l:"250 mg/5 mL",m:50}] },
      { tier:"Pyelo (oral)",        drug:"Cephalexin", mpkDose:12.5,freq:"q6h",max:500,dur:"10–14d",concs:[{l:"125 mg/5 mL",m:25},{l:"250 mg/5 mL",m:50}] },
      { tier:"Pyelo (IV→PO)",       drug:"Ceftriaxone IV → Cephalexin PO",mpkDose:null,freq:"IV until afebrile ×24h",max:null,dur:"14d total",concs:[] },
    ],
    note:"UA+culture BEFORE antibiotics. Culture required <2y. Return: worsening fever, flank pain, vomiting." },
  { id:"cell", label:"Cellulitis (non-purulent)",icon:"🩹",color:T.teal,ages:["all"],
    lines:[
      { tier:"1st line",        drug:"Cephalexin",  mpkDose:12.5,freq:"q6h",max:500,dur:"5–7d",concs:[{l:"125 mg/5 mL",m:25},{l:"250 mg/5 mL",m:50}] },
      { tier:"Alternative",     drug:"Amoxicillin", mpkDose:12.5,freq:"q8h",max:500,dur:"5–7d",concs:[{l:"125 mg/5 mL",m:25},{l:"250 mg/5 mL",m:50},{l:"400 mg/5 mL",m:80}] },
      { tier:"PCN/ceph allergy",drug:"Clindamycin", mpkDose:10,  freq:"q8h",max:450,dur:"5–7d",concs:[{l:"75 mg/5 mL",m:15}] },
    ],
    note:"Non-purulent: streptococcal. Mark borders. Elevate. Return: spreading beyond marked borders, fever >48h on abx." },
  { id:"ssti", label:"Purulent SSTI / Abscess", icon:"⚡",color:T.purple,ages:["all"],
    lines:[
      { tier:"MRSA (1st)",  drug:"TMP-SMX",    mpkDose:4,   freq:"q12h (TMP)",max:160,dur:"5–7d",concs:[{l:"40 mg TMP/5 mL",m:8}] },
      { tier:"Alternative", drug:"Clindamycin", mpkDose:10,  freq:"q8h",max:450,dur:"5–7d",concs:[{l:"75 mg/5 mL",m:15}] },
      { tier:"MSSA/mild",   drug:"Cephalexin",  mpkDose:12.5,freq:"q6h",max:500,dur:"5–7d",concs:[{l:"125 mg/5 mL",m:25},{l:"250 mg/5 mL",m:50}] },
    ],
    note:"I&D is primary therapy. Return: spreading, systemic symptoms, no improvement in 48h." },
  { id:"sinus",label:"Bacterial Sinusitis (ABRS)",icon:"🌀",color:T.gold,ages:["child"],
    lines:[
      { tier:"1st line",          drug:"Amoxicillin HD",    mpkDose:42.5,freq:"q12h",max:1000,dur:"10–14d",concs:[{l:"125 mg/5 mL",m:25},{l:"250 mg/5 mL",m:50},{l:"400 mg/5 mL",m:80}] },
      { tier:"Resistance risk",   drug:"Amox-clav ES 600",  mpkDose:45,  freq:"q12h",max:1000,dur:"10–14d",concs:[{l:"600 mg/5 mL",m:120}] },
      { tier:"PCN allergy (mild)",drug:"Cefdinir",           mpkDose:7,   freq:"q12h",max:300, dur:"10–14d",concs:[{l:"125 mg/5 mL",m:25},{l:"250 mg/5 mL",m:50}] },
    ],
    note:"Diagnose if: ≥10d without improvement, double sickening, or severe onset. AAP 2013." },
  { id:"bite", label:"Animal / Human Bite",      icon:"🦷",color:T.red,ages:["all"],
    lines:[
      { tier:"Dog/Cat/Human",drug:"Amox-clavulanate",mpkDose:13.3,freq:"q8h",max:500,dur:"3–5d prophy · 5–10d infected",concs:[{l:"200 mg/5 mL",m:40},{l:"400 mg/5 mL",m:80}] },
      { tier:"PCN allergy",  drug:"TMP-SMX + Metro",mpkDose:null,freq:"q12h + q8h",max:null,dur:"5–7d",concs:[] },
    ],
    note:"Cat bites: always treat (Pasteurella). Human bites: Eikenella coverage required. Update tetanus." },
  { id:"lyme", label:"Lyme Disease (EM)",        icon:"🌲",color:T.mint,ages:["child"],
    lines:[
      { tier:"< 8 years",  drug:"Amoxicillin",      mpkDose:16.7,freq:"q8h", max:500,dur:"14–21d EM · 28d arthritis",concs:[{l:"125 mg/5 mL",m:25},{l:"250 mg/5 mL",m:50}] },
      { tier:"≥ 8 years",  drug:"Doxycycline",       mpkDose:2.2, freq:"q12h",max:100,dur:"10–14d EM · 28d arthritis",concs:[{l:"25 mg/5 mL",m:5},{l:"50 mg/5 mL",m:10}] },
      { tier:"PCN allergy",drug:"Cefuroxime axetil",  mpkDose:15,  freq:"q12h",max:500,dur:"14–21d",concs:[{l:"125 mg/5 mL",m:25}] },
    ],
    note:"EM ≥5 cm = clinical diagnosis. Return: neurological symptoms, joint swelling, cardiac symptoms." },
  { id:"pertu",label:"Pertussis",                icon:"💨",color:T.green,ages:["all"],
    lines:[
      { tier:"< 1 month",           drug:"Azithromycin",mpkDose:10,freq:"q24h",max:500,dur:"5d",concs:[{l:"100 mg/5 mL",m:20},{l:"200 mg/5 mL",m:40}] },
      { tier:"≥ 1 month",           drug:"Azithromycin",mpkDose:10,freq:"Day1; 5mg/kg×4d",max:500,dur:"5d",concs:[{l:"100 mg/5 mL",m:20},{l:"200 mg/5 mL",m:40}] },
      { tier:"Macrolide intolerant", drug:"TMP-SMX",    mpkDose:4, freq:"q12h (TMP)",max:160,dur:"14d",concs:[{l:"40 mg TMP/5 mL",m:8}] },
    ],
    note:"Treat if onset <3 weeks. Treat ALL close contacts. Mandatory reporting." },
];

const DISCHARGE_ABX = [
  { name:"Amoxicillin (standard)",   dose:"40–50 mg/kg/day ÷ q8–12h",  mpkDose:16.7,freq:"q8h", max:500,dur:"10 days",
    concs:[{l:"125 mg/5 mL",m:25},{l:"200 mg/5 mL",m:40},{l:"250 mg/5 mL",m:50},{l:"400 mg/5 mL",m:80}],
    note:"Strep pharyngitis, mild CAP, UTI." },
  { name:"Amoxicillin (high-dose)",  dose:"80–90 mg/kg/day ÷ q12h",    mpkDose:42.5,freq:"q12h",max:1000,dur:"5–10 days",
    concs:[{l:"125 mg/5 mL",m:25},{l:"250 mg/5 mL",m:50},{l:"400 mg/5 mL",m:80}],
    note:"AOM first-line, sinusitis, high-dose CAP. Max 1 g/dose." },
  { name:"Amox-clavulanate ES 600",  dose:"90 mg/kg/day (amox) ÷ q12h",mpkDose:45,  freq:"q12h",max:1000,dur:"10 days",
    concs:[{l:"600 mg/5 mL",m:120}],note:"AOM failure, sinusitis resistant, bites." },
  { name:"Amox-clavulanate std",     dose:"25–45 mg/kg/day ÷ q8h",     mpkDose:13.3,freq:"q8h", max:500,dur:"5–10 days",
    concs:[{l:"200 mg/5 mL",m:40},{l:"400 mg/5 mL",m:80}],note:"Bites, sinusitis mild, polymicrobial." },
  { name:"Cephalexin",               dose:"25–50 mg/kg/day ÷ q6h",     mpkDose:12.5,freq:"q6h", max:500,dur:"5–10 days",
    concs:[{l:"125 mg/5 mL",m:25},{l:"250 mg/5 mL",m:50}],note:"MSSA cellulitis, UTI, strep, impetigo." },
  { name:"Cefdinir",                 dose:"14 mg/kg/day ÷ q12–24h",    mpkDose:7,   freq:"q12h",max:300,dur:"5–10 days",
    concs:[{l:"125 mg/5 mL",m:25},{l:"250 mg/5 mL",m:50}],note:"AOM (PCN allergy), sinusitis, CAP, UTI." },
  { name:"Cefpodoxime",              dose:"10 mg/kg/day ÷ q12h",       mpkDose:5,   freq:"q12h",max:200,dur:"5–10 days",
    concs:[{l:"50 mg/5 mL",m:10},{l:"100 mg/5 mL",m:20}],note:"UTI, AOM, CAP, sinusitis." },
  { name:"Cefuroxime axetil",        dose:"30 mg/kg/day ÷ q12h",       mpkDose:15,  freq:"q12h",max:500,dur:"10 days",
    concs:[{l:"125 mg/5 mL",m:25}],note:"AOM, sinusitis, Lyme (PCN allergy). Take with food." },
  { name:"Penicillin VK",            dose:"25–50 mg/kg/day ÷ q6–8h",   mpkDose:12.5,freq:"q6h", max:500,dur:"10 days",
    concs:[{l:"125 mg/5 mL",m:25},{l:"250 mg/5 mL",m:50}],note:"Strep pharyngitis, dental/oral infections." },
  { name:"Azithromycin",             dose:"10 mg/kg Day1; 5 mg/kg Days2–5",mpkDose:10,freq:"Day1 load",max:500,dur:"5 days",
    concs:[{l:"100 mg/5 mL",m:20},{l:"200 mg/5 mL",m:40}],note:"Atypical CAP, pertussis, AOM (PCN allergy)." },
  { name:"Clarithromycin",           dose:"15 mg/kg/day ÷ q12h",       mpkDose:7.5, freq:"q12h",max:500,dur:"7–14 days",
    concs:[{l:"125 mg/5 mL",m:25},{l:"250 mg/5 mL",m:50}],note:"Atypical CAP, MAC. Macrolide alternative." },
  { name:"Clindamycin",              dose:"20–30 mg/kg/day ÷ q8h",     mpkDose:10,  freq:"q8h", max:450,dur:"5–10 days",
    concs:[{l:"75 mg/5 mL",m:15}],note:"CA-MRSA SSTI, strep pharyngitis, anaerobic/dental." },
  { name:"TMP-SMX",                  dose:"8–12 mg/kg/day (TMP) ÷ q12h",mpkDose:4,  freq:"q12h",max:160,dur:"5–7 days",
    concs:[{l:"40 mg TMP/5 mL",m:8}],note:"CA-MRSA SSTI, UTI. Dose = TMP component. Avoid <2m, sulfa allergy." },
  { name:"Nitrofurantoin",           dose:"5–7 mg/kg/day ÷ q6h",       mpkDose:1.5, freq:"q6h", max:100,dur:"5–7 days",
    concs:[{l:"25 mg/5 mL",m:5}],note:"UTI only (not pyelonephritis). Avoid <1m, GFR <45." },
  { name:"Metronidazole",            dose:"15–35 mg/kg/day ÷ q8h",     mpkDose:10,  freq:"q8h", max:500,dur:"5–10 days",
    concs:[{l:"200 mg/5 mL",m:40}],note:"Anaerobic, C. diff (PO only), Giardia." },
  { name:"Doxycycline (≥ 8 years)", dose:"2.2 mg/kg/dose q12h",        mpkDose:2.2, freq:"q12h",max:100,dur:"10–21 days",
    concs:[{l:"25 mg/5 mL",m:5},{l:"50 mg/5 mL",m:10},{l:"Tabs/Caps",m:null}],
    note:"Lyme (≥8y), RMSF, MRSA SSTI, atypical CAP. Avoid <8y." },
];

// seizureSteps computed inside ResusTab (needs wt for mL calculations)

function calcDose(wt, mpkDose, max) {
  if (!mpkDose||!wt) return null;
  return Math.min(Math.round(wt * mpkDose), max);
}
const RESUS_SUBTABS = [
  { id:"resus",label:"Resuscitation",color:T.green  },
  { id:"abx",  label:"Antibiotics",  color:T.coral  },
  { id:"analg",label:"Analgesia/Sed",color:T.purple },
  { id:"resp", label:"Steroids/Resp",color:T.blue   },
];
const ABX_PILLS = [
  { id:"condition",label:"By Condition"  },
  { id:"iv",       label:"IV / Hospital" },
  { id:"po",       label:"Discharge (PO)"},
];
const AGE_FILTERS = [
  { id:null,     label:"All Ages" },
  { id:"infant", label:"Infant (1–12m)" },
  { id:"child",  label:"Child (>1y)" },
];

// ResusTab — all drug arrays now have solutions:[{l,v}] with mL precomputed per concentration
function ResusTab({ globalWt, setGlobalWt }) {
  const [weight,setWeight]=useState(globalWt||"");
  const [subTab,setSubTab]=useState("resus");
  const [abxPill,setAbxPill]=useState("condition");
  const [selCond,setSelCond]=useState(null);
  const [ageFilter,setAgeFilter]=useState(null);
  const [ageYrs,setAgeYrs]=useState("");
  const [gaAge,setGaAge]=useState("term");
  const wt=parseFloat(weight)||0; const ay=parseFloat(ageYrs)||0;
  const ettUncuffed=ay>=1?(ay/4+4).toFixed(1):ay>0?"3.5":"—";
  const ettCuffed=ay>=1?(ay/4+3.5).toFixed(1):ay>0?"3.0":"—";
  const ettDepth=ay>=1?(ay/2+12).toFixed(0):ay>0?"10–11":"—";
  const blade=ay===0?"—":ay<0.083?"0":ay<2?"1":ay<8?"2":"3";
  const lma=wt<=0?"—":wt<5?"1":wt<10?"1.5":wt<20?"2":wt<30?"2.5":wt<50?"3":"4";
  const maint=wt<=0?0:wt<=10?wt*4:wt<=20?40+(wt-10)*2:60+(wt-20)*1;
  const nWt=<div style={{ padding:"24px",textAlign:"center",fontFamily:S.sans,fontSize:12,color:T.txt4 }}>
    Enter patient weight above to calculate doses.</div>;

  // helper: convert numeric mL to string with 1 decimal
  const ml = (n) => n.toFixed(n < 1 ? 2 : 1);

  // Seizure escalation — full mL calculations per concentration
  const seizureSteps = [
    { step:"0–5 min", label:"First-Line Benzodiazepine", color:T.teal, drugs:wt>0?[
      { name:"Midazolam IN/IM (preferred — no IV needed)", dose:"0.2 mg/kg · max 10 mg",
        calc:`${Math.min(wt*.2,10).toFixed(1)} mg`,
        solutions:[{l:"5 mg/mL IN atomizer",v:ml(Math.min(wt*.2,10)/5)},{l:"5 mg/mL IM vial",v:ml(Math.min(wt*.2,10)/5)},{l:"1 mg/mL (diluted IV prep)",v:ml(Math.min(wt*.2,10)/1)}],
        note:"Split IN between nostrils if >0.5 mL/nostril. IM preferred over PR." },
      { name:"Lorazepam IV/IO", dose:"0.1 mg/kg · max 4 mg",
        calc:`${Math.min(wt*.1,4).toFixed(2)} mg`,
        solutions:[{l:"2 mg/mL",v:ml(Math.min(wt*.1,4)/2)},{l:"4 mg/mL",v:ml(Math.min(wt*.1,4)/4)}],
        note:"Preferred if IV access. Longer duration than diazepam." },
      { name:"Diazepam PR/IV", dose:"0.5 mg/kg (<5y) · 0.3 mg/kg (≥5y) · max 10 mg",
        calc:`${Math.min(wt*.5,10).toFixed(1)} mg PR`,
        solutions:[{l:"5 mg/mL rectal (Diastat)",v:ml(Math.min(wt*.5,10)/5)},{l:"5 mg/mL IV",v:ml(Math.min(wt*.5,10)/5)}],
        note:"PR onset 4–8 min. IV onset 1–3 min. Short duration — high recurrence." },
    ]:[] },
    { step:"5–10 min", label:"Repeat Benzodiazepine (same route)", color:T.gold, drugs:wt>0?[
      { name:"Repeat initial benzo × 1", dose:"Same dose, same route",
        calc:"Repeat first dose",solutions:[],
        note:"Repeat once if seizure persists at 5 min. Establish IV now if not present." },
    ]:[] },
    { step:"10–20 min", label:"Second-Line Agent — choose one", color:T.orange, drugs:wt>0?[
      { name:"Levetiracetam IV (preferred)", dose:"60 mg/kg IV over 5–10 min · max 4.5 g",
        calc:`${Math.min(wt*60,4500).toFixed(0)} mg`,
        solutions:[{l:"100 mg/mL stock",v:ml(Math.min(wt*60,4500)/100)},{l:"15 mg/mL (diluted infusion)",v:ml(Math.min(wt*60,4500)/15)}],
        note:"Preferred second-line. No cardiac monitoring needed. Dilute stock before infusion." },
      { name:"Valproate IV", dose:"40 mg/kg IV over 15 min · max 3 g",
        calc:`${Math.min(wt*40,3000).toFixed(0)} mg`,
        solutions:[{l:"100 mg/mL (stock)",v:ml(Math.min(wt*40,3000)/100)},{l:"5 mg/mL (diluted)",v:ml(Math.min(wt*40,3000)/5)}],
        note:"Avoid <2y, metabolic disorders, mitochondrial disease, liver disease." },
      { name:"Fosphenytoin IV/IO", dose:"20 PE/kg · max 1,500 PE · rate ≤3 mg PE/kg/min",
        calc:`${Math.min(wt*20,1500).toFixed(0)} PE`,
        solutions:[{l:"75 mg PE/mL",v:ml(Math.min(wt*20,1500)/75)},{l:"50 mg PE/mL",v:ml(Math.min(wt*20,1500)/50)}],
        note:"Monitor EKG and BP during infusion. Max rate 3 mg PE/kg/min." },
    ]:[] },
    { step:"> 20 min", label:"Refractory SE — ICU Required", color:T.coral, drugs:wt>0?[
      { name:"Phenobarbital IV", dose:"20 mg/kg IV over 20 min · max 1 g",
        calc:`${Math.min(wt*20,1000).toFixed(0)} mg`,
        solutions:[{l:"65 mg/mL",v:ml(Math.min(wt*20,1000)/65)},{l:"130 mg/mL",v:ml(Math.min(wt*20,1000)/130)}],
        note:"Monitor respirations — apnea risk especially after benzos. May repeat 5–10 mg/kg × 2." },
      { name:"Midazolam infusion", dose:"Load 0.1–0.2 mg/kg · then 0.05–0.4 mg/kg/hr drip",
        calc:`${Math.min(wt*.1,10).toFixed(1)}–${Math.min(wt*.2,10).toFixed(1)} mg load`,
        solutions:[{l:"1 mg/mL (diluted) load",v:`${ml(Math.min(wt*.1,10)/1)}–${ml(Math.min(wt*.2,10)/1)}`},{l:"5 mg/mL load",v:`${ml(Math.min(wt*.1,10)/5)}–${ml(Math.min(wt*.2,10)/5)}`}],
        note:"Drip: 0.05–0.4 mg/kg/hr. Continuous EEG monitoring. ICU transfer." },
      { name:"Ketamine IV (refractory)", dose:"1–2 mg/kg IV load · then 0.5–3 mg/kg/hr",
        calc:`${Math.min(wt*1,200).toFixed(0)}–${Math.min(wt*2,200).toFixed(0)} mg load`,
        solutions:[{l:"10 mg/mL",v:`${ml(Math.min(wt*1,200)/10)}–${ml(Math.min(wt*2,200)/10)}`},{l:"50 mg/mL",v:`${ml(Math.min(wt*1,200)/50)}–${ml(Math.min(wt*2,200)/50)}`}],
        note:"Emerging evidence for refractory SE. NMDA antagonism. Continuous EEG required." },
    ]:[] },
  ];

  // RSI package (co-calculated simultaneously)
  const rsiPkg=wt>0?[
    { name:"PRETREAT: Atropine (if < 1 year)", dose:"0.02 mg/kg IV · min 0.1 mg · max 0.5 mg",
      calc:`${Math.max(Math.min(wt*.02,.5),.1).toFixed(2)} mg`,
      solutions:[{l:"0.1 mg/mL",v:ml(Math.max(Math.min(wt*.02,.5),.1)/0.1)},{l:"0.4 mg/mL",v:ml(Math.max(Math.min(wt*.02,.5),.1)/0.4)}],
      note:"Give 1–2 min before succinylcholine in infants to prevent bradycardia." },
    { name:"INDUCTION: Ketamine (hemodynamically unstable / airways)", dose:"2 mg/kg IV · 4–5 mg/kg IM",
      calc:`${(wt*2).toFixed(0)} mg IV`,
      solutions:[{l:"10 mg/mL IV",v:ml(wt*2/10)},{l:"50 mg/mL IM",v:`${ml(wt*4/50)}–${ml(wt*5/50)}`}],
      note:"Preferred peds induction. Maintains airway reflexes. Bronchodilator." },
    { name:"INDUCTION: Etomidate (head trauma / concern for ICP)", dose:"0.3 mg/kg IV",
      calc:`${(wt*.3).toFixed(1)} mg`,
      solutions:[{l:"2 mg/mL",v:ml(wt*.3/2)}],
      note:"Rapid onset, hemodynamically neutral. Single dose only — adrenal suppression." },
    { name:"PARALYTIC: Succinylcholine", dose:`${wt<10?"2":"1.5"} mg/kg IV`,
      calc:`${wt<10?(wt*2).toFixed(0):(wt*1.5).toFixed(0)} mg`,
      solutions:[{l:"20 mg/mL",v:ml(wt<10?wt*2/20:wt*1.5/20)},{l:"100 mg/mL",v:ml(wt<10?wt*2/100:wt*1.5/100)}],
      note:"2 mg/kg if <10 kg. Contraindicated: hyperK, burn, crush, myopathy, denervation." },
    { name:"PARALYTIC: Rocuronium (if SCh contraindicated)", dose:"1.2 mg/kg IV",
      calc:`${(wt*1.2).toFixed(0)} mg`,
      solutions:[{l:"10 mg/mL",v:ml(wt*1.2/10)}],
      note:"Reversal: sugammadex 16 mg/kg IV. High dose required for RSI." },
    { name:"POST-INTUBATION: Fentanyl", dose:"1–2 mcg/kg IV",
      calc:`${Math.min(wt*1,100).toFixed(0)}–${Math.min(wt*2,100).toFixed(0)} mcg`,
      solutions:[{l:"50 mcg/mL",v:`${ml(Math.min(wt*1,100)/50)}–${ml(Math.min(wt*2,100)/50)}`},{l:"25 mcg/mL (diluted)",v:`${ml(Math.min(wt*1,100)/25)}–${ml(Math.min(wt*2,100)/25)}`}],
      note:"Analgesia and suppression of cough/gag. Give after tube confirmed." },
    { name:"POST-INTUBATION: Midazolam (sedation)", dose:"0.05–0.1 mg/kg IV q1–2h prn",
      calc:`${(wt*.05).toFixed(2)}–${Math.min(wt*.1,5).toFixed(1)} mg`,
      solutions:[{l:"1 mg/mL",v:`${ml(wt*.05/1)}–${ml(Math.min(wt*.1,5)/1)}`},{l:"5 mg/mL",v:`${ml(wt*.05/5)}–${ml(Math.min(wt*.1,5)/5)}`}],
      note:"Sedation maintenance. Titrate to comfort. Consider continuous infusion." },
  ]:[];

  // Vasopressor drips — mL/hr at starting dose
  const vasopressors=wt>0?[
    { name:"Epinephrine drip (cold shock — low BP + cool mottled extremities)", dose:"0.1–1 mcg/kg/min IV/IO",
      calc:`Start: ${(wt*.1).toFixed(2)} mcg/min → ${(wt*1).toFixed(1)} mcg/min max`,
      solutions:[{l:"0.1 mg/mL (100 mcg/mL) start rate",v:`${((wt*.1/100)*60).toFixed(1)} mL/hr`},{l:"0.04 mg/mL (40 mcg/mL) start rate",v:`${((wt*.1/40)*60).toFixed(1)} mL/hr`}],
      note:"Preferred for cold shock. Start 0.1 mcg/kg/min — titrate to MAP. Central line preferred." },
    { name:"Norepinephrine drip (warm shock — low BP + warm flushed extremities)", dose:"0.05–2 mcg/kg/min IV",
      calc:`Start: ${(wt*.05).toFixed(3)} mcg/min`,
      solutions:[{l:"0.1 mg/mL (100 mcg/mL) start rate",v:`${((wt*.05/100)*60).toFixed(2)} mL/hr`},{l:"0.04 mg/mL (40 mcg/mL) start rate",v:`${((wt*.05/40)*60).toFixed(2)} mL/hr`}],
      note:"Preferred for warm/distributive shock. Central line required." },
    { name:"Dopamine drip", dose:"5–20 mcg/kg/min IV",
      calc:`${(wt*5).toFixed(0)}–${(wt*20).toFixed(0)} mcg/min`,
      solutions:[{l:"1.6 mg/mL (1600 mcg/mL) std peds",v:`${((wt*5/1600)*60).toFixed(1)}–${((wt*20/1600)*60).toFixed(1)} mL/hr`},{l:"3.2 mg/mL (3200 mcg/mL)",v:`${((wt*5/3200)*60).toFixed(1)}–${((wt*20/3200)*60).toFixed(1)} mL/hr`}],
      note:"5–10 mcg/kg/min (β-effect); 10–20 mcg/kg/min (α-effect). Second-line to epi." },
    { name:"Vasopressin (refractory)", dose:"0.0003–0.002 units/kg/min IV",
      calc:`${(wt*.0003).toFixed(4)}–${(wt*.002).toFixed(4)} units/min`,
      solutions:[{l:"0.04 units/mL (standard dilution)",v:`${((wt*.0003/.04)*60).toFixed(2)}–${((wt*.002/.04)*60).toFixed(2)} mL/hr`}],
      note:"Catecholamine-refractory vasodilatory shock. Fixed dose regardless of weight in some centers." },
  ]:[];

  const resusDrugs=wt>0?[
    { name:"Epinephrine (arrest)",    dose:"0.01 mg/kg IV/IO · max 1 mg",  calc:`${(wt*.01).toFixed(2)} mg`,
      solutions:[{l:"1:10,000 IV/IO (0.1 mg/mL)",v:ml(wt*.01/0.1)},{l:"1:1,000 IM (1 mg/mL)",v:ml(wt*.01/1)}],
      note:"q3–5 min. Drip: 0.1–1 mcg/kg/min." },
    { name:"Atropine",               dose:"0.02 mg/kg IV/IO · min 0.1 mg · max 0.5 mg",calc:`${(wt*.02).toFixed(2)} mg`,
      solutions:[{l:"0.1 mg/mL",v:ml(wt*.02/0.1)},{l:"0.4 mg/mL",v:ml(wt*.02/0.4)},{l:"1 mg/mL",v:ml(wt*.02/1)}],
      note:"Bradycardia with poor perfusion. Pretreat <1yr." },
    { name:"Adenosine (SVT)",         dose:"0.1 mg/kg IV rapid · max 6 mg", calc:`${(wt*.1).toFixed(2)} mg`,
      solutions:[{l:"3 mg/mL",v:ml(wt*.1/3)}],
      note:"Flush rapidly with NS. 2nd dose 0.2 mg/kg (max 12 mg)." },
    { name:"Amiodarone (VF/pVT)",     dose:"5 mg/kg IV/IO · max 300 mg",   calc:`${Math.min(wt*5,300).toFixed(0)} mg`,
      solutions:[{l:"50 mg/mL (stock)",v:ml(Math.min(wt*5,300)/50)},{l:"1.5 mg/mL (diluted)",v:ml(Math.min(wt*5,300)/1.5)}],
      note:"Push in arrest; infuse 20–60 min otherwise. Max 3 doses." },
    { name:"Lidocaine (VF/pVT alt)",  dose:"1 mg/kg IV/IO · max 100 mg",   calc:`${Math.min(wt*1,100).toFixed(1)} mg`,
      solutions:[{l:"1% (10 mg/mL)",v:ml(Math.min(wt*1,100)/10)},{l:"2% (20 mg/mL)",v:ml(Math.min(wt*1,100)/20)}],
      note:"Alt to amiodarone. Drip: 20–50 mcg/kg/min." },
    { name:"Calcium chloride 10%",    dose:"20 mg/kg IV/IO · max 2 g",     calc:`${Math.min(wt*20,2000).toFixed(0)} mg`,
      solutions:[{l:"10% (100 mg/mL)",v:ml(Math.min(wt*20,2000)/100)}],
      note:"Hypocalcemia, hyperK, CCB toxicity. Central line preferred." },
    { name:"Sodium bicarbonate 8.4%", dose:"1 mEq/kg IV",                  calc:`${(wt*1).toFixed(1)} mEq`,
      solutions:[{l:"8.4% (1 mEq/mL)",v:ml(wt*1/1)}],
      note:"Dilute 1:1 with sterile water in neonates. Confirm acidosis." },
    { name:"Dextrose (hypoglycemia)", dose:"D10W 2–4 mL/kg",               calc:`${(wt*2).toFixed(0)}–${(wt*4).toFixed(0)} mL D10W`,
      solutions:[{l:"D10W (100 mg/mL) mL/kg×wt",v:`${(wt*2).toFixed(0)}–${(wt*4).toFixed(0)}`},{l:"D25W mL equiv",v:`${(wt*1).toFixed(0)}–${(wt*2).toFixed(0)}`},{l:"D50W mL equiv",v:`${ml(wt*0.5)}–${(wt*1).toFixed(0)}`}],
      note:"D10W neonates; D25W infants; D50W adolescents. Confirm BG." },
    { name:"Naloxone",                dose:"0.01 mg/kg IV/IM/IN · max 4 mg",calc:`${(wt*.01).toFixed(3)} mg`,
      solutions:[{l:"0.4 mg/mL IV/IM",v:ml(wt*.01/0.4)},{l:"1 mg/mL IN atomizer",v:ml(wt*.1/1)}],
      note:"IV: titrate to respirations. IN dose = 0.1 mg/kg (10× IV dose)." },
    { name:"Normal saline (bolus)",   dose:"10–20 mL/kg IV/IO",            calc:`${(wt*10).toFixed(0)}–${(wt*20).toFixed(0)} mL NS`,
      solutions:[{l:"NS bolus volume",v:`${(wt*10).toFixed(0)}–${(wt*20).toFixed(0)}`}],
      note:"Septic shock: 10 mL/kg aliquots. Max 60 mL/kg then reassess." },
    { name:"RSI: Ketamine",           dose:"1–2 mg/kg IV · 4–5 mg/kg IM",  calc:`${(wt*1).toFixed(0)}–${(wt*2).toFixed(0)} mg IV`,
      solutions:[{l:"10 mg/mL IV",v:`${ml(wt*1/10)}–${ml(wt*2/10)}`},{l:"50 mg/mL IM",v:`${ml(wt*4/50)}–${ml(wt*5/50)}`},{l:"500 mg/10 mL (50 mg/mL) IM",v:`${ml(wt*4/50)}–${ml(wt*5/50)}`}],
      note:"Preferred peds RSI induction. IM 4–5 mg/kg if no IV." },
    { name:"RSI: Succinylcholine",    dose:`${wt<10?"2":"1.5"} mg/kg IV`,  calc:`${wt<10?(wt*2).toFixed(0):(wt*1.5).toFixed(0)} mg`,
      solutions:[{l:"20 mg/mL",v:ml(wt<10?(wt*2/20):(wt*1.5/20))},{l:"100 mg/mL",v:ml(wt<10?(wt*2/100):(wt*1.5/100))}],
      note:"2 mg/kg if <10 kg. Atropine pretreatment <1 yr." },
    { name:"RSI: Rocuronium",         dose:"1.2 mg/kg IV",                  calc:`${(wt*1.2).toFixed(0)} mg`,
      solutions:[{l:"10 mg/mL",v:ml(wt*1.2/10)}],
      note:"Reversal: sugammadex 16 mg/kg IV." },
  ]:[];

  const neonAbx=wt>0?[
    { name:"Ampicillin — sepsis",  dose:"50 mg/kg IV q6h",
      calc:`${(wt*50).toFixed(0)} mg q6h`,
      solutions:[{l:"100 mg/mL (post-recon)",v:ml(wt*50/100)},{l:"50 mg/mL (post-recon)",v:ml(wt*50/50)}],
      note:"Meningitis: 100 mg/kg q6h. GBS, Listeria, enterococcus." },
    { name:"Gentamicin — neonatal",dose:"4 mg/kg IV q24h",
      calc:`${(wt*4).toFixed(0)} mg q24h`,
      solutions:[{l:"10 mg/mL (peds vial)",v:ml(wt*4/10)},{l:"40 mg/mL (adult vial)",v:ml(wt*4/40)}],
      note:"7–28d: 3.5 mg/kg q24h. Trough levels required." },
    { name:"Acyclovir — HSV",      dose:"20 mg/kg IV q8h",
      calc:`${(wt*20).toFixed(0)} mg q8h`,
      solutions:[{l:"50 mg/mL stock → dilute to ≤7 mg/mL",v:ml(wt*20/50)},{l:"7 mg/mL (infuse over 1h)",v:ml(wt*20/7)}],
      note:"Neonatal HSV: 14–21d. Dilute stock before infusion. CSF PCR first." },
  ]:[];

  const broadAbx=wt>0?[
    { name:"Ceftriaxone",          dose:"50 mg/kg IV/IM q24h · max 2 g",
      calc:`${Math.min(wt*50,2000).toFixed(0)} mg`,
      solutions:[{l:"40 mg/mL IV (infusion)",v:ml(Math.min(wt*50,2000)/40)},{l:"100 mg/mL IV (push)",v:ml(Math.min(wt*50,2000)/100)},{l:"250 mg/mL IM",v:ml(Math.min(wt*50,2000)/250)},{l:"350 mg/mL IM",v:ml(Math.min(wt*50,2000)/350)}],
      note:"Meningitis: 100 mg/kg q24h (max 4 g). Sepsis, pneumonia, UTI." },
    { name:"Cefazolin",            dose:"25 mg/kg IV q8h · max 2 g",
      calc:`${Math.min(wt*25,2000).toFixed(0)} mg`,
      solutions:[{l:"100 mg/mL (post-dilution)",v:ml(Math.min(wt*25,2000)/100)},{l:"330 mg/mL (piggyback)",v:ml(Math.min(wt*25,2000)/330)}],
      note:"Max 2 g/dose. MSSA, SSTI, surgical prophylaxis." },
    { name:"Ampicillin-sulbactam", dose:"50 mg/kg IV q6h · max 3 g",
      calc:`${Math.min(wt*50,3000).toFixed(0)} mg`,
      solutions:[{l:"45 mg/mL (infusion)",v:ml(Math.min(wt*50,3000)/45)},{l:"90 mg/mL (post-recon)",v:ml(Math.min(wt*50,3000)/90)}],
      note:"Max 3 g/dose. Polymicrobial, bites, aspiration." },
    { name:"Piperacillin-tazobactam",dose:"100 mg/kg IV q8h · max 4.5 g",
      calc:`${Math.min(wt*100,4500).toFixed(0)} mg`,
      solutions:[{l:"80 mg/mL (infusion)",v:ml(Math.min(wt*100,4500)/80)},{l:"200 mg/mL (post-recon)",v:ml(Math.min(wt*100,4500)/200)}],
      note:"Max 4.5 g/dose. Pseudomonas, febrile neutropenia." },
    { name:"Meropenem",            dose:"20 mg/kg IV q8h · max 1 g",
      calc:`${Math.min(wt*20,1000).toFixed(0)} mg`,
      solutions:[{l:"50 mg/mL (post-dilution)",v:ml(Math.min(wt*20,1000)/50)},{l:"100 mg/mL (post-recon)",v:ml(Math.min(wt*20,1000)/100)}],
      note:"Meningitis: 40 mg/kg q8h (max 2 g). MDR organisms." },
  ]:[];

  const mrsaAbx=wt>0?[
    { name:"Vancomycin",    dose:"15 mg/kg IV q6h · max 750 mg",
      calc:`${Math.min(wt*15,750).toFixed(0)} mg`,
      solutions:[{l:"5 mg/mL (post-dilution)",v:ml(Math.min(wt*15,750)/5)},{l:"10 mg/mL (post-dilution)",v:ml(Math.min(wt*15,750)/10)}],
      note:"Max 60 mg/kg/day. AUC-guided dosing; target AUC/MIC 400–600. Check levels." },
    { name:"Clindamycin IV",dose:"10 mg/kg IV q8h · max 600 mg",
      calc:`${Math.min(wt*10,600).toFixed(0)} mg`,
      solutions:[{l:"12 mg/mL (post-dilution)",v:ml(Math.min(wt*10,600)/12)},{l:"18 mg/mL (post-dilution)",v:ml(Math.min(wt*10,600)/18)}],
      note:"Max 600 mg/dose. CA-MRSA, osteomyelitis." },
    { name:"TMP-SMX IV",    dose:"4–5 mg/kg (TMP) q12h",
      calc:`${(wt*4).toFixed(0)}–${(wt*5).toFixed(0)} mg TMP`,
      solutions:[{l:"16 mg TMP/mL stock",v:`${ml(wt*4/16)}–${ml(wt*5/16)}`},{l:"diluted for infusion to ~1 mg/mL",v:`${(wt*4).toFixed(0)}–${(wt*5).toFixed(0)}`}],
      note:"MRSA, UTI. Dilute for infusion. Avoid neonates." },
  ]:[];

  const opioids=wt>0?[
    { name:"Fentanyl IV",  dose:"1–2 mcg/kg IV · max 100 mcg",  calc:`${Math.min(wt*1,100).toFixed(0)}–${Math.min(wt*2,100).toFixed(0)} mcg`,
      solutions:[{l:"50 mcg/mL IV",v:`${ml(Math.min(wt*1,100)/50)}–${ml(Math.min(wt*2,100)/50)}`},{l:"25 mcg/mL (diluted)",v:`${ml(Math.min(wt*1,100)/25)}–${ml(Math.min(wt*2,100)/25)}`}],
      note:"Onset 1–2 min IV. Titrate. IN route: 2 mcg/kg using 500 mcg/mL atomizer." },
    { name:"Fentanyl IN",  dose:"2 mcg/kg intranasal · max 100 mcg",calc:`${Math.min(wt*2,100).toFixed(0)} mcg`,
      solutions:[{l:"500 mcg/mL IN atomizer",v:ml(Math.min(wt*2,100)/500)},{l:"100 mcg/mL IN atomizer",v:ml(Math.min(wt*2,100)/100)}],
      note:"Max 1 mL per nostril. Use concentrated formulation for IN." },
    { name:"Morphine",     dose:"0.1 mg/kg IV/IM · max 4 mg",    calc:`${Math.min(wt*.1,4).toFixed(2)} mg`,
      solutions:[{l:"1 mg/mL",v:ml(Math.min(wt*.1,4)/1)},{l:"2 mg/mL",v:ml(Math.min(wt*.1,4)/2)},{l:"4 mg/mL",v:ml(Math.min(wt*.1,4)/4)}],
      note:"Slower onset. Histamine release risk. Max 4 mg/dose IV." },
    { name:"Hydromorphone",dose:"0.015 mg/kg IV · max 1 mg",     calc:`${Math.min(wt*.015,1).toFixed(3)} mg`,
      solutions:[{l:"0.2 mg/mL",v:ml(Math.min(wt*.015,1)/0.2)},{l:"1 mg/mL",v:ml(Math.min(wt*.015,1)/1)},{l:"2 mg/mL",v:ml(Math.min(wt*.015,1)/2)}],
      note:"5× more potent than morphine. Titrate carefully." },
  ]:[];

  const nonOpioids=wt>0?[
    { name:"Ketorolac IV",        dose:"0.5 mg/kg IV · max 15 mg", calc:`${Math.min(wt*.5,15).toFixed(1)} mg`,
      solutions:[{l:"15 mg/mL",v:ml(Math.min(wt*.5,15)/15)},{l:"30 mg/mL",v:ml(Math.min(wt*.5,15)/30)}],
      note:"Max 15 mg IV peds. Avoid bleeding risk, AKI, < 6 months." },
    { name:"Acetaminophen IV",    dose:"15 mg/kg IV q6h · max 1 g", calc:`${Math.min(wt*15,1000).toFixed(0)} mg`,
      solutions:[{l:"10 mg/mL (Ofirmev bag)",v:ml(Math.min(wt*15,1000)/10)}],
      note:"Max 1 g/dose; <75 mg/kg/day. Pre-mixed 10 mg/mL bags." },
    { name:"Ibuprofen PO",        dose:"10 mg/kg PO q6–8h · max 800 mg",calc:`${Math.min(wt*10,800).toFixed(0)} mg`,
      solutions:[{l:"100 mg/5 mL (20 mg/mL)",v:ml(Math.min(wt*10,800)/20)},{l:"50 mg/1.25 mL (40 mg/mL infant drops)",v:ml(Math.min(wt*10,800)/40)}],
      note:"Max 800 mg/dose. Avoid <6m, AKI, GI bleeding. Infant drops (40 mg/mL) often pharmacy-packaged by weight tier — verify with dispenser." },
    { name:"Acetaminophen PO/PR", dose:"15 mg/kg q4–6h · max 1 g",  calc:`${Math.min(wt*15,1000).toFixed(0)} mg`,
      solutions:[{l:"160 mg/5 mL (32 mg/mL)",v:ml(Math.min(wt*15,1000)/32)},{l:"80 mg/0.8 mL drops (100 mg/mL)",v:ml(Math.min(wt*15,1000)/100)},{l:"650 mg suppository",v:"per kg"},{l:"325 mg suppository",v:"per kg"}],
      note:"Max 1 g/dose; max 5 doses/day." },
  ]:[];

  const sedation=wt>0?[
    { name:"Ketamine (PSA)",   dose:"1–2 mg/kg IV · 4–5 mg/kg IM",  calc:`${(wt*1).toFixed(0)}–${(wt*2).toFixed(0)} mg IV`,
      solutions:[{l:"10 mg/mL IV",v:`${ml(wt*1/10)}–${ml(wt*2/10)}`},{l:"50 mg/mL IM",v:`${ml(wt*4/50)}–${ml(wt*5/50)}`},{l:"100 mg/mL IM",v:`${ml(wt*4/100)}–${ml(wt*5/100)}`}],
      note:"Dissociative. Pre-treat ondansetron. Preferred >3m." },
    { name:"Midazolam",        dose:"0.1 mg/kg IV · 0.2 mg/kg IN",  calc:`${(wt*.1).toFixed(2)} mg IV · ${Math.min(wt*.2,10).toFixed(1)} mg IN`,
      solutions:[{l:"1 mg/mL IV",v:ml(wt*.1/1)},{l:"5 mg/mL IV",v:ml(wt*.1/5)},{l:"5 mg/mL IN atomizer",v:ml(Math.min(wt*.2,10)/5)}],
      note:"Max 10 mg IN/IM. Reversal: flumazenil 0.01 mg/kg IV." },
    { name:"Dexmedetomidine",  dose:"1–2 mcg/kg IV ×10 min · 2–3 mcg/kg IN",calc:`${(wt*1).toFixed(0)}–${(wt*2).toFixed(0)} mcg IV`,
      solutions:[{l:"4 mcg/mL IV (diluted)",v:`${ml(wt*1/4)}–${ml(wt*2/4)}`},{l:"100 mcg/mL IN stock",v:ml(Math.min(wt*2.5,200)/100)}],
      note:"No respiratory depression. MRI, wound care, procedures." },
    { name:"Propofol (PSA)",   dose:"1–2 mg/kg IV",                   calc:`${(wt*1).toFixed(0)}–${(wt*2).toFixed(0)} mg`,
      solutions:[{l:"10 mg/mL",v:`${ml(wt*1/10)}–${ml(wt*2/10)}`}],
      note:"Airway provider required. Lidocaine pre-treat for pain at injection." },
    { name:"Etomidate",        dose:"0.3 mg/kg IV",                   calc:`${(wt*.3).toFixed(1)} mg`,
      solutions:[{l:"2 mg/mL",v:ml(wt*.3/2)}],
      note:"Rapid onset, minimal hemodynamic effect. Single induction dose." },
  ]:[];

  const anaphylaxis=wt>0?[
    { name:"Epinephrine 1:1000 IM", dose:"0.01 mg/kg IM · max 0.5 mg",  calc:`${Math.min(wt*.01,.5).toFixed(3)} mg`,
      solutions:[{l:"1:1,000 (1 mg/mL) IM",v:ml(Math.min(wt*.01,.5)/1)}],
      note:"Max 0.5 mg. Auto-injector: <15 kg → 0.15 mg; ≥15 kg → 0.3 mg." },
    { name:"Diphenhydramine",       dose:"1 mg/kg IV/IM/PO · max 50 mg", calc:`${Math.min(wt*1,50).toFixed(0)} mg`,
      solutions:[{l:"50 mg/mL IV/IM",v:ml(Math.min(wt*1,50)/50)},{l:"12.5 mg/5 mL PO (2.5 mg/mL)",v:ml(Math.min(wt*1,50)/2.5)}],
      note:"Adjunct only — NEVER delay epinephrine for antihistamine." },
  ]:[];

  const steroids=wt>0?[
    { name:"Dexamethasone (croup)", dose:"0.6 mg/kg PO/IM/IV × 1 · max 10 mg", calc:`${Math.min(wt*.6,10).toFixed(1)} mg`,
      solutions:[{l:"4 mg/mL IV/IM",v:ml(Math.min(wt*.6,10)/4)},{l:"1 mg/mL PO elixir",v:ml(Math.min(wt*.6,10)/1)},{l:"0.5 mg/5 mL (0.1 mg/mL) PO",v:ml(Math.min(wt*.6,10)/.1)}],
      note:"Max 10 mg. Single dose. Oral = IV bioavailability. PO preferred." },
    { name:"Dexamethasone (asthma)",dose:"0.6 mg/kg PO/IV × 1–2d · max 16 mg", calc:`${Math.min(wt*.6,16).toFixed(1)} mg/day`,
      solutions:[{l:"4 mg/mL IV",v:ml(Math.min(wt*.6,16)/4)},{l:"1 mg/mL PO elixir",v:ml(Math.min(wt*.6,16)/1)}],
      note:"Max 16 mg/day. Non-inferior to 5-day prednisone course." },
    { name:"Methylprednisolone",    dose:"1–2 mg/kg IV q6–12h · max 125 mg",   calc:`${(wt*1).toFixed(0)}–${Math.min(wt*2,125).toFixed(0)} mg`,
      solutions:[{l:"40 mg/mL (Solu-Medrol post-recon)",v:`${ml(wt*1/40)}–${ml(Math.min(wt*2,125)/40)}`},{l:"125 mg/2 mL (62.5 mg/mL)",v:`${ml(wt*1/62.5)}–${ml(Math.min(wt*2,125)/62.5)}`}],
      note:"Max 125 mg/dose. Severe asthma, anaphylaxis, croup (IV route)." },
    { name:"Prednisolone",          dose:"1 mg/kg PO q24h · max 60 mg",         calc:`${Math.min(wt*1,60).toFixed(0)} mg/day`,
      solutions:[{l:"15 mg/5 mL (3 mg/mL) Orapred",v:ml(Math.min(wt*1,60)/3)},{l:"1 mg/mL Pediapred",v:ml(Math.min(wt*1,60)/1)}],
      note:"Max 60 mg/day. Asthma exacerbation, croup." },
  ]:[];

  const resp=wt>0?[
    { name:"Albuterol neb",       dose:"0.15 mg/kg neb q20min × 3 · min 2.5 mg · max 5 mg",
      calc:`${Math.max(Math.min(wt*.15,5),2.5).toFixed(1)} mg`,
      solutions:[{l:"5 mg/mL (0.5% soln) + NS to 3 mL",v:ml(Math.max(Math.min(wt*.15,5),2.5)/5)},{l:"2.5 mg/3 mL unit-dose",v:"1 unit-dose"}],
      note:"Continuous: 0.5 mg/kg/h (max 20 mg/h). MDI 90 mcg/puff = neb in mild-mod." },
    { name:"Ipratropium neb",     dose:`${wt<20?"250":"500"} mcg neb q20 min × 3`,
      calc:`${wt<20?"250":"500"} mcg`,
      solutions:[{l:wt<20?"500 mcg/2.5 mL → use 1.25 mL":"500 mcg/2.5 mL unit-dose",v:wt<20?"1.25":"2.5"}],
      note:"Additive with albuterol in severe asthma. q20 min × 3 doses." },
    { name:"Magnesium sulfate",   dose:"25–75 mg/kg IV · max 2.5 g",
      calc:`${Math.min(wt*25,500).toFixed(0)}–${Math.min(wt*75,2500).toFixed(0)} mg`,
      solutions:[{l:"500 mg/mL stock (dilute to ≤60 mg/mL)",v:`${ml(Math.min(wt*25,500)/500)}–${ml(Math.min(wt*75,2500)/500)}`},{l:"100 mg/mL (diluted infusion)",v:`${ml(Math.min(wt*25,500)/100)}–${ml(Math.min(wt*75,2500)/100)}`}],
      note:"Severe asthma / refractory bronchospasm. Infuse over 20–30 min. Monitor BP." },
    { name:"Racemic epi neb",     dose:"0.5 mL of 2.25% in 3 mL NS · fixed",
      calc:"0.5 mL (fixed dose)",
      solutions:[{l:"2.25% solution (fixed)",v:"0.5"}],
      note:"Croup, post-extubation stridor. Observe ≥2h for rebound." },
    { name:"L-Epi 1:1000 neb",   dose:"0.5 mL/kg neb · max 5 mL",
      calc:`${Math.min(wt*.5,5).toFixed(1)} mL`,
      solutions:[{l:"1:1,000 (1 mg/mL) in 3 mL NS",v:ml(Math.min(wt*.5,5)/1)}],
      note:"Croup — same efficacy as racemic epi. Observe ≥2h for rebound." },
  ]:[];

  const antiemetics=wt>0?[
    { name:"Ondansetron IV/IM", dose:"0.15 mg/kg IV · max 4 mg", calc:`${Math.min(wt*.15,4).toFixed(2)} mg`,
      solutions:[{l:"2 mg/mL",v:ml(Math.min(wt*.15,4)/2)},{l:"0.4 mg/mL (diluted)",v:ml(Math.min(wt*.15,4)/0.4)}],
      note:"Max 4 mg. Repeat q4–6h prn. Most-used peds antiemetic in ED." },
    { name:"Ondansetron ODT",   dose:"<30 kg: 4 mg · ≥30 kg: 8 mg", calc:wt<30?"4 mg ODT":"8 mg ODT",
      solutions:[{l:"Solid ODT — dissolves on tongue",v:"—"}],
      note:"Ideal when vomiting makes PO difficult. No mL — solid dosage form." },
    { name:"Promethazine",      dose:"0.25–0.5 mg/kg IV/IM q4–6h · max 25 mg",calc:`${Math.min(wt*.3,25).toFixed(1)} mg`,
      solutions:[{l:"25 mg/mL",v:ml(Math.min(wt*.3,25)/25)},{l:"50 mg/mL",v:ml(Math.min(wt*.3,25)/50)}],
      note:"Avoid <2y (respiratory depression). Never IV push undiluted." },
  ]:[];

  const bloodProd=wt>0?[
    { name:"pRBC",          dose:"10–15 mL/kg IV over 3–4h",     calc:`${(wt*10).toFixed(0)}–${(wt*15).toFixed(0)} mL`,
      solutions:[{l:"Volume IS the dose",v:`${(wt*10).toFixed(0)}–${(wt*15).toFixed(0)}`}],
      note:"Each 10 mL/kg raises Hgb ~2–3 g/dL." },
    { name:"FFP",           dose:"10–15 mL/kg IV over 30–60 min", calc:`${(wt*10).toFixed(0)}–${(wt*15).toFixed(0)} mL`,
      solutions:[{l:"Volume IS the dose",v:`${(wt*10).toFixed(0)}–${(wt*15).toFixed(0)}`}],
      note:"Coagulopathy, factor deficiency. Allow 30 min thaw time." },
    { name:"Platelets",     dose:"5–10 mL/kg IV over 30 min",    calc:`${(wt*5).toFixed(0)}–${(wt*10).toFixed(0)} mL`,
      solutions:[{l:"Volume IS the dose",v:`${(wt*5).toFixed(0)}–${(wt*10).toFixed(0)}`}],
      note:"1 apheresis unit for larger children. Give over 30 min." },
    { name:"Cryoprecipitate",dose:"1–2 units per 10 kg",          calc:`${Math.max(Math.round(wt/10),1)}–${Math.max(Math.round(wt/5),1)} units`,
      solutions:[{l:"~10–15 mL per unit",v:`${Math.max(Math.round(wt/10),1)}–${Math.max(Math.round(wt/5),1)} units`}],
      note:"Fibrinogen replacement. Target fibrinogen > 100 mg/dL." },
  ]:[];

  const antiviral=wt>0?[
    { name:"Oseltamivir (Tamiflu)", dose:"Weight-based × 5 days",
      calc:wt<15?"30 mg q12h":wt<23?"45 mg q12h":wt<40?"60 mg q12h":"75 mg q12h",
      solutions:[
        {l:"6 mg/mL suspension",v:wt<15?"5":wt<23?"7.5":wt<40?"10":"12.5"},
        {l:"75 mg capsule",v:wt>=40?"1 cap":"see dose"},
      ],
      note:"Start within 48h of onset. ≥1 year standard dosing above." },
    ...(wt<10?[{ name:"Oseltamivir (Neonatal/Infant — compounded)", dose:"3 mg/kg q12h × 5 days (≥2 weeks GA)",
      calc:`${(wt*3).toFixed(1)} mg q12h`,
      solutions:[{l:"6 mg/mL susp (compounded)",v:ml(wt*3/6)},{l:"15 mg/mL (alt compounded)",v:ml(wt*3/15)}],
      note:"Neonates ≥2 weeks gestational age. Standard suspension may need compounding." }]:[]),
  ]:[];

  const filteredConds = ageFilter===null ? ABX_CONDITIONS
    : ABX_CONDITIONS.filter(c=>c.ages.includes("all")||c.ages.includes(ageFilter));
  const cond=ABX_CONDITIONS.find(c=>c.id===selCond);

  return (
    <div className="peds-in">
      <Card color={T.green} title="Patient Weight (kg) — All Doses Weight-Based">
        <div style={{ display:"flex",alignItems:"center",gap:10,flexWrap:"wrap" }}>
          <input type="number" value={weight} onChange={e=>{ setWeight(e.target.value); setGlobalWt(e.target.value); }}
            placeholder="kg"
            style={{ width:110,padding:"10px 12px",background:"rgba(5,13,32,0.92)",
              border:`1px solid ${weight?T.green+"55":"rgba(30,70,130,0.4)"}`,
              borderRadius:8,outline:"none",fontFamily:S.mono,fontSize:18,fontWeight:900,color:T.green }} />
          <div style={{ fontFamily:S.sans,fontSize:11,color:T.txt4,lineHeight:1.6 }}>
            Enter weight → every drug shows mg/dose + mL for each available concentration simultaneously.
          </div>
        </div>
      </Card>
      <div style={{ display:"flex",gap:4,flexWrap:"wrap",padding:"4px",marginBottom:9,
        background:"rgba(5,13,32,0.75)",border:"1px solid rgba(30,70,130,0.35)",borderRadius:10 }}>
        {RESUS_SUBTABS.map(st=>(
          <button key={st.id} onClick={()=>setSubTab(st.id)}
            style={{ flex:1,padding:"5px 8px",borderRadius:7,cursor:"pointer",
              fontFamily:S.sans,fontWeight:600,fontSize:11,
              border:`1px solid ${subTab===st.id?st.color+"66":"rgba(30,70,130,0.4)"}`,
              background:subTab===st.id?`${st.color}14`:"transparent",
              color:subTab===st.id?st.color:T.txt4 }}>{st.label}</button>
        ))}
      </div>

      {subTab==="resus"&&<>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:7 }}>
          <div>
            <div style={{ fontFamily:S.mono,fontSize:7,color:T.txt4,letterSpacing:1.3,textTransform:"uppercase",marginBottom:4 }}>Age (years) for Airway Sizing</div>
            <input type="number" value={ageYrs} onChange={e=>setAgeYrs(e.target.value)}
              style={{ width:"100%",padding:"7px 9px",background:"rgba(5,13,32,0.92)",
                border:`1px solid ${ageYrs?T.mint+"55":"rgba(30,70,130,0.4)"}`,
                borderRadius:7,outline:"none",fontFamily:S.mono,fontSize:18,fontWeight:700,color:T.mint }} />
          </div>
          {ay>0&&<Card color={T.mint} title="Airway Sizing" mb={0}>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:6 }}>
              {[["ETT (uncuffed)",ettUncuffed,"mm"],["ETT (cuffed)",ettCuffed,"mm"],
                ["ETT depth",ettDepth,"cm at lip"],["Blade",blade,""],
                ["LMA",lma,"(by weight)"],["Suction",ay<1?"6–8F":ay<5?"8–10F":"10–12F","Fr"]].map(([l,v,u])=>(
                <div key={l} style={{ padding:"5px 7px",borderRadius:6,background:"rgba(127,255,207,0.06)",border:"1px solid rgba(127,255,207,0.18)" }}>
                  <div style={{ fontFamily:S.mono,fontSize:7.5,color:T.txt4 }}>{l}</div>
                  <div style={{ fontFamily:S.mono,fontSize:14,fontWeight:700,color:T.mint }}>{v}</div>
                  <div style={{ fontFamily:S.mono,fontSize:7,color:T.txt4 }}>{u}</div>
                </div>
              ))}
            </div>
          </Card>}
        </div>
        {wt>0&&<Card color={T.cyan} title="IV Fluids — Maintenance + Bolus Reference">
          <div style={{ display:"flex",alignItems:"center",gap:14,marginBottom:9,
            padding:"8px 10px",borderRadius:8,background:"rgba(0,212,180,0.07)",border:"1px solid rgba(0,212,180,0.25)" }}>
            <div style={{ fontFamily:S.serif,fontSize:30,fontWeight:900,color:T.cyan,lineHeight:1 }}>
              {maint.toFixed(0)}<span style={{ fontSize:16 }}> mL/hr</span>
            </div>
            <div style={{ fontFamily:S.sans,fontSize:9,color:T.txt3,lineHeight:1.6 }}>
              <div style={{ fontWeight:600,color:T.cyan }}>Maintenance (Holliday-Segar 4-2-1)</div>
              <div>≤10 kg: 4 mL/kg/hr · 10–20 kg: 40+(2×over10) · {">"}20 kg: 60+(1×over20)</div>
              <div style={{ color:T.txt4 }}>Daily: {(maint*24).toFixed(0)} mL</div>
            </div>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(125px,1fr))",gap:6 }}>
            {[["NS Bolus 10 mL/kg",`${(wt*10).toFixed(0)} mL`,T.blue,"sepsis/dehydration"],
              ["NS Bolus 20 mL/kg",`${(wt*20).toFixed(0)} mL`,T.blue,"repeat if needed"],
              ["Max Resus 60 mL/kg",`${(wt*60).toFixed(0)} mL`,T.orange,"total then reassess"],
              ["pRBC 10 mL/kg",`${(wt*10).toFixed(0)} mL`,T.coral,"↑Hgb ~2–3 g/dL"],
              ["Albumin 5% 10 mL/kg",`${(wt*10).toFixed(0)} mL`,T.teal,"oncotic support"],
              ["DKA initial 10 mL/kg",`${(wt*10).toFixed(0)} mL NS`,T.gold,"only if unstable"],
            ].map(([l,v,c,sub])=>(
              <div key={l} style={{ padding:"6px 8px",borderRadius:7,background:`${c}08`,border:`1px solid ${c}25` }}>
                <div style={{ fontFamily:S.sans,fontSize:8,color:T.txt4,marginBottom:1 }}>{l}</div>
                <div style={{ fontFamily:S.mono,fontSize:13,fontWeight:700,color:c }}>{v}</div>
                <div style={{ fontFamily:S.mono,fontSize:7,color:T.txt4 }}>{sub}</div>
              </div>
            ))}
          </div>
        </Card>}
        {wt>0&&<Card color={T.coral} title="Defibrillation / Cardioversion — Joules (not mL)">
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(185px,1fr))",gap:7 }}>
            {[["Initial shock (VF/pVT)","2 J/kg",`${(wt*2).toFixed(0)} J`],["Second shock","4 J/kg",`${(wt*4).toFixed(0)} J`],
              ["Subsequent shocks","4–10 J/kg",`${(wt*4).toFixed(0)}–${Math.min(wt*10,200).toFixed(0)} J`],
              ["Cardioversion SVT","0.5–1 J/kg",`${(wt*.5).toFixed(0)}–${(wt*1).toFixed(0)} J`],
              ["Cardioversion VT pulsed","1–2 J/kg",`${(wt*1).toFixed(0)}–${(wt*2).toFixed(0)} J`]].map(([lbl,dose,calc])=>(
              <div key={lbl} style={{ padding:"8px 10px",borderRadius:8,background:"rgba(255,92,92,0.07)",border:"1px solid rgba(255,92,92,0.25)" }}>
                <div style={{ fontFamily:S.sans,fontSize:9,color:T.txt3,marginBottom:3 }}>{lbl}</div>
                <div style={{ fontFamily:S.mono,fontSize:14,fontWeight:700,color:T.coral }}>{calc}</div>
                <div style={{ fontFamily:S.mono,fontSize:8,color:T.txt4 }}>{dose}</div>
              </div>
            ))}
          </div>
        </Card>}
        {wt>0?<Card color={T.green} title="PALS Weight-Based Drugs — Dose + mL per Concentration">
          <DrugSection title="PALS / Resuscitation" color={T.green} drugs={resusDrugs} wtCalc />
        </Card>:nWt}
        {wt>0&&<Card color={T.mint} title="RSI Package — All Agents Co-Calculated">
          <div style={{ fontFamily:S.sans,fontSize:9.5,color:T.txt3,lineHeight:1.5,marginBottom:7 }}>
            Sequence: Pretreat (if &lt;1y) → Induction → Paralytic → Confirm tube → Post-intubation sedation/analgesia
          </div>
          <DrugSection title="RSI Sequence" color={T.mint} drugs={rsiPkg} wtCalc />
        </Card>}
        {wt>0&&<Card color={T.purple} title="Vasopressor Drips — Starting mL/hr per Concentration">
          <div style={{ fontFamily:S.sans,fontSize:9,color:T.txt3,lineHeight:1.5,marginBottom:7 }}>
            mL/hr values shown at <strong style={{ color:T.purple }}>starting dose</strong>. Titrate by clinical response. Central access preferred for all vasopressors.
          </div>
          <DrugSection title="Continuous Infusions" color={T.purple} drugs={vasopressors} wtCalc />
        </Card>}
        <Card color={T.orange} title="Seizure Escalation — Dose + mL per Concentration">
          {seizureSteps.map((step,si)=>(
            <div key={si} style={{ marginBottom:9,padding:"8px 10px",borderRadius:9,
              background:`${step.color}08`,border:`1px solid ${step.color}30`,borderLeft:`4px solid ${step.color}` }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6 }}>
                <div style={{ fontFamily:S.serif,fontWeight:700,fontSize:13,color:step.color }}>{step.label}</div>
                <span style={{ fontFamily:S.mono,fontSize:8,color:step.color,background:`${step.color}18`,
                  border:`1px solid ${step.color}35`,borderRadius:4,padding:"2px 8px" }}>{step.step}</span>
              </div>
              {step.drugs.length>0
                ? <DrugSection title="" color={step.color} drugs={step.drugs} wtCalc />
                : <div style={{ fontFamily:S.sans,fontSize:10,color:T.txt4 }}>Enter weight above to see calculated doses.</div>}
            </div>
          ))}
        </Card>
      </>}

      {subTab==="abx"&&<>
        <div style={{ display:"flex",gap:4,marginBottom:7 }}>
          {ABX_PILLS.map(p=>(
            <button key={p.id} onClick={()=>{ setAbxPill(p.id); setSelCond(null); }}
              style={{ flex:1,padding:"5px 7px",borderRadius:7,cursor:"pointer",
                fontFamily:S.sans,fontWeight:600,fontSize:10.5,
                border:`1px solid ${abxPill===p.id?T.coral+"66":"rgba(30,70,130,0.4)"}`,
                background:abxPill===p.id?"rgba(255,92,92,0.12)":"transparent",
                color:abxPill===p.id?T.coral:T.txt4 }}>{p.label}</button>
          ))}
        </div>

        {abxPill==="condition"&&<>
          <div style={{ display:"flex",gap:4,flexWrap:"wrap",marginBottom:7 }}>
            {AGE_FILTERS.map(af=>(
              <button key={String(af.id)} onClick={()=>{ setAgeFilter(af.id); setSelCond(null); }}
                style={{ padding:"5px 10px",borderRadius:7,cursor:"pointer",
                  fontFamily:S.sans,fontWeight:600,fontSize:10,
                  border:`1px solid ${ageFilter===af.id?T.blue+"66":"rgba(30,70,130,0.35)"}`,
                  background:ageFilter===af.id?"rgba(77,166,255,0.12)":"transparent",
                  color:ageFilter===af.id?T.blue:T.txt4 }}>{af.label}</button>
            ))}
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(148px,1fr))",gap:6,marginBottom:7 }}>
            {filteredConds.map(c=>(
              <button key={c.id} onClick={()=>setSelCond(selCond===c.id?null:c.id)}
                style={{ padding:"9px 10px",borderRadius:9,cursor:"pointer",textAlign:"left",
                  fontFamily:S.sans,fontWeight:600,fontSize:11,
                  border:`1px solid ${selCond===c.id?c.color+"77":c.color+"30"}`,
                  background:selCond===c.id?`${c.color}14`:`${c.color}06`,
                  color:selCond===c.id?c.color:T.txt3 }}>
                <span style={{ fontSize:14,marginRight:6 }}>{c.icon}</span>{c.label}
              </button>
            ))}
          </div>
          {cond&&<div style={{ padding:"9px 11px",borderRadius:9,marginBottom:7,
            background:`${cond.color}08`,border:`1px solid ${cond.color}40`,borderLeft:`4px solid ${cond.color}` }}>
            <div style={{ fontFamily:S.serif,fontWeight:700,fontSize:16,color:cond.color,marginBottom:7 }}>
              {cond.icon} {cond.label}
            </div>
            {cond.lines.map((line,i)=>{
              const mg=wt>0&&line.mpkDose?calcDose(wt,line.mpkDose,line.max):null;
              return(
                <div key={i} style={{ padding:"6px 0",
                  borderBottom:i<cond.lines.length-1?`1px solid ${cond.color}20`:"none" }}>
                  <div style={{ display:"flex",gap:10,alignItems:"flex-start" }}>
                    <div style={{ minWidth:110,flexShrink:0 }}>
                      <span style={{ fontFamily:S.mono,fontSize:7.5,color:cond.color,
                        background:`${cond.color}18`,border:`1px solid ${cond.color}35`,
                        borderRadius:4,padding:"2px 6px" }}>{line.tier}</span>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:S.sans,fontWeight:600,fontSize:9.5,color:T.txt2 }}>{line.drug}</div>
                      {line.dur&&<div style={{ fontFamily:S.mono,fontSize:8,color:T.txt4,marginTop:2 }}>Dur: {line.dur}</div>}
                    </div>
                    <div style={{ textAlign:"right",flexShrink:0,minWidth:100 }}>
                      {mg&&<div style={{ fontFamily:S.mono,fontSize:13,fontWeight:700,color:cond.color }}>{mg} mg</div>}
                      {mg&&<div style={{ fontFamily:S.mono,fontSize:8,color:T.txt4 }}>{line.freq}</div>}
                      {!mg&&<div style={{ fontFamily:S.mono,fontSize:9,color:T.txt3 }}>{line.freq}</div>}
                    </div>
                  </div>
                  {mg&&line.concs&&line.concs.length>0&&<div style={{ marginTop:5,paddingLeft:110 }}>
                    {line.concs.map(c=>c.m?(
                      <div key={c.l} style={{ display:"flex",justifyContent:"space-between",
                        padding:"2px 8px",borderRadius:4,marginBottom:2,
                        background:"rgba(127,255,207,0.05)",border:"1px solid rgba(127,255,207,0.15)" }}>
                        <span style={{ fontFamily:S.mono,fontSize:7.5,color:T.txt4 }}>{c.l}</span>
                        <span style={{ fontFamily:S.mono,fontSize:11,fontWeight:700,color:T.mint }}>{(mg/c.m).toFixed(1)} mL</span>
                      </div>
                    ):null)}
                  </div>}
                </div>
              );
            })}
            <div style={{ marginTop:9,padding:"6px 9px",borderRadius:7,background:`${cond.color}08`,border:`1px solid ${cond.color}22` }}>
              <span style={{ fontFamily:S.mono,fontSize:7.5,color:cond.color }}>RETURN PRECAUTIONS  </span>
              <span style={{ fontFamily:S.sans,fontSize:9.5,color:T.txt3,lineHeight:1.6 }}>{cond.note}</span>
            </div>
          </div>}
        </>}

        {abxPill==="iv"&&(wt>0?<>
          <Card color={T.red} title="Neonatal ABX — Gestational Age / Postnatal Age Adjustment">
            <div style={{ fontFamily:S.sans,fontSize:9,color:T.txt3,lineHeight:1.5,marginBottom:7 }}>
              Gentamicin and ampicillin dosing varies by GA and postnatal age. Select below:
            </div>
            <div style={{ display:"flex",gap:4,flexWrap:"wrap",marginBottom:8 }}>
              {[["preterm28","<28 wk GA"],["preterm34","28–34 wk GA"],["term","≥35 wk / Term"],["pna7",">7d Postnatal"]].map(([v,l])=>(
                <button key={v} onClick={()=>setGaAge(v)}
                  style={{ padding:"5px 11px",borderRadius:7,cursor:"pointer",fontFamily:S.sans,fontWeight:600,fontSize:10,
                    border:`1px solid ${gaAge===v?T.red+"66":"rgba(30,70,130,0.4)"}`,
                    background:gaAge===v?"rgba(255,68,68,0.12)":"transparent",color:gaAge===v?T.red:T.txt4 }}>{l}</button>
              ))}
            </div>
            <DrugSection title="Neonatal Sepsis / HSV" color={T.red} drugs={neonAbx} wtCalc />
            <div style={{ marginTop:7,padding:"5px 8px",borderRadius:6,background:"rgba(255,68,68,0.06)",border:"1px solid rgba(255,68,68,0.2)" }}>
              <div style={{ fontFamily:S.mono,fontSize:8,color:T.red,letterSpacing:1,marginBottom:4 }}>GENTAMICIN DOSING BY GA / PNA (Nelson's 2024)</div>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))",gap:5 }}>
                {[["<28 wk GA",`5 mg/kg q48h → ${ml(wt*5/10)} mL (10 mg/mL)`,T.orange],
                  ["28–34 wk GA",`4.5 mg/kg q36h → ${ml(wt*4.5/10)} mL (10 mg/mL)`,T.gold],
                  ["≥35 wk / Term",`4 mg/kg q24h → ${ml(wt*4/10)} mL (10 mg/mL)`,T.teal],
                  [">7d postnatal",`4 mg/kg q12–24h (per GA)`,T.blue],
                ].map(([tier,dose,c])=>(
                  <div key={tier} style={{ padding:"5px 8px",borderRadius:6,
                    background:gaAge===tier.replace("≥35 wk / Term","term").replace(">7d postnatal","pna7").replace("<28 wk GA","preterm28").replace("28–34 wk GA","preterm34")?`${c}15`:`${c}07`,
                    border:`1px solid ${c}30` }}>
                    <div style={{ fontFamily:S.mono,fontSize:7.5,color:c,marginBottom:2 }}>{tier}</div>
                    <div style={{ fontFamily:S.sans,fontSize:9,color:T.txt2 }}>{dose}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontFamily:S.sans,fontSize:8.5,color:T.txt4,marginTop:6 }}>
                Always get trough levels. Target trough &lt;1 mcg/mL. Renal function monitoring required.
              </div>
            </div>
          </Card>
          <Card color={T.coral} title="Broad-Spectrum / Gram-Negative">
            <DrugSection title="Beta-Lactams & Carbapenems" color={T.coral} drugs={broadAbx} wtCalc />
          </Card>
          <Card color={T.orange} title="Anti-MRSA / Resistant">
            <DrugSection title="MRSA Coverage" color={T.orange} drugs={mrsaAbx} wtCalc />
          </Card>
        </>:nWt)}

        {abxPill==="po"&&<Card color={T.coral} title="Oral Discharge Antibiotics — All concentrations shown automatically">
          {DISCHARGE_ABX.map((d,i)=>{
            const pd=wt>0?calcDose(wt,d.mpkDose,d.max):null;
            return(
              <div key={i} style={{ padding:"6px 0",borderBottom:i<DISCHARGE_ABX.length-1?"1px solid rgba(30,70,130,0.22)":"none" }}>
                <div style={{ display:"flex",alignItems:"flex-start",gap:10 }}>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontFamily:S.sans,fontWeight:700,fontSize:9.5,color:T.txt2 }}>{d.name}</div>
                    <div style={{ fontFamily:S.mono,fontSize:8,color:T.txt4,marginTop:1 }}>{d.dose}</div>
                    {d.dur&&<div style={{ display:"inline-flex",alignItems:"center",gap:5,marginTop:3,
                      padding:"2px 7px",borderRadius:4,background:"rgba(245,200,66,0.1)",border:"1px solid rgba(245,200,66,0.3)" }}>
                      <span style={{ fontFamily:S.mono,fontSize:7,color:T.gold,letterSpacing:1 }}>DURATION</span>
                      <span style={{ fontFamily:S.mono,fontSize:8.5,fontWeight:700,color:T.gold }}>{d.dur}</span>
                    </div>}
                    <div style={{ fontFamily:S.sans,fontSize:9,color:T.txt4,marginTop:3,lineHeight:1.5 }}>{d.note}</div>
                  </div>
                  <div style={{ textAlign:"right",flexShrink:0,minWidth:80 }}>
                    {pd&&<div style={{ fontFamily:S.mono,fontSize:12,fontWeight:700,color:T.coral }}>{pd} mg</div>}
                    {pd&&<div style={{ fontFamily:S.mono,fontSize:8,color:T.txt4 }}>{d.freq}</div>}
                  </div>
                </div>
                {pd&&d.concs&&d.concs.length>0&&<div style={{ marginTop:5 }}>
                  {d.concs.map(c=>(
                    <div key={c.l} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",
                      padding:"3px 8px",borderRadius:5,marginBottom:2,
                      background:c.m?"rgba(127,255,207,0.05)":"rgba(77,166,255,0.05)",
                      border:`1px solid ${c.m?"rgba(127,255,207,0.18)":"rgba(77,166,255,0.15)"}` }}>
                      <span style={{ fontFamily:S.mono,fontSize:8,color:T.txt4 }}>{c.l}</span>
                      {c.m
                        ? <span style={{ fontFamily:S.mono,fontSize:12,fontWeight:700,color:T.mint }}>{(pd/c.m).toFixed(1)} mL</span>
                        : <span style={{ fontFamily:S.mono,fontSize:9,color:T.txt3 }}>solid dosage form</span>}
                    </div>
                  ))}
                </div>}
              </div>
            );
          })}
        </Card>}
      </>}

      {subTab==="analg"&&(wt>0?<>
        <Card color={T.purple} title="Opioid Analgesia — Dose + mL per Concentration">
          <DrugSection title="IV / IM / Intranasal Opioids" color={T.purple} drugs={opioids} wtCalc />
        </Card>
        <Card color={T.mint} title="Non-Opioid Analgesia">
          <DrugSection title="NSAIDs & Acetaminophen" color={T.mint} drugs={nonOpioids} wtCalc />
        </Card>
        <Card color={T.gold} title="Procedural Sedation">
          <DrugSection title="PSA Agents" color={T.gold} drugs={sedation} wtCalc />
        </Card>
        <Card color={T.coral} title="Anaphylaxis">
          <DrugSection title="First-Line" color={T.coral} drugs={anaphylaxis} wtCalc />
        </Card>
        <Card color={T.cyan} title="Antiemetics">
          <DrugSection title="Nausea / Vomiting" color={T.cyan} drugs={antiemetics} wtCalc />
        </Card>
        <Card color={T.teal} title="Antivirals">
          <DrugSection title="Influenza" color={T.teal} drugs={antiviral} wtCalc />
        </Card>
        <Card color={T.blue} title="Blood Products">
          <DrugSection title="Transfusion Dosing" color={T.blue} drugs={bloodProd} wtCalc />
        </Card>
      </>:nWt)}

      {subTab==="resp"&&(wt>0?<>
        <Card color={T.blue} title="Corticosteroids — Dose + mL per Concentration">
          <DrugSection title="IV / PO Steroids" color={T.blue} drugs={steroids} wtCalc />
        </Card>
        <Card color={T.cyan} title="Bronchodilators & Respiratory">
          <DrugSection title="Asthma / Croup / Airway" color={T.cyan} drugs={resp} wtCalc />
        </Card>
      </>:nWt)}
    </div>
  );
}

// SCORING
const WESTLEY=[
  { key:"stridor",   label:"Stridor",       opts:[{v:0,l:"None"},{v:1,l:"With agitation"},{v:2,l:"At rest"}] },
  { key:"retract",   label:"Retractions",   opts:[{v:0,l:"None"},{v:1,l:"Mild"},{v:2,l:"Moderate"},{v:3,l:"Severe"}] },
  { key:"air",       label:"Air Entry",     opts:[{v:0,l:"Normal"},{v:1,l:"Decreased"},{v:2,l:"Markedly decreased"}] },
  { key:"cyanosis",  label:"Cyanosis",      opts:[{v:0,l:"None"},{v:4,l:"With agitation"},{v:5,l:"At rest"}] },
  { key:"conscious", label:"Consciousness", opts:[{v:0,l:"Normal"},{v:5,l:"Altered"}] },
];
const PRAM=[
  { key:"scalene",label:"Scalene Muscle Use",       opts:[{v:0,l:"Absent"},{v:2,l:"Present"}] },
  { key:"supra",  label:"Suprasternal Retractions", opts:[{v:0,l:"Absent"},{v:2,l:"Present"}] },
  { key:"wheeze", label:"Wheeze",                   opts:[{v:0,l:"Absent"},{v:1,l:"Expiratory only"},{v:2,l:"Inspiratory + expiratory"},{v:3,l:"Audible / no air entry"}] },
  { key:"air",    label:"Air Entry",                opts:[{v:0,l:"Normal"},{v:1,l:"Decreased at bases"},{v:2,l:"Widespread decrease"},{v:3,l:"Minimal / absent"}] },
  { key:"o2",     label:"O₂ Saturation",            opts:[{v:0,l:"≥ 95% on RA"},{v:1,l:"92–94% on RA"},{v:2,l:"< 92% on RA"}] },
];
const FLACC=[
  { key:"face",    label:"Face",          opts:[{v:0,l:"No expression"},{v:1,l:"Occasional grimace"},{v:2,l:"Frequent grimace / jaw clench"}] },
  { key:"legs",    label:"Legs",          opts:[{v:0,l:"Normal / relaxed"},{v:1,l:"Uneasy / tense"},{v:2,l:"Kicking / drawn up"}] },
  { key:"activ",   label:"Activity",      opts:[{v:0,l:"Lying quietly"},{v:1,l:"Squirming / tense"},{v:2,l:"Arched / rigid / jerking"}] },
  { key:"cry",     label:"Cry",           opts:[{v:0,l:"No cry"},{v:1,l:"Moans / whimpers"},{v:2,l:"Crying steadily"}] },
  { key:"console", label:"Consolability", opts:[{v:0,l:"Content / relaxed"},{v:1,l:"Reassured by touch"},{v:2,l:"Difficult to console"}] },
];
const CDS=[
  { key:"general",label:"General Appearance",opts:[{v:0,l:"Normal"},{v:1,l:"Thirsty / restless"},{v:2,l:"Drowsy / limp"}] },
  { key:"eyes",   label:"Eyes",              opts:[{v:0,l:"Normal"},{v:1,l:"Slightly sunken"},{v:2,l:"Very sunken / no tears"}] },
  { key:"mucosa", label:"Mucous Membranes",  opts:[{v:0,l:"Moist"},{v:1,l:"Sticky"},{v:2,l:"Dry"}] },
  { key:"tears",  label:"Tears",             opts:[{v:0,l:"Present with crying"},{v:1,l:"Decreased"},{v:2,l:"Absent"}] },
];
function ScoringTab({ globalWt }) {
  const wtS=parseFloat(globalWt)||0;
  const [ws,setWs]=useState({}); const [pram,setPram]=useState({});
  const [flacc,setFlacc]=useState({}); const [cds,setCds]=useState({});
  const score=obj=>Object.values(obj).reduce((s,v)=>s+(v||0),0);
  const wsT=score(ws); const pramT=score(pram); const flaccT=score(flacc); const cdsT=score(cds);
  const wsSet=Object.keys(ws).length>0; const pramSet=Object.keys(pram).length>0;
  const flaccSet=Object.keys(flacc).length>0; const cdsSet=Object.keys(cds).length>0;
  const wsStr=wsT<=2?{l:"Mild Croup",c:T.teal,tx:"Dexamethasone 0.6 mg/kg PO × 1 (max 10 mg). Discharge with return precautions."}
    :wsT<=5?{l:"Moderate Croup",c:T.gold,tx:"Dexamethasone 0.6 mg/kg PO/IM/IV. Racemic epi 0.5 mL 2.25% neb. Observe 2–4h post-epi."}
    :{l:"Severe Croup",c:T.coral,tx:"Racemic epi NOW + dexamethasone. Heliox 70:30 if available. ICU. Prepare intubation (smaller ETT)."};
  const pramStr=pramT<=4?{l:"Mild Asthma",c:T.teal,tx:"Albuterol 2–4 puffs MDI q20 min × 3 or 0.15 mg/kg neb. Discharge if SpO2 ≥95%."}
    :pramT<=8?{l:"Moderate Asthma",c:T.gold,tx:"Albuterol neb q20 min × 3 + ipratropium × 3. Dexamethasone 0.6 mg/kg PO. Observe ≥4h."}
    :{l:"Severe Asthma",c:T.coral,tx:"Continuous albuterol + ipratropium. Magnesium 25–75 mg/kg IV. Methylprednisolone IV. Consider ICU."};
  const flaccStr=flaccT<=3?{l:"Mild Pain (0–3)",c:T.teal,tx:"Non-pharmacologic comfort measures. Reassess after intervention."}
    :flaccT<=6?{l:"Moderate Pain (4–6)",c:T.gold,tx:"Ibuprofen/acetaminophen ± opioid. Reassess 30 min after analgesia."}
    :{l:"Severe Pain (7–10)",c:T.coral,tx:"IV/IN opioid. Consider ketamine for procedural pain. Reassess 15–30 min."};
  const cdsStr=cdsT===0?{l:"No Clinically Detectable Dehydration",c:T.teal,tx:"Encourage PO fluids. Discharge with education on signs of dehydration."}
    :cdsT<=4?{l:"Some Dehydration (~3–6% deficit)",c:T.gold,tx:"ORS 50 mL/kg PO over 4h. Ondansetron if vomiting. IV if ORT fails."}
    :{l:"Severe Dehydration (> 6% deficit)",c:T.coral,tx:"IV resuscitation: 20 mL/kg NS bolus. Reassess. Replace deficit + maintenance."};
  return (
    <div className="peds-in">
      <Card color={T.teal} title="Westley Croup Score">
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:7 }}>
          <div style={{ fontFamily:S.sans,fontSize:9,color:T.txt4 }}>0–17 · ≤2 mild · 3–5 moderate · ≥6 severe</div>
          <div style={{ fontFamily:S.serif,fontSize:32,fontWeight:900,color:wsSet?wsStr.c:T.txt4,lineHeight:1 }}>{wsT}</div>
        </div>
        <ScoreWidget items={WESTLEY} scores={ws} setScores={setWs} color={T.teal} />
        {wsSet&&<div style={{ padding:"7px 10px",borderRadius:8,background:`${wsStr.c}09`,border:`1px solid ${wsStr.c}35` }}>
          <div style={{ fontFamily:S.serif,fontWeight:700,fontSize:13,color:wsStr.c,marginBottom:3 }}>{wsStr.l} (Score {wsT})</div>
          <div style={{ fontFamily:S.sans,fontSize:11,color:T.txt2,lineHeight:1.6 }}>{wsStr.tx}</div>
        </div>}
      </Card>
      <Card color={T.blue} title="PRAM Asthma Score">
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:7 }}>
          <div style={{ fontFamily:S.sans,fontSize:9,color:T.txt4 }}>0–12 · ≤4 mild · 5–8 moderate · 9–12 severe</div>
          <div style={{ fontFamily:S.serif,fontSize:32,fontWeight:900,color:pramSet?pramStr.c:T.txt4,lineHeight:1 }}>{pramT}</div>
        </div>
        <ScoreWidget items={PRAM} scores={pram} setScores={setPram} color={T.blue} />
        {pramSet&&<div style={{ padding:"7px 10px",borderRadius:8,background:`${pramStr.c}09`,border:`1px solid ${pramStr.c}35` }}>
          <div style={{ fontFamily:S.serif,fontWeight:700,fontSize:13,color:pramStr.c,marginBottom:3 }}>{pramStr.l} (Score {pramT})</div>
          <div style={{ fontFamily:S.sans,fontSize:11,color:T.txt2,lineHeight:1.6 }}>{pramStr.tx}</div>
        </div>}
      </Card>
      <Card color={T.purple} title="FLACC Pain Scale (< 3 years / non-verbal)">
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:7 }}>
          <div style={{ fontFamily:S.sans,fontSize:9,color:T.txt4 }}>0–10 · 0 no pain · 1–3 mild · 4–6 moderate · 7–10 severe</div>
          <div style={{ fontFamily:S.serif,fontSize:32,fontWeight:900,color:flaccSet?flaccStr.c:T.txt4,lineHeight:1 }}>{flaccT}</div>
        </div>
        <ScoreWidget items={FLACC} scores={flacc} setScores={setFlacc} color={T.purple} />
        {flaccSet&&<div style={{ padding:"7px 10px",borderRadius:8,background:`${flaccStr.c}09`,border:`1px solid ${flaccStr.c}35` }}>
          <div style={{ fontFamily:S.serif,fontWeight:700,fontSize:13,color:flaccStr.c,marginBottom:3 }}>{flaccStr.l}</div>
          <div style={{ fontFamily:S.sans,fontSize:11,color:T.txt2,lineHeight:1.6 }}>{flaccStr.tx}</div>
        </div>}
      </Card>
      <Card color={T.gold} title="Clinical Dehydration Scale (CDS — Goldman 2008)">
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:7 }}>
          <div style={{ fontFamily:S.sans,fontSize:9,color:T.txt4 }}>0–8 · 0 none · 1–4 some (~3–6%) · 5–8 severe</div>
          <div style={{ fontFamily:S.serif,fontSize:32,fontWeight:900,color:cdsSet?cdsStr.c:T.txt4,lineHeight:1 }}>{cdsT}</div>
        </div>
        <ScoreWidget items={CDS} scores={cds} setScores={setCds} color={T.gold} />
        {cdsSet&&<div style={{ padding:"7px 10px",borderRadius:8,background:`${cdsStr.c}09`,border:`1px solid ${cdsStr.c}35` }}>
          <div style={{ fontFamily:S.serif,fontWeight:700,fontSize:13,color:cdsStr.c,marginBottom:3 }}>{cdsStr.l}</div>
          <div style={{ fontFamily:S.sans,fontSize:11,color:T.txt2,lineHeight:1.6 }}>{cdsStr.tx}</div>
        </div>}
      </Card>
      <Card color={T.coral} title="APGAR Score Reference">
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%",borderCollapse:"collapse",fontFamily:S.mono,fontSize:9 }}>
            <thead><tr style={{ borderBottom:"1px solid rgba(255,92,92,0.3)" }}>
              {["Sign","0","1","2"].map(h=><th key={h} style={{ padding:"5px 8px",textAlign:"left",color:T.coral,fontWeight:700 }}>{h}</th>)}
            </tr></thead>
            <tbody>{[["Appearance","Blue/pale all over","Blue extremities only","Pink all over"],
              ["Pulse","Absent","< 100 bpm","≥ 100 bpm"],["Grimace","No response","Grimace","Cry / cough"],
              ["Activity","Limp","Some flexion","Active motion"],["Respiration","Absent","Weak/irregular","Strong cry"]
            ].map((r,i)=>(
              <tr key={i} style={{ borderBottom:"1px solid rgba(30,70,130,0.2)" }}>
                <td style={{ padding:"5px 8px",color:T.coral,fontWeight:700 }}>{r[0]}</td>
                <td style={{ padding:"5px 8px",color:T.txt3 }}>{r[1]}</td>
                <td style={{ padding:"5px 8px",color:T.txt2 }}>{r[2]}</td>
                <td style={{ padding:"5px 8px",color:T.mint }}>{r[3]}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={{ marginTop:8,fontFamily:S.sans,fontSize:9.5,color:T.txt3 }}>
          Score at 1 min and 5 min. 7–10 = normal · 4–6 = moderate depression · 0–3 = severe resuscitation
        </div>
      </Card>
      <Card color={T.gold} title="Febrile Seizure — AAP 2011 / 2022">
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:7 }}>
          {[{l:"Simple Febrile Seizure",c:T.teal,items:["Generalized (tonic-clonic)","Duration < 15 minutes","Single seizure in 24h","Age 6 months – 5 years","Full recovery to baseline"]},
            {l:"Complex Febrile Seizure",c:T.coral,items:["Focal onset or focal features","Duration ≥ 15 minutes","Recurs within 24h","Any age outside 6m–5y","Prolonged postictal state"]}].map(s=>(
            <div key={s.l} style={{ padding:"9px 10px",borderRadius:8,background:`${s.c}08`,border:`1px solid ${s.c}28` }}>
              <div style={{ fontFamily:S.mono,fontSize:8,fontWeight:700,color:s.c,letterSpacing:1,marginBottom:6 }}>{s.l}</div>
              {s.items.map((item,i)=>(<div key={i} style={{ display:"flex",gap:5,marginBottom:3 }}><span style={{ color:s.c,fontSize:7,marginTop:3 }}>▸</span><span style={{ fontFamily:S.sans,fontSize:9.5,color:T.txt2 }}>{item}</span></div>))}
            </div>
          ))}
        </div>
        <Bullet text="LP NOT required for simple febrile seizure in vaccinated child ≥ 6 months (AAP 2011)" color={T.teal} />
        <Bullet text="LP: strongly consider if < 12 months, unvaccinated, or ill-appearing after seizure" color={T.teal} />
        <Bullet text="Antipyretics do NOT prevent recurrence. Recurrence rate 30–35%. No prophylactic anticonvulsants." color={T.gold} />
        <Bullet text="Return: seizure > 5 min, focal features, not returning to baseline within 1–2h, recurrence" color={T.gold} />
      </Card>
      <Card color={T.orange} title="Pediatric Appendicitis Score (PAS)">
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(185px,1fr))",gap:6 }}>
          {[["Nausea / vomiting",1],["Anorexia",1],["Fever > 38°C",1],["Cough/hop/percussion RLQ tenderness",2],
            ["RLQ tenderness",2],["Migration of pain to RLQ",1],["Leukocytosis > 10,000",1],["Leukocyte left shift (PMN > 75%)",1]].map(([l,p],i)=>(
            <div key={i} style={{ padding:"7px 9px",borderRadius:7,background:"rgba(255,159,67,0.07)",border:"1px solid rgba(255,159,67,0.22)",display:"flex",justifyContent:"space-between" }}>
              <span style={{ fontFamily:S.sans,fontSize:9.5,color:T.txt2 }}>{l}</span>
              <span style={{ fontFamily:S.mono,fontSize:11,fontWeight:700,color:T.orange }}>+{p}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop:8,padding:"7px 10px",borderRadius:7,background:"rgba(5,13,32,0.65)",border:"1px solid rgba(30,70,130,0.35)",fontFamily:S.sans,fontSize:10.5,color:T.txt3 }}>
          <strong style={{ color:T.teal }}>≤ 3:</strong> Low risk{" · "}<strong style={{ color:T.gold }}>4–6:</strong> US first{" · "}<strong style={{ color:T.coral }}>≥ 7:</strong> Surgical consult
        </div>
      </Card>
      <Card color={T.blue} title="Bronchiolitis Severity — AAP 2014">
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7,marginBottom:7 }}>
          {[{l:"Mild",c:T.teal,items:["SpO2 ≥ 95% on RA","Minimal retractions","Good air entry","Alert, tolerating feeds"]},
            {l:"Moderate",c:T.gold,items:["SpO2 90–94% on RA","Moderate retractions","Decreased air entry","Mildly reduced PO"]},
            {l:"Severe",c:T.coral,items:["SpO2 < 90% on RA","Severe retractions","Nasal flaring / grunting","Not tolerating PO"]}].map(s=>(
            <div key={s.l} style={{ padding:"8px 10px",borderRadius:8,background:`${s.c}08`,border:`1px solid ${s.c}28` }}>
              <div style={{ fontFamily:S.mono,fontSize:9,fontWeight:700,color:s.c,marginBottom:5 }}>{s.l}</div>
              {s.items.map((item,i)=>(<div key={i} style={{ display:"flex",gap:5,marginBottom:3 }}><span style={{ color:s.c,fontSize:7,marginTop:3 }}>▸</span><span style={{ fontFamily:S.sans,fontSize:9,color:T.txt3 }}>{item}</span></div>))}
            </div>
          ))}
        </div>
        <Bullet text="High-flow NC O₂, NG feeds — supportive care only. Albuterol, epi, steroids, antibiotics NOT recommended routinely." color={T.blue} />
        <div style={{ marginTop:8,padding:"8px 10px",borderRadius:8,background:"rgba(0,200,212,0.07)",border:"1px solid rgba(0,200,212,0.3)" }}>
          <div style={{ fontFamily:S.mono,fontSize:8,color:T.cyan,letterSpacing:1.3,textTransform:"uppercase",marginBottom:7 }}>
            High-Flow Nasal Cannula (HFNC) — Weight-Based Starting Flows
          </div>
          {wtS>0
            ? <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:6,marginBottom:7 }}>
                {[["Starting flow","1 L/kg/min",`${Math.min(wtS*1,50).toFixed(0)} L/min`,T.teal],
                  ["Moderate support","1.5 L/kg/min",`${Math.min(wtS*1.5,50).toFixed(0)} L/min`,T.gold],
                  ["High support","2 L/kg/min",`${Math.min(wtS*2,50).toFixed(0)} L/min`,T.coral],
                  ["Max flow","50 L/min cap",`${Math.min(wtS*2,50).toFixed(0)} L/min max`,T.orange],
                ].map(([l,dose,calc,c])=>(
                  <div key={l} style={{ padding:"6px 8px",borderRadius:7,background:`${c}09`,border:`1px solid ${c}28` }}>
                    <div style={{ fontFamily:S.sans,fontSize:8,color:T.txt4 }}>{l}</div>
                    <div style={{ fontFamily:S.mono,fontSize:14,fontWeight:700,color:c }}>{calc}</div>
                    <div style={{ fontFamily:S.mono,fontSize:7.5,color:T.txt4 }}>{dose}</div>
                  </div>
                ))}
              </div>
            : <div style={{ fontFamily:S.sans,fontSize:10,color:T.txt4,marginBottom:7 }}>
                Enter weight in Medications tab → it carries here for HFNC calculations.
                <span style={{ display:"block",fontFamily:S.mono,fontSize:9,marginTop:3,color:T.cyan }}>
                  Starting flow: 1 L/kg/min · High support: 2 L/kg/min · Max: 50 L/min
                </span>
              </div>}
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:6 }}>
            {[["FiO₂ titration","Start 40%. Increase by 5–10% to maintain SpO2 92–95%.","Avoid hyperoxia — target SpO2 92–96% not >98%."],
              ["Weaning","Wean flow first (by 0.5 L/kg/min q4–6h if tolerating). Then wean FiO₂.","Trial low-flow NC before full step-down."]].map(([l,d1,d2])=>(
              <div key={l} style={{ padding:"6px 8px",borderRadius:6,background:"rgba(5,13,32,0.65)",border:"1px solid rgba(30,70,130,0.3)" }}>
                <div style={{ fontFamily:S.mono,fontSize:7.5,color:T.cyan,marginBottom:3 }}>{l}</div>
                <div style={{ fontFamily:S.sans,fontSize:8.5,color:T.txt2,lineHeight:1.5 }}>{d1}</div>
                <div style={{ fontFamily:S.sans,fontSize:8,color:T.txt4,marginTop:2 }}>{d2}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop:6,fontFamily:S.sans,fontSize:8.5,color:T.txt4,lineHeight:1.5 }}>
            Vapotherm/Optiflow. Failure criteria: worsening RR, SpO2 &lt;92% on FiO₂ ≥60%, apnea, rising CO₂ → escalate to CPAP/intubation.
          </div>
        </div>
      </Card>
    </div>
  );
}

// CLINICAL TOOLS
const TOOLS_TABS=[{id:"fluids",label:"DKA / Burns",color:T.gold},{id:"tox",label:"Toxicology",color:T.coral},{id:"sepsis",label:"Sepsis",color:T.orange},{id:"proc",label:"Procedures",color:T.purple}];
const SIRS_AGES=[
  {age:"< 1 week",    hr:">180 or <100",rr:">50",wbc:">34,000",   temp:"38.0–38.4 or <36"},
  {age:"1 wk – 1 mo",hr:">180 or <100",rr:">40",wbc:">19,500 or <5,000",temp:"≥38.5 or <36"},
  {age:"1 mo – 1 yr",hr:">180 or <90", rr:">34",wbc:">17,500 or <5,000",temp:"≥38.5 or <36"},
  {age:"2–5 years",  hr:">140",        rr:">22",wbc:">15,500 or <6,000",temp:"≥38.5 or <36"},
  {age:"6–12 years", hr:">130",        rr:">18",wbc:">13,500 or <4,500",temp:"≥38.5 or <36"},
  {age:"13–18 years",hr:">110",        rr:">14",wbc:">11,000 or <4,500",temp:"≥38.5 or <36"},
];
const ANTIDOTES=[
  {toxin:"Opioids",         antidote:"Naloxone",       dose:"0.01 mg/kg IV/IM/IN (max 2 mg); repeat q2–3 min"},
  {toxin:"Benzodiazepines", antidote:"Flumazenil",     dose:"0.01 mg/kg IV (max 0.2 mg); caution — may precipitate seizures"},
  {toxin:"Organophosphates",antidote:"Atropine",       dose:"0.02–0.05 mg/kg IV q5–10 min until secretions dry; no maximum"},
  {toxin:"Acetaminophen",   antidote:"NAC",            dose:"150 mg/kg IV ×1h → 50 mg/kg ×4h → 100 mg/kg ×16h"},
  {toxin:"Iron",            antidote:"Deferoxamine",   dose:"15 mg/kg/hr IV (max 6 g/day); stop when urine clears"},
  {toxin:"Isoniazid (INH)", antidote:"Pyridoxine",     dose:"1 mg per mg INH ingested (max 5 g); 70 mg/kg if dose unknown"},
  {toxin:"Methemoglobin",   antidote:"Methylene blue", dose:"1–2 mg/kg IV over 5 min; may repeat once"},
  {toxin:"Methanol / EG",   antidote:"Fomepizole",    dose:"15 mg/kg IV load; call Poison Control for maintenance"},
  {toxin:"CCB / hyperK",    antidote:"Calcium chloride",dose:"20 mg/kg IV (max 2 g); central line preferred"},
  {toxin:"Digoxin",         antidote:"Digoxin Fab",    dose:"Empiric: 10 vials IV. Specific: vials = (serum dig × kg) / 100"},
];
function ToolsTab({ globalWt }) {
  const [toolTab,setToolTab]=useState("fluids");
  const [dkaPct,setDkaPct]=useState(""); const [tbsaPct,setTbsaPct]=useState("");
  const wt=parseFloat(globalWt)||0;
  const dkaN=parseFloat(dkaPct)||0; const tbsaN=parseFloat(tbsaPct)||0;
  const deficitMl=wt>0&&dkaN>0?(wt*dkaN*10).toFixed(0):null;
  const maint48=wt>0?(wt<=10?wt*4*48:wt<=20?(40+(wt-10)*2)*48:(60+(wt-20))*48).toFixed(0):null;
  const totalDka=deficitMl&&maint48?(parseInt(deficitMl)+parseInt(maint48)).toFixed(0):null;
  const dkaRate=totalDka?(parseInt(totalDka)/48).toFixed(0):null;
  const parkland=wt>0&&tbsaN>0?(4*wt*tbsaN).toFixed(0):null;
  const park8h=parkland?(parseInt(parkland)/2).toFixed(0):null;
  return (
    <div className="peds-in">
      <div style={{ display:"flex",gap:4,flexWrap:"wrap",padding:"4px",marginBottom:9,
        background:"rgba(5,13,32,0.75)",border:"1px solid rgba(30,70,130,0.35)",borderRadius:10 }}>
        {TOOLS_TABS.map(t=>(
          <button key={t.id} onClick={()=>setToolTab(t.id)}
            style={{ flex:1,padding:"5px 8px",borderRadius:7,cursor:"pointer",fontFamily:S.sans,fontWeight:600,fontSize:11,
              border:`1px solid ${toolTab===t.id?t.color+"66":"rgba(30,70,130,0.4)"}`,
              background:toolTab===t.id?`${t.color}14`:"transparent",color:toolTab===t.id?t.color:T.txt4 }}>{t.label}</button>
        ))}
      </div>
      {toolTab==="fluids"&&<>
        <Card color={T.gold} title="Pediatric DKA Management">
          <div style={{ fontFamily:S.sans,fontSize:9.5,color:T.txt3,lineHeight:1.6,marginBottom:7 }}>DKA: glucose {">"} 200 + pH {"<"} 7.30 + HCO3 {"<"} 15 + ketonuria/ketonemia</div>
          {wt>0&&<div style={{ marginBottom:7 }}>
            <div style={{ fontFamily:S.mono,fontSize:8,color:T.txt4,letterSpacing:1.3,textTransform:"uppercase",marginBottom:4 }}>Estimated Dehydration (% body weight)</div>
            <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
              {[["5%","5"],["7%","7"],["10%","10"]].map(([l,v])=>(
                <button key={v} onClick={()=>setDkaPct(dkaPct===v?"":v)}
                  style={{ padding:"8px 14px",borderRadius:7,cursor:"pointer",fontFamily:S.sans,fontWeight:600,fontSize:11,
                    border:`1px solid ${dkaPct===v?T.gold+"66":"rgba(30,70,130,0.4)"}`,
                    background:dkaPct===v?`${T.gold}14`:"transparent",color:dkaPct===v?T.gold:T.txt4 }}>
                  {l} {dkaPct===v&&wt>0?`(${(wt*parseFloat(v)*10).toFixed(0)} mL)`:""}</button>
              ))}
            </div>
            {deficitMl&&<div style={{ marginTop:10,padding:"10px 12px",borderRadius:9,background:"rgba(245,200,66,0.08)",border:"1px solid rgba(245,200,66,0.3)" }}>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:8 }}>
                {[["Fluid Deficit",`${deficitMl} mL`],["48h Maintenance",`${maint48} mL`],["Total IV Fluids",`${totalDka} mL`],["Starting Rate",`${dkaRate} mL/hr`]].map(([l,v])=>(
                  <div key={l} style={{ textAlign:"center" }}>
                    <div style={{ fontFamily:S.mono,fontSize:8,color:T.txt4 }}>{l}</div>
                    <div style={{ fontFamily:S.serif,fontSize:17,fontWeight:700,color:T.gold }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>}
          </div>}
          {[["Critical DKA Principles",T.coral,["NO fluid bolus in moderate/severe DKA unless hemodynamically unstable (cerebral edema risk)","Use 0.9% NS or LR. Add dextrose when glucose < 250–300 mg/dL (2-bag system).","Insulin drip: 0.05–0.1 units/kg/hr IV — NO loading bolus. Start after first hour of fluids.","K+ > 5.5: hold · 3.5–5.5: add 40 mEq/L · < 3.5: stop insulin, give 60–80 mEq/L"]],
            ["Cerebral Edema — Act Immediately",T.orange,["Signs: headache, bradycardia, hypertension, declining GCS, pupil changes","3% NaCl 3–5 mL/kg IV over 30 min OR mannitol 0.5–1 g/kg IV — give immediately","HOB 30°, restrict IVF, neurosurgery consult, ICU transfer"]]].map(([title,color,items])=>(
            <div key={title} style={{ marginBottom:8,padding:"6px 9px",borderRadius:8,background:`${color}08`,border:`1px solid ${color}30` }}>
              <div style={{ fontFamily:S.mono,fontSize:8,color,letterSpacing:1,textTransform:"uppercase",marginBottom:6 }}>{title}</div>
              {items.map((a,i)=><Bullet key={i} text={a} color={color} />)}
            </div>
          ))}
        </Card>
        <Card color={T.orange} title="Burns — Parkland Formula">
          {wt>0&&<div style={{ marginBottom:7 }}>
            <div style={{ fontFamily:S.mono,fontSize:8,color:T.txt4,letterSpacing:1.3,textTransform:"uppercase",marginBottom:4 }}>TBSA (%) — exclude superficial/1st degree</div>
            <div style={{ display:"flex",alignItems:"center",gap:10 }}>
              <input type="number" value={tbsaPct} onChange={e=>setTbsaPct(e.target.value)}
                style={{ width:80,padding:"8px 10px",background:"rgba(5,13,32,0.92)",
                  border:`1px solid ${tbsaPct?T.orange+"55":"rgba(30,70,130,0.4)"}`,
                  borderRadius:7,outline:"none",fontFamily:S.mono,fontSize:17,fontWeight:700,color:T.orange }} />
              <span style={{ fontFamily:S.sans,fontSize:11,color:T.txt4 }}>% TBSA</span>
            </div>
          </div>}
          {parkland&&<div style={{ padding:"10px 12px",borderRadius:9,marginBottom:10,background:"rgba(255,159,67,0.08)",border:"1px solid rgba(255,159,67,0.3)" }}>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:8,marginBottom:8 }}>
              {[["Total LR (24h)",`${parkland} mL`],["First 8h",`${park8h} mL`],["Next 16h",`${park8h} mL`],["Rate first 8h",`${(parseInt(park8h)/8).toFixed(0)} mL/hr`]].map(([l,v])=>(
                <div key={l} style={{ textAlign:"center" }}>
                  <div style={{ fontFamily:S.mono,fontSize:8,color:T.txt4 }}>{l}</div>
                  <div style={{ fontFamily:S.serif,fontSize:17,fontWeight:700,color:T.orange }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ fontFamily:S.sans,fontSize:9.5,color:T.txt3 }}>4 mL × %TBSA × weight(kg). Time 0 = burn time. Add maintenance for {"<"} 30 kg.</div>
          </div>}
          <div style={{ padding:"6px 9px",borderRadius:7,background:"rgba(5,13,32,0.65)",border:"1px solid rgba(30,70,130,0.3)" }}>
            <div style={{ fontFamily:S.mono,fontSize:8,color:T.orange,letterSpacing:1,textTransform:"uppercase",marginBottom:6 }}>Modified Rule of Nines (Pediatric)</div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,fontFamily:S.mono,fontSize:9 }}>
              {[["Head & neck","Infant 19% · 5y 13% · 10y 11%"],["Each arm","9% (all ages)"],["Anterior trunk","18%"],["Posterior trunk","18%"],["Each thigh","Infant 5.5% · 5y 6.5% · Adult 9%"],["Each lower leg","Infant 5% · 5y 5.5% · Adult 7%"]].map(([b,v])=>(
                <div key={b} style={{ display:"flex",justifyContent:"space-between",gap:8,padding:"3px 0",borderBottom:"1px solid rgba(30,70,130,0.15)" }}>
                  <span style={{ color:T.orange }}>{b}</span><span style={{ color:T.txt3 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </>}
      {toolTab==="tox"&&<>
        <div style={{ padding:"10px 13px",borderRadius:9,marginBottom:10,background:"rgba(255,92,92,0.1)",border:"1px solid rgba(255,92,92,0.4)" }}>
          <div style={{ fontFamily:S.mono,fontSize:9,fontWeight:700,color:T.coral }}>POISON CONTROL — 1-800-222-1222 (US) — 24/7</div>
        </div>
        <Card color={T.coral} title="Acetaminophen Overdose">
          {[["Rumack-Matthew Nomogram",T.coral,["Draw serum APAP at EXACTLY 4h post-ingestion (earlier unreliable)","Treatment threshold at 4h: APAP > 150 mcg/mL plots above treatment line","Unknown/staggered ingestion: treat if any detectable level AND symptomatic"]],
            ["NAC — 21-Hour IV Protocol",T.orange,["Bag 1: 150 mg/kg IV over 60 min (max 15 g)","Bag 2: 50 mg/kg IV over 4h (max 5 g)","Bag 3: 100 mg/kg IV over 16h (max 10 g)","Continue if INR > 1.5, AST rising, or hepatotoxicity"]],
            ["Monitoring",T.gold,["LFTs, INR, BMP, APAP level at 0h, 4h, 8h, 24h minimum","Anaphylactoid reaction to NAC ~10%: slow infusion, diphenhydramine"]]].map(([title,color,items])=>(
            <div key={title} style={{ marginBottom:8,padding:"8px 10px",borderRadius:8,background:`${color}08`,border:`1px solid ${color}25` }}>
              <div style={{ fontFamily:S.mono,fontSize:8,color,letterSpacing:1,textTransform:"uppercase",marginBottom:6 }}>{title}</div>
              {items.map((a,i)=><Bullet key={i} text={a} color={color} />)}
            </div>
          ))}
        </Card>
        <Card color={T.orange} title="Iron Ingestion">
          {wt>0&&<div style={{ padding:"6px 9px",borderRadius:7,marginBottom:8,background:"rgba(255,159,67,0.09)",border:"1px solid rgba(255,159,67,0.3)" }}>
            <div style={{ fontFamily:S.mono,fontSize:8,color:T.orange,marginBottom:5 }}>ELEMENTAL IRON THRESHOLDS — {wt} kg</div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6 }}>
              {[["Nontoxic","< 20 mg/kg",`< ${Math.round(wt*20)} mg`,T.teal],["Moderate","20–60 mg/kg",`${Math.round(wt*20)}–${Math.round(wt*60)} mg`,T.gold],["Fatal risk","> 60 mg/kg",`> ${Math.round(wt*60)} mg`,T.coral]].map(([tier,dose,calc,color])=>(
                <div key={tier} style={{ padding:"5px 7px",borderRadius:7,background:`${color}08`,border:`1px solid ${color}25`,textAlign:"center" }}>
                  <div style={{ fontFamily:S.mono,fontSize:7.5,color }}>{tier}</div>
                  <div style={{ fontFamily:S.serif,fontSize:13,fontWeight:700,color }}>{calc}</div>
                  <div style={{ fontFamily:S.mono,fontSize:7,color:T.txt4 }}>{dose}</div>
                </div>
              ))}
            </div>
          </div>}
          <Bullet text="Elemental iron: ferrous sulfate 20% — ferrous gluconate 12% — ferrous fumarate 33% — polysaccharide 100%" color={T.orange} />
          <Bullet text="Serum iron at 2–4h. Toxic > 500 mcg/dL. Deferoxamine: 15 mg/kg/hr IV (max 6 g/day). Call Poison Control." color={T.orange} />
        </Card>
        <Card color={T.mint} title="Activated Charcoal">
          <Bullet text="Dose: 1 g/kg PO (max 50 g). Give within 1–2h of ingestion for best benefit." color={T.mint} />
          <Bullet text="Contraindications: caustics, hydrocarbons, metals (iron, lithium), alcohols — charcoal does NOT bind these." color={T.mint} />
          <Bullet text="Airway protection required before giving. Never in obtunded/unprotected airway." color={T.mint} />
          <Bullet text="Multi-dose (MDAC): theophylline, carbamazepine, dapsone, phenobarbital. 0.5 g/kg q4h × 3–4 doses." color={T.mint} />
        </Card>
        <Card color={T.purple} title="Antidotes Quick Reference">
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%",borderCollapse:"collapse",fontFamily:S.mono,fontSize:9 }}>
              <thead><tr style={{ borderBottom:"1px solid rgba(176,109,255,0.3)" }}>
                {["Toxin","Antidote","Dose / Notes"].map(h=><th key={h} style={{ padding:"5px 8px",textAlign:"left",color:T.purple,fontWeight:700 }}>{h}</th>)}
              </tr></thead>
              <tbody>{ANTIDOTES.map((r,i)=>(
                <tr key={i} style={{ borderBottom:"1px solid rgba(30,70,130,0.2)" }}>
                  <td style={{ padding:"5px 8px",color:T.coral,fontWeight:600,whiteSpace:"nowrap" }}>{r.toxin}</td>
                  <td style={{ padding:"5px 8px",color:T.mint,fontWeight:600,whiteSpace:"nowrap" }}>{r.antidote}</td>
                  <td style={{ padding:"5px 8px",color:T.txt3,lineHeight:1.5 }}>{r.dose}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </Card>
      </>}
      {toolTab==="sepsis"&&<Card color={T.orange} title="Pediatric Sepsis / Septic Shock — Surviving Sepsis 2020 / PALS">
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:9 }}>
          {[{l:"SIRS",c:T.teal,d:"2+ criteria (1 must be temp or WBC)"},{l:"Sepsis",c:T.gold,d:"SIRS + suspected/confirmed infection — ABX within 1 hour"},{l:"Septic Shock",c:T.coral,d:"Sepsis + cardiovascular dysfunction despite fluid"}].map(s=>(
            <div key={s.l} style={{ padding:"8px 10px",borderRadius:8,background:`${s.c}09`,border:`1px solid ${s.c}30` }}>
              <div style={{ fontFamily:S.mono,fontSize:9,fontWeight:700,color:s.c,marginBottom:4 }}>{s.l}</div>
              <div style={{ fontFamily:S.sans,fontSize:9,color:T.txt3,lineHeight:1.5 }}>{s.d}</div>
            </div>
          ))}
        </div>
        <div style={{ overflowX:"auto",marginBottom:9 }}>
          <table style={{ width:"100%",borderCollapse:"collapse",fontFamily:S.mono,fontSize:8.5 }}>
            <thead><tr style={{ borderBottom:"1px solid rgba(255,159,67,0.35)" }}>
              {["Age","HR (bpm)","RR (/min)","WBC (×10³)","Temp (°C)"].map(h=>(
                <th key={h} style={{ padding:"5px 8px",textAlign:"left",color:T.orange,fontWeight:700 }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>{SIRS_AGES.map((r,i)=>(
              <tr key={i} style={{ borderBottom:"1px solid rgba(30,70,130,0.18)" }}>
                <td style={{ padding:"5px 8px",color:T.gold,fontWeight:600 }}>{r.age}</td>
                <td style={{ padding:"5px 8px",color:T.txt2 }}>{r.hr}</td>
                <td style={{ padding:"5px 8px",color:T.txt2 }}>{r.rr}</td>
                <td style={{ padding:"5px 8px",color:T.txt2 }}>{r.wbc}</td>
                <td style={{ padding:"5px 8px",color:T.txt2 }}>{r.temp}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        {[["Resuscitation Pathway",T.coral,["1. Airway / O2 / IV or IO access","2. Fluid: 20 mL/kg NS over 5–10 min. Reassess after each bolus.","3. Repeat up to 60 mL/kg total — STOP if crackles, hepatomegaly, or O2 worsens","4. Blood cultures × 2 before antibiotics. Lactate, CBC, BMP, procalcitonin.","5. Empiric antibiotics within 1 hour of recognition","6. Vasopressors if unresponsive to 40–60 mL/kg: epi (cold) or norepi (warm)"]],
          ["Empiric Antibiotics by Source",T.blue,["Unknown: ceftriaxone 100 mg/kg IV (max 4 g) ± vancomycin 15 mg/kg","Intra-abdominal: piperacillin-tazobactam 100 mg/kg IV q8h (max 4.5 g)","Meningitis: ceftriaxone 100 mg/kg IV + vancomycin + dexamethasone 0.15 mg/kg","Neutropenic: cefepime 50 mg/kg IV q8h (max 2 g); add vancomycin if line/skin"]]].map(([title,color,items])=>(
          <div key={title} style={{ marginBottom:8,padding:"6px 9px",borderRadius:8,background:`${color}08`,border:`1px solid ${color}28` }}>
            <div style={{ fontFamily:S.mono,fontSize:8,color,letterSpacing:1,textTransform:"uppercase",marginBottom:6 }}>{title}</div>
            {items.map((a,i)=><Bullet key={i} text={a} color={color} />)}
          </div>
        ))}
      </Card>}
      {toolTab==="proc"&&<>
        <Card color={T.red} title="Button Battery / Caustic Ingestion — EMERGENCY">
          <div style={{ padding:"8px 10px",borderRadius:7,background:"rgba(255,61,61,0.1)",border:"1px solid rgba(255,61,61,0.35)",marginBottom:7 }}>
            <div style={{ fontFamily:S.mono,fontSize:9,fontWeight:700,color:T.red }}>ESOPHAGEAL BUTTON BATTERY = SURGICAL EMERGENCY — Remove within 2 hours</div>
          </div>
          {[["Localization",T.coral,["PA film: double halo / stacked coin. 20 mm 3V lithium disc = highest risk.","Esophageal: emergency endoscopic removal regardless of symptoms"]],
            ["Pre-Endoscopy (Esophageal Only)",T.orange,["Honey (≥12 mo): 10 mL PO every 10 min × 6 doses en route","Sucralfate (>1y): 5–10 mL q30 min × 3 doses pre-endoscopy","NEVER induce vomiting. NPO otherwise."]],
            ["Gastric / Intestinal",T.gold,["Asymptomatic: serial films. Not passed in 10–14 days → consider retrieval","Battery + magnet co-ingestion: urgent surgical/endoscopic removal"]]].map(([title,color,items])=>(
            <div key={title} style={{ marginBottom:8,padding:"6px 9px",borderRadius:8,background:`${color}08`,border:`1px solid ${color}30` }}>
              <div style={{ fontFamily:S.mono,fontSize:8,color,letterSpacing:1,textTransform:"uppercase",marginBottom:6 }}>{title}</div>
              {items.map((a,i)=><Bullet key={i} text={a} color={color} />)}
            </div>
          ))}
        </Card>
        <Card color={T.coral} title="Non-Accidental Trauma (Child Abuse)">
          {[["High-Specificity Fractures",T.coral,["Classic metaphyseal lesions (CML / bucket-handle) — require high torsional force","Posterior rib fractures — forceful AP compression; rarely accidental in infants","Multiple fractures at different healing stages without consistent explanation"]],
            ["Soft Tissue Findings",T.orange,["Bruising in non-mobile infants: 'Those who don't cruise don't bruise'","Patterned bruising matching implements; bruising over torso/ears/neck in infants","Burns: sharply demarcated margins, stocking/glove distribution, cigarette marks"]],
            ["Workup",T.purple,["Skeletal survey (full, 2-view): ALL children < 2y with suspected abuse","Ophthalmology: retinal hemorrhages — unexplained AMS, seizure, or suspicious injury","Head CT: unexplained AMS, seizure, fontanelle bulge","Report to CPS — mandatory. Document objectively."]]].map(([title,color,items])=>(
            <div key={title} style={{ marginBottom:8,padding:"6px 9px",borderRadius:8,background:`${color}08`,border:`1px solid ${color}28` }}>
              <div style={{ fontFamily:S.mono,fontSize:8,color,letterSpacing:1,textTransform:"uppercase",marginBottom:6 }}>{title}</div>
              {items.map((a,i)=><Bullet key={i} text={a} color={color} />)}
            </div>
          ))}
        </Card>
        <Card color={T.blue} title="NRP — Neonatal Resuscitation (AAP/AHA 2021)">
          {[["Initial Assessment (30 Seconds)",T.blue,["Warm, dry, stimulate. Term? Good tone? Breathing/crying? — All YES = routine care","Any NO: move to warmer, position, clear airway, dry, stimulate, assess HR","HR by EKG leads or pulse ox. Auscultation unreliable for decision-making."]],
            ["Positive Pressure Ventilation",T.teal,["HR < 100 bpm OR apnea/gasping after stimulation → start PPV immediately","Rate: 40–60 breaths/min. FiO2: term 21%, preterm 21–30%.","MR SOPA if no chest rise: Mask, Reposition, Suction, Open mouth, Pressure up, Airway"]],
            ["Chest Compressions + Medications",T.coral,["HR < 60 bpm despite 30 sec effective PPV → compressions","2-thumb encircling hands. Depth: 1/3 AP. Ratio: 3:1. FiO2 100%.","Epinephrine: 0.01–0.03 mg/kg IV/UVC q3–5 min","Volume: NS 10 mL/kg IV over 5–10 min if hypovolemia"]]].map(([title,color,items])=>(
            <div key={title} style={{ marginBottom:8,padding:"8px 10px",borderRadius:8,background:`${color}08`,border:`1px solid ${color}25` }}>
              <div style={{ fontFamily:S.mono,fontSize:8,color,letterSpacing:1,textTransform:"uppercase",marginBottom:5 }}>{title}</div>
              {items.map((a,i)=><Bullet key={i} text={a} color={color} />)}
            </div>
          ))}
        </Card>
      </>}
    </div>
  );
}

// MAIN EXPORT
export default function PediatricHub({ embedded = false }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState("vitals");
  const [globalWt, setGlobalWt] = useState("");
  useEffect(() => {
    if (document.getElementById("peds-fonts")) return;
    const l = document.createElement("link");
    l.id = "peds-fonts"; l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
    document.head.appendChild(l);
    const s = document.createElement("style"); s.id = "peds-css";
    s.textContent = [
      "@keyframes peds-in{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}",
      ".peds-in{animation:peds-in .18s ease forwards}",
      "@keyframes shimmer-peds{0%{background-position:-200% center}100%{background-position:200% center}}",
      ".shimmer-peds{background:linear-gradient(90deg,#ddeeff 0%,#3dffa0 40%,#4da6ff 65%,#ddeeff 100%);",
      "  background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;",
      "  background-clip:text;animation:shimmer-peds 4s linear infinite;}",
    ].join("\n");
    document.head.appendChild(s);
  }, []);
  return (
    <div style={{ fontFamily:S.sans,background:embedded?"transparent":T.bg,
      minHeight:embedded?"auto":"100vh",color:T.txt }}>
      <div style={{ maxWidth:900,margin:"0 auto",padding:embedded?"0":"0 16px" }}>
        {!embedded&&<div style={{ padding:"10px 0 8px" }}>
          <button onClick={()=>navigate("/hub")}
            style={{ marginBottom:10,display:"inline-flex",alignItems:"center",gap:7,
              fontFamily:S.sans,fontSize:12,fontWeight:600,padding:"5px 14px",borderRadius:8,
              background:"rgba(3,10,24,0.85)",border:"1px solid rgba(30,70,130,0.5)",
              color:T.txt3,cursor:"pointer" }}>
            ← Back to Hub
          </button>
          <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:8 }}>
            <div style={{ background:"rgba(3,10,24,0.96)",border:"1px solid rgba(30,70,130,0.6)",
              borderRadius:10,padding:"5px 12px",display:"flex",alignItems:"center",gap:8 }}>
              <span style={{ fontFamily:S.mono,fontSize:10,color:T.mint,letterSpacing:3 }}>NOTRYA</span>
              <span style={{ color:T.txt4,fontFamily:S.mono,fontSize:10 }}>/</span>
              <span style={{ fontFamily:S.mono,fontSize:9,color:T.txt3,letterSpacing:2 }}>PEDS</span>
            </div>
            <div style={{ height:1,flex:1,background:"linear-gradient(90deg,rgba(61,255,160,0.45),transparent)" }} />
          </div>
          <h1 className="shimmer-peds" style={{ fontFamily:S.serif,fontSize:"clamp(16px,3vw,26px)",fontWeight:900,letterSpacing:-0.5,lineHeight:1.1 }}>
            Pediatric Emergency Hub
          </h1>
          {globalWt&&<div style={{ display:"inline-flex",alignItems:"center",gap:6,marginTop:6,
            padding:"4px 12px",borderRadius:7,background:"rgba(61,255,160,0.08)",border:"1px solid rgba(61,255,160,0.3)" }}>
            <span style={{ fontFamily:S.mono,fontSize:9,color:T.txt4,letterSpacing:1 }}>ACTIVE WEIGHT</span>
            <span style={{ fontFamily:S.mono,fontSize:14,fontWeight:700,color:T.green }}>{globalWt} kg</span>
          </div>}
          <p style={{ fontFamily:S.sans,fontSize:11,color:T.txt4,marginTop:6 }}>
            Broselow · Vitals · PECARN · Peds GCS · Fever / Rochester · PALS Resus · ETT Sizing ·
            Holliday-Segar · Seizure Protocol · Antibiotics By Condition + mL · IV ABX + mL ·
            Discharge PO + All Concentrations · Analgesia/Sed + mL · Steroids/Resp + mL ·
            PRAM · FLACC · APGAR · Dehydration · DKA · Burns · Button Battery
          </p>
        </div>}
        {globalWt&&embedded&&<div style={{ display:"inline-flex",alignItems:"center",gap:6,marginBottom:8,
          padding:"4px 12px",borderRadius:7,background:"rgba(61,255,160,0.08)",border:"1px solid rgba(61,255,160,0.3)" }}>
          <span style={{ fontFamily:S.mono,fontSize:9,color:T.txt4,letterSpacing:1 }}>ACTIVE WEIGHT</span>
          <span style={{ fontFamily:S.mono,fontSize:14,fontWeight:700,color:T.green }}>{globalWt} kg</span>
        </div>}
        <div style={{ display:"flex",gap:4,flexWrap:"wrap",padding:"6px",marginBottom:10,
          background:"rgba(5,13,32,0.88)",border:"1px solid rgba(30,70,130,0.4)",borderRadius:12 }}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{ display:"flex",alignItems:"center",gap:5,padding:"7px 10px",
                borderRadius:9,cursor:"pointer",flex:1,justifyContent:"center",
                fontFamily:S.sans,fontWeight:600,fontSize:11,
                border:`1px solid ${tab===t.id?t.color+"77":"rgba(30,70,130,0.5)"}`,
                background:tab===t.id?`${t.color}14`:"transparent",
                color:tab===t.id?t.color:T.txt4 }}>
              <span style={{ fontSize:12 }}>{t.icon}</span><span>{t.label}</span>
            </button>
          ))}
        </div>
        {tab==="vitals"  && <VitalsTab  globalWt={globalWt} setGlobalWt={setGlobalWt} />}
        {tab==="pecarn"  && <PECARNTab />}
        {tab==="fever"   && <FeverTab />}
        {tab==="meds"    && <ResusTab   globalWt={globalWt} setGlobalWt={setGlobalWt} />}
        {tab==="scoring" && <ScoringTab globalWt={globalWt} />}
        {tab==="tools"   && <ToolsTab   globalWt={globalWt} />}
        {!embedded&&<div style={{ textAlign:"center",padding:"24px 0 16px",
          fontFamily:S.mono,fontSize:8,color:T.txt4,letterSpacing:1.5 }}>
          NOTRYA PEDS · PECARN 2009 · ROCHESTER 1985 · PALS 2020 · NELSON'S 2024 ·
          AAP RED BOOK 2024 · IDSA · PRAM · CDS GOLDMAN 2008 · CLINICAL DECISION SUPPORT ONLY
        </div>}
      </div>
    </div>
  );
}