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
  { id:"o2",   icon:"🫁", title:"Supplemental O\u2082",       sub:"NC \xb7 NRB \xb7 Venturi \xb7 Apneic Oxygenation",           cat:"Supplemental O\u2082",     color:"#3b9eff", gl:"rgba(59,158,255,0.07)",  br:"rgba(59,158,255,0.28)"  },
  { id:"hfnc", icon:"\ud83c\udf2c\ufe0f", title:"High-Flow Nasal Cannula",sub:"Heated Humidified \xb7 ROX Index \xb7 Failure Criteria",   cat:"NIV",                 color:"#00d4ff", gl:"rgba(0,212,255,0.07)",   br:"rgba(0,212,255,0.28)"   },
  { id:"cpap", icon:"\ud83d\ude2e\u200d\ud83d\udca8",  title:"CPAP",                  sub:"OSA \xb7 CHF \xb7 Post-op \xb7 Continuous PEEP",             cat:"NIV",                 color:"#9b6dff", gl:"rgba(155,109,255,0.07)", br:"rgba(155,109,255,0.28)" },
  { id:"bipap",icon:"\ud83e\udd42", title:"BiPAP / NIV",            sub:"COPD \xb7 CHF \xb7 IPAP/EPAP \xb7 Failure Criteria",          cat:"NIV",                 color:"#ff9f43", gl:"rgba(255,159,67,0.07)",  br:"rgba(255,159,67,0.28)"  },
  { id:"rsi",  icon:"\ud83d\udc89", title:"RSI Protocol",           sub:"Pre-ox \xb7 Induction \xb7 Paralysis \xb7 Post-intubation",    cat:"Intubation",          color:"#f5c842", gl:"rgba(245,200,66,0.07)",  br:"rgba(245,200,66,0.28)"  },
  { id:"daw",  icon:"\ud83d\udea8", title:"Difficult Airway",       sub:"CICO \xb7 VL \xb7 LMA \xb7 Surgical Airway \xb7 LEMON",          cat:"Intubation",          color:"#ff6b6b", gl:"rgba(255,107,107,0.07)", br:"rgba(255,107,107,0.28)" },
  { id:"ards", icon:"\ud83d\udcc9", title:"ARDS / ARDSNet",         sub:"Berlin Definition \xb7 6 mL/kg IBW \xb7 PEEP Table \xb7 Prone",cat:"Invasive Ventilation",color:"#ff6b6b", gl:"rgba(255,107,107,0.07)", br:"rgba(255,107,107,0.28)" },
  { id:"vent", icon:"\u2699\ufe0f", title:"Ventilator Management",  sub:"Modes \xb7 Settings \xb7 ABCDEF Bundle \xb7 Alarms",          cat:"Invasive Ventilation",color:"#00e5c0", gl:"rgba(0,229,192,0.07)",   br:"rgba(0,229,192,0.28)"   },
  { id:"wean", icon:"\ud83d\udcc8", title:"Weaning & Liberation",   sub:"SAT \xb7 SBT \xb7 RSBI \xb7 Extubation Criteria",             cat:"Invasive Ventilation",color:"#3dffa0", gl:"rgba(61,255,160,0.07)",  br:"rgba(61,255,160,0.28)"  },
];
const CATS = ["Supplemental O\u2082","NIV","Intubation","Invasive Ventilation"];

/* ═══ OVERVIEW ══════════════════════════════════════════════════════ */
const OVERVIEW = {
  o2:{
    def:"Supplemental oxygen therapy corrects hypoxemia by increasing the fraction of inspired oxygen (FiO\u2082). Target SpO\u2082 92\u201396% for most adults (94\u201398% per BTS); 88\u201392% for chronic hypercapnic COPD patients to avoid hypercapnic drive suppression. Device choice depends on oxygen requirement, patient tolerance, and urgency.",
    bullets:["Nasal cannula (NC): 1\u20136 L/min \u2192 FiO\u2082 24\u201344%. 1L\u2248+4% FiO\u2082 above 21%. Variable delivery \u2014 depends on respiratory pattern.","Non-Rebreather Mask (NRB): 10\u201315 L/min \u2192 FiO\u2082 60\u201390%. Gold standard for emergency pre-oxygenation. Fill reservoir before applying.","Venturi Mask: Precise FiO\u2082 delivery (24\u201360%) \u2014 color-coded adaptors. Preferred for COPD where exact FiO\u2082 matters.","Apneic oxygenation: NC at 15 L/min kept in place during laryngoscopy. Delays desaturation by 2\u20133 min via mass flow. Does NOT prevent CO\u2082 rise.","Target SpO\u2082 \u226593% before intubation. If SpO\u2082 <88% despite pre-oxygenation \u2192 do NOT defer bag-mask ventilation."],
  },
  hfnc:{
    def:"Heated High-Flow Nasal Cannula (HFNC) delivers heated, humidified oxygen at flow rates up to 60 L/min via large-bore nasal prongs. Advantages: washes out nasopharyngeal dead space, generates 1\u20133 cmH\u2082O PEEP (flow-dependent), improves mucociliary clearance, well-tolerated. Indicated for hypoxic respiratory failure, post-extubation support, COVID-19 pneumonia, immunocompromised patients, and as a bridge to intubation or as a ceiling intervention.",
    bullets:["Start flow 40\u201360 L/min, FiO\u2082 1.0 \u2192 titrate to SpO\u2082 92\u201396%","ROX Index = (SpO\u2082/FiO\u2082) / RR \u2014 monitor at 2h, 6h, 12h. ROX <2.85 at 2h = HIGH failure risk","FLORALI trial: HFNC reduced intubation rate and 90-day mortality vs standard O\u2082 in hypoxic RF","Do NOT persist with HFNC if deteriorating \u2014 delayed intubation in HFNC failure worsens outcomes","Contraindications: apnea, inability to protect airway, severe hemodynamic instability, facial trauma/anatomy"],
  },
  cpap:{
    def:"Continuous Positive Airway Pressure (CPAP) delivers a single continuous pressure throughout inspiration and expiration, maintained by the patient's own respiratory effort. CPAP recruits alveoli, reduces work of breathing, and improves oxygenation without providing pressure support. Primary indications: obstructive sleep apnea (OSA), cardiogenic pulmonary edema (CPE), and post-operative hypoxemia.",
    bullets:["CPAP 5\u201315 cmH\u2082O improves FRC, recruits collapsed alveoli, reduces cardiac preload in CHF","3CPO trial: CPAP reduced intubation by ~50% in acute cardiogenic pulmonary edema (equivalent to BiPAP)","OSA: standard therapy for AHI >15; auto-CPAP for most new diagnoses. BiPAP for CPAP-intolerant or OHS.","Contraindications: inability to protect airway, active aspiration risk, hemodynamic instability, pneumothorax (untreated)","Titrate PEEP to minimum required for SpO\u2082 target \u2014 avoid excessive PEEP in non-cardiogenic hypoxemia"],
  },
  bipap:{
    def:"Bilevel Positive Airway Pressure (BiPAP) / Non-Invasive Ventilation (NIV) delivers inspiratory pressure (IPAP) and expiratory pressure (EPAP). Pressure Support = IPAP \u2212 EPAP. Augments tidal volume, unloads respiratory muscles, and improves alveolar ventilation. Primary indications: COPD exacerbation (pH 7.25\u20137.35), acute cardiogenic pulmonary edema, obesity hypoventilation syndrome (OHS), neuromuscular disease, and post-extubation hypercapnia.",
    bullets:["COPD exacerbation (Grade A): pH 7.25\u20137.35 \u2192 BiPAP reduces intubation by 50\u201365% and mortality by 48%","pH <7.25 = relative indicator for intubation; NIV may still be attempted with close monitoring","ABG at 1\u20132h is MANDATORY to assess response. No improvement \u2192 intubate promptly.","Interface: full face mask preferred for acute RF (better seal, less leak). Nasal mask only if claustrophobic.","Set clear failure criteria BEFORE initiating NIV. Communicate to team and patient."],
  },
  rsi:{
    def:"Rapid Sequence Intubation (RSI): Simultaneous administration of an induction agent and neuromuscular blocking agent (NMBA) to achieve rapid unconsciousness and paralysis for definitive airway management. Designed to minimize the time between loss of protective reflexes and endotracheal tube placement, reducing aspiration risk. Pre-oxygenation is the most critical step in RSI.",
    bullets:["Pre-oxygenation goal: SpO\u2082 >93\u201395% (ideally >96%) using NRB 15 L/min \xd7 3\u20135 min + NC 15 L/min for apneic oxygenation","LEMON assessment: Look (facies, beard, trauma), Evaluate 3-3-2 (mouth, thyroid-chin, hyoid-mouth), Mallampati, Obstruction, Neck mobility","Sequence: Pre-oxygenate \u2192 Position \u2192 Preoxygenate more \u2192 Induction \u2192 Paralytic \u2192 Wait 45\u201360s \u2192 Laryngoscope \u2192 Intubate \u2192 Confirm ETCO\u2082","ETCO\u2082 waveform capnography is the GOLD STANDARD for ETT confirmation. No waveform = assume esophageal placement.","Post-intubation: Start sedation/analgesia BEFORE paralytic wears off. Initial vent: TV 6\u20138 mL/kg IBW, RR 14, FiO\u2082 1.0, PEEP 5."],
  },
  daw:{
    def:"Difficult Airway: Any clinical situation in which a trained clinician experiences difficulty with bag-mask ventilation (BMV) and/or intubation. CICO (Cannot Intubate, Cannot Oxygenate) is a life-threatening emergency requiring immediate surgical airway. The DAS 2015 and 2022 guidelines define a structured 4-Plan algorithm: Plan A (primary), Plan B (SGA), Plan C (oxygenation/awakening), Plan D (surgical airway).",
    bullets:["LEMON predicts difficult laryngoscopy. HEAVEN (Hypoxemia, Extremes, Anatomy, Vomit, Exsanguination, No NMBA) predicts failed first-pass.","Maximum 3 attempts at laryngoscopy (Plan A) total \u2014 then declare failed airway and proceed to Plan B","Video laryngoscopy (VL) is first-line for anticipated or encountered difficult airway in most EDs/ICUs","CICO: Declare aloud, call for help, proceed IMMEDIATELY to scalpel cricothyrotomy (knife-finger-tube). Do NOT delay.","Sugammadex 16 mg/kg IV reverses rocuronium in ~3 min \u2014 have drawn up when using rocuronium for RSI."],
  },
  ards:{
    def:"ARDS (Berlin Definition 2012): Acute-onset bilateral opacities on imaging not fully explained by cardiac failure or fluid overload, with PaO\u2082/FiO\u2082 (P/F) ratio <300 on PEEP \u22655 cmH\u2082O. Severity: Mild P/F 200\u2013300 (mortality ~27%), Moderate P/F 100\u2013200 (mortality ~32%), Severe P/F <100 (mortality ~45%). ARDSNet lung-protective ventilation remains the cornerstone of treatment \u2014 tidal volume 6 mL/kg predicted body weight (PBW).",
    bullets:["Tidal volume 6 mL/kg PBW (NOT actual weight) \u2014 reduces mortality from 40% to 31% (ARDSNet NEJM 2000)","Plateau pressure \u226430 cmH\u2082O; Driving pressure (Pplat \u2212 PEEP) \u226415 cmH\u2082O","Prone positioning \u226516h/day for P/F <150 on FiO\u2082 \u22650.6 \u2014 PROSEVA: reduces mortality from 33% to 16%","Conservative fluid strategy once hemodynamically stable (FACTT trial: reduces vent days)","Neuromuscular blockade (cisatracurium) for severe ARDS in first 48h \u2014 reduces dyssynchrony; ventral drives pressure"],
  },
  vent:{
    def:"Mechanical ventilation provides respiratory support by delivering positive pressure breaths to augment or replace spontaneous breathing. Key modes: Volume Control A/C (AC-VC \u2014 most common ICU mode), Pressure Control (AC-PC), Pressure Support (PSV \u2014 weaning mode), and PRVC (volume-targeted pressure control). All patients require daily assessment using the ABCDEF bundle for ICU liberation.",
    bullets:["AC-VC: guaranteed minute ventilation, guaranteed tidal volume. Monitor plateau pressure (goal \u226430 cmH\u2082O).","Alarm management: high pressure alarm fires before delivering patient harm; identify cause (secretions, biting, pneumothorax, dyssynchrony)","ABCDEF bundle reduces delirium by 35%, ICU LOS, and ventilator days \u2014 implement from Day 1","Target RASS -1 to 0 for most patients; analgesia-first (opioid before sedative \u2014 analgosedation model)","Dynamic hyperinflation (auto-PEEP): risk in COPD/asthma \u2014 use low RR, long expiratory time (I:E 1:4), disconnect if critical"],
  },
  wean:{
    def:"Ventilator weaning (liberation) is the process of reducing mechanical ventilatory support to allow extubation. The ABC trial (2008) demonstrated that paired daily Spontaneous Awakening Trial (SAT) + Spontaneous Breathing Trial (SBT) reduces mechanical ventilation duration by 3 days and ICU mortality by 14%. The RSBI (Rapid Shallow Breathing Index) is the most validated predictor of SBT success.",
    bullets:["SAT safety screen FIRST \u2192 then SBT if SAT passed. Paired SAT+SBT is superior to either alone.","SBT: PS 5/PEEP 5 or T-piece for 30\u2013120 min. 30 min equivalent to 120 min in most patients.","RSBI = RR \xf7 (TV in L). RSBI <105 = likely success (Yang & Tobin NEJM 1991)","Extubation criteria: SBT pass + alert + follows commands + adequate cough + secretions manageable","Post-extubation HFNC for high-risk patients reduces 72h re-intubation rate (Hernandez et al. JAMA 2016)"],
  },
};

/* ═══ WORKUP ════════════════════════════════════════════════════════ */
const WORKUP = {
  o2:[
    {icon:"\ud83d\udcca",label:"Pulse Oximetry (SpO\u2082)",detail:"Continuous SpO\u2082 monitoring. Target 92\u201396% (most adults) or 88\u201392% (COPD). Titrate O\u2082 delivery to achieve target \u2014 not to maximum."},
    {icon:"\ud83e\fde1",label:"ABG (if hypercapnia concern)",detail:"pH, PaO\u2082, PaCO\u2082, HCO\u2083. SpO\u2082 does not detect hypercapnia. ABG essential in COPD exacerbation, hypoventilation, or concerning mental status change."},
    {icon:"\ud83d\udcf8",label:"CXR",detail:"Identify underlying cause of hypoxemia: pneumonia, pulmonary edema, pneumothorax, pleural effusion, ARDS."},
    {icon:"\ud83fafe0",label:"EKG + Troponin",detail:"Rule out ACS as cause of acute hypoxemia (type 1 MI, STEMI with acute pulmonary edema). PE workup (S1Q3T3, sinus tach) if indicated."},
    {icon:"\ud83d\udcc9",label:"ETCO\u2082 / Capnography",detail:"Non-invasive ventilation monitoring. Waveform capnography identifies hypoventilation, obstructive pattern, or esophageal misplacement."},
  ],
  hfnc:[
    {icon:"\ud83d\udcca",label:"ROX Index (q2h initially)",detail:"ROX = (SpO\u2082/FiO\u2082) / RR. Calculate at 2h, 6h, 12h after initiation. ROX <2.85 at 2h = high failure risk \u2192 escalate to BiPAP or intubation."},
    {icon:"\ud83e\fde1",label:"ABG (1\u20132h after initiation)",detail:"Confirm pCO\u2082 not rising. HFNC does not reliably correct hypercapnia. If pCO\u2082 rising or pH <7.30 \u2192 switch to BiPAP or intubate."},
    {icon:"\ud83d\udcf8",label:"CXR",detail:"Characterize extent of lung disease. Bilateral infiltrates \u2192 consider ARDS workup. Unilateral \u2192 may have different response to HFNC."},
    {icon:"\ud83d\udca7",label:"SpO\u2082 + RR Continuous Monitoring",detail:"Trending RR is a key indicator of HFNC tolerance. Falling RR = improving; rising RR = tiring. Both needed for ROX calculation."},
    {icon:"\ud83fafe0",label:"Bedside POCUS (if indicated)",detail:"IVC for volume status, LV function (cardiogenic vs non-cardiogenic), lung ultrasound (B-lines = cardiogenic; consolidation = pneumonia/ARDS)."},
  ],
  cpap:[
    {icon:"\ud83c\udf19",label:"Polysomnography / Home Sleep Study",detail:"Diagnosis of OSA: AHI \u22655/h (symptomatic) or \u226515/h (asymptomatic). AHI \u226530 = severe OSA. Required for insurance authorization in many US states."},
    {icon:"\ud83e\fde1",label:"Morning ABG (OHS workup)",detail:"Obesity Hypoventilation Syndrome: awake hypercapnia (pCO\u2082 >45 mmHg) + BMI >30 + no other cause. BiPAP preferred over CPAP in OHS."},
    {icon:"\ud83d\udcca",label:"SpO\u2082 Monitoring During CPAP Trial",detail:"Nocturnal oximetry to assess response to CPAP. SpO\u2082 <88% for >5 min cumulative = inadequate oxygenation despite CPAP."},
    {icon:"\ud83d\udcf8",label:"CXR (acute respiratory failure)",detail:"Cardiogenic pulmonary edema (bat-wing, cephalization, Kerley B lines, effusions). Guide CPAP/BiPAP decision."},
    {icon:"\ud83fafe0",label:"Echo / BNP (CHF Workup)",detail:"BNP >400 supports CHF diagnosis. Echo for EF, wall motion, diastolic dysfunction. CPAP or BiPAP equivalent for acute CPE."},
  ],
  bipap:[
    {icon:"\ud83e\fde1",label:"ABG \u2014 Baseline + 1-2h Post-NIV",detail:"MANDATORY. Baseline pH + pCO\u2082 establishes indication. Repeat 1\u20132h after NIV initiation \u2014 no improvement = likely NIV failure. Intubate promptly."},
    {icon:"\ud83d\udcca",label:"SpO\u2082 + RR + ETCO\u2082 (Continuous)",detail:"Continuous oximetry, trending RR, non-invasive ETCO\u2082 if available. Rising pCO\u2082 trend = NIV failing."},
    {icon:"\ud83d\udcf8",label:"CXR",detail:"Bilateral infiltrates (ARDS \u2014 NIV controversial), cardiogenic edema, COPD hyperinflation, pneumothorax (contraindication to NIV)."},
    {icon:"\ud83fafe0",label:"EKG + Troponin",detail:"Dysrhythmia contributing to acute decompensation? ACS precipitating acute CHF exacerbation?"},
    {icon:"\ud83d\udccb",label:"NIV Failure Risk Assessment",detail:"Assign failure criteria before starting: pH threshold, RR threshold, SpO\u2082 threshold, duration. Document and communicate to team."},
  ],
  rsi:[
    {icon:"\ud83d\udc41\ufe0f",label:"LEMON Airway Assessment",detail:"Look (unusual facies, trauma, beard, obesity), Evaluate 3-3-2 (mouth opening \u22653 fingers, thyroid-chin \u22653 fingers, hyoid-mouth \u22652 fingers), Mallampati (class III\u2013IV = difficult), Obstruction, Neck mobility."},
    {icon:"\ud83d\udea8",label:"Difficult Airway Equipment",detail:"Video laryngoscope + direct laryngoscopy blades + ETT sizes (6.0\u20138.5) + stylet + 10cc syringe + tape/holder + iGEL/LMA sizes + bougie + surgical airway kit."},
    {icon:"\ud83d\udcca",label:"Pre-oxygenation SpO\u2082",detail:"Confirm SpO\u2082 >93% before induction. If unable to pre-oxygenate to 88% \u2192 reconsider RSI approach. Consider awake intubation or NIV pre-oxygenation."},
    {icon:"\ud83c\udf2c\ufe0f",label:"ETCO\u2082 Detector Ready",detail:"Waveform capnography connected and ready BEFORE intubation. Colorimetric CO\u2082 detectors acceptable if waveform unavailable."},
    {icon:"\ud83d\udc89",label:"IV Access + Medications Drawn",detail:"Large-bore IV access \xd7 1 minimum. All medications drawn and labeled. Vasopressor (push-dose epinephrine 10\u201320 mcg) ready for post-intubation hypotension."},
    {icon:"\ud83e\ude7a",label:"Post-Intubation Labs + Imaging",detail:"CXR (ETT position: 2\u20133 cm above carina), ABG (confirm ventilation/oxygenation), consider point-of-care labs (BMP, CBC) for ongoing management."},
  ],
  daw:[
    {icon:"\ud83d\udc41\ufe0f",label:"LEMON Score",detail:"Look 2pts, Evaluate 3-3-2 (each criterion 1pt), Mallampati class (III=1pt, IV=2pts), Obstruction 2pts, Neck mobility 1pt. Score \u22653 \u2192 high probability of difficult intubation."},
    {icon:"\ud83d\udea8",label:"HEAVEN Factors (First-Pass Failure)",detail:"Hypoxemia, Extremes of size (morbid obesity or pediatric), Anatomy (abnormal), Vomit/blood, Exsanguination, No NMBA. HEAVEN \u22653 = high risk of first-pass failure."},
    {icon:"\ud83d\udd27",label:"Difficult Airway Cart Confirmed",detail:"Verify at bedside: VL (charged), all blade sizes, ETTs, iGEL/LMA sizes 3-5, bougie, 14g needle/scalpel + ETT 6.0 (surgical airway kit), Sugammadex 16 mg/kg drawn up."},
    {icon:"\ud83d\udc8a",label:"Sugammadex 16 mg/kg (drawn and labeled)",detail:"For immediate reversal of rocuronium (CICO rescue). Have drawn before RSI if using rocuronium. IV push undiluted. Reverses NMB in ~3 minutes."},
    {icon:"\ud83d\udccb",label:"Communicate Plan A, B, C, D to Team",detail:"Verbally declare plan before proceeding: 'Plan A = VL, Plan B = iGEL, Plan C = awake technique, Plan D = surgical airway.' Assign roles."},
  ],
  ards:[
    {icon:"\ud83e\fde1",label:"ABG (PaO\u2082/FiO\u2082 ratio)",detail:"Berlin criteria: ARDS if P/F <300 on PEEP \u22655 cmH\u2082O within 1 week of insult. Severe: P/F <100. Serial ABGs to guide ARDSNet adjustments."},
    {icon:"\ud83d\udcf8",label:"CXR / CT Chest",detail:"Bilateral opacities (not fully explained by effusions, collapse, or nodules). CT may reveal heterogeneity \u2014 guide prone positioning and PEEP titration."},
    {icon:"\ud83fafe0",label:"ECHO (Rule out cardiogenic)",detail:"Exclude cardiogenic pulmonary edema (high wedge pressure). ARDS requires absence of fully explained cardiac cause. LVEF, diastolic dysfunction, RV strain assessment."},
    {icon:"\ud83d\udcca",label:"Plateau Pressure (Inspiratory Pause)",detail:"Set inspiratory pause 0.5s \u2192 read Pplat. MUST be \u226430 cmH\u2082O. Driving pressure = Pplat \u2212 PEEP; target \u226415 cmH\u2082O. Check daily."},
    {icon:"\ud83e\uddeb",label:"Cultures + Causative Workup",detail:"ARDS is a syndrome \u2014 identify cause: pneumonia (BAL, sputum, blood cultures), aspiration, sepsis, pancreatitis, trauma. Treat underlying cause simultaneously."},
    {icon:"\ud83d\udcc9",label:"IBW Calculation (for TV)",detail:"Male: 50 + 2.3 \xd7 (height in inches \u2212 60). Female: 45.5 + 2.3 \xd7 (height in inches \u2212 60). TV = IBW \xd7 6 mL/kg. NEVER use actual body weight."},
  ],
  vent:[
    {icon:"\ud83d\udcca",label:"Plateau Pressure Check (q8h)",detail:"Inspiratory pause 0.5s \u2192 Pplat. Goal \u226430 cmH\u2082O for lung protection. High Pplat: reduce TV by 1 mL/kg (min 4 mL/kg) or suction/decompress."},
    {icon:"\ud83d\udca4",label:"RASS Score (q4h)",detail:"Richmond Agitation-Sedation Scale: target -1 to 0 (light sedation) for most patients. Deeper sedation only for specific indications (ARDS + NMB, severe ICP, refractory status epilepticus)."},
    {icon:"\ud83e\udde0",label:"CAM-ICU Delirium Screen (q12h)",detail:"Confusion Assessment Method for ICU. Four features: acute change in mental status, inattention, disorganized thinking, altered LOC. Positive CAM-ICU = delirium. Risk factors: benzodiazepines, sleep disruption, immobility."},
    {icon:"\ud83d\udd27",label:"Auto-PEEP Check",detail:"Expiratory pause 0.5s \u2192 read total PEEP. Auto-PEEP = Total PEEP \u2212 Set PEEP. High auto-PEEP in obstructive disease \u2192 increase expiratory time, reduce RR. Disconnect briefly if critical."},
    {icon:"\ud83d\udcc8",label:"Ventilator Dyssynchrony Assessment",detail:"Observe waveforms: flow-starvation (patient effort exceeds set flow), reverse triggering, ineffective efforts, double-triggering. Dyssynchrony worsens lung injury and patient discomfort."},
    {icon:"\ud83d\udcaa",label:"Daily Mobility Assessment",detail:"Physical therapy evaluation. Target progressive mobility: turn q2h \u2192 dangle \u2192 sit \u2192 stand \u2192 ambulate. Mobility contraindications: unstable hemodynamics, FiO\u2082 >0.6, agitation, unsafe lines."},
  ],
  wean:[
    {icon:"\u2705",label:"SAT Safety Screen (Daily, AM)",detail:"FiO\u2082 \u22640.7, PEEP \u226410; no active seizures; no alcohol/benzo withdrawal; no escalating vasopressors; no active NMBA; no agitation. All must be met."},
    {icon:"\ud83e\fde1",label:"SBT Safety Screen",detail:"SAT passed; P/F >150; PEEP \u22648; RR/TV ratio trending down; no increased WOB at rest; some inspiratory effort present; hemodynamically stable."},
    {icon:"\ud83d\udcca",label:"RSBI Measurement",detail:"During 1\u20132 min of spontaneous effort (T-piece or minimal PS). RSBI = RR \xf7 (TV in L). <105 = likely success. Measure immediately before SBT decision."},
    {icon:"\ud83d\udde3\ufe0f",label:"Cough Assessment",detail:"Ask patient to cough. Assess peak cough flow \u2014 vigorous cough = good secretion management. White card test: secretions on card during cough = high volume/thin secretions."},
    {icon:"\ud83d\udd14",label:"Cuff Leak Test",detail:"Deflate cuff \u2192 occlude ETT \u2192 listen for leak around tube with each breath. Absent leak = post-extubation stridor risk \u2192 dexamethasone 0.1 mg/kg q8h \xd7 3 doses before extubation."},
    {icon:"\ud83e\udde0",label:"Mental Status + Commands",detail:"Patient must follow \u22652 of 4 commands (open eyes, look at me, open mouth, stick out tongue). GCS motor score \u22654. Adequate delirium control (CAM-ICU negative preferred)."},
  ],
};

/* ═══ TREATMENT DATA ════════════════════════════════════════════════ */
const TREATMENT = {
  o2:[
    {cat:"Nasal Cannula (NC)",drug:"Low-Flow NC \u2014 1\u20136 L/min",dose:"1 L/min \u2192 FiO\u2082 \u224824%\n2 L/min \u2192 FiO\u2082 \u224828%\n3 L/min \u2192 FiO\u2082 \u224832%\n4 L/min \u2192 FiO\u2082 \u224836%\n5 L/min \u2192 FiO\u2082 \u224840%\n6 L/min \u2192 FiO\u2082 \u224844%",renal:"No dose adjustments. Humidify at >4 L/min to prevent mucosal drying. Heated humidification increases comfort.",ivpo:"High-flow NC (HFNC): start at 40 L/min for significantly hypoxic patients. Provides more consistent FiO\u2082 and PEEP effect.",deesc:"Wean by 1 L/min q30 min maintaining target SpO\u2082. Discontinue when SpO\u2082 \u226592% on room air.",note:"FiO\u2082 delivery varies with RR and tidal volume \u2014 open-system, variable delivery. Reservoir cannula extends range to 8 L/min.",ref:"BTS 2017"},
    {cat:"Non-Rebreather Mask",drug:"NRB \u2014 10\u201315 L/min",dose:"10 L/min \u2192 FiO\u2082 \u224860\u201370%\n12\u201315 L/min \u2192 FiO\u2082 \u224870\u201390%\nFill reservoir fully before applying to patient\nEnsure good face seal \u2014 check for air leak",renal:"No adjustments. Not appropriate for home therapy.",ivpo:"Escalate to HFNC if NRB insufficient (SpO\u2082 <92% on 15 L/min NRB). Keep NC in place during RSI for apneic oxygenation.",deesc:"Decrease flow rate once stabilized. Step down to simple mask or NC as FiO\u2082 requirement falls.",note:"For RSI pre-oxygenation: use at 15 L/min \xd7 3\u20135 min. Add NC 15 L/min SIMULTANEOUSLY for apneic oxygenation during laryngoscopy.",ref:"BTS 2017"},
    {cat:"Venturi Mask",drug:"Controlled FiO\u2082 Delivery",dose:"24% (2 L/min blue)\n28% (4 L/min white)\n31% (6 L/min orange)\n35% (8 L/min yellow)\n40% (10 L/min red)\n60% (15 L/min green)\n(Color coding varies by manufacturer \u2014 verify with package)",renal:"No adjustments. Refit mask if patient mouth-breathing excessively.",ivpo:"Less suited for high O\u2082 demand \u2014 NRB or HFNC if FiO\u2082 >0.6 required.",deesc:"Step down adaptor color to lower FiO\u2082 as SpO\u2082 allows. Target minimum FiO\u2082 for SpO\u2082 88\u201392% in COPD.",note:"Preferred for COPD to deliver precise FiO\u2082 and avoid over-oxygenation. Not appropriate for patients requiring FiO\u2082 >0.6.",ref:"BTS 2017"},
    {cat:"Apneic Oxygenation",drug:"NC 15 L/min during laryngoscopy",dose:"Place NC at 15 L/min under NRB BEFORE induction\nKeep in place throughout laryngoscopy attempt\nTHRIVE technique: HFNC at 70 L/min (extends apnea time >10 min)",renal:"N/A",ivpo:"HFNC 40\u201370 L/min (if available and time permits): provides superior apneic oxygenation via transnasal insufflation.",deesc:"Remove once ETT confirmed with ETCO\u2082 waveform.",note:"Does NOT prevent CO\u2082 rise during apnea \u2014 only delays desaturation. Safe apnea window with adequate pre-oxygenation: 3\u20138 min depending on patient factors.",ref:"THRIVE study / DAS 2015"},
  ],
  hfnc:[
    {cat:"Initial Setup",drug:"HFNC Initiation Protocol",dose:"Flow: 40\u201360 L/min (start 40, increase to 60 if poorly tolerated)\nFiO\u2082: 1.0 initially \u2192 titrate to SpO\u2082 92\u201396% (88\u201392% COPD)\nHumidifier: 37\xb0C (reduce to 31\xb0C if intolerance)\nInterface: large-bore nasal prongs (largest fitting without blanching)",renal:"No dose adjustments. Humidification is essential \u2014 discomfort/nosebleed at >4 L/min without heat+humidity.",ivpo:"If HFNC unavailable: NRB + NC is bridging option. NIV (BiPAP) as alternative for hypercapnic patients.",deesc:"Wean FiO\u2082 FIRST (to \u22640.4), THEN wean flow (5 L/min decrements q4\u20136h). Transition to NC at flow \u226420 L/min + FiO\u2082 \u22640.4.",note:"Flow generates 1\u20133 cmH\u2082O PEEP effect. Washes nasopharyngeal dead space (reduces anatomical dead space by ~150 mL). Improves mucociliary clearance.",ref:"FLORALI 2015"},
    {cat:"Monitoring \u2014 ROX Index",drug:"ROX = (SpO\u2082/FiO\u2082) \xf7 RR",dose:"Calculate at 2h, 6h, 12h\nROX \u22654.88 at 12h \u2192 low failure risk, continue HFNC\nROX 2.85\u20134.88 \u2192 intermediate, monitor closely\nROX <2.85 at 2h \u2192 HIGH failure risk \u2192 escalate\nTrend: falling ROX = alarming even if above threshold",renal:"N/A",ivpo:"If ROX declining \u2192 prepare for BiPAP or intubation. HFNC-to-intubation transition should be planned, not emergency.",deesc:"Continue HFNC 24\u201348h post-extubation in high-risk patients (OPERA trial). Wean as above.",note:"ROX validated in Roca et al. AJRCCM 2019. Original cutoff 3.85; updated 2.85 at 2h provides earlier decision support.",ref:"Roca et al. 2019"},
    {cat:"Failure Criteria",drug:"Escalation Triggers",dose:"ANY of the following:\n\u2022 SpO\u2082 <90% on FiO\u2082 1.0 at 60 L/min\n\u2022 RR >35/min despite HFNC\n\u2022 ROX <2.85 at 2h\n\u2022 Paradoxical / accessory muscle breathing\n\u2022 Altered mental status (GCS drop)\n\u2022 Hemodynamic instability\n\u2022 Patient fatigue or inability to tolerate",renal:"N/A",ivpo:"Next step: BiPAP trial (if hypercapnia concern or COPD) OR direct intubation (if severe hypoxemia, rapid deterioration, or airway protection concern).",deesc:"If 2+ criteria \u2192 do NOT persist. Escalate immediately.",note:"Delayed intubation in HFNC failure is associated with significantly worse outcomes. Set clear failure thresholds before initiating HFNC.",ref:"FLORALI 2015"},
  ],
  cpap:[
    {cat:"Acute CPE / CHF",drug:"CPAP 5\u201310 cmH\u2082O",dose:"Start: PEEP 5 cmH\u2082O\nTitrate: 2 cmH\u2082O increments\nMax: 10\u201312 cmH\u2082O (higher may impede cardiac output)\nFiO\u2082: 1.0 initially \u2192 titrate to SpO\u2082 target",renal:"No adjustments.",ivpo:"BiPAP is equally effective for acute CHF \u2014 use if CPAP not tolerated or if concurrent hypercapnia.",deesc:"Reduce PEEP 2 cmH\u2082O q30\u201360 min as clinical improvement occurs. Discontinue when SpO\u2082 \u226592% on FiO\u2082 \u22640.4 at PEEP 5.",note:"3CPO trial: CPAP and BiPAP both reduced intubation ~50% vs standard O\u2082 in acute CPE. No mortality difference between CPAP and BiPAP.",ref:"3CPO NEJM 2008"},
    {cat:"OSA \u2014 Titration Protocol",drug:"Auto-CPAP or Fixed CPAP",dose:"Auto-CPAP: Range 4\u201320 cmH\u2082O (starting point for new diagnosis)\nFixed CPAP: Titrated pressure from PSG (typically 5\u201315 cmH\u2082O)\nReview: Download compliance data at 1\u20134 weeks (target >4 h/night, \u226570% nights)",renal:"No adjustments. Humidification reduces nasal dryness.",ivpo:"BiPAP if CPAP pressure >15 cmH\u2082O for 90th percentile, CPAP-intolerant, OHS, central sleep apnea, or residual AHI >5 on optimal CPAP.",deesc:"No wean for OSA \u2014 lifelong therapy. Reassess if significant weight loss (>10% body weight) \u2014 may allow pressure reduction or discontinuation.",note:"Adherence >4h/night required for cardiovascular risk reduction. CPAP reduces hypertension, arrhythmia, and CVA risk in moderate-severe OSA.",ref:"AASM 2021"},
    {cat:"Post-operative Hypoxemia",drug:"CPAP 5\u20138 cmH\u2082O",dose:"Initiate CPAP 5\u20138 cmH\u2082O post-operatively if SpO\u2082 <92% on NC\nPreemptive CPAP in high-risk patients (OSA, BMI >40, abdominal surgery)\nFiO\u2082: Titrate to SpO\u2082 92\u201396%",renal:"No adjustments.",ivpo:"HFNC 40\u201360 L/min as alternative with better tolerance for some patients.",deesc:"Wean PEEP as SpO\u2082 improves. Resume home CPAP settings if known OSA.",note:"Atelectasis is the most common cause of post-op hypoxemia \u2014 CPAP recruits atelectatic lung more effectively than supplemental O\u2082 alone.",ref:""},
  ],
  bipap:[
    {cat:"COPD Exacerbation (Primary Indication)",drug:"BiPAP Settings \u2014 AECOPD",dose:"IPAP: Start 8\u201310 cmH\u2082O \u2192 titrate by 2 cmH\u2082O to max 20\u201322 cmH\u2082O\nEPAP: 4\u20135 cmH\u2082O (titrate to oxygenation)\nBackup Rate: 10\u201312/min\nFiO\u2082: Target SpO\u2082 88\u201392% (avoid over-oxygenation)\nPS = IPAP \u2212 EPAP: target 8\u201315 cmH\u2082O",renal:"No adjustments. Interface care: check every 2\u20134h for skin breakdown.",ivpo:"If IPAP requirement >22 cmH\u2082O and no improvement \u2192 intubation. If pH >7.35 and improving \u2192 wean IPAP by 2 cmH\u2082O/session.",deesc:"Wean IPAP first (by 2 cmH\u2082O q4\u20138h). Transition to CPAP when IPAP 8\u201310 and EPAP 4\u20135 tolerated. Then NC.",note:"Grade A evidence: BiPAP reduces intubation by 50\u201365% and mortality by 48% in AECOPD with pH 7.25\u20137.35 (3 Cochrane reviews). Start within 1h of diagnosis.",ref:"GOLD 2023 / BTS 2016"},
    {cat:"Acute Hypercapnic Failure",drug:"ABG-Guided BiPAP Titration",dose:"Base titration on ABG at 1\u20132h:\n\u2022 pH improving + pCO\u2082 falling \u2192 continue, wean support\n\u2022 pH unchanged \u2192 increase IPAP 2 cmH\u2082O\n\u2022 pH <7.25 with no response \u2192 intubate\n\u2022 pH >7.35 \u2192 begin wean",renal:"N/A",ivpo:"IV doxapram 1.5\u20134 mg/min can be used as adjunct to NIV in AECOPD if BiPAP tolerance poor (BTS guideline \u2014 limited evidence).",deesc:"Failure criteria: pH <7.25 after 1\u20132h trial, RR >30 despite NIV, worsening hypoxemia, AMS, hemodynamic instability, inability to tolerate interface.",note:"Define success/failure criteria BEFORE starting. Communicate to patient, family, and team. Document ceiling of care if applicable.",ref:"BTS 2016"},
    {cat:"OHS / Hypoventilation",drug:"BiPAP for Obesity Hypoventilation",dose:"Similar IPAP/EPAP settings as COPD\nEnsure adequate TV: target 5\u20137 mL/kg IBW\nHigher backup rate (14\u201316/min) may be needed\nLong-term: average volume-assured pressure support (AVAPS) for home therapy",renal:"No adjustments.",ivpo:"Auto-BiPAP / AVAPS (volume-assured mode) for home management \u2014 automatically adjusts IPAP to achieve target TV.",deesc:"Transition to home BiPAP before discharge. Sleep medicine referral for long-term management.",note:"OHS diagnosis: awake pCO\u2082 >45 + BMI >30 + exclusion of other causes. BiPAP preferred over CPAP alone in OHS.",ref:"ERS 2019"},
    {cat:"CHF / Cardiogenic Pulmonary Edema",drug:"BiPAP for Acute CPE",dose:"IPAP: 8\u201312 cmH\u2082O\nEPAP: 4\u20138 cmH\u2082O (higher PEEP beneficial in CHF)\nFiO\u2082: 1.0 initially\nSimultaneous treatment: diuretics, nitrates, morphine PRN",renal:"No adjustments.",ivpo:"CPAP equally effective in acute CPE (3CPO trial). Use BiPAP if concurrent hypercapnia (pCO\u2082 >45 mmHg).",deesc:"Reduce FiO\u2082 first, then reduce pressures as diuresis and clinical improvement occur. Transition to NC.",note:"Reduces preload (EPAP effect) and afterload. High EPAP may impede venous return \u2014 monitor BP after initiation.",ref:"3CPO NEJM 2008"},
  ],
  rsi:[
    {cat:"STEP 1 \u2014 Pre-Oxygenation",drug:"NRB 15 L/min + NC 15 L/min",dose:"NRB: 15 L/min \xd7 3\u20135 min \u2192 target SpO\u2082 >93\u201395%\nNC: 15 L/min simultaneously (leave in during laryngoscopy)\nHFNC alternative: 40\u201370 L/min (THRIVE) if time permits\nUpright 20\u201330\xb0: improves FRC, reduces aspiration risk",renal:"N/A",ivpo:"If SpO\u2082 cannot reach >88% despite pre-oxygenation \u2192 consider BMV pre-oxygenation. Do NOT withhold BMV for aspiration fear if patient hypoxic.",deesc:"Continue NC throughout laryngoscopy for apneic oxygenation. Safe apnea time 3\u20138 min in well pre-oxygenated patient.",note:"Pre-oxygenation is the MOST IMPORTANT step in RSI. Every minute of quality pre-oxygenation extends safe apnea time. Do NOT rush.",ref:"DAS 2015"},
    {cat:"STEP 2 \u2014 Induction (Hemodynamically Stable)",drug:"Etomidate",dose:"0.3 mg/kg IV (give over 30\u201360s)\nOnset: 30\u201360s \xb7 Duration: 3\u20138 min",renal:"Hepatic metabolism \u2014 no renal dose adjustment",ivpo:"Propofol 1.5\u20132 mg/kg IV (alternative; AVOID if hypotension \u2014 causes cardiovascular depression)",deesc:"Single dose adrenal suppression \u2014 avoid in known adrenal insufficiency. Acceptable in septic shock (single dose). No cardiovascular depression.",note:"MOST hemodynamically neutral induction agent. Preferred for most emergency intubations where ketamine not indicated.",ref:"UpToDate 2024"},
    {cat:"STEP 3 \u2014 Induction (Shock / Bronchospasm)",drug:"Ketamine",dose:"1.5\u20132.0 mg/kg IV\nOnset: 30\u201360s \xb7 Duration: 10\u201320 min\n(Can use 1\u20131.5 mg/kg if hemodynamically compromised)",renal:"Primarily hepatic metabolism. No significant renal adjustment.",ivpo:"Ketamine + midazolam 0.1 mg/kg: reduces emergence reactions (dysphoria) \u2014 use if time allows.",deesc:"Avoid in: hypertensive emergencies (BP >200/120), aortic dissection (relative CI). Causes catecholamine surge.",note:"FIRST-LINE for shock, hypotension, bronchospasm, asthma. Maintains hemodynamics via sympathomimetic effect. Preserves airway reflexes but NOT aspiration protection.",ref:"UpToDate 2024"},
    {cat:"STEP 4 \u2014 Induction (ICP / Neuro)",drug:"Propofol",dose:"1.5\u20132.0 mg/kg IV (reduce to 0.5\u20131.0 mg/kg if elderly, frail, or hemodynamically compromised)\nOnset: 30s \xb7 Duration: 3\u20138 min",renal:"No renal adjustment (hepatic). Propofol infusion syndrome with prolonged use.",ivpo:"Have vasopressor ready (push-dose epinephrine 10\u201320 mcg IV) \u2014 significant hypotension common.",deesc:"AVOID if MAP <65 mmHg. Preferred for neurological indications: reduces cerebral metabolic demand, ICP.",note:"Reduces ICP and cerebral oxygen demand. Associated with hypotension in 30\u201350% of patients. Have vasopressor immediately available.",ref:"UpToDate 2024"},
    {cat:"STEP 5a \u2014 Paralytic (First-Line)",drug:"Succinylcholine",dose:"1.5 mg/kg IV (max 200 mg)\nOnset: 45s \xb7 Duration: 10\u201315 min\nGive immediately after induction agent",renal:"Plasma cholinesterase degradation \u2014 no renal dose adjustment",ivpo:"No reversal agent exists. Duration determined by pseudocholinesterase activity (prolonged in atypical cholinesterase, liver failure, pregnancy).",deesc:"CONTRAINDICATED: K+ >5.5, burns >24\u201348h, crush injury, spinal cord injury >72h, NMD (Duchenne, myasthenia), MH history, immobilization >72h.",note:"Depolarizing NMBA \u2014 fasciculations cause transient K+ rise of 0.5\u20131.0 mEq/L. Short duration ideal if intubation uncertainty.",ref:"UpToDate 2024"},
    {cat:"STEP 5b \u2014 Paralytic (Alternative/CICO Reversal)",drug:"Rocuronium",dose:"RSI dose: 1.2\u20131.6 mg/kg IV\nOnset: 60\u201390s (at 1.2 mg/kg) \xb7 Duration: 45\u201370 min",renal:"Hepatic elimination \u2014 prolonged effect in hepatic failure. Use with caution.",ivpo:"REVERSAL: Sugammadex 16 mg/kg IV (undiluted, IV push) \u2192 reverses NMB within ~3 min (CICO/immediate rescue). Draw up BEFORE using rocuronium for RSI.",deesc:"Non-depolarizing NMBA. No contraindication in hyperkalemia states. Preferred if succinylcholine contraindicated.",note:"At 1.6 mg/kg: onset approaches succinylcholine. MUST have sugammadex 16 mg/kg drawn and available at bedside before RSI if using rocuronium.",ref:"UpToDate 2024"},
    {cat:"STEP 6 \u2014 Confirm + Post-Intubation",drug:"ETCO\u2082 + Initial Vent Settings",dose:"Confirm: Waveform ETCO\u2082 (sustained waveform \xd7 6 breaths) + bilateral BS + chest rise + CXR\nETT depth: 22\u201324 cm at lip (men); 20\u201322 cm at lip (women)\nInitial vent: TV 6\u20138 mL/kg IBW, RR 14, FiO\u2082 1.0, PEEP 5\nSedation: Propofol 5\u201350 mcg/kg/min OR midazolam 0.02\u20130.1 mg/kg/h\nAnalgesia: Fentanyl 25\u2013100 mcg/h (analgesia FIRST)",renal:"Fentanyl: no adjustment. Morphine: avoid in CKD (active metabolite accumulates). Cisatracurium: preferred NMB in renal failure.",ivpo:"Initiate sedation/analgesia BEFORE paralytic wears off. Delayed treatment = patient awake and paralyzed (conscious paralysis).",deesc:"Daily sedation vacation (SAT). RASS target -1 to 0. Begin weaning assessment once underlying cause improving.",note:"Start POST-INTUBATION sedation + analgesia IMMEDIATELY. Do not leave patient paralyzed without sedation. Order vent settings, monitoring, nursing orders simultaneously.",ref:"PADIS 2018"},
  ],
  daw:[
    {cat:"PLAN A \u2014 Video Laryngoscopy",drug:"Primary Laryngoscopy Attempt",dose:"VL preferred: C-MAC D-blade, GlideScope, McGrath (hyperangulated)\nDL alternative: Mac 3\u20134 or Miller 2\u20133\nExternal Laryngeal Manipulation (BURP): Backward-Upward-Rightward-Pressure\nBougie-assisted: place bougie blindly over epiglottis, railload ETT\nMaximum 3 attempts total by any operator",renal:"N/A",ivpo:"Optimize between attempts: suction, HELIOX if available, different blade, change operator, change position.",deesc:"After 3 failed Plan A attempts \u2192 DECLARE FAILED AIRWAY. Proceed to Plan B. Ensure oxygenation is maintained at all times.",note:"OXYGENATE between attempts. Accept Plan B sooner if SpO\u2082 <90% or declining \u2014 do NOT pursue repeated attempts at the cost of oxygenation.",ref:"DAS 2022"},
    {cat:"PLAN B \u2014 Supraglottic Airway (SGA)",drug:"iGEL or LMA (2nd generation preferred)",dose:"iGEL: size 3 (30\u201360kg), 4 (50\u201390kg), 5 (>90kg)\nLMA Supreme: size 3, 4, or 5 \u2014 inflate cuff\nInsert: midline, smooth insertion without rotation\nConfirm: seal pressure >25 cmH\u2082O, bilateral BS, ETCO\u2082",renal:"N/A",ivpo:"Nasal/oral airway + jaw thrust if SGA fails (basic maneuver to maintain oxygenation while escalating plan).",deesc:"SGA is bridge \u2014 facilitate intubation through SGA (Aintree catheter + FOB) or defer to awake technique. Plan definitive airway within 1h.",note:"2nd generation SGAs (iGEL, LMA Supreme, ProSeal) provide gastric access and better aspiration protection than 1st generation. Choose 2nd gen for emergency use.",ref:"DAS 2022"},
    {cat:"PLAN C \u2014 Awake Intubation",drug:"Awake Fiberoptic or VL with Topicalization",dose:"Topicalization: Lidocaine 4% spray/nebulization to oropharynx\nAirway block: Transtracheal injection 4% lidocaine 3 mL (advanced)\nSedation: Ketamine 0.3\u20130.5 mg/kg IV (dissociative) \xb1 Dexmedetomidine 0.5\u20131 mcg/kg over 10 min\nPatient AWAKE and spontaneously breathing throughout \u2014 never deeply sedated",renal:"Lidocaine: reduce dose in hepatic failure (max total dose 7 mg/kg with vasoconstrictor).",ivpo:"Awake nasal intubation (video or FOB): alternative in anticipated difficult anatomy, limited mouth opening.",deesc:"Awake intubation allows bail-out if fails \u2014 patient maintains airway. Convert to RSI only once tube confirmed in trachea.",note:"Awake intubation = gold standard for anticipated difficult airway. PREPARE topicalization \xd710 minutes before attempt. Patient cooperation critical.",ref:"DAS 2022"},
    {cat:"PLAN D \u2014 CICO (Surgical Airway)",drug:"Emergency Scalpel Cricothyrotomy",dose:"KNIFE-FINGER-TUBE technique:\n1. Laryngeal handshake \u2192 identify CTM\n2. Transverse or vertical stab incision through CTM\n3. Finger entry \u2192 dilate opening\n4. Bougie insertion \u2192 ETT 6.0 cuffed\n5. Inflate cuff \u2192 ventilate \u2192 ETCO\u2082 confirm\nCommercial kits (Melker wire-guided) slower \u2014 scalpel preferred in true CICO",renal:"N/A",ivpo:"Surgical reversal of rocuronium: Sugammadex 16 mg/kg IV \u2014 if oxygenation possible and NMBA reversal could allow awakening, consider before surgical airway.",deesc:"Surgical cricothyrotomy is definitive. Formal tracheostomy by ENT/surgery within 24\u201372h. Maintain tube position \u2014 cricothyrotomy tube displacement is high-risk.",note:"DECLARE CICO aloud. Stop all laryngoscopy. Call for help. Proceed IMMEDIATELY. Every second of delay worsens outcome. Cricothyrotomy within 2 min of CICO declaration.",ref:"DAS 2022 / eFONA"},
  ],
  ards:[
    {cat:"Lung-Protective Ventilation (ARDSNet)",drug:"Tidal Volume \u2014 6 mL/kg PBW",dose:"Male PBW (kg): 50 + 2.3 \xd7 (height inches \u2212 60)\nFemale PBW (kg): 45.5 + 2.3 \xd7 (height inches \u2212 60)\nStart at 6 mL/kg \u2192 range 4\u20138 mL/kg\nIf plateau >30 cmH\u2082O \u2192 reduce TV by 1 mL/kg (min 4 mL/kg)\nPermissive hypercapnia: pH \u22657.20 acceptable",renal:"N/A",ivpo:"N/A",deesc:"Wean support as lung compliance improves. Plateau <25 cmH\u2082O + improving P/F + reducing PEEP requirement = transition to PSV weaning.",note:"NEVER use actual body weight for ARDS vent calculations. Use PBW from height. ARDSNet NEJM 2000: mortality 40\u219231% with 6 vs 12 mL/kg PBW TV.",ref:"ARDSNet NEJM 2000"},
    {cat:"PEEP / FiO\u2082 \u2014 Low PEEP Table",drug:"Low PEEP ARDSNet Protocol",dose:"FiO\u2082 0.3 \u2192 PEEP 5\nFiO\u2082 0.4 \u2192 PEEP 5\u20138\nFiO\u2082 0.5 \u2192 PEEP 8\u201310\nFiO\u2082 0.6 \u2192 PEEP 10\nFiO\u2082 0.7 \u2192 PEEP 10\u201314\nFiO\u2082 0.8 \u2192 PEEP 14\nFiO\u2082 0.9 \u2192 PEEP 14\u201318\nFiO\u2082 1.0 \u2192 PEEP 18\u201324",renal:"N/A",ivpo:"High PEEP table (severe ARDS P/F <100):\nFiO\u2082 0.3\u2192PEEP 12; 0.4\u219214\u201316; 0.5\u219216\u201318; 0.6\u219220; 0.7\u219220; 0.8\u219220\u201322; 0.9\u219222; 1.0\u219222\u201324",deesc:"Wean FiO\u2082 to \u22640.5 first, then wean PEEP by 2 cmH\u2082O q4h, monitoring for desaturation. Target SpO\u2082 88\u201395% / PaO\u2082 55\u201380 mmHg.",note:"Driving pressure (Plateau \u2212 PEEP) \u226415 cmH\u2082O is the key target \u2014 strongest predictor of ARDS mortality (Amato et al. NEJM 2015).",ref:"ARDSNet 2000 / Amato NEJM 2015"},
    {cat:"Prone Positioning",drug:"\u226516 hours/day prone",dose:"Criteria: P/F <150 on FiO\u2082 \u22650.6 + PEEP \u22655 + 6 mL/kg TV\nInitiate within 36\u201348h of ARDS diagnosis\nProtocol: 16h prone \u2192 8h supine (PROSEVA: 28-day mortality 16% vs 33%)\nTeam: 5 people minimum for safe proning",renal:"N/A",ivpo:"Prone positioning can be combined with NMB (cisatracurium) for severe ARDS + dyssynchrony.",deesc:"Discontinue prone when: P/F >150 on PEEP \u226410 + FiO\u2082 \u22640.6 sustained \u22654h in SUPINE position for 2 consecutive sessions.",note:"PROSEVA is the landmark trial: prone 16h/day reduced 28-day mortality from 32.8% to 16% in moderate-severe ARDS (P/F <150). Early prone is critical.",ref:"PROSEVA NEJM 2013"},
    {cat:"Neuromuscular Blockade (First 48h)",drug:"Cisatracurium",dose:"Load: 0.2 mg/kg IV\nInfusion: 0.06\u20130.6 mg/kg/h\nDuration: 48h (reassess daily after 24h)\nMonitor: Train-of-four (TOF) \u2014 target 1\u20132 twitches (not 0)",renal:"Hofmann elimination \u2014 NO dose adjustment needed in renal or hepatic failure. Preferred NMBA in organ failure.",ivpo:"Vecuronium or pancuronium as alternatives if cisatracurium unavailable. Avoid in CKD (active metabolite accumulation).",deesc:"After 48h: reassess indication. Discontinue NMB if: dyssynchrony resolved, plateau \u226430, oxygenation improving. Re-trial light sedation.",note:"ROSE trial (2019) \u2014 NMB did not reduce mortality vs light sedation strategy. But 48h NMB still indicated for severe dyssynchrony, plateau >30, or P/F <100.",ref:"ACURASYS 2010 / ROSE 2019"},
    {cat:"Oxygenation Targets + Adjuncts",drug:"Targets + Rescue Therapies",dose:"SpO\u2082 88\u201395% (PaO\u2082 55\u201380 mmHg)\nPlateau: \u226430 cmH\u2082O\nDriving pressure: \u226415 cmH\u2082O\nRR: up to 35/min to correct pH \u22657.20\nFluid: conservative strategy once hemodynamically stable (FACTT trial)\nRescue: Inhaled NO (pulmonary vasodilator, 5\u201340 ppm), PEEP optimization, iNO, prone, ECMO consultation",renal:"N/A",ivpo:"ECMO (VV-ECMO): rescue for refractory ARDS P/F <80 or CO\u2082 failure. Refer to ECMO center early (<7 days ventilation preferred).",deesc:"Steroid controversy: dexamethasone 0.2 mg/kg \xd7 5 days then 0.1 mg/kg \xd7 5 days (DEXA-ARDS trial: 60-day mortality benefit in moderate-severe ARDS).",note:"Conservative fluid strategy reduces ventilator days by 2.5 days (FACTT trial) without increasing organ failure.",ref:"FACTT NEJM 2006 / DEXA-ARDS 2020"},
  ],
  vent:[
    {cat:"Mode: Volume Control A/C (AC-VC)",drug:"Standard ICU Ventilation Mode",dose:"TV: 6\u20138 mL/kg IBW (6 mL/kg for ARDS)\nRR: 12\u201316/min (up to 35 for ARDS pH correction)\nFiO\u2082: Start 1.0 \u2192 wean to SpO\u2082 92\u201396%\nPEEP: 5 cmH\u2082O (standard), adjust per ARDS protocol\nFlow: 60 L/min (square wave) / Inspiratory time: 1s / I:E 1:2\u20131:3\nInspiratory pause: 0.5s to measure plateau pressure",renal:"N/A",ivpo:"Transition to PSV when: underlying cause improving, FiO\u2082 \u22640.5, PEEP \u22648, some spontaneous effort.",deesc:"Wean: reduce RR first \u2192 reduce FiO\u2082 \u2192 reduce PEEP. When FiO\u2082 0.4 + PEEP 5 + RR 12 \u2192 trial PSV or SBT.",note:"Most common ICU mode. Guarantees minute ventilation. Monitor peak and plateau pressure \u2014 peak includes airway resistance; plateau reflects true alveolar pressure.",ref:""},
    {cat:"Mode: Pressure Control A/C (AC-PC)",drug:"Pressure-Controlled Ventilation",dose:"PC above PEEP: 10\u201320 cmH\u2082O (adjust to target TV 6\u20138 mL/kg IBW)\nRR, FiO\u2082, PEEP: as per AC-VC\nInspiratory time: 0.8\u20131.2s (adjust I:E ratio)\nMonitor TV closely \u2014 varies with patient compliance/effort",renal:"N/A",ivpo:"PRVC (Pressure-Regulated Volume Control): hybrid mode \u2014 sets target TV, auto-adjusts pressure. Preferred by many for lung protection.",deesc:"Wean PC level as lung compliance improves. Transition to PSV when TV targets met at lower PC levels.",note:"Decelerating flow improves gas distribution and comfort. TV not guaranteed \u2014 watch for over-distension if compliance improves suddenly.",ref:""},
    {cat:"Mode: Pressure Support (PSV) \u2014 Weaning",drug:"PSV \u2014 Patient-Triggered, Pressure-Supported",dose:"PS: 5\u201320 cmH\u2082O above PEEP\nTarget: TV 5\u20138 mL/kg IBW, RR <30\nFiO\u2082 and PEEP maintained as clinically needed\nReduce PS: by 2\u20134 cmH\u2082O q4\u20138h as tolerated\nPS \u22648 cmH\u2082O \u2248 minimal support (similar to T-piece)",renal:"N/A",ivpo:"SIMV adds mandatory backup breaths \u2014 use if respiratory drive uncertain. PSV alone preferred for most weaning.",deesc:"When PS \u22648 cmH\u2082O tolerated \xd7 30\u201360 min \u2192 perform formal SBT. If SBT passes \u2192 extubate.",note:"PSV requires intact respiratory drive \u2014 no backup rate guarantees. Reduces respiratory work proportional to PS level. Primary weaning mode in most ICUs.",ref:""},
    {cat:"ABCDEF Bundle \u2014 ICU Liberation",drug:"Daily Structured Protocol",dose:"A \u2014 Assess, prevent, manage Pain (analgesia first: fentanyl, avoid routine benzo)\nB \u2014 Breathing: daily SBT when screen passed\nC \u2014 Choice of analgesia/sedation: target RASS -1 to 0\nD \u2014 Delirium: CAM-ICU q12h; avoid anticholinergics, promote sleep\nE \u2014 Early mobility and Exercise: OT/PT within 48\u201372h\nF \u2014 Family engagement: daily family communication, include in rounds",renal:"RASS target -1 to 0. Deeper sedation only for: NMB, severe ICP, refractory status epilepticus, ARDS + severe dyssynchrony.",ivpo:"Delirium pharmacotherapy: quetiapine 25\u201350mg PO q12h preferred. Avoid haloperidol (not evidence-based for ICU delirium). Melatonin 3\u20135mg qHS for sleep.",deesc:"Implement from Day 1. Daily assessment. Every bundle element reduces ICU delirium prevalence and MV days.",note:"ABCDEF bundle reduces delirium by 35%, ICU-acquired weakness, and hospital mortality (Marra et al. CCM 2017).",ref:"SCCM PADIS 2018"},
    {cat:"Obstructive Disease (COPD/Asthma) Ventilation",drug:"Auto-PEEP Prevention Strategy",dose:"RR: 10\u201314/min (slow to allow expiration)\nTV: 6\u20138 mL/kg IBW (lower if auto-PEEP detected)\nI:E ratio: 1:4 or 1:5 (prolong expiration)\nFiO\u2082: titrate to SpO\u2082\nSet PEEP: 0\u20135 (keep low unless using for intrinsic PEEP compensation)\nMeasure auto-PEEP (expiratory pause) and total PEEP",renal:"N/A",ivpo:"Auto-PEEP crisis: Disconnect from ventilator briefly \u2192 allows passive exhalation. Reconnect when hemodynamics stabilize.",deesc:"Ketamine infusion 0.5\u20132 mg/kg/h: bronchodilator effect in refractory bronchospasm. Heliox (80:20) reduces airway resistance.",note:"Dynamic hyperinflation (auto-PEEP) in obstructive disease \u2192 decreased venous return, hypotension, pneumothorax. Prevention: slow rate + long expiratory time.",ref:""},
  ],
  wean:[
    {cat:"STEP 1 \u2014 SAT (Spontaneous Awakening Trial)",drug:"Daily Sedation Interruption",dose:"Safety screen BEFORE SAT:\n\u2713 FiO\u2082 \u22640.7, PEEP \u226410 cmH\u2082O\n\u2713 No active seizures\n\u2713 No active alcohol/benzo withdrawal\n\u2713 No agitation requiring escalating sedation\n\u2713 No neuromuscular blockade active\nStop all sedation and opioids for up to 4h\nSAT FAIL: any of \u2014 agitation, SpO\u2082 <88%, RR >35, HR >140 or <60, SBP >180 or <90",renal:"N/A",ivpo:"SAT FAIL \u2192 restart sedation at 50% prior dose. Investigate reason. Retry SAT next day.",deesc:"SAT PASS \u2192 immediately perform SBT (do NOT delay). Paired SAT+SBT reduces MV duration by 3 days (ABC trial 2008).",note:"PAIRED SAT + SBT protocol is the most evidence-based intervention for ventilator liberation. Implement from Day 1 of ICU admission.",ref:"ABC Trial Girard NEJM 2008"},
    {cat:"STEP 2 \u2014 SBT (Spontaneous Breathing Trial)",drug:"30\u2013120 Minute SBT",dose:"Method: PS 5 cmH\u2082O + PEEP 5 OR T-piece\nDuration: 30\u2013120 min (30 min equivalent for most patients)\nSBT PASS criteria (all required):\n\u2713 RR <35/min\n\u2713 SpO\u2082 \u226590% (\u226588% for chronic hypoxemia)\n\u2713 HR <140 and stable (change <20%)\n\u2713 SBP 90\u2013180 mmHg\n\u2713 No increasing WOB (diaphoresis, accessory muscles, paradox)\n\u2713 No agitation, anxiety, or mental status change",renal:"N/A",ivpo:"SBT FAIL \u2192 return to full support settings. Investigate reason: secretions, pain, weakness, psychologic dependence, cardiac failure.",deesc:"SBT FAIL: same mode + settings as prior to SBT. Address reason for failure. Retry SBT in 24h.",note:"T-piece SBT more demanding than PS 5/5 \u2014 consider T-piece for patients expected to have higher post-extubation work of breathing.",ref:"ACCP/ATS 2017"},
    {cat:"STEP 3 \u2014 RSBI Calculation",drug:"Rapid Shallow Breathing Index",dose:"RSBI = RR \xf7 (TV in L) [measure during spontaneous breathing]\nRSBI <105: likely extubation success (sensitivity 97%, specificity 64%)\nRSBI 80\u2013105: intermediate confidence\nRSBI >105: high probability of failure\nMeasure during T-piece or minimal PS (PS 0\u20135 cmH\u2082O)\nRepeat if borderline \u2014 use as one of multiple criteria",renal:"N/A",ivpo:"RSBI is a SCREENING tool \u2014 not standalone criterion. Integrate with clinical assessment, cough, secretions, mental status.",deesc:"Use RSBI + clinical SBT pass criteria together. RSBI <80 + SBT pass = strong extubation confidence.",note:"Yang & Tobin NEJM 1991 original validation. RSBI was derived to predict SBT success \u2014 still the most widely used single extubation predictor.",ref:"Yang & Tobin NEJM 1991"},
    {cat:"STEP 4 \u2014 Extubation Criteria",drug:"Readiness for Extubation",dose:"ALL must be met:\n\u2713 SBT PASS (30\u2013120 min)\n\u2713 Alert, follows \u22652 commands\n\u2713 Adequate cough (can clear secretions)\n\u2713 Secretions manageable (suction q\u22652h sufficient)\n\u2713 Cuff leak present (or dexamethasone pretreatment given)\n\u2713 No immediate re-intubation indication\n\u2713 Airway trauma/edema low risk\nHigh-risk groups: age >65, CHF, APACHE >12, BMI >30, prior extubation failure",renal:"N/A",ivpo:"Post-extubation HFNC: 40\u201350 L/min for high-risk patients (Hernandez JAMA 2016 \u2014 reduces 72h re-intubation). BiPAP for hypercapnia risk.",deesc:"Re-intubation within 72h = 5\u20138\xd7 higher mortality. Identify high-risk patients \u2192 plan HFNC or NIV post-extubation BEFORE extubating.",note:"Cuff leak absent \u2192 dexamethasone 0.1 mg/kg q8h \xd7 3 doses before elective extubation to reduce post-extubation stridor.",ref:"ACCP/ATS 2017"},
    {cat:"Post-Extubation Support",drug:"HFNC / NIV Protocol",dose:"Standard risk: NC 2\u20136 L/min\nHigh risk (any of above): HFNC 40\u201350 L/min, FiO\u2082 titrated\nHypercapnia risk (COPD, OHS): BiPAP at prior home or acute NIV settings\nStridor: Heliox 80:20 via facemask, dexamethasone 0.1 mg/kg IV, racemic epinephrine nebulized",renal:"N/A",ivpo:"Reintubation criteria: RR >30 + SpO\u2082 <90% + increasing WOB despite post-extubation support \u2192 immediate reintubation.",deesc:"HFNC: wean flow when FiO\u2082 \u22640.4 and flow \u226420 L/min. Transition to NC then room air.",note:"OPERA trial: HFNC non-inferior to NIV post-extubation in high-risk patients. HFNC preferred for comfort; BiPAP when hypercapnia expected.",ref:"JAMA 2016"},
  ],
};

const FOLLOWUP = {
  o2:["Reassess SpO\u2082 15\u201330 min after O\u2082 initiation or adjustment","ABG if clinical concern for hypoventilation, COPD, or rising pCO\u2082","Wean O\u2082 to lowest FiO\u2082 maintaining target SpO\u2082 \u2014 unnecessary O\u2082 causes hyperoxia and worsens outcomes","Identify and treat underlying cause \u2014 O\u2082 is not treatment, it is support","Consider escalation to HFNC if >6 L/min NC or 15 L/min NRB not maintaining target SpO\u2082"],
  hfnc:["ROX index at 2h, 6h, 12h \u2014 trend matters as much as absolute value","ABG at 1\u20132h post-initiation \u2014 confirm pCO\u2082 not rising","SpO\u2082 and RR continuous monitoring \u2014 rising RR or falling ROX = escalate","Pre-declare failure criteria and escalation plan before initiating HFNC","Post-extubation: HFNC 24\u201348h in high-risk patients (reduces re-intubation)"],
  cpap:["CPAP compliance download at 1\u20134 weeks: >4h/night, \u226570% nights = adherent","Residual AHI >5 on auto-CPAP \u2192 manual titration or switch to BiPAP","Morning SpO\u2082 and symptoms review \u2014 daytime sleepiness, headache = inadequate control","Mask fit reassessment at each visit \u2014 air leaks reduce efficacy","Reassess CPAP need if weight loss >10% or surgical correction (tonsillectomy, bariatric surgery)"],
  bipap:["ABG at 1\u20132h post-NIV initiation \u2014 MANDATORY to assess response","Reassess interface seal q2h \u2014 skin breakdown at bridge of nose is common","Set explicit failure criteria before initiating \u2014 pH, RR, SpO\u2082 thresholds","Communicate ceiling of care to patient and team before NIV commencement","COPD: target pH >7.35 within 2h. If no improvement \u2192 intubate promptly.","Wean: IPAP by 2 cmH\u2082O q4\u20138h when clinically improving \u2192 CPAP \u2192 NC"],
  rsi:["Confirm tube position: ETCO\u2082 waveform \xd7 6 breaths + CXR (2\u20133 cm above carina)","Initiate sedation + analgesia immediately post-intubation","Start initial vent settings: TV 6\u20138 mL/kg IBW, RR 14, FiO\u2082 1.0, PEEP 5","Post-intubation hypotension: fluid bolus + push-dose epinephrine. Consider fentanyl excess, tension PTX, auto-PEEP.","Begin weaning assessment once underlying cause improving","Daily SAT+SBT from Day 1 of intubation"],
  daw:["If CICO: surgical airway confirmation \u2192 ENT consult for formal tracheostomy within 24\u201372h","Document difficult airway in medical record and alert bracelet","Communicate airway difficulty to patient, family, and all providers (anesthesia, outpatient records)","Investigate root cause: inadequate assessment, equipment failure, team communication","Debrief team within 24h \u2014 critical event review","Post-airway: confirm vent settings, labs, CXR, sedation/analgesia orders"],
  ards:["Daily plateau pressure and driving pressure assessment","Proning: assess response (P/F improvement >20%) after each session. Continue until supine P/F >150 sustained.","Conservative fluid balance: document daily I&O, target euvolemia after initial resuscitation","Weaning readiness: P/F >200 on PEEP \u22648 + FiO\u2082 \u22640.5 + resolving underlying cause \u2192 begin liberation assessment","Steroid discussion with team: dexamethasone protocol for moderate-severe ARDS early phase (DEXA-ARDS)","Rehabilitation planning: early mobility, PT/OT, nutritional support, DVT prophylaxis"],
  vent:["ABCDEF bundle daily: SAT+SBT paired, delirium screening, mobility, family communication","Ventilator check q8h: verify settings match orders, alarms functional, circuit integrity","Plateau pressure measurement at least daily in ARDS \u2014 every vent adjustment","VAP prevention bundle: HOB 30\u201345\xb0, oral care with chlorhexidine q6h, spontaneous breathing trials daily, minimize sedation","Nutrition: enteral nutrition within 24\u201348h of intubation (early EN reduces infection risk)","DVT prophylaxis: enoxaparin or heparin SQ unless contraindicated"],
  wean:["Document SAT safety screen result daily (pass/fail + reason)","SBT result documented with parameters at start and end of trial","RSBI trended \u2014 falling RSBI indicates improving respiratory reserve","Post-extubation: plan HFNC or NIV for high-risk patients BEFORE extubating","Reintubation criteria defined at bedside and communicated to nursing team","Re-intubation within 72h: root cause analysis, consider tracheostomy if prolonged ventilation expected (>14 days)"],
};

const REFS = {
  o2:"BTS O\u2082 Guideline 2017; Stub et al. DETO\u2082X-AMI JAMA 2018",
  hfnc:"Frat et al. FLORALI. NEJM 2015; Roca et al. ROX Index. AJRCCM 2019; Hernandez et al. JAMA 2016",
  cpap:"McEvoy et al. 3CPO. NEJM 2008; AASM Clinical Practice Guidelines 2021",
  bipap:"GOLD Guidelines 2023; BTS NIV Guidelines 2016; Brochard et al. NEJM 1995",
  rsi:"DAS 2015 Guidelines; Brown et al. RSI Review. ACEP 2023; PADIS Guidelines 2018",
  daw:"DAS 2022 Difficult Airway Guidelines; eFONA Protocol; Frerk et al. BJA 2015",
  ards:"ARDSNet NEJM 2000; Gu\xe9rin et al. PROSEVA NEJM 2013; Amato et al. NEJM 2015; Villar et al. DEXA-ARDS 2020",
  vent:"SCCM PADIS Guidelines 2018; Marra et al. ABCDEF Bundle CCM 2017; Cairo JM. Pilbeam's Mechanical Ventilation 2020",
  wean:"Yang & Tobin. RSBI. NEJM 1991; Girard et al. ABC Trial NEJM 2008; Hernandez et al. JAMA 2016; Schmidt et al. ACCP/ATS 2017",
};

/* ═══ RSI DRUG CALCULATOR ═══════════════════════════════════════════ */
function RSICalc() {
  const params = new URLSearchParams(window.location.search);
  const [wt, setWt] = useState(params.get("weight")||"");
  const [unit, setUnit] = useState(params.get("weightUnit")||"kg");
  const wKg = unit==="lb" ? parseFloat(wt)*0.453592 : parseFloat(wt);
  const valid = !isNaN(wKg) && wKg > 0;

  const drugs = [
    { group:"Induction Agents", color:T.gold, items:[
      { name:"Etomidate",          dose:0.3, max:20,  suffix:"mg/kg IV", note:"Hemodynamically neutral \xb7 single-dose adrenal suppression" },
      { name:"Ketamine",           dose:1.5, max:null, suffix:"mg/kg IV", note:"Shock/bronchospasm \xb7 maintains hemodynamics" },
      { name:"Propofol",           dose:1.5, max:null, suffix:"mg/kg IV", note:"Neuro indications \xb7 AVOID if MAP <65" },
    ]},
    { group:"Paralytics", color:T.coral, items:[
      { name:"Succinylcholine",    dose:1.5, max:200, suffix:"mg/kg IV", note:"Onset 45s \xb7 10\u201315 min \xb7 contraindicated in hyperkalemia" },
      { name:"Rocuronium (RSI)",   dose:1.2, max:null, suffix:"mg/kg IV", note:"Onset 60\u201390s \xb7 45\u201370 min \xb7 reverse with sugammadex" },
      { name:"Rocuronium (CICO)",  dose:1.6, max:null, suffix:"mg/kg IV", note:"Higher dose for RSI-equivalent onset speed" },
    ]},
    { group:"Reversal", color:T.green, items:[
      { name:"Sugammadex (routine)",dose:4,  max:null, suffix:"mg/kg IV", note:"Routine NMB reversal at end of procedure" },
      { name:"Sugammadex (CICO)",dose:16, max:null, suffix:"mg/kg IV", note:"Immediate reversal in 3 min \u2014 CICO rescue" },
    ]},
  ];

  const calcDose = (dosePerKg, max) => {
    if (!valid) return "\u2014";
    const d = Math.round(wKg * dosePerKg * 10) / 10;
    return max ? `${Math.min(d, max)} mg` : `${d} mg`;
  };

  return (
    <div style={{background:"rgba(245,200,66,0.05)",border:"1px solid rgba(245,200,66,0.25)",borderRadius:12,padding:"14px 16px",marginBottom:12}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
        <span>\ud83d\udc89</span>
        <span style={{fontSize:12,fontWeight:700,color:T.txt}}>RSI Weight-Based Drug Calculator</span>
        <span style={{fontSize:9,color:T.txt4,marginLeft:"auto",fontFamily:"monospace"}}>All doses are IV push</span>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        <input type="number" placeholder="Patient weight\u2026" value={wt} onChange={e=>setWt(e.target.value)}
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
                <div style={{fontSize:10,color:T.txt3}}>{d.dose} {d.suffix}{d.max?` (max ${d.max}mg)`:""} \xb7 {d.note}</div>
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
  const params = new URLSearchParams(window.location.search);
  const [ht, setHt] = useState(params.get("height")||"");
  const [sex, setSex] = useState(params.get("sex")||"male");
  const [unit, setUnit] = useState(params.get("heightUnit")||"cm");
  const htInch = unit==="cm" ? parseFloat(ht)/2.54 : parseFloat(ht);
  const ibw = !isNaN(htInch) && htInch > 0
    ? (sex==="male" ? 50 + 2.3*(htInch-60) : 45.5 + 2.3*(htInch-60))
    : null;
  const tv6 = ibw ? Math.round(ibw*6) : null;
  const tv4 = ibw ? Math.round(ibw*4) : null;
  const tv8 = ibw ? Math.round(ibw*8) : null;

  const peepFio2 = [
    [0.3,5],[0.4,"5\u20138"],[0.5,"8\u201310"],[0.6,10],[0.7,"10\u201314"],[0.8,14],[0.9,"14\u201318"],[1.0,"18\u201324"]
  ];
  const hiPeepFio2 = [
    [0.3,12],[0.4,"14\u201316"],[0.5,"16\u201318"],[0.6,20],[0.7,20],[0.8,"20\u201322"],[0.9,22],[1.0,"22\u201324"]
  ];

  return (
    <div style={{background:"rgba(255,107,107,0.05)",border:"1px solid rgba(255,107,107,0.22)",borderRadius:12,padding:"14px 16px",marginBottom:12}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
        <span>\ud83d\udcc9</span>
        <span style={{fontSize:12,fontWeight:700,color:T.txt}}>ARDSNet \u2014 IBW & Tidal Volume Calculator</span>
        <span style={{fontSize:9,fontFamily:"monospace",color:T.coral,marginLeft:"auto"}}>6 mL/kg PBW</span>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:10}}>
        <input type="number" placeholder="Height\u2026" value={ht} onChange={e=>setHt(e.target.value)}
          style={{flex:1,background:"rgba(14,37,68,0.7)",border:"1px solid rgba(255,107,107,0.3)",borderRadius:8,padding:"8px 12px",color:T.txt,fontFamily:"monospace",fontSize:13,outline:"none"}} />
        <div style={{display:"flex",borderRadius:8,overflow:"hidden",border:`1px solid ${T.b}`,flexShrink:0}}>
          {["cm","in"].map(u=>(
            <button key={u} onClick={()=>setUnit(u)} style={{padding:"8px 14px",cursor:"pointer",border:"none",background:unit===u?"rgba(255,107,107,0.2)":"rgba(14,37,68,0.5)",color:unit===u?T.coral:T.txt3,fontSize:11,fontWeight:700,fontFamily:"sans-serif",transition:"all .2s"}}>{u}</button>
          ))}
        </div>
        <div style={{display:"flex",borderRadius:8,overflow:"hidden",border:`1px solid ${T.b}`,flexShrink:0}}>
          {[["male","\u2642"],["female","\u2640"]].map(([s,lbl])=>(
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
              <div style={{fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:".06em",marginBottom:3}}>Range (4\u20138 mL/kg)</div>
              <div style={{fontSize:14,fontWeight:700,color:T.teal,fontFamily:"monospace",lineHeight:1.4}}>{tv4}\u2013{tv8}<span style={{fontSize:11}}> mL</span></div>
            </div>
          </div>
          <div style={{fontSize:10,color:T.txt3,borderTop:"1px solid rgba(255,107,107,0.2)",paddingTop:8}}>
            Formula: {sex==="male"?"50 + 2.3 \xd7 (height_in \u2212 60)":"45.5 + 2.3 \xd7 (height_in \u2212 60)"} \xb7 Height: {unit==="cm"?`${ht}cm = ${htInch.toFixed(1)} in`:ht+" in"}
          </div>
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <div>
          <div style={{fontSize:9,fontWeight:700,color:T.txt3,textTransform:"uppercase",letterSpacing:".07em",marginBottom:6}}>Low PEEP Table</div>
          {peepFio2.map(([fio2,peep],i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"3px 8px",background:i%2===0?"rgba(14,37,68,0.5)":"rgba(8,22,40,0.4)",borderRadius:4,marginBottom:2,fontSize:10}}>
              <span style={{color:T.txt3,fontFamily:"monospace"}}>FiO\u2082 {fio2}</span>
              <span style={{color:T.blue,fontWeight:600,fontFamily:"monospace"}}>PEEP {peep}</span>
            </div>
          ))}
        </div>
        <div>
          <div style={{fontSize:9,fontWeight:700,color:T.coral,textTransform:"uppercase",letterSpacing:".07em",marginBottom:6}}>High PEEP Table (P/F &lt;100)</div>
          {hiPeepFio2.map(([fio2,peep],i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"3px 8px",background:i%2===0?"rgba(255,107,107,0.07)":"rgba(8,22,40,0.4)",borderRadius:4,marginBottom:2,fontSize:10}}>
              <span style={{color:T.txt3,fontFamily:"monospace"}}>FiO\u2082 {fio2}</span>
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
        <span>\ud83c\udf2c\ufe0f</span>
        <span style={{fontSize:12,fontWeight:700,color:T.txt}}>ROX Index \u2014 HFNC Failure Predictor</span>
        <span style={{fontSize:9,color:T.txt4,marginLeft:"auto",fontFamily:"monospace"}}>ROX = (SpO\u2082/FiO\u2082) \xf7 RR</span>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}>
        {[["SpO\u2082 (%)", spo2, setSpo2, "e.g. 94"],["FiO\u2082 (%)", fio2, setFio2, "e.g. 60"],["RR (/min)", rr, setRr, "e.g. 28"]].map(([lbl, val, setter, ph],i)=>(
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
              {parseFloat(rox) < 2.85 ? "Escalate to BiPAP or intubation" : parseFloat(rox) < 4.88 ? "Close monitoring \u2014 serial ROX" : "Continue HFNC \u2014 low failure risk"}
            </div>
          </div>
        </div>
      )}
      {!rox && <div style={{fontSize:11,color:T.txt4,textAlign:"center",padding:"8px 0"}}>Enter SpO\u2082, FiO\u2082, and RR to calculate</div>}
      <div style={{fontSize:9,color:T.txt4,marginTop:8,fontFamily:"monospace",lineHeight:1.6}}>ROX &lt;2.85 at 2h = high failure risk \xb7 ROX \u22654.88 at 12h = low failure risk \xb7 Validated in Roca et al. AJRCCM 2019</div>
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
        <span>\ud83d\udcc8</span>
        <span style={{fontSize:12,fontWeight:700,color:T.txt}}>RSBI Calculator</span>
        <span style={{fontSize:9,color:T.txt4,marginLeft:"auto",fontFamily:"monospace"}}>RSBI = RR \xf7 (TV in L)</span>
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
              {parseFloat(rsbi) < 80 ? "High confidence extubation success" : parseFloat(rsbi) <= 105 ? "Moderate confidence \u2014 integrate with clinical" : "High probability of SBT failure"}
            </div>
          </div>
        </div>
      )}
      {!rsbi && <div style={{fontSize:11,color:T.txt4,textAlign:"center",padding:"8px 0"}}>Enter TV and RR to calculate</div>}
      <div style={{fontSize:9,color:T.txt4,marginTop:8,fontFamily:"monospace",lineHeight:1.6}}>Yang &amp; Tobin NEJM 1991 \xb7 Threshold &lt;105 \xb7 Sensitivity 97%, Specificity 64% \xb7 Use as screening tool \u2014 not standalone criterion</div>
    </div>
  );
}

/* ═══ VENT SETTINGS CHECKER ═════════════════════════════════════════ */
function VentChecker() {
  const [tv, setTv] = useState("");
  const [ibw, setIbw] = useState("");
  const [pplat, setPplat] = useState("");
  const [peep, setPeep] = useState("");
  const [rr, setRr] = useState("");
  const [fio2, setFio2] = useState("");

  const tvPerKg = parseFloat(tv) && parseFloat(ibw) ? parseFloat(tv) / parseFloat(ibw) : null;
  const dp = parseFloat(pplat) && parseFloat(peep) ? parseFloat(pplat) - parseFloat(peep) : null;
  const mv = parseFloat(tv) && parseFloat(rr) ? ((parseFloat(tv)/1000) * parseFloat(rr)).toFixed(1) : null;

  const checks = [
    { label:"Tidal Volume / IBW", calc:tvPerKg?`${tvPerKg.toFixed(2)} mL/kg`:"—", goal:"\u22646 mL/kg (4\u20138 max)", pass:tvPerKg!==null?tvPerKg<=6:null, warn:tvPerKg!==null&&tvPerKg>6&&tvPerKg<=8 },
    { label:"Plateau Pressure", calc:pplat?`${pplat} cmH\u2082O`:"—", goal:"\u226430 cmH\u2082O", pass:pplat?parseFloat(pplat)<=30:null, warn:pplat?parseFloat(pplat)>26&&parseFloat(pplat)<=30:false },
    { label:"Driving Pressure (Pplat \u2212 PEEP)", calc:dp!==null?`${dp.toFixed(1)} cmH\u2082O`:"—", goal:"\u226415 cmH\u2082O", pass:dp!==null?dp<=15:null, warn:dp!==null&&dp>12&&dp<=15 },
    { label:"Minute Ventilation", calc:mv?`${mv} L/min`:"—", goal:"5\u201310 L/min typical", pass:mv?parseFloat(mv)>=5&&parseFloat(mv)<=12:null, warn:false },
  ];

  const statusColor = (pass, warn) => pass===null ? T.txt4 : warn ? T.gold : pass ? T.teal : T.coral;
  const statusIcon  = (pass, warn) => pass===null ? "\u2014" : warn ? "\u26a0\ufe0f" : pass ? "\u2713" : "\u2717";

  const inp2 = {background:"rgba(14,37,68,0.7)",border:`1px solid ${T.b}`,borderRadius:7,padding:"7px 9px",color:T.txt,fontFamily:"monospace",fontSize:12,outline:"none",width:"100%"};

  return (
    <div style={{background:"rgba(255,107,107,0.05)",border:"1px solid rgba(255,107,107,0.22)",borderRadius:12,padding:"14px 16px",marginBottom:12}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
        <span>\u2699\ufe0f</span>
        <span style={{fontSize:12,fontWeight:700,color:T.txt}}>Vent Settings Checker \u2014 ARDSNet Compliance</span>
        <span style={{fontSize:9,fontFamily:"monospace",color:T.coral,marginLeft:"auto"}}>Plateau \u226430 \xb7 TV \u22646 mL/kg \xb7 DP \u226415</span>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7,marginBottom:7}}>
        {[["TV (mL)",tv,setTv,"e.g. 420"],["IBW (kg)",ibw,setIbw,"e.g. 70"],["Pplat (cmH\u2082O)",pplat,setPplat,"e.g. 24"]].map(([l,v,s,p])=>(
          <div key={l}><div style={{fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:".05em",marginBottom:3}}>{l}</div><input type="number" placeholder={p} value={v} onChange={e=>s(e.target.value)} style={inp2} /></div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7,marginBottom:12}}>
        {[["PEEP (cmH\u2082O)",peep,setPeep,"e.g. 8"],["RR (/min)",rr,setRr,"e.g. 14"],["FiO\u2082 (0\u20131.0)",fio2,setFio2,"e.g. 0.6"]].map(([l,v,s,p])=>(
          <div key={l}><div style={{fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:".05em",marginBottom:3}}>{l}</div><input type="number" placeholder={p} value={v} onChange={e=>s(e.target.value)} style={inp2} /></div>
        ))}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:5}}>
        {checks.map((c,i)=>{
          const sc = statusColor(c.pass, c.warn);
          return (
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:c.pass===null?"rgba(14,37,68,0.4)":c.warn?`rgba(245,200,66,0.08)`:c.pass?`rgba(0,229,192,0.07)`:`rgba(255,107,107,0.08)`,border:`1px solid ${sc}25`,borderRadius:8}}>
              <div style={{width:22,height:22,borderRadius:6,background:`${sc}18`,border:`1px solid ${sc}40`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,flexShrink:0}}>{statusIcon(c.pass,c.warn)}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:10,color:T.txt3}}>{c.label}</div>
                <div style={{fontSize:9,color:T.txt4}}>Goal: {c.goal}</div>
              </div>
              <div style={{fontSize:15,fontWeight:700,color:sc,fontFamily:"monospace",minWidth:80,textAlign:"right"}}>{c.calc}</div>
            </div>
          );
        })}
      </div>
      {(dp!==null&&dp>15)||(tvPerKg!==null&&tvPerKg>8)||(pplat&&parseFloat(pplat)>30) ? (
        <div style={{marginTop:10,padding:"8px 12px",background:"rgba(255,107,107,0.12)",border:"1px solid rgba(255,107,107,0.35)",borderRadius:8,fontSize:10,color:T.coral,fontWeight:600,lineHeight:1.6}}>
          \u26a0\ufe0f ARDSNet violation detected. Reduce TV toward 4 mL/kg IBW minimum \xb7 Pplat target \u226430 \xb7 Driving pressure target \u226415 cmH\u2082O.
        </div>
      ) : null}
    </div>
  );
}

/* ═══ HFNC TRIAL TRACKER (Item 6) ══════════════════════════════════ */
function HFNCTracker() {
  const [log, setLog] = useState([]);
  const [startTime] = useState(Date.now());
  const [spo2, setSpo2] = useState(""); const [fio2, setFio2] = useState(""); const [rr, setRr] = useState(""); const [flow, setFlow] = useState("60");
  const elapsed = (ms) => { const h=Math.floor(ms/3600000),m=Math.floor((ms%3600000)/60000); return h>0?`${h}h ${m}m`:`${m}m`; };
  const addEntry = () => {
    if (!spo2||!fio2||!rr) return;
    const rox = ((parseFloat(spo2)/(parseFloat(fio2)/100))/parseFloat(rr)).toFixed(2);
    const risk = parseFloat(rox)<2.85?"HIGH":parseFloat(rox)<4.88?"MODERATE":"LOW";
    setLog(p=>[...p,{t:Date.now()-startTime,spo2,fio2,rr,flow,rox,risk,time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}]);
    setSpo2(""); setFio2(""); setRr("");
  };
  const riskColor = r => r==="HIGH"?T.coral:r==="MODERATE"?T.gold:T.teal;
  const inpS = {background:"rgba(14,37,68,0.7)",border:`1px solid ${T.b}`,borderRadius:7,padding:"6px 8px",color:T.txt,fontFamily:"monospace",fontSize:11,outline:"none",width:"100%"};
  return (
    <div style={{background:"rgba(0,212,255,0.05)",border:"1px solid rgba(0,212,255,0.22)",borderRadius:12,padding:"14px 16px",marginBottom:12}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
        <span>\ud83d\udcca</span><span style={{fontSize:12,fontWeight:700,color:T.txt}}>HFNC Trial Tracker</span>
        <span style={{fontSize:9,color:T.txt4,marginLeft:"auto",fontFamily:"monospace"}}>Elapsed: {elapsed(Date.now()-startTime)}</span>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr auto",gap:6,marginBottom:8,alignItems:"flex-end"}}>
        {[["SpO\u2082 (%)",spo2,setSpo2,"94"],["FiO\u2082 (%)",fio2,setFio2,"80"],["RR (/min)",rr,setRr,"28"],["Flow (L/min)",flow,setFlow,"60"]].map(([l,v,s,p])=>(
          <div key={l}><div style={{fontSize:8,color:T.txt4,textTransform:"uppercase",marginBottom:2}}>{l}</div><input type="number" placeholder={p} value={v} onChange={e=>s(e.target.value)} style={inpS} /></div>
        ))}
        <button onClick={addEntry} style={{padding:"6px 12px",borderRadius:7,border:"1px solid rgba(0,212,255,0.4)",background:"rgba(0,212,255,0.1)",color:T.cyan,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"sans-serif",whiteSpace:"nowrap"}}>+ Log</button>
      </div>
      {log.length===0 && <div style={{fontSize:10,color:T.txt4,textAlign:"center",padding:"8px 0"}}>No ROX entries yet \u2014 log SpO\u2082 / FiO\u2082 / RR at 2h, 6h, 12h intervals</div>}
      {log.length>0 && (
        <div style={{display:"flex",flexDirection:"column",gap:4}}>
          {log.map((e,i)=>(
            <div key={i} style={{display:"flex",gap:8,alignItems:"center",padding:"7px 10px",background:i===log.length-1?`${riskColor(e.risk)}10`:"rgba(14,37,68,0.4)",border:`1px solid ${riskColor(e.risk)}30`,borderRadius:8}}>
              <span style={{fontSize:9,color:T.txt4,fontFamily:"monospace",minWidth:50}}>{e.time}</span>
              <span style={{fontSize:9,color:T.txt4,fontFamily:"monospace",minWidth:40}}>{elapsed(e.t)}</span>
              <span style={{fontSize:9,color:T.txt3,fontFamily:"monospace"}}>SpO\u2082 {e.spo2}% \xb7 FiO\u2082 {e.fio2}% \xb7 RR {e.rr} \xb7 {e.flow}L/min</span>
              <span style={{marginLeft:"auto",fontSize:13,fontWeight:700,color:riskColor(e.risk),fontFamily:"monospace"}}>{e.rox}</span>
              <span style={{fontSize:8,fontWeight:700,padding:"2px 7px",borderRadius:10,background:`${riskColor(e.risk)}18`,border:`1px solid ${riskColor(e.risk)}40`,color:riskColor(e.risk)}}>{e.risk}</span>
            </div>
          ))}
          {log.length>=2 && (
            <div style={{fontSize:10,color:log[log.length-1].risk==="HIGH"?T.coral:log[log.length-1].risk==="MODERATE"?T.gold:T.teal,padding:"4px 0",fontWeight:600}}>
              {log[log.length-1].risk==="HIGH"?"⚠️ Escalate: BiPAP or intubation preparation":log[log.length-1].risk==="MODERATE"?"⚡ Monitor closely — reassess in 2h":"✓ Low failure risk — continue HFNC"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══ AIRWAY TIMERS (Item 7) ════════════════════════════════════════ */
function AirwayTimers() {
  const [timers, setTimers] = useState({preox:{label:"Pre-Ox",dur:240,elapsed:0,running:false,color:T.gold},sbt:{label:"SBT",dur:1800,elapsed:0,running:false,color:T.teal},attempt:{label:"Attempt",dur:0,elapsed:0,running:false,color:T.coral}});
  const refs = {preox:useState(null)[0], sbt:useState(null)[0], attempt:useState(null)[0]};
  const tick = (key) => setTimers(p=>({...p,[key]:{...p[key],elapsed:p[key].elapsed+1}}));
  const toggle = (key) => {
    setTimers(p=>{
      const t=p[key];
      if(t.running){ clearInterval(window[`_timer_${key}`]); return {...p,[key]:{...t,running:false}}; }
      window[`_timer_${key}`] = setInterval(()=>setTimers(pp=>({...pp,[key]:{...pp[key],elapsed:pp[key].elapsed+1}})),1000);
      return {...p,[key]:{...t,running:true}};
    });
  };
  const reset = (key) => { clearInterval(window[`_timer_${key}`]); setTimers(p=>({...p,[key]:{...p[key],elapsed:0,running:false}})); };
  const fmt = (s) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  return (
    <div style={{background:"rgba(14,37,68,0.4)",border:`1px solid ${T.b}`,borderRadius:12,padding:"12px 14px",marginBottom:12}}>
      <div style={{fontSize:10,fontWeight:700,color:T.txt3,textTransform:"uppercase",letterSpacing:".07em",marginBottom:10}}>\u23f1 Clinical Timers</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
        {Object.entries(timers).map(([key,t])=>{
          const pct = t.dur>0 ? Math.min((t.elapsed/t.dur)*100,100) : null;
          const done = t.dur>0 && t.elapsed>=t.dur;
          return (
            <div key={key} style={{background:done?`${t.color}18`:"rgba(8,22,40,0.6)",border:`1px solid ${done?t.color+"55":T.b}`,borderRadius:10,padding:"10px 12px",textAlign:"center"}}>
              <div style={{fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:".06em",marginBottom:4}}>{t.label}{t.dur>0?` / ${fmt(t.dur)}`:""}</div>
              <div style={{fontSize:24,fontWeight:700,color:done?t.color:t.running?T.txt:T.txt3,fontFamily:"monospace",lineHeight:1,marginBottom:6}}>{fmt(t.elapsed)}</div>
              {pct!==null && <div style={{height:3,background:"rgba(14,37,68,0.8)",borderRadius:2,marginBottom:6,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:t.color,borderRadius:2,transition:"width .5s"}}/></div>}
              <div style={{display:"flex",gap:4,justifyContent:"center"}}>
                <button onClick={()=>toggle(key)} style={{padding:"4px 10px",borderRadius:6,border:`1px solid ${t.color}50`,background:`${t.color}12`,color:t.color,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"sans-serif"}}>{t.running?"\u23f8":"\u25b6"}</button>
                <button onClick={()=>reset(key)} style={{padding:"4px 10px",borderRadius:6,border:`1px solid ${T.b}`,background:"rgba(14,37,68,0.5)",color:T.txt4,fontSize:10,cursor:"pointer",fontFamily:"sans-serif"}}>\u21ba</button>
              </div>
              {done && <div style={{fontSize:9,color:t.color,fontWeight:700,marginTop:4}}>{key==="preox"?"\u2713 Ready for induction":key==="sbt"?"\u2713 SBT complete — assess extubation":"Stop"}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══ CICO EMERGENCY MODE (Item 8) ══════════════════════════════════ */
const CICO_STEPS = [
  {plan:"DECLARE CICO",icon:"\ud83d\udea8",color:"#ff6b6b",steps:["STOP all laryngoscopy attempts","Call for help \u2014 loudly and by name","Announce: 'CICO \u2014 Cannot Intubate, Cannot Oxygenate'","Insert oral/nasal airway + apply BVM with 2-person jaw thrust","Assign roles: airway holder, surgeon, monitor, medications, timekeeper"]},
  {plan:"PLAN A \u2014 Video Laryngoscopy",icon:"\ud83d\udd26",color:"#f5c842",steps:["First-line: Video laryngoscope (VL) with GlideScope / C-MAC D-blade","External laryngeal manipulation (ELM/BURP)","Bougie-assisted intubation over epiglottis","Max 3 total attempts by any operator — then STOP and proceed to Plan B"]},
  {plan:"PLAN B \u2014 Supraglottic Airway",icon:"\ud83e\ude7c",color:"#ff9f43",steps:["Insert iGEL (size 3/4/5) OR LMA Supreme — 2nd gen preferred","Confirm: ETCO\u2082 waveform + bilateral BS + seal pressure >25 cmH\u2082O","Oxygenate and stabilize patient","Attempt FOB-guided intubation through SGA if available"]},
  {plan:"PLAN C \u2014 Oxygenate / Awaken",icon:"\ud83d\udca4",color:"#9b6dff",steps:["Maximize BVM oxygenation (2-person technique)","Administer Sugammadex 16 mg/kg IV \u2014 reverses rocuronium in ~3 min","If succinylcholine used: wait for spontaneous recovery (~10\u201315 min)","If patient can be oxygenated: awaken and plan awake intubation"]},
  {plan:"PLAN D \u2014 SURGICAL AIRWAY",icon:"\u2702\ufe0f",color:"#3dffa0",steps:["KNIFE \u2014 scalpel: horizontal stab incision through cricothyroid membrane","FINGER \u2014 insert index finger to dilate, identify lumen","TUBE \u2014 bougie into trachea, railload ETT 6.0 cuffed (or Melker kit)","Inflate cuff \u2014 ventilate \u2014 confirm ETCO\u2082 waveform","CICO-to-airway target: <2 minutes"]},
];
function CICOMode({ onClose }) {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState({});
  const s = CICO_STEPS[step];
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(5,10,20,0.97)",zIndex:9999,display:"flex",flexDirection:"column",padding:20}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
        <div style={{fontSize:10,fontWeight:700,color:T.coral,textTransform:"uppercase",letterSpacing:".1em",padding:"4px 12px",borderRadius:20,background:"rgba(255,107,107,0.15)",border:"1px solid rgba(255,107,107,0.4)"}}>CICO EMERGENCY MODE</div>
        <div style={{marginLeft:"auto",display:"flex",gap:6}}>
          {CICO_STEPS.map((_,i)=><div key={i} style={{width:28,height:4,borderRadius:2,background:i===step?CICO_STEPS[i].color:i<step?"rgba(61,255,160,0.5)":"rgba(26,53,85,0.6)",cursor:"pointer"}} onClick={()=>setStep(i)} />)}
        </div>
        <button onClick={onClose} style={{padding:"5px 12px",borderRadius:7,border:"1px solid rgba(255,107,107,0.3)",background:"transparent",color:T.txt3,fontSize:11,cursor:"pointer",fontFamily:"sans-serif"}}>Exit</button>
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",maxWidth:560,margin:"0 auto",width:"100%"}}>
        <div style={{fontSize:40,marginBottom:12}}>{s.icon}</div>
        <div style={{fontSize:18,fontWeight:700,color:s.color,textAlign:"center",marginBottom:20,fontFamily:"'Playfair Display',serif"}}>{s.plan}</div>
        <div style={{width:"100%",display:"flex",flexDirection:"column",gap:8,marginBottom:24}}>
          {s.steps.map((txt,i)=>(
            <div key={i} onClick={()=>setDone(p=>({...p,[`${step}-${i}`]:!p[`${step}-${i}`]}))} style={{display:"flex",gap:10,padding:"10px 14px",borderRadius:10,border:`1px solid ${done[`${step}-${i}`]?s.color+"45":T.b}`,background:done[`${step}-${i}`]?`${s.color}10`:"rgba(8,22,40,0.7)",cursor:"pointer",alignItems:"flex-start"}}>
              <div style={{width:22,height:22,borderRadius:6,border:`1px solid ${done[`${step}-${i}`]?s.color+"55":T.b}`,background:done[`${step}-${i}`]?`${s.color}20`:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,flexShrink:0,color:s.color}}>{done[`${step}-${i}`]?"\u2713":i+1}</div>
              <span style={{fontSize:13,color:done[`${step}-${i}`]?s.color:T.txt2,lineHeight:1.5}}>{txt}</span>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={()=>setStep(Math.max(0,step-1))} disabled={step===0} style={{padding:"10px 24px",borderRadius:9,border:`1px solid ${T.b}`,background:"rgba(14,37,68,0.5)",color:T.txt3,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"sans-serif",opacity:step===0?0.4:1}}>← Back</button>
          {step<CICO_STEPS.length-1
            ? <button onClick={()=>setStep(step+1)} style={{padding:"10px 28px",borderRadius:9,border:`1px solid ${s.color}55`,background:`${s.color}15`,color:s.color,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"sans-serif"}}>Next Plan →</button>
            : <button onClick={onClose} style={{padding:"10px 28px",borderRadius:9,border:`1px solid ${T.green}55`,background:"rgba(61,255,160,0.1)",color:T.green,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"sans-serif"}}>\u2713 Airway Secured</button>
          }
        </div>
      </div>
    </div>
  );
}

/* ═══ DIFFICULT AIRWAY ALERT (Item 9) ══════════════════════════════ */
function DiffAirwayAlert() {
  const [f, setF] = useState({name:"",dob:"",mrn:"",enc:"",plans:"",outcome:"",ettsz:"",depth:"",notes:""});
  const [copied, setCopied] = useState(false); const [show, setShow] = useState(false);
  const upd = (k,v) => setF(p=>({...p,[k]:v}));
  const note = `⚠️ DIFFICULT AIRWAY ALERT ⚠️
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Patient: ${f.name||"[Name]"}  |  DOB: ${f.dob||"[DOB]"}  |  MRN: ${f.mrn||"[MRN]"}
Date of Encounter: ${f.enc||new Date().toLocaleDateString()}

AIRWAY ENCOUNTER:
${f.plans||"[Describe difficulty — grade of view, technique, attempts]"}

OUTCOME:
${f.outcome||"[Final airway achieved / surgical airway / outcome]"}

${f.ettsz?`ETT placed: ${f.ettsz} mm at ${f.depth||"[X]"} cm at lip\n`:""}${f.notes?`ADDITIONAL NOTES:\n${f.notes}\n`:""}
ALERT: All future airway providers must be notified.
This patient has a documented difficult airway. Awake intubation or senior
airway provider presence is strongly recommended for any future intubation.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  const copy = () => navigator.clipboard.writeText(note).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2500);});
  const inpS = {background:"rgba(14,37,68,0.7)",border:`1px solid ${T.b}`,borderRadius:7,padding:"7px 9px",color:T.txt,fontFamily:"monospace",fontSize:11,outline:"none",width:"100%"};
  return (
    <div style={{background:"rgba(255,107,107,0.05)",border:"1px solid rgba(255,107,107,0.25)",borderRadius:10,padding:"12px 14px",marginBottom:10}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
        <span style={{fontSize:14}}>\u26a0\ufe0f</span>
        <div><div style={{fontSize:11,fontWeight:700,color:T.coral}}>Difficult Airway Alert Generator</div><div style={{fontSize:9,color:T.txt4}}>Generate and copy for EHR, discharge summary, and future providers</div></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:6}}>
        {[["Patient Name",f.name,"name"],["DOB",f.dob,"dob"],["MRN",f.mrn,"mrn"]].map(([l,v,k])=>(
          <div key={k}><div style={{fontSize:8,color:T.txt4,textTransform:"uppercase",marginBottom:2}}>{l}</div><input type="text" placeholder={l} value={v} onChange={e=>upd(k,e.target.value)} style={inpS}/></div>
        ))}
      </div>
      <div style={{marginBottom:6}}><div style={{fontSize:8,color:T.txt4,textTransform:"uppercase",marginBottom:2}}>Airway Encounter (difficulty, C-L grade, attempts)</div><textarea rows={2} value={f.plans} onChange={e=>upd("plans",e.target.value)} placeholder="e.g., Grade III view on VL, 2 attempts with bougie, Plan B iGEL used..." style={{...inpS,resize:"vertical"}}/></div>
      <div style={{marginBottom:6}}><div style={{fontSize:8,color:T.txt4,textTransform:"uppercase",marginBottom:2}}>Outcome</div><textarea rows={2} value={f.outcome} onChange={e=>upd("outcome",e.target.value)} placeholder="e.g., Successfully intubated via VL 7.5 mm ETT at 23 cm on 3rd attempt" style={{...inpS,resize:"vertical"}}/></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:6}}>
        {[["ETT Size (mm)",f.ettsz,"ettsz"],["Depth at Lip (cm)",f.depth,"depth"],["Date of Encounter",f.enc,"enc"]].map(([l,v,k])=>(
          <div key={k}><div style={{fontSize:8,color:T.txt4,textTransform:"uppercase",marginBottom:2}}>{l}</div><input type="text" value={v} onChange={e=>upd(k,e.target.value)} placeholder={l} style={inpS}/></div>
        ))}
      </div>
      <div style={{display:"flex",gap:8,marginTop:8}}>
        <button onClick={()=>setShow(!show)} style={{flex:1,padding:"8px 0",borderRadius:8,border:"1px solid rgba(255,107,107,0.3)",background:"rgba(255,107,107,0.06)",color:T.coral,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"sans-serif"}}>{show?"▲ Hide":"▼ Preview Alert"}</button>
        <button onClick={copy} style={{flex:1,padding:"8px 0",borderRadius:8,border:`1px solid ${copied?T.green+"55":"rgba(255,107,107,0.3)"}`,background:copied?"rgba(61,255,160,0.1)":"rgba(255,107,107,0.06)",color:copied?T.green:T.coral,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"sans-serif",transition:"all .2s"}}>{copied?"✓ Copied":"⚠️ Copy Alert"}</button>
      </div>
      {show && <div style={{marginTop:10,background:"rgba(5,15,30,0.85)",border:"1px solid rgba(255,107,107,0.2)",borderRadius:8,padding:"12px 14px"}}><pre style={{fontSize:10,color:T.txt2,lineHeight:1.7,whiteSpace:"pre-wrap",fontFamily:"'JetBrains Mono',monospace",margin:0}}>{note}</pre></div>}
    </div>
  );
}

/* ═══ QUICK REF CARD (Item 10) ══════════════════════════════════════ */
const QUICK_REF = {
  rsi: ["Pre-ox: NRB 15 L/min \xd7 3\u20135 min \u2192 SpO\u2082 >93%","Etomidate 0.3 mg/kg \xb7 Ketamine 1.5 mg/kg (shock)","Succinylcholine 1.5 mg/kg (max 200 mg) \xb7 Rocuronium 1.2 mg/kg","Max 3 attempts \u2192 then Plan B (SGA)","Confirm ETCO\u2082 waveform \xd7 6 breaths only"],
  daw: ["LEMON: Look \xb7 Evaluate 3-3-2 \xb7 Mallampati \xb7 Obstruction \xb7 Neck","Plans: A=VL \u2192 B=iGEL/LMA \u2192 C=Awaken/Topicalize \u2192 D=Surgical","CICO: Knife-Finger-Tube through cricothyroid membrane","Sugammadex 16 mg/kg IV \u2014 reverses rocuronium in 3 min","Declare CICO aloud \u2014 do NOT delay surgical airway"],
  ards: ["Berlin: P/F <300 on PEEP \u22655 \u2192 Mild/Moderate/Severe","TV 6 mL/kg IBW (NEVER actual weight) \u2022 range 4\u20138 mL/kg","Pplat \u226430 cmH\u2082O \xb7 Driving pressure \u226415 cmH\u2082O","Prone \u226516h/day if P/F <150 on FiO\u2082 \u22650.6 (PROSEVA: 33\u219216%)","Conservative fluid once stable \xb7 Daily Pplat + liberation check"],
  hfnc: ["Start 40\u201360 L/min, FiO\u2082 1.0 \u2192 titrate to SpO\u2082 92\u201396%","ROX = (SpO\u2082/FiO\u2082%) \xf7 RR \xb7 Calculate at 2h, 6h, 12h","ROX <2.85 at 2h = high failure risk \u2192 escalate NOW","Wean FiO\u2082 first, then flow in 5 L/min decrements","Don't delay intubation in HFNC failure \u2014 worsens outcomes"],
  bipap: ["COPD pH 7.25\u20137.35: BiPAP reduces intubation 50%, mortality 48%","IPAP 8\u201310 start \u2192 max 20\u201322 \xb7 EPAP 4\u20135 cmH\u2082O","Mandatory ABG at 1\u20132h: no improvement = intubate","Target SpO\u2082 88\u201392% in COPD to avoid hypercapnic suppression","Define failure criteria BEFORE initiating NIV"],
  wean: ["Daily SAT screen \u2192 if pass, immediately run SBT (paired protocol)","SBT: PS 5/5 or T-piece \xd7 30\u2013120 min \u2022 30 min = 120 min","RSBI = RR \xf7 (TV in L) \xb7 <105 = likely success (97% sensitivity)","Post-extubation HFNC in high-risk: reduces re-intubation","Cuff leak absent \u2192 dexamethasone 0.1 mg/kg q8h \xd7 3 before extubation"],
  vent: ["AC-VC: guaranteed MV \xb7 monitor Pplat (goal \u226430 cmH\u2082O)","ABCDEF bundle from Day 1: sedation-analgesia-SAT-SBT-delirium-mobility","RASS target -1 to 0 \xb7 analgesia-first model (opioid before sedative)","Auto-PEEP in COPD: slow RR + long expiratory time + disconnect if crisis","Driving pressure (Pplat\u2212PEEP) \u226415: strongest ARDS mortality predictor"],
  o2: ["NC 1\u20136 L/min \u2192 FiO\u2082 24\u201344% \xb7 NRB 15 L/min \u2192 FiO\u2082 60\u201390%","Target SpO\u2082 92\u201396% \xb7 88\u201392% for COPD (avoid O\u2082 excess)","Apneic oxygenation: NC 15 L/min during laryngoscopy (delays desat)","Venturi mask: precise FiO\u2082 in COPD (24\u201360% color-coded adaptors)","Escalate to HFNC if NRB 15 L/min fails to maintain SpO\u2082 target"],
  cpap: ["CPAP 5\u201315 cmH\u2082O \xb7 start 5, titrate by 2 cmH\u2082O increments","3CPO: CPAP = BiPAP for acute CPE \xb7 both reduce intubation ~50%","OSA: AHI \u226515 = severe \xb7 Target >4h/night compliance \xd7 70% nights","BiPAP for: CPAP-intolerant, OHS, central sleep apnea, residual AHI >5","Reassess need with significant weight loss (>10% body weight)"],
};
function QuickRefCard({ condId }) {
  const refs = QUICK_REF[condId];
  if (!refs) return null;
  return (
    <div style={{background:"rgba(155,109,255,0.06)",border:"1px solid rgba(155,109,255,0.25)",borderRadius:10,padding:"12px 14px",marginTop:10}}>
      <div style={{fontSize:10,fontWeight:700,color:T.purple,textTransform:"uppercase",letterSpacing:".07em",marginBottom:10}}>⚡ Quick-Ref \u2014 5 Critical Numbers</div>
      {refs.map((r,i)=>(
        <div key={i} style={{display:"flex",gap:8,padding:"6px 0",borderBottom:i<refs.length-1?"1px solid rgba(26,53,85,0.4)":"none",alignItems:"flex-start"}}>
          <div style={{width:18,height:18,borderRadius:5,background:"rgba(155,109,255,0.15)",border:"1px solid rgba(155,109,255,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:T.purple,fontWeight:700,flexShrink:0,marginTop:1}}>{i+1}</div>
          <div style={{fontSize:11,color:T.txt2,lineHeight:1.5,fontFamily:"monospace"}}>{r}</div>
        </div>
      ))}
    </div>
  );
}

/* ═══ MDM SNIPPET DATA ══════════════════════════════════════════════ */
const MDM_DATA = {
  o2:{
    fields:[{id:"dx",lbl:"Primary Diagnosis",ph:"e.g., community-acquired pneumonia"},{id:"spo2",lbl:"Initial SpO\u2082",ph:"e.g., 88% on RA"},{id:"dev",lbl:"Device Selected",ph:"e.g., NC 4 L/min"}],
    t:(f)=>`Patient presented with hypoxemia in the setting of ${f.dx||"[primary diagnosis]"}, with initial SpO\u2082 ${f.spo2||"[X%]"} on room air. Supplemental oxygen was initiated via ${f.dev||"[device / flow rate]"}, targeting SpO\u2082 92\u201396% per BTS guidelines (88\u201392% in known COPD/hypercapnia). Titration to the lowest effective FiO\u2082 is planned to avoid the known harms of hyperoxia. Underlying etiology is being evaluated and addressed concurrently. Escalation criteria to HFNC or NIV have been defined and communicated to the nursing team.`
  },
  hfnc:{
    fields:[{id:"dx",lbl:"Indication",ph:"e.g., hypoxic respiratory failure / COVID pneumonia"},{id:"flow",lbl:"Initial Settings",ph:"e.g., 50 L/min, FiO\u2082 0.80"},{id:"rox",lbl:"2h ROX Index",ph:"e.g., 3.4"}],
    t:(f)=>`High-flow nasal cannula (HFNC) was initiated for ${f.dx||"[indication]"} after failure to maintain adequate oxygenation on conventional supplemental oxygen. Initial settings: ${f.flow||"[X L/min, FiO\u2082 X]"}. ROX index at 2h: ${f.rox||"[X]"} (threshold <2.85 = high failure risk per Roca et al. 2019). Patient maintains spontaneous respiratory effort, intact airway protective reflexes, and hemodynamic stability — supporting a trial of non-invasive escalation. Serial ROX monitoring planned at 2h, 6h, and 12h intervals. Failure criteria are predefined: SpO\u2082 <90%, RR >35, deteriorating ROX, or altered mental status. RSI team is on standby.`
  },
  cpap:{
    fields:[{id:"dx",lbl:"Indication",ph:"e.g., acute cardiogenic pulmonary edema"},{id:"p",lbl:"CPAP Pressure",ph:"e.g., 8 cmH\u2082O"},{id:"resp",lbl:"Initial Response",ph:"e.g., SpO\u2082 improved 89 \u2192 95%"}],
    t:(f)=>`CPAP was initiated for ${f.dx||"[indication]"} at ${f.p||"[X] cmH\u2082O"}, with initial response: ${f.resp||"[clinical response]"}. The 3CPO trial supports a ~50% reduction in intubation rates for acute cardiogenic pulmonary edema with non-invasive pressure support. CPAP contraindications were excluded (no apnea, altered airway, active emesis, or hemodynamic collapse). Simultaneous treatment of the underlying etiology is underway. Interface tolerance and hemodynamics are being monitored. Failure criteria and escalation plan to BiPAP or intubation have been communicated to the care team.`
  },
  bipap:{
    fields:[{id:"ph",lbl:"Admission pH",ph:"e.g., 7.29"},{id:"pco2",lbl:"pCO\u2082 (mmHg)",ph:"e.g., 72"},{id:"dx",lbl:"Indication",ph:"e.g., COPD exacerbation"}],
    t:(f)=>`BiPAP/NIV was initiated for ${f.dx||"[indication]"} with admission ABG: pH ${f.ph||"[X]"}, pCO\u2082 ${f.pco2||"[X]"} mmHg, meeting criteria for non-invasive ventilatory support per BTS and GOLD guidelines (Grade A evidence, pH 7.25\u20137.35). Risk of delayed intubation was weighed against the significant mortality benefit of NIV in this indication. Failure criteria were explicitly defined prior to initiation: pH <7.25 unresponsive at 1\u20132h, RR >30 despite full settings, worsening hypoxemia, or deteriorating mental status. ABG at 1\u20132h post-initiation ordered. Patient and team briefed on escalation plan. All NIV contraindications excluded.`
  },
  rsi:{
    fields:[{id:"ind",lbl:"Indication for Intubation",ph:"e.g., hypoxic respiratory failure"},{id:"lemon",lbl:"Airway Assessment",ph:"e.g., LEMON favorable — no difficult features"},{id:"agent",lbl:"Agents Used",ph:"e.g., etomidate 20 mg + succinylcholine 140 mg"}],
    t:(f)=>`Urgent RSI was performed for ${f.ind||"[clinical indication]"}. Pre-procedure airway assessment: ${f.lemon||"LEMON criteria reviewed — no features predictive of difficult laryngoscopy identified"}. The risks of RSI (aspiration, post-intubation hypotension, failed intubation) were considered alongside the risks of continued hypoxemia and respiratory failure. Agents: ${f.agent||"[induction agent + dose, paralytic + dose]"}. Pre-oxygenation was performed with NRB 15 L/min \xd7 3\u20135 minutes with simultaneous NC 15 L/min for apneic oxygenation. Difficult airway equipment confirmed at bedside. Team briefed on Plans A\u2013D. ETT placement confirmed via continuous waveform ETCO\u2082. Post-intubation sedation and analgesia initiated immediately.`
  },
  daw:{
    fields:[{id:"enc",lbl:"Airway Encounter",ph:"e.g., unanticipated grade III view on VL"},{id:"plan",lbl:"Plans Executed",ph:"e.g., Plan A \xd72 \u2192 Plan B iGEL \u2192 success"},{id:"out",lbl:"Final Outcome",ph:"e.g., successfully intubated via VL on attempt 3"}],
    t:(f)=>`Patient required difficult airway management: ${f.enc||"[encounter description]"}. DAS 2022 four-plan framework was followed: ${f.plan||"[plans description]"}. Outcome: ${f.out||"[outcome]"}. The difficult airway encounter has been formally documented in the permanent medical record. Patient and family have been informed of the difficult airway and advised to notify all future anesthetic and airway providers. A formal difficult airway alert will be entered into the EHR. ENT/anesthesia backup was available throughout. Post-event team debrief was conducted to identify learning opportunities.`
  },
  ards:{
    fields:[{id:"pf",lbl:"P/F Ratio",ph:"e.g., 130 (moderate ARDS)"},{id:"tv",lbl:"Target Tidal Volume",ph:"e.g., 380 mL (6 mL/kg IBW)"},{id:"pplat",lbl:"Plateau Pressure",ph:"e.g., 24 cmH\u2082O"}],
    t:(f)=>`Patient meets Berlin 2012 criteria for ARDS: P/F ratio ${f.pf||"[X]"} on PEEP \u22655 cmH\u2082O with bilateral opacities and no fully explanatory cardiac etiology. ARDSNet lung-protective ventilation was implemented: tidal volume ${f.tv||"[X mL / 6 mL/kg IBW]"}, plateau pressure ${f.pplat||"[X] cmH\u2082O"} (target \u226430 cmH\u2082O), driving pressure calculated (target \u226415 cmH\u2082O). PEEP/FiO\u2082 table applied per ARDSNet low-PEEP protocol. Conservative fluid strategy initiated once hemodynamically stable. Prone positioning criteria evaluated. Infectious etiology workup underway. Daily plateau pressure reassessment and liberation assessment planned.`
  },
  vent:{
    fields:[{id:"ind",lbl:"Indication for MV",ph:"e.g., respiratory failure, inability to protect airway"},{id:"mode",lbl:"Ventilator Mode",ph:"e.g., Volume Control A/C"},{id:"set",lbl:"Initial Settings",ph:"e.g., TV 440 mL, RR 14, FiO\u2082 1.0, PEEP 5"}],
    t:(f)=>`Patient is mechanically ventilated for ${f.ind||"[indication]"} via ${f.mode||"[mode]"} with initial settings: ${f.set||"[TV, RR, FiO\u2082, PEEP]"}. Lung-protective ventilation strategy applied: TV 6\u20138 mL/kg IBW, Pplat target \u226430 cmH\u2082O, driving pressure \u226415 cmH\u2082O. ABCDEF bundle implemented from admission: analgesia-first sedation (target RASS \u22121 to 0), daily SAT+SBT pairing ordered, CAM-ICU delirium screening q12h, early mobility referral placed, family communication log initiated. VAP prevention bundle confirmed. Daily plateau pressure measurement and ventilator liberation readiness assessment will be documented.`
  },
  wean:{
    fields:[{id:"rsbi",lbl:"RSBI",ph:"e.g., 78 /min/L"},{id:"sbt",lbl:"SBT Method / Duration",ph:"e.g., PS 5/5 \xd7 30 min — passed"},{id:"risk",lbl:"Extubation Risk",ph:"e.g., standard / high risk (CHF, age >65)"}],
    t:(f)=>`Ventilator liberation assessment completed. SAT safety screen passed. SBT performed: ${f.sbt||"[method \xd7 duration — result]"}. All SBT pass criteria met per ACCP/ATS 2017: RR <35, SpO\u2082 \u226590%, hemodynamically stable, no accessory muscle use or diaphoresis. RSBI: ${f.rsbi||"[X] /min/L"} (threshold <105; Yang & Tobin NEJM 1991). Cough effort is adequate for secretion clearance. Patient is alert and follows \u22652 commands. Extubation risk: ${f.risk||"[standard / high]"}. Post-extubation plan: ${(f.risk||"").toLowerCase().includes("high")?"HFNC 40\u201350 L/min per Hernandez JAMA 2016 protocol":"supplemental O\u2082 titrated to SpO\u2082 target"}. Reintubation criteria defined and communicated to bedside nurse.`
  },
};

/* ═══ MDM SNIPPET COMPONENT ═════════════════════════════════════════ */
function MDMSnippet({ condId }) {
  const tmpl = MDM_DATA[condId];
  if (!tmpl) return null;
  const [fields, setFields] = useState({});
  const [copied, setCopied] = useState(false);
  const [show, setShow] = useState(false);
  const note = tmpl.t(fields);
  const copy = () => navigator.clipboard.writeText(note).then(()=>{ setCopied(true); setTimeout(()=>setCopied(false),2500); });
  return (
    <div style={{marginTop:16,background:"rgba(0,229,192,0.04)",border:"1px solid rgba(0,229,192,0.22)",borderRadius:10,padding:"12px 14px"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
        <span style={{fontSize:14}}>\ud83d\udccb</span>
        <div>
          <div style={{fontSize:11,fontWeight:700,color:T.teal}}>MDM Snippet Generator</div>
          <div style={{fontSize:9,color:T.txt4}}>Fill key fields \u2014 generates a ready-to-paste MDM paragraph</div>
        </div>
      </div>
      {tmpl.fields.map(f=>(
        <div key={f.id} style={{marginBottom:7}}>
          <div style={{fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:".06em",marginBottom:3}}>{f.lbl}</div>
          <input type="text" placeholder={f.ph} value={fields[f.id]||""} onChange={e=>setFields(p=>({...p,[f.id]:e.target.value}))}
            style={{width:"100%",background:"rgba(14,37,68,0.7)",border:`1px solid ${T.b}`,borderRadius:7,padding:"7px 10px",color:T.txt,fontFamily:"monospace",fontSize:11,outline:"none"}} />
        </div>
      ))}
      <div style={{display:"flex",gap:8,marginTop:10}}>
        <button onClick={()=>setShow(!show)} style={{flex:1,padding:"8px 0",borderRadius:8,cursor:"pointer",fontFamily:"sans-serif",border:"1px solid rgba(0,229,192,0.3)",background:"rgba(0,229,192,0.05)",color:T.teal,fontSize:11,fontWeight:700}}>
          {show?"\u25b2 Hide":"\u25bc Preview"}
        </button>
        <button onClick={copy} style={{flex:1,padding:"8px 0",borderRadius:8,cursor:"pointer",fontFamily:"sans-serif",transition:"all .2s",border:`1px solid ${copied?T.green+"55":"rgba(0,229,192,0.3)"}`,background:copied?"rgba(61,255,160,0.1)":"rgba(0,229,192,0.05)",color:copied?T.green:T.teal,fontSize:11,fontWeight:700}}>
          {copied?"\u2713 Copied":"\ud83d\udccb Copy MDM"}
        </button>
      </div>
      {show && (
        <div style={{marginTop:10,background:"rgba(5,15,30,0.8)",border:"1px solid rgba(0,229,192,0.15)",borderRadius:8,padding:"12px 14px"}}>
          <div style={{fontSize:9,color:T.teal,fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",marginBottom:8}}>Medical Decision Making</div>
          <p style={{fontSize:11,color:T.txt2,lineHeight:1.75,margin:0,fontFamily:"'JetBrains Mono',monospace"}}>{note}</p>
        </div>
      )}
    </div>
  );
}

/* ═══ ORDER SETS ════════════════════════════════════════════════════ */
const ORDER_SETS = {
  rsi:{
    label:"Post-Intubation Orders",icon:"\ud83d\udc89",color:"#f5c842",
    sets:[
      {title:"Ventilator",text:`MECHANICAL VENTILATION — POST-INTUBATION
Mode: Volume Control A/C
Tidal Volume: 6–8 mL/kg IBW (calculate IBW from height)
RR: 14/min
FiO₂: 1.0 (wean to SpO₂ 92–96%)
PEEP: 5 cmH₂O
Inspiratory pause: 0.5 sec (check plateau pressure)
ETCO₂: Continuous waveform capnography
CXR: STAT post-intubation (tube position verification)`},
      {title:"Sedation / Analgesia",text:`SEDATION + ANALGESIA (Analgesia-first)
Fentanyl 25–100 mcg/h IV infusion — titrate to CPOT <3
  PRN: Fentanyl 25–50 mcg IV q30min for procedural pain
Propofol 5–50 mcg/kg/min IV infusion — titrate to RASS -1 to 0
  Alt: Midazolam 0.02–0.1 mg/kg/h if propofol unavailable
RASS Goal: -1 to 0 (unless specific indication for deeper)
CAM-ICU: Assess q12h`},
      {title:"Labs / Monitoring",text:`POST-INTUBATION LABS + MONITORING
ABG: STAT (confirm ventilation, oxygenation, acid-base)
BMP: STAT
CBC: STAT
Lactic acid: STAT (if hemodynamic compromise suspected)
Repeat ABG: 30–60 min after vent setting changes
SpO₂: Continuous
Hemodynamic monitoring: BP q1h or arterial line if labile
CXR: STAT (ETT position — target 2–3 cm above carina)`},
    ]
  },
  ards:{
    label:"ARDSNet Bundle Orders",icon:"\ud83d\udcc9",color:"#ff6b6b",
    sets:[
      {title:"Vent (ARDSNet)",text:`ARDSNET LUNG-PROTECTIVE VENTILATION
Mode: Volume Control A/C
Tidal Volume: 6 mL/kg PBW — NEVER use actual body weight
  Male PBW: 50 + 2.3 × (height_inches − 60)
  Female PBW: 45.5 + 2.3 × (height_inches − 60)
PEEP/FiO₂: Per Low PEEP Table (see protocol)
Plateau Pressure: Check q shift — GOAL ≤30 cmH₂O
Driving Pressure: Pplat − PEEP — GOAL ≤15 cmH₂O
Permissive hypercapnia: pH ≥7.20 acceptable
SpO₂ target: 88–95% (PaO₂ 55–80 mmHg)`},
      {title:"Prone Positioning",text:`PRONE POSITIONING (if P/F <150 on FiO₂ ≥0.6)
Duration: 16 hours prone, 8 hours supine
Minimum 5 staff for proning procedure
Protective eye care, pressure point padding required
Continue lung-protective settings during prone
Monitor: BP, SpO₂, ETT position, line security
Discontinue when: SpO₂ >150 supine ×2 sessions on PEEP ≤10, FiO₂ ≤0.6`},
      {title:"Fluid + Support",text:`ARDS SUPPORTIVE CARE
Fluid strategy: Conservative once hemodynamically stable (FACTT trial)
Daily I&O target: even to −500 mL once MAP >65
Nutrition: Enteral nutrition within 24–48h (head of bed 30–45°)
DVT prophylaxis: Enoxaparin 40 mg SQ daily (or per renal protocol)
GI prophylaxis: Pantoprazole 40 mg IV/PO daily
VAP bundle: HOB 30–45°, oral care q6h chlorhexidine, daily SBT assessment
NMB (if indicated): Cisatracurium 0.2 mg/kg load → 0.06–0.6 mg/kg/h
  Cisatracurium preferred — Hofmann elimination (no renal/hepatic adjustment)`},
    ]
  },
  hfnc:{
    label:"HFNC Initiation Orders",icon:"\ud83c\udf2c\ufe0f",color:"#00d4ff",
    sets:[
      {title:"HFNC Setup",text:`HIGH-FLOW NASAL CANNULA (HFNC) INITIATION
Flow rate: 40–60 L/min (start 40, increase to 60 if tolerated)
FiO₂: 1.0 initially → titrate to SpO₂ 92–96% (88–92% COPD)
Temperature: 37°C (reduce to 31°C if patient discomfort)
Interface: Largest comfortable nasal prongs (no blanching)
Humidifier: Active humidification circuit confirmed
SpO₂: Continuous monitoring
RR: Document q1h — key ROX index input
ROX Index: Calculate at 2h, 6h, 12h post-initiation
  Formula: (SpO₂/FiO₂) ÷ RR — failure risk <2.85 at 2h`},
    ]
  },
  bipap:{
    label:"BiPAP / NIV Orders",icon:"\ud83e\udd42",color:"#ff9f43",
    sets:[
      {title:"BiPAP Setup",text:`BiPAP / NON-INVASIVE VENTILATION
IPAP: 8–10 cmH₂O → titrate by 2 cmH₂O increments (max 20–22)
EPAP: 4–5 cmH₂O → titrate to oxygenation
Backup Rate: 10–12/min
FiO₂: Target SpO₂ 88–92% (COPD) or 92–96% (other)
Interface: Full face mask (preferred for acute hypercapnia)
SpO₂: Continuous monitoring
ETCO₂: Non-invasive if available
ABG: STAT baseline, then MANDATORY at 1–2h post-initiation
Skin check: Interface pressure points q2h
FAILURE CRITERIA (define before start):
  pH <7.25 at 1–2h despite max settings
  RR >30 or worsening SpO₂ despite full support
  Altered mental status or hemodynamic instability`},
    ]
  },
  wean:{
    label:"Post-Extubation Orders",icon:"\ud83d\udcc8",color:"#3dffa0",
    sets:[
      {title:"Post-Extubation",text:`POST-EXTUBATION ORDERS
Oxygen: HFNC 40–50 L/min (high-risk) OR NC per SpO₂ titration
  SpO₂ target: 92–96% (88–92% if COPD)
Monitoring: Continuous SpO₂ + RR for 4h post-extubation
HOB: 30–45° at all times
Diet: NPO × 2–4h post-extubation, then advance per swallow eval
Speech therapy: Swallow screen within 4h if indicated
Respiratory therapy: Incentive spirometry q2h while awake
  PRN nebulized treatments if bronchospasm / secretions
Stridor protocol:
  Heliox 80:20 via facemask
  Dexamethasone 0.1 mg/kg IV q8h × 3 doses
  Racemic epinephrine 0.5 mL neb PRN
Reintubation criteria: RR >30, SpO₂ <90% despite support, increased WOB
Analgesia: Multimodal — acetaminophen + opioid PRN (avoid sedation if possible)`},
    ]
  },
};

/* ═══ ORDER SET PANEL ═══════════════════════════════════════════════ */
function OrderSetPanel({ condId }) {
  const os = ORDER_SETS[condId];
  if (!os) return null;
  const [active, setActive] = useState(null);
  const [copied, setCopied] = useState(null);
  const copy = (idx, text) => {
    navigator.clipboard.writeText(text).then(()=>{
      setCopied(idx); setTimeout(()=>setCopied(null), 2500);
    });
  };
  return (
    <div style={{background:`${os.color}08`,border:`1px solid ${os.color}30`,borderRadius:10,marginBottom:12,overflow:"hidden"}}>
      <div style={{padding:"10px 14px",display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:15}}>{os.icon}</span>
        <div style={{flex:1}}>
          <div style={{fontSize:11,fontWeight:700,color:os.color}}>{os.label}</div>
          <div style={{fontSize:9,color:T.txt4}}>Tap a set to expand \xb7 Copy to paste into CPOE</div>
        </div>
      </div>
      <div style={{borderTop:`1px solid ${os.color}20`,padding:"8px 10px",display:"flex",gap:6,flexWrap:"wrap"}}>
        {os.sets.map((s,i)=>(
          <div key={i} style={{flex:1,minWidth:160}}>
            <button onClick={()=>setActive(active===i?null:i)} style={{width:"100%",padding:"7px 10px",borderRadius:8,cursor:"pointer",fontFamily:"sans-serif",border:`1px solid ${active===i?os.color+"55":T.b}`,background:active===i?`${os.color}15`:"rgba(14,37,68,0.5)",color:active===i?os.color:T.txt3,fontSize:10,fontWeight:active===i?700:400,textAlign:"left"}}>
              {s.title}
            </button>
            {active===i && (
              <div style={{marginTop:6,background:"rgba(5,15,30,0.85)",border:`1px solid ${os.color}25`,borderRadius:8,padding:"10px 12px"}}>
                <pre style={{fontSize:10,color:T.txt2,lineHeight:1.65,whiteSpace:"pre-wrap",fontFamily:"'JetBrains Mono',monospace",margin:0,marginBottom:8}}>{s.text}</pre>
                <button onClick={()=>copy(i,s.text)} style={{width:"100%",padding:"7px 0",borderRadius:7,cursor:"pointer",fontFamily:"sans-serif",transition:"all .2s",border:`1px solid ${copied===i?T.green+"55":os.color+"40"}`,background:copied===i?"rgba(61,255,160,0.12)":`${os.color}08`,color:copied===i?T.green:os.color,fontSize:10,fontWeight:700}}>
                  {copied===i?"\u2713 Copied":"\ud83d\udccb Copy Order Set"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══ RSI PROCEDURE NOTE GENERATOR ══════════════════════════════════ */
function RSIProcedureNote() {
  const [wt, setWt] = useState("");
  const [wtUnit, setWtUnit] = useState("kg");
  const [indication, setIndication] = useState("");
  const [preoxMethods, setPreoxMethods] = useState(["NRB 15 L/min","NC 15 L/min (apneic oxygenation)"]);
  const [preoxSpO2, setPreoxSpO2] = useState("");
  const [inductionAgent, setInductionAgent] = useState("Etomidate");
  const [paralytic, setParalytic] = useState("Succinylcholine");
  const [attempts, setAttempts] = useState("1");
  const [scope, setScope] = useState("video laryngoscopy (VL)");
  const [clGrade, setClGrade] = useState("I");
  const [adjuncts, setAdjuncts] = useState([]);
  const [ettSize, setEttSize] = useState("7.5");
  const [ettDepth, setEttDepth] = useState("23");
  const [confirmation, setConfirmation] = useState([
    "Waveform capnography (ETCO\u2082 \xd7 6 breaths)",
    "Bilateral breath sounds confirmed",
    "Symmetric chest rise",
    "CXR ordered for tube position"
  ]);
  const [complications, setComplications] = useState("None");
  const [ventTV, setVentTV] = useState("");
  const [ventRR, setVentRR] = useState("14");
  const [ventFiO2, setVentFiO2] = useState("1.0");
  const [ventPEEP, setVentPEEP] = useState("5");
  const [sedation, setSedation] = useState("Propofol + Fentanyl");
  const [addNotes, setAddNotes] = useState("");
  const [copied, setCopied] = useState(false);
  const [showNote, setShowNote] = useState(false);

  const wKg = wtUnit === "lb" ? parseFloat(wt) * 0.453592 : parseFloat(wt);
  const validWt = !isNaN(wKg) && wKg > 0;

  const IND_DOSES = { "Etomidate": 0.3, "Ketamine": 1.5, "Propofol": 1.5 };
  const PAR_DOSES = { "Succinylcholine": 1.5, "Rocuronium": 1.2 };
  const PAR_MAX   = { "Succinylcholine": 200, "Rocuronium": null };

  const calcDose = (dosePerKg, max) => {
    if (!validWt) return "[dose]";
    const d = Math.round(wKg * dosePerKg * 10) / 10;
    return (max ? Math.min(d, max) : d) + " mg";
  };

  const toggleArr = (arr, setArr, val) =>
    arr.includes(val) ? setArr(arr.filter(x => x !== val)) : setArr([...arr, val]);

  const PREOX_OPTS = [
    "NRB 15 L/min",
    "NC 15 L/min (apneic oxygenation)",
    "HFNC 60 L/min (THRIVE)",
    "BVM pre-oxygenation"
  ];
  const ADJUNCT_OPTS = [
    "External laryngeal manipulation (ELM/BURP)",
    "Bougie-assisted",
    "Stylet used",
    "Jaw thrust / head repositioning"
  ];
  const CONFIRM_OPTS = [
    "Waveform capnography (ETCO\u2082 \xd7 6 breaths)",
    "Bilateral breath sounds confirmed",
    "Symmetric chest rise",
    "CXR ordered for tube position"
  ];
  const COMP_OPTS = [
    "None",
    "Esophageal intubation \u2014 recognized and corrected",
    "Transient desaturation \u2014 recovered prior to placement",
    "Post-intubation hypotension \u2014 treated",
    "Dental trauma",
    "Oropharyngeal laceration",
    "Other \u2014 see additional notes"
  ];
  const SED_OPTS = ["Propofol + Fentanyl","Midazolam + Fentanyl","Propofol only","Fentanyl only","Ketamine + Midazolam"];

  const generateNote = () => {
    const date = new Date().toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" });
    const preoxStr = preoxMethods.length > 0 ? preoxMethods.join("; ") : "[pre-oxygenation method not documented]";
    const spO2Str = preoxSpO2 ? `SpO\u2082 ${preoxSpO2}%` : "adequate SpO\u2082";
    const adjStr = adjuncts.length > 0 ? " " + adjuncts.join("; ") + " utilized." : "";
    const confirmStr = confirmation.join("; ") + ".";
    const attStr = parseInt(attempts) === 1
      ? "Intubation was achieved on the first attempt."
      : `${attempts} attempts were required prior to successful placement.`;
    const wtNote = validWt ? ` (${wKg.toFixed(1)} kg \xd7 ${IND_DOSES[inductionAgent]} mg/kg)` : "";
    const parWtNote = validWt ? ` (${wKg.toFixed(1)} kg \xd7 ${PAR_DOSES[paralytic]} mg/kg${PAR_MAX[paralytic] ? `, max ${PAR_MAX[paralytic]} mg` : ""})` : "";
    return `PROCEDURE NOTE: Rapid Sequence Intubation (RSI)
Date: ${date}

INDICATION:
${indication || "[Document clinical indication \u2014 e.g., acute hypoxic respiratory failure, inability to protect airway, altered mental status]"}

PRE-OXYGENATION:
${preoxStr}. Pre-induction ${spO2Str} achieved prior to medication administration.

MEDICATIONS:
  Induction agent:       ${inductionAgent} ${calcDose(IND_DOSES[inductionAgent], null)}${wtNote} IV push
  Neuromuscular blockade: ${paralytic} ${calcDose(PAR_DOSES[paralytic], PAR_MAX[paralytic])}${parWtNote} IV push

PROCEDURE:
Following adequate pre-oxygenation and administration of induction and neuromuscular blocking agents, ${scope} was performed with the patient in the supine/ramped position. ${attStr} Cormack-Lehane grade ${clGrade} view was obtained.${adjStr} A ${ettSize} mm cuffed endotracheal tube was advanced to ${ettDepth} cm at the lip.

CONFIRMATION OF ENDOTRACHEAL PLACEMENT:
${confirmStr}

COMPLICATIONS:
${complications}

POST-INTUBATION MANAGEMENT:
  Ventilator settings:  TV ${ventTV || "[X]"} mL | RR ${ventRR}/min | FiO\u2082 ${ventFiO2} | PEEP ${ventPEEP} cmH\u2082O
  Sedation/analgesia:   ${sedation} initiated
  Monitoring:           Continuous SpO\u2082, waveform ETCO\u2082, hemodynamic monitoring${addNotes ? `\n\nADDITIONAL NOTES:\n${addNotes}` : ""}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateNote()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const inp = (extra = {}) => ({
    background:"rgba(14,37,68,0.7)",border:`1px solid ${T.b}`,borderRadius:8,
    padding:"8px 10px",color:T.txt,fontFamily:"monospace",fontSize:12,
    outline:"none",width:"100%",...extra
  });

  const sHd = (icon, label, color = T.txt3) => (
    <div style={{fontSize:10,fontWeight:700,color,textTransform:"uppercase",letterSpacing:".08em",marginBottom:8,display:"flex",alignItems:"center",gap:5}}>
      <span>{icon}</span>{label}
    </div>
  );

  const togBtn = (val, active, onClick, color = T.gold) => (
    <button key={val} onClick={onClick} style={{
      padding:"5px 11px",borderRadius:20,cursor:"pointer",fontFamily:"sans-serif",transition:"all .15s",
      border:`1px solid ${active ? color + "55" : T.b}`,
      background:active ? color + "14" : "rgba(14,37,68,0.5)",
      color:active ? color : T.txt3,fontSize:10,fontWeight:active ? 700 : 400,
    }}>{val}</button>
  );

  const section = (children) => (
    <div style={{background:"rgba(14,37,68,0.4)",border:`1px solid ${T.b}`,borderRadius:10,padding:"12px 14px",marginBottom:10}}>
      {children}
    </div>
  );

  return (
    <div>
      {/* Weight */}
      <div style={{background:"rgba(245,200,66,0.05)",border:"1px solid rgba(245,200,66,0.2)",borderRadius:10,padding:"12px 14px",marginBottom:10}}>
        {sHd("\u2696\ufe0f","Patient Weight \u2014 Auto-Calculates All Doses",T.gold)}
        <div style={{display:"flex",gap:8,marginBottom:validWt ? 10 : 0}}>
          <input type="number" placeholder="Weight\u2026" value={wt} onChange={e=>setWt(e.target.value)} style={inp({flex:1,border:"1px solid rgba(245,200,66,0.3)"})} />
          <div style={{display:"flex",borderRadius:8,overflow:"hidden",border:`1px solid ${T.b}`,flexShrink:0}}>
            {["kg","lb"].map(u=>(
              <button key={u} onClick={()=>setWtUnit(u)} style={{padding:"8px 14px",cursor:"pointer",border:"none",background:wtUnit===u?"rgba(245,200,66,0.2)":"rgba(14,37,68,0.5)",color:wtUnit===u?T.gold:T.txt3,fontSize:11,fontWeight:700,fontFamily:"sans-serif"}}>{u}</button>
            ))}
          </div>
        </div>
        {validWt && (
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {[
              {label:"Etomidate 0.3",d:0.3,mx:null,c:T.gold},
              {label:"Ketamine 1.5",d:1.5,mx:null,c:T.orange},
              {label:"Succinylcholine 1.5",d:1.5,mx:200,c:T.coral},
              {label:"Rocuronium 1.2",d:1.2,mx:null,c:T.purple},
              {label:"Sugammadex 16 (CICO)",d:16,mx:null,c:T.green},
            ].map(({label,d,mx,c})=>(
              <div key={label} style={{fontSize:10,padding:"3px 9px",borderRadius:6,background:c+"12",border:`1px solid ${c}30`,color:c}}>
                {label}: <strong style={{fontFamily:"monospace"}}>{calcDose(d,mx)}</strong>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Indication */}
      {section(<>
        {sHd("\ud83c\udfe5","Indication for Intubation")}
        <textarea rows={2} placeholder="e.g., Acute hypoxic respiratory failure secondary to severe community-acquired pneumonia with inability to maintain adequate oxygenation on maximal non-invasive support" value={indication} onChange={e=>setIndication(e.target.value)} style={{...inp(),resize:"vertical"}} />
      </>)}

      {/* Pre-oxygenation */}
      {section(<>
        {sHd("\ud83e\fde1","Pre-Oxygenation")}
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
          {PREOX_OPTS.map(v=>togBtn(v, preoxMethods.includes(v), ()=>toggleArr(preoxMethods,setPreoxMethods,v), T.blue))}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:11,color:T.txt3,whiteSpace:"nowrap"}}>Pre-induction SpO\u2082 achieved:</span>
          <input type="number" placeholder="e.g. 97" value={preoxSpO2} onChange={e=>setPreoxSpO2(e.target.value)} style={{...inp(),width:72}} />
          <span style={{fontSize:11,color:T.txt3}}>%</span>
        </div>
      </>)}

      {/* Medications */}
      {section(<>
        {sHd("\ud83d\udc89","Medications")}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div>
            <div style={{fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>Induction Agent</div>
            {["Etomidate","Ketamine","Propofol"].map(a=>(
              <button key={a} onClick={()=>setInductionAgent(a)} style={{width:"100%",marginBottom:4,padding:"7px 12px",borderRadius:8,cursor:"pointer",fontFamily:"sans-serif",border:`1px solid ${inductionAgent===a?T.gold+"50":T.b}`,background:inductionAgent===a?"rgba(245,200,66,0.12)":"rgba(14,37,68,0.5)",color:inductionAgent===a?T.gold:T.txt3,fontSize:11,fontWeight:inductionAgent===a?700:400,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span>{a}</span>
                <span style={{fontFamily:"monospace",fontSize:10}}>{validWt ? calcDose(IND_DOSES[a],null) : IND_DOSES[a]+" mg/kg"}</span>
              </button>
            ))}
          </div>
          <div>
            <div style={{fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>Paralytic</div>
            {["Succinylcholine","Rocuronium"].map(p=>(
              <button key={p} onClick={()=>setParalytic(p)} style={{width:"100%",marginBottom:4,padding:"7px 12px",borderRadius:8,cursor:"pointer",fontFamily:"sans-serif",border:`1px solid ${paralytic===p?T.coral+"50":T.b}`,background:paralytic===p?"rgba(255,107,107,0.12)":"rgba(14,37,68,0.5)",color:paralytic===p?T.coral:T.txt3,fontSize:11,fontWeight:paralytic===p?700:400,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span>{p}</span>
                <span style={{fontFamily:"monospace",fontSize:10}}>{validWt ? calcDose(PAR_DOSES[p],PAR_MAX[p]) : PAR_DOSES[p]+" mg/kg"}</span>
              </button>
            ))}
          </div>
        </div>
      </>)}

      {/* Procedure Details */}
      {section(<>
        {sHd("\ud83d\udd26","Procedure Details")}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
          <div>
            <div style={{fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>Laryngoscopy Type</div>
            {[["video laryngoscopy (VL)","Video laryngoscopy (VL)"],["direct laryngoscopy (DL)","Direct laryngoscopy (DL)"],["video laryngoscopy (VL) with hyperangulated blade","VL \u2014 Hyperangulated blade"]].map(([val,lbl])=>(
              <button key={val} onClick={()=>setScope(val)} style={{width:"100%",marginBottom:4,padding:"6px 10px",borderRadius:8,cursor:"pointer",fontFamily:"sans-serif",border:`1px solid ${scope===val?T.teal+"50":T.b}`,background:scope===val?"rgba(0,229,192,0.1)":"rgba(14,37,68,0.5)",color:scope===val?T.teal:T.txt3,fontSize:10,fontWeight:scope===val?700:400,textAlign:"left"}}>{lbl}</button>
            ))}
          </div>
          <div>
            <div style={{fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>C-L Grade</div>
            <div style={{display:"flex",gap:4,marginBottom:10,flexWrap:"wrap"}}>
              {["I","II","IIb","III","IV"].map(g=>(
                <button key={g} onClick={()=>setClGrade(g)} style={{width:36,height:36,borderRadius:8,cursor:"pointer",fontFamily:"monospace",border:`1px solid ${clGrade===g?T.teal+"55":T.b}`,background:clGrade===g?"rgba(0,229,192,0.15)":"rgba(14,37,68,0.5)",color:clGrade===g?T.teal:T.txt3,fontSize:11,fontWeight:700}}>{g}</button>
              ))}
            </div>
            <div style={{fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>Attempts</div>
            <div style={{display:"flex",gap:4}}>
              {["1","2","3"].map(n=>(
                <button key={n} onClick={()=>setAttempts(n)} style={{width:36,height:36,borderRadius:8,cursor:"pointer",fontFamily:"monospace",border:`1px solid ${attempts===n?(n==="3"?T.coral+"55":T.gold+"55"):T.b}`,background:attempts===n?(n==="3"?"rgba(255,107,107,0.15)":"rgba(245,200,66,0.15)"):"rgba(14,37,68,0.5)",color:attempts===n?(n==="3"?T.coral:T.gold):T.txt3,fontSize:13,fontWeight:700}}>{n}</button>
              ))}
            </div>
          </div>
        </div>
        <div style={{fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>Adjuncts Used</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {ADJUNCT_OPTS.map(v=>togBtn(v, adjuncts.includes(v), ()=>toggleArr(adjuncts,setAdjuncts,v), T.teal))}
        </div>
      </>)}

      {/* ETT */}
      {section(<>
        {sHd("\ud83e\ude7a","Endotracheal Tube")}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div>
            <div style={{fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>ETT Size (mm)</div>
            <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
              {["6.0","6.5","7.0","7.5","8.0","8.5"].map(s=>(
                <button key={s} onClick={()=>setEttSize(s)} style={{padding:"5px 10px",borderRadius:7,cursor:"pointer",fontFamily:"monospace",border:`1px solid ${ettSize===s?T.blue+"55":T.b}`,background:ettSize===s?"rgba(59,158,255,0.15)":"rgba(14,37,68,0.5)",color:ettSize===s?T.blue:T.txt3,fontSize:11,fontWeight:700}}>{s}</button>
              ))}
            </div>
          </div>
          <div>
            <div style={{fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>Depth at Lip (cm)</div>
            <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
              {["20","21","22","23","24","25","26"].map(d=>(
                <button key={d} onClick={()=>setEttDepth(d)} style={{padding:"5px 10px",borderRadius:7,cursor:"pointer",fontFamily:"monospace",border:`1px solid ${ettDepth===d?T.blue+"55":T.b}`,background:ettDepth===d?"rgba(59,158,255,0.15)":"rgba(14,37,68,0.5)",color:ettDepth===d?T.blue:T.txt3,fontSize:11,fontWeight:700}}>{d}</button>
              ))}
            </div>
          </div>
        </div>
      </>)}

      {/* Confirmation */}
      {section(<>
        {sHd("\u2705","Tube Confirmation Methods")}
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {CONFIRM_OPTS.map(v=>togBtn(v, confirmation.includes(v), ()=>toggleArr(confirmation,setConfirmation,v), T.teal))}
        </div>
      </>)}

      {/* Complications */}
      {section(<>
        {sHd("\u26a0\ufe0f","Complications")}
        <div style={{display:"flex",flexDirection:"column",gap:4}}>
          {COMP_OPTS.map(c=>(
            <button key={c} onClick={()=>setComplications(c)} style={{padding:"7px 12px",borderRadius:8,cursor:"pointer",fontFamily:"sans-serif",textAlign:"left",border:`1px solid ${complications===c?(c==="None"?T.green+"45":T.coral+"45"):T.b}`,background:complications===c?(c==="None"?"rgba(61,255,160,0.09)":"rgba(255,107,107,0.09)"):"rgba(14,37,68,0.5)",color:complications===c?(c==="None"?T.green:T.coral):T.txt3,fontSize:11,fontWeight:complications===c?700:400}}>{c}</button>
          ))}
        </div>
      </>)}

      {/* Post-intubation Vent */}
      {section(<>
        {sHd("\u2699\ufe0f","Post-Intubation Ventilator Settings")}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,marginBottom:10}}>
          {[["TV (mL)",ventTV,setVentTV,"e.g. 420"],["RR (/min)",ventRR,setVentRR,"14"],["FiO\u2082",ventFiO2,setVentFiO2,"1.0"],["PEEP (cmH\u2082O)",ventPEEP,setVentPEEP,"5"]].map(([lbl,val,setter,ph])=>(
            <div key={lbl}>
              <div style={{fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:".05em",marginBottom:4}}>{lbl}</div>
              <input type="number" placeholder={ph} value={val} onChange={e=>setter(e.target.value)} style={inp()} />
            </div>
          ))}
        </div>
        <div style={{fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>Sedation / Analgesia Initiated</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {SED_OPTS.map(s=>togBtn(s, sedation===s, ()=>setSedation(s), T.purple))}
        </div>
      </>)}

      {/* Additional Notes */}
      {section(<>
        {sHd("\ud83d\udcdd","Additional Notes")}
        <textarea rows={2} placeholder="Difficult airway concerns for future providers, family communication, planned trach timeline, equipment notes, operator name..." value={addNotes} onChange={e=>setAddNotes(e.target.value)} style={{...inp(),resize:"vertical"}} />
      </>)}

      {/* Action Buttons */}
      <div style={{display:"flex",gap:8,marginBottom:10}}>
        <button onClick={()=>setShowNote(!showNote)} style={{flex:1,padding:"11px 0",borderRadius:9,cursor:"pointer",fontFamily:"sans-serif",border:"1px solid rgba(245,200,66,0.35)",background:"rgba(245,200,66,0.08)",color:T.gold,fontSize:12,fontWeight:700}}>
          {showNote ? "\u25b2 Hide Preview" : "\u25bc Preview Note"}
        </button>
        <button onClick={handleCopy} style={{flex:1,padding:"11px 0",borderRadius:9,cursor:"pointer",fontFamily:"sans-serif",transition:"all .2s",border:`1px solid ${copied?T.green+"55":"rgba(0,229,192,0.35)"}`,background:copied?"rgba(61,255,160,0.12)":"rgba(0,229,192,0.08)",color:copied?T.green:T.teal,fontSize:12,fontWeight:700}}>
          {copied ? "\u2713 Copied to Clipboard" : "\ud83d\udccb Copy Procedure Note"}
        </button>
      </div>

      {/* Note Preview */}
      {showNote && (
        <div style={{background:"rgba(5,15,30,0.85)",border:"1px solid rgba(245,200,66,0.2)",borderRadius:10,padding:"14px 16px"}}>
          <div style={{fontSize:9,fontWeight:700,color:T.gold,textTransform:"uppercase",letterSpacing:".08em",marginBottom:10}}>Generated Procedure Note \u2014 Ready to Paste</div>
          <pre style={{fontSize:11,color:T.txt2,lineHeight:1.75,whiteSpace:"pre-wrap",fontFamily:"'JetBrains Mono',monospace",margin:0}}>{generateNote()}</pre>
        </div>
      )}
    </div>
  );
}

/* ═══ DRUG ROW ══════════════════════════════════════════════════════ */
function DrugRow({ rx }) {
  const [open, setOpen] = useState(null);
  const panels = [
    {k:"renal", icon:"\ud83d\udccb", label:"Details / Dosing", color:T.blue},
    {k:"ivpo",  icon:"\ud83d\udd27", label:"Alternative / Setup", color:T.teal},
    {k:"deesc", icon:"\ud83d\udcc9", label:"Monitoring / Step-Down", color:T.green},
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
          <button key={p.k} onClick={()=>setOpen(open===p.k?null:p.k)} style={{flex:1,padding:"6px 4px",border:"none",borderRight:i<arr.length-1?`1px solid ${T.b}`:"none",background:open===p.k?`${p.color}12`:"transparent",color:open===p.k?p.color:T.txt4,fontSize:10,fontWeight:open===p.k?700:500,cursor:"pointer",transition:"all .18s",fontFamily:"sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
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
  const [cicoOpen, setCicoOpen] = useState(false);
  const ov = OVERVIEW[cond.id] || {};
  const rx = TREATMENT[cond.id] || [];
  const wu = WORKUP[cond.id] || [];
  const fu = FOLLOWUP[cond.id] || [];

  const tabs = [
    {id:"overview",  label:"Overview",  icon:"\ud83d\udccb"},
    {id:"workup",    label:"Workup",    icon:"\u2705"},
    {id:"treatment", label:"Protocol",  icon:"\u2699\ufe0f"},
    {id:"followup",  label:"Follow-up", icon:"\ud83d\udcc5"},
    ...(cond.id === "rsi" ? [{id:"procnote", label:"Proc Note", icon:"\ud83d\udcdd"}] : []),
  ];

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <div style={{padding:"14px 20px 0",flexShrink:0}}>
        <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:6,background:"rgba(14,37,68,0.5)",border:`1px solid ${T.b}`,borderRadius:7,padding:"5px 12px",color:T.txt3,fontSize:11,cursor:"pointer",fontFamily:"sans-serif",marginBottom:12}}>
          \u2190 Back
        </button>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
          <div style={{width:44,height:44,borderRadius:12,background:cond.gl,border:`1px solid ${cond.br}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{cond.icon}</div>
          <div>
            <div style={{fontSize:16,fontWeight:700,color:T.txt,fontFamily:"'Playfair Display',serif"}}>{cond.title}</div>
            <div style={{fontSize:11,color:T.txt3}}>{cond.sub}</div>
          </div>
          <span style={{marginLeft:"auto",fontSize:9,fontFamily:"monospace",padding:"2px 8px",borderRadius:20,background:cond.gl,border:`1px solid ${cond.br}`,color:cond.color,fontWeight:700}}>{cond.cat.toUpperCase()}</span>
          {cond.id==="daw" && <button onClick={()=>setCicoOpen(true)} style={{flexShrink:0,padding:"5px 12px",borderRadius:8,border:"1px solid rgba(255,107,107,0.5)",background:"rgba(255,107,107,0.12)",color:T.coral,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"sans-serif"}}>🚨 CICO Mode</button>}
        </div>
        <div style={{display:"flex",gap:4,borderBottom:`1px solid ${T.b}`,overflowX:"auto"}}>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"6px 14px",border:"none",borderBottom:tab===t.id?`2px solid ${cond.color}`:"2px solid transparent",background:"transparent",color:tab===t.id?T.txt:T.txt3,fontSize:11,fontWeight:tab===t.id?700:400,cursor:"pointer",fontFamily:"sans-serif",display:"flex",alignItems:"center",gap:5,transition:"all .18s",marginBottom:-1,whiteSpace:"nowrap"}}>
              <span>{t.icon}</span>{t.label}
              {t.id === "procnote" && <span style={{fontSize:8,background:"rgba(245,200,66,0.2)",border:"1px solid rgba(245,200,66,0.4)",color:T.gold,borderRadius:10,padding:"1px 5px",fontFamily:"monospace",fontWeight:700}}>NEW</span>}
            </button>
          ))}
        </div>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"16px 20px 24px"}}>
        {cicoOpen && <CICOMode onClose={()=>setCicoOpen(false)} />}

        {tab==="overview" && (
          <div>
            <div style={{background:"rgba(14,37,68,0.5)",border:`1px solid ${cond.br}`,borderLeft:`3px solid ${cond.color}`,borderRadius:8,padding:"12px 14px",marginBottom:14,fontSize:12,color:T.txt2,lineHeight:1.7}}>{ov.def}</div>
            {ov.bullets?.map((b,i)=>(
              <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"7px 0",borderBottom:i<ov.bullets.length-1?"1px solid rgba(26,53,85,0.4)":"none"}}>
                <div style={{width:16,height:16,borderRadius:4,background:cond.gl,border:`1px solid ${cond.br}`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:cond.color,marginTop:1}}>\u25aa</div>
                <div style={{fontSize:12,color:T.txt2,lineHeight:1.55}}>{b}</div>
              </div>
            ))}
            {cond.id==="rsi"  && <div style={{marginTop:16}}><div style={{fontSize:11,fontWeight:700,color:T.txt3,textTransform:"uppercase",letterSpacing:".07em",marginBottom:10}}>RSI Drug Calculator</div><RSICalc /></div>}
            {cond.id==="ards" && <div style={{marginTop:16}}><div style={{fontSize:11,fontWeight:700,color:T.txt3,textTransform:"uppercase",letterSpacing:".07em",marginBottom:10}}>ARDSNet Calculator</div><ARDSCalc /></div>}
            {(cond.id==="ards"||cond.id==="vent") && <div style={{marginTop:16}}><div style={{fontSize:11,fontWeight:700,color:T.txt3,textTransform:"uppercase",letterSpacing:".07em",marginBottom:10}}>Vent Settings Checker</div><VentChecker /></div>}
            {cond.id==="hfnc" && <div style={{marginTop:16}}><div style={{fontSize:11,fontWeight:700,color:T.txt3,textTransform:"uppercase",letterSpacing:".07em",marginBottom:10}}>ROX Index Calculator</div><ROXCalc /></div>}
            {cond.id==="hfnc" && <div style={{marginTop:12}}><div style={{fontSize:11,fontWeight:700,color:T.txt3,textTransform:"uppercase",letterSpacing:".07em",marginBottom:10}}>HFNC Trial Tracker</div><HFNCTracker /></div>}
            {cond.id==="wean" && <div style={{marginTop:16}}><div style={{fontSize:11,fontWeight:700,color:T.txt3,textTransform:"uppercase",letterSpacing:".07em",marginBottom:10}}>RSBI Calculator</div><RSBICalc /></div>}
            {(cond.id==="rsi"||cond.id==="wean") && <div style={{marginTop:12}}><AirwayTimers /></div>}
            <QuickRefCard condId={cond.id} />
          </div>
        )}

        {tab==="workup" && (
          <div>
            {wu.map((item,i)=>(
              <div key={i} onClick={()=>setChecked(p=>({...p,[i]:!p[i]}))} style={{display:"flex",gap:12,alignItems:"flex-start",background:checked[i]?"rgba(0,229,192,0.07)":"rgba(14,37,68,0.4)",border:`1px solid ${checked[i]?"rgba(0,229,192,0.3)":T.b}`,borderRadius:9,padding:"11px 14px",marginBottom:8,cursor:"pointer",transition:"all .18s"}}>
                <div style={{width:32,height:32,borderRadius:8,background:checked[i]?"rgba(0,229,192,0.15)":"rgba(14,37,68,0.6)",border:`1px solid ${checked[i]?"rgba(0,229,192,0.5)":T.b}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{checked[i]?"\u2713":item.icon}</div>
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
            <OrderSetPanel condId={cond.id} />
            {rx.length > 0 ? (
              <>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
                  {["Details","Alternative / Setup","Monitoring / Step-Down"].map(l=>(
                    <span key={l} style={{fontSize:9,padding:"3px 9px",borderRadius:20,background:"rgba(14,37,68,0.6)",border:`1px solid ${T.b}`,color:T.txt3,fontFamily:"monospace"}}>
                      {l==="Details"?"\ud83d\udccb":l==="Alternative / Setup"?"\ud83d\udd27":"\ud83d\udcc9"} Tap to expand: {l}
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
                <span style={{color:T.purple,fontWeight:700,marginRight:6}}>\ud83d\udcda</span>{REFS[cond.id]}
              </div>
            )}
            <MDMSnippet condId={cond.id} />
            {cond.id==="daw" && <div style={{marginTop:10}}><DiffAirwayAlert /></div>}
          </div>
        )}

        {tab==="procnote" && cond.id==="rsi" && (
          <div>
            <div style={{background:"rgba(245,200,66,0.06)",border:"1px solid rgba(245,200,66,0.2)",borderRadius:8,padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:16}}>\ud83d\udcdd</span>
              <div>
                <div style={{fontSize:11,fontWeight:700,color:T.gold}}>RSI Procedure Note Generator</div>
                <div style={{fontSize:10,color:T.txt3}}>Fill in the fields below \u2014 a fully formatted procedure note is generated and ready to copy into your EMR.</div>
              </div>
            </div>
            <RSIProcedureNote />
          </div>
        )}

      </div>
    </div>
  );
}

/* ═══ AIRWAY BANNER ═════════════════════════════════════════════════ */
function AirwayBanner() {
  const targets = [
    {icon:"\u23f1",label:"Pre-oxygenation",target:"\u22653 minutes",color:T.gold},
    {icon:"\ud83c\udfaf",label:"Intubation attempts",target:"\u22643 total",color:T.coral},
    {icon:"\ud83d\udcca",label:"ETCO\u2082 confirm",target:"Waveform only",color:T.teal},
    {icon:"\ud83d\udca4",label:"Sedation RASS target",target:"-1 to 0",color:T.blue},
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
  }

  return (
    <div style={{height:"100vh",background:T.bg,color:T.txt,fontFamily:"'DM Sans',sans-serif",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(26,53,85,0.9);border-radius:2px}input,button,textarea{font-family:inherit}`}</style>

      <div style={{background:T.panel,borderBottom:`1px solid ${T.b}`,padding:"14px 20px",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
          <button onClick={()=>navigate("/hub")} style={{display:"flex",alignItems:"center",gap:6,background:"rgba(8,22,40,0.7)",border:"1px solid rgba(59,158,255,0.3)",borderRadius:8,padding:"5px 12px",color:T.blue,fontSize:11,fontWeight:700,cursor:"pointer",flexShrink:0}}>\u2190 Hub</button>
          <div style={{width:40,height:40,borderRadius:11,background:"rgba(59,158,255,0.12)",border:"1px solid rgba(59,158,255,0.35)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>\ud83c\udf2c\ufe0f</div>
          <div>
            <div style={{fontSize:18,fontWeight:700,color:T.txt,fontFamily:"'Playfair Display',serif",lineHeight:1.2}}>Airway Hub</div>
            <div style={{fontSize:10,color:T.txt3}}>RSI \xb7 Difficult Airway \xb7 HFNC \xb7 CPAP \xb7 BiPAP \xb7 ARDSNet \xb7 Vent Management \xb7 Weaning</div>
          </div>
          <div style={{marginLeft:"auto",display:"flex",gap:6,flexShrink:0,flexWrap:"wrap"}}>
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
              <div style={{display:"flex",gap:6,flexWrap:"wrap",fontSize:9,color:T.txt3}}>
                {TREATMENT[c.id]?.length>0 && <span style={{padding:"2px 7px",borderRadius:20,background:"rgba(0,229,192,0.08)",border:"1px solid rgba(0,229,192,0.2)",color:T.teal}}>\u2699\ufe0f {TREATMENT[c.id].length} protocol steps</span>}
                {WORKUP[c.id]?.length>0 && <span style={{padding:"2px 7px",borderRadius:20,background:"rgba(59,158,255,0.08)",border:"1px solid rgba(59,158,255,0.2)",color:T.blue}}>\u2705 {WORKUP[c.id].length} workup items</span>}
                {["rsi","ards","hfnc","wean"].includes(c.id) && <span style={{padding:"2px 7px",borderRadius:20,background:"rgba(245,200,66,0.08)",border:"1px solid rgba(245,200,66,0.2)",color:T.gold}}>\ud83e\uddee Interactive calc</span>}
                {c.id==="rsi" && <span style={{padding:"2px 7px",borderRadius:20,background:"rgba(245,200,66,0.12)",border:"1px solid rgba(245,200,66,0.35)",color:T.gold,fontWeight:700}}>\ud83d\udcdd Proc Note</span>}
              </div>
            </div>
          ))}
        </div>
        <div style={{marginTop:20,padding:"12px 16px",background:"rgba(14,37,68,0.4)",border:`1px solid ${T.b}`,borderRadius:10,display:"flex",gap:16,flexWrap:"wrap",alignItems:"center"}}>
          <span style={{fontSize:9,fontWeight:700,color:T.txt4,textTransform:"uppercase",letterSpacing:".07em",flexShrink:0}}>Evidence Base</span>
          {["DAS Airway Guidelines 2022","ARDSNet NEJM 2000","PROSEVA NEJM 2013","FLORALI NEJM 2015","BTS O\u2082 Guideline 2017","PADIS Guidelines 2018","ABC Trial NEJM 2008","Yang & Tobin RSBI NEJM 1991"].map(e=>(
            <span key={e} style={{fontSize:9,color:T.txt4,fontFamily:"monospace"}}>{e}</span>
          ))}
        </div>
      </div>
    </div>
  );
}