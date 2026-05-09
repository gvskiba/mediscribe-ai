import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const T = {
  bg:"#050f1e",panel:"#081628",card:"#0b1e36",up:"#0e2544",b:"rgba(26,53,85,0.8)",
  txt:"#e8f0fe",txt2:"#8aaccc",txt3:"#4a6a8a",txt4:"#2e4a6a",
  coral:"#ff6b6b",gold:"#f5c842",teal:"#00e5c0",blue:"#3b9eff",
  orange:"#ff9f43",purple:"#9b6dff",green:"#3dffa0",cyan:"#00d4ff",
};

const CONDITIONS = [
  {id:"ards",icon:"\ud83e\udea8",title:"ARDS / ARDSNet",sub:"Berlin Criteria \xb7 6 mL/kg IBW \xb7 Prone \xb7 Recruitment",color:"#ff6b6b",gl:"rgba(255,107,107,0.07)",br:"rgba(255,107,107,0.28)"},
  {id:"vent",icon:"\u2699\ufe0f",title:"Ventilator Management",sub:"Modes \xb7 Alarms \xb7 Hemodynamics \xb7 Troubleshooting",color:"#f5c842",gl:"rgba(245,200,66,0.07)",br:"rgba(245,200,66,0.28)"},
  {id:"wean",icon:"\ud83d\udcca",title:"Weaning & Liberation",sub:"SAT \xb7 SBT \xb7 RSBI \xb7 Extubation Criteria \xb7 Cuff Leak",color:"#3dffa0",gl:"rgba(61,255,160,0.07)",br:"rgba(61,255,160,0.28)"},
];

const OVERVIEW = {
  ards:{def:"Acute Respiratory Distress Syndrome (ARDS): acute bilateral lung injury causing inflammatory pulmonary edema with refractory hypoxemia. Berlin Definition: acute onset \u22641 week, bilateral infiltrates on CXR/CT, P/F ratio <300 on PEEP \u22655 cmH\u2082O (mild 200\u2013300, moderate 100\u2013200, severe <100), not fully explained by cardiac failure. ARDSNet trial established 6 mL/kg IBW as standard of care, reducing mortality by 22%.",bullets:["ARDSNet protocol: TV 6 mL/kg IBW (NOT actual body weight) \xb7 Pplat <30 cmH\u2082O \xb7 pH 7.30\u20137.45","PEEP/FiO\u2082 table (ARDSNet) \u2014 start combination based on FiO\u2082 and titrate to SpO\u2082 88\u201395%","Prone positioning \u226516h/day in severe ARDS (P/F <150): reduces mortality by 16% (PROSEVA 2013)","Neuromuscular blockade (cisatracurium 48h) for P/F <150 in first 48h (ACURASYS trial)","Conservative fluid strategy after initial resuscitation: target CVP 4\u20138 and PCWP 8\u201312"]},
  vent:{def:"Mechanical ventilation management requires continuous assessment of oxygenation, ventilation, hemodynamics, and patient-ventilator synchrony. Volume Control A/C is the most common initial mode in the ED and ICU. Pressure Support (PSV) is used during weaning. Recognizing and addressing alarms, auto-PEEP, patient-ventilator dyssynchrony, and hemodynamic compromise is essential for safe ventilator management.",bullets:["Initial settings: mode VC-A/C, TV 6\u20138 mL/kg IBW, RR 14\u201316, FiO\u2082 1.0, PEEP 5","Monitor: Ppeak <35, Pplat <30, auto-PEEP (expiratory hold), RR, SpO\u2082, VTe, ETCO\u2082","High peak pressure: assess ET tube obstruction, secretions, bronchospasm, tension PTX","High Pplat (>30): lung overdistension \u2192 reduce TV by 1 mL/kg increments to minimum 4 mL/kg IBW","Patient-ventilator dyssynchrony: sedation, adjust trigger sensitivity, change mode or rate"]},
  wean:{def:"Ventilator liberation (weaning and extubation) should be assessed daily. Spontaneous Awakening Trial (SAT) + Spontaneous Breathing Trial (SBT) pairing (ABC trial) reduces ICU LOS, mechanical ventilation duration, and mortality. Extubation failure rate should be <15%; rates >25% suggest premature extubation.",bullets:["SAT: turn off sedation daily. Failure: SpO\u2082 <88%, RR >35, agitation, hemodynamic instability","SBT: PSV 5/5 OR T-piece for 30\u2013120 min. Pass = tolerated, plan extubation today.","RSBI (f/VT): <105 predicts SBT success \xb7 >105 = high failure risk","Cuff leak test: if absent \u2192 consider dexamethasone 4 mg IV q6h \xd74 doses before extubation (reduce post-extubation stridor)","Extubation criteria: SAT passed, SBT passed, able to follow commands, cough/gag intact, secretions manageable, RSBI <105"]},
};

const WORKUP = {
  ards:[{icon:"\ud83e\udde0",label:"Berlin ARDS Criteria",detail:"1) Acute onset \u22641 week of known insult 2) Bilateral infiltrates on CXR/CT not explained by effusion/collapse 3) Respiratory failure not explained by cardiac or fluid overload 4) P/F <300 on PEEP \u22655."},{icon:"\ud83e\udd14",label:"ARDS Trigger Identification",detail:"Pulmonary: pneumonia (most common), aspiration, inhalation injury.\nExtrapulmonary: sepsis, pancreatitis, massive transfusion, trauma."},{icon:"\ud83e\udda5",label:"ABG + P/F Ratio",detail:"P/F = PaO\u2082/FiO\u2082. Severe: <100, Moderate: 100\u2013200, Mild: 200\u2013300. Classify severity to guide prone/NMB."},{icon:"\ud83d\udcca",label:"Plateau Pressure",detail:"Perform inspiratory hold after intubation. Pplat >30 \u2192 reduce TV by 1 mL/kg IBW increments. Driving pressure = Pplat - PEEP \u2014 target \u226413 cmH\u2082O."},{icon:"\ud83d\udd27",label:"Auto-PEEP Assessment",detail:"Expiratory hold in A/C mode. Auto-PEEP present if Pexp baseline > set PEEP. Common in obstructive physiology. Reduce RR or inspiratory time."}],
  vent:[{icon:"\u26a0\ufe0f",label:"High Peak Pressure Alarm",detail:"Ppeak > set threshold. Assess ET tube: suction/reposition. Bronchospasm \u2192 nebulized albuterol. Tension PTX \u2192 needle decompression. Auto-PEEP: disconnect, reduce RR."},{icon:"\ud83d\udcca",label:"Auto-PEEP Assessment",detail:"Expiratory pause \u2192 measure intrinsic PEEP. If significant: increase expiratory time (lower RR, increase I:E ratio), treat obstructive physiology."},{icon:"\ud83d\udca8",label:"Patient-Ventilator Synchrony",detail:"Double-triggering (large TV): reduce set TV or increase RR.\nReverse triggering: reduce sedation depth or paralysis.\nDyssynchrony \u2192 titrate sedation, consider PRVC or pressure control mode."},{icon:"\u2764\ufe0f",label:"Hemodynamic Assessment",detail:"Positive pressure \u2191 intrathoracic pressure \u2192 reduces RV preload. Volume-sensitive: assess for auto-PEEP, high PEEP, high TV. POCUS to assess RV size and function."},{icon:"\ud83d\udc8a",label:"ETT Cuff Pressure",detail:"Target 20\u201330 cmH\u2082O. Check every 8h with manometer. Overinflation \u2192 tracheal mucosal ischemia. Underinflation \u2192 aspiration + air leak around cuff."}],
  wean:[{icon:"\u2705",label:"SAT Eligibility",detail:"NOT on FiO\u2082 >0.5 \xb7 NOT on high PEEP >8 \xb7 NOT actively seizing \xb7 NOT elevated ICP \xb7 NOT agitation requiring continuous sedation."},{icon:"\ud83d\udcca",label:"SBT Eligibility",detail:"FiO\u2082 \u22640.5 \xb7 PEEP \u22648 \xb7 RR <30 \xb7 TV >5 mL/kg \xb7 P/F >150 \xb7 Hemodynamically stable (MAP >65, HR <120 off or low vasopressors)."},{icon:"\ud83e\udd14",label:"RSBI",detail:"RSBI = Respiratory Rate (spontaneous) / TV (in liters). <105 predicts extubation success. >105 = likely failure. Measure after 1\u20133 min spontaneous breathing."},{icon:"\ud83d\udde3\ufe0f",label:"Extubation Readiness",detail:"SAT passed \xb7 SBT passed 30\u2013120 min \xb7 Able to follow commands \xb7 Cough/gag \xb7 Secretions <q2h \xb7 Tolerates PEEP 5, PS 5, FiO\u2082 0.4."}],
};

const TREATMENT = {
  ards:[
    {cat:"ARDSNet Lung Protective Ventilation",drug:"Volume Control \u2014 Low Tidal Volume",dose:"TV: 6 mL/kg IBW (men: IBW = 50+2.3\xd7(ht-60in) \xb7 women: 45.5+2.3\xd7(ht-60in))\nPplat target: <30 cmH\u2082O (mandatory)\nRR: up to 35/min to maintain pH 7.30\u20137.45\nFiO\u2082/PEEP: titrate from ARDSNet table (see calculator below)\nPermissive hypercapnia: pH >7.25 acceptable (renal compensation)",renal:"N/A",ivpo:"If Pplat >30: reduce TV by 1 mL/kg to minimum 4 mL/kg IBW. May need to accept higher pCO\u2082.",deesc:"Wean FiO\u2082 first to 0.4\u20130.5, then PEEP by 2\u20133 cmH\u2082O increments when SpO\u2082 >95%.",note:"IBW-based dosing only. TV based on actual weight will overdistend lungs in obese patients.",ref:"ARDSNet NEJM 2000"},
    {cat:"PEEP Titration",drug:"ARDSNet FiO\u2082/PEEP Table",dose:"Lower PEEP strategy (recommended for moderate ARDS):\nFiO\u2082: 0.3  0.4  0.4  0.5  0.5  0.6  0.7  0.7\nPEEP:   5    5    8    8   10   10   10   12\nFiO\u2082: 0.7  0.8  0.9  0.9  0.9  1.0  1.0  1.0\nPEEP:  14   14   14   16   18   20   22   24",renal:"N/A",ivpo:"Higher PEEP strategy in severe ARDS (P/F <200): start FiO\u2082 0.3, PEEP 12\u201416.",deesc:"Target SpO\u2082 88\u201395% (permissive hypoxemia). Avoid FiO\u2082 1.0 longer than necessary.",note:"Higher PEEP may worsen oxygenation in non-recruitable ARDS (emphysema). PEEP titration trial.",ref:"ARDSNet ARMA 2000"},
    {cat:"Prone Positioning",drug:"Prone \u226516 hours/day",dose:"Indication: P/F ratio <150 on FiO\u2082 \u22650.6, PEEP \u226510, Pplat \u226430\nRequires: 3\u20135 staff, proning team\nDuration: \u226516h/day (PROSEVA protocol)\nProne position: head-down 10\u201315\u00b0, bilateral arm forward\nContraindications: unstable spine, facial/thoracic surgery <2 weeks, open abdomen",renal:"N/A",ivpo:"Post-prone: maintain prone for full duration. Return to supine if SpO\u2082 worsens acutely.",deesc:"Stop proning when P/F >150 for >4h in supine position \xd72 consecutive proning sessions.",note:"PROSEVA 2013: 28-day mortality 16% vs 33% in P/F <150 (NNT ~5). Strongest intervention in ARDS.",ref:"PROSEVA NEJM 2013"},
    {cat:"NMB (Neuromuscular Blockade)",drug:"Cisatracurium infusion",dose:"Loading: 15\u201320 mg IV push\nInfusion: 37.5 mg/h (0\u201321.4 mcg/kg/min)\nDuration: 48h (ACURASYS protocol) in P/F <150\nMonitor TOF (train-of-four): target 1\u20132 twitches/4 (deep block)\nMaintain sedation + analgesia throughout",renal:"Organ-independent Hofmann elimination \u2014 preferred in multi-organ failure.",ivpo:"Vecuronium or pancuronium if cisatracurium unavailable.",deesc:"Discontinue at 48h per ACURASYS. Reassess if P/F improving or >150.",note:"Organ-independent metabolism. Does NOT require renal/hepatic dose adjustment. Preferred in ARDS.",ref:"ACURASYS 2010"},
    {cat:"Conservative Fluids",drug:"Fluid Restriction Post-Resuscitation",dose:"Target CVP 4\u20138 mmHg OR PCWP \u22648 mmHg\nFurosemide protocol (FACTT trial): 20\u201360 mg IV q1\u20136h to achieve negative balance\nTarget: -500 to -1000 mL/day net fluid balance after initial resuscitation\nStop if: MAP <60, Cr rise >50%, new arrhythmia",renal:"Furosemide dose adjustment in CKD. May need continuous diuretic infusion.",ivpo:"Liberal fluids associated with more ventilator days (FACTT trial). Conservative preferred once resuscitated.",deesc:"Once extubated and diuresed \u2192 oral fluids as tolerated.",note:"FACTT trial: conservative fluid strategy = 2.5 fewer ventilator days. No mortality benefit but improved outcomes.",ref:"FACTT NEJM 2006"},
  ],
  vent:[
    {cat:"Initial Vent Settings",drug:"Volume Control A/C",dose:"Mode: VC-A/C (most common ED/ICU initial mode)\nTV: 6\u20138 mL/kg IBW (non-ARDS) / 6 mL/kg IBW (ARDS)\nRR: 14\u201316 /min \xb7 I:E ratio: 1:2 to 1:3\nFiO\u2082: 1.0 \u2192 titrate to SpO\u2082 94\u201398%\nPEEP: 5 cmH\u2082O (start) \xb7 ETCO\u2082 continuous",renal:"N/A",ivpo:"Pressure Control: use if peak pressures high in volume control (Ppeak vs Pplat differential).",deesc:"FiO\u2082 weaned first. PEEP weaned to 5 when FiO\u2082 \u22640.4 and SpO\u2082 stable >95%.",note:"RR + TV together determine minute ventilation and pCO\u2082. Pplat must be checked within 30 min.",ref:"PADIS 2018"},
    {cat:"High Ppeak Alarm",drug:"Systematic Troubleshooting",dose:"Step 1: Manual ventilation with BVM \u2014 if easy \u2192 ventilator issue\nStep 2: Suction ETT \u2014 secretions / mucus plug\nStep 3: Auscultate: unilateral \u2192 right mainstem or PTX \xb7 bilateral wheezing \u2192 bronchospasm\nStep 4: CXR if unclear \xb7 POCUS for PTX (absent lung sliding)\nStep 5: Disconnect briefly if suspected auto-PEEP",renal:"N/A",ivpo:"If high Ppeak AND high Pplat: lung overinflation or stiff lungs \u2192 reduce TV.\nIf high Ppeak, normal Pplat: high airway resistance \u2192 treat bronchospasm.",deesc:"Troubleshoot and reassess. Do not accept Ppeak >40 without full assessment.",note:"Ppeak high + Pplat high = lung problem. Ppeak high + Pplat normal = airway resistance problem.",ref:"UpToDate 2024"},
    {cat:"Sedation + Analgesia",drug:"Analgesia-First Protocol",dose:"Analgesia (FIRST): Fentanyl 25\u2013100 mcg/h IV or bolus PRN\nSedation: Propofol 5\u201350 mcg/kg/min (titrate to RASS -1 to 0)\nOR Dexmedetomidine 0.2\u20130.7 mcg/kg/h (lighter sedation, better SAT)\nDelirious + agitated: add haloperidol 2.5\u20135 mg IV PRN\nDeep sedation (RASS -3 to -5): cisatracurium NMB if needed for ARDS",renal:"Fentanyl preferred in renal failure \xb7 Dexmedetomidine: no renal dose adj needed.",ivpo:"Midazolam 0.02\u20130.1 mg/kg/h: avoid >48h (accumulates, prolongs vent) unless propofol unavailable.",deesc:"Daily SAT (spontaneous awakening trial). Lighter sedation reduces ventilator days.",note:"Analgesia-first (A1C) reduces sedative requirements and ventilator days. CPOT <3, RASS -1 to 0.",ref:"PADIS 2018"},
    {cat:"ETT Cuff Pressure",drug:"Cuff Pressure Management",dose:"Target cuff pressure: 20\u201330 cmH\u2082O\nCheck: every 8 hours with manometer\nMINIMUM SAFE PRESSURE: 20 cmH\u2082O (seal against aspiration)\nMAXIMUM SAFE PRESSURE: 30 cmH\u2082O (avoid mucosal ischemia)\n\nOverinflation (>30): tracheal mucosal ischemia \u2192 stenosis, tracheomalacia\nUnderinflation (<20): microaspiration, VAP, audible air leak around cuff",renal:"N/A",ivpo:"Pilot balloon palpation is NOT a reliable substitute for manometer measurement.",deesc:"Readjust cuff every 8h. Document cuff pressure in nursing flowsheet.",note:"Cuff pressure fluctuates with patient movement, coughing, and position changes. Recheck routinely.",ref:"VAP Prevention Guidelines"},
    {cat:"Vent Hemodynamics",drug:"Cardiovascular Optimization",dose:"PPV \u2191 intrathoracic pressure \u2192 \u2193 venous return \u2192 \u2193 RV preload\nHigh PEEP \u2192 RV pressure overload (beware in ARDS pts with RV failure)\nVolume resuscitation: fluid challenge 250\u2013500 mL NS for hypotension\nIf refractory: vasopressor (norepinephrine first-line)\nAssess: IVC collapsibility, RV:LV ratio (POCUS), pulse pressure variation",renal:"N/A",ivpo:"If RV failure suspected: reduce PEEP + consider inhaled NO/epoprostenol.",deesc:"PPV-induced hypotension often responds to volume (if preload-dependent) or PEEP reduction.",note:"RV failure in ARDS: management conflict (need high PEEP for oxygenation vs RV preload). Pulm consult.",ref:"PADIS 2018"},
  ],
  wean:[
    {cat:"Spontaneous Awakening Trial (SAT)",drug:"Sedation Holiday",dose:"Turn off all sedatives and opioid infusions\nObserve: 30\u2013120 min\nSAT PASS: Awake, follows \u22651 command, SpO\u2082 \u226590%, no distress\nSAT FAIL (any of below \u2192 restart sedation at 50% prior dose):\n  SpO\u2082 <88% for >5 min\n  RR >35 for >5 min\n  Hemodynamic instability\n  Severe agitation (RASS +3/+4)",renal:"N/A",ivpo:"If SAT fails, restart sedation at 50% prior dose and re-attempt next morning.",deesc:"SAT success \u2192 immediately proceed to SBT assessment (ABC trial protocol).",note:"SAT + SBT pairing (ABC trial): reduces ICU LOS by 3.1 days and 28-day mortality by 15%.",ref:"ABC Trial LANCET 2008"},
    {cat:"Spontaneous Breathing Trial (SBT)",drug:"PSV 5/5 or T-piece",dose:"PSV mode: PEEP 5 cmH\u2082O, PS 5 cmH\u2082O, FiO\u2082 same\nOR T-piece: disconnect from vent, humidified O\u2082 via T-piece\nDuration: 30\u2013120 min (30 min adequate per most guidelines)\nSBT PASS: tolerates without distress\nSBT FAIL (any below \u2192 return to prior settings):\n  RR >35 or <8 \xb7 SpO\u2082 <90% \xb7 Distress/agitation\n  Hemodynamic instability \xb7 Diaphoresis",renal:"N/A",ivpo:"If SBT fails: return to A/C mode. Identify and treat cause of failure. Retry in 24h.",deesc:"SBT pass \u2192 proceed to extubation. Do not leave on PSV indefinitely (ventilator dependency risk).",note:"Most patients who pass SBT can be safely extubated. SBT is a better predictor than individual parameters.",ref:"ABC Trial 2008"},
    {cat:"RSBI",drug:"Rapid Shallow Breathing Index",dose:"RSBI = RR (spontaneous) / VT (liters)\nMeasure during 1\u20133 min spontaneous breathing (T-piece or CPAP)\nExample: RR 20 / VT 0.35 L = RSBI 57 (favorable)\nRSBI <80: very likely to succeed\nRSBI 80\u2013105: moderate success likelihood\nRSBI >105: high failure risk \u2014 consider delaying extubation",renal:"N/A",ivpo:"Alone, RSBI has ~78% sensitivity 25% specificity. Use alongside full extubation criteria.",deesc:"RSBI alone should not be the sole reason to delay extubation if all other criteria met.",note:"RSBI <80 is strong predictor. RSBI >105 predicts failure in 80% of cases.",ref:"Yang Tobin NEJM 1991"},
    {cat:"Post-Extubation Airway",drug:"Extubation Bundle",dose:"BEFORE extubation:\n  Dexamethasone 4 mg IV q6h \xd74 if no cuff leak (reduces post-ex stridor)\n  Methylprednisolone 20\u201340 mg IV 1h before if high stridor risk\nAT extubation:\n  Suction oropharynx \xb7 deflate cuff \xb7 withdraw during deep breath or cough\n  Have re-intubation equipment immediately at bedside\nPOST-EXTUBATION:\n  HFNC 40\u201360 L/min 24\u201348h: reduces re-intubation in high-risk patients",renal:"N/A",ivpo:"High-risk: age >65, BMI >30, APACHE >12, heart failure, multiple extubation failures.",deesc:"If post-extubation stridor occurs: dexamethasone + racemic epi neb \xb7 prepare for re-intubation.",note:"HFNC post-extubation in high-risk patients: Hernandez JAMA 2016 \u2014 reduces re-intubation by 8%.",ref:"Hernandez JAMA 2016"},
  ],
};

const FOLLOWUP = {
  ards:["Daily: P/F ratio, Pplat, driving pressure, PEEP/FiO\u2082, prone candidate assessment","Prone if P/F <150 \u2014 18h session, then reassess. Up to 28 days if severe ARDS persistent.","Daily awakening trial from NMB: reassess NMB continuation need at 48h","Conservative fluid target: net negative 500\u20131000 mL/day once resuscitation complete","ARDS resolution: Pplat <25, P/F >200 on PEEP 8 FiO\u2082 0.4 for >4h \u2192 begin weaning"],
  vent:["Daily ETT cuff pressure check q8h \u2014 target 20\u201330 cmH\u2082O","Daily oral care every 2h + subglottic suction (VAP prevention)","Daily: verify vent settings appropriate, check Pplat, assess auto-PEEP","Daily: calculate driving pressure (Pplat - PEEP). Target <13 cmH\u2082O.","Monitor: daily CXR, ABG, tube position. Head of bed 30\u201345\u00b0 at all times."],
  wean:["SAT + SBT every morning per ABCDEF bundle protocol","If extubated: HFNC 40 L/min for 24\u201348h in high-risk patients (cardiac, BMI>30, age>65)","Re-intubation criteria: SpO\u2082 <88% on HFNC 1.0 / progressive distress / altered MS","If post-extubation stridor: racemic epi neb + dexamethasone; prepare for re-intubation","Tracheostomy if expected intubation >14\u201321 days: discuss ENT/surgical day 7\u201310"],
};

const MDM_DATA = {
  ards:{fields:[{id:"pf",lbl:"P/F Ratio + Severity",ph:"e.g., P/F 140 \u2014 Moderate ARDS"},{id:"tv",lbl:"IBW-based TV",ph:"e.g., 68 kg IBW \u2192 6 mL/kg = 408 mL"},{id:"prone",lbl:"Prone Status",ph:"e.g., initiated \u221218h prone; P/F 148 \u2192 220"}],t:(f)=>`ARDS management per ARDSNet protocol. ${f.pf||"[P/F ratio + Berlin severity]"}. Lung-protective ventilation: ${f.tv||"[TV mL/kg IBW, Pplat, PEEP]"}. ${f.prone||"Prone positioning assessed \u2014 [indication or deferral reason]"}. FiO\u2082/PEEP titrated per ARDSNet table. Conservative fluid strategy after initial resuscitation. Daily assessment for liberation.`},
  vent:{fields:[{id:"mode",lbl:"Vent Mode + Settings",ph:"e.g., VC-A/C TV 480 mL RR 14 FiO\u2082 0.45 PEEP 8"},{id:"alarm",lbl:"Any Alarm or Complication",ph:"e.g., high Ppeak \u2014 treated with suctioning"}],t:(f)=>`Mechanical ventilation continued. Settings: ${f.mode||"[mode and current settings]"}. ${f.alarm?`Alarm/complication: ${f.alarm}. `:"No significant alarms. "}Pplat within target range. ETT cuff pressure checked and within 20\u201330 cmH\u2082O. Daily SAT initiated. Head of bed 30\u201345\u00b0 maintained. Oral care per VAP protocol.`},
  wean:{fields:[{id:"sat",lbl:"SAT Result",ph:"e.g., passed \u2014 patient following commands"},{id:"sbt",lbl:"SBT Result + Duration",ph:"e.g., passed PSV 5/5 \xd780 min \u2014 RSBI 72"},{id:"ext",lbl:"Extubation Plan",ph:"e.g., extubated to HFNC 40 L/min"}],t:(f)=>`Weaning assessment performed per ABC bundle. SAT: ${f.sat||"[result]"}. SBT: ${f.sbt||"[result and RSBI]"}. ${f.ext||"[extubation or deferral plan]"}. Post-extubation plan documented. Cuff leak test performed. Extubation criteria reviewed.`},
};

const ORDER_SETS = {
  ards:{label:"ARDS Protocol Orders",icon:"\ud83e\udea8",color:T.coral,sets:[
    {title:"ARDSNet Vent",text:`ARDSNET LUNG PROTECTIVE VENTILATION\nMode: VC-A/C\nTV: 6 mL/kg IBW (calculate from height)\nRR: 14\u201316 (titrate to pH 7.30\u20137.45; may increase to 35)\nFiO\u2082: 1.0 (wean per PEEP/FiO\u2082 table)\nPEEP: per ARDSNet table\nGoal Pplat: <30 cmH\u2082O (mandatory)\nInspiratory hold: q4\u20138h`},
    {title:"Prone Protocol",text:`PRONE POSITIONING \u2014 INDICATION: P/F <150\nReqd FiO\u2082 \u22650.6 AND PEEP \u226510\nTeam: 3\u20135 staff minimum\nDuration: \u226516 h/session\nSpO\u2082 monitoring: continuous\nReturn to supine criteria:\n  SpO\u2082 worsening \xb7 ETT displacement\n  Hemodynamic instability\nCXR after each prone/supine transition`},
    {title:"NMB + Sedation",text:`ARDS SEDATION + NMB (P/F <150)\nAnalgesia: Fentanyl 25\u2013100 mcg/h IV\nSedation: Propofol 5\u201350 mcg/kg/min (RASS -2 to -3)\nNMB: Cisatracurium 37.5 mg/h\nTOF monitoring: q4h (target 1\u20132/4)\nDuration NMB: 48h per ACURASYS\nDiscontiue: if P/F >150 or at 48h`},
  ]},
  wean:{label:"Liberation Bundle Orders",icon:"\ud83d\udcca",color:T.green,sets:[
    {title:"SAT + SBT",text:`SPONTANEOUS AWAKENING TRIAL (daily 7am)\nHold all sedation/opioid infusions\nObserve 30\u2013120 min\nFAIL: SpO\u2082 <88% / RR >35 / distress\u2192 restart 50%\n\nSPONTANEOUS BREATHING TRIAL (if SAT pass)\nMode: PSV 5/5 (PEEP 5, PS 5, same FiO\u2082)\nDuration: 30\u2013120 min\nRSBI: RR/VT(L) - goal <105\nPass \u2192 proceed with extubation plan`},
    {title:"Post-Extubation",text:`POST-EXTUBATION PROTOCOL\nHFNC: 40 L/min FiO\u2082 titrated (high-risk pts)\nDexamethasone: 4 mg IV q6h \xd74 if no cuff leak\nMonitor SpO\u2082 / RR: q15min \xd72h, then q1h\nRe-intubation criteria:\n  SpO\u2082 <88% on HFNC 1.0 + 60 L/min\n  Progressive distress / GCS declining\n  Hemodynamic instability`},
  ]},
};

const QUICK_REF = {
  ards:["TV 6 mL/kg IBW (NOT actual weight) \xb7 Pplat <30 mandatory","Prone if P/F <150 \u226516h/day \xb7 NMB 48h if P/F <150","P/F ratio: mild 200\u2013300, moderate 100\u2013200, severe <100","Driving pressure = Pplat - PEEP \xb7 target \u226413 cmH\u2082O","Conservative fluids post-resuscitation: target net -500 mL/day"],
  vent:["Ppeak high + Pplat high: stiff lungs \xb7 Ppeak high + Pplat normal: airway resistance","ETT cuff pressure: 20\u201330 cmH\u2082O \xb7 check q8h with manometer","Sedation target RASS -1 to 0 \xb7 Analgesia-first (A1C protocol)","Daily driving pressure: Pplat - PEEP \xb7 target <13 cmH\u2082O","Head of bed 30\u201345\u00b0 \xb7 Oral care q2h \xb7 subglottic suction (VAP prevention)"],
  wean:["SAT every morning: hold sedation 30\u2013120 min, assess daily","SBT: PSV 5/5 \xd730\u2013120 min \u2192 if pass, extubate today","RSBI = RR/VT(L) \xb7 <80 strong pass \xb7 >105 high failure risk","Cuff leak absent \u2192 dexamethasone 4 mg IV q6h \xd74 before extubation","Post-extubation HFNC: reduces re-intubation in high-risk patients (Hernandez 2016)"],
};

/* ═══ ARDS CALCULATOR ════════════════════════════════════════════════ */
function ARDSCalc() {
  const params=new URLSearchParams(window.location.search);
  const [ht,setHt]=useState(params.get("height")||"");const [unit,setUnit]=useState(params.get("heightUnit")||"in");const [sex,setSex]=useState(params.get("sex")||"M");
  const [pplat,setPplat]=useState("");const [peepV,setPeepV]=useState("");
  const htIn=unit==="cm"?parseFloat(ht)/2.54:parseFloat(ht);
  const ibw=!isNaN(htIn)&&htIn>0?Math.round(sex==="M"?(50+2.3*(htIn-60)):(45.5+2.3*(htIn-60))):null;
  const tv6=ibw?ibw*6:null; const tv8=ibw?ibw*8:null;
  const dp=pplat&&peepV?parseFloat(pplat)-parseFloat(peepV):null;
  const inp={background:"rgba(14,37,68,0.7)",border:"1px solid rgba(255,107,107,0.3)",borderRadius:8,padding:"7px 9px",color:T.txt,fontFamily:"monospace",fontSize:12,outline:"none"};
  return (
    <div style={{background:"rgba(255,107,107,0.05)",border:"1px solid rgba(255,107,107,0.22)",borderRadius:12,padding:"14px 16px",marginBottom:12}}>
      <div style={{fontSize:11,fontWeight:700,color:T.txt,marginBottom:4}}>\ud83e\udea8 ARDSNet IBW + TV Calculator</div>
      <div style={{fontSize:9,color:T.txt4,fontFamily:"monospace",marginBottom:10}}>TV based on Ideal Body Weight (IBW), NOT actual weight</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:8,marginBottom:10,alignItems:"end"}}>
        <div>
          <div style={{fontSize:8,color:T.txt4,textTransform:"uppercase",marginBottom:3}}>Height</div>
          <input type="number" placeholder={unit==="in"?"70":"178"} value={ht} onChange={e=>setHt(e.target.value)} style={{...inp,width:"100%"}} />
        </div>
        <div style={{display:"flex",gap:4,flexDirection:"column"}}>
          <div style={{fontSize:8,color:T.txt4,textTransform:"uppercase"}}>Unit</div>
          <div style={{display:"flex",borderRadius:8,overflow:"hidden",border:`1px solid ${T.b}`}}>
            {["in","cm"].map(u=><button key={u} onClick={()=>setUnit(u)} style={{padding:"8px 10px",cursor:"pointer",border:"none",background:unit===u?"rgba(255,107,107,0.2)":"rgba(14,37,68,0.5)",color:unit===u?T.coral:T.txt3,fontSize:10,fontWeight:700}}>{u}</button>)}
          </div>
        </div>
        <div>
          <div style={{fontSize:8,color:T.txt4,textTransform:"uppercase",marginBottom:3}}>Sex</div>
          <div style={{display:"flex",borderRadius:8,overflow:"hidden",border:`1px solid ${T.b}`}}>
            {["M","F"].map(s=><button key={s} onClick={()=>setSex(s)} style={{flex:1,padding:"8px 10px",cursor:"pointer",border:"none",background:sex===s?"rgba(255,107,107,0.2)":"rgba(14,37,68,0.5)",color:sex===s?T.coral:T.txt3,fontSize:11,fontWeight:700}}>{s}</button>)}
          </div>
        </div>
      </div>
      {ibw&&ibw>0&&(<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:12}}>
        {[["IBW",ibw+" kg",T.txt],["TV at 6 mL/kg",tv6+" mL",T.coral],["TV at 8 mL/kg",tv8+" mL",T.gold]].map(([l,v,c])=>(
          <div key={l} style={{textAlign:"center",background:`${c}10`,border:`1px solid ${c}28`,borderRadius:8,padding:"8px"}}>
            <div style={{fontSize:8,color:T.txt4,textTransform:"uppercase",marginBottom:2}}>{l}</div>
            <div style={{fontSize:16,fontWeight:700,color:c,fontFamily:"monospace"}}>{v}</div>
          </div>
        ))}
      </div>)}
      <div style={{borderTop:`1px solid ${T.b}`,paddingTop:10,marginTop:4}}>
        <div style={{fontSize:9,color:T.txt4,textTransform:"uppercase",marginBottom:8,letterSpacing:".06em"}}>Driving Pressure Calculator</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <div><div style={{fontSize:8,color:T.txt4,textTransform:"uppercase",marginBottom:3}}>Pplat (cmH\u2082O)</div><input type="number" placeholder="e.g. 26" value={pplat} onChange={e=>setPplat(e.target.value)} style={{...inp,width:"100%"}} /></div>
          <div><div style={{fontSize:8,color:T.txt4,textTransform:"uppercase",marginBottom:3}}>PEEP (cmH\u2082O)</div><input type="number" placeholder="e.g. 10" value={peepV} onChange={e=>setPeepV(e.target.value)} style={{...inp,width:"100%"}} /></div>
        </div>
        {dp!==null&&<div style={{marginTop:8,padding:"8px 12px",background:`${dp<=13?T.green:dp<=18?T.gold:T.coral}10`,border:`1px solid ${dp<=13?T.green:dp<=18?T.gold:T.coral}30`,borderRadius:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:10,color:T.txt2}}>Driving Pressure</span>
          <span style={{fontSize:16,fontWeight:700,color:dp<=13?T.green:dp<=18?T.gold:T.coral,fontFamily:"monospace"}}>{dp} cmH\u2082O {dp<=13?"\u2713 Target":dp<=18?"\u26a0\ufe0f Elevated":"\u274c High"}</span>
        </div>}
      </div>
    </div>
  );
}

/* ═══ RSBI CALCULATOR ════════════════════════════════════════════════ */
function RSBICalc() {
  const [rr,setRr]=useState("");const [vt,setVt]=useState("");const [vtUnit,setVtUnit]=useState("mL");
  const vtL=vtUnit==="mL"?parseFloat(vt)/1000:parseFloat(vt);
  const rsbi=!isNaN(parseFloat(rr))&&!isNaN(vtL)&&vtL>0?Math.round(parseFloat(rr)/vtL):null;
  const risk=rsbi===null?null:rsbi<80?{l:"Very likely to succeed",c:T.green}:rsbi<105?{l:"Moderate success likelihood",c:T.gold}:{l:"High failure risk",c:T.coral};
  const inp={background:"rgba(14,37,68,0.7)",border:"1px solid rgba(61,255,160,0.3)",borderRadius:8,padding:"7px 9px",color:T.txt,fontFamily:"monospace",fontSize:12,outline:"none"};
  return (
    <div style={{background:"rgba(61,255,160,0.05)",border:"1px solid rgba(61,255,160,0.22)",borderRadius:12,padding:"14px 16px",marginBottom:12}}>
      <div style={{fontSize:11,fontWeight:700,color:T.txt,marginBottom:4}}>\ud83d\udcca RSBI \u2014 Rapid Shallow Breathing Index</div>
      <div style={{fontSize:9,color:T.txt4,fontFamily:"monospace",marginBottom:10}}>RSBI = Respiratory Rate / Tidal Volume (liters) \xb7 measure during T-piece or CPAP</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
        <div><div style={{fontSize:8,color:T.txt4,textTransform:"uppercase",marginBottom:3}}>Spontaneous RR (/min)</div><input type="number" placeholder="e.g. 18" value={rr} onChange={e=>setRr(e.target.value)} style={{...inp,width:"100%"}} /></div>
        <div>
          <div style={{fontSize:8,color:T.txt4,textTransform:"uppercase",marginBottom:3}}>Tidal Volume</div>
          <div style={{display:"flex",gap:4}}>
            <input type="number" placeholder={vtUnit==="mL"?"350":"0.35"} value={vt} onChange={e=>setVt(e.target.value)} style={{...inp,flex:1}} />
            <div style={{display:"flex",borderRadius:8,overflow:"hidden",border:`1px solid ${T.b}`}}>
              {["mL","L"].map(u=><button key={u} onClick={()=>setVtUnit(u)} style={{padding:"6px 8px",cursor:"pointer",border:"none",background:vtUnit===u?"rgba(61,255,160,0.2)":"rgba(14,37,68,0.5)",color:vtUnit===u?T.green:T.txt3,fontSize:10,fontWeight:700}}>{u}</button>)}
            </div>
          </div>
        </div>
      </div>
      {rsbi!==null&&risk&&(
        <div style={{background:`${risk.c}12`,border:`1px solid ${risk.c}35`,borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:14}}>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:26,fontWeight:700,color:risk.c,fontFamily:"monospace"}}>{rsbi}</div>
            <div style={{fontSize:9,color:T.txt4}}>RSBI</div>
          </div>
          <div><div style={{fontSize:12,fontWeight:700,color:risk.c,marginBottom:3}}>{risk.l}</div><div style={{fontSize:10,color:T.txt2}}>{rsbi<80?"Proceed with extubation planning":rsbi<105?"Assess full extubation criteria":"Defer SBT \u2014 address underlying cause"}</div></div>
        </div>
      )}
      <div style={{marginTop:8,display:"flex",gap:6}}>
        {[["<80",T.green,"Extubate"],["80\u2013105",T.gold,"Assess"],["\u2265105",T.coral,"High fail"]].map(([v,c,l])=>(
          <div key={v} style={{flex:1,textAlign:"center",padding:"4px",background:`${c}10`,border:`1px solid ${c}25`,borderRadius:7}}>
            <div style={{fontSize:11,fontWeight:700,color:c,fontFamily:"monospace"}}>{v}</div>
            <div style={{fontSize:8,color:T.txt4}}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══ VENT CHECKER ══════════════════════════════════════════════════ */
function VentChecker() {
  const [tv,setTv]=useState("");const [ibw,setIbw]=useState("");const [peak,setPeak]=useState("");const [plat,setPlat]=useState("");const [peep,setPeep]=useState("");const [rr,setRr]=useState("");const [fio2,setFio2]=useState("");
  const checks=[];
  const tvPerKg=tv&&ibw?parseFloat(tv)/parseFloat(ibw):null;
  if(tvPerKg!==null)checks.push({l:"TV/kg IBW",v:`${tvPerKg.toFixed(1)} mL/kg`,ok:tvPerKg<=8,warn:tvPerKg>8&&tvPerKg<=10,msg:tvPerKg<=6?"Lung protective \u2013 excellent":tvPerKg<=8?"Acceptable":tvPerKg<=10?"\u26a0\ufe0f Consider reducing":"\u274c REDUCE \u2014 volutrauma risk"});
  if(plat)checks.push({l:"Pplat",v:`${plat} cmH\u2082O`,ok:parseFloat(plat)<=30,warn:parseFloat(plat)>30&&parseFloat(plat)<=35,msg:parseFloat(plat)<=25?"\u2713 Optimal":parseFloat(plat)<=30?"\u2713 Acceptable":"\u274c REDUCE TV \u2014 barotrauma risk"});
  if(plat&&peep)checks.push({l:"Driving Pressure",v:`${parseFloat(plat)-parseFloat(peep)} cmH\u2082O`,ok:(parseFloat(plat)-parseFloat(peep))<=13,msg:(parseFloat(plat)-parseFloat(peep))<=13?"\u2713 Target <13":"\u26a0\ufe0f Elevated \u2014 mortality risk"});
  if(peak&&plat)checks.push({l:"Ppeak\u2212Pplat",v:`${parseFloat(peak)-parseFloat(plat)} cmH\u2082O`,ok:(parseFloat(peak)-parseFloat(plat))<=10,msg:(parseFloat(peak)-parseFloat(plat))<=10?"\u2713 Normal airway resistance":"\u26a0\ufe0f High \u2014 assess for bronchospasm/secretions"});
  if(fio2)checks.push({l:"FiO\u2082",v:parseFloat(fio2),ok:parseFloat(fio2)<=0.6,msg:parseFloat(fio2)<=0.4?"\u2713 Safe":parseFloat(fio2)<=0.6?"\u26a0\ufe0f Wean when possible":"\u274c High FiO\u2082 \u2014 increase PEEP first"});
  const inp2={background:"rgba(14,37,68,0.7)",border:`1px solid ${T.b}`,borderRadius:7,padding:"6px 8px",color:T.txt,fontFamily:"monospace",fontSize:11,outline:"none",width:"100%"};
  return (
    <div style={{background:"rgba(245,200,66,0.05)",border:"1px solid rgba(245,200,66,0.22)",borderRadius:12,padding:"14px 16px",marginBottom:12}}>
      <div style={{fontSize:11,fontWeight:700,color:T.gold,marginBottom:10}}>\u2699\ufe0f Vent Settings Checker</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:10}}>
        {[["TV (mL)",tv,setTv,"480"],["IBW (kg)",ibw,setIbw,"80"],["RR/min",rr,setRr,"14"],["Ppeak",peak,setPeak,"30"],["Pplat",plat,setPlat,"24"],["PEEP",peep,setPeep,"8"],["FiO\u2082",fio2,setFio2,"0.5"]].map(([l,v,sv,ph])=>(
          <div key={l}><div style={{fontSize:8,color:T.txt4,textTransform:"uppercase",marginBottom:2}}>{l}</div><input type="number" placeholder={ph} value={v} onChange={e=>sv(e.target.value)} style={inp2} /></div>
        ))}
      </div>
      {checks.length>0&&checks.map((c,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 10px",background:c.ok?"rgba(61,255,160,0.06)":c.warn?"rgba(245,200,66,0.06)":"rgba(255,107,107,0.06)",border:`1px solid ${c.ok?T.green+"30":c.warn?T.gold+"30":T.coral+"30"}`,borderRadius:8,marginBottom:4}}>
          <div style={{flex:1}}>
            <span style={{fontSize:10,fontWeight:700,color:T.txt3}}>{c.l}: </span>
            <span style={{fontSize:11,fontWeight:700,color:c.ok?T.green:c.warn?T.gold:T.coral,fontFamily:"monospace"}}>{c.v}</span>
          </div>
          <span style={{fontSize:10,color:c.ok?T.green:c.warn?T.gold:T.coral}}>{c.msg}</span>
        </div>
      ))}
      {checks.length===0&&<div style={{fontSize:10,color:T.txt4,textAlign:"center",padding:"8px 0"}}>Enter settings above to check targets</div>}
    </div>
  );
}

/* ═══ AIRWAY TIMERS ═════════════════════════════════════════════════ */
function AirwayTimers() {
  const [timers,setTimers]=useState([{label:"SBT",target:30,elapsed:0,running:false},{label:"SAT",target:30,elapsed:0,running:false},{label:"Prone Session",target:960,elapsed:0,running:false}]);
  useEffect(()=>{
    const id=setInterval(()=>{setTimers(prev=>prev.map(t=>t.running?{...t,elapsed:t.elapsed+1}:t));},1000);
    return ()=>clearInterval(id);
  },[]);
  const toggle=(i)=>setTimers(prev=>prev.map((t,idx)=>idx===i?{...t,running:!t.running}:t));
  const reset=(i)=>setTimers(prev=>prev.map((t,idx)=>idx===i?{...t,elapsed:0,running:false}:t));
  const fmt=s=>{if(s>=3600)return`${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m`;return`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;};
  return (
    <div style={{background:"rgba(59,158,255,0.05)",border:"1px solid rgba(59,158,255,0.22)",borderRadius:12,padding:"12px 14px",marginBottom:12}}>
      <div style={{fontSize:10,fontWeight:700,color:T.blue,marginBottom:10}}>\u23f1 Clinical Timers</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {timers.map((t,i)=>{const pct=Math.min((t.elapsed/(t.target*60))*100,100);const done=t.elapsed>=t.target*60;return(
          <div key={i} style={{flex:1,minWidth:140,background:"rgba(14,37,68,0.5)",border:`1px solid ${done?T.green+"50":T.b}`,borderRadius:10,padding:"10px 12px",textAlign:"center"}}>
            <div style={{fontSize:10,fontWeight:700,color:done?T.green:T.txt3,marginBottom:4}}>{t.label} <span style={{fontSize:8,color:T.txt4}}>({t.target} min target)</span></div>
            <div style={{fontSize:20,fontWeight:700,color:done?T.green:T.blue,fontFamily:"monospace",marginBottom:6}}>{fmt(t.elapsed)}</div>
            <div style={{height:3,background:"rgba(14,37,68,0.8)",borderRadius:2,marginBottom:8,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:done?T.green:T.blue,transition:"width .5s"}} /></div>
            <div style={{display:"flex",gap:5,justifyContent:"center"}}>
              <button onClick={()=>toggle(i)} style={{padding:"5px 12px",borderRadius:6,cursor:"pointer",fontFamily:"sans-serif",border:`1px solid ${T.blue}50`,background:"rgba(59,158,255,0.1)",color:T.blue,fontSize:10,fontWeight:700}}>{t.running?"\u23f8 Pause":"\u25b6 Start"}</button>
              <button onClick={()=>reset(i)} style={{padding:"5px 8px",borderRadius:6,cursor:"pointer",fontFamily:"sans-serif",border:`1px solid ${T.b}`,background:"rgba(14,37,68,0.5)",color:T.txt4,fontSize:10}}>\u21ba</button>
            </div>
          </div>
        );})}
      </div>
    </div>
  );
}

/* ═══ SHARED COMPONENTS ═════════════════════════════════════════════ */
function DrugRow({rx}) {
  const [open,setOpen]=useState(null);
  const panels=[{k:"renal",icon:"\ud83d\udccb",label:"Details",color:T.blue},{k:"ivpo",icon:"\ud83d\udd27",label:"Alternative",color:T.teal},{k:"deesc",icon:"\ud83d\udcc9",label:"Monitoring",color:T.green}];
  return (
    <div style={{background:"rgba(14,37,68,0.45)",border:`1px solid ${T.b}`,borderRadius:10,marginBottom:8,overflow:"hidden"}}>
      <div style={{padding:"11px 14px"}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8,marginBottom:4}}>
          <div><div style={{fontSize:12,fontWeight:700,color:T.txt}}>{rx.drug}</div>{rx.cat&&<div style={{fontSize:10,color:T.txt3,marginTop:1}}>{rx.cat}</div>}</div>
          {rx.ref&&<span style={{fontSize:9,fontFamily:"monospace",fontWeight:700,padding:"2px 7px",borderRadius:20,flexShrink:0,background:"rgba(255,107,107,0.1)",border:"1px solid rgba(255,107,107,0.3)",color:T.coral}}>{rx.ref}</span>}
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
  const tmpl=MDM_DATA[condId];
  const [fields,setFields]=useState({});const [copied,setCopied]=useState(false);const [show,setShow]=useState(false);
  if(!tmpl)return null;
  const note=tmpl.t(fields);
  const copy=()=>navigator.clipboard.writeText(note).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2500);});
  return (
    <div style={{background:"rgba(0,229,192,0.04)",border:"1px solid rgba(0,229,192,0.22)",borderRadius:10,padding:"12px 14px",marginTop:12}}>
      <div style={{fontSize:10,fontWeight:700,color:T.teal,marginBottom:8}}>\ud83d\udccb MDM Snippet</div>
      {tmpl.fields.map(f=>(
        <div key={f.id} style={{marginBottom:6}}>
          <div style={{fontSize:8,color:T.txt4,textTransform:"uppercase",marginBottom:2}}>{f.lbl}</div>
          <input type="text" placeholder={f.ph} value={fields[f.id]||""} onChange={e=>setFields(pp=>({...pp,[f.id]:e.target.value}))} style={{width:"100%",background:"rgba(14,37,68,0.7)",border:`1px solid ${T.b}`,borderRadius:7,padding:"6px 9px",color:T.txt,fontFamily:"monospace",fontSize:11,outline:"none"}} />
        </div>
      ))}
      <div style={{display:"flex",gap:7,marginTop:8}}>
        <button onClick={()=>setShow(!show)} style={{flex:1,padding:"7px",borderRadius:7,cursor:"pointer",fontFamily:"sans-serif",border:"1px solid rgba(0,229,192,0.3)",background:"rgba(0,229,192,0.05)",color:T.teal,fontSize:10,fontWeight:700}}>{show?"Hide":"Preview"}</button>
        <button onClick={copy} style={{flex:1,padding:"7px",borderRadius:7,cursor:"pointer",fontFamily:"sans-serif",transition:"all .2s",border:`1px solid ${copied?T.green+"55":"rgba(0,229,192,0.3)"}`,background:copied?"rgba(61,255,160,0.1)":"rgba(0,229,192,0.05)",color:copied?T.green:T.teal,fontSize:10,fontWeight:700}}>{copied?"\u2713 Copied":"\ud83d\udccb Copy MDM"}</button>
      </div>
      {show&&<div style={{marginTop:8,background:"rgba(5,15,30,0.8)",border:"1px solid rgba(0,229,192,0.15)",borderRadius:8,padding:"10px 12px"}}><p style={{fontSize:11,color:T.txt2,lineHeight:1.75,margin:0,fontFamily:"'JetBrains Mono',monospace"}}>{note}</p></div>}
    </div>
  );
}

function OrderSetPanel({condId}) {
  const os=ORDER_SETS[condId];
  const [active,setActive]=useState(null);const [copied,setCopied]=useState(null);
  if(!os)return null;
  const copy=(i,text)=>navigator.clipboard.writeText(text).then(()=>{setCopied(i);setTimeout(()=>setCopied(null),2500);});
  return (
    <div style={{background:`${os.color}08`,border:`1px solid ${os.color}28`,borderRadius:10,marginBottom:10,overflow:"hidden"}}>
      <div style={{padding:"10px 14px",display:"flex",gap:8,alignItems:"center"}}>
        <span style={{fontSize:14}}>{os.icon}</span>
        <div><div style={{fontSize:11,fontWeight:700,color:os.color}}>{os.label}</div><div style={{fontSize:9,color:T.txt4}}>Tap to expand \xb7 copy to CPOE</div></div>
      </div>
      <div style={{borderTop:`1px solid ${os.color}20`,padding:"8px 10px",display:"flex",gap:6,flexWrap:"wrap"}}>
        {os.sets.map((s,i)=>(
          <div key={i} style={{flex:1,minWidth:140}}>
            <button onClick={()=>setActive(active===i?null:i)} style={{width:"100%",padding:"6px 10px",borderRadius:7,cursor:"pointer",fontFamily:"sans-serif",border:`1px solid ${active===i?os.color+"55":T.b}`,background:active===i?`${os.color}14`:"rgba(14,37,68,0.5)",color:active===i?os.color:T.txt3,fontSize:10,fontWeight:active===i?700:400,textAlign:"left"}}>{s.title}</button>
            {active===i&&<div style={{marginTop:5,background:"rgba(5,15,30,0.85)",border:`1px solid ${os.color}22`,borderRadius:8,padding:"9px 11px"}}>
              <pre style={{fontSize:9,color:T.txt2,lineHeight:1.6,whiteSpace:"pre-wrap",fontFamily:"'JetBrains Mono',monospace",margin:0,marginBottom:7}}>{s.text}</pre>
              <button onClick={()=>copy(i,s.text)} style={{width:"100%",padding:"6px",borderRadius:6,cursor:"pointer",fontFamily:"sans-serif",transition:"all .2s",border:`1px solid ${copied===i?T.green+"55":os.color+"40"}`,background:copied===i?"rgba(61,255,160,0.12)":`${os.color}08`,color:copied===i?T.green:os.color,fontSize:10,fontWeight:700}}>{copied===i?"\u2713 Copied":"\ud83d\udccb Copy"}</button>
            </div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickRefCard({condId}) {
  const refs=QUICK_REF[condId];
  if(!refs)return null;
  return (
    <div style={{background:"rgba(255,107,107,0.05)",border:"1px solid rgba(255,107,107,0.2)",borderRadius:10,padding:"12px 14px",marginTop:10}}>
      <div style={{fontSize:9,fontWeight:700,color:T.coral,textTransform:"uppercase",letterSpacing:".07em",marginBottom:8}}>\u26a1 Quick-Ref \u2014 5 Critical Numbers</div>
      {refs.map((r,i)=>(
        <div key={i} style={{display:"flex",gap:8,padding:"5px 0",borderBottom:i<refs.length-1?"1px solid rgba(26,53,85,0.4)":"none"}}>
          <div style={{width:16,height:16,borderRadius:4,background:"rgba(255,107,107,0.12)",border:"1px solid rgba(255,107,107,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:T.coral,fontWeight:700,flexShrink:0,marginTop:1}}>{i+1}</div>
          <div style={{fontSize:10,color:T.txt2,lineHeight:1.5,fontFamily:"monospace"}}>{r}</div>
        </div>
      ))}
    </div>
  );
}

/* ═══ CONDITION PAGE ════════════════════════════════════════════════ */
function ConditionPage({cond,onBack}) {
  const [tab,setTab]=useState("overview");const [checked,setChecked]=useState({});
  const ov=OVERVIEW[cond.id]||{};const rx=TREATMENT[cond.id]||[];const wu_=WORKUP[cond.id]||[];const fu=FOLLOWUP[cond.id]||[];
  const tabs=[{id:"overview",label:"Overview",icon:"\ud83d\udccb"},{id:"workup",label:"Workup",icon:"\u2705"},{id:"treatment",label:"Protocol",icon:"\u2699\ufe0f"},{id:"followup",label:"Follow-up",icon:"\ud83d\udcc5"}];
  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <div style={{padding:"14px 20px 0",flexShrink:0}}>
        <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:6,background:"rgba(14,37,68,0.5)",border:`1px solid ${T.b}`,borderRadius:7,padding:"5px 12px",color:T.txt3,fontSize:11,cursor:"pointer",marginBottom:12}}>\u2190 Back</button>
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
          {ov.bullets?.map((b,i)=><div key={i} style={{display:"flex",gap:10,padding:"7px 0",borderBottom:i<ov.bullets.length-1?"1px solid rgba(26,53,85,0.4)":"none"}}><div style={{width:14,height:14,borderRadius:3,background:cond.gl,border:`1px solid ${cond.br}`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:cond.color,marginTop:2}}>\u25aa</div><div style={{fontSize:12,color:T.txt2,lineHeight:1.55}}>{b}</div></div>)}
          {cond.id==="ards"&&<div style={{marginTop:14}}><ARDSCalc /><VentChecker /></div>}
          {cond.id==="vent"&&<div style={{marginTop:14}}><VentChecker /></div>}
          {cond.id==="wean"&&<div style={{marginTop:14}}><RSBICalc /><AirwayTimers /></div>}
          <QuickRefCard condId={cond.id} />
        </div>}
        {tab==="workup"&&<div>
          {wu_.map((item,i)=>(
            <div key={i} onClick={()=>setChecked(p=>({...p,[i]:!p[i]}))} style={{display:"flex",gap:12,alignItems:"flex-start",background:checked[i]?"rgba(0,229,192,0.07)":"rgba(14,37,68,0.4)",border:`1px solid ${checked[i]?"rgba(0,229,192,0.3)":T.b}`,borderRadius:9,padding:"11px 14px",marginBottom:8,cursor:"pointer"}}>
              <div style={{width:32,height:32,borderRadius:8,background:checked[i]?"rgba(0,229,192,0.15)":"rgba(14,37,68,0.6)",border:`1px solid ${checked[i]?"rgba(0,229,192,0.5)":T.b}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{checked[i]?"\u2713":item.icon}</div>
              <div><div style={{fontSize:12,fontWeight:600,color:checked[i]?T.teal:T.txt,marginBottom:3}}>{item.label}</div><div style={{fontSize:11,color:T.txt3,lineHeight:1.55}}>{item.detail}</div></div>
            </div>
          ))}
        </div>}
        {tab==="treatment"&&<div>
          <OrderSetPanel condId={cond.id} />
          {rx.map((r,i)=><DrugRow key={i} rx={r} />)}
        </div>}
        {tab==="followup"&&<div>
          {fu.map((item,i)=><div key={i} style={{display:"flex",gap:10,padding:"9px 12px",background:"rgba(14,37,68,0.4)",border:`1px solid ${T.b}`,borderRadius:8,marginBottom:6}}><div style={{width:22,height:22,borderRadius:6,background:"rgba(0,229,192,0.1)",border:"1px solid rgba(0,229,192,0.25)",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:T.teal,fontWeight:700,marginTop:1}}>{i+1}</div><div style={{fontSize:12,color:T.txt2,lineHeight:1.6}}>{item}</div></div>)}
          <MDMSnippet condId={cond.id} />
        </div>}
      </div>
    </div>
  );
}

/* ═══ MAIN VENT PAGE ════════════════════════════════════════════════ */
export default function VentPage() {
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
          <button onClick={()=>navigate("/AirwayHub")} style={{padding:"5px 12px",borderRadius:7,border:"1px solid rgba(255,107,107,0.35)",background:"rgba(8,22,40,0.7)",color:T.coral,fontSize:11,fontWeight:700,cursor:"pointer"}}>\u2190 Airway Hub</button>
          <div style={{width:40,height:40,borderRadius:11,background:"rgba(255,107,107,0.1)",border:"1px solid rgba(255,107,107,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>\u2699\ufe0f</div>
          <div>
            <div style={{fontSize:17,fontWeight:700,color:T.txt,fontFamily:"'Playfair Display',serif"}}>Invasive Ventilation</div>
            <div style={{fontSize:10,color:T.txt3}}>ARDS \xb7 ARDSNet \xb7 Vent Management \xb7 Weaning & Liberation</div>
          </div>
          <div style={{marginLeft:"auto",display:"flex",gap:6}}>
            {["ARDSNet 2000","PROSEVA 2013","PADIS 2018"].map(b=><span key={b} style={{fontSize:8,fontFamily:"monospace",fontWeight:700,padding:"2px 8px",borderRadius:20,background:"rgba(255,107,107,0.1)",border:"1px solid rgba(255,107,107,0.28)",color:T.coral}}>{b}</span>)}
          </div>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px 20px 24px"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:12,marginBottom:14}}>
          {CONDITIONS.map(c=>(
            <div key={c.id} onClick={()=>setSelected(c.id)} style={{background:c.gl,border:`1px solid ${c.br}`,borderRadius:12,padding:"14px 16px",cursor:"pointer",transition:"all .2s"}}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 8px 24px ${c.color}20`}}
              onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none"}}>
              <div style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:10}}>
                <div style={{width:40,height:40,borderRadius:10,background:c.gl,border:`1px solid ${c.br}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{c.icon}</div>
                <div><div style={{fontSize:13,fontWeight:700,color:T.txt}}>{c.title}</div><div style={{fontSize:10,color:T.txt3,marginTop:1}}>{c.sub}</div></div>
              </div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",fontSize:9}}>
                {TREATMENT[c.id]?.length>0&&<span style={{padding:"2px 7px",borderRadius:20,background:"rgba(0,229,192,0.08)",border:"1px solid rgba(0,229,192,0.2)",color:T.teal}}>\u2699\ufe0f {TREATMENT[c.id].length} protocol steps</span>}
                {c.id==="ards"&&<span style={{padding:"2px 7px",borderRadius:20,background:"rgba(255,107,107,0.1)",border:"1px solid rgba(255,107,107,0.3)",color:T.coral}}>\ud83e\udea8 ARDSNet Calc</span>}
                {c.id==="wean"&&<span style={{padding:"2px 7px",borderRadius:20,background:"rgba(61,255,160,0.1)",border:"1px solid rgba(61,255,160,0.3)",color:T.green}}>\ud83d\udcca RSBI Calc</span>}
                {(c.id==="ards"||c.id==="vent")&&<span style={{padding:"2px 7px",borderRadius:20,background:"rgba(245,200,66,0.1)",border:"1px solid rgba(245,200,66,0.3)",color:T.gold}}>\u2699\ufe0f Vent Checker</span>}
                {c.id==="wean"&&<span style={{padding:"2px 7px",borderRadius:20,background:"rgba(59,158,255,0.1)",border:"1px solid rgba(59,158,255,0.3)",color:T.blue}}>\u23f1 SBT Timer</span>}
              </div>
            </div>
          ))}
        </div>
        <div style={{borderTop:`1px solid ${T.b}`,paddingTop:14}}>
          <div style={{fontSize:9,fontWeight:700,color:T.txt4,textTransform:"uppercase",letterSpacing:".07em",marginBottom:10}}>Quick Access Tools</div>
          <ARDSCalc />
          <VentChecker />
          <RSBICalc />
          <AirwayTimers />
        </div>
      </div>
    </div>
  );
}