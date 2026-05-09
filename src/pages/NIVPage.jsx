import { useState } from "react";
import { useNavigate } from "react-router-dom";

const T = {
  bg:"#050f1e",panel:"#081628",card:"#0b1e36",up:"#0e2544",b:"rgba(26,53,85,0.8)",
  txt:"#e8f0fe",txt2:"#8aaccc",txt3:"#4a6a8a",txt4:"#2e4a6a",
  coral:"#ff6b6b",gold:"#f5c842",teal:"#00e5c0",blue:"#3b9eff",
  orange:"#ff9f43",purple:"#9b6dff",green:"#3dffa0",cyan:"#00d4ff",
};

const CONDITIONS = [
  {id:"o2",icon:"💨",title:"Supplemental O₂",sub:"Nasal Cannula · Simple Mask · NRB · Venturi",color:"#00d4ff",gl:"rgba(0,212,255,0.07)",br:"rgba(0,212,255,0.28)"},
  {id:"hfnc",icon:"🌊",title:"High-Flow Nasal Cannula",sub:"HFNC · Optiflow · ROX Index · Failure Criteria",color:"#00e5c0",gl:"rgba(0,229,192,0.07)",br:"rgba(0,229,192,0.28)"},
  {id:"cpap",icon:"🪁",title:"CPAP",sub:"APE · Obstructive Sleep Apnea · CPAP Titration",color:"#3b9eff",gl:"rgba(59,158,255,0.07)",br:"rgba(59,158,255,0.28)"},
  {id:"bipap",icon:"💡",title:"BiPAP / NIV",sub:"COPD · Hypercapnic RF · IPAP / EPAP Titration",color:"#ff9f43",gl:"rgba(255,159,67,0.07)",br:"rgba(255,159,67,0.28)"},
];

const OVERVIEW = {
  o2:{def:"Supplemental oxygen should be titrated to SpO₂ targets: 94–98% for most patients; 88–92% for patients with COPD or chronic hypercapnia (to avoid hypercapnia-driven respiratory failure). Excessive oxygen delivery in COPD is associated with worsened outcomes. Use the lowest FiO₂ that achieves the target.",bullets:["NC 1–6 L/min → FiO₂ ≈24–44% · Simple mask 6–10 L/min → FiO₂ ≈35–60%","NRB 10–15 L/min → FiO₂ ≈60–80% (highest non-invasive O₂ delivery)","Venturi mask: precise FiO₂ delivery (24–60%) — best for COPD where titration critical","Target SpO₂ 94–98% most patients · 88–92% COPD/chronic hypercapnia (BTS 2017)","Failure to achieve SpO₂ >88% on NRB → escalate to HFNC or NIV immediately"]},
  hfnc:{def:"High-Flow Nasal Cannula (HFNC) delivers heated, humidified gas at 20–60+ L/min via large-bore nasal prongs, generating low-level CPAP (≈3 cmH₂O per 10 L/min), washout of nasopharyngeal dead space, and improved mucociliary clearance. FLORALI trial: non-inferior to NIV for acute hypoxic respiratory failure, with less discomfort.",bullets:["Start: FiO₂ 1.0, flow 50–60 L/min → titrate FiO₂ down to maintain SpO₂ 94–98%","ROX Index ≥4.88 at 2h (SpO₂/FiO₂ ÷ RR) predicts HFNC success (JACC 2019)","ROX Index <3.47 at 2h OR decline over time → high failure risk → prepare for NIV/intubation","Failure criteria: RR >30 persisting, SpO₂ <90% on max settings, ROX <3.47","Heated humidification (37°C, 44 mg H₂O/L) essential — prevents mucosal drying + secretion retention"]},
  cpap:{def:"CPAP delivers a constant positive pressure throughout the respiratory cycle, increasing FRC and improving V/Q matching. First-line for cardiogenic pulmonary edema (reduces preload and afterload, improves oxygenation). Also used for obstructive sleep apnea and some post-extubation hypoxia states.",bullets:["Starting CPAP: 5–10 cmH₂O → titrate by 2–3 cmH₂O increments q15–20 min to SpO₂ >92%","APE (acute pulmonary edema): CPAP 5–10 cmH₂O — reduces intubation rate (3CPAP trial)","CPAP does NOT provide inspiratory support — use BiPAP if ventilatory failure (elevated pCO₂)","Contraindications: inability to protect airway, hemodynamic instability, vomiting, facial trauma","Failure: no improvement in RR, SpO₂, work of breathing within 1–2h → escalate to BiPAP or intubation"]},
  bipap:{def:"BiPAP (Bilevel Positive Airway Pressure) delivers separate Inspiratory Positive Airway Pressure (IPAP) and Expiratory Positive Airway Pressure (EPAP). IPAP reduces work of breathing and augments tidal volume; EPAP provides PEEP to recruit alveoli and improve oxygenation. Best evidence in COPD exacerbation and hypercapnic respiratory failure.",bullets:["Typical starting settings: IPAP 10–12 cmH₂O, EPAP 4–5 cmH₂O (PS = IPAP - EPAP = 6–8)","Titrate IPAP by 2–3 cmH₂O q15–20 min targeting RR <25 and pCO₂ improvement","COPD exacerbation: NIV reduces intubation by 65%, mortality by 50% (Cochrane 2017)","Adequate interface fit is critical — full-face mask preferred for ED (vs nasal mask)","Failure criteria: worsening pCO₂/pH, progressive fatigue, hemodynamic instability → intubation"]},
};

const WORKUP = {
  o2:[{icon:"📊",label:"SpO₂ on Room Air",detail:"Document baseline SpO₂ on room air AND on current O₂ support. Calculate FiO₂ delivered."},{icon:"🧠",label:"COPD Risk Assessment",detail:"Known COPD or chronic hypercapnia? → target SpO₂ 88–92%. Hyperoxia drives worsening hypercapnia."},{icon:"💨",label:"Work of Breathing",detail:"Accessory muscle use, nasal flaring, paradoxical breathing, RR >25 — signs of impending failure."},{icon:"🦅",label:"ABG / VBG",detail:"Consider if SpO₂ <92%, RR >25, or concern for hypercapnia. pH <7.25 or pCO₂ >50 → escalate."}],
  hfnc:[{icon:"📊",label:"ROX Index at Baseline + 2h",detail:"ROX = (SpO₂/FiO₂) ÷ RR. Calculate at initiation, 2h, 6h, 12h. Trend is more important than single value."},{icon:"🦅",label:"ABG — Baseline + 2h",detail:"pH, pCO₂, pO₂, HCO₃ baseline. Repeat at 2h. CO₂ rising on HFNC → consider BiPAP."},{icon:"🔧",label:"HFNC Tolerance",detail:"Discomfort, nasal dryness, claustrophobia. Adjust temperature, flow, or mask interface."},{icon:"⬆️",label:"Failure Criteria",detail:"SpO₂ <90% on FiO₂ 1.0 / 60 L/min · ROX <3.47 at 2h · RR >30 persisting · pCO₂ rising → escalate."}],
  cpap:[{icon:"🦅",label:"ABG",detail:"Mandatory if hypercapnia suspected. pH <7.30 or pCO₂ >50 in a patient with respiratory distress → BiPAP over CPAP."},{icon:"📊",label:"Clinical Response at 30–60 min",detail:"RR, SpO₂, WOB, patient tolerance. No improvement at 1h → increase CPAP or escalate."},{icon:"🪁",label:"Interface Check",detail:"Mask seal, nose bridge pressure points, strap tension. Poor fit = inadequate CPAP + discomfort."},{icon:"🚫",label:"Contraindications",detail:"Vomiting or inability to protect airway · hemodynamic instability · pneumothorax · facial trauma."}],
  bipap:[{icon:"🦅",label:"ABG at Baseline + 1–2h",detail:"Mandatory. pH, pCO₂, pO₂. Repeat ABG 1–2h after BiPAP initiation. pH >7.30 at 2h predicts success."},{icon:"📊",label:"Clinical Response",detail:"RR, use of accessory muscles, patient synchrony with device, pCO₂ trend."},{icon:"💡",label:"Interface Selection",detail:"Full-face mask preferred in ED. Nasal mask for long-term / comfort. Helmet interface if available."},{icon:"⚠️",label:"Backup Rate",detail:"Set backup RR 10–12 in obtunded patients to prevent apnea. Ensure patient-device synchrony."}],
};

const TREATMENT = {
  o2:[
    {cat:"Nasal Cannula",drug:"Nasal Cannula (NC) 1–6 L/min",dose:"1 L/min ≈ FiO₂ 24% · 2 L/min ≈ 28% · 3 L/min ≈ 32%\n4 L/min ≈ 36% · 5 L/min ≈ 40% · 6 L/min ≈ 44%\nMax 6 L/min (discomfort + mucosal drying above this)\nComfort: may be used with open mouth",renal:"N/A",ivpo:"COPD: NC often best tolerated. Target SpO₂ 88–92%. Use Venturi mask if precise FiO₂ needed.",deesc:"Titrate to lowest FiO₂ achieving target SpO₂. Wean by 1 L/min increments q20–30 min.",note:"Most common supplemental O₂ delivery. Comfortable + allows eating/talking.",ref:"BTS 2017"},
    {cat:"Non-Rebreather Mask",drug:"NRB 10–15 L/min",dose:"Minimum 6 L/min to prevent CO₂ rebreathing\nFiO₂ ≈35% at 6 L/min → 55–60% at 10 L/min\nValves and ports open — allows expired gas to exit",renal:"N/A",ivpo:"Less comfortable than NC for prolonged use. Use NRB if higher FiO₂ needed.",deesc:"Cannot exceed ~60% FiO₂. Upgrade to NRB or HFNC if inadequate.",note:"Minimum 6 L/min to prevent CO₂ accumulation in mask dead space.",ref:"BTS 2017"},
    {cat:"Non-Rebreather Mask",drug:"NRB 10–15 L/min",dose:"10–15 L/min (fill reservoir before applying to face)\nFiO₂ ≈60–80% (varies by fit and flow)\nBag must remain inflated during inhalation\nHigh-flow NRB systems (60+ L/min) can approach FiO₂ 1.0",renal:"N/A",ivpo:"Maximum non-invasive O₂ delivery short of HFNC. May also be used for pre-oxygenation in RSI.",deesc:"Failure to achieve SpO₂ >88% on NRB → escalate to HFNC immediately.",note:"Highest FiO₂ conventional mask. Failure on NRB = indication for HFNC/NIV/intubation.",ref:"BTS 2017"},
    {cat:"Venturi Mask",drug:"Venturi Mask 24–60% FiO₂",dose:"Color-coded adapters: Blue=24% / White=28% / Yellow=35%\nRed=40% / Green=60%\nFlow rate required printed on each adapter\nMost precise FiO₂ delivery of all conventional masks",renal:"N/A",ivpo:"Preferred for COPD to deliver precise FiO₂ and avoid hyperoxia. Titrate to SpO₂ 88–92%.",deesc:"Titrate FiO₂ down as patient improves. Switch to NC when stable at low FiO₂.",note:"Gold standard for COPD titration where precise FiO₂ prevents hypercapnic drive suppression.",ref:"BTS 2017"},
  ],
  hfnc:[
    {cat:"HFNC Initiation",drug:"HFNC (Optiflow/AirVo2)",dose:"Start: FiO₂ 1.0, Flow 50–60 L/min\nTemperature: 37°C (humidified)\nMaintain SpO₂ 92–96%\nTitrate FiO₂ down to maintain SpO₂ — do NOT reduce flow first\nFlow can be reduced to 40 L/min for comfort when FiO₂ ≤0.4",renal:"N/A",ivpo:"Post-extubation HFNC: flow 40 L/min, FiO₂ titrated. Reduces re-intubation in high-risk patients (Hernandez JAMA 2016).",deesc:"Titrate FiO₂ first. Once FiO₂ ≤0.4, reduce flow by 5 L/min q2h.",note:"Do NOT reduce flow below 30 L/min — loses CPAP effect and CO₂ washout benefit.",ref:"FLORALI 2015"},
    {cat:"ROX Index Monitoring",drug:"ROX = (SpO₂ / FiO₂) ÷ RR",dose:"Calculate at: 2h, 6h, 12h after HFNC initiation\n\nROX ≥4.88: low risk of failure (continue HFNC)\nROX 3.47–4.88: intermediate — closely monitor\nROX <3.47: high failure risk — prepare BiPAP/intubation\nDeclining ROX over time → high failure risk regardless of absolute value",renal:"N/A",ivpo:"ROX index validated in HFNC patients with pneumonia. Apply cautiously in other diagnoses.",deesc:"Improvement in ROX + clinical status = reassurance. Wean FiO₂ first, then flow.",note:"Trend is more predictive than single value. Declining ROX = escalate early.",ref:"Roca AJRCCM 2019"},
    {cat:"HFNC Failure Criteria",drug:"Escalation Triggers",dose:"ANY of the following → consider BiPAP or intubation:\n• SpO₂ <90% on FiO₂ 1.0 / 60 L/min\n• RR >30 sustained after 30 min on HFNC\n• ROX Index <3.47 at 2h\n• Worsening pCO₂ on ABG\n• Increasing accessory muscle use / fatigue\n• Altered mental status / obtundation\n• Hemodynamic instability",renal:"N/A",ivpo:"Do NOT delay intubation in the fatiguing patient. HFNC failure leading to emergent intubation has worse outcomes than elective intubation.",deesc:"HFNC success: ROX ≥4.88 at 2h + clinical improvement → continue to wean FiO₂ and flow.",note:"Early recognition of HFNC failure prevents crash intubation. Trend — do not wait for crisis.",ref:"Roca 2019"},
  ],
  cpap:[
    {cat:"CPAP Initiation",drug:"CPAP via full-face mask",dose:"Start: CPAP 5 cmH₂O, FiO₂ 0.4–1.0\nTitrate CPAP by 2–3 cmH₂O q15–20 min\nTypical range: 5–15 cmH₂O\nTarget SpO₂ >92% AND RR <25 AND WOB decreasing",renal:"N/A",ivpo:"APE: CPAP reduces preload/afterload — often dramatic response within 30 min.",deesc:"Wean FiO₂ first. Then reduce CPAP by 2 cmH₂O q2h to a minimum of 5 cmH₂O.",note:"CPAP does NOT provide inspiratory support. For CO₂ retention → BiPAP needed.",ref:"3CPAP 2008"},
    {cat:"APE Protocol",drug:"CPAP + Nitrates",dose:"CPAP 5–10 cmH₂O + FiO₂ titrated\nNitrates: Sublingual NTG 0.4 mg q5 min ×3 (SBP >100)\nIV NTG: start 5 mcg/min, titrate to effect (SBP 100–160 mmHg)\nFurosemide 40–80 mg IV — if volume overloaded\nMorphine: avoid (increases mortality in APE per data)",renal:"Furosemide: dose adjustment if chronic CKD.",ivpo:"IV NTG preferred over sublingual for severe APE (more titratable).",deesc:"Clinical resolution of APE typically within 1–2h. Discontinue CPAP once RR <20 and SpO₂ >94% stable.",note:"CPAP + nitrates (not CPAP alone) is the evidence-based combination for APE.",ref:"3CPAP 2008"},
  ],
  bipap:[
    {cat:"BiPAP Initiation — COPD",drug:"BiPAP via full-face mask",dose:"Start: IPAP 10–12 / EPAP 4–5 cmH₂O\nPS (pressure support) = IPAP - EPAP ≈ 6–8 cmH₂O\nFiO₂: titrate to SpO₂ 88–92% (COPD)\nBackup RR: 10–12/min\nIncrease IPAP by 2–3 cmH₂O q15–20 min → target:\n  RR <25 · pH >7.30 at 1–2h · reduced WOB",renal:"N/A",ivpo:"If pH 7.25–7.35 + RR >25 after 1h → increase IPAP. Max IPAP 20–25 cmH₂O.",deesc:"Wean FiO₂ first. Then reduce IPAP by 2 cmH₂O q2–4h when pCO₂ improving.",note:"ABG at 1–2h after BiPAP initiation is mandatory to assess response.",ref:"Cochrane NIV COPD 2017"},
    {cat:"BiPAP — Hypercapnic RF",drug:"BiPAP (Non-COPD)",dose:"Neuromuscular disease, OHS, central hypoventilation:\nIPAP 12–18 / EPAP 5–6 cmH₂O\nFiO₂: titrate to SpO₂ 94–98% (not COPD target)\nBackup RR 12–16 (higher due to NMD apnea risk)\nAvoid in: uncooperative, unable to protect airway, hemodynamically unstable",renal:"N/A",ivpo:"OHS (obesity hypoventilation): NIV reduces ICU admission and hospitalization.",deesc:"Long-term NIV often required in NMD. Pulmonary/sleep medicine referral at discharge.",note:"Backup rate is critical for NMD patients who may have central apneas.",ref:"GOLD 2023"},
    {cat:"NIV Failure → Intubation",drug:"Escalation Criteria",dose:"ANY of the following after 1–2h optimal NIV:\n• pH <7.25 (deteriorating) or pH <7.20\n• pCO₂ worsening despite IPAP titration\n• SpO₂ <88% on FiO₂ 1.0\n• GCS declining / increasing obtundation\n• Hemodynamic instability\n• Copious secretions / inability to protect airway\n• Patient unable to tolerate interface",renal:"N/A",ivpo:"pH 7.25–7.30 after 1h NIV: continue if improving. pH <7.25: prepare for intubation.",deesc:"Successful NIV: pH >7.30 at 2h + RR <25 + subjective improvement = continue BiPAP.",note:"Do NOT wait for full respiratory arrest. Recognize failure early and proceed to RSI.",ref:"Cochrane 2017"},
  ],
};

const FOLLOWUP = {
  o2:["Reassess SpO₂ and WOB at 15–30 min after any O₂ adjustment","COPD: recheck ABG 30–60 min after O₂ change (hyperoxia can worsen hypercapnia rapidly)","Document exact FiO₂ delivery method and flow rate in chart","If SpO₂ <88% on NRB → escalate to HFNC (next step in oxygen escalation ladder)"],
  hfnc:["Calculate ROX index at 2h. Document in nursing flow sheet.","ROX <3.47 at 2h → alert physician immediately and prepare escalation","Repeat ABG at 2h if baseline concerning for hypercapnia","Monitor for pressure sores at nares and nasal bridge — daily skin assessment","HFNC success criteria: ROX >4.88, SpO₂ stable, RR <25, patient comfortable"],
  cpap:["Reassess clinical response (RR, SpO₂, WOB, consciousness) at 30–60 min","Repeat ABG at 1–2h if baseline hypercapnia or pH abnormal","Monitor CPAP mask interface: pressure points, seal quality, patient comfort","Success: SpO₂ >92%, RR <25, WOB improving, patient tolerating mask — continue to wean","Failure: no improvement at 1h → BiPAP if hypercapnic, intubation if hemodynamically unstable"],
  bipap:["MANDATORY: ABG at 1–2h after BiPAP initiation — pH and pCO₂ trending is the primary assessment","pH >7.30 at 2h with pCO₂ decreasing = NIV success — continue and wean IPAP","COPD patients: at discharge, assess for long-term NIV need (if pCO₂ >52 at baseline pre-hospitalization)","Notify ICU early if pH <7.30 at 2h or if clinical deterioration — intubation is safer when elective","Document: IPAP/EPAP settings, tolerance, ABG response, backup rate used"],
};

const MDM_DATA = {
  hfnc:{fields:[{id:"ind",lbl:"Indication",ph:"e.g., hypoxic RF — not responding to NRB"},{id:"rox",lbl:"ROX Index (SpO₂/FiO₂ ÷ RR)",ph:"e.g., ROX 4.2 at 2h"},{id:"settings",lbl:"HFNC Settings",ph:"e.g., FiO₂ 0.6, 50 L/min"}],t:(f)=>`HFNC initiated for ${f.ind||"acute hypoxic respiratory failure"}. ROX index: ${f.rox||"[calculated at 2h]"}. Settings: ${f.settings||"[FiO₂ and flow rate]"}. Patient monitored for failure criteria (ROX <3.47, RR >30, SpO₂ <90%). Escalation plan discussed. Repeat ROX calculated at 2h and 6h. ABG obtained at initiation and 2h.`},
  cpap:{fields:[{id:"ind",lbl:"Indication",ph:"e.g., acute cardiogenic pulmonary edema"},{id:"set",lbl:"CPAP Settings",ph:"e.g., 7.5 cmH₂O, FiO₂ 0.5"},{id:"resp",lbl:"Response at 30 min",ph:"e.g., RR improved 32 → 22"}],t:(f)=>`CPAP initiated for ${f.ind||"[indication]"}. Settings: ${f.set||"[CPAP / FiO₂]"}. Response at 30 minutes: ${f.resp||"[clinical response]"}. Assessed for CPAP failure criteria. Contraindications reviewed and excluded. ABG obtained if CO₂ retention suspected.`},
  bipap:{fields:[{id:"ind",lbl:"Indication",ph:"e.g., COPD exacerbation with hypercapnia"},{id:"set",lbl:"IPAP / EPAP",ph:"e.g., 14/5 cmH₂O"},{id:"abg",lbl:"ABG at 2h",ph:"e.g., pH 7.32, pCO₂ 58 (improved)"}],t:(f)=>`BiPAP initiated for ${f.ind||"[indication]"}. Settings: IPAP/EPAP ${f.set||"[X/Y]"} cmH₂O with backup RR 12. ABG at 2h: ${f.abg||"[pH / pCO₂ result and trend]"}. NIV failure criteria reviewed and present at bedside. Escalation to intubation discussed with team and patient if initial ABG shows deterioration.`},
};

const ORDER_SETS = {
  hfnc:{label:"HFNC Orders",icon:"🌊",color:T.teal,sets:[
    {title:"HFNC Initiation",text:`HIGH-FLOW NASAL CANNULA\nFiO₂: 1.0 → titrate to SpO₂ 92–96%\nFlow: 50 L/min → titrate\nTemperature: 37°C (heated humidification)\nROX Index: calculate at 2h, 6h, 12h\n  ROX = (SpO₂/FiO₂) ÷ RR\n  ROX <3.47 → notify provider STAT`},
    {title:"Labs + Monitoring",text:`LABS\nABG: now (baseline)\nABG: repeat at 2h\nBMP: now\n\nMONITORING\nSpO₂: continuous\nRR: q15min ×4, then q1h\nROX: q2h (RN to calculate)`},
  ]},
  bipap:{label:"BiPAP Orders",icon:"💡",color:T.orange,sets:[
    {title:"BiPAP Setup",text:`BILEVEL POSITIVE AIRWAY PRESSURE\nIPAP: 10–12 cmH₂O (titrate by 2 q15–20 min)\nEPAP: 4–5 cmH₂O\nFiO₂: titrate to SpO₂ 88–92% (COPD) / 94–98% (other)\nBackup RR: 12/min\nInterface: full-face mask`},
    {title:"Monitoring + Escalation",text:`BIPAP MONITORING\nABG: now (baseline) + at 2h (mandatory)\nSpO₂: continuous · RR: q15min\nNIV SUCCESS CRITERIA (assess at 2h):\n  pH >7.30 · pCO₂ decreasing · RR <25\nNIV FAILURE (notify provider STAT):\n  pH <7.25 · SpO₂ <88% · altered MS`},
  ]},
};

const QUICK_REF = {
  o2:["Target SpO₂: 94–98% most patients · 88–92% COPD/chronic hypercapnia","NC 1–6 L/min ≈ FiO₂ 24–44% · NRB 15 L/min ≈ FiO₂ 60–80%","Venturi mask: most precise FiO₂ delivery for COPD titration","Failure on NRB (SpO₂ <88%) → escalate to HFNC immediately","Hyperoxia in COPD worsens outcomes — titrate to lowest effective FiO₂"],
  hfnc:["Start FiO₂ 1.0 / 50–60 L/min · titrate FiO₂ first, then flow","ROX = (SpO₂/FiO₂) ÷ RR at 2h: >4.88 success · <3.47 high failure","Failure: SpO₂ <90% / RR >30 / ROX <3.47 / CO₂ rising","Never reduce flow below 30 L/min (loses CPAP + washout effect)","Calculate ROX at 2h 6h 12h — document and trend"],
  cpap:["Start 5 cmH₂O · titrate by 2–3 cmH₂O q15–20 min to SpO₂ >92%","APE: CPAP reduces intubation rate by ~50% (3CPAP trial)","CPAP does NOT treat CO₂ — BiPAP needed for hypercapnia","Reassess at 30–60 min: RR, SpO₂, WOB, consciousness","Contraindications: vomiting, unprotected airway, pneumothorax, hemodynamic instability"],
  bipap:["Start: IPAP 10–12 / EPAP 4–5 → titrate IPAP by 2–3 cmH₂O q15–20 min","Mandatory ABG at 2h — pH >7.30 at 2h = NIV success predictor","COPD NIV reduces intubation 65% and mortality 50% (Cochrane 2017)","Failure: pH <7.25 at 2h / worsening CO₂ / altered mental status → intubate","Full-face mask preferred in ED (nasal mask for chronic home use)"],
};

function ROXCalc() {
  const [spo2,setSpo2]=useState("");const [fio2,setFio2]=useState("");const [rr,setRr]=useState("");
  const s=parseFloat(spo2),f=parseFloat(fio2),r=parseFloat(rr);
  const valid=!isNaN(s)&&!isNaN(f)&&!isNaN(r)&&f>0&&r>0;
  const rox=valid?Math.round(((s/f)/r)*100)/100:null;
  const getRisk=v=>v===null?null:v>=4.88?{l:"Low Failure Risk",c:T.green,d:"Continue HFNC — monitor closely"}:v>=3.47?{l:"Intermediate Risk",c:T.gold,d:"Closely monitor — prepare for escalation"}:{l:"High Failure Risk",c:T.coral,d:"Prepare BiPAP or intubation NOW"};
  const risk=getRisk(rox);
  const inp={background:"rgba(14,37,68,0.7)",border:"1px solid rgba(0,229,192,0.3)",borderRadius:8,padding:"8px 10px",color:T.txt,fontFamily:"monospace",fontSize:13,outline:"none"};
  return (
    <div style={{background:"rgba(0,229,192,0.05)",border:"1px solid rgba(0,229,192,0.22)",borderRadius:12,padding:"14px 16px",marginBottom:12}}>
      <div style={{fontSize:11,fontWeight:700,color:T.txt,marginBottom:4}}>📊 ROX Index Calculator</div>
      <div style={{fontSize:9,color:T.txt4,marginBottom:10,fontFamily:"monospace"}}>ROX = (SpO₂ % / FiO₂) ÷ Respiratory Rate</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}>
        {[["SpO₂ (%)",spo2,setSpo2,"97"],["FiO₂ (0–1.0)",fio2,setFio2,"0.6"],["RR (/min)",rr,setRr,"24"]].map(([l,v,sv,ph])=>(
          <div key={l}><div style={{fontSize:8,color:T.txt4,textTransform:"uppercase",marginBottom:3}}>{l}</div><input type="number" placeholder={ph} value={v} onChange={e=>sv(e.target.value)} style={{...inp,width:"100%"}} /></div>
        ))}
      </div>
      {rox!==null&&risk&&(
        <div style={{background:`${risk.c}12`,border:`1px solid ${risk.c}35`,borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:12}}>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:24,fontWeight:700,color:risk.c,fontFamily:"monospace"}}>{rox}</div>
            <div style={{fontSize:9,color:T.txt4}}>ROX</div>
          </div>
          <div style={{flex:1}}><div style={{fontSize:12,fontWeight:700,color:risk.c,marginBottom:3}}>{risk.l}</div><div style={{fontSize:10,color:T.txt2}}>{risk.d}</div></div>
        </div>
      )}
      <div style={{marginTop:8,display:"flex",gap:6}}>
        {[["<3.47",T.coral,"High fail"],["3.47–4.88",T.gold,"Monitor"],["≥4.88",T.green,"Success"]].map(([v,c,l])=>(
          <div key={v} style={{flex:1,textAlign:"center",padding:"5px",background:`${c}10`,border:`1px solid ${c}25`,borderRadius:7}}>
            <div style={{fontSize:11,fontWeight:700,color:c,fontFamily:"monospace"}}>{v}</div>
            <div style={{fontSize:8,color:T.txt4}}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HFNCTracker() {
  const times=["Init","2h","6h","12h","24h"];
  const [rows,setRows]=useState(times.map(t=>({time:t,spo2:"",fio2:"",rr:"",rox:""})));
  const calc=(spo2,fio2,rr)=>{const s=parseFloat(spo2),f=parseFloat(fio2),r=parseFloat(rr);return(!isNaN(s)&&!isNaN(f)&&!isNaN(r)&&f>0&&r>0)?Math.round(((s/f)/r)*100)/100:null;};
  const update=(i,k,v)=>setRows(rows.map((r,idx)=>{if(idx!==i)return r;const nr={...r,[k]:v};nr.rox=calc(idx===i&&k==="spo2"?v:nr.spo2,idx===i&&k==="fio2"?v:nr.fio2,idx===i&&k==="rr"?v:nr.rr);return nr;}));
  const riskColor=v=>v===null?T.txt4:v>=4.88?T.green:v>=3.47?T.gold:T.coral;
  const inp2={background:"rgba(14,37,68,0.6)",border:`1px solid ${T.b}`,borderRadius:5,padding:"4px 6px",color:T.txt,fontFamily:"monospace",fontSize:11,outline:"none",width:"100%",textAlign:"center"};
  return (
    <div style={{background:"rgba(0,229,192,0.04)",border:`1px solid ${T.b}`,borderRadius:12,padding:"12px 14px",marginBottom:10}}>
      <div style={{fontSize:10,fontWeight:700,color:T.teal,marginBottom:8}}>📈 HFNC Trial Tracker — ROX Trend</div>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:10}}>
          <thead><tr>{["Time","SpO₂%","FiO₂","RR","ROX"].map(h=><th key={h} style={{padding:"4px 6px",color:T.txt4,textAlign:"center",fontSize:8,textTransform:"uppercase",letterSpacing:".05em",borderBottom:`1px solid ${T.b}`}}>{h}</th>)}</tr></thead>
          <tbody>{rows.map((row,i)=>(
            <tr key={i} style={{background:i%2===0?"rgba(14,37,68,0.3)":"transparent"}}>
              <td style={{padding:"5px 8px",color:T.txt3,fontSize:10,fontWeight:700,textAlign:"center"}}>{row.time}</td>
              {["spo2","fio2","rr"].map(k=><td key={k} style={{padding:"3px 4px"}}><input type="number" value={row[k]} onChange={e=>update(i,k,e.target.value)} placeholder="—" style={inp2} /></td>)}
              <td style={{padding:"5px 6px",textAlign:"center"}}><span style={{fontSize:12,fontWeight:700,color:riskColor(row.rox),fontFamily:"monospace"}}>{row.rox??"—"}</span></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

function ABGInterpreter() {
  const [pH,setPh]=useState("");const [pco2,setPco2]=useState("");const [hco3,setHco3]=useState("");
  const [po2,setPo2]=useState("");const [fio2,setFio2]=useState("0.21");const [na,setNa]=useState("");const [cl,setCl]=useState("");
  const [show,setShow]=useState(false);
  const interpret=()=>{
    const PH=parseFloat(pH),PCO2=parseFloat(pco2),HCO3=parseFloat(hco3),PO2=parseFloat(po2),FIO2=parseFloat(fio2),NA=parseFloat(na),CL=parseFloat(cl);
    if(isNaN(PH)||isNaN(PCO2)||isNaN(HCO3))return null;
    const lines=[];const push=(label,val,color)=>lines.push({label,val,color});
    const acidemic=PH<7.35,alkalemic=PH>7.45;
    push("pH Assessment",acidemic?"Acidemia (pH <7.35)":alkalemic?"Alkalemia (pH >7.45)":"Normal pH (7.35–7.45)",acidemic?T.coral:alkalemic?T.gold:T.green);
    let primary=""; let comp_expected="";
    if(acidemic){
      if(PCO2>44){primary="Respiratory Acidosis";comp_expected=`Expected HCO₃: Acute = ${(24+1*(PCO2-40)/10).toFixed(1)} · Chronic = ${(24+3.5*(PCO2-40)/10).toFixed(1)}`;}
      else if(HCO3<22){primary="Metabolic Acidosis";const exp=Math.round(1.5*HCO3+8);comp_expected=`Winter's formula expected pCO₂: ${exp-2}–${exp+2} mmHg · Actual: ${PCO2} mmHg`;}
      else primary="Mixed Acidemia";
    } else if(alkalemic){
      if(PCO2<36){primary="Respiratory Alkalosis";comp_expected=`Expected HCO₃: Acute = ${(24-2*(40-PCO2)/10).toFixed(1)} · Chronic = ${(24-5*(40-PCO2)/10).toFixed(1)}`;}
      else if(HCO3>26){primary="Metabolic Alkalosis";const exp=Math.round(0.7*HCO3+21);comp_expected=`Expected pCO₂: ${exp-2}–${exp+2} mmHg · Actual: ${PCO2} mmHg`;}
      else primary="Normal or Compensated";
    } else primary="Normal or Compensated";
    push("Primary Disorder",primary,T.cyan);
    if(comp_expected) push("Compensation Check",comp_expected,T.blue);
    if((acidemic&&HCO3<22&&PCO2>44)||(alkalemic&&HCO3>26&&PCO2<36)) push("Mixed Disorder","MIXED acid-base disturbance detected",T.orange);
    if(!isNaN(PO2)&&!isNaN(FIO2)){
      const pao2_expected=FIO2*713-PCO2/0.8;const aa=Math.round(pao2_expected-PO2);
      const pf=Math.round(PO2/FIO2);
      push("Oxygenation",`P/F ratio: ${pf} · A-a gradient: ${aa} mmHg\n${pf<100?"Severe hypoxemia":pf<200?"Moderate hypoxemia":pf<300?"Mild hypoxemia":"Oxygenation adequate"}`,pf<200?T.coral:pf<300?T.gold:T.green);
    }
    if(!isNaN(NA)&&!isNaN(CL)){
      const ag=Math.round(NA-(CL+HCO3));const agNorm=ag>12;
      push("Anion Gap",`AG = ${NA} − (${CL}+${HCO3}) = ${ag} ${agNorm?"[ELEVATED > 12]":"[Normal ≤12]"}`,agNorm?T.coral:T.green);
    }
    return lines;
  };
  const results=show?interpret():null;
  const inp={background:"rgba(14,37,68,0.7)",border:`1px solid ${T.b}`,borderRadius:7,padding:"7px 9px",color:T.txt,fontFamily:"monospace",fontSize:12,outline:"none",width:"100%"};
  return (
    <div style={{background:"rgba(0,212,255,0.05)",border:"1px solid rgba(0,212,255,0.22)",borderRadius:12,padding:"14px 16px",marginBottom:12}}>
      <div style={{fontSize:11,fontWeight:700,color:T.cyan,marginBottom:3}}>🦅 Systematic ABG Interpreter</div>
      <div style={{fontSize:9,color:T.txt4,marginBottom:12}}>6-step interpretation · compensation check · A-a gradient · anion gap</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:8}}>
        {[["pH (7.35–7.45)",pH,setPh,"7.32"],["pCO₂ (35–45)",pco2,setPco2,"52"],["HCO₃ (22–26)",hco3,setHco3,"28"]].map(([l,v,sv,ph])=>(
          <div key={l}><div style={{fontSize:8,color:T.txt4,textTransform:"uppercase",marginBottom:3}}>{l}</div><input type="number" step="0.01" placeholder={ph} value={v} onChange={e=>sv(e.target.value)} style={inp} /></div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
        {[["pO₂ (75–100)",po2,setPo2,"68"],["FiO₂ (0.21–1.0)",fio2,setFio2,"0.4"]].map(([l,v,sv,ph])=>(
          <div key={l}><div style={{fontSize:8,color:T.txt4,textTransform:"uppercase",marginBottom:3}}>{l} <span style={{opacity:.6}}>(optional)</span></div><input type="number" step="0.01" placeholder={ph} value={v} onChange={e=>sv(e.target.value)} style={inp} /></div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
        {[["Na⁺ (mEq/L)",na,setNa,"140"],["Cl⁻ (mEq/L)",cl,setCl,"102"]].map(([l,v,sv,ph])=>(
          <div key={l}><div style={{fontSize:8,color:T.txt4,textTransform:"uppercase",marginBottom:3}}>{l} <span style={{opacity:.6}}>(for AG)</span></div><input type="number" placeholder={ph} value={v} onChange={e=>sv(e.target.value)} style={inp} /></div>
        ))}
      </div>
      <button onClick={()=>setShow(!show)} style={{width:"100%",padding:"9px",borderRadius:9,cursor:"pointer",fontFamily:"sans-serif",border:"1px solid rgba(0,212,255,0.35)",background:"rgba(0,212,255,0.08)",color:T.cyan,fontSize:11,fontWeight:700}}>{show?"Hide Results":"Interpret ABG"}</button>
      {results&&<div style={{marginTop:10,display:"flex",flexDirection:"column",gap:6}}>
        {results.map((r,i)=>(
          <div key={i} style={{background:`${r.color}0e`,border:`1px solid ${r.color}30`,borderRadius:8,padding:"9px 12px"}}>
            <div style={{fontSize:9,fontWeight:700,color:r.color,textTransform:"uppercase",letterSpacing:".06em",marginBottom:4}}>Step {i+1}: {r.label}</div>
            <div style={{fontSize:11,color:T.txt2,lineHeight:1.6,fontFamily:"monospace",whiteSpace:"pre-wrap"}}>{r.val}</div>
          </div>
        ))}
      </div>}
    </div>
  );
}

function NebuMeds() {
  const meds=[
    {drug:"Albuterol",dose:"2.5 mg in 3 mL NS neb q20 min ×3 (status asthmaticus)\n2.5 mg q4–6h maintenance\nContinuous neb: 10–20 mg/h (severe bronchospasm)",ind:"Bronchospasm, asthma, COPD, anaphylaxis",color:T.blue},
    {drug:"Ipratropium",dose:"0.5 mg in 2.5 mL NS neb q20 min ×3 (with albuterol)\n0.5 mg q6h maintenance",ind:"Acute asthma/COPD exacerbation (additive to albuterol — 2h only)",color:T.teal},
    {drug:"Racemic Epinephrine",dose:"0.5 mL of 2.25% solution in 2.5 mL NS neb\nOnset: 1–5 min · Duration: 1–2h\nPediatric croup: same dose — 20–30 min observation after",ind:"Croup, post-extubation stridor, severe epiglottitis bridge",color:T.coral},
    {drug:"Magnesium Sulfate",dose:"2 g IV over 20 min (NOT nebulized — IV route)\nPediatric: 25–75 mg/kg (max 2 g)",ind:"Severe asthma exacerbation (GINA Step 5)",color:T.purple},
    {drug:"Dexamethasone",dose:"0.6 mg/kg PO or IV (max 10 mg) — croup\nAdult COPD/asthma: 6–8 mg IV q8–12h",ind:"Croup (single dose), COPD exacerbation, severe asthma",color:T.green},
  ];
  const [open,setOpen]=useState(null);
  return (
    <div style={{background:"rgba(59,158,255,0.05)",border:"1px solid rgba(59,158,255,0.22)",borderRadius:12,padding:"14px 16px",marginBottom:12}}>
      <div style={{fontSize:11,fontWeight:700,color:T.txt,marginBottom:3}}>💨 Bronchodilator & Nebulized Medication Reference</div>
      <div style={{fontSize:9,color:T.txt4,marginBottom:10}}>Tap any medication for full dosing + indications</div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {meds.map((m,i)=>(
          <div key={i}>
            <div onClick={()=>setOpen(open===i?null:i)} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:open===i?`${m.color}10`:"rgba(14,37,68,0.45)",border:`1px solid ${open===i?m.color+"40":T.b}`,borderRadius:open===i?"9px 9px 0 0":9,cursor:"pointer",transition:"all .15s"}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:m.color,flexShrink:0}} />
              <span style={{fontSize:11,fontWeight:600,color:open===i?m.color:T.txt,flex:1}}>{m.drug}</span>
              <span style={{fontSize:9,color:T.txt4}}>{open===i?"▲":"▼"}</span>
            </div>
            {open===i&&<div style={{background:"rgba(8,18,35,0.7)",border:`1px solid ${m.color}30`,borderTop:"none",borderRadius:"0 0 9px 9px",padding:"10px 14px"}}>
              <div style={{fontSize:9,color:m.color,textTransform:"uppercase",letterSpacing:".06em",marginBottom:5}}>Dosing</div>
              <div style={{fontSize:11,color:T.txt2,fontFamily:"monospace",lineHeight:1.6,whiteSpace:"pre-wrap",marginBottom:8}}>{m.dose}</div>
              <div style={{fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:".06em",marginBottom:3}}>Indications</div>
              <div style={{fontSize:11,color:T.txt3,lineHeight:1.5}}>{m.ind}</div>
            </div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function DrugRow({rx}) {
  const [open,setOpen]=useState(null);
  const panels=[{k:"renal",icon:"📋",label:"Details",color:T.blue},{k:"ivpo",icon:"🔧",label:"Alternative",color:T.teal},{k:"deesc",icon:"📉",label:"Monitoring",color:T.green}];
  return (
    <div style={{background:"rgba(14,37,68,0.45)",border:`1px solid ${T.b}`,borderRadius:10,marginBottom:8,overflow:"hidden"}}>
      <div style={{padding:"11px 14px"}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8,marginBottom:4}}>
          <div><div style={{fontSize:12,fontWeight:700,color:T.txt}}>{rx.drug}</div>{rx.cat&&<div style={{fontSize:10,color:T.txt3,marginTop:1}}>{rx.cat}</div>}</div>
          {rx.ref&&<span style={{fontSize:9,fontFamily:"monospace",fontWeight:700,padding:"2px 7px",borderRadius:20,flexShrink:0,background:"rgba(0,212,255,0.1)",border:"1px solid rgba(0,212,255,0.3)",color:T.cyan}}>{rx.ref}</span>}
        </div>
        <div style={{fontSize:12,color:T.txt2,fontFamily:"monospace",lineHeight:1.6,whiteSpace:"pre-wrap"}}>{rx.dose}</div>
        {rx.note&&<div style={{fontSize:10,color:T.txt3,marginTop:4,lineHeight:1.45}}>{rx.note}</div>}
      </div>
      <div style={{display:"flex",borderTop:`1px solid ${T.b}`,background:"rgba(5,15,30,0.4)"}}>
        {panels.filter(pp=>rx[pp.k]).map((pp,i,arr)=>(
          <button key={pp.k} onClick={()=>setOpen(open===pp.k?null:pp.k)} style={{flex:1,padding:"6px 4px",border:"none",borderRight:i<arr.length-1?`1px solid ${T.b}`:"none",background:open===pp.k?`${pp.color}12`:"transparent",color:open===pp.k?pp.color:T.txt4,fontSize:10,fontWeight:open===pp.k?700:500,cursor:"pointer",fontFamily:"sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
            <span>{pp.icon}</span>{pp.label}
          </button>
        ))}
      </div>
      {open&&rx[open]&&<div style={{padding:"10px 14px",borderTop:`1px solid ${panels.find(pp=>pp.k===open)?.color}25`,fontSize:11,color:T.txt2,lineHeight:1.65,whiteSpace:"pre-wrap"}}>{rx[open]}</div>}
    </div>
  );
}

function MDMSnippet({condId}) {
  const [fields,setFields]=useState({});const [copied,setCopied]=useState(false);const [show,setShow]=useState(false);
  const tmpl=MDM_DATA[condId];
  if(!tmpl)return null;
  const note=tmpl.t(fields);
  const copy=()=>navigator.clipboard.writeText(note).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2500);});
  return (
    <div style={{background:"rgba(0,229,192,0.04)",border:"1px solid rgba(0,229,192,0.22)",borderRadius:10,padding:"12px 14px",marginTop:12}}>
      <div style={{fontSize:10,fontWeight:700,color:T.teal,marginBottom:8}}>📋 MDM Snippet Generator</div>
      {tmpl.fields.map(f=>(
        <div key={f.id} style={{marginBottom:6}}>
          <div style={{fontSize:8,color:T.txt4,textTransform:"uppercase",marginBottom:2}}>{f.lbl}</div>
          <input type="text" placeholder={f.ph} value={fields[f.id]||""} onChange={e=>setFields(pp=>({...pp,[f.id]:e.target.value}))} style={{width:"100%",background:"rgba(14,37,68,0.7)",border:`1px solid ${T.b}`,borderRadius:7,padding:"6px 9px",color:T.txt,fontFamily:"monospace",fontSize:11,outline:"none"}} />
        </div>
      ))}
      <div style={{display:"flex",gap:7,marginTop:8}}>
        <button onClick={()=>setShow(!show)} style={{flex:1,padding:"7px",borderRadius:7,cursor:"pointer",fontFamily:"sans-serif",border:"1px solid rgba(0,229,192,0.3)",background:"rgba(0,229,192,0.05)",color:T.teal,fontSize:10,fontWeight:700}}>{show?"Hide":"Preview"}</button>
        <button onClick={copy} style={{flex:1,padding:"7px",borderRadius:7,cursor:"pointer",fontFamily:"sans-serif",transition:"all .2s",border:`1px solid ${copied?T.green+"55":"rgba(0,229,192,0.3)"}`,background:copied?"rgba(61,255,160,0.1)":"rgba(0,229,192,0.05)",color:copied?T.green:T.teal,fontSize:10,fontWeight:700}}>{copied?"✓ Copied":"📋 Copy MDM"}</button>
      </div>
      {show&&<div style={{marginTop:8,background:"rgba(5,15,30,0.8)",border:"1px solid rgba(0,229,192,0.15)",borderRadius:8,padding:"10px 12px"}}><p style={{fontSize:11,color:T.txt2,lineHeight:1.75,margin:0,fontFamily:"monospace"}}>{note}</p></div>}
    </div>
  );
}

function OrderSetPanel({condId}) {
  const [active,setActive]=useState(null);const [copied,setCopied]=useState(null);
  const os=ORDER_SETS[condId];
  if(!os)return null;
  const copy=(i,text)=>navigator.clipboard.writeText(text).then(()=>{setCopied(i);setTimeout(()=>setCopied(null),2500);});
  return (
    <div style={{background:`${os.color}08`,border:`1px solid ${os.color}28`,borderRadius:10,marginBottom:10,overflow:"hidden"}}>
      <div style={{padding:"10px 14px",display:"flex",gap:8,alignItems:"center"}}>
        <span style={{fontSize:14}}>{os.icon}</span>
        <div><div style={{fontSize:11,fontWeight:700,color:os.color}}>{os.label}</div><div style={{fontSize:9,color:T.txt4}}>Tap to expand · copy to CPOE</div></div>
      </div>
      <div style={{borderTop:`1px solid ${os.color}20`,padding:"8px 10px",display:"flex",gap:6,flexWrap:"wrap"}}>
        {os.sets.map((s,i)=>(
          <div key={i} style={{flex:1,minWidth:140}}>
            <button onClick={()=>setActive(active===i?null:i)} style={{width:"100%",padding:"6px 10px",borderRadius:7,cursor:"pointer",fontFamily:"sans-serif",border:`1px solid ${active===i?os.color+"55":T.b}`,background:active===i?`${os.color}14`:"rgba(14,37,68,0.5)",color:active===i?os.color:T.txt3,fontSize:10,fontWeight:active===i?700:400,textAlign:"left"}}>{s.title}</button>
            {active===i&&<div style={{marginTop:5,background:"rgba(5,15,30,0.85)",border:`1px solid ${os.color}22`,borderRadius:8,padding:"9px 11px"}}>
              <pre style={{fontSize:9,color:T.txt2,lineHeight:1.6,whiteSpace:"pre-wrap",fontFamily:"monospace",margin:0,marginBottom:7}}>{s.text}</pre>
              <button onClick={()=>copy(i,s.text)} style={{width:"100%",padding:"6px",borderRadius:6,cursor:"pointer",fontFamily:"sans-serif",transition:"all .2s",border:`1px solid ${copied===i?T.green+"55":os.color+"40"}`,background:copied===i?"rgba(61,255,160,0.12)":`${os.color}08`,color:copied===i?T.green:os.color,fontSize:10,fontWeight:700}}>{copied===i?"✓ Copied":"📋 Copy"}</button>
            </div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickRefCard({condId}) {
  const refs=QUICK_REF[condId]; if(!refs)return null;
  return (
    <div style={{background:"rgba(0,212,255,0.05)",border:"1px solid rgba(0,212,255,0.2)",borderRadius:10,padding:"12px 14px",marginTop:10}}>
      <div style={{fontSize:9,fontWeight:700,color:T.cyan,textTransform:"uppercase",letterSpacing:".07em",marginBottom:8}}>⚡ Quick-Ref — 5 Critical Numbers</div>
      {refs.map((r,i)=>(
        <div key={i} style={{display:"flex",gap:8,padding:"5px 0",borderBottom:i<refs.length-1?"1px solid rgba(26,53,85,0.4)":"none"}}>
          <div style={{width:16,height:16,borderRadius:4,background:"rgba(0,212,255,0.12)",border:"1px solid rgba(0,212,255,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:T.cyan,fontWeight:700,flexShrink:0,marginTop:1}}>{i+1}</div>
          <div style={{fontSize:10,color:T.txt2,lineHeight:1.5,fontFamily:"monospace"}}>{r}</div>
        </div>
      ))}
    </div>
  );
}

function ConditionPage({cond,onBack}) {
  const [tab,setTab]=useState("overview");const [checked,setChecked]=useState({});
  const ov=OVERVIEW[cond.id]||{};const rx=TREATMENT[cond.id]||[];const wu_=WORKUP[cond.id]||[];const fu=FOLLOWUP[cond.id]||[];
  const tabs=[{id:"overview",label:"Overview",icon:"📋"},{id:"workup",label:"Workup",icon:"✅"},{id:"treatment",label:"Protocol",icon:"⚙️"},{id:"followup",label:"Follow-up",icon:"📅"}];
  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <div style={{padding:"14px 20px 0",flexShrink:0}}>
        <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:6,background:"rgba(14,37,68,0.5)",border:`1px solid ${T.b}`,borderRadius:7,padding:"5px 12px",color:T.txt3,fontSize:11,cursor:"pointer",marginBottom:12}}>← Back</button>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
          <div style={{width:44,height:44,borderRadius:12,background:cond.gl,border:`1px solid ${cond.br}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{cond.icon}</div>
          <div><div style={{fontSize:16,fontWeight:700,color:T.txt,fontFamily:"'Playfair Display',serif"}}>{cond.title}</div><div style={{fontSize:11,color:T.txt3}}>{cond.sub}</div></div>
        </div>
        <div style={{display:"flex",gap:3,borderBottom:`1px solid ${T.b}`,overflowX:"auto"}}>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"6px 12px",border:"none",borderBottom:tab===t.id?`2px solid ${cond.color}`:"2px solid transparent",background:"transparent",color:tab===t.id?T.txt:T.txt3,fontSize:10,fontWeight:tab===t.id?700:400,cursor:"pointer",fontFamily:"sans-serif",display:"flex",alignItems:"center",gap:5,whiteSpace:"nowrap",marginBottom:-1}}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px 20px 24px"}}>
        {tab==="overview"&&<div>
          <div style={{background:"rgba(14,37,68,0.5)",border:`1px solid ${cond.br}`,borderLeft:`3px solid ${cond.color}`,borderRadius:8,padding:"12px 14px",marginBottom:14,fontSize:12,color:T.txt2,lineHeight:1.7}}>{ov.def}</div>
          {ov.bullets?.map((b,i)=><div key={i} style={{display:"flex",gap:10,padding:"7px 0",borderBottom:i<ov.bullets.length-1?"1px solid rgba(26,53,85,0.4)":"none"}}><div style={{width:14,height:14,borderRadius:3,background:cond.gl,border:`1px solid ${cond.br}`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:cond.color,marginTop:2}}>▪</div><div style={{fontSize:12,color:T.txt2,lineHeight:1.55}}>{b}</div></div>)}
          {cond.id==="hfnc"&&<div style={{marginTop:14}}><ROXCalc /><HFNCTracker /></div>}
          {(cond.id==="o2"||cond.id==="cpap"||cond.id==="bipap")&&<div style={{marginTop:14}}><ABGInterpreter /></div>}
          <QuickRefCard condId={cond.id} />
        </div>}
        {tab==="workup"&&<div>
          {wu_.map((item,i)=>(
            <div key={i} onClick={()=>setChecked(p=>({...p,[i]:!p[i]}))} style={{display:"flex",gap:12,alignItems:"flex-start",background:checked[i]?"rgba(0,229,192,0.07)":"rgba(14,37,68,0.4)",border:`1px solid ${checked[i]?"rgba(0,229,192,0.3)":T.b}`,borderRadius:9,padding:"11px 14px",marginBottom:8,cursor:"pointer"}}>
              <div style={{width:32,height:32,borderRadius:8,background:checked[i]?"rgba(0,229,192,0.15)":"rgba(14,37,68,0.6)",border:`1px solid ${checked[i]?"rgba(0,229,192,0.5)":T.b}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{checked[i]?"✓":item.icon}</div>
              <div><div style={{fontSize:12,fontWeight:600,color:checked[i]?T.teal:T.txt,marginBottom:3}}>{item.label}</div><div style={{fontSize:11,color:T.txt3,lineHeight:1.55}}>{item.detail}</div></div>
            </div>
          ))}
        </div>}
        {tab==="treatment"&&<div>
          <OrderSetPanel condId={cond.id} />
          {(cond.id==="hfnc"||cond.id==="cpap"||cond.id==="bipap")&&<NebuMeds />}
          {rx.length>0?rx.map((r,i)=><DrugRow key={i} rx={r} />):<div style={{fontSize:12,color:T.txt3,textAlign:"center",padding:"32px 0"}}>Protocol data not available</div>}
        </div>}
        {tab==="followup"&&<div>
          {fu.map((item,i)=><div key={i} style={{display:"flex",gap:10,padding:"9px 12px",background:"rgba(14,37,68,0.4)",border:`1px solid ${T.b}`,borderRadius:8,marginBottom:6}}><div style={{width:22,height:22,borderRadius:6,background:"rgba(0,229,192,0.1)",border:"1px solid rgba(0,229,192,0.25)",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:T.teal,fontWeight:700,marginTop:1}}>{i+1}</div><div style={{fontSize:12,color:T.txt2,lineHeight:1.6}}>{item}</div></div>)}
          <MDMSnippet condId={cond.id} />
        </div>}
      </div>
    </div>
  );
}

export default function NIVPage() {
  const navigate=useNavigate();
  const [selected,setSelected]=useState(null);
  const cond=CONDITIONS.find(c=>c.id===selected);
  if(cond) return (
    <div style={{height:"100vh",background:T.bg,color:T.txt,fontFamily:"'DM Sans',sans-serif",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(26,53,85,0.9);border-radius:2px}input,button,textarea{font-family:inherit}`}</style>
      <ConditionPage cond={cond} onBack={()=>setSelected(null)} />
    </div>
  );
  return (
    <div style={{height:"100vh",background:T.bg,color:T.txt,fontFamily:"'DM Sans',sans-serif",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(26,53,85,0.9);border-radius:2px}input,button,textarea{font-family:inherit}`}</style>
      <div style={{background:T.panel,borderBottom:`1px solid ${T.b}`,padding:"14px 20px",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <button onClick={()=>navigate("/AirwayHub")} style={{padding:"5px 12px",borderRadius:7,border:"1px solid rgba(0,212,255,0.35)",background:"rgba(8,22,40,0.7)",color:T.cyan,fontSize:11,fontWeight:700,cursor:"pointer"}}>← Airway Hub</button>
          <div style={{width:40,height:40,borderRadius:11,background:"rgba(0,212,255,0.1)",border:"1px solid rgba(0,212,255,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>🌬️</div>
          <div>
            <div style={{fontSize:17,fontWeight:700,color:T.txt,fontFamily:"'Playfair Display',serif"}}>Oxygenation & NIV</div>
            <div style={{fontSize:10,color:T.txt3}}>Supplemental O₂ · HFNC · CPAP · BiPAP · ABG Interpreter · Nebulized Meds</div>
          </div>
          <div style={{marginLeft:"auto",display:"flex",gap:6}}>
            {["BTS 2017","FLORALI 2015","Roca ROX 2019"].map(b=><span key={b} style={{fontSize:8,fontFamily:"monospace",fontWeight:700,padding:"2px 8px",borderRadius:20,background:"rgba(0,212,255,0.1)",border:"1px solid rgba(0,212,255,0.28)",color:T.cyan}}>{b}</span>)}
          </div>
        </div>
      </div>
      <div style={{padding:"12px 20px 0",flexShrink:0}}><ABGInterpreter /></div>
      <div style={{flex:1,overflowY:"auto",padding:"8px 20px 24px"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:12}}>
          {CONDITIONS.map(c=>(
            <div key={c.id} onClick={()=>setSelected(c.id)} style={{background:c.gl,border:`1px solid ${c.br}`,borderRadius:12,padding:"14px 16px",cursor:"pointer",transition:"all .2s"}}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 8px 24px ${c.color}20`}}
              onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none"}}>
              <div style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:10}}>
                <div style={{width:40,height:40,borderRadius:10,background:c.gl,border:`1px solid ${c.br}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{c.icon}</div>
                <div><div style={{fontSize:13,fontWeight:700,color:T.txt}}>{c.title}</div><div style={{fontSize:10,color:T.txt3,marginTop:1}}>{c.sub}</div></div>
              </div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",fontSize:9}}>
                {TREATMENT[c.id]?.length>0&&<span style={{padding:"2px 7px",borderRadius:20,background:"rgba(0,229,192,0.08)",border:"1px solid rgba(0,229,192,0.2)",color:T.teal}}>⚙️ {TREATMENT[c.id].length} protocol steps</span>}
                {c.id==="hfnc"&&<span style={{padding:"2px 7px",borderRadius:20,background:"rgba(0,212,255,0.1)",border:"1px solid rgba(0,212,255,0.3)",color:T.cyan}}>📊 ROX Tracker</span>}
                {(c.id==="cpap"||c.id==="bipap")&&<span style={{padding:"2px 7px",borderRadius:20,background:"rgba(59,158,255,0.1)",border:"1px solid rgba(59,158,255,0.3)",color:T.blue}}>🦅 ABG Interp</span>}
                {(c.id==="hfnc"||c.id==="cpap"||c.id==="bipap")&&<span style={{padding:"2px 7px",borderRadius:20,background:"rgba(255,159,67,0.08)",border:"1px solid rgba(255,159,67,0.2)",color:T.orange}}>💨 Neb Meds</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}