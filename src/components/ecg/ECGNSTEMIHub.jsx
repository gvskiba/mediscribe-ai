// ECGNSTEMIHub.jsx
// NSTEMI / ACS risk stratification embedded component for ECGHub.
// Uses HEART score + 2025 ACC/AHA ACS Guideline recommendations.

import { useState } from "react";

const T = {
  txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0", red:"#ff4444",
};

const HEART_ITEMS = [
  {
    key: "history",
    label: "History",
    hint: "Characterization of the chest pain",
    options: [
      { label: "Slightly suspicious", pts: 0, detail: "Non-specific, atypical features" },
      { label: "Moderately suspicious", pts: 1, detail: "Some typical features of ACS" },
      { label: "Highly suspicious", pts: 2, detail: "Classic ischemic history" },
    ],
  },
  {
    key: "ecg",
    label: "ECG",
    hint: "Findings on the 12-lead ECG",
    options: [
      { label: "Normal", pts: 0, detail: "No significant abnormality" },
      { label: "Non-specific repolarization", pts: 1, detail: "LBBB, LVH, early repolarization, ST changes < 1mm" },
      { label: "Significant ST depression", pts: 2, detail: "New ST deviation, T-wave inversions -- exclude STEMI first" },
    ],
  },
  {
    key: "age",
    label: "Age",
    hint: "Patient age in years",
    options: [
      { label: "< 45 years", pts: 0, detail: "" },
      { label: "45-64 years", pts: 1, detail: "" },
      { label: ">= 65 years", pts: 2, detail: "" },
    ],
  },
  {
    key: "risk",
    label: "Risk Factors",
    hint: "Known atherosclerotic risk factors or history",
    options: [
      { label: "No known risk factors", pts: 0, detail: "" },
      { label: "1-2 risk factors", pts: 1, detail: "HTN, DM, hyperlipidemia, obesity, smoking, family Hx" },
      { label: ">= 3 risk factors or known CAD", pts: 2, detail: "Or known CAD, prior MI, stent, CABG" },
    ],
  },
  {
    key: "troponin",
    label: "Initial Troponin",
    hint: "Relative to institution normal limit",
    options: [
      { label: "<= normal limit", pts: 0, detail: "Within reference range" },
      { label: "1-3x normal limit", pts: 1, detail: "Mildly elevated" },
      { label: "> 3x normal limit", pts: 2, detail: "Significantly elevated" },
    ],
  },
];

function heartInterpret(score) {
  if (score <= 3) return {
    label: "Low Risk",
    color: T.green,
    risk: "< 2% MACE at 6 weeks",
    action: "Accelerated diagnostic protocol appropriate. High-sensitivity troponin at 0 and 1-2h. Consider early discharge with outpatient follow-up if troponin negative and ECG unremarkable.",
    source: "HEART Score -- 2025 ACC/AHA ACS Guideline",
  };
  if (score <= 6) return {
    label: "Moderate Risk",
    color: T.orange,
    risk: "12-17% MACE at 6 weeks",
    action: "Observation recommended. Serial troponin (0h, 2h, 6h). Cardiology consult. Consider stress testing or coronary CTA if troponins negative. Do not discharge without risk stratification.",
    source: "HEART Score -- 2025 ACC/AHA ACS Guideline",
  };
  return {
    label: "High Risk",
    color: T.red,
    risk: "50-65% MACE at 6 weeks",
    action: "Early invasive strategy recommended (Class 1). Dual antiplatelet therapy: ASA 325mg + P2Y12 inhibitor. Anticoagulation (UFH or enoxaparin). Cardiology at bedside. Target angiography within 24h for very high risk (refractory ischemia, hemodynamic instability, VT/VF).",
    source: "2025 ACC/AHA ACS Guideline (Class 1, B-R)",
  };
}

export default function ECGNSTEMIHub({ embedded = false }) {
  const [scores, setScores] = useState({});

  function select(key, pts) {
    setScores(prev => ({ ...prev, [key]: pts }));
  }

  const total = Object.values(scores).reduce((s, v) => s + v, 0);
  const complete = HEART_ITEMS.every(item => scores[item.key] !== undefined);
  const result = complete ? heartInterpret(total) : null;

  return (
    <div style={{ color: T.txt }}>
      {embedded && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontFamily: "Playfair Display", fontWeight: 700, fontSize: 15, color: T.coral }}>
            NSTEMI Risk Stratification
          </span>
          <span style={{ fontFamily: "JetBrains Mono", fontSize: 8, color: T.txt4,
            letterSpacing: 1.5, textTransform: "uppercase",
            background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.25)",
            borderRadius: 4, padding: "2px 7px" }}>
            HEART Score -- 2025 ACC/AHA
          </span>
        </div>
      )}

      <div style={{ padding: "9px 13px", borderRadius: 8, marginBottom: 14,
        background: "rgba(255,107,107,0.07)", border: "1px solid rgba(255,107,107,0.2)",
        fontFamily: "DM Sans", fontSize: 11, color: T.txt2, lineHeight: 1.6 }}>
        <strong style={{ color: T.coral }}>Important:</strong> Rule out STEMI and STEMI equivalents before using HEART score.
        HEART score is validated for undifferentiated chest pain without ST elevation.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
        {HEART_ITEMS.map(item => (
          <div key={item.key} style={{ padding: "12px 14px", borderRadius: 10,
            background: "rgba(8,22,40,0.6)", border: "1px solid rgba(42,79,122,0.35)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div>
                <div style={{ fontFamily: "DM Sans", fontWeight: 700, fontSize: 13, color: T.txt }}>
                  {item.label}
                </div>
                <div style={{ fontFamily: "DM Sans", fontSize: 10, color: T.txt4 }}>{item.hint}</div>
              </div>
              {scores[item.key] !== undefined && (
                <div style={{ fontFamily: "JetBrains Mono", fontSize: 18, fontWeight: 700,
                  color: T.teal, minWidth: 24, textAlign: "right" }}>
                  +{scores[item.key]}
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {item.options.map(opt => {
                const selected = scores[item.key] === opt.pts;
                return (
                  <button key={opt.pts} onClick={() => select(item.key, opt.pts)}
                    style={{ padding: "7px 12px", borderRadius: 7, cursor: "pointer",
                      textAlign: "left", transition: "all .12s", flex: "1 1 auto",
                      border: `1px solid ${selected ? "rgba(0,229,192,0.5)" : "rgba(42,79,122,0.3)"}`,
                      background: selected ? "rgba(0,229,192,0.12)" : "rgba(14,37,68,0.5)" }}>
                    <div style={{ fontFamily: "DM Sans", fontSize: 11, fontWeight: selected ? 700 : 500,
                      color: selected ? T.teal : T.txt3, marginBottom: opt.detail ? 2 : 0 }}>
                      {opt.label}
                      <span style={{ fontFamily: "JetBrains Mono", fontSize: 9,
                        color: selected ? T.teal : T.txt4, marginLeft: 6 }}>+{opt.pts}</span>
                    </div>
                    {opt.detail && (
                      <div style={{ fontFamily: "DM Sans", fontSize: 10, color: T.txt4, lineHeight: 1.3 }}>
                        {opt.detail}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Score display */}
      <div style={{ display: "flex", alignItems: "stretch", gap: 12 }}>
        <div style={{ padding: "14px 20px", borderRadius: 12,
          background: "rgba(8,22,40,0.7)", border: "1px solid rgba(42,79,122,0.5)",
          textAlign: "center", minWidth: 90,
          display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ fontFamily: "JetBrains Mono", fontSize: 42, fontWeight: 700,
            lineHeight: 1, color: result ? result.color : T.txt4 }}>{total}</div>
          <div style={{ fontFamily: "DM Sans", fontSize: 9, color: T.txt4, marginTop: 4 }}>
            HEART Score
          </div>
          <div style={{ fontFamily: "DM Sans", fontSize: 9, color: T.txt4 }}>
            {Object.keys(scores).length} / 5
          </div>
        </div>

        {result ? (
          <div style={{ flex: 1, padding: "12px 14px", borderRadius: 10,
            background: `${result.color}0d`, border: `1px solid ${result.color}33` }}>
            <div style={{ fontFamily: "DM Sans", fontWeight: 700, fontSize: 14,
              color: result.color, marginBottom: 3 }}>{result.label}</div>
            <div style={{ fontFamily: "JetBrains Mono", fontSize: 9, color: T.txt4,
              marginBottom: 8 }}>{result.risk}</div>
            <div style={{ fontFamily: "DM Sans", fontSize: 11, color: T.txt2,
              lineHeight: 1.5, marginBottom: 6 }}>{result.action}</div>
            <div style={{ fontFamily: "JetBrains Mono", fontSize: 8, color: T.txt4 }}>
              {result.source}
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, padding: "12px 14px", borderRadius: 10,
            display: "flex", alignItems: "center",
            background: "rgba(42,79,122,0.1)", border: "1px solid rgba(42,79,122,0.25)",
            fontFamily: "DM Sans", fontSize: 12, color: T.txt4 }}>
            Complete all 5 items above to calculate HEART score and get risk-stratified management guidance
          </div>
        )}
      </div>

      <button onClick={() => setScores({})}
        style={{ marginTop: 10, padding: "4px 12px", borderRadius: 6, cursor: "pointer",
          border: "1px solid rgba(42,79,122,0.35)", background: "transparent",
          color: T.txt4, fontFamily: "JetBrains Mono", fontSize: 8,
          letterSpacing: 1, textTransform: "uppercase" }}>
        Reset
      </button>
    </div>
  );
}