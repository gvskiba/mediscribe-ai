// ECGPEATab.jsx — PEA / Resuscitation ECG Guide
import { useState } from "react";

const T = {
  txt:"#e8f0fe", txt2:"#aac8e8", txt3:"#90b8d4", txt4:"#6898b4",
  red:"#ff4444", orange:"#ff9f43", gold:"#f5c842",
  blue:"#3b9eff", purple:"#9b6dff", teal:"#00e5c0", coral:"#ff6b6b",
};
const glass = {backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",background:"rgba(8,22,40,0.72)",border:"1px solid rgba(26,53,85,0.75)",borderRadius:14};

const NARROW = [
  {cause:"Hypovolemia",ecg:"Sinus tach, narrow QRS, small QRS amplitude. Flat IVC on echo (< 1.5cm).",action:"IV NS/LR 500mL rapid bolus × 2. Massive hemorrhage: activate MTP. Bedside FAST echo.",color:T.blue},
  {cause:"Tamponade",ecg:"Electrical alternans (QRS amplitude variation beat-to-beat), sinus tach, low voltage, narrow QRS.",action:"Emergent pericardiocentesis. Echo-guided preferred. Large bore needle xiphoid approach if crashing.",color:T.coral},
  {cause:"Tension Pneumo",ecg:"Sinus tach, narrow QRS, low voltage ipsilateral. Diagnosis is CLINICAL — absent breath sounds, tracheal deviation, hypotension.",action:"Immediate needle decompression 2nd ICS MCL or 4th/5th ICS AAL. Confirm with clinical response, then chest tube.",color:T.orange},
  {cause:"PE (Massive)",ecg:"Sinus tach, S1Q3T3, RBBB, T inversions V1-V4, new right axis. Narrow or slightly wide QRS.",action:"Systemic tPA 100mg over 2h (or 50mg rapid push for arrest). Heparin. Bedside echo (RV dilation).",color:T.gold},
  {cause:"Hypoxia",ecg:"Sinus tach. No specific ECG finding — diagnosis by SpO₂ and clinical.",action:"Optimize oxygenation. Correct ET tube position. Suction. Increase FiO₂ to 100%.",color:T.teal},
  {cause:"Hypoglycemia",ecg:"May show ST changes, QTc prolongation at very low glucose. Usually no ECG finding.",action:"D50W 1-2 amps (50-100mL) IV. Point-of-care glucose immediately in every arrest.",color:T.purple},
];

const WIDE = [
  {cause:"Hyperkalemia",ecg:"Wide QRS (sine wave pattern at K⁺ > 7.5), peaked T waves, absent P waves. Bradycardia.",action:"Calcium gluconate 2-4g IV IMMEDIATELY. Then insulin + D50, bicarb. Dialysis if available.",color:T.red},
  {cause:"TCA / Sodium Channel",ecg:"Wide QRS > 120ms. Terminal R wave in aVR ≥ 3mm. Right axis shift of terminal QRS. Prolonged QTc.",action:"NaHCO₃ 1-2 mEq/kg IV bolus. Repeat q5 min until QRS narrows. Lipid emulsion 20% for refractory.",color:T.red},
  {cause:"BB / CCB Toxicity",ecg:"Sinus bradycardia or junctional/idioventricular rhythm. Wide QRS. AV block (all degrees).",action:"High-dose insulin 1U/kg bolus → 1U/kg/h. Calcium gluconate 3g. Lipid emulsion. ECMO for refractory.",color:T.coral},
  {cause:"Hypothermia",ecg:"Sinus bradycardia → atrial fibrillation → VF. Osborn (J) waves (positive deflection at QRS-ST junction). QTc prolongation. All intervals prolonged.",action:"Active rewarming. Warmed IV fluids 42°C. Warm humidified O₂. ECMO for < 28°C. Do NOT declare death until warm.",color:T.blue},
  {cause:"Hypermagnesemia",ecg:"PR prolongation, wide QRS, high-degree AV block at Mg²⁺ > 7 mEq/L. Bradycardia.",action:"Calcium gluconate 1-2g IV. Stop Mg²⁺ infusions. Dialysis for severe toxicity.",color:T.purple},
];

const RHYTHMS = [
  {label:"Asystole",action:"CPR. Confirm in 2 leads. Epinephrine 1mg IV q3-5 min. Look for reversible cause — asystole rarely survives without treated H/T.",color:T.txt4},
  {label:"Fine VF",action:"Defibrillate 200J biphasic immediately. Minimize interruptions. Epinephrine 1mg after 3rd shock. Amiodarone 300mg after 3rd shock.",color:T.red},
  {label:"Coarse VF / Pulseless VT",action:"Immediate defibrillation 200-360J biphasic. Best prognostic rhythm in arrest — high survival if corrected quickly.",color:T.coral},
  {label:"Organized QRS no pulse",action:"Narrow: treat tamponade, PE, tension pneumo, hypovolemia (see narrow PEA above). Wide: treat toxic/metabolic causes.",color:T.gold},
  {label:"Agonal / Slow Wide",action:"Treat as severe acidosis or terminal. High-dose epi, bicarb. Consider ECMO-CPR if candidate.",color:T.orange},
];

export default function ECGPEATab() {
  const [width,setWidth]=useState(null);
  const [selCause,setSelCause]=useState(null);
  const [selRhythm,setSelRhythm]=useState(null);

  const list = width==="narrow"?NARROW:width==="wide"?WIDE:null;

  return(
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <div style={{fontSize:11,color:T.txt3,lineHeight:1.55,padding:"10px 12px",borderRadius:8,background:"rgba(255,68,68,.05)",border:"1px solid rgba(255,68,68,.2)"}}>
        <strong style={{color:T.coral}}>In PEA arrest, QRS width is the fastest triage decision.</strong> Narrow = hemodynamic collapse (tamponade, PE, tension pneumo, hypovolemia). Wide = metabolic/toxic cause (hyperK, TCA, BB/CCB, hypothermia).
      </div>

      {/* QRS width triage */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {[{id:"narrow",label:"Narrow QRS PEA",sub:"< 120ms",color:T.blue},{id:"wide",label:"Wide QRS PEA",sub:"≥ 120ms",color:T.red}].map(w=>(
          <button key={w.id} onClick={()=>{setWidth(width===w.id?null:w.id);setSelCause(null);}}
            style={{padding:"12px",borderRadius:10,cursor:"pointer",textAlign:"center",border:`2px solid ${width===w.id?w.color+"77":"rgba(26,53,85,.6)"}`,background:width===w.id?`${w.color}10`:"rgba(14,37,68,.4)",fontFamily:"'DM Sans',sans-serif",transition:"all .15s"}}>
            <div style={{fontSize:14,fontWeight:700,color:width===w.id?w.color:T.txt2,marginBottom:2}}>{w.label}</div>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:width===w.id?w.color:T.txt4}}>{w.sub}</div>
          </button>
        ))}
      </div>

      {/* Causes */}
      {list&&(
        <div style={{display:"flex",flexDirection:"column",gap:5}}>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.txt3,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Tap cause to see ECG findings + treatment</div>
          {list.map((item,i)=>{
            const on=selCause===i;
            return(
              <div key={i}>
                <div onClick={()=>setSelCause(on?null:i)}
                  style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",borderRadius:on?"8px 8px 0 0":8,cursor:"pointer",background:on?`${item.color}0f`:"rgba(14,37,68,.4)",border:`1px solid ${on?item.color+"44":"rgba(26,53,85,.6)"}`,transition:"all .1s"}}>
                  <div style={{width:3,height:18,borderRadius:2,background:item.color,flexShrink:0}}/>
                  <span style={{flex:1,fontSize:12,fontWeight:700,color:on?item.color:T.txt2}}>{item.cause}</span>
                  <span style={{color:T.txt4,fontFamily:"'JetBrains Mono',monospace",fontSize:10}}>{on?"▲":"▼"}</span>
                </div>
                {on&&(
                  <div style={{padding:"10px 12px",borderRadius:"0 0 8px 8px",background:`${item.color}07`,border:`1px solid ${item.color}22`,borderTop:"none"}}>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.teal,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>ECG Findings</div>
                    <div style={{fontSize:11,color:T.txt2,lineHeight:1.45,marginBottom:8}}>{item.ecg}</div>
                    <div style={{padding:"8px 10px",borderRadius:6,background:"rgba(255,159,67,.06)",border:"1px solid rgba(255,159,67,.25)"}}>
                      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.orange,textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>Immediate Action</div>
                      <div style={{fontSize:11,color:T.txt,lineHeight:1.45,fontWeight:600}}>{item.action}</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Rhythm recognition */}
      <div style={{...glass,padding:"14px 16px"}}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.gold,textTransform:"uppercase",letterSpacing:1,fontWeight:700,marginBottom:10}}>Arrest Rhythm Recognition</div>
        {RHYTHMS.map((r,i)=>{
          const on=selRhythm===i;
          return(
            <div key={i} onClick={()=>setSelRhythm(on?null:i)}
              style={{marginBottom:5,cursor:"pointer"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderRadius:on?"7px 7px 0 0":7,background:on?`${r.color}0e`:"rgba(14,37,68,.35)",border:`1px solid ${on?r.color+"44":"rgba(26,53,85,.5)"}`,transition:"all .1s"}}>
                <div style={{width:3,height:14,borderRadius:2,background:r.color,flexShrink:0}}/>
                <span style={{flex:1,fontSize:12,fontWeight:700,color:on?r.color:T.txt2}}>{r.label}</span>
                <span style={{color:T.txt4,fontFamily:"'JetBrains Mono',monospace",fontSize:10}}>{on?"▲":"▼"}</span>
              </div>
              {on&&(
                <div style={{padding:"9px 11px",borderRadius:"0 0 7px 7px",background:`${r.color}07`,border:`1px solid ${r.color}22`,borderTop:"none",fontSize:11,color:T.txt,lineHeight:1.5}}>{r.action}</div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.txt4,textAlign:"center"}}>
        2020 AHA ACLS Guidelines · H's and T's Framework
      </div>
    </div>
  );
}