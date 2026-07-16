// QuickNoteCCProfiles.js
// Pure JavaScript data module — no React, no imports, no side effects
// Exports: CC_PROFILES, getCCProfile, getCCList
// 12 chief complaint profiles for Lakonyx QuickNote v14.0

export const CC_PROFILES = {

  // ─── 1. CHEST PAIN ────────────────────────────────────────────────────────
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

    ros_sections: [
      "Constitutional",
      "Cardiovascular",
      "Pulmonary",
      "GI",
      "Musculoskeletal",
      "Neurological",
    ],

    ros_template: `Constitutional: (+) chest pain onset [TIME] ago, (-) fever, (-) chills, (+/-) diaphoresis, (+/-) generalized weakness
Cardiovascular: (+) chest pain, (+/-) palpitations, (+/-) syncope or near-syncope, (+/-) orthopnea, (+/-) PND, (+/-) lower extremity edema, (-) history of similar pain
Pulmonary: (+/-) dyspnea at rest, (+/-) dyspnea on exertion, (+/-) pleuritic component, (-) hemoptysis, (-) cough
GI: (+/-) nausea, (+/-) vomiting, (+/-) heartburn or reflux symptoms, (-) abdominal pain, (-) dysphagia
Musculoskeletal: (+/-) reproducible with palpation, (+/-) pain with movement, (-) recent trauma, (-) recent prolonged immobilization
Neurological: (-) headache, (-) focal weakness, (-) syncope`,

    pe_sections: [
      "General",
      "Vital Signs",
      "Cardiovascular",
      "Pulmonary",
      "Abdomen",
      "Extremities",
    ],

    pe_template: `General: Alert and oriented x3, [DISTRESS LEVEL — no acute/mild/moderate/severe distress], [DIAPHORESIS — diaphoretic/no diaphoresis]
Vital Signs: HR [RATE] [regular/irregular], BP [VALUE] [right arm / both arms if dissection suspected], RR [RATE], SpO2 [VALUE]% on [room air/O2], T [VALUE]
Cardiovascular: [RATE AND RHYTHM — regular rate and rhythm / irregular], no murmurs [or DESCRIBE MURMUR], no rubs, no gallops, JVD [absent/present — DESCRIBE], PMI [non-displaced/displaced]
Pulmonary: Clear to auscultation bilaterally [or DESCRIBE FINDINGS — wheezing/rales/rhonchi/decreased breath sounds], no accessory muscle use [or DESCRIBE], trachea midline
Abdomen: Soft, non-tender, non-distended, no epigastric tenderness [or DESCRIBE], no pulsatile mass, bowel sounds present
Extremities: No lower extremity edema [or DESCRIBE], no calf tenderness, no unilateral swelling, distal pulses [intact bilaterally / DESCRIBE], capillary refill [less than 2 seconds / DESCRIBE]`,

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

    risk_scores: ["HEART Score", "TIMI Risk Score", "GRACE Score", "Wells PE Score"],

    key_diagnostics: ["12-Lead EKG", "Troponin (serial)", "BMP", "CBC", "CXR", "D-Dimer if PE suspected"],

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

  // ─── 2. SHORTNESS OF BREATH ───────────────────────────────────────────────
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

    ros_sections: [
      "Constitutional",
      "Cardiovascular",
      "Pulmonary",
      "Allergic / Immunologic",
      "GI",
      "Neurological",
    ],

    ros_template: `Constitutional: (+) shortness of breath onset [TIME] ago, (+/-) fever [VALUE], (+/-) chills, (+/-) fatigue, (+/-) diaphoresis
Cardiovascular: (+/-) chest pain or pressure, (+/-) palpitations, (+/-) orthopnea, (+/-) PND, (+/-) lower extremity edema, (+/-) syncope
Pulmonary: (+) dyspnea at rest, (+/-) dyspnea on exertion, (+/-) wheezing, (+/-) stridor, (+/-) cough [productive/dry], (+/-) hemoptysis, (+/-) pleuritic chest pain
Allergic / Immunologic: (+/-) known allergies, (+/-) recent new medication or food, (+/-) rash or urticaria, (+/-) lip or tongue swelling
GI: (+/-) nausea, (+/-) vomiting, (-) hematemesis
Neurological: (-) focal weakness, (-) slurred speech, (+/-) anxiety`,

    pe_sections: [
      "General",
      "Vital Signs",
      "HEENT",
      "Pulmonary",
      "Cardiovascular",
      "Extremities",
    ],

    pe_template: `General: Alert and oriented x3, [DISTRESS — in no/mild/moderate/severe respiratory distress], [POSITION — sitting upright / tripod position / supine], speaking in [full sentences / short phrases / single words]
Vital Signs: HR [RATE], BP [VALUE], RR [RATE — tachypneic/normal], SpO2 [VALUE]% on [room air / O2 at RATE L/min], T [VALUE]
HEENT: [STRIDOR — absent/present], no oropharyngeal swelling [or DESCRIBE], mucous membranes [moist/dry], no lip or tongue angioedema [or DESCRIBE], trachea midline
Pulmonary: [EFFORT — no accessory muscle use / accessory muscle use present], [BREATH SOUNDS — clear bilaterally / wheezing / rhonchi / rales / absent breath sounds — LOCATION], no dullness to percussion [or DESCRIBE — dull at base / hyperresonant], [SYMMETRY — symmetric chest rise / asymmetric]
Cardiovascular: [RATE AND RHYTHM — regular rate and rhythm / irregular], no murmurs [or DESCRIBE], JVD [absent / present], S3 [absent/present]
Extremities: [EDEMA — no lower extremity edema / bilateral pitting edema — GRADE], [CYANOSIS — no cyanosis / peripheral cyanosis / central cyanosis], capillary refill [less than 2 seconds / DESCRIBE]`,

    hpi_scaffold: `Onset: [sudden/gradual] onset [TIME] ago
Severity: Able to [speak in full sentences / walk / lie flat] — SpO2 [VALUE]% at triage
Modifying factors: [worse with exertion / at rest / supine / improved with leaning forward]
Associated: [wheezing / cough / fever / chest pain / leg swelling / palpitations / rash]
Prior episodes: [prior asthma / COPD exacerbations / CHF / PE — YES/NO]
Triggers: [recent illness / allergen exposure / missed medications / recent travel / immobilization]
Medications: [inhalers / diuretics — compliance YES/NO]`,

    risk_scores: ["CURB-65 (pneumonia)", "Wells PE Score", "PERC Rule", "BODE Index (COPD)", "BNP / NT-proBNP"],

    key_diagnostics: ["CXR", "12-Lead EKG", "BMP", "CBC", "BNP or NT-proBNP", "ABG or VBG", "D-Dimer if PE suspected", "Peak Flow (asthma/COPD)"],

    acep_policy: "ACEP Clinical Policy: Critical Issues in the Evaluation and Management of Adult Patients Presenting to the ED with Acute Heart Failure Syndromes",

    disposition_considerations: [
      "SpO2 < 92% on room air → Admit, supplemental O2, monitor",
      "Suspected PE → CT-PA, anticoagulation decision",
      "CHF exacerbation → BNP, diuresis, admit vs obs based on response",
      "Moderate-severe asthma → Bronchodilators, steroids, admit if FEV1 < 50% predicted after treatment",
      "COPD exacerbation — GOLD criteria → Steroids, bronchodilators, antibiotics if purulent sputum",
      "Anaphylaxis → Epinephrine, observe minimum 4-6 hours after resolution",
      "Pneumonia with CURB-65 ≥ 2 → Admit",
    ],
  },

  // ─── 3. ABDOMINAL PAIN ────────────────────────────────────────────────────
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

    ros_sections: [
      "Constitutional",
      "GI",
      "GU / Reproductive",
      "Cardiovascular",
      "Musculoskeletal",
    ],

    ros_template: `Constitutional: (+) abdominal pain onset [TIME] ago, (+/-) fever [VALUE], (+/-) chills, (+/-) anorexia, (+/-) fatigue
GI: (+) abdominal pain, (+/-) nausea, (+/-) vomiting [FREQUENCY], (+/-) diarrhea [FREQUENCY / character], (+/-) constipation, (+/-) last bowel movement [DATE], (+/-) blood in stool, (+/-) melena, (+/-) hematemesis, (+/-) bloating, (+/-) similar prior episodes
GU / Reproductive: (+/-) dysuria, (+/-) hematuria, (+/-) vaginal discharge or bleeding [if applicable], (+/-) LMP [DATE], (+/-) pregnancy status [known/unknown], (+/-) flank pain
Cardiovascular: (+/-) chest pain, (-) palpitations, (+/-) history of vascular disease or AAA
Musculoskeletal: (-) back pain radiating to groin [if renal colic suspected], (+/-) pulsatile abdominal mass history`,

    pe_sections: [
      "General",
      "Vital Signs",
      "Abdomen",
      "Pelvic (if indicated)",
      "Rectal (if indicated)",
      "Extremities",
    ],

    pe_template: `General: Alert and oriented x3, [DISTRESS — no acute/mild/moderate/severe distress], [POSITION — lying still / writhing / guarding]
Vital Signs: HR [RATE], BP [VALUE], RR [RATE], SpO2 [VALUE]%, T [VALUE — fever/afebrile]
Abdomen: [DISTENSION — soft/distended], [TENDERNESS — tender in RUQ/RLQ/LUQ/LLQ/epigastric/diffuse — DESCRIBE CHARACTER], [GUARDING — voluntary/involuntary/absent], [RIGIDITY — present/absent], [REBOUND — present/absent], [BOWEL SOUNDS — present/hypoactive/absent], [MASSES — no masses palpated / DESCRIBE], [MURPHY'S SIGN — positive/negative if RUQ pain], [MCBURNEY'S POINT — tender/non-tender if RLQ pain], [PSOAS/OBTURATOR SIGN — positive/negative if RLQ pain], no hernia [or DESCRIBE]
Pelvic (if indicated): [CERVICAL MOTION TENDERNESS — present/absent], [ADNEXAL TENDERNESS — present/absent — right/left/bilateral], [ADNEXAL MASS — palpated/not palpated], [CERVICAL OS — closed/open]
Rectal (if indicated): [RECTAL TENDERNESS — present/absent], [GROSS BLOOD — present/absent], [MELENA — present/absent]
Extremities: No lower extremity edema, [PERIPHERAL PULSES — present bilaterally / DESCRIBE], no pulsatile mass noted`,

    hpi_scaffold: `Onset: [sudden/gradual] onset [TIME] ago
Location: [RUQ / RLQ / LUQ / LLQ / epigastric / periumbilical / diffuse / radiating to LOCATION]
Quality: [sharp / crampy / colicky / constant / dull / burning]
Severity: [X/10] at onset, currently [X/10]
Timing: [constant / intermittent — frequency and duration of episodes]
Modifying factors: [worse with / better with — eating, movement, position, bowel movements, urination]
Associated symptoms: [nausea / vomiting / fever / diarrhea / constipation / blood in stool / dysuria / vaginal bleeding]
Reproductive history (if applicable): LMP [DATE], sexually active [Y/N], pregnancy test [positive/negative/unknown]
Prior episodes: [similar prior episodes — YES/NO, prior surgeries — APPENDECTOMY/CHOLECYSTECTOMY/OTHER]`,

    risk_scores: ["Alvarado Score (appendicitis)", "STONE Score (ureteral stone)", "CURB-65 if sepsis concern"],

    key_diagnostics: ["BMP", "CBC with differential", "Lipase", "LFTs", "UA with reflex culture", "Urine or serum hCG", "CXR (free air)", "CT abdomen/pelvis with contrast"],

    acep_policy: "ACEP Clinical Policy: Critical Issues in the Initial Evaluation and Management of Patients Presenting to the ED in Early Pregnancy",

    disposition_considerations: [
      "Positive pregnancy test with abdominal pain → Ectopic until proven otherwise, OB/GYN consult, pelvic ultrasound",
      "Peritoneal signs (guarding, rigidity, rebound) → Surgical consult immediately",
      "Suspected AAA (pulsatile mass, hypotension, back/flank pain) → Emergent vascular surgery, bedside ultrasound",
      "Alvarado Score ≥ 7 → High suspicion appendicitis, surgical consult",
      "Lipase > 3x normal → Pancreatitis, assess severity, fluid resuscitation",
      "Signs of bowel obstruction → NGT, surgical consult, serial abdominal exams",
      "Mesenteric ischemia suspected (pain out of proportion to exam, AF, vascular disease) → CT angiography, emergent surgery consult",
    ],
  },

  // ─── 4. HEADACHE ──────────────────────────────────────────────────────────
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

    ros_sections: [
      "Constitutional",
      "Neurological",
      "Head / Eyes / Ears / Nose / Throat",
      "Cardiovascular",
      "Psychiatric",
    ],

    ros_template: `Constitutional: (+) headache onset [TIME] ago, (+/-) fever [VALUE], (+/-) chills, (+/-) fatigue, (+/-) neck stiffness or pain
Neurological: (+) headache onset [TIME] ago, (+/-) photophobia, (+/-) phonophobia, (+/-) nausea, (+/-) vomiting, (+/-) vision changes [blurred/diplopia], (+/-) focal weakness or numbness, (+/-) speech difficulty, (+/-) confusion, (+/-) neck stiffness, (-) loss of consciousness, (-) seizure
HEENT: (+/-) eye pain or redness, (+/-) jaw claudication, (+/-) scalp tenderness [temporal], (+/-) sinus pain or congestion, (+/-) ear pain, (+/-) nasal discharge
Cardiovascular: (+/-) chest pain, BP at triage [VALUE], (+/-) known hypertension — history of compliance with medications
Psychiatric: (+/-) anxiety, (+/-) depression, (+/-) recent significant stressor`,

    pe_sections: [
      "General",
      "Vital Signs",
      "Neurological",
      "HEENT",
      "Meningeal Signs",
    ],

    pe_template: `General: Alert and oriented x3 [or DESCRIBE DEFICITS], [DISTRESS — no acute/mild/moderate/severe distress], [PHOTOPHOBIA — present/absent], [PHONOPHOBIA — present/absent]
Vital Signs: HR [RATE], BP [VALUE — note if hypertensive], RR [RATE], SpO2 [VALUE]%, T [VALUE — note if febrile]
Neurological: GCS [SCORE — E/V/M], cranial nerves II-XII [intact / DESCRIBE DEFICIT], motor strength [5/5 throughout / DESCRIBE DEFICIT], sensation [intact to light touch / DESCRIBE], cerebellar — finger-nose [intact / dysmetric], gait [steady / ataxic], Romberg [negative/positive], pupils [equal round reactive / DESCRIBE]
HEENT: [PAPILLEDEMA — fundoscopy performed — papilledema present/absent / not performed], [TEMPORAL ARTERY — non-tender / tender and cord-like], [SINUS TENDERNESS — absent / present over maxillary/frontal sinuses], no oropharyngeal erythema [or DESCRIBE]
Meningeal Signs: Nuchal rigidity [absent / present — degrees], Kernig sign [negative/positive], Brudzinski sign [negative/positive], Jolt accentuation [negative/positive]`,

    hpi_scaffold: `Onset: [sudden "thunderclap" / gradual] onset [TIME] ago
Location: [frontal / temporal / occipital / vertex / hemicranial / diffuse / periorbital]
Quality: [throbbing / pressure / stabbing / band-like / worst of life]
Severity: [X/10] — [worst headache of life — YES/NO]
Modifying factors: [worse with light/sound/movement/Valsalva / better with dark/quiet/sleep]
Associated symptoms: [nausea / vomiting / vision changes / neck stiffness / fever / focal neurological symptoms / rash]
Prior headache history: [migraines — YES/NO, similar to prior migraines — YES/NO, prior neuroimaging — YES/NO]
Red flags: [first or worst headache / onset with exertion or Valsalva / progressive worsening / age > 50 new onset / immunocompromised / anticoagulated]`,

    risk_scores: ["Ottawa Subarachnoid Hemorrhage Rule", "Canadian CT Head Rule", "NIHSS (if stroke suspected)"],

    key_diagnostics: ["Non-contrast CT Head", "LP (if CT negative and SAH suspected)", "BMP", "CBC", "BMP with glucose", "CRP/ESR (if GCA suspected)", "CO level (if CO poisoning suspected)"],

    acep_policy: "ACEP Clinical Policy: Critical Issues in the Evaluation and Management of Adult Patients Presenting to the ED with Acute Headache",

    disposition_considerations: [
      "Thunderclap headache → Non-contrast CT, if negative LP to evaluate for xanthochromia",
      "Ottawa SAH Rule positive → CT head mandatory",
      "Fever + headache + nuchal rigidity → Empiric antibiotics BEFORE LP if meningitis suspected",
      "Hypertensive emergency (BP > 180/120 + end organ damage) → IV antihypertensives, admit",
      "New focal neurological deficits → MRI brain, stroke protocol",
      "GCA suspected (age > 50, ESR elevated, temporal tenderness) → Steroids, ophthalmology, rheumatology",
      "First-time migraine equivalent → Diagnosis of exclusion only after imaging",
    ],
  },

  // ─── 5. SYNCOPE ───────────────────────────────────────────────────────────
  syncope: {
    id: "syncope",
    label: "Syncope / Near-Syncope",
    icon: "⚡",
    color: "#f5c842",
    category: "Cardiovascular",

    must_not_miss: [
      "STEMI / Cardiac Arrhythmia",
      "Aortic Stenosis",
      "PE",
      "Hypertrophic Cardiomyopathy",
      "Aortic Dissection",
      "Subarachnoid Hemorrhage",
    ],

    ros_sections: [
      "Constitutional",
      "Cardiovascular",
      "Neurological",
      "Pulmonary",
      "GI / Autonomic",
    ],

    ros_template: `Constitutional: (+) syncope or near-syncope episode [TIME] ago, (+/-) prodrome [palpitations/lightheadedness/diaphoresis/nausea — DESCRIBE], (+/-) prior similar episodes
Cardiovascular: (+) syncope/near-syncope, (+/-) palpitations before event, (+/-) chest pain, (+/-) exertional syncope, (+/-) known structural heart disease, (+/-) family history sudden cardiac death
Neurological: (+/-) loss of consciousness [DURATION], (+/-) post-ictal confusion, (+/-) tongue biting, (+/-) incontinence, (+/-) focal neurological symptoms, (+/-) headache after event, (+/-) prior seizure history
Pulmonary: (-) acute dyspnea, (+/-) pleuritic chest pain, (+/-) recent prolonged travel or immobilization
GI / Autonomic: (+/-) prolonged standing before event, (+/-) warm environment, (+/-) pain or fright as trigger, (+/-) nausea immediately before event, (+/-) recent dehydration or poor oral intake`,

    pe_sections: [
      "General",
      "Vital Signs (orthostatics)",
      "Cardiovascular",
      "Neurological",
      "Skin",
    ],

    pe_template: `General: Alert and oriented x3 [or DESCRIBE], [DISTRESS — no acute distress], [INJURIES — no apparent head or extremity injury / DESCRIBE any trauma]
Vital Signs: HR [RATE supine] → [RATE standing after 3 min], BP [VALUE supine] → [VALUE standing] — orthostatic [positive/negative — define: ≥20 mmHg SBP drop or ≥10 mmHg DBP drop with symptoms], SpO2 [VALUE]%, T [VALUE]
Cardiovascular: [RATE AND RHYTHM — regular rate and rhythm / irregular], [MURMUR — no murmurs / DESCRIBE — systolic ejection / pansystolic / diastolic], [JVD — absent/present], no carotid bruits [or DESCRIBE]
Neurological: GCS [SCORE], cranial nerves [intact / DESCRIBE], motor [5/5 / DESCRIBE], sensation [intact / DESCRIBE], cerebellar [intact / ataxic], gait [steady / unsteady], no focal deficits [or DESCRIBE]
Skin: [PALLOR — absent/present], [DIAPHORESIS — absent/present], no rash [or DESCRIBE], no signs of trauma to scalp [or DESCRIBE]`,

    hpi_scaffold: `Position at onset: [standing / sitting / lying / during exertion]
Prodrome: [palpitations / lightheadedness / nausea / diaphoresis / visual changes / none / no warning]
Duration of LOC: [seconds / minutes / unknown — bystander account]
Recovery: [immediate / post-ictal confusion — DURATION / headache after event]
Witnesses: [witnessed — DESCRIBE what they saw / unwitnessed]
Precipitating factors: [prolonged standing / pain or fright / cough / urination / exertion / none identified]
Injuries: [head strike / lacerations / other injuries from fall — YES/NO]
Cardiac history: [prior syncope / known arrhythmia / structural heart disease / pacemaker or ICD]
Family history: [sudden cardiac death in family member < 50 — YES/NO]`,

    risk_scores: ["San Francisco Syncope Rule", "ROSE Rule", "Canadian Syncope Risk Score", "HEART Score (if chest pain associated)"],

    key_diagnostics: ["12-Lead EKG", "Orthostatic Vital Signs", "BMP", "CBC", "Troponin", "BNP (if CHF suspected)", "CT Head (if focal neuro signs or head trauma)"],

    acep_policy: "ACEP Clinical Policy: Critical Issues in the Evaluation and Management of Adult Patients Presenting to the ED with Syncope",

    disposition_considerations: [
      "San Francisco Syncope Rule positive → Admit: abnormal EKG, CHF history, SOB, Hct < 30%, SBP < 90",
      "Exertional syncope → High-risk, cardiac workup, admit",
      "New EKG abnormality (long QT, pre-excitation, LBBB, high-grade block) → Admit, cardiology",
      "Structural heart disease suspected → Echocardiogram, admit",
      "Vasovagal syncope with clear trigger and normal workup → Discharge with precautions",
      "Orthostatic hypotension → Volume resuscitation, medication review, disposition based on response",
      "Age > 60 with no clear etiology → Lower threshold to admit or observe",
    ],
  },

  // ─── 6. BACK PAIN ─────────────────────────────────────────────────────────
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

    ros_sections: [
      "Constitutional",
      "Musculoskeletal",
      "Neurological",
      "GU",
      "Vascular",
    ],

    ros_template: `Constitutional: (+) back pain onset [TIME] ago, (+/-) fever [VALUE], (+/-) chills, (+/-) night sweats, (+/-) unintentional weight loss, (+/-) history of malignancy
Musculoskeletal: (+) back pain, (+/-) mechanism of injury [DESCRIBE], (+/-) radiation of pain [to buttocks / leg / below knee], (+/-) pain with movement, (+/-) prior similar episodes, (+/-) history of osteoporosis or steroid use
Neurological: (+/-) lower extremity weakness, (+/-) lower extremity numbness or tingling, (+/-) bowel dysfunction [incontinence / retention], (+/-) bladder dysfunction [retention / incontinence], (+/-) saddle anesthesia
GU: (+/-) dysuria, (+/-) hematuria, (+/-) flank pain, (+/-) recent UTI or instrumentation
Vascular: (+/-) abdominal pain associated, (+/-) known AAA, (+/-) history of vascular disease, (+/-) pain out of proportion to exam`,

    pe_sections: [
      "General",
      "Vital Signs",
      "Musculoskeletal / Spine",
      "Neurological",
      "Abdomen / Vascular",
      "Rectal (if cauda equina suspected)",
    ],

    pe_template: `General: Alert and oriented x3, [DISTRESS — no acute/mild/moderate/severe distress], [AMBULATION — ambulatory / unable to bear weight]
Vital Signs: HR [RATE], BP [VALUE], RR [RATE], SpO2 [VALUE]%, T [VALUE — fever/afebrile]
Musculoskeletal / Spine: [INSPECTION — no deformity / stepoff / kyphosis — DESCRIBE], [TENDERNESS — midline spinous process tenderness at LEVEL / paraspinal muscle tenderness / CVAT bilateral/unilateral], [ROM — full / limited — DESCRIBE], [SLR — negative / positive at DEGREES — reproduces radicular pain / not radicular], [SLUMP TEST — negative/positive], [FABER / FADIR — negative/positive]
Neurological: Motor — [hip flexors L1-L2: 5/5 bilateral], [knee extensors L3-L4: 5/5 bilateral], [dorsiflexion L4-L5: 5/5 bilateral / DESCRIBE DEFICIT], [plantar flexion S1-S2: 5/5 bilateral / DESCRIBE DEFICIT]. Sensation — [intact to light touch L4 medial foot / L5 dorsal foot / S1 lateral foot / DESCRIBE DEFICIT]. Reflexes — [patellar 2+ bilateral / DESCRIBE], [Achilles 2+ bilateral / DESCRIBE], no Babinski [or DESCRIBE]
Abdomen / Vascular: [PULSATILE MASS — absent / present — DESCRIBE], [AORTIC TENDERNESS — absent/present], [ABDOMINAL BRUITS — absent/present], abdomen soft non-tender [or DESCRIBE]
Rectal (if cauda equina suspected): [RECTAL TONE — normal / decreased], [PERIANAL SENSATION — intact / decreased / absent]`,

    hpi_scaffold: `Onset: [sudden / gradual / traumatic] onset [TIME] ago — [mechanism if traumatic]
Location: [cervical / thoracic / lumbar / sacral] — [midline / left / right / bilateral]
Quality: [sharp / dull / aching / burning / stabbing]
Radiation: [no radiation / to buttock / to leg — above knee / below knee / foot — left/right]
Severity: [X/10] at worst, currently [X/10]
Modifying factors: [worse with / better with — flexion / extension / sitting / standing / walking / lying]
Red flags: [fever / unintentional weight loss / cancer history / bowel or bladder changes / saddle anesthesia / IV drug use / immunosuppression / recent procedure / prolonged steroid use]`,

    risk_scores: ["Ottawa Back Pain Rules", "Cauda Equina Red Flags Checklist", "Waddell Signs (non-organic)"],

    key_diagnostics: ["Lumbar XR (if red flags)", "MRI Lumbar Spine (if neuro deficits or cauda equina)", "CT Abdomen/Pelvis (if AAA suspected)", "UA with culture", "BMP", "CBC with differential", "ESR/CRP (if infection/malignancy suspected)"],

    acep_policy: "",

    disposition_considerations: [
      "Cauda equina syndrome (saddle anesthesia, bowel/bladder dysfunction, bilateral leg weakness) → Emergent MRI, neurosurgery consult",
      "Spinal epidural abscess (fever + back pain + neuro deficits or IVDU) → MRI with contrast, ID + neurosurgery consult, blood cultures, empiric antibiotics",
      "AAA suspected → Bedside ultrasound, emergent vascular surgery",
      "Vertebral fracture with neuro compromise → Neurosurgery consult, strict immobilization",
      "Pathologic fracture concern (cancer history, night pain) → MRI spine, oncology",
      "Uncomplicated musculoskeletal back pain, no red flags → NSAIDs, muscle relaxants, activity as tolerated, PCP follow-up",
    ],
  },

  // ─── 7. EXTREMITY PAIN ────────────────────────────────────────────────────
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

    ros_sections: [
      "Constitutional",
      "Musculoskeletal",
      "Vascular",
      "Neurological",
      "Dermatologic",
    ],

    ros_template: `Constitutional: (+) extremity pain onset [TIME] ago, (+/-) fever [VALUE], (+/-) chills, (+/-) night sweats
Musculoskeletal: (+) extremity pain, (+/-) mechanism of injury [fall / MVA / sports / spontaneous / other], (+/-) immediate swelling, (+/-) deformity noted, (+/-) inability to bear weight or use limb, (+/-) joint locking or instability, (+/-) prior injury to same area
Vascular: (+/-) calf pain or swelling, (+/-) recent prolonged travel or immobilization, (+/-) known coagulopathy or clotting disorder, (+/-) pallor or color change of extremity, (+/-) pulselessness [5 Ps — Pain/Pallor/Paresthesia/Pulselessness/Paralysis]
Neurological: (+/-) numbness or tingling [location — distribution], (+/-) weakness distal to injury
Dermatologic: (+/-) skin breakdown or wound, (+/-) redness tracking proximally, (+/-) bullae or skin discoloration, (+/-) warmth`,

    pe_sections: [
      "General",
      "Vital Signs",
      "Affected Extremity",
      "Neurovascular",
      "Skin / Soft Tissue",
    ],

    pe_template: `General: Alert and oriented x3, [DISTRESS — no acute/mild/moderate/severe pain distress]
Vital Signs: HR [RATE], BP [VALUE], RR [RATE], SpO2 [VALUE]%, T [VALUE]
Affected Extremity: [LOCATION — right/left upper/lower extremity — specific bone/joint], [DEFORMITY — absent/present — DESCRIBE], [SWELLING — absent/mild/moderate/severe], [ECCHYMOSIS — absent/present — location], [TENDERNESS — point tenderness at LOCATION / diffuse], [RANGE OF MOTION — full/limited — DESCRIBE], [STABILITY — stable / laxity noted on DESCRIBE testing], [WEIGHT BEARING — able/unable], [CREPITUS — absent/present]
Neurovascular: [DISTAL PULSE — [radial/ulnar/dorsalis pedis/posterior tibial] — 2+ / diminished / absent], [CAPILLARY REFILL — < 2 seconds / > 2 seconds], [SENSATION — intact to light touch distal to injury / diminished in DISTRIBUTION], [MOTOR — [finger/wrist/toe/ankle] extension and flexion [5/5 / DESCRIBE DEFICIT]], [COMPARTMENT PRESSURE — soft / tense / hard — clinical concern for compartment syndrome YES/NO]
Skin / Soft Tissue: [SKIN INTEGRITY — intact / open wound — DESCRIBE size and contamination], [ERYTHEMA — absent / present — extent and borders], [WARMTH — absent/present], [FLUCTUANCE — absent/present], [LYMPHANGITIS — streaking absent/present]`,

    hpi_scaffold: `Mechanism: [fall / MVA / sports / crushing / spontaneous / lifting]
Location: [specific extremity — right/left, specific bone or joint]
Immediate symptoms: [immediate swelling / deformity / inability to use limb / audible pop or crack]
Weight bearing / use: [able to bear weight / use limb — YES/NO]
Time since injury: [TIME]
Prior treatment: [ice / splint / elevation — YES/NO]
Vascular concern: [limb pallor / pulselessness / paresthesia / extreme pain — YES/NO — any of the 5 Ps]
Infection concern: [fever / warmth / redness spreading / skin breakdown]`,

    risk_scores: ["Ottawa Ankle Rules", "Ottawa Knee Rules", "Wells DVT Score", "Nexus Criteria (if cervical spine)"],

    key_diagnostics: ["XR affected extremity (minimum 2 views)", "CXR (if rib fracture)", "CT if complex fracture or occult fracture suspected", "Doppler ultrasound (if DVT suspected)", "CBC/CMP/CRP (if infection suspected)", "Blood cultures (if septic arthritis suspected)", "Joint aspiration (if septic arthritis suspected)"],

    acep_policy: "",

    disposition_considerations: [
      "Compartment syndrome (tense compartment, pain with passive stretch, neuro deficit) → Emergent orthopedic consult, fasciotomy",
      "Open fracture → Emergent orthopedic consult, IV antibiotics, tetanus",
      "Vascular injury (diminished pulse, ischemia) → Vascular surgery consult emergently",
      "Septic joint (fever, joint effusion, inability to bear weight) → Joint aspiration, orthopedics, antibiotics",
      "Wells DVT score ≥ 2 → Doppler ultrasound, anticoagulation if positive",
      "Displaced fractures requiring reduction → Reduction, splinting, orthopedic follow-up",
      "Stable fractures → Splint, non-weight bearing if lower extremity, orthopedic outpatient follow-up",
    ],
  },

  // ─── 8. ALTERED MENTAL STATUS ─────────────────────────────────────────────
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

    ros_sections: [
      "Constitutional",
      "Neurological",
      "Metabolic / Endocrine",
      "Toxicologic",
      "Cardiovascular",
      "Psychiatric",
    ],

    ros_template: `Constitutional: (+) altered mental status — onset [sudden/gradual] [TIME] ago, (+/-) fever [VALUE], (+/-) chills, (+/-) recent illness
Neurological: (+) altered mental status, (+/-) headache, (+/-) focal weakness, (+/-) seizure activity witnessed, (+/-) loss of consciousness, (+/-) prior similar episodes, (+/-) recent head trauma, (+/-) history of dementia or baseline cognitive impairment [DESCRIBE BASELINE]
Metabolic / Endocrine: (+/-) history of diabetes — last glucose check [VALUE], (+/-) history of liver disease or alcohol use, (+/-) thyroid disease, (+/-) adrenal insufficiency, (+/-) uremia — dialysis patient
Toxicologic: (+/-) alcohol ingestion [amount and timing], (+/-) illicit substance use [TYPE], (+/-) medication overdose [WHICH MEDICATIONS], (+/-) new medications, (+/-) medication changes, (+/-) access to substances
Cardiovascular: (+/-) palpitations, (+/-) chest pain, (+/-) history of cardiac arrhythmia, (+/-) hypotension at home
Psychiatric: (+/-) known psychiatric history [DIAGNOSES], (+/-) prior psychiatric hospitalizations, (+/-) current psychiatric medications`,

    pe_sections: [
      "General",
      "Vital Signs",
      "Neurological",
      "HEENT",
      "Toxidrome Assessment",
      "Skin",
    ],

    pe_template: `General: [LEVEL OF CONSCIOUSNESS — alert / lethargic / obtunded / stuporous / comatose], [ORIENTATION — oriented to person/place/time/situation — SPECIFY], [BEHAVIOR — agitated / combative / calm / withdrawn]
Vital Signs: HR [RATE], BP [VALUE], RR [RATE], SpO2 [VALUE]%, T [VALUE], POC glucose [VALUE mg/dL]
Neurological: GCS [SCORE — E/V/M], pupils [equal round reactive / miosis / mydriasis — DESCRIBE size and reactivity], cranial nerves [intact to exam / DESCRIBE DEFICIT], motor [moves all extremities / DESCRIBE ASYMMETRY], sensation [unable to formally assess / DESCRIBE], reflexes [2+ symmetric / DESCRIBE], plantar response [downgoing / upgoing Babinski], [MENINGISMUS — nuchal rigidity absent/present], [ASTERIXIS — absent/present]
HEENT: [HEAD TRAUMA — no signs of trauma / DESCRIBE laceration or hematoma], [EYES — scleral icterus absent/present], [TONGUE — no bite marks / bite marks present], [OROPHARYNX — no foreign body], mucous membranes [moist/dry]
Toxidrome Assessment: [TOXIDROME — no clear toxidrome / sympathomimetic: tachycardia+hypertension+diaphoresis+mydriasis / opioid: bradypnea+miosis / anticholinergic: dry+flushed+mydriasis+tachycardia / cholinergic: SLUDGE+miosis / serotonin syndrome: clonus+diaphoresis+hyperthermia]
Skin: [DIAPHORESIS — absent/present], [JAUNDICE — absent/present], [NEEDLE MARKS — absent/present], [RASH — absent/present — DESCRIBE]`,

    hpi_scaffold: `Baseline mental status: [DESCRIBE prior baseline — independent / mild cognitive impairment / dementia]
Onset: [sudden / gradual / found down] — [TIME or last known well]
Reported by: [patient / family / EMS / bystanders — DESCRIBE what they observed]
Associated symptoms: [fever / headache / focal weakness / seizure / trauma / vomiting]
Substance history: [alcohol / drugs — AMOUNT and TIMING if known]
Medication history: [recent changes / new medications / missed doses / overdose concern]
Medical history: [diabetes / seizure disorder / liver disease / psychiatric illness / prior similar episodes]
Environment: [found at home / found down / CO exposure concern — enclosed space]`,

    risk_scores: ["GCS Score", "NIHSS (if focal deficits)", "CIWA-Ar (if alcohol withdrawal)", "RASS (Richmond Agitation-Sedation Scale)"],

    key_diagnostics: ["POC Glucose (STAT)", "Non-contrast CT Head", "BMP", "CBC", "LFTs", "Ammonia", "TSH", "Toxicology screen (urine and serum)", "Blood alcohol level", "ABG / CO level", "Thiamine before dextrose if alcohol use", "LP if meningitis suspected"],

    acep_policy: "",

    disposition_considerations: [
      "Hypoglycemia → Dextrose (with thiamine if alcohol history), observe for recurrence",
      "Intracranial process on CT → Neurosurgery or neurology consult",
      "Meningitis / encephalitis suspected → Empiric antibiotics + antivirals before LP",
      "Opioid toxidrome → Naloxone, observe minimum 4-6 hours",
      "Alcohol withdrawal → CIWA protocol, benzodiazepines, thiamine, admit if severe",
      "Wernicke suspected → IV thiamine before any dextrose-containing fluids",
      "No etiology found after workup → Admit for monitoring and further evaluation",
    ],
  },

  // ─── 9. FEVER ─────────────────────────────────────────────────────────────
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

    ros_sections: [
      "Constitutional",
      "Pulmonary / ENT",
      "GI",
      "GU",
      "Skin / Musculoskeletal",
      "Neurological",
    ],

    ros_template: `Constitutional: (+) fever [VALUE] onset [TIME] ago, (+/-) chills / rigors, (+/-) night sweats, (+/-) fatigue, (+/-) malaise, (+/-) anorexia, (+/-) unintentional weight loss
Pulmonary / ENT: (+/-) cough [productive/dry], (+/-) sputum [color], (+/-) dyspnea, (+/-) sore throat, (+/-) ear pain, (+/-) nasal congestion or discharge, (+/-) sinus pain
GI: (+/-) nausea, (+/-) vomiting, (+/-) diarrhea [FREQUENCY / bloody], (+/-) abdominal pain, (+/-) RUQ pain [cholangitis], (+/-) recent antibiotic use [C diff risk]
GU: (+/-) dysuria, (+/-) urinary frequency, (+/-) hematuria, (+/-) flank pain, (+/-) vaginal discharge or pelvic pain [if applicable]
Skin / Musculoskeletal: (+/-) rash [DESCRIBE location and character], (+/-) joint pain or swelling, (+/-) wound or skin breakdown, (+/-) recent procedure or hospitalization
Neurological: (+/-) headache, (+/-) neck stiffness, (+/-) photophobia, (+/-) altered mental status, (+/-) focal neurological symptoms`,

    pe_sections: [
      "General",
      "Vital Signs",
      "HEENT",
      "Pulmonary",
      "Abdomen",
      "Skin",
      "Neurological (if AMS)",
    ],

    pe_template: `General: Alert and oriented x3 [or DESCRIBE], [DISTRESS — no acute/mild/moderate/severe distress], [APPEARANCE — ill-appearing / non-toxic appearing / toxic appearing]
Vital Signs: HR [RATE — tachycardia], BP [VALUE — hypotension concern], RR [RATE], SpO2 [VALUE]%, T [VALUE — note degree of fever], SOFA / qSOFA: [score]
HEENT: [PHARYNX — no erythema or exudates / erythema present / tonsillar exudates / peritonsillar bulging], [TYMPANIC MEMBRANES — clear bilaterally / erythematous / bulging — side], [SINUSES — non-tender / tender over maxillary/frontal sinuses], [LYMPHADENOPATHY — absent / cervical / axillary / inguinal — DESCRIBE]
Pulmonary: [BREATH SOUNDS — clear bilaterally / decreased at base / bronchial breath sounds / egophony — LOCATION], no accessory muscle use [or DESCRIBE]
Abdomen: [TENDERNESS — non-tender / RUQ / RLQ / LUQ / LLQ / epigastric / suprapubic], [MURPHY'S SIGN — negative/positive], [CVA TENDERNESS — absent / present bilateral/unilateral], no peritoneal signs [or DESCRIBE]
Skin: [RASH — absent / petechiae / purpura / maculopapular / erythroderma / cellulitis — DESCRIBE location and borders], [SKIN INTEGRITY — intact / wound / IV site erythema], [DIAPHORESIS — absent/present]
Neurological (if AMS): GCS [SCORE], [MENINGISMUS — nuchal rigidity absent/present], [KERNIG/BRUDZINSKI — negative/positive]`,

    hpi_scaffold: `Fever onset: [TIME] — Maximum temperature [VALUE] at [home/ED]
Chills / rigors: [YES/NO]
Source symptoms: [cough/sputum / dysuria / diarrhea / sore throat / ear pain / skin wound / joint pain — DESCRIBE]
Travel history: [recent international travel — DESTINATION and DATES]
Sick contacts: [YES/NO — DESCRIBE]
Immunocompromised: [chemotherapy / steroids / HIV / transplant / splenectomy — YES/NO]
Recent procedures: [hospitalization / surgery / catheter / IV line / dental procedure — YES/NO]
Antibiotics: [recent antibiotic use — WHICH and WHEN]`,

    risk_scores: ["qSOFA Score (sepsis)", "SOFA Score", "CURB-65 (if pneumonia)", "Centor Criteria (if pharyngitis)"],

    key_diagnostics: ["Blood cultures x2 (before antibiotics)", "CBC with differential", "BMP", "LFTs", "Lactate", "UA with reflex culture", "CXR", "Procalcitonin", "Blood cultures x2", "Respiratory viral panel (if URI symptoms)", "LP (if meningitis suspected)"],

    acep_policy: "",

    disposition_considerations: [
      "Sepsis (infection + 2 SIRS criteria) → IV access, fluids 30 mL/kg, blood cultures, antibiotics within 1 hour, lactate",
      "Septic shock (sepsis + persistent hypotension despite fluids) → ICU, vasopressors, emergent antibiotics",
      "Neutropenic fever (ANC < 500) → Emergent broad-spectrum antibiotics, oncology consult, admit",
      "qSOFA ≥ 2 → High risk for organ dysfunction, aggressive resuscitation",
      "Lactate > 2 mmol/L → Sepsis protocol, reassess after fluids",
      "Source identified and low risk → Targeted antibiotics, may consider discharge if non-toxic and reliable follow-up",
      "Meningitis suspected → LP, empiric antibiotics + dexamethasone before imaging if no contraindications",
    ],
  },

  // ─── 10. SUICIDAL IDEATION ────────────────────────────────────────────────
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

    ros_sections: [
      "Psychiatric",
      "Neurological",
      "Toxicologic / Substance",
      "Constitutional",
      "Medical",
    ],

    ros_template: `Psychiatric: (+) suicidal ideation — [passive: wish to be dead / active: thoughts of killing self], [PLAN — specific plan / no specific plan — DESCRIBE if plan present], [MEANS — access to [firearms / medications / other] — YES/NO], [INTENT — intends to act / no current intent], prior suicide attempts [NUMBER, MOST RECENT, METHOD], current psychiatric diagnoses [DIAGNOSES], current psychiatric medications [MEDICATIONS — compliance YES/NO]
Neurological: (+/-) command hallucinations [DESCRIBE], (+/-) paranoid delusions, (+/-) disorganized thinking, (+/-) altered mental status, (+/-) recent head trauma
Toxicologic / Substance: (+/-) alcohol intoxication at time of ideation, (+/-) current alcohol or substance use [TYPE and AMOUNT], (+/-) substance use as chronic issue, (+/-) medication overdose or ingestion [WHAT and HOW MUCH]
Constitutional: (+/-) recent significant stressor [DESCRIBE], (+/-) recent loss [job / relationship / death in family], (+/-) hopelessness about the future, (+/-) recent discharge from psychiatric hospitalization
Medical: (+/-) chronic pain, (+/-) terminal illness, (+/-) recent diagnosis of serious medical condition`,

    pe_sections: [
      "General",
      "Vital Signs",
      "Mental Status Exam",
      "Neurological",
      "Toxidrome",
      "Medical Clearance",
    ],

    pe_template: `General: [APPEARANCE — well-groomed / disheveled / appropriate], [BEHAVIOR — calm and cooperative / agitated / guarded / tearful], [EYE CONTACT — good / poor / avoidant]
Vital Signs: HR [RATE], BP [VALUE], RR [RATE], SpO2 [VALUE]%, T [VALUE], POC glucose [VALUE]
Mental Status Exam: [ORIENTATION — oriented x4 / DESCRIBE], [MOOD — depressed / anxious / irritable / euthymic — patient's own words: "], [AFFECT — congruent / incongruent / flat / restricted / labile], [THOUGHT PROCESS — linear and goal-directed / circumstantial / tangential / disorganized], [THOUGHT CONTENT — suicidal ideation as described above / no homicidal ideation / no paranoid delusions / DESCRIBE if present], [PERCEPTUAL DISTURBANCES — denies hallucinations / reports auditory hallucinations — DESCRIBE], [INSIGHT — intact / limited / absent], [JUDGMENT — intact / impaired]
Neurological: Alert and oriented x4 [or DESCRIBE], no focal neurological deficits [or DESCRIBE], gait [steady / ataxic / not assessed]
Toxidrome: [INTOXICATION — no clinical signs of intoxication / alcohol intoxication / DESCRIBE], [WITHDRAWAL — no signs of withdrawal / DESCRIBE]
Medical Clearance: No acute medical issues identified [or DESCRIBE], no signs of ingestion or overdose [or DESCRIBE injury or ingestion findings]`,

    hpi_scaffold: `Chief concern: [active suicidal ideation / passive SI / suicide attempt — DESCRIBE]
Onset of current SI: [how long having these thoughts]
Stressor: [identified precipitating stressor — DESCRIBE]
Plan: [specific plan — YES/NO — DESCRIBE if yes]
Means: [access to firearms / medications / other — YES/NO]
Intent: [intends to act — YES/NO]
Prior attempts: [number of prior attempts, most recent, method, medical severity]
Current psychiatric care: [outpatient therapist / psychiatrist / current medications]
Support system: [lives with family / alone / support available]
Reason for coming to ED: [brought by family / self-presented / EMS / law enforcement]`,

    risk_scores: ["Columbia Suicide Severity Rating Scale (C-SSRS)", "SAD PERSONS Scale", "Beck Scale for Suicide Ideation"],

    key_diagnostics: ["POC Glucose", "BMP", "CBC", "Urine toxicology screen", "Blood alcohol level", "Serum acetaminophen and salicylate levels (if ingestion suspected)", "EKG (if ingestion of cardiac medication suspected)", "Pregnancy test (if applicable)"],

    acep_policy: "ACEP Clinical Policy: Critical Issues in the Diagnosis and Management of the Adult Psychiatric Patient in the Emergency Department",

    disposition_considerations: [
      "Active plan + means + intent → Psychiatric hold, inpatient psychiatric admission",
      "Recent attempt requiring medical treatment → Medical stabilization first, then psychiatric evaluation",
      "Passive SI with chronic ideation, no plan, strong outpatient support → Consider discharge with safety plan, close follow-up within 24-48h",
      "Intoxicated patient → Medical clearance and repeat psychiatric evaluation when sober",
      "Command hallucinations directing self-harm → Emergent psychiatric consultation, inpatient admission",
      "C-SSRS score guides risk stratification — document score explicitly",
      "Safety plan required for any discharge: crisis line 988, emergency contact, means restriction counseling documented",
    ],
  },

  // ─── 11. FLANK PAIN ───────────────────────────────────────────────────────
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

    ros_sections: [
      "Constitutional",
      "GU",
      "GI",
      "Vascular",
      "Reproductive (if applicable)",
    ],

    ros_template: `Constitutional: (+) flank pain onset [TIME] ago, (+/-) fever [VALUE], (+/-) chills / rigors, (+/-) nausea, (+/-) vomiting, (+/-) malaise
GU: (+) flank pain, (+/-) hematuria [gross / microscopic], (+/-) dysuria, (+/-) urinary frequency or urgency, (+/-) difficulty urinating, (+/-) prior kidney stones [YES/NO — prior episodes similar to this / prior stone passage or procedures], (+/-) known kidney stone history, (+/-) single kidney or renal transplant
GI: (+/-) nausea, (+/-) vomiting, (+/-) abdominal pain, (-) diarrhea, (-) blood in stool
Vascular: (+/-) pain radiating to groin, (+/-) known AAA or vascular disease, (+/-) pain out of proportion to exam, (+/-) pulsatile abdominal mass history
Reproductive (if applicable): LMP [DATE], (+/-) vaginal bleeding, (+/-) pelvic pain, (+/-) possibility of pregnancy`,

    pe_sections: [
      "General",
      "Vital Signs",
      "Abdomen",
      "Genitourinary",
      "Vascular",
    ],

    pe_template: `General: Alert and oriented x3, [DISTRESS — no acute / mild / moderate / severe — writhing / unable to find comfortable position], [DIAPHORESIS — absent/present]
Vital Signs: HR [RATE], BP [VALUE — note for AAA or sepsis concern], RR [RATE], SpO2 [VALUE]%, T [VALUE — fever/afebrile]
Abdomen: [INSPECTION — no distension / distended], [TENDERNESS — non-tender / tenderness in [RUQ/LUQ/RLQ/LLQ/flank — SIDE]], [REBOUND — absent/present], [GUARDING — absent/present], [BOWEL SOUNDS — normal/hypoactive/absent], [CVA TENDERNESS — absent / present — right/left], [PULSATILE MASS — absent / present — DESCRIBE]
Genitourinary: [TESTICULAR EXAM if male — non-tender, no swelling, no high-riding testicle / DESCRIBE], [ADNEXAL TENDERNESS if female — absent / present — right/left], [CERVICAL MOTION TENDERNESS if female — absent/present]
Vascular: [AORTIC BRUITS — absent/present], [FEMORAL PULSES — 2+ bilateral / DESCRIBE], no flank ecchymosis [Grey-Turner / Cullen signs — absent/present]`,

    hpi_scaffold: `Onset: [sudden / gradual] onset [TIME] ago
Location: [right / left] flank — [radiation to groin / testicle / labia / none]
Quality: [colicky / constant / sharp / dull]
Severity: [X/10] — able to find comfortable position [YES/NO]
Prior kidney stones: [YES/NO — prior stone passage, any procedures — lithotripsy / stent / ureteroscopy]
Associated: [hematuria / dysuria / frequency / fever / nausea / vomiting]
Fever: [YES/NO — temperature if known]
Last urination: [TIME and character]
Reproductive: [LMP / possibility of pregnancy if applicable]`,

    risk_scores: ["STONE Score (ureteral stone)", "STONE Score (risk of 30-day serious adverse event)"],

    key_diagnostics: ["UA with microscopy", "Urine culture", "BMP (creatinine for hydronephrosis risk)", "CBC", "Urine or serum hCG", "CT abdomen/pelvis without contrast (stone protocol)", "Bedside ultrasound (hydronephrosis, AAA)"],

    acep_policy: "",

    disposition_considerations: [
      "Stone < 5mm → High likelihood of spontaneous passage, medical expulsive therapy (tamsulosin), urology follow-up, discharge if pain controlled and no fever",
      "Stone > 10mm → Less likely to pass spontaneously, urology consult for intervention",
      "Fever + flank pain → Infected obstructing stone — emergent urology consult, antibiotics, decompression",
      "Single kidney or transplant kidney with obstruction → Emergent urology consult",
      "Creatinine elevation or bilateral obstruction → Urology consult, admit",
      "AAA cannot be excluded → Bedside ultrasound, CT angiography if unstable",
      "Ectopic pregnancy cannot be excluded → Pelvic ultrasound, OB/GYN consult",
    ],
  },

  // ─── 12. GENERAL (FREE TEXT FALLBACK) ────────────────────────────────────
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

// ─── HELPER: getCCProfile ──────────────────────────────────────────────────
// Takes a free-text CC string, returns the best matching profile.
// Falls back to "general" if no match found.
export function getCCProfile(ccString) {
  if (!ccString || typeof ccString !== "string") return CC_PROFILES.general;

  const normalized = ccString.toLowerCase().trim();

  // Direct id match
  if (CC_PROFILES[normalized]) return CC_PROFILES[normalized];

  // Search by label
  const byLabel = Object.values(CC_PROFILES).find(
    (p) => p.label.toLowerCase() === normalized
  );
  if (byLabel) return byLabel;

  // Fuzzy: check if the CC string contains any profile label or id keyword
  const fuzzyMatch = Object.values(CC_PROFILES).find((p) => {
    if (p.id === "general") return false;
    const keywords = [
      p.label.toLowerCase(),
      p.id.replace(/_/g, " "),
      ...p.label.toLowerCase().split(" "),
    ];
    return keywords.some(
      (kw) => kw.length > 3 && (normalized.includes(kw) || kw.includes(normalized))
    );
  });
  if (fuzzyMatch) return fuzzyMatch;

  // No match — return general
  return CC_PROFILES.general;
}

// ─── HELPER: getCCList ────────────────────────────────────────────────────
// Returns all profiles as an array, sorted by category then label.
// "General" always appears last.
export function getCCList() {
  const categoryOrder = [
    "Cardiovascular",
    "Respiratory",
    "GI",
    "Neuro",
    "MSK",
    "GU",
    "Psychiatric",
    "Infectious",
    "General",
  ];

  return Object.values(CC_PROFILES).sort((a, b) => {
    if (a.id === "general") return 1;
    if (b.id === "general") return -1;
    const catA = categoryOrder.indexOf(a.category);
    const catB = categoryOrder.indexOf(b.category);
    if (catA !== catB) return catA - catB;
    return a.label.localeCompare(b.label);
  });
}