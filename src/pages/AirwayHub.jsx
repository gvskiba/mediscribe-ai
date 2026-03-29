import { useState } from "react";
import { useNavigate } from "react-router-dom";

/* ═══ TOKENS ═══════════════════════════════════════════════════════ */
const T = {
  bg:"#050f1e",panel:"#081628",card:"#0b1e36",up:"#0e2544",
  b:"rgba(26,53,85,0.8)",bhi:"rgba(42,79,122,0.9)",
  txt:"#e8f0fe",txt2:"#8aaccc",txt3:"#4a6a8a",txt4:"#2e4a6a",
  coral:"#ff6b6b",gold:"#f5c842",teal:"#00e5c0",blue:"#3b9eff",
  orange:"#ff9f43",purple:"#9b6dff",green:"#3dffa0",cyan:"#00d4ff",
};

/* ═══ CONDITIONS ════════════════════════════════════════════════════ */
const CONDITIONS = [
  { id:"o2",   icon:"🫁", title:"Supplemental O₂",       sub:"NC · NRB · Venturi · Apneic Oxygenation",           cat:"Supplemental O₂",     color:"#3b9eff", gl:"rgba(59,158,255,0.07)",  br:"rgba(59,158,255,0.28)"  },
  { id:"hfnc", icon:"🌬️", title:"High-Flow Nasal Cannula",sub:"Heated Humidified · ROX Index · Failure Criteria",   cat:"NIV",                 color:"#00d4ff", gl:"rgba(0,212,255,0.07)",   br:"rgba(0,212,255,0.28)"   },
  { id:"cpap", icon:"😮‍💨",  title:"CPAP",                  sub:"OSA · CHF · Post-op · Continuous PEEP",             cat:"NIV",                 color:"#9b6dff", gl:"rgba(155,109,255,0.07)", br:"rgba(155,109,255,0.28)" },
  { id:"bipap",icon:"🫂", title:"BiPAP / NIV",            sub:"COPD · CHF · IPAP/EPAP · Failure Criteria",          cat:"NIV",                 color:"#ff9f43", gl:"rgba(255,159,67,0.07)",  br:"rgba(255,159,67,0.28)"  },
  { id:"rsi",  icon:"💉", title:"RSI Protocol",           sub:"Pre-ox · Induction · Paralysis · Post-intubation",    cat:"Intubation",          color:"#f5c842", gl:"rgba(245,200,66,0.07)",  br:"rgba(245,200,66,0.28)"  },
  { id:"daw",  icon:"🚨", title:"Difficult Airway",       sub:"CICO · VL · LMA · Surgical Airway · LEMON",          cat:"Intubation",          color:"#ff6b6b", gl:"rgba(255,107,107,0.07)", br:"rgba(255,107,107,0.28)" },
  { id:"ards", icon:"📉", title:"ARDS / ARDSNet",         sub:"Berlin Definition · 6 mL/kg IBW · PEEP Table · Prone",cat:"Invasive Ventilation",color:"#ff6b6b", gl:"rgba(255,107,107,0.07)", br:"rgba(255,107,107,0.28)" },
  { id:"vent", icon:"⚙️", title:"Ventilator Management",  sub:"Modes · Settings · ABCDEF Bundle · Alarms",          cat:"Invasive Ventilation",color:"#00e5c0", gl:"rgba(0,229,192,0.07)",   br:"rgba(0,229,192,0.28)"   },
  { id:"wean", icon:"📈", title:"Weaning & Liberation",   sub:"SAT · SBT · RSBI · Extubation Criteria",             cat:"Invasive Ventilation",color:"#3dffa0", gl:"rgba(61,255,160,0.07)",  br:"rgba(61,255,160,0.28)"  },
];
const CATS = ["Supplemental O₂","NIV","Intubation","Invasive Ventilation"];

/* ═══ OVERVIEW ══════════════════════════════════════════════════════ */
const OVERVIEW = {
  o2:{
    def:"Supplemental oxygen therapy corrects hypoxemia by increasing the fraction of inspired oxygen (FiO₂). Target SpO₂ 92–96% for most adults (94–98% per BTS); 88–92% for chronic hypercapnic COPD patients to avoid hypercapnic drive suppression. Device choice depends on oxygen requirement, patient tolerance, and urgency.",
    bullets:["Nasal cannula (NC): 1–6 L/min → FiO₂ 24–44%. 1L≈+4% FiO₂ above 21%. Variable delivery — depends on respiratory pattern.","Non-Rebreather Mask (NRB): 10–15 L/min → FiO₂ 60–90%. Gold standard for emergency pre-oxygenation. Fill reservoir before applying.","Venturi Mask: Precise FiO₂ delivery (24–60%) — color-coded adaptors. Preferred for COPD where exact FiO₂ matters.","Apneic oxygenation: NC at 15 L/min kept in place during laryngoscopy. Delays desaturation by 2–3 min via mass flow. Does NOT prevent CO₂ rise.","Target SpO₂ ≥93% before intubation. If SpO₂ <88% despite pre-oxygenation → do NOT defer bag-mask ventilation."],
  },
  hfnc:{
    def:"Heated High-Flow Nasal Cannula (HFNC) delivers heated, humidified oxygen at flow rates up to 60 L/min via large-bore nasal prongs. Advantages: washes out nasopharyngeal dead space, generates 1–3 cmH₂O PEEP (flow-dependent), improves mucociliary clearance, well-tolerated. Indicated for hypoxic respiratory failure, post-extubation support, COVID-19 pneumonia, immunocompromised patients, and as a bridge to intubation or as a ceiling intervention.",
    bullets:["Start flow 40–60 L/min, FiO₂ 1.0 → titrate to SpO₂ 92–96%","ROX Index = (SpO₂/FiO₂) / RR — monitor at 2h, 6h, 12h. ROX <2.85 at 2h = HIGH failure risk","FLORALI trial: HFNC reduced intubation rate and 90-day mortality vs standard O₂ in hypoxic RF","Do NOT persist with HFNC if deteriorating — delayed intubation in HFNC failure worsens outcomes","Contraindications: apnea, inability to protect airway, severe hemodynamic instability, facial trauma/anatomy"],
  },
  cpap:{
    def:"Continuous Positive Airway Pressure (CPAP) delivers a single continuous pressure throughout inspiration and expiration, maintained by the patient's own respiratory effort. CPAP recruits alveoli, reduces work of breathing, and improves oxygenation without providing pressure support. Primary indications: obstructive sleep apnea (OSA), cardiogenic pulmonary edema (CPE), and post-operative hypoxemia.",
    bullets:["CPAP 5–15 cmH₂O improves FRC, recruits collapsed alveoli, reduces cardiac preload in CHF","3CPO trial: CPAP reduced intubation by ~50% in acute cardiogenic pulmonary edema (equivalent to BiPAP)","OSA: standard therapy for AHI >15; auto-CPAP for most new diagnoses. BiPAP for CPAP-intolerant or OHS.","Contraindications: inability to protect airway, active aspiration risk, hemodynamic instability, pneumothorax (untreated)","Titrate PEEP to minimum required for SpO₂ target — avoid excessive PEEP in non-cardiogenic hypoxemia"],
  },
  bipap:{
    def:"Bilevel Positive Airway Pressure (BiPAP) / Non-Invasive Ventilation (NIV) delivers inspiratory pressure (IPAP) and expiratory pressure (EPAP). Pressure Support = IPAP − EPAP. Augments tidal volume, unloads respiratory muscles, and improves alveolar ventilation. Primary indications: COPD exacerbation (pH 7.25–7.35), acute cardiogenic pulmonary edema, obesity hypoventilation syndrome (OHS), neuromuscular disease, and post-extubation hypercapnia.",
    bullets:["COPD exacerbation (Grade A): pH 7.25–7.35 → BiPAP reduces intubation by 50–65% and mortality by 48%","pH <7.25 = relative indicator for intubation; NIV may still be attempted with close monitoring","ABG at 1–2h is MANDATORY to assess response. No improvement → intubate promptly.","Interface: full face mask preferred for acute RF (better seal, less leak). Nasal mask only if claustrophobic.","Set clear failure criteria BEFORE initiating NIV. Communicate to team and patient."],
  },
  rsi:{
    def:"Rapid Sequence Intubation (RSI): Simultaneous administration of an induction agent and neuromuscular blocking agent (NMBA) to achieve rapid unconsciousness and paralysis for definitive airway management. Designed to minimize the time between loss of protective reflexes and endotracheal tube placement, reducing aspiration risk. Pre-oxygenation is the most critical step in RSI.",
    bullets:["Pre-oxygenation goal: SpO₂ >93–95% (ideally >96%) using NRB 15 L/min × 3–5 min + NC 15 L/min for apneic oxygenation","LEMON assessment: Look (facies, beard, trauma), Evaluate 3-3-2 (mouth, thyroid-chin, hyoid-mouth), Mallampati, Obstruction, Neck mobility","Sequence: Pre-oxygenate → Position → Preoxygenate more → Induction → Paralytic → Wait 45–60s → Laryngoscope → Intubate → Confirm ETCO₂","ETCO₂ waveform capnography is the GOLD STANDARD for ETT confirmation. No waveform = assume esophageal placement.","Post-intubation: Start sedation/analgesia BEFORE paralytic wears off. Initial vent: TV 6–8 mL/kg IBW, RR 14, FiO₂ 1.0, PEEP 5."],
  },
  daw:{
    def:"Difficult Airway: Any clinical situation in which a trained clinician experiences difficulty with bag-mask ventilation (BMV) and/or intubation. CICO (Cannot Intubate, Cannot Oxygenate) is a life-threatening emergency requiring immediate surgical airway. The DAS 2015 and 2022 guidelines define a structured 4-Plan algorithm: Plan A (primary), Plan B (SGA), Plan C (oxygenation/awakening), Plan D (surgical airway).",
    bullets:["LEMON predicts difficult laryngoscopy. HEAVEN (Hypoxemia, Extremes, Anatomy, Vomit, Exsanguination, No NMBA) predicts failed first-pass.","Maximum 3 attempts at laryngoscopy (Plan A) total — then declare failed airway and proceed to Plan B","Video laryngoscopy (VL) is first-line for anticipated or encountered difficult airway in most EDs/ICUs","CICO: Declare aloud, call for help, proceed IMMEDIATELY to scalpel cricothyrotomy (knife-finger-tube). Do NOT delay.","Sugammadex 16 mg/kg IV reverses rocuronium in ~3 min — have drawn up when using rocuronium for RSI."],
  },
  ards:{
    def:"ARDS (Berlin Definition 2012): Acute-onset bilateral opacities on imaging not fully explained by cardiac failure or fluid overload, with PaO₂/FiO₂ (P/F) ratio <300 on PEEP ≥5 cmH₂O. Severity: Mild P/F 200–300 (mortality ~27%), Moderate P/F 100–200 (mortality ~32%), Severe P/F <100 (mortality ~45%). ARDSNet lung-protective ventilation remains the cornerstone of treatment — tidal volume 6 mL/kg predicted body weight (PBW).",
    bullets:["Tidal volume 6 mL/kg PBW (NOT actual weight) — reduces mortality from 40% to 31% (ARDSNet NEJM 2000)","Plateau pressure ≤30 cmH₂O; Driving pressure (Pplat − PEEP) ≤15 cmH₂O","Prone positioning ≥16h/day for P/F <150 on FiO₂ ≥0.6 — PROSEVA: reduces mortality from 33% to 16%","Conservative fluid strategy once hemodynamically stable (FACTT trial: reduces vent days)","Neuromuscular blockade (cisatracurium) for severe ARDS in first 48h — reduces dyssynchrony; ventral drives pressure"],
  },
  vent:{
    def:"Mechanical ventilation provides respiratory support by delivering positive pressure breaths to augment or replace spontaneous breathing. Key modes: Volume Control A/C (AC-VC — most common ICU mode), Pressure Control (AC-PC), Pressure Support (PSV — weaning mode), and PRVC (volume-targeted pressure control). All patients require daily assessment using the ABCDEF bundle for ICU liberation.",
    bullets:["AC-VC: guaranteed minute ventilation, guaranteed tidal volume. Monitor plateau pressure (goal ≤30 cmH₂O).","Alarm management: high pressure alarm fires before delivering patient harm; identify cause (secretions, biting, pneumothorax, dyssynchrony)","ABCDEF bundle reduces delirium by 35%, ICU LOS, and ventilator days — implement from Day 1","Target RASS -1 to 0 for most patients; analgesia-first (opioid before sedative — analgosedation model)","Dynamic hyperinflation (auto-PEEP): risk in COPD/asthma — use low RR, long expiratory time (I:E 1:4), disconnect if critical"],
  },
  wean:{
    def:"Ventilator weaning (liberation) is the process of reducing mechanical ventilatory support to allow extubation. The ABC trial (2008) demonstrated that paired daily Spontaneous Awakening Trial (SAT) + Spontaneous Breathing Trial (SBT) reduces mechanical ventilation duration by 3 days and ICU mortality by 14%. The RSBI (Rapid Shallow Breathing Index) is the most validated predictor of SBT success.",
    bullets:["SAT safety screen FIRST → then SBT if SAT passed. Paired SAT+SBT is superior to either alone.","SBT: PS 5/PEEP 5 or T-piece for 30–120 min. 30 min equivalent to 120 min in most patients.","RSBI = RR ÷ (TV in L). RSBI <105 = likely success (Yang & Tobin NEJM 1991)","Extubation criteria: SBT pass + alert + follows commands + adequate cough + secretions manageable","Post-extubation HFNC for high-risk patients reduces 72h re-intubation rate (Hernandez et al. JAMA 2016)"],
  },
};

/* ═══ WORKUP ════════════════════════════════════════════════════════ */
const WORKUP = {
  o2:[
    {icon:"📊",label:"Pulse Oximetry (SpO₂)",detail:"Continuous SpO₂ monitoring. Target 92–96% (most adults) or 88–92% (COPD). Titrate O₂ delivery to achieve target — not to maximum."},
    {icon:"🫁",label:"ABG (if hypercapnia concern)",detail:"pH, PaO₂, PaCO₂, HCO₃. SpO₂ does not detect hypercapnia. ABG essential in COPD exacerbation, hypoventilation, or concerning mental status change."},
    {icon:"📸",label:"CXR",detail:"Identify underlying cause of hypoxemia: pneumonia, pulmonary edema, pneumothorax, pleural effusion, ARDS."},
    {icon:"🫀",label:"EKG + Troponin",detail:"Rule out ACS as cause of acute hypoxemia (type 1 MI, STEMI with acute pulmonary edema). PE workup (S1Q3T3, sinus tach) if indicated."},
    {icon:"📉",label:"ETCO₂ / Capnography",detail:"Non-invasive ventilation monitoring. Waveform capnography identifies hypoventilation, obstructive pattern, or esophageal misplacement."},
  ],
  hfnc:[
    {icon:"📊",label:"ROX Index (q2h initially)",detail:"ROX = (SpO₂/FiO₂) / RR. Calculate at 2h, 6h, 12h after initiation. ROX <2.85 at 2h = high failure risk → escalate to BiPAP or intubation."},
    {icon:"🫁",label:"ABG (1–2h after initiation)",detail:"Confirm pCO₂ not rising. HFNC does not reliably correct hypercapnia. If pCO₂ rising or pH <7.30 → switch to BiPAP or intubate."},
    {icon:"📸",label:"CXR",detail:"Characterize extent of lung disease. Bilateral infiltrates → consider ARDS workup. Unilateral → may have different response to HFNC."},
    {icon:"💧",label:"SpO₂ + RR Continuous Monitoring",detail:"Trending RR is a key indicator of HFNC tolerance. Falling RR = improving; rising RR = tiring. Both needed for ROX calculation."},
    {icon:"🫀",label:"Bedside POCUS (if indicated)",detail:"IVC for volume status, LV function (cardiogenic vs non-cardiogenic), lung ultrasound (B-lines = cardiogenic; consolidation = pneumonia/ARDS)."},
  ],
  cpap:[
    {icon:"🌙",label:"Polysomnography / Home Sleep Study",detail:"Diagnosis of OSA: AHI ≥5/h (symptomatic) or ≥15/h (asymptomatic). AHI ≥30 = severe OSA. Required for insurance authorization in many US states."},
    {icon:"🫁",label:"Morning ABG (OHS workup)",detail:"Obesity Hypoventilation Syndrome: awake hypercapnia (pCO₂ >45 mmHg) + BMI >30 + no other cause. BiPAP preferred over CPAP in OHS."},
    {icon:"📊",label:"SpO₂ Monitoring During CPAP Trial",detail:"Nocturnal oximetry to assess response to CPAP. SpO₂ <88% for >5 min cumulative = inadequate oxygenation despite CPAP."},
    {icon:"📸",label:"CXR (acute respiratory failure)",detail:"Cardiogenic pulmonary edema (bat-wing, cephalization, Kerley B lines, effusions). Guide CPAP/BiPAP decision."},
    {icon:"🫀",label:"Echo / BNP (CHF Workup)",detail:"BNP >400 supports CHF diagnosis. Echo for EF, wall motion, diastolic dysfunction. CPAP or BiPAP equivalent for acute CPE."},
  ],
  bipap:[
    {icon:"🫁",label:"ABG — Baseline + 1-2h Post-NIV",detail:"MANDATORY. Baseline pH + pCO₂ establishes indication. Repeat 1–2h after NIV initiation — no improvement = likely NIV failure. Intubate promptly."},
    {icon:"📊",label:"SpO₂ + RR + ETCO₂ (Continuous)",detail:"Continuous oximetry, trending RR, non-invasive ETCO₂ if available. Rising pCO₂ trend = NIV failing."},
    {icon:"📸",label:"CXR",detail:"Bilateral infiltrates (ARDS — NIV controversial), cardiogenic edema, COPD hyperinflation, pneumothorax (contraindication to NIV)."},
    {icon:"🫀",label:"EKG + Troponin",detail:"Dysrhythmia contributing to acute decompensation? ACS precipitating acute CHF exacerbation?"},
    {icon:"📋",label:"NIV Failure Risk Assessment",detail:"Assign failure criteria before starting: pH threshold, RR threshold, SpO₂ threshold, duration. Document and communicate to team."},
  ],
  rsi:[
    {icon:"👁️",label:"LEMON Airway Assessment",detail:"Look (unusual facies, trauma, beard, obesity), Evaluate 3-3-2 (mouth opening ≥3 fingers, thyroid-chin ≥3 fingers, hyoid-mouth ≥2 fingers), Mallampati (class III–IV = difficult), Obstruction, Neck mobility."},
    {icon:"🚨",label:"Difficult Airway Equipment",detail:"Video laryngoscope + direct laryngoscopy blades + ETT sizes (6.0–8.5) + stylet + 10cc syringe + tape/holder + iGEL/LMA sizes + bougie + surgical airway kit."},
    {icon:"📊",label:"Pre-oxygenation SpO₂",detail:"Confirm SpO₂ >93% before induction. If unable to pre-oxygenate to 88% → reconsider RSI approach. Consider awake intubation or NIV pre-oxygenation."},
    {icon:"🌬️",label:"ETCO₂ Detector Ready",detail:"Waveform capnography connected and ready BEFORE intubation. Colorimetric CO₂ detectors acceptable if waveform unavailable."},
    {icon:"💉",label:"IV Access + Medications Drawn",detail:"Large-bore IV access × 1 minimum. All medications drawn and labeled. Vasopressor (push-dose epinephrine 10–20 mcg) ready for post-intubation hypotension."},
    {icon:"🩺",label:"Post-Intubation Labs + Imaging",detail:"CXR (ETT position: 2–3 cm above carina), ABG (confirm ventilation/oxygenation), consider point-of-care labs (BMP, CBC) for ongoing management."},
  ],
  daw:[
    {icon:"👁️",label:"LEMON Score",detail:"Look 2pts, Evaluate 3-3-2 (each criterion 1pt), Mallampati class (III=1pt, IV=2pts), Obstruction 2pts, Neck mobility 1pt. Score ≥3 → high probability of difficult intubation."},
    {icon:"🚨",label:"HEAVEN Factors (First-Pass Failure)",detail:"Hypoxemia, Extremes of size (morbid obesity or pediatric), Anatomy (abnormal), Vomit/blood, Exsanguination, No NMBA. HEAVEN ≥3 = high risk of first-pass failure."},
    {icon:"🔧",label:"Difficult Airway Cart Confirmed",detail:"Verify at bedside: VL (charged), all blade sizes, ETTs, iGEL/LMA sizes 3-5, bougie, 14g needle/scalpel + ETT 6.0 (surgical airway kit), Sugammadex 16 mg/kg drawn up."},
    {icon:"💊",label:"Sugammadex 16 mg/kg (drawn and labeled)",detail:"For immediate reversal of rocuronium (CICO rescue). Have drawn before RSI if using rocuronium. IV push undiluted. Reverses NMB in ~3 minutes."},
    {icon:"📋",label:"Communicate Plan A, B, C, D to Team",detail:"Verbally declare plan before proceeding: 'Plan A = VL, Plan B = iGEL, Plan C = awake technique, Plan D = surgical airway.' Assign roles."},
  ],
  ards:[
    {icon:"🫁",label:"ABG (PaO₂/FiO₂ ratio)",detail:"Berlin criteria: ARDS if P/F <300 on PEEP ≥5 cmH₂O within 1 week of insult. Severe: P/F <100. Serial ABGs to guide ARDSNet adjustments."},
    {icon:"📸",label:"CXR / CT Chest",detail:"Bilateral opacities (not fully explained by effusions, collapse, or nodules). CT may reveal heterogeneity — guide prone positioning and PEEP titration."},
    {icon:"🫀",label:"ECHO (Rule out cardiogenic)",detail:"Exclude cardiogenic pulmonary edema (high wedge pressure). ARDS requires absence of fully explained cardiac cause. LVEF, diastolic dysfunction, RV strain assessment."},
    {icon:"📊",label:"Plateau Pressure (Inspiratory Pause)",detail:"Set inspiratory pause 0.5s → read Pplat. MUST be ≤30 cmH₂O. Driving pressure = Pplat − PEEP; target ≤15 cmH₂O. Check daily."},
    {icon:"🧫",label:"Cultures + Causative Workup",detail:"ARDS is a syndrome — identify cause: pneumonia (BAL, sputum, blood cultures), aspiration, sepsis, pancreatitis, trauma. Treat underlying cause simultaneously."},
    {icon:"📉",label:"IBW Calculation (for TV)",detail:"Male: 50 + 2.3 × (height in inches − 60). Female: 45.5 + 2.3 × (height in inches − 60). TV = IBW × 6 mL/kg. NEVER use actual body weight."},
  ],
  vent:[
    {icon:"📊",label:"Plateau Pressure Check (q8h)",detail:"Inspiratory pause 0.5s → Pplat. Goal ≤30 cmH₂O for lung protection. High Pplat: reduce TV by 1 mL/kg (min 4 mL/kg) or suction/decompress."},
    {icon:"💤",label:"RASS Score (q4h)",detail:"Richmond Agitation-Sedation Scale: target -1 to 0 (light sedation) for most patients. Deeper sedation only for specific indications (ARDS + NMB, severe dyssynchrony, ICP management)."},
    {icon:"🧠",label:"CAM-ICU Delirium Screen (q12h)",detail:"Confusion Assessment Method for ICU. Four features: acute change in mental status, inattention, disorganized thinking, altered LOC. Positive CAM-ICU = delirium. Risk factors: benzodiazepines, sleep disruption, immobility."},
    {icon:"🔧",label:"Auto-PEEP Check",detail:"Expiratory pause 0.5s → read total PEEP. Auto-PEEP = Total PEEP − Set PEEP. High auto-PEEP in obstructive disease → increase expiratory time, reduce RR. Disconnect briefly if critical."},
    {icon:"📈",label:"Ventilator Dyssynchrony Assessment",detail:"Observe waveforms: flow-starvation (patient effort exceeds set flow), reverse triggering, ineffective efforts, double-triggering. Dyssynchrony worsens lung injury and patient discomfort."},
    {icon:"💪",label:"Daily Mobility Assessment",detail:"Physical therapy evaluation. Target progressive mobility: turn q2h → dangle → sit → stand → ambulate. Mobility contraindications: unstable hemodynamics, FiO₂ >0.6, agitation, unsafe lines."},
  ],
  wean:[
    {icon:"✅",label:"SAT Safety Screen (Daily, AM)",detail:"FiO₂ ≤0.7, PEEP ≤10; no active seizures; no alcohol/benzo withdrawal; no escalating vasopressors; no active NMBA; no agitation. All must be met."},
    {icon:"🫁",label:"SBT Safety Screen",detail:"SAT passed; P/F >150; PEEP ≤8; RR/TV ratio trending down; no increased WOB at rest; some inspiratory effort present; hemodynamically stable."},
    {icon:"📊",label:"RSBI Measurement",detail:"During 1–2 min of spontaneous effort (T-piece or minimal PS). RSBI = RR ÷ (TV in L). <105 = likely success. Measure immediately before SBT decision."},
    {icon:"🗣️",label:"Cough Assessment",detail:"Ask patient to cough. Assess peak cough flow — vigorous cough = good secretion management. White card test: secretions on card during cough = high volume/thin secretions."},
    {icon:"🔔",label:"Cuff Leak Test",detail:"Deflate cuff → occlude ETT → listen for leak around tube with each breath. Absent leak = post-extubation stridor risk → dexamethasone 0.1 mg/kg q8h × 3 doses before extubation."},
    {icon:"🧠",label:"Mental Status + Commands",detail:"Patient must follow ≥2 of 4 commands (open eyes, look at me, open mouth, stick out tongue). GCS motor score ≥4. Adequate delirium control (CAM-ICU negative preferred)."},
  ],
};

/* ═══ TREATMENT DATA ════════════════════════════════════════════════ */
const TREATMENT = {
  o2:[
    {cat:"Nasal Cannula (NC)",drug:"Low-Flow NC — 1–6 L/min",dose:"1 L/min → FiO₂ ≈24%\n2 L/min → FiO₂ ≈28%\n3 L/min → FiO₂ ≈32%\n4 L/min → FiO₂ ≈36%\n5 L/min → FiO₂ ≈40%\n6 L/min → FiO₂ ≈44%",renal:"No dose adjustments. Humidify at >4 L/min to prevent mucosal drying. Heated humidification increases comfort.",ivpo:"High-flow NC (HFNC): start at 40 L/min for significantly hypoxic patients. Provides more consistent FiO₂ and PEEP effect.",deesc:"Wean by 1 L/min q30 min maintaining target SpO₂. Discontinue when SpO₂ ≥92% on room air.",note:"FiO₂ delivery varies with RR and tidal volume — open-system, variable delivery. Reservoir cannula extends range to 8 L/min.",ref:"BTS 2017"},
    {cat:"Non-Rebreather Mask",drug:"NRB — 10–15 L/min",dose:"10 L/min → FiO₂ ≈60–70%\n12–15 L/min → FiO₂ ≈70–90%\nFill reservoir fully before applying to patient\nEnsure good face seal — check for air leak",renal:"No adjustments. Not appropriate for home therapy.",ivpo:"Escalate to HFNC if NRB insufficient (SpO₂ <92% on 15 L/min NRB). Keep NC in place during RSI for apneic oxygenation.",deesc:"Decrease flow rate once stabilized. Step down to simple mask or NC as FiO₂ requirement falls.",note:"For RSI pre-oxygenation: use at 15 L/min × 3–5 min. Add NC 15 L/min SIMULTANEOUSLY for apneic oxygenation during laryngoscopy.",ref:"BTS 2017"},
    {cat:"Venturi Mask",drug:"Controlled FiO₂ Delivery",dose:"24% (2 L/min blue)\n28% (4 L/min white)\n31% (6 L/min orange)\n35% (8 L/min yellow)\n40% (10 L/min red)\n60% (15 L/min green)\n(Color coding varies by manufacturer — verify with package)",renal:"No adjustments. Refit mask if patient mouth-breathing excessively.",ivpo:"Less suited for high O₂ demand — NRB or HFNC if FiO₂ >0.6 required.",deesc:"Step down adaptor color to lower FiO₂ as SpO₂ allows. Target minimum FiO₂ for SpO₂ 88–92% in COPD.",note:"Preferred for COPD to deliver precise FiO₂ and avoid over-oxygenation. Not appropriate for patients requiring FiO₂ >0.6.",ref:"BTS 2017"},
    {cat:"Apneic Oxygenation",drug:"NC 15 L/min during laryngoscopy",dose:"Place NC at 15 L/min under NRB BEFORE induction\nKeep in place throughout laryngoscopy attempt\nTHRIVE technique: HFNC at 70 L/min (extends apnea time >10 min)",renal:"N/A",ivpo:"HFNC 40–70 L/min (if available and time permits): provides superior apneic oxygenation via transnasal insufflation.",deesc:"Remove once ETT confirmed with ETCO₂ waveform.",note:"Does NOT prevent CO₂ rise during apnea — only delays desaturation. Safe apnea window with adequate pre-oxygenation: 3–8 min depending on patient factors.",ref:"THRIVE study / DAS 2015"},
  ],
  hfnc:[
    {cat:"Initial Setup",drug:"HFNC Initiation Protocol",dose:"Flow: 40–60 L/min (start 40, increase to 60 if poorly tolerated)\nFiO₂: 1.0 initially → titrate to SpO₂ 92–96% (88–92% COPD)\nHumidifier: 37°C (reduce to 31°C if intolerance)\nInterface: large-bore nasal prongs (largest fitting without blanching)",renal:"No dose adjustments. Humidification is essential — discomfort/nosebleed at >4 L/min without heat+humidity.",ivpo:"If HFNC unavailable: NRB + NC is bridging option. NIV (BiPAP) as alternative for hypercapnic patients.",deesc:"Wean FiO₂ FIRST (to ≤0.4), THEN wean flow (5 L/min decrements q4–6h). Transition to NC at flow ≤20 L/min + FiO₂ ≤0.4.",note:"Flow generates 1–3 cmH₂O PEEP effect. Washes nasopharyngeal dead space (reduces anatomical dead space by ~150 mL). Improves mucociliary clearance.",ref:"FLORALI 2015"},
    {cat:"Monitoring — ROX Index",drug:"ROX = (SpO₂/FiO₂) ÷ RR",dose:"Calculate at 2h, 6h, 12h\nROX ≥4.88 at 12h → low failure risk, continue HFNC\nROX 2.85–4.88 → intermediate, monitor closely\nROX <2.85 at 2h → HIGH failure risk → escalate\nTrend: falling ROX = alarming even if above threshold",renal:"N/A",ivpo:"If ROX declining → prepare for BiPAP or intubation. HFNC-to-intubation transition should be planned, not emergency.",deesc:"Continue HFNC 24–48h post-extubation in high-risk patients (OPERA trial). Wean as above.",note:"ROX validated in Roca et al. AJRCCM 2019. Original cutoff 3.85; updated 2.85 at 2h provides earlier decision support.",ref:"Roca et al. 2019"},
    {cat:"Failure Criteria",drug:"Escalation Triggers",dose:"ANY of the following:\n• SpO₂ <90% on FiO₂ 1.0 at 60 L/min\n• RR >35/min despite HFNC\n• ROX <2.85 at 2h\n• Paradoxical / accessory muscle breathing\n• Altered mental status (GCS drop)\n• Hemodynamic instability\n• Patient fatigue or inability to tolerate",renal:"N/A",ivpo:"Next step: BiPAP trial (if hypercapnia concern or COPD) OR direct intubation (if severe hypoxemia, rapid deterioration, or airway protection concern).",deesc:"If 2+ criteria → do NOT persist. Escalate immediately.",note:"Delayed intubation in HFNC failure is associated with significantly worse outcomes. Set clear failure thresholds before initiating HFNC.",ref:"FLORALI 2015"},
  ],
  cpap:[
    {cat:"Acute CPE / CHF",drug:"CPAP 5–10 cmH₂O",dose:"Start: PEEP 5 cmH₂O\nTitrate: 2 cmH₂O increments\nMax: 10–12 cmH₂O (higher may impede cardiac output)\nFiO₂: 1.0 initially → titrate to SpO₂ target",renal:"No adjustments.",ivpo:"BiPAP is equally effective for acute CHF — use if CPAP not tolerated or if concurrent hypercapnia.",deesc:"Reduce PEEP 2 cmH₂O q30–60 min as clinical improvement occurs. Discontinue when SpO₂ ≥92% on FiO₂ ≤0.4 at PEEP 5.",note:"3CPO trial: CPAP and BiPAP both reduced intubation ~50% vs standard O₂ in acute CPE. No mortality difference between CPAP and BiPAP.",ref:"3CPO NEJM 2008"},
    {cat:"OSA — Titration Protocol",drug:"Auto-CPAP or Fixed CPAP",dose:"Auto-CPAP: Range 4–20 cmH₂O (starting point for new diagnosis)\nFixed CPAP: Titrated pressure from PSG (typically 5–15 cmH₂O)\nReview: Download compliance data at 1–4 weeks (target >4 h/night, ≥70% nights)",renal:"No adjustments. Humidification reduces nasal dryness.",ivpo:"BiPAP if CPAP pressure >15 cmH₂O for 90th percentile, CPAP-intolerant, OHS, central sleep apnea, or residual AHI >5 on optimal CPAP.",deesc:"No wean for OSA — lifelong therapy. Reassess if significant weight loss (>10% body weight) — may allow pressure reduction or discontinuation.",note:"Adherence >4h/night required for cardiovascular risk reduction. CPAP reduces hypertension, arrhythmia, and CVA risk in moderate-severe OSA.",ref:"AASM 2021"},
    {cat:"Post-operative Hypoxemia",drug:"CPAP 5–8 cmH₂O",dose:"Initiate CPAP 5–8 cmH₂O post-operatively if SpO₂ <92% on NC\nPreemptive CPAP in high-risk patients (OSA, BMI >40, abdominal surgery)\nFiO₂: Titrate to SpO₂ 92–96%",renal:"No adjustments.",ivpo:"HFNC 40–60 L/min as alternative with better tolerance for some patients.",deesc:"Wean PEEP as SpO₂ improves. Resume home CPAP settings if known OSA.",note:"Atelectasis is the most common cause of post-op hypoxemia — CPAP recruits atelectatic lung more effectively than supplemental O₂ alone.",ref:""},
  ],
  bipap:[
    {cat:"COPD Exacerbation (Primary Indication)",drug:"BiPAP Settings — AECOPD",dose:"IPAP: Start 8–10 cmH₂O → titrate by 2 cmH₂O to max 20–22 cmH₂O\nEPAP: 4–5 cmH₂O (titrate to oxygenation)\nBackup Rate: 10–12/min\nFiO₂: Target SpO₂ 88–92% (avoid over-oxygenation)\nPS = IPAP − EPAP: target 8–15 cmH₂O",renal:"No adjustments. Interface care: check every 2–4h for skin breakdown.",ivpo:"If IPAP requirement >22 cmH₂O and no improvement → intubation. If pH >7.35 and improving → wean IPAP by 2 cmH₂O/session.",deesc:"Wean IPAP first (by 2 cmH₂O q4–8h). Transition to CPAP when IPAP 8–10 and EPAP 4–5 tolerated. Then NC.",note:"Grade A evidence: BiPAP reduces intubation by 50–65% and mortality by 48% in AECOPD with pH 7.25–7.35 (3 Cochrane reviews). Start within 1h of diagnosis.",ref:"GOLD 2023 / BTS 2016"},
    {cat:"Acute Hypercapnic Failure",drug:"ABG-Guided BiPAP Titration",dose:"Base titration on ABG at 1–2h:\n• pH improving + pCO₂ falling → continue, wean support\n• pH unchanged → increase IPAP 2 cmH₂O\n• pH <7.25 with no response → intubate\n• pH >7.35 → begin wean",renal:"N/A",ivpo:"IV doxapram 1.5–4 mg/min can be used as adjunct to NIV in AECOPD if BiPAP tolerance poor (BTS guideline — limited evidence).",deesc:"Failure criteria: pH <7.25 after 1–2h trial, RR >30 despite NIV, worsening hypoxemia, AMS, hemodynamic instability, inability to tolerate interface.",note:"Define success/failure criteria BEFORE starting. Communicate to patient, family, and team. Document ceiling of care if applicable.",ref:"BTS 2016"},
    {cat:"OHS / Hypoventilation",drug:"BiPAP for Obesity Hypoventilation",dose:"Similar IPAP/EPAP settings as COPD\nEnsure adequate TV: target 5–7 mL/kg IBW\nHigher backup rate (14–16/min) may be needed\nLong-term: average volume-assured pressure support (AVAPS) for home therapy",renal:"No adjustments.",ivpo:"Auto-BiPAP / AVAPS (volume-assured mode) for home management — automatically adjusts IPAP to achieve target TV.",deesc:"Transition to home BiPAP before discharge. Sleep medicine referral for long-term management.",note:"OHS diagnosis: awake pCO₂ >45 + BMI >30 + exclusion of other causes. BiPAP preferred over CPAP alone in OHS.",ref:"ERS 2019"},
    {cat:"CHF / Cardiogenic Pulmonary Edema",drug:"BiPAP for Acute CPE",dose:"IPAP: 8–12 cmH₂O\nEPAP: 4–8 cmH₂O (higher PEEP beneficial in CHF)\nFiO₂: 1.0 initially\nSimultaneous treatment: diuretics, nitrates, morphine PRN",renal:"No adjustments.",ivpo:"CPAP equally effective in acute CPE (3CPO trial). Use BiPAP if concurrent hypercapnia (pCO₂ >45 mmHg).",deesc:"Reduce FiO₂ first, then reduce pressures as diuresis and clinical improvement occur. Transition to NC.",note:"Reduces preload (EPAP effect) and afterload. High EPAP may impede venous return — monitor BP after initiation.",ref:"3CPO NEJM 2008"},
  ],
  rsi:[
    {cat:"STEP 1 — Pre-Oxygenation",drug:"NRB 15 L/min + NC 15 L/min",dose:"NRB: 15 L/min × 3–5 min → target SpO₂ >93–95%\nNC: 15 L/min simultaneously (leave in during laryngoscopy)\nHFNC alternative: 40–70 L/min (THRIVE) if time permits\nUpright 20–30°: improves FRC, reduces aspiration risk",renal:"N/A",ivpo:"If SpO₂ cannot reach >88% despite pre-oxygenation → consider BMV pre-oxygenation. Do NOT withhold BMV for aspiration fear if patient hypoxic.",deesc:"Continue NC throughout laryngoscopy for apneic oxygenation. Safe apnea time 3–8 min in well pre-oxygenated patient.",note:"Pre-oxygenation is the MOST IMPORTANT step in RSI. Every minute of quality pre-oxygenation extends safe apnea time. Do NOT rush.",ref:"DAS 2015"},
    {cat:"STEP 2 — Induction (Hemodynamically Stable)",drug:"Etomidate",dose:"0.3 mg/kg IV (give over 30–60s)\nOnset: 30–60s · Duration: 3–8 min",renal:"Hepatic metabolism — no renal dose adjustment",ivpo:"Propofol 1.5–2 mg/kg IV (alternative; AVOID if hypotension — causes cardiovascular depression)",deesc:"Single dose adrenal suppression — avoid in known adrenal insufficiency. Acceptable in septic shock (single dose). No cardiovascular depression.",note:"MOST hemodynamically neutral induction agent. Preferred for most emergency intubations where ketamine not indicated.",ref:"UpToDate 2024"},
    {cat:"STEP 3 — Induction (Shock / Bronchospasm)",drug:"Ketamine",dose:"1.5–2.0 mg/kg IV\nOnset: 30–60s · Duration: 10–20 min\n(Can use 1–1.5 mg/kg if hemodynamically compromised)",renal:"Primarily hepatic metabolism. No significant renal adjustment.",ivpo:"Ketamine + midazolam 0.1 mg/kg: reduces emergence reactions (dysphoria) — use if time allows.",deesc:"Avoid in: hypertensive emergencies (BP >200/120), aortic dissection (relative CI). Causes catecholamine surge.",note:"FIRST-LINE for shock, hypotension, bronchospasm, asthma. Maintains hemodynamics via sympathomimetic effect. Preserves airway reflexes but NOT aspiration protection.",ref:"UpToDate 2024"},
    {cat:"STEP 4 — Induction (ICP / Neuro)",drug:"Propofol",dose:"1.5–2.0 mg/kg IV (reduce to 0.5–1.0 mg/kg if elderly, frail, or hemodynamically compromised)\nOnset: 30s · Duration: 3–8 min",renal:"No renal adjustment (hepatic). Propofol infusion syndrome with prolonged use.",ivpo:"Have vasopressor ready (push-dose epinephrine 10–20 mcg IV) — significant hypotension common.",deesc:"AVOID if MAP <65 mmHg. Preferred for neurological indications: reduces cerebral metabolic demand, ICP.",note:"Reduces ICP and cerebral oxygen demand. Associated with hypotension in 30–50% of patients. Have vasopressor immediately available.",ref:"UpToDate 2024"},
    {cat:"STEP 5a — Paralytic (First-Line)",drug:"Succinylcholine",dose:"1.5 mg/kg IV (max 200 mg)\nOnset: 45s · Duration: 10–15 min\nGive immediately after induction agent",renal:"Plasma cholinesterase degradation — no renal dose adjustment",ivpo:"No reversal agent exists. Duration determined by pseudocholinesterase activity (prolonged in atypical cholinesterase, liver failure, pregnancy).",deesc:"CONTRAINDICATED: K+ >5.5, burns >24–48h, crush injury, spinal cord injury >72h, NMD (Duchenne, myasthenia), MH history, immobilization >72h.",note:"Depolarizing NMBA — fasciculations cause transient K+ rise of 0.5–1.0 mEq/L. Short duration ideal if intubation uncertainty.",ref:"UpToDate 2024"},
    {cat:"STEP 5b — Paralytic (Alternative/CICO Reversal)",drug:"Rocuronium",dose:"RSI dose: 1.2–1.6 mg/kg IV\nOnset: 60–90s (at 1.2 mg/kg) · Duration: 45–70 min",renal:"Hepatic elimination — prolonged effect in hepatic failure. Use with caution.",ivpo:"REVERSAL: Sugammadex 16 mg/kg IV (undiluted, IV push) → reverses NMB within ~3 min (CICO/immediate rescue). Draw up BEFORE using rocuronium for RSI.",deesc:"Non-depolarizing NMBA. No contraindication in hyperkalemia states. Preferred if succinylcholine contraindicated.",note:"At 1.6 mg/kg: onset approaches succinylcholine. MUST have sugammadex 16 mg/kg drawn and available at bedside before RSI if using rocuronium.",ref:"UpToDate 2024"},
    {cat:"STEP 6 — Confirm + Post-Intubation",drug:"ETCO₂ + Initial Vent Settings",dose:"Confirm: Waveform ETCO₂ (sustained waveform × 6 breaths) + bilateral BS + chest rise + CXR\nETT depth: 22–24 cm at lip (men); 20–22 cm at lip (women)\nInitial vent: TV 6–8 mL/kg IBW, RR 14, FiO₂ 1.0, PEEP 5\nSedation: Propofol 5–50 mcg/kg/min OR midazolam 0.02–0.1 mg/kg/h\nAnalgesia: Fentanyl 25–100 mcg/h (analgesia FIRST)",renal:"Fentanyl: no adjustment. Morphine: avoid in CKD (active metabolite accumulates). Cisatracurium: preferred NMB in renal failure.",ivpo:"Initiate sedation/analgesia BEFORE paralytic wears off. Delayed treatment = patient awake and paralyzed (conscious paralysis).",deesc:"Daily sedation vacation (SAT). RASS target -1 to 0. Begin weaning assessment once underlying cause improving.",note:"Start POST-INTUBATION sedation + analgesia IMMEDIATELY. Do not leave patient paralyzed without sedation. Order vent settings, monitoring, nursing orders simultaneously.",ref:"PADIS 2018"},
  ],
  daw:[
    {cat:"PLAN A — Video Laryngoscopy",drug:"Primary Laryngoscopy Attempt",dose:"VL preferred: C-MAC D-blade, GlideScope, McGrath (hyperangulated)\nDL alternative: Mac 3–4 or Miller 2–3\nExternal Laryngeal Manipulation (BURP): Backward-Upward-Rightward-Pressure\nBougie-assisted: place bougie blindly over epiglottis, railload ETT\nMaximum 3 attempts total by any operator",renal:"N/A",ivpo:"Optimize between attempts: suction, HELIOX if available, different blade, change operator, change position.",deesc:"After 3 failed Plan A attempts → DECLARE FAILED AIRWAY. Proceed to Plan B. Ensure oxygenation is maintained at all times.",note:"OXYGENATE between attempts. Accept Plan B sooner if SpO₂ <90% or declining — do NOT pursue repeated attempts at the cost of oxygenation.",ref:"DAS 2022"},
    {cat:"PLAN B — Supraglottic Airway (SGA)",drug:"iGEL or LMA (2nd generation preferred)",dose:"iGEL: size 3 (30–60kg), 4 (50–90kg), 5 (>90kg)\nLMA Supreme: size 3, 4, or 5 — inflate cuff\nInsert: midline, smooth insertion without rotation\nConfirm: seal pressure >25 cmH₂O, bilateral BS, ETCO₂",renal:"N/A",ivpo:"Nasal/oral airway + jaw thrust if SGA fails (basic maneuver to maintain oxygenation while escalating plan).",deesc:"SGA is bridge — facilitate intubation through SGA (Aintree catheter + FOB) or defer to awake technique. Plan definitive airway within 1h.",note:"2nd generation SGAs (iGEL, LMA Supreme, ProSeal) provide gastric access and better aspiration protection than 1st generation. Choose 2nd gen for emergency use.",ref:"DAS 2022"},
    {cat:"PLAN C — Awake Intubation",drug:"Awake Fiberoptic or VL with Topicalization",dose:"Topicalization: Lidocaine 4% spray/nebulization to oropharynx\nAirway block: Transtracheal injection 4% lidocaine 3 mL (advanced)\nSedation: Ketamine 0.3–0.5 mg/kg IV (dissociative) ± Dexmedetomidine 0.5–1 mcg/kg over 10 min\nPatient AWAKE and spontaneously breathing throughout — never deeply sedated",renal:"Lidocaine: reduce dose in hepatic failure (max total dose 7 mg/kg with vasoconstrictor).",ivpo:"Awake nasal intubation (video or FOB): alternative in anticipated difficult anatomy, limited mouth opening.",deesc:"Awake intubation allows bail-out if fails — patient maintains airway. Convert to RSI only once tube confirmed in trachea.",note:"Awake intubation = gold standard for anticipated difficult airway. PREPARE topicalization ×10 minutes before attempt. Patient cooperation critical.",ref:"DAS 2022"},
    {cat:"PLAN D — CICO (Surgical Airway)",drug:"Emergency Scalpel Cricothyrotomy",dose:"KNIFE-FINGER-TUBE technique:\n1. Laryngeal handshake → identify CTM\n2. Transverse or vertical stab incision through CTM\n3. Finger entry → dilate opening\n4. Bougie insertion → ETT 6.0 cuffed\n5. Inflate cuff → ventilate → ETCO₂ confirm\nCommercial kits (Melker wire-guided) slower — scalpel preferred in true CICO",renal:"N/A",ivpo:"Surgical reversal of rocuronium: Sugammadex 16 mg/kg IV — if oxygenation possible and NMBA reversal could allow awakening, consider before surgical airway.",deesc:"Surgical cricothyrotomy is definitive. Formal tracheostomy by ENT/surgery within 24–72h. Maintain tube position — cricothyrotomy tube displacement is high-risk.",note:"DECLARE CICO aloud. Stop all laryngoscopy. Call for help. Proceed IMMEDIATELY. Every second of delay worsens outcome. Cricothyrotomy within 2 min of CICO declaration.",ref:"DAS 2022 / eFONA"},
  ],
  ards:[
    {cat:"Lung-Protective Ventilation (ARDSNet)",drug:"Tidal Volume — 6 mL/kg PBW",dose:"Male PBW (kg): 50 + 2.3 × (height inches − 60)\nFemale PBW (kg): 45.5 + 2.3 × (height inches − 60)\nStart at 6 mL/kg → range 4–8 mL/kg\nIf plateau >30 cmH₂O → reduce TV by 1 mL/kg (min 4 mL/kg)\nPermissive hypercapnia: pH ≥7.20 acceptable",renal:"N/A",ivpo:"N/A",deesc:"Wean support as lung compliance improves. Plateau <25 cmH₂O + improving P/F + reducing PEEP requirement = transition to PSV weaning.",note:"NEVER use actual body weight for ARDS vent calculations. Use PBW from height. ARDSNet NEJM 2000: mortality 40→31% with 6 vs 12 mL/kg PBW TV.",ref:"ARDSNet NEJM 2000"},
    {cat:"PEEP / FiO₂ — Low PEEP Table",drug:"Low PEEP ARDSNet Protocol",dose:"FiO₂ 0.3 → PEEP 5\nFiO₂ 0.4 → PEEP 5–8\nFiO₂ 0.5 → PEEP 8–10\nFiO₂ 0.6 → PEEP 10\nFiO₂ 0.7 → PEEP 10–14\nFiO₂ 0.8 → PEEP 14\nFiO₂ 0.9 → PEEP 14–18\nFiO₂ 1.0 → PEEP 18–24",renal:"N/A",ivpo:"High PEEP table (severe ARDS P/F <100):\nFiO₂ 0.3→PEEP 12; 0.4→14–16; 0.5→16–18; 0.6→20; 0.7→20; 0.8→20–22; 0.9→22; 1.0→22–24",deesc:"Wean FiO₂ to ≤0.5 first, then wean PEEP by 2 cmH₂O q4h, monitoring for desaturation. Target SpO₂ 88–95% / PaO₂ 55–80 mmHg.",note:"Driving pressure (Plateau − PEEP) ≤15 cmH₂O is the key target — strongest predictor of ARDS mortality (Amato et al. NEJM 2015).",ref:"ARDSNet 2000 / Amato NEJM 2015"},
    {cat:"Prone Positioning",drug:"≥16 hours/day prone",dose:"Criteria: P/F <150 on FiO₂ ≥0.6 + PEEP ≥5 + 6 mL/kg TV\nInitiate within 36–48h of ARDS diagnosis\nProtocol: 16h prone → 8h supine (PROSEVA: 28-day mortality 16% vs 33%)\nTeam: 5 people minimum for safe proning",renal:"N/A",ivpo:"Prone positioning can be combined with NMB (cisatracurium) for severe ARDS + dyssynchrony.",deesc:"Discontinue prone when: P/F >150 on PEEP ≤10 + FiO₂ ≤0.6 sustained ≥4h in SUPINE position for 2 consecutive sessions.",note:"PROSEVA is the landmark trial: prone 16h/day reduced 28-day mortality from 32.8% to 16% in moderate-severe ARDS (P/F <150). Early prone is critical.",ref:"PROSEVA NEJM 2013"},
    {cat:"Neuromuscular Blockade (First 48h)",drug:"Cisatracurium",dose:"Load: 0.2 mg/kg IV\nInfusion: 0.06–0.6 mg/kg/h\nDuration: 48h (reassess daily after 24h)\nMonitor: Train-of-four (TOF) — target 1–2 twitches (not 0)",renal:"Hofmann elimination — NO dose adjustment needed in renal or hepatic failure. Preferred NMBA in organ failure.",ivpo:"Vecuronium or pancuronium as alternatives if cisatracurium unavailable. Avoid in CKD (active metabolite accumulation).",deesc:"After 48h: reassess indication. Discontinue NMB if: dyssynchrony resolved, plateau ≤30, oxygenation improving. Re-trial light sedation.",note:"ROSE trial (2019) — NMB did not reduce mortality vs light sedation strategy. But 48h NMB still indicated for severe dyssynchrony, plateau >30, or P/F <100.",ref:"ACURASYS 2010 / ROSE 2019"},
    {cat:"Oxygenation Targets + Adjuncts",drug:"Targets + Rescue Therapies",dose:"SpO₂ 88–95% (PaO₂ 55–80 mmHg)\nPlateau: ≤30 cmH₂O\nDriving pressure: ≤15 cmH₂O\nRR: up to 35/min to correct pH ≥7.20\nFluid: conservative strategy once hemodynamically stable (FACTT trial)\nRescue: Inhaled NO (pulmonary vasodilator, 5–40 ppm), PEEP optimization, iNO, prone, ECMO consultation",renal:"N/A",ivpo:"ECMO (VV-ECMO): rescue for refractory ARDS P/F <80 or CO₂ failure. Refer to ECMO center early (<7 days ventilation preferred).",deesc:"Steroid controversy: dexamethasone 0.2 mg/kg × 5 days then 0.1 mg/kg × 5 days (DEXA-ARDS trial: 60-day mortality benefit in moderate-severe ARDS).",note:"Conservative fluid strategy reduces ventilator days by 2.5 days (FACTT trial) without increasing organ failure.",ref:"FACTT NEJM 2006 / DEXA-ARDS 2020"},
  ],
  vent:[
    {cat:"Mode: Volume Control A/C (AC-VC)",drug:"Standard ICU Ventilation Mode",dose:"TV: 6–8 mL/kg IBW (6 mL/kg for ARDS)\nRR: 12–16/min (up to 35 for ARDS pH correction)\nFiO₂: Start 1.0 → wean to SpO₂ 92–96%\nPEEP: 5 cmH₂O (standard), adjust per ARDS protocol\nFlow: 60 L/min (square wave) / Inspiratory time: 1s / I:E 1:2–1:3\nInspiratory pause: 0.5s to measure plateau pressure",renal:"N/A",ivpo:"Transition to PSV when: underlying cause improving, FiO₂ ≤0.5, PEEP ≤8, some spontaneous effort.",deesc:"Wean: reduce RR first → reduce FiO₂ → reduce PEEP. When FiO₂ 0.4 + PEEP 5 + RR 12 → trial PSV or SBT.",note:"Most common ICU mode. Guarantees minute ventilation. Monitor peak and plateau pressure — peak includes airway resistance; plateau reflects true alveolar pressure.",ref:""},
    {cat:"Mode: Pressure Control A/C (AC-PC)",drug:"Pressure-Controlled Ventilation",dose:"PC above PEEP: 10–20 cmH₂O (adjust to target TV 6–8 mL/kg IBW)\nRR, FiO₂, PEEP: as per AC-VC\nInspiratory time: 0.8–1.2s (adjust I:E ratio)\nMonitor TV closely — varies with patient compliance/effort",renal:"N/A",ivpo:"PRVC (Pressure-Regulated Volume Control): hybrid mode — sets target TV, auto-adjusts pressure. Preferred by many for lung protection.",deesc:"Wean PC level as lung compliance improves. Transition to PSV when TV targets met at lower PC levels.",note:"Decelerating flow improves gas distribution and comfort. TV not guaranteed — watch for over-distension if compliance improves suddenly.",ref:""},
    {cat:"Mode: Pressure Support (PSV) — Weaning",drug:"PSV — Patient-Triggered, Pressure-Supported",dose:"PS: 5–20 cmH₂O above PEEP\nTarget: TV 5–8 mL/kg IBW, RR <30\nFiO₂ and PEEP maintained as clinically needed\nReduce PS: by 2–4 cmH₂O q4–8h as tolerated\nPS ≤8 cmH₂O ≈ minimal support (similar to T-piece)",renal:"N/A",ivpo:"SIMV adds mandatory backup breaths — use if respiratory drive uncertain. PSV alone preferred for most weaning.",deesc:"When PS ≤8 cmH₂O tolerated × 30–60 min → perform formal SBT. If SBT passes → extubate.",note:"PSV requires intact respiratory drive — no backup rate guarantees. Reduces respiratory work proportional to PS level. Primary weaning mode in most ICUs.",ref:""},
    {cat:"ABCDEF Bundle — ICU Liberation",drug:"Daily Structured Protocol",dose:"A — Assess, prevent, manage Pain (analgesia first: fentanyl, avoid routine benzo)\nB — Breathing: daily SBT when screen passed\nC — Choice of analgesia/sedation: target RASS -1 to 0\nD — Delirium: CAM-ICU q12h; avoid anticholinergics, promote sleep\nE — Early mobility and Exercise: OT/PT within 48–72h\nF — Family engagement: daily family communication, include in rounds",renal:"RASS target -1 to 0. Deeper sedation only for: NMB, severe ICP, refractory status epilepticus, ARDS + severe dyssynchrony.",ivpo:"Delirium pharmacotherapy: quetiapine 25–50mg PO q12h preferred. Avoid haloperidol (not evidence-based for ICU delirium). Melatonin 3–5mg qHS for sleep.",deesc:"Implement from Day 1. Daily assessment. Every bundle element reduces ICU delirium prevalence and MV days.",note:"ABCDEF bundle reduces delirium by 35%, ICU-acquired weakness, and hospital mortality (Marra et al. CCM 2017).",ref:"SCCM PADIS 2018"},
    {cat:"Obstructive Disease (COPD/Asthma) Ventilation",drug:"Auto-PEEP Prevention Strategy",dose:"RR: 10–14/min (slow to allow expiration)\nTV: 6–8 mL/kg IBW (lower if auto-PEEP detected)\nI:E ratio: 1:4 or 1:5 (prolong expiration)\nFiO₂: titrate to SpO₂\nSet PEEP: 0–5 (keep low unless using for intrinsic PEEP compensation)\nMeasure auto-PEEP (expiratory pause) and total PEEP",renal:"N/A",ivpo:"Auto-PEEP crisis: Disconnect from ventilator briefly → allows passive exhalation. Reconnect when hemodynamics stabilize.",deesc:"Ketamine infusion 0.5–2 mg/kg/h: bronchodilator effect in refractory bronchospasm. Heliox (80:20) reduces airway resistance.",note:"Dynamic hyperinflation (auto-PEEP) in obstructive disease → decreased venous return, hypotension, pneumothorax. Prevention: slow rate + long expiratory time.",ref:""},
  ],
  wean:[
    {cat:"STEP 1 — SAT (Spontaneous Awakening Trial)",drug:"Daily Sedation Interruption",dose:"Safety screen BEFORE SAT:\n✓ FiO₂ ≤0.7, PEEP ≤10 cmH₂O\n✓ No active seizures\n✓ No active alcohol/benzo withdrawal\n✓ No agitation requiring escalating sedation\n✓ No neuromuscular blockade active\nStop all sedation and opioids for up to 4h\nSAT FAIL: any of — agitation, SpO₂ <88%, RR >35, HR >140 or <60, SBP >180 or <90",renal:"N/A",ivpo:"SAT FAIL → restart sedation at 50% prior dose. Investigate reason. Retry SAT next day.",deesc:"SAT PASS → immediately perform SBT (do NOT delay). Paired SAT+SBT reduces MV duration by 3 days (ABC trial 2008).",note:"PAIRED SAT + SBT protocol is the most evidence-based intervention for ventilator liberation. Implement from Day 1 of ICU admission.",ref:"ABC Trial Girard NEJM 2008"},
    {cat:"STEP 2 — SBT (Spontaneous Breathing Trial)",drug:"30–120 Minute SBT",dose:"Method: PS 5 cmH₂O + PEEP 5 OR T-piece\nDuration: 30–120 min (30 min equivalent for most patients)\nSBT PASS criteria (all required):\n✓ RR <35/min\n✓ SpO₂ ≥90% (≥88% for chronic hypoxemia)\n✓ HR <140 and stable (change <20%)\n✓ SBP 90–180 mmHg\n✓ No increasing WOB (diaphoresis, accessory muscles, paradox)\n✓ No agitation, anxiety, or mental status change",renal:"N/A",ivpo:"SBT FAIL → return to full support settings. Investigate reason: secretions, pain, weakness, psychologic dependence, cardiac failure.",deesc:"SBT FAIL: same mode + settings as prior to SBT. Address reason for failure. Retry SBT in 24h.",note:"T-piece SBT more demanding than PS 5/5 — consider T-piece for patients expected to have higher post-extubation work of breathing.",ref:"ACCP/ATS 2017"},
    {cat:"STEP 3 — RSBI Calculation",drug:"Rapid Shallow Breathing Index",dose:"RSBI = RR ÷ (TV in L) [measure during spontaneous breathing]\nRSBI <105: likely extubation success (sensitivity 97%, specificity 64%)\nRSBI 80–105: intermediate confidence\nRSBI >105: high probability of failure\nMeasure during T-piece or minimal PS (PS 0–5 cmH₂O)\nRepeat if borderline — use as one of multiple criteria",renal:"N/A",ivpo:"RSBI is a SCREENING tool — not standalone criterion. Integrate with clinical assessment, cough, secretions, mental status.",deesc:"Use RSBI + clinical SBT pass criteria together. RSBI <80 + SBT pass = strong extubation confidence.",note:"Yang & Tobin NEJM 1991 original validation. RSBI was derived to predict SBT success — still the most widely used single extubation predictor.",ref:"Yang & Tobin NEJM 1991"},
    {cat:"STEP 4 — Extubation Criteria",drug:"Readiness for Extubation",dose:"ALL must be met:\n✓ SBT PASS (30–120 min)\n✓ Alert, follows ≥2 commands\n✓ Adequate cough (can clear secretions)\n✓ Secretions manageable (suction q≥2h sufficient)\n✓ Cuff leak present (or dexamethasone pretreatment given)\n✓ No immediate re-intubation indication\n✓ Airway trauma/edema low risk\nHigh-risk groups: age >65, CHF, APACHE >12, BMI >30, prior extubation failure",renal:"N/A",ivpo:"Post-extubation HFNC: 40–50 L/min for high-risk patients (Hernandez JAMA 2016 — reduces 72h re-intubation). BiPAP for hypercapnia risk.",deesc:"Re-intubation within 72h = 5–8× higher mortality. Identify high-risk patients → plan HFNC or NIV post-extubation BEFORE extubating.",note:"Cuff leak absent → dexamethasone 0.1 mg/kg q8h × 3 doses before elective extubation to reduce post-extubation stridor.",ref:"ACCP/ATS 2017"},
    {cat:"Post-Extubation Support",drug:"HFNC / NIV Protocol",dose:"Standard risk: NC 2–6 L/min\nHigh risk (any of above): HFNC 40–50 L/min, FiO₂ titrated\nHypercapnia risk (COPD, OHS): BiPAP at prior home or acute NIV settings\nStridor: Heliox 80:20 via facemask, dexamethasone 0.1 mg/kg IV, racemic epinephrine nebulized",renal:"N/A",ivpo:"Reintubation criteria: RR >30 + SpO₂ <90% + increasing WOB despite post-extubation support → immediate reintubation.",deesc:"HFNC: wean flow when FiO₂ ≤0.4 and flow ≤20 L/min. Transition to NC then room air.",note:"OPERA trial: HFNC non-inferior to NIV post-extubation in high-risk patients. HFNC preferred for comfort; BiPAP when hypercapnia expected.",ref:"JAMA 2016"},
  ],
};

const FOLLOWUP = {
  o2:["Reassess SpO₂ 15–30 min after O₂ initiation or adjustment","ABG if clinical concern for hypoventilation, COPD, or rising pCO₂","Wean O₂ to lowest FiO₂ maintaining target SpO₂ — unnecessary O₂ causes hyperoxia and worsens outcomes","Identify and treat underlying cause — O₂ is not treatment, it's support","Consider escalation to HFNC if >6 L/min NC or 15 L/min NRB not maintaining target SpO₂"],
  hfnc:["ROX index at 2h, 6h, 12h — trend matters as much as absolute value","ABG at 1–2h post-initiation — confirm pCO₂ not rising","SpO₂ and RR continuous monitoring — rising RR or falling ROX = escalate","Pre-declare failure criteria and escalation plan before initiating HFNC","Post-extubation: HFNC 24–48h in high-risk patients (reduces re-intubation)"],
  cpap:["CPAP compliance download at 1–4 weeks: >4h/night, ≥70% nights = adherent","Residual AHI >5 on auto-CPAP → manual titration or switch to BiPAP","Morning SpO₂ and symptoms review — daytime sleepiness, headache = inadequate control","Mask fit reassessment at each visit — air leaks reduce efficacy","Reassess CPAP need if weight loss >10% or surgical correction (tonsillectomy, bariatric surgery)"],
  bipap:["ABG at 1–2h post-NIV initiation — MANDATORY to assess response","Reassess interface seal q2h — skin breakdown at bridge of nose is common","Set explicit failure criteria before initiating — pH, RR, SpO₂ thresholds","Communicate ceiling of care to patient and team before NIV commencement","COPD: target pH >7.35 within 2h. If no improvement → intubate promptly.","Wean: IPAP by 2 cmH₂O q4–8h when clinically improving → CPAP → NC"],
  rsi:["Confirm tube position: ETCO₂ waveform × 6 breaths + CXR (2–3 cm above carina)","Initiate sedation + analgesia immediately post-intubation","Start initial vent settings: TV 6–8 mL/kg IBW, RR 14, FiO₂ 1.0, PEEP 5","Post-intubation hypotension: fluid bolus + push-dose epinephrine. Consider fentanyl excess, tension PTX, auto-PEEP.","Begin weaning assessment once underlying cause improving","Daily SAT+SBT from Day 1 of intubation"],
  daw:["If CICO: surgical airway confirmation → ENT consult for formal tracheostomy within 24–72h","Document difficult airway in medical record and alert bracelet","Communicate airway difficulty to patient, family, and all providers (anesthesia, outpatient records)","Investigate root cause: inadequate assessment, equipment failure, team communication","Debrief team within 24h — critical event review","Post-airway: confirm vent settings, labs, CXR, sedation/analgesia orders"],
  ards:["Daily plateau pressure and driving pressure assessment","Proning: assess response (P/F improvement >20%) after each session. Continue until supine P/F >150 sustained.","Conservative fluid balance: document daily I&O, target euvolemia after initial resuscitation","Weaning readiness: P/F >200 on PEEP ≤8 + FiO₂ ≤0.5 + resolving underlying cause → begin liberation assessment","Steroid discussion with team: dexamethasone protocol for moderate-severe ARDS early phase (DEXA-ARDS)","Rehabilitation planning: early mobility, PT/OT, nutritional support, DVT prophylaxis"],
  vent:["ABCDEF bundle daily: SAT+SBT paired, delirium screening, mobility, family communication","Ventilator check q8h: verify settings match orders, alarms functional, circuit integrity","Plateau pressure measurement at least daily in ARDS — every vent adjustment","VAP prevention bundle: HOB 30–45°, oral care with chlorhexidine q6h, spontaneous breathing trials daily, minimize sedation","Nutrition: enteral nutrition within 24–48h of intubation (early EN reduces infection risk)","DVT prophylaxis: enoxaparin or heparin SQ unless contraindicated"],
  wean:["Document SAT safety screen result daily (pass/fail + reason)","SBT result documented with parameters at start and end of trial","RSBI trended — falling RSBI indicates improving respiratory reserve","Post-extubation: plan HFNC or NIV for high-risk patients BEFORE extubating","Reintubation criteria defined at bedside and communicated to nursing team","Re-intubation within 72h: root cause analysis, consider tracheostomy if prolonged ventilation expected (>14 days)"],
};

const REFS = {
  o2:"BTS O₂ Guideline 2017; Stub et al. DETO₂X-AMI JAMA 2018",
  hfnc:"Frat et al. FLORALI. NEJM 2015; Roca et al. ROX Index. AJRCCM 2019; Hernandez et al. JAMA 2016",
  cpap:"McEvoy et al. 3CPO. NEJM 2008; AASM Clinical Practice Guidelines 2021",
  bipap:"GOLD Guidelines 2023; BTS NIV Guidelines 2016; Brochard et al. NEJM 1995",
  rsi:"DAS 2015 Guidelines; Brown et al. RSI Review. ACEP 2023; PADIS Guidelines 2018",
  daw:"DAS 2022 Difficult Airway Guidelines; eFONA Protocol; Frerk et al. BJA 2015",
  ards:"ARDSNet NEJM 2000; Guérin et al. PROSEVA NEJM 2013; Amato et al. NEJM 2015; Villar et al. DEXA-ARDS 2020",
  vent:"SCCM PADIS Guidelines 2018; Marra et al. ABCDEF Bundle CCM 2017; Cairo JM. Pilbeam's Mechanical Ventilation 2020",
  wean:"Yang & Tobin. RSBI. NEJM 1991; Girard et al. ABC Trial NEJM 2008; Hernandez et al. JAMA 2016; Schmidt et al. ACCP/ATS 2017",
};

/* ═══ RSI DRUG CALCULATOR ═══════════════════════════════════════════ */
function RSICalc() {
  const [wt, setWt] = useState("");
  const [unit, setUnit] = useState("kg");
  const wKg = unit==="lb" ? parseFloat(wt)*0.453592 : parseFloat(wt);
  const valid = !isNaN(wKg) && wKg > 0;

  const drugs = [
    { group:"Induction Agents", color:T.gold, items:[
      { name:"Etomidate",          dose:0.3, max:20,  suffix:"mg/kg IV", note:"Hemodynamically neutral · single-dose adrenal suppression" },
      { name:"Ketamine",           dose:1.5, max:null, suffix:"mg/kg IV", note:"Shock/bronchospasm · maintains hemodynamics" },
      { name:"Propofol",           dose:1.5, max:null, suffix:"mg/kg IV", note:"Neuro indications · AVOID if MAP <65" },
    ]},
    { group:"Paralytics", color:T.coral, items:[
      { name:"Succinylcholine",    dose:1.5, max:200, suffix:"mg/kg IV", note:"Onset 45s · 10–15 min · contraindicated in hyperkalemia" },
      { name:"Rocuronium (RSI)",   dose:1.2, max:null, suffix:"mg/kg IV", note:"Onset 60–90s · 45–70 min · reverse with sugammadex" },
      { name:"Rocuronium (CICO)",  dose:1.6, max:null, suffix:"mg/kg IV", note:"Higher dose for RSI-equivalent onset speed" },
    ]},
    { group:"Reversal", color:T.green, items:[
      { name:"Sugammadex (routine)",dose:4,  max:null, suffix:"mg/kg IV", note:"Routine NMB reversal at end of procedure" },
      { name:"Sugammadex (immediate CICO)",dose:16, max:null, suffix:"mg/kg IV", note:"Immediate reversal in 3 min — CICO rescue" },
    ]},
  ];

  const calcDose = (dosePerKg, max) => {
    if (!valid) return "—";
    const d = Math.round(wKg * dosePerKg * 10) / 10;
    return max ? `${Math.min(d, max)} mg` : `${d} mg`;
  };

  return (
    <div style={{background:"rgba(245,200,66,0.05)",border:"1px solid rgba(245,200,66,0.25)",borderRadius:12,padding:"14px 16px",marginBottom:12}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
        <span>💉</span>
        <span style={{fontSize:12,fontWeight:700,color:T.txt}}>RSI Weight-Based Drug Calculator</span>
        <span style={{fontSize:9,color:T.txt4,marginLeft:"auto",fontFamily:"monospace"}}>All doses are IV push</span>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        <input type="number" placeholder="Patient weight…" value={wt} onChange={e=>setWt(e.target.value)}
          style={{flex:1,background:"rgba(14,37,68,0.7)",border:"1px solid rgba(245,200,66,0.3)",borderRadius:8,padding:"8px 12px",color:T.txt,fontFamily:"monospace",fontSize:13,outline:"none"}} />
        <div style={{display:"flex",borderRadius:8,overflow:"hidden",border:`1px solid ${T.b}`,flexShrink:0}}>
          {["kg","lb"].map(u=>(
            <button key={u} onClick={()=>setUnit(u)} style={{padding:"8px 14px",cursor:"pointer",border:"none",background:unit===u?"rgba(245,200,66,0.2)":"rgba(14,37,68,0.5)",color:unit===u?T.gold:T.txt3,fontSize:11,fontWeight:700,fontFamily:"sans-serif",transition:"all .2s"}}>{u}</button>
          ))}
        </div>
      </div>
      {!valid && <div style={{fontSize:11,color:T.txt4,textAlign:"center",padding:"8px 0",marginBottom:8}}>Enter patient weight to calculate doses</div>}
      {valid && <div style={{fontSize:10,color:T.txt3,marginBottom:10,fontFamily:"monospace"}}>
        Patient weight: {unit==="lb"?`${parseFloat(wt)} lb = ${wKg.toFixed(1)} kg`:wKg+" kg"}
      </div>}
      {drugs.map((grp,gi)=>(
        <div key={gi} style={{marginBottom:12}}>
          <div style={{fontSize:9,fontWeight:700,color:grp.color,textTransform:"uppercase",letterSpacing:".08em",marginBottom:6}}>{grp.group}</div>
          {grp.items.map((d,di)=>(
            <div key={di} style={{display:"flex",alignItems:"center",gap:10,background:"rgba(14,37,68,0.5)",border:`1px solid ${T.b}`,borderRadius:8,padding:"8px 12px",marginBottom:5}}>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:600,color:T.txt}}>{d.name}</div>
                <div style={{fontSize:10,color:T.txt3}}>{d.dose} {d.suffix}{d.max?` (max ${d.max}mg)`:""} · {d.note}</div>
              </div>
              <div style={{fontSize:16,fontWeight:700,color:grp.color,fontFamily:"monospace",textAlign:"right",minWidth:70,flexShrink:0}}>
                {calcDose(d.dose, d.max)}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ═══ ARDSNet CALCULATOR ════════════════════════════════════════════ */
function ARDSCalc() {
  const [ht, setHt] = useState("");
  const [sex, setSex] = useState("male");
  const [unit, setUnit] = useState("cm");
  const htInch = unit==="cm" ? parseFloat(ht)/2.54 : parseFloat(ht);
  const ibw = !isNaN(htInch) && htInch > 0
    ? (sex==="male" ? 50 + 2.3*(htInch-60) : 45.5 + 2.3*(htInch-60))
    : null;
  const tv6 = ibw ? Math.round(ibw*6) : null;
  const tv4 = ibw ? Math.round(ibw*4) : null;
  const tv8 = ibw ? Math.round(ibw*8) : null;

  const peepFio2 = [
    [0.3,5],[0.4,"5–8"],[0.5,"8–10"],[0.6,10],[0.7,"10–14"],[0.8,14],[0.9,"14–18"],[1.0,"18–24"]
  ];
  const hiPeepFio2 = [
    [0.3,12],[0.4,"14–16"],[0.5,"16–18"],[0.6,20],[0.7,20],[0.8,"20–22"],[0.9,22],[1.0,"22–24"]
  ];

  return (
    <div style={{background:"rgba(255,107,107,0.05)",border:"1px solid rgba(255,107,107,0.22)",borderRadius:12,padding:"14px 16px",marginBottom:12}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
        <span>📉</span>
        <span style={{fontSize:12,fontWeight:700,color:T.txt}}>ARDSNet — IBW & Tidal Volume Calculator</span>
        <span style={{fontSize:9,fontFamily:"monospace",color:T.coral,marginLeft:"auto"}}>6 mL/kg PBW</span>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:10}}>
        <input type="number" placeholder="Height…" value={ht} onChange={e=>setHt(e.target.value)}
          style={{flex:1,background:"rgba(14,37,68,0.7)",border:"1px solid rgba(255,107,107,0.3)",borderRadius:8,padding:"8px 12px",color:T.txt,fontFamily:"monospace",fontSize:13,outline:"none"}} />
        <div style={{display:"flex",borderRadius:8,overflow:"hidden",border:`1px solid ${T.b}`,flexShrink:0}}>
          {["cm","in"].map(u=>(
            <button key={u} onClick={()=>setUnit(u)} style={{padding:"8px 14px",cursor:"pointer",border:"none",background:unit===u?"rgba(255,107,107,0.2)":"rgba(14,37,68,0.5)",color:unit===u?T.coral:T.txt3,fontSize:11,fontWeight:700,fontFamily:"sans-serif",transition:"all .2s"}}>{u}</button>
          ))}
        </div>
        <div style={{display:"flex",borderRadius:8,overflow:"hidden",border:`1px solid ${T.b}`,flexShrink:0}}>
          {[["male","♂"],["female","♀"]].map(([s,lbl])=>(
            <button key={s} onClick={()=>setSex(s)} style={{padding:"8px 12px",cursor:"pointer",border:"none",background:sex===s?"rgba(255,107,107,0.2)":"rgba(14,37,68,0.5)",color:sex===s?T.coral:T.txt3,fontSize:13,fontFamily:"sans-serif",transition:"all .2s"}}>{lbl}</button>
          ))}
        </div>
      </div>
      {ibw && ibw>0 && (
        <div style={{background:"rgba(255,107,107,0.1)",border:"1px solid rgba(255,107,107,0.3)",borderRadius:10,padding:"12px 14px",marginBottom:12}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:8}}>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:".06em",marginBottom:3}}>PBW / IBW</div>
              <div style={{fontSize:22,fontWeight:700,color:T.coral,fontFamily:"monospace",lineHeight:1}}>{ibw.toFixed(1)}<span style={{fontSize:11}}> kg</span></div>
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:".06em",marginBottom:3}}>Target TV (6 mL/kg)</div>
              <div style={{fontSize:22,fontWeight:700,color:T.gold,fontFamily:"monospace",lineHeight:1}}>{tv6}<span style={{fontSize:11}}> mL</span></div>
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:".06em",marginBottom:3}}>Range (4–8 mL/kg)</div>
              <div style={{fontSize:14,fontWeight:700,color:T.teal,fontFamily:"monospace",lineHeight:1.4}}>{tv4}–{tv8}<span style={{fontSize:11}}> mL</span></div>
            </div>
          </div>
          <div style={{fontSize:10,color:T.txt3,borderTop:`1px solid rgba(255,107,107,0.2)`,paddingTop:8}}>
            Formula: {sex==="male"?"50 + 2.3 × (height_in − 60)":"45.5 + 2.3 × (height_in − 60)"} · Height: {unit==="cm"?`${ht}cm = ${htInch.toFixed(1)} in`:ht+" in"}
          </div>
        </div>
      )}
      {/* PEEP/FiO2 Tables */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <div>
          <div style={{fontSize:9,fontWeight:700,color:T.txt3,textTransform:"uppercase",letterSpacing:".07em",marginBottom:6}}>Low PEEP Table</div>
          {peepFio2.map(([fio2,peep],i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"3px 8px",background:i%2===0?"rgba(14,37,68,0.5)":"rgba(8,22,40,0.4)",borderRadius:4,marginBottom:2,fontSize:10}}>
              <span style={{color:T.txt3,fontFamily:"monospace"}}>FiO₂ {fio2}</span>
              <span style={{color:T.blue,fontWeight:600,fontFamily:"monospace"}}>PEEP {peep}</span>
            </div>
          ))}
        </div>
        <div>
          <div style={{fontSize:9,fontWeight:700,color:T.coral,textTransform:"uppercase",letterSpacing:".07em",marginBottom:6}}>High PEEP Table (P/F &lt;100)</div>
          {hiPeepFio2.map(([fio2,peep],i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"3px 8px",background:i%2===0?"rgba(255,107,107,0.07)":"rgba(8,22,40,0.4)",borderRadius:4,marginBottom:2,fontSize:10}}>
              <span style={{color:T.txt3,fontFamily:"monospace"}}>FiO₂ {fio2}</span>
              <span style={{color:T.coral,fontWeight:600,fontFamily:"monospace"}}>PEEP {peep}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══ ROX INDEX CALCULATOR ══════════════════════════════════════════ */
function ROXCalc() {
  const [spo2, setSpo2] = useState("");
  const [fio2, setFio2] = useState("");
  const [rr, setRr] = useState("");
  const rox = (parseFloat(spo2) && parseFloat(fio2) && parseFloat(rr))
    ? ((parseFloat(spo2)/(parseFloat(fio2)/100))/parseFloat(rr)).toFixed(2)
    : null;
  const risk = rox !== null
    ? parseFloat(rox) < 2.85 ? {label:"HIGH FAILURE RISK", color:T.coral}
    : parseFloat(rox) < 4.88 ? {label:"INTERMEDIATE", color:T.gold}
    : {label:"LOW FAILURE RISK", color:T.teal}
    : null;

  return (
    <div style={{background:"rgba(0,212,255,0.05)",border:"1px solid rgba(0,212,255,0.22)",borderRadius:12,padding:"14px 16px",marginBottom:12}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
        <span>🌬️</span>
        <span style={{fontSize:12,fontWeight:700,color:T.txt}}>ROX Index — HFNC Failure Predictor</span>
        <span style={{fontSize:9,color:T.txt4,marginLeft:"auto",fontFamily:"monospace"}}>ROX = (SpO₂/FiO₂) ÷ RR</span>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}>
        {[["SpO₂ (%)", spo2, setSpo2, "e.g. 94"],["FiO₂ (%)", fio2, setFio2, "e.g. 60"],["RR (/min)", rr, setRr, "e.g. 28"]].map(([lbl, val, setter, ph],i)=>(
          <div key={i}>
            <div style={{fontSize:9,color:T.txt3,textTransform:"uppercase",letterSpacing:".06em",marginBottom:4}}>{lbl}</div>
            <input type="number" placeholder={ph} value={val} onChange={e=>setter(e.target.value)}
              style={{width:"100%",background:"rgba(14,37,68,0.7)",border:"1px solid rgba(0,212,255,0.3)",borderRadius:8,padding:"8px 10px",color:T.txt,fontFamily:"monospace",fontSize:13,outline:"none"}} />
          </div>
        ))}
      </div>
      {rox && risk && (
        <div style={{background:`${risk.color}12`,border:`1px solid ${risk.color}35`,borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:".07em",marginBottom:3}}>ROX Index</div>
            <div style={{fontSize:26,fontWeight:700,color:risk.color,fontFamily:"monospace",lineHeight:1}}>{rox}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:11,fontWeight:700,color:risk.color,background:`${risk.color}18`,border:`1px solid ${risk.color}40`,borderRadius:6,padding:"4px 10px",marginBottom:4}}>{risk.label}</div>
            <div style={{fontSize:10,color:T.txt3}}>
              {parseFloat(rox) < 2.85 ? "Escalate to BiPAP or intubation" : parseFloat(rox) < 4.88 ? "Close monitoring — serial ROX" : "Continue HFNC — low failure risk"}
            </div>
          </div>
        </div>
      )}
      {!rox && <div style={{fontSize:11,color:T.txt4,textAlign:"center",padding:"8px 0"}}>Enter SpO₂, FiO₂, and RR to calculate</div>}
      <div style={{fontSize:9,color:T.txt4,marginTop:8,fontFamily:"monospace",lineHeight:1.6}}>ROX &lt;2.85 at 2h = high failure risk · ROX ≥4.88 at 12h = low failure risk · Validated in Roca et al. AJRCCM 2019</div>
    </div>
  );
}

/* ═══ RSBI CALCULATOR ═══════════════════════════════════════════════ */
function RSBICalc() {
  const [tv, setTv] = useState("");
  const [rrV, setRrV] = useState("");
  const rsbi = parseFloat(tv) && parseFloat(rrV) ? (parseFloat(rrV)/(parseFloat(tv)/1000)).toFixed(0) : null;
  const result = rsbi !== null
    ? parseFloat(rsbi) < 80 ? {label:"STRONG PASS", color:T.teal}
    : parseFloat(rsbi) <= 105 ? {label:"LIKELY PASS", color:T.gold}
    : {label:"LIKELY FAIL", color:T.coral}
    : null;

  return (
    <div style={{background:"rgba(61,255,160,0.05)",border:"1px solid rgba(61,255,160,0.22)",borderRadius:12,padding:"14px 16px",marginBottom:12}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
        <span>📈</span>
        <span style={{fontSize:12,fontWeight:700,color:T.txt}}>RSBI Calculator</span>
        <span style={{fontSize:9,color:T.txt4,marginLeft:"auto",fontFamily:"monospace"}}>RSBI = RR ÷ (TV in L)</span>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
        {[["Tidal Volume (mL)", tv, setTv, "e.g. 350"],["Respiratory Rate (/min)", rrV, setRrV, "e.g. 22"]].map(([lbl, val, setter, ph],i)=>(
          <div key={i}>
            <div style={{fontSize:9,color:T.txt3,textTransform:"uppercase",letterSpacing:".06em",marginBottom:4}}>{lbl}</div>
            <input type="number" placeholder={ph} value={val} onChange={e=>setter(e.target.value)}
              style={{width:"100%",background:"rgba(14,37,68,0.7)",border:"1px solid rgba(61,255,160,0.25)",borderRadius:8,padding:"8px 10px",color:T.txt,fontFamily:"monospace",fontSize:13,outline:"none"}} />
          </div>
        ))}
      </div>
      {rsbi && result && (
        <div style={{background:`${result.color}12`,border:`1px solid ${result.color}35`,borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:".07em",marginBottom:3}}>RSBI</div>
            <div style={{fontSize:26,fontWeight:700,color:result.color,fontFamily:"monospace",lineHeight:1}}>{rsbi}<span style={{fontSize:13}}> /min/L</span></div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:11,fontWeight:700,color:result.color,background:`${result.color}18`,border:`1px solid ${result.color}40`,borderRadius:6,padding:"4px 10px",marginBottom:4}}>{result.label}</div>
            <div style={{fontSize:10,color:T.txt3}}>
              {parseFloat(rsbi) < 80 ? "High confidence extubation success" : parseFloat(rsbi) <= 105 ? "Moderate confidence — integrate with clinical" : "High probability of SBT failure"}
            </div>
          </div>
        </div>
      )}
      {!rsbi && <div style={{fontSize:11,color:T.txt4,textAlign:"center",padding:"8px 0"}}>Enter TV and RR to calculate</div>}
      <div style={{fontSize:9,color:T.txt4,marginTop:8,fontFamily:"monospace",lineHeight:1.6}}>Yang &amp; Tobin NEJM 1991 · Threshold &lt;105 · Sensitivity 97%, Specificity 64% · Use as screening tool — not standalone criterion</div>
    </div>
  );
}

/* ═══ DRUG ROW ══════════════════════════════════════════════════════ */
function DrugRow({ rx }) {
  const [open, setOpen] = useState(null);
  const panels = [
    {k:"renal", icon:"📋", label:"Details / Dosing", color:T.blue},
    {k:"ivpo",  icon:"🔧", label:"Alternative / Setup", color:T.teal},
    {k:"deesc", icon:"📉", label:"Monitoring / Step-Down", color:T.green},
  ];
  const refColor = ref => {
    if (!ref) return {bg:"rgba(155,109,255,0.1)",border:"1px solid rgba(155,109,255,0.3)",color:T.purple};
    if (ref.includes("NEJM")||ref.includes("Level A")) return {bg:"rgba(0,229,192,0.1)",border:"1px solid rgba(0,229,192,0.4)",color:T.teal};
    if (ref.includes("Level B")) return {bg:"rgba(59,158,255,0.1)",border:"1px solid rgba(59,158,255,0.4)",color:T.blue};
    return {bg:"rgba(155,109,255,0.1)",border:"1px solid rgba(155,109,255,0.3)",color:T.purple};
  };
  const rs = refColor(rx.ref);
  return (
    <div style={{background:"rgba(14,37,68,0.45)",border:`1px solid ${T.b}`,borderRadius:10,marginBottom:8,overflow:"hidden"}}>
      <div style={{padding:"11px 14px"}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8,marginBottom:4}}>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:T.txt}}>{rx.drug}</div>
            {rx.cat && <div style={{fontSize:10,color:T.txt3,marginTop:1}}>{rx.cat}</div>}
          </div>
          {rx.ref && <span style={{fontSize:9,fontFamily:"monospace",fontWeight:700,padding:"2px 7px",borderRadius:20,flexShrink:0,background:rs.bg,border:rs.border,color:rs.color}}>{rx.ref}</span>}
        </div>
        <div style={{fontSize:12,color:T.txt2,fontFamily:"monospace",lineHeight:1.6,whiteSpace:"pre-wrap"}}>{rx.dose}</div>
        {rx.note && <div style={{fontSize:10,color:T.txt3,marginTop:4,lineHeight:1.45}}>{rx.note}</div>}
      </div>
      <div style={{display:"flex",borderTop:`1px solid ${T.b}`,background:"rgba(5,15,30,0.4)"}}>
        {panels.filter(p=>rx[p.k]).map((p,i,arr)=>(
          <button key={p.k} onClick={()=>setOpen(open===p.k?null:p.k)} style={{flex:1,padding:"6px 4px",border:"none",borderRight:i<arr.length-1?`1px solid ${T.b}`:`none`,background:open===p.k?`${p.color}12`:"transparent",color:open===p.k?p.color:T.txt4,fontSize:10,fontWeight:open===p.k?700:500,cursor:"pointer",transition:"all .18s",fontFamily:"sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
            <span>{p.icon}</span>{p.label}
          </button>
        ))}
      </div>
      {open && rx[open] && (
        <div style={{padding:"10px 14px",background:`${panels.find(p=>p.k===open)?.color}08`,borderTop:`1px solid ${panels.find(p=>p.k===open)?.color}25`,fontSize:11,color:T.txt2,lineHeight:1.65,whiteSpace:"pre-wrap"}}>
          <span style={{color:panels.find(p=>p.k===open)?.color,fontWeight:700,marginRight:6}}>{panels.find(p=>p.k===open)?.icon}</span>{rx[open]}
        </div>
      )}
    </div>
  );
}

/* ═══ CONDITION PAGE ════════════════════════════════════════════════ */
function ConditionPage({ cond, onBack }) {
  const [tab, setTab] = useState("overview");
  const [checked, setChecked] = useState({});
  const ov = OVERVIEW[cond.id] || {};
  const rx = TREATMENT[cond.id] || [];
  const wu = WORKUP[cond.id] || [];
  const fu = FOLLOWUP[cond.id] || [];

  const tabs = [
    {id:"overview",  label:"Overview",  icon:"📋"},
    {id:"workup",    label:"Workup",    icon:"✅"},
    {id:"treatment", label:"Protocol",  icon:"⚙️"},
    {id:"followup",  label:"Follow-up", icon:"📅"},
  ];

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <div style={{padding:"14px 20px 0",flexShrink:0}}>
        <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:6,background:"rgba(14,37,68,0.5)",border:`1px solid ${T.b}`,borderRadius:7,padding:"5px 12px",color:T.txt3,fontSize:11,cursor:"pointer",fontFamily:"sans-serif",marginBottom:12}}>
          ← Back
        </button>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
          <div style={{width:44,height:44,borderRadius:12,background:cond.gl,border:`1px solid ${cond.br}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{cond.icon}</div>
          <div>
            <div style={{fontSize:16,fontWeight:700,color:T.txt,fontFamily:"'Playfair Display',serif"}}>{cond.title}</div>
            <div style={{fontSize:11,color:T.txt3}}>{cond.sub}</div>
          </div>
          <span style={{marginLeft:"auto",fontSize:9,fontFamily:"monospace",padding:"2px 8px",borderRadius:20,background:cond.gl,border:`1px solid ${cond.br}`,color:cond.color,fontWeight:700}}>{cond.cat.toUpperCase()}</span>
        </div>
        <div style={{display:"flex",gap:4,borderBottom:`1px solid ${T.b}`}}>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"6px 14px",border:"none",borderBottom:tab===t.id?`2px solid ${cond.color}`:"2px solid transparent",background:"transparent",color:tab===t.id?T.txt:T.txt3,fontSize:11,fontWeight:tab===t.id?700:400,cursor:"pointer",fontFamily:"sans-serif",display:"flex",alignItems:"center",gap:5,transition:"all .18s",marginBottom:-1}}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"16px 20px 24px"}}>

        {tab==="overview" && (
          <div>
            <div style={{background:"rgba(14,37,68,0.5)",border:`1px solid ${cond.br}`,borderLeft:`3px solid ${cond.color}`,borderRadius:8,padding:"12px 14px",marginBottom:14,fontSize:12,color:T.txt2,lineHeight:1.7}}>{ov.def}</div>
            {ov.bullets?.map((b,i)=>(
              <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"7px 0",borderBottom:i<ov.bullets.length-1?`1px solid rgba(26,53,85,0.4)`:"none"}}>
                <div style={{width:16,height:16,borderRadius:4,background:cond.gl,border:`1px solid ${cond.br}`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:cond.color,marginTop:1}}>▪</div>
                <div style={{fontSize:12,color:T.txt2,lineHeight:1.55}}>{b}</div>
              </div>
            ))}
            {/* Inline calculators */}
            {cond.id==="rsi" && <div style={{marginTop:16}}><div style={{fontSize:11,fontWeight:700,color:T.txt3,textTransform:"uppercase",letterSpacing:".07em",marginBottom:10}}>RSI Drug Calculator</div><RSICalc /></div>}
            {cond.id==="ards" && <div style={{marginTop:16}}><div style={{fontSize:11,fontWeight:700,color:T.txt3,textTransform:"uppercase",letterSpacing:".07em",marginBottom:10}}>ARDSNet Calculator</div><ARDSCalc /></div>}
            {cond.id==="hfnc" && <div style={{marginTop:16}}><div style={{fontSize:11,fontWeight:700,color:T.txt3,textTransform:"uppercase",letterSpacing:".07em",marginBottom:10}}>ROX Index Calculator</div><ROXCalc /></div>}
            {cond.id==="wean" && <div style={{marginTop:16}}><div style={{fontSize:11,fontWeight:700,color:T.txt3,textTransform:"uppercase",letterSpacing:".07em",marginBottom:10}}>RSBI Calculator</div><RSBICalc /></div>}
          </div>
        )}

        {tab==="workup" && (
          <div>
            {wu.map((item,i)=>(
              <div key={i} onClick={()=>setChecked(p=>({...p,[i]:!p[i]}))} style={{display:"flex",gap:12,alignItems:"flex-start",background:checked[i]?"rgba(0,229,192,0.07)":"rgba(14,37,68,0.4)",border:`1px solid ${checked[i]?"rgba(0,229,192,0.3)":T.b}`,borderRadius:9,padding:"11px 14px",marginBottom:8,cursor:"pointer",transition:"all .18s"}}>
                <div style={{width:32,height:32,borderRadius:8,background:checked[i]?"rgba(0,229,192,0.15)":"rgba(14,37,68,0.6)",border:`1px solid ${checked[i]?"rgba(0,229,192,0.5)":T.b}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{checked[i]?"✓":item.icon}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:600,color:checked[i]?T.teal:T.txt,marginBottom:3}}>{item.label}</div>
                  <div style={{fontSize:11,color:T.txt3,lineHeight:1.55}}>{item.detail}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab==="treatment" && (
          <div>
            {rx.length > 0 ? (
              <>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
                  {["Details","Alternative / Setup","Monitoring / Step-Down"].map(l=>(
                    <span key={l} style={{fontSize:9,padding:"3px 9px",borderRadius:20,background:"rgba(14,37,68,0.6)",border:`1px solid ${T.b}`,color:T.txt3,fontFamily:"monospace"}}>
                      {l==="Details"?"📋":l==="Alternative / Setup"?"🔧":"📉"} Tap to expand: {l}
                    </span>
                  ))}
                </div>
                {rx.map((r,i)=><DrugRow key={i} rx={r} />)}
              </>
            ) : (
              <div style={{fontSize:12,color:T.txt3,textAlign:"center",padding:"32px 0"}}>Protocol data not available</div>
            )}
          </div>
        )}

        {tab==="followup" && (
          <div>
            {fu.map((item,i)=>(
              <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"9px 12px",background:"rgba(14,37,68,0.4)",border:`1px solid ${T.b}`,borderRadius:8,marginBottom:6}}>
                <div style={{width:22,height:22,borderRadius:6,background:"rgba(0,229,192,0.1)",border:"1px solid rgba(0,229,192,0.25)",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:T.teal,fontWeight:700,marginTop:1}}>{i+1}</div>
                <div style={{fontSize:12,color:T.txt2,lineHeight:1.6}}>{item}</div>
              </div>
            ))}
            {REFS[cond.id] && (
              <div style={{marginTop:14,padding:"10px 14px",background:"rgba(155,109,255,0.06)",border:"1px solid rgba(155,109,255,0.2)",borderRadius:8,fontSize:10,color:T.txt3,lineHeight:1.65}}>
                <span style={{color:T.purple,fontWeight:700,marginRight:6}}>📚</span>{REFS[cond.id]}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══ AIRWAY BANNER ═════════════════════════════════════════════════ */
function AirwayBanner() {
  const targets = [
    {icon:"⏱",label:"Pre-oxygenation",target:"≥3 minutes",color:T.gold},
    {icon:"🎯",label:"Intubation attempts",target:"≤3 total",color:T.coral},
    {icon:"📊",label:"ETCO₂ confirm",target:"Waveform only",color:T.teal},
    {icon:"💤",label:"Sedation RASS target",target:"-1 to 0",color:T.blue},
  ];
  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:16}}>
      {targets.map((t,i)=>(
        <div key={i} style={{background:"rgba(14,37,68,0.5)",border:`1px solid ${t.color}30`,borderRadius:10,padding:"10px 12px",textAlign:"center"}}>
          <div style={{fontSize:18,marginBottom:4}}>{t.icon}</div>
          <div style={{fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:".06em",marginBottom:2}}>{t.label}</div>
          <div style={{fontSize:12,fontWeight:700,color:t.color,fontFamily:"monospace"}}>{t.target}</div>
        </div>
      ))}
    </div>
  );
}

/* ═══ MAIN HUB ══════════════════════════════════════════════════════ */
export default function AirwayHub() {
  const navigate = useNavigate();
  const [activeCat, setActiveCat] = useState("All");
  const [selected, setSelected] = useState(null);

  const filtered = activeCat==="All" ? CONDITIONS : CONDITIONS.filter(c=>c.cat===activeCat);
  const catCounts = CATS.reduce((a,c)=>({...a,[c]:CONDITIONS.filter(x=>x.cat===c).length}),{});

  if (selected) {
    const cond = CONDITIONS.find(c=>c.id===selected);
    if (cond) return (
      <div style={{height:"100vh",background:T.bg,color:T.txt,fontFamily:"'DM Sans',sans-serif",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <ConditionPage cond={cond} onBack={()=>setSelected(null)} />
      </div>
    );
    // If somehow id is invalid, fall through to main view
    // (This also resets the selection implicitly on next render)
  }

  return (
    <div style={{height:"100vh",background:T.bg,color:T.txt,fontFamily:"'DM Sans',sans-serif",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(26,53,85,0.9);border-radius:2px}input,button{font-family:inherit}`}</style>

      <div style={{background:T.panel,borderBottom:`1px solid ${T.b}`,padding:"14px 20px",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
          <button onClick={()=>navigate("/hub")} style={{display:"flex",alignItems:"center",gap:6,background:"rgba(8,22,40,0.7)",border:"1px solid rgba(59,158,255,0.3)",borderRadius:8,padding:"5px 12px",color:T.blue,fontSize:11,fontWeight:700,cursor:"pointer",flexShrink:0}}>← Hub</button>
          <div style={{width:40,height:40,borderRadius:11,background:"rgba(59,158,255,0.12)",border:"1px solid rgba(59,158,255,0.35)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>🌬️</div>
          <div>
            <div style={{fontSize:18,fontWeight:700,color:T.txt,fontFamily:"'Playfair Display',serif",lineHeight:1.2}}>Airway Hub</div>
            <div style={{fontSize:10,color:T.txt3}}>RSI · Difficult Airway · HFNC · CPAP · BiPAP · ARDSNet · Vent Management · Weaning</div>
          </div>
          <div style={{marginLeft:"auto",display:"flex",gap:6,flexShrink:0}}>
            <span style={{fontSize:9,fontFamily:"monospace",fontWeight:700,padding:"3px 9px",borderRadius:20,background:"rgba(245,200,66,0.1)",border:"1px solid rgba(245,200,66,0.3)",color:T.gold}}>DAS 2022</span>
            <span style={{fontSize:9,fontFamily:"monospace",fontWeight:700,padding:"3px 9px",borderRadius:20,background:"rgba(255,107,107,0.1)",border:"1px solid rgba(255,107,107,0.3)",color:T.coral}}>ARDSNet 2000</span>
            <span style={{fontSize:9,fontFamily:"monospace",fontWeight:700,padding:"3px 9px",borderRadius:20,background:"rgba(0,212,255,0.1)",border:"1px solid rgba(0,212,255,0.3)",color:T.cyan}}>BTS 2017</span>
            <span style={{fontSize:9,fontFamily:"monospace",fontWeight:700,padding:"3px 9px",borderRadius:20,background:"rgba(61,255,160,0.1)",border:"1px solid rgba(61,255,160,0.3)",color:T.green}}>PADIS 2018</span>
          </div>
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {["All",...CATS].map(c=>(
            <button key={c} onClick={()=>setActiveCat(c)} style={{padding:"5px 13px",borderRadius:20,border:`1px solid ${activeCat===c?"rgba(59,158,255,0.45)":T.b}`,background:activeCat===c?"rgba(59,158,255,0.12)":"transparent",color:activeCat===c?T.blue:T.txt3,fontSize:11,fontWeight:activeCat===c?700:400,cursor:"pointer",transition:"all .18s",fontFamily:"sans-serif",display:"flex",alignItems:"center",gap:5}}>
              {c} {c!=="All" && <span style={{fontSize:9,fontFamily:"monospace",color:activeCat===c?T.blue:T.txt4}}>({catCounts[c]})</span>}
            </button>
          ))}
        </div>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"16px 20px 24px"}}>
        <AirwayBanner />
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
          {filtered.map(c=>(
            <div key={c.id} onClick={()=>setSelected(c.id)} style={{background:c.gl,border:`1px solid ${c.br}`,borderRadius:12,padding:"14px 16px",cursor:"pointer",transition:"all .2s",position:"relative",overflow:"hidden"}}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 8px 24px ${c.color}20`}}
              onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none"}}>
              <div style={{position:"absolute",top:-20,right:-20,width:80,height:80,borderRadius:"50%",background:c.gl,opacity:.5}} />
              <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:10}}>
                <div style={{width:40,height:40,borderRadius:10,background:c.gl,border:`1px solid ${c.br}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{c.icon}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:T.txt}}>{c.title}</div>
                  <div style={{fontSize:10,color:T.txt3,marginTop:1}}>{c.sub}</div>
                </div>
                <span style={{fontSize:9,fontFamily:"monospace",padding:"2px 7px",borderRadius:20,background:c.gl,border:`1px solid ${c.br}`,color:c.color,fontWeight:700,flexShrink:0}}>{c.cat}</span>
              </div>
              <div style={{display:"flex",gap:8,marginTop:10,fontSize:9,color:T.txt3,flexWrap:"wrap"}}>
                {TREATMENT[c.id]?.length>0 && <span style={{padding:"2px 7px",borderRadius:20,background:"rgba(0,229,192,0.08)",border:"1px solid rgba(0,229,192,0.2)",color:T.teal}}>⚙️ {TREATMENT[c.id].length} protocol steps</span>}
                {WORKUP[c.id]?.length>0 && <span style={{padding:"2px 7px",borderRadius:20,background:"rgba(59,158,255,0.08)",border:"1px solid rgba(59,158,255,0.2)",color:T.blue}}>✅ {WORKUP[c.id].length} workup items</span>}
                {["rsi","ards","hfnc","wean"].includes(c.id) && <span style={{padding:"2px 7px",borderRadius:20,background:"rgba(245,200,66,0.08)",border:"1px solid rgba(245,200,66,0.2)",color:T.gold}}>🧮 Interactive calc</span>}
              </div>
            </div>
          ))}
        </div>
        <div style={{marginTop:20,padding:"12px 16px",background:"rgba(14,37,68,0.4)",border:`1px solid ${T.b}`,borderRadius:10,display:"flex",gap:16,flexWrap:"wrap",alignItems:"center"}}>
          <span style={{fontSize:9,fontWeight:700,color:T.txt4,textTransform:"uppercase",letterSpacing:".07em",flexShrink:0}}>Evidence Base</span>
          {["DAS Airway Guidelines 2022","ARDSNet NEJM 2000","PROSEVA NEJM 2013","FLORALI NEJM 2015","BTS O₂ Guideline 2017","PADIS Guidelines 2018","ABC Trial NEJM 2008","Yang & Tobin RSBI NEJM 1991"].map(e=>(
            <span key={e} style={{fontSize:9,color:T.txt4,fontFamily:"monospace"}}>{e}</span>
          ))}
        </div>
      </div>
    </div>
  );
}