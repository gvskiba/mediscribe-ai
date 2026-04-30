// ChestPainLogic.js — Notrya ChestPainHub data, tokens, and pure functions
// No JSX, no React imports

export const T = {
  bg:"#050f1e", txt:"#e8f0fe", txt2:"#8aaccc", txt3:"#8ab8d8", txt4:"#638ab5",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0", red:"#ff4444",
};
export const FF = { mono:"'JetBrains Mono',monospace", sans:"'DM Sans',sans-serif", serif:"'Playfair Display',serif" };

export const TABS = [
  { id:"heart",    label:"HEART",    icon:"💓", color:T.coral  },
  { id:"troponin", label:"Troponin", icon:"🔬", color:T.blue   },
  { id:"edacs",    label:"EDACS",    icon:"🧮", color:T.purple },
  { id:"ddx",      label:"DDx",      icon:"🔍", color:T.orange },
  { id:"protocol", label:"Protocol", icon:"⚡",    color:T.gold   },
  { id:"dispo",    label:"Dispo",    icon:"🚪", color:T.teal   },
];

// === GRACE SCORE =============================================================
export function calcGRACE({ age, hr, sbp, creatinine, killip, cardiacArrest, stDev, enzymes }) {
  const a=parseInt(age), h=parseInt(hr), s=parseInt(sbp), cr=parseFloat(creatinine);
  if (!a||!h||!s) return null;
  let p=0;
  p+=a<40?0:a<50?18:a<60?36:a<70?55:a<80?73:a<90?91:100;
  p+=h<50?0:h<70?3:h<90?9:h<110?15:h<150?24:h<200?38:46;
  p+=s<80?58:s<100?53:s<120?43:s<140?34:s<160?24:s<200?10:0;
  if(!isNaN(cr)&&cr>0)p+=cr<0.4?1:cr<0.8?4:cr<1.2?7:cr<1.6?10:cr<2.0?13:cr<4.0?21:28;
  p+=([0,20,39,59][(parseInt(killip)||1)-1]||0);
  if(cardiacArrest)p+=39; if(stDev)p+=28; if(enzymes)p+=14;
  return p;
}

export function graceInterp(score) {
  if (score===null) return null;
  if (score<125) return { label:"Low Risk",          color:T.teal,  mortality:"< 3%",
    rec:"Ischemia-guided strategy — invasive evaluation within 48–72h" };
  if (score<155) return { label:"Intermediate Risk", color:T.gold,  mortality:"3–5%",
    rec:"Early invasive strategy — catheterization within 24h" };
  return           { label:"High Risk",            color:T.coral, mortality:"> 5%",
    rec:"Urgent invasive strategy — catheterization within 2h if ongoing ischemia" };
}

// === SPESI ===================================================================
export const SPESI_ITEMS = [
  { key:"sp_age",   label:"Age > 80 years"                      },
  { key:"sp_can",   label:"Active cancer"                        },
  { key:"sp_card",  label:"Chronic cardiopulmonary disease"      },
  { key:"sp_hr",    label:"HR ≥ 110 bpm (auto from vitals)" },
  { key:"sp_sbp",   label:"SBP < 100 mmHg (auto from vitals)"   },
  { key:"sp_spo2",  label:"SpO2 < 90%"                          },
];
export function spesiInterp(score) {
  if (score===0) return { label:"Class I — Low Risk",   color:T.teal,  mortality:"~1%",
    rec:"Consider outpatient treatment or early discharge protocol" };
  return           { label:"Class II+ — Higher Risk", color:T.coral, mortality:"~11%",
    rec:"Hospital admission. Hemodynamic instability → catheter-directed or systemic lytics" };
}

export function calcCrCl(age, weightKg, sex, creatinine) {
  const a=parseInt(age), cr=parseFloat(creatinine);
  if(!a||!weightKg||isNaN(cr)||cr<=0) return null;
  return Math.round(((140-a)*weightKg*(sex==="F"?0.85:1))/(72*cr));
}

// ═══ HEART SCORE ═══════════════════════════════════════
export const HEART_ITEMS = [
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

export function heartStrata(score) {
  if (score <= 3) return { label:"Low Risk",      color:T.teal,  mace:"0.9–1.7%", rec:"Consider early discharge with outpatient follow-up" };
  if (score <= 6) return { label:"Moderate Risk", color:T.gold,  mace:"12–16.6%", rec:"Serial troponin, admission or observation for further evaluation" };
  return               { label:"High Risk",      color:T.coral, mace:"50–65%",   rec:"Cardiology consult, admit, likely invasive strategy" };
}

// ═══ TROPONIN ═════════════════════════════════════════════════
export const TROPONIN_UNITS = ["ng/mL", "ng/L (hs-cTnI)", "µg/L"];
export const HST = { ruleOut_0h:5, ruleIn_0h:52, ruleOut_delta:3, ruleIn_delta:6 };

export function evalHST(t0, t1) {
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

export function calcTrop(t0, t1, t2, ulnInput) {
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
  let trend = null;
  if (!isNaN(v1)) {
    const pct = (v1 - v0) / Math.max(v0, 0.001);
    if (pct >= 0.2)        trend = { arrow:"↑↑", label:"Rising rapidly", color:T.coral };
    else if (pct >= 0.05)  trend = { arrow:"↑",   label:"Rising", color:T.orange };
    else if (pct <= -0.2)  trend = { arrow:"↓↓", label:"Falling rapidly", color:T.teal };
    else if (pct <= -0.05) trend = { arrow:"↓",   label:"Falling", color:T.teal };
    else                   trend = { arrow:"→",   label:"Stable", color:T.blue };
  }
  return { v0, v1, v2, peak, fold, delta, interp, uln, trend };
}

// ═══ EDACS ════════════════════════════════════════════════════
export function calcEDACS(fields) {
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

export function edacsRisk(score, negTrop) {
  if (score < 16 && negTrop) return { label:"Low Risk", color:T.teal,
    rec:"EDACS < 16 with negative troponin — safe for early discharge protocol" };
  return { label:"Not Low Risk", color:T.coral, rec:"EDACS ≥ 16 or positive troponin — standard evaluation pathway" };
}

// ═══ WELLS PE + PERC ═══════════════════════════════════════════
export const WELLS_ITEMS = [
  { key:"dvt_signs",  pts:3,   label:"Clinical signs/symptoms of DVT" },
  { key:"pe_likely",  pts:3,   label:"PE is #1 diagnosis or equally likely as alternative" },
  { key:"hr_gt100",   pts:1.5, label:"Heart rate > 100 bpm" },
  { key:"immobil",    pts:1.5, label:"Immobilization ≥ 3 days or surgery in past 4 weeks" },
  { key:"prior_pe",   pts:1.5, label:"Prior DVT or PE" },
  { key:"hemoptysis", pts:1,   label:"Hemoptysis" },
  { key:"malignancy", pts:1,   label:"Malignancy (active or treated within 6 months)" },
];

export const PERC_ITEMS = [
  { key:"age_lt50",    label:"Age < 50" },
  { key:"hr_lt100",    label:"HR < 100 bpm" },
  { key:"spo2_ok",     label:"SpO2 ≥ 95% on room air" },
  { key:"no_prior",    label:"No prior DVT/PE" },
  { key:"no_surg",     label:"No surgery/trauma within 4 weeks" },
  { key:"no_hemopt",   label:"No hemoptysis" },
  { key:"no_estrogen", label:"No exogenous estrogen" },
  { key:"no_leg",      label:"No unilateral leg swelling" },
];

export function wellsInterp(score) {
  if (score <= 1) return { label:"Low Probability", color:T.teal,
    sub:"Apply PERC rule. If all 8 PERC criteria met — PE excluded without further workup.", action:"PERC Rule" };
  if (score <= 6) return { label:"Moderate Probability", color:T.gold,
    sub:"D-dimer. If positive — CTPA. If negative — PE excluded.", action:"D-Dimer" };
  return           { label:"High Probability", color:T.coral,
    sub:"Proceed directly to CTPA. D-dimer not useful at high pre-test probability.", action:"CTPA" };
}

// ═══ ADD-RS ══════════════════════════════════════════════════════════
export const ADDRS_ITEMS = [
  { key:"condition", label:"High-risk condition",
    sub:"Marfan/connective tissue disease, family Hx aortic disease, known aortic valve disease, recent aortic manipulation, known thoracic aortic aneurysm" },
  { key:"pain_feat", label:"High-risk pain features",
    sub:"Abrupt onset, severe intensity, ripping or tearing quality" },
  { key:"exam_feat", label:"High-risk exam features",
    sub:"Pulse deficit or SBP differential >20 mmHg, focal neuro deficit + pain, aortic regurgitation murmur (new)" },
];

export function addrsInterp(score) {
  if (score === 0) return { label:"Low Risk", color:T.teal,
    rec:"ADD-RS 0 — D-dimer (>500 ng/mL) if clinical suspicion warrants. CXR + ECG to exclude other causes." };
  if (score === 1) return { label:"Intermediate Risk", color:T.gold,
    rec:"ADD-RS 1 — CT Aortogram (chest/abdomen/pelvis, arterial phase) or TEE. Do not delay imaging if hemodynamically unstable. Order as 'CTA aorta' not generic CT chest." };
  return           { label:"High Risk", color:T.coral,
    rec:"ADD-RS 2–3 — Emergent CT Aortogram or TEE. IV access ×2, type & screen, cardiac surgery notification. Avoid anticoagulation/thrombolytics until dissection excluded. Order specifically as 'CT Aortogram' (arterial phase, chest + abdomen + pelvis)." };
}

// ═══ ACS PROTOCOL ═══════════════════════════════════════════════════
export const ACS_STEPS = [
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

// ═══ DISPOSITION ══════════════════════════════════════════════════════════
export function dispositionRec(heartScore, tropInterp) {
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

// DDx reference data
export const DDX_REF = {
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

export const DDX_TABS = [
  { id:"pe",       label:"PE",          color:T.blue   },
  { id:"dissect",  label:"Dissection",  color:T.coral  },
  { id:"peri",     label:"Pericarditis",color:T.purple },
  { id:"pneumo",   label:"Pneumothorax",color:T.teal   },
  { id:"boerhaave",label:"Esophageal",  color:T.orange },
];

export const GUIDED_STEPS = [
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