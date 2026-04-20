// ScoreHub.jsx
// Clinical Score Calculator Hub — 12 validated ED scoring tools.
// Auto-populates from encounter data when embedded props are provided.
// Standalone page + embeddable in encounter.
//
// Scores: HEART, TIMI, Wells DVT, Wells PE, PERC, CURB-65,
//         Ottawa Ankle, Ottawa Knee, NEXUS, Canadian CT Head, GCS, ABCD2
//
// Constraints: no form, no localStorage, straight quotes only,
//   single react import, no router dependency (onBack prop for standalone nav).

import { useState, useCallback, useMemo } from "react";

// ── Font injection ─────────────────────────────────────────────────────────────
(() => {
  if (document.getElementById("score-fonts")) return;
  const l = document.createElement("link");
  l.id = "score-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "score-css";
  s.textContent = `
    @keyframes sc-fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
    .sc-fade{animation:sc-fade .2s ease forwards;}
    @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
    .shimmer-text{
      background:linear-gradient(90deg,#e8f0fe 0%,#fff 30%,#9b6dff 52%,#00e5c0 72%,#e8f0fe 100%);
      background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;
      background-clip:text;animation:shimmer 5s linear infinite;
    }
  `;
  document.head.appendChild(s);
})();

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36",
  b:"rgba(26,53,85,0.8)",
  txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0", cyan:"#00d4ff",
  red:"#ff4444",
};

// ── Score definitions ─────────────────────────────────────────────────────────
const SCORES = [
  // ── HEART ─────────────────────────────────────────────────────────────────
  {
    id:"heart", name:"HEART Score", icon:"❤️", color:T.red, cat:"cardiac",
    tagline:"Chest pain ACS risk stratification",
    ref:"Brady 2010 · ACEP guidelines",
    autoPopulate:(demo) => ({
      age: parseInt(demo?.age) >= 65 ? 2 : parseInt(demo?.age) >= 45 ? 1 : 0,
    }),
    fields:[
      { id:"history", label:"History", type:"radio", options:[
        { label:"Slightly suspicious", value:0, hint:"Vague, atypical, no cardiac risk" },
        { label:"Moderately suspicious", value:1, hint:"Mixed features" },
        { label:"Highly suspicious", value:2, hint:"Classic pattern, diaphoresis, radiation" },
      ]},
      { id:"ekg", label:"ECG", type:"radio", options:[
        { label:"Normal", value:0 },
        { label:"Non-specific repolarization disturbance", value:1, hint:"LBBB, LVH, early repol, digoxin changes" },
        { label:"Significant ST deviation", value:2, hint:"ST depression/elevation not due to LBBB/LVH" },
      ]},
      { id:"age", label:"Age", type:"radio", options:[
        { label:"< 45", value:0 },
        { label:"45 - 64", value:1 },
        { label:">= 65", value:2 },
      ]},
      { id:"risk", label:"Risk Factors", type:"radio", options:[
        { label:"No known risk factors", value:0 },
        { label:"1-2 risk factors", value:1, hint:"HTN, hyperlipidemia, DM, obesity, smoking, family history" },
        { label:">=3 risk factors OR known atherosclerotic disease", value:2 },
      ]},
      { id:"troponin", label:"Initial Troponin", type:"radio", options:[
        { label:"<= normal limit", value:0 },
        { label:"1-3x normal limit", value:1 },
        { label:"> 3x normal limit", value:2 },
      ]},
    ],
    calculate(f) {
      const s = (f.history||0)+(f.ekg||0)+(f.age||0)+(f.risk||0)+(f.troponin||0);
      const mace = s<=3?"~1.7%":s<=6?"~12%":"~65%";
      return {
        score:s, display:`${s} / 10`,
        level:s<=3?"low":s<=6?"moderate":"high",
        levelLabel:s<=3?"Low Risk":s<=6?"Moderate Risk":"High Risk",
        color:s<=3?T.teal:s<=6?T.gold:T.coral,
        riskLabel:`30-day MACE ${mace}`,
        recommendation:s<=3
          ? "Low risk — consider accelerated discharge with serial troponins. MACE rate ~1.7%."
          : s<=6
          ? "Moderate risk — admit for observation, stress testing or coronary CTA. MACE ~12%."
          : "High risk — early cardiology consult, invasive strategy. MACE ~65%.",
      };
    },
  },

  // ── TIMI (UA/NSTEMI) ──────────────────────────────────────────────────────
  {
    id:"timi", name:"TIMI Score", icon:"🩺", color:T.orange, cat:"cardiac",
    tagline:"UA / NSTEMI 14-day risk",
    ref:"Antman 2000 · TIMI Risk Study Group",
    autoPopulate:(demo) => ({
      age65: parseInt(demo?.age) >= 65 ? 1 : 0,
    }),
    fields:[
      { id:"age65",     label:"Age >= 65",                                 type:"check", value:1 },
      { id:"riskfx",    label:">= 3 CAD risk factors",                     type:"check", value:1,
        hint:"Family history, HTN, hypercholesterolemia, DM, active smoker" },
      { id:"stenosis",  label:"Prior coronary stenosis >= 50%",            type:"check", value:1 },
      { id:"stdep",     label:"ST-segment deviation on presenting ECG",    type:"check", value:1 },
      { id:"events",    label:">= 2 anginal events in prior 24 hours",     type:"check", value:1 },
      { id:"asa",       label:"ASA use in past 7 days",                    type:"check", value:1 },
      { id:"markers",   label:"Elevated serum cardiac markers",            type:"check", value:1 },
    ],
    calculate(f) {
      const s = ["age65","riskfx","stenosis","stdep","events","asa","markers"]
        .reduce((t,k)=>t+(f[k]?1:0),0);
      const pct = s<=2?"5-8%":s<=4?"13-20%":"26-41%";
      return {
        score:s, display:`${s} / 7`,
        level:s<=2?"low":s<=4?"moderate":"high",
        levelLabel:s<=2?"Low Risk":s<=4?"Intermediate Risk":"High Risk",
        color:s<=2?T.teal:s<=4?T.gold:T.coral,
        riskLabel:`14-day death/MI/revascularization ${pct}`,
        recommendation:s<=2
          ? "Low risk — conservative management appropriate. 14-day event rate 5-8%."
          : s<=4
          ? "Intermediate risk — early anticoagulation, cardiology input. Event rate 13-20%."
          : "High risk — aggressive medical therapy and early invasive strategy. Event rate 26-41%.",
      };
    },
  },

  // ── Wells DVT ──────────────────────────────────────────────────────────────
  {
    id:"wellsdvt", name:"Wells DVT", icon:"🦵", color:T.blue, cat:"vascular",
    tagline:"Deep vein thrombosis pre-test probability",
    ref:"Wells 1997 · Prospective validation",
    autoPopulate:()=>({}),
    fields:[
      { id:"cancer",    label:"Active cancer (treatment within 6 months or palliative)", type:"check", value:1 },
      { id:"paralysis", label:"Paralysis, paresis, or recent plaster cast of lower extremity", type:"check", value:1 },
      { id:"bedrest",   label:"Bedridden >3 days or major surgery within 12 weeks", type:"check", value:1 },
      { id:"tenderness",label:"Localized tenderness along deep venous system", type:"check", value:1 },
      { id:"entireleg", label:"Entire leg swollen", type:"check", value:1 },
      { id:"calfswel",  label:"Calf swelling >3 cm compared to asymptomatic side", type:"check", value:1 },
      { id:"pittedema", label:"Pitting edema in symptomatic leg only", type:"check", value:1 },
      { id:"collat",    label:"Collateral superficial veins (non-varicose)", type:"check", value:1 },
      { id:"prevdvt",   label:"Previously documented DVT", type:"check", value:1 },
      { id:"altdx",     label:"Alternative diagnosis at least as likely as DVT", type:"check", value:-2 },
    ],
    calculate(f) {
      const s = ["cancer","paralysis","bedrest","tenderness","entireleg",
        "calfswel","pittedema","collat","prevdvt"].reduce((t,k)=>t+(f[k]?1:0),0)
        + (f.altdx ? -2 : 0);
      const level = s<=0?"low":s<=2?"moderate":"high";
      const prev  = s<=0?"3%":s<=2?"17%":"75%";
      return {
        score:s, display:`${s} pts`,
        level, levelLabel:s<=0?"Low Probability":s<=2?"Moderate Probability":"High Probability",
        color:s<=0?T.teal:s<=2?T.gold:T.coral,
        riskLabel:`DVT prevalence ${prev}`,
        recommendation:s<=0
          ? "Low probability (3%) — D-dimer; if negative, DVT excluded. Ultrasound if D-dimer positive."
          : s<=2
          ? "Moderate probability (17%) — Ultrasound compression. Repeat if negative at 1 week if clinical suspicion persists."
          : "High probability (75%) — Ultrasound immediately. Empiric anticoagulation while awaiting.",
      };
    },
  },

  // ── Wells PE ──────────────────────────────────────────────────────────────
  {
    id:"wellspe", name:"Wells PE", icon:"🫁", color:T.purple, cat:"pulm",
    tagline:"Pulmonary embolism pre-test probability",
    ref:"Wells 2000 · Thrombosis Haemost",
    autoPopulate:(demo, vitals)=>({
      hr100: parseFloat(vitals?.hr||0) > 100 ? 1 : 0,
    }),
    fields:[
      { id:"dvtsigns",  label:"Clinical signs/symptoms of DVT", type:"check", value:3 },
      { id:"pelikely",  label:"PE is #1 diagnosis or equally likely", type:"check", value:3 },
      { id:"hr100",     label:"Heart rate > 100 bpm", type:"check", value:1.5 },
      { id:"immob",     label:"Immobilization >=3 days or surgery in previous 4 weeks", type:"check", value:1.5 },
      { id:"prevdvtpe", label:"Previous DVT or PE", type:"check", value:1.5 },
      { id:"hemopt",    label:"Hemoptysis", type:"check", value:1 },
      { id:"malig",     label:"Malignancy treated within 6 months or palliative", type:"check", value:1 },
    ],
    calculate(f) {
      const s = (f.dvtsigns?3:0)+(f.pelikely?3:0)+(f.hr100?1.5:0)
        +(f.immob?1.5:0)+(f.prevdvtpe?1.5:0)+(f.hemopt?1:0)+(f.malig?1:0);
      const level3 = s<2?"low":s<=6?"moderate":"high";
      const level2 = s<=4?"unlikely":"likely";
      const prev3  = s<2?"1.3%":s<=6?"16.2%":"37.5%";
      return {
        score:s, display:`${s} pts`,
        level:level3, levelLabel:level3==="low"?"Low Probability":level3==="moderate"?"Moderate Probability":"High Probability",
        color:level3==="low"?T.teal:level3==="moderate"?T.gold:T.coral,
        riskLabel:`PE probability ${prev3} · 2-tier: ${level2==="unlikely"?"PE unlikely (<=4)":"PE likely (>4)"}`,
        recommendation:level3==="low"
          ? "Low probability — D-dimer. Negative D-dimer excludes PE. PERC may preempt D-dimer."
          : level3==="moderate"
          ? "Moderate probability — CT pulmonary angiography. D-dimer first if low two-level score."
          : "High probability — CTPA without delay. Empiric anticoagulation if imaging unavailable.",
      };
    },
  },

  // ── PERC ──────────────────────────────────────────────────────────────────
  {
    id:"perc", name:"PERC Rule", icon:"⭕", color:T.cyan, cat:"pulm",
    tagline:"PE exclusion without D-dimer",
    ref:"Kline 2004 · J Thromb Haemost · Gestalt PE <15%",
    autoPopulate:(demo, vitals)=>({
      age50:  parseInt(demo?.age||0) >= 50,
      hr100:  parseFloat(vitals?.hr||0) >= 100,
      spo95:  parseFloat(vitals?.spo2||99) < 95,
    }),
    fields:[
      { id:"age50",   label:"Age >= 50",                                   type:"check", value:1 },
      { id:"hr100",   label:"Heart rate >= 100 bpm",                       type:"check", value:1 },
      { id:"spo95",   label:"SpO2 < 95% on room air",                      type:"check", value:1 },
      { id:"legswel", label:"Unilateral leg swelling",                     type:"check", value:1 },
      { id:"hemopt",  label:"Hemoptysis",                                  type:"check", value:1 },
      { id:"surgery", label:"Surgery or trauma requiring hospitalization in past 4 weeks", type:"check", value:1 },
      { id:"prevdvt", label:"Prior DVT or PE",                             type:"check", value:1 },
      { id:"hormones",label:"Hormone use (OCP, HRT, estrogenic hormones)", type:"check", value:1 },
    ],
    calculate(f) {
      const pos = ["age50","hr100","spo95","legswel","hemopt","surgery","prevdvt","hormones"]
        .filter(k=>f[k]).length;
      return {
        score:pos, display:pos===0?"PERC Negative":"PERC Positive",
        level:pos===0?"low":"high",
        levelLabel:pos===0?"Rule Out PE":"Cannot Rule Out",
        color:pos===0?T.green:T.coral,
        riskLabel:pos===0?"Post-test PE probability < 2%":`${pos} criterion/criteria positive`,
        recommendation:pos===0
          ? "All PERC criteria negative — PE excluded without D-dimer in low gestalt pre-test probability (<15%). No further workup needed."
          : "PERC positive — proceed to D-dimer (if Wells low/moderate) or CTPA (if Wells high). Cannot use PERC to exclude.",
      };
    },
  },

  // ── CURB-65 ───────────────────────────────────────────────────────────────
  {
    id:"curb65", name:"CURB-65", icon:"🫁", color:T.blue, cat:"pulm",
    tagline:"Community-acquired pneumonia severity",
    ref:"Lim 2003 · Thorax · British Thoracic Society",
    autoPopulate:(demo, vitals)=>({
      age65: parseInt(demo?.age||0) >= 65,
      rr30:  parseFloat(vitals?.rr||0) >= 30,
      sbp90: (()=>{
        const bp = (vitals?.bp||"").split("/");
        return parseInt(bp[0]||999) < 90 || parseInt(bp[1]||999) <= 60;
      })(),
    }),
    fields:[
      { id:"confusion",label:"Confusion (new disorientation to person/place/time)", type:"check", value:1 },
      { id:"bun",      label:"BUN > 19 mg/dL (urea > 7 mmol/L)",                   type:"check", value:1 },
      { id:"rr30",     label:"Respiratory rate >= 30 breaths/min",                  type:"check", value:1 },
      { id:"sbp90",    label:"Systolic BP < 90 or diastolic BP <= 60 mmHg",        type:"check", value:1 },
      { id:"age65",    label:"Age >= 65",                                           type:"check", value:1 },
    ],
    calculate(f) {
      const s = ["confusion","bun","rr30","sbp90","age65"].reduce((t,k)=>t+(f[k]?1:0),0);
      const mort = s<=1?"<3%":s===2?"~9%":"~22%";
      return {
        score:s, display:`${s} / 5`,
        level:s<=1?"low":s===2?"moderate":"high",
        levelLabel:s<=1?"Low Severity":s===2?"Moderate Severity":"High Severity",
        color:s<=1?T.teal:s===2?T.gold:T.coral,
        riskLabel:`30-day mortality ${mort}`,
        recommendation:s<=1
          ? "Low severity (0-1) — outpatient treatment appropriate. 30-day mortality <3%."
          : s===2
          ? "Moderate severity (2) — consider short inpatient admission or supervised outpatient. Mortality ~9%."
          : "High severity (3-5) — hospitalize; score 4-5 consider ICU. Mortality ~22%.",
      };
    },
  },

  // ── Ottawa Ankle ──────────────────────────────────────────────────────────
  {
    id:"ottawa_ankle", name:"Ottawa Ankle", icon:"🦶", color:T.gold, cat:"trauma",
    tagline:"Ankle and midfoot fracture — X-ray decision rule",
    ref:"Stiell 1992 · JAMA · Sensitivity >99%",
    autoPopulate:()=>({}),
    fields:[
      { id:"lat_mall",  label:"Bone tenderness — posterior edge/tip of lateral malleolus (6cm zone)", type:"check", value:1 },
      { id:"med_mall",  label:"Bone tenderness — posterior edge/tip of medial malleolus (6cm zone)", type:"check", value:1 },
      { id:"wt_ankle",  label:"Unable to bear weight 4 steps (ankle — immediately and in ED)", type:"check", value:1 },
      { id:"5th_met",   label:"Bone tenderness — base of 5th metatarsal (midfoot)", type:"check", value:1 },
      { id:"navicular", label:"Bone tenderness at navicular (midfoot)", type:"check", value:1 },
      { id:"wt_foot",   label:"Unable to bear weight 4 steps (midfoot — immediately and in ED)", type:"check", value:1 },
    ],
    calculate(f) {
      const anklePx  = f.lat_mall || f.med_mall || f.wt_ankle;
      const midfootPx = f["5th_met"] || f.navicular || f.wt_foot;
      const xray = anklePx || midfootPx;
      return {
        score: xray ? 1 : 0,
        display: xray ? "X-Ray Indicated" : "X-Ray Not Required",
        level: xray ? "high" : "low",
        levelLabel: xray ? "Imaging Indicated" : "No Imaging Needed",
        color: xray ? T.coral : T.teal,
        riskLabel: anklePx && midfootPx ? "Ankle AND midfoot X-rays indicated" :
          anklePx ? "Ankle X-ray indicated" :
          midfootPx ? "Foot (midfoot) X-ray indicated" :
          "Ottawa criteria negative — fracture effectively excluded",
        recommendation: xray
          ? `X-ray indicated: ${[anklePx?"ankle series":null,midfootPx?"foot series":null].filter(Boolean).join(" + ")}. Ottawa rule sensitivity >99% for clinically significant fractures.`
          : "Ottawa criteria negative — clinically significant fracture excluded (sensitivity >99%). Conservative management: RICE, weight-bear as tolerated, follow up if not improving.",
      };
    },
  },

  // ── Ottawa Knee ───────────────────────────────────────────────────────────
  {
    id:"ottawa_knee", name:"Ottawa Knee", icon:"🦵", color:T.gold, cat:"trauma",
    tagline:"Knee fracture — X-ray decision rule",
    ref:"Stiell 1996 · JAMA · Sensitivity 98-100%",
    autoPopulate:(demo)=>({
      age55: parseInt(demo?.age||0) >= 55,
    }),
    fields:[
      { id:"age55",    label:"Age >= 55",                                    type:"check", value:1 },
      { id:"pat_tend", label:"Isolated tenderness of patella (no other bony tenderness)", type:"check", value:1 },
      { id:"fib_head", label:"Tenderness at head of fibula",                type:"check", value:1 },
      { id:"flex90",   label:"Inability to flex knee to 90 degrees",        type:"check", value:1 },
      { id:"wt_bear",  label:"Inability to bear weight 4 steps (immediately and in ED)", type:"check", value:1 },
    ],
    calculate(f) {
      const xray = f.age55 || f.pat_tend || f.fib_head || f.flex90 || f.wt_bear;
      return {
        score: xray ? 1 : 0,
        display: xray ? "X-Ray Indicated" : "X-Ray Not Required",
        level: xray ? "high" : "low",
        levelLabel: xray ? "Imaging Indicated" : "No Imaging Needed",
        color: xray ? T.coral : T.teal,
        riskLabel: "Ottawa Knee sensitivity 98-100% for fracture",
        recommendation: xray
          ? "X-ray indicated — one or more Ottawa Knee criteria met. AP, lateral, and possibly sunrise views."
          : "Ottawa Knee criteria negative — fracture effectively excluded. Conservative management appropriate.",
      };
    },
  },

  // ── NEXUS C-Spine ─────────────────────────────────────────────────────────
  {
    id:"nexus", name:"NEXUS C-Spine", icon:"🔬", color:T.purple, cat:"trauma",
    tagline:"Cervical spine imaging — low-risk clearance",
    ref:"Hoffman 2000 · NEJM · Sensitivity 99.6%",
    autoPopulate:()=>({}),
    note:"Mark any criterion as PRESENT if criteria are NOT met (risk factors present)",
    fields:[
      { id:"tenderness", label:"Midline posterior cervical tenderness present",        type:"check", value:1 },
      { id:"alertness",  label:"Altered level of alertness (not GCS 15)",             type:"check", value:1 },
      { id:"intox",      label:"Evidence of intoxication",                            type:"check", value:1 },
      { id:"focal",      label:"Focal neurological deficit present",                  type:"check", value:1 },
      { id:"distract",   label:"Painful distracting injury present",                  type:"check", value:1 },
    ],
    calculate(f) {
      const pos = ["tenderness","alertness","intox","focal","distract"].filter(k=>f[k]).length;
      return {
        score:pos, display:pos===0?"Low Risk":"Imaging Required",
        level:pos===0?"low":"high",
        levelLabel:pos===0?"NEXUS Negative — Low Risk":"NEXUS Positive",
        color:pos===0?T.green:T.coral,
        riskLabel:pos===0?"C-spine fracture risk <0.1%":`${pos} criterion/criteria positive`,
        recommendation:pos===0
          ? "All NEXUS criteria negative — C-spine imaging not required (sensitivity 99.6%). Clinical clearance appropriate."
          : "NEXUS positive — C-spine CT indicated. Plain films insufficient to exclude instability. Keep C-collar until imaging reviewed.",
      };
    },
  },

  // ── Canadian CT Head ──────────────────────────────────────────────────────
  {
    id:"cchr", name:"Canadian CT Head", icon:"🧠", color:T.purple, cat:"trauma",
    tagline:"CT head indication after minor head injury",
    ref:"Stiell 2001 · Lancet · For GCS 13-15 patients",
    autoPopulate:()=>({}),
    fields:[
      { id:"gcs2h",    label:"HIGH RISK: GCS score < 15 at 2 hours after injury",      type:"check", value:1 },
      { id:"openfx",   label:"HIGH RISK: Suspected open or depressed skull fracture",  type:"check", value:1 },
      { id:"baseskull",label:"HIGH RISK: Any sign of basal skull fracture",            type:"check", value:1,
        hint:"Hemotympanum, raccoon eyes, CSF otorrhea/rhinorrhea, Battle sign" },
      { id:"vomiting", label:"HIGH RISK: Vomiting >= 2 episodes",                     type:"check", value:1 },
      { id:"age65",    label:"HIGH RISK: Age >= 65",                                   type:"check", value:1 },
      { id:"amnesia",  label:"MEDIUM RISK: Amnesia before impact >= 30 minutes",      type:"check", value:0.5 },
      { id:"danger",   label:"MEDIUM RISK: Dangerous mechanism",                      type:"check", value:0.5,
        hint:"Pedestrian vs vehicle, ejection from vehicle, fall >3 feet or 5 stairs" },
    ],
    calculate(f) {
      const hi = f.gcs2h||f.openfx||f.baseskull||f.vomiting||f.age65;
      const med = f.amnesia||f.danger;
      const ct = hi || med;
      return {
        score: ct ? 1 : 0,
        display: ct ? "CT Indicated" : "CT Not Required",
        level: ct ? (hi ? "high" : "moderate") : "low",
        levelLabel: ct ? (hi ? "CT Indicated — High-Risk Finding" : "CT Indicated — Medium-Risk Finding") : "No CT Required",
        color: ct ? (hi ? T.coral : T.gold) : T.teal,
        riskLabel: hi ? "High-risk criterion present — CT required" : med ? "Medium-risk criterion — CT recommended" : "No criteria met — CT not indicated",
        recommendation: !ct
          ? "No CCHR criteria met — CT not indicated. Safe for discharge with head injury precautions and return instructions."
          : hi
          ? "High-risk criterion present — CT head immediately. Neurosurgery notification if positive."
          : "Medium-risk criterion — CT head recommended. Low probability of neurosurgical intervention but important to exclude.",
      };
    },
  },

  // ── GCS ───────────────────────────────────────────────────────────────────
  {
    id:"gcs", name:"Glasgow Coma Scale", icon:"👁️", color:T.cyan, cat:"neuro",
    tagline:"Level of consciousness — airway and severity guide",
    ref:"Teasdale & Jennett 1974 · Lancet",
    autoPopulate:()=>({ eye:4, verbal:5, motor:6 }),
    fields:[
      { id:"eye", label:"Eye Opening", type:"radio", options:[
        { label:"None (1)", value:1 },
        { label:"To pain (2)", value:2 },
        { label:"To voice (3)", value:3 },
        { label:"Spontaneous (4)", value:4 },
      ]},
      { id:"verbal", label:"Verbal Response", type:"radio", options:[
        { label:"None (1)", value:1 },
        { label:"Incomprehensible sounds (2)", value:2 },
        { label:"Inappropriate words (3)", value:3 },
        { label:"Confused (4)", value:4 },
        { label:"Oriented (5)", value:5 },
      ]},
      { id:"motor", label:"Motor Response", type:"radio", options:[
        { label:"None (1)", value:1 },
        { label:"Extension — decerebrate (2)", value:2 },
        { label:"Flexion — decorticate (3)", value:3 },
        { label:"Withdrawal (4)", value:4 },
        { label:"Localizes to pain (5)", value:5 },
        { label:"Obeys commands (6)", value:6 },
      ]},
    ],
    calculate(f) {
      const e=f.eye||4, v=f.verbal||5, m=f.motor||6;
      const s=e+v+m;
      const level=s<=8?"severe":s<=12?"moderate":"mild";
      return {
        score:s, display:`${s}/15 (E${e}V${v}M${m})`,
        level,
        levelLabel:s<=8?"Severe TBI":s<=12?"Moderate TBI":"Mild TBI",
        color:s<=8?T.coral:s<=12?T.gold:T.teal,
        riskLabel:`E${e}V${v}M${m} · ${s<=8?"Intubation threshold":s<=12?"Close monitoring":"Standard precautions"}`,
        recommendation:s<=8
          ? "Severe TBI (GCS <=8) — airway protection indicated. RSI intubation. Neurosurgery, head CT, ICP monitoring discussion."
          : s<=12
          ? "Moderate TBI (GCS 9-12) — close monitoring, serial GCS, head CT. Low threshold for intubation if deteriorating."
          : "Mild TBI (GCS 13-15) — CT based on CCHR/NEXUS criteria. Discharge with head injury precautions if CT negative.",
      };
    },
  },

  // ── ABCD2 ─────────────────────────────────────────────────────────────────
  {
    id:"abcd2", name:"ABCD2 Score", icon:"🧠", color:T.orange, cat:"neuro",
    tagline:"TIA — 2-day stroke risk",
    ref:"Johnston 2007 · Lancet · For TIA risk stratification",
    autoPopulate:(demo, vitals)=>({
      age60: parseInt(demo?.age||0) >= 60 ? 1 : 0,
      bp:    (()=>{
        const bp=(vitals?.bp||"").split("/");
        return parseInt(bp[0]||0)>=140||parseInt(bp[1]||0)>=90?1:0;
      })(),
    }),
    fields:[
      { id:"age60", label:"Age >= 60", type:"radio", options:[
        { label:"No (< 60)", value:0 },
        { label:"Yes (>= 60)", value:1 },
      ]},
      { id:"bp", label:"BP >= 140/90 on initial evaluation", type:"radio", options:[
        { label:"No", value:0 },
        { label:"Yes", value:1 },
      ]},
      { id:"clinical", label:"Clinical Features", type:"radio", options:[
        { label:"Other symptom", value:0 },
        { label:"Speech disturbance without unilateral weakness", value:1 },
        { label:"Unilateral weakness", value:2 },
      ]},
      { id:"duration", label:"Duration of symptoms", type:"radio", options:[
        { label:"< 10 minutes", value:0 },
        { label:"10 - 59 minutes", value:1 },
        { label:">= 60 minutes", value:2 },
      ]},
      { id:"diabetes", label:"Diabetes (history of or on hypoglycemics)", type:"radio", options:[
        { label:"No", value:0 },
        { label:"Yes", value:1 },
      ]},
    ],
    calculate(f) {
      const s=(f.age60||0)+(f.bp||0)+(f.clinical||0)+(f.duration||0)+(f.diabetes||0);
      const risk=s<=3?"1.0%":s<=5?"4.1%":"8.1%";
      return {
        score:s, display:`${s} / 7`,
        level:s<=3?"low":s<=5?"moderate":"high",
        levelLabel:s<=3?"Low Risk":s<=5?"Moderate Risk":"High Risk",
        color:s<=3?T.teal:s<=5?T.gold:T.coral,
        riskLabel:`2-day stroke risk ${risk}`,
        recommendation:s<=3
          ? "Low risk (ABCD2 0-3) — 2-day stroke risk 1.0%. Expedited outpatient workup (48h) — MRI/MRA, cardiac monitoring, antiplatelet therapy."
          : s<=5
          ? "Moderate risk (ABCD2 4-5) — 2-day stroke risk 4.1%. Strong consideration for admission or urgent outpatient evaluation within 24h."
          : "High risk (ABCD2 6-7) — 2-day stroke risk 8.1%. Hospitalize for monitoring, MRI/MRA, echocardiogram, cardiac telemetry, dual antiplatelet.",
      };
    },
  },
];

const CATS = [
  { id:"all",     label:"All",      color:T.teal   },
  { id:"cardiac", label:"Cardiac",  color:T.red    },
  { id:"pulm",    label:"Pulm",     color:T.blue   },
  { id:"vascular",label:"Vascular", color:T.purple },
  { id:"trauma",  label:"Trauma",   color:T.gold   },
  { id:"neuro",   label:"Neuro",    color:T.orange },
];

// ── Field renderer ─────────────────────────────────────────────────────────────
function ScoreField({ def, value, onChange }) {
  if (def.type === "radio") {
    return (
      <div style={{ marginBottom:12 }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:T.txt4, letterSpacing:1.3, textTransform:"uppercase",
          marginBottom:6 }}>{def.label}</div>
        <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
          {def.options.map(opt => (
            <button key={opt.value} onClick={() => onChange(opt.value)}
              style={{ display:"flex", alignItems:"center", gap:9,
                padding:"7px 11px", borderRadius:8, cursor:"pointer",
                textAlign:"left", transition:"all .12s",
                border:`1px solid ${value===opt.value
                  ? "rgba(42,122,160,0.7)"
                  : "rgba(26,53,85,0.35)"}`,
                background:value===opt.value
                  ? "rgba(42,122,160,0.15)"
                  : "rgba(8,22,40,0.4)" }}>
              <div style={{ width:16, height:16, borderRadius:"50%",
                flexShrink:0, border:`2px solid ${value===opt.value
                  ? T.blue : "rgba(42,79,122,0.5)"}`,
                background:value===opt.value ? T.blue : "transparent",
                display:"flex", alignItems:"center", justifyContent:"center" }}>
                {value===opt.value && (
                  <div style={{ width:6, height:6, borderRadius:"50%",
                    background:T.txt }} />
                )}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
                  color:value===opt.value ? T.txt : T.txt3,
                  fontWeight:value===opt.value ? 600 : 400 }}>
                  {opt.label}
                </div>
                {opt.hint && (
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                    color:T.txt4, marginTop:1 }}>{opt.hint}</div>
                )}
              </div>
              <span style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:10, fontWeight:700, flexShrink:0,
                color:value===opt.value ? T.blue : T.txt4 }}>
                {opt.value > 0 ? `+${opt.value}` : opt.value}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (def.type === "check") {
    const checked = Boolean(value);
    return (
      <button onClick={() => onChange(checked ? 0 : def.value)}
        style={{ display:"flex", alignItems:"flex-start", gap:9, width:"100%",
          padding:"8px 11px", borderRadius:8, cursor:"pointer",
          textAlign:"left", transition:"all .12s", marginBottom:5,
          border:`1px solid ${checked
            ? def.value < 0 ? "rgba(255,107,107,0.5)" : "rgba(0,229,192,0.5)"
            : "rgba(26,53,85,0.35)"}`,
          background:checked
            ? def.value < 0 ? "rgba(255,107,107,0.1)" : "rgba(0,229,192,0.1)"
            : "rgba(8,22,40,0.4)" }}>
        <div style={{ width:18, height:18, borderRadius:5,
          flexShrink:0, marginTop:1,
          border:`2px solid ${checked
            ? def.value < 0 ? T.coral : T.teal
            : "rgba(42,79,122,0.5)"}`,
          background:checked
            ? def.value < 0 ? T.coral : T.teal
            : "transparent",
          display:"flex", alignItems:"center", justifyContent:"center" }}>
          {checked && (
            <span style={{ color:T.bg, fontSize:10, fontWeight:900,
              lineHeight:1 }}>v</span>
          )}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11.5,
            color:checked ? T.txt : T.txt3,
            fontWeight:checked ? 600 : 400 }}>{def.label}</div>
          {def.hint && (
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
              color:T.txt4, marginTop:1 }}>{def.hint}</div>
          )}
        </div>
        <span style={{ fontFamily:"'JetBrains Mono',monospace",
          fontSize:10, fontWeight:700, flexShrink:0,
          color:checked
            ? def.value < 0 ? T.coral : T.teal
            : T.txt4 }}>
          {def.value > 0 ? `+${def.value}` : def.value}
        </span>
      </button>
    );
  }
  return null;
}

// ── Result card ────────────────────────────────────────────────────────────────
function ResultCard({ result }) {
  if (!result) return null;
  return (
    <div style={{ padding:"14px 16px", borderRadius:10,
      background:`linear-gradient(135deg,${result.color}12,rgba(8,22,40,0.95))`,
      border:`2px solid ${result.color}55`, marginBottom:14 }}>
      <div style={{ display:"flex", alignItems:"center",
        gap:12, marginBottom:10, flexWrap:"wrap" }}>
        <div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace",
            fontSize:28, fontWeight:700, color:result.color,
            lineHeight:1 }}>{result.display}</div>
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"'Playfair Display',serif",
            fontWeight:700, fontSize:15, color:result.color }}>
            {result.levelLabel}
          </div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace",
            fontSize:9, color:T.txt3, marginTop:2 }}>
            {result.riskLabel}
          </div>
        </div>
      </div>
      <div style={{ padding:"9px 12px", borderRadius:8,
        background:"rgba(8,22,40,0.6)",
        border:`1px solid ${result.color}28` }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:result.color, letterSpacing:1.5, textTransform:"uppercase",
          marginBottom:4 }}>Recommendation</div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
          color:T.txt2, lineHeight:1.7 }}>{result.recommendation}</div>
      </div>
    </div>
  );
}

// ── Score list sidebar ─────────────────────────────────────────────────────────
function ScoreList({ activeId, onSelect, cat, onCat }) {
  const filtered = SCORES.filter(s => cat === "all" || s.cat === cat);
  return (
    <div>
      <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:10 }}>
        {CATS.map(c => (
          <button key={c.id} onClick={() => onCat(c.id)}
            style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              fontWeight:700, padding:"3px 9px", borderRadius:20,
              cursor:"pointer", textTransform:"uppercase", letterSpacing:1,
              transition:"all .12s",
              border:`1px solid ${cat===c.id?c.color+"77":c.color+"33"}`,
              background:cat===c.id?`${c.color}18`:"transparent",
              color:cat===c.id?c.color:T.txt4 }}>
            {c.label}
          </button>
        ))}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
        {filtered.map(sc => (
          <button key={sc.id} onClick={() => onSelect(sc.id)}
            style={{ display:"flex", alignItems:"center", gap:9,
              padding:"9px 11px", borderRadius:9, cursor:"pointer",
              textAlign:"left", transition:"all .12s",
              border:`1px solid ${activeId===sc.id?sc.color+"66":"rgba(26,53,85,0.35)"}`,
              background:activeId===sc.id
                ? `linear-gradient(135deg,${sc.color}15,rgba(8,22,40,0.9))`
                : "rgba(8,22,40,0.5)",
              borderLeft:`3px solid ${sc.color}` }}>
            <span style={{ fontSize:16, flexShrink:0 }}>{sc.icon}</span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
                fontSize:11.5,
                color:activeId===sc.id?sc.color:T.txt3,
                overflow:"hidden", textOverflow:"ellipsis",
                whiteSpace:"nowrap" }}>{sc.name}</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9,
                color:T.txt4, overflow:"hidden", textOverflow:"ellipsis",
                whiteSpace:"nowrap" }}>{sc.tagline}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────
// Props:
//   embedded  bool     — true when rendered inside NPI/encounter (hides standalone chrome)
//   onBack    func     — called by standalone "Back to Hub" button; use window.history.back() if omitted
//   demo      obj      — { age, sex } for auto-population
//   vitals    obj      — { bp, hr, spo2, rr } for auto-population
//   pmhSelected arr    — past medical history list
//   cc        obj      — chief complaint
export default function ScoreHub({
  embedded = false,
  onBack,
  demo, vitals, pmhSelected, cc,
}) {
  // ── no useNavigate — back nav handled via onBack prop or window.history ──
  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  }, [onBack]);

  const [activeId, setActiveId] = useState("heart");
  const [cat,      setCat]      = useState("all");
  const [fields,   setFields]   = useState(() => {
    const sc = SCORES.find(s => s.id === "heart");
    return sc?.autoPopulate ? sc.autoPopulate(demo, vitals, pmhSelected) : {};
  });

  const score = SCORES.find(s => s.id === activeId);

  const handleSelect = useCallback((id) => {
    const sc = SCORES.find(s => s.id === id);
    if (!sc) return;
    const auto = sc.autoPopulate ? sc.autoPopulate(demo, vitals, pmhSelected) : {};
    setFields(auto);
    setActiveId(id);
  }, [demo, vitals, pmhSelected]);

  const setField = useCallback((id, val) =>
    setFields(p => ({ ...p, [id]:val })), []);

  const result = useMemo(() =>
    score ? score.calculate(fields) : null,
    [score, fields]
  );

  const clearScore = useCallback(() => {
    const auto = score?.autoPopulate ? score.autoPopulate(demo, vitals, pmhSelected) : {};
    setFields(auto);
  }, [score, demo, vitals, pmhSelected]);

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif",
      background: embedded ? "transparent" : T.bg,
      minHeight: embedded ? "auto" : "100vh",
      color:T.txt }}>

      <div style={{ maxWidth:1200, margin:"0 auto",
        padding: embedded ? "0" : "0 16px" }}>

        {/* Standalone header */}
        {!embedded && (
          <div style={{ padding:"18px 0 14px" }}>
            <button onClick={handleBack}
              style={{ marginBottom:10, display:"inline-flex",
                alignItems:"center", gap:7,
                fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600,
                background:"rgba(14,37,68,0.7)",
                border:"1px solid rgba(42,79,122,0.5)",
                borderRadius:8, padding:"5px 14px", color:T.txt3,
                cursor:"pointer" }}>
              Back to Hub
            </button>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
              <div style={{ background:"rgba(5,15,30,0.9)",
                border:"1px solid rgba(42,79,122,0.6)",
                borderRadius:10, padding:"5px 12px",
                display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:10, color:T.purple, letterSpacing:3 }}>NOTRYA</span>
                <span style={{ color:T.txt4, fontSize:10, fontFamily:"'JetBrains Mono',monospace" }}>/</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:10, color:T.txt3, letterSpacing:2 }}>SCORES</span>
              </div>
              <div style={{ height:1, flex:1,
                background:"linear-gradient(90deg,rgba(59,158,255,0.5),transparent)" }} />
            </div>
            <h1 className="shimmer-text"
              style={{ fontFamily:"'Playfair Display',serif",
                fontSize:"clamp(22px,4vw,38px)", fontWeight:900,
                letterSpacing:-0.5, lineHeight:1.1 }}>
              Clinical Score Calculator
            </h1>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
              color:T.txt4, marginTop:4 }}>
              12 Validated Scores · Auto-populated from Encounter Data · Actionable Interpretations
            </p>
          </div>
        )}

        {/* Embedded subheader */}
        {embedded && (
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
            <span style={{ fontFamily:"'Playfair Display',serif",
              fontWeight:700, fontSize:15, color:T.blue }}>
              Clinical Scores
            </span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:8, color:T.txt4, letterSpacing:1.5,
              textTransform:"uppercase",
              background:"rgba(59,158,255,0.1)",
              border:"1px solid rgba(59,158,255,0.25)",
              borderRadius:4, padding:"2px 7px" }}>
              12 scores
            </span>
            {demo?.age && (
              <span style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:9, color:T.txt4, marginLeft:"auto" }}>
                {demo.age}yo {demo.sex} · auto-populated
              </span>
            )}
          </div>
        )}

        {/* Two-column layout */}
        <div style={{ display:"grid",
          gridTemplateColumns:"220px 1fr",
          gap:12, alignItems:"start" }}>

          {/* Left: score list */}
          <div style={{ position:"sticky", top:16 }}>
            <ScoreList
              activeId={activeId}
              onSelect={handleSelect}
              cat={cat}
              onCat={setCat} />
          </div>

          {/* Right: calculator */}
          {score && (
            <div className="sc-fade" key={activeId}>
              {/* Score header */}
              <div style={{ display:"flex", alignItems:"flex-start",
                gap:10, marginBottom:14, flexWrap:"wrap" }}>
                <div style={{ padding:"8px 14px", borderRadius:10,
                  background:`${score.color}10`,
                  border:`1px solid ${score.color}35`,
                  borderLeft:`4px solid ${score.color}`,
                  flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center",
                    gap:8, marginBottom:3 }}>
                    <span style={{ fontSize:20 }}>{score.icon}</span>
                    <span style={{ fontFamily:"'Playfair Display',serif",
                      fontWeight:700, fontSize:16, color:score.color }}>
                      {score.name}
                    </span>
                  </div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                    color:T.txt3 }}>{score.tagline}</div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace",
                    fontSize:8, color:T.txt4, marginTop:3,
                    letterSpacing:0.5 }}>{score.ref}</div>
                  {score.note && (
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                      color:T.gold, marginTop:4, padding:"4px 7px",
                      background:"rgba(245,200,66,0.07)",
                      border:"1px solid rgba(245,200,66,0.25)",
                      borderRadius:5 }}>{score.note}</div>
                  )}
                </div>
                <button onClick={clearScore}
                  style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                    padding:"6px 12px", borderRadius:7, cursor:"pointer",
                    letterSpacing:1, textTransform:"uppercase",
                    border:"1px solid rgba(42,79,122,0.4)",
                    background:"transparent", color:T.txt4,
                    flexShrink:0 }}>Reset</button>
              </div>

              {/* Result (live) */}
              {result && <ResultCard result={result} />}

              {/* Fields */}
              <div style={{ padding:"12px 14px", borderRadius:10,
                background:"rgba(8,22,40,0.7)",
                border:"1px solid rgba(26,53,85,0.4)" }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                  color:T.txt4, letterSpacing:1.5, textTransform:"uppercase",
                  marginBottom:10 }}>Score Inputs</div>
                {score.fields.map(def => (
                  <ScoreField
                    key={def.id}
                    def={def}
                    value={fields[def.id] !== undefined ? fields[def.id] : null}
                    onChange={v => setField(def.id, v)} />
                ))}
              </div>

              {(demo?.age || vitals?.hr) && (
                <div style={{ marginTop:8,
                  fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                  color:"rgba(42,79,122,0.6)", letterSpacing:1 }}>
                  AGE / VITALS AUTO-POPULATED FROM ENCOUNTER — VERIFY BEFORE SUBMITTING
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!embedded && (
          <div style={{ textAlign:"center", padding:"24px 0 16px",
            fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1.5 }}>
            NOTRYA SCORE HUB · 12 VALIDATED CLINICAL SCORES · FOR DECISION SUPPORT ONLY · VERIFY WITH ATTENDING AND LOCAL PROTOCOLS
          </div>
        )}
      </div>
    </div>
  );
}