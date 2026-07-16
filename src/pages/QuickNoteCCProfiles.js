// QuickNoteCCProfiles.js  v15.1
// Pure JavaScript data module — no React, no imports, no side effects
// Exports: CC_PROFILES, getCCProfile, getCCList
//
// v15.1 ROS template updates — evidence-based per:
//   - AMA/CMS 2023 E&M Documentation Guidelines
//   - ACEP Clinical Policy and MDM FAQ (CNAC 2023)
//   - ACEP HPI-ROS FAQ (pertinent positives/negatives documentation standard)
//   - WikEM ROS Documentation Standard
//   - Medico-legal documentation best practices (CMPA 2016-2020)
//
// ROS documentation rules applied to all profiles:
//   1. Chief complaint is ALWAYS (+) in its system — never omitted, never +/-
//   2. Pertinent negatives explicitly address each must-not-miss diagnosis
//   3. Baseline status documented where clinically relevant (AMS, prior episodes)
//   4. Mandatory items flagged: pregnancy status, glucose, baseline mental status,
//      travel history, immunocompromised status, plan/means/intent (SI)
//   5. Inline clinical rationale comments explain WHY each negative matters
//   6. "All other systems reviewed and negative" closes each ROS

export const CC_PROFILES = {

  chest_pain: {
    id: "chest_pain",
    label: "Chest Pain",
    icon: "🫀",
    color: "#ff6b6b",
    category: "Cardiovascular",
    must_not_miss: [
      "STEMI / ACS",
      "Aortic Dissection",
      "Pulmonary Embolism",
      "Tension Pneumothorax",
      "Cardiac Tamponade",
      "Esophageal Rupture",
    ],
    ros_sections: ["Constitutional","Cardiovascular","Pulmonary","GI","Musculoskeletal","Neurological"],
    ros_template: `Constitutional: Admits chest pain onset [TIME] ago, Admits/Denies diaphoresis, Denies fever, Denies chills, Admits/Denies generalized weakness
Cardiovascular: Admits chest pain as chief complaint, Admits/Denies palpitations, Denies syncope or near-syncope, Denies prior similar episodes, Denies orthopnea, Denies paroxysmal nocturnal dyspnea, Denies lower extremity edema
Pulmonary: Denies dyspnea at rest, Denies pleuritic component [documents against PE and PTX], Denies hemoptysis, Denies cough
GI: Admits/Denies nausea, Admits/Denies vomiting, Denies heartburn or reflux, Denies dysphagia [documents against esophageal rupture], Denies abdominal pain
Musculoskeletal: Denies reproducible with palpation, Denies pain with movement or position change, Denies recent chest wall trauma
Neurological: Denies headache, Denies focal weakness or numbness, Denies loss of consciousness
All other systems reviewed and negative.`,
    pe_sections: ["General","Vital Signs","Cardiovascular","Pulmonary","Abdomen","Extremities"],
    pe_template: `General: Alert and oriented x3, [DISTRESS LEVEL — no acute/mild/moderate/severe distress], [DIAPHORESIS — diaphoretic/no diaphoresis]
Vital Signs: HR [RATE] [regular/irregular], BP [VALUE] right arm [if dissection suspected: also left arm], RR [RATE], SpO2 [VALUE]% on [room air/O2], T [VALUE]
Cardiovascular: [RATE AND RHYTHM — regular rate and rhythm / irregular], no murmurs [or DESCRIBE], no rubs, no gallops, JVD [absent/present], PMI [non-displaced/displaced]
Pulmonary: Clear to auscultation bilaterally [or DESCRIBE], no accessory muscle use [or DESCRIBE], trachea midline [or DESCRIBE deviation]
Abdomen: Soft, non-tender, non-distended, no epigastric tenderness [or DESCRIBE], no pulsatile mass
Extremities: No lower extremity edema [or DESCRIBE], no calf tenderness [or DESCRIBE], distal pulses intact bilaterally [or DESCRIBE], no cyanosis`,
    hpi_scaffold: `Onset: [sudden/gradual] onset [TIME] ago
Location: [substernal / left-sided / right-sided / diffuse / epigastric]
Quality: [pressure / sharp / burning / tearing / aching / heaviness]
Radiation: [to jaw / left arm / right arm / back / bilateral arms / no radiation]
Severity: [X/10] at onset, currently [X/10]
Timing: [constant / intermittent — frequency and duration]
Modifying factors: [worse with / better with — exertion, rest, inspiration, position, food, nitroglycerin]
Associated symptoms: [diaphoresis / dyspnea / nausea / vomiting / palpitations / syncope / none]
Cardiac history: [prior MI / PCI / CABG / heart failure / none]
Risk factors: [HTN / DM / hyperlipidemia / smoking / family history / obesity]`,
    risk_scores: ["HEART Score","TIMI Risk Score","GRACE Score","Wells PE Score"],
    key_diagnostics: ["12-Lead EKG","Troponin (serial)","BMP","CBC","CXR","D-Dimer if PE suspected"],
    acep_policy: "ACEP Clinical Policy: Evaluation and Management of Adult Patients Presenting to the ED with Acute Heart Failure",
    disposition_considerations: [
      "HEART Score 0-3 → Low risk, consider early discharge with outpatient follow-up",
      "HEART Score 4-6 → Intermediate risk, observation with serial troponins and stress test",
      "HEART Score 7-10 → High risk, early invasive strategy, cardiology consult",
      "STEMI or new LBBB → Immediate cath lab activation",
      "New EKG changes or rising troponin → Admit, cardiology consult",
      "Suspected aortic dissection → CT angiography chest, vascular surgery consult",
      "Wells PE ≥ 5 or PERC positive → CT pulmonary angiography",
    ],
  },

  shortness_of_breath: {
    id: "shortness_of_breath",
    label: "Shortness of Breath",
    icon: "🫁",
    color: "#3b9eff",
    category: "Respiratory",
    must_not_miss: [
      "Tension Pneumothorax",
      "Pulmonary Embolism",
      "STEMI with Pulmonary Edema",
      "Anaphylaxis",
      "Foreign Body Obstruction",
      "Epiglottitis",
    ],
    ros_sections: ["Constitutional","Pulmonary","Cardiovascular","Allergic / Immunologic","Neurological"],
    ros_template: `Constitutional: Admits dyspnea onset [TIME] ago, Admits/Denies fever [VALUE], Denies chills, Admits/Denies fatigue, Admits/Denies diaphoresis
Pulmonary: Admits shortness of breath as chief complaint, Admits/Denies wheezing, Denies stridor [documents against epiglottitis and upper airway obstruction], Admits/Denies productive cough [sputum color if present], Denies hemoptysis, Denies pleuritic chest pain [documents against PE and PTX]
Cardiovascular: Denies chest pain or pressure [documents against STEMI], Denies palpitations, Denies orthopnea, Denies paroxysmal nocturnal dyspnea, Denies lower extremity edema [documents against CHF]
Allergic / Immunologic: Denies new food, medication, or allergen exposure [documents against anaphylaxis], Denies rash or urticaria, Denies lip or tongue or throat swelling [documents against angioedema and anaphylaxis]
Neurological: Denies focal weakness, Denies confusion or altered mental status, Admits/Denies anxiety
All other systems reviewed and negative.`,
    pe_sections: ["General","Vital Signs","HEENT","Pulmonary","Cardiovascular","Extremities"],
    pe_template: `General: Alert and oriented x3, [DISTRESS — in no/mild/moderate/severe respiratory distress], [POSITION — sitting upright/tripod/supine], speaking in [full sentences/short phrases/single words]
Vital Signs: HR [RATE], BP [VALUE], RR [RATE — tachypneic/normal], SpO2 [VALUE]% on [room air / O2 at RATE L/min], T [VALUE]
HEENT: [STRIDOR — absent/present], no oropharyngeal swelling [or DESCRIBE], mucous membranes [moist/dry], no lip or tongue angioedema [or DESCRIBE], trachea midline
Pulmonary: [EFFORT — no accessory muscle use / accessory muscle use present], [BREATH SOUNDS — clear bilaterally / wheezing / rhonchi / rales / absent — LOCATION], [SYMMETRY — symmetric chest rise / asymmetric]
Cardiovascular: [RATE AND RHYTHM — regular rate and rhythm / irregular], no murmurs [or DESCRIBE], JVD [absent/present], S3 [absent/present]
Extremities: [EDEMA — no lower extremity edema / bilateral pitting edema GRADE], [CYANOSIS — absent/peripheral/central], capillary refill [< 2 seconds / DESCRIBE]`,
    hpi_scaffold: `Onset: [sudden/gradual] onset [TIME] ago
Severity: Able to [speak in full sentences / walk / lie flat] — SpO2 [VALUE]% at triage
Modifying factors: [worse with exertion / at rest / supine / improved with leaning forward]
Associated: [wheezing / cough / fever / chest pain / leg swelling / palpitations / rash]
Prior episodes: [prior asthma / COPD exacerbations / CHF / PE — YES/NO]
Triggers: [recent illness / allergen exposure / missed medications / recent travel / immobilization]
Medications: [inhalers / diuretics — compliance YES/NO]`,
    risk_scores: ["CURB-65 (pneumonia)","Wells PE Score","PERC Rule","BODE Index (COPD)"],
    key_diagnostics: ["CXR","12-Lead EKG","BMP","CBC","BNP or NT-proBNP","ABG or VBG","D-Dimer if PE suspected","Peak Flow (asthma/COPD)"],
    acep_policy: "ACEP Clinical Policy: Critical Issues in the Evaluation and Management of Adult Patients Presenting to the ED with Acute Heart Failure Syndromes",
    disposition_considerations: [
      "SpO2 < 92% on room air → Admit, supplemental O2, monitor",
      "Suspected PE → CT-PA, anticoagulation decision",
      "CHF exacerbation → BNP, diuresis, admit vs obs based on response",
      "Moderate-severe asthma → Bronchodilators, steroids, admit if FEV1 < 50% after treatment",
      "Anaphylaxis → Epinephrine, observe minimum 4-6 hours after resolution",
      "CURB-65 ≥ 2 → Admit for pneumonia",
    ],
  },

  abdominal_pain: {
    id: "abdominal_pain",
    label: "Abdominal Pain",
    icon: "🔴",
    color: "#f5c842",
    category: "GI",
    must_not_miss: [
      "Ruptured AAA",
      "Ectopic Pregnancy",
      "Bowel Perforation",
      "Mesenteric Ischemia",
      "Aortic Dissection (abdominal)",
      "Ovarian Torsion",
    ],
    ros_sections: ["Constitutional","GI","GU / Reproductive","Cardiovascular","Musculoskeletal"],
    ros_template: `Constitutional: Admits abdominal pain onset [TIME] ago, Admits/Denies fever [VALUE], Denies chills, Admits/Denies anorexia, Admits/Denies fatigue
GI: Admits abdominal pain as chief complaint, Admits/Denies nausea, Admits/Denies vomiting [FREQUENCY], Admits/Denies diarrhea [FREQUENCY and character], Admits/Denies constipation, last bowel movement [DATE — DOCUMENT], Denies blood in stool [documents against lower GI hemorrhage], Denies melena [documents against upper GI hemorrhage], Denies hematemesis, Admits/Denies prior similar episodes
GU / Reproductive: Admits/Denies dysuria, Admits/Denies hematuria, LMP [DATE — MANDATORY for all reproductive-age females], pregnancy test [positive/negative/unknown — MANDATORY], Admits/Denies vaginal discharge or bleeding [if present with abdominal pain: ectopic until proven otherwise], Admits/Denies pelvic pain, Admits/Denies flank pain
Cardiovascular: Denies known AAA or vascular disease [documents against AAA and mesenteric ischemia], Denies atrial fibrillation [documents against mesenteric ischemia], Denies pain out of proportion to exam [if present: mesenteric ischemia concern]
Musculoskeletal: Denies back pain radiating to groin [documents against renal colic and AAA]
All other systems reviewed and negative.`,
    pe_sections: ["General","Vital Signs","Abdomen","Pelvic (if indicated)","Rectal (if indicated)","Extremities"],
    pe_template: `General: Alert and oriented x3, [DISTRESS — no acute/mild/moderate/severe distress], [POSITION — lying still / writhing / guarding]
Vital Signs: HR [RATE], BP [VALUE], RR [RATE], SpO2 [VALUE]%, T [VALUE — fever/afebrile]
Abdomen: [DISTENSION — soft/distended], [TENDERNESS — tender in RUQ/RLQ/LUQ/LLQ/epigastric/diffuse — CHARACTER], [GUARDING — voluntary/involuntary/absent], [RIGIDITY — present/absent], [REBOUND — present/absent], [BOWEL SOUNDS — present/hypoactive/absent], [MURPHY'S — positive/negative if RUQ], [MCBURNEY'S — tender/non-tender if RLQ], no pulsatile mass [or DESCRIBE]
Pelvic (if indicated): [CMT — present/absent], [ADNEXAL TENDERNESS — present/absent — right/left/bilateral], [ADNEXAL MASS — palpated/not palpated]
Rectal (if indicated): [TENDERNESS — present/absent], [GROSS BLOOD — present/absent]
Extremities: No lower extremity edema, peripheral pulses present bilaterally [or DESCRIBE]`,
    hpi_scaffold: `Onset: [sudden/gradual] onset [TIME] ago
Location: [RUQ / RLQ / LUQ / LLQ / epigastric / periumbilical / diffuse / radiating to LOCATION]
Quality: [sharp / crampy / colicky / constant / dull / burning]
Severity: [X/10] at onset, currently [X/10]
Timing: [constant / intermittent — frequency and duration]
Modifying factors: [worse with / better with — eating, movement, position, bowel movements]
Associated: [nausea / vomiting / fever / diarrhea / constipation / blood in stool / dysuria / vaginal bleeding]
Reproductive (if applicable): LMP [DATE], pregnancy test [positive/negative/unknown]
Prior episodes: [similar prior episodes YES/NO, prior surgeries — APPENDECTOMY/CHOLECYSTECTOMY/OTHER]`,
    risk_scores: ["Alvarado Score (appendicitis)","STONE Score (ureteral stone)"],
    key_diagnostics: ["BMP","CBC with differential","Lipase","LFTs","UA with reflex culture","Urine or serum hCG","CXR (free air)","CT abdomen/pelvis with contrast"],
    acep_policy: "ACEP Clinical Policy: Critical Issues in the Initial Evaluation and Management of Patients Presenting to the ED in Early Pregnancy",
    disposition_considerations: [
      "Positive pregnancy test with abdominal pain → Ectopic until proven otherwise, OB/GYN consult, pelvic ultrasound",
      "Peritoneal signs → Surgical consult immediately",
      "Suspected AAA → Emergent vascular surgery, bedside ultrasound",
      "Alvarado Score ≥ 7 → High suspicion appendicitis, surgical consult",
      "Lipase > 3x normal → Pancreatitis, fluid resuscitation, assess severity",
      "Mesenteric ischemia suspected → CT angiography, emergent surgery consult",
    ],
  },

  headache: {
    id: "headache",
    label: "Headache",
    icon: "🧠",
    color: "#9b6dff",
    category: "Neuro",
    must_not_miss: [
      "Subarachnoid Hemorrhage",
      "Bacterial Meningitis",
      "Hypertensive Emergency",
      "Cerebral Venous Sinus Thrombosis",
      "Intracranial Mass / Herniation",
      "Carbon Monoxide Poisoning",
    ],
    ros_sections: ["Constitutional","Neurological","Head / Eyes / Ears / Nose / Throat","Cardiovascular","Psychiatric"],
    ros_template: `Constitutional: Admits/Denies fever [VALUE — if present: meningitis, encephalitis, sinusitis concern], Denies chills, Admits/Denies fatigue, Admits/Denies neck pain or stiffness [if present: meningitis until excluded]
Neurological: Admits headache as chief complaint — onset [sudden/gradual], duration [TIME], Admits/Denies worst headache of life [MUST DOCUMENT — if yes: SAH until proven otherwise], Denies thunderclap onset — sudden maximal intensity in seconds [MUST DOCUMENT — if absent: documents against SAH], Admits/Denies photophobia, Admits/Denies phonophobia, Admits/Denies nausea, Admits/Denies vomiting, Denies focal weakness or numbness [documents against stroke and intracranial mass], Denies speech difficulty, Denies confusion or altered mental status, Denies seizure, Denies loss of consciousness, Admits/Denies prior similar headaches or known migraines [DOCUMENT — exact similarity to prior migraines lowers suspicion for organic cause]
HEENT: Denies eye pain or redness [documents against acute glaucoma], Denies jaw claudication [if age > 50: documents against GCA], Denies scalp tenderness [if age > 50: documents against GCA], Denies sinus pain or pressure, Denies ear pain
Cardiovascular: blood pressure at triage [VALUE — MANDATORY: if > 180/120 with symptoms, hypertensive emergency], Admits/Denies known hypertension and medication compliance
Psychiatric: Admits/Denies recent significant stressor, Admits/Denies anxiety or depression
All other systems reviewed and negative.`,
    pe_sections: ["General","Vital Signs","Neurological","HEENT","Meningeal Signs"],
    pe_template: `General: Alert and oriented x3 [or DESCRIBE DEFICITS], [DISTRESS — no acute/mild/moderate/severe distress], [PHOTOPHOBIA — present/absent], [PHONOPHOBIA — present/absent]
Vital Signs: HR [RATE], BP [VALUE — note if hypertensive], RR [RATE], SpO2 [VALUE]%, T [VALUE — note if febrile]
Neurological: GCS [SCORE — E/V/M], cranial nerves II-XII [intact / DESCRIBE DEFICIT], motor strength [5/5 throughout / DESCRIBE DEFICIT], sensation [intact / DESCRIBE], cerebellar — finger-nose [intact / dysmetric], gait [steady / ataxic], pupils [equal round reactive / DESCRIBE]
HEENT: [PAPILLEDEMA — fundoscopy performed — papilledema present/absent / not performed], [TEMPORAL ARTERY — non-tender / tender and cord-like], [SINUS TENDERNESS — absent / present], no oropharyngeal erythema [or DESCRIBE]
Meningeal Signs: Nuchal rigidity [absent / present — degrees], Kernig sign [negative/positive], Brudzinski sign [negative/positive], Jolt accentuation [negative/positive]`,
    hpi_scaffold: `Onset: [sudden "thunderclap" / gradual] onset [TIME] ago
Location: [frontal / temporal / occipital / vertex / hemicranial / diffuse / periorbital]
Quality: [throbbing / pressure / stabbing / band-like / worst of life]
Severity: [X/10] — worst headache of life [YES/NO — MUST DOCUMENT]
Modifying factors: [worse with light/sound/movement/Valsalva / better with dark/quiet/sleep]
Associated: [nausea / vomiting / vision changes / neck stiffness / fever / focal neurological symptoms / rash]
Prior headache history: [migraines YES/NO, similar to prior migraines YES/NO, prior neuroimaging YES/NO]
Red flags: [first or worst headache / onset with exertion / progressive / age > 50 new onset / immunocompromised / anticoagulated]`,
    risk_scores: ["Ottawa Subarachnoid Hemorrhage Rule","Canadian CT Head Rule","NIHSS (if stroke suspected)"],
    key_diagnostics: ["Non-contrast CT Head","LP (if CT negative and SAH suspected)","BMP","CBC","CRP/ESR (if GCA suspected)","CO level (if CO poisoning suspected)"],
    acep_policy: "ACEP Clinical Policy: Critical Issues in the Evaluation and Management of Adult Patients Presenting to the ED with Acute Headache",
    disposition_considerations: [
      "Thunderclap headache → Non-contrast CT, if negative LP to evaluate for xanthochromia",
      "Ottawa SAH Rule positive → CT head mandatory",
      "Fever + headache + nuchal rigidity → Empiric antibiotics BEFORE LP if meningitis suspected",
      "Hypertensive emergency (BP > 180/120 + end organ damage) → IV antihypertensives, admit",
      "New focal neurological deficits → MRI brain, stroke protocol",
      "GCA suspected (age > 50, ESR elevated, temporal tenderness) → Steroids, ophthalmology",
    ],
  },

  syncope: {
    id: "syncope",
    label: "Syncope / Near-Syncope",
    icon: "⚡",
    color: "#f5c842",
    category: "Cardiovascular",
    must_not_miss: [
      "STEMI / Cardiac Arrhythmia",
      "Aortic Stenosis",
      "Pulmonary Embolism",
      "Hypertrophic Cardiomyopathy",
      "Aortic Dissection",
      "Subarachnoid Hemorrhage",
    ],
    ros_sections: ["Constitutional","Cardiovascular","Neurological","Pulmonary","GI / Autonomic"],
    ros_template: `Constitutional: Admits syncope or near-syncope episode [TIME] ago, Admits/Denies prodrome [palpitations/lightheadedness/diaphoresis/nausea/vision darkening — DOCUMENT ALL present], Denies prior similar episodes [or document number]
Cardiovascular: Admits/Denies palpitations immediately before event [arrhythmia concern], Denies chest pain before or after event [documents against STEMI], Admits/Denies exertional onset [MUST DOCUMENT — exertional syncope is high-risk for HCM and aortic stenosis], Admits/Denies known structural heart disease or prior cardiac history, Admits/Denies family history of sudden cardiac death under age 50 [MUST DOCUMENT — suggests channelopathy or HCM]
Neurological: duration of loss of consciousness [DOCUMENT seconds/minutes/unknown], Denies post-ictal confusion [documents against seizure], Denies tongue biting [documents against seizure], Denies incontinence [documents against seizure], Denies focal neurological symptoms, Denies headache after event [documents against SAH]
Pulmonary: Denies acute dyspnea, Denies pleuritic chest pain, Denies recent prolonged travel or immobilization [documents against PE]
GI / Autonomic: Admits/Denies prolonged standing before event, Admits/Denies warm environment or pain or fright as trigger, Admits/Denies nausea immediately before event, Admits/Denies recent dehydration or poor oral intake
All other systems reviewed and negative.`,
    pe_sections: ["General","Vital Signs (orthostatics)","Cardiovascular","Neurological","Skin"],
    pe_template: `General: Alert and oriented x3 [or DESCRIBE], [DISTRESS — no acute distress], [INJURIES — no apparent head or extremity injury / DESCRIBE any trauma]
Vital Signs: HR [RATE supine] → [RATE standing after 3 min], BP [VALUE supine] → [VALUE standing] — orthostatic [positive/negative — ≥20 mmHg SBP drop or symptoms], SpO2 [VALUE]%, T [VALUE]
Cardiovascular: [RATE AND RHYTHM — regular rate and rhythm / irregular], [MURMUR — no murmurs / DESCRIBE — systolic ejection/pansystolic/diastolic], [JVD — absent/present], no carotid bruits [or DESCRIBE]
Neurological: GCS [SCORE], cranial nerves [intact / DESCRIBE], motor [5/5 / DESCRIBE], sensation [intact / DESCRIBE], gait [steady / unsteady], no focal deficits [or DESCRIBE]
Skin: [PALLOR — absent/present], [DIAPHORESIS — absent/present], no signs of trauma [or DESCRIBE]`,
    hpi_scaffold: `Position at onset: [standing / sitting / lying / during exertion]
Prodrome: [palpitations / lightheadedness / nausea / diaphoresis / visual changes / none / no warning]
Duration of LOC: [seconds / minutes / unknown — bystander account]
Recovery: [immediate / post-ictal confusion — DURATION / headache after event]
Witnesses: [witnessed — DESCRIBE / unwitnessed]
Precipitating factors: [prolonged standing / pain or fright / cough / urination / exertion / none]
Injuries: [head strike / lacerations / other — YES/NO]
Cardiac history: [prior syncope / arrhythmia / structural heart disease / pacemaker or ICD]
Family history: [sudden cardiac death in family member < 50 — YES/NO — MUST DOCUMENT]`,
    risk_scores: ["San Francisco Syncope Rule","ROSE Rule","Canadian Syncope Risk Score","HEART Score (if chest pain associated)"],
    key_diagnostics: ["12-Lead EKG","Orthostatic Vital Signs","BMP","CBC","Troponin","BNP (if CHF suspected)","CT Head (if focal neuro signs or head trauma)"],
    acep_policy: "ACEP Clinical Policy: Critical Issues in the Evaluation and Management of Adult Patients Presenting to the ED with Syncope",
    disposition_considerations: [
      "San Francisco Syncope Rule positive → Admit: abnormal EKG, CHF history, SOB, Hct < 30%, SBP < 90",
      "Exertional syncope → High-risk, cardiac workup, admit",
      "New EKG abnormality → Admit, cardiology consult",
      "Structural heart disease suspected → Echocardiogram, admit",
      "Vasovagal with clear trigger and normal workup → Discharge with precautions",
      "Age > 60 with no clear etiology → Lower threshold to admit",
    ],
  },

  back_pain: {
    id: "back_pain",
    label: "Back Pain",
    icon: "🦴",
    color: "#3b9eff",
    category: "MSK",
    must_not_miss: [
      "Aortic Aneurysm / Dissection",
      "Spinal Epidural Abscess",
      "Cauda Equina Syndrome",
      "Vertebral Fracture (pathologic or traumatic)",
      "Spinal Cord Compression / Malignancy",
    ],
    ros_sections: ["Constitutional","Musculoskeletal","Neurological","GU","Vascular"],
    ros_template: `Constitutional: Admits back pain onset [TIME] ago, Admits/Denies fever [VALUE — if present: epidural abscess concern], Denies chills, Denies night sweats [documents against malignancy], Denies unintentional weight loss [documents against malignancy], Denies known history of malignancy [DOCUMENT — risk factor for pathologic fracture]
Musculoskeletal: Admits back pain as chief complaint, Admits/Denies mechanism of injury [DOCUMENT if present], Admits/Denies radiation [to buttocks / leg / below knee / foot — DOCUMENT distribution], Admits/Denies pain with movement, Admits/Denies prior similar episodes, Admits/Denies history of osteoporosis or prolonged steroid use
Neurological: Denies lower extremity weakness [CAUDA EQUINA RED FLAG — MUST DOCUMENT INDIVIDUALLY], Denies lower extremity numbness or tingling [CAUDA EQUINA RED FLAG — MUST DOCUMENT INDIVIDUALLY], Denies bowel dysfunction — incontinence or retention [CAUDA EQUINA RED FLAG — MUST DOCUMENT INDIVIDUALLY], Denies bladder dysfunction — retention or incontinence [CAUDA EQUINA RED FLAG — MUST DOCUMENT INDIVIDUALLY], Denies saddle anesthesia — perineal numbness [CAUDA EQUINA RED FLAG — MUST DOCUMENT INDIVIDUALLY]
GU: Denies dysuria, Denies hematuria, Denies flank pain, Denies recent UTI or urinary instrumentation
Vascular: Denies abdominal pain [documents against AAA], Denies known AAA or vascular disease, Denies pain out of proportion to examination [if present: AAA concern], Admits/Denies history of IV drug use [IVDU + fever + back pain = epidural abscess]
All other systems reviewed and negative.`,
    pe_sections: ["General","Vital Signs","Musculoskeletal / Spine","Neurological","Abdomen / Vascular","Rectal (if cauda equina suspected)"],
    pe_template: `General: Alert and oriented x3, [DISTRESS — no acute/mild/moderate/severe distress], [AMBULATION — ambulatory / unable to bear weight]
Vital Signs: HR [RATE], BP [VALUE], RR [RATE], SpO2 [VALUE]%, T [VALUE — fever/afebrile]
Musculoskeletal / Spine: [INSPECTION — no deformity / stepoff / kyphosis], [TENDERNESS — midline spinous process at LEVEL / paraspinal muscle / CVAT bilateral/unilateral], [ROM — full / limited], [SLR — negative / positive at DEGREES — reproduces radicular pain YES/NO]
Neurological: Motor — hip flexors L1-L2: [5/5 bilateral], knee extensors L3-L4: [5/5 bilateral], dorsiflexion L4-L5: [5/5 bilateral / DESCRIBE DEFICIT], plantar flexion S1-S2: [5/5 bilateral / DESCRIBE DEFICIT]. Sensation — [intact to light touch L4/L5/S1 / DESCRIBE]. Reflexes — [patellar 2+ bilateral], [Achilles 2+ bilateral], no Babinski [or DESCRIBE]
Abdomen / Vascular: [PULSATILE MASS — absent / present], [AORTIC TENDERNESS — absent/present], abdomen soft non-tender [or DESCRIBE]
Rectal (if cauda equina suspected): [RECTAL TONE — normal / decreased], [PERIANAL SENSATION — intact / decreased / absent]`,
    hpi_scaffold: `Onset: [sudden / gradual / traumatic] onset [TIME] ago — [mechanism if traumatic]
Location: [cervical / thoracic / lumbar / sacral] — [midline / left / right / bilateral]
Quality: [sharp / dull / aching / burning / stabbing]
Radiation: [no radiation / to buttock / to leg above knee / to leg below knee / to foot — left/right]
Severity: [X/10] at worst, currently [X/10]
Modifying factors: [worse with / better with — flexion / extension / sitting / standing / walking / lying]
Red flags: [fever / weight loss / cancer history / bowel or bladder changes / saddle anesthesia / IVDU / immunosuppression / prolonged steroids]`,
    risk_scores: ["Ottawa Back Pain Rules","Cauda Equina Red Flags Checklist"],
    key_diagnostics: ["Lumbar XR (if red flags)","MRI Lumbar Spine (if neuro deficits or cauda equina)","CT Abdomen/Pelvis (if AAA suspected)","UA with culture","BMP","CBC","ESR/CRP (if infection/malignancy suspected)"],
    acep_policy: "",
    disposition_considerations: [
      "Cauda equina syndrome → Emergent MRI, neurosurgery consult",
      "Spinal epidural abscess → MRI with contrast, blood cultures, empiric antibiotics",
      "AAA suspected → Bedside ultrasound, emergent vascular surgery",
      "Pathologic fracture concern → MRI spine, oncology",
      "Uncomplicated MSK back pain, no red flags → NSAIDs, muscle relaxants, PCP follow-up",
    ],
  },

  extremity_pain: {
    id: "extremity_pain",
    label: "Extremity Pain / Injury",
    icon: "🦵",
    color: "#3dffa0",
    category: "MSK",
    must_not_miss: [
      "Compartment Syndrome",
      "Open Fracture",
      "Vascular Injury / Arterial Occlusion",
      "DVT with PE Risk",
      "Septic Arthritis",
      "Necrotizing Fasciitis",
    ],
    ros_sections: ["Constitutional","Musculoskeletal","Vascular","Neurological","Dermatologic"],
    ros_template: `Constitutional: Admits extremity pain onset [TIME] ago, Admits/Denies fever [VALUE — if present with joint pain: septic arthritis concern], Denies chills
Musculoskeletal: Admits [right/left upper/lower extremity] pain as chief complaint, Admits/Denies mechanism [fall / MVA / sports / spontaneous — DOCUMENT], Admits/Denies immediate swelling, Admits/Denies deformity, Admits/Denies inability to bear weight or use limb, Admits/Denies audible pop or crack, Admits/Denies prior injury to same area
Vascular: Denies limb pallor or color change [documents against arterial occlusion — 5 Ps must be addressed], Denies pulselessness distal to injury [MUST DOCUMENT — documents against vascular injury], Denies paresthesia or numbness distal to injury [MUST DOCUMENT — documents against vascular compromise], Denies calf pain or swelling [documents against DVT], Denies recent prolonged travel or immobilization [documents against DVT]
Neurological: Denies weakness distal to injury [MUST DOCUMENT], Denies numbness or tingling [DOCUMENT distribution if present]
Dermatologic: Denies skin breakdown or open wound, Denies redness tracking proximally [documents against lymphangitis and NF], Denies bullae or skin discoloration [documents against necrotizing fasciitis], Denies warmth, Denies pain out of proportion to appearance [if present: compartment syndrome or NF concern]
All other systems reviewed and negative.`,
    pe_sections: ["General","Vital Signs","Affected Extremity","Neurovascular","Skin / Soft Tissue"],
    pe_template: `General: Alert and oriented x3, [DISTRESS — no acute/mild/moderate/severe pain distress]
Vital Signs: HR [RATE], BP [VALUE], RR [RATE], SpO2 [VALUE]%, T [VALUE]
Affected Extremity: [LOCATION — right/left upper/lower — specific bone/joint], [DEFORMITY — absent/present], [SWELLING — absent/mild/moderate/severe], [ECCHYMOSIS — absent/present], [TENDERNESS — point at LOCATION / diffuse], [ROM — full/limited], [STABILITY — stable / laxity], [WEIGHT BEARING — able/unable], [CREPITUS — absent/present]
Neurovascular: [DISTAL PULSE — 2+ / diminished / absent], [CAP REFILL — < 2 seconds / > 2 seconds], [SENSATION — intact / diminished in DISTRIBUTION], [MOTOR — extension and flexion 5/5 / DESCRIBE DEFICIT], [COMPARTMENT — soft / tense / hard — compartment syndrome concern YES/NO]
Skin / Soft Tissue: [INTEGRITY — intact / open wound — DESCRIBE], [ERYTHEMA — absent / present — extent and borders], [WARMTH — absent/present], [LYMPHANGITIS — streaking absent/present]`,
    hpi_scaffold: `Mechanism: [fall / MVA / sports / crushing / spontaneous / lifting]
Location: [specific extremity — right/left, specific bone or joint]
Immediate symptoms: [swelling / deformity / inability to use limb / audible pop]
Weight bearing / use: [able YES/NO]
Time since injury: [TIME]
Vascular concern: [limb pallor / pulselessness / paresthesia / extreme pain — YES/NO — 5 Ps]
Infection concern: [fever / spreading redness / skin breakdown]`,
    risk_scores: ["Ottawa Ankle Rules","Ottawa Knee Rules","Wells DVT Score"],
    key_diagnostics: ["XR affected extremity (minimum 2 views)","Doppler ultrasound (if DVT suspected)","CBC/CMP/CRP (if infection suspected)","Joint aspiration (if septic arthritis suspected)"],
    acep_policy: "",
    disposition_considerations: [
      "Compartment syndrome → Emergent orthopedic consult, fasciotomy",
      "Open fracture → Emergent ortho consult, IV antibiotics, tetanus",
      "Vascular injury → Vascular surgery consult emergently",
      "Septic joint → Joint aspiration, orthopedics, antibiotics",
      "Wells DVT ≥ 2 → Doppler ultrasound, anticoagulation if positive",
    ],
  },

  altered_mental_status: {
    id: "altered_mental_status",
    label: "Altered Mental Status",
    icon: "🧩",
    color: "#9b6dff",
    category: "Neuro",
    must_not_miss: [
      "Intracranial Hemorrhage / Stroke",
      "Hypoglycemia",
      "Meningitis / Encephalitis",
      "Hypertensive Emergency",
      "Toxicologic Emergency",
      "Wernicke Encephalopathy",
      "CO Poisoning",
    ],
    ros_sections: ["Constitutional","Neurological","Metabolic / Endocrine","Toxicologic","Cardiovascular"],
    ros_template: `Constitutional: Admits altered mental status — baseline mental status [MANDATORY: document prior baseline — independent/mild cognitive impairment/dementia], onset [sudden/gradual — DOCUMENT: sudden onset suggests vascular or metabolic emergency], Admits/Denies fever [VALUE — if present: meningitis, encephalitis, septic encephalopathy], Denies chills, Admits/Denies recent illness
Neurological: Admits altered mental status as chief complaint, Denies headache [documents against SAH, hypertensive emergency, mass], Denies focal weakness [documents against stroke and intracranial hemorrhage], Denies seizure activity [documents against seizure disorder], Denies loss of consciousness [DOCUMENT duration if present], Denies recent head trauma [documents against traumatic intracranial injury], Admits/Denies prior episodes, Admits/Denies history of dementia or cognitive impairment [DOCUMENT baseline]
Metabolic / Endocrine: Admits/Denies history of diabetes [MANDATORY — last glucose VALUE if known], Admits/Denies history of liver disease or alcohol use [MANDATORY — Wernicke encephalopathy risk], Admits/Denies dialysis patient, Admits/Denies thyroid disease
Toxicologic: Admits/Denies alcohol ingestion [DOCUMENT amount and timing], Admits/Denies illicit substance use [DOCUMENT type], Admits/Denies medication overdose concern [DOCUMENT medications], Admits/Denies recent new medications or changes, Admits/Denies access to medications or substances
Cardiovascular: Denies palpitations, Denies chest pain, Admits/Denies known hypertension [check BP for hypertensive emergency]
All other systems reviewed and negative.`,
    pe_sections: ["General","Vital Signs","Neurological","HEENT","Toxidrome Assessment","Skin"],
    pe_template: `General: [LEVEL OF CONSCIOUSNESS — alert / lethargic / obtunded / stuporous / comatose], [ORIENTATION — oriented to person/place/time/situation — SPECIFY], [BEHAVIOR — agitated / combative / calm / withdrawn]
Vital Signs: HR [RATE], BP [VALUE — check for hypertensive emergency], RR [RATE], SpO2 [VALUE]%, T [VALUE], POC glucose [VALUE mg/dL — MANDATORY FIRST STEP]
Neurological: GCS [SCORE — E/V/M], pupils [equal round reactive / miosis / mydriasis — size and reactivity bilaterally], cranial nerves [intact to exam / DESCRIBE DEFICIT], motor [moves all extremities symmetrically / DESCRIBE ASYMMETRY], reflexes [2+ symmetric / DESCRIBE], plantar response [downgoing / upgoing Babinski], [MENINGISMUS — nuchal rigidity absent/present], [ASTERIXIS — absent/present]
HEENT: [HEAD TRAUMA — no signs / DESCRIBE], [EYES — scleral icterus absent/present], [TONGUE — no bite marks / bite marks present], mucous membranes [moist/dry]
Toxidrome Assessment: [TOXIDROME — no clear toxidrome / sympathomimetic / opioid / anticholinergic / cholinergic / serotonin syndrome — DOCUMENT ASSESSMENT]
Skin: [DIAPHORESIS — absent/present], [JAUNDICE — absent/present], [NEEDLE MARKS — absent/present], [RASH — absent/present]`,
    hpi_scaffold: `Baseline mental status: [DESCRIBE prior baseline — independent / mild cognitive impairment / dementia]
Onset: [sudden / gradual / found down] — [TIME or last known well]
Reported by: [patient / family / EMS / bystanders — DESCRIBE what they observed]
Associated symptoms: [fever / headache / focal weakness / seizure / trauma / vomiting]
Substance history: [alcohol / drugs — AMOUNT and TIMING if known]
Medical history: [diabetes / seizure disorder / liver disease / psychiatric illness]
Environment: [found at home / found down / CO exposure concern — enclosed space / others affected]`,
    risk_scores: ["GCS Score","NIHSS (if focal deficits)","CIWA-Ar (if alcohol withdrawal)","RASS"],
    key_diagnostics: ["POC Glucose (STAT — first intervention)","Non-contrast CT Head","BMP","CBC","LFTs","Ammonia","TSH","Toxicology screen","Blood alcohol level","ABG / CO level","Thiamine before dextrose if alcohol history","LP if meningitis suspected"],
    acep_policy: "",
    disposition_considerations: [
      "Hypoglycemia → Dextrose (with thiamine if alcohol history), observe for recurrence",
      "Intracranial process on CT → Neurosurgery or neurology consult",
      "Meningitis / encephalitis suspected → Empiric antibiotics + antivirals before LP",
      "Opioid toxidrome → Naloxone, observe minimum 4-6 hours",
      "Alcohol withdrawal → CIWA protocol, benzodiazepines, thiamine, admit if severe",
      "Wernicke suspected → IV thiamine BEFORE any dextrose-containing fluids",
      "No etiology found → Admit for monitoring and further evaluation",
    ],
  },

  fever: {
    id: "fever",
    label: "Fever",
    icon: "🌡️",
    color: "#ff6b6b",
    category: "Infectious",
    must_not_miss: [
      "Septic Shock",
      "Meningitis / Encephalitis",
      "Necrotizing Fasciitis",
      "Endocarditis",
      "Malaria (if travel history)",
      "Neutropenic Fever",
    ],
    ros_sections: ["Constitutional","Pulmonary / ENT","GI","GU","Skin / Musculoskeletal","Neurological"],
    ros_template: `Constitutional: Admits fever [VALUE — MUST DOCUMENT TEMPERATURE] onset [TIME] ago, Admits/Denies chills or rigors [rigors suggest bacteremia and sepsis], Denies night sweats, Admits/Denies fatigue or malaise, Admits/Denies anorexia, travel history [MANDATORY — recent international travel destination and dates: malaria, typhoid, viral hemorrhagic fever], immunocompromised status [MANDATORY — chemotherapy/steroids/HIV/transplant/splenectomy YES/NO: neutropenic fever]
Pulmonary / ENT: Admits/Denies cough [productive/dry — sputum color], Admits/Denies dyspnea, Admits/Denies sore throat, Admits/Denies ear pain, Denies nasal congestion, Denies sinus pain
GI: Admits/Denies nausea, Admits/Denies vomiting, Admits/Denies diarrhea [FREQUENCY and character — bloody diarrhea + fever = infectious colitis concern], Denies abdominal pain, Admits/Denies RUQ pain [fever + RUQ pain = cholangitis concern — Charcot's triad]
GU: Denies dysuria [documents against UTI], Denies urinary frequency, Denies hematuria, Denies flank pain [documents against pyelonephritis], Admits/Denies vaginal discharge or pelvic pain [if applicable]
Skin / Musculoskeletal: Denies rash [DOCUMENT character if present — petechiae/purpura + fever = meningococcemia emergency], Denies joint pain or swelling, Denies wound or skin breakdown, Denies recent hospitalization or procedure, Admits/Denies IV drug use [IVDU + fever = endocarditis concern]
Neurological: Denies headache, Denies neck stiffness [documents against meningitis], Denies photophobia, Denies altered mental status, Denies focal neurological symptoms
All other systems reviewed and negative.`,
    pe_sections: ["General","Vital Signs","HEENT","Pulmonary","Abdomen","Skin","Neurological (if AMS)"],
    pe_template: `General: Alert and oriented x3 [or DESCRIBE], [DISTRESS — no acute/mild/moderate/severe distress], [APPEARANCE — ill-appearing / non-toxic / toxic appearing]
Vital Signs: HR [RATE — tachycardia], BP [VALUE — hypotension concern for sepsis], RR [RATE], SpO2 [VALUE]%, T [VALUE], qSOFA score [RR ≥22 / altered mentation / SBP ≤100 — score 0-3]
HEENT: [PHARYNX — no erythema or exudates / erythema / tonsillar exudates / peritonsillar bulging], [TYMPANIC MEMBRANES — clear bilaterally / erythematous / bulging], [SINUS TENDERNESS — absent / present], [LYMPHADENOPATHY — absent / cervical / axillary / inguinal]
Pulmonary: [BREATH SOUNDS — clear bilaterally / decreased at base / bronchial / egophony — LOCATION], no accessory muscle use [or DESCRIBE]
Abdomen: [TENDERNESS — non-tender / RUQ / suprapubic / flank — SIDE], [MURPHY'S SIGN — negative/positive], [CVA TENDERNESS — absent / present bilateral/unilateral]
Skin: [RASH — absent / petechiae / purpura / maculopapular / cellulitis — DESCRIBE location and borders], [SKIN INTEGRITY — intact / wound / IV site erythema]
Neurological (if AMS): GCS [SCORE], [MENINGISMUS — nuchal rigidity absent/present], [KERNIG/BRUDZINSKI — negative/positive]`,
    hpi_scaffold: `Fever onset: [TIME] — Maximum temperature [VALUE] at [home/ED]
Chills / rigors: [YES/NO — rigors suggest bacteremia]
Source symptoms: [cough/sputum / dysuria / diarrhea / sore throat / ear pain / skin wound / joint pain]
Travel history: [recent international travel — DESTINATION and DATES — MANDATORY]
Immunocompromised: [chemotherapy / steroids / HIV / transplant / splenectomy — MANDATORY]
Sick contacts: [YES/NO]
Recent procedures: [hospitalization / surgery / catheter / IV line / dental procedure]
Antibiotics: [recent antibiotic use — WHICH and WHEN]`,
    risk_scores: ["qSOFA Score (sepsis screening)","SOFA Score","CURB-65 (if pneumonia)","Centor Criteria (if pharyngitis)"],
    key_diagnostics: ["Blood cultures x2 (BEFORE antibiotics)","CBC with differential","BMP","LFTs","Lactate","UA with reflex culture","CXR","Procalcitonin"],
    acep_policy: "",
    disposition_considerations: [
      "Sepsis → IV access, fluids 30 mL/kg, cultures, antibiotics within 1 hour, lactate",
      "Septic shock → ICU, vasopressors, emergent antibiotics",
      "Neutropenic fever (ANC < 500) → Emergent broad-spectrum antibiotics, oncology consult, admit",
      "qSOFA ≥ 2 → Aggressive resuscitation",
      "Lactate > 2 mmol/L → Sepsis protocol, reassess after fluids",
      "Meningitis suspected → LP, empiric antibiotics + dexamethasone",
    ],
  },

  suicidal_ideation: {
    id: "suicidal_ideation",
    label: "Suicidal Ideation",
    icon: "🧠",
    color: "#9b6dff",
    category: "Psychiatric",
    must_not_miss: [
      "Active Suicidal Plan with Means",
      "Recent Attempt Requiring Medical Treatment",
      "Homicidal Ideation Toward Specific Person",
      "Acute Psychosis with Command Hallucinations",
      "Organic Cause of Psychiatric Symptoms (AMS, intoxication, metabolic)",
    ],
    ros_sections: ["Psychiatric","Neurological","Toxicologic / Substance","Constitutional","Medical"],
    ros_template: `Psychiatric: Admits suicidal ideation as chief concern — [PASSIVE: wish to be dead without plan / ACTIVE: thoughts of killing self — DOCUMENT WHICH], plan [SPECIFIC PLAN YES/NO — DESCRIBE IF YES — MANDATORY INDIVIDUAL ITEM], means [ACCESS TO MEANS — firearms/medications/other YES/NO — MANDATORY INDIVIDUAL ITEM], intent [INTENDS TO ACT YES/NO — MANDATORY INDIVIDUAL ITEM], C-SSRS score [DOCUMENT SCORE — mandatory], prior suicide attempts [NUMBER — MANDATORY, most recent — MANDATORY, method — MANDATORY, medical severity — MANDATORY], current psychiatric diagnoses [LIST], current psychiatric medications [LIST — compliance YES/NO], current outpatient psychiatric care [YES/NO]
Neurological: Admits/Denies command hallucinations [DESCRIBE — directing self-harm is high risk], Admits/Denies paranoid delusions, Admits/Denies disorganized thinking, Denies altered mental status, Denies recent head trauma
Toxicologic / Substance: Admits/Denies alcohol intoxication at time of ideation [intoxication increases lethality risk], Admits/Denies chronic alcohol or substance use [TYPE and AMOUNT], Admits/Denies medication overdose or ingestion [WHAT and HOW MUCH — medical clearance required]
Constitutional: Admits/Denies recent significant stressor [DESCRIBE], Admits/Denies recent loss [job/relationship/death], Admits/Denies hopelessness, Admits/Denies recent discharge from psychiatric hospitalization [high-risk period], support system [DOCUMENT — lives with family/alone/support available]
Medical: Admits/Denies chronic pain, Admits/Denies terminal or newly diagnosed serious illness
All other systems reviewed and negative.`,
    pe_sections: ["General","Vital Signs","Mental Status Exam","Neurological","Toxidrome","Medical Clearance"],
    pe_template: `General: [APPEARANCE — well-groomed / disheveled / appropriate], [BEHAVIOR — calm and cooperative / agitated / guarded / tearful], [EYE CONTACT — good / poor / avoidant]
Vital Signs: HR [RATE], BP [VALUE], RR [RATE], SpO2 [VALUE]%, T [VALUE], POC glucose [VALUE]
Mental Status Exam: [ORIENTATION — oriented x4 / DESCRIBE], [MOOD — patient's own words quoted], [AFFECT — congruent/incongruent/flat/restricted/labile], [THOUGHT PROCESS — linear and goal-directed / circumstantial / tangential / disorganized], [THOUGHT CONTENT — SI as described / no HI / no paranoid delusions / DESCRIBE], [PERCEPTUAL — denies hallucinations / auditory hallucinations — DESCRIBE], [INSIGHT — intact/limited/absent], [JUDGMENT — intact/impaired]
Neurological: Alert and oriented x4 [or DESCRIBE], no focal neurological deficits [or DESCRIBE]
Toxidrome: [INTOXICATION — no clinical signs / alcohol intoxication / DESCRIBE]
Medical Clearance: No acute medical issues identified [or DESCRIBE], no signs of ingestion or overdose [or DESCRIBE]`,
    hpi_scaffold: `Chief concern: [active suicidal ideation / passive SI / suicide attempt — DESCRIBE]
Onset of current SI: [how long having these thoughts]
Stressor: [identified precipitating stressor — DESCRIBE]
Plan: [specific plan YES/NO — DESCRIBE if yes — MANDATORY]
Means: [access to firearms / medications / other — YES/NO — MANDATORY]
Intent: [intends to act YES/NO — MANDATORY]
Prior attempts: [number / most recent / method / medical severity]
Current psychiatric care: [outpatient therapist / psychiatrist / current medications]
Support system: [lives with family / alone / support available]`,
    risk_scores: ["Columbia Suicide Severity Rating Scale (C-SSRS)","SAD PERSONS Scale"],
    key_diagnostics: ["POC Glucose","BMP","CBC","Urine toxicology screen","Blood alcohol level","Serum acetaminophen and salicylate levels (if ingestion suspected)","EKG (if cardiac medication ingestion)","Pregnancy test (if applicable)"],
    acep_policy: "ACEP Clinical Policy: Critical Issues in the Diagnosis and Management of the Adult Psychiatric Patient in the Emergency Department",
    disposition_considerations: [
      "Active plan + means + intent → Psychiatric hold, inpatient psychiatric admission",
      "Recent attempt requiring medical treatment → Medical stabilization first, then psychiatric evaluation",
      "Passive SI, no plan, strong outpatient support → Consider discharge with safety plan, follow-up within 24-48h",
      "Intoxicated patient → Medical clearance, repeat psychiatric evaluation when sober",
      "Command hallucinations directing self-harm → Emergent psychiatric consultation, inpatient admission",
      "C-SSRS score guides risk stratification — DOCUMENT SCORE EXPLICITLY",
      "Safety plan required: crisis line 988, emergency contact, means restriction counseling documented",
    ],
  },

  flank_pain: {
    id: "flank_pain",
    label: "Flank Pain / Renal Colic",
    icon: "⚡",
    color: "#f5c842",
    category: "GU",
    must_not_miss: [
      "Ruptured AAA",
      "Aortic Dissection (renal artery involvement)",
      "Pyelonephritis with Sepsis",
      "Ectopic Pregnancy (lower flank / pelvic)",
      "Spinal Epidural Abscess",
    ],
    ros_sections: ["Constitutional","GU","GI","Vascular","Reproductive (if applicable)"],
    ros_template: `Constitutional: Admits flank pain onset [TIME] ago, Admits/Denies fever [VALUE — MANDATORY: fever + flank pain = infected obstructing stone or pyelonephritis with sepsis until excluded], Admits/Denies chills or rigors [rigors + fever + flank pain = sepsis concern], Admits/Denies nausea, Admits/Denies vomiting
GU: Admits flank pain as chief complaint — [right/left] side, Admits/Denies gross hematuria [if present: supports renal colic, also consider tumor], Admits/Denies dysuria, Admits/Denies urinary frequency or urgency, Admits/Denies difficulty urinating or retention, prior kidney stones [YES/NO — MUST DOCUMENT: prior stone passage and prior interventions — lithotripsy/stent/ureteroscopy — affects management], Admits/Denies single kidney or renal transplant [MUST DOCUMENT — changes urgency and disposition]
GI: Admits/Denies nausea, Admits/Denies vomiting, Denies abdominal pain [documents against AAA and GI pathology], Denies diarrhea, Denies blood in stool
Vascular: Admits/Denies pain radiating to groin [classic renal colic radiation], Denies known AAA or vascular disease [documents against AAA], Denies pain out of proportion to examination [if present: AAA concern], Denies pulsatile abdominal mass history
Reproductive (if applicable): LMP [DATE — MANDATORY for reproductive-age females], Admits/Denies vaginal bleeding, Admits/Denies pelvic pain [flank/pelvic pain + pregnancy = ectopic until excluded], pregnancy test [positive/negative/unknown — MANDATORY]
All other systems reviewed and negative.`,
    pe_sections: ["General","Vital Signs","Abdomen","Genitourinary","Vascular"],
    pe_template: `General: Alert and oriented x3, [DISTRESS — writhing / unable to find comfortable position / no acute distress], [DIAPHORESIS — absent/present]
Vital Signs: HR [RATE], BP [VALUE — hypotension + flank pain = AAA until excluded], RR [RATE], SpO2 [VALUE]%, T [VALUE — fever/afebrile]
Abdomen: [DISTENSION — no/present], [TENDERNESS — non-tender / [RUQ/LUQ/RLQ/LLQ/flank — SIDE]], [REBOUND — absent/present], [GUARDING — absent/present], [CVA TENDERNESS — absent / present — right/left], [PULSATILE MASS — absent / present — if present: AAA emergency]
Genitourinary: [TESTICULAR EXAM if male — non-tender / DESCRIBE], [ADNEXAL TENDERNESS if female — absent / present — right/left]
Vascular: [AORTIC BRUITS — absent/present], [FEMORAL PULSES — 2+ bilateral / DESCRIBE], no flank ecchymosis [Grey-Turner sign absent/present]`,
    hpi_scaffold: `Onset: [sudden / gradual] onset [TIME] ago
Location: [right / left] flank — [radiation to groin / testicle / labia / none]
Quality: [colicky / constant / sharp / dull]
Severity: [X/10] — able to find comfortable position [YES/NO]
Prior kidney stones: [YES/NO — prior passage / procedures — lithotripsy/stent/ureteroscopy]
Associated: [hematuria / dysuria / frequency / fever / nausea / vomiting]
Last urination: [TIME and character]
Reproductive (if applicable): LMP [DATE], possibility of pregnancy`,
    risk_scores: ["STONE Score (ureteral stone)"],
    key_diagnostics: ["UA with microscopy","Urine culture","BMP (creatinine)","CBC","Urine or serum hCG","CT abdomen/pelvis without contrast (stone protocol)","Bedside ultrasound (hydronephrosis, AAA)"],
    acep_policy: "",
    disposition_considerations: [
      "Stone < 5mm → Medical expulsive therapy, urology follow-up",
      "Stone > 10mm → Urology consult for intervention",
      "Fever + flank pain → Infected obstructing stone — emergent urology consult, antibiotics, decompression",
      "Single kidney or transplant with obstruction → Emergent urology consult",
      "Creatinine elevation or bilateral obstruction → Urology consult, admit",
      "AAA cannot be excluded → Bedside ultrasound, CT angiography if unstable",
      "Ectopic pregnancy cannot be excluded → Pelvic ultrasound, OB/GYN consult",
    ],
  },

  general: {
    id: "general",
    label: "General",
    icon: "📋",
    color: "var(--qn-txt2)",
    category: "General",
    must_not_miss: [],
    ros_sections: [],
    ros_template: "",
    pe_sections: [],
    pe_template: "",
    hpi_scaffold: "",
    risk_scores: [],
    key_diagnostics: [],
    acep_policy: "",
    disposition_considerations: [],
  },
};

// ─── HELPER: getCCProfile ────────────────────────────────────────────────────
export function getCCProfile(ccString) {
  if (!ccString || typeof ccString !== "string") return CC_PROFILES.general;
  const normalized = ccString.toLowerCase().trim();
  if (CC_PROFILES[normalized]) return CC_PROFILES[normalized];
  const byLabel = Object.values(CC_PROFILES).find(
    (p) => p.label.toLowerCase() === normalized
  );
  if (byLabel) return byLabel;
  const fuzzyMatch = Object.values(CC_PROFILES).find((p) => {
    if (p.id === "general") return false;
    const keywords = [p.label.toLowerCase(), p.id.replace(/_/g, " "), ...p.label.toLowerCase().split(" ")];
    return keywords.some((kw) => kw.length > 3 && (normalized.includes(kw) || kw.includes(normalized)));
  });
  if (fuzzyMatch) return fuzzyMatch;
  return CC_PROFILES.general;
}

// ─── HELPER: getCCList ───────────────────────────────────────────────────────
export function getCCList() {
  const categoryOrder = ["Cardiovascular","Respiratory","GI","Neuro","MSK","GU","Psychiatric","Infectious","General"];
  return Object.values(CC_PROFILES).sort((a, b) => {
    if (a.id === "general") return 1;
    if (b.id === "general") return -1;
    const catA = categoryOrder.indexOf(a.category);
    const catB = categoryOrder.indexOf(b.category);
    if (catA !== catB) return catA - catB;
    return a.label.localeCompare(b.label);
  });
}