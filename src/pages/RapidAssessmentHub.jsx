import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

// ── Font Injection ────────────────────────────────────────────────────
(() => {
  if (document.getElementById("rapid-fonts")) return;
  const l = document.createElement("link");
  l.id = "rapid-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "rapid-css";
  s.textContent = `
    *{box-sizing:border-box;margin:0;padding:0;}
    ::-webkit-scrollbar{width:3px;height:3px;}
    ::-webkit-scrollbar-track{background:transparent;}
    ::-webkit-scrollbar-thumb{background:rgba(42,79,122,0.5);border-radius:2px;}
    @keyframes fadeSlide{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
    @keyframes pulseAlert{0%,100%{opacity:1}50%{opacity:.55}}
    .fade-in{animation:fadeSlide .25s ease forwards;}
    .shimmer-text{background:linear-gradient(90deg,#e8f0fe 0%,#fff 30%,#ff6b6b 52%,#f5c842 72%,#e8f0fe 100%);background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 5s linear infinite;}
    .cc-row{transition:background .12s,border-color .12s;}
    .cc-row:hover{background:rgba(14,37,68,0.85)!important;border-color:rgba(42,79,122,0.5)!important;}
    .phase-card{transition:transform .15s;}
    .phase-card:hover{transform:translateY(-1px);}
  `;
  document.head.appendChild(s);
})();

const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36", up:"#0e2544",
  b:"rgba(26,53,85,0.8)", bhi:"rgba(42,79,122,0.9)",
  txt:"#e8f0fe", txt2:"#8aaccc", txt3:"#4a6a8a", txt4:"#2e4a6a",
  red:"#ff4444", orange:"#ff9f43", yellow:"#f5c842", green:"#3dffa0",
  blue:"#3b9eff", purple:"#9b6dff", teal:"#00e5c0", coral:"#ff6b6b", cyan:"#00d4ff",
};
const glass = {backdropFilter:"blur(24px) saturate(200%)",WebkitBackdropFilter:"blur(24px) saturate(200%)",background:"rgba(8,22,40,0.75)",border:"1px solid rgba(42,79,122,0.35)",borderRadius:16};

const ESI_META = {
  1:{color:T.red,   label:"Immediate",  tc:"#fff"},
  2:{color:T.orange,label:"Emergent",   tc:"#fff"},
  3:{color:T.yellow,label:"Urgent",     tc:"#050f1e"},
  4:{color:T.blue,  label:"Less Urgent",tc:"#fff"},
  5:{color:T.green, label:"Non-Urgent", tc:"#050f1e"},
};

const CATEGORIES = [
  {id:"all",       label:"All",        color:T.txt3},
  {id:"cardiac",   label:"Cardiac",    color:T.coral},
  {id:"pulmonary", label:"Pulmonary",  color:T.blue},
  {id:"neuro",     label:"Neuro",      color:T.purple},
  {id:"gi",        label:"GI",         color:T.orange},
  {id:"infectious",label:"Infectious", color:T.teal},
  {id:"trauma",    label:"Trauma",     color:T.red},
  {id:"tox",       label:"Tox",        color:T.yellow},
  {id:"peds",      label:"Peds",       color:T.green},
  {id:"msk",       label:"MSK",        color:T.cyan},
  {id:"allergy",   label:"Allergy",    color:T.orange},
];

const PHASE_META = [
  {key:"immediate", time:"0 – 1 min",  label:"Immediate Actions", color:T.red,    icon:"⚡"},
  {key:"history",   time:"2 – 4 min",  label:"Focused History",   color:T.orange, icon:"📋"},
  {key:"exam",      time:"5 – 7 min",  label:"Physical Exam",     color:T.yellow, icon:"🔍"},
  {key:"orders",    time:"7 – 10 min", label:"Initial Orders",    color:T.teal,   icon:"📝"},
];

// ── Complaint Data ───────────────────────────────────────────────────
const COMPLAINTS = [
  {
    id:"chest_pain", label:"Chest Pain", category:"cardiac", esi:2, icon:"🫀", color:T.coral,
    tagline:"ACS, dissection, PE, PTX — rule out life threats before anchoring",
    immediate:[
      "12-lead ECG within 10 min — physician review immediately",
      "IV access x2, continuous cardiac monitor, pulse ox",
      "O2 only if SpO2 < 94% — hyperoxia harmful in ACS",
      "ASA 325 mg PO chewed if no contraindication",
      "Vitals q5 min; if SBP < 90 — escalate to ESI 1 now",
    ],
    history:[
      "OPQRST: onset (sudden vs exertional), quality (pressure, tearing, pleuritic), radiation",
      "Diaphoresis, nausea, vomiting, dyspnea, syncope",
      "Prior cardiac hx: PCI, CABG, stents, prior MI",
      "Risk factors: DM, HTN, tobacco, hyperlipidemia, FHx sudden cardiac death",
      "Tearing or ripping pain radiating to back — dissection until proven otherwise",
      "Anticoagulants, PDE5 inhibitors (NTG contraindicated within 24–48h)",
    ],
    exam:[
      "Bilateral arm BP — difference > 20 mmHg suggests aortic dissection",
      "JVD, S3/S4, new murmur or pericardial rub",
      "Lung fields: crackles (CHF), wheeze",
      "Peripheral edema, distal pulses all four extremities",
      "Diaphoresis, pallor, cyanosis — autonomic activation",
    ],
    orders:[
      "Troponin at 0h and 3h (or high-sensitivity troponin per protocol)",
      "BMP, CBC, coags, BNP if CHF concern",
      "Portable CXR: mediastinal widening, cardiomegaly, pulmonary edema",
      "NTG 0.4 mg SL if SBP > 90 and no recent PDE5 use",
      "D-dimer if low-risk PE; CT angio chest if dissection concern",
    ],
    redFlags:[
      "ST elevation any lead — activate STEMI alert immediately",
      "New LBBB with symptoms — treat as STEMI equivalent",
      "Diaphoresis + radiation = high pre-test probability for ACS",
      "Hypotension with chest pain — cardiogenic shock or massive PE",
      "Pulse differential or BP differential — aortic dissection",
    ],
    dontMiss:["STEMI","Aortic Dissection","Massive PE","Tension PTX","Esophageal Rupture"],
    pearl:"Normal troponin at 0h does not rule out ACS — serial troponins with clinical context required. In STEMI, every 10-minute delay in reperfusion increases mortality. Door-to-balloon goal is 90 minutes.",
  },
  {
    id:"dyspnea", label:"Shortness of Breath", category:"pulmonary", esi:2, icon:"🫁", color:T.blue,
    tagline:"Silent chest in asthma is pre-arrest — assess work of breathing before anything else",
    immediate:[
      "Upright position, high-flow O2 via NRB if SpO2 < 90%",
      "Pulse ox, RR, vitals continuous; cardiac monitor",
      "IV access, 12-lead ECG",
      "Lung POCUS: B-lines (CHF/PNA), PTX, effusion — faster than CXR",
      "RR > 30 or SpO2 failing on NRB — prepare for RSI or BiPAP now",
    ],
    history:[
      "Onset: sudden (PE, PTX) vs gradual (CHF, PNA, malignancy)",
      "Orthopnea, PND, bilateral lower extremity edema",
      "Fever, cough, sputum character and color",
      "Prior COPD, asthma, CHF, PE, malignancy",
      "Recent travel, immobilization, surgery, oral contraceptive use — PE risk",
      "ACEi use (angioedema), beta-blocker use (masks tachycardia in PE)",
    ],
    exam:[
      "Work of breathing: accessory muscle use, tripoding, nasal flaring, retractions",
      "Auscultation: wheeze (obstruction), crackles (CHF/PNA), absent BS (PTX/effusion)",
      "Tracheal deviation — tension PTX until decompressed",
      "JVD, bilateral leg edema — CHF or massive PE",
      "Skin: diaphoresis, cyanosis, mottling — severity markers",
    ],
    orders:[
      "CXR portable; ABG if SpO2 < 92% or CO2 concern (COPD)",
      "BNP, D-dimer per pretest probability; CBC, BMP",
      "Albuterol 2.5 mg neb + ipratropium 0.5 mg if bronchospasm",
      "Furosemide 40–80 mg IV if fluid overload suspected",
      "CPAP/BiPAP for hypercapnic COPD exacerbation or cardiogenic pulmonary edema",
    ],
    redFlags:[
      "Silent chest in asthmatic — near-fatal asthma, prepare RSI immediately",
      "Absent unilateral breath sounds — tension PTX, needle decompress 2nd ICS MCL",
      "SpO2 not improving on NRB — ABG, imminent intubation",
      "Stridor — upper airway emergency, prepare surgical airway",
      "Rising pCO2 on serial ABG — ventilatory failure, do not delay intubation",
    ],
    dontMiss:["Tension PTX","Massive PE","Status Asthmaticus","Flash Pulmonary Edema","Foreign Body Airway"],
    pearl:"Target SpO2 88–92% in COPD — over-oxygenation suppresses hypoxic drive and worsens hypercapnia. Lung POCUS diagnoses pneumothorax and B-lines faster and with greater accuracy than portable CXR.",
  },
  {
    id:"ams", label:"Altered Mental Status", category:"neuro", esi:2, icon:"🧠", color:T.purple,
    tagline:"Check glucose first, always — then work through AEIOU TIPS systematically",
    immediate:[
      "POC glucose STAT — treat < 60 mg/dL with D50W 25g IV",
      "Thiamine 100 mg IV BEFORE glucose if EtOH history or malnutrition risk",
      "Naloxone 0.4–2 mg IV/IM/IN if opioid toxidrome (miosis + bradypnea)",
      "Vitals, O2, IV access, continuous monitor",
      "GCS assessment, pupil check; lateral decubitus if vomiting risk",
    ],
    history:[
      "Baseline mental status from family or caregiver — critical reference point",
      "Timeline: acute (tox, stroke, seizure) vs subacute (infection, metabolic)",
      "All medications, OTC, herbal, substances — recent changes or new additions",
      "Fever, headache, neck stiffness, seizure activity, incontinence",
      "Prior psychiatric history, dementia, prior strokes",
      "Recent falls, head trauma, anticoagulant use",
    ],
    exam:[
      "GCS: Eye (1–4), Verbal (1–5), Motor (1–6) — document each component",
      "Pupils: miosis (opioids, organophosphates) vs mydriasis (sympathomimetics, anticholinergics)",
      "Focal neuro: facial droop, arm drift, speech, gaze deviation",
      "Meningismus: neck flexion ROM, Kernig, Brudzinski signs",
      "Skin: jaundice, track marks, diaphoresis, flushing, cyanosis",
    ],
    orders:[
      "BMP, CBC, LFTs, ammonia, TSH, B12, folate",
      "Serum tox (APAP, ASA, EtOH, lithium), urine tox screen",
      "CT head w/o contrast if focal deficit, trauma, anticoagulated, or age > 60",
      "Blood cultures x2, UA/culture if febrile",
      "EEG if seizure concern or non-convulsive status epilepticus suspected",
    ],
    redFlags:[
      "Focal deficit + AMS — stroke or ICH until imaging proves otherwise",
      "Fever + AMS + meningismus — meningitis/encephalitis, LP after CT",
      "GCS < 8 — airway management decision required now",
      "Pinpoint pupils + bradypnea — opioid toxicity, naloxone",
      "Rapid deterioration without clear cause — herniation workup stat",
    ],
    dontMiss:["Hypoglycemia","Stroke or ICH","Meningitis or Encephalitis","Non-Convulsive Status Epilepticus","Wernicke Encephalopathy"],
    pearl:"Give thiamine BEFORE dextrose in any patient with EtOH history or malnutrition — glucose alone can precipitate Wernicke encephalopathy. NCSE causes AMS without visible seizure activity; EEG is required to diagnose.",
  },
  {
    id:"stroke", label:"Stroke / Focal Deficit", category:"neuro", esi:2, icon:"⚡", color:T.purple,
    tagline:"Time is brain — 1.9 million neurons die every minute without treatment",
    immediate:[
      "Activate code stroke — get neurology to bedside or telemedicine",
      "Last known well time — document precisely, not time of discovery",
      "IV access, NPO, O2 if SpO2 < 94%, continuous cardiac monitor",
      "NIHSS assessment — trained staff, document every component",
      "CT head w/o contrast STAT — door-to-CT goal < 25 minutes",
    ],
    history:[
      "Exact last known well — this sets the tPA and thrombectomy window",
      "FAST: Face droop, Arm drift, Speech change, Time",
      "Headache, vomiting, seizure at onset — suggests hemorrhagic",
      "Afib, prior stroke or TIA, DM, HTN, hyperlipidemia",
      "Anticoagulants: drug name, dose, last taken, indication",
      "tPA contraindications: surgery < 3 months, active bleeding, INR > 1.7",
    ],
    exam:[
      "Full NIHSS (0–42): LOC, gaze, visual fields, facial palsy, arm/leg motor, ataxia, sensation, language, dysarthria, neglect",
      "Facial droop: asymmetric smile",
      "Arm drift: 10 seconds eyes-closed, palms-up",
      "Speech: repeat sentence, name two common objects",
      "Bilateral BP; cardiac auscultation for murmur as cardioembolic source",
    ],
    orders:[
      "CT head w/o contrast + CTA head and neck STAT",
      "Glucose, CBC, BMP, INR, PTT — results goal < 45 minutes",
      "12-lead ECG — new afib as cardioembolic source",
      "Troponin; formal echo if cardioembolic workup indicated",
      "tPA 0.9 mg/kg IV (max 90 mg) if eligible within 4.5h last known well",
    ],
    redFlags:[
      "NIHSS > 6 — large vessel occlusion, thrombectomy evaluation needed",
      "BP > 185/110 — tPA contraindicated, treat to < 185/110 before infusion",
      "Hemorrhage on CT — reverse anticoagulation, neurosurgery consult now",
      "Basilar artery occlusion — vertigo, ataxia, diplopia, coma",
      "Posterior circulation: unique mimics — vertigo alone is not stroke",
    ],
    dontMiss:["ICH or SAH","Basilar Artery Occlusion","Todd Paralysis (post-ictal)","Hypoglycemia Mimicking Stroke","Hypertensive Encephalopathy"],
    pearl:"Do NOT lower BP aggressively in ischemic stroke — target 140–180 unless tPA candidate (< 185/110 required before infusion). Aggressive lowering extends the ischemic penumbra and worsens outcomes.",
  },
  {
    id:"syncope", label:"Syncope", category:"cardiac", esi:2, icon:"💫", color:T.coral,
    tagline:"Risk-stratify immediately — most syncope is benign, some is imminently fatal",
    immediate:[
      "IV access, 12-lead ECG within 10 minutes",
      "Continuous cardiac monitor",
      "Orthostatic vital signs: supine, standing at 1 min and 3 min",
      "POC glucose",
      "If LOC is ongoing or not fully recovered — treat as AMS protocol",
    ],
    history:[
      "Prodrome: diaphoresis, tunnel vision, N/V before LOC — vasovagal",
      "Position at onset: standing (orthostatic), exertion (structural cardiac)",
      "Witnessed: tonic-clonic activity, tongue bite, incontinence",
      "Prior syncope, palpitations, known arrhythmia or structural heart disease",
      "Family hx sudden cardiac death, channelopathy, HOCM, long QT",
      "Medications: antihypertensives, diuretics, QT-prolonging agents",
    ],
    exam:[
      "Orthostatic BP: supine to standing, >20 mmHg SBP drop = orthostatic hypotension",
      "Cardiac auscultation: crescendo-decrescendo murmur (HOCM, AS)",
      "Focused neuro exam — focal deficit suggests seizure or stroke, not syncope",
      "Trauma from fall: head, spine, extremities",
      "Carotid bruit (carotid sinus syncope in elderly)",
    ],
    orders:[
      "CBC, BMP, troponin if cardiac history or exertional syncope",
      "ECG: QTc interval, delta waves (WPW), epsilon waves (ARVC), Brugada pattern, LBBB",
      "Echo if murmur, exertional syncope, or HOCM concern",
      "CT head only if focal deficit, new seizure, or significant head trauma",
      "Tilt-table and cardiac event monitor — outpatient for recurrent syncope workup",
    ],
    redFlags:[
      "Exertional syncope — structural cardiac cause until echo proves otherwise",
      "No prodrome — arrhythmia until proven otherwise; admit for monitoring",
      "ECG abnormality: prolonged QT, Brugada, delta wave, epsilon wave",
      "Family hx sudden cardiac death — channelopathy screen (genetic cardiology)",
      "Syncope with chest pain — ACS or aortic dissection",
    ],
    dontMiss:["Ventricular Arrhythmia","Aortic Stenosis","HOCM","Pulmonary Embolism","Internal Hemorrhage (AAA or Ectopic)"],
    pearl:"San Francisco Syncope Rule — admit if any: CHF history, Hct < 30%, abnormal ECG, SOB on presentation, SBP < 90 on arrival. Any exertional syncope requires echocardiogram regardless of patient age.",
  },
  {
    id:"sepsis", label:"Sepsis / Fever", category:"infectious", esi:2, icon:"🦠", color:T.teal,
    tagline:"Every hour of antibiotic delay increases mortality 7% — lactate, cultures, ABX within 60 minutes",
    immediate:[
      "IV access x2; blood cultures x2 BEFORE antibiotics — no exceptions",
      "Lactate level — if >= 4 mmol/L activate septic shock protocol",
      "30 mL/kg NS or LR bolus if SBP < 90 or lactate >= 4",
      "Broad-spectrum IV antibiotics within 60 minutes of recognition",
      "Foley catheter — urine output goal > 0.5 mL/kg/h (adult)",
    ],
    history:[
      "Source of infection: pulmonary, urinary, abdominal, skin, CNS, device",
      "Immunocompromised: HIV, steroids, chemotherapy, transplant, asplenia",
      "Recent hospitalization, procedures, indwelling lines or catheters",
      "Fever timeline, true rigors (suggest bacteremia), chills",
      "Medications: NSAIDs masking fever, prior antibiotics — resistance risk",
    ],
    exam:[
      "Temperature — may be hypothermic in elderly or immunosuppressed",
      "Skin: warmth, cellulitis, fluctuance, petechiae or purpura — meningococcemia",
      "Lung exam: crackles, consolidation",
      "Abdominal tenderness, peritoneal signs, CVA tenderness",
      "Mental status — new confusion = SOFA criterion, organ dysfunction",
    ],
    orders:[
      "Lactate (repeat 2h if elevated); blood cultures x2 before ABX",
      "CBC, BMP, LFTs, coags, procalcitonin, D-dimer if PE concern",
      "UA + urine culture; CXR; POCUS if source unclear",
      "Pip-tazo 3.375g IV q6h OR meropenem 1g IV q8h if high resistance risk",
      "Norepinephrine 0.01–0.5 mcg/kg/min if MAP < 65 after adequate fluid",
    ],
    redFlags:[
      "Lactate >= 4 mmol/L — septic shock, aggressive resuscitation now",
      "MAP < 65 after 30 mL/kg — vasopressors indicated",
      "Purpura or petechiae with fever — meningococcemia, ceftriaxone immediately",
      "Any fever in immunocompromised — treat as sepsis from the start",
      "Worsening organ function: Cr rise, platelet drop, AMS",
    ],
    dontMiss:["Septic Shock","Necrotizing Fasciitis","Meningococcemia","Toxic Shock Syndrome","Endocarditis with Septic Emboli"],
    pearl:"SEP-1 (CMS Core Measure): lactate + cultures x2 + broad ABX + 30 mL/kg IVF if hypotension or lactate >= 4 — all within 3 hours. Many institutions now follow the Hour-1 bundle. Procalcitonin guides antibiotic de-escalation.",
  },
  {
    id:"abd_pain", label:"Abdominal Pain", category:"gi", esi:3, icon:"🫃", color:T.orange,
    tagline:"Never withhold analgesia — evidence shows it does NOT impair diagnostic accuracy",
    immediate:[
      "IV access, vitals — SBP < 90 with abdominal pain = AAA protocol in > 50 yo male",
      "POC beta-hCG in ALL females of reproductive age STAT",
      "Peritoneal signs assessment: guarding, rigidity, rebound",
      "Analgesia now: ketorolac 15–30 mg IV (do not withhold)",
      "If hemodynamically unstable — 2 large-bore IVs, NS bolus, surgical consult",
    ],
    history:[
      "OPQRST: colicky (obstruction, stone) vs constant (peritonitis, ischemia)",
      "Relation to food, bowel movements, LMP, sexual history",
      "Vomiting: bilious vs hematemesis, timing relative to pain onset",
      "Prior abdominal surgeries — adhesion risk; prior identical episodes",
      "Urinary symptoms — UTI or nephrolithiasis",
      "Weight loss, anorexia, rectal bleeding, age > 50 — malignancy",
    ],
    exam:[
      "Peritoneal signs: guarding, rigidity, rebound tenderness",
      "Murphy sign RUQ: cholecystitis (inspire and press RUQ)",
      "Psoas sign and obturator sign: retrocecal appendicitis",
      "CVA tenderness: pyelonephritis",
      "Rectal exam: blood, mass, tenderness; pelvic exam if indicated",
    ],
    orders:[
      "CBC, BMP, lipase, LFTs, UA, beta-hCG",
      "CT abd/pelvis with IV contrast — non-contrast if nephrolithiasis screen",
      "US RUQ if Murphy positive or gallbladder/biliary concern",
      "CXR upright if perforation concern — free air under diaphragm",
      "Ondansetron 4 mg IV for nausea; ketorolac 15–30 mg IV for pain",
    ],
    redFlags:[
      "Hypotension + abd pain in > 50 male smoker — ruptured AAA until proven otherwise",
      "Positive beta-hCG + abdominal pain — ectopic pregnancy until US shows IUP",
      "Rigid abdomen — perforation or peritonitis — surgical consult immediately",
      "Pain out of proportion to exam — mesenteric ischemia, emergent workup",
      "Fever + RLQ rebound tenderness — appendicitis, surgical consult",
    ],
    dontMiss:["Ruptured AAA","Ectopic Pregnancy","Mesenteric Ischemia","Perforated Viscus","Ovarian Torsion"],
    pearl:"Analgesia does NOT mask physical findings or impair diagnostic accuracy in acute abdominal pain — multiple RCTs confirm this. Withholding pain relief is harmful and not evidence-based. Ketorolac is first-line for renal colic.",
  },
  {
    id:"gi_bleed", label:"GI Bleed", category:"gi", esi:2, icon:"🩸", color:T.red,
    tagline:"Two large-bore IVs and type & crossmatch — establish IV access before anything else",
    immediate:[
      "IV access x2 (18g minimum), NS bolus if hemodynamically unstable",
      "Type & crossmatch STAT, CBC, BMP, coags, LFTs",
      "NPO, continuous monitoring, Foley catheter",
      "Transfuse pRBC if Hgb < 7 (< 8 if known coronary disease)",
      "GI consult early — endoscopy timing depends on stability",
    ],
    history:[
      "Hematemesis (bright red vs coffee-ground) or melena vs hematochezia",
      "Prior GIB, peptic ulcers, varices, cirrhosis, portal hypertension",
      "NSAIDs, ASA, anticoagulants, steroids — current doses and duration",
      "EtOH quantity and chronicity",
      "Abdominal pain, weight loss, prior endoscopy — malignancy workup",
      "Pre-syncope or syncope — indicates significant volume loss",
    ],
    exam:[
      "Hemodynamic assessment — orthostatics if stable enough",
      "Stigmata of liver disease: jaundice, spider angiomata, caput medusae, palmar erythema",
      "Abdominal tenderness, hepatosplenomegaly",
      "Rectal exam: hematochezia, melena, or mass",
      "NG lavage if upper GIB suspected — helps localize source",
    ],
    orders:[
      "CBC, BMP, coags (INR), LFTs; BUN:Cr ratio > 20 suggests upper GI source",
      "Type & crossmatch — 2–4 units pRBC on hold",
      "Octreotide 50 mcg IV bolus + 50 mcg/h infusion if variceal bleed likely",
      "Pantoprazole 80 mg IV bolus + 8 mg/h infusion if upper GIB suspected",
      "Reverse anticoagulation: Vit K, FFP, PCC, andexanet per agent",
    ],
    redFlags:[
      "Hemodynamic instability — resuscitate and GI plus surgery consult immediately",
      "Bright red blood per rectum + hypotension — massive upper or severe lower GIB",
      "Variceal bleed — add ceftriaxone 1g IV for SBP prophylaxis",
      "INR > 1.5 — correct coagulopathy before endoscopy if possible",
      "Hgb drop > 2g without obvious source — occult internal hemorrhage",
    ],
    dontMiss:["Ruptured Esophageal Varices","Aortoenteric Fistula","Dieulafoy Lesion","Meckel Diverticulum","Mesenteric Ischemia"],
    pearl:"BUN:Cr ratio > 36 is 90% specific for upper GI source (digested blood + prerenal effect). Erythromycin 250 mg IV 30–90 min before endoscopy improves gastric visualization by accelerating gastric emptying.",
  },
  {
    id:"headache", label:"Headache", category:"neuro", esi:3, icon:"🤕", color:T.purple,
    tagline:"Thunderclap headache equals subarachnoid hemorrhage until LP proves otherwise",
    immediate:[
      "Vital signs including temperature and BP",
      "Analgesia: ketorolac 30 mg IV + ondansetron 4 mg IV",
      "Assess for AMS, focal deficit, meningismus, papilledema",
      "Darkened quiet room, reduce stimuli",
      "12-lead ECG — SAH causes diffuse ST changes and QT prolongation",
    ],
    history:[
      "Onset: thunderclap (peak < 1 minute) — SAH until LP negative",
      "Worst headache of life — always take seriously, even in known migraine patients",
      "Fever, neck stiffness, photophobia, phonophobia",
      "Visual changes, diplopia, facial numbness, arm weakness",
      "Prior migraines — is this different in quality, severity, or onset?",
      "Valsalva-triggered: cough, exertion, straining — elevated ICP",
    ],
    exam:[
      "Meningismus: passive neck flexion ROM, Kernig, Brudzinski signs",
      "Fundoscopy: papilledema — elevated ICP, defer LP until CT",
      "Focal CN exam: CN III palsy (posterior communicating artery aneurysm)",
      "BP — hypertensive encephalopathy if severely elevated",
      "Temporal artery tenderness in > 50 yo — giant cell arteritis",
    ],
    orders:[
      "CT head w/o contrast — first-line for acute severe headache",
      "LP if CT negative + thunderclap onset — xanthochromia, opening pressure, cell count",
      "BMP, CBC if systemic symptoms or first severe headache",
      "ESR, CRP, temporal artery biopsy if GCA concern (> 50 yo, jaw claudication)",
      "Sumatriptan 6 mg SQ after SAH excluded; prednisone if GCA suspected",
    ],
    redFlags:[
      "Thunderclap onset — SAH until LP negative for xanthochromia",
      "Fever + headache + meningismus — bacterial meningitis, LP and ABX immediately",
      "Focal deficit with headache — CT before LP (herniation risk)",
      "Papilledema — elevated ICP, defer LP, urgent neurosurgery",
      "Immunocompromised — cryptococcal meningitis, CNS lymphoma",
    ],
    dontMiss:["Subarachnoid Hemorrhage","Bacterial Meningitis","Cerebral Venous Sinus Thrombosis","Hypertensive Emergency","Giant Cell Arteritis"],
    pearl:"Ottawa SAH Rule: LP may not be required if CT performed within 6h of symptom onset by experienced radiologist and is negative. Most guidelines still recommend LP if any clinical suspicion persists — xanthochromia takes 2–4 hours to develop.",
  },
  {
    id:"back_pain", label:"Back Pain", category:"msk", esi:4, icon:"🦴", color:T.cyan,
    tagline:"Screen for cauda equina and AAA first — then treat the muscle",
    immediate:[
      "Vital signs — hypotension in > 50 male = AAA protocol immediately",
      "Rapid neuro screen: lower extremity strength and sensation",
      "Bladder function: last void, difficulty voiding, retention symptoms",
      "Analgesia: NSAIDs + methocarbamol 750 mg PO or cyclobenzaprine 10 mg PO",
      "POCUS or US aorta if vascular risk factors or pulsatile mass",
    ],
    history:[
      "Mechanism: lifting (muscular), MVA (fracture), insidious (malignancy/infection)",
      "Radiation: unilateral leg (sciatica), bilateral legs or perineum (cauda equina)",
      "Saddle anesthesia, bowel or bladder incontinence or retention — cauda equina",
      "Fever, night sweats, unexplained weight loss — infection or malignancy",
      "IV drug use, recent spinal procedure — epidural abscess",
      "Age > 50, prior malignancy, steroids > 1 month — higher risk features",
    ],
    exam:[
      "Straight-leg raise — positive < 70 degrees reproduces radicular pain",
      "Crossed SLR — high specificity for disc herniation",
      "Lower extremity strength: L4 (knee extension), L5 (great toe dorsiflexion), S1 (plantarflexion)",
      "Dermatomal sensation testing L4 through S1",
      "Perianal sensation and rectal tone — cauda equina screen",
    ],
    orders:[
      "MRI lumbar spine if cauda equina concern — emergent, do not delay",
      "XR lumbar if significant trauma, age > 50, or cancer history",
      "CT or POCUS abdomen if AAA concern (pulsatile abdominal mass, vascular risk factors)",
      "BMP, CBC, ESR/CRP if infection or malignancy suspected",
      "Foley and post-void residual if urinary retention present",
    ],
    redFlags:[
      "Saddle anesthesia — cauda equina emergency, MRI now, surgery within 24–48h",
      "Bowel or bladder incontinence or retention — cauda equina syndrome",
      "Pulsatile abdominal mass + back pain — ruptured AAA",
      "Fever + back pain + IV drug use — epidural abscess, MRI emergently",
      "Bilateral lower extremity weakness — spinal cord compression",
    ],
    dontMiss:["Cauda Equina Syndrome","Ruptured or Expanding AAA","Epidural Abscess","Vertebral Osteomyelitis","Malignant Cord Compression"],
    pearl:"Cauda equina syndrome is a surgical emergency — decompression delayed beyond 48h causes permanent bowel, bladder, and motor deficits. MRI first, then immediate neurosurgical consult. Do not wait for symptom progression.",
  },
  {
    id:"trauma", label:"Trauma / MVC", category:"trauma", esi:1, icon:"🚨", color:T.red,
    tagline:"Primary survey ABCDE — identify and treat life threats in order, every time",
    immediate:[
      "Activate trauma team per institutional protocol",
      "C-spine immobilization until radiographically cleared",
      "Primary survey: Airway — Breathing — Circulation — Disability — Exposure",
      "FAST exam: pericardial, hepatorenal, splenorenal, pelvic windows",
      "IV access x2 large bore, type & crossmatch, MTP if massive hemorrhage",
    ],
    history:[
      "Mechanism: speed, restraint use, airbag deployment, ejection from vehicle",
      "LOC: duration and quality of recovery",
      "GCS at scene vs on arrival — trend predicts trajectory",
      "Complaint location: chest, abdomen, pelvis, spine, extremities",
      "Medical hx, anticoagulants — warfarin and DOACs increase hemorrhage risk",
      "Tetanus status and last immunization date",
    ],
    exam:[
      "Head: scalp lac, Battle sign (mastoid), raccoon eyes (basilar skull Fx), hemotympanum",
      "Neck: tracheal deviation, JVD, C-spine midline tenderness",
      "Chest: paradoxical motion, crepitus, bilateral breath sounds, rib tenderness",
      "Abdomen: FAST findings, tenderness, pelvic stability (compress once only)",
      "Extremities: deformity, neurovascular exam distal to each injury",
    ],
    orders:[
      "Trauma series: FAST + portable CXR + AP pelvis XR",
      "CBC, BMP, coags, type & cross, lactate, EtOH, tox screen",
      "CT pan-scan per mechanism: head, C-spine, chest, abd/pelvis with IV contrast",
      "MTP 1:1:1 ratio (pRBC:FFP:Platelets) for massive hemorrhage",
      "TXA 1g IV over 10 min if < 3h from injury onset with hemorrhagic shock",
    ],
    redFlags:[
      "Penetrating torso trauma — immediate surgical evaluation, do not delay for workup",
      "Hemodynamic instability — damage control resuscitation, OR over CT scanner",
      "Pelvic fracture — apply pelvic binder immediately, do not compress pelvis repeatedly",
      "Absent unilateral breath sounds — tension PTX, needle decompress 2nd ICS MCL",
      "Open fractures — IV cefazolin 2g within 1 hour of injury",
    ],
    dontMiss:["Tension PTX","Cardiac Tamponade","Traumatic Aortic Injury","Solid Organ Laceration","Pelvic Ring Fracture with Hemorrhage"],
    pearl:"The lethal triad — hypothermia, acidosis, coagulopathy — drives trauma mortality. Damage control resuscitation (1:1:1) and permissive hypotension (SBP 80–90) in penetrating trauma reduce re-bleeding before surgical hemorrhage control.",
  },
  {
    id:"overdose", label:"Overdose / Toxicology", category:"tox", esi:2, icon:"💊", color:T.yellow,
    tagline:"Identify the toxidrome first — the syndrome drives the antidote and treatment",
    immediate:[
      "IV access, O2, continuous monitor, POC glucose STAT",
      "Naloxone 0.4–2 mg IV/IM/IN if opioid toxidrome (miosis + bradypnea + AMS)",
      "Thiamine 100 mg IV if EtOH history or malnutrition",
      "Activated charcoal 1 g/kg PO if alert, airway protected, < 1h from ingestion",
      "Poison Control: 1-800-222-1222 — call for all significant exposures",
    ],
    history:[
      "What was ingested, how much, what time, by what route",
      "Suicidal intent vs accidental vs recreational — affects safe disposition",
      "Access to other medications — APAP present in hundreds of OTC products",
      "Prior overdoses, psychiatric history, substance use disorder",
      "Onset and progression — improving or deteriorating since ingestion",
      "Co-ingestion with EtOH is extremely common and alters clinical picture",
    ],
    exam:[
      "Toxidrome ID: opioid (miosis, bradypnea) vs anticholinergic (mydriasis, dry, hyperthermic) vs cholinergic (SLUDGE: Salivation, Lacrimation, Urination, Defecation, GI distress, Emesis) vs sympathomimetic (mydriasis, diaphoresis, tachycardia)",
      "Pupils: miosis (opioid, organophosphate) vs mydriasis",
      "Skin: diaphoresis (cholinergic) vs dry and flushed (anticholinergic)",
      "Temperature: hyperthermia in serotonin syndrome, NMS, stimulants",
      "Muscle tone: clonus and hyperreflexia indicate serotonin syndrome",
    ],
    orders:[
      "APAP level in ALL overdoses regardless of stated ingestion — critical",
      "Serum EtOH, ASA level, lithium if applicable",
      "BMP: anion gap (toxic alcohols, salicylates); osmol gap (toxic alcohols)",
      "ECG: QRS > 120 ms (TCA — give sodium bicarb); QTc > 500 ms (mag 2g IV)",
      "NAC if APAP above Rumack-Matthew nomogram — most effective within 8–10h",
    ],
    redFlags:[
      "QRS > 120 ms — TCA toxicity, sodium bicarb 1–2 mEq/kg IV bolus",
      "QTc > 500 ms — torsades risk, magnesium 2g IV over 10 min",
      "Serotonin syndrome: AMS + clonus/hyperreflexia + hyperthermia — cyproheptadine",
      "Temperature > 106F — ice packs, benzos, paralytics if refractory",
      "Elevated anion gap acidosis — toxic alcohol, fomepizole + consider dialysis",
    ],
    dontMiss:["Acetaminophen Toxicity (asymptomatic early)","Tricyclic Antidepressant Toxicity","Serotonin Syndrome","Methanol or Ethylene Glycol","Carbon Monoxide Poisoning"],
    pearl:"APAP toxicity is completely asymptomatic in the first 24h — check a level in EVERY overdose, every time. In TCA toxicity, sodium bicarb is both diagnostic (QRS narrows) and therapeutic. Target serum pH 7.45–7.55.",
  },
  {
    id:"anaphylaxis", label:"Anaphylaxis", category:"allergy", esi:1, icon:"⚠️", color:T.orange,
    tagline:"Epinephrine first — always — there are no absolute contraindications in true anaphylaxis",
    immediate:[
      "Epinephrine 0.3 mg IM (1:1000) anterolateral thigh — do not delay for IV access",
      "Supine with legs elevated unless respiratory distress",
      "O2 15 L/min via NRB, assess upper airway patency immediately",
      "IV access, continuous monitor, BP every 5 minutes",
      "Second IM epinephrine in 5–15 min if no improvement — do not hesitate",
    ],
    history:[
      "Trigger: food (peanut, shellfish), medication (NSAIDs, ABX, contrast), insect sting, latex",
      "Prior anaphylaxis — severity, treatment needed, outcome",
      "Time from exposure to symptom onset — shorter interval = more severe",
      "Organs involved: skin, respiratory, GI, cardiovascular",
      "Beta-blocker use — impairs epinephrine response, may need glucagon",
      "Epi-pen prescribed? Was it used before arrival?",
    ],
    exam:[
      "Skin: urticaria, angioedema, flushing — absent in up to 20% of cases",
      "Upper airway: stridor, hoarseness, uvular or tongue swelling",
      "Lower airway: wheeze, work of breathing, silent chest",
      "Hemodynamics: distributive shock pattern (warm, vasodilated, tachycardic)",
      "GI: abdominal cramping, vomiting, diarrhea — supports the diagnosis",
    ],
    orders:[
      "Epinephrine 0.3 mg IM q5–15 min prn — adjuncts come second",
      "Diphenhydramine 50 mg IV — adjunct, does NOT replace epinephrine",
      "Methylprednisolone 125 mg IV — adjunct, prevents biphasic reaction",
      "NS 1–2L IV bolus if hypotensive after epinephrine",
      "Observation minimum 4–6h after last epinephrine — biphasic reaction risk",
    ],
    redFlags:[
      "No response to x2 IM epinephrine — refractory anaphylaxis, epinephrine drip",
      "Stridor or progressive angioedema — prepare surgical airway now",
      "Beta-blocker patient, refractory hypotension — glucagon 1–5 mg IV",
      "Biphasic reaction occurs 4–12h after initial recovery — observe at least 6h",
      "Vasodepressor anaphylaxis: no skin findings, sudden cardiovascular collapse",
    ],
    dontMiss:["Refractory Anaphylactic Shock","ACEi-Induced Angioedema","Airway Compromise from Angioedema","Biphasic Anaphylaxis","Vasovagal vs True Anaphylaxis"],
    pearl:"ACEi-induced angioedema is bradykinin-mediated (NOT IgE-mediated) — epinephrine, antihistamines, and steroids are less effective. Consider icatibant 30 mg SQ (bradykinin B2 antagonist) or FFP as antidote.",
  },
  {
    id:"peds_fever", label:"Pediatric Fever", category:"peds", esi:2, icon:"👶", color:T.green,
    tagline:"Age is the most critical variable — neonates have no immune reserve and can deteriorate suddenly",
    immediate:[
      "Rectal temp preferred < 2 yo (axillary only for screening)",
      "Pediatric Assessment Triangle: Appearance (tone, gaze, consolability), Work of Breathing, Circulation to skin",
      "IV access if ill-appearing, sepsis concern, or fever < 28 days old",
      "Antipyretics: APAP 15 mg/kg PO/PR OR ibuprofen 10 mg/kg (> 6 months only)",
      "Blood cultures x2 + IV antibiotics < 60 min if toxic-appearing at any age",
    ],
    history:[
      "Age — most critical risk stratifier for workup intensity and admission decision",
      "Immunization history: Hib, PCV13, MCV4 — reduces occult bacteremia risk",
      "Duration, URI symptoms, GI symptoms, rash, behavior change",
      "Feeding, wet diapers in last 12h, last void",
      "Sick contacts, daycare, recent travel",
      "Immunocompromised: steroids, sickle cell, asplenia, malignancy",
    ],
    exam:[
      "Fontanelle: bulging (elevated ICP, meningitis) vs sunken (dehydration)",
      "Meningismus — unreliable under 18 months, still assess",
      "Rash: petechiae or purpura = meningococcemia until proven otherwise",
      "Source identification: ears, throat, lungs, abdomen, skin, joints, bones",
      "Hydration: mucous membranes, skin turgor, capillary refill, sunken eyes",
    ],
    orders:[
      "< 28 days: CBC, BC x2, UA/UC, LP CSF, CXR, ceftriaxone + ampicillin + acyclovir",
      "29–90 days: risk-stratify per Rochester or Step-by-Step criteria; LP often indicated",
      "91 days to 3 yr: source-directed; UA most common source; CBC + CRP assist risk strat",
      "Procalcitonin and CRP help risk-stratify febrile infants without identifiable source",
      "Viral testing (RSV, flu, COVID) may reduce unnecessary antibiotic use",
    ],
    redFlags:[
      "Any fever < 28 days — full sepsis workup + admission, no exceptions",
      "Petechiae or purpura with fever — meningococcemia, ceftriaxone immediately",
      "Toxic appearance at any age — immediate resuscitation and empiric antibiotics",
      "Bulging fontanelle — elevated ICP, do NOT perform LP until imaging done",
      "Fever > 5 days — Kawasaki disease workup (echo, CBC, ESR, CRP, echo)",
    ],
    dontMiss:["Bacterial Meningitis","Meningococcemia","Occult Bacteremia in Young Infants","UTI (most common source < 2 yo)","Kawasaki Disease"],
    pearl:"Fever < 28 days = admit, full workup, empiric antibiotics — no exceptions regardless of well appearance. Kawasaki disease is the leading cause of acquired pediatric heart disease in the US; suspect if fever > 5 days plus any classic criterion.",
  },
];

// ── Module-scope Primitives ───────────────────────────────────────────
function AmbientBg() {
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}>
      <div style={{position:"absolute",top:"-15%",left:"-10%",width:"55%",height:"55%",background:"radial-gradient(circle,rgba(255,107,107,0.09) 0%,transparent 70%)"}}/>
      <div style={{position:"absolute",bottom:"-10%",right:"-5%",width:"50%",height:"50%",background:"radial-gradient(circle,rgba(59,158,255,0.07) 0%,transparent 70%)"}}/>
      <div style={{position:"absolute",top:"45%",right:"25%",width:"35%",height:"35%",background:"radial-gradient(circle,rgba(155,109,255,0.06) 0%,transparent 70%)"}}/>
    </div>
  );
}

function ESIBadge({ level }) {
  const e = ESI_META[level] || ESI_META[3];
  return (
    <div style={{display:"flex",alignItems:"center",gap:6}}>
      <div style={{width:26,height:26,borderRadius:6,background:e.color,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 10px ${e.color}55`}}>
        <span style={{fontFamily:"JetBrains Mono",fontSize:12,fontWeight:700,color:e.tc}}>{level}</span>
      </div>
      <div>
        <div style={{fontFamily:"JetBrains Mono",fontSize:9,fontWeight:700,color:e.color,lineHeight:1}}>ESI {level}</div>
        <div style={{fontFamily:"DM Sans",fontSize:9,color:T.txt4,lineHeight:1,marginTop:2}}>{e.label}</div>
      </div>
    </div>
  );
}

function CatChip({ cat, active, onClick }) {
  return (
    <button onClick={onClick} style={{fontFamily:"DM Sans",fontWeight:600,fontSize:10,padding:"4px 10px",borderRadius:20,border:`1px solid ${active ? cat.color : "rgba(42,79,122,0.4)"}`,background:active ? `${cat.color}22` : "transparent",color:active ? cat.color : T.txt4,cursor:"pointer",whiteSpace:"nowrap",transition:"all .12s",flexShrink:0}}>
      {cat.label}
    </button>
  );
}

function ComplaintRow({ complaint, active, onClick }) {
  const e = ESI_META[complaint.esi];
  return (
    <div className="cc-row" onClick={onClick} style={{display:"flex",alignItems:"center",gap:9,padding:"8px 11px",borderRadius:10,background:active ? `${complaint.color}18` : "transparent",border:`1px solid ${active ? complaint.color+"44" : "transparent"}`,cursor:"pointer"}}>
      <span style={{fontSize:17,flexShrink:0}}>{complaint.icon}</span>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontFamily:"DM Sans",fontWeight:600,fontSize:12,color:active ? complaint.color : T.txt,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{complaint.label}</div>
        <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:.5}}>{complaint.category}</div>
      </div>
      <div style={{width:20,height:20,borderRadius:5,background:e?.color || T.txt4,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <span style={{fontFamily:"JetBrains Mono",fontSize:10,fontWeight:700,color:e?.tc || "#fff"}}>{complaint.esi}</span>
      </div>
    </div>
  );
}

function PhaseCard({ meta, items }) {
  return (
    <div className="phase-card" style={{...glass,padding:"15px 17px",borderLeft:`3px solid ${meta.color}`,background:`linear-gradient(135deg,${meta.color}10,rgba(8,22,40,0.8))`}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:11}}>
        <span style={{fontSize:15}}>{meta.icon}</span>
        <div style={{flex:1}}>
          <div style={{fontFamily:"DM Sans",fontWeight:700,fontSize:12,color:meta.color}}>{meta.label}</div>
          <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4}}>{meta.time}</div>
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:5}}>
        {(items||[]).map((item,i) => (
          <div key={i} style={{display:"flex",gap:7,alignItems:"flex-start"}}>
            <span style={{color:meta.color,fontSize:9,marginTop:3,flexShrink:0}}>▸</span>
            <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.5}}>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RedFlagRow({ text }) {
  return (
    <div style={{display:"flex",gap:8,alignItems:"flex-start",padding:"7px 10px",background:"rgba(255,68,68,0.07)",border:"1px solid rgba(255,68,68,0.18)",borderRadius:8,marginBottom:5}}>
      <span style={{color:T.red,fontSize:10,marginTop:2,flexShrink:0}}>⚠</span>
      <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.4}}>{text}</span>
    </div>
  );
}

function DDxPill({ label, color }) {
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"4px 11px",borderRadius:20,background:`${color}18`,border:`1px solid ${color}40`,margin:"0 5px 5px 0"}}>
      <span style={{width:5,height:5,borderRadius:"50%",background:color,flexShrink:0,display:"inline-block"}}/>
      <span style={{fontFamily:"DM Sans",fontSize:11,fontWeight:600,color:color}}>{label}</span>
    </span>
  );
}

// ── Main Component ────────────────────────────────────────────────────
export default function RapidAssessmentHub() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(COMPLAINTS[0].id);
  const [catFilter, setCatFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() =>
    COMPLAINTS.filter(c =>
      (catFilter === "all" || c.category === catFilter) &&
      c.label.toLowerCase().includes(search.toLowerCase())
    ), [catFilter, search]);

  const current = COMPLAINTS.find(c => c.id === selected) || COMPLAINTS[0];

  return (
    <div style={{fontFamily:"DM Sans",background:T.bg,minHeight:"100vh",position:"relative",overflow:"hidden"}}>
      <AmbientBg />
      <div style={{position:"relative",zIndex:1,maxWidth:1440,margin:"0 auto",padding:"0 16px",display:"flex",flexDirection:"column",height:"100vh"}}>

        {/* Header */}
        <div style={{padding:"16px 0 12px",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <button onClick={()=>navigate("/hub")} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:8,background:"rgba(14,37,68,0.8)",border:"1px solid rgba(42,79,122,0.5)",color:"#8aaccc",fontFamily:"DM Sans",fontSize:11,fontWeight:600,cursor:"pointer",flexShrink:0,transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(59,158,255,0.5)";e.currentTarget.style.color="#e8f0fe";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(42,79,122,0.5)";e.currentTarget.style.color="#8aaccc";}}>← Hub</button>
            <div style={{backdropFilter:"blur(40px)",WebkitBackdropFilter:"blur(40px)",background:"rgba(5,15,30,0.85)",border:"1px solid rgba(26,53,85,0.6)",borderRadius:10,padding:"5px 12px",display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.teal,letterSpacing:3}}>NOTRYA</span>
              <span style={{color:T.txt4,fontFamily:"JetBrains Mono",fontSize:10}}>/</span>
              <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.txt3,letterSpacing:2}}>RAPID ASSESS</span>
            </div>
            <div style={{height:1,flex:1,background:"linear-gradient(90deg,rgba(42,79,122,0.6),transparent)"}}/>
            <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,letterSpacing:1}}>10-MIN TEMPLATES</span>
          </div>
          <h1 className="shimmer-text" style={{fontFamily:"Playfair Display",fontSize:"clamp(22px,3.5vw,38px)",fontWeight:900,letterSpacing:-1,lineHeight:1.1}}>
            Rapid Assessment Hub
          </h1>
          <p style={{fontFamily:"DM Sans",fontSize:12,color:T.txt3,marginTop:3}}>
            10-minute workup templates · {COMPLAINTS.length} chief complaints · Immediate actions through initial orders
          </p>
        </div>

        {/* Body */}
        <div style={{display:"flex",gap:14,flex:1,overflow:"hidden",paddingBottom:14}}>

          {/* Left Pane */}
          <div style={{width:248,flexShrink:0,display:"flex",flexDirection:"column",gap:8,overflow:"hidden"}}>
            <input
              type="text" value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search complaints..."
              style={{width:"100%",background:"rgba(14,37,68,0.8)",border:"1px solid rgba(42,79,122,0.4)",borderRadius:10,padding:"8px 13px",color:T.txt,fontFamily:"DM Sans",fontSize:13,outline:"none",flexShrink:0,transition:"border-color .15s"}}
              onFocus={e=>e.target.style.borderColor="rgba(59,158,255,0.5)"}
              onBlur={e=>e.target.style.borderColor="rgba(42,79,122,0.4)"}
            />
            <div style={{display:"flex",gap:4,overflowX:"auto",flexShrink:0,paddingBottom:2}}>
              {CATEGORIES.map(cat=>(
                <CatChip key={cat.id} cat={cat} active={catFilter===cat.id}
                  onClick={()=>setCatFilter(cat.id)}/>
              ))}
            </div>
            <div style={{overflowY:"auto",flex:1,display:"flex",flexDirection:"column",gap:2}}>
              {filtered.length === 0 && (
                <div style={{textAlign:"center",padding:20,fontFamily:"DM Sans",fontSize:12,color:T.txt4}}>No matches</div>
              )}
              {filtered.map(c=>(
                <ComplaintRow key={c.id} complaint={c} active={selected===c.id}
                  onClick={()=>setSelected(c.id)}/>
              ))}
            </div>
            <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,textAlign:"center",flexShrink:0}}>
              {filtered.length}/{COMPLAINTS.length} protocols
            </div>
          </div>

          {/* Right Pane */}
          <div className="fade-in" key={current.id} style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:10}}>

            {/* Complaint Header */}
            <div style={{...glass,padding:"18px 22px",borderLeft:`4px solid ${current.color}`,background:`linear-gradient(135deg,${current.color}14,rgba(8,22,40,0.9))`}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:14,flexWrap:"wrap"}}>
                <span style={{fontSize:38,lineHeight:1,flexShrink:0}}>{current.icon}</span>
                <div style={{flex:1,minWidth:180}}>
                  <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap",marginBottom:6}}>
                    <h2 style={{fontFamily:"Playfair Display",fontSize:"clamp(18px,2.5vw,26px)",fontWeight:700,color:T.txt,lineHeight:1}}>
                      {current.label}
                    </h2>
                    <ESIBadge level={current.esi}/>
                    <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:current.color,background:`${current.color}18`,border:`1px solid ${current.color}44`,padding:"3px 9px",borderRadius:4,textTransform:"uppercase",letterSpacing:1}}>
                      {current.category}
                    </span>
                  </div>
                  <p style={{fontFamily:"DM Sans",fontSize:13,color:T.txt2,fontStyle:"italic",lineHeight:1.5}}>
                    {current.tagline}
                  </p>
                </div>
                <div style={{...glass,padding:"10px 14px",borderRadius:12,background:"rgba(8,22,40,0.6)",textAlign:"center",flexShrink:0}}>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:22,fontWeight:700,color:current.color,lineHeight:1}}>10</div>
                  <div style={{fontFamily:"DM Sans",fontSize:9,color:T.txt4,marginTop:2}}>min goal</div>
                </div>
              </div>
            </div>

            {/* Phase Cards 2x2 */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {PHASE_META.map((meta,i)=>(
                <PhaseCard key={i} meta={meta} items={current[meta.key]}/>
              ))}
            </div>

            {/* Don't Miss */}
            <div style={{...glass,padding:"14px 18px"}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.txt4,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>
                🚫 Do Not Miss Diagnoses
              </div>
              <div style={{display:"flex",flexWrap:"wrap"}}>
                {(current.dontMiss||[]).map((d,i)=>(
                  <DDxPill key={i} label={d} color={current.color}/>
                ))}
              </div>
            </div>

            {/* Red Flags */}
            <div style={{...glass,padding:"14px 18px"}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.red,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>
                🚨 Red Flags — Escalation Triggers
              </div>
              {(current.redFlags||[]).map((f,i)=><RedFlagRow key={i} text={f}/>)}
            </div>

            {/* Pearl */}
            <div style={{padding:"14px 18px",background:`linear-gradient(135deg,${current.color}12,rgba(8,22,40,0.8))`,border:`1px solid ${current.color}30`,borderRadius:14}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:10,color:current.color,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8}}>
                💎 Clinical Pearl
              </div>
              <p style={{fontFamily:"DM Sans",fontSize:13,color:T.txt2,lineHeight:1.7,fontStyle:"italic"}}>
                {current.pearl}
              </p>
            </div>

            {/* Footer */}
            <div style={{textAlign:"center",paddingBottom:6}}>
              <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,letterSpacing:1.5}}>
                NOTRYA RAPID ASSESSMENT HUB · TEMPLATES ARE CLINICAL STARTING POINTS — INDIVIDUALIZE PER PATIENT
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}