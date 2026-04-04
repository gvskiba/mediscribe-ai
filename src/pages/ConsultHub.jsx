import { useState, useCallback, useMemo } from "react";

// ── Font + CSS Injection ─────────────────────────────────────────
(() => {
  if (document.getElementById("consult-fonts")) return;
  const l = document.createElement("link"); l.id = "consult-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "consult-css";
  s.textContent = `
    *{box-sizing:border-box;margin:0;padding:0;}
    ::-webkit-scrollbar{width:3px;height:3px;}
    ::-webkit-scrollbar-track{background:transparent;}
    ::-webkit-scrollbar-thumb{background:rgba(42,79,122,0.5);border-radius:2px;}
    @keyframes fadeSlide{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
    @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    .fade-in{animation:fadeSlide .22s ease forwards;}
    .con-spin{animation:spin 1s linear infinite;display:inline-block;}
    .shimmer-text{
      background:linear-gradient(90deg,#e8f0fe 0%,#fff 30%,#9b6dff 52%,#00e5c0 72%,#e8f0fe 100%);
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
const CATS = [
  {id:"all",      label:"All 16",           color:T.teal  },
  {id:"cardiac",  label:"Cardiac/Vascular", color:T.red   },
  {id:"neuro",    label:"Neurological",     color:T.purple},
  {id:"surgical", label:"Surgical",         color:T.orange},
  {id:"medical",  label:"Medical",          color:T.blue  },
  {id:"other",    label:"Other",            color:T.yellow},
];

const SPECIALTIES = [
  {
    id:"cardiology", name:"Cardiology", icon:"❤️", color:T.red, cat:"cardiac",
    hook:"Lead with EKG and troponin trend — read the strip yourself before dialing",
    sections:[
      {label:"Pre-Call Prep",       col:T.teal,   items:["12-lead EKG with timestamp in hand","Troponin: value, draw time, and 2h delta","Vital signs trend — not just current values","Current anticoagulants and antiplatelets; IV access location"]},
      {label:"They Will Ask",       col:T.yellow, items:["Read me the EKG — they will quiz you on it","Troponin: initial value, second value, direction","Hemodynamic status: MAP, any signs of shock","Prior cardiac history, known EF, prior cath or stents"]},
      {label:"They Will Recommend", col:T.green,  items:["STEMI: heparin + DAPT, activate cath lab now","UA/NSTEMI: anticoagulate, risk stratify (TIMI/HEART), admit telemetry","CHF exacerbation: diuresis, BNP, echo, afterload reduction","Arrhythmia: rate vs rhythm control; EP if refractory or unstable"]},
      {label:"Phone Only",          col:T.blue,   items:["Stable known AFib, HR ≤110, no hemodynamic compromise","Borderline troponin with clear non-cardiac explanation and stable vitals","Isolated PVCs, asymptomatic, no structural disease by history","Chronic CHF minor decompensation, no O2 requirement change"]},
      {label:"Come In Immediately", col:T.red,    items:["STEMI or equivalent — call attending directly, page cath lab simultaneously","Cardiogenic shock: cool extremities, MAP <65, rising lactate","New high-degree AV block in the setting of anterior MI","New murmur + hemodynamic instability — acute valvular emergency"]},
      {label:"Disposition Pattern", col:T.purple, items:["STEMI → Cath Lab → CCU","NSTEMI/UA stable → Telemetry (cath next AM or urgent)","CHF → Floor (O2 <3L) or Stepdown (≥3L or BiPAP)","Rule-out ACS → Observation with serial troponins × 3h or 6h protocol"]},
    ],
    pearl:"Call the attending directly for STEMI and cardiogenic shock — never route through the fellow first. Always have a working alternative diagnosis if calling about a borderline troponin. 'Elevated troponin, not sure why' gets pushback. They want your pretest probability.",
  },
  {
    id:"ctvs", name:"CT / Vascular Surgery", icon:"🔪", color:T.coral, cat:"cardiac",
    hook:"Answer the only question they have: does this need the OR tonight?",
    sections:[
      {label:"Pre-Call Prep",       col:T.teal,   items:["CTA findings available — aortic diameter, dissection type, rupture signs","Hemodynamic status and trend — is the patient compensating?","Anticoagulation status and timing of last dose","Type and screen, massive transfusion protocol status, blood bank notified?"]},
      {label:"They Will Ask",       col:T.yellow, items:["CTA results — specifically aortic involvement, distal perfusion","Is the patient hemodynamically stable or deteriorating?","Any anticoagulation on board, especially TPA given?","OR availability notified? Anesthesia aware?"]},
      {label:"They Will Recommend", col:T.green,  items:["Type A dissection: emergent OR — call OR and anesthesia simultaneously","Type B stable: ICU admission, IV beta-blockade (labetalol/esmolol), SBP 100–120","Ruptured AAA: emergent OR/EVAR, activate MTP, push blood products","Acute limb ischemia: emergent embolectomy or catheter-directed thrombolysis"]},
      {label:"Phone Only",          col:T.blue,   items:["Stable Type B dissection, BP controlled, no malperfusion signs","Incidental AAA <5.5cm, hemodynamically stable, non-urgent referral","Claudication without rest pain, ulceration, or limb threat","Superficial wound with vascular concern — photos and next-day clinic"]},
      {label:"Come In Immediately", col:T.red,    items:["Ruptured or symptomatic AAA — page OR team and anesthesia in the same call","Type A aortic dissection — simultaneous cardiac surgery and OR notification","Acute limb ischemia: 6Ps present (pulseless, pale, pain, paresthesia, paralysis, poikilothermia)","Mesenteric ischemia with peritonitis or clinical deterioration"]},
      {label:"Disposition Pattern", col:T.purple, items:["Emergent OR → STICU post-operatively","Type B stable dissection → ICU, SBP goal 100–120, heart rate control","Acute limb ischemia post-revascularization → STICU for reperfusion monitoring","Surveillance AAA → Discharge with urgent vascular clinic"]},
    ],
    pearl:"Answer their first question before they ask it: 'This is/is not a surgical emergency tonight.' For dissections, lead with type, BP, and end-organ involvement. They will not leave their bed for a 4.8cm incidental AAA in a stable patient.",
  },
  {
    id:"neurology", name:"Neurology", icon:"🧠", color:T.purple, cat:"neuro",
    hook:"Give NIH stroke scale, last-known-well time, and code status in the first 30 seconds",
    sections:[
      {label:"Pre-Call Prep",       col:T.teal,   items:["NIHSS score — perform and document before calling","Last known well time — exact, not approximate","CT head result and CT perfusion/CTA if completed","Current anticoagulation: drug, last dose, reversal given?"]},
      {label:"They Will Ask",       col:T.yellow, items:["NIHSS — they expect you to have done it","Last known well — this determines lytic and thrombectomy eligibility","What does the CT show? Any hemorrhage or early ischemic change?","Current anticoagulation and platelet therapy — exclusion criteria for TPA"]},
      {label:"They Will Recommend", col:T.green,  items:["Ischemic stroke in window: TPA protocol or thrombectomy evaluation (LVO on CTA)","Seizure: benzodiazepines, then levetiracetam or valproate if breakthrough","Meningitis: empiric antibiotics — do not wait for LP if antibiotics already delayed","Elevated ICP: HOB 30°, osmolar therapy, neurosurgery co-consult if herniating"]},
      {label:"Phone Only",          col:T.blue,   items:["Resolved TIA, patient neurologically intact, ABCD2 score calculated","Established epilepsy patient at baseline, follow-up with outpatient neurology","Headache with reassuring features, normal exam, negative CT","Vertigo without focal deficits — HINTS exam negative for central cause"]},
      {label:"Come In Immediately", col:T.red,    items:["LVO on CTA — thrombectomy window open, they want to assess immediately","Stroke with deterioration — expanding infarct, malignant MCA syndrome","Status epilepticus refractory to two benzodiazepines","Bacterial meningitis with AMS, fever, stiff neck — call ID simultaneously"]},
      {label:"Disposition Pattern", col:T.purple, items:["Ischemic stroke: Stroke Unit or ICU depending on severity and intervention","LVO post-thrombectomy → Neuro-ICU","Seizure workup → Epilepsy monitoring unit or neurology floor","Meningitis → ICU if altered, floor if intact with rapid improvement"]},
    ],
    pearl:"Neurology calls live and die by last-known-well time and NIHSS. Do both before you call. If you cannot determine last known well, default to 'unknown onset' — this changes their entire algorithm. They will come immediately for an LVO with NIHSS ≥6 in any time window.",
  },
  {
    id:"neurosurgery", name:"Neurosurgery", icon:"🔬", color:T.rose, cat:"neuro",
    hook:"They want: type of bleed, volume, midline shift, and GCS trend — in that order",
    sections:[
      {label:"Pre-Call Prep",       col:T.teal,   items:["CT head result with specific findings: bleed type, volume estimate, shift","GCS on arrival and current GCS — trend is critical","Pupil exam: size, reactivity, symmetry","Anticoagulation status: drug, last dose, reversal agent given and time"]},
      {label:"They Will Ask",       col:T.yellow, items:["What does the CT show exactly — EDH, SDH, IPH, SAH?","What is the GCS now vs on arrival? Improving or deteriorating?","Are pupils equal and reactive? Any blown pupil?","Anticoagulation reversed? INR if on warfarin, platelet count?"]},
      {label:"They Will Recommend", col:T.green,  items:["EDH with compression: emergent OR — direct transfer to OR holding","Large SDH with shift >5mm: OR vs ICP monitor based on GCS","SAH with aneurysm on CTA: endovascular vs surgical clipping, nimodipine","Spinal cord compression: dexamethasone 10mg IV, MRI stat, OR decision"]},
      {label:"Phone Only",          col:T.blue,   items:["Small SDH <1cm, no shift, GCS 15, no anticoagulation — admit neuro obs","Traumatic SAH without aneurysm on CTA — admit, repeat CT in 6h","Stable VP shunt patient, shunt series done, no obvious malfunction signs","Small contusion, GCS intact, no anticoagulation — observe and repeat CT"]},
      {label:"Come In Immediately", col:T.red,    items:["EDH with mass effect or pupillary change — call OR simultaneously","GCS deterioration with any intracranial hemorrhage — herniation imminent","Blown pupil: transtentorial herniation — mannitol now, call OR","Cauda equina syndrome: new urinary retention + saddle anesthesia + weakness"]},
      {label:"Disposition Pattern", col:T.purple, items:["Craniotomy/craniectomy → Neuro-ICU","SDH managed conservatively → ICU or Neuro step-down","Spinal cord compression → OR or Neuro-ICU post-decompression","SAH graded Hunt-Hess I-II → Neuro-ICU with aneurysm treatment"]},
    ],
    pearl:"Reverse anticoagulation BEFORE calling — they will ask if it's done, and 'I'm waiting on your call to decide' is the wrong answer. For SAH, give nimodipine 60mg q4h before the call. Herniation signs (pupil dilation, posturing, GCS drop >2) — call while walking to the CT scanner.",
  },
  {
    id:"gensurg", name:"General Surgery", icon:"⚕️", color:T.orange, cat:"surgical",
    hook:"Frame around: peritoneal signs, surgical abdomen or not, and operative urgency",
    sections:[
      {label:"Pre-Call Prep",       col:T.teal,   items:["CT abdomen/pelvis results — read the radiology report yourself","Abdominal exam findings: rigidity, guarding, rebound, bowel sounds","Vital sign trend — HR/BP reflecting clinical trajectory","NPO status and time of last oral intake"]},
      {label:"They Will Ask",       col:T.yellow, items:["Does the patient have peritoneal signs on exam — guarding, rigidity, rebound?","What does CT show — free air, obstruction, perforation, ischemia?","Is the patient hemodynamically stable or deteriorating?","Last oral intake — timing for OR planning"]},
      {label:"They Will Recommend", col:T.green,  items:["Free air from perforation: emergent OR, broad-spectrum antibiotics now","Appendicitis: NPO, IV antibiotics, OR vs interventional drainage based on CT","SBO with ischemia signs: emergent OR; SBO without ischemia: admit, NGT decompression","Cholecystitis: NPO, IV antibiotics, laparoscopic chole (timing determined by severity)"]},
      {label:"Phone Only",          col:T.blue,   items:["Uncomplicated appendicitis, afebrile, WBC <13 — IV antibiotics, admit, OR in AM","Simple cholecystitis, stable vitals, no CBD dilation — antibiotics, elective chole","SBO at partial, no ischemia signs, decompressing — NGT, admit, conservative management","Anal/rectal complaint without abscess, systemic signs, or ischemia"]},
      {label:"Come In Immediately", col:T.red,    items:["Free air on CT — perforation until proven otherwise, emergent OR","GI hemorrhage with hemodynamic instability despite resuscitation","Suspected mesenteric ischemia: lactate elevated, peritoneal signs, atrial fibrillation","Incarcerated hernia with bowel in sac, obstruction signs — OR for reduction"]},
      {label:"Disposition Pattern", col:T.purple, items:["Emergent OR → STICU or surgical floor based on procedure","Appendicitis conservative → Surgical floor, OR next AM","SBO managed conservatively → Surgical floor, NG decompression","Abscess with IR drainage → Floor with serial exams"]},
    ],
    pearl:"General surgery has one question: 'Does this belly need the OR tonight?' Give them the CT findings and your exam findings — specifically the presence or absence of peritoneal signs. They will not come in for 'abdominal pain with elevated lipase and no peritoneal signs' — that's pancreatitis, not a surgical abdomen.",
  },
  {
    id:"ortho", name:"Orthopedic Surgery", icon:"🦴", color:T.yellow, cat:"surgical",
    hook:"Open fractures, compartment syndrome, septic joints, and spine with deficits — those are the calls that matter",
    sections:[
      {label:"Pre-Call Prep",       col:T.teal,   items:["X-rays reviewed — fracture type, displacement, articular involvement","Neurovascular exam distal to injury: pulses, cap refill, sensation, motor","Open fracture: wound size, contamination, time since injury","Compartment pressures if compartment syndrome suspected (delta pressure <30mmHg)"]},
      {label:"They Will Ask",       col:T.yellow, items:["Is there an open wound communicating with the fracture?","Neurovascular status distal to the fracture — pulses intact?","What does the X-ray show — fracture pattern, displacement, involvement of joint?","Compartment firmness: hard, tense, pain with passive stretch?"]},
      {label:"They Will Recommend", col:T.green,  items:["Open fracture: OR within 6–8h, IV cefazolin now, tetanus, saline-soaked dressing","Compartment syndrome: emergent fasciotomy — start OR notification call","Septic joint: joint aspiration stat (before antibiotics if possible), OR for washout","Spinal cord compression: dexamethasone, MRI, OR decision with neurosurgery co-consult"]},
      {label:"Phone Only",          col:T.blue,   items:["Closed non-displaced fracture, intact neurovasculature — splint, RICE, ortho clinic 1 week","Simple ankle fracture, Ottawa negative, or non-weight-bearing minor injury","Dislocated shoulder reduced in ED, post-reduction film normal — sling, outpatient follow","Stable compression fracture without cord involvement or significant kyphosis"]},
      {label:"Come In Immediately", col:T.red,    items:["Open fracture — antibiotic clock is ticking, OR prep should start now","Compartment syndrome — fasciotomy cannot wait, pressure >30mmHg delta is surgical","Vascular injury with fracture — ortho and vascular surgery co-call simultaneously","Cauda equina: new urinary retention + saddle numbness + motor deficit = OR tonight"]},
      {label:"Disposition Pattern", col:T.purple, items:["Open fracture → OR → Orthopedic floor","Compartment syndrome fasciotomy → STICU for wound care and monitoring","Septic joint washout → Orthopedic floor, IV antibiotics, ID co-consult","Spinal fracture with instability → Spine unit or STICU depending on cord involvement"]},
    ],
    pearl:"Ortho is territorial about X-ray interpretation — do not guess the fracture type on the phone. Say 'fracture through the mid-shaft of the femur with significant comminution' not 'bad leg break.' For septic joints, if you aspirate before calling them, have the synovial fluid WBC ready — that number determines OR urgency.",
  },
  {
    id:"urology", name:"Urology", icon:"🫘", color:T.blue, cat:"surgical",
    hook:"Testicular torsion is a 4–6 hour window. Lead with that if it's on your differential",
    sections:[
      {label:"Pre-Call Prep",       col:T.teal,   items:["Testicular torsion: ultrasound with Doppler if done — but DO NOT delay call for imaging","Urosepsis: culture results if back, lactate, hemodynamic status","Stone: CT urography showing stone size, location, and degree of obstruction","Urinary retention: post-void residual, history of BPH or neurogenic bladder"]},
      {label:"They Will Ask",       col:T.yellow, items:["Testicular torsion: duration of symptoms, ultrasound results, high-ride testicle on exam?","Urosepsis: has the urine been sent? Blood cultures drawn? Lactate?","Stone: size and location on CT — proximal ureter vs distal, degree of hydronephrosis?","Priapism: duration, ischemic vs non-ischemic, prior episodes, medications?"]},
      {label:"They Will Recommend", col:T.green,  items:["Testicular torsion: emergent OR for bilateral orchiopexy — do not delay for definitive imaging","Urosepsis with obstruction: urgent PCN (percutaneous nephrostomy) or ureteral stent","Stone with infection: urgent drainage, sepsis management, analgesia, alpha-blocker","Priapism ischemic: aspiration + irrigation in ED, OR if refractory >4h"]},
      {label:"Phone Only",          col:T.blue,   items:["Uncomplicated urolithiasis, afebrile, stone ≤7mm — pain management, tamsulosin, urology follow","Urinary retention, successful Foley placed, no infection signs — outpatient urology follow","UTI without sepsis or obstruction — antibiotics, outpatient follow","Microscopic hematuria without clot retention or obstruction — outpatient workup"]},
      {label:"Come In Immediately", col:T.red,    items:["Testicular torsion — every minute of delay = testicle loss; call while prepping OR","Urosepsis with obstructed system — drainage is source control, cannot wait","Priapism ischemic >4h — ischemia is occurring, compartment syndrome of the penis","Fournier's gangrene: necrotizing perineal infection, OR for debridement now"]},
      {label:"Disposition Pattern", col:T.purple, items:["Torsion OR → Urology floor, ultrasound in 24h","Obstructed urosepsis post-drainage → ICU or stepdown depending on hemodynamics","Stone with intervention → Urology floor, repeat imaging before discharge","Priapism resolved → Floor vs discharge based on response"]},
    ],
    pearl:"Testicular torsion: if the ultrasound is not immediately available and clinical suspicion is high, call urology for immediate OR — a negative exploration is infinitely better than a missed torsion. They know this. Any competent urologist will go to OR on clinical suspicion alone.",
  },
  {
    id:"obgyn", name:"OB / GYN", icon:"🌸", color:T.rose, cat:"surgical",
    hook:"Quantitative beta-hCG, hemodynamic stability, and ultrasound are the three things that drive every decision",
    sections:[
      {label:"Pre-Call Prep",       col:T.teal,   items:["Quantitative beta-hCG value and trend if serial levels available","Transvaginal ultrasound: IUP present? Free fluid? Adnexal mass?","Hemodynamic status — ectopic rupture presents with hemorrhagic shock","Gestational age if known, LMP, contraception method, prior ectopics"]},
      {label:"They Will Ask",       col:T.yellow, items:["Beta-hCG level — and is there an IUP on ultrasound?","Is the patient hemodynamically stable? Any peritoneal signs?","Ultrasound findings: free fluid in Morrison's pouch or pelvis?","Gestational age, LMP, prior OB/GYN history, STI history if PID suspected"]},
      {label:"They Will Recommend", col:T.green,  items:["Ectopic with free fluid/instability: emergent OR — call OR simultaneously","Ectopic stable, hCG <5000: methotrexate protocol vs OR based on size and vitals","Ovarian torsion: OR for detorsion — timing depends on hemodynamics and ultrasound","Eclampsia: magnesium sulfate, antihypertensives, OB at bedside for delivery planning"]},
      {label:"Phone Only",          col:T.blue,   items:["Threatened abortion with IUP on US, stable, hCG rising appropriately — OB clinic 48h","PID without TOA, hemodynamically stable, tolerating PO — antibiotics, outpatient follow","First trimester bleeding, IUP confirmed, closed cervix, stable — reassurance and OB follow","Hyperemesis with IUP confirmed, stable metabolically — antiemetics, fluids, OB follow"]},
      {label:"Come In Immediately", col:T.red,    items:["Ectopic pregnancy with hemodynamic instability or free fluid — this is hemorrhage","Eclampsia or severe preeclampsia: BP >160/110, seizure, altered mental status","Placental abruption: painful bleeding, rigid uterus, fetal distress","Postpartum hemorrhage — call OB and activate your massive transfusion protocol"]},
      {label:"Disposition Pattern", col:T.purple, items:["Ectopic OR → OB floor or ICU based on hemodynamic recovery","Ovarian torsion post-detorsion → OB/GYN floor","Eclampsia → L&D for delivery, ICU if severe end-organ involvement","PID inpatient → Floor, IV antibiotics, surgical co-consult if TOA"]},
    ],
    pearl:"Ultrasound with no IUP + positive hCG = ectopic until proven otherwise regardless of hCG level. Do not reassure based on low hCG — a ruptured ectopic can have an hCG of 300. If the patient has free fluid in Morrison's pouch on bedside ultrasound, call OB while walking to the patient.",
  },
  {
    id:"hemeonc", name:"Hematology / Oncology", icon:"🩸", color:T.purple, cat:"medical",
    hook:"ANC, treatment context, and whether this is a known malignancy or new presentation drive everything",
    sections:[
      {label:"Pre-Call Prep",       col:T.teal,   items:["ANC: absolute neutrophil count — febrile neutropenia threshold <500 or <1000 and falling","Current chemotherapy regimen: last cycle date, agents used","Tumor lysis labs if applicable: uric acid, potassium, phosphorus, calcium, LDH","Port/PICC status: accessed? Blood cultures drawn from line AND peripherally?"]},
      {label:"They Will Ask",       col:T.yellow, items:["ANC — this is their first question every time","Last chemotherapy cycle: what drugs, when was last infusion?","Blood cultures: drawn from central line and peripheral site before antibiotics?","Is this the patient's first presentation of malignancy or known history?"]},
      {label:"They Will Recommend", col:T.green,  items:["Febrile neutropenia: broad-spectrum coverage (cefepime or piperacillin-tazobactam) within 60 min","TLS: aggressive IV hydration, rasburicase if uric acid severely elevated, dialysis planning","SVCS: dexamethasone, elevation of HOB, urgent CT chest, oncology-directed intervention","Hyperviscosity (Waldenstrom's/myeloma): plasmapheresis emergently, avoid transfusion"]},
      {label:"Phone Only",          col:T.blue,   items:["Stable outpatient with known malignancy, no fever, ANC >1000 — scheduled clinic follow","Mild bone marrow suppression, no infection signs, ANC >500 — outpatient CBC recheck","Chemotherapy side effects without systemic toxicity — antiemetics, supportive care plan","Port access issue without fever or systemic infection — outpatient intervention"]},
      {label:"Come In Immediately", col:T.red,    items:["Febrile neutropenia: ANC <500 — antibiotics within 60 min is the standard","Spinal cord compression from metastasis: new motor deficit + back pain — MRI and dexamethasone now","Hyperleukocytosis (WBC >100k): leukapheresis emergently — call heme attending directly","Hypercalcemia of malignancy: AMS + Ca >14 — IV fluids, bisphosphonates, call concurrently"]},
      {label:"Disposition Pattern", col:T.purple, items:["Febrile neutropenia → Oncology floor or stepdown, isolation room","TLS → ICU for renal monitoring and dialysis access","Cord compression → Neurosurgery/radiation oncology co-consult, ICU or spine unit","Hypercalcemia severe → ICU or stepdown, cardiac monitoring"]},
    ],
    pearl:"Blood cultures before antibiotics for febrile neutropenia — but never let culture logistics delay antibiotics beyond 60 minutes. Draw from both the central line and a peripheral site. Heme/Onc will ask about both. If you give antibiotics first, document exactly why and the exact time.",
  },
  {
    id:"nephrology", name:"Nephrology", icon:"🫘", color:T.teal, cat:"medical",
    hook:"Have the BMP, urine output trend, baseline creatinine, and fluid balance ready before dialing",
    sections:[
      {label:"Pre-Call Prep",       col:T.teal,   items:["BMP: specifically creatinine, BUN, K+, bicarb, and phosphorus","Baseline creatinine — the delta from baseline defines acute vs chronic","Urine output trend and total I&O over last 8–24h","ESRD status: dialysis schedule, last dialysis session, modality (HD vs PD)"]},
      {label:"They Will Ask",       col:T.yellow, items:["What is the baseline creatinine? How does today's compare?","Last dialysis session: date, modality, adequacy of session, intradialytic symptoms?","Urine output: oliguric (<0.5mL/kg/h) or anuric?","EKG: what are the T-waves doing? Any signs of hyperkalemia?"]},
      {label:"They Will Recommend", col:T.green,  items:["Hyperkalemia K >6.5: calcium gluconate now, insulin/D50, kayexalate or patiromer, dialysis planning","Uremic emergency (pericarditis, encephalopathy): urgent dialysis — activate HD unit","Renal replacement therapy: CRRT vs intermittent HD based on hemodynamic stability","Nephrotoxin avoidance: hold NSAIDs, contrast, aminoglycosides, ACE/ARB in AKI"]},
      {label:"Phone Only",          col:T.blue,   items:["Stable AKI, creatinine <2× baseline, not oliguric, no hyperkalemia — fluids, monitor, follow tomorrow","ESRD patient mild fluid overload, hemodynamically stable — adjust next dialysis session","CKD with mild worsening, treatable cause identified — optimize underlying etiology","Asymptomatic hyponatremia, Na >120, chronic — no acute intervention needed tonight"]},
      {label:"Come In Immediately", col:T.red,    items:["K >6.5 with EKG changes — peaked T-waves or wide QRS requires immediate response","Uremic pericarditis with effusion or encephalopathy — emergent dialysis","Anuric AKI with fluid overload and respiratory compromise — dialysis tonight","Rapidly rising creatinine with suspected thrombotic microangiopathy — TTP/HUS work-up"]},
      {label:"Disposition Pattern", col:T.purple, items:["ESRD emergent dialysis → ICU or HD unit step-down","AKI requiring CRRT → ICU for continuous monitoring","Moderate AKI, conservative management → Floor with close monitoring","Electrolyte emergency resolved → Telemetry or stepdown depending on etiology"]},
    ],
    pearl:"Always know the baseline creatinine before calling. 'Creatinine of 3.2' sounds alarming until you know the baseline is 2.9 — that is a stable CKD patient. The delta from baseline is everything. If you cannot find a baseline, say so — they will use the current value as their reference.",
  },
  {
    id:"gi", name:"Gastroenterology", icon:"🟤", color:T.orange, cat:"medical",
    hook:"Hemodynamic stability and active bleeding signs determine if this is a phone call or a code",
    sections:[
      {label:"Pre-Call Prep",       col:T.teal,   items:["Hemoglobin trend: initial and most recent value with timing","Hemodynamic stability: HR, BP, any orthostatic changes","Endoscopy history: last scope, known varices, prior GI bleeding episodes","Current anticoagulation and antiplatelets: drug, dose, last taken"]},
      {label:"They Will Ask",       col:T.yellow, items:["What is the hemoglobin trend — dropping or stable?","Is the patient hemodynamically stable? Any signs of active hemorrhage?","Hematemesis vs melena vs hematochezia — helps localize source","On anticoagulation? Warfarin, DOAC? Last dose?"]},
      {label:"They Will Recommend", col:T.green,  items:["UGIB: PPI infusion (pantoprazole 80mg bolus → 8mg/h drip), blood type and cross, GI for urgent EGD","Variceal bleeding: octreotide infusion, prophylactic antibiotics (ceftriaxone), urgent EGD","LGIB hemodynamically stable: admit, colonoscopy prep, elective scope","Acute liver failure: transfer to transplant center early, NAC infusion, hepatology/transplant consult"]},
      {label:"Phone Only",          col:T.blue,   items:["UGIB hemodynamically stable, Hgb stable, dark melena without active hematemesis — PPI, scope next AM","LGIB bright red per rectum, small volume, stable — colonoscopy preparation, scope in AM","Elevated LFTs without fulminant failure signs — hepatitis workup, outpatient follow","Mild abdominal pain with elevated lipase <3× normal, no duct dilation — pancreatitis admission, conservative"]},
      {label:"Come In Immediately", col:T.red,    items:["UGIB with hemodynamic instability despite 2L resuscitation — emergent EGD with surgery on standby","Suspected variceal hemorrhage: hematemesis + cirrhosis + any hemodynamic compromise","Acute liver failure: INR >1.5 + encephalopathy — transplant evaluation begins now","Perforation on CT with peritoneal signs — this is now a surgical call, not GI"]},
      {label:"Disposition Pattern", col:T.purple, items:["UGIB unstable → ICU, urgent scope within 12–24h","UGIB stable → Stepdown or floor, scope next AM","Acute liver failure → ICU, transplant team notification","Pancreatitis severe (BISAP ≥2) → ICU or stepdown, nutrition team"]},
    ],
    pearl:"For UGIB, GI wants two large-bore peripheral IVs, blood type and cross for 2 units, and a PPI drip already running before they scope. Do not ask permission to start the PPI — start it while you call. For suspected varices: octreotide + antibiotics + scope, not just scope.",
  },
  {
    id:"pulm", name:"Pulmonology / Critical Care", icon:"🫁", color:T.blue, cat:"medical",
    hook:"Respiratory failure: P/F ratio, work of breathing, and what has already been tried are the three questions",
    sections:[
      {label:"Pre-Call Prep",       col:T.teal,   items:["ABG: pH, PaO2, PaCO2, P/F ratio — not just pulse ox","Work of breathing: accessory muscle use, respiratory rate, unable to complete sentences?","What has been tried: O2, nebulizers, CPAP/BiPAP, positioning?","CXR or CT chest findings available?"]},
      {label:"They Will Ask",       col:T.yellow, items:["ABG results — P/F ratio defines ARDS severity","Work of breathing on exam: how distressed does the patient appear?","BiPAP tried? Settings? Response to non-invasive ventilation?","Underlying diagnosis: COPD, CHF, PNA, ARDS, PE? — changes their approach completely"]},
      {label:"They Will Recommend", col:T.green,  items:["ARDS: lung-protective ventilation (6mL/kg IBW, PEEP titration, prone if P/F <150)","Status asthmaticus: heliox, ketamine, intubation if pre-arrest (avoid unless needed)","COPD exacerbation: BiPAP first — intubation dramatically worsens COPD prognosis","Massive PE with shock: systemic TPA or catheter-directed thrombolysis, call IR simultaneously"]},
      {label:"Phone Only",          col:T.blue,   items:["COPD exacerbation responding to bronchodilators and steroids — BiPAP and floor admission","Asthma moderate severity, sat improving — albuterol, steroids, disposition planning","Mild hypoxia, SpO2 92–94% on 2–4L, stable — floor admission with supplemental O2","Post-intubation vent management for straightforward PNA — routine ICU admission"]},
      {label:"Come In Immediately", col:T.red,    items:["Impending respiratory failure: RR >35, SpO2 <88% on high-flow O2, failing BiPAP","Tension pneumothorax or massive hemothorax — decompress first, call after","Massive hemoptysis: active bleeding with hemodynamic compromise — IR and thoracic surgery co-call","ARDS P/F <200 with deteriorating trajectory — intubation decision cannot wait"]},
      {label:"Disposition Pattern", col:T.purple, items:["Mechanical ventilation → ICU mandatory","BiPAP dependent → ICU or step-down with continuous monitoring","ARDS post-intubation → ICU, prone team notification if P/F <150","PE post-thrombolysis → ICU for bleeding monitoring and hemodynamic support"]},
    ],
    pearl:"Critical care is the one service that respects confidence. If you say 'I think this patient needs to be intubated,' they will respond to that. If you say 'I don't know, maybe we should wait,' expect to be talking to a deteriorating patient at 4am. Make your ask specific and decisive.",
  },
  {
    id:"id", name:"Infectious Disease", icon:"🦠", color:T.green, cat:"medical",
    hook:"ID consults want the whole story — mechanism, source, organism, resistance profile, and host immunity",
    sections:[
      {label:"Pre-Call Prep",       col:T.teal,   items:["Culture results: blood, urine, wound, CSF — organism and sensitivities if available","Current antibiotics: drug, dose, start date, and clinical response so far","Immune status: HIV with CD4, active chemotherapy, transplant/immunosuppressants","Source of infection: localize it before calling — unclear source is harder to consult on"]},
      {label:"They Will Ask",       col:T.yellow, items:["Cultures: what was drawn, when, and what's growing?","Current antibiotics: what is the patient already on and why?","Host immune status: immunocompromised? Specific deficits?","Prior resistance history: any prior MRSA, VRE, ESBL, or MDR organisms on file?"]},
      {label:"They Will Recommend", col:T.green,  items:["Endocarditis: TEE, prolonged IV antibiotics, cardiac surgery consult for valve destruction","Necrotizing fasciitis: emergent OR — no antibiotic alone will treat this","CNS infection: long-duration IV antibiotics, dexamethasone for bacterial meningitis","OPAT candidate: outpatient parenteral therapy planning, PICC placement, close follow-up"]},
      {label:"Phone Only",          col:T.blue,   items:["Simple CAP in otherwise healthy patient — standard empiric coverage, no ID needed","Uncomplicated UTI with known susceptibilities — targeted antibiotic, no consult required","Routine sepsis without complex resistance or unusual organism — start empiric, culture, reassess","HIV patient stable on ART, not opportunistic infection suspected — outpatient follow"]},
      {label:"Come In Immediately", col:T.red,    items:["Endocarditis with embolic phenomena, new heart block, or hemodynamic compromise","Necrotizing fasciitis on CT or by surgical exam — they will want to see before OR","CNS infection with altered mental status or new focal deficit — co-manage with neurology","Septic shock unresponsive to appropriate antibiotics — source control may be missing"]},
      {label:"Disposition Pattern", col:T.purple, items:["Endocarditis → Cardiology co-management, prolonged hospital stay, valve surgery evaluation","NF post-debridement → STICU, reconstructive surgery planning","Complex MDR organism → Contact precautions, ID-guided antibiotics, infectious disease rounds daily","OPAT → Discharge planning team, home health, outpatient clinic within 1 week"]},
    ],
    pearl:"ID consults want the full story — they are the specialists who respect a detailed history. Tell them organism, sensitivities, source, duration of illness, and host immune status before they ask. Never call ID with 'positive blood cultures, not sure what to use' — have your sensitivities and a proposed regimen ready for critique.",
  },
  {
    id:"psych", name:"Psychiatry", icon:"🧩", color:T.cyan, cat:"medical",
    hook:"Medical clearance is your job, not theirs — complete it before you call",
    sections:[
      {label:"Pre-Call Prep",       col:T.teal,   items:["Medical clearance completed: vitals, BMP, glucose, UDS, EtOH level, TSH if indicated","EKG if on QTc-prolonging agents or significant ingestion","Acute intoxication ruled out — psych will not evaluate an acutely intoxicated patient","Columbia Suicide Severity Rating Scale (C-SSRS) documented: ideation, intent, plan, means"]},
      {label:"They Will Ask",       col:T.yellow, items:["Medical clearance: has everything been ruled out that could be causing behavior organically?","Is the patient acutely intoxicated? They will not come down until sober","C-SSRS findings: what is the ideation level, any specific plan, access to means?","Current psychiatric medications and compliance — last outpatient psychiatric contact?"]},
      {label:"They Will Recommend", col:T.green,  items:["SI with plan and intent: involuntary hold (1799/5150/Baker Act per jurisdiction) + inpatient placement","Acute agitation: de-escalation first, then pharmacologic (olanzapine or droperidol IM, or haloperidol)","Psychosis first episode: medical workup to exclude organic cause, then inpatient psychiatry","Capacity evaluation: structured assessment documented, surrogate decision-maker identified"]},
      {label:"Phone Only",          col:T.blue,   items:["Passive SI without plan or intent in a patient with outpatient psychiatric follow — safety plan, outpatient","Anxiety disorder exacerbation, no safety concern, medically stable — crisis counseling, outpatient","Established psychiatric patient refusing voluntary admission, medically stable, no SI — social work","Medication refill issue without acute safety concern — outpatient psychiatry referral"]},
      {label:"Come In Immediately", col:T.red,    items:["Active suicidal ideation with specific plan and access to means — they must evaluate in person","Psychosis with inability to care for self, self-harm, or danger to others","Catatonia: medical emergency — may require IV lorazepam or ECT, call attending directly","Neuroleptic malignant syndrome: fever + rigidity + AMS after antipsychotic — this is medical, not psychiatric"]},
      {label:"Disposition Pattern", col:T.purple, items:["Inpatient psychiatric admission → Psych unit, voluntary or involuntary hold","Observation for intoxication clearing → Sober on re-evaluation, then psychiatric assessment","Capacity evaluation → Documented, ethics consult if complex, surrogate decision-maker engaged","Discharge with safety plan → Crisis line given, outpatient follow within 48–72h"]},
    ],
    pearl:"Psychiatry will push back on 'incomplete medical clearance' — have your BMP, glucose, UDS, and EtOH level documented before calling. You do not need to clear the patient with a CT head and LP for every psychiatric presentation. Know your scope: rule out acute organic cause, not exhaust every diagnostic possibility.",
  },
  {
    id:"ophtho", name:"Ophthalmology", icon:"👁️", color:T.teal, cat:"other",
    hook:"Time to visual loss is the most critical factor — get exact onset and rate of progression",
    sections:[
      {label:"Pre-Call Prep",       col:T.teal,   items:["Visual acuity in each eye: Snellen chart or counting fingers at minimum","IOP (intraocular pressure) if angle-closure glaucoma suspected","History of vision loss: sudden vs gradual, monocular vs binocular, painful vs painless","Eye exam: pupil response (RAPD), conjunctival injection, anterior chamber depth"]},
      {label:"They Will Ask",       col:T.yellow, items:["Visual acuity: what is it in each eye with correction?","Onset: sudden or gradual? Painless or painful?","Trauma: any mechanism of injury? Risk of open globe?","IOP: have you measured it? Any signs of acute angle closure (mid-dilated pupil, corneal edema, red eye)?"]},
      {label:"They Will Recommend", col:T.green,  items:["CRAO (central retinal artery occlusion): ocular massage, hyperbaric O2, stroke workup concurrently","Acute angle-closure glaucoma: topical timolol, pilocarpine, IV acetazolamide, mannitol if needed","Open globe: rigid eye shield (NO pressure), NPO, antiemetics, OR for repair","Orbital cellulitis: IV antibiotics, CT orbits, ophthalmology and ENT co-consult"]},
      {label:"Phone Only",          col:T.blue,   items:["Subconjunctival hemorrhage without trauma or visual change — reassurance, follow in clinic","Stye or chalazion without orbital involvement — warm compresses, ophthalmology clinic","Viral conjunctivitis without keratitis — topical treatment, outpatient follow","Mild corneal abrasion, intact globe — antibiotic drops, patch, ophthalmology follow 24h"]},
      {label:"Come In Immediately", col:T.red,    items:["CRAO: sudden painless monocular visual loss — 90-minute window for reperfusion (controversial but urgent)","Acute angle-closure glaucoma: painful red eye, mid-dilated pupil, IOP >50mmHg","Open globe injury: any suspected penetrating ocular trauma — shield, NPO, OR","Retrobulbar hematoma: proptosis + vision loss post-trauma — lateral canthotomy if orbit pressure rising"]},
      {label:"Disposition Pattern", col:T.purple, items:["Open globe → OR → Ophthalmology floor","Acute angle closure treated → Floor or discharge based on IOP response","CRAO → Stroke workup (TTE, telemetry, MRI), ophthalmology follow","Orbital cellulitis → Admission, IV antibiotics, ophthalmology and ENT co-manage"]},
    ],
    pearl:"For acute painless monocular vision loss, call ophthalmology and neurology simultaneously — CRAO and optic neuritis require different urgent evaluations. Never patch a red eye without examining the anterior chamber — you will miss angle-closure glaucoma, which is a surgical emergency.",
  },
  {
    id:"ent", name:"ENT / Otolaryngology", icon:"👂", color:T.yellow, cat:"other",
    hook:"Airway status always comes first — if it is threatened, lead with that, not the ENT complaint",
    sections:[
      {label:"Pre-Call Prep",       col:T.teal,   items:["Airway assessment: stridor? Drooling? Tripoding? Muffled voice? These change urgency entirely","Epistaxis: anterior vs posterior bleeding, duration, estimated blood loss, prior packing attempts","Peritonsillar abscess: unilateral swelling, uvular deviation, muffled voice — point tenderness to aspirate","CT neck with contrast if Ludwig's angina, epiglottitis, or deep space neck infection suspected"]},
      {label:"They Will Ask",       col:T.yellow, items:["Is the airway patent? Any stridor, drooling, inability to swallow secretions?","Epistaxis: any packing in place? Anterior or posterior source suspected?","Peritonsillar abscess: has aspiration been attempted? Unilateral vs bilateral swelling?","Neck CT findings: gas, abscess pocket, deep space involvement, mediastinal extension?"]},
      {label:"They Will Recommend", col:T.green,  items:["Epiglottitis: OR for airway with ENT, anesthesia, and surgical airway kit in room","Ludwig's angina: OR for airway + drainage, IV antibiotics, surgical airway bedside prep","Peritonsillar abscess: aspiration or I&D in ED — they will often guide or perform","Posterior epistaxis not controlled: posterior packing (Foley or epistaxis catheter) vs IR embolization"]},
      {label:"Phone Only",          col:T.blue,   items:["Anterior epistaxis controlled with direct pressure or anterior packing — outpatient follow","Otitis media or externa without complication or intracranial extension — antibiotics, ENT clinic","Simple peritonsillar cellulitis (no abscess on CT) — antibiotics, ENT outpatient follow","Minor traumatic ear/nose injury without functional deficit — ENT clinic follow-up"]},
      {label:"Come In Immediately", col:T.red,    items:["Epiglottitis with stridor or swallowing difficulty — call ENT, anesthesia, and prepare for surgical airway simultaneously","Angioedema with upper airway involvement — if worsening despite epinephrine, call ENT for surgical airway","Post-tonsillectomy hemorrhage with active bleeding — emergent OR for tonsillar bed hemorrhage control","Ludwig's angina: submandibular cellulitis + floor of mouth elevation + drooling = impending airway loss"]},
      {label:"Disposition Pattern", col:T.purple, items:["Airway emergency post-OR → ICU for airway monitoring","Peritonsillar abscess drained → Floor or discharge based on response, antibiotics, ENT follow 1 week","Posterior epistaxis packed → Admission for 24–48h observation, ENT follow","Deep neck infection post-drainage → STICU or floor, IV antibiotics, daily wound check"]},
    ],
    pearl:"The ENT call that goes wrong fastest is the one where you describe 'throat pain' and don't mention the drooling, stridor, or muffled voice. Lead with airway status on every ENT call. If the patient has any sign of airway compromise — stridor, inability to swallow secretions, tripod positioning — call ENT and anesthesia simultaneously and have your surgical airway kit at bedside.",
  },
];

const TABS = [
  {id:"specialties", label:"Specialty Guide", icon:"📋"},
  {id:"coach",       label:"AI Consult Coach", icon:"🤖"},
];

// ── Module-Scope Primitives ────────────────────────────────────────
function AmbientBg() {
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}>
      <div style={{position:"absolute",top:"-15%",left:"-10%",width:"55%",height:"55%",
        background:"radial-gradient(circle,rgba(155,109,255,0.08) 0%,transparent 70%)"}}/>
      <div style={{position:"absolute",bottom:"-10%",right:"-5%",width:"50%",height:"50%",
        background:"radial-gradient(circle,rgba(0,229,192,0.07) 0%,transparent 70%)"}}/>
      <div style={{position:"absolute",top:"40%",left:"30%",width:"35%",height:"35%",
        background:"radial-gradient(circle,rgba(255,107,107,0.05) 0%,transparent 70%)"}}/>
    </div>
  );
}

function BulletRow({ text, color }) {
  return (
    <div style={{display:"flex",gap:7,alignItems:"flex-start",marginBottom:4}}>
      <span style={{color:color||T.teal,fontSize:8,marginTop:2,flexShrink:0}}>▸</span>
      <span style={{fontFamily:"DM Sans",fontSize:11,color:T.txt2,lineHeight:1.5}}>{text}</span>
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

function SpecialtyCard({ sp, expanded, onToggle }) {
  return (
    <div style={{...glass,overflow:"hidden",cursor:"pointer",marginBottom:10,
      border:`1px solid ${expanded?sp.color+"55":"rgba(42,79,122,0.35)"}`,
      borderTop:`3px solid ${sp.color}`,transition:"border-color .15s"}}>
      <div onClick={onToggle}
        style={{padding:"13px 16px",display:"flex",alignItems:"center",gap:12,
          background:`linear-gradient(135deg,${sp.color}09,rgba(8,22,40,0.93))`}}>
        <span style={{fontSize:22,flexShrink:0}}>{sp.icon}</span>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:15,color:sp.color}}>
            {sp.name}
          </div>
          <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt4,marginTop:2}}>{sp.hook}</div>
        </div>
        <span style={{color:T.txt4,fontSize:12,flexShrink:0}}>{expanded?"▲":"▼"}</span>
      </div>
      {expanded && (
        <div className="fade-in" style={{borderTop:"1px solid rgba(42,79,122,0.28)",padding:"14px 16px"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:10}}>
            {sp.sections.map((sec,i) => (
              <div key={i} style={{padding:"9px 12px",background:`${sec.col}0a`,
                border:`1px solid ${sec.col}25`,borderRadius:9}}>
                <div style={{fontFamily:"JetBrains Mono",fontSize:9,fontWeight:700,color:sec.col,
                  letterSpacing:1.5,textTransform:"uppercase",marginBottom:7}}>{sec.label}</div>
                {sec.items.map((item,j) => <BulletRow key={j} text={item} color={sec.col}/>)}
              </div>
            ))}
          </div>
          <div style={{padding:"9px 12px",background:`${T.yellow}09`,
            border:`1px solid ${T.yellow}28`,borderRadius:8}}>
            <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.yellow,
              letterSpacing:1,textTransform:"uppercase"}}>💎 Pearl: </span>
            <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.65}}>{sp.pearl}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────
export default function ConsultHub() {
  const [tab, setTab]         = useState("specialties");
  const [cat, setCat]         = useState("all");
  const [search, setSearch]   = useState("");
  const [expanded, setExpanded] = useState(null);

  const [coachSp, setCoachSp]   = useState(SPECIALTIES[0].id);
  const [scenario, setScenario] = useState("");
  const [coaching, setCoaching] = useState(false);
  const [coachResult, setCoachResult] = useState(null);
  const [coachErr, setCoachErr]   = useState(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return SPECIALTIES.filter(sp =>
      (cat==="all" || sp.cat===cat) &&
      (!q || sp.name.toLowerCase().includes(q) || sp.hook.toLowerCase().includes(q))
    );
  }, [cat, search]);

  const toggle = useCallback((id) =>
    setExpanded(p => p===id ? null : id), []);

  const runCoach = useCallback(async () => {
    if (!scenario.trim()) return;
    setCoaching(true); setCoachErr(null); setCoachResult(null);
    const sp = SPECIALTIES.find(s=>s.id===coachSp);
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-6", max_tokens:1400,
          system:`You are a consult preparation coach for emergency medicine physicians. Generate a tailored, specific consultation preparation for calling the ${sp?.name} service. Respond ONLY in valid JSON (no markdown fences):
{
  "urgency": "Phone only | Urgent phone call | Bedside within 30 min | Immediate bedside — page attending",
  "opening": "Exact suggested 2-sentence opening for the phone call",
  "leadWith": ["most critical specific fact to state first", "second key fact", "third key fact"],
  "anticipatedQA": [
    {"q": "They will ask about X", "a": "Have ready / respond with: Y"}
  ],
  "ask": "How to frame your specific clinical request — the actual ask sentence",
  "pushback": [
    {"concern": "Likely pushback or objection", "response": "Professional, effective response"}
  ],
  "insider": "One insider cultural tip specific to this specialty and this clinical scenario"
}`,
          messages:[{role:"user", content:`Specialty: ${sp?.name}\n\nClinical scenario: ${scenario}`}]
        })
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error.message);
      const raw = data.content?.find(b=>b.type==="text")?.text||"{}";
      setCoachResult(JSON.parse(raw.replace(/```json|```/g,"").trim()));
    } catch(e) {
      setCoachErr("Error: " + (e.message||"Check API connectivity"));
    } finally { setCoaching(false); }
  }, [scenario, coachSp]);

  const urgColor = u =>
    u?.includes("Immediate")?T.red:u?.includes("30 min")?T.orange:u?.includes("Urgent")?T.yellow:T.blue;

  return (
    <div style={{fontFamily:"DM Sans, sans-serif",background:T.bg,minHeight:"100vh",
      position:"relative",overflow:"hidden",color:T.txt}}>
      <AmbientBg/>
      <div style={{position:"relative",zIndex:1,maxWidth:1200,margin:"0 auto",padding:"0 16px"}}>

        {/* Header */}
        <div style={{padding:"18px 0 14px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <div style={{backdropFilter:"blur(40px)",WebkitBackdropFilter:"blur(40px)",
              background:"rgba(5,15,30,0.9)",border:"1px solid rgba(42,79,122,0.6)",
              borderRadius:10,padding:"5px 12px",display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.purple,letterSpacing:3}}>NOTRYA</span>
              <span style={{color:T.txt4,fontFamily:"JetBrains Mono",fontSize:10}}>/</span>
              <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.txt3,letterSpacing:2}}>CONSULT</span>
            </div>
            <div style={{height:1,flex:1,background:"linear-gradient(90deg,rgba(155,109,255,0.5),transparent)"}}/>
          </div>
          <h1 className="shimmer-text"
            style={{fontFamily:"Playfair Display",fontSize:"clamp(24px,4vw,40px)",fontWeight:900,letterSpacing:-1,lineHeight:1.1}}>
            ConsultHub
          </h1>
          <p style={{fontFamily:"DM Sans",fontSize:12,color:T.txt3,marginTop:4}}>
            16 Specialties · Pre-Call Prep · Escalation Criteria · Disposition Patterns · AI Consult Coach
          </p>
        </div>

        {/* Stat banner */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:16}}>
          {[
            {label:"Specialties",        value:"16",     sub:"Cardiac to ENT",          color:T.purple},
            {label:"Pre-Call Checklists",value:"16",     sub:"Know before you dial",     color:T.teal  },
            {label:"Escalation Criteria",value:"80+",    sub:"When phone becomes bedside",color:T.red   },
            {label:"Disposition Paths",  value:"4–6/sp", sub:"Per specialty",            color:T.orange},
            {label:"Clinical Pearls",    value:"16",     sub:"Tacit knowledge captured",  color:T.yellow},
            {label:"AI Consult Coach",   value:"Live",   sub:"Case-specific prep",        color:T.green },
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
        <div style={{...glass,padding:"6px",display:"flex",gap:5,marginBottom:16}}>
          {TABS.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{flex:"1 1 auto",fontFamily:"DM Sans",fontWeight:600,fontSize:12,padding:"9px 8px",
                borderRadius:10,
                border:`1px solid ${tab===t.id?"rgba(155,109,255,0.5)":"transparent"}`,
                background:tab===t.id?"linear-gradient(135deg,rgba(155,109,255,0.18),rgba(155,109,255,0.07))":"transparent",
                color:tab===t.id?T.purple:T.txt3,
                cursor:"pointer",textAlign:"center",transition:"all .15s"}}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ═══ SPECIALTIES TAB ═══ */}
        {tab==="specialties" && (
          <div className="fade-in">
            {/* Category filter + search */}
            <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",flex:1}}>
                {CATS.map(c => (
                  <button key={c.id} onClick={()=>setCat(c.id)}
                    style={{fontFamily:"JetBrains Mono",fontSize:9,fontWeight:700,padding:"4px 12px",
                      borderRadius:20,cursor:"pointer",textTransform:"uppercase",letterSpacing:1,
                      border:`1px solid ${cat===c.id?c.color+"88":c.color+"33"}`,
                      background:cat===c.id?`${c.color}20`:`${c.color}08`,
                      color:cat===c.id?c.color:T.txt3,transition:"all .15s"}}>
                    {c.label}
                  </button>
                ))}
              </div>
              <input type="text" value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Search specialties..."
                style={{background:"rgba(14,37,68,0.8)",border:`1px solid ${search?"rgba(155,109,255,0.5)":"rgba(42,79,122,0.35)"}`,
                  borderRadius:20,padding:"5px 14px",outline:"none",
                  fontFamily:"DM Sans",fontSize:12,color:T.txt,width:180,
                  transition:"border-color .1s"}}/>
            </div>
            {/* Count */}
            <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,
              letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>
              {filtered.length} specialt{filtered.length===1?"y":"ies"} — tap to expand pre-call guide
            </div>
            {/* Specialty cards */}
            {filtered.map(sp => (
              <SpecialtyCard key={sp.id} sp={sp}
                expanded={expanded===sp.id}
                onToggle={()=>toggle(sp.id)}/>
            ))}
            {filtered.length===0 && (
              <div style={{...glass,padding:"32px",textAlign:"center"}}>
                <div style={{fontSize:28,marginBottom:8}}>🔍</div>
                <div style={{fontFamily:"DM Sans",fontSize:13,color:T.txt3}}>
                  No specialties match &ldquo;{search}&rdquo;
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ AI CONSULT COACH TAB ═══ */}
        {tab==="coach" && (
          <div className="fade-in">
            <div style={{padding:"10px 14px",background:"rgba(155,109,255,0.07)",
              border:"1px solid rgba(155,109,255,0.2)",borderRadius:10,marginBottom:14,
              fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.7}}>
              🤖 <strong style={{color:T.purple}}>AI Consult Coach:</strong> Describe your specific patient
              scenario. AI will generate a tailored pre-call script, the exact questions they will ask,
              how to frame your ask, and how to handle pushback — specific to your case.
            </div>

            {/* Specialty selector + scenario */}
            <div style={{...glass,padding:"14px 16px",marginBottom:12}}>
              <div style={{marginBottom:12}}>
                <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,
                  letterSpacing:1.5,textTransform:"uppercase",marginBottom:6}}>Specialty Service</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {SPECIALTIES.map(sp => (
                    <button key={sp.id} onClick={()=>setCoachSp(sp.id)}
                      style={{fontFamily:"DM Sans",fontSize:11,fontWeight:600,
                        padding:"4px 12px",borderRadius:20,cursor:"pointer",transition:"all .12s",
                        border:`1px solid ${coachSp===sp.id?sp.color+"88":sp.color+"30"}`,
                        background:coachSp===sp.id?`${sp.color}20`:`${sp.color}06`,
                        color:coachSp===sp.id?sp.color:T.txt4}}>
                      {sp.icon} {sp.name}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{marginBottom:10}}>
                <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,
                  letterSpacing:1.5,textTransform:"uppercase",marginBottom:6}}>Clinical Scenario</div>
                <textarea value={scenario} onChange={e=>setScenario(e.target.value)}
                  placeholder={"Describe your case — the more detail you give, the more targeted the prep.\n\nExample: '58yo male with sudden onset chest pain, 10/10, diaphoresis. EKG shows 2mm STE V1-V4 with reciprocal inferior changes. Troponin 0.02, repeat in 2h. BP 88/54, HR 118, on aspirin at home. No known cardiac history. No anticoagulation.'"}
                  rows={5}
                  style={{width:"100%",background:"rgba(14,37,68,0.7)",
                    border:`1px solid ${scenario?"rgba(155,109,255,0.45)":"rgba(42,79,122,0.3)"}`,
                    borderRadius:8,padding:"10px 12px",outline:"none",resize:"vertical",
                    fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.65}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontFamily:"DM Sans",fontSize:11,color:T.txt4}}>
                  Calling: <strong style={{color:SPECIALTIES.find(s=>s.id===coachSp)?.color}}>
                    {SPECIALTIES.find(s=>s.id===coachSp)?.name}
                  </strong>
                </span>
                <button onClick={runCoach} disabled={coaching||!scenario.trim()}
                  style={{fontFamily:"DM Sans",fontWeight:700,fontSize:12,padding:"8px 22px",
                    borderRadius:10,cursor:coaching||!scenario.trim()?"not-allowed":"pointer",
                    border:`1px solid ${!scenario.trim()?"rgba(42,79,122,0.3)":"rgba(155,109,255,0.5)"}`,
                    background:!scenario.trim()?"rgba(42,79,122,0.15)":"linear-gradient(135deg,rgba(155,109,255,0.22),rgba(155,109,255,0.08))",
                    color:!scenario.trim()?T.txt4:T.purple,transition:"all .15s"}}>
                  {coaching ? <><span className="con-spin">⚙</span> Coaching...</> : "🤖 Prep My Consult"}
                </button>
              </div>
            </div>

            {/* Error */}
            {coachErr && (
              <div style={{padding:"10px 14px",background:"rgba(255,68,68,0.1)",
                border:"1px solid rgba(255,68,68,0.3)",borderRadius:10,marginBottom:12,
                fontFamily:"DM Sans",fontSize:12,color:T.coral}}>{coachErr}</div>
            )}

            {/* Loading */}
            {coaching && (
              <div style={{...glass,padding:"32px",textAlign:"center"}}>
                <span className="con-spin" style={{fontSize:32,display:"block",marginBottom:10}}>⚙</span>
                <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2}}>
                  Preparing your {SPECIALTIES.find(s=>s.id===coachSp)?.name} consult script...
                </div>
              </div>
            )}

            {/* Coach results */}
            {coachResult && !coaching && (
              <div className="fade-in">
                {/* Urgency */}
                {coachResult.urgency && (
                  <div style={{...glass,padding:"10px 14px",marginBottom:10,
                    border:`1px solid ${urgColor(coachResult.urgency)}44`,
                    background:`linear-gradient(135deg,${urgColor(coachResult.urgency)}09,rgba(8,22,40,0.93))`}}>
                    <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,
                      letterSpacing:1.5,textTransform:"uppercase"}}>Recommended Urgency: </span>
                    <span style={{fontFamily:"JetBrains Mono",fontSize:12,fontWeight:700,
                      color:urgColor(coachResult.urgency)}}>{coachResult.urgency}</span>
                  </div>
                )}
                {/* Opening */}
                {coachResult.opening && (
                  <div style={{...glass,padding:"13px 15px",marginBottom:10,
                    border:"1px solid rgba(155,109,255,0.3)",
                    background:"linear-gradient(135deg,rgba(155,109,255,0.07),rgba(8,22,40,0.93))"}}>
                    <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.purple,
                      letterSpacing:2,textTransform:"uppercase",marginBottom:7}}>📞 Opening Statement</div>
                    <div style={{fontFamily:"DM Sans",fontSize:13,color:T.txt,lineHeight:1.75,
                      fontStyle:"italic"}}>
                      &ldquo;{coachResult.opening}&rdquo;
                    </div>
                  </div>
                )}
                {/* Lead with */}
                {coachResult.leadWith?.length > 0 && (
                  <div style={{...glass,padding:"12px 14px",marginBottom:10,
                    border:"1px solid rgba(0,229,192,0.25)"}}>
                    <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.teal,
                      letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Lead With — In This Order</div>
                    {coachResult.leadWith.map((f,i) => (
                      <div key={i} style={{display:"flex",gap:9,alignItems:"flex-start",marginBottom:5}}>
                        <span style={{fontFamily:"JetBrains Mono",fontSize:10,fontWeight:700,
                          color:T.teal,flexShrink:0,minWidth:16}}>{i+1}.</span>
                        <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.5}}>{f}</span>
                      </div>
                    ))}
                  </div>
                )}
                {/* Anticipated Q&A */}
                {coachResult.anticipatedQA?.length > 0 && (
                  <div style={{...glass,padding:"12px 14px",marginBottom:10}}>
                    <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.yellow,
                      letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>Anticipated Questions + Prepared Answers</div>
                    {coachResult.anticipatedQA.map((qa,i) => (
                      <div key={i} style={{marginBottom:10,padding:"8px 11px",
                        background:"rgba(42,79,122,0.1)",borderRadius:8}}>
                        <div style={{fontFamily:"DM Sans",fontSize:12,fontWeight:700,
                          color:T.yellow,marginBottom:4}}>{qa.q}</div>
                        <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.5}}>
                          <span style={{color:T.txt4,fontWeight:700}}>→ </span>{qa.a}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* The Ask + Pushback */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                  {coachResult.ask && (
                    <div style={{...glass,padding:"12px 14px",
                      border:"1px solid rgba(61,255,160,0.25)"}}>
                      <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.green,
                        letterSpacing:2,textTransform:"uppercase",marginBottom:7}}>How to Frame the Ask</div>
                      <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt,
                        lineHeight:1.65,fontStyle:"italic"}}>
                        &ldquo;{coachResult.ask}&rdquo;
                      </div>
                    </div>
                  )}
                  {coachResult.pushback?.length > 0 && (
                    <div style={{...glass,padding:"12px 14px",
                      border:"1px solid rgba(255,107,107,0.25)"}}>
                      <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.coral,
                        letterSpacing:2,textTransform:"uppercase",marginBottom:7}}>Handling Pushback</div>
                      {coachResult.pushback.map((pb,i) => (
                        <div key={i} style={{marginBottom:i<coachResult.pushback.length-1?8:0}}>
                          <div style={{fontFamily:"DM Sans",fontSize:11,fontWeight:700,
                            color:T.coral,marginBottom:2}}>{pb.concern}</div>
                          <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt2,
                            lineHeight:1.5}}>→ {pb.response}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* Insider tip */}
                {coachResult.insider && (
                  <div style={{padding:"9px 13px",background:`${T.yellow}09`,
                    border:`1px solid ${T.yellow}28`,borderRadius:10,marginBottom:14}}>
                    <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.yellow,
                      letterSpacing:1,textTransform:"uppercase"}}>💎 Insider Tip: </span>
                    <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2}}>{coachResult.insider}</span>
                  </div>
                )}
                {/* Re-prep */}
                <div style={{textAlign:"center",marginBottom:16}}>
                  <button onClick={runCoach}
                    style={{fontFamily:"DM Sans",fontWeight:600,fontSize:12,padding:"7px 20px",
                      borderRadius:10,cursor:"pointer",border:"1px solid rgba(42,79,122,0.4)",
                      background:"transparent",color:T.txt3}}>
                    ↺ Update Scenario and Re-prep
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{textAlign:"center",paddingBottom:24,paddingTop:14}}>
          <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,letterSpacing:1.5}}>
            NOTRYA CONSULTHUB · TACIT CLINICAL KNOWLEDGE · AI COACH FOR EDUCATIONAL SUPPORT · VERIFY WITH ATTENDING AND LOCAL PROTOCOLS
          </span>
        </div>
      </div>
    </div>
  );
}