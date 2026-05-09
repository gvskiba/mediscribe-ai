// ECGToxTab.jsx — Drug / Toxicology ECG Patterns
import { useState } from "react";

const T = {
  txt:"#e8f0fe", txt2:"#aac8e8", txt3:"#90b8d4", txt4:"#6898b4",
  red:"#ff4444", orange:"#ff9f43", gold:"#f5c842",
  blue:"#3b9eff", purple:"#9b6dff", teal:"#00e5c0", coral:"#ff6b6b",
};
const glass = {backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",background:"rgba(8,22,40,0.72)",border:"1px solid rgba(26,53,85,0.75)",borderRadius:14};

const TOX = [
  {
    id:"tca",label:"Tricyclics / TCAs",color:"#ff4444",urgency:"Critical",
    drugs:"Amitriptyline, nortriptyline, imipramine, doxepin, clomipramine",
    ecg:[
      "Terminal R in aVR ≥ 3mm — most specific sign (Na⁺-channel blockade, right axis of terminal QRS)",
      "Wide QRS ≥ 100ms · VT/VF risk escalates with QRS > 160ms",
      "Prolonged QTc → TdP risk",
      "Sinus tachycardia (anticholinergic effect — dry, hot, blind, mad, red)",
      "Right axis deviation of terminal 40ms vector (S in I, R in aVR)",
    ],
    tx:"NaHCO₃ 1-2 mEq/kg IV bolus → repeat q5 min until QRS narrows or pH 7.50-7.55. AVOID physostigmine. Intubate early if altered (acidosis worsens TCA toxicity). Lipid emulsion 20% for refractory arrest.",
    pitfall:"TCA toxicity can mimic Brugada type 1 pattern in V1-V2. NaHCO₃ is the specific antidote — give it early and generously.",
    source:"2023 ACMT · 2022 Toxicology Guidelines"
  },
  {
    id:"dig",label:"Digoxin Toxicity",color:"#ff9f43",urgency:"Critical",
    drugs:"Digoxin (Lanoxin) · Digitoxin · Plant toxins: oleander, foxglove, lily of the valley",
    ecg:[
      "Bidirectional VT — QRS alternates axis beat-to-beat. Pathognomonic.",
      "AV blocks — 1°, 2° (Wenckebach), 3° (enhanced vagal + direct AV node toxicity)",
      "Regularization of atrial fibrillation = AV block from digoxin until proven otherwise",
      "Scooped 'Salvador Dalí mustache' ST depression in V5-V6 (subtherapeutic too)",
      "PAT with AV block — paroxysmal atrial tachycardia + high-degree block",
      "Frequent PVCs, bigeminy, junctional escape",
    ],
    tx:"Digifab (Digoxin-specific Fab antibody) — vials = (serum level × weight kg) ÷ 100. AVOID calcium gluconate (potentiates cardiac toxicity). Atropine for bradycardia. MgSO₄ for ventricular arrhythmias.",
    pitfall:"Serum level correlates poorly with toxicity — especially in chronic toxicity. Hypokalemia dramatically sensitizes the myocardium. Check K⁺ and Mg²⁺ immediately.",
    source:"AACT/EAPCCT Digoxin Guideline"
  },
  {
    id:"cocaine",label:"Cocaine / Sympathomimetics",color:"#ff6b6b",urgency:"High",
    drugs:"Cocaine, methamphetamine, MDMA, bath salts, pseudoephedrine, phenylephrine excess",
    ecg:[
      "Diffuse or focal STE — coronary vasospasm (not plaque rupture; no culprit lesion on cath)",
      "Sinus tachycardia ± SVT, AF, VT from adrenergic surge",
      "Wide QRS if Na⁺-channel blockade at high cocaine doses",
      "QTc prolongation with sympathomimetics → TdP risk",
      "Aortic dissection: inferior STEMI pattern, check BP in both arms and femoral pulses",
    ],
    tx:"Benzodiazepines first-line (lorazepam 2-4mg IV) — treat adrenergic surge before ECG normalizes. Nitrates for vasospasm. Aspirin + heparin if true MI by troponin. AVOID non-selective beta-blockers.",
    pitfall:"NEVER give propranolol, atenolol, or metoprolol in cocaine-associated chest pain — unopposed alpha causes worsened coronary vasospasm. Labetalol is controversial. Phentolamine acceptable.",
    source:"AHA Cocaine-Associated Chest Pain Statement 2022"
  },
  {
    id:"bb_ccb",label:"Beta-Blocker / CCB Overdose",color:"#ff9f43",urgency:"Critical",
    drugs:"Metoprolol, atenolol, propranolol (Na⁺-channel also) · Verapamil, diltiazem, amlodipine",
    ecg:[
      "Sinus bradycardia — often severe (HR < 40 bpm), refractory to atropine",
      "1°, 2° (Wenckebach or Mobitz II), 3° AV block — all degrees possible",
      "Wide QRS with propranolol and severe CCB toxicity (Na⁺-channel blockade)",
      "Junctional or ventricular escape rhythm",
      "ST-T changes from secondary myocardial ischemia",
    ],
    tx:"High-dose insulin (HEI): 1 U/kg regular insulin IV bolus → 0.5-1 U/kg/h + dextrose. Calcium gluconate 3g IV q15 min × 3. Atropine 1mg (usually ineffective). Glucagon 5-10mg IV. Lipid emulsion 20% for propranolol. ECMO for refractory shock.",
    pitfall:"Atropine rarely reverses high-degree AV block in BB/CCB toxicity. High-dose insulin is the most evidence-based intervention — start it early before cardiac output falls further.",
    source:"2023 ACMT Position Statement · ECMO-EP for toxicology"
  },
  {
    id:"antipsych",label:"QT-Prolonging Drugs",color:"#f5c842",urgency:"High",
    drugs:"Antipsychotics: haloperidol, quetiapine, ziprasidone · Methadone · Azithromycin · Ondansetron · Fluoroquinolones",
    ecg:[
      "QTc prolongation — often > 500ms in toxicity or drug combination",
      "Torsades de Pointes (TdP) — polymorphic VT with characteristic twisting, usually self-terminating",
      "T-wave notching, biphasic T waves, prominent U waves",
      "TdP often pause-dependent (follows a long RR interval or bradycardia)",
    ],
    tx:"Mg²⁺ sulfate 2g IV over 5-10 min for TdP. Correct K⁺ to > 4.5 mEq/L, Mg²⁺ > 2 mEq/L. Overdrive pacing 90-100 bpm for recurrent TdP. Isoproterenol for bradycardia-dependent TdP. Discontinue all offending agents.",
    pitfall:"TdP self-terminates but recurs and degenerates into VF. Each episode warrants aggressive treatment. Multiple QTc-prolonging drugs are synergistic — review the full medication list.",
    source:"AHA/ACC QTc Prolongation Guidelines · Tisdale 2013"
  },
  {
    id:"lithium",label:"Lithium Toxicity",color:"#3b9eff",urgency:"Moderate",
    drugs:"Lithium carbonate (Eskalith, Lithobid) — chronic more dangerous than acute",
    ecg:[
      "Diffuse T-wave flattening or inversion — most common finding, may be subtle",
      "Prominent U waves",
      "QTc prolongation (mild to moderate)",
      "Sinus node dysfunction at high levels — sinoatrial block, sinus pause",
      "Rarely: ST changes resembling ischemia at very high levels",
    ],
    tx:"IV normal saline to enhance renal excretion. Hemodialysis for: level > 4 mEq/L, renal failure, declining neuro status. No specific antidote. Avoid thiazide diuretics (increase reabsorption).",
    pitfall:"Chronic toxicity at 'therapeutic' levels (0.6-1.2 mEq/L) is more neurotoxically dangerous than acute overdose at higher levels. Elderly on NSAIDs or low-sodium diet = high risk.",
    source:"Clinical Toxicology Reference · Goldfrank's"
  },
];

export default function ECGToxTab() {
  const [sel,setSel]=useState(null);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      <div style={{fontSize:11,color:T.txt3,lineHeight:1.55,padding:"10px 12px",borderRadius:8,background:"rgba(14,37,68,.4)",border:"1px solid rgba(26,53,85,.6)"}}>
        Toxicology ECG patterns for the rural ED. Many overdoses produce non-specific changes — correlate with clinical context, exposure history, and serial ECGs. Tap a drug class to expand.
      </div>
      {TOX.map((t,i)=>{
        const on=sel===i;
        return(
          <div key={t.id}>
            <div onClick={()=>setSel(on?null:i)}
              style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:on?"10px 10px 0 0":10,cursor:"pointer",background:on?`${t.color}0f`:"rgba(14,37,68,.4)",border:`1px solid ${on?t.color+"55":"rgba(26,53,85,.6)"}`,transition:"all .12s"}}>
              <div style={{width:3,height:22,borderRadius:2,background:t.color,flexShrink:0}}/>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:700,color:on?t.color:T.txt2}}>{t.label}</div>
                <div style={{fontSize:9,color:T.txt4,marginTop:1,fontFamily:"'JetBrains Mono',monospace"}}>{t.drugs.slice(0,60)}{t.drugs.length>60?"…":""}</div>
              </div>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:t.color,fontWeight:700,padding:"2px 8px",borderRadius:20,background:`${t.color}15`,border:`1px solid ${t.color}33`}}>{t.urgency}</span>
            </div>
            {on&&(
              <div className="ecg-fade" style={{padding:"12px 14px",borderRadius:"0 0 10px 10px",background:`${t.color}06`,border:`1px solid ${t.color}33`,borderTop:"none"}}>
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.txt4,marginBottom:6}}>{t.drugs}</div>
                <div style={{marginBottom:10}}>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.teal,textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>ECG Findings</div>
                  {t.ecg.map((e,j)=><div key={j} style={{display:"flex",gap:6,marginBottom:3}}><span style={{color:T.teal,fontSize:9,flexShrink:0,marginTop:1}}>▸</span><span style={{fontSize:11,color:T.txt2,lineHeight:1.4}}>{e}</span></div>)}
                </div>
                <div style={{padding:"9px 11px",borderRadius:7,background:"rgba(255,159,67,.06)",border:"1px solid rgba(255,159,67,.2)",marginBottom:7}}>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.orange,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Treatment</div>
                  <div style={{fontSize:11,color:T.txt,lineHeight:1.5}}>{t.tx}</div>
                </div>
                <div style={{padding:"7px 10px",borderRadius:6,background:"rgba(255,107,107,.06)",border:"1px solid rgba(255,107,107,.2)",marginBottom:5}}>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.coral,textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>Pitfall</div>
                  <div style={{fontSize:11,color:T.txt2,fontStyle:"italic",lineHeight:1.45}}>{t.pitfall}</div>
                </div>
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.txt4}}>{t.source}</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}