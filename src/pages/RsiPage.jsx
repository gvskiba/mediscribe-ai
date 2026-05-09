import { useState } from "react";
import { useNavigate } from "react-router-dom";

const T = {
  bg:"#050f1e",panel:"#081628",card:"#0b1e36",up:"#0e2544",b:"rgba(26,53,85,0.8)",
  txt:"#e8f0fe",txt2:"#8aaccc",txt3:"#4a6a8a",txt4:"#2e4a6a",
  coral:"#ff6b6b",gold:"#f5c842",teal:"#00e5c0",blue:"#3b9eff",
  orange:"#ff9f43",purple:"#9b6dff",green:"#3dffa0",cyan:"#00d4ff",
};

const CONDITIONS = [
  {id:"rsi",icon:"💉",title:"RSI Protocol",sub:"Pre-ox \xb7 Induction \xb7 Paralysis \xb7 Post-intubation",color:"#f5c842",gl:"rgba(245,200,66,0.07)",br:"rgba(245,200,66,0.28)"},
  {id:"daw",icon:"🚨",title:"Difficult Airway",sub:"LEMON \xb7 CICO \xb7 VL \xb7 LMA \xb7 Surgical Airway",color:"#ff6b6b",gl:"rgba(255,107,107,0.07)",br:"rgba(255,107,107,0.28)"},
  {id:"dsi",icon:"🔎",title:"DSI Protocol",sub:"Delayed Sequence Intubation \xb7 Ketamine Pre-ox",color:"#9b6dff",gl:"rgba(155,109,255,0.07)",br:"rgba(155,109,255,0.28)"},
  {id:"peds",icon:"👶",title:"Pediatric Airway",sub:"Tube Sizing \xb7 Weight Estimation \xb7 Age-Based Dosing",color:"#00e5c0",gl:"rgba(0,229,192,0.07)",br:"rgba(0,229,192,0.28)"},
  {id:"awake",icon:"👁️",title:"Awake Intubation",sub:"Topicalization \xb7 Sedation \xb7 FOB \xb7 VL Technique",color:"#ff9f43",gl:"rgba(255,159,67,0.07)",br:"rgba(255,159,67,0.28)"},
];

const OVERVIEW = {
  rsi:{def:"Rapid Sequence Intubation (RSI): simultaneous induction agent + NMBA to achieve rapid unconsciousness and paralysis, minimizing the time between loss of protective reflexes and ETT placement. Pre-oxygenation is the most critical step — every additional minute extends safe apnea time.",bullets:["Pre-ox goal: SpO\u2082 >93\u201395% (ideally >96%) \u2014 NRB 15 L/min \xd7 3\u20135 min + NC 15 L/min apneic oxygenation","LEMON assessment before every intubation: Look, Evaluate 3-3-2, Mallampati, Obstruction, Neck mobility","ETCO\u2082 waveform capnography is the ONLY reliable confirmation \u2014 no waveform = esophageal placement","Post-intubation: start sedation + analgesia BEFORE paralytic wears off. RASS -1 to 0.","Post-intubation hypotension: tension PTX, auto-PEEP, vasodilation, cardiac tamponade \u2014 have push-dose epi ready"]},
  daw:{def:"Difficult Airway: any situation where a trained clinician faces difficulty with BMV and/or intubation. CICO (Cannot Intubate, Cannot Oxygenate) is a life-threatening emergency requiring immediate surgical airway. Follow DAS 2022 four-plan algorithm: Plan A \u2192 B \u2192 C \u2192 D.",bullets:["LEMON \u22653 = likely difficult laryngoscopy \xb7 HEAVEN \u22653 = high first-pass failure risk","Maximum 3 total laryngoscopy attempts \u2014 then declare failed airway, move to Plan B","Video laryngoscopy (VL) first-line for anticipated or encountered difficult airway","CICO: Declare aloud \u2192 Sugammadex 16 mg/kg if rocuronium used \u2192 Knife-Finger-Tube immediately","Difficult airway must be documented in EHR, discharge summary, and communicated to patient"]},
  dsi:{def:"Delayed Sequence Intubation (DSI): Weingart protocol using dissociative-dose ketamine (1\u20132 mg/kg IV) to achieve cooperative dissociation \u2014 allowing adequate pre-oxygenation in the agitated/uncooperative patient \u2014 BEFORE administering the paralytic. Ketamine at dissociative dose maintains airway reflexes and respiratory drive.",bullets:["Indication: combative/encephalopathic patient preventing adequate pre-oxygenation (SpO\u2082 <93%)","Ketamine 1\u20132 mg/kg IV dissociative (NOT full anesthesia) \u2192 patient cooperative but not obtunded","Maintain SpO\u2082 >93\u201395% over 3\u20135 min with NRB 15 L/min + NC 15 L/min DURING dissociation","Once SpO\u2082 >93% confirmed \u2192 proceed with standard paralytic (succinylcholine or rocuronium)","Key distinction: DSI uses ketamine for pre-oxygenation window only, NOT as the induction agent"]},
  peds:{def:"Pediatric airway management requires age- and weight-based adaptations. Anatomical differences: larger occiput (sniffing position differs), cephalad larynx (C2\u20133 vs adult C4\u20135), smaller cricothyroid membrane, obligate nasal breather under 3\u20136 months. Tube selection and drug dosing must be weight-based \u2014 use Broselow tape or age-based estimation.",bullets:["Weight estimate: (age + 4) \xd7 2 = approximate kg \xb7 Broselow tape preferred when available","ETT size (uncuffed): age/4 + 4 \xb7 ETT size (cuffed): age/4 + 3.5","Oral depth: age/2 + 12 cm at lip (confirm CXR: 1\u20132 cm above carina)","Atropine 0.02 mg/kg IV (min 0.1 mg, max 0.5 mg): prevents vagal bradycardia during laryngoscopy","Uncuffed tubes acceptable <8 years (cuffed acceptable at any age with low-pressure high-volume cuffs)"]},
  awake:{def:"Awake intubation is the gold standard for the anticipated impossible or physiologically precarious airway. The patient remains spontaneously ventilating and awake throughout \u2014 allowing bail-out if technique fails. Requires topicalization of the airway, careful sedation (NOT obtundation), and time for preparation.",bullets:["Indications: anticipated CICO/difficult airway, hemodynamic instability, suspected difficult mask, full stomach + difficult airway","Glycopyrrolate 0.2 mg IV (5 min prior): dries secretions \u2014 improves topicalization efficacy","Topicalization: atomized lidocaine 4% to oropharynx, nebulized lido 4% \xd7 10 min, or transtracheal injection","Sedation: ketamine 0.3\u20130.5 mg/kg IV (dissociative) OR dexmedetomidine 0.5\u20131 mcg/kg load","CRITICAL: never obtund the patient \u2014 loss of spontaneous ventilation = unsafe conversion to RSI"]},
};

const WORKUP = {
  rsi:[{icon:"👁️",label:"LEMON Airway Assessment",detail:"Look (facies, trauma, beard, obesity) \xb7 Evaluate 3-3-2 (mouth \u22653 fingers, thyroid-chin \u22653, hyoid-mouth \u22652) \xb7 Mallampati (III/IV = difficult) \xb7 Obstruction \xb7 Neck mobility."},{icon:"💉",label:"IV Access + Medications Drawn",detail:"Large-bore IV \xd71 min. All RSI meds drawn and labeled. Push-dose epi (10 mcg/mL) ready. Vasopressor on hand."},{icon:"📊",label:"Pre-oxygenation SpO\u2082",detail:"Target SpO\u2082 >93% before induction. If unable to reach 88% \u2192 do NOT withhold BMV."},{icon:"🌬️",label:"ETCO\u2082 Ready",detail:"Waveform capnography connected and tested before RSI. Colorimetric detector backup."},{icon:"🔧",label:"Difficult Airway Equipment",detail:"VL (charged), DL blades, ETT 6.0\u20138.5, stylet, bougie, iGEL/LMA sizes, 10cc syringe, surgical airway kit."},{icon:"🫺",label:"Post-Intubation Plan",detail:"CXR (ETT position), ABG, vent settings ordered, sedation + analgesia orders written before intubation."}],
  daw:[{icon:"👁️",label:"LEMON Score",detail:"Look 2pts, 3-3-2 (each criterion 1pt), Mallampati III=1pt/IV=2pts, Obstruction 2pts, Neck 1pt. Score \u22653 = high probability difficult."},{icon:"🚨",label:"HEAVEN Score",detail:"Hypoxemia, Extremes of size, Anatomy, Vomit/blood, Exsanguination, No NMBA. \u22653 = high first-pass failure risk."},{icon:"🔧",label:"Difficult Airway Cart",detail:"VL charged \xb7 all blade sizes \xb7 iGEL/LMA sizes 3\u20135 \xb7 bougie \xb7 Sugammadex 16 mg/kg drawn \xb7 scalpel/ETT 6.0 surgical kit."},{icon:"💊",label:"Sugammadex 16 mg/kg",detail:"Draw up BEFORE RSI if using rocuronium. IV push undiluted. Reverses NMB in ~3 min."},{icon:"📋",label:"Verbalize Plans A\u2013D",detail:"Aloud: Plan A=VL, Plan B=iGEL, Plan C=awaken/topicalize, Plan D=surgical airway. Assign team roles."}],
  dsi:[{icon:"📊",label:"SpO\u2082 (pre-DSI)",detail:"Document baseline SpO\u2082 on current support. DSI indicated when SpO\u2082 <93% AND patient preventing adequate pre-oxygenation due to agitation."},{icon:"😤",label:"Agitation Assessment",detail:"Reason for agitation: hypoxia, pain, encephalopathy, fear. Treating the underlying cause may resolve the problem without DSI."},{icon:"💉",label:"Standard RSI Prep",detail:"All standard RSI equipment and medications prepared as normal. DSI adds ketamine pre-step only \u2014 the rest proceeds identically."}],
  peds:[{icon:"📌",label:"Broselow Tape",detail:"Measure height \u2192 color zone = weight + pre-calculated drug doses. Most reliable for children <35 kg. Overrides formula estimates."},{icon:"👶",label:"Age + Weight",detail:"Confirm age and weight. Calculate: estimated weight = (age+4)\xd72. Verify against Broselow if available."},{icon:"🔧",label:"Equipment Sizing",detail:"ETT size, blade size, ETT depth, LMA size all age/weight-dependent. Calculate BEFORE airway emergency."}],
  awake:[{icon:"📋",label:"Airway Anatomy Assessment",detail:"LEMON + imaging if available. Identify specific challenge: limited mouth opening, fixed flexion, mass, tumor, prior surgery."},{icon:"⏱",label:"Time Available",detail:"Awake intubation requires 10\u201320 minutes for preparation (glycopyrrolate + topicalization). Confirm time allows this."},{icon:"💉",label:"Equipment",detail:"FOB (charged/checked) OR VL with topicalization \xb7 Atomizer (MAD) or nebulizer for lidocaine \xb7 Glycopyrrolate \xb7 Sedation agents drawn."}],
};

const TREATMENT = {
  rsi:[
    {cat:"Pre-oxygenation",drug:"NRB 15 L/min + NC 15 L/min",dose:"NRB 15 L/min \xd7 3\u20135 min \u2192 target SpO\u2082 >93%\nNC 15 L/min simultaneously (keep during laryngoscopy)\nHFNC 40\u201370 L/min (THRIVE) if time + equipment allow\nPosition: 20\u201330\xb0 head-up (improves FRC, reduces aspiration risk)",renal:"N/A",ivpo:"If SpO\u2082 cannot reach 88% \u2192 BMV pre-oxygenation. Do NOT withhold BMV for aspiration concern if patient is hypoxic.",deesc:"Continue NC apneic oxygenation throughout laryngoscopy. Remove once ETT confirmed by ETCO\u2082 waveform.",note:"Pre-oxygenation is the MOST IMPORTANT step in RSI. Every extra minute extends safe apnea time.",ref:"DAS 2015"},
    {cat:"Induction \u2014 Hemodynamically Stable",drug:"Etomidate 0.3 mg/kg IV",dose:"0.3 mg/kg IV over 30\u201360s\nOnset: 30\u201360s \xb7 Duration: 3\u20138 min\nAlternative: Propofol 1.5\u20132 mg/kg IV (AVOID if MAP <65)\nAlternative: Ketamine 1.5\u20132 mg/kg IV (shock/bronchospasm)",renal:"Hepatic metabolism \u2014 no renal adjustment.",ivpo:"Propofol 1.5\u20132 mg/kg: neuro indications, reduces ICP \u2014 AVOID if hemodynamically unstable.",deesc:"Single-dose adrenal suppression \u2014 acceptable in septic shock for single RSI dose.",note:"Most hemodynamically neutral induction agent. Preferred for most ED intubations.",ref:"UpToDate 2024"},
    {cat:"Induction \u2014 Shock / Bronchospasm",drug:"Ketamine 1.5\u20132.0 mg/kg IV",dose:"1.5\u20132.0 mg/kg IV (use 1.0\u20131.5 mg/kg if hemodynamically compromised)\nOnset: 30\u201360s \xb7 Duration: 10\u201320 min\nConsider midazolam 0.1 mg/kg to reduce emergence",renal:"Hepatic metabolism. No significant renal adjustment.",ivpo:"Add midazolam 1\u20132 mg IV PRN to reduce dysphoric emergence if time allows.",deesc:"AVOID in: hypertensive emergency (SBP >200), aortic dissection, active psychosis.",note:"FIRST-LINE for shock, hypotension, bronchospasm. Maintains hemodynamics via sympathomimetic effect.",ref:"UpToDate 2024"},
    {cat:"Paralytic \u2014 First Line",drug:"Succinylcholine 1.5 mg/kg IV",dose:"1.5 mg/kg IV push (max 200 mg)\nOnset: 45s \xb7 Duration: 10\u201315 min\nGive immediately after induction agent",renal:"Plasma cholinesterase degradation \u2014 no renal dose adjustment",ivpo:"No reversal agent. CONTRAINDICATED: K+ >5.5, burns >24\u201348h, crush/spinal injury >72h, NMD, MH history.",deesc:"Depolarizing NMBA \u2014 fasciculations cause transient K+ rise ~0.5\u20131.0 mEq/L. Short duration ideal if intubation uncertain.",note:"Preferred when succinylcholine not contraindicated. Short duration = bail-out option if difficult airway.",ref:"UpToDate 2024"},
    {cat:"Paralytic \u2014 Alternative",drug:"Rocuronium 1.2 mg/kg IV",dose:"RSI dose: 1.2\u20131.6 mg/kg IV push\nOnset 60\u201390s at 1.2 mg/kg (1.6 mg/kg \u2248 succinylcholine onset)\nDuration: 45\u201370 min\nREVERSAL: Sugammadex 16 mg/kg IV push \u2192 reverses in ~3 min",renal:"Hepatic elimination. Prolonged in hepatic failure.",ivpo:"MUST have sugammadex 16 mg/kg drawn at bedside before RSI if using rocuronium.",deesc:"Non-depolarizing NMBA. No contraindication in hyperkalemia. CICO reversal option with sugammadex.",note:"At 1.6 mg/kg onset approaches succinylcholine. Have sugammadex available whenever rocuronium used.",ref:"UpToDate 2024"},
    {cat:"Post-Intubation",drug:"Initial Vent + Sedation",dose:"Vent: TV 6\u20138 mL/kg IBW, RR 14, FiO\u2082 1.0, PEEP 5\nETT depth: 22\u201324 cm at lip (men) \xb7 20\u201322 cm at lip (women)\nConfirm: ETCO\u2082 waveform \xd76 + bilateral BS + CXR\nSedation: Propofol 5\u201350 mcg/kg/min OR midazolam 0.02\u20130.1 mg/kg/h\nAnalgesia: Fentanyl 25\u2013100 mcg/h (FIRST before sedative)",renal:"Fentanyl preferred in renal failure. Avoid morphine (active metabolite). Cisatracurium if NMB needed.",ivpo:"Initiate sedation + analgesia IMMEDIATELY. Do not leave patient paralyzed without sedation.",deesc:"Daily SAT. RASS target -1 to 0. Begin liberation when underlying cause improving.",note:"Start post-intubation sedation/analgesia IMMEDIATELY post-intubation.",ref:"PADIS 2018"},
  ],
  daw:[
    {cat:"Plan A \u2014 Video Laryngoscopy",drug:"VL First-Line",dose:"VL preferred: C-MAC D-blade, GlideScope, McGrath\nExternal laryngeal manipulation (ELM/BURP)\nBougie-assisted over epiglottis if grade III view\nMaximum 3 total attempts \u2014 then declare and proceed",renal:"N/A",ivpo:"Optimize between attempts: suction, HELIOX, different blade, different operator.",deesc:"Oxygenate between ALL attempts. SpO\u2082 <90% or declining \u2192 stop and oxygenate before next attempt.",note:"OXYGENATE between attempts. Accept Plan B sooner if SpO\u2082 falling.",ref:"DAS 2022"},
    {cat:"Plan B \u2014 Supraglottic Airway",drug:"iGEL or LMA Supreme (2nd gen)",dose:"iGEL: size 3 (30\u201360kg) / 4 (50\u201390kg) / 5 (>90kg)\nInsert midline, smooth insertion without rotation\nConfirm: seal pressure >25 cmH\u2082O, ETCO\u2082, bilateral BS",renal:"N/A",ivpo:"2nd generation SGAs provide gastric access + better aspiration protection. Always choose 2nd gen in ED.",deesc:"SGA = bridge. Facilitate FOB-guided intubation through SGA or plan formal airway within 1h.",note:"2nd gen SGA is NOT a definitive airway. Plan for intubation or tracheostomy.",ref:"DAS 2022"},
    {cat:"Plan C \u2014 Awake / Topicalize",drug:"Awake Intubation Protocol",dose:"Glycopyrrolate 0.2 mg IV (5 min before)\nTopicalization: Lidocaine 4% atomized to oropharynx\nSedation: Ketamine 0.3\u20130.5 mg/kg IV (dissociative)\nPatient AWAKE, spontaneously breathing throughout",renal:"Lidocaine: reduce in hepatic failure.",ivpo:"Awake nasal intubation (FOB or VL) if limited mouth opening or anterior larynx.",deesc:"Maintain spontaneous ventilation. Never deeply sedate in anticipated difficult airway.",note:"Patient remains breathing. Never lose spontaneous ventilation in anticipated difficult airway.",ref:"DAS 2022"},
    {cat:"Plan D \u2014 Surgical Airway (CICO)",drug:"Scalpel Cricothyrotomy",dose:"KNIFE: Stabilize larynx, stab incision through CTM\nFINGER: Index finger dilates opening, confirms trachea\nTUBE: Bougie into trachea, railload ETT 6.0 cuffed\nInflate cuff \u2192 ventilate \u2192 ETCO\u2082 confirm\nTarget: CICO to airway in <2 minutes",renal:"N/A",ivpo:"Sugammadex 16 mg/kg IV (if rocuronium used) \u2014 consider before surgical airway if oxygenation possible.",deesc:"Surgical cricothyrotomy is definitive. ENT tracheostomy within 24\u201372h.",note:"DECLARE CICO ALOUD. Stop all laryngoscopy. Proceed IMMEDIATELY. Every second counts.",ref:"DAS 2022 / eFONA"},
  ],
};

const FOLLOWUP = {
  rsi:["Confirm ETT position: ETCO\u2082 waveform \xd76 + CXR (2\u20133 cm above carina)","Initiate sedation + analgesia immediately post-intubation \u2014 RASS -1 to 0","Post-intubation hypotension: fluid bolus + push-dose epinephrine. Rule out tension PTX, tamponade, auto-PEEP.","Daily SAT+SBT pairing from Day 1. Liberation assessment every day.","Document intubation in chart: indication, technique, medications, attempts, confirmation method"],
  daw:["Document difficult airway in permanent medical record and alert system","Communicate to patient + family: 'You have a documented difficult airway \u2014 inform all future providers'","ENT/anesthesia consult for tracheostomy if CICO or prolonged intubation planned","Post-event team debrief within 24h: what worked, what didn\u2019t, equipment gaps","EHR alert: enter difficult airway flag so all future providers are notified"],
  dsi:["Confirm SpO\u2082 >93% after ketamine and before administering paralytic","Proceed with standard RSI after pre-oxygenation window achieved","Document ketamine dose, onset, and SpO\u2082 response in procedure note"],
  peds:["Confirm ETT size appropriate: no audible leak at 20\u201325 cmH\u2082O with uncuffed tube; cuff <20 cmH\u2082O with cuffed","Depth confirmation: CXR + direct visualization","Smaller tidal volumes for pediatric vents: 6\u20137 mL/kg IBW","Reassess drug dosing at every dose \u2014 pediatric dosing errors are common","Use weight-based references throughout ICU stay"],
  awake:["Document topicalization technique and quality of anesthesia","If topicalization inadequate \u2192 abandon and reattempt or call anesthesia","Once tube confirmed \u2192 deepens sedation + start analgesia","Plan for definitive management: is this a bridge or permanent airway?"],
};

const MDM_DATA = {
  rsi:{fields:[{id:"ind",lbl:"Indication",ph:"e.g., hypoxic resp failure"},{id:"lemon",lbl:"Airway Assessment",ph:"e.g., LEMON favorable"},{id:"agent",lbl:"Agents Used",ph:"e.g., etomidate 20mg + succ 140mg"}],t:(f)=>`Urgent RSI performed for ${f.ind||"[indication]"}. Airway assessment: ${f.lemon||"LEMON criteria reviewed \u2014 no difficult features identified"}. Risks of RSI weighed against continued hypoxemia. Agents: ${f.agent||"[induction + paralytic + dose]"}. Pre-oxygenation with NRB 15 L/min \xd7 3\u20135 min + NC 15 L/min apneic. Difficult airway equipment at bedside. Team briefed on Plans A\u2013D. ETT confirmed via continuous ETCO\u2082 waveform. Sedation + analgesia initiated immediately post-intubation.`},
  daw:{fields:[{id:"enc",lbl:"Encounter",ph:"e.g., Grade III view on VL, 2 attempts"},{id:"plan",lbl:"Plans Used",ph:"e.g., Plan A x2 \u2192 Plan B iGEL"},{id:"out",lbl:"Outcome",ph:"e.g., successfully intubated on attempt 3"}],t:(f)=>`Difficult airway management required: ${f.enc||"[encounter]"}. DAS 2022 four-plan framework followed: ${f.plan||"[plans]"}. Outcome: ${f.out||"[outcome]"}. Difficult airway documented in permanent record. Patient and family informed to notify all future providers. EHR alert placed. ENT/anesthesia notified.`},
};

const ORDER_SETS = {
  rsi:{label:"Post-Intubation Orders",icon:"\ud83d\udc89",color:"#f5c842",sets:[
    {title:"Ventilator",text:`MECHANICAL VENTILATION \u2014 POST-INTUBATION\nMode: Volume Control A/C\nTidal Volume: 6\u20138 mL/kg IBW (calculate from height)\nRR: 14/min | FiO\u2082: 1.0 (wean) | PEEP: 5 cmH\u2082O\nInspiratory pause: 0.5 sec | ETCO\u2082: continuous waveform\nCXR: STAT (tube position verification)`},
    {title:"Sedation",text:`SEDATION + ANALGESIA (Analgesia-First)\nFentanyl 25\u2013100 mcg/h IV \u2014 titrate to CPOT <3\nPropofol 5\u201350 mcg/kg/min IV \u2014 titrate to RASS -1 to 0\nRASS goal: -1 to 0 | CAM-ICU q12h\nPush-dose epi 10\u201320 mcg IV PRN post-intubation hypotension`},
    {title:"Labs",text:`POST-INTUBATION LABS\nABG: STAT \xb7 BMP: STAT \xb7 CBC: STAT\nRepeat ABG: 30\u201360 min after vent changes\nSpO\u2082: continuous \xb7 BP: q1h or arterial line`},
  ]},
};

const QUICK_REF = {
  rsi:["Pre-ox: NRB 15 L/min \xd7 3\u20135 min + NC 15 L/min apneic \u2192 SpO\u2082 >93%","Etomidate 0.3 mg/kg (stable) \xb7 Ketamine 1.5 mg/kg (shock/bronchospasm)","Succinylcholine 1.5 mg/kg max 200 mg \xb7 Rocuronium 1.2 mg/kg (need sugammadex)","Max 3 total attempts \u2192 declare failed \u2192 Plan B (iGEL)","Confirm ETT with ETCO\u2082 waveform \xd76 breaths ONLY"],
  daw:["LEMON \u22653 = likely difficult \xb7 HEAVEN \u22653 = high first-pass failure","Plans: A=VL \u2192 B=iGEL/LMA \u2192 C=Awaken/Topicalize \u2192 D=Surgical","CICO: Knife-Finger-Tube through cricothyroid membrane in <2 min","Sugammadex 16 mg/kg IV \u2014 reverses rocuronium in ~3 min","Declare CICO aloud \u2014 stop all laryngoscopy immediately"],
  dsi:["DSI indicated: combative + hypoxic + preventing pre-oxygenation","Ketamine 1\u20132 mg/kg IV dissociative (NOT full anesthesia)","Wait 3\u20135 min, maintain pre-ox (NRB + NC) until SpO\u2082 >93%","Then paralytic: succinylcholine 1.5 mg/kg or rocuronium 1.2 mg/kg","Key: ketamine maintains airway reflexes at dissociative dose"],
  peds:["Weight: (age+4)\xd72 kg \xb7 Broselow tape preferred when available","ETT uncuffed: age/4+4 \xb7 ETT cuffed: age/4+3.5","Oral depth: age/2+12 cm \xb7 Confirm 1\u20132 cm above carina on CXR","Atropine 0.02 mg/kg IV (min 0.1, max 0.5) prevents bradycardia","Blade: Miller 0\u20131 (<1yr) \xb7 Miller 1\u20132 (1\u20138yr) \xb7 Mac 2\u20133 (>8yr)"],
  awake:["Glycopyrrolate 0.2 mg IV 5 min before: dries secretions","Topicalize: atomized lido 4% oropharynx OR neb lido \xd710 min","Sedation: ketamine 0.3\u20130.5 mg/kg IV dissociative (maintains drive)","NEVER lose spontaneous ventilation \u2014 keep patient awake + breathing","Bail-out always available: patient still awake and breathing if technique fails"],
};

/* ═══ RSI CALCULATOR ════════════════════════════════════════════════ */
function RSICalc() {
  const params = new URLSearchParams(window.location.search);
  const [wt,setWt] = useState(params.get("weight")||"");
  const [unit,setUnit] = useState(params.get("weightUnit")||"kg");
  const wKg = unit==="lb" ? parseFloat(wt)*0.453592 : parseFloat(wt);
  const v = !isNaN(wKg) && wKg>0;
  const d = (mg,mx) => { if(!v)return "\u2014"; const x=Math.round(wKg*mg*10)/10; return (mx?Math.min(x,mx):x)+" mg"; };
  const groups = [
    {label:"Induction",color:T.gold,items:[["Etomidate 0.3",0.3,null,"Hemodynamically neutral"],["Ketamine 1.5",1.5,null,"Shock / bronchospasm"],["Propofol 1.5",1.5,null,"Neuro \u2014 AVOID if MAP <65"]]},
    {label:"Paralytics",color:T.coral,items:[["Succinylcholine 1.5",1.5,200,"45s onset \xb7 10\u201315 min"],["Rocuronium 1.2",1.2,null,"60\u201390s onset \xb7 45\u201370 min"],["Rocuronium 1.6 (RSI speed)",1.6,null,"Faster onset \u2248 succinylcholine"]]},
    {label:"Reversal",color:T.green,items:[["Sugammadex 4 (routine)",4,null,"End-procedure NMB reversal"],["Sugammadex 16 (CICO)",16,null,"Immediate reversal \u2014 3 min"]]},
  ];
  const inp = {background:"rgba(14,37,68,0.7)",border:`1px solid ${T.b}`,borderRadius:8,padding:"8px 12px",color:T.txt,fontFamily:"monospace",fontSize:13,outline:"none"};
  return (
    <div style={{background:"rgba(245,200,66,0.05)",border:"1px solid rgba(245,200,66,0.25)",borderRadius:12,padding:"14px 16px",marginBottom:12}}>
      <div style={{fontSize:11,fontWeight:700,color:T.txt,marginBottom:10}}>💉 RSI Weight-Based Drug Calculator</div>
      <div style={{display:"flex",gap:8,marginBottom:12}}>
        <input type="number" placeholder="Patient weight..." value={wt} onChange={e=>setWt(e.target.value)} style={{...inp,flex:1,border:"1px solid rgba(245,200,66,0.35)"}} />
        <div style={{display:"flex",borderRadius:8,overflow:"hidden",border:`1px solid ${T.b}`}}>
          {["kg","lb"].map(u=><button key={u} onClick={()=>setUnit(u)} style={{padding:"8px 14px",cursor:"pointer",border:"none",background:unit===u?"rgba(245,200,66,0.2)":"rgba(14,37,68,0.5)",color:unit===u?T.gold:T.txt3,fontSize:11,fontWeight:700}}>{u}</button>)}
        </div>
      </div>
      {groups.map((g,gi)=>(
        <div key={gi} style={{marginBottom:10}}>
          <div style={{fontSize:9,fontWeight:700,color:g.color,textTransform:"uppercase",letterSpacing:".08em",marginBottom:5}}>{g.label}</div>
          {g.items.map(([name,mg,mx,note],i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:8,background:"rgba(14,37,68,0.5)",border:`1px solid ${T.b}`,borderRadius:8,padding:"7px 12px",marginBottom:4}}>
              <div style={{flex:1}}><div style={{fontSize:11,fontWeight:600,color:T.txt}}>{name}</div><div style={{fontSize:9,color:T.txt3}}>{note}{mx?` \xb7 max ${mx}mg`:""}</div></div>
              <div style={{fontSize:15,fontWeight:700,color:g.color,fontFamily:"monospace",minWidth:60,textAlign:"right"}}>{d(mg,mx)}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ═══ SOAP-ME CHECKLIST ══════════════════════════════════════════════ */
const SOAP_ITEMS = [
  {key:"S",label:"Suction",color:T.blue,items:["Yankauer suction \u2014 on and working","Connected to wall suction","Within arm reach of intubator"]},
  {key:"O",label:"Oxygen",color:T.teal,items:["NRB running at 15 L/min on patient","NC 15 L/min ready for apneic oxygenation","ETCO\u2082 waveform detector connected + tested","HFNC ready if available"]},
  {key:"A",label:"Airway Equipment",color:T.gold,items:["Video laryngoscope charged + blade attached","DL blades (Mac 3-4, Miller 2)","ETT sizes available (6.5, 7.0, 7.5, 8.0)","Stylet shaped 30\u00b0 angle","10cc syringe for cuff","ETT tape / holder ready","Bougie available","iGEL/LMA backup sizes 3, 4, 5"]},
  {key:"P",label:"Pharmacy",color:T.coral,items:["Induction agent drawn + labeled","Paralytic drawn + labeled","Push-dose epinephrine 10 mcg/mL drawn","Sugammadex 16 mg/kg drawn (if rocuronium)","Vasopressor accessible (epi, norepinephrine)"]},
  {key:"M",label:"Monitoring",color:T.orange,items:["SpO\u2082 continuous \u2014 displayed prominently","EKG \u2014 rate visible","BP cuff cycling q2\u20133 min","At least one large-bore IV access confirmed patent","Bed in flat/ramped position"]},
  {key:"E",label:"End-Tidal CO\u2082",color:T.green,items:["Waveform ETCO\u2082 ready and confirmed","Colorimetric detector backup present","Ventilator settings pre-set","Team roles verbalized: intubator, medications, documentation, monitoring"]},
];

function SOAPMe() {
  const [done,setDone] = useState({});
  const total = SOAP_ITEMS.reduce((a,s)=>a+s.items.length,0);
  const checked = Object.keys(done).filter(k=>done[k]).length;
  const ready = checked===total;
  return (
    <div style={{background:"rgba(14,37,68,0.4)",border:`1px solid ${T.b}`,borderRadius:12,padding:"14px 16px",marginBottom:12}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
         <span style={{fontSize:14}}>📋</span>
         <div style={{flex:1}}><div style={{fontSize:11,fontWeight:700,color:T.txt}}>SOAP-ME Pre-Intubation Checklist</div><div style={{fontSize:9,color:T.txt4}}>Complete all items before proceeding with RSI</div></div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:13,fontWeight:700,color:ready?T.green:T.gold,fontFamily:"monospace"}}>{checked}/{total}</div>
          {ready && <div style={{fontSize:9,color:T.green,fontWeight:700}}>\u2713 READY</div>}
        </div>
      </div>
      <div style={{height:3,background:"rgba(14,37,68,0.8)",borderRadius:2,marginBottom:12,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${(checked/total)*100}%`,background:ready?T.green:T.gold,borderRadius:2,transition:"width .3s"}} />
      </div>
      {SOAP_ITEMS.map(s=>(
        <div key={s.key} style={{marginBottom:10}}>
          <div style={{fontSize:10,fontWeight:700,color:s.color,marginBottom:5,display:"flex",alignItems:"center",gap:6}}>
            <span style={{width:22,height:22,borderRadius:6,background:`${s.color}18`,border:`1px solid ${s.color}40`,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:9}}>{s.key}</span>
            {s.label}
          </div>
          {s.items.map((item,i)=>{
            const k=`${s.key}-${i}`;
            return (
              <div key={k} onClick={()=>setDone(p=>({...p,[k]:!p[k]}))} style={{display:"flex",gap:8,alignItems:"center",padding:"5px 8px",borderRadius:7,background:done[k]?"rgba(61,255,160,0.06)":"rgba(8,22,40,0.4)",border:`1px solid ${done[k]?"rgba(61,255,160,0.25)":T.b}`,marginBottom:3,cursor:"pointer"}}>
                <div style={{width:16,height:16,borderRadius:4,border:`1px solid ${done[k]?T.green+"55":T.b}`,background:done[k]?"rgba(61,255,160,0.2)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:T.green,flexShrink:0}}>{done[k]?"\u2713":""}</div>
                <span style={{fontSize:10,color:done[k]?T.teal:T.txt2}}>{item}</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* ═══ LEMON / HEAVEN SCORER ═════════════════════════════════════════ */
function LemonHeaven() {
  const [lemon,setLemon] = useState({});
  const [heaven,setHeaven] = useState({});
  const LEMON_C = [
    {k:"look",lbl:"Look Externally",detail:"Unusual facies, beard, trauma, morbid obesity, neck mass",pts:2},
    {k:"e332a",lbl:"Eval 3-3-2: Mouth <3 fingers",detail:"Mouth opening less than 3 finger-breadths",pts:1},
    {k:"e332b",lbl:"Eval 3-3-2: Thyroid-chin <3 fingers",detail:"Thyroid cartilage to chin less than 3 finger-breadths",pts:1},
    {k:"e332c",lbl:"Eval 3-3-2: Hyoid-mouth <2 fingers",detail:"Hyoid bone to floor of mouth less than 2 finger-breadths",pts:1},
    {k:"mall3",lbl:"Mallampati Class III",detail:"Soft palate, uvula base visible only",pts:1},
    {k:"mall4",lbl:"Mallampati Class IV",detail:"Hard palate only visible",pts:2},
    {k:"obs",lbl:"Obstruction",detail:"Peritonsillar abscess, epiglottitis, hematoma, foreign body",pts:2},
    {k:"neck",lbl:"Neck Mobility Limited",detail:"Trauma (collar), severe OA, prior cervical surgery, obesity",pts:1},
  ];
  const HEAVEN_C = [
    {k:"hyp",lbl:"Hypoxemia",detail:"SpO\u2082 <93% despite supplemental O\u2082"},
    {k:"ext",lbl:"Extremes of Size",detail:"Morbid obesity (BMI >40) or pediatric (<10 kg)"},
    {k:"anat",lbl:"Anatomical Difficulty",detail:"Abnormal anatomy, mass, prior airway surgery, tracheostomy scar"},
    {k:"vom",lbl:"Vomit / Blood",detail:"Active vomiting, hemoptysis, blood/secretions obscuring view"},
    {k:"exs",lbl:"Exsanguination",detail:"Hemorrhagic shock — less time for failed attempt"},
    {k:"nmb",lbl:"No NMBA",detail:"Succinylcholine contraindicated AND no rocuronium/sugammadex available"},
  ];
  const lScore = LEMON_C.reduce((a,c)=>a+(lemon[c.k]?c.pts:0),0);
  const hScore = HEAVEN_C.filter(c=>heaven[c.k]).length;
  const lRisk = lScore<3?{l:"Low Risk",c:T.teal}:lScore<6?{l:"Moderate Difficulty",c:T.gold}:{l:"High Difficulty",c:T.coral};
  const hRisk = hScore<2?{l:"Standard Risk",c:T.teal}:hScore<4?{l:"Elevated Risk",c:T.gold}:{l:"High Failure Risk",c:T.coral};
  const tog = (set,k)=>set(p=>({...p,[k]:!p[k]}));
  return (
    <div style={{background:"rgba(255,107,107,0.05)",border:"1px solid rgba(255,107,107,0.22)",borderRadius:12,padding:"14px 16px",marginBottom:12}}>
      <div style={{fontSize:11,fontWeight:700,color:T.txt,marginBottom:12}}>👁️ LEMON / HEAVEN Airway Risk Assessment</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <div>
          <div style={{fontSize:9,fontWeight:700,color:T.coral,textTransform:"uppercase",letterSpacing:".07em",marginBottom:8}}>LEMON \u2014 Difficult Laryngoscopy</div>
          {LEMON_C.map(c=>(
            <div key={c.k} onClick={()=>tog(setLemon,c.k)} style={{display:"flex",gap:7,padding:"5px 7px",borderRadius:7,border:`1px solid ${lemon[c.k]?T.coral+"45":T.b}`,background:lemon[c.k]?"rgba(255,107,107,0.09)":"rgba(8,22,40,0.4)",cursor:"pointer",marginBottom:3,alignItems:"flex-start"}}>
              <div style={{width:14,height:14,borderRadius:3,border:`1px solid ${lemon[c.k]?T.coral+"60":T.b}`,background:lemon[c.k]?"rgba(255,107,107,0.25)":"transparent",flexShrink:0,marginTop:1,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:T.coral}}>{lemon[c.k]?"\u2713":""}</div>
              <div><div style={{fontSize:10,color:lemon[c.k]?T.coral:T.txt2}}>{c.lbl}</div><div style={{fontSize:8,color:T.txt4}}>{c.detail} (+{c.pts})</div></div>
            </div>
          ))}
          <div style={{marginTop:8,padding:"7px 10px",borderRadius:8,background:`${lRisk.c}12`,border:`1px solid ${lRisk.c}35`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:11,fontWeight:700,color:lRisk.c}}>{lRisk.l}</span>
            <span style={{fontSize:16,fontWeight:700,color:lRisk.c,fontFamily:"monospace"}}>{lScore}</span>
          </div>
        </div>
        <div>
          <div style={{fontSize:9,fontWeight:700,color:T.gold,textTransform:"uppercase",letterSpacing:".07em",marginBottom:8}}>HEAVEN \u2014 First-Pass Failure</div>
          {HEAVEN_C.map(c=>(
            <div key={c.k} onClick={()=>tog(setHeaven,c.k)} style={{display:"flex",gap:7,padding:"5px 7px",borderRadius:7,border:`1px solid ${heaven[c.k]?T.gold+"45":T.b}`,background:heaven[c.k]?"rgba(245,200,66,0.09)":"rgba(8,22,40,0.4)",cursor:"pointer",marginBottom:3,alignItems:"flex-start"}}>
              <div style={{width:14,height:14,borderRadius:3,border:`1px solid ${heaven[c.k]?T.gold+"60":T.b}`,background:heaven[c.k]?"rgba(245,200,66,0.25)":"transparent",flexShrink:0,marginTop:1,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:T.gold}}>{heaven[c.k]?"\u2713":""}</div>
              <div><div style={{fontSize:10,color:heaven[c.k]?T.gold:T.txt2}}>{c.lbl}</div><div style={{fontSize:8,color:T.txt4}}>{c.detail}</div></div>
            </div>
          ))}
          <div style={{marginTop:8,padding:"7px 10px",borderRadius:8,background:`${hRisk.c}12`,border:`1px solid ${hRisk.c}35`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:11,fontWeight:700,color:hRisk.c}}>{hRisk.l}</span>
            <span style={{fontSize:16,fontWeight:700,color:hRisk.c,fontFamily:"monospace"}}>{hScore}/6</span>
          </div>
        </div>
      </div>
      {(lScore>=3||hScore>=3) && <div style={{marginTop:10,padding:"8px 12px",background:"rgba(255,107,107,0.1)",border:"1px solid rgba(255,107,107,0.3)",borderRadius:8,fontSize:10,color:T.coral,fontWeight:600}}>⚠️ High-risk airway: use video laryngoscopy first-line \xb7 have difficult airway equipment at bedside \xb7 verbalize Plans A\u2013D to team</div>}
    </div>
  );
}

/* ═══ PUSH-DOSE EPI + POST-INTUBATION HEMODYNAMICS ══════════════════ */
function HemoPanel() {
  const [wt,setWt] = useState("");
  const wKg = parseFloat(wt);
  const valid = !isNaN(wKg) && wKg>0;
  return (
    <div style={{background:"rgba(255,107,107,0.05)",border:"1px solid rgba(255,107,107,0.22)",borderRadius:12,padding:"14px 16px",marginBottom:12}}>
      <div style={{fontSize:11,fontWeight:700,color:T.txt,marginBottom:10}}>💩 Peri-Intubation Hemodynamics</div>
      <div style={{background:"rgba(245,200,66,0.07)",border:"1px solid rgba(245,200,66,0.25)",borderRadius:10,padding:"12px",marginBottom:10}}>
        <div style={{fontSize:10,fontWeight:700,color:T.gold,marginBottom:8}}>Push-Dose Epinephrine Preparation</div>
        <div style={{fontSize:10,color:T.txt2,lineHeight:1.8,fontFamily:"monospace"}}>
          Step 1: Start with Epi 1 mg/mL (standard 1:1000 amp)<br/>
          Step 2: Take 1 mL epi &rarr; add 9 mL NS &rarr; = 100 mcg/mL<br/>
          Step 3: Take 1 mL of that &rarr; add 9 mL NS &rarr; = <strong style={{color:T.gold}}>10 mcg/mL</strong><br/>
          Dose: 10&ndash;20 mcg IV push (1&ndash;2 mL of 10 mcg/mL solution)
        </div>
        <div style={{marginTop:8,display:"flex",gap:6,alignItems:"center"}}>
          <input type="number" placeholder="Weight (kg)" value={wt} onChange={e=>setWt(e.target.value)} style={{background:"rgba(14,37,68,0.7)",border:"1px solid rgba(245,200,66,0.3)",borderRadius:7,padding:"6px 10px",color:T.txt,fontFamily:"monospace",fontSize:11,outline:"none",width:130}} />
          {valid && <span style={{fontSize:11,color:T.gold,fontFamily:"monospace"}}>Push-dose epi: <strong>{(wKg*0.1).toFixed(0)}&ndash;{(wKg*0.2).toFixed(0)} mcg</strong> (0.1&ndash;0.2 mcg/kg)</span>}
        </div>
      </div>
      <div style={{fontSize:9,fontWeight:700,color:T.coral,textTransform:"uppercase",letterSpacing:".07em",marginBottom:8}}>Post-Intubation Hypotension Differential</div>
      {[["Tension PTX","\u26a0\ufe0f","Absent unilateral BS \xb7 tracheal deviation \xb7 POCUS \u2192 needle decompression 2nd ICS MCL"],["Auto-PEEP","\ud83c\udf2c\ufe0f","COPD/asthma \u2192 disconnect ventilator briefly \u2192 passive exhalation restores hemodynamics"],["Pericardial Tamponade","\ud83d\udccc","Beck triad: hypotension, JVD, muffled heart sounds \u2192 POCUS \u2192 pericardiocentesis"],["Post-intubation Vasodilation","\ud83d\udc89","Propofol/meds \u2192 500 mL fluid bolus + push-dose epi \u2192 vasopressor if persistent"],["Relative Hypovolemia","\ud83d\udca7","Pre-existing hypovolemia unmasked by positive pressure \u2192 fluid bolus 500\u20131000 mL"]].map(([t,ic,dd])=>(
        <div key={t} style={{display:"flex",gap:8,padding:"7px 10px",background:"rgba(14,37,68,0.4)",border:`1px solid ${T.b}`,borderRadius:8,marginBottom:4,alignItems:"flex-start"}}>
          <span style={{fontSize:14,flexShrink:0}}>{ic}</span>
          <div><div style={{fontSize:10,fontWeight:600,color:T.txt}}>{t}</div><div style={{fontSize:9,color:T.txt3}}>{dd}</div></div>
        </div>
      ))}
    </div>
  );
}

/* ═══ PEDIATRIC AIRWAY ══════════════════════════════════════════════ */
function PedsAirway() {
  const [age,setAge] = useState("");
  const [wt,setWt] = useState("");
  const a = parseFloat(age); const w = parseFloat(wt)||((a+4)*2);
  const validA = !isNaN(a) && a>=0 && a<=16;
  const ettUncuffed = validA ? (a/4+4).toFixed(1) : "\u2014";
  const ettCuffed   = validA ? (a/4+3.5).toFixed(1) : "\u2014";
  const depth       = validA ? (a/2+12).toFixed(0) : "\u2014";
  const blade = !validA ? "\u2014" : a<1 ? "Miller 0\u20131" : a<8 ? "Miller 1\u20132" : "Mac 2\u20133";
  const estWt = validA ? ((a+4)*2).toFixed(0) : "\u2014";
  const atrop = w>0 ? `${Math.max(0.1,Math.min(0.5,Math.round(w*0.02*100)/100)).toFixed(2)} mg` : "\u2014";
  const etomid = w>0 ? `${(w*0.3).toFixed(1)} mg` : "\u2014";
  const succin = w>0 ? `${Math.min(200,w*1.5).toFixed(0)} mg` : "\u2014";
  const roc   = w>0 ? `${(w*1.2).toFixed(1)} mg` : "\u2014";
  const inp = {background:"rgba(14,37,68,0.7)",border:"1px solid rgba(0,229,192,0.3)",borderRadius:7,padding:"7px 10px",color:T.txt,fontFamily:"monospace",fontSize:11,outline:"none"};
  return (
    <div style={{background:"rgba(0,229,192,0.05)",border:"1px solid rgba(0,229,192,0.22)",borderRadius:12,padding:"14px 16px",marginBottom:12}}>
      <div style={{fontSize:11,fontWeight:700,color:T.txt,marginBottom:10}}>👶 Pediatric Airway Calculator</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
        <div><div style={{fontSize:9,color:T.txt4,textTransform:"uppercase",marginBottom:3}}>Age (years)</div><input type="number" placeholder="e.g. 5" value={age} onChange={e=>setAge(e.target.value)} style={{...inp,width:"100%"}} /></div>
        <div><div style={{fontSize:9,color:T.txt4,textTransform:"uppercase",marginBottom:3}}>Actual Weight (kg, optional)</div><input type="number" placeholder={validA?`Est. ${estWt} kg`:"—"} value={wt} onChange={e=>setWt(e.target.value)} style={{...inp,width:"100%"}} /></div>
      </div>
      {validA && (
        <div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:10}}>
            {[["ETT Uncuffed",ettUncuffed+" mm",T.teal],["ETT Cuffed",ettCuffed+" mm",T.blue],["Oral Depth",depth+" cm",T.gold]].map(([l,val,c])=>(
              <div key={l} style={{textAlign:"center",background:`${c}10`,border:`1px solid ${c}30`,borderRadius:8,padding:"8px"}}>
                <div style={{fontSize:8,color:T.txt4,textTransform:"uppercase",marginBottom:2}}>{l}</div>
                <div style={{fontSize:16,fontWeight:700,color:c,fontFamily:"monospace"}}>{val}</div>
              </div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:6,marginBottom:8}}>
            {[["Blade",blade],["Est. Weight",estWt+" kg"],["Atropine (0.02 mg/kg)",atrop],["Etomidate 0.3",etomid]].map(([l,val])=>(
              <div key={l} style={{background:"rgba(14,37,68,0.5)",border:`1px solid ${T.b}`,borderRadius:7,padding:"6px 10px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:9,color:T.txt3}}>{l}</span><span style={{fontSize:11,fontWeight:700,color:T.txt,fontFamily:"monospace"}}>{val}</span>
              </div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
            {[["Succinylcholine 1.5",succin],["Rocuronium 1.2",roc]].map(([l,val])=>(
              <div key={l} style={{background:"rgba(14,37,68,0.5)",border:`1px solid ${T.b}`,borderRadius:7,padding:"6px 10px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:9,color:T.txt3}}>{l}</span><span style={{fontSize:11,fontWeight:700,color:T.coral,fontFamily:"monospace"}}>{val}</span>
              </div>
            ))}
          </div>
          <div style={{marginTop:8,fontSize:9,color:T.txt4,fontFamily:"monospace"}}>Atropine 0.02 mg/kg IV (min 0.1 mg, max 0.5 mg) \u2014 prevents vagal bradycardia \xb7 Verify weight with Broselow tape</div>
        </div>
      )}
      {!validA && <div style={{fontSize:10,color:T.txt4,textAlign:"center",padding:"10px 0"}}>Enter patient age (0\u201316 years) to calculate sizing</div>}
    </div>
  );
}

/* ═══ DSI PROTOCOL ══════════════════════════════════════════════════ */
function DSIProtocol() {
  const params = new URLSearchParams(window.location.search);
  const [wt,setWt] = useState(params.get("weight")||"");
  const [step,setStep] = useState(0);
  const [spo2,setSpo2] = useState("");
  const [elapsed,setElapsed] = useState(0);
  const [running,setRunning] = useState(false);
  const wKg = parseFloat(wt);
  const ketDose = !isNaN(wKg)&&wKg>0 ? `${(wKg*1.5).toFixed(0)}\u2013${(wKg*2).toFixed(0)} mg` : "[1.5\u20132.0 mg/kg]";
  const fmt = s=>`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const toggleTimer = () => {
    if(running){ clearInterval(window._dsi_timer); setRunning(false); }
    else { window._dsi_timer=setInterval(()=>setElapsed(p=>p+1),1000); setRunning(true); }
  };
  const STEPS = [
    {n:1,title:"Indication Confirmed",color:T.gold,body:"Patient is combative/uncooperative AND cannot maintain SpO\u2082 >93% despite supplemental O\u2082. Standard pre-oxygenation is failing due to patient behavior. DSI is NOT indicated if patient can cooperate with NRB."},
    {n:2,title:"Give Ketamine (Dissociative Dose)",color:T.purple,body:`Ketamine ${ketDose} IV push (dissociative dose, NOT full RSI induction).\nOnset: 30\u201360s. Patient will dissociate \u2014 eyes may remain open.\nDo NOT give paralytic yet \u2014 patient maintains airway reflexes + respiratory drive at this dose.`},
    {n:3,title:"Pre-Oxygenate During Dissociation",color:T.blue,body:"Place NRB 15 L/min + NC 15 L/min. Patient is now cooperative (dissociated).\nMonitor SpO\u2082 \u2014 target >93\u201395% sustained over 3\u20135 minutes.\nActivate timer below \u2014 3\u20135 minutes of quality pre-oxygenation."},
    {n:4,title:"Confirm SpO\u2082 >93% \u2192 Proceed RSI",color:T.teal,body:"Once SpO\u2082 >93% achieved and sustained \u2192 administer paralytic (succinylcholine 1.5 mg/kg or rocuronium 1.2 mg/kg).\nDo NOT need separate induction agent \u2014 ketamine IS the induction agent at higher cumulative dose.\nProceed with standard laryngoscopy."},
  ];
  const s = STEPS[step];
  return (
    <div style={{background:"rgba(155,109,255,0.06)",border:"1px solid rgba(155,109,255,0.25)",borderRadius:12,padding:"14px 16px",marginBottom:12}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
         <span style={{fontSize:14}}>🔎</span>
         <div style={{flex:1}}><div style={{fontSize:11,fontWeight:700,color:T.txt}}>DSI \u2014 Delayed Sequence Intubation</div><div style={{fontSize:9,color:T.txt4}}>Weingart protocol \xb7 ketamine pre-oxygenation window</div></div>
        <input type="number" placeholder="Weight kg" value={wt} onChange={e=>setWt(e.target.value)} style={{width:90,background:"rgba(14,37,68,0.7)",border:"1px solid rgba(155,109,255,0.3)",borderRadius:7,padding:"5px 8px",color:T.txt,fontFamily:"monospace",fontSize:11,outline:"none"}} />
      </div>
      <div style={{display:"flex",gap:4,marginBottom:12}}>
        {STEPS.map((st,i)=><div key={i} onClick={()=>setStep(i)} style={{flex:1,height:4,borderRadius:2,background:i===step?st.color:i<step?"rgba(61,255,160,0.5)":"rgba(26,53,85,0.6)",cursor:"pointer"}} />)}
      </div>
      <div style={{background:`${s.color}10`,border:`1px solid ${s.color}30`,borderRadius:10,padding:"12px 14px",marginBottom:10}}>
        <div style={{fontSize:10,fontWeight:700,color:s.color,marginBottom:6}}>Step {s.n}: {s.title}</div>
        <div style={{fontSize:11,color:T.txt2,lineHeight:1.65,whiteSpace:"pre-wrap"}}>{s.body}</div>
      </div>
      {step===2 && (
        <div style={{background:"rgba(14,37,68,0.5)",border:`1px solid ${T.b}`,borderRadius:10,padding:"10px 12px",display:"flex",gap:12,alignItems:"center"}}>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:22,fontWeight:700,color:elapsed>=180?T.green:T.blue,fontFamily:"monospace"}}>{fmt(elapsed)}</div>
            <div style={{fontSize:9,color:T.txt4}}>Pre-ox timer</div>
          </div>
          <div style={{flex:1}}>
            <div style={{height:4,background:"rgba(14,37,68,0.8)",borderRadius:2,marginBottom:6,overflow:"hidden"}}><div style={{height:"100%",width:`${Math.min((elapsed/300)*100,100)}%`,background:elapsed>=180?T.green:T.blue,transition:"width .5s"}} /></div>
            <div style={{fontSize:9,color:T.txt3}}>Target: 3\u20135 minutes quality pre-oxygenation</div>
          </div>
          <div style={{display:"flex",gap:4}}>
            <button onClick={toggleTimer} style={{padding:"6px 12px",borderRadius:7,border:`1px solid ${T.blue}50`,background:"rgba(59,158,255,0.1)",color:T.blue,fontSize:11,fontWeight:700,cursor:"pointer"}}>{running?"\u23f8":"\u25b6"}</button>
            <button onClick={()=>{clearInterval(window._dsi_timer);setElapsed(0);setRunning(false);}} style={{padding:"6px 10px",borderRadius:7,border:`1px solid ${T.b}`,background:"rgba(14,37,68,0.5)",color:T.txt4,fontSize:11,cursor:"pointer"}}>\u21ba</button>
          </div>
        </div>
      )}
      {step===2 && <div style={{marginTop:8}}>
        <div style={{fontSize:9,color:T.txt4,marginBottom:4}}>Current SpO\u2082:</div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <input type="number" placeholder="e.g. 95" value={spo2} onChange={e=>setSpo2(e.target.value)} style={{width:80,background:"rgba(14,37,68,0.7)",border:"1px solid rgba(0,229,192,0.3)",borderRadius:7,padding:"6px 8px",color:T.txt,fontFamily:"monospace",fontSize:12,outline:"none"}} />
          <span style={{fontSize:11,color:T.txt3}}>%</span>
          {parseFloat(spo2)>=93 && <span style={{fontSize:11,fontWeight:700,color:T.green}}>✓ SpO₂ target met — proceed to Step 4</span>}
          {parseFloat(spo2)>0&&parseFloat(spo2)<93 && <span style={{fontSize:11,color:T.gold}}>\u26a0\ufe0f Continue pre-oxygenation</span>}
        </div>
      </div>}
      <div style={{display:"flex",gap:8,marginTop:10}}>
        <button onClick={()=>setStep(Math.max(0,step-1))} disabled={step===0} style={{flex:1,padding:"8px",borderRadius:8,border:`1px solid ${T.b}`,background:"rgba(14,37,68,0.5)",color:T.txt3,fontSize:11,fontWeight:700,cursor:"pointer",opacity:step===0?0.4:1}}>\u2190 Back</button>
        {step<3 ? <button onClick={()=>setStep(step+1)} style={{flex:1,padding:"8px",borderRadius:8,border:`1px solid ${s.color}50`,background:`${s.color}10`,color:s.color,fontSize:11,fontWeight:700,cursor:"pointer"}}>Next Step \u2192</button>
          : <button onClick={()=>setStep(0)} style={{flex:1,padding:"8px",borderRadius:8,border:`1px solid ${T.green}50`,background:"rgba(61,255,160,0.1)",color:T.green,fontSize:11,fontWeight:700,cursor:"pointer"}}>\u2713 Complete \u2014 Reset</button>}
      </div>
    </div>
  );
}

/* ═══ AWAKE INTUBATION GUIDE ════════════════════════════════════════ */
function AwakeIntubation() {
  const [wt,setWt]=useState(""); const wKg=parseFloat(wt); const v=!isNaN(wKg)&&wKg>0;
  const steps=[
    {t:"Glycopyrrolate (5 min prior)",c:T.teal,body:"0.2 mg IV \u2014 dries secretions, improves topicalization. Give 5\u20130 minutes before starting topicalization."},
    {t:"Topicalization",c:T.gold,body:"Option A: Atomized lidocaine 4% (MAD device) \u2014 oropharynx + posterior tongue\nOption B: Nebulized lidocaine 4% via aerosol mask \xd7 10 minutes\nOption C: Transtracheal injection \u2014 4% lidocaine 3 mL through CTM\nDon\u2019t forget: topical vasoconstrictor to nose if nasal route (oxymetazoline 0.05% spray)"},
    {t:"Sedation",c:T.purple,body:`Ketamine ${v?(wKg*0.4).toFixed(0)+" mg":"0.3\u20130.5 mg/kg"} IV \u2014 dissociative (patient awake, cooperative, analgesic)\nALT: Dexmedetomidine 0.5\u20131 mcg/kg load over 10 min \u2192 0.2\u20130.7 mcg/kg/h\nALT: Remifentanil 0.1\u20130.2 mcg/kg/min infusion (if available)\nDo NOT use benzodiazepines alone \u2014 does not provide airway topical anesthesia`},
    {t:"Technique",c:T.blue,body:"FOB-guided: pass bronchoscope nasally or orally while patient awake. Rail-load ETT once at carina.\nVL-guided: topicalized awake VL with patient slightly sedated. Use DL or VL.\nNasal: better tolerated, useful for limited mouth opening. Lubricate, use smaller tube (7.0 or RAE)."},
    {t:"Confirmation + Induction",c:T.green,body:"Once ETT confirmed by ETCO\u2082 waveform \u2014 THEN deepen sedation + give full induction if needed.\nNever give full induction before tube confirmed in awake technique.\nDocument: technique, topicalization quality, tube size, depth, sedation used."},
  ];
  return (
    <div style={{background:"rgba(255,159,67,0.05)",border:"1px solid rgba(255,159,67,0.22)",borderRadius:12,padding:"14px 16px"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
         <span style={{fontSize:14}}>👁️</span>
         <div style={{flex:1}}><div style={{fontSize:11,fontWeight:700,color:T.txt}}>Awake Intubation Protocol</div><div style={{fontSize:9,color:T.txt4}}>Patient remains spontaneously ventilating throughout \u2014 gold standard for anticipated CICO</div></div>
        <input type="number" placeholder="Wt (kg)" value={wt} onChange={e=>setWt(e.target.value)} style={{width:80,background:"rgba(14,37,68,0.7)",border:"1px solid rgba(255,159,67,0.3)",borderRadius:7,padding:"5px 8px",color:T.txt,fontFamily:"monospace",fontSize:11,outline:"none"}} />
      </div>
      {steps.map((s,i)=>(
        <div key={i} style={{display:"flex",gap:10,marginBottom:8,alignItems:"flex-start"}}>
          <div style={{width:22,height:22,borderRadius:6,background:`${s.c}18`,border:`1px solid ${s.c}35`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:s.c,fontWeight:700,flexShrink:0,marginTop:1}}>{i+1}</div>
          <div style={{background:"rgba(14,37,68,0.4)",border:`1px solid ${T.b}`,borderRadius:8,padding:"8px 12px",flex:1}}>
            <div style={{fontSize:10,fontWeight:700,color:s.c,marginBottom:4}}>{s.t}</div>
            <div style={{fontSize:10,color:T.txt2,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{s.body}</div>
          </div>
        </div>
      ))}
      <div style={{padding:"8px 12px",background:"rgba(255,107,107,0.1)",border:"1px solid rgba(255,107,107,0.3)",borderRadius:8,fontSize:10,color:T.coral,fontWeight:600}}>❌ NEVER: obtund the patient before tube is confirmed • lose spontaneous ventilation • skip topicalization</div>
    </div>
  );
}

/* ═══ CICO MODE ═════════════════════════════════════════════════════ */
const CICO_STEPS=[
  {plan:"DECLARE CICO",icon:"🚨",color:"#ff6b6b",steps:["STOP all laryngoscopy — do not attempt again","Call for help loudly and by name","Announce: 'CICO \u2014 Cannot Intubate, Cannot Oxygenate'","Insert oral/nasal airway + apply BVM with 2-person jaw thrust","Assign roles: airway holder, surgeon, medications, monitoring, timekeeper"]},
  {plan:"PLAN A \u2014 Video Laryngoscopy",icon:"🔦",color:"#f5c842",steps:["Video laryngoscope (VL) with hyperangulated blade","External laryngeal manipulation (ELM/BURP)","Bougie-assisted intubation over epiglottis","Max 3 total attempts by any operator \u2014 then STOP"]},
  {plan:"PLAN B \u2014 Supraglottic Airway",icon:"🫼",color:"#ff9f43",steps:["Insert iGEL (size 3/4/5) OR LMA Supreme","Confirm: ETCO\u2082 + bilateral BS + seal >25 cmH\u2082O","Oxygenate and stabilize","FOB-guided intubation through SGA if available"]},
  {plan:"PLAN C \u2014 Oxygenate / Awaken",icon:"💤",color:"#9b6dff",steps:["Maximize BVM oxygenation (2-person technique)","Sugammadex 16 mg/kg IV push if rocuronium used (reverses in ~3 min)","If succinylcholine used: await spontaneous recovery (~10\u201315 min)","If oxygenation achievable: awaken, plan awake intubation"]},
  {plan:"PLAN D \u2014 SURGICAL AIRWAY",icon:"✂️",color:"#3dffa0",steps:["KNIFE: stab incision through cricothyroid membrane","FINGER: dilate opening, confirm trachea","TUBE: bougie \u2192 ETT 6.0 cuffed (or Melker kit)","Inflate cuff \u2192 ventilate \u2192 confirm ETCO\u2082 waveform","Target: CICO declaration to airway in <2 minutes"]},
];

function CICOMode({onClose}) {
  const [step,setStep]=useState(0);const [done,setDone]=useState({});const s=CICO_STEPS[step];
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(5,10,20,0.97)",zIndex:9999,display:"flex",flexDirection:"column",padding:20}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
        <div style={{fontSize:10,fontWeight:700,color:T.coral,textTransform:"uppercase",letterSpacing:".1em",padding:"4px 12px",borderRadius:20,background:"rgba(255,107,107,0.15)",border:"1px solid rgba(255,107,107,0.4)"}}>CICO EMERGENCY MODE</div>
        <div style={{marginLeft:"auto",display:"flex",gap:6}}>{CICO_STEPS.map((_,i)=><div key={i} onClick={()=>setStep(i)} style={{width:28,height:4,borderRadius:2,background:i===step?CICO_STEPS[i].color:i<step?"rgba(61,255,160,0.5)":"rgba(26,53,85,0.6)",cursor:"pointer"}} />)}</div>
        <button onClick={onClose} style={{padding:"5px 12px",borderRadius:7,border:"1px solid rgba(255,107,107,0.3)",background:"transparent",color:T.txt3,fontSize:11,cursor:"pointer"}}>Exit</button>
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
          <button onClick={()=>setStep(Math.max(0,step-1))} disabled={step===0} style={{padding:"10px 24px",borderRadius:9,border:`1px solid ${T.b}`,background:"rgba(14,37,68,0.5)",color:T.txt3,fontSize:12,fontWeight:700,cursor:"pointer",opacity:step===0?0.4:1}}>\u2190 Back</button>
          {step<CICO_STEPS.length-1
            ?<button onClick={()=>setStep(step+1)} style={{padding:"10px 28px",borderRadius:9,border:`1px solid ${s.color}55`,background:`${s.color}15`,color:s.color,fontSize:13,fontWeight:700,cursor:"pointer"}}>Next Plan \u2192</button>
            :<button onClick={onClose} style={{padding:"10px 28px",borderRadius:9,border:`1px solid ${T.green}55`,background:"rgba(61,255,160,0.1)",color:T.green,fontSize:13,fontWeight:700,cursor:"pointer"}}>\u2713 Airway Secured</button>}
        </div>
      </div>
    </div>
  );
}

/* ═══ DIFF AIRWAY ALERT ══════════════════════════════════════════════ */
function DiffAirwayAlert() {
  const [f,setF]=useState({name:"",enc:"",outcome:"",ettsz:"",depth:""});
  const [copied,setCopied]=useState(false);const [show,setShow]=useState(false);
  const u=(k,val)=>setF(p=>({...p,[k]:val}));
  const note=`\u26a0\ufe0f DIFFICULT AIRWAY ALERT \u26a0\ufe0f\n${"━".repeat(28)}\nPatient: ${f.name||"[Name]"} \u2502 Date: ${new Date().toLocaleDateString()}\n\nAIRWAY ENCOUNTER:\n${f.enc||"[Describe difficulty]"}\n\nOUTCOME: ${f.outcome||"[Final airway outcome]"}\n${f.ettsz?`ETT: ${f.ettsz} mm at ${f.depth||"[X]"} cm at lip\n`:""}\nALERT: All future airway providers must be notified of this patient's\ndifficult airway history. Awake intubation or experienced provider\npresence is strongly recommended for future intubations.\n${"━".repeat(28)}`;
  const copy=()=>navigator.clipboard.writeText(note).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2500);});
  const inp2={background:"rgba(14,37,68,0.7)",border:`1px solid ${T.b}`,borderRadius:7,padding:"7px 9px",color:T.txt,fontFamily:"monospace",fontSize:11,outline:"none",width:"100%"};
  return (
    <div style={{background:"rgba(255,107,107,0.05)",border:"1px solid rgba(255,107,107,0.22)",borderRadius:10,padding:"12px 14px",marginTop:10}}>
      <div style={{fontSize:11,fontWeight:700,color:T.coral,marginBottom:10}}>⚠️ Difficult Airway Alert Generator</div>
      <div style={{marginBottom:6}}><div style={{fontSize:8,color:T.txt4,textTransform:"uppercase",marginBottom:2}}>Patient Name</div><input type="text" placeholder="Patient name" value={f.name} onChange={e=>u("name",e.target.value)} style={inp2}/></div>
      <div style={{marginBottom:6}}><div style={{fontSize:8,color:T.txt4,textTransform:"uppercase",marginBottom:2}}>Airway Encounter</div><textarea rows={2} value={f.enc} onChange={e=>u("enc",e.target.value)} placeholder="e.g., Grade III view on VL, 2 attempts with bougie, Plan B iGEL used..." style={{...inp2,resize:"vertical"}}/></div>
      <div style={{marginBottom:6}}><div style={{fontSize:8,color:T.txt4,textTransform:"uppercase",marginBottom:2}}>Outcome</div><textarea rows={2} value={f.outcome} onChange={e=>u("outcome",e.target.value)} placeholder="e.g., 7.5mm ETT via VL on 3rd attempt, 23 cm at lip" style={{...inp2,resize:"vertical"}}/></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:8}}>
        {[["ETT Size (mm)",f.ettsz,"ettsz"],["Depth at Lip (cm)",f.depth,"depth"]].map(([l,val,k])=>(
          <div key={k}><div style={{fontSize:8,color:T.txt4,textTransform:"uppercase",marginBottom:2}}>{l}</div><input type="text" value={val} onChange={e=>u(k,e.target.value)} placeholder={l} style={inp2}/></div>
        ))}
      </div>
      <div style={{display:"flex",gap:8}}>
        <button onClick={()=>setShow(!show)} style={{flex:1,padding:"8px",borderRadius:8,border:"1px solid rgba(255,107,107,0.3)",background:"rgba(255,107,107,0.06)",color:T.coral,fontSize:11,fontWeight:700,cursor:"pointer"}}>{show?"Hide Preview":"Preview Alert"}</button>
        <button onClick={copy} style={{flex:1,padding:"8px",borderRadius:8,border:`1px solid ${copied?T.green+"55":"rgba(255,107,107,0.3)"}`,background:copied?"rgba(61,255,160,0.1)":"rgba(255,107,107,0.06)",color:copied?T.green:T.coral,fontSize:11,fontWeight:700,cursor:"pointer",transition:"all .2s"}}>{copied?"\u2713 Copied":"\u26a0\ufe0f Copy Alert"}</button>
      </div>
      {show && <div style={{marginTop:8,background:"rgba(5,15,30,0.85)",border:"1px solid rgba(255,107,107,0.2)",borderRadius:8,padding:"10px 12px"}}><pre style={{fontSize:10,color:T.txt2,lineHeight:1.7,whiteSpace:"pre-wrap",fontFamily:"'JetBrains Mono',monospace",margin:0}}>{note}</pre></div>}
    </div>
  );
}

/* ═══ RSI PROCEDURE NOTE ════════════════════════════════════════════ */
function RSIProcNote() {
  const p=new URLSearchParams(window.location.search);
  const [wt,setWt]=useState(p.get("weight")||"");const [wu,setWu]=useState(p.get("weightUnit")||"kg");
  const [ind,setInd]=useState("");const [preox,setPreox]=useState(["NRB 15 L/min","NC 15 L/min (apneic)"]);
  const [spo2,setSpo2]=useState("");const [ia,setIa]=useState("Etomidate");const [par,setPar]=useState("Succinylcholine");
  const [scope,setScope]=useState("video laryngoscopy (VL)");const [cl,setCl]=useState("I");const [att,setAtt]=useState("1");
  const [ettSz,setEttSz]=useState("7.5");const [ettD,setEttD]=useState("23");
  const [comp,setComp]=useState("None");const [vTV,setVTV]=useState("");const [vRR,setVRR]=useState("14");
  const [vFi,setVFi]=useState("1.0");const [vPEEP,setVPEEP]=useState("5");const [sed,setSed]=useState("Propofol + Fentanyl");
  const [notes,setNotes]=useState("");const [copied,setCopied]=useState(false);const [show,setShow]=useState(false);
  const wKg=wu==="lb"?parseFloat(wt)*0.453592:parseFloat(wt); const valid=!isNaN(wKg)&&wKg>0;
  const ID={Etomidate:0.3,Ketamine:1.5,Propofol:1.5}; const PD={Succinylcholine:1.5,Rocuronium:1.2}; const PX={Succinylcholine:200,Rocuronium:null};
  const dd=(mg,mx)=>{if(!valid)return "[dose]";const x=Math.round(wKg*mg*10)/10;return (mx?Math.min(x,mx):x)+" mg";};
  const tog=(arr,set,val)=>arr.includes(val)?set(arr.filter(x=>x!==val)):set([...arr,val]);
  const PRE=["NRB 15 L/min","NC 15 L/min (apneic)","HFNC 60 L/min (THRIVE)","BVM pre-oxygenation"];
  const COMP=["None","Esophageal intubation \u2014 recognized and corrected","Transient desaturation \u2014 recovered","Post-intubation hypotension \u2014 treated","Dental trauma","Other \u2014 see additional notes"];
  const SED=["Propofol + Fentanyl","Midazolam + Fentanyl","Propofol only","Fentanyl only"];
  const generate=()=>{
    const dt=new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"});
    const wn=valid?` (${wKg.toFixed(1)} kg \xd7 ${ID[ia]} mg/kg)`:"";
    const pn=valid?` (${wKg.toFixed(1)} kg \xd7 ${PD[par]} mg/kg${PX[par]?`, max ${PX[par]}mg`:""})` :"";
    const attStr=parseInt(att)===1?"Intubation was achieved on the first attempt.":`${att} attempts were required prior to successful placement.`;
    return `PROCEDURE NOTE: Rapid Sequence Intubation (RSI)\nDate: ${dt}\n\nINDICATION:\n${ind||"[Clinical indication not documented]"}\n\nPRE-OXYGENATION:\n${preox.join("; ")||"[Not documented]"}. Pre-induction SpO\u2082 ${spo2?spo2+"%":"[X%]"} achieved.\n\nMEDICATIONS:\n  Induction:  ${ia} ${dd(ID[ia],null)}${wn} IV push\n  Paralytic:  ${par} ${dd(PD[par],PX[par])}${pn} IV push\n\nPROCEDURE:\n${scope} performed. ${attStr} Cormack-Lehane grade ${cl} view. ${ettSz} mm cuffed ETT advanced to ${ettD} cm at lip.\n\nCONFIRMATION:\nContinuous waveform ETCO\u2082 \xd76 breaths \xb7 bilateral breath sounds \xb7 symmetric chest rise \xb7 CXR ordered.\n\nCOMPLICATIONS: ${comp}\n\nPOST-INTUBATION:\n  Vent: TV ${vTV||"[X]"} mL \xb7 RR ${vRR}/min \xb7 FiO\u2082 ${vFi} \xb7 PEEP ${vPEEP} cmH\u2082O\n  Sedation/analgesia: ${sed} initiated\n  Monitoring: continuous SpO\u2082, ETCO\u2082, hemodynamics${notes?"\n\nNOTES:\n"+notes:""}`;
  };
  const copy=()=>navigator.clipboard.writeText(generate()).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2500);});
  const inp3={background:"rgba(14,37,68,0.7)",border:`1px solid ${T.b}`,borderRadius:8,padding:"8px 10px",color:T.txt,fontFamily:"monospace",fontSize:12,outline:"none",width:"100%"};
  const selBtn=(val,active,onClick,c=T.gold)=><button key={val} onClick={onClick} style={{padding:"5px 11px",borderRadius:20,cursor:"pointer",border:`1px solid ${active?c+"55":T.b}`,background:active?`${c}14`:"rgba(14,37,68,0.5)",color:active?c:T.txt3,fontSize:10,fontWeight:active?700:400,fontFamily:"sans-serif",transition:"all .15s"}}>{val}</button>;
  const sec=(children)=><div style={{background:"rgba(14,37,68,0.4)",border:`1px solid ${T.b}`,borderRadius:10,padding:"12px 14px",marginBottom:10}}>{children}</div>;
  const hdr=(ic,lbl,c=T.txt3)=><div style={{fontSize:9,fontWeight:700,color:c,textTransform:"uppercase",letterSpacing:".08em",marginBottom:8}}><span style={{marginRight:5}}>{ic}</span>{lbl}</div>;
  return (
    <div>
      {sec(<>{hdr("\u2696\ufe0f","Patient Weight",T.gold)}
        <div style={{display:"flex",gap:8,marginBottom:valid?10:0}}>
          <input type="number" placeholder="Weight..." value={wt} onChange={e=>setWt(e.target.value)} style={{...inp3,flex:1,border:"1px solid rgba(245,200,66,0.3)"}} />
          <div style={{display:"flex",borderRadius:8,overflow:"hidden",border:`1px solid ${T.b}`}}>
            {["kg","lb"].map(u=><button key={u} onClick={()=>setWu(u)} style={{padding:"8px 14px",cursor:"pointer",border:"none",background:wu===u?"rgba(245,200,66,0.2)":"rgba(14,37,68,0.5)",color:wu===u?T.gold:T.txt3,fontSize:11,fontWeight:700}}>{u}</button>)}
          </div>
        </div>
        {valid&&<div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {[["Etomidate",ID.Etomidate,null,T.gold],["Ketamine",ID.Ketamine,null,T.orange],["Succinylcholine",PD.Succinylcholine,PX.Succinylcholine,T.coral],["Rocuronium",PD.Rocuronium,null,T.purple]].map(([n,mg,mx,c])=>(
            <span key={n} style={{fontSize:9,padding:"2px 8px",borderRadius:6,background:`${c}12`,border:`1px solid ${c}28`,color:c}}>{n}: <strong style={{fontFamily:"monospace"}}>{dd(mg,mx)}</strong></span>
          ))}</div>}
      </>)}
      {sec(<>{hdr("🏥","Indication")}<textarea rows={2} placeholder="e.g., Acute hypoxic respiratory failure..." value={ind} onChange={e=>setInd(e.target.value)} style={{...inp3,resize:"vertical"}} /></>)}
      {sec(<>{hdr("🫁","Pre-Oxygenation")}
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>{PRE.map(val=>selBtn(val,preox.includes(val),()=>tog(preox,setPreox,val),T.blue))}</div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}><span style={{fontSize:10,color:T.txt3,whiteSpace:"nowrap"}}>Pre-induction SpO\u2082:</span><input type="number" placeholder="e.g. 97" value={spo2} onChange={e=>setSpo2(e.target.value)} style={{...inp3,width:70}} /><span style={{fontSize:10,color:T.txt3}}>%</span></div>
      </>)}
      {sec(<>{hdr("💉","Medications")}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <div><div style={{fontSize:8,color:T.txt4,textTransform:"uppercase",marginBottom:5}}>Induction Agent</div>
            {["Etomidate","Ketamine","Propofol"].map(a=><button key={a} onClick={()=>setIa(a)} style={{width:"100%",marginBottom:3,padding:"6px 10px",borderRadius:7,cursor:"pointer",fontFamily:"sans-serif",border:`1px solid ${ia===a?T.gold+"50":T.b}`,background:ia===a?"rgba(245,200,66,0.12)":"rgba(14,37,68,0.5)",color:ia===a?T.gold:T.txt3,fontSize:10,display:"flex",justifyContent:"space-between"}}><span>{a}</span><span style={{fontFamily:"monospace",fontSize:9}}>{valid?dd(ID[a],null):ID[a]+" mg/kg"}</span></button>)}
          </div>
          <div><div style={{fontSize:8,color:T.txt4,textTransform:"uppercase",marginBottom:5}}>Paralytic</div>
            {["Succinylcholine","Rocuronium"].map(pp=><button key={pp} onClick={()=>setPar(pp)} style={{width:"100%",marginBottom:3,padding:"6px 10px",borderRadius:7,cursor:"pointer",fontFamily:"sans-serif",border:`1px solid ${par===pp?T.coral+"50":T.b}`,background:par===pp?"rgba(255,107,107,0.12)":"rgba(14,37,68,0.5)",color:par===pp?T.coral:T.txt3,fontSize:10,display:"flex",justifyContent:"space-between"}}><span>{pp}</span><span style={{fontFamily:"monospace",fontSize:9}}>{valid?dd(PD[pp],PX[pp]):PD[pp]+" mg/kg"}</span></button>)}
          </div>
        </div>
      </>)}
      {sec(<>{hdr("🔦","Procedure")}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
          <div><div style={{fontSize:8,color:T.txt4,textTransform:"uppercase",marginBottom:5}}>Scope</div>
            {[["video laryngoscopy (VL)","VL"],["direct laryngoscopy (DL)","DL"],["VL hyperangulated blade","VL Hyperangulated"]].map(([val,lbl])=><button key={val} onClick={()=>setScope(val)} style={{width:"100%",marginBottom:3,padding:"5px 8px",borderRadius:7,cursor:"pointer",fontFamily:"sans-serif",border:`1px solid ${scope===val?T.teal+"50":T.b}`,background:scope===val?"rgba(0,229,192,0.1)":"rgba(14,37,68,0.5)",color:scope===val?T.teal:T.txt3,fontSize:10,textAlign:"left"}}>{lbl}</button>)}
          </div>
          <div>
            <div style={{fontSize:8,color:T.txt4,textTransform:"uppercase",marginBottom:5}}>C-L Grade</div>
            <div style={{display:"flex",gap:4,marginBottom:8}}>{["I","II","IIb","III","IV"].map(g=><button key={g} onClick={()=>setCl(g)} style={{width:32,height:32,borderRadius:7,cursor:"pointer",fontFamily:"monospace",border:`1px solid ${cl===g?T.teal+"55":T.b}`,background:cl===g?"rgba(0,229,192,0.15)":"rgba(14,37,68,0.5)",color:cl===g?T.teal:T.txt3,fontSize:10,fontWeight:700}}>{g}</button>)}</div>
            <div style={{fontSize:8,color:T.txt4,textTransform:"uppercase",marginBottom:5}}>Attempts</div>
            <div style={{display:"flex",gap:4}}>{["1","2","3"].map(n=><button key={n} onClick={()=>setAtt(n)} style={{width:32,height:32,borderRadius:7,cursor:"pointer",fontFamily:"monospace",border:`1px solid ${att===n?(n==="3"?T.coral+"55":T.gold+"55"):T.b}`,background:att===n?(n==="3"?"rgba(255,107,107,0.15)":"rgba(245,200,66,0.15)"):"rgba(14,37,68,0.5)",color:att===n?(n==="3"?T.coral:T.gold):T.txt3,fontSize:12,fontWeight:700}}>{n}</button>)}</div>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <div><div style={{fontSize:8,color:T.txt4,textTransform:"uppercase",marginBottom:5}}>ETT Size (mm)</div><div style={{display:"flex",gap:3,flexWrap:"wrap"}}>{["6.0","6.5","7.0","7.5","8.0","8.5"].map(sz=><button key={sz} onClick={()=>setEttSz(sz)} style={{padding:"4px 9px",borderRadius:6,cursor:"pointer",fontFamily:"monospace",border:`1px solid ${ettSz===sz?T.blue+"55":T.b}`,background:ettSz===sz?"rgba(59,158,255,0.15)":"rgba(14,37,68,0.5)",color:ettSz===sz?T.blue:T.txt3,fontSize:10,fontWeight:700}}>{sz}</button>)}</div></div>
          <div><div style={{fontSize:8,color:T.txt4,textTransform:"uppercase",marginBottom:5}}>Depth at Lip (cm)</div><div style={{display:"flex",gap:3,flexWrap:"wrap"}}>{["20","21","22","23","24","25","26"].map(dep=><button key={dep} onClick={()=>setEttD(dep)} style={{padding:"4px 8px",borderRadius:6,cursor:"pointer",fontFamily:"monospace",border:`1px solid ${ettD===dep?T.blue+"55":T.b}`,background:ettD===dep?"rgba(59,158,255,0.15)":"rgba(14,37,68,0.5)",color:ettD===dep?T.blue:T.txt3,fontSize:10,fontWeight:700}}>{dep}</button>)}</div></div>
        </div>
      </>)}
      {sec(<>{hdr("\u26a0\ufe0f","Complications")}
        <div style={{display:"flex",flexDirection:"column",gap:3}}>
          {COMP.map(c=><button key={c} onClick={()=>setComp(c)} style={{padding:"6px 10px",borderRadius:7,cursor:"pointer",fontFamily:"sans-serif",textAlign:"left",border:`1px solid ${comp===c?(c==="None"?T.green+"45":T.coral+"45"):T.b}`,background:comp===c?(c==="None"?"rgba(61,255,160,0.09)":"rgba(255,107,107,0.09)"):"rgba(14,37,68,0.5)",color:comp===c?(c==="None"?T.green:T.coral):T.txt3,fontSize:10,fontWeight:comp===c?700:400}}>{c}</button>)}
        </div>
      </>)}
      {sec(<>{hdr("\u2699\ufe0f","Post-Intubation Vent + Sedation")}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:6,marginBottom:8}}>
          {[["TV (mL)",vTV,setVTV,"420"],["RR (/min)",vRR,setVRR,"14"],["FiO\u2082",vFi,setVFi,"1.0"],["PEEP",vPEEP,setVPEEP,"5"]].map(([l,val,sv,ph])=>(
            <div key={l}><div style={{fontSize:8,color:T.txt4,textTransform:"uppercase",marginBottom:3}}>{l}</div><input type="number" placeholder={ph} value={val} onChange={e=>sv(e.target.value)} style={inp3} /></div>
          ))}
        </div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{SED.map(s=>selBtn(s,sed===s,()=>setSed(s),T.purple))}</div>
      </>)}
      {sec(<>{hdr("📝","Additional Notes")}<textarea rows={2} placeholder="Difficult airway notes, provider, trach timeline..." value={notes} onChange={e=>setNotes(e.target.value)} style={{...inp3,resize:"vertical"}} /></>)}
      <div style={{display:"flex",gap:8}}>
        <button onClick={()=>setShow(!show)} style={{flex:1,padding:"10px",borderRadius:9,cursor:"pointer",fontFamily:"sans-serif",border:"1px solid rgba(245,200,66,0.35)",background:"rgba(245,200,66,0.08)",color:T.gold,fontSize:11,fontWeight:700}}>{show?"Hide Preview":"Preview Note"}</button>
        <button onClick={copy} style={{flex:1,padding:"10px",borderRadius:9,cursor:"pointer",fontFamily:"sans-serif",transition:"all .2s",border:`1px solid ${copied?T.green+"55":"rgba(0,229,192,0.35)"}`,background:copied?"rgba(61,255,160,0.12)":"rgba(0,229,192,0.08)",color:copied?T.green:T.teal,fontSize:11,fontWeight:700}}>{copied?"✓ Copied":"📋 Copy Procedure Note"}</button>
      </div>
      {show&&<div style={{marginTop:8,background:"rgba(5,15,30,0.85)",border:"1px solid rgba(245,200,66,0.2)",borderRadius:10,padding:"14px 16px"}}><pre style={{fontSize:11,color:T.txt2,lineHeight:1.75,whiteSpace:"pre-wrap",fontFamily:"'JetBrains Mono',monospace",margin:0}}>{generate()}</pre></div>}
    </div>
  );
}

/* ═══ SHARED COMPONENTS ═════════════════════════════════════════════ */
function DrugRow({rx}) {
  const [open,setOpen]=useState(null);
  const panels=[{k:"renal",icon:"📋",label:"Details",color:T.blue},{k:"ivpo",icon:"🔧",label:"Alternative",color:T.teal},{k:"deesc",icon:"📉",label:"Monitoring",color:T.green}];
  return (
    <div style={{background:"rgba(14,37,68,0.45)",border:`1px solid ${T.b}`,borderRadius:10,marginBottom:8,overflow:"hidden"}}>
      <div style={{padding:"11px 14px"}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8,marginBottom:4}}>
          <div><div style={{fontSize:12,fontWeight:700,color:T.txt}}>{rx.drug}</div>{rx.cat&&<div style={{fontSize:10,color:T.txt3,marginTop:1}}>{rx.cat}</div>}</div>
          {rx.ref&&<span style={{fontSize:9,fontFamily:"monospace",fontWeight:700,padding:"2px 7px",borderRadius:20,flexShrink:0,background:"rgba(155,109,255,0.1)",border:"1px solid rgba(155,109,255,0.3)",color:T.purple}}>{rx.ref}</span>}
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
      {open&&rx[open]&&<div style={{padding:"10px 14px",borderTop:`1px solid ${panels.find(pp=>pp.k===open)?.color}25`,fontSize:11,color:T.txt2,lineHeight:1.65,whiteSpace:"pre-wrap"}}><span style={{color:panels.find(pp=>pp.k===open)?.color,fontWeight:700,marginRight:6}}>{panels.find(pp=>pp.k===open)?.icon}</span>{rx[open]}</div>}
    </div>
  );
}

function MDMSnippet({condId}) {
  const tmpl=MDM_DATA[condId];
  const [fields,setFields]=useState({});
  const [copied,setCopied]=useState(false);
  const [show,setShow]=useState(false);
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
      {show&&<div style={{marginTop:8,background:"rgba(5,15,30,0.8)",border:"1px solid rgba(0,229,192,0.15)",borderRadius:8,padding:"10px 12px"}}><p style={{fontSize:11,color:T.txt2,lineHeight:1.75,margin:0,fontFamily:"'JetBrains Mono',monospace"}}>{note}</p></div>}
    </div>
  );
}

function OrderSetPanel({condId}) {
  const os=ORDER_SETS[condId];
  const [active,setActive]=useState(null);
  const [copied,setCopied]=useState(null);
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
    <div style={{background:"rgba(155,109,255,0.06)",border:"1px solid rgba(155,109,255,0.25)",borderRadius:10,padding:"12px 14px",marginTop:10}}>
      <div style={{fontSize:9,fontWeight:700,color:T.purple,textTransform:"uppercase",letterSpacing:".07em",marginBottom:8}}>\u26a1 Quick-Ref \u2014 5 Critical Numbers</div>
      {refs.map((r,i)=>(
        <div key={i} style={{display:"flex",gap:8,padding:"5px 0",borderBottom:i<refs.length-1?"1px solid rgba(26,53,85,0.4)":"none",alignItems:"flex-start"}}>
          <div style={{width:16,height:16,borderRadius:4,background:"rgba(155,109,255,0.15)",border:"1px solid rgba(155,109,255,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:T.purple,fontWeight:700,flexShrink:0,marginTop:1}}>{i+1}</div>
          <div style={{fontSize:10,color:T.txt2,lineHeight:1.5,fontFamily:"monospace"}}>{r}</div>
        </div>
      ))}
    </div>
  );
}

/* ═══ CONDITION PAGE ════════════════════════════════════════════════ */
function ConditionPage({cond,onBack}) {
  const [tab,setTab]=useState("overview");const [checked,setChecked]=useState({});const [cicoOpen,setCicoOpen]=useState(false);
  const ov=OVERVIEW[cond.id]||{};const rx=TREATMENT[cond.id]||[];const wu_=WORKUP[cond.id]||[];const fu=FOLLOWUP[cond.id]||[];
  const extraTabs={
    rsi:[{id:"procnote",label:"Proc Note",icon:"📝",badge:"NEW"}],
    daw:[{id:"dsi",label:"DSI",icon:"🔎"},{id:"awake",label:"Awake Intubation",icon:"👁️"}],
  };
  const tabs=[{id:"overview",label:"Overview",icon:"📋"},{id:"workup",label:"Workup",icon:"✅"},{id:"treatment",label:"Protocol",icon:"⚙️"},{id:"followup",label:"Follow-up",icon:"📅"},...(extraTabs[cond.id]||[])];
  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      {cicoOpen&&<CICOMode onClose={()=>setCicoOpen(false)} />}
      <div style={{padding:"14px 20px 0",flexShrink:0}}>
        <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:6,background:"rgba(14,37,68,0.5)",border:`1px solid ${T.b}`,borderRadius:7,padding:"5px 12px",color:T.txt3,fontSize:11,cursor:"pointer",marginBottom:12}}>\u2190 Back</button>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
          <div style={{width:44,height:44,borderRadius:12,background:cond.gl,border:`1px solid ${cond.br}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{cond.icon}</div>
          <div>
            <div style={{fontSize:16,fontWeight:700,color:T.txt,fontFamily:"'Playfair Display',serif"}}>{cond.title}</div>
            <div style={{fontSize:11,color:T.txt3}}>{cond.sub}</div>
          </div>
          <span style={{marginLeft:"auto",fontSize:9,fontFamily:"monospace",padding:"2px 8px",borderRadius:20,background:cond.gl,border:`1px solid ${cond.br}`,color:cond.color,fontWeight:700}}>RSI PAGE</span>
          {cond.id==="daw"&&<button onClick={()=>setCicoOpen(true)} style={{flexShrink:0,padding:"5px 12px",borderRadius:8,border:"1px solid rgba(255,107,107,0.5)",background:"rgba(255,107,107,0.12)",color:T.coral,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"sans-serif"}}>🚨 CICO Mode</button>}
        </div>
        <div style={{display:"flex",gap:3,borderBottom:`1px solid ${T.b}`,overflowX:"auto"}}>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"6px 12px",border:"none",borderBottom:tab===t.id?`2px solid ${cond.color}`:"2px solid transparent",background:"transparent",color:tab===t.id?T.txt:T.txt3,fontSize:10,fontWeight:tab===t.id?700:400,cursor:"pointer",fontFamily:"sans-serif",display:"flex",alignItems:"center",gap:5,whiteSpace:"nowrap",marginBottom:-1}}>
              <span>{t.icon}</span>{t.label}
              {t.badge&&<span style={{fontSize:7,background:"rgba(245,200,66,0.2)",border:"1px solid rgba(245,200,66,0.4)",color:T.gold,borderRadius:8,padding:"1px 4px",fontFamily:"monospace",fontWeight:700}}>{t.badge}</span>}
            </button>
          ))}
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px 20px 24px"}}>
        {tab==="overview"&&<div>
          <div style={{background:"rgba(14,37,68,0.5)",border:`1px solid ${cond.br}`,borderLeft:`3px solid ${cond.color}`,borderRadius:8,padding:"12px 14px",marginBottom:14,fontSize:12,color:T.txt2,lineHeight:1.7}}>{ov.def}</div>
          {ov.bullets?.map((b,i)=><div key={i} style={{display:"flex",gap:10,padding:"7px 0",borderBottom:i<ov.bullets.length-1?"1px solid rgba(26,53,85,0.4)":"none"}}><div style={{width:14,height:14,borderRadius:3,background:cond.gl,border:`1px solid ${cond.br}`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:cond.color,marginTop:2}}>•</div><div style={{fontSize:12,color:T.txt2,lineHeight:1.55}}>{b}</div></div>)}
          {cond.id==="rsi"&&<><div style={{marginTop:16,fontSize:11,fontWeight:700,color:T.txt3,textTransform:"uppercase",letterSpacing:".07em",marginBottom:10}}>RSI Drug Calculator</div><RSICalc /><div style={{marginTop:12}}><SOAPMe /></div><HemoPanel /></>}
          {cond.id==="daw"&&<div style={{marginTop:12}}><LemonHeaven /></div>}
          {cond.id==="peds"&&<div style={{marginTop:12}}><PedsAirway /></div>}
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
          {rx.length>0?<>{rx.map((r,i)=><DrugRow key={i} rx={r} />)}</>:<div style={{fontSize:12,color:T.txt3,textAlign:"center",padding:"32px 0"}}>Protocol data not available</div>}
        </div>}
        {tab==="followup"&&<div>
          {fu.map((item,i)=><div key={i} style={{display:"flex",gap:10,padding:"9px 12px",background:"rgba(14,37,68,0.4)",border:`1px solid ${T.b}`,borderRadius:8,marginBottom:6}}><div style={{width:22,height:22,borderRadius:6,background:"rgba(0,229,192,0.1)",border:"1px solid rgba(0,229,192,0.25)",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:T.teal,fontWeight:700,marginTop:1}}>{i+1}</div><div style={{fontSize:12,color:T.txt2,lineHeight:1.6}}>{item}</div></div>)}
          <MDMSnippet condId={cond.id} />
          {cond.id==="daw"&&<DiffAirwayAlert />}
        </div>}
        {tab==="procnote"&&cond.id==="rsi"&&<div>
          <div style={{background:"rgba(245,200,66,0.06)",border:"1px solid rgba(245,200,66,0.2)",borderRadius:8,padding:"10px 14px",marginBottom:14,display:"flex",gap:10,alignItems:"center"}}>
            <span style={{fontSize:16}}>📝</span>
            <div><div style={{fontSize:11,fontWeight:700,color:T.gold}}>RSI Procedure Note Generator</div><div style={{fontSize:10,color:T.txt3}}>Fill fields below \u2014 generates EMR-ready note for copy-paste</div></div>
          </div>
          <RSIProcNote />
        </div>}
        {tab==="dsi"&&<DSIProtocol />}
        {tab==="awake"&&<AwakeIntubation />}
      </div>
    </div>
  );
}

/* ═══ MAIN RSI PAGE ══════════════════════════════════════════════════ */
export default function RSIPage() {
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
          <button onClick={()=>navigate("/AirwayHub")} style={{padding:"5px 12px",borderRadius:7,border:"1px solid rgba(245,200,66,0.35)",background:"rgba(8,22,40,0.7)",color:T.gold,fontSize:11,fontWeight:700,cursor:"pointer"}}>\u2190 Airway Hub</button>
          <div style={{width:40,height:40,borderRadius:11,background:"rgba(245,200,66,0.1)",border:"1px solid rgba(245,200,66,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>💉</div>
          <div>
            <div style={{fontSize:17,fontWeight:700,color:T.txt,fontFamily:"'Playfair Display',serif"}}>Intubation Suite</div>
            <div style={{fontSize:10,color:T.txt3}}>RSI \xb7 Difficult Airway \xb7 DSI \xb7 Pediatric \xb7 Awake Intubation \xb7 CICO</div>
          </div>
          <div style={{marginLeft:"auto",display:"flex",gap:6}}>
            {["DAS 2022","UpToDate 2024","PADIS 2018"].map(b=><span key={b} style={{fontSize:8,fontFamily:"monospace",fontWeight:700,padding:"2px 8px",borderRadius:20,background:"rgba(245,200,66,0.1)",border:"1px solid rgba(245,200,66,0.28)",color:T.gold}}>{b}</span>)}
          </div>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px 20px 24px"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:12}}>
          {CONDITIONS.map(c=>(
            <div key={c.id} onClick={()=>setSelected(c.id)} style={{background:c.gl,border:`1px solid ${c.br}`,borderRadius:12,padding:"14px 16px",cursor:"pointer",transition:"all .2s",position:"relative",overflow:"hidden"}}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 8px 24px ${c.color}20`}}
              onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none"}}>
              <div style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:10}}>
                <div style={{width:40,height:40,borderRadius:10,background:c.gl,border:`1px solid ${c.br}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{c.icon}</div>
                <div><div style={{fontSize:13,fontWeight:700,color:T.txt}}>{c.title}</div><div style={{fontSize:10,color:T.txt3,marginTop:1}}>{c.sub}</div></div>
              </div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",fontSize:9}}>
                {TREATMENT[c.id]?.length>0&&<span style={{padding:"2px 7px",borderRadius:20,background:"rgba(0,229,192,0.08)",border:"1px solid rgba(0,229,192,0.2)",color:T.teal}}>⚙️ {TREATMENT[c.id].length} protocol steps</span>}
                {c.id==="rsi"&&<span style={{padding:"2px 7px",borderRadius:20,background:"rgba(245,200,66,0.1)",border:"1px solid rgba(245,200,66,0.3)",color:T.gold,fontWeight:700}}>📝 Proc Note</span>}
                {c.id==="daw"&&<span style={{padding:"2px 7px",borderRadius:20,background:"rgba(255,107,107,0.1)",border:"1px solid rgba(255,107,107,0.3)",color:T.coral,fontWeight:700}}>🚨 CICO Mode</span>}
                {c.id==="peds"&&<span style={{padding:"2px 7px",borderRadius:20,background:"rgba(0,229,192,0.08)",border:"1px solid rgba(0,229,192,0.2)",color:T.teal}}>🧮 Tube Sizing Calc</span>}
                {c.id==="dsi"&&<span style={{padding:"2px 7px",borderRadius:20,background:"rgba(155,109,255,0.08)",border:"1px solid rgba(155,109,255,0.2)",color:T.purple}}>⏱ Pre-ox Timer</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}