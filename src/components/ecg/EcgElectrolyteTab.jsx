// ECGElectrolyteTab.jsx — Full Electrolyte ECG Reference
import { useState } from "react";

const T = {
  txt:"#e8f0fe", txt2:"#aac8e8", txt3:"#90b8d4", txt4:"#6898b4",
  red:"#ff4444", orange:"#ff9f43", gold:"#f5c842",
  blue:"#3b9eff", purple:"#9b6dff", teal:"#00e5c0", coral:"#ff6b6b",
};
const glass = {backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",background:"rgba(8,22,40,0.72)",border:"1px solid rgba(26,53,85,0.75)",borderRadius:14};

const IONS = [
  {
    id:"hypoK", label:"Hypokalemia", unit:"K⁺ < 3.5 mEq/L", color:"#3b9eff", icon:"↓K",
    stages:[
      {range:"3.0–3.5",label:"Mild",ecg:"Flattened T waves (earliest sign). Prominent U waves (> 1mm, best in V2-V4). Apparent QT prolongation (actually QU interval)."},
      {range:"2.5–3.0",label:"Moderate",ecg:"T-U fusion. Progressive U wave prominence. ST depression (2–3mm). Widened QRS begins."},
      {range:"< 2.5",label:"Severe",ecg:"T wave inversion. Massive U waves may exceed T amplitude. VT / TdP risk increases substantially."},
    ],
    pitfall:"The 'prolonged QT' in hypokalemia is usually QU — measure carefully. Hypokalemia + hypomagnesemia = synergistic TdP risk. Correct Mg²⁺ first or simultaneously.",
    tx:"Oral KCl if tolerating PO. IV KCl max 10 mEq/h peripheral (20 mEq/h central). Replace Mg²⁺ concurrently — hypoK refractory without Mg²⁺ repletion. Target K⁺ > 4.0 in cardiac patients.",
    source:"AHA/ACC Electrolyte Guidelines · Uptodate"
  },
  {
    id:"hyperK", label:"Hyperkalemia", unit:"K⁺ > 5.5 mEq/L", color:"#ff4444", icon:"↑K",
    stages:[
      {range:"5.5–6.5",label:"Mild-Moderate",ecg:"Peaked narrow symmetric T waves — tall, tent-shaped (narrow base distinguishes from hyperacute T waves). Best in V2-V4, II."},
      {range:"6.5–7.5",label:"Severe",ecg:"PR prolongation. P wave flattening/loss (sinoventricular rhythm). QRS widening begins (> 120ms)."},
      {range:"> 7.5",label:"Critical",ecg:"Wide QRS merging with T wave (sine wave pattern). VF / asystole imminent."},
    ],
    pitfall:"ECG changes correlate poorly with K⁺ level. Some patients develop sine wave at 6.5; others show minimal changes at 8. Treat the ECG and the number.",
    tx:"Ca gluconate 1-2g IV (membrane stabilization, immediate). Insulin 10U + D50W. Albuterol 10-20mg neb. NaHCO₃ if pH < 7.2. Emergent dialysis for refractory or sine wave.",
    source:"2023 KDIGO Hyperkalemia Guideline"
  },
  {
    id:"hypoMg", label:"Hypomagnesemia", unit:"Mg²⁺ < 1.7 mg/dL", color:"#9b6dff", icon:"↓Mg",
    stages:[
      {range:"1.2–1.7",label:"Mild",ecg:"Subtle PR and QT prolongation. T wave flattening. Often similar to hypokalemia (Mg²⁺ deficiency → intracellular K⁺ loss)."},
      {range:"< 1.2",label:"Severe",ecg:"Significant QTc prolongation. T wave inversions. U waves. Runs of TdP, VT. Wide QRS at extreme levels."},
    ],
    pitfall:"Hypomagnesemia is often invisible — not on the standard electrolyte panel, not tested unless requested. Always check Mg²⁺ in: alcoholism, malnutrition, prolonged diuretic use, refractory hypokalemia, unexplained TdP.",
    tx:"MgSO₄ 2-4g IV over 15-30 min (slow push for asymptomatic; fast for TdP). TdP: 2g IV rapid push. Oral magnesium oxide for maintenance. Often requires repeated dosing.",
    source:"AHA/ACC Electrolyte Guidelines"
  },
  {
    id:"hypoCA", label:"Hypocalcemia", unit:"Ca²⁺ < 8.5 mg/dL (total) / iCa < 1.12", color:"#ff9f43", icon:"↓Ca",
    stages:[
      {range:"7.5–8.5",label:"Mild",ecg:"Prolonged QTc — most reliable ECG sign. ST segment lengthening (flat, prolonged). QT corrects when calcium normalized."},
      {range:"< 7.5",label:"Severe",ecg:"Marked QTc prolongation (> 500ms). Risk of TdP. Occasionally T wave changes. Rarely complete AV block in extreme cases."},
    ],
    pitfall:"Hypocalcemia QTc prolongation is from ST prolongation, not T wave changes (unlike LQTS). Check ionized calcium — total calcium is unreliable in hypoalbuminemia without correcting.",
    tx:"Symptomatic/severe: calcium gluconate 1-2g IV over 10-20 min. Oral calcium + vitamin D for chronic/mild. Monitor continuous ECG during IV repletion. Treat underlying cause (hypoMg, hypoVit D, post-parathyroidectomy).",
    source:"Endocrine Society Clinical Practice Guidelines"
  },
  {
    id:"hyperCA", label:"Hypercalcemia", unit:"Ca²⁺ > 10.5 mg/dL", color:"#f5c842", icon:"↑Ca",
    stages:[
      {range:"10.5–12",label:"Mild",ecg:"Shortened QTc — most specific ECG finding. Shortened ST segment (appears to merge QRS and T wave)."},
      {range:"12–14",label:"Moderate",ecg:"Further QT shortening. Osborn/J waves (notching at QRS-ST junction). Sinus bradycardia. PR prolongation."},
      {range:"> 14",label:"Severe — Crisis",ecg:"QTc may normalize or widen (myocardial toxicity). VT/VF risk. High-degree AV block. Profound bradycardia."},
    ],
    pitfall:"Hypercalcemia is one of the few conditions that SHORTENS QTc. If you see an unusually short QTc (< 350ms), check calcium immediately. Malignancy, hyperparathyroidism, granulomatous disease, thiazides.",
    tx:"IV NS 200-300 mL/h hydration (first line). Furosemide after adequate hydration. Bisphosphonate (zoledronic acid) for malignancy-related. Calcitonin for rapid temporary effect. Dialysis for renal failure + severe hypercalcemia.",
    source:"Endocrine Society · AACE Guidelines"
  },
];

export default function ECGElectrolyteTab() {
  const [sel,setSel]=useState(null);
  const [kVal,setKVal]=useState("");
  const [caVal,setCaVal]=useState("");
  const [mgVal,setMgVal]=useState("");

  const getFlag=(val,low,high)=>{
    const n=parseFloat(val);
    if(isNaN(n))return null;
    if(n<low)return "low";
    if(n>high)return "high";
    return "normal";
  };
  const flags={k:getFlag(kVal,3.5,5.5),ca:getFlag(caVal,8.5,10.5),mg:getFlag(mgVal,1.7,2.4)};
  const flagColor={low:T.blue,high:T.red,normal:T.teal};

  return(
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      <div style={{fontSize:11,color:T.txt3,lineHeight:1.5,padding:"10px 12px",borderRadius:8,background:"rgba(14,37,68,.4)",border:"1px solid rgba(26,53,85,.6)"}}>
        Electrolyte abnormalities cause most non-ischemic ECG emergencies. Enter lab values for instant flagging, or tap an ion to review ECG patterns and treatment.
      </div>

      {/* Quick lab entry */}
      <div style={{...glass,padding:"12px 14px"}}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.teal,textTransform:"uppercase",letterSpacing:1,fontWeight:700,marginBottom:10}}>Quick Lab Entry</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
          {[{label:"K⁺ (mEq/L)",val:kVal,set:setKVal,flag:flags.k,lo:3.5,hi:5.5},{label:"Ca²⁺ (mg/dL)",val:caVal,set:setCaVal,flag:flags.ca,lo:8.5,hi:10.5},{label:"Mg²⁺ (mg/dL)",val:mgVal,set:setMgVal,flag:flags.mg,lo:1.7,hi:2.4}].map(f=>(
            <div key={f.label}>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.txt4,textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>{f.label}</div>
              <input type="number" step="0.1" value={f.val} onChange={e=>f.set(e.target.value)} placeholder={`${f.lo}–${f.hi}`}
                style={{width:"100%",background:"rgba(14,37,68,.5)",border:`1px solid ${f.flag?flagColor[f.flag]+"55":"rgba(26,53,85,.8)"}`,borderRadius:6,padding:"7px 8px",color:f.flag?flagColor[f.flag]:T.txt,fontFamily:"'JetBrains Mono',monospace",fontSize:16,fontWeight:700,outline:"none",textAlign:"center"}}/>
              {f.flag&&f.flag!=="normal"&&<div style={{textAlign:"center",fontSize:9,color:flagColor[f.flag],fontFamily:"'JetBrains Mono',monospace",marginTop:2,fontWeight:700,letterSpacing:1}}>{f.flag==="low"?"LOW":"HIGH"}</div>}
            </div>
          ))}
        </div>
        {(flags.k==="low"&&flags.mg==="low")&&(
          <div style={{marginTop:10,padding:"7px 10px",borderRadius:6,background:"rgba(255,159,67,.08)",border:"1px solid rgba(255,159,67,.35)",fontSize:10,color:T.orange}}>
            ⚠ Concurrent hypokalemia + hypomagnesemia — TdP risk markedly elevated. Correct Mg²⁺ first or simultaneously.
          </div>
        )}
        {(flags.k==="high"&&parseFloat(kVal)>=7)&&(
          <div style={{marginTop:10,padding:"7px 10px",borderRadius:6,background:"rgba(255,68,68,.1)",border:"1px solid rgba(255,68,68,.4)",fontSize:10,color:T.red,fontWeight:700}}>
            ⚡ K⁺ ≥ 7 — CRITICAL. Check ECG immediately. Calcium gluconate IV without delay.
          </div>
        )}
      </div>

      {/* Ion accordion */}
      {IONS.map((ion,i)=>{
        const on=sel===i;
        return(
          <div key={ion.id}>
            <div onClick={()=>setSel(on?null:i)}
              style={{display:"flex",alignItems:"center",gap:10,padding:"10px 13px",borderRadius:on?"10px 10px 0 0":10,cursor:"pointer",background:on?`${ion.color}0e`:"rgba(14,37,68,.4)",border:`1px solid ${on?ion.color+"55":"rgba(26,53,85,.6)"}`,transition:"all .12s"}}>
              <div style={{width:30,height:30,borderRadius:8,flexShrink:0,background:`${ion.color}20`,border:`1px solid ${ion.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:700,color:ion.color}}>{ion.icon}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:700,color:on?ion.color:T.txt2}}>{ion.label}</div>
                <div style={{fontSize:9,color:T.txt4,fontFamily:"'JetBrains Mono',monospace"}}>{ion.unit}</div>
              </div>
              <span style={{color:T.txt4,fontFamily:"'JetBrains Mono',monospace",fontSize:10}}>{on?"▲":"▼"}</span>
            </div>
            {on&&(
              <div style={{padding:"12px 14px",borderRadius:"0 0 10px 10px",background:`${ion.color}06`,border:`1px solid ${ion.color}33`,borderTop:"none"}}>
                {ion.stages.map((s,j)=>(
                  <div key={j} style={{display:"grid",gridTemplateColumns:"90px 1fr",gap:10,marginBottom:9,paddingBottom:9,borderBottom:j<ion.stages.length-1?"1px solid rgba(26,53,85,.3)":"none"}}>
                    <div>
                      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:700,color:ion.color}}>{s.range}</div>
                      <div style={{fontSize:9,color:ion.color,opacity:.7,fontFamily:"'JetBrains Mono',monospace",marginTop:1}}>{s.label}</div>
                    </div>
                    <div style={{fontSize:11,color:T.txt2,lineHeight:1.45}}>{s.ecg}</div>
                  </div>
                ))}
                <div style={{padding:"8px 10px",borderRadius:6,background:"rgba(255,107,107,.06)",border:"1px solid rgba(255,107,107,.2)",marginBottom:7}}>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.coral,textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>Pitfall</div>
                  <div style={{fontSize:11,color:T.txt2,fontStyle:"italic",lineHeight:1.45}}>{ion.pitfall}</div>
                </div>
                <div style={{padding:"8px 10px",borderRadius:6,background:"rgba(255,159,67,.06)",border:"1px solid rgba(255,159,67,.2)",marginBottom:5}}>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.orange,textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>Treatment</div>
                  <div style={{fontSize:11,color:T.txt,lineHeight:1.45}}>{ion.tx}</div>
                </div>
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.txt4}}>{ion.source}</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}