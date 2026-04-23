// ECGAFPathway.jsx
// Atrial Fibrillation Clinical Decision Pathway for Notrya ECG Hub.
// Covers: hemodynamic stability, onset timing, rhythm vs rate control,
//         cardioversion strategy, and anticoagulation.
// Per 2023 ACC/AHA/ACCP/HRS Guideline for the Diagnosis and Management of AF.
//
// Props: embedded, onBack, afAnswers, setAfAnswers
//   (State managed in parent to preserve across tool sub-tab switches)
//
// Constraints: no Router, no localStorage, no form/alert, straight quotes,
//   typeof document guard.

import { useState } from "react";

(() => {
  if (typeof document === "undefined") return;
  if (document.getElementById("af-style")) return;
  const s = document.createElement("style"); s.id = "af-style";
  s.textContent = `@keyframes af-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}.af-in{animation:af-in .2s ease forwards;}`;
  document.head.appendChild(s);
})();

const T = {
  bg:"#050f1e", txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0", red:"#ff4444",
};

// Decision tree nodes
const AF_TREE = [
  {
    id:"q1",
    q:"Is the patient hemodynamically UNSTABLE?",
    detail:"Hypotension (SBP < 90mmHg), altered mental status, ongoing ischemia, or acute pulmonary edema attributable to AF",
    yes:"unstable", no:"q2",
  },
  {
    id:"q2",
    q:"Is AF onset timing confirmed?",
    detail:"Onset < 48h: documented by patient symptoms, ECG timestamp, or medical history. If uncertain, treat as > 48h.",
    options:[
      {label:"Onset confirmed < 48 hours",           next:"q3"},
      {label:"Onset > 48 hours or uncertain",         next:"gt48"},
      {label:"Permanent AF -- rhythm control not desired", next:"perm"},
    ],
  },
  {
    id:"q3",
    q:"What is the treatment goal?",
    detail:"Rhythm control preferred: first episode, young symptomatic patient, HFrEF, or intolerable symptoms on rate control. Rate control preferred: older, asymptomatic, multiple failed cardioversions, or patient preference.",
    options:[
      {label:"Rhythm control -- cardioversion",       next:"rhythm_lt48"},
      {label:"Rate control only",                    next:"rate_lt48"},
    ],
  },
];

// Terminal results with actions and anticoag guidance
const AF_RESULTS = {
  unstable: {
    label:"Immediate Electrical Cardioversion",
    color:T.red, urgency:"Immediate",
    cardioversion:"Synchronized cardioversion at 120-200J biphasic (Class 1). Do NOT delay for anticoagulation in an unstable patient -- cardioversion takes priority. Procedural sedation (ketamine, propofol, etomidate) if hemodynamics allow. If WPW suspected, proceed with cardioversion regardless.",
    anticoag:"Anticoagulate as soon as hemodynamically stable. Heparin IV immediately post-cardioversion. Long-term OAC per CHA2DS2-VASc. TEE or ≥ 3 weeks of OAC required before any planned elective repeat cardioversion.",
    source:"2023 ACC/AHA/ACCP/HRS AF Guideline (Class 1 cardioversion)",
  },
  rhythm_lt48: {
    label:"Rhythm Control -- Cardioversion (Onset < 48h)",
    color:T.teal, urgency:"Urgent (hours)",
    cardioversion:"Pharmacologic: flecainide 200-300mg PO (no structural disease) OR propafenone 450-600mg PO (no structural disease) -- pill-in-pocket. Amiodarone 150mg IV over 10 min then 1mg/min if structural heart disease or uncertain. Electrical: synchronized cardioversion 120-200J biphasic if pharmacologic fails or immediate rhythm control needed.",
    anticoag:"Start OAC (DOAC preferred over warfarin, Class 1) immediately. Anticoagulate >= 4 weeks post-cardioversion regardless of CHA2DS2-VASc score (post-cardioversion stunning). Long-term OAC per CHA2DS2-VASc thereafter.",
    source:"2023 ACC/AHA/ACCP/HRS AF Guideline",
    pitfall:"Avoid flecainide and propafenone if structural heart disease (prior MI, HF, LVH) -- can cause pro-arrhythmia. Use amiodarone instead.",
  },
  rate_lt48: {
    label:"Rate Control Strategy (Onset < 48h)",
    color:T.blue, urgency:"Urgent",
    cardioversion:"IV diltiazem 0.25 mg/kg over 2 min then infusion (preferred if normal LVEF) OR metoprolol 2.5-5mg IV q5 min x3. AVOID diltiazem and verapamil if LVEF < 40% or if WPW/pre-excited AF suspected. Use digoxin or amiodarone if HFrEF. Target resting HR < 110 bpm (lenient strategy, Class 2a). Rate < 80 bpm for symptomatic patients.",
    anticoag:"Start OAC per CHA2DS2-VASc. CHA2DS2-VASc >= 2 (male) or >= 3 (female): DOAC recommended, Class 1. DOAC preferred over warfarin (Class 1). Do not withhold OAC solely for fall risk.",
    source:"2023 ACC/AHA/ACCP/HRS AF Guideline (Class 2a lenient rate target)",
    pitfall:"WPW + AF: AVOID all AV-nodal blockers (adenosine, diltiazem, verapamil, digoxin, beta-blockers) -- can precipitate VF. Use procainamide 15-17 mg/kg IV or ibutilide. Cardiovert if unstable.",
  },
  gt48: {
    label:"AF Onset > 48h or Unknown -- Anticoagulate First",
    color:T.orange, urgency:"Planned / Elective",
    cardioversion:"Two safe pathways: (A) TEE to exclude left atrial appendage thrombus -- if negative, proceed to cardioversion immediately, then anticoagulate >= 4 weeks. OR (B) Therapeutic OAC >= 3 weeks confirmed, then cardiovert, then OAC >= 4 weeks post-CV. Rate control in the interim while awaiting cardioversion.",
    anticoag:"Long-term OAC per CHA2DS2-VASc. DOAC preferred over warfarin (Class 1). Start immediately on diagnosis. Do not stop OAC after cardioversion -- structural remodeling persists and thromboembolism risk continues >= 4 weeks.",
    source:"2023 ACC/AHA/ACCP/HRS AF Guideline (Class 1 anticoagulate first)",
    pitfall:"Do not cardiovert AF of unknown duration without prior TEE or 3 weeks of OAC. Post-cardioversion stroke risk peaks at 0-72 hours due to atrial stunning even after successful cardioversion to sinus rhythm.",
  },
  perm: {
    label:"Permanent AF -- Rate Control Only",
    color:T.purple, urgency:"Elective / Outpatient",
    cardioversion:"Lenient rate control: target resting HR < 110 bpm is acceptable (RACE II trial, Class 2a). Stricter control (< 80 bpm) for symptomatic patients. First-line: beta-blocker or CCB (diltiazem/verapamil). Avoid diltiazem and verapamil if LVEF < 40% -- use carvedilol, metoprolol, or digoxin instead. Reassess rhythm control candidacy periodically.",
    anticoag:"OAC per CHA2DS2-VASc. CHA2DS2-VASc >= 2 (male) or >= 3 (female): DOAC Class 1. DOAC preferred over warfarin for non-valvular AF (Class 1). Use CHA2DS2-VASc calculator in Clinical Tools.",
    source:"2023 ACC/AHA/ACCP/HRS AF Guideline",
    pitfall:"Permanent AF label should not preclude rhythm control reassessment -- catheter ablation may be reasonable for symptom burden or tachycardia-mediated cardiomyopathy at any stage.",
  },
};

export default function ECGAFPathway({
  embedded = false, onBack,
  afAnswers, setAfAnswers,
}) {
  // Allow local state if parent doesn't provide it
  const [localAnswers, setLocalAnswers] = useState({});
  const answers    = afAnswers    ?? localAnswers;
  const setAnswers = setAfAnswers ?? setLocalAnswers;

  function answer(qId, val) { setAnswers(prev => ({...prev,[qId]:val})); }
  function reset() { setAnswers({}); }

  // Walk tree
  let nodeId = "q1";
  for (;;) {
    const node = AF_TREE.find(n => n.id === nodeId);
    if (!node) break;
    const ans = answers[nodeId];
    if (!ans) break;
    if (node.yes && ans === "yes") { nodeId = node.yes; continue; }
    if (node.no  && ans === "no")  { nodeId = node.no;  continue; }
    if (node.options) { const o = node.options.find(x => x.label === ans); if (o) { nodeId = o.next; continue; } }
    break;
  }

  const result      = AF_RESULTS[nodeId];
  const currentNode = AF_TREE.find(n => n.id === nodeId);

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
          <span style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:15,color:T.blue}}>
            AF Decision Pathway
          </span>
          <span style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.txt4,letterSpacing:1.5,
            textTransform:"uppercase",background:"rgba(59,158,255,0.1)",
            border:"1px solid rgba(59,158,255,0.25)",borderRadius:4,padding:"2px 7px"}}>
            2023 ACC/AHA/ACCP/HRS AF Guideline
          </span>
        </div>
      )}

      <div style={{padding:"8px 12px",borderRadius:8,marginBottom:12,
        background:"rgba(59,158,255,0.07)",border:"1px solid rgba(59,158,255,0.25)",
        fontFamily:"DM Sans",fontSize:11,color:T.txt2,lineHeight:1.5}}>
        <strong style={{color:T.blue}}>Three core AF decisions:</strong> hemodynamic stability (cardiovert vs rate control), onset timing (thromboembolic risk window), and anticoagulation (CHA2DS2-VASc). Always exclude WPW before giving AV-nodal blockers.
      </div>

      {/* Answered breadcrumb */}
      {Object.keys(answers).length > 0 && (
        <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:10,alignItems:"center"}}>
          {Object.values(answers).map((a,i) => (
            <div key={i} style={{padding:"2px 9px",borderRadius:5,
              background:"rgba(59,158,255,0.08)",border:"1px solid rgba(59,158,255,0.25)",
              fontFamily:"DM Sans",fontSize:10,color:T.blue}}>{a}</div>
          ))}
          <button onClick={reset} style={{padding:"2px 9px",borderRadius:5,cursor:"pointer",
            border:"1px solid rgba(42,79,122,0.35)",background:"transparent",
            fontFamily:"JetBrains Mono",fontSize:8,color:T.txt4,letterSpacing:1,textTransform:"uppercase"}}>
            Reset
          </button>
        </div>
      )}

      {/* Active question */}
      {currentNode && !result && (
        <div className="af-in" style={{padding:"14px 16px",borderRadius:12,
          background:"rgba(8,22,40,0.6)",border:"1px solid rgba(42,79,122,0.45)"}}>
          <div style={{fontFamily:"DM Sans",fontWeight:600,fontSize:13,color:T.txt,marginBottom:5}}>
            {currentNode.q}
          </div>
          {currentNode.detail && (
            <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt4,
              marginBottom:12,lineHeight:1.4,fontStyle:"italic"}}>
              {currentNode.detail}
            </div>
          )}
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            {currentNode.yes && (
              <>
                <button onClick={() => answer(currentNode.id,"yes")}
                  style={{padding:"9px 14px",borderRadius:8,cursor:"pointer",textAlign:"left",
                    border:"1px solid rgba(255,68,68,0.35)",background:"rgba(255,68,68,0.06)",
                    fontFamily:"DM Sans",fontSize:12,color:T.red,fontWeight:600}}>
                  Yes -- hemodynamically unstable
                </button>
                <button onClick={() => answer(currentNode.id,"no")}
                  style={{padding:"9px 14px",borderRadius:8,cursor:"pointer",textAlign:"left",
                    border:"1px solid rgba(61,255,160,0.35)",background:"rgba(61,255,160,0.06)",
                    fontFamily:"DM Sans",fontSize:12,color:T.green,fontWeight:600}}>
                  No -- hemodynamically stable
                </button>
              </>
            )}
            {currentNode.options && currentNode.options.map(opt => (
              <button key={opt.label} onClick={() => answer(currentNode.id, opt.label)}
                style={{padding:"9px 14px",borderRadius:8,cursor:"pointer",textAlign:"left",
                  border:"1px solid rgba(42,79,122,0.4)",background:"rgba(8,22,40,0.5)",
                  fontFamily:"DM Sans",fontSize:12,color:T.txt2,fontWeight:500,
                  transition:"all .12s"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(59,158,255,0.5)";e.currentTarget.style.color=T.txt;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(42,79,122,0.4)";e.currentTarget.style.color=T.txt2;}}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="af-in" style={{padding:"14px 16px",borderRadius:12,
          background:`${result.color}0d`,border:`1px solid ${result.color}33`}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
            <div style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:16,color:result.color}}>
              {result.label}
            </div>
            <span style={{fontFamily:"JetBrains Mono",fontSize:8,fontWeight:700,
              color:result.color,background:`${result.color}18`,
              border:`1px solid ${result.color}44`,borderRadius:4,
              padding:"2px 8px",textTransform:"uppercase",letterSpacing:1}}>
              {result.urgency}
            </span>
          </div>

          <div style={{padding:"9px 11px",borderRadius:8,marginBottom:8,
            background:"rgba(0,229,192,0.06)",border:"1px solid rgba(0,229,192,0.2)"}}>
            <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.teal,
              letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>
              Cardioversion / Rate Strategy
            </div>
            <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt2,lineHeight:1.5}}>
              {result.cardioversion}
            </div>
          </div>

          <div style={{padding:"9px 11px",borderRadius:8,marginBottom:8,
            background:"rgba(59,158,255,0.06)",border:"1px solid rgba(59,158,255,0.2)"}}>
            <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.blue,
              letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>
              Anticoagulation
            </div>
            <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt2,lineHeight:1.5}}>
              {result.anticoag}
            </div>
          </div>

          {result.pitfall && (
            <div style={{padding:"8px 11px",borderRadius:8,marginBottom:8,
              background:"rgba(255,159,67,0.06)",border:"1px solid rgba(255,159,67,0.2)"}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.orange,
                letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>Pitfall</div>
              <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt2,
                lineHeight:1.5,fontStyle:"italic"}}>{result.pitfall}</div>
            </div>
          )}

          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.txt4}}>{result.source}</div>
            <button onClick={reset} style={{padding:"4px 12px",borderRadius:6,cursor:"pointer",
              border:"1px solid rgba(42,79,122,0.4)",background:"transparent",
              fontFamily:"JetBrains Mono",fontSize:8,color:T.txt4,
              letterSpacing:1,textTransform:"uppercase"}}>
              Start Over
            </button>
          </div>
        </div>
      )}

      {!embedded && (
        <div style={{textAlign:"center",paddingTop:24,
          fontFamily:"JetBrains Mono",fontSize:8,color:T.txt4,letterSpacing:1.5}}>
          NOTRYA AF PATHWAY -- CLINICAL JUDGMENT REQUIRED -- 2023 ACC/AHA/ACCP/HRS AF GUIDELINE
        </div>
      )}
    </div>
  );
}