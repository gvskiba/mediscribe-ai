/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║           NOTRYA CLINICAL HUB — TRAUMA HUB                  ║
 * ║           ATLS 11th Edition · ACS-COT 2023                  ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { useState, useCallback, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";

// ════════════════════════════════════════════════════════════
//  HUB IDENTITY
// ════════════════════════════════════════════════════════════
const HUB_CONFIG = {
  name:        "Trauma Hub",
  subtitle:    "Primary Survey · Haemorrhage · Damage Control · MTP · Secondary Survey",
  icon:        "🚨",
  accentColor: "#ff9f43",
  badgeText:   "ATLS 11th Ed",
  description: "Comprehensive ATLS 11th Edition trauma management covering primary and secondary survey, haemorrhage control, damage control resuscitation and surgery, massive transfusion protocol, and complete imaging/laboratory workup for the emergency trauma physician.",
  evidenceBase: [
    "ATLS 11th Edition — ACS Committee on Trauma, 2023",
    "PROPPR Trial — JAMA 2015",
    "CRASH-2 / MATTERs — Lancet 2010 / Arch Surg 2012",
    "Brain Trauma Foundation Guidelines 4th Edition — 2023",
    "EAST & Western Trauma Association Practice Management Guidelines",
    "Damage Control Resuscitation — JTrauma 2022",
  ],
};

// ════════════════════════════════════════════════════════════
//  CATEGORIES
// ════════════════════════════════════════════════════════════
const CATEGORIES = [
  "Primary Survey",
  "Haemorrhage Control",
  "Damage Control",
  "Transfusion",
  "Secondary Survey",
];

// ════════════════════════════════════════════════════════════
//  CONDITIONS REGISTRY
// ════════════════════════════════════════════════════════════
const CONDITIONS = [
  // ── PRIMARY SURVEY ─────────────────────────────────────────
  {
    id: "primary_survey",
    icon: "🔍",
    title: "ABCDE Primary Survey",
    subtitle: "Systematic life-threat identification & simultaneous management",
    acog: "ATLS Ch.1",
    incidence: "All trauma patients",
    severity: "First-pass mortality prevention — resuscitation begins simultaneously with assessment",
    category: "Primary Survey",
    color: "#ff9f43", glass: "rgba(255,159,67,0.07)", border: "rgba(255,159,67,0.28)", accent: "#ffb96e",
  },
  {
    id: "airway",
    icon: "🫁",
    title: "Airway & C-Spine Control",
    subtitle: "Definitive airway with in-line C-spine stabilisation",
    acog: "ATLS Ch.2",
    incidence: "~15% of major trauma",
    severity: "Airway compromise — leading preventable cause of trauma death",
    category: "Primary Survey",
    color: "#3b9eff", glass: "rgba(59,158,255,0.07)", border: "rgba(59,158,255,0.28)", accent: "#6eb5ff",
  },
  {
    id: "tension_ptx",
    icon: "💨",
    title: "Tension Pneumothorax",
    subtitle: "Life-threatening — clinical diagnosis, do not delay for imaging",
    acog: "ATLS Ch.4",
    incidence: "5% of major trauma",
    severity: "Rapidly fatal if untreated — never wait for CXR to decompress",
    category: "Primary Survey",
    color: "#00d4ff", glass: "rgba(0,212,255,0.07)", border: "rgba(0,212,255,0.28)", accent: "#33ddff",
  },
  {
    id: "fast_imaging",
    icon: "📡",
    title: "FAST & Trauma Imaging",
    subtitle: "E-FAST · CXR · Pelvis XR · CT Pan-Scan — pathway by stability",
    acog: "ATLS Ch.5",
    incidence: "Universal workup",
    severity: "E-FAST sensitivity ~73% for haemoperitoneum — guides resuscitation pathway",
    category: "Primary Survey",
    color: "#00e5c0", glass: "rgba(0,229,192,0.07)", border: "rgba(0,229,192,0.28)", accent: "#33eccc",
  },

  // ── HAEMORRHAGE CONTROL ─────────────────────────────────────
  {
    id: "hemorrhagic_shock",
    icon: "🩸",
    title: "Haemorrhagic Shock",
    subtitle: "Class I–IV — ATLS 11th Edition Classification",
    acog: "ATLS Ch.3",
    incidence: "30–40% of trauma deaths",
    severity: "No.1 preventable cause of trauma death — immediate haemostasis mandatory",
    category: "Haemorrhage Control",
    color: "#ff6b6b", glass: "rgba(255,107,107,0.07)", border: "rgba(255,107,107,0.28)", accent: "#ff9999",
  },
  {
    id: "txa",
    icon: "💉",
    title: "Tranexamic Acid (TXA)",
    subtitle: "CRASH-2 / MATTERs — time-critical antifibrinolytic",
    acog: "CRASH-2",
    incidence: "All significant haemorrhage",
    severity: "14% relative mortality reduction — benefit is lost after 3 hours of injury",
    category: "Haemorrhage Control",
    color: "#f5c842", glass: "rgba(245,200,66,0.07)", border: "rgba(245,200,66,0.28)", accent: "#f7d875",
  },
  {
    id: "pelvic_fracture",
    icon: "🦴",
    title: "Pelvic Fracture Haemorrhage",
    subtitle: "Unstable pelvic ring — massive retroperitoneal haemorrhage",
    acog: "ATLS Ch.3",
    incidence: "8–9% of blunt trauma",
    severity: "Mortality 10–50% in open book/vertical shear — early binder application critical",
    category: "Haemorrhage Control",
    color: "#ff9f43", glass: "rgba(255,159,67,0.07)", border: "rgba(255,159,67,0.28)", accent: "#ffb96e",
  },

  // ── DAMAGE CONTROL ──────────────────────────────────────────
  {
    id: "dcr",
    icon: "⚙️",
    title: "Damage Control Resuscitation",
    subtitle: "Permissive hypotension · Haemostatic resuscitation · Lethal triad prevention",
    acog: "DCR Guidelines",
    incidence: "All Class III–IV haemorrhage",
    severity: "Lethal triad (hypothermia + acidosis + coagulopathy) mortality >90% untreated",
    category: "Damage Control",
    color: "#9b6dff", glass: "rgba(155,109,255,0.07)", border: "rgba(155,109,255,0.28)", accent: "#b99bff",
  },
  {
    id: "dcs",
    icon: "🔪",
    title: "Damage Control Surgery",
    subtitle: "Abbreviated laparotomy — haemostasis, contamination control, pack & close",
    acog: "ACS-COT",
    incidence: "5–10% of trauma laparotomies",
    severity: "Physiologic survival over anatomic repair — defer definitive repair until stabilised",
    category: "Damage Control",
    color: "#ff6b6b", glass: "rgba(255,107,107,0.07)", border: "rgba(255,107,107,0.28)", accent: "#ff9999",
  },

  // ── TRANSFUSION ─────────────────────────────────────────────
  {
    id: "mtp",
    icon: "🏥",
    title: "Massive Transfusion Protocol",
    subtitle: "1:1:1 ratio — pRBC : FFP : Platelets (PROPPR Trial)",
    acog: "PROPPR 2015",
    incidence: "3–5% of major trauma",
    severity: "Early MTP activation reduces 24h mortality — empiric balanced haemostatic resuscitation",
    category: "Transfusion",
    color: "#ff6b6b", glass: "rgba(255,107,107,0.07)", border: "rgba(255,107,107,0.28)", accent: "#ff9999",
  },
  {
    id: "coagulopathy",
    icon: "🧪",
    title: "Trauma-Induced Coagulopathy",
    subtitle: "Acute Coagulopathy of Trauma-Shock (ACoTS) — TEG/ROTEM guided",
    acog: "ATLS Ch.3",
    incidence: "25–35% of severe trauma",
    severity: "Independent mortality predictor — early TEG/ROTEM-guided correction mandatory",
    category: "Transfusion",
    color: "#f5c842", glass: "rgba(245,200,66,0.07)", border: "rgba(245,200,66,0.28)", accent: "#f7d875",
  },

  // ── SECONDARY SURVEY ────────────────────────────────────────
  {
    id: "tbi",
    icon: "🧠",
    title: "Traumatic Brain Injury",
    subtitle: "Mild · Moderate · Severe — secondary injury prevention",
    acog: "BTF 2023",
    incidence: "30% of injury deaths",
    severity: "Avoid hypoxia (SpO₂ <90%) and hypotension (SBP <90) — both double mortality",
    category: "Secondary Survey",
    color: "#9b6dff", glass: "rgba(155,109,255,0.07)", border: "rgba(155,109,255,0.28)", accent: "#b99bff",
  },
  {
    id: "thoracic_trauma",
    icon: "💔",
    title: "Thoracic Trauma",
    subtitle: "Haemothorax · Tension PTX · Aortic injury · Cardiac tamponade · Flail chest",
    acog: "ATLS Ch.4",
    incidence: "25% of trauma deaths",
    severity: "85% managed non-operatively — tube thoracostomy resolves 80% of haemopneumothorax",
    category: "Secondary Survey",
    color: "#3b9eff", glass: "rgba(59,158,255,0.07)", border: "rgba(59,158,255,0.28)", accent: "#6eb5ff",
  },
  {
    id: "abdominal_trauma",
    icon: "🫀",
    title: "Abdominal Trauma",
    subtitle: "Solid organ · Hollow viscus · Vascular — NOM vs operative decision",
    acog: "ATLS Ch.5",
    incidence: "20% of surgical trauma",
    severity: "Delayed hollow viscus injury diagnosis carries 30% mortality — serial exams mandatory",
    category: "Secondary Survey",
    color: "#00e5c0", glass: "rgba(0,229,192,0.07)", border: "rgba(0,229,192,0.28)", accent: "#33eccc",
  },
];

// ════════════════════════════════════════════════════════════
//  TIME TARGETS
// ════════════════════════════════════════════════════════════
const TIME_TARGETS = [
  { icon:"⏱", label:"Golden Hour",        target:"< 60 min",  color:"#ff6b6b" },
  { icon:"🫁", label:"Airway Secured",     target:"< 2 min",   color:"#ff9f43" },
  { icon:"🩸", label:"MTP Activation",     target:"< 10 min",  color:"#f5c842" },
  { icon:"✂️", label:"OR (Damage Control)", target:"< 60 min", color:"#9b6dff" },
];

// ════════════════════════════════════════════════════════════
//  CLINICAL DATA
// ════════════════════════════════════════════════════════════
const CLINICAL_DATA = {

  primary_survey: {
    definition: "The ATLS primary survey is a systematic, simultaneous assessment and management of immediately life-threatening injuries via the ABCDE sequence: Airway with C-spine protection, Breathing and ventilation, Circulation with haemorrhage control, Disability (neurological status), and Exposure/Environment control. Resuscitation begins simultaneously with each step — do not advance until each life threat is identified and treated.",
    keyCriteria: [
      "A — Airway: Patent? Obstruction (blood, vomitus, foreign body)? GCS ≤8 = definitive airway",
      "B — Breathing: RR, SpO₂, bilateral breath sounds, chest rise, tracheal deviation, JVD",
      "C — Circulation: HR, BP, skin colour/temperature, capillary refill, active external haemorrhage, shock class",
      "D — Disability: GCS (E/V/M), pupils (size, reactivity, symmetry), blood glucose level",
      "E — Exposure: Fully undress patient, complete logroll, examine ALL surfaces, prevent hypothermia immediately",
      "Adjuncts: E-FAST, CXR, pelvis XR, ABG, labs, 2 large-bore IVs, monitoring, IDC, NGT",
    ],
    workup: [
      { icon:"📡", label:"E-FAST Examination", detail:"Cardiac (pericardial effusion/tamponade), bilateral pleural (haemothorax/PTX), hepatorenal (Morrison's pouch), splenorenal, suprapubic (Douglas pouch). Sensitivity ~73%, specificity ~95% for haemoperitoneum." },
      { icon:"🩻", label:"CXR — Portable AP", detail:"Haemopneumothorax, mediastinal widening >8 cm (aortic injury), tracheal deviation, rib fractures, diaphragm elevation, subcutaneous emphysema, ETT/ICC position." },
      { icon:"🦴", label:"Pelvis AP XR — Portable", detail:"Pelvic ring disruption, pubic symphysis diastasis >2.5 cm (open book), vertical shear. Mandatory in blunt trauma with unexplained haemodynamic instability. Apply binder before XR if clinically unstable." },
      { icon:"🩸", label:"ABG with Lactate", detail:"Lactate >4 mmol/L = severe shock. Base deficit <−6 = significant haemorrhage. pH <7.2 = critical. Repeat every 30 min to guide resuscitation. Target lactate clearance ≥10%/h." },
      { icon:"🧪", label:"Full Trauma Labs Panel", detail:"FBC, coagulation panel (PT/APTT/INR/fibrinogen), TEG or ROTEM, UEC, LFTs, lipase, ABG + lactate, crossmatch (×6 units minimum), troponin, urinalysis, βhCG (all reproductive-age females)." },
      { icon:"🌡", label:"Core Temperature", detail:"Hypothermia <35°C worsens coagulopathy exponentially. <32°C = severe — active internal rewarming required. Warm IV fluids (38–40°C), forced warm air blankets, warm ambient temperature, minimise exposure time." },
      { icon:"📊", label:"Continuous Monitoring", detail:"ECG, SpO₂, EtCO₂ (post-intubation), BP (non-invasive then arterial line), urine output ≥0.5 mL/kg/h target, temperature." },
    ],
    treatment: [
      { cat:"Airway", drug:"RSI — Ketamine + Rocuronium", dose:"Ketamine 1.5–2 mg/kg IV + Rocuronium 1.2 mg/kg IV", note:"Ketamine preferred in haemodynamic instability — maintains sympathetic tone. Video laryngoscopy first-line. Surgical airway immediately available.", ref:"Level A" },
      { cat:"Airway", drug:"Cricothyroidotomy", dose:"Surgical (horizontal CTM incision) or Seldinger technique — size 6.0 cuffed ETT or tracheostomy tube", note:"CICV (cannot intubate/cannot oxygenate) scenario. Make the decision early. Convert to formal tracheostomy within 72 hours.", ref:"Level A" },
      { cat:"Breathing", drug:"Needle Decompression", dose:"14G IV catheter — 2nd ICS MCL OR 4th–5th ICS AAL (preferred, lower failure rate)", note:"Tension PTX is a clinical diagnosis — NEVER delay for imaging. Convert immediately to finger thoracostomy + ICC.", ref:"Level A" },
      { cat:"Circulation", drug:"IV Access — 2 large-bore IVs", dose:"≥16G bilateral antecubital fossae; IO (humeral head) if peripheral IV unavailable within 2 attempts", note:"IO is fully equivalent to IV for resuscitation and drug administration. Intraosseous humerus preferred in adults.", ref:"Level A" },
      { cat:"Circulation", drug:"Permissive Hypotension", dose:"Target SBP 80–90 mmHg (blunt trauma) or 50–70 mmHg (penetrating) until operative haemostasis", note:"Exception: TBI — maintain SBP ≥90 mmHg at all times. Limit crystalloid to ≤1L warm Hartmann's; prioritise blood products.", ref:"Level A" },
      { cat:"Exposure", drug:"Hypothermia Prevention", dose:"Warm IV fluids 38–40°C, forced warm air blanket, raise ambient temperature ≥25°C, remove wet clothing immediately", note:"The lethal triad starts with hypothermia. Prevention is far more effective than treatment once established.", ref:"Level B" },
    ],
    followup: [
      "Reassess ABCDE after every intervention — repeat primary survey immediately if patient deteriorates",
      "Transition to secondary survey (AMPLE history + systematic head-to-toe exam) once primary complete and life threats treated",
      "Activate MTP early if haemodynamic instability with suspected haemorrhage — do not wait for labs",
      "Simultaneous team activation: OR, ICU, blood bank, haematology, radiology, surgical specialists",
      "Document all interventions with precise timestamps for trauma registry and legal records",
      "Tertiary survey within 24 hours and again at discharge — up to 15% of injuries are missed on primary/secondary",
    ],
    reference: "ATLS 11th Edition, ACS Committee on Trauma, 2023 — Chapter 1",
  },

  airway: {
    definition: "Airway management in trauma requires simultaneous in-line cervical spine stabilisation. Indications for definitive airway include: GCS ≤8, respiratory failure, airway obstruction, anticipated deterioration, haemodynamic instability requiring general anaesthesia, and penetrating neck injury with expanding haematoma. The preferred induction agent in trauma is ketamine.",
    keyCriteria: [
      "GCS ≤8 — definitive airway mandatory without delay",
      "Respiratory distress unresponsive to basic manoeuvres",
      "Penetrating neck injury with expanding haematoma or stridor",
      "Inhalation injury — hoarseness, stridor, singed nasal/facial hair, soot in oropharynx",
      "Anticipated deterioration: severe pulmonary contusion, burns >40% BSA, maxillofacial trauma",
      "Surgical airway immediately available before every intubation attempt in trauma",
    ],
    workup: [
      { icon:"🩺", label:"Airway Assessment — Look/Listen/Feel", detail:"Look: agitation, cyanosis, use of accessory muscles, open mouth trauma, maxillofacial disruption. Listen: stridor (supraglottic), gurgling (secretions), hoarseness (glottic/supraglottic). Feel: air movement, tracheal position, subcutaneous emphysema." },
      { icon:"📊", label:"SpO₂ + Waveform EtCO₂", detail:"SpO₂ target >94%. EtCO₂ 35–45 mmHg post-intubation. Waveform capnography is the gold standard for ETT confirmation — must see ≥6 waveforms. Absence confirms oesophageal intubation." },
      { icon:"🔦", label:"Rapid Neurological Baseline", detail:"GCS components (E/V/M), pupil size and reactivity bilaterally. Document pre-intubation baseline — critical for TBI monitoring and neurosurgical decision-making." },
      { icon:"🩻", label:"CT Neck / Soft Tissue XR", detail:"In stable patients only — haematoma, fracture, foreign body, tracheal deviation, subcutaneous emphysema. CT neck + CTA for suspected vascular or tracheal injury (Zone II/III penetrating neck trauma)." },
    ],
    treatment: [
      { cat:"Airway Adjuncts", drug:"Jaw Thrust / Chin Lift", dose:"Manual manoeuvre — in-line C-spine neutrality at all times", note:"First-line for partial obstruction. No neck extension. Two-person technique: one maintains C-spine, one manages airway.", ref:"Level A" },
      { cat:"Airway Adjuncts", drug:"Nasopharyngeal Airway (NPA)", dose:"Size: tip of nose to earlobe; lubricate with gel, insert via right naris", note:"Preferred in semi-conscious/combative patients. Avoid in suspected basal skull fracture (bilateral periorbital ecchymosis, Battle's sign, haemotympanum, CSF rhinorrhoea/otorrhoea).", ref:"Level A" },
      { cat:"Airway Adjuncts", drug:"Oropharyngeal Airway (OPA)", dose:"Size: corner of mouth to angle of mandible", note:"Only in unconscious patients with no gag reflex. Insert inverted and rotate 180° in adults.", ref:"Level A" },
      { cat:"RSI — Induction", drug:"Ketamine", dose:"1.5–2 mg/kg IV (haemodynamically unstable) or 1–2 mg/kg IV (stable)", note:"ATLS 11th Ed: ketamine is the preferred induction agent in trauma. Does NOT raise ICP with positive pressure ventilation. Maintains sympathetic tone — preferred over etomidate or propofol.", ref:"Level A" },
      { cat:"RSI — Paralytic", drug:"Rocuronium (preferred)", dose:"1.2 mg/kg IV — onset 45–60 seconds, duration 60–90 min", note:"Fully reversible with sugammadex 16 mg/kg IV. Preferred over succinylcholine in crush injury, burns >24h, denervation injury, hyperkalaemia risk.", ref:"Level A" },
      { cat:"RSI — Paralytic", drug:"Succinylcholine (alternative)", dose:"1.5 mg/kg IV — onset 45 seconds, duration 8–12 min", note:"Avoid if: >24h post-burn, crush injury, spinal cord injury, denervation (hyperkalaemia risk). Use if sugammadex unavailable for rocuronium reversal.", ref:"Level B" },
      { cat:"Surgical Airway", drug:"Cricothyroidotomy (Surgical)", dose:"Horizontal incision through cricothyroid membrane; 10mm cuffed trach tube or 6.0 cuffed ETT", note:"CICV — do not delay this decision. Identify CTM by palpation (landmark), USS if time permits. Convert to formal tracheostomy within 72 hours.", ref:"Level A" },
    ],
    followup: [
      "Confirm ETT placement: waveform capnography ≥6 waveforms + bilateral auscultation + post-intubation CXR",
      "Vital signs within 2 minutes of intubation — post-intubation hypotension common (preload-dependent patients, anaesthetic vasodilation)",
      "Ventilator initial settings: TV 6–8 mL/kg IBW, PEEP 5 cmH₂O, RR 14–16, FiO₂ 1.0 initially, then titrate",
      "C-spine clearance by CT C-spine (non-contrast) — cannot clinically clear C-spine if GCS <15",
      "Sedation and analgesia: fentanyl 1–2 mcg/kg + midazolam 0.05 mg/kg, or propofol infusion 1–3 mg/kg/h",
      "Tape ETT securely — avoid tight tapes or ties that compress neck veins (worsens ICP in TBI)",
    ],
    reference: "ATLS 11th Edition Chapter 2 — Airway Management; RSI in Trauma, NAEMSP/ACEP 2023",
  },

  tension_ptx: {
    definition: "Tension pneumothorax occurs when air enters the pleural space through a one-way valve mechanism, progressively accumulating under pressure. This causes mediastinal shift, contralateral lung compression, great vessel compression (↓ venous return), obstructive shock, and cardiac arrest. It is a clinical diagnosis — never delay decompression for imaging.",
    keyCriteria: [
      "Clinical diagnosis — NEVER wait for CXR to decompress",
      "Classic triad: respiratory distress + hypotension + absent/decreased breath sounds (ipsilateral)",
      "JVD may be absent in concomitant hypovolaemia — do not rely on its absence to exclude",
      "Tracheal deviation away from affected side — LATE sign, unreliable on portable CXR",
      "Traumatic cardiac arrest — bilateral needle decompression is the first intervention",
      "Mechanically ventilated patients: sudden deterioration in peak airway pressures + haemodynamics = tension PTX",
    ],
    workup: [
      { icon:"🩺", label:"Clinical Assessment — Primary Survey B", detail:"Absent or decreased breath sounds ipsilateral, hyper-resonance to percussion (unreliable in noisy trauma bay), tracheal deviation (late), JVD, hypotension, tachycardia, SpO₂ decline." },
      { icon:"📡", label:"E-FAST — Lung Windows (if immediately available)", detail:"Absence of lung sliding (M-mode barcode sign) + absence of B-lines = pneumothorax. Do NOT delay needle decompression for FAST — perform simultaneously or after." },
      { icon:"🩻", label:"CXR — After Decompression Only", detail:"Post-decompression CXR to confirm diagnosis, residual PTX, mediastinal position, ICC placement. Never obtain CXR before decompressing a clinically suspected tension PTX." },
    ],
    treatment: [
      { cat:"Immediate", drug:"Needle Decompression", dose:"14G IV catheter — 4th–5th ICS, anterior axillary line (PREFERRED) OR 2nd ICS, mid-clavicular line", note:"4th–5th ICS AAL has significantly lower failure rate due to thinner chest wall. Audible hiss confirms diagnosis. Immediately proceed to finger thoracostomy.", ref:"Level A" },
      { cat:"Definitive", drug:"Finger Thoracostomy", dose:"4th–5th ICS, anterior axillary line — blunt dissection, finger sweep to confirm pleural entry and clear any clot", note:"Gold standard in pre-hospital and trauma bay. Preferred over needle decompression in intubated patients. Insert ICC (28–32F) immediately after.", ref:"Level A" },
      { cat:"Definitive", drug:"Intercostal Catheter (ICC)", dose:"28–32F (haemopneumothorax), 24–28F (isolated PTX) — 4th–5th ICS, AAL; insert above superior rib margin", note:"Connect to underwater seal drain (NOT suction initially). Do NOT clamp. Mark drainage on arrival, hourly thereafter." },
      { cat:"Open PTX", drug:"Three-Sided Occlusive Dressing", dose:"Cover wound leaving one side open — valve effect prevents tension. ICC at separate site.", note:"Do NOT occlude all four sides (converts open to tension PTX). Vented chest seal (e.g. HALO seal) preferred in pre-hospital setting.", ref:"Level A" },
    ],
    followup: [
      "Post-decompression CXR to confirm lung re-expansion and ICC tip position (4th–5th ICS, not in fissure)",
      "Repeat E-FAST at 30 min — monitor for re-accumulation",
      "Indications for thoracotomy: immediate drainage >1,500 mL, ongoing drainage >200 mL/h for 4h, haemodynamic instability",
      "Autotransfusion (Atotransfusor) for haemothorax if drainage >1,500 mL — O-negative equivalent, immediate",
      "Retained haemothorax at 48–72h: VATS for drainage and pleurodesis (prevents empyema and fibrothorax)",
      "ICU ventilator alarm management: check bilateral chest rise, auscultate, repeat E-FAST with every new alarm",
    ],
    reference: "ATLS 11th Edition Chapter 4 — Thoracic Trauma; WTA Chest Injury Guidelines 2023",
  },

  fast_imaging: {
    definition: "The Extended FAST (E-FAST) adds bilateral lung assessment to the standard 4-window FAST. It is the primary imaging tool in haemodynamically unstable trauma. CT pan-scan (head/C-spine/chest/abdomen/pelvis with IV contrast) is the gold standard in haemodynamically stable patients. Imaging pathway is dictated entirely by haemodynamic status.",
    keyCriteria: [
      "Haemodynamically UNSTABLE: E-FAST → if positive → immediate OR (no CT); if negative → look for other sources",
      "Haemodynamically STABLE: CT pan-scan (head/C-spine/chest/abdomen/pelvis with IV contrast)",
      "E-FAST negative + persistent instability → pelvis XR, bilateral femur, thorax, retroperitoneum",
      "CT scan radiation dose ~20 mSv — limit in paediatric patients, use ALARA protocols",
      "Oral contrast NOT required in trauma CT — delays imaging without benefit",
      "CXR + Pelvis XR are mandatory adjuncts in all blunt trauma — performed during primary survey",
    ],
    workup: [
      { icon:"📡", label:"E-FAST: Pericardial Window", detail:"Subxiphoid 4-chamber view. Pericardial effusion (anechoic rim), RV diastolic collapse = tamponade physiology. Normal = echogenic pericardium only, no free fluid anterior or posterior to heart." },
      { icon:"📡", label:"E-FAST: Hepatorenal (Morrison's Pouch)", detail:"Most sensitive FAST window for free fluid. Any anechoic fluid between liver and right kidney = positive. 'Stripe sign' = significant haemoperitoneum (requires ~250 mL for detection in Morrison's)." },
      { icon:"📡", label:"E-FAST: Splenorenal & Pelvic Windows", detail:"Splenorenal: fluid left kidney/spleen interface. Pelvic (Douglas pouch/Retzius): fluid posterior to bladder (females: posterior to uterus). Requires 400–600 mL for reliable detection." },
      { icon:"📡", label:"E-FAST: Lung Windows (Bilateral)", detail:"Anterior superior bilaterally. Absent lung sliding + absent B-lines = pneumothorax. B-lines (comet-tail artefacts) rule out PTX. M-mode: seashore sign (normal) vs barcode/stratosphere sign (PTX)." },
      { icon:"🩻", label:"CXR — Portable AP", detail:"ETT position, haemopneumothorax (opacification), mediastinal width >8 cm (aortic injury), tracheal deviation, rib fractures, clavicular/scapular fractures, pneumomediastinum, subcutaneous emphysema, diaphragm." },
      { icon:"🦴", label:"Pelvis AP XR — Portable", detail:"Pelvic ring disruption, acetabular fractures, pubic symphysis diastasis >2.5 cm, vertical shear displacement. Apply binder at greater trochanters if ring disruption identified — before further imaging." },
      { icon:"🧠", label:"CT Brain — Non-Contrast", detail:"Indications: GCS <15, LOC, post-traumatic amnesia, ≥2 vomiting episodes, age >65, anticoagulation, high-risk mechanism. Identifies: EDH (biconvex hyperdense), SDH (crescent), SAH (sulci/cisterns), contusion, DAI, skull fractures, midline shift." },
      { icon:"🩻", label:"CT Pan-Scan — IV Contrast", detail:"Haemodynamically stable patients. Arterial + portal venous phase. Head/C-spine (non-contrast) + Chest/Abdomen/Pelvis (IV contrast). Sensitivity >95% for solid organ injury, aortic injury, retroperitoneal haematoma, pneumothorax." },
      { icon:"🩻", label:"CT Angiography (CTA)", detail:"Mediastinal widening, first/second rib fracture, deceleration mechanism → CTA aorta. Suspected vascular pelvic injury → CTA pelvis. Neck trauma Zone I or III → CTA neck vessels." },
      { icon:"🩸", label:"Trauma Labs — Full Panel", detail:"FBC, coags (PT/APTT/INR/fibrinogen), TEG/ROTEM, UEC, LFTs, lipase, ABG + lactate, crossmatch ×6 units, troponin, urinalysis (haematuria = renal/bladder injury), βhCG (all reproductive-age females without exception)." },
    ],
    treatment: [
      { cat:"Positive E-FAST + Unstable", drug:"Emergent Laparotomy — Damage Control", dose:"Direct OR transfer — no CT. Activate MTP simultaneously.", note:"Positive FAST (intraperitoneal free fluid) + haemodynamic instability despite initial resuscitation = operative indication. Do not delay.", ref:"Level A" },
      { cat:"Positive E-FAST + Stable", drug:"CT Abdomen/Pelvis with IV Contrast", dose:"Grade solid organ injury, identify arterial blush, plan IR vs operative", note:"Arterial extravasation ('blush') on CT = interventional radiology embolisation or direct operative intervention.", ref:"Level A" },
      { cat:"Negative E-FAST + Unstable", drug:"Identify Alternative Source + Pelvic Binder", dose:"Pelvis XR, bilateral femur, thorax reassessment, DPA (if available)", note:"Retroperitoneal haemorrhage from pelvic fracture may be FAST-negative. Apply binder if pelvic ring disruption.", ref:"Level B" },
    ],
    followup: [
      "Document all E-FAST windows with findings and timestamp — repeat after every significant intervention",
      "Serial E-FAST every 30–60 min in monitored patients with borderline haemodynamic stability",
      "MRCP or ERCP for pancreatic ductal injury if elevated lipase + Grade III+ injury on CT",
      "MRI spine for neurological deficit without CT abnormality (SCIWORA) — after haemodynamic stabilisation",
      "Tertiary survey imaging: missed injury rate on initial CT is 5–15% for CT-occult injuries (hollow viscus, mesenteric)",
    ],
    reference: "ATLS 11th Edition Chapter 5; ACEP E-FAST Policy Statement 2023; WTA Imaging Guidelines",
  },

  hemorrhagic_shock: {
    definition: "Haemorrhagic shock is inadequate end-organ perfusion from blood volume loss. ATLS 11th Edition revised classification focuses on physiological response rather than strict volume thresholds, recognising that blood loss estimation is unreliable. Lactate and base deficit are the key metabolic endpoints guiding resuscitation.",
    keyCriteria: [
      "Class I: <15% blood volume, HR <100, BP normal, mild symptoms — minimal intervention",
      "Class II: 15–30%, HR 100–120, BP normal/narrowed pulse pressure, RR 20–30, anxiety",
      "Class III: 30–40%, HR 120–140, BP decreased, RR 30–40, confused — transfusion required",
      "Class IV: >40%, HR >140, BP severely ↓ (<70 mmHg), RR >35, lethargic — immediately life-threatening",
      "Lactate >4 mmol/L + base deficit <−6 + HR >120 = activate MTP without waiting for further labs",
      "Shock index (HR/SBP) >1.0 = significant haemorrhage; >1.4 = critical — immediate MTP activation",
    ],
    workup: [
      { icon:"🩸", label:"ABG with Lactate (Stat + Serial)", detail:"Lactate >2 mmol/L = hypoperfusion; >4 = severe shock. Base deficit <−6 = significant haemorrhage; <−10 = critical. Repeat every 30 min during active resuscitation. Target: lactate clearance ≥10%/h." },
      { icon:"🧪", label:"TEG / ROTEM (Point-of-Care)", detail:"Rapid viscoelastic testing — results within 10–15 min. Identifies: clotting time (factors), clot amplitude (platelets), fibrinolysis, fibrinogen deficiency. Superior to INR/APTT for guiding MTP." },
      { icon:"📊", label:"Shock Index (SI)", detail:"SI = HR ÷ SBP. Normal <0.7. Significant >0.9. Critical >1.4. Reverse shock index (SBP/HR) <1 = immediate MTP activation. Calculate on arrival and with every set of vital signs." },
      { icon:"🔬", label:"Serial UO + Haemodynamic Monitoring", detail:"IDC mandatory in Class III–IV. Target UO ≥0.5 mL/kg/h (adult). Arterial line for continuous BP once stabilising. CVP (caution: poor predictor of preload). Bedside echo for cardiac function." },
      { icon:"🩺", label:"Identify and Control Haemorrhage Source", detail:"The 6 potential spaces: bilateral chest, abdomen, pelvis, retroperitoneum, bilateral thighs. Systematic E-FAST + CXR + pelvis XR + clinical exam. External bleeding = direct pressure/tourniquet first." },
    ],
    treatment: [
      { cat:"Immediate Haemostasis", drug:"Direct Pressure / Tourniquet", dose:"Tourniquet: 5–7 cm proximal to wound, tighten until bleeding ceases; document application time", note:"CAT (Combat Application Tourniquet) or SOFTT-W. Junctional wounds: wound packing with haemostatic gauze (QuikClot Combat Gauze or Celox-A). Leave tourniquet until surgical haemostasis.", ref:"Level A" },
      { cat:"IV Access", drug:"2× Large-Bore IVs (≥16G) or IO", dose:"Bilateral antecubital. IO: humeral head (Ezio preferred in adults) if IV failed ×2", note:"Do NOT delay resuscitation for central line. IO is equivalent for all resuscitation fluids, medications, and blood products.", ref:"Level A" },
      { cat:"Permissive Hypotension", drug:"Resuscitation Target (pre-haemostasis)", dose:"Blunt trauma: SBP 80–90 mmHg. Penetrating trauma: SBP 50–70 mmHg. TBI exception: SBP ≥90 at all times", note:"Limit crystalloid to ≤1L warm Hartmann's total before haemostasis. Excessive crystalloid worsens coagulopathy, ARDS, and abdominal compartment syndrome.", ref:"Level A" },
      { cat:"Initial Fluid", drug:"Warm Hartmann's / Normal Saline", dose:"500 mL–1L IV bolus, warm (38–40°C via fluid warmer)", note:"Crystalloid is a bridge — transition immediately to blood products (1:1:1) once MTP activated. No additional boluses after initial 1L unless blood products unavailable.", ref:"Level A" },
      { cat:"Vasopressors", drug:"Noradrenaline (bridge to haemostasis only)", dose:"0.05–0.5 mcg/kg/min IV infusion — titrate to MAP ≥65 mmHg", note:"Does NOT treat haemorrhagic shock — treats vasodilation only. Vasopressin 0.03 units/min as adjunct. Use only as a bridge while awaiting operative haemostasis.", ref:"Level B" },
      { cat:"Calcium (Mandatory)", drug:"Calcium Chloride 10%", dose:"1g IV (10 mL of 10% solution) per 4 units pRBC transfused", note:"Citrate in blood products chelates ionised calcium — critical for cardiac contractility and coagulation cascade. Target iCa²⁺ >1.1 mmol/L. Do not omit.", ref:"Level A" },
    ],
    followup: [
      "Resuscitation endpoints: lactate <2 mmol/L, UO ≥0.5 mL/kg/h, MAP ≥65 mmHg (post-haemostasis), pH >7.35, Temp >36°C",
      "Serial lactate every 30 min during active resuscitation — failure to clear = ongoing haemorrhage or inadequate resuscitation",
      "Avoid over-resuscitation: >10L crystalloid or excessive blood products → abdominal compartment syndrome (bladder pressure monitoring)",
      "Bladder pressure every 4h if high-risk (massive resuscitation, pelvic injury, abdominal packing) — target IAP <20 mmHg",
      "ICU admission: ongoing monitoring, tertiary survey, VTE prophylaxis initiation at 24–48h",
    ],
    reference: "ATLS 11th Edition Chapter 3 — Shock; EAST Practice Management Guidelines; JTrauma 2022",
  },

  txa: {
    definition: "Tranexamic acid (TXA) is a synthetic lysine analogue that competitively inhibits plasminogen activation, reducing fibrinolysis and fibrin clot breakdown. The CRASH-2 trial (20,211 patients) demonstrated a 1.5% absolute mortality reduction (14% relative reduction) when given within 1 hour, and benefit persisting up to 3 hours. TXA given after 3 hours may increase mortality and is contraindicated.",
    keyCriteria: [
      "Time is critical: administer within 1 hour for maximum benefit (1.6% absolute risk reduction)",
      "Window closes at 3 hours post-injury — DO NOT administer after 3 hours",
      "Indications: significant haemorrhage, shock index >0.9, MTP activation, penetrating or blunt haemorrhage with haemodynamic compromise",
      "Pre-hospital TXA: PATCH trial supports pre-hospital administration in penetrating trauma — administer en route",
      "TBI: CRASH-3 — benefit in mild-moderate TBI within 3h; no demonstrated benefit/possible harm in severe TBI (GCS <9)",
      "TXA does NOT replace MTP — administer in addition to balanced haemostatic resuscitation",
    ],
    workup: [
      { icon:"🕐", label:"Time from Injury — MANDATORY CHECK", detail:"Confirm injury time before administration. Administration >3 hours post-injury shows no benefit and may increase thrombotic mortality (CRASH-2 subgroup). If time of injury unknown and >3h window cannot be excluded, do not administer." },
      { icon:"🩸", label:"Haemorrhage Severity Assessment", detail:"Shock index >0.9, SBP <90 mmHg, HR >110 bpm, active external or suspected internal haemorrhage, penetrating mechanism, MTP criteria met." },
      { icon:"🧪", label:"TEG / ROTEM — Fibrinolysis Assessment", detail:"TEG LY30 >3% or ROTEM EXTEM ML >15% confirms active fibrinolysis and strongly indicates TXA. ROTEM APTEM normalisation of EXTEM confirms fibrinolysis as cause of coagulopathy." },
    ],
    treatment: [
      { cat:"Standard Dose", drug:"Tranexamic Acid", dose:"1g IV over 10 min (loading), THEN 1g IV over 8 hours (maintenance)", note:"Total dose: 2g. Loading dose must be over ≥10 min — rapid bolus causes hypotension and seizures. Must be given within 3 hours of injury.", ref:"Level A" },
      { cat:"Pre-hospital", drug:"Tranexamic Acid — Pre-hospital", dose:"1g IV/IO bolus over 10 min en route to hospital", note:"Earlier = greater mortality benefit. PATCH trial (2023): significant reduction in 28-day mortality in penetrating trauma with pre-hospital TXA. Administer before hospital arrival.", ref:"Level A" },
      { cat:"Paediatric", drug:"Tranexamic Acid — Paediatric Dose", dose:"15 mg/kg IV (max 1g loading), then 2 mg/kg/h over 8 hours", note:"Evidence extrapolated from CRASH-2/3 and paediatric pharmacokinetic studies. Same time window applies — within 3 hours of injury.", ref:"Level B" },
    ],
    followup: [
      "Document exact time of injury and exact time of TXA administration on all records",
      "No dose reduction required in renal impairment for acute single-course administration",
      "Monitor for thromboembolic complications during ICU stay — TXA does not increase early thrombotic risk in trauma",
      "VTE prophylaxis: LMWH (enoxaparin 40 mg SC daily) after haemostasis confirmed — typically 24–48h post-injury",
      "Re-dosing: not routinely recommended; consider only if TEG/ROTEM confirms persistent fibrinolysis after initial course",
      "TXA in post-partum haemorrhage, epistaxis, haemoptysis: separate dosing protocols apply — always confirm indication",
    ],
    reference: "CRASH-2 Collaborators, Lancet 2010; MATTERs Study, Arch Surg 2012; PATCH Trial 2023; ATLS 11th Ed",
  },

  pelvic_fracture: {
    definition: "Unstable pelvic ring fractures cause massive retroperitoneal haemorrhage from disruption of the posterior pelvic venous plexus (80–85%) and internal iliac artery branches (15–20%). High-energy mechanisms with haemodynamic instability carry mortality of 10–50%. Immediate mechanical stabilisation (binder or sheet) is the first intervention — do NOT rock or manipulate the pelvis.",
    keyCriteria: [
      "Young–Burgess Classification: A (stable, no ring disruption), B (rotationally unstable — open book, lateral compression), C (vertically unstable — vertical shear — highest mortality)",
      "Open book fracture (B type): pubic symphysis diastasis >2.5 cm — binder reduces pelvic volume and tamponades bleeding",
      "Vertical shear (C type): most lethal — major arterial disruption common, retroperitoneum not contained",
      "NEVER rock pelvis to assess stability — worsens haemorrhage by disrupting tamponade",
      "Haemodynamic instability + pelvic fracture = binder + MTP activation + IR/OR",
      "Positive FAST + pelvic fracture: laparotomy first (intraperitoneal source), then pelvic binder",
    ],
    workup: [
      { icon:"🦴", label:"Pelvis AP XR — Portable (Unstable)", detail:"First-line in haemodynamically unstable patients. Identifies ring disruption, diastasis, vertical shear. Apply binder clinically if suspected — XR confirms, does not precede binder in the unstable patient." },
      { icon:"🩻", label:"CT Pelvis + CTA with Contrast (Stable)", detail:"Characterises fracture pattern, identifies arterial extravasation ('blush'), grading of soft tissue injury. Plans for IR embolisation vs. preperitoneal packing vs. external fixation." },
      { icon:"📡", label:"E-FAST — Pelvic Window", detail:"Free fluid in Douglas pouch or Retzius space suggests intraperitoneal haemorrhage. Retroperitoneal haematoma may be FAST-negative. Positive FAST + pelvic fracture = laparotomy first." },
      { icon:"🩸", label:"MTP Activation Assessment", detail:"Shock index >1.0, SBP <90 mmHg, HR >120 bpm, base deficit <−6, ongoing transfusion requirement with pelvic injury = immediate MTP activation." },
      { icon:"🔬", label:"Urethrogram / Cystogram", detail:"Blood at urethral meatus, perineal bruising, high-riding prostate on DRE: retrograde urethrogram before IDC. CT cystogram for suspected bladder injury (pelvic fracture + haematuria)." },
    ],
    treatment: [
      { cat:"Immediate (Pre-hospital / Trauma Bay)", drug:"Pelvic Binder or Sheet", dose:"SAM Sling, Pelvic Pod, or folded sheet — apply at level of GREATER TROCHANTERS (not iliac crests). Cinch firmly.", note:"Reduces pelvic volume, tamponades retroperitoneal venous bleeding. Do NOT leave on >24h (skin necrosis, pressure injury). Remove for IR/OR and replace after.", ref:"Level A" },
      { cat:"Arterial Haemostasis", drug:"IR Angioembolisation", dose:"Bilateral internal iliac artery embolisation — fluoroscopic-guided, interventional radiology", note:"For arterial haemorrhage (CT blush or haemodynamic instability with pelvic injury). Most effective for arterial sources. Does NOT address venous or bony bleeding (80% of pelvic haemorrhage).", ref:"Level A" },
      { cat:"Venous Haemostasis", drug:"Preperitoneal Pelvic Packing (PPP)", dose:"Pfannenstiel or midline incision, 3 packs per iliac fossa bilaterally against the pelvic sidewall", note:"Addresses venous and bony bleeding — accounts for 80–85% of pelvic haemorrhage. Combined with binder + external fixation. Re-pack removal at 24–48h re-look.", ref:"Level B" },
      { cat:"Mechanical Stabilisation", drug:"External Fixation (Ex-Fix) / C-Clamp", dose:"Anterior ex-fix: supraacetabular pins bilaterally. Posterior C-clamp for Type C (vertical shear).", note:"Temporary stabilisation until definitive ORIF at 48–72h. Reduces pelvic volume, enables packing. C-clamp targets posterior ring at ilium.", ref:"Level B" },
      { cat:"Massive Haemorrhage", drug:"MTP Activation (1:1:1)", dose:"See Massive Transfusion Protocol entry for full details", note:"Activate MTP with pelvic fracture + shock index >1.0. Do not wait for labs. Calcium mandatory with every 4 units pRBC.", ref:"Level A" },
    ],
    followup: [
      "Post-binder XR to confirm pelvic ring reduction — reassess binder position if inadequate reduction",
      "Coordinate pelvic binder removal with orthopaedics and IR — never remove binder without a plan for alternative haemostasis",
      "Open pelvic fractures: bowel/rectal injury in 30–50% — digital rectal exam, proctoscopy, diverting colostomy if colonic injury",
      "Definitive ORIF: after physiologic normalisation — typically 48–72h post-injury",
      "Neurological assessment: sacral fractures injure L4/L5/S1 nerve roots — document motor/sensory function",
      "DVT prophylaxis: highest risk of VTE in trauma — initiate LMWH as soon as haemorrhage controlled (24–48h)",
    ],
    reference: "ATLS 11th Edition Chapter 3; EAST Pelvic Fracture Haemorrhage PMG 2022; JOT Pelvic Guidelines",
  },

  dcr: {
    definition: "Damage Control Resuscitation (DCR) is a strategy replacing traditional large-volume crystalloid resuscitation for haemorrhagic shock. It consists of three core principles: (1) early haemostasis (surgical or IR), (2) haemostatic resuscitation with 1:1:1 blood products, and (3) permissive hypotension before haemostasis. The goal is to prevent and reverse the lethal triad.",
    keyCriteria: [
      "Permissive hypotension: SBP 80–90 mmHg (blunt), 50–70 mmHg (penetrating) until operative haemostasis",
      "Haemostatic resuscitation: pRBC:FFP:Platelets = 1:1:1 ratio empirically from the start (PROPPR trial)",
      "Lethal triad prevention: Temp >36°C, pH >7.35, INR <1.5, fibrinogen >1.5 g/L, iCa²⁺ >1.1 mmol/L",
      "Avoid crystalloid: ≤1L total; excessive crystalloid worsens coagulopathy, ARDS, ACS, and mortality",
      "Calcium replacement: 1g CaCl₂ 10% per 4 units pRBC — mandatory, not optional",
      "TXA: within 3 hours of injury; TEG/ROTEM-guided product therapy superior to empiric labs",
    ],
    workup: [
      { icon:"🧪", label:"TEG / ROTEM — Point-of-Care Coagulation", detail:"Results in 10–15 min. TEG: R-time (clotting initiation), K-time (clot kinetics), α-angle (fibrinogen function), MA (max amplitude = platelet/fibrinogen), LY30 (fibrinolysis). Guides specific product replacement." },
      { icon:"🌡", label:"Core Temperature Monitoring", detail:"Every 30 min during active resuscitation. Target >36°C. <35°C = mild; <32°C = severe — active internal rewarming. Hypothermia causes near-complete coagulation failure at <33°C." },
      { icon:"🩸", label:"Serial ABG every 30 min", detail:"pH, pCO₂, base excess, lactate, iCa²⁺, K⁺, Hb. Targets: pH >7.35, BE >−6, lactate <4 mmol/L, iCa²⁺ >1.1 mmol/L, Hb >70 g/L during haemorrhage, Hb >80 post-haemostasis." },
      { icon:"📊", label:"Standard Coagulation Panel", detail:"PT, APTT, INR, fibrinogen, FDP/D-dimer. Draw baseline and every 60 min. TEG/ROTEM is preferred for real-time guidance. Fibrinogen is the first critically depleted factor." },
    ],
    treatment: [
      { cat:"Haemostatic Resuscitation", drug:"pRBC : FFP : Platelets = 1:1:1", dose:"Activate MTP — deliver packs sequentially. O-negative pRBC until crossmatch (30 min)", note:"PROPPR trial: 24h and 30-day mortality benefit with 1:1:1 vs 1:1:2. Do not wait for Hb or coag results to initiate. Target Hb 70–100 g/L during active haemorrhage.", ref:"Level A" },
      { cat:"Fibrinogen", drug:"Fibrinogen Concentrate (RiaSTAP / Haemocomplettan)", dose:"4–6g IV (or 50 mg/kg) — if fibrinogen <1.5 g/L or FIBTEM MCF <8mm", note:"First coagulation factor to reach critical depletion in major haemorrhage. Cryoprecipitate (10 pooled units) = ~3–4g fibrinogen if concentrate unavailable. Critical for clot quality.", ref:"Level A" },
      { cat:"Calcium", drug:"Calcium Chloride 10%", dose:"1g IV (10 mL) per 4 units pRBC; additional 1g if iCa²⁺ <1.1 mmol/L", note:"Citrate chelation from transfused blood is the most common and underappreciated cause of iatrogenic coagulopathy. Never omit calcium supplementation in MTP.", ref:"Level A" },
      { cat:"Factor Concentrate", drug:"4-Factor PCC (Prothrombinex-VF)", dose:"25–50 units/kg IV — for warfarin reversal or INR-guided factor replacement", note:"Rapid warfarin reversal. For DOACs: idarucizumab 5g IV (dabigatran) or andexanet alfa (Xa inhibitors — apixaban/rivaroxaban).", ref:"Level B" },
      { cat:"Rewarming", drug:"Active Internal Rewarming", dose:"Warm IV fluids 38–40°C (via Belmont or Level 1 rapid infuser), warm humidified ventilator circuit, bear hugger forced warm air", note:"Target core temp >36°C. Peritoneal/pleural lavage with warm saline (38°C) for severe hypothermia <30°C. External rewarming alone is insufficient for <32°C.", ref:"Level A" },
    ],
    followup: [
      "End-points of DCR: lactate <2 mmol/L, UO ≥0.5 mL/kg/h, Temp >36°C, pH >7.35, INR <1.5, fibrinogen >2 g/L",
      "Abdominal compartment syndrome: bladder pressure every 4h if >10L resuscitation — target IAP <20 mmHg; decompressive laparotomy if ACS with organ failure",
      "Transition from empiric 1:1:1 to TEG/ROTEM-guided therapy once haemostasis achieved",
      "VTE prophylaxis: LMWH at 24–48h post-haemostasis — highest-risk group for DVT/PE in all of medicine",
      "Nutritional support: enteral feeding within 24–48h — gut barrier function critical in preventing septic complications post-damage control",
    ],
    reference: "PROPPR Trial — JAMA 2015; Holcomb et al. DCR Guidelines JTrauma 2022; ATLS 11th Edition",
  },

  dcs: {
    definition: "Damage Control Surgery (DCS) is a staged operative approach for physiologically devastated trauma patients in whom prolonged surgery would be lethal. Stage 1: abbreviated operation (haemostasis + contamination control + temporary closure). Stage 2: ICU resuscitation and correction of the lethal triad. Stage 3: definitive reconstruction at 24–72 hours. The goal is physiologic survival, not anatomic completeness.",
    keyCriteria: [
      "Physiologic triggers (any 2 of 4): pH <7.2, core temp <35°C, INR >1.5, estimated blood loss >10 units pRBC",
      "Injury pattern triggers: penetrating abdominal + haemodynamic instability, combined major vascular + bowel, injuries requiring >4 organ systems",
      "Mechanism: high-energy penetrating, combined thoracoabdominal, multi-cavity injuries",
      "Convert from definitive to damage control intraoperatively at any point physiologic triggers are met",
      "Damage control thoracic: abbreviated approach for cardiac/great vessel injury — temporary shunts, packing",
      "Damage control orthopaedic: temporary external fixation of all long bone fractures — ORIF deferred 48–72h",
    ],
    workup: [
      { icon:"🩸", label:"Intraoperative Physiologic Triggers", detail:"pH <7.2, core temp <34°C, transfusion >10 units pRBC, coags: PT/APTT >2× normal. Monitor each intraoperatively — convert to damage control immediately on meeting criteria." },
      { icon:"📊", label:"Pre-operative Rapid Labs", detail:"TEG/ROTEM, ABG (pH, base excess, lactate), iCa²⁺, K⁺, FBC, crossmatch ×10 units. Coordinate with blood bank for intraoperative MTP continuation. BGL (stress hyperglycaemia)." },
      { icon:"🩺", label:"Intraoperative Assessment (4-Quadrant Survey)", detail:"Systematic exploration: right upper quadrant (liver/right colon), left upper quadrant (spleen/left colon), central (mesentery/pancreas/aorta), pelvic. Identify and control haemorrhage before contamination." },
    ],
    treatment: [
      { cat:"Stage 1 — Haemostasis", drug:"Perihepatic / Retroperitoneal Packing", dose:"3–5 laparotomy packs per quadrant — firm packing against abdominal wall and retroperitoneum", note:"Hepatic packing: reduces mortality from liver laceration 56% → 26%. Pringle manoeuvre (portal triad clamping) for ongoing hepatic haemorrhage — max 60 min ischaemia.", ref:"Level A" },
      { cat:"Stage 1 — Vascular", drug:"Temporary Intraluminal Vascular Shunts", dose:"Argyle or Sundt shunts — for SMA, iliac, portal vein injuries requiring complex repair", note:"Maintains visceral perfusion while deferring vascular reconstruction. Anticoagulate shunt with heparinised saline. Definitive vascular repair at Stage 3 (24–48h).", ref:"Level B" },
      { cat:"Stage 1 — REBOA", drug:"Zone 1 or Zone 3 REBOA", dose:"Zone 1 (supracoeliac aorta): intraabdominal/thoracic haemorrhage. Zone 3 (infrarenal): pelvic haemorrhage. 7–12F sheath. Max inflation Zone 1: 30 min.", note:"Resuscitative Endovascular Balloon Occlusion — bridge to operative haemostasis. Reduces distal haemorrhage and maintains cardiac/cerebral perfusion. Does not replace surgery.", ref:"Level B" },
      { cat:"Stage 1 — Contamination", drug:"Bowel Occlusion (No Anastomosis)", dose:"GIA stapler or umbilical tape/nylon ligature; close skin only or pack open", note:"No primary anastomosis in damage control — reconnect bowel at Stage 3 after physiologic correction. Broad-spectrum antibiotics perioperatively.", ref:"Level A" },
      { cat:"Stage 1 — Closure", drug:"Negative Pressure Wound Therapy (NPWT / VAC)", dose:"ABThera or Prevena — −125 mmHg continuous suction; change every 48–72h", note:"Open abdomen technique prevents fascial retraction, removes intra-abdominal fluid, reduces bacterial load. Target primary fascial closure within 72–120h.", ref:"Level A" },
    ],
    followup: [
      "Stage 2 (ICU — 12–48h): correct lethal triad, sedation/analgesia infusions, vasopressor weaning, CRRT if required, enteral nutrition within 24h",
      "Stage 3 re-look laparotomy at 24–72h: remove packs (warm saline irrigation), assess bowel viability (pink vs. black), bowel anastomosis or stoma, fascial closure",
      "ACS monitoring: bladder pressure every 4h — IAP >20 mmHg + organ failure = decompressive laparotomy",
      "Nutritional support: post-pyloric enteral feeding (NGT/NJT) within 24–48h if possible",
      "NPWT changes: every 48h with irrigation — target fascial closure by day 5–7; if not achievable, planned ventral hernia with biological mesh",
      "Wound complications: SSI, anastomotic leak, enterocutaneous fistula — monitor with daily WBC, CRP, drain output",
    ],
    reference: "Rotondo MF et al., JTrauma 1993; WTA DCS Guidelines 2022; ATLS 11th Edition",
  },

  mtp: {
    definition: "Massive Transfusion Protocol (MTP) is a predefined coordinated system for early delivery of blood products in a 1:1:1 ratio (packed red blood cells : fresh frozen plasma : platelets) for patients in haemorrhagic shock. The PROPPR trial (680 patients) demonstrated superior 24-hour and 30-day survival with 1:1:1 vs 1:1:2, with no increase in thromboembolic complications.",
    keyCriteria: [
      "ABC Score ≥2: each criterion = 1 point: penetrating mechanism, ED SBP ≤90 mmHg, HR ≥120 bpm, positive FAST",
      "Shock index >1.0 (HR/SBP) or reverse shock index <1",
      "TASH Score ≥16 = >50% probability of requiring MTP",
      "Estimated blood loss >40% circulating volume or clinical requirement for >10 units pRBC in 24h",
      "Each MTP 'pack': 6 units pRBC + 6 units FFP + 1 pool platelets (×4–6 apheresis) + 10 units cryoprecipitate",
      "Activate early — empiric activation on clinical grounds; do not wait for laboratory confirmation",
    ],
    workup: [
      { icon:"🩸", label:"ABC Score (Assessment of Blood Consumption)", detail:"1 point each: penetrating mechanism, ED SBP ≤90 mmHg, ED HR ≥120 bpm, positive FAST. Score ≥2 = activate MTP. Validated: sensitivity 75%, specificity 86%, AUC 0.88. Calculate on arrival." },
      { icon:"🧪", label:"TEG / ROTEM — Pack-Guided Therapy", detail:"EXTEM CT >80s → FFP. EXTEM MCF <45mm → platelets. FIBTEM MCF <8mm → fibrinogen/cryoprecipitate. EXTEM LY30 >15% → TXA. Use to titrate each subsequent MTP pack." },
      { icon:"📊", label:"Standard Coagulation Panel (Repeat 30 min)", detail:"INR target <1.5, APTT <60s, fibrinogen >1.5 g/L, platelets >50×10⁹/L. Hb target >70 g/L during haemorrhage, >80 g/L after. iCa²⁺ >1.1 mmol/L (check every 30 min)." },
      { icon:"🌡", label:"Temperature + Core Monitoring", detail:"All blood products administered via fluid warmer. Hypothermia worsens coagulopathy — monitor core temp every 30 min. Target >36°C throughout MTP." },
    ],
    treatment: [
      { cat:"Pack 1 — Empiric", drug:"6 pRBC + 6 FFP + 1 Pool Platelets + 10u Cryoprecipitate", dose:"O-negative pRBC until type-specific (10–15 min) or crossmatch (30–45 min) available", note:"Call blood bank simultaneously with MTP activation — do NOT wait. Deliver packs sequentially every 15–20 min. Transfusion nurse/coordinator dedicated to MTP tracking.", ref:"Level A" },
      { cat:"Calcium — Mandatory", drug:"Calcium Chloride 10%", dose:"1g IV (10 mL) per 4 units pRBC transfused; additional dose if iCa²⁺ <1.1 mmol/L", note:"The most commonly omitted intervention in MTP. Citrate chelation causes acute hypocalcaemia, cardiac depression, and coagulopathy. Check iCa²⁺ every 30 min.", ref:"Level A" },
      { cat:"Antifibrinolytic", drug:"Tranexamic Acid (within 3h window)", dose:"1g IV over 10 min, then 1g over 8h", note:"MATTERs trial: 24-h mortality benefit in military trauma patients receiving MTP + TXA vs MTP alone. Administer with MTP activation if within 3-hour injury window.", ref:"Level A" },
      { cat:"Fibrinogen", drug:"Fibrinogen Concentrate", dose:"4–6g IV if fibrinogen <1.5 g/L or FIBTEM MCF <8mm", note:"Fibrinogen is the critical 'rate-limiting' coagulation factor. Replace early and aggressively. Cryoprecipitate alternative (10 pooled units ≈ 3.5g fibrinogen).", ref:"Level A" },
      { cat:"Deactivation Criteria", drug:"MTP Deactivation Checklist", dose:"Surgical haemostasis achieved + INR <1.5 + fibrinogen >2 g/L + Temp >36°C + pH >7.3 + haemodynamics stable", note:"Avoid over-transfusion: TRALI (within 6h, non-cardiogenic pulmonary oedema), TACO (volume overload), transfusion reactions. Transition to goal-directed therapy post-MTP.", ref:"Level B" },
    ],
    followup: [
      "Designate a transfusion coordinator (nurse or pharmacist) to track product delivery, calcium administration, and timing for every pack",
      "Communication with blood bank: check-in every 15–30 min during active MTP — anticipate next pack",
      "Monitor for transfusion reactions: TRALI (within 6h, new bilateral infiltrates + hypoxia), TACO (fluid overload, hypertension), FNHTR (fever, rigors — rule out bacterial contamination)",
      "Post-MTP haematology review: iron studies, coagulation assessment at 24–48h, haematology follow-up",
      "VTE prophylaxis: LMWH (enoxaparin 40 mg SC BD high-risk) initiated at 24–48h after haemorrhage controlled and haematological stability confirmed",
      "Immunocompromise post-MTP: increased infection risk — strict asepsis with all invasive lines, early removal when no longer needed",
    ],
    reference: "PROPPR Trial — JAMA 2015; AABB MTP Guidelines 2023; ATLS 11th Edition Chapter 3",
  },

  coagulopathy: {
    definition: "Trauma-Induced Coagulopathy (TIC), also termed Acute Coagulopathy of Trauma-Shock (ACoTS), occurs in 25–35% of severely injured patients ON ARRIVAL to hospital, before any iatrogenic dilution or hypothermia. It is driven by tissue hypoperfusion, endotheliopathy, activated protein C pathway causing systemic anticoagulation, and acute hyperfibrinolysis — all independent of fluid administration.",
    keyCriteria: [
      "TIC is NOT simply dilutional — it occurs before any fluids are given, driven by shock and tissue injury",
      "Protein C activation via thrombomodulin → systemic anticoagulation + fibrinolysis → clot breakdown",
      "Fibrinogen: first and most critically depleted — FIBTEM MCF <8mm is the critical actionable trigger",
      "Platelets: function is impaired at <33°C and pH <7.2, regardless of platelet count",
      "Hypothermia <33°C and pH <7.2 cause near-complete coagulation failure — these are the primary targets",
      "TEG/ROTEM-guided therapy is superior to empiric INR/APTT-based replacement in all trauma studies",
    ],
    workup: [
      { icon:"🧪", label:"TEG — Thromboelastography", detail:"R-time >10 min: factor deficiency (FFP). K-time >4 min: fibrinogen/platelet dysfunction. α-angle <47°: fibrinogen ↓. MA <50mm: platelet/fibrinogen dysfunction. LY30 >3%: fibrinolysis (TXA). Results in 10–15 min." },
      { icon:"🔬", label:"ROTEM — Rotational Thromboelastometry", detail:"EXTEM: extrinsic pathway screen. INTEM: intrinsic pathway. FIBTEM: fibrinogen-specific (most critical). APTEM: fibrinolysis screen. CT >80s = factor deficit. MCF <45mm = platelet/fibrinogen. FIBTEM MCF <8mm = critical fibrinogen deficit." },
      { icon:"📊", label:"Standard Coagulation Panel", detail:"INR >1.5, APTT >60s, fibrinogen <1.5 g/L, platelets <50×10⁹/L = significant coagulopathy. Fibrinogen is the single most important and actionable result. INR and APTT are poor predictors of clot quality in vivo." },
      { icon:"🩸", label:"Platelet Count + Function", detail:"Count <50×10⁹/L = transfusion threshold during haemorrhage. Count <100×10⁹/L = threshold in TBI/neurosurgery. Platelet function impaired regardless of count at pH <7.2 and Temp <33°C. PFA-100 if available." },
    ],
    treatment: [
      { cat:"Fibrinogen Replacement", drug:"Fibrinogen Concentrate (RiaSTAP / Haemocomplettan)", dose:"4–6g IV (or 50 mg/kg) — target fibrinogen >2 g/L", note:"Faster and more concentrated than cryoprecipitate. FIBTEM MCF <8mm = strong indication. Cryoprecipitate (10 pooled units ≈ 3.5g fibrinogen) if concentrate unavailable.", ref:"Level A" },
      { cat:"Platelet Replacement", drug:"Pooled Platelets / Apheresis Platelets", dose:"1 adult dose (pool of 4–6 random units) → raises count ~30–50×10⁹/L", note:"Target >50×10⁹/L during haemorrhage, >100 in TBI. Antiplatelet agents (aspirin, clopidogrel) + TBI/neurosurgery: transfuse regardless of count. Warm to 20–22°C before administration.", ref:"Level A" },
      { cat:"Plasma Factors", drug:"Fresh Frozen Plasma (FFP)", dose:"15–20 mL/kg IV — for factor deficiency (R-time >10 min, INR >1.5)", note:"Contains all clotting factors. ABO-compatible preferred. Must be thawed — maintain 2 units in trauma bay on ice. Alternatives: solvent-detergent FFP (Octaplas) or whole blood.", ref:"Level A" },
      { cat:"Rescue Therapy", drug:"Recombinant Factor VIIa (NovoSeven)", dose:"90–120 mcg/kg IV — refractory coagulopathy only", note:"Requires: pH >7.2, Temp >34°C, fibrinogen >1 g/L, platelets >50×10⁹/L (pre-conditions). Significant arterial thrombotic risk. Last resort only after all other agents trialled.", ref:"Level C" },
      { cat:"Adjunct", drug:"Desmopressin (DDAVP)", dose:"0.3 mcg/kg IV over 30 min (single dose, tachyphylaxis after 2nd)", note:"Enhances endogenous vWF release from Weibel–Palade bodies → improves platelet adhesion. Indicated for platelet dysfunction or pre-existing antiplatelet agent use (aspirin, clopidogrel).", ref:"Level C" },
    ],
    followup: [
      "Repeat TEG/ROTEM 30 min after each product administration to assess response and guide next intervention",
      "Targets: fibrinogen >2 g/L, INR <1.5, platelets >50×10⁹/L (>100 in TBI), pH >7.35, Temp >36°C, iCa²⁺ >1.1",
      "Anticoagulation reversal: warfarin → Vitamin K 10mg IV + 4-factor PCC; dabigatran → idarucizumab 5g IV; Xa inhibitors → andexanet alfa",
      "Haematology consult for underlying coagulation disorders (haemophilia, VWD, thrombocytopaenia) identified incidentally",
      "Recovery phase: Vitamin K 10mg IV daily for hepatic synthetic function. Iron IV if ferritin <30 mcg/L at 48h.",
    ],
    reference: "Brohi K et al., JTrauma 2007; TEG/ROTEM in Trauma — Critical Care 2022; ATLS 11th Edition Ch.3",
  },

  tbi: {
    definition: "Traumatic Brain Injury (TBI) is classified by GCS: mild (GCS 14–15), moderate (9–13), severe (≤8). Secondary brain injury — from hypoxia, hypotension, hyperthermia, hypoglycaemia, and hypercarbia — is preventable and is the primary target of acute management. Each episode of hypoxia (SpO₂ <90%) or hypotension (SBP <90 mmHg) independently doubles mortality.",
    keyCriteria: [
      "Severe TBI: GCS ≤8 — intubate immediately, head CT before any other imaging",
      "AVOID HYPOXIA: SpO₂ <90% at any point doubles TBI mortality (BTF Level IIA)",
      "AVOID HYPOTENSION: SBP <90 mmHg doubles TBI mortality — titrate vasopressors (BTF Level IIA)",
      "Herniation signs: unilateral dilated fixed pupil, posturing, deteriorating GCS → immediate hyperosmolar therapy",
      "CT indications: GCS <15, LOC, post-traumatic amnesia, vomiting ≥2, age >65, high-risk mechanism, anticoagulants",
      "Neurosurgical consult for: any haematoma with mass effect, midline shift >5mm, depressed skull fracture, GCS deterioration",
    ],
    workup: [
      { icon:"🧠", label:"CT Brain — Non-Contrast (Stat)", detail:"Mandatory for all GCS <15 + LOC/amnesia/mechanism. EDH: biconvex hyperdense (arterial — MMA). SDH: crescent hyperdense (venous — bridging veins). SAH: sulci/basal cisterns. Contusion: heterogeneous. Midline shift >5mm = neurosurgical emergency." },
      { icon:"🔦", label:"Pupillary Assessment — Bilateral", detail:"Unilateral fixed dilated pupil = ipsilateral CN III compression (uncal herniation — surgical emergency). Bilateral fixed dilated = severe global ischaemia or bilateral herniation. Document and reassess every 15 min. Quantitative pupillometry preferred." },
      { icon:"📊", label:"ICP Monitoring — Indications & Targets", detail:"Indications: GCS ≤8 + any CT abnormality. EVD (external ventricular drain) preferred — allows CSF drainage as treatment. Target: ICP <20 mmHg, CPP = MAP − ICP = 60–70 mmHg (BTF 2023)." },
      { icon:"🩸", label:"Anticoagulation Status + Reversal", detail:"Critical: pre-injury anticoagulants dramatically worsen TBI outcomes. Reversal mandatory: warfarin → 4F-PCC + Vit K; DOACs → specific reversal agents. Target INR <1.5, repeat CT at 4–6h if on anticoagulants." },
      { icon:"🩻", label:"CT C-Spine (Non-Contrast)", detail:"Mandatory in all unconscious trauma. Cannot clinically clear C-spine in GCS <15. Maintain full C-spine precautions until cleared by CT. MRI for SCIWORA (neurological deficit + normal CT)." },
      { icon:"🧪", label:"Blood Glucose (BSL)", detail:"Hypo and hyperglycaemia both worsen TBI outcomes. Target BSL 6–10 mmol/L. Hypoglycaemia <4 mmol/L = immediate dextrose 50% 50 mL IV. Avoid aggressive insulin use (hypoglycaemia risk)." },
    ],
    treatment: [
      { cat:"Airway", drug:"RSI: Ketamine + Rocuronium (TBI — evidence update)", dose:"Ketamine 1.5 mg/kg IV + Rocuronium 1.2 mg/kg IV", note:"ATLS 11th Ed / BTF 2023: ketamine does NOT raise ICP with controlled ventilation. Preferred over etomidate (adrenal suppression) or propofol (hypotension). Maintains CPP.", ref:"Level B" },
      { cat:"Ventilation", drug:"Normocapnia Target", dose:"EtCO₂ 35–40 mmHg (PaCO₂ 35–45 mmHg) — continuous waveform EtCO₂ mandatory", note:"Hyperventilation (PaCO₂ <35) causes cerebral vasoconstriction and ischaemia. Permitted ONLY as short-term bridge for acute herniation (PaCO₂ 30–35 mmHg, max 20–30 min).", ref:"Level A" },
      { cat:"BP Target", drug:"Noradrenaline / Vasopressin (SBP target)", dose:"BTF 2023: SBP ≥100 mmHg (age 50–69) or ≥110 mmHg (age 15–49 and >70); NA 0.05–0.5 mcg/kg/min", note:"Do NOT allow SBP <90 mmHg at any time in TBI — this is a hard minimum. Target MAP ≥80 mmHg for CPP ≥60 mmHg.", ref:"Level A" },
      { cat:"Hyperosmolar — Herniation", drug:"Hypertonic Saline 3%", dose:"250 mL IV bolus over 20 min (acute herniation); or 23.4% saline 30 mL IV via central line", note:"Preferred in hypovolaemia — maintains intravascular volume (unlike mannitol's osmotic diuresis). Target: Na 145–155 mmol/L, osmolality 310–320 mOsm/kg. Check electrolytes 4-hourly.", ref:"Level A" },
      { cat:"Hyperosmolar — Alternative", drug:"Mannitol 20%", dose:"0.5–1 g/kg IV bolus (haemodynamically stable patients ONLY)", note:"Contraindicated if SBP <90 mmHg or dehydrated. Osmotic diuresis — IDC mandatory, replace fluid loss. Max osmolality <320 mOsm/kg. Less preferred than HTS in hypotensive trauma.", ref:"Level A" },
      { cat:"Anticonvulsant", drug:"Levetiracetam (Keppra)", dose:"60 mg/kg IV loading (max 4,500 mg) over 15 min, then 1,500 mg BD", note:"BTF 2023 Level IIA: levetiracetam preferred over phenytoin for 7-day post-traumatic seizure prophylaxis. Moderate-severe TBI or high-risk features (SDH, haemorrhagic contusion).", ref:"Level B" },
    ],
    followup: [
      "Neurosurgical consult within 30 min for: GCS <9, haematoma >10mm or midline shift >5mm, deteriorating GCS, open depressed skull fracture",
      "Repeat CT at 6h or immediately if neurological deterioration; anticoagulated patients → CT at 4–6h regardless of initial CT",
      "ICP monitor protocol: drain CSF (EVD) for ICP >20 mmHg; escalate osmotherapy; consider decompressive craniectomy for refractory ICP >25 mmHg (RESCUEicp trial)",
      "Neuroprotective bundle: HOB 30°, normothermia (Temp <37.5°C — treat with paracetamol + active cooling), BSL 6–10, normocapnia, normoxia",
      "Hyperglycaemia management: insulin infusion targeting BSL 6–10 mmol/L — avoid episodes below 4 mmol/L",
      "Neuropsychology + rehabilitation referral: ALL moderate-severe TBI patients before discharge — MTBI follow-up at 2 weeks post-injury",
    ],
    reference: "Brain Trauma Foundation Guidelines 4th Ed — 2023; ATLS 11th Edition Chapter 6; RESCUEicp Trial NEJM 2016",
  },

  thoracic_trauma: {
    definition: "Thoracic trauma causes 25% of all trauma deaths. ATLS 11th Edition categorises injuries into 'immediately life-threatening' (identified and treated in primary survey) and 'potentially life-threatening' (identified in secondary survey). 85% of thoracic trauma is managed non-operatively with tube thoracostomy and supportive care.",
    keyCriteria: [
      "6 immediately life-threatening (Primary Survey): tension PTX, massive haemothorax, open PTX, flail chest, cardiac tamponade, airway obstruction",
      "6 potentially life-threatening (Secondary Survey): traumatic aortic injury, diaphragm tear, tracheobronchial disruption, oesophageal injury, pulmonary contusion, blunt cardiac injury",
      "Massive haemothorax: immediate drainage >1,500 mL OR ongoing >200 mL/h for 4h = operative thoracotomy",
      "Beck's triad (cardiac tamponade): hypotension + JVD + muffled heart sounds. Confirm on E-FAST (pericardial effusion + RV collapse)",
      "Aortic injury: widened mediastinum >8cm, first/second rib fracture, deceleration mechanism → CTA aorta",
      "Pulmonary contusion: peak dysfunction at 48–72h — monitor closely, early HFNC/NIV, avoid over-resuscitation",
    ],
    workup: [
      { icon:"📡", label:"E-FAST — Cardiac + Bilateral Pleural", detail:"Pericardial: effusion + RV diastolic collapse = tamponade. Pleural: anechoic fluid above diaphragm = haemothorax. Absent lung sliding = PTX. Perform within 2 min of arrival — guides all immediate interventions." },
      { icon:"🩻", label:"CXR — Portable AP", detail:"Haemothorax (opacification), PTX, mediastinal widening >8cm (aortic injury), tracheal deviation, rib fractures (≥3 consecutive = flail risk), subcutaneous emphysema, pneumomediastinum, diaphragm elevation." },
      { icon:"🩻", label:"CT Chest + CTA Aorta (Stable Patients)", detail:"Gold standard. Quantifies haemothorax, characterises rib fractures, pulmonary contusion grade, pneumomediastinum, pericardial effusion. CTA: traumatic aortic injury — intimal tear, pseudoaneurysm, free rupture." },
      { icon:"📊", label:"ECG — Blunt Cardiac Injury", detail:"All significant blunt thoracic trauma. New RBBB, AF, ST-segment changes, PVCs suggest myocardial contusion. Troponin I/T at presentation and 4–6h. Echo if ECG abnormal or troponin elevated." },
      { icon:"🩺", label:"Beck's Triad + Kussmaul's Sign", detail:"Tamponade: distended neck veins, muffled heart sounds, hypotension. Kussmaul's sign: JVD increases on inspiration (paradoxical). Pulsus paradoxus >10 mmHg. E-FAST confirms — RV diastolic collapse is pathognomonic." },
    ],
    treatment: [
      { cat:"Cardiac Tamponade", drug:"Emergency Pericardiocentesis (Temporising)", dose:"Subxiphoid approach, 18G spinal needle, USS-guided, aspirate 30–50 mL", note:"Temporising ONLY — definitive treatment is operative pericardial window or thoracotomy. Proceed to OR immediately after needle decompression. Reaccumulation is common.", ref:"Level B" },
      { cat:"Cardiac Tamponade", drug:"Emergency Department Thoracotomy (EDT)", dose:"Left anterolateral thoracotomy — penetrating cardiac arrest/peri-arrest", note:"EDT indications: penetrating cardiac injury, arrest or peri-arrest, <15 min CPR. Survival to discharge: penetrating cardiac ~30%, penetrating general ~15%, blunt <2%. Not indicated in blunt multi-system trauma.", ref:"Level B" },
      { cat:"Massive Haemothorax", drug:"Tube Thoracostomy (ICC) + Autotransfusion", dose:"32–36F ICC, 4th–5th ICS, AAL. Autotransfusion if drainage >1,500 mL.", note:"Thoracotomy indications: immediate drainage >1,500 mL OR >200 mL/h × 4h OR haemodynamic instability. VATS for retained haemothorax >500 mL at 48–72h.", ref:"Level A" },
      { cat:"Traumatic Aortic Injury", drug:"Anti-impulse Therapy (Bridge to TEVAR)", dose:"Esmolol IV: 500 mcg/kg loading, then 50–200 mcg/kg/min. Target HR <100 bpm, SBP <120 mmHg", note:"TEVAR (thoracic endovascular aortic repair) is gold standard — mortality 5–10% vs open repair 20–30%. Bridge with anti-impulse therapy until IR suite available. Free rupture = immediate OR.", ref:"Level A" },
      { cat:"Flail Chest", drug:"Pain Management + PPV if Required", dose:"Epidural analgesia (best), paravertebral block, or intercostal nerve blocks. Intubate for respiratory failure (SpO₂ <90% on high-flow O₂, RR >35)", note:"Underlying pulmonary contusion drives respiratory failure — peaks at 48–72h. PPV: TV 6 mL/kg, PEEP 5–8. Surgical rib fixation (ORIF) in selected patients: >3 rib fractures with flail + respiratory failure.", ref:"Level B" },
      { cat:"Blunt Cardiac Injury", drug:"Monitoring + Rate Control if AF", dose:"12-lead ECG, troponin ×2 (4–6h apart), 24h cardiac monitoring if abnormal", note:"No specific treatment for isolated contusion — supportive. Rate control for new AF: metoprolol 25–50 mg PO/IV. Echocardiography for suspected structural injury (valve, wall motion abnormality).", ref:"Level B" },
    ],
    followup: [
      "Post-ICC care: CXR to confirm position and lung expansion, hourly drain output documentation, underwater seal — do NOT clamp",
      "Pulmonary contusion: serial ABG and CXR at 6h, 12h, 24h — peak dysfunction at 48–72h. Preparation for HFNC/NIV/intubation",
      "Retained haemothorax: if >500 mL on CXR/CT at 48–72h → VATS or fibrinolytics (tPA/DNase) to prevent fibrothorax and empyema",
      "Rib fractures: multimodal analgesia — NSAID + opioid + regional block. Thoracic epidural reduces pneumonia by 50% in flail chest",
      "TEVAR follow-up: CT angiography at 1 month, 6 months, 12 months, then annually — endoleak surveillance",
      "Cardiac contusion: follow-up echocardiogram at 2–4 weeks; haematology review if new arrhythmia",
    ],
    reference: "ATLS 11th Edition Chapter 4; WTA Thoracic Trauma Guidelines 2023; AORTA Registry Guidelines",
  },

  abdominal_trauma: {
    definition: "Abdominal trauma encompasses solid organ injuries (spleen, liver, kidney), hollow viscus injuries (bowel, bladder, ureter), mesenteric injuries, and vascular injuries. Management is determined entirely by haemodynamic status: unstable patients proceed directly to laparotomy, stable patients proceed to CT for grading and planning. Non-operative management (NOM) is successful in 80–90% of solid organ injuries in stable patients.",
    keyCriteria: [
      "Haemodynamically unstable + positive E-FAST = emergent damage control laparotomy (NO CT)",
      "Haemodynamically stable = CT abdomen/pelvis with IV contrast (oral contrast NOT required, delays imaging)",
      "NOM: successful in spleen Grade I–III (85%), liver Grade I–IV (80%), kidney Grade I–III (>90%)",
      "Hollow viscus injury: CT sensitivity 75–90% — serial abdominal exams every 4–6h are mandatory to detect delayed presentation",
      "AAST Grade V injuries (any organ): near-universal operative management",
      "Diaphragm injury: missed on initial CT in ~50% — suspect with lower chest trauma, gastric herniation on CXR",
    ],
    workup: [
      { icon:"📡", label:"E-FAST — Abdominal Windows", detail:"Morrison's pouch (hepatorenal), splenorenal, Douglas pouch/pelvic. Any free fluid = positive. Sensitivity 73–88% for haemoperitoneum (requires ~250–600 mL). Positive E-FAST + instability = immediate laparotomy." },
      { icon:"🩻", label:"CT Abdomen/Pelvis — IV Contrast (Arterial + Portal)", detail:"Stable patients: AAST solid organ grading, arterial blush (active extravasation), retroperitoneal haematoma, pneumoperitoneum (hollow viscus), mesenteric fat stranding, pelvic injuries, diaphragm." },
      { icon:"🩸", label:"Serial Haemoglobin (NOM Protocol)", detail:"Baseline, 4h, 8h, 24h during NOM. Hb drop >20 g/L or absolute Hb <80 g/L in haemorrhagic context = CT rescan ± IR embolisation ± operative intervention." },
      { icon:"🧪", label:"LFTs, Lipase, Troponin", detail:"ALT/AST: hepatic injury marker. Lipase: pancreatic injury (elevation may be delayed 12–24h; amylase has poor sensitivity). Troponin: blunt cardiac injury (concomitant thoracoabdominal trauma)." },
      { icon:"🔬", label:"Urinalysis + CT IVP / Cystogram", detail:"Haematuria (micro or macro) = renal injury evaluation. CT urogram (delayed phase at 10 min) for collecting system injury. Retrograde urethrogram before IDC if blood at meatus. CT cystogram for bladder injury." },
    ],
    treatment: [
      { cat:"Unstable — Immediate", drug:"Damage Control Laparotomy", dose:"Midline laparotomy, 4-quadrant survey, haemostasis (packing), contamination control (staplers), temporary closure (VAC)", note:"No delay for CT or additional imaging. Activate MTP. Do not attempt primary anastomosis or definitive repair in unstable patients.", ref:"Level A" },
      { cat:"Stable — NOM", drug:"Non-Operative Management (Solid Organ)", dose:"ICU or high-dependency admission; serial abdominal exams every 4h; serial Hb; NPO initially", note:"Spleen Grade I–III: 85% NOM success. Grade IV–V: 65% with IR. Liver: slightly lower NOM rate due to arterial anatomy complexity. Kidney: NOM >90% Grade I–III.", ref:"Level A" },
      { cat:"Stable — IR", drug:"Angioembolisation (Splenic / Hepatic / Renal)", dose:"Selective or non-selective transcatheter embolisation via IR", note:"Indicated for: arterial blush on CT, Grade III+ solid organ with haemodynamic instability responsive to resuscitation, failed NOM with repeat CT evidence of bleeding.", ref:"Level A" },
      { cat:"Hollow Viscus", drug:"Operative Repair / Resection + Antibiotics", dose:"Primary repair (small bowel, clean injury, <50% circumference); resection ± stoma (colon, contaminated, damage control)", note:"Broad-spectrum antibiotics: piperacillin-tazobactam 4.5g IV q6h or meropenem 1g IV q8h (faecal contamination). Duration 24–48h if source controlled. Delayed anastomosis in damage control.", ref:"Level A" },
      { cat:"Pancreatic Injury", drug:"ERCP / Distal Pancreatectomy (Grade III+)", dose:"ERCP + stenting for ductal injury Grade III. Distal pancreatectomy for Grade IV–V", note:"Pancreatic ductal injury (Grade III+): ERCP/MRCP for diagnosis. Delay pancreatectomy until physiologically stable. Major pancreatic surgery: specialist HPB surgeon required.", ref:"Level B" },
    ],
    followup: [
      "NOM discharge criteria: haemodynamically stable ×24h, tolerating oral intake, pain controlled on oral analgesia, serial Hb stable",
      "Activity restriction post-NOM: no contact sport 6–8 weeks for Grade III+ solid organ injury",
      "Repeat CT at 4–6 weeks for Grade IV–V solid organ injury — delayed failure of NOM can occur up to 6 weeks post-injury",
      "Post-splenectomy vaccinations (within 2 weeks): PCV13 + PPSV23 (Pneumococcal), Hib (Haemophilus), Meningococcal (ACWY + B) — critical for asplenic sepsis prevention",
      "Hollow viscus patients: re-look laparotomy at 24–48h for damage control cases. Stoma reversal: typically 3–6 months after full recovery",
      "Missed injury surveillance: CT-occult hollow viscus injury presents 12–72h post-injury with deteriorating clinical exam — low threshold for re-imaging or diagnostic laparoscopy",
    ],
    reference: "ATLS 11th Edition Chapter 5; EAST Abdominal Trauma PMG 2022; AAST Organ Injury Scale; WTA NOM Guidelines",
  },
};

// ════════════════════════════════════════════════════════════
//  ▼▼▼  SHARED INFRASTRUCTURE — DO NOT EDIT BELOW  ▼▼▼
// ════════════════════════════════════════════════════════════

const T = {
  bg:"#050f1e", txt:"#e8f0fe", txt2:"#8aaccc", txt3:"#4a6a8a", txt4:"#2e4a6a",
  border:"rgba(26,53,85,0.8)", borderHi:"rgba(42,79,122,0.9)",
  coral:"#ff6b6b", gold:"#f5c842", teal:"#00e5c0", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0",
};
const AC = HUB_CONFIG.accentColor;

function GlassBg() {
  const a = HUB_CONFIG.accentColor;
  const orbs = [
    { x:"9%",  y:"16%", r:300, c:`${a}09` },
    { x:"87%", y:"11%", r:250, c:`rgba(155,109,255,0.05)` },
    { x:"79%", y:"79%", r:330, c:`${a}07` },
    { x:"17%", y:"83%", r:210, c:`rgba(245,200,66,0.04)` },
    { x:"50%", y:"46%", r:390, c:`rgba(59,158,255,0.03)` },
  ];
  return (
    <div style={{ position:"fixed", inset:0, overflow:"hidden", pointerEvents:"none", zIndex:0 }}>
      {orbs.map((o, i) => (
        <div key={i} style={{
          position:"absolute", left:o.x, top:o.y,
          width:o.r*2, height:o.r*2, borderRadius:"50%",
          background:`radial-gradient(circle,${o.c} 0%,transparent 68%)`,
          transform:"translate(-50%,-50%)",
          animation:`hto${i%3} ${8+i*1.3}s ease-in-out infinite`,
        }}/>
      ))}
      <svg width="100%" height="100%" style={{ position:"absolute", inset:0, opacity:0.036 }}>
        <defs>
          <pattern id="htg" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0L0 0 0 40" fill="none" stroke={a} strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#htg)"/>
      </svg>
      <style>{`
        @keyframes hto0{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-50%) scale(1.12)}}
        @keyframes hto1{0%,100%{transform:translate(-50%,-50%) scale(1.08)}50%{transform:translate(-50%,-50%) scale(0.9)}}
        @keyframes hto2{0%,100%{transform:translate(-50%,-50%) scale(0.95)}50%{transform:translate(-50%,-50%) scale(1.1)}}
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
        <div style={{
          fontSize:12, fontWeight:600, color: checked ? AC : T.txt,
          textDecoration: checked ? "line-through" : "none",
        }}>
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
  const data = { ...(CLINICAL_DATA[condition.id] || {}), ...(contentMap?.[condition.id] || {}) };
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
            <div style={{ fontSize:9, color:T.txt4, textTransform:"uppercase", letterSpacing:".06em", marginBottom:2 }}>Incidence</div>
            <div style={{ fontSize:11, fontWeight:700, color:condition.color, fontFamily:"'JetBrains Mono',monospace" }}>
              {condition.incidence}
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
              {(!data.followup || data.followup.length === 0) && (
                <div style={{ color:T.txt3, fontSize:12, textAlign:"center", padding:"24px 0" }}>No follow-up items defined.</div>
              )}
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
        animation:`ht-in 0.52s ease both ${index * 0.055}s`,
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
      <style>{`@keyframes ht-in{from{opacity:0;transform:translateY(18px) scale(0.96)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>
    </div>
  );
}

export default function TraumaHub({ onBack }) {
  const navigate = useNavigate();
  const [selected,  setSelected]  = useState(null);
  const [search,    setSearch]    = useState("");
  const [category,  setCategory]  = useState("All");
  const [contentMap, setContentMap] = useState({});

  useEffect(() => {
    base44.entities.ProtocolContent.filter({ hub_id: "trauma" })
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
          <div style={{ position:"absolute", inset:0, background:`linear-gradient(108deg,${AC}07 0%,transparent 55%,rgba(59,158,255,0.03) 100%)`, pointerEvents:"none" }}/>
          <div style={{ display:"flex", alignItems:"flex-start", gap:20, position:"relative" }}>
            <div style={{
              width:64, height:64, borderRadius:18, flexShrink:0,
              background:`linear-gradient(135deg,${AC}22,rgba(255,107,107,0.12))`,
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
                  background:"rgba(255,107,107,0.1)", color:"#ff6b6b", border:"1px solid rgba(255,107,107,0.3)", letterSpacing:".06em",
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
                { v: CONDITIONS.length, l:"Protocols", c:AC },
                { v: CATEGORIES.length, l:"Categories", c:"#ff6b6b" },
                { v: "2023",            l:"Edition",   c:T.gold },
                { v: "EM/Trauma",       l:"Specialty",  c:T.blue },
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
          background:"rgba(255,107,107,0.06)", border:"1px solid rgba(255,107,107,0.2)",
          borderRadius:12, padding:"10px 16px", marginBottom:16,
          display:"flex", alignItems:"center", gap:12, backdropFilter:"blur(12px)",
        }}>
          <div style={{ width:8, height:8, borderRadius:"50%", background:T.coral, flexShrink:0, animation:"htpulse 1.5s ease-in-out infinite" }}/>
          <span style={{ fontSize:11, color:"#ff9999", fontFamily:"'JetBrains Mono',monospace", fontWeight:700, flexShrink:0 }}>
            ATLS 11TH EDITION
          </span>
          <span style={{ fontSize:11, color:T.txt2 }}>
            Clinical decision support only — all protocols based on ACS Committee on Trauma ATLS 11th Edition and current evidence-based guidelines. Final clinical decisions rest with the treating physician.
          </span>
          <style>{`@keyframes htpulse{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(255,107,107,.4)}50%{opacity:.8;box-shadow:0 0 0 6px rgba(255,107,107,0)}}`}</style>
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