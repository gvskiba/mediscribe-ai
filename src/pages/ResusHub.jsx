import { useState, useCallback, Fragment } from "react";

// ── Font + CSS Injection ─────────────────────────────────────────
(() => {
  if (document.getElementById("resus-fonts")) return;
  const l = document.createElement("link"); l.id = "resus-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "resus-css";
  s.textContent = `
    *{box-sizing:border-box;margin:0;padding:0;}
    ::-webkit-scrollbar{width:3px;height:3px;}
    ::-webkit-scrollbar-track{background:transparent;}
    ::-webkit-scrollbar-thumb{background:rgba(42,79,122,0.5);border-radius:2px;}
    @keyframes fadeSlide{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
    .fade-in{animation:fadeSlide .22s ease forwards;}
    .shimmer-text{
      background:linear-gradient(90deg,#e8f0fe 0%,#fff 30%,#ff6b6b 52%,#ff9f43 72%,#e8f0fe 100%);
      background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;
      background-clip:text;animation:shimmer 5s linear infinite;
    }
  `;
  document.head.appendChild(s);
})();

// ── Design Tokens ─────────────────────────────────────────────────
const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36", up:"#0e2544",
  b:"rgba(26,53,85,0.8)", bhi:"rgba(42,79,122,0.9)",
  txt:"#e8f0fe", txt2:"#8aaccc", txt3:"#4a6a8a", txt4:"#2e4a6a",
  red:"#ff4444", coral:"#ff6b6b", orange:"#ff9f43",
  yellow:"#f5c842", green:"#3dffa0", teal:"#00e5c0",
  blue:"#3b9eff", purple:"#9b6dff", cyan:"#00d4ff", rose:"#f472b6",
};
const glass = {
  backdropFilter:"blur(24px) saturate(200%)",
  WebkitBackdropFilter:"blur(24px) saturate(200%)",
  background:"rgba(8,22,40,0.78)",
  border:"1px solid rgba(42,79,122,0.35)",
  borderRadius:14,
};

// ── Data ─────────────────────────────────────────────────────────
const ACLS_ALGORITHMS = [
  {
    id:"vfvt", title:"VF / Pulseless VT", color:T.red, urgency:"SHOCKABLE", icon:"⚡",
    steps:[
      {phase:"0–2 min", label:"CPR + Immediate Defib",
       actions:["High-quality CPR — 100–120 bpm, 2–2.4 in depth, full recoil, <10 sec interruptions","Defibrillate as soon as available — 200J biphasic (360J monophasic)","Resume CPR immediately after shock — never pause for rhythm check","Establish IV/IO access during compressions"]},
      {phase:"2–4 min", label:"Epinephrine + Cycle 2",
       actions:["Epinephrine 1mg IV/IO — administer during compressions, q3–5 min throughout","Continue CPR 2 min — rhythm check — if shockable: shock again","Consider advanced airway — do not pause CPR to intubate"]},
      {phase:"4–6 min", label:"Antiarrhythmic + Cycle 3",
       actions:["Amiodarone 300mg IV/IO push (repeat 150mg x1) OR Lidocaine 1–1.5mg/kg IV","Shock immediately if still VF/pVT — CPR 2 min — reassess rhythm"]},
      {phase:"Refractory", label:"Refractory VF Options",
       actions:["Double sequential defibrillation (DSED) — two defibrillators simultaneously — reasonable per 2023 evidence","NaHCO3 1mEq/kg if prolonged arrest or known hyperkalemia","Mechanical CPR device (LUCAS, AutoPulse) if available","Treat all reversible causes — 5H5T every cycle"]},
    ],
    pearls:["Charge defibrillator during CPR — minimize pre-shock pause to <5 sec","ETCO2 <10 = poor CPR quality; sudden rise >40 mmHg = likely ROSC","Vasopressin 40U may replace 1st or 2nd epinephrine dose (Class IIb, AHA 2020)","TTM 32–36°C for 24h in all comatose post-ROSC patients"],
  },
  {
    id:"pea", title:"PEA / Asystole", color:T.orange, urgency:"NON-SHOCKABLE", icon:"📉",
    steps:[
      {phase:"0–2 min", label:"CPR + Epi ASAP",
       actions:["CPR immediately — do NOT defibrillate PEA or asystole","Epinephrine 1mg IV/IO as soon as access — do not delay","Asystole: confirm in 2+ leads — check connections, increase gain — rule out fine VF","IV/IO access — establish during compressions"]},
      {phase:"2+ min", label:"POCUS + Reversible Causes",
       actions:["POCUS at every pulse check: tamponade, RV dilation (PE), collapsed IVC (hypovolemia)","Narrow QRS PEA: tamponade, PTX, PE, hypovolemia","Wide QRS PEA: hyperkalemia, Na-channel blockade, severe acidosis, massive AMI","Calcium gluconate 1g IV if hyperkalemia suspected (CKD, dialysis, crush injury)"]},
      {phase:"Treat", label:"Targeted Interventions",
       actions:["Tension PTX: needle decompression 2nd ICS MCL → finger thoracostomy → chest tube","Tamponade: emergency pericardiocentesis or perimortem thoracotomy","Massive PE: empiric tPA 50mg IV bolus — continue CPR 60–90 min post-lytics","Hypovolemia: 1–2L NS rapid push; blood (1:1:1) if hemorrhagic"]},
      {phase:"Decision", label:"Termination Criteria",
       actions:["Consider stopping after 20+ min, no reversible cause found, no ROSC achieved","Cardiac standstill on POCUS (no wall motion) = very poor prognosis","Document: exact down-time, bystander CPR, EMS interval, all interventions","Communicate with family early — chaplain and social work at bedside"]},
    ],
    pearls:["No role for atropine in PEA or asystole — removed from ACLS 2010","POCUS is the highest-yield tool in PEA — use every pulse check window","Witnessed arrest with fine VF on monitor: defibrillate — do not delay"],
  },
  {
    id:"brady", title:"Symptomatic Bradycardia", color:T.yellow, urgency:"HR < 50 bpm", icon:"⬇️",
    steps:[
      {phase:"Assess", label:"Symptomatic?",
       actions:["Symptomatic = hypotension, AMS, chest pain, pulmonary edema, or signs of shock","Asymptomatic: monitor, 12-lead ECG, no immediate intervention required","Attach pads — be ready to initiate pacing at any moment"]},
      {phase:"Pharm", label:"Atropine First-Line",
       actions:["Atropine 0.5mg IV — repeat q3–5 min to max 3mg total","Dopamine 2–10 mcg/kg/min infusion if atropine fails — prepare with pharmacy","Epinephrine infusion 2–10 mcg/min if hemodynamically deteriorating","Do NOT use atropine for Mobitz II, 3° AVB, or wide-complex bradycardia"]},
      {phase:"Pace", label:"Transcutaneous Pacing (TCP)",
       actions:["Apply pads: anterior-posterior position preferred","Rate 60–80 bpm — increase mA from 0 until electrical capture (wide QRS + T-wave after spike)","Confirm mechanical capture: palpate femoral pulse with each spike","Sedate + analgesia: midazolam 1–2mg IV + fentanyl 25–50mcg IV"]},
      {phase:"Cause", label:"Identify Underlying",
       actions:["High-degree AVB (Mobitz II / CHB): pace + emergent cardiology consult","Inferior STEMI + bradycardia: activate cath lab — vagally mediated, usually atropine-responsive","Drug causes: beta-blocker, CCB, digoxin — antidotes, dialysis if severe","Hyperkalemia: peaked T-waves, wide QRS — calcium chloride 1g IV + K+ treatment"]},
    ],
    pearls:["Atropine INEFFECTIVE for infra-nodal block (Mobitz II, CHB) — pace immediately","Confirm MECHANICAL capture — do not rely on electrical capture alone; check the pulse!","TCP threshold increases over time — check capture frequently, raise mA if needed"],
  },
  {
    id:"tachy", title:"Tachycardia", color:T.coral, urgency:"HR > 150 bpm", icon:"⬆️",
    steps:[
      {phase:"Assess", label:"Stable vs Unstable",
       actions:["Unstable = hypotension, AMS, chest pain, acute HF, shock — cardiovert immediately","Stable: 12-lead ECG first — narrow vs wide complex, regular vs irregular","Apply pads and prepare cardioversion in any unstable patient"]},
      {phase:"Narrow", label:"SVT / AFib",
       actions:["SVT: vagal maneuvers first (modified Valsalva 40mmHg × 15 sec in Trendelenburg)","Adenosine 6mg rapid IV push + 20mL NS flush — 12mg × 2 if no response","AFib <48h: rate control (metoprolol, diltiazem) OR rhythm control (consult cardiology)","AFib >48h / unknown duration: rate control only — no cardioversion without anticoag / TEE","WPW + AFib (irregular wide complex): AVOID adenosine, BB, CCB — procainamide or cardiovert"]},
      {phase:"Wide", label:"VT vs SVT-aberrant",
       actions:["Treat as VT until proven otherwise — this is the safe approach","Stable VT: amiodarone 150mg IV over 10 min, then 1mg/min maintenance infusion","Do NOT give verapamil or diltiazem for wide-complex tachycardia — risk of VF","Unstable VT or any doubt: synchronized cardioversion 100–200J biphasic"]},
      {phase:"Cardiovert", label:"Synchronized Cardioversion",
       actions:["SYNCHRONIZE mode ON — verify sync markers on R-waves before discharging","Sedate if time allows: midazolam 1–2mg + fentanyl 25–50mcg","SVT / narrow regular: 50–100J. AFib: 120–200J. Stable VT: 100–200J"]},
    ],
    pearls:["Wide complex tachycardia = treat as VT — NEVER give calcium channel blockers","Polymorphic VT (TdP): magnesium 2g IV + correct electrolytes + remove offending drug","Preexcited AFib (WPW): irregular wide complex — cardioversion or procainamide — avoid nodal blockers"],
  },
];

const RESUS_MEDS = [
  {drug:"Epinephrine",       dose:"1mg IV/IO q3–5 min",                         route:"IV push",     indication:"Cardiac arrest (VF, PEA, asystole)", color:T.red,
   dilution:"1mg in 10mL (1:10,000) — give undiluted",      notes:"Post-ROSC infusion: 0.1–0.5 mcg/kg/min for shock. Never delay first dose."},
  {drug:"Amiodarone",        dose:"300mg push (arrest) · 150mg/10 min (VT)",    route:"IV push/inf", indication:"Refractory VF/pVT; stable VT",         color:T.orange,
   dilution:"300mg in 20–30mL D5W for arrest push; D5W drip for maint (900mg/24h)", notes:"2nd dose 150mg. Causes hypotension — push slower in stable VT."},
  {drug:"Lidocaine",         dose:"1–1.5mg/kg IV/IO",                            route:"IV push",     indication:"Alternative to amiodarone in VF/pVT",   color:T.yellow,
   dilution:"Undiluted 2% (20mg/mL) — max 3mg/kg cumulative",  notes:"Maintenance: 1–4mg/min infusion post-ROSC. Toxicity: circumoral numbness, seizures."},
  {drug:"Atropine",          dose:"0.5mg IV q3–5 min — max 3mg",                 route:"IV push",     indication:"Symptomatic bradycardia",                color:T.blue,
   dilution:"0.5mg/mL undiluted — push rapidly",               notes:"Minimum 0.5mg (less causes paradoxical bradycardia). Ineffective for Mobitz II or CHB."},
  {drug:"Adenosine",         dose:"6mg rapid IV push; 12mg × 2 if needed",       route:"Rapid IV",    indication:"SVT termination",                        color:T.cyan,
   dilution:"Undiluted — follow immediately with 20mL NS flush",notes:"Half-life 6 sec — must flush rapidly. Use antecubital or central line. Warn patient."},
  {drug:"Magnesium Sulfate", dose:"2g IV over 5–15 min (push 1–2 min for TdP)",  route:"IV infusion", indication:"Torsades de Pointes; hypoMg arrest",     color:T.purple,
   dilution:"2g in 50–100mL NS or D5W",                        notes:"Polymorphic VT (TdP): push immediately. Also for hypomagnesemia-triggered arrest."},
  {drug:"Sodium Bicarbonate",dose:"1mEq/kg IV push",                             route:"IV push",     indication:"Hyperkalemia; prolonged arrest; TCA OD", color:T.teal,
   dilution:"8.4% solution (1mEq/mL) — undiluted or in 50–100mL", notes:"Flush line before/after — incompatible with calcium salts. Avoid in isolated respiratory acidosis."},
  {drug:"Calcium Chloride",  dose:"1g (10mL) IV",                                route:"IV slow push",indication:"Hyperkalemia; CCB OD; hypocalcemia",    color:T.green,
   dilution:"Undiluted — central line preferred (vesicant); peripheral acceptable in emergency", notes:"Gluconate preferred if peripheral (less caustic). Stabilizes myocardium in hyperK."},
  {drug:"Dopamine",          dose:"2–20 mcg/kg/min IV infusion",                 route:"IV infusion", indication:"Refractory bradycardia; post-ROSC hypotension", color:T.yellow,
   dilution:"400mg in 250mL NS (1600mcg/mL standard concentration)", notes:"Low dose (2–5): dopaminergic. Mid (5–10): beta-1. High (>10): alpha-1 vasopressor."},
  {drug:"Vasopressin",       dose:"40 units IV — one-time dose",                 route:"IV push",     indication:"Adjunct vasopressor in cardiac arrest",  color:T.coral,
   dilution:"40U undiluted",                                   notes:"May replace 1st or 2nd epi dose (Class IIb). No mortality benefit over epinephrine alone."},
];

const DEFIB_DATA = [
  {label:"Adult VF / pVT",              energy:"200J biphasic (360J monophasic)", color:T.red,    notes:"Escalate energy with each subsequent shock per manufacturer recommendation."},
  {label:"Adult Stable VT (cardioversion)", energy:"100–200J biphasic — SYNC",  color:T.orange, notes:"MUST synchronize. Start 100J; escalate if no conversion. Sedate first."},
  {label:"Adult AFib (cardioversion)",   energy:"120–200J biphasic — SYNC",     color:T.yellow, notes:"Higher initial energy improves first-shock success. Synchronized mode mandatory."},
  {label:"Adult SVT / AFlutter",        energy:"50–100J biphasic — SYNC",       color:T.cyan,   notes:"Lower energy often sufficient for regular narrow rhythms. Synchronize."},
  {label:"Pediatric VF / pVT",          energy:"2J/kg → 4J/kg subsequent",      color:T.coral,  notes:"Pediatric pads or adult pads ≥25kg. Use Broselow tape for weight estimation."},
  {label:"Pediatric Cardioversion",     energy:"0.5–1J/kg (max 2J/kg)",         color:T.purple, notes:"Synchronized mode. Sedate if time allows: ketamine 1–2mg/kg IM/IV."},
];

const PAD_POSITIONS = [
  {name:"Anterior-Lateral", use:"Standard defibrillation", color:T.teal,
   desc:"Right: infraclavicular — below clavicle at right sternal border | Left: lateral chest wall V5–V6 position, mid-axillary line"},
  {name:"Anterior-Posterior", use:"Preferred for cardioversion, AFib, TCP", color:T.blue,
   desc:"Anterior: left of sternum at V3–V4 position | Posterior: left infrascapular region between shoulder blades"},
];

const RSI_STEPS = [
  {label:"Prepare",           color:T.teal,   items:["Pre-oxygenate 100% NRB × 3–5 min or BVM 8 breaths (30 sec)","Position: sniffing or ear-to-sternal-notch (obese patients)","LEMON assessment — backup airway at bedside (LMA, CRIC kit, surgical set)","Monitoring: SpO2, waveform ETCO2, BP, cardiac monitor, IV/IO access"]},
  {label:"Induction Agent",   color:T.blue,   items:["Ketamine 1.5–2mg/kg IV — preferred: hemodynamic instability, asthma, trauma, status epilepticus","Etomidate 0.3mg/kg IV — hemodynamically neutral; avoid in sepsis/adrenal insufficiency","Propofol 1–2mg/kg IV — avoid if SBP <100 or hemodynamically compromised","Succinylcholine 1.5mg/kg IV (give 60 sec after induction agent)","Rocuronium 1.2–1.6mg/kg IV (RSI dose) — reversal: sugammadex 16mg/kg"]},
  {label:"Intubate",          color:T.orange, items:["DL: Mac 3/4 or Miller 2 blade. VL (Glidescope, C-MAC): preferred for all comers","Cuff: inflate to 20–30 cmH2O (cuff manometer preferred)","Confirm: direct visualization through cords + bilateral breath sounds + waveform capnography (gold standard)","CXR for tube position: tip should be 3–5 cm above carina"]},
  {label:"Post-Intubation",   color:T.purple, items:["Vent: TV 6–8mL/kg IBW, RR 12–16, PEEP 5 cmH2O, FiO2 1.0 → titrate down","Sedation: propofol 5–50 mcg/kg/min + fentanyl 25–100 mcg/h infusion","NG tube for gastric decompression — HOB 30° for VAP prevention","ABG in 30–60 min to confirm oxygenation/ventilation targets"]},
  {label:"CICO Protocol",     color:T.red,    items:["Scalpel-Finger-Bougie (SFB): fastest, most reliable surgical airway technique","Step 1: vertical stab incision at cricothyroid membrane (palpate or ultrasound)","Step 2: finger into trachea to confirm position and dilate tract","Step 3: bougie through incision → railroad 6.0 cuffed ETT or trach tube","CRIC kit must be at bedside for EVERY RSI — know its exact location before you start"]},
];

const H5T5 = [
  {letter:"H", cause:"Hypovolemia",            icon:"💉", color:T.blue,
   assess:"Flat neck veins, narrow pulse pressure, collapsed IVC on POCUS",
   treat:"1–2L NS/LR rapid bolus; blood products (1:1:1) if hemorrhagic; TXA 1g IV within 3h of trauma"},
  {letter:"H", cause:"Hypoxia",                icon:"🫁", color:T.teal,
   assess:"SpO2 low, cyanosis, poor air entry, foggy ETT — check BVM seal and chest rise",
   treat:"Optimize airway — suction, reposition, BVM → intubate; confirm ETT with waveform capnography"},
  {letter:"H", cause:"Hydrogen Ion (Acidosis)", icon:"🔬", color:T.orange,
   assess:"ABG pH <7.1, large anion gap, prolonged arrest, bicarb <10",
   treat:"NaHCO3 1mEq/kg IV; treat underlying cause (sepsis, DKA); optimize ventilation by increasing RR"},
  {letter:"H", cause:"Hypo/Hyperkalemia",      icon:"⚗️", color:T.yellow,
   assess:"ECG: peaked T-waves (hyperK), flattened T/U waves (hypoK); K+ level; ESRD or crush history",
   treat:"HyperK: CaCl 1g IV + insulin/dex + bicarb. HypoK: potassium 20mEq/h IV cautious repletion"},
  {letter:"H", cause:"Hypothermia",            icon:"🥶", color:T.cyan,
   assess:"Core temp <35°C, Osborne J-waves on ECG, ventricular dysrhythmias, history of cold exposure",
   treat:"Warm IVF 42°C, warm humidified O2, bear-hugger. ECMO for refractory. 'Not dead until warm and dead'"},
  {letter:"T", cause:"Tension Pneumothorax",   icon:"🫧", color:T.red,
   assess:"Absent unilateral breath sounds + hypotension + JVD — tracheal deviation is a late and unreliable finding",
   treat:"Immediate needle decompression 2nd ICS MCL (14G) → bilateral finger thoracostomy → chest tube"},
  {letter:"T", cause:"Tamponade",              icon:"❤️", color:T.coral,
   assess:"Beck's triad: hypotension + JVD + muffled heart sounds; POCUS: pericardial effusion + RV diastolic collapse",
   treat:"Emergency pericardiocentesis (subxiphoid); perimortem thoracotomy if traumatic etiology"},
  {letter:"T", cause:"Toxins",                 icon:"☠️", color:T.purple,
   assess:"Toxidrome pattern, medication list, pupil size, response to empiric antidotes",
   treat:"Naloxone (opioids); NaHCO3 (TCA / Na-channel blockers); lipid emulsion (fat-soluble drugs); atropine (OP)"},
  {letter:"T", cause:"Thrombosis — PE",        icon:"🩸", color:T.orange,
   assess:"RV dilation + McConnell sign on POCUS; pulseless despite CPR × 10+ min with no other cause identified",
   treat:"Empiric tPA 50mg IV bolus during arrest; or 100mg over 2h for massive PE with ROSC. CPR × 60–90 min post-lytics"},
  {letter:"T", cause:"Thrombosis — ACS",       icon:"🫀", color:T.yellow,
   assess:"Prior chest pain, STEMI on pre-arrest ECG, elevated post-ROSC troponin, ACS risk factors",
   treat:"Activate cath lab immediately; ASA 325mg via NGT; heparin; PPCI is treatment of choice"},
];

const SHOCK_TYPES = [
  {id:"distributive", label:"Distributive", icon:"🔥", color:T.red,
   sub:"Vasodilatory — warm shock — high output",
   co:"↑↑", svr:"↓↓", cvp:"↓", pcwp:"↓", svo2:"↑",
   causes:["Sepsis / septicemia (most common)","Anaphylaxis — allergen exposure","Neurogenic — high spinal cord injury","Adrenal crisis — steroid-dependent patients","Toxic: pancreatitis, SIRS, hepatic failure"],
   exam:["Warm, flushed extremities","Bounding pulses, widened pulse pressure","Fever or hypothermia in sepsis","Urticaria / stridor / wheeze in anaphylaxis"],
   treatment:["30mL/kg isotonic crystalloid bolus for sepsis","Norepinephrine first-line vasopressor (Class I)","Vasopressin 0.03U/min adjunct — spares norepi dose","Hydrocortisone 200mg/d if vasopressor-refractory septic shock","Anaphylaxis: epinephrine IM 0.3–0.5mg first — then vasopressors"],
   pearl:"ONLY shock type with elevated CO. In anaphylaxis: IM epi is first-line — not norepinephrine."},
  {id:"obstructive", label:"Obstructive", icon:"🚧", color:T.orange,
   sub:"Mechanical outflow block — relieve first",
   co:"↓↓", svr:"↑↑", cvp:"↑", pcwp:"↑/↓", svo2:"↓",
   causes:["Tension pneumothorax","Cardiac tamponade","Massive pulmonary embolism","Severe aortic stenosis","Auto-PEEP / breath stacking on vent"],
   exam:["JVD — tamponade, tension PTX, massive PE","Absent unilateral breath sounds (PTX)","Beck's triad: hypotension + JVD + muffled sounds","Tachycardia with pulsus paradoxus (tamponade)"],
   treatment:["Tension PTX: needle decompression 2nd ICS MCL → chest tube","Tamponade: pericardiocentesis emergently — keep HR up, avoid vasodilators","Massive PE: tPA 50–100mg systemic or catheter-directed thrombolysis","Avoid intubation if possible — PPV dramatically worsens obstructive physiology"],
   pearl:"Most reversible shock type. Relieve obstruction FIRST — vasopressors are only a bridge."},
  {id:"cardiogenic", label:"Cardiogenic", icon:"💔", color:T.coral,
   sub:"Pump failure — wet and cold",
   co:"↓↓", svr:"↑↑", cvp:"↑↑", pcwp:"↑↑", svo2:"↓↓",
   causes:["Anterior STEMI — LAD occlusion","Acute decompensated heart failure","Fulminant myocarditis","Acute valvular emergency (MR, AR, AS)","Malignant arrhythmia","Stress cardiomyopathy (Takotsubo)"],
   exam:["Cool, clammy, mottled extremities","Narrow pulse pressure","Elevated JVP, S3 gallop","Bibasilar crackles — pulmonary edema"],
   treatment:["Norepinephrine for MAP support — first-line vasopressor","Dobutamine 2–20mcg/kg/min for inotropy — lowest effective dose","Avoid aggressive fluids — worsens pulmonary edema","Emergent PCI for STEMI-associated cardiogenic shock","MCS: IABP, Impella 2.5/CP, VA-ECMO for refractory cases"],
   pearl:"LVEDP is elevated — aggressive fluids worsen outcome. Dobutamine increases O2 demand — use lowest dose."},
  {id:"hypovolemic", label:"Hypovolemic", icon:"🩸", color:T.yellow,
   sub:"Volume depletion — hemorrhagic or non-hemorrhagic",
   co:"↓", svr:"↑", cvp:"↓↓", pcwp:"↓↓", svo2:"↓",
   causes:["Hemorrhage — trauma, GI bleed, AAA rupture","Severe GI losses — vomiting, diarrhea, fistula","DKA / hyperosmolar hyperglycemic state","Burns — massive third spacing"],
   exam:["Tachycardia — earliest, most sensitive sign","Cool extremities, poor capillary refill","Orthostatic hypotension precedes supine hypotension","Flat neck veins, decreased skin turgor"],
   treatment:["Hemorrhage: massive transfusion protocol — 1:1:1 pRBC:FFP:PLT","TXA within 3h of traumatic hemorrhage — 1g IV over 10 min","Permissive hypotension (MAP 50–65) until surgical hemorrhage control","Identify and control source — do not resuscitate through active hemorrhage"],
   pearl:"Normal BP does NOT exclude hemorrhagic shock. Class II (15–30% volume loss) = tachycardia only."},
];

const VASOPRESSORS = [
  {id:"norepi",    name:"Norepinephrine", brand:"Levophed",      color:T.teal,   badge:"FIRST LINE",
   mech:"α1+2 dominant + β1 mild inotropy", dose:"0.01–3 mcg/kg/min",
   titrate:"Start 0.05–0.1 mcg/kg/min — titrate q5–10 min to MAP target",
   best:"Distributive (septic), Cardiogenic (MAP support), most shock states",
   avoid:"Hypovolemia without prior fluid resuscitation",
   pearl:"First-line per SCCM 2021. Use central line when possible — extravasation causes tissue ischemia."},
  {id:"epi",       name:"Epinephrine",    brand:"Adrenalin",     color:T.red,    badge:"ANAPHYLAXIS",
   mech:"β1+2 dominant at low dose → α1 predominant at high dose", dose:"0.01–1 mcg/kg/min",
   titrate:"Arrest: 1mg IV/IO q3–5min. Anaphylaxis: 0.3–0.5mg IM thigh",
   best:"Anaphylaxis (IM first-line), refractory septic shock, cardiogenic adjunct",
   avoid:"Isolated obstructive shock — does not relieve mechanical obstruction",
   pearl:"Drug of choice for anaphylaxis — IM thigh, not IV bolus. High infusion rates cause lactic acidosis."},
  {id:"vasopressin",name:"Vasopressin",   brand:"Vasostrict",    color:T.orange, badge:"ADJUNCT",
   mech:"V1 receptor — pure vasoconstriction, no inotropy or chronotropy", dose:"0.03–0.04 U/min (fixed)",
   titrate:"Fixed dose — not titrated up or down. Add-on to norepinephrine.",
   best:"Septic shock adjunct — reduces norepinephrine requirements and dose",
   avoid:"Cardiogenic shock — pure afterload increase without CO improvement",
   pearl:"VASST trial: spares catecholamine dose but no mortality benefit vs norepinephrine alone."},
  {id:"dopamine",  name:"Dopamine",       brand:"Intropin",      color:T.yellow, badge:"AVOID USUALLY",
   mech:"Dopaminergic (1–5) → β1 (5–10) → α1 predominant (>10 mcg/kg/min)", dose:"2–20 mcg/kg/min",
   titrate:"Dose-dependent receptor profile shift — unpredictable in practice",
   best:"Hemodynamically significant bradycardia with hypotension (chronotropic)",
   avoid:"Septic shock — higher arrhythmia rates + increased mortality vs norepinephrine",
   pearl:"2019 meta-analysis: significantly higher arrhythmia rates in septic shock. Rarely first-line today."},
  {id:"phenyl",    name:"Phenylephrine",  brand:"Neo-Synephrine", color:T.blue,  badge:"PURE ALPHA",
   mech:"Pure α1 agonist — no beta activity, no inotropy whatsoever", dose:"0.5–6 mcg/kg/min",
   titrate:"Rapid onset/offset — reflex bradycardia expected and common",
   best:"SVT with hypotension (reflex bradycardia may terminate SVT), spinal anesthesia hypotension",
   avoid:"Cardiogenic or any low-CO state — pure afterload increase = catastrophic",
   pearl:"No inotropy. Any reduced CO setting will worsen dramatically. Useful when norepi tachycardia is problematic."},
  {id:"dobutamine",name:"Dobutamine",     brand:"Dobutrex",      color:T.purple, badge:"INOTROPE",
   mech:"β1 dominant + β2 — increases CO, decreases SVR (vasodilatory)", dose:"2–20 mcg/kg/min",
   titrate:"Start 2.5 mcg/kg/min — titrate to CO, ScvO2 >70%, clinical perfusion markers",
   best:"Cardiogenic shock — low CO state, myocardial depression",
   avoid:"Hypotension as monotherapy — vasodilatory effect worsens MAP without vasopressor",
   pearl:"NOT a vasopressor. Always combine with norepinephrine in cardiogenic shock. Increases myocardial O2 demand."},
];

const ROSC_CHECKLIST = [
  {id:"airway",   text:"Confirm ETT placement — waveform capnography — CXR for position",               color:T.teal},
  {id:"vent",     text:"Vent: TV 6–8mL/kg IBW, RR 10, PEEP 5 — titrate to SpO2 94–98% and ETCO2 35–40", color:T.teal},
  {id:"o2",       text:"Titrate FiO2 — hyperoxia (SpO2 >98%) independently worsens neurological outcome", color:T.yellow},
  {id:"bp",       text:"MAP ≥65 mmHg — ≥80 if comatose. Start vasopressors (norepinephrine) if hypotensive", color:T.orange},
  {id:"ecg",      text:"12-lead ECG immediately — STEMI or new LBBB with ischemic context = cath lab NOW", color:T.red},
  {id:"labs",     text:"ABG, BMP, CBC, troponin, lactate, coags, blood cultures × 2 if infection suspected", color:T.blue},
  {id:"glucose",  text:"Glucose target 140–180 mg/dL — treat hypoglycemia aggressively; insulin drip for hyperglycemia", color:T.yellow},
  {id:"neuro",    text:"GCS, pupils, best motor response — document baseline for 72h prognostication timeline", color:T.purple},
  {id:"ttm",      text:"TTM: comatose survivors — target 32–36°C for 24h, controlled rewarming 0.25°C/hr", color:T.blue},
  {id:"seizure",  text:"Continuous EEG if comatose >20 min post-ROSC — treat electrographic seizures aggressively", color:T.purple},
  {id:"repeat",   text:"Repeat ABG + electrolytes at 1–2h — correct coagulopathy, electrolytes, anemia", color:T.blue},
  {id:"dispo",    text:"ICU admission — early family communication — neuro prognostication no earlier than 72h post-rewarming", color:T.teal},
];

const TABS = [
  {id:"acls",  label:"ACLS",          icon:"💓"},
  {id:"shock", label:"Shock",         icon:"🩸"},
  {id:"vaso",  label:"Vasopressors",  icon:"💉"},
  {id:"meds",  label:"Resus Meds",    icon:"💊"},
  {id:"tools", label:"Defib & Airway",icon:"⚡"},
  {id:"ht",    label:"5H5T",          icon:"❓"},
  {id:"rosc",  label:"Post-ROSC",     icon:"✅"},
];

// ── Module-Scope Primitives ────────────────────────────────────────
function AmbientBg() {
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}>
      <div style={{position:"absolute",top:"-15%",left:"-10%",width:"55%",height:"55%",
        background:"radial-gradient(circle,rgba(255,68,68,0.09) 0%,transparent 70%)"}}/>
      <div style={{position:"absolute",bottom:"-10%",right:"-5%",width:"50%",height:"50%",
        background:"radial-gradient(circle,rgba(0,229,192,0.07) 0%,transparent 70%)"}}/>
      <div style={{position:"absolute",top:"40%",left:"30%",width:"35%",height:"35%",
        background:"radial-gradient(circle,rgba(155,109,255,0.05) 0%,transparent 70%)"}}/>
    </div>
  );
}

function BulletRow({ text, color }) {
  return (
    <div style={{display:"flex",gap:7,alignItems:"flex-start",marginBottom:4}}>
      <span style={{color:color||T.teal,fontSize:8,marginTop:2,flexShrink:0}}>▸</span>
      <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.5}}>{text}</span>
    </div>
  );
}

function Badge({ label, color }) {
  return (
    <span style={{fontFamily:"JetBrains Mono",fontSize:9,fontWeight:700,padding:"2px 7px",
      borderRadius:20,background:`${color}18`,border:`1px solid ${color}44`,
      color,whiteSpace:"nowrap",textTransform:"uppercase",letterSpacing:1}}>
      {label}
    </span>
  );
}

function StepCard({ step, color }) {
  return (
    <div style={{...glass,padding:"12px 14px",borderLeft:`3px solid ${color}`}}>
      <div style={{display:"flex",gap:8,alignItems:"baseline",marginBottom:8}}>
        <span style={{fontFamily:"JetBrains Mono",fontSize:9,color,fontWeight:700,
          letterSpacing:1.5,whiteSpace:"nowrap"}}>{step.phase}</span>
        <span style={{fontFamily:"DM Sans",fontWeight:700,fontSize:13,color:T.txt}}>{step.label}</span>
      </div>
      {step.actions.map((a,i) => <BulletRow key={i} text={a} color={color}/>)}
    </div>
  );
}

function AlgorithmCard({ algo }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{...glass,overflow:"hidden",marginBottom:12,
      border:`1px solid ${open?algo.color+"55":"rgba(42,79,122,0.35)"}`,
      borderTop:`3px solid ${algo.color}`}}>
      <div onClick={()=>setOpen(o=>!o)}
        style={{padding:"14px 18px",cursor:"pointer",display:"flex",alignItems:"center",gap:12,
          background:`linear-gradient(135deg,${algo.color}08,rgba(8,22,40,0.9))`}}>
        <span style={{fontSize:20}}>{algo.icon}</span>
        <div style={{flex:1}}>
          <div style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:16,color:algo.color}}>{algo.title}</div>
          <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,marginTop:2}}>{algo.steps.length} phases</div>
        </div>
        <Badge label={algo.urgency} color={algo.color}/>
        <span style={{color:T.txt4,fontSize:14,marginLeft:4}}>{open?"▲":"▼"}</span>
      </div>
      {open && (
        <div className="fade-in" style={{padding:"0 18px 16px"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:10,margin:"12px 0"}}>
            {algo.steps.map((s,i) => <StepCard key={i} step={s} color={algo.color}/>)}
          </div>
          <div style={{padding:"12px 14px",background:`${T.yellow}0a`,border:`1px solid ${T.yellow}22`,borderRadius:10}}>
            <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.yellow,fontWeight:700,letterSpacing:1.5,marginBottom:8}}>💎 CLINICAL PEARLS</div>
            {algo.pearls.map((p,i) => <BulletRow key={i} text={p} color={T.yellow}/>)}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────
export default function ResusHub() {
  const [tab, setTab]                     = useState("acls");
  const [checked, setChecked]             = useState({});
  const [expandedShock, setExpandedShock] = useState("distributive");
  const [expandedVaso, setExpandedVaso]   = useState("norepi");

  const toggleCheck = useCallback((id) => {
    setChecked(p => ({...p, [id]: !p[id]}));
  }, []);

  const checkedCount = ROSC_CHECKLIST.filter(i => checked[i.id]).length;

  return (
    <div style={{fontFamily:"DM Sans, sans-serif",background:T.bg,minHeight:"100vh",
      position:"relative",overflow:"hidden",color:T.txt}}>
      <AmbientBg/>
      <div style={{position:"relative",zIndex:1,maxWidth:1440,margin:"0 auto",padding:"0 16px"}}>

        {/* Header */}
        <div style={{padding:"18px 0 14px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <div style={{backdropFilter:"blur(40px)",WebkitBackdropFilter:"blur(40px)",
              background:"rgba(5,15,30,0.9)",border:"1px solid rgba(42,79,122,0.6)",
              borderRadius:10,padding:"5px 12px",display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.coral,letterSpacing:3}}>NOTRYA</span>
              <span style={{color:T.txt4,fontFamily:"JetBrains Mono",fontSize:10}}>/</span>
              <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.txt3,letterSpacing:2}}>RESUS</span>
            </div>
            <div style={{height:1,flex:1,background:"linear-gradient(90deg,rgba(255,107,107,0.5),transparent)"}}/>
          </div>
          <h1 className="shimmer-text"
            style={{fontFamily:"Playfair Display",fontSize:"clamp(24px,4vw,40px)",fontWeight:900,letterSpacing:-1,lineHeight:1.1}}>
            ResusHub
          </h1>
          <p style={{fontFamily:"DM Sans",fontSize:12,color:T.txt3,marginTop:4}}>
            ACLS · Shock · Vasopressors · Resus Meds · Defib & Airway · 5H5T · Post-ROSC
          </p>
        </div>

        {/* Stat Banner */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:16}}>
          {[
            {label:"ACLS Algorithms",  value:"4",         sub:"VF·PEA·Brady·Tachy",  color:T.red},
            {label:"Resus Medications",value:"10 Drugs",  sub:"Dose·Dilution·Route", color:T.orange},
            {label:"Defib Protocols",  value:"6",         sub:"Adult · Pediatric",   color:T.yellow},
            {label:"Shock Types",      value:"4",         sub:"Hemodynamic matrix",  color:T.coral},
            {label:"5H5T Reversible",  value:"10 Causes", sub:"Search all in CPR",   color:T.teal},
            {label:"Post-ROSC Steps",  value:"12",        sub:"Checklist + TTM",     color:T.blue},
          ].map((b,i) => (
            <div key={i} style={{...glass,padding:"9px 13px",borderLeft:`3px solid ${b.color}`,
              background:`linear-gradient(135deg,${b.color}12,rgba(8,22,40,0.8))`,borderRadius:10}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:14,fontWeight:700,color:b.color,lineHeight:1}}>{b.value}</div>
              <div style={{fontFamily:"DM Sans",fontWeight:600,color:T.txt,fontSize:10,margin:"3px 0"}}>{b.label}</div>
              <div style={{fontFamily:"DM Sans",fontSize:9,color:T.txt4}}>{b.sub}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{...glass,padding:"6px",display:"flex",gap:4,marginBottom:16,flexWrap:"wrap"}}>
          {TABS.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{flex:"1 1 auto",fontFamily:"DM Sans",fontWeight:600,fontSize:11,padding:"9px 6px",
                borderRadius:10,
                border:`1px solid ${tab===t.id?"rgba(255,107,107,0.5)":"transparent"}`,
                background:tab===t.id?"linear-gradient(135deg,rgba(255,107,107,0.18),rgba(255,107,107,0.07))":"transparent",
                color:tab===t.id?T.coral:T.txt3,
                cursor:"pointer",textAlign:"center",transition:"all .15s",whiteSpace:"nowrap"}}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ═══ ACLS ═══ */}
        {tab === "acls" && (
          <div className="fade-in">
            <div style={{padding:"10px 14px",background:"rgba(255,68,68,0.07)",border:"1px solid rgba(255,68,68,0.2)",
              borderRadius:10,marginBottom:14,fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.7}}>
              💓 <strong style={{color:T.red}}>AHA ACLS 2020:</strong> Click any card to expand the full algorithm.
              High-quality CPR is the single most critical intervention across all rhythms. Minimize hands-off time.
            </div>
            {ACLS_ALGORITHMS.map(a => <AlgorithmCard key={a.id} algo={a}/>)}
          </div>
        )}

        {/* ═══ SHOCK ═══ */}
        {tab === "shock" && (
          <div className="fade-in">
            <div style={{padding:"10px 14px",background:"rgba(255,107,107,0.07)",border:"1px solid rgba(255,107,107,0.2)",
              borderRadius:10,marginBottom:14,fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.7}}>
              🩸 <strong style={{color:T.coral}}>Shock:</strong> MAP &lt;65 mmHg + signs of hypoperfusion — lactate ≥2, AMS, oliguria, cool extremities.
            </div>
            <div style={{...glass,padding:"12px 14px",marginBottom:14,borderRadius:12,overflowX:"auto"}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt3,letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>Hemodynamic Profile Matrix</div>
              <div style={{display:"grid",gridTemplateColumns:"auto repeat(4,1fr)",gap:0,minWidth:440}}>
                {["Parameter","Distributive","Obstructive","Cardiogenic","Hypovolemic"].map((h,i) => (
                  <div key={i} style={{fontFamily:"JetBrains Mono",fontSize:10,fontWeight:700,
                    padding:"6px 10px",borderBottom:"1px solid rgba(42,79,122,0.3)",
                    color:[T.txt4,T.red,T.orange,T.coral,T.yellow][i],
                    textAlign:i===0?"left":"center"}}>{h}</div>
                ))}
                {[["CO",s=>s.co],["SVR",s=>s.svr],["CVP",s=>s.cvp],["PCWP",s=>s.pcwp],["SvO2",s=>s.svo2]].map(([param,fn]) => (
                  <Fragment key={param}>
                    <div style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.txt4,
                      padding:"5px 10px",borderBottom:"1px solid rgba(42,79,122,0.15)"}}>{param}</div>
                    {SHOCK_TYPES.map((s,i) => (
                      <div key={param+i} style={{fontFamily:"JetBrains Mono",fontSize:13,fontWeight:700,
                        textAlign:"center",padding:"5px 8px",color:s.color,
                        borderBottom:"1px solid rgba(42,79,122,0.15)",
                        background:expandedShock===s.id?`${s.color}08`:"transparent"}}>
                        {fn(s)}
                      </div>
                    ))}
                  </Fragment>
                ))}
              </div>
            </div>
            {SHOCK_TYPES.map(s => (
              <div key={s.id} onClick={()=>setExpandedShock(expandedShock===s.id?null:s.id)}
                style={{...glass,overflow:"hidden",cursor:"pointer",marginBottom:10,
                  border:`1px solid ${expandedShock===s.id?s.color+"55":"rgba(42,79,122,0.35)"}`,
                  borderTop:`3px solid ${s.color}`,transition:"border-color .15s"}}>
                <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px"}}>
                  <span style={{fontSize:22}}>{s.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:15,color:s.color}}>{s.label} Shock</div>
                    <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt4,marginTop:1}}>{s.sub}</div>
                  </div>
                  <div style={{display:"flex",gap:5}}>
                    {[["CO",s.co],["SVR",s.svr]].map(([k,v]) => (
                      <div key={k} style={{textAlign:"center",padding:"3px 7px",
                        background:`${s.color}10`,border:`1px solid ${s.color}28`,borderRadius:6}}>
                        <div style={{fontFamily:"JetBrains Mono",fontSize:7,color:T.txt4}}>{k}</div>
                        <div style={{fontFamily:"JetBrains Mono",fontSize:11,fontWeight:700,color:s.color}}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <span style={{color:T.txt4,fontSize:12}}>{expandedShock===s.id?"▲":"▼"}</span>
                </div>
                {expandedShock===s.id && (
                  <div className="fade-in" style={{borderTop:"1px solid rgba(42,79,122,0.3)",padding:"12px 16px 14px"}}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:10}}>
                      <div>
                        <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:1.5,marginBottom:7}}>Causes</div>
                        {s.causes.map((c,i) => <BulletRow key={i} text={c} color={s.color}/>)}
                      </div>
                      <div>
                        <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:1.5,marginBottom:7}}>Exam Findings</div>
                        {s.exam.map((e,i) => <BulletRow key={i} text={e} color={T.blue}/>)}
                      </div>
                      <div>
                        <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:1.5,marginBottom:7}}>Treatment</div>
                        {s.treatment.map((tr,i) => <BulletRow key={i} text={tr} color={T.green}/>)}
                      </div>
                    </div>
                    <div style={{padding:"8px 12px",background:`${s.color}0d`,border:`1px solid ${s.color}25`,borderRadius:8}}>
                      <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:s.color,letterSpacing:1,textTransform:"uppercase"}}>Pearl: </span>
                      <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2}}>{s.pearl}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ═══ VASOPRESSORS ═══ */}
        {tab === "vaso" && (
          <div className="fade-in">
            <div style={{padding:"10px 14px",background:"rgba(0,212,255,0.06)",border:"1px solid rgba(0,212,255,0.2)",
              borderRadius:10,marginBottom:14,fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.7}}>
              💉 <strong style={{color:T.cyan}}>Vasopressors:</strong> Correct hypovolemia before initiating. Norepinephrine is first-line for most shock states. Vasopressors bridge — not replace — source control.
            </div>
            <div style={{...glass,padding:"12px 14px",marginBottom:14,borderRadius:12}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt3,letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>Selection by Shock Phenotype</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:8}}>
                {[
                  {shock:"Distributive/Septic",drugs:["Norepinephrine — 1st line","Vasopressin 0.03U — adjunct","Epinephrine — 2nd line"],color:T.red},
                  {shock:"Cardiogenic",         drugs:["Norepinephrine — MAP","Dobutamine — CO support","Epinephrine — combined"],color:T.coral},
                  {shock:"Obstructive",         drugs:["Relieve obstruction first!","Norepinephrine — bridge only","Avoid vasodilators"],color:T.orange},
                  {shock:"Hypovolemic",         drugs:["Volume resuscitation first","Norepinephrine — bridge","Vasopressin — refractory"],color:T.yellow},
                ].map((m,i) => (
                  <div key={i} style={{padding:"10px 12px",background:`${m.color}10`,border:`1px solid ${m.color}30`,borderRadius:10}}>
                    <div style={{fontFamily:"JetBrains Mono",fontSize:9,fontWeight:700,color:m.color,textTransform:"uppercase",letterSpacing:1,marginBottom:7}}>{m.shock}</div>
                    {m.drugs.map((d,j) => (
                      <div key={j} style={{display:"flex",gap:5,alignItems:"flex-start",marginBottom:4}}>
                        <span style={{color:j===0?T.green:T.txt4,fontSize:8,marginTop:2}}>▸</span>
                        <span style={{fontFamily:"DM Sans",fontSize:11,color:j===0?T.txt:T.txt3,fontWeight:j===0?600:400}}>{d}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            {VASOPRESSORS.map(drug => (
              <div key={drug.id} onClick={()=>setExpandedVaso(expandedVaso===drug.id?null:drug.id)}
                style={{...glass,overflow:"hidden",cursor:"pointer",marginBottom:10,
                  border:`1px solid ${expandedVaso===drug.id?drug.color+"55":"rgba(42,79,122,0.35)"}`,
                  borderTop:`3px solid ${drug.color}`,transition:"border-color .15s"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px"}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:3}}>
                      <span style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:15,color:drug.color}}>{drug.name}</span>
                      <span style={{fontFamily:"DM Sans",fontSize:11,color:T.txt4}}>{drug.brand}</span>
                      <Badge label={drug.badge} color={drug.color}/>
                    </div>
                    <div style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.txt3}}>{drug.mech}</div>
                  </div>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:11,fontWeight:700,color:drug.color,flexShrink:0}}>{drug.dose}</div>
                  <span style={{color:T.txt4,fontSize:12,marginLeft:4}}>{expandedVaso===drug.id?"▲":"▼"}</span>
                </div>
                {expandedVaso===drug.id && (
                  <div className="fade-in" style={{borderTop:"1px solid rgba(42,79,122,0.3)",padding:"12px 14px 14px"}}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                      <div style={{padding:"9px 11px",background:`${T.green}0d`,border:`1px solid ${T.green}28`,borderRadius:8}}>
                        <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.green,letterSpacing:1.5,textTransform:"uppercase",marginBottom:4}}>Best For</div>
                        <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2}}>{drug.best}</div>
                      </div>
                      <div style={{padding:"9px 11px",background:`${T.red}0d`,border:`1px solid ${T.red}28`,borderRadius:8}}>
                        <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.red,letterSpacing:1.5,textTransform:"uppercase",marginBottom:4}}>Avoid In</div>
                        <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2}}>{drug.avoid}</div>
                      </div>
                    </div>
                    <div style={{padding:"9px 11px",background:"rgba(42,79,122,0.14)",border:"1px solid rgba(42,79,122,0.3)",borderRadius:8,marginBottom:10}}>
                      <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt3,letterSpacing:1.5,textTransform:"uppercase",marginBottom:4}}>Titration</div>
                      <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2}}>{drug.titrate}</div>
                    </div>
                    <div style={{padding:"9px 12px",background:`${drug.color}0d`,border:`1px solid ${drug.color}28`,borderRadius:8}}>
                      <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:drug.color,letterSpacing:1,textTransform:"uppercase"}}>Pearl: </span>
                      <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2}}>{drug.pearl}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ═══ RESUS MEDS ═══ */}
        {tab === "meds" && (
          <div className="fade-in">
            <div style={{padding:"10px 14px",background:"rgba(255,107,107,0.07)",border:"1px solid rgba(255,107,107,0.2)",
              borderRadius:10,marginBottom:14,fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.7}}>
              💊 <strong style={{color:T.coral}}>Resus Medications:</strong> Doses for average adult. Confirm weight-based dosing for pediatric patients. Verify against current ACLS guidelines and institutional protocols.
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:10}}>
              {RESUS_MEDS.map((m,i) => (
                <div key={i} style={{...glass,padding:"14px 16px",
                  border:`1px solid rgba(42,79,122,0.35)`,borderTop:`3px solid ${m.color}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                    <div style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:15,color:m.color}}>{m.drug}</div>
                    <span style={{fontFamily:"JetBrains Mono",fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:20,
                      background:`${m.color}14`,border:`1px solid ${m.color}33`,color:m.color,whiteSpace:"nowrap"}}>{m.route}</span>
                  </div>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:11,color:T.txt,fontWeight:700,marginBottom:4}}>{m.dose}</div>
                  <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt3,marginBottom:8}}>
                    <span style={{color:T.txt4,fontWeight:700}}>Indication: </span>{m.indication}
                  </div>
                  <div style={{padding:"6px 10px",background:`${m.color}08`,border:`1px solid ${m.color}18`,borderRadius:8,marginBottom:6}}>
                    <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:m.color,fontWeight:700,marginBottom:2}}>DILUTION / PREP</div>
                    <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt2}}>{m.dilution}</div>
                  </div>
                  <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt3,lineHeight:1.5}}>{m.notes}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ DEFIB & AIRWAY ═══ */}
        {tab === "tools" && (
          <div className="fade-in">
            <div style={{fontFamily:"Playfair Display",fontSize:17,fontWeight:700,color:T.yellow,marginBottom:10}}>⚡ Defibrillation & Cardioversion</div>
            <div style={{...glass,padding:"14px 16px",marginBottom:12}}>
              {DEFIB_DATA.map((d,i) => (
                <div key={i} style={{padding:"10px 13px",background:`${d.color}08`,
                  border:`1px solid ${d.color}22`,borderRadius:10,marginBottom:i<DEFIB_DATA.length-1?8:0}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                    gap:10,flexWrap:"wrap",marginBottom:3}}>
                    <div style={{fontFamily:"DM Sans",fontWeight:700,fontSize:13,color:d.color}}>{d.label}</div>
                    <div style={{fontFamily:"JetBrains Mono",fontSize:12,fontWeight:700,color:T.txt}}>{d.energy}</div>
                  </div>
                  <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt3}}>{d.notes}</div>
                </div>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
              {PAD_POSITIONS.map((p,i) => (
                <div key={i} style={{...glass,padding:"12px 14px",background:`${p.color}08`,
                  border:`1px solid ${p.color}22`,borderRadius:12}}>
                  <div style={{fontFamily:"DM Sans",fontWeight:700,fontSize:13,color:p.color,marginBottom:3}}>{p.name}</div>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,marginBottom:7}}>For: {p.use}</div>
                  <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt2,lineHeight:1.6}}>{p.desc}</div>
                </div>
              ))}
            </div>
            <div style={{...glass,padding:"12px 16px",marginBottom:16,
              border:`1px solid rgba(42,79,122,0.35)`,borderLeft:`4px solid ${T.red}`}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.red,textTransform:"uppercase",letterSpacing:2,marginBottom:8}}>⚠️ Critical Reminders</div>
              {["SYNCHRONIZE for cardioversion — failure to sync can trigger VF","Resume CPR immediately after shock — no pause to check rhythm","Announce 'all clear' — nobody touching the patient at discharge","DSED: two simultaneous shocks for refractory VF — reasonable per 2023 data","Pacemaker/ICD: place pads ≥8cm from device — consider AP position"].map((r,i) => (
                <BulletRow key={i} text={r} color={T.red}/>
              ))}
            </div>
            <div style={{fontFamily:"Playfair Display",fontSize:17,fontWeight:700,color:T.blue,marginBottom:10}}>🌬️ Emergency Airway / RSI</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(265px,1fr))",gap:10,marginBottom:16}}>
              {RSI_STEPS.map((s,i) => (
                <div key={i} style={{...glass,padding:"13px 15px",
                  border:`1px solid rgba(42,79,122,0.35)`,borderTop:`3px solid ${s.color}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                    <div style={{width:22,height:22,borderRadius:"50%",background:`${s.color}18`,
                      border:`1px solid ${s.color}44`,display:"flex",alignItems:"center",
                      justifyContent:"center",fontFamily:"JetBrains Mono",fontSize:10,fontWeight:700,color:s.color}}>{i+1}</div>
                    <div style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:14,color:s.color}}>{s.label}</div>
                  </div>
                  {s.items.map((item,j) => <BulletRow key={j} text={item} color={s.color}/>)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ 5H5T ═══ */}
        {tab === "ht" && (
          <div className="fade-in">
            <div style={{padding:"10px 14px",background:"rgba(255,159,67,0.07)",border:"1px solid rgba(255,159,67,0.2)",
              borderRadius:10,marginBottom:14,fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.7}}>
              ❓ <strong style={{color:T.orange}}>5H5T Reversible Causes:</strong> Search and treat ALL causes simultaneously during CPR. POCUS is essential for identifying tamponade, PTX, and hypovolemia at every pulse check.
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div>
                <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.blue,textTransform:"uppercase",letterSpacing:2,marginBottom:10,fontWeight:700}}>5 H&apos;s</div>
                {H5T5.filter(e=>e.letter==="H").map((e,i) => (
                  <div key={i} style={{...glass,padding:"12px 14px",borderLeft:`3px solid ${e.color}`,marginBottom:8}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                      <span style={{fontSize:16}}>{e.icon}</span>
                      <div style={{fontFamily:"DM Sans",fontWeight:700,fontSize:13,color:e.color}}>{e.cause}</div>
                    </div>
                    <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt3,marginBottom:5}}>
                      <span style={{color:T.txt4,fontWeight:700}}>Assess: </span>{e.assess}
                    </div>
                    <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt2,lineHeight:1.5}}>
                      <span style={{color:e.color,fontWeight:700}}>Treat: </span>{e.treat}
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.red,textTransform:"uppercase",letterSpacing:2,marginBottom:10,fontWeight:700}}>5 T&apos;s</div>
                {H5T5.filter(e=>e.letter==="T").map((e,i) => (
                  <div key={i} style={{...glass,padding:"12px 14px",borderLeft:`3px solid ${e.color}`,marginBottom:8}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                      <span style={{fontSize:16}}>{e.icon}</span>
                      <div style={{fontFamily:"DM Sans",fontWeight:700,fontSize:13,color:e.color}}>{e.cause}</div>
                    </div>
                    <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt3,marginBottom:5}}>
                      <span style={{color:T.txt4,fontWeight:700}}>Assess: </span>{e.assess}
                    </div>
                    <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt2,lineHeight:1.5}}>
                      <span style={{color:e.color,fontWeight:700}}>Treat: </span>{e.treat}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ POST-ROSC ═══ */}
        {tab === "rosc" && (
          <div className="fade-in">
            <div style={{padding:"10px 14px",background:"rgba(0,229,192,0.07)",border:"1px solid rgba(0,229,192,0.2)",
              borderRadius:10,marginBottom:14,fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.7}}>
              ✅ <strong style={{color:T.teal}}>Post-ROSC Care:</strong> The first hour after ROSC is as critical as the arrest. Systematic management prevents secondary brain injury and optimizes neurological outcomes.
            </div>
            <div style={{...glass,padding:"10px 14px",marginBottom:14,borderRadius:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <span style={{fontFamily:"DM Sans",fontWeight:600,fontSize:12,color:T.txt}}>Checklist Progress</span>
                <span style={{fontFamily:"JetBrains Mono",fontSize:13,fontWeight:700,color:T.teal}}>{checkedCount} / {ROSC_CHECKLIST.length}</span>
              </div>
              <div style={{height:5,background:"rgba(42,79,122,0.4)",borderRadius:3,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${(checkedCount/ROSC_CHECKLIST.length)*100}%`,
                  background:`linear-gradient(90deg,${T.teal},${T.blue})`,borderRadius:3,transition:"width .3s"}}/>
              </div>
            </div>
            <div style={{marginBottom:16}}>
              {ROSC_CHECKLIST.map(item => (
                <div key={item.id} onClick={()=>toggleCheck(item.id)}
                  style={{display:"flex",gap:10,alignItems:"flex-start",padding:"9px 12px",
                    borderRadius:10,cursor:"pointer",marginBottom:5,
                    backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",
                    background:checked[item.id]?`${item.color}0e`:"rgba(8,22,40,0.6)",
                    border:`1px solid ${checked[item.id]?item.color+"44":"rgba(42,79,122,0.25)"}`,
                    transition:"all .12s"}}>
                  <div style={{width:18,height:18,borderRadius:5,flexShrink:0,marginTop:1,
                    border:`2px solid ${checked[item.id]?item.color:T.txt4}`,
                    background:checked[item.id]?item.color:"transparent",
                    display:"flex",alignItems:"center",justifyContent:"center",transition:"all .12s"}}>
                    {checked[item.id] && <span style={{color:"#050f1e",fontSize:11,fontWeight:900}}>✓</span>}
                  </div>
                  <span style={{fontFamily:"DM Sans",fontSize:12,lineHeight:1.55,
                    color:checked[item.id]?T.txt:T.txt2}}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{textAlign:"center",paddingBottom:24,paddingTop:14}}>
          <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,letterSpacing:1.5}}>
            NOTRYA RESUSHUB · AHA ACLS 2020 · SCCM SEPSIS 2021 · TTM2 TRIAL · VERIFY ALL IN CLINICAL CONTEXT
          </span>
        </div>
      </div>
    </div>
  );
}