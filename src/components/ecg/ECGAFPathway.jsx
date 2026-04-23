// ECGAFPathway.jsx
// AF Clinical Decision Pathway for ECGHub.
// Stability -> Onset timing -> Cardioversion vs rate control -> Anticoagulation
// Per 2023 ACC/AHA/ACCP/HRS Atrial Fibrillation Guideline.

import { useState } from "react";

const T = {
  txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0", red:"#ff4444",
};

// Decision tree nodes
const TREE = [
  {
    id: "stable",
    q: "Is the patient hemodynamically stable?",
    hint: "Unstable = hypotension (SBP < 90), altered mental status, severe respiratory distress, signs of end-organ hypoperfusion",
    options: [
      { label: "Unstable -- hypotension, AMS, severe distress", next: "cardiovert_emerg" },
      { label: "Stable -- tolerating AF", next: "onset" },
    ],
  },
  {
    id: "onset",
    q: "What is the onset timing of AF?",
    hint: "If uncertain, treat as > 48h (higher stroke risk). Anticoagulate before cardioversion.",
    options: [
      { label: "<= 48 hours -- witnessed or reliable onset", next: "rhythm_rate_48" },
      { label: "> 48 hours or unknown onset", next: "anticoag_first" },
    ],
  },
  {
    id: "rhythm_rate_48",
    q: "What is the primary goal in this stable AF with known onset <= 48h?",
    hint: "Rhythm control is associated with improved outcomes in recent-onset AF (EAST-AFNET 4). Rate control alone is appropriate if symptoms are mild.",
    options: [
      { label: "Rhythm control -- cardioversion", next: "cardiovert_elective" },
      { label: "Rate control -- control ventricular response", next: "rate_control" },
    ],
  },
  {
    id: "anticoag_first",
    q: "For AF > 48h: is anticoagulation currently therapeutic OR has TEE excluded thrombus?",
    hint: "For AF > 48h: cardioversion without anticoagulation carries significant stroke risk. Must anticoagulate for >= 3 weeks prior OR obtain TEE to exclude LAA thrombus.",
    options: [
      { label: "Yes -- therapeutic OAC >= 3 weeks or TEE negative", next: "cardiovert_elective" },
      { label: "No -- start anticoagulation now, cardioversion deferred", next: "anticoag_bridge" },
    ],
  },
];

const RESULTS = {
  cardiovert_emerg: {
    label: "Emergency Synchronized Cardioversion",
    color: T.red,
    urgency: "Immediate",
    steps: [
      "Synchronized DC cardioversion -- 200J biphasic (Class 1)",
      "Sedation: procedural sedation (etomidate or ketamine) if time allows",
      "Anticoagulate with UFH immediately if not already on OAC",
      "Do NOT delay cardioversion for anticoagulation in hemodynamically unstable patient",
      "Post-cardioversion anticoagulation for >= 4 weeks regardless of prior OAC status",
    ],
    note: "Hemodynamic instability from AF warrants immediate cardioversion. Anticoagulation should not delay the procedure.",
    source: "2023 ACC/AHA/ACCP/HRS AF Guideline (Class 1, B-NR)",
  },
  cardiovert_elective: {
    label: "Elective Cardioversion -- Rhythm Control",
    color: T.teal,
    urgency: "Planned",
    steps: [
      "Chemical cardioversion: flecainide (pill-in-pocket, no structural disease), amiodarone IV, or procainamide",
      "Electrical cardioversion: synchronized 200J biphasic if chemical fails or preferred",
      "Anticoagulate before and 4 weeks after cardioversion (Class 1)",
      "DOAC preferred over warfarin for anticoagulation (Class 1)",
      "Address reversible triggers: hyperthyroidism, alcohol, hypertension, sleep apnea",
    ],
    note: "Early rhythm control (within 1 year of AF diagnosis) associated with reduced cardiovascular events (EAST-AFNET 4, Class 2a).",
    source: "2023 ACC/AHA/ACCP/HRS AF Guideline (Class 1 cardioversion, Class 2a early rhythm control)",
  },
  rate_control: {
    label: "Rate Control Strategy",
    color: T.blue,
    urgency: "Moderate",
    steps: [
      "Target HR < 110 bpm at rest (lenient) or < 80 bpm (strict, symptomatic patients)",
      "Beta-blockers first-line: metoprolol tartrate 5mg IV q5min x3 or PO",
      "Non-dihydropyridine CCBs: diltiazem IV 0.25 mg/kg over 2 min (avoid in HFrEF)",
      "Digoxin: adjunct for sedentary patients or HFrEF (slower onset)",
      "Avoid AV nodal blockers in WPW + AF -- treat with procainamide",
    ],
    note: "Rate control is not inferior to rhythm control for long-term outcomes in persistent AF (AFFIRM). Anticoagulate based on CHA2DS2-VASc regardless of rate vs rhythm strategy.",
    source: "2023 ACC/AHA/ACCP/HRS AF Guideline (Class 1)",
  },
  anticoag_bridge: {
    label: "Anticoagulate -- Cardioversion Deferred",
    color: T.orange,
    urgency: "Planned",
    steps: [
      "Start DOAC immediately (apixaban, rivaroxaban, dabigatran) -- preferred over warfarin (Class 1)",
      "If warfarin: target INR 2.0-3.0 for >= 3 weeks before cardioversion",
      "Alternative: TEE to exclude LAA thrombus, then cardioversion if negative",
      "Rate control during anticoagulation waiting period",
      "Reassess rhythm control vs rate control strategy at follow-up",
    ],
    note: "Cardioversion of AF > 48h without adequate anticoagulation carries 1-5% stroke risk. Never cardiovert without anticoagulation or TEE exclusion of thrombus.",
    source: "2023 ACC/AHA/ACCP/HRS AF Guideline (Class 1)",
  },
};

export default function ECGAFPathway({ embedded = false, afAnswers, setAfAnswers }) {
  // Allow internal state if not controlled externally
  const [internalAnswers, setInternalAnswers] = useState({});
  const answers = afAnswers !== undefined ? afAnswers : internalAnswers;
  const setAnswers = setAfAnswers !== undefined ? setAfAnswers : setInternalAnswers;

  function answer(nodeId, optLabel) {
    setAnswers(prev => ({ ...prev, [nodeId]: optLabel }));
  }

  function reset() {
    setAnswers({});
  }

  // Walk tree to find current node or result
  let nodeId = "stable";
  for (;;) {
    const node = TREE.find(n => n.id === nodeId);
    if (!node) break;
    const ans = answers[nodeId];
    if (!ans) break;
    const opt = node.options.find(o => o.label === ans);
    if (!opt) break;
    nodeId = opt.next;
  }

  const result = RESULTS[nodeId];
  const currentNode = TREE.find(n => n.id === nodeId);
  const answeredKeys = Object.keys(answers);

  return (
    <div style={{ color: T.txt }}>
      {embedded && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontFamily: "Playfair Display", fontWeight: 700, fontSize: 15, color: T.purple }}>
            AF Clinical Decision Pathway
          </span>
          <span style={{ fontFamily: "JetBrains Mono", fontSize: 8, color: T.txt4, letterSpacing: 1.5,
            textTransform: "uppercase", background: "rgba(155,109,255,0.1)",
            border: "1px solid rgba(155,109,255,0.25)", borderRadius: 4, padding: "2px 7px" }}>
            2023 ACC/AHA/ACCP/HRS
          </span>
        </div>
      )}

      {/* Answer breadcrumb trail */}
      {answeredKeys.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12, alignItems: "center" }}>
          {answeredKeys.map((k, i) => (
            <div key={k} style={{ padding: "2px 9px", borderRadius: 5,
              background: "rgba(155,109,255,0.1)", border: "1px solid rgba(155,109,255,0.25)",
              fontFamily: "DM Sans", fontSize: 10, color: T.purple }}>
              {answers[k]}
            </div>
          ))}
          <button onClick={reset}
            style={{ padding: "2px 9px", borderRadius: 5, cursor: "pointer",
              border: "1px solid rgba(42,79,122,0.35)", background: "transparent",
              fontFamily: "JetBrains Mono", fontSize: 8, color: T.txt4,
              letterSpacing: 1, textTransform: "uppercase" }}>
            Reset
          </button>
        </div>
      )}

      {/* Current question */}
      {currentNode && !result && (
        <div style={{ padding: "14px 16px", borderRadius: 12,
          background: "rgba(8,22,40,0.6)", border: "1px solid rgba(42,79,122,0.45)" }}>
          <div style={{ fontFamily: "DM Sans", fontWeight: 600, fontSize: 13,
            color: T.txt, marginBottom: 6 }}>
            {currentNode.q}
          </div>
          {currentNode.hint && (
            <div style={{ fontFamily: "DM Sans", fontSize: 11, color: T.txt4,
              marginBottom: 12, lineHeight: 1.4, fontStyle: "italic" }}>
              {currentNode.hint}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {currentNode.options.map(opt => (
              <button key={opt.label} onClick={() => answer(currentNode.id, opt.label)}
                style={{ padding: "10px 14px", borderRadius: 8, cursor: "pointer",
                  textAlign: "left", transition: "all .12s",
                  border: "1px solid rgba(42,79,122,0.4)",
                  background: "rgba(8,22,40,0.5)",
                  fontFamily: "DM Sans", fontSize: 12, color: T.txt2, fontWeight: 500 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(155,109,255,0.5)"; e.currentTarget.style.color = T.txt; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(42,79,122,0.4)";   e.currentTarget.style.color = T.txt2; }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div style={{ padding: "14px 16px", borderRadius: 12,
          background: `${result.color}0d`, border: `1px solid ${result.color}33` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ fontFamily: "Playfair Display", fontWeight: 700,
              fontSize: 16, color: result.color }}>
              {result.label}
            </div>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 8, fontWeight: 700,
              color: result.color, background: `${result.color}18`,
              border: `1px solid ${result.color}44`, borderRadius: 4,
              padding: "2px 8px", textTransform: "uppercase", letterSpacing: 1 }}>
              {result.urgency}
            </span>
          </div>

          <div style={{ marginBottom: 10 }}>
            <div style={{ fontFamily: "JetBrains Mono", fontSize: 8, color: T.teal,
              letterSpacing: 1, textTransform: "uppercase", marginBottom: 7 }}>Action Steps</div>
            {result.steps.map((step, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6 }}>
                <span style={{ fontFamily: "JetBrains Mono", fontSize: 9, color: result.color,
                  flexShrink: 0, minWidth: 16 }}>{i + 1}.</span>
                <span style={{ fontFamily: "DM Sans", fontSize: 11, color: T.txt2, lineHeight: 1.5 }}>
                  {step}
                </span>
              </div>
            ))}
          </div>

          <div style={{ padding: "8px 10px", borderRadius: 8, marginBottom: 10,
            background: "rgba(245,200,66,0.06)", border: "1px solid rgba(245,200,66,0.2)" }}>
            <div style={{ fontFamily: "DM Sans", fontSize: 11, color: T.txt2, lineHeight: 1.5,
              fontStyle: "italic" }}>
              {result.note}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontFamily: "JetBrains Mono", fontSize: 8, color: T.txt4 }}>
              {result.source}
            </div>
            <button onClick={reset}
              style={{ padding: "4px 12px", borderRadius: 6, cursor: "pointer",
                border: "1px solid rgba(42,79,122,0.4)", background: "transparent",
                fontFamily: "JetBrains Mono", fontSize: 8, color: T.txt4,
                letterSpacing: 1, textTransform: "uppercase" }}>
              Start Over
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!currentNode && !result && (
        <div style={{ padding: "14px", borderRadius: 10, textAlign: "center",
          background: "rgba(42,79,122,0.1)", border: "1px solid rgba(42,79,122,0.25)",
          fontFamily: "DM Sans", fontSize: 12, color: T.txt4 }}>
          Answer the questions above to navigate the AF decision pathway
        </div>
      )}
    </div>
  );
}