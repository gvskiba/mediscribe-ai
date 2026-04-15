// ChestPainHub.jsx
// Integrated Chest Pain Evaluation Hub
// Combines: HEART Score · Serial Troponin Tracker · EDACS · ACS Protocol
//           Disposition Matrix
//
// Clinical basis:
//   - HEART Score (Backus 2010) — validated in >250,000 patients
//   - High-sensitivity troponin 0h/3h accelerated protocol (ESC 2020)
//   - EDACS (Emergency Department Assessment of Chest Pain Score)
//   - ACC/AHA 2021 guidelines for chest pain evaluation
//   - ACEP 2024: high-sensitivity cTnI 0/1h or 0/2h protocol preferred
//
// Route: /ChestPainHub
// Standalone page. No embedded encounter props required (standalone lookup).
//
// Constraints: no form, no localStorage, straight quotes only,
//   single react import, border before borderTop/etc.

import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// ── Font + style injection ─────────────────────────────────────────────────
(() => {
  if (document.getElementById("cph-fonts")) return;
  const l = document.createElement("link");
  l.id = "cph-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "cph-css";
  s.textContent = `
    @keyframes cph-fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
    .cph-fade{animation:cph-fade .2s ease forwards}
    @keyframes cph-pulse{0%,100%{opacity:.5;transform:scale(.9)}50%{opacity:1;transform:scale(1)}}
    @keyframes shimmer-cph{0%{background-position:-200% center}100%{background-position:200% center}}
    .shimmer-cph{background:linear-gradient(90deg,#f2f7ff 0%,#ff9f43 40%,#ff6b6b 60%,#f2f7ff 100%);
      background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;
      background-clip:text;animation:shimmer-cph 4s linear infinite;}
  `;
  document.head.appendChild(s);
})();

// ── Tokens ─────────────────────────────────────────────────────────────────
const T = {
  bg:"#07090f", panel:"#0d1117", card:"#111923",
  txt:"#f0f4ff", txt2:"#b0c4de", txt3:"#7896b4", txt4:"#4a6a8a",
  teal:"#00d4b4", gold:"#f5c842", coral:"#ff5757", blue:"#4da6ff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0", red:"#ff4444",
  accent:"#ff6b35",
};

// ── Tab config ─────────────────────────────────────────────────────────────
const TABS = [
  { id:"heart",      label:"HEART Score",     icon:"💓", color:T.coral  },
  { id:"troponin",   label:"Troponin Tracker",icon:"🔬", color:T.blue   },
  { id:"edacs",      label:"EDACS",           icon:"🧮", color:T.purple },
  { id:"protocol",   label:"ACS Protocol",    icon:"⚡", color:T.orange },
  { id:"dispo",      label:"Disposition",     icon:"🚪", color:T.teal   },
];

// ═══════════════════════════════════════════════════════════════════════════
// HEART SCORE
// H — History     0-2
// E — ECG         0-2
// A — Age         0-2
// R — Risk Factors 0-2
// T — Troponin    0-2
// ═══════════════════════════════════════════════════════════════════════════
const HEART_ITEMS = [
  {
    key:"history", label:"History", color:T.coral,
    hint:"Degree to which presentation is suspicious for ACS",
    options:[
      { val:0, label:"Slightly suspicious", sub:"Non-specific history, atypical features" },
      { val:1, label:"Moderately suspicious", sub:"Combination of typical and atypical" },
      { val:2, label:"Highly suspicious", sub:"Typical crushing/pressure, radiation, diaphoresis" },
    ],
  },
  {
    key:"ecg", label:"ECG", color:T.blue,
    hint:"Most recent 12-lead ECG",
    options:[
      { val:0, label:"Normal", sub:"No ST changes, no LBBB, no LVH" },
      { val:1, label:"Non-specific repolarization disturbance", sub:"LBBB, LVH, repolarization changes" },
      { val:2, label:"Significant ST deviation", sub:"ST depression/elevation, new LBBB" },
    ],
  },
  {
    key:"age", label:"Age", color:T.purple,
    hint:"Patient age at time of presentation",
    options:[
      { val:0, label:"< 45 years",  sub:"" },
      { val:1, label:"45 – 64 years", sub:"" },
      { val:2, label:"≥ 65 years",  sub:"" },
    ],
  },
  {
    key:"risk", label:"Risk Factors", color:T.orange,
    hint:"Known CAD risk factors",
    options:[
      { val:0, label:"No known risk factors", sub:"No DM, HTN, hypercholesterolemia, obesity, smoking, family Hx" },
      { val:1, label:"1–2 risk factors", sub:"OR history of atherosclerotic disease" },
      { val:2, label:"≥ 3 risk factors or history of CAD", sub:"Prior MI, PCI, CABG, angina" },
    ],
  },
  {
    key:"troponin_h", label:"Troponin", color:T.gold,
    hint:"Initial troponin relative to ULN at your institution",
    options:[
      { val:0, label:"≤ Normal limit", sub:"Within the normal reference range" },
      { val:1, label:"1–3× normal limit", sub:"Mildly elevated" },
      { val:2, label:"> 3× normal limit", sub:"Markedly elevated" },
    ],
  },
];

function heartStrata(score) {
  if (score <= 3) return { label:"Low Risk", color:T.teal,   mace:"0.9–1.7%", rec:"Consider early discharge with outpatient follow-up" };
  if (score <= 6) return { label:"Moderate Risk", color:T.gold, mace:"12–16.6%", rec:"Serial troponin, admission or observation for further evaluation" };
  return                 { label:"High Risk",     color:T.coral, mace:"50–65%",   rec:"Cardiology consult, admit, likely invasive strategy" };
}

// ═══════════════════════════════════════════════════════════════════════════
// TROPONIN TRACKER
// Supports: conventional (ng/mL), high-sensitivity (ng/L)
// Protocols: 0h/3h, 0h/1h (hs-cTnI), 0h/2h
// ═══════════════════════════════════════════════════════════════════════════
const TROPONIN_UNITS = ["ng/mL", "ng/L (hs-cTnI)", "µg/L"];

const HST_PROTOCOL = {
  ruleOut_0h:  5,
  ruleIn_0h:   52,
  ruleOut_delta: 3,
  ruleIn_delta:  6,
};

function evalHSTProtocol(t0, t1) {
  if (!t0 && t0 !== 0) return null;
  const v0 = parseFloat(t0);
  if (isNaN(v0)) return null;

  if (v0 < HST_PROTOCOL.ruleOut_0h) {
    return { result:"rule_out", label:"Rule-Out", color:T.teal,
      detail:`hs-cTnI ${v0} ng/L < 5 ng/L — very low probability of AMI` };
  }
  if (v0 >= HST_PROTOCOL.ruleIn_0h) {
    return { result:"rule_in", label:"Rule-In", color:T.coral,
      detail:`hs-cTnI ${v0} ng/L ≥ 52 ng/L — high probability of AMI` };
  }

  if (!t1 && t1 !== 0) {
    return { result:"observe", label:"Observe", color:T.gold,
      detail:`hs-cTnI ${v0} ng/L — intermediate zone, 1h sample required` };
  }
  const v1    = parseFloat(t1);
  if (isNaN(v1)) return null;
  const delta = Math.abs(v1 - v0);

  if (delta < HST_PROTOCOL.ruleOut_delta && v1 < HST_PROTOCOL.ruleIn_0h) {
    return { result:"rule_out", label:"Rule-Out (0/1h)", color:T.teal,
      detail:`0h ${v0} → 1h ${v1} ng/L | Δ ${delta.toFixed(1)} < 3 ng/L — AMI ruled out` };
  }
  if (delta >= HST_PROTOCOL.ruleIn_delta || v1 >= HST_PROTOCOL.ruleIn_0h) {
    return { result:"rule_in", label:"Rule-In (0/1h)", color:T.coral,
      detail:`0h ${v0} → 1h ${v1} ng/L | Δ ${delta.toFixed(1)} ≥ 6 ng/L — AMI likely` };
  }
  return { result:"observe", label:"Observe", color:T.gold,
    detail:`0h ${v0} → 1h ${v1} ng/L | Δ ${delta.toFixed(1)} — intermediate, continue monitoring` };
}

function troponinResult(t0, t1, t2, ulnInput) {
  const uln = parseFloat(ulnInput) || 0.04;
  const v0  = parseFloat(t0);
  const v1  = parseFloat(t1);
  const v2  = parseFloat(t2);

  if (isNaN(v0)) return null;

  const peak  = Math.max(...[v0, v1, v2].filter(v => !isNaN(v)));
  const fold  = uln > 0 ? peak / uln : null;
  const delta = (!isNaN(v1) && v0 !== undefined)
    ? ((v1 - v0) / Math.max(v0, 0.001) * 100).toFixed(0) : null;

  let interp = "normal";
  if (fold !== null && fold > 1) {
    const rising = (!isNaN(v1) && v1 > v0 * 1.2) || (!isNaN(v2) && v2 > v1 * 1.1);
    const deltaSig = delta !== null && Math.abs(parseFloat(delta)) >= 20;
    if (fold > 3 || deltaSig) interp = "acs";
    else interp = "elevated";
  }

  return { v0, v1, v2, peak, fold, delta, interp, uln };
}

// ═══════════════════════════════════════════════════════════════════════════
// EDACS (Emergency Department Assessment of Chest Pain Score)
// ═══════════════════════════════════════════════════════════════════════════
function calcEDACS(fields) {
  let score = 0;
  const { age, sex, diaphoresis, radiation, inspiratory, palpation, knownCAD } = fields;
  const a = parseInt(age) || 0;

  if (sex === "M") {
    if (a >= 18 && a <= 45) score += 2;
    else if (a <= 50)       score += 4;
    else if (a <= 55)       score += 6;
    else if (a <= 60)       score += 8;
    else if (a <= 65)       score += 10;
    else if (a <= 70)       score += 12;
    else if (a <= 75)       score += 14;
    else                    score += 16;
  } else {
    if (a >= 18 && a <= 45) score -= 6;
    else if (a <= 50)       score -= 4;
    else if (a <= 55)       score -= 2;
    else if (a <= 60)       score += 0;
    else if (a <= 65)       score += 3;
    else if (a <= 70)       score += 5;
    else if (a <= 75)       score += 8;
    else                    score += 11;
  }

  if (diaphoresis)    score += 3;
  if (radiation)      score += 5;
  if (!inspiratory)   score += 4;
  if (!palpation)     score += 6;
  if (knownCAD)       score += 12;

  return score;
}

function edacsRisk(score, negTrop) {
  if (score < 16 && negTrop) {
    return { label:"Low Risk", color:T.teal,
      rec:"EDACS < 16 with negative troponin — safe for early discharge protocol" };
  }
  return { label:"Not Low Risk", color:T.coral,
    rec:"EDACS ≥ 16 or positive troponin — standard evaluation pathway" };
}

// ═══════════════════════════════════════════════════════════════════════════
// ACS PROTOCOL — ACEP/ACC 2024
// ═══════════════════════════════════════════════════════════════════════════
const ACS_STEPS = [
  {
    title:"Immediate",
    color:T.coral,
    steps:[
      "IV access × 2 · Cardiac monitor · 12-lead EKG within 10 minutes",
      "Aspirin 325 mg PO (chew) — unless allergy or active bleeding",
      "12-lead EKG interpretation: STEMI? → activate cath lab immediately",
      "Point-of-care troponin + BMP + CBC + coagulation",
      "Oxygen if SpO2 < 90% — avoid routine oxygen in normoxic patients",
    ],
  },
  {
    title:"Anti-ischemic",
    color:T.orange,
    steps:[
      "Nitroglycerin 0.4 mg SL q5 min × 3 for ongoing pain (hold if SBP < 90 or RV infarct suspected)",
      "Morphine 2–4 mg IV for refractory pain — use cautiously (associated with ↑ mortality in NSTEMI)",
      "Metoprolol 25–50 mg PO if HR > 60, no HF, no bronchospasm, no cardiogenic shock",
      "Avoid NSAIDs — increase risk of death, reinfarction, and rupture",
    ],
  },
  {
    title:"Anticoagulation (NSTEMI/UA)",
    color:T.blue,
    steps:[
      "UFH: 60 units/kg IV bolus (max 4,000 units) → 12 units/kg/hr (max 1,000 units/hr)",
      "Enoxaparin: 1 mg/kg SQ q12h (reduce to 1 mg/kg SQ q24h if CrCl < 30)",
      "Fondaparinux 2.5 mg SQ daily — preferred if bleeding risk high",
      "Bivalirudin: PCI-preferred setting — 0.75 mg/kg bolus → 1.75 mg/kg/hr",
    ],
  },
  {
    title:"Antiplatelet (NSTEMI/UA)",
    color:T.purple,
    steps:[
      "Aspirin 81 mg daily maintenance after loading dose",
      "P2Y12 inhibitor — withhold until coronary anatomy defined if CABG likely",
      "Ticagrelor 180 mg load → 90 mg BID (preferred — PLATO trial; caution with prior stroke)",
      "Clopidogrel 300–600 mg load → 75 mg daily (alternative if ticagrelor unavailable)",
      "Prasugrel 60 mg load → 10 mg daily — only post-PCI, avoid if prior stroke/TIA or age ≥ 75",
    ],
  },
  {
    title:"STEMI Pathway",
    color:T.red,
    steps:[
      "ACTIVATE CATH LAB — target door-to-balloon ≤ 90 min (PCI available) or ≤ 30 min for fibrinolysis",
      "Aspirin + P2Y12 inhibitor (ticagrelor or clopidogrel) as above",
      "UFH 70–100 units/kg IV bolus for primary PCI",
      "Tenecteplase (TNK): if PCI unavailable within 120 min — 0.5 mg/kg IV (max 50 mg) bolus",
      "TNK is non-inferior to alteplase per ASSENT-2 — preferred due to single-bolus dosing",
      "Transfer immediately if PCI unavailable — do not delay transfer for fibrinolysis if PCI accessible within 120 min",
    ],
  },
  {
    title:"Inferior MI / RV Infarct",
    color:T.gold,
    steps:[
      "RV infarct: STE in V4R — withhold nitrates and diuretics",
      "Volume expansion: 0.9% NS 500 mL over 15 min for RV infarct hypotension",
      "Avoid negative inotropes — no beta-blockers or CCBs acutely",
      "Temporary pacing for symptomatic bradycardia or complete heart block",
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// DISPOSITION MATRIX
// ═══════════════════════════════════════════════════════════════════════════
function dispositionRec(heartScore, tropInterp, edacsOk) {
  if (heartScore === null) return null;

  if (heartScore <= 3) {
    if (tropInterp === "normal" || tropInterp === null) {
      return {
        dispo:"Safe Discharge",
        color:T.teal,
        icon:"🏠",
        detail:"HEART ≤ 3 + negative troponin — 30-day MACE < 2%",
        plan:[
          "Discharge with close outpatient follow-up within 72 hours",
          "Stress test or coronary CTA within 2 weeks if intermediate pretest probability",
          "Strict return precautions — chest pain, dyspnea, diaphoresis, palpitations",
          "Aspirin 81 mg daily if no contraindication",
        ],
      };
    }
    if (tropInterp === "elevated") {
      return {
        dispo:"Observation",
        color:T.gold,
        icon:"👁",
        detail:"HEART ≤ 3 but troponin elevated — extended monitoring",
        plan:[
          "Admit to observation for serial troponin (0h/3h/6h)",
          "Repeat 12-lead EKG",
          "Cardiology consultation if troponin rising",
        ],
      };
    }
  }

  if (heartScore <= 6) {
    if (tropInterp === "acs") {
      return {
        dispo:"Admit — ACS",
        color:T.coral,
        icon:"🏥",
        detail:"HEART 4–6 + troponin rising — NSTEMI/UA protocol",
        plan:[
          "Admit to cardiology / telemetry",
          "ACS protocol: antiplatelet + anticoagulation",
          "Cardiology consult for timing of invasive strategy",
          "Echocardiogram if EF unknown",
        ],
      };
    }
    return {
      dispo:"Observation / Admission",
      color:T.gold,
      icon:"👁",
      detail:"HEART 4–6 — moderate risk, serial evaluation",
      plan:[
        "Observation or short-stay admission",
        "Serial troponin (0h/3h/6h) and repeat EKG",
        "Cardiology consultation",
        "Functional testing or coronary imaging if troponin negative",
      ],
    };
  }

  return {
    dispo:"Admit — High Risk",
    color:T.coral,
    icon:"🚨",
    detail:"HEART 7–10 — high risk, early invasive strategy",
    plan:[
      "Admit to cardiology / CCU",
      "ACS protocol: antiplatelet + anticoagulation immediately",
      "Early invasive strategy within 24h (ischemia-guided within 48h)",
      "Cardiology consult — bedside if hemodynamically unstable",
    ],
  };
}

// ── Reusable components ────────────────────────────────────────────────────

function TabBtn({ tab, active, onClick }) {
  return (
    <button onClick={onClick}
      style={{ display:"flex", alignItems:"center", gap:6,
        padding:"8px 14px", borderRadius:9, cursor:"pointer",
        transition:"all .15s",
        border:`1px solid ${active ? tab.color + "77" : "rgba(32,48,72,0.55)"}`,
        background:active
          ? `linear-gradient(135deg,${tab.color}18,${tab.color}06)`
          : "rgba(13,17,23,0.6)",
        color:active ? tab.color : T.txt4,
        fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:12 }}>
      <span style={{ fontSize:14 }}>{tab.icon}</span>
      <span>{tab.label}</span>
    </button>
  );
}

function ScoreOption({ item, val, selected, onSelect }) {
  const isSelected = selected === val;
  return (
    <button onClick={() => onSelect(val)}
      style={{ display:"flex", alignItems:"center", gap:10,
        width:"100%", padding:"8px 12px", borderRadius:8,
        cursor:"pointer", textAlign:"left", border:"none",
        transition:"all .12s",
        background:isSelected
          ? `linear-gradient(135deg,${item.color}18,${item.color}08)`
          : "rgba(13,17,23,0.7)",
        borderLeft:`3px solid ${isSelected ? item.color : "rgba(32,48,72,0.4)"}`,
        marginBottom:4 }}>
      <div style={{ width:24, height:24, borderRadius:"50%", flexShrink:0,
        display:"flex", alignItems:"center", justifyContent:"center",
        background:isSelected ? item.color : "rgba(32,56,96,0.4)",
        fontFamily:"'JetBrains Mono',monospace", fontWeight:900,
        fontSize:11, color:isSelected ? "#07090f" : T.txt4 }}>
        {val}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
          fontSize:12, color:isSelected ? item.color : T.txt2 }}>
          {HEART_ITEMS.find(i => i.key === item.key)
            ?.options.find(o => o.val === val)?.label}
        </div>
        {HEART_ITEMS.find(i => i.key === item.key)
          ?.options.find(o => o.val === val)?.sub && (
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
            color:T.txt4, marginTop:1 }}>
            {HEART_ITEMS.find(i => i.key === item.key)?.options.find(o => o.val === val)?.sub}
          </div>
        )}
      </div>
    </button>
  );
}

function InfoBox({ color, icon, title, children }) {
  return (
    <div style={{ padding:"10px 13px", borderRadius:9,
      background:`${color}08`,
      border:`1px solid ${color}30`,
      borderLeft:`3px solid ${color}` }}>
      {title && (
        <div style={{ fontFamily:"'JetBrains Mono',monospace",
          fontSize:8, color, letterSpacing:1.5,
          textTransform:"uppercase", marginBottom:6 }}>
          {icon && <span style={{ marginRight:5 }}>{icon}</span>}
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

function TroponinField({ label, value, onChange, uln, highlight }) {
  const v    = parseFloat(value);
  const over = !isNaN(v) && uln > 0 && v > uln;
  return (
    <div style={{ flex:1 }}>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
        color:T.txt4, letterSpacing:1.3, textTransform:"uppercase",
        marginBottom:4 }}>
        {label}
      </div>
      <input type="number" value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="0.00"
        style={{ width:"100%", padding:"9px 11px",
          background:"rgba(13,17,23,0.9)",
          border:`1px solid ${over ? T.coral + "88" : value ? T.blue + "55" : "rgba(32,56,96,0.4)"}`,
          borderRadius:8, outline:"none",
          fontFamily:"'JetBrains Mono',monospace", fontSize:20,
          fontWeight:700, color:over ? T.coral : T.blue }} />
      {over && (
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9,
          color:T.coral, marginTop:3 }}>
          {(v / uln).toFixed(1)}× ULN
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB PANELS
// ═══════════════════════════════════════════════════════════════════════════

function HeartTab({ scores, setScores }) {
  const total = Object.values(scores).reduce((s, v) => s + (v ?? 0), 0);
  const allSet = HEART_ITEMS.every(i => scores[i.key] !== undefined);
  const strata = allSet ? heartStrata(total) : null;

  return (
    <div className="cph-fade">
      <div style={{ display:"flex", alignItems:"center",
        justifyContent:"space-between", marginBottom:16,
        padding:"12px 16px", borderRadius:11,
        background:"rgba(13,17,23,0.9)",
        border:`1px solid ${strata ? strata.color + "55" : "rgba(32,56,96,0.4)"}` }}>
        <div>
          <div style={{ fontFamily:"'Playfair Display',serif",
            fontSize:13, fontWeight:700, color:T.txt3, marginBottom:2 }}>
            HEART Score
          </div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
            color:T.txt4, lineHeight:1.5 }}>
            {allSet ? strata.rec : "Select all 5 components to calculate"}
          </div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontFamily:"'Playfair Display',serif",
            fontSize:52, fontWeight:900, lineHeight:1,
            color:strata ? strata.color : T.txt4 }}>
            {total}
          </div>
          {strata && (
            <div style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:8, letterSpacing:1.5, textTransform:"uppercase",
              color:strata.color, marginTop:2 }}>
              {strata.label} · {strata.mace} 30d MACE
            </div>
          )}
        </div>
      </div>

      {HEART_ITEMS.map(item => (
        <div key={item.key} style={{ marginBottom:14 }}>
          <div style={{ display:"flex", alignItems:"center",
            justifyContent:"space-between", marginBottom:6 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:22, height:22, borderRadius:"50%",
                background:item.color,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontFamily:"'Playfair Display',serif",
                fontWeight:900, fontSize:10, color:"#07090f" }}>
                {item.key[0].toUpperCase()}
              </div>
              <span style={{ fontFamily:"'Playfair Display',serif",
                fontWeight:700, fontSize:13, color:item.color }}>
                {item.label}
              </span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:9, color:T.txt4 }}>{item.hint}</span>
              {scores[item.key] !== undefined && (
                <div style={{ width:22, height:22, borderRadius:"50%",
                  background:item.color,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontFamily:"'JetBrains Mono',monospace",
                  fontWeight:900, fontSize:11, color:"#07090f" }}>
                  {scores[item.key]}
                </div>
              )}
            </div>
          </div>
          {[0,1,2].map(val => (
            <ScoreOption key={val} item={item} val={val}
              selected={scores[item.key]}
              onSelect={v => setScores(p => ({ ...p, [item.key]:v }))} />
          ))}
        </div>
      ))}

      {Object.values(scores).some(v => v !== undefined) && (
        <button onClick={() => setScores({})}
          style={{ marginTop:6, fontFamily:"'DM Sans',sans-serif",
            fontSize:11, fontWeight:600, padding:"5px 14px", borderRadius:7,
            cursor:"pointer", border:"1px solid rgba(32,56,96,0.45)",
            background:"transparent", color:T.txt4 }}>
          ↺ Reset
        </button>
      )}
    </div>
  );
}

function TroponinTab() {
  const [t0,   setT0]   = useState("");
  const [t1,   setT1]   = useState("");
  const [t2,   setT2]   = useState("");
  const [uln,  setULN]  = useState("0.04");
  const [unit, setUnit] = useState("ng/mL");
  const [mode, setMode] = useState("conventional");

  const result  = useMemo(() => troponinResult(t0, t1, t2, uln), [t0, t1, t2, uln]);
  const hstResult = useMemo(() =>
    mode === "hst" ? evalHSTProtocol(t0, t1) : null,
    [mode, t0, t1]
  );

  return (
    <div className="cph-fade">
      <div style={{ display:"flex", gap:7, marginBottom:14 }}>
        {[
          { id:"conventional", label:"Conventional cTn" },
          { id:"hst",          label:"hs-cTnI (0/1h Protocol)" },
        ].map(m => (
          <button key={m.id} onClick={() => setMode(m.id)}
            style={{ flex:1, padding:"7px 0", borderRadius:8,
              cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
              fontWeight:600, fontSize:11, transition:"all .12s",
              border:`1px solid ${mode===m.id ? T.blue+"66" : "rgba(32,56,96,0.45)"}`,
              background:mode===m.id ? "rgba(77,166,255,0.1)" : "transparent",
              color:mode===m.id ? T.blue : T.txt4 }}>
            {m.label}
          </button>
        ))}
      </div>

      {mode === "conventional" ? (
        <>
          <div style={{ marginBottom:12 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.txt4, letterSpacing:1.3, textTransform:"uppercase",
              marginBottom:4 }}>
              Upper Limit of Normal (your lab)
            </div>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <input type="number" value={uln} onChange={e => setULN(e.target.value)}
                style={{ width:120, padding:"7px 11px",
                  background:"rgba(13,17,23,0.9)",
                  border:"1px solid rgba(77,166,255,0.3)",
                  borderRadius:7, outline:"none",
                  fontFamily:"'JetBrains Mono',monospace",
                  fontSize:14, fontWeight:700, color:T.blue }} />
              <div style={{ display:"flex", gap:5 }}>
                {TROPONIN_UNITS.map(u => (
                  <button key={u} onClick={() => setUnit(u)}
                    style={{ fontFamily:"'JetBrains Mono',monospace",
                      fontSize:8, padding:"3px 9px", borderRadius:5,
                      cursor:"pointer", letterSpacing:0.5,
                      border:`1px solid ${unit===u ? T.blue+"55" : "rgba(32,56,96,0.4)"}`,
                      background:unit===u ? "rgba(77,166,255,0.1)" : "transparent",
                      color:unit===u ? T.blue : T.txt4 }}>
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display:"flex", gap:10, marginBottom:12 }}>
            <TroponinField label="0h (Arrival)" value={t0}
              onChange={setT0} uln={parseFloat(uln)} />
            <TroponinField label="3h" value={t1}
              onChange={setT1} uln={parseFloat(uln)} />
            <TroponinField label="6h" value={t2}
              onChange={setT2} uln={parseFloat(uln)} />
          </div>

          {result && (
            <InfoBox
              color={result.interp === "acs" ? T.coral
                : result.interp === "elevated" ? T.gold : T.teal}
              icon={result.interp === "acs" ? "🚨"
                : result.interp === "elevated" ? "⚠" : "✓"}
              title={result.interp === "acs" ? "Significant Troponin Rise"
                : result.interp === "elevated" ? "Troponin Elevated"
                : "Troponin Normal"}>
              <div style={{ display:"grid",
                gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",
                gap:8 }}>
                {[
                  { label:"Peak",  val:result.peak?.toFixed(3) },
                  { label:"× ULN", val:result.fold?.toFixed(1) || "--" },
                  { label:"Δ 0→3h", val:result.delta ? result.delta + "%" : "--" },
                ].map(s => (
                  <div key={s.label} style={{ textAlign:"center" }}>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace",
                      fontSize:9, color:T.txt4, letterSpacing:1 }}>
                      {s.label}
                    </div>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace",
                      fontSize:20, fontWeight:700,
                      color:result.interp === "acs" ? T.coral
                        : result.interp === "elevated" ? T.gold : T.teal }}>
                      {s.val || "--"}
                    </div>
                  </div>
                ))}
              </div>
              {result.interp === "acs" && (
                <div style={{ marginTop:8, fontFamily:"'DM Sans',sans-serif",
                  fontSize:11, color:T.coral, lineHeight:1.55 }}>
                  Rising troponin pattern consistent with AMI — initiate ACS protocol and cardiology consult
                </div>
              )}
            </InfoBox>
          )}
        </>
      ) : (
        <>
          <InfoBox color={T.blue} title="ESC 0/1h Protocol — Elecsys hs-cTnI thresholds">
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
              color:T.txt3, lineHeight:1.65 }}>
              Rule-out: 0h &lt; 5 ng/L, or 0h &lt; 12 ng/L + Δ1h &lt; 3 ng/L
              {" | "}
              Rule-in: 0h ≥ 52 ng/L, or Δ1h ≥ 6 ng/L
            </div>
          </InfoBox>
          <div style={{ display:"flex", gap:10, margin:"12px 0" }}>
            <TroponinField label="0h hs-cTnI (ng/L)"
              value={t0} onChange={setT0} uln={52} />
            <TroponinField label="1h hs-cTnI (ng/L)"
              value={t1} onChange={setT1} uln={52} />
          </div>
          {hstResult && (
            <InfoBox color={hstResult.color}
              icon={hstResult.result === "rule_out" ? "✓"
                : hstResult.result === "rule_in" ? "🚨" : "⚠"}
              title={hstResult.label}>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
                color:T.txt2, lineHeight:1.65 }}>
                {hstResult.detail}
              </div>
            </InfoBox>
          )}
        </>
      )}
    </div>
  );
}

function EdacsTab() {
  const [fields, setFields] = useState({
    age:"", sex:"M", diaphoresis:false, radiation:false,
    inspiratory:false, palpation:false, knownCAD:false,
  });
  const [negTrop, setNegTrop] = useState(true);

  const setF = (k, v) => setFields(p => ({ ...p, [k]:v }));
  const age  = parseInt(fields.age) || 0;
  const score = age > 0 ? calcEDACS(fields) : null;
  const risk  = score !== null ? edacsRisk(score, negTrop) : null;

  return (
    <div className="cph-fade">
      <div style={{ marginBottom:12, padding:"10px 13px", borderRadius:9,
        background:"rgba(155,109,255,0.07)",
        border:"1px solid rgba(155,109,255,0.25)" }}>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
          color:T.txt3, lineHeight:1.6 }}>
          EDACS low-risk criteria: Score &lt; 16 + negative troponin = safe for early discharge.
          Validated in Flaws et al, <em>Heart</em> 2016 — 99.7% sensitivity for 30-day ACS.
        </div>
      </div>

      <div style={{ display:"flex", gap:10, marginBottom:12 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1.3, textTransform:"uppercase",
            marginBottom:4 }}>Age</div>
          <input type="number" value={fields.age}
            onChange={e => setF("age", e.target.value)}
            placeholder="years"
            style={{ width:"100%", padding:"9px 11px",
              background:"rgba(13,17,23,0.9)",
              border:`1px solid ${fields.age ? T.purple+"55" : "rgba(32,56,96,0.4)"}`,
              borderRadius:8, outline:"none",
              fontFamily:"'JetBrains Mono',monospace",
              fontSize:18, fontWeight:700, color:T.purple }} />
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1.3, textTransform:"uppercase",
            marginBottom:4 }}>Sex</div>
          <div style={{ display:"flex", gap:6 }}>
            {[["M","Male"],["F","Female"]].map(([v,l]) => (
              <button key={v} onClick={() => setF("sex", v)}
                style={{ flex:1, padding:"9px 0", borderRadius:8,
                  cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
                  fontWeight:600, fontSize:12,
                  border:`1px solid ${fields.sex===v ? T.purple+"66" : "rgba(32,56,96,0.45)"}`,
                  background:fields.sex===v ? "rgba(155,109,255,0.12)" : "transparent",
                  color:fields.sex===v ? T.purple : T.txt4 }}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {[
        { key:"diaphoresis", pts:3,  label:"Diaphoresis present" },
        { key:"radiation",   pts:5,  label:"Pain radiates to arm or shoulder" },
        { key:"inspiratory", pts:-4, label:"Pain is SOLELY pleuritic/inspiratory", invert:true },
        { key:"palpation",   pts:-6, label:"Pain REPRODUCED by palpation", invert:true },
        { key:"knownCAD",    pts:12, label:"Known CAD (prior MI, PCI, CABG)" },
      ].map(f => (
        <button key={f.key} onClick={() => setF(f.key, !fields[f.key])}
          style={{ display:"flex", alignItems:"center", gap:9,
            width:"100%", padding:"9px 12px", borderRadius:8,
            cursor:"pointer", textAlign:"left", border:"none",
            marginBottom:5, transition:"background .1s",
            background:fields[f.key]
              ? `${f.pts > 0 ? T.coral : T.teal}12`
              : "rgba(13,17,23,0.6)",
            borderLeft:`3px solid ${fields[f.key]
              ? (f.pts > 0 ? T.coral : T.teal) : "rgba(32,56,96,0.4)"}` }}>
          <div style={{ width:18, height:18, borderRadius:4, flexShrink:0,
            border:`2px solid ${fields[f.key]
              ? (f.pts > 0 ? T.coral : T.teal) : "rgba(42,79,122,0.5)"}`,
            background:fields[f.key]
              ? (f.pts > 0 ? T.coral : T.teal) : "transparent",
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            {fields[f.key] && (
              <span style={{ color:"#07090f", fontSize:9,
                fontWeight:900 }}>✓</span>
            )}
          </div>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
            color:T.txt2, flex:1 }}>{f.label}</span>
          <span style={{ fontFamily:"'JetBrains Mono',monospace",
            fontSize:9, fontWeight:700,
            color:f.pts > 0 ? T.coral : T.teal }}>
            {f.pts > 0 ? "+" : ""}{f.pts} pts
          </span>
        </button>
      ))}

      <button onClick={() => setNegTrop(p => !p)}
        style={{ display:"flex", alignItems:"center", gap:9,
          width:"100%", padding:"9px 12px", borderRadius:8,
          cursor:"pointer", textAlign:"left", border:"none",
          marginTop:8, transition:"background .1s",
          background:negTrop ? "rgba(0,212,180,0.1)" : "rgba(255,87,87,0.08)",
          borderLeft:`3px solid ${negTrop ? T.teal : T.coral}` }}>
        <div style={{ width:18, height:18, borderRadius:4, flexShrink:0,
          border:`2px solid ${negTrop ? T.teal : T.coral}`,
          background:negTrop ? T.teal : "transparent",
          display:"flex", alignItems:"center", justifyContent:"center" }}>
          {negTrop && <span style={{ color:"#07090f", fontSize:9, fontWeight:900 }}>✓</span>}
        </div>
        <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt2 }}>
          Serial troponin negative (required for low-risk pathway)
        </span>
      </button>

      {score !== null && risk && (
        <div style={{ marginTop:14, padding:"12px 14px", borderRadius:10,
          background:`${risk.color}09`,
          border:`1px solid ${risk.color}35` }}>
          <div style={{ display:"flex", alignItems:"center",
            justifyContent:"space-between", marginBottom:6 }}>
            <span style={{ fontFamily:"'Playfair Display',serif",
              fontWeight:700, fontSize:16, color:risk.color }}>
              {risk.label}
            </span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:36, fontWeight:900, color:risk.color }}>
              {score}
            </span>
          </div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
            color:T.txt3, lineHeight:1.6 }}>
            {risk.rec}
          </div>
        </div>
      )}
    </div>
  );
}

function ProtocolTab() {
  const [expanded, setExpanded] = useState(null);
  return (
    <div className="cph-fade">
      {ACS_STEPS.map((section, i) => (
        <div key={i} style={{ marginBottom:6, borderRadius:10,
          overflow:"hidden",
          border:`1px solid ${expanded===i ? section.color+"55" : "rgba(32,56,96,0.4)"}` }}>
          <button onClick={() => setExpanded(p => p===i ? null : i)}
            style={{ display:"flex", alignItems:"center",
              justifyContent:"space-between", width:"100%",
              padding:"10px 13px", cursor:"pointer",
              border:"none", textAlign:"left",
              background:`linear-gradient(135deg,${section.color}0c,rgba(13,17,23,0.96))` }}>
            <div style={{ display:"flex", alignItems:"center", gap:9 }}>
              <div style={{ width:8, height:8, borderRadius:"50%",
                background:section.color, flexShrink:0 }} />
              <span style={{ fontFamily:"'Playfair Display',serif",
                fontWeight:700, fontSize:13, color:section.color }}>
                {section.title}
              </span>
            </div>
            <span style={{ color:T.txt4, fontSize:10 }}>
              {expanded===i ? "▲" : "▼"}
            </span>
          </button>
          {expanded === i && (
            <div style={{ padding:"8px 13px 12px",
              borderTop:`1px solid ${section.color}22` }}>
              {section.steps.map((step, j) => (
                <div key={j} style={{ display:"flex", gap:8,
                  alignItems:"flex-start", marginBottom:7 }}>
                  <span style={{ color:section.color, fontSize:8,
                    marginTop:3, flexShrink:0 }}>▸</span>
                  <span style={{ fontFamily:"'DM Sans',sans-serif",
                    fontSize:11.5, color:T.txt2, lineHeight:1.6 }}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <InfoBox color={T.gold} icon="💎" title="Key Pearls">
        <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
          {[
            "Door-to-EKG < 10 min is a class I recommendation — wire this into your triage workflow",
            "TNK (tenecteplase) 0.25 mg/kg single bolus is now preferred over alteplase when PCI unavailable — ACEP 2024",
            "Ticagrelor preferred over clopidogrel (PLATO) — avoid if prior stroke/TIA",
            "Morphine associated with worse outcomes in NSTEMI — use cautiously",
            "Oxygen only if SpO2 < 90% — hyperoxia is harmful in normoxic ACS",
          ].map((p, i) => (
            <div key={i} style={{ display:"flex", gap:7,
              alignItems:"flex-start" }}>
              <span style={{ color:T.gold, fontSize:8,
                marginTop:3, flexShrink:0 }}>▸</span>
              <span style={{ fontFamily:"'DM Sans',sans-serif",
                fontSize:11, color:T.txt3, lineHeight:1.55 }}>
                {p}
              </span>
            </div>
          ))}
        </div>
      </InfoBox>
    </div>
  );
}

function DispoTab({ heartScore, tropInterp, edacsOk }) {
  const rec = useMemo(() =>
    dispositionRec(heartScore, tropInterp, edacsOk),
    [heartScore, tropInterp, edacsOk]
  );

  if (rec === null) {
    return (
      <div className="cph-fade" style={{ padding:"24px 0",
        textAlign:"center" }}>
        <div style={{ fontSize:32, marginBottom:12 }}>💓</div>
        <div style={{ fontFamily:"'DM Sans',sans-serif",
          fontSize:13, color:T.txt4, lineHeight:1.7 }}>
          Complete HEART Score and Troponin results to generate a
          disposition recommendation.
        </div>
      </div>
    );
  }

  return (
    <div className="cph-fade">
      <div style={{ padding:"16px", borderRadius:12, marginBottom:14,
        background:`${rec.color}0c`,
        border:`2px solid ${rec.color}55` }}>
        <div style={{ display:"flex", alignItems:"center",
          gap:12, marginBottom:10 }}>
          <span style={{ fontSize:32 }}>{rec.icon}</span>
          <div>
            <div style={{ fontFamily:"'Playfair Display',serif",
              fontWeight:900, fontSize:22, color:rec.color }}>
              {rec.dispo}
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",
              fontSize:11, color:T.txt3, marginTop:2 }}>
              {rec.detail}
            </div>
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
          {rec.plan.map((p, i) => (
            <div key={i} style={{ display:"flex", gap:8,
              alignItems:"flex-start" }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:9, color:rec.color, minWidth:18,
                marginTop:1, fontWeight:700 }}>
                {i+1}.
              </span>
              <span style={{ fontFamily:"'DM Sans',sans-serif",
                fontSize:12, color:T.txt2, lineHeight:1.6 }}>
                {p}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:"grid",
        gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
        {[
          { label:"HEART", val:heartScore !== null ? heartScore : "--", color:T.coral },
          { label:"Troponin", val:tropInterp || "unknown", color:T.blue },
          { label:"Strata", val:heartScore !== null ? heartStrata(heartScore).label : "--", color:rec.color },
        ].map(s => (
          <div key={s.label} style={{ padding:"10px", borderRadius:9,
            textAlign:"center",
            background:"rgba(13,17,23,0.8)",
            border:"1px solid rgba(32,56,96,0.4)" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:7, color:T.txt4, letterSpacing:1,
              textTransform:"uppercase", marginBottom:4 }}>
              {s.label}
            </div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:16, fontWeight:700, color:s.color }}>
              {s.val}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════
export default function ChestPainHub({ embedded = false }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState("heart");

  const [heartScores, setHeartScores] = useState({});
  const [tropInterp,  setTropInterp]  = useState(null);

  const heartTotal = useMemo(() => {
    const vals = HEART_ITEMS.map(i => heartScores[i.key]);
    if (vals.some(v => v === undefined)) return null;
    return vals.reduce((s, v) => s + v, 0);
  }, [heartScores]);

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif",
      background: embedded ? "transparent" : T.bg,
      minHeight:  embedded ? "auto" : "100vh",
      color:T.txt }}>
      <div style={{ maxWidth:900, margin:"0 auto",
        padding: embedded ? "0" : "0 16px" }}>

        {!embedded && (
          <div style={{ padding:"18px 0 14px" }}>
            <button onClick={() => navigate("/hub")}
              style={{ marginBottom:10,
                display:"inline-flex", alignItems:"center", gap:7,
                fontFamily:"'DM Sans',sans-serif", fontSize:12,
                fontWeight:600, padding:"5px 14px", borderRadius:8,
                background:"rgba(22,32,48,0.7)",
                border:"1px solid rgba(32,56,96,0.5)",
                color:T.txt3, cursor:"pointer" }}>
              ← Back to Hub
            </button>
            <div style={{ display:"flex", alignItems:"center",
              gap:10, marginBottom:8 }}>
              <div style={{ background:"rgba(7,9,15,0.9)",
                border:"1px solid rgba(32,56,96,0.6)",
                borderRadius:10, padding:"5px 12px",
                display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:10, color:T.purple, letterSpacing:3 }}>NOTRYA</span>
                <span style={{ color:T.txt4, fontFamily:"'JetBrains Mono',monospace",
                  fontSize:10 }}>/</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:10, color:T.txt3, letterSpacing:2 }}>CHEST PAIN</span>
              </div>
              <div style={{ height:1, flex:1,
                background:"linear-gradient(90deg,rgba(255,107,53,0.5),transparent)" }} />
            </div>
            <h1 className="shimmer-cph"
              style={{ fontFamily:"'Playfair Display',serif",
                fontSize:"clamp(22px,4vw,38px)",
                fontWeight:900, letterSpacing:-0.5, lineHeight:1.1 }}>
              Chest Pain Hub
            </h1>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
              color:T.txt4, marginTop:4 }}>
              HEART Score · Serial Troponin · EDACS · ACS Protocol · Disposition Matrix
              · ACC/AHA 2021 · ACEP 2024
            </p>
          </div>
        )}

        <div style={{ display:"flex", gap:5, flexWrap:"wrap",
          padding:"6px", marginBottom:14,
          background:"rgba(13,17,23,0.8)",
          border:"1px solid rgba(32,56,96,0.4)",
          borderRadius:12 }}>
          {TABS.map(t => (
            <TabBtn key={t.id} tab={t} active={tab===t.id}
              onClick={() => setTab(t.id)} />
          ))}
        </div>

        <div>
          {tab === "heart"    && <HeartTab scores={heartScores} setScores={setHeartScores} />}
          {tab === "troponin" && <TroponinTab />}
          {tab === "edacs"    && <EdacsTab />}
          {tab === "protocol" && <ProtocolTab />}
          {tab === "dispo"    && (
            <DispoTab heartScore={heartTotal} tropInterp={tropInterp} />
          )}
        </div>

        {!embedded && (
          <div style={{ textAlign:"center", padding:"24px 0 16px",
            fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1.5 }}>
            NOTRYA CHEST PAIN HUB · CLINICAL DECISION SUPPORT ONLY
            · HEART SCORE (BACKUS 2010) · ESC 0/1H PROTOCOL · EDACS (FLAWS 2016)
            · ACC/AHA 2021 · ACEP 2024
          </div>
        )}
      </div>
    </div>
  );
}