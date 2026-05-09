// ECGSyncopeTab.jsx — Syncope ECG Screen
import { useState } from "react";

const T = {
  txt:"#e8f0fe", txt2:"#aac8e8", txt3:"#90b8d4", txt4:"#6898b4",
  red:"#ff4444", orange:"#ff9f43", gold:"#f5c842",
  blue:"#3b9eff", purple:"#9b6dff", teal:"#00e5c0", coral:"#ff6b6b",
};
const glass = {backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",background:"rgba(8,22,40,0.72)",border:"1px solid rgba(26,53,85,0.75)",borderRadius:14};

const CATS = [
  {
    cat:"Channelopathies",color:"#ff4444",icon:"⚡",
    items:[
      {
        label:"Long QT Syndrome (LQTS)",
        ecg:"QTc ≥ 450ms (♂) / ≥ 460ms (♀) on multiple leads. Notched T waves (LQT2). T-wave alternans (bidirectional T-wave amplitude beat-to-beat). Late-appearing T waves. Measured QTc at rest may be normal in ~10% of gene carriers.",
        flags:"Syncope with exercise or emotion (LQT1), syncope with sudden noise or alarm (LQT2). Prior 'unexplained drowning'. FHx sudden cardiac death or congenital deafness (Jervell-Lange-Nielsen). Young athlete with exertional syncope.",
        next:"Holter + exercise stress test · Genetic testing (KCNQ1, KCNH2, SCN5A) · Cardiology · Beta-blocker · ICD if breakthrough events",
        source:"2022 HRS LQTS Guidelines",
      },
      {
        label:"Brugada Syndrome",
        ecg:"Type 1 (diagnostic only): coved STE ≥ 2mm in ≥1 right precordial lead (V1-V2) with characteristic downsloping ST segment terminating in an inverted T wave. Type 2/3 saddle-back NOT diagnostic — requires sodium-channel blocker challenge (ajmaline/flecainide).",
        flags:"Syncope during sleep or rest (not exertion). Male, Asian or Southeast Asian descent. Syncope or VF triggered by fever. FHx SCD < 45 years. Check: prior normal ECG during fever — may have shown type 1.",
        next:"EP study if symptomatic · ICD for resuscitated SCA or spontaneous type 1 · Avoid sodium-channel blockers, tricyclics, propofol, alcohol excess",
        source:"2022 HRS Brugada Guideline",
      },
      {
        label:"CPVT (Catecholaminergic Polymorphic VT)",
        ecg:"Baseline ECG is NORMAL — this is the critical trap. Bidirectional or polymorphic VT induced exclusively by exercise or emotional stress. The only way to diagnose is exercise stress testing.",
        flags:"Syncope specifically with exercise or emotional stress. NORMAL resting ECG, NORMAL echo. Young patient. FHx of exercise-related sudden death. Misdiagnosed as 'vasovagal' for years.",
        next:"Treadmill stress test (essential — resting ECG useless) · RYR2/CASQ2 genetic testing · Beta-blocker (high dose) · Flecainide added if breakthrough · ICD + flecainide",
        source:"2022 HRS CPVT Guidelines",
      },
    ]
  },
  {
    cat:"Structural Heart Disease",color:"#ff9f43",icon:"🫀",
    items:[
      {
        label:"Hypertrophic Cardiomyopathy (HCM)",
        ecg:"Marked LVH voltage criteria (disproportionate to patient size). Deep narrow Q waves in lateral leads (I, aVL, V5-V6) — septal hypertrophy. Diffuse ST-T changes. Giant negative T waves in apical HCM (Yamaguchi variant, V3-V5).",
        flags:"Exertional syncope. Harsh systolic ejection murmur louder with Valsalva and standing. Young athlete. FHx HCM or SCD. Palpitations preceding syncope.",
        next:"Echo (LVOT gradient, SAM, wall thickness) · Cardiology · Exercise restriction · Beta-blocker or disopyramide · ICD if high-risk features",
        source:"2020 ACC/AHA HCM Guideline",
      },
      {
        label:"ARVC (Arrhythmogenic RV Cardiomyopathy)",
        ecg:"Epsilon wave V1-V3 (small positive deflection just after QRS end). T inversions V1-V4 beyond age 14. RBBB or incomplete RBBB. Terminal activation delay / prolonged S-wave upstroke V1-V3 > 55ms. Low-voltage QRS in limb leads.",
        flags:"Syncope with exercise. Young male. PVCs with LBBB morphology (right ventricular origin). FHx SCD. Athlete ('athlete's heart' mimic). Screen with MRI.",
        next:"Cardiac MRI (fibrofatty infiltration, RV dilation, wall motion abnormality) · Genetic testing (PKP2, DSP) · Exercise restriction (mandatory) · Cardiology",
        source:"2019 HRS ARVC Expert Statement",
      },
      {
        label:"Myocarditis",
        ecg:"Diffuse ST changes across multiple territories (not STEMI distribution). New bundle branch block. Sinus tachycardia out of proportion. VT or VF may occur. PR depression if concurrent pericarditis.",
        flags:"Recent viral illness (URI, GI illness) 1-3 weeks prior. Pleuritic or positional chest pain. Troponin elevation with normal coronary anatomy. Young patient.",
        next:"Troponin, CRP, echo · Cardiac MRI (Lake Louise criteria) · Exercise restriction × 3-6 months · Cardiology",
        source:"2023 ESC Myocarditis Position Paper",
      },
    ]
  },
  {
    cat:"Arrhythmic Causes",color:"#f5c842",icon:"📶",
    items:[
      {
        label:"WPW / Pre-Excitation",
        ecg:"Short PR < 120ms. Delta wave (slurred QRS upstroke). Wide QRS (pseudo-LBBB or pseudo-RBBB depending on pathway). Pseudo-inferior Q waves in some pathways mimicking inferior MI. Rapid AF with WCT pattern = pre-excited AF — potentially lethal.",
        flags:"Young patient with palpitations, racing heart, syncope. NEVER adenosine, verapamil, or digoxin in suspected WPW+AF. Pathway may be intermittent — check multiple ECGs.",
        next:"EP study · Radiofrequency ablation · Risk stratify: shortest pre-excited RR interval < 250ms = high-risk pathway",
        source:"2019 AHA/ACC/HRS SVT Guideline",
      },
      {
        label:"Complete / High-Degree AV Block",
        ecg:"P waves and QRS march independently (AV dissociation). Ventricular rate 30-50 bpm (junctional escape) or slower (ventricular escape). Can be intermittent — look for PR prolongation, Wenckebach, or Mobitz II pattern on longer strips.",
        flags:"Syncope without warning. Elderly on rate-controlling drugs. Lyme exposure (consider at any age with AV block). Post-inferior MI (AV node ischemia). Anti-Ro/La antibodies (neonatal block).",
        next:"TCP if unstable · Transvenous pacing urgent · Cardiology · Pacemaker if non-reversible · Treat underlying cause (Lyme: ceftriaxone)",
        source:"2018 ACC/AHA Bradycardia Guideline",
      },
      {
        label:"Sick Sinus Syndrome / Brady-Tachy",
        ecg:"Sinus pauses > 3 seconds. Sinus bradycardia < 40 bpm. Sinoatrial exit block. Alternating atrial fibrillation and long sinus pauses on conversion (brady-tachy syndrome).",
        flags:"Elderly patient. Palpitations then syncope (tachy phase then brady phase). Symptoms directly correlate with rhythm. Often multiple episodes before diagnosis.",
        next:"Holter / extended cardiac monitor (implantable loop recorder if recurrent) · Pacemaker if symptomatic bradycardia (Class 1)",
        source:"2018 ACC/AHA Bradycardia Guideline",
      },
    ]
  },
];

export default function ECGSyncopeTab() {
  const [selCat,  setSelCat]  = useState(null);
  const [selItem, setSelItem] = useState(null);

  const toggleCat = i=>{
    if(selCat===i){setSelCat(null);setSelItem(null);}
    else{setSelCat(i);setSelItem(null);}
  };

  return(
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      <div style={{fontSize:11,color:T.txt3,lineHeight:1.55,padding:"10px 12px",borderRadius:8,background:"rgba(255,107,107,.05)",border:"1px solid rgba(255,107,107,.2)"}}>
        Syncope carries up to 7% 30-day mortality when arrhythmic. A normal ECG does NOT exclude dangerous causes — CPVT is the classic trap. Use Canadian Syncope Risk Score or ROSE criteria for risk stratification.
      </div>
      {CATS.map((cat,ci)=>(
        <div key={ci} style={{...glass,padding:"12px 14px"}}>
          <div onClick={()=>toggleCat(ci)} style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",marginBottom:selCat===ci?10:0}}>
            <span style={{fontSize:16}}>{cat.icon}</span>
            <div style={{flex:1,fontSize:13,fontWeight:700,color:cat.color}}>{cat.cat}</div>
            <span style={{color:T.txt3,fontFamily:"'JetBrains Mono',monospace",fontSize:11}}>{selCat===ci?"▲":"▼"}</span>
          </div>
          {selCat===ci&&cat.items.map((item,ii)=>{
            const key=`${ci}-${ii}`;
            const open=selItem===key;
            return(
              <div key={ii} style={{marginBottom:5}}>
                <div onClick={()=>setSelItem(open?null:key)}
                  style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:open?"8px 8px 0 0":8,cursor:"pointer",background:open?`${cat.color}0f`:"rgba(14,37,68,.35)",border:`1px solid ${open?cat.color+"44":"rgba(26,53,85,.5)"}`,transition:"all .1s"}}>
                  <div style={{width:3,height:14,borderRadius:2,background:cat.color,flexShrink:0}}/>
                  <span style={{fontSize:12,fontWeight:600,color:open?cat.color:T.txt2,flex:1}}>{item.label}</span>
                  <span style={{color:T.txt4,fontFamily:"'JetBrains Mono',monospace",fontSize:10}}>{open?"▲":"▼"}</span>
                </div>
                {open&&(
                  <div className="ecg-fade" style={{padding:"11px 13px",borderRadius:"0 0 8px 8px",background:`${cat.color}07`,border:`1px solid ${cat.color}22`,borderTop:"none"}}>
                    <div style={{marginBottom:9}}>
                      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.teal,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>ECG Findings</div>
                      <div style={{fontSize:11,color:T.txt2,lineHeight:1.5}}>{item.ecg}</div>
                    </div>
                    <div style={{padding:"8px 10px",borderRadius:6,background:"rgba(255,159,67,.06)",border:"1px solid rgba(255,159,67,.2)",marginBottom:7}}>
                      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.orange,textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>Red Flags / When to Worry</div>
                      <div style={{fontSize:11,color:T.txt,lineHeight:1.45}}>{item.flags}</div>
                    </div>
                    <div style={{display:"flex",gap:6,alignItems:"flex-start",marginBottom:4}}>
                      <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:cat.color,flexShrink:0,marginTop:1}}>Next:</span>
                      <span style={{fontSize:10,color:T.txt3,lineHeight:1.45}}>{item.next}</span>
                    </div>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.txt4}}>{item.source}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.txt4,textAlign:"center"}}>
        Canadian Syncope Risk Score · ROSE Criteria · 2017 ACC/AHA Syncope Guideline
      </div>
    </div>
  );
}