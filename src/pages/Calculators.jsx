import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";

(() => {
  if (document.getElementById("ch-fonts")) return;
  const l = document.createElement("link"); l.id = "ch-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@400;500;600&display=swap";
  document.head.appendChild(l);
})();

const C = {
  bg:"#050f1e", panel:"rgba(8,22,40,0.72)", card:"rgba(11,30,54,0.6)", up:"rgba(14,37,68,0.5)",
  border:"rgba(26,53,85,0.8)", borderHi:"rgba(42,79,122,0.9)",
  teal:"#00e5c0", blue:"#3b9eff", gold:"#f5c842", coral:"#ff6b6b",
  purple:"#9b6dff", orange:"#ff9f43", green:"#3dffa0", pink:"#ff6b9d",
  txt:"#e8f0fe", txt2:"#8aaccc", txt3:"#4a6a8a", txt4:"#2e4a6a",
};

// ── 62 Calculators ────────────────────────────────────────────────
const CALCS = [
  // ── CARDIAC (9) ─────────────────────────────────────────────────
  {id:"grace",cat:"Cardiac",icon:"🫀",name:"GRACE Score",desc:"In-hospital & 6-month mortality in ACS",ref:"GRACE Registry",
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
     const age=+v.age||0; s+=age<30?0:age<40?8:age<50?25:age<60?41:age<70?58:age<80?75:91;
     const hr=+v.hr||0; s+=hr<50?0:hr<70?3:hr<90?9:hr<110?15:hr<150?24:hr<200?38:46;
     const sbp=+v.sbp||0; s+=sbp<80?58:sbp<100?53:sbp<120?43:sbp<140?34:sbp<160?24:sbp<200?10:0;
     const cr=+v.cr||0; s+=cr<0.4?1:cr<0.8?3:cr<1.2?5:cr<1.6?7:cr<2?9:cr<4?15:20;
     const ki=[1,2,3,4].indexOf(+(v.killip?.charAt(0)||1))+1;
     s+=ki===2?20:ki===3?39:ki===4?59:0;
     if(v.cardiac_arrest)s+=39; if(v.st_dev)s+=28; if(v.elevated_enzymes)s+=14;
     const risk=s<109?"Low":s<=140?"Intermediate":"High";
     const mort=s<109?"<1%":s<=140?"1–3%":">3%";
     return{score:s,label:risk,detail:`6-month mortality: ${mort}`,color:risk==="Low"?C.teal:risk==="Intermediate"?C.gold:C.coral};
   }},

  {id:"timi_nstemi",cat:"Cardiac",icon:"📉",name:"TIMI (UA/NSTEMI)",desc:"Risk of adverse cardiac events in NSTE-ACS",ref:"TIMI Study Group",
   fields:[
     {k:"age65",label:"Age ≥ 65 years",type:"checkbox"},{k:"cad3",label:"≥ 3 CAD risk factors",type:"checkbox"},
     {k:"known_cad",label:"Known CAD (stenosis ≥ 50%)",type:"checkbox"},{k:"asa",label:"ASA use in past 7 days",type:"checkbox"},
     {k:"angina",label:"≥ 2 anginal events in past 24 h",type:"checkbox"},{k:"st_dev",label:"ST deviation ≥ 0.5 mm",type:"checkbox"},
     {k:"enzymes",label:"Elevated cardiac markers",type:"checkbox"},
   ],
   compute(v){
     const s=[v.age65,v.cad3,v.known_cad,v.asa,v.angina,v.st_dev,v.enzymes].filter(Boolean).length;
     const risk=s<=2?"Low (4.7%)":s<=4?"Intermediate (13.2%)":"High (40.9%)";
     return{score:s,label:risk,detail:"14-day MACE risk",color:s<=2?C.teal:s<=4?C.gold:C.coral};
   }},

  {id:"heart",cat:"Cardiac",icon:"💓",name:"HEART Score",desc:"Chest pain risk stratification in ED",ref:"Six et al. 2010 · Mahler 2015",
   fields:[
     {k:"history",label:"History",type:"select",options:["0 — Slightly suspicious (atypical)","1 — Moderately suspicious","2 — Highly suspicious (classic ACS)"]},
     {k:"ecg",label:"ECG",type:"select",options:["0 — Normal","1 — Non-specific repolarization disturbance","2 — LBBB / significant ST deviation"]},
     {k:"age",label:"Age",type:"select",options:["0 — < 45 years","1 — 45–65 years","2 — > 65 years"]},
     {k:"rf",label:"Risk Factors",type:"select",options:["0 — No known risk factors","1 — 1–2 risk factors","2 — ≥ 3 risk factors or known CAD"]},
     {k:"troponin",label:"Troponin",type:"select",options:["0 — ≤ Normal limit","1 — 1–3× normal limit","2 — > 3× normal limit"]},
   ],
   compute(v){
     const s=[v.history,v.ecg,v.age,v.rf,v.troponin].reduce((a,x)=>a+(+(x?.charAt(0)||0)),0);
     const r=s<=3?"Low — MACE < 2%":s<=6?"Moderate — MACE 12–17%":"High — MACE > 65%";
     return{score:s,label:r,detail:"HEART 0–3 + 2 negative troponins: NPV 99% — safe discharge",color:s<=3?C.teal:s<=6?C.gold:C.coral};
   }},

  {id:"chadsvasc",cat:"Cardiac",icon:"🧲",name:"CHA₂DS₂-VASc",desc:"Stroke risk in non-valvular AFib",ref:"ESC Guidelines",
   fields:[
     {k:"chf",label:"Congestive heart failure / LV dysfunction",type:"checkbox"},{k:"htn",label:"Hypertension",type:"checkbox"},
     {k:"age75",label:"Age ≥ 75 years (×2)",type:"checkbox"},{k:"dm",label:"Diabetes mellitus",type:"checkbox"},
     {k:"stroke",label:"Prior stroke / TIA / thromboembolism (×2)",type:"checkbox"},
     {k:"vascular",label:"Vascular disease (prior MI, PAD, aortic plaque)",type:"checkbox"},
     {k:"age65",label:"Age 65–74 years",type:"checkbox"},{k:"female",label:"Female sex",type:"checkbox"},
   ],
   compute(v){
     const s=(v.chf?1:0)+(v.htn?1:0)+(v.age75?2:0)+(v.dm?1:0)+(v.stroke?2:0)+(v.vascular?1:0)+(v.age65?1:0)+(v.female?1:0);
     const strokes=[0,1.3,2.2,3.2,4.0,6.7,9.8,9.6,6.7,15.2];
     const rec=s===0?"Anticoagulation not recommended":s===1?"Consider OAC (male)":"Anticoagulation recommended";
     return{score:s,label:rec,detail:`Annual stroke risk ≈ ${strokes[Math.min(s,9)]}%`,color:s===0?C.teal:s===1?C.gold:C.coral};
   }},

  {id:"hasbled",cat:"Cardiac",icon:"🩸",name:"HAS-BLED Score",desc:"Bleeding risk on anticoagulation for AFib",ref:"CHEST 2010",
   fields:[
     {k:"htn",label:"H — Uncontrolled HTN (SBP > 160)",type:"checkbox"},{k:"renal",label:"A — Renal disease",type:"checkbox"},
     {k:"liver",label:"A — Liver disease",type:"checkbox"},{k:"stroke",label:"S — Stroke history",type:"checkbox"},
     {k:"bleeding",label:"B — Prior bleeding or predisposition",type:"checkbox"},{k:"inr",label:"L — Labile INR",type:"checkbox"},
     {k:"elderly",label:"E — Age > 65",type:"checkbox"},{k:"drugs",label:"D — Antiplatelet / NSAID use",type:"checkbox"},
     {k:"alcohol",label:"D — Alcohol ≥ 8 drinks/week",type:"checkbox"},
   ],
   compute(v){
     const s=[v.htn,v.renal,v.liver,v.stroke,v.bleeding,v.inr,v.elderly,v.drugs,v.alcohol].filter(Boolean).length;
     const r=s<=1?"Low bleeding risk":s<=2?"Moderate bleeding risk":"High risk — correct modifiable factors; does NOT preclude OAC";
     return{score:s,label:r,detail:s>=3?"Address modifiable risk factors before anticoagulation adjustment":"Annual bleed risk: Low–Moderate",color:s<=1?C.teal:s<=2?C.gold:C.coral};
   }},

  {id:"killip",cat:"Cardiac",icon:"🏥",name:"Killip Classification",desc:"Heart failure severity in acute MI",ref:"Killip & Kimball 1967",
   fields:[{k:"cls",label:"Clinical Class",type:"select",options:["I — No clinical signs of HF","II — Rales < 50%, S3 gallop, JVD","III — Pulmonary oedema (rales > 50%)","IV — Cardiogenic shock"]}],
   compute(v){
     const cls=+(v.cls?.charAt(0)||1);
     const mort=["<6%","6–17%","38%","60–80%"][cls-1];
     return{score:`Class ${cls}`,label:`30-day mortality: ${mort}`,detail:"Assess volume status and initiate management",color:[C.teal,C.gold,C.orange,C.coral][cls-1]};
   }},

  {id:"shock_index",cat:"Cardiac",icon:"⚡",name:"Shock Index",desc:"Early haemodynamic deterioration",ref:"Allgöwer & Burri 1967",
   fields:[
     {k:"hr",label:"Heart Rate (bpm)",type:"number",min:0,max:300},
     {k:"sbp",label:"Systolic BP (mmHg)",type:"number",min:0,max:300},
   ],
   compute(v){
     const si=((+v.hr||0)/((+v.sbp||1))).toFixed(2);
     const r=si<0.6?"Normal":si<1.0?"Mild haemodynamic compromise":si<1.4?"Moderate — consider resuscitation":"Severe — activate haemorrhage protocol";
     return{score:si,label:r,detail:"SI > 1.0 = mortality significantly elevated",color:si<0.6?C.teal:si<1.0?C.gold:si<1.4?C.orange:C.coral};
   }},

  {id:"map",cat:"Cardiac",icon:"📊",name:"Mean Arterial Pressure",desc:"MAP calculation and clinical target",ref:"Critical care standard",
   fields:[
     {k:"sbp",label:"Systolic BP (mmHg)",type:"number",min:0,max:300},
     {k:"dbp",label:"Diastolic BP (mmHg)",type:"number",min:0,max:200},
   ],
   compute(v){
     const sbp=+v.sbp,dbp=+v.dbp;
     if(!sbp||!dbp) return{score:"—",label:"Enter BP values",detail:"",color:C.txt3};
     const map=Math.round(dbp+(sbp-dbp)/3);
     const r=map<65?"Hypotension — vasopressor if fluid-unresponsive":map<70?"Borderline — target MAP ≥ 65 in sepsis":map>100?"Hypertensive — evaluate for organ damage":"Adequate perfusion pressure";
     return{score:`MAP: ${map} mmHg`,label:r,detail:"Formula: DBP + (SBP − DBP)/3 · Sepsis target MAP ≥ 65 mmHg",color:map<65?C.coral:map<70?C.gold:C.teal};
   }},

  {id:"cha2ds2_female",cat:"Cardiac",icon:"♀️",name:"Female Sex in AFib (ESC 2020)",desc:"Is female sex a net stroke risk modifier?",ref:"ESC Guidelines 2020",
   fields:[
     {k:"age",label:"Age (years)",type:"number",min:18,max:120},
     {k:"other_rf",label:"Non-sex CHA₂DS₂ risk factors",type:"number",min:0,max:8},
   ],
   compute(v){
     const age=+v.age,rf=+v.other_rf||0;
     if(!age) return{score:"—",label:"Enter age",detail:"",color:C.txt3};
     const anticoag=rf>=1?"Anticoagulation recommended — female sex adds net risk":"Female sex ALONE is not an indication for anticoagulation";
     return{score:`CHA₂DS₂-VASc (with F): ${rf+1}`,label:anticoag,detail:"Female sex adds 1 pt but is only a risk modifier. Treat if ≥2 female points (≥1 non-sex risk factor).",color:rf>=1?C.teal:C.gold};
   }},

  // ── VASCULAR (4) ────────────────────────────────────────────────
  {id:"wells_dvt",cat:"Vascular",icon:"🦵",name:"Wells (DVT)",desc:"Pre-test probability of deep vein thrombosis",ref:"Wells et al. Lancet 1997",
   fields:[
     {k:"cancer",label:"Active cancer (treatment or palliation within 6 mo)",type:"checkbox"},
     {k:"paralysis",label:"Paralysis / recent plaster cast of lower extremity",type:"checkbox"},
     {k:"bedridden",label:"Bedridden > 3 days OR major surgery within 12 weeks",type:"checkbox"},
     {k:"tenderness",label:"Localised tenderness along deep venous system",type:"checkbox"},
     {k:"swelling",label:"Entire leg swollen",type:"checkbox"},
     {k:"calf",label:"Calf swelling > 3 cm vs other leg",type:"checkbox"},
     {k:"pitting",label:"Pitting oedema — greater in symptomatic leg",type:"checkbox"},
     {k:"collateral",label:"Collateral superficial veins",type:"checkbox"},
     {k:"prev_dvt",label:"Previously documented DVT",type:"checkbox"},
     {k:"alt_dx",label:"Alternative diagnosis at least as likely as DVT (−2 pts)",type:"checkbox"},
   ],
   compute(v){
     let s=[v.cancer,v.paralysis,v.bedridden,v.tenderness,v.swelling,v.calf,v.pitting,v.collateral,v.prev_dvt].filter(Boolean).length;
     if(v.alt_dx)s-=2;
     const r=s<=0?"Low probability (~3%)":s<=2?"Moderate probability (~17%)":"High probability (~75%)";
     return{score:s,label:r,detail:"If low: D-dimer to rule out. If moderate/high: duplex USS.",color:s<=0?C.teal:s<=2?C.gold:C.coral};
   }},

  {id:"wells_pe",cat:"Vascular",icon:"🫁",name:"Wells (PE)",desc:"Pre-test probability of pulmonary embolism",ref:"Wells et al. Ann Intern Med 2001",
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
     return{score:s,label:r,detail:"Low: apply PERC first; if positive, D-dimer. Moderate: CT-PA or V/Q. High: CT-PA directly.",color:s<2?C.teal:s<7?C.gold:C.coral};
   }},

  {id:"pesi",cat:"Vascular",icon:"📊",name:"PESI Score",desc:"Pulmonary Embolism Severity Index",ref:"JAMA 2005",
   fields:[
     {k:"age",label:"Age (years)",type:"number",min:18,max:120},{k:"male",label:"Male sex (+10)",type:"checkbox"},
     {k:"cancer",label:"Cancer (+30)",type:"checkbox"},{k:"hf",label:"Heart failure (+10)",type:"checkbox"},
     {k:"cpd",label:"Chronic pulmonary disease (+10)",type:"checkbox"},{k:"hr",label:"HR ≥ 110 bpm (+20)",type:"checkbox"},
     {k:"sbp",label:"SBP < 100 mmHg (+30)",type:"checkbox"},{k:"rr",label:"RR ≥ 30/min (+20)",type:"checkbox"},
     {k:"temp",label:"Temp < 36°C (+20)",type:"checkbox"},{k:"altered_ms",label:"Altered mental status (+60)",type:"checkbox"},
     {k:"spo2",label:"SpO₂ < 90% (+20)",type:"checkbox"},
   ],
   compute(v){
     let s=+(v.age||0);
     s+=(v.male?10:0)+(v.cancer?30:0)+(v.hf?10:0)+(v.cpd?10:0)+(v.hr?20:0)+(v.sbp?30:0)+(v.rr?20:0)+(v.temp?20:0)+(v.altered_ms?60:0)+(v.spo2?20:0);
     const cls=s<=65?"I":s<=85?"II":s<=105?"III":s<=125?"IV":"V";
     const risk=s<=65?"Very low (0–1.6%)":s<=85?"Low (1.7–3.5%)":s<=105?"Moderate (3.2–7.1%)":s<=125?"High (4–11.4%)":"Very high (10–24.5%)";
     return{score:s,label:`Class ${cls} — ${risk}`,detail:"30-day mortality estimate",color:s<=65?C.teal:s<=85?C.green:s<=105?C.gold:s<=125?C.orange:C.coral};
   }},

  {id:"perc",cat:"Vascular",icon:"⬦",name:"PERC Rule",desc:"Rule out PE — all 8 criteria must be absent AND pre-test prob < 15%",ref:"Kline et al. J Thromb Haemost 2004",
   fields:[
     {k:"age50",label:"Age ≥ 50 years",type:"checkbox"},{k:"hr100",label:"HR ≥ 100 bpm",type:"checkbox"},
     {k:"sat94",label:"SpO₂ < 94% on room air",type:"checkbox"},{k:"legswel",label:"Unilateral leg swelling",type:"checkbox"},
     {k:"hemopt",label:"Haemoptysis",type:"checkbox"},{k:"surgery",label:"Surgery or trauma within 4 weeks requiring anaesthesia",type:"checkbox"},
     {k:"dvthx",label:"Prior documented DVT or PE",type:"checkbox"},{k:"estro",label:"Estrogen use (OCP, HRT, patch)",type:"checkbox"},
   ],
   compute(v){
     const n=[v.age50,v.hr100,v.sat94,v.legswel,v.hemopt,v.surgery,v.dvthx,v.estro].filter(Boolean).length;
     if(n===0) return{score:"PERC Negative",label:"PE excluded — no D-dimer or CT-PA required",detail:"All 8 criteria absent. Valid only if physician pre-test probability < 15% (low gestalt).",color:C.teal};
     return{score:`${n} criteria positive`,label:"PERC Positive — further workup required",detail:"Cannot use PERC to exclude PE. Proceed: Wells score → D-dimer or CT-PA as indicated.",color:C.coral};
   }},

  // ── NEUROLOGY (5) ────────────────────────────────────────────────
  {id:"gcs",cat:"Neurology",icon:"🧠",name:"Glasgow Coma Scale",desc:"Level of consciousness assessment",ref:"Teasdale & Jennett 1974",
   fields:[
     {k:"eye",label:"Eye Opening",type:"select",options:["4 — Spontaneous","3 — To voice","2 — To pain","1 — None"]},
     {k:"verbal",label:"Verbal Response",type:"select",options:["5 — Oriented","4 — Confused","3 — Inappropriate words","2 — Sounds","1 — None"]},
     {k:"motor",label:"Motor Response",type:"select",options:["6 — Obeys commands","5 — Localises pain","4 — Withdraws","3 — Abnormal flexion","2 — Extension","1 — None"]},
   ],
   compute(v){
     const s=(+(v.eye?.charAt(0)||1))+(+(v.verbal?.charAt(0)||1))+(+(v.motor?.charAt(0)||1));
     const r=s<=8?"Severe TBI — coma, consider intubation":s<=12?"Moderate TBI":"Mild / no TBI";
     return{score:s,label:r,detail:`E${+(v.eye?.charAt(0)||1)}V${+(v.verbal?.charAt(0)||1)}M${+(v.motor?.charAt(0)||1)}`,color:s<=8?C.coral:s<=12?C.gold:C.teal};
   }},

  {id:"nihss",cat:"Neurology",icon:"🎯",name:"NIHSS — Simplified",desc:"Stroke severity and tPA eligibility indicator",ref:"Brott et al. Stroke 1989",
   fields:[
     {k:"loc",label:"1a. Level of consciousness",type:"select",options:["0 — Alert","1 — Not alert but arousable","2 — Requires repeated stimulation","3 — Unresponsive"]},
     {k:"gaze",label:"2. Best gaze",type:"select",options:["0 — Normal","1 — Partial gaze palsy","2 — Forced deviation"]},
     {k:"visual",label:"3. Visual",type:"select",options:["0 — No visual loss","1 — Partial hemianopia","2 — Complete hemianopia","3 — Bilateral blindness"]},
     {k:"facial",label:"4. Facial palsy",type:"select",options:["0 — Normal","1 — Minor","2 — Partial","3 — Complete"]},
     {k:"arm_l",label:"5a. Left arm motor",type:"select",options:["0 — No drift","1 — Drift","2 — Some effort vs gravity","3 — No effort vs gravity","4 — No movement"]},
     {k:"arm_r",label:"5b. Right arm motor",type:"select",options:["0 — No drift","1 — Drift","2 — Some effort vs gravity","3 — No effort vs gravity","4 — No movement"]},
     {k:"leg_l",label:"6a. Left leg motor",type:"select",options:["0 — No drift","1 — Drift","2 — Some effort vs gravity","3 — No effort vs gravity","4 — No movement"]},
     {k:"leg_r",label:"6b. Right leg motor",type:"select",options:["0 — No drift","1 — Drift","2 — Some effort vs gravity","3 — No effort vs gravity","4 — No movement"]},
     {k:"ataxia",label:"7. Limb ataxia",type:"select",options:["0 — Absent","1 — One limb","2 — Two limbs"]},
     {k:"sensory",label:"8. Sensory",type:"select",options:["0 — Normal","1 — Mild–moderate loss","2 — Severe or total loss"]},
     {k:"language",label:"9. Best language",type:"select",options:["0 — No aphasia","1 — Mild–moderate","2 — Severe","3 — Mute / global aphasia"]},
     {k:"dysarthria",label:"10. Dysarthria",type:"select",options:["0 — Normal","1 — Mild–moderate","2 — Severe","UN — Intubated"]},
     {k:"neglect",label:"11. Extinction / inattention",type:"select",options:["0 — No abnormality","1 — Partial neglect","2 — Complete neglect"]},
   ],
   compute(v){
     const fields=[v.loc,v.gaze,v.visual,v.facial,v.arm_l,v.arm_r,v.leg_l,v.leg_r,v.ataxia,v.sensory,v.language,v.dysarthria,v.neglect];
     const s=fields.reduce((a,x)=>{const n=+(x?.charAt(0)||0);return a+(isNaN(n)?0:n);},0);
     const r=s===0?"No stroke symptoms":s<=4?"Minor stroke":s<=15?"Moderate stroke":s<=20?"Moderate–severe":"Severe stroke";
     return{score:s,label:r,detail:"0–42. NIHSS ≥ 6 = likely LVO — emergent CTA head/neck. tPA window if 2–22 and within 4.5 h.",color:s===0?C.teal:s<=4?C.green:s<=15?C.gold:s<=20?C.orange:C.coral};
   }},

  {id:"abcd2",cat:"Neurology",icon:"⏰",name:"ABCD² Score",desc:"Short-term stroke risk after TIA",ref:"Johnston et al. Lancet 2007",
   fields:[
     {k:"age",label:"A — Age ≥ 60 years (+1)",type:"checkbox"},{k:"bp",label:"B — BP ≥ 140/90 on presentation (+1)",type:"checkbox"},
     {k:"clinical",label:"C — Clinical features",type:"select",options:["0 — Other symptom","1 — Speech disturbance without weakness","2 — Unilateral weakness"]},
     {k:"duration",label:"D — Duration",type:"select",options:["0 — < 10 minutes","1 — 10–59 minutes","2 — ≥ 60 minutes"]},
     {k:"diabetes",label:"D — Diabetes mellitus (+1)",type:"checkbox"},
   ],
   compute(v){
     const s=(v.age?1:0)+(v.bp?1:0)+(+(v.clinical?.charAt(0)||0))+(+(v.duration?.charAt(0)||0))+(v.diabetes?1:0);
     const r=s<=3?"Low — 2-day stroke risk ~1%":s<=5?"Moderate — 2-day risk ~4%":"High — 2-day risk ~8%";
     return{score:s,label:r,detail:"Score ≥ 4 generally warrants admission. Even 'low' ABCD2: 90-day risk ~15% without treatment.",color:s<=3?C.teal:s<=5?C.gold:C.coral};
   }},

  {id:"hunt_hess",cat:"Neurology",icon:"🔴",name:"Hunt & Hess Scale",desc:"Subarachnoid haemorrhage severity",ref:"Hunt & Hess 1968",
   fields:[{k:"grade",label:"Clinical Grade",type:"select",options:["I — Asymptomatic / mild headache","II — Moderate–severe headache, no neuro deficit","III — Drowsy, mild focal deficit","IV — Stupor, moderate–severe hemiparesis","V — Deep coma, decerebrate posturing"]}],
   compute(v){
     const g=+(v.grade?.charAt(0)||1);
     const mort=["~5%","~10%","~20%","~40%","~80%"][g-1];
     return{score:`Grade ${g}`,label:`30-day mortality: ${mort}`,detail:"Grade I–II: early surgery favourable. Grade IV–V: defer surgery if possible.",color:[C.teal,C.green,C.gold,C.orange,C.coral][g-1]};
   }},

  {id:"canadian_ct",cat:"Neurology",icon:"📷",name:"Canadian CT Head Rule",desc:"CT head necessity in minor head injury (GCS 13–15)",ref:"Stiell et al. Lancet 2001",
   fields:[
     {k:"gcs_14_2h",label:"GCS < 15 at 2 h after injury (HIGH RISK)",type:"checkbox"},
     {k:"suspected_open",label:"Suspected open / depressed skull fracture (HIGH RISK)",type:"checkbox"},
     {k:"signs_base",label:"Signs of basal skull fracture (HIGH RISK)",type:"checkbox"},
     {k:"vomit2",label:"Vomiting ≥ 2 episodes (HIGH RISK)",type:"checkbox"},
     {k:"age65",label:"Age ≥ 65 years (HIGH RISK)",type:"checkbox"},
     {k:"amnesia_30",label:"Amnesia before impact ≥ 30 min (MEDIUM RISK)",type:"checkbox"},
     {k:"dangerous_mech",label:"Dangerous mechanism — pedestrian, ejection, fall > 3 ft (MEDIUM RISK)",type:"checkbox"},
   ],
   compute(v){
     const high=[v.gcs_14_2h,v.suspected_open,v.signs_base,v.vomit2,v.age65].some(Boolean);
     const med=[v.amnesia_30,v.dangerous_mech].some(Boolean);
     if(high) return{score:"HIGH RISK",label:"CT required — high-risk factor present",detail:"Near-100% sensitivity for neurosurgical lesions.",color:C.coral};
     if(med) return{score:"MEDIUM RISK",label:"CT required — medium-risk factor present",detail:"High sensitivity for brain injury on CT.",color:C.gold};
     return{score:"LOW RISK",label:"CT not required — no criteria met",detail:"Applies only to GCS 13–15 with LOC, amnesia, or confusion.",color:C.teal};
   }},

  // ── SEPSIS / CRITICAL CARE (6) ──────────────────────────────────
  {id:"qsofa",cat:"Sepsis",icon:"🦠",name:"qSOFA Score",desc:"Rapid bedside sepsis screen — no labs required",ref:"Singer et al. JAMA 2016",
   fields:[
     {k:"rr",label:"Respiratory rate ≥ 22/min",type:"checkbox"},
     {k:"ams",label:"Altered mental status (GCS < 15)",type:"checkbox"},
     {k:"sbp",label:"SBP ≤ 100 mmHg",type:"checkbox"},
   ],
   compute(v){
     const s=[v.rr,v.ams,v.sbp].filter(Boolean).length;
     const r=s<2?"Negative — low risk":s===2?"Positive — consider sepsis work-up":"Positive (3/3) — high risk, activate Sepsis-3 bundle";
     return{score:s,label:r,detail:"qSOFA ≥ 2 = prompt evaluation. Screen only — Sepsis-3 requires SOFA ≥ 2 + suspected infection.",color:s<2?C.teal:s===2?C.gold:C.coral};
   }},

  {id:"sofa",cat:"Sepsis",icon:"📊",name:"SOFA Score",desc:"Sequential Organ Failure Assessment — sepsis severity",ref:"Vincent et al. ICM 1996",
   fields:[
     {k:"pao2_fio2",label:"PaO₂/FiO₂ ratio",type:"select",options:["4 — < 100 with vent","3 — 100–199 with vent","2 — 200–299","1 — 300–399","0 — ≥ 400"]},
     {k:"platelets",label:"Platelets (×10³/µL)",type:"select",options:["4 — < 20","3 — 20–49","2 — 50–99","1 — 100–149","0 — ≥ 150"]},
     {k:"bilirubin",label:"Bilirubin (mg/dL)",type:"select",options:["4 — ≥ 12","3 — 6–11.9","2 — 2–5.9","1 — 1.2–1.9","0 — < 1.2"]},
     {k:"map",label:"MAP / Vasopressor use",type:"select",options:["4 — Dopamine > 15 or Epi/Norepi > 0.1","3 — Dopamine > 5 or Epi/Norepi ≤ 0.1","2 — Dopamine ≤ 5 or Dobutamine","1 — MAP < 70 mmHg","0 — MAP ≥ 70 mmHg"]},
     {k:"gcs_sofa",label:"GCS",type:"select",options:["4 — < 6","3 — 6–9","2 — 10–12","1 — 13–14","0 — 15"]},
     {k:"creatinine",label:"Creatinine (mg/dL) or UO",type:"select",options:["4 — > 5.0 or UO < 200 mL/d","3 — 3.5–4.9 or UO < 500 mL/d","2 — 2.0–3.4","1 — 1.2–1.9","0 — < 1.2"]},
   ],
   compute(v){
     const s=[v.pao2_fio2,v.platelets,v.bilirubin,v.map,v.gcs_sofa,v.creatinine].reduce((a,x)=>a+(+(x?.charAt(0)||0)),0);
     const mort=s<2?"<10%":s<8?"15–20%":s<12?"40–60%":"80–95%";
     return{score:s,label:`Predicted mortality: ${mort}`,detail:"Sepsis = suspected infection + SOFA ↑ ≥ 2 from baseline. Serial SOFA predicts trajectory.",color:s<2?C.teal:s<8?C.gold:s<12?C.orange:C.coral};
   }},

  {id:"curb65",cat:"Sepsis",icon:"🫁",name:"CURB-65",desc:"CAP severity and admission decision",ref:"Lim et al. Thorax 2003",
   fields:[
     {k:"confusion",label:"C — New confusion (AMT ≤ 8 or new disorientation)",type:"checkbox"},
     {k:"urea",label:"U — BUN > 19 mg/dL (urea > 7 mmol/L)",type:"checkbox"},
     {k:"rr",label:"R — Respiratory rate ≥ 30/min",type:"checkbox"},
     {k:"bp",label:"B — SBP < 90 or DBP ≤ 60 mmHg",type:"checkbox"},
     {k:"age65",label:"65 — Age ≥ 65 years",type:"checkbox"},
   ],
   compute(v){
     const s=[v.confusion,v.urea,v.rr,v.bp,v.age65].filter(Boolean).length;
     const r=s<=1?"Low severity (~2%) — consider outpatient treatment":s===2?"Moderate (~9%) — short hospitalisation or supervised outpatient":"Severe (~22%) — hospitalise, consider ICU if score 4–5";
     return{score:s,label:r,detail:"PSI/PORT preferred for outpatient decision in low-risk patients.",color:s<=1?C.teal:s===2?C.gold:C.coral};
   }},

  {id:"psi",cat:"Sepsis",icon:"🫁",name:"PSI / PORT Score",desc:"CAP severity — identifies low-risk pneumonia safe for outpatient treatment",ref:"Fine et al. NEJM 1997",
   fields:[
     {k:"age",label:"Age (years)",type:"number",min:18,max:120},{k:"female",label:"Female sex (age − 10 points)",type:"checkbox"},
     {k:"nursing",label:"Nursing home resident (+10)",type:"checkbox"},{k:"neo",label:"Active neoplastic disease (+30)",type:"checkbox"},
     {k:"liver",label:"Liver disease (+20)",type:"checkbox"},{k:"chf",label:"CHF (+10)",type:"checkbox"},
     {k:"cvd",label:"Cerebrovascular disease (+10)",type:"checkbox"},{k:"renal",label:"Renal disease (+10)",type:"checkbox"},
     {k:"ams",label:"Altered mental status (+20)",type:"checkbox"},{k:"rr30",label:"RR ≥ 30/min (+20)",type:"checkbox"},
     {k:"sbp90",label:"SBP < 90 mmHg (+20)",type:"checkbox"},{k:"temp",label:"Temp < 35°C or ≥ 40°C (+15)",type:"checkbox"},
     {k:"hr125",label:"HR ≥ 125 bpm (+10)",type:"checkbox"},{k:"ph735",label:"Arterial pH < 7.35 (+30)",type:"checkbox"},
     {k:"bun30",label:"BUN ≥ 30 mg/dL (+20)",type:"checkbox"},{k:"na130",label:"Na < 130 mEq/L (+20)",type:"checkbox"},
     {k:"glu250",label:"Glucose ≥ 250 mg/dL (+10)",type:"checkbox"},{k:"hct30",label:"HCT < 30% (+10)",type:"checkbox"},
     {k:"po260",label:"PaO₂ < 60 mmHg (+10)",type:"checkbox"},{k:"pleff",label:"Pleural effusion on CXR (+10)",type:"checkbox"},
   ],
   compute(v){
     const pts=Math.round((+v.age||0)+(v.female?-10:0)+(v.nursing?10:0)+(v.neo?30:0)+(v.liver?20:0)+(v.chf?10:0)+(v.cvd?10:0)+(v.renal?10:0)+(v.ams?20:0)+(v.rr30?20:0)+(v.sbp90?20:0)+(v.temp?15:0)+(v.hr125?10:0)+(v.ph735?30:0)+(v.bun30?20:0)+(v.na130?20:0)+(v.glu250?10:0)+(v.hct30?10:0)+(v.po260?10:0)+(v.pleff?10:0));
     const cls=pts<=50?"Class I/II":pts<=70?"Class III":pts<=90?"Class IV":"Class V";
     const mort=pts<=50?"<1%":pts<=70?"~3%":pts<=90?"~9%":"27–30%";
     return{score:pts,label:`${cls} — 30-day mortality: ${mort}`,detail:"Class I/II: outpatient. Class III: brief obs or close follow-up. Class IV–V: admit.",color:pts<=50?C.teal:pts<=70?C.green:pts<=90?C.gold:C.coral};
   }},

  {id:"ranson",cat:"Sepsis",icon:"🔬",name:"Ranson's Criteria",desc:"Acute pancreatitis severity — admission + 48 h criteria",ref:"Ranson et al. Surg Gynecol Obstet 1974",
   fields:[
     {k:"age",label:"On Admission: Age > 55 years",type:"checkbox"},{k:"wbc",label:"On Admission: WBC > 16,000/µL",type:"checkbox"},
     {k:"glucose",label:"On Admission: Glucose > 200 mg/dL",type:"checkbox"},{k:"ldh",label:"On Admission: LDH > 350 IU/L",type:"checkbox"},
     {k:"ast",label:"On Admission: AST > 250 IU/L",type:"checkbox"},{k:"hct",label:"At 48 h: HCT decrease > 10%",type:"checkbox"},
     {k:"bun",label:"At 48 h: BUN increase > 5 mg/dL",type:"checkbox"},{k:"ca",label:"At 48 h: Calcium < 8 mg/dL",type:"checkbox"},
     {k:"pao2",label:"At 48 h: PaO₂ < 60 mmHg",type:"checkbox"},{k:"base_deficit",label:"At 48 h: Base deficit > 4 mEq/L",type:"checkbox"},
     {k:"fluids",label:"At 48 h: Fluid sequestration > 6 L",type:"checkbox"},
   ],
   compute(v){
     const s=[v.age,v.wbc,v.glucose,v.ldh,v.ast,v.hct,v.bun,v.ca,v.pao2,v.base_deficit,v.fluids].filter(Boolean).length;
     const r=s<=2?"Mild — mortality < 1%":s<=4?"Moderate — mortality 15%":s<=6?"Severe — mortality 40%":"Critical — mortality ~100%";
     return{score:s,label:r,detail:"Full score requires 48 h. Score ≥ 3 = severe — ICU care.",color:s<=2?C.teal:s<=4?C.gold:s<=6?C.orange:C.coral};
   }},

  {id:"bisap",cat:"Sepsis",icon:"⚗️",name:"BISAP Score",desc:"Bedside pancreatitis severity at 24 h",ref:"Wu et al. AJG 2009",
   fields:[
     {k:"bun",label:"B — BUN > 25 mg/dL",type:"checkbox"},{k:"ams",label:"I — Impaired mental status (GCS < 15)",type:"checkbox"},
     {k:"sirs",label:"S — SIRS (≥ 2 of: temp, RR, HR, WBC abnormal)",type:"checkbox"},{k:"age",label:"A — Age > 60 years",type:"checkbox"},
     {k:"pleural",label:"P — Pleural effusion on imaging",type:"checkbox"},
   ],
   compute(v){
     const s=[v.bun,v.ams,v.sirs,v.age,v.pleural].filter(Boolean).length;
     const mort=s===0?"<1%":s===1?"<1%":s===2?"~2%":s===3?"~5–8%":s===4?"~13%":"~22%";
     return{score:s,label:`Mortality: ${mort}`,detail:"BISAP ≥ 3 = severe acute pancreatitis.",color:s<=1?C.teal:s<=2?C.green:s<=3?C.gold:s<=4?C.orange:C.coral};
   }},

  // ── RENAL / METABOLIC (10) ──────────────────────────────────────
  {id:"egfr",cat:"Renal",icon:"🫘",name:"eGFR (CKD-EPI)",desc:"Estimated glomerular filtration rate",ref:"CKD-EPI 2021",
   fields:[
     {k:"cr",label:"Serum Creatinine (mg/dL)",type:"number",min:0.1,max:30},
     {k:"age",label:"Age (years)",type:"number",min:18,max:120},{k:"female",label:"Female sex",type:"checkbox"},
   ],
   compute(v){
     const cr=+v.cr,age=+v.age;
     if(!cr||!age) return{score:"—",label:"Enter creatinine and age",detail:"",color:C.txt3};
     const k=v.female?0.7:0.9; const a=v.female?-0.241:-0.302;
     const egfr=Math.round(142*Math.pow(Math.min(cr/k,1),a)*Math.pow(Math.max(cr/k,1),-1.200)*Math.pow(0.9938,age)*(v.female?1.012:1));
     const stage=egfr>=90?"G1 — Normal":egfr>=60?"G2 — Mildly reduced":egfr>=45?"G3a — Mild–mod":egfr>=30?"G3b — Mod–severely":egfr>=15?"G4 — Severely reduced":"G5 — Kidney failure";
     return{score:`${egfr} mL/min/1.73m²`,label:stage,detail:"CKD-EPI 2021 (race-free)",color:egfr>=60?C.teal:egfr>=45?C.gold:egfr>=30?C.orange:C.coral};
   }},

  {id:"cockcroft",cat:"Renal",icon:"💉",name:"Cockcroft-Gault CrCl",desc:"Creatinine clearance for drug dosing",ref:"Cockcroft & Gault 1976",
   fields:[
     {k:"age",label:"Age (years)",type:"number",min:18,max:120},{k:"weight",label:"Actual body weight (kg)",type:"number",min:20,max:300},
     {k:"cr",label:"Serum Creatinine (mg/dL)",type:"number",min:0.1,max:30},{k:"female",label:"Female sex",type:"checkbox"},
   ],
   compute(v){
     const age=+v.age,wt=+v.weight,cr=+v.cr||1;
     if(!age||!wt) return{score:"—",label:"Enter all values",detail:"",color:C.txt3};
     const crcl=Math.round(((140-age)*wt/(72*cr))*(v.female?0.85:1));
     return{score:`${crcl} mL/min`,label:crcl>=50?"Standard dosing":"Reduce dose — see drug-specific recommendations",detail:"Used for drug dose adjustment — not CKD staging.",color:crcl>=50?C.teal:crcl>=30?C.gold:crcl>=15?C.orange:C.coral};
   }},

  {id:"anion_gap",cat:"Renal",icon:"⚗️",name:"Anion Gap",desc:"Metabolic acidosis work-up",ref:"Standard formula",
   fields:[
     {k:"na",label:"Sodium (mEq/L)",type:"number",min:100,max:200},{k:"cl",label:"Chloride (mEq/L)",type:"number",min:60,max:140},
     {k:"bicarb",label:"Bicarbonate (mEq/L)",type:"number",min:1,max:45},{k:"albumin",label:"Albumin (g/dL) — for correction",type:"number",min:0.1,max:6},
   ],
   compute(v){
     const ag=(+v.na||0)-(+v.cl||0)-(+v.bicarb||0);
     const corrAG=Math.round(ag+2.5*(4-(+v.albumin||4)));
     const r=corrAG>12?"Elevated AG — MUDPILES (Methanol, Uraemia, DKA, Propylene glycol, INH, Lactate, EtylGlycol, Salicylates)":"Normal AG — HARDUPS (non-AG acidosis)";
     return{score:`AG: ${ag} (corrected: ${corrAG})`,label:r,detail:"Normal AG: 8–12 mEq/L. Formula: Na − Cl − HCO₃.",color:corrAG>12?C.coral:C.teal};
   }},

  {id:"delta_delta",cat:"Renal",icon:"🔬",name:"Delta-Delta Ratio",desc:"Identifies mixed acid-base disorders",ref:"Standard formula",
   fields:[
     {k:"ag",label:"Anion Gap (calculated)",type:"number",min:0,max:50},
     {k:"bicarb",label:"Bicarbonate (mEq/L)",type:"number",min:1,max:45},
   ],
   compute(v){
     const ag=+v.ag||12,hco3=+v.bicarb||24;
     const dd=((ag-12)/(24-hco3+0.001)).toFixed(2);
     const r=dd<0.4?"Additional non-AG metabolic acidosis":dd<1?"Mixed AG + non-AG acidosis":dd<2?"Pure AG metabolic acidosis":"Metabolic alkalosis co-existing with AG acidosis";
     return{score:`Δ/Δ = ${dd}`,label:r,detail:"<1 = extra non-AG acidosis | 1–2 = pure AGMA | >2 = concurrent metabolic alkalosis",color:dd<0.4||dd>=2?C.coral:dd<1?C.orange:C.teal};
   }},

  {id:"fena",cat:"Renal",icon:"🧪",name:"FENa",desc:"Fractional excretion of sodium — AKI aetiology",ref:"Standard formula",
   fields:[
     {k:"s_na",label:"Serum Sodium (mEq/L)",type:"number",min:100,max:180},{k:"u_na",label:"Urine Sodium (mEq/L)",type:"number",min:0,max:200},
     {k:"s_cr",label:"Serum Creatinine (mg/dL)",type:"number",min:0.1,max:30},{k:"u_cr",label:"Urine Creatinine (mg/dL)",type:"number",min:1,max:500},
   ],
   compute(v){
     const sna=+v.s_na,una=+v.u_na,scr=+v.s_cr,ucr=+v.u_cr;
     if(!sna||!una||!scr||!ucr) return{score:"—",label:"Enter all values",detail:"",color:C.txt3};
     const fena=((una*scr)/(sna*ucr)*100).toFixed(2);
     const r=fena<1?"Pre-renal AKI — FENa < 1%":fena<2?"Borderline — clinical correlation required":"Intrinsic renal / ATN — FENa ≥ 2%";
     return{score:`FENa = ${fena}%`,label:r,detail:"Unreliable if diuretics given — use FEUrea instead.",color:fena<1?C.gold:fena<2?C.orange:C.coral};
   }},

  {id:"corrected_ca",cat:"Metabolic",icon:"⚗️",name:"Corrected Calcium",desc:"Albumin-corrected serum calcium",ref:"Standard formula",
   fields:[
     {k:"ca",label:"Serum Calcium (mg/dL)",type:"number",min:4,max:20},
     {k:"albumin",label:"Serum Albumin (g/dL)",type:"number",min:0.5,max:6},
   ],
   compute(v){
     const ca=+v.ca,alb=+v.albumin;
     if(!ca||!alb) return{score:"—",label:"Enter values",detail:"",color:C.txt3};
     const corrCa=(ca+0.8*(4-alb)).toFixed(2);
     const r=corrCa<8.5?"Hypocalcaemia — consider IV calcium repletion":corrCa>10.5?"Hypercalcaemia — evaluate PTH, malignancy, vitamin D":"Normal corrected calcium";
     return{score:`${corrCa} mg/dL`,label:r,detail:"Normal: 8.5–10.5 mg/dL. Formula: Ca + 0.8 × (4 − albumin).",color:corrCa<8.5||corrCa>10.5?C.coral:C.teal};
   }},

  {id:"bmi",cat:"Metabolic",icon:"📐",name:"BMI Calculator",desc:"Body Mass Index — WHO classification",ref:"WHO Classification",
   fields:[
     {k:"weight",label:"Weight (kg)",type:"number",min:1,max:500},
     {k:"height",label:"Height (cm)",type:"number",min:50,max:250},
   ],
   compute(v){
     const wt=+v.weight,ht=+v.height;
     if(!wt||!ht) return{score:"—",label:"Enter values",detail:"",color:C.txt3};
     const bmi=(wt/((ht/100)**2)).toFixed(1);
     const r=bmi<18.5?"Underweight":bmi<25?"Normal weight":bmi<30?"Overweight":bmi<35?"Obese Class I":bmi<40?"Obese Class II":"Obese Class III (morbid)";
     return{score:`BMI: ${bmi}`,label:r,detail:"Consider IBW / adjusted BW for drug dosing in obese patients.",color:bmi<18.5?C.gold:bmi<25?C.teal:bmi<30?C.gold:C.coral};
   }},

  {id:"ibw",cat:"Metabolic",icon:"⚖️",name:"Ideal Body Weight",desc:"Devine formula IBW and adjusted BW for drug dosing",ref:"Devine 1974",
   fields:[
     {k:"height",label:"Height (cm)",type:"number",min:100,max:250},{k:"male",label:"Male sex",type:"checkbox"},
     {k:"weight",label:"Actual body weight (kg) — for adjusted BW",type:"number",min:20,max:300},
   ],
   compute(v){
     const ht=+v.height,wt=+v.weight||0;
     if(!ht) return{score:"—",label:"Enter height",detail:"",color:C.txt3};
     const ibw=Math.round((v.male?(50+0.9*(ht-152.4)):(45.5+0.9*(ht-152.4)))*10)/10;
     const obese=wt>0&&wt>(1.3*ibw);
     const adj=obese?Math.round((ibw+0.4*(wt-ibw))*10)/10:null;
     return{score:`IBW: ${ibw} kg${adj?` · AdjBW: ${adj} kg`:""}`,label:`Aminoglycosides, linezolid, digoxin${obese?" — use AdjBW (obese)":""}`,detail:"AdjBW = IBW + 0.4 × (Actual − IBW). Use when actual > 130% IBW.",color:C.teal};
   }},

  {id:"osmolality",cat:"Metabolic",icon:"💧",name:"Serum Osmolality",desc:"Calculated osmolality and osmolar gap",ref:"Standard formula",
   fields:[
     {k:"na",label:"Sodium (mEq/L)",type:"number",min:100,max:200},{k:"bun",label:"BUN (mg/dL)",type:"number",min:0,max:200},
     {k:"glucose",label:"Glucose (mg/dL)",type:"number",min:50,max:2000},{k:"measured",label:"Measured osmolality (mOsm/kg) — optional",type:"number",min:0,max:500},
   ],
   compute(v){
     const na=+v.na||0,bun=+v.bun||0,gluc=+v.glucose||0;
     const calc=Math.round(2*na+(bun/2.8)+(gluc/18));
     const gap=v.measured?Math.round(+v.measured-calc):null;
     const r=calc<275?"Hypo-osmolar":calc<295?"Normal (275–295 mOsm/kg)":"Hyperosmolar";
     const gapStr=gap!==null?(gap>10?"Osmolar gap > 10 — toxic alcohol (methanol, ethylene glycol)":`Osmolar gap normal (${gap})`):"";
     return{score:`${calc} mOsm/kg`,label:r,detail:gapStr||"Formula: 2×Na + BUN/2.8 + Glucose/18",color:calc<275||calc>320?C.coral:calc>295?C.gold:C.teal};
   }},

  {id:"steroid_conversion",cat:"Metabolic",icon:"🔄",name:"Steroid Conversion",desc:"Equivalent glucocorticoid doses",ref:"Standard pharmacology",medRef:true,
   fields:[
     {k:"drug",label:"Current steroid",type:"select",options:["Prednisone (5 mg)","Prednisolone (5 mg)","Methylprednisolone (4 mg)","Dexamethasone (0.75 mg)","Hydrocortisone (20 mg)","Triamcinolone (4 mg)"]},
     {k:"dose",label:"Current dose (mg)",type:"number",min:0.1,max:1000},
   ],
   compute(v){
     const dose=+v.dose||0; if(!dose) return{score:"—",label:"Enter dose",detail:"",color:C.txt3};
     const equiv={"Prednisone":5,"Prednisolone":5,"Methylprednisolone":4,"Dexamethasone":0.75,"Hydrocortisone":20,"Triamcinolone":4};
     const drug=Object.keys(equiv).find(k=>v.drug?.startsWith(k))||"Prednisone";
     const prednEq=Math.round(dose/equiv[drug]*5*100)/100;
     const res=Object.entries(equiv).map(([d,u])=>`${d}: ${Math.round(prednEq/5*u*100)/100} mg`).join(" · ");
     return{score:`${prednEq} mg prednisone equivalent`,label:res,detail:"Anti-inflammatory potency only — does not account for mineralocorticoid effects. ⚠ See medication reference.",color:C.blue};
   }},

  // ── TRAUMA (4) ──────────────────────────────────────────────────
  {id:"rts",cat:"Trauma",icon:"🚑",name:"Revised Trauma Score",desc:"Physiological trauma severity score",ref:"Champion et al. 1989",
   fields:[
     {k:"rr",label:"Respiratory Rate (/min)",type:"select",options:["4 — 10–29/min","3 — > 29/min","2 — 6–9/min","1 — 1–5/min","0 — None"]},
     {k:"sbp",label:"Systolic BP (mmHg)",type:"select",options:["4 — > 89","3 — 76–89","2 — 50–75","1 — 1–49","0 — None"]},
     {k:"gcs_cat",label:"GCS",type:"select",options:["4 — 13–15","3 — 9–12","2 — 6–8","1 — 4–5","0 — 3"]},
   ],
   compute(v){
     const s=(+(v.rr?.charAt(0)||0))+(+(v.sbp?.charAt(0)||0))+(+(v.gcs_cat?.charAt(0)||0));
     const surv=s>=11?"95%":s>=8?"85–95%":s>=5?"60–85%":"<50%";
     return{score:s,label:`Predicted survival: ${surv}`,detail:"Score 0–12. Lower = more severe injury.",color:s>=11?C.teal:s>=8?C.gold:s>=5?C.orange:C.coral};
   }},

  {id:"abc_score",cat:"Trauma",icon:"🩹",name:"ABC Score",desc:"Assessment of Blood Consumption — MTP activation",ref:"Nunez et al. 2009",
   fields:[
     {k:"hr",label:"HR > 120 bpm (+1)",type:"checkbox"},{k:"sbp",label:"SBP ≤ 90 mmHg (+1)",type:"checkbox"},
     {k:"pen",label:"Penetrating mechanism (+1)",type:"checkbox"},{k:"fast",label:"Positive FAST (free fluid) (+1)",type:"checkbox"},
   ],
   compute(v){
     const s=[v.hr,v.sbp,v.pen,v.fast].filter(Boolean).length;
     return{score:s,label:s<2?"MTP activation unlikely":"MTP indicated — initiate 1:1:1 transfusion protocol",detail:"Score ≥ 2 = sensitivity 75%, specificity 86% for massive transfusion.",color:s<2?C.teal:C.coral};
   }},

  {id:"burn_tbsa",cat:"Trauma",icon:"🔥",name:"Burns — %TBSA (Rule of Nines)",desc:"Burn area estimation for resuscitation",ref:"Wallace 1951",
   fields:[
     {k:"head",label:"Head & neck (%)",type:"number",min:0,max:9},{k:"chest",label:"Anterior trunk (%)",type:"number",min:0,max:18},
     {k:"back",label:"Posterior trunk (%)",type:"number",min:0,max:18},{k:"arm_l",label:"Left arm (%)",type:"number",min:0,max:9},
     {k:"arm_r",label:"Right arm (%)",type:"number",min:0,max:9},{k:"leg_l",label:"Left leg (%)",type:"number",min:0,max:18},
     {k:"leg_r",label:"Right leg (%)",type:"number",min:0,max:18},{k:"perineum",label:"Perineum (%)",type:"number",min:0,max:1},
   ],
   compute(v){
     const tbsa=[v.head,v.chest,v.back,v.arm_l,v.arm_r,v.leg_l,v.leg_r,v.perineum].reduce((a,x)=>a+(+x||0),0);
     return{score:`${tbsa}% TBSA`,label:tbsa>=20?"Major burns — burns team, consider transfer":tbsa>=10?"Moderate — burns unit input recommended":"Minor — outpatient may be appropriate",detail:"Parkland formula: 4 mL × kg × %TBSA in first 24 h (see Parkland calculator).",color:tbsa>=20?C.coral:tbsa>=10?C.gold:C.teal};
   }},

  {id:"parkland",cat:"Trauma",icon:"💧",name:"Parkland Formula",desc:"Fluid resuscitation for burns",ref:"Baxter 1968",medRef:true,
   fields:[
     {k:"weight",label:"Weight (kg)",type:"number",min:1,max:300},
     {k:"tbsa",label:"% TBSA Burns (2nd/3rd degree only)",type:"number",min:1,max:100},
   ],
   compute(v){
     const wt=+v.weight,tbsa=+v.tbsa;
     if(!wt||!tbsa) return{score:"—",label:"Enter weight and TBSA",detail:"",color:C.txt3};
     const total=Math.round(4*wt*tbsa),first8h=Math.round(total/2);
     return{score:`${total} mL Lactated Ringer's`,label:`${first8h} mL in first 8 h (${Math.round(first8h/8)} mL/h), then ${first8h} mL over next 16 h`,detail:"Start clock from time of injury, not arrival. Add colloid after 24 h.",color:C.blue};
   }},

  // ── ORTHOPEDIC (2) ──────────────────────────────────────────────
  {id:"ott_ankle",cat:"Ortho",icon:"🦶",name:"Ottawa Ankle Rules",desc:"Ankle/midfoot X-ray after injury — 99% sensitivity for fracture",ref:"Stiell et al. JAMA 1994",
   fields:[
     {k:"med6",label:"Tenderness — posterior 6 cm or tip of MEDIAL malleolus",type:"checkbox"},
     {k:"lat6",label:"Tenderness — posterior 6 cm or tip of LATERAL malleolus",type:"checkbox"},
     {k:"wbear",label:"Unable to bear weight × 4 steps immediately AND in ED (ankle zone)",type:"checkbox"},
     {k:"nav",label:"Tenderness at navicular (midfoot zone)",type:"checkbox"},
     {k:"mt5",label:"Tenderness at base of 5th metatarsal (midfoot zone)",type:"checkbox"},
     {k:"wbmf",label:"Unable to bear weight × 4 steps (foot zone)",type:"checkbox"},
   ],
   compute(v){
     const ankle=[v.med6,v.lat6,v.wbear].some(Boolean);
     const foot=[v.nav,v.mt5,v.wbmf].some(Boolean);
     if(!ankle&&!foot) return{score:"LOW RISK",label:"X-ray NOT required",detail:"All criteria absent. 96–99% sensitivity. Clinical exam sufficient.",color:C.teal};
     const xr=[ankle&&"Ankle X-ray",foot&&"Foot X-ray"].filter(Boolean).join(" + ");
     return{score:xr,label:"X-ray required",detail:"Malleolar tenderness → ankle AP/lateral/mortise. Navicular or 5th MT → foot series.",color:C.orange};
   }},

  {id:"ott_knee",cat:"Ortho",icon:"🦵",name:"Ottawa Knee Rules",desc:"Knee X-ray after acute injury — 98–100% sensitivity for fracture",ref:"Stiell et al. JAMA 1996",
   fields:[
     {k:"age55",label:"Age ≥ 55 years",type:"checkbox"},{k:"fib",label:"Isolated tenderness of the fibular head",type:"checkbox"},
     {k:"pat",label:"Isolated patella tenderness (no other bony tenderness)",type:"checkbox"},
     {k:"flex90",label:"Unable to flex the knee to 90°",type:"checkbox"},
     {k:"wbear",label:"Unable to bear weight × 4 steps immediately and in ED",type:"checkbox"},
   ],
   compute(v){
     const pos=[v.age55,v.fib,v.pat,v.flex90,v.wbear].some(Boolean);
     if(!pos) return{score:"X-RAY NOT REQUIRED",label:"All criteria absent — fracture excluded",detail:"98–100% sensitivity. Discharge with RICE and follow-up.",color:C.teal};
     return{score:"X-RAY REQUIRED",label:"One or more criteria present",detail:"Knee X-ray (AP, lateral ± skyline) to exclude fracture.",color:C.orange};
   }},

  // ── OB/GYN (3) ──────────────────────────────────────────────────
  {id:"bishop",cat:"OB/GYN",icon:"🤰",name:"Bishop Score",desc:"Cervical ripeness and induction success prediction",ref:"Bishop 1964",
   fields:[
     {k:"dilation",label:"Dilation",type:"select",options:["0 — Closed","1 — 1–2 cm","2 — 3–4 cm","3 — ≥ 5 cm"]},
     {k:"effacement",label:"Effacement",type:"select",options:["0 — 0–30%","1 — 40–50%","2 — 60–70%","3 — ≥ 80%"]},
     {k:"station",label:"Fetal Station",type:"select",options:["0 — –3","1 — –2","2 — –1 / 0","3 — +1 / +2"]},
     {k:"consistency",label:"Cervical Consistency",type:"select",options:["0 — Firm","1 — Medium","2 — Soft"]},
     {k:"position",label:"Cervical Position",type:"select",options:["0 — Posterior","1 — Mid","2 — Anterior"]},
   ],
   compute(v){
     const s=[v.dilation,v.effacement,v.station,v.consistency,v.position].reduce((a,x)=>a+(+(x?.charAt(0)||0)),0);
     const r=s>=8?"Favourable — induction success > 90%":s>=6?"Moderate — induction usually successful":"Unfavourable — consider cervical ripening agent";
     return{score:s,label:r,detail:"Score < 6 in nulliparous = high oxytocin failure rate.",color:s>=8?C.teal:s>=6?C.gold:C.coral};
   }},

  {id:"apgar",cat:"OB/GYN",icon:"👶",name:"Apgar Score",desc:"Neonatal assessment at 1 and 5 minutes",ref:"Virginia Apgar 1953",
   fields:[
     {k:"appearance",label:"A — Appearance (skin colour)",type:"select",options:["0 — Blue/pale all over","1 — Body pink, extremities blue","2 — Pink all over"]},
     {k:"pulse",label:"P — Pulse (HR)",type:"select",options:["0 — Absent","1 — < 100 bpm","2 — ≥ 100 bpm"]},
     {k:"grimace",label:"G — Grimace (reflex irritability)",type:"select",options:["0 — No response","1 — Grimace only","2 — Cry / cough / sneeze"]},
     {k:"activity",label:"A — Activity (muscle tone)",type:"select",options:["0 — Limp","1 — Some flexion","2 — Active flexion"]},
     {k:"respiration",label:"R — Respiration",type:"select",options:["0 — Absent","1 — Weak / irregular","2 — Strong cry"]},
   ],
   compute(v){
     const s=[v.appearance,v.pulse,v.grimace,v.activity,v.respiration].reduce((a,x)=>a+(+(x?.charAt(0)||0)),0);
     const r=s>=7?"Reassuring — routine post-delivery care":s>=4?"Moderately depressed — stimulate and provide O₂":"Severely depressed — neonatal resuscitation indicated";
     return{score:s,label:r,detail:"Repeat at 5 min. If < 7 at 5 min, continue q5 min.",color:s>=7?C.teal:s>=4?C.gold:C.coral};
   }},

  {id:"ega",cat:"OB/GYN",icon:"📅",name:"Gestational Age (LMP)",desc:"Gestational age and EDD from last menstrual period",ref:"Naegele's Rule",
   fields:[{k:"lmp",label:"First day of last menstrual period",type:"date"}],
   compute(v){
     if(!v.lmp) return{score:"—",label:"Enter LMP date",detail:"",color:C.txt3};
     const days=Math.floor((new Date()-new Date(v.lmp))/86400000);
     const wks=Math.floor(days/7),rem=days%7;
     const edd=new Date(v.lmp); edd.setDate(edd.getDate()+280);
     const eddStr=edd.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
     const r=wks<20?"1st/2nd trimester":wks<28?"2nd trimester":wks<37?"3rd trimester — pre-term":wks<42?"At term":"Post-term";
     return{score:`${wks}w ${rem}d`,label:r,detail:`EDD: ${eddStr}`,color:wks<37?C.gold:wks<42?C.teal:C.orange};
   }},

  // ── PEDIATRIC (6) ────────────────────────────────────────────────
  {id:"broselow",cat:"Pediatric",icon:"📏",name:"Broselow Length–Weight",desc:"Weight estimation from height for emergency drug dosing",ref:"Broselow-Luten System",
   fields:[{k:"height",label:"Patient height / length (cm)",type:"number",min:46,max:150}],
   compute(v){
     const h=+v.height||0;
     const bands=[{max:55,color:"Grey",wt:3,zone:"3–5 kg"},{max:60,color:"Pink",wt:5.5,zone:"5–7 kg"},{max:68,color:"Red",wt:7,zone:"6–9 kg"},{max:77,color:"Purple",wt:9.5,zone:"8–11 kg"},{max:88,color:"Yellow",wt:12,zone:"10–14 kg"},{max:100,color:"White",wt:16,zone:"13–18 kg"},{max:111,color:"Blue",wt:20,zone:"16–23 kg"},{max:124,color:"Orange",wt:26,zone:"20–29 kg"},{max:135,color:"Green",wt:32,zone:"27–35 kg"},{max:150,color:"Tan",wt:40,zone:"30–40 kg"}];
     const b=bands.find(x=>h<=x.max)||bands[bands.length-1];
     return{score:`${b.color} band — ${b.wt} kg (${b.zone})`,label:"Use for weight-based drug dosing",detail:"Estimated weight for all paediatric drug calculations.",color:C.teal};
   }},

  {id:"peds_vitals",cat:"Pediatric",icon:"📈",name:"Paediatric Normal Vitals",desc:"Age-based normal vital sign ranges",ref:"PALS / Harriet Lane",
   fields:[{k:"age",label:"Age of child",type:"select",options:["Neonate (0–28 d)","Infant (1–12 mo)","Toddler (1–3 yr)","Preschool (3–6 yr)","School age (6–12 yr)","Adolescent (12–18 yr)"]}],
   compute(v){
     const ranges={"Neonate":{hr:"100–160",rr:"30–60",sbp:"60–90"},"Infant":{hr:"100–160",rr:"25–50",sbp:"70–100"},"Toddler":{hr:"90–150",rr:"20–30",sbp:"80–110"},"Preschool":{hr:"80–140",rr:"20–25",sbp:"80–110"},"School":{hr:"70–120",rr:"15–20",sbp:"85–120"},"Adolescent":{hr:"60–100",rr:"12–20",sbp:"90–130"}};
     const key=Object.keys(ranges).find(k=>v.age?.startsWith(k))||"Infant";
     const r=ranges[key];
     return{score:v.age?.split(" (")[0]||"—",label:`HR: ${r.hr} · RR: ${r.rr} · SBP: ${r.sbp}`,detail:"Lower limit SBP (1–10 yr): 70 + (2 × age in years) mmHg",color:C.teal};
   }},

  {id:"peds_gcs",cat:"Pediatric",icon:"🧒",name:"Paediatric GCS",desc:"Modified GCS for children < 5 years",ref:"James & Trauner 1985",
   fields:[
     {k:"eye",label:"Eye Opening",type:"select",options:["4 — Spontaneous","3 — To voice","2 — To pain","1 — None"]},
     {k:"verbal",label:"Verbal (Modified)",type:"select",options:["5 — Smiles / coos / words age-appropriate","4 — Crying but consolable","3 — Persistent irritable cry","2 — Restless / agitated","1 — None"]},
     {k:"motor",label:"Motor Response",type:"select",options:["6 — Normal spontaneous movement","5 — Withdraws to touch","4 — Withdraws to pain","3 — Abnormal flexion","2 — Extension","1 — None"]},
   ],
   compute(v){
     const s=(+(v.eye?.charAt(0)||1))+(+(v.verbal?.charAt(0)||1))+(+(v.motor?.charAt(0)||1));
     const r=s<=8?"Severe — airway management":s<=12?"Moderate brain injury":"Mild brain injury";
     return{score:s,label:r,detail:"GCS ≤ 8 = consider early intubation.",color:s<=8?C.coral:s<=12?C.gold:C.teal};
   }},

  {id:"apnea_of_prematurity",cat:"Pediatric",icon:"🫁",name:"Newborn Respiratory Rate",desc:"Tachypnoea threshold in neonates",ref:"WHO / NRP",
   fields:[
     {k:"rr",label:"Respiratory Rate (/min)",type:"number",min:0,max:120},
     {k:"gest_age",label:"Gestational age at birth (weeks)",type:"number",min:23,max:42},
   ],
   compute(v){
     const rr=+v.rr||0,ga=+v.gest_age||40;
     if(rr>=60) return{score:`${rr}/min`,label:"Tachypnoea — ≥ 60/min is abnormal",detail:"Assess for respiratory distress, infection, TTN, RDS.",color:C.coral};
     if(rr<30) return{score:`${rr}/min`,label:"Bradypnoea — consider apnoea of prematurity",detail:ga<37?"Prematurity-related apnoea — caffeine citrate may be indicated":"Evaluate for neurological or metabolic cause.",color:C.coral};
     return{score:`${rr}/min`,label:"Normal neonatal RR (30–60/min)",detail:"Continue clinical monitoring.",color:C.teal};
   }},

  {id:"pec_lt2",cat:"Pediatric",icon:"👶",name:"PECARN (< 2 years)",desc:"Head injury — identifies very low-risk for clinically important TBI",ref:"Kuppermann et al. Lancet 2009",
   fields:[
     {k:"gcs14",label:"GCS < 15 on ED evaluation",type:"checkbox"},{k:"palpfx",label:"Palpable skull fracture",type:"checkbox"},
     {k:"hematoma",label:"Occipital / parietal / temporal scalp haematoma",type:"checkbox"},
     {k:"ams",label:"Altered mental status — agitation, somnolence, slow response",type:"checkbox"},
     {k:"loc5",label:"Loss of consciousness ≥ 5 seconds",type:"checkbox"},
     {k:"mech",label:"Severe mechanism — MVA > 40mph, fall > 3 ft, high-impact object",type:"checkbox"},
     {k:"notact",label:"Not acting normally per parent",type:"checkbox"},
   ],
   compute(v){
     const n=[v.gcs14,v.palpfx,v.hematoma,v.ams,v.loc5,v.mech,v.notact].filter(Boolean).length;
     if(n===0) return{score:"Very Low Risk",label:"CT NOT recommended — risk < 0.02%",detail:"Observation and return precautions appropriate.",color:C.teal};
     if(n===1) return{score:"Intermediate",label:"Shared decision: CT vs 4–6 h observation",detail:"Risk ~0.9% for clinically important TBI. Consider haematoma site, age, and family preference.",color:C.gold};
     return{score:"CT Recommended",label:"CT head — risk > 1%",detail:"Multiple high-risk features. CT head to evaluate for significant intracranial injury.",color:C.coral};
   }},

  {id:"pec_gte2",cat:"Pediatric",icon:"🧒",name:"PECARN (≥ 2 years)",desc:"Head injury — identifies very low-risk for clinically important TBI",ref:"Kuppermann et al. Lancet 2009",
   fields:[
     {k:"gcs14",label:"GCS < 15 on ED evaluation",type:"checkbox"},{k:"loc",label:"Any loss of consciousness",type:"checkbox"},
     {k:"vomit",label:"Vomiting ≥ 3 episodes",type:"checkbox"},{k:"sevha",label:"Severe headache",type:"checkbox"},
     {k:"mech",label:"Severe mechanism — MVA > 40mph unrestrained, fall > 5 ft",type:"checkbox"},
     {k:"bsfx",label:"Signs of basilar skull fracture — Battle's, raccoon eyes, haemotympanum, CSF leak",type:"checkbox"},
   ],
   compute(v){
     const n=[v.gcs14,v.loc,v.vomit,v.sevha,v.mech,v.bsfx].filter(Boolean).length;
     if(n===0) return{score:"Very Low Risk",label:"CT NOT recommended — risk < 0.05%",detail:"Observation and return precautions. GCS must be 15 throughout evaluation.",color:C.teal};
     if(n===1) return{score:"Intermediate",label:"Shared decision: CT vs observation",detail:"Risk ~0.9%. Consider worsening symptoms and family preference.",color:C.gold};
     return{score:"CT Recommended",label:"CT head — risk ~4.4%",detail:"Multiple high-risk features present. CT head appropriate.",color:C.coral};
   }},

  // ── DOSING (10) ──────────────────────────────────────────────────
  {id:"tnk_dose",cat:"Dosing",icon:"💉",name:"TNK (Tenecteplase) Dose",desc:"Weight-based tenecteplase for STEMI",ref:"ASSENT-2 Trial / FDA Label",medRef:true,
   fields:[{k:"weight",label:"Patient weight (kg)",type:"number",min:20,max:200}],
   compute(v){
     const wt=+v.weight||0; if(!wt) return{score:"—",label:"Enter weight",detail:"",color:C.txt3};
     const dose=wt<60?30:wt<70?35:wt<80?40:wt<90?45:50;
     return{score:`${dose} mg (${dose/5} mL)`,label:"Single IV bolus over 5–10 seconds",detail:"Max 50 mg. Reconstitute with sterile water only. Age > 75: consider 50% dose reduction. ⚠ See medication reference for contraindications.",color:C.teal};
   }},

  {id:"tpa_alteplase",cat:"Dosing",icon:"💊",name:"tPA Alteplase (Stroke)",desc:"IV alteplase for acute ischaemic stroke",ref:"NINDS / AHA Guidelines",medRef:true,
   fields:[{k:"weight",label:"Patient weight (kg)",type:"number",min:20,max:200}],
   compute(v){
     const wt=+v.weight||0; if(!wt) return{score:"—",label:"Enter weight",detail:"",color:C.txt3};
     const total=Math.min(Math.round(0.9*wt*10)/10,90);
     const bolus=Math.round(total*0.1*10)/10;
     const inf=Math.round((total-bolus)*10)/10;
     return{score:`${total} mg total`,label:`Bolus: ${bolus} mg over 1 min → infusion: ${inf} mg over 60 min`,detail:"Max 90 mg. Eligible patients within 4.5 h onset only. ⚠ See medication reference for contraindications.",color:C.teal};
   }},

  {id:"heparin_wbp",cat:"Dosing",icon:"🩺",name:"Heparin Weight-Based",desc:"UFH dosing protocol for ACS/VTE",ref:"Raschke Nomogram",medRef:true,
   fields:[
     {k:"weight",label:"Patient weight (kg)",type:"number",min:20,max:300},
     {k:"indication",label:"Indication",type:"select",options:["ACS (target aPTT 50–70 s)","VTE treatment (target aPTT 60–100 s)"]},
   ],
   compute(v){
     const wt=+v.weight||0; if(!wt) return{score:"—",label:"Enter weight",detail:"",color:C.txt3};
     const isACS=v.indication?.includes("ACS");
     const bolus=Math.min(Math.round(60*wt),4000), inf=Math.min(Math.round(12*wt),1000);
     return{score:`Bolus: ${bolus} U IV`,label:`Infusion: ${inf} U/h IV`,detail:`Target aPTT ${isACS?"50–70":"60–100"} s. Check aPTT q6h. ⚠ Adjust per hospital nomogram.`,color:C.teal};
   }},

  {id:"enoxaparin",cat:"Dosing",icon:"💉",name:"Enoxaparin (LMWH)",desc:"Enoxaparin weight-based dosing",ref:"ACC/AHA Guidelines",medRef:true,
   fields:[
     {k:"weight",label:"Patient weight (kg)",type:"number",min:20,max:250},{k:"crcl",label:"CrCl (mL/min)",type:"number",min:5,max:200},
     {k:"indication",label:"Indication",type:"select",options:["VTE Treatment — 1 mg/kg SQ q12h","NSTEMI — 1 mg/kg SQ q12h","VTE Prophylaxis — 40 mg SQ daily"]},
   ],
   compute(v){
     const wt=+v.weight||0,crcl=+v.crcl||60; if(!wt) return{score:"—",label:"Enter weight",detail:"",color:C.txt3};
     const prop=v.indication?.includes("Prophylaxis");
     const dose=prop?40:Math.round(wt);
     const adj=crcl<30&&!prop?"⚠ CrCl < 30 — use 1 mg/kg SQ DAILY":crcl<30&&prop?"⚠ CrCl < 30 — reduce to 20 mg SQ daily":"Renal dose OK";
     return{score:`${dose} mg`,label:prop?"SQ once daily":adj.includes("DAILY")?"SQ once daily":"SQ every 12 hours",detail:`${adj}. Avoid if CrCl < 15. ⚠ See medication reference for anti-Xa monitoring.`,color:crcl<30?C.gold:C.teal};
   }},

  {id:"vancomycin",cat:"Dosing",icon:"🏥",name:"Vancomycin AUC/MIC",desc:"Vancomycin dosing for serious infections — AUC-guided",ref:"ASHP/IDSA/SIDP 2020",medRef:true,
   fields:[
     {k:"weight",label:"Actual body weight (kg)",type:"number",min:20,max:300},{k:"crcl",label:"CrCl (mL/min)",type:"number",min:5,max:250},
     {k:"indication",label:"Indication",type:"select",options:["Serious infection (MRSA)","Standard infection","Empirical / prophylaxis"]},
   ],
   compute(v){
     const wt=+v.weight,crcl=+v.crcl; if(!wt||!crcl) return{score:"—",label:"Enter weight and CrCl",detail:"",color:C.txt3};
     const load=Math.round(wt*25/250)*250;
     const interval=crcl>=60?"q8–12h":crcl>=30?"q24–48h":"q48h+ or avoid";
     return{score:`Loading: ${load} mg IV`,label:`Maintenance: 15–20 mg/kg ${interval}`,detail:"Target AUC24/MIC 400–600 for serious MRSA. ⚠ Monitor AUC with pharmacy.",color:C.teal};
   }},

  {id:"gentamicin",cat:"Dosing",icon:"⚗️",name:"Gentamicin (Extended Interval)",desc:"Once-daily aminoglycoside dosing",ref:"Hartford Nomogram",medRef:true,
   fields:[
     {k:"weight",label:"Actual body weight (kg)",type:"number",min:20,max:250},{k:"height",label:"Height (cm)",type:"number",min:100,max:220},
     {k:"crcl",label:"CrCl (mL/min)",type:"number",min:10,max:250},{k:"male",label:"Male sex",type:"checkbox"},
   ],
   compute(v){
     const wt=+v.weight,ht=+v.height||170,crcl=+v.crcl; if(!wt||!crcl) return{score:"—",label:"Enter values",detail:"",color:C.txt3};
     const ibw=v.male?(50+0.9*(ht-152.4)):(45.5+0.9*(ht-152.4));
     const dosWt=wt>1.3*ibw?Math.round(ibw+0.4*(wt-ibw)):Math.min(wt,ibw);
     const dose=Math.round(dosWt*5/10)*10;
     const interval=crcl>=60?"q24h":crcl>=40?"q36h":"q48h — pharmacist review";
     return{score:`${dose} mg IV`,label:`Infuse over 30–60 min ${interval}`,detail:"Use adjusted BW if obese. ⚠ Monitor 18 h trough. See medication reference.",color:crcl<40?C.gold:C.teal};
   }},

  {id:"ketamine_rsi",cat:"Dosing",icon:"🌙",name:"Ketamine (RSI / Sedation)",desc:"Ketamine for RSI, procedural sedation, or analgesia",ref:"ACEP / EM Standard of Care",medRef:true,
   fields:[
     {k:"weight",label:"Patient weight (kg)",type:"number",min:10,max:250},
     {k:"indication",label:"Indication",type:"select",options:["RSI induction (1–2 mg/kg)","Procedural sedation (1–1.5 mg/kg)","Pain — sub-dissociative (0.1–0.5 mg/kg)"]},
   ],
   compute(v){
     const wt=+v.weight||0; if(!wt) return{score:"—",label:"Enter weight",detail:"",color:C.txt3};
     const isRSI=v.indication?.includes("RSI"),isProc=v.indication?.includes("Procedural");
     const dose=isRSI?Math.round(wt*1.5):isProc?Math.round(wt*1):Math.round(wt*0.3);
     const notes=isRSI?"Onset 60 sec. Use with succinylcholine or rocuronium. ⚠ See medication reference.":isProc?"Titrate to effect. Have airway equipment ready. ⚠ See medication reference.":"Sub-dissociative analgesia. Onset 1–2 min. ⚠ See medication reference.";
     return{score:`${dose} mg`,label:isRSI?"1.5 mg/kg IV (RSI)":isProc?"1 mg/kg IV (procedural sedation)":"0.3 mg/kg IV slow push (analgesia)",detail:notes,color:C.teal};
   }},

  {id:"succinylcholine",cat:"Dosing",icon:"💪",name:"Succinylcholine (RSI)",desc:"Succinylcholine dosing for rapid sequence intubation",ref:"ACEP Guidelines",medRef:true,
   fields:[
     {k:"weight",label:"Patient weight (kg)",type:"number",min:10,max:250},
     {k:"peds",label:"Paediatric (< 10 years) — 2 mg/kg",type:"checkbox"},
   ],
   compute(v){
     const wt=+v.weight||0; if(!wt) return{score:"—",label:"Enter weight",detail:"",color:C.txt3};
     const dose=v.peds?Math.round(wt*2):Math.round(wt*1.5);
     return{score:`${dose} mg IV`,label:v.peds?"2 mg/kg IV — paediatric dose":"1–1.5 mg/kg IV — adult dose",detail:"Onset 45–60 sec. Duration 8–12 min. ⚠ Contraindications: ↑ K⁺, burns, crush injury, denervation, myopathy. See medication reference.",color:C.teal};
   }},

  {id:"rocuronium",cat:"Dosing",icon:"💊",name:"Rocuronium (RSI / NMBA)",desc:"Rocuronium for RSI, intubation, and ICU paralysis",ref:"ACEP / EM Standard",medRef:true,
   fields:[
     {k:"weight",label:"Patient weight (kg)",type:"number",min:10,max:300},
     {k:"indication",label:"Indication",type:"select",options:["RSI — high dose (1.2 mg/kg)","Routine intubation (0.6 mg/kg)","Maintenance paralysis — ICU"]},
   ],
   compute(v){
     const wt=+v.weight||0; if(!wt) return{score:"—",label:"Enter weight",detail:"",color:C.txt3};
     const isRSI=v.indication?.includes("RSI"),isMaint=v.indication?.includes("Maintenance");
     const dose=isRSI?Math.round(wt*1.2):isMaint?Math.round(wt*0.1):Math.round(wt*0.6);
     const notes=isRSI?"Onset 60 sec. Reversal: sugammadex 16 mg/kg.":isMaint?"Infusion 10–12 mcg/kg/min. Monitor TOF.":"Onset 2–3 min. Reversal: sugammadex or neostigmine.";
     return{score:`${dose} mg IV`,label:isRSI?"High-dose RSI (1.2 mg/kg)":isMaint?"ICU maintenance":"Standard intubation (0.6 mg/kg)",detail:`${notes} ⚠ See medication reference.`,color:C.teal};
   }},

  {id:"midazolam",cat:"Dosing",icon:"😴",name:"Midazolam (Sedation)",desc:"Midazolam procedural sedation dosing",ref:"Standard of care",medRef:true,
   fields:[
     {k:"weight",label:"Patient weight (kg)",type:"number",min:10,max:250},
     {k:"age65",label:"Age ≥ 65 years or compromised",type:"checkbox"},
   ],
   compute(v){
     const wt=+v.weight||0; if(!wt) return{score:"—",label:"Enter weight",detail:"",color:C.txt3};
     const dose=v.age65?Math.round(wt*0.02*10)/10:Math.round(wt*0.05*10)/10;
     return{score:`${dose} mg IV`,label:`0.02–0.05 mg/kg IV${v.age65?" — reduced (elderly/compromised)":""}`,detail:"Onset 2–3 min. Titrate 1 mg q2–3 min to effect. Reversal: flumazenil 0.2 mg IV. ⚠ See medication reference.",color:C.teal};
   }},

  // ── GI / LIVER (3) ──────────────────────────────────────────────
  {id:"meld",cat:"GI",icon:"🫀",name:"MELD Score",desc:"End-stage liver disease mortality risk — transplant allocation",ref:"Kamath et al. Hepatology 2001",
   fields:[
     {k:"bilirubin",label:"Bilirubin (mg/dL)",type:"number",min:0.1,max:50},
     {k:"inr",label:"INR",type:"number",min:0.5,max:15},
     {k:"cr",label:"Creatinine (mg/dL)",type:"number",min:0.1,max:20},
     {k:"dialysis",label:"On dialysis or creatinine ≥ 4 mg/dL (counts as 4)",type:"checkbox"},
   ],
   compute(v){
     const cr=v.dialysis?4:Math.min(Math.max(+v.cr||1,1),4);
     const bili=Math.max(+v.bilirubin||1,1),inr=Math.max(+v.inr||1,1);
     const meld=Math.round(3.78*Math.log(bili)+11.2*Math.log(inr)+9.57*Math.log(cr)+6.43);
     const mort=meld<10?"<2%":meld<20?"6–20%":meld<30?"20–52%":"52–75%";
     return{score:meld,label:`3-month mortality: ${mort}`,detail:"MELD ≥ 15 — evaluate for transplantation listing.",color:meld<10?C.teal:meld<20?C.gold:meld<30?C.orange:C.coral};
   }},

  {id:"child_pugh",cat:"GI",icon:"🫘",name:"Child-Pugh Score",desc:"Cirrhosis severity, prognosis, and surgical risk",ref:"Child & Turcotte 1964 · Pugh 1973",
   fields:[
     {k:"bili",label:"Bilirubin (mg/dL)",type:"select",options:["1 — < 2","2 — 2–3","3 — > 3"]},
     {k:"albumin",label:"Albumin (g/dL)",type:"select",options:["1 — > 3.5","2 — 2.8–3.5","3 — < 2.8"]},
     {k:"pt",label:"INR",type:"select",options:["1 — < 1.7","2 — 1.7–2.3","3 — > 2.3"]},
     {k:"ascites",label:"Ascites",type:"select",options:["1 — None","2 — Mild (responds to diuretics)","3 — Moderate–severe / refractory"]},
     {k:"enceph",label:"Hepatic Encephalopathy",type:"select",options:["1 — None","2 — Grade I–II (suppressed)","3 — Grade III–IV (refractory)"]},
   ],
   compute(v){
     const s=[v.bili,v.albumin,v.pt,v.ascites,v.enceph].reduce((a,x)=>a+(+(x?.charAt(0)||1)),0);
     const cls=s<=6?"A":s<=9?"B":"C";
     const mort=cls==="A"?"1-yr: 100%, 2-yr: 85%":cls==="B"?"1-yr: 81%, 2-yr: 57%":"1-yr: 45%, 2-yr: 35%";
     return{score:`${s} — Class ${cls}`,label:`Survival: ${mort}`,detail:"Class C (≥ 10) — urgent transplant evaluation. Class A: minor surgery tolerable.",color:cls==="A"?C.teal:cls==="B"?C.gold:C.coral};
   }},

  {id:"glasgow_blatchford",cat:"GI",icon:"🔴",name:"Glasgow-Blatchford Score",desc:"Upper GI bleed — need for intervention and endoscopy urgency",ref:"Blatchford et al. Lancet 2000",
   fields:[
     {k:"bun",label:"BUN (mg/dL)",type:"select",options:["0 — < 18.2","2 — 18.2–22.3","3 — 22.4–27.9","4 — 28–70","6 — > 70"]},
     {k:"hgb_m",label:"Haemoglobin — male (g/dL)",type:"select",options:["0 — ≥ 13","1 — 12–12.9","3 — 10–11.9","6 — < 10"]},
     {k:"sbp",label:"Systolic BP (mmHg)",type:"select",options:["0 — ≥ 110","1 — 100–109","2 — 90–99","3 — < 90"]},
     {k:"hr",label:"HR ≥ 100 bpm",type:"checkbox"},{k:"melena",label:"Melena on presentation",type:"checkbox"},
     {k:"syncope",label:"Syncope",type:"checkbox"},{k:"liver_disease",label:"Hepatic disease",type:"checkbox"},
     {k:"cardiac_failure",label:"Cardiac failure",type:"checkbox"},
   ],
   compute(v){
     const s=(+(v.bun?.charAt(0)||0))+(+(v.hgb_m?.charAt(0)||0))+(+(v.sbp?.charAt(0)||0))+(v.hr?1:0)+(v.melena?1:0)+(v.syncope?2:0)+(v.liver_disease?2:0)+(v.cardiac_failure?2:0);
     const r=s===0?"Score 0 — very low risk (outpatient management appropriate)":s<=6?"Low–moderate risk — likely requires endoscopy":"High risk — urgent upper endoscopy, monitored bed";
     return{score:s,label:r,detail:"Score 0 = safe for outpatient management. Score ≥ 7 = high risk for intervention.",color:s===0?C.teal:s<=6?C.gold:C.coral};
   }},
];

const ALL_CATS = ["All","Cardiac","Vascular","Neurology","Sepsis","Renal","Metabolic","Trauma","Ortho","OB/GYN","Pediatric","Dosing","GI"];
const CAT_COLORS = {
  All:C.teal, Cardiac:C.coral, Vascular:"#ff9f43", Neurology:C.purple,
  Sepsis:"#f5c842", Renal:C.blue, Metabolic:C.green, Trauma:"#ff9999",
  Ortho:"#f5a623", "OB/GYN":C.pink, Pediatric:"#b99bff", Dosing:"#6ab8ff", GI:"#3dffa0",
};

// ── Primitives ────────────────────────────────────────────────────
function GlassBg(){
  return(
    <div style={{position:"fixed",inset:0,overflow:"hidden",pointerEvents:"none",zIndex:0}}>
      {[{x:"8%",y:"18%",r:320,c:"rgba(0,229,192,0.055)"},{x:"88%",y:"10%",r:260,c:"rgba(59,158,255,0.05)"},{x:"80%",y:"78%",r:340,c:"rgba(155,109,255,0.05)"},{x:"15%",y:"82%",r:220,c:"rgba(245,200,66,0.04)"},{x:"50%",y:"45%",r:400,c:"rgba(0,229,192,0.03)"}].map((o,i)=>(
        <div key={i} style={{position:"absolute",left:o.x,top:o.y,width:o.r*2,height:o.r*2,borderRadius:"50%",background:`radial-gradient(circle,${o.c} 0%,transparent 68%)`,transform:"translate(-50%,-50%)",animation:`cgh${i%3} ${8+i*1.3}s ease-in-out infinite`}}/>
      ))}
      <svg width="100%" height="100%" style={{position:"absolute",inset:0,opacity:0.038}}>
        <defs><pattern id="cgg" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0L0 0 0 40" fill="none" stroke="#00e5c0" strokeWidth="0.5"/></pattern></defs>
        <rect width="100%" height="100%" fill="url(#cgg)"/>
      </svg>
      <style>{`
        @keyframes cgh0{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-50%) scale(1.12)}}
        @keyframes cgh1{0%,100%{transform:translate(-50%,-50%) scale(1.08)}50%{transform:translate(-50%,-50%) scale(0.9)}}
        @keyframes cgh2{0%,100%{transform:translate(-50%,-50%) scale(0.94)}50%{transform:translate(-50%,-50%) scale(1.1)}}
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

function CalcPanel({calc,onClose,onMedRef}){
  const[vals,setVals]=useState({});
  const result=useMemo(()=>{try{return calc.compute(vals);}catch{return null;}},[vals,calc]);
  const set=(k,v)=>setVals(p=>({...p,[k]:v}));
  const cc=CAT_COLORS[calc.cat]||C.teal;
  return(
    <div style={{position:"fixed",inset:0,zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(3,8,16,0.75)",backdropFilter:"blur(8px)"}}>
      <div style={{width:"min(600px,96vw)",maxHeight:"88vh",display:"flex",flexDirection:"column",background:"rgba(5,15,30,0.97)",border:`1px solid ${cc}35`,borderRadius:20,overflow:"hidden",boxShadow:`0 32px 80px rgba(0,0,0,0.7),0 0 0 1px ${cc}20`}}>
        <div style={{padding:"18px 22px 14px",borderBottom:"1px solid rgba(26,53,85,0.7)",background:`linear-gradient(135deg,${cc}08,transparent)`,flexShrink:0,position:"relative"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:2,borderRadius:"20px 20px 0 0",background:`linear-gradient(90deg,${cc},transparent)`}}/>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:44,height:44,borderRadius:12,background:`${cc}20`,border:`1px solid ${cc}35`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{calc.icon}</div>
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
        <div style={{flex:1,overflowY:"auto",padding:"16px 22px"}}>
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
            {calc.fields.map(f=>(
              <div key={f.k}>
                <label style={{fontSize:10,color:C.txt3,textTransform:"uppercase",letterSpacing:".06em",fontWeight:700,display:"block",marginBottom:4}}>{f.label}</label>
                {f.type==="checkbox"?(
                  <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",background:vals[f.k]?`${cc}08`:"rgba(14,37,68,0.4)",border:`1px solid ${vals[f.k]?`${cc}35`:"rgba(26,53,85,0.7)"}`,borderRadius:8,padding:"8px 12px",transition:"all .15s"}}>
                    <input type="checkbox" checked={!!vals[f.k]} onChange={e=>set(f.k,e.target.checked)} style={{width:16,height:16,accentColor:cc,cursor:"pointer"}}/>
                    <span style={{fontSize:12,color:vals[f.k]?cc:C.txt2}}>{f.label}</span>
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
                    onFocus={e=>e.target.style.borderColor=cc} onBlur={e=>e.target.style.borderColor="rgba(26,53,85,0.8)"}/>
                )}
              </div>
            ))}
          </div>
          {result?(
            <div style={{borderRadius:14,padding:"16px 18px",background:`${result.color}10`,border:`1.5px solid ${result.color}40`,backdropFilter:"blur(8px)"}}>
              <div style={{fontSize:11,color:C.txt3,textTransform:"uppercase",letterSpacing:".08em",fontFamily:"'JetBrains Mono',monospace",marginBottom:8}}>Result</div>
              <div style={{fontSize:26,fontWeight:700,color:result.color,fontFamily:"'JetBrains Mono',monospace",lineHeight:1,marginBottom:8}}>{result.score}</div>
              <div style={{fontSize:13,fontWeight:600,color:result.color,marginBottom:result.detail?6:0,lineHeight:1.4}}>{result.label}</div>
              {result.detail&&<div style={{fontSize:11,color:C.txt2,lineHeight:1.55}}>{result.detail}</div>}
              {calc.medRef&&<div style={{marginTop:12,fontSize:11,color:C.orange,fontFamily:"'JetBrains Mono',monospace",cursor:"pointer"}} onClick={()=>onMedRef&&onMedRef()}>⚕ See Medication Reference →</div>}
            </div>
          ):<div style={{textAlign:"center",padding:"16px 0",color:C.txt3,fontSize:12}}>Enter values above to calculate</div>}
        </div>
        <div style={{padding:"10px 22px 14px",borderTop:"1px solid rgba(26,53,85,0.5)",flexShrink:0}}>
          <div style={{fontSize:9,color:C.txt4,fontFamily:"'JetBrains Mono',monospace"}}>Ref: {calc.ref} · Clinical decision support only — verify with primary sources</div>
        </div>
      </div>
    </div>
  );
}

function CalcCard({calc,onOpen,index}){
  const[hov,setHov]=useState(false);
  const cc=CAT_COLORS[calc.cat]||C.teal;
  return(
    <div onClick={()=>onOpen(calc)} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{position:"relative",borderRadius:16,padding:"16px 16px 14px",cursor:"pointer",overflow:"hidden",transition:"all 0.3s cubic-bezier(0.34,1.56,0.64,1)",transform:hov?"translateY(-5px) scale(1.02)":"translateY(0) scale(1)",animation:`chi ${0.45+index*0.025}s ease both`,
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
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────
export default function CalculatorHub({ onBack, navigateToMedRef }) {
  const navigate = useNavigate();
  const handleBack = onBack || (() => navigate("/hub"));
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

        {/* Hero */}
        <GBox style={{padding:"22px 28px 20px",marginBottom:16,position:"relative",overflow:"hidden",boxShadow:"0 8px 40px rgba(0,0,0,0.55),0 0 30px rgba(0,229,192,0.08),inset 0 1px 0 rgba(255,255,255,0.04)"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:2.5,background:"linear-gradient(90deg,#00e5c0,#3b9eff,#9b6dff,#ff6b6b,#f5c842,#00e5c0)",borderRadius:"16px 16px 0 0"}}/>
          <div style={{position:"absolute",inset:0,background:"linear-gradient(108deg,rgba(0,229,192,0.04) 0%,transparent 55%,rgba(59,158,255,0.03) 100%)",pointerEvents:"none"}}/>
          <div style={{display:"flex",alignItems:"center",gap:18,position:"relative"}}>
            <button onClick={handleBack} style={{padding:"6px 14px",background:"rgba(14,37,68,0.6)",border:"1px solid rgba(42,79,122,0.6)",borderRadius:10,color:C.txt3,fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",backdropFilter:"blur(8px)",flexShrink:0,whiteSpace:"nowrap"}}>← Hub</button>
            <div style={{width:58,height:58,borderRadius:16,background:"linear-gradient(135deg,rgba(0,229,192,0.2),rgba(59,158,255,0.12))",border:"1px solid rgba(0,229,192,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0,boxShadow:"0 0 22px rgba(0,229,192,0.2)"}}>🧮</div>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:5,flexWrap:"wrap"}}>
                <span style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:700,color:C.txt,lineHeight:1}}>Calculator Hub</span>
                <span style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,padding:"3px 10px",borderRadius:20,background:"rgba(0,229,192,0.1)",color:C.teal,border:"1px solid rgba(0,229,192,0.3)",letterSpacing:".06em"}}>{CALCS.length} CALCULATORS</span>
              </div>
              <p style={{fontSize:12,color:C.txt2,margin:0,lineHeight:1.6}}>Clinical scores · Risk stratification · Weight-based dosing · Metabolic calculations — all evidence-based, all in one place.</p>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,flexShrink:0}}>
              {[{v:CALCS.filter(c=>c.medRef).length,l:"Dosing Calcs",col:C.orange},{v:CALCS.filter(c=>!c.medRef).length,l:"Clinical Scores",col:C.teal},{v:ALL_CATS.length-1,l:"Categories",col:C.blue},{v:"62",l:"Total Calcs",col:C.purple}].map((s,i)=>(
                <div key={i} style={{textAlign:"center",background:"rgba(14,37,68,0.6)",borderRadius:10,padding:"7px 10px",border:"1px solid rgba(26,53,85,0.8)"}}>
                  <div style={{fontSize:13,fontWeight:700,color:s.col,fontFamily:"'JetBrains Mono',monospace",lineHeight:1.1}}>{s.v}</div>
                  <div style={{fontSize:8,color:C.txt4,marginTop:2,textTransform:"uppercase",letterSpacing:".06em"}}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </GBox>

        {/* Search + Filters */}
        <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:14,flexWrap:"wrap"}}>
          <div style={{position:"relative",flex:1,minWidth:220,maxWidth:400}}>
            <span style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",fontSize:14,opacity:0.35}}>🔍</span>
            <input ref={searchRef} type="text" placeholder="Search 62 calculators…" value={search} onChange={e=>setSearch(e.target.value)}
              style={{width:"100%",background:"rgba(8,22,40,0.8)",border:"1px solid rgba(42,79,122,0.6)",borderRadius:11,padding:"9px 14px 9px 40px",color:C.txt,fontFamily:"'DM Sans',sans-serif",fontSize:12,outline:"none",backdropFilter:"blur(14px)"}}
              onFocus={e=>e.target.style.borderColor="rgba(0,229,192,0.5)"} onBlur={e=>e.target.style.borderColor="rgba(42,79,122,0.6)"}/>
            {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:C.txt3,cursor:"pointer",fontSize:16,lineHeight:1,padding:0}}>×</button>}
          </div>
          <span style={{fontSize:11,color:C.txt4,fontFamily:"'JetBrains Mono',monospace",marginLeft:"auto"}}>{filtered.length} result{filtered.length!==1?"s":""}</span>
        </div>

        {/* Category tabs */}
        <div style={{display:"flex",gap:5,overflowX:"auto",marginBottom:18,paddingBottom:4,scrollbarWidth:"none"}}>
          {ALL_CATS.map(c=>{
            const active=c===cat,cc=CAT_COLORS[c]||C.teal;
            return(
              <button key={c} onClick={()=>setCat(c)}
                style={{display:"flex",alignItems:"center",gap:5,padding:"7px 14px",borderRadius:24,fontSize:11,fontWeight:active?700:500,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",transition:"all .2s",whiteSpace:"nowrap",flexShrink:0,background:active?`${cc}18`:"rgba(8,22,40,0.75)",border:`1px solid ${active?`${cc}45`:"rgba(42,79,122,0.5)"}`,color:active?cc:C.txt3,backdropFilter:"blur(12px)",boxShadow:active?`0 0 12px ${cc}18`:"none"}}>
                {c} <span style={{fontSize:9,opacity:0.65,fontFamily:"'JetBrains Mono',monospace"}}>({catCounts[c]})</span>
              </button>
            );
          })}
        </div>

        {/* Dosing warning */}
        {(cat==="Dosing"||cat==="All")&&(
          <div style={{background:"rgba(255,159,67,0.06)",border:"1px solid rgba(255,159,67,0.2)",borderRadius:10,padding:"9px 14px",marginBottom:16,display:"flex",alignItems:"center",gap:10,backdropFilter:"blur(10px)"}}>
            <span style={{fontSize:16}}>⚕</span>
            <span style={{fontSize:11,color:C.txt2}}>Dosing calculators are clinical decision support only. Always verify with the <span style={{color:C.orange,cursor:navigateToMedRef?"pointer":"default",fontWeight:600}} onClick={()=>navigateToMedRef&&navigateToMedRef()}>Medication Reference</span> for full contraindications, drug interactions, and monitoring parameters.</span>
          </div>
        )}

        {/* Grid */}
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

        {/* Footer */}
        <div style={{marginTop:24,borderRadius:12,padding:"11px 16px",background:"rgba(5,15,30,0.65)",border:"1px solid rgba(26,53,85,0.6)",backdropFilter:"blur(12px)",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
          <span style={{fontSize:10,color:C.teal,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,flexShrink:0}}>⚕ EVIDENCE BASE</span>
          {["GRACE Registry","TIMI Study Group","Wells DVT/PE","PERC Rule","PESI","NIHSS","PECARN","Ottawa Rules","SOFA/Sepsis-3","Broselow-Luten","PSI/PORT","ASSENT-2","Ranson/BISAP","GBS Score","CKD-EPI 2021","Cockcroft-Gault","ACOG Guidelines"].map((r,i)=>(
            <span key={i} style={{fontSize:10,color:C.txt4}}>{i>0&&<span style={{marginRight:8,color:C.txt4}}>·</span>}{r}</span>
          ))}
        </div>
      </div>

      <style>{`
        *{box-sizing:border-box}
        input::placeholder{color:#2e4a6a}
        button{outline:none}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#1a3555;border-radius:2px}
        @keyframes chi{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
    </div>
  );
}