/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║           NOTRYA CLINICAL HUB — AIRWAY HUB                  ║
 * ║           RSI · Difficult Airway · Ventilator Management     ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { useState, useCallback, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";

const HUB_CONFIG = {
  name:        "Airway Hub",
  subtitle:    "RSI · Difficult Airway · Post-Intubation · Ventilator Management · Extubation",
  icon:        "🌬️",
  accentColor: "#3b9eff",
  badgeText:   "Clinical Guidelines",
  description: "Comprehensive airway management protocols covering rapid sequence intubation, difficult airway algorithms, video laryngoscopy, surgical airway, post-intubation care, lung-protective ventilation, and safe extubation criteria for the emergency and critical care physician.",
  evidenceBase: [
    "Difficult Airway Society (DAS) Guidelines 2015 — updated 2022",
    "NAEMSP/ACEP RSI Consensus Guidelines 2023",
    "ARDS Network — ARDSnet Ventilation Protocol",
    "Brain Trauma Foundation 4th Ed — 2023 Ventilation Targets",
    "ACEP Clinical Policy — Emergency Airway Management 2023",
    "Higgs et al., Anaesthesia 2018 — DAS Airway Management Guidelines",
  ],
};

const CATEGORIES = [
  "RSI",
  "Difficult Airway",
  "Surgical Airway",
  "Post-Intubation",
  "Ventilator Management",
];

const CONDITIONS = [
  {
    id: "rsi_protocol",
    icon: "💉",
    title: "Rapid Sequence Intubation",
    subtitle: "7 Ps of RSI · Drug selection · Dose-weight-based",
    acog: "NAEMSP 2023",
    incidence: "Most common emergency airway",
    severity: "First-pass success critical — failure escalates to CICO rapidly",
    category: "RSI",
    color: "#3b9eff", glass: "rgba(59,158,255,0.07)", border: "rgba(59,158,255,0.28)", accent: "#6ab8ff",
  },
  {
    id: "drug_selection",
    icon: "💊",
    title: "RSI Drug Selection",
    subtitle: "Induction agents · Paralytics · Premedication",
    acog: "ACEP 2023",
    incidence: "Universal RSI component",
    severity: "Drug choice critically affects haemodynamics and intubation conditions",
    category: "RSI",
    color: "#9b6dff", glass: "rgba(155,109,255,0.07)", border: "rgba(155,109,255,0.28)", accent: "#b99bff",
  },
  {
    id: "difficult_airway",
    icon: "⚠️",
    title: "Difficult Airway Algorithm",
    subtitle: "LEMON · DAS Guidelines · Unanticipated difficulty",
    acog: "DAS 2022",
    incidence: "1–4% of emergency intubations",
    severity: "Unanticipated difficult airway — second-most common cause of anaesthesia death",
    category: "Difficult Airway",
    color: "#f5c842", glass: "rgba(245,200,66,0.07)", border: "rgba(245,200,66,0.28)", accent: "#f7d875",
  },
  {
    id: "video_laryngoscopy",
    icon: "📷",
    title: "Video Laryngoscopy",
    subtitle: "Channelled vs non-channelled · Technique · Failure modes",
    acog: "DAS 2022",
    incidence: "Now first-line in most settings",
    severity: "Improves Cormack-Lehane grade — does not guarantee intubation success",
    category: "Difficult Airway",
    color: "#00e5c0", glass: "rgba(0,229,192,0.07)", border: "rgba(0,229,192,0.28)", accent: "#33eccc",
  },
  {
    id: "cico",
    icon: "🚨",
    title: "CICO — Cannot Intubate Cannot Oxygenate",
    subtitle: "Emergency front of neck access · eFONA",
    acog: "DAS 2015",
    incidence: "1 in 50,000 — catastrophic if not managed",
    severity: "Brain death within 3–5 min if CICO not recognised and treated immediately",
    category: "Surgical Airway",
    color: "#ff6b6b", glass: "rgba(255,107,107,0.07)", border: "rgba(255,107,107,0.28)", accent: "#ff9999",
  },
  {
    id: "cricothyroidotomy",
    icon: "✂️",
    title: "Surgical Cricothyroidotomy",
    subtitle: "Landmark technique · Seldinger · Scalpel-finger-bougie",
    acog: "DAS / ATLS",
    incidence: "Last-resort emergency airway",
    severity: "Life-saving in CICO — delay is fatal. Decision must be made early.",
    category: "Surgical Airway",
    color: "#ff9f43", glass: "rgba(255,159,67,0.07)", border: "rgba(255,159,67,0.28)", accent: "#ffb76b",
  },
  {
    id: "post_intubation",
    icon: "🏥",
    title: "Post-Intubation Management",
    subtitle: "Confirmation · Sedation · Analgesia · Positioning",
    acog: "ACEP / Critical Care",
    incidence: "Mandatory for all intubated patients",
    severity: "Post-intubation hypotension occurs in 25–35% — prevention starts before induction",
    category: "Post-Intubation",
    color: "#00e5c0", glass: "rgba(0,229,192,0.07)", border: "rgba(0,229,192,0.28)", accent: "#33eccc",
  },
  {
    id: "ventilator_basics",
    icon: "🫁",
    title: "Ventilator Setup & Management",
    subtitle: "Initial settings · Mode selection · Lung-protective strategy",
    acog: "ARDSnet / BTF",
    incidence: "All intubated patients",
    severity: "Volutrauma and barotrauma cause VILI — lung-protective strategy mandatory",
    category: "Ventilator Management",
    color: "#3b9eff", glass: "rgba(59,158,255,0.07)", border: "rgba(59,158,255,0.28)", accent: "#6ab8ff",
  },
  {
    id: "ards_management",
    icon: "💨",
    title: "ARDS Ventilation Protocol",
    subtitle: "ARDSnet · Low TV · High PEEP · Prone positioning",
    acog: "ARDSnet 2000",
    incidence: "10% of ICU admissions",
    severity: "Mortality 30–45% — lung-protective ventilation reduces mortality by 22%",
    category: "Ventilator Management",
    color: "#9b6dff", glass: "rgba(155,109,255,0.07)", border: "rgba(155,109,255,0.28)", accent: "#b99bff",
  },
  {
    id: "extubation",
    icon: "🔓",
    title: "Extubation Protocol",
    subtitle: "Readiness criteria · SBT · High-risk extubation",
    acog: "ATS/ACCP",
    incidence: "All intubated patients",
    severity: "Re-intubation rate 10–15% — high-risk features require planned extubation strategy",
    category: "Post-Intubation",
    color: "#f5c842", glass: "rgba(245,200,66,0.07)", border: "rgba(245,200,66,0.28)", accent: "#f7d875",
  },
];

const TIME_TARGETS = [
  { icon:"⏱", label:"Preoxygenation",     target:"3–5 min",    color:"#3b9eff" },
  { icon:"💉", label:"Induction to tube",  target:"45–60 sec",  color:"#ff9f43" },
  { icon:"✅", label:"Confirm ETT (EtCO₂)",target:"< 2 min",    color:"#00e5c0" },
  { icon:"🚨", label:"CICO → eFONA",       target:"< 3 min",    color:"#ff6b6b" },
];

const CLINICAL_DATA = {
  rsi_protocol: {
    definition: "Rapid Sequence Intubation (RSI) is the simultaneous administration of an induction agent and a neuromuscular blocking agent to achieve rapid unconsciousness and paralysis, facilitating definitive airway placement while minimising aspiration risk. The 7 Ps of RSI provide a systematic framework: Preparation, Preoxygenation, Pretreatment (optional), Paralysis + Induction, Positioning, Placement with proof, Post-intubation management.",
    keyCriteria: [
      "1 — Preparation: Equipment (ETT sizes, laryngoscope, suction, BVM, surgical airway kit), IV/IO access, monitoring, drugs drawn",
      "2 — Preoxygenation: 100% O₂ for 3–5 min (NRB mask + HFNC simultaneous). Target SpO₂ >95% before induction. Apnoeic oxygenation during laryngoscopy.",
      "3 — Pretreatment (3 min before): Fentanyl 3 mcg/kg IV (blunts sympathetic surge); Lidocaine 1.5 mg/kg IV (bronchospasm, TBI). Optional in most emergency RSI.",
      "4 — Paralysis + Induction: Induction agent + NMB administered simultaneously",
      "5 — Positioning: Ear-to-sternal-notch alignment (ramped position for obese). Sniffing position for standard. Semi-recumbent 20–30° for aspiration risk.",
      "6 — Placement with proof: Video laryngoscopy first-line. Waveform EtCO₂ ≥6 waveforms = gold standard. Bilateral auscultation + CXR.",
      "7 — Post-intubation management: Sedation + analgesia infusions, target SpO₂ 94–98%, EtCO₂ 35–45, normotension",
    ],
    workup: [
      { icon:"🔍", label:"LEMON Assessment (pre-RSI)", detail:"L — Look externally (facial trauma, obesity, short neck). E — Evaluate 3-3-2 rule (mouth opening ≥3 fingers, hyoid-chin ≥3 fingers, hyoid-thyroid notch ≥2 fingers). M — Mallampati (I–IV). O — Obstruction (mass, haematoma, stridor). N — Neck mobility (C-spine precautions, ankylosing spondylitis)." },
      { icon:"🫁", label:"Preoxygenation — Dual Strategy", detail:"Non-rebreather mask at 15 L/min + HFNC at 30–60 L/min simultaneously. Both together outperform either alone. 3–5 min target: EtO₂ >90% (end-tidal O₂ monitoring). Apnoeic oxygenation (HFNC at 15 L/min) during laryngoscopy extends safe apnoea time." },
      { icon:"💉", label:"IV/IO Access + Medications Drawn", detail:"Minimum 1 reliable IV or IO. Pre-drawn: induction agent, NMB, vasopressor (push-dose epinephrine 10–20 mcg/mL) for post-intubation hypotension, sedation infusion. Flush syringe for rapid drug delivery." },
      { icon:"📊", label:"Monitoring + Equipment Check", detail:"Continuous SpO₂ (waveform), EtCO₂, ECG, NIBP q2 min. ETT size (7.0–7.5 female / 7.5–8.0 male). Stylet, 10 mL syringe, tape/holder. BVM assembled. Suction (Yankauer) on and tested. Video laryngoscope checked." },
      { icon:"🩺", label:"STOP! SMART Check Before Induction", detail:"Suction ON. Team ready. O₂ flowing. Position correct. Monitor attached. Rescue plan confirmed (surgical airway kit open, LMA available, backup operator identified)." },
    ],
    treatment: [
      { cat:"Induction", drug:"Ketamine (preferred)", dose:"1.5–2 mg/kg IV (haemodynamically unstable) or 1–2 mg/kg IV (stable). Onset 45–60 sec.", note:"Maintains sympathetic tone — preferred in hypotension, shock, bronchospasm, trauma. Does NOT raise ICP with positive pressure ventilation (ATLS 11th Ed). Dissociative state.", ref:"Level A" },
      { cat:"Induction", drug:"Etomidate", dose:"0.3 mg/kg IV. Onset 15–45 sec.", note:"Haemodynamically neutral. Causes adrenal suppression (single dose clinically debated). Avoid in sepsis (controversial) and adrenal insufficiency.", ref:"Level B" },
      { cat:"Induction", drug:"Propofol", dose:"1–2 mg/kg IV (reduce to 0.5 mg/kg in elderly/haemodynamically unstable). Onset 30–45 sec.", note:"Causes significant hypotension — avoid if SBP <100 mmHg. Best bronchodilation. Use in haemodynamically stable patients.", ref:"Level B" },
      { cat:"Paralytic — Preferred", drug:"Succinylcholine", dose:"1.5 mg/kg IV. Onset 45 sec. Duration 8–12 min.", note:"Ultra-short acting — allows rapid return of spontaneous ventilation if intubation fails. Contraindications: >24h post-burn, crush/denervation, spinal cord injury, hyperkalaemia, personal/family history malignant hyperthermia.", ref:"Level A" },
      { cat:"Paralytic — Alternative", drug:"Rocuronium", dose:"1.2 mg/kg IV (RSI dose). Onset 60 sec. Duration 60–90 min.", note:"Fully reversible with sugammadex 16 mg/kg IV. PREFERRED when succinylcholine contraindicated. Use high-dose (1.6 mg/kg) for faster onset. Sugammadex must be immediately available.", ref:"Level A" },
      { cat:"Push-Dose Vasopressor", drug:"Epinephrine (push-dose)", dose:"10–20 mcg IV bolus q2–5 min for post-intubation hypotension", note:"Prepared as: 1 mL of 1:10,000 epi (0.1 mg) in 9 mL NS = 10 mcg/mL. Give 1–2 mL (10–20 mcg) per bolus. Prevents post-intubation cardiac arrest.", ref:"Level B" },
    ],
    followup: [
      "Confirm ETT: waveform EtCO₂ ≥6 waveforms is gold standard. Bilateral auscultation. Post-intubation CXR (ETT tip 2–3 cm above carina).",
      "Post-intubation vitals within 2 min: BP, HR, SpO₂. Treat hypotension immediately (push-dose epi + IV fluid bolus + vasopressor infusion).",
      "Start sedation + analgesia: propofol 1–3 mg/kg/h OR midazolam 0.02–0.1 mg/kg/h + fentanyl 25–100 mcg/h. Target RASS −2 to −1.",
      "Initial ventilator settings: TV 6–8 mL/kg IBW, PEEP 5 cmH₂O, RR 14–16/min, FiO₂ 1.0 → titrate to SpO₂ 94–98%.",
      "Prevent inadvertent extubation: secure ETT (commercial holder or tape), restrain if agitated, document ETT depth at lips.",
    ],
    reference: "NAEMSP/ACEP RSI Consensus Guidelines 2023 · Walls et al. Manual of Emergency Airway Management 5th Ed",
  },

  drug_selection: {
    definition: "Selection of RSI agents is guided by haemodynamic status, underlying pathology, and contraindication profile. No single perfect combination exists — understanding the pharmacodynamic profile of each agent allows tailored selection. The induction agent and paralytic are given simultaneously in RSI to achieve the most rapid intubating conditions.",
    keyCriteria: [
      "Haemodynamic instability (SBP <90) → Ketamine preferred induction agent",
      "TBI → Ketamine (does NOT raise ICP with ventilation — ATLS 11th Ed reversal), avoid propofol (hypotension worsens ICP)",
      "Bronchospasm / asthma → Ketamine (best bronchodilator) + succinylcholine or rocuronium",
      "Status epilepticus → Propofol (anticonvulsant) or ketamine, high-dose BZD pretreatment",
      "Succinylcholine contraindications: hyperkalaemia, crush injury >24h, burns >24h, denervation, malignant hyperthermia history, myopathies",
      "When succinylcholine contraindicated → Rocuronium 1.2 mg/kg + sugammadex immediately available",
    ],
    workup: [
      { icon:"📊", label:"Haemodynamic Status Assessment", detail:"SBP, MAP, HR, shock index (HR/SBP). SBP >100: any agent acceptable. SBP 70–100: ketamine preferred; reduce propofol dose by 50%. SBP <70: ketamine only; avoid etomidate (adrenal suppression in shock). Push-dose epinephrine ready before induction." },
      { icon:"🧠", label:"Neurological Status (TBI/ICP)", detail:"GCS, pupil exam, herniation signs. Ketamine: safe in TBI (ATLS 11th Ed 2023 reversal of prior contraindication). Maintain SBP ≥100–110 mmHg throughout to protect CPP. Avoid hypotension from any induction agent." },
      { icon:"🫁", label:"Respiratory/Aspiration Risk", detail:"Active bronchospasm → Ketamine (bronchodilator). Full stomach (trauma, pregnancy, bowel obstruction) → RSI mandatory, Sellick's manoeuvre controversial but commonly used. Aspiration risk → avoid BMV if possible." },
      { icon:"🔬", label:"Electrolyte / Metabolic Status", detail:"K⁺ >5.5 mmol/L → succinylcholine CONTRAINDICATED (raises K⁺ by 0.5–1.0 mmol/L). Burns >24h, crush injury >24h, spinal cord injury → succinylcholine CONTRAINDICATED (extrajunctional ACh receptor upregulation → massive K⁺ release)." },
    ],
    treatment: [
      { cat:"Scenario: Haemodynamic Instability", drug:"Ketamine + Succinylcholine", dose:"Ketamine 1–2 mg/kg IV + Succinylcholine 1.5 mg/kg IV", note:"Ketamine maintains BP via sympathomimetic effect. If maximal sympathetic stimulation already present (terminal shock), ketamine may cause hypotension — use push-dose epi regardless.", ref:"Level A" },
      { cat:"Scenario: TBI (all severities)", drug:"Ketamine + Rocuronium", dose:"Ketamine 1.5 mg/kg IV + Rocuronium 1.2 mg/kg IV", note:"2023 update: ketamine does NOT raise ICP with controlled ventilation. Rocuronium preferred (avoids succinylcholine-related fasciculations that transiently raise ICP).", ref:"Level A" },
      { cat:"Scenario: Status Epilepticus", drug:"Propofol + Rocuronium", dose:"Propofol 1–2 mg/kg IV + Rocuronium 1.2 mg/kg IV", note:"Propofol has potent anticonvulsant properties. Only if haemodynamically stable. Consider midazolam 0.1 mg/kg as pretreatment.", ref:"Level B" },
      { cat:"Scenario: Asthma/Bronchospasm", drug:"Ketamine + Succinylcholine", dose:"Ketamine 1.5–2 mg/kg IV + Succinylcholine 1.5 mg/kg IV. Pretreat: Salbutamol MDI 8 puffs via BVM.", note:"Ketamine: most potent bronchodilator of all induction agents. Avoid fentanyl pretreatment (can trigger histamine-mediated bronchospasm).", ref:"Level B" },
      { cat:"Reversal Agent", drug:"Sugammadex (rocuronium reversal)", dose:"Routine reversal: 2 mg/kg IV. Immediate reversal (deep block): 16 mg/kg IV", note:"Can reverse full RSI-dose rocuronium within 3 min with 16 mg/kg. Must be immediately available whenever rocuronium used. Game-changing safety net for failed intubation.", ref:"Level A" },
    ],
    followup: [
      "Document: drug name, dose, weight-based calculation, time of administration, first-pass intubation success",
      "Post-intubation: start sedation within 5 min of intubation — paralysis without sedation is awareness",
      "Ketamine patients: may require additional analgesia (ketamine provides analgesia but tolerance to dissociation occurs) — add opioid infusion",
      "Rocuronium duration: 60–90 min — ensure adequate sedation maintained throughout. Monitor train-of-four if prolonged NMB needed.",
    ],
    reference: "Walls & Brown, RSI Drug Selection — Emergency Airway Management 5th Ed; ACEP 2023 Clinical Policy",
  },

  difficult_airway: {
    definition: "A difficult airway is one in which a conventionally trained clinician experiences difficulty with facemask ventilation, laryngoscopy, supraglottic airway placement, or tracheal intubation. The DAS 2015/2022 algorithm distinguishes 'anticipated' (planned strategy) from 'unanticipated' (Plan A/B/C/D escalation) difficult airway. LEMON score predicts difficulty. Recognition triggers immediate plan escalation.",
    keyCriteria: [
      "LEMON predicts difficult laryngoscopy: 3+ factors = significantly increased risk",
      "Plan A: Direct or video laryngoscopy — maximum 3 attempts by most experienced operator",
      "Plan B: Second intubation attempt with different technique/device OR supraglottic airway (LMA/iGEL)",
      "Plan C: Face-mask ventilation to maintain oxygenation while re-planning",
      "Plan D: CICO declared — emergency front of neck access (eFONA/cricothyroidotomy)",
      "STOP after 3 failed intubation attempts — wake patient if possible; never persist into CICO",
    ],
    workup: [
      { icon:"🔍", label:"LEMON Assessment", detail:"L — Look: facial trauma, beard, obesity, anterior larynx, receding mandible. E — Evaluate 3-3-2 rule. M — Mallampati I–IV. O — Obstruction: epiglottitis, abscess, haematoma, foreign body, tumour, stridor. N — Neck mobility: cervical collar, ankylosing spondylitis, halo brace." },
      { icon:"🩺", label:"RODS — SGD Difficulty", detail:"R — Restricted mouth opening (<3 cm). O — Obstruction/obesity. D — Distorted airway (radiation, tumour). S — Stiff lungs/cervical spine. Predicts supraglottic device difficulty — guides backup plan." },
      { icon:"📡", label:"Airway Ultrasound", detail:"Pre-intubation: identify CTM (cricothyroid membrane) with linear probe — mark with skin marker. Confirm tracheal position. Assess for anterior soft tissue thickness. Tracheal intubation confirmation: bilateral lung sliding, 'double tract' sign (no oesophageal intubation)." },
      { icon:"📊", label:"Team Briefing + Role Assignment", detail:"Before ANY difficult airway: operator (most experienced), assistant (tube holder/suction), drug administrator, airway nurse, surgical backup. All verbalise their role. Rescue equipment OPEN on trolley: surgical kit, LMA sizes, bougie, video laryngoscope alternative." },
    ],
    treatment: [
      { cat:"Plan A — Attempt 1", drug:"Video Laryngoscopy (first-line)", dose:"Hyperangulated blade (C-MAC D-blade / GlideScope): BURP + external laryngeal manipulation. Insert bougie first if Cormack-Lehane III–IV.", note:"Video laryngoscopy improves grade by 1–2 Cormack-Lehane levels over direct laryngoscopy. Does NOT guarantee success — still requires tube delivery technique.", ref:"Level A" },
      { cat:"Plan A — Attempt 2", drug:"Direct Laryngoscopy with Adjuncts", dose:"McCoy lever blade + BURP + optimal HELP position. Introduce Aintree catheter or Frova bougie blindly beyond cords.", note:"Change at least one variable between attempts: blade type, position, operator, technique. Maximum 3 attempts by most skilled operator — then escalate.", ref:"Level A" },
      { cat:"Plan B — Oxygenation Rescue", drug:"Supraglottic Airway (iGEL / LMA Supreme)", dose:"iGEL size 4 (adult female) or 5 (adult male). Insert without rotation, blind.", note:"Bridge to oxygenation — NOT a definitive airway. Allows oxygenation while re-planning. Facilitate intubation through SGD with bronchoscope or Aintree catheter if time.", ref:"Level A" },
      { cat:"Plan B — Alternative Intubation", drug:"Flexible Bronchoscopic Intubation (awake)", dose:"Topicalise airway: lidocaine 4% nebulised + spray-as-you-go. Midazolam 1–2 mg + fentanyl 50 mcg sedation. Insert bronchoscope nasally or orally.", note:"Gold standard for anticipated difficult airway. Preserves airway reflexes. Time-consuming — not suitable for immediate-threat situation.", ref:"Level A" },
      { cat:"Plan C — Maintain Oxygenation", drug:"Two-Person BVM Ventilation", dose:"E-C grip × 2 operators, PEEP valve 5 cmH₂O, OPA + NPA in situ. Jaw thrust, head tilt.", note:"If SpO₂ dropping and cannot intubate — mask ventilate. DO NOT persist with intubation attempts while patient desaturates. Oxygenation is the priority.", ref:"Level A" },
      { cat:"Plan D — CICO", drug:"Emergency Cricothyroidotomy (eFONA)", dose:"Scalpel-finger-bougie technique. See CICO protocol for full details.", note:"DECLARE CICO loudly — team must hear. Decision to eFONA must NOT be delayed. Early eFONA saves lives — late eFONA does not.", ref:"Level A" },
    ],
    followup: [
      "Document each intubation attempt: technique, blade, grade, adjuncts, SpO₂ nadir, success/failure",
      "Difficult airway notification: wristband, electronic flag, formal letter to patient and GP — prevents future unrecognised difficult airway",
      "Post-difficult airway: debrief team (cognitive aide), incident report if CICO/near-miss",
      "Cancel elective procedure if unanticipated difficult airway in controlled setting — wake patient, re-plan with awake bronchoscopy",
    ],
    reference: "DAS Difficult Airway Society Guidelines 2015 (updated 2022) — Higgs et al., Anaesthesia 2018",
  },

  video_laryngoscopy: {
    definition: "Video laryngoscopy (VL) uses a camera at or near the tip of the laryngoscope blade to display the glottic view on a screen, improving the Cormack-Lehane grade by 1–2 levels compared to direct laryngoscopy. Two blade types: (1) hyperangulated (C-MAC D-blade, GlideScope) — does not require line-of-sight alignment; (2) Macintosh-profile (C-MAC 3/4) — allows direct laryngoscopy backup.",
    keyCriteria: [
      "Hyperangulated blades: best view but require styletted ETT with 60° anterior curve to navigate bend",
      "Macintosh-profile VL blades: allow direct + video laryngoscopy — best for routine use",
      "Good view ≠ easy intubation — tube delivery is the most common failure point with VL",
      "BURP (Backward-Upward-Rightward Pressure) on thyroid cartilage improves view during VL",
      "'Paradox of video laryngoscopy': excellent view yet tube cannot be delivered — stylet + angle critical",
      "Hyperangulated blade failure → switch to Macintosh blade or direct laryngoscopy for tube delivery",
    ],
    workup: [
      { icon:"📷", label:"Device Preparation + Check", detail:"Battery charged (or plug in). Camera lens clear (anti-fog). Correct blade size loaded (Mac 3 or 4 / hyperangulated size 4). ETT sized: 7.0–7.5 cm (female), 7.5–8.0 (male). Stylet bent to 60° angle for hyperangulated blade (hockey stick). Silicone ETT preferred with GlideScope." },
      { icon:"📊", label:"Screen Positioning", detail:"Monitor at eye level, directly in front of operator — avoids neck strain and loss of screen focus. Do NOT look directly down blade (defeats purpose of VL). Maintain screen view throughout tube delivery." },
      { icon:"🩺", label:"Optimal Patient Position", detail:"HELP position (Head Elevated Laryngoscopy Position): ear-to-sternal-notch alignment, bed at operator waist height. In obese patients: ramp with blankets/pillow to achieve HELP. Sniffing position (C1-C2 extension, C5-C7 flexion) for direct laryngoscopy backup." },
    ],
    treatment: [
      { cat:"Technique", drug:"Hyperangulated VL — Tube Delivery", dose:"Enter midline with blade. Do NOT seek direct line-of-sight. Follow camera to glottis. Introduce styletted ETT from right corner of mouth at 45–90° angle, advance under screen view.", note:"Most common error: inserting ETT parallel to blade line of sight (causes tube to hit anterior tracheal wall). Insert ETT more laterally than expected.", ref:"Level A" },
      { cat:"Technique", drug:"External Laryngeal Manipulation", dose:"BURP — apply backward-upward-rightward pressure on thyroid cartilage with right hand (or assistant). Improves Cormack-Lehane by 0.5–1 grade.", note:"Bimanual laryngoscopy: operator's right hand applies BURP while intubating, then assistant holds in position. More effective than OELM alone.", ref:"Level A" },
      { cat:"Rescue — View But No Tube Passage", drug:"Bougie First Technique", dose:"Advance Eschmann bougie (60 cm, 5mm) through cords under VL view. Feel/see clicks at carina. Railroad ETT over bougie (remove stylet). Hold bougie stationary while ETT advanced.", note:"Railroading failure: ETT catches on right arytenoid — rotate ETT 90° counterclockwise (opening faces posteriorly) to slip past arytenoid.", ref:"Level A" },
      { cat:"Troubleshooting", drug:"Camera Lens Fogging", detail:"Pre-warm blade in warm water or anti-fog solution before use. Persistent fog: suction oropharynx directly, use DL backup blade.", dose:"Prevention: warm blade tip with warm water 30 sec before use", note:"Blood/secretions on lens: suction before each attempt, use channel-tip devices (King Vision, Airtraq) that protect lens.", ref:"Level B" },
    ],
    followup: [
      "Document: device used, blade type, Cormack-Lehane grade, number of attempts, adjuncts used",
      "Post-intubation CXR: confirm ETT tip 2–3 cm above carina (at level of aortic arch on AP film)",
      "If VL failed: document reason (blood, secretions, tube delivery failure, anatomical). Inform next clinician.",
      "Training: VL requires dedicated simulation practice — manikin + cadaveric training recommended before clinical use",
    ],
    reference: "DAS 2022 Video Laryngoscopy Guidelines · Sakles JC et al. — Ann Emerg Med VL meta-analysis 2023",
  },

  cico: {
    definition: "Cannot Intubate Cannot Oxygenate (CICO) is a life-threatening emergency where tracheal intubation has failed AND supraglottic airway/facemask ventilation cannot maintain SpO₂. Brain death occurs within 3–5 minutes. Immediate Emergency Front of Neck Access (eFONA) is the only life-saving intervention. The decision must be made EARLY and LOUDLY — delay is fatal.",
    keyCriteria: [
      "CICO declared when: cannot intubate AND cannot maintain SpO₂ >90% with BVM/SGD",
      "SpO₂ <85% despite all oxygenation attempts = CICO — do NOT waste time with further intubation attempts",
      "DECLARE loudly: 'This is a CICO situation — I am performing front of neck access'",
      "Scalpel-finger-bougie technique: fastest, most reliable emergency cricothyroidotomy",
      "Needle/cannula techniques: NOT recommended for adults (high failure rate, insufficient airway) — use surgical technique",
      "After eFONA: convert to formal tracheostomy within 24–72 hours in all cases",
    ],
    workup: [
      { icon:"🚨", label:"CICO Recognition Criteria", detail:"3 failed intubation attempts by most experienced operator + cannot oxygenate (SpO₂ declining despite BVM + SGD). OR SpO₂ <85% regardless of attempts. Time is brain — do NOT await further deterioration before declaring CICO." },
      { icon:"📡", label:"Cricothyroid Membrane Identification", detail:"Palpation (preferred if accessible): identify thyroid cartilage notch → slide inferiorly to identify CTM (soft depression between thyroid and cricoid cartilage). USS identification: linear probe in transverse then sagittal. Pre-mark CTM before difficult airway cases if time permits." },
      { icon:"🩺", label:"Equipment Verification", detail:"Scalpel (#22 or #10 blade). Bougie (Eschmann bougie, 60 cm). Cuffed ETT 6.0 (adult). 10 mL syringe. BVM. Suction. Have ALL pre-opened in difficult airway trolley. Do NOT have to search for equipment — pre-position in every RSI setup." },
    ],
    treatment: [
      { cat:"Scalpel-Finger-Bougie (Preferred)", drug:"Step 1 — Identify CTM", dose:"Laryngeal handshake: non-dominant hand stabilises larynx. Thumb and middle finger on thyroid cornu. Index finger palpates CTM in midline.", note:"Stabilise larynx throughout procedure — do not lose your landmark. If cannot palpate (obese neck): incision in midline 1 cm above cricoid cartilage.", ref:"Level A" },
      { cat:"Scalpel-Finger-Bougie (Preferred)", drug:"Step 2 — Horizontal Stab Incision", dose:"Horizontal incision through CTM (3 cm), skin + membrane simultaneously. Scalpel blade is 'all the way through' to tracheal lumen.", note:"Single decisive incision — not timid stabs. The CTM is superficial (1–3 mm). Hook with tracheal hook or caudal retraction of cricoid.", ref:"Level A" },
      { cat:"Scalpel-Finger-Bougie (Preferred)", drug:"Step 3 — Bougie Insertion + Tube Railroading", dose:"Insert finger into tracheal lumen (confirm: tracheal rings palpable). Introduce bougie caudally alongside finger. Railroad cuffed 6.0 ETT over bougie. Cuff up, confirm with EtCO₂.", note:"Feel tracheal rings on bougie (clicks) or resistance at carina. If bougie goes into oesophagus — withdraw and re-insert into trachea (finger guides). Confirm waveform EtCO₂.", ref:"Level A" },
      { cat:"Alternative — Melker Kit", drug:"Seldinger Cricothyroidotomy", dose:"Needle → syringe confirms air → guidewire → dilator + airway catheter (6.0mm ID)", note:"More steps than scalpel technique — higher failure rate under stress. Use only if kit available and operator experienced. Scalpel-bougie is faster and more reliable.", ref:"Level B" },
      { cat:"Contraindicated", drug:"Needle/Cannula Cricothyroidotomy", dose:"NOT recommended in adults — 14G cannula is insufficient for sustained ventilation in adults", note:"High failure rate (kinking, dislodgement). Jet ventilation requires specialist equipment + risks barotrauma. DAS 2015: surgical eFONA preferred over cannula eFONA in adults. Use only as absolute last resort.", ref:"Level C" },
    ],
    followup: [
      "Post-eFONA: convert to formal surgical tracheostomy within 24–72 hours (cricothyroidotomy is temporary airway)",
      "Immediate post-eFONA care: standard intubated patient care, confirm position with CXR, sedation + analgesia infusions",
      "Critical incident debrief: mandatory for all CICO events. Submit incident report. Review what was anticipated vs unanticipated.",
      "Difficult airway alert: patient notification in writing and in medical record. Future anaesthetists must be warned.",
      "Simulation review: all team members should participate in post-event simulation within 1–2 weeks",
    ],
    reference: "DAS Emergency Front of Neck Access Guideline 2015 · Frerk et al., Anaesthesia 2015; Patel A & Nouraei SAR, Anaesthesia 2015",
  },

  cricothyroidotomy: {
    definition: "Surgical cricothyroidotomy is the definitive emergency front of neck airway (eFONA) for CICO situations. The scalpel-finger-bougie (SFB) technique is recommended by DAS 2015 as the fastest and most reliable method in adults. The cricothyroid membrane (CTM) is the preferred access point — thin, superficial, avascular in midline, and directly accessible.",
    keyCriteria: [
      "Cricothyroid membrane: 9 mm height × 30 mm width — large enough for 6.0 ETT",
      "CTM landmarks: thyroid notch (superior) → thyroid cartilage → soft CTM → cricoid cartilage (inferior)",
      "CTM is anterior, midline — avoid lateral where superior cricothyroid arteries run",
      "Scalpel-finger-bougie (SFB): fastest technique, lowest failure rate under stress",
      "Needle cricothyroidotomy NOT recommended in adults due to kinking + barotrauma risk",
      "Convert to formal tracheostomy within 24–72 hours",
    ],
    workup: [
      { icon:"✂️", label:"Kit Contents — Pre-Check", detail:"Scalpel (No.22 or #10 blade), Eschmann bougie (60 cm), cuffed ETT 6.0 mm ID, 10 mL syringe, tape, BVM. All pre-opened and in anatomical sequence on trolley. Practice kit assembly in simulation — procedural memory under stress." },
      { icon:"📡", label:"Ultrasound CTM Identification", detail:"Linear probe (7–15 MHz), transverse view first — identify 'thyroid snowman' appearance. Sagittal view — thyroid cartilage (hyperechoic anterior), CTM (hypoechoic gap), cricoid (hyperechoic). Mark CTM on skin with marker BEFORE RSI in anticipated difficult airway." },
      { icon:"🩺", label:"Anatomy Review", detail:"CTM is 1–3 cm below thyroid notch in midline. Average distance from skin = 5–7 mm. Superior cricothyroid arteries at lateral margins — stay midline. In obese/female patients: CTM more caudal and smaller. In laryngeal trauma: anatomy distorted." },
    ],
    treatment: [
      { cat:"Position + Prep", drug:"Optimal Positioning", dose:"Neck extended (pillow under shoulders). Operator standing at head of bed. Landmarks re-checked. Chlorhexidine skin prep if time.", note:"Extension improves CTM access by moving trachea anteriorly. Towel roll under shoulders opens airway.", ref:"Level A" },
      { cat:"Landmark Technique", drug:"Laryngeal Handshake", dose:"Non-dominant hand: thumb right, middle finger left on thyroid cornu — stabilise larynx. Index finger identifies CTM in midline (soft, depressible, between thyroid and cricoid).", note:"Dominant hand holds scalpel. Non-dominant hand does NOT move throughout procedure — it is the anchor.", ref:"Level A" },
      { cat:"Incision", drug:"Horizontal Stab Incision", dose:"3 cm horizontal incision through skin and CTM simultaneously. Blade directed caudally at 45° angle.", note:"Confident single incision — commit fully. The 'skin only, then membrane' approach risks losing the CTM. Simultaneous full-depth incision through to trachea is fastest.", ref:"Level A" },
      { cat:"Access", drug:"Hook + Traction / Finger Sweep", dose:"Hook inferior border of thyroid cartilage and retract cephalad. OR insert finger into lumen, confirm tracheal rings, dilate opening.", note:"Tracheal hook: improves access in deep necks. Finger sweep: confirms lumen, removes clot/mucus, guides bougie.", ref:"Level A" },
      { cat:"Tube Placement", drug:"Bougie → ETT Railroading", dose:"Bougie inserted caudally alongside finger. Railroad 6.0 cuffed ETT (remove stylet) over bougie to 16–18 cm at lips. Inflate cuff. Confirm waveform EtCO₂.", note:"REMOVE STYLET before railroading — stylet prevents flexible ETT from bending with bougie. Hold bougie stationary while ETT advances.", ref:"Level A" },
    ],
    followup: [
      "Waveform EtCO₂ confirmation mandatory — visual confirmation of tube in trachea insufficient alone",
      "CXR: confirm tube tip position 2–3 cm above carina via cricothyroidotomy tract",
      "Convert to formal tracheostomy: ENT/general surgery within 24–72 h. Cricothyroidotomy → subglottic stenosis risk if left >72 h.",
      "Complication monitoring: surgical emphysema, haematoma, tube displacement, false passage",
    ],
    reference: "DAS eFONA Guideline 2015 · Frerk C et al., Anaesthesia 2015; Heard AMB et al., Anaesthesia 2009",
  },

  post_intubation: {
    definition: "Post-intubation management encompasses the critical period immediately following successful tracheal intubation. Key priorities: ETT confirmation, haemodynamic rescue, sedation and analgesia initiation, ventilator setup, and prevention of complications. Post-intubation hypotension (PIH) occurs in 25–35% of emergency intubations and is associated with significantly increased mortality.",
    keyCriteria: [
      "ETT confirmation within 30 seconds: waveform EtCO₂ ≥6 waveforms (gold standard)",
      "Post-intubation hypotension: SBP <90 mmHg within 30 min — treat immediately with push-dose epinephrine",
      "Start sedation within 5 minutes: awareness under paralysis is traumatic",
      "Target RASS −2 to −1 (lightly sedated, responsive to voice) unless status epilepticus or raised ICP",
      "Initial ventilator settings: TV 6–8 mL/kg IBW, PEEP 5 cmH₂O, FiO₂ 1.0 → titrate",
      "SpO₂ target 94–98% — avoid hyperoxia (free radical injury in post-cardiac arrest, TBI)",
    ],
    workup: [
      { icon:"📊", label:"ETT Confirmation — Waveform EtCO₂", detail:"Connect inline EtCO₂ adapter immediately after intubation. ≥6 waveforms on capnography = tracheal intubation confirmed. Flat waveform = oesophageal intubation (immediate extubation). Also: bilateral auscultation + post-intubation CXR (ETT tip 2–3 cm above carina)." },
      { icon:"🩺", label:"Haemodynamic Assessment within 2 min", detail:"BP, HR, SpO₂ immediately post-intubation. PIH mechanisms: vasodilation (induction agents), loss of sympathetic drive, auto-PEEP (obstructive disease), pneumothorax (tension, barotrauma), haemoperitoneum unmasked. Treat each cause specifically." },
      { icon:"🩻", label:"Post-Intubation CXR", detail:"ETT tip should be 2–3 cm above carina (radiographically at level of aortic arch). Right mainstem intubation: common, ETT too deep — pull back until bilateral air entry confirmed. ICC position, haemopneumothorax." },
      { icon:"📋", label:"Medication Reconciliation + Infusion Start", detail:"Sedation + analgesia infusion started before paralytic wears off. Vasopressor infusion if PIH persists. VTE prophylaxis prescription. Gastric tube (NGT) after confirmation. IDC (if not already present) for fluid balance." },
    ],
    treatment: [
      { cat:"ETT Confirmation", drug:"Waveform Capnography", dose:"Connect inline EtCO₂. Count ≥6 consistent waveforms with ventilation. EtCO₂ 35–45 mmHg = normal. <35 = hyperventilation. >45 = hypoventilation.", note:"Colorimetric detectors (FEF) are NOT adequate — use waveform capnography. In cardiac arrest: low EtCO₂ expected but waveform still confirms placement.", ref:"Level A" },
      { cat:"PIH Prevention/Treatment", drug:"Push-Dose Epinephrine", dose:"10–20 mcg IV bolus q2–5 min. Prepared: 1 mL of 1:10,000 epi + 9 mL NS = 10 mcg/mL.", note:"First-line for post-intubation hypotension — vasodilation is the most common mechanism. Noradrenaline infusion for sustained hypotension. IV bolus 250–500 mL NS if hypovolaemia suspected.", ref:"Level A" },
      { cat:"Sedation", drug:"Propofol Infusion", dose:"1–3 mg/kg/h IV — titrate to RASS −2 to −1", note:"First-line sedation in most ICU settings. Rapid onset/offset. Propofol infusion syndrome risk at >4 mg/kg/h >48h. Monitor triglycerides and CK if high dose. Avoid in haemodynamic instability (causes vasodilation).", ref:"Level A" },
      { cat:"Sedation — Alternative", drug:"Midazolam + Fentanyl Infusion", dose:"Midazolam 0.02–0.1 mg/kg/h IV + Fentanyl 25–100 mcg/h IV", note:"Preferred when propofol unsuitable (haemodynamic instability, allergy). Accumulates in renal failure (active metabolites). Longer wake-up time than propofol. Add ketamine 0.1–0.3 mg/kg/h as adjunct to reduce opioid requirements.", ref:"Level B" },
      { cat:"Analgesia", drug:"Fentanyl Infusion", dose:"25–100 mcg/h IV. Bolus 25–50 mcg for procedures/care.", note:"Analgesia first strategy (A1C) — treat pain before deepening sedation. Fentanyl: short-acting, minimal accumulation in renal failure, haemodynamically stable. Morphine: active metabolites accumulate in renal failure — use with caution.", ref:"Level A" },
    ],
    followup: [
      "Daily sedation vacation (SAT): hold sedation in the morning. Assess neurological status. Restart at 50% dose.",
      "Daily spontaneous breathing trial (SBT): screen all patients for readiness. Pass criteria → consider extubation.",
      "Ventilator bundle: HOB 30–45°, oral chlorhexidine q6h, NGT (not NG tube vs oral), subglottic suction ETT if available, daily assessment for extubation readiness",
      "Prevent VAP: change circuit only when visibly soiled, inline suction catheters, avoid unnecessary bronchoscopy",
    ],
    reference: "Weingart SD & Levitan RM — Post-Intubation Hypotension, Ann Emerg Med 2012; SCCM ICU Liberation Guidelines 2018",
  },

  ventilator_basics: {
    definition: "Mechanical ventilation supports or replaces spontaneous breathing in patients who cannot maintain adequate gas exchange. Initial ventilator settings must be tailored to the patient's pathophysiology, weight, and lung mechanics. Lung-protective ventilation (low tidal volume, appropriate PEEP, limiting plateau pressure) reduces ventilator-induced lung injury (VILI) and improves outcomes in ARDS.",
    keyCriteria: [
      "Tidal volume (TV): 6–8 mL/kg IBW (Ideal Body Weight, NOT actual body weight — critical distinction)",
      "PEEP: minimum 5 cmH₂O (prevents atelectasis). ARDS: higher PEEP (8–18 cmH₂O per PEEP-FiO₂ tables)",
      "Plateau pressure: MUST be <30 cmH₂O. Driving pressure = Pplat − PEEP <15 cmH₂O optimal",
      "FiO₂: start 1.0, titrate to SpO₂ 94–98%. Do NOT leave FiO₂ 1.0 unnecessarily",
      "RR: 14–20 bpm. Titrate to target PaCO₂ (normocapnia) or specific CO₂ target (TBI: 35–45)",
      "Mode: A/C (Assist Control) Volume Control = standard starting mode for most ED/ICU patients",
    ],
    workup: [
      { icon:"📊", label:"IBW Calculation", detail:"Male IBW: 50 kg + 2.3 × (height in inches − 60). Female IBW: 45.5 kg + 2.3 × (height in inches − 60). OR: Male = height (cm) − 100. Female = height (cm) − 105. ALWAYS use IBW for TV calculation — actual weight overestimates in obese patients." },
      { icon:"🫁", label:"Compliance Assessment — Plateau Pressure", detail:"Inspiratory hold manoeuvre (0.5 sec pause): reads plateau pressure (Pplat). Static compliance = TV / (Pplat − PEEP). Normal >60 mL/cmH₂O. ARDS: <40 mL/cmH₂O. Pplat >30 cmH₂O = reduce TV or PEEP." },
      { icon:"📋", label:"Ventilator Parameters Checklist", detail:"Set: FiO₂, mode, TV, RR, PEEP, I:E ratio (1:2 default), flow rate (60 L/min standard). Alarm limits: high pressure (Ppeak +10 above set), low VT, low minute volume, apnoea. Monitor: Ppeak, Pplat, minute volume, actual TV delivered." },
      { icon:"🩸", label:"ABG 30 min Post-Intubation", detail:"pH, PaCO₂, PaO₂, FiO₂. Calculate P/F ratio (PaO₂/FiO₂): >300 = normal, 200–300 = mild ARDS, 100–200 = moderate, <100 = severe. Adjust RR to correct pH/CO₂. Adjust FiO₂/PEEP for oxygenation." },
    ],
    treatment: [
      { cat:"Initial Settings — Universal", drug:"Volume-Controlled A/C Mode", dose:"TV: 6–8 mL/kg IBW. RR: 14–16/min. PEEP: 5 cmH₂O. FiO₂: 1.0 → titrate. I:E 1:2.", note:"Start FiO₂ at 1.0 — titrate down to achieve SpO₂ 94–98% (avoid prolonged hyperoxia). A/C ensures every breath supported — allows patient to trigger additional breaths.", ref:"Level A" },
      { cat:"TBI Specific Settings", drug:"Normocapnia Protocol", dose:"RR titrated to EtCO₂ 35–40 mmHg (PaCO₂ 35–45 mmHg). SpO₂ >94%. SBP ≥100–110 mmHg.", note:"Hyperventilation (PaCO₂ <35) permitted ONLY as bridge for acute herniation. Never prophylactically. Cerebral vasoconstriction from hypocapnia causes secondary ischaemia.", ref:"Level A" },
      { cat:"Obstructive Disease (Asthma/COPD)", drug:"Permissive Hypercapnia + Low RR", dose:"TV 6 mL/kg IBW, RR 8–12/min, PEEP 0–5 cmH₂O, long expiratory time (I:E 1:3 or 1:4).", note:"Key: avoid breath stacking (intrinsic PEEP/auto-PEEP). Low RR allows complete exhalation. Disconnect circuit if SpO₂ drops acutely post-intubation (dynamic hyperinflation). Accept pH 7.2.", ref:"Level A" },
      { cat:"ARDS", drug:"ARDSnet Protocol (see ARDS entry)", dose:"TV 6 mL/kg IBW. Plateau pressure <30. PEEP per FiO₂-PEEP table. RR up to 35/min to maintain pH.", note:"Target pH ≥7.3 (permissive hypercapnia acceptable). See ARDS protocol for full PEEP-FiO₂ table.", ref:"Level A" },
      { cat:"Oxygenation Titration", drug:"FiO₂ + PEEP Adjustment", dose:"SpO₂92–95%: FiO₂ 0.4–0.5 + PEEP 5. SpO₂<90%: increase FiO₂ then increase PEEP in 2 cmH₂O increments. Pplat >30: reduce TV by 1 mL/kg.", note:"Titrate FiO₂ below 0.6 to avoid oxygen toxicity (FiO₂ >0.6 for >24h causes absorption atelectasis and free radical injury). Balance oxygenation with PEEP for ARDS.", ref:"Level A" },
    ],
    followup: [
      "Daily ABG and clinical assessment — adjust settings as pathophysiology evolves",
      "Weaning: reduce FiO₂ to <0.4, PEEP to 5, RR to 12 before attempting extubation",
      "Ventilator circuit: change only when soiled (not on schedule). Inline suction only if available.",
      "Spontaneous breathing trial (SBT) daily: pressure support 5/5 for 30–120 min. Pass criteria → extubate.",
    ],
    reference: "ARDSnet NEJM 2000; Slutsky & Ranieri — VILI NEJM 2013; SCCM/ATS Mechanical Ventilation Guidelines",
  },

  ards_management: {
    definition: "Acute Respiratory Distress Syndrome (ARDS) is defined by the Berlin Definition: acute onset (<1 week), bilateral opacities on chest imaging not fully explained by effusions/collapse/nodules, respiratory failure not fully explained by cardiac failure/fluid overload, and P/F ratio (PaO₂/FiO₂) <300 mmHg with PEEP ≥5 cmH₂O. Mild P/F 200–300, Moderate 100–200, Severe <100. ARDSnet lung-protective ventilation reduces 28-day mortality by 22%.",
    keyCriteria: [
      "TV 6 mL/kg IBW — do NOT use 8 mL/kg (the old standard). Reduce to 4 mL/kg if Pplat >30",
      "Plateau pressure <30 cmH₂O — mandatory limit. Driving pressure <15 cmH₂O — optimal target",
      "Higher PEEP strategy: use PEEP-FiO₂ table. Do NOT use low PEEP in moderate-severe ARDS",
      "Prone positioning: >12–16 hours/day for severe ARDS (P/F <150) — reduces mortality (PROSEVA trial)",
      "Neuromuscular blockade (cisatracurium): first 48h in moderate-severe ARDS — may improve outcome",
      "Permissive hypercapnia: accept pH 7.25–7.30 to maintain lung-protective TV",
    ],
    workup: [
      { icon:"📊", label:"P/F Ratio Calculation", detail:"P/F = PaO₂ (mmHg) ÷ FiO₂ (as decimal). Example: PaO₂ 80 on FiO₂ 0.6 = P/F 133 (moderate ARDS). Must be with PEEP ≥5 cmH₂O. Serial P/F tracks disease trajectory. P/F <150 = consider prone positioning." },
      { icon:"🫁", label:"ARDSnet PEEP-FiO₂ Table (High PEEP)", detail:"FiO₂ 0.3/PEEP 5 → FiO₂ 0.4/PEEP 5–8 → FiO₂ 0.5/PEEP 8–10 → FiO₂ 0.6/PEEP 10 → FiO₂ 0.7/PEEP 10–14 → FiO₂ 0.8/PEEP 14 → FiO₂ 0.9/PEEP 14–18 → FiO₂ 1.0/PEEP 18–24. Start low, titrate to SpO₂ 88–95%." },
      { icon:"🩻", label:"Imaging Assessment", detail:"HRCT: bilateral ground glass opacities, consolidation (posterior/dependent). CXR: bilateral infiltrates — must exclude cardiogenic pulmonary oedema (PCWP <18 or Echo). Lung ultrasound: B-lines, abolition of A-lines, bilateral anterior involvement." },
      { icon:"🔬", label:"Cause Identification", detail:"Pulmonary (direct): pneumonia, aspiration, inhalation, pulmonary contusion. Extrapulmonary (indirect): sepsis (most common), pancreatitis, transfusion (TRALI), burns, trauma. Identify and treat underlying cause concurrently." },
    ],
    treatment: [
      { cat:"Ventilation — Mandatory", drug:"ARDSnet Low TV Protocol", dose:"TV 6 mL/kg IBW. Set Vt, measure Pplat after 30 min. If Pplat >30 → reduce TV by 1 mL/kg to minimum 4 mL/kg. Accept PaCO₂ rise (permissive hypercapnia) to pH ≥7.25.", note:"MOST IMPORTANT intervention — 22% mortality reduction. NEVER compromise TV >6 mL/kg to correct CO₂. Increase RR up to 35/min instead.", ref:"Level A" },
      { cat:"Prone Positioning", drug:"Prone Ventilation ≥16 h/day", dose:"P/F <150 with PEEP ≥5 and FiO₂ >0.6. Prone immediately — delay worsens outcome. Prone sessions ≥16h. Assess P/F at 4h into prone — if improved, continue cycle.", note:"PROSEVA trial: prone reduces 28-day mortality 32.8% → 16.0% in severe ARDS. Requires trained team (4–6 people), dedicated turning protocol, eye and pressure care, enteral feeding adjustment.", ref:"Level A" },
      { cat:"NMB", drug:"Cisatracurium Infusion (first 48h)", dose:"0.1–0.2 mg/kg/h IV continuous infusion. Train-of-four monitoring: 2/4 twitches target.", note:"ACURASYS trial suggested mortality benefit first 48h — ROSE trial did not confirm. Still used in ventilator dyssynchrony or refractory hypoxaemia. Requires deep sedation (propofol + opioid).", ref:"Level B" },
      { cat:"Fluid Strategy", drug:"Conservative Fluid Management", dose:"FACTT trial: target CVP 4–6 mmHg, PCWP ≤12 mmHg. Diuresis if haemodynamically stable.", note:"Liberal fluids worsen pulmonary oedema in ARDS — FACTT trial: conservative strategy = 2.5 more ventilator-free days. No mortality benefit but shorter ICU stay. Avoid in shock.", ref:"Level A" },
      { cat:"Rescue Therapies", drug:"Veno-Venous ECMO (VV-ECMO)", dose:"P/F <80 despite optimised ventilation + prone + NMB. Centre-specific criteria. Refer to ECMO-capable centre.", note:"CESAR trial: ECMO centre referral improved survival (63% vs 47%). Patient selection critical. Not universally available — early referral to ECMO centre if severe ARDS not improving.", ref:"Level B" },
    ],
    followup: [
      "Daily P/F ratio, driving pressure, PEEP requirement — track trajectory",
      "Prone positioning: maximum 4 cycles or until sustained P/F >200 with FiO₂ ≤0.6 on supine",
      "Weaning: initiate SBT when P/F >150, PEEP ≤8, FiO₂ ≤0.4, haemodynamically stable",
      "Long-term ARDS outcomes: ICU-acquired weakness, cognitive impairment, PTSD — all require MDT rehabilitation",
      "Mortality predictor review at 72h: if not improving, reconsider diagnosis and ECMO candidacy",
    ],
    reference: "ARDSnet (NEJM 2000) · PROSEVA Trial NEJM 2013 · ACURASYS Trial NEJM 2010 · FACTT Trial NEJM 2006",
  },

  extubation: {
    definition: "Extubation (planned removal of the endotracheal tube) requires systematic assessment of readiness, spontaneous breathing trial (SBT), and consideration of high-risk features that may necessitate a planned strategy with post-extubation respiratory support. Unplanned extubation occurs in 8–10% of ICU patients; re-intubation rate after planned extubation is 10–15%.",
    keyCriteria: [
      "PASS extubation readiness screen: P — Pathology improving, A — Awake (RASS −1 to +1), S — Spontaneous breathing, S — SpO₂ adequate (>94% on FiO₂ ≤0.4, PEEP ≤5)",
      "Cough strength: adequate cough on suctioning. Weak cough = high re-intubation risk",
      "Secretion burden: manageable volume, not requiring suctioning >q4h",
      "Swallowing: intact gag reflex and swallowing (risk of aspiration if impaired)",
      "High-risk features: prolonged intubation >7d, obese BMI >30, difficult airway, stridor risk (croup/subglottic oedema)",
      "Post-extubation support: HFNC (Optiflow) reduces re-intubation in at-risk patients; NIV for hypercapnic respiratory failure",
    ],
    workup: [
      { icon:"📊", label:"Spontaneous Breathing Trial (SBT)", detail:"Method: pressure support 5/5 cmH₂O (or T-piece/CPAP 0/5) for 30–120 min. Pass criteria: RR <30/min, SpO₂ >92%, TV >5 mL/kg IBW, HR <140 and stable, SBP 90–180 mmHg, no new agitation or diaphoresis. Fail = return to previous settings." },
      { icon:"🩺", label:"Cuff Leak Test (High-Risk Patients)", detail:"Deflate ETT cuff — air leak around tube during inspiration indicates no subglottic oedema. No leak ('cuff leak test negative') = high risk of post-extubation stridor. Treat: methylprednisolone 20 mg IV q4h × 4 doses before planned extubation. Re-check cuff leak after steroids." },
      { icon:"🧠", label:"Neurological Readiness Assessment", detail:"GCS ≥8, follows commands, can protect airway. Assess swallowing by giving sips of water with supervision before extubation in at-risk patients. Weak cough = consider 24-48h delay + chest physiotherapy." },
      { icon:"🫁", label:"Post-Extubation Plan", detail:"High-flow nasal cannula (HFNC) 30–60 L/min immediately post-extubation for all high-risk patients (BMI >30, prolonged intubation, moderate ARDS). NIV (CPAP/BiPAP) for hypercapnia or post-cardiac surgery. No HFNC/NIV plan = low-flow O₂ only for uncomplicated extubation." },
    ],
    treatment: [
      { cat:"Standard Extubation", drug:"Systematic Extubation Technique", dose:"1. Pre-oxygenate FiO₂ 1.0 for 3 min. 2. Suction oropharynx (Yankauer). 3. Suction ETT. 4. Deflate cuff. 5. Remove tube on deep breath/cough. 6. Apply O₂ immediately.", note:"Have re-intubation equipment immediately available. Do NOT extubate and leave the room — observe for 30 min minimum.", ref:"Level A" },
      { cat:"Post-Extubation — High Risk", drug:"High-Flow Nasal Cannula (HFNC)", dose:"Start 40–60 L/min + FiO₂ 0.4–1.0 immediately post-extubation. Maintain for minimum 2–4h.", note:"FLORALI trial: HFNC reduces re-intubation in hypoxaemic respiratory failure. HENIVOT trial: HFNC after extubation reduces re-intubation in high-risk patients. Comfortable, maintains PEEP, clears CO₂.", ref:"Level A" },
      { cat:"Post-Extubation — Hypercapnia", drug:"Non-Invasive Ventilation (NIV/BiPAP)", dose:"CPAP/BiPAP: IPAP 12–16, EPAP 4–6, FiO₂ titrate to SpO₂ 88–92% (COPD) or 94–98%", note:"Cochrane review: NIV post-extubation reduces re-intubation and ICU mortality in COPD. Also post-cardiac surgery, obesity hypoventilation. Use for 12–16h/day minimum.", ref:"Level A" },
      { cat:"Post-Extubation Stridor", drug:"Adrenaline Nebulisation", dose:"Nebulised adrenaline 1 mL of 1:1,000 + 3 mL NS. Repeat q20 min × 3 if required.", note:"Budesonide 2 mg nebulised + adrenaline for post-extubation croup/oedema. If stridor with impending respiratory failure: re-intubation. Helium-oxygen (Heliox) as bridge if available.", ref:"Level B" },
    ],
    followup: [
      "Observe for minimum 2h post-extubation: SpO₂, RR, work of breathing, stridor",
      "Speech and language therapy assessment within 24h for prolonged intubation (>72h) — dysphagia screening",
      "Physiotherapy: early mobilisation within 24h of extubation; incentive spirometry",
      "PICS (Post-Intensive Care Syndrome) counselling: ICU diary, psychological support referral",
      "Follow-up lung function at 3 months for prolonged ARDS/ventilation",
    ],
    reference: "ATS/ACCP Weaning Guidelines · FLORALI Trial NEJM 2015 · HENIVOT Trial Lancet 2022",
  },
};

const T = {
  bg:"#050f1e", txt:"#e8f0fe", txt2:"#8aaccc", txt3:"#4a6a8a", txt4:"#2e4a6a",
  border:"rgba(26,53,85,0.8)", borderHi:"rgba(42,79,122,0.9)",
  coral:"#ff6b6b", gold:"#f5c842", teal:"#00e5c0", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff",
};
const AC = HUB_CONFIG.accentColor;

function GlassBg() {
  const a = AC;
  return (
    <div style={{ position:"fixed", inset:0, overflow:"hidden", pointerEvents:"none", zIndex:0 }}>
      {[
        { x:"9%",  y:"16%", r:300, c:`rgba(59,158,255,0.07)` },
        { x:"87%", y:"11%", r:250, c:`rgba(155,109,255,0.05)` },
        { x:"79%", y:"79%", r:330, c:`rgba(0,229,192,0.06)` },
        { x:"17%", y:"83%", r:210, c:`rgba(245,200,66,0.04)` },
        { x:"50%", y:"46%", r:390, c:`rgba(59,158,255,0.03)` },
      ].map((o, i) => (
        <div key={i} style={{
          position:"absolute", left:o.x, top:o.y,
          width:o.r*2, height:o.r*2, borderRadius:"50%",
          background:`radial-gradient(circle,${o.c} 0%,transparent 68%)`,
          transform:"translate(-50%,-50%)",
          animation:`aw-orb${i%3} ${8+i*1.3}s ease-in-out infinite`,
        }}/>
      ))}
      <svg width="100%" height="100%" style={{ position:"absolute", inset:0, opacity:0.036 }}>
        <defs>
          <pattern id="awg" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0L0 0 0 40" fill="none" stroke={a} strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#awg)"/>
      </svg>
      <style>{`
        @keyframes aw-orb0{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-50%) scale(1.12)}}
        @keyframes aw-orb1{0%,100%{transform:translate(-50%,-50%) scale(1.08)}50%{transform:translate(-50%,-50%) scale(0.9)}}
        @keyframes aw-orb2{0%,100%{transform:translate(-50%,-50%) scale(0.95)}50%{transform:translate(-50%,-50%) scale(1.1)}}
      `}</style>
    </div>
  );
}

function GBox({ children, style = {}, glow = null }) {
  return (
    <div style={{
      background:"rgba(8,22,40,0.7)", backdropFilter:"blur(22px)", WebkitBackdropFilter:"blur(22px)",
      border:`1px solid ${glow ? `${glow}30` : T.border}`, borderRadius:16,
      boxShadow: glow
        ? `0 4px 24px rgba(0,0,0,0.4),0 0 22px ${glow}14`
        : "0 4px 20px rgba(0,0,0,0.38),inset 0 1px 0 rgba(255,255,255,0.025)",
      ...style,
    }}>
      {children}
    </div>
  );
}

function EvidenceBadge({ level }) {
  const map = {
    "Level A": { bg:"rgba(0,229,192,0.12)", br:"rgba(0,229,192,0.4)", c:"#00e5c0" },
    "Level B": { bg:"rgba(59,158,255,0.12)", br:"rgba(59,158,255,0.4)", c:"#3b9eff" },
    "Level C": { bg:"rgba(245,200,66,0.1)", br:"rgba(245,200,66,0.4)", c:"#f5c842" },
  };
  const s = map[level] || { bg:"rgba(155,109,255,0.1)", br:"rgba(155,109,255,0.3)", c:"#9b6dff" };
  return (
    <span style={{
      fontSize:9, fontFamily:"'JetBrains Mono',monospace", fontWeight:700,
      padding:"2px 7px", borderRadius:20,
      background:s.bg, border:`1px solid ${s.br}`, color:s.c, whiteSpace:"nowrap",
    }}>
      {level}
    </span>
  );
}

function TimeBanner() {
  return (
    <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
      {TIME_TARGETS.map((t, i) => (
        <div key={i} style={{
          flex:"1 1 150px",
          background:"rgba(8,22,40,0.7)", border:`1px solid ${T.border}`,
          borderRadius:10, padding:"9px 13px",
          display:"flex", alignItems:"center", gap:9,
          backdropFilter:"blur(12px)",
        }}>
          <span style={{ fontSize:18 }}>{t.icon}</span>
          <div>
            <div style={{ fontSize:10, color:T.txt3 }}>{t.label}</div>
            <div style={{ fontSize:13, fontWeight:700, color:t.color, fontFamily:"'JetBrains Mono',monospace" }}>
              {t.target}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function WorkupItem({ item, checked, onToggle }) {
  return (
    <div onClick={onToggle} style={{
      display:"grid", gridTemplateColumns:"32px 1fr", gap:10, alignItems:"center",
      background: checked ? `${AC}08` : "rgba(14,37,68,0.45)",
      border:`1px solid ${checked ? `${AC}35` : T.border}`,
      borderRadius:9, padding:"9px 12px", cursor:"pointer",
      transition:"all .18s", backdropFilter:"blur(8px)", marginBottom:6,
    }}>
      <div style={{
        width:28, height:28, borderRadius:8, flexShrink:0,
        background: checked ? `${AC}18` : "rgba(59,158,255,0.08)",
        border:`1px solid ${checked ? `${AC}45` : "rgba(59,158,255,0.25)"}`,
        display:"flex", alignItems:"center", justifyContent:"center", fontSize:14,
      }}>
        {checked ? "✓" : item.icon}
      </div>
      <div>
        <div style={{ fontSize:12, fontWeight:600, color: checked ? AC : T.txt, textDecoration: checked ? "line-through" : "none" }}>
          {item.label}
        </div>
        <div style={{ fontSize:11, color:T.txt3, marginTop:2, lineHeight:1.4 }}>
          {item.detail}
        </div>
      </div>
    </div>
  );
}

function DrugRow({ rx }) {
  return (
    <div style={{
      background:"rgba(14,37,68,0.5)", border:`1px solid ${T.border}`,
      borderRadius:9, padding:"9px 13px", marginBottom:5, backdropFilter:"blur(8px)",
    }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8, marginBottom:rx.note ? 4 : 0 }}>
        <div>
          <span style={{ fontSize:12, fontWeight:700, color:T.txt }}>{rx.drug}</span>
          {rx.cat && <span style={{ fontSize:10, marginLeft:8, color:T.txt3 }}>{rx.cat}</span>}
        </div>
        {rx.ref && <EvidenceBadge level={rx.ref}/>}
      </div>
      <div style={{ fontSize:12, color:T.txt2, fontFamily:"'JetBrains Mono',monospace", lineHeight:1.5, marginBottom: rx.note ? 4 : 0 }}>
        {rx.dose}
      </div>
      {rx.note && (
        <div style={{ fontSize:10, color:T.txt3, lineHeight:1.4 }}>{rx.note}</div>
      )}
    </div>
  );
}

function SectionHeader({ icon, title, sub }) {
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:10,
      marginBottom:16, paddingBottom:12, borderBottom:`1px solid ${T.border}`,
    }}>
      <span style={{ fontSize:18 }}>{icon}</span>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:14, fontWeight:700, color:T.txt }}>{title}</div>
        {sub && <div style={{ fontSize:11, color:T.txt3, marginTop:1 }}>{sub}</div>}
      </div>
      <span style={{
        fontSize:9, fontFamily:"'JetBrains Mono',monospace", fontWeight:700,
        padding:"3px 10px", borderRadius:20,
        background:`${AC}12`, border:`1px solid ${AC}30`, color:AC,
      }}>
        Guideline-Based
      </span>
    </div>
  );
}

function ConditionPage({ condition, onBack, contentMap }) {
  const data = contentMap?.[condition.id] || CLINICAL_DATA[condition.id] || {};
  const [tab, setTab] = useState("overview");
  const [checked, setChecked] = useState({});

  const TABS = [
    { id:"overview",  label:"Overview",   icon:"📋" },
    { id:"workup",    label:"Workup",     icon:"✅" },
    { id:"treatment", label:"Treatment",  icon:"💊" },
    { id:"followup",  label:"Follow-up",  icon:"📅" },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <GBox style={{
        padding:"18px 22px", position:"relative", overflow:"hidden",
        borderLeft:`3px solid ${condition.color}`,
        boxShadow:`0 4px 24px rgba(0,0,0,0.45),0 0 22px ${condition.glass.replace("0.07","0.14")}`,
      }}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:2, borderRadius:"16px 16px 0 0", background:`linear-gradient(90deg,${condition.color},transparent)` }}/>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <button onClick={onBack} style={{
            background:"rgba(26,53,85,0.6)", border:`1px solid ${T.borderHi}`,
            borderRadius:8, padding:"5px 12px", color:T.txt3, fontSize:11,
            cursor:"pointer", fontFamily:"'DM Sans',sans-serif", backdropFilter:"blur(8px)", flexShrink:0,
          }}>
            ← Back
          </button>
          <div style={{
            width:52, height:52, borderRadius:14, flexShrink:0,
            background:condition.glass.replace("0.07","0.28"),
            border:`1px solid ${condition.border}`,
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:24,
          }}>
            {condition.icon}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:4 }}>
              <span style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, color:T.txt, lineHeight:1 }}>
                {condition.title}
              </span>
              <span style={{
                fontSize:9, fontFamily:"'JetBrains Mono',monospace", fontWeight:700,
                padding:"2px 8px", borderRadius:20,
                background:`${condition.color}14`, border:`1px solid ${condition.color}35`, color:condition.color,
              }}>
                {condition.acog}
              </span>
            </div>
            <div style={{ fontSize:12, color:T.txt3 }}>{condition.subtitle}</div>
          </div>
          <div style={{
            textAlign:"center", background:"rgba(14,37,68,0.6)", borderRadius:10,
            padding:"8px 14px", border:`1px solid ${T.border}`, flexShrink:0,
          }}>
            <div style={{ fontSize:9, color:T.txt4, textTransform:"uppercase", letterSpacing:".06em", marginBottom:2 }}>Category</div>
            <div style={{ fontSize:11, fontWeight:700, color:condition.color, fontFamily:"'JetBrains Mono',monospace" }}>
              {condition.category}
            </div>
          </div>
        </div>
      </GBox>

      <div style={{
        display:"flex", gap:4,
        background:"rgba(8,22,40,0.7)", border:`1px solid ${T.border}`,
        borderRadius:12, padding:4, backdropFilter:"blur(14px)",
      }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            display:"flex", alignItems:"center", gap:6,
            padding:"8px 16px", borderRadius:9,
            fontSize:12, fontWeight: tab===t.id ? 700 : 500,
            fontFamily:"'DM Sans',sans-serif", cursor:"pointer", whiteSpace:"nowrap",
            transition:"all .2s",
            background: tab===t.id ? `${condition.glass.replace("0.07","0.22")}` : "transparent",
            border: tab===t.id ? `1px solid ${condition.border}` : "1px solid transparent",
            color: tab===t.id ? condition.color : T.txt3,
          }}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      <GBox style={{ padding:"20px 22px" }}>
        {tab === "overview" && (
          <div>
            <SectionHeader icon="📋" title="Clinical Overview" sub={condition.title}/>
            <div style={{
              background:`${condition.glass.replace("0.07","0.14")}`, border:`1px solid ${condition.border}`,
              borderRadius:10, padding:"13px 16px", marginBottom:16, backdropFilter:"blur(8px)",
            }}>
              <div style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace", color:condition.accent, textTransform:"uppercase", letterSpacing:".08em", marginBottom:6 }}>
                Definition
              </div>
              <div style={{ fontSize:13, color:T.txt2, lineHeight:1.65 }}>{data.definition || "—"}</div>
            </div>
            {data.keyCriteria && data.keyCriteria.length > 0 && (
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:11, fontWeight:700, color:T.coral, marginBottom:8 }}>🚨 Key Criteria</div>
                {data.keyCriteria.map((c, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:8, marginBottom:6, fontSize:12, color:T.txt2 }}>
                    <span style={{ color:T.coral, flexShrink:0, marginTop:1 }}>▸</span>{c}
                  </div>
                ))}
              </div>
            )}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
              {[
                { label:"Incidence",            value:condition.incidence, color:condition.color },
                { label:"Clinical Significance", value:condition.severity,  color:T.coral },
              ].map((s, i) => (
                <div key={i} style={{
                  background:"rgba(14,37,68,0.5)", border:`1px solid ${T.border}`,
                  borderRadius:10, padding:"12px 14px", backdropFilter:"blur(8px)",
                }}>
                  <div style={{ fontSize:9, color:T.txt4, textTransform:"uppercase", letterSpacing:".07em", marginBottom:6 }}>{s.label}</div>
                  <div style={{ fontSize:13, fontWeight:700, color:s.color, lineHeight:1.35 }}>{s.value}</div>
                </div>
              ))}
            </div>
            <div style={{
              fontSize:10, color:T.txt4, fontFamily:"'JetBrains Mono',monospace",
              padding:"10px 13px", background:"rgba(14,37,68,0.4)",
              borderRadius:8, border:`1px solid ${T.border}`, lineHeight:1.7,
            }}>
              📚 {data.reference || "Reference pending"}
            </div>
          </div>
        )}

        {tab === "workup" && (
          <div>
            <SectionHeader icon="✅" title="Workup Checklist" sub="Tap items to mark complete"/>
            {(data.workup || []).map((item, i) => (
              <WorkupItem
                key={i} item={item}
                checked={!!checked[`w${i}`]}
                onToggle={() => setChecked(p => ({ ...p, [`w${i}`]: !p[`w${i}`] }))}
              />
            ))}
            {(!data.workup || data.workup.length === 0) && (
              <div style={{ color:T.txt3, fontSize:12, textAlign:"center", padding:"24px 0" }}>No workup items defined.</div>
            )}
          </div>
        )}

        {tab === "treatment" && (
          <div>
            <SectionHeader icon="💊" title="Treatment Protocol" sub="Evidence-based management"/>
            <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:14 }}>
              {[
                { l:"Level A", d:"Good and consistent scientific evidence",    c:"rgba(0,229,192,0.9)" },
                { l:"Level B", d:"Limited or inconsistent evidence",            c:"rgba(59,158,255,0.9)" },
                { l:"Level C", d:"Primarily consensus and expert opinion",      c:"rgba(245,200,66,0.9)" },
              ].map((e, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:5, fontSize:10, color:e.c }}>
                  <span style={{ width:10, height:10, borderRadius:2, background:`${e.c}20`, border:`1px solid ${e.c}40` }}/>
                  {e.l}: <span style={{ color:T.txt3 }}>{e.d}</span>
                </div>
              ))}
            </div>
            {(data.treatment || []).map((rx, i) => <DrugRow key={i} rx={rx}/>)}
            {(!data.treatment || data.treatment.length === 0) && (
              <div style={{ color:T.txt3, fontSize:12, textAlign:"center", padding:"24px 0" }}>No treatment entries defined.</div>
            )}
          </div>
        )}

        {tab === "followup" && (
          <div>
            <SectionHeader icon="📅" title="Follow-up & Disposition" sub="Post-acute care, referrals, monitoring"/>
            <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
              {(data.followup || []).map((f, i) => (
                <div key={i} style={{
                  display:"flex", alignItems:"flex-start", gap:10,
                  background:"rgba(14,37,68,0.45)", border:`1px solid ${T.border}`,
                  borderRadius:9, padding:"10px 13px", backdropFilter:"blur(8px)",
                }}>
                  <div style={{
                    width:26, height:26, borderRadius:7, flexShrink:0,
                    background:`${condition.glass.replace("0.07","0.22")}`,
                    border:`1px solid ${condition.border}`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:12, color:condition.color, fontWeight:700,
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ fontSize:12, color:T.txt2, lineHeight:1.55 }}>{f}</div>
                </div>
              ))}
            </div>
            <div style={{
              marginTop:16, fontSize:10, color:T.txt4, fontFamily:"'JetBrains Mono',monospace",
              padding:"10px 13px", background:"rgba(14,37,68,0.4)",
              borderRadius:8, border:`1px solid ${T.border}`, lineHeight:1.7,
            }}>
              ⚠ Clinical decision support only — final management decisions rest with the treating physician
              <br/>📚 {data.reference || "Reference pending"}
            </div>
          </div>
        )}
      </GBox>
    </div>
  );
}

function ConditionCard({ condition, onSelect, index }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={() => onSelect(condition)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position:"relative", borderRadius:18, padding:"20px 20px 16px",
        cursor:"pointer", overflow:"hidden",
        transition:"all 0.32s cubic-bezier(0.34,1.56,0.64,1)",
        transform: hov ? "translateY(-6px) scale(1.022)" : "translateY(0) scale(1)",
        animation:`aw-in 0.52s ease both ${index * 0.055}s`,
        background: hov
          ? `linear-gradient(135deg,${condition.glass.replace("0.07","0.22")},${condition.glass})`
          : "rgba(8,22,40,0.68)",
        backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)",
        border:`1px solid ${hov ? condition.border : T.border}`,
        boxShadow: hov
          ? `0 20px 44px rgba(0,0,0,0.5),0 0 0 1px ${condition.border},inset 0 1px 0 rgba(255,255,255,0.06),0 0 32px ${condition.glass.replace("0.07","0.16")}`
          : "0 4px 18px rgba(0,0,0,0.38),inset 0 1px 0 rgba(255,255,255,0.025)",
      }}
    >
      <div style={{
        position:"absolute", top:-45, right:-45, width:160, height:160, borderRadius:"50%",
        background:`radial-gradient(circle,${condition.glass.replace("0.07","0.24")} 0%,transparent 70%)`,
        opacity: hov ? 1 : 0, transition:"opacity 0.3s", pointerEvents:"none",
      }}/>
      <div style={{
        position:"absolute", top:0, left:0, right:0, height:2, borderRadius:"18px 18px 0 0",
        background:`linear-gradient(90deg,${condition.color},transparent)`,
        opacity: hov ? 1 : 0.22, transition:"opacity 0.3s",
      }}/>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:12 }}>
        <div style={{
          width:48, height:48, borderRadius:13, flexShrink:0,
          background:condition.glass.replace("0.07","0.28"), border:`1px solid ${condition.border}`,
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:22,
          boxShadow: hov ? `0 0 18px ${condition.glass.replace("0.07","0.28")}` : "none",
          transition:"box-shadow 0.3s",
        }}>
          {condition.icon}
        </div>
        <span style={{
          fontSize:9, fontFamily:"'JetBrains Mono',monospace", fontWeight:700,
          padding:"2px 8px", borderRadius:20,
          background:condition.glass.replace("0.07","0.2"),
          border:`1px solid ${condition.border}`, color:condition.color,
          letterSpacing:".05em", backdropFilter:"blur(6px)",
        }}>
          {condition.acog}
        </span>
      </div>
      <div style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:condition.accent, letterSpacing:".12em", textTransform:"uppercase", marginBottom:3, opacity:0.85 }}>
        {condition.category}
      </div>
      <div style={{ fontSize:14, fontFamily:"'Playfair Display',serif", fontWeight:600, color:T.txt, lineHeight:1.25, marginBottom:4 }}>
        {condition.title}
      </div>
      <div style={{ fontSize:11, color:T.txt3, lineHeight:1.4, marginBottom:12 }}>
        {condition.subtitle}
      </div>
      <div style={{ height:1, background:`linear-gradient(90deg,${condition.border},transparent)`, marginBottom:10 }}/>
      <div style={{ fontSize:10, color:T.txt3, lineHeight:1.35 }}>{condition.severity}</div>
      <div style={{
        position:"absolute", bottom:14, right:14,
        width:26, height:26, borderRadius:"50%",
        background:condition.glass.replace("0.07","0.18"), border:`1px solid ${condition.border}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:12, color:condition.color,
        opacity: hov ? 1 : 0,
        transform: hov ? "scale(1) translateX(0)" : "scale(0.6) translateX(-6px)",
        transition:"all 0.22s ease",
      }}>
        →
      </div>
      <style>{`@keyframes aw-in{from{opacity:0;transform:translateY(18px) scale(0.96)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>
    </div>
  );
}

export default function AirwayHub({ onBack }) {
  const navigate = useNavigate();
  const [selected,   setSelected]   = useState(null);
  const [search,     setSearch]     = useState("");
  const [category,   setCategory]   = useState("All");
  const [contentMap, setContentMap] = useState({});

  useEffect(() => {
    base44.entities.ProtocolContent.filter({ hub_id: "airway" })
      .then(records => {
        const map = {};
        records.forEach(r => { if (r.condition_id) map[r.condition_id] = r; });
        setContentMap(map);
      })
      .catch(() => {});
  }, []);

  const allCats = ["All", ...CATEGORIES];

  const filtered = CONDITIONS
    .filter(c => category === "All" || c.category === category)
    .filter(c => !search
      || c.title.toLowerCase().includes(search.toLowerCase())
      || c.subtitle.toLowerCase().includes(search.toLowerCase())
      || c.category.toLowerCase().includes(search.toLowerCase())
    );

  const handleBack = useCallback(() => {
    if (onBack) onBack();
    else navigate("/hub");
  }, [onBack, navigate]);

  if (selected) {
    return (
      <div style={{ minHeight:"100vh", background:T.bg, fontFamily:"'DM Sans',sans-serif", position:"relative" }}>
        <GlassBg/>
        <div style={{ position:"relative", zIndex:1, padding:"28px 36px 48px", maxWidth:1100, margin:"0 auto" }}>
          <ConditionPage condition={selected} onBack={() => setSelected(null)} contentMap={contentMap}/>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:T.bg, fontFamily:"'DM Sans',sans-serif", position:"relative" }}>
      <GlassBg/>
      <div style={{ position:"relative", zIndex:1, padding:"24px 36px 48px", maxWidth:1300, margin:"0 auto" }}>

        {/* Back */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
          <button
            onClick={handleBack}
            style={{
              display:"flex", alignItems:"center", gap:8,
              padding:"9px 20px", cursor:"pointer",
              background:"rgba(8,22,40,0.85)", border:`1px solid ${AC}38`,
              borderRadius:12, color:AC,
              fontSize:12, fontWeight:700, fontFamily:"'DM Sans',sans-serif",
              backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)",
              transition:"all .22s", boxShadow:`0 0 16px ${AC}12`,
            }}
            onMouseEnter={e => { e.currentTarget.style.background=`${AC}14`; e.currentTarget.style.transform="translateX(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.background="rgba(8,22,40,0.85)"; e.currentTarget.style.transform="translateX(0)"; }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7L9 12" stroke={AC} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Hub
          </button>
          <div style={{ height:1, flex:1, background:`linear-gradient(90deg,${AC}22,transparent)` }}/>
          <span style={{ fontSize:10, color:T.txt4, fontFamily:"'JetBrains Mono',monospace" }}>
            Notrya · {HUB_CONFIG.name}
          </span>
        </div>

        {/* Hero */}
        <GBox style={{
          padding:"26px 30px 22px", marginBottom:18,
          position:"relative", overflow:"hidden",
          boxShadow:`0 8px 40px rgba(0,0,0,0.55),0 0 28px ${AC}0e,inset 0 1px 0 rgba(255,255,255,0.04)`,
        }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:2.5, borderRadius:"16px 16px 0 0", background:`linear-gradient(90deg,${AC},${AC}80,${AC}30,${AC})` }}/>
          <div style={{ position:"absolute", inset:0, background:`linear-gradient(108deg,${AC}07 0%,transparent 55%,rgba(0,229,192,0.03) 100%)`, pointerEvents:"none" }}/>
          <div style={{ display:"flex", alignItems:"flex-start", gap:20, position:"relative" }}>
            <div style={{
              width:64, height:64, borderRadius:18, flexShrink:0,
              background:`linear-gradient(135deg,${AC}22,rgba(0,229,192,0.12))`,
              border:`1px solid ${AC}38`,
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:30,
              boxShadow:`0 0 24px ${AC}22`,
            }}>
              {HUB_CONFIG.icon}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6, flexWrap:"wrap" }}>
                <span style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:700, color:T.txt, letterSpacing:"-0.01em", lineHeight:1 }}>
                  {HUB_CONFIG.name}
                </span>
                <span style={{
                  fontSize:9, fontFamily:"'JetBrains Mono',monospace", fontWeight:700,
                  padding:"3px 10px", borderRadius:20,
                  background:`${AC}12`, color:AC, border:`1px solid ${AC}32`, letterSpacing:".06em",
                }}>
                  {HUB_CONFIG.badgeText}
                </span>
                <span style={{
                  fontSize:9, fontFamily:"'JetBrains Mono',monospace", fontWeight:700,
                  padding:"3px 10px", borderRadius:20,
                  background:"rgba(0,229,192,0.1)", color:"#00e5c0", border:"1px solid rgba(0,229,192,0.3)", letterSpacing:".06em",
                }}>
                  {CONDITIONS.length} PROTOCOLS
                </span>
              </div>
              <p style={{ fontSize:13, color:T.txt2, margin:0, lineHeight:1.65, maxWidth:580 }}>
                {HUB_CONFIG.description}
              </p>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, flexShrink:0 }}>
              {[
                { v: CONDITIONS.length, l:"Protocols",  c:AC },
                { v: CATEGORIES.length, l:"Categories", c:"#00e5c0" },
                { v: "DAS",             l:"Guidelines", c:T.gold },
                { v: "EM/ICU",          l:"Specialty",  c:T.purple },
              ].map((s, i) => (
                <div key={i} style={{
                  textAlign:"center", background:"rgba(14,37,68,0.7)",
                  borderRadius:10, padding:"8px 12px", border:`1px solid ${T.border}`,
                }}>
                  <div style={{ fontSize:14, fontWeight:700, color:s.c, fontFamily:"'JetBrains Mono',monospace", lineHeight:1 }}>{s.v}</div>
                  <div style={{ fontSize:9, color:T.txt4, marginTop:3, textTransform:"uppercase", letterSpacing:".06em" }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </GBox>

        {/* Alert banner */}
        <div style={{
          background:`${AC}09`, border:`1px solid ${AC}28`,
          borderRadius:12, padding:"10px 16px", marginBottom:16,
          display:"flex", alignItems:"center", gap:12, backdropFilter:"blur(12px)",
        }}>
          <div style={{ width:8, height:8, borderRadius:"50%", background:AC, flexShrink:0, animation:"aw-pulse 1.5s ease-in-out infinite" }}/>
          <span style={{ fontSize:11, color:AC, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, flexShrink:0 }}>
            AIRWAY PROTOCOLS
          </span>
          <span style={{ fontSize:11, color:T.txt2 }}>
            Clinical decision support only — all protocols follow DAS, NAEMSP/ACEP, ARDSnet and BTF guidelines. Final clinical decisions rest with the treating physician.
          </span>
          <style>{`@keyframes aw-pulse{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(59,158,255,.4)}50%{opacity:.8;box-shadow:0 0 0 6px rgba(59,158,255,0)}}`}</style>
        </div>

        {/* Time targets */}
        <div style={{ marginBottom:18 }}>
          <TimeBanner/>
        </div>

        {/* Search + filter */}
        <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:16, flexWrap:"wrap" }}>
          <div style={{ position:"relative", flex:1, maxWidth:380 }}>
            <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", fontSize:14, opacity:0.35 }}>🔍</span>
            <input
              type="text" placeholder="Search protocols…"
              value={search} onChange={e => setSearch(e.target.value)}
              style={{
                width:"100%", background:"rgba(8,22,40,0.8)",
                border:`1px solid rgba(42,79,122,0.6)`, borderRadius:11,
                padding:"10px 14px 10px 40px",
                color:T.txt, fontFamily:"'DM Sans',sans-serif", fontSize:13, outline:"none",
                backdropFilter:"blur(14px)", transition:"border-color .2s",
              }}
              onFocus={e => e.target.style.borderColor=`${AC}55`}
              onBlur={e  => e.target.style.borderColor="rgba(42,79,122,0.6)"}
            />
          </div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {allCats.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)} style={{
                padding:"8px 16px", borderRadius:24, fontSize:12, fontWeight:600,
                fontFamily:"'DM Sans',sans-serif", cursor:"pointer", transition:"all .2s",
                background: category===cat ? `${AC}16` : "rgba(8,22,40,0.75)",
                border:`1px solid ${category===cat ? `${AC}45` : "rgba(42,79,122,0.5)"}`,
                color: category===cat ? AC : T.txt3,
                backdropFilter:"blur(12px)",
                boxShadow: category===cat ? `0 0 12px ${AC}18` : "none",
              }}>
                {cat}
              </button>
            ))}
          </div>
          <span style={{ fontSize:11, color:T.txt4, fontFamily:"'JetBrains Mono',monospace", marginLeft:"auto" }}>
            {filtered.length} protocol{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Section label */}
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
          <div style={{ height:1, width:20, background:`${AC}50`, borderRadius:1 }}/>
          <span style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace", color:AC, textTransform:"uppercase", letterSpacing:".12em", fontWeight:700 }}>
            {category === "All" ? "All Protocols" : category}
          </span>
          <div style={{ flex:1, height:1, background:`linear-gradient(90deg,${AC}28,transparent)` }}/>
        </div>

        {/* Cards */}
        {filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"60px 0", color:T.txt3 }}>
            <div style={{ fontSize:36, marginBottom:12 }}>🔍</div>
            <div style={{ fontSize:14, fontFamily:"'Playfair Display',serif" }}>No protocols found</div>
            <div style={{ fontSize:12, marginTop:6 }}>Try a different search or category</div>
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:13 }}>
            {filtered.map((c, i) => (
              <ConditionCard key={c.id} condition={c} onSelect={setSelected} index={i}/>
            ))}
          </div>
        )}

        {/* Evidence footer */}
        <div style={{
          marginTop:28, borderRadius:12, padding:"12px 18px",
          background:"rgba(5,15,30,0.65)", border:`1px solid ${T.border}`,
          backdropFilter:"blur(12px)", display:"flex", alignItems:"center", gap:14, flexWrap:"wrap",
        }}>
          <span style={{ fontSize:10, color:AC, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, flexShrink:0 }}>
            ⚕ EVIDENCE BASE
          </span>
          {HUB_CONFIG.evidenceBase.map((ref, i) => (
            <span key={i} style={{ fontSize:10, color:T.txt4 }}>
              {i > 0 && <span style={{ marginRight:10, color:T.txt4 }}>·</span>}
              {ref}
            </span>
          ))}
        </div>

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        input::placeholder { color: #2e4a6a; }
        button { outline: none; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1a3555; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #2a4f7a; }
      `}</style>
    </div>
  );
}