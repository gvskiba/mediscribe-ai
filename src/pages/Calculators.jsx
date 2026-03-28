import { useState, useMemo, useRef } from "react";

// ════════════════════════════════════════════════════════════
//  DESIGN TOKENS
// ════════════════════════════════════════════════════════════
const C = {
  bg:"#050f1e", panel:"rgba(8,22,40,0.72)", card:"rgba(11,30,54,0.6)", up:"rgba(14,37,68,0.5)",
  border:"rgba(26,53,85,0.8)", borderHi:"rgba(42,79,122,0.9)",
  teal:"#00e5c0", blue:"#3b9eff", gold:"#f5c842", coral:"#ff6b6b",
  purple:"#9b6dff", orange:"#ff9f43", green:"#3dffa0", pink:"#ff6b9d",
  txt:"#e8f0fe", txt2:"#8aaccc", txt3:"#4a6a8a", txt4:"#2e4a6a",
};
const ACCENT = "#00e5c0"; // hub colour

// ════════════════════════════════════════════════════════════
//  CALCULATOR REGISTRY  (50 entries)
// ════════════════════════════════════════════════════════════
const CALCS = [

  // ── CARDIAC / CV RISK ──────────────────────────────────────
  {id:"grace",cat:"Cardiac",icon:"🫀",name:"GRACE Score",
   desc:"In-hospital & 6-month mortality in ACS",ref:"GRACE Registry",
   fields:[
     {k:"age",label:"Age (years)",type:"number",min:18,max:120},
     {k:"hr",label:"Heart Rate (bpm)",type:"number",min:0,max:250},
     {k:"sbp",label:"SBP (mmHg)",type:"number",min:0,max:300},
     {k:"cr",label:"Creatinine (mg/dL)",type:"number",min:0,max:20},
     {k:"killip",label:"Killip Class",type:"select",options:["1 — No signs HF","2 — Rales / JVD","3 — Pulmonary oedema","4 — Cardiogenic shock"]},
     {k:"cardiac_arrest",label:"Cardiac arrest at admission",type:"checkbox"},
     {k:"st_dev",label:"ST-segment deviation",type:"checkbox"},
     {k:"elevated_enzymes",label:"Elevated cardiac enzymes",type:"checkbox"},
   ],
   compute(v){
     let s=0;
     const age=+v.age||0; s += age<30?0:age<40?8:age<50?25:age<60?41:age<70?58:age<80?75:91;
     const hr=+v.hr||0; s += hr<50?0:hr<70?3:hr<90?9:hr<110?15:hr<150?24:hr<200?38:46;
     const sbp=+v.sbp||0; s += sbp<80?58:sbp<100?53:sbp<120?43:sbp<140?34:sbp<160?24:sbp<200?10:0;
     const cr=+v.cr||0; s += cr<0.4?1:cr<0.8?3:cr<1.2?5:cr<1.6?7:cr<2?9:cr<4?15:20;
     const ki=[1,2,3,4].indexOf(+(v.killip?.charAt(0)||1))+1;
     s += ki===2?20:ki===3?39:ki===4?59:0;
     if(v.cardiac_arrest) s+=39;
     if(v.st_dev) s+=28;
     if(v.elevated_enzymes) s+=14;
     const risk = s<109?"Low":s<=140?"Intermediate":"High";
     const mort = s<109?"<1%":s<=140?"1–3%":">3%";
     return {score:s, label:risk, detail:`6-month mortality: ${mort}`,
             color:risk==="Low"?C.teal:risk==="Intermediate"?C.gold:C.coral};
   }},

  {id:"timi_nstemi",cat:"Cardiac",icon:"📉",name:"TIMI (UA/NSTEMI)",
   desc:"Risk of adverse cardiac events in NSTE-ACS",ref:"TIMI Study Group",
   fields:[
     {k:"age65",label:"Age ≥ 65 years",type:"checkbox"},
     {k:"cad3",label:"≥ 3 CAD risk factors",type:"checkbox"},
     {k:"known_cad",label:"Known CAD (stenosis ≥ 50%)",type:"checkbox"},
     {k:"asa",label:"ASA use in past 7 days",type:"checkbox"},
     {k:"angina",label:"≥ 2 anginal events in past 24 h",type:"checkbox"},
     {k:"st_dev",label:"ST deviation ≥ 0.5 mm",type:"checkbox"},
     {k:"enzymes",label:"Elevated cardiac markers",type:"checkbox"},
   ],
   compute(v){
     const s=[v.age65,v.cad3,v.known_cad,v.asa,v.angina,v.st_dev,v.enzymes].filter(Boolean).length;
     const risk=s<=2?"Low (4.7%)":s<=4?"Intermediate (13.2%)":"High (40.9%)";
     const c=s<=2?C.teal:s<=4?C.gold:C.coral;
     return{score:s,label:risk,detail:"14-day MACE risk",color:c};
   }},

  {id:"heart",cat:"Cardiac",icon:"💓",name:"HEART Score",
   desc:"Chest pain risk stratification in ED",ref:"HEART score",
   fields:[
     {k:"history",label:"History",type:"select",options:["0 — Slightly suspicious","1 — Moderately suspicious","2 — Highly suspicious"]},
     {k:"ecg",label:"ECG",type:"select",options:["0 — Normal","1 — Non-specific repolarization","2 — Significant ST deviation"]},
     {k:"age",label:"Age",type:"select",options:["0 — < 45 years","1 — 45–64 years","2 — ≥ 65 years"]},
     {k:"rf",label:"Risk Factors",type:"select",options:["0 — No risk factors","1 — 1–2 risk factors","2 — ≥ 3 risk factors or history of atherosclerosis"]},
     {k:"troponin",label:"Troponin",type:"select",options:["0 — ≤ Normal limit","1 — 1–3× normal limit","2 — > 3× normal limit"]},
   ],
   compute(v){
     const s=[v.history,v.ecg,v.age,v.rf,v.troponin].reduce((a,x)=>a+(+(x?.charAt(0)||0)),0);
     const r=s<=3?"Low — MACE < 2%":s<=6?"Moderate — MACE 12–17%":"High — MACE > 65%";
     const c=s<=3?C.teal:s<=6?C.gold:C.coral;
     return{score:s,label:r,detail:"Major adverse cardiac event risk",color:c};
   }},

  {id:"chadsvasc",cat:"Cardiac",icon:"🧲",name:"CHA₂DS₂-VASc",
   desc:"Stroke risk in non-valvular AFib",ref:"ESC Guidelines",
   fields:[
     {k:"chf",label:"Congestive heart failure / LV dysfunction",type:"checkbox"},
     {k:"htn",label:"Hypertension",type:"checkbox"},
     {k:"age75",label:"Age ≥ 75 years (×2)",type:"checkbox"},
     {k:"dm",label:"Diabetes mellitus",type:"checkbox"},
     {k:"stroke",label:"Prior stroke / TIA / thromboembolism (×2)",type:"checkbox"},
     {k:"vascular",label:"Vascular disease (prior MI, PAD, aortic plaque)",type:"checkbox"},
     {k:"age65",label:"Age 65–74 years",type:"checkbox"},
     {k:"female",label:"Female sex",type:"checkbox"},
   ],
   compute(v){
     const s=(v.chf?1:0)+(v.htn?1:0)+(v.age75?2:0)+(v.dm?1:0)+(v.stroke?2:0)+(v.vascular?1:0)+(v.age65?1:0)+(v.female?1:0);
     const strokes=[0,1.3,2.2,3.2,4.0,6.7,9.8,9.6,6.7,15.2];
     const annual=strokes[Math.min(s,9)]||">";
     const rec=s===0?"Anticoagulation not recommended":s===1?"Consider anticoagulation (male) — low risk":"Anticoagulation recommended";
     const c=s===0?C.teal:s===1?C.gold:C.coral;
     return{score:s,label:rec,detail:`Annual stroke risk ≈ ${annual}%`,color:c};
   }},

  {id:"hasbled",cat:"Cardiac",icon:"🩸",name:"HAS-BLED Score",
   desc:"Bleeding risk on anticoagulation for AFib",ref:"CHEST 2010",
   fields:[
     {k:"htn",label:"H — Uncontrolled HTN (SBP > 160)",type:"checkbox"},
     {k:"renal",label:"A — Renal disease (dialysis / creatinine > 2.3)",type:"checkbox"},
     {k:"liver",label:"A — Liver disease (cirrhosis / bilirubin > 3×)",type:"checkbox"},
     {k:"stroke",label:"S — Stroke history",type:"checkbox"},
     {k:"bleeding",label:"B — Prior bleeding or predisposition",type:"checkbox"},
     {k:"inr",label:"L — Labile INR (< 60% time in therapeutic range)",type:"checkbox"},
     {k:"elderly",label:"E — Age > 65 years",type:"checkbox"},
     {k:"drugs",label:"D — Drugs (antiplatelets / NSAIDs)",type:"checkbox"},
     {k:"alcohol",label:"D — Alcohol (≥ 8 drinks/week)",type:"checkbox"},
   ],
   compute(v){
     const s=[v.htn,v.renal,v.liver,v.stroke,v.bleeding,v.inr,v.elderly,v.drugs,v.alcohol].filter(Boolean).length;
     const r=s<=1?"Low bleeding risk":s<=2?"Moderate bleeding risk":"High bleeding risk — does NOT preclude anticoagulation; correct modifiable factors";
     const c=s<=1?C.teal:s<=2?C.gold:C.coral;
     return{score:s,label:r,detail:s>=3?"Consider correcting modifiable factors":"Annual bleed risk: Low–Moderate",color:c};
   }},

  {id:"wells_dvt",cat:"Vascular",icon:"🦵",name:"Wells (DVT)",
   desc:"Pre-test probability of deep vein thrombosis",ref:"Wells et al. Lancet 1997",
   fields:[
     {k:"cancer",label:"Active cancer (treatment or palliation within 6 mo)",type:"checkbox"},
     {k:"paralysis",label:"Paralysis / recent plaster cast of lower extremity",type:"checkbox"},
     {k:"bedridden",label:"Bedridden > 3 days OR major surgery within 12 weeks",type:"checkbox"},
     {k:"tenderness",label:"Localised tenderness along deep venous system",type:"checkbox"},
     {k:"swelling",label:"Entire leg swollen",type:"checkbox"},
     {k:"calf",label:"Calf swelling > 3 cm vs. other leg",type:"checkbox"},
     {k:"pitting",label:"Pitting oedema — greater in symptomatic leg",type:"checkbox"},
     {k:"collateral",label:"Collateral superficial veins",type:"checkbox"},
     {k:"prev_dvt",label:"Previously documented DVT",type:"checkbox"},
     {k:"alt_dx",label:"Alternative diagnosis at least as likely as DVT (−2 pts)",type:"checkbox"},
   ],
   compute(v){
     let s=[v.cancer,v.paralysis,v.bedridden,v.tenderness,v.swelling,v.calf,v.pitting,v.collateral,v.prev_dvt].filter(Boolean).length;
     if(v.alt_dx) s-=2;
     const r=s<=0?"Low probability (~3%)":s<=2?"Moderate probability (~17%)":"High probability (~75%)";
     const c=s<=0?C.teal:s<=2?C.gold:C.coral;
     return{score:s,label:r,detail:"If low: D-dimer to rule out. If moderate/high: duplex USS.",color:c};
   }},

  {id:"wells_pe",cat:"Vascular",icon:"🫁",name:"Wells (PE)",
   desc:"Pre-test probability of pulmonary embolism",ref:"Wells et al. 2001",
   fields:[
     {k:"clinical_dvt",label:"Clinical signs / symptoms of DVT (+3)",type:"checkbox"},
     {k:"alt_less",label:"PE most likely diagnosis or equally likely (+3)",type:"checkbox"},
     {k:"hr",label:"Heart rate > 100 bpm (+1.5)",type:"checkbox"},
     {k:"immob",label:"Immobilisation ≥ 3 days OR surgery in past 4 weeks (+1.5)",type:"checkbox"},
     {k:"prev_dvt_pe",label:"Previous DVT or PE (+1.5)",type:"checkbox"},
     {k:"haemoptysis",label:"Haemoptysis (+1)",type:"checkbox"},
     {k:"malignancy",label:"Malignancy — treatment within 6 months or palliative (+1)",type:"checkbox"},
   ],
   compute(v){
     const s=(v.clinical_dvt?3:0)+(v.alt_less?3:0)+(v.hr?1.5:0)+(v.immob?1.5:0)+(v.prev_dvt_pe?1.5:0)+(v.haemoptysis?1:0)+(v.malignancy?1:0);
     const r=s<2?"Low probability (~1.3%)":s<7?"Moderate probability (~16.2%)":"High probability (~37.5%)";
     const c=s<2?C.teal:s<7?C.gold:C.coral;
     return{score:s,label:r,detail:"Low: D-dimer. Moderate: CT-PA or V/Q. High: CT-PA directly.",color:c};
   }},

  {id:"pesi",cat:"Vascular",icon:"📊",name:"PESI Score",
   desc:"Pulmonary Embolism Severity Index",ref:"JAMA 2005",
   fields:[
     {k:"age",label:"Age (years)",type:"number",min:18,max:120},
     {k:"male",label:"Male sex (+10)",type:"checkbox"},
     {k:"cancer",label:"Cancer (+30)",type:"checkbox"},
     {k:"hf",label:"Heart failure (+10)",type:"checkbox"},
     {k:"cpd",label:"Chronic pulmonary disease (+10)",type:"checkbox"},
     {k:"hr",label:"HR ≥ 110 bpm (+20)",type:"checkbox"},
     {k:"sbp",label:"SBP < 100 mmHg (+30)",type:"checkbox"},
     {k:"rr",label:"RR ≥ 30/min (+20)",type:"checkbox"},
     {k:"temp",label:"Temp < 36°C (+20)",type:"checkbox"},
     {k:"altered_ms",label:"Altered mental status (+60)",type:"checkbox"},
     {k:"spo2",label:"SpO₂ < 90% (+20)",type:"checkbox"},
   ],
   compute(v){
     let s=+(v.age||0);
     s+=(v.male?10:0)+(v.cancer?30:0)+(v.hf?10:0)+(v.cpd?10:0)+(v.hr?20:0)+(v.sbp?30:0)+(v.rr?20:0)+(v.temp?20:0)+(v.altered_ms?60:0)+(v.spo2?20:0);
     const cls=s<=65?"I":s<=85?"II":s<=105?"III":s<=125?"IV":"V";
     const risk=s<=65?"Very low (0.0–1.6%)":s<=85?"Low (1.7–3.5%)":s<=105?"Moderate (3.2–7.1%)":s<=125?"High (4.0–11.4%)":"Very high (10.0–24.5%)";
     const c=s<=65?C.teal:s<=85?C.green:s<=105?C.gold:s<=125?C.orange:C.coral;
     return{score:s,label:`Class ${cls} — ${risk}`,detail:"30-day mortality estimate",color:c};
   }},

  {id:"killip",cat:"Cardiac",icon:"🏥",name:"Killip Classification",
   desc:"Heart failure severity in acute MI",ref:"Killip & Kimball 1967",
   fields:[{k:"cls",label:"Clinical Class",type:"select",options:[
     "I — No clinical signs of HF","II — Rales < 50%, S3 gallop, JVD",
     "III — Pulmonary oedema (rales > 50% of lung fields)","IV — Cardiogenic shock"
   ]}],
   compute(v){
     const cls=+(v.cls?.charAt(0)||1);
     const mort=["<6%","6–17%","38%","60–80%"][cls-1];
     const c=[C.teal,C.gold,C.orange,C.coral][cls-1];
     return{score:`Class ${cls}`,label:`30-day mortality: ${mort}`,detail:"Assess volume status and initiate appropriate management",color:c};
   }},

  {id:"shock_index",cat:"Cardiac",icon:"⚡",name:"Shock Index",
   desc:"Early haemodynamic deterioration",ref:"Allgöwer & Burri 1967",
   fields:[
     {k:"hr",label:"Heart Rate (bpm)",type:"number",min:0,max:300},
     {k:"sbp",label:"Systolic BP (mmHg)",type:"number",min:0,max:300},
   ],
   compute(v){
     const si=((+v.hr||0)/((+v.sbp||1))).toFixed(2);
     const r=si<0.6?"Normal":si<1.0?"Mild haemodynamic compromise":si<1.4?"Moderate — consider resuscitation":"Severe — activate trauma/haemorrhage protocol";
     const c=si<0.6?C.teal:si<1.0?C.gold:si<1.4?C.orange:C.coral;
     return{score:si,label:r,detail:"SI > 1.0 = mortality ↑ significantly",color:c};
   }},

  // ── NEUROLOGY ──────────────────────────────────────────────
  {id:"gcs",cat:"Neurology",icon:"🧠",name:"Glasgow Coma Scale",
   desc:"Level of consciousness assessment",ref:"Teasdale & Jennett 1974",
   fields:[
     {k:"eye",label:"Eye Opening",type:"select",options:["4 — Spontaneous","3 — To voice","2 — To pain","1 — None"]},
     {k:"verbal",label:"Verbal Response",type:"select",options:["5 — Oriented","4 — Confused","3 — Inappropriate words","2 — Sounds","1 — None"]},
     {k:"motor",label:"Motor Response",type:"select",options:["6 — Obeys commands","5 — Localises pain","4 — Withdraws","3 — Abnormal flexion","2 — Extension","1 — None"]},
   ],
   compute(v){
     const s=(+(v.eye?.charAt(0)||1))+(+(v.verbal?.charAt(0)||1))+(+(v.motor?.charAt(0)||1));
     const r=s<=8?"Severe TBI (coma — consider intubation)":s<=12?"Moderate TBI":"Mild / No TBI";
     const c=s<=8?C.coral:s<=12?C.gold:C.teal;
     return{score:s,label:r,detail:`E${+(v.eye?.charAt(0)||1)}V${+(v.verbal?.charAt(0)||1)}M${+(v.motor?.charAt(0)||1)}`,color:c};
   }},

  {id:"nihss",cat:"Neurology",icon:"🎯",name:"NIHSS — Simplified",
   desc:"Stroke severity & tPA eligibility indicator",ref:"Brott et al. 1989",
   fields:[
     {k:"loc",label:"1a. Level of consciousness",type:"select",options:["0 — Alert","1 — Not alert but arousable","2 — Requires repeated stimulation","3 — Unresponsive"]},
     {k:"gaze",label:"2. Best gaze",type:"select",options:["0 — Normal","1 — Partial gaze palsy","2 — Forced deviation"]},
     {k:"visual",label:"3. Visual",type:"select",options:["0 — No visual loss","1 — Partial hemianopia","2 — Complete hemianopia","3 — Bilateral blindness"]},
     {k:"facial",label:"4. Facial palsy",type:"select",options:["0 — Normal","1 — Minor","2 — Partial","3 — Complete"]},
     {k:"arm_l",label:"5a. Left arm motor",type:"select",options:["0 — No drift","1 — Drift","2 — Some effort against gravity","3 — No effort against gravity","4 — No movement","UN — Untestable"]},
     {k:"arm_r",label:"5b. Right arm motor",type:"select",options:["0 — No drift","1 — Drift","2 — Some effort against gravity","3 — No effort against gravity","4 — No movement","UN — Untestable"]},
     {k:"leg_l",label:"6a. Left leg motor",type:"select",options:["0 — No drift","1 — Drift","2 — Some effort against gravity","3 — No effort against gravity","4 — No movement","UN — Untestable"]},
     {k:"leg_r",label:"6b. Right leg motor",type:"select",options:["0 — No drift","1 — Drift","2 — Some effort against gravity","3 — No effort against gravity","4 — No movement","UN — Untestable"]},
     {k:"ataxia",label:"7. Limb ataxia",type:"select",options:["0 — Absent","1 — One limb","2 — Two limbs"]},
     {k:"sensory",label:"8. Sensory",type:"select",options:["0 — Normal","1 — Mild–moderate loss","2 — Severe or total loss"]},
     {k:"language",label:"9. Best language",type:"select",options:["0 — No aphasia","1 — Mild–moderate","2 — Severe","3 — Mute / global aphasia"]},
     {k:"dysarthria",label:"10. Dysarthria",type:"select",options:["0 — Normal","1 — Mild–moderate","2 — Severe","UN — Intubated"]},
     {k:"neglect",label:"11. Extinction / inattention",type:"select",options:["0 — No abnormality","1 — Partial neglect","2 — Complete neglect"]},
   ],
   compute(v){
     const fields=[v.loc,v.gaze,v.visual,v.facial,v.arm_l,v.arm_r,v.leg_l,v.leg_r,v.ataxia,v.sensory,v.language,v.dysarthria,v.neglect];
     const s=fields.reduce((a,x)=>{const n=+(x?.charAt(0)||0); return a+(isNaN(n)?0:n);},0);
     const r=s===0?"No stroke symptoms":s<=4?"Minor stroke":s<=15?"Moderate stroke":s<=20?"Moderate–severe":"Severe stroke";
     const c=s===0?C.teal:s<=4?C.green:s<=15?C.gold:s<=20?C.orange:C.coral;
     return{score:s,label:r,detail:"0–42 scale · Consider tPA if 2–22 and within 4.5 h",color:c};
   }},

  {id:"abcd2",cat:"Neurology",icon:"⏰",name:"ABCD² Score",
   desc:"Short-term stroke risk after TIA",ref:"Johnston et al. Lancet 2007",
   fields:[
     {k:"age",label:"A — Age ≥ 60 years (+1)",type:"checkbox"},
     {k:"bp",label:"B — BP ≥ 140/90 on presentation (+1)",type:"checkbox"},
     {k:"clinical",label:"C — Clinical features",type:"select",options:["0 — Other symptom","1 — Speech disturbance without weakness","2 — Unilateral weakness"]},
     {k:"duration",label:"D — Duration",type:"select",options:["0 — < 10 minutes","1 — 10–59 minutes","2 — ≥ 60 minutes"]},
     {k:"diabetes",label:"D — Diabetes (+1)",type:"checkbox"},
   ],
   compute(v){
     const s=(v.age?1:0)+(v.bp?1:0)+(+(v.clinical?.charAt(0)||0))+(+(v.duration?.charAt(0)||0))+(v.diabetes?1:0);
     const r=s<=3?"Low — 2-day stroke risk ~1%":s<=5?"Moderate — 2-day risk ~4%":"High — 2-day risk ~8%";
     const c=s<=3?C.teal:s<=5?C.gold:C.coral;
     return{score:s,label:r,detail:"Scores ≥ 4 generally warrant admission for work-up",color:c};
   }},

  {id:"hunt_hess",cat:"Neurology",icon:"🔴",name:"Hunt & Hess Scale",
   desc:"Subarachnoid haemorrhage severity",ref:"Hunt & Hess 1968",
   fields:[{k:"grade",label:"Clinical Grade",type:"select",options:[
     "I — Asymptomatic / mild headache","II — Moderate–severe headache, no neuro deficit",
     "III — Drowsy, mild focal deficit","IV — Stupor, moderate–severe hemiparesis",
     "V — Deep coma, decerebrate posturing"
   ]}],
   compute(v){
     const g=+(v.grade?.charAt(0)||1);
     const mort=["~5%","~10%","~20%","~40%","~80%"][g-1];
     const c=[C.teal,C.green,C.gold,C.orange,C.coral][g-1];
     return{score:`Grade ${g}`,label:`30-day mortality: ${mort}`,detail:"Grade I–II: early surgery favourable. Grade IV–V: defer if possible.",color:c};
   }},

  {id:"canadian_ct",cat:"Neurology",icon:"📷",name:"Canadian CT Head Rule",
   desc:"CT head necessity in minor head injury",ref:"Stiell et al. Lancet 2001",
   fields:[
     {k:"gcs_14_2h",label:"GCS score < 15 at 2 h after injury (HIGH RISK)",type:"checkbox"},
     {k:"suspected_open",label:"Suspected open / depressed skull fracture (HIGH RISK)",type:"checkbox"},
     {k:"signs_base",label:"Signs of basal skull fracture (HIGH RISK)",type:"checkbox"},
     {k:"vomit2",label:"Vomiting ≥ 2 episodes (HIGH RISK)",type:"checkbox"},
     {k:"age65",label:"Age ≥ 65 years (HIGH RISK)",type:"checkbox"},
     {k:"amnesia_30",label:"Amnesia before impact ≥ 30 min (MEDIUM RISK)",type:"checkbox"},
     {k:"dangerous_mech",label:"Dangerous mechanism (pedestrian, ejection, fall > 3 ft) (MEDIUM RISK)",type:"checkbox"},
   ],
   compute(v){
     const high=[v.gcs_14_2h,v.suspected_open,v.signs_base,v.vomit2,v.age65].some(Boolean);
     const medium=[v.amnesia_30,v.dangerous_mech].some(Boolean);
     if(high) return{score:"HIGH",label:"CT required — high-risk factor present",detail:"Risk of neurosurgical intervention",color:C.coral};
     if(medium) return{score:"MEDIUM",label:"CT required — medium-risk factor present",detail:"Risk of brain injury on CT",color:C.gold};
     return{score:"LOW",label:"CT not required — no risk factors",detail:"Applies only to GCS 13–15, no coagulopathy",color:C.teal};
   }},

  // ── SEPSIS / CRITICAL CARE ─────────────────────────────────
  {id:"qsofa",cat:"Sepsis",icon:"🦠",name:"qSOFA Score",
   desc:"Rapid bedside sepsis screen",ref:"Singer et al. JAMA 2016",
   fields:[
     {k:"rr",label:"Respiratory rate ≥ 22/min",type:"checkbox"},
     {k:"ams",label:"Altered mental status (GCS < 15)",type:"checkbox"},
     {k:"sbp",label:"SBP ≤ 100 mmHg",type:"checkbox"},
   ],
   compute(v){
     const s=[v.rr,v.ams,v.sbp].filter(Boolean).length;
     const r=s<2?"Negative — low risk of sepsis organ dysfunction":s===2?"Positive (score 2) — consider sepsis work-up":"Positive (score 3) — high risk — activate Sepsis-3 bundle";
     const c=s<2?C.teal:s===2?C.gold:C.coral;
     return{score:s,label:r,detail:"qSOFA ≥ 2 = prompt evaluation for sepsis",color:c};
   }},

  {id:"sofa",cat:"Sepsis",icon:"📊",name:"SOFA Score",
   desc:"Sequential Organ Failure Assessment — sepsis severity",ref:"Vincent et al. ICM 1996",
   fields:[
     {k:"pao2_fio2",label:"PaO₂/FiO₂ ratio",type:"select",options:["4 — < 100 with vent","3 — 100–199 with vent","2 — 200–299","1 — 300–399","0 — ≥ 400"]},
     {k:"platelets",label:"Platelets (×10³/µL)",type:"select",options:["4 — < 20","3 — 20–49","2 — 50–99","1 — 100–149","0 — ≥ 150"]},
     {k:"bilirubin",label:"Bilirubin (mg/dL)",type:"select",options:["4 — ≥ 12","3 — 6.0–11.9","2 — 2.0–5.9","1 — 1.2–1.9","0 — < 1.2"]},
     {k:"map",label:"MAP / Vasopressor use",type:"select",options:["4 — Dopamine > 15 OR Epi/Norepi > 0.1","3 — Dopamine > 5 OR Epi/Norepi ≤ 0.1","2 — Dopamine ≤ 5 OR Dobutamine","1 — MAP < 70 mmHg","0 — MAP ≥ 70 mmHg"]},
     {k:"gcs_sofa",label:"GCS",type:"select",options:["4 — < 6","3 — 6–9","2 — 10–12","1 — 13–14","0 — 15"]},
     {k:"creatinine",label:"Creatinine (mg/dL) or UO",type:"select",options:["4 — > 5.0 OR UO < 200 mL/d","3 — 3.5–4.9 OR UO < 500 mL/d","2 — 2.0–3.4","1 — 1.2–1.9","0 — < 1.2"]},
   ],
   compute(v){
     const s=[v.pao2_fio2,v.platelets,v.bilirubin,v.map,v.gcs_sofa,v.creatinine].reduce((a,x)=>a+(+(x?.charAt(0)||0)),0);
     const mort=s<2?"<10%":s<8?"15–20%":s<12?"40–60%":"80–95%";
     const c=s<2?C.teal:s<8?C.gold:s<12?C.orange:C.coral;
     return{score:s,label:`Predicted mortality: ${mort}`,detail:"Sepsis = suspected infection + SOFA ↑ ≥ 2",color:c};
   }},

  {id:"curb65",cat:"Sepsis",icon:"🫁",name:"CURB-65",
   desc:"Pneumonia severity & admission decision",ref:"Lim et al. Thorax 2003",
   fields:[
     {k:"confusion",label:"C — New confusion (AMT ≤ 8 or new disorientation)",type:"checkbox"},
     {k:"urea",label:"U — BUN > 19 mg/dL (urea > 7 mmol/L)",type:"checkbox"},
     {k:"rr",label:"R — Respiratory rate ≥ 30/min",type:"checkbox"},
     {k:"bp",label:"B — SBP < 90 or DBP ≤ 60 mmHg",type:"checkbox"},
     {k:"age65",label:"65 — Age ≥ 65 years",type:"checkbox"},
   ],
   compute(v){
     const s=[v.confusion,v.urea,v.rr,v.bp,v.age65].filter(Boolean).length;
     const r=s<=1?"Low severity (30-day mortality ~2%) — consider outpatient treatment":s===2?"Moderate severity (~9%) — short hospitalisation or supervised outpatient":"Severe pneumonia (~22%) — hospitalise, consider ICU if score 4–5";
     const c=s<=1?C.teal:s===2?C.gold:C.coral;
     return{score:s,label:r,detail:"PSI/PORT preferred for outpatient decision in low risk",color:c};
   }},

  {id:"ranson",cat:"Sepsis",icon:"🔬",name:"Ranson's Criteria",
   desc:"Acute pancreatitis severity",ref:"Ranson et al. Surg Gynecol Obstet 1974",
   fields:[
     {k:"age",label:"On Admission: Age > 55 years",type:"checkbox"},
     {k:"wbc",label:"On Admission: WBC > 16,000/µL",type:"checkbox"},
     {k:"glucose",label:"On Admission: Glucose > 200 mg/dL",type:"checkbox"},
     {k:"ldh",label:"On Admission: LDH > 350 IU/L",type:"checkbox"},
     {k:"ast",label:"On Admission: AST > 250 IU/L",type:"checkbox"},
     {k:"hct",label:"At 48 h: HCT decrease > 10%",type:"checkbox"},
     {k:"bun",label:"At 48 h: BUN increase > 5 mg/dL",type:"checkbox"},
     {k:"ca",label:"At 48 h: Calcium < 8 mg/dL",type:"checkbox"},
     {k:"pao2",label:"At 48 h: PaO₂ < 60 mmHg",type:"checkbox"},
     {k:"base_deficit",label:"At 48 h: Base deficit > 4 mEq/L",type:"checkbox"},
     {k:"fluids",label:"At 48 h: Fluid sequestration > 6 L",type:"checkbox"},
   ],
   compute(v){
     const s=[v.age,v.wbc,v.glucose,v.ldh,v.ast,v.hct,v.bun,v.ca,v.pao2,v.base_deficit,v.fluids].filter(Boolean).length;
     const r=s<=2?"Mild pancreatitis — mortality < 1%":s<=4?"Moderate — mortality 15%":s<=6?"Severe — mortality 40%":"Critical — mortality ~100%";
     const c=s<=2?C.teal:s<=4?C.gold:s<=6?C.orange:C.coral;
     return{score:s,label:r,detail:"Scores ≥ 3 = severe disease — consider ICU care",color:c};
   }},

  {id:"bisap",cat:"Sepsis",icon:"⚗️",name:"BISAP Score",
   desc:"Bedside pancreatitis severity at 24 h",ref:"Wu et al. AJG 2009",
   fields:[
     {k:"bun",label:"B — BUN > 25 mg/dL",type:"checkbox"},
     {k:"ams",label:"I — Impaired mental status (GCS < 15)",type:"checkbox"},
     {k:"sirs",label:"S — SIRS criteria (≥ 2 of: Temp, RR, HR, WBC abnormal)",type:"checkbox"},
     {k:"age",label:"A — Age > 60 years",type:"checkbox"},
     {k:"pleural",label:"P — Pleural effusion on imaging",type:"checkbox"},
   ],
   compute(v){
     const s=[v.bun,v.ams,v.sirs,v.age,v.pleural].filter(Boolean).length;
     const mort=s===0?"<1%":s===1?"<1%":s===2?"~2%":s===3?"~5–8%":s===4?"~13%":"~22%";
     const c=s<=1?C.teal:s<=2?C.green:s<=3?C.gold:s<=4?C.orange:C.coral;
     return{score:s,label:`Mortality: ${mort}`,detail:"BISAP ≥ 3 = severe acute pancreatitis",color:c};
   }},

  // ── RENAL / METABOLIC ──────────────────────────────────────
  {id:"egfr",cat:"Renal",icon:"🫘",name:"eGFR (CKD-EPI)",
   desc:"Estimated glomerular filtration rate",ref:"CKD-EPI 2021",
   fields:[
     {k:"cr",label:"Serum Creatinine (mg/dL)",type:"number",min:0.1,max:30},
     {k:"age",label:"Age (years)",type:"number",min:18,max:120},
     {k:"female",label:"Female sex",type:"checkbox"},
   ],
   compute(v){
     const cr=+v.cr||0; const age=+v.age||30; const sex=v.female?1:0;
     if(!cr||!age) return{score:"—",label:"Enter creatinine and age",detail:"",color:C.txt3};
     const k=sex?0.7:0.9; const a=sex?-0.241:-0.302;
     const egfr=Math.round(142*Math.pow(Math.min(cr/k,1),a)*Math.pow(Math.max(cr/k,1),-1.200)*Math.pow(0.9938,age)*(sex?1.012:1));
     const stage=egfr>=90?"G1 — Normal":egfr>=60?"G2 — Mildly reduced":egfr>=45?"G3a — Mild–mod reduced":egfr>=30?"G3b — Mod–severely reduced":egfr>=15?"G4 — Severely reduced":"G5 — Kidney failure";
     const c=egfr>=60?C.teal:egfr>=45?C.gold:egfr>=30?C.orange:C.coral;
     return{score:`${egfr} mL/min/1.73m²`,label:stage,detail:"CKD-EPI 2021 equation (race-free)",color:c};
   }},

  {id:"cockcroft",cat:"Renal",icon:"💉",name:"Cockcroft-Gault CrCl",
   desc:"Creatinine clearance for drug dosing",ref:"Cockcroft & Gault 1976",
   fields:[
     {k:"age",label:"Age (years)",type:"number",min:18,max:120},
     {k:"weight",label:"Actual Body Weight (kg)",type:"number",min:20,max:300},
     {k:"cr",label:"Serum Creatinine (mg/dL)",type:"number",min:0.1,max:30},
     {k:"female",label:"Female sex",type:"checkbox"},
   ],
   compute(v){
     const age=+v.age||0,wt=+v.weight||0,cr=+v.cr||1;
     if(!age||!wt) return{score:"—",label:"Enter all values",detail:"",color:C.txt3};
     const crcl=Math.round(((140-age)*wt/(72*cr))*(v.female?0.85:1));
     const dose=crcl>=50?"Standard dosing":"Reduce dose — see drug-specific recommendations";
     const c=crcl>=50?C.teal:crcl>=30?C.gold:crcl>=15?C.orange:C.coral;
     return{score:`${crcl} mL/min`,label:dose,detail:"Used for drug dose adjustment — not CKD staging",color:c};
   }},

  {id:"anion_gap",cat:"Renal",icon:"⚗️",name:"Anion Gap",
   desc:"Metabolic acidosis work-up",ref:"Standard formula",
   fields:[
     {k:"na",label:"Sodium (mEq/L)",type:"number",min:100,max:200},
     {k:"cl",label:"Chloride (mEq/L)",type:"number",min:60,max:140},
     {k:"bicarb",label:"Bicarbonate (mEq/L)",type:"number",min:1,max:45},
     {k:"albumin",label:"Albumin (g/dL) — for correction",type:"number",min:0.1,max:6},
   ],
   compute(v){
     const na=+v.na||0,cl=+v.cl||0,hco3=+v.bicarb||0,alb=+v.albumin||4;
     const ag=(na-cl-hco3);
     const correctedAG=Math.round(ag+2.5*(4-alb));
     const elevated=correctedAG>12;
     const r=elevated?"Elevated AG — consider MUDPILES (Methanol, Uraemia, DKA, Propylene glycol, Isoniazid, Lactic acidosis, Ethylene glycol, Salicylates)":"Normal AG — consider non-AG acidosis (HARDUPS)";
     const c=elevated?C.coral:C.teal;
     return{score:`AG: ${ag} (corrected: ${correctedAG})`,label:r,detail:"Normal AG: 8–12 mEq/L (albumin-corrected: 8–12)",color:c};
   }},

  {id:"delta_delta",cat:"Renal",icon:"🔬",name:"Delta-Delta Ratio",
   desc:"Identifies mixed acid-base disorders",ref:"Standard formula",
   fields:[
     {k:"ag",label:"Anion Gap (calculated)",type:"number",min:0,max:50},
     {k:"bicarb",label:"Bicarbonate (mEq/L)",type:"number",min:1,max:45},
   ],
   compute(v){
     const ag=+v.ag||12,hco3=+v.bicarb||24;
     const delta_ag=ag-12; const delta_bicarb=24-hco3;
     const dd=(delta_bicarb!==0?delta_ag/delta_bicarb:0).toFixed(2);
     const r=dd<0.4?"Additional non-AG metabolic acidosis":dd<1?"Mixed AG + non-AG metabolic acidosis":dd<2?"Pure AG metabolic acidosis":"Metabolic alkalosis co-existing with AG acidosis";
     const c=dd<0.4||dd>=2?C.coral:dd<1?C.orange:C.teal;
     return{score:`Δ/Δ = ${dd}`,label:r,detail:"<1 = extra non-AG acidosis | 1–2 = pure AGMA | >2 = concurrent metabolic alkalosis",color:c};
   }},

  {id:"fena",cat:"Renal",icon:"🧪",name:"FENa",
   desc:"Fractional excretion of sodium — AKI cause",ref:"Standard formula",
   fields:[
     {k:"s_na",label:"Serum Sodium (mEq/L)",type:"number",min:100,max:180},
     {k:"u_na",label:"Urine Sodium (mEq/L)",type:"number",min:0,max:200},
     {k:"s_cr",label:"Serum Creatinine (mg/dL)",type:"number",min:0.1,max:30},
     {k:"u_cr",label:"Urine Creatinine (mg/dL)",type:"number",min:1,max:500},
   ],
   compute(v){
     const sna=+v.s_na,una=+v.u_na,scr=+v.s_cr,ucr=+v.u_cr;
     if(!sna||!una||!scr||!ucr) return{score:"—",label:"Enter all values",detail:"",color:C.txt3};
     const fena=((una*scr)/(sna*ucr)*100).toFixed(2);
     const r=fena<1?"Pre-renal AKI — FENa < 1% (intrinsic if ATN superimposed)":fena<2?"Borderline — clinical correlation required":"Intrinsic renal disease / ATN — FENa ≥ 2%";
     const c=fena<1?C.gold:fena<2?C.orange:C.coral;
     return{score:`FENa = ${fena}%`,label:r,detail:"Unreliable if diuretics given — use FEUrea instead",color:c};
   }},

  // ── TRAUMA ──────────────────────────────────────────────────
  {id:"rts",cat:"Trauma",icon:"🚑",name:"Revised Trauma Score",
   desc:"Physiological trauma severity score",ref:"Champion et al. 1989",
   fields:[
     {k:"rr",label:"Respiratory Rate (/min)",type:"select",options:["4 — 10–29/min","3 — > 29/min","2 — 6–9/min","1 — 1–5/min","0 — None"]},
     {k:"sbp",label:"Systolic BP (mmHg)",type:"select",options:["4 — > 89","3 — 76–89","2 — 50–75","1 — 1–49","0 — None"]},
     {k:"gcs_cat",label:"Glasgow Coma Scale",type:"select",options:["4 — 13–15","3 — 9–12","2 — 6–8","1 — 4–5","0 — 3"]},
   ],
   compute(v){
     const s=(+(v.rr?.charAt(0)||0))+(+(v.sbp?.charAt(0)||0))+(+(v.gcs_cat?.charAt(0)||0));
     const surv=s>=11?"95%":s>=8?"85–95%":s>=5?"60–85%":"<50%";
     const c=s>=11?C.teal:s>=8?C.gold:s>=5?C.orange:C.coral;
     return{score:s,label:`Predicted survival: ${surv}`,detail:"Score 0–12 · Lower = more severe injury",color:c};
   }},

  {id:"abc_score",cat:"Trauma",icon:"🩹",name:"ABC Score",
   desc:"Assessment of Blood Consumption — MTP activation",ref:"Nunez et al. 2009",
   fields:[
     {k:"hr",label:"HR > 120 bpm (+1)",type:"checkbox"},
     {k:"sbp",label:"SBP ≤ 90 mmHg (+1)",type:"checkbox"},
     {k:"pen",label:"Penetrating mechanism (+1)",type:"checkbox"},
     {k:"fast",label:"Positive FAST (free fluid on USS) (+1)",type:"checkbox"},
   ],
   compute(v){
     const s=[v.hr,v.sbp,v.pen,v.fast].filter(Boolean).length;
     const r=s<2?"MTP activation unlikely — ongoing monitoring":"MTP activation indicated — initiate 1:1:1 transfusion protocol";
     const c=s<2?C.teal:C.coral;
     return{score:s,label:r,detail:"Score ≥ 2 = sensitivity 75%, specificity 86% for massive transfusion",color:c};
   }},

  {id:"burn_tbsa",cat:"Trauma",icon:"🔥",name:"Burns — %TBSA (Rule of Nines)",
   desc:"Burn area estimation for resuscitation",ref:"Wallace 1951",
   fields:[
     {k:"head",label:"Head & neck (%)",type:"number",min:0,max:9},
     {k:"chest",label:"Anterior trunk (%)",type:"number",min:0,max:18},
     {k:"back",label:"Posterior trunk (%)",type:"number",min:0,max:18},
     {k:"arm_l",label:"Left arm (%)",type:"number",min:0,max:9},
     {k:"arm_r",label:"Right arm (%)",type:"number",min:0,max:9},
     {k:"leg_l",label:"Left leg (%)",type:"number",min:0,max:18},
     {k:"leg_r",label:"Right leg (%)",type:"number",min:0,max:18},
     {k:"perineum",label:"Perineum (%)",type:"number",min:0,max:1},
   ],
   compute(v){
     const tbsa=[v.head,v.chest,v.back,v.arm_l,v.arm_r,v.leg_l,v.leg_r,v.perineum].reduce((a,x)=>a+(+x||0),0);
     return{score:`${tbsa}% TBSA`,label:tbsa>=20?"Major burns — activate burns team, consider transfer":tbsa>=10?"Moderate — burns unit input recommended":"Minor burns — outpatient management may be appropriate",detail:"Parkland formula: 4 mL × kg × %TBSA in first 24h — link to dosing",color:tbsa>=20?C.coral:tbsa>=10?C.gold:C.teal};
   }},

  {id:"parkland",cat:"Trauma",icon:"💧",name:"Parkland Formula",
   desc:"Fluid resuscitation for burns",ref:"Baxter 1968",medRef:true,
   fields:[
     {k:"weight",label:"Weight (kg)",type:"number",min:1,max:300},
     {k:"tbsa",label:"% TBSA Burns (2nd/3rd degree only)",type:"number",min:1,max:100},
   ],
   compute(v){
     const wt=+v.weight||0,tbsa=+v.tbsa||0;
     if(!wt||!tbsa) return{score:"—",label:"Enter weight and TBSA",detail:"",color:C.txt3};
     const total=Math.round(4*wt*tbsa);
     const first8h=Math.round(total/2), next16h=Math.round(total/2);
     const rate8h=Math.round(first8h/8);
     return{score:`${total} mL Lactated Ringer's`,label:`Give ${first8h} mL in first 8 h (${rate8h} mL/h), then ${next16h} mL over next 16 h`,detail:"Start clock from time of injury, not arrival. Add colloid after 24 h.",color:C.blue};
   }},

  // ── OB/GYN ─────────────────────────────────────────────────
  {id:"bishop",cat:"OB/GYN",icon:"🤰",name:"Bishop Score",
   desc:"Cervical ripeness and induction success prediction",ref:"Bishop 1964",
   fields:[
     {k:"dilation",label:"Dilation (cm)",type:"select",options:["0 — Closed","1 — 1–2 cm","2 — 3–4 cm","3 — ≥ 5 cm"]},
     {k:"effacement",label:"Effacement (%)",type:"select",options:["0 — 0–30%","1 — 40–50%","2 — 60–70%","3 — ≥ 80%"]},
     {k:"station",label:"Fetal Station",type:"select",options:["0 — –3","1 — –2","2 — –1 / 0","3 — +1 / +2"]},
     {k:"consistency",label:"Cervical Consistency",type:"select",options:["0 — Firm","1 — Medium","2 — Soft"]},
     {k:"position",label:"Cervical Position",type:"select",options:["0 — Posterior","1 — Mid","2 — Anterior"]},
   ],
   compute(v){
     const s=[v.dilation,v.effacement,v.station,v.consistency,v.position].reduce((a,x)=>a+(+(x?.charAt(0)||0)),0);
     const r=s>=8?"Favourable — induction likely successful (success rate > 90%)":s>=6?"Moderate — induction usually successful":s<=5?"Unfavourable — consider cervical ripening agent first":"—";
     const c=s>=8?C.teal:s>=6?C.gold:C.coral;
     return{score:s,label:r,detail:"Score < 6 in nulliparous — high failure rate with oxytocin alone",color:c};
   }},

  {id:"apgar",cat:"OB/GYN",icon:"👶",name:"Apgar Score",
   desc:"Neonatal assessment at 1 and 5 minutes",ref:"Virginia Apgar 1953",
   fields:[
     {k:"appearance",label:"A — Appearance (skin colour)",type:"select",options:["0 — Blue/pale all over","1 — Body pink, extremities blue","2 — Pink all over"]},
     {k:"pulse",label:"P — Pulse (HR)",type:"select",options:["0 — Absent","1 — < 100 bpm","2 — ≥ 100 bpm"]},
     {k:"grimace",label:"G — Grimace (reflex irritability)",type:"select",options:["0 — No response","1 — Grimace only","2 — Cry / cough / sneeze"]},
     {k:"activity",label:"A — Activity (muscle tone)",type:"select",options:["0 — Limp","1 — Some flexion","2 — Active flexion"]},
     {k:"respiration",label:"R — Respiration",type:"select",options:["0 — Absent","1 — Weak / irregular","2 — Strong cry"]},
   ],
   compute(v){
     const s=[v.appearance,v.pulse,v.grimace,v.activity,v.respiration].reduce((a,x)=>a+(+(x?.charAt(0)||0)),0);
     const r=s>=7?"Reassuring — routine post-delivery care":s>=4?"Moderately depressed — stimulate and provide O₂":s<4?"Severely depressed — neonatal resuscitation indicated":"—";
     const c=s>=7?C.teal:s>=4?C.gold:C.coral;
     return{score:s,label:r,detail:"Repeat at 5 min. If < 7 at 5 min, continue at 10, 15, 20 min.",color:c};
   }},

  {id:"ega",cat:"OB/GYN",icon:"📅",name:"Gestational Age (LMP)",
   desc:"Gestational age and EDD from last menstrual period",ref:"Naegele's Rule",
   fields:[{k:"lmp",label:"First day of last menstrual period",type:"date"}],
   compute(v){
     if(!v.lmp) return{score:"—",label:"Enter LMP date",detail:"",color:C.txt3};
     const lmp=new Date(v.lmp); const today=new Date();
     const days=Math.floor((today-lmp)/86400000);
     const weeks=Math.floor(days/7), rem=days%7;
     const edd=new Date(lmp); edd.setDate(edd.getDate()+280);
     const eddStr=edd.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
     const r=weeks<20?"1st/2nd trimester":weeks<28?"2nd trimester":weeks<37?"3rd trimester — pre-term period":weeks<42?"At term":"Post-term";
     return{score:`${weeks}w ${rem}d`,label:r,detail:`EDD: ${eddStr}`,color:weeks<37?C.gold:weeks<42?C.teal:C.orange};
   }},

  // ── PEDIATRIC ──────────────────────────────────────────────
  {id:"broselow",cat:"Pediatric",icon:"📏",name:"Broselow Length–Weight",
   desc:"Weight estimation from height for drug dosing",ref:"Broselow-Luten System",
   fields:[{k:"height",label:"Patient height / length (cm)",type:"number",min:46,max:150}],
   compute(v){
     const h=+v.height||0;
     const bands=[{max:55,color:"Grey",wt:3,zone:"3–5 kg"},{max:60,color:"Pink",wt:5.5,zone:"5–7 kg"},{max:68,color:"Red",wt:7,zone:"6–9 kg"},{max:77,color:"Purple",wt:9.5,zone:"8–11 kg"},{max:88,color:"Yellow",wt:12,zone:"10–14 kg"},{max:100,color:"White",wt:16,zone:"13–18 kg"},{max:111,color:"Blue",wt:20,zone:"16–23 kg"},{max:124,color:"Orange",wt:26,zone:"20–29 kg"},{max:135,color:"Green",wt:32,zone:"27–35 kg"},{max:150,color:"Tan",wt:40,zone:"30–40 kg"}];
     const band=bands.find(b=>h<=b.max)||bands[bands.length-1];
     return{score:`${band.color} band — ${band.wt} kg (${band.zone})`,label:"Use for weight-based drug dosing",detail:"Estimated weight: use for all paediatric drug calculations",color:C.teal};
   }},

  {id:"peds_vitals",cat:"Pediatric",icon:"📈",name:"Paediatric Normal Vitals",
   desc:"Age-based normal vital sign ranges",ref:"PALS / Harriet Lane",
   fields:[{k:"age",label:"Age of child",type:"select",options:["Neonate (0–28 d)","Infant (1–12 mo)","Toddler (1–3 yr)","Preschool (3–6 yr)","School age (6–12 yr)","Adolescent (12–18 yr)"]}],
   compute(v){
     const ranges={
       "Neonate":{hr:"100–160",rr:"30–60",sbp:"60–90"},
       "Infant":{hr:"100–160",rr:"25–50",sbp:"70–100"},
       "Toddler":{hr:"90–150",rr:"20–30",sbp:"80–110"},
       "Preschool":{hr:"80–140",rr:"20–25",sbp:"80–110"},
       "School":{hr:"70–120",rr:"15–20",sbp:"85–120"},
       "Adolescent":{hr:"60–100",rr:"12–20",sbp:"90–130"}};
     const key=Object.keys(ranges).find(k=>v.age?.startsWith(k))||"Infant";
     const r=ranges[key];
     return{score:v.age?.split(" (")[0]||"—",label:`HR: ${r.hr} · RR: ${r.rr} · SBP: ${r.sbp}`,detail:"Lower limit SBP (1–10 yr): 70 + (2 × age in years) mmHg",color:C.teal};
   }},

  {id:"peds_gcs",cat:"Pediatric",icon:"🧒",name:"Paediatric GCS",
   desc:"Modified GCS for children < 5 years",ref:"James & Trauner 1985",
   fields:[
     {k:"eye",label:"Eye Opening",type:"select",options:["4 — Spontaneous","3 — To voice","2 — To pain","1 — None"]},
     {k:"verbal",label:"Verbal (Modified)",type:"select",options:["5 — Smiles / coos / words age-appropriate","4 — Crying but consolable","3 — Persistent irritable cry","2 — Restless / agitated","1 — None"]},
     {k:"motor",label:"Motor Response",type:"select",options:["6 — Normal spontaneous movement","5 — Withdraws to touch","4 — Withdraws to pain","3 — Abnormal flexion","2 — Extension","1 — None"]},
   ],
   compute(v){
     const s=(+(v.eye?.charAt(0)||1))+(+(v.verbal?.charAt(0)||1))+(+(v.motor?.charAt(0)||1));
     const r=s<=8?"Severe (coma — airway management)":s<=12?"Moderate brain injury":"Mild brain injury";
     const c=s<=8?C.coral:s<=12?C.gold:C.teal;
     return{score:s,label:r,detail:"GCS ≤ 8 = consider early intubation",color:c};
   }},

  {id:"apnea_of_prematurity",cat:"Pediatric",icon:"🫁",name:"Newborn Respiratory Rate",
   desc:"Tachypnoea threshold for neonates",ref:"WHO / NRP",
   fields:[
     {k:"rr",label:"Respiratory Rate (/min)",type:"number",min:0,max:120},
     {k:"gest_age",label:"Gestational age at birth (weeks)",type:"number",min:23,max:42},
   ],
   compute(v){
     const rr=+v.rr||0; const ga=+v.gest_age||40;
     if(rr>=60) return{score:`${rr}/min`,label:"Tachypnoea — ≥ 60/min is abnormal in neonates",detail:"Assess for respiratory distress, infection, TTN, RDS",color:C.coral};
     if(rr<30) return{score:`${rr}/min`,label:"Bradypnoea — consider apnoea of prematurity",detail:ga<37?"Prematurity-related apnoea — caffeine citrate may be indicated":"Evaluate for neurological or metabolic cause",color:C.coral};
     return{score:`${rr}/min`,label:"Normal neonatal respiratory rate (30–60/min)",detail:"Continue clinical monitoring",color:C.teal};
   }},

  // ── WEIGHT-BASED DOSING (medRef:true) ─────────────────────
  {id:"tnk_dose",cat:"Dosing",icon:"💉",name:"TNK (Tenecteplase) Dose",
   desc:"Weight-based tenecteplase dosing for STEMI",ref:"ASSENT-2 Trial / FDA Label",medRef:true,
   fields:[{k:"weight",label:"Patient weight (kg)",type:"number",min:20,max:200}],
   compute(v){
     const wt=+v.weight||0;
     if(!wt) return{score:"—",label:"Enter patient weight",detail:"",color:C.txt3};
     const dose=wt<60?30:wt<70?35:wt<80?40:wt<90?45:50;
     const vol=dose/5;
     return{score:`${dose} mg (${vol} mL)`,label:"Single IV bolus over 5–10 seconds",detail:"Max 50 mg. Reconstitute with sterile water only. Age > 75: consider 50% dose reduction. ⚠ See medication reference for full contraindications.",color:C.teal};
   }},

  {id:"tpa_alteplase",cat:"Dosing",icon:"💊",name:"tPA Alteplase (Stroke)",
   desc:"IV alteplase for acute ischaemic stroke",ref:"NINDS / AHA Guidelines",medRef:true,
   fields:[{k:"weight",label:"Patient weight (kg)",type:"number",min:20,max:200}],
   compute(v){
     const wt=+v.weight||0;
     if(!wt) return{score:"—",label:"Enter patient weight",detail:"",color:C.txt3};
     const total=Math.min(Math.round(0.9*wt*10)/10,90);
     const bolus=Math.round(total*0.1*10)/10;
     const infusion=Math.round((total-bolus)*10)/10;
     return{score:`${total} mg total`,label:`Bolus: ${bolus} mg IV over 1 min → infusion: ${infusion} mg over 60 min`,detail:"Max 90 mg. Only in eligible patients within 4.5 h onset. ⚠ See medication reference for contraindications.",color:C.teal};
   }},

  {id:"heparin_wbp",cat:"Dosing",icon:"🩺",name:"Heparin Weight-Based",
   desc:"UFH dosing protocol for ACS/VTE",ref:"Raschke Nomogram",medRef:true,
   fields:[
     {k:"weight",label:"Patient weight (kg)",type:"number",min:20,max:300},
     {k:"indication",label:"Indication",type:"select",options:["ACS (target aPTT 50–70 s)","VTE treatment (target aPTT 60–100 s)"]},
   ],
   compute(v){
     const wt=+v.weight||0;
     if(!wt) return{score:"—",label:"Enter weight",detail:"",color:C.txt3};
     const isACS=v.indication?.includes("ACS");
     const bolus=Math.min(Math.round(60*wt),4000);
     const infRate=Math.min(Math.round(12*wt),1000);
     return{score:`Bolus: ${bolus} U IV`,label:`Infusion: ${infRate} U/h IV`,detail:`Target aPTT ${isACS?"50–70":"60–100"} s. ⚠ Check aPTT q6h. Adjust per hospital nomogram. See medication reference.`,color:C.teal};
   }},

  {id:"enoxaparin",cat:"Dosing",icon:"💉",name:"Enoxaparin (LMWH)",
   desc:"Enoxaparin weight-based dosing",ref:"ACOG / ACC/AHA Guidelines",medRef:true,
   fields:[
     {k:"weight",label:"Patient weight (kg)",type:"number",min:20,max:250},
     {k:"crcl",label:"CrCl (mL/min)",type:"number",min:5,max:200},
     {k:"indication",label:"Indication",type:"select",options:["VTE Treatment — 1 mg/kg SQ q12h","NSTEMI — 1 mg/kg SQ q12h","VTE Prophylaxis — 40 mg SQ daily"]},
   ],
   compute(v){
     const wt=+v.weight||0,crcl=+v.crcl||60;
     if(!wt) return{score:"—",label:"Enter weight",detail:"",color:C.txt3};
     const prophylaxis=v.indication?.includes("Prophylaxis");
     const dose=prophylaxis?40:Math.round(wt*1);
     const renalAdj=crcl<30&&!prophylaxis?"⚠ CrCl < 30 mL/min — use 1 mg/kg SQ DAILY (not BID)":crcl<30&&prophylaxis?"⚠ CrCl < 30 mL/min — reduce prophylaxis dose to 20 mg SQ daily":"Renal dose OK";
     return{score:`${dose} mg`,label:prophylaxis?"SQ once daily":renalAdj.includes("DAILY")?"SQ once daily":"SQ every 12 hours",detail:`${renalAdj}. Avoid if CrCl < 15. ⚠ See medication reference for anti-Xa monitoring.`,color:crcl<30?C.gold:C.teal};
   }},

  {id:"vancomycin",cat:"Dosing",icon:"🏥",name:"Vancomycin AUC/MIC",
   desc:"Vancomycin dosing for serious infections (AUC-guided)",ref:"ASHP/IDSA/SIDP Guidelines 2020",medRef:true,
   fields:[
     {k:"weight",label:"Actual body weight (kg)",type:"number",min:20,max:300},
     {k:"crcl",label:"CrCl (mL/min)",type:"number",min:5,max:250},
     {k:"indication",label:"Indication",type:"select",options:["Serious infection (MRSA)","Standard infection","Empirical / prophylaxis"]},
   ],
   compute(v){
     const wt=+v.weight||0,crcl=+v.crcl||80;
     if(!wt||!crcl) return{score:"—",label:"Enter weight and CrCl",detail:"",color:C.txt3};
     const loadingDose=Math.round(wt*25/250)*250;
     const interval=crcl>=60?"q8–12h":crcl>=30?"q24–48h":"q48h+ or avoid";
     return{score:`Loading dose: ${loadingDose} mg IV`,label:`Maintenance: 15–20 mg/kg IV ${interval}`,detail:"Target AUC24/MIC 400–600 for serious MRSA. ⚠ Monitor AUC with pharmacy. See medication reference.",color:C.teal};
   }},

  {id:"gentamicin",cat:"Dosing",icon:"⚗️",name:"Gentamicin (Extended Interval)",
   desc:"Once-daily aminoglycoside dosing",ref:"Hartford Nomogram",medRef:true,
   fields:[
     {k:"weight",label:"Actual body weight (kg)",type:"number",min:20,max:250},
     {k:"height",label:"Height (cm) — for IBW calculation",type:"number",min:100,max:220},
     {k:"crcl",label:"CrCl (mL/min)",type:"number",min:10,max:250},
     {k:"male",label:"Male sex",type:"checkbox"},
   ],
   compute(v){
     const wt=+v.weight||0,ht=+v.height||170,crcl=+v.crcl||80;
     if(!wt||!crcl) return{score:"—",label:"Enter values",detail:"",color:C.txt3};
     const ibw=v.male?(50+0.9*(ht-152.4)):(45.5+0.9*(ht-152.4));
     const dosWt=wt>(1.3*ibw)?Math.round(ibw+0.4*(wt-ibw)):Math.min(wt,ibw);
     const dose=Math.round(dosWt*5/10)*10;
     const interval=crcl>=60?"q24h":crcl>=40?"q36h":"q48h — consider alternative or pharmacist review";
     return{score:`${dose} mg IV`,label:`Infuse over 30–60 min ${interval}`,detail:"Use adjusted BW if obese. ⚠ Monitor trough level at 18 h. See medication reference.",color:crcl<40?C.gold:C.teal};
   }},

  {id:"ketamine_rsi",cat:"Dosing",icon:"🌙",name:"Ketamine (RSI)",
   desc:"Ketamine for rapid sequence intubation",ref:"ACEP / EM Standard of Care",medRef:true,
   fields:[
     {k:"weight",label:"Patient weight (kg)",type:"number",min:10,max:250},
     {k:"indication",label:"Indication",type:"select",options:["RSI induction","Procedural sedation","Pain (sub-dissociative)"]},
   ],
   compute(v){
     const wt=+v.weight||0;
     if(!wt) return{score:"—",label:"Enter patient weight",detail:"",color:C.txt3};
     const isRSI=v.indication?.includes("RSI"), isProc=v.indication?.includes("Procedural"), isPain=v.indication?.includes("Pain");
     let dose,route,notes;
     if(isRSI){dose=Math.round(wt*1.5);route="1–2 mg/kg IV (1.5 mg/kg typical)";notes="⚠ Use with succinylcholine/rocuronium. Caution in ↑ ICP (controversial). See medication reference.";}
     else if(isProc){dose=Math.round(wt*1);route="1–1.5 mg/kg IV over 1–2 min";notes="Titrate to effect. Have airway equipment ready. See medication reference.";}
     else{dose=Math.round(wt*0.3);route="0.1–0.5 mg/kg IV slow push";notes="Sub-dissociative analgesia. Onset 1–2 min. See medication reference.";}
     return{score:`${dose} mg`,label:route,detail:notes,color:C.teal};
   }},

  {id:"succinylcholine",cat:"Dosing",icon:"💪",name:"Succinylcholine (RSI)",
   desc:"Succinylcholine dosing for intubation",ref:"ACEP Guidelines",medRef:true,
   fields:[
     {k:"weight",label:"Patient weight (kg)",type:"number",min:10,max:250},
     {k:"peds",label:"Paediatric (< 10 years)",type:"checkbox"},
   ],
   compute(v){
     const wt=+v.weight||0;
     if(!wt) return{score:"—",label:"Enter weight",detail:"",color:C.txt3};
     const dose=v.peds?Math.round(wt*2):Math.round(wt*1.5);
     return{score:`${dose} mg IV`,label:v.peds?"2 mg/kg IV (paediatric dose)":"1–1.5 mg/kg IV (adult dose)",detail:"Onset 45–60 sec. Duration 8–12 min. ⚠ Contraindications: ↑ K⁺, burns, crush, denervation, myopathy. See medication reference.",color:C.teal};
   }},

  {id:"rocuronium",cat:"Dosing",icon:"💊",name:"Rocuronium (RSI / NMBA)",
   desc:"Rocuronium dosing for intubation and paralysis",ref:"ACEP / EM Standard",medRef:true,
   fields:[
     {k:"weight",label:"Patient weight (kg)",type:"number",min:10,max:300},
     {k:"indication",label:"Indication",type:"select",options:["RSI (high dose)","Routine intubation","Maintenance paralysis (ICU)"]},
   ],
   compute(v){
     const wt=+v.weight||0;
     if(!wt) return{score:"—",label:"Enter weight",detail:"",color:C.txt3};
     const isRSI=v.indication?.includes("RSI"),isMaint=v.indication?.includes("Maintenance");
     const dose=isRSI?Math.round(wt*1.2):isMaint?Math.round(wt*0.1):Math.round(wt*0.6);
     const notes=isRSI?"Onset 60 sec at 1.2 mg/kg. Reversal: sugammadex 16 mg/kg.":isMaint?"Maintain with infusion 10–12 mcg/kg/min IV. Monitor TOF.":"Onset 2–3 min. Reversal: neostigmine or sugammadex.";
     return{score:`${dose} mg IV`,label:isRSI?"High-dose RSI (1.2 mg/kg)":isMaint?"Maintenance ICU paralysis":"Standard intubation (0.6 mg/kg)",detail:notes+" ⚠ See medication reference.",color:C.teal};
   }},

  {id:"midazolam",cat:"Dosing",icon:"😴",name:"Midazolam (Sedation)",
   desc:"Midazolam procedural sedation dosing",ref:"Standard of care",medRef:true,
   fields:[
     {k:"weight",label:"Patient weight (kg)",type:"number",min:10,max:250},
     {k:"age65",label:"Age ≥ 65 years or compromised",type:"checkbox"},
   ],
   compute(v){
     const wt=+v.weight||0;
     if(!wt) return{score:"—",label:"Enter weight",detail:"",color:C.txt3};
     const dose=v.age65?Math.round(wt*0.02*10)/10:Math.round(wt*0.05*10)/10;
     return{score:`${dose} mg IV`,label:`0.02–0.05 mg/kg IV — titrate slowly${v.age65?" (reduced dose — elderly/compromised)":""}`,detail:"Onset 2–3 min. Titrate 1 mg q2–3 min to effect. Reversal: flumazenil 0.2 mg IV. ⚠ See medication reference.",color:C.teal};
   }},

  // ── MISC CLINICAL ──────────────────────────────────────────
  {id:"corrected_ca",cat:"Metabolic",icon:"⚗️",name:"Corrected Calcium",
   desc:"Albumin-corrected serum calcium",ref:"Standard formula",
   fields:[
     {k:"ca",label:"Serum Calcium (mg/dL)",type:"number",min:4,max:20},
     {k:"albumin",label:"Serum Albumin (g/dL)",type:"number",min:0.5,max:6},
   ],
   compute(v){
     const ca=+v.ca,alb=+v.albumin;
     if(!ca||!alb) return{score:"—",label:"Enter values",detail:"",color:C.txt3};
     const corrCa=(ca+0.8*(4-alb)).toFixed(2);
     const r=corrCa<8.5?"Hypocalcaemia — consider IV calcium repletion":corrCa>10.5?"Hypercalcaemia — evaluate for PTH, malignancy, vitamin D toxicity":"Normal corrected calcium";
     const c=corrCa<8.5||corrCa>10.5?C.coral:C.teal;
     return{score:`${corrCa} mg/dL`,label:r,detail:"Normal: 8.5–10.5 mg/dL. Formula: Corrected Ca = Ca + 0.8 × (4 − albumin)",color:c};
   }},

  {id:"bmi",cat:"Metabolic",icon:"📐",name:"BMI Calculator",
   desc:"Body Mass Index",ref:"WHO Classification",
   fields:[
     {k:"weight",label:"Weight (kg)",type:"number",min:1,max:500},
     {k:"height",label:"Height (cm)",type:"number",min:50,max:250},
   ],
   compute(v){
     const wt=+v.weight,ht=+v.height;
     if(!wt||!ht) return{score:"—",label:"Enter values",detail:"",color:C.txt3};
     const bmi=(wt/((ht/100)**2)).toFixed(1);
     const r=bmi<18.5?"Underweight":bmi<25?"Normal weight":bmi<30?"Overweight":bmi<35?"Obese Class I":bmi<40?"Obese Class II":"Obese Class III (morbid)";
     const c=bmi<18.5?C.gold:bmi<25?C.teal:bmi<30?C.gold:C.coral;
     return{score:`BMI: ${bmi}`,label:r,detail:"Consider ideal body weight for drug dosing in obese patients",color:c};
   }},

  {id:"ibw",cat:"Metabolic",icon:"⚖️",name:"Ideal Body Weight",
   desc:"Devine formula IBW for drug dosing",ref:"Devine 1974",
   fields:[
     {k:"height",label:"Height (cm)",type:"number",min:100,max:250},
     {k:"male",label:"Male sex",type:"checkbox"},
     {k:"weight",label:"Actual body weight (kg) — for adjusted BW",type:"number",min:20,max:300},
   ],
   compute(v){
     const ht=+v.height,wt=+v.weight||0;
     if(!ht) return{score:"—",label:"Enter height",detail:"",color:C.txt3};
     const ibw=Math.round((v.male?(50+0.9*(ht-152.4)):(45.5+0.9*(ht-152.4)))*10)/10;
     const obese=wt>0&&wt>(1.3*ibw);
     const adjBW=obese?Math.round((ibw+0.4*(wt-ibw))*10)/10:null;
     return{score:`IBW: ${ibw} kg${adjBW?` / AdjBW: ${adjBW} kg`:""}`,label:`Use IBW for aminoglycosides, linezolid, digoxin${obese?" — patient is obese: use AdjBW":""}`,detail:"AdjBW = IBW + 0.4 × (Actual – IBW). Used when actual > 130% IBW.",color:C.teal};
   }},

  {id:"osmolality",cat:"Metabolic",icon:"💧",name:"Serum Osmolality",
   desc:"Calculated osmolality & osmolar gap",ref:"Standard formula",
   fields:[
     {k:"na",label:"Sodium (mEq/L)",type:"number",min:100,max:200},
     {k:"bun",label:"BUN (mg/dL)",type:"number",min:0,max:200},
     {k:"glucose",label:"Glucose (mg/dL)",type:"number",min:50,max:2000},
     {k:"measured",label:"Measured osmolality (mOsm/kg) — optional",type:"number",min:0,max:500},
   ],
   compute(v){
     const na=+v.na,bun=+v.bun,gluc=+v.glucose;
     if(!na) return{score:"—",label:"Enter sodium",detail:"",color:C.txt3};
     const calc=Math.round(2*na+(bun/2.8)+(gluc/18));
     const gap=v.measured?Math.round(+v.measured-calc):null;
     const r=calc<275?"Hypo-osmolar (< 275)":calc<295?"Normal (275–295)":"Hyperosmolar (> 295)";
     const gapStr=gap!==null?(gap>10?"Osmolar gap elevated (> 10) — consider toxic alcohol (methanol, ethylene glycol)":`Osmolar gap normal (${gap} mOsm/kg)`):"";
     const c=calc<275||calc>320?C.coral:calc>295?C.gold:C.teal;
     return{score:`${calc} mOsm/kg`,label:r,detail:gapStr||"Formula: 2×Na + BUN/2.8 + Glucose/18",color:c};
   }},

  {id:"steroid_conversion",cat:"Metabolic",icon:"🔄",name:"Steroid Conversion",
   desc:"Equivalent glucocorticoid doses",ref:"Standard pharmacology",medRef:true,
   fields:[
     {k:"drug",label:"Current steroid",type:"select",options:["Prednisone (5 mg)","Prednisolone (5 mg)","Methylprednisolone (4 mg)","Dexamethasone (0.75 mg)","Hydrocortisone (20 mg)","Triamcinolone (4 mg)"]},
     {k:"dose",label:"Current dose (mg)",type:"number",min:0.1,max:1000},
   ],
   compute(v){
     const dose=+v.dose||0; if(!dose) return{score:"—",label:"Enter dose",detail:"",color:C.txt3};
     const equiv={"Prednisone":5,"Prednisolone":5,"Methylprednisolone":4,"Dexamethasone":0.75,"Hydrocortisone":20,"Triamcinolone":4};
     const drug=Object.keys(equiv).find(k=>v.drug?.startsWith(k))||"Prednisone";
     const unit=equiv[drug];
     const prednisoneEq=Math.round(dose/unit*5*100)/100;
     const results=Object.entries(equiv).map(([d,u])=>({d,v:Math.round(prednisoneEq/5*u*100)/100}));
     return{score:`${prednisoneEq} mg prednisone equivalent`,label:`${results.map(r=>`${r.d}: ${r.v} mg`).join(" · ")}`,detail:"Relative anti-inflammatory potency only. Does not account for mineralocorticoid effects. ⚠ See medication reference.",color:C.blue};
   }},

  {id:"map",cat:"Cardiac",icon:"📊",name:"Mean Arterial Pressure",
   desc:"MAP calculation and clinical target",ref:"Critical care standard",
   fields:[
     {k:"sbp",label:"Systolic BP (mmHg)",type:"number",min:0,max:300},
     {k:"dbp",label:"Diastolic BP (mmHg)",type:"number",min:0,max:200},
   ],
   compute(v){
     const sbp=+v.sbp,dbp=+v.dbp;
     if(!sbp||!dbp) return{score:"—",label:"Enter BP values",detail:"",color:C.txt3};
     const map=Math.round(dbp+(sbp-dbp)/3);
     const r=map<65?"Hypotension — initiate vasopressor if unresponsive to fluids":map<70?"Borderline — target MAP ≥ 65 in sepsis":map>100?"Hypertensive — evaluate for organ damage target":"Adequate perfusion pressure";
     const c=map<65?C.coral:map<70?C.gold:C.teal;
     return{score:`MAP: ${map} mmHg`,label:r,detail:"Formula: DBP + (SBP − DBP)/3 · Sepsis target MAP ≥ 65 mmHg",color:c};
   }},

  {id:"meld",cat:"GI",icon:"🫀",name:"MELD Score",
   desc:"Model for End-Stage Liver Disease — mortality risk",ref:"Kamath et al. Hepatology 2001",
   fields:[
     {k:"bilirubin",label:"Bilirubin (mg/dL)",type:"number",min:0.1,max:50},
     {k:"inr",label:"INR",type:"number",min:0.5,max:15},
     {k:"cr",label:"Creatinine (mg/dL)",type:"number",min:0.1,max:20},
     {k:"dialysis",label:"On dialysis or creatinine ≥ 4 mg/dL (counts as 4)",type:"checkbox"},
   ],
   compute(v){
     let cr=v.dialysis?4:Math.min(+v.cr||1,4);
     const bili=Math.max(+v.bilirubin||1,1); const inr=Math.max(+v.inr||1,1);
     cr=Math.max(cr,1);
     const meld=Math.round(3.78*Math.log(bili)+11.2*Math.log(inr)+9.57*Math.log(cr)+6.43);
     const mort=meld<10?"<2%":meld<20?"6–20%":meld<30?"20–52%":"52–75%";
     const c=meld<10?C.teal:meld<20?C.gold:meld<30?C.orange:C.coral;
     return{score:meld,label:`3-month mortality: ${mort}`,detail:"MELD ≥ 15 — evaluate for transplantation listing",color:c};
   }},

  {id:"child_pugh",cat:"GI",icon:"🫘",name:"Child-Pugh Score",
   desc:"Cirrhosis severity and prognosis",ref:"Child & Turcotte 1964; Pugh 1973",
   fields:[
     {k:"bili",label:"Bilirubin (mg/dL)",type:"select",options:["1 — < 2","2 — 2–3","3 — > 3"]},
     {k:"albumin",label:"Albumin (g/dL)",type:"select",options:["1 — > 3.5","2 — 2.8–3.5","3 — < 2.8"]},
     {k:"pt",label:"INR",type:"select",options:["1 — < 1.7","2 — 1.7–2.3","3 — > 2.3"]},
     {k:"ascites",label:"Ascites",type:"select",options:["1 — None","2 — Mild (responds to diuretics)","3 — Moderate to severe / refractory"]},
     {k:"enceph",label:"Hepatic Encephalopathy",type:"select",options:["1 — None","2 — Grade I–II (or suppressed with medication)","3 — Grade III–IV (or refractory)"]},
   ],
   compute(v){
     const s=[v.bili,v.albumin,v.pt,v.ascites,v.enceph].reduce((a,x)=>a+(+(x?.charAt(0)||1)),0);
     const cls=s<=6?"A":s<=9?"B":"C";
     const mort=cls==="A"?"1-yr: 100%, 2-yr: 85%":cls==="B"?"1-yr: 81%, 2-yr: 57%":"1-yr: 45%, 2-yr: 35%";
     const c=cls==="A"?C.teal:cls==="B"?C.gold:C.coral;
     return{score:`${s} — Class ${cls}`,label:`Survival: ${mort}`,detail:"Class C (≥ 10) — consider transplant evaluation",color:c};
   }},

  {id:"glasgow_blatchford",cat:"GI",icon:"🔴",name:"Glasgow-Blatchford Score",
   desc:"Upper GI bleed — need for intervention",ref:"Blatchford et al. Lancet 2000",
   fields:[
     {k:"bun",label:"BUN (mg/dL)",type:"select",options:["0 — < 18.2","2 — 18.2–22.3","3 — 22.4–27.9","4 — 28–70","6 — > 70"]},
     {k:"hgb_m",label:"Haemoglobin — Male (g/dL)",type:"select",options:["0 — ≥ 13","1 — 12–12.9","3 — 10–11.9","6 — < 10"]},
     {k:"sbp",label:"Systolic BP (mmHg)",type:"select",options:["0 — ≥ 110","1 — 100–109","2 — 90–99","3 — < 90"]},
     {k:"hr",label:"HR ≥ 100 bpm",type:"checkbox"},
     {k:"melena",label:"Melena",type:"checkbox"},
     {k:"syncope",label:"Syncope",type:"checkbox"},
     {k:"liver_disease",label:"Hepatic disease",type:"checkbox"},
     {k:"cardiac_failure",label:"Cardiac failure",type:"checkbox"},
   ],
   compute(v){
     const s=(+(v.bun?.charAt(0)||0))+(+(v.hgb_m?.charAt(0)||0))+(+(v.sbp?.charAt(0)||0))+(v.hr?1:0)+(v.melena?1:0)+(v.syncope?2:0)+(v.liver_disease?2:0)+(v.cardiac_failure?2:0);
     const r=s===0?"Score 0 — very low risk — consider outpatient management":s<=6?"Low–moderate risk — may require endoscopy":"High risk — urgent upper endoscopy, admit to monitored bed";
     const c=s===0?C.teal:s<=6?C.gold:C.coral;
     return{score:s,label:r,detail:"Score 0 = safe for outpatient (no need for emergency endoscopy)",color:c};
   }},

  {id:"cha2ds2_female",cat:"Cardiac",icon:"♀️",name:"Female Sex Correction (AFib)",
   desc:"Is female sex a net risk modifier for stroke in AFib?",ref:"ESC 2020 Guidelines",
   fields:[
     {k:"age",label:"Age (years)",type:"number",min:18,max:120},
     {k:"other_rf",label:"Non-sex risk factors (CHA₂DS₂ points excl. sex)",type:"number",min:0,max:8},
   ],
   compute(v){
     const age=+v.age,rf=+v.other_rf||0;
     if(!age) return{score:"—",label:"Enter age",detail:"",color:C.txt3};
     const score_with_sex=rf+1;
     const anticoag=rf>=1?"Anticoagulation recommended — female sex adds net risk factor":"Female sex alone is NOT an indication for anticoagulation (score 1 from sex only = not treated as real risk factor)";
     return{score:`CHA₂DS₂-VASc (with F): ${score_with_sex}`,label:anticoag,detail:"Female sex adds 1 point but is only a risk modifier. Anticoag if ≥2 in females (≥1 non-sex risk factor) per ESC 2020.",color:rf>=1?C.teal:C.gold};
   }},
];

// ════════════════════════════════════════════════════════════
//  CATEGORIES
// ════════════════════════════════════════════════════════════
const ALL_CATS = ["All","Cardiac","Vascular","Neurology","Sepsis","Renal","Metabolic","Trauma","OB/GYN","Pediatric","Dosing","GI"];
const CAT_COLORS = {
  All:C.teal, Cardiac:C.coral, Vascular:"#ff9f43", Neurology:C.purple,
  Sepsis:"#f5c842", Renal:C.blue, Metabolic:C.green, Trauma:"#ff9999",
  "OB/GYN":C.pink, Pediatric:"#b99bff", Dosing:"#6ab8ff", GI:"#3dffa0"
};

// ════════════════════════════════════════════════════════════
//  GLASS PRIMITIVES
// ════════════════════════════════════════════════════════════
function GlassBg(){
  return(
    <div style={{position:"fixed",inset:0,overflow:"hidden",pointerEvents:"none",zIndex:0}}>
      {[{x:"8%",y:"18%",r:320,c:"rgba(0,229,192,0.055)"},{x:"88%",y:"10%",r:260,c:"rgba(59,158,255,0.05)"},{x:"80%",y:"78%",r:340,c:"rgba(155,109,255,0.05)"},{x:"15%",y:"82%",r:220,c:"rgba(245,200,66,0.04)"},{x:"50%",y:"45%",r:400,c:"rgba(0,229,192,0.03)"}].map((o,i)=>(
        <div key={i} style={{position:"absolute",left:o.x,top:o.y,width:o.r*2,height:o.r*2,borderRadius:"50%",background:`radial-gradient(circle,${o.c} 0%,transparent 68%)`,transform:"translate(-50%,-50%)",animation:`cg${i%3} ${8+i*1.3}s ease-in-out infinite`}}/>
      ))}
      <svg width="100%" height="100%" style={{position:"absolute",inset:0,opacity:0.038}}>
        <defs>
          <pattern id="cgg" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0L0 0 0 40" fill="none" stroke="#00e5c0" strokeWidth="0.5"/></pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#cgg)"/>
      </svg>
      <style>{`
        @keyframes cg0{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-50%) scale(1.12)}}
        @keyframes cg1{0%,100%{transform:translate(-50%,-50%) scale(1.08)}50%{transform:translate(-50%,-50%) scale(0.9)}}
        @keyframes cg2{0%,100%{transform:translate(-50%,-50%) scale(0.94)}50%{transform:translate(-50%,-50%) scale(1.1)}}
      `}</style>
    </div>
  );
}

function GBox({children,style={},accent=null}){
  return(
    <div style={{background:"rgba(8,22,40,0.72)",backdropFilter:"blur(22px)",WebkitBackdropFilter:"blur(22px)",border:`1px solid ${accent?`${accent}30`:"rgba(26,53,85,0.8)"}`,borderRadius:16,boxShadow:accent?`0 4px 24px rgba(0,0,0,0.4),0 0 20px ${accent}15`:"0 4px 20px rgba(0,0,0,0.38),inset 0 1px 0 rgba(255,255,255,0.025)",...style}}>
      {children}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  INDIVIDUAL CALCULATOR PANEL
// ════════════════════════════════════════════════════════════
function CalcPanel({calc,onClose,onMedRef}){
  const[vals,setVals]=useState({});
  const result=useMemo(()=>{
    try{return calc.compute(vals);}catch{return null;}
  },[vals,calc]);

  const set=(k,v)=>setVals(p=>({...p,[k]:v}));
  const catColor=CAT_COLORS[calc.cat]||C.teal;

  return(
    <div style={{position:"fixed",inset:0,zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(3,8,16,0.75)",backdropFilter:"blur(8px)"}}>
      <div style={{width:"min(600px,96vw)",maxHeight:"88vh",display:"flex",flexDirection:"column",background:"rgba(5,15,30,0.95)",border:`1px solid ${catColor}35`,borderRadius:20,overflow:"hidden",boxShadow:`0 32px 80px rgba(0,0,0,0.7),0 0 0 1px ${catColor}20`}}>
        {/* Header */}
        <div style={{padding:"18px 22px 14px",borderBottom:"1px solid rgba(26,53,85,0.7)",background:`linear-gradient(135deg,${catColor}08,transparent)`,flexShrink:0}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:2,borderRadius:"20px 20px 0 0",background:`linear-gradient(90deg,${catColor},transparent)`}}/>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:44,height:44,borderRadius:12,background:`${catColor}20`,border:`1px solid ${catColor}35`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{calc.icon}</div>
            <div style={{flex:1}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,color:C.txt,lineHeight:1}}>{calc.name}</div>
              <div style={{fontSize:11,color:C.txt3,marginTop:3}}>{calc.desc}</div>
            </div>
            <div style={{display:"flex",gap:6,flexShrink:0}}>
              {calc.medRef&&<button onClick={()=>onMedRef&&onMedRef()} style={{padding:"5px 12px",background:`${C.orange}15`,border:`1px solid ${C.orange}35`,borderRadius:20,color:C.orange,fontSize:10,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,cursor:"pointer"}}>⚕ Med Ref</button>}
              <button onClick={onClose} style={{width:32,height:32,background:"rgba(42,79,122,0.3)",border:"1px solid rgba(42,79,122,0.5)",borderRadius:8,color:C.txt3,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
            </div>
          </div>
        </div>

        {/* Fields + Result */}
        <div style={{flex:1,overflowY:"auto",padding:"16px 22px"}}>
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
            {calc.fields.map(f=>(
              <div key={f.k}>
                <label style={{fontSize:10,color:C.txt3,textTransform:"uppercase",letterSpacing:".06em",fontWeight:700,display:"block",marginBottom:4}}>{f.label}</label>
                {f.type==="checkbox"?(
                  <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",background:vals[f.k]?`${catColor}08`:"rgba(14,37,68,0.4)",border:`1px solid ${vals[f.k]?`${catColor}35`:"rgba(26,53,85,0.7)"}`,borderRadius:8,padding:"8px 12px",transition:"all .15s"}}>
                    <input type="checkbox" checked={!!vals[f.k]} onChange={e=>set(f.k,e.target.checked)} style={{width:16,height:16,accentColor:catColor,cursor:"pointer"}}/>
                    <span style={{fontSize:12,color:vals[f.k]?catColor:C.txt2}}>{f.label}</span>
                  </label>
                ):f.type==="select"?(
                  <select value={vals[f.k]||""} onChange={e=>set(f.k,e.target.value)} style={{width:"100%",background:"rgba(14,37,68,0.5)",border:"1px solid rgba(26,53,85,0.8)",borderRadius:8,padding:"8px 11px",color:C.txt,fontFamily:"'DM Sans',sans-serif",fontSize:12,outline:"none"}}>
                    <option value="">— Select —</option>
                    {f.options.map(o=><option key={o} value={o}>{o}</option>)}
                  </select>
                ):f.type==="date"?(
                  <input type="date" value={vals[f.k]||""} onChange={e=>set(f.k,e.target.value)} style={{width:"100%",background:"rgba(14,37,68,0.5)",border:"1px solid rgba(26,53,85,0.8)",borderRadius:8,padding:"8px 11px",color:C.txt,fontFamily:"'JetBrains Mono',monospace",fontSize:12,outline:"none"}}/>
                ):(
                  <input type="number" min={f.min} max={f.max} value={vals[f.k]||""} onChange={e=>set(f.k,e.target.value)} placeholder="Enter value…" style={{width:"100%",background:"rgba(14,37,68,0.5)",border:"1px solid rgba(26,53,85,0.8)",borderRadius:8,padding:"8px 11px",color:C.txt,fontFamily:"'JetBrains Mono',monospace",fontSize:12,outline:"none"}}
                  onFocus={e=>e.target.style.borderColor=catColor} onBlur={e=>e.target.style.borderColor="rgba(26,53,85,0.8)"}/>
                )}
              </div>
            ))}
          </div>

          {/* Result */}
          {result&&(
            <div style={{borderRadius:14,padding:"16px 18px",background:`${result.color}10`,border:`1.5px solid ${result.color}40`,backdropFilter:"blur(8px)"}}>
              <div style={{fontSize:11,color:C.txt3,textTransform:"uppercase",letterSpacing:".08em",fontFamily:"'JetBrains Mono',monospace",marginBottom:8}}>Result</div>
              <div style={{fontSize:26,fontWeight:700,color:result.color,fontFamily:"'JetBrains Mono',monospace",lineHeight:1,marginBottom:8}}>{result.score}</div>
              <div style={{fontSize:13,fontWeight:600,color:result.color,marginBottom:result.detail?6:0,lineHeight:1.4}}>{result.label}</div>
              {result.detail&&<div style={{fontSize:11,color:C.txt2,lineHeight:1.55}}>{result.detail}</div>}
              {calc.medRef&&<div style={{marginTop:12,fontSize:11,color:C.orange,fontFamily:"'JetBrains Mono',monospace",cursor:"pointer"}} onClick={()=>onMedRef&&onMedRef()}>⚕ See Medication Reference for full dosing details →</div>}
            </div>
          )}
          {!result&&<div style={{textAlign:"center",padding:"16px 0",color:C.txt3,fontSize:12}}>Enter values above to calculate</div>}
        </div>

        <div style={{padding:"10px 22px 14px",borderTop:"1px solid rgba(26,53,85,0.5)",flexShrink:0}}>
          <div style={{fontSize:9,color:C.txt4,fontFamily:"'JetBrains Mono',monospace"}}>Ref: {calc.ref} · Clinical decision support only — verify with primary sources</div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  CALCULATOR CARD
// ════════════════════════════════════════════════════════════
function CalcCard({calc,onOpen,index}){
  const[hov,setHov]=useState(false);
  const cc=CAT_COLORS[calc.cat]||C.teal;
  return(
    <div onClick={()=>onOpen(calc)} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{position:"relative",borderRadius:16,padding:"16px 16px 14px",cursor:"pointer",overflow:"hidden",transition:"all 0.3s cubic-bezier(0.34,1.56,0.64,1)",transform:hov?"translateY(-5px) scale(1.02)":"translateY(0) scale(1)",animation:`ci ${0.45+index*0.03}s ease both`,
        background:hov?`linear-gradient(135deg,${cc}18,${cc}06)`:"rgba(8,22,40,0.65)",
        backdropFilter:"blur(18px)",WebkitBackdropFilter:"blur(18px)",
        border:`1px solid ${hov?`${cc}40`:"rgba(26,53,85,0.75)"}`,
        boxShadow:hov?`0 16px 36px rgba(0,0,0,0.45),0 0 24px ${cc}15`:"0 3px 14px rgba(0,0,0,0.35)"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:1.5,background:`linear-gradient(90deg,${cc},transparent)`,opacity:hov?1:0.2,transition:"opacity 0.3s"}}/>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10}}>
        <div style={{width:38,height:38,borderRadius:10,background:`${cc}20`,border:`1px solid ${cc}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0,boxShadow:hov?`0 0 14px ${cc}30`:"none",transition:"box-shadow 0.3s"}}>{calc.icon}</div>
        <div style={{display:"flex",gap:4,flexDirection:"column",alignItems:"flex-end"}}>
          <span style={{fontSize:8,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,padding:"2px 7px",borderRadius:20,background:`${cc}15`,border:`1px solid ${cc}25`,color:cc,letterSpacing:".06em"}}>{calc.cat}</span>
          {calc.medRef&&<span style={{fontSize:8,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,padding:"2px 7px",borderRadius:20,background:`${C.orange}12`,border:`1px solid ${C.orange}25`,color:C.orange}}>DOSING</span>}
        </div>
      </div>
      <div style={{fontSize:12,fontWeight:700,color:C.txt,lineHeight:1.25,marginBottom:4}}>{calc.name}</div>
      <div style={{fontSize:10,color:C.txt3,lineHeight:1.35}}>{calc.desc}</div>
      <div style={{position:"absolute",bottom:12,right:12,fontSize:10,color:cc,opacity:hov?0.8:0,transition:"opacity 0.2s"}}>Open →</div>
      <style>{`@keyframes ci{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  MAIN HUB PAGE
// ════════════════════════════════════════════════════════════
export default function CalculatorHub({ onBack, navigateToMedRef }) {
  const[search,setSearch]=useState("");
  const[cat,setCat]=useState("All");
  const[activeCalc,setActiveCalc]=useState(null);
  const searchRef=useRef(null);

  const filtered=useMemo(()=>CALCS.filter(c=>(cat==="All"||c.cat===cat)&&(!search||c.name.toLowerCase().includes(search.toLowerCase())||c.desc.toLowerCase().includes(search.toLowerCase())||c.cat.toLowerCase().includes(search.toLowerCase()))),[search,cat]);

  const catCounts=useMemo(()=>Object.fromEntries(ALL_CATS.map(c=>[c,c==="All"?CALCS.length:CALCS.filter(x=>x.cat===c).length])),[]);

  return(
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'DM Sans',sans-serif",position:"relative"}}>
      <GlassBg/>
      {activeCalc&&<CalcPanel calc={activeCalc} onClose={()=>setActiveCalc(null)} onMedRef={()=>{setActiveCalc(null);if(navigateToMedRef)navigateToMedRef();}}/>}

      <div style={{position:"relative",zIndex:1,padding:"100px 32px 48px",maxWidth:1400,margin:"0 auto"}}>

        {/* ── Hero ── */}
        <GBox style={{padding:"22px 28px 20px",marginBottom:16,position:"relative",overflow:"hidden",boxShadow:`0 8px 40px rgba(0,0,0,0.55),0 0 30px rgba(0,229,192,0.08),inset 0 1px 0 rgba(255,255,255,0.04)`}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:2.5,background:"linear-gradient(90deg,#00e5c0,#3b9eff,#9b6dff,#ff6b6b,#f5c842,#00e5c0)",borderRadius:"16px 16px 0 0"}}/>
          <div style={{position:"absolute",inset:0,background:"linear-gradient(108deg,rgba(0,229,192,0.04) 0%,transparent 55%,rgba(59,158,255,0.03) 100%)",pointerEvents:"none"}}/>
          <div style={{display:"flex",alignItems:"center",gap:18,position:"relative"}}>
            {onBack&&<button onClick={onBack} style={{padding:"6px 14px",background:"rgba(14,37,68,0.6)",border:"1px solid rgba(42,79,122,0.6)",borderRadius:10,color:C.txt3,fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",backdropFilter:"blur(8px)",transition:"all .2s",flexShrink:0,whiteSpace:"nowrap"}} onMouseEnter={e=>{e.currentTarget.style.color=C.teal;e.currentTarget.style.borderColor="rgba(0,229,192,0.4)";}} onMouseLeave={e=>{e.currentTarget.style.color=C.txt3;e.currentTarget.style.borderColor="rgba(42,79,122,0.6)";}}>← Hub</button>}
            <div style={{width:58,height:58,borderRadius:16,background:"linear-gradient(135deg,rgba(0,229,192,0.2),rgba(59,158,255,0.12))",border:"1px solid rgba(0,229,192,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0,boxShadow:"0 0 22px rgba(0,229,192,0.2)"}}>🧮</div>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:5,flexWrap:"wrap"}}>
                <span style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:700,color:C.txt,lineHeight:1}}>Calculator Hub</span>
                <span style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,padding:"3px 10px",borderRadius:20,background:"rgba(0,229,192,0.1)",color:C.teal,border:"1px solid rgba(0,229,192,0.3)",letterSpacing:".06em"}}>{CALCS.length} CALCULATORS</span>
              </div>
              <p style={{fontSize:12,color:C.txt2,margin:0,lineHeight:1.6}}>Clinical scores · Risk stratification · Weight-based dosing · Metabolic calculations — all evidence-based.</p>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,flexShrink:0}}>
              {[{v:CALCS.filter(c=>c.cat==="Dosing").length,l:"Dosing Calcs",col:C.orange},{v:CALCS.filter(c=>!c.medRef).length,l:"Clinical Scores",col:C.teal},{v:ALL_CATS.length-1,l:"Categories",col:C.blue},{v:"ACLS\n+ACOG",l:"Evidence Base",col:C.purple}].map((s,i)=>(
                <div key={i} style={{textAlign:"center",background:"rgba(14,37,68,0.6)",borderRadius:10,padding:"7px 10px",border:"1px solid rgba(26,53,85,0.8)"}}>
                  <div style={{fontSize:13,fontWeight:700,color:s.col,fontFamily:"'JetBrains Mono',monospace",lineHeight:1.1,whiteSpace:"pre-line"}}>{s.v}</div>
                  <div style={{fontSize:8,color:C.txt4,marginTop:2,textTransform:"uppercase",letterSpacing:".06em"}}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </GBox>

        {/* ── Search + Filters ── */}
        <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:14,flexWrap:"wrap"}}>
          <div style={{position:"relative",flex:1,minWidth:220,maxWidth:400}}>
            <span style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",fontSize:14,opacity:0.35}}>🔍</span>
            <input ref={searchRef} type="text" placeholder="Search calculators…" value={search} onChange={e=>setSearch(e.target.value)}
              style={{width:"100%",background:"rgba(8,22,40,0.8)",border:"1px solid rgba(42,79,122,0.6)",borderRadius:11,padding:"9px 14px 9px 40px",color:C.txt,fontFamily:"'DM Sans',sans-serif",fontSize:12,outline:"none",backdropFilter:"blur(14px)",transition:"border-color .2s"}}
              onFocus={e=>e.target.style.borderColor="rgba(0,229,192,0.5)"} onBlur={e=>e.target.style.borderColor="rgba(42,79,122,0.6)"}/>
            {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:C.txt3,cursor:"pointer",fontSize:16,lineHeight:1,padding:0}}>×</button>}
          </div>
          <span style={{fontSize:11,color:C.txt4,fontFamily:"'JetBrains Mono',monospace",marginLeft:"auto"}}>{filtered.length} result{filtered.length!==1?"s":""}</span>
        </div>

        {/* ── Category tabs ── */}
        <div style={{display:"flex",gap:5,overflowX:"auto",marginBottom:18,paddingBottom:4,scrollbarWidth:"none"}}>
          {ALL_CATS.map(c=>{
            const active=c===cat; const cc=CAT_COLORS[c]||C.teal;
            return(
              <button key={c} onClick={()=>setCat(c)}
                style={{display:"flex",alignItems:"center",gap:5,padding:"7px 14px",borderRadius:24,fontSize:11,fontWeight:active?700:500,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",transition:"all .2s",whiteSpace:"nowrap",flexShrink:0,background:active?`${cc}18`:"rgba(8,22,40,0.75)",border:`1px solid ${active?`${cc}45`:"rgba(42,79,122,0.5)"}`,color:active?cc:C.txt3,backdropFilter:"blur(12px)",boxShadow:active?`0 0 12px ${cc}18`:"none"}}>
                {c} <span style={{fontSize:9,opacity:0.65,fontFamily:"'JetBrains Mono',monospace"}}>({catCounts[c]})</span>
              </button>
            );
          })}
        </div>

        {/* ── Dosing warning ── */}
        {(cat==="Dosing"||cat==="All")&&(
          <div style={{background:"rgba(255,159,67,0.06)",border:"1px solid rgba(255,159,67,0.2)",borderRadius:10,padding:"9px 14px",marginBottom:16,display:"flex",alignItems:"center",gap:10,backdropFilter:"blur(10px)"}}>
            <span style={{fontSize:16}}>⚕</span>
            <span style={{fontSize:11,color:C.txt2}}>Dosing calculators are clinical decision support tools only. Always verify with the <span style={{color:C.orange,cursor:navigateToMedRef?"pointer":"default",fontWeight:600}} onClick={()=>navigateToMedRef&&navigateToMedRef()}>Medication Reference</span> page for full contraindications, drug interactions, and monitoring parameters.</span>
          </div>
        )}

        {/* ── Grid ── */}
        {filtered.length===0?(
          <div style={{textAlign:"center",padding:"60px 0",color:C.txt3}}>
            <div style={{fontSize:40,marginBottom:12}}>🔍</div>
            <div style={{fontSize:14,fontFamily:"'Playfair Display',serif"}}>No calculators found</div>
            <div style={{fontSize:12,marginTop:6}}>Try a different search term or category</div>
          </div>
        ):(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:10}}>
            {filtered.map((c,i)=><CalcCard key={c.id} calc={c} onOpen={setActiveCalc} index={i}/>)}
          </div>
        )}

        {/* ── Footer ── */}
        <div style={{marginTop:24,borderRadius:12,padding:"11px 16px",background:"rgba(5,15,30,0.65)",border:"1px solid rgba(26,53,85,0.6)",backdropFilter:"blur(12px)",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
          <span style={{fontSize:10,color:C.teal,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,flexShrink:0}}>⚕ EVIDENCE BASE</span>
          {["GRACE Registry","TIMI Study Group","Wells (DVT/PE)","PESI Score","NIHSS","SOFA / Sepsis-3","Broselow-Luten","ACOG Obstetric Guidelines","CKD-EPI 2021","Cockcroft-Gault","ASSENT-2 (TNK)","Ranson / BISAP","GBS Score"].map((r,i)=>(
            <span key={i} style={{fontSize:10,color:C.txt4}}>{i>0&&<span style={{marginRight:8,color:C.txt4}}>·</span>}{r}</span>
          ))}
        </div>

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@400;500;600&display=swap');
        *{box-sizing:border-box}
        input::placeholder{color:#2e4a6a}
        button{outline:none}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#1a3555;border-radius:2px}
      `}</style>
    </div>
  );
}