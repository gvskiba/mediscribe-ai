// SyncopeHub.jsx
// Syncope Risk Stratification Hub — standalone + embeddable.
// Tools: ROSE Rule · San Francisco Syncope Rule (SFSR) ·
//        Canadian Syncope Risk Score (CSRS) · OESIL Score
// Plus: Disposition Matrix · Causes by Mechanism · Workup Guide

import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";

(() => {
  if (document.getElementById("syn-fonts")) return;
  const l = document.createElement("link");
  l.id = "syn-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "syn-css";
  s.textContent = `
    @keyframes syn-fade{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
    .syn-fade{animation:syn-fade .18s ease forwards;}
    @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
    .shimmer-text{background:linear-gradient(90deg,#e8f0fe 0%,#fff 30%,#9b6dff 52%,#3b9eff 72%,#e8f0fe 100%);
    background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;
    background-clip:text;animation:shimmer 5s linear infinite;}
  `;
  document.head.appendChild(s);
})();

const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36",
  txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0", red:"#ff4444",
};

const ROSE_CRITERIA = [
  { id:"bnp",        label:"BNP >= 300 pg/mL",                                  points:1 },
  { id:"bradycardia",label:"Bradycardia <= 50 bpm on ECG or triage",            points:1 },
  { id:"rectal",     label:"Fecal occult blood positive on rectal examination",  points:1 },
  { id:"anemia",     label:"Room air SaO2 <= 94% (or Hgb < 9 g/dL)",           points:1 },
  { id:"q_wave",     label:"Q-wave on ECG (not in lead III)",                   points:1 },
];

function calcROSE(fields) {
  const score = ROSE_CRITERIA.reduce((s,c) => s + (fields[c.id] ? 1 : 0), 0);
  const high  = score >= 1;
  return {
    score,
    display:`${score} / ${ROSE_CRITERIA.length}`,
    level:     high ? "high"   : "low",
    levelLabel:high ? "High Risk" : "Low Risk",
    color:     high ? T.coral  : T.green,
    riskLabel: high ? "Serious 30-day outcome likely — admit for monitoring" : "Low risk — may be suitable for discharge",
    sensitivity:"87.2%", specificity:"65.5%",
    recommendation: high
      ? ">=1 ROSE criterion: high risk for serious outcome (death, MI, arrhythmia, PE, ICH). Admit for workup."
      : "0 ROSE criteria: low risk. Outpatient workup appropriate if no other high-risk features.",
    ref:"Reed MJ 2010 · BMJ",
  };
}

const SFSR_CRITERIA = [
  { id:"hx_chf",    label:"History of congestive heart failure" },
  { id:"hct_below", label:"Hematocrit < 30%"                   },
  { id:"ekg_abnl",  label:"ECG abnormal — any change from prior or new finding on ED EKG" },
  { id:"dyspnea",   label:"Shortness of breath at time of presentation" },
  { id:"sbp_low",   label:"Systolic BP < 90 mmHg at triage"   },
];

function calcSFSR(fields, vitals) {
  const sbpVal = parseFloat((vitals?.bp||"").split("/")[0]) || null;
  const autoSBP = sbpVal !== null && sbpVal < 90;
  const fActive = { ...fields, sbp_low: fields.sbp_low || autoSBP };
  const anyPositive = SFSR_CRITERIA.some(c => fActive[c.id]);
  return {
    score:     anyPositive ? 1 : 0,
    display:   anyPositive ? "POSITIVE" : "NEGATIVE",
    level:     anyPositive ? "high" : "low",
    levelLabel:anyPositive ? "High Risk" : "Low Risk",
    color:     anyPositive ? T.coral : T.green,
    autoSBP,
    riskLabel: anyPositive
      ? "Serious outcome risk ~9.5% — admission warranted"
      : "Serious outcome risk ~0.5% — discharge appropriate if no other concerns",
    sensitivity:"98%", specificity:"56%",
    recommendation: anyPositive
      ? "Any SFSR criterion positive: admit for monitoring and workup. Do not discharge."
      : "All SFSR criteria negative: 0.5% short-term serious outcome. Safe to consider discharge.",
    ref:"Quinn JV 2004 · Ann Emerg Med",
  };
}

const CSRS_SIMPLE = [
  { id:"vasovagal_hx", label:"Predisposition to vasovagal syncope",         points:-1,
    hint:"Triggered by: pain, medical procedure, prolonged standing, emotional stress, medical setting" },
  { id:"hx_heart_dz",  label:"History of heart disease",                    points:1  },
  { id:"sbp_low_csrs", label:"Any SBP abnormality in ED (see hint)",        points:2,
    hint:"SBP <90 or >180 at any point in ED, OR drop >=20 mmHg on repeated measurement" },
  { id:"trop_elevated",label:"Elevated troponin (>99th percentile ULN)",    points:2  },
  { id:"qt_abnormal",  label:"QTc > 480 ms on ECG",                         points:2  },
  { id:"qrs_abnormal", label:"Abnormal QRS: axis deviation or QRS >=120 ms", points:1 },
];

function calcCSRS(fields) {
  const score = CSRS_SIMPLE.reduce((s, c) => s + (fields[c.id] ? c.points : 0), 0);
  const level = score <= 0 ? "low" : score <= 3 ? "medium" : "high";
  const risk30 = score <= 0 ? "<1%" : score <= 3 ? "1-5%" : ">5%";
  return {
    score,
    display:`${score} pts`,
    level,
    levelLabel: level === "low" ? "Low Risk" : level === "medium" ? "Medium Risk" : "High Risk",
    color: level === "low" ? T.green : level === "medium" ? T.gold : T.coral,
    riskLabel:`30-day serious adverse event ${risk30}`,
    sensitivity: score <= 0 ? "N/A" : "99.2% for score >0",
    recommendation: level === "low"
      ? "Score <=0: very low risk. Discharge with outpatient cardiology follow-up if no other concerns."
      : level === "medium"
      ? "Score 1-3: intermediate risk. Consider observation/admission. Cardiology input recommended."
      : "Score >=4: high risk. Admit. Urgent cardiology evaluation and continuous monitoring.",
    ref:"Thiruganasambandamoorthy 2016 · CMAJ",
  };
}

const OESIL_CRITERIA = [
  { id:"abnormal_ekg",  label:"Abnormal ECG (any abnormality other than non-specific ST-T changes)" },
  { id:"no_prodrome",   label:"No prodrome (no nausea/vomiting before syncope)"                     },
  { id:"hx_cv",         label:"History of cardiovascular disease"                                   },
  { id:"age_over_65",   label:"Age > 65 years"                                                      },
];

function calcOESIL(fields, demo) {
  const autoAge = parseInt(demo?.age) > 65;
  const fActive = { ...fields, age_over_65: fields.age_over_65 || autoAge };
  const score   = OESIL_CRITERIA.reduce((s, c) => s + (fActive[c.id] ? 1 : 0), 0);
  const mort1yr = score === 0 ? "0%" : score === 1 ? "0.6%" : score === 2 ? "14%" : score === 3 ? "29%" : "53%";
  const level   = score === 0 ? "low" : score <= 1 ? "low" : score <= 2 ? "medium" : "high";
  return {
    score,
    display:`${score} / 4`,
    autoAge,
    level,
    levelLabel: score === 0 ? "Very Low Risk" : score <= 1 ? "Low Risk" : score <= 2 ? "Moderate Risk" : "High Risk",
    color: score === 0 ? T.green : score <= 1 ? T.teal : score <= 2 ? T.gold : T.coral,
    riskLabel:`1-year mortality ${mort1yr}`,
    recommendation: score === 0
      ? "Score 0: 0% 1-year mortality. Discharge after appropriate evaluation."
      : score === 1
      ? "Score 1: 0.6% 1-year mortality. Outpatient workup vs brief observation depending on clinical picture."
      : score <= 2
      ? "Score 2: 14% 1-year mortality. Admission for monitoring and workup warranted."
      : "Score 3-4: High 1-year mortality (29-53%). Admission mandatory. Urgent cardiology evaluation.",
    ref:"Colivicchi 2003 · Eur Heart J",
  };
}

const CAUSES = [
  {
    category:"Reflex / Neurally Mediated",
    color:T.teal, icon:"🧠",
    prognosis:"Benign — recurrence common but mortality low",
    examples:[
      "Vasovagal (neurocardiogenic) — most common overall; triggered by pain, stress, prolonged standing",
      "Situational — cough, micturition, defecation, swallowing",
      "Carotid sinus hypersensitivity — older patients, tight collar, head turning",
      "Orthostatic hypotension (autonomic failure) — Parkinson's, MSA, autonomic neuropathy",
    ],
    ekg:"Normal or sinus bradycardia during event",
    workup:["Orthostatic vitals x 3 positions","Carotid sinus massage (if >40yr, no recent TIA/stroke)","Holter if recurrent"],
  },
  {
    category:"Orthostatic Hypotension",
    color:T.blue, icon:"⬇️",
    prognosis:"Depends on cause — dehydration (benign) vs autonomic failure (progressive)",
    examples:[
      "Volume depletion — dehydration, hemorrhage, GI losses",
      "Drug-induced — antihypertensives, diuretics, alpha-blockers, PDE5 inhibitors",
      "Autonomic failure — diabetes, Parkinson's, amyloidosis",
      "Post-prandial hypotension — especially elderly",
    ],
    ekg:"Normal; check for paroxysmal causes",
    workup:["Orthostatic vitals: supine -> 1 min standing -> 3 min standing","BMP (dehydration), CBC (anemia, GI bleed)","Medication review"],
  },
  {
    category:"Cardiac Arrhythmia",
    color:T.orange, icon:"⚡",
    prognosis:"Can be life-threatening — requires investigation and monitoring",
    examples:[
      "Sick sinus syndrome / sinus pauses > 3 seconds",
      "High-degree AV block (2nd degree Mobitz II, 3rd degree)",
      "VT / VF — especially in structural heart disease",
      "Supraventricular tachycardia — usually preceded by palpitations",
      "Medication-induced (QT prolongation -> Torsades)",
      "Implanted device malfunction (pacemaker/ICD failure)",
    ],
    ekg:"Bradycardia, AV block, QTc prolongation, VT, pre-excitation, bundle branch block",
    workup:["12-lead EKG immediately","Continuous telemetry","Electrolytes, Mg2+, troponin","Echocardiogram if structural disease suspected"],
  },
  {
    category:"Structural Cardiac / Cardiopulmonary",
    color:T.coral, icon:"❤️",
    prognosis:"High mortality if missed — warrants urgent evaluation",
    examples:[
      "Aortic stenosis — syncope on exertion, crescendo-decrescendo murmur",
      "HCM (HOCM) — exertional syncope in young athlete",
      "Acute MI — especially inferior MI with high vagal tone",
      "Pulmonary embolism — hypoxia, tachycardia, pleuritic chest pain",
      "Aortic dissection — tearing pain, unequal pulses, BP discrepancy",
      "Cardiac tamponade — muffled heart sounds, JVD, hypotension",
    ],
    ekg:"ST changes, new LBBB, S1Q3T3 (PE), RV strain, LVH",
    workup:["Troponin, BNP","Echocardiogram","CT PE if suspected","CXR (mediastinal widening)"],
  },
  {
    category:"Non-Syncopal Mimics",
    color:T.purple, icon:"🔍",
    prognosis:"Depends on cause — hypoglycemia and seizure most common",
    examples:[
      "Hypoglycemia — check POC glucose immediately in all syncope",
      "Seizure — tonic-clonic activity, post-ictal confusion, incontinence, tongue biting",
      "TIA / Stroke — typically no LOC (LOC suggests posterior circulation or cardiac emboli)",
      "Psychogenic non-epileptic events — prolonged, frequent, emotional triggers",
      "Metabolic (hyponatremia, hypocalcemia)",
      "Drug/alcohol intoxication",
    ],
    ekg:"Usually normal — check glucose before attributing to syncope",
    workup:["POC glucose (mandatory)","Neuro exam","Consider EEG if seizure suspected","CT head if focal deficit or head trauma"],
  },
];

const DISPOSITION_MATRIX = [
  {
    level:"Immediate Hospitalization",
    color:T.red,
    criteria:[
      "Any SFSR criterion positive",
      "CSRS score >= 4 OR ROSE >= 1",
      "Sustained VT or high-degree AV block on EKG",
      "Elevated troponin",
      "Structural heart disease with exertional syncope",
      "Signs of PE, aortic dissection, or tamponade",
      "Significant injury from syncope (intracranial hemorrhage, major fracture)",
      "Recurrent syncope with unknown cause despite workup",
    ],
  },
  {
    level:"Observation / Short Stay",
    color:T.orange,
    criteria:[
      "CSRS 1-3 (intermediate risk)",
      "New EKG abnormality without arrhythmia — QTc prolongation, new bundle branch block",
      "Syncope during exertion or in supine position",
      "First syncope in elderly patient without clear vasovagal mechanism",
      "Unexplained syncope in patients with known CAD or EF < 35%",
    ],
  },
  {
    level:"Discharge with Expedited Follow-up",
    color:T.gold,
    criteria:[
      "SFSR negative + CSRS <= 0 + ROSE 0 + OESIL 0-1",
      "Clear vasovagal mechanism with typical prodrome",
      "Orthostatic hypotension with identified and treatable cause",
      "Young healthy patient, normal EKG, no cardiac history",
      "Arrange Holter/event monitor + cardiology or primary care within 7-14 days",
    ],
  },
  {
    level:"Discharge with Routine Follow-up",
    color:T.teal,
    criteria:[
      "Established vasovagal syncope, no change from prior episodes",
      "Clear situational syncope with identifiable and avoidable trigger",
      "Normal EKG, normal vitals, normal exam, age < 45, no cardiac history",
      "Primary care follow-up within 4 weeks",
    ],
  },
];

const HIGH_RISK_EKG = [
  "Bifascicular block (LBBB or RBBB + left axis deviation)",
  "New bundle branch block (QRS >= 120 ms)",
  "Sustained or non-sustained VT",
  "QTc >= 500 ms (very high Torsades risk)",
  "QTc 480-500 ms in setting of syncope",
  "Brugada pattern (RBBB + ST elevation V1-V3)",
  "Epsilon waves / late potentials (ARVC)",
  "Delta waves / short PR (WPW — pre-excitation)",
  "Complete AV block or Mobitz type II block",
  "Sinus pauses > 3 seconds",
  "ST elevation or depression (ACS pattern)",
  "T-wave inversions V1-V4 (ARVC, RV strain, posterior STEMI)",
  "Deep T inversions in precordial leads + syncope (Wellens syndrome)",
];

function Bullet({ text, color }) {
  return (
    <div style={{ display:"flex", gap:6, alignItems:"flex-start", marginBottom:3 }}>
      <span style={{ color:color||T.teal, fontSize:7, marginTop:3, flexShrink:0 }}>{"▸"}</span>
      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
        color:T.txt3, lineHeight:1.55 }}>{text}</span>
    </div>
  );
}

function Section({ title, icon, accent, open, onToggle, badge, children }) {
  const ac = accent || T.blue;
  return (
    <div style={{ marginBottom:8 }}>
      <button onClick={onToggle}
        style={{ display:"flex", alignItems:"center", gap:8, width:"100%",
          padding:"9px 13px",
          background:open
            ? `linear-gradient(135deg,${ac}12,rgba(8,22,40,0.92))`
            : "rgba(8,22,40,0.65)",
          border:`1px solid ${open ? ac+"55" : "rgba(26,53,85,0.4)"}`,
          borderRadius:open ? "10px 10px 0 0" : 10,
          cursor:"pointer", textAlign:"left", transition:"all .15s" }}>
        <span style={{ fontSize:16 }}>{icon}</span>
        <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
          fontSize:13, color:open ? ac : T.txt3, flex:1 }}>{title}</span>
        {badge && (
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            fontWeight:700, padding:"2px 8px", borderRadius:4,
            background:`${badge.color}18`, border:`1px solid ${badge.color}40`,
            color:badge.color, letterSpacing:1,
            textTransform:"uppercase" }}>{badge.text}</span>
        )}
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:open ? ac : T.txt4, letterSpacing:1, marginLeft:6 }}>
          {open ? "▲" : "▼"}
        </span>
      </button>
      {open && (
        <div style={{ padding:"12px 13px",
          background:"rgba(8,22,40,0.65)",
          border:`1px solid ${ac}33`, borderTop:"none",
          borderRadius:"0 0 10px 10px" }}>
          {children}
        </div>
      )}
    </div>
  );
}

function ScorePanel({ title, ref_, sensitivity, specificity, color, result, criteria, fields, onToggle, autoNote }) {
  return (
    <div style={{ padding:"12px 13px", borderRadius:10,
      background:`${color}08`,
      border:`1px solid ${color}30`,
      borderTop:`3px solid ${color}` }}>

      <div style={{ display:"flex", alignItems:"flex-start",
        justifyContent:"space-between", gap:10, flexWrap:"wrap",
        marginBottom:10 }}>
        <div>
          <div style={{ fontFamily:"'Playfair Display',serif",
            fontWeight:700, fontSize:14, color }}>
            {title}
          </div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, marginTop:1 }}>
            {ref_} · Sensitivity {sensitivity} · Specificity {specificity}
          </div>
        </div>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace",
            fontSize:26, fontWeight:700, color:result.color, lineHeight:1 }}>
            {result.display}
          </div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace",
            fontSize:8, color:result.color, letterSpacing:1,
            textTransform:"uppercase", marginTop:1 }}>
            {result.levelLabel}
          </div>
        </div>
      </div>

      <div style={{ padding:"7px 10px", borderRadius:7, marginBottom:9,
        background:`${result.color}0d`,
        border:`1px solid ${result.color}33` }}>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
          color:result.color, lineHeight:1.5 }}>
          {result.riskLabel}
        </div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
          color:T.txt4, marginTop:3 }}>
          {result.recommendation}
        </div>
      </div>

      {autoNote && (
        <div style={{ padding:"5px 9px", borderRadius:6, marginBottom:7,
          background:"rgba(0,229,192,0.08)",
          border:"1px solid rgba(0,229,192,0.25)",
          fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:T.teal, letterSpacing:0.5 }}>
          {"⚡ "}{autoNote}
        </div>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
        {criteria.map(c => {
          const checked = Boolean(fields[c.id]);
          return (
            <button key={c.id} onClick={() => onToggle(c.id)}
              style={{ display:"flex", alignItems:"flex-start", gap:8,
                padding:"7px 9px", borderRadius:7, cursor:"pointer",
                textAlign:"left", transition:"all .12s",
                border:`1px solid ${checked ? color+"55" : "rgba(26,53,85,0.3)"}`,
                background:checked ? `${color}0d` : "rgba(8,22,40,0.45)" }}>
              <div style={{ width:16, height:16, borderRadius:4, flexShrink:0,
                marginTop:1,
                border:`2px solid ${checked ? color : "rgba(42,79,122,0.5)"}`,
                background:checked ? color : "transparent",
                display:"flex", alignItems:"center", justifyContent:"center" }}>
                {checked && (
                  <span style={{ color:T.bg, fontSize:8, fontWeight:900 }}>{"✓"}</span>
                )}
              </div>
              <div style={{ flex:1 }}>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11.5,
                  color:checked ? T.txt : T.txt2,
                  fontWeight:checked ? 600 : 400 }}>
                  {c.label}
                </span>
                {c.points !== undefined && c.points !== 0 && (
                  <span style={{ fontFamily:"'JetBrains Mono',monospace",
                    fontSize:9, fontWeight:700,
                    color:c.points < 0 ? T.teal : color,
                    marginLeft:7 }}>
                    {c.points > 0 ? `+${c.points}` : c.points}
                  </span>
                )}
                {c.hint && (
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9,
                    color:T.txt4, marginTop:1, lineHeight:1.4 }}>{c.hint}</div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function SyncopeHub({ embedded = false, demo, vitals, cc, pmhSelected }) {
  const navigate = useNavigate();

  const [roseFields, setRoseFields] = useState({});
  const [sfsrFields, setSfsrFields] = useState({});
  const [csrsFields, setCsrsFields] = useState({});
  const [oeslFields, setOeslFields] = useState({});

  const [sScores,  setSScores]  = useState(true);
  const [sDisp,    setSDisp]    = useState(false);
  const [sCauses,  setSCauses]  = useState(false);
  const [sEKG,     setSEKG]     = useState(false);

  const toggleField = useCallback((setter) => (id) =>
    setter(p => ({ ...p, [id]:!p[id] })), []);

  const autoAge = parseInt(demo?.age) > 65;
  const autoSBP = parseFloat((vitals?.bp||"").split("/")[0]) < 90;

  const rose  = useMemo(() => calcROSE(roseFields), [roseFields]);
  const sfsr  = useMemo(() => calcSFSR(sfsrFields, vitals), [sfsrFields, vitals]);
  const csrs  = useMemo(() => calcCSRS(csrsFields), [csrsFields]);
  const oesil = useMemo(() => calcOESIL(oeslFields, demo), [oeslFields, demo]);

  const allResults = [rose, sfsr, csrs, oesil];
  const highestRisk = allResults.reduce((best, r) => {
    const levels = ["low","medium","high"];
    return levels.indexOf(r.level) > levels.indexOf(best) ? r.level : best;
  }, "low");

  const aggColor = highestRisk === "high" ? T.coral
    : highestRisk === "medium" ? T.gold : T.teal;

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif",
      background: embedded ? "transparent" : T.bg,
      minHeight:  embedded ? "auto" : "100vh",
      color:T.txt }}>

      <div style={{ maxWidth:1100, margin:"0 auto",
        padding: embedded ? "0" : "0 16px" }}>

        {!embedded && (
          <div style={{ padding:"18px 0 14px" }}>
            <button onClick={() => navigate("/hub")}
              style={{ marginBottom:10, display:"inline-flex",
                alignItems:"center", gap:7,
                fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600,
                background:"rgba(14,37,68,0.7)",
                border:"1px solid rgba(42,79,122,0.5)",
                borderRadius:8, padding:"5px 14px",
                color:T.txt3, cursor:"pointer" }}>
              {"← Back to Hub"}
            </button>
            <div style={{ display:"flex", alignItems:"center",
              gap:10, marginBottom:8 }}>
              <div style={{ background:"rgba(5,15,30,0.9)",
                border:"1px solid rgba(42,79,122,0.6)",
                borderRadius:10, padding:"5px 12px",
                display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:10, color:T.purple, letterSpacing:3 }}>NOTRYA</span>
                <span style={{ color:T.txt4, fontFamily:"'JetBrains Mono',monospace",
                  fontSize:10 }}>/</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:10, color:T.txt3, letterSpacing:2 }}>SYNCOPE</span>
              </div>
              <div style={{ height:1, flex:1,
                background:"linear-gradient(90deg,rgba(59,158,255,0.5),transparent)" }} />
            </div>
            <h1 className="shimmer-text"
              style={{ fontFamily:"'Playfair Display',serif",
                fontSize:"clamp(22px,4vw,38px)", fontWeight:900,
                letterSpacing:-0.5, lineHeight:1.1 }}>
              Syncope Risk Stratification
            </h1>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
              color:T.txt4, marginTop:4 }}>
              ROSE · SFSR · CSRS · OESIL · Disposition Matrix · Syncope Causes · High-Risk EKG Features
            </p>
          </div>
        )}

        {embedded && (
          <div style={{ display:"flex", alignItems:"center",
            gap:8, marginBottom:12 }}>
            <span style={{ fontFamily:"'Playfair Display',serif",
              fontWeight:700, fontSize:15, color:T.blue }}>
              Syncope Risk
            </span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.txt4, letterSpacing:1.5, textTransform:"uppercase",
              background:"rgba(59,158,255,0.1)",
              border:"1px solid rgba(59,158,255,0.25)",
              borderRadius:4, padding:"2px 7px" }}>
              ROSE · SFSR · CSRS · OESIL
            </span>
          </div>
        )}

        {/* Aggregate risk summary */}
        <div style={{ display:"flex", alignItems:"center", gap:10,
          padding:"9px 13px", borderRadius:9, marginBottom:10,
          background:`${aggColor}0a`,
          border:`1px solid ${aggColor}35`,
          flexWrap:"wrap" }}>
          <div style={{ fontFamily:"'Playfair Display',serif",
            fontWeight:700, fontSize:14, color:aggColor }}>
            {"Aggregate Risk: "}{highestRisk === "high" ? "High"
              : highestRisk === "medium" ? "Intermediate" : "Low"}
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {[
              { label:"ROSE",  result:rose  },
              { label:"SFSR",  result:sfsr  },
              { label:"CSRS",  result:csrs  },
              { label:"OESIL", result:oesil },
            ].map(({ label, result:r }) => (
              <div key={label} style={{ display:"flex", alignItems:"center",
                gap:5, padding:"3px 9px", borderRadius:20,
                background:`${r.color}12`,
                border:`1px solid ${r.color}30` }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:8, color:T.txt4 }}>{label}:</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:9, fontWeight:700, color:r.color }}>
                  {r.display}
                </span>
              </div>
            ))}
          </div>
          {(autoAge || autoSBP) && (
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.teal, marginLeft:"auto", letterSpacing:0.5 }}>
              {"⚡ "}{[autoAge ? "Age auto-populated" : null, autoSBP ? "SBP < 90 auto-flagged" : null].filter(Boolean).join(" · ")}
            </span>
          )}
        </div>

        {/* Section 1: Scoring tools */}
        <Section title="Risk Stratification Scores" icon="🎯" accent={T.blue}
          open={sScores} onToggle={() => setSScores(p => !p)}>

          <div style={{ display:"grid",
            gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",
            gap:10 }}>

            <ScorePanel
              title="ROSE Rule"
              ref_="Reed 2010"
              sensitivity="87%"
              specificity="65%"
              color={rose.color}
              result={rose}
              criteria={ROSE_CRITERIA}
              fields={roseFields}
              onToggle={toggleField(setRoseFields)}
            />

            <ScorePanel
              title="San Francisco Syncope Rule"
              ref_="Quinn 2004"
              sensitivity="98%"
              specificity="56%"
              color={sfsr.color}
              result={sfsr}
              criteria={SFSR_CRITERIA}
              fields={{ ...sfsrFields, sbp_low:sfsrFields.sbp_low || sfsr.autoSBP }}
              onToggle={toggleField(setSfsrFields)}
              autoNote={sfsr.autoSBP ? "SBP < 90 auto-populated from vitals" : null}
            />

            <ScorePanel
              title="Canadian Syncope Risk Score"
              ref_="Thiruganasambandamoorthy 2016"
              sensitivity="99%"
              specificity="Varies by threshold"
              color={csrs.color}
              result={csrs}
              criteria={CSRS_SIMPLE}
              fields={csrsFields}
              onToggle={toggleField(setCsrsFields)}
            />

            <ScorePanel
              title="OESIL Score"
              ref_="Colivicchi 2003"
              sensitivity="88%"
              specificity="N/A — 1-yr mortality"
              color={oesil.color}
              result={oesil}
              criteria={OESIL_CRITERIA}
              fields={{ ...oeslFields, age_over_65:oeslFields.age_over_65 || oesil.autoAge }}
              onToggle={toggleField(setOeslFields)}
              autoNote={oesil.autoAge ? `Age > 65 auto-populated (${demo?.age}yr)` : null}
            />
          </div>
        </Section>

        {/* Section 2: Disposition matrix */}
        <Section title="Disposition Decision Matrix" icon="🏥" accent={T.orange}
          open={sDisp} onToggle={() => setSDisp(p => !p)}>

          {DISPOSITION_MATRIX.map((tier, i) => (
            <div key={i} style={{ padding:"10px 12px", borderRadius:9,
              marginBottom:8,
              background:`${tier.color}09`,
              border:`1px solid ${tier.color}30`,
              borderLeft:`4px solid ${tier.color}` }}>
              <div style={{ fontFamily:"'Playfair Display',serif",
                fontWeight:700, fontSize:13, color:tier.color, marginBottom:7 }}>
                {tier.level}
              </div>
              {tier.criteria.map((c, j) => (
                <Bullet key={j} text={c} color={tier.color} />
              ))}
            </div>
          ))}
        </Section>

        {/* Section 3: Causes by mechanism */}
        <Section title="Syncope Causes by Mechanism" icon="🔍" accent={T.purple}
          open={sCauses} onToggle={() => setSCauses(p => !p)}>

          <div style={{ display:"grid",
            gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",
            gap:8 }}>
            {CAUSES.map((cat, i) => (
              <div key={i} style={{ padding:"10px 12px", borderRadius:9,
                background:`${cat.color}08`,
                border:`1px solid ${cat.color}25`,
                borderTop:`3px solid ${cat.color}` }}>
                <div style={{ display:"flex", alignItems:"center",
                  gap:7, marginBottom:5 }}>
                  <span style={{ fontSize:16 }}>{cat.icon}</span>
                  <span style={{ fontFamily:"'Playfair Display',serif",
                    fontWeight:700, fontSize:13, color:cat.color }}>
                    {cat.category}
                  </span>
                </div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9,
                  color:T.txt4, marginBottom:6, fontStyle:"italic" }}>
                  {cat.prognosis}
                </div>
                {cat.examples.map((ex, j) => (
                  <Bullet key={j} text={ex} color={cat.color} />
                ))}
                <div style={{ marginTop:6, padding:"5px 7px", borderRadius:5,
                  background:"rgba(42,79,122,0.12)",
                  border:"1px solid rgba(42,79,122,0.25)" }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                    color:T.txt4, letterSpacing:1, textTransform:"uppercase",
                    marginBottom:3 }}>EKG Findings</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                    color:T.txt3 }}>{cat.ekg}</div>
                  {cat.workup && (
                    <div style={{ marginTop:4 }}>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                        color:T.txt4, letterSpacing:1, textTransform:"uppercase",
                        marginBottom:3 }}>Key Workup</div>
                      {cat.workup.map((w, k) => (
                        <Bullet key={k} text={w} color={T.blue} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Section 4: High-risk EKG features */}
        <Section title="High-Risk EKG Features in Syncope" icon="💓" accent={T.coral}
          open={sEKG} onToggle={() => setSEKG(p => !p)}>

          <div style={{ padding:"8px 11px", borderRadius:8, marginBottom:10,
            background:"rgba(255,107,107,0.07)",
            border:"1px solid rgba(255,107,107,0.25)" }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
              color:T.txt3, lineHeight:1.65 }}>
              Any of the following EKG findings in a syncope patient requires admission
              for monitoring regardless of clinical score. EKG is the most important
              single test in syncope evaluation — obtain and read within 10 minutes of arrival.
            </div>
          </div>

          <div style={{ display:"grid",
            gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",
            gap:5 }}>
            {HIGH_RISK_EKG.map((feature, i) => (
              <div key={i} style={{ display:"flex", gap:7,
                alignItems:"flex-start", padding:"6px 9px",
                borderRadius:7,
                background:"rgba(255,107,107,0.05)",
                border:"1px solid rgba(255,107,107,0.18)" }}>
                <span style={{ color:T.coral, fontSize:7,
                  marginTop:3, flexShrink:0 }}>{"▸"}</span>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                  color:T.txt2, lineHeight:1.45 }}>{feature}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop:10, padding:"8px 11px", borderRadius:8,
            background:`${T.gold}08`, border:`1px solid ${T.gold}25` }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.gold, letterSpacing:1, textTransform:"uppercase" }}>
              {"💎 Pearl: "}
            </span>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
              color:T.txt2 }}>
              A normal EKG in syncope is reassuring but does not exclude arrhythmia.
              Arrhythmias are episodic — a normal resting EKG simply means the arrhythmia
              was not occurring at the time of the EKG. Continuous monitoring and
              outpatient Holter/event recorder are needed for unexplained syncope with
              normal ED EKG.
            </span>
          </div>
        </Section>

        {!embedded && (
          <div style={{ textAlign:"center", padding:"24px 0 16px",
            fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1.5 }}>
            NOTRYA SYNCOPE HUB · AHA/ACC 2017 SYNCOPE GUIDELINES · VALIDATED PREDICTION RULES · CLINICAL JUDGMENT REQUIRED
          </div>
        )}
      </div>
    </div>
  );
}