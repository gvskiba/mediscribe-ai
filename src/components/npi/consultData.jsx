// consultData.js — Shared consult specialty data
// Used by: ConsultHub (standalone page) + ConsultPrepPanel (NPI embedded)
// ─────────────────────────────────────────────────────────────────────────────

export const CONSULT_SPECIALTIES = [
  {
    id:"cardiology", name:"Cardiology", icon:"❤️", color:"#ff4444", cat:"cardiac",
    hook:"Lead with EKG and troponin trend — read the strip yourself before dialing",
    sections:[
      {label:"Pre-Call Prep",       col:"#00e5c0", items:["12-lead EKG with timestamp in hand","Troponin: value, draw time, and 2h delta","Vital signs trend — not just current values","Current anticoagulants and antiplatelets; IV access location"]},
      {label:"They Will Ask",       col:"#f5c842", items:["Read me the EKG — they will quiz you on it","Troponin: initial value, second value, direction","Hemodynamic status: MAP, any signs of shock","Prior cardiac history, known EF, prior cath or stents"]},
      {label:"They Will Recommend", col:"#3dffa0", items:["STEMI: heparin + DAPT, activate cath lab now","UA/NSTEMI: anticoagulate, risk stratify (TIMI/HEART), admit telemetry","CHF exacerbation: diuresis, BNP, echo, afterload reduction","Arrhythmia: rate vs rhythm control; EP if refractory or unstable"]},
      {label:"Phone Only",          col:"#3b9eff", items:["Stable known AFib, HR ≤110, no hemodynamic compromise","Borderline troponin with clear non-cardiac explanation and stable vitals","Isolated PVCs, asymptomatic, no structural disease by history","Chronic CHF minor decompensation, no O2 requirement change"]},
      {label:"Come In Immediately", col:"#ff6b6b", items:["STEMI or equivalent — call attending directly, page cath lab simultaneously","Cardiogenic shock: cool extremities, MAP <65, rising lactate","New high-degree AV block in the setting of anterior MI","New murmur + hemodynamic instability — acute valvular emergency"]},
      {label:"Disposition Pattern", col:"#9b6dff", items:["STEMI → Cath Lab → CCU","NSTEMI/UA stable → Telemetry (cath next AM or urgent)","CHF → Floor (O2 <3L) or Stepdown (≥3L or BiPAP)","Rule-out ACS → Observation with serial troponins × 3h or 6h protocol"]},
    ],
    pearl:"Call the attending directly for STEMI and cardiogenic shock — never route through the fellow first. Always have a working alternative diagnosis if calling about a borderline troponin.",
  },
  {
    id:"ctvs", name:"CT / Vascular Surgery", icon:"🔪", color:"#ff6b6b", cat:"cardiac",
    hook:"Answer the only question they have: does this need the OR tonight?",
    sections:[
      {label:"Pre-Call Prep",       col:"#00e5c0", items:["CTA findings available — aortic diameter, dissection type, rupture signs","Hemodynamic status and trend — is the patient compensating?","Anticoagulation status and timing of last dose","Type and screen, massive transfusion protocol status, blood bank notified?"]},
      {label:"They Will Ask",       col:"#f5c842", items:["CTA results — specifically aortic involvement, distal perfusion","Is the patient hemodynamically stable or deteriorating?","Any anticoagulation on board, especially TPA given?","OR availability notified? Anesthesia aware?"]},
      {label:"They Will Recommend", col:"#3dffa0", items:["Type A dissection: emergent OR — call OR and anesthesia simultaneously","Type B stable: ICU admission, IV beta-blockade (labetalol/esmolol), SBP 100–120","Ruptured AAA: emergent OR/EVAR, activate MTP, push blood products","Acute limb ischemia: emergent embolectomy or catheter-directed thrombolysis"]},
      {label:"Phone Only",          col:"#3b9eff", items:["Stable Type B dissection, BP controlled, no malperfusion signs","Incidental AAA <5.5cm, hemodynamically stable, non-urgent referral","Claudication without rest pain, ulceration, or limb threat","Superficial wound with vascular concern — photos and next-day clinic"]},
      {label:"Come In Immediately", col:"#ff6b6b", items:["Ruptured or symptomatic AAA — page OR team and anesthesia in the same call","Type A aortic dissection — simultaneous cardiac surgery and OR notification","Acute limb ischemia: 6Ps present (pulseless, pale, pain, paresthesia, paralysis, poikilothermia)","Mesenteric ischemia with peritonitis or clinical deterioration"]},
      {label:"Disposition Pattern", col:"#9b6dff", items:["Emergent OR → STICU post-operatively","Type B stable dissection → ICU, SBP goal 100–120, heart rate control","Acute limb ischemia post-revascularization → STICU for reperfusion monitoring","Surveillance AAA → Discharge with urgent vascular clinic"]},
    ],
    pearl:"Answer their first question before they ask it: 'This is/is not a surgical emergency tonight.' For dissections, lead with type, BP, and end-organ involvement.",
  },
  {
    id:"neurology", name:"Neurology", icon:"🧠", color:"#9b6dff", cat:"neuro",
    hook:"Give NIH stroke scale, last-known-well time, and code status in the first 30 seconds",
    sections:[
      {label:"Pre-Call Prep",       col:"#00e5c0", items:["NIHSS score — perform and document before calling","Last known well time — exact, not approximate","CT head result and CT perfusion/CTA if completed","Current anticoagulation: drug, last dose, reversal given?"]},
      {label:"They Will Ask",       col:"#f5c842", items:["NIHSS — they expect you to have done it","Last known well — this determines lytic and thrombectomy eligibility","What does the CT show? Any hemorrhage or early ischemic change?","Current anticoagulation and platelet therapy — exclusion criteria for TPA"]},
      {label:"They Will Recommend", col:"#3dffa0", items:["Ischemic stroke in window: TPA protocol or thrombectomy evaluation (LVO on CTA)","Seizure: benzodiazepines, then levetiracetam or valproate if breakthrough","Meningitis: empiric antibiotics — do not wait for LP if antibiotics already delayed","Elevated ICP: HOB 30°, osmolar therapy, neurosurgery co-consult if herniating"]},
      {label:"Phone Only",          col:"#3b9eff", items:["Resolved TIA, patient neurologically intact, ABCD2 score calculated","Established epilepsy patient at baseline, follow-up with outpatient neurology","Headache with reassuring features, normal exam, negative CT","Vertigo without focal deficits — HINTS exam negative for central cause"]},
      {label:"Come In Immediately", col:"#ff6b6b", items:["LVO on CTA — thrombectomy window open, they want to assess immediately","Stroke with deterioration — expanding infarct, malignant MCA syndrome","Status epilepticus refractory to two benzodiazepines","Bacterial meningitis with AMS, fever, stiff neck — call ID simultaneously"]},
      {label:"Disposition Pattern", col:"#9b6dff", items:["Ischemic stroke: Stroke Unit or ICU depending on severity and intervention","LVO post-thrombectomy → Neuro-ICU","Seizure workup → Epilepsy monitoring unit or neurology floor","Meningitis → ICU if altered, floor if intact with rapid improvement"]},
    ],
    pearl:"Neurology calls live and die by last-known-well time and NIHSS. Do both before you call. If you cannot determine last known well, default to 'unknown onset' — this changes their entire algorithm.",
  },
  {
    id:"neurosurgery", name:"Neurosurgery", icon:"🔬", color:"#f472b6", cat:"neuro",
    hook:"They want: type of bleed, volume, midline shift, and GCS trend — in that order",
    sections:[
      {label:"Pre-Call Prep",       col:"#00e5c0", items:["CT head result with specific findings: bleed type, volume estimate, shift","GCS on arrival and current GCS — trend is critical","Pupil exam: size, reactivity, symmetry","Anticoagulation status: drug, last dose, reversal agent given and time"]},
      {label:"They Will Ask",       col:"#f5c842", items:["What does the CT show exactly — EDH, SDH, IPH, SAH?","What is the GCS now vs on arrival? Improving or deteriorating?","Are pupils equal and reactive? Any blown pupil?","Anticoagulation reversed? INR if on warfarin, platelet count?"]},
      {label:"They Will Recommend", col:"#3dffa0", items:["EDH with compression: emergent OR — direct transfer to OR holding","Large SDH with shift >5mm: OR vs ICP monitor based on GCS","SAH with aneurysm on CTA: endovascular vs surgical clipping, nimodipine","Spinal cord compression: dexamethasone 10mg IV, MRI stat, OR decision"]},
      {label:"Phone Only",          col:"#3b9eff", items:["Small SDH <1cm, no shift, GCS 15, no anticoagulation — admit neuro obs","Traumatic SAH without aneurysm on CTA — admit, repeat CT in 6h","Stable VP shunt patient, shunt series done, no obvious malfunction signs","Small contusion, GCS intact, no anticoagulation — observe and repeat CT"]},
      {label:"Come In Immediately", col:"#ff6b6b", items:["EDH with mass effect or pupillary change — call OR simultaneously","GCS deterioration with any intracranial hemorrhage — herniation imminent","Blown pupil: transtentorial herniation — mannitol now, call OR","Cauda equina syndrome: new urinary retention + saddle anesthesia + weakness"]},
      {label:"Disposition Pattern", col:"#9b6dff", items:["Craniotomy/craniectomy → Neuro-ICU","SDH managed conservatively → ICU or Neuro step-down","Spinal cord compression → OR or Neuro-ICU post-decompression","SAH graded Hunt-Hess I-II → Neuro-ICU with aneurysm treatment"]},
    ],
    pearl:"Reverse anticoagulation BEFORE calling — they will ask if it's done, and 'I'm waiting on your call to decide' is the wrong answer. For SAH, give nimodipine 60mg q4h before the call.",
  },
  {
    id:"gensurg", name:"General Surgery", icon:"⚕️", color:"#ff9f43", cat:"surgical",
    hook:"Frame around: peritoneal signs, surgical abdomen or not, and operative urgency",
    sections:[
      {label:"Pre-Call Prep",       col:"#00e5c0", items:["CT abdomen/pelvis results — read the radiology report yourself","Abdominal exam findings: rigidity, guarding, rebound, bowel sounds","Vital sign trend — HR/BP reflecting clinical trajectory","NPO status and time of last oral intake"]},
      {label:"They Will Ask",       col:"#f5c842", items:["Does the patient have peritoneal signs on exam — guarding, rigidity, rebound?","What does CT show — free air, obstruction, perforation, ischemia?","Is the patient hemodynamically stable or deteriorating?","Last oral intake — timing for OR planning"]},
      {label:"They Will Recommend", col:"#3dffa0", items:["Free air from perforation: emergent OR, broad-spectrum antibiotics now","Appendicitis: NPO, IV antibiotics, OR vs interventional drainage based on CT","SBO with ischemia signs: emergent OR; SBO without ischemia: admit, NGT decompression","Cholecystitis: NPO, IV antibiotics, laparoscopic chole (timing by severity)"]},
      {label:"Phone Only",          col:"#3b9eff", items:["Uncomplicated appendicitis, afebrile, WBC <13 — IV antibiotics, admit, OR in AM","Simple cholecystitis, stable vitals, no CBD dilation — antibiotics, elective chole","SBO at partial, no ischemia signs, decompressing — NGT, admit, conservative","Anal/rectal complaint without abscess, systemic signs, or ischemia"]},
      {label:"Come In Immediately", col:"#ff6b6b", items:["Free air on CT — perforation until proven otherwise, emergent OR","GI hemorrhage with hemodynamic instability despite resuscitation","Suspected mesenteric ischemia: lactate elevated, peritoneal signs, atrial fibrillation","Incarcerated hernia with bowel in sac, obstruction signs — OR for reduction"]},
      {label:"Disposition Pattern", col:"#9b6dff", items:["Emergent OR → STICU or surgical floor based on procedure","Appendicitis conservative → Surgical floor, OR next AM","SBO managed conservatively → Surgical floor, NG decompression","Abscess with IR drainage → Floor with serial exams"]},
    ],
    pearl:"General surgery has one question: 'Does this belly need the OR tonight?' Give them CT findings and exam findings — specifically presence or absence of peritoneal signs.",
  },
  {
    id:"ortho", name:"Orthopedic Surgery", icon:"🦴", color:"#f5c842", cat:"surgical",
    hook:"Open fractures, compartment syndrome, septic joints, and spine with deficits — those are the calls that matter",
    sections:[
      {label:"Pre-Call Prep",       col:"#00e5c0", items:["X-rays reviewed — fracture type, displacement, articular involvement","Neurovascular exam distal to injury: pulses, cap refill, sensation, motor","Open fracture: wound size, contamination, time since injury","Compartment pressures if suspected (delta pressure <30mmHg)"]},
      {label:"They Will Ask",       col:"#f5c842", items:["Is there an open wound communicating with the fracture?","Neurovascular status distal to the fracture — pulses intact?","What does the X-ray show — fracture pattern, displacement, joint involvement?","Compartment firmness: hard, tense, pain with passive stretch?"]},
      {label:"They Will Recommend", col:"#3dffa0", items:["Open fracture: OR within 6–8h, IV cefazolin now, tetanus, saline-soaked dressing","Compartment syndrome: emergent fasciotomy — start OR notification call","Septic joint: aspiration stat (before antibiotics if possible), OR for washout","Spinal cord compression: dexamethasone, MRI, OR decision with neurosurgery"]},
      {label:"Phone Only",          col:"#3b9eff", items:["Closed non-displaced fracture, intact neurovasculature — splint, RICE, ortho clinic 1 week","Simple ankle fracture, Ottawa negative, or minor injury","Dislocated shoulder reduced in ED, post-reduction film normal — sling, outpatient","Stable compression fracture without cord involvement or significant kyphosis"]},
      {label:"Come In Immediately", col:"#ff6b6b", items:["Open fracture — antibiotic clock is ticking, OR prep should start now","Compartment syndrome — fasciotomy cannot wait, pressure >30mmHg delta is surgical","Vascular injury with fracture — ortho and vascular surgery co-call simultaneously","Cauda equina: new urinary retention + saddle numbness + motor deficit = OR tonight"]},
      {label:"Disposition Pattern", col:"#9b6dff", items:["Open fracture → OR → Orthopedic floor","Compartment syndrome fasciotomy → STICU for wound care and monitoring","Septic joint washout → Orthopedic floor, IV antibiotics, ID co-consult","Spinal fracture with instability → Spine unit or STICU depending on cord"]},
    ],
    pearl:"Ortho is territorial about X-ray interpretation — do not guess the fracture type on the phone. Say 'fracture through the mid-shaft of the femur with significant comminution' not 'bad leg break.'",
  },
  {
    id:"urology", name:"Urology", icon:"🫘", color:"#3b9eff", cat:"surgical",
    hook:"Testicular torsion is a 4–6 hour window. Lead with that if it's on your differential",
    sections:[
      {label:"Pre-Call Prep",       col:"#00e5c0", items:["Testicular torsion: ultrasound with Doppler if done — but DO NOT delay call for imaging","Urosepsis: culture results if back, lactate, hemodynamic status","Stone: CT urography showing stone size, location, and degree of obstruction","Urinary retention: post-void residual, history of BPH or neurogenic bladder"]},
      {label:"They Will Ask",       col:"#f5c842", items:["Testicular torsion: duration of symptoms, ultrasound results, high-ride testicle on exam?","Urosepsis: has the urine been sent? Blood cultures drawn? Lactate?","Stone: size and location on CT — proximal ureter vs distal, hydronephrosis?","Priapism: duration, ischemic vs non-ischemic, prior episodes, medications?"]},
      {label:"They Will Recommend", col:"#3dffa0", items:["Testicular torsion: emergent OR for bilateral orchiopexy — do not delay for imaging","Urosepsis with obstruction: urgent PCN or ureteral stent","Stone with infection: urgent drainage, sepsis management, analgesia, alpha-blocker","Priapism ischemic: aspiration + irrigation in ED, OR if refractory >4h"]},
      {label:"Phone Only",          col:"#3b9eff", items:["Uncomplicated urolithiasis, afebrile, stone ≤7mm — pain management, tamsulosin, follow","Urinary retention, successful Foley placed, no infection signs — outpatient urology","UTI without sepsis or obstruction — antibiotics, outpatient follow","Microscopic hematuria without clot retention or obstruction — outpatient workup"]},
      {label:"Come In Immediately", col:"#ff6b6b", items:["Testicular torsion — every minute of delay = testicle loss; call while prepping OR","Urosepsis with obstructed system — drainage is source control, cannot wait","Priapism ischemic >4h — ischemia is occurring, compartment syndrome of the penis","Fournier's gangrene: necrotizing perineal infection, OR for debridement now"]},
      {label:"Disposition Pattern", col:"#9b6dff", items:["Torsion OR → Urology floor, ultrasound in 24h","Obstructed urosepsis post-drainage → ICU or stepdown depending on hemodynamics","Stone with intervention → Urology floor, repeat imaging before discharge","Priapism resolved → Floor vs discharge based on response"]},
    ],
    pearl:"Testicular torsion: if ultrasound is not immediately available and clinical suspicion is high, call urology for immediate OR — a negative exploration is infinitely better than a missed torsion.",
  },
  {
    id:"obgyn", name:"OB / GYN", icon:"🌸", color:"#f472b6", cat:"surgical",
    hook:"Quantitative beta-hCG, hemodynamic stability, and ultrasound are the three things that drive every decision",
    sections:[
      {label:"Pre-Call Prep",       col:"#00e5c0", items:["Quantitative beta-hCG value and trend if serial levels available","Transvaginal ultrasound: IUP present? Free fluid? Adnexal mass?","Hemodynamic status — ectopic rupture presents with hemorrhagic shock","Gestational age if known, LMP, contraception method, prior ectopics"]},
      {label:"They Will Ask",       col:"#f5c842", items:["Beta-hCG level — and is there an IUP on ultrasound?","Is the patient hemodynamically stable? Any peritoneal signs?","Ultrasound findings: free fluid in Morrison's pouch or pelvis?","Gestational age, LMP, prior OB/GYN history, STI history if PID suspected"]},
      {label:"They Will Recommend", col:"#3dffa0", items:["Ectopic with free fluid/instability: emergent OR — call OR simultaneously","Ectopic stable, hCG <5000: methotrexate protocol vs OR based on size and vitals","Ovarian torsion: OR for detorsion — timing depends on hemodynamics and ultrasound","Eclampsia: magnesium sulfate, antihypertensives, OB at bedside for delivery planning"]},
      {label:"Phone Only",          col:"#3b9eff", items:["Threatened abortion with IUP on US, stable, hCG rising — OB clinic 48h","PID without TOA, hemodynamically stable, tolerating PO — antibiotics, outpatient","First trimester bleeding, IUP confirmed, closed cervix, stable — reassurance","Hyperemesis with IUP confirmed, stable metabolically — antiemetics, fluids"]},
      {label:"Come In Immediately", col:"#ff6b6b", items:["Ectopic pregnancy with hemodynamic instability or free fluid — this is hemorrhage","Eclampsia or severe preeclampsia: BP >160/110, seizure, altered mental status","Placental abruption: painful bleeding, rigid uterus, fetal distress","Postpartum hemorrhage — call OB and activate massive transfusion protocol"]},
      {label:"Disposition Pattern", col:"#9b6dff", items:["Ectopic OR → OB floor or ICU based on hemodynamic recovery","Ovarian torsion post-detorsion → OB/GYN floor","Eclampsia → L&D for delivery, ICU if severe end-organ involvement","PID inpatient → Floor, IV antibiotics, surgical co-consult if TOA"]},
    ],
    pearl:"Ultrasound with no IUP + positive hCG = ectopic until proven otherwise regardless of hCG level. Do not reassure based on low hCG — a ruptured ectopic can have an hCG of 300.",
  },
  {
    id:"hemeonc", name:"Hematology / Oncology", icon:"🩸", color:"#9b6dff", cat:"medical",
    hook:"ANC, treatment context, and whether this is a known malignancy or new presentation drive everything",
    sections:[
      {label:"Pre-Call Prep",       col:"#00e5c0", items:["ANC: absolute neutrophil count — febrile neutropenia threshold <500 or <1000 and falling","Current chemotherapy regimen: last cycle date, agents used","Tumor lysis labs: uric acid, potassium, phosphorus, calcium, LDH","Port/PICC status: accessed? Blood cultures drawn from line AND peripherally?"]},
      {label:"They Will Ask",       col:"#f5c842", items:["ANC — this is their first question every time","Last chemotherapy cycle: what drugs, when was last infusion?","Blood cultures: drawn from central line and peripheral site before antibiotics?","Is this the patient's first presentation of malignancy or known history?"]},
      {label:"They Will Recommend", col:"#3dffa0", items:["Febrile neutropenia: broad-spectrum coverage (cefepime or pip-tazo) within 60 min","TLS: aggressive IV hydration, rasburicase if uric acid severely elevated","SVCS: dexamethasone, elevation of HOB, urgent CT chest, oncology-directed intervention","Hyperviscosity: plasmapheresis emergently, avoid transfusion"]},
      {label:"Phone Only",          col:"#3b9eff", items:["Stable outpatient with known malignancy, no fever, ANC >1000 — clinic follow","Mild bone marrow suppression, no infection signs, ANC >500 — outpatient CBC recheck","Chemotherapy side effects without systemic toxicity — antiemetics, supportive care","Port access issue without fever or systemic infection — outpatient intervention"]},
      {label:"Come In Immediately", col:"#ff6b6b", items:["Febrile neutropenia: ANC <500 — antibiotics within 60 min is the standard","Spinal cord compression from metastasis: new motor deficit + back pain","Hyperleukocytosis (WBC >100k): leukapheresis emergently","Hypercalcemia of malignancy: AMS + Ca >14 — IV fluids, bisphosphonates"]},
      {label:"Disposition Pattern", col:"#9b6dff", items:["Febrile neutropenia → Oncology floor or stepdown, isolation room","TLS → ICU for renal monitoring and dialysis access","Cord compression → Neurosurgery/radiation co-consult, ICU or spine unit","Hypercalcemia severe → ICU or stepdown, cardiac monitoring"]},
    ],
    pearl:"Blood cultures before antibiotics for febrile neutropenia — but never let culture logistics delay antibiotics beyond 60 minutes. Draw from both central line and peripheral site.",
  },
  {
    id:"nephrology", name:"Nephrology", icon:"🫘", color:"#00e5c0", cat:"medical",
    hook:"Have the BMP, urine output trend, baseline creatinine, and fluid balance ready before dialing",
    sections:[
      {label:"Pre-Call Prep",       col:"#00e5c0", items:["BMP: specifically creatinine, BUN, K+, bicarb, and phosphorus","Baseline creatinine — the delta from baseline defines acute vs chronic","Urine output trend and total I&O over last 8–24h","ESRD status: dialysis schedule, last dialysis session, modality (HD vs PD)"]},
      {label:"They Will Ask",       col:"#f5c842", items:["What is the baseline creatinine? How does today's compare?","Last dialysis session: date, modality, adequacy of session?","Urine output: oliguric (<0.5mL/kg/h) or anuric?","EKG: what are the T-waves doing? Any signs of hyperkalemia?"]},
      {label:"They Will Recommend", col:"#3dffa0", items:["Hyperkalemia K >6.5: calcium gluconate now, insulin/D50, kayexalate, dialysis planning","Uremic emergency (pericarditis, encephalopathy): urgent dialysis","Renal replacement therapy: CRRT vs intermittent HD based on hemodynamics","Nephrotoxin avoidance: hold NSAIDs, contrast, aminoglycosides, ACE/ARB in AKI"]},
      {label:"Phone Only",          col:"#3b9eff", items:["Stable AKI, creatinine <2× baseline, not oliguric, no hyperkalemia — fluids, monitor","ESRD patient mild fluid overload, hemodynamically stable — adjust next dialysis","CKD with mild worsening, treatable cause identified — optimize underlying etiology","Asymptomatic hyponatremia, Na >120, chronic — no acute intervention tonight"]},
      {label:"Come In Immediately", col:"#ff6b6b", items:["K >6.5 with EKG changes — peaked T-waves or wide QRS requires immediate response","Uremic pericarditis with effusion or encephalopathy — emergent dialysis","Anuric AKI with fluid overload and respiratory compromise — dialysis tonight","Rapidly rising creatinine with suspected TMA — TTP/HUS work-up"]},
      {label:"Disposition Pattern", col:"#9b6dff", items:["ESRD emergent dialysis → ICU or HD unit step-down","AKI requiring CRRT → ICU for continuous monitoring","Moderate AKI, conservative management → Floor with close monitoring","Electrolyte emergency resolved → Telemetry or stepdown depending on etiology"]},
    ],
    pearl:"Always know the baseline creatinine before calling. 'Creatinine of 3.2' sounds alarming until the baseline is 2.9 — that is a stable CKD patient. The delta from baseline is everything.",
  },
  {
    id:"gi", name:"Gastroenterology", icon:"🟤", color:"#ff9f43", cat:"medical",
    hook:"Hemodynamic stability and active bleeding signs determine if this is a phone call or a code",
    sections:[
      {label:"Pre-Call Prep",       col:"#00e5c0", items:["Hemoglobin trend: initial and most recent value with timing","Hemodynamic stability: HR, BP, any orthostatic changes","Endoscopy history: last scope, known varices, prior GI bleeding episodes","Current anticoagulation and antiplatelets: drug, dose, last taken"]},
      {label:"They Will Ask",       col:"#f5c842", items:["What is the hemoglobin trend — dropping or stable?","Is the patient hemodynamically stable? Any signs of active hemorrhage?","Hematemesis vs melena vs hematochezia — helps localize source","On anticoagulation? Warfarin, DOAC? Last dose?"]},
      {label:"They Will Recommend", col:"#3dffa0", items:["UGIB: PPI infusion (pantoprazole 80mg bolus → 8mg/h drip), blood type and cross, urgent EGD","Variceal bleeding: octreotide infusion, prophylactic antibiotics (ceftriaxone), urgent EGD","LGIB hemodynamically stable: admit, colonoscopy prep, elective scope","Acute liver failure: transfer to transplant center early, NAC infusion"]},
      {label:"Phone Only",          col:"#3b9eff", items:["UGIB hemodynamically stable, Hgb stable, dark melena — PPI, scope next AM","LGIB bright red per rectum, small volume, stable — colonoscopy prep","Elevated LFTs without fulminant failure signs — hepatitis workup, outpatient","Mild abdominal pain with elevated lipase <3× normal — pancreatitis admission"]},
      {label:"Come In Immediately", col:"#ff6b6b", items:["UGIB with hemodynamic instability despite 2L resuscitation — emergent EGD","Suspected variceal hemorrhage: hematemesis + cirrhosis + hemodynamic compromise","Acute liver failure: INR >1.5 + encephalopathy — transplant evaluation begins now","Perforation on CT with peritoneal signs — this is now a surgical call, not GI"]},
      {label:"Disposition Pattern", col:"#9b6dff", items:["UGIB unstable → ICU, urgent scope within 12–24h","UGIB stable → Stepdown or floor, scope next AM","Acute liver failure → ICU, transplant team notification","Pancreatitis severe (BISAP ≥2) → ICU or stepdown, nutrition team"]},
    ],
    pearl:"For UGIB, GI wants two large-bore IVs, blood type and cross for 2 units, and a PPI drip already running before they scope. Do not ask permission to start the PPI — start it while you call.",
  },
  {
    id:"pulm", name:"Pulmonology / Critical Care", icon:"🫁", color:"#3b9eff", cat:"medical",
    hook:"Respiratory failure: P/F ratio, work of breathing, and what has already been tried are the three questions",
    sections:[
      {label:"Pre-Call Prep",       col:"#00e5c0", items:["ABG: pH, PaO2, PaCO2, P/F ratio — not just pulse ox","Work of breathing: accessory muscle use, respiratory rate, unable to complete sentences?","What has been tried: O2, nebulizers, CPAP/BiPAP, positioning?","CXR or CT chest findings available?"]},
      {label:"They Will Ask",       col:"#f5c842", items:["ABG results — P/F ratio defines ARDS severity","Work of breathing on exam: how distressed does the patient appear?","BiPAP tried? Settings? Response to non-invasive ventilation?","Underlying diagnosis: COPD, CHF, PNA, ARDS, PE? — changes approach completely"]},
      {label:"They Will Recommend", col:"#3dffa0", items:["ARDS: lung-protective ventilation (6mL/kg IBW, PEEP titration, prone if P/F <150)","Status asthmaticus: heliox, ketamine, intubation if pre-arrest","COPD exacerbation: BiPAP first — intubation dramatically worsens COPD prognosis","Massive PE with shock: systemic TPA or catheter-directed thrombolysis"]},
      {label:"Phone Only",          col:"#3b9eff", items:["COPD exacerbation responding to bronchodilators and steroids — BiPAP and floor","Asthma moderate severity, sat improving — albuterol, steroids, disposition planning","Mild hypoxia, SpO2 92–94% on 2–4L, stable — floor admission","Post-intubation vent management for straightforward PNA — routine ICU admission"]},
      {label:"Come In Immediately", col:"#ff6b6b", items:["Impending respiratory failure: RR >35, SpO2 <88% on high-flow O2, failing BiPAP","Tension pneumothorax or massive hemothorax — decompress first, call after","Massive hemoptysis: active bleeding with hemodynamic compromise","ARDS P/F <200 with deteriorating trajectory — intubation decision cannot wait"]},
      {label:"Disposition Pattern", col:"#9b6dff", items:["Mechanical ventilation → ICU mandatory","BiPAP dependent → ICU or step-down with continuous monitoring","ARDS post-intubation → ICU, prone team notification if P/F <150","PE post-thrombolysis → ICU for bleeding monitoring and hemodynamic support"]},
    ],
    pearl:"Critical care is the one service that respects confidence. If you say 'I think this patient needs to be intubated,' they will respond to that. Make your ask specific and decisive.",
  },
  {
    id:"id", name:"Infectious Disease", icon:"🦠", color:"#3dffa0", cat:"medical",
    hook:"ID consults want the whole story — mechanism, source, organism, resistance profile, and host immunity",
    sections:[
      {label:"Pre-Call Prep",       col:"#00e5c0", items:["Culture results: blood, urine, wound, CSF — organism and sensitivities if available","Current antibiotics: drug, dose, start date, and clinical response so far","Immune status: HIV with CD4, active chemotherapy, transplant/immunosuppressants","Source of infection: localize it before calling — unclear source is harder to consult on"]},
      {label:"They Will Ask",       col:"#f5c842", items:["Cultures: what was drawn, when, and what's growing?","Current antibiotics: what is the patient already on and why?","Host immune status: immunocompromised? Specific deficits?","Prior resistance history: any prior MRSA, VRE, ESBL, or MDR organisms on file?"]},
      {label:"They Will Recommend", col:"#3dffa0", items:["Endocarditis: TEE, prolonged IV antibiotics, cardiac surgery consult for valve destruction","Necrotizing fasciitis: emergent OR — no antibiotic alone will treat this","CNS infection: long-duration IV antibiotics, dexamethasone for bacterial meningitis","OPAT candidate: outpatient parenteral therapy planning, PICC placement"]},
      {label:"Phone Only",          col:"#3b9eff", items:["Simple CAP in otherwise healthy patient — standard empiric coverage, no ID needed","Uncomplicated UTI with known susceptibilities — targeted antibiotic, no consult","Routine sepsis without complex resistance or unusual organism — start empiric","HIV patient stable on ART, not opportunistic infection suspected — outpatient"]},
      {label:"Come In Immediately", col:"#ff6b6b", items:["Endocarditis with embolic phenomena, new heart block, or hemodynamic compromise","Necrotizing fasciitis on CT or by surgical exam — they will want to see before OR","CNS infection with altered mental status or new focal deficit","Septic shock unresponsive to appropriate antibiotics — source control may be missing"]},
      {label:"Disposition Pattern", col:"#9b6dff", items:["Endocarditis → Cardiology co-management, prolonged hospital stay, valve surgery eval","NF post-debridement → STICU, reconstructive surgery planning","Complex MDR organism → Contact precautions, ID-guided antibiotics, daily rounds","OPAT → Discharge planning team, home health, outpatient clinic within 1 week"]},
    ],
    pearl:"ID consults want the full story. Tell them organism, sensitivities, source, duration of illness, and host immune status before they ask. Never call with 'positive blood cultures, not sure what to use.'",
  },
  {
    id:"psych", name:"Psychiatry", icon:"🧩", color:"#00d4ff", cat:"medical",
    hook:"Medical clearance is your job, not theirs — complete it before you call",
    sections:[
      {label:"Pre-Call Prep",       col:"#00e5c0", items:["Medical clearance completed: vitals, BMP, glucose, UDS, EtOH level, TSH if indicated","EKG if on QTc-prolonging agents or significant ingestion","Acute intoxication ruled out — psych will not evaluate an acutely intoxicated patient","Columbia Suicide Severity Rating Scale (C-SSRS) documented"]},
      {label:"They Will Ask",       col:"#f5c842", items:["Medical clearance: has everything been ruled out that could be causing behavior organically?","Is the patient acutely intoxicated? They will not come down until sober","C-SSRS findings: what is the ideation level, any specific plan, access to means?","Current psychiatric medications and compliance — last outpatient psychiatric contact?"]},
      {label:"They Will Recommend", col:"#3dffa0", items:["SI with plan and intent: involuntary hold (1799/5150/Baker Act per jurisdiction)","Acute agitation: de-escalation first, then pharmacologic (olanzapine or droperidol IM)","Psychosis first episode: medical workup to exclude organic cause, then inpatient psych","Capacity evaluation: structured assessment documented, surrogate decision-maker identified"]},
      {label:"Phone Only",          col:"#3b9eff", items:["Passive SI without plan or intent in a patient with outpatient psychiatric follow","Anxiety disorder exacerbation, no safety concern, medically stable","Established psychiatric patient refusing voluntary admission, medically stable, no SI","Medication refill issue without acute safety concern — outpatient psychiatry referral"]},
      {label:"Come In Immediately", col:"#ff6b6b", items:["Active suicidal ideation with specific plan and access to means — must evaluate in person","Psychosis with inability to care for self, self-harm, or danger to others","Catatonia: medical emergency — may require IV lorazepam or ECT","Neuroleptic malignant syndrome: fever + rigidity + AMS after antipsychotic"]},
      {label:"Disposition Pattern", col:"#9b6dff", items:["Inpatient psychiatric admission → Psych unit, voluntary or involuntary hold","Observation for intoxication clearing → Sober on re-evaluation, then psychiatric assessment","Capacity evaluation → Documented, ethics consult if complex","Discharge with safety plan → Crisis line given, outpatient follow within 48–72h"]},
    ],
    pearl:"Psychiatry will push back on 'incomplete medical clearance' — have BMP, glucose, UDS, and EtOH level documented before calling. Rule out acute organic cause, not exhaust every diagnostic possibility.",
  },
  {
    id:"ophtho", name:"Ophthalmology", icon:"👁️", color:"#00e5c0", cat:"other",
    hook:"Time to visual loss is the most critical factor — get exact onset and rate of progression",
    sections:[
      {label:"Pre-Call Prep",       col:"#00e5c0", items:["Visual acuity in each eye: Snellen chart or counting fingers at minimum","IOP (intraocular pressure) if angle-closure glaucoma suspected","History of vision loss: sudden vs gradual, monocular vs binocular, painful vs painless","Eye exam: pupil response (RAPD), conjunctival injection, anterior chamber depth"]},
      {label:"They Will Ask",       col:"#f5c842", items:["Visual acuity: what is it in each eye with correction?","Onset: sudden or gradual? Painless or painful?","Trauma: any mechanism of injury? Risk of open globe?","IOP: have you measured it? Any signs of acute angle closure?"]},
      {label:"They Will Recommend", col:"#3dffa0", items:["CRAO: ocular massage, hyperbaric O2, stroke workup concurrently","Acute angle-closure glaucoma: topical timolol, pilocarpine, IV acetazolamide, mannitol if needed","Open globe: rigid eye shield (NO pressure), NPO, antiemetics, OR for repair","Orbital cellulitis: IV antibiotics, CT orbits, ophthalmology and ENT co-consult"]},
      {label:"Phone Only",          col:"#3b9eff", items:["Subconjunctival hemorrhage without trauma or visual change — reassurance, clinic","Stye or chalazion without orbital involvement — warm compresses, ophthalmology clinic","Viral conjunctivitis without keratitis — topical treatment, outpatient follow","Mild corneal abrasion, intact globe — antibiotic drops, patch, follow 24h"]},
      {label:"Come In Immediately", col:"#ff6b6b", items:["CRAO: sudden painless monocular visual loss — 90-minute window (urgent)","Acute angle-closure glaucoma: painful red eye, mid-dilated pupil, IOP >50mmHg","Open globe injury: any suspected penetrating ocular trauma — shield, NPO, OR","Retrobulbar hematoma: proptosis + vision loss post-trauma"]},
      {label:"Disposition Pattern", col:"#9b6dff", items:["Open globe → OR → Ophthalmology floor","Acute angle closure treated → Floor or discharge based on IOP response","CRAO → Stroke workup (TTE, telemetry, MRI), ophthalmology follow","Orbital cellulitis → Admission, IV antibiotics, ophthalmology and ENT co-manage"]},
    ],
    pearl:"For acute painless monocular vision loss, call ophthalmology and neurology simultaneously — CRAO and optic neuritis require different urgent evaluations.",
  },
  {
    id:"ent", name:"ENT / Otolaryngology", icon:"👂", color:"#f5c842", cat:"other",
    hook:"Airway status always comes first — if it is threatened, lead with that, not the ENT complaint",
    sections:[
      {label:"Pre-Call Prep",       col:"#00e5c0", items:["Airway assessment: stridor? Drooling? Tripoding? Muffled voice? These change urgency entirely","Epistaxis: anterior vs posterior bleeding, duration, estimated blood loss, prior packing attempts","Peritonsillar abscess: unilateral swelling, uvular deviation, muffled voice","CT neck with contrast if Ludwig's angina, epiglottitis, or deep space neck infection suspected"]},
      {label:"They Will Ask",       col:"#f5c842", items:["Is the airway patent? Any stridor, drooling, inability to swallow secretions?","Epistaxis: any packing in place? Anterior or posterior source suspected?","Peritonsillar abscess: has aspiration been attempted? Unilateral vs bilateral swelling?","Neck CT findings: gas, abscess pocket, deep space involvement, mediastinal extension?"]},
      {label:"They Will Recommend", col:"#3dffa0", items:["Epiglottitis: OR for airway with ENT, anesthesia, and surgical airway kit in room","Ludwig's angina: OR for airway + drainage, IV antibiotics, surgical airway bedside prep","Peritonsillar abscess: aspiration or I&D in ED — they will often guide or perform","Posterior epistaxis not controlled: posterior packing or IR embolization"]},
      {label:"Phone Only",          col:"#3b9eff", items:["Anterior epistaxis controlled with direct pressure or anterior packing — outpatient follow","Otitis media or externa without complication or intracranial extension","Simple peritonsillar cellulitis (no abscess on CT) — antibiotics, ENT outpatient","Minor traumatic ear/nose injury without functional deficit — ENT clinic follow-up"]},
      {label:"Come In Immediately", col:"#ff6b6b", items:["Epiglottitis with stridor or swallowing difficulty — call ENT, anesthesia, prepare surgical airway","Angioedema with upper airway involvement — if worsening despite epinephrine","Post-tonsillectomy hemorrhage with active bleeding — emergent OR","Ludwig's angina: submandibular cellulitis + floor of mouth elevation + drooling = impending airway"]},
      {label:"Disposition Pattern", col:"#9b6dff", items:["Airway emergency post-OR → ICU for airway monitoring","Peritonsillar abscess drained → Floor or discharge based on response","Posterior epistaxis packed → Admission for 24–48h observation, ENT follow","Deep neck infection post-drainage → STICU or floor, IV antibiotics, daily wound check"]},
    ],
    pearl:"The ENT call that goes wrong fastest is the one where you describe 'throat pain' and don't mention the drooling, stridor, or muffled voice. Lead with airway status on every ENT call.",
  },
];

// ── Category filter groups ────────────────────────────────────────────────────
export const CONSULT_CATS = [
  {id:"all",      label:"All",      color:"#00e5c0"},
  {id:"cardiac",  label:"Cardiac",  color:"#ff4444"},
  {id:"neuro",    label:"Neuro",    color:"#9b6dff"},
  {id:"surgical", label:"Surgical", color:"#ff9f43"},
  {id:"medical",  label:"Medical",  color:"#3b9eff"},
  {id:"other",    label:"Other",    color:"#f5c842"},
];

// ── Helper: build a scenario string from NPI encounter data ───────────────────
export function buildConsultScenario(demo, cc, vitals, medications, pmhSelected) {
  const parts = [];

  // Patient demographics
  const age  = demo?.age  ? `${demo.age}yo` : null;
  const sex  = demo?.sex  ? demo.sex        : null;
  if (age || sex) parts.push([age, sex].filter(Boolean).join(" "));

  // Chief complaint
  if (cc?.text?.trim()) parts.push(`presenting with ${cc.text.trim()}`);

  // Vitals
  const vSeg = [];
  if (vitals?.hr)   vSeg.push(`HR ${vitals.hr}`);
  if (vitals?.bp)   vSeg.push(`BP ${vitals.bp}`);
  if (vitals?.rr)   vSeg.push(`RR ${vitals.rr}`);
  if (vitals?.spo2) vSeg.push(`SpO2 ${vitals.spo2}%`);
  if (vitals?.temp) vSeg.push(`Temp ${vitals.temp}C`);
  if (vSeg.length)  parts.push(`Vitals: ${vSeg.join(", ")}`);

  // Medications (first 6)
  const meds = (medications || []).filter(m => m?.name || typeof m === "string");
  if (meds.length) {
    const names = meds.slice(0, 6).map(m => m.name || m).join(", ");
    parts.push(`Medications: ${names}`);
  }

  // PMH (first 6)
  const pmh = (pmhSelected || []).slice(0, 6);
  if (pmh.length) parts.push(`PMH: ${pmh.join(", ")}`);

  return parts.join(". ");
}