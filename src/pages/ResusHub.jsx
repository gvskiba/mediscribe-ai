import { useState } from "react";
import { useNavigate } from "react-router-dom";

(() => {
  if (document.getElementById("resus-fonts")) return;
  const l = document.createElement("link"); l.id = "resus-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "resus-css";
  s.textContent = `
    *{box-sizing:border-box;}
    ::-webkit-scrollbar{width:3px;height:3px;}
    ::-webkit-scrollbar-thumb{background:rgba(42,79,122,0.5);border-radius:2px;}
    @keyframes fadeSlide{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
    @keyframes pulseDot{0%,100%{box-shadow:0 0 0 0 rgba(255,68,68,0.5)}50%{box-shadow:0 0 0 8px rgba(255,68,68,0)}}
    .resus-fade{animation:fadeSlide .22s ease forwards;}
    .resus-shimmer{background:linear-gradient(90deg,#e8f0fe 0%,#fff 30%,#ff6b6b 52%,#ff9f43 72%,#e8f0fe 100%);background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 5s linear infinite;}
  `;
  document.head.appendChild(s);
})();

const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36",
  b:"rgba(26,53,85,0.8)", bhi:"rgba(42,79,122,0.9)",
  txt:"#e8f0fe", txt2:"#8aaccc", txt3:"#4a6a8a", txt4:"#2e4a6a",
  red:"#ff4444", coral:"#ff6b6b", orange:"#ff9f43",
  yellow:"#f5c842", green:"#3dffa0", teal:"#00e5c0",
  blue:"#3b9eff", purple:"#9b6dff", cyan:"#00d4ff",
};

const glass = {
  backdropFilter:"blur(24px) saturate(180%)",
  WebkitBackdropFilter:"blur(24px) saturate(180%)",
  background:"rgba(8,22,40,0.78)",
  border:"1px solid rgba(42,79,122,0.35)",
  borderRadius:14,
};

// ── DATA ──────────────────────────────────────────────────────────────────────

const TABS = [
  { id:"acls",     label:"ACLS Algorithms",   icon:"💓" },
  { id:"meds",     label:"Resus Meds",         icon:"💊" },
  { id:"defib",    label:"Defibrillation",     icon:"⚡" },
  { id:"airway",   label:"Airway Emergency",   icon:"🌬️" },
  { id:"pea",      label:"PEA / 5H5T",         icon:"❓" },
  { id:"post",     label:"Post-ROSC Care",     icon:"💚" },
];

const ACLS_ALGORITHMS = [
  {
    id:"vfvt", title:"VF / Pulseless VT", color:T.red, urgency:"SHOCKABLE",
    urgencyColor:T.red, icon:"⚡",
    steps:[
      { phase:"0–2 min", label:"CPR Cycle 1", actions:["High-quality CPR immediately — 100–120 bpm, 2–2.4\" depth","Minimize interruptions <10 seconds","Defibrillate as soon as available — 200 J biphasic (360 J monophasic)","Resume CPR immediately after shock — do NOT pause for rhythm check","Establish IV/IO access during compressions"] },
      { phase:"2–4 min", label:"CPR Cycle 2 + Epi", actions:["Epinephrine 1 mg IV/IO — administer during compressions","Continue CPR × 2 min","Rhythm check — if shockable: shock, resume CPR","Consider advanced airway — do not pause CPR for intubation"] },
      { phase:"4–6 min", label:"CPR Cycle 3 + Amiodarone", actions:["Amiodarone 300 mg IV/IO push (or Lidocaine 1–1.5 mg/kg if no amiodarone)","Shock immediately if still VF/pVT","CPR 2 min — reassess","Epinephrine q3–5 min throughout"] },
      { phase:"6–10 min", label:"Refractory VF", actions:["Amiodarone 150 mg IV/IO (second dose if needed)","Double sequential defibrillation (DSD): two pads, simultaneous shocks — for refractory VF","Consider sodium bicarbonate 1 mEq/kg if prolonged arrest or known hyperkalemia","Treat reversible causes (5H5T)","Mechanical CPR device (LUCAS, AutoPulse) if available"] },
    ],
    pearls:["Push hard, push fast, let chest fully recoil — allow complete recoil between compressions","Switch compressors every 2 minutes to prevent fatigue-related quality decline","Do NOT stop CPR to check rhythm or pulse — minimize hands-off time","Defibrillation is the ONLY effective treatment for VF — medications are adjunctive","TTM 32–36°C for comatose post-ROSC patients"],
  },
  {
    id:"pea", title:"PEA / Asystole", color:T.orange, urgency:"NON-SHOCKABLE",
    urgencyColor:T.orange, icon:"❓",
    steps:[
      { phase:"0–2 min", label:"CPR + Epi NOW", actions:["CPR immediately — do NOT defibrillate","Epinephrine 1 mg IV/IO as soon as possible (do not delay)","If asystole: confirm in 2+ leads — true asystole vs fine VF","IV/IO access — large bore, antecubital or IO tibia","Consider advanced airway"] },
      { phase:"2–4 min", label:"Search 5H5T", actions:["Continue CPR × 2 min while searching for reversible causes","Hypovolemia — push 1–2L NS or blood if trauma","Hypoxia — optimize ventilation, confirm airway/ETT position","Hypo/Hyperkalemia — 10% calcium chloride 1g IV if hyperK suspected","H⁺ (Acidosis) — sodium bicarb 1 mEq/kg IV if pH <7.1 or prolonged arrest"] },
      { phase:"4+ min", label:"Continue + 5T Search", actions:["Tension PTX — bilateral finger thoracostomy or needle decompression","Tamponade — pericardiocentesis or REBOA/thoracotomy","Thrombosis (PE) — empiric tPA 50 mg IV bolus if suspected massive PE","Thrombosis (MI) — PPCI post-ROSC or cath lab activation","Toxins — naloxone, sodium bicarb, lipid emulsion (per toxidrome)","Epinephrine q3–5 min throughout"] },
      { phase:"Decision", label:"Termination Criteria", actions:["Consider stopping if: no ROSC after 20+ min, no reversible cause identified, unwitnessed, no bystander CPR, flatline throughout","Ultrasound — cardiac standstill on echo = very poor prognosis","DOCUMENT time, quality of CPR, all interventions, decision-making","Communicate with family early — chaplain/social work at bedside"] },
    ],
    pearls:["PEA = organized rhythm on monitor + no pulse — feel for femoral or carotid ×10 sec","POCUS is critical: identify tamponade, hypovolemia (collapsed IVC), massive PE (dilated RV)","Epinephrine timing: administer as soon as IV/IO established — every 3–5 min","Asystole: confirm flatline is real — gain more lead, check contacts, increase gain","Witnessed arrest with fine VF: defibrillate — do not delay for 'charging'"],
  },
  {
    id:"brady", title:"Bradycardia", color:T.yellow, urgency:"HR < 50",
    urgencyColor:T.yellow, icon:"⬇️",
    steps:[
      { phase:"Assess", label:"Is the patient symptomatic?", actions:["Symptomatic = hypotension, AMS, chest pain, pulmonary edema, signs of shock","Asymptomatic bradycardia → monitor, 12-lead ECG, no immediate intervention","HR <50 bpm with symptoms → treat immediately","Attach pads — be ready to pace at any moment"] },
      { phase:"Pharmacologic", label:"Atropine First-Line", actions:["Atropine 0.5 mg IV — repeat q3–5 min, max 3 mg","If no response after 1–2 doses → transcutaneous pacing","Dopamine 2–10 mcg/kg/min if atropine fails (infusion, prepare with pharmacy)","Epinephrine infusion 2–10 mcg/min if hemodynamically deteriorating","Do NOT use atropine for: Mobitz II, 3° AVB, or wide-complex rhythm"] },
      { phase:"Pacing", label:"Transcutaneous Pacing (TCP)", actions:["Apply pads: anterior-posterior (preferred) or anterior-lateral","Set rate 60–80 bpm (or 10–20 above intrinsic rate)","Start mA at 0 and increase until electrical capture (wide QRS + T wave after each spike)","Confirm mechanical capture: pulse with each pacer spike (palpate femoral)","Sedate + analgesia: midazolam 1–2 mg IV + fentanyl 25–50 mcg IV","Arrange transvenous pacing for definitive management"] },
      { phase:"Search Cause", label:"Identify & Treat Underlying", actions:["12-lead ECG: AV block type? STEMI?","High-degree AV block (Mobitz II / 3°) → pace, cardiology consult","Inferior STEMI + bradycardia → cath lab activation","Medications: beta-blockers, calcium channel blockers, digoxin overdose","Hyperkalemia: peaked T, wide QRS — calcium chloride 1g IV + K+ treatment","Hypothyroidism, Lyme disease, vagal tone"] },
    ],
    pearls:["Atropine does NOT work for infra-nodal block (Mobitz II, CHB, wide complex) — go straight to pacing","Confirm mechanical capture: do NOT rely on electrical capture alone — check the pulse!","Pacing threshold: increases with time — check capture frequently and increase mA if needed","High-degree block post-inferior MI: usually transient, responds to atropine; anterior MI block = pacing","Maximum atropine dose 3 mg (0.04 mg/kg) — higher doses cause paradoxical bradycardia"],
  },
  {
    id:"tachy", title:"Tachycardia", color:T.coral, urgency:"HR > 150",
    urgencyColor:T.coral, icon:"⬆️",
    steps:[
      { phase:"Assess", label:"Stable vs Unstable", actions:["Unstable = hypotension, AMS, chest pain, acute HF, signs of shock","Unstable → SYNCHRONIZED CARDIOVERSION immediately","Stable → 12-lead ECG first — narrow vs wide complex?","Prepare for cardioversion in any patient — apply pads, IO/IV access"] },
      { phase:"Narrow Complex", label:"SVT / AFib Management", actions:["SVT: vagal maneuvers first (modified Valsalva — Trendelenburg + 40 mmHg pressure × 15 sec)","Adenosine 6 mg rapid IV push + 20 mL NS flush — if no response: 12 mg × 2","AFib/AFlutter <48h: rate control (metoprolol, diltiazem) OR rhythm control (consult cardiology)","AFib >48h or unknown onset: DO NOT cardiovert without anticoagulation/TEE first","WPW + AFib: AVOID adenosine, diltiazem, beta-blockers — use procainamide or cardioversion"] },
      { phase:"Wide Complex", label:"VT vs SVT-aberrancy", actions:["Treat as VT until proven otherwise","Stable VT: amiodarone 150 mg IV over 10 min, then 1 mg/min infusion","Procainamide 20–50 mg/min IV (avoid if prolonged QT or severe HF)","Do NOT use verapamil/diltiazem for wide-complex tachycardia — may cause VF","Unstable VT → synchronized cardioversion 100–200 J biphasic"] },
      { phase:"Cardioversion", label:"Synchronized Cardioversion", actions:["SYNCHRONIZE mode ON — verify sync markers on R-wave before discharge","Sedate/analgesia if time permits: midazolam 1–2 mg IV + fentanyl","Narrow regular (SVT): start 50–100 J","AFib: start 120–200 J biphasic","VT (stable): 100–200 J biphasic","Escalate energy if no conversion"] },
    ],
    pearls:["Regular narrow complex with sudden onset/offset → almost always SVT → adenosine","Irregular narrow complex → likely AFib — check rate, anticoagulation status","Wide complex tachycardia → treat as VT — do NOT give CCBs (could cause VF in VT)","Polymorphic VT (TdP): magnesium sulfate 2g IV, correct electrolytes, remove offending drug","Preexcited AFib (WPW): irregular wide complex — cardioversion or procainamide — avoid nodal blockers"],
  },
];

const RESUS_MEDS = [
  { drug:"Epinephrine", dose:"1 mg IV/IO q3–5 min", route:"IV push", indication:"Cardiac arrest (VF, PEA, asystole)", color:T.red, dilution:"1 mg in 10 mL (1:10,000) — give undiluted", notes:"Do not delay first dose. Infusion for post-ROSC: 0.1–0.5 mcg/kg/min." },
  { drug:"Amiodarone", dose:"300 mg IV/IO push (arrest) · 150 mg over 10 min (stable VT)", route:"IV push / infusion", indication:"Refractory VF/pVT; stable VT", color:T.orange, dilution:"300 mg in 20–30 mL D5W for push; D5W drip for maintenance (900 mg/24h)", notes:"Second dose: 150 mg. Causes hypotension — push slower in stable VT." },
  { drug:"Lidocaine", dose:"1–1.5 mg/kg IV/IO (arrest) · 0.5–0.75 mg/kg q5–10 min", route:"IV push", indication:"Alternative to amiodarone in VF/pVT", color:T.yellow, dilution:"Use undiluted 2% (20 mg/mL) — max cumulative 3 mg/kg", notes:"Maintenance: 1–4 mg/min infusion post-ROSC. Toxic: circumoral numbness, seizures." },
  { drug:"Atropine", dose:"0.5 mg IV q3–5 min — max 3 mg", route:"IV push", indication:"Symptomatic bradycardia", color:T.blue, dilution:"0.5 mg in 1 mL — push undiluted", notes:"0.5 mg minimum (less causes paradoxical bradycardia). Ineffective for Mobitz II / 3° AVB." },
  { drug:"Adenosine", dose:"6 mg rapid IV push; repeat 12 mg × 2", route:"Rapid IV + flush", indication:"SVT termination", color:T.cyan, dilution:"Undiluted — must follow with rapid 20 mL NS flush via antecubital or central line", notes:"Half-life 6 seconds — must flush rapidly. Warn patient of brief chest pressure/flush." },
  { drug:"Magnesium Sulfate", dose:"2g IV over 5–15 min", route:"IV infusion", indication:"Torsades de Pointes; refractory VF with hypoMg", color:T.purple, dilution:"2g in 50–100 mL NS or D5W", notes:"Polymorphic VT (TdP) → immediate Mg push. Also in hypomagnesemia-triggered arrest." },
  { drug:"Sodium Bicarbonate", dose:"1 mEq/kg IV push", route:"IV push", indication:"Hyperkalemia; prolonged arrest; TCA overdose; known severe acidosis", color:T.teal, dilution:"8.4% solution (1 mEq/mL) — give undiluted or in 50–100 mL", notes:"Flush line before/after — incompatible with calcium. Avoid in respiratory acidosis alone." },
  { drug:"Calcium Chloride 10%", dose:"1g (10 mL) IV", route:"IV slow push", indication:"Hyperkalemia; hypocalcemia; calcium channel blocker OD", color:T.green, dilution:"Undiluted — central line preferred (vesicant); peripheral acceptable in emergency", notes:"Calcium gluconate preferred if peripheral (less caustic). Stabilizes myocardium in hyperK." },
  { drug:"Dopamine", dose:"2–20 mcg/kg/min IV infusion", route:"IV infusion", indication:"Refractory bradycardia; post-ROSC hypotension", color:T.yellow, dilution:"400 mg in 250 mL NS (1600 mcg/mL) — standard concentration", notes:"Low dose (2–5): renal/dopaminergic. Mid (5–10): beta. High (10–20): alpha vasopressor." },
  { drug:"Vasopressin", dose:"40 units IV — one-time dose", route:"IV push", indication:"Adjunct in cardiac arrest (replaces first or second epi dose)", color:T.coral, dilution:"40 units undiluted", notes:"No mortality benefit over epinephrine alone — rarely used now in 2020+ guidelines." },
];

const DEFIB_DATA = [
  { label:"Adult VF/pVT", energy:"200 J biphasic (360 J monophasic)", color:T.red, notes:"Escalate energy with each subsequent shock if no conversion. Check manufacturer recommendations." },
  { label:"Adult Stable VT (cardioversion)", energy:"100–200 J biphasic (synced)", color:T.orange, notes:"MUST synchronize. Start 100 J; escalate if no conversion. Sedate first." },
  { label:"Adult AFib (cardioversion)", energy:"120–200 J biphasic (synced)", color:T.yellow, notes:"Higher initial energy improves first-shock success. Synchronized mode mandatory." },
  { label:"Adult SVT / AFlutter (cardioversion)", energy:"50–100 J biphasic (synced)", color:T.cyan, notes:"Lower energy often successful for regular narrow rhythms. Synchronize." },
  { label:"Pediatric VF/pVT", energy:"2 J/kg first shock → 4 J/kg subsequent", color:T.coral, notes:"Use pediatric pads or adult pads ≥25 kg. Weight from Broselow tape." },
  { label:"Pediatric Cardioversion", energy:"0.5–1 J/kg (max 2 J/kg per shock)", color:T.purple, notes:"Synchronized mode. Sedate if time allows — ketamine 1–2 mg/kg IM/IV." },
];

const PAD_POSITIONS = [
  { name:"Anterior-Lateral", use:"Standard defibrillation", color:T.teal, right:"Right infraclavicular (below clavicle, right sternal border)", left:"Left lateral chest wall (V5–V6 position, mid-axillary)" },
  { name:"Anterior-Posterior", use:"Preferred for cardioversion, AF, pacing", color:T.blue, right:"Anterior: left of sternum, V3–V4 position", left:"Posterior: left infrascapular region / between shoulder blades" },
];

const H5T5 = [
  { h:"Hypovolemia", icon:"💉", color:T.blue, assess:"Low CVP, flat neck veins, narrow pulse pressure, POCUS: collapsed IVC", treat:"1–2L NS or LR rapid bolus; blood (1:1:1) if hemorrhagic; TXA 1g IV within 3h of trauma" },
  { h:"Hypoxia", icon:"🫁", color:T.teal, assess:"SpO₂ low, cyanosis, poor air entry on auscultation, foggy ETT", treat:"Optimize airway — suction, reposition, BVM → intubation; confirm ETT with waveform capnography; adjust vent" },
  { h:"Hydrogen ion (Acidosis)", icon:"🔬", color:T.orange, assess:"ABG pH <7.1, large anion gap, prolonged arrest, bicarb <10", treat:"NaHCO₃ 1 mEq/kg IV; treat underlying cause (sepsis, DKA, ischemia); optimize ventilation (↑ RR)" },
  { h:"Hypo/Hyperkalemia", icon:"⚗️", color:T.yellow, assess:"ECG: peaked T (hyperK), flattened T/U wave (hypoK); serum K+; ESRD history", treat:"HyperK: CaCl 1g IV + insulin/dex + bicarb + kayexalate/Patiromer. HypoK: K+ 20 mEq/h IV replace" },
  { h:"Hypothermia", icon:"🥶", color:T.cyan, assess:"Core temp <35°C; cold/mottled skin; osborne J-waves on ECG; ventricular dysrhythmias", treat:"Active rewarming: warm IV fluids, warm humidified O₂, bear-hugger, ECMO for refractory arrest. 'Not dead until warm and dead'" },
  { t:"Tension Pneumothorax", icon:"🫧", color:T.red, assess:"Absent breath sounds unilateral + hypotension + distended neck veins; tracheal deviation (late)", treat:"Immediate needle decompression (2nd ICS MCL, 14G) → bilateral finger thoracostomy → chest tube" },
  { t:"Tamponade", icon:"❤️", color:T.coral, assess:"Beck's triad (hypotension + JVD + muffled heart sounds); POCUS: pericardial effusion + RV diastolic collapse", treat:"Emergency pericardiocentesis (subxiphoid approach); thoracotomy if traumatic; massive volume resuscitation (temporary)" },
  { t:"Toxins", icon:"☠️", color:T.purple, assess:"Toxidrome pattern; medication history; pupil size; smell; response to empiric antidotes", treat:"Naloxone (opioids) 0.4–2 mg IV; sodium bicarb (TCA/Na-channel blockers); lipid emulsion (fat-soluble drugs); atropine (organophosphates)" },
  { t:"Thrombosis (PE)", icon:"🩸", color:T.orange, assess:"Risk factors + POCUS (RV dilation, McConnell sign); pulseless despite CPR × 10+ min; no other cause", treat:"Empiric tPA 50 mg IV bolus (cardiac arrest) or 100 mg over 2h (massive PE with ROSC); CPR × 60–90 min post-tPA" },
  { t:"Thrombosis (ACS/MI)", icon:"🫀", color:T.yellow, assess:"Prior chest pain, STEMI on pre-arrest ECG, ACS history, elevated troponin post-ROSC", treat:"Immediate cath lab activation; ASA 325 mg PO; heparin; PPCI is treatment of choice; thrombolytics if cath not available" },
];

const POST_ROSC = [
  { cat:"Airway & Ventilation", color:T.teal, items:[
    "Intubate if not already — comatose patients require definitive airway",
    "Target SpO₂ 94–98% — AVOID hyperoxia (FiO₂ titrate down)",
    "Target PaCO₂ 35–45 mmHg — AVOID hyperventilation (reduces cerebral perfusion)",
    "Waveform capnography: ETCO₂ target 35–40 mmHg",
    "Head of bed 30° elevation",
  ]},
  { cat:"Hemodynamics", color:T.red, items:[
    "MAP target ≥65 mmHg (prefer ≥80 mmHg post-cardiac arrest)",
    "Vasopressors: norepinephrine first-line — start 0.1–0.3 mcg/kg/min",
    "If cardiogenic: add dobutamine or consider mechanical circulatory support",
    "Avoid hypotension — MAP <65 mmHg associated with worse neurological outcome",
    "12-lead ECG immediately — STEMI → cath lab activation without delay",
  ]},
  { cat:"Targeted Temperature Management (TTM)", color:T.blue, items:[
    "Indicated: comatose adults post-ROSC (any initial rhythm)",
    "Target temperature: 32–36°C — select and maintain for 24 hours",
    "Cooling: Arctic Sun, ice packs (external), cold IV saline 30 mL/kg (avoid if pulmonary edema)",
    "Continuous core temperature monitoring (esophageal or bladder)",
    "Avoid fever (>37.7°C) for at least 72h post-arrest",
  ]},
  { cat:"Neurological & Monitoring", color:T.purple, items:[
    "Continuous EEG: rule out non-convulsive status epilepticus (NCSE)",
    "Treat seizures aggressively: lorazepam + levetiracetam or phenytoin",
    "Avoid routine prophylactic anticonvulsants",
    "Glucose: target 140–180 mg/dL — avoid hypoglycemia and hyperglycemia",
    "Neuroprognostication: defer to ≥72h post-ROSC and after rewarming",
  ]},
  { cat:"Cath Lab Activation", color:T.orange, items:[
    "STEMI on post-ROSC ECG → activate cath lab immediately",
    "NSTEMI / no STEMI: consider early coronary angiography (within 24h)",
    "Comatose patients: angiography should NOT be delayed for neurological prognosis",
    "Aspirin 325 mg via NGT; heparin 60 units/kg bolus; P2Y12 inhibitor per interventionalist",
    "ECMO-CPR (eCPR) centers: consider for refractory arrest in select patients",
  ]},
  { cat:"Investigations & Orders", color:T.yellow, items:[
    "Urgent: 12-lead ECG, portable CXR, ABG, BMP, CBC, coags, troponin, lactate",
    "Point-of-care glucose immediately",
    "POCUS: confirm ETT, cardiac function, IVC volume status, pneumothorax",
    "Foley catheter for UOP monitoring (target 0.5 mL/kg/h)",
    "Sedation: propofol or midazolam + fentanyl infusion for intubated/cooling patients",
  ]},
];

// ── COMPONENTS ────────────────────────────────────────────────────────────────

function AmbientBg() {
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }}>
      <div style={{ position:"absolute", top:"-15%", left:"-10%", width:"55%", height:"55%", background:"radial-gradient(circle,rgba(255,68,68,0.07) 0%,transparent 70%)" }}/>
      <div style={{ position:"absolute", bottom:"-10%", right:"-5%", width:"50%", height:"50%", background:"radial-gradient(circle,rgba(255,107,107,0.05) 0%,transparent 70%)" }}/>
      <div style={{ position:"absolute", top:"40%", left:"30%", width:"35%", height:"35%", background:"radial-gradient(circle,rgba(59,158,255,0.05) 0%,transparent 70%)" }}/>
    </div>
  );
}

function BulletRow({ text, color }) {
  return (
    <div style={{ display:"flex", gap:8, alignItems:"flex-start", marginBottom:5 }}>
      <span style={{ color:color||T.teal, fontSize:8, marginTop:3, flexShrink:0 }}>▸</span>
      <span style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt2, lineHeight:1.5 }}>{text}</span>
    </div>
  );
}

function StepCard({ step, color }) {
  return (
    <div style={{ ...glass, padding:"12px 14px", borderLeft:`3px solid ${color}` }}>
      <div style={{ display:"flex", gap:8, alignItems:"baseline", marginBottom:8 }}>
        <span style={{ fontFamily:"JetBrains Mono", fontSize:9, color:color, fontWeight:700, letterSpacing:1.5, whiteSpace:"nowrap" }}>{step.phase}</span>
        <span style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:13, color:T.txt }}>{step.label}</span>
      </div>
      {step.actions.map((a,i) => <BulletRow key={i} text={a} color={color}/>)}
    </div>
  );
}

function AlgorithmCard({ algo }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ ...glass, overflow:"hidden", borderTop:`3px solid ${algo.color}`, marginBottom:12 }}>
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ padding:"14px 18px", cursor:"pointer", display:"flex", alignItems:"center", gap:12, background:`linear-gradient(135deg,${algo.color}08,rgba(8,22,40,0.9))` }}
      >
        <span style={{ fontSize:20 }}>{algo.icon}</span>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"Playfair Display", fontWeight:700, fontSize:16, color:algo.color }}>{algo.title}</div>
          <div style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4, marginTop:2 }}>{algo.steps.length} phases</div>
        </div>
        <span style={{ fontFamily:"JetBrains Mono", fontSize:9, fontWeight:700, padding:"3px 9px", borderRadius:20, background:`${algo.urgencyColor}18`, border:`1px solid ${algo.urgencyColor}44`, color:algo.urgencyColor }}>
          {algo.urgency}
        </span>
        <span style={{ color:T.txt4, fontSize:14, marginLeft:4 }}>{expanded ? "▲" : "▼"}</span>
      </div>
      {expanded && (
        <div className="resus-fade" style={{ padding:"0 18px 16px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:10, marginTop:12, marginBottom:12 }}>
            {algo.steps.map((s,i) => <StepCard key={i} step={s} color={algo.color}/>)}
          </div>
          <div style={{ padding:"12px 14px", background:`${T.yellow}0a`, border:`1px solid ${T.yellow}22`, borderRadius:10 }}>
            <div style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.yellow, fontWeight:700, letterSpacing:1.5, marginBottom:8 }}>💎 CLINICAL PEARLS</div>
            {algo.pearls.map((p,i) => <BulletRow key={i} text={p} color={T.yellow}/>)}
          </div>
        </div>
      )}
    </div>
  );
}

// ── TABS CONTENT ──────────────────────────────────────────────────────────────

function ACLSTab() {
  return (
    <div>
      <div style={{ padding:"10px 14px", background:"rgba(255,68,68,0.06)", border:"1px solid rgba(255,68,68,0.2)", borderRadius:10, marginBottom:16, fontFamily:"DM Sans", fontSize:12, color:T.txt2, lineHeight:1.7 }}>
        💓 <strong style={{ color:T.red }}>ACLS 2020 AHA Guidelines</strong> — Click any card to expand the full algorithm. All algorithms follow current evidence. Times are approximate — actual pacing depends on team size, IV access, and patient factors.
      </div>
      {ACLS_ALGORITHMS.map(a => <AlgorithmCard key={a.id} algo={a}/>)}
    </div>
  );
}

function MedsTab() {
  return (
    <div>
      <div style={{ padding:"10px 14px", background:"rgba(255,107,107,0.06)", border:"1px solid rgba(255,107,107,0.2)", borderRadius:10, marginBottom:16, fontFamily:"DM Sans", fontSize:12, color:T.txt2, lineHeight:1.7 }}>
        💊 <strong style={{ color:T.coral }}>Resuscitation Medications</strong> — Doses listed for average adult (70 kg). Confirm weight-based dosing for pediatric patients. Always verify with current ACLS guidelines and institutional protocols.
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))", gap:10 }}>
        {RESUS_MEDS.map((m,i) => (
          <div key={i} style={{ ...glass, padding:"14px 16px", borderTop:`3px solid ${m.color}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
              <div style={{ fontFamily:"Playfair Display", fontWeight:700, fontSize:15, color:m.color }}>{m.drug}</div>
              <span style={{ fontFamily:"JetBrains Mono", fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:20, background:`${m.color}14`, border:`1px solid ${m.color}33`, color:m.color, whiteSpace:"nowrap" }}>
                {m.route}
              </span>
            </div>
            <div style={{ fontFamily:"JetBrains Mono", fontSize:11, color:T.txt, fontWeight:700, marginBottom:4 }}>{m.dose}</div>
            <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt3, marginBottom:8 }}>
              <span style={{ color:T.txt4, fontWeight:700 }}>Indication: </span>{m.indication}
            </div>
            <div style={{ padding:"6px 10px", background:`${m.color}08`, border:`1px solid ${m.color}18`, borderRadius:8, marginBottom:6 }}>
              <div style={{ fontFamily:"JetBrains Mono", fontSize:8, color:m.color, fontWeight:700, marginBottom:2 }}>DILUTION/PREP</div>
              <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt2 }}>{m.dilution}</div>
            </div>
            <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt3, lineHeight:1.5 }}>{m.notes}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DefibTab() {
  return (
    <div>
      <div style={{ padding:"10px 14px", background:"rgba(245,200,66,0.06)", border:"1px solid rgba(245,200,66,0.2)", borderRadius:10, marginBottom:16, fontFamily:"DM Sans", fontSize:12, color:T.txt2, lineHeight:1.7 }}>
        ⚡ <strong style={{ color:T.yellow }}>Defibrillation & Cardioversion</strong> — Defibrillation is unsynchronized (for VF/pVT). Cardioversion MUST be synchronized to avoid delivering shock on T-wave (→ VF). Confirm sync mode before discharge.
      </div>

      {/* Energy table */}
      <div style={{ ...glass, padding:"16px 18px", marginBottom:14 }}>
        <div style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4, textTransform:"uppercase", letterSpacing:2, marginBottom:12 }}>Energy Reference</div>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {DEFIB_DATA.map((d,i) => (
            <div key={i} style={{ padding:"11px 14px", background:`${d.color}08`, border:`1px solid ${d.color}22`, borderRadius:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10, flexWrap:"wrap", marginBottom:4 }}>
                <div style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:13, color:d.color }}>{d.label}</div>
                <div style={{ fontFamily:"JetBrains Mono", fontSize:12, fontWeight:700, color:T.txt }}>{d.energy}</div>
              </div>
              <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt3, lineHeight:1.5 }}>{d.notes}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pad placement */}
      <div style={{ ...glass, padding:"16px 18px", marginBottom:14 }}>
        <div style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4, textTransform:"uppercase", letterSpacing:2, marginBottom:12 }}>Pad Placement Positions</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {PAD_POSITIONS.map((p,i) => (
            <div key={i} style={{ padding:"12px 14px", background:`${p.color}08`, border:`1px solid ${p.color}22`, borderRadius:10 }}>
              <div style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:13, color:p.color, marginBottom:3 }}>{p.name}</div>
              <div style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4, marginBottom:8 }}>Preferred for: {p.use}</div>
              <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt2, marginBottom:4 }}><strong style={{ color:p.color }}>Right/Anterior:</strong> {p.right}</div>
              <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt2 }}><strong style={{ color:p.color }}>Left/Posterior:</strong> {p.left}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Key reminders */}
      <div style={{ ...glass, padding:"16px 18px", borderLeft:`4px solid ${T.red}` }}>
        <div style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.red, textTransform:"uppercase", letterSpacing:2, marginBottom:10 }}>⚠️ CRITICAL REMINDERS</div>
        {["SYNCHRONIZE for cardioversion — failure to sync can trigger VF","Resume CPR immediately after shock — do NOT pause to check rhythm","Ensure no one is touching the patient at time of discharge","Double sequential defibrillation (DSD): 2 simultaneous shocks — for refractory VF, limited evidence but used in practice","Pacemaker/ICD patients: place pads ≥8 cm from device — consider AP position","Aqueous gel pads only — no alcohol-based gel (fire risk)","After failed shock × 3: change pad position (AP), ensure good contact"].map((r,i)=>(
          <BulletRow key={i} text={r} color={T.red}/>
        ))}
      </div>
    </div>
  );
}

function AirwayTab() {
  const steps = [
    { label:"Prepare", color:T.teal, items:["Pre-oxygenate 100% NRB × 3–5 min or BVM × 8 breaths (30 sec)","Position: sniffing position or ear-to-sternal-notch in obese","RSI checklist: STOPBANG/LEMON score assessed","Suction at bedside, backup airway available (LMA, CRIC kit)","Monitoring: SpO₂, ETCO₂, BP, cardiac monitor, IV/IO access"] },
    { label:"RSI Induction", color:T.blue, items:["Pre-treatment (optional): lidocaine 1.5 mg/kg IV for ICP concerns","Induction agent — choose one:","• Ketamine 1.5–2 mg/kg IV (preferred in hemodynamic instability, asthma, trauma)","• Etomidate 0.3 mg/kg IV (hemodynamically neutral, avoid in sepsis/adrenal insufficiency)","• Propofol 1–2 mg/kg IV (avoid if hypotensive)","Succinylcholine 1.5 mg/kg IV (paralytic — administer 60 sec after induction)","Alt paralytic: rocuronium 1.2–1.6 mg/kg IV (RSI dose; reversal: sugammadex 16 mg/kg)"] },
    { label:"Intubate", color:T.orange, items:["Laryngoscopy 60 seconds after succinylcholine","DL: Mac 3/4 or Miller 2 blade. VL: preferred (Glidescope, C-MAC)","Cuff: inflate to minimum occlusive volume (pilot balloon palpation or cuff manometer 20–30 cmH₂O)","Confirm: direct visualization through cords, bilateral BS, ETCO₂ waveform (gold standard)","CXR for tube depth (tip 3–5 cm above carina)","Bite block + tube holder immediately"] },
    { label:"Post-Intubation", color:T.purple, items:["Vent settings: VT 6–8 mL/kg IBW, RR 12–16, PEEP 5 cmH₂O, FiO₂ 1.0 → titrate down","Sedation + analgesia: propofol 5–50 mcg/kg/min + fentanyl 25–100 mcg/h","NG tube for gastric decompression","Head of bed 30° — VAP prevention bundle","ABG in 30–60 min to confirm oxygenation/ventilation; CXR"] },
    { label:"CICO/Failed Airway", color:T.red, items:["Cannot Intubate Cannot Oxygenate (CICO) = surgical airway immediately","Scalpel-finger-bougie (SBF) technique — fastest, most reliable","Step 1: vertical stab incision at cricothyroid membrane (palpate or ultrasound)","Step 2: finger into trachea to confirm position and dilate","Step 3: bougie through incision, railroad 6.0 ETT or tracheostomy tube","Needle cric (14G IV): temporizing only — high failure rate, not definitive","CRIC kit at bedside for every RSI — know where it is before you start"] },
  ];

  return (
    <div>
      <div style={{ padding:"10px 14px", background:"rgba(59,158,255,0.06)", border:"1px solid rgba(59,158,255,0.2)", borderRadius:10, marginBottom:16, fontFamily:"DM Sans", fontSize:12, color:T.txt2, lineHeight:1.7 }}>
        🌬️ <strong style={{ color:T.blue }}>Emergency Airway Management</strong> — RSI success depends on preparation. Know your backup plan before you pick up the laryngoscope. CICO is a surgical emergency — drill it monthly.
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:12 }}>
        {steps.map((s,i) => (
          <div key={i} style={{ ...glass, padding:"14px 16px", borderTop:`3px solid ${s.color}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
              <div style={{ width:24, height:24, borderRadius:"50%", background:`${s.color}18`, border:`1px solid ${s.color}44`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"JetBrains Mono", fontSize:10, fontWeight:700, color:s.color }}>{i+1}</div>
              <div style={{ fontFamily:"Playfair Display", fontWeight:700, fontSize:14, color:s.color }}>{s.label}</div>
            </div>
            {s.items.map((item,j) => <BulletRow key={j} text={item} color={s.color}/>)}
          </div>
        ))}
      </div>
    </div>
  );
}

function PEATab() {
  const hs = H5T5.filter(e => e.h);
  const ts = H5T5.filter(e => e.t);
  return (
    <div>
      <div style={{ padding:"10px 14px", background:"rgba(255,159,67,0.06)", border:"1px solid rgba(255,159,67,0.2)", borderRadius:10, marginBottom:16, fontFamily:"DM Sans", fontSize:12, color:T.txt2, lineHeight:1.7 }}>
        ❓ <strong style={{ color:T.orange }}>Reversible Causes of Cardiac Arrest (5H5T)</strong> — Search for and treat ALL reversible causes simultaneously during CPR. POCUS is invaluable for rapidly identifying tamponade, tension PTX, and hypovolemia.
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
        <div>
          <div style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.blue, textTransform:"uppercase", letterSpacing:2, marginBottom:10, fontWeight:700 }}>5 H's</div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {hs.map((e,i) => (
              <div key={i} style={{ ...glass, padding:"12px 14px", borderLeft:`3px solid ${e.color}` }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                  <span style={{ fontSize:16 }}>{e.icon}</span>
                  <div style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:13, color:e.color }}>{e.h}</div>
                </div>
                <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt3, marginBottom:5 }}><span style={{ color:T.txt4, fontWeight:700 }}>Assess: </span>{e.assess}</div>
                <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt2, lineHeight:1.5 }}><span style={{ color:e.color, fontWeight:700 }}>Treat: </span>{e.treat}</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.red, textTransform:"uppercase", letterSpacing:2, marginBottom:10, fontWeight:700 }}>5 T's</div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {ts.map((e,i) => (
              <div key={i} style={{ ...glass, padding:"12px 14px", borderLeft:`3px solid ${e.color}` }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                  <span style={{ fontSize:16 }}>{e.icon}</span>
                  <div style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:13, color:e.color }}>{e.t}</div>
                </div>
                <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt3, marginBottom:5 }}><span style={{ color:T.txt4, fontWeight:700 }}>Assess: </span>{e.assess}</div>
                <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt2, lineHeight:1.5 }}><span style={{ color:e.color, fontWeight:700 }}>Treat: </span>{e.treat}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PostROSCTab() {
  return (
    <div>
      <div style={{ padding:"10px 14px", background:"rgba(61,255,160,0.06)", border:"1px solid rgba(61,255,160,0.2)", borderRadius:10, marginBottom:16, fontFamily:"DM Sans", fontSize:12, color:T.txt2, lineHeight:1.7 }}>
        💚 <strong style={{ color:T.green }}>Post-ROSC (Return of Spontaneous Circulation) Care</strong> — The first hour post-ROSC is critical. Systematic management of airway, hemodynamics, temperature, and coronary perfusion dramatically improves neurological outcomes.
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:12 }}>
        {POST_ROSC.map((section,i) => (
          <div key={i} style={{ ...glass, padding:"14px 16px", borderTop:`3px solid ${section.color}` }}>
            <div style={{ fontFamily:"Playfair Display", fontWeight:700, fontSize:14, color:section.color, marginBottom:10 }}>{section.cat}</div>
            {section.items.map((item,j) => <BulletRow key={j} text={item} color={section.color}/>)}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────

export default function ResusHub() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("acls");

  return (
    <div style={{ fontFamily:"DM Sans, sans-serif", background:T.bg, minHeight:"100vh", position:"relative", overflow:"hidden", color:T.txt }}>
      <AmbientBg/>
      <div style={{ position:"relative", zIndex:1, maxWidth:1440, margin:"0 auto", padding:"0 16px" }}>

        {/* Header */}
        <div style={{ padding:"18px 0 14px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
            <div style={{ backdropFilter:"blur(40px)", WebkitBackdropFilter:"blur(40px)", background:"rgba(5,15,30,0.9)", border:"1px solid rgba(42,79,122,0.6)", borderRadius:10, padding:"5px 12px", display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontFamily:"JetBrains Mono", fontSize:10, color:T.red, letterSpacing:3 }}>NOTRYA</span>
              <span style={{ color:T.txt4, fontFamily:"JetBrains Mono", fontSize:10 }}>/</span>
              <span style={{ fontFamily:"JetBrains Mono", fontSize:10, color:T.txt3, letterSpacing:2 }}>RESUS HUB</span>
            </div>
            <div style={{ height:1, flex:1, background:"linear-gradient(90deg,rgba(255,68,68,0.5),transparent)" }}/>
            <button onClick={()=>navigate("/hub")} style={{ padding:"5px 14px", borderRadius:8, background:"rgba(14,37,68,0.6)", border:"1px solid rgba(42,79,122,0.4)", color:T.txt2, fontFamily:"DM Sans", fontSize:12, fontWeight:600, cursor:"pointer", flexShrink:0 }}>← Hub</button>
          </div>
          <h1 className="resus-shimmer" style={{ fontFamily:"Playfair Display", fontSize:"clamp(26px,4vw,42px)", fontWeight:900, letterSpacing:-1, lineHeight:1.1 }}>Resuscitation Hub</h1>
          <p style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt3, marginTop:4 }}>ACLS Algorithms · Resus Medications · Defibrillation · Emergency Airway · 5H5T · Post-ROSC Care</p>
        </div>

        {/* Stat Banner */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:10, marginBottom:16 }}>
          {[
            { label:"Cardiac Arrest", value:"4 Algorithms", sub:"VF·PEA·Brady·Tachy", color:T.red },
            { label:"Resus Meds",     value:"10 Drugs",     sub:"Dose·Dilution·Route",  color:T.orange },
            { label:"Defib Energies", value:"6 Protocols",  sub:"Adult · Pediatric",   color:T.yellow },
            { label:"5H5T Causes",    value:"10 Reversible",sub:"Search & treat ALL",   color:T.teal },
            { label:"RSI Steps",      value:"5 Phases",     sub:"Prep→Intubate→CICO",  color:T.blue },
            { label:"Post-ROSC",      value:"6 Domains",    sub:"TTM·MAP·ECG·Neuro",   color:T.green },
          ].map((b,i) => (
            <div key={i} style={{ ...glass, padding:"9px 13px", borderLeft:`3px solid ${b.color}`, background:`linear-gradient(135deg,${b.color}12,rgba(8,22,40,0.8))`, borderRadius:10 }}>
              <div style={{ fontFamily:"JetBrains Mono", fontSize:14, fontWeight:700, color:b.color, lineHeight:1 }}>{b.value}</div>
              <div style={{ fontFamily:"DM Sans", fontWeight:600, color:T.txt, fontSize:10, margin:"3px 0" }}>{b.label}</div>
              <div style={{ fontFamily:"DM Sans", fontSize:9, color:T.txt4, lineHeight:1.3 }}>{b.sub}</div>
            </div>
          ))}
        </div>

        {/* Tab Bar */}
        <div style={{ ...glass, padding:"6px", display:"flex", gap:4, marginBottom:16, flexWrap:"wrap" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ flex:"1 1 auto", fontFamily:"DM Sans", fontWeight:600, fontSize:11, padding:"9px 6px", borderRadius:10,
                border:`1px solid ${tab===t.id ? "rgba(255,107,107,0.5)" : "transparent"}`,
                background:tab===t.id ? "linear-gradient(135deg,rgba(255,107,107,0.18),rgba(255,107,107,0.07))" : "transparent",
                color:tab===t.id ? T.coral : T.txt3, cursor:"pointer", textAlign:"center", transition:"all .15s", whiteSpace:"nowrap" }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="resus-fade" key={tab}>
          {tab === "acls"   && <ACLSTab/>}
          {tab === "meds"   && <MedsTab/>}
          {tab === "defib"  && <DefibTab/>}
          {tab === "airway" && <AirwayTab/>}
          {tab === "pea"    && <PEATab/>}
          {tab === "post"   && <PostROSCTab/>}
        </div>

        {/* Footer */}
        <div style={{ textAlign:"center", paddingBottom:24, paddingTop:14 }}>
          <span style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4, letterSpacing:1.5 }}>
            NOTRYA RESUS HUB · AHA ACLS 2020 GUIDELINES · ALWAYS VERIFY WITH CURRENT PROTOCOLS · FOR EDUCATIONAL USE
          </span>
        </div>
      </div>
    </div>
  );
}