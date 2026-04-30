// ChestPainHub.jsx
// Integrated Chest Pain Evaluation Hub
// HEART Score · Serial Troponin Tracker · EDACS · Differentials (PE/Dissection/Pericarditis)
// ACS Protocol · Disposition Matrix with copy-to-chart
//
// Clinical basis:
//   - HEART Score (Backus 2010), ESC 0/1h hs-cTnI (2020)
//   - EDACS (Flaws 2016), Wells PE (Wells 2000), PERC (Kline 2004)
//   - ADD-RS (Rogers 2011), ACC/AHA 2021, ACEP 2024
//
// Constraints: no form, no localStorage, straight quotes only,
//   single react import, border before borderTop/etc.

import { useState, useMemo, useCallback, useEffect } from "react";

if (typeof document !== "undefined") {
  if (!document.getElementById("cph-fonts")) {
    const l = document.createElement("link");
    l.id = "cph-fonts"; l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
    document.head.appendChild(l);
    const s = document.createElement("style"); s.id = "cph-css";
    s.textContent = `
      @keyframes cph-fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
      .cph-fade{animation:cph-fade .2s ease forwards}
      @keyframes shimmer-cph{0%{background-position:-200% center}100%{background-position:200% center}}
      .shimmer-cph{background:linear-gradient(90deg,#e8f0fe 0%,#ff9f43 40%,#ff6b6b 65%,#e8f0fe 100%);
        background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;
        background-clip:text;animation:shimmer-cph 4s linear infinite;}
    `;
    document.head.appendChild(s);
  }
}

const T = {
  bg:"#050f1e", txt:"#e8f0fe", txt2:"#8aaccc", txt3:"#4a6a8a", txt4:"#2e4a6a",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0", red:"#ff4444",
};
const FF = { mono:"'JetBrains Mono',monospace", sans:"'DM Sans',sans-serif", serif:"'Playfair Display',serif" };

const TABS = [
  { id:"heart",    label:"HEART",    icon:"💓", color:T.coral  },
  { id:"troponin", label:"Troponin", icon:"🔬", color:T.blue   },
  { id:"edacs",    label:"EDACS",    icon:"🧮", color:T.purple },
  { id:"ddx",      label:"DDx",      icon:"🔍", color:T.orange },
  { id:"protocol", label:"Protocol", icon:"⚡",    color:T.gold   },
  { id:"dispo",    label:"Dispo",    icon:"🚪", color:T.teal   },
];

// ═══ HEART SCORE ═══════════════════════════════════════
const HEART_ITEMS = [
  { key:"history", label:"History", color:T.coral, hint:"Suspicion for ACS", options:[
      { val:0, label:"Slightly suspicious",   sub:"Non-specific history, atypical features" },
      { val:1, label:"Moderately suspicious", sub:"Combination of typical and atypical" },
      { val:2, label:"Highly suspicious",     sub:"Typical crushing/pressure, radiation, diaphoresis" },
    ] },
  { key:"ecg", label:"ECG", color:T.blue, hint:"Most recent 12-lead", options:[
      { val:0, label:"Normal",                               sub:"No ST changes, no LBBB, no LVH" },
      { val:1, label:"Non-specific repolarization disturbance", sub:"LBBB, LVH, repolarization changes" },
      { val:2, label:"Significant ST deviation",             sub:"ST depression/elevation, new LBBB" },
    ] },
  { key:"age", label:"Age", color:T.purple, hint:"Age at presentation", options:[
      { val:0, label:"< 45 years",       sub:"" },
      { val:1, label:"45 – 64 years", sub:"" },
      { val:2, label:"≥ 65 years",   sub:"" },
    ] },
  { key:"risk", label:"Risk Factors", color:T.orange, hint:"Known CAD risk factors", options:[
      { val:0, label:"No known risk factors",              sub:"No DM, HTN, hypercholesterolemia, obesity, smoking, family Hx" },
      { val:1, label:"1–2 risk factors",              sub:"OR history of atherosclerotic disease" },
      { val:2, label:"≥ 3 risk factors or hx of CAD", sub:"Prior MI, PCI, CABG, angina" },
    ] },
  { key:"troponin_h", label:"Troponin", color:T.gold, hint:"Relative to ULN", options:[
      { val:0, label:"≤ Normal limit",     sub:"Within the normal reference range" },
      { val:1, label:"1–3× normal",   sub:"Mildly elevated" },
      { val:2, label:"> 3× normal",        sub:"Markedly elevated" },
    ] },
];

function heartStrata(score) {
  if (score <= 3) return { label:"Low Risk",      color:T.teal,  mace:"0.9–1.7%", rec:"Consider early discharge with outpatient follow-up" };
  if (score <= 6) return { label:"Moderate Risk", color:T.gold,  mace:"12–16.6%", rec:"Serial troponin, admission or observation for further evaluation" };
  return               { label:"High Risk",      color:T.coral, mace:"50–65%",   rec:"Cardiology consult, admit, likely invasive strategy" };
}

// ═══ TROPONIN ═════════════════════════════════════════════════
const TROPONIN_UNITS = ["ng/mL", "ng/L (hs-cTnI)", "µg/L"];
const HST = { ruleOut_0h:5, ruleIn_0h:52, ruleOut_delta:3, ruleIn_delta:6 };

function evalHST(t0, t1) {
  if (!t0 && t0 !== 0) return null;
  const v0 = parseFloat(t0);
  if (isNaN(v0)) return null;
  if (v0 < HST.ruleOut_0h)  return { result:"rule_out", label:"Rule-Out", color:T.teal,
    detail:`hs-cTnI ${v0} ng/L < 5 ng/L — very low probability of AMI` };
  if (v0 >= HST.ruleIn_0h)  return { result:"rule_in", label:"Rule-In", color:T.coral,
    detail:`hs-cTnI ${v0} ng/L ≥ 52 ng/L — high probability of AMI` };
  if (!t1 && t1 !== 0)       return { result:"observe", label:"Observe", color:T.gold,
    detail:`hs-cTnI ${v0} ng/L — intermediate zone, 1h sample required` };
  const v1 = parseFloat(t1);
  if (isNaN(v1)) return null;
  const d = Math.abs(v1 - v0);
  if (d < HST.ruleOut_delta && v1 < HST.ruleIn_0h) return { result:"rule_out", label:"Rule-Out (0/1h)", color:T.teal,
    detail:`0h ${v0} → 1h ${v1} ng/L | Δ ${d.toFixed(1)} < 3 ng/L — AMI ruled out` };
  if (d >= HST.ruleIn_delta || v1 >= HST.ruleIn_0h) return { result:"rule_in", label:"Rule-In (0/1h)", color:T.coral,
    detail:`0h ${v0} → 1h ${v1} ng/L | Δ ${d.toFixed(1)} ≥ 6 ng/L — AMI likely` };
  return { result:"observe", label:"Observe", color:T.gold,
    detail:`0h ${v0} → 1h ${v1} ng/L | Δ ${d.toFixed(1)} — intermediate, continue monitoring` };
}

function calcTrop(t0, t1, t2, ulnInput) {
  const uln = parseFloat(ulnInput) || 0.04;
  const v0 = parseFloat(t0), v1 = parseFloat(t1), v2 = parseFloat(t2);
  if (isNaN(v0)) return null;
  const peak  = Math.max(...[v0,v1,v2].filter(v => !isNaN(v)));
  const fold  = uln > 0 ? peak / uln : null;
  const delta = !isNaN(v1) ? ((v1 - v0) / Math.max(v0, 0.001) * 100).toFixed(0) : null;
  let interp  = "normal";
  if (fold !== null && fold > 1) {
    const deltaSig = delta !== null && Math.abs(parseFloat(delta)) >= 20;
    interp = (fold > 3 || deltaSig) ? "acs" : "elevated";
  }
  // trend arrow: compare v1 to v0
  let trend = null;
  if (!isNaN(v1)) {
    const pct = (v1 - v0) / Math.max(v0, 0.001);
    if (pct >= 0.2)       trend = { arrow:"↑↑", label:"Rising rapidly", color:T.coral };
    else if (pct >= 0.05) trend = { arrow:"↑",   label:"Rising", color:T.orange };
    else if (pct <= -0.2) trend = { arrow:"↓↓", label:"Falling rapidly", color:T.teal };
    else if (pct <= -0.05)trend = { arrow:"↓",   label:"Falling", color:T.teal };
    else                  trend = { arrow:"→",   label:"Stable", color:T.blue };
  }
  return { v0, v1, v2, peak, fold, delta, interp, uln, trend };
}

// ═══ EDACS ════════════════════════════════════════════════════
function calcEDACS(fields) {
  let s = 0;
  const { age, sex, diaphoresis, radiation, inspiratory, palpation, knownCAD } = fields;
  const a = parseInt(age) || 0;
  if (sex === "M") {
    if (a>=18&&a<=45) s+=2; else if(a<=50) s+=4; else if(a<=55) s+=6;
    else if(a<=60) s+=8; else if(a<=65) s+=10; else if(a<=70) s+=12;
    else if(a<=75) s+=14; else s+=16;
  } else {
    if(a>=18&&a<=45) s-=6; else if(a<=50) s-=4; else if(a<=55) s-=2;
    else if(a<=60) s+=0;  else if(a<=65) s+=3;  else if(a<=70) s+=5;
    else if(a<=75) s+=8;  else s+=11;
  }
  if (diaphoresis)  s += 3; if (radiation)   s += 5;
  if (!inspiratory) s += 4; if (!palpation)   s += 6;
  if (knownCAD)     s += 12;
  return s;
}

function edacsRisk(score, negTrop) {
  if (score < 16 && negTrop) return { label:"Low Risk", color:T.teal,
    rec:"EDACS < 16 with negative troponin — safe for early discharge protocol" };
  return { label:"Not Low Risk", color:T.coral, rec:"EDACS ≥ 16 or positive troponin — standard evaluation pathway" };
}

// ═══ WELLS PE + PERC ═══════════════════════════════════════════
const WELLS_ITEMS = [
  { key:"dvt_signs",  pts:3,   label:"Clinical signs/symptoms of DVT" },
  { key:"pe_likely",  pts:3,   label:"PE is #1 diagnosis or equally likely as alternative" },
  { key:"hr_gt100",   pts:1.5, label:"Heart rate > 100 bpm" },
  { key:"immobil",    pts:1.5, label:"Immobilization ≥ 3 days or surgery in past 4 weeks" },
  { key:"prior_pe",   pts:1.5, label:"Prior DVT or PE" },
  { key:"hemoptysis", pts:1,   label:"Hemoptysis" },
  { key:"malignancy", pts:1,   label:"Malignancy (active or treated within 6 months)" },
];

const PERC_ITEMS = [
  { key:"age_lt50",    label:"Age < 50" },
  { key:"hr_lt100",    label:"HR < 100 bpm" },
  { key:"spo2_ok",     label:"SpO2 ≥ 95% on room air" },
  { key:"no_prior",    label:"No prior DVT/PE" },
  { key:"no_surg",     label:"No surgery/trauma within 4 weeks" },
  { key:"no_hemopt",   label:"No hemoptysis" },
  { key:"no_estrogen", label:"No exogenous estrogen" },
  { key:"no_leg",      label:"No unilateral leg swelling" },
];

function wellsInterp(score) {
  if (score <= 1) return { label:"Low Probability", color:T.teal,
    sub:"Apply PERC rule. If all 8 PERC criteria met — PE excluded without further workup.", action:"PERC Rule" };
  if (score <= 6) return { label:"Moderate Probability", color:T.gold,
    sub:"D-dimer. If positive — CTPA. If negative — PE excluded.", action:"D-Dimer" };
  return           { label:"High Probability", color:T.coral,
    sub:"Proceed directly to CTPA. D-dimer not useful at high pre-test probability.", action:"CTPA" };
}

// ═══ ADD-RS ══════════════════════════════════════════════════════════
const ADDRS_ITEMS = [
  { key:"condition", label:"High-risk condition",
    sub:"Marfan/connective tissue disease, family Hx aortic disease, known aortic valve disease, recent aortic manipulation, known thoracic aortic aneurysm" },
  { key:"pain_feat", label:"High-risk pain features",
    sub:"Abrupt onset, severe intensity, ripping or tearing quality" },
  { key:"exam_feat", label:"High-risk exam features",
    sub:"Pulse deficit or SBP differential >20 mmHg, focal neuro deficit + pain, aortic regurgitation murmur (new)" },
];

function addrsInterp(score) {
  if (score === 0) return { label:"Low Risk", color:T.teal,
    rec:"ADD-RS 0 — D-dimer (>500 ng/mL) if clinical suspicion warrants. CXR + ECG to exclude other causes." };
  if (score === 1) return { label:"Intermediate Risk", color:T.gold,
    rec:"ADD-RS 1 — CT Aortogram (chest/abdomen/pelvis, arterial phase) or TEE. Do not delay imaging if hemodynamically unstable. Order as ‘CTA aorta’ not generic CT chest." };
  return           { label:"High Risk", color:T.coral,
    rec:"ADD-RS 2–3 — Emergent CT Aortogram or TEE. IV access ×2, type & screen, cardiac surgery notification. Avoid anticoagulation/thrombolytics until dissection excluded. Order specifically as ‘CT Aortogram’ (arterial phase, chest + abdomen + pelvis)." };
}

// ═══ ACS PROTOCOL ═══════════════════════════════════════════════════
const ACS_STEPS = [
  { title:"Immediate", color:T.coral, steps:[
    "IV access ×2 · Cardiac monitor · 12-lead EKG within 10 minutes",
    "Aspirin 325 mg PO (chew) — unless allergy or active bleeding",
    "12-lead EKG: STEMI? → activate cath lab immediately",
    "Point-of-care troponin + BMP + CBC + coagulation",
    "Oxygen if SpO2 < 90% — avoid routine O₂ in normoxic patients",
  ]},
  { title:"Anti-ischemic", color:T.orange, steps:[
    "Nitroglycerin 0.4 mg SL q5 min ×3 (hold if SBP < 90 or RV infarct suspected)",
    "Morphine 2–4 mg IV for refractory pain — use cautiously (↑ mortality in NSTEMI)",
    "Metoprolol 25–50 mg PO if HR > 60, no HF, no bronchospasm, no cardiogenic shock",
    "Avoid NSAIDs — increase risk of death, reinfarction, and rupture",
  ]},
  { title:"Anticoagulation (NSTEMI/UA)", color:T.blue, steps:[
    "UFH: 60 units/kg IV bolus (max 4,000 units) → 12 units/kg/hr (max 1,000 units/hr)",
    "Enoxaparin: 1 mg/kg SQ q12h (reduce to q24h if CrCl < 30)",
    "Fondaparinux 2.5 mg SQ daily — preferred if bleeding risk high",
    "Bivalirudin: 0.75 mg/kg bolus → 1.75 mg/kg/hr (PCI setting)",
  ]},
  { title:"Antiplatelet (NSTEMI/UA)", color:T.purple, steps:[
    "Aspirin 81 mg daily maintenance after loading dose",
    "P2Y12 inhibitor — withhold until coronary anatomy defined if CABG likely",
    "Ticagrelor 180 mg load → 90 mg BID (preferred — PLATO; caution prior stroke)",
    "Clopidogrel 300–600 mg load → 75 mg daily (alternative)",
    "Prasugrel 60 mg load → 10 mg daily — post-PCI only, avoid if stroke/TIA or age ≥ 75",
  ]},
  { title:"STEMI Pathway", color:T.red, steps:[
    "ACTIVATE CATH LAB — door-to-balloon ≤ 90 min or fibrinolysis ≤ 30 min",
    "Aspirin + P2Y12 inhibitor (ticagrelor or clopidogrel)",
    "UFH 70–100 units/kg IV bolus for primary PCI",
    "TNK (tenecteplase): if PCI unavailable within 120 min — 0.5 mg/kg IV bolus (max 50 mg)",
    "TNK preferred over alteplase (ASSENT-2) — single-bolus dosing",
    "STEMI equivalents: posterior MI (STD V1–V3), de Winter T-waves, Wellens, hyperacute T",
  ]},
  { title:"Inferior MI / RV Infarct", color:T.gold, steps:[
    "RV infarct: STE in V4R — withhold nitrates and diuretics",
    "Volume expansion: NS 500 mL over 15 min for hypotension",
    "Avoid negative inotropes — no beta-blockers or CCBs acutely",
    "Temporary pacing for symptomatic bradycardia or complete heart block",
  ]},
];

// ═══ DISPOSITION (fixed: null tropInterp = not entered, not normal) ══════════════════
function dispositionRec(heartScore, tropInterp) {
  if (heartScore === null || tropInterp === null) return null;
  if (heartScore <= 3) {
    if (tropInterp === "normal")
      return { dispo:"Safe Discharge", color:T.teal, icon:"🏠",
        detail:"HEART ≤ 3 + negative troponin — 30-day MACE < 2%",
        plan:["Discharge with close outpatient follow-up within 72 hours",
          "Stress test or coronary CTA within 2 weeks if intermediate pretest probability",
          "Return precautions: chest pain, dyspnea, diaphoresis, palpitations, syncope",
          "Aspirin 81 mg daily if no contraindication"] };
    if (tropInterp === "elevated")
      return { dispo:"Observation", color:T.gold, icon:"👁",
        detail:"HEART ≤ 3 but troponin elevated — extended monitoring",
        plan:["Admit to observation for serial troponin (0h/3h/6h)",
          "Repeat 12-lead EKG in 1–2 hours",
          "Cardiology consultation if troponin rising or clinical deterioration"] };
    if (tropInterp === "acs")
      return { dispo:"Admit — ACS", color:T.coral, icon:"🏥",
        detail:"HEART ≤ 3 but troponin rising — troponin overrides low HEART",
        plan:["Admit to cardiology / telemetry despite low HEART score",
          "ACS protocol: antiplatelet + anticoagulation",
          "Cardiology consult — rising troponin is the operative finding"] };
  }
  if (heartScore <= 6) {
    if (tropInterp === "acs")
      return { dispo:"Admit — ACS", color:T.coral, icon:"🏥", detail:"HEART 4–6 + troponin rising — NSTEMI/UA protocol",
        plan:["Admit to cardiology / telemetry",
          "ACS protocol: antiplatelet + anticoagulation",
          "Cardiology consult for timing of invasive strategy",
          "Echocardiogram if EF unknown"] };
    return { dispo:"Observation / Admission", color:T.gold, icon:"👁",
      detail:"HEART 4–6 — moderate risk, serial evaluation", plan:["Observation or short-stay admission",
        "Serial troponin (0h/3h/6h) and repeat EKG",
        "Cardiology consultation",
        "Functional testing or coronary imaging if troponin negative"] };
  }
  return { dispo:"Admit — High Risk", color:T.coral, icon:"🚨", detail:"HEART 7–10 — high risk, early invasive strategy",
    plan:["Admit to cardiology / CCU",
      "ACS protocol: antiplatelet + anticoagulation immediately",
      "Early invasive strategy within 24h (ischemia-guided within 48h)",
      "Cardiology consult — bedside if hemodynamically unstable"] };
}

// ═══ REUSABLE COMPONENTS ═════════════════════════════════════════════════════════
function TabBtn({ tab, active, onClick }) {
  return (
    <button onClick={onClick}
      style={{ display:"flex", alignItems:"center", gap:5,
        padding:"7px 11px", borderRadius:9, cursor:"pointer", transition:"all .15s",
        border:`1px solid ${active ? tab.color+"77" : "rgba(26,53,85,0.7)"}`,
        background:active ? `linear-gradient(135deg,${tab.color}18,${tab.color}06)` : "rgba(5,15,30,0.6)",
        color:active ? tab.color : T.txt4, fontFamily:FF.sans, fontWeight:600, fontSize:11.5 }}>
      <span style={{ fontSize:13 }}>{tab.icon}</span>
      <span>{tab.label}</span>
    </button>
  );
}

function ScoreOption({ item, val, selected, onSelect }) {
  const isSelected = selected === val;
  const opt = item.options.find(o => o.val === val);
  return (
    <button onClick={() => onSelect(val)}
      style={{ display:"flex", alignItems:"center", gap:10, width:"100%", padding:"8px 12px", borderRadius:8,
        cursor:"pointer", textAlign:"left", border:`1px solid ${isSelected ? item.color+"55" : "rgba(26,53,85,0.6)"}`,
        transition:"all .12s", marginBottom:4,
        background:isSelected ? `linear-gradient(135deg,${item.color}18,${item.color}08)` : "rgba(5,13,32,0.7)",
        borderLeft:`3px solid ${isSelected ? item.color : "rgba(26,53,85,0.5)"}` }}>
      <div style={{ width:24, height:24, borderRadius:"50%", flexShrink:0,
        display:"flex", alignItems:"center", justifyContent:"center",
        background:isSelected ? item.color : "rgba(14,36,70,0.6)", fontFamily:FF.mono, fontWeight:900,
        fontSize:11, color:isSelected ? "#050f1e" : T.txt4 }}>
        {val}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontFamily:FF.sans, fontWeight:600, fontSize:12, color:isSelected ? item.color : T.txt2 }}>
          {opt?.label}
        </div>
        {opt?.sub && <div style={{ fontFamily:FF.sans, fontSize:10,
          color:T.txt4, marginTop:1 }}>{opt.sub}</div>}
      </div>
    </button>
  );
}

function InfoBox({ color, icon, title, children }) {
  return (
    <div style={{ padding:"10px 13px", borderRadius:9, marginBottom:8,
      background:`${color}0a`, border:`1px solid ${color}33`, borderLeft:`3px solid ${color}` }}>
      {title && (
        <div style={{ fontFamily:FF.mono, fontSize:8, color,
          letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>
          {icon && <span style={{ marginRight:5 }}>{icon}</span>}{title}
        </div>
      )}
      {children}
    </div>
  );
}

function CheckRow({ label, sub, checked, onChange, pts, color }) {
  const c = color || (pts !== undefined && pts > 0 ? T.coral : T.teal);
  return (
    <button onClick={onChange}
      style={{ display:"flex", alignItems:"center", gap:9, width:"100%",
        padding:"9px 12px", borderRadius:8, cursor:"pointer", textAlign:"left",
        marginBottom:5, transition:"background .1s", border:`1px solid ${checked ? c+"55" : "rgba(26,53,85,0.55)"}`,
        background:checked ? `${c}10` : "rgba(5,13,32,0.65)",
        borderLeft:`3px solid ${checked ? c : "rgba(26,53,85,0.5)"}` }}>
      <div style={{ width:18, height:18, borderRadius:4, flexShrink:0,
        border:`2px solid ${checked ? c : "rgba(42,79,122,0.55)"}`, background:checked ? c : "transparent",
        display:"flex", alignItems:"center", justifyContent:"center" }}>
        {checked && <span style={{ color:"#050f1e", fontSize:9, fontWeight:900 }}>✓</span>}
      </div>
      <div style={{ flex:1 }}>
        <span style={{ fontFamily:FF.sans, fontSize:12, color:T.txt2 }}>{label}</span>
        {sub && <div style={{ fontFamily:FF.sans, fontSize:9.5, color:T.txt4, marginTop:2, lineHeight:1.4 }}>{sub}</div>}
      </div>
      {pts !== undefined && (
        <span style={{ fontFamily:FF.mono, fontSize:9, fontWeight:700,
          color:pts > 0 ? T.coral : T.teal, flexShrink:0 }}>
          {pts > 0 ? "+" : ""}{pts} pts
        </span>
      )}
    </button>
  );
}

function TroponinField({ label, value, onChange, uln }) {
  const v = parseFloat(value), over = !isNaN(v) && uln > 0 && v > uln;
  return (
    <div style={{ flex:1 }}>
      <div style={{ fontFamily:FF.mono, fontSize:8, color:T.txt4,
        letterSpacing:1.3, textTransform:"uppercase", marginBottom:4 }}>{label}</div>
      <input type="number" value={value} onChange={e => onChange(e.target.value)} placeholder="0.00"
        style={{ width:"100%", padding:"9px 11px", background:"rgba(5,13,32,0.9)",
          border:`1px solid ${over ? T.coral+"88" : value ? T.blue+"55" : "rgba(26,53,85,0.5)"}`,
          borderRadius:8, outline:"none", fontFamily:FF.mono,
          fontSize:20, fontWeight:700, color:over ? T.coral : T.blue }} />
      {over && <div style={{ fontFamily:FF.sans, fontSize:9, color:T.coral, marginTop:3 }}>{(v/uln).toFixed(1)}× ULN</div>}
    </div>
  );
}

// ═══ SUMMARY STRIP ════════════════════════════════════════════════════════
function SummaryStrip({ heartScore, tropInterp, edacsScore, edacsNegTrop }) {
  const hs = heartScore !== null ? heartStrata(heartScore) : null;
  const er = edacsScore !== null ? edacsRisk(edacsScore, edacsNegTrop) : null;
  const tropColor = tropInterp === "acs" ? T.coral : tropInterp === "elevated" ? T.gold : tropInterp === "normal" ? T.teal : T.txt4;
  const hasAny = heartScore !== null || tropInterp || edacsScore !== null;
  if (!hasAny) return null;
  return (
    <div style={{ display:"flex", gap:6, marginBottom:12, padding:"8px 10px",
      borderRadius:9, background:"rgba(5,13,32,0.85)", border:"1px solid rgba(26,53,85,0.6)" }}>
      {[
        { label:"HEART", val:heartScore !== null ? heartScore : "--", color:hs ? hs.color : T.txt4, sub:hs ? hs.label : "incomplete" },
        { label:"Troponin", val:tropInterp || "--", color:tropColor, sub:tropInterp ? "" : "not entered" },
        { label:"EDACS", val:edacsScore !== null ? edacsScore : "--", color:er ? er.color : T.txt4, sub:er ? er.label : "incomplete" },
      ].map(it => (
        <div key={it.label} style={{ flex:1, textAlign:"center", padding:"4px 0" }}>
          <div style={{ fontFamily:FF.mono, fontSize:7, color:T.txt4,
            letterSpacing:1, textTransform:"uppercase", marginBottom:2 }}>{it.label}</div>
          <div style={{ fontFamily:FF.mono, fontSize:17, fontWeight:700, color:it.color, lineHeight:1 }}>{it.val}</div>
          {it.sub && <div style={{ fontFamily:FF.sans, fontSize:8.5, color:T.txt4, marginTop:2 }}>{it.sub}</div>}
        </div>
      ))}
    </div>
  );
}

// ═══ MICRO COMPONENTS ════════════════════════════════════════════════════════
// Bul: bullet point row used throughout DDx / Protocol
function Bul({ c, children }) {
  return (
    <div style={{ display:"flex", gap:7, alignItems:"flex-start", marginBottom:5 }}>
      <span style={{ color:c||T.txt3, fontSize:8, marginTop:3, flexShrink:0 }}>▸</span>
      <span style={{ fontFamily:FF.sans, fontSize:11, color:T.txt2, lineHeight:1.55 }}>{children}</span>
    </div>
  );
}
// NavBtn: guided workflow navigation button
function NavBtn({ active, c, onClick, children, compact }) {
  return (
    <button onClick={onClick}
      style={{ flex:compact?"0 0 100px":1, minHeight:52, borderRadius:11,
        cursor:active?"pointer":"default", fontFamily:FF.sans, fontWeight:700, fontSize:14,
        border:`1.5px solid ${active?(c||T.blue)+"77":"rgba(26,53,85,0.4)"}`,
        background:active?`linear-gradient(135deg,${c||T.blue}22,${c||T.blue}08)`:"rgba(5,13,32,0.5)",
        color:active?(c||T.blue):T.txt4, transition:"all .15s" }}>
      {children}
    </button>
  );
}
// SkipBtn: small secondary skip button in guided workflow
function SkipBtn({ onClick, children }) {
  return (
    <button onClick={onClick}
      style={{ width:"100%", marginTop:8, minHeight:40, borderRadius:8, cursor:"pointer",
        fontFamily:FF.sans, fontWeight:500, fontSize:11,
        border:"1px solid rgba(26,53,85,0.4)", background:"transparent", color:T.txt4 }}>
      {children}
    </button>
  );
}
// ═══ HEART TAB ═══════════════════════════════════════════════════════════
function HeartTab({ scores, setScores, tropInterp }) {
  const total  = Object.values(scores).reduce((s, v) => s + (v ?? 0), 0);
  const allSet = HEART_ITEMS.every(i => scores[i.key] !== undefined);
  const strata = allSet ? heartStrata(total) : null;

  // Suggested troponin_h value from actual troponin result
  const suggestedTropH = tropInterp === "acs" ? 2 : tropInterp === "elevated" ? 1 : tropInterp === "normal" ? 0 : null;

  return (
    <div className="cph-fade">
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
        marginBottom:16, padding:"12px 16px", borderRadius:11, background:"rgba(5,13,32,0.9)",
        border:`1px solid ${strata ? strata.color+"55" : "rgba(26,53,85,0.6)"}` }}>
        <div>
          <div style={{ fontFamily:FF.serif, fontSize:13, fontWeight:700, color:T.txt3, marginBottom:2 }}>HEART Score</div>
          <div style={{ fontFamily:FF.sans, fontSize:10, color:T.txt4, lineHeight:1.5 }}>
            {allSet ? strata.rec : "Select all 5 components to calculate"}
          </div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontFamily:FF.serif, fontSize:52, fontWeight:900, lineHeight:1,
            color:strata ? strata.color : T.txt4 }}>{total}</div>
          {strata && <div style={{ fontFamily:FF.mono, fontSize:8, letterSpacing:1.5,
            textTransform:"uppercase", color:strata.color, marginTop:2 }}>
            {strata.label} · {strata.mace} 30d MACE</div>}
        </div>
      </div>

      {HEART_ITEMS.map(item => (
        <div key={item.key} style={{ marginBottom:14 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:22, height:22, borderRadius:"50%", background:item.color,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontFamily:FF.serif, fontWeight:900, fontSize:10, color:"#050f1e" }}>
                {item.key[0].toUpperCase()}
              </div>
              <span style={{ fontFamily:FF.serif, fontWeight:700, fontSize:13, color:item.color }}>{item.label}</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              {/* Cross-tab troponin nudge */}
              {item.key === "troponin_h" && suggestedTropH !== null && scores.troponin_h !== suggestedTropH && (
                <div style={{ fontFamily:FF.mono, fontSize:7.5, color:T.gold, letterSpacing:0.5,
                  background:"rgba(245,200,66,0.1)", border:"1px solid rgba(245,200,66,0.35)",
                  borderRadius:5, padding:"2px 6px" }}>
                  Troponin tab → {suggestedTropH}
                </div>
              )}
              <span style={{ fontFamily:FF.mono, fontSize:9, color:T.txt4 }}>{item.hint}</span>
              {scores[item.key] !== undefined && (
                <div style={{ width:22, height:22, borderRadius:"50%", background:item.color,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontFamily:FF.mono, fontWeight:900, fontSize:11, color:"#050f1e" }}>
                  {scores[item.key]}
                </div>
              )}
            </div>
          </div>
          {[0,1,2].map(val => (
            <ScoreOption key={val} item={item} val={val} selected={scores[item.key]}
              onSelect={v => setScores(p => ({ ...p, [item.key]:v }))} />
          ))}
        </div>
      ))}

      {Object.values(scores).some(v => v !== undefined) && (
        <button onClick={() => setScores({})}
          style={{ marginTop:6, fontFamily:FF.sans, fontSize:11, fontWeight:600,
            padding:"5px 14px", borderRadius:7, cursor:"pointer",
            border:"1px solid rgba(26,53,85,0.6)", background:"transparent", color:T.txt4 }}>
          ↺ Reset
        </button>
      )}
    </div>
  );
}

// ═══ TROPONIN TAB ═════════════════════════════════════════════════════════
function TroponinTab({ t0,setT0,t1,setT1,t2,setT2,uln,setULN,unit,setUnit,mode,setMode }) {
  const result    = useMemo(() => calcTrop(t0,t1,t2,uln), [t0,t1,t2,uln]);
  const hstResult = useMemo(() => mode === "hst" ? evalHST(t0,t1) : null, [mode,t0,t1]);

  return (
    <div className="cph-fade">
      <div style={{ display:"flex", gap:7, marginBottom:14 }}>
        {[{id:"conventional",label:"Conventional cTn"},{id:"hst",label:"hs-cTnI (0/1h Protocol)"}].map(m => (
          <button key={m.id} onClick={() => setMode(m.id)}
            style={{ flex:1, padding:"7px 0", borderRadius:8, cursor:"pointer",
              fontFamily:FF.sans, fontWeight:600, fontSize:11, transition:"all .12s",
              border:`1px solid ${mode===m.id ? T.blue+"66" : "rgba(26,53,85,0.55)"}`,
              background:mode===m.id ? "rgba(59,158,255,0.1)" : "transparent", color:mode===m.id ? T.blue : T.txt4 }}>
            {m.label}
          </button>
        ))}
      </div>

      {mode === "conventional" ? (
        <>
          <div style={{ marginBottom:12 }}>
            <div style={{ fontFamily:FF.mono, fontSize:8, color:T.txt4,
              letterSpacing:1.3, textTransform:"uppercase", marginBottom:4 }}>
              Upper Limit of Normal (your lab)
            </div>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <input type="number" value={uln} onChange={e => setULN(e.target.value)}
                style={{ width:110, padding:"7px 11px", background:"rgba(5,13,32,0.9)",
                  border:"1px solid rgba(59,158,255,0.35)", borderRadius:7, outline:"none",
                  fontFamily:FF.mono, fontSize:14, fontWeight:700, color:T.blue }} />
              <div style={{ display:"flex", gap:5 }}>
                {TROPONIN_UNITS.map(u => (
                  <button key={u} onClick={() => setUnit(u)}
                    style={{ fontFamily:FF.mono, fontSize:8, padding:"3px 9px",
                      borderRadius:5, cursor:"pointer", letterSpacing:0.5,
                      border:`1px solid ${unit===u ? T.blue+"55" : "rgba(26,53,85,0.5)"}`,
                      background:unit===u ? "rgba(59,158,255,0.1)" : "transparent", color:unit===u ? T.blue : T.txt4 }}>
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display:"flex", gap:10, marginBottom:12 }}>
            <TroponinField label="0h (Arrival)" value={t0} onChange={setT0} uln={parseFloat(uln)} />
            <TroponinField label="3h" value={t1} onChange={setT1} uln={parseFloat(uln)} />
            <TroponinField label="6h" value={t2} onChange={setT2} uln={parseFloat(uln)} />
          </div>

          {result && (
            <InfoBox color={result.interp==="acs"?T.coral:result.interp==="elevated"?T.gold:T.teal}
              icon={result.interp==="acs"?"🚨":result.interp==="elevated"?"⚠":"✓"}
              title={result.interp==="acs"?"Significant Troponin Rise":result.interp==="elevated"?"Troponin Elevated":"Troponin Normal"}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
                {[
                  { label:"Peak", val:result.peak?.toFixed(3) },
                  { label:"× ULN", val:result.fold?.toFixed(1)||"--" },
                  { label:"Δ 0→3h", val:result.delta?result.delta+"%":"--" },
                  { label:"Trend", val:result.trend ? result.trend.arrow : "--",
                    color:result.trend ? result.trend.color : T.txt4, sub:result.trend ? result.trend.label : "" },
                ].map(s => (
                  <div key={s.label} style={{ textAlign:"center" }}>
                    <div style={{ fontFamily:FF.mono, fontSize:9, color:T.txt4, letterSpacing:1 }}>{s.label}</div>
                    <div style={{ fontFamily:FF.mono, fontSize:18, fontWeight:700,
                      color:s.color || (result.interp==="acs"?T.coral:result.interp==="elevated"?T.gold:T.teal),
                      lineHeight:1 }}>{s.val||"--"}</div>
                    {s.sub && <div style={{ fontFamily:FF.sans, fontSize:8.5, color:T.txt4, marginTop:1 }}>{s.sub}</div>}
                  </div>
                ))}
              </div>
              {result.interp==="acs" && (
                <div style={{ marginTop:8, fontFamily:FF.sans, fontSize:11, color:T.coral, lineHeight:1.55 }}>
                  Rising troponin pattern consistent with AMI — initiate ACS protocol and cardiology consult
                </div>
              )}
            </InfoBox>
          )}
        </>
      ) : (
        <>
          <InfoBox color={T.blue} title="ESC 0/1h Protocol — Elecsys hs-cTnI">
            <div style={{ fontFamily:FF.sans, fontSize:11, color:T.txt3, lineHeight:1.65 }}>
              Rule-out: 0h &lt; 5 ng/L, or 0h &lt; 12 ng/L + Δ1h &lt; 3 ng/L &nbsp;| Rule-in: 0h ≥ 52 ng/L, or Δ1h ≥ 6 ng/L
            </div>
          </InfoBox>
          <div style={{ display:"flex", gap:10, margin:"12px 0" }}>
            <TroponinField label="0h hs-cTnI (ng/L)" value={t0} onChange={setT0} uln={52} />
            <TroponinField label="1h hs-cTnI (ng/L)" value={t1} onChange={setT1} uln={52} />
          </div>
          {hstResult && (
            <InfoBox color={hstResult.color}
              icon={hstResult.result==="rule_out"?"✓":hstResult.result==="rule_in"?"🚨":"⚠"}
              title={hstResult.label}>
              <div style={{ fontFamily:FF.sans, fontSize:12, color:T.txt2, lineHeight:1.65 }}>{hstResult.detail}</div>
            </InfoBox>
          )}
        </>
      )}
    </div>
  );
}

// ═══ EDACS TAB ═══════════════════════════════════════════════════════════
function EdacsTab({ fields, setFields, negTrop, setNegTrop }) {
  const setF  = (k, v) => setFields(p => ({ ...p, [k]:v }));
  const age   = parseInt(fields.age) || 0;
  const ageInvalid = fields.age !== "" && age < 18;
  const score = age >= 18 ? calcEDACS(fields) : null;
  const risk  = score !== null ? edacsRisk(score, negTrop) : null;

  return (
    <div className="cph-fade">
      <InfoBox color={T.purple} title="EDACS Low-Risk Criteria">
        <div style={{ fontFamily:FF.sans, fontSize:11, color:T.txt3, lineHeight:1.6 }}>
          Score &lt; 16 + negative troponin = safe for early discharge. Validated in Flaws et al, Heart 2016 — 99.7% sensitivity for 30-day ACS. Valid ages 18+.
        </div>
      </InfoBox>

      <div style={{ display:"flex", gap:10, marginBottom:12 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:FF.mono, fontSize:8, color:T.txt4,
            letterSpacing:1.3, textTransform:"uppercase", marginBottom:4 }}>Age</div>
          <input type="number" value={fields.age} onChange={e => setF("age", e.target.value)} placeholder="years"
            style={{ width:"100%", padding:"9px 11px", background:"rgba(5,13,32,0.9)",
              border:`1px solid ${ageInvalid ? T.coral+"88" : fields.age ? T.purple+"55" : "rgba(26,53,85,0.5)"}`,
              borderRadius:8, outline:"none", fontFamily:FF.mono,
              fontSize:18, fontWeight:700, color:ageInvalid ? T.coral : T.purple }} />
          {ageInvalid && <div style={{ fontFamily:FF.sans, fontSize:9, color:T.coral, marginTop:3 }}>EDACS validated for age ≥ 18</div>}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:FF.mono, fontSize:8, color:T.txt4,
            letterSpacing:1.3, textTransform:"uppercase", marginBottom:4 }}>Sex</div>
          <div style={{ display:"flex", gap:6 }}>
            {[["M","Male"],["F","Female"]].map(([v,l]) => (
              <button key={v} onClick={() => setF("sex", v)}
                style={{ flex:1, padding:"9px 0", borderRadius:8, cursor:"pointer",
                  fontFamily:FF.sans, fontWeight:600, fontSize:12,
                  border:`1px solid ${fields.sex===v ? T.purple+"66" : "rgba(26,53,85,0.55)"}`,
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
        { key:"inspiratory", pts:-4, label:"Pain is SOLELY pleuritic/inspiratory" },
        { key:"palpation",   pts:-6, label:"Pain REPRODUCED by palpation" },
        { key:"knownCAD",    pts:12, label:"Known CAD (prior MI, PCI, CABG)" },
      ].map(f => (
        <CheckRow key={f.key} label={f.label} pts={f.pts} checked={fields[f.key]}
          onChange={() => setF(f.key, !fields[f.key])} />
      ))}
      <CheckRow label="Serial troponin negative (required for low-risk pathway)" checked={negTrop}
        color={negTrop ? T.teal : T.coral} onChange={() => setNegTrop(!negTrop)} />

      {score !== null && risk && (
        <div style={{ marginTop:14, padding:"12px 14px", borderRadius:10,
          background:`${risk.color}09`, border:`1px solid ${risk.color}38` }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
            <span style={{ fontFamily:FF.serif, fontWeight:700, fontSize:16, color:risk.color }}>{risk.label}</span>
            <span style={{ fontFamily:FF.mono, fontSize:36, fontWeight:900, color:risk.color }}>{score}</span>
          </div>
          <div style={{ fontFamily:FF.sans, fontSize:11, color:T.txt3, lineHeight:1.6 }}>{risk.rec}</div>
        </div>
      )}
    </div>
  );
}

// DDx reference data (pericarditis, pneumothorax, Boerhaave) + shared renderer
const DDX_REF = {
  peri: { color:T.purple, intro:"Classic triad: pleuritic chest pain, fever, pericardial friction rub. Typically young males post-viral. Pain worse supine, relieved leaning forward.", sections:[
    { label:"Diagnostic criteria", c:T.purple, items:["Pleuritic/positional chest pain (worse supine, better leaning forward)","Pericardial friction rub on auscultation","New widespread saddle-shaped ST elevation or PR depression on ECG","New or worsening pericardial effusion on echo"] },
    { label:"Workup", c:T.blue, items:["ECG: diffuse concave ST elevation, PR depression — aVR shows PR elevation","Troponin: elevated in myopericarditis (30–70% of cases)","Echo: effusion, regional wall motion abnormalities if myocarditis dominant","CRP, ESR, CBC: elevated in inflammatory pericarditis"] },
    { label:"Treatment", c:T.teal, items:["NSAIDs: ibuprofen 600 mg TID × 1–2 weeks (first-line idiopathic/viral)","Colchicine 0.5 mg BID × 3 months — reduces recurrence 50% (COPE trial)","Avoid NSAIDs in Dressler syndrome (post-MI) — use aspirin","Cardiac MRI if troponin elevated or regional wall motion abnormality"] },
  ]},
  pneumo: { color:T.teal, intro:"Do NOT wait for imaging if tension physiology present. Treat immediately.", introAlert:true, sections:[
    { label:"Clinical features", c:T.teal, items:["Sudden severe unilateral pleuritic chest pain + dyspnea","Absent/diminished breath sounds ipsilaterally","Tracheal deviation away from affected side (late sign)","Hypotension + elevated JVP + hypoxia = tension physiology"] },
    { label:"Imaging (if stable)", c:T.blue, items:["CXR: absent lung markings, visible pleural line, mediastinal shift","Lung US (BLUE Protocol): absent lung sliding + absent B-lines = pneumothorax","CT chest: gold standard, detects occult pneumothorax"] },
    { label:"Management", c:T.orange, items:["Tension PTX: immediate needle decompression — 2nd ICS MCL or 4th/5th ICS anterior axillary line","Follow with tube thoracostomy (28–32 Fr trauma, 16–24 Fr spontaneous)","Simple PTX < 2 cm + stable: observation + supplemental oxygen","Large or symptomatic PTX: tube thoracostomy or aspiration"] },
  ]},
  boerhaave: { color:T.orange, intro:"Mackler triad: forceful vomiting + chest pain + subcutaneous emphysema. 90% mortality if untreated > 24h.", sections:[
    { label:"Clinical features", c:T.orange, items:["Sudden severe chest/epigastric pain after forceful vomiting","Subcutaneous emphysema in neck or mediastinum","Hamman sign: mediastinal crunch synchronous with heartbeat","Pleural effusion (usually left-sided) on CXR"] },
    { label:"Workup", c:T.blue, items:["CT chest with IV + oral contrast: leak into mediastinum is diagnostic","Esophagram with water-soluble contrast (Gastrografin) first, then barium if negative","Pleural fluid pH < 6 + amylase > serum amylase: pathognomonic","Avoid blind NGT insertion if perforation suspected"] },
    { label:"Management", c:T.coral, items:["NPO immediately, IV access ×2, broad-spectrum antibiotics (pip-tazo or carbapenem + fluconazole)","Urgent cardiothoracic surgery consult — operative repair preferred within 24h","PPI infusion: pantoprazole 40 mg IV BID","ICU admission for all — mortality 20–40% even with surgery"] },
  ]},
};
function RefSection({ data }) {
  return (
    <>
      <InfoBox color={data.color}>
        <div style={{ fontFamily:FF.sans, fontSize:11, color:data.introAlert?T.coral:T.txt3, fontWeight:data.introAlert?600:400, lineHeight:1.6 }}>{data.intro}</div>
      </InfoBox>
      {data.sections.map((sect,i) => (
        <div key={i} style={{ marginBottom:10 }}>
          <div style={{ fontFamily:FF.mono, fontSize:8, color:sect.c, letterSpacing:1.5, textTransform:"uppercase", marginBottom:5 }}>{sect.label}</div>
          {sect.items.map((item,j) => <Bul key={j} c={sect.c}>{item}</Bul>)}
        </div>
      ))}
    </>
  );
}
// ═══ DIFFERENTIALS TAB ═════════════════════════════════════════════════════
const DDX_TABS = [
  { id:"pe",       label:"PE",          color:T.blue   },
  { id:"dissect",  label:"Dissection",  color:T.coral  },
  { id:"peri",     label:"Pericarditis",color:T.purple },
  { id:"pneumo",   label:"Pneumothorax",color:T.teal   },
  { id:"boerhaave",label:"Esophageal",  color:T.orange },
];

function DifferentialsTab({ ddxSub,setDdxSub,wells,setWells,perc,setPerc,addrs,setAddrs }) {
  const wellsScore      = WELLS_ITEMS.reduce((s,i) => s + (wells[i.key] ? i.pts : 0), 0);
  const wellsInterResult = wellsInterp(wellsScore);
  const percAllMet      = PERC_ITEMS.every(i => perc[i.key]);
  const addrsScore      = ADDRS_ITEMS.reduce((s,i) => s + (addrs[i.key] ? 1 : 0), 0);
  const addrsResult     = addrsInterp(addrsScore);

  return (
    <div className="cph-fade">
      <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:12 }}>
        {DDX_TABS.map(t => (
          <button key={t.id} onClick={() => setDdxSub(t.id)}
            style={{ padding:"5px 11px", borderRadius:7, cursor:"pointer",
              fontFamily:FF.sans, fontWeight:600, fontSize:11,
              border:`1px solid ${ddxSub===t.id ? t.color+"66" : "rgba(26,53,85,0.55)"}`,
              background:ddxSub===t.id ? `${t.color}14` : "transparent", color:ddxSub===t.id ? t.color : T.txt4 }}>
            {t.label}
          </button>
        ))}
      </div>

      {ddxSub === "pe" && (
        <div>
          <InfoBox color={T.blue} title="Wells Criteria for PE">
            <div style={{ fontFamily:FF.sans, fontSize:10.5, color:T.txt3, lineHeight:1.5 }}>
              Pre-test probability score. Apply PERC if low risk (Wells ≤ 1) in low-prevalence setting.
            </div>
          </InfoBox>
          {WELLS_ITEMS.map(it => (
            <CheckRow key={it.key} label={it.label} pts={it.pts} checked={!!wells[it.key]}
              color={T.blue} onChange={() => setWells(p => ({ ...p, [it.key]:!p[it.key] }))} />
          ))}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"10px 14px", borderRadius:9, margin:"10px 0",
            background:`${wellsInterResult.color}0c`, border:`1px solid ${wellsInterResult.color}44` }}>
            <div>
              <div style={{ fontFamily:FF.serif, fontWeight:700, fontSize:15, color:wellsInterResult.color }}>{wellsInterResult.label}</div>
              <div style={{ fontFamily:FF.sans, fontSize:10.5, color:T.txt3, marginTop:3, lineHeight:1.5, maxWidth:280 }}>{wellsInterResult.sub}</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontFamily:FF.mono, fontSize:32, fontWeight:900, color:wellsInterResult.color, lineHeight:1 }}>{wellsScore.toFixed(1)}</div>
              <div style={{ fontFamily:FF.mono, fontSize:8, color:wellsInterResult.color, letterSpacing:1 }}>{wellsInterResult.action}</div>
            </div>
          </div>
          {wellsScore <= 1 && (
            <>
              <div style={{ fontFamily:FF.mono, fontSize:8, color:T.teal,
                letterSpacing:1.5, textTransform:"uppercase", margin:"10px 0 6px" }}>
                PERC Rule — all 8 must be met to exclude PE
              </div>
              {PERC_ITEMS.map(it => (
                <CheckRow key={it.key} label={it.label} checked={!!perc[it.key]}
                  color={T.teal} onChange={() => setPerc(p => ({ ...p, [it.key]:!p[it.key] }))} />
              ))}
              {percAllMet && (
                <InfoBox color={T.teal} icon="✓" title="PERC Negative — PE Excluded">
                  <div style={{ fontFamily:FF.sans, fontSize:11, color:T.teal, lineHeight:1.5 }}>
                    All 8 PERC criteria met + Wells ≤ 1 — PE safely excluded without D-dimer or imaging.
                  </div>
                </InfoBox>
              )}
            </>
          )}
          <button onClick={() => { setWells({}); setPerc({}); }}
            style={{ marginTop:4, fontFamily:FF.sans, fontSize:11, fontWeight:600,
              padding:"5px 14px", borderRadius:7, cursor:"pointer",
              border:"1px solid rgba(26,53,85,0.6)", background:"transparent", color:T.txt4 }}>
            ↺ Reset
          </button>
        </div>
      )}

      {ddxSub === "dissect" && (
        <div>
          <InfoBox color={T.coral} title="ADD-RS — Aortic Dissection Detection Risk Score">
            <div style={{ fontFamily:FF.sans, fontSize:10.5, color:T.txt3, lineHeight:1.5 }}>
              Rogers et al, Circulation 2011. One point per category (max 3). Guides imaging threshold. Always order as <strong>CT Aortogram</strong> (arterial phase, chest+abdomen+pelvis) — not generic CT chest.
            </div>
          </InfoBox>
          {ADDRS_ITEMS.map(it => (
            <CheckRow key={it.key} label={it.label} sub={it.sub} checked={!!addrs[it.key]}
              color={T.coral} onChange={() => setAddrs(p => ({ ...p, [it.key]:!p[it.key] }))} />
          ))}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"10px 14px", borderRadius:9, margin:"10px 0",
            background:`${addrsResult.color}0c`, border:`1px solid ${addrsResult.color}44` }}>
            <div style={{ flex:1, marginRight:12 }}>
              <div style={{ fontFamily:FF.serif, fontWeight:700, fontSize:15, color:addrsResult.color }}>{addrsResult.label}</div>
              <div style={{ fontFamily:FF.sans, fontSize:10.5, color:T.txt3, marginTop:3, lineHeight:1.5 }}>{addrsResult.rec}</div>
            </div>
            <div style={{ fontFamily:FF.mono, fontSize:36, fontWeight:900, color:addrsResult.color, lineHeight:1, flexShrink:0 }}>{addrsScore}</div>
          </div>
          <InfoBox color={T.gold} icon="💡" title="Critical Pearl">
            <div style={{ fontFamily:FF.sans, fontSize:11, color:T.txt3, lineHeight:1.6 }}>
              HTN + anterior chest pain + wide mediastinum on CXR = high suspicion. BP differential &gt;20 mmHg between arms is pathognomonic. D-dimer &gt;500 ng/mL has 97% sensitivity for type A dissection (IRAD 2009). Do NOT anticoagulate before dissection is excluded.
            </div>
          </InfoBox>
          <button onClick={() => setAddrs({})}
            style={{ marginTop:4, fontFamily:FF.sans, fontSize:11, fontWeight:600,
              padding:"5px 14px", borderRadius:7, cursor:"pointer",
              border:"1px solid rgba(26,53,85,0.6)", background:"transparent", color:T.txt4 }}>
            ↺ Reset
          </button>
        </div>
      )}

      {ddxSub === "peri"    && <RefSection data={DDX_REF.peri} />}

      {ddxSub === "pneumo"    && <RefSection data={DDX_REF.pneumo} />}

      {ddxSub === "boerhaave" && <RefSection data={DDX_REF.boerhaave} />}
    </div>
  );
}

// ═══ PROTOCOL TAB ═════════════════════════════════════════════════════════
function ProtocolTab({ expanded, setExpanded, weightKg }) {
  const doses = weightKg ? {
    ufhBolus: Math.min(Math.round(weightKg*60), 4000), ufhInf:   Math.min(Math.round(weightKg*12), 1000),
    enox:     weightKg.toFixed(0), tnk:      Math.min((weightKg*0.5).toFixed(1), 50),
  } : null;
  return (
    <div className="cph-fade">
      {doses && (
        <div style={{ marginBottom:12, padding:"10px 13px", borderRadius:9,
          background:"rgba(59,158,255,0.08)", border:"1px solid rgba(59,158,255,0.3)" }}>
          <div style={{ fontFamily:FF.mono, fontSize:8, color:T.blue, letterSpacing:1.2, marginBottom:6 }}>
            COMPUTED DOSES -- {weightKg.toFixed(1)} kg
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
            {[
              { label:"UFH Bolus",   val:`${doses.ufhBolus.toLocaleString()} u`,  sub:"60 u/kg, max 4,000" },
              { label:"UFH Infusion",val:`${doses.ufhInf} u/hr`,                  sub:"12 u/kg/hr, max 1,000" },
              { label:"Enoxaparin",  val:`${doses.enox} mg SQ`,                   sub:"1 mg/kg q12h" },
              { label:"TNK",         val:`${doses.tnk} mg`,                        sub:"0.5 mg/kg, max 50" },
            ].map(d => (
              <div key={d.label} style={{ textAlign:"center" }}>
                <div style={{ fontFamily:FF.mono, fontSize:7,
                  color:T.txt4, letterSpacing:0.8, marginBottom:2 }}>{d.label}</div>
                <div style={{ fontFamily:FF.mono, fontSize:13,
                  fontWeight:700, color:T.blue }}>{d.val}</div>
                <div style={{ fontFamily:FF.sans, fontSize:8.5,
                  color:T.txt4 }}>{d.sub}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {ACS_STEPS.map((section, i) => (
        <div key={i} style={{ marginBottom:6, borderRadius:10, overflow:"hidden",
          border:`1px solid ${expanded===i ? section.color+"55" : "rgba(26,53,85,0.5)"}` }}>
          <button onClick={() => setExpanded(p => p===i ? null : i)}
            style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
              width:"100%", padding:"10px 13px", cursor:"pointer", border:"none", textAlign:"left",
              background:`linear-gradient(135deg,${section.color}0c,rgba(5,13,32,0.96))` }}>
            <div style={{ display:"flex", alignItems:"center", gap:9 }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:section.color, flexShrink:0 }} />
              <span style={{ fontFamily:FF.serif, fontWeight:700, fontSize:13, color:section.color }}>{section.title}</span>
            </div>
            <span style={{ color:T.txt4, fontSize:10 }}>{expanded===i ? "▲" : "▼"}</span>
          </button>
          {expanded === i && (
            <div style={{ padding:"8px 13px 12px", borderTop:`1px solid ${section.color}22`, background:"rgba(5,13,32,0.85)" }}>
              {section.steps.map((step, j) => (
                <div key={j} style={{ display:"flex", gap:8, alignItems:"flex-start", marginBottom:7 }}>
                  <span style={{ color:section.color, fontSize:8, marginTop:3, flexShrink:0 }}>▸</span>
                  <span style={{ fontFamily:FF.sans, fontSize:11.5, color:T.txt2, lineHeight:1.6 }}>{step}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      <InfoBox color={T.gold} icon="💎" title="Key Pearls">
        <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
          {[
            "Door-to-EKG < 10 min is a class I recommendation — wire into your triage workflow",
            "TNK (tenecteplase) single bolus preferred over alteplase when PCI unavailable — ACEP 2024",
            "Ticagrelor preferred over clopidogrel (PLATO) — avoid if prior stroke/TIA",
            "Morphine associated with worse outcomes in NSTEMI — use cautiously",
            "Oxygen only if SpO2 < 90% — hyperoxia is harmful in normoxic ACS",
          ].map((p, i) => (
            <Bul key={i} c={T.gold}>{p}</Bul>
          ))}
        </div>
      </InfoBox>
    </div>
  );
}

// ═══ DISPO TAB ════════════════════════════════════════════════════════════
function DispoTab({ heartScore, tropInterp, edacsScore, edacsNegTrop, tropResult,
    wellsScore, wellsInterResult, addrsScore, addrsResult }) {
  const rec          = useMemo(() => dispositionRec(heartScore, tropInterp), [heartScore, tropInterp]);
  const [copied,     setCopied]    = useState(false);
  const [copiedMDM,  setCopiedMDM] = useState(false);
  const [showReturn, setShowReturn]= useState(false);

  const hs = heartScore !== null ? heartStrata(heartScore) : null;
  const er = edacsScore !== null ? edacsRisk(edacsScore, edacsNegTrop) : null;

  const generateMDM = () => {
    if (!rec || !hs) return "";
    const tropDesc = tropInterp==="acs"
      ? "rising troponin consistent with acute myocardial injury"
      : tropInterp==="elevated"
      ? "mildly elevated troponin without significant rise on serial testing"
      : "negative serial troponin";
    const edacsLine = er ? ` EDACS score ${edacsScore} is ${er.label.toLowerCase()} risk.` : "";
    let mdm = `Patient presented with chest pain and was risk-stratified for acute coronary syndrome. HEART score ${heartScore}/10 (${hs.label}), estimated 30-day MACE ${hs.mace}. Biomarker evaluation: ${tropDesc}.${edacsLine}`;
    if (wellsScore>0) mdm += ` Wells PE score ${wellsScore.toFixed(1)}: ${wellsInterResult?.label?.toLowerCase()} probability.`;
    if (addrsScore>0) mdm += ` ADD-RS ${addrsScore}/3 for aortic dissection.`;
    mdm += ` Clinical decision: ${rec.dispo.toLowerCase()}. `;
    mdm += rec.plan.map((p,i)=>`${i+1}. ${p}`).join(" ");
    return mdm;
  };
  const handleCopyMDM = () => {
    if (navigator.clipboard)
      navigator.clipboard.writeText(generateMDM())
        .then(()=>{ setCopiedMDM(true); setTimeout(()=>setCopiedMDM(false),2500); });
  };

  const generateNote = () => {
    const lines = ["CHEST PAIN EVALUATION -- NOTRYA CLINICAL SUPPORT"];
    if (hs) lines.push(`HEART Score: ${heartScore}/10 (${hs.label}) — est. 30-day MACE ${hs.mace}`);
    if (tropResult) {
      const foldStr = tropResult.fold ? ` (${tropResult.fold.toFixed(1)}× ULN)` : "";
      const t1str   = !isNaN(tropResult.v1) ? `, 3h: ${tropResult.v1}` : "";
      const t2str   = !isNaN(tropResult.v2) ? `, 6h: ${tropResult.v2}` : "";
      const trendStr = tropResult.trend ? ` [${tropResult.trend.label}]` : "";
      lines.push(`Troponin 0h: ${tropResult.v0}${foldStr}${t1str}${t2str}${trendStr} — ${
        tropInterp === "acs" ? "rising pattern consistent with AMI" :
        tropInterp === "elevated" ? "elevated without significant rise" : "within normal limits"}`);
    }
    if (er) lines.push(`EDACS: ${edacsScore} — ${er.label} (troponin ${edacsNegTrop ? "negative" : "positive"})`);
    if (wellsScore > 0) lines.push(`Wells PE: ${wellsScore.toFixed(1)} — ${wellsInterResult?.label} (${wellsInterResult?.action})`);
    if (addrsScore > 0) lines.push(`ADD-RS (Aortic Dissection): ${addrsScore}/3 — ${addrsResult?.label}`);
    if (rec) {
      lines.push(`Disposition: ${rec.dispo}`);
      rec.plan.forEach((p, i) => lines.push(`  ${i+1}. ${p}`));
    }
    lines.push("** Clinical decision support only — physician judgment required **");
    return lines.join("\n");
  };

  const handleCopy = () => {
    const text = generateNote();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); });
    }
  };

  if (heartScore === null) {
    return (
      <div className="cph-fade" style={{ padding:"24px 0", textAlign:"center" }}>
        <div style={{ fontSize:32, marginBottom:12 }}>💓</div>
        <div style={{ fontFamily:FF.sans, fontSize:13, color:T.txt4, lineHeight:1.7 }}>
          Complete HEART Score to begin. Then add Troponin result to generate disposition.
        </div>
      </div>
    );
  }

  if (tropInterp === null) {
    return (
      <div className="cph-fade" style={{ padding:"24px 0", textAlign:"center" }}>
        <div style={{ fontSize:32, marginBottom:12 }}>🔬</div>
        <div style={{ fontFamily:FF.sans, fontSize:13, color:T.txt4, lineHeight:1.7 }}>
          HEART Score complete ({heartScore}/10). Enter troponin values on the Troponin tab to generate disposition.
        </div>
      </div>
    );
  }

  return (
    <div className="cph-fade">
      <div style={{ padding:"16px", borderRadius:12, marginBottom:14,
        background:`${rec.color}0c`, border:`2px solid ${rec.color}55` }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
          <span style={{ fontSize:32 }}>{rec.icon}</span>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:FF.serif, fontWeight:900, fontSize:22, color:rec.color }}>{rec.dispo}</div>
            <div style={{ fontFamily:FF.sans, fontSize:11, color:T.txt3, marginTop:2 }}>{rec.detail}</div>
          </div>
          <button onClick={handleCopy}
            style={{ padding:"7px 12px", borderRadius:8, cursor:"pointer",
              fontFamily:FF.mono, fontSize:9, fontWeight:700, letterSpacing:0.5, flexShrink:0,
              border:`1px solid ${copied ? T.teal+"66" : rec.color+"44"}`,
              background:copied ? "rgba(0,229,192,0.1)" : `${rec.color}0a`, color:copied ? T.teal : rec.color }}>
            {copied ? "COPIED ✓" : "COPY NOTE"}
          </button>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
          {rec.plan.map((p, i) => (
            <div key={i} style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
              <span style={{ fontFamily:FF.mono, fontSize:9, color:rec.color,
                minWidth:18, marginTop:1, fontWeight:700 }}>{i+1}.</span>
              <span style={{ fontFamily:FF.sans, fontSize:12, color:T.txt2, lineHeight:1.6 }}>{p}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
        {[
          { label:"HEART",   val:heartScore !== null ? heartScore : "--",                    color:T.coral  },
          { label:"Troponin",val:tropInterp || "unknown",                                    color:T.blue   },
          { label:"Strata",  val:heartScore !== null ? heartStrata(heartScore).label : "--", color:rec.color },
        ].map(s => (
          <div key={s.label} style={{ padding:"10px", borderRadius:9, textAlign:"center",
            background:"rgba(5,13,32,0.85)", border:"1px solid rgba(26,53,85,0.55)" }}>
            <div style={{ fontFamily:FF.mono, fontSize:7, color:T.txt4,
              letterSpacing:1, textTransform:"uppercase", marginBottom:4 }}>{s.label}</div>
            <div style={{ fontFamily:FF.mono, fontSize:14, fontWeight:700, color:s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* P6: MDM Note + P7: Return Precautions */}
      {rec && (
        <div style={{ display:"flex", gap:8, marginTop:12, marginBottom:4 }}>
          <button onClick={handleCopyMDM}
            style={{ flex:1, padding:"8px 10px", borderRadius:8, cursor:"pointer",
              fontFamily:FF.mono, fontSize:9, fontWeight:700, letterSpacing:0.5,
              border:`1px solid ${copiedMDM ? T.teal+"66" : T.purple+"44"}`,
              background:copiedMDM ? "rgba(0,229,192,0.1)" : "rgba(155,109,255,0.08)",
              color:copiedMDM ? T.teal : T.purple }}>
            {copiedMDM ? "COPIED" : "MDM Note"}
          </button>
          {rec.dispo === "Safe Discharge" && (
            <button onClick={() => setShowReturn(p => !p)}
              style={{ flex:1, padding:"8px 10px", borderRadius:8, cursor:"pointer",
                fontFamily:FF.mono, fontSize:9, fontWeight:700, letterSpacing:0.5,
                border:`1px solid ${showReturn ? T.teal+"66" : "rgba(26,53,85,0.55)"}`,
                background:showReturn ? "rgba(0,229,192,0.1)" : "transparent", color:showReturn ? T.teal : T.txt4 }}>
              Return Precautions
            </button>
          )}
        </div>
      )}
      {showReturn && rec?.dispo === "Safe Discharge" && <ReturnPrecautions />}
    </div>
  );
}

// === VITALS BAR + TROP COUNTDOWN =========================================
function VitalsBar({ sbp,setSbp,hr,setHr,weight,weightUnit,setWeight,setWeightUnit,
    tropArrivalTime,setTropArrivalTime,t0 }) {
  const sbpN = parseInt(sbp)||0, hrN = parseInt(hr)||0;
  const sbpLow = sbpN>0 && sbpN<90, hrHigh = hrN>0 && hrN>100;
  const draw3h = tropArrivalTime ? new Date(tropArrivalTime + 3*60*60*1000) : null;
  const draw3hStr = draw3h ? draw3h.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}) : null;
  const now = new Date();
  const overdue = draw3h && now > draw3h;
  const mins = draw3h && !overdue ? Math.round((draw3h-now)/60000) : null;
  return (
    <div style={{ marginBottom:10, padding:"8px 12px", borderRadius:9,
      background:"rgba(5,13,32,0.9)", border:"1px solid rgba(26,53,85,0.6)" }}>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
        {[
          { label:"SBP", val:sbp, set:setSbp, alert:sbpLow, ac:T.coral,  al:"LOW"  },
          { label:"HR",  val:hr,  set:setHr,  alert:hrHigh, ac:T.orange, al:"TACH" },
        ].map(f => (
          <div key={f.label} style={{ display:"flex", alignItems:"center", gap:5 }}>
            <div style={{ fontFamily:FF.mono, fontSize:8, letterSpacing:1,
              color:f.alert ? f.ac : T.txt4, minWidth:24 }}>{f.label}</div>
            <input type="number" value={f.val} onChange={e => f.set(e.target.value)}
              placeholder="--" style={{ width:56, padding:"4px 7px", background:"rgba(5,13,32,0.9)",
                border:`1px solid ${f.alert ? f.ac+"88" : "rgba(26,53,85,0.5)"}`, borderRadius:6, outline:"none",
                fontFamily:FF.mono, fontSize:13, fontWeight:700, color:f.alert ? f.ac : T.txt }} />
            {f.alert && <div style={{ fontFamily:FF.sans, fontSize:9,
              color:f.ac, fontWeight:700 }}>{f.al}</div>}
          </div>
        ))}
        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          <div style={{ fontFamily:FF.mono, fontSize:8,
            color:T.txt4, letterSpacing:1, minWidth:20 }}>WT</div>
          <input type="number" value={weight} onChange={e => setWeight(e.target.value)}
            placeholder="--" style={{ width:56, padding:"4px 7px", background:"rgba(5,13,32,0.9)",
              border:"1px solid rgba(26,53,85,0.5)", borderRadius:6, outline:"none",
              fontFamily:FF.mono, fontSize:13, fontWeight:700, color:T.blue }} />
          <div style={{ display:"flex", gap:3 }}>
            {["kg","lbs"].map(u => (
              <button key={u} onClick={() => setWeightUnit(u)}
                style={{ fontFamily:FF.mono, fontSize:7, padding:"2px 5px", borderRadius:4, cursor:"pointer",
                  border:`1px solid ${weightUnit===u ? T.blue+"55" : "rgba(26,53,85,0.4)"}`,
                  background:weightUnit===u ? "rgba(59,158,255,0.1)" : "transparent",
                  color:weightUnit===u ? T.blue : T.txt4 }}>{u}</button>
            ))}
          </div>
        </div>
        {t0 && !tropArrivalTime && (
          <button onClick={() => setTropArrivalTime(Date.now())}
            style={{ fontFamily:FF.mono, fontSize:8, padding:"4px 10px", borderRadius:6, cursor:"pointer",
              border:"1px solid rgba(59,158,255,0.45)", background:"rgba(59,158,255,0.1)", color:T.blue }}>
            Mark 0h
          </button>
        )}
        {draw3hStr && (
          <div style={{ fontFamily:FF.mono, fontSize:8, padding:"4px 9px", borderRadius:6,
            border:`1px solid ${overdue ? T.coral+"66" : T.teal+"44"}`,
            background:overdue ? "rgba(255,107,107,0.1)" : "rgba(0,229,192,0.08)", color:overdue ? T.coral : T.teal }}>
            3h draw {overdue ? "OVERDUE" : `due ${draw3hStr}`}{!overdue && mins!==null ? ` (${mins}m)` : ""}
          </div>
        )}
      </div>
      {sbpLow && (
        <div style={{ marginTop:7, fontFamily:FF.sans, fontSize:10,
          color:T.coral, lineHeight:1.5, padding:"5px 9px", borderRadius:6,
          border:"1px solid rgba(255,107,107,0.3)", background:"rgba(255,107,107,0.08)" }}>
          SBP {sbp} mmHg -- Hold nitrates and diuretics. IV fluid bolus if RV infarct. Vasopressors if cardiogenic shock.
        </div>
      )}
      {hrHigh && (
        <div style={{ marginTop:7, fontFamily:FF.sans, fontSize:10,
          color:T.orange, lineHeight:1.5, padding:"5px 9px", borderRadius:6,
          border:"1px solid rgba(255,159,67,0.3)", background:"rgba(255,159,67,0.08)" }}>
          HR {hr} bpm -- Wells PE hr_gt100 criterion met. Consider ACS vs PE vs demand ischemia.
        </div>
      )}
    </div>
  );
}

// === STEMI OVERLAY ========================================================
function STEMIOverlay({ open, onClose, weightKg }) {
  if (!open) return null;
  const wValid = weightKg > 0;
  const ufhPCI   = wValid ? Math.min(Math.round(weightKg*70), 10000) : null;
  const ufhBolus = wValid ? Math.min(Math.round(weightKg*60), 4000)  : null;
  const tnk      = wValid ? Math.min((weightKg*0.5).toFixed(1), 50)  : null;
  const enox     = wValid ? weightKg.toFixed(0) : null;
  return (
    <div style={{ position:"fixed", inset:0, zIndex:9999, overflowY:"auto", background:"rgba(5,9,18,0.98)" }}>
      <div style={{ maxWidth:700, margin:"0 auto", padding:"0 16px 32px" }}>
        <div style={{ padding:"16px 0 10px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontFamily:FF.serif, fontSize:22, fontWeight:900, color:T.red }}>
              STEMI Activation Protocol
            </div>
            <div style={{ fontFamily:FF.mono, fontSize:9, color:T.coral, letterSpacing:1.5, marginTop:4 }}>
              DOOR-TO-BALLOON TARGET: 90 MIN -- FIBRINOLYSIS: 30 MIN
            </div>
          </div>
          <button onClick={onClose}
            style={{ width:38, height:38, borderRadius:"50%", cursor:"pointer",
              fontWeight:900, fontSize:20, border:"1px solid rgba(255,68,68,0.5)",
              background:"rgba(255,68,68,0.12)", color:T.red }}>x</button>
        </div>
        {wValid && (
          <div style={{ padding:"8px 12px", borderRadius:8, marginBottom:12,
            background:"rgba(59,158,255,0.08)", border:"1px solid rgba(59,158,255,0.3)" }}>
            <div style={{ fontFamily:FF.mono, fontSize:8, color:T.blue, letterSpacing:1.2, marginBottom:6 }}>
              COMPUTED DOSES -- {weightKg.toFixed(1)} kg
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
              {[
                { label:"UFH (PCI)", val:`${ufhPCI?.toLocaleString()} u`,  sub:"70 u/kg bolus" },
                { label:"UFH (Lytic)", val:`${ufhBolus?.toLocaleString()} u`, sub:"60 u/kg bolus" },
                { label:"TNK", val:`${tnk} mg`, sub:"0.5 mg/kg IV, max 50" },
                { label:"Enoxaparin", val:`${enox} mg`, sub:"1 mg/kg SQ" },
              ].map(d => (
                <div key={d.label} style={{ textAlign:"center" }}>
                  <div style={{ fontFamily:FF.mono, fontSize:7,
                    color:T.txt4, letterSpacing:0.8, marginBottom:2 }}>{d.label}</div>
                  <div style={{ fontFamily:FF.mono, fontSize:13,
                    fontWeight:700, color:T.blue }}>{d.val}</div>
                  <div style={{ fontFamily:FF.sans, fontSize:8.5,
                    color:T.txt4 }}>{d.sub}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {[
          { color:T.red, label:"IMMEDIATE ACTIONS", steps:[
            "Activate cath lab -- single call for full team",
            "12-lead EKG to interventionalist -- door-to-EKG < 10 min",
            "Aspirin 325 mg chew + Ticagrelor 180 mg (or Clopidogrel 600 mg)",
            "IV access x2, CBC/BMP/coag, type and screen, continuous monitoring",
          ]},
          { color:T.orange, label:"STEMI EQUIVALENTS -- ACTIVATE CATH LAB", steps:[
            "Posterior MI: ST depression V1-V3 + dominant R -- confirm with V7-V9",
            "de Winter T-waves: upsloping STD + tall peaked T waves V1-V6",
            "Wellens (A/B): biphasic or deeply inverted T waves V2-V3 in pain-free ECG",
            "Hyperacute T-waves: broad-based tall asymmetric T waves in 2+ contiguous leads",
            "LBBB + ischemia: Sgarbossa concordant STE >=1mm in any lead = activate",
          ]},
          { color:T.purple, label:"FIBRINOLYSIS (PCI NOT AVAILABLE WITHIN 120 MIN)", steps:[
            wValid ? `TNK: ${tnk} mg IV single bolus (0.5 mg/kg x ${weightKg.toFixed(0)} kg, max 50 mg)` : "TNK: 0.5 mg/kg IV single bolus, max 50 mg",
            "Absolute CIs: prior ICH, ischemic stroke <3 mo, active bleeding, aortic dissection",
            "After lysis: transfer IMMEDIATELY to PCI center (pharmacoinvasive strategy)",
          ]},
          { color:T.gold, label:"INFERIOR MI / RV INFARCT", steps:[
            "V4R STE >=1mm = RV involvement -- obtain right-sided leads",
            "HOLD nitrates and diuretics -- preload dependent, will precipitate shock",
            "NS 500 mL IV bolus for hypotension, repeat as needed",
            "Temporary pacing for symptomatic bradycardia or complete heart block",
          ]},
        ].map((sect,i) => (
          <div key={i} style={{ marginBottom:10, padding:"12px 14px", borderRadius:10,
            background:`${sect.color}09`, border:`1px solid ${sect.color}33`, borderLeft:`3px solid ${sect.color}` }}>
            <div style={{ fontFamily:FF.mono, fontSize:8,
              color:sect.color, letterSpacing:1.5, textTransform:"uppercase",
              marginBottom:8 }}>{sect.label}</div>
            {sect.steps.map((step,j) => (
              <div key={j} style={{ display:"flex", gap:8, alignItems:"flex-start", marginBottom:6 }}>
                <span style={{ color:sect.color, fontSize:8, marginTop:3, flexShrink:0 }}>-</span>
                <span style={{ fontFamily:FF.sans,
                  fontSize:12, color:T.txt2, lineHeight:1.6 }}>{step}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// === RETURN PRECAUTIONS ===================================================
function ReturnPrecautions() {
  const [copied, setCopied] = useState(false);
  const text = [
    "RETURN TO THE EMERGENCY DEPARTMENT IMMEDIATELY if you experience:",
    "- Chest pain, pressure, or tightness",
    "- Shortness of breath or difficulty breathing",
    "- Rapid or irregular heartbeat / palpitations",
    "- Sweating, nausea, or feeling faint",
    "- Pain spreading to arm, jaw, neck, or back",
    "- Sudden dizziness or loss of consciousness",
    "",
    "FOLLOW-UP: See your doctor or cardiologist within 72 hours.",
    "Take aspirin 81 mg daily unless instructed otherwise.",
  ].join("\n");
  return (
    <div style={{ marginBottom:12, padding:"12px 14px", borderRadius:10,
      background:"rgba(0,229,192,0.07)", border:"1px solid rgba(0,229,192,0.3)" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <div style={{ fontFamily:FF.mono, fontSize:8, color:T.teal, letterSpacing:1.5, textTransform:"uppercase" }}>
          Patient Return Precautions
        </div>
        <button onClick={() => navigator.clipboard && navigator.clipboard.writeText(text).then(
            () => { setCopied(true); setTimeout(()=>setCopied(false),2500); })}
          style={{ padding:"5px 11px", borderRadius:6, cursor:"pointer", fontFamily:FF.mono, fontSize:8, fontWeight:700,
            border:`1px solid ${copied ? T.teal+"88" : T.teal+"44"}`,
            background:copied ? "rgba(0,229,192,0.15)" : "transparent", color:T.teal }}>
          {copied ? "COPIED" : "COPY"}
        </button>
      </div>
      {["Return immediately for chest pain, pressure, tightness, or shortness of breath",
        "Return for sweating, palpitations, pain radiating to arm/jaw/neck/back, or fainting",
        "Return for sudden dizziness or loss of consciousness",
        "Follow up with your doctor within 72 hours",
        "Take aspirin 81 mg daily unless your doctor says otherwise",
      ].map((item, i) => (
        <div key={i} style={{ display:"flex", gap:7, alignItems:"flex-start", marginBottom:5 }}>
          <span style={{ color:T.teal, fontSize:9, marginTop:2, flexShrink:0 }}>></span>
          <span style={{ fontFamily:FF.sans, fontSize:12,
            color:T.txt2, lineHeight:1.55 }}>{item}</span>
        </div>
      ))}
    </div>
  );
}

// ═══ GUIDED WORKFLOW ════════════════════════════════════════════════════════════
// Steps: welcome → H → E → A → R → T (HEART) → troponin values → EDACS → dispo
// Each HEART component gets its own screen with large-target option cards.
// ════════════════════════════════════════════════════════════════════════

const GUIDED_STEPS = [
  { id:"welcome",  label:"",                type:"welcome"  },
  { id:"history",  label:"History",         type:"heart",   heartKey:"history"    },
  { id:"ecg",      label:"ECG",             type:"heart",   heartKey:"ecg"        },
  { id:"age",      label:"Age",             type:"heart",   heartKey:"age"        },
  { id:"risk",     label:"Risk Factors",    type:"heart",   heartKey:"risk"       },
  { id:"trop_h",   label:"Troponin (HEART)",type:"heart",   heartKey:"troponin_h" },
  { id:"trop_val", label:"Troponin Values", type:"troponin" },
  { id:"edacs",    label:"EDACS Screen",    type:"edacs"    },
  { id:"dispo",    label:"Disposition",     type:"dispo"    },
];

function GuidedHeader({ step, total, label, color, onTabsSwitch }) {
  const pct = step === 0 ? 0 : Math.round((step / (total - 1)) * 100);
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {step > 0 && (
            <div style={{ fontFamily:FF.mono, fontSize:9, color:T.txt4, letterSpacing:1 }}>
              STEP {step} / {total - 1}
            </div>
          )}
          {label && (
            <div style={{ fontFamily:FF.serif, fontSize:14, fontWeight:700, color:color || T.txt2 }}>
              {label}
            </div>
          )}
        </div>
        <button onClick={onTabsSwitch}
          style={{ fontFamily:FF.mono, fontSize:8, padding:"3px 10px", borderRadius:6, cursor:"pointer",
            letterSpacing:1, textTransform:"uppercase", border:"1px solid rgba(26,53,85,0.6)",
            background:"transparent", color:T.txt4 }}>
          Reference →
        </button>
      </div>
      {step > 0 && (
        <div style={{ height:4, borderRadius:2, background:"rgba(26,53,85,0.5)" }}>
          <div style={{ height:"100%", borderRadius:2, width:`${pct}%`, transition:"width .3s ease",
            background:`linear-gradient(90deg,${T.coral},${T.blue})` }} />
        </div>
      )}
    </div>
  );
}

function GuidedOption({ opt, selected, color, onSelect }) {
  const isSel = selected === opt.val;
  return (
    <button onClick={() => onSelect(opt.val)}
      style={{ display:"flex", alignItems:"center", gap:14, width:"100%", minHeight:64, padding:"14px 16px",
        borderRadius:12, cursor:"pointer", textAlign:"left",
        border:`1.5px solid ${isSel ? color+"88" : "rgba(26,53,85,0.6)"}`, marginBottom:10, transition:"all .12s",
        background:isSel
          ? `linear-gradient(135deg,${color}20,${color}08)`
          : "rgba(5,13,32,0.75)", borderLeft:`4px solid ${isSel ? color : "rgba(26,53,85,0.45)"}` }}>
      <div style={{ width:36, height:36, borderRadius:"50%", flexShrink:0,
        display:"flex", alignItems:"center", justifyContent:"center", background:isSel ? color : "rgba(14,36,70,0.7)",
        fontFamily:FF.mono, fontWeight:900, fontSize:16, color:isSel ? "#050f1e" : T.txt4 }}>
        {opt.val}
      </div>
      <div style={{ flex:1 }}>
        <div style={{ fontFamily:FF.sans, fontWeight:600, fontSize:14, color:isSel ? color : T.txt }}>
          {opt.label}
        </div>
        {opt.sub && (
          <div style={{ fontFamily:FF.sans, fontSize:11, color:T.txt4, marginTop:3, lineHeight:1.45 }}>
            {opt.sub}
          </div>
        )}
      </div>
      {isSel && (
        <div style={{ width:22, height:22, borderRadius:"50%", flexShrink:0,
          background:color, display:"flex", alignItems:"center",
          justifyContent:"center", color:"#050f1e", fontSize:13, fontWeight:900 }}>
          ✓
        </div>
      )}
    </button>
  );
}

function GuidedWorkflow({
  step, setStep,
  heartScores, setHeartScores,
  t0,setT0,t1,setT1,t2,setT2,uln,setULN,unit,setUnit,tropMode,setTropMode,
  edacsFields,setEdacsFields,edacsNegTrop,setEdacsNegTrop,
  tropResult,tropInterp,heartTotal,edacsScore,
  wellsScore,wellsInterResult,addrsScore,addrsResult,
  onTabsSwitch,onReset,
}) {
  const current   = GUIDED_STEPS[step];
  const heartItem = current.heartKey ? HEART_ITEMS.find(i => i.key === current.heartKey) : null;
  const handleHeartSelect = useCallback((key, val) => {
    setHeartScores(p => ({ ...p, [key]:val }));
    setTimeout(() => setStep(s => s+1), 200);
  }, [setHeartScores, setStep]);
  const canAdvanceTrop  = t0 !== "";
  const canAdvanceEdacs = (parseInt(edacsFields.age)||0) >= 18;
  const stepIdx = GUIDED_STEPS.findIndex(s => s.id === current.id);

  // WELCOME
  if (current.type === "welcome") return (
    <div className="cph-fade">
      <GuidedHeader step={0} total={GUIDED_STEPS.length} label="" onTabsSwitch={onTabsSwitch} />
      <div style={{ textAlign:"center", padding:"24px 0 32px" }}>
        <div style={{ fontSize:52, marginBottom:16 }}>❤️</div>
        <h2 style={{ fontFamily:FF.serif, fontSize:"clamp(22px,5vw,34px)", fontWeight:900,
          color:T.txt, letterSpacing:-0.5, marginBottom:8 }}>Chest Pain Evaluation</h2>
        <p style={{ fontFamily:FF.sans, fontSize:13, color:T.txt3, lineHeight:1.65,
          maxWidth:340, margin:"0 auto 32px" }}>
          Guided bedside workflow. Complete each screen in sequence for a risk-stratified disposition.
        </p>
        <div style={{ display:"flex", flexDirection:"column", gap:10, maxWidth:380, margin:"0 auto" }}>
          <button onClick={() => setStep(1)}
            style={{ width:"100%", minHeight:58, borderRadius:13, cursor:"pointer",
              fontFamily:FF.sans, fontWeight:700, fontSize:16, border:"1.5px solid rgba(255,107,107,0.5)",
              background:"linear-gradient(135deg,rgba(255,107,107,0.18),rgba(255,107,107,0.06))", color:T.coral }}>
            Start Evaluation →
          </button>
          <button onClick={onTabsSwitch}
            style={{ width:"100%", minHeight:44, borderRadius:10, cursor:"pointer",
              fontFamily:FF.sans, fontWeight:600, fontSize:13,
              border:"1px solid rgba(26,53,85,0.55)", background:"transparent", color:T.txt4 }}>
            Open Reference Mode
          </button>
        </div>
      </div>
      {heartTotal !== null && (
        <div style={{ padding:"10px 14px", borderRadius:9,
          background:"rgba(0,229,192,0.07)", border:"1px solid rgba(0,229,192,0.25)",
          fontFamily:FF.sans, fontSize:11, color:T.teal, textAlign:"center" }}>
          Previous evaluation in progress — tap Start to continue
        </div>
      )}
    </div>
  );

  // HEART steps (one branch handles all 5 via heartItem)
  if (current.type === "heart" && heartItem) return (
    <div className="cph-fade">
      <GuidedHeader step={stepIdx} total={GUIDED_STEPS.length}
        label={heartItem.label} color={heartItem.color} onTabsSwitch={onTabsSwitch} />
      <div style={{ fontFamily:FF.sans, fontSize:12, color:T.txt3, marginBottom:14, lineHeight:1.55 }}>
        {heartItem.hint}
      </div>
      {heartItem.options.map(opt => (
        <GuidedOption key={opt.val} opt={opt} selected={heartScores[heartItem.key]}
          color={heartItem.color} onSelect={v => handleHeartSelect(heartItem.key, v)} />
      ))}
      <div style={{ display:"flex", gap:10, marginTop:4 }}>
        <NavBtn active onClick={() => setStep(s => s-1)} c={T.txt3} compact>← Back</NavBtn>
        <NavBtn active={heartScores[heartItem.key] !== undefined}
          onClick={() => heartScores[heartItem.key] !== undefined && setStep(s => s+1)}
          c={heartItem.color}>Next →</NavBtn>
      </div>
    </div>
  );

  // TROPONIN step — delegates to existing TroponinTab
  if (current.type === "troponin") return (
    <div className="cph-fade">
      <GuidedHeader step={stepIdx} total={GUIDED_STEPS.length}
        label="Troponin Values" color={T.blue} onTabsSwitch={onTabsSwitch} />
      <TroponinTab t0={t0} setT0={setT0} t1={t1} setT1={setT1} t2={t2} setT2={setT2}
        uln={uln} setULN={setULN} unit={unit} setUnit={setUnit} mode={tropMode} setMode={setTropMode} />
      <div style={{ display:"flex", gap:10, marginTop:12 }}>
        <NavBtn active onClick={() => setStep(s => s-1)} c={T.txt3} compact>← Back</NavBtn>
        <NavBtn active={canAdvanceTrop} onClick={() => canAdvanceTrop && setStep(s => s+1)} c={T.blue}>Next →</NavBtn>
      </div>
      <SkipBtn onClick={() => setStep(s => s+1)}>Skip — troponin pending / not yet resulted</SkipBtn>
    </div>
  );

  // EDACS step — delegates to existing EdacsTab
  if (current.type === "edacs") return (
    <div className="cph-fade">
      <GuidedHeader step={stepIdx} total={GUIDED_STEPS.length}
        label="EDACS Screen" color={T.purple} onTabsSwitch={onTabsSwitch} />
      <EdacsTab fields={edacsFields} setFields={setEdacsFields}
        negTrop={edacsNegTrop} setNegTrop={setEdacsNegTrop} />
      <div style={{ display:"flex", gap:10, marginTop:12 }}>
        <NavBtn active onClick={() => setStep(s => s-1)} c={T.txt3} compact>← Back</NavBtn>
        <NavBtn active={canAdvanceEdacs} onClick={() => canAdvanceEdacs && setStep(s => s+1)} c={T.purple}>View Disposition →</NavBtn>
      </div>
      <SkipBtn onClick={() => setStep(s => s+1)}>Skip EDACS</SkipBtn>
    </div>
  );

  // DISPO step — delegates to existing DispoTab
  if (current.type === "dispo") {
    const rec = dispositionRec(heartTotal, tropInterp);
    return (
      <div className="cph-fade">
        <GuidedHeader step={stepIdx} total={GUIDED_STEPS.length}
          label="Disposition" color={rec ? rec.color : T.teal} onTabsSwitch={onTabsSwitch} />
        <DispoTab heartScore={heartTotal} tropInterp={tropInterp}
          edacsScore={edacsScore} edacsNegTrop={edacsNegTrop} tropResult={tropResult}
          wellsScore={wellsScore} wellsInterResult={wellsInterResult}
          addrsScore={addrsScore} addrsResult={addrsResult} />
        <div style={{ display:"flex", gap:10, marginTop:12 }}>
          <NavBtn active onClick={() => setStep(s => s-1)} c={T.txt3} compact>← Back</NavBtn>
          <NavBtn active onClick={onTabsSwitch} c={T.blue}>Full Reference →</NavBtn>
        </div>
        <button onClick={onReset}
          style={{ width:"100%", marginTop:10, minHeight:44, borderRadius:10, cursor:"pointer",
            fontFamily:FF.sans, fontWeight:600, fontSize:12, border:"1px solid rgba(255,107,107,0.35)",
            background:"rgba(255,107,107,0.06)", color:T.coral }}>
          New Patient — Reset All
        </button>
      </div>
    );
  }

  return null;
}

export default function ChestPainHub({ embedded = false, onBack }) {
  const [tab,        setTab]        = useState("heart");
  const [uiMode,     setUiMode]     = useState("guided");   // "guided" | "tabs"
  const [guidedStep, setGuidedStep] = useState(0);

  // HEART
  const [heartScores, setHeartScores] = useState({});

  // Troponin — lifted so DispoTab, SummaryStrip, and HST logic can all read it
  const [t0, setT0] = useState(""); const [t1, setT1] = useState("");
  const [t2, setT2] = useState(""); const [uln, setULN] = useState("0.04");
  const [unit, setUnit] = useState("ng/mL"); const [mode, setMode] = useState("conventional");

  // EDACS — lifted so state persists across tab switches
  const [edacsFields, setEdacsFields] = useState({
    age:"", sex:"M", diaphoresis:false, radiation:false, inspiratory:false, palpation:false, knownCAD:false,
  });
  const [edacsNegTrop, setEdacsNegTrop] = useState(true);

  // DDx — lifted so state persists across tab switches
  const [ddxSub, setDdxSub] = useState("pe");
  const [wells,  setWells]  = useState({});
  const [perc,   setPerc]   = useState({});
  const [addrs,  setAddrs]  = useState({});

  // Protocol expanded state -- persistent
  const [protocolExpanded, setProtocolExpanded] = useState(null);
  // P2-P5: vitals, weight, trop arrival timestamp, STEMI overlay
  const [sbp,             setSbp]             = useState("");
  const [hr,              setHr]              = useState("");
  const [weight,          setWeight]          = useState("");
  const [weightUnit,      setWeightUnit]      = useState("kg");
  const [tropArrivalTime, setTropArrivalTime] = useState(null);
  const [stemiOpen,       setStemiOpen]       = useState(false);

  const heartTotal = useMemo(() => {
    const vals = HEART_ITEMS.map(i => heartScores[i.key]);
    if (vals.some(v => v === undefined)) return null;
    return vals.reduce((s, v) => s + v, 0);
  }, [heartScores]);

  const tropResult = useMemo(() => calcTrop(t0,t1,t2,uln), [t0,t1,t2,uln]);

  // HST fix: derive tropInterp from the correct protocol
  const tropInterp = useMemo(() => {
    if (mode === "hst") {
      const r = evalHST(t0, t1);
      if (!r) return null;
      if (r.result === "rule_out") return "normal";
      if (r.result === "rule_in")  return "acs";
      return "elevated";
    }
    return tropResult ? tropResult.interp : null;
  }, [mode, t0, t1, tropResult]);

  const edacsScore = useMemo(() => {
    const a = parseInt(edacsFields.age) || 0;
    return a >= 18 ? calcEDACS(edacsFields) : null;
  }, [edacsFields]);

  const wellsScore       = useMemo(() => WELLS_ITEMS.reduce((s,i) => s + (wells[i.key] ? i.pts : 0), 0), [wells]);
  const wellsInterResult = useMemo(() => wellsInterp(wellsScore), [wellsScore]);
  const addrsScore       = useMemo(() => ADDRS_ITEMS.reduce((s,i) => s + (addrs[i.key] ? 1 : 0), 0), [addrs]);
  const addrsResult      = useMemo(() => addrsInterp(addrsScore), [addrsScore]);

  const weightKg = useMemo(() => {
    const w = parseFloat(weight);
    return (!isNaN(w) && w > 0) ? (weightUnit==="lbs" ? w*0.453592 : w) : null;
  }, [weight, weightUnit]);

  const handleBack = useCallback(() => {
    if (onBack) onBack(); else window.history.back();
  }, [onBack]);

  return (
    <div style={{ fontFamily:FF.sans, background:embedded ? "transparent" : T.bg,
      minHeight:embedded ? "auto" : "100vh", color:T.txt }}>
      <div style={{ maxWidth:900, margin:"0 auto", padding:embedded ? "0" : "0 16px" }}>

        {!embedded && (
          <div style={{ padding:"18px 0 14px" }}>
            <button onClick={handleBack}
              style={{ marginBottom:10, display:"inline-flex", alignItems:"center", gap:7,
                fontFamily:FF.sans, fontSize:12, fontWeight:600,
                padding:"5px 14px", borderRadius:8, background:"rgba(5,15,30,0.85)",
                border:"1px solid rgba(26,53,85,0.65)", color:T.txt3, cursor:"pointer" }}>
              ← Back to Hub
            </button>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
              <div style={{ background:"rgba(5,13,32,0.92)", border:"1px solid rgba(26,53,85,0.65)",
                borderRadius:10, padding:"5px 12px", display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontFamily:FF.mono, fontSize:10, color:T.purple, letterSpacing:3 }}>NOTRYA</span>
                <span style={{ color:T.txt4, fontFamily:FF.mono, fontSize:10 }}>/</span>
                <span style={{ fontFamily:FF.mono, fontSize:10, color:T.txt3, letterSpacing:2 }}>CHEST PAIN</span>
              </div>
              <div style={{ height:1, flex:1, background:"linear-gradient(90deg,rgba(255,107,107,0.5),transparent)" }} />
            </div>
            <h1 className="shimmer-cph"
              style={{ fontFamily:FF.serif, fontSize:"clamp(22px,4vw,38px)",
                fontWeight:900, letterSpacing:-0.5, lineHeight:1.1 }}>
              Chest Pain Hub
            </h1>
            <p style={{ fontFamily:FF.sans, fontSize:12, color:T.txt4, marginTop:4 }}>
              HEART Score · Serial Troponin · EDACS · PE / Dissection / Pericarditis · ACS Protocol · Disposition
            </p>
          </div>
        )}

        {/* Mode toggle */}
        <div style={{ display:"flex", gap:6, marginBottom:12 }}>
          {[
            {id:"guided",  label:"🎯 Guided",    desc:"Bedside workflow"},
            {id:"tabs",    label:"📚 Reference", desc:"All tools"},
          ].map(m => (
            <button key={m.id} onClick={() => setUiMode(m.id)}
              style={{ flex:1, padding:"9px 12px", borderRadius:10, cursor:"pointer",
                fontFamily:FF.sans, fontWeight:600, fontSize:12,
                border:`1.5px solid ${uiMode===m.id ? T.coral+"66" : "rgba(26,53,85,0.55)"}`, background:uiMode===m.id
                  ? "linear-gradient(135deg,rgba(255,107,107,0.15),rgba(255,107,107,0.05))"
                  : "rgba(5,13,32,0.7)", color:uiMode===m.id ? T.coral : T.txt4 }}>
              {m.label}
              <div style={{ fontFamily:FF.mono, fontSize:8, color:uiMode===m.id ? T.coral : T.txt4, opacity:0.7,
                letterSpacing:0.5, marginTop:2 }}>{m.desc}</div>
            </button>
          ))}
        </div>

        {/* Vitals bar */}
        <VitalsBar sbp={sbp} setSbp={setSbp} hr={hr} setHr={setHr}
          weight={weight} weightUnit={weightUnit}
          setWeight={setWeight} setWeightUnit={setWeightUnit}
          tropArrivalTime={tropArrivalTime}
          setTropArrivalTime={setTropArrivalTime} t0={t0} />

        {/* STEMI fast lane */}
        <button onClick={() => setStemiOpen(true)}
          style={{ width:"100%", minHeight:44, borderRadius:10, cursor:"pointer",
            marginBottom:12, fontFamily:FF.sans, fontWeight:700, fontSize:13, border:"1.5px solid rgba(255,68,68,0.55)",
            background:"linear-gradient(135deg,rgba(255,68,68,0.15),rgba(255,68,68,0.05))",
            color:T.red, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          STEMI Activation Protocol
          <span style={{ fontFamily:FF.mono, fontSize:9,
            color:"rgba(255,68,68,0.6)" }}>TAP TO OPEN</span>
        </button>
        <STEMIOverlay open={stemiOpen} onClose={() => setStemiOpen(false)} weightKg={weightKg} />

        {uiMode === "guided" ? (
          <GuidedWorkflow
            step={guidedStep} setStep={setGuidedStep}
            heartScores={heartScores} setHeartScores={setHeartScores}
            t0={t0} setT0={setT0} t1={t1} setT1={setT1}
            t2={t2} setT2={setT2} uln={uln} setULN={setULN}
            tropMode={mode} setTropMode={setMode}
            edacsFields={edacsFields} setEdacsFields={setEdacsFields}
            edacsNegTrop={edacsNegTrop} setEdacsNegTrop={setEdacsNegTrop}
            tropResult={tropResult} tropInterp={tropInterp}
            heartTotal={heartTotal} edacsScore={edacsScore}
            wellsScore={wellsScore} wellsInterResult={wellsInterResult}
            addrsScore={addrsScore} addrsResult={addrsResult}
            onTabsSwitch={() => setUiMode("tabs")}
            onReset={() => {
              setHeartScores({}); setT0(""); setT1(""); setT2("");
              setULN("0.04"); setMode("conventional");
              setEdacsFields({ age:"", sex:"M", diaphoresis:false,
                radiation:false, inspiratory:false, palpation:false, knownCAD:false });
              setEdacsNegTrop(true);
              setWells({}); setPerc({}); setAddrs({});
              setTropArrivalTime(null);
              setGuidedStep(0);
            }}
          />
        ) : (
          <>
            <div style={{ display:"flex", gap:4, flexWrap:"wrap", padding:"6px",
              marginBottom:12, background:"rgba(5,13,32,0.85)",
              border:"1px solid rgba(26,53,85,0.55)", borderRadius:12 }}>
              {TABS.map(t => (
                <TabBtn key={t.id} tab={t} active={tab===t.id}
                  onClick={() => setTab(t.id)} />
              ))}
            </div>
            <SummaryStrip heartScore={heartTotal} tropInterp={tropInterp}
              edacsScore={edacsScore} edacsNegTrop={edacsNegTrop} />
            <div>
              {tab === "heart"    && <HeartTab scores={heartScores}
                setScores={setHeartScores} tropInterp={tropInterp} />}
              {tab === "troponin" && <TroponinTab t0={t0} setT0={setT0}
                t1={t1} setT1={setT1} t2={t2} setT2={setT2}
                uln={uln} setULN={setULN} unit={unit} setUnit={setUnit}
                mode={mode} setMode={setMode} />}
              {tab === "edacs"    && <EdacsTab fields={edacsFields}
                setFields={setEdacsFields} negTrop={edacsNegTrop}
                setNegTrop={setEdacsNegTrop} />}
              {tab === "ddx"      && <DifferentialsTab ddxSub={ddxSub}
                setDdxSub={setDdxSub} wells={wells} setWells={setWells}
                perc={perc} setPerc={setPerc} addrs={addrs} setAddrs={setAddrs} />}
              {tab === "protocol" && <ProtocolTab expanded={protocolExpanded}
                setExpanded={setProtocolExpanded} weightKg={weightKg} />}
              {tab === "dispo"    && <DispoTab heartScore={heartTotal}
                tropInterp={tropInterp} edacsScore={edacsScore}
                edacsNegTrop={edacsNegTrop} tropResult={tropResult}
                wellsScore={wellsScore} wellsInterResult={wellsInterResult}
                addrsScore={addrsScore} addrsResult={addrsResult} />}
            </div>
          </>
        )}

        {!embedded && (
          <div style={{ textAlign:"center", padding:"24px 0 16px",
            fontFamily:FF.mono, fontSize:8, color:T.txt4, letterSpacing:1.5 }}>
            NOTRYA CHEST PAIN HUB · CLINICAL DECISION SUPPORT ONLY
            · HEART (BACKUS 2010) · ESC 0/1H · EDACS (FLAWS 2016)
            · WELLS PE · ADD-RS (ROGERS 2011) · ACC/AHA 2021 · ACEP 2024
          </div>
        )}
      </div>
    </div>
  );
}