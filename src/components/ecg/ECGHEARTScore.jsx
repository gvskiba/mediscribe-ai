// ECGHEARTScore.jsx — HEART Score for ED Chest Pain
import { useState } from "react";

const T = {
  txt:"#e8f0fe", txt2:"#aac8e8", txt3:"#90b8d4", txt4:"#6898b4",
  red:"#ff4444", orange:"#ff9f43", gold:"#f5c842",
  blue:"#3b9eff", purple:"#9b6dff", teal:"#00e5c0", coral:"#ff6b6b",
};
const glass = {backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",background:"rgba(8,22,40,0.72)",border:"1px solid rgba(26,53,85,0.75)",borderRadius:14};

const ITEMS = [
  {
    id:"history",label:"History",
    opts:[
      {pts:0,label:"Slightly suspicious",sub:"Nonspecific history, non-chest pain complaint, atypical features only"},
      {pts:1,label:"Moderately suspicious",sub:"Mix of typical and atypical features"},
      {pts:2,label:"Highly suspicious",sub:"Classic crushing substernal chest pain, radiation to arm/jaw, diaphoresis, exertional onset"},
    ]
  },
  {
    id:"ecg",label:"ECG",
    opts:[
      {pts:0,label:"Normal",sub:"No ST changes, no new LBBB, no pacemaker rhythm changes"},
      {pts:1,label:"Non-specific repolarization",sub:"LBBB (known old), LVH, early repolarization, nonspecific ST-T changes"},
      {pts:2,label:"Significant ST deviation",sub:"New ST depression ≥ 1mm, new ST elevation, new T inversion, new LBBB"},
    ]
  },
  {
    id:"age",label:"Age",
    opts:[
      {pts:0,label:"< 45 years",sub:"Low baseline risk"},
      {pts:1,label:"45–64 years",sub:"Intermediate baseline risk"},
      {pts:2,label:"≥ 65 years",sub:"High baseline risk"},
    ]
  },
  {
    id:"riskfactors",label:"Risk Factors",
    opts:[
      {pts:0,label:"No known risk factors",sub:"No HTN, DM, hypercholesterolemia, obesity (BMI > 30), smoking, FHx (1st degree < 65F / < 55M)"},
      {pts:1,label:"1–2 risk factors",sub:"One or two of the above risk factors present"},
      {pts:2,label:"≥ 3 risk factors OR known atherosclerotic disease",sub:"Prior MI/PCI/CABG, or ≥ 3 cardiovascular risk factors, or known CAD"},
    ]
  },
  {
    id:"troponin",label:"Troponin",
    opts:[
      {pts:0,label:"≤ Normal limit",sub:"Within laboratory reference range (use your lab's cutoff)"},
      {pts:1,label:"1–3× normal limit",sub:"Mildly elevated — may represent demand ischemia or NSTEMI"},
      {pts:2,label:"≥ 3× normal limit",sub:"Markedly elevated — high likelihood of ACS"},
    ]
  },
];

export default function ECGHEARTScore() {
  const [sel,setSel]=useState({});
  const score=Object.values(sel).reduce((s,v)=>s+v,0);
  const filled=Object.keys(sel).length===5;

  const tier=!filled?"incomplete":score<=3?"low":score<=6?"mod":"high";
  const tCol={low:T.teal,mod:T.gold,high:T.red,incomplete:T.txt4}[tier];
  const tLabel={low:"Low Risk",mod:"Moderate Risk",high:"High Risk",incomplete:"—"}[tier];
  const tAction={
    low:"HEART ≤ 3: 1.7-2.1% 30-day MACE. Early discharge pathway appropriate. Outpatient follow-up within 72h. Serial troponin at 0 and 3h. If hs-cTn negative × 2 + HEART ≤ 3 → discharge per your protocol.",
    mod:"HEART 4-6: 11-19% 30-day MACE. Admission for observation. Serial troponins. Stress testing or CT coronary angiography. Cardiology consult.",
    high:"HEART ≥ 7: 49-65% 30-day MACE. Urgent cardiology consultation. Early invasive strategy (cath within 24h). ACS protocol — ASA, heparin, consider P2Y12.",
    incomplete:""
  }[tier];

  return(
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <div style={{fontSize:11,color:T.txt3,lineHeight:1.55,padding:"10px 12px",borderRadius:8,background:"rgba(14,37,68,.4)",border:"1px solid rgba(26,53,85,.6)"}}>
        HEART Score is the most validated ED chest pain risk stratification tool. Predicts 30-day MACE (MI, PCI/CABG, death). Use with serial troponin for the highest accuracy.
      </div>

      {/* Score display */}
      {filled&&(
        <div style={{...glass,padding:"16px 18px",borderLeft:`5px solid ${tCol}`,background:`${tCol}0d`}}>
          <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:8}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:56,fontWeight:900,color:tCol,lineHeight:1}}>{score}</div>
            <div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:tCol,textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>{tLabel}</div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.txt3}}>30-day MACE: ~{score<=3?"1.7–2.1%":score<=6?"11–19%":"49–65%"}</div>
            </div>
          </div>
          <div style={{fontSize:11,color:T.txt,lineHeight:1.6}}>{tAction}</div>
        </div>
      )}

      {/* Item selectors */}
      {ITEMS.map(item=>(
        <div key={item.id} style={{...glass,padding:"12px 14px"}}>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.teal,textTransform:"uppercase",letterSpacing:1,fontWeight:700,marginBottom:8}}>{item.label}</div>
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            {item.opts.map(opt=>{
              const active=sel[item.id]===opt.pts;
              return(
                <div key={opt.pts} onClick={()=>setSel(p=>active?Object.fromEntries(Object.entries(p).filter(([k])=>k!==item.id)):{...p,[item.id]:opt.pts})}
                  style={{display:"flex",gap:10,alignItems:"flex-start",padding:"8px 10px",borderRadius:7,cursor:"pointer",background:active?"rgba(0,229,192,.07)":"rgba(14,37,68,.3)",border:`1px solid ${active?"rgba(0,229,192,.35)":"rgba(26,53,85,.5)"}`,transition:"all .1s"}}>
                  <div style={{width:18,height:18,borderRadius:4,flexShrink:0,border:`1.5px solid ${active?T.teal:"rgba(42,79,122,.6)"}`,background:active?"rgba(0,229,192,.2)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",marginTop:1}}>
                    {active&&<span style={{color:T.teal,fontSize:11,lineHeight:1,fontWeight:700}}>✓</span>}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:1}}>
                      <span style={{fontSize:11,fontWeight:700,color:active?T.teal:T.txt2}}>{opt.label}</span>
                      <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:700,color:active?T.teal:T.txt4}}>+{opt.pts}</span>
                    </div>
                    <div style={{fontSize:10,color:T.txt3,lineHeight:1.35}}>{opt.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {filled&&(
        <button onClick={()=>setSel({})} style={{padding:"8px 0",borderRadius:8,background:"transparent",border:"1px solid rgba(26,53,85,.6)",color:T.txt3,fontFamily:"'DM Sans',sans-serif",fontSize:12,cursor:"pointer"}}>
          Reset Score
        </button>
      )}
      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.txt4,textAlign:"center"}}>
        HEART Score · Backus et al. 2010 · Validated in 6 prospective studies · AHA/ACC Chest Pain Guidelines 2021
      </div>
    </div>
  );
}