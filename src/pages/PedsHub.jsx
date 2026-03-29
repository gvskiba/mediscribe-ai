import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

// ── Design Tokens ───────────────────────────────────────────────────
const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36", up:"#0e2544",
  b:"rgba(26,53,85,0.8)", bhi:"rgba(42,79,122,0.9)",
  txt:"#e8f0fe", txt2:"#8aaccc", txt3:"#4a6a8a", txt4:"#2e4a6a",
  coral:"#ff6b6b", gold:"#f5c842", teal:"#00e5c0", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0", cyan:"#00d4ff",
};

// ── Font Injection ──────────────────────────────────────────────────
(() => {
  if (document.getElementById("peds-fonts")) return;
  const l = document.createElement("link"); l.id = "peds-fonts";
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "peds-css";
  s.textContent = `
    *{box-sizing:border-box;margin:0;padding:0;}
    ::-webkit-scrollbar{width:3px;height:3px;}
    ::-webkit-scrollbar-track{background:transparent;}
    ::-webkit-scrollbar-thumb{background:rgba(42,79,122,0.5);border-radius:2px;}
    @keyframes fadeSlide{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
    @keyframes pulseGlow{0%,100%{opacity:.6}50%{opacity:1}}
    @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    .fade-in{animation:fadeSlide .3s ease forwards;}
    .peds-cond:hover{transform:translateX(3px);transition:transform .18s ease;}
    .shimmer-text{
      background:linear-gradient(90deg,#e8f0fe 0%,#ffffff 35%,#3b9eff 55%,#00e5c0 75%,#e8f0fe 100%);
      background-size:250% auto;
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
      animation:shimmer 5s linear infinite;
    }
  `;
  document.head.appendChild(s);
})();

// ── Conditions ──────────────────────────────────────────────────────
const CONDITIONS = [
  { id:"pals",         icon:"❤️‍🔥", title:"PALS Algorithms",      sub:"Cardiac Arrest · Rhythms · Doses",      cat:"Resuscitation", color:T.coral,  gl:"rgba(255,107,107,0.1)",  br:"rgba(255,107,107,0.4)" },
  { id:"nrp",          icon:"👶",   title:"NRP — Neonatal Resus",  sub:"APGAR · Delivery Room · Intubation",    cat:"Resuscitation", color:T.cyan,   gl:"rgba(0,212,255,0.1)",    br:"rgba(0,212,255,0.4)"   },
  { id:"broselow",     icon:"📏",   title:"Broselow Tape",         sub:"Color Zones · ETT · Weight-Based Rx",   cat:"Resuscitation", color:T.gold,   gl:"rgba(245,200,66,0.1)",   br:"rgba(245,200,66,0.4)"  },
  { id:"respiratory",  icon:"🫁",   title:"Respiratory Emergencies",sub:"Croup · Asthma · Bronchiolitis",       cat:"Emergency",     color:T.blue,   gl:"rgba(59,158,255,0.1)",   br:"rgba(59,158,255,0.4)"  },
  { id:"febrile_sz",   icon:"⚡",   title:"Febrile Seizures",      sub:"AAP Guidelines · Status Protocol",      cat:"Emergency",     color:T.orange, gl:"rgba(255,159,67,0.1)",   br:"rgba(255,159,67,0.4)"  },
  { id:"sepsis",       icon:"🦠",   title:"Pediatric Sepsis",      sub:"ACEP · Sepsis-3 · Fluids · ABX",        cat:"Emergency",     color:T.purple, gl:"rgba(155,109,255,0.1)",  br:"rgba(155,109,255,0.4)" },
  { id:"anaphylaxis",  icon:"⚠️",   title:"Anaphylaxis",           sub:"Epi Weight-Based · Biphasic",           cat:"Emergency",     color:T.coral,  gl:"rgba(255,107,107,0.1)",  br:"rgba(255,107,107,0.4)" },
  { id:"dka",          icon:"🩸",   title:"Pediatric DKA",         sub:"ISPAD 2022 · Cerebral Edema Alert",     cat:"Emergency",     color:T.teal,   gl:"rgba(0,229,192,0.1)",    br:"rgba(0,229,192,0.4)"   },
  { id:"rsv",          icon:"🌬️",   title:"RSV / Bronchiolitis",   sub:"AAP 2023 · Nirsevimab · Supportive",    cat:"Viral",         color:T.green,  gl:"rgba(61,255,160,0.1)",   br:"rgba(61,255,160,0.4)"  },
  { id:"croup",        icon:"🐕",   title:"Croup (LTB)",           sub:"AAP · Dexamethasone · Racemic Epi",     cat:"Viral",         color:T.orange, gl:"rgba(255,159,67,0.1)",   br:"rgba(255,159,67,0.4)"  },
  { id:"influenza",    icon:"🤧",   title:"Influenza",             sub:"AAP 2024–25 · Oseltamivir · Timing",    cat:"Viral",         color:T.blue,   gl:"rgba(59,158,255,0.1)",   br:"rgba(59,158,255,0.4)"  },
  { id:"hfmd",         icon:"✋",   title:"Hand-Foot-Mouth Disease",sub:"Enterovirus · AAP · Supportive",        cat:"Viral",         color:T.purple, gl:"rgba(155,109,255,0.1)",  br:"rgba(155,109,255,0.4)" },
];

const CATS = ["All","Resuscitation","Emergency","Viral"];

const BANNER = [
  { label:"Peds Epi Dose",   value:"0.01 mg/kg",   sub:"1:10,000 IV/IO — max 1 mg",     color:T.coral  },
  { label:"IO Insert Fail",  value:"≥ 3 attempts", sub:"or > 90 sec → place IO",         color:T.orange },
  { label:"Defib Dose",      value:"2–4 J/kg",     sub:"pVF/pulseless VT first shock",   color:T.gold   },
  { label:"Fluid Bolus",     value:"10–20 mL/kg",  sub:"NS or LR over 5–20 min; reassess",color:T.teal  },
];

// ── Broselow Color Zone Data ────────────────────────────────────────
const BROSELOW = [
  { color:"#c8c8c8", name:"Grey",   wt:"3–5 kg",   age:"Premature–3 mo",
    ett:"3.0 unc",  depth:"9 cm",  blade:"0 str",  defib:"6–10 J",
    epi:"0.05 mL (0.5 mg/10mL 1:10k)", atropine:"0.1 mg",  adenosine:"0.3 mg",
    albuterol:"2.5 mg neb", dextrose:"2 mL/kg D10W", versed:"0.5 mg IV",  fluid:"50 mL bolus" },
  { color:"#ffb6c1", name:"Pink",   wt:"6–7 kg",   age:"3–5 mo",
    ett:"3.5 unc",  depth:"10 cm", blade:"1 str",  defib:"12–14 J",
    epi:"0.06–0.07 mL (1:10k)", atropine:"0.14 mg", adenosine:"0.7 mg",
    albuterol:"2.5 mg neb", dextrose:"2 mL/kg D10W", versed:"0.7 mg IV",  fluid:"70 mL bolus" },
  { color:"#ff6b6b", name:"Red",    wt:"8–9 kg",   age:"6–9 mo",
    ett:"3.5 unc",  depth:"11 cm", blade:"1 str",  defib:"16–18 J",
    epi:"0.08–0.09 mL (1:10k)", atropine:"0.18 mg", adenosine:"0.9 mg",
    albuterol:"2.5 mg neb", dextrose:"2 mL/kg D10W", versed:"0.9 mg IV",  fluid:"90 mL bolus" },
  { color:"#9b6dff", name:"Purple", wt:"10–11 kg", age:"9–18 mo",
    ett:"3.5–4.0 unc",depth:"12 cm",blade:"1 str", defib:"20–22 J",
    epi:"0.1–0.11 mL (1:10k)", atropine:"0.22 mg", adenosine:"1.1 mg",
    albuterol:"2.5 mg neb", dextrose:"2 mL/kg D25W", versed:"1.1 mg IV",  fluid:"110 mL bolus" },
  { color:"#f5c842", name:"Yellow", wt:"12–14 kg", age:"18 mo–3 yr",
    ett:"4.0 unc",  depth:"13 cm", blade:"2 str",  defib:"24–28 J",
    epi:"0.12–0.14 mL (1:10k)", atropine:"0.28 mg", adenosine:"1.4 mg",
    albuterol:"2.5 mg neb", dextrose:"2 mL/kg D25W", versed:"1.3 mg IV",  fluid:"130 mL bolus" },
  { color:"#f8f8f8", name:"White",  wt:"15–18 kg", age:"3–5 yr",
    ett:"4.5 unc/cuf",depth:"14 cm",blade:"2 str", defib:"30–36 J",
    epi:"0.15–0.18 mL (1:10k)", atropine:"0.36 mg", adenosine:"1.8 mg",
    albuterol:"2.5 mg neb", dextrose:"2 mL/kg D25W", versed:"1.6 mg IV",  fluid:"160 mL bolus" },
  { color:"#3b9eff", name:"Blue",   wt:"19–22 kg", age:"5–6 yr",
    ett:"5.0 cuf",  depth:"15 cm", blade:"2 cur",  defib:"38–44 J",
    epi:"0.19–0.22 mL (1:10k)", atropine:"0.44 mg", adenosine:"2 mg max",
    albuterol:"2.5 mg neb", dextrose:"2 mL/kg D25W", versed:"2 mg IV",    fluid:"200 mL bolus" },
  { color:"#ff9f43", name:"Orange", wt:"23–29 kg", age:"6–8 yr",
    ett:"5.5 cuf",  depth:"16 cm", blade:"2–3 cur",defib:"46–58 J",
    epi:"0.23–0.29 mL (1:10k → consider 1 mg max)", atropine:"0.5 mg",   adenosine:"2 mg max",
    albuterol:"5 mg neb",   dextrose:"2 mL/kg D25W", versed:"2.5 mg IV",  fluid:"230 mL bolus" },
  { color:"#3dffa0", name:"Green",  wt:"30–36 kg", age:"8–10 yr",
    ett:"6.0 cuf",  depth:"17 cm", blade:"3 str",  defib:"60–72 J",
    epi:"0.3–0.36 mL → 1 mg max", atropine:"0.5 mg",   adenosine:"2 mg max",
    albuterol:"5 mg neb",   dextrose:"2 mL/kg D25W", versed:"3 mg IV max", fluid:"300 mL bolus" },
];

// ── Clinical Data ───────────────────────────────────────────────────
const DATA = {
  pals: {
    overview: {
      def: "Pediatric Advanced Life Support (PALS) — AHA 2020 guidelines. Pediatric cardiac arrest most commonly results from respiratory failure or shock progressing to arrest (asphyxial arrest), unlike adults where primary cardiac events predominate. High-quality CPR with early airway management and rhythm-directed therapy is the cornerstone.",
      bullets: [
        "Most peds arrests are ASPHYXIAL — fix airway/breathing first (different from adult primary cardiac arrest)",
        "Compression rate: 100–120/min; depth: ≥ 1/3 AP diameter (4 cm infant, 5 cm child)",
        "Compression-to-ventilation: 30:2 single rescuer; 15:2 with 2 rescuers (peds-specific)",
        "CPR fraction > 80% target — minimize hands-off time; switch compressors q2 min",
        "Shockable: pVF / pulseless VT → 2 J/kg first; 4 J/kg second; max 10 J/kg or adult dose",
        "Non-shockable: PEA/Asystole → epinephrine q3–5 min; search for H's and T's",
        "H's and T's: Hypoxia, Hypovolemia, Hypothermia, Hypo/Hyperkalemia, H-ion (acidosis) / Tension PTX, Tamponade, Toxins, Thrombosis",
      ]
    },
    workup: [
      { icon:"❤️", label:"Rhythm Assessment (AED/Monitor)", detail:"Immediately determine shockable vs non-shockable. pVF/pulseless VT = shock first. Sinus tachycardia with no pulse = PEA." },
      { icon:"🫁", label:"Airway + Ventilation Confirmation", detail:"BVM with 2-person technique, correctly sized mask. Waveform capnography for ET tube confirmation — ETCO₂ > 10 suggests adequate CPR. Target SpO₂ 94–99% post-ROSC." },
      { icon:"💉", label:"Vascular Access — IO First if Delay", detail:"IO if IV not established within 90 sec or 3 attempts. Tibial preferred in < 6 yr; distal femur or humeral head alternatives." },
      { icon:"🔬", label:"BMP + Blood Gas", detail:"Glucose (hypoglycemia common), K+ (hyperkalemia), Ca²⁺ (ionized), pH/lactate. Electrolyte abnormalities are reversible causes." },
      { icon:"🫀", label:"12-Lead ECG Post-ROSC", detail:"QTc, LQTS, WPW, Brugada pattern, congenital defects. Targeted temperature management discussion (32–34°C for 24h if comatose post-ROSC)." },
      { icon:"🧠", label:"POCUS (Cardiac + IVC)", detail:"Rule out tamponade, tension PTX, severe hypovolemia, cardiac wall motion. FAST in trauma. Subcostal cardiac view without interrupting CPR using CPR feedback device." },
    ],
    treatment: [
      { cat:"💊 VF/pVT", drug:"Epinephrine (Shockable)", dose:"0.01 mg/kg IV/IO (1:10,000 = 0.1 mL/kg); max 1 mg; give AFTER 3rd shock; repeat q3–5 min", renal:"No adjustment", ivpo:"IV / IO push", deesc:"Central line preferred post-ROSC infusion 0.1–1 mcg/kg/min. Flush with 3–5 mL NS push.", note:"Epinephrine 1:1,000 via ETT: 0.1 mg/kg (10× IV dose). Not recommended route — prioritize IV/IO.", ref:"AHA PALS 2020" },
      { cat:"💊 VF/pVT", drug:"Amiodarone (Refractory VF/pVT)", dose:"5 mg/kg IV/IO bolus; may repeat x2 (max 15 mg/kg or 300 mg); give after 3rd shock if VF/pVT persists", renal:"No adjustment", ivpo:"IV / IO", deesc:"Lidocaine 1 mg/kg IV/IO is alternative if amiodarone unavailable. Both are acceptable per AHA 2020.", note:"Can cause hypotension — accept this during active arrest. Post-ROSC: infusion 5–15 mcg/kg/min.", ref:"AHA PALS 2020" },
      { cat:"💊 PEA/Asystole", drug:"Epinephrine (Non-Shockable)", dose:"0.01 mg/kg IV/IO q3–5 min; max 1 mg per dose; give as soon as access obtained", renal:"No adjustment", ivpo:"IV / IO", deesc:"No vasopressin equivalent pediatric data — do not substitute. Continue q3–5 min for duration of resuscitation.", note:"Initiate epinephrine as soon as IO/IV established in asystole/PEA — no reason to delay after access.", ref:"AHA PALS 2020" },
      { cat:"💊 Bradycardia", drug:"Atropine (Vagally-Mediated Brady)", dose:"0.02 mg/kg IV/IO; min dose 0.1 mg; max single dose 0.5 mg (child) or 1 mg (adolescent); may repeat once", renal:"No adjustment", ivpo:"IV / IO", deesc:"Only for symptomatic bradycardia with pulse (HR < 60 with poor perfusion). If no response → epinephrine infusion > pacing.", note:"Epinephrine preferred over atropine for symptomatic bradycardia with poor perfusion in current PALS 2020.", ref:"AHA PALS 2020" },
      { cat:"🔄 SVT", drug:"Adenosine", dose:"0.1 mg/kg IV (max 6 mg first dose); if no conversion: 0.2 mg/kg (max 12 mg); give RAPID IV push + 3–5 mL NS flush", renal:"No adjustment", ivpo:"IV only — most proximal access", deesc:"Synchronized cardioversion 0.5–1 J/kg if hemodynamically unstable SVT. Vagal maneuvers (ice to face in infants) before adenosine if stable.", note:"Use largest-bore, most central IV possible. Peripheral antecubital or above-elbow preferred. Three-stopcock technique for reliability.", ref:"AHA PALS 2020" },
      { cat:"🔬 Electrolytes", drug:"Calcium Chloride 10%", dose:"20 mg/kg IV/IO (0.2 mL/kg of 10% solution); slow push over 2–5 min; for hypocalcemia, hyperK, Ca-channel blocker OD", renal:"Use calcium gluconate in peripheral IV", ivpo:"IV / IO central preferred", deesc:"Calcium gluconate 60 mg/kg peripherally (3× the volume for equivalent elemental Ca). Monitor HR during infusion.", note:"Routine calcium in cardiac arrest NOT recommended (no benefit, potential harm). Reserve for documented indication.", ref:"AHA PALS 2020" },
      { cat:"🔬 Glucose", drug:"Dextrose", dose:"< 1 yr: D10W 5 mL/kg; 1–8 yr: D25W 2 mL/kg; > 8 yr: D50W 1 mL/kg; all IV/IO", renal:"Standard", ivpo:"IV / IO", deesc:"Treat immediately — hypoglycemia is rapidly fatal and reversible. Recheck BG 15 min after dextrose.", note:"Dilute D50W appropriately for age. Concentrated glucose causes phlebitis/tissue damage in peripheral IV.", ref:"AHA PALS 2020" },
    ],
    followup: [
      "Post-ROSC: targeted temperature management 32–34°C × 24h if comatose (AHA Class IIa)",
      "Avoid hyperthermia post-ROSC (T > 37.5°C associated with worse neurological outcome)",
      "Hemodynamic targets post-ROSC: SBP ≥ 5th percentile for age; SpO₂ 94–99%; ETCO₂ 35–40",
      "Brain imaging (CT/MRI) post-ROSC to assess injury and guide prognosis",
      "PICU admission with continuous monitoring, arterial line, Foley — target UO ≥ 1 mL/kg/hr",
      "Family-centered care: keep family informed; social work; chaplaincy. Families permitted at bedside during resuscitation if possible.",
      "Autopsy and genetic evaluation if unexplained arrest — undiagnosed channelopathy in surviving family members",
    ]
  },

  nrp: {
    overview: {
      def: "Neonatal Resuscitation Program (NRP) — AAP/AHA 7th Edition 2021. The NRP algorithm applies at every delivery. Approximately 10% of newborns require some resuscitation; < 1% require intensive resuscitation (intubation, chest compressions, epinephrine). The first 60 seconds — the 'Golden Minute' — are critical.",
      bullets: [
        "Golden Minute: dry, stimulate, position, clear airway → assess HR and breathing within 60 seconds",
        "Three assessment questions: term gestation? good muscle tone? crying/breathing?",
        "If all 3 YES: routine care (warm, dry, clear airway, assess color). Stay with mother.",
        "Supplemental O₂ targets: preterm 21–30% FiO₂ start; term 21% (room air) first",
        "HR < 100: PPV at 40–60 bpm. HR < 60 despite 30s PPV: chest compressions 3:1 ratio",
        "Preterm < 32 weeks: place in polyethylene bag immediately (thermal protection); use pulse oximetry target table",
        "Meconium-stained fluid: routine care if vigorous (no longer suction bulb); intubation only if non-vigorous with concern for obstruction",
      ]
    },
    workup: [
      { icon:"📊", label:"APGAR Score (1 min and 5 min)", detail:"Appearance (color), Pulse (HR), Grimace (reflex), Activity (tone), Respiration. Score 7–10: normal. 4–6: moderate depression. 0–3: severe depression. Score at 5 min most prognostically significant." },
      { icon:"🌡️", label:"Temperature Management", detail:"Target axillary temp 36.5–37.5°C. Preterm: polyethylene bag + radiant warmer + exothermic mattress. Therapeutic hypothermia 33–34°C for HIE ≥ 36 weeks — Neonatology consult." },
      { icon:"🩸", label:"Umbilical Cord Blood Gas", detail:"Arterial cord pH < 7.0 or base deficit > 12 suggests perinatal asphyxia. pH 7.0–7.1 with symptoms: observe for HIE. Document for medicolegal." },
      { icon:"💉", label:"Umbilical Vein Access", detail:"Preferred emergency vascular access in delivery room. 3.5–5 Fr catheter via UV. Confirm placement (free-flowing blood, tip at UV-IVC junction). IO as alternative." },
      { icon:"🔬", label:"Point-of-Care Glucose", detail:"Screen at 30–60 min of life and q1–2h until stable. Threshold varies by age — AAP ≥ 45 mg/dL by 4h; symptomatic: treat at any level < 45 mg/dL." },
      { icon:"🧠", label:"HIE Evaluation (if asphyxiated)", detail:"Sarnat staging: Stage I (mild)/II (moderate)/III (severe). Criteria for cooling: ≥ 36 wks, birth asphyxia evidence + neurological abnormality. Start within 6h of birth." },
    ],
    treatment: [
      { cat:"🅐 Ventilation", drug:"Positive Pressure Ventilation (PPV)", dose:"Rate: 40–60 inflations/min. PIP: 20–25 cmH₂O (term); 20–25 cmH₂O (preterm). PEEP: 5 cmH₂O. FiO₂: term = 21%; preterm < 32 wks = 21–30%", renal:"N/A", ivpo:"BVM or T-piece resuscitator", deesc:"Effectiveness check at 30s: HR rising + chest rise = effective. MR SOPA if no chest rise (Mask, Reposition, Suction, Open mouth, Pressure increase, Airway alternative).", note:"T-piece resuscitator preferred over BVM for preterm — delivers consistent PIP and PEEP. Auscultate bilateral breath sounds + rising HR = best markers.", ref:"NRP 7th Ed AAP 2021" },
      { cat:"🅐 Medications", drug:"Epinephrine (Cardiac Arrest)", dose:"IV/IO: 0.01–0.03 mg/kg (0.1–0.3 mL/kg 1:10,000) q3–5 min. ETT: 0.05–0.1 mg/kg (0.5–1 mL/kg 1:10,000) — higher dose, less reliable", renal:"No adjustment", ivpo:"UV / IO preferred; ETT as last resort", deesc:"If HR not rising after 60s CPR + epi: assess for hypovolemia, pneumothorax, metabolic abnormality. Consider 10 mL/kg NS bolus if pale/history blood loss.", note:"Chest compressions: 3:1 ratio with ventilation (90 compressions + 30 breaths/min). 2-thumb encircling hands technique preferred.", ref:"NRP 7th Ed AAP 2021" },
      { cat:"🅑 Volume", drug:"Normal Saline Volume Expansion", dose:"10 mL/kg IV/IO over 5–10 min; may repeat; for suspected hypovolemia (blood loss, pale, tachycardia, shock)", renal:"N/A", ivpo:"UV / IO", deesc:"Whole blood 10 mL/kg or O-negative pRBCs if hemorrhagic shock (placenta previa, vasa previa, fetal-maternal hemorrhage).", note:"Avoid routine volume in non-hypovolemic newborn (worsens outcomes). Indicate only with clinical signs of hypovolemia.", ref:"NRP 7th Ed AAP 2021" },
      { cat:"🅒 Hypoglycemia", drug:"Dextrose 10% (D10W)", dose:"2 mL/kg IV/IO over 5 min; recheck glucose at 30 min; maintenance D10W at GIR 4–6 mg/kg/min", renal:"Adjust rate with fluid restriction", ivpo:"IV / UV", deesc:"Goal BG ≥ 45 mg/dL. Higher targets per NICU protocol. Recheck after each intervention. Add enteral feeds when tolerated.", note:"D10W standard for newborns — D25/D50 hyperosmolar and contraindicated in peripheral IV for neonates.", ref:"AAP Glucose Guidelines 2020" },
    ],
    followup: [
      "Delayed cord clamping ≥ 30–60 sec for vigorous term and preterm infants (AAP, ACOG) — improved iron stores, IVH reduction",
      "Therapeutic hypothermia (33–34°C × 72h) for HIE ≥ 36 weeks within 6h — Neonatology team immediately",
      "Vitamin K 0.5 mg IM (< 1.5 kg) or 1 mg IM (≥ 1.5 kg) within 6h of birth",
      "Newborn screening (state-mandated NBS panel): ideally 24–48h after birth",
      "Hearing screening before discharge (JCIH Universal Newborn Hearing Screening)",
      "CCHD pulse oximetry screening ≥ 24h of age (right hand + foot; saturation difference < 3%)",
      "Debrief with delivery team after every resuscitation: review timeline, interventions, communication",
    ]
  },

  broselow: {
    overview: {
      def: "The Broselow Pediatric Emergency Tape provides weight estimation by height and stratifies emergency equipment sizes and drug doses into color-coded zones. Developed by James Broselow MD, the tape's length correlates with weight in children 3–36 kg. Studies confirm ±10% accuracy in > 90% of children. Color zones correspond to pre-printed reference cards in the Broselow cart.",
      bullets: [
        "Measure supine from crown of head to heel — do NOT use the tape as a measuring stick around the patient",
        "Studies: Broselow ≤ 25 kg accurate within ±10% in > 90% of children (cannot use above 36 kg)",
        "Preferred over parental weight estimate — parents overestimate in obese children",
        "SALT-ED 2021: Broselow comparable to formula methods for weight estimation in children 1–10 yr",
        "For obese children: IBW-based dosing preferred for most medications (not actual weight)",
        "Color-coded emergency carts: drugs, equipment, and intubation supplies organized per zone",
      ]
    },
    workup: [],
    treatment: [],
    followup: []
  },

  respiratory: {
    overview: {
      def: "Pediatric respiratory emergencies encompass croup (LTB), reactive airway disease/asthma, bronchiolitis, epiglottitis, foreign body aspiration, and pneumonia. Differentiation by age, clinical presentation, and severity guides management. Respiratory failure remains the leading cause of pediatric cardiac arrest — early intervention is paramount.",
      bullets: [
        "Stridor: inspiratory = supraglottic/glottic (croup, epiglottitis); expiratory = subglottic/tracheal; biphasic = fixed obstruction",
        "Asthma: PEFR or clinical score (PRAM/PASS); SpO₂ < 92% = severe; silent chest = pre-arrest",
        "Epiglottitis: rare (vaccinated era); tripod position + drooling + toxic appearance → OR immediately",
        "Foreign body: unilateral wheeze + sudden onset ± choking episode → CXR inspiration/expiration; rigid bronchoscopy",
        "High-flow nasal cannula (HFNC): evidence-based for moderate bronchiolitis and asthma to reduce intubation",
        "Heliox (70:30): reduces turbulent airflow in upper airway obstruction; beneficial in severe croup/refractory asthma",
      ]
    },
    workup: [
      { icon:"🫁", label:"SpO₂ + Clinical Score", detail:"PRAM (Pediatric Respiratory Assessment Measure) for asthma: subcostal retractions, scalene use, wheeze, air entry, O₂ sat. 0–3 mild; 4–7 moderate; 8–12 severe." },
      { icon:"📸", label:"CXR (PA + Lateral)", detail:"Steeple sign (subglottic narrowing) in croup. Hyperinflation + peribronchial cuffing in asthma. Unilateral hyperlucency in FB. Consolidated opacity in pneumonia." },
      { icon:"🔬", label:"ABG/VBG in Severe Cases", detail:"pCO₂ rising with fatigue = impending respiratory failure. VBG reliable for pH and CO₂ screening. Intubate before respiratory arrest." },
      { icon:"🫀", label:"ECG in Severe Asthma", detail:"Cor pulmonale changes in severe prolonged attack. Sinus tachycardia from albuterol/SABA. Right heart strain pattern in status asthmaticus." },
      { icon:"💉", label:"BMP + Magnesium Level", detail:"IV magnesium sulfate for severe/moderate asthma — also check Mg level. K+ monitoring with repeated albuterol nebulization (hypokalemia common)." },
    ],
    treatment: [
      { cat:"🅐 Croup", drug:"Dexamethasone", dose:"0.6 mg/kg PO/IM/IV × 1 dose; max 10–16 mg; onset 6h; duration 24–48h — FIRST LINE for all croup severity (mild, moderate, severe)", renal:"No adjustment", ivpo:"PO preferred (equivalent bioavailability)", deesc:"AAP 2022: single dose oral dexamethasone for ALL grades of croup. Prednisolone 1 mg/kg × 3 days is acceptable alternative. Oral preferred — no IV needed for mild-moderate.", note:"Budesonide 2 mg nebulized: alternative if PO not feasible (e.g., vomiting). Slightly less evidence than dexamethasone.", ref:"AAP 2022 / ACEP" },
      { cat:"🅐 Croup", drug:"Racemic Epinephrine (Nebulized)", dose:"0.5 mL of 2.25% solution in 3 mL NS nebulized; may use L-epinephrine 5 mL of 1:1,000; repeat q20–30 min in severe cases", renal:"N/A", ivpo:"Nebulized", deesc:"For moderate-severe croup: stridor at rest, retractions, agitation. Duration 1–2h — observe 3–4h post-racemic epi for rebound. Admit if > 2 doses required.", note:"ACEP: racemic epi equivalent to L-epinephrine 5 mL. Do NOT discharge within 3h of racemic epi — rebound stridor.", ref:"ACEP / AAP 2022" },
      { cat:"🅐 Asthma", drug:"Albuterol + Ipratropium (Nebulized)", dose:"Albuterol 0.15 mg/kg/dose (min 2.5 mg, max 5 mg) q20 min × 3; then q1–4h. Ipratropium 250 mcg (< 20 kg) or 500 mcg q20 min × 3 ONLY (no benefit after first 3 doses)", renal:"No adjustment", ivpo:"Nebulized / MDI with spacer", deesc:"MDI + valved spacer equivalent to nebulizer for mild-moderate. Continuous albuterol 0.5 mg/kg/hr (max 20 mg/hr) for severe. SABA q20 min × 3 then reassess.", note:"Levalbuterol offers no significant advantage over racemic albuterol in children. MDI preferred over neb in mild-moderate (faster, fewer side effects).", ref:"GINA 2024 / AAP" },
      { cat:"🅑 Asthma", drug:"IV/PO Magnesium Sulfate", dose:"25–75 mg/kg IV over 20 min (max 2 g); for severe asthma not responding to SABA × 3 + systemic steroids", renal:"Reduce in AKI (CrCl < 30)", ivpo:"IV", deesc:"AAP/ACEP evidence for IV Mg in moderate-severe acute asthma. Reduces admission rate. Monitor for hypotension and respiratory depression.", note:"Nebulized MgSO₄ as adjunct to albuterol: 150 mg MgSO₄ in 2.5 mL NS nebulized — some evidence in severe cases.", ref:"AAP / Cochrane 2021" },
      { cat:"🅑 Asthma", drug:"Systemic Corticosteroids", dose:"Prednisolone/Prednisone 1 mg/kg/day PO (max 40 mg) × 3–5 days. IV methylprednisolone 1–2 mg/kg q6h (max 60 mg/dose) for severe", renal:"No adjustment", ivpo:"PO preferred; IV for severe", deesc:"3–5 day courses: no taper required. Oral as effective as IV for moderate asthma. Early steroid administration reduces hospitalization — give in ED, not just on discharge.", note:"Dexamethasone 0.6 mg/kg (max 16 mg) PO × 2 days: non-inferior to 5-day prednisolone course with better adherence (PECARN trial).", ref:"AAP / GINA 2024" },
      { cat:"🅒 Airway", drug:"Heliox (70:30 He:O₂)", dose:"70% helium / 30% O₂ via non-rebreather mask or ventilator circuit; delivers for moderate-severe respiratory distress", renal:"N/A", ivpo:"Inhaled (non-rebreather)", deesc:"Reduces turbulent airflow in upper and lower airway obstruction. Effect within minutes. Not effective if FiO₂ > 40% required (limits helium concentration).", note:"Bridge therapy while awaiting other medications to take effect. Beneficial in croup, severe asthma. Requires specialized tank and education.", ref:"AAP / ACEP" },
    ],
    followup: [
      "Croup discharge: 3–4h observation post-racemic epi; return if stridor at rest, cyanosis, drooling, difficulty swallowing",
      "Asthma: step-up controller medication at discharge (ICS if ≥ 2 exacerbations/year — GINA 2024)",
      "Written Asthma Action Plan (AAP): green/yellow/red zones with specific medication instructions",
      "Confirm MDI + spacer technique before discharge; spacer prescription",
      "Primary care follow-up within 1 week of severe asthma or croup exacerbation",
      "Influenza and pneumococcal vaccination for asthma patients (AAP immunization schedule)",
      "Pulmonology referral: poor control, frequent ED visits, or atypical features",
    ]
  },

  febrile_sz: {
    overview: {
      def: "Febrile seizures occur in 2–5% of children aged 6 months to 5 years. Classified as simple (generalized, < 15 min, single episode per febrile illness) or complex (focal, > 15 min, or recurrence within 24h). AAP 2011 Practice Parameter: routine neuroimaging, EEG, and LP are NOT recommended for simple febrile seizures in well-appearing children.",
      bullets: [
        "Simple: generalized tonic-clonic, < 15 min, single event per illness, no postictal focal deficit",
        "Complex: focal onset, > 15 min, multiple events same illness, or Todd's paresis → further workup",
        "Recurrence risk: 30–40% have ≥ 1 recurrence; risk factors: age < 18 mo, low temp at onset, family history, brief duration",
        "LP: AAP does NOT recommend routine LP for simple febrile seizure. LP for: meningismus, no immunizations, prolonged seizure, toxic appearance",
        "Risk of epilepsy: 2–4× general population (~2–4% overall) — but absolute risk low; reassure parents",
        "Antipyretics (AAP 2011): do NOT prevent febrile seizure recurrence — do not prescribe for this purpose",
      ]
    },
    workup: [
      { icon:"🌡️", label:"Temperature + Source Assessment", detail:"Document temperature. Search for febrile source (otitis media, URI, roseola, UTI in < 2 yr). Viral URI most common underlying cause." },
      { icon:"🧠", label:"Neurological Exam (post-ictal)", detail:"Focal deficits (Todd's paresis), meningismus, altered level of consciousness > 1 hour post-ictal → imaging and LP." },
      { icon:"🔬", label:"CBC + BMP (Selected Cases)", detail:"AAP: lab testing not routinely indicated for simple febrile seizure. Consider if < 6 mo, prolonged seizure, or source not found. Screen glucose always." },
      { icon:"📸", label:"CT/MRI (Complex Febrile Sz Only)", detail:"Not indicated for simple febrile seizure. Obtain for focal deficits, prolonged postictal state, suspicion of trauma/abuse, or signs of elevated ICP." },
      { icon:"🧫", label:"LP (Selected Cases)", detail:"AAP 2011: do not perform routine LP for simple febrile seizure. Consider in: < 12 mo (unreliable meningeal signs), incomplete immunization, prior ABX use masking meningitis." },
    ],
    treatment: [
      { cat:"🅐 Acute Sz", drug:"Diazepam Rectal (Diastat)", dose:"< 2 yr: 0.5 mg/kg PR; 2–5 yr: 0.5 mg/kg PR; 6–11 yr: 0.3 mg/kg PR; max 20 mg; for active seizure > 5 min at home or transport", renal:"No adjustment", ivpo:"PR / IM / IN", deesc:"First-line out-of-hospital. Lorazepam 0.1 mg/kg IV/IO in-hospital equivalent. Midazolam 0.2 mg/kg IN/buccal: equivalent efficacy, less invasive.", note:"Rectal diazepam remains AAP first-line for out-of-hospital use. Midazolam IN/buccal increasingly preferred by parents (ease of use).", ref:"AAP 2011 / Neurology" },
      { cat:"🅐 Acute Sz", drug:"Lorazepam IV (In-Hospital)", dose:"0.05–0.1 mg/kg IV/IO; max 4 mg/dose; onset 1–5 min; may repeat q5–10 min × 2", renal:"No adjustment", ivpo:"IV / IO", deesc:"If seizure not terminated after 2 BZD doses (refractory): levetiracetam 60 mg/kg IV (max 4,500 mg) over 15 min OR phenobarbital 20 mg/kg IV over 30 min.", note:"Phenobarbital causes more respiratory depression than levetiracetam — airway monitoring mandatory. Have BVM at bedside.", ref:"AAP / Neurology 2023" },
      { cat:"🅑 Fever", drug:"Acetaminophen / Ibuprofen", dose:"Acetaminophen: 15 mg/kg PO/PR q4–6h. Ibuprofen: 10 mg/kg PO q6–8h (≥ 6 mo). Alternate if needed for comfort", renal:"Avoid ibuprofen if AKI", ivpo:"PO / PR", deesc:"AAP 2011: antipyretics do NOT prevent febrile seizure recurrence — prescribe for comfort only. Counsel family explicitly on this point.", note:"Parents commonly believe antipyretics prevent recurrence. This is NOT true and must be addressed to set appropriate expectations.", ref:"AAP 2011" },
    ],
    followup: [
      "Parental education is the most important intervention — reassure that simple febrile seizures do NOT cause brain damage, death, or epilepsy in the vast majority",
      "Recurrence counseling: 30–40% chance; provide written seizure first aid instructions",
      "Prescribe rectal diazepam for home use if prolonged seizures (> 5 min) or parental preference (AAP supports)",
      "Do NOT prescribe daily antiepileptics for simple febrile seizure prevention (AAP 2011 — risk of daily AED > benefit)",
      "Follow-up with PCP within 1 week; neurology referral for complex febrile seizures",
      "Complex febrile seizure: EEG within 1 month; MRI if focal or prolonged",
    ]
  },

  sepsis: {
    overview: {
      def: "Pediatric sepsis: life-threatening organ dysfunction from infection. Surviving Sepsis Campaign pediatric guidelines (2020) and ACEP emphasize early recognition, early antibiotics, and judicious fluid resuscitation. Fluid-refractory shock requires vasopressors — excessive fluid may harm. Septic shock in children: tachycardia/bradycardia + signs of decreased perfusion (altered mental status, poor cap refill, decreased UO) with or without hypotension.",
      bullets: [
        "Age-specific HR/BP thresholds: newborn HR > 180/SBP < 60; infant HR > 180/SBP < 70; toddler HR > 160/SBP < 75",
        "PELOD-2 and pSOFA scores guide severity — organ dysfunction, not just vital signs",
        "SSC 2020 Peds: first-hour resuscitation bundles — antibiotic < 1h, fluid bolus 10–20 mL/kg, vasopressors if fluid-refractory",
        "Balanced crystalloids (LR) preferred over NS — hyperchloremic acidosis with large NS volumes",
        "FEAST trial: rapid fluid bolus associated with increased mortality in febrile illness in African children — context-dependent",
        "Vasopressor of choice: epinephrine (cold shock — vasoconstricted extremities); dopamine/norepinephrine (warm shock)",
      ]
    },
    workup: [
      { icon:"🩸", label:"Blood Cultures × 2 Before ABX", detail:"Draw before antibiotics but do NOT delay ABX beyond 1h. Aerobic and anaerobic from 2 sites. Positive in 5–15% pediatric sepsis." },
      { icon:"🔬", label:"CBC + CMP + Lactate + CRP", detail:"WBC (high or low), bands, platelets (low = DIC), creatinine, bilirubin. Lactate > 2 mmol/L = hypoperfusion. CRP/procalcitonin trend guides de-escalation." },
      { icon:"🫀", label:"Bedside POCUS (Cardiac)", detail:"Assess ventricular function, pericardial effusion, IVC. Cold shock: hyperdynamic hearts with vasoconstriction. Warm shock: vasodilated with normal/high CO." },
      { icon:"🧫", label:"Source-Directed Cultures", detail:"UA + urine culture (UTI most common peds sepsis source), CSF (if ≤ 2 mo or meningeal signs), respiratory cultures, wound culture per source." },
      { icon:"📊", label:"Coagulation — PT/INR + Fibrinogen", detail:"DIC screen: PT > 15, INR > 1.5, fibrinogen < 100, elevated D-dimer. Treat DIC with underlying sepsis treatment ± FFP/cryo if bleeding or procedural." },
    ],
    treatment: [
      { cat:"🅐 ABX", drug:"Broad-Spectrum Empiric Antibiotics", dose:"Ceftriaxone 100 mg/kg IV q24h (max 4g; neonates: ampicillin + cefotaxime); ADD vancomycin 15 mg/kg IV q6h (max 750 mg/dose) if MRSA risk, indwelling hardware, or hemodynamically unstable", renal:"Vancomycin AUC-guided; ceftriaxone no adjustment", ivpo:"IV / IO", deesc:"De-escalate at 48–72h based on cultures. Duration: 5–7d most sources; 10–14d for bacteremia. ACEP/AAP: give within 1 hour of recognition.", note:"Neonatal sepsis (< 28 days): ampicillin 50 mg/kg IV q12h + gentamicin 5 mg/kg IV q24h + acyclovir 20 mg/kg IV q8h (HSV coverage).", ref:"SSC Peds 2020 / ACEP" },
      { cat:"🅐 Fluids", drug:"Isotonic Crystalloid Bolus", dose:"10–20 mL/kg LR or NS IV/IO over 5–20 min; reassess after each bolus for response vs. overload; max 40–60 mL/kg first hour (reassess at 20 mL/kg)", renal:"Reduce in AKI, cardiomyopathy", ivpo:"IV / IO", deesc:"Reassess after each bolus: improved HR, cap refill, mental status, UO. STOP if crackles, hepatomegaly, worsening SpO₂ — early vasopressors instead.", note:"ACEP 2023: fluid-restrictive approach supported in developed-country settings. Titrate to perfusion endpoints. Norepinephrine earlier if fluid-refractory.", ref:"SSC Peds 2020 / ACEP 2023" },
      { cat:"🅑 Vasopressors", drug:"Epinephrine (Cold/Vasoconstrictive Shock)", dose:"0.05–0.3 mcg/kg/min IV/IO infusion; titrate by 0.05 mcg/kg/min q5–10 min to MAP > 5th percentile for age", renal:"No adjustment", ivpo:"IV / IO infusion (central preferred)", deesc:"Cold shock presentation: vasoconstricted extremities, normal/low BP, prolonged cap refill → epinephrine (inotrope + vasopressor). Warm shock → norepinephrine preferred.", note:"Dopamine: acceptable if epi/NE unavailable; SSC peds recommends epi/NE over dopamine (higher arrhythmia rate with dopamine).", ref:"SSC Peds 2020" },
      { cat:"🅑 Vasopressors", drug:"Norepinephrine (Warm/Vasodilated Shock)", dose:"0.05–0.3 mcg/kg/min IV/IO infusion; titrate to MAP ≥ 5th percentile for age; max 2 mcg/kg/min", renal:"No adjustment", ivpo:"IV / IO (central preferred)", deesc:"Warm shock: vasodilated, bounding pulses, flash cap refill → norepinephrine (vasoconstriction). Add hydrocortisone if vasopressor-refractory.", note:"Hydrocortisone 2 mg/kg IV q6h (max 50 mg/dose) for fluid and vasopressor-refractory shock — adrenal insufficiency suspect.", ref:"SSC Peds 2020" },
    ],
    followup: [
      "PICU admission for all septic shock; continuous arterial line monitoring",
      "Antibiotic de-escalation at 48–72h based on cultures — document stewardship plan",
      "Procalcitonin trending for de-escalation guidance (PCT < 0.5 with clinical improvement)",
      "Source control: drain abscess, remove indwelling catheter, treat obstruction within 6–12h",
      "Family communication: daily goals discussion, visiting hour policy, social work support",
      "Post-discharge: follow-up within 48–72h; PICS (post-intensive care syndrome) awareness in families",
    ]
  },

  anaphylaxis: {
    overview: {
      def: "Anaphylaxis: serious systemic hypersensitivity reaction developing over minutes. Diagnosis: multi-organ involvement (skin + respiratory OR cardiovascular) after allergen exposure. Most common triggers: foods (peanut, tree nuts, milk, egg, shellfish), medications, venom. Epinephrine IM into lateral thigh is the ONLY first-line treatment. All other therapies are adjunctive.",
      bullets: [
        "First-line: epinephrine IM 0.01 mg/kg (max 0.5 mg) into anterolateral thigh IMMEDIATELY",
        "Antihistamines and steroids are ADJUNCT ONLY — do not delay epinephrine for these agents",
        "Biphasic reaction: recurrence 1–72h later in 5–20%; admit all moderate-severe anaphylaxis × 4–8h minimum",
        "Epinephrine auto-injector: 0.15 mg (15–25 kg) or 0.3 mg (25+ kg); inject outer thigh, hold 3 sec",
        "Position: supine with legs elevated (or sitting upright if respiratory distress); do NOT stand up suddenly",
        "Refractory: IV epinephrine infusion 0.1–1 mcg/kg/min; glucagon for beta-blocker refractory shock",
      ]
    },
    workup: [
      { icon:"🌡️", label:"Vital Signs + SpO₂", detail:"Hypotension (SBP < 5th percentile for age), tachycardia, and SpO₂ < 94% indicate severe anaphylaxis. Monitor q5 min until stable." },
      { icon:"🔬", label:"Serum Tryptase (if available)", detail:"Mast cell tryptase: peak at 60–90 min. Helps confirm diagnosis retrospectively. Normal tryptase does NOT exclude anaphylaxis (food triggers often low tryptase)." },
      { icon:"🫀", label:"ECG (Cardiovascular Anaphylaxis)", detail:"Kounis syndrome: coronary vasospasm or MI during anaphylaxis. ECG for chest pain, ST changes, or shock disproportionate to allergen exposure." },
      { icon:"💉", label:"IV Access × 2", detail:"Large-bore bilateral IVs. Volume resuscitation for refractory hypotension: 10–20 mL/kg LR bolus. Central access if peripheral unavailable and critically ill." },
    ],
    treatment: [
      { cat:"🅐 Antidote", drug:"Epinephrine IM (FIRST LINE)", dose:"0.01 mg/kg IM (1 mg/mL = 1:1,000 solution); max 0.5 mg; inject anterolateral thigh; repeat q5–15 min as needed", renal:"No adjustment", ivpo:"IM anterolateral thigh", deesc:"There is NO absolute contraindication to epinephrine in anaphylaxis. Fear of epinephrine side effects is not a reason to delay. Repeat q5 min if no response.", note:"Auto-injector dosing: 0.15 mg for 15–25 kg (EpiPen Jr); 0.3 mg for ≥ 25 kg (EpiPen). Some guidelines use 0.15 mg for 7.5–25 kg.", ref:"AAP / WAO 2020" },
      { cat:"🅑 Adjunct", drug:"Diphenhydramine (H1 Blocker)", dose:"1 mg/kg IV/IM/PO; max 50 mg; q6h for 24h after initial reaction", renal:"No adjustment", ivpo:"IV / IM / PO", deesc:"ADJUNCT only — does not treat airway or cardiovascular anaphylaxis. H1 + H2 blockers (ranitidine/famotidine) improve urticaria and flushing.", note:"Do NOT give antihistamine instead of epinephrine. Antihistamines alone are insufficient for systemic anaphylaxis.", ref:"AAP / ACEP" },
      { cat:"🅑 Adjunct", drug:"Methylprednisolone", dose:"1–2 mg/kg IV q6h; max 125 mg/dose; OR prednisone 1 mg/kg PO (max 60 mg) for 3 days post-discharge", renal:"No adjustment", ivpo:"IV / PO", deesc:"May reduce biphasic reaction risk (evidence weak — controversial). Give in moderate-severe anaphylaxis. Outpatient prednisone × 3 days at discharge.", note:"Steroids take 4–6h to act — not effective acutely. Primarily given to attenuate prolonged or biphasic reactions.", ref:"AAP / ACEP" },
      { cat:"🅒 Refractory", drug:"Epinephrine IV Infusion", dose:"0.1–1 mcg/kg/min IV; titrate to hemodynamic response; for refractory shock not responding to IM epinephrine + fluids", renal:"No adjustment", ivpo:"IV infusion (ICU)", deesc:"Glucagon 20–30 mcg/kg IV over 5 min (max 1 mg) for beta-blocker refractory anaphylaxis. Follow with infusion 5–15 mcg/min.", note:"Glucagon reverses beta-blockade-induced unresponsiveness to epinephrine. Always have at bedside in patients on beta-blockers.", ref:"AAP / ACEP" },
    ],
    followup: [
      "Observe minimum 4–6h for mild-moderate; 8–24h for severe (biphasic risk: 5–20%)",
      "Prescribe epinephrine auto-injector (× 2) to ALL patients before discharge — no exceptions",
      "Written anaphylaxis action plan (FARE template) and allergen avoidance counseling",
      "Allergy/immunology referral within 1 month for trigger identification, venom immunotherapy if applicable",
      "MedicAlert bracelet prescription or recommendation",
      "AAP Bright Futures: discuss anaphylaxis plan at next well visit; school epi-pen protocol",
    ]
  },

  dka: {
    overview: {
      def: "Diabetic ketoacidosis (DKA) in children: pH < 7.30 or bicarbonate < 15 mEq/L + hyperglycemia > 200 mg/dL + ketonemia/ketonuria. Cerebral edema — the most feared DKA complication in children — is associated with rapid fluid shifts, bicarbonate administration, and age < 5 years. ISPAD 2022 consensus and ADA guidelines govern management.",
      bullets: [
        "Cerebral edema: occurs in 0.5–1% of peds DKA; 25% mortality; neurological symptoms 4–12h into treatment",
        "Warning signs: headache + bradycardia, change in neurological status, BP rise during treatment — act IMMEDIATELY",
        "DO NOT give IV bicarbonate (increases cerebral edema risk) — do not give even in severe acidosis",
        "Fluid rate: 1.5–2× maintenance for most DKA; do NOT give rapid large boluses (except shock)",
        "Insulin: do NOT start until > 1h of fluids (avoid further hypokalemia). Rate: 0.05–0.1 units/kg/hr",
        "Potassium: add to all fluids once K+ confirmed < 5.5 mEq/L and adequate urine output — hypokalemia is lethal",
      ]
    },
    workup: [
      { icon:"🔬", label:"BMP, BHB, VBG q2–4h", detail:"Glucose (CBG q1h), K+ (critical), Na+ (corrected Na = measured Na + 1.6 × [(BG–100)/100]), bicarbonate trending, BHB > 3 = DKA." },
      { icon:"📊", label:"Urinalysis + Urine Ketones", detail:"Glucosuria, ketonuria confirm DKA. Dipstick measures acetoacetate (not BHB) — may be false negative early. BHB is gold standard." },
      { icon:"🫀", label:"ECG — Potassium Abnormalities", detail:"Hypokalemia: U waves, flat T, ST depression. Hyperkalemia: peaked T, wide QRS. Telemetry throughout DKA treatment." },
      { icon:"🧠", label:"Neurological Assessment Q1–2h", detail:"Glasgow Coma Scale, pupil checks. Cerebral edema: sudden headache, behavioral change, BP elevation, bradycardia — treat BEFORE CT." },
      { icon:"🧫", label:"Blood/Urine Cultures", detail:"DKA may be precipitated by infection. HbA1c for new-onset diagnosis and glycemic control assessment." },
    ],
    treatment: [
      { cat:"🅐 Fluids", drug:"Isotonic Fluid Resuscitation", dose:"SHOCK only: 10–20 mL/kg LR or NS bolus. MAINTENANCE: 1.5–2× maintenance rate with 0.45% NaCl + 20–40 mEq/L KCl + KPhos (adjust per K+)", renal:"Adjust per fluid/electrolyte status", ivpo:"IV", deesc:"Add dextrose to IV fluids when BG < 250–300 mg/dL ('two-bag system': bag 1 = 0.45% NaCl + K; bag 2 = D10 + 0.45% NaCl + K). Adjust ratio to maintain BG 150–250.", note:"ISPAD 2022: no benefit of faster fluid (1.5× vs 2×) in reducing cerebral edema — moderate fluid rate recommended. Avoid rapid boluses unless hemodynamically unstable.", ref:"ISPAD 2022 / ADA" },
      { cat:"🅐 Insulin", drug:"Regular Insulin Infusion", dose:"0.05–0.1 units/kg/hr IV; do NOT bolus (increases cerebral edema risk). DO NOT start until > 1h of IV fluids AND K+ ≥ 3.5 mEq/L", renal:"Standard — adjust fluid", ivpo:"IV infusion", deesc:"Reduce to 0.05 units/kg/hr as acidosis resolves (pH > 7.3, HCO₃ > 15). Switch to SQ insulin 30 min before stopping infusion. Overlap is critical.", note:"ISPAD: no insulin bolus in DKA. Rate 0.05 u/kg/hr adequate for most. Faster rate increases risk of hypoglycemia and hypokalemia.", ref:"ISPAD 2022" },
      { cat:"🅑 Electrolytes", drug:"Potassium Replacement", dose:"If K+ < 3.5: 0.5–1 mEq/kg IV over 1–2h; HOLD insulin. K+ 3.5–5.5: add 40 mEq/L KCl + 40 mEq/L KPhos to IVF. K+ > 5.5: hold K+ replacement; recheck q1h", renal:"Continuous monitoring — DKA shifts K+", ivpo:"IV", deesc:"DO NOT start insulin until K+ is confirmed ≥ 3.5 mEq/L and urine output present. Recheck K+ q1–2h during active DKA treatment.", note:"Total body K+ is severely depleted even if serum K+ appears normal or high initially (acidosis shifts K+ out of cells).", ref:"ISPAD 2022 / ADA" },
      { cat:"🅒 Cerebral Edema", drug:"Mannitol OR Hypertonic Saline (3%)", dose:"Mannitol: 0.5–1 g/kg IV over 20 min (max 500 mL 20%). OR 3% NaCl: 2.5–5 mL/kg IV over 15–30 min. Give IMMEDIATELY at first sign of neurological deterioration", renal:"Caution AKI; monitor Na+", ivpo:"IV", deesc:"DO NOT wait for CT to treat suspected cerebral edema — treatment first, imaging after stabilization. Reduce IV fluid rate by 1/3. Elevate HOB 30°. Neurosurgery/PICU stat.", note:"3% saline increasingly preferred over mannitol for DKA cerebral edema (PECARN DKA trial). Either is acceptable.", ref:"ISPAD 2022 / PECARN" },
    ],
    followup: [
      "Continuous glucose monitoring initiation in new-onset T1DM before discharge",
      "Endocrinology consult for all new-onset DKA; diabetes education team referral",
      "Discharge insulin regimen: basal-bolus ± CGM; written sick-day management plan",
      "HbA1c and C-peptide for classification (T1 vs T2 DKA in obese adolescents)",
      "Family education on DKA warning signs, 'sick day rules,' and ketone monitoring",
      "Follow-up endocrinology 1 week post-discharge; diabetes education program enrollment",
    ]
  },

  rsv: {
    overview: {
      def: "RSV bronchiolitis: most common lower respiratory infection in infants < 12 months. Peak October–March. AAP 2023 Clinical Practice Guideline — updated to reflect nirsevimab (Beyfortus) monoclonal antibody prophylaxis. Diagnosis is CLINICAL — routine RSV testing does not change management. Treatment is supportive.",
      bullets: [
        "AAP 2023: diagnosis is CLINICAL — do NOT obtain routine CXR, CBC, electrolytes, or RSV PCR for typical bronchiolitis",
        "Nirsevimab (Beyfortus): single IM injection approved for infants < 8 months entering RSV season; dose 50 mg (< 5 kg) or 100 mg (≥ 5 kg)",
        "Palivizumab (Synagis): monthly IM injection for high-risk infants (premature, CHD, chronic lung disease) — 5 doses",
        "AAP does NOT recommend: albuterol, epinephrine, corticosteroids, antibiotics, or DNase for bronchiolitis",
        "HFNC: may reduce intubation in moderate-severe bronchiolitis — AAP 2023 acknowledges evidence but notes unclear benefit threshold",
        "Hospitalization criteria: SpO₂ < 90% on room air, RR > 70, poor feeding (< 50% usual intake), apnea, dehydration",
      ]
    },
    workup: [
      { icon:"🫁", label:"Clinical Assessment + SpO₂", detail:"Assess work of breathing: nasal flaring, subcostal/intercostal retractions, grunting. SpO₂ < 90% on room air = admission threshold (AAP 2023)." },
      { icon:"💧", label:"Hydration Status", detail:"Feeding history, wet diapers, fontanelle, mucous membranes, skin turgor, capillary refill. < 50% usual intake is a concern; < 25% = IV fluids." },
      { icon:"🔬", label:"RSV/Viral Panel (Selected Cases)", detail:"AAP 2023: NOT routinely indicated. May influence cohorting, infection control, or discharge planning. RSV PCR if atypical or immunocompromised." },
      { icon:"📸", label:"CXR (Atypical or Severe Cases)", detail:"AAP 2023: NOT routine. Order for: suspected complications (pneumothorax, consolidation), clinical deterioration, fever > 38.5°C suggesting bacterial co-infection." },
    ],
    treatment: [
      { cat:"🅐 Supportive", drug:"Nasal Suctioning", detail:"Bulb syringe or mechanical suction before feeds. AAP 2023: gentle nasal suctioning is the only intervention consistently supported to improve feeding.", dose:"Gentle suction q4–6h or as needed; use 1–2 drops NS first for thick secretions", renal:"N/A", ivpo:"Topical", deesc:"Provide parents with bulb syringe and technique teaching. Aggressive suctioning may worsen edema. Nasopharyngeal suction only if needed.", note:"Saline drops + gentle suction before feeds improves oral intake. Position upright 30°.", ref:"AAP 2023" },
      { cat:"🅐 Supportive", drug:"Hydration (PO/NG/IV)", dose:"Oral: encourage frequent small feeds. NG tube feeds if < 50% intake and no distress. IV D5 0.45% NS at maintenance if NG not tolerated or respiratory distress precludes safe oral feeds", renal:"Standard", ivpo:"PO / NG / IV", deesc:"Recheck hydration q4–6h. If improving oral intake → stepdown to PO. Breastfeeding encouraged throughout.", note:"AAP: frequent small feeds preferred over forced large volume. Do NOT suction before offering oral feeds as reflex can reduce respiratory drive temporarily.", ref:"AAP 2023" },
      { cat:"🅑 Oxygen", drug:"Supplemental O₂ (SpO₂ < 90%)", dose:"Low-flow NC: 0.5–2 L/min target SpO₂ ≥ 90%. HFNC: 1–2 L/kg/min (max 40 L/min), FiO₂ as needed for moderate-severe. Wean when SpO₂ sustained > 90% on RA", renal:"N/A", ivpo:"Inhaled", deesc:"AAP 2023: SpO₂ ≥ 90% is acceptable threshold (previously ≥ 95%). Continuous SpO₂ monitoring not recommended for stable infants on low-flow O₂ — causes false alarms and alarm fatigue.", note:"HFNC reduces intubation rate in moderate bronchiolitis (TRAMONTANE trial). However, AAP does not mandate HFNC — supportive and center-dependent.", ref:"AAP 2023 / TRAMONTANE" },
      { cat:"🅒 Prevention", drug:"Nirsevimab (Beyfortus)", dose:"< 5 kg: 50 mg IM × 1 injection. ≥ 5 kg: 100 mg IM × 1 injection. Administer at birth or start of RSV season for infants < 8 months", renal:"N/A", ivpo:"IM (anterolateral thigh)", deesc:"AAP 2023: universal recommendation for all infants < 8 months entering or during RSV season, regardless of risk status. Highly cost-effective. MELODY trial: 75% reduction in hospitalization.", note:"Palivizumab (monthly) still indicated for very high-risk groups (< 29 wk gestation, hemodynamically significant CHD, chronic lung disease of prematurity) if nirsevimab unavailable.", ref:"AAP 2023 / MELODY Trial" },
    ],
    followup: [
      "AAP 2023: most bronchiolitis resolves in 2 weeks; cough may persist 4 weeks — reassure parents",
      "Return precautions: worsening respiratory distress, apnea, SpO₂ < 90%, < 50% feeding, fever > 38°C in < 3 months",
      "No routine use of albuterol, steroids, or antibiotics in follow-up (AAP)",
      "Ensure nirsevimab or palivizumab status documented and scheduled if not yet received",
      "RSV infection increases risk for childhood asthma — discuss at 12-month visit; follow for recurrent wheeze",
      "Educate on secondhand smoke avoidance, handwashing, and avoiding daycare during peak illness",
    ]
  },

  croup: {
    overview: {
      def: "Croup (laryngotracheobronchitis) — most common cause of acute upper airway obstruction in children 6 months to 3 years. Parainfluenza virus type 1 (peak fall). Clinical diagnosis: barky (seal-like) cough + inspiratory stridor + hoarseness. Westley Croup Score guides severity. AAP and ACEP both recommend oral dexamethasone for all severity levels.",
      bullets: [
        "Mild (score 1–2): barky cough, no stridor at rest → oral dexamethasone 0.6 mg/kg × 1 dose",
        "Moderate (score 3–7): stridor at rest + retractions → oral dexamethasone + racemic epinephrine neb",
        "Severe (score 8–11): stridor at rest + severe retractions + agitation/cyanosis → urgent airway management",
        "DO NOT agitate the child with severe croup — keep child calm, keep with caregiver, minimize procedures",
        "Spasmodic croup: sudden onset, no fever, recurrent — responds to humidity; etiology unclear (allergic?)",
        "Impending respiratory failure: drooling + toxic appearance → consider epiglottitis (rare), FB aspiration",
        "Heliox 70:30: evidence for moderate-severe croup to reduce work of breathing acutely",
      ]
    },
    workup: [
      { icon:"🐕", label:"Clinical Diagnosis (No Imaging Required)", detail:"AAP: croup is a CLINICAL diagnosis. Chest X-ray is NOT routinely indicated. Steeple sign (subglottic narrowing) is supportive but not required and not always present." },
      { icon:"📊", label:"Westley Croup Score", detail:"Stridor (0–2), retractions (0–3), air entry (0–2), cyanosis (0–5), LOC (0–5). Score 0–2 = mild; 3–7 = moderate; ≥ 8 = severe." },
      { icon:"🌡️", label:"Temperature + Respiratory Assessment", detail:"High fever (> 39°C) + toxic appearance + drooling → consider epiglottitis (Hib, despite vaccination). Afebrile spasmodic croup: different management." },
      { icon:"📸", label:"AP Neck X-ray (Steeple Sign)", detail:"Only if diagnosis uncertain or severe to rule out epiglottitis, retropharyngeal abscess, FB. Steeple sign: subglottic narrowing on AP view. NOT sensitive or specific enough to replace clinical judgment." },
    ],
    treatment: [
      { cat:"🅐 All Croup", drug:"Dexamethasone (AAP First-Line)", dose:"0.6 mg/kg PO × 1 dose; max 10–16 mg; oral and IM/IV are equivalent; onset 1–3h; duration 24–48h; single dose for ALL grades", renal:"No adjustment", ivpo:"PO / IM / IV (all equivalent)", deesc:"AAP 2022 and ACEP: prescribe dexamethasone for ALL children with croup (mild, moderate, severe). Reduces return visits, hospitalization. No benefit to higher doses > 0.6 mg/kg.", note:"Prednisolone 1 mg/kg/day PO × 3 days: acceptable alternative. Budesonide 2 mg nebulized: used if PO not tolerated. Dexamethasone PO is bitter — mix with Gatorade or jam if refusing.", ref:"AAP 2022 / ACEP CPG" },
      { cat:"🅑 Mod-Severe", drug:"Racemic Epinephrine Nebulized", dose:"0.5 mL of 2.25% solution in 2.5 mL NS; nebulize over 15 min; may repeat q20–30 min for severe cases; L-epi: 5 mL of 1:1,000 equivalent", renal:"N/A", ivpo:"Nebulized", deesc:"ACEP: observe minimum 3–4h post-racemic epi before discharge (rebound stridor). Admit if: ≥ 2 doses of racemic epi, persistent stridor at rest, O₂ requirement, age < 6 months.", note:"ACEP clinical policy: L-epinephrine (5 mL 1:1,000) = racemic epinephrine for croup. Racemic epi has no real pharmacological advantage.", ref:"ACEP CPG / AAP 2022" },
      { cat:"🅒 Severe", drug:"Heliox 70:30 + Airway Preparation", dose:"70% He/30% O₂ via tight-fitting non-rebreather mask; administer while setting up for potential intubation; decrease turbulent airflow immediately", renal:"N/A", ivpo:"Inhaled", deesc:"Bridge therapy for severe croup while dex/racemic epi take effect. ENT + anesthesia standby for all severe croup. RSI with smaller ETT (0.5 mm below calculated size) in OR/ICU if possible.", note:"If airway management required: experienced provider only; gentle RSI or inhalation induction. Cricothyrotomy may be impossible in small child — surgical airway plan B required.", ref:"ACEP / Cochrane" },
    ],
    followup: [
      "Mild croup discharged after 1 dose dexamethasone: return if stridor at rest, cyanosis, respiratory distress",
      "Moderate (post-racemic epi): 3–4h observation minimum; if stable → discharge with dexamethasone education",
      "Recurrent croup (≥ 3 episodes): ENT referral for subglottic stenosis, hemangioma, laryngomalacia evaluation",
      "Inform parents: barky cough may persist 3–7 days; nocturnal worsening is expected",
      "Humidity/cool-mist humidifier: evidence is weak but low-risk; parents may try for comfort",
      "Croup season counseling: parainfluenza peaks fall; influenza vaccination does not prevent croup",
    ]
  },

  influenza: {
    overview: {
      def: "Influenza in children — AAP 2024–25 season guidelines. Influenza A and B cause significant pediatric morbidity; children 6–59 months and those with high-risk conditions have highest complications. Annual influenza vaccination is universally recommended by AAP for all children ≥ 6 months. Antiviral treatment indicated for hospitalized and high-risk children regardless of symptom duration.",
      bullets: [
        "AAP 2024–25: annual influenza vaccine for all children ≥ 6 months — IIV4 (inactivated) or LAIV4 (live attenuated ≥ 2 yr, no asthma)",
        "Antiviral treatment within 48h: most benefit, but HOSPITALIZED patients benefit at any time",
        "Oseltamivir (Tamiflu): first-line; FDA approved for treatment ≥ 2 weeks of age and prophylaxis ≥ 3 months",
        "Complications: otitis media (most common), pneumonia, myocarditis, encephalopathy, secondary bacterial infection (MRSA PNA)",
        "Influenza B: more likely associated with myositis, myocarditis, and neurological complications in children",
        "High-risk groups: age < 5 yr (especially < 2 yr), asthma, diabetes, immunocompromised, obesity, pregnancy, neurodevelopmental conditions",
      ]
    },
    workup: [
      { icon:"🧪", label:"Rapid Influenza Diagnostic Test (RIDT)", detail:"Specificity > 95%; sensitivity 50–70% (misses up to 30%). Negative RIDT does NOT rule out influenza during outbreak. Molecular RIDT or RT-PCR preferred." },
      { icon:"🔬", label:"RT-PCR (Gold Standard)", detail:"Sensitivity > 95%. Use for hospitalized patients, ICU, or when management will change. Nasopharyngeal swab preferred over throat swab." },
      { icon:"📸", label:"CXR if Respiratory Symptoms", detail:"Viral pneumonia: bilateral interstitial infiltrates. Secondary bacterial (MRSA) PNA: necrotizing pneumonia, effusion, pneumatoceles. CXR when SpO₂ < 94% or clinical concern for pneumonia." },
      { icon:"🫀", label:"ECG + Troponin (Myocarditis Screen)", detail:"Influenza B-associated myocarditis: chest pain, tachycardia disproportionate to fever, arrhythmia. Troponin + BNP + echo if suspected." },
      { icon:"🧠", label:"Metabolic Panel (Encephalopathy)", detail:"Influenza-associated encephalopathy/encephalitis: rapidly progressive AMS + fever. NH₃, LFTs, BMP. Head CT + LP. Prognosis variable — IV acyclovir empirically until HSV excluded." },
    ],
    treatment: [
      { cat:"🅐 Antiviral", drug:"Oseltamivir (Tamiflu)", dose:"≥ 1 yr: 3 mg/kg/dose PO BID × 5 days. Weight-based dosing: < 15 kg = 30 mg BID; 15–23 kg = 45 mg BID; 23–40 kg = 60 mg BID; > 40 kg = 75 mg BID. Neonates ≥ 2 wks: 3 mg/kg/dose BID × 5 days", renal:"CrCl 10–30: reduce dose by 50%. HD: single 30 mg dose after each HD session", ivpo:"PO (suspension 6 mg/mL or capsule)", deesc:"AAP: start ASAP; most benefit < 48h but treat hospitalized patients at ANY time. Chemoprophylaxis: same dose ONCE daily × 10 days for close contacts.", note:"Suspension can be compounded from capsules if 6 mg/mL unavailable. Vomiting: may sprinkle capsule contents on sweetened food.", ref:"AAP 2024–25 / AAP Red Book" },
      { cat:"🅐 Antiviral", drug:"Baloxavir Marboxil (Xofluza)", dose:"≥ 12 yr + < 40 kg: 40 mg PO × 1 dose. ≥ 40 kg: 80 mg PO × 1 dose. FDA-approved ≥ 12 yr; limited data < 12 yr", renal:"No adjustment for mild-mod CKD", ivpo:"PO (single dose)", deesc:"Single-dose convenience advantage. AAP 2024: not recommended routinely over oseltamivir in children < 12 yr. Use in oseltamivir-resistant influenza A (H3N2).", note:"Influenza B reduced susceptibility. Do NOT co-administer with polyvalent cation-containing products (antacids, supplements) — reduces absorption.", ref:"AAP 2024–25" },
      { cat:"🅑 Supportive", drug:"Antipyretics", dose:"Acetaminophen 15 mg/kg PO/PR q4–6h (max 75 mg/kg/day or 4g/day). Ibuprofen 10 mg/kg PO q6–8h (≥ 6 months, max 40 mg/kg/day).", renal:"Avoid ibuprofen in AKI/dehydration", ivpo:"PO / PR", deesc:"AVOID aspirin and aspirin-containing products (Reye syndrome risk in children with influenza or varicella — AAP/CDC absolute contraindication).", note:"AAP: NEVER give aspirin or aspirin-containing products (Pepto-Bismol) to children with influenza.", ref:"AAP / CDC" },
      { cat:"🅒 Prevention", drug:"Influenza Vaccine (AAP Annual)", dose:"< 9 yr (first time vaccine): 2 doses ≥ 4 weeks apart. ≥ 9 yr or previously vaccinated: 1 dose annually. IIV4 any age ≥ 6 mo; LAIV4 healthy children ≥ 2 yr without asthma", renal:"N/A", ivpo:"IM (IIV4) or IN (LAIV4)", deesc:"AAP 2024–25: no preferred formulation — all are acceptable. Administer before influenza season (ideally by end of October). Give simultaneously with other vaccines.", note:"LAIV4 not for: asthma/wheezing, immunocompromised, pregnant, aspirin use, cochlear implant, CSF leak, ages < 2 yr or ≥ 50 yr.", ref:"AAP 2024–25 Red Book" },
    ],
    followup: [
      "Return precautions: secondary bacterial pneumonia 5–10 days post-influenza onset; new fever + worse cough",
      "Complicated influenza: PICU admission; oseltamivir IV (peramivir) if oral not tolerated — 12 mg/kg IV × 1 dose",
      "Chemoprophylaxis for close contacts: immunocompromised, < 6 months, not vaccinated in outbreak settings",
      "Post-discharge oseltamivir completion: complete full 5-day course regardless of symptom improvement",
      "Influenza myocarditis: echocardiogram, cardiology follow-up, activity restriction 3–6 months",
      "Document vaccination status and recommend annual influenza vaccine at next well visit",
    ]
  },

  hfmd: {
    overview: {
      def: "Hand-Foot-Mouth Disease (HFMD): caused primarily by Coxsackievirus A16 and Enterovirus A71 (EV-A71). Most common in children < 5 years; peaks summer-fall. Highly contagious (fecal-oral, respiratory). CLINICAL diagnosis — no testing needed for typical presentation. AAP: treatment is supportive. EV-A71 associated with neurological complications (brainstem encephalitis, acute flaccid paralysis).",
      bullets: [
        "Classic: low-grade fever → painful oral ulcers/vesicles → macular/vesicular rash on hands, feet, buttocks",
        "Herpangina: posterior pharyngeal vesicles/ulcers without hand/foot rash — same enteroviruses",
        "EV-A71 warning signs: persistent fever > 3 days, encephalitis, myoclonic jerks, acute flaccid paralysis — urgent evaluation",
        "AAP: NO antiviral treatment indicated for typical HFMD. No vaccine available in USA (China has EV-A71 vaccine)",
        "Exclusion: AAP recommends children may return to school/daycare once afebrile and oral lesions healed (not just vesicles crusted)",
        "Adult cases increasingly reported — parents/caregivers often co-infected from index child case",
      ]
    },
    workup: [
      { icon:"👁️", label:"Clinical Examination (Diagnosis)", detail:"Examine oral cavity (anterior tonsillar pillars, soft palate, uvula), hands (interdigital spaces, palms), feet (soles), buttocks. Rash is macular then vesicular on erythematous base." },
      { icon:"🌡️", label:"Temperature + Hydration Status", detail:"Primary concern is dehydration from painful oral lesions impairing oral intake. Assess mucous membranes, fontanelle, skin turgor, urine output." },
      { icon:"🧫", label:"Enterovirus PCR (EV-A71 Suspected)", detail:"CSF, throat, rectal, vesicle fluid PCR if neurological symptoms, EV-A71 suspect outbreak, or clinical severity requiring ICU. Not needed for typical HFMD." },
      { icon:"🧠", label:"Neurological Assessment (EV-A71)", detail:"Brainstem encephalitis: myoclonic jerks, limb tremor, ataxia, rapid BP/HR fluctuations. Acute flaccid paralysis: sudden limb weakness. Lumbar puncture if meningism or encephalitis suspected." },
    ],
    treatment: [
      { cat:"🅐 Supportive", drug:"Analgesics + Antipyretics", dose:"Acetaminophen 15 mg/kg PO q4–6h or ibuprofen 10 mg/kg PO q6–8h. Topical analgesia: oral viscous lidocaine 2% applied sparingly with cotton swab (use with caution — toxicity risk in young children)", renal:"Avoid ibuprofen if dehydrated", ivpo:"PO", deesc:"AAP: simple analgesics sufficient. Oral viscous lidocaine: FDA safety warning in children < 2 yr — use only under medical supervision if at all. Benzocaine and combinations: avoid.", note:"Magic mouthwash (equal parts antacid + diphenhydramine ± viscous lidocaine): not recommended AAP for children < 2 yr. Supportive care is definitive.", ref:"AAP / Red Book 2024" },
      { cat:"🅑 Hydration", drug:"Hydration Support", dose:"Cold fluids, cold purees, popsicles — cold reduces pain and encourages intake. IV D5 0.45%NS at maintenance if < 50% oral intake or signs of dehydration", renal:"Standard", ivpo:"PO / IV", deesc:"Hospitalize for IV hydration if unable to maintain oral intake, signs of moderate-severe dehydration, or altered mental status.", note:"Cold foods (ice chips, cold milk, yogurt) preferred during oral phase — temperature-sensitive pain relief without medication. Avoid acidic/salty foods.", ref:"AAP / Red Book 2024" },
      { cat:"🅒 Prevention", drug:"Infection Control (Handwashing)", dose:"Handwashing with soap × 20 sec after diaper changes, before food, after contact with oral secretions. Contact precautions for hospitalized patients. Fomite disinfection.", renal:"N/A", ivpo:"Behavioral", deesc:"AAP: HFMD is highly contagious — fecal-oral transmission for weeks. Surface disinfection with dilute bleach. Swim diaper policy in pools (virus shed in stool).", note:"No proven benefit of antiviral therapy (acyclovir does not cover enteroviruses). No specific antiviral exists for EV-A71 in USA.", ref:"AAP / CDC 2024" },
    ],
    followup: [
      "AAP: child may return to school/daycare once afebrile AND mouth sores have healed — no need to wait for hand/foot rash to fully resolve",
      "HFMD is a reportable condition in some states during outbreaks — check local health department requirements",
      "Nail shedding (onychomadesis): may occur 4–8 weeks after HFMD — benign, self-limited; reassure parents",
      "EV-A71 neurological complications: PICU admission, supportive care, monitor for autonomic dysfunction and pulmonary edema",
      "Persistent fever > 3 days or new neurological symptoms: re-evaluate immediately for EV-A71 complications",
      "Siblings and parents with symptoms: same supportive care; exclude from work/daycare if febrile with lesions",
    ]
  }
};

// ── Broselow Zone Table Component ─────────────────────────────────
function BroselowTable() {
  const [sel, setSel] = useState(null);
  const z = sel !== null ? BROSELOW[sel] : null;
  return (
    <div className="fade-in">
      <div style={{fontFamily:"JetBrains Mono",fontSize:11,color:T.gold,textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>COLOR ZONE SELECTOR · CLICK ZONE TO VIEW DOSING</div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:18}}>
        {BROSELOW.map((b,i)=>(
          <button key={i} onClick={()=>setSel(sel===i?null:i)} style={{padding:"8px 14px",borderRadius:10,border:`1.5px solid ${sel===i?b.color:"rgba(42,79,122,0.3)"}`,background:sel===i?`${b.color}25`:"rgba(14,37,68,0.7)",cursor:"pointer",transition:"all .2s",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
            <div style={{width:20,height:20,borderRadius:"50%",background:b.color,border:"2px solid rgba(255,255,255,0.2)",boxShadow:`0 0 ${sel===i?"12px":"4px"} ${b.color}80`}}/>
            <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:sel===i?b.color:T.txt3,fontWeight:sel===i?700:400}}>{b.name}</span>
            <span style={{fontFamily:"DM Sans",fontSize:9,color:T.txt4}}>{b.wt}</span>
          </button>
        ))}
      </div>
      {z && (
        <div className="fade-in" style={{background:`linear-gradient(135deg,${z.color}12,rgba(8,22,40,0.9))`,border:`1px solid ${z.color}55`,borderRadius:16,padding:"18px 20px"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
            <div style={{width:36,height:36,borderRadius:"50%",background:z.color,boxShadow:`0 0 16px ${z.color}80`,flexShrink:0}}/>
            <div>
              <div style={{fontFamily:"Playfair Display",fontSize:20,fontWeight:700,color:T.txt}}>{z.name} Zone — {z.wt}</div>
              <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt3}}>Approximate age: {z.age}</div>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10}}>
            {[
              {label:"ETT Size",val:z.ett,icon:"🫁"},{label:"ETT Depth",val:z.depth,icon:"📏"},{label:"Laryngoscope",val:z.blade,icon:"🔦"},
              {label:"Defibrillation",val:z.defib,icon:"⚡"},{label:"Epinephrine (1:10k)",val:z.epi,icon:"💉"},{label:"Atropine",val:z.atropine,icon:"💊"},
              {label:"Adenosine",val:z.adenosine,icon:"❤️"},{label:"Albuterol",val:z.albuterol,icon:"🫁"},{label:"Dextrose",val:z.dextrose,icon:"🍬"},
              {label:"Midazolam IV",val:z.versed,icon:"😴"},{label:"Fluid Bolus (20mL/kg)",val:z.fluid,icon:"💧"},
            ].map((item,i)=>(
              <div key={i} style={{background:"rgba(8,22,40,0.75)",backdropFilter:"blur(12px)",border:"1px solid rgba(42,79,122,0.4)",borderRadius:10,padding:"10px 14px"}}>
                <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>{item.icon} {item.label}</div>
                <div style={{fontFamily:"JetBrains Mono",fontSize:12,fontWeight:700,color:z.color}}>{item.val}</div>
              </div>
            ))}
          </div>
          <div style={{marginTop:14,padding:"10px 14px",background:"rgba(245,200,66,0.08)",border:"1px solid rgba(245,200,66,0.2)",borderRadius:10,fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.6}}>
            ⚠ <strong style={{color:T.gold}}>For obese children:</strong> Use IBW for most drug dosing. ETT and airway equipment sized by physical exam. Broselow is height-based and will underestimate weight in obese pediatric patients.
          </div>
        </div>
      )}
    </div>
  );
}

// ── Weight-Based Dosing Calculator ─────────────────────────────────
function WeightCalc({ condColor }) {
  const [wt, setWt] = useState("");
  const w = parseFloat(wt);
  const valid = !isNaN(w) && w > 0 && w <= 80;
  const drugs = [
    { name:"Epinephrine 1:10,000 (IV/IO)", dose: v => `${(v*0.01).toFixed(2)} mg (${(v*0.1).toFixed(1)} mL)`, max:"1 mg" },
    { name:"Atropine IV", dose: v => `${Math.max(0.1,Math.min(0.5,v*0.02)).toFixed(2)} mg`, max:"0.5 mg (child)" },
    { name:"Adenosine 1st dose", dose: v => `${Math.min(6,v*0.1).toFixed(1)} mg`, max:"6 mg" },
    { name:"Amiodarone (VF/pVT)", dose: v => `${Math.min(300,v*5).toFixed(0)} mg`, max:"300 mg/dose" },
    { name:"Lorazepam (seizure)", dose: v => `${Math.min(4,v*0.1).toFixed(2)} mg`, max:"4 mg" },
    { name:"Midazolam IN", dose: v => `${Math.min(10,v*0.2).toFixed(1)} mg`, max:"10 mg" },
    { name:"Albuterol neb", dose: v => `${v < 20 ? "2.5 mg" : "5 mg"}`, max:"5 mg" },
    { name:"Methylprednisolone IV", dose: v => `${Math.min(125,v*2).toFixed(0)} mg`, max:"125 mg" },
    { name:"Dexamethasone PO/IM", dose: v => `${Math.min(16,v*0.6).toFixed(1)} mg`, max:"16 mg" },
    { name:"MgSO₄ IV (asthma)", dose: v => `${Math.min(2000,v*50).toFixed(0)} mg (${Math.min(4,v*0.1).toFixed(1)} mL 50%)`, max:"2 g" },
    { name:"Ceftriaxone IV", dose: v => `${Math.min(4000,v*100).toFixed(0)} mg`, max:"4 g" },
    { name:"Vancomycin IV", dose: v => `${Math.min(750,v*15).toFixed(0)} mg`, max:"750 mg/dose" },
    { name:"Ondansetron IV/PO", dose: v => `${v < 15 ? "2 mg" : v < 30 ? "4 mg" : "8 mg"}`, max:"8 mg" },
    { name:"Acetaminophen PO/PR", dose: v => `${Math.min(1000,v*15).toFixed(0)} mg`, max:"1,000 mg" },
    { name:"Ibuprofen PO", dose: v => `${Math.min(600,v*10).toFixed(0)} mg`, max:"600 mg" },
    { name:"Fluid Bolus NS/LR (20 mL/kg)", dose: v => `${(v*20).toFixed(0)} mL`, max:"~500 mL" },
    { name:"Mannitol 20% (cerebral edema)", dose: v => `${Math.min(100,v*0.5).toFixed(0)}–${Math.min(200,v*1).toFixed(0)} mL of 20%`, max:"~100 mL initial" },
    { name:"Oseltamivir (if < 15 kg)", dose: v => v < 15 ? "30 mg BID" : v < 23 ? "45 mg BID" : v < 40 ? "60 mg BID" : "75 mg BID", max:"75 mg BID" },
  ];
  return (
    <div style={{padding:"16px 0"}}>
      <div style={{fontFamily:"JetBrains Mono",fontSize:11,color:T.green,textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>WEIGHT-BASED DRUG CALCULATOR</div>
      <div style={{display:"flex",gap:10,marginBottom:14,alignItems:"center"}}>
        <input type="number" min="1" max="80" placeholder="Enter weight (kg)…" value={wt} onChange={e=>setWt(e.target.value)} style={{flex:1,background:"rgba(14,37,68,0.8)",border:`1px solid ${wt&&valid?condColor:"rgba(42,79,122,0.5)"}`,borderRadius:10,padding:"10px 14px",color:T.txt,fontFamily:"JetBrains Mono",fontSize:14,outline:"none",transition:"border-color .2s"}}/>
        <button onClick={()=>setWt("")} style={{padding:"10px 14px",borderRadius:10,background:"rgba(255,107,107,0.15)",border:"1px solid rgba(255,107,107,0.3)",color:T.coral,fontFamily:"DM Sans",cursor:"pointer",fontSize:12}}>Clear</button>
      </div>
      {valid && (
        <div className="fade-in">
          <div style={{fontFamily:"DM Sans",fontSize:13,color:T.txt2,marginBottom:12}}>
            Dosing for <strong style={{color:condColor}}>{w} kg</strong> patient:
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:8}}>
            {drugs.map((d,i)=>(
              <div key={i} style={{background:"rgba(8,22,40,0.75)",backdropFilter:"blur(12px)",border:"1px solid rgba(42,79,122,0.3)",borderRadius:10,padding:"10px 14px",display:"flex",flexDirection:"column",gap:3}}>
                <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2}}>{d.name}</div>
                <div style={{fontFamily:"JetBrains Mono",fontSize:14,fontWeight:700,color:condColor}}>{d.dose(w)}</div>
                <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4}}>max: {d.max}</div>
              </div>
            ))}
          </div>
          <div style={{marginTop:14,padding:"10px 14px",background:"rgba(59,158,255,0.08)",border:"1px solid rgba(59,158,255,0.25)",borderRadius:10,fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.6}}>
            💡 For full pharmacopeia, complete dosing tables, IV preparation guides, and renal adjustments → <strong style={{color:T.blue}}>Medication Reference</strong> in the Notrya navigation bar.
          </div>
        </div>
      )}
    </div>
  );
}

// ── DrugRow Component ──────────────────────────────────────────────
function DrugRow({ d, color }) {
  const [open, setOpen] = useState(null);
  const panels = [
    { id:0, icon:"📋", label:"Dose & Route", content:<><b style={{color:T.txt2}}>Dose: </b>{d.dose}<br/><br/><b style={{color:T.txt2}}>Route: </b>{d.ivpo}<br/><br/><b style={{color:T.txt2}}>Renal: </b>{d.renal}</> },
    { id:1, icon:"🔧", label:"Alt / Setup", content:<><b style={{color:T.txt2}}>Step-Down / Alt: </b>{d.deesc}<br/><br/><b style={{color:T.txt2}}>Clinical Note: </b>{d.note}</> },
    { id:2, icon:"📚", label:"Reference", content:<><b style={{color:T.txt2}}>Source: </b>{d.ref}</> },
  ];
  return (
    <div style={{marginBottom:10,borderRadius:12,overflow:"hidden",border:`1px solid ${open!==null?color+"66":"rgba(42,79,122,0.3)"}`,background:"rgba(8,22,40,0.6)",transition:"border-color .2s"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",background:open!==null?`linear-gradient(90deg,${color}18,transparent)`:"transparent"}}>
        <span style={{fontFamily:"JetBrains Mono",fontSize:11,color:color,background:`${color}22`,padding:"2px 8px",borderRadius:4,whiteSpace:"nowrap"}}>{d.cat}</span>
        <span style={{fontFamily:"DM Sans",fontWeight:600,color:T.txt,flex:1,fontSize:14}}>{d.drug}</span>
        <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.txt3}}>{d.ref?.split("/")[0]}</span>
      </div>
      <div style={{padding:"4px 16px 10px",display:"flex",gap:8,flexWrap:"wrap"}}>
        {panels.map(p=>(
          <button key={p.id} onClick={()=>setOpen(open===p.id?null:p.id)} style={{fontFamily:"DM Sans",fontSize:12,padding:"5px 12px",borderRadius:6,border:`1px solid ${open===p.id?color+"99":"rgba(42,79,122,0.4)"}`,background:open===p.id?`${color}22`:"rgba(14,37,68,0.8)",color:open===p.id?color:T.txt2,cursor:"pointer",fontWeight:open===p.id?600:400,transition:"all .15s"}}>
            {p.icon} {p.label}
          </button>
        ))}
      </div>
      {open !== null && (
        <div className="fade-in" style={{margin:"0 16px 14px",padding:14,background:"rgba(5,15,30,0.7)",borderRadius:10,border:`1px solid ${color}33`,fontFamily:"DM Sans",fontSize:13,color:T.txt2,lineHeight:1.7}}>
          {panels[open].content}
        </div>
      )}
    </div>
  );
}

// ── Tab Views ──────────────────────────────────────────────────────
function OverviewTab({ ov }) {
  return (
    <div className="fade-in">
      <div style={{background:"rgba(14,37,68,0.5)",border:"1px solid rgba(42,79,122,0.3)",borderRadius:14,padding:"18px 20px",marginBottom:14}}>
        <div style={{fontFamily:"JetBrains Mono",fontSize:11,color:T.teal,textTransform:"uppercase",letterSpacing:2,marginBottom:10}}>DEFINITION & CONTEXT</div>
        <p style={{fontFamily:"DM Sans",fontSize:14,color:T.txt,lineHeight:1.8}}>{ov.def}</p>
      </div>
      <div style={{background:"rgba(14,37,68,0.5)",border:"1px solid rgba(42,79,122,0.3)",borderRadius:14,padding:"18px 20px"}}>
        <div style={{fontFamily:"JetBrains Mono",fontSize:11,color:T.teal,textTransform:"uppercase",letterSpacing:2,marginBottom:14}}>CLINICAL PEARLS</div>
        {ov.bullets.map((b,i)=>(
          <div key={i} style={{display:"flex",gap:12,marginBottom:12,alignItems:"flex-start"}}>
            <span style={{color:T.teal,fontFamily:"JetBrains Mono",fontSize:13,minWidth:18}}>▸</span>
            <span style={{fontFamily:"DM Sans",fontSize:13.5,color:T.txt2,lineHeight:1.65}}>{b}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WorkupTab({ wk }) {
  return (
    <div className="fade-in">
      <div style={{fontFamily:"JetBrains Mono",fontSize:11,color:T.gold,textTransform:"uppercase",letterSpacing:2,marginBottom:14}}>DIAGNOSTIC WORKUP</div>
      {wk.map((item,i)=>(
        <div key={i} style={{display:"flex",gap:12,padding:"13px 16px",background:"rgba(14,37,68,0.5)",border:"1px solid rgba(42,79,122,0.25)",borderRadius:12,marginBottom:8,alignItems:"flex-start"}}>
          <span style={{fontSize:20,minWidth:30}}>{item.icon}</span>
          <div>
            <div style={{fontFamily:"DM Sans",fontWeight:600,color:T.txt,fontSize:14,marginBottom:4}}>{item.label}</div>
            <div style={{fontFamily:"DM Sans",fontSize:13,color:T.txt2,lineHeight:1.6}}>{item.detail}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function FollowupTab({ fu }) {
  return (
    <div className="fade-in">
      <div style={{fontFamily:"JetBrains Mono",fontSize:11,color:T.purple,textTransform:"uppercase",letterSpacing:2,marginBottom:14}}>DISPOSITION & FOLLOW-UP</div>
      {fu.map((item,i)=>(
        <div key={i} style={{display:"flex",gap:14,padding:"12px 16px",background:"rgba(14,37,68,0.5)",border:"1px solid rgba(42,79,122,0.25)",borderRadius:12,marginBottom:8}}>
          <span style={{fontFamily:"JetBrains Mono",fontSize:12,color:T.purple,minWidth:24}}>{String(i+1).padStart(2,"0")}</span>
          <span style={{fontFamily:"DM Sans",fontSize:13.5,color:T.txt2,lineHeight:1.65}}>{item}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────
export default function PedsHub() {
  const navigate = useNavigate();
  const [sel, setSel] = useState("pals");
  const [tab, setTab] = useState("overview");
  const [filter, setFilter] = useState("All");
  const cond = CONDITIONS.find(c => c.id === sel);
  const data = DATA[sel];
  const filtered = filter === "All" ? CONDITIONS : CONDITIONS.filter(c => c.cat === filter);

  const tabs = useMemo(() => {
    const base = [
      { id:"overview",  label:"Overview",  icon:"📖" },
      { id:"workup",    label:"Workup",    icon:"🔬" },
      { id:"protocol",  label:"Protocol",  icon:"💉" },
      { id:"followup",  label:"Follow-up", icon:"📋" },
    ];
    if (sel === "broselow") return [
      { id:"overview",  label:"Overview",  icon:"📖" },
      { id:"tape",      label:"Color Zones",icon:"📏" },
      { id:"dosecalc",  label:"Dose Calc", icon:"🧮" },
    ];
    return base;
  }, [sel]);

  const glass = { backdropFilter:"blur(24px) saturate(200%)", WebkitBackdropFilter:"blur(24px) saturate(200%)", background:"rgba(8,22,40,0.75)", border:"1px solid rgba(42,79,122,0.35)", borderRadius:16 };

  const handleSelect = (id) => { setSel(id); setTab(id==="broselow"?"overview":"overview"); };

  return (
    <div style={{ fontFamily:"DM Sans", background:T.bg, minHeight:"100vh", position:"relative", overflow:"hidden" }}>
      {/* Ambient BG */}
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}>
        <div style={{position:"absolute",top:"-15%",left:"-10%",width:"55%",height:"55%",background:`radial-gradient(circle,${cond.color}16 0%,transparent 70%)`,transition:"background 1.2s ease"}}/>
        <div style={{position:"absolute",bottom:"-20%",right:"-5%",width:"45%",height:"45%",background:"radial-gradient(circle,rgba(0,212,255,0.1) 0%,transparent 70%)"}}/>
      </div>

      <div style={{position:"relative",zIndex:1,maxWidth:1240,margin:"0 auto",padding:"0 16px"}}>

        {/* Header */}
        <div style={{padding:"22px 0 14px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
            <div style={{backdropFilter:"blur(40px)",WebkitBackdropFilter:"blur(40px)",background:"rgba(5,15,30,0.85)",border:"1px solid rgba(26,53,85,0.6)",borderRadius:10,padding:"5px 12px",display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.teal,letterSpacing:3}}>NOTRYA</span>
              <span style={{color:T.txt4,fontFamily:"JetBrains Mono",fontSize:10}}>/</span>
              <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.txt3,letterSpacing:2}}>PEDIATRICS</span>
            </div>
            <div style={{height:1,flex:1,background:"linear-gradient(90deg,rgba(42,79,122,0.6),transparent)"}}/>
            <button onClick={()=>navigate("/MedicationReference")} style={{background:"none",border:"none",padding:0,cursor:"pointer"}}>
              <div style={{backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",background:"rgba(59,158,255,0.12)",border:"1px solid rgba(59,158,255,0.4)",borderRadius:10,padding:"6px 14px",display:"flex",alignItems:"center",gap:6,transition:"all .2s"}}>
                <span style={{fontSize:14}}>💊</span>
                <span style={{fontFamily:"DM Sans",fontWeight:600,fontSize:12,color:T.blue}}>Medication Reference</span>
              </div>
            </button>
          </div>
          <h1 className="shimmer-text" style={{fontFamily:"Playfair Display",fontSize:"clamp(26px,5vw,44px)",fontWeight:900,letterSpacing:-1,lineHeight:1.1}}>
            Pediatric Emergency Hub
          </h1>
          <p style={{fontFamily:"DM Sans",fontSize:13,color:T.txt3,marginTop:5,letterSpacing:.3}}>PALS · NRP · Broselow Tape · AAP / ACEP Evidence-Based Protocols</p>
        </div>

        {/* Banner */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:10,marginBottom:18}}>
          {BANNER.map((b,i)=>(
            <div key={i} style={{...glass,padding:"13px 16px",borderLeft:`3px solid ${b.color}`,background:`linear-gradient(135deg,${b.color}12,rgba(8,22,40,0.8))`}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:18,fontWeight:700,color:b.color}}>{b.value}</div>
              <div style={{fontFamily:"DM Sans",fontWeight:600,color:T.txt,fontSize:12,margin:"2px 0"}}>{b.label}</div>
              <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt3}}>{b.sub}</div>
            </div>
          ))}
        </div>

        {/* Layout */}
        <div style={{display:"flex",gap:14,flexWrap:"wrap",paddingBottom:32}}>

          {/* Sidebar */}
          <div style={{width:256,flexShrink:0}}>
            <div style={{...glass,padding:"8px",marginBottom:10,display:"flex",gap:4}}>
              {CATS.map(c=>(
                <button key={c} onClick={()=>setFilter(c)} style={{flex:1,fontFamily:"DM Sans",fontWeight:600,fontSize:10,padding:"6px 4px",borderRadius:8,border:`1px solid ${filter===c?"rgba(42,79,122,0.8)":"transparent"}`,background:filter===c?"rgba(14,37,68,0.9)":"transparent",color:filter===c?T.txt:T.txt3,cursor:"pointer",transition:"all .15s"}}>
                  {c}
                </button>
              ))}
            </div>
            <div style={{...glass,padding:8,overflowY:"auto",maxHeight:"calc(100vh - 300px)"}}>
              {filtered.map(c=>(
                <div key={c.id} className="peds-cond" onClick={()=>handleSelect(c.id)}
                  style={{position:"relative",padding:"10px 12px",borderRadius:10,marginBottom:3,background:sel===c.id?`linear-gradient(90deg,${c.gl},rgba(14,37,68,0.5))`:"transparent",border:`1px solid ${sel===c.id?c.br:"transparent"}`,cursor:"pointer",transition:"background .2s,border .2s"}}>
                  {sel===c.id && <div style={{position:"absolute",left:0,top:"15%",height:"70%",width:2,background:c.color,borderRadius:2,boxShadow:`0 0 8px ${c.color}`}}/>}
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <span style={{fontSize:16}}>{c.icon}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontFamily:"DM Sans",fontWeight:600,fontSize:12,color:sel===c.id?T.txt:T.txt2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.title}</div>
                      <div style={{fontFamily:"DM Sans",fontSize:10,color:T.txt3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.sub}</div>
                    </div>
                    <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:c.color,background:`${c.color}22`,padding:"1px 5px",borderRadius:3,whiteSpace:"nowrap"}}>{c.cat}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Panel */}
          <div style={{flex:1,minWidth:0}}>
            {/* Cond header */}
            <div style={{...glass,padding:"16px 20px",marginBottom:12,background:`linear-gradient(135deg,${cond.gl},rgba(8,22,40,0.85))`,borderColor:cond.br,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:-20,right:-20,fontSize:100,opacity:.05}}>{cond.icon}</div>
              <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                <span style={{fontSize:34}}>{cond.icon}</span>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:2}}>
                    <h2 style={{fontFamily:"Playfair Display",fontSize:"clamp(16px,2.5vw,24px)",fontWeight:700,color:T.txt}}>{cond.title}</h2>
                    <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:cond.color,background:`${cond.color}22`,padding:"2px 7px",borderRadius:4,border:`1px solid ${cond.color}44`}}>{cond.cat}</span>
                  </div>
                  <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2}}>{cond.sub}</div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div style={{...glass,padding:"8px",display:"flex",gap:5,marginBottom:12,flexWrap:"wrap"}}>
              {tabs.map(t=>(
                <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:"1 1 auto",fontFamily:"DM Sans",fontWeight:600,fontSize:11,padding:"8px 6px",borderRadius:10,border:`1px solid ${tab===t.id?cond.color+"66":"transparent"}`,background:tab===t.id?`linear-gradient(135deg,${cond.color}22,${cond.color}11)`:"transparent",color:tab===t.id?cond.color:T.txt3,cursor:"pointer",textAlign:"center",transition:"all .15s",whiteSpace:"nowrap"}}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div style={{...glass,padding:"20px",minHeight:400,overflowY:"auto",maxHeight:"calc(100vh - 380px)"}}>
              {tab === "overview"  && data && <OverviewTab ov={data.overview}/>}
              {tab === "workup"    && data && data.workup.length > 0 && <WorkupTab wk={data.workup}/>}
              {tab === "workup"    && data && data.workup.length === 0 && <div style={{fontFamily:"DM Sans",color:T.txt3,textAlign:"center",padding:32}}>Use the Color Zones tab for Broselow equipment and drug reference.</div>}
              {tab === "protocol"  && data && data.treatment.length > 0 && (
                <div className="fade-in">
                  <div style={{fontFamily:"JetBrains Mono",fontSize:11,color:T.orange,textTransform:"uppercase",letterSpacing:2,marginBottom:14}}>TREATMENT PROTOCOL</div>
                  {data.treatment.map((d,i)=><DrugRow key={i} d={d} color={cond.color}/>)}
                </div>
              )}
              {tab === "followup"  && data && <FollowupTab fu={data.followup}/>}
              {tab === "tape"      && <BroselowTable/>}
              {tab === "dosecalc"  && <WeightCalc condColor={cond.color}/>}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{textAlign:"center",paddingBottom:20}}>
          <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.txt4,letterSpacing:2}}>NOTRYA PEDIATRIC HUB · AAP / ACEP / AHA GUIDELINES · ALL DOSING IS A GUIDE — VERIFY CLINICALLY</span>
        </div>
      </div>
    </div>
  );
}