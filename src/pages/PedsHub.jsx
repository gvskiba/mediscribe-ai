// PediatricHub.jsx — Notrya Pediatric Emergency Hub
// Broselow-Luten 1992 · PECARN Kuppermann 2009 · Rochester Criteria 1985
// PALS 2020 · Nelson's Antimicrobial Therapy 2024 · AAP Red Book 2024
// IDSA CAP/UTI · AAFP/AAP AOM 2013 · Westley 1978 · PRAM · CDS Goldman 2008
// Route: /PediatricHub
// Constraints: no form/localStorage, straight quotes, single react import

import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function injectPedsStyles() {
  if (document.getElementById("peds-fonts")) return;
  const l = document.createElement("link");
  l.id = "peds-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "peds-css";
  s.textContent = `
    @keyframes peds-in{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
    .peds-in{animation:peds-in .18s ease forwards}
    @keyframes shimmer-peds{0%{background-position:-200% center}100%{background-position:200% center}}
    .shimmer-peds{background:linear-gradient(90deg,#f0f4ff 0%,#3dffa0 40%,#4da6ff 65%,#f0f4ff 100%);
      background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;
      background-clip:text;animation:shimmer-peds 4s linear infinite;}
  `;
  document.head.appendChild(s);
}

const T = {
  bg:"#030d0f",txt:"#e8fff8",txt2:"#9ed4c0",txt3:"#5aaa90",txt4:"#2d7060",
  teal:"#00d4b4",gold:"#f5c842",coral:"#ff5c5c",blue:"#4da6ff",
  orange:"#ff9f43",purple:"#b06dff",green:"#3dffa0",red:"#ff3d3d",
  mint:"#7fffcf",cyan:"#00c8d4",
};
const S = { mono:"'JetBrains Mono',monospace", sans:"'DM Sans',sans-serif", serif:"'Playfair Display',serif" };

const TABS = [
  { id:"vitals",  label:"Vitals",      icon:"📏", color:T.mint   },
  { id:"pecarn",  label:"PECARN",      icon:"🧠", color:T.blue   },
  { id:"fever",   label:"Fever",       icon:"🌡️", color:T.coral  },
  { id:"meds",    label:"Medications", icon:"💊", color:T.green  },
  { id:"scoring", label:"Scoring",     icon:"📋", color:T.purple },
  { id:"tools",   label:"Clinical Tools",icon:"🩺",color:T.gold  },
];

// ── Shared components ────────────────────────────────────────────────────────
function Card({ color, title, children, mb }) {
  return (
    <div style={{ padding:"11px 13px",borderRadius:10,marginBottom:mb||10,
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
      <span style={{ fontFamily:S.sans,fontSize:11.5,color:T.txt2,lineHeight:1.6 }}>{text}</span>
    </div>
  );
}
function Check({ label, sub, checked, onToggle, color }) {
  const c = color||T.teal;
  return (
    <button onClick={onToggle} style={{ display:"flex",alignItems:"flex-start",gap:9,
      width:"100%",padding:"8px 12px",borderRadius:8,cursor:"pointer",textAlign:"left",
      border:"none",marginBottom:4,background:checked?`${c}10`:"rgba(6,20,25,0.7)",
      borderLeft:`3px solid ${checked?c:"rgba(20,80,70,0.4)"}` }}>
      <div style={{ width:17,height:17,borderRadius:4,flexShrink:0,marginTop:1,
        border:`2px solid ${checked?c:"rgba(45,112,96,0.5)"}`,
        background:checked?c:"transparent",display:"flex",alignItems:"center",justifyContent:"center" }}>
        {checked && <span style={{ color:"#030d0f",fontSize:9,fontWeight:900 }}>✓</span>}
      </div>
      <div>
        <div style={{ fontFamily:S.sans,fontWeight:600,fontSize:12,color:checked?c:T.txt2 }}>{label}</div>
        {sub && <div style={{ fontFamily:S.sans,fontSize:10,color:T.txt4,marginTop:1 }}>{sub}</div>}
      </div>
    </button>
  );
}
function ResultBox({ label, detail, color }) {
  return (
    <div style={{ padding:"12px 14px",borderRadius:10,background:`${color}0c`,
      border:`1px solid ${color}44`,marginTop:10 }}>
      <div style={{ fontFamily:S.serif,fontWeight:700,fontSize:18,color,marginBottom:4 }}>{label}</div>
      <div style={{ fontFamily:S.sans,fontSize:11.5,color:T.txt2,lineHeight:1.65 }}>{detail}</div>
    </div>
  );
}
function ScoreWidget({ items, scores, setScores, color }) {
  const c = color||T.teal;
  return items.map(item => (
    <div key={item.key} style={{ marginBottom:10 }}>
      <div style={{ fontFamily:S.mono,fontSize:8,color:c,letterSpacing:1.3,
        textTransform:"uppercase",marginBottom:5 }}>{item.label}</div>
      <div style={{ display:"flex",gap:5,flexWrap:"wrap" }}>
        {item.opts.map(opt => (
          <button key={opt.v} onClick={() => setScores(p => ({ ...p,[item.key]:opt.v }))}
            style={{ padding:"5px 11px",borderRadius:7,cursor:"pointer",
              fontFamily:S.sans,fontWeight:600,fontSize:11,
              border:`1px solid ${scores[item.key]===opt.v?c+"66":"rgba(20,80,70,0.4)"}`,
              background:scores[item.key]===opt.v?`${c}14`:"transparent",
              color:scores[item.key]===opt.v?c:T.txt4 }}>
            {opt.v} — {opt.l}
          </button>
        ))}
      </div>
    </div>
  ));
}
function DrugSection({ title, color, drugs, wtCalc }) {
  if (!drugs||!drugs.length) return null;
  return (
    <div style={{ marginBottom:4 }}>
      <div style={{ fontFamily:S.mono,fontSize:7.5,color,letterSpacing:1.5,
        textTransform:"uppercase",padding:"4px 10px",marginBottom:4,
        background:`${color}10`,borderRadius:5,border:`1px solid ${color}25` }}>{title}</div>
      {drugs.map((d,i) => (
        <div key={i} style={{ display:"flex",alignItems:"flex-start",gap:10,padding:"7px 8px",
          borderBottom:i<drugs.length-1?"1px solid rgba(20,80,70,0.2)":"none" }}>
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ fontFamily:S.sans,fontWeight:600,fontSize:11.5,color:T.txt2 }}>{d.name}</div>
            <div style={{ fontFamily:S.sans,fontSize:10,color:T.txt4,marginTop:1,lineHeight:1.5 }}>{d.note}</div>
          </div>
          <div style={{ textAlign:"right",flexShrink:0,minWidth:80 }}>
            {wtCalc&&d.calc&&<div style={{ fontFamily:S.mono,fontSize:13,fontWeight:700,color }}>{d.calc}</div>}
            <div style={{ fontFamily:S.mono,fontSize:wtCalc&&d.calc?8:11,
              fontWeight:wtCalc&&d.calc?400:600,color:wtCalc&&d.calc?T.txt4:color }}>{d.dose}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// VITALS + WEIGHT
// ═══════════════════════════════════════════════════════════════════════════
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
  { color:"Grey",  length:"46–55 cm",  wt:"3–5 kg",   zone:"GREY",  hex:"#9e9e9e" },
  { color:"Pink",  length:"55–67 cm",  wt:"6–7 kg",   zone:"PINK",  hex:"#ff80ab" },
  { color:"Red",   length:"67–75 cm",  wt:"8–9 kg",   zone:"RED",   hex:"#ff5252" },
  { color:"Purple",length:"75–85 cm",  wt:"10–11 kg", zone:"PURP",  hex:"#b06dff" },
  { color:"Yellow",length:"85–95 cm",  wt:"12–14 kg", zone:"YELL",  hex:"#f5c842" },
  { color:"White", length:"95–107 cm", wt:"15–18 kg", zone:"WHITE", hex:"#e0e0e0" },
  { color:"Blue",  length:"107–122 cm",wt:"19–22 kg", zone:"BLUE",  hex:"#4da6ff" },
  { color:"Orange",length:"122–137 cm",wt:"24–28 kg", zone:"ORNG",  hex:"#ff9f43" },
  { color:"Green", length:"137–152 cm",wt:"30–36 kg", zone:"GREEN", hex:"#3dffa0" },
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
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12 }}>
        {[["Age (months)",ageMonths,setAgeMonths,T.mint],["Height / Length (cm)",htCm,setHtCm,T.blue]].map(([lbl,val,set,c])=>(
          <div key={lbl}>
            <div style={{ fontFamily:S.mono,fontSize:8,color:T.txt4,letterSpacing:1.3,
              textTransform:"uppercase",marginBottom:4 }}>{lbl}</div>
            <input type="number" value={val} onChange={e=>set(e.target.value)}
              style={{ width:"100%",padding:"9px 11px",background:"rgba(6,20,25,0.9)",
                border:`1px solid ${val?c+"55":"rgba(20,80,70,0.4)"}`,borderRadius:8,outline:"none",
                fontFamily:S.mono,fontSize:20,fontWeight:700,color:c }} />
          </div>
        ))}
      </div>
      {estWt&&(
        <Card color={T.mint} title="Estimated Weight">
          <div style={{ display:"flex",alignItems:"center",gap:12 }}>
            <div style={{ fontFamily:S.serif,fontSize:44,fontWeight:900,color:T.mint,lineHeight:1 }}>
              {estWt.kg.toFixed(1)}<span style={{ fontSize:20 }}> kg</span>
            </div>
            <div>
              <div style={{ fontFamily:S.sans,fontSize:11,color:T.txt3 }}>{estWt.m}</div>
              <div style={{ fontFamily:S.sans,fontSize:10,color:T.txt4,marginTop:3 }}>
                Age formula only — Broselow tape = gold standard for dosing.
              </div>
              <button onClick={()=>setGlobalWt(estWt.kg.toFixed(1))}
                style={{ marginTop:6,padding:"4px 12px",borderRadius:6,cursor:"pointer",
                  fontFamily:S.sans,fontWeight:600,fontSize:10,
                  background:"rgba(127,255,207,0.12)",border:"1px solid rgba(127,255,207,0.4)",
                  color:T.mint }}>
                Use {estWt.kg.toFixed(1)} kg for drug dosing →
              </button>
            </div>
          </div>
        </Card>
      )}
      {bz&&(
        <Card color={bz.hex} title="Broselow Zone">
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <div style={{ width:44,height:44,borderRadius:8,background:bz.hex,flexShrink:0 }} />
            <div>
              <div style={{ fontFamily:S.serif,fontWeight:700,fontSize:18,color:bz.hex }}>{bz.color} Zone</div>
              <div style={{ fontFamily:S.mono,fontSize:10,color:T.txt3 }}>{bz.length} · {bz.wt}</div>
              <div style={{ fontFamily:S.sans,fontSize:10,color:T.txt4,marginTop:2 }}>Use color-coded drug cards for weight-appropriate dosing</div>
            </div>
          </div>
        </Card>
      )}
      {norm&&(
        <Card color={T.cyan} title={`Normal Vitals — ${ageM<24?ageM+" months":ageY.toFixed(1)+" years"}`}>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:10 }}>
            {[{l:"HR",r:`${norm.hr[0]}–${norm.hr[1]}`,u:"bpm"},{l:"SBP",r:`${norm.sbp[0]}–${norm.sbp[1]}`,u:"mmHg"},{l:"RR",r:`${norm.rr[0]}–${norm.rr[1]}`,u:"/min"}].map(v=>(
              <div key={v.l} style={{ padding:"8px",borderRadius:8,textAlign:"center",
                background:"rgba(6,20,25,0.7)",border:"1px solid rgba(20,80,70,0.4)" }}>
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
                  style={{ width:"100%",padding:"7px 9px",background:"rgba(6,20,25,0.9)",
                    border:`1px solid ${f.val?sc(f.st)+"55":"rgba(20,80,70,0.35)"}`,
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
            <span style={{ fontFamily:S.sans,fontSize:9,color:T.txt4,marginLeft:6 }}>
              {ageY<=1?"(< 1y)":ageY<=10?`(70 + 2×${ageY.toFixed(1)}y)`: "(> 10y)"}
            </span>
          </div>}
        </Card>
      )}
      <Card color={T.teal} title="Pediatric Vital Sign Reference Table">
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%",borderCollapse:"collapse",fontFamily:S.mono,fontSize:9 }}>
            <thead><tr style={{ borderBottom:"1px solid rgba(20,80,70,0.4)" }}>
              {["Age Group","HR (bpm)","SBP (mmHg)","RR (/min)","Wt (kg)"].map(h=>(
                <th key={h} style={{ padding:"5px 8px",textAlign:"left",color:T.txt4,fontWeight:700 }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>{VITAL_NORMS.map((r,i)=>(
              <tr key={i} style={{ borderBottom:"1px solid rgba(20,80,70,0.2)" }}>
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

// ═══════════════════════════════════════════════════════════════════════════
// PECARN HEAD CT
// ═══════════════════════════════════════════════════════════════════════════
const P2 = [
  { key:"gcs1",  label:"GCS < 15",                      high:true, sub:"On initial ED evaluation" },
  { key:"palpfx",label:"Palpable skull fracture",        high:true, sub:"On physical examination" },
  { key:"alt1",  label:"Altered mental status",          high:true, sub:"Agitation, somnolence, repetitive questioning, slow response" },
  { key:"loc1",  label:"Loss of consciousness ≥ 5 sec",  mod:true,  sub:"Parent-reported or witnessed" },
  { key:"hem",   label:"Non-frontal scalp hematoma",     mod:true,  sub:"Scalp hematoma other than frontal region" },
  { key:"mech1", label:"Severe mechanism",               mod:true,  sub:"MVC ejection/rollover/pedestrian, fall >0.9m, high-impact head strike" },
  { key:"behav", label:"Acting abnormally per parent",   mod:true,  sub:"Behavior different from baseline per caregiver" },
];
const P2P = [
  { key:"gcs2",  label:"GCS < 15",                        high:true, sub:"On initial ED evaluation" },
  { key:"alt2",  label:"Altered mental status",            high:true, sub:"Agitation, somnolence, repetitive questioning, slow response" },
  { key:"bsf",   label:"Signs of basilar skull fracture",  high:true, sub:"Hemotympanum, Battle sign, raccoon eyes, CSF rhinorrhea/otorrhea" },
  { key:"loc2",  label:"Loss of consciousness",            mod:true,  sub:"Any duration" },
  { key:"vomit", label:"Vomiting",                         mod:true,  sub:"Any vomiting" },
  { key:"mech2", label:"Severe mechanism",                 mod:true,  sub:"MVC ejection/rollover/pedestrian, fall >1.5m, high-impact head strike" },
  { key:"ha",    label:"Severe headache",                  mod:true,  sub:"Patient reports severe headache" },
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
    detail:arm==="u2"?"Intermediate-risk in child < 2. CT vs 4–6h observation — consider non-frontal hematoma (higher risk < 3 months), clinical factors, family preference."
    :"Intermediate-risk only. CT vs observation — consider # factors, age, worsening symptoms, parental preference."}
  :{label:"CT Not Recommended",color:T.teal,
    detail:arm==="u2"?"No high/intermediate-risk factors. cTBI risk < 0.02%. Observe 4–6h if mechanism unclear."
    :"No risk factors. cTBI risk < 0.05%. Discharge with return precautions if reliable follow-up."};
  return (
    <div className="peds-in">
      <Card color={T.blue} title="PECARN Pediatric Head CT Rule — Kuppermann 2009">
        <div style={{ fontFamily:S.sans,fontSize:10.5,color:T.txt3,lineHeight:1.65,marginBottom:10 }}>
          Prospective validation in 42,412 children. Identifies cTBI requiring neurosurgical intervention. Sensitivity 99%+ in both age arms.
        </div>
        <div style={{ display:"flex",gap:7,marginBottom:4 }}>
          {[["u2","< 2 Years"],["2p","≥ 2 Years"]].map(([v,l])=>(
            <button key={v} onClick={()=>{setArm(v);setItems({});}}
              style={{ flex:1,padding:"9px 0",borderRadius:9,cursor:"pointer",
                fontFamily:S.sans,fontWeight:600,fontSize:12,
                border:`1px solid ${arm===v?T.blue+"66":"rgba(20,80,70,0.4)"}`,
                background:arm===v?"rgba(77,166,255,0.12)":"transparent",
                color:arm===v?T.blue:T.txt4 }}>{l}</button>
          ))}
        </div>
      </Card>
      <div style={{ fontFamily:S.mono,fontSize:8,color:T.coral,letterSpacing:1.5,
        textTransform:"uppercase",marginBottom:5 }}>High Risk (CT Recommended if Present)</div>
      {crit.filter(c=>c.high).map(c=><Check key={c.key} label={c.label} sub={c.sub}
        checked={!!items[c.key]} onToggle={()=>toggle(c.key)} color={T.coral} />)}
      <div style={{ fontFamily:S.mono,fontSize:8,color:T.gold,letterSpacing:1.5,
        textTransform:"uppercase",margin:"10px 0 5px" }}>Intermediate Risk (CT vs Observation)</div>
      {crit.filter(c=>c.mod).map(c=><Check key={c.key} label={c.label} sub={c.sub}
        checked={!!items[c.key]} onToggle={()=>toggle(c.key)} color={T.gold} />)}
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
        {showGcs?"▲ Hide":"▼ Show"} Pediatric GCS Reference (Verbal Modification by Age)
      </button>
      {showGcs&&<Card color={T.blue} title="Pediatric GCS — Verbal Component (Age-Modified)">
        <div style={{ fontFamily:S.sans,fontSize:10,color:T.txt4,marginBottom:8 }}>
          Motor and Eye components are identical to adult GCS. Verbal scoring is modified by developmental age.
        </div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%",borderCollapse:"collapse",fontFamily:S.mono,fontSize:9 }}>
            <thead><tr style={{ borderBottom:"1px solid rgba(77,166,255,0.3)" }}>
              {["V Score","Adult (> 5y)","Child (2–5y)","Infant (< 2y)"].map(h=>(
                <th key={h} style={{ padding:"5px 8px",textAlign:"left",color:T.blue,fontWeight:700 }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>{PEDS_GCS_VERBAL.map(r=>(
              <tr key={r.score} style={{ borderBottom:"1px solid rgba(20,80,70,0.2)" }}>
                <td style={{ padding:"5px 8px",fontFamily:S.mono,fontWeight:700,color:T.blue }}>{r.score}</td>
                <td style={{ padding:"5px 8px",color:T.txt2 }}>{r.adult}</td>
                <td style={{ padding:"5px 8px",color:T.txt2 }}>{r.child}</td>
                <td style={{ padding:"5px 8px",color:T.txt2 }}>{r.infant}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={{ marginTop:8,fontFamily:S.sans,fontSize:10,color:T.txt4,lineHeight:1.6 }}>
          GCS 13–15: Mild TBI · GCS 9–12: Moderate TBI · GCS 3–8: Severe TBI (intubation threshold)
        </div>
      </Card>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// FEVER WORKUP
// ═══════════════════════════════════════════════════════════════════════════
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
      "FULL SEPSIS WORKUP: CBC+diff, CMP, UA+UC, blood culture, LP (culture, cell count, glucose, protein)",
      "Empiric: ampicillin 50 mg/kg IV q6h + gentamicin 4 mg/kg IV q24h",
      "Add acyclovir 20 mg/kg IV q8h if HSV risk (maternal lesions, ill-appearing, seizures, vesicles)",
      "Hospitalize ALL neonates with fever — no outpatient option",
    ]},
    { r:"29–60 days (4–8 weeks)",color:T.orange,active:aW>=4&&aW<=8.5,approach:[
      "Full workup: CBC, CMP, UA+UC, blood culture, LP strongly recommended",
      "Rochester Criteria (below): if all met, consider outpatient after LP with 24h f/u",
      "Ill-appearing or high-risk: hospitalize + empiric antibiotics regardless of criteria",
      "Step-by-Step (Gomez 2016): validated sequential SBI rule-out algorithm",
    ]},
    { r:"61–90 days (8–13 weeks)",color:T.gold,active:aW>8.5&&aW<=13,approach:[
      "Stratify risk: blood culture, UA+UC, procalcitonin",
      "LP discretionary — not mandatory if low-risk criteria met and well-appearing",
      "Low risk: PCT < 0.5 + CRP < 20 + ANC < 5,200 + UA negative → consider outpatient",
      "Ceftriaxone 50 mg/kg IM + 24h return if managed outpatient",
    ]},
    { r:"3–36 months",color:T.teal,active:aW>13&&aW<=156,approach:[
      "Fully vaccinated (Hib + PCV13): SBI risk < 1% — targeted evaluation by symptoms",
      "UA+UC: female < 24m or uncircumcised male < 12m with fever > 39°C",
      "Blood culture: fever > 39°C + WBC > 15,000 or ill-appearing",
      "CXR: if WBC > 20,000 even without respiratory symptoms",
    ]},
  ];
  return (
    <div className="peds-in">
      <div style={{ marginBottom:12 }}>
        <div style={{ fontFamily:S.mono,fontSize:8,color:T.txt4,letterSpacing:1.3,
          textTransform:"uppercase",marginBottom:4 }}>Age (weeks)</div>
        <input type="number" value={ageW} onChange={e=>setAgeW(e.target.value)}
          style={{ width:140,padding:"9px 11px",background:"rgba(6,20,25,0.9)",
            border:`1px solid ${ageW?T.coral+"55":"rgba(20,80,70,0.4)"}`,borderRadius:8,
            outline:"none",fontFamily:S.mono,fontSize:20,fontWeight:700,color:T.coral }} />
      </div>
      {tiers.map((tier,i)=>(
        <div key={i} style={{ marginBottom:7,padding:"10px 13px",borderRadius:10,
          background:tier.active?`${tier.color}10`:`${tier.color}06`,
          border:`1px solid ${tier.active?tier.color+"55":tier.color+"22"}`,
          borderLeft:`4px solid ${tier.color}` }}>
          <div style={{ fontFamily:S.serif,fontWeight:700,fontSize:13,color:tier.color,
            marginBottom:tier.active?8:0 }}>
            {tier.r}
            {tier.active&&<span style={{ fontFamily:S.mono,fontSize:8,color:tier.color,marginLeft:8,
              background:`${tier.color}18`,border:`1px solid ${tier.color}40`,
              borderRadius:4,padding:"1px 7px",letterSpacing:1 }}>ACTIVE</span>}
          </div>
          {tier.active&&tier.approach.map((a,j)=><Bullet key={j} text={a} color={tier.color} />)}
        </div>
      ))}
      {aW>=4&&aW<=8.5&&<Card color={T.orange} title="Rochester Criteria — Low-Risk SBI (29–60 days)">
        <div style={{ fontFamily:S.sans,fontSize:10,color:T.txt4,marginBottom:8 }}>
          ALL criteria must be met. Does NOT replace clinical judgment. Many centers hospitalize all febrile infants 1–2 months.
        </div>
        {ROCHESTER.map(c=><Check key={c.key} label={c.label} sub={c.sub}
          checked={!!roc[c.key]} onToggle={()=>toggle(c.key)} color={T.orange} />)}
        {Object.keys(roc).length>0&&<div style={{ marginTop:8,padding:"9px 11px",borderRadius:8,
          background:lowRisk?"rgba(255,159,67,0.08)":"rgba(255,92,92,0.08)",
          border:`1px solid ${lowRisk?"rgba(255,159,67,0.35)":"rgba(255,92,92,0.3)"}` }}>
          <div style={{ fontFamily:S.serif,fontWeight:700,fontSize:14,
            color:lowRisk?T.orange:T.coral }}>
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

// ═══════════════════════════════════════════════════════════════════════════
// MEDICATIONS DATA
// ═══════════════════════════════════════════════════════════════════════════
const ABX_CONDITIONS = [
  { id:"aom",  label:"Otitis Media (AOM)",     icon:"👂",color:T.orange,ages:["infant","child"],
    lines:[
      { tier:"1st line",          drug:"Amoxicillin (high-dose)",mpkDose:42.5,freq:"q12h",max:1000,dur:"10d (<2y/severe) · 5–7d (≥2y mild)" },
      { tier:"Failure/β-lactamase",drug:"Amox-clavulanate ES 600",mpkDose:45,freq:"q12h",max:1000,dur:"10d" },
      { tier:"PCN allergy (mild)", drug:"Cefdinir",               mpkDose:7,  freq:"q12h",max:300, dur:"5–10d" },
      { tier:"PCN allergy (severe)",drug:"Azithromycin",          mpkDose:10, freq:"Day1; 5mg/kg×4d",max:500,dur:"5d" },
    ],
    note:"Watchful waiting: ≥2y, unilateral, mild, reliable f/u. Return precautions: worsening pain/fever >48h, ear drainage, dizziness. AAFP/AAP 2013." },
  { id:"gas",  label:"Strep Pharyngitis",       icon:"🦠",color:T.coral,ages:["child"],
    lines:[
      { tier:"1st line",          drug:"Amoxicillin",   mpkDose:25,  freq:"q12h",max:500,dur:"10d" },
      { tier:"Alternative",       drug:"Penicillin VK", mpkDose:12.5,freq:"q6h", max:500,dur:"10d" },
      { tier:"PCN allergy",       drug:"Cephalexin",    mpkDose:12.5,freq:"q6h", max:500,dur:"10d" },
      { tier:"PCN+ceph allergy",  drug:"Clindamycin",   mpkDose:7,   freq:"q8h", max:300,dur:"10d" },
    ],
    note:"Rapid strep + culture recommended. Full 10-day course prevents ARF. Return: fever >2d on abx, rash, neck stiffness, difficulty swallowing." },
  { id:"cap",  label:"Pneumonia (CAP, outpt)",  icon:"🫁",color:T.blue,ages:["infant","child"],
    lines:[
      { tier:"Typical (S. pneumo)",  drug:"Amoxicillin (high-dose)",mpkDose:42.5,freq:"q12h",max:1000,dur:"5–7d" },
      { tier:"Atypical (Mycoplasma)",drug:"Azithromycin",           mpkDose:10,  freq:"Day1; 5mg/kg×4d",max:500,dur:"5d" },
      { tier:"PCN allergy",          drug:"Clarithromycin",         mpkDose:7.5, freq:"q12h",max:500,dur:"7–10d" },
    ],
    note:"IDSA 2011: Amox first-line typical CAP. Add atypical coverage in ≥5y. Return: worsening breathing, cyanosis, not tolerating PO, fever >48h on abx." },
  { id:"uti",  label:"UTI / Pyelonephritis",    icon:"💧",color:T.cyan,ages:["all"],
    lines:[
      { tier:"Uncomplicated UTI",    drug:"TMP-SMX",   mpkDose:4,   freq:"q12h (TMP)",max:160,dur:"3–5d (≥2y) · 7–10d (<2y)" },
      { tier:"Alternative",         drug:"Cefdinir",   mpkDose:7,   freq:"q12h",max:300,dur:"5–7d" },
      { tier:"Pyelonephritis (oral)",drug:"Cephalexin", mpkDose:12.5,freq:"q6h",max:500,dur:"10–14d" },
      { tier:"Pyelo (IV→PO)",       drug:"Ceftriaxone IV → Cephalexin PO",mpkDose:null,freq:"IV until afebrile ×24h",max:null,dur:"14d total" },
    ],
    note:"UA+culture BEFORE antibiotics. Culture required <2y. Return: worsening fever, flank pain, vomiting. Renal US for recurrent or atypical UTI." },
  { id:"cell", label:"Cellulitis (non-purulent)",icon:"🩹",color:T.teal,ages:["all"],
    lines:[
      { tier:"1st line",        drug:"Cephalexin",  mpkDose:12.5,freq:"q6h",max:500,dur:"5–7d" },
      { tier:"Alternative",     drug:"Amoxicillin", mpkDose:12.5,freq:"q8h",max:500,dur:"5–7d" },
      { tier:"PCN/ceph allergy",drug:"Clindamycin", mpkDose:10,  freq:"q8h",max:450,dur:"5–7d" },
    ],
    note:"Non-purulent: streptococcal. Mark borders. Elevate extremity. Return: spreading beyond marked borders, fever >48h on abx, blistering/skin breakdown." },
  { id:"ssti", label:"Purulent SSTI / Abscess", icon:"⚡",color:T.purple,ages:["all"],
    lines:[
      { tier:"MRSA (1st)",  drug:"TMP-SMX",    mpkDose:4,   freq:"q12h (TMP)",max:160,dur:"5–7d" },
      { tier:"Alternative", drug:"Clindamycin", mpkDose:10,  freq:"q8h",max:450,dur:"5–7d" },
      { tier:"MSSA/mild",   drug:"Cephalexin",  mpkDose:12.5,freq:"q6h",max:500,dur:"5–7d" },
    ],
    note:"I&D is primary therapy. Return: spreading, systemic symptoms, wound dehiscence, no improvement in 48h. Wound check 48h if moderate infection." },
  { id:"sinus",label:"Bacterial Sinusitis (ABRS)",icon:"🌀",color:T.gold,ages:["child"],
    lines:[
      { tier:"1st line",          drug:"Amoxicillin (high-dose)", mpkDose:42.5,freq:"q12h",max:1000,dur:"10–14d" },
      { tier:"Resistance risk",   drug:"Amox-clavulanate ES 600", mpkDose:45,  freq:"q12h",max:1000,dur:"10–14d" },
      { tier:"PCN allergy (mild)",drug:"Cefdinir",                mpkDose:7,   freq:"q12h",max:300, dur:"10–14d" },
    ],
    note:"Diagnose only if: ≥10d without improvement, double sickening, or severe onset (fever ≥39°C + purulent rhinorrhea ≥3d concurrent). AAP 2013." },
  { id:"bite", label:"Animal / Human Bite",      icon:"🦷",color:T.red,ages:["all"],
    lines:[
      { tier:"Dog/Cat/Human",  drug:"Amox-clavulanate",mpkDose:13.3,freq:"q8h",max:500,dur:"3–5d prophy · 5–10d infected" },
      { tier:"PCN allergy",    drug:"TMP-SMX + Metronidazole",mpkDose:null,freq:"q12h + q8h",max:null,dur:"5–7d" },
    ],
    note:"Cat bites: always treat (Pasteurella). Human bites: Eikenella coverage required. Update tetanus. Report animal bites per local regulations." },
  { id:"lyme", label:"Lyme Disease (EM)",        icon:"🌲",color:T.mint,ages:["child"],
    lines:[
      { tier:"< 8 years",  drug:"Amoxicillin",      mpkDose:16.7,freq:"q8h", max:500,dur:"14–21d (EM) · 28d (arthritis)" },
      { tier:"≥ 8 years",  drug:"Doxycycline",       mpkDose:2.2, freq:"q12h",max:100,dur:"10–14d (EM) · 28d (arthritis)" },
      { tier:"PCN allergy",drug:"Cefuroxime axetil", mpkDose:15,  freq:"q12h",max:500,dur:"14–21d" },
    ],
    note:"EM ≥5 cm = clinical diagnosis; no serology needed. Return: new neurological symptoms, joint swelling, cardiac symptoms (palpitations, syncope)." },
  { id:"pertu",label:"Pertussis",                icon:"💨",color:T.green,ages:["all"],
    lines:[
      { tier:"< 1 month",           drug:"Azithromycin",mpkDose:10,freq:"q24h",max:500,dur:"5d (avoid erythromycin <1m)" },
      { tier:"≥ 1 month",           drug:"Azithromycin",mpkDose:10,freq:"Day1; 5mg/kg×4d",max:500,dur:"5d" },
      { tier:"Macrolide intolerant", drug:"TMP-SMX",    mpkDose:4, freq:"q12h (TMP)",max:160,dur:"14d" },
    ],
    note:"Treat if onset <3 weeks. Treat ALL close contacts regardless of vaccination. Isolate 5 days after starting treatment. Mandatory reporting." },
];

const DISCHARGE_ABX = [
  { name:"Amoxicillin (standard)",    dose:"40–50 mg/kg/day ÷ q8–12h",    mpkDose:16.7,freq:"q8h", max:500, note:"Strep pharyngitis, mild CAP (typical), UTI in low-risk older children." },
  { name:"Amoxicillin (high-dose)",   dose:"80–90 mg/kg/day ÷ q12h",      mpkDose:42.5,freq:"q12h",max:1000,note:"AOM first-line, sinusitis, high-dose CAP. Max 1 g/dose." },
  { name:"Amox-clavulanate ES 600",   dose:"90 mg/kg/day (amox) ÷ q12h",  mpkDose:45,  freq:"q12h",max:1000,note:"AOM failure, sinusitis resistant, bites. 600 mg amox per 5 mL." },
  { name:"Amox-clavulanate std",      dose:"25–45 mg/kg/day (amox) ÷ q8h",mpkDose:13.3,freq:"q8h", max:500, note:"Bites, sinusitis mild, polymicrobial." },
  { name:"Cephalexin",                dose:"25–50 mg/kg/day ÷ q6h",        mpkDose:12.5,freq:"q6h", max:500, note:"MSSA cellulitis, UTI, strep, impetigo." },
  { name:"Cefdinir",                  dose:"14 mg/kg/day ÷ q12–24h",       mpkDose:7,   freq:"q12h",max:300, note:"AOM (PCN allergy), sinusitis, CAP, UTI." },
  { name:"Cefpodoxime",               dose:"10 mg/kg/day ÷ q12h",          mpkDose:5,   freq:"q12h",max:200, note:"UTI, AOM, CAP, sinusitis." },
  { name:"Cefuroxime axetil",         dose:"30 mg/kg/day ÷ q12h",          mpkDose:15,  freq:"q12h",max:500, note:"AOM, sinusitis, Lyme (PCN allergy). Take with food." },
  { name:"Penicillin VK",             dose:"25–50 mg/kg/day ÷ q6–8h",      mpkDose:12.5,freq:"q6h", max:500, note:"Strep pharyngitis, dental/oral infections." },
  { name:"Azithromycin",              dose:"10 mg/kg Day1; 5 mg/kg Days2–5",mpkDose:10,  freq:"Day1 load",max:500,note:"Atypical CAP, pertussis, AOM (PCN allergy), Chlamydia." },
  { name:"Clarithromycin",            dose:"15 mg/kg/day ÷ q12h",          mpkDose:7.5, freq:"q12h",max:500, note:"Atypical CAP, MAC. Macrolide alternative." },
  { name:"Clindamycin",               dose:"20–30 mg/kg/day ÷ q8h",        mpkDose:10,  freq:"q8h", max:450, note:"CA-MRSA SSTI, strep pharyngitis, anaerobic/dental." },
  { name:"TMP-SMX (DS)",              dose:"8–12 mg/kg/day (TMP) ÷ q12h",  mpkDose:4,   freq:"q12h",max:160, note:"CA-MRSA SSTI, UTI. Avoid <2m, sulfa allergy." },
  { name:"Nitrofurantoin",            dose:"5–7 mg/kg/day ÷ q6h",          mpkDose:1.5, freq:"q6h", max:100, note:"UTI only (not pyelonephritis). Avoid <1m, GFR <45." },
  { name:"Metronidazole",             dose:"15–35 mg/kg/day ÷ q8h",        mpkDose:10,  freq:"q8h", max:500, note:"Anaerobic, C. diff (PO only), Giardia." },
  { name:"Doxycycline (≥ 8 years)",  dose:"2.2 mg/kg/dose q12h",          mpkDose:2.2, freq:"q12h",max:100, note:"Lyme (≥8y), RMSF, MRSA SSTI, atypical CAP. Avoid <8y." },
];

const SEIZURE_STEPS = [
  { step:"0–5 min", label:"First-Line Benzodiazepine", color:T.teal,
    actions:["Midazolam IN/IM: 0.2 mg/kg (max 10 mg) — preferred if no IV","Lorazepam IV: 0.1 mg/kg (max 4 mg) — if IV access","Diazepam PR: 0.5 mg/kg (<5y); 0.3 mg/kg (5–12y); max 10 mg"] },
  { step:"5–10 min",label:"Repeat Benzodiazepine (same agent/route)", color:T.gold,
    actions:["Repeat initial benzo dose once if seizure persists at 5 min","If no IV: intranasal or rectal route — establish IV access now"] },
  { step:"10–20 min",label:"Second-Line Agent (choose one)", color:T.orange,
    actions:["Levetiracetam 60 mg/kg IV over 5–10 min (max 4.5 g) — preferred","Valproate 40 mg/kg IV over 15 min (max 3 g) — avoid <2y and metabolic disorders","Fosphenytoin 20 PE/kg IV at 2–3 mg/kg/min (max 1,500 PE) — monitor EKG"] },
  { step:"> 20 min", label:"Refractory Status Epilepticus — ICU", color:T.coral,
    actions:["Phenobarbital 20 mg/kg IV (max 1 g) — monitor respiratory status","Repeat levetiracetam 60 mg/kg OR additional valproate dose","Consider RSI + midazolam/propofol/pentobarbital infusion — ICU transfer","EEG monitoring required for refractory status"] },
];

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
  { id:null,      label:"All Ages" },
  { id:"neonate", label:"Neonate (<28d)" },
  { id:"infant",  label:"Infant (1–12m)" },
  { id:"child",   label:"Child (>1y)" },
];

// ═══════════════════════════════════════════════════════════════════════════
// MEDICATIONS TAB
// ═══════════════════════════════════════════════════════════════════════════
function ResusTab({ globalWt, setGlobalWt }) {
  const [weight,setWeight]=useState(globalWt||"");
  const [subTab,setSubTab]=useState("resus");
  const [abxPill,setAbxPill]=useState("condition");
  const [selCond,setSelCond]=useState(null);
  const [ageFilter,setAgeFilter]=useState(null);
  const [ageYrs,setAgeYrs]=useState("");
  const wt=parseFloat(weight)||0;
  const ay=parseFloat(ageYrs)||0;

  // ETT/Airway
  const ettUncuffed=ay>=1?(ay/4+4).toFixed(1):ay>0?"3.5":"—";
  const ettCuffed=ay>=1?(ay/4+3.5).toFixed(1):ay>0?"3.0":"—";
  const ettDepth=ay>=1?(ay/2+12).toFixed(0):ay>0?"10–11":"—";
  const blade=ay===0?"—":ay<0.083?"0":ay<2?"1":ay<8?"2":"3";
  const lma=wt<=0?"—":wt<5?"1":wt<10?"1.5":wt<20?"2":wt<30?"2.5":wt<50?"3":"4";
  const maint=wt<=0?0:wt<=10?wt*4:wt<=20?40+(wt-10)*2:60+(wt-20)*1;

  const nWt=<div style={{ padding:"24px",textAlign:"center",fontFamily:S.sans,fontSize:12,color:T.txt4 }}>
    Enter patient weight above to calculate doses.</div>;

  const resusDrugs=wt>0?[
    { name:"Epinephrine (arrest)",     dose:"0.01 mg/kg IV/IO",  calc:`${(wt*.01).toFixed(2)} mg`,  note:"Max 1 mg; q3–5 min. 1:10,000 = 0.1 mL/kg. Drip: 0.1–1 mcg/kg/min." },
    { name:"Atropine",                 dose:"0.02 mg/kg IV/IO",  calc:`${(wt*.02).toFixed(2)} mg`,  note:"Min 0.1 mg, max 0.5 mg/dose. Bradycardia with poor perfusion." },
    { name:"Adenosine (SVT)",          dose:"0.1 mg/kg IV rapid",calc:`${(wt*.1).toFixed(2)} mg`,   note:"Max 6 mg. Flush rapidly. 2nd dose 0.2 mg/kg (max 12 mg)." },
    { name:"Amiodarone (VF/pVT)",      dose:"5 mg/kg IV/IO",     calc:`${(wt*5).toFixed(0)} mg`,    note:"Max 300 mg; max 3 doses. Push in arrest; infuse over 20–60 min otherwise." },
    { name:"Lidocaine (VF/pVT alt)",   dose:"1 mg/kg IV/IO",     calc:`${(wt*1).toFixed(1)} mg`,    note:"Alt to amiodarone. Max 100 mg. Drip: 20–50 mcg/kg/min." },
    { name:"Calcium chloride 10%",     dose:"20 mg/kg IV/IO",    calc:`${(wt*20).toFixed(0)} mg (${(wt*.2).toFixed(1)} mL)`, note:"Max 2 g. Hypocalcemia, hyperK, CCB toxicity. Central line preferred." },
    { name:"Sodium bicarbonate",       dose:"1 mEq/kg IV",       calc:`${(wt*1).toFixed(1)} mEq`,   note:"Dilute to 4.2% in neonates/infants. Confirm acidosis first." },
    { name:"Dextrose",                 dose:"2–4 mL/kg D10W",    calc:`${(wt*2).toFixed(0)}–${(wt*4).toFixed(0)} mL`, note:"D10W neonates; D25W infants; D50W adolescents. Confirm BG." },
    { name:"Naloxone",                 dose:"0.01 mg/kg IV/IM/IN",calc:`${(wt*.01).toFixed(3)} mg`, note:"Titrate to respirations. IN: 0.1 mg/kg (max 4 mg). Repeat q2–3 min." },
    { name:"Normal saline (bolus)",    dose:"10–20 mL/kg IV/IO", calc:`${(wt*10).toFixed(0)}–${(wt*20).toFixed(0)} mL`, note:"Septic shock: 10 mL/kg aliquots. Max 60 mL/kg then reassess." },
    { name:"RSI: Ketamine",            dose:"1–2 mg/kg IV",      calc:`${(wt*1).toFixed(0)}–${(wt*2).toFixed(0)} mg`, note:"Preferred peds induction. IM 4–5 mg/kg if no IV." },
    { name:"RSI: Succinylcholine",     dose:"2 mg/kg (<10kg) / 1.5 mg/kg (≥10kg)",calc:`${wt<10?(wt*2).toFixed(0):(wt*1.5).toFixed(0)} mg`, note:"Atropine pretreatment if <1 year." },
    { name:"RSI: Rocuronium",          dose:"1.2 mg/kg IV",      calc:`${(wt*1.2).toFixed(0)} mg`,  note:"Reversal: sugammadex 16 mg/kg IV." },
  ]:[];
  const defib=wt>0?[
    { label:"Initial shock (VF/pVT)",  dose:"2 J/kg",     calc:`${(wt*2).toFixed(0)} J` },
    { label:"Second shock",            dose:"4 J/kg",     calc:`${(wt*4).toFixed(0)} J` },
    { label:"Subsequent shocks",       dose:"4–10 J/kg",  calc:`${(wt*4).toFixed(0)}–${Math.min(wt*10,200).toFixed(0)} J` },
    { label:"Cardioversion — SVT",     dose:"0.5–1 J/kg", calc:`${(wt*.5).toFixed(0)}–${(wt*1).toFixed(0)} J` },
    { label:"Cardioversion — VT pulse",dose:"1–2 J/kg",   calc:`${(wt*1).toFixed(0)}–${(wt*2).toFixed(0)} J` },
  ]:[];
  const neonAbx=wt>0?[
    { name:"Ampicillin — sepsis",  dose:"50 mg/kg IV q6h", calc:`${(wt*50).toFixed(0)} mg q6h`, note:"Meningitis: 100 mg/kg IV q6h. GBS, Listeria, enterococcus." },
    { name:"Gentamicin — neonatal",dose:"4 mg/kg IV q24h", calc:`${(wt*4).toFixed(0)} mg q24h`,note:"7–28d: 3.5 mg/kg q24h. Levels required." },
    { name:"Acyclovir — HSV",      dose:"20 mg/kg IV q8h", calc:`${(wt*20).toFixed(0)} mg q8h`,note:"Neonatal HSV: 14–21d course. CSF HSV PCR before starting." },
  ]:[];
  const broadAbx=wt>0?[
    { name:"Ceftriaxone",          dose:"50 mg/kg IV/IM q24h",  calc:`${Math.min(wt*50,2000).toFixed(0)} mg q24h`,note:"Meningitis: 100 mg/kg q24h (max 4 g). Sepsis, pneumonia, UTI." },
    { name:"Cefazolin",            dose:"25 mg/kg IV q8h",      calc:`${Math.min(wt*25,2000).toFixed(0)} mg q8h`, note:"Max 2 g/dose. MSSA, SSTI, surgical prophylaxis." },
    { name:"Ampicillin-sulbactam", dose:"50 mg/kg IV q6h",      calc:`${Math.min(wt*50,3000).toFixed(0)} mg q6h`, note:"Max 3 g/dose. Polymicrobial, bites, aspiration." },
    { name:"Pip-tazobactam",       dose:"100 mg/kg IV q8h",     calc:`${Math.min(wt*100,4500).toFixed(0)} mg q8h`,note:"Max 4.5 g/dose. Pseudomonas, febrile neutropenia." },
    { name:"Meropenem",            dose:"20 mg/kg IV q8h",      calc:`${Math.min(wt*20,1000).toFixed(0)} mg q8h`, note:"Meningitis: 40 mg/kg q8h (max 2 g). MDR organisms." },
  ]:[];
  const mrsaAbx=wt>0?[
    { name:"Vancomycin",    dose:"15 mg/kg IV q6h",       calc:`${Math.min(wt*15,750).toFixed(0)} mg q6h`, note:"Max 60 mg/kg/day. AUC-guided; target AUC/MIC 400–600. Check levels." },
    { name:"Clindamycin IV",dose:"10 mg/kg IV q8h",       calc:`${Math.min(wt*10,600).toFixed(0)} mg q8h`,note:"Max 600 mg/dose. CA-MRSA, osteomyelitis." },
    { name:"TMP-SMX IV",    dose:"4–5 mg/kg (TMP) q12h",  calc:`${(wt*4).toFixed(0)}–${(wt*5).toFixed(0)} mg TMP`,note:"MRSA, UTI. Avoid neonates." },
  ]:[];
  const opioids=wt>0?[
    { name:"Fentanyl IV/IN",dose:"1–2 mcg/kg IV; 2 mcg/kg IN",calc:`${(wt*1).toFixed(0)}–${(wt*2).toFixed(0)} mcg IV · ${Math.min(wt*2,100).toFixed(0)} mcg IN`,note:"Max 100 mcg/dose. IN: 1 mL/nostril max." },
    { name:"Morphine",      dose:"0.1 mg/kg IV/IM",           calc:`${(wt*.1).toFixed(2)} mg`,note:"Max 4 mg/dose IV. Slower onset; histamine release." },
    { name:"Hydromorphone", dose:"0.015 mg/kg IV",            calc:`${(wt*.015).toFixed(3)} mg`,note:"Max 1 mg/dose. 5× more potent than morphine." },
  ]:[];
  const nonOpioids=wt>0?[
    { name:"Ketorolac",          dose:"0.5 mg/kg IV",      calc:`${Math.min(wt*.5,15).toFixed(1)} mg`,    note:"Max 15 mg IV peds. Avoid bleeding risk or AKI." },
    { name:"Acetaminophen IV",   dose:"15 mg/kg IV q6h",   calc:`${Math.min(wt*15,1000).toFixed(0)} mg q6h`,note:"Max 1 g/dose; <75 mg/kg/day." },
    { name:"Ibuprofen",          dose:"10 mg/kg PO q6–8h", calc:`${Math.min(wt*10,800).toFixed(0)} mg`,   note:"Max 800 mg/dose. Avoid <6m, AKI, GI bleeding." },
    { name:"Acetaminophen PO/PR",dose:"15 mg/kg q4–6h",    calc:`${Math.min(wt*15,1000).toFixed(0)} mg`,  note:"Max 1 g/dose; max 5 doses/day." },
  ]:[];
  const sedation=wt>0?[
    { name:"Ketamine (PSA)",  dose:"1–2 mg/kg IV; 4–5 mg/kg IM",calc:`${(wt*1).toFixed(0)}–${(wt*2).toFixed(0)} mg IV · ${(wt*4).toFixed(0)}–${(wt*5).toFixed(0)} mg IM`,note:"Dissociative. Pre-treat ondansetron. Preferred >3m." },
    { name:"Midazolam",       dose:"0.1 mg/kg IV; 0.2 mg/kg IN",calc:`${(wt*.1).toFixed(2)} mg IV · ${Math.min(wt*.2,10).toFixed(1)} mg IN`,note:"Max 10 mg IN/IM. Reversal: flumazenil 0.01 mg/kg IV." },
    { name:"Dexmedetomidine", dose:"1–2 mcg/kg IV ×10min; 2–3 mcg/kg IN",calc:`${(wt*1).toFixed(0)}–${(wt*2).toFixed(0)} mcg IV · ${Math.min(wt*2.5,200).toFixed(0)} mcg IN`,note:"No respiratory depression. MRI, wound care." },
    { name:"Propofol (PSA)",  dose:"1–2 mg/kg IV",              calc:`${(wt*1).toFixed(0)}–${(wt*2).toFixed(0)} mg`,note:"Airway provider required. Lidocaine pre-treat." },
    { name:"Etomidate",       dose:"0.3 mg/kg IV",              calc:`${(wt*.3).toFixed(1)} mg`,note:"Rapid onset, minimal hemodynamic effect. Single dose." },
  ]:[];
  const anaphylaxis=wt>0?[
    { name:"Epinephrine 1:1000 IM",dose:"0.01 mg/kg IM (anterolateral thigh)",calc:`${Math.min(wt*.01,.5).toFixed(3)} mg`,note:"Max 0.5 mg. Auto-injector: <15 kg → 0.15 mg; ≥15 kg → 0.3 mg." },
    { name:"Diphenhydramine",      dose:"1 mg/kg IV/IM/PO",                   calc:`${Math.min(wt*1,50).toFixed(0)} mg`,note:"Max 50 mg. H1 blocker adjunct — never delay epi for this." },
  ]:[];
  const steroids=wt>0?[
    { name:"Dexamethasone — croup", dose:"0.6 mg/kg PO/IM/IV × 1",  calc:`${Math.min(wt*.6,10).toFixed(1)} mg`,    note:"Max 10 mg. Single dose. Oral = IV bioavailability." },
    { name:"Dexamethasone — asthma",dose:"0.6 mg/kg PO/IV × 1–2d",  calc:`${Math.min(wt*.6,16).toFixed(1)} mg/day`,note:"Max 16 mg/day. Non-inferior to 5-day prednisone." },
    { name:"Methylprednisolone",    dose:"1–2 mg/kg IV q6–12h",      calc:`${(wt*1).toFixed(0)}–${Math.min(wt*2,125).toFixed(0)} mg`,note:"Max 125 mg/dose. Severe asthma, anaphylaxis." },
    { name:"Prednisolone",          dose:"1 mg/kg PO q24h",          calc:`${Math.min(wt*1,60).toFixed(0)} mg/day`, note:"Max 60 mg/day. Asthma exacerbation, croup." },
  ]:[];
  const resp=wt>0?[
    { name:"Albuterol neb",       dose:"0.15 mg/kg q20min × 3",        calc:`${Math.max(Math.min(wt*.15,5),2.5).toFixed(1)} mg`,note:"Min 2.5 mg, max 5 mg. Continuous: 0.5 mg/kg/h (max 20)." },
    { name:"Albuterol MDI",       dose:"4–8 puffs with spacer q20min", calc:"4–8 puffs q20 min",note:"MDI + spacer = neb in mild-moderate asthma. 90 mcg/puff." },
    { name:"Ipratropium",         dose:"250 mcg (<20 kg) / 500 mcg (≥20 kg)",calc:wt<20?"250 mcg neb":"500 mcg neb",note:"q20 min × 3 in severe asthma. Additive with albuterol." },
    { name:"Magnesium sulfate",   dose:"25–75 mg/kg IV over 20–30 min",calc:`${Math.min(wt*25,500).toFixed(0)}–${Math.min(wt*75,2500).toFixed(0)} mg`,note:"Severe asthma max 2.5 g. Seizures max 2 g. Monitor BP." },
    { name:"Racemic epi neb",     dose:"0.5 mL of 2.25% in 3 mL NS",  calc:"0.5 mL 2.25% (fixed)",note:"Croup, post-extubation stridor. Observe 2–4h for rebound." },
    { name:"L-Epinephrine 1:1000",dose:"0.5 mL/kg (max 5 mL) in 3 mL NS",calc:`${Math.min(wt*.5,5).toFixed(1)} mL`,note:"Croup alternative to racemic epi. Same efficacy." },
  ]:[];
  const antiemetics=wt>0?[
    { name:"Ondansetron IV",   dose:"0.15 mg/kg IV/IM",              calc:`${Math.min(wt*.15,4).toFixed(2)} mg`, note:"Max 4 mg/dose. Repeat q4–6h prn. Most-used peds antiemetic in ED." },
    { name:"Ondansetron ODT",  dose:"< 30 kg: 4 mg · ≥ 30 kg: 8 mg",calc:wt<30?"4 mg ODT":"8 mg ODT",          note:"Dissolves on tongue — ideal when vomiting makes PO difficult." },
    { name:"Promethazine",     dose:"0.25–0.5 mg/kg IV/IM q4–6h",   calc:`${Math.min(wt*.3,25).toFixed(1)} mg`, note:"Max 25 mg. Avoid <2y (respiratory depression). Never IV push." },
  ]:[];
  const bloodProd=wt>0?[
    { name:"pRBC",         dose:"10–15 mL/kg IV over 3–4h",    calc:`${(wt*10).toFixed(0)}–${(wt*15).toFixed(0)} mL`, note:"Stable anemia. Each 10 mL/kg raises Hgb ~2–3 g/dL." },
    { name:"FFP",          dose:"10–15 mL/kg IV over 30–60 min",calc:`${(wt*10).toFixed(0)}–${(wt*15).toFixed(0)} mL`, note:"Coagulopathy, factor deficiency. Allow 30 min thaw time." },
    { name:"Platelets",    dose:"5–10 mL/kg IV over 30 min",   calc:`${(wt*5).toFixed(0)}–${(wt*10).toFixed(0)} mL`,  note:"1 apheresis unit for larger children. Give over 30 min." },
    { name:"Cryoprecipitate",dose:"1–2 units per 10 kg IV",    calc:`${Math.max(Math.round(wt/10),1)}–${Math.max(Math.round(wt/5),1)} units`, note:"Fibrinogen replacement. Target fibrinogen > 100 mg/dL." },
  ]:[];
  const antiviral=wt>0?[
    { name:"Oseltamivir (Tamiflu)", dose:"Weight-based × 5 days",
      calc:wt<15?"30 mg q12h":wt<23?"45 mg q12h":wt<40?"60 mg q12h":"75 mg q12h",
      note:"Start within 48h of onset. Neonates ≥2 weeks: 3 mg/kg q12h. Adult dose >40 kg." },
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
            style={{ width:110,padding:"10px 12px",background:"rgba(6,20,25,0.9)",
              border:`1px solid ${weight?T.green+"55":"rgba(20,80,70,0.4)"}`,
              borderRadius:8,outline:"none",fontFamily:S.mono,fontSize:22,fontWeight:900,color:T.green }} />
          <div style={{ fontFamily:S.sans,fontSize:11,color:T.txt4,lineHeight:1.6 }}>
            Enter from Broselow tape or use "→ drug dosing" button in Vitals tab.
            All doses calculated with max caps applied.
          </div>
        </div>
      </Card>
      <div style={{ display:"flex",gap:4,flexWrap:"wrap",padding:"5px",marginBottom:12,
        background:"rgba(6,20,25,0.7)",border:"1px solid rgba(20,80,70,0.35)",borderRadius:10 }}>
        {RESUS_SUBTABS.map(st=>(
          <button key={st.id} onClick={()=>setSubTab(st.id)}
            style={{ flex:1,padding:"7px 10px",borderRadius:7,cursor:"pointer",
              fontFamily:S.sans,fontWeight:600,fontSize:11,
              border:`1px solid ${subTab===st.id?st.color+"66":"rgba(20,80,70,0.4)"}`,
              background:subTab===st.id?`${st.color}14`:"transparent",
              color:subTab===st.id?st.color:T.txt4 }}>{st.label}</button>
        ))}
      </div>

      {subTab==="resus"&&<>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10 }}>
          <div>
            <div style={{ fontFamily:S.mono,fontSize:7,color:T.txt4,letterSpacing:1.3,
              textTransform:"uppercase",marginBottom:4 }}>Age for Airway Sizing (years)</div>
            <input type="number" value={ageYrs} onChange={e=>setAgeYrs(e.target.value)}
              style={{ width:"100%",padding:"7px 9px",background:"rgba(6,20,25,0.9)",
                border:`1px solid ${ageYrs?T.mint+"55":"rgba(20,80,70,0.4)"}`,
                borderRadius:7,outline:"none",fontFamily:S.mono,fontSize:18,fontWeight:700,color:T.mint }} />
          </div>
          {ay>0&&<Card color={T.mint} title="Airway Sizing" mb={0}>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:6 }}>
              {[["ETT (uncuffed)",ettUncuffed,"mm"],["ETT (cuffed)",ettCuffed,"mm"],
                ["ETT depth",ettDepth,"cm at lip"],["Blade size",blade,""],
                ["LMA size",lma,"(by weight)"],["Suction",ay<1?"6–8F":ay<5?"8–10F":"10–12F","French"]].map(([l,v,u])=>(
                <div key={l} style={{ padding:"5px 7px",borderRadius:6,background:"rgba(127,255,207,0.06)",
                  border:"1px solid rgba(127,255,207,0.18)" }}>
                  <div style={{ fontFamily:S.mono,fontSize:7.5,color:T.txt4,letterSpacing:0.5 }}>{l}</div>
                  <div style={{ fontFamily:S.mono,fontSize:14,fontWeight:700,color:T.mint }}>{v}</div>
                  <div style={{ fontFamily:S.mono,fontSize:7,color:T.txt4 }}>{u}</div>
                </div>
              ))}
            </div>
          </Card>}
        </div>
        {wt>0&&<Card color={T.cyan} title="Maintenance Fluids — Holliday-Segar (4-2-1 Rule)">
          <div style={{ display:"flex",alignItems:"center",gap:16 }}>
            <div style={{ fontFamily:S.serif,fontSize:40,fontWeight:900,color:T.cyan,lineHeight:1 }}>
              {maint.toFixed(0)}<span style={{ fontSize:18 }}> mL/hr</span>
            </div>
            <div style={{ fontFamily:S.sans,fontSize:10.5,color:T.txt3,lineHeight:1.65 }}>
              <div>Formula: ≤10 kg: 4 mL/kg/hr · 10–20 kg: 40+(2×kg over 10) · {">"} 20 kg: 60+(1×kg over 20)</div>
              <div style={{ color:T.txt4,marginTop:2 }}>Daily: {(maint*24).toFixed(0)} mL/day · Add deficit + ongoing losses for resuscitation</div>
            </div>
          </div>
        </Card>}
        {wt>0&&<Card color={T.coral} title="Defibrillation / Cardioversion">
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(185px,1fr))",gap:7 }}>
            {defib.map(d=>(
              <div key={d.label} style={{ padding:"8px 10px",borderRadius:8,
                background:"rgba(255,92,92,0.07)",border:"1px solid rgba(255,92,92,0.25)" }}>
                <div style={{ fontFamily:S.sans,fontSize:10,color:T.txt3,marginBottom:3 }}>{d.label}</div>
                <div style={{ fontFamily:S.mono,fontSize:14,fontWeight:700,color:T.coral }}>{d.calc}</div>
                <div style={{ fontFamily:S.mono,fontSize:8,color:T.txt4 }}>{d.dose}</div>
              </div>
            ))}
          </div>
        </Card>}
        {wt>0?<Card color={T.green} title="PALS Weight-Based Drug Dosing">
          {resusDrugs.map((d,i)=>(
            <div key={i} style={{ display:"flex",alignItems:"flex-start",gap:10,padding:"7px 0",
              borderBottom:i<resusDrugs.length-1?"1px solid rgba(20,80,70,0.25)":"none" }}>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontFamily:S.sans,fontWeight:600,fontSize:11.5,color:T.txt2 }}>{d.name}</div>
                <div style={{ fontFamily:S.sans,fontSize:10,color:T.txt4,marginTop:1 }}>{d.note}</div>
              </div>
              <div style={{ textAlign:"right",flexShrink:0 }}>
                <div style={{ fontFamily:S.mono,fontSize:13,fontWeight:700,color:T.green }}>{d.calc}</div>
                <div style={{ fontFamily:S.mono,fontSize:8,color:T.txt4 }}>{d.dose}</div>
              </div>
            </div>
          ))}
        </Card>:nWt}
        <Card color={T.orange} title="Seizure Escalation Protocol (Status Epilepticus)">
          {SEIZURE_STEPS.map((step,i)=>(
            <div key={i} style={{ marginBottom:8,padding:"9px 11px",borderRadius:9,
              background:`${step.color}08`,border:`1px solid ${step.color}30`,
              borderLeft:`4px solid ${step.color}` }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6 }}>
                <div style={{ fontFamily:S.serif,fontWeight:700,fontSize:13,color:step.color }}>{step.label}</div>
                <span style={{ fontFamily:S.mono,fontSize:8,color:step.color,background:`${step.color}18`,
                  border:`1px solid ${step.color}35`,borderRadius:4,padding:"2px 8px" }}>{step.step}</span>
              </div>
              {step.actions.map((a,j)=>{
                const mgMatch=a.match(/(\d+\.?\d*)\s*mg\/kg/);
                const mcgMatch=a.match(/(\d+\.?\d*)\s*mcg\/kg/);
                const meqMatch=a.match(/(\d+\.?\d*)\s*mEq\/kg/);
                let calc="";
                if(wt>0&&mgMatch)calc=` → ${Math.min(Math.round(wt*parseFloat(mgMatch[1])),a.includes("max")?parseInt(a.match(/max[\s,](\d+)/)?.[1]||9999):9999)} mg`;
                if(wt>0&&mcgMatch)calc=` → ${Math.min(Math.round(wt*parseFloat(mcgMatch[1])),parseInt(a.match(/max[\s,](\d+)/)?.[1]||9999))} mcg`;
                return(
                  <div key={j} style={{ display:"flex",gap:7,alignItems:"flex-start",marginBottom:3 }}>
                    <span style={{ color:step.color,fontSize:7,marginTop:4,flexShrink:0 }}>▸</span>
                    <span style={{ fontFamily:S.sans,fontSize:10.5,color:T.txt2,lineHeight:1.5 }}>
                      {a}
                      {calc&&<strong style={{ color:step.color }}>{calc}</strong>}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </Card>
      </>}

      {subTab==="abx"&&<>
        <div style={{ display:"flex",gap:4,marginBottom:10 }}>
          {ABX_PILLS.map(p=>(
            <button key={p.id} onClick={()=>{ setAbxPill(p.id); setSelCond(null); }}
              style={{ flex:1,padding:"6px 8px",borderRadius:7,cursor:"pointer",
                fontFamily:S.sans,fontWeight:600,fontSize:10.5,
                border:`1px solid ${abxPill===p.id?T.coral+"66":"rgba(20,80,70,0.4)"}`,
                background:abxPill===p.id?"rgba(255,92,92,0.12)":"transparent",
                color:abxPill===p.id?T.coral:T.txt4 }}>{p.label}</button>
          ))}
        </div>
        {abxPill==="condition"&&<>
          <div style={{ display:"flex",gap:4,flexWrap:"wrap",marginBottom:10 }}>
            {AGE_FILTERS.map(af=>(
              <button key={String(af.id)} onClick={()=>{ setAgeFilter(af.id); setSelCond(null); }}
                style={{ padding:"5px 10px",borderRadius:7,cursor:"pointer",
                  fontFamily:S.sans,fontWeight:600,fontSize:10,
                  border:`1px solid ${ageFilter===af.id?T.blue+"66":"rgba(20,80,70,0.35)"}`,
                  background:ageFilter===af.id?"rgba(77,166,255,0.12)":"transparent",
                  color:ageFilter===af.id?T.blue:T.txt4 }}>{af.label}</button>
            ))}
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(148px,1fr))",gap:6,marginBottom:10 }}>
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
          {cond&&<div style={{ padding:"13px 14px",borderRadius:11,marginBottom:8,
            background:`${cond.color}08`,border:`1px solid ${cond.color}40`,
            borderLeft:`4px solid ${cond.color}` }}>
            <div style={{ fontFamily:S.serif,fontWeight:700,fontSize:16,color:cond.color,marginBottom:10 }}>
              {cond.icon} {cond.label}
            </div>
            {cond.lines.map((line,i)=>{
              const pd=wt>0&&line.mpkDose?`${calcDose(wt,line.mpkDose,line.max)} mg ${line.freq}`:null;
              return(
                <div key={i} style={{ display:"flex",gap:10,alignItems:"flex-start",padding:"7px 0",
                  borderBottom:i<cond.lines.length-1?`1px solid ${cond.color}20`:"none" }}>
                  <div style={{ minWidth:120,flexShrink:0 }}>
                    <span style={{ fontFamily:S.mono,fontSize:7.5,color:cond.color,
                      background:`${cond.color}18`,border:`1px solid ${cond.color}35`,
                      borderRadius:4,padding:"2px 6px" }}>{line.tier}</span>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:S.sans,fontWeight:600,fontSize:11.5,color:T.txt2 }}>{line.drug}</div>
                    {line.dur&&<div style={{ fontFamily:S.mono,fontSize:8,color:T.txt4,marginTop:2 }}>Duration: {line.dur}</div>}
                  </div>
                  <div style={{ textAlign:"right",flexShrink:0 }}>
                    {pd?<div style={{ fontFamily:S.mono,fontSize:13,fontWeight:700,color:cond.color }}>{pd}</div>
                    :<div style={{ fontFamily:S.mono,fontSize:9,color:T.txt3 }}>{line.freq}</div>}
                  </div>
                </div>
              );
            })}
            <div style={{ marginTop:9,padding:"6px 9px",borderRadius:7,
              background:`${cond.color}08`,border:`1px solid ${cond.color}22` }}>
              <span style={{ fontFamily:S.mono,fontSize:7.5,color:cond.color }}>RETURN PRECAUTIONS  </span>
              <span style={{ fontFamily:S.sans,fontSize:10.5,color:T.txt3,lineHeight:1.6 }}>{cond.note}</span>
            </div>
          </div>}
        </>}
        {abxPill==="iv"&&(wt>0?<>
          <Card color={T.red} title="Neonatal — Nelson's / AAP Red Book 2024">
            <DrugSection title="Neonatal Sepsis / HSV" color={T.red} drugs={neonAbx} wtCalc />
          </Card>
          <Card color={T.coral} title="Broad-Spectrum / Gram-Negative">
            <DrugSection title="Beta-Lactams & Carbapenems" color={T.coral} drugs={broadAbx} wtCalc />
          </Card>
          <Card color={T.orange} title="Anti-MRSA / Resistant">
            <DrugSection title="MRSA Coverage" color={T.orange} drugs={mrsaAbx} wtCalc />
          </Card>
        </>:nWt)}
        {abxPill==="po"&&<Card color={T.coral} title="Oral Discharge Antibiotics — Nelson's / AAP Red Book 2024">
          {DISCHARGE_ABX.map((d,i)=>{
            const pd=wt>0?calcDose(wt,d.mpkDose,d.max):null;
            return(
              <div key={i} style={{ display:"flex",alignItems:"flex-start",gap:10,padding:"8px 0",
                borderBottom:i<DISCHARGE_ABX.length-1?"1px solid rgba(20,80,70,0.22)":"none" }}>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontFamily:S.sans,fontWeight:700,fontSize:11.5,color:T.txt2 }}>{d.name}</div>
                  <div style={{ fontFamily:S.mono,fontSize:8.5,color:T.txt4,marginTop:1 }}>{d.dose}</div>
                  <div style={{ fontFamily:S.sans,fontSize:10,color:T.txt4,marginTop:2,lineHeight:1.5 }}>{d.note}</div>
                </div>
                {pd&&<div style={{ textAlign:"right",flexShrink:0,minWidth:70 }}>
                  <div style={{ fontFamily:S.mono,fontSize:13,fontWeight:700,color:T.coral }}>{pd} mg</div>
                  <div style={{ fontFamily:S.mono,fontSize:8,color:T.txt4 }}>{d.freq}</div>
                </div>}
              </div>
            );
          })}
        </Card>}
      </>}

      {subTab==="analg"&&(wt>0?<>
        <Card color={T.purple} title="Opioid Analgesia">
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
        <Card color={T.blue} title="Corticosteroids">
          <DrugSection title="IV / PO Steroids" color={T.blue} drugs={steroids} wtCalc />
        </Card>
        <Card color={T.cyan} title="Bronchodilators & Respiratory">
          <DrugSection title="Asthma / Croup / Airway" color={T.cyan} drugs={resp} wtCalc />
        </Card>
      </>:nWt)}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SCORING
// ═══════════════════════════════════════════════════════════════════════════
const WESTLEY=[
  { key:"stridor",   label:"Stridor",       opts:[{v:0,l:"None"},{v:1,l:"With agitation"},{v:2,l:"At rest"}] },
  { key:"retract",   label:"Retractions",   opts:[{v:0,l:"None"},{v:1,l:"Mild"},{v:2,l:"Moderate"},{v:3,l:"Severe"}] },
  { key:"air",       label:"Air Entry",     opts:[{v:0,l:"Normal"},{v:1,l:"Decreased"},{v:2,l:"Markedly decreased"}] },
  { key:"cyanosis",  label:"Cyanosis",      opts:[{v:0,l:"None"},{v:4,l:"With agitation"},{v:5,l:"At rest"}] },
  { key:"conscious", label:"Consciousness", opts:[{v:0,l:"Normal"},{v:5,l:"Altered"}] },
];
const PRAM=[
  { key:"scalene",label:"Scalene Muscle Use",         opts:[{v:0,l:"Absent"},{v:2,l:"Present"}] },
  { key:"supra",  label:"Suprasternal Retractions",   opts:[{v:0,l:"Absent"},{v:2,l:"Present"}] },
  { key:"wheeze", label:"Wheeze",                     opts:[{v:0,l:"Absent"},{v:1,l:"Expiratory only"},{v:2,l:"Inspiratory + expiratory"},{v:3,l:"Audible / no air entry"}] },
  { key:"air",    label:"Air Entry",                  opts:[{v:0,l:"Normal"},{v:1,l:"Decreased at bases"},{v:2,l:"Widespread decrease"},{v:3,l:"Minimal / absent"}] },
  { key:"o2",     label:"O₂ Saturation",              opts:[{v:0,l:"≥ 95% on RA"},{v:1,l:"92–94% on RA"},{v:2,l:"< 92% on RA"}] },
];
const FLACC=[
  { key:"face",    label:"Face",          opts:[{v:0,l:"No expression / smile"},{v:1,l:"Occasional grimace"},{v:2,l:"Frequent grimace / jaw clench"}] },
  { key:"legs",    label:"Legs",          opts:[{v:0,l:"Normal / relaxed"},{v:1,l:"Uneasy / tense"},{v:2,l:"Kicking / drawn up"}] },
  { key:"activ",   label:"Activity",      opts:[{v:0,l:"Lying quietly"},{v:1,l:"Squirming / tense"},{v:2,l:"Arched / rigid / jerking"}] },
  { key:"cry",     label:"Cry",           opts:[{v:0,l:"No cry"},{v:1,l:"Moans / whimpers"},{v:2,l:"Crying steadily"}] },
  { key:"console", label:"Consolability", opts:[{v:0,l:"Content / relaxed"},{v:1,l:"Reassured by touch"},{v:2,l:"Difficult to console"}] },
];
const CDS=[
  { key:"general", label:"General Appearance",  opts:[{v:0,l:"Normal"},{v:1,l:"Thirsty / restless"},{v:2,l:"Drowsy / limp"}] },
  { key:"eyes",    label:"Eyes",                 opts:[{v:0,l:"Normal"},{v:1,l:"Slightly sunken"},{v:2,l:"Very sunken / no tears"}] },
  { key:"mucosa",  label:"Mucous Membranes",     opts:[{v:0,l:"Moist"},{v:1,l:"Sticky"},{v:2,l:"Dry"}] },
  { key:"tears",   label:"Tears",                opts:[{v:0,l:"Present with crying"},{v:1,l:"Decreased"},{v:2,l:"Absent"}] },
];

function ScoringTab({ globalWt }) {
  const [ws,setWs]=useState({}); const [pram,setPram]=useState({});
  const [flacc,setFlacc]=useState({}); const [cds,setCds]=useState({});
  const score=obj=>Object.values(obj).reduce((s,v)=>s+(v||0),0);
  const wsT=score(ws); const pramT=score(pram); const flaccT=score(flacc); const cdsT=score(cds);
  const wsSet=Object.keys(ws).length>0; const pramSet=Object.keys(pram).length>0;
  const flaccSet=Object.keys(flacc).length>0; const cdsSet=Object.keys(cds).length>0;
  const wsStr=wsT<=2?{l:"Mild Croup",c:T.teal,tx:"Dexamethasone 0.6 mg/kg PO × 1 (max 10 mg). Discharge with return precautions."}
    :wsT<=5?{l:"Moderate Croup",c:T.gold,tx:"Dexamethasone 0.6 mg/kg PO/IM/IV. Racemic epi 0.5 mL 2.25% neb. Observe 2–4h post-epi."}
    :{l:"Severe Croup",c:T.coral,tx:"Racemic epi NOW + dexamethasone. Heliox 70:30 if available. ICU. Prepare intubation (smaller ETT)."};
  const pramStr=pramT<=4?{l:"Mild Asthma",c:T.teal,tx:"Albuterol 2–4 puffs MDI q20 min × 3 or 0.15 mg/kg neb. Discharge if SpO2 ≥95% after treatment."}
    :pramT<=8?{l:"Moderate Asthma",c:T.gold,tx:"Albuterol neb q20 min × 3 + ipratropium × 3. Dexamethasone 0.6 mg/kg PO. Observe ≥4h."}
    :{l:"Severe Asthma",c:T.coral,tx:"Continuous albuterol + ipratropium. Magnesium 25–75 mg/kg IV. Methylprednisolone IV. Consider ICU."};
  const flaccStr=flaccT<=3?{l:"Mild Pain (0–3)",c:T.teal,tx:"Non-pharmacologic comfort measures. Reassess after intervention."}
    :flaccT<=6?{l:"Moderate Pain (4–6)",c:T.gold,tx:"Ibuprofen/acetaminophen ± opioid. Reassess 30 min after analgesia."}
    :{l:"Severe Pain (7–10)",c:T.coral,tx:"IV/IN opioid. Consider ketamine for procedural pain. Reassess 15–30 min after analgesia."};
  const cdsStr=cdsT===0?{l:"No Clinically Detectable Dehydration",c:T.teal,tx:"Encourage PO fluids. Discharge with education on signs of dehydration."}
    :cdsT<=4?{l:"Some Dehydration (~3–6% deficit)",c:T.gold,tx:"ORS 50 mL/kg PO over 4h. If vomiting: ondansetron then ORS. IV if ORT fails."}
    :{l:"Severe Dehydration (> 6% deficit)",c:T.coral,tx:"IV resuscitation: 20 mL/kg NS bolus. Reassess. Replace deficit + maintenance IV over 24h."};

  return (
    <div className="peds-in">
      <Card color={T.teal} title="Westley Croup Score">
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10 }}>
          <div style={{ fontFamily:S.sans,fontSize:10,color:T.txt4 }}>Total 0–17. ≤2 mild · 3–5 moderate · ≥6 severe</div>
          <div style={{ fontFamily:S.serif,fontSize:44,fontWeight:900,color:wsSet?wsStr.c:T.txt4,lineHeight:1 }}>{wsT}</div>
        </div>
        <ScoreWidget items={WESTLEY} scores={ws} setScores={setWs} color={T.teal} />
        {wsSet&&<div style={{ padding:"10px 13px",borderRadius:9,background:`${wsStr.c}09`,border:`1px solid ${wsStr.c}35` }}>
          <div style={{ fontFamily:S.serif,fontWeight:700,fontSize:16,color:wsStr.c,marginBottom:4 }}>{wsStr.l} (Score {wsT})</div>
          <div style={{ fontFamily:S.sans,fontSize:11,color:T.txt2,lineHeight:1.6 }}>{wsStr.tx}</div>
        </div>}
      </Card>

      <Card color={T.blue} title="PRAM Asthma Score (Pediatric Respiratory Assessment Measure)">
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10 }}>
          <div style={{ fontFamily:S.sans,fontSize:10,color:T.txt4 }}>Total 0–12. ≤4 mild · 5–8 moderate · 9–12 severe</div>
          <div style={{ fontFamily:S.serif,fontSize:44,fontWeight:900,color:pramSet?pramStr.c:T.txt4,lineHeight:1 }}>{pramT}</div>
        </div>
        <ScoreWidget items={PRAM} scores={pram} setScores={setPram} color={T.blue} />
        {pramSet&&<div style={{ padding:"10px 13px",borderRadius:9,background:`${pramStr.c}09`,border:`1px solid ${pramStr.c}35` }}>
          <div style={{ fontFamily:S.serif,fontWeight:700,fontSize:16,color:pramStr.c,marginBottom:4 }}>{pramStr.l} (Score {pramT})</div>
          <div style={{ fontFamily:S.sans,fontSize:11,color:T.txt2,lineHeight:1.6 }}>{pramStr.tx}</div>
        </div>}
      </Card>

      <Card color={T.purple} title="FLACC Pain Scale (< 3 years / non-verbal / cognitively impaired)">
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10 }}>
          <div style={{ fontFamily:S.sans,fontSize:10,color:T.txt4 }}>Total 0–10. 0 = no pain · 1–3 mild · 4–6 moderate · 7–10 severe</div>
          <div style={{ fontFamily:S.serif,fontSize:44,fontWeight:900,color:flaccSet?flaccStr.c:T.txt4,lineHeight:1 }}>{flaccT}</div>
        </div>
        <ScoreWidget items={FLACC} scores={flacc} setScores={setFlacc} color={T.purple} />
        {flaccSet&&<div style={{ padding:"10px 13px",borderRadius:9,background:`${flaccStr.c}09`,border:`1px solid ${flaccStr.c}35` }}>
          <div style={{ fontFamily:S.serif,fontWeight:700,fontSize:16,color:flaccStr.c,marginBottom:4 }}>{flaccStr.l}</div>
          <div style={{ fontFamily:S.sans,fontSize:11,color:T.txt2,lineHeight:1.6 }}>{flaccStr.tx}</div>
        </div>}
      </Card>

      <Card color={T.gold} title="Clinical Dehydration Scale (CDS — Goldman 2008)">
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10 }}>
          <div style={{ fontFamily:S.sans,fontSize:10,color:T.txt4 }}>Total 0–8. 0 = no dehydration · 1–4 some (~3–6%) · 5–8 severe ({">"}6%)</div>
          <div style={{ fontFamily:S.serif,fontSize:44,fontWeight:900,color:cdsSet?cdsStr.c:T.txt4,lineHeight:1 }}>{cdsT}</div>
        </div>
        <ScoreWidget items={CDS} scores={cds} setScores={setCds} color={T.gold} />
        {cdsSet&&<div style={{ padding:"10px 13px",borderRadius:9,background:`${cdsStr.c}09`,border:`1px solid ${cdsStr.c}35` }}>
          <div style={{ fontFamily:S.serif,fontWeight:700,fontSize:16,color:cdsStr.c,marginBottom:4 }}>{cdsStr.l}</div>
          <div style={{ fontFamily:S.sans,fontSize:11,color:T.txt2,lineHeight:1.6 }}>{cdsStr.tx}</div>
        </div>}
      </Card>

      <Card color={T.coral} title="APGAR Score Reference">
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%",borderCollapse:"collapse",fontFamily:S.mono,fontSize:9 }}>
            <thead><tr style={{ borderBottom:"1px solid rgba(255,92,92,0.3)" }}>
              {["Sign","0","1","2"].map(h=><th key={h} style={{ padding:"5px 8px",textAlign:"left",color:T.coral,fontWeight:700 }}>{h}</th>)}
            </tr></thead>
            <tbody>{[
              ["Appearance","Blue/pale all over","Blue extremities only","Pink all over"],
              ["Pulse","Absent","< 100 bpm","≥ 100 bpm"],
              ["Grimace","No response","Grimace","Cry or cough/sneeze"],
              ["Activity","Limp","Some flexion","Active motion"],
              ["Respiration","Absent","Weak/irregular","Strong cry"],
            ].map((r,i)=>(
              <tr key={i} style={{ borderBottom:"1px solid rgba(20,80,70,0.2)" }}>
                <td style={{ padding:"5px 8px",color:T.coral,fontWeight:700 }}>{r[0]}</td>
                <td style={{ padding:"5px 8px",color:T.txt3 }}>{r[1]}</td>
                <td style={{ padding:"5px 8px",color:T.txt2 }}>{r[2]}</td>
                <td style={{ padding:"5px 8px",color:T.mint }}>{r[3]}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={{ marginTop:8,fontFamily:S.sans,fontSize:10.5,color:T.txt3,lineHeight:1.6 }}>
          Score at 1 min and 5 min. 7–10 = normal · 4–6 = moderate depression (stimulate, O₂, reassess) · 0–3 = severe (immediate resuscitation)
        </div>
      </Card>

      <Card color={T.gold} title="Febrile Seizure — AAP 2011 / 2022 Update">
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10 }}>
          {[{l:"Simple Febrile Seizure",c:T.teal,items:["Generalized (tonic-clonic)","Duration < 15 minutes","Single seizure in 24h","Age 6 months – 5 years","Full recovery to baseline","No prior CNS abnormality"]},
            {l:"Complex Febrile Seizure",c:T.coral,items:["Focal onset or focal features","Duration ≥ 15 minutes","Recurs within 24h","Any age outside 6m–5y","Prolonged postictal state","Todd's paralysis"]}].map(s=>(
            <div key={s.l} style={{ padding:"9px 10px",borderRadius:8,background:`${s.c}08`,border:`1px solid ${s.c}28` }}>
              <div style={{ fontFamily:S.mono,fontSize:8,fontWeight:700,color:s.c,letterSpacing:1,marginBottom:6 }}>{s.l}</div>
              {s.items.map((item,i)=>(
                <div key={i} style={{ display:"flex",gap:5,marginBottom:3 }}>
                  <span style={{ color:s.c,fontSize:7,marginTop:3 }}>▸</span>
                  <span style={{ fontFamily:S.sans,fontSize:10.5,color:T.txt2 }}>{item}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        {[["Workup — Simple",T.teal,["LP NOT required for simple febrile seizure in vaccinated child ≥ 6 months (AAP 2011)","LP: strongly consider if < 12 months, unvaccinated, or ill-appearing after seizure resolves","Source of fever: UA, CBC as clinically indicated — LP NOT routine","EEG: not indicated in uncomplicated first simple febrile seizure","Neuroimaging: not routinely indicated — reserve for focal features, abnormal neuro exam"]],
          ["Management & Discharge",T.gold,["Treat underlying fever source. Antipyretics do NOT prevent recurrence.","Recurrence rate: 30–35% overall; 50% if first FS < 12 months","Prophylactic anticonvulsants NOT recommended for simple febrile seizures","Discharge if: returned to baseline, fever source identified, reliable caregiver, good follow-up","Return precautions: seizure > 5 min, focal features, not returning to baseline within 1–2h, recurrence"]]].map(([title,color,items])=>(
          <div key={title} style={{ marginBottom:8,padding:"8px 10px",borderRadius:8,
            background:`${color}08`,border:`1px solid ${color}25` }}>
            <div style={{ fontFamily:S.mono,fontSize:7.5,color,letterSpacing:1.2,
              textTransform:"uppercase",marginBottom:6 }}>{title}</div>
            {items.map((a,i)=><Bullet key={i} text={a} color={color} />)}
          </div>
        ))}
      </Card>

      <Card color={T.orange} title="Pediatric Appendicitis Score (PAS — Samuel 2002)">
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:6 }}>
          {[["Nausea / vomiting",1],["Anorexia",1],["Fever > 38°C",1],
            ["Cough / hop / percussion RLQ tenderness",2],["RLQ tenderness",2],
            ["Migration of pain to RLQ",1],["Leukocytosis > 10,000",1],["Leukocyte left shift (PMN > 75%)",1]].map(([l,p],i)=>(
            <div key={i} style={{ padding:"7px 9px",borderRadius:7,background:"rgba(255,159,67,0.07)",
              border:"1px solid rgba(255,159,67,0.22)",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <span style={{ fontFamily:S.sans,fontSize:10.5,color:T.txt2 }}>{l}</span>
              <span style={{ fontFamily:S.mono,fontSize:11,fontWeight:700,color:T.orange }}>+{p}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop:8,padding:"7px 10px",borderRadius:7,background:"rgba(6,20,25,0.6)",
          border:"1px solid rgba(20,80,70,0.35)",fontFamily:S.sans,fontSize:10.5,color:T.txt3,lineHeight:1.55 }}>
          <strong style={{ color:T.teal }}>≤ 3:</strong> Low risk — discharge with precautions{" · "}
          <strong style={{ color:T.gold }}>4–6:</strong> US first — intermediate{" · "}
          <strong style={{ color:T.coral }}>≥ 7:</strong> Surgical consult (PPV ~72%)
        </div>
      </Card>

      <Card color={T.blue} title="Bronchiolitis Severity — AAP 2014">
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7 }}>
          {[{l:"Mild",c:T.teal,items:["SpO2 ≥ 95% on RA","Minimal retractions","Good air entry","Alert, tolerating feeds"]},
            {l:"Moderate",c:T.gold,items:["SpO2 90–94% on RA","Moderate retractions","Decreased air entry","Mildly reduced PO"]},
            {l:"Severe",c:T.coral,items:["SpO2 < 90% on RA","Severe retractions","Nasal flaring / grunting","Not tolerating PO"]}].map(s=>(
            <div key={s.l} style={{ padding:"8px 10px",borderRadius:8,background:`${s.c}08`,border:`1px solid ${s.c}28` }}>
              <div style={{ fontFamily:S.mono,fontSize:9,fontWeight:700,color:s.c,marginBottom:5 }}>{s.l}</div>
              {s.items.map((item,i)=>(
                <div key={i} style={{ display:"flex",gap:5,marginBottom:3 }}>
                  <span style={{ color:s.c,fontSize:7,marginTop:3 }}>▸</span>
                  <span style={{ fontFamily:S.sans,fontSize:10,color:T.txt3 }}>{item}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ marginTop:8,padding:"7px 10px",borderRadius:7,background:"rgba(77,166,255,0.07)",border:"1px solid rgba(77,166,255,0.25)" }}>
          <Bullet text="AAP 2014: High-flow NC O₂, NG feeds — supportive care only for most" color={T.blue} />
          <Bullet text="Albuterol, epinephrine, steroids, antibiotics: NOT recommended routinely" color={T.blue} />
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CLINICAL TOOLS
// ═══════════════════════════════════════════════════════════════════════════
const TOOLS_TABS = [
  { id:"fluids",label:"DKA / Burns", color:T.gold   },
  { id:"tox",   label:"Toxicology",  color:T.coral  },
  { id:"sepsis",label:"Sepsis",      color:T.orange },
  { id:"proc",  label:"Procedures",  color:T.purple },
];
const SIRS_AGES = [
  { age:"< 1 week",     hr:">180 or <100",rr:">50", wbc:">34,000", temp:"38.0–38.4 or <36" },
  { age:"1 wk – 1 mo",  hr:">180 or <100",rr:">40", wbc:">19,500 or <5,000",temp:"≥38.5 or <36" },
  { age:"1 mo – 1 yr",  hr:">180 or <90", rr:">34", wbc:">17,500 or <5,000",temp:"≥38.5 or <36" },
  { age:"2–5 years",    hr:">140",        rr:">22", wbc:">15,500 or <6,000",temp:"≥38.5 or <36" },
  { age:"6–12 years",   hr:">130",        rr:">18", wbc:">13,500 or <4,500",temp:"≥38.5 or <36" },
  { age:"13–18 years",  hr:">110",        rr:">14", wbc:">11,000 or <4,500",temp:"≥38.5 or <36" },
];
const ANTIDOTES = [
  { toxin:"Opioids",         antidote:"Naloxone",      dose:"0.01 mg/kg IV/IM/IN (max 2 mg); repeat q2–3 min" },
  { toxin:"Benzodiazepines", antidote:"Flumazenil",    dose:"0.01 mg/kg IV (max 0.2 mg); caution — may precipitate seizures in dependent patients" },
  { toxin:"Organophosphates",antidote:"Atropine",      dose:"0.02–0.05 mg/kg IV q5–10 min until secretions dry; no maximum" },
  { toxin:"Acetaminophen",   antidote:"NAC",           dose:"150 mg/kg IV ×1h → 50 mg/kg ×4h → 100 mg/kg ×16h (21-hour protocol)" },
  { toxin:"Iron",            antidote:"Deferoxamine",  dose:"15 mg/kg/hr IV (max 6 g/day); stop when urine clears (vin rosé sign)" },
  { toxin:"Isoniazid (INH)", antidote:"Pyridoxine",    dose:"1 mg per mg INH ingested (max 5 g); 70 mg/kg if dose unknown" },
  { toxin:"Methemoglobin",   antidote:"Methylene blue",dose:"1–2 mg/kg IV over 5 min; may repeat once" },
  { toxin:"Methanol / EG",   antidote:"Fomepizole",   dose:"15 mg/kg IV load; call Poison Control for maintenance dosing" },
  { toxin:"CCB / hyperK",    antidote:"Calcium chloride",dose:"20 mg/kg IV (max 2 g); may repeat. Central line preferred." },
  { toxin:"Digoxin",         antidote:"Digoxin Fab",   dose:"Empiric: 10 vials IV. Specific: vials = (serum dig × wt kg) / 100" },
];
function ToolsTab({ globalWt }) {
  const [toolTab,setToolTab]=useState("fluids");
  const [dkaPct,setDkaPct]=useState(""); const [tbsaPct,setTbsaPct]=useState("");
  const wt=parseFloat(globalWt)||0;
  const dkaPctN=parseFloat(dkaPct)||0; const tbsaN=parseFloat(tbsaPct)||0;
  const deficitMl=wt>0&&dkaPctN>0?(wt*dkaPctN*10).toFixed(0):null;
  const maint48=wt>0?(wt<=10?wt*4*48:wt<=20?(40+(wt-10)*2)*48:(60+(wt-20))*48).toFixed(0):null;
  const totalDka=deficitMl&&maint48?(parseInt(deficitMl)+parseInt(maint48)).toFixed(0):null;
  const dkaRate=totalDka?(parseInt(totalDka)/48).toFixed(0):null;
  const parkland=wt>0&&tbsaN>0?(4*wt*tbsaN).toFixed(0):null;
  const park8h=parkland?(parseInt(parkland)/2).toFixed(0):null;
  return (
    <div className="peds-in">
      <div style={{ display:"flex",gap:4,flexWrap:"wrap",padding:"5px",marginBottom:12,
        background:"rgba(6,20,25,0.7)",border:"1px solid rgba(20,80,70,0.35)",borderRadius:10 }}>
        {TOOLS_TABS.map(t=>(
          <button key={t.id} onClick={()=>setToolTab(t.id)}
            style={{ flex:1,padding:"7px 10px",borderRadius:7,cursor:"pointer",
              fontFamily:S.sans,fontWeight:600,fontSize:11,
              border:`1px solid ${toolTab===t.id?t.color+"66":"rgba(20,80,70,0.4)"}`,
              background:toolTab===t.id?`${t.color}14`:"transparent",
              color:toolTab===t.id?t.color:T.txt4 }}>{t.label}</button>
        ))}
      </div>

      {toolTab==="fluids"&&<>
        <Card color={T.gold} title="Pediatric DKA Management">
          <div style={{ fontFamily:S.sans,fontSize:10.5,color:T.txt3,lineHeight:1.65,marginBottom:10 }}>
            DKA: glucose {">"} 200 + pH {"<"} 7.30 + HCO3 {"<"} 15 + ketonuria/ketonemia
          </div>
          {wt>0&&<div style={{ marginBottom:10 }}>
            <div style={{ fontFamily:S.mono,fontSize:8,color:T.txt4,letterSpacing:1.3,textTransform:"uppercase",marginBottom:4 }}>Estimated Dehydration (% body weight)</div>
            <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
              {[["5%","5"],["7%","7"],["10%","10"]].map(([l,v])=>(
                <button key={v} onClick={()=>setDkaPct(dkaPct===v?"":v)}
                  style={{ padding:"8px 14px",borderRadius:7,cursor:"pointer",fontFamily:S.sans,fontWeight:600,fontSize:11,
                    border:`1px solid ${dkaPct===v?T.gold+"66":"rgba(20,80,70,0.4)"}`,
                    background:dkaPct===v?`${T.gold}14`:"transparent",color:dkaPct===v?T.gold:T.txt4 }}>
                  {l} {dkaPct===v&&wt>0?`(${(wt*parseFloat(v)*10).toFixed(0)} mL)`:""}</button>
              ))}
            </div>
            {deficitMl&&<div style={{ marginTop:10,padding:"10px 12px",borderRadius:9,background:"rgba(245,200,66,0.08)",border:"1px solid rgba(245,200,66,0.3)" }}>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:8 }}>
                {[["Fluid Deficit",`${deficitMl} mL`],["48h Maintenance",`${maint48} mL`],["Total IV Fluids",`${totalDka} mL`],["Starting Rate",`${dkaRate} mL/hr`]].map(([l,v])=>(
                  <div key={l} style={{ textAlign:"center" }}>
                    <div style={{ fontFamily:S.mono,fontSize:8,color:T.txt4 }}>{l}</div>
                    <div style={{ fontFamily:S.serif,fontSize:22,fontWeight:700,color:T.gold }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>}
          </div>}
          {[["Critical DKA Principles",T.coral,["NO fluid bolus in moderate/severe DKA unless hemodynamically unstable (cerebral edema risk)","Use 0.9% NS or LR. Add dextrose when glucose < 250–300 mg/dL (use 2-bag system).","Insulin drip: 0.05–0.1 units/kg/hr IV — NO loading bolus. Start after first hour of fluids.","K+ > 5.5: hold replacement · 3.5–5.5: add 40 mEq/L · < 3.5: stop insulin, give 60–80 mEq/L"]],
            ["Cerebral Edema — Act Immediately",T.orange,["Signs: headache, bradycardia, hypertension, declining GCS, pupil changes — 0.5–1% of peds DKA","3% NaCl 3–5 mL/kg IV over 30 min OR mannitol 0.5–1 g/kg IV — give immediately","HOB 30°, restrict IVF, neurosurgery consult, ICU transfer"]]].map(([title,color,items])=>(
            <div key={title} style={{ marginBottom:8,padding:"9px 11px",borderRadius:9,background:`${color}08`,border:`1px solid ${color}30` }}>
              <div style={{ fontFamily:S.mono,fontSize:8,color,letterSpacing:1,textTransform:"uppercase",marginBottom:6 }}>{title}</div>
              {items.map((a,i)=><Bullet key={i} text={a} color={color} />)}
            </div>
          ))}
        </Card>
        <Card color={T.orange} title="Burns — Fluid Resuscitation (Parkland Formula)">
          {wt>0&&<div style={{ marginBottom:10 }}>
            <div style={{ fontFamily:S.mono,fontSize:8,color:T.txt4,letterSpacing:1.3,textTransform:"uppercase",marginBottom:4 }}>TBSA (%) burned — exclude superficial / 1st degree</div>
            <div style={{ display:"flex",alignItems:"center",gap:10 }}>
              <input type="number" value={tbsaPct} onChange={e=>setTbsaPct(e.target.value)}
                style={{ width:80,padding:"8px 10px",background:"rgba(6,20,25,0.9)",
                  border:`1px solid ${tbsaPct?T.orange+"55":"rgba(20,80,70,0.4)"}`,
                  borderRadius:7,outline:"none",fontFamily:S.mono,fontSize:20,fontWeight:700,color:T.orange }} />
              <div style={{ fontFamily:S.sans,fontSize:11,color:T.txt4 }}>% TBSA</div>
            </div>
          </div>}
          {parkland&&<div style={{ padding:"10px 12px",borderRadius:9,marginBottom:10,background:"rgba(255,159,67,0.08)",border:"1px solid rgba(255,159,67,0.3)" }}>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:8,marginBottom:8 }}>
              {[["Total LR (24h)",`${parkland} mL`],["First 8h",`${park8h} mL`],["Next 16h",`${park8h} mL`],["Rate first 8h",`${(parseInt(park8h)/8).toFixed(0)} mL/hr`]].map(([l,v])=>(
                <div key={l} style={{ textAlign:"center" }}>
                  <div style={{ fontFamily:S.mono,fontSize:8,color:T.txt4 }}>{l}</div>
                  <div style={{ fontFamily:S.serif,fontSize:22,fontWeight:700,color:T.orange }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ fontFamily:S.sans,fontSize:10.5,color:T.txt3,lineHeight:1.6 }}>
              4 mL x %TBSA x weight(kg). Time 0 = time of burn, not arrival. Add maintenance IV for children {"<"} 30 kg.
            </div>
          </div>}
          <div style={{ padding:"9px 11px",borderRadius:8,background:"rgba(6,20,25,0.6)",border:"1px solid rgba(20,80,70,0.3)" }}>
            <div style={{ fontFamily:S.mono,fontSize:8,color:T.orange,letterSpacing:1,textTransform:"uppercase",marginBottom:6 }}>Pediatric TBSA — Modified Rule of Nines</div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,fontFamily:S.mono,fontSize:9 }}>
              {[["Head & neck","Infant 19% · 5y 13% · 10y 11%"],["Each arm","9% (all ages)"],["Anterior trunk","18%"],["Posterior trunk","18%"],["Each thigh","Infant 5.5% · 5y 6.5% · Adult 9%"],["Each lower leg","Infant 5% · 5y 5.5% · Adult 7%"]].map(([b,v])=>(
                <div key={b} style={{ display:"flex",justifyContent:"space-between",gap:8,padding:"3px 0",borderBottom:"1px solid rgba(20,80,70,0.15)" }}>
                  <span style={{ color:T.orange }}>{b}</span><span style={{ color:T.txt3 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </>}

      {toolTab==="tox"&&<>
        <div style={{ padding:"10px 13px",borderRadius:9,marginBottom:10,background:"rgba(255,92,92,0.1)",border:"1px solid rgba(255,92,92,0.4)" }}>
          <div style={{ fontFamily:S.mono,fontSize:9,fontWeight:700,color:T.coral,letterSpacing:1 }}>POISON CONTROL — 1-800-222-1222 (US) — Available 24/7 — Call for ALL complex ingestions</div>
        </div>
        <Card color={T.coral} title="Acetaminophen Overdose">
          {[["Rumack-Matthew Nomogram",T.coral,["Draw serum APAP at EXACTLY 4h post-ingestion. Earlier levels are unreliable.","Treatment threshold at 4h: APAP level > 150 mcg/mL plots above treatment line","Unknown/staggered ingestion time: treat if any detectable level AND symptomatic","Hepatotoxicity risk: > 150 mcg/mL at 4h · > 37.5 at 12h · > 9.4 at 24h"]],
            ["N-Acetylcysteine (NAC) — 21-Hour IV Protocol",T.orange,["Bag 1: 150 mg/kg IV over 60 min (max 15 g) — loading dose","Bag 2: 50 mg/kg IV over 4h (max 5 g)","Bag 3: 100 mg/kg IV over 16h (max 10 g)","Continue if INR > 1.5, AST rising, or clinical hepatotoxicity"]],
            ["Monitoring & Pearls",T.gold,["LFTs, INR, BMP, APAP level at 0h, 4h, 8h, and 24h minimum","Anaphylactoid reaction to NAC in ~10%: slow infusion, diphenhydramine, hold if severe","Oral NAC: 70 mg/kg q4h x 17 doses if IV not available (very nausea-inducing)"]]].map(([title,color,items])=>(
            <div key={title} style={{ marginBottom:8,padding:"8px 10px",borderRadius:8,background:`${color}08`,border:`1px solid ${color}25` }}>
              <div style={{ fontFamily:S.mono,fontSize:8,color,letterSpacing:1,textTransform:"uppercase",marginBottom:6 }}>{title}</div>
              {items.map((a,i)=><Bullet key={i} text={a} color={color} />)}
            </div>
          ))}
        </Card>
        <Card color={T.orange} title="Iron Ingestion">
          {wt>0&&<div style={{ padding:"9px 11px",borderRadius:8,marginBottom:8,background:"rgba(255,159,67,0.09)",border:"1px solid rgba(255,159,67,0.3)" }}>
            <div style={{ fontFamily:S.mono,fontSize:8,color:T.orange,letterSpacing:1,marginBottom:5 }}>ELEMENTAL IRON THRESHOLDS — {wt} kg patient</div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6 }}>
              {[["Nontoxic","< 20 mg/kg",`< ${Math.round(wt*20)} mg`,T.teal],["Moderate","20–60 mg/kg",`${Math.round(wt*20)}–${Math.round(wt*60)} mg`,T.gold],["Potentially fatal","> 60 mg/kg",`> ${Math.round(wt*60)} mg`,T.coral]].map(([tier,dose,calc,color])=>(
                <div key={tier} style={{ padding:"7px 8px",borderRadius:7,background:`${color}08`,border:`1px solid ${color}25`,textAlign:"center" }}>
                  <div style={{ fontFamily:S.mono,fontSize:7.5,color,marginBottom:2 }}>{tier}</div>
                  <div style={{ fontFamily:S.serif,fontSize:13,fontWeight:700,color }}>{calc}</div>
                  <div style={{ fontFamily:S.mono,fontSize:7,color:T.txt4 }}>{dose}</div>
                </div>
              ))}
            </div>
          </div>}
          <Bullet text="Elemental iron %: ferrous sulfate 20% — ferrous gluconate 12% — ferrous fumarate 33% — polysaccharide 100%" color={T.orange} />
          <Bullet text="Serum iron at 2–4h. Toxic level > 500 mcg/dL. TIBC no longer recommended for toxicity assessment." color={T.orange} />
          <Bullet text="Deferoxamine: 15 mg/kg/hr IV (max 6 g/day). Continue until urine clears (vin rose). Call Poison Control." color={T.orange} />
        </Card>
        <Card color={T.mint} title="Activated Charcoal">
          <Bullet text="Dose: 1 g/kg PO (max 50 g). Give within 1–2h of ingestion for best benefit." color={T.mint} />
          <Bullet text="Contraindications: caustics, hydrocarbons, metals (iron, lithium), alcohols — charcoal does NOT bind these." color={T.mint} />
          <Bullet text="Airway protection required before giving. Never in obtunded/unprotected airway." color={T.mint} />
          <Bullet text="Multi-dose (MDAC) for: theophylline, carbamazepine, dapsone, phenobarbital. 0.5 g/kg q4h x 3–4 doses." color={T.mint} />
        </Card>
        <Card color={T.purple} title="Antidotes Quick Reference">
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%",borderCollapse:"collapse",fontFamily:S.mono,fontSize:9 }}>
              <thead><tr style={{ borderBottom:"1px solid rgba(176,109,255,0.3)" }}>
                {["Toxin","Antidote","Dose / Notes"].map(h=><th key={h} style={{ padding:"5px 8px",textAlign:"left",color:T.purple,fontWeight:700 }}>{h}</th>)}
              </tr></thead>
              <tbody>{ANTIDOTES.map((r,i)=>(
                <tr key={i} style={{ borderBottom:"1px solid rgba(20,80,70,0.2)" }}>
                  <td style={{ padding:"5px 8px",color:T.coral,fontWeight:600,whiteSpace:"nowrap" }}>{r.toxin}</td>
                  <td style={{ padding:"5px 8px",color:T.mint,fontWeight:600,whiteSpace:"nowrap" }}>{r.antidote}</td>
                  <td style={{ padding:"5px 8px",color:T.txt3,lineHeight:1.5 }}>{r.dose}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </Card>
      </>}

      {toolTab==="sepsis"&&<>
        <Card color={T.orange} title="Pediatric Sepsis / Septic Shock — Surviving Sepsis 2020 / PALS">
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12 }}>
            {[{l:"SIRS",c:T.teal,d:"2+ criteria (1 must be temp or WBC abnormality)"},
              {l:"Sepsis",c:T.gold,d:"SIRS + suspected/confirmed infection — ABX within 1 hour"},
              {l:"Septic Shock",c:T.coral,d:"Sepsis + cardiovascular dysfunction despite fluid"}].map(s=>(
              <div key={s.l} style={{ padding:"8px 10px",borderRadius:8,background:`${s.c}09`,border:`1px solid ${s.c}30` }}>
                <div style={{ fontFamily:S.mono,fontSize:9,fontWeight:700,color:s.c,marginBottom:4 }}>{s.l}</div>
                <div style={{ fontFamily:S.sans,fontSize:10,color:T.txt3,lineHeight:1.5 }}>{s.d}</div>
              </div>
            ))}
          </div>
          <div style={{ fontFamily:S.mono,fontSize:8,color:T.orange,letterSpacing:1.2,textTransform:"uppercase",marginBottom:8 }}>Age-Specific SIRS Criteria</div>
          <div style={{ overflowX:"auto",marginBottom:12 }}>
            <table style={{ width:"100%",borderCollapse:"collapse",fontFamily:S.mono,fontSize:8.5 }}>
              <thead><tr style={{ borderBottom:"1px solid rgba(255,159,67,0.35)" }}>
                {["Age","HR (bpm)","RR (/min)","WBC (x10^3)","Temp (C)"].map(h=>(
                  <th key={h} style={{ padding:"5px 8px",textAlign:"left",color:T.orange,fontWeight:700 }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>{SIRS_AGES.map((r,i)=>(
                <tr key={i} style={{ borderBottom:"1px solid rgba(20,80,70,0.18)" }}>
                  <td style={{ padding:"5px 8px",color:T.gold,fontWeight:600 }}>{r.age}</td>
                  <td style={{ padding:"5px 8px",color:T.txt2 }}>{r.hr}</td>
                  <td style={{ padding:"5px 8px",color:T.txt2 }}>{r.rr}</td>
                  <td style={{ padding:"5px 8px",color:T.txt2 }}>{r.wbc}</td>
                  <td style={{ padding:"5px 8px",color:T.txt2 }}>{r.temp}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          {[["Resuscitation Pathway",T.coral,["1. Airway / O2 / IV or IO access (IO if IV fails in 2 attempts)","2. Fluid: 20 mL/kg NS over 5–10 min. Reassess after each bolus.","3. Repeat up to 60 mL/kg total — STOP if crackles, hepatomegaly, or oxygen worsens","4. Blood cultures x 2 before antibiotics. Lactate, CBC, BMP, procalcitonin.","5. Empiric antibiotics within 1 hour of recognition. Source-directed selection below.","6. Vasopressors if unresponsive to 40–60 mL/kg: start epinephrine (cold) or norepinephrine (warm)"]],
            ["Empiric Antibiotics by Source",T.blue,["Unknown source: ceftriaxone 100 mg/kg IV (max 4 g) +/- vancomycin 15 mg/kg","Intra-abdominal: piperacillin-tazobactam 100 mg/kg IV q8h (max 4.5 g)","Meningitis: ceftriaxone 100 mg/kg IV + vancomycin + dexamethasone 0.15 mg/kg","Healthcare-associated / line infection: vancomycin + pip-tazo or meropenem","Neutropenic fever: cefepime 50 mg/kg IV q8h (max 2 g); add vancomycin for line/skin source"]],
            ["Vasopressor Selection",T.purple,["Cold shock (mottled, cool extremities, low CO): Epinephrine 0.05–1 mcg/kg/min IV","Warm shock (flushed, bounding, vasodilatory): Norepinephrine 0.05–2 mcg/kg/min IV","Refractory: vasopressin 0.0003–0.002 units/kg/min OR hydrocortisone 50 mg/m2 IV (adrenal crisis)","Target MAP > 65 mmHg (age-adjusted). Goal-directed therapy with PICU team."]]].map(([title,color,items])=>(
            <div key={title} style={{ marginBottom:8,padding:"9px 11px",borderRadius:9,background:`${color}08`,border:`1px solid ${color}28` }}>
              <div style={{ fontFamily:S.mono,fontSize:8,color,letterSpacing:1,textTransform:"uppercase",marginBottom:6 }}>{title}</div>
              {items.map((a,i)=><Bullet key={i} text={a} color={color} />)}
            </div>
          ))}
        </Card>
      </>}

      {toolTab==="proc"&&<>
        <Card color={T.red} title="Button Battery / Caustic Ingestion — EMERGENCY PROTOCOL">
          <div style={{ padding:"8px 10px",borderRadius:7,background:"rgba(255,61,61,0.1)",border:"1px solid rgba(255,61,61,0.35)",marginBottom:10 }}>
            <div style={{ fontFamily:S.mono,fontSize:9,fontWeight:700,color:T.red,letterSpacing:1 }}>ESOPHAGEAL BUTTON BATTERY = SURGICAL EMERGENCY — Remove within 2 hours</div>
          </div>
          {[["Localization",T.coral,["PA film: double halo / stacked coin sign. Lateral: step-off between cathode/anode layers.","20 mm 3V lithium disc — highest risk (OH- generation causes liquefactive necrosis within hours)","Esophageal location: emergency endoscopic removal regardless of symptoms or X-ray timing"]],
            ["Pre-Endoscopy (Esophageal Only)",T.orange,["Honey (12 months+): 10 mL PO every 10 min x 6 doses while en route to endoscopy","Sucralfate (>1y): 5 mL (2–10y) or 10 mL (>10y) q30 min x 3 doses pre-endoscopy only","NEVER induce vomiting. NPO otherwise. Contact GI/surgery immediately."]],
            ["Gastric / Intestinal",T.gold,["Asymptomatic: serial radiographs. If not passed in 10–14 days, consider endoscopic retrieval.","Fever, abdominal pain, hematemesis, or melena = immediate removal","Battery + magnet co-ingestion: urgent surgical/endoscopic removal regardless of location"]]].map(([title,color,items])=>(
            <div key={title} style={{ marginBottom:8,padding:"9px 11px",borderRadius:9,background:`${color}08`,border:`1px solid ${color}30` }}>
              <div style={{ fontFamily:S.mono,fontSize:8,color,letterSpacing:1,textTransform:"uppercase",marginBottom:6 }}>{title}</div>
              {items.map((a,i)=><Bullet key={i} text={a} color={color} />)}
            </div>
          ))}
        </Card>
        <Card color={T.coral} title="Non-Accidental Trauma (Child Abuse) — Suspicious Indicators">
          <div style={{ fontFamily:S.sans,fontSize:10.5,color:T.txt3,lineHeight:1.6,marginBottom:10 }}>
            No single finding is pathognomonic. Evaluate injury in context of developmental stage, history consistency, and overall presentation. Mandatory report to CPS — not optional.
          </div>
          {[["High-Specificity Fractures",T.coral,["Classic metaphyseal lesions (CML / bucket-handle fractures) — require high torsional force, highly specific for NAT","Posterior rib fractures — require forceful anterior-posterior compression; rarely accidental in infants","Multiple fractures at different stages of healing without a clear, consistent explanation","Vertebral compression or spinous process fractures in pre-ambulatory infants"]],
            ["Soft Tissue & Pattern Findings",T.orange,["Bruising in non-mobile infants: 'Those who don't cruise don't bruise' (AAP 2014)","Patterned bruising matching implements (loop cord, belt buckle); bruising over torso/ears/neck in infants","Burns: sharply demarcated margins, stocking/glove distribution (forced immersion), or cigarette marks","Injuries inconsistent with developmental milestone (e.g., spiral femur fracture in pre-walker)"]],
            ["Workup — Suspected NAT",T.purple,["Skeletal survey (2-view, full): ALL children < 2y with suspected abuse — includes all long bones, ribs, skull, spine","Ophthalmology consult: retinal hemorrhages — any infant with unexplained AMS, seizure, or head injury","Head CT: unexplained AMS, seizure, fontanelle bulge, or any infant with suspicious injury","Labs: CBC, PT/PTT, LFTs, lipase, UA — screen for occult abdominal/bleeding injuries","Document objectively. Report to CPS. Notify child abuse team if available."]]].map(([title,color,items])=>(
            <div key={title} style={{ marginBottom:8,padding:"9px 11px",borderRadius:9,background:`${color}08`,border:`1px solid ${color}28` }}>
              <div style={{ fontFamily:S.mono,fontSize:8,color,letterSpacing:1,textTransform:"uppercase",marginBottom:6 }}>{title}</div>
              {items.map((a,i)=><Bullet key={i} text={a} color={color} />)}
            </div>
          ))}
        </Card>
        <Card color={T.blue} title="NRP — Neonatal Resuscitation (AAP/AHA 2021)">
          {[["Initial Assessment (30 Seconds)",T.blue,["Warm, dry, stimulate. Term? Good tone? Breathing/crying? — All YES = routine care","Any NO: move to warmer, position/clear airway, dry and stimulate, then assess HR","HR by EKG leads or pulse oximetry. Auscultation unreliable for decision-making."]],
            ["Positive Pressure Ventilation",T.teal,["HR < 100 bpm OR apnea/gasping after stimulation → start PPV immediately","Rate: 40–60 breaths/min. Initial FiO2: term 21%, preterm 21–30%.","If no chest rise: MR SOPA — Mask/Reposition, Suction, Open mouth, Pressure up, Airway (ETT or LMA)"]],
            ["Chest Compressions + Medications",T.coral,["HR < 60 bpm despite 30 sec effective PPV → chest compressions","2-thumb encircling hands. Depth: 1/3 AP diameter. Ratio: 3 compressions : 1 breath (90/30/min). FiO2 100%.","Epinephrine: 0.01–0.03 mg/kg IV/UVC (preferred) or ETT (not recommended) q3–5 min","Volume (if hypovolemia): NS 10 mL/kg IV over 5–10 min. Naloxone NOT first-line (PPV is priority)"]]].map(([title,color,items])=>(
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


// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════
export default function PediatricHub({ embedded = false }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState("vitals");
  const [globalWt, setGlobalWt] = useState("");

  useEffect(() => { injectPedsStyles(); }, []);

  return (
    <div style={{ fontFamily:S.sans,background:embedded?"transparent":T.bg,
      minHeight:embedded?"auto":"100vh",color:T.txt }}>
      <div style={{ maxWidth:900,margin:"0 auto",padding:embedded?"0":"0 16px" }}>
        {!embedded&&<div style={{ padding:"18px 0 14px" }}>
          <button onClick={()=>navigate("/hub")}
            style={{ marginBottom:10,display:"inline-flex",alignItems:"center",gap:7,
              fontFamily:S.sans,fontSize:12,fontWeight:600,padding:"5px 14px",borderRadius:8,
              background:"rgba(3,13,15,0.8)",border:"1px solid rgba(20,80,70,0.5)",
              color:T.txt3,cursor:"pointer" }}>
            ← Back to Hub
          </button>
          <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:8 }}>
            <div style={{ background:"rgba(3,13,15,0.95)",border:"1px solid rgba(20,80,70,0.6)",
              borderRadius:10,padding:"5px 12px",display:"flex",alignItems:"center",gap:8 }}>
              <span style={{ fontFamily:S.mono,fontSize:10,color:T.mint,letterSpacing:3 }}>NOTRYA</span>
              <span style={{ color:T.txt4,fontFamily:S.mono,fontSize:10 }}>/</span>
              <span style={{ fontFamily:S.mono,fontSize:10,color:T.txt3,letterSpacing:2 }}>PEDS</span>
            </div>
            <div style={{ height:1,flex:1,background:"linear-gradient(90deg,rgba(61,255,160,0.5),transparent)" }} />
          </div>
          <h1 className="shimmer-peds" style={{ fontFamily:S.serif,
            fontSize:"clamp(22px,4vw,38px)",fontWeight:900,letterSpacing:-0.5,lineHeight:1.1 }}>
            Pediatric Emergency Hub
          </h1>
          {globalWt&&<div style={{ display:"inline-flex",alignItems:"center",gap:6,marginTop:6,
            padding:"4px 12px",borderRadius:7,background:"rgba(61,255,160,0.08)",
            border:"1px solid rgba(61,255,160,0.3)" }}>
            <span style={{ fontFamily:S.mono,fontSize:9,color:T.txt4,letterSpacing:1 }}>ACTIVE WEIGHT</span>
            <span style={{ fontFamily:S.mono,fontSize:14,fontWeight:700,color:T.green }}>{globalWt} kg</span>
          </div>}
          <p style={{ fontFamily:S.sans,fontSize:11,color:T.txt4,marginTop:6 }}>
            Broselow · Vitals · PECARN · Peds GCS · Fever / Rochester · PALS Resus · ETT Sizing ·
            Holliday-Segar · Seizure Protocol · Antibiotics By Condition · Discharge Antibiotics ·
            PRAM · FLACC · APGAR · Dehydration · DKA · Burns · Button Battery
          </p>
        </div>}

        {globalWt&&embedded&&<div style={{ display:"inline-flex",alignItems:"center",gap:6,marginBottom:8,
          padding:"4px 12px",borderRadius:7,background:"rgba(61,255,160,0.08)",
          border:"1px solid rgba(61,255,160,0.3)" }}>
          <span style={{ fontFamily:S.mono,fontSize:9,color:T.txt4,letterSpacing:1 }}>ACTIVE WEIGHT</span>
          <span style={{ fontFamily:S.mono,fontSize:14,fontWeight:700,color:T.green }}>{globalWt} kg</span>
        </div>}

        <div style={{ display:"flex",gap:4,flexWrap:"wrap",padding:"6px",marginBottom:14,
          background:"rgba(6,20,25,0.85)",border:"1px solid rgba(20,80,70,0.4)",borderRadius:12 }}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{ display:"flex",alignItems:"center",gap:5,padding:"7px 10px",
                borderRadius:9,cursor:"pointer",flex:1,justifyContent:"center",
                fontFamily:S.sans,fontWeight:600,fontSize:11,
                border:`1px solid ${tab===t.id?t.color+"77":"rgba(20,80,70,0.5)"}`,
                background:tab===t.id?`${t.color}14`:"transparent",
                color:tab===t.id?t.color:T.txt4 }}>
              <span style={{ fontSize:12 }}>{t.icon}</span>
              <span>{t.label}</span>
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