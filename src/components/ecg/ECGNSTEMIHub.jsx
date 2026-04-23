// ECGNSTEMIHub.jsx
// NSTEMI / NSTE-ACS Assessment for Notrya ECG Hub.
// Features: TIMI Risk Score calculator with invasive strategy timing +
//           high-risk NSTEMI ECG feature reference.
// Per 2025 ACC/AHA/ACEP/NAEMSP/SCAI ACS Guideline (February 2025).
//
// Constraints: no Router, no localStorage, no form/alert, straight quotes,
//   typeof document guard.

import { useState } from "react";

(() => {
  if (typeof document === "undefined") return;
  if (document.getElementById("nstemi-style")) return;
  const s = document.createElement("style"); s.id = "nstemi-style";
  s.textContent = `@keyframes nst-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}.nst-in{animation:nst-in .18s ease forwards;}`;
  document.head.appendChild(s);
})();

const T = {
  bg:"#050f1e", txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0", red:"#ff4444",
};
const glass = {
  background:"rgba(8,22,40,0.75)",border:"1px solid rgba(42,79,122,0.35)",borderRadius:16,
};

// TIMI Risk Score criteria (Antman et al.) -- 7 points total
const TIMI_ITEMS = [
  {key:"age65",    label:"Age >= 65 years",                                                    pts:1, color:T.orange},
  {key:"rf3",      label:">= 3 CAD risk factors (HTN, DM, hyperlipidemia, family hx, smoking)",pts:1, color:T.orange},
  {key:"stenosis", label:"Known prior coronary stenosis >= 50%",                               pts:1, color:T.coral },
  {key:"stdev",    label:"ST-segment deviation on presenting ECG (>= 0.5mm)",                  pts:1, color:T.red   },
  {key:"events2",  label:">= 2 anginal events in prior 24 hours",                              pts:1, color:T.coral },
  {key:"asa7",     label:"Aspirin use in prior 7 days",                                        pts:1, color:T.gold  },
  {key:"troponin", label:"Elevated cardiac biomarkers (troponin or CK-MB)",                    pts:1, color:T.red   },
];
const TIMI_BLANK = {age65:false,rf3:false,stenosis:false,stdev:false,events2:false,asa7:false,troponin:false};

// High-risk NSTEMI ECG features (2025 ACC/AHA ACS Guideline)
const HIGH_RISK_FEATURES = [
  {label:"New or dynamic ST depression >= 0.5mm",color:T.red,
    detail:"Horizontal or downsloping ST depression >= 1mm in >= 2 contiguous leads is high risk. May represent posterior STEMI reciprocal change -- obtain V7-V9 if V1-V3 depression present."},
  {label:"Transient ST elevation (spontaneously resolving)",color:T.red,
    detail:"Episodic STE that resolves spontaneously is extremely high risk -- suggests complete occlusion with spontaneous reperfusion. Treat as STEMI equivalent even if normalized at time of ECG acquisition. Serial ECG every 15-30 min while symptomatic."},
  {label:"Dynamic T-wave inversions (new or deepening)",color:T.coral,
    detail:"New deep symmetric T-wave inversions, especially V2-V3 (Wellens syndrome). Do NOT stress test -- this represents active proximal LAD lesion. Urgent cardiology consult even if pain-free."},
  {label:"New LBBB with clinical context",color:T.orange,
    detail:"New LBBB + chest pain = STEMI equivalent per 2025 ACC/AHA ACS Guideline. Apply modified Sgarbossa: concordant STE >= 1mm in any lead = cath activation. Excessive discordant STE > 25% of S wave amplitude = also diagnostic."},
  {label:"Posterior STEMI pattern (STD V1-V3)",color:T.coral,
    detail:"Horizontal ST depression in V1-V3 without anterior STE = reciprocal changes from posterior MI. Tall upright T in V1-V3 is second sign. Place posterior leads V7-V9: STE >= 0.5mm = diagnostic. Activate cath."},
  {label:"Normal ECG does not exclude ACS",color:T.gold,
    detail:"17-33% of confirmed NSTEMI have a normal or near-normal initial ECG. A normal ECG reduces but does not eliminate probability of ACS. Serial ECG + high-sensitivity troponin at 0 and 1-2 hours are mandatory in high-suspicion cases."},
];

function timiResult(score) {
  if (score <= 2) return {
    label:"Low Risk",color:T.green,risk:"4.7-8.3% MACE at 14 days",
    timing:"Conservative strategy is reasonable. High-sensitivity troponin pathway for early discharge.",
    action:"Serial hs-troponin at 0 and 1-3 hours. If negative and TIMI 0-2: early discharge with outpatient stress testing within 72 hours is acceptable.",
    source:"2025 ACC/AHA ACS Guideline"};
  if (score <= 4) return {
    label:"Intermediate Risk",color:T.orange,risk:"13.2-19.9% MACE at 14 days",
    timing:"Early invasive strategy within 24-48 hours.",
    action:"Heparin + ASA + P2Y12 inhibitor. Cardiology consult. Coronary angiography 24-48 hours after admission.",
    source:"2025 ACC/AHA ACS Guideline (Class 1 -- early invasive 24-48h)"};
  return {
    label:"High Risk",color:T.red,risk:"26.2-40.9% MACE at 14 days",
    timing:"Urgent invasive strategy < 24 hours.",
    action:"Anticoagulate immediately. ASA + P2Y12 (ticagrelor or prasugrel preferred). Cardiology at bedside. Angiography < 24 hours.",
    source:"2025 ACC/AHA ACS Guideline (Class 1 -- urgent invasive < 24h)"};
}

export default function ECGNSTEMIHub({ embedded = false, onBack }) {
  const [timiVars, setTimiVars]     = useState(TIMI_BLANK);
  const [section,  setSection]      = useState("timi");

  function toggle(key) { setTimiVars(prev => ({...prev,[key]:!prev[key]})); }

  const score  = TIMI_ITEMS.reduce((s,it) => s + (timiVars[it.key] ? 1 : 0), 0);
  const hasAny = Object.values(timiVars).some(Boolean);
  const res    = hasAny ? timiResult(score) : null;

  const tabBtn = (id, label, icon, activeColor) => (
    <button key={id} onClick={() => setSection(id)}
      style={{padding:"7px 14px",borderRadius:8,cursor:"pointer",whiteSpace:"nowrap",
        fontFamily:"DM Sans",fontWeight:600,fontSize:12,transition:"all .12s",
        border:`1px solid ${section===id?`${activeColor}55`:"rgba(42,79,122,0.3)"}`,
        background:section===id?`${activeColor}12`:"rgba(8,22,40,0.5)",
        color:section===id?activeColor:T.txt4}}>
      {icon} {label}
    </button>
  );

  return (
    <div style={{fontFamily:"DM Sans",
      background: embedded ? "transparent" : T.bg,
      minHeight:  embedded ? "auto" : "100vh",
      color: T.txt, padding: embedded ? "0" : "24px 16px"}}>

      {!embedded && onBack && (
        <button onClick={onBack} style={{marginBottom:16,padding:"6px 14px",borderRadius:8,
          border:"1px solid rgba(42,79,122,0.5)",background:"rgba(14,37,68,0.6)",
          color:T.txt3,fontFamily:"DM Sans",fontSize:12,fontWeight:600,cursor:"pointer"}}>
          Back to Hub
        </button>
      )}

      {embedded && (
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
          <span style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:15,color:T.orange}}>
            NSTEMI Assessment
          </span>
          <span style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.txt4,letterSpacing:1.5,
            textTransform:"uppercase",background:"rgba(255,159,67,0.1)",
            border:"1px solid rgba(255,159,67,0.25)",borderRadius:4,padding:"2px 7px"}}>
            TIMI Risk Score + High-Risk ECG Features
          </span>
        </div>
      )}

      <div style={{display:"flex",gap:5,marginBottom:14,flexWrap:"wrap"}}>
        {tabBtn("timi",     "TIMI Risk Score",        "📊", T.orange)}
        {tabBtn("features", "High-Risk ECG Features", "⚠",  T.coral )}
      </div>

      {/* ── TIMI Risk Score ─────────────────────────────────── */}
      {section === "timi" && (
        <div>
          <div style={{padding:"8px 12px",borderRadius:8,marginBottom:12,
            background:"rgba(255,159,67,0.07)",border:"1px solid rgba(255,159,67,0.2)",
            fontFamily:"DM Sans",fontSize:11,color:T.txt2,lineHeight:1.6}}>
            <strong style={{color:T.orange}}>TIMI Risk Score (Antman et al.):</strong> 7-point score predicting 14-day MACE (death, MI, urgent revascularization) in NSTEMI/UA. Drives invasive strategy timing per 2025 ACC/AHA ACS Guideline. Score each criterion present at the time of ED presentation.
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:14}}>
            {TIMI_ITEMS.map(item => {
              const on = timiVars[item.key];
              return (
                <button key={item.key} onClick={() => toggle(item.key)}
                  style={{padding:"10px 12px",borderRadius:9,cursor:"pointer",textAlign:"left",
                    border:`1px solid ${on?item.color+"55":"rgba(42,79,122,0.3)"}`,
                    background:on?`${item.color}10`:"rgba(8,22,40,0.5)",transition:"all .12s"}}>
                  <div style={{display:"flex",justifyContent:"space-between",
                    alignItems:"center",gap:8}}>
                    <div style={{fontFamily:"DM Sans",fontSize:12,lineHeight:1.4,
                      color:on?item.color:T.txt3,fontWeight:on?600:400}}>
                      {item.label}
                    </div>
                    <div style={{fontFamily:"JetBrains Mono",fontSize:11,fontWeight:700,
                      color:on?item.color:T.txt4,flexShrink:0}}>+1</div>
                  </div>
                </button>
              );
            })}
          </div>

          <div style={{display:"flex",alignItems:"stretch",gap:12,marginBottom:12}}>
            <div style={{padding:"14px 20px",borderRadius:12,
              background:"rgba(8,22,40,0.7)",border:"1px solid rgba(42,79,122,0.5)",
              textAlign:"center",minWidth:90,display:"flex",
              flexDirection:"column",justifyContent:"center"}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:44,fontWeight:700,lineHeight:1,
                color:score>=5?T.red:score>=3?T.orange:T.green}}>{score}</div>
              <div style={{fontFamily:"DM Sans",fontSize:9,color:T.txt4,marginTop:4}}>
                TIMI / 7
              </div>
            </div>
            {res ? (
              <div className="nst-in" style={{flex:1,padding:"12px 14px",borderRadius:10,
                background:`${res.color}0d`,border:`1px solid ${res.color}33`}}>
                <div style={{fontFamily:"DM Sans",fontWeight:700,fontSize:13,
                  color:res.color,marginBottom:3}}>
                  {res.label} -- {res.risk}
                </div>
                <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,
                  letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>
                  Strategy: {res.timing}
                </div>
                <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt2,
                  lineHeight:1.5,marginBottom:6}}>{res.action}</div>
                <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.txt4}}>
                  {res.source}
                </div>
              </div>
            ) : (
              <div style={{flex:1,padding:"12px 14px",borderRadius:10,
                display:"flex",alignItems:"center",
                background:"rgba(42,79,122,0.1)",border:"1px solid rgba(42,79,122,0.25)",
                fontFamily:"DM Sans",fontSize:12,color:T.txt4}}>
                Select risk factors above to calculate TIMI score and get invasive strategy timing
              </div>
            )}
          </div>

          <button onClick={() => setTimiVars(TIMI_BLANK)}
            style={{padding:"4px 12px",borderRadius:6,cursor:"pointer",
              border:"1px solid rgba(42,79,122,0.35)",background:"transparent",
              color:T.txt4,fontFamily:"JetBrains Mono",fontSize:8,
              letterSpacing:1,textTransform:"uppercase"}}>Clear</button>
        </div>
      )}

      {/* ── High-Risk ECG Features ───────────────────────────── */}
      {section === "features" && (
        <div>
          <div style={{padding:"8px 12px",borderRadius:8,marginBottom:12,
            background:"rgba(255,68,68,0.07)",border:"1px solid rgba(255,68,68,0.2)",
            fontFamily:"DM Sans",fontSize:11,color:T.txt2,lineHeight:1.6}}>
            <strong style={{color:T.coral}}>2025 ACC/AHA ACS Guideline:</strong> In NSTE-ACS, the initial ECG may be normal in 17-33% of confirmed MI. High-risk ECG features require immediate serial ECG and urgent risk stratification regardless of initial impression.
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {HIGH_RISK_FEATURES.map((f,i) => (
              <div key={i} style={{padding:"10px 13px",borderRadius:9,
                background:`${f.color}0d`,
                border:`1px solid ${f.color}30`,
                borderLeft:`3px solid ${f.color}`}}>
                <div style={{fontFamily:"DM Sans",fontWeight:700,fontSize:12,
                  color:f.color,marginBottom:4}}>{f.label}</div>
                <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt2,lineHeight:1.5}}>
                  {f.detail}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!embedded && (
        <div style={{textAlign:"center",paddingTop:24,
          fontFamily:"JetBrains Mono",fontSize:8,color:T.txt4,letterSpacing:1.5}}>
          NOTRYA NSTEMI HUB -- TIMI SCORE IS A RISK STRATIFICATION TOOL -- CLINICAL JUDGMENT REQUIRED
        </div>
      )}
    </div>
  );
}